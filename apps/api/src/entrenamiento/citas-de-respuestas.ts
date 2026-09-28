/**
 * DL-102 (PF-02): respuestas de formulario citadas como evidencia de una evaluación de entrenamiento.
 *
 * Una cita es una **referencia**, no una copia: la declaración de la persona sigue siendo `SELF_REPORTED` y no se vuelve
 * observación del profesional (CA-FOR-04 del Plan Funcional). Se valida al crear la evaluación y queda fija:
 * - la respuesta es del **mismo asesorado** y responde a una Solicitud del **mismo profesional**, de alcance
 *   **ENTRENAMIENTO**. Es la misma condición con la que FRM-05 le deja leerla (autor de la Solicitud y PDP del alcance),
 *   y la evaluación ya pasó el PDP de ENTRENAMIENTO para ese par. Por eso quien puede leer la evaluación puede leer lo citado;
 * - el campo está respondido en la **versión vigente al citar**, que es la que se guarda. Una rectificación posterior no
 *   cambia lo que fundó la evaluación; la lectura avisa que existe (`laterVersionExists`, V-07).
 *
 * Una cita inválida devuelve el mismo 422 exista o no la respuesta: no se revela si un identificador es de otra persona.
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
}

const INCLUIR_RESPUESTA = { solicitud: true, templateVersion: true, rectificaciones: true } as const;

const token = (n: number): string => `v${n}`;

function invalida(indice: number): ErrorDeApi {
  return new ErrorDeApi(422, CodigoDeError.TRAINING_EVALUATION_INVALID, 'Una respuesta citada no puede usarse como evidencia de esta evaluación.', {
    issues: [{ code: 'FORM_RESPONSE_REFERENCE_INVALID', path: `formResponseReferences[${indice}]` }],
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

/**
 * Valida las citas de una evaluación nueva, en orden. Lanza 422 `TRAINING_EVALUATION_INVALID` con el índice de la primera
 * cita que no cumple. Una misma respuesta y campo no se cita dos veces.
 */
export async function validarCitas(tx: Tx, citas: readonly CitaDeRespuestaDeFormulario[], par: { profesionalId: string; asesoradoId: string }): Promise<CitaValidada[]> {
  const vistas = new Set<string>();
  const validadas: CitaValidada[] = [];
  for (const [i, cita] of citas.entries()) {
    const clave = `${cita.formResponseId}#${cita.fieldCode}`;
    if (vistas.has(clave)) throw invalida(i);
    vistas.add(clave);
    const r = esUuid(cita.formResponseId) ? await tx.respuestaDeFormulario.findUnique({ where: { id: cita.formResponseId }, include: INCLUIR_RESPUESTA }) : null;
    if (!r || r.asesoradoId !== par.asesoradoId || r.solicitud.profesionalId !== par.profesionalId || r.solicitud.alcance !== 'ENTRENAMIENTO') throw invalida(i);
    const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
    const vista = resolverVistaEfectiva(r.id, relaciones);
    if (vista.tipo === 'NO_RESOLUBLE') throw invalida(i);
    const rectificacion = vista.tipo === 'CORREGIDA' ? r.rectificaciones.find((c) => c.id === vista.id) ?? null : null;
    const vigente = respuestasDe(rectificacion ? rectificacion.contenido : r.contenido);
    if (!vigente.some((a) => a.fieldCode === cita.fieldCode)) throw invalida(i);
    validadas.push({ respuestaId: r.id, rectificacionId: rectificacion?.id ?? null, codigoDeCampo: cita.fieldCode });
  }
  return validadas;
}

/** Las citas de varias evaluaciones, resueltas y en el orden en que se citaron. Una evaluación sin citas da `[]`. */
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
      unit: campo.unit,
      provenance: 'SELF_REPORTED',
      citedVersion: token(citada.version),
      answeredAt: citada.momentoDeRegistro.toISOString(),
      laterVersionExists: terminalVersion(f.respuesta) > citada.version,
    });
  }
  return porEvaluacion;
}
