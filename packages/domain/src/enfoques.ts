/**
 * GR-27 · Las reglas de los enfoques que usa el website (WP-GRAFICOS rama E, DL-174 y DL-183): dónde rige cada elección,
 * qué se hace con el contenido al editarlo, los sugeridos para tus áreas y cómo se dicen los lugares donde está elegido.
 * Es puro y sin React: lo prueba `enfoques.test.ts` (TEST-GRF-090 a 093).
 *
 * - **Dónde rige** (GR-T09): la elección de un plan, en el editor de ese plan; la de la persona, en el resto (la ficha);
 *   sin ninguna, los sugeridos para tus áreas. El plan se nombra por su identidad, nunca por una versión (GR-T60).
 * - **Editar no copia:** un enfoque es uno solo aunque esté elegido en varios lugares; cambiarlo cambia todos. Por eso,
 *   antes de cambiar uno elegido en otros lugares, se avisa y se ofrece guardar uno nuevo (GR-T10).
 * - **Los lugares:** la API cuenta personas y planes (`choices`, GR-T63), así que la pantalla dice «lugares», nunca
 *   «personas» (GR-VE04).
 */
import {
  LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE,
  MAXIMO_DE_GRAFICOS_POR_ENFOQUE,
  type ContenidoDelEnfoque,
  type EleccionDeEnfoque,
  type EjercicioDelGrafico,
  type GraficoDelEnfoque,
} from './contratos-enfoques';
import type { Alcance } from './alcance';

// ─── Dónde rige ──────────────────────────────────────────────────────────────────────────────────────────────

/** El lugar desde donde se mira: la ficha de la persona, o el editor de uno de sus planes (por la identidad del plan). */
export type LugarDelEnfoque = { readonly tipo: 'PERSONA' } | { readonly tipo: 'PLAN'; readonly ambito: 'TRAINING_PLAN' | 'NUTRITION_PLAN'; readonly planId: string };

const delPlan = (e: EleccionDeEnfoque, ambito: 'TRAINING_PLAN' | 'NUTRITION_PLAN', planId: string): boolean =>
  e.scope === ambito && (ambito === 'TRAINING_PLAN' ? e.trainingPlanId : e.nutritionPlanId)?.toLowerCase() === planId.toLowerCase();

/** La elección guardada exactamente en ese lugar (la que se cambia o se quita desde ahí), o `null`. */
export function eleccionDelLugar(elecciones: readonly EleccionDeEnfoque[], lugar: LugarDelEnfoque): EleccionDeEnfoque | null {
  if (lugar.tipo === 'PERSONA') return elecciones.find((e) => e.scope === 'PERSON') ?? null;
  return elecciones.find((e) => delPlan(e, lugar.ambito, lugar.planId)) ?? null;
}

/**
 * La elección que rige en un lugar: en el editor de un plan, la del plan y, si el plan no tiene, la de la persona; en la
 * ficha, la de la persona. `null`: rigen los sugeridos para tus áreas.
 */
export function eleccionQueRige(elecciones: readonly EleccionDeEnfoque[], lugar: LugarDelEnfoque): { readonly eleccion: EleccionDeEnfoque; readonly de: 'PLAN' | 'PERSONA' } | null {
  if (lugar.tipo === 'PLAN') {
    const delLugar = eleccionDelLugar(elecciones, lugar);
    if (delLugar) return { eleccion: delLugar, de: 'PLAN' };
  }
  const dePersona = elecciones.find((e) => e.scope === 'PERSON');
  return dePersona ? { eleccion: dePersona, de: 'PERSONA' } : null;
}

// ─── El contenido al editarlo ────────────────────────────────────────────────────────────────────────────────

/** Si dos gráficos de un enfoque son el mismo: el mismo sugerido con el mismo ejercicio y medida, o el mismo armado. */
export function mismoGrafico(a: GraficoDelEnfoque, b: GraficoDelEnfoque): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Sube (`-1`) o baja (`+1`) un gráfico; en un extremo, queda como está. */
export function moverGrafico(contenido: ContenidoDelEnfoque, indice: number, sentido: -1 | 1): ContenidoDelEnfoque {
  const destino = indice + sentido;
  if (indice < 0 || indice >= contenido.charts.length || destino < 0 || destino >= contenido.charts.length) return contenido;
  const charts = [...contenido.charts];
  [charts[indice], charts[destino]] = [charts[destino]!, charts[indice]!];
  return { ...contenido, charts };
}

/** Quita un gráfico. Un enfoque tiene al menos uno: quitar el último no se puede (`null`), y la pantalla lo dice. */
export function quitarGrafico(contenido: ContenidoDelEnfoque, indice: number): ContenidoDelEnfoque | null {
  if (contenido.charts.length <= 1 || indice < 0 || indice >= contenido.charts.length) return null;
  return { ...contenido, charts: contenido.charts.filter((_, i) => i !== indice) };
}

export type AlAgregar = { readonly tipo: 'AGREGADO'; readonly contenido: ContenidoDelEnfoque } | { readonly tipo: 'TOPE' } | { readonly tipo: 'REPETIDO' };

/** Agrega un gráfico al final: hasta seis (GR-T07) y sin repetir. Sin contenido todavía, empieza uno. */
export function agregarGrafico(contenido: ContenidoDelEnfoque | null, grafico: GraficoDelEnfoque): AlAgregar {
  const charts = contenido?.charts ?? [];
  if (charts.some((g) => mismoGrafico(g, grafico))) return { tipo: 'REPETIDO' };
  if (charts.length >= MAXIMO_DE_GRAFICOS_POR_ENFOQUE) return { tipo: 'TOPE' };
  return { tipo: 'AGREGADO', contenido: { schemaVersion: 1, charts: [...charts, grafico] } };
}

