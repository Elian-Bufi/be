-- WP-CATALOGO-BASE (DEUDA_LEGAJO DL-141, D-2; aprobado por Dirección el 2026-10-16, tanda 3): «una tabla de nombres
-- alternativos para ejercicios y alimentos: castellano, el de otros países y el inglés». El buscador de los catálogos
-- (DL-139) busca también en ellos.
-- 1. Las dos enumeraciones y las cuatro tablas (los nombres y sus retiros, de ejercicios y de alimentos), generadas
--    desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: las cuatro tablas solo se agregan (retirar un nombre es un
--    hecho aparte, uno por nombre); el nombre no está vacío ni tiene espacios en los bordes; la región es un código de
--    país; el origen dice de quién es el nombre (el proveedor o el profesional), y solo con ese origen.
-- Aditiva: no toca tablas ni datos existentes.

-- CreateEnum
CREATE TYPE "IdiomaDeNombre" AS ENUM ('ES', 'EN');

-- CreateEnum
CREATE TYPE "OrigenDeNombreAlternativo" AS ENUM ('SIEMBRA_DE_BE', 'PROVEEDOR', 'PROFESIONAL');

-- CreateTable
CREATE TABLE "nombre_alternativo_de_ejercicio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejercicio_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "idioma" "IdiomaDeNombre" NOT NULL,
    "region" TEXT,
    "origen" "OrigenDeNombreAlternativo" NOT NULL,
    "proveedor" "ProveedorExterno",
    "profesional_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nombre_alternativo_de_ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiro_de_nombre_alternativo_de_ejercicio" (
    "nombre_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "profesional_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retiro_de_nombre_alternativo_de_ejercicio_pkey" PRIMARY KEY ("nombre_id")
);

-- CreateTable
CREATE TABLE "nombre_alternativo_de_alimento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "idioma" "IdiomaDeNombre" NOT NULL,
    "region" TEXT,
    "origen" "OrigenDeNombreAlternativo" NOT NULL,
    "proveedor" "ProveedorExterno",
    "profesional_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nombre_alternativo_de_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiro_de_nombre_alternativo_de_alimento" (
    "nombre_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "profesional_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retiro_de_nombre_alternativo_de_alimento_pkey" PRIMARY KEY ("nombre_id")
);

-- CreateIndex
CREATE INDEX "nombre_alternativo_de_ejercicio_ejercicio_id_idx" ON "nombre_alternativo_de_ejercicio"("ejercicio_id");

-- CreateIndex
CREATE INDEX "nombre_alternativo_de_alimento_elemento_id_idx" ON "nombre_alternativo_de_alimento"("elemento_id");

-- AddForeignKey
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "retiro_de_nombre_alternativo_de_ejercicio" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_ejercicio_nombre_id_fkey" FOREIGN KEY ("nombre_id") REFERENCES "nombre_alternativo_de_ejercicio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "retiro_de_nombre_alternativo_de_ejercicio" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_ejercicio_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "retiro_de_nombre_alternativo_de_alimento" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_alimento_nombre_id_fkey" FOREIGN KEY ("nombre_id") REFERENCES "nombre_alternativo_de_alimento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "retiro_de_nombre_alternativo_de_alimento" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_alimento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── 2. Garantías que Prisma no representa ───────────────────────────────────────────────────────────────────────────
-- Historia por adición: un nombre no se corrige ni se borra; se retira con un hecho nuevo, y el retiro tampoco cambia.
CREATE TRIGGER "nombre_alternativo_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "nombre_alternativo_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "retiro_de_nombre_alternativo_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "retiro_de_nombre_alternativo_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nombre_alternativo_de_alimento_solo_agregar" BEFORE UPDATE OR DELETE ON "nombre_alternativo_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "retiro_de_nombre_alternativo_de_alimento_solo_agregar" BEFORE UPDATE OR DELETE ON "retiro_de_nombre_alternativo_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nombre_alternativo_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "nombre_alternativo_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "retiro_de_nombre_alternativo_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "retiro_de_nombre_alternativo_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "nombre_alternativo_de_alimento_sin_truncate" BEFORE TRUNCATE ON "nombre_alternativo_de_alimento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "retiro_de_nombre_alternativo_de_alimento_sin_truncate" BEFORE TRUNCATE ON "retiro_de_nombre_alternativo_de_alimento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- El nombre: no vacío, sin espacios en los bordes y del largo de un nombre del catálogo (120, como la carga manual).
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_nombre" CHECK (btrim("nombre") <> '' AND "nombre" = btrim("nombre") AND char_length("nombre") <= 120);
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_nombre" CHECK (btrim("nombre") <> '' AND "nombre" = btrim("nombre") AND char_length("nombre") <= 120);
-- La región es un país, en ISO 3166-1 alfa-2 (AR, ES, MX…).
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_region" CHECK ("region" IS NULL OR "region" ~ '^[A-Z]{2}$');
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_region" CHECK ("region" IS NULL OR "region" ~ '^[A-Z]{2}$');
-- El origen dice de quién es: el proveedor, con cuál (el del dominio: wger para ejercicios, Open Food Facts para alimentos);
-- el profesional, con quién; y lo sembrado por BE, sin ninguno de los dos.
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_origen_coherente" CHECK (
  (("origen" = 'PROVEEDOR') = ("proveedor" IS NOT NULL)) AND (("origen" = 'PROFESIONAL') = ("profesional_id" IS NOT NULL)) AND ("proveedor" IS NULL OR "proveedor" = 'WGER'));
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_origen_coherente" CHECK (
  (("origen" = 'PROVEEDOR') = ("proveedor" IS NOT NULL)) AND (("origen" = 'PROFESIONAL') = ("profesional_id" IS NOT NULL)) AND ("proveedor" IS NULL OR "proveedor" = 'OPEN_FOOD_FACTS'));
ALTER TABLE "nombre_alternativo_de_ejercicio" ADD CONSTRAINT "nombre_alternativo_de_ejercicio_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "nombre_alternativo_de_alimento" ADD CONSTRAINT "nombre_alternativo_de_alimento_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- Un retiro dice por qué.
ALTER TABLE "retiro_de_nombre_alternativo_de_ejercicio" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_ejercicio_motivo" CHECK (btrim("motivo") <> '');
ALTER TABLE "retiro_de_nombre_alternativo_de_alimento" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_alimento_motivo" CHECK (btrim("motivo") <> '');
ALTER TABLE "retiro_de_nombre_alternativo_de_ejercicio" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_ejercicio_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "retiro_de_nombre_alternativo_de_alimento" ADD CONSTRAINT "retiro_de_nombre_alternativo_de_alimento_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
