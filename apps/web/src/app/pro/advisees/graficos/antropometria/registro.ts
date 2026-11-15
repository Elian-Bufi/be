/**
 * Los gráficos de Antropometría (rama C: GR-18 y GR-20), para el registro común (`registros.ts`). Lo edita solo esa rama.
 *
 * Se ofrecen solo con el alcance de Antropometría (un área sin acceso no deja rastro); GR-20, además, si se ofrecen sus
 * series del catálogo. Cada pantalla se carga recién al dibujarse (`graficoPerezoso`).
 */
import { seOfrecenTodas } from '../nutricion-y-cuerpo/ofrecido';
import { graficoPerezoso } from '../nutricion-y-cuerpo/perezoso';
import type { GraficoRegistrado } from '../registro-de-graficos';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';

const SIN_REQUISITOS = { ejercicio: false, listaV1: false, medida: false } as const;

/** Las series de GR-20 en el catálogo: la masa grasa y la libre de grasa, según Durnin y Womersley y según Faulkner. */
const MASAS = [
  'antropometria.masa-grasa-durnin-womersley',
  'antropometria.masa-grasa-faulkner',
  'antropometria.masa-libre-de-grasa-durnin-womersley',
  'antropometria.masa-libre-de-grasa-faulkner',
] as const;

export const GRAFICOS_DE_ANTROPOMETRIA: readonly GraficoRegistrado[] = [
  {
    id: 'antropometria.perfil-por-sitio',
    codigo: 'GR-18',
    area: 'ANTROPOMETRIA',
    titulo: C.perfil.pregunta,
    ubicacion: 'COMPARACION',
    series: [],
    requiere: SIN_REQUISITOS,
    // Los sitios se resuelven por su código: se ofrece con el alcance de Antropometría.
    ofrecido: (c) => c.acceso.alcances.includes('ANTROPOMETRIA'),
    Grafico: graficoPerezoso(() => import('./perfil-por-sitio-en-pantalla').then((m) => m.PerfilPorSitio)),
  },
  {
    id: 'antropometria.masa-grasa-por-metodo',
    codigo: 'GR-20',
    area: 'ANTROPOMETRIA',
    titulo: C.masas.pregunta,
    ubicacion: 'EN_EL_TIEMPO',
    series: MASAS,
    requiere: SIN_REQUISITOS,
    ofrecido: seOfrecenTodas(MASAS),
    Grafico: graficoPerezoso(() => import('./masa-grasa-por-metodo-en-pantalla').then((m) => m.MasaGrasaPorMetodo)),
  },
];
