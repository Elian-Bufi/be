import {
  LicenciaDeImagenSchema,
  LIMITES_DE_MEDIO,
  normalizarIdentificadorLocal,
  ordenarZonasDeEjercicio,
  problemasDeZonas,
  RevisionTecnicaSchema,
  type LicenciaDeImagen,
  type RevisionTecnica,
} from '@be/domain';
import type { Prisma, PrismaClient } from '@prisma/client';
import { ErrorDeApi } from '../http/errores';
import type { AlmacenDeMedios } from '../medios/almacen-de-medios';
import { procesarImagen, tipoAdmitido, type ImagenProcesada } from '../medios/procesamiento-de-imagen';
import { esUuid } from '../plataforma/ejecutor';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { asignarZonas, zonasDeEjercicios, type RelacionConZona } from './catalogo-visual';
import { REVISION_TECNICA_DESDE_API } from './lectura-por-serie';

/**
 * DL-081 y DL-162 — la curaduría de BE sobre el catálogo de todos (lo sembrado y lo importado de wger): sus zonas
 * musculares y su imagen. REG-06-135: el catálogo global admite «a lo sumo un recurso visual curado vigente» y no es un
 * repositorio libre, así que ningún profesional lo cambia por HTTP. Lo hace el operador con el comando interno
 * (`curaduria-comando.ts`), como la incorporación de un administrador (08 §28.3-bis), con su nombre y su fundamento en la
 * procedencia de cada cambio.
 * - **Zonas.** Una asignación nueva por ejercicio, para su versión vigente, sin autor (es de BE). Repetir la misma lista
 *   no agrega nada. Nunca se copian ni se infieren de wger ni del nombre: las trae el archivo que revisó Dirección.
 * - **Imagen.** El medio es de una cuenta administradora de BE (la curadora): se procesa como cualquier subida
 *   (`procesarImagen`: sin metadatos, JPEG, 1600 px) y se asocia con su licencia, su texto alternativo, su revisión
 *   técnica y su procedencia (generada con IA o aportada). Repetir la misma imagen no agrega nada.
 * - **Sin `escribir`**, cada función solo dice lo que haría: lee, compara y responde, sin tocar la base.
 * La base sostiene las mismas reglas aunque el código se equivoque (triggers de la migración 20261102120000).
 */
export class ErrorDeCuraduria extends Error {}

type Tx = Prisma.TransactionClient;

/**
 * HALLAZGO-P2028 · los tiempos de las dos transacciones de la curaduría. Prisma corta una transacción interactiva a los
 * 5 s por omisión (P2028). El comando corre desde la máquina del operador contra la base del ambiente (en test, la de
 * Render, a unos 470 ms por consulta), y varias consultas en serie pasan ese límite. La API en servicio no usa estas
 * funciones, así que el cambio solo alcanza al comando.
 */
export const TIEMPOS_DE_LA_CURADURIA = { maxWait: 10_000, timeout: 120_000 } as const;

export interface DatosDelOperador {
  readonly operador: string;
  readonly fundamento: string;
  /** Sin esto, nada se escribe. */
  readonly escribir: boolean;
}

/** La procedencia de un cambio curado: la marca CURADURIA_BE es la que la base exige para el catálogo de todos. */
function procedenciaDe(operacion: string, d: DatosDelOperador): Record<string, unknown> {
  return { fuente: 'PROPIA', casoDeUso: null, operacion, superficie: null, requestId: null, carga: 'CURADURIA_BE', operador: d.operador, fundamento: d.fundamento };
}

function textosDelOperador(d: DatosDelOperador): DatosDelOperador {
  const operador = (d.operador ?? '').trim();
  const fundamento = (d.fundamento ?? '').trim();
  if (operador.length < 1 || operador.length > 120) throw new ErrorDeCuraduria('Falta quién corre el comando (--operador), de 1 a 120 caracteres.');
  if (fundamento.length < 1 || fundamento.length > 1000) throw new ErrorDeCuraduria('Falta el fundamento (--fundamento), de 1 a 1000 caracteres.');
  return { operador, fundamento, escribir: d.escribir };
}

interface EjercicioDeTodos {
  readonly id: string;
  readonly versionId: string;
  readonly nombre: string;
}

