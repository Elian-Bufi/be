-- WP-INVITACION (DEUDA_LEGAJO DL-136; aprobado por Dirección el 2026-10-16): el profesional invita con un enlace, un QR
-- (el mismo enlace) o un código corto, en lugar de que la persona le pase su identificador BE por fuera de BE (DL-035).
-- La invitación previa a Identidad BE del 06 §7.4, con token de un solo uso y vencimiento, persistido solo como hash
-- (08 §24.3). Usarla crea la solicitud de vínculo de REL-01 (REG-06-46: asociarla no acepta nada).
-- Migración aditiva: una enumeración y dos tablas nuevas, sin tocar las existentes.
-- 1. Tablas, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: las dos tablas solo se agregan; una sola resolución por
--    invitación (clave primaria); el token y el código, solo como SHA-256; la vigencia, de 7 días como máximo; y cada
--    resolución coherente con su invitación: la anula su profesional, la usa otra persona y nace la solicitud de ese
--    profesional para esa persona en ese alcance, y nada se resuelve después de vencer.

-- CreateEnum
CREATE TYPE "TipoDeResolucionDeInvitacion" AS ENUM ('USADA', 'REVOCADA');

-- CreateTable
CREATE TABLE "invitacion_de_vinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "hash_del_token" TEXT NOT NULL,
    "hash_del_codigo" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invitacion_de_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolucion_de_invitacion" (
    "invitacion_id" UUID NOT NULL,
    "tipo" "TipoDeResolucionDeInvitacion" NOT NULL,
    "actor_id" UUID NOT NULL,
    "solicitud_de_vinculo_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolucion_de_invitacion_pkey" PRIMARY KEY ("invitacion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitacion_de_vinculo_hash_del_token_key" ON "invitacion_de_vinculo"("hash_del_token");

-- CreateIndex
CREATE UNIQUE INDEX "invitacion_de_vinculo_hash_del_codigo_key" ON "invitacion_de_vinculo"("hash_del_codigo");

-- CreateIndex
CREATE INDEX "invitacion_de_vinculo_profesional_id_momento_de_registro_id_idx" ON "invitacion_de_vinculo"("profesional_id", "momento_de_registro" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "resolucion_de_invitacion_solicitud_de_vinculo_id_idx" ON "resolucion_de_invitacion"("solicitud_de_vinculo_id");

-- CreateIndex
CREATE INDEX "resolucion_de_invitacion_actor_id_idx" ON "resolucion_de_invitacion"("actor_id");

-- AddForeignKey
ALTER TABLE "invitacion_de_vinculo" ADD CONSTRAINT "invitacion_de_vinculo_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_invitacion" ADD CONSTRAINT "resolucion_de_invitacion_invitacion_id_fkey" FOREIGN KEY ("invitacion_id") REFERENCES "invitacion_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_invitacion" ADD CONSTRAINT "resolucion_de_invitacion_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "resolucion_de_invitacion" ADD CONSTRAINT "resolucion_de_invitacion_solicitud_de_vinculo_id_fkey" FOREIGN KEY ("solicitud_de_vinculo_id") REFERENCES "solicitud_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;



-- ─── Las invitaciones y sus resoluciones solo se agregan (08 §29) ──────────────────────────────────────────────────
CREATE TRIGGER "invitacion_de_vinculo_solo_agregar" BEFORE UPDATE OR DELETE ON "invitacion_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "invitacion_de_vinculo_sin_truncate" BEFORE TRUNCATE ON "invitacion_de_vinculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "resolucion_de_invitacion_solo_agregar" BEFORE UPDATE OR DELETE ON "resolucion_de_invitacion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "resolucion_de_invitacion_sin_truncate" BEFORE TRUNCATE ON "resolucion_de_invitacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La forma de una invitación ─────────────────────────────────────────────────────────────────────────────────────
-- La finalidad es la del alcance (DL-039), como en la solicitud que nacerá de ella.
ALTER TABLE "invitacion_de_vinculo" ADD CONSTRAINT "invitacion_de_vinculo_finalidad_del_alcance" CHECK (("finalidad" = "be_finalidad_de_alcance"("alcance")) IS TRUE);
-- Solo el SHA-256 en hexadecimal: un token o un código en claro no tienen esta forma (08 §24.3).
ALTER TABLE "invitacion_de_vinculo" ADD CONSTRAINT "invitacion_de_vinculo_solo_hashes" CHECK (
  "hash_del_token" ~ '^[0-9a-f]{64}$' AND "hash_del_codigo" ~ '^[0-9a-f]{64}$' AND "hash_del_token" <> "hash_del_codigo");
-- Vence después de crearse y, como máximo, a los 7 días que aprobó Dirección.
ALTER TABLE "invitacion_de_vinculo" ADD CONSTRAINT "invitacion_de_vinculo_vigencia" CHECK (
  "vence_en" > "momento_de_ocurrencia" AND "vence_en" <= "momento_de_ocurrencia" + interval '7 days');
ALTER TABLE "invitacion_de_vinculo" ADD CONSTRAINT "invitacion_de_vinculo_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── La forma de una resolución ─────────────────────────────────────────────────────────────────────────────────────
-- Usarla deja la solicitud que nació (o la equivalente pendiente); anularla, ninguna.
ALTER TABLE "resolucion_de_invitacion" ADD CONSTRAINT "resolucion_de_invitacion_solicitud_segun_tipo" CHECK (("tipo" = 'USADA') = ("solicitud_de_vinculo_id" IS NOT NULL));
ALTER TABLE "resolucion_de_invitacion" ADD CONSTRAINT "resolucion_de_invitacion_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── Quién invita: un profesional (el mismo control que la solicitud de vínculo) ────────────────────────────────────
CREATE FUNCTION "be_invitacion_de_vinculo_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: quien invita no tiene perfil profesional' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "invitacion_de_vinculo_guardar" BEFORE INSERT ON "invitacion_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_invitacion_de_vinculo_guardar"();

-- ─── Cada resolución, coherente con su invitación ───────────────────────────────────────────────────────────────────
-- Nada se resuelve antes de crearse ni después de vencer. La anula su profesional. La usa otra persona, y la solicitud
-- que queda es de ese profesional para esa persona, en el alcance y la finalidad de la invitación (REG-06-46: la
-- solicitud sigue su propia máquina; esta fila solo dice de qué invitación nació).
CREATE FUNCTION "be_resolucion_de_invitacion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_invitacion "invitacion_de_vinculo"%ROWTYPE;
BEGIN
  SELECT * INTO v_invitacion FROM "invitacion_de_vinculo" WHERE "id" = NEW."invitacion_id";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BE: la resolución no tiene invitación' USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF NEW."momento_de_ocurrencia" < v_invitacion."momento_de_ocurrencia" OR NEW."momento_de_ocurrencia" >= v_invitacion."vence_en" THEN
    RAISE EXCEPTION 'BE: una invitación se usa o se anula mientras está vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."tipo" = 'REVOCADA' AND NEW."actor_id" <> v_invitacion."profesional_id" THEN
    RAISE EXCEPTION 'BE: solo el profesional que la creó anula una invitación' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."tipo" = 'USADA' THEN
    IF NEW."actor_id" = v_invitacion."profesional_id" THEN
      RAISE EXCEPTION 'BE: el profesional no usa su propia invitación' USING ERRCODE = 'check_violation';
    END IF;
    -- Sin solicitud, la rechaza el CHECK `resolucion_de_invitacion_solicitud_segun_tipo`.
    IF NEW."solicitud_de_vinculo_id" IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM "solicitud_de_vinculo"
       WHERE "id" = NEW."solicitud_de_vinculo_id" AND "profesional_id" = v_invitacion."profesional_id"
         AND "asesorado_id" = NEW."actor_id" AND "alcance" = v_invitacion."alcance" AND "finalidad" = v_invitacion."finalidad") THEN
      RAISE EXCEPTION 'BE: la solicitud no es la de esta invitación para quien la usó' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "resolucion_de_invitacion_guardar" BEFORE INSERT ON "resolucion_de_invitacion" FOR EACH ROW EXECUTE FUNCTION "be_resolucion_de_invitacion_guardar"();
