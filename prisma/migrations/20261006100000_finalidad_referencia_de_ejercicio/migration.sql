-- WP-ENTRENAMIENTO-SERIES (docs/paquetes/WP-ENTRENAMIENTO-SERIES.md §9.1; DL-123): la finalidad del medio para la imagen
-- de un ejercicio propio de un profesional de Entrenamiento (API: EXERCISE_REFERENCE).
-- Migración propia, como 20260919200000_wp03_valores_de_enum: PostgreSQL no permite usar un valor de enum en la misma
-- transacción en que se agrega, y la migración siguiente lo cita en sus restricciones y en sus triggers.
ALTER TYPE "FinalidadDeMedio" ADD VALUE 'REFERENCIA_DE_EJERCICIO';
