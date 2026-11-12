-- UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005): los tipos de la recuperación del acceso, en su propia migración: un
-- valor agregado con ALTER TYPE no se puede usar en la misma transacción (como 20261025120000 para Administración). Solo
-- agrega.

-- De dónde sale un código de recuperación: el pedido de la persona o la recuperación asistida de Administración.
CREATE TYPE "OrigenDeRecuperacionDeAcceso" AS ENUM ('PEDIDO', 'ASISTIDA');

-- Por qué se revoca una sesión (08 §26.3): el cambio de credencial por recuperación, y la recuperación asistida.
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'RECUPERACION_DE_ACCESO';
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'RECUPERACION_ASISTIDA';
