-- WP-CONTEXTO-DE-LA-PERSONA · DL-179: la evaluación de Nutrición cita respuestas de formulario como evidencia, con las mismas
-- reglas que la de Entrenamiento (DL-102, migración 20260928010000): por referencia y no por copia, con la versión vigente al
-- citar. Solo agrega: una tabla, sus índices, sus guardias y su trigger de pertenencia. No toca ninguna tabla existente.

-- CreateTable
CREATE TABLE "cita_de_respuesta_en_evaluacion_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluacion_id" UUID NOT NULL,
    "respuesta_id" UUID NOT NULL,
    "rectificacion_id" UUID,
    "codigo_de_campo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cita_de_respuesta_en_evaluacion_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cita_de_respuesta_en_evaluacion_nutricional_respuesta_id_idx" ON "cita_de_respuesta_en_evaluacion_nutricional"("respuesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "cita_de_respuesta_en_evaluacion_nutricional_evaluacion_id_o_key" ON "cita_de_respuesta_en_evaluacion_nutricional"("evaluacion_id", "orden");

-- CreateIndex · una misma respuesta y campo se cita una sola vez por evaluación
CREATE UNIQUE INDEX "cita_nutricional_respuesta_y_campo_unicos" ON "cita_de_respuesta_en_evaluacion_nutricional"("evaluacion_id", "respuesta_id", "codigo_de_campo");

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_nutricional" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_nutricional_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_nutricional" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_nutricional_respuesta_id_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cita_de_respuesta_en_evaluacion_nutricional" ADD CONSTRAINT "cita_de_respuesta_en_evaluacion_nutricional_rectificacion_fkey" FOREIGN KEY ("rectificacion_id") REFERENCES "rectificacion_de_respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── Historia por adición: una cita no se edita, no se borra y no se trunca (06 §4.4) ────────────────
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "cita_de_respuesta_en_evaluacion_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_nutricional_sin_truncate" BEFORE TRUNCATE ON "cita_de_respuesta_en_evaluacion_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Coherencia ───────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "cita_de_respuesta_en_evaluacion_nutricional" ADD CONSTRAINT "cita_nutricional_con_campo" CHECK (btrim("codigo_de_campo") <> '');
ALTER TABLE "cita_de_respuesta_en_evaluacion_nutricional" ADD CONSTRAINT "cita_nutricional_orden_valido" CHECK ("orden" >= 0);

-- La base repite las reglas de pertenencia que valida la API (apps/api/src/entrenamiento/citas-de-respuestas.ts, con el área
-- NUTRICION): la respuesta es de la misma persona que la evaluación y responde a una Solicitud del mismo profesional, de
-- alcance NUTRICION; la rectificación es de esa respuesta; y las citas nacen con su evaluación, en la misma transacción.
-- Como en DL-102, la base no exige que la versión citada sea la vigente: lo controla la API en la lectura de la transacción.
CREATE FUNCTION "be_cita_nutricional_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "respuesta_de_formulario" r
         JOIN "solicitud_de_formulario" s ON s."id" = r."solicitud_id"
         JOIN "evaluacion_nutricional" e ON e."asesorado_id" = r."asesorado_id" AND e."profesional_id" = s."profesional_id"
        WHERE r."id" = NEW."respuesta_id" AND e."id" = NEW."evaluacion_id" AND s."alcance" = 'NUTRICION') THEN
    RAISE EXCEPTION 'BE: la respuesta citada es de la misma persona que la evaluación, a una Solicitud del mismo profesional y de alcance NUTRICION (DL-179)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."rectificacion_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."rectificacion_id" AND "respuesta_id" = NEW."respuesta_id") THEN
    RAISE EXCEPTION 'BE: la rectificación citada es de la misma respuesta (DL-179)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "evaluacion_nutricional" WHERE "id" = NEW."evaluacion_id" AND "xmin" = pg_current_xact_id()::xid) THEN
    RAISE EXCEPTION 'BE: las citas se registran junto con su evaluación, en la misma transacción (DL-179)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cita_de_respuesta_en_evaluacion_nutricional_insertar" BEFORE INSERT ON "cita_de_respuesta_en_evaluacion_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_cita_nutricional_insertar"();
