import { Inject, Injectable } from '@nestjs/common';
import {
  CuerpoVacioSchema,
  FINALIDAD_DE_ALCANCE,
  IntencionDeSubidaRequestSchema,
  LIMITES_DE_MEDIO,
  TipoDeImagenSchema,
  type AccesoAMedioResponse,
  type Alcance,
  type FinalidadDeMedio as FinalidadApi,
  type IntencionDeSubidaResponse,
  type Medio,
} from '@be/domain';
import type { FinalidadDeMedio, Medio as FilaDeMedio, Prisma } from '@prisma/client';
import type { IncomingMessage } from 'node:http';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import { alcanceDeNutricion, alcancesDeLosPlanesVigentes, tieneEvidenciaVisualVigente, versionDeEvidenciaVisual } from '../consentimiento/evidencia-visual-del-alcance';
import { esProfesionalDeEntrenamiento } from '../entrenamiento/profesional-de-entrenamiento';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import { esProfesionalDeNutricion } from '../nutricion/profesional-de-nutricion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { conReintento, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { ALMACEN_DE_MEDIOS, type AlmacenDeMedios } from './almacen-de-medios';
import { leerCuerpoCrudo } from './cuerpo-crudo';
import { EjecutorDeMedios } from './ejecutor';
import { procesarImagen, sha256, tipoAdmitido } from './procesamiento-de-imagen';
import { RutasFirmadas } from './rutas-firmadas';

type Tx = Prisma.TransactionClient;
/** El medio con la ingesta a la que está unido, si es la foto de una comida: lo que lee el acceso (API-MED-03). */
type MedioConIngesta = FilaDeMedio & { evidenciaVisual: { ingesta: { asesoradoId: string; versionDePlan: { plan: { profesionalId: string } } } } | null };

export const FINALIDAD_HACIA_API = {
  RECETA_REFERENCIA: 'RECIPE_REFERENCE',
  EVIDENCIA_DE_INGESTA: 'MEAL_EVIDENCE',
  // DL-123 (WP-ENTRENAMIENTO-SERIES): la imagen de un ejercicio propio de un profesional de Entrenamiento.
  REFERENCIA_DE_EJERCICIO: 'EXERCISE_REFERENCE',
} as const satisfies Readonly<Record<FinalidadDeMedio, FinalidadApi>>;
const FINALIDAD_DESDE_API = Object.fromEntries(Object.entries(FINALIDAD_HACIA_API).map(([b, a]) => [a, b])) as Readonly<Record<FinalidadApi, FinalidadDeMedio>>;
export const PROCEDENCIA_HACIA_API = { GENERADA_POR_IA: 'AI_GENERATED', APORTADA_POR_LA_PERSONA: 'PERSON_PROVIDED' } as const;
const ESTADO_HACIA_API = { PENDIENTE: 'PENDING', DISPONIBLE: 'AVAILABLE', SUPRIMIDO: 'DELETED' } as const;

/**
 * El Alcance de cada finalidad, para auditar una denegación con su metadata real: la imagen de un ejercicio es de
 * Entrenamiento; las otras dos, de Nutrición (el Alcance fijo del ejecutor de medios). Cada regla de acceso decide con el
 * PDP en el suyo.
 */
const ALCANCE_DE_FINALIDAD: Readonly<Record<FinalidadDeMedio, Alcance>> = {
  RECETA_REFERENCIA: 'NUTRICION',
  EVIDENCIA_DE_INGESTA: 'NUTRICION',
  REFERENCIA_DE_EJERCICIO: 'ENTRENAMIENTO',
};

/** Cómo se audita un acceso: la foto de una comida es evidencia visual (08:395); la imagen de una receta, un medio. */
const RECURSO_DE_FOTO = 'EVIDENCIA_VISUAL';
const RECURSO_DE_MEDIO = 'Medio';

