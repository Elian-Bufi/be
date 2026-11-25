/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-07 a ET2-09) · el esfuerzo de la sesión (el RPE de la sesión de Foster):
 * una pregunta al terminar, de 0 a 10, **aparte del RIR de cada serie** (otra escala y otra pregunta: «¿Qué tan duro fue
 * el entrenamiento, en general?»). Era RPE-D09 de DL-192 («queda afuera»).
 *
 * - **Es una opción del plan:** «Pedir el esfuerzo de la sesión al terminar» (`planning.askSessionEffort`). La app lo
 *   pregunta solo con la opción prendida y si declara `training-session-effort-1`.
 * - **La carga de la sesión** es el esfuerzo por los minutos (Foster y colaboradores, 2001): 7 × 60 min = 420. Es un
 *   número para comparar sesiones de la misma persona, sin unidad física; nunca un juicio. Sin minutos, no hay carga.
 * - **Se guarda aparte** (`esfuerzo_de_sesion_de_entrenamiento`, una fila por sesión registrada, de solo agregar): la
 *   ejecución registrada no cambia (REG-06-116) y sus lecturas, que la APK valida con esquemas estrictos, tampoco.
 *
 * Fuentes: Foster C. y col. (2001), *A new approach to monitoring exercise training*, J Strength Cond Res 15(1): 109-115;
 * la escala CR-10 de Borg, adaptada por Foster (0 «reposo» a 10 «máximo»).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { FechaLocalSchema } from './contratos-nutricion';
import { numero } from './formato-numeros';

/** La escala de Foster (CR-10 adaptada): de 0 a 10, enteros. */
export const EsfuerzoDeLaSesionValorSchema = z.number().int().min(0).max(10);
export const OrigenDeLosMinutosSchema = z.enum(['TIMER', 'DECLARED']);
export type OrigenDeLosMinutos = z.infer<typeof OrigenDeLosMinutosSchema>;

/** API-ESF-01: lo que manda la app al terminar. Los minutos, del cronómetro de la sesión o escritos por la persona. */
export const RegistrarEsfuerzoDeLaSesionRequestSchema = z
  .strictObject({
    rating: EsfuerzoDeLaSesionValorSchema,
    durationMinutes: z.number().int().min(1).max(600).nullable(),
    durationSource: OrigenDeLosMinutosSchema.nullable(),
  })
  .refine((e) => (e.durationMinutes === null) === (e.durationSource === null), { message: 'Los minutos van con su origen', path: ['durationSource'] });
export type RegistrarEsfuerzoDeLaSesionRequest = z.infer<typeof RegistrarEsfuerzoDeLaSesionRequestSchema>;

export const EsfuerzoDeLaSesionSchema = z.strictObject({
  executionId: IdOpaco,
  date: FechaLocalSchema,
  /** El nombre de la sesión en la instantánea («Torso A»). */
  sessionLabel: z.string(),
  rating: EsfuerzoDeLaSesionValorSchema,
  durationMinutes: z.number().int().positive().nullable(),
  durationSource: OrigenDeLosMinutosSchema.nullable(),
  /** El esfuerzo por los minutos; `null` sin minutos. */
  sessionLoad: z.number().int().nonnegative().nullable(),
  recordedAt: Instante,
});
export type EsfuerzoDeLaSesion = z.infer<typeof EsfuerzoDeLaSesionSchema>;
export const EsfuerzoDeLaSesionResponseSchema = z.strictObject({ data: EsfuerzoDeLaSesionSchema });
/** API-ESF-02: los del período, de la sesión más vieja a la más nueva. */
export const EsfuerzosDeLaSesionResponseSchema = z.strictObject({ data: z.strictObject({ from: FechaLocalSchema, to: FechaLocalSchema, efforts: z.array(EsfuerzoDeLaSesionSchema) }) });
export type EsfuerzosDeLaSesionResponse = z.infer<typeof EsfuerzosDeLaSesionResponseSchema>;

/** La carga de la sesión de Foster: el esfuerzo por los minutos, o `null` sin minutos. */
export const cargaDeLaSesion = (rating: number, minutos: number | null): number | null => (minutos === null ? null : Math.round(rating * minutos));

/** La escala, con las palabras de cada punto para la pregunta de la app (Foster 2001, en criollo). */
export const ESCALA_DEL_ESFUERZO_DE_LA_SESION: readonly { readonly valor: number; readonly texto: string }[] = [
  { valor: 0, texto: 'Reposo' },
  { valor: 1, texto: 'Muy, muy suave' },
  { valor: 2, texto: 'Suave' },
  { valor: 3, texto: 'Moderado' },
  { valor: 4, texto: 'Algo duro' },
  { valor: 5, texto: 'Duro' },
  { valor: 6, texto: 'Duro' },
  { valor: 7, texto: 'Muy duro' },
  { valor: 8, texto: 'Muy duro' },
  { valor: 9, texto: 'Casi máximo' },
  { valor: 10, texto: 'Máximo' },
];

export const textoDelEsfuerzoDeLaSesion = (valor: number): string => ESCALA_DEL_ESFUERZO_DE_LA_SESION.find((e) => e.valor === valor)?.texto ?? '';

export const COPY_ESFUERZO_DE_LA_SESION = {
  opcionDelPlan: 'Pedir el esfuerzo de la sesión al terminar',
  opcionExplicada: 'Al terminar cada sesión, la app le pregunta a la persona qué tan duro fue, de 0 a 10. Es aparte del RIR de cada serie.',
  pregunta: '¿Qué tan duro fue el entrenamiento, en general?',
  preguntaAclaracion: 'De 0 (reposo) a 10 (máximo). Pensá en toda la sesión, no en la última serie.',
  minutos: 'Minutos de la sesión',
  minutosDelCronometro: (n: number) => `${n} min, del cronómetro de la sesión`,
  saltear: 'Ahora no',
  guardar: 'Guardar',
  guardado: 'Gracias: quedó guardado.',
  titulo: 'Esfuerzo de la sesión',
  sinDatos: 'Todavía no hay esfuerzos de la sesión en este período.',
  cargaDeLaSesion: 'Carga de la sesión',
  sinMinutos: 'sin minutos: no hay carga',
  queEs:
    'El esfuerzo de la sesión es lo que la persona responde al terminar, de 0 a 10. La carga de la sesión es ese número por los minutos que duró (Foster, 2001): sirve para comparar sesiones de la misma persona en el tiempo. No tiene unidad física.',
  ejemplo: 'Ejemplo: esfuerzo 7 en una sesión de 60 minutos → 7 × 60 = 420. Otra de esfuerzo 5 y 40 minutos → 200.',
  ejeDelGrafico: 'Carga de la sesión (esfuerzo × minutos)',
} as const;

/** «7 · Muy duro · 60 min → 420». */
export function esfuerzoEnUnRenglon(e: Pick<EsfuerzoDeLaSesion, 'rating' | 'durationMinutes' | 'sessionLoad'>): string {
  const base = `${e.rating} · ${textoDelEsfuerzoDeLaSesion(e.rating)}`;
  if (e.durationMinutes === null || e.sessionLoad === null) return `${base} · ${COPY_ESFUERZO_DE_LA_SESION.sinMinutos}`;
  return `${base} · ${numero(e.durationMinutes)} min → ${numero(e.sessionLoad)}`;
}
