import {
  calcularTiempos,
  codificarOcurrencia,
  objetivosEfectivos,
  sesionesDelPlan,
  type BaseDelRelojApi,
  type ContenidoDePlanDeEntrenamiento,
  type EjercicioCitable,
  type EjercicioPropio,
  type EventoDeTiempo,
  type ImagenDeEjercicio,
  type InstantaneaDeEntrenamiento,
  type LicenciaDeImagen,
  type PrescripcionConObjetivos,
  type PrescripcionGuardada,
  type RevisionTecnica,
  type SeriePrescriptaGuardada,
  type SesionConObjetivos,
  type SesionGuardada,
  type TiemposDeSesion,
} from '@be/domain';
import { Prisma, type RevisionTecnicaDeImagen } from '@prisma/client';
import { PROCEDENCIA_HACIA_API } from '../medios/medios.service';
import { esUuid } from '../plataforma/ejecutor';
import { ejercicioDe, type ResolverDeEjercicio } from './lectura-entrenamiento';

/**
 * Modelos de lectura de WP-ENTRENAMIENTO-SERIES (DL-122 a DL-124): los objetivos por serie (API-SER-01 y 02), la imagen
 * de cada ejercicio (API-EJE-01 a 03) y los tiempos de una sesión (API-TIE-01 a 04). Son lecturas nuevas: las que lee la
 * APK 0.13.2 siguen saliendo de `lectura-entrenamiento.ts`, sin ningún campo de acá.
 */

type Tx = Prisma.TransactionClient;

// ─── Imagen del ejercicio (DL-123) ───────────────────────────────────────────────────────────────

export const REVISION_TECNICA_HACIA_API: Readonly<Record<RevisionTecnicaDeImagen, RevisionTecnica>> = {
  PENDIENTE_DE_REVISION_PROFESIONAL: 'PENDING_PROFESSIONAL_REVIEW',
  REVISADA_POR_PROFESIONAL: 'REVIEWED_BY_PROFESSIONAL',
};
export const REVISION_TECNICA_DESDE_API = Object.fromEntries(Object.entries(REVISION_TECNICA_HACIA_API).map(([b, a]) => [a, b])) as Readonly<
  Record<RevisionTecnica, RevisionTecnicaDeImagen>
>;

/** La historia de la imagen de un ejercicio a una fecha: su último cambio (asociar o retirar) y la imagen, si quedó una. */
export interface ImagenALaFecha {
  /** El número del último cambio: 0 si nunca tuvo imagen. Es el `imageVersion` que se espera al cambiarla. */
  readonly numero: number;
  readonly imagen: ImagenDeEjercicio | null;
}

interface FilaDeImagen {
  ejercicioId: string;
  numero: number;
  cambio: 'ASOCIAR' | 'RETIRAR';
  medioId: string | null;
  versionDeEjercicioId: string;
  textoAlternativo: string | null;
  licencia: unknown;
  revisionTecnica: RevisionTecnicaDeImagen | null;
  momento: Date;
  procedencia: keyof typeof PROCEDENCIA_HACIA_API | null;
  autoria: string | null;
}

/**
 * La imagen de cada ejercicio: el último cambio de su historia de solo agregar, o el último hasta `aLaFecha`. Con fecha
 * sale la imagen que estaba vigente entonces (API-SER-02 de una sesión ya registrada): reemplazarla o retirarla después
 * no reescribe lo registrado. El medio no se filtra por su estado: si ya no se puede leer, se conserva su identidad y la
 * pantalla muestra el ícono de respaldo (API-MED-03 responde 404).
 */
