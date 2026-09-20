-- CreateEnum
CREATE TYPE "EstadoDeEvaluacionAntropometrica" AS ENUM ('EN_PREPARACION', 'REGISTRADA');

-- CreateEnum
CREATE TYPE "OrigenDeMedicion" AS ENUM ('CAPTURA_DIRECTA', 'AUTORREPORTE', 'IMPORTACION_CONTROLADA');

-- CreateEnum
CREATE TYPE "ClaseDeDato" AS ENUM ('MEDIDO', 'REPORTADO', 'CALCULADO');

-- CreateEnum
CREATE TYPE "ModoDeRedondeo" AS ENUM ('MEDIO_ARRIBA', 'ABAJO', 'ARRIBA');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeAntropometria" AS ENUM ('EvaluacionAntropometricaRegistrada', 'MedicionCorregida', 'MedicionAnulada', 'CalculoEjecutado');

-- CreateTable
CREATE TABLE "especificacion_antropometrica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "especificacion_antropometrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_especificacion_antropometrica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "especificacion_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "version" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_especificacion_antropometrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_antropometrica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "estado" "EstadoDeEvaluacionAntropometrica" NOT NULL DEFAULT 'EN_PREPARACION',
    "contexto" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_registro_de_evaluacion" TIMESTAMPTZ(3),

    CONSTRAINT "evaluacion_antropometrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicion_antropometrica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluacion_id" UUID NOT NULL,
    "metrica" TEXT NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "unidad_de_origen" TEXT NOT NULL,
    "protocolo_version_id" UUID NOT NULL,
    "origen" "OrigenDeMedicion" NOT NULL,
    "clase" "ClaseDeDato" NOT NULL,
    "referencia_de_preparacion" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicion_antropometrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correccion_de_medicion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicion_id" UUID NOT NULL,
    "correccion_previa_id" UUID,
    "autor_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "unidad_de_origen" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correccion_de_medicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anulacion_de_medicion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicion_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anulacion_de_medicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejecucion_de_calculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluacion_id" UUID NOT NULL,
    "metodo_version_id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "metrica" TEXT NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "unidad" TEXT NOT NULL,
    "decimales" INTEGER NOT NULL,
    "modo_de_redondeo" "ModoDeRedondeo" NOT NULL,
    "reemplaza_a_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejecucion_de_calculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrada_de_calculo" (
    "ejecucion_id" UUID NOT NULL,
    "medicion_id" UUID NOT NULL,
    "metrica" TEXT NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "unidad" TEXT NOT NULL,

    CONSTRAINT "entrada_de_calculo_pkey" PRIMARY KEY ("ejecucion_id","medicion_id")
);

-- CreateTable
CREATE TABLE "evento_de_antropometria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeAntropometria" NOT NULL,
    "evaluacion_id" UUID,
    "medicion_id" UUID,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_antropometria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "especificacion_antropometrica_clave_key" ON "especificacion_antropometrica"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_especificacion_antropometrica_predecesora_id_key" ON "version_de_especificacion_antropometrica"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_especificacion_antropometrica_especificacion_id_idx" ON "version_de_especificacion_antropometrica"("especificacion_id");

-- CreateIndex
CREATE INDEX "evaluacion_antropometrica_asesorado_id_profesional_id_estad_idx" ON "evaluacion_antropometrica"("asesorado_id", "profesional_id", "estado");

-- CreateIndex
CREATE INDEX "evaluacion_antropometrica_profesional_id_estado_idx" ON "evaluacion_antropometrica"("profesional_id", "estado");

-- CreateIndex
CREATE INDEX "medicion_antropometrica_evaluacion_id_idx" ON "medicion_antropometrica"("evaluacion_id");

-- CreateIndex
CREATE INDEX "medicion_antropometrica_metrica_idx" ON "medicion_antropometrica"("metrica");

-- CreateIndex
CREATE UNIQUE INDEX "correccion_de_medicion_correccion_previa_id_key" ON "correccion_de_medicion"("correccion_previa_id");

-- CreateIndex
CREATE INDEX "correccion_de_medicion_medicion_id_idx" ON "correccion_de_medicion"("medicion_id");

-- CreateIndex
CREATE UNIQUE INDEX "anulacion_de_medicion_medicion_id_key" ON "anulacion_de_medicion"("medicion_id");

