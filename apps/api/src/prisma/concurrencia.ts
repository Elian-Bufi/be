import { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

/**
 * Concurrencia en la base (WP-03, hallazgos de la revisión adversarial):
 *
 * Orden único de bloqueos. Toda transacción que escribe toma sus filas en este orden:
 *   identidad → verificación/habilitación → solicitud → alcance de vínculo → consentimiento → acto A3.
 * Y con `FOR NO KEY UPDATE`, no `FOR UPDATE`: ninguna transacción cambia claves, y así no choca con el `FOR KEY SHARE`
 * que toman las claves foráneas al insertar hechos y decisiones. El PDP toma `FOR SHARE` en el mismo orden
 * (pdp.service.ts), lo que da un orden total entre cada decisión y cada corte (revocar, pausar, finalizar, cerrar).
 */

/**
 * Hora de la base, tomada después de los bloqueos: el instante en que un corte o una decisión quedan ordenados
 * respecto de los demás. La hora de llegada del request sigue en la procedencia y la auditoría.
 */
export async function momentoDeLaBase(tx: Prisma.TransactionClient): Promise<Date> {
  const [fila] = await tx.$queryRaw<{ ahora: Date }[]>`SELECT clock_timestamp() AS "ahora"`;
  if (!fila) throw errores.interno();
  return fila.ahora;
}

/** Deadlock (40P01) o falla de serialización (40001): la transacción se revirtió entera y repetirla es seguro. */
export function esConflictoTransitorio(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2034') return true;
    if (e.code === 'P2010') {
      const codigo = (e.meta as { code?: unknown } | undefined)?.code;
      return codigo === '40P01' || codigo === '40001';
    }
    return false;
  }
  if (e instanceof Prisma.PrismaClientUnknownRequestError) return /\b(40P01|40001)\b|deadlock detected|could not serialize/i.test(e.message);
  return false;
}

/**
 * Repite la transacción ante un conflicto transitorio, con espera corta y variable. Si se agotan los intentos, el
 * conflicto sale como 409 (09 §3: «conflicto concurrente»), que el servicio audita como cualquier rechazo, y no
 * como un 500.
 */
export async function conReintento<T>(transaccion: () => Promise<T>, intentos = 3): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await transaccion();
    } catch (e) {
      if (!esConflictoTransitorio(e)) throw e;
      if (intento >= intentos) throw errores.conflictoConcurrente();
      await new Promise((r) => setTimeout(r, 15 * intento + Math.floor(Math.random() * 25)));
    }
  }
}
