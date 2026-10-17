-- WP-NOTAS-DE-COORDINACION (DEUDA_LEGAJO DL-140; aprobado por Dirección el 2026-10-16): la novedad que recibe cada
-- profesional destinatario de una nota de coordinación (CRD-D6).
-- Migración propia, como 20261016220000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración siguiente lo nombra en un CHECK.
-- No cambia `novedad_recordatorio_coherente`: no es un recordatorio, así que cae en la rama que exige quien la originó
-- (el autor de la nota) y ningún día.
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'NOTA_DE_COORDINACION_RECIBIDA';
