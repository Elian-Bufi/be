import { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

/**
 * Concurrencia en la base (WP-03, hallazgos de la revisión adversarial):
 *
 * Orden único de bloqueos. Toda transacción que escribe toma sus filas en este orden:
 *   identidad → verificación/habilitación → (DL-136) invitación de vínculo → solicitud → alcance de vínculo
 *   → consentimiento → acto A3 → (DL-125) acto EVIDENCIA_VISUAL → (WP-04) plan nutricional → versión de plan
 *   → cerrojo de capacidad → Proceso → objetivo → ingesta.
 * La importación controlada no toma ninguno de esos: toma su candidato y, después, el cerrojo de su ítem externo
 * (DL-141, `integraciones/item-externo.ts`). Ninguna otra transacción toma ese cerrojo.
 * La Solicitud de formulario (DL-164, `formularios/cerrojo-de-solicitud.ts`) se toma **antes** de todos los anteriores,
 * al empezar el efecto de responderla o de cargarle una propuesta: ningún corte la toma, así que no invierte el orden
 * con nadie. La revocación del A3 resuelve las propuestas pendientes del titular con el acto ya tomado: el mismo orden
 * «acto A3 → propuesta» con que confirmar, retirar o reemplazar las escriben después de pasar por el PDP.
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

/** Violación de un índice único (P2002): otra transacción escribió lo mismo primero. */
export function esViolacionDeUnicidad(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

/**
 * Una escritura que la base puede rechazar por unicidad bajo concurrencia: la verificación previa («el nombre está
 * libre») no alcanza entre dos transacciones simultáneas, y la base deja pasar una sola. La otra recibe el 409 preciso
 * de la operación, no un 500. La transacción queda abortada, así que el error sale enseguida.
 */
export async function sinDuplicar<T>(escritura: PromiseLike<T>, conflicto: () => Error): Promise<T> {
  try {
    return await escritura;
  } catch (e) {
    if (esViolacionDeUnicidad(e)) throw conflicto();
    throw e;
  }
}

/**
 * Una regla de la base rechazó la escritura (`check_violation`, SQLSTATE 23514): un CHECK o un trigger con
 * `RAISE EXCEPTION ... USING ERRCODE = 'check_violation'`. Prisma la trae como P2010 (consulta cruda, con el código en
 * `meta`) o como error desconocido con el código y el mensaje en el texto (una operación del cliente). `regla` acota a
 * la que se espera: cualquier otra sigue siendo un defecto.
 */
export function esViolacionDeRegla(e: unknown, regla?: RegExp): boolean {
  let texto: string;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = e.meta as { code?: unknown; message?: unknown } | undefined;
    if (e.code !== 'P2010' || meta?.code !== '23514') return false;
    texto = `${String(meta?.message ?? '')} ${e.message}`;
  } else if (e instanceof Prisma.PrismaClientUnknownRequestError && /\b23514\b|check_violation/.test(e.message)) {
    texto = e.message;
  } else {
    return false;
  }
  return regla ? regla.test(texto) : true;
}

/**
 * Una escritura que un trigger de la base puede rechazar bajo concurrencia aunque el servicio ya haya mirado lo mismo
 * (p. ej. «una Solicitud respondida no admite propuestas» cuando la Respuesta entró entre la lectura y la escritura):
 * esa regla sale como el error preciso de la operación, no como un 500. Cualquier otra regla sigue saliendo como 500:
 * es un defecto, no un caso. La transacción queda abortada, así que el error sale enseguida.
 */
export async function sinViolarRegla<T>(escritura: PromiseLike<T>, regla: RegExp, rechazo: () => Error): Promise<T> {
  try {
    return await escritura;
  } catch (e) {
    if (esViolacionDeRegla(e, regla)) throw rechazo();
    throw e;
  }
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
