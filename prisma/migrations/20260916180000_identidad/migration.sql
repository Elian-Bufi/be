-- WP-01 · T-06-01 Identidad BE (06 §5.4) · T-06-02 Estado operativo de cuenta (06 §5.7) · T-06-24 par temporal (REG-06-18)

-- CreateEnum
CREATE TYPE "EstadoOperativoDeCuenta" AS ENUM ('OPERATIVA', 'SUSPENDIDA', 'CERRADA');

-- CreateTable
CREATE TABLE "identidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "estado_operativo_de_cuenta" "EstadoOperativoDeCuenta" NOT NULL DEFAULT 'OPERATIVA',
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identidad_pkey" PRIMARY KEY ("id")
);

