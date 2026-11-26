/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-01 a ET2-04) · los contratos del 1RM de referencia, familia propia de BE
 * (RMX), solo para el profesional con el área de Entrenamiento de esa persona:
 * - **API-RMX-01** (`GET /advisees/{adviseeId}/training/one-rep-max`): por ejercicio, el 1RM que usa BE (el más reciente
 *   de los tres orígenes), lo guardado, el último registro en rango y el aviso si se aleja (ET2-D03);
 * - **API-RMX-02** (`POST /advisees/{adviseeId}/training/one-rep-max`): sumar un valor (una calibración, uno declarado o
 *   elegir el registro). **Solo agregar:** nada se edita ni se borra; el nuevo pasa a ser el más reciente.
 * Lo ajeno y lo inexistente son el mismo 404. Nada de esto llega a la persona: la APK no lo lee.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CargaSchema, IdDeNodoSchema } from './contratos-entrenamiento';
import { FechaLocalSchema } from './contratos-nutricion';
import { ResumenDeActorSchema } from './contratos-vinculo';

export const OrigenDelUnoRMSchema = z.enum(['CALIBRATION', 'RECORD', 'DECLARED']);
export const BandaDelUnoRMSchema = z.enum(['CORE', 'ORIENTATIVE']);
export const MetodoDelUnoRMSchema = z.strictObject({ specification: z.literal('BE-E1RM'), version: z.literal(2), method: z.literal('EPLEY_V2') });

/** La serie de la que salió el valor (la calibración o el registro), para mostrar la cuenta. */
export const SerieDelUnoRMSchema = z.strictObject({ load: CargaSchema, completedRepetitions: z.number().int().positive(), rir: z.number().min(0).max(2) });

/** Un valor guardado: de solo agregar, con su origen, su fecha y su autor. */
export const UnoRMGuardadoSchema = z.strictObject({
  entryId: IdOpaco,
  exerciseId: IdOpaco,
  origin: OrigenDelUnoRMSchema,
  value: CargaSchema,
  localDate: FechaLocalSchema,
  /** La serie de la calibración o del registro; `null` en lo declarado. */
  set: SerieDelUnoRMSchema.nullable(),
  /** El método de la cuenta; `null` en lo declarado (no hay cuenta). */
  method: MetodoDelUnoRMSchema.nullable(),
  /** `CORE` con barra, `ORIENTATIVE` fuera de ella; `null` en lo declarado. */
  band: BandaDelUnoRMSchema.nullable(),
  /** El registro elegido, en un valor de origen `RECORD`. */
  record: z.strictObject({ executionId: IdOpaco, prescriptionId: IdDeNodoSchema, setIndex: z.number().int().positive() }).nullable(),
  note: z.string().nullable(),
  author: ResumenDeActorSchema,
  recordedAt: Instante,
});
export type UnoRMGuardadoApi = z.infer<typeof UnoRMGuardadoSchema>;

/** El último registro en rango, calculado al leer. */
export const UnoRMDelRegistroSchema = z.strictObject({
  value: CargaSchema,
  localDate: FechaLocalSchema,
  set: SerieDelUnoRMSchema,
  band: BandaDelUnoRMSchema,
  executionId: IdOpaco,
  prescriptionId: IdDeNodoSchema,
  setIndex: z.number().int().positive(),
  method: MetodoDelUnoRMSchema,
});
export type UnoRMDelRegistroApi = z.infer<typeof UnoRMDelRegistroSchema>;

/** El 1RM que usa BE. `entryId` `null`: es el registro calculado al leer. */
export const UnoRMVigenteSchema = z.strictObject({
  origin: OrigenDelUnoRMSchema,
  value: CargaSchema,
  localDate: FechaLocalSchema,
  band: BandaDelUnoRMSchema.nullable(),
  set: SerieDelUnoRMSchema.nullable(),
  entryId: IdOpaco.nullable(),
});
export type UnoRMVigenteApi = z.infer<typeof UnoRMVigenteSchema>;

export const UnoRMDelEjercicioSchema = z.strictObject({
  exerciseId: IdOpaco,
  current: UnoRMVigenteSchema.nullable(),
  /** ET2-D03: un registro más nuevo que se aleja más del 10 % de lo guardado. BE sigue con lo guardado. */
  /** `relativeDifference`: cuánto se aleja, en centésimas del valor guardado, con su signo (+13: el registro da 13 de cada 100 más). */
  warning: z.strictObject({ record: UnoRMDelRegistroSchema, relativeDifference: z.number().int() }).nullable(),
  lastRecord: UnoRMDelRegistroSchema.nullable(),
  /** Lo guardado, del más reciente al más viejo (hasta 20). */
  history: z.array(UnoRMGuardadoSchema),
});
export type UnoRMDelEjercicio = z.infer<typeof UnoRMDelEjercicioSchema>;
export const UnoRMDeLaPersonaResponseSchema = z.strictObject({ data: z.array(UnoRMDelEjercicioSchema) });
export type UnoRMDeLaPersonaResponse = z.infer<typeof UnoRMDeLaPersonaResponseSchema>;

/**
 * API-RMX-02: sumar un valor. La calibración trae la serie (BE hace la cuenta); lo declarado, el valor; elegir el registro,
 * cuál (BE lo vuelve a leer y a calcular: nunca se acepta un valor del cliente como registro). Las repeticiones y el RIR de
 * la calibración viajan como números sin rango para que un valor fuera de él sea el 422 que dice el motivo.
 */
export const SumarUnoRMRequestSchema = z.discriminatedUnion('origin', [
  z.strictObject({
    origin: z.literal('CALIBRATION'),
    exerciseId: IdOpaco,
    localDate: FechaLocalSchema,
    load: CargaSchema,
    completedRepetitions: z.number().int().nonnegative().max(1000),
    rir: z.number().finite(),
    note: z.string().trim().max(300).nullable().optional(),
  }),
  z.strictObject({
    origin: z.literal('DECLARED'),
    exerciseId: IdOpaco,
    localDate: FechaLocalSchema,
    value: z.strictObject({ value: z.number().positive().max(1000).finite(), unit: z.enum(['kg', 'lb']) }),
    note: z.string().trim().max(300).nullable().optional(),
  }),
  z.strictObject({
    origin: z.literal('RECORD'),
    exerciseId: IdOpaco,
    executionId: IdOpaco,
    prescriptionId: IdDeNodoSchema,
    setIndex: z.number().int().positive().max(50),
  }),
]);
export type SumarUnoRMRequest = z.infer<typeof SumarUnoRMRequestSchema>;
export const UnoRMGuardadoResponseSchema = z.strictObject({ data: z.strictObject({ entry: UnoRMGuardadoSchema, exercise: UnoRMDelEjercicioSchema }) });
