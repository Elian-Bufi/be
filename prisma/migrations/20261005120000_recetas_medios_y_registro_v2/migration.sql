-- WP-NUTRICION-RECETAS (docs/paquetes/WP-NUTRICION-RECETAS.md §3): recetas (DL-119), medios privados (DL-120) y registro
-- v2 de comidas (DL-121). Migración aditiva: nada de lo anterior se reescribe (ni planes, ni instantáneas, ni ingestas, ni
-- correcciones); lo registrado antes queda con secuencia 0 y sin cantidades v2.
-- 1. Tablas, enums, columnas y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base: la clave natural de la ingesta con secuencia, una sola ingesta efectiva por comida y día, la
--    comida diferente con texto o fotos, listas blancas de receta y medio, cadenas y solo agregar.
-- 3. Los ocho alimentos de referencia de USDA FoodData Central · SR Legacy (CC0), con UUID deterministas.
-- CreateEnum
CREATE TYPE "MetodoDeCalculoNutricional" AS ENUM ('SUM_SOURCE_PER_100G_V1');

-- CreateEnum
CREATE TYPE "FinalidadDeMedio" AS ENUM ('RECETA_REFERENCIA', 'EVIDENCIA_DE_INGESTA');

-- CreateEnum
CREATE TYPE "EstadoDeMedio" AS ENUM ('PENDIENTE', 'DISPONIBLE', 'SUPRIMIDO');

-- CreateEnum
CREATE TYPE "ProcedenciaDeImagen" AS ENUM ('GENERADA_POR_IA', 'APORTADA_POR_LA_PERSONA');

-- CreateEnum
CREATE TYPE "CambioDeImagenDeReceta" AS ENUM ('ASOCIAR', 'RETIRAR');

-- AlterEnum
ALTER TYPE "TipoDeActoRegistrable" ADD VALUE 'EVIDENCIA_VISUAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'RecetaCreada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'RecetaVersionada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'ImagenDeRecetaAsociada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'ImagenDeRecetaRetirada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'IngestaAnulada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'CantidadesDeIngestaRectificadas';

-- AlterTable
ALTER TABLE "ingesta_nutricional" ADD COLUMN     "cantidades_consumidas" JSONB,
ADD COLUMN     "comida_de_contexto_id" TEXT,
ADD COLUMN     "dia_tipo_de_contexto_id" TEXT,
ADD COLUMN     "secuencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version_de_receta_id" UUID;

-- CreateTable
CREATE TABLE "receta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_receta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receta_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "porciones" INTEGER NOT NULL,
    "pasos" JSONB NOT NULL,
    "ingredientes" JSONB NOT NULL,
    "metodo_de_calculo" "MetodoDeCalculoNutricional" NOT NULL,
    "resultado" JSONB NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propietario_id" UUID NOT NULL,
    "finalidad" "FinalidadDeMedio" NOT NULL,
    "estado" "EstadoDeMedio" NOT NULL DEFAULT 'PENDIENTE',
    "procedencia_de_imagen" "ProcedenciaDeImagen" NOT NULL,
    "autoria" TEXT,
    "tipo_declarado" TEXT NOT NULL,
    "bytes_declarados" INTEGER NOT NULL,
    "tipo_original" TEXT,
    "bytes_originales" INTEGER,
    "ancho_original" INTEGER,
    "alto_original" INTEGER,
    "sha256_original" TEXT,
    "tipo_procesado" TEXT,
    "bytes_procesados" INTEGER,
    "ancho_procesado" INTEGER,
    "alto_procesado" INTEGER,
    "sha256_procesado" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_subida" TIMESTAMPTZ(3),
    "momento_de_supresion" TIMESTAMPTZ(3),
    "motivo_de_supresion" TEXT,

    CONSTRAINT "medio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contenido_de_medio" (
    "medio_id" UUID NOT NULL,
    "bytes" BYTEA NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contenido_de_medio_pkey" PRIMARY KEY ("medio_id")
);

