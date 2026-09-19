import { errores } from './errores';

/**
 * Colecciones paginadas por cursor (09:188-189; 09v7:404-410): `{ data: [], page: { limit, nextCursor, hasMore } }`.
 * - Orden estable: momento de registro descendente y, a igualdad, id descendente (keyset).
 * - El cursor es opaco: base64url de [momento, id]. Uno inválido → 400 INVALID_CURSOR (09v7:408).
 * - Parámetro de query desconocido → 400 INVALID_REQUEST (09 §3.1). No se revelan conteos de lo invisible (09v7:410).
 */
export const LIMITE_POR_DEFECTO = 20;
export const LIMITE_MAXIMO = 50;

export interface Cursor {
  readonly momento: Date;
  readonly id: string;
}

export interface ConsultaDeLista<F extends string> {
  readonly limit: number;
  readonly cursor: Cursor | null;
  readonly filtros: Readonly<Partial<Record<F, string>>>;
}

/** Valida la query de una lista: solo `limit`, `cursor` y los filtros declarados, cada uno con sus valores admitidos. */
export function leerConsultaDeLista<F extends string>(
  query: Record<string, unknown>,
  filtros: Readonly<Record<F, readonly string[]>>,
): ConsultaDeLista<F> {
  const permitidos = new Set<string>(['limit', 'cursor', ...Object.keys(filtros)]);
  const desconocidos = Object.keys(query ?? {}).filter((k) => !permitidos.has(k));
  if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));

  let limit = LIMITE_POR_DEFECTO;
  if (query.limit !== undefined) {
    const n = typeof query.limit === 'string' && /^\d{1,3}$/.test(query.limit) ? Number(query.limit) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > LIMITE_MAXIMO) throw errores.solicitudInvalida([{ code: 'INVALID_LIMIT', path: 'limit' }]);
    limit = n;
  }

  let cursor: Cursor | null = null;
  if (query.cursor !== undefined) {
    if (typeof query.cursor !== 'string') throw errores.cursorInvalido();
    cursor = leerCursor(query.cursor);
  }

  const leidos: Partial<Record<F, string>> = {};
  for (const clave of Object.keys(filtros) as F[]) {
    const valor = query[clave];
    if (valor === undefined) continue;
    if (typeof valor !== 'string' || !filtros[clave].includes(valor)) {
      throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: clave }]);
    }
    leidos[clave] = valor;
  }
  return { limit, cursor, filtros: leidos };
}

export function escribirCursor(momento: Date, id: string): string {
  return Buffer.from(JSON.stringify([momento.toISOString(), id]), 'utf8').toString('base64url');
}

function leerCursor(texto: string): Cursor {
  try {
    const valor: unknown = JSON.parse(Buffer.from(texto, 'base64url').toString('utf8'));
    if (Array.isArray(valor) && valor.length === 2 && typeof valor[0] === 'string' && typeof valor[1] === 'string') {
      const momento = new Date(valor[0]);
      // UUID completo: un id de 36 guiones o con otra forma llegaría a la base como un error 500 (P2023).
      if (!Number.isNaN(momento.getTime()) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(valor[1])) return { momento, id: valor[1] };
    }
  } catch {
    // cae al error neutral
  }
  throw errores.cursorInvalido();
}

/** Condición keyset de Prisma para «después del cursor» en orden descendente. */
export function despuesDelCursor(cursor: Cursor | null): Record<string, unknown> {
  if (!cursor) return {};
  return {
    OR: [{ momentoDeRegistro: { lt: cursor.momento } }, { momentoDeRegistro: cursor.momento, id: { lt: cursor.id } }],
  };
}

export const ORDEN_DE_LISTA = [{ momentoDeRegistro: 'desc' as const }, { id: 'desc' as const }];

/** Corta la página pedida (se leyó `limit + 1` para saber si hay más) y arma el objeto `page`. */
export function paginar<T extends { momentoDeRegistro: Date; id: string }>(
  filas: readonly T[],
  limit: number,
): { readonly pagina: readonly T[]; readonly page: { limit: number; nextCursor: string | null; hasMore: boolean } } {
  const hayMas = filas.length > limit;
  const pagina = hayMas ? filas.slice(0, limit) : filas;
  const ultima = pagina[pagina.length - 1];
  return {
    pagina,
    page: { limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.id) : null, hasMore: hayMas },
  };
}
