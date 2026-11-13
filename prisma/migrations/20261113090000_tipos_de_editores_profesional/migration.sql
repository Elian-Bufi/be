-- WP-EDITORES-PROFESIONAL (DL-167; DL-171): los valores de enum de los hechos nuevos. Solo agrega.
-- - `TipoDeEventoDeEntrenamiento`: la serie observada por el profesional y su sucesión (ED-72), y la prescripción
--   habitual guardada o quitada (ED-13).
-- - `TipoDeEventoDeNutricion`: el reparto habitual guardado o quitado (ED-13).
-- Migración propia, como 20261106140000: PostgreSQL no deja usar un valor de enum en la transacción en que se agrega.
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE IF NOT EXISTS 'RepartoHabitualGuardado';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE IF NOT EXISTS 'RepartoHabitualQuitado';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'SerieObservadaRegistrada';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'SerieObservadaSucedida';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'PrescripcionHabitualGuardada';
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'PrescripcionHabitualQuitada';
