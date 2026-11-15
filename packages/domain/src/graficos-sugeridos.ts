/**
 * Los gráficos sugeridos y sus identificadores estables (WP-GRAFICOS, DL-174): lo que se guarda en un enfoque (GR-27).
 * Son opacos y tienen la forma `area.nombre`. La API los valida con una expresión y no con una lista cerrada (GR-T17):
 * un gráfico nuevo no obliga a redesplegar la API, y el website ignora un identificador que no conoce.
 *
 * No se eligen sueltos: GR-04 (es una marca del buscador), GR-11 (es la capa de temporadas de todo gráfico de Nutrición)
 * y GR-23 (la cinta va siempre arriba).
 */
import { z } from 'zod';
import type { Alcance } from './alcance';

export const EXPRESION_DE_ID_DE_GRAFICO = /^(entrenamiento|nutricion|antropometria|cruce)\.[a-z0-9-]+$/;

export const IdDeGraficoSchema = z.string().max(80).regex(EXPRESION_DE_ID_DE_GRAFICO);
export type IdDeGrafico = z.infer<typeof IdDeGraficoSchema>;

export const esIdDeGrafico = (valor: unknown): valor is IdDeGrafico => typeof valor === 'string' && valor.length <= 80 && EXPRESION_DE_ID_DE_GRAFICO.test(valor);

export type AreaDelGrafico = 'ENTRENAMIENTO' | 'NUTRICION' | 'ANTROPOMETRIA' | 'CRUCE';

/**
 * Dónde va en «Patrones»: sobre el eje de fechas común («En el tiempo»), con su propio eje («Comparaciones») o en «Ver
 * la relación» (los cruces preparados, solo con las dos áreas y planes propios en las dos).
 */
export type UbicacionDelGrafico = 'EN_EL_TIEMPO' | 'COMPARACION' | 'RELACION';

export interface GraficoSugerido {
  readonly id: IdDeGrafico;
  /** El código de la propuesta: GR-02, SP-01. */
  readonly codigo: string;
  readonly area: AreaDelGrafico;
  /** 1 para los que entran en la fase 1 (GR-01 y GR-16); 2 para los de este reparto. */
  readonly fase: 1 | 2;
  readonly ubicacion: UbicacionDelGrafico;
  /** Todos los alcances que pide: un cruce pide los dos. */
  readonly alcances: readonly Alcance[];
  /** Las series del catálogo que dibuja (`series-disponibles.ts`). */
  readonly series: readonly string[];
  readonly requiere: { readonly ejercicio: boolean; readonly listaV1: boolean; readonly medida: boolean };
}

const sugerido = (
  id: IdDeGrafico,
  codigo: string,
  area: AreaDelGrafico,
  fase: 1 | 2,
  ubicacion: UbicacionDelGrafico,
  alcances: readonly Alcance[],
  series: readonly string[],
  requiere: Partial<GraficoSugerido['requiere']> = {},
): GraficoSugerido => ({ id, codigo, area, fase, ubicacion, alcances, series, requiere: { ejercicio: false, listaV1: false, medida: false, ...requiere } });

export const GRAFICOS_SUGERIDOS: readonly GraficoSugerido[] = [
  sugerido('entrenamiento.la-vez-pasada', 'GR-01', 'ENTRENAMIENTO', 1, 'COMPARACION', ['ENTRENAMIENTO'], ['entrenamiento.carga', 'entrenamiento.repeticiones', 'entrenamiento.rir'], { ejercicio: true }),
  sugerido('entrenamiento.fuerza-estimada', 'GR-02', 'ENTRENAMIENTO', 2, 'EN_EL_TIEMPO', ['ENTRENAMIENTO'], ['entrenamiento.1rm-estimado'], { ejercicio: true, listaV1: true }),
  sugerido('entrenamiento.carga-repeticiones-y-rir', 'GR-03', 'ENTRENAMIENTO', 2, 'EN_EL_TIEMPO', ['ENTRENAMIENTO'], ['entrenamiento.carga', 'entrenamiento.repeticiones', 'entrenamiento.rir'], { ejercicio: true }),
  sugerido('entrenamiento.rir-indicado-y-registrado', 'GR-05', 'ENTRENAMIENTO', 2, 'EN_EL_TIEMPO', ['ENTRENAMIENTO'], ['entrenamiento.rir-indicado', 'entrenamiento.rir'], { ejercicio: true }),
  sugerido('entrenamiento.perfil-carga-repeticiones', 'GR-06', 'ENTRENAMIENTO', 2, 'COMPARACION', ['ENTRENAMIENTO'], ['entrenamiento.carga', 'entrenamiento.repeticiones'], { ejercicio: true }),
  sugerido('nutricion.energia-por-dia', 'GR-12', 'NUTRICION', 2, 'EN_EL_TIEMPO', ['NUTRICION'], ['nutricion.energia']),
  sugerido('nutricion.macros-en-paneles', 'GR-13', 'NUTRICION', 2, 'EN_EL_TIEMPO', ['NUTRICION'], ['nutricion.proteinas', 'nutricion.carbohidratos', 'nutricion.grasas', 'nutricion.fibra']),
  sugerido('nutricion.indicado-y-registrado-por-dia', 'GR-14', 'NUTRICION', 2, 'EN_EL_TIEMPO', ['NUTRICION'], ['nutricion.energia', 'nutricion.proteinas', 'nutricion.carbohidratos', 'nutricion.grasas']),
  sugerido('antropometria.desde-el-inicio', 'GR-16', 'ANTROPOMETRIA', 1, 'COMPARACION', ['ANTROPOMETRIA'], [], { medida: true }),
  sugerido('antropometria.perfil-por-sitio', 'GR-18', 'ANTROPOMETRIA', 2, 'COMPARACION', ['ANTROPOMETRIA'], []),
  sugerido('antropometria.masa-grasa-por-metodo', 'GR-20', 'ANTROPOMETRIA', 2, 'EN_EL_TIEMPO', ['ANTROPOMETRIA'], [
    'antropometria.masa-grasa-durnin-womersley',
    'antropometria.masa-grasa-faulkner',
    'antropometria.masa-libre-de-grasa-durnin-womersley',
    'antropometria.masa-libre-de-grasa-faulkner',
  ]),
  sugerido('cruce.dos-etapas', 'GR-24', 'CRUCE', 2, 'COMPARACION', [], [], { medida: true }),
  sugerido('cruce.carbohidratos-y-fuerza', 'SP-01', 'CRUCE', 2, 'RELACION', ['NUTRICION', 'ENTRENAMIENTO'], ['nutricion.carbohidratos', 'entrenamiento.1rm-estimado', 'nutricion.energia'], { ejercicio: true, listaV1: true }),
  sugerido('cruce.energia-y-peso', 'SP-02', 'CRUCE', 2, 'RELACION', ['NUTRICION', 'ANTROPOMETRIA'], ['nutricion.energia', 'antropometria.peso']),
];

/** El sugerido de un identificador, o `null` si este website no lo conoce (se ignora, no es un error). */
export const graficoSugerido = (id: string): GraficoSugerido | null => GRAFICOS_SUGERIDOS.find((g) => g.id === id) ?? null;

/** Los códigos que no se eligen sueltos en un enfoque. */
export const CODIGOS_QUE_NO_SE_ELIGEN_SUELTOS: readonly string[] = ['GR-04', 'GR-11', 'GR-23'];
