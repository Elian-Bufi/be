-- WP-AGENDA-DE-ENTRENAMIENTO (DEUDA_LEGAJO DL-137): los dos recordatorios de entrenamiento de la mañana (10:00).
-- La agenda vive en el contenido de la versión del plan (JSON): no agrega tablas ni columnas.
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'RECORDATORIO_DE_SESION_DEL_DIA';
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'RECORDATORIO_DE_SESION_PENDIENTE';

-- Los recordatorios los emite BE (sin fuente) y llevan su día; las demás novedades, al revés. El tipo se compara como
-- texto: PostgreSQL no deja usar un valor del enum en la misma transacción que lo agrega.
ALTER TABLE "novedad" DROP CONSTRAINT "novedad_recordatorio_coherente";
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_recordatorio_coherente" CHECK (
  CASE WHEN "tipo"::text IN ('RECORDATORIO_DE_COMIDAS', 'RECORDATORIO_DE_ENTRENAMIENTO', 'RECORDATORIO_DE_SESION_DEL_DIA', 'RECORDATORIO_DE_SESION_PENDIENTE')
       THEN "fuente_id" IS NULL AND "fecha_local" IS NOT NULL
       ELSE "fuente_id" IS NOT NULL AND "fecha_local" IS NULL
  END);