/** Un contenido armado con gráficos sueltos (los que se ven, para «Guardar lo que ves como enfoque…»), sin repetir y hasta seis. */
export function contenidoCon(graficos: readonly GraficoDelEnfoque[]): ContenidoDelEnfoque | null {
  const charts: GraficoDelEnfoque[] = [];
  for (const g of graficos) if (!charts.some((x) => mismoGrafico(x, g)) && charts.length < MAXIMO_DE_GRAFICOS_POR_ENFOQUE) charts.push(g);
  return charts.length > 0 ? { schemaVersion: 1, charts } : null;
}

/** El nombre de la copia al duplicar: «Foco en fuerza (copia)», o «(copia 2)» si ya hay una; nunca más largo que el tope. */
export function nombreDeLaCopia(nombre: string, existentes: readonly string[]): string {
  const usados = new Set(existentes.map((n) => n.trim().toLocaleLowerCase('es')));
  for (let n = 1; n < 100; n++) {
    const sufijo = n === 1 ? ' (copia)' : ` (copia ${n})`;
    const candidato = `${nombre.trim().slice(0, LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE - sufijo.length).trimEnd()}${sufijo}`;
    if (!usados.has(candidato.toLocaleLowerCase('es'))) return candidato;
  }
  return nombre.trim().slice(0, LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE);
}

// ─── Los lugares donde está elegido ─────────────────────────────────────────────────────────────────────────

/** En cuántos otros lugares está elegido, sin contar el de esta pantalla si también está elegido acá. */
export const otrosLugares = (choices: number, elegidoAca: boolean): number => Math.max(0, choices - (elegidoAca ? 1 : 0));

const lugares = (n: number): string => (n === 1 ? '1 lugar' : `${n} lugares`);

/** En «Mis enfoques»: dónde está elegido, sin decir quiénes. */
export const textoDeLosLugares = (choices: number): string => (choices === 0 ? 'Sin elegir todavía' : `Elegido en ${lugares(choices)}`);

/** Antes de guardar un cambio de un enfoque elegido en otros lugares: el cambio se ve en todos (GR-T10). */
export const avisoAlCambiar = (otros: number): string => `Está elegido en ${lugares(otros)} más: el cambio se ve en todos. ¿Lo guardás igual o como un enfoque nuevo?`;

/** Antes de borrar: en cuántos lugares estaba elegido; esos lugares vuelven a los sugeridos para tus áreas. */
export const avisoAlBorrar = (choices: number): string =>
  choices === 0 ? 'No está elegido en ningún lugar. Borrarlo no se puede deshacer.' : `Está elegido en ${lugares(choices)}: esos lugares vuelven a los sugeridos para tus áreas. Borrarlo no se puede deshacer.`;

// ─── Los sugeridos para tus áreas ────────────────────────────────────────────────────────────────────────────

/** El más registrado del período (GR-T08): sirve con cualquier persona. */
export const EL_MAS_REGISTRADO: EjercicioDelGrafico = { kind: 'MOST_RECORDED', rank: 1 };

/**
 * Los sugeridos para tus áreas, en orden, como los indicadores del Resumen (TB-25), hasta seis y sin repetir: con
 * Entrenamiento, GR-02 (con el más registrado de la lista de la v1, si hay uno), GR-03 y GR-05 con el más registrado; con
 * Nutrición, GR-12 y GR-13; con Antropometría, GR-16 o, si no entró, GR-20 (GR-16 es la tabla de cada toma, en la ficha
 * de Antropometría: no va como tarjeta). Los cruces van en «Ver la relación», no entre los seis.
 */
export const SUGERIDOS_PARA_TUS_AREAS: readonly { readonly area: Alcance; readonly grafico: GraficoDelEnfoque }[] = [
  { area: 'ENTRENAMIENTO', grafico: { kind: 'SUGGESTED', chartId: 'entrenamiento.fuerza-estimada', exercise: EL_MAS_REGISTRADO, bodyMetric: null } },
  { area: 'ENTRENAMIENTO', grafico: { kind: 'SUGGESTED', chartId: 'entrenamiento.carga-repeticiones-y-rir', exercise: EL_MAS_REGISTRADO, bodyMetric: null } },
  { area: 'ENTRENAMIENTO', grafico: { kind: 'SUGGESTED', chartId: 'entrenamiento.rir-indicado-y-registrado', exercise: EL_MAS_REGISTRADO, bodyMetric: null } },
  { area: 'NUTRICION', grafico: { kind: 'SUGGESTED', chartId: 'nutricion.energia-por-dia', exercise: null, bodyMetric: null } },
  { area: 'NUTRICION', grafico: { kind: 'SUGGESTED', chartId: 'nutricion.macros-en-paneles', exercise: null, bodyMetric: null } },
  { area: 'ANTROPOMETRIA', grafico: { kind: 'SUGGESTED', chartId: 'antropometria.masa-grasa-por-metodo', exercise: null, bodyMetric: null } },
];

/**
 * Los sugeridos para tus áreas con esta persona: solo los de las áreas que el PDP deja leer hoy (`alcances`) y que se
 * ofrecen con lo que hay en el período (`seOfrece`, la regla del registro de cada gráfico). Un área sin acceso no deja
 * rastro: ni en gris ni con candado.
 */
export function sugeridosParaTusAreas(alcances: readonly Alcance[], seOfrece: (g: GraficoDelEnfoque) => boolean): GraficoDelEnfoque[] {
  return SUGERIDOS_PARA_TUS_AREAS.filter((s) => alcances.includes(s.area) && seOfrece(s.grafico))
    .map((s) => s.grafico)
    .slice(0, MAXIMO_DE_GRAFICOS_POR_ENFOQUE);
}
