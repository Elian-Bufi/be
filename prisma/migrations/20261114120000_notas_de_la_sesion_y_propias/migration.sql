-- WP-PULIDO-GRANDES (DL-173): PG-15, la nota para tu profe (PG-D10), y PG-16, las notas propias del profesional (PG-D11),
-- las dos aprobadas por Dirección el 2026-11-14. Solo agrega: un tipo, tres tablas y sus guardias. Ninguna fila existente
-- cambia, y la ejecución registrada tampoco: la nota viaja aparte de confirmar (DL-137 D-7).
-- - `nota_de_ejecucion` (API-TRN-25): lo que la persona deja en una sesión suya, para su profesional. Solo se agrega.
-- - `nota_propia` y `archivo_de_nota_propia` (API-NPP-01 a 03): la nota que un profesional escribe para sí sobre una
--   persona, y su archivo. Archivar no borra: la nota queda, y el archivo es otra fila.

-- CreateEnum
CREATE TYPE "AnclaDeNotaPropia" AS ENUM ('EJERCICIO', 'COMIDA');

-- CreateTable
CREATE TABLE "nota_de_ejecucion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejecucion_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_de_ejecucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_propia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "ancla" "AnclaDeNotaPropia",
    "ejercicio_id" UUID,
    "comida" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_propia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivo_de_nota_propia" (
    "nota_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivo_de_nota_propia_pkey" PRIMARY KEY ("nota_id")
);

-- CreateIndex
CREATE INDEX "nota_de_ejecucion_ejecucion_id_momento_de_registro_idx" ON "nota_de_ejecucion"("ejecucion_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "nota_de_ejecucion_asesorado_id_idx" ON "nota_de_ejecucion"("asesorado_id");

-- CreateIndex
CREATE INDEX "nota_propia_profesional_id_asesorado_id_idx" ON "nota_propia"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE INDEX "nota_propia_asesorado_id_idx" ON "nota_propia"("asesorado_id");

-- AddForeignKey
ALTER TABLE "nota_de_ejecucion" ADD CONSTRAINT "nota_de_ejecucion_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_de_ejecucion" ADD CONSTRAINT "nota_de_ejecucion_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_propia" ADD CONSTRAINT "nota_propia_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_propia" ADD CONSTRAINT "nota_propia_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nota_propia" ADD CONSTRAINT "nota_propia_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "archivo_de_nota_propia" ADD CONSTRAINT "archivo_de_nota_propia_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota_propia"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "archivo_de_nota_propia" ADD CONSTRAINT "archivo_de_nota_propia_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── Las guardias de la nota para tu profe (PG-15) ───────────────────────────────────────────────────────────────────
ALTER TABLE "nota_de_ejecucion" ADD CONSTRAINT "nota_de_ejecucion_coherente" CHECK (
  char_length("texto") BETWEEN 1 AND 280 AND jsonb_typeof("procedencia") = 'object');

-- La escribe la persona de la sesión: nunca otra, aunque el servicio se equivoque.
CREATE FUNCTION "be_nota_de_ejecucion_de_su_persona"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "ejecucion_de_entrenamiento" x WHERE x."id" = NEW."ejecucion_id" AND x."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: la nota de una sesión es de la persona que la registró' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "nota_de_ejecucion_de_su_persona" BEFORE INSERT ON "nota_de_ejecucion" FOR EACH ROW EXECUTE FUNCTION "be_nota_de_ejecucion_de_su_persona"();

-- Solo agregar (08 §29): una nota no se cambia ni se borra; una nueva queda debajo.
CREATE TRIGGER "nota_de_ejecucion_solo_agregar" BEFORE UPDATE OR DELETE ON "nota_de_ejecucion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nota_de_ejecucion_sin_truncate" BEFORE TRUNCATE ON "nota_de_ejecucion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Las guardias de las notas propias del profesional (PG-16) ───────────────────────────────────────────────────────
-- El ancla es coherente con su tipo: sin ancla, nada; un ejercicio, su identificador; una comida, su nombre (hasta 80).
ALTER TABLE "nota_propia" ADD CONSTRAINT "nota_propia_coherente" CHECK (
  char_length("texto") BETWEEN 1 AND 1000
  AND "profesional_id" <> "asesorado_id"
  AND jsonb_typeof("procedencia") = 'object'
  AND (("ancla" IS NULL AND "ejercicio_id" IS NULL AND "comida" IS NULL)
    OR ("ancla" = 'EJERCICIO' AND "ejercicio_id" IS NOT NULL AND "comida" IS NULL)
    OR ("ancla" = 'COMIDA' AND "ejercicio_id" IS NULL AND char_length("comida") BETWEEN 1 AND 80)));
ALTER TABLE "archivo_de_nota_propia" ADD CONSTRAINT "archivo_de_nota_propia_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- Una nota propia la archiva su autor, una sola vez (la clave primaria es la nota).
CREATE FUNCTION "be_archivo_de_nota_propia_de_su_autor"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "nota_propia" n WHERE n."id" = NEW."nota_id" AND n."profesional_id" = NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: una nota propia la archiva su autor' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "archivo_de_nota_propia_de_su_autor" BEFORE INSERT ON "archivo_de_nota_propia" FOR EACH ROW EXECUTE FUNCTION "be_archivo_de_nota_propia_de_su_autor"();

-- Solo agregar (08 §29): ni la nota ni su archivo se cambian o se borran.
CREATE TRIGGER "nota_propia_solo_agregar" BEFORE UPDATE OR DELETE ON "nota_propia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nota_propia_sin_truncate" BEFORE TRUNCATE ON "nota_propia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "archivo_de_nota_propia_solo_agregar" BEFORE UPDATE OR DELETE ON "archivo_de_nota_propia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "archivo_de_nota_propia_sin_truncate" BEFORE TRUNCATE ON "archivo_de_nota_propia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
