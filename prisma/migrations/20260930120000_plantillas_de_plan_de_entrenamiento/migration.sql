-- PF-09 · DL-108 (docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md): plantillas de plan de entrenamiento del
-- profesional. Una plantilla es un molde propio, sin asesorado: guarda una estructura de plan (la misma forma que valida
-- la API al crear un plan) en versiones inmutables. Aplicarla crea un borrador de plan como cualquier otro, que registra
-- de qué plantilla y versión salió (`origen_de_plantilla`). Nada del asesorado entra en la plantilla.

-- CreateEnum
CREATE TYPE "EstadoDePlantilla" AS ENUM ('ACTIVA', 'ARCHIVADA');

-- CreateEnum
CREATE TYPE "CargasDePlantilla" AS ENUM ('NO_COPIADAS', 'COPIADAS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'PlantillaDePlanCreada';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'PlantillaDePlanVersionada';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'PlantillaDePlanEditada';

-- AlterTable
ALTER TABLE "version_de_plan_de_entrenamiento" ADD COLUMN     "origen_de_plantilla" JSONB;

-- CreateTable
CREATE TABLE "plantilla_de_plan_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoDePlantilla" NOT NULL DEFAULT 'ACTIVA',
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_de_plan_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_plantilla_de_plan_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plantilla_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "estructura" JSONB NOT NULL,
    "cargas" "CargasDePlantilla" NOT NULL DEFAULT 'NO_COPIADAS',
    "origen" JSONB,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_plantilla_de_plan_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plantilla_de_plan_de_entrenamiento_profesional_id_estado_mo_idx" ON "plantilla_de_plan_de_entrenamiento"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_de_plan_de_entrenamiento_profesional_id_nombre_no_key" ON "plantilla_de_plan_de_entrenamiento"("profesional_id", "nombre_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_plantilla_de_plan_de_entrenamiento_plantilla_id__key" ON "version_de_plantilla_de_plan_de_entrenamiento"("plantilla_id", "numero");

-- AddForeignKey
ALTER TABLE "plantilla_de_plan_de_entrenamiento" ADD CONSTRAINT "plantilla_de_plan_de_entrenamiento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plantilla_de_plan_de_entrenamiento_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plantilla_de_plan_de_entrenamiento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Historia por adición: una versión de plantilla no se edita, no se borra y no se trunca (06 §4.4) ────────────
CREATE TRIGGER "version_de_plantilla_de_plan_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_plantilla_de_plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plantilla_de_plan_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "version_de_plantilla_de_plan_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
