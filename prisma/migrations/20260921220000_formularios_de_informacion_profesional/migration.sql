-- CreateEnum
CREATE TYPE "TipoDeEventoDeFormulario" AS ENUM ('SolicitudDeFormularioCreada', 'RespuestaDeFormularioRegistrada', 'RespuestaDeFormularioRectificada');

-- CreateTable
CREATE TABLE "plantilla_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantilla_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_plantilla_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plantilla_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "version" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proposito" TEXT NOT NULL,
    "dominio" "Alcance",
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_plantilla_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "vinculo_id" UUID NOT NULL,
    "template_version_id" UUID NOT NULL,
    "proposito" TEXT NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "campos_solicitados" JSONB NOT NULL,
    "campos_requeridos" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuesta_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solicitud_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "template_version_id" UUID NOT NULL,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuesta_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rectificacion_de_respuesta_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "respuesta_id" UUID NOT NULL,
    "correccion_previa_id" UUID,
    "motivo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rectificacion_de_respuesta_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeFormulario" NOT NULL,
    "profesional_id" UUID,
    "asesorado_id" UUID,
    "recurso_tipo" TEXT NOT NULL,
    "recurso_id" UUID NOT NULL,
    "estado_previo" TEXT,
    "estado_posterior" TEXT,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_de_formulario_clave_key" ON "plantilla_de_formulario"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_plantilla_de_formulario_predecesora_id_key" ON "version_de_plantilla_de_formulario"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_plantilla_de_formulario_plantilla_id_idx" ON "version_de_plantilla_de_formulario"("plantilla_id");

