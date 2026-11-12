-- UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005, UC-E09; 08 §24.4 a §24.6 y §26.3): recuperar el acceso local. Solo
-- agrega: dos tablas con sus guardias y una guardia de la credencial que reemplaza a la de WP-02 sin aflojar nada más.
-- Ninguna fila existente cambia.

-- ─── 1. Los pedidos y los códigos de la recuperación (API-ACC-P1-01 y 02; API-ADM-18) ─────────────────────────────────
-- Un pedido de la persona (con el código por correo, o sin código si BE no tiene proveedor) o un código de la recuperación
-- asistida. Se guarda la huella del código (HMAC), nunca el código. De una fila solo cambian los intentos que no valieron,
-- de a uno y hasta 5, el uso y la anulación, una vez. No se borra.
CREATE TABLE "recuperacion_de_acceso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "origen" "OrigenDeRecuperacionDeAcceso" NOT NULL,
    "huella" TEXT,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "administrador_id" UUID,
    "fundamento" TEXT,
    "momento_de_uso" TIMESTAMPTZ(3),
    "momento_de_anulacion" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperacion_de_acceso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recuperacion_de_acceso_huella_key" ON "recuperacion_de_acceso"("huella");
CREATE INDEX "recuperacion_de_acceso_identidad_id_idx" ON "recuperacion_de_acceso"("identidad_id");
CREATE INDEX "recuperacion_de_acceso_administrador_id_idx" ON "recuperacion_de_acceso"("administrador_id");
ALTER TABLE "recuperacion_de_acceso" ADD CONSTRAINT "recuperacion_de_acceso_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "recuperacion_de_acceso" ADD CONSTRAINT "recuperacion_de_acceso_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- La asistida lleva su administrador, su fundamento y su código; el pedido de la persona, ninguno de los dos primeros.
ALTER TABLE "recuperacion_de_acceso" ADD CONSTRAINT "recuperacion_de_acceso_origen_coherente" CHECK (
  ("origen" = 'PEDIDO' AND "administrador_id" IS NULL AND "fundamento" IS NULL)
  OR ("origen" = 'ASISTIDA' AND "administrador_id" IS NOT NULL AND "fundamento" IS NOT NULL AND "huella" IS NOT NULL));
ALTER TABLE "recuperacion_de_acceso" ADD CONSTRAINT "recuperacion_de_acceso_valores_acotados" CHECK (
  ("huella" IS NULL OR "huella" ~ '^[0-9a-f]{64}$')
  AND ("fundamento" IS NULL OR char_length("fundamento") BETWEEN 1 AND 1000)
  AND "intentos_fallidos" BETWEEN 0 AND 5
  AND "vence_en" > "momento_de_registro"
  AND ("momento_de_uso" IS NULL OR "huella" IS NOT NULL));
ALTER TABLE "recuperacion_de_acceso" ADD CONSTRAINT "recuperacion_de_acceso_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
CREATE FUNCTION "be_recuperacion_de_acceso_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."intentos_fallidos" <> 0 OR NEW."momento_de_uso" IS NOT NULL OR NEW."momento_de_anulacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una recuperación del acceso nace sin intentos, sin uso y sin anular' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."origen" = 'ASISTIDA' THEN
      IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
        RAISE EXCEPTION 'BE: la recuperación asistida la emite un administrador con el rol vigente' USING ERRCODE = 'check_violation';
      END IF;
      IF NEW."administrador_id" = NEW."identidad_id" THEN
        RAISE EXCEPTION 'BE: nadie se emite una recuperación asistida a sí mismo' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: recuperacion_de_acceso es append-only (historia por adición)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."origen", NEW."huella", NEW."vence_en", NEW."administrador_id", NEW."fundamento", NEW."procedencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."origen", OLD."huella", OLD."vence_en", OLD."administrador_id", OLD."fundamento", OLD."procedencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: de una recuperación del acceso solo cambian los intentos, el uso y la anulación' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."intentos_fallidos" < OLD."intentos_fallidos" OR NEW."intentos_fallidos" > OLD."intentos_fallidos" + 1 THEN
    RAISE EXCEPTION 'BE: los intentos de una recuperación suben de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF (OLD."momento_de_uso" IS NOT NULL AND NEW."momento_de_uso" IS DISTINCT FROM OLD."momento_de_uso")
     OR (OLD."momento_de_anulacion" IS NOT NULL AND NEW."momento_de_anulacion" IS DISTINCT FROM OLD."momento_de_anulacion") THEN
    RAISE EXCEPTION 'BE: el uso y la anulación de una recuperación se registran una sola vez' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "recuperacion_de_acceso_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "recuperacion_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_recuperacion_de_acceso_guardar"();
