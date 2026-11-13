/**
 * ED-40 (WP-EDITORES-PROFESIONAL) · «Pedir información», compacto, sin React: la cuenta de cada parte plegada, «Pedir
 * todas» y «Ninguna» por parte, el resumen fijo junto al botón, lo que le llega a la persona y el aviso de un pedido
 * pendiente del mismo formulario.
 *
 * - **Plegar no cambia lo que se envía** (TEST-EDP-033): lo pedido vive aparte de lo que se ve; estas funciones solo
 *   cuentan o devuelven la lista nueva.
 * - **Plegar no oculta una obligatoria** (TEST-EDP-034): la cuenta de cada parte dice cuántas obligatorias tiene pedidas
 *   y cuántas se suman solo si corresponde.
 * - **El pedido pendiente se dice, no se impide** (TEST-EDP-058): se puede enviar igual.
 */

/** Lo mínimo de una pregunta que usa la cuenta. */
export interface PreguntaDeLaParte {
  readonly fieldCode: string;
  /** La condición para que aparezca (DL-164 D-2); `null` si aparece siempre. */
  readonly showIf: unknown | null;
}

export interface CuentaDeLaParte {
  readonly total: number;
  readonly pedidas: number;
  readonly obligatorias: number;
  readonly condicionales: number;
}

/** Cuántas preguntas de la parte se piden, cuántas de esas son obligatorias y cuántas se suman solo si corresponde. */
export function cuentaDeLaParte(campos: readonly PreguntaDeLaParte[], pedidas: readonly string[], requeridas: readonly string[]): CuentaDeLaParte {
  const pedidasAca = campos.filter((c) => pedidas.includes(c.fieldCode));
  return {
    total: campos.length,
    pedidas: pedidasAca.length,
    obligatorias: pedidasAca.filter((c) => requeridas.includes(c.fieldCode)).length,
    condicionales: pedidasAca.filter((c) => c.showIf !== null && c.showIf !== undefined).length,
  };
}

/** «12 de 12 pedidas · 3 obligatorias · 1 que se suma si corresponde». Lo que es cero no se dice, salvo lo pedido. */
export function cuentaEnPalabras(c: CuentaDeLaParte): string {
  return [
    `${c.pedidas} de ${c.total} ${c.total === 1 ? 'pedida' : 'pedidas'}`,
    ...(c.obligatorias > 0 ? [`${c.obligatorias} ${c.obligatorias === 1 ? 'obligatoria' : 'obligatorias'}`] : []),
    ...(c.condicionales > 0 ? [`${c.condicionales} ${c.condicionales === 1 ? 'que se suma si corresponde' : 'que se suman si corresponde'}`] : []),
  ].join(' · ');
}

/** «Pedir todas» de una parte: las suma a lo pedido, sin tocar las de otras partes ni repetir. */
export function pedirTodas(pedidas: readonly string[], campos: readonly PreguntaDeLaParte[]): readonly string[] {
  return [...pedidas, ...campos.map((c) => c.fieldCode).filter((c) => !pedidas.includes(c))];
}

/** «Ninguna» de una parte: las saca de lo pedido, sin tocar las de otras partes. */
export function ninguna(pedidas: readonly string[], campos: readonly PreguntaDeLaParte[]): readonly string[] {
  const deLaParte = new Set(campos.map((c) => c.fieldCode));
  return pedidas.filter((c) => !deLaParte.has(c));
}

/**
 * Las filas de una parte a la vista. Abierta, todas. Plegada, solo las que la plantilla no trae pedidas (el embarazo,
 * DL-165 D-4), para que su aviso se lea igual; quedan a la vista también después de marcarlas, así la casilla recién
 * tocada no sale de la pantalla con el foco adentro.
 */
export function filasALaVista<T extends { readonly requestedByDefault?: boolean | undefined }>(campos: readonly T[], abierta: boolean): readonly T[] {
  return abierta ? campos : campos.filter((c) => c.requestedByDefault === false);
}

/** El resumen fijo junto a «Enviar solicitud»: «Vas a pedir 49 preguntas (19 obligatorias) para Nutrición. Pedir no amplía tu acceso.» */
export function resumenDelPedido(preguntas: number, obligatorias: number, area: string | null): string {
  const cuantas = preguntas === 1 ? '1 pregunta' : `${preguntas} preguntas`;
  const cuantasObligatorias = obligatorias === 0 ? 'ninguna obligatoria' : obligatorias === 1 ? '1 obligatoria' : `${obligatorias} obligatorias`;
  return `Vas a pedir ${cuantas} (${cuantasObligatorias})${area ? ` para ${area}` : ''}. Pedir no amplía tu acceso.`;
}

