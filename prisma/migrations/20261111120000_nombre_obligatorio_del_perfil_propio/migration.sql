-- WP-USO-FINAL · UF-01 (DEUDA_LEGAJO DL-169, UF-D3, ratificada por Dirección el 2026-11-11): el nombre visible es
-- obligatorio. Se cambia, pero no se quita: una versión NUEVA del perfil propio lleva el nombre.
-- Migración de solo agregar: una función y un disparador; no toca ninguna fila. Las versiones guardadas antes con el
-- nombre en NULL (las cuentas de antes que lo quitaron) quedan en la historia, que es de solo agregar: por eso es un
-- disparador sobre lo que se inserta y no un CHECK, que exigiría el nombre también en las filas viejas.
-- La API ya lo rechaza (API-ACC-06 responde 422 INVALID_PROFILE_DATA con DISPLAY_NAME_REQUIRED); la base lo sostiene
-- aunque el código se equivoque, como el resto de las garantías del perfil propio (20261015180000).

CREATE FUNCTION "be_version_de_perfil_propio_con_nombre"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."nombre_visible" IS NULL THEN
    RAISE EXCEPTION 'BE: una versión nueva del perfil propio lleva el nombre visible (DL-169)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "version_de_perfil_propio_con_nombre" BEFORE INSERT ON "version_de_perfil_propio"
  FOR EACH ROW EXECUTE FUNCTION "be_version_de_perfil_propio_con_nombre"();
