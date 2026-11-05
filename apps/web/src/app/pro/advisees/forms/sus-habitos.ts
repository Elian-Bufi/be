/**
 * «Sus hábitos» en el website del profesional (WP-FORMULARIOS-RONDA-2, FR-10; DL-165 D-9; §4.4 del paquete), sin React,
 * probado en `apps/web/test/sus-habitos.test.mjs`. Lo que la pantalla muestra sale de API-HBT-05, que responde solo si la
 * persona le comparte sus hábitos a este profesional y el PDP lo permite hoy; si no, el 404 de lo inexistente.
 * - **La tarjeta**, en Información: desde cuándo los comparte, «Declarado por la persona» una vez, cuándo se actualizaron
 *   y de dónde («en un formulario» o «en Mis hábitos»: nunca de qué formulario ni de qué área), y lo que declaró, pregunta
 *   por pregunta, en el orden de la parte. Lo que no contó no se lista: no es un pedido de este profesional.
 * - **«Cargar con la persona»** solo pregunta por los hábitos si la versión trae la parte «Tus hábitos», no hay nada
 *   cargado esperando confirmación y todavía no se tocó nada; y precarga solo lo que la Solicitud pide de esa parte, con
 *   lo que la persona le comparte a él (`precargaDeHabitos`, del dominio). Sin autorización, nada: el profesional de un
 *   área nunca ve por esta vía lo que la persona respondió en el formulario de otra.
 * Las fechas llegan ya formateadas (`fecha`): el módulo no depende de cómo las escribe la pantalla.
 */
import {
  COPY_HABITOS,
  precargaDeHabitos,
  traeLaParteDeHabitos,
  type CampoDePlantillaV2,
  type HabitosCompartidosResponse,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
  type SolicitudAValidar,
  type ValorDeRespuestaV2,
} from '@be/domain';

const H = COPY_HABITOS.web;

/** Lo que devuelve API-HBT-05 cuando la persona le comparte sus hábitos a este profesional. */
export type HabitosQueComparte = HabitosCompartidosResponse['data'];

/** Una pregunta de la parte que la persona respondió, con su campo (para decir el valor con las etiquetas). */
export interface HabitoDeclarado {
  readonly codigo: string;
  readonly pregunta: string;
  readonly campo: CampoDePlantillaV2;
  readonly valor: ValorDeRespuestaV2;
}

export interface TarjetaDeSusHabitos {
  /** «Compartido por la persona el …». */
  readonly compartido: string;
  /** «Actualizados el …, en un formulario.»; `null` si todavía no contó nada. */
  readonly actualizados: string | null;
  /** Lo que declaró, en el orden de la parte; vacío si todavía no contó sus hábitos o no contó nada. */
  readonly habitos: readonly HabitoDeclarado[];
}

/** La tarjeta «Sus hábitos» con lo que devolvió API-HBT-05. Una respuesta de una pregunta que la parte ya no tiene no se muestra. */
export function tarjetaDeSusHabitos(datos: HabitosQueComparte, fecha: (iso: string) => string): TarjetaDeSusHabitos {
  const vigente = datos.current;
  const respuestas = new Map((vigente?.answers ?? []).map((a) => [a.fieldCode, a.answer] as const));
  const habitos = datos.section.fields.flatMap((campo): HabitoDeclarado[] => {
    const valor = respuestas.get(campo.fieldCode);
    return valor ? [{ codigo: campo.fieldCode, pregunta: campo.label, campo, valor }] : [];
  });
  return {
    compartido: H.compartidoEl(fecha(datos.sharedSince)),
    actualizados: vigente && habitos.length > 0 ? H.actualizadoEl(fecha(vigente.recordedAt), vigente.origin) : null,
    habitos,
  };
}

/**
 * Si «Cargar con la persona» le pregunta a la API por los hábitos que la persona le comparte (API-HBT-05): solo si la
 * versión del formulario trae la parte «Tus hábitos», no hay nada cargado esperando confirmación (lo cargado se respeta)
 * y el profesional todavía no tocó nada (lo escrito no se pisa). Si la versión no trae la parte, ni se pregunta.
 */
export function preguntaPorLosHabitosAlCargar(p: { readonly secciones: readonly SeccionDePlantillaV2[]; readonly hayPropuesta: boolean; readonly tocado: boolean }): boolean {
  return !p.hayPropuesta && !p.tocado && traeLaParteDeHabitos(p.secciones);
}

/**
 * Lo que «Cargar con la persona» precarga con lo que devolvió API-HBT-05: lo que la Solicitud pide de la parte «Tus
 * hábitos», con lo vigente que la persona le comparte. `null` si no hay nada que precargar (todavía no contó nada, o la
 * Solicitud no pide nada de lo que contó): entonces no se precarga ni se dice nada.
 */
export function precargaAlCargar(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: Pick<SolicitudAValidar, 'requestedFieldCodes'>,
  datos: HabitosQueComparte | null,
): { readonly respuestas: readonly RespuestaDeCampoV2Entrada[]; readonly declaradosEl: string } | null {
  if (!datos?.current) return null;
  const respuestas = precargaDeHabitos(secciones, solicitud, datos.current.answers);
  return respuestas.length > 0 ? { respuestas, declaradosEl: datos.current.recordedAt } : null;
}
