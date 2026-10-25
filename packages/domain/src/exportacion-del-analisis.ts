/**
 * La exportación CSV de Analizar (encargo §16; PRO-10 y PRO-20): los mismos puntos que la tabla de datos, con lo que hace
 * falta para leerlos fuera de BE —período, zona, métricas con su unidad y su método, calidad, cobertura y fecha de
 * generación— y nada que la pantalla no muestre. Sale de lo que la API ya autorizó para el profesional: no hay una
 * operación nueva ni un enlace que compartir, y el archivo no lleva el nombre de nadie.
 *
 * - **Separador `;` y decimales con coma**, en UTF-8 con BOM: así lo abre una planilla en castellano.
 * - **Lo desconocido queda vacío y el cero es 0**; el subtotal, el día o la semana sin completar, la corrección y la
 *   clase del dato (medido, reportado por la persona o calculado por un método) van en columnas propias. El valor se
 *   redondea como en la tabla (una sola vez, al mostrar).
 * - **Sin fórmulas:** una celda de texto que empieza con `=`, `+`, `-`, `@`, tabulación o retorno lleva un apóstrofo
 *   adelante (OWASP, inyección en CSV). Los nombres de ejercicios los escribe una persona: son texto, nunca fórmula.
 * - **El objetivo y lo indicado** (DL-158), en Nutrición: dos columnas con lo que dicen la tabla y el gráfico. Un día sin
 *   registros que tiene indicado en el plan (el gráfico lo dibuja) va en una fila propia, con el valor vacío: no es un 0.
 */
import { redondeoDePresentacion } from './calculo-nutricional';
import type { EscalonDelObjetivoApi, IndicadoDelDiaApi, MetricaNutricional, PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import { motivoCortoSinIndicadoDelDia, objetivoParaExportar } from './copy-comparacion-nutricional';
import { VERSION_DEL_DICCIONARIO, type DefinicionDeMetrica } from './metricas-del-analisis';
import { calidadEnPalabras, comidasDelPlanEnPalabras, NUTRIENTE_DE_LA_METRICA } from './nutricion-del-analisis';
import { claseEnPalabras } from './antropometria-del-analisis';

/** Cómo se agrupó cada métrica: un punto por día, por semana o por observación (toma o sesión). */
const AGRUPACION: Readonly<Record<SerieAnalitica['grain'], string>> = { DAY: 'por día', WEEK: 'por semana (el método de cada fila dice si es media o suma)', ORIGINAL: 'cada observación (toma o sesión)' };

export interface SerieParaExportar {
  /** El nombre como lo muestra la pantalla (con el ejercicio, la serie y la unidad cuando corresponde). */
  readonly nombre: string;
  readonly definicion: DefinicionDeMetrica;
  readonly serie: SerieAnalitica;
  /**
   * DL-158, solo en Nutrición: los escalones del objetivo de la métrica y lo indicado en el plan por día (`null` si la
   * métrica no tiene indicado, como la cuenta de registros).
   */
  readonly comparacion?: { readonly objetivo: readonly EscalonDelObjetivoApi[]; readonly indicado: readonly IndicadoDelDiaApi[] | null };
}

export interface PedidoDeExportacion {
  /** Lo que la ficha muestra del asesorado (su nombre visible o seudónimo), nunca un dato que la pantalla no tenga. */
  readonly asesorado: string;
  /** El rango que se ve (el período o el intervalo elegido), en fechas civiles. */
  readonly desde: string;
  readonly hasta: string;
  readonly zona: string;
  /** El instante de generación, ISO. */
  readonly generadoEl: string;
  readonly series: readonly SerieParaExportar[];
}

const SEPARADOR = ';';

/** El texto de un faltante, igual en la pantalla y en el archivo. */
export function textoDeFaltante(motivo: string): string {
  if (motivo === 'SIN_CANTIDADES') return 'registro(s) sin cantidades';
  if (motivo === 'COMIDA_DIFERENTE_SIN_CANTIDADES') return 'comida(s) diferente(s) sin cantidades';
  if (motivo === 'SIN_DATO_DEL_NUTRIENTE') return 'registro(s) sin el dato del nutriente';
  if (motivo === 'COMIDA_DEL_PLAN_SIN_REGISTRO') return 'comida(s) del plan sin registro';
  return motivo.toLowerCase().replace(/_/g, ' ');
}

/** La calidad en el archivo: las palabras de la pantalla (`calidadEnPalabras`), con el subtotal en una palabra. */
const calidadDeLaFila = (p: PuntoAnalitico, definicion: DefinicionDeMetrica): string =>
  p.quality === 'PARTIAL' ? 'subtotal' : calidadEnPalabras(p, definicion.area === 'NUTRICION' && definicion.parametro === 'RECORDS');

const METODO: Readonly<Record<SerieAnalitica['aggregation'], string>> = {
  NONE: 'cada observación, sin agregar',
  SUM_OF_KNOWN: 'suma de lo conocido del día',
  MEAN_OF_DAYS_WITH_DATA: 'media de los días con valor',
  COUNT: 'conteo',
  SUM: 'suma',
};

/** Una celda de texto: entre comillas si hace falta, y sin que una planilla la pueda leer como fórmula. */
export function celdaDeTexto(texto: string): string {
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** Un número con los decimales de la métrica y coma decimal; en Nutrición, el mismo redondeo de la pantalla de registro. */
export function numeroParaExportar(valor: number, definicion: DefinicionDeMetrica): string {
  if (definicion.area === 'NUTRICION' && definicion.parametro !== 'RECORDS') {
    const nutriente = NUTRIENTE_DE_LA_METRICA[definicion.parametro as Exclude<MetricaNutricional, 'RECORDS'>];
    if (nutriente) {
      try {
        return redondeoDePresentacion(String(valor), nutriente).replace('.', ',');
      } catch {
        // Un valor que no es un decimal exacto (no debería pasar): se exporta con los decimales de la métrica.
      }
    }
  }
  return valor.toFixed(definicion.decimales).replace('.', ',');
}

const horaEn = (instante: string, zona: string): string => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zona }).format(new Date(instante));

