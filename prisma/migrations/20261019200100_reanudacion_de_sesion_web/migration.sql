-- DL-147 (encargo de consolidación de Dirección del 2026-10-19, bloque 3): la sesión del website sobrevive a una recarga.
-- Es el «refresh rotativo» que el 07 prevé para el website (07:789 y §43-bis: «cookie httpOnly para web»), hecho como
-- reanudación de la misma sesión: no abre otra ni extiende su vencimiento.
-- - Al iniciar sesión en el website, la API manda una cookie HttpOnly, Secure, SameSite=None y Partitioned, solo para
--   /api/v1/auth/sessions, con un secreto al azar. Acá se guarda su huella (SHA-256), nunca el secreto.
-- - Reanudar presenta la cookie, recibe un token nuevo de la misma sesión y una cookie nueva. Cada reanudación agrega una
--   fila que reemplaza a la anterior (cadena por `predecesora_id`, única: no hay dos sucesoras), y la vigente es la que no
--   tiene sucesora. Una reemplazada sirve solo dentro de un margen corto (dos pestañas que recargan a la vez); fuera de él,
--   revoca la sesión (REANUDACION_REUTILIZADA).
-- - La sesión decide todo lo demás: una finalizada, revocada, vencida o con otra versión de control no se reanuda.
-- Solo se agrega, y solo para una sesión del website que esté activa.

CREATE TABLE "reanudacion_de_sesion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sesion_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "huella" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reanudacion_de_sesion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reanudacion_de_sesion_huella_es_sha256" CHECK ("huella" ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX "reanudacion_de_sesion_predecesora_id_key" ON "reanudacion_de_sesion"("predecesora_id");
CREATE UNIQUE INDEX "reanudacion_de_sesion_huella_key" ON "reanudacion_de_sesion"("huella");
CREATE INDEX "reanudacion_de_sesion_sesion_id_idx" ON "reanudacion_de_sesion"("sesion_id");

ALTER TABLE "reanudacion_de_sesion" ADD CONSTRAINT "reanudacion_de_sesion_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "reanudacion_de_sesion" ADD CONSTRAINT "reanudacion_de_sesion_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "reanudacion_de_sesion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Solo una sesión activa del website se reanuda; la primera fila de una sesión no tiene predecesora, y las demás
-- reemplazan a una de la misma sesión.
CREATE FUNCTION "be_reanudacion_de_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "sesion" s WHERE s."id" = NEW."sesion_id" AND s."superficie" = 'WEB' AND s."estado" = 'ACTIVA') THEN
    RAISE EXCEPTION 'BE: solo una sesión activa del website se reanuda' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."predecesora_id" IS NULL THEN
    IF EXISTS (SELECT 1 FROM "reanudacion_de_sesion" r WHERE r."sesion_id" = NEW."sesion_id") THEN
      RAISE EXCEPTION 'BE: una sesión tiene una sola reanudación inicial' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM "reanudacion_de_sesion" r WHERE r."id" = NEW."predecesora_id" AND r."sesion_id" = NEW."sesion_id") THEN
    RAISE EXCEPTION 'BE: una reanudación reemplaza a otra de la misma sesión' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "reanudacion_de_sesion_guardar" BEFORE INSERT ON "reanudacion_de_sesion" FOR EACH ROW EXECUTE FUNCTION "be_reanudacion_de_sesion_guardar"();

-- Solo se agrega: la historia de las reanudaciones no se reescribe.
CREATE TRIGGER "reanudacion_de_sesion_solo_agregar" BEFORE UPDATE OR DELETE ON "reanudacion_de_sesion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "reanudacion_de_sesion_sin_truncate" BEFORE TRUNCATE ON "reanudacion_de_sesion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