/** La línea de lo que le llega a la persona. */
export function loQueLeLlega(persona: string | null, formulario: string, preguntas: number, partes: number): string {
  const cuantas = preguntas === 1 ? '1 pregunta' : `${preguntas} preguntas`;
  return `Lo que le llega a ${persona ?? 'la persona'}: «${formulario}», con ${cuantas}${partes > 1 ? ` en ${partes} partes` : ''} y el para qué que escribas. Lo ve al abrir «Información» en su teléfono.`;
}

/** Lo mínimo de una solicitud ya enviada que usa el aviso. */
export interface SolicitudEnviada {
  readonly templateId: string;
  readonly templateName: string;
  readonly status: string;
  readonly createdAt: string;
}

/** El pedido más reciente del mismo formulario que todavía no tiene respuesta, o `null`. */
export function pedidoPendiente<S extends SolicitudEnviada>(solicitudes: readonly S[], templateId: string): S | null {
  const pendientes = solicitudes.filter((s) => s.templateId === templateId && s.status === 'PENDING');
  if (pendientes.length === 0) return null;
  return pendientes.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
}

/** «Ya hay un pedido de «Cómo comés hoy» del 3/11 que todavía no respondió. Podés enviar otro igual.» */
export function avisoDelPendiente(formulario: string, dia: string): string {
  return `Ya hay un pedido de «${formulario}» del ${dia} que todavía no respondió. Podés enviar otro igual.`;
}

export const COPY_PARTES = {
  pedirTodas: 'Pedir todas',
  ninguna: 'Ninguna',
  verTodas: 'Ver todas',
  plegarTodas: 'Plegar todas',
  deLaParte: (parte: string) => `de «${parte}»`,
} as const;

/** Para buscar sin que importen las mayúsculas, los acentos ni los espacios de más. */
export const textoParaBuscar = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Lo mínimo de una parte y sus preguntas que usa el buscador. */
export interface ParteParaBuscar<T> {
  readonly title: string;
  readonly fields: readonly T[];
}

/**
 * ED-40 · El buscador de preguntas: las de cada parte que dicen lo buscado, en su pregunta o en su aclaración, o todas
 * las de una parte cuyo título lo dice («sueño» trae la parte «Sueño» entera). Cada palabra tiene que estar (y), en
 * cualquier orden. Sin nada escrito, `null`: no se filtra. Una parte sin ninguna queda con la lista vacía.
 */
export function preguntasQueCoinciden<T extends { readonly label: string; readonly helpText?: string | null | undefined }>(
  partes: readonly ParteParaBuscar<T>[],
  consulta: string,
): T[][] | null {
  const palabras = textoParaBuscar(consulta).split(' ').filter(Boolean);
  if (palabras.length === 0) return null;
  const dice = (texto: string) => palabras.every((p) => texto.includes(p));
  return partes.map((parte) => {
    const titulo = textoParaBuscar(parte.title);
    return parte.fields.filter((c) => dice(`${titulo} ${textoParaBuscar(c.label)} ${textoParaBuscar(c.helpText ?? '')}`));
  });
}

/** «7 preguntas dicen «sueño»», «Ninguna pregunta dice «xyz»». */
export function resultadoDeLaBusqueda(cuantas: number, consulta: string): string {
  const q = consulta.trim();
  if (cuantas === 0) return `Ninguna pregunta dice «${q}».`;
  return cuantas === 1 ? `1 pregunta dice «${q}».` : `${cuantas} preguntas dicen «${q}».`;
}

export const COPY_BUSCADOR_DE_PREGUNTAS = {
  etiqueta: 'Buscar una pregunta',
  ayuda: 'Busca en las preguntas, sus aclaraciones y el título de cada parte. Escape borra la búsqueda.',
  pedirLasQueCoinciden: (n: number) => (n === 1 ? 'Pedirla' : `Pedir las ${n}`),
  ningunaDeLasQueCoinciden: (n: number) => (n === 1 ? 'No pedirla' : `Ninguna de las ${n}`),
  borrar: 'Borrar la búsqueda',
} as const;
