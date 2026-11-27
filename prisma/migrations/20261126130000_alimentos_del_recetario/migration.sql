-- WP-RECETARIO · alimentos del Recetario de BE del 2026-11-26 (aprobado por Dirección): 4 alimentos de USDA FoodData Central ·
-- SR Legacy (dominio público, CC0 1.0; se cita «USDA Agricultural Research Service») que las recetas R067 a R151 necesitan y el
-- catálogo base no tenía: Maíz blanco en grano, seco, Chorizo de cerdo, crudo, Queso fresco, Albahaca fresca.
-- GENERADA por scripts/catalogo-base/generar-alimentos-del-recetario.mjs desde prisma/datos/catalogo-base/alimentos-del-recetario.json:
-- no se edita a mano. Es la misma siembra, con el mismo formato y la misma procedencia, que la del catálogo base de
-- alimentos (20261019120100), en una migración nueva porque aquella ya está aplicada y no se regenera.
-- - La composición cada 100 g es la de SR Legacy tal cual; ningún valor se completa ni se estima (el maíz blanco en grano no
--   trae fibra en la fuente y queda sin ella).
-- - Un registro de SR Legacy que ya está en el catálogo no se vuelve a crear, y cada inserción saltea lo que ya está.
-- - Cada alimento tiene su grupo (NUA-05), como los del catálogo base.
-- Solo agrega filas. No es una recomendación (INV-06-143).

-- 1. Los alimentos: uno por registro de SR Legacy que todavía no está en el catálogo.
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro")
SELECT n."id"::uuid, 'CONTROLLED_IMPORT'::"ProcedenciaDeCatalogo", '2026-11-26T13:00:00.000Z'::timestamptz
  FROM (VALUES
    ('2ac0d3d4-bb97-50ba-970f-f0241c581a93', '168920'), -- Maíz blanco en grano, seco
    ('7183f127-4acd-5b9b-9bcd-5fa2c2158e87', '173859'), -- Chorizo de cerdo, crudo
    ('a475aa8b-887a-5a5d-ba87-551ed45e273e', '172223'), -- Queso fresco
    ('7f7715e2-6cad-560e-8b77-f405efda66f3', '172232') -- Albahaca fresca
  ) AS n("id", "fdc")
 WHERE NOT EXISTS (
   SELECT 1 FROM "version_de_elemento_nutricional" v
    WHERE v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
      AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = n."fdc"
      AND v."elemento_id" <> n."id"::uuid)
ON CONFLICT ("id") DO NOTHING;

