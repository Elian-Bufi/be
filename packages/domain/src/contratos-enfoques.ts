/**
 * GR-27 · Los enfoques (WP-GRAFICOS, DEUDA_LEGAJO DL-174; pedido de Dirección del 2026-11-14): conjuntos de gráficos con
 * nombre, propios del profesional, que se eligen para una persona o para uno de sus planes y quedan hasta que se cambien.
 * Familia propia de BE, GRF (API-GRF-01 a 07). En pantalla se llaman «Enfoques» (GR-T01); en el código, conjuntos de
 * gráficos, para que un cambio de nombre sea un cambio de texto. Solo los usa el website del profesional: la APK no los lee
 * y no se congela nada (DL-152).
 *
 * Reglas que la forma protege:
 * - **Solo referencias, nunca datos.** Un enfoque guarda identificadores de gráficos sugeridos y de series del catálogo,
 *   ejercicios del catálogo, medidas y modos. Los objetos son estrictos: no hay un campo donde poner un valor, una nota
 *   clínica ni el nombre de una persona. Los identificadores se validan con una expresión y no con una lista cerrada
 *   (GR-T17): un gráfico nuevo no obliga a redesplegar la API, y el website ignora el que no conoce.
 * - **No concede nada.** Abrir un enfoque vuelve a pedir cada lectura a la API, que decide con el PDP en ese momento.
 * - **Sirve con cualquier persona.** El ejercicio de un gráfico es uno fijo del catálogo o «el más registrado» del
 *   período, del 1.º al 3.º (GR-T08); lo que no aplica con una persona no se dibuja.
 * - **Los topes:** hasta seis gráficos por enfoque y tres series por gráfico propio (GR-T07); hasta 50 enfoques por
 *   profesional, como las vistas de «Analizar» (lo controla la API: TOO_MANY_SETS).
 * - **Dónde rige** (GR-T09): la elección de un plan, en la estación de ese plan; la de la persona, en el resto; sin
 *   ninguna, los sugeridos para las áreas del profesional. Elegir no copia el enfoque: si después cambia, cambia en todos
 *   los lugares donde está elegido (`choices` dice en cuántos).
 */
import { z } from 'zod';
import type { Alcance } from './alcance';
import { Instante, IdOpaco } from './contratos';
import { ReferenciaDeMetricaSchema } from './contratos-analisis';
import { TokenDeVersionSchema } from './contratos-vinculo';
import { IdDeGraficoSchema } from './graficos-sugeridos';
import { MAXIMO_DE_METRICAS } from './metricas-del-analisis';

/** Hasta seis gráficos por enfoque: el tope que la propuesta pone al panel (GR-T07). */
export const MAXIMO_DE_GRAFICOS_POR_ENFOQUE = 6;
/** Hasta 50 enfoques por profesional, como las vistas guardadas de «Analizar» (API-VAN). Lo controla la API. */
export const MAXIMO_DE_ENFOQUES = 50;
export const LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE = 80;
export const LARGO_MAXIMO_DEL_TITULO_DE_UN_GRAFICO = 60;

const UUID = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

/** El nombre lo escribe el profesional: el website le pide que no ponga datos de salud, porque el enfoque se usa con varias personas. */
export const NombreDelEnfoqueSchema = z.string().trim().min(1).max(LARGO_MAXIMO_DEL_NOMBRE_DEL_ENFOQUE);

/** El ejercicio de un gráfico guardado: uno del catálogo (`e:` o `v:`, como en «Analizar»), o «el más registrado» del período. */
export const EjercicioDelGraficoSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('FIXED'),
    exerciseKey: z.string().regex(/^[ev]:[0-9a-fA-F-]{36}$/),
    unit: z.enum(['kg', 'lb']).nullable(),
    setIndex: z.number().int().min(1).max(30).nullable(),
  }),
  z.strictObject({ kind: z.literal('MOST_RECORDED'), rank: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
]);
export type EjercicioDelGrafico = z.infer<typeof EjercicioDelGraficoSchema>;

/**
 * Un gráfico del enfoque: un sugerido (`graficos-sugeridos.ts`), con su ejercicio o su medida cuando los pide, o uno armado
 * con «Armá tu gráfico» (GR-26): un título, de una a tres series del catálogo y el modo. La API guarda el modo pedido; si
 * con una persona sus series no se pueden superponer, el website lo dibuja alineado (`composicionPermitida`).
 */
export const GraficoDelEnfoqueSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('SUGGESTED'),
    chartId: IdDeGraficoSchema,
    exercise: EjercicioDelGraficoSchema.nullable(),
    bodyMetric: z
      .string()
      .max(80)
      .regex(/^antropometria\.[a-z0-9-]+$/)
      .nullable(),
  }),
  z.strictObject({
    kind: z.literal('CUSTOM'),
    title: z.string().trim().min(1).max(LARGO_MAXIMO_DEL_TITULO_DE_UN_GRAFICO),
    series: z.array(ReferenciaDeMetricaSchema).min(1).max(MAXIMO_DE_METRICAS),
    mode: z.enum(['PANELS', 'OVERLAY']),
  }),
]);
export type GraficoDelEnfoque = z.infer<typeof GraficoDelEnfoqueSchema>;

