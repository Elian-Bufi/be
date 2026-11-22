-- WP-RECETARIO-E-IMAGENES (DL-191; docs/paquetes/WP-RECETARIO-E-IMAGENES.md): el Recetario de BE y las imágenes livianas.
-- Migración aditiva: nada de lo anterior se reescribe. Los medios de antes siguen como están (JPEG de 1600 px en
-- `contenido_de_medio`); sus variantes se generan la primera vez que se piden (REC-D02).
-- 1. Tablas, enums, columnas, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base: la receta sin profesional es del recetario; la imagen de una receta, propia o del recetario;
--    las variantes, solo de la imagen de una receta; lo sumado y lo decidido, de un administrador con el rol vigente; la
--    cesión de la foto, completa; solo agregar.
-- CreateEnum
CREATE TYPE "VarianteDeMedio" AS ENUM ('MINIATURA', 'GRANDE');

-- CreateEnum
CREATE TYPE "ResultadoDePropuestaAlRecetario" AS ENUM ('SUMADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "receta" ALTER COLUMN "profesional_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "version_de_receta" ALTER COLUMN "autor_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "variante_de_medio" (
    "medio_id" UUID NOT NULL,
    "variante" "VarianteDeMedio" NOT NULL,
    "tipo" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "ancho" INTEGER NOT NULL,
    "alto" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "contenido" BYTEA NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variante_de_medio_pkey" PRIMARY KEY ("medio_id","variante")
);

-- CreateTable
CREATE TABLE "receta_del_recetario" (
    "receta_id" UUID NOT NULL,
    "propuesta_id" UUID,
    "administrador_id" UUID,
    "clave_de_semilla" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receta_del_recetario_pkey" PRIMARY KEY ("receta_id")
);

-- CreateTable
CREATE TABLE "copia_de_receta_del_recetario" (
    "receta_id" UUID NOT NULL,
    "origen_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copia_de_receta_del_recetario_pkey" PRIMARY KEY ("receta_id")
);

