-- RF-068 (DL-172; 09 v0.12 §16; 06 T-06-06): las incidencias administrativas mínimas. Solo agrega: dos tipos, dos tablas y
-- sus guardias. Ninguna fila existente cambia.
--
-- Una persona o un profesional reporta una incidencia (categoría y descripción); Administración la consulta y le cambia el
-- estado con un motivo. La historia no se sobrescribe: cada cambio es una fila de `cambio_de_incidencia`, y la incidencia
-- solo cambia su estado, su versión y quién la tiene a cargo si ese cambio se registró antes, en la misma transacción.

CREATE TYPE "CategoriaDeIncidencia" AS ENUM ('ACCESO', 'PERFIL', 'VINCULO', 'INTEGRIDAD_DE_DATOS', 'FUNCIONAMIENTO');
CREATE TYPE "EstadoDeIncidencia" AS ENUM ('ABIERTA', 'EN_CURSO', 'RESUELTA');

CREATE TABLE "incidencia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reportante_id" UUID NOT NULL,
    "categoria" "CategoriaDeIncidencia" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoDeIncidencia" NOT NULL DEFAULT 'ABIERTA',
    "version" INTEGER NOT NULL DEFAULT 0,
    "responsable_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidencia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "incidencia_reportante_id_momento_de_registro_idx" ON "incidencia"("reportante_id", "momento_de_registro");
CREATE INDEX "incidencia_estado_momento_de_registro_idx" ON "incidencia"("estado", "momento_de_registro");
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_reportante_id_fkey" FOREIGN KEY ("reportante_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_descripcion_acotada" CHECK (char_length("descripcion") BETWEEN 1 AND 2000);
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_version_no_negativa" CHECK ("version" >= 0);
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

CREATE TABLE "cambio_de_incidencia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incidencia_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado_anterior" "EstadoDeIncidencia" NOT NULL,
    "estado_nuevo" "EstadoDeIncidencia" NOT NULL,
    "motivo" TEXT NOT NULL,
    "respuesta" TEXT,
    "administrador_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_incidencia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cambio_de_incidencia_incidencia_id_numero_key" ON "cambio_de_incidencia"("incidencia_id", "numero");
ALTER TABLE "cambio_de_incidencia" ADD CONSTRAINT "cambio_de_incidencia_incidencia_id_fkey" FOREIGN KEY ("incidencia_id") REFERENCES "incidencia"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_incidencia" ADD CONSTRAINT "cambio_de_incidencia_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Un cambio cambia el estado; resolver lleva la respuesta para quien la reportó.
ALTER TABLE "cambio_de_incidencia" ADD CONSTRAINT "cambio_de_incidencia_coherente" CHECK (
  "numero" >= 1
  AND "estado_nuevo" <> "estado_anterior"
  AND ("estado_nuevo" <> 'RESUELTA' OR "respuesta" IS NOT NULL));
ALTER TABLE "cambio_de_incidencia" ADD CONSTRAINT "cambio_de_incidencia_textos_acotados" CHECK (
  char_length("motivo") BETWEEN 1 AND 1000
  AND ("respuesta" IS NULL OR char_length("respuesta") BETWEEN 1 AND 2000));
ALTER TABLE "cambio_de_incidencia" ADD CONSTRAINT "cambio_de_incidencia_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- El cambio: de un administrador con su rol vigente, desde el estado actual y con la versión siguiente. La incidencia se
-- toma con FOR UPDATE: dos cambios simultáneos se ordenan, y el segundo choca con el estado o con el índice único.
CREATE FUNCTION "be_cambio_de_incidencia_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  actual RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: una incidencia la cambia un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  SELECT "estado", "version" INTO actual FROM "incidencia" WHERE "id" = NEW."incidencia_id" FOR UPDATE;
  IF actual."estado" IS DISTINCT FROM NEW."estado_anterior" OR actual."version" + 1 IS DISTINCT FROM NEW."numero" THEN
    RAISE EXCEPTION 'BE: el cambio de una incidencia parte de su estado y su versión actuales' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cambio_de_incidencia_guardar" BEFORE INSERT ON "cambio_de_incidencia" FOR EACH ROW EXECUTE FUNCTION "be_cambio_de_incidencia_guardar"();
CREATE TRIGGER "cambio_de_incidencia_solo_agregar" BEFORE UPDATE OR DELETE ON "cambio_de_incidencia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cambio_de_incidencia_sin_truncate" BEFORE TRUNCATE ON "cambio_de_incidencia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- La incidencia: nace ABIERTA, sin cambios ni responsable; no se borra; lo que se reportó no cambia, y su estado cambia
-- solo con el cambio que lo registró.
CREATE FUNCTION "be_incidencia_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'ABIERTA' OR NEW."version" <> 0 OR NEW."responsable_id" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una incidencia nace ABIERTA, sin cambios ni responsable' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: incidencia es append-only (historia por adición)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."reportante_id", NEW."categoria", NEW."descripcion", NEW."procedencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."reportante_id", OLD."categoria", OLD."descripcion", OLD."procedencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: de una incidencia solo cambian su estado y quién la tiene a cargo' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 OR NOT EXISTS (
    SELECT 1 FROM "cambio_de_incidencia" c
     WHERE c."incidencia_id" = NEW."id" AND c."numero" = NEW."version" AND c."estado_anterior" = OLD."estado"
       AND c."estado_nuevo" = NEW."estado" AND c."administrador_id" = NEW."responsable_id") THEN
    RAISE EXCEPTION 'BE: una incidencia cambia solo con el cambio que lo registra' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "incidencia_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "incidencia" FOR EACH ROW EXECUTE FUNCTION "be_incidencia_guardar"();
CREATE TRIGGER "incidencia_sin_truncate" BEFORE TRUNCATE ON "incidencia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
