/**
 * La coordinación de las pruebas de concurrencia contra PostgreSQL real, sin pausas (pasada de cierre del 2026-10-25 y
 * pendientes del §14 de WP-ADMINISTRACION, 2026-10-27). El orden lo ponen los bloqueos de la base, nunca el tiempo:
 * - una transacción de la prueba retiene una fila mientras llegan los pedidos;
 * - la prueba los suelta recién cuando la base dice que quedaron esperando un bloqueo (`pg_stat_activity`);
 * - el primero que queda esperando sigue primero.
 * Los topes no ordenan nada: solo sirven para que una prueba rota falle con un diagnóstico en vez de colgarse.
 */
import type { Prisma, PrismaClient } from '@prisma/client';

/** El proceso de la base que atiende una transacción: para saber qué pedidos espera esa transacción y no otra. */
export async function pidDeLaTransaccion(tx: Prisma.TransactionClient): Promise<number> {
  const [fila] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS "pid"`;
  if (!fila) throw new Error('no se pudo leer el proceso de la transacción');
  return fila.pid;
}

/**
 * Cuántas conexiones de esta base esperan un bloqueo, sin contar la que pregunta. Con `bloqueadoPor`, solo las que espera
 * ese proceso (`pg_blocking_pids`): así una espera que no tiene que ver con la prueba no cuenta.
 */
export async function esperandoUnBloqueo(prisma: PrismaClient, bloqueadoPor?: number): Promise<number> {
  const [fila] =
    bloqueadoPor === undefined
      ? await prisma.$queryRaw<{ n: number }[]>`
          SELECT count(*)::int AS "n" FROM pg_stat_activity
           WHERE "datname" = current_database() AND "wait_event_type" = 'Lock' AND "pid" <> pg_backend_pid()`
      : await prisma.$queryRaw<{ n: number }[]>`
          SELECT count(*)::int AS "n" FROM pg_stat_activity
           WHERE "datname" = current_database() AND "wait_event_type" = 'Lock' AND "pid" <> pg_backend_pid()
             AND ${bloqueadoPor}::int = ANY (pg_blocking_pids("pid"))`;
  return fila?.n ?? 0;
}

/**
 * Lo que hace cada conexión de la base en este momento, para el mensaje de una barrera que no se cumplió. Las consultas
 * llegan con sus parámetros como `$1`: ningún valor (ni un código ni un token) aparece acá.
 */
async function diagnostico(prisma: PrismaClient): Promise<string> {
  const filas = await prisma.$queryRaw<{ pid: number; estado: string | null; espera: string | null; bloqueadoPor: number[]; consulta: string | null }[]>`
    SELECT "pid", "state" AS "estado", concat_ws(':', "wait_event_type", "wait_event") AS "espera",
           pg_blocking_pids("pid") AS "bloqueadoPor", left(regexp_replace("query", '[[:space:]]+', ' ', 'g'), 140) AS "consulta"
      FROM pg_stat_activity
     WHERE "datname" = current_database() AND "pid" <> pg_backend_pid() AND "state" IS DISTINCT FROM 'idle'`;
  return filas.map((f) => `  pid ${f.pid} · ${f.estado ?? '¿?'} · ${f.espera || 'sin espera'} · bloqueado por [${f.bloqueadoPor.join(', ')}] · ${f.consulta ?? ''}`).join('\n') || '  (ninguna conexión activa)';
}

export interface OpcionesDeLaBarrera {
  /** Vuelve antes si da verdadero: por ejemplo, el pedido ya terminó (y entonces nunca esperó). */
  readonly yaPaso?: () => boolean;
  /** Contar solo los que espera este proceso (`pidDeLaTransaccion`). */
  readonly bloqueadoPor?: number;
  /** Qué se espera, para el mensaje si no llega. */
  readonly que?: string;
  /** El tope, en milisegundos (20 s). No ordena nada. */
  readonly tope?: number;
}

/**
 * La barrera: vuelve cuando la base dice que hay `n` esperando un bloqueo, o cuando `yaPaso()` da verdadero. Si no llega
 * al tope, falla con lo que hace cada conexión en ese momento.
 */
export async function esperarQueEsperen(prisma: PrismaClient, n: number, opciones: OpcionesDeLaBarrera = {}): Promise<void> {
  const { yaPaso = () => false, bloqueadoPor, que = `${n} esperando un bloqueo`, tope = 20_000 } = opciones;
  const fin = Date.now() + tope;
  let vistos = 0;
  while (Date.now() < fin) {
    if (yaPaso()) return;
    vistos = await esperandoUnBloqueo(prisma, bloqueadoPor);
    if (vistos >= n) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`La barrera no se cumplió en ${tope} ms: se esperaba ${que} y había ${vistos}.\n${await diagnostico(prisma)}`);
}

/**
 * La fila que retiene la prueba:
 * - la identidad, en modo exclusivo (FOR UPDATE): frena también las claves foráneas que la nombran (insertar códigos);
 * - los códigos vigentes de la identidad: frenan solo a quien quiera invalidarlos;
 * - una sesión: frena a quien quiera cerrarla o revocarla;
 * - un autenticador (`factor_totp`): frena a quien quiera cambiarlo o descartarlo.
 */
export type FilaRetenida = { readonly identidad: string } | { readonly codigosDe: string } | { readonly sesion: string } | { readonly factorTotp: string };

/**
 * Retiene una fila en una transacción de la prueba mientras `mientras` dispara los pedidos y espera a que queden
 * bloqueados; al volver, confirma y la suelta. `mientras` recibe el proceso de esa transacción (para `bloqueadoPor`).
 */
export async function conLaFilaRetenida<T>(prisma: PrismaClient, fila: FilaRetenida, mientras: (pid: number) => Promise<T>): Promise<T> {
  let resultado: T | undefined;
  await prisma.$transaction(
    async (tx) => {
      if ('identidad' in fila) await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${fila.identidad}::uuid FOR UPDATE`;
      else if ('codigosDe' in fila)
        await tx.$queryRaw`
          SELECT 1 FROM "codigo_de_recuperacion"
           WHERE "identidad_id" = ${fila.codigosDe}::uuid AND "momento_de_uso" IS NULL AND "momento_de_invalidacion" IS NULL FOR UPDATE`;
      else if ('sesion' in fila) await tx.$queryRaw`SELECT 1 FROM "sesion" WHERE "id" = ${fila.sesion}::uuid FOR UPDATE`;
      else await tx.$queryRaw`SELECT 1 FROM "factor_totp" WHERE "id" = ${fila.factorTotp}::uuid FOR UPDATE`;
      resultado = await mientras(await pidDeLaTransaccion(tx));
    },
    { timeout: 40_000, maxWait: 10_000 },
  );
  return resultado as T;
}
