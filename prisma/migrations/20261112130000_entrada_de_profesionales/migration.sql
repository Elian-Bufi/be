-- UF-04 de WP-USO-FINAL (DL-169; UF-D6 a UF-D8): la entrada de los profesionales reales. Solo agrega: dos columnas nulas,
-- una tabla nueva y una guardia que reemplaza a la de «solo agregar» del perfil profesional sin aflojar nada de lo demás.
-- Ninguna fila cambia: los perfiles que ya existen quedan sin matrícula y con su nombre.

-- ─── 1. La matrícula verificada (UF-D8) ────────────────────────────────────────────────────────────────────────────────
-- Las dos partes juntas o ninguna; la API la exige a un sanitario incorporado por Administración (API-ADM-14). Los perfiles
-- de la siembra y de las pruebas no la tienen.
ALTER TABLE "perfil_profesional" ADD COLUMN "matricula_numero" TEXT;
ALTER TABLE "perfil_profesional" ADD COLUMN "matricula_jurisdiccion" TEXT;
ALTER TABLE "perfil_profesional" ADD CONSTRAINT "perfil_profesional_matricula_completa" CHECK (("matricula_numero" IS NULL) = ("matricula_jurisdiccion" IS NULL));
ALTER TABLE "perfil_profesional" ADD CONSTRAINT "perfil_profesional_matricula_acotada" CHECK (
  "matricula_numero" IS NULL OR (char_length("matricula_numero") BETWEEN 1 AND 40 AND char_length("matricula_jurisdiccion") BETWEEN 1 AND 80));
ALTER TABLE "perfil_profesional" ADD CONSTRAINT "perfil_profesional_matricula_de_sanitario" CHECK ("matricula_numero" IS NULL OR "tipo" = 'SANITARIO');

-- ─── 2. Los cambios del nombre profesional (API-ADM-15, UF-D7) ────────────────────────────────────────────────────────
-- La historia del nombre: cada cambio con el anterior, el nuevo, el fundamento y el administrador que lo hizo. Solo se
-- agrega. `transaccion` ata el cambio al UPDATE del perfil de la misma transacción (ver la guardia de abajo).
CREATE TABLE "cambio_de_nombre_profesional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "nombre_anterior" TEXT NOT NULL,
    "nombre_nuevo" TEXT NOT NULL,
    "fundamento" TEXT NOT NULL,
    "administrador_id" UUID NOT NULL,
    "transaccion" BIGINT NOT NULL DEFAULT txid_current(),
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_nombre_profesional_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cambio_de_nombre_profesional_identidad_id_idx" ON "cambio_de_nombre_profesional"("identidad_id");
CREATE INDEX "cambio_de_nombre_profesional_administrador_id_idx" ON "cambio_de_nombre_profesional"("administrador_id");
ALTER TABLE "cambio_de_nombre_profesional" ADD CONSTRAINT "cambio_de_nombre_profesional_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_nombre_profesional" ADD CONSTRAINT "cambio_de_nombre_profesional_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_nombre_profesional" ADD CONSTRAINT "cambio_de_nombre_profesional_textos" CHECK (
  char_length("nombre_nuevo") BETWEEN 1 AND 60 AND "nombre_nuevo" <> "nombre_anterior" AND char_length("fundamento") BETWEEN 1 AND 1000);
ALTER TABLE "cambio_de_nombre_profesional" ADD CONSTRAINT "cambio_de_nombre_profesional_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Lo decide un administrador con el rol vigente, y nadie cambia su propio nombre profesional.
CREATE FUNCTION "be_cambio_de_nombre_profesional_administrador"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un cambio del nombre profesional exige un rol administrativo vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."administrador_id" = NEW."identidad_id" THEN
    RAISE EXCEPTION 'BE: nadie cambia su propio nombre profesional' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cambio_de_nombre_profesional_administrador" BEFORE INSERT ON "cambio_de_nombre_profesional" FOR EACH ROW EXECUTE FUNCTION "be_cambio_de_nombre_profesional_administrador"();
CREATE TRIGGER "cambio_de_nombre_profesional_solo_agregar" BEFORE UPDATE OR DELETE ON "cambio_de_nombre_profesional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cambio_de_nombre_profesional_sin_truncate" BEFORE TRUNCATE ON "cambio_de_nombre_profesional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── 3. El perfil profesional: sigue siendo de solo agregar, salvo el cambio de nombre con su hecho ────────────────────
-- Hasta acá el perfil era de solo agregar (`be_solo_agregar`). Desde UF-04, la única excepción es el nombre: un UPDATE
-- que cambia solo el nombre pasa si en la misma transacción se registró su cambio, con ese nombre anterior y ese nuevo.
-- Cualquier otro UPDATE (aunque no cambie nada) y todo DELETE se rechazan con el mismo mensaje de antes.
CREATE FUNCTION "be_perfil_profesional_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (NEW."id", NEW."identidad_id", NEW."tipo", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro", NEW."matricula_numero", NEW."matricula_jurisdiccion")
         IS NOT DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."tipo", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro", OLD."matricula_numero", OLD."matricula_jurisdiccion")
     AND NEW."nombre_visible" IS DISTINCT FROM OLD."nombre_visible"
     AND EXISTS (
       SELECT 1 FROM "cambio_de_nombre_profesional" c
        WHERE c."identidad_id" = NEW."identidad_id" AND c."nombre_anterior" = OLD."nombre_visible"
          AND c."nombre_nuevo" = NEW."nombre_visible" AND c."transaccion" = txid_current())
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: % es append-only (historia por adición; el nombre profesional cambia solo con su cambio registrado)', TG_TABLE_NAME USING ERRCODE = 'restrict_violation';
END $$;
DROP TRIGGER "perfil_profesional_solo_agregar" ON "perfil_profesional";
CREATE TRIGGER "perfil_profesional_guardar" BEFORE UPDATE OR DELETE ON "perfil_profesional" FOR EACH ROW EXECUTE FUNCTION "be_perfil_profesional_guardar"();
