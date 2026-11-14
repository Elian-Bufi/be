/**
 * «Desde el inicio y desde la anterior»: la tabla de cada toma (WP-GRAFICOS GR-16, DL-174). De un vistazo, qué cambió en
 * cada medida desde la primera toma y desde la anterior, con los días de calendario entre las fechas.
 *
 * Se arma con API-ANT-06 (la evolución, la misma lectura de «Evolución» y de «Tu última toma»), leída en tramos de hasta
 * 92 días que cubren las fechas de las tomas (`tramosDeLasTomas`). Las reglas, de la propuesta de gráficos:
 * - **Solo dentro del mismo grupo de comparabilidad** (mismo protocolo, método y unidad: REG-06-162). Los grupos se nombran
 *   por respuesta (`cmp-1`…), así que entre tramos se juntan por lo que son. Una medida tomada antes con otro protocolo,
 *   método o unidad no se compara, y se dice.
 * - **La diferencia es una resta,** con su signo y su unidad («+1,5 kg», «−0,8 cm»), como `diferenciaDescriptiva`: no es
 *   progreso ni resultado clínico. Sin flechas, sin colores y sin palabras que califiquen el cambio.
 * - **El error de medición:** BE no tiene cargado el de quien mide, así que debajo de la tabla va siempre la línea que lo
 *   dice, y no una columna vacía. Cuando exista (GR-17), cada fila dirá si el cambio lo supera.
 * - **Lo que no hay no se completa:** una medida sin toma anterior lo dice; nada se interpola ni se arrastra.
 */
import type { EvolucionResponse } from './contratos-antropometria';
import { textoDeDiferenciaAntropometrica } from './evolucion-antropometrica';
import { diaSiguiente, diasEntreFechas, fechaCivil } from './fechas-civiles';
import { cantidad, numero } from './formato-numeros';
import { nombreDeMetrica } from './nombres-de-metricas';
import { compararPorCatalogo } from './resumen-de-la-toma';

type DatosDeLaEvolucion = EvolucionResponse['data'];

/** API-ANT-06 lee hasta 92 días por pedido: cada tramo deja un día de margen de cada lado, por la zona de la persona. */
export const DIAS_POR_TRAMO_DE_LAS_TOMAS = 92;
/**
 * Cuántos tramos se leen, como mucho: los de las tomas más recientes (dos años de tomas seguidas). Cada uno es una lectura
 * protegida, que cuenta para el cupo del profesional. Si hay más, «Desde el inicio» dice desde cuándo se leyó.
 */
export const MAXIMO_DE_TRAMOS_DE_LAS_TOMAS = 8;

