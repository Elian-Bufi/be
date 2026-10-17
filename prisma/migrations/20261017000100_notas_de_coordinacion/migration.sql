-- WP-NOTAS-DE-COORDINACION (DEUDA_LEGAJO DL-140; aprobado por Dirección el 2026-10-16 con las opciones recomendadas de
-- docs/propuestas/NOTAS-DE-COORDINACION_ficha.md): RF-057 (P0) · UC-E07 · API-CRD-01 (09 §11.6) · 06 T-06-43.
-- Un profesional autorizado le deja contexto a los otros profesionales que acompañan a la persona, sin prescribir, sin
-- modificar, sin decidir sobre otra área y sin transferir responsabilidad. La persona lee todas (08 §9.15).
-- Migración aditiva: tres enumeraciones y tres tablas nuevas, sin tocar las existentes.
-- 1. Tablas, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque:
--    - las tres tablas solo se agregan, también frente a TRUNCATE (CRD-D7; 08 §29);
--    - el texto, de 1 a 600 caracteres y sin espacios en los bordes (CRD-D3);
--    - escribe un profesional sobre otra persona, y la reciben otros profesionales, nunca el autor ni la persona;
--    - una nota corrige solo a otra anterior del mismo autor sobre la misma persona (CRD-D7);
--    - lo citado es del autor con esa persona, de su área de origen, y está registrado (CRD-D5);
--    - toda nota tiene a quién llegar, y la de «uno en particular», exactamente uno (CRD-D1; al confirmar).
--    El acceso de cada destinatario (vínculo aceptado y B2 vigente) lo decide el PDP en la API, como toda autorización.

-- CreateEnum
CREATE TYPE "FinalidadDeNotaDeCoordinacion" AS ENUM ('CONTEXTO_PARA_TU_AREA', 'CAMBIO_EN_MI_AREA', 'PEDIDO_DE_COORDINACION');

-- CreateEnum
CREATE TYPE "ModoDeDestinatariosDeNota" AS ENUM ('TODOS', 'UNO');

-- CreateEnum
CREATE TYPE "TipoDeReferenciaDeNota" AS ENUM ('VERSION_DE_PLAN_NUTRICIONAL', 'REVISION_NUTRICIONAL', 'VERSION_DE_PLAN_DE_ENTRENAMIENTO', 'REVISION_DE_ENTRENAMIENTO', 'EVALUACION_ANTROPOMETRICA');

-- CreateTable
CREATE TABLE "nota_de_coordinacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "autor_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "alcance_de_origen" "Alcance" NOT NULL,
    "finalidad" "FinalidadDeNotaDeCoordinacion" NOT NULL,
    "modo_de_destinatarios" "ModoDeDestinatariosDeNota" NOT NULL,
    "texto" TEXT NOT NULL,
    "corrige_a_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_de_coordinacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinatario_de_nota" (
    "nota_id" UUID NOT NULL,
    "destinatario_id" UUID NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinatario_de_nota_pkey" PRIMARY KEY ("nota_id","destinatario_id")
);

-- CreateTable
CREATE TABLE "referencia_de_nota" (
    "nota_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" "TipoDeReferenciaDeNota" NOT NULL,
    "recurso_id" UUID NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referencia_de_nota_pkey" PRIMARY KEY ("nota_id","orden")
);

