-- WP-NUTRICION-ALIMENTOS (DL-180), segundo tramo: compartir con control (NUA-D14 a D16; docs/paquetes/WP-NUTRICION-ALIMENTOS.md).
-- Solo agrega: una tabla de hechos, su siembra desde la del primer tramo y sus guardias, y reemplaza el cuerpo de la guardia
-- de `revision_administrativa_de_alimento` (creada en esta misma rama). Ninguna fila existente cambia.
-- - `cambio_de_alimento_compartido`: compartir un alimento cargado a mano y dejar de compartirlo son hechos de su autor, de
--   solo agregar. El vigente es el de mayor número; sin filas, no se comparte. Cada uno invierte el anterior (los impares
--   comparten, los pares dejan de compartir) y guarda la versión vigente al decidir: los demás profesionales citan, desde la
--   última vez que se compartió, esa versión y las que la siguen (las de antes, nunca).
-- - `alimento_compartido` (primer tramo) queda como historia: cada fila se copia como el primer cambio de su alimento, con
--   la versión que regía cuando se compartió. Ya no se escribe.
-- - Administración revisa solo lo que se comparte **ahora**: lo que su autor dejó de compartir sale de su consola.

-- CreateTable
CREATE TABLE "cambio_de_alimento_compartido" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "compartido" BOOLEAN NOT NULL,
    "version_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_alimento_compartido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cambio_de_alimento_compartido_elemento_id_numero_key" ON "cambio_de_alimento_compartido"("elemento_id", "numero");

-- AddForeignKey
ALTER TABLE "cambio_de_alimento_compartido" ADD CONSTRAINT "cambio_de_alimento_compartido_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cambio_de_alimento_compartido" ADD CONSTRAINT "cambio_de_alimento_compartido_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "version_de_elemento_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cambio_de_alimento_compartido" ADD CONSTRAINT "cambio_de_alimento_compartido_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Guardias ─────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE "cambio_de_alimento_compartido" ADD CONSTRAINT "cambio_de_alimento_compartido_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Cada cambio invierte el anterior: el primero comparte, el segundo deja de compartir, el tercero vuelve a compartir…
ALTER TABLE "cambio_de_alimento_compartido" ADD CONSTRAINT "cambio_de_alimento_compartido_alterna" CHECK ("numero" >= 1 AND "compartido" = ("numero" % 2 = 1));

-- ─── La siembra: lo que se compartió en el primer tramo ───────────────────────────────────────────
-- Cada fila de `alimento_compartido` es el primer cambio de su alimento, con su momento y la versión que regía entonces (la
-- última registrada hasta ese momento; si no se encuentra, la vigente). Va antes de la guardia que exige la vigente, porque
-- lo compartido en el primer tramo pudo corregirse después. Correrla dos veces no agrega nada.
INSERT INTO "cambio_de_alimento_compartido" ("elemento_id", "numero", "compartido", "version_id", "autor_id", "procedencia", "momento_de_registro")
SELECT c."elemento_id", 1, TRUE,
       COALESCE(
         (SELECT v."id" FROM "version_de_elemento_nutricional" v
           WHERE v."elemento_id" = c."elemento_id" AND v."momento_de_registro" <= c."momento_de_registro"
           ORDER BY v."momento_de_registro" DESC, v."id" DESC LIMIT 1),
         (SELECT v."id" FROM "version_de_elemento_nutricional" v
           WHERE v."elemento_id" = c."elemento_id"
             AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id"))),
       e."creado_por_id",
       jsonb_build_object('fuente', 'alimento_compartido', 'siembra', 'WP-NUTRICION-ALIMENTOS · DL-180 · segundo tramo',
                          'nota', 'Lo compartido en el primer tramo, como su primer cambio.', 'procedenciaOriginal', c."procedencia"),
       c."momento_de_registro"
  FROM "alimento_compartido" c
  JOIN "elemento_de_catalogo_nutricional" e ON e."id" = c."elemento_id"
 WHERE e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM "cambio_de_alimento_compartido" x WHERE x."elemento_id" = c."elemento_id");

-- Lo comparte o lo deja de compartir solo quien lo cargó a mano; la versión es la vigente de ese alimento, y cada cambio
-- sigue al anterior.
CREATE FUNCTION "be_cambio_de_alimento_compartido_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: un alimento lo comparte o lo deja de compartir quien lo cargó a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "version_de_elemento_nutricional" v
     WHERE v."id" = NEW."version_id" AND v."elemento_id" = NEW."elemento_id"
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")) THEN
    RAISE EXCEPTION 'BE: un cambio de compartido guarda la versión vigente del alimento' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(k."numero") FROM "cambio_de_alimento_compartido" k WHERE k."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: un cambio de compartido sigue al anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cambio_de_alimento_compartido_guardar" BEFORE INSERT ON "cambio_de_alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_cambio_de_alimento_compartido_guardar"();
CREATE TRIGGER "cambio_de_alimento_compartido_solo_agregar" BEFORE UPDATE OR DELETE ON "cambio_de_alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cambio_de_alimento_compartido_sin_truncate" BEFORE TRUNCATE ON "cambio_de_alimento_compartido" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- `alimento_compartido` ya no se escribe: lo compartido es el último cambio de la tabla nueva.
CREATE FUNCTION "be_alimento_compartido_cerrado"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'BE: lo compartido se registra en cambio_de_alimento_compartido' USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "alimento_compartido_cerrado" BEFORE INSERT ON "alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_alimento_compartido_cerrado"();

-- La revisión de Administración: lo mismo que antes, pero sobre lo que se comparte ahora (el último cambio comparte).
CREATE OR REPLACE FUNCTION "be_revision_administrativa_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un alimento lo revisa un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e JOIN "version_de_elemento_nutricional" v ON v."elemento_id" = e."id"
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND v."id" = NEW."version_id") THEN
    RAISE EXCEPTION 'BE: Administración revisa una versión de un alimento cargado a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT COALESCE((SELECT k."compartido" FROM "cambio_de_alimento_compartido" k WHERE k."elemento_id" = NEW."elemento_id" ORDER BY k."numero" DESC LIMIT 1), FALSE) THEN
    RAISE EXCEPTION 'BE: Administración revisa solo lo que su autor compartió' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."equivalente_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "version_de_elemento_nutricional" t
     WHERE t."elemento_id" = NEW."equivalente_id" AND t."disponibilidad" = 'DISPONIBLE'
       AND t."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = t."id")) THEN
    RAISE EXCEPTION 'BE: el equivalente es un alimento verificado y disponible' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(r."numero") FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: una revisión de un alimento sigue a la anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
