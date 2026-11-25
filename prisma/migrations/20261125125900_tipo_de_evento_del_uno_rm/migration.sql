-- DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-01): el hecho de sumar un 1RM de referencia. Va en su propia migración,
-- antes de la que lo usa: un valor nuevo de un enum no se puede usar en la misma transacción en que se agrega.
ALTER TYPE "TipoDeEventoDeEntrenamiento" ADD VALUE IF NOT EXISTS 'UnoRMDeReferenciaSumado';