-- CreateIndex
CREATE INDEX "nota_de_coordinacion_asesorado_id_momento_de_registro_id_idx" ON "nota_de_coordinacion"("asesorado_id", "momento_de_registro" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "nota_de_coordinacion_autor_id_idx" ON "nota_de_coordinacion"("autor_id");

-- CreateIndex
CREATE INDEX "nota_de_coordinacion_corrige_a_id_idx" ON "nota_de_coordinacion"("corrige_a_id");

-- CreateIndex
CREATE INDEX "destinatario_de_nota_destinatario_id_idx" ON "destinatario_de_nota"("destinatario_id");

-- CreateIndex
CREATE UNIQUE INDEX "referencia_de_nota_nota_id_tipo_recurso_id_key" ON "referencia_de_nota"("nota_id", "tipo", "recurso_id");

-- AddForeignKey
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_corrige_a_id_fkey" FOREIGN KEY ("corrige_a_id") REFERENCES "nota_de_coordinacion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_nota" ADD CONSTRAINT "destinatario_de_nota_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota_de_coordinacion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_nota" ADD CONSTRAINT "destinatario_de_nota_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "referencia_de_nota" ADD CONSTRAINT "referencia_de_nota_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota_de_coordinacion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;



-- ─── Las notas, sus destinatarios y sus referencias solo se agregan (CRD-D7; 08 §29) ─────────────────────────────────
CREATE TRIGGER "nota_de_coordinacion_solo_agregar" BEFORE UPDATE OR DELETE ON "nota_de_coordinacion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nota_de_coordinacion_sin_truncate" BEFORE TRUNCATE ON "nota_de_coordinacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_nota_solo_agregar" BEFORE UPDATE OR DELETE ON "destinatario_de_nota" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_nota_sin_truncate" BEFORE TRUNCATE ON "destinatario_de_nota" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "referencia_de_nota_solo_agregar" BEFORE UPDATE OR DELETE ON "referencia_de_nota" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "referencia_de_nota_sin_truncate" BEFORE TRUNCATE ON "referencia_de_nota" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La forma de una nota ───────────────────────────────────────────────────────────────────────────────────────────
-- CRD-D3: de 1 a 600 caracteres, sin espacios ni saltos en los bordes (la API recorta antes de guardar).
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_texto_acotado" CHECK (
  char_length("texto") BETWEEN 1 AND 600 AND "texto" = btrim("texto", E' \t\r\n'));
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_sobre_otra_persona" CHECK ("autor_id" <> "asesorado_id");
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_no_se_corrige_a_si_misma" CHECK ("corrige_a_id" IS NULL OR "corrige_a_id" <> "id");
ALTER TABLE "nota_de_coordinacion" ADD CONSTRAINT "nota_de_coordinacion_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- CRD-D5: como mucho tres referencias, en orden.
ALTER TABLE "referencia_de_nota" ADD CONSTRAINT "referencia_de_nota_orden" CHECK ("orden" BETWEEN 1 AND 3);

-- ─── Quién escribe y qué corrige ────────────────────────────────────────────────────────────────────────────────────
-- Escribe un profesional (el mismo control que la solicitud de vínculo y la invitación). Una corrección cita una nota
-- anterior del mismo autor sobre la misma persona: no hay respuestas en hilo ni notas sobre las notas de otro (CRD-D7).
CREATE FUNCTION "be_nota_de_coordinacion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: quien escribe una nota de coordinación no tiene perfil profesional' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."corrige_a_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "nota_de_coordinacion"
     WHERE "id" = NEW."corrige_a_id" AND "autor_id" = NEW."autor_id" AND "asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: una nota corrige solo a otra del mismo autor sobre la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "nota_de_coordinacion_guardar" BEFORE INSERT ON "nota_de_coordinacion" FOR EACH ROW EXECUTE FUNCTION "be_nota_de_coordinacion_guardar"();

-- ─── Quién la recibe ────────────────────────────────────────────────────────────────────────────────────────────────
-- Otro profesional: ni el autor ni la persona (la persona no es destinataria: lee todas las notas sobre ella, 08 §9.15).
-- La de «uno en particular» no admite un segundo.
CREATE FUNCTION "be_destinatario_de_nota_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_nota "nota_de_coordinacion"%ROWTYPE;
BEGIN
  SELECT * INTO v_nota FROM "nota_de_coordinacion" WHERE "id" = NEW."nota_id";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BE: el destinatario no tiene nota' USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF NEW."destinatario_id" = v_nota."autor_id" OR NEW."destinatario_id" = v_nota."asesorado_id" THEN
    RAISE EXCEPTION 'BE: una nota de coordinación la recibe otro profesional, no su autor ni la persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."destinatario_id") THEN
    RAISE EXCEPTION 'BE: quien recibe una nota de coordinación no tiene perfil profesional' USING ERRCODE = 'check_violation';
  END IF;
  IF v_nota."modo_de_destinatarios" = 'UNO' AND EXISTS (SELECT 1 FROM "destinatario_de_nota" WHERE "nota_id" = NEW."nota_id") THEN
    RAISE EXCEPTION 'BE: una nota para uno en particular tiene un solo destinatario' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "destinatario_de_nota_guardar" BEFORE INSERT ON "destinatario_de_nota" FOR EACH ROW EXECUTE FUNCTION "be_destinatario_de_nota_guardar"();

-- Toda nota tiene a quién llegar (UC-E07 E01: sin destinatario autorizado no se registra). Se verifica al confirmar la
-- transacción, cuando ya están sus destinatarios: una nota visible solo para su autor sería una nota privada, que no
-- entra (propuesta §4; 08 §9.15).
CREATE FUNCTION "be_nota_de_coordinacion_con_destinatarios"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "destinatario_de_nota" WHERE "nota_id" = NEW."id") THEN
    RAISE EXCEPTION 'BE: la nota de coordinación % no tiene destinatarios', NEW."id" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "nota_de_coordinacion_con_destinatarios" AFTER INSERT ON "nota_de_coordinacion"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_nota_de_coordinacion_con_destinatarios"();

