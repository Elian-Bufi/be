-- PF-02 · DL-102 (docs/propuestas/PF-01-02_contexto-de-entrenamiento.md): una evaluación de entrenamiento cita respuestas
-- de formulario como evidencia, por referencia y no por copia (la declaración de la persona no se vuelve observación del
-- profesional). La cita fija la versión vigente al citar (la respuesta original o una rectificación); ver abajo por qué
-- esa vigencia la controla la API y no la base.

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

-- CreateIndex · una misma respuesta y campo se cita una sola vez por evaluación
CREATE UNIQUE INDEX "cita_de_respuesta_en_evaluacion_respuesta_y_campo_unicos" ON "cita_de_respuesta_en_evaluacion_de_entrenamiento"("evaluacion_id", "respuesta_id", "codigo_de_campo");

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

-- La base repite las reglas de pertenencia que valida la API (apps/api/src/entrenamiento/citas-de-respuestas.ts), como el
-- objetivo de entrenamiento exige las dos partes de su evaluación:
-- - la respuesta citada es del mismo asesorado que la evaluación y responde a una Solicitud del mismo profesional, de
--   alcance ENTRENAMIENTO. Es la condición con la que FRM-05 deja leerla, y la que hace que leer la evaluación equivalga a
--   leer lo citado;
-- - la rectificación citada es de esa misma respuesta;
-- - las citas nacen con su evaluación, en la misma transacción: después no se le agregan (`xmin`, como be_transicion_con_hecho).
-- Lo que la base NO exige es que la versión citada sea la vigente ni que el campo esté respondido. Los valida la API en la
-- lectura de la transacción. Exigirlo acá haría fallar una escritura válida si una rectificación concurrente se confirma
-- antes del commit; en ese caso, la cita nace con `laterVersionExists` y la lectura ya lo avisa.
CREATE FUNCTION "be_cita_de_respuesta_en_evaluacion_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "respuesta_de_formulario" r
         JOIN "solicitud_de_formulario" s ON s."id" = r."solicitud_id"
         JOIN "evaluacion_de_entrenamiento" e ON e."asesorado_id" = r."asesorado_id" AND e."profesional_id" = s."profesional_id"
        WHERE r."id" = NEW."respuesta_id" AND e."id" = NEW."evaluacion_id" AND s."alcance" = 'ENTRENAMIENTO') THEN
    RAISE EXCEPTION 'BE: la respuesta citada es del mismo asesorado que la evaluación, a una Solicitud del mismo profesional y de alcance ENTRENAMIENTO (DL-102)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."rectificacion_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."rectificacion_id" AND "respuesta_id" = NEW."respuesta_id") THEN
    RAISE EXCEPTION 'BE: la rectificación citada es de la misma respuesta (DL-102)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "evaluacion_de_entrenamiento" WHERE "id" = NEW."evaluacion_id" AND "xmin" = pg_current_xact_id()::xid) THEN
    RAISE EXCEPTION 'BE: las citas se registran junto con su evaluación, en la misma transacción (DL-102)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_insertar" BEFORE INSERT ON "cita_de_respuesta_en_evaluacion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_cita_de_respuesta_en_evaluacion_insertar"();
