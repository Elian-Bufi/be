/**
 * La exportación CSV de Analizar (encargo §16; PRO-10 y PRO-20): los mismos puntos que la tabla de datos, con lo que hace
 * falta para leerlos fuera de BE —período, zona, métricas con su unidad y su método, calidad, cobertura y fecha de
 * generación— y nada que la pantalla no muestre. Sale de lo que la API ya autorizó para el profesional: no hay una
 * operación nueva ni un enlace que compartir, y el archivo no lleva el nombre de nadie.
 *
 * - **Separador `;` y decimales con coma**, en UTF-8 con BOM: así lo abre una planilla en castellano.
 * - **Lo desconocido queda vacío y el cero es 0**; el subtotal, el día o la semana sin completar y la corrección van en
 *   columnas propias. El valor se redondea como en la tabla (una sola vez, al mostrar).
 * - **Sin fórmulas:** una celda de texto que empieza con `=`, `+`, `-`, `@`, tabulación o retorno lleva un apóstrofo
 *   adelante (OWASP, inyección en CSV). Los nombres de ejercicios los escribe una persona: son texto, nunca fórmula.
 */
import { redondeoDePresentacion } from './calculo-nutricional';
import type { MetricaNutricional, PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import { VERSION_DEL_DICCIONARIO, type DefinicionDeMetrica } from './metricas-del-analisis';
import { NUTRIENTE_DE_LA_METRICA } from './nutricion-del-analisis';

export interface SerieParaExportar {
  /** El nombre como lo muestra la pantalla (con el ejercicio, la serie y la unidad cuando corresponde). */
  readonly nombre: string;
  readonly definicion: DefinicionDeMetrica;
  readonly serie: SerieAnalitica;
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
  return motivo.toLowerCase().replace(/_/g, ' ');
}

const CALIDAD: Readonly<Record<PuntoAnalitico['quality'], string>> = { COMPLETE: 'sin faltantes', PARTIAL: 'subtotal', UNKNOWN: 'sin valor conocido' };

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
  'Falta',
] as const;

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
        'Valor vacío: sin valor conocido (nunca es 0). 0: cero registrado. Subtotal: falta algún dato de ese día o semana. Sin completar: el día en curso o una semana que el período corta. Coincidencia temporal: no indica causa.',
      ),
    ]),
    fila(['Formato', 'separador punto y coma; decimales con coma']),
    '',
    fila(COLUMNAS_DE_LA_EXPORTACION),
  ];
  for (const s of p.series) {
    const metodo = METODO[s.serie.aggregation];
    for (const pt of s.serie.points) {
      if (pt.date < p.desde || pt.date > p.hasta) continue;
      lineas.push(
        fila([
          celdaDeTexto(s.nombre),
          celdaDeTexto(s.serie.unit),
          metodo,
          pt.date,
          pt.dateEnd ?? '',
          pt.at ? horaEn(pt.at, p.zona) : '',
          pt.value === null ? '' : numeroParaExportar(pt.value, s.definicion),
          CALIDAD[pt.quality],
          pt.partialBucket ? 'sí' : 'no',
          String(pt.n),
          celdaDeTexto(pt.segment),
          pt.corrected ? 'sí' : 'no',
          pt.coverage ? String(pt.coverage.records) : '',
          pt.coverage ? String(pt.coverage.recordsWithQuantities) : '',
          pt.coverage ? String(pt.coverage.recordsWithoutQuantities) : '',
          celdaDeTexto(pt.missing.map((m) => `${m.count} ${textoDeFaltante(m.reason)}`).join(', ')),
        ]),
      );
    }
  }
  return `${lineas.join('\r\n')}\r\n`;
}

/** El nombre del archivo: el rango y nada que identifique a una persona. */
export const nombreDeLaExportacion = (desde: string, hasta: string): string => `BE-analisis-${desde}-a-${hasta}.csv`;