-- CreateTable
CREATE TABLE "asociacion_de_imagen_de_receta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receta_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "cambio" "CambioDeImagenDeReceta" NOT NULL,
    "medio_id" UUID,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asociacion_de_imagen_de_receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencia_visual_de_ingesta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingesta_id" UUID NOT NULL,
    "medio_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencia_visual_de_ingesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anulacion_de_ingesta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingesta_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "motivo" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anulacion_de_ingesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rectificacion_de_cantidades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingesta_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "cantidades" JSONB NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rectificacion_de_cantidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receta_profesional_id_momento_de_actualizacion_idx" ON "receta"("profesional_id", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_receta_predecesora_id_key" ON "version_de_receta"("predecesora_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_receta_receta_id_numero_key" ON "version_de_receta"("receta_id", "numero");

-- CreateIndex
CREATE INDEX "medio_propietario_id_finalidad_estado_idx" ON "medio"("propietario_id", "finalidad", "estado");

-- CreateIndex
CREATE INDEX "asociacion_de_imagen_de_receta_medio_id_idx" ON "asociacion_de_imagen_de_receta"("medio_id");

-- CreateIndex
CREATE UNIQUE INDEX "asociacion_de_imagen_de_receta_receta_id_numero_key" ON "asociacion_de_imagen_de_receta"("receta_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "evidencia_visual_de_ingesta_medio_id_key" ON "evidencia_visual_de_ingesta"("medio_id");

-- CreateIndex
CREATE INDEX "evidencia_visual_de_ingesta_ingesta_id_idx" ON "evidencia_visual_de_ingesta"("ingesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "anulacion_de_ingesta_ingesta_id_key" ON "anulacion_de_ingesta"("ingesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "rectificacion_de_cantidades_predecesora_id_key" ON "rectificacion_de_cantidades"("predecesora_id");

-- CreateIndex
CREATE INDEX "rectificacion_de_cantidades_ingesta_id_idx" ON "rectificacion_de_cantidades"("ingesta_id");

-- AddForeignKey
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_version_de_receta_id_fkey" FOREIGN KEY ("version_de_receta_id") REFERENCES "version_de_receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "receta" ADD CONSTRAINT "receta_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_receta" ADD CONSTRAINT "version_de_receta_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_receta" ADD CONSTRAINT "version_de_receta_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "medio" ADD CONSTRAINT "medio_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "contenido_de_medio" ADD CONSTRAINT "contenido_de_medio_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asociacion_de_imagen_de_receta" ADD CONSTRAINT "asociacion_de_imagen_de_receta_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asociacion_de_imagen_de_receta" ADD CONSTRAINT "asociacion_de_imagen_de_receta_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evidencia_visual_de_ingesta" ADD CONSTRAINT "evidencia_visual_de_ingesta_ingesta_id_fkey" FOREIGN KEY ("ingesta_id") REFERENCES "ingesta_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evidencia_visual_de_ingesta" ADD CONSTRAINT "evidencia_visual_de_ingesta_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "anulacion_de_ingesta" ADD CONSTRAINT "anulacion_de_ingesta_ingesta_id_fkey" FOREIGN KEY ("ingesta_id") REFERENCES "ingesta_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "rectificacion_de_cantidades" ADD CONSTRAINT "rectificacion_de_cantidades_ingesta_id_fkey" FOREIGN KEY ("ingesta_id") REFERENCES "ingesta_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "rectificacion_de_cantidades" ADD CONSTRAINT "rectificacion_de_cantidades_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "rectificacion_de_cantidades"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Ingesta: la clave natural suma la secuencia (DL-049 → DL-121) ────────────────────────────────────────────────
-- Una prescripta por (versión, fecha, comida, secuencia). Lo registrado antes tiene secuencia 0 y la conserva.
DROP INDEX "ingesta_nutricional_prescripta_unica";
CREATE UNIQUE INDEX "ingesta_nutricional_prescripta_unica" ON "ingesta_nutricional" ("version_de_plan_id", "fecha_local", "comida_id", "secuencia") WHERE "origen" = 'PRESCRIPTA';

-- La prescripta referencia día tipo, comida y opción y no trae texto libre. La libre (la «comida diferente» del registro
-- v2) conserva su texto si lo tiene, no marca ninguna comida y puede llevar la comida del plan como contexto en columnas
-- propias. Las filas anteriores cumplen la regla nueva tal como están.
ALTER TABLE "ingesta_nutricional" DROP CONSTRAINT "ingesta_nutricional_origen_coherente";
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_origen_coherente" CHECK (
  ("origen" = 'PRESCRIPTA' AND "modo" = 'OPCIONES_DE_PLATO' AND "dia_tipo_id" IS NOT NULL AND "comida_id" IS NOT NULL AND "opcion_id" IS NOT NULL
    AND "descripcion" IS NULL AND "descripcion_de_porcion" IS NULL AND "dia_tipo_de_contexto_id" IS NULL AND "comida_de_contexto_id" IS NULL)
  OR ("origen" = 'FUERA_DE_PRESCRIPCION' AND "modo" = 'DESCRIPCION_LIBRE' AND ("descripcion" IS NULL OR btrim("descripcion") <> '')
    AND "dia_tipo_id" IS NULL AND "comida_id" IS NULL AND "opcion_id" IS NULL AND "items_consumidos" = '[]'::jsonb AND "observacion" IS NULL
    AND "cantidades_consumidas" IS NULL AND "version_de_receta_id" IS NULL
    AND ("comida_de_contexto_id" IS NULL OR "dia_tipo_de_contexto_id" IS NOT NULL))
);
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_secuencia_valida" CHECK ("secuencia" >= 0);

-- DL-121: una sola ingesta efectiva (no anulada) por comida y día de una versión, de cualquier clase. La prescripta ocupa
-- su comida; la diferente, la comida de su contexto. El servicio lo decide bajo un cerrojo por (versión, fecha, comida);
-- la base lo sostiene aunque el código se equivoque.
CREATE FUNCTION "be_ingesta_una_efectiva_por_comida"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_comida TEXT;
BEGIN
  v_comida := CASE WHEN NEW."origen" = 'PRESCRIPTA' THEN NEW."comida_id" ELSE NEW."comida_de_contexto_id" END;
  IF v_comida IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
       SELECT 1 FROM "ingesta_nutricional" i
        WHERE i."version_de_plan_id" = NEW."version_de_plan_id" AND i."fecha_local" = NEW."fecha_local"
          AND (CASE WHEN i."origen" = 'PRESCRIPTA' THEN i."comida_id" ELSE i."comida_de_contexto_id" END) = v_comida
          AND NOT EXISTS (SELECT 1 FROM "anulacion_de_ingesta" a WHERE a."ingesta_id" = i."id")) THEN
    RAISE EXCEPTION 'BE: ya hay una ingesta efectiva de esa comida ese día; para registrar otra, primero se anula (DL-121)' USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "ingesta_nutricional_una_efectiva_por_comida" BEFORE INSERT ON "ingesta_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_ingesta_una_efectiva_por_comida"();

-- REG-06-133: una comida diferente lleva texto, fotos o los dos. Sin texto, al confirmar tiene que tener una foto.
CREATE FUNCTION "be_ingesta_diferente_con_contenido"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."origen" = 'FUERA_DE_PRESCRIPCION' AND NEW."descripcion" IS NULL
     AND NOT EXISTS (SELECT 1 FROM "evidencia_visual_de_ingesta" e WHERE e."ingesta_id" = NEW."id") THEN
    RAISE EXCEPTION 'BE: una comida diferente lleva una descripción, una foto o las dos (REG-06-133)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "ingesta_nutricional_diferente_con_contenido" AFTER INSERT ON "ingesta_nutricional" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_ingesta_diferente_con_contenido"();

-- ─── Anulación y rectificación: del titular, de solo agregar (DL-121; 06:1422-1462) ──────────────────────────────
CREATE FUNCTION "be_anulacion_de_ingesta_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "ingesta_nutricional" WHERE "id" = NEW."ingesta_id" AND "asesorado_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: una ingesta la anula su titular (DL-121)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "anulacion_de_ingesta_insertar" BEFORE INSERT ON "anulacion_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_anulacion_de_ingesta_insertar"();

CREATE FUNCTION "be_rectificacion_de_cantidades_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "ingesta_nutricional" WHERE "id" = NEW."ingesta_id" AND "origen" = 'PRESCRIPTA' AND "asesorado_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: las cantidades de una opción del plan las rectifica su titular (DL-121)' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM "anulacion_de_ingesta" WHERE "ingesta_id" = NEW."ingesta_id") THEN
    RAISE EXCEPTION 'BE: una ingesta anulada no se rectifica (DL-121)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."predecesora_id" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "rectificacion_de_cantidades" WHERE "id" = NEW."predecesora_id" AND "ingesta_id" = NEW."ingesta_id") THEN
    RAISE EXCEPTION 'BE: en rectificacion_de_cantidades la predecesora tiene que ser del mismo objeto (REG-06-15)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "rectificacion_de_cantidades_insertar" BEFORE INSERT ON "rectificacion_de_cantidades" FOR EACH ROW EXECUTE FUNCTION "be_rectificacion_de_cantidades_insertar"();
CREATE UNIQUE INDEX "rectificacion_de_cantidades_una_raiz" ON "rectificacion_de_cantidades" ("ingesta_id") WHERE "predecesora_id" IS NULL;

-- ─── Receta: la versión del recurso avanza de a uno; el profesional y el alta no cambian; no se borra (DL-119) ──────
CREATE FUNCTION "be_receta_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: una receta nace en su versión 1 (DL-119)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una receta no se elimina: la historia es por adición (06 §4.4)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."profesional_id", NEW."momento_de_registro") IS DISTINCT FROM (OLD."id", OLD."profesional_id", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: la receta conserva su profesional y su alta' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión de la receta avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "receta_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "receta" FOR EACH ROW EXECUTE FUNCTION "be_receta_guardar"();

-- Una receta existe con su versión 1: se verifica al confirmar, porque el servicio crea la receta antes que su versión.
CREATE FUNCTION "be_receta_con_version"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "version_de_receta" WHERE "receta_id" = NEW."id" AND "numero" = 1) THEN
    RAISE EXCEPTION 'BE: una receta nace con su versión 1 (DL-119)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "receta_con_version" AFTER INSERT ON "receta" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_receta_con_version"();

