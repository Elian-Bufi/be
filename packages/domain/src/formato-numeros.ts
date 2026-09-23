/**
 * Números como los lee una persona en español rioplatense (10-B10 §copy; DL-091 punto 4): coma decimal y punto de
 * miles — «72,5 kg», «1.850 kcal». Un solo lugar para las dos superficies, sin depender de la ICU del runtime: Hermes y
 * el navegador no tienen por qué coincidir, y el formato de un dato es parte de lo que se verifica.
 *
 * Lo que se muestra no altera el dato: el número guardado sigue siendo el que llegó del contrato. Esto es solo lectura.
 */

/** Cuántos decimales muestra un número: los que trae, hasta `maximo`, sin ceros de relleno. */
export function numero(valor: number, maximo = 2): string {
  if (!Number.isFinite(valor)) return '—';
  const redondeado = Number(valor.toFixed(maximo));
  const negativo = redondeado < 0;
  const [entera, decimal] = Math.abs(redondeado).toFixed(maximo).replace(/\.?0+$/, '').split('.');
  const conMiles = entera!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '−' : ''}${conMiles}${decimal ? `,${decimal}` : ''}`;
}

/** «72,5 kg»: el número y la unidad como la escribió el contrato, con espacio fino entre ambos. */
export function cantidad(valor: number, unidad: string, maximo = 2): string {
  return `${numero(valor, maximo)} ${unidad}`;
}

/**
 * Lo inverso, para lo que la persona escribe en un campo: acepta coma o punto como decimal («72,5» y «72.5» valen lo
 * mismo), ignora espacios, y devuelve `null` cuando no es un número — nunca `NaN`, que en una comparación se confunde
 * con «no cargado».
 */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(/\s+/g, '');
  if (limpio === '' || !/^[−-]?\d+([.,]\d+)?$/.test(limpio)) return null;
  const n = Number(limpio.replace('−', '-').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
