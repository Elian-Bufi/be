-- WP-EDITORES-PROFESIONAL (DL-167; DL-171). Solo agrega: un tipo, tres tablas y sus guardias. Ninguna fila existente cambia.
-- - ED-13: las prescripciones y los repartos habituales del profesional (API-HAB-06 a 08 y API-HAN-06 a 08). Filas
--   mutables, como las sesiones y las comidas habituales (DL-109): la historia está en los eventos.
-- - ED-72: la serie observada por el profesional (API-FZA-01 a 03), de solo agregar: corregirla o anularla es una fila
--   nueva que sucede a la anterior. Guarda su estimación Epley v1 como hecho histórico (REG-06-205).

-- CreateEnum
CREATE TYPE "TipoDeSerieObservada" AS ENUM ('OBSERVADA', 'ANULACION');

-- CreateTable
CREATE TABLE "prescripcion_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "prescripcion" JSONB NOT NULL,
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescripcion_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reparto_habitual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_normalizado" TEXT NOT NULL,
    "reparto" JSONB NOT NULL,
    "estado" "EstadoDeHabitual" NOT NULL DEFAULT 'ACTIVO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reparto_habitual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serie_observada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "ejercicio_id" UUID NOT NULL,
    "fecha_local" DATE NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "carga" DOUBLE PRECISION,
    "unidad" TEXT,
    "repeticiones" INTEGER,
    "rir" DOUBLE PRECISION,
    "nota" TEXT,
    "estimacion" JSONB,
    "tipo" "TipoDeSerieObservada" NOT NULL DEFAULT 'OBSERVADA',
    "predecesora_id" UUID,
    "motivo" TEXT,
    "posicion" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serie_observada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescripcion_habitual_profesional_id_estado_momento_de_actu_idx" ON "prescripcion_habitual"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "prescripcion_habitual_profesional_id_nombre_normalizado_key" ON "prescripcion_habitual"("profesional_id", "nombre_normalizado");

-- CreateIndex
CREATE INDEX "reparto_habitual_profesional_id_estado_momento_de_actualiza_idx" ON "reparto_habitual"("profesional_id", "estado", "momento_de_actualizacion");

-- CreateIndex
CREATE UNIQUE INDEX "reparto_habitual_profesional_id_nombre_normalizado_key" ON "reparto_habitual"("profesional_id", "nombre_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "serie_observada_predecesora_id_key" ON "serie_observada"("predecesora_id");

-- CreateIndex
CREATE INDEX "serie_observada_asesorado_id_profesional_id_ejercicio_id_fe_idx" ON "serie_observada"("asesorado_id", "profesional_id", "ejercicio_id", "fecha_local");

-- AddForeignKey
ALTER TABLE "prescripcion_habitual" ADD CONSTRAINT "prescripcion_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "reparto_habitual" ADD CONSTRAINT "reparto_habitual_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "serie_observada"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── Las guardias de las prescripciones y los repartos habituales (ED-13) ─────────────────────────────────────────────
ALTER TABLE "prescripcion_habitual" ADD CONSTRAINT "prescripcion_habitual_coherente" CHECK (
  char_length("nombre") BETWEEN 1 AND 120 AND "version" >= 1 AND jsonb_typeof("prescripcion") = 'object' AND jsonb_typeof("procedencia") = 'object');
ALTER TABLE "reparto_habitual" ADD CONSTRAINT "reparto_habitual_coherente" CHECK (
  char_length("nombre") BETWEEN 1 AND 120 AND "version" >= 1 AND jsonb_typeof("reparto") = 'object' AND jsonb_typeof("procedencia") = 'object');

-- ─── Las guardias de la serie observada (ED-72; DL-171) ────────────────────────────────────────────────────────────────
-- Una observación lleva sus valores y su estimación: carga mayor que 0 en kg o lb, repeticiones desde 1, RIR de 0 a 2 y
-- hasta 12 repeticiones equivalentes (lo que no se puede estimar no se guarda, ED-D19). Una anulación no lleva valores y
-- siempre sucede a otra. La sucesora dice su motivo y su posición en la cadena.
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_coherente" CHECK (
  ("tipo" = 'OBSERVADA'
     AND "carga" > 0 AND "unidad" IN ('kg', 'lb') AND "repeticiones" >= 1 AND "rir" BETWEEN 0 AND 2
     AND "repeticiones" + "rir" <= 12 AND jsonb_typeof("estimacion") = 'object')
  OR ("tipo" = 'ANULACION'
     AND "carga" IS NULL AND "unidad" IS NULL AND "repeticiones" IS NULL AND "rir" IS NULL AND "estimacion" IS NULL
     AND "nota" IS NULL AND "predecesora_id" IS NOT NULL));
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_sucesion_coherente" CHECK (
  ("predecesora_id" IS NULL AND "motivo" IS NULL AND "posicion" = 1)
  OR ("predecesora_id" IS NOT NULL AND char_length("motivo") BETWEEN 1 AND 500 AND "posicion" >= 2));
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_textos_acotados" CHECK (
  ("nota" IS NULL OR char_length("nota") BETWEEN 1 AND 500) AND char_length("zona_horaria") BETWEEN 1 AND 64);
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- Solo agregar (08 §29): una serie observada no se cambia ni se borra.
CREATE TRIGGER "serie_observada_solo_agregar" BEFORE UPDATE OR DELETE ON "serie_observada" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

-- La sucesora es de la misma persona, del mismo profesional y del mismo ejercicio, sigue a una observación (no a una
-- anulación) y ocupa la posición siguiente. La unicidad de `predecesora_id` deja una sola sucesora por fila.
CREATE FUNCTION "be_serie_observada_sucesion"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  previa "serie_observada"%ROWTYPE;
BEGIN
  IF NEW."predecesora_id" IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT * INTO previa FROM "serie_observada" WHERE "id" = NEW."predecesora_id";
  IF previa."tipo" <> 'OBSERVADA' THEN
    RAISE EXCEPTION 'BE: una anulación no tiene sucesora' USING ERRCODE = 'check_violation';
  END IF;
  IF (previa."profesional_id", previa."asesorado_id", previa."ejercicio_id") IS DISTINCT FROM (NEW."profesional_id", NEW."asesorado_id", NEW."ejercicio_id") THEN
    RAISE EXCEPTION 'BE: la sucesora de una serie observada es de la misma persona, profesional y ejercicio' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."posicion" <> previa."posicion" + 1 THEN
    RAISE EXCEPTION 'BE: la sucesora ocupa la posición siguiente de la cadena' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "serie_observada_sucesion" BEFORE INSERT ON "serie_observada" FOR EACH ROW EXECUTE FUNCTION "be_serie_observada_sucesion"();