-- CreateIndex
CREATE INDEX "solicitud_de_formulario_asesorado_id_profesional_id_momento_idx" ON "solicitud_de_formulario"("asesorado_id", "profesional_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "solicitud_de_formulario_vinculo_id_idx" ON "solicitud_de_formulario"("vinculo_id");

-- CreateIndex
CREATE UNIQUE INDEX "respuesta_de_formulario_solicitud_id_key" ON "respuesta_de_formulario"("solicitud_id");

-- CreateIndex
CREATE UNIQUE INDEX "rectificacion_de_respuesta_de_formulario_correccion_previa__key" ON "rectificacion_de_respuesta_de_formulario"("correccion_previa_id");

-- CreateIndex
CREATE INDEX "rectificacion_de_respuesta_de_formulario_respuesta_id_idx" ON "rectificacion_de_respuesta_de_formulario"("respuesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_formulario_secuencia_key" ON "evento_de_formulario"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_formulario_asesorado_id_momento_de_registro_idx" ON "evento_de_formulario"("asesorado_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "evento_de_formulario_recurso_id_idx" ON "evento_de_formulario"("recurso_id");

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_formulario" ADD CONSTRAINT "version_de_plantilla_de_formulario_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plantilla_de_formulario" ADD CONSTRAINT "version_de_plantilla_de_formulario_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_plantilla_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_vinculo_id_fkey" FOREIGN KEY ("vinculo_id") REFERENCES "vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "version_de_plantilla_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "respuesta_de_formulario" ADD CONSTRAINT "respuesta_de_formulario_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "respuesta_de_formulario" ADD CONSTRAINT "respuesta_de_formulario_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "respuesta_de_formulario" ADD CONSTRAINT "respuesta_de_formulario_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "version_de_plantilla_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "rectificacion_de_respuesta_de_formulario" ADD CONSTRAINT "rectificacion_de_respuesta_de_formulario_respuesta_id_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "rectificacion_de_respuesta_de_formulario" ADD CONSTRAINT "rectificacion_de_respuesta_de_formulario_correccion_previa_fkey" FOREIGN KEY ("correccion_previa_id") REFERENCES "rectificacion_de_respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- WP-07 · Garantías de la base. Lo que sigue sostiene las reglas de CAP-DAT (06 §20.4) aunque el código
-- se equivoque. Prisma no representa triggers, CHECK ni índices parciales: por eso viven acá.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Cadenas lineales por relación, nunca por fecha (B-06; REG-06-12, 15, 16) ─────────────────────
-- Una sola raíz por objeto; la unicidad de la predecesora ya la puso Prisma. Con las dos, bifurcar es imposible.
CREATE UNIQUE INDEX "version_de_plantilla_de_formulario_una_raiz" ON "version_de_plantilla_de_formulario" ("plantilla_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "rectificacion_de_respuesta_de_formulario_una_raiz" ON "rectificacion_de_respuesta_de_formulario" ("respuesta_id") WHERE "correccion_previa_id" IS NULL;

-- La predecesora es del mismo objeto. Se redefine la función compartida con todas las ramas anteriores intactas.
CREATE OR REPLACE FUNCTION "be_sucesion_del_mismo_objeto"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ok boolean;
BEGIN
  IF TG_TABLE_NAME = 'capacidad_profesional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "capacidad_profesional" WHERE "id" = NEW."predecesora_id" AND "identidad_id" = NEW."identidad_id");
  ELSIF TG_TABLE_NAME = 'proxima_revision' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "proxima_revision" WHERE "id" = NEW."predecesora_id" AND "proceso_id" = NEW."proceso_id");
  ELSIF TG_TABLE_NAME = 'version_de_elemento_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" WHERE "id" = NEW."predecesora_id" AND "elemento_id" = NEW."elemento_id");
  ELSIF TG_TABLE_NAME = 'version_de_objetivo_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_objetivo_nutricional" WHERE "id" = NEW."predecesora_id" AND "objetivo_id" = NEW."objetivo_id");
  ELSIF TG_TABLE_NAME = 'version_de_plan_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_plan_nutricional" WHERE "id" = NEW."predecesora_id" AND "plan_id" = NEW."plan_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_ingesta' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_ingesta" WHERE "id" = NEW."correccion_previa_id" AND "ingesta_id" = NEW."ingesta_id");
  ELSIF TG_TABLE_NAME = 'version_de_especificacion_antropometrica' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_especificacion_antropometrica" WHERE "id" = NEW."predecesora_id" AND "especificacion_id" = NEW."especificacion_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_medicion' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_medicion" WHERE "id" = NEW."correccion_previa_id" AND "medicion_id" = NEW."medicion_id");
  ELSIF TG_TABLE_NAME = 'referencia_de_calculo' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (
      SELECT 1 FROM "referencia_de_calculo"
       WHERE "id" = NEW."predecesora_id" AND "asesorado_id" = NEW."asesorado_id" AND "profesional_id" = NEW."profesional_id" AND "finalidad" = NEW."finalidad");
  ELSIF TG_TABLE_NAME = 'version_de_ejercicio' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_ejercicio" WHERE "id" = NEW."predecesora_id" AND "ejercicio_id" = NEW."ejercicio_id");
  ELSIF TG_TABLE_NAME = 'version_de_objetivo_de_entrenamiento' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_objetivo_de_entrenamiento" WHERE "id" = NEW."predecesora_id" AND "objetivo_id" = NEW."objetivo_id");
  ELSIF TG_TABLE_NAME = 'version_de_plan_de_entrenamiento' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_plan_de_entrenamiento" WHERE "id" = NEW."predecesora_id" AND "plan_id" = NEW."plan_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_ejecucion_de_entrenamiento' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_ejecucion_de_entrenamiento" WHERE "id" = NEW."correccion_previa_id" AND "ejecucion_id" = NEW."ejecucion_id");
  -- WP-07
  ELSIF TG_TABLE_NAME = 'version_de_plantilla_de_formulario' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_plantilla_de_formulario" WHERE "id" = NEW."predecesora_id" AND "plantilla_id" = NEW."plantilla_id");
  ELSIF TG_TABLE_NAME = 'rectificacion_de_respuesta_de_formulario' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."correccion_previa_id" AND "respuesta_id" = NEW."respuesta_id");
  ELSE
    RAISE EXCEPTION 'BE: be_sucesion_del_mismo_objeto no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'BE: en % la predecesora tiene que ser del mismo objeto (REG-06-12, REG-06-15)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_plantilla_de_formulario_sucesion" BEFORE INSERT ON "version_de_plantilla_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "rectificacion_de_respuesta_de_formulario_sucesion" BEFORE INSERT ON "rectificacion_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();

-- ─── Historia por adición: lo que es historia no se edita, no se borra y no se trunca (06 §4.4) ──
CREATE TRIGGER "plantilla_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "plantilla_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plantilla_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_plantilla_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "solicitud_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "solicitud_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
-- REG-06-14/15: el original queda intacto. RespuestaDeFormulario nunca se actualiza; corregirla crea una rectificación.
CREATE TRIGGER "respuesta_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "rectificacion_de_respuesta_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "rectificacion_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_formulario_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "plantilla_de_formulario_sin_truncate" BEFORE TRUNCATE ON "plantilla_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plantilla_de_formulario_sin_truncate" BEFORE TRUNCATE ON "version_de_plantilla_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "solicitud_de_formulario_sin_truncate" BEFORE TRUNCATE ON "solicitud_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "respuesta_de_formulario_sin_truncate" BEFORE TRUNCATE ON "respuesta_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "rectificacion_de_respuesta_de_formulario_sin_truncate" BEFORE TRUNCATE ON "rectificacion_de_respuesta_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_formulario_sin_truncate" BEFORE TRUNCATE ON "evento_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Coherencia de datos ──────────────────────────────────────────────────────────────────────────
ALTER TABLE "plantilla_de_formulario" ADD CONSTRAINT "plantilla_de_formulario_con_clave" CHECK (btrim("clave") <> '');
ALTER TABLE "version_de_plantilla_de_formulario" ADD CONSTRAINT "version_de_plantilla_de_formulario_con_nombre" CHECK (btrim("nombre") <> '' AND btrim("proposito") <> '' AND btrim("version") <> '');
ALTER TABLE "version_de_plantilla_de_formulario" ADD CONSTRAINT "version_de_plantilla_de_formulario_con_secciones" CHECK (jsonb_typeof("contenido" -> 'sections') = 'array' AND jsonb_array_length("contenido" -> 'sections') > 0);
-- REG-06-212: pedir sin al menos un campo no es pedir nada; requerido ⊆ solicitado se valida en el dominio (no es expresable en un CHECK simple sin duplicar esa lógica en SQL).
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_con_proposito" CHECK (btrim("proposito") <> '');
ALTER TABLE "solicitud_de_formulario" ADD CONSTRAINT "solicitud_de_formulario_campos_bien_formados" CHECK (
  jsonb_typeof("campos_solicitados") = 'array' AND jsonb_array_length("campos_solicitados") > 0 AND jsonb_typeof("campos_requeridos") = 'array'
);
ALTER TABLE "respuesta_de_formulario" ADD CONSTRAINT "respuesta_de_formulario_con_contenido" CHECK (jsonb_typeof("contenido" -> 'answers') = 'array' AND jsonb_array_length("contenido" -> 'answers') > 0);
-- REG-06-116/09:1618: la rectificación dice por qué.
ALTER TABLE "rectificacion_de_respuesta_de_formulario" ADD CONSTRAINT "rectificacion_de_respuesta_de_formulario_con_motivo" CHECK (btrim("motivo") <> '');
ALTER TABLE "rectificacion_de_respuesta_de_formulario" ADD CONSTRAINT "rectificacion_de_respuesta_de_formulario_con_contenido" CHECK (jsonb_typeof("contenido" -> 'answers') = 'array' AND jsonb_array_length("contenido" -> 'answers') > 0);

-- ─── La Respuesta es de la misma Solicitud: mismo asesorado, misma versión de plantilla (09 §22.7) ─
CREATE FUNCTION "be_respuesta_de_formulario_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "solicitud_de_formulario"
        WHERE "id" = NEW."solicitud_id" AND "asesorado_id" = NEW."asesorado_id" AND "template_version_id" = NEW."template_version_id") THEN
    RAISE EXCEPTION 'BE: la Respuesta es del mismo asesorado y de la misma versión de plantilla que su Solicitud (09 §22.7)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "respuesta_de_formulario_insertar" BEFORE INSERT ON "respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_respuesta_de_formulario_insertar"();

