/**
 * Información · Solicitudes (WP-ESCRITORIO-AREAS, parte 4; maquetas 26 y 27). Lo que la pantalla del profesional dice
 * de lo que pidió y de lo que la persona declaró, calculado acá y con sus pruebas: la pantalla no decide ninguna regla.
 *
 * - **Las vistas cuentan solicitudes por su estado,** que tiene dos valores: sin responder y respondida. No responder
 *   también es una opción: «Sin responder» es un hecho, no una falta, y no se mide con un porcentaje.
 * - **Lo que declaró se muestra por pregunta pedida,** con la respuesta que rige: la de la corrección que la API señala
 *   (`effectiveView`) o la original. Se elige por esa relación, nunca por la fecha (REG-06-16).
 * - **Una pregunta pedida y no respondida es un hueco:** su fila dice «Sin responder». No se muestra vacía ni con un
 *   cero.
 * - **«Corregida» y «Antes»** salen de recorrer la cadena de correcciones hacia atrás desde la que rige: «antes» es el
 *   último valor distinto. Si antes la pregunta no tenía respuesta, se dice.
 * - **Si la cadena no se puede resolver, ninguna versión rige:** no se inventa una respuesta vigente. (Hasta la parte 4
 *   la pantalla rotulaba «Vigente» a la original.)
 * - **El valor lleva su unidad:** la que declaró la persona o, si falta, la de la pregunta. La APK no manda unidad.
 */
import type { CampoDePlantilla, RectificacionDeRespuesta, RespuestaDeCampo, RespuestaDeFormulario, SolicitudDeFormulario, VersionDePlantilla } from './contratos-formularios';
import { numero } from './formato-numeros';

// ─── Las vistas ─────────────────────────────────────────────────────────────────────────────────

/** Las vistas con nombre de «Solicitudes», en su orden. */
export const VISTAS_DE_SOLICITUDES = ['TODAS', 'SIN_RESPONDER', 'RESPONDIDAS'] as const;
export type VistaDeSolicitudes = (typeof VISTAS_DE_SOLICITUDES)[number];

type ConEstado = Pick<SolicitudDeFormulario, 'status'>;

export const solicitudEnLaVista = (solicitud: ConEstado, vista: VistaDeSolicitudes): boolean =>
  vista === 'TODAS' || (vista === 'RESPONDIDAS' ? solicitud.status === 'RESPONDED' : solicitud.status === 'PENDING');

/** Cuántas solicitudes trae cada vista. «Sin responder» y «Respondidas» suman «Todas». */
export function contarLasVistasDeSolicitudes(solicitudes: readonly ConEstado[]): Readonly<Record<VistaDeSolicitudes, number>> {
  const respondidas = solicitudes.filter((s) => s.status === 'RESPONDED').length;
  return { TODAS: solicitudes.length, SIN_RESPONDER: solicitudes.length - respondidas, RESPONDIDAS: respondidas };
}

// ─── El valor de una respuesta ──────────────────────────────────────────────────────────────────

/** El valor de una respuesta declarada, con su unidad: el número con coma (DL-091 punto 4); «Sí» o «No». */
export function valorDeclarado(valor: string | number | boolean, unidad: string | null): string {
  const texto = typeof valor === 'number' ? numero(valor) : typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : valor;
  return unidad ? `${texto} ${unidad}` : texto;
}

/** Con qué se responde una pregunta: «Texto», «Número · min», «Sí o no». */
export function respondeCon(campo: Pick<CampoDePlantilla, 'dataType' | 'unit'>): string {
  if (campo.dataType === 'BOOLEAN') return 'Sí o no';
  if (campo.dataType === 'NUMBER') return campo.unit ? `Número · ${campo.unit}` : 'Número';
  return 'Texto';
}

// ─── Lo que declaró ─────────────────────────────────────────────────────────────────────────────

/** Lo que una pregunta tenía antes de la respuesta que rige: otro valor, o nada. */
export type ValorDeAntes = { readonly tipo: 'VALOR'; readonly texto: string } | { readonly tipo: 'SIN_RESPONDER' };

/** Una fila de «Lo que declaró»: una por pregunta pedida, también la que quedó sin responder. */
export interface FilaDeLoDeclarado {
  readonly codigo: string;
  /** El texto de la pregunta. `null` si no se pudo leer de su formulario: la pantalla nunca muestra el código. */
  readonly pregunta: string | null;
  readonly requerida: boolean;
  /** La respuesta que rige, con su unidad. `null` si la pregunta está sin responder, o si ninguna versión rige. */
  readonly valor: string | null;
  /** La respuesta que rige es distinta de una versión anterior. */
  readonly corregida: boolean;
  /** El último valor distinto del que rige, yendo hacia atrás por la cadena. `null` si nunca cambió. */
  readonly antes: ValorDeAntes | null;
}

