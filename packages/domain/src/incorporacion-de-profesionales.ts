/**
 * UF-04 de WP-USO-FINAL (DL-169; UF-D6 a UF-D8, ratificadas por Dirección el 2026-11-11): la entrada de los profesionales
 * reales. Administración verifica la matrícula fuera de BE (en el registro público que corresponda) e incorpora la cuenta
 * desde `/admin` con API-ADM-14: el perfil profesional con su nombre, su tipo y su matrícula, y por área la verificación y
 * la habilitación, con los hechos de M-02 del administrador y el fundamento que dice dónde se verificó (DL-155). El nombre
 * profesional lo cambia Administración, con fundamento (API-ADM-15, UF-D7): es parte de lo verificado.
 *
 * Acá van la forma de los pedidos y la regla de lo que se puede pedir, sin la base: la API la aplica antes de tocar nada y
 * la consola la usa para decir qué falta en el campo que corresponde.
 */
import { z } from 'zod';
import { LARGO_MAXIMO_DEL_FUNDAMENTO } from './administracion';
import { ALCANCES, type Alcance } from './alcance';
import type { ValidationIssue } from './contratos';
import { AlcanceSchema } from './contratos-vinculo';
import { nombreVisibleValido } from './contratos-perfil-propio';
import { TipoDePerfilApiSchema } from './contratos-administracion';

/** El largo de la matrícula: el número (con su prefijo, «MN 1234», «MP 56789») y la jurisdicción que la otorgó. */
export const LARGO_MAXIMO_DEL_NUMERO_DE_MATRICULA = 40;
export const LARGO_MAXIMO_DE_LA_JURISDICCION = 80;

/** La matrícula verificada de un profesional sanitario (UF-D8): el número y la jurisdicción. */
export const MatriculaSchema = z.strictObject({ number: z.string().max(200), jurisdiction: z.string().max(200) });
export type Matricula = z.infer<typeof MatriculaSchema>;

/** API-ADM-14: la cuenta (por su correo de acceso o el de Google), el nombre profesional, el tipo, la matrícula y las áreas. */
export const IncorporarProfesionalRequestSchema = z.strictObject({
  email: z.string().max(320),
  professionalName: z.string().max(200),
  profileType: TipoDePerfilApiSchema,
  license: MatriculaSchema.nullable(),
  scopes: z.array(AlcanceSchema).max(10),
  /** Dónde se verificó la matrícula o la formación (el registro público, el título): queda en cada hecho. */
  rationale: z.string().max(2000),
});
export type IncorporarProfesionalRequest = z.infer<typeof IncorporarProfesionalRequestSchema>;

/** API-ADM-15: el nombre nuevo, el que se vio (para no pisar un cambio de otro) y el fundamento. */
export const CambiarNombreProfesionalRequestSchema = z.strictObject({
  professionalName: z.string().max(200),
  expectedName: z.string().max(200),
  rationale: z.string().max(2000),
});
export type CambiarNombreProfesionalRequest = z.infer<typeof CambiarNombreProfesionalRequestSchema>;

/** Los códigos de `details.issues` de una incorporación o de un cambio de nombre que no se pueden hacer. */
export const ISSUE_DE_INCORPORACION = {
  FUNDAMENTO: 'RATIONALE_REQUIRED',
  NOMBRE: 'DISPLAY_NAME_REQUIRED',
  NOMBRE_INVALIDO: 'INVALID_DISPLAY_NAME',
  MATRICULA: 'LICENSE_REQUIRED',
  MATRICULA_INVALIDA: 'INVALID_LICENSE',
  MATRICULA_QUE_NO_CORRESPONDE: 'LICENSE_NOT_APPLICABLE',
  AREAS: 'SCOPES_REQUIRED',
  AREA_REPETIDA: 'SCOPE_REPEATED',
  CORREO: 'EMAIL_REQUIRED',
  NOMBRE_IGUAL: 'SAME_DISPLAY_NAME',
  /** De la cuenta, con la base: ya es profesional, no está operativa o es administrativa. */
  YA_ES_PROFESIONAL: 'ALREADY_PROFESSIONAL',
  CUENTA_NO_OPERATIVA: 'ACCOUNT_NOT_OPERATIONAL',
  CUENTA_ADMINISTRATIVA: 'ACCOUNT_IS_ADMINISTRATIVE',
  /** En `test` y en desarrollo, solo cuentas sintéticas (`@example.invalid`), como el comando del primer administrador. */
  SINTETICA: 'SYNTHETIC_ACCOUNT_REQUIRED',
} as const;

const I = ISSUE_DE_INCORPORACION;

/** Un texto obligatorio, ya sin espacios en los bordes: `null` si está vacío o pasa el largo. */
function textoEntre(texto: string, maximo: number): string | null {
  const t = texto.normalize('NFC').trim().replace(/\s+/g, ' ');
  const largo = [...t].length;
  return largo >= 1 && largo <= maximo && !/[\p{Cc}\p{Cf}\p{Co}]/u.test(t) ? t : null;
}