-- La versión de una receta: la primera es la 1 y cada una sucede a la anterior de la misma receta, de a uno.
CREATE FUNCTION "be_version_de_receta_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW."predecesora_id" IS NULL THEN
    IF NEW."numero" <> 1 THEN
      RAISE EXCEPTION 'BE: la primera versión de una receta es la 1 (DL-119)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  SELECT "numero" INTO v_numero FROM "version_de_receta" WHERE "id" = NEW."predecesora_id" AND "receta_id" = NEW."receta_id";
  IF v_numero IS NULL THEN
    RAISE EXCEPTION 'BE: en version_de_receta la predecesora tiene que ser del mismo objeto (REG-06-12)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> v_numero + 1 THEN
    RAISE EXCEPTION 'BE: la versión de una receta sucede a la anterior de a uno (DL-119)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_receta_insertar" BEFORE INSERT ON "version_de_receta" FOR EACH ROW EXECUTE FUNCTION "be_version_de_receta_insertar"();
CREATE UNIQUE INDEX "version_de_receta_una_raiz" ON "version_de_receta" ("receta_id") WHERE "predecesora_id" IS NULL;
ALTER TABLE "version_de_receta" ADD CONSTRAINT "version_de_receta_contenido_coherente" CHECK (
  "numero" >= 1 AND "porciones" >= 1 AND btrim("nombre") <> ''
  AND jsonb_typeof("ingredientes") = 'array' AND jsonb_array_length("ingredientes") >= 1 AND jsonb_typeof("pasos") = 'array'
);

