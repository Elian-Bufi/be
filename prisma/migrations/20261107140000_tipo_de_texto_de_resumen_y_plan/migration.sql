-- WP-TABLERO-ALTA-GAMA · TB-55 (DEUDA_LEGAJO DL-163 D-13, ampliada; Dirección, 2026-11-07: un texto distinto por nivel): el
-- valor de enum del texto del nivel «resumen y plan». Desde ese día, RESUMENES_COMPARTIDOS es el texto del nivel «resumen».
-- Migración propia, como 20261107120000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega, y la migración 20261107140100 siembra una versión de texto de este tipo.
ALTER TYPE "TipoDeTexto" ADD VALUE IF NOT EXISTS 'RESUMENES_Y_PLAN_COMPARTIDOS';
