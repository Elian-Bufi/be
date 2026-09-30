-- PF-09 · DL-108: plantillas de plan de comidas del profesional, el mismo molde que las de entrenamiento (migración
-- anterior): estructura de entrada de API-NUT-07 en versiones inmutables, sin cantidades salvo pedido (D-2), sin nada de
-- una persona (D-5); el borrador que nace de una plantilla registra su origen. SQL derivado del schema con prisma migrate diff.

-- CreateEnum
CREATE TYPE "CantidadesDePlantilla" AS ENUM ('NO_COPIADAS', 'COPIADAS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'PlantillaDePlanCreada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'PlantillaDePlanVersionada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'PlantillaDePlanEditada';

-- AlterTable
ALTER TABLE "version_de_plan_nutricional" ADD COLUMN     "origen_de_plantilla" JSONB;

-- CreateTable
CREATE TABLE "plantilla_de_plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoDePlantilla" NOT NULL DEFAULT 'ACTIVA',
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_de_plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_plantilla_de_plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plantilla_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "estructura" JSONB NOT NULL,
    "cantidades" "CantidadesDePlantilla" NOT NULL DEFAULT 'NO_COPIADAS',
    "origen" JSONB,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_plantilla_de_plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plantilla_de_plan_nutricional_profesional_id_estado_momento_idx" ON "plantilla_de_plan_nutricional"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_de_plan_nutricional_profesional_id_nombre_normali_key" ON "plantilla_de_plan_nutricional"("profesional_id", "nombre_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_plantilla_de_plan_nutricional_plantilla_id_numer_key" ON "version_de_plantilla_de_plan_nutricional"("plantilla_id", "numero");

-- AddForeignKey
ALTER TABLE "plantilla_de_plan_nutricional" ADD CONSTRAINT "plantilla_de_plan_nutricional_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_plan_nutricional" ADD CONSTRAINT "version_de_plantilla_de_plan_nutricional_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_plan_nutricional" ADD CONSTRAINT "version_de_plantilla_de_plan_nutricional_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Historia por adición: una versión de plantilla no se edita, no se borra y no se trunca (06 §4.4) ────────────
CREATE TRIGGER "version_de_plantilla_de_plan_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_plantilla_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plantilla_de_plan_nutricional_sin_truncate" BEFORE TRUNCATE ON "version_de_plantilla_de_plan_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
