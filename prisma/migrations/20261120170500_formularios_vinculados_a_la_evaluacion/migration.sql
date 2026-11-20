-- WP-EVALUACION-Y-FORMULARIOS · DL-185: los formularios que la persona respondió, vinculados enteros a la evaluación inicial
-- de Nutrición o de Entrenamiento, por referencia y no por copia (la respuesta y la versión vigente al vincular). Solo
-- agrega: una tabla, sus índices, sus guardias y sus triggers. No toca ninguna tabla existente. Escrita con
-- `prisma migrate diff` (la tabla, los índices y las claves foráneas) más las guardias que Prisma no modela.

-- CreateTable
CREATE TABLE "vinculo_de_formulario_en_evaluacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alcance" "Alcance" NOT NULL,
    "evaluacion_nutricional_id" UUID,
    "evaluacion_de_entrenamiento_id" UUID,
    "respuesta_id" UUID NOT NULL,
    "rectificacion_id" UUID,
    "vinculado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desvinculado_en" TIMESTAMPTZ(3),

    CONSTRAINT "vinculo_de_formulario_en_evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vinculo_de_formulario_en_evaluacion_evaluacion_nutricional__idx" ON "vinculo_de_formulario_en_evaluacion"("evaluacion_nutricional_id", "vinculado_en");

-- CreateIndex
CREATE INDEX "vinculo_de_formulario_en_evaluacion_evaluacion_de_entrenami_idx" ON "vinculo_de_formulario_en_evaluacion"("evaluacion_de_entrenamiento_id", "vinculado_en");

-- CreateIndex
CREATE INDEX "vinculo_de_formulario_en_evaluacion_respuesta_id_idx" ON "vinculo_de_formulario_en_evaluacion"("respuesta_id");

-- CreateIndex
CREATE INDEX "vinculo_de_formulario_en_evaluacion_rectificacion_id_idx" ON "vinculo_de_formulario_en_evaluacion"("rectificacion_id");

-- AddForeignKey
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_en_evaluacion_evaluacion_nutricional_fkey" FOREIGN KEY ("evaluacion_nutricional_id") REFERENCES "evaluacion_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_en_evaluacion_evaluacion_de_entrenam_fkey" FOREIGN KEY ("evaluacion_de_entrenamiento_id") REFERENCES "evaluacion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_en_evaluacion_respuesta_id_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_en_evaluacion_rectificacion_id_fkey" FOREIGN KEY ("rectificacion_id") REFERENCES "rectificacion_de_respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Coherencia ───────────────────────────────────────────────────────────────────────────────────
-- El Alcance dice cuál de las dos evaluaciones lleva, y solo esa.
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_una_evaluacion_del_alcance" CHECK (
  ("alcance" = 'NUTRICION' AND "evaluacion_nutricional_id" IS NOT NULL AND "evaluacion_de_entrenamiento_id" IS NULL)
  OR ("alcance" = 'ENTRENAMIENTO' AND "evaluacion_de_entrenamiento_id" IS NOT NULL AND "evaluacion_nutricional_id" IS NULL));
ALTER TABLE "vinculo_de_formulario_en_evaluacion" ADD CONSTRAINT "vinculo_de_formulario_desvinculado_despues" CHECK ("desvinculado_en" IS NULL OR "desvinculado_en" >= "vinculado_en");

-- CreateIndex · un solo vínculo vigente por evaluación y respuesta (Prisma no modela índices parciales)
CREATE UNIQUE INDEX "vinculo_de_formulario_nutricional_vigente" ON "vinculo_de_formulario_en_evaluacion" ("evaluacion_nutricional_id", "respuesta_id") WHERE "desvinculado_en" IS NULL AND "evaluacion_nutricional_id" IS NOT NULL;
CREATE UNIQUE INDEX "vinculo_de_formulario_de_entrenamiento_vigente" ON "vinculo_de_formulario_en_evaluacion" ("evaluacion_de_entrenamiento_id", "respuesta_id") WHERE "desvinculado_en" IS NULL AND "evaluacion_de_entrenamiento_id" IS NOT NULL;

