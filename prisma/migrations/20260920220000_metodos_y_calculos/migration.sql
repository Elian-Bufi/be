-- Métodos y cálculos: el patrón transversal T-06-N12 (06 §20.3), que la antropometría especializa (REG-06-202).
--
-- Tres cosas quedan fijadas acá, en la base, no en el servicio:
-- 1. la **finalidad** es parte de la identidad de una corrida (REG-06-205);
-- 2. adoptar una referencia es una **relación con historia**, no una mutación de la corrida (REG-06-207);
-- 3. el catálogo sintético se siembra con identificadores deterministas, como el de alimentos de WP-04, con
--    MET-DEMO en **dos versiones**, que es lo que permite mostrar que una versión nueva no reescribe cálculos
--    históricos (WP-05 T15; REG-06-203; INV-06-172).

-- ─── Finalidad de la corrida (REG-06-205) ───────────────────────────────────────────────────────
-- Adoptar una referencia es un hecho de B-10, como ejecutar un cálculo.
ALTER TYPE "TipoDeEventoDeAntropometria" ADD VALUE IF NOT EXISTS 'ReferenciaDeCalculoAdoptada';

CREATE TYPE "FinalidadDeCalculo" AS ENUM ('SOPORTE_ANTROPOMETRICO', 'SOPORTE_DE_OBJETIVO_NUTRICIONAL');

ALTER TABLE "ejecucion_de_calculo" ADD COLUMN "finalidad" "FinalidadDeCalculo" NOT NULL DEFAULT 'SOPORTE_ANTROPOMETRICO';
ALTER TABLE "ejecucion_de_calculo" ALTER COLUMN "finalidad" DROP DEFAULT;
-- REG-06-156: la regla de dominio aplicable, identificada y versionada, viaja con la corrida. Sin esto la corrida
-- no es reconstruible: habría que adivinar qué operación se aplicó.
ALTER TABLE "ejecucion_de_calculo" ADD COLUMN "regla" TEXT NOT NULL DEFAULT 'demo/peso-sobre-talla-cuadrado@1';
ALTER TABLE "ejecucion_de_calculo" ALTER COLUMN "regla" DROP DEFAULT;
ALTER TABLE "ejecucion_de_calculo" ADD CONSTRAINT "ejecucion_de_calculo_regla_no_vacia" CHECK (length(btrim("regla")) > 0);

-- ─── Referencia profesional adoptada (T-06-74; REG-06-207) ──────────────────────────────────────
-- «Adoptar una referencia es una relación, no una mutación del resultado»: la corrida no se toca, las otras no se
-- borran, y reemplazar la referencia **crea historia**. Por eso es una cadena, como toda sucesión en BE.
CREATE TABLE "referencia_de_calculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "finalidad" "FinalidadDeCalculo" NOT NULL,
    "ejecucion_id" UUID NOT NULL,
    "predecesora_id" UUID,
    -- Token de concurrencia de la referencia vigente: adoptar sobre una desactualizada es 409, no un pisotón.
    "version" INTEGER NOT NULL DEFAULT 1,
    "fundamento" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referencia_de_calculo_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "referencia_de_calculo" ADD CONSTRAINT "referencia_de_calculo_asesorado_id_fkey"
  FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referencia_de_calculo" ADD CONSTRAINT "referencia_de_calculo_profesional_id_fkey"
  FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referencia_de_calculo" ADD CONSTRAINT "referencia_de_calculo_ejecucion_id_fkey"
  FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_de_calculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referencia_de_calculo" ADD CONSTRAINT "referencia_de_calculo_predecesora_id_fkey"
  FOREIGN KEY ("predecesora_id") REFERENCES "referencia_de_calculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referencia_de_calculo" ADD CONSTRAINT "referencia_de_calculo_fundamento_no_vacio"
  CHECK ("fundamento" IS NULL OR length(btrim("fundamento")) > 0);

-- Una sola cadena por (asesorado, profesional, finalidad), y un solo sucesor por eslabón: la referencia vigente es
-- la punta de la cadena, y no hay dos puntas.
CREATE UNIQUE INDEX "referencia_de_calculo_una_raiz" ON "referencia_de_calculo" ("asesorado_id", "profesional_id", "finalidad") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "referencia_de_calculo_predecesora_id_key" ON "referencia_de_calculo"("predecesora_id");
CREATE INDEX "referencia_de_calculo_ejecucion_id_idx" ON "referencia_de_calculo"("ejecucion_id");
CREATE INDEX "referencia_de_calculo_asesorado_id_profesional_id_finalidad_idx" ON "referencia_de_calculo"("asesorado_id", "profesional_id", "finalidad");

-- La sucesión es del mismo objeto: la referencia anterior es del mismo asesorado, profesional y finalidad.
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
  ELSE
    RAISE EXCEPTION 'BE: be_sucesion_del_mismo_objeto no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'BE: en % la predecesora tiene que ser del mismo objeto (REG-06-12, REG-06-15)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "referencia_de_calculo_sucesion" BEFORE INSERT ON "referencia_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "referencia_de_calculo_solo_agregar" BEFORE UPDATE OR DELETE ON "referencia_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

