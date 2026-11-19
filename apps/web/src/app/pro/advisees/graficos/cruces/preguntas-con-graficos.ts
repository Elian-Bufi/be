/**
 * Dos preguntas de «Analizar» que responden con gráficos del registro (WP-GRAFICOS fase 2, rama D; GR-VD01 y GR-VD02, a
 * ratificar). La rama D es la única que toca «Analizar» (§11.2), y §4.4 pone GR-12 y GR-13 también ahí; los cruces
 * preparados (SP-01 y SP-02) tenían su pantalla solo en «Patrones» (rama E), que todavía no está.
 * - **«¿Qué registró en Nutrición, por día y por semana?»** responde con GR-12 (las calorías por día, con lo que se sabe de
 *   cada día, el objetivo y la media de cada semana) y GR-13 (los macronutrientes en paneles y, si se ofrece, en g/kg).
 * - **«¿Qué pasó en dos áreas en el mismo tiempo?» («Ver la relación»)** responde con los cruces preparados del caso 1:
 *   SP-01 y SP-02, cada uno con su ventana fijada antes de mirar, lo que también cambió y la frase fija.
 *
 * Como la composición y la fuerza (TA-25), viven en el website y no se guardan como vista: sus identificadores no entran
 * en `ID_DE_PREGUNTAS`, que valida la API. Cada gráfico se ofrece con la regla de su registro (`ofrecido`, con el acceso
 * de hoy): un área sin acceso no aparece, ni en gris ni con candado, y la tarjeta de la pregunta tampoco si no se ofrece
 * ningún gráfico. Abierta por la dirección sin nada que ofrecer, muestra un estado vacío con su título que dice por qué
 * (`porQueNoHayGraficos`; GR-VD08, ratificado el 19/11).
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs` (TEST-GRVD-003).
 */
import { entraEnLaEstimacion, type AccesoDeLaPersona, type EjercicioDelPeriodo } from '@be/domain';
import { GRAFICOS_DE_NUTRICION } from '../nutricion/registro';
import type { ContextoDelRegistro, EjercicioDelGraficoElegido, GraficoRegistrado } from '../registro-de-graficos';
import { cruceOfrecido } from './caso-de-acceso';
import { GRAFICOS_DE_CRUCES } from './registro';

/** Los identificadores de las preguntas en la dirección (`pregunta=`). No son de `ID_DE_PREGUNTAS` (TA-25). */
export const PREGUNTA_DE_NUTRICION_POR_DIA = 'nutricion-por-dia-y-por-semana';
export const PREGUNTA_DE_LA_RELACION = 'ver-la-relacion';
export type PreguntaConGraficos = typeof PREGUNTA_DE_NUTRICION_POR_DIA | typeof PREGUNTA_DE_LA_RELACION;

export const PREGUNTAS_CON_GRAFICOS: Readonly<
  Record<PreguntaConGraficos, { readonly pregunta: string; readonly muestra: string; readonly graficos: readonly string[] }>
> = {
  [PREGUNTA_DE_NUTRICION_POR_DIA]: {
    pregunta: '¿Qué registró en Nutrición, por día y por semana?',
    muestra: 'Las calorías y los macronutrientes registrados de cada día, con lo que se sabe de cada uno, el objetivo y la media de cada semana.',
    graficos: ['nutricion.energia-por-dia', 'nutricion.macros-en-paneles', 'nutricion.macros-por-kilo'],
  },
  [PREGUNTA_DE_LA_RELACION]: {
    pregunta: '¿Qué pasó en dos áreas en el mismo tiempo?',
    muestra: 'Ver la relación: dos áreas sobre el mismo eje de fechas, con una ventana fijada antes de mirar y lo que también cambió. Que coincidan no dice que una cosa cause la otra.',
    graficos: ['cruce.carbohidratos-y-fuerza', 'cruce.energia-y-peso'],
  },
};

export const esPreguntaConGraficos = (id: string | null): id is PreguntaConGraficos => id === PREGUNTA_DE_NUTRICION_POR_DIA || id === PREGUNTA_DE_LA_RELACION;

