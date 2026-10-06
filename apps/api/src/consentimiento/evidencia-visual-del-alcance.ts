import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * El acto `EVIDENCIA_VISUAL` de un alcance de Nutrición (08 §12.4; DL-125), para las reglas de API-MED-01 y 03. Va acá,
 * como `a3-del-titular.ts`, para que los medios lo usen sin depender del módulo de consentimientos.
 * - **El alcance** es el componente de Nutrición no finalizado del vínculo entre el titular y el profesional: hay uno solo
 *   a la vez (`alcance_de_vinculo_no_finalizado`).
 * - **Con bloqueo** (`bloquear: true`), el acto se toma en modo compartido, como el A3 en una escritura propia: una
 *   revocación en curso hace esperar a la subida y, al confirmarse, la deniega. El acto va después del A3 en el orden
 *   único de bloqueos (prisma/concurrencia.ts), y la revocación (API-EVI-04) solo bloquea ese acto.
 */

/** El alcance de Nutrición no finalizado entre un profesional y un asesorado, o `null`. */
export async function alcanceDeNutricion(tx: Tx, profesionalId: string, asesoradoId: string): Promise<string | null> {
  const [fila] = await tx.$queryRaw<{ id: string }[]>`
    SELECT av."id"::text AS "id"
      FROM "alcance_de_vinculo" av
      JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
     WHERE vi."profesional_id" = ${profesionalId}::uuid AND vi."asesorado_id" = ${asesoradoId}::uuid
       AND av."alcance" = 'NUTRICION' AND av."estado" <> 'FINALIZADO'`;
  return fila?.id ?? null;
}

/**
 * Los alcances de Nutrición de los planes vigentes del asesorado: los de los profesionales que verían una foto de una comida
 * registrada hoy. Es el criterio de `IngestasService.planVigente` (versión efectiva y proceso abierto); si hubiera más de
 * uno, se devuelven todos, ordenados, y la subida exige el acto de cada uno.
 */
export async function alcancesDeLosPlanesVigentes(tx: Tx, asesoradoId: string): Promise<string[]> {
  const filas = await tx.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT av."id"::text AS "id"
      FROM "plan_nutricional" p
      JOIN "proceso_operativo" pr ON pr."profesional_id" = p."profesional_id" AND pr."asesorado_id" = p."asesorado_id"
                                  AND pr."alcance" = 'NUTRICION' AND pr."estado" = 'ABIERTO'
      JOIN "vinculo" vi ON vi."profesional_id" = p."profesional_id" AND vi."asesorado_id" = p."asesorado_id"
      JOIN "alcance_de_vinculo" av ON av."vinculo_id" = vi."id" AND av."alcance" = 'NUTRICION' AND av."estado" <> 'FINALIZADO'
     WHERE p."asesorado_id" = ${asesoradoId}::uuid AND p."version_efectiva_id" IS NOT NULL
     ORDER BY 1`;
  return filas.map((f) => f.id);
}

/** Si el alcance tiene su acto `EVIDENCIA_VISUAL` vigente. */
export async function tieneEvidenciaVisualVigente(tx: Tx, alcanceDeVinculoId: string, opciones: { readonly bloquear?: boolean } = {}): Promise<boolean> {
  if (opciones.bloquear) {
    const filas = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"::text FROM "acto_registrable"
       WHERE "alcance_de_vinculo_id" = ${alcanceDeVinculoId}::uuid AND "tipo" = 'EVIDENCIA_VISUAL' AND "estado" = 'VIGENTE' FOR SHARE`;
    return filas.length > 0;
  }
  const [fila] = await tx.$queryRaw<{ vigente: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM "acto_registrable"
                    WHERE "alcance_de_vinculo_id" = ${alcanceDeVinculoId}::uuid AND "tipo" = 'EVIDENCIA_VISUAL' AND "estado" = 'VIGENTE') AS "vigente"`;
  return fila?.vigente === true;
}

/**
 * La versión de texto aplicable: la cabeza de la cadena de su tipo, como B2 (REG-06-12; DL-038). Hoy, la propuesta. Una
 * versión aprobada que la reemplace pasa a ser la aplicable, y un acto de la anterior sigue vigente hasta que se revoque.
 */
export async function versionDeEvidenciaVisual(tx: Tx): Promise<{ id: string; titulo: string; texto: string; hash: string; vigenteDesde: Date } | null> {
  const [v] = await tx.$queryRaw<{ id: string; titulo: string; texto: string; hash: string; vigenteDesde: Date }[]>`
    SELECT "id", "titulo", "texto", "hash", "vigente_desde" AS "vigenteDesde"
      FROM "version_de_texto" v
     WHERE v."tipo" = 'EVIDENCIA_VISUAL'
       AND NOT EXISTS (SELECT 1 FROM "version_de_texto" s WHERE s."reemplaza_a_id" = v."id")`;
  return v ?? null;
}
