/**
 * Los gráficos de Nutrición (rama C: GR-12, GR-13 y GR-14; GR-11 es la capa de temporadas de todos ellos), para el
 * registro común (`registros.ts`). Lo edita solo esa rama.
 *
 * Un gráfico se ofrece solo si se ofrecen todas sus series con esta persona (`seriesOfrecidas`): un área sin acceso no
 * deja rastro, y los gramos por kilo piden Nutrición y Antropometría con planes y tomas propios en las dos (GR-T48).
 * Cada pantalla se carga recién al dibujarse (`graficoPerezoso`): el registro se lee sin cargar ninguna.
 */
import { seOfrecenTodas } from '../nutricion-y-cuerpo/ofrecido';
import { graficoPerezoso } from '../nutricion-y-cuerpo/perezoso';
import type { GraficoRegistrado } from '../registro-de-graficos';
import { COPY_NUTRICION_EN_GRAFICOS as C } from './copy';

const SIN_REQUISITOS = { ejercicio: false, listaV1: false, medida: false } as const;

const ENERGIA = ['nutricion.energia'] as const;
const MACROS = ['nutricion.proteinas', 'nutricion.carbohidratos', 'nutricion.grasas', 'nutricion.fibra'] as const;
const POR_KILO = ['nutricion.proteinas-por-kilo', 'nutricion.carbohidratos-por-kilo', 'nutricion.grasas-por-kilo'] as const;
const COMPARACION = ['nutricion.energia', 'nutricion.proteinas', 'nutricion.carbohidratos', 'nutricion.grasas'] as const;

export const GRAFICOS_DE_NUTRICION: readonly GraficoRegistrado[] = [
  {
    id: 'nutricion.energia-por-dia',
    codigo: 'GR-12',
    area: 'NUTRICION',
    titulo: C.energia.pregunta,
    ubicacion: 'EN_EL_TIEMPO',
    series: ENERGIA,
    requiere: SIN_REQUISITOS,
    ofrecido: seOfrecenTodas(ENERGIA),
    Grafico: graficoPerezoso(() => import('./energia-por-dia-en-pantalla').then((m) => m.EnergiaPorDia)),
  },
  {
    id: 'nutricion.macros-en-paneles',
    codigo: 'GR-13',
    area: 'NUTRICION',
    titulo: C.macros.pregunta,
    ubicacion: 'EN_EL_TIEMPO',
    series: MACROS,
    requiere: SIN_REQUISITOS,
    ofrecido: seOfrecenTodas(MACROS),
    Grafico: graficoPerezoso(() => import('./macros-en-paneles-en-pantalla').then((m) => m.MacrosEnPaneles)),
  },
  {
    // GR-13 en g/kg: una tarjeta propia, que se ofrece solo con las dos áreas y lo propio en las dos (GR-T48).
    id: 'nutricion.macros-por-kilo',
    codigo: 'GR-13',
    area: 'NUTRICION',
    titulo: C.porKilo.pregunta,
    ubicacion: 'EN_EL_TIEMPO',
    series: POR_KILO,
    requiere: SIN_REQUISITOS,
    ofrecido: seOfrecenTodas(POR_KILO),
    Grafico: graficoPerezoso(() => import('./macros-en-paneles-en-pantalla').then((m) => m.MacrosPorKilo)),
  },
  {
    id: 'nutricion.indicado-y-registrado-por-dia',
    codigo: 'GR-14',
    area: 'NUTRICION',
    titulo: C.indicadoYRegistrado.pregunta,
    ubicacion: 'EN_EL_TIEMPO',
    series: COMPARACION,
    requiere: SIN_REQUISITOS,
    ofrecido: seOfrecenTodas(COMPARACION),
    Grafico: graficoPerezoso(() => import('./indicado-y-registrado-por-dia-en-pantalla').then((m) => m.IndicadoYRegistradoPorDia)),
  },
];