/** Lo que el registro mira para ofrecer un gráfico, con lo que se leyó de esta persona en el período. */
export function contextoDelRegistro(
  acceso: AccesoDeLaPersona,
  d: { readonly ejercicios: readonly EjercicioDelPeriodo[] | null; readonly antropometria: readonly { readonly metricCode: string; readonly observations: number }[] | null },
): ContextoDelRegistro {
  return { acceso, ejercicios: d.ejercicios, medidas: d.antropometria === null ? null : d.antropometria.filter((m) => m.observations > 0).map((m) => m.metricCode) };
}

/** Los gráficos con que responde una pregunta, en su orden, solo los que se ofrecen con esta persona hoy. */
export function graficosDeLaPregunta(pregunta: PreguntaConGraficos, c: ContextoDelRegistro): GraficoRegistrado[] {
  const todos = [...GRAFICOS_DE_NUTRICION, ...GRAFICOS_DE_CRUCES];
  return PREGUNTAS_CON_GRAFICOS[pregunta].graficos.flatMap((id) => {
    const g = todos.find((x) => x.id === id);
    return g && g.ofrecido(c) ? [g] : [];
  });
}

/** Los ejercicios del período con sesiones que entran en la estimación del 1RM (la lista de la v1), del más registrado al menos. */
export function ejerciciosDeLaListaV1(ejercicios: readonly EjercicioDelPeriodo[] | null): EjercicioDelPeriodo[] {
  return (ejercicios ?? []).filter((e) => e.sessions > 0 && e.exerciseKey.startsWith('e:') && entraEnLaEstimacion(e.exerciseKey.slice(2)));
}

/** El ejercicio de SP-01, como lo recibe un gráfico del registro: el elegido o, si no, el más registrado de la lista de la v1. */
export function ejercicioDelCruce(ejercicios: readonly EjercicioDelPeriodo[] | null, elegido: string | null): EjercicioDelGraficoElegido | null {
  const v1 = ejerciciosDeLaListaV1(ejercicios);
  const e = v1.find((x) => x.exerciseKey === elegido) ?? v1[0];
  if (!e) return null;
  const unidad = e.loadUnits.includes('kg') ? 'kg' : e.loadUnits.includes('lb') ? 'lb' : null;
  return { exerciseKey: e.exerciseKey, nombre: e.name, unidad, serie: null };
}

/** Por qué una pregunta no tiene nada que mostrar: un título y una frase que ubican, sin calificar. */
export interface SinGraficosParaMostrar {
  readonly titulo: string;
  readonly texto: string;
}

/**
 * GR-VD08, ratificado por Dirección el 19/11: una pregunta con gráficos sin ninguno que se ofrezca (abierta por la
 * dirección, o porque el período no tiene lo que pide) **muestra un estado vacío con su título que dice por qué**, en vez
 * de volver a «Analizar» sin decir nada. El motivo sale de lo mismo que decide ofrecer cada gráfico: el acceso de hoy
 * (un área que no se ve, o sin planes o tomas propios en las dos áreas de un cruce) o lo que hay en el período. Dice lo
 * que el profesional ya sabe de su propio acceso; nunca qué hay en un área que no ve.
 */
export function porQueNoHayGraficos(pregunta: PreguntaConGraficos, c: ContextoDelRegistro): SinGraficosParaMostrar {
  const titulo = 'No hay gráficos para mostrar';
  if (pregunta === PREGUNTA_DE_NUTRICION_POR_DIA) {
    return c.acceso.alcances.includes('NUTRICION')
      ? { titulo, texto: 'Con lo que ves hoy de Nutrición de esta persona no se arma ninguno de estos gráficos.' }
      : { titulo, texto: 'Esta pregunta se responde con lo que la persona registra en Nutrición, y hoy no ves su Nutrición.' };
  }
  const fuerza = cruceOfrecido('SP-01', c.acceso);
  const peso = cruceOfrecido('SP-02', c.acceso);
  if (!fuerza && !peso) {
    return {
      titulo,
      texto: 'Ver la relación junta dos áreas en las que acompañás a esta persona con planes o tomas tuyos: Nutrición con Entrenamiento, o Nutrición con Antropometría. Hoy no se da ninguno de esos pares.',
    };
  }
  const falta = [...(fuerza ? ['sesiones de un ejercicio con el que se estima la fuerza'] : []), ...(peso ? ['tomas de peso'] : [])];
  return { titulo, texto: `En el período no hay ${falta.join(' ni ')}. Probá con otro período.` };
}
