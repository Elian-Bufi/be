-- WP-CATALOGO-VISUAL (encargo de Dirección del 2026-11-02): las zonas musculares de un ejercicio (DL-081) y la imagen del
-- catálogo de todos (DL-162). Migración aditiva: nada de lo anterior se reescribe.
-- 1. Tablas, enum, índices y claves foráneas, en la forma que genera `prisma migrate diff` desde prisma/schema.prisma.
-- 2. El catálogo de las 17 zonas (REG-06-137), el mismo de `ZONAS_MUSCULARES` del dominio: los identificadores son los
--    del set de capas de Dirección (be-mask-{sexo}-{vista}-{zona}.png). La prueba de integración compara las dos listas.
-- 3. Garantías en la base, aunque el código se equivoque: cada asignación de zonas sigue a la anterior y va en una versión
--    del ejercicio; lo cargado a mano lo asigna quien lo cargó y lo de todos, solo la curaduría de BE; las zonas se agregan
--    a la asignación vigente; la imagen del catálogo de todos la asocia una cuenta administradora de BE, curada; solo
--    agregar y sin TRUNCATE.

-- CreateEnum
CREATE TYPE "RolDeZonaMuscular" AS ENUM ('PRINCIPAL', 'SECUNDARIO');

-- CreateTable
CREATE TABLE "zona_muscular" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vista_anterior" BOOLEAN NOT NULL,
    "vista_posterior" BOOLEAN NOT NULL,
    "version_del_catalogo" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zona_muscular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignacion_de_zonas_de_ejercicio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejercicio_id" UUID NOT NULL,
    "version_de_ejercicio_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "autor_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignacion_de_zonas_de_ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zona_de_ejercicio" (
    "asignacion_id" UUID NOT NULL,
    "zona_id" TEXT NOT NULL,
    "rol" "RolDeZonaMuscular" NOT NULL,

    CONSTRAINT "zona_de_ejercicio_pkey" PRIMARY KEY ("asignacion_id","zona_id")
);