-- La corrida referenciada es del mismo asesorado y de la misma finalidad: la referencia no cruza personas ni
-- finalidades (REG-06-207).
CREATE FUNCTION "be_referencia_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_asesorado uuid;
  v_finalidad "FinalidadDeCalculo";
BEGIN
  SELECT e."asesorado_id", c."finalidad" INTO v_asesorado, v_finalidad
    FROM "ejecucion_de_calculo" c JOIN "evaluacion_antropometrica" e ON e."id" = c."evaluacion_id"
   WHERE c."id" = NEW."ejecucion_id";
  IF v_asesorado IS DISTINCT FROM NEW."asesorado_id" OR v_finalidad IS DISTINCT FROM NEW."finalidad" THEN
    RAISE EXCEPTION 'BE: la referencia adoptada corresponde al mismo asesorado y a la misma finalidad que la corrida (REG-06-207)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "referencia_de_calculo_coherente" BEFORE INSERT ON "referencia_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_referencia_coherente"();

-- ─── Catálogo sintético de especificaciones (WP-05 T15) ─────────────────────────────────────────
-- Valores SINTÉTICOS de demostración, con identificadores deterministas: iguales en todos los ambientes, como el
-- catálogo de alimentos de WP-04. El legajo prohíbe fijar un catálogo científico desde este bloque: «define la
-- estructura para representarlas y reconstruirlas, no selecciona una como universal» (REG-06-157, 06:6304).
INSERT INTO "especificacion_antropometrica" ("id", "clave", "tipo", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f01', 'PROTO-LAB', 'PROTOCOLO', '2026-09-20T00:00:00.000Z'),
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f02', 'MET-DEMO', 'METODO', '2026-09-20T00:00:00.000Z');

INSERT INTO "version_de_especificacion_antropometrica" ("id", "especificacion_id", "predecesora_id", "version", "nombre", "contenido", "procedencia", "momento_de_registro") VALUES
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f01', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f01', NULL, '1',
   'Protocolo de laboratorio (demostración)',
   '{"metricas":[{"clave":"peso","unidades":["kg"],"precision":1},{"clave":"talla","unidades":["m","cm"],"precision":2}]}',
   '{"rotulo":"Valores sintéticos de demostración: no es un catálogo científico (REG-06-157)."}',
   '2026-09-20T00:00:00.000Z'),
  -- MET-DEMO v1: admitía el peso informado por la persona y declaraba dos decimales.
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f02', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f02', NULL, '1',
   'Método de demostración v1',
   '{"finalidades":["SOPORTE_ANTROPOMETRICO","SOPORTE_DE_OBJETIVO_NUTRICIONAL"],
     "entradas":[{"codigo":"PESO","metrica":"peso","unidadesAdmitidas":["kg"],"procedenciasAdmitidas":["CAPTURA_DIRECTA","AUTORREPORTE"]},
                 {"codigo":"TALLA","metrica":"talla","unidadesAdmitidas":["m"],"procedenciasAdmitidas":["CAPTURA_DIRECTA"]}],
     "salida":{"metrica":"indice-demo","unidad":"kg/m2"},
     "precision":{"decimales":2,"modo":"MEDIO_ARRIBA"},
     "regla":"demo/peso-sobre-talla-cuadrado@1"}',
   '{"rotulo":"Método sintético de demostración: BE no fija una fórmula profesional universal (REG-06-208)."}',
   '2026-09-20T00:00:00.000Z'),
  -- MET-DEMO v2 sucede a v1: misma regla, pero deja de admitir el peso informado por la persona, se restringe a la
  -- finalidad antropométrica y declara tres decimales. El cambio metodológico no siempre es un cambio de fórmula, y
  -- la v1 sigue existiendo, citada por las corridas que la usaron.
  ('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f03', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a1f02', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f02', '2',
   'Método de demostración v2',
   '{"finalidades":["SOPORTE_ANTROPOMETRICO"],
     "entradas":[{"codigo":"PESO","metrica":"peso","unidadesAdmitidas":["kg"],"procedenciasAdmitidas":["CAPTURA_DIRECTA"]},
                 {"codigo":"TALLA","metrica":"talla","unidadesAdmitidas":["m"],"procedenciasAdmitidas":["CAPTURA_DIRECTA"]}],
     "salida":{"metrica":"indice-demo","unidad":"kg/m2"},
     "precision":{"decimales":3,"modo":"MEDIO_ARRIBA"},
     "regla":"demo/peso-sobre-talla-cuadrado@1"}',
   '{"rotulo":"Método sintético de demostración: BE no fija una fórmula profesional universal (REG-06-208)."}',
   '2026-09-20T00:00:00.000Z');
