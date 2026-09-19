import type { EsquemaDeContrato, SalidaDe, ValidationIssue } from '@be/domain';
import { errores } from './errores';

/**
 * Valida un body contra su schema de contrato (@be/domain).
 * Campo no declarado → 400 UNKNOWN_FIELD (09v7 T12: «No se ignora silenciosamente un campo security-sensitive»).
 * Cualquier otra falla de forma → 400 INVALID_REQUEST con issues {code, path} (09v7 ValidationIssue).
 */
export function validarCuerpo<S extends EsquemaDeContrato>(schema: S, cuerpo: unknown): SalidaDe<S> {
  const r = schema.safeParse(cuerpo ?? {});
  if (r.success) return r.data;
  const desconocidos: ValidationIssue[] = [];
  const otros: ValidationIssue[] = [];
  for (const issue of r.error.issues) {
    const base = issue.path.map(String).join('.');
    if (issue.code === 'unrecognized_keys') {
      for (const clave of issue.keys) desconocidos.push({ code: 'UNKNOWN_FIELD', path: base ? `${base}.${clave}` : clave });
    } else {
      otros.push({ code: issue.code.toUpperCase(), path: base || '(body)' });
    }
  }
  if (desconocidos.length > 0) throw errores.campoDesconocido(desconocidos);
  throw errores.solicitudInvalida(otros);
}

/** 09 §3.1: «todo parámetro de query desconocido o no permitido … se rechaza con 400 INVALID_REQUEST». */
export function sinParametrosDeQuery(query: Record<string, unknown>): void {
  const claves = Object.keys(query ?? {});
  if (claves.length > 0) throw errores.solicitudInvalida(claves.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
}
