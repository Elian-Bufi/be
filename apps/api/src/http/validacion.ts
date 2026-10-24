import type { EsquemaDeContrato, SalidaDe, ValidationIssue } from '@be/domain';
import { cotaDeElementos } from './cota-de-elementos';
import { errores } from './errores';

/*
 * Por qué se cuentan los elementos antes de validar. zod junta un error por cada elemento que falla, y desde la 4.6.6
 * corta antes solo la lista que pasa su propio tope (GHSA-mrhx-c7xc-m3w5). Los topes de las listas anidadas se
 * multiplican (días × comidas × opciones × ítems): dentro de los 16 KB del pedido entraban 4.800 ítems `{}`, que daban
 * 14.542 errores, una respuesta de 1,4 MB y decenas de milisegundos por pedido, a cualquier cuenta, porque el cuerpo se
 * valida antes de autorizar. Un cuerpo con más elementos de los que puede tener uno válido de su tamaño no puede ser
 * válido: se rechaza sin recorrerlo elemento por elemento.
 */

/**
 * El techo, para cualquier esquema y tamaño. Ningún cuerpo válido de 16 KB (el límite de `bootstrap.ts`) llega: la cota de
 * cada esquema de entrada está probada en `validacion.spec.ts`, y la más alta, la de EditarPlanDeEntrenamientoRequestSchema,
 * es de 1.024 (2026-10-24).
 */
export const MAXIMO_DE_ELEMENTOS = 1500;

/**
 * El piso: hasta tantos elementos, el cuerpo siempre se valida. Así un cuerpo chico con una lista donde no va (`roles:
 * ['ADMIN']`) sigue recibiendo su UNKNOWN_FIELD, y el costo de validarlo es despreciable.
 */
export const PISO_DE_ELEMENTOS = 64;

/**
 * Cuántos elementos de listas puede traer este cuerpo para que se lo valide: los que puede tener un cuerpo válido de este
 * esquema y de este tamaño (`cotaDeElementos`), entre el piso y el techo. Si la cota no se puede calcular, vale el techo.
 */
export function maximoDeElementos(schema: object, cuerpo: unknown): number {
  try {
    const caracteres = JSON.stringify(cuerpo)?.length ?? 0;
    return Math.min(MAXIMO_DE_ELEMENTOS, Math.max(PISO_DE_ELEMENTOS, cotaDeElementos(schema, caracteres)));
  } catch {
    return MAXIMO_DE_ELEMENTOS;
  }
}

/**
 * Cuántos errores se informan, los primeros. Antes iban todos, y la respuesta de un cuerpo de 16 KB podía pesar 1,4 MB.
 * Si hay campos no declarados, se informan solo esos, como siempre.
 */
export const MAXIMO_DE_ERRORES_INFORMADOS = 20;

/** Si el valor tiene más de `maximo` elementos en sus listas, sumando las anidadas. Deja de contar apenas se pasa. */
export function superaElementos(valor: unknown, maximo: number): boolean {
  let total = 0;
  const pendientes: unknown[] = [valor];
  while (pendientes.length > 0) {
    const v = pendientes.pop();
    if (Array.isArray(v)) {
      total += v.length;
      if (total > maximo) return true;
      for (const e of v) if (e !== null && typeof e === 'object') pendientes.push(e);
    } else if (v !== null && typeof v === 'object') {
      for (const e of Object.values(v)) if (e !== null && typeof e === 'object') pendientes.push(e);
    }
  }
  return false;
}

const ruta = (path: readonly PropertyKey[]): string => path.map(String).join('.');

/**
 * Valida un body contra su schema de contrato (@be/domain).
 * Campo no declarado → 400 UNKNOWN_FIELD (09v7 T12: «No se ignora silenciosamente un campo security-sensitive»).
 * Cualquier otra falla de forma → 400 INVALID_REQUEST con issues {code, path} (09v7 ValidationIssue).
 * Un cuerpo con más elementos de listas de los que puede tener uno válido de su tamaño (maximoDeElementos) → 400
 * INVALID_REQUEST con un solo issue TOO_BIG en `(body)`, sin validarlo elemento por elemento. Se informan hasta
 * MAXIMO_DE_ERRORES_INFORMADOS issues.
 *
 * Precedencia de los rechazos de forma, todos 400:
 *   1. el body parser: JSON mal formado o más de 16 KB → INVALID_REQUEST (filtro-de-errores.ts);
 *   2. la cota de elementos → INVALID_REQUEST con TOO_BIG;
 *   3. la validación estricta: UNKNOWN_FIELD antes que las demás fallas de forma.
 * Un campo no declarado nunca se acepta. Si llega junto con más elementos de los que admite un cuerpo válido, el cuerpo
 * entero se rechaza con TOO_BIG y el campo no se nombra. El 09 lo permite:
 *   - CAND-09-T12 pide «400 UNKNOWN_FIELD o se rechaza por schema estricto equivalente», y que no se ignore en silencio;
 *   - el catálogo usa UNKNOWN_FIELD «cuando la validación estricta lo detecta»;
 *   - §3.2 deja rechazar antes una falla independiente del recurso, como el JSON mal formado.
 * Dentro de lo que admite un cuerpo válido, UNKNOWN_FIELD manda siempre: lo prueba `sin-falsos-rechazos.spec.ts`.
 */
export function validarCuerpo<S extends EsquemaDeContrato>(schema: S, cuerpo: unknown): SalidaDe<S> {
  const valor = cuerpo ?? {};
  if (superaElementos(valor, maximoDeElementos(schema, valor))) throw errores.solicitudInvalida([{ code: 'TOO_BIG', path: '(body)' }]);
  const r = schema.safeParse(valor);
  if (r.success) return r.data;
  const desconocidos: ValidationIssue[] = [];
  const otros: ValidationIssue[] = [];
  for (const issue of r.error.issues) {
    if (issue.code === 'unrecognized_keys') {
      const base = ruta(issue.path);
      for (const clave of issue.keys) {
        if (desconocidos.length >= MAXIMO_DE_ERRORES_INFORMADOS) break;
        desconocidos.push({ code: 'UNKNOWN_FIELD', path: base ? `${base}.${clave}` : clave });
      }
    } else if (otros.length < MAXIMO_DE_ERRORES_INFORMADOS) {
      otros.push({ code: issue.code.toUpperCase(), path: ruta(issue.path) || '(body)' });
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
