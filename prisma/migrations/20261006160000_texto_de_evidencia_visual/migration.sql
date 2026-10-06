-- Precierre del 2026-10-06, §6 (DL-125): el tipo de texto de la información destacada de las fotos de comidas
-- (08 §12.4 `EVIDENCIA_VISUAL`, §21.3). El tipo del acto ya existe desde 20261005120000.
-- Migración propia, como 20261006100000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración siguiente siembra una versión de este tipo.
ALTER TYPE "TipoDeTexto" ADD VALUE 'EVIDENCIA_VISUAL';