CREATE TRIGGER "recuperacion_de_acceso_sin_truncate" BEFORE TRUNCATE ON "recuperacion_de_acceso" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── 2. El cambio de la credencial, como hecho ────────────────────────────────────────────────────────────────────────
-- De qué método local, con qué recuperación (de la misma identidad) y en qué transacción. `transaccion` lo ata al UPDATE
-- de la credencial (ver la guardia de abajo). Solo se agrega.
CREATE TABLE "cambio_de_credencial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "metodo_de_acceso_id" UUID NOT NULL,
    "recuperacion_id" UUID NOT NULL,
    "transaccion" BIGINT NOT NULL DEFAULT txid_current(),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambio_de_credencial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cambio_de_credencial_identidad_id_idx" ON "cambio_de_credencial"("identidad_id");
CREATE INDEX "cambio_de_credencial_metodo_de_acceso_id_idx" ON "cambio_de_credencial"("metodo_de_acceso_id");
CREATE INDEX "cambio_de_credencial_recuperacion_id_idx" ON "cambio_de_credencial"("recuperacion_id");
ALTER TABLE "cambio_de_credencial" ADD CONSTRAINT "cambio_de_credencial_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_credencial" ADD CONSTRAINT "cambio_de_credencial_metodo_de_acceso_id_fkey" FOREIGN KEY ("metodo_de_acceso_id") REFERENCES "metodo_de_acceso"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_credencial" ADD CONSTRAINT "cambio_de_credencial_recuperacion_id_fkey" FOREIGN KEY ("recuperacion_id") REFERENCES "recuperacion_de_acceso"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "cambio_de_credencial" ADD CONSTRAINT "cambio_de_credencial_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- El método es el local de esa identidad, y la recuperación es de la misma identidad.
CREATE FUNCTION "be_cambio_de_credencial_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "metodo_de_acceso" WHERE "id" = NEW."metodo_de_acceso_id" AND "identidad_id" = NEW."identidad_id" AND "tipo" = 'LOCAL') THEN
    RAISE EXCEPTION 'BE: el cambio de credencial es del método local de la misma identidad' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "recuperacion_de_acceso" WHERE "id" = NEW."recuperacion_id" AND "identidad_id" = NEW."identidad_id") THEN
    RAISE EXCEPTION 'BE: el cambio de credencial sale de una recuperación de la misma identidad' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "cambio_de_credencial_coherente" BEFORE INSERT ON "cambio_de_credencial" FOR EACH ROW EXECUTE FUNCTION "be_cambio_de_credencial_coherente"();
CREATE TRIGGER "cambio_de_credencial_solo_agregar" BEFORE UPDATE OR DELETE ON "cambio_de_credencial" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "cambio_de_credencial_sin_truncate" BEFORE TRUNCATE ON "cambio_de_credencial" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── 3. La credencial: cambia solo con su cambio registrado ──────────────────────────────────────────────────────────
-- Hasta acá la credencial no se modificaba (WP-02: «cambio de credencial fuera de alcance»). Desde UF-03, un UPDATE pasa
-- si conserva el método y en la misma transacción se registró su cambio para ese método. Cualquier otro UPDATE se rechaza,
-- y el DELETE sigue igual: solo al cierre de la cuenta, con su registro de supresión (08 R-02, §18). El disparador
-- `credencial_local_guardar` es el mismo: llama a esta función.
CREATE OR REPLACE FUNCTION "be_credencial_local_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_identidad uuid;
  v_estado "EstadoOperativoDeCuenta";
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."metodo_de_acceso_id" = OLD."metodo_de_acceso_id"
       AND EXISTS (SELECT 1 FROM "cambio_de_credencial" c WHERE c."metodo_de_acceso_id" = NEW."metodo_de_acceso_id" AND c."transaccion" = txid_current()) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'BE: la credencial cambia solo con su cambio registrado (recuperación del acceso, UF-03)' USING ERRCODE = 'restrict_violation';
  END IF;
  SELECT i."id", i."estado_operativo_de_cuenta" INTO v_identidad, v_estado
    FROM "metodo_de_acceso" m JOIN "identidad" i ON i."id" = m."identidad_id"
   WHERE m."id" = OLD."metodo_de_acceso_id";
  IF v_estado IS DISTINCT FROM 'CERRADA' THEN
    RAISE EXCEPTION 'BE: la credencial solo se suprime al cierre de cuenta (08 R-02)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "registro_de_supresion" WHERE "sujeto_id" = v_identidad AND "categoria" = 'CREDENCIAL_LOCAL') THEN
    RAISE EXCEPTION 'BE: toda supresión se asienta antes en el registro de supresiones (08 §18)' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END $$;
