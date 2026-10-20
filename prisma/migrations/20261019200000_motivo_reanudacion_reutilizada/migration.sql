-- DL-147 (encargo de consolidación de Dirección del 2026-10-19, bloque 3): la sesión del website sobrevive a una recarga.
-- Un motivo de revocación nuevo: una reanudación ya reemplazada que se vuelve a presentar fuera del margen de gracia
-- (posible copia de la cookie) revoca esa sesión.
-- Migración propia, como 20261017000000: PostgreSQL no permite usar un valor de enum en la misma transacción en que se
-- agrega.
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE IF NOT EXISTS 'REANUDACION_REUTILIZADA';
