/**
 * Las series de Entrenamiento del catálogo de los gráficos (DL-174). Alcance ENTRENAMIENTO, caso 1: las sesiones que
 * ejecutan planes del profesional que consulta. Piden el ejercicio por su identidad (`e:` o `v:`); kg y lb nunca van
 * juntas. Cada punto es la serie del mismo número en una sesión: no se promedian, suman ni eligen máximos entre series.
 *
 * Este archivo lo edita solo la rama de Entrenamiento (B).
 */
import { definicionDeMetrica, type DefinicionDeMetrica } from './metricas-del-analisis';
import type { EstadoDeLaSerie, SerieDisponible } from './series-disponibles';

function delDiccionario(id: string): DefinicionDeMetrica {
  const d = definicionDeMetrica(id);
  if (!d) throw new Error(`El diccionario de «Analizar» no tiene ${id}`);
  return d;
}

const ACCESO = { alcances: ['ENTRENAMIENTO'], caso: 'PLANES_PROPIOS', soloProfesional: false } as const;

function deEntrenamiento(id: string, estado: EstadoDeLaSerie, graficos: readonly string[], semanal = false): SerieDisponible {
  const definicion = delDiccionario(id);
  return {
    id,
    definicion,
    ejeX: 'SESION',
    granos: semanal ? ['ORIGINAL', 'WEEK'] : ['ORIGINAL'],
    unirPuntos: true,
    fuente: { tipo: 'PROYECCION', operacion: 'API-PRJ-01', clave: definicion.proyeccion, parametro: definicion.parametro === null ? null : String(definicion.parametro) },
    acceso: ACCESO,
    metodo: null,
    marca: 'REGISTRADO',
    requiere: { ejercicio: true, serie: definicion.requiereSerie, listaV1: false },
    rangoMinimoDelEje: null,
    estado,
    graficos,
  };
}

/**
 * El RIR indicado por el plan para esa serie en cada sesión (GR-05; GR-T14): la prescripción de la versión que rigió,
 * leída del comparador (API-TRN-21 en tramos de 92 días y API-SER-01 por versión, con `evolucion`). Un rango indicado se
 * dibuja como segmento hueco. La ofrece la rama B, que la usa en GR-03 y GR-05 y la lee por `leerSerieDelCatalogo`
 * (`graficos/entrenamiento/lecturas-del-ejercicio.ts`).
 */
const RIR_INDICADO: SerieDisponible = (() => {
  const base = delDiccionario('entrenamiento.rir');
  const definicion: DefinicionDeMetrica = {
    ...base,
    id: 'entrenamiento.rir-indicado',
    nombre: 'RIR indicado en la serie',
    nombreCorto: 'RIR indicado',
    clase: 'DERIVABLE',
    implementada: true,
    parametro: null,
    explicacion: 'Las repeticiones en reserva que indicaba el plan para la serie elegida, en la versión que rigió cada sesión.',
    comoSeCalcula: 'Sale de la prescripción de la versión del plan que rigió ese día (el objetivo de la serie o, si no tiene, el de la prescripción). Es lo indicado, no lo registrado.',
    ausencias: 'Si la versión no indicaba un RIR para esa serie, no hay punto.',
    limites: ['Es lo que indicaba el plan, no lo que hizo la persona.', 'El RIR no es una escala de razones: no admite cambio relativo.'],
  };
  return {
    id: definicion.id,
    definicion,
    ejeX: 'SESION',
    granos: ['ORIGINAL'],
    unirPuntos: true,
    fuente: { tipo: 'CONTEXTO_DE_REVISION', operaciones: ['API-TRN-21', 'API-SER-01'], diasPorLectura: 92 },
    acceso: ACCESO,
    metodo: null,
    marca: 'INDICADO',
    requiere: { ejercicio: true, serie: true, listaV1: false },
    rangoMinimoDelEje: null,
    estado: 'OFRECIDA',
    graficos: ['GR-03', 'GR-05'],
  };
})();