-- 2. Su primera versión: el nombre en castellano, la composición cada 100 g y la procedencia.
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponibilidad", "procedencia", "momento_de_registro")
SELECT n."id"::uuid, n."elemento_id"::uuid, n."nombre", n."composicion"::jsonb, 'DISPONIBLE'::"DisponibilidadDeElemento", n."procedencia"::jsonb,
       '2026-11-26T13:00:00.000Z'::timestamptz
  FROM (VALUES
    ('292094cf-b400-5178-b77b-5fb7cbb1b238', '2ac0d3d4-bb97-50ba-970f-f0241c581a93', 'Maíz blanco en grano, seco', '{"referenceAmount":"100g","energyKcal":365,"proteinG":9.42,"carbohydrateG":74.26,"fatG":4.74}', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/168920","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"168920","receivedAt":"2026-11-26T13:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"20314","originalDescription":"Corn grain, white","publishedOn":"2019-04-01","preparationDescription":"crudo, seco, sin cocinar"}}}'), -- FDC 168920
    ('787e156a-2d21-5ee1-9412-282370af61be', '7183f127-4acd-5b9b-9bcd-5fa2c2158e87', 'Chorizo de cerdo, crudo', '{"referenceAmount":"100g","energyKcal":296,"proteinG":13.63,"carbohydrateG":3.78,"fatG":25.1,"fiberG":0}', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/173859","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"173859","receivedAt":"2026-11-26T13:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"7019","originalDescription":"Sausage, pork, chorizo, link or ground, raw","publishedOn":"2019-04-01","preparationDescription":"crudo, en tripa o picado"}}}'), -- FDC 173859
    ('eb15a265-e9ad-54b2-8073-11c9a33cfbcb', 'a475aa8b-887a-5a5d-ba87-551ed45e273e', 'Queso fresco', '{"referenceAmount":"100g","energyKcal":299,"proteinG":18.09,"carbohydrateG":2.98,"fatG":23.82,"fiberG":0}', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/172223","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"172223","receivedAt":"2026-11-26T13:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"1228","originalDescription":"Cheese, fresh, queso fresco","publishedOn":"2019-04-01","preparationDescription":"listo para consumir"}}}'), -- FDC 172223
    ('4d81d84e-2ec4-5f05-84ba-cf030e61d452', '7f7715e2-6cad-560e-8b77-f405efda66f3', 'Albahaca fresca', '{"referenceAmount":"100g","energyKcal":23,"proteinG":3.15,"carbohydrateG":2.65,"fatG":0.64,"fiberG":1.6}', '{"fuente":"usda-fdc-sr-legacy","carga":"IMPORTACION_CONTROLADA","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/172232","fuenteExterna":{"provider":"USDA_FDC_SR_LEGACY","externalId":"172232","receivedAt":"2026-11-26T13:00:00.000Z","license":{"id":"CC0-1.0","label":"CC0 1.0 Universal (dominio público)","url":"https://creativecommons.org/publicdomain/zero/1.0/","attribution":"USDA Agricultural Research Service"},"usdaReference":{"dataset":"FoodData Central · SR Legacy","ndbNumber":"2044","originalDescription":"Basil, fresh","publishedOn":"2019-04-01","preparationDescription":"fresca"}}}') -- FDC 172232
  ) AS n("id", "elemento_id", "nombre", "composicion", "procedencia")
 WHERE EXISTS (SELECT 1 FROM "elemento_de_catalogo_nutricional" e WHERE e."id" = n."elemento_id"::uuid)
ON CONFLICT ("id") DO NOTHING;

-- 3. Los nombres alternativos de estos alimentos: el inglés de USDA y los de otros países.
INSERT INTO "nombre_alternativo_de_alimento" ("id", "elemento_id", "nombre", "idioma", "region", "origen", "procedencia", "momento_de_registro")
SELECT n."id"::uuid, e."id", n."nombre", n."idioma"::"IdiomaDeNombre", n."region", 'SIEMBRA_DE_BE'::"OrigenDeNombreAlternativo", n."procedencia"::jsonb,
       '2026-11-26T13:00:00.000Z'::timestamptz
  FROM (VALUES
    ('4bf7f6a5-bf3a-5790-94d6-0e6f929d3215', '2ac0d3d4-bb97-50ba-970f-f0241c581a93', 'Corn grain, white', 'EN', NULL, '{"fuente":"usda-fdc-sr-legacy","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/168920","nota":"La descripción original de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0)."}'), -- Maíz blanco en grano, seco
    ('5cb62e79-52cd-520e-8136-93acdafb3083', '2ac0d3d4-bb97-50ba-970f-f0241c581a93', 'Maíz blanco partido', 'ES', 'AR', '{"fuente":"catalogo-base","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","nota":"Nombre alternativo curado por BE para el catálogo base: no es una recomendación ni una prescripción (INV-06-143)."}'), -- Maíz blanco en grano, seco
    ('29f93b86-8ff8-5944-bbc0-be7d5c41876e', '7183f127-4acd-5b9b-9bcd-5fa2c2158e87', 'Sausage, pork, chorizo, link or ground, raw', 'EN', NULL, '{"fuente":"usda-fdc-sr-legacy","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/173859","nota":"La descripción original de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0)."}'), -- Chorizo de cerdo, crudo
    ('9ea0eb71-8718-5a17-9808-1848c4229a56', 'a475aa8b-887a-5a5d-ba87-551ed45e273e', 'Cheese, fresh, queso fresco', 'EN', NULL, '{"fuente":"usda-fdc-sr-legacy","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/172223","nota":"La descripción original de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0)."}'), -- Queso fresco
    ('8abc98a0-7e27-5e33-a929-99671298e344', '7f7715e2-6cad-560e-8b77-f405efda66f3', 'Basil, fresh', 'EN', NULL, '{"fuente":"usda-fdc-sr-legacy","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","recurso":"https://api.nal.usda.gov/fdc/v1/food/172232","nota":"La descripción original de USDA FoodData Central · SR Legacy (dominio público, CC0 1.0)."}') -- Albahaca fresca
  ) AS n("id", "elemento_id", "nombre", "idioma", "region", "procedencia")
  JOIN "elemento_de_catalogo_nutricional" e ON e."id" = n."elemento_id"::uuid
ON CONFLICT ("id") DO NOTHING;

-- 4. El grupo de cada alimento (NUA-05), buscado por su FDC en la procedencia de sus versiones. Saltea lo que ya tiene grupo.
INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "procedencia", "momento_de_registro")
SELECT DISTINCT ON (v."elemento_id") v."elemento_id", 1, g."grupo"::"GrupoDeAlimento",
       '{"fuente":"catalogo-base-grupos","siembra":"WP-RECETARIO · alimentos del recetario del 2026-11-26","nota":"El grupo de la curaduría de los alimentos del recetario (prisma/datos/catalogo-base/alimentos-del-recetario.json)."}'::jsonb,
       '2026-11-26T13:00:00.000Z'::timestamptz
  FROM (VALUES
    ('168920', 'CEREALES'), -- Maíz blanco en grano, seco
    ('173859', 'CARNES'), -- Chorizo de cerdo, crudo
    ('172223', 'LACTEOS'), -- Queso fresco
    ('172232', 'VERDURAS')  -- Albahaca fresca
  ) AS g("fdc", "grupo")
  JOIN "version_de_elemento_nutricional" v
    ON v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY' AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = g."fdc"
 WHERE NOT EXISTS (SELECT 1 FROM "grupo_de_alimento" x WHERE x."elemento_id" = v."elemento_id")
 ORDER BY v."elemento_id";
