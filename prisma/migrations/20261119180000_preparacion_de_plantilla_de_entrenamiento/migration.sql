-- WP-PLANTILLAS-DE-ENTRENAMIENTO · DL-182: la preparación de una plantilla de entrenamiento, sin persona. El trabajo en
-- curso del profesional se autoguarda en esta tabla sin tocar ninguna versión; guardarlo crea la plantilla o una versión
-- nueva (inmutable, como siempre) y borra la fila. Solo agrega: una tabla, sus índices y sus claves foráneas. No toca
-- ninguna tabla existente. Escrita con `prisma migrate diff` desde el schema anterior.

-- CreateTable
CREATE TABLE "preparacion_de_plantilla_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "plantilla_id" UUID,
    "version_base_id" UUID,
    "nombre" TEXT,
    "descripcion" TEXT,
    "estructura" JSONB NOT NULL,
    "cargas" "CargasDePlantilla" NOT NULL DEFAULT 'NO_COPIADAS',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preparacion_de_plantilla_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "preparacion_de_plantilla_de_entrenamiento_plantilla_id_key" ON "preparacion_de_plantilla_de_entrenamiento"("plantilla_id");

-- CreateIndex
CREATE INDEX "preparacion_de_plantilla_de_entrenamiento_profesional_id_mo_idx" ON "preparacion_de_plantilla_de_entrenamiento"("profesional_id", "momento_de_actualizacion");

-- AddForeignKey
ALTER TABLE "preparacion_de_plantilla_de_entrenamiento" ADD CONSTRAINT "preparacion_de_plantilla_de_entrenamiento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "preparacion_de_plantilla_de_entrenamiento" ADD CONSTRAINT "preparacion_de_plantilla_de_entrenamiento_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "preparacion_de_plantilla_de_entrenamiento" ADD CONSTRAINT "preparacion_de_plantilla_de_entrenamiento_version_base_id_fkey" FOREIGN KEY ("version_base_id") REFERENCES "version_de_plantilla_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