const fila = (celdas: readonly string[]): string => celdas.join(SEPARADOR);

export const COLUMNAS_DE_LA_EXPORTACION = [
  'Métrica',
  'Unidad',
  'Método',
  'Fecha',
  'Fecha final',
  'Hora',
  'Valor',
  'Calidad',
  'Sin completar',
  'n',
  'Tramo',
  'Corregido',
  'Registros',
  'Con cantidades',
  'Sin cantidades',
  'Comidas del plan',
  'Falta',
  'Clase de dato',
  'Objetivo del profesional (por día)',
  'Indicado en el plan',
] as const;

/** Lo indicado de la fila de un punto: por día, el valor o por qué no hay; por semana no se agrupa. */
function indicadoDeLaFila(s: SerieParaExportar, pt: PuntoAnalitico): string {
  const indicado = s.comparacion?.indicado;
  if (!indicado) return '';
  if (s.serie.grain !== 'DAY') return 'es por día: no se agrupa por semana';
  const d = indicado.find((x) => x.date === pt.date);
  if (!d) return '';
  return d.state === 'DETERMINED' ? numeroParaExportar(d.value, s.definicion) : motivoCortoSinIndicadoDelDia(d);
}

/** El objetivo de la fila: el del día, o los de la semana si cambió adentro. Vacío si la métrica no tiene objetivo. */
const objetivoDeLaFila = (s: SerieParaExportar, desde: string, hasta: string): string => (s.comparacion && s.comparacion.objetivo.length > 0 ? objetivoParaExportar(s.comparacion.objetivo, desde, hasta) : '');

/**
 * El contenido del archivo (sin BOM: lo agrega quien lo descarga). Primero un bloque que dice qué es y cómo se lee; después
 * la tabla, una fila por punto del rango, en el orden de las métricas y de las fechas.
 */
