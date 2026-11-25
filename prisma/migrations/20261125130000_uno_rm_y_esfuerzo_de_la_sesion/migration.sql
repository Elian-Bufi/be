-- DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2; docs/paquetes/WP-EDITOR-ENTRENAMIENTO-TANDA-2.md). Migración aditiva: un tipo,
-- dos tablas y dos columnas nuevas, nulas; nada de lo anterior cambia.
-- - `uno_rm_de_referencia` (ET2-01 a ET2-04): el 1RM de referencia de una persona en un ejercicio, con su origen
--   (calibración, registro elegido o declarado), su fecha y su autor. De solo agregar: el que usa BE es el más reciente.
-- - `esfuerzo_de_sesion_de_entrenamiento` (ET2-07 a ET2-09): el esfuerzo de la sesión (Foster, de 0 a 10) que la persona
--   respondió al terminar, uno por sesión registrada. De solo agregar: la ejecución registrada no cambia.
-- - `planificacion` en las versiones y en las preparaciones de las plantillas de Entrenamiento (ET2-10): semanas,
--   aproximaciones, progresiones, intensidad y esfuerzo de la sesión, sin nada de una persona. Nula en las de antes.


-- CreateEnum
CREATE TYPE "OrigenDelUnoRM" AS ENUM ('CALIBRATION', 'RECORD', 'DECLARED');

-- AlterTable
ALTER TABLE "version_de_plantilla_de_plan_de_entrenamiento" ADD COLUMN     "planificacion" JSONB;

-- AlterTable
ALTER TABLE "preparacion_de_plantilla_de_entrenamiento" ADD COLUMN     "planificacion" JSONB;

-- CreateTable
CREATE TABLE "uno_rm_de_referencia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "ejercicio_id" UUID NOT NULL,
    "origen" "OrigenDelUnoRM" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "fecha_local" DATE NOT NULL,
    "serie" JSONB,
    "metodo" JSONB,
    "banda" TEXT,
    "registro" JSONB,
    "nota" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uno_rm_de_referencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esfuerzo_de_sesion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejecucion_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "valor" INTEGER NOT NULL,
    "minutos" INTEGER,
    "origen_de_minutos" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "esfuerzo_de_sesion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uno_rm_de_referencia_asesorado_id_profesional_id_ejercicio__idx" ON "uno_rm_de_referencia"("asesorado_id", "profesional_id", "ejercicio_id", "fecha_local");

-- CreateIndex
CREATE UNIQUE INDEX "esfuerzo_de_sesion_de_entrenamiento_ejecucion_id_key" ON "esfuerzo_de_sesion_de_entrenamiento"("ejecucion_id");

-- CreateIndex
CREATE INDEX "esfuerzo_de_sesion_de_entrenamiento_asesorado_id_idx" ON "esfuerzo_de_sesion_de_entrenamiento"("asesorado_id");

-- AddForeignKey
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "esfuerzo_de_sesion_de_entrenamiento" ADD CONSTRAINT "esfuerzo_de_sesion_de_entrenamiento_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "esfuerzo_de_sesion_de_entrenamiento" ADD CONSTRAINT "esfuerzo_de_sesion_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Lo que la base garantiza aunque el código se equivoque.
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_valor" CHECK ("valor" > 0 AND "valor" <= 1000);
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_unidad" CHECK ("unidad" IN ('kg', 'lb'));
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_banda" CHECK ("banda" IS NULL OR "banda" IN ('CORE', 'ORIENTATIVE'));
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_origen_y_serie" CHECK (("origen" = 'DECLARED') = ("serie" IS NULL));
ALTER TABLE "uno_rm_de_referencia" ADD CONSTRAINT "uno_rm_de_referencia_registro" CHECK (("origen" = 'RECORD') = ("registro" IS NOT NULL));
ALTER TABLE "esfuerzo_de_sesion_de_entrenamiento" ADD CONSTRAINT "esfuerzo_de_sesion_valor" CHECK ("valor" BETWEEN 0 AND 10);
ALTER TABLE "esfuerzo_de_sesion_de_entrenamiento" ADD CONSTRAINT "esfuerzo_de_sesion_minutos" CHECK (("minutos" IS NULL) = ("origen_de_minutos" IS NULL) AND ("minutos" IS NULL OR "minutos" BETWEEN 1 AND 600) AND ("origen_de_minutos" IS NULL OR "origen_de_minutos" IN ('TIMER', 'DECLARED')));

-- De solo agregar: ni UPDATE, ni DELETE, ni TRUNCATE.
CREATE TRIGGER "uno_rm_de_referencia_solo_agregar" BEFORE UPDATE OR DELETE ON "uno_rm_de_referencia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "uno_rm_de_referencia_sin_truncate" BEFORE TRUNCATE ON "uno_rm_de_referencia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "esfuerzo_de_sesion_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "esfuerzo_de_sesion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "esfuerzo_de_sesion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "esfuerzo_de_sesion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
