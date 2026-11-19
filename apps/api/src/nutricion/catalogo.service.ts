import { Inject, Injectable } from '@nestjs/common';
import {
  CrearElementoDeCatalogoRequestSchema,
  GRUPO_API,
  GRUPO_EN_LA_BASE,
  nivelDeOrigen,
  type AlimentoConsultado,
  type AlimentoVerificado,
  type ElementoDeCatalogo,
  type ElementoEncontrado,
  type ElementoResuelto,
  type EquivalenteVerificado,
  type FuenteExternaDeAlimento,
  type GrupoDeAlimento,
  type GrupoDeAlimentoEnLaBase,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import type { ContextoDeSolicitud } from '../http/contexto';
import { buscarEnCatalogo, CORRESPONDENCIA, leerBusqueda, leerCursorDeBusqueda, origenEnElBuscador, type ConNombreAlternativo, type ConOrigenEnLaBase } from '../http/busqueda';
import { leerConsultaDeLista } from '../http/paginacion';
import { ALIMENTO_DE_UN_ITEM_EXTERNO } from '../integraciones/item-externo';
import { ofreceDemostracion, sinLoDeDemostracion } from '../plataforma/catalogo-de-demostracion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { exigirProfesionalDeNutricion as exigirNutricion } from './profesional-de-nutricion';

type Cliente = Prisma.TransactionClient | PrismaService;

interface FilaDeCatalogo {
  elementoId: string;
  versionId: string;
  nombre: string;
  composicion: ElementoDeCatalogo['composition'];
  disponible: boolean;
  procedencia: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  momentoDeRegistro: Date;
  /**
   * De dónde vino un alimento importado (WP-08; RF-060) o sembrado de una fuente de referencia (USDA, DL-119). Vive en la
   * procedencia de su versión.
   */
  fuenteExterna: FuenteExternaDeAlimento | null;
}

/** DL-180: lo que la fila del buscador suma para el grupo, el nivel del origen y la revisión de Administración. */
interface ConRevision {
  /** No se llama `grupo`: el buscador ya usa ese nombre para el grupo de coincidencia. */
  grupoDeAlimento: GrupoDeAlimentoEnLaBase | null;
  certificado: boolean;
  fuenteCertificada: string | null;
  momentoDeCertificacion: Date | null;
  equivalenteId: string | null;
}

type FilaDelBuscador = FilaDeCatalogo & ConOrigenEnLaBase & ConRevision;

/**
 * DL-180 (NUA-03, NUA-D05; segundo tramo, NUA-D14 a D16): el alimento `e` cargado a mano que su autor comparte **ahora**
 * con los demás profesionales de Nutrición: el último de sus cambios de compartido comparte (sin cambios, no se comparte).
 * La consulta tiene que llamar `e` al elemento. También acota lo que revisa Administración (API-ALI-05 y 06): lo que su
 * autor no comparte no lo ve nadie más.
 */
export const ALIMENTO_COMPARTIDO = Prisma.sql`COALESCE((SELECT k."compartido" FROM "cambio_de_alimento_compartido" k WHERE k."elemento_id" = e."id" ORDER BY k."numero" DESC LIMIT 1), FALSE)`;

/** NUA-D15: su autor lo compartió y después lo dejó de compartir (el último cambio no comparte). Usa `e`. */
export const DEJADO_DE_COMPARTIR = Prisma.sql`COALESCE((SELECT NOT k."compartido" FROM "cambio_de_alimento_compartido" k WHERE k."elemento_id" = e."id" ORDER BY k."numero" DESC LIMIT 1), FALSE)`;

/** El alimento `e` lo cargó a mano otro profesional: lo que se puede dejar de compartir. */
const AJENO_CARGADO_A_MANO = (profesionalId: string): Prisma.Sql => Prisma.sql`(e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" IS DISTINCT FROM ${profesionalId}::uuid)`;

/**
 * Los alimentos `e` que ve un profesional: lo sembrado por una migración (sin profesional que lo cargue), lo importado de
 * Open Food Facts, que es de todos (DL-141 D-1), lo propio y, desde DL-180, lo que otro profesional cargó a mano y
 * compartió (NUA-03: se ve como «De otro profesional», con su nombre y sus valores, nunca con datos de sus personas). La
 * consulta tiene que llamar `e` al elemento.
 * UF-09 (DL-169): fuera de `test` y de desarrollo, sin lo sembrado como demostración (`ofrece` en falso).
 */
export function alimentoVisible(profesionalId: string, ofrece: boolean): Prisma.Sql {
  return Prisma.sql`(e."creado_por_id" IS NULL OR ${ALIMENTO_DE_UN_ITEM_EXTERNO} OR e."creado_por_id" = ${profesionalId}::uuid OR ${ALIMENTO_COMPARTIDO}) AND ${sinLoDeDemostracion(ofrece)}`;
}

/** La versión `v` es la vigente: la terminal de su cadena (REG-06-99). */
export const VERSION_VIGENTE = Prisma.sql`NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")`;

/** DL-141 D-2: los nombres alternativos vigentes (sin retiro) del alimento `e`, para el buscador. */
const NOMBRES_ALTERNATIVOS = Prisma.sql`SELECT n."nombre" FROM "nombre_alternativo_de_alimento" n
  WHERE n."elemento_id" = e."id" AND NOT EXISTS (SELECT 1 FROM "retiro_de_nombre_alternativo_de_alimento" r WHERE r."nombre_id" = n."id")`;

/** Las columnas de una fila del catálogo (`FilaDeCatalogo`), con la versión `v` y el elemento `e`. */
const COLUMNAS = Prisma.sql`e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
       e."procedencia"::text AS "procedencia", v."momento_de_registro" AS "momentoDeRegistro",
       v."procedencia" -> 'fuenteExterna' AS "fuenteExterna"`;

/**
 * DL-180: la versión `v` del elemento `e`, con la última decisión de Administración (`rev`) y el grupo vigente (`gru`). La
 * certificación vale solo para la versión que revisó (NUA-D07): si su autor lo corrige, la nueva no está certificada.
 */
const TABLAS_CON_REVISION = Prisma.sql`"version_de_elemento_nutricional" v
  JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
  LEFT JOIN LATERAL (SELECT r."resultado", r."version_id", r."fuente", r."equivalente_id", r."momento_de_registro"
                       FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = e."id" ORDER BY r."numero" DESC LIMIT 1) rev ON TRUE
  LEFT JOIN LATERAL (SELECT g."grupo" FROM "grupo_de_alimento" g WHERE g."elemento_id" = e."id" ORDER BY g."numero" DESC LIMIT 1) gru ON TRUE`;
const CERTIFICADA = Prisma.sql`COALESCE(rev."resultado" = 'CERTIFICADO' AND rev."version_id" = v."id", FALSE)`;
const COLUMNAS_DE_REVISION = Prisma.sql`gru."grupo"::text AS "grupoDeAlimento", ${CERTIFICADA} AS "certificado",
       CASE WHEN ${CERTIFICADA} THEN rev."fuente" END AS "fuenteCertificada",
       CASE WHEN ${CERTIFICADA} THEN rev."momento_de_registro" END AS "momentoDeCertificacion",
       CASE WHEN rev."resultado" = 'EQUIVALENTE' THEN rev."equivalente_id"::text END AS "equivalenteId"`;

/** Las del buscador suman lo que necesita el origen de la fila (DL-141 D-6) y, desde DL-180, el grupo y la revisión. */
const COLUMNAS_DEL_BUSCADOR = Prisma.sql`${COLUMNAS}, e."creado_por_id"::text AS "creadoPorId", ${CORRESPONDENCIA}, ${COLUMNAS_DE_REVISION}`;

/**
 * NUA-03: lo de otro profesional que Administración no certificó va después (1); lo demás, en su orden de siempre (0).
 * Usa `e`, `v` y `rev` de `TABLAS_CON_REVISION`.
 */
function nivelEnElOrden(actorId: string): Prisma.Sql {
  return Prisma.sql`(CASE WHEN e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" IS DISTINCT FROM ${actorId}::uuid AND NOT ${CERTIFICADA} THEN 1 ELSE 0 END)`;
}

/**
 * Catálogo nutricional propio (RF-027; API-NUT-13 y API-INT-NUT-01).
 * - Ítem con identificador estable y versiones inmutables (REG-06-99). La vigente es la terminal de la cadena.
 * - Ámbitos (REG-06-135): lo sembrado por una migración es global (sin profesional que lo cargue: el catálogo sintético de
 *   WP-04 y los alimentos de referencia de USDA, DL-119); lo importado de Open Food Facts es de todos los profesionales,
 *   uno por producto, con su fuente (DL-141 D-1); lo que carga un profesional es de su ámbito y, desde DL-180, lo ven los
 *   demás profesionales de Nutrición si lo compartió (NUA-03 y NUA-D05).
 * - Un cambio del catálogo no toca planes activados: la instantánea guarda su propia copia (REG-06-101).
 * - No es dato de salud (08:168), pero solo lo usa un profesional con Nutrición verificada y habilitada.
 * - UF-09 (DL-169): en producción no ofrece ni acepta lo sembrado como demostración; en `test`, sí.
 */
@Injectable()
export class CatalogoService {
  /** UF-09: si este ambiente ofrece el catálogo de demostración (solo `test` y desarrollo). */
  private readonly ofrece: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecutor: EjecutorNutricional,
    @Inject(ENTORNO) entorno: Entorno,
  ) {
    this.ofrece = ofreceDemostracion(entorno);
  }

  // ─── API-NUT-13 y su búsqueda ──────────────────────────────────────────────────────────────
  /**
   * El buscador tolera tildes, mayúsculas, el orden de las palabras, los plurales y los errores de tipeo
   * (`http/busqueda.ts`; DL-139), y busca también en los nombres alternativos (DL-141). Sin texto, el catálogo entero, lo
   * más nuevo primero. Desde DL-180, dentro de cada grupo de coincidencia, lo de otro profesional va después (NUA-03).
   */
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: ElementoDeCatalogo[]; page: unknown }> {
    const { filas, page } = await this.buscarFilas(actor, query);
    return { data: filas.map(elementoApi), page };
  }

  /**
   * API-NUT-13-BUSQUEDA: las mismas filas, y cada una con el nombre alternativo que coincidió (DL-141 D-2) y su origen:
   * quién lo cargó y si su correspondencia con la fuente es aproximada (D-6). Desde DL-180, su grupo, el nivel de su origen,
   * la certificación de Administración y el verificado equivalente que el buscador sugiere en su lugar.
   */
  async buscar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: ElementoEncontrado[]; page: unknown }> {
    const { filas, page } = await this.buscarFilas(actor, query);
    const equivalentes = await this.equivalentesVerificados(this.prisma, filas.flatMap((f) => (f.equivalenteId ? [f.equivalenteId] : [])));
    return { data: filas.map((f) => encontradoApi(f, f.nombreAlternativo, actor.identidadId, equivalentes)), page };
  }

  private async buscarFilas(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ filas: readonly (FilaDelBuscador & ConNombreAlternativo)[]; page: unknown }> {
    const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
    const { q: _q, cursor: cursorEscrito, ...resto } = query;
    const consulta = leerConsultaDeLista(resto, { type: ['FOOD'] });
    const cursor = leerCursorDeBusqueda(cursorEscrito);
    await this.exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
    return buscarEnCatalogo<FilaDelBuscador>(
      this.prisma,
      {
        columnas: COLUMNAS_DEL_BUSCADOR,
        tablas: TABLAS_CON_REVISION,
        visibles: Prisma.sql`${VERSION_VIGENTE}
           AND v."disponibilidad" = 'DISPONIBLE'
           AND ${alimentoVisible(actor.identidadId, this.ofrece)}`,
        nombresAlternativos: NOMBRES_ALTERNATIVOS,
        nivel: nivelEnElOrden(actor.identidadId),
      },
      leerBusqueda(q),
      consulta.limit,
      cursor,
    );
  }

  /**
   * API-ALI-04 (DL-180): los alimentos que el profesional ve, por su identidad, en su versión vigente, también los
   * retirados (NUA-02: lo que ya los cita sigue mostrándolos, con la marca). Los que no ve no vuelven: ni 404 ni nada que
   * revele que existen.
   */
  async porIdentidad(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<AlimentoConsultado[]> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return [];
    const filas = await cliente.$queryRaw<FilaDelBuscador[]>`
      SELECT ${COLUMNAS_DEL_BUSCADOR}
        FROM ${TABLAS_CON_REVISION}
       WHERE e."id" = ANY(${validos}::uuid[])
         AND ${VERSION_VIGENTE}
         AND ${alimentoVisible(profesionalId, this.ofrece)}`;
    const equivalentes = await this.equivalentesVerificados(cliente, filas.flatMap((f) => (f.equivalenteId ? [f.equivalenteId] : [])));
    const porId = new Map(filas.map((f) => [f.elementoId, f]));
    // En el orden pedido, para que la respuesta no dependa del plan de la base.
    return validos.flatMap((id) => {
      const f = porId.get(id);
      return f ? [{ ...encontradoApi(f, null, profesionalId, equivalentes), retired: !f.disponible }] : [];
    });
  }

  /**
   * API-ALI-07 (NUA-04): los alimentos de la tabla oficial (USDA FoodData Central · SR Legacy), disponibles, que coinciden
   * con lo escrito, con el buscador tolerante de siempre. Para que Administración elija el equivalente de uno cargado a
   * mano. Son de todos: no depende de quién busca.
   */
  async buscarVerificados(q: string, limite: number): Promise<AlimentoVerificado[]> {
    const { filas } = await buscarEnCatalogo<FilaDeCatalogo & { grupoDeAlimento: GrupoDeAlimentoEnLaBase | null }>(
      this.prisma,
      {
        columnas: Prisma.sql`${COLUMNAS}, gru."grupo"::text AS "grupoDeAlimento"`,
        tablas: TABLAS_CON_REVISION,
        visibles: Prisma.sql`${VERSION_VIGENTE} AND v."disponibilidad" = 'DISPONIBLE' AND v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'`,
        nombresAlternativos: NOMBRES_ALTERNATIVOS,
      },
      leerBusqueda(q),
      limite,
      null,
    );
    return filas.map((f) => ({ catalogItemId: f.elementoId, versionId: f.versionId, name: f.nombre, composition: f.composicion, foodGroup: f.grupoDeAlimento ? GRUPO_API[f.grupoDeAlimento] : null }));
  }

  /**
   * NUA-04: los verificados que Administración marcó como equivalentes, en su versión vigente y solo si siguen disponibles
   * (uno retirado no se sugiere). Son de la tabla oficial: los ve todo profesional.
   */
  private async equivalentesVerificados(cliente: Cliente, ids: readonly string[]): Promise<ReadonlyMap<string, EquivalenteVerificado>> {
    const unicos = [...new Set(ids)];
    if (unicos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<(FilaDeCatalogo & { grupo: GrupoDeAlimentoEnLaBase | null })[]>`
      SELECT ${COLUMNAS}, gru."grupo"::text AS "grupo"
        FROM ${TABLAS_CON_REVISION}
       WHERE e."id" = ANY(${unicos}::uuid[]) AND ${VERSION_VIGENTE} AND v."disponibilidad" = 'DISPONIBLE'`;
    return new Map(filas.map((f) => [f.elementoId, { ...elementoApi(f), foodGroup: f.grupo ? GRUPO_API[f.grupo] : null }]));
  }

  // ─── API-INT-NUT-01 ────────────────────────────────────────────────────────────────────────
  /**
   * Desde DL-180, lo cargado a mano se comparte con los demás profesionales de Nutrición (NUA-D05: el formulario lo dice) y
   * puede llevar su grupo (NUA-05). Desde el segundo tramo (NUA-D14), compartirlo es un interruptor del formulario,
   * encendido por defecto (`share`; ausente, se comparte como antes).
   */
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-INT-NUT-01',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearElementoDeCatalogoRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const elemento = await tx.elementoDeCatalogoNutricional.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: actor.identidadId } });
        const version = await tx.versionDeElementoNutricional.create({
          data: {
            elementoId: elemento.id,
            nombre: pedido.name,
            composicion: pedido.composition as Prisma.InputJsonValue,
            disponibilidad: 'DISPONIBLE',
            procedencia: { ...procedencia, carga: 'MANUAL' } as unknown as Prisma.InputJsonValue,
          },
        });
        // NUA-D14: el interruptor del formulario, encendido por defecto; ausente vale lo de antes (se comparte).
        if (pedido.share !== false) await cambiarCompartido(tx, { elementoId: elemento.id, versionId: version.id, autorId: actor.identidadId, compartido: true, procedencia });
        if (pedido.group) await asignarGrupo(tx, elemento.id, pedido.group, actor.identidadId, procedencia);
        await registrarEventoDeNutricion(tx, {
          tipo: 'ElementoDeCatalogoCreado',
          profesionalId: actor.identidadId,
          asesoradoId: null,
          recurso: { tipo: 'ElementoDeCatalogoNutricional', id: elemento.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        const item: ElementoDeCatalogo = {
          catalogItemId: elemento.id,
          versionId: version.id,
          name: version.nombre,
          itemType: 'FOOD',
          composition: pedido.composition,
          provenance: 'PROFESSIONAL_MANUAL',
          externalSource: null,
          available: true,
        };
        return { estadoHttp: 201, cuerpo: { data: item }, sujetoId: null, recurso: { tipo: 'ElementoDeCatalogoNutricional', id: elemento.id } };
      },
    });
  }

  /** Ítems disponibles para el profesional (global, importados y propios), con su versión vigente: validan y arman la instantánea. */
  async disponibles(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoResuelto>> {
    const filas = await this.filasDisponibles(cliente, profesionalId, ids);
    return new Map(filas.map((f) => [f.elementoId, { versionId: f.versionId, name: f.nombre, composition: f.composicion }]));
  }

  /** Los mismos ítems disponibles, con la forma completa del buscador (API-HAN-01: los alimentos habituales). */
  async vigentes(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoDeCatalogo>> {
    const filas = await this.filasDisponibles(cliente, profesionalId, ids);
    return new Map(filas.map((f) => [f.elementoId, elementoApi(f)]));
  }

  /**
   * NUA-02: los ítems que el profesional ve y están retirados (su versión vigente es RETIRADO). Un borrador que ya los cita
   * se sigue guardando (NUA-D03); validar y activar los señalan, porque no se planifica nada nuevo con ellos (REG-06-99).
   */
  async retirados(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoResuelto>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    // La versión RETIRADO conserva el nombre y la composición de la última disponible: lo que la cita la sigue mostrando.
    const filas = await cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT ${COLUMNAS}
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ANY(${validos}::uuid[])
         AND ${VERSION_VIGENTE}
         AND v."disponibilidad" = 'RETIRADO'
         AND ${alimentoVisible(profesionalId, this.ofrece)}`;
    return new Map(filas.map((f) => [f.elementoId, { versionId: f.versionId, name: f.nombre, composition: f.composicion }]));
  }

  private async filasDisponibles(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<FilaDeCatalogo[]> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return [];
    return cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT ${COLUMNAS}
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ANY(${validos}::uuid[])
         AND ${VERSION_VIGENTE}
         AND v."disponibilidad" = 'DISPONIBLE'
         AND ${alimentoVisible(profesionalId, this.ofrece)}`;
  }

  /**
   * DL-141 D-1: el alimento de un ítem externo de Open Food Facts, en su versión vigente y tal como lo ve cualquier
   * profesional (es de todos). Lo usa la importación para ofrecer el que ya está y para apuntar la resolución a él.
   */
  async vigenteDelElemento(cliente: Cliente, elementoId: string): Promise<ElementoDeCatalogo | null> {
    const [fila] = await cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT ${COLUMNAS}
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ${elementoId}::uuid
         AND ${VERSION_VIGENTE}`;
    return fila ? elementoApi(fila) : null;
  }

  /** Solo un profesional con Nutrición verificada y habilitada usa el catálogo nutricional (también para importar, WP-08). */
  async exigirProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<void> {
    await exigirNutricion(cliente, identidadId);
  }

  /**
   * DL-119 · las versiones que cita una receta, por elemento **y** versión: la versión es de ese elemento, está
   * disponible y el elemento es global, importado (de todos, DL-141), propio de este profesional o compartido (DL-180).
   * Las que no cumplen no figuran en el mapa (quien llama responde CATALOG_REFERENCE_INVALID con la ruta). No exige que
   * sea la versión vigente: una receta conserva la versión que citó aunque el catálogo emita otra.
   * DL-180, segundo tramo (las bajas de la revisión adversaria):
   * - **de un alimento retirado no se cita ninguna versión**, tampoco una vieja disponible: una receta nueva, o una versión
   *   nueva de una receta, no lo suma (las versiones de receta que ya lo citaban lo conservan, NUA-D02);
   * - **de un alimento de otro profesional**, solo las versiones que se compartieron: la vigente cuando lo compartió por
   *   última vez y las que la siguen. Las de antes (que su autor escribió creyendo que eran solo suyas) no, aunque alguien
   *   conozca su identificador; y si ya no lo comparte, ninguna.
   */
  async versionesCitables(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, VersionCitable>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<(VersionCitable & { ajeno: boolean; compartidaDesde: string | null })[]>`
      SELECT v."id"::text AS "versionId", e."id"::text AS "elementoId", v."nombre", v."composicion",
             ${AJENO_CARGADO_A_MANO(profesionalId)} AS "ajeno",
             (SELECT k."version_id"::text FROM "cambio_de_alimento_compartido" k
               WHERE k."elemento_id" = e."id" AND k."compartido" ORDER BY k."numero" DESC LIMIT 1) AS "compartidaDesde"
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE v."id" = ANY(${validos}::uuid[])
         AND v."disponibilidad" = 'DISPONIBLE'
         AND ${alimentoVisible(profesionalId, this.ofrece)}
         AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" r WHERE r."elemento_id" = e."id" AND r."disponibilidad" = 'RETIRADO')`;
    const ajenas = filas.filter((f) => f.ajeno);
    // La cadena de versiones de cada alimento ajeno: una versión se compartió si es la que se compartió o la sigue.
    const predecesora = new Map<string, string | null>();
    if (ajenas.length > 0) {
      const elementos = [...new Set(ajenas.map((f) => f.elementoId))];
      const cadena = await cliente.$queryRaw<{ id: string; predecesoraId: string | null }[]>`
        SELECT "id"::text AS "id", "predecesora_id"::text AS "predecesoraId" FROM "version_de_elemento_nutricional" WHERE "elemento_id" = ANY(${elementos}::uuid[])`;
      for (const v of cadena) predecesora.set(v.id, v.predecesoraId);
    }
    const compartida = (f: { versionId: string; compartidaDesde: string | null }): boolean => {
      if (!f.compartidaDesde) return false;
      for (let x: string | null = f.versionId, paso = 0; x && paso <= predecesora.size; x = predecesora.get(x) ?? null, paso++) if (x === f.compartidaDesde) return true;
      return false;
    };
    return new Map(filas.filter((f) => !f.ajeno || compartida(f)).map((f) => [f.versionId, { versionId: f.versionId, elementoId: f.elementoId, nombre: f.nombre, composicion: f.composicion }]));
  }

  /**
   * DL-180, segundo tramo (NUA-D16): toma en modo compartido (`FOR SHARE`) los alimentos cargados a mano por otro
   * profesional que se van a citar, **antes** de mirar si se ven. Dejar de compartirlos (y corregirlos o retirarlos) los
   * toma `FOR NO KEY UPDATE`, así que una cita y un «dejar de compartir» simultáneos se ordenan: la cita entra antes (y lo
   * que ya lo cita lo conserva) o ve que ya no se comparte y es CATALOG_REFERENCE_INVALID. Lo propio, lo sembrado y lo
   * importado no se toman: nadie más los deja de compartir. En orden de identidad, para no cruzarse con otra cita.
   */
  async tomarParaCitar(tx: Prisma.TransactionClient, profesionalId: string, ids: readonly string[]): Promise<void> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id)).sort();
    if (validos.length === 0) return;
    await tx.$queryRaw`
      SELECT 1 FROM "elemento_de_catalogo_nutricional" e
       WHERE e."id" = ANY(${validos}::uuid[]) AND ${AJENO_CARGADO_A_MANO(profesionalId)}
       ORDER BY e."id" FOR SHARE`;
  }

  /** La composición y el nombre de versiones ya citadas (por una receta o una instantánea), sin filtrar por ámbito. */
  async versionesPorId(cliente: Cliente, ids: readonly string[]): Promise<Map<string, VersionCitable>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<VersionCitable[]>`
      SELECT v."id"::text AS "versionId", v."elemento_id"::text AS "elementoId", v."nombre", v."composicion"
        FROM "version_de_elemento_nutricional" v
       WHERE v."id" = ANY(${validos}::uuid[])`;
    return new Map(filas.map((f) => [f.versionId, f]));
  }

  /**
   * DL-180: el grupo vigente y si se retiró, por elemento, sin filtrar por ámbito: para marcar lo que ya está citado en un
   * plan (la instantánea de una versión activada o un borrador), que se lee siempre.
   */
  async gruposYRetiros(cliente: Cliente, ids: readonly string[]): Promise<Map<string, { grupo: GrupoDeAlimento | null; retirado: boolean }>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<{ elementoId: string; grupo: GrupoDeAlimentoEnLaBase | null; retirado: boolean }[]>`
      SELECT e."id"::text AS "elementoId", gru."grupo"::text AS "grupo", (v."disponibilidad" = 'RETIRADO') AS "retirado"
        FROM ${TABLAS_CON_REVISION}
       WHERE e."id" = ANY(${validos}::uuid[]) AND ${VERSION_VIGENTE}`;
    return new Map(filas.map((f) => [f.elementoId, { grupo: f.grupo ? GRUPO_API[f.grupo] : null, retirado: f.retirado }]));
  }
}

