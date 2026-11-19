-- WP-GRAFICOS (DL-174) · GR-27, los enfoques (pedido de Dirección del 2026-11-14; packages/domain/src/contratos-enfoques.ts):
-- los conjuntos de hasta seis gráficos con nombre que arma el profesional, y el que eligió para una persona o para uno de
-- sus planes (API-GRF-01 a 07). Son configuración —solo referencias a gráficos, series del catálogo, ejercicios y
-- medidas—: nunca datos de salud ni un permiso, porque abrir un enfoque vuelve a pedir cada lectura al PDP. Mutables, como
-- las vistas de «Analizar» (DL-128); cada escritura queda en la auditoría.
-- Solo agrega: un enumerado y dos tablas nuevos, sin tocar datos, tablas ni columnas existentes.
-- 1. Enumerado, tablas, índices y claves foráneas, los de prisma/schema.prisma (`prisma migrate diff`).
-- 2. Garantías en la base, aunque el código se equivoque: una elección por persona y una por plan, el ámbito coherente con
--    sus columnas, el enfoque y el plan del mismo profesional y de la misma persona, un nombre sin espacios en los bordes,
--    una versión positiva y un contenido que es un objeto.

-- CreateEnum
CREATE TYPE "AmbitoDeEleccionDeGraficos" AS ENUM ('PERSONA', 'PLAN_DE_ENTRENAMIENTO', 'PLAN_NUTRICIONAL');

-- CreateTable
CREATE TABLE "conjunto_de_graficos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conjunto_de_graficos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleccion_de_conjunto_de_graficos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "ambito" "AmbitoDeEleccionDeGraficos" NOT NULL,
    "plan_de_entrenamiento_id" UUID,
    "plan_nutricional_id" UUID,
    "conjunto_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eleccion_de_conjunto_de_graficos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conjunto_de_graficos_profesional_id_actualizacion_idx" ON "conjunto_de_graficos"("profesional_id", "momento_de_actualizacion");

-- CreateIndex
CREATE INDEX "eleccion_de_graficos_profesional_id_asesorado_id_idx" ON "eleccion_de_conjunto_de_graficos"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE INDEX "eleccion_de_conjunto_de_graficos_conjunto_id_idx" ON "eleccion_de_conjunto_de_graficos"("conjunto_id");

-- AddForeignKey
ALTER TABLE "conjunto_de_graficos" ADD CONSTRAINT "conjunto_de_graficos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_conjunto_de_graficos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_conjunto_de_graficos_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_conjunto_de_graficos_plan_de_entrenamiento_id_fkey" FOREIGN KEY ("plan_de_entrenamiento_id") REFERENCES "plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_conjunto_de_graficos_plan_nutricional_id_fkey" FOREIGN KEY ("plan_nutricional_id") REFERENCES "plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_conjunto_de_graficos_conjunto_id_fkey" FOREIGN KEY ("conjunto_id") REFERENCES "conjunto_de_graficos"("id") ON DELETE CASCADE ON UPDATE RESTRICT;


-- ─── El enfoque: un nombre visible, una versión que avanza y un contenido que es un objeto ───────────────────────────
-- El tope de 50 enfoques por profesional va en el servicio, como en las vistas de «Analizar».
ALTER TABLE "conjunto_de_graficos" ADD CONSTRAINT "conjunto_de_graficos_coherente" CHECK (
  "nombre" = btrim("nombre") AND char_length("nombre") BETWEEN 1 AND 80
  AND "version" >= 1
  AND jsonb_typeof("contenido") = 'object'
  AND jsonb_typeof("procedencia") = 'object');

-- ─── La elección: el ámbito coherente con sus columnas ───────────────────────────────────────────────────────────────
-- La de la persona, sin plan; la de un plan, solo con la columna de su área. Nunca de un profesional sobre sí mismo.
ALTER TABLE "eleccion_de_conjunto_de_graficos" ADD CONSTRAINT "eleccion_de_graficos_coherente" CHECK (
  "profesional_id" <> "asesorado_id"
  AND "version" >= 1
  AND jsonb_typeof("procedencia") = 'object'
  AND (("ambito" = 'PERSONA' AND "plan_de_entrenamiento_id" IS NULL AND "plan_nutricional_id" IS NULL)
    OR ("ambito" = 'PLAN_DE_ENTRENAMIENTO' AND "plan_de_entrenamiento_id" IS NOT NULL AND "plan_nutricional_id" IS NULL)
    OR ("ambito" = 'PLAN_NUTRICIONAL' AND "plan_nutricional_id" IS NOT NULL AND "plan_de_entrenamiento_id" IS NULL)));

-- ─── Una elección por persona y una por plan ─────────────────────────────────────────────────────────────────────────
-- Dos pestañas que eligen a la vez no pueden dejar dos: la segunda inserción falla y la API responde 409.
CREATE UNIQUE INDEX "eleccion_de_graficos_una_por_persona" ON "eleccion_de_conjunto_de_graficos" ("profesional_id", "asesorado_id") WHERE "ambito" = 'PERSONA';
CREATE UNIQUE INDEX "eleccion_de_graficos_una_por_plan_de_entrenamiento" ON "eleccion_de_conjunto_de_graficos" ("profesional_id", "plan_de_entrenamiento_id") WHERE "ambito" = 'PLAN_DE_ENTRENAMIENTO';
CREATE UNIQUE INDEX "eleccion_de_graficos_una_por_plan_nutricional" ON "eleccion_de_conjunto_de_graficos" ("profesional_id", "plan_nutricional_id") WHERE "ambito" = 'PLAN_NUTRICIONAL';

-- ─── El enfoque y el plan son del mismo profesional y de la misma persona ───────────────────────────────────────────
-- Un enfoque ajeno no se elige y un plan de otro profesional o de otra persona no se nombra, aunque el servicio se
-- equivocara (la API ya responde el 404 de lo inexistente antes de escribir).
CREATE FUNCTION "be_eleccion_de_graficos_de_su_profesional"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "conjunto_de_graficos" c WHERE c."id" = NEW."conjunto_id" AND c."profesional_id" = NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: el enfoque elegido es del mismo profesional' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."plan_de_entrenamiento_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "plan_de_entrenamiento" p
     WHERE p."id" = NEW."plan_de_entrenamiento_id" AND p."profesional_id" = NEW."profesional_id" AND p."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: el plan de la elección es del mismo profesional y de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."plan_nutricional_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "plan_nutricional" p
     WHERE p."id" = NEW."plan_nutricional_id" AND p."profesional_id" = NEW."profesional_id" AND p."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: el plan de la elección es del mismo profesional y de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "eleccion_de_graficos_de_su_profesional" BEFORE INSERT OR UPDATE ON "eleccion_de_conjunto_de_graficos" FOR EACH ROW EXECUTE FUNCTION "be_eleccion_de_graficos_de_su_profesional"();