-- CreateIndex
CREATE UNIQUE INDEX "ejecucion_de_calculo_reemplaza_a_id_key" ON "ejecucion_de_calculo"("reemplaza_a_id");

-- CreateIndex
CREATE INDEX "ejecucion_de_calculo_evaluacion_id_idx" ON "ejecucion_de_calculo"("evaluacion_id");

-- CreateIndex
CREATE INDEX "entrada_de_calculo_medicion_id_idx" ON "entrada_de_calculo"("medicion_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_antropometria_secuencia_key" ON "evento_de_antropometria"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_antropometria_evaluacion_id_idx" ON "evento_de_antropometria"("evaluacion_id");

-- CreateIndex
CREATE INDEX "evento_de_antropometria_medicion_id_idx" ON "evento_de_antropometria"("medicion_id");

-- AddForeignKey
ALTER TABLE "version_de_especificacion_antropometrica" ADD CONSTRAINT "version_de_especificacion_antropometrica_especificacion_id_fkey" FOREIGN KEY ("especificacion_id") REFERENCES "especificacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_especificacion_antropometrica" ADD CONSTRAINT "version_de_especificacion_antropometrica_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_especificacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_antropometrica" ADD CONSTRAINT "evaluacion_antropometrica_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_antropometrica" ADD CONSTRAINT "evaluacion_antropometrica_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_protocolo_version_id_fkey" FOREIGN KEY ("protocolo_version_id") REFERENCES "version_de_especificacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_medicion" ADD CONSTRAINT "correccion_de_medicion_medicion_id_fkey" FOREIGN KEY ("medicion_id") REFERENCES "medicion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_medicion" ADD CONSTRAINT "correccion_de_medicion_correccion_previa_id_fkey" FOREIGN KEY ("correccion_previa_id") REFERENCES "correccion_de_medicion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_medicion" ADD CONSTRAINT "correccion_de_medicion_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "anulacion_de_medicion" ADD CONSTRAINT "anulacion_de_medicion_medicion_id_fkey" FOREIGN KEY ("medicion_id") REFERENCES "medicion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "anulacion_de_medicion" ADD CONSTRAINT "anulacion_de_medicion_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_metodo_version_id_fkey" FOREIGN KEY ("metodo_version_id") REFERENCES "version_de_especificacion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_reemplaza_a_id_fkey" FOREIGN KEY ("reemplaza_a_id") REFERENCES "ejecucion_de_calculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "entrada_de_calculo" ADD CONSTRAINT "entrada_de_calculo_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_de_calculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "entrada_de_calculo" ADD CONSTRAINT "entrada_de_calculo_medicion_id_fkey" FOREIGN KEY ("medicion_id") REFERENCES "medicion_antropometrica"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Garantías de B-10 en la base. El servicio ya las aplica; acá quedan sostenidas aunque el código
-- se equivoque, como en WP-04.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Una sola raíz por cadena, y una sola sucesora por eslabón ──────────────────────────────────
-- Los índices únicos sobre predecesora_id / correccion_previa_id / reemplaza_a_id ya impiden la rama
-- (los creó el diff). Falta impedir dos raíces del mismo objeto.
CREATE UNIQUE INDEX "version_de_especificacion_antropometrica_una_raiz" ON "version_de_especificacion_antropometrica" ("especificacion_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "correccion_de_medicion_una_raiz" ON "correccion_de_medicion" ("medicion_id") WHERE "correccion_previa_id" IS NULL;

-- La predecesora tiene que ser del mismo objeto (REG-06-15/16): se extiende la función de WP-04.
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
  ELSE
    RAISE EXCEPTION 'BE: be_sucesion_del_mismo_objeto no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'BE: en % la predecesora tiene que ser del mismo objeto (REG-06-12, REG-06-15)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "version_de_especificacion_antropometrica_sucesion" BEFORE INSERT ON "version_de_especificacion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "correccion_de_medicion_sucesion" BEFORE INSERT ON "correccion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();

-- ─── La historia es por adición (06 §4.4) ───────────────────────────────────────────────────────
CREATE TRIGGER "especificacion_antropometrica_solo_agregar" BEFORE UPDATE OR DELETE ON "especificacion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_especificacion_antropometrica_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_especificacion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "medicion_antropometrica_solo_agregar" BEFORE UPDATE OR DELETE ON "medicion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_medicion_solo_agregar" BEFORE UPDATE OR DELETE ON "correccion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "anulacion_de_medicion_solo_agregar" BEFORE UPDATE OR DELETE ON "anulacion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "ejecucion_de_calculo_solo_agregar" BEFORE UPDATE OR DELETE ON "ejecucion_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "entrada_de_calculo_solo_agregar" BEFORE UPDATE OR DELETE ON "entrada_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_antropometria_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_antropometria" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "especificacion_antropometrica_sin_truncate" BEFORE TRUNCATE ON "especificacion_antropometrica" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_especificacion_antropometrica_sin_truncate" BEFORE TRUNCATE ON "version_de_especificacion_antropometrica" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evaluacion_antropometrica_sin_truncate" BEFORE TRUNCATE ON "evaluacion_antropometrica" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "medicion_antropometrica_sin_truncate" BEFORE TRUNCATE ON "medicion_antropometrica" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_medicion_sin_truncate" BEFORE TRUNCATE ON "correccion_de_medicion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "anulacion_de_medicion_sin_truncate" BEFORE TRUNCATE ON "anulacion_de_medicion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "ejecucion_de_calculo_sin_truncate" BEFORE TRUNCATE ON "ejecucion_de_calculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "entrada_de_calculo_sin_truncate" BEFORE TRUNCATE ON "entrada_de_calculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_antropometria_sin_truncate" BEFORE TRUNCATE ON "evento_de_antropometria" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Coherencia de columnas ─────────────────────────────────────────────────────────────────────
-- REG-06-214 inciso 4: el momento de registro existe exactamente cuando la evaluación está REGISTRADA.
ALTER TABLE "evaluacion_antropometrica" ADD CONSTRAINT "evaluacion_antropometrica_registro_coherente" CHECK (
  ("estado" = 'EN_PREPARACION') = ("momento_de_registro_de_evaluacion" IS NULL)
);
-- REG-06-154: la unidad de origen no puede ser vacía, porque sin ella el valor no significa nada.
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_unidad_presente" CHECK (btrim("unidad_de_origen") <> '');
-- REG-06-153: solo la importación controlada lleva referencia de preparación (DL-062).
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_origen_coherente" CHECK (
  "referencia_de_preparacion" IS NULL OR "origen" = 'IMPORTACION_CONTROLADA'
);
-- La clase se deriva del origen y no se contradice con él (04:1090; INV-06-05). Una medición directa nunca es
-- CALCULADO: lo calculado vive en ejecucion_de_calculo.
ALTER TABLE "medicion_antropometrica" ADD CONSTRAINT "medicion_antropometrica_clase_coherente" CHECK (
  ("origen" = 'AUTORREPORTE' AND "clase" = 'REPORTADO')
  OR ("origen" IN ('CAPTURA_DIRECTA', 'IMPORTACION_CONTROLADA') AND "clase" = 'MEDIDO')
);
-- RF-050 y REG-06-218: corregir y anular exigen motivo.
ALTER TABLE "correccion_de_medicion" ADD CONSTRAINT "correccion_de_medicion_con_motivo" CHECK (btrim("motivo") <> '');
ALTER TABLE "anulacion_de_medicion" ADD CONSTRAINT "anulacion_de_medicion_con_motivo" CHECK (btrim("motivo") <> '');
-- REG-06-158: la precisión declarada es un número de decimales razonable.
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_precision" CHECK ("decimales" >= 0 AND "decimales" <= 6);
-- Una ejecución no se reemplaza a sí misma (REG-06-161).
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_no_se_reemplaza_a_si_misma" CHECK ("reemplaza_a_id" IS NULL OR "reemplaza_a_id" <> "id");
-- Una corrección no es su propia previa (REG-06-16).
ALTER TABLE "correccion_de_medicion" ADD CONSTRAINT "correccion_de_medicion_no_es_su_previa" CHECK ("correccion_previa_id" IS NULL OR "correccion_previa_id" <> "id");

-- ─── Máquina de la evaluación (REG-06-214) ──────────────────────────────────────────────────────
-- Nace EN_PREPARACION; la única transición es EN_PREPARACION → REGISTRADA; una REGISTRADA es inmutable;
-- no se elimina. Lo mismo que el trigger de la versión de plan de WP-04, para la otra máquina.
CREATE FUNCTION "be_evaluacion_antropometrica_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'EN_PREPARACION' THEN
      RAISE EXCEPTION 'BE: una evaluación antropométrica nace EN_PREPARACION (REG-06-214)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una evaluación antropométrica no se elimina: la historia es por adición (06 §4.4)' USING ERRCODE = 'restrict_violation';
  END IF;

  IF OLD."estado" = 'REGISTRADA' THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: una evaluación REGISTRADA es inmutable; cambios posteriores usan corrección o anulación (REG-06-214 inciso 5)' USING ERRCODE = 'check_violation';
  END IF;

  IF OLD."estado" = 'EN_PREPARACION' AND NEW."estado" = 'EN_PREPARACION' THEN
    IF NEW."version" <> OLD."version" + 1 THEN
      RAISE EXCEPTION 'BE: la versión de trabajo del borrador avanza de a uno (REG-06-216)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD."estado" = 'EN_PREPARACION' AND NEW."estado" = 'REGISTRADA' THEN
    IF NEW."profesional_id" <> OLD."profesional_id" OR NEW."asesorado_id" <> OLD."asesorado_id" THEN
      RAISE EXCEPTION 'BE: la evaluación conserva profesional y asesorado' USING ERRCODE = 'restrict_violation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "medicion_antropometrica" WHERE "evaluacion_id" = NEW."id") THEN
      RAISE EXCEPTION 'BE: registrar exige contenido registrable: una evaluación sin mediciones no se registra (REG-06-214 inciso 4)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en evaluación antropométrica % -> % (REG-06-214)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "evaluacion_antropometrica_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "evaluacion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_evaluacion_antropometrica_guardar"();

-- ─── Las mediciones y los cálculos se cargan en preparación (REG-06-215) ────────────────────────
-- «Al registrar la Evaluación, 06 exige que los datos/resultados confirmados queden relacionados explícitamente
-- con la Evaluación REGISTRADA»: después del registro, lo que cambia el valor es una corrección o una anulación.
CREATE FUNCTION "be_contenido_en_preparacion"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_estado "EstadoDeEvaluacionAntropometrica";
BEGIN
  SELECT "estado" INTO v_estado FROM "evaluacion_antropometrica" WHERE "id" = NEW."evaluacion_id" FOR SHARE;
  IF v_estado <> 'EN_PREPARACION' THEN
    RAISE EXCEPTION 'BE: solo una evaluación EN_PREPARACION admite contenido nuevo; una REGISTRADA se corrige o se anula (REG-06-214, REG-06-215)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "medicion_antropometrica_en_preparacion" BEFORE INSERT ON "medicion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_contenido_en_preparacion"();

-- ─── Anulación y corrección no se confunden (REG-06-219) ────────────────────────────────────────
-- Una medición ANULADA no admite una corrección destinada a volverla efectiva (06:8717-8719). La unicidad de
-- anulacion_de_medicion.medicion_id, que creó el diff, es lo que hace terminal la anulación: una segunda no
-- produce una segunda fila (adversarial 6).
CREATE FUNCTION "be_correccion_sobre_medicion_vigente"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "anulacion_de_medicion" WHERE "medicion_id" = NEW."medicion_id") THEN
    RAISE EXCEPTION 'BE: una medición ANULADA no admite corrección; una nueva observación se registra como medición nueva (REG-06-219)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "correccion_de_medicion_sobre_vigente" BEFORE INSERT ON "correccion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_correccion_sobre_medicion_vigente"();

-- ─── La entrada de un cálculo es explícita y de la misma evaluación (REG-06-159) ────────────────
CREATE FUNCTION "be_entrada_de_calculo_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_evaluacion_de_la_medicion uuid;
  v_evaluacion_de_la_ejecucion uuid;
BEGIN
  SELECT "evaluacion_id" INTO v_evaluacion_de_la_medicion FROM "medicion_antropometrica" WHERE "id" = NEW."medicion_id";
  SELECT "evaluacion_id" INTO v_evaluacion_de_la_ejecucion FROM "ejecucion_de_calculo" WHERE "id" = NEW."ejecucion_id";
  IF v_evaluacion_de_la_medicion IS DISTINCT FROM v_evaluacion_de_la_ejecucion THEN
    RAISE EXCEPTION 'BE: la entrada de un cálculo pertenece a la misma evaluación que la ejecución (REG-06-159)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "entrada_de_calculo_coherente" BEFORE INSERT ON "entrada_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_entrada_de_calculo_coherente"();