const restarUnDia = (f: string): string => {
  const d = new Date(`${f}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Los tramos de API-ANT-06 que cubren las fechas civiles de las tomas, del más viejo al más nuevo: cada uno junta las
 * tomas de hasta 90 días seguidos y suma un día de margen de cada lado (92 en total), sin pasar de `hoy`. Las tomas
 * separadas por más tiempo van en tramos distintos: no se lee lo que no tiene tomas. Con más de `maximo` tramos quedan
 * los más recientes, y `completo` lo dice.
 */
export function tramosDeLasTomas(fechas: readonly string[], hoy: string, maximo = MAXIMO_DE_TRAMOS_DE_LAS_TOMAS): { readonly tramos: readonly { readonly desde: string; readonly hasta: string }[]; readonly completo: boolean } {
  const juntas: { desde: string; hasta: string }[] = [];
  for (const f of [...new Set(fechas)].sort()) {
    const ultimo = juntas[juntas.length - 1];
    if (ultimo && diasEntreFechas(ultimo.desde, f) <= DIAS_POR_TRAMO_DE_LAS_TOMAS - 3) ultimo.hasta = f;
    else juntas.push({ desde: f, hasta: f });
  }
  const tramos = juntas.map((t) => ({ desde: restarUnDia(t.desde), hasta: diaSiguiente(t.hasta) > hoy ? t.hasta : diaSiguiente(t.hasta) }));
  return { tramos: tramos.slice(Math.max(0, tramos.length - maximo)), completo: tramos.length <= maximo };
}

/** Una diferencia con otra toma del mismo grupo: la resta, su unidad, la fecha de la otra toma y los días entre las dos. */
export interface DiferenciaDesdeOtraToma {
  readonly delta: number;
  readonly unidad: string;
  /** La fecha civil de la toma con la que se compara. */
  readonly desde: string;
  /** Días de calendario entre las dos fechas civiles: dos tomas del mismo día distan 0. */
  readonly dias: number;
}

export interface FilaDesdeElInicio {
  readonly metrica: string;
  readonly nombre: string;
  readonly valor: number;
  readonly unidad: string;
  /** Con la primera toma del mismo grupo en lo leído; `null` si esta es la primera. */
  readonly desdeElInicio: DiferenciaDesdeOtraToma | null;
  /** Con la toma anterior del mismo grupo; `null` si esta es la primera. */
  readonly desdeLaAnterior: DiferenciaDesdeOtraToma | null;
  /**
   * Por qué no hay con qué comparar: `SIN_PREVIA`, la medida no se tomó antes; `OTRO_GRUPO`, se tomó, pero con otro
   * protocolo, método o unidad (REG-06-162/164).
   */
  readonly motivo: 'SIN_PREVIA' | 'OTRO_GRUPO' | null;
}

export interface DesdeElInicio {
  /** La fecha civil de esta toma. */
  readonly fecha: string;
  /** Las mediciones (medidas y reportadas) y, aparte, los resultados de las fórmulas. */
  readonly medidas: readonly FilaDesdeElInicio[];
  readonly resultados: readonly FilaDesdeElInicio[];
  /** La fecha de la toma de inicio y la de la anterior, si la comparten todas las filas que las tienen: se dicen una vez. */
  readonly fechaDelInicio: string | null;
  readonly fechaDeLaAnterior: string | null;
  /** Hay tomas de otro profesional en lo leído, que no se muestran (`partialView`). */
  readonly parcial: boolean;
}

interface Dato {
  readonly sourceId: string;
  readonly evaluacionId: string;
  readonly fecha: string;
  readonly ocurrio: string;
  readonly registrado: string;
  readonly valor: number;
  readonly unidad: string;
  readonly derivado: boolean;
  /** Protocolo, método y unidad: dos datos se comparan solo si comparten esta clave. */
  readonly comparable: string;
}

const porMomento = (a: Dato, b: Dato): number => a.ocurrio.localeCompare(b.ocurrio) || a.registrado.localeCompare(b.registrado) || a.sourceId.localeCompare(b.sourceId);

/** Los datos de cada métrica de una o más respuestas (una por tramo), sin repetir una observación, en el tiempo. */
function datosPorMetrica(respuestas: readonly DatosDeLaEvolucion[]): Map<string, Dato[]> {
  const porMetrica = new Map<string, Dato[]>();
  const vistos = new Set<string>();
  for (const r of respuestas) {
    for (const serie of r.metrics) {
      const grupos = new Map(serie.comparability.groups.map((g) => [g.comparabilityGroup, g] as const));
      for (const p of serie.series) {
        const clave = `${serie.metricCode}|${p.sourceId}`;
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        const g = grupos.get(p.comparabilityGroup);
        const lista = porMetrica.get(serie.metricCode) ?? [];
        lista.push({
          sourceId: p.sourceId,
          evaluacionId: p.sourceEvaluationId,
          fecha: fechaCivil(p.occurredAt, r.period.timeZone),
          ocurrio: new Date(p.occurredAt).toISOString(),
          registrado: new Date(p.recordedAt).toISOString(),
          valor: p.value,
          unidad: g?.unit ?? p.unit,
          derivado: p.dataClass === 'DERIVED',
          // Sin su grupo no se sabe con qué se compara: no se compara con nada.
          comparable: g ? `${g.protocolVersionId}|${g.methodVersionId ?? ''}|${g.unit}` : `sin-grupo|${p.sourceId}`,
        });
        porMetrica.set(serie.metricCode, lista);
      }
    }
  }
  for (const lista of porMetrica.values()) lista.sort(porMomento);
  return porMetrica;
}

const diferencia = (desde: Dato, hasta: Dato): DiferenciaDesdeOtraToma => ({
  delta: Number((hasta.valor - desde.valor).toPrecision(12)),
  unidad: hasta.unidad,
  desde: desde.fecha,
  dias: diasEntreFechas(desde.fecha, hasta.fecha),
});

/** La fecha que comparten todas las diferencias que hay; `null` si no hay ninguna o si no es la misma. */
function fechaComun(diferencias: readonly (DiferenciaDesdeOtraToma | null)[]): string | null {
  const fechas = new Set(diferencias.flatMap((d) => (d ? [d.desde] : [])));
  return fechas.size === 1 ? [...fechas][0]! : null;
}

/**
 * La tabla de una toma: de cada métrica que tiene, el valor, la diferencia con la primera toma del mismo grupo y con la
 * anterior del mismo grupo (de otra evaluación, antes que esta). `null` si la toma no tiene ninguna medida en lo leído.
 */
export function desdeElInicioYLaAnterior(respuestas: readonly DatosDeLaEvolucion[], evaluacionId: string): DesdeElInicio | null {
  const filas: (FilaDesdeElInicio & { readonly derivada: boolean })[] = [];
  let fecha: string | null = null;
  for (const [metrica, datos] of datosPorMetrica(respuestas)) {
    const deLaToma = datos.filter((d) => d.evaluacionId === evaluacionId);
    const actual = deLaToma[deLaToma.length - 1];
    if (!actual) continue;
    if (fecha === null || actual.fecha > fecha) fecha = actual.fecha;
    const antes = datos.filter((d) => d.evaluacionId !== evaluacionId && porMomento(d, actual) < 0);
    const delGrupo = antes.filter((d) => d.comparable === actual.comparable);
    const inicio = delGrupo[0];
    const anterior = delGrupo[delGrupo.length - 1];
    filas.push({
      metrica,
      nombre: nombreDeMetrica(metrica),
      valor: actual.valor,
      unidad: actual.unidad,
      desdeElInicio: inicio ? diferencia(inicio, actual) : null,
      desdeLaAnterior: anterior ? diferencia(anterior, actual) : null,
      motivo: delGrupo.length > 0 ? null : antes.length > 0 ? 'OTRO_GRUPO' : 'SIN_PREVIA',
      derivada: actual.derivado,
    });
  }
  if (fecha === null) return null;
  const orden = (a: FilaDesdeElInicio, b: FilaDesdeElInicio) => compararPorCatalogo(a.metrica, b.metrica);
  const sinMarca = ({ derivada: _derivada, ...f }: FilaDesdeElInicio & { readonly derivada: boolean }): FilaDesdeElInicio => f;
  return {
    fecha,
    medidas: filas.filter((f) => !f.derivada).sort(orden).map(sinMarca),
    resultados: filas.filter((f) => f.derivada).sort(orden).map(sinMarca),
    fechaDelInicio: fechaComun(filas.map((f) => f.desdeElInicio)),
    fechaDeLaAnterior: fechaComun(filas.map((f) => f.desdeLaAnterior)),
    parcial: respuestas.some((r) => r.partialView),
  };
}

export const COPY_DESDE_EL_INICIO = {
  titulo: 'Desde el inicio y desde la anterior',
  bajada: 'Cada medida de esta toma, contra la primera toma y la anterior con el mismo protocolo, método y unidad. Es una resta: ubica el cambio, no lo califica.',
  medida: 'Medida',
  estaToma: 'Esta toma',
  desdeElInicio: 'Desde el inicio',
  desdeLaAnterior: 'Desde la anterior',
  mediciones: 'Mediciones',
  resultados: 'Resultados calculados',
  /** La línea fija de debajo (GR-16): sin el error técnico de quien mide, no se puede decir si un cambio lo supera. */
  sinErrorDeMedicion: 'BE no tiene cargado el error de medición de quien mide: no se puede decir si estos cambios lo superan.',
  sinPrevia: 'Sin una toma anterior con esta medida',
  otroGrupo: 'Antes se tomó con otro protocolo, método o unidad: no se compara',
  primeraToma: 'Es la primera toma: todavía no hay otra con la que compararla.',
  sinMedidas: 'Esta toma no tiene medidas para comparar en lo leído.',
  leyendo: 'Leyendo las tomas anteriores…',
  noSeLeyo: 'No pudimos leer las tomas anteriores para compararlas.',
  /** Las fechas de referencia, una vez, arriba de la tabla. */
  inicioYAnterior: (inicio: string | null, anterior: string | null) =>
    [inicio ? `Inicio: la toma del ${inicio}` : null, anterior ? `anterior: la del ${anterior}` : null].filter((x): x is string => x !== null).join('; '),
  desdeCuandoSeLeyo: (fecha: string) => `Se leyeron las tomas desde el ${fecha}: «Desde el inicio» empieza ahí.`,
  parcial: 'Hay tomas de otro profesional que no se muestran: no entran en la tabla.',
} as const;

/** «el mismo día» o «84 días»: los días de calendario entre las dos fechas, para la celda. */
export const diasEntreLasTomas = (dias: number): string => (dias === 0 ? 'el mismo día' : `${numero(dias)} ${dias === 1 ? 'día' : 'días'}`);

/** El valor de la toma, con su unidad. */
export const valorDeLaFila = (f: Pick<FilaDesdeElInicio, 'valor' | 'unidad'>): string => cantidad(f.valor, f.unidad);

/** La diferencia de una celda, con su signo: «+1,5 kg», «−0,8 cm», «0 kg». */
export const diferenciaDeLaFila = (d: DiferenciaDesdeOtraToma): string => textoDeDiferenciaAntropometrica(d);
