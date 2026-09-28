-- PF-02 · DL-102 (docs/propuestas/PF-01-02_contexto-de-entrenamiento.md): una evaluación de entrenamiento cita respuestas
-- de formulario como evidencia, por referencia y no por copia (la declaración de la persona no se vuelve observación del
-- profesional). La cita fija la versión vigente al citar: la respuesta original o una rectificación.

-- CreateTable
CREATE TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluacion_id" UUID NOT NULL,
    "respuesta_id" UUID NOT NULL,
    "rectificacion_id" UUID,
    "codigo_de_campo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cita_de_respuesta_en_evaluacion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cita_de_respuesta_en_evaluacion_de_entrenamiento_respuesta__idx" ON "cita_de_respuesta_en_evaluacion_de_entrenamiento"("respuesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "cita_de_respuesta_en_evaluacion_de_entrenamiento_evaluacion_key" ON "cita_de_respuesta_en_evaluacion_de_entrenamiento"("evaluacion_id", "orden");

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_de_entrenamiento_evaluacio_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_de_entrenamiento_respuesta_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_de_entrenamiento_rectifica_fkey" FOREIGN KEY ("rectificacion_id") REFERENCES "rectificacion_de_respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Historia por adición: una cita no se edita, no se borra y no se trunca (06 §4.4) ────────────────
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "cita_de_respuesta_en_evaluacion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "cita_de_respuesta_en_evaluacion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Coherencia ───────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_con_campo" CHECK (btrim("codigo_de_campo") <> '');
ALTER TABLE "cita_de_respuesta_en_evaluacion_de_entrenamiento" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_orden_valido" CHECK ("orden" >= 0);

-- La respuesta citada es del mismo asesorado que la evaluación, y la rectificación citada es de esa misma respuesta.
-- El resto (Solicitud del mismo profesional, alcance ENTRENAMIENTO, campo respondido) lo valida la API antes de escribir.
CREATE FUNCTION "be_cita_de_respuesta_en_evaluacion_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "respuesta_de_formulario" r JOIN "evaluacion_de_entrenamiento" e ON e."asesorado_id" = r."asesorado_id"
        WHERE r."id" = NEW."respuesta_id" AND e."id" = NEW."evaluacion_id") THEN
    RAISE EXCEPTION 'BE: la respuesta citada es del mismo asesorado que la evaluación (DL-102)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."rectificacion_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."rectificacion_id" AND "respuesta_id" = NEW."respuesta_id") THEN
    RAISE EXCEPTION 'BE: la rectificación citada es de la misma respuesta (DL-102)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_insertar" BEFORE INSERT ON "cita_de_respuesta_en_evaluacion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_cita_de_respuesta_en_evaluacion_insertar"();
