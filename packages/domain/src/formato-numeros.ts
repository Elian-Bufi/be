/**
 * Números como los lee una persona en español rioplatense (10-B10 §copy; DL-091 punto 4): coma decimal y punto de
 * miles — «72,5 kg», «1.850 kcal». Un solo lugar para las dos superficies, sin depender de la ICU del runtime: Hermes y
 * el navegador no tienen por qué coincidir, y el formato de un dato es parte de lo que se verifica.
 *
 * Mostrar no redondea en silencio (REG-06-158): sin un máximo explícito, el número se muestra con **todos** sus
 * decimales. Un cálculo con precisión declarada se muestra con `numeroConPrecision`, que respeta la precisión aunque
 * termine en cero («23,670» con 3 decimales declarados). Lo que se muestra no altera el dato: es solo lectura.
 */

/** Decimales suficientes para no recortar ningún dato real y descartar el ruido binario de un `double`. */
const DECIMALES_SIN_RUIDO = 10;

function conSeparadores(fijo: string, negativo: boolean): string {
  const [entera, decimal] = fijo.split('.');
  const conMiles = entera!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '−' : ''}${conMiles}${decimal ? `,${decimal}` : ''}`;
}

/**
 * El número con coma decimal y punto de miles. Sin `maximo`, con todos sus decimales significativos; con `maximo`, a lo
 * sumo esa cantidad de decimales, sin ceros de relleno (para un conteo, `numero(n, 0)`).
 */
export function numero(valor: number, maximo?: number): string {
  if (!Number.isFinite(valor)) return '—';
  if (maximo === undefined) {
    // 15 cifras significativas son las que un `double` representa sin ruido: 0,1 + 0,2 se muestra 0,3.
    const limpio = Number(valor.toPrecision(15));
    const texto = String(Math.abs(limpio));
    const fijo = texto.includes('e') ? Math.abs(limpio).toFixed(DECIMALES_SIN_RUIDO).replace(/\.?0+$/, '') : texto;
    return conSeparadores(fijo, limpio < 0);
  }
  const redondeado = Number(valor.toFixed(maximo));
  const fijo = Math.abs(redondeado).toFixed(maximo).replace(/\.?0+$/, '');
  return conSeparadores(fijo, redondeado < 0);
}

/** El número con exactamente `decimales` decimales, como los declara un método de cálculo (REG-06-158). */
export function numeroConPrecision(valor: number, decimales: number): string {
  if (!Number.isFinite(valor)) return '—';
  const fijo = Math.abs(valor).toFixed(decimales);
  return conSeparadores(fijo, Number(fijo) !== 0 && valor < 0);
}

/** «72,5 kg»: el número y la unidad como la escribió el contrato. */
export function cantidad(valor: number, unidad: string, maximo?: number): string {
  return `${numero(valor, maximo)} ${unidad}`;
}

/**
 * Lo inverso, para lo que la persona escribe en un campo: acepta coma o punto como decimal («72,5» y «72.5» valen lo
 * mismo), ignora espacios, y devuelve `null` cuando no es un número — nunca `NaN`, que en una comparación se confunde
 * con «no cargado».
 *
 * **Lo ambiguo tampoco es un número.** «1.850» es mil ochocientos cincuenta para quien lo lee en una pantalla que
 * muestra miles con punto, y sería 1,85 si el punto se tomara como decimal: un objetivo de 1.850 kcal guardado como
 * 1,85. Por eso un entero de 1 a 3 cifras seguido de grupos de exactamente tres cifras separados por punto se rechaza,
 * y el campo pide escribirlo sin punto («1850») o con coma si es decimal («1,85»).
 */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(/\s+/g, '');
  if (limpio === '' || !/^[−-]?\d+([.,]\d+)?$/.test(limpio)) return null;
  if (esMilesConPunto(limpio)) return null;
  const n = Number(limpio.replace('−', '-').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** «1.850», «12.500», «-1.000»: la forma que `leerNumero` rechaza por ambigua. «0.125» y «1.5» no lo son. */
export function esMilesConPunto(texto: string): boolean {
  return /^[−-]?[1-9]\d{0,2}(\.\d{3})+$/.test(texto.trim().replace(/\s+/g, ''));
}

/** El aviso de campo para lo que `leerNumero` no acepta, que distingue el caso ambiguo del resto. */
export function motivoDeNumeroIlegible(texto: string): string {
  return esMilesConPunto(texto)
    ? 'Escribilo sin punto de miles («1850») o, si es decimal, con coma («1,85»).'
    : 'Escribí un número: «150» o «72,5».';
}
