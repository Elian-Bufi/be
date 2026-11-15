/**
 * Las series de Nutrición del catálogo de los gráficos (DL-174). Alcance NUTRICION, caso 1: los registros que ejecutan
 * planes del profesional que consulta. Fuente API-PRJ-01 `NUTRITION_PRESCRIBED_VS_RECORDED`, método
 * `SUM_SOURCE_PER_100G_V1` con las kcal de la fuente. Eje X por día, o por semana con la media de los días con dato
 * (que dice cuántos). Marca llena para un día COMPLETE y hueca para un subtotal; sin registro, nada.
 *
 * Este archivo lo edita solo la rama de Nutrición y Antropometría (C).
 */
import { definicionDeMetrica, type DefinicionDeMetrica } from './metricas-del-analisis';
import type { SerieDisponible } from './series-disponibles';

function delDiccionario(id: string): DefinicionDeMetrica {
  const d = definicionDeMetrica(id);
  if (!d) throw new Error(`El diccionario de «Analizar» no tiene ${id}`);
  return d;
}

const METODO_DE_LA_SUMA = { nombre: 'SUM_SOURCE_PER_100G_V1', rotulo: 'Suma de lo registrado con cantidades (v1)' } as const;

function deNutricion(id: string, graficos: readonly string[]): SerieDisponible {
  const definicion = delDiccionario(id);
  return {
    id,
    definicion,
    ejeX: 'FECHA',
    granos: ['DAY', 'WEEK'],
    unirPuntos: true,
    fuente: { tipo: 'PROYECCION', operacion: 'API-PRJ-01', clave: 'NUTRITION_PRESCRIBED_VS_RECORDED', parametro: definicion.parametro === null ? null : String(definicion.parametro) },
    acceso: { alcances: ['NUTRICION'], caso: 'PLANES_PROPIOS', soloProfesional: false },
    metodo: id === 'nutricion.registros' ? null : METODO_DE_LA_SUMA,
    marca: 'REGISTRADO',
    requiere: { ejercicio: false, serie: false, listaV1: false },
    rangoMinimoDelEje: null,
    estado: 'OFRECIDA',
    graficos,
  };
}

/**
 * Los gramos por kilo de lo registrado (GR-13; GR-T13): los gramos del día ÷ el peso medido de la última toma del mismo
 * profesional en ese día o antes. Sin una toma anterior, sin valor; cada punto dice la fecha del peso. Sin cambio
 * relativo. Hasta que la rama C la programe, no se ofrece.
 */
function porKilo(nutriente: 'carbohidratos' | 'proteinas' | 'grasas', nombre: string, registrados: 'registrados' | 'registradas'): SerieDisponible {
  const base = delDiccionario(`nutricion.${nutriente}`);
  const id = `nutricion.${nutriente}-por-kilo`;
  const definicion: DefinicionDeMetrica = {
    ...base,
    id,
    nombre: `${nombre} ${registrados} por kilo de peso`,
    nombreCorto: `${nombre} por kilo`,
    unidad: 'g/kg',
    clase: 'DERIVABLE',
    implementada: false,
    parametro: null,
    granos: [{ grano: 'DAY', agregacion: 'SUM_OF_KNOWN' }],
    granoPorDefecto: 'DAY',
    familia: 'macronutriente-g-kg',
    cambioRelativo: false,
    decimales: 2,
    explicacion: `${nombre} ${registrados} en el día, por cada kilo del peso medido en la última toma anterior.`,
    comoSeCalcula:
      'Los gramos del día (la misma suma de lo registrado con cantidades) divididos por el peso de la última toma del mismo profesional en ese día o antes. Cada punto dice la fecha del peso que usó.',
    ausencias: 'Sin una toma anterior al día, el día no tiene valor: no se usa un peso posterior ni uno inventado.',
    limites: ['Es lo registrado por kilo de un peso medido otro día: si el peso cambió desde esa toma, el número no lo sabe.'],
  };
  return {
    id,
    definicion,
    ejeX: 'FECHA',
    granos: ['DAY'],
    unirPuntos: true,
    fuente: { tipo: 'DERIVADA', de: [`nutricion.${nutriente}`, 'antropometria.peso'], regla: 'GRAMOS_DEL_DIA_SOBRE_EL_PESO_DE_LA_TOMA_ANTERIOR_V1' },
    acceso: { alcances: ['NUTRICION', 'ANTROPOMETRIA'], caso: 'PLANES_PROPIOS', soloProfesional: false },
    metodo: { nombre: 'g/kg con el peso de la toma v1', rotulo: 'g/kg con el peso de la toma, v1' },
    marca: 'REGISTRADO',
    requiere: { ejercicio: false, serie: false, listaV1: false },
    rangoMinimoDelEje: null,
    estado: 'EN_PREPARACION',
    graficos: ['GR-13'],
  };
}

export const SERIES_DE_NUTRICION: readonly SerieDisponible[] = [
  deNutricion('nutricion.energia', ['GR-11', 'GR-12', 'SP-01', 'SP-02']),
  deNutricion('nutricion.carbohidratos', ['GR-13', 'SP-01']),
  deNutricion('nutricion.grasas', ['GR-13']),
  deNutricion('nutricion.proteinas', ['GR-13']),
  deNutricion('nutricion.fibra', ['GR-13']),
  deNutricion('nutricion.registros', []),
  porKilo('carbohidratos', 'Carbohidratos', 'registrados'),
  porKilo('grasas', 'Grasas', 'registradas'),
  porKilo('proteinas', 'Proteínas', 'registradas'),
  // Las calorías previstas del día siguen INCOMPLETAS en el diccionario: el plan tiene alternativas por comida.
  { ...deNutricion('nutricion.energia-prevista-del-dia', []), estado: 'PIDE_DL', marca: 'INDICADO', metodo: null },
];
