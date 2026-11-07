-- WP-TABLERO-ALTA-GAMA · TB-47 (DEUDA_LEGAJO DL-163 D-21): los valores de enum de «Descartar el borrador».
-- - `EstadoDeVersionDePlan` suma DESCARTADA: el estado terminal de un borrador que nunca se activó. Lo comparten la
--   versión de plan nutricional y la de entrenamiento.
-- - `TipoDeEventoDeNutricion` y `TipoDeEventoDeEntrenamiento` suman el hecho del descarte, que la transición exige en la
--   misma transacción (`be_transicion_con_hecho_wp04` y `_wp06`, con `estado_posterior` DESCARTADA).
-- Migración propia, como 20261106120100: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración 20261106140100 nombra DESCARTADA en las guardas y en los índices parciales.
ALTER TYPE "EstadoDeVersionDePlan" ADD VALUE IF NOT EXISTS 'DESCARTADA';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE IF NOT EXISTS 'BorradorDePlanDescartado';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'BorradorDePlanDeEntrenamientoDescartado';
