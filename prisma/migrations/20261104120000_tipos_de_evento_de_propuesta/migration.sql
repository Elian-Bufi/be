-- WP-FORMULARIOS-DE-INICIO (DEUDA_LEGAJO DL-164, ratificada por Dirección el 2026-11-04): los hechos de la propuesta del
-- profesional (D-3): cargarla, reemplazarla, retirarla, que la persona la rechace y que la confirme (confirmar es responder,
-- D-4: el hecho de la Respuesta sigue siendo RespuestaDeFormularioRegistrada).
-- Migración propia, como 20261017000000 y 20261025120000: PostgreSQL no permite usar un valor de enum en la misma
-- transacción en que se agrega, y la migración 20261104120200 los nombra.
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PropuestaDeRespuestaCargada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PropuestaDeRespuestaReemplazada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PropuestaDeRespuestaRetirada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PropuestaDeRespuestaRechazada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PropuestaDeRespuestaConfirmada';
