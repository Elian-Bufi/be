-- WP-RECORRIDOS-GUIADOS (DL-195; docs/paquetes/WP-RECORRIDOS-GUIADOS.md): qué recorridos guiados vio u omitió cada
-- usuario, para que aparezcan solos una sola vez por usuario y no por navegador (GUI-D03). Migración aditiva: una tabla
-- nueva y su enum, nada de lo anterior se toca.
-- 1. El enum, la tabla y la clave foránea, generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Una garantía en la base: el identificador del recorrido tiene la forma de los de @be/domain (minúsculas y guiones).
--    La lista cerrada la valida la API: sumar un recorrido no pide otra migración (GUI-D05).
-- CreateEnum
CREATE TYPE "EstadoDelRecorridoGuiado" AS ENUM ('VISTO', 'OMITIDO');

-- CreateTable
CREATE TABLE "recorrido_guiado_visto" (
    "identidad_id" UUID NOT NULL,
    "recorrido" TEXT NOT NULL,
    "estado" "EstadoDelRecorridoGuiado" NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recorrido_guiado_visto_pkey" PRIMARY KEY ("identidad_id","recorrido")
);

-- AddForeignKey
ALTER TABLE "recorrido_guiado_visto" ADD CONSTRAINT "recorrido_guiado_visto_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── La forma del identificador ──────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "recorrido_guiado_visto" ADD CONSTRAINT "recorrido_guiado_visto_forma" CHECK ("recorrido" ~ '^[a-z][a-z0-9-]{0,62}$');
