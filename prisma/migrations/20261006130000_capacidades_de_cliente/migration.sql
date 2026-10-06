-- Precierre del 2026-10-06, §2 (DL-122; packages/domain/src/compatibilidad-de-clientes.ts): lo que un cliente declaró que
-- sabe mostrar, por identidad. Las APK instaladas (0.13.2 y las candidatas 0.14.0) muestran solo los objetivos generales de
-- cada prescripción y no muestran textos del servidor: un plan con objetivos distintos por serie no se activa mientras su
-- titular no haya usado un cliente que los muestre. Esta tabla es lo que la API registra de ese uso: la identidad, la
-- capacidad, la superficie y la primera y la última vez. Nada más. Migración aditiva.
-- 1. Tabla, índice y clave foránea generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: solo capacidades que el dominio conoce, y la última declaración
--    no es anterior a la primera.

-- CreateTable
CREATE TABLE "capacidad_de_cliente_declarada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "capacidad" TEXT NOT NULL,
    "superficie" "Superficie",
    "momento_de_primera_declaracion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_ultima_declaracion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacidad_de_cliente_declarada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "capacidad_de_cliente_declarada_identidad_id_capacidad_key" ON "capacidad_de_cliente_declarada"("identidad_id", "capacidad");

-- AddForeignKey
ALTER TABLE "capacidad_de_cliente_declarada" ADD CONSTRAINT "capacidad_de_cliente_declarada_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Solo las capacidades conocidas (CAPACIDADES_CONOCIDAS) ─────────────────────────────────────────────────────────
-- Una capacidad nueva entra con su propia migración, junto con el cliente que la dibuja: lo que la API no conoce no se
-- registra (`capacidadesDeclaradas` lo ignora) y la base tampoco lo acepta.
ALTER TABLE "capacidad_de_cliente_declarada" ADD CONSTRAINT "capacidad_de_cliente_declarada_conocida" CHECK (
  "capacidad" IN ('training-set-targets-1')
);
ALTER TABLE "capacidad_de_cliente_declarada" ADD CONSTRAINT "capacidad_de_cliente_declarada_en_orden" CHECK (
  "momento_de_ultima_declaracion" >= "momento_de_primera_declaracion"
);
