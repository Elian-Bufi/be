/**
 * DL-102 (PF-02): respuestas de formulario citadas como evidencia de una evaluación de entrenamiento.
 *
 * Una cita es una **referencia**, no una copia: la declaración de la persona sigue siendo `SELF_REPORTED` y no se vuelve
 * observación del profesional (CA-FOR-04 del Plan Funcional). Se valida al crear la evaluación y queda fija:
 * - la respuesta es del **mismo asesorado** y responde a una Solicitud del **mismo profesional**, de alcance
 *   **ENTRENAMIENTO**. Es la misma condición con la que FRM-05 le deja leerla (autor de la Solicitud y PDP del alcance),
 *   y la evaluación ya pasó el PDP de ENTRENAMIENTO para ese par. Por eso quien puede leer la evaluación puede leer lo
 *   citado, y cuando deja de poder (B2, A3, vínculo), la evaluación entera da 404: no hay un aviso por cita;
 * - el campo está respondido en la **versión vigente al citar**, que es la que se guarda. Una rectificación posterior no
 *   cambia lo que fundó la evaluación; la lectura avisa que existe (`laterVersionExists`, V-07).
 *
 * «Vigente al citar» es la vigente **en la lectura de esta transacción**. Cada respuesta se lee una sola vez, así que
 * todas las citas de una misma respuesta quedan en la misma versión. Si una rectificación concurrente se confirma entre
 * esa lectura y el commit, la cita nace apuntando a la versión anterior y la primera lectura ya dice
 * `laterVersionExists: true`, que es el aviso correcto. Por eso la base no exige «vigente»: con READ COMMITTED, esa
 * carrera haría fallar una escritura válida.
 *
 * Una cita inválida devuelve el mismo 422 exista o no la respuesta: no se revela si un identificador es de otra persona.
 * La base repite las reglas de pertenencia (trigger `be_cita_de_respuesta_en_evaluacion_insertar`).
 *
 * **Precondición de versión** (auditoría del #102). Si la cita trae `expectedVersion` (la versión que el profesional vio
 * al elegirla) y la versión vigente en esta misma lectura es otra, la API responde 409 `VERSION_CONFLICT` y la
 * transacción no escribe ni la evaluación ni ninguna cita. Así una rectificación entre la carga de la pantalla y el envío
 * no reemplaza en silencio lo que el profesional eligió. El control va después del PDP y de la pertenencia: sobre una
 * respuesta ajena o inexistente sigue saliendo el 422 neutral, nunca un 409 que revele que existe.
 */
import { CodigoDeError, resolverVistaEfectiva, type CitaDeRespuestaDeFormulario, type RelacionDeCorreccion, type RespuestaCitada } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { ErrorDeApi } from '../http/errores';
import { camposPorCodigo, terminalVersion } from '../formularios/lectura-formularios';
import { esUuid } from './ejecutor';

type Tx = Prisma.TransactionClient;

interface RespuestaAlmacenada {
  fieldCode: string;
  value: string | number | boolean;
  unit?: string | null;
}

const INCLUIR_RESPUESTA = { solicitud: true, templateVersion: true, rectificaciones: true } as const;

const token = (n: number): string => `v${n}`;

function invalida(indice: number): ErrorDeApi {
  return new ErrorDeApi(422, CodigoDeError.TRAINING_EVALUATION_INVALID, 'Una respuesta citada no puede usarse como evidencia de esta evaluación.', {
    issues: [{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: `formResponseReferences[${indice}]` }],
  });
}

function versionCambiada(indice: number): ErrorDeApi {
  return new ErrorDeApi(409, CodigoDeError.VERSION_CONFLICT, 'Una respuesta citada cambió desde que la viste: actualizá el contexto y revisá tu selección.', {
    issues: [{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: `formResponseReferences[${indice}].expectedVersion` }],
  });
}

function respuestasDe(contenido: unknown): RespuestaAlmacenada[] {
  return (contenido as { answers: RespuestaAlmacenada[] }).answers;
}

/** Lo que se guarda de una cita válida: la respuesta, la rectificación vigente al citar (o `null`) y el campo. */
export interface CitaValidada {
  respuestaId: string;
  rectificacionId: string | null;
  codigoDeCampo: string;
}

/** Una respuesta leída una vez: `null` si no existe o no se puede citar en esta evaluación; si no, su versión vigente. */
type RespuestaCitable = { respuestaId: string; rectificacionId: string | null; version: number; campos: ReadonlySet<string> } | null;

/**
 * Valida las citas de una evaluación nueva, en orden. Lanza 422 `TRAINING_EVALUATION_INVALID` con el índice de la primera
 * cita que no cumple. Una misma respuesta y campo no se cita dos veces; la repetición se compara con el id **canónico** de
 * la respuesta, después de comprobar la pertenencia, así un mismo UUID con otras mayúsculas no la esquiva y el orden de
 * los controles no revela nada de una respuesta ajena.
 */
