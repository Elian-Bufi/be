-- WP-NUTRICION-ALIMENTOS (DL-180): los valores de enum de los hechos nuevos. Solo agrega.
-- - `TipoDeEventoDeNutricion`: un alimento cargado a mano, corregido con una versión nueva (NUA-01) o retirado (NUA-02).
-- Migración propia, como 20261113090000: PostgreSQL no deja usar un valor de enum en la transacción en que se agrega.
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE IF NOT EXISTS 'ElementoDeCatalogoVersionado';
ALTER TYPE "TipoDeEventoDeNutricion" ADD VALUE IF NOT EXISTS 'ElementoDeCatalogoRetirado';