/** La incorporación, normalizada, o los problemas de la forma (sin mirar la base). */
export type IncorporacionEvaluada =
  | {
      readonly ok: true;
      readonly correo: string;
      readonly nombre: string;
      readonly tipo: 'SANITARIO' | 'NO_SANITARIO';
      readonly matricula: { readonly numero: string; readonly jurisdiccion: string } | null;
      readonly alcances: readonly Alcance[];
      readonly fundamento: string;
    }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

/**
 * La regla de lo que se puede pedir:
 * - el correo de la cuenta y el fundamento, obligatorios (el fundamento, de 1 a 1000 caracteres, como cualquier decisión);
 * - el nombre profesional, con la regla del nombre visible (de 1 a 60 caracteres, sin invisibles): lo ve la persona;
 * - un sanitario lleva su matrícula (número y jurisdicción); un no sanitario, ninguna (UF-D8);
 * - al menos un área, sin repetir.
 */
export function evaluarIncorporacion(p: IncorporarProfesionalRequest): IncorporacionEvaluada {
  const issues: ValidationIssue[] = [];
  const correo = p.email.trim().toLowerCase();
  if (!correo) issues.push({ code: I.CORREO, path: 'email' });
  const nombre = nombreVisibleValido(p.professionalName);
  if (!p.professionalName.trim()) issues.push({ code: I.NOMBRE, path: 'professionalName' });
  else if (!nombre) issues.push({ code: I.NOMBRE_INVALIDO, path: 'professionalName' });
  const tipo = p.profileType === 'HEALTH_PROFESSIONAL' ? 'SANITARIO' : 'NO_SANITARIO';
  let matricula: { numero: string; jurisdiccion: string } | null = null;
  if (tipo === 'SANITARIO') {
    if (!p.license || (!p.license.number.trim() && !p.license.jurisdiction.trim())) issues.push({ code: I.MATRICULA, path: 'license' });
    else {
      const numero = textoEntre(p.license.number, LARGO_MAXIMO_DEL_NUMERO_DE_MATRICULA);
      const jurisdiccion = textoEntre(p.license.jurisdiction, LARGO_MAXIMO_DE_LA_JURISDICCION);
      if (!numero) issues.push({ code: p.license.number.trim() ? I.MATRICULA_INVALIDA : I.MATRICULA, path: 'license.number' });
      if (!jurisdiccion) issues.push({ code: p.license.jurisdiction.trim() ? I.MATRICULA_INVALIDA : I.MATRICULA, path: 'license.jurisdiction' });
      if (numero && jurisdiccion) matricula = { numero, jurisdiccion };
    }
  } else if (p.license !== null) {
    issues.push({ code: I.MATRICULA_QUE_NO_CORRESPONDE, path: 'license' });
  }
  if (p.scopes.length === 0) issues.push({ code: I.AREAS, path: 'scopes' });
  if (new Set(p.scopes).size !== p.scopes.length) issues.push({ code: I.AREA_REPETIDA, path: 'scopes' });
  const fundamento = textoEntre(p.rationale, LARGO_MAXIMO_DEL_FUNDAMENTO);
  if (!fundamento) issues.push({ code: I.FUNDAMENTO, path: 'rationale' });
  if (issues.length > 0 || !nombre || !fundamento) return { ok: false, issues };
  // Las áreas, en el orden del catálogo.
  const alcances = ALCANCES.filter((a) => p.scopes.includes(a));
  return { ok: true, correo, nombre, tipo, matricula, alcances, fundamento };
}

export type CambioDeNombreEvaluado =
  | { readonly ok: true; readonly nombre: string; readonly fundamento: string }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

/** El cambio de nombre: el nombre nuevo con la regla del nombre visible y distinto del de hoy, y el fundamento. */
export function evaluarCambioDeNombre(p: CambiarNombreProfesionalRequest, nombreDeHoy: string): CambioDeNombreEvaluado {
  const issues: ValidationIssue[] = [];
  const nombre = nombreVisibleValido(p.professionalName);
  if (!p.professionalName.trim()) issues.push({ code: I.NOMBRE, path: 'professionalName' });
  else if (!nombre) issues.push({ code: I.NOMBRE_INVALIDO, path: 'professionalName' });
  else if (nombre === nombreDeHoy) issues.push({ code: I.NOMBRE_IGUAL, path: 'professionalName' });
  const fundamento = textoEntre(p.rationale, LARGO_MAXIMO_DEL_FUNDAMENTO);
  if (!fundamento) issues.push({ code: I.FUNDAMENTO, path: 'rationale' });
  if (issues.length > 0 || !nombre || !fundamento) return { ok: false, issues };
  return { ok: true, nombre, fundamento };
}
