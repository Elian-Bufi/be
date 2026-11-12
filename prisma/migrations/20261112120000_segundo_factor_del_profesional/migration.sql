-- UF-11 de WP-USO-FINAL (DL-169; UF-D12; 08 §25 y §42, condición 6): el segundo factor del profesional sobre su sesión
-- común. Solo agrega: no crea ni borra tablas ni columnas, y no toca ninguna fila. La tabla del segundo factor de cada
-- sesión (WP-ADMINISTRACION, 20261025120100) admitía solo sesiones ADMINISTRATIVAS; desde acá admite también la sesión
-- PERSONAL de una identidad con perfil profesional. El autenticador (`factor_totp`) y los códigos de recuperación ya eran
-- de la identidad, sin clase de sesión: se usan tal como están. Lo demás de la función queda igual.
CREATE OR REPLACE FUNCTION "be_segundo_factor_de_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM "sesion" s
       WHERE s."id" = NEW."sesion_id" AND s."identidad_id" = NEW."identidad_id"
         AND (s."clase" = 'ADMINISTRATIVA'
              OR (s."clase" = 'PERSONAL' AND EXISTS (SELECT 1 FROM "perfil_profesional" pp WHERE pp."identidad_id" = NEW."identidad_id")))
    ) THEN
      RAISE EXCEPTION 'BE: el segundo factor es de una sesión administrativa o de la sesión común de un profesional, de esa identidad' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: el segundo factor de una sesión no se elimina' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."sesion_id", NEW."identidad_id", NEW."momento_de_registro") IS DISTINCT FROM (OLD."sesion_id", OLD."identidad_id", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el segundo factor conserva su sesión' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;