-- CreateIndex
CREATE INDEX "asignacion_de_zonas_de_ejercicio_version_de_ejercicio_id_idx" ON "asignacion_de_zonas_de_ejercicio"("version_de_ejercicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignacion_de_zonas_de_ejercicio_ejercicio_id_numero_key" ON "asignacion_de_zonas_de_ejercicio"("ejercicio_id", "numero");

-- CreateIndex
CREATE INDEX "zona_de_ejercicio_zona_id_idx" ON "zona_de_ejercicio"("zona_id");

-- AddForeignKey
ALTER TABLE "asignacion_de_zonas_de_ejercicio" ADD CONSTRAINT "asignacion_de_zonas_de_ejercicio_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asignacion_de_zonas_de_ejercicio" ADD CONSTRAINT "asignacion_de_zonas_de_ejercicio_version_de_ejercicio_id_fkey" FOREIGN KEY ("version_de_ejercicio_id") REFERENCES "version_de_ejercicio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asignacion_de_zonas_de_ejercicio" ADD CONSTRAINT "asignacion_de_zonas_de_ejercicio_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "zona_de_ejercicio" ADD CONSTRAINT "zona_de_ejercicio_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignacion_de_zonas_de_ejercicio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "zona_de_ejercicio" ADD CONSTRAINT "zona_de_ejercicio_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zona_muscular"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── El catálogo de las 17 zonas (REG-06-137; 09v10 §8) ─────────────────────────────────────────────────────────────
-- 9 de frente, 10 de espalda, antebrazo y deltoides en las dos. Una zona es dominio, no un archivo (REG-06-138).
ALTER TABLE "zona_muscular" ADD CONSTRAINT "zona_muscular_con_vista" CHECK ("vista_anterior" OR "vista_posterior");
ALTER TABLE "zona_muscular" ADD CONSTRAINT "zona_muscular_identificador" CHECK ("id" ~ '^[a-z]+(-[a-z]+)*$' AND btrim("nombre") <> '');

INSERT INTO "zona_muscular" ("id", "nombre", "vista_anterior", "vista_posterior", "version_del_catalogo", "momento_de_registro") VALUES
  ('trapecio', 'Trapecio', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('deltoides', 'Deltoides', true, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('pectoral', 'Pectoral', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('romboides', 'Romboides', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('dorsal', 'Dorsal ancho', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('biceps', 'Bíceps', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('triceps', 'Tríceps', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('antebrazo', 'Antebrazo', true, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('recto-abdominal', 'Recto abdominal', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('oblicuos', 'Oblicuos', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('erectores', 'Erectores espinales', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('gluteos', 'Glúteos', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('cuadriceps', 'Cuádriceps', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('aductores', 'Aductores', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('isquios', 'Isquiotibiales', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('tibial', 'Tibial anterior', true, false, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z'),
  ('gemelos', 'Gemelos', false, true, 'zonas-be-2026-11-02', '2026-11-02T00:00:00.000Z');

-- ─── Las zonas de un ejercicio: cada asignación sigue a la anterior, por quien corresponde (DL-081; REG-06-139) ──────
-- Lo cargado a mano lo asigna quien lo cargó; lo sembrado y lo importado de wger (de todos, DL-141 D-1), solo la
-- curaduría de BE, sin autor (procedencia CURADURIA_BE). Ningún profesional cambia el catálogo de todos (REG-06-135).
CREATE FUNCTION "be_asignacion_de_zonas_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  curada boolean;
BEGIN
  curada := COALESCE(NEW."procedencia" ->> 'carga' = 'CURADURIA_BE', false);
  IF NEW."numero" <> COALESCE((SELECT max("numero") FROM "asignacion_de_zonas_de_ejercicio" WHERE "ejercicio_id" = NEW."ejercicio_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: cada cambio de las zonas de un ejercicio sigue al anterior (DL-081)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
       SELECT 1 FROM "ejercicio_de_catalogo" e JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id"
        WHERE e."id" = NEW."ejercicio_id" AND v."id" = NEW."version_de_ejercicio_id"
          AND CASE WHEN curada THEN e."procedencia" IN ('BE_SYNTHETIC_SEED', 'CONTROLLED_IMPORT') AND NEW."autor_id" IS NULL
                   ELSE e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id" END) THEN
    RAISE EXCEPTION 'BE: las zonas van en una versión de un ejercicio cargado a mano por quien las declara, o del catálogo de todos curadas por BE (REG-06-135, REG-06-139)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "asignacion_de_zonas_de_ejercicio_insertar" BEFORE INSERT ON "asignacion_de_zonas_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_asignacion_de_zonas_insertar"();

-- Una zona se agrega solo a la asignación vigente de su ejercicio: una asignación pasada no cambia.
CREATE FUNCTION "be_zona_de_ejercicio_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "asignacion_de_zonas_de_ejercicio" a
        WHERE a."id" = NEW."asignacion_id"
          AND a."numero" = (SELECT max(b."numero") FROM "asignacion_de_zonas_de_ejercicio" b WHERE b."ejercicio_id" = a."ejercicio_id")) THEN
    RAISE EXCEPTION 'BE: una zona se agrega solo a la asignación vigente de su ejercicio (DL-081)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "zona_de_ejercicio_insertar" BEFORE INSERT ON "zona_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_zona_de_ejercicio_insertar"();

-- ─── La imagen del catálogo de todos: curada por BE (DL-162; REG-06-135, inciso 1) ──────────────────────────────────
-- Reemplaza la función de 20261006100100: lo cargado a mano sigue igual (DL-123). Lo sembrado y lo importado aceptan una
-- imagen solo con la procedencia CURADURIA_BE y de una cuenta administradora de BE con el rol vigente, que es también la
-- dueña del medio. La vigente es la de mayor número: a lo sumo una por ejercicio.
CREATE OR REPLACE FUNCTION "be_asociacion_de_imagen_de_ejercicio_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  curada boolean;
BEGIN
  curada := COALESCE(NEW."procedencia" ->> 'carga' = 'CURADURIA_BE', false);
  IF NEW."numero" <> COALESCE((SELECT max("numero") FROM "asociacion_de_imagen_de_ejercicio" WHERE "ejercicio_id" = NEW."ejercicio_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: cada cambio de la imagen de un ejercicio sigue al anterior (DL-123)' USING ERRCODE = 'check_violation';
  END IF;
  -- REG-06-135: lo cargado a mano, por quien lo cargó; lo de todos, solo curado por BE. Siempre por identidad y versión,
  -- nunca por nombre.
  IF NOT EXISTS (
       SELECT 1 FROM "ejercicio_de_catalogo" e JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id"
        WHERE e."id" = NEW."ejercicio_id" AND v."id" = NEW."version_de_ejercicio_id"
          AND CASE WHEN curada THEN e."procedencia" IN ('BE_SYNTHETIC_SEED', 'CONTROLLED_IMPORT')
                                AND EXISTS (SELECT 1 FROM "rol_administrativo" r WHERE r."identidad_id" = NEW."autor_id" AND r."estado" = 'VIGENTE')
                   ELSE e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id" END) THEN
    RAISE EXCEPTION 'BE: la imagen va en una versión de un ejercicio cargado a mano por quien la asocia, o del catálogo de todos curada por BE (REG-06-135)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."cambio" = 'ASOCIAR' AND NOT EXISTS (
       SELECT 1 FROM "medio" m
        WHERE m."id" = NEW."medio_id" AND m."finalidad" = 'REFERENCIA_DE_EJERCICIO' AND m."estado" = 'DISPONIBLE' AND m."propietario_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: la imagen de un ejercicio es un medio DISPONIBLE de quien la asocia, de finalidad REFERENCIA_DE_EJERCICIO (DL-123)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- ─── Historia por adición: solo agregar y sin TRUNCATE ──────────────────────────────────────────────────────────────
CREATE TRIGGER "zona_muscular_solo_agregar" BEFORE UPDATE OR DELETE ON "zona_muscular" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "asignacion_de_zonas_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "asignacion_de_zonas_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "zona_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "zona_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "zona_muscular_sin_truncate" BEFORE TRUNCATE ON "zona_muscular" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "asignacion_de_zonas_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "asignacion_de_zonas_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "zona_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "zona_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
