-- WP-HISTORIA-ANTERIOR (DEUDA_LEGAJO DL-175; 08 §14.1, «Cambio de profesional»: el nuevo profesional ve la historia previa
-- solo si el titular lo consiente; REG-06-55; RF-025). Decidido por Dirección el 2026-11-15 («Programarlo»). Migración que
-- solo agrega: un tipo, una tabla y sus guardias. Ninguna fila existente cambia.
-- - `autorizacion_de_historia_anterior`: la autorización de la persona para que el profesional de un componente de vínculo
--   vea su historia anterior de esa área. Versionada por componente (1, 2, 3…): darla y retirarla son filas nuevas que
--   suceden a la anterior. La VIGENTE guarda el texto aceptado y su hash (08 §12.2).
-- Garantías en la base, aunque el código se equivoque:
--   - solo se agrega, también frente a TRUNCATE (08 §29);
--   - la da y la retira la persona del componente, y el profesional y el área son los de ese componente;
--   - cada versión sucede a la última del mismo componente, sin bifurcar la cadena;
--   - una VIGENTE lleva su texto y su hash, una RETIRADA no lleva ninguno, y no se da sobre un componente terminado.
-- Las lecturas del profesional (API-HIA-04) quedan en `decision_de_acceso`, como toda decisión del PDP: la persona las ve.

-- CreateEnum
CREATE TYPE "EstadoDeAutorizacionDeHistoriaAnterior" AS ENUM ('VIGENTE', 'RETIRADA');

-- CreateTable
CREATE TABLE "autorizacion_de_historia_anterior" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "alcance_de_vinculo_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "predecesora_id" UUID,
    "estado" "EstadoDeAutorizacionDeHistoriaAnterior" NOT NULL,
    "texto_id" TEXT,
    "hash_del_texto" TEXT,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizacion_de_historia_anterior_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_historia_anterior_predecesora_id_key" ON "autorizacion_de_historia_anterior"("predecesora_id");

-- CreateIndex
CREATE INDEX "autorizacion_de_historia_anterior_asesorado_id_idx" ON "autorizacion_de_historia_anterior"("asesorado_id");

-- CreateIndex
CREATE INDEX "autorizacion_de_historia_anterior_lector_idx" ON "autorizacion_de_historia_anterior"("profesional_id", "asesorado_id", "alcance");

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_historia_anterior_componente_version_key" ON "autorizacion_de_historia_anterior"("alcance_de_vinculo_id", "version");

-- AddForeignKey
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "autorizacion_de_historia_anterior"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── Solo se agrega (08 §29) ────────────────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER "autorizacion_de_historia_anterior_solo_agregar" BEFORE UPDATE OR DELETE ON "autorizacion_de_historia_anterior" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "autorizacion_de_historia_anterior_sin_truncate" BEFORE TRUNCATE ON "autorizacion_de_historia_anterior" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La forma de cada fila ──────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_primera_sin_predecesora" CHECK (("version" = 1) = ("predecesora_id" IS NULL));
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_texto_solo_al_darla" CHECK (
  ("estado" = 'VIGENTE') = ("texto_id" IS NOT NULL)
  AND ("estado" = 'VIGENTE') = ("hash_del_texto" IS NOT NULL)
  AND ("texto_id" IS NULL OR char_length("texto_id") BETWEEN 1 AND 120)
  AND ("hash_del_texto" IS NULL OR "hash_del_texto" ~ '^[0-9a-f]{64}$'));
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_la_da_la_persona" CHECK ("actor_id" = "asesorado_id");
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_no_a_si_misma" CHECK ("profesional_id" <> "asesorado_id");
ALTER TABLE "autorizacion_de_historia_anterior" ADD CONSTRAINT "autorizacion_de_historia_anterior_procedencia_es_objeto" CHECK (COALESCE(jsonb_typeof("procedencia") = 'object', FALSE));

-- ─── Cada versión es del componente que nombra y sucede a la última del mismo componente ────────────────────────────
-- El componente tiene que ser de un vínculo de esa persona con ese profesional, en esa área. La primera versión no tiene
-- predecesora y es la única primera del componente; las siguientes suceden a la última. Una VIGENTE no se da sobre un
-- componente terminado (una RETIRADA, sí: retirar siempre se puede).
CREATE FUNCTION "be_autorizacion_de_historia_anterior_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_estado "EstadoDeAlcanceDeVinculo";
BEGIN
  SELECT av."estado" INTO v_estado
    FROM "alcance_de_vinculo" av JOIN "vinculo" v ON v."id" = av."vinculo_id"
   WHERE av."id" = NEW."alcance_de_vinculo_id" AND v."asesorado_id" = NEW."asesorado_id" AND v."profesional_id" = NEW."profesional_id"
     AND av."alcance" = NEW."alcance";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BE: la autorización de la historia anterior nombra un componente de esa persona con ese profesional, en esa área' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."estado" = 'VIGENTE' AND v_estado = 'FINALIZADO' THEN
    RAISE EXCEPTION 'BE: la historia anterior no se autoriza sobre un vínculo terminado' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."predecesora_id" IS NULL THEN
    IF EXISTS (SELECT 1 FROM "autorizacion_de_historia_anterior" WHERE "alcance_de_vinculo_id" = NEW."alcance_de_vinculo_id") THEN
      RAISE EXCEPTION 'BE: la autorización de la historia anterior de este componente ya tiene una primera versión' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM "autorizacion_de_historia_anterior"
     WHERE "id" = NEW."predecesora_id" AND "alcance_de_vinculo_id" = NEW."alcance_de_vinculo_id" AND "version" = NEW."version" - 1
       AND "version" = (SELECT MAX("version") FROM "autorizacion_de_historia_anterior" WHERE "alcance_de_vinculo_id" = NEW."alcance_de_vinculo_id")) THEN
    RAISE EXCEPTION 'BE: una versión de la autorización de la historia anterior sucede a la última del mismo componente' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "autorizacion_de_historia_anterior_guardar" BEFORE INSERT ON "autorizacion_de_historia_anterior" FOR EACH ROW EXECUTE FUNCTION "be_autorizacion_de_historia_anterior_guardar"();