-- ─── Imagen de una receta: cada cambio sigue al anterior y asocia un medio propio de referencia (DL-119) ────────────
ALTER TABLE "asociacion_de_imagen_de_receta" ADD CONSTRAINT "asociacion_de_imagen_coherente" CHECK ((("cambio" = 'ASOCIAR') = ("medio_id" IS NOT NULL)) AND "numero" >= 1);
CREATE FUNCTION "be_asociacion_de_imagen_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."numero" <> COALESCE((SELECT max("numero") FROM "asociacion_de_imagen_de_receta" WHERE "receta_id" = NEW."receta_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: cada cambio de la imagen de una receta sigue al anterior (DL-119)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."cambio" = 'ASOCIAR' AND NOT EXISTS (
       SELECT 1 FROM "medio" m JOIN "receta" r ON r."id" = NEW."receta_id"
        WHERE m."id" = NEW."medio_id" AND m."finalidad" = 'RECETA_REFERENCIA' AND m."estado" = 'DISPONIBLE' AND m."propietario_id" = r."profesional_id") THEN
    RAISE EXCEPTION 'BE: la imagen de una receta es un medio DISPONIBLE de su profesional, de finalidad RECETA_REFERENCIA (DL-119)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "asociacion_de_imagen_de_receta_insertar" BEFORE INSERT ON "asociacion_de_imagen_de_receta" FOR EACH ROW EXECUTE FUNCTION "be_asociacion_de_imagen_insertar"();