/** El medio en la forma del contrato. Lo guardado solo se informa mientras está disponible. */
export function medioApi(m: FilaDeMedio): Medio {
  const disponible = m.estado === 'DISPONIBLE';
  return {
    mediaId: m.id,
    purpose: FINALIDAD_HACIA_API[m.finalidad],
    status: ESTADO_HACIA_API[m.estado],
    contentType: disponible ? 'image/jpeg' : null,
    byteSize: disponible ? m.bytesProcesados : null,
    width: disponible ? m.anchoProcesado : null,
    height: disponible ? m.altoProcesado : null,
    provenance: PROCEDENCIA_HACIA_API[m.procedenciaDeImagen],
    authorship: m.autoria,
    createdAt: m.momentoDeRegistro.toISOString(),
  };
}

/**
 * API-MED-01 declara 422 para un tipo o un tamaño no admitidos (los del 09v8 API-PRO-04). El esquema estricto los
 * rechazaría como 400: se reconocen antes, por los dos campos, y lo demás sigue al esquema.
 */
function rechazarTipoOTamanoNoAdmitido(cuerpo: unknown): void {
  if (!cuerpo || typeof cuerpo !== 'object') return;
  const { contentType, byteSize } = cuerpo as Record<string, unknown>;
  if (typeof contentType === 'string' && !TipoDeImagenSchema.safeParse(contentType).success) {
    throw errores.tipoDeArchivoNoAdmitido([{ code: 'FILE_TYPE_NOT_ALLOWED', path: 'contentType' }]);
  }
  if (typeof byteSize === 'number' && Number.isFinite(byteSize) && byteSize > LIMITES_DE_MEDIO.bytesMaximos) throw errores.tamanoDeArchivoNoAdmitido();
}

/**
 * DL-120 · medios privados (API-MED-01 a 05; 09v12 §24; 08 §21).
 * - **Subir** es intención (MED-01, con sesión) más bytes (MED-02, con la ruta firmada de 10 minutos). El servidor valida
 *   tipo, tamaño, medidas y decodificación, y guarda un JPEG recodificado sin metadatos.
 * - **Leer** es acceso (MED-03, con sesión: decide el PDP y se audita cada acceso) más bytes (MED-04, con la ruta firmada
 *   de 15 minutos, sin caché).
 * - **Quién lee qué** (§6): la imagen de una receta, su profesional y el asesorado con un plan (vigente o histórico) que
 *   ofrece esa receta; la foto de una comida, su titular y el profesional del plan de esa ingesta, con vínculo, B2 y A3
 *   vigentes; un medio sin asociar, solo quien lo subió. Lo demás es el mismo 404 que lo inexistente.
 * - **La imagen de un ejercicio** (DL-123, WP-ENTRENAMIENTO-SERIES): la sube un profesional de Entrenamiento con su
 *   autoría declarada, y la leen él y el asesorado con un plan activado suyo que incluye ese ejercicio, con el acceso de
 *   Entrenamiento vigente: el criterio con el que ese asesorado ve el catálogo del profesional. Las reglas de las otras
 *   dos finalidades no cambian.
 * - **Suprimir** (MED-05) es un derecho del titular sobre la foto de su comida (08:451): se borran los bytes y queda el
 *   registro, en el registro de supresiones.
 * - **El acto `EVIDENCIA_VISUAL`** (08 §12.4, «obligatorio para subir y ver fotos»; DL-125): con la exigencia activa
 *   (`BE_EVIDENCIA_VISUAL_EXIGIDA`), subir la foto de una comida pide el acto vigente del vínculo de Nutrición de cada plan
 *   vigente del titular, y el profesional ve una foto solo con el acto vigente de su vínculo. El titular ve las suyas
 *   siempre, con su A3. Sin la exigencia, todo queda como en DL-120: la información se muestra al subir y cada acceso se
 *   audita con ese recurso.
 * Ninguna foto se manda a una IA ni agrega cantidades (09v9 §28).
 */
