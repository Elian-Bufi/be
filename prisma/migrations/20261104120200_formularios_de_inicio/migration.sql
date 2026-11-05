-- WP-FORMULARIOS-DE-INICIO (DEUDA_LEGAJO DL-164, ratificada por Dirección el 2026-11-04): RF-071 · UC-P32 · UC-P33 ·
-- REG-06-210 · 09v16.1 §22 · familia API-FRI-01 a 08 (D-5).
-- La propuesta del profesional (D-3): lo que cargó desde el escritorio con lo que la persona le contó, que espera que ella
-- lo confirme desde su app. Acompaña a la Solicitud mientras está pendiente y **no es un estado de la Solicitud**, que
-- sigue con sus dos (REG-06-210). Confirmar es responder (D-4): la Respuesta sigue siendo SELF_REPORTED y lleva escrita la
-- transcripción (quién cargó, cuándo, cuándo confirmó y qué corrigió). Lo no confirmado se borra (D-6): al rechazar o
-- retirar, las respuestas propuestas desaparecen y queda solo cómo y cuándo terminó.
-- Migración aditiva: un enum, una tabla y una columna nula; nada de lo anterior se reescribe.
-- 1. Enum, tabla, columna, índices y claves foráneas, en la forma que genera `prisma migrate diff` desde prisma/schema.prisma.
-- 2. Garantías en la base, aunque el código se equivoque:
--    - una sola propuesta PENDIENTE por Solicitud (índice único parcial);
--    - las respuestas propuestas existen solo mientras está PENDIENTE; resuelta, queda cuándo (CHECKs);
--    - la carga un profesional de la Solicitud, sobre una Solicitud sin Respuesta (trigger al insertar);
--    - una resuelta no vuelve a PENDIENTE ni cambia de ningún modo; una propuesta no cambia de Solicitud ni de profesional;
--      reemplazarla avanza su versión de a uno (trigger al actualizar);
--    - no se borra ni se trunca: la historia de cada propuesta queda (08 §29);
--    - la transcripción de una Respuesta nombra una propuesta de esa Solicitud y de ese profesional; `be_solo_agregar`
--      sigue impidiendo UPDATE y DELETE en respuesta_de_formulario, así que la transcripción se escribe en el INSERT.

-- CreateEnum
CREATE TYPE "EstadoDePropuestaDeRespuesta" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'RETIRADA');

-- AlterTable
ALTER TABLE "respuesta_de_formulario" ADD COLUMN     "transcripcion" JSONB;

-- CreateTable
CREATE TABLE "propuesta_de_respuesta_de_formulario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solicitud_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "contenido" JSONB,
    "estado" "EstadoDePropuestaDeRespuesta" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "cargada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_en" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propuesta_de_respuesta_de_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "propuesta_de_respuesta_de_formulario_solicitud_id_idx" ON "propuesta_de_respuesta_de_formulario"("solicitud_id");

-- CreateIndex
CREATE INDEX "propuesta_de_respuesta_de_formulario_profesional_id_idx" ON "propuesta_de_respuesta_de_formulario"("profesional_id");

-- AddForeignKey
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- Garantías de la base (DL-164). Prisma no representa triggers, CHECK ni índices parciales: por eso viven acá.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Una sola propuesta pendiente por Solicitud (D-3) ──────────────────────────────────────────────
CREATE UNIQUE INDEX "propuesta_de_respuesta_de_formulario_una_pendiente" ON "propuesta_de_respuesta_de_formulario" ("solicitud_id") WHERE "estado" = 'PENDIENTE';

-- ─── Coherencia de datos ──────────────────────────────────────────────────────────────────────────
-- Las respuestas propuestas existen solo mientras espera la confirmación (D-6); resuelta, se sabe cuándo.
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_contenido_segun_estado" CHECK (("estado" = 'PENDIENTE') = ("contenido" IS NOT NULL));
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_resuelta_segun_estado" CHECK (("estado" = 'PENDIENTE') = ("resuelta_en" IS NULL));
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_con_respuestas" CHECK (
  "contenido" IS NULL OR (jsonb_typeof("contenido" -> 'answers') = 'array' AND jsonb_array_length("contenido" -> 'answers') > 0));
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_resuelta_despues" CHECK ("resuelta_en" IS NULL OR "resuelta_en" >= "cargada_en");
ALTER TABLE "propuesta_de_respuesta_de_formulario" ADD CONSTRAINT "propuesta_de_respuesta_de_formulario_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── Quién la carga y sobre qué (D-3; REG-06-210) ─────────────────────────────────────────────────
-- Nace PENDIENTE, la carga el profesional de la Solicitud y la Solicitud no tiene Respuesta: respondida, no hay nada que
-- confirmar. El PDP de la API decide además el Vínculo, el Alcance y el B2 vigentes, como toda autorización.
CREATE FUNCTION "be_propuesta_de_respuesta_de_formulario_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."estado" <> 'PENDIENTE' THEN
    RAISE EXCEPTION 'BE: una propuesta de respuesta nace PENDIENTE (DL-164 D-3)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "solicitud_de_formulario" WHERE "id" = NEW."solicitud_id" AND "profesional_id" = NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: la propuesta la carga el profesional de la Solicitud (DL-164 D-3)' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM "respuesta_de_formulario" WHERE "solicitud_id" = NEW."solicitud_id") THEN
    RAISE EXCEPTION 'BE: una Solicitud respondida no admite propuestas (REG-06-210)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "propuesta_de_respuesta_de_formulario_insertar" BEFORE INSERT ON "propuesta_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_propuesta_de_respuesta_de_formulario_insertar"();

