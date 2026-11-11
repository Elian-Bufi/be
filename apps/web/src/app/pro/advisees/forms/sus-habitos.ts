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
 * - **Ronda 2.1 (DL-165 D-17 nueva): «Pedir acceso a sus hábitos».** Si la persona no se los comparte (API-HBT-05 da el
 *   404) pero el PDP lo deja acompañarla (API-HBT-07 responde), la tarjeta lo dice sin presión, y ofrece pedirle acceso
 *   (API-HBT-06): le llega como novedad importante, y lo decide ella. El límite (D-24): uno pendiente por vez, y volver a
 *   pedir recién a los 7 días del último; la tarjeta dice desde cuándo. No dice qué respondió la persona: si los ve, lo dice
 *   API-HBT-05. Si API-HBT-07 también da el 404, no hay tarjeta ni rastro.
 * Las fechas llegan ya formateadas (`fecha`): el módulo no depende de cómo las escribe la pantalla.
 */
import {
  COPY_HABITOS,
  ETIQUETA_DE_ALCANCE,
  precargaDeHabitos,
  traeLaParteDeHabitos,
  type Alcance,
  type CampoDePlantillaV2,
  type HabitosCompartidosResponse,
  type HabitosParaElProfesionalResponse,
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

// ─── Ronda 2.1 · «Pedir acceso a sus hábitos» (API-HBT-06 y 07) ─────────────────────────────────

/** Lo que devuelve API-HBT-07: lo que este profesional sabe de los hábitos de la persona, sin ver ninguno. */
export type LoQueSabeDeSusHabitos = HabitosParaElProfesionalResponse['data'];

export interface TarjetaSinAcceso {
  /** Lo que se dice, en orden: que no se los comparte, su último pedido (si hay) y desde cuándo puede volver a pedir. */
  readonly lineas: readonly string[];
  /** El botón: «Pedir acceso a sus hábitos», «Volver a pedir acceso» o ninguno (pedido hace menos de 7 días). */
  readonly boton: string | null;
  /** Qué le llega a la persona, junto al botón: solo si se puede pedir. */
  readonly queLeLlega: string | null;
}

/**
 * La tarjeta cuando la persona no le comparte sus hábitos (API-HBT-05 dio el 404) y API-HBT-07 respondió. `null` si
 * API-HBT-07 dice que los recibe (se cruzó con un cambio de la persona: se vuelve a leer, no se muestra nada a medias).
 * De su pedido dice cuándo lo hizo y si espera respuesta, nunca qué respondió la persona.
 */
export function tarjetaSinAcceso(datos: LoQueSabeDeSusHabitos, fecha: (iso: string) => string): TarjetaSinAcceso | null {
  if (datos.receives) return null;
  const lineas: string[] = [H.noLosComparte];
  const pedido = datos.accessRequest;
  if (pedido) lineas.push(pedido.status === 'PENDING' ? H.pedidoPendiente(fecha(pedido.requestedAt)) : H.pedidoRespondido(fecha(pedido.requestedAt)));
  if (!datos.canRequestAccess && datos.canRequestAccessFrom) lineas.push(H.volverAPedirDesde(fecha(datos.canRequestAccessFrom)));
  const boton = datos.canRequestAccess ? (pedido ? H.volverAPedirAcceso : H.pedirAcceso) : null;
  return { lineas, boton, queLeLlega: boton ? H.queLeLlega : null };
}

/**
 * Desde qué área sale el pedido (API-HBT-06 pide una en la que la acompaña hoy): la del área de donde llegó el profesional,
 * si es una de las suyas; si no, la primera de `scopes`. Con más de una y sin saber desde cuál llegó, se dice desde cuál
 * (`aviso`): el «para qué» que lee la persona depende del área.
 */
export function areaDelPedidoDeAcceso(scopes: readonly Alcance[], desde: Alcance | null): { readonly area: Alcance; readonly aviso: string | null } {
  if (desde && scopes.includes(desde)) return { area: desde, aviso: null };
  const area = scopes[0]!;
  return { area, aviso: scopes.length > 1 ? H.pedidoDesdeElArea(ETIQUETA_DE_ALCANCE[area]) : null };
}

/** Qué hacer con la respuesta de API-HBT-06. */
export type TrasPedirAcceso = 'enviado' | 'ya-los-comparte' | 'muy-pronto' | 'sin-acceso' | 'otro';

export function trasPedirAcceso(r: { readonly ok: true } | { readonly ok: false; readonly tipo: string; readonly codigo?: string }): TrasPedirAcceso {
  if (r.ok) return 'enviado';
  if (r.tipo !== 'API') return 'otro';
  if (r.codigo === 'HABITS_ALREADY_SHARED') return 'ya-los-comparte';
  if (r.codigo === 'HABITS_ACCESS_REQUEST_TOO_SOON') return 'muy-pronto';
  if (r.codigo === 'RESOURCE_NOT_FOUND') return 'sin-acceso';
  return 'otro';
}