-- ─── Foto de una comida: un medio propio del titular, unido a una comida diferente; hasta tres (REG-06-133) ─────────
CREATE FUNCTION "be_evidencia_visual_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "medio" m JOIN "ingesta_nutricional" i ON i."id" = NEW."ingesta_id"
        WHERE m."id" = NEW."medio_id" AND m."finalidad" = 'EVIDENCIA_DE_INGESTA' AND m."estado" = 'DISPONIBLE'
          AND m."propietario_id" = i."asesorado_id" AND i."origen" = 'FUERA_DE_PRESCRIPCION') THEN
    RAISE EXCEPTION 'BE: la foto de una comida es un medio DISPONIBLE del titular, de finalidad EVIDENCIA_DE_INGESTA, en una comida diferente (REG-06-133)' USING ERRCODE = 'check_violation';
  END IF;
  IF (SELECT count(*) FROM "evidencia_visual_de_ingesta" WHERE "ingesta_id" = NEW."ingesta_id") >= 3 THEN
    RAISE EXCEPTION 'BE: una comida lleva hasta tres fotos (DL-121)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "evidencia_visual_de_ingesta_insertar" BEFORE INSERT ON "evidencia_visual_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_evidencia_visual_insertar"();

-- ─── Medio: PENDIENTE → DISPONIBLE → SUPRIMIDO; lo declarado y lo recibido no se reescriben (DL-120; 08 §21) ─────────
ALTER TABLE "medio" ADD CONSTRAINT "medio_estado_coherente" CHECK (
  ("estado" <> 'DISPONIBLE' OR ("tipo_original" IS NOT NULL AND "bytes_originales" IS NOT NULL AND "ancho_original" IS NOT NULL
     AND "alto_original" IS NOT NULL AND "sha256_original" IS NOT NULL AND "tipo_procesado" IS NOT NULL AND "bytes_procesados" IS NOT NULL
     AND "ancho_procesado" IS NOT NULL AND "alto_procesado" IS NOT NULL AND "sha256_procesado" IS NOT NULL AND "momento_de_subida" IS NOT NULL))
  AND (("estado" = 'SUPRIMIDO') = ("momento_de_supresion" IS NOT NULL))
  AND ("finalidad" <> 'EVIDENCIA_DE_INGESTA' OR "procedencia_de_imagen" = 'APORTADA_POR_LA_PERSONA')
  AND "bytes_declarados" > 0
);
CREATE FUNCTION "be_medio_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'PENDIENTE' OR NEW."momento_de_subida" IS NOT NULL OR NEW."sha256_original" IS NOT NULL OR NEW."sha256_procesado" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un medio nace PENDIENTE, sin bytes (DL-120)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un medio no se elimina: suprimirlo borra los bytes y deja el registro (08:451)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."propietario_id", NEW."finalidad", NEW."procedencia_de_imagen", NEW."autoria", NEW."tipo_declarado", NEW."bytes_declarados",
      NEW."procedencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."propietario_id", OLD."finalidad", OLD."procedencia_de_imagen", OLD."autoria", OLD."tipo_declarado", OLD."bytes_declarados",
      OLD."procedencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el medio conserva su propietario, su finalidad y lo declarado (DL-120)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD."estado" = 'PENDIENTE' AND NEW."estado" = 'DISPONIBLE' THEN
    RETURN NEW;
  END IF;
  IF OLD."estado" IN ('PENDIENTE', 'DISPONIBLE') AND NEW."estado" = 'SUPRIMIDO' THEN
    -- Suprimir no reescribe lo recibido ni lo guardado: marca el estado, el momento y el motivo.
    IF (NEW."tipo_original", NEW."bytes_originales", NEW."ancho_original", NEW."alto_original", NEW."sha256_original", NEW."tipo_procesado",
        NEW."bytes_procesados", NEW."ancho_procesado", NEW."alto_procesado", NEW."sha256_procesado", NEW."momento_de_subida")
       IS DISTINCT FROM (OLD."tipo_original", OLD."bytes_originales", OLD."ancho_original", OLD."alto_original", OLD."sha256_original", OLD."tipo_procesado",
        OLD."bytes_procesados", OLD."ancho_procesado", OLD."alto_procesado", OLD."sha256_procesado", OLD."momento_de_subida") THEN
      RAISE EXCEPTION 'BE: suprimir un medio no reescribe sus metadatos (08:451)' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en medio % -> % (DL-120)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "medio_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "medio" FOR EACH ROW EXECUTE FUNCTION "be_medio_guardar"();

