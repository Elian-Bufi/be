/**
 * «Mi evolución»: qué vista se abre, cuántas columnas llevan los indicadores y cuándo una toma puede estar incompleta
 * (DL-117; cierre del 2026-10-04). Es lógica pura, sin React: la usa `pantallas/antropometria.tsx`, y la prueba
 * `scripts/selector-de-tomas.test.mjs` sin teléfono.
 */
import type { TomaDelPeriodo } from '@be/domain';
import type { VistaDeEvolucion } from './navegacion';

/**
 * Las vistas de la pantalla. «Mapa corporal» e «Indicadores» muestran la toma elegida: la figura con los sitios medidos,
 * y lo que no tiene sitio en la figura. `TOMA` es el pedido de Inicio («Ver la toma»): se resuelve con los datos.
 */
export type Vista = 'TOMA' | 'MAPA' | 'INDICADORES' | 'COMPARAR' | 'EVOLUCION';

/** `TOMA` abre el mapa si la toma tiene medidas en la figura; si no, los indicadores. Las demás vistas, tal cual. */
export function vistaDeLaToma(vista: Vista, conMedidasEnLaFigura: boolean): Exclude<Vista, 'TOMA'> {
  if (vista !== 'TOMA') return vista;
  return conMedidasEnLaFigura ? 'MAPA' : 'INDICADORES';
}

/** El selector de tomas va en las vistas de una toma, con más de una: no en Evolución, que muestra una medida en el tiempo. */
export function seVeElSelectorDeTomas(vista: Exclude<Vista, 'TOMA'>, cantidadDeTomas: number): boolean {
  return vista !== 'EVOLUCION' && cantidadDeTomas > 1;
}

/**
 * Lo que un pedido de Inicio deja elegido antes del primer dibujo; después manda lo que elija la persona. «Ver la toma»
 * abre la última toma, la que nombra la tarjeta, aunque antes se haya elegido otra. «Ver su evolución» abre la medida.
 */
export function eleccionesDelPedido({ vista, metrica }: { vista?: VistaDeEvolucion; metrica?: string }): readonly (readonly [clave: string, valor: string | null])[] {
  const elecciones: (readonly [string, string | null])[] = [];
  if (vista === 'ultima') elecciones.push(['mi-evolucion:vista', 'TOMA'], ['mi-evolucion:toma', null]);
  if (vista === 'comparar') elecciones.push(['mi-evolucion:vista', 'COMPARAR']);
  if (vista === 'evolucion') elecciones.push(['mi-evolucion:vista', 'EVOLUCION']);
  if (metrica) elecciones.push(['mi-evolucion:medida', metrica]);
  return elecciones;
}

/** Los días que muestra Evolución: un recorte del período que ya trajo la API. */
export type Dias = '30' | '60' | '90';

/**
 * Los días que tiene que mostrar Evolución para que se vea una observación de `fecha` (`AAAA-MM-DD`), en un período que
 * termina en `fin`: los que ya estaban, si la incluyen; si no, los menos que la incluyen. Así «Ver su evolución» nunca
 * abre una medida con «sin mediciones en estos días».
 */
export function diasQueIncluyen(fecha: string, fin: string, actuales: Dias): Dias {
  const dias = Math.round((Date.parse(`${fin.slice(0, 10)}T12:00:00Z`) - Date.parse(`${fecha.slice(0, 10)}T12:00:00Z`)) / 86_400_000) + 1;
  if (dias <= Number(actuales)) return actuales;
  return dias <= 30 ? '30' : dias <= 60 ? '60' : '90';
}

/** El ancho mínimo de una tarjeta de indicador con la letra de siempre, en dp; crece con la letra de la persona. */
export const ANCHO_MINIMO_DE_INDICADOR = 130;
/** Lo que separa dos tarjetas de indicador. */
export const SEPARACION_DE_INDICADORES = 8;
/** El relleno y el borde de una tarjeta de indicador, de cada lado. */
export const RELLENO_DE_INDICADOR = 12;

/**
 * El ancho de cada carácter de un valor en «em», medido con Roboto 800 (la letra del valor) en el render del navegador.
 * Los dígitos tienen todos el mismo ancho. Lo que no está en la tabla cuenta como una letra ancha.
 */
const ANCHO_DEL_CARACTER_EN_EM: Readonly<Record<string, number>> = {
  ...Object.fromEntries([...'0123456789'].map((d) => [d, 0.5767])),
  ',': 0.2578,
  '.': 0.2964,
  ' ': 0.25,
  '%': 0.7413,
  k: 0.5406,
  g: 0.5733,
  c: 0.5206,
  m: 0.8639,
  '/': 0.3609,
  '²': 0.3736,
  '+': 0.5397,
  '−': 0.5508,
};
const LETRA_ANCHA_EN_EM = 0.62;
/** Lo que se suma a la medida por si la letra del teléfono es un poco más ancha que la del navegador. */
const HOLGURA_DEL_VALOR = 1.06;

/** El ancho estimado de un valor («78,4 kg») escrito a `tamano` dp, con la tabla medida y su holgura. */
export function anchoDelValorEstimado(texto: string, tamano: number): number {
  return [...texto].reduce((total, c) => total + (ANCHO_DEL_CARACTER_EN_EM[c] ?? LETRA_ANCHA_EN_EM), 0) * tamano * HOLGURA_DEL_VALOR;
}

/**
 * Dos columnas si en cada una entran su ancho mínimo, que crece con la letra, y el valor más largo de la toma sin partirse
 * (`anchoDelValorMasLargo`, ya estimado con la letra de la persona). Si no, una: la letra o el ancho lo piden.
 */
export function columnasDeIndicadores({ ancho, escalaDeLetra, anchoDelValorMasLargo }: { ancho: number; escalaDeLetra: number; anchoDelValorMasLargo: number }): 1 | 2 {
  const escala = Math.min(Math.max(escalaDeLetra, 1), 2.2);
  const columna = (ancho - SEPARACION_DE_INDICADORES) / 2;
  const necesario = Math.max(ANCHO_MINIMO_DE_INDICADOR * escala, anchoDelValorMasLargo + 2 * RELLENO_DE_INDICADOR + 2);
  return columna >= necesario ? 2 : 1;
}

/**
 * Las otras tomas del mismo día civil que la elegida. Si las hay, esta toma puede estar incompleta: la API muestra una
 * sola medición por día y por medida (D-3), y si dos evaluaciones del mismo día tomaron la misma medida, se ve una.
 */
export function otrasTomasDelDia(tomas: readonly TomaDelPeriodo[], evaluacionId: string): readonly TomaDelPeriodo[] {
  const esta = tomas.find((t) => t.evaluacionId === evaluacionId);
  return esta ? tomas.filter((t) => t.evaluacionId !== evaluacionId && t.fecha === esta.fecha) : [];
}
