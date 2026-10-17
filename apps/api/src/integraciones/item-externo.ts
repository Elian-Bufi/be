import { Prisma, type ProveedorExterno } from '@prisma/client';

type Tx = Prisma.TransactionClient;
type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * DL-141 D-1 · lo importado de un proveedor es de todos los profesionales, y hay uno solo por ítem externo (proveedor más
 * identificador). La tabla `item_externo_de_catalogo` dice cuál es el elemento de cada ítem: lo registra la resolución
 * que lo importó primero, y las siguientes apuntan a ese mismo elemento (la base lo sostiene en
 * `be_resolucion_de_candidato_insertar`).
 *
 * Quién lo ve: todos los que ven el catálogo de ese dominio, igual que lo sembrado. Un importado de antes de DL-141 que
 * repetía un ítem que otro ya había importado (sin fila en la tabla) sigue siendo de quien lo importó.
 */

/** El ejercicio `e` es el de un ítem externo: lo ven todos. La consulta tiene que llamar `e` al ejercicio. */
export const EJERCICIO_DE_UN_ITEM_EXTERNO = Prisma.sql`EXISTS (SELECT 1 FROM "item_externo_de_catalogo" x WHERE x."ejercicio_id" = e."id")`;

/** El alimento `e` es el de un ítem externo: lo ven todos. La consulta tiene que llamar `e` al elemento. */
export const ALIMENTO_DE_UN_ITEM_EXTERNO = Prisma.sql`EXISTS (SELECT 1 FROM "item_externo_de_catalogo" x WHERE x."elemento_nutricional_id" = e."id")`;

/**
 * Ordena dos importaciones simultáneas del mismo ítem externo, aunque sean de profesionales distintos: la segunda espera a
 * que la primera confirme y encuentra el elemento que creó. Se toma después del candidato (`candidatoPropio`), al final
 * del orden de bloqueos de `prisma/concurrencia.ts`, y dura lo que la transacción.
 */
export async function bloquearItemExterno(tx: Tx, proveedor: ProveedorExterno, idExterno: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`item-externo|${proveedor}|${idExterno}`}, 0))`;
}

/** El elemento (alimento o ejercicio, según el proveedor) que ya representa a este ítem externo, o `null`. */
export async function elementoDelItemExterno(cliente: Cliente, proveedor: ProveedorExterno, idExterno: string): Promise<string | null> {
  const [fila] = await cliente.$queryRaw<{ id: string | null }[]>`
    SELECT COALESCE("elemento_nutricional_id", "ejercicio_id")::text AS "id"
      FROM "item_externo_de_catalogo"
     WHERE "proveedor" = ${proveedor}::"ProveedorExterno" AND "id_externo" = ${idExterno}`;
  return fila?.id ?? null;
}

/** Registra el elemento recién creado como el de su ítem externo. Lo hace la resolución que lo crea, en su transacción. */
export async function registrarItemExterno(
  tx: Tx,
  item: { proveedor: ProveedorExterno; idExterno: string; elementoNutricionalId?: string; ejercicioId?: string; procedencia: Prisma.InputJsonValue },
): Promise<void> {
  await tx.itemExternoDeCatalogo.create({
    data: {
      proveedor: item.proveedor,
      idExterno: item.idExterno,
      elementoNutricionalId: item.elementoNutricionalId ?? null,
      ejercicioId: item.ejercicioId ?? null,
      procedencia: item.procedencia,
    },
  });
}