/** Una versión del catálogo citada por su identidad: de qué elemento es, cómo se llama y su composición. */
export interface VersionCitable {
  readonly versionId: string;
  readonly elementoId: string;
  readonly nombre: string;
  readonly composicion: ElementoDeCatalogo['composition'];
}

function elementoApi(f: FilaDeCatalogo): ElementoDeCatalogo {
  return {
    catalogItemId: f.elementoId,
    versionId: f.versionId,
    name: f.nombre,
    itemType: 'FOOD',
    composition: f.composicion,
    provenance: f.procedencia,
    externalSource: f.fuenteExterna ?? null,
    available: f.disponible,
  };
}

/** Una fila del buscador del website, con el grupo, el nivel del origen, la certificación y el equivalente (DL-180). */
function encontradoApi(f: FilaDelBuscador, nombreAlternativo: string | null, actorId: string, equivalentes: ReadonlyMap<string, EquivalenteVerificado>): ElementoEncontrado {
  const origin = origenEnElBuscador(f, actorId);
  return {
    ...elementoApi(f),
    matchedAlternativeName: nombreAlternativo,
    origin,
    foodGroup: f.grupoDeAlimento ? GRUPO_API[f.grupoDeAlimento] : null,
    originLevel: nivelDeOrigen({ provenance: f.procedencia, externalProvider: f.fuenteExterna?.provider ?? null, loadedBy: origin.loadedBy, certified: f.certificado }),
    certification: f.certificado && f.fuenteCertificada && f.momentoDeCertificacion ? { source: f.fuenteCertificada, certifiedAt: f.momentoDeCertificacion.toISOString() } : null,
    verifiedEquivalent: f.equivalenteId ? (equivalentes.get(f.equivalenteId) ?? null) : null,
  };
}