export async function imagenesDeEjercicios(tx: Tx, ejercicioIds: readonly string[], aLaFecha: Date | null): Promise<Map<string, ImagenALaFecha>> {
  const ids = [...new Set(ejercicioIds)].filter(esUuid).map((id) => id.toLowerCase());
  if (ids.length === 0) return new Map();
  const filas = await tx.$queryRaw<FilaDeImagen[]>`
    SELECT DISTINCT ON (a."ejercicio_id") a."ejercicio_id"::text AS "ejercicioId", a."numero", a."cambio"::text AS "cambio", a."medio_id"::text AS "medioId",
           a."version_de_ejercicio_id"::text AS "versionDeEjercicioId", a."texto_alternativo" AS "textoAlternativo", a."licencia",
           a."revision_tecnica"::text AS "revisionTecnica", a."momento_de_registro" AS "momento",
           m."procedencia_de_imagen"::text AS "procedencia", m."autoria"
      FROM "asociacion_de_imagen_de_ejercicio" a
      LEFT JOIN "medio" m ON m."id" = a."medio_id"
     WHERE a."ejercicio_id" = ANY(${ids}::uuid[]) ${aLaFecha ? Prisma.sql`AND a."momento_de_registro" <= ${aLaFecha}` : Prisma.empty}
     ORDER BY a."ejercicio_id", a."numero" DESC`;
  const r = new Map<string, ImagenALaFecha>(ids.map((id) => [id, { numero: 0, imagen: null }]));
  for (const f of filas) r.set(f.ejercicioId, { numero: f.numero, imagen: f.cambio === 'ASOCIAR' ? imagenApi(f) : null });
  return r;
}

function imagenApi(f: FilaDeImagen): ImagenDeEjercicio {
  return {
    mediaId: f.medioId as string,
    imageVersion: f.numero,
    exerciseVersionId: f.versionDeEjercicioId,
    provenance: PROCEDENCIA_HACIA_API[f.procedencia as keyof typeof PROCEDENCIA_HACIA_API],
    // La base exige la autoría de una imagen de ejercicio (medio_de_ejercicio_con_autoria) y, al asociar, el texto
    // alternativo, la licencia y la revisión técnica (asociacion_de_imagen_de_ejercicio_coherente).
    authorship: f.autoria as string,
    license: f.licencia as LicenciaDeImagen,
    technicalReview: REVISION_TECNICA_HACIA_API[f.revisionTecnica as RevisionTecnicaDeImagen],
    altText: f.textoAlternativo as string,
    associatedAt: f.momento.toISOString(),
  };
}

/** Un ejercicio propio con su imagen vigente (API-EJE-01 a 03). */
export interface FilaDeEjercicioPropio {
  readonly ejercicioId: string;
  readonly versionId: string;
  readonly nombre: string;
  readonly disponible: boolean;
  readonly momentoDeRegistro: Date;
}
export function ejercicioPropioApi(f: FilaDeEjercicioPropio, imagen: ImagenALaFecha | undefined): EjercicioPropio {
  return {
    exerciseId: f.ejercicioId,
    versionId: f.versionId,
    name: f.nombre,
    available: f.disponible,
    createdAt: f.momentoDeRegistro.toISOString(),
    imageVersion: imagen?.numero ?? 0,
    image: imagen?.imagen ?? null,
  };
}

// ─── Objetivos por serie (DL-122) ────────────────────────────────────────────────────────────────

/** Lo que la serie declara, con sus tres estados: solo las claves que se guardaron. Ausente hereda; `null` quita. */
function declaradoEnLaSerie(s: SeriePrescriptaGuardada): Pick<SeriePrescriptaGuardada, 'rir' | 'suggestedLoad' | 'restSeconds'> {
  return {
    ...(s.rir !== undefined ? { rir: s.rir } : {}),
    ...(s.suggestedLoad !== undefined ? { suggestedLoad: s.suggestedLoad } : {}),
    ...(s.restSeconds !== undefined ? { restSeconds: s.restSeconds } : {}),
  };
}

/**
 * Una prescripción con el objetivo efectivo de cada serie, resuelto con `objetivosEfectivos`: la misma función que usan
 * la vista previa del editor y la APK. `null` es «sin objetivo», nunca cero. La imagen es la del ejercicio por su
 * identidad (la que congeló la instantánea), nunca por coincidencia de nombre.
 */