export function csvDelAnalisis(p: PedidoDeExportacion): string {
  const lineas = [
    fila(['BE · Analizar', 'exportación de datos']),
    fila(['Asesorado', celdaDeTexto(p.asesorado)]),
    fila(['Período', `${p.desde} a ${p.hasta} (fechas civiles)`]),
    fila(['Zona horaria', p.zona]),
    fila(['Generado', p.generadoEl]),
    fila(['Diccionario de métricas', VERSION_DEL_DICCIONARIO]),
    fila(['Métricas', celdaDeTexto(p.series.map((s) => `${s.nombre} (${s.serie.unit})`).join(' · '))]),
    fila([
      'Cómo leer',
      celdaDeTexto(
        'Valor vacío: sin valor conocido (nunca es 0). 0: cero registrado. Es lo registrado, no prueba lo que se comió. Subtotal: falta algún dato de ese día o semana (una comida del plan sin registro, cantidades o el dato del nutriente). Comidas del plan: cuántas de las que indicaba el plan tienen registro; «sin determinar» si no había plan vigente o no se sabe el día tipo. Sin completar: el día en curso o una semana que el período corta. Objetivo del profesional: lo que fijó el objetivo, por día, en la unidad de la fila; una proporción de las calorías se escribe como proporción y no se convierte. Indicado en el plan: lo que indicaba el plan ese día, solo si cada comida tenía una sola opción; si no, «sin indicado» y por qué. Las alternativas no se suman ni se promedian. Una fila «sin registros» es un día sin registros que tiene indicado en el plan. Coincidencia temporal: no indica causa.',
      ),
    ]),
    fila(['Agrupación', celdaDeTexto(p.series.map((s) => `${s.nombre}: ${AGRUPACION[s.serie.grain]}`).join(' · '))]),
    fila(['Formato', 'separador punto y coma; decimales con coma']),
    '',
    fila(COLUMNAS_DE_LA_EXPORTACION),
  ];
  for (const s of p.series) {
    const metodo = METODO[s.serie.aggregation];
    // Las filas de la serie en orden de fecha: sus puntos y, por día, los días sin registros que tienen indicado.
    const filas: { readonly fecha: string; readonly linea: string }[] = [];
    for (const pt of s.serie.points) {
      if (pt.date < p.desde || pt.date > p.hasta) continue;
      filas.push({
        fecha: pt.date,
        linea: fila([
          celdaDeTexto(s.nombre),
          celdaDeTexto(s.serie.unit),
          metodo,
          pt.date,
          pt.dateEnd ?? '',
          pt.at ? horaEn(pt.at, p.zona) : '',
          pt.value === null ? '' : numeroParaExportar(pt.value, s.definicion),
          celdaDeTexto(calidadDeLaFila(pt, s.definicion)),
          pt.partialBucket ? 'sí' : 'no',
          String(pt.n),
          celdaDeTexto(pt.segment),
          pt.corrected ? 'sí' : 'no',
          pt.coverage ? String(pt.coverage.records) : '',
          pt.coverage ? String(pt.coverage.recordsWithQuantities) : '',
          pt.coverage ? String(pt.coverage.recordsWithoutQuantities) : '',
          pt.coverage ? celdaDeTexto(comidasDelPlanEnPalabras(pt.coverage.planMeals)) : '',
          celdaDeTexto(pt.missing.map((m) => `${m.count} ${textoDeFaltante(m.reason)}`).join(', ')),
          pt.dataClass ? celdaDeTexto(`${claseEnPalabras(pt.dataClass, pt.method)}${pt.method?.name ? ` (${pt.method.name})` : ''}`) : '',
          celdaDeTexto(objetivoDeLaFila(s, pt.date, pt.dateEnd ?? pt.date)),
          celdaDeTexto(indicadoDeLaFila(s, pt)),
        ]),
      });
    }
    if (s.serie.grain === 'DAY') {
      const conPunto = new Set(filas.map((f) => f.fecha));
      for (const d of s.comparacion?.indicado ?? []) {
        if (d.state !== 'DETERMINED' || d.date < p.desde || d.date > p.hasta || conPunto.has(d.date)) continue;
        filas.push({
          fecha: d.date,
          linea: fila([celdaDeTexto(s.nombre), celdaDeTexto(s.serie.unit), metodo, d.date, '', '', '', 'sin registros', '', '0', '', '', '0', '0', '0', '', '', '', celdaDeTexto(objetivoDeLaFila(s, d.date, d.date)), numeroParaExportar(d.value, s.definicion)]),
        });
      }
    }
    lineas.push(...[...filas].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((f) => f.linea));
  }
  return `${lineas.join('\r\n')}\r\n`;
}

/** El nombre del archivo: el rango y nada que identifique a una persona. */
export const nombreDeLaExportacion = (desde: string, hasta: string): string => `BE-analisis-${desde}-a-${hasta}.csv`;
