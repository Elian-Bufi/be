/**
 * Los textos de los gráficos chicos de «Mi evolución» (DL-117): su lista equivalente a la vista y su frase para el lector
 * de pantalla. Sin React ni react-native, para probarlos sin teléfono (`scripts/selector-de-tomas.test.mjs`).
 *
 * Cada toma dice lo que tiene (`EnLaToma`): su valor; «no comparable» si tiene la medida con otro protocolo, método o
 * unidad; o «sin dato». Un hueco nunca se escribe como cero.
 */
import { cantidad, numero, type TomaDelPeriodo } from '@be/domain';
import type { EnLaToma } from './graficos-por-toma';

/** La lista equivalente del gráfico: «T1 82 · T2 sin dato · T3 no comparable · T4 80 kg». La unidad va una vez, al final. */
export function textoPorToma(estados: readonly EnLaToma[], tomas: readonly TomaDelPeriodo[]): string {
  const unidad = estados.find((e) => e.tipo === 'valor')?.observacion.punto.unit ?? '';
  const partes = tomas.map((t, i) => {
    const e = estados[i];
    return `${t.etiqueta} ${e?.tipo === 'valor' ? numero(e.observacion.punto.value) : e?.tipo === 'otro-grupo' ? 'no comparable' : 'sin dato'}`;
  });
  return `${partes.join(' · ')}${unidad ? ` ${unidad}` : ''}`;
}

/**
 * Lo mismo, para el lector de pantalla: cada toma con su fecha y su valor completo, y cuál es la elegida. Una toma con
 * otro grupo dice su valor y que no se compara. La fecha se escribe con `fecha`, el formato corto de la pantalla.
 */
export function frasePorToma(estados: readonly EnLaToma[], tomas: readonly TomaDelPeriodo[], elegida: string, fecha: (fechaLocal: string) => string): string {
  return tomas
    .map((t, i) => {
      const e = estados[i];
      const valor =
        e?.tipo === 'valor'
          ? cantidad(e.observacion.punto.value, e.observacion.punto.unit)
          : e?.tipo === 'otro-grupo'
            ? `${cantidad(e.observacion.punto.value, e.observacion.punto.unit)}, con otro protocolo, método o unidad: no se compara`
            : 'sin dato';
      return `${t.etiqueta}, ${fecha(t.fecha)}: ${valor}${t.evaluacionId === elegida ? ' (la elegida)' : ''}`;
    })
    .join('; ');
}

/** Una lista para leer: «T2», «T2 y T3», «T2, T3 y T4». */
export function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

/**
 * Cómo se lee el eje de los gráficos chicos, dicho una vez en la pantalla: el orden de las tomas, no el tiempo. Si alguna
 * medida tiene tomas con otro grupo, también qué es la raya.
 */
export function comoSeLeenLosPuntos(tomas: readonly TomaDelPeriodo[], conOtroGrupo: boolean): string {
  const primera = tomas[0]?.etiqueta ?? 'T1';
  const ultima = tomas[tomas.length - 1]?.etiqueta ?? primera;
  const eje = `Los gráficos chicos tienen un punto por toma, en orden, de ${primera} a ${ultima}: van a la misma distancia aunque entre dos tomas pasen días distintos. En Evolución, el gráfico de una medida usa las fechas.`;
  return conOtroGrupo ? `${eje} Una raya sobre la base es una toma con esa medida en otro protocolo, método o unidad: no se compara.` : eje;
}