/** El ejercicio del catálogo de todos, en su versión vigente y bloqueado: los cambios del mismo ejercicio se ordenan acá. */
async function ejercicioDeTodos(tx: Tx, exerciseId: string): Promise<EjercicioDeTodos> {
  if (!esUuid(exerciseId)) throw new ErrorDeCuraduria(`«${String(exerciseId).slice(0, 60)}» no es el identificador de un ejercicio.`);
  const [e] = await tx.$queryRaw<{ id: string; procedencia: string; versionId: string; nombre: string }[]>`
    SELECT e."id"::text AS "id", e."procedencia"::text AS "procedencia", v."id"::text AS "versionId", v."nombre"
      FROM "ejercicio_de_catalogo" e
      JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id"
     WHERE e."id" = ${exerciseId}::uuid
       AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")
       FOR NO KEY UPDATE OF e`;
  if (!e) throw new ErrorDeCuraduria(`No hay un ejercicio ${exerciseId}.`);
  if (e.procedencia === 'PROFESSIONAL_MANUAL') {
    throw new ErrorDeCuraduria(`«${e.nombre}» lo cargó un profesional: sus zonas y su imagen las declara él (API-EJE-02 y API-EJE-04), no BE.`);
  }
  return { id: e.id, versionId: e.versionId, nombre: e.nombre };
}

// ─── Zonas ───────────────────────────────────────────────────────────────────────────────────────

export interface PedidoDeZonas {
  readonly exerciseId: string;
  readonly muscleZones: readonly RelacionConZona[];
}

export interface ResultadoDeZonas {
  readonly exerciseId: string;
  readonly nombre: string;
  readonly versionId: string;
  readonly antes: readonly RelacionConZona[];
  readonly despues: readonly RelacionConZona[];
  /** SIN_CAMBIOS si ya tiene exactamente esas; ASIGNAR si se asignan (o se asignarían, sin `escribir`). */
  readonly accion: 'SIN_CAMBIOS' | 'ASIGNAR';
  readonly escrito: boolean;
}

const mismaLista = (a: readonly RelacionConZona[], b: readonly RelacionConZona[]): boolean =>
  a.length === b.length && a.every((z, i) => z.zoneId === b[i]!.zoneId && z.role === b[i]!.role);

export async function curarZonas(prisma: PrismaClient, pedidos: readonly PedidoDeZonas[], datos: DatosDelOperador): Promise<ResultadoDeZonas[]> {
  const d = textosDelOperador(datos);
  if (pedidos.length === 0) throw new ErrorDeCuraduria('El archivo no trae ningún ejercicio.');
  const vistos = new Set<string>();
  pedidos.forEach((p, i) => {
    const problemas = problemasDeZonas(p.muscleZones, `ejercicios[${i}].muscleZones`);
    if (problemas.length > 0) throw new ErrorDeCuraduria(`Zonas inválidas en ejercicios[${i}]: ${problemas.map((x) => `${x.path} ${x.code}`).join('; ')}.`);
    const id = String(p.exerciseId).toLowerCase();
    if (vistos.has(id)) throw new ErrorDeCuraduria(`El ejercicio ${id} aparece dos veces en el archivo.`);
    vistos.add(id);
  });
  return prisma.$transaction(async (tx): Promise<ResultadoDeZonas[]> => {
    const resultados: ResultadoDeZonas[] = [];
    for (const p of pedidos) {
      const e = await ejercicioDeTodos(tx, p.exerciseId);
      const vigentes = (await zonasDeEjercicios(tx, [e.id])).get(e.id);
      const antes = vigentes?.zonas ?? [];
      const despues = ordenarZonasDeEjercicio(p.muscleZones.map((z) => ({ zoneId: z.zoneId, role: z.role })));
      // Ya declaradas: la misma lista, para la versión vigente. Sin ninguna asignación, una lista vacía no agrega nada.
      const deLaVersionVigente = vigentes && vigentes.numero > 0 ? vigentes.versionDeEjercicioId === e.versionId : despues.length === 0;
      const igual = mismaLista(antes, despues) && deLaVersionVigente;
      if (!igual && d.escribir) {
        await asignarZonas(tx, { ejercicioId: e.id, versionDeEjercicioId: e.versionId, numero: (vigentes?.numero ?? 0) + 1, autorId: null, procedencia: procedenciaDe('CMD-CUR-ZONAS', d), zonas: despues });
      }
      resultados.push({ exerciseId: e.id, nombre: e.nombre, versionId: e.versionId, antes, despues, accion: igual ? 'SIN_CAMBIOS' : 'ASIGNAR', escrito: !igual && d.escribir });
    }
    return resultados;
  }, TIEMPOS_DE_LA_CURADURIA);
}