export function prescripcionConObjetivosApi(
  p: PrescripcionGuardada,
  orden: number,
  resolver: ResolverDeEjercicio,
  imagenes: ReadonlyMap<string, ImagenALaFecha>,
): PrescripcionConObjetivos {
  const e = ejercicioDe(resolver, p.exerciseVersionId);
  const objetivos = objetivosEfectivos(p);
  return {
    prescriptionId: p.prescriptionId,
    order: orden,
    exerciseId: e.exerciseId,
    exerciseVersionId: p.exerciseVersionId,
    exerciseName: e.exerciseName,
    image: imagenes.get(e.exerciseId.toLowerCase())?.imagen ?? null,
    sets: p.sets.map((s, i) => {
      const o = objetivos[i]!;
      return {
        setIndex: o.setIndex,
        note: s.note,
        ...declaradoEnLaSerie(s),
        target: { repetitions: o.repetitions, rir: o.rir, suggestedLoad: o.suggestedLoad, restSeconds: o.restSeconds },
        targetOrigin: { rir: o.origin.rir, suggestedLoad: o.origin.suggestedLoad, restSeconds: o.origin.restSeconds },
      };
    }),
    intensity: p.intensity,
    suggestedLoad: p.suggestedLoad,
    restSeconds: p.restSeconds ?? null,
    loadBasis: p.loadBasis ?? null,
    repetitionBasis: p.repetitionBasis ?? null,
    professionalParameters: p.professionalParameters.map((q) => ({ label: q.label, value: q.value, unit: q.unit })),
    note: p.note,
  };
}

export function sesionConObjetivosApi(s: SesionGuardada, orden: number, resolver: ResolverDeEjercicio, imagenes: ReadonlyMap<string, ImagenALaFecha>): SesionConObjetivos {
  return {
    sessionId: s.sessionId,
    label: s.label,
    order: orden,
    instructions: s.instructions,
    prescriptions: s.prescriptions.map((p, i) => prescripcionConObjetivosApi(p, i + 1, resolver, imagenes)),
  };
}

export function bloquesConObjetivosApi(contenido: ContenidoDePlanDeEntrenamiento, resolver: ResolverDeEjercicio, imagenes: ReadonlyMap<string, ImagenALaFecha>) {
  return contenido.blocks.map((b, i) => ({
    blockId: b.blockId,
    label: b.label,
    order: i + 1,
    purpose: b.purpose,
    microcycles: b.microcycles.map((m, j) => ({
      microcycleId: m.microcycleId,
      label: m.label,
      order: j + 1,
      purpose: m.purpose,
      sessions: m.sessions.map((s, k) => sesionConObjetivosApi(s, k + 1, resolver, imagenes)),
    })),
    sessions: b.sessions.map((s, k) => sesionConObjetivosApi(s, k + 1, resolver, imagenes)),
  }));
}

/** Los ejercicios (por identidad) que citan las sesiones dadas: los que llevan imagen. */
export function ejerciciosCitados(sesiones: readonly SesionGuardada[], resolver: ResolverDeEjercicio): string[] {
  return [...new Set(sesiones.flatMap((s) => s.prescriptions.map((p) => ejercicioDe(resolver, p.exerciseVersionId).exerciseId)))];
}

/** La sesión de una instantánea, con su orden dentro de su bloque o microciclo (como `sesionDeOcurrenciaApi`). */
export function sesionDeLaInstantanea(i: InstantaneaDeEntrenamiento, sesionId: string): { readonly sesion: SesionGuardada; readonly orden: number } | null {
  const u = sesionesDelPlan(i.contenido).find((s) => s.sesion.sessionId === sesionId);
  if (!u) return null;
  return { sesion: u.sesion, orden: (u.microciclo ? u.microciclo.sessions : u.bloque.sessions).indexOf(u.sesion) + 1 };
}