export async function validarCitas(tx: Tx, citas: readonly CitaDeRespuestaDeFormulario[], par: { profesionalId: string; asesoradoId: string }): Promise<CitaValidada[]> {
  const leidas = new Map<string, RespuestaCitable>();
  const vistas = new Set<string>();
  const validadas: CitaValidada[] = [];
  for (const [i, cita] of citas.entries()) {
    if (!esUuid(cita.formResponseId)) throw invalida(i);
    const id = cita.formResponseId.toLowerCase();
    if (!leidas.has(id)) leidas.set(id, await leerCitable(tx, id, par));
    const r = leidas.get(id);
    if (!r) throw invalida(i);
    if (cita.expectedVersion !== undefined && cita.expectedVersion !== token(r.version)) throw versionCambiada(i);
    const clave = `${r.respuestaId}#${cita.fieldCode}`;
    if (vistas.has(clave) || !r.campos.has(cita.fieldCode)) throw invalida(i);
    vistas.add(clave);
    validadas.push({ respuestaId: r.respuestaId, rectificacionId: r.rectificacionId, codigoDeCampo: cita.fieldCode });
  }
  return validadas;
}

async function leerCitable(tx: Tx, id: string, par: { profesionalId: string; asesoradoId: string }): Promise<RespuestaCitable> {
  const r = await tx.respuestaDeFormulario.findUnique({ where: { id }, include: INCLUIR_RESPUESTA });
  if (!r || r.asesoradoId !== par.asesoradoId || r.solicitud.profesionalId !== par.profesionalId || r.solicitud.alcance !== 'ENTRENAMIENTO') return null;
  const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
  const vista = resolverVistaEfectiva(r.id, relaciones);
  if (vista.tipo === 'NO_RESOLUBLE') return null;
  const rectificacion = vista.tipo === 'CORREGIDA' ? r.rectificaciones.find((c) => c.id === vista.id) ?? null : null;
  const vigente = respuestasDe(rectificacion ? rectificacion.contenido : r.contenido);
  return { respuestaId: r.id, rectificacionId: rectificacion?.id ?? null, version: rectificacion ? rectificacion.version : r.version, campos: new Set(vigente.map((a) => a.fieldCode)) };
}

/**
 * Las citas de varias evaluaciones, resueltas y en el orden en que se citaron. Una evaluación sin citas da `[]`.
 *
 * El valor y la unidad son los de la versión citada; la unidad es la que declaró la persona, y si no declaró ninguna,
 * la del campo de la plantilla. El rótulo sale de la versión de plantilla de la Solicitud, que es de solo agregado.
 * `laterVersionExists` compara con la terminal de la cadena de rectificaciones, que es lineal por construcción: la base
 * impide ramas y ciclos. Si alguna vez no lo fuera, `terminalVersion` devolvería la del original y el aviso daría `false`.
 */
export async function citasResueltas(tx: Tx, evaluacionIds: readonly string[]): Promise<Map<string, RespuestaCitada[]>> {
  const porEvaluacion = new Map<string, RespuestaCitada[]>(evaluacionIds.map((id) => [id, []]));
  if (evaluacionIds.length === 0) return porEvaluacion;
  const filas = await tx.citaDeRespuestaEnEvaluacionDeEntrenamiento.findMany({
    where: { evaluacionId: { in: [...evaluacionIds] } },
    orderBy: [{ evaluacionId: 'asc' }, { orden: 'asc' }],
    include: { respuesta: { include: INCLUIR_RESPUESTA }, rectificacion: true },
  });
  for (const f of filas) {
    const citada = f.rectificacion ?? f.respuesta;
    const respuesta = respuestasDe(citada.contenido).find((a) => a.fieldCode === f.codigoDeCampo);
    const campo = camposPorCodigo(f.respuesta.templateVersion.contenido).get(f.codigoDeCampo);
    // La API validó ambos al citar y las filas son de solo agregado: si faltan, la base se alteró por fuera.
    if (!respuesta || !campo) throw new Error(`BE: la cita ${f.id} no se puede resolver (DL-102).`);
    porEvaluacion.get(f.evaluacionId)!.push({
      formResponseId: f.respuestaId,
      formRequestId: f.respuesta.solicitudId,
      fieldCode: f.codigoDeCampo,
      label: campo.label,
      value: respuesta.value,
      unit: respuesta.unit ?? campo.unit,
      provenance: 'SELF_REPORTED',
      citedVersion: token(citada.version),
      answeredAt: citada.momentoDeRegistro.toISOString(),
      laterVersionExists: terminalVersion(f.respuesta) > citada.version,
    });
  }
  return porEvaluacion;
}