/**
 * El 1RM estimado con Epley v1 (DL-171; GR-02, GR-24 y SP-01), solo para la lista de la v1 (RM-16), con RIR de 0 a 2 y
 * lo que escribió la persona. Lleno hasta 10 repeticiones equivalentes, hueco de 10 a 12 y rombo para lo observado por
 * el profesional. Sin cambio relativo ni porcentaje; el eje abarca 10 kg o 22 lb como mínimo (GR-T15).
 */
const UNO_RM_ESTIMADO: SerieDisponible = (() => {
  const definicion: DefinicionDeMetrica = {
    id: 'entrenamiento.1rm-estimado',
    area: 'ENTRENAMIENTO',
    nombre: '1RM estimado (Epley v1)',
    nombreCorto: '1RM estimado',
    unidad: 'kg',
    escala: 'RATIO',
    clase: 'DERIVABLE',
    implementada: true,
    proyeccion: 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE',
    parametro: null,
    requiereEjercicio: true,
    requiereSerie: false,
    granos: [{ grano: 'ORIGINAL', agregacion: 'NONE' }],
    granoPorDefecto: 'ORIGINAL',
    familia: 'estimacion-de-fuerza',
    cambioRelativo: false,
    decimales: 1,
    resumenDePeriodo: 'MEDIANA',
    explicacion: 'La estimación del 1RM con la fórmula de Epley (v1), sesión a sesión, con la serie que elige la regla de la sesión.',
    comoSeCalcula:
      'Con la carga, las repeticiones y el RIR de la serie elegida (RIR de 0 a 2). Hasta 10 repeticiones equivalentes la marca va llena; de 10 a 12, hueca. Solo entra lo que escribió la persona; lo observado por el profesional va con un rombo.',
    ausencias: 'Una sesión sin una serie que entre en la estimación no es un punto: «Cómo se calculó» dice por qué.',
    limites: ['Es una estimación con su método, no una medición: entre sesiones aparecen diferencias aunque la fuerza no cambie.', 'kg y lb nunca van juntas.'],
  };
  return {
    id: definicion.id,
    definicion,
    ejeX: 'SESION',
    granos: ['ORIGINAL'],
    unirPuntos: true,
    fuente: { tipo: 'PROYECCION', operacion: 'API-PRJ-01', clave: 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', parametro: null },
    acceso: { alcances: ['ENTRENAMIENTO'], caso: 'PLANES_PROPIOS', soloProfesional: true },
    metodo: { nombre: 'Epley v1', rotulo: '1RM estimado (Epley v1)' },
    marca: 'REGISTRADO',
    requiere: { ejercicio: true, serie: false, listaV1: true },
    rangoMinimoDelEje: { kg: 10, lb: 22 },
    estado: 'OFRECIDA',
    graficos: ['GR-02', 'GR-24', 'SP-01'],
  };
})();

/**
 * WP-GRAFICOS-POR-FASE (GPF-07; DL-187): lo indicado y lo hecho del volumen de un ejercicio, para sumarlo en «Armá tu
 * gráfico». Salen del comparador, como el RIR indicado (API-TRN-21 en tramos de 92 días y API-SER-01 por versión): las
 * calcula el website con la convención de DL-187 (`graficos/entrenamiento/programado-y-hecho.ts`). El volumen de la
 * proyección (`entrenamiento.volumen-carga-externa`, API-PRJ-01) sigue sin ofrecerse: cuando la API lo calcule con esta
 * convención, reemplaza a `entrenamiento.carga-por-repeticiones-hecha`. En pantalla no se dice «volumen» (es un término
 * prohibido de Entrenamiento, B10-06): se dice «carga × repeticiones» (GPF-D09).
 */
function delComparador(id: string, base: string, cambios: Partial<DefinicionDeMetrica>, marca: 'REGISTRADO' | 'INDICADO'): SerieDisponible {
  const definicion: DefinicionDeMetrica = { ...delDiccionario(base), id, clase: 'DERIVABLE', implementada: true, ...cambios };
  return {
    id,
    definicion,
    ejeX: 'SESION',
    granos: ['ORIGINAL'],
    unirPuntos: true,
    fuente: { tipo: 'CONTEXTO_DE_REVISION', operaciones: ['API-TRN-21', 'API-SER-01'], diasPorLectura: 92 },
    acceso: ACCESO,
    metodo: null,
    marca,
    requiere: { ejercicio: true, serie: false, listaV1: false },
    rangoMinimoDelEje: null,
    estado: 'OFRECIDA',
    graficos: ['GPF-06'],
  };
}

const VOLUMEN = {
  unidad: 'kg·rep',
  escala: 'RATIO',
  parametro: 'LOAD',
  granos: [{ grano: 'ORIGINAL', agregacion: 'SUM' }],
  cambioRelativo: false,
  decimales: 0,
  limites: ['Es carga × repeticiones con la carga como se registró (con mancuernas, por mancuerna).', 'No equivale a trabajo mecánico, gasto energético ni estímulo.', 'kg y lb nunca van juntas.'],
} as const satisfies Partial<DefinicionDeMetrica>;

const SERIES_INDICADAS = delComparador(
  'entrenamiento.series-indicadas',
  'entrenamiento.series-registradas',
  {
    nombre: 'Series indicadas del ejercicio',
    nombreCorto: 'Series indicadas',
    explicacion: 'Cuántas series efectivas planificaba para el ejercicio la versión del plan que rigió cada sesión.',
    comoSeCalcula: 'Se cuentan las series planificadas de la prescripción en la instantánea de la sesión. El calentamiento no cuenta.',
    ausencias: 'Una sesión sustituida por otro ejercicio no tiene series indicadas de este.',
    limites: ['Es lo que indicaba el plan, no lo que hizo la persona.'],
  },
  'INDICADO',
);

const VOLUMEN_HECHO = delComparador(
  'entrenamiento.carga-por-repeticiones-hecha',
  'entrenamiento.series-registradas',
  {
    ...VOLUMEN,
    nombre: 'Carga × repeticiones hecha',
    nombreCorto: 'Carga × rep. hecha',
    explicacion: 'La suma de carga × repeticiones de las series efectivas registradas del ejercicio en cada sesión.',
    comoSeCalcula: 'Con la carga como se registró y en una sola unidad (DL-187). Una serie sin carga o sin repeticiones no entra; una sesión «no realizada» aporta 0.',
    ausencias: 'Un registro resumido o un ejercicio sin registrar en la sesión no tienen este dato: no es 0.',
  },
  'REGISTRADO',
);

const VOLUMEN_INDICADO = delComparador(
  'entrenamiento.carga-por-repeticiones-indicada',
  'entrenamiento.series-registradas',
  {
    ...VOLUMEN,
    nombre: 'Carga × repeticiones indicada',
    nombreCorto: 'Carga × rep. indicada',
    explicacion: 'La suma de carga sugerida × repeticiones indicadas de las series planificadas, en la versión que rigió cada sesión.',
    comoSeCalcula: 'Con un rango de repeticiones, lo indicado es un rango, que no se dibuja como un número (DL-187). Si a alguna serie le falta la carga sugerida o las repeticiones, la sesión queda sin indicar.',
    ausencias: 'Un % RM no se convierte a kg: esa sesión queda sin indicar.',
  },
  'INDICADO',
);

export const SERIES_DE_ENTRENAMIENTO: readonly SerieDisponible[] = [
  deEntrenamiento('entrenamiento.carga', 'OFRECIDA', ['GR-03']),
  deEntrenamiento('entrenamiento.repeticiones', 'OFRECIDA', ['GR-03']),
  deEntrenamiento('entrenamiento.rir', 'OFRECIDA', ['GR-03', 'GR-05']),
  deEntrenamiento('entrenamiento.series-registradas', 'OFRECIDA', [], true),
  RIR_INDICADO,
  UNO_RM_ESTIMADO,
  SERIES_INDICADAS,
  VOLUMEN_HECHO,
  VOLUMEN_INDICADO,
  // GR-09 y GR-D2: el nombre y el método piden una DL (fase 3); la entrada del diccionario sigue sin ofrecerse.
  deEntrenamiento('entrenamiento.volumen-carga-externa', 'PIDE_DL', ['GR-09'], true),
  // No implementada en el diccionario: los tiempos de la sesión (API-TIE-03) todavía no entran en los gráficos.
  deEntrenamiento('entrenamiento.descanso-registrado', 'PIDE_DL', []),
];