/**
 * NUA-D05 y NUA-D14 a D16: compartir un alimento cargado a mano con los demás profesionales de Nutrición, o dejar de
 * compartirlo, es un hecho nuevo de su autor (`cambio_de_alimento_compartido`), con la versión vigente. Si ya está así, no
 * agrega nada y devuelve `false`. Quien llama tiene tomado el alimento (o lo acaba de crear): los cambios del mismo alimento
 * se ordenan con ese bloqueo, y la base exige además que cada uno siga al anterior. El momento es el reloj de la base al
 * decidir, no el comienzo de la transacción.
 */
export async function cambiarCompartido(
  tx: Prisma.TransactionClient,
  c: { readonly elementoId: string; readonly versionId: string; readonly autorId: string; readonly compartido: boolean; readonly procedencia: object },
): Promise<boolean> {
  const ultimo = await tx.cambioDeAlimentoCompartido.findFirst({ where: { elementoId: c.elementoId }, orderBy: { numero: 'desc' }, select: { numero: true, compartido: true } });
  if ((ultimo?.compartido ?? false) === c.compartido) return false;
  await tx.cambioDeAlimentoCompartido.create({
    data: {
      elementoId: c.elementoId,
      numero: (ultimo?.numero ?? 0) + 1,
      compartido: c.compartido,
      versionId: c.versionId,
      autorId: c.autorId,
      procedencia: c.procedencia as Prisma.InputJsonValue,
      momentoDeRegistro: await momentoDeLaBase(tx),
    },
  });
  return true;
}

/**
 * NUA-05: el grupo nuevo de un alimento, como un hecho que sigue al anterior; si ya es ese, no se agrega nada. Lo elige
 * quien lo cargó (la base lo exige). Devuelve si cambió: corregir solo el grupo también es una corrección (NUA-D13).
 */
export async function asignarGrupo(tx: Prisma.TransactionClient, elementoId: string, grupo: GrupoDeAlimento, autorId: string, procedencia: object): Promise<boolean> {
  const ultimo = await tx.grupoDeAlimentoAsignado.findFirst({ where: { elementoId }, orderBy: { numero: 'desc' }, select: { numero: true, grupo: true } });
  if (ultimo?.grupo === GRUPO_EN_LA_BASE[grupo]) return false;
  await tx.grupoDeAlimentoAsignado.create({
    data: { elementoId, numero: (ultimo?.numero ?? 0) + 1, grupo: GRUPO_EN_LA_BASE[grupo], autorId, procedencia: procedencia as Prisma.InputJsonValue },
  });
  return true;
}
