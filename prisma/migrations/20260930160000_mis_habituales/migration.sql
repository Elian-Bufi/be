-- DL-109 · Mis habituales del profesional: ejercicios y alimentos marcados como habituales, y sesiones y comidas habituales
-- (bloques de entrada sin identificadores de nodo, sin cargas ni cantidades salvo pedido), con sus eventos. Filas mutables,
-- sin disparadores de solo-agregar (la historia queda en los eventos). SQL derivado del schema con prisma migrate diff.

-- CreateEnum
CREATE TYPE "EstadoDeHabitual" AS ENUM ('ACTIVO', 'QUITADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'EjercicioHabitualMarcado';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'EjercicioHabitualQuitado';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'SesionHabitualGuardada';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE 'SesionHabitualEditada';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'AlimentoHabitualMarcado';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'AlimentoHabitualQuitado';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'ComidaHabitualGuardada';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE 'ComidaHabitualEditada';

-- CreateTable
CREATE TABLE "ejercicio_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "ejercicio_id" UUID NOT NULL,
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejercicio_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesion_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "estructura" JSONB NOT NULL,
    "cargas" "CargasDePlantilla" NOT NULL DEFAULT 'NO_COPIADAS',
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesion_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alimento_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "elemento_id" UUID NOT NULL,
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alimento_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comida_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "estructura" JSONB NOT NULL,
    "cantidades" "CantidadesDePlantilla" NOT NULL DEFAULT 'NO_COPIADAS',
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comida_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ejercicio_habitual_profesional_id_estado_idx" ON "ejercicio_habitual"("profesional_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "ejercicio_habitual_profesional_id_ejercicio_id_key" ON "ejercicio_habitual"("profesional_id", "ejercicio_id");

-- CreateIndex
CREATE INDEX "sesion_habitual_profesional_id_estado_momento_de_actualizac_idx" ON "sesion_habitual"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_habitual_profesional_id_nombre_normalizado_key" ON "sesion_habitual"("profesional_id", "nombre_normalizado");

-- CreateIndex
CREATE INDEX "alimento_habitual_profesional_id_estado_idx" ON "alimento_habitual"("profesional_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "alimento_habitual_profesional_id_elemento_id_key" ON "alimento_habitual"("profesional_id", "elemento_id");

-- CreateIndex
CREATE INDEX "comida_habitual_profesional_id_estado_momento_de_actualizac_idx" ON "comida_habitual"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "comida_habitual_profesional_id_nombre_normalizado_key" ON "comida_habitual"("profesional_id", "nombre_normalizado");

-- AddForeignKey
ALTER TABLE "ejercicio_habitual" ADD CONSTRAINT "ejercicio_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejercicio_habitual" ADD CONSTRAINT "ejercicio_habitual_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "sesion_habitual" ADD CONSTRAINT "sesion_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "alimento_habitual" ADD CONSTRAINT "alimento_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "alimento_habitual" ADD CONSTRAINT "alimento_habitual_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "comida_habitual" ADD CONSTRAINT "comida_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

