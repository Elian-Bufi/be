-- WP-03 · valores nuevos de enums existentes (docs/paquetes/WP-03.md).
-- Migración propia: PostgreSQL no permite usar un valor de enum en la misma transacción en que se agrega, y la
-- migración siguiente siembra los textos de B2 con estos tipos.
-- TipoDeTexto: textos de B2 por perfil profesional (08 §12.3). TipoDeEventoDeDominio: otorgamiento de A3 (API-CON-06).
ALTER TYPE "TipoDeEventoDeDominio" ADD VALUE 'ActoOtorgado';
ALTER TYPE "TipoDeTexto" ADD VALUE 'CONSENTIMIENTO_PROFESIONAL_SANITARIO';
ALTER TYPE "TipoDeTexto" ADD VALUE 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO';
