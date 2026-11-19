-- WP-NUTRICION-ALIMENTOS (DL-180), revisión adversaria: Administración revisa solo lo compartido. Solo cambia el cuerpo de
-- la guardia de `revision_administrativa_de_alimento` (creada en 20261119120100); ninguna fila ni otra tabla cambia.
-- - NUA-D05: lo cargado a mano antes de DL-180 no se comparte solo, porque su autor lo cargó creyendo que era solo suyo y
--   un nombre puede tener el de una persona; «Mis alimentos» le dice «Por ahora lo ves solo vos». Administración tampoco lo
--   ve (API-ALI-05) ni decide sobre eso (API-ALI-06, el mismo 404 que lo inexistente), y la base lo sostiene acá.
-- - Lo demás, igual: un administrador con su rol vigente, una versión de una carga a mano, el equivalente verificado y
--   disponible, y cada revisión siguiendo a la anterior.
CREATE OR REPLACE FUNCTION "be_revision_administrativa_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un alimento lo revisa un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e JOIN "version_de_elemento_nutricional" v ON v."elemento_id" = e."id"
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND v."id" = NEW."version_id") THEN
    RAISE EXCEPTION 'BE: Administración revisa una versión de un alimento cargado a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "alimento_compartido" c WHERE c."elemento_id" = NEW."elemento_id") THEN
    RAISE EXCEPTION 'BE: Administración revisa solo lo que su autor compartió' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."equivalente_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "version_de_elemento_nutricional" t
     WHERE t."elemento_id" = NEW."equivalente_id" AND t."disponibilidad" = 'DISPONIBLE'
       AND t."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = t."id")) THEN
    RAISE EXCEPTION 'BE: el equivalente es un alimento verificado y disponible' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(r."numero") FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: una revisión de un alimento sigue a la anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