/** Una versión de la respuesta: la original o una corrección. */
export interface VersionDeLaRespuesta {
  readonly tipo: 'CORRECCION' | 'ORIGINAL';
  readonly id: string;
  /** Cuándo quedó registrada. */
  readonly cuando: string;
  /** Es la que rige hoy. */
  readonly rige: boolean;
  /** El motivo que escribió la persona al corregir; `null` en la original. */
  readonly motivo: string | null;
  /** Lo que respondió en esta versión, en el orden de las preguntas. */
  readonly respuestas: readonly { readonly codigo: string; readonly pregunta: string | null; readonly valor: string }[];
  /** Cuántas de las preguntas pedidas respondió en esta versión. */
  readonly respondidas: number;
}

export interface LoDeclarado {
  /** `SIN_RESOLVER`: hay respuesta, pero la cadena de correcciones no dice cuál rige. */
  readonly estado: 'SIN_RESPONDER' | 'RESPONDIDA' | 'SIN_RESOLVER';
  /** Cuántas preguntas se pidieron. */
  readonly pedidas: number;
  readonly filas: readonly FilaDeLoDeclarado[];
  /** Las versiones de la respuesta, de la más nueva a la más vieja. Vacía si no respondió. */
  readonly historia: readonly VersionDeLaRespuesta[];
  /** Cuándo respondió, y cuándo fue su última corrección. */
  readonly respondioEl: string | null;
  readonly corrigioEl: string | null;
}

type Pregunta = Pick<CampoDePlantilla, 'label' | 'unit'>;