// ─── Imagen ──────────────────────────────────────────────────────────────────────────────────────

export interface PedidoDeImagen {
  readonly exerciseId: string;
  readonly bytes: Buffer;
  readonly contentType: string;
  readonly provenance: 'AI_GENERATED' | 'PERSON_PROVIDED';
  readonly authorship: string;
  readonly altText: string;
  readonly license: LicenciaDeImagen;
  readonly technicalReview: RevisionTecnica;
}

export interface ResultadoDeImagen {
  readonly exerciseId: string;
  readonly nombre: string;
  readonly versionId: string;
  /** SIN_CAMBIOS si esa misma imagen ya es la vigente; ASOCIAR si se asocia (o se asociaría, sin `escribir`). */
  readonly accion: 'SIN_CAMBIOS' | 'ASOCIAR';
  readonly escrito: boolean;
  readonly mediaId: string | null;
  readonly imageVersion: number;
  readonly original: { readonly ancho: number; readonly alto: number; readonly bytes: number };
  readonly guardada: { readonly ancho: number; readonly alto: number; readonly bytes: number };
}

function validarImagen(p: PedidoDeImagen): { tipo: NonNullable<ReturnType<typeof tipoAdmitido>>; license: LicenciaDeImagen; technicalReview: RevisionTecnica } {
  const tipo = tipoAdmitido(p.contentType);
  if (!tipo) throw new ErrorDeCuraduria(`${p.exerciseId}: el tipo ${String(p.contentType).slice(0, 40)} no se admite (JPEG, PNG o WebP).`);
  if (p.bytes.length === 0 || p.bytes.length > LIMITES_DE_MEDIO.bytesMaximos) throw new ErrorDeCuraduria(`${p.exerciseId}: la imagen tiene que pesar entre 1 byte y 10 MB.`);
  if (p.provenance !== 'AI_GENERATED' && p.provenance !== 'PERSON_PROVIDED') throw new ErrorDeCuraduria(`${p.exerciseId}: la procedencia es AI_GENERATED o PERSON_PROVIDED.`);
  const autoria = (p.authorship ?? '').trim();
  const alternativo = (p.altText ?? '').trim();
  if (autoria.length < 1 || autoria.length > 300) throw new ErrorDeCuraduria(`${p.exerciseId}: falta la autoría (de 1 a 300 caracteres; REG-06-134).`);
  if (alternativo.length < 1 || alternativo.length > 300) throw new ErrorDeCuraduria(`${p.exerciseId}: falta el texto alternativo (de 1 a 300 caracteres).`);
  const license = LicenciaDeImagenSchema.safeParse(p.license);
  if (!license.success) throw new ErrorDeCuraduria(`${p.exerciseId}: la licencia es obligatoria, sin licencia externa con sus términos de uso o una externa identificada (REG-06-134).`);
  const technicalReview = RevisionTecnicaSchema.safeParse(p.technicalReview);
  if (!technicalReview.success) throw new ErrorDeCuraduria(`${p.exerciseId}: la revisión técnica es PENDING_PROFESSIONAL_REVIEW o REVIEWED_BY_PROFESSIONAL.`);
  return { tipo, license: license.data, technicalReview: technicalReview.data };
}

/** La identidad curadora: una cuenta administradora de BE con su rol vigente. La base vuelve a exigirlo al asociar. */
async function curadora(tx: Tx, correo: string): Promise<string> {
  const referencia = normalizarIdentificadorLocal(correo ?? '');
  if (!referencia.includes('@')) throw new ErrorDeCuraduria('Falta el correo de la cuenta curadora (--curador).');
  const metodo = await tx.metodoDeAcceso.findUnique({ where: { tipo_referencia: { tipo: 'LOCAL', referencia } }, select: { identidadId: true } });
  const rol = metodo ? await tx.rolAdministrativo.findFirst({ where: { identidadId: metodo.identidadId, estado: 'VIGENTE' }, select: { id: true } }) : null;
  if (!metodo || !rol) throw new ErrorDeCuraduria('La cuenta curadora tiene que ser una cuenta administradora de BE con el rol vigente.');
  return metodo.identidadId;
}

