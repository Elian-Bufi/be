-- DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-05; docs/paquetes/WP-EDITOR-ENTRENAMIENTO-TANDA-3.md): lo que decide
-- Administración sobre las Plantillas de BE de Entrenamiento. Migración aditiva: un tipo y una tabla nuevos; nada de lo
-- anterior se toca. Las plantillas mismas son datos versionados de BE (packages/domain/src/plantillas-de-be.ts): esta
-- tabla solo guarda si cada una se ofrece o se retira, por su clave. Sin ninguna decisión, se ofrece.
-- CreateEnum
CREATE TYPE "EstadoDePlantillaDeBe" AS ENUM ('PUBLICADA', 'RETIRADA');

-- CreateTable
CREATE TABLE "decision_sobre_plantilla_de_be" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave" TEXT NOT NULL,
    "estado" "EstadoDePlantillaDeBe" NOT NULL,
    "motivo" TEXT,
    "administrador_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_sobre_plantilla_de_be_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decision_sobre_plantilla_de_be_clave_momento_de_registro_idx" ON "decision_sobre_plantilla_de_be"("clave", "momento_de_registro");

-- AddForeignKey
ALTER TABLE "decision_sobre_plantilla_de_be" ADD CONSTRAINT "decision_sobre_plantilla_de_be_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Garantías en la base: la clave de una plantilla de BE, la procedencia como objeto, el motivo acotado y solo al retirar,
-- y la decide un administrador con su rol vigente.
ALTER TABLE "decision_sobre_plantilla_de_be" ADD CONSTRAINT "decision_sobre_plantilla_de_be_clave" CHECK ("clave" ~ '^BE-[A-Z0-9-]{2,60}$');
ALTER TABLE "decision_sobre_plantilla_de_be" ADD CONSTRAINT "decision_sobre_plantilla_de_be_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "decision_sobre_plantilla_de_be" ADD CONSTRAINT "decision_sobre_plantilla_de_be_motivo" CHECK ("motivo" IS NULL OR ("estado" = 'RETIRADA' AND char_length(btrim("motivo")) BETWEEN 1 AND 500));
CREATE FUNCTION "be_decision_sobre_plantilla_de_be_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: una Plantilla de BE la decide un administrador con su rol vigente (DL-199)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "decision_sobre_plantilla_de_be_guardar" BEFORE INSERT ON "decision_sobre_plantilla_de_be" FOR EACH ROW EXECUTE FUNCTION "be_decision_sobre_plantilla_de_be_guardar"();

-- Historia por adición: ni UPDATE, ni DELETE, ni TRUNCATE.
CREATE TRIGGER "decision_sobre_plantilla_de_be_solo_agregar" BEFORE UPDATE OR DELETE ON "decision_sobre_plantilla_de_be" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "decision_sobre_plantilla_de_be_sin_truncate" BEFORE TRUNCATE ON "decision_sobre_plantilla_de_be" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