-- Los bytes se guardan una vez, al subir un medio PENDIENTE; no se reescriben; se borran solo con el medio SUPRIMIDO.
CREATE FUNCTION "be_contenido_de_medio_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM "medio" WHERE "id" = NEW."medio_id" AND "estado" = 'PENDIENTE') THEN
      RAISE EXCEPTION 'BE: los bytes de un medio se guardan una vez, al subirlo (DL-120)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'BE: los bytes de un medio no se reescriben (DL-120)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "medio" WHERE "id" = OLD."medio_id" AND "estado" = 'SUPRIMIDO') THEN
    RAISE EXCEPTION 'BE: los bytes de un medio se borran solo al suprimirlo (08:451)' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER "contenido_de_medio_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "contenido_de_medio" FOR EACH ROW EXECUTE FUNCTION "be_contenido_de_medio_guardar"();

-- ─── Historia por adición: append-only y sin TRUNCATE ─────────────────────────────────────────────────────────────
CREATE TRIGGER "version_de_receta_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_receta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "asociacion_de_imagen_de_receta_solo_agregar" BEFORE UPDATE OR DELETE ON "asociacion_de_imagen_de_receta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evidencia_visual_de_ingesta_solo_agregar" BEFORE UPDATE OR DELETE ON "evidencia_visual_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "anulacion_de_ingesta_solo_agregar" BEFORE UPDATE OR DELETE ON "anulacion_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "rectificacion_de_cantidades_solo_agregar" BEFORE UPDATE OR DELETE ON "rectificacion_de_cantidades" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "receta_sin_truncate" BEFORE TRUNCATE ON "receta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_receta_sin_truncate" BEFORE TRUNCATE ON "version_de_receta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "medio_sin_truncate" BEFORE TRUNCATE ON "medio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "contenido_de_medio_sin_truncate" BEFORE TRUNCATE ON "contenido_de_medio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "asociacion_de_imagen_de_receta_sin_truncate" BEFORE TRUNCATE ON "asociacion_de_imagen_de_receta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evidencia_visual_de_ingesta_sin_truncate" BEFORE TRUNCATE ON "evidencia_visual_de_ingesta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "anulacion_de_ingesta_sin_truncate" BEFORE TRUNCATE ON "anulacion_de_ingesta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "rectificacion_de_cantidades_sin_truncate" BEFORE TRUNCATE ON "rectificacion_de_cantidades" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Catálogo de referencia: USDA FoodData Central · SR Legacy (DL-119) ──────────────────────────────────────────
-- Un elemento CONTROLLED_IMPORT de un profesional existe solo por la resolución de su candidato (WP-08). Los alimentos de
-- referencia de USDA son globales (sin profesional que los cargue) y los siembra esta migración con su fuente: la regla
-- suma esa excepción y nada más. Para un profesional, importar sigue exigiendo la resolución.
CREATE OR REPLACE FUNCTION "be_importado_con_resolucion"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."procedencia"::text = 'CONTROLLED_IMPORT' AND NEW."creado_por_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "resolucion_de_candidato"
    WHERE (TG_TABLE_NAME = 'elemento_de_catalogo_nutricional' AND "elemento_nutricional_id" = NEW."id")
       OR (TG_TABLE_NAME = 'ejercicio_de_catalogo' AND "ejercicio_id" = NEW."id")
  ) THEN
    RAISE EXCEPTION 'BE: un elemento importado existe solo por la resolución de su candidato' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$;

