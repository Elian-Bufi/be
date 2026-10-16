/**
 * La declaración de mayoría de edad del alta (08 §24.7 a; gate §42, ítem 22; DEUDA_LEGAJO DL-023 y DL-138). El MVP
 * atiende solo a personas adultas (02/03/04): toda alta, local (API-ACC-01) o con Google (API-GOO-03), exige que la
 * persona declare que tiene 18 años o más. BE no pide la fecha de nacimiento: para decidir si alguien puede usar BE
 * alcanza con la declaración, y la fecha sería un dato C3 más sin otra finalidad (minimización).
 * La misma regla corre en la API, el website y la APK (09v7 T21).
 */
import type { DeclaracionDeMayoriaDeEdad } from './contratos';
import { VERSION_VIGENTE } from './textos';

/** Los códigos de `details.issues` de un alta sin una declaración válida. */
export const ISSUE_DE_MAYORIA_DE_EDAD = {
  /** Falta la declaración, o la persona no la marcó (`declared` distinto de `true`). */
  REQUERIDA: 'ADULT_DECLARATION_REQUIRED',
  /** La versión del texto que el cliente mostró no es la vigente. */
  VERSION_NO_VIGENTE: 'ADULT_DECLARATION_VERSION_NOT_ACCEPTABLE',
} as const;

/**
 * - `FALTA`: el cuerpo no trae la declaración. Es lo que manda un cliente anterior a DL-138, que no la conoce.
 * - `SIN_DECLARAR`: la trae sin `declared: true`.
 * - `VERSION_NO_VIGENTE`: la trae con la versión de otro texto.
 */
export type ProblemaDeMayoriaDeEdad = 'FALTA' | 'SIN_DECLARAR' | 'VERSION_NO_VIGENTE';

export function problemaDeMayoriaDeEdad(declaracion: DeclaracionDeMayoriaDeEdad | undefined): ProblemaDeMayoriaDeEdad | null {
  if (!declaracion) return 'FALTA';
  if (declaracion.declared !== true) return 'SIN_DECLARAR';
  if (declaracion.versionId !== VERSION_VIGENTE.MAYORIA_DE_EDAD.id) return 'VERSION_NO_VIGENTE';
  return null;
}

/** El cuerpo de la declaración que manda un cliente cuando la persona marcó la casilla: la versión vigente. */
export function declaracionDeMayoriaDeEdad(declarada: boolean): DeclaracionDeMayoriaDeEdad {
  return { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: declarada };
}
