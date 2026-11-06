-- WP-FORMULARIOS-DE-INICIO (DL-164): las novedades de la propuesta del profesional. A la persona, cuando el profesional
-- carga o reemplaza lo que ella le contó (FI-06: la novedad abre sus formularios); al profesional, cuando la persona lo
-- confirma o dice «No es correcto». Nunca el contenido: solo que pasó (UC-P30; INV-06-32).
-- Migración propia, como 20261017000000: el valor no se puede usar en la transacción que lo agrega, y la migración
-- 20261104120200 los nombra en un CHECK.
-- No cambia `novedad_recordatorio_coherente`: no son recordatorios, así que exigen quien las originó y ningún día.
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'PROPUESTA_DE_FORMULARIO_CARGADA';
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'PROPUESTA_DE_FORMULARIO_CONFIRMADA';
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'PROPUESTA_DE_FORMULARIO_RECHAZADA';