-- CreateTable
CREATE TABLE "propuesta_al_recetario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receta_id" UUID NOT NULL,
    "version_de_receta_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "medio_id" UUID,
    "version_de_la_cesion" TEXT,
    "huella_de_la_cesion" TEXT,
    "momento_de_la_cesion" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propuesta_al_recetario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_sobre_propuesta_al_recetario" (
    "propuesta_id" UUID NOT NULL,
    "resultado" "ResultadoDePropuestaAlRecetario" NOT NULL,
    "motivo" TEXT,
    "administrador_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_sobre_propuesta_al_recetario_pkey" PRIMARY KEY ("propuesta_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receta_del_recetario_propuesta_id_key" ON "receta_del_recetario"("propuesta_id");

-- CreateIndex
CREATE UNIQUE INDEX "receta_del_recetario_clave_de_semilla_key" ON "receta_del_recetario"("clave_de_semilla");

-- CreateIndex
CREATE INDEX "copia_de_receta_del_recetario_origen_id_idx" ON "copia_de_receta_del_recetario"("origen_id");

-- CreateIndex
CREATE INDEX "propuesta_al_recetario_receta_id_momento_de_registro_idx" ON "propuesta_al_recetario"("receta_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "medio_propietario_id_sha256_original_idx" ON "medio"("propietario_id", "sha256_original");

-- AddForeignKey
ALTER TABLE "variante_de_medio" ADD CONSTRAINT "variante_de_medio_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "receta_del_recetario" ADD CONSTRAINT "receta_del_recetario_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "receta_del_recetario" ADD CONSTRAINT "receta_del_recetario_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuesta_al_recetario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "receta_del_recetario" ADD CONSTRAINT "receta_del_recetario_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "copia_de_receta_del_recetario" ADD CONSTRAINT "copia_de_receta_del_recetario_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "copia_de_receta_del_recetario" ADD CONSTRAINT "copia_de_receta_del_recetario_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_receta_id_fkey" FOREIGN KEY ("receta_id") REFERENCES "receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_version_de_receta_id_fkey" FOREIGN KEY ("version_de_receta_id") REFERENCES "version_de_receta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "decision_sobre_propuesta_al_recetario" ADD CONSTRAINT "decision_sobre_propuesta_al_recetario_propuesta_id_fkey" FOREIGN KEY ("propuesta_id") REFERENCES "propuesta_al_recetario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "decision_sobre_propuesta_al_recetario" ADD CONSTRAINT "decision_sobre_propuesta_al_recetario_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Receta del recetario: sin profesional y con su fila (DL-191, REC-05) ──────────────────────────────────────────
-- Se verifica al confirmar: el servicio crea la receta, su versión y su fila del recetario en la misma transacción.
CREATE FUNCTION "be_receta_sin_profesional_es_del_recetario"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."profesional_id" IS NULL AND NOT EXISTS (SELECT 1 FROM "receta_del_recetario" WHERE "receta_id" = NEW."id") THEN
    RAISE EXCEPTION 'BE: una receta sin profesional es del Recetario de BE (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "receta_sin_profesional_es_del_recetario" AFTER INSERT ON "receta" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_receta_sin_profesional_es_del_recetario"();

-- La versión de una receta propia la escribe una persona; sin autor, solo la de una receta del recetario (la semilla).
CREATE FUNCTION "be_version_de_receta_autor"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."autor_id" IS NULL AND EXISTS (SELECT 1 FROM "receta" WHERE "id" = NEW."receta_id" AND "profesional_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'BE: la versión de una receta propia tiene autor (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_receta_autor" BEFORE INSERT ON "version_de_receta" FOR EACH ROW EXECUTE FUNCTION "be_version_de_receta_autor"();

-- Una receta del recetario no tiene profesional. La suma un administrador con su rol vigente desde una propuesta, o la
-- siembra BE con su código editorial, sin administrador.
ALTER TABLE "receta_del_recetario" ADD CONSTRAINT "receta_del_recetario_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "receta_del_recetario" ADD CONSTRAINT "receta_del_recetario_origen_coherente" CHECK (
  ("administrador_id" IS NOT NULL AND "propuesta_id" IS NOT NULL AND "clave_de_semilla" IS NULL)
  OR ("administrador_id" IS NULL AND "propuesta_id" IS NULL AND "clave_de_semilla" IS NOT NULL AND char_length(btrim("clave_de_semilla")) BETWEEN 1 AND 40)
);
CREATE FUNCTION "be_receta_del_recetario_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "receta" WHERE "id" = NEW."receta_id" AND "profesional_id" IS NULL) THEN
    RAISE EXCEPTION 'BE: una receta del Recetario de BE no tiene profesional (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."administrador_id" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: una receta la suma al recetario un administrador con su rol vigente (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "receta_del_recetario_guardar" BEFORE INSERT ON "receta_del_recetario" FOR EACH ROW EXECUTE FUNCTION "be_receta_del_recetario_guardar"();

-- ─── La copia: una receta propia que sale de una del recetario (REC-06) ───────────────────────────────────────────
ALTER TABLE "copia_de_receta_del_recetario" ADD CONSTRAINT "copia_de_receta_del_recetario_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
CREATE FUNCTION "be_copia_de_receta_del_recetario_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "receta" WHERE "id" = NEW."receta_id" AND "profesional_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'BE: la copia es una receta propia (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "receta_del_recetario" WHERE "receta_id" = NEW."origen_id") THEN
    RAISE EXCEPTION 'BE: se copia una receta del Recetario de BE (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "copia_de_receta_del_recetario_guardar" BEFORE INSERT ON "copia_de_receta_del_recetario" FOR EACH ROW EXECUTE FUNCTION "be_copia_de_receta_del_recetario_guardar"();

-- ─── La imagen de una receta (DL-119 → DL-191) ─────────────────────────────────────────────────────────────────────
-- Un medio DISPONIBLE de finalidad RECETA_REFERENCIA y, además, uno de estos: propio del profesional de la receta (como
-- en DL-119); la receta es del recetario (la imagen de la propuesta que se sumó); o el medio ya es la imagen de una
-- receta del recetario (la copia reusa la del recetario, sin duplicar bytes; REC-D06).
CREATE OR REPLACE FUNCTION "be_asociacion_de_imagen_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."numero" <> COALESCE((SELECT max("numero") FROM "asociacion_de_imagen_de_receta" WHERE "receta_id" = NEW."receta_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: cada cambio de la imagen de una receta sigue al anterior (DL-119)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."cambio" = 'ASOCIAR' AND NOT EXISTS (
       SELECT 1 FROM "medio" m JOIN "receta" r ON r."id" = NEW."receta_id"
        WHERE m."id" = NEW."medio_id" AND m."finalidad" = 'RECETA_REFERENCIA' AND m."estado" = 'DISPONIBLE'
          AND (m."propietario_id" = r."profesional_id"
               OR EXISTS (SELECT 1 FROM "receta_del_recetario" rr WHERE rr."receta_id" = r."id")
               OR EXISTS (SELECT 1 FROM "asociacion_de_imagen_de_receta" a JOIN "receta_del_recetario" rr ON rr."receta_id" = a."receta_id"
                           WHERE a."medio_id" = m."id"))) THEN
    RAISE EXCEPTION 'BE: la imagen de una receta es un medio DISPONIBLE de finalidad RECETA_REFERENCIA, de su profesional o del Recetario de BE (DL-119, DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- ─── Las variantes de la imagen de una receta (REC-01, REC-D01 a D03) ──────────────────────────────────────────────
ALTER TABLE "variante_de_medio" ADD CONSTRAINT "variante_de_medio_coherente" CHECK (
  "tipo" = 'image/webp' AND "bytes" > 0 AND "bytes" = octet_length("contenido") AND "ancho" > 0 AND "alto" > 0 AND "sha256" ~ '^[0-9a-f]{64}$'
);
CREATE FUNCTION "be_variante_de_medio_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM "medio" WHERE "id" = NEW."medio_id" AND "finalidad" = 'RECETA_REFERENCIA' AND "estado" IN ('PENDIENTE', 'DISPONIBLE')) THEN
      RAISE EXCEPTION 'BE: las variantes son de la imagen de una receta que no se suprimió (DL-191)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'BE: una variante de un medio no se reescribe (DL-191)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "medio" WHERE "id" = OLD."medio_id" AND "estado" = 'SUPRIMIDO') THEN
    RAISE EXCEPTION 'BE: las variantes de un medio se borran solo al suprimirlo (08:451)' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER "variante_de_medio_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "variante_de_medio" FOR EACH ROW EXECUTE FUNCTION "be_variante_de_medio_guardar"();

-- ─── Proponer al recetario (REC-07, REC-D08) ───────────────────────────────────────────────────────────────────────
-- La propuesta es de una versión de una receta propia de quien la propone. Si cita una imagen, es la imagen disponible de
-- una receta y la cesión está completa (la versión del texto, su SHA-256 y el momento); sin imagen, no hay cesión.
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "propuesta_al_recetario" ADD CONSTRAINT "propuesta_al_recetario_cesion_coherente" CHECK (
  ("medio_id" IS NULL AND "version_de_la_cesion" IS NULL AND "huella_de_la_cesion" IS NULL AND "momento_de_la_cesion" IS NULL)
  OR ("medio_id" IS NOT NULL AND char_length(btrim("version_de_la_cesion")) BETWEEN 1 AND 60 AND "huella_de_la_cesion" ~ '^[0-9a-f]{64}$' AND "momento_de_la_cesion" IS NOT NULL)
);
CREATE FUNCTION "be_propuesta_al_recetario_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "receta" r JOIN "version_de_receta" v ON v."receta_id" = r."id"
        WHERE r."id" = NEW."receta_id" AND v."id" = NEW."version_de_receta_id" AND r."profesional_id" = NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: se propone una versión de una receta propia (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."medio_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "medio" WHERE "id" = NEW."medio_id" AND "finalidad" = 'RECETA_REFERENCIA' AND "estado" = 'DISPONIBLE') THEN
    RAISE EXCEPTION 'BE: la imagen de una propuesta es la imagen disponible de una receta (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "propuesta_al_recetario_guardar" BEFORE INSERT ON "propuesta_al_recetario" FOR EACH ROW EXECUTE FUNCTION "be_propuesta_al_recetario_guardar"();

-- ─── Lo que decide Administración (REC-08) ─────────────────────────────────────────────────────────────────────────
-- Una sola vez por propuesta (la clave primaria), por un administrador con el rol vigente. SUMADA, con la receta del
-- recetario ya creada desde esa propuesta; RECHAZADA, sin ella.
ALTER TABLE "decision_sobre_propuesta_al_recetario" ADD CONSTRAINT "decision_sobre_propuesta_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "decision_sobre_propuesta_al_recetario" ADD CONSTRAINT "decision_sobre_propuesta_motivo" CHECK ("motivo" IS NULL OR char_length(btrim("motivo")) BETWEEN 1 AND 300);
CREATE FUNCTION "be_decision_sobre_propuesta_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: una propuesta la decide un administrador con su rol vigente (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  IF (NEW."resultado" = 'SUMADA') <> EXISTS (SELECT 1 FROM "receta_del_recetario" WHERE "propuesta_id" = NEW."propuesta_id") THEN
    RAISE EXCEPTION 'BE: una propuesta sumada tiene su receta en el recetario, y una rechazada no (DL-191)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "decision_sobre_propuesta_guardar" BEFORE INSERT ON "decision_sobre_propuesta_al_recetario" FOR EACH ROW EXECUTE FUNCTION "be_decision_sobre_propuesta_guardar"();

-- ─── Historia por adición: append-only y sin TRUNCATE ─────────────────────────────────────────────────────────────
CREATE TRIGGER "receta_del_recetario_solo_agregar" BEFORE UPDATE OR DELETE ON "receta_del_recetario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "copia_de_receta_del_recetario_solo_agregar" BEFORE UPDATE OR DELETE ON "copia_de_receta_del_recetario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "propuesta_al_recetario_solo_agregar" BEFORE UPDATE OR DELETE ON "propuesta_al_recetario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "decision_sobre_propuesta_solo_agregar" BEFORE UPDATE OR DELETE ON "decision_sobre_propuesta_al_recetario" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "variante_de_medio_sin_truncate" BEFORE TRUNCATE ON "variante_de_medio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "receta_del_recetario_sin_truncate" BEFORE TRUNCATE ON "receta_del_recetario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "copia_de_receta_del_recetario_sin_truncate" BEFORE TRUNCATE ON "copia_de_receta_del_recetario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "propuesta_al_recetario_sin_truncate" BEFORE TRUNCATE ON "propuesta_al_recetario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "decision_sobre_propuesta_sin_truncate" BEFORE TRUNCATE ON "decision_sobre_propuesta_al_recetario" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