@Injectable()
export class MediosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecutor: EjecutorDeMedios,
    private readonly pdp: PdpService,
    private readonly auditoria: AuditoriaService,
    private readonly rutas: RutasFirmadas,
    @Inject(ALMACEN_DE_MEDIOS) private readonly almacen: AlmacenDeMedios,
    @Inject(ENTORNO) private readonly entorno: Entorno,
  ) {}

  // ─── API-MED-01 ────────────────────────────────────────────────────────────────────────────
  crearIntencion(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    rechazarTipoOTamanoNoAdmitido(cuerpo);
    const declarada = (cuerpo as { purpose?: unknown } | null)?.purpose;
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-MED-01',
      // La receta es UC-P10, la comida UC-P12 y el ejercicio, que se prescribe en el plan, UC-P15.
      casoDeUso: declarada === 'MEAL_EVIDENCE' ? 'UC-P12' : declarada === 'EXERCISE_REFERENCE' ? 'UC-P15' : 'UC-P10',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: IntencionDeSubidaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const finalidad = FINALIDAD_DESDE_API[pedido.purpose];
        const foto = finalidad === 'EVIDENCIA_DE_INGESTA';
        if (foto) {
          // La foto de una comida es un dato de salud del titular: sin A3 vigente no se sube (08:406). Antes que cualquier
          // otra regla (09 §36).
          await exigirA3Vigente(tx, actor.identidadId, { bloquear: true });
          if (pedido.provenance !== 'PERSON_PROVIDED') {
            throw errores.validacionFallida([{ code: 'MEAL_EVIDENCE_IS_PERSON_PROVIDED', path: 'provenance' }]);
          }
          if (this.entorno.evidenciaVisualExigida) await this.exigirEvidenciaVisual(tx, actor.identidadId);
        } else if (finalidad === 'REFERENCIA_DE_EJERCICIO') {
          // DL-123: la imagen de un ejercicio propio, de un profesional de Entrenamiento verificado y habilitado (RF-037), con
          // su autoría declarada: un recurso didáctico sin autoría no se acepta (REG-06-134). La base también lo exige.
          if (!(await esProfesionalDeEntrenamiento(tx, actor.identidadId))) throw errores.accionNoPermitida();
          if (pedido.authorship === null) throw errores.validacionFallida([{ code: 'EXERCISE_REFERENCE_AUTHORSHIP_REQUIRED', path: 'authorship' }]);
        } else if (!(await esProfesionalDeNutricion(tx, actor.identidadId))) {
          throw errores.accionNoPermitida();
        }
        const medio = await tx.medio.create({
          data: {
            propietarioId: actor.identidadId,
            finalidad,
            procedenciaDeImagen: pedido.provenance === 'AI_GENERATED' ? 'GENERADA_POR_IA' : 'APORTADA_POR_LA_PERSONA',
            autoria: pedido.authorship,
            tipoDeclarado: pedido.contentType,
            bytesDeclarados: pedido.byteSize,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        const vence = this.rutas.vencimiento('SUBIDA');
        const data: IntencionDeSubidaResponse['data'] = {
          mediaId: medio.id,
          uploadPath: `/media/uploads/${this.rutas.firmar(medio.id, 'SUBIDA', vence)}`,
          method: 'PUT',
          contentType: pedido.contentType,
          maxBytes: LIMITES_DE_MEDIO.bytesMaximos,
          expiresAt: vence.toISOString(),
        };
        return { estadoHttp: 201, cuerpo: { data }, sujetoId: foto ? actor.identidadId : null, recurso: { tipo: foto ? RECURSO_DE_FOTO : RECURSO_DE_MEDIO, id: medio.id } };
      },
    });
  }

  /**
   * DL-125 · antes de subir la foto de una comida, el titular recibió la información destacada para el profesional que la
   * va a ver (08 §21.3): el de su plan vigente. Sin plan vigente no hay a quién informarle. Si falta el acto, el 403 dice el
   * vínculo y la versión a mostrar (API-EVI-01 y 02). El acto se toma en modo compartido: una revocación en curso espera.
   */
  private async exigirEvidenciaVisual(tx: Tx, asesoradoId: string): Promise<void> {
    const alcances = await alcancesDeLosPlanesVigentes(tx, asesoradoId);
    if (alcances.length === 0) throw errores.planDeNutricionRequerido();
    for (const alcanceId of alcances) {
      if (await tieneEvidenciaVisualVigente(tx, alcanceId, { bloquear: true })) continue;
      const version = await versionDeEvidenciaVisual(tx);
      if (!version) throw errores.interno();
      throw errores.evidenciaVisualRequerida({ relationshipId: alcanceId, consentVersionId: version.id });
    }
  }

  // ─── API-MED-02 ────────────────────────────────────────────────────────────────────────────
  /**
   * Sin sesión: la autoriza la ruta firmada. Vencida, alterada, de otro propósito o de un medio suprimido: 404. Repetir la
   * misma subida responde el mismo medio; otros bytes a un medio que ya los tiene, 409. El procesamiento (CPU) va fuera
   * de la transacción; guardar, cambiar el estado y auditar, dentro.
   */
  async subir(token: string, contentType: string | undefined, req: IncomingMessage, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Medio }> {
    // El cuerpo se lee siempre, aun para rechazarlo: responder antes de terminar de recibirlo hace que Node cierre la
    // conexión, y el cliente vería un error de red en lugar del 404 o el 422 del contrato.
    const cuerpo = await leerCuerpoCrudo(req, LIMITES_DE_MEDIO.bytesMaximos);
    const ruta = this.rutas.verificar(token, 'SUBIDA');
    if (!ruta) throw errores.recursoNoEncontrado();
    try {
      sinParametrosDeQuery(query);
      const tipo = tipoAdmitido(contentType);
      if (!tipo) throw errores.tipoDeArchivoNoAdmitido([{ code: 'FILE_TYPE_NOT_ALLOWED', path: 'Content-Type' }]);
      if ('excedido' in cuerpo) throw errores.tamanoDeArchivoNoAdmitido();
      if (cuerpo.bytes.length === 0) throw errores.contenidoDeArchivoInvalido([{ code: 'EMPTY_BODY', path: '(body)' }]);
      const previo = await this.prisma.medio.findUnique({ where: { id: ruta.medioId } });
      if (!previo || previo.estado === 'SUPRIMIDO') throw errores.recursoNoEncontrado();
      if (previo.estado === 'DISPONIBLE') return { data: this.mismaSubida(previo, cuerpo.bytes) };
      if (tipo !== previo.tipoDeclarado) throw errores.tipoDeArchivoNoAdmitido([{ code: 'CONTENT_TYPE_DIFFERS_FROM_INTENT', path: 'Content-Type' }]);
      const imagen = await procesarImagen(cuerpo.bytes, tipo);
      return await conReintento(() =>
        this.prisma.$transaction(async (tx) => {
          const [medio] = await tx.$queryRaw<{ estado: FilaDeMedio['estado'] }[]>`SELECT "estado"::text AS "estado" FROM "medio" WHERE "id" = ${ruta.medioId}::uuid FOR NO KEY UPDATE`;
          if (!medio || medio.estado === 'SUPRIMIDO') throw errores.recursoNoEncontrado();
          // Dos subidas a la vez: la segunda encuentra lo de la primera y responde como un reintento.
          if (medio.estado === 'DISPONIBLE') return { data: this.mismaSubida(await tx.medio.findUniqueOrThrow({ where: { id: ruta.medioId } }), cuerpo.bytes) };
          await this.almacen.guardar(tx, ruta.medioId, imagen.procesada.contenido);
          const actualizado = await tx.medio.update({
            where: { id: ruta.medioId },
            data: {
              estado: 'DISPONIBLE',
              tipoOriginal: imagen.original.tipo,
              bytesOriginales: imagen.original.bytes,
              anchoOriginal: imagen.original.ancho,
              altoOriginal: imagen.original.alto,
              sha256Original: imagen.original.sha256,
              tipoProcesado: imagen.procesada.tipo,
              bytesProcesados: imagen.procesada.bytes,
              anchoProcesado: imagen.procesada.ancho,
              altoProcesado: imagen.procesada.alto,
              sha256Procesado: imagen.procesada.sha256,
              momentoDeSubida: await momentoDeLaBase(tx),
            },
          });
          await this.auditoria.registrar(
            {
              operacion: 'API-MED-02',
              resultado: 'EXITO',
              actorId: actualizado.propietarioId,
              sujetoId: actualizado.finalidad === 'EVIDENCIA_DE_INGESTA' ? actualizado.propietarioId : null,
              recursoTipo: actualizado.finalidad === 'EVIDENCIA_DE_INGESTA' ? RECURSO_DE_FOTO : RECURSO_DE_MEDIO,
              recursoId: actualizado.id,
              superficie: ctx.superficie,
              requestId: ctx.requestId,
              momentoDeOcurrencia: ctx.momentoDeRecepcion,
            },
            tx,
          );
          return { data: medioApi(actualizado) };
        }),
      );
    } catch (e) {
      // El rechazo de una ruta válida queda auditado, con el medio que se intentó (reconstruir un intento).
      if (e instanceof ErrorDeApi) {
        await this.auditoria.registrar({
          operacion: 'API-MED-02',
          resultado: 'RECHAZO',
          motivo: e.code,
          recursoTipo: RECURSO_DE_MEDIO,
          recursoId: ruta.medioId,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw e;
    }
  }

  /** La misma subida, repetida, responde el mismo medio; otros bytes no reemplazan lo guardado. */
  private mismaSubida(medio: FilaDeMedio, bytes: Buffer): Medio {
    if (medio.sha256Original !== sha256(bytes)) throw errores.estadoEnConflicto('Esta imagen ya se subió. Para usar otra, empezá una subida nueva.');
    return medioApi(medio);
  }

  // ─── API-MED-03 ────────────────────────────────────────────────────────────────────────────
  acceso(actor: ActorAutenticado, mediaId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<AccesoAMedioResponse> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO_DE_MEDIO, id: mediaId };
    return this.ejecutor.leer({
      operacion: 'API-MED-03',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const medio = esUuid(mediaId)
          ? await tx.medio.findUnique({
              where: { id: mediaId },
              include: { evidenciaVisual: { include: { ingesta: { select: { asesoradoId: true, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } } } } } },
            })
          : null;
        if (!medio || medio.estado !== 'DISPONIBLE') {
          throw this.ejecutor.noRevelable({ operacion: 'API-MED-03', actorId: actor.identidadId, recurso, ...(medio ? { alcance: ALCANCE_DE_FINALIDAD[medio.finalidad] } : {}) }, ctx);
        }
        const sujetoId = await this.decidirSegunFinalidad(tx, actor, medio, ctx);
        const vence = this.rutas.vencimiento('LECTURA');
        // 08 §21.5: el acceso a la evidencia visual es un acceso sensible auditable; queda con su acto (08:395).
        await this.auditoria.registrar(
          {
            operacion: 'API-MED-03',
            resultado: 'EXITO',
            actorId: actor.identidadId,
            sujetoId,
            recursoTipo: medio.finalidad === 'EVIDENCIA_DE_INGESTA' ? RECURSO_DE_FOTO : RECURSO_DE_MEDIO,
            recursoId: medio.id,
            superficie: ctx.superficie,
            requestId: ctx.requestId,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
          tx,
        );
        return { data: { mediaId: medio.id, path: `/media/content/${this.rutas.firmar(medio.id, 'LECTURA', vence)}`, expiresAt: vence.toISOString() } };
      },
    });
  }

  /**
   * Cada finalidad tiene su regla, y ninguna cae en la de otra: la foto de una comida no es la regla por defecto. Devuelve
   * el sujeto de la auditoría: el titular de lo leído, o `null` si quien lee es el profesional dueño de la imagen.
   */
  private decidirSegunFinalidad(tx: Tx, actor: ActorAutenticado, medio: MedioConIngesta, ctx: ContextoDeSolicitud): Promise<string | null> {
    switch (medio.finalidad) {
      case 'RECETA_REFERENCIA':
        return this.decidirImagenDeReceta(tx, actor, medio.id, medio.propietarioId, ctx);
      case 'REFERENCIA_DE_EJERCICIO':
        return this.decidirImagenDeEjercicio(tx, actor, medio.id, medio.propietarioId, ctx);
      case 'EVIDENCIA_DE_INGESTA':
        return this.decidirFotoDeComida(tx, actor, medio, ctx);
    }
  }

  /**
   * La imagen de un ejercicio (DL-123), con alcance ENTRENAMIENTO: su profesional, o el asesorado con un plan activado
   * (vigente o histórico) de ese profesional cuya instantánea incluye el ejercicio de este medio, en cualquiera de sus
   * asociaciones (la vigente o una pasada: lo registrado conserva la imagen de entonces), con el acceso de Entrenamiento
   * que decide el PDP. Es el criterio con el que ese asesorado ve el catálogo del profesional (RF-037) y el de la imagen
   * de una receta. Lo demás, el mismo 404 que lo inexistente.
   */
  private async decidirImagenDeEjercicio(tx: Tx, actor: ActorAutenticado, medioId: string, propietarioId: string, ctx: ContextoDeSolicitud): Promise<string | null> {
    if (propietarioId === actor.identidadId) return null;
    const [plan] = await tx.$queryRaw<{ profesionalId: string }[]>`
      SELECT e."creado_por_id"::text AS "profesionalId"
        FROM "asociacion_de_imagen_de_ejercicio" a
        JOIN "ejercicio_de_catalogo" e ON e."id" = a."ejercicio_id"
        JOIN "plan_de_entrenamiento" p ON p."profesional_id" = e."creado_por_id" AND p."asesorado_id" = ${actor.identidadId}::uuid
        JOIN "version_de_plan_de_entrenamiento" v ON v."plan_id" = p."id" AND v."estado" = 'ACTIVADA'
        JOIN "instantanea_de_plan_de_entrenamiento" i ON i."version_de_plan_id" = v."id"
       WHERE a."medio_id" = ${medioId}::uuid
         AND jsonb_path_exists(i."contenido", '$.ejercicios.* ? (@.exerciseId == $ejercicio)', jsonb_build_object('ejercicio', e."id"::text))
       LIMIT 1`;
    const recurso = { tipo: RECURSO_DE_MEDIO, id: medioId };
    if (!plan) throw this.ejecutor.noRevelable({ operacion: 'API-MED-03', actorId: actor.identidadId, recurso, alcance: 'ENTRENAMIENTO' }, ctx);
    await this.pdp.decidirEnTransaccion(
      tx,
      { operacion: 'API-MED-03', actorDeLaDecision: actor.identidadId, profesionalId: plan.profesionalId, titularId: actor.identidadId, alcance: 'ENTRENAMIENTO', recurso },
      ctx,
    );
    return actor.identidadId;
  }

  /**
   * La imagen de una receta: su profesional, o el asesorado con un plan activado (vigente o histórico) de ese profesional
   * que ofrece una receta a la que se asoció esta imagen, con el acceso que decide el PDP (como su plan, API-NUT-09).
   */
  private async decidirImagenDeReceta(tx: Tx, actor: ActorAutenticado, medioId: string, propietarioId: string, ctx: ContextoDeSolicitud): Promise<string | null> {
    if (propietarioId === actor.identidadId) return null;
    const [plan] = await tx.$queryRaw<{ profesionalId: string }[]>`
      SELECT r."profesional_id"::text AS "profesionalId"
        FROM "asociacion_de_imagen_de_receta" a
        JOIN "receta" r ON r."id" = a."receta_id"
        JOIN "plan_nutricional" p ON p."profesional_id" = r."profesional_id" AND p."asesorado_id" = ${actor.identidadId}::uuid
        JOIN "version_de_plan_nutricional" v ON v."plan_id" = p."id" AND v."estado" = 'ACTIVADA'
        JOIN "instantanea_de_plan_nutricional" i ON i."version_de_plan_id" = v."id"
       WHERE a."medio_id" = ${medioId}::uuid
         AND jsonb_path_exists(i."contenido", '$.dayTypes[*].meals[*].options[*].recipe ? (@.recipeId == $receta)', jsonb_build_object('receta', r."id"::text))
       LIMIT 1`;
    const recurso = { tipo: RECURSO_DE_MEDIO, id: medioId };
    if (!plan) throw this.ejecutor.noRevelable({ operacion: 'API-MED-03', actorId: actor.identidadId, recurso }, ctx);
    await this.pdp.decidirEnTransaccion(
      tx,
      { operacion: 'API-MED-03', actorDeLaDecision: actor.identidadId, profesionalId: plan.profesionalId, titularId: actor.identidadId, alcance: 'NUTRICION', recurso },
      ctx,
    );
    return actor.identidadId;
  }

  /**
   * La foto de una comida: unida a una ingesta, la leen su titular y el profesional del plan de esa ingesta, con el mismo
   * PDP que API-NUT-16 y, con la exigencia de DL-125, el acto EVIDENCIA_VISUAL vigente de su vínculo; sin asociar, solo
   * quien la subió y con su A3 vigente.
   */
  private async decidirFotoDeComida(tx: Tx, actor: ActorAutenticado, medio: MedioConIngesta, ctx: ContextoDeSolicitud): Promise<string> {
    const recurso = { tipo: RECURSO_DE_FOTO, id: medio.id };
    const ingesta = medio.evidenciaVisual?.ingesta;
    if (!ingesta) {
      const [a3] = await tx.$queryRaw<{ vigente: boolean }[]>`
        SELECT EXISTS (SELECT 1 FROM "acto_registrable" WHERE "identidad_id" = ${actor.identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE') AS "vigente"`;
      if (medio.propietarioId !== actor.identidadId || !a3?.vigente) {
        throw this.ejecutor.noRevelable({ operacion: 'API-MED-03', actorId: actor.identidadId, recurso, sujetoId: medio.propietarioId === actor.identidadId ? actor.identidadId : null }, ctx);
      }
      return actor.identidadId;
    }
    const esTitular = ingesta.asesoradoId === actor.identidadId;
    const profesionalDelPlan = ingesta.versionDePlan.plan.profesionalId;
    await this.pdp.decidirEnTransaccion(
      tx,
      { operacion: 'API-MED-03', actorDeLaDecision: actor.identidadId, profesionalId: esTitular ? profesionalDelPlan : actor.identidadId, titularId: ingesta.asesoradoId, alcance: 'NUTRICION', recurso },
      ctx,
    );
    if (!esTitular && profesionalDelPlan !== actor.identidadId) {
      throw this.ejecutor.noRevelable({ operacion: 'API-MED-03', actorId: actor.identidadId, recurso, sujetoId: ingesta.asesoradoId }, ctx);
    }
    if (!esTitular && this.entorno.evidenciaVisualExigida) {
      // DL-125 · el profesional ve la foto solo con el acto EVIDENCIA_VISUAL vigente de su vínculo (08 §12.4). Sin él, el
      // mismo 404, y la decisión denegada queda registrada en la dimensión del consentimiento (08:491: el titular puede
      // saber quién intentó acceder).
      const alcanceId = await alcanceDeNutricion(tx, actor.identidadId, ingesta.asesoradoId);
      if (!alcanceId || !(await tieneEvidenciaVisualVigente(tx, alcanceId, { bloquear: true }))) {
        throw new DenegacionDelPdp({
          operacion: 'API-MED-03',
          resultado: 'DENEGADA',
          actorId: actor.identidadId,
          sujetoId: ingesta.asesoradoId,
          alcance: 'NUTRICION',
          finalidad: FINALIDAD_DE_ALCANCE.NUTRICION,
          dimensionesDesfavorables: ['CONSENTIMIENTO'],
          recursoTipo: recurso.tipo,
          recursoId: medio.id,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: new Date(),
        });
      }
    }
    return ingesta.asesoradoId;
  }

  // ─── API-MED-04 ────────────────────────────────────────────────────────────────────────────
  /** Los bytes de una ruta de lectura vigente. Vencida, alterada o de un medio suprimido: 404. */
  async contenido(token: string, query: Record<string, unknown>): Promise<Buffer> {
    const ruta = this.rutas.verificar(token, 'LECTURA');
    if (!ruta) throw errores.recursoNoEncontrado();
    sinParametrosDeQuery(query);
    const bytes = await this.prisma.$transaction(async (tx) => {
      const medio = await tx.medio.findUnique({ where: { id: ruta.medioId }, select: { estado: true } });
      return medio?.estado === 'DISPONIBLE' ? this.almacen.leer(tx, ruta.medioId) : null;
    });
    if (!bytes) throw errores.recursoNoEncontrado();
    return bytes;
  }

  // ─── API-MED-05 ────────────────────────────────────────────────────────────────────────────
  suprimir(actor: ActorAutenticado, mediaId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_DE_FOTO, id: mediaId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-MED-05',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { mediaId },
      efecto: async (tx) => {
        const [fila] = esUuid(mediaId)
          ? await tx.$queryRaw<{ id: string }[]>`
              SELECT "id"::text AS "id" FROM "medio"
               WHERE "id" = ${mediaId}::uuid AND "propietario_id" = ${actor.identidadId}::uuid AND "finalidad" = 'EVIDENCIA_DE_INGESTA'
               FOR NO KEY UPDATE`
          : [];
        // Solo la foto propia de una comida: la imagen de una receta, un medio ajeno o uno inexistente son el mismo 404.
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-MED-05', actorId: actor.identidadId, recurso }, ctx);
        let medio = await tx.medio.findUniqueOrThrow({ where: { id: fila.id } });
        // Suprimir dos veces responde lo mismo: el derecho ya se ejerció.
        if (medio.estado !== 'SUPRIMIDO') {
          const momento = await momentoDeLaBase(tx);
          // 08 §18: la supresión queda en el registro de supresiones, con su fundamento y su ejecutor.
          await tx.registroDeSupresion.create({
            data: { categoria: RECURSO_DE_FOTO, sujetoId: actor.identidadId, fundamento: '08:451 · supresión individual a pedido del titular (DL-120)', ejecutor: 'API-MED-05', momentoDeOcurrencia: momento },
          });
          medio = await tx.medio.update({ where: { id: medio.id }, data: { estado: 'SUPRIMIDO', momentoDeSupresion: momento, motivoDeSupresion: 'PEDIDO_DEL_TITULAR' } });
          await this.almacen.suprimir(tx, medio.id);
        }
        return { estadoHttp: 200, cuerpo: { data: medioApi(medio) }, sujetoId: actor.identidadId, recurso };
      },
    });
  }

  // ─── Para recetas, registro e imágenes de ejercicio (REC-05, ING-02, EJE-02) ───────────────────

  /**
   * Los medios que un cuerpo cita, si cada uno es propio, está DISPONIBLE y es de esa finalidad. Devuelve las rutas de los
   * que no cumplen (quien llama responde MEDIA_REFERENCE_INVALID): nunca dice si un medio ajeno existe. La autoría de una
   * imagen de ejercicio no hace falta mirarla acá: sin ella no hay medio de esa finalidad (API-MED-01 y la base).
   */
  async problemasDeReferencia(tx: Tx, propietarioId: string, ids: readonly string[], finalidad: FilaDeMedio['finalidad'], ruta: (i: number) => string): Promise<{ code: string; path: string }[]> {
    const validos = ids.filter(esUuid);
    const propios = validos.length
      ? await tx.medio.findMany({ where: { id: { in: validos }, propietarioId, finalidad, estado: 'DISPONIBLE' }, select: { id: true } })
      : [];
    const ok = new Set(propios.map((m) => m.id));
    const vistos = new Set<string>();
    const problemas: { code: string; path: string }[] = [];
    ids.forEach((id, i) => {
      if (vistos.has(id)) problemas.push({ code: 'MEDIA_REFERENCE_REPEATED', path: ruta(i) });
      else if (!ok.has(id)) problemas.push({ code: 'MEDIA_REFERENCE_INVALID', path: ruta(i) });
      vistos.add(id);
    });
    return problemas;
  }
}