/** Las filas del catálogo como citables (la misma conversión que usan los servicios de planes y plantillas). */
export function aCitables(filas: ReadonlyMap<string, { ejercicioId: string; nombre: string; disponible: boolean }>): Map<string, EjercicioCitable> {
  return new Map([...filas].map(([k, f]) => [k, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}

// ─── Tiempos de la sesión (DL-124) ───────────────────────────────────────────────────────────────

/**
 * El descanso recomendado histórico de una serie: el efectivo de esa prescripción e índice en la instantánea, con
 * `objetivosEfectivos`. `null` si la prescripción no tiene esa serie o si la serie no tiene descanso recomendado.
 */
export function descansoRecomendado(sesion: SesionGuardada | null, prescriptionId: string, setIndex: number): number | null {
  const p = sesion?.prescriptions.find((x) => x.prescriptionId === prescriptionId);
  return p ? (objetivosEfectivos(p)[setIndex - 1]?.restSeconds ?? null) : null;
}

/** Un evento de tiempo guardado: el evento validado, el recomendado que se guardó con él y cuándo llegó. */
export interface FilaDeEventoDeTiempo {
  readonly contenido: Prisma.JsonValue;
  readonly descansoRecomendadoSegundos: number | null;
  readonly momentoDeRecepcion: Date;
}

export async function eventosDeTiempo(tx: Tx, borradorId: string): Promise<FilaDeEventoDeTiempo[]> {
  const filas = await tx.eventoDeTiempoDeEntrenamiento.findMany({
    where: { borradorId },
    orderBy: { secuencia: 'asc' },
    select: { contenido: true, descansoRecomendadoSegundos: true, momentoDeRecepcion: true },
  });
  return filas.map((f) => ({ ...f, contenido: conBaseDelReloj(f.contenido) }));
}

/**
 * Un evento guardado antes de que el instante declarara la base de su reloj (solo en bases locales: la tabla todavía no se
 * desplegó) se tomó con `performance.now()`, el reloj del proceso. Se lee con esa base: así cumple el contrato vigente
 * (`clock` es obligatorio) y conserva la tolerancia con la que se midió, sin pasar por un reloj que cuenta el reposo. Lo
 * guardado no se toca: la tabla es de solo agregar (migración 20261006130100).
 */
function conBaseDelReloj(contenido: Prisma.JsonValue): Prisma.JsonValue {
  const evento = contenido as { at?: { monotonic?: Record<string, unknown> | null } };
  const monotonic = evento.at?.monotonic;
  if (!monotonic || Object.hasOwn(monotonic, 'clock')) return contenido;
  const clock: BaseDelRelojApi = 'PROCESS_MONOTONIC';
  return { ...evento, at: { ...evento.at, monotonic: { ...monotonic, clock } } } as Prisma.JsonValue;
}

/**
 * Los tiempos de un borrador o de su ejecución, con su calidad y los eventos que los sostienen (API-TIE-01 a 03). El
 * descanso trae el recomendado que se guardó al iniciarlo, de la instantánea: la diferencia es contra lo planificado
 * entonces, aunque el plan cambie después. `receivedAt` es la llegada al servidor: no reemplaza al reloj de la sesión.
 */
export function tiemposDeSesionApi(
  b: { readonly id: string; readonly versionDePlanId: string; readonly sesionPlanificadaId: string; readonly fechaLocal: Date },
  executionId: string | null,
  filas: readonly FilaDeEventoDeTiempo[],
): TiemposDeSesion {
  const eventos = filas.map((f) => f.contenido as unknown as EventoDeTiempo);
  const recomendados = new Map<string, number | null>();
  filas.forEach((f, i) => {
    const e = eventos[i]!;
    if (e.type === 'REST_STARTED') recomendados.set(`${e.prescriptionId}|${e.setIndex}`, f.descansoRecomendadoSegundos);
  });
  return {
    ...calcularTiempos(eventos, (prescriptionId, setIndex) => recomendados.get(`${prescriptionId}|${setIndex}`) ?? null),
    draftId: b.id,
    occurrenceId: codificarOcurrencia({ versionDePlanId: b.versionDePlanId, sesionPlanificadaId: b.sesionPlanificadaId, fechaLocal: b.fechaLocal.toISOString().slice(0, 10) }),
    executionId,
    events: filas.map((f, i) => ({ event: eventos[i]!, receivedAt: f.momentoDeRecepcion.toISOString() })),
  };
}
