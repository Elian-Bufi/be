/**
 * Los textos de los gráficos chicos de «Mi evolución» (DL-117): su lista equivalente a la vista y su frase para el lector
 * de pantalla. Sin React ni react-native, para probarlos sin teléfono (`scripts/selector-de-tomas.test.mjs`).
 */
import { cantidad, numero, type Observacion, type TomaDelPeriodo } from '@be/domain';

/** La lista equivalente del gráfico: «T1 82 · T2 sin dato · T3 80 kg». La unidad va una vez, al final. */
export function textoPorToma(valores: readonly (Observacion | null)[], tomas: readonly TomaDelPeriodo[]): string {
  const unidad = valores.find((o) => o !== null)?.punto.unit ?? '';
  const partes = tomas.map((t, i) => {
    const o = valores[i];
    return `${t.etiqueta} ${o ? numero(o.punto.value) : 'sin dato'}`;
  });
  return `${partes.join(' · ')}${unidad ? ` ${unidad}` : ''}`;
}

/**
 * Lo mismo, para el lector de pantalla: cada toma con su fecha y su valor completo, y cuál es la elegida. La fecha se
 * escribe con `fecha`, el formato corto de la pantalla.
 */
export function frasePorToma(valores: readonly (Observacion | null)[], tomas: readonly TomaDelPeriodo[], elegida: string, fecha: (fechaLocal: string) => string): string {
  return tomas
    .map((t, i) => {
      const o = valores[i];
      const valor = o ? cantidad(o.punto.value, o.punto.unit) : 'sin dato comparable';
      return `${t.etiqueta}, ${fecha(t.fecha)}: ${valor}${t.evaluacionId === elegida ? ' (la elegida)' : ''}`;
    })
    .join('; ');
}
