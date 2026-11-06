-- WP-FORMULARIOS-RONDA-2, ronda 2.1 · FR-14 (DEUDA_LEGAJO DL-165, D-17 nueva de Dirección del 2026-11-06): los valores de
-- enum de «Pedir acceso a sus hábitos».
-- - `TipoDeNovedad` suma la novedad a la persona cuando un profesional le pide ver sus hábitos (API-HBT-06). La APK 0.22 la
--   destaca como importante por su tipo; el aviso push sigue siendo genérico (DL-133).
-- - `TipoDeEventoDeFormulario` suma los hechos del pedido en la bitácora de los formularios: hecho, reemplazado por uno
--   nuevo, aceptado y «No, por ahora».
-- Migración propia, como 20261105130000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración 20261106120200 nombra el tipo de novedad en un CHECK.
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'PEDIDO_DE_ACCESO_A_HABITOS';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAHabitosHecho';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAHabitosReemplazado';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAHabitosAceptado';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAHabitosNoPorAhora';
