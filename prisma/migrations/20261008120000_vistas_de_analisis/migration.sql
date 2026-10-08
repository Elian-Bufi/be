-- WP-DASHBOARD-PROFESIONAL (DL-128; packages/domain/src/contratos-analisis.ts): las vistas de «Analizar» que guarda el
-- profesional y su configuración de indicadores del Resumen (API-VAN-01 a 04). Es solo configuración —métricas por
-- identificador, modo, grano, período y capas—: nunca datos de salud ni un permiso, porque cada lectura de datos vuelve a
-- pasar por el PDP. Mutable, como «Mis habituales» (sin disparadores de solo-agregar); cada escritura queda en la
-- auditoría. Migración aditiva: una tabla y un enumerado nuevos, sin tocar datos ni columnas existentes.
-- 1. Enumerado, tabla, índice y clave foránea generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: una sola configuración de indicadores por profesional, un
--    nombre no vacío y una versión positiva.

-- CreateEnum
CREATE TYPE "UsoDeVistaDeAnalisis" AS ENUM ('ANALISIS', 'INDICADORES_DEL_RESUMEN');

-- CreateTable
CREATE TABLE "vista_de_analisis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "uso" "UsoDeVistaDeAnalisis" NOT NULL,
    "configuracion" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vista_de_analisis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vista_de_analisis_profesional_id_momento_de_actualizacion_idx" ON "vista_de_analisis"("profesional_id", "momento_de_actualizacion");

-- AddForeignKey
ALTER TABLE "vista_de_analisis" ADD CONSTRAINT "vista_de_analisis_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── A lo sumo una configuración de indicadores del Resumen por profesional ─────────────────────────────────────────
-- Dos pestañas que guardan a la vez no pueden dejar dos: la segunda inserción falla y la API responde 409.
CREATE UNIQUE INDEX "vista_de_analisis_un_resumen_por_profesional" ON "vista_de_analisis" ("profesional_id") WHERE "uso" = 'INDICADORES_DEL_RESUMEN';

-- ─── Un nombre visible y una versión que avanza ─────────────────────────────────────────────────────────────────────
ALTER TABLE "vista_de_analisis" ADD CONSTRAINT "vista_de_analisis_nombre_no_vacio" CHECK (length(btrim("nombre")) BETWEEN 1 AND 80);
ALTER TABLE "vista_de_analisis" ADD CONSTRAINT "vista_de_analisis_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "vista_de_analisis" ADD CONSTRAINT "vista_de_analisis_configuracion_es_objeto" CHECK (jsonb_typeof("configuracion") = 'object');