export const ContenidoDelEnfoqueSchema = z.strictObject({
  schemaVersion: z.literal(1),
  charts: z.array(GraficoDelEnfoqueSchema).min(1).max(MAXIMO_DE_GRAFICOS_POR_ENFOQUE),
});
export type ContenidoDelEnfoque = z.infer<typeof ContenidoDelEnfoqueSchema>;

// ─── API-GRF-01 a 04 · los enfoques del profesional ────────────────────────────────────────────────────────────────

export const EnfoqueSchema = z.strictObject({
  setId: IdOpaco,
  name: NombreDelEnfoqueSchema,
  content: ContenidoDelEnfoqueSchema,
  /** En cuántos lugares está elegido (personas o planes): lo que se avisa antes de cambiarlo o de borrarlo (GR-T10). */
  choices: z.number().int().nonnegative(),
  version: TokenDeVersionSchema,
  createdAt: Instante,
  updatedAt: Instante,
});
export type Enfoque = z.infer<typeof EnfoqueSchema>;

export const ListaDeEnfoquesResponseSchema = z.strictObject({ data: z.array(EnfoqueSchema) });
export type ListaDeEnfoquesResponse = z.infer<typeof ListaDeEnfoquesResponseSchema>;
export const EnfoqueResponseSchema = z.strictObject({ data: EnfoqueSchema });
export type EnfoqueResponse = z.infer<typeof EnfoqueResponseSchema>;

export const CrearEnfoqueRequestSchema = z.strictObject({ name: NombreDelEnfoqueSchema, content: ContenidoDelEnfoqueSchema });
export type CrearEnfoqueRequest = z.infer<typeof CrearEnfoqueRequestSchema>;

/** Cambiar el nombre o los gráficos, con la versión leída (si otra pestaña lo cambió antes, 409 VERSION_CONFLICT). */
export const ReemplazarEnfoqueRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema, name: NombreDelEnfoqueSchema, content: ContenidoDelEnfoqueSchema });
export type ReemplazarEnfoqueRequest = z.infer<typeof ReemplazarEnfoqueRequestSchema>;

// ─── API-GRF-05 a 07 · dónde está elegido ──────────────────────────────────────────────────────────────────────────

/** Dónde rige un enfoque elegido: la persona entera o uno de sus planes. */
export const AmbitoDeLaEleccionSchema = z.enum(['PERSON', 'TRAINING_PLAN', 'NUTRITION_PLAN']);
export type AmbitoDeLaEleccion = z.infer<typeof AmbitoDeLaEleccionSchema>;

/**
 * El área que pide cada ámbito con la persona: la elección de un plan pide el área del plan; la de la persona, alguna
 * (`null`). Un ámbito de un área sin acceso no se lee ni se elige.
 */
export const AREA_DEL_AMBITO: Readonly<Record<AmbitoDeLaEleccion, Alcance | null>> = {
  PERSON: null,
  TRAINING_PLAN: 'ENTRENAMIENTO',
  NUTRITION_PLAN: 'NUTRICION',
};

/**
 * Una elección. El plan se nombra por su identidad, como en las lecturas de API-TRN y API-NUT (`trainingPlanId`,
 * `nutritionPlanId`), y no por `planId`, que en esas familias es una versión: la elección sigue al plan en todas sus
 * versiones (GR-T60). En la de la persona, los dos son `null`; en la de un plan, solo el de su área.
 */
export const EleccionDeEnfoqueSchema = z.strictObject({
  choiceId: IdOpaco,
  scope: AmbitoDeLaEleccionSchema,
  trainingPlanId: IdOpaco.nullable(),
  nutritionPlanId: IdOpaco.nullable(),
  set: z.strictObject({ setId: IdOpaco, name: NombreDelEnfoqueSchema }),
  version: TokenDeVersionSchema,
  updatedAt: Instante,
});
export type EleccionDeEnfoque = z.infer<typeof EleccionDeEnfoqueSchema>;

export const EleccionesDeEnfoqueResponseSchema = z.strictObject({ data: z.array(EleccionDeEnfoqueSchema) });
export type EleccionesDeEnfoqueResponse = z.infer<typeof EleccionesDeEnfoqueResponseSchema>;
export const EleccionDeEnfoqueResponseSchema = z.strictObject({ data: EleccionDeEnfoqueSchema });
export type EleccionDeEnfoqueResponse = z.infer<typeof EleccionDeEnfoqueResponseSchema>;

/**
 * Elegir o cambiar el enfoque de la persona o de uno de sus planes (por su identidad: `trainingPlanId` o
 * `nutritionPlanId`, nunca una versión). `expectedVersion: null` crea la elección (si ya había una, 409); con la versión
 * leída, la cambia. Los identificadores son UUID: un texto libre no llega a la API.
 */
export const ElegirEnfoqueRequestSchema = z.discriminatedUnion('scope', [
  z.strictObject({ scope: z.literal('PERSON'), setId: UUID, expectedVersion: TokenDeVersionSchema.nullable() }),
  z.strictObject({ scope: z.literal('TRAINING_PLAN'), trainingPlanId: UUID, setId: UUID, expectedVersion: TokenDeVersionSchema.nullable() }),
  z.strictObject({ scope: z.literal('NUTRITION_PLAN'), nutritionPlanId: UUID, setId: UUID, expectedVersion: TokenDeVersionSchema.nullable() }),
]);
export type ElegirEnfoqueRequest = z.infer<typeof ElegirEnfoqueRequestSchema>;