-- ─── Pertenencia ──────────────────────────────────────────────────────────────────────────────────
-- La base repite lo que valida la API (apps/api/src/evaluacion-y-formularios/evaluacion-y-formularios.service.ts): la
-- respuesta es de la misma persona que la evaluación y responde a una Solicitud del mismo profesional, del Alcance de la
-- evaluación; la rectificación es de esa respuesta; y nace vigente. Como en DL-102, la base no exige que la versión sea la
-- vigente: lo controla la API en la lectura de su transacción.
CREATE FUNCTION "be_vinculo_de_formulario_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."desvinculado_en" IS NOT NULL THEN
    RAISE EXCEPTION 'BE: un vínculo de formulario nace vigente (DL-185)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."alcance" = 'NUTRICION' AND NOT EXISTS (
       SELECT 1 FROM "respuesta_de_formulario" r
         JOIN "solicitud_de_formulario" s ON s."id" = r."solicitud_id"
         JOIN "evaluacion_nutricional" e ON e."asesorado_id" = r."asesorado_id" AND e."profesional_id" = s."profesional_id"
        WHERE r."id" = NEW."respuesta_id" AND e."id" = NEW."evaluacion_nutricional_id" AND s."alcance" = 'NUTRICION') THEN
    RAISE EXCEPTION 'BE: el formulario vinculado es de la misma persona que la evaluación, a una Solicitud del mismo profesional y de alcance NUTRICION (DL-185)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."alcance" = 'ENTRENAMIENTO' AND NOT EXISTS (
       SELECT 1 FROM "respuesta_de_formulario" r
         JOIN "solicitud_de_formulario" s ON s."id" = r."solicitud_id"
         JOIN "evaluacion_de_entrenamiento" e ON e."asesorado_id" = r."asesorado_id" AND e."profesional_id" = s."profesional_id"
        WHERE r."id" = NEW."respuesta_id" AND e."id" = NEW."evaluacion_de_entrenamiento_id" AND s."alcance" = 'ENTRENAMIENTO') THEN
    RAISE EXCEPTION 'BE: el formulario vinculado es de la misma persona que la evaluación, a una Solicitud del mismo profesional y de alcance ENTRENAMIENTO (DL-185)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."rectificacion_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."rectificacion_id" AND "respuesta_id" = NEW."respuesta_id") THEN
    RAISE EXCEPTION 'BE: la rectificación vinculada es de la misma respuesta (DL-185)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "vinculo_de_formulario_en_evaluacion_insertar" BEFORE INSERT ON "vinculo_de_formulario_en_evaluacion" FOR EACH ROW EXECUTE FUNCTION "be_vinculo_de_formulario_insertar"();

-- ─── Historia por adición (06 §4.4) ───────────────────────────────────────────────────────────────
-- Desvincular es la única escritura después del alta: `desvinculado_en` pasa de NULL a una fecha, una sola vez. Nada más
-- cambia, y la fila no se borra ni se trunca.
CREATE FUNCTION "be_vinculo_de_formulario_actualizar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."desvinculado_en" IS NOT NULL OR NEW."desvinculado_en" IS NULL
     OR NEW."id" IS DISTINCT FROM OLD."id" OR NEW."alcance" IS DISTINCT FROM OLD."alcance"
     OR NEW."evaluacion_nutricional_id" IS DISTINCT FROM OLD."evaluacion_nutricional_id"
     OR NEW."evaluacion_de_entrenamiento_id" IS DISTINCT FROM OLD."evaluacion_de_entrenamiento_id"
     OR NEW."respuesta_id" IS DISTINCT FROM OLD."respuesta_id" OR NEW."rectificacion_id" IS DISTINCT FROM OLD."rectificacion_id"
     OR NEW."vinculado_en" IS DISTINCT FROM OLD."vinculado_en" THEN
    RAISE EXCEPTION 'BE: un vínculo de formulario solo se desvincula, una vez; lo demás no cambia (DL-185, append-only)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "vinculo_de_formulario_en_evaluacion_actualizar" BEFORE UPDATE ON "vinculo_de_formulario_en_evaluacion" FOR EACH ROW EXECUTE FUNCTION "be_vinculo_de_formulario_actualizar"();
CREATE TRIGGER "vinculo_de_formulario_en_evaluacion_sin_borrar" BEFORE DELETE ON "vinculo_de_formulario_en_evaluacion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "vinculo_de_formulario_en_evaluacion_sin_truncate" BEFORE TRUNCATE ON "vinculo_de_formulario_en_evaluacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