-- ─── La versión de una rectificación avanza de a uno desde la terminal actual de la cadena ─────────
CREATE FUNCTION "be_rectificacion_de_respuesta_de_formulario_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_esperada integer;
BEGIN
  IF NEW."correccion_previa_id" IS NULL THEN
    SELECT "version" INTO v_esperada FROM "respuesta_de_formulario" WHERE "id" = NEW."respuesta_id";
  ELSE
    SELECT "version" INTO v_esperada FROM "rectificacion_de_respuesta_de_formulario" WHERE "id" = NEW."correccion_previa_id";
  END IF;
  IF NEW."version" IS DISTINCT FROM v_esperada + 1 THEN
    RAISE EXCEPTION 'BE: la versión de la rectificación avanza de a uno desde la terminal actual (09:1618)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "rectificacion_de_respuesta_de_formulario_insertar" BEFORE INSERT ON "rectificacion_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_rectificacion_de_respuesta_de_formulario_insertar"();

-- ─── Catálogo sintético mínimo (D-D, docs/paquetes/WP-07.md): dos plantillas de demostración ───────
INSERT INTO "plantilla_de_formulario" ("id", "clave", "momento_de_registro") VALUES
  ('7aa84959-7702-4749-bf70-7fdc574db6ca', 'FRM-SALUD', '2026-09-21T00:00:00.000Z'),
  ('d5e96564-ee21-4ef2-a58f-4cf0fa4ee8a1', 'FRM-HABITOS', '2026-09-21T00:00:00.000Z');

