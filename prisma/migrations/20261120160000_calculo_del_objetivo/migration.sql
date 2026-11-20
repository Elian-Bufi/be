-- DL-186 (WP-OBJETIVO-Y-CALCULADOR): la referencia y el cálculo con los que el profesional escribió una versión del
-- objetivo nutricional. Solo agrega: una tabla nueva, sus índices y sus claves. Append-only como la versión del objetivo.
-- CreateTable
CREATE TABLE "calculo_del_objetivo_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_de_objetivo_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "evaluacion_antropometrica_id" UUID,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculo_del_objetivo_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calculo_del_objetivo_nutricional_version_de_objetivo_id_key" ON "calculo_del_objetivo_nutricional"("version_de_objetivo_id");

-- CreateIndex
CREATE INDEX "calculo_del_objetivo_nutricional_profesional_id_asesorado_i_idx" ON "calculo_del_objetivo_nutricional"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE INDEX "calculo_del_objetivo_nutricional_evaluacion_antropometrica__idx" ON "calculo_del_objetivo_nutricional"("evaluacion_antropometrica_id");

-- AddForeignKey
ALTER TABLE "calculo_del_objetivo_nutricional" ADD CONSTRAINT "calculo_del_objetivo_nutricional_version_de_objetivo_id_fkey" FOREIGN KEY ("version_de_objetivo_id") REFERENCES "version_de_objetivo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "calculo_del_objetivo_nutricional" ADD CONSTRAINT "calculo_del_objetivo_nutricional_evaluacion_antropometrica_fkey" FOREIGN KEY ("evaluacion_antropometrica_id") REFERENCES "evaluacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Historia por adición (08 §29): ni se corrige ni se borra, tampoco por TRUNCATE.
CREATE TRIGGER "calculo_del_objetivo_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "calculo_del_objetivo_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "calculo_del_objetivo_nutricional_sin_truncate" BEFORE TRUNCATE ON "calculo_del_objetivo_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
