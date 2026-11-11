-- WP-FORMULARIOS-RONDA-2, ronda 2.1 · FR-14 (DEUDA_LEGAJO DL-165, D-17 nueva de Dirección del 2026-11-06): «Pedir acceso a
-- sus hábitos». Migración aditiva: una enumeración y una tabla nuevas; no cambia nada que ya exista.
-- - `pedido_de_acceso_a_habitos`: un profesional le pide a la persona ver sus hábitos, desde un componente de vínculo suyo con
--   ella. No cambia ningún acceso: lo decide la persona, con «Sí, que los vea» (es compartir, API-HBT-03 o 09) o «No, por
--   ahora». Un pedido nuevo del mismo profesional, a los 7 días del último, reemplaza al pendiente (D-24).
-- Garantías en la base, aunque el código se equivoque:
--   - una sola pendiente por profesional y por persona;
--   - nace PENDIENTE, en su versión 1, desde un componente de vínculo de ese profesional con esa persona y de esa área;
--   - resuelto, se sabe cuándo, y no cambia más; mientras espera, solo cambia su estado (y su momento de resolución);
--   - no se borra ni se trunca (08 §29);
--   - la novedad del pedido nombra el pedido.
-- Datos sintéticos en `test`. Con personas reales, después de la revisión legal y del gate del 08 §42, como D-9.

-- 1. La enumeración, la tabla, los índices y las claves foráneas, generados desde prisma/schema.prisma con
--    `prisma migrate diff` (los valores de enum, en la migración 20261106120100).
-- CreateEnum
CREATE TYPE "EstadoDePedidoDeAccesoAHabitos" AS ENUM ('PENDIENTE', 'ACEPTADO', 'NO_POR_AHORA', 'REEMPLAZADO');

-- CreateTable
CREATE TABLE "pedido_de_acceso_a_habitos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "alcance_de_vinculo_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "estado" "EstadoDePedidoDeAccesoAHabitos" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "pedido_en" TIMESTAMPTZ(3) NOT NULL,
    "resuelto_en" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_de_acceso_a_habitos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_habitos_asesorado_id_estado_idx" ON "pedido_de_acceso_a_habitos"("asesorado_id", "estado");

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_habitos_profesional_id_asesorado_id_idx" ON "pedido_de_acceso_a_habitos"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_habitos_alcance_de_vinculo_id_idx" ON "pedido_de_acceso_a_habitos"("alcance_de_vinculo_id");

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- 2. Garantías de la base. Prisma no representa triggers, CHECK ni índices parciales: por eso viven acá.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Una sola pendiente por profesional y por persona (D-24) ──────────────────────────────────────
CREATE UNIQUE INDEX "pedido_de_acceso_a_habitos_una_pendiente" ON "pedido_de_acceso_a_habitos" ("profesional_id", "asesorado_id") WHERE "estado" = 'PENDIENTE';

-- ─── Coherencia de datos ──────────────────────────────────────────────────────────────────────────
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_resuelto_segun_estado" CHECK (("estado" = 'PENDIENTE') = ("resuelto_en" IS NULL));
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_resuelto_despues" CHECK ("resuelto_en" IS NULL OR "resuelto_en" >= "pedido_en");
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_no_a_si_mismo" CHECK ("profesional_id" <> "asesorado_id");
ALTER TABLE "pedido_de_acceso_a_habitos" ADD CONSTRAINT "pedido_de_acceso_a_habitos_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── Quién lo hace y desde dónde ──────────────────────────────────────────────────────────────────
-- Nace PENDIENTE, en su versión 1, y desde un componente de vínculo de ese profesional con esa persona, de esa área. Que el
-- componente esté aceptado (ni en pausa ni terminado), con su B2 y el A3 de la persona, lo decide el PDP de la API.
CREATE FUNCTION "be_pedido_de_acceso_a_habitos_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."estado" <> 'PENDIENTE' OR NEW."version" <> 1 THEN
    RAISE EXCEPTION 'BE: un pedido de acceso a los hábitos nace PENDIENTE, en su versión 1 (DL-165 D-24)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
       SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
        WHERE av."id" = NEW."alcance_de_vinculo_id" AND av."alcance" = NEW."alcance"
          AND vi."profesional_id" = NEW."profesional_id" AND vi."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: el pedido sale de un componente de vínculo de ese profesional con esa persona, de esa área (DL-165 D-23)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "pedido_de_acceso_a_habitos_insertar" BEFORE INSERT ON "pedido_de_acceso_a_habitos" FOR EACH ROW EXECUTE FUNCTION "be_pedido_de_acceso_a_habitos_insertar"();

-- ─── Lo que puede cambiar en un pedido ────────────────────────────────────────────────────────────
-- Solo se resuelve, una vez: de PENDIENTE a otro estado, con su momento. No cambia de profesional, de persona, de
-- componente ni de versión, y no vuelve a PENDIENTE.
CREATE FUNCTION "be_pedido_de_acceso_a_habitos_actualizar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."id" <> OLD."id" OR NEW."profesional_id" <> OLD."profesional_id" OR NEW."asesorado_id" <> OLD."asesorado_id"
     OR NEW."alcance_de_vinculo_id" <> OLD."alcance_de_vinculo_id" OR NEW."alcance" <> OLD."alcance" OR NEW."version" <> OLD."version"
     OR NEW."pedido_en" <> OLD."pedido_en" OR NEW."procedencia" <> OLD."procedencia" OR NEW."momento_de_registro" <> OLD."momento_de_registro" THEN
    RAISE EXCEPTION 'BE: un pedido de acceso solo se resuelve: no cambia nada más (DL-165 D-24)' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."estado" <> 'PENDIENTE' OR NEW."estado" = 'PENDIENTE' THEN
    RAISE EXCEPTION 'BE: un pedido de acceso se resuelve una sola vez (estaba %)', OLD."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "pedido_de_acceso_a_habitos_actualizar" BEFORE UPDATE ON "pedido_de_acceso_a_habitos" FOR EACH ROW EXECUTE FUNCTION "be_pedido_de_acceso_a_habitos_actualizar"();

-- ─── La historia de cada pedido queda: no se borra ni se trunca (08 §29) ──────────────────────────
CREATE TRIGGER "pedido_de_acceso_a_habitos_sin_borrar" BEFORE DELETE ON "pedido_de_acceso_a_habitos" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "pedido_de_acceso_a_habitos_sin_truncate" BEFORE TRUNCATE ON "pedido_de_acceso_a_habitos" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La novedad del pedido lo nombra ──────────────────────────────────────────────────────────────
-- Para que «Mis hábitos» sepa cuál responder. El tipo se compara como texto: el valor se agregó en la migración
-- 20261106120100.
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_pedido_de_acceso_a_habitos_referenciado" CHECK (
  "tipo"::text <> 'PEDIDO_DE_ACCESO_A_HABITOS'
  OR ("referencia_tipo" = 'PedidoDeAccesoAHabitos' AND "referencia_id" IS NOT NULL));
