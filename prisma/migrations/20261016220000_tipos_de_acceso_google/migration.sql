-- WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138; aprobado por Dirección el 2026-10-16): los valores nuevos de las enumeraciones.
-- - `TipoDeMetodoDeAcceso.GOOGLE`: la cuenta de Google como método de acceso de una identidad BE (RF-003, UC-E05).
-- - `TipoDeTexto.MAYORIA_DE_EDAD` y `TipoDeActoRegistrable.MAYORIA_DE_EDAD`: la declaración de mayoría de edad del alta
--   (08 §24.7 a; gate §42, ítem 22).
-- Migración propia, como 20261006160000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración siguiente lo usa (la versión del texto, los CHECK y los índices parciales).
ALTER TYPE "TipoDeMetodoDeAcceso" ADD VALUE 'GOOGLE';
ALTER TYPE "TipoDeTexto" ADD VALUE 'MAYORIA_DE_EDAD';
ALTER TYPE "TipoDeActoRegistrable" ADD VALUE 'MAYORIA_DE_EDAD';
