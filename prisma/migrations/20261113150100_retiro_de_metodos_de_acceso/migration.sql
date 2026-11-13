-- RF-004 (DL-172; 09 v0.12 §12; 06 REG-06-22): administrar los métodos de acceso de una misma identidad. Solo agrega: un
-- tipo, una tabla y sus guardias. `metodo_de_acceso` sigue siendo de solo agregar (WP-02) y no se toca.
--
-- Retirar un método es una fila acá (RETIRO), y volver a vincular la misma cuenta de Google es otra (REASOCIACION): los
-- números impares son retiros y los pares, reasociaciones, así que un método vale cuando no tiene filas o tiene una
-- cantidad par. Por ahora solo se retira Google, y solo si la identidad conserva su contraseña: nunca queda sin un método
-- utilizable (04 RF-004; 09 v0.12 §12: «no permitir eliminar el último método de acceso utilizable»).

CREATE TYPE "AccionSobreMetodoDeAcceso" AS ENUM ('RETIRO', 'REASOCIACION');

CREATE TABLE "cambio_de_metodo_de_acceso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metodo_de_acceso_id" UUID NOT NULL,
    "identidad_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "accion" "AccionSobreMetodoDeAcceso" NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_metodo_de_acceso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cambio_de_metodo_de_acceso_metodo_de_acceso_id_numero_key" ON "cambio_de_metodo_de_acceso"("metodo_de_acceso_id", "numero");
CREATE INDEX "cambio_de_metodo_de_acceso_identidad_id_idx" ON "cambio_de_metodo_de_acceso"("identidad_id");
ALTER TABLE "cambio_de_metodo_de_acceso" ADD CONSTRAINT "cambio_de_metodo_de_acceso_metodo_de_acceso_id_fkey" FOREIGN KEY ("metodo_de_acceso_id") REFERENCES "metodo_de_acceso"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_metodo_de_acceso" ADD CONSTRAINT "cambio_de_metodo_de_acceso_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_metodo_de_acceso" ADD CONSTRAINT "cambio_de_metodo_de_acceso_alternado" CHECK (
  "numero" >= 1 AND (("numero" % 2 = 1) = ("accion" = 'RETIRO')));
ALTER TABLE "cambio_de_metodo_de_acceso" ADD CONSTRAINT "cambio_de_metodo_de_acceso_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- El método es de Google y de esa identidad; el número sigue al último; un retiro deja la contraseña. El método se toma
-- con FOR UPDATE: dos cambios simultáneos se ordenan, y el segundo choca con el número o con el índice único.
CREATE FUNCTION "be_cambio_de_metodo_de_acceso_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM "metodo_de_acceso" WHERE "id" = NEW."metodo_de_acceso_id" FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM "metodo_de_acceso" WHERE "id" = NEW."metodo_de_acceso_id" AND "identidad_id" = NEW."identidad_id" AND "tipo" = 'GOOGLE') THEN
    RAISE EXCEPTION 'BE: solo se retira o se reasocia un método de Google de la misma identidad' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" IS DISTINCT FROM (SELECT COALESCE(MAX("numero"), 0) + 1 FROM "cambio_de_metodo_de_acceso" WHERE "metodo_de_acceso_id" = NEW."metodo_de_acceso_id") THEN
    RAISE EXCEPTION 'BE: el cambio de un método de acceso sigue al último' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."accion" = 'RETIRO' AND NOT EXISTS (
    SELECT 1 FROM "metodo_de_acceso" m JOIN "credencial_local" c ON c."metodo_de_acceso_id" = m."id"
     WHERE m."identidad_id" = NEW."identidad_id" AND m."tipo" = 'LOCAL') THEN
    RAISE EXCEPTION 'BE: no se retira el último método de acceso utilizable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cambio_de_metodo_de_acceso_guardar" BEFORE INSERT ON "cambio_de_metodo_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_cambio_de_metodo_de_acceso_guardar"();
CREATE TRIGGER "cambio_de_metodo_de_acceso_solo_agregar" BEFORE UPDATE OR DELETE ON "cambio_de_metodo_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cambio_de_metodo_de_acceso_sin_truncate" BEFORE TRUNCATE ON "cambio_de_metodo_de_acceso" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