-- ─── Lo que cita ────────────────────────────────────────────────────────────────────────────────────────────────────
-- CRD-D5: un recurso del autor con esa persona, del área desde la que escribe, y registrado: una versión activada de su
-- plan, una revisión suya o una toma registrada. Nunca un borrador ni algo de otro profesional.
CREATE FUNCTION "be_referencia_de_nota_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_nota "nota_de_coordinacion"%ROWTYPE;
  v_area "Alcance";
  v_valida boolean;
BEGIN
  SELECT * INTO v_nota FROM "nota_de_coordinacion" WHERE "id" = NEW."nota_id";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BE: la referencia no tiene nota' USING ERRCODE = 'foreign_key_violation';
  END IF;
  v_area := CASE NEW."tipo"
    WHEN 'VERSION_DE_PLAN_NUTRICIONAL' THEN 'NUTRICION'::"Alcance"
    WHEN 'REVISION_NUTRICIONAL' THEN 'NUTRICION'::"Alcance"
    WHEN 'VERSION_DE_PLAN_DE_ENTRENAMIENTO' THEN 'ENTRENAMIENTO'::"Alcance"
    WHEN 'REVISION_DE_ENTRENAMIENTO' THEN 'ENTRENAMIENTO'::"Alcance"
    ELSE 'ANTROPOMETRIA'::"Alcance"
  END;
  IF v_area <> v_nota."alcance_de_origen" THEN
    RAISE EXCEPTION 'BE: una nota cita solo lo del área desde la que se escribió' USING ERRCODE = 'check_violation';
  END IF;
  v_valida := CASE NEW."tipo"
    WHEN 'VERSION_DE_PLAN_NUTRICIONAL' THEN EXISTS (
      SELECT 1 FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id"
       WHERE v."id" = NEW."recurso_id" AND v."estado" = 'ACTIVADA' AND p."profesional_id" = v_nota."autor_id" AND p."asesorado_id" = v_nota."asesorado_id")
    WHEN 'REVISION_NUTRICIONAL' THEN EXISTS (
      SELECT 1 FROM "revision_nutricional" r JOIN "proceso_operativo" pr ON pr."id" = r."proceso_id"
       WHERE r."id" = NEW."recurso_id" AND pr."profesional_id" = v_nota."autor_id" AND pr."asesorado_id" = v_nota."asesorado_id")
    WHEN 'VERSION_DE_PLAN_DE_ENTRENAMIENTO' THEN EXISTS (
      SELECT 1 FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
       WHERE v."id" = NEW."recurso_id" AND v."estado" = 'ACTIVADA' AND p."profesional_id" = v_nota."autor_id" AND p."asesorado_id" = v_nota."asesorado_id")
    WHEN 'REVISION_DE_ENTRENAMIENTO' THEN EXISTS (
      SELECT 1 FROM "revision_de_entrenamiento" r JOIN "proceso_operativo" pr ON pr."id" = r."proceso_id"
       WHERE r."id" = NEW."recurso_id" AND pr."profesional_id" = v_nota."autor_id" AND pr."asesorado_id" = v_nota."asesorado_id")
    ELSE EXISTS (
      SELECT 1 FROM "evaluacion_antropometrica" e
       WHERE e."id" = NEW."recurso_id" AND e."estado" = 'REGISTRADA' AND e."profesional_id" = v_nota."autor_id" AND e."asesorado_id" = v_nota."asesorado_id")
  END;
  IF NOT v_valida THEN
    RAISE EXCEPTION 'BE: lo citado no es un registro del autor con esta persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "referencia_de_nota_guardar" BEFORE INSERT ON "referencia_de_nota" FOR EACH ROW EXECUTE FUNCTION "be_referencia_de_nota_guardar"();

-- ─── La novedad de cada destinatario (CRD-D6) ───────────────────────────────────────────────────────────────────────
-- Nombra la nota, para que la pantalla que la resuelve sepa de qué persona se trata. El tipo se compara como texto: el
-- valor se agregó en la migración anterior (20261017000000).
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_nota_de_coordinacion_referenciada" CHECK (
  "tipo"::text <> 'NOTA_DE_COORDINACION_RECIBIDA' OR ("referencia_tipo" = 'NotaDeCoordinacion' AND "referencia_id" IS NOT NULL));
