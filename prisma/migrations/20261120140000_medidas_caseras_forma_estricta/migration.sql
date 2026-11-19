-- WP-NUTRICION-ALIMENTOS (DL-180), segundo tramo · de la revisión adversaria: la forma de las medidas caseras, estricta
-- (NUA-08; docs/paquetes/WP-NUTRICION-ALIMENTOS.md). Solo reemplaza el cuerpo de la guardia de `medidas_caseras_de_alimento`
-- (creada en esta misma rama, sin filas en ninguna base real); ninguna fila existente cambia.
-- - El CHECK `medidas_caseras_de_alimento_forma` dejaba pasar una equivalencia que no es un número («"amount": "90"») o un
--   tipo que no es un texto: en jsonpath, comparar valores de tipos distintos da «desconocido», y el filtro solo toma lo
--   verdadero. Ahora la guardia de la fila exige que cada medida sea un objeto con `kind` (un texto) y `amount` (un número),
--   y nada más; el CHECK sigue diciendo qué tipos y qué valores.
-- - A lo sumo una medida de cada tipo (lo que la API ya exige con su esquema), también en la base.

CREATE OR REPLACE FUNCTION "be_medidas_caseras_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."autor_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: las medidas caseras de un alimento las define quien lo cargó a mano' USING ERRCODE = 'check_violation';
  END IF;
  -- Lo que no es un arreglo lo rechaza el CHECK; acá, cada elemento de uno.
  IF jsonb_typeof(NEW."medidas") = 'array' THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(NEW."medidas") m
       WHERE CASE WHEN jsonb_typeof(m) = 'object'
                  THEN jsonb_typeof(m -> 'kind') IS DISTINCT FROM 'string'
                       OR jsonb_typeof(m -> 'amount') IS DISTINCT FROM 'number'
                       OR EXISTS (SELECT 1 FROM jsonb_object_keys(m) k WHERE k NOT IN ('kind', 'amount'))
                  ELSE TRUE END) THEN
      RAISE EXCEPTION 'BE: cada medida casera es un tipo y una equivalencia en número' USING ERRCODE = 'check_violation';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(NEW."medidas")) <> (SELECT count(DISTINCT m ->> 'kind') FROM jsonb_array_elements(NEW."medidas") m) THEN
      RAISE EXCEPTION 'BE: una medida casera de cada tipo' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(m."numero") FROM "medidas_caseras_de_alimento" m WHERE m."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: las medidas caseras de un alimento siguen a las anteriores' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
