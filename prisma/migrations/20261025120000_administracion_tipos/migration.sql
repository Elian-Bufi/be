-- WP-ADMINISTRACION (DL-155): los valores nuevos de dos enumeraciones existentes, en su propia migración: un valor
-- agregado con ALTER TYPE no se puede usar en la misma transacción (como 20261017000000 para las notas de coordinación).

-- Por qué se revoca una sesión: los cortes del acceso administrativo.
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'SEGUNDO_FACTOR_FALLIDO';
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'INCORPORACION_ADMINISTRATIVA';
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'SEGUNDO_FACTOR_RESTABLECIDO';
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'ROL_ADMINISTRATIVO_RETIRADO';
ALTER TYPE "MotivoDeRevocacionDeSesion" ADD VALUE 'CREDENCIALES_ADMINISTRATIVAS_RENOVADAS';

-- Los avisos de Administración (D-6): al profesional, la decisión; a las personas vinculadas, el efecto.
ALTER TYPE "TipoDeNovedad" ADD VALUE 'DECISION_ADMINISTRATIVA';
ALTER TYPE "TipoDeNovedad" ADD VALUE 'ACCESO_PROFESIONAL_SUSPENDIDO';
ALTER TYPE "TipoDeNovedad" ADD VALUE 'ACCESO_PROFESIONAL_RESTABLECIDO';