-- ─── Lo que puede cambiar en una propuesta ────────────────────────────────────────────────────────
-- Una resuelta no cambia más (ni vuelve a PENDIENTE); ninguna cambia de Solicitud ni de profesional. Mientras espera, un
-- reemplazo avanza la versión de a uno (es el token de `expectedVersion`) y la carga no retrocede en el tiempo; resolverla
-- (confirmar, rechazar, retirar) conserva la versión.
CREATE FUNCTION "be_propuesta_de_respuesta_de_formulario_actualizar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."id" <> OLD."id" OR NEW."solicitud_id" <> OLD."solicitud_id" OR NEW."profesional_id" <> OLD."profesional_id" OR NEW."momento_de_registro" <> OLD."momento_de_registro" THEN
    RAISE EXCEPTION 'BE: una propuesta no cambia de Solicitud ni de profesional (DL-164 D-3)' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."estado" <> 'PENDIENTE' THEN
    RAISE EXCEPTION 'BE: una propuesta resuelta (%) no cambia más (DL-164 D-6)', OLD."estado" USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."estado" = 'PENDIENTE' THEN
    IF NEW."version" <> OLD."version" + 1 OR NEW."cargada_en" < OLD."cargada_en" THEN
      RAISE EXCEPTION 'BE: reemplazar la propuesta avanza su versión de a uno' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW."version" <> OLD."version" THEN
    RAISE EXCEPTION 'BE: resolver la propuesta no cambia su versión' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "propuesta_de_respuesta_de_formulario_actualizar" BEFORE UPDATE ON "propuesta_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_propuesta_de_respuesta_de_formulario_actualizar"();

-- ─── La historia de cada propuesta queda: no se borra ni se trunca (08 §29) ───────────────────────
CREATE TRIGGER "propuesta_de_respuesta_de_formulario_sin_borrar" BEFORE DELETE ON "propuesta_de_respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "propuesta_de_respuesta_de_formulario_sin_truncate" BEFORE TRUNCATE ON "propuesta_de_respuesta_de_formulario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La transcripción de una Respuesta (D-4) ──────────────────────────────────────────────────────
-- Si la Respuesta nació de una propuesta, dice quién la cargó, cuál, cuándo, cuándo la confirmó la persona y qué
-- corrigió. Se escribe en el INSERT: la Respuesta sigue siendo de solo agregar (REG-06-14/15).
ALTER TABLE "respuesta_de_formulario" ADD CONSTRAINT "respuesta_de_formulario_transcripcion_completa" CHECK (
  "transcripcion" IS NULL OR (
    jsonb_typeof("transcripcion") = 'object'
    AND jsonb_typeof("transcripcion" -> 'professionalId') = 'string'
    AND jsonb_typeof("transcripcion" -> 'proposalId') = 'string'
    AND jsonb_typeof("transcripcion" -> 'loadedAt') = 'string'
    AND jsonb_typeof("transcripcion" -> 'confirmedAt') = 'string'
    AND jsonb_typeof("transcripcion" -> 'correctedFieldCodes') = 'array'));
CREATE FUNCTION "be_respuesta_de_formulario_transcripcion"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."transcripcion" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "propuesta_de_respuesta_de_formulario"
        WHERE "id"::text = NEW."transcripcion" ->> 'proposalId'
          AND "solicitud_id" = NEW."solicitud_id"
          AND "profesional_id"::text = NEW."transcripcion" ->> 'professionalId') THEN
    RAISE EXCEPTION 'BE: la transcripción nombra una propuesta de esta Solicitud y de ese profesional (DL-164 D-4)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "respuesta_de_formulario_transcripcion" BEFORE INSERT ON "respuesta_de_formulario" FOR EACH ROW EXECUTE FUNCTION "be_respuesta_de_formulario_transcripcion"();

-- ─── Las novedades de la propuesta nombran la Solicitud ───────────────────────────────────────────
-- Para que la pantalla que las resuelve sepa cuál abrir. El tipo se compara como texto: los valores se agregaron en la
-- migración 20261104120100.
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_propuesta_de_formulario_referenciada" CHECK (
  "tipo"::text NOT IN ('PROPUESTA_DE_FORMULARIO_CARGADA', 'PROPUESTA_DE_FORMULARIO_CONFIRMADA', 'PROPUESTA_DE_FORMULARIO_RECHAZADA')
  OR ("referencia_tipo" = 'SolicitudDeFormulario' AND "referencia_id" IS NOT NULL));
