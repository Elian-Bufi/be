-- WP-FORMULARIOS-RONDA-2 · FR-10 (DEUDA_LEGAJO DL-165 D-9, ratificada por Dirección el 2026-11-05): los valores de enum que
-- usan los hábitos de la persona.
-- - `TipoDeTexto` suma el texto del acto «Compartir mis hábitos con mis profesionales» (una propuesta, pendiente de
--   validación jurídica, como EVIDENCIA_VISUAL en DL-125).
-- - `TipoDeEventoDeFormulario` suma los hechos de los hábitos: una versión nueva, y la autorización al darla, al cambiar con
--   quiénes y al retirarla (la bitácora de los formularios, como las propuestas de DL-164).
-- Migración propia, como 20261104120000 y 20261006160000: PostgreSQL no permite usar un valor de enum en la misma
-- transacción en que se agrega, y la migración 20261105130100 siembra una versión de texto de este tipo.
ALTER TYPE "TipoDeTexto" ADD VALUE IF NOT EXISTS 'HABITOS_COMPARTIDOS';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'VersionDeHabitosRegistrada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeHabitosActivada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeHabitosModificada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeHabitosRetirada';