export async function curarImagen(
  prisma: PrismaClient,
  almacen: AlmacenDeMedios,
  p: PedidoDeImagen,
  datos: DatosDelOperador & { readonly curador: string },
): Promise<ResultadoDeImagen> {
  const d = textosDelOperador(datos);
  const v = validarImagen(p);
  // El procesamiento (CPU) va fuera de la transacción, como en API-MED-02.
  let imagen: ImagenProcesada;
  try {
    imagen = await procesarImagen(p.bytes, v.tipo);
  } catch (e) {
    const detalle = e instanceof ErrorDeApi ? (e.details as { issues?: { code: string }[] } | undefined)?.issues?.map((i) => i.code).join(', ') ?? e.code : 'no se pudo leer';
    throw new ErrorDeCuraduria(`${p.exerciseId}: la imagen no pasa la validación de BE (${detalle}).`);
  }
  const autoria = p.authorship.trim();
  const alternativo = p.altText.trim();
  return prisma.$transaction(async (tx): Promise<ResultadoDeImagen> => {
    const curadoraId = await curadora(tx, datos.curador);
    const e = await ejercicioDeTodos(tx, p.exerciseId);
    const [ultima] = await tx.$queryRaw<{ numero: number; cambio: string; sha256Original: string | null; mediaId: string | null }[]>`
      SELECT a."numero", a."cambio"::text AS "cambio", m."sha256_original" AS "sha256Original", a."medio_id"::text AS "mediaId"
        FROM "asociacion_de_imagen_de_ejercicio" a
        LEFT JOIN "medio" m ON m."id" = a."medio_id"
       WHERE a."ejercicio_id" = ${e.id}::uuid
       ORDER BY a."numero" DESC
       LIMIT 1`;
    const tamanos = {
      original: { ancho: imagen.original.ancho, alto: imagen.original.alto, bytes: imagen.original.bytes },
      guardada: { ancho: imagen.procesada.ancho, alto: imagen.procesada.alto, bytes: imagen.procesada.bytes },
    };
    if (ultima?.cambio === 'ASOCIAR' && ultima.sha256Original === imagen.original.sha256) {
      return { exerciseId: e.id, nombre: e.nombre, versionId: e.versionId, accion: 'SIN_CAMBIOS', escrito: false, mediaId: ultima.mediaId, imageVersion: ultima.numero, ...tamanos };
    }
    const numero = (ultima?.numero ?? 0) + 1;
    if (!d.escribir) return { exerciseId: e.id, nombre: e.nombre, versionId: e.versionId, accion: 'ASOCIAR', escrito: false, mediaId: null, imageVersion: numero, ...tamanos };
    const procedencia = procedenciaDe('CMD-CUR-IMAGEN', d) as Prisma.InputJsonValue;
    const medio = await tx.medio.create({
      data: {
        propietarioId: curadoraId,
        finalidad: 'REFERENCIA_DE_EJERCICIO',
        procedenciaDeImagen: p.provenance === 'AI_GENERATED' ? 'GENERADA_POR_IA' : 'APORTADA_POR_LA_PERSONA',
        autoria,
        tipoDeclarado: v.tipo,
        bytesDeclarados: p.bytes.length,
        procedencia,
      },
      select: { id: true },
    });
    await almacen.guardar(tx, medio.id, imagen.procesada.contenido);
    await tx.medio.update({
      where: { id: medio.id },
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
    await tx.asociacionDeImagenDeEjercicio.create({
      data: {
        ejercicioId: e.id,
        versionDeEjercicioId: e.versionId,
        numero,
        cambio: 'ASOCIAR',
        medioId: medio.id,
        textoAlternativo: alternativo,
        licencia: v.license as unknown as Prisma.InputJsonValue,
        revisionTecnica: REVISION_TECNICA_DESDE_API[v.technicalReview],
        autorId: curadoraId,
        procedencia,
      },
    });
    return { exerciseId: e.id, nombre: e.nombre, versionId: e.versionId, accion: 'ASOCIAR', escrito: true, mediaId: medio.id, imageVersion: numero, ...tamanos };
  }, TIEMPOS_DE_LA_CURADURIA);
}