/** Las correcciones en el orden de su cadena (cada una señala a la anterior). Si la cadena está rota, por fecha. */
function correccionesEnCadena(correcciones: readonly RectificacionDeRespuesta[]): readonly RectificacionDeRespuesta[] {
  const enCadena: RectificacionDeRespuesta[] = [];
  let anterior: string | null = null;
  for (let i = 0; i < correcciones.length; i++) {
    const siguiente = correcciones.find((c) => c.previousRectificationId === anterior && !enCadena.includes(c));
    if (!siguiente) break;
    enCadena.push(siguiente);
    anterior = siguiente.rectificationId;
  }
  return enCadena.length === correcciones.length ? enCadena : [...correcciones].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/**
 * Lo que la persona declaró en respuesta a una solicitud, por pregunta pedida, con la historia de sus versiones.
 * `formulario` es la versión del formulario de la solicitud (API-FRM-02), de donde salen el texto y la unidad de cada
 * pregunta; `null` si no se pudo leer: las filas quedan sin texto de pregunta, y la pantalla lo dice.
 */
export function loDeclarado(
  solicitud: Pick<SolicitudDeFormulario, 'requestedFieldCodes' | 'requiredFieldCodes'>,
  respuesta: RespuestaDeFormulario | null,
  formulario: Pick<VersionDePlantilla, 'sections'> | null,
): LoDeclarado {
  const preguntas = new Map<string, Pregunta>((formulario?.sections ?? []).flatMap((s) => s.fields.map((c) => [c.fieldCode, { label: c.label, unit: c.unit }] as const)));
  // En el orden del formulario; una pregunta pedida que el formulario no trae va al final, en el orden del pedido.
  const delFormulario = [...preguntas.keys()].filter((codigo) => solicitud.requestedFieldCodes.includes(codigo));
  const pedidas = [...delFormulario, ...solicitud.requestedFieldCodes.filter((codigo) => !preguntas.has(codigo))];
  const requeridas = new Set(solicitud.requiredFieldCodes);
  const texto = (a: RespuestaDeCampo): string => valorDeclarado(a.value, a.unit ?? preguntas.get(a.fieldCode)?.unit ?? null);
  /** El valor de una pregunta en un conjunto de respuestas; `null` si no la respondió. */
  const valorEn = (respuestas: readonly RespuestaDeCampo[], codigo: string): string | null => {
    const a = respuestas.find((x) => x.fieldCode === codigo);
    return a ? texto(a) : null;
  };
  const filaSinValor = (codigo: string): FilaDeLoDeclarado => ({ codigo, pregunta: preguntas.get(codigo)?.label ?? null, requerida: requeridas.has(codigo), valor: null, corregida: false, antes: null });

  if (!respuesta) return { estado: 'SIN_RESPONDER', pedidas: pedidas.length, filas: pedidas.map(filaSinValor), historia: [], respondioEl: null, corrigioEl: null };

  const correcciones = correccionesEnCadena(respuesta.rectifications);
  const vista = respuesta.effectiveView;
  const indiceDeLaQueRige = vista.kind === 'RECTIFIED' ? correcciones.findIndex((c) => c.rectificationId === vista.rectificationId) : -1;
  // La API dice que rige una corrección que no está entre las que entrega: tampoco se puede decir cuál rige.
  const resuelta = vista.kind === 'ORIGINAL' || (vista.kind === 'RECTIFIED' && indiceDeLaQueRige >= 0);

  const version = (tipo: 'CORRECCION' | 'ORIGINAL', id: string, cuando: string, rige: boolean, motivo: string | null, respuestas: readonly RespuestaDeCampo[]): VersionDeLaRespuesta => {
    const enOrden = [...pedidas, ...respuestas.map((a) => a.fieldCode).filter((codigo) => !pedidas.includes(codigo))];
    return {
      tipo,
      id,
      cuando,
      rige,
      motivo,
      respuestas: enOrden.flatMap((codigo) => {
        const valor = valorEn(respuestas, codigo);
        return valor === null ? [] : [{ codigo, pregunta: preguntas.get(codigo)?.label ?? null, valor }];
      }),
      respondidas: pedidas.filter((codigo) => respuestas.some((a) => a.fieldCode === codigo)).length,
    };
  };
  const historia: VersionDeLaRespuesta[] = [
    ...correcciones.map((c, i) => version('CORRECCION', c.rectificationId, c.recordedAt, resuelta && i === indiceDeLaQueRige, c.reason, c.answers)).reverse(),
    version('ORIGINAL', respuesta.formResponseId, respuesta.submittedAt, resuelta && vista.kind === 'ORIGINAL', null, respuesta.original.answers),
  ];
  const comun = { pedidas: pedidas.length, historia, respondioEl: respuesta.submittedAt, corrigioEl: correcciones.at(-1)?.recordedAt ?? null };
  if (!resuelta) return { estado: 'SIN_RESOLVER', filas: pedidas.map(filaSinValor), ...comun };

  // De la original a la que rige, por la cadena: lo que vino después de la que rige no cuenta.
  const hastaLaQueRige: (readonly RespuestaDeCampo[])[] = [respuesta.original.answers, ...correcciones.slice(0, indiceDeLaQueRige + 1).map((c) => c.answers)];
  const rigen = hastaLaQueRige.at(-1)!;
  const anteriores = hastaLaQueRige.slice(0, -1).reverse();
  const filas = pedidas.map((codigo): FilaDeLoDeclarado => {
    const valor = valorEn(rigen, codigo);
    const distinto = anteriores.map((respuestas) => valorEn(respuestas, codigo)).find((v) => v !== valor);
    const antes: ValorDeAntes | null = distinto === undefined ? null : distinto === null ? { tipo: 'SIN_RESPONDER' } : { tipo: 'VALOR', texto: distinto };
    return { codigo, pregunta: preguntas.get(codigo)?.label ?? null, requerida: requeridas.has(codigo), valor, corregida: antes !== null, antes };
  });
  return { estado: 'RESPONDIDA', filas, ...comun };
}

// ─── Los textos del profesional ─────────────────────────────────────────────────────────────────

const preguntasEnPalabras = (n: number): string => (n === 1 ? '1 pregunta' : `${numero(n)} preguntas`);

/**
 * Los textos de «Solicitudes» y de «Pedir información» del website del profesional que no comparte la APK (los que
 * comparte están en `COPY_FORMULARIOS`, y no cambian). Los verifica el mismo detector de términos prohibidos: una
 * cuenta («Respondió 1 de las 2 preguntas») no es un porcentaje, y va solo en la historia de una respuesta.
 */
export const COPY_SOLICITUDES = {
  bajada: 'Lo que le pediste a esta persona y lo que declaró. No responder también es una opción.',
  ver: 'Ver',
  vista: { TODAS: 'Todas', SIN_RESPONDER: 'Sin responder', RESPONDIDAS: 'Respondidas' } as Readonly<Record<VistaDeSolicitudes, string>>,
  unidadDeLaVista: ['solicitud', 'solicitudes'] as const,
  preguntas: preguntasEnPalabras,
  paraQue: 'Para qué',
  corrigioSuRespuesta: 'corrigió su respuesta',
  alPie: 'Ves las solicitudes de las áreas a las que tenés acceso hoy. Una solicitud no se cancela ni se edita: se puede pedir otra.',
  ningunaCoincide: 'Ninguna solicitud coincide con lo elegido.',
  verTodas: 'Ver todas',
  lecturaIncompleta: 'La lista llegó incompleta: puede haber más solicitudes.',
  // El detalle.
  detalle: 'Detalle de la solicitud',
  loPediste: 'Lo pediste',
  enElArea: 'en',
  respondio: 'Respondió',
  yLoCorrigio: 'y lo corrigió',
  loQueDeclaro: 'Lo que declaró',
  noEsMedicionNiDiagnostico: 'No es una medición ni un diagnóstico.',
  pregunta: 'Pregunta',
  respuestaQueRige: 'Respuesta que rige',
  requerida: 'Requerida',
  corregida: 'Corregida',
  antes: 'Antes',
  antesSinResponder: 'sin responder',
  sinResponder: 'Sin responder',
  preguntasPedidas: 'Lo que le pediste',
  noSePuedeDecirCualRige: 'No se puede decir cuál de las versiones de la respuesta rige: su cadena de correcciones no se puede resolver. Están todas en la historia.',
  preguntasNoCargaron: 'No pudimos leer las preguntas de este formulario.',
  preguntaSinLeer: 'Pregunta que no se pudo leer',
  historia: 'Historia de la respuesta',
  laOriginalSeConserva: 'La respuesta original se conserva.',
  motivoQueEscribio: 'Motivo que escribió',
  respondioDe: (respondidas: number, pedidas: number): string =>
    respondidas >= pedidas ? (pedidas === 1 ? 'Respondió la pregunta.' : `Respondió las ${numero(pedidas)} preguntas.`) : `Respondió ${numero(respondidas)} de las ${numero(pedidas)} preguntas.`,
  verLoRespondido: 'Ver lo que respondió',
  ocultarLoRespondido: 'Ocultar lo que respondió',
  detalleNoDisponible: 'Esta solicitud ya no está disponible. La lista sigue completa.',
  detalleNoCargo: 'No pudimos leer esta solicitud.',
  leyendoLaRespuesta: 'Leyendo la respuesta…',
  // El pedido: un cajón con tres pasos a la vista.
  paso: { formulario: 'Qué formulario', preguntas: 'Qué preguntas', paraQue: 'Para qué y en qué área' },
  /** Lo que marcar «Requerida» quiere decir, y lo que no: la solicitud entera puede quedar sin responder. */
  siRespondeLasRequeridas: 'Si responde, las requeridas no pueden quedar vacías.',
  /** Al elegir un formulario vienen todas sus preguntas marcadas (decisión de Dirección del 2026-10-12, F-05). */
  elegidas: (elegidas: number, total: number): string => `${numero(elegidas)} de ${numero(total)} elegidas.`,
  vienenTodasElegidas: 'Vienen todas elegidas: desmarcá las que no necesites.',
  preguntasAlElegir: 'Al elegir un formulario vas a ver acá sus preguntas.',
  leyendoLasPreguntas: 'Leyendo las preguntas…',
  /** Las columnas de la tabla de preguntas. La primera no tiene título a la vista: es la casilla que la pide. */
  pedir: 'Pedir',
  respondeCon: 'Responde con',
  /** Lo que la persona lee debajo de una pregunta al responderla. Queda a un clic: la tabla entra en la ventana. */
  verAclaraciones: 'Ver la aclaración de cada pregunta',
  ocultarAclaraciones: 'Ocultar las aclaraciones',
  aclaracionesDeLasPreguntas: 'Es lo que la persona lee debajo de la pregunta al responderla.',
  soloDeEstaArea: (area: string): string => `Este formulario es solo de ${area}.`,
  areaAElegir: 'Este formulario no es de un área sola: elegí en cuál lo pedís.',
  areaSegunElFormulario: 'Si el formulario es de un área sola, queda fijada.',
  elegiUnArea: 'Elegí un área',
  // Lo que falta para enviar, dicho en su lugar.
  faltaElFormulario: 'Elegí un formulario.',
  faltaElParaQue: 'Escribí para qué lo necesitás.',
  faltaElArea: 'Elegí en qué área lo pedís.',
  // Junto al botón, antes de un acto que no se deshace. BE no manda un aviso al teléfono: la persona la ve al abrir
  // «Información» en la aplicación.
  laVaAVer: 'La va a ver en su teléfono, en «Información».',
  noSeCancelaNiSeEdita: 'No se puede cancelar ni editar después de enviarla.',
  enviando: 'Enviando…',
} as const;
