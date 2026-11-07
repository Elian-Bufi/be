-- WP-TABLERO-ALTA-GAMA · TB-52 a TB-56 (DEUDA_LEGAJO DL-163 D-13, ampliada por Dirección el 2026-11-07): los valores de enum
-- de lo que la persona comparte de otras áreas.
-- - `TipoDeTexto` suma el texto del acto «Compartir con mis profesionales lo de otras áreas» (una propuesta, pendiente de
--   validación jurídica, como HABITOS_COMPARTIDOS).
-- - `TipoDeEventoDeFormulario` suma los hechos de la autorización (al darla, al cambiarla y al retirarla) y los del pedido
--   de ver un plan (hecho, reemplazado, aceptado y «No, por ahora»), en la bitácora de los formularios, como los de los
--   hábitos (DL-165 D-9 y D-17).
-- - `TipoDeNovedad` suma la novedad a la persona cuando un profesional le pide ver su plan de otra área (API-RES-08).
-- Migración propia, como 20261105130000 y 20261106120100: PostgreSQL no permite usar un valor de enum en la misma
-- transacción en que se agrega, y la migración 20261107120100 siembra una versión de texto de este tipo y nombra el tipo de
-- novedad en un CHECK.
ALTER TYPE "TipoDeTexto" ADD VALUE IF NOT EXISTS 'RESUMENES_COMPARTIDOS';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeResumenesActivada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeResumenesModificada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'AutorizacionDeResumenesRetirada';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAPlanHecho';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAPlanReemplazado';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAPlanAceptado';
ALTER TYPE "TipoDeEventoDeFormulario" ADD VALUE IF NOT EXISTS 'PedidoDeAccesoAPlanNoPorAhora';
ALTER TYPE "TipoDeNovedad" ADD VALUE IF NOT EXISTS 'PEDIDO_DE_ACCESO_A_PLAN';
