-- WP-08 · Recuperación que conserva los datos si hay que volver al código anterior a WP-08.
--
-- Por qué hace falta. La migración 20260924100000 agrega el valor de enum CONTROLLED_IMPORT a
-- "ProcedenciaDeCatalogo", usado como columna nativa en elemento_de_catalogo_nutricional y
-- ejercicio_de_catalogo. El código anterior no conoce ese valor: al leer el catálogo, la fila importada
-- llega a la respuesta con «CONTROLLED_IMPORT» y el contrato/cliente (APK 0.9.1) la rechaza. Además,
-- PostgreSQL NO permite quitar un valor de enum, así que la migración no se revierte: se remapea el dato.
-- Verificado en un PostgreSQL aislado (pglite): sin este remapeo, volver es inseguro; con él, es seguro y
-- reversible sin pérdida. Ninguna fila se borra; el candidato y la resolución quedan intactos y son la
-- verdad de qué elemento fue importado.
--
-- CUÁNDO. Solo si se decide volver el código de la API a una revisión anterior a WP-08, y DESPUÉS de que
-- exista al menos una importación. Ejecutar contra la base del ambiente, una vez, antes de arrancar el
-- código viejo.

-- 1) Bajar: dejar el catálogo con un valor que el código viejo entiende. Se conserva la relación de
--    resolución, que dice cuáles eran importados.
BEGIN;
UPDATE "elemento_de_catalogo_nutricional" SET "procedencia" = 'PROFESSIONAL_MANUAL'
 WHERE "procedencia" = 'CONTROLLED_IMPORT';
UPDATE "ejercicio_de_catalogo" SET "procedencia" = 'PROFESSIONAL_MANUAL'
 WHERE "procedencia" = 'CONTROLLED_IMPORT';
COMMIT;

-- 2) Volver a WP-08 (roll-forward): restaurar la procedencia desde la resolución, que no se tocó.
--    Ejecutar SOLO al redeplegar el código WP-08.
-- BEGIN;
-- UPDATE "elemento_de_catalogo_nutricional" SET "procedencia" = 'CONTROLLED_IMPORT'
--  WHERE "id" IN (SELECT "elemento_nutricional_id" FROM "resolucion_de_candidato"
--                 WHERE "decision" = 'IMPORTAR' AND "elemento_nutricional_id" IS NOT NULL);
-- UPDATE "ejercicio_de_catalogo" SET "procedencia" = 'CONTROLLED_IMPORT'
--  WHERE "id" IN (SELECT "ejercicio_id" FROM "resolucion_de_candidato"
--                 WHERE "decision" = 'IMPORTAR' AND "ejercicio_id" IS NOT NULL);
-- COMMIT;