-- Los ocho alimentos de datos/alimentos_usda_100g.json del paquete BE_Nutricion_Demo_2026-10-05: el nombre en castellano,
-- la composición cada 100 g con la escritura decimal del paquete (energía de la fuente, carbohidratos «by difference» y
-- fibra) y la fuente: proveedor, FDC, licencia CC0-1.0 y la referencia del registro (conjunto, NDB, descripción original,
-- publicación y estado de preparación). UUID v5 deterministas sobre el FDC.
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('65bbfed9-71d1-5d61-9a23-9c89d0b92455', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('43a2da56-8a90-5cb5-b826-bc9cfc8aa1ae', '65bbfed9-71d1-5d61-9a23-9c89d0b92455', 'Arroz blanco de grano largo, cocido', '{"referenceAmount":"100g","energyKcal":130.0,"proteinG":2.69,"carbohydrateG":28.17,"fatG":0.28,"fiberG":0.4}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/168878","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"168878","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"20045","originalDescription":"Rice, white, long-grain, regular, enriched, cooked","publishedOn":"2019-04-01","preparationDescription":"cocido"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('ed2d76ab-1993-5258-9496-0527315cd530', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('593b7623-921e-5004-930d-247ee5f1ff99', 'ed2d76ab-1993-5258-9496-0527315cd530', 'Brócoli hervido y escurrido, sin sal', '{"referenceAmount":"100g","energyKcal":35.0,"proteinG":2.38,"carbohydrateG":7.18,"fatG":0.41,"fiberG":3.3}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/169967","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"169967","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"11091","originalDescription":"Broccoli, cooked, boiled, drained, without salt","publishedOn":"2019-04-01","preparationDescription":"cocido, hervido y escurrido"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c93180fb-82d8-53c4-a82d-e44c3c486504', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('62fd372c-2d9b-50ae-9796-f699826a14a4', 'c93180fb-82d8-53c4-a82d-e44c3c486504', 'Zanahoria hervida y escurrida, sin sal', '{"referenceAmount":"100g","energyKcal":35.0,"proteinG":0.76,"carbohydrateG":8.22,"fatG":0.18,"fiberG":3.0}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/170394","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"170394","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"11125","originalDescription":"Carrots, cooked, boiled, drained, without salt","publishedOn":"2019-04-01","preparationDescription":"cocida, hervida y escurrida"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('d61e4970-8d1e-503c-bf93-5ea236ce5223', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('7abbc416-26de-5ad6-afcc-0c38bc508ba9', 'd61e4970-8d1e-503c-bf93-5ea236ce5223', 'Papa hervida con piel, solo pulpa comestible, sin sal', '{"referenceAmount":"100g","energyKcal":87.0,"proteinG":1.87,"carbohydrateG":20.13,"fatG":0.1,"fiberG":1.8}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/170438","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"170438","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"11365","originalDescription":"Potatoes, boiled, cooked in skin, flesh, without salt","publishedOn":"2019-04-01","preparationDescription":"hervida con piel; pesada después de pelar"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('d527cfae-c081-5e95-ad20-8a0cad9ba70c', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('f5ee9a5e-c506-5fe1-9ec2-9a5e88468c27', 'd527cfae-c081-5e95-ad20-8a0cad9ba70c', 'Aceite de oliva', '{"referenceAmount":"100g","energyKcal":884.0,"proteinG":0.0,"carbohydrateG":0.0,"fatG":100.0,"fiberG":0.0}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/171413","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"171413","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"4053","originalDescription":"Oil, olive, salad or cooking","publishedOn":"2019-04-01","preparationDescription":"listo para usar; pesado en gramos"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('08066caa-6e08-5763-a943-5642212d8f83', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('2564890f-99f9-5198-bb1a-c5ffb5cae1f3', '08066caa-6e08-5763-a943-5642212d8f83', 'Pechuga de pollo sin piel, asada, parte comestible', '{"referenceAmount":"100g","energyKcal":165.0,"proteinG":31.02,"carbohydrateG":0.0,"fatG":3.57,"fiberG":0.0}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/171477","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"171477","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"5064","originalDescription":"Chicken, broilers or fryers, breast, meat only, cooked, roasted","publishedOn":"2019-04-01","preparationDescription":"cocido, asado, sin piel ni hueso"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('0a3c813e-a2f9-5a36-9155-f86166b96085', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('0c3dfed4-03e5-5f1d-99da-7955d96bad98', '0a3c813e-a2f9-5a36-9155-f86166b96085', 'Lentejas hervidas sin sal', '{"referenceAmount":"100g","energyKcal":116.0,"proteinG":9.02,"carbohydrateG":20.13,"fatG":0.38,"fiberG":7.9}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/172421","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"172421","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"16070","originalDescription":"Lentils, mature seeds, cooked, boiled, without salt","publishedOn":"2019-04-01","preparationDescription":"cocidas, parte comestible sin líquido sobrante"}}}', '2026-10-05T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('1df55f96-f436-53f2-9a2e-3803fb87bece', 'CONTROLLED_IMPORT', '2026-10-05T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro") VALUES ('518226dd-3641-5d4e-85ec-127dc019e0f9', '1df55f96-f436-53f2-9a2e-3803fb87bece', 'Salmón atlántico de cultivo, cocido por calor seco', '{"referenceAmount":"100g","energyKcal":206.0,"proteinG":22.1,"carbohydrateG":0.0,"fatG":12.35,"fiberG":0.0}', 'DISPONIBLE', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-NUTRICION-RECETAS · DL-119","recurso":"https://api.nal.usda.gov/fdc/v1/food/175168","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"175168","receivedAt":"2026-10-05T00:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"15237","originalDescription":"Fish, salmon, Atlantic, farmed, cooked, dry heat","publishedOn":"2019-04-01","preparationDescription":"cocido al horno, parte comestible sin espinas"}}}', '2026-10-05T00:00:00.000Z');
