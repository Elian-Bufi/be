-- UF-11 de WP-USO-FINAL (DL-169; UF-T56, revisión adversarial de la etapa 2): Administración restablece el segundo factor de
-- un profesional (API-ADM-19). Solo agrega una tabla: ninguna fila cambia. Restablecer revoca el autenticador activo,
-- descarta uno pendiente, invalida los códigos de recuperación y cierra las sesiones, con las transiciones que ya existen
-- (`factor_totp`, `codigo_de_recuperacion` y `sesion`); acá queda el hecho, con el fundamento y el administrador.
CREATE TABLE "restablecimiento_de_segundo_factor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "administrador_id" UUID NOT NULL,
    "fundamento" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restablecimiento_de_segundo_factor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "restablecimiento_de_segundo_factor_identidad_id_idx" ON "restablecimiento_de_segundo_factor"("identidad_id");
CREATE INDEX "restablecimiento_de_segundo_factor_administrador_id_idx" ON "restablecimiento_de_segundo_factor"("administrador_id");
ALTER TABLE "restablecimiento_de_segundo_factor" ADD CONSTRAINT "restablecimiento_de_segundo_factor_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "restablecimiento_de_segundo_factor" ADD CONSTRAINT "restablecimiento_de_segundo_factor_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "restablecimiento_de_segundo_factor" ADD CONSTRAINT "restablecimiento_de_segundo_factor_fundamento" CHECK (char_length("fundamento") BETWEEN 1 AND 1000);
ALTER TABLE "restablecimiento_de_segundo_factor" ADD CONSTRAINT "restablecimiento_de_segundo_factor_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Lo decide un administrador con el rol vigente, sobre un profesional, y nadie restablece el propio.
CREATE FUNCTION "be_restablecimiento_de_segundo_factor_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un restablecimiento del segundo factor exige un rol administrativo vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."administrador_id" = NEW."identidad_id" THEN
    RAISE EXCEPTION 'BE: nadie restablece su propio segundo factor' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."identidad_id") THEN
    RAISE EXCEPTION 'BE: el segundo factor que se restablece es el de un profesional' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "restablecimiento_de_segundo_factor_coherente" BEFORE INSERT ON "restablecimiento_de_segundo_factor" FOR EACH ROW EXECUTE FUNCTION "be_restablecimiento_de_segundo_factor_coherente"();
CREATE TRIGGER "restablecimiento_de_segundo_factor_solo_agregar" BEFORE UPDATE OR DELETE ON "restablecimiento_de_segundo_factor" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "restablecimiento_de_segundo_factor_sin_truncate" BEFORE TRUNCATE ON "restablecimiento_de_segundo_factor" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
