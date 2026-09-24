-- WP-08 · Importación controlada de Open Food Facts y wger (RF-028, RF-038; 09 v0.12 §3-§7; docs/paquetes/WP-08.md).
-- El candidato no es un elemento del catálogo: lo es recién cuando su profesional lo resuelve IMPORTAR.

-- CreateEnum
CREATE TYPE "ProveedorExterno" AS ENUM ('OPEN_FOOD_FACTS', 'WGER');

-- CreateEnum
CREATE TYPE "DecisionDeImportacion" AS ENUM ('IMPORTAR', 'RECHAZAR');

-- AlterEnum
ALTER TYPE "ProcedenciaDeCatalogo" ADD VALUE 'CONTROLLED_IMPORT';

-- CreateTable
CREATE TABLE "candidato_de_importacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alcance" "Alcance" NOT NULL,
    "proveedor" "ProveedorExterno" NOT NULL,
    "id_externo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "huella_de_lo_recibido" TEXT NOT NULL,
    "licencia" JSONB NOT NULL,
    "url_de_origen" TEXT NOT NULL,
    "profesional_id" UUID NOT NULL,
    "recibido_en" TIMESTAMPTZ(3) NOT NULL,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidato_de_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolucion_de_candidato" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "candidato_id" UUID NOT NULL,
    "decision" "DecisionDeImportacion" NOT NULL,
    "contenido_revisado" JSONB,
    "campos_corregidos" JSONB NOT NULL DEFAULT '[]',
    "fundamento" TEXT,
    "elemento_nutricional_id" UUID,
    "ejercicio_id" UUID,
    "version_creada_id" UUID,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolucion_de_candidato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidato_de_importacion_profesional_id_momento_de_registro_idx" ON "candidato_de_importacion"("profesional_id", "momento_de_registro");

-- CreateIndex
CREATE UNIQUE INDEX "resolucion_de_candidato_candidato_id_key" ON "resolucion_de_candidato"("candidato_id");

-- AddForeignKey
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_candidato_id_fkey" FOREIGN KEY ("candidato_id") REFERENCES "candidato_de_importacion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_elemento_nutricional_id_fkey" FOREIGN KEY ("elemento_nutricional_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Garantías que Prisma no representa (triggers, CHECK, coherencia) ─────────────────────────────────────────
-- WP-08 · la importación controlada (09 v0.12 §2-§3; UC-I07). La base las sostiene aunque el servicio se equivoque.

-- Un candidato es de un solo dominio y de su proveedor: Open Food Facts es nutrición, wger es entrenamiento.
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_proveedor_del_alcance" CHECK (
  ("alcance" = 'NUTRICION' AND "proveedor" = 'OPEN_FOOD_FACTS') OR ("alcance" = 'ENTRENAMIENTO' AND "proveedor" = 'WGER')
);
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_con_identificador" CHECK (btrim("id_externo") <> '');
-- D-C: lo recibido se identifica por su SHA-256; el candidato vence después de recibido.
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_huella" CHECK ("huella_de_lo_recibido" ~ '^[0-9a-f]{64}$');
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_vence_despues" CHECK ("vence_en" > "recibido_en");
ALTER TABLE "candidato_de_importacion" ADD CONSTRAINT "candidato_de_importacion_contenido" CHECK (jsonb_typeof("contenido") = 'object' AND jsonb_typeof("licencia") = 'object');

-- Importar crea exactamente un elemento, y del catálogo del dominio del candidato; rechazar no crea nada ni guarda
-- contenido revisado. La lista de campos corregidos es siempre un arreglo.
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_efecto_coherente" CHECK (
  ("decision" = 'IMPORTAR' AND num_nonnulls("elemento_nutricional_id", "ejercicio_id") = 1 AND "version_creada_id" IS NOT NULL AND "contenido_revisado" IS NOT NULL)
  OR
  ("decision" = 'RECHAZAR' AND num_nonnulls("elemento_nutricional_id", "ejercicio_id", "version_creada_id", "contenido_revisado") = 0)
);
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_campos_corregidos" CHECK (jsonb_typeof("campos_corregidos") = 'array');
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_fundamento" CHECK ("fundamento" IS NULL OR btrim("fundamento") <> '');

-- 09v12:103-105: «solo puede resolverse por actor autorizado». El autor de la resolución es el profesional del
-- candidato; el elemento creado es del dominio del candidato; y no se resuelve lo vencido.
CREATE OR REPLACE FUNCTION "be_resolucion_de_candidato_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT "profesional_id", "alcance", "vence_en" INTO c FROM "candidato_de_importacion" WHERE "id" = NEW."candidato_id";
  IF NEW."autor_id" <> c."profesional_id" THEN
    RAISE EXCEPTION 'BE: la resolución de un candidato es de quien lo pidió' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."decision" = 'IMPORTAR' AND ((c."alcance" = 'NUTRICION' AND NEW."elemento_nutricional_id" IS NULL) OR (c."alcance" = 'ENTRENAMIENTO' AND NEW."ejercicio_id" IS NULL)) THEN
    RAISE EXCEPTION 'BE: el elemento importado tiene que ser del dominio del candidato' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."momento_de_registro" > c."vence_en" THEN
    RAISE EXCEPTION 'BE: un candidato vencido no se resuelve' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "resolucion_de_candidato_insertar" BEFORE INSERT ON "resolucion_de_candidato" FOR EACH ROW EXECUTE FUNCTION "be_resolucion_de_candidato_insertar"();

-- Append-only: lo recibido y lo decidido no se reescriben ni se borran (UC-I07 §14.5.6: la corrección no oculta la fuente).
CREATE TRIGGER "candidato_de_importacion_solo_agregar" BEFORE UPDATE OR DELETE ON "candidato_de_importacion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "resolucion_de_candidato_solo_agregar" BEFORE UPDATE OR DELETE ON "resolucion_de_candidato" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "candidato_de_importacion_sin_truncate" BEFORE TRUNCATE ON "candidato_de_importacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "resolucion_de_candidato_sin_truncate" BEFORE TRUNCATE ON "resolucion_de_candidato" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
