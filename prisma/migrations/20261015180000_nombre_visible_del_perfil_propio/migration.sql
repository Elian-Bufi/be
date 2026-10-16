-- DEUDA_LEGAJO DL-009 (opción B) y DL-040, decididas por Dirección el 2026-10-15: el perfil propio tiene su primer campo
-- aprobado, el nombre visible (C3, «contacto mínimo del vínculo», 08 §11), y el profesional con un vínculo vigente lo ve
-- en lugar de la referencia neutral. Cada cambio es una versión (06 §5.5; REG-06-20): la tabla nueva solo admite
-- agregar, y el perfil apunta a la versión efectiva, la única columna que el perfil ya dejaba cambiar.
-- Migración aditiva: una tabla, dos índices únicos y dos claves foráneas. Los perfiles existentes quedan sin versión
-- (sin nombre): el profesional sigue viendo la referencia neutral hasta que la persona declare uno.
-- 1. Tabla, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: el nombre, sin espacios de más y de 1 a 60 caracteres; el
--    número de versión, positivo; la historia, solo por adición; la versión efectiva, del mismo perfil y la última.

-- CreateTable
CREATE TABLE "version_de_perfil_propio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "perfil_propio_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre_visible" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_perfil_propio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "version_de_perfil_propio_perfil_propio_id_numero_key" ON "version_de_perfil_propio"("perfil_propio_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_propio_version_efectiva_id_key" ON "perfil_propio"("version_efectiva_id");

-- AddForeignKey
ALTER TABLE "perfil_propio" ADD CONSTRAINT "perfil_propio_version_efectiva_id_fkey" FOREIGN KEY ("version_efectiva_id") REFERENCES "version_de_perfil_propio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_perfil_propio" ADD CONSTRAINT "version_de_perfil_propio_perfil_propio_id_fkey" FOREIGN KEY ("perfil_propio_id") REFERENCES "perfil_propio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── El nombre como lo guarda la API, y una versión que avanza ──────────────────────────────────────────────────────
ALTER TABLE "version_de_perfil_propio" ADD CONSTRAINT "version_de_perfil_propio_nombre_visible_valido"
  CHECK ("nombre_visible" IS NULL OR ("nombre_visible" = btrim("nombre_visible") AND char_length("nombre_visible") BETWEEN 1 AND 60));
ALTER TABLE "version_de_perfil_propio" ADD CONSTRAINT "version_de_perfil_propio_numero_positivo" CHECK ("numero" >= 1);
ALTER TABLE "version_de_perfil_propio" ADD CONSTRAINT "version_de_perfil_propio_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── La historia solo se agrega (como el resto de la historia de BE) ────────────────────────────────────────────────
CREATE TRIGGER "version_de_perfil_propio_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_perfil_propio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_perfil_propio_sin_truncate" BEFORE TRUNCATE ON "version_de_perfil_propio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La versión efectiva es de ese perfil, y la última (06 §5.5.2) ──────────────────────────────────────────────────
CREATE FUNCTION "be_perfil_propio_version_efectiva"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."version_efectiva_id" IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "version_de_perfil_propio" v
     WHERE v."id" = NEW."version_efectiva_id" AND v."perfil_propio_id" = NEW."id"
       AND NOT EXISTS (SELECT 1 FROM "version_de_perfil_propio" o WHERE o."perfil_propio_id" = NEW."id" AND o."numero" > v."numero")
  ) THEN
    RAISE EXCEPTION 'BE: la versión efectiva de un Perfil propio es la última de ese perfil (06 §5.5.2)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "perfil_propio_version_efectiva" BEFORE INSERT OR UPDATE OF "version_efectiva_id" ON "perfil_propio"
  FOR EACH ROW EXECUTE FUNCTION "be_perfil_propio_version_efectiva"();