INSERT INTO "version_de_plantilla_de_formulario"
  ("id", "plantilla_id", "predecesora_id", "version", "nombre", "proposito", "dominio", "contenido", "procedencia", "momento_de_registro") VALUES
  ('349161b3-b831-4df1-896f-484517393a57', '7aa84959-7702-4749-bf70-7fdc574db6ca', NULL, '1',
   'Antecedentes de salud declarados',
   'Antecedentes de salud, dolor/lesiones y medicación con relevancia directa para la práctica (08:201-204)',
   NULL,
   '{"sections":[{"sectionCode":"condiciones","title":"Condiciones y antecedentes","fields":[{"fieldCode":"condiciones_declaradas","label":"Condiciones de salud declaradas","dataType":"TEXT","unit":null,"category":"SALUD_Y_SEGURIDAD","helpText":"Diabetes, hipertensión, asma u otra condición relevante para la práctica"},{"fieldCode":"dolor_o_lesiones","label":"Dolor o lesiones actuales","dataType":"TEXT","unit":null,"category":"SALUD_Y_SEGURIDAD","helpText":null},{"fieldCode":"medicacion_relevante","label":"Medicación con relevancia para la práctica","dataType":"TEXT","unit":null,"category":"SALUD_Y_SEGURIDAD","helpText":null}]}]}',
   '{"rotulo":"Catálogo sintético de demostración: no es un catálogo clínico (D-D, docs/paquetes/WP-07.md)."}',
   '2026-09-21T00:00:00.000Z'),
  ('4879e539-235f-4f91-83fc-2e113c404393', 'd5e96564-ee21-4ef2-a58f-4cf0fa4ee8a1', NULL, '1',
   'Hábitos y contexto',
   'Hábitos, rutina y contexto personal relevante para acompañar el proceso',
   NULL,
   '{"sections":[{"sectionCode":"rutina","title":"Rutina y hábitos","fields":[{"fieldCode":"horas_de_sueno","label":"Horas de sueño habituales","dataType":"NUMBER","unit":"h","category":"HABITOS_Y_CONTEXTO","helpText":null},{"fieldCode":"nivel_de_actividad","label":"Nivel de actividad física habitual","dataType":"TEXT","unit":null,"category":"HABITOS_Y_CONTEXTO","helpText":null},{"fieldCode":"fuma","label":"Fuma actualmente","dataType":"BOOLEAN","unit":null,"category":"HABITOS_Y_CONTEXTO","helpText":null}]}]}',
   '{"rotulo":"Catálogo sintético de demostración: no es un catálogo clínico (D-D, docs/paquetes/WP-07.md)."}',
   '2026-09-21T00:00:00.000Z');
