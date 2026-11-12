-- UF-06 de WP-USO-FINAL (DL-169; 08 §18 y §19; 09 v0.12 §14 y §15): los derechos de la persona. Solo agrega: dos tipos,
-- dos tablas y sus guardias. Ninguna fila existente cambia.

CREATE TYPE "TipoDePedidoDeDerecho" AS ENUM ('ACCESO', 'RECTIFICACION', 'SUPRESION');
CREATE TYPE "EstadoDePedidoDeDerecho" AS ENUM ('RECIBIDO', 'RESUELTO', 'RECHAZADO');

-- ─── Los pedidos de acceso, rectificación y supresión (API-RGT-01 a 03; API-ADM-16 y 17) ──────────────────────────────
-- Nacen RECIBIDOS, con su plazo, y Administración los resuelve una sola vez, con la respuesta a la persona y el fundamento
-- interno. No se borran ni se reescriben.
CREATE TABLE "pedido_de_derecho" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titular_id" UUID NOT NULL,
    "tipo" "TipoDePedidoDeDerecho" NOT NULL,
    "nota" TEXT,
    "estado" "EstadoDePedidoDeDerecho" NOT NULL DEFAULT 'RECIBIDO',
    "plazo" DATE NOT NULL,
    "respuesta" TEXT,
    "fundamento" TEXT,
    "administrador_id" UUID,
    "momento_de_resolucion" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_de_derecho_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pedido_de_derecho_titular_id_idx" ON "pedido_de_derecho"("titular_id");
CREATE INDEX "pedido_de_derecho_estado_plazo_idx" ON "pedido_de_derecho"("estado", "plazo");
ALTER TABLE "pedido_de_derecho" ADD CONSTRAINT "pedido_de_derecho_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "pedido_de_derecho" ADD CONSTRAINT "pedido_de_derecho_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "pedido_de_derecho" ADD CONSTRAINT "pedido_de_derecho_coherente" CHECK (
  ("estado" = 'RECIBIDO' AND "respuesta" IS NULL AND "fundamento" IS NULL AND "administrador_id" IS NULL AND "momento_de_resolucion" IS NULL)
  OR ("estado" IN ('RESUELTO', 'RECHAZADO') AND "respuesta" IS NOT NULL AND "fundamento" IS NOT NULL AND "administrador_id" IS NOT NULL AND "momento_de_resolucion" IS NOT NULL));
ALTER TABLE "pedido_de_derecho" ADD CONSTRAINT "pedido_de_derecho_textos_acotados" CHECK (
  ("nota" IS NULL OR char_length("nota") BETWEEN 1 AND 1000)
  AND ("respuesta" IS NULL OR char_length("respuesta") BETWEEN 1 AND 2000)
  AND ("fundamento" IS NULL OR char_length("fundamento") BETWEEN 1 AND 1000));
ALTER TABLE "pedido_de_derecho" ADD CONSTRAINT "pedido_de_derecho_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
CREATE FUNCTION "be_pedido_de_derecho_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'RECIBIDO' THEN
      RAISE EXCEPTION 'BE: un pedido de derecho nace RECIBIDO' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: pedido_de_derecho es append-only (historia por adición)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."titular_id", NEW."tipo", NEW."nota", NEW."plazo", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."titular_id", OLD."tipo", OLD."nota", OLD."plazo", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: de un pedido de derecho solo cambia su resolución' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'RECIBIDO' AND NEW."estado" IN ('RESUELTO', 'RECHAZADO')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en pedido de derecho (% -> %)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un pedido de derecho lo resuelve un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "pedido_de_derecho_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "pedido_de_derecho" FOR EACH ROW EXECUTE FUNCTION "be_pedido_de_derecho_guardar"();
CREATE TRIGGER "pedido_de_derecho_sin_truncate" BEFORE TRUNCATE ON "pedido_de_derecho" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Las exportaciones propias (API-EXP-01 y 02) ───────────────────────────────────────────────────────────────────────
-- Una fila por pedido, con sus dominios y su vencimiento. El archivo no se guarda: se arma al descargarlo. Solo se agrega.
CREATE TABLE "exportacion_propia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titular_id" UUID NOT NULL,
    "dominios" TEXT[] NOT NULL,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exportacion_propia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "exportacion_propia_titular_id_idx" ON "exportacion_propia"("titular_id");
ALTER TABLE "exportacion_propia" ADD CONSTRAINT "exportacion_propia_titular_id_fkey" FOREIGN KEY ("titular_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "exportacion_propia" ADD CONSTRAINT "exportacion_propia_dominios_validos" CHECK (
  cardinality("dominios") BETWEEN 1 AND 3 AND "dominios" <@ ARRAY['NUTRITION', 'TRAINING', 'ANTHROPOMETRY']::TEXT[]);
ALTER TABLE "exportacion_propia" ADD CONSTRAINT "exportacion_propia_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
CREATE TRIGGER "exportacion_propia_solo_agregar" BEFORE UPDATE OR DELETE ON "exportacion_propia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "exportacion_propia_sin_truncate" BEFORE TRUNCATE ON "exportacion_propia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
