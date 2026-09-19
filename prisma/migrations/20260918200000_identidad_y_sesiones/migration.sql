-- WP-02 · Identidad y sesiones (docs/paquetes/WP-02.md). Migración aditiva sobre WP-01.
-- T-06-01…05, T-06-23, T-06-24 · 08 §12 (A1/A2/A3), §24, §26, §29, R-02 · 07 §43-bis · 09v7 T07.
-- Las garantías de la segunda mitad (triggers) refuerzan en la base lo que @be/domain decide.

-- CreateEnum
CREATE TYPE "TipoDeMetodoDeAcceso" AS ENUM ('LOCAL');

-- CreateEnum
CREATE TYPE "EstadoDeSesion" AS ENUM ('ACTIVA', 'FINALIZADA', 'REVOCADA');

-- CreateEnum
CREATE TYPE "MotivoDeRevocacionDeSesion" AS ENUM ('REVOCACION_POR_TITULAR', 'CIERRE_DE_CUENTA', 'SUSPENSION_DE_CUENTA');

-- CreateEnum
CREATE TYPE "Superficie" AS ENUM ('WEB', 'APK');

-- CreateEnum
CREATE TYPE "TipoDeTexto" AS ENUM ('TERMINOS', 'PRIVACIDAD_INFO', 'DATOS_SALUD_BE', 'CONSECUENCIAS_DE_CIERRE');

-- CreateEnum
CREATE TYPE "TipoDeActoRegistrable" AS ENUM ('TERMINOS', 'PRIVACIDAD_INFO', 'DATOS_SALUD_BE');

-- CreateEnum
CREATE TYPE "EstadoDeActoRegistrable" AS ENUM ('VIGENTE', 'REVOCADO');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeDominio" AS ENUM ('IdentidadCreada', 'MetodoDeAccesoAsociado', 'CuentaSuspendida', 'CuentaRestablecida', 'CuentaCerrada', 'ActoRevocado');

-- CreateEnum
CREATE TYPE "ResultadoDeOperacion" AS ENUM ('EXITO', 'RECHAZO');

-- AlterTable
ALTER TABLE "identidad" ADD COLUMN     "autoria_de_creacion_id" UUID NOT NULL,
ADD COLUMN     "procedencia" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "perfil_propio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "version_efectiva_id" UUID,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_propio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodo_de_acceso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "tipo" "TipoDeMetodoDeAcceso" NOT NULL,
    "referencia" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metodo_de_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial_local" (
    "metodo_de_acceso_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credencial_local_pkey" PRIMARY KEY ("metodo_de_acceso_id")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "estado" "EstadoDeSesion" NOT NULL DEFAULT 'ACTIVA',
    "superficie" "Superficie",
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "version_de_control" INTEGER NOT NULL,
    "momento_de_finalizacion" TIMESTAMPTZ(3),
    "motivo_de_revocacion" "MotivoDeRevocacionDeSesion",

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_de_sesion" (
    "identidad_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "control_de_sesion_pkey" PRIMARY KEY ("identidad_id")
);

-- CreateTable
CREATE TABLE "version_de_texto" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDeTexto" NOT NULL,
    "titulo" TEXT NOT NULL,
    "finalidad" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_texto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acto_registrable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "tipo" "TipoDeActoRegistrable" NOT NULL,
    "estado" "EstadoDeActoRegistrable" NOT NULL DEFAULT 'VIGENTE',
    "version_de_texto_id" TEXT NOT NULL,
    "hash_del_texto" TEXT NOT NULL,
    "finalidad" TEXT NOT NULL,
    "superficie" "Superficie",
    "direccion_ip" TEXT,
    "agente_de_usuario" TEXT,
    "actor_id" UUID NOT NULL,
    "autoria_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_revocacion" TIMESTAMPTZ(3),

    CONSTRAINT "acto_registrable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_dominio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "TipoDeEventoDeDominio" NOT NULL,
    "identidad_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_servicio" TEXT,
    "autoria_id" UUID,
    "procedencia" JSONB NOT NULL,
    "estado_anterior" "EstadoOperativoDeCuenta",
    "estado_resultante" "EstadoOperativoDeCuenta",
    "datos" JSONB,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_dominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_de_cierre_de_cuenta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "version_de_consecuencias_id" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_de_cierre_de_cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_de_supresion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoria" TEXT NOT NULL,
    "sujeto_id" UUID NOT NULL,
    "fundamento" TEXT NOT NULL,
    "ejecutor" TEXT NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_de_supresion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_de_auditoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operacion" TEXT NOT NULL,
    "resultado" "ResultadoDeOperacion" NOT NULL,
    "motivo" TEXT,
    "actor_id" UUID,
    "sujeto_id" UUID,
    "recurso_tipo" TEXT,
    "recurso_id" TEXT,
    "superficie" "Superficie",
    "request_id" TEXT,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_de_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_de_idempotencia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operacion" TEXT NOT NULL,
    "ambito" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "huella" TEXT NOT NULL,
    "estado_http" INTEGER NOT NULL,
    "cuerpo" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_de_idempotencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_propio_identidad_id_key" ON "perfil_propio"("identidad_id");

-- CreateIndex
CREATE INDEX "metodo_de_acceso_identidad_id_idx" ON "metodo_de_acceso"("identidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_de_acceso_tipo_referencia_key" ON "metodo_de_acceso"("tipo", "referencia");

-- CreateIndex
CREATE INDEX "sesion_identidad_id_estado_idx" ON "sesion"("identidad_id", "estado");

-- CreateIndex
CREATE INDEX "acto_registrable_identidad_id_tipo_estado_idx" ON "acto_registrable"("identidad_id", "tipo", "estado");

-- CreateIndex
CREATE INDEX "evento_de_dominio_identidad_id_tipo_idx" ON "evento_de_dominio"("identidad_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_de_cierre_de_cuenta_identidad_id_key" ON "solicitud_de_cierre_de_cuenta"("identidad_id");

-- CreateIndex
CREATE INDEX "registro_de_supresion_sujeto_id_idx" ON "registro_de_supresion"("sujeto_id");

-- CreateIndex
CREATE INDEX "registro_de_auditoria_sujeto_id_idx" ON "registro_de_auditoria"("sujeto_id");

-- CreateIndex
CREATE INDEX "registro_de_auditoria_operacion_momento_de_registro_idx" ON "registro_de_auditoria"("operacion", "momento_de_registro");

-- CreateIndex
CREATE UNIQUE INDEX "registro_de_idempotencia_operacion_ambito_clave_key" ON "registro_de_idempotencia"("operacion", "ambito", "clave");

-- AddForeignKey
ALTER TABLE "perfil_propio" ADD CONSTRAINT "perfil_propio_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodo_de_acceso" ADD CONSTRAINT "metodo_de_acceso_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credencial_local" ADD CONSTRAINT "credencial_local_metodo_de_acceso_id_fkey" FOREIGN KEY ("metodo_de_acceso_id") REFERENCES "metodo_de_acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_de_sesion" ADD CONSTRAINT "control_de_sesion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acto_registrable" ADD CONSTRAINT "acto_registrable_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acto_registrable" ADD CONSTRAINT "acto_registrable_version_de_texto_id_fkey" FOREIGN KEY ("version_de_texto_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_de_dominio" ADD CONSTRAINT "evento_de_dominio_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_de_cierre_de_cuenta" ADD CONSTRAINT "solicitud_de_cierre_de_cuenta_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_de_cierre_de_cuenta" ADD CONSTRAINT "solicitud_de_cierre_de_cuenta_version_de_consecuencias_id_fkey" FOREIGN KEY ("version_de_consecuencias_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- Garantías en la base (WP-02). Complementan @be/domain: si el código se equivoca, la base rechaza.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- Evento de dominio: exactamente un actor (identidad o servicio interno).
ALTER TABLE "evento_de_dominio" ADD CONSTRAINT "evento_de_dominio_un_actor"
  CHECK (("actor_id" IS NOT NULL) <> ("actor_servicio" IS NOT NULL));

-- Sesión revocada ⇒ motivo; finalizada o revocada ⇒ momento de finalización, nunca anterior a su inicio (T-06-24).
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_cierre_coherente" CHECK (
  (("estado" = 'ACTIVA' AND "momento_de_finalizacion" IS NULL AND "motivo_de_revocacion" IS NULL)
   OR ("estado" = 'FINALIZADA' AND "momento_de_finalizacion" IS NOT NULL AND "motivo_de_revocacion" IS NULL)
   OR ("estado" = 'REVOCADA' AND "momento_de_finalizacion" IS NOT NULL AND "motivo_de_revocacion" IS NOT NULL))
  AND ("momento_de_finalizacion" IS NULL OR "momento_de_finalizacion" >= "momento_de_ocurrencia")
);

-- ─── Historia por adición: tablas append-only (08 §29 «sin UPDATE/DELETE»; 07:845) ─────────────
CREATE FUNCTION "be_solo_agregar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'BE: % es append-only (historia por adición)', TG_TABLE_NAME USING ERRCODE = 'restrict_violation';
END $$;

CREATE TRIGGER "evento_de_dominio_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_dominio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_auditoria_solo_agregar" BEFORE UPDATE OR DELETE ON "registro_de_auditoria" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_supresion_solo_agregar" BEFORE UPDATE OR DELETE ON "registro_de_supresion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "solicitud_de_cierre_de_cuenta_solo_agregar" BEFORE UPDATE OR DELETE ON "solicitud_de_cierre_de_cuenta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_texto_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_texto" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_idempotencia_solo_agregar" BEFORE UPDATE OR DELETE ON "registro_de_idempotencia" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
-- WP-02 no implementa el retiro de métodos (REG-06-22): el método de acceso es inmutable.
CREATE TRIGGER "metodo_de_acceso_solo_agregar" BEFORE UPDATE OR DELETE ON "metodo_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

-- TRUNCATE esquiva los triggers de fila: se bloquea a nivel sentencia en toda tabla con historia.
CREATE TRIGGER "evento_de_dominio_sin_truncate" BEFORE TRUNCATE ON "evento_de_dominio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_auditoria_sin_truncate" BEFORE TRUNCATE ON "registro_de_auditoria" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_supresion_sin_truncate" BEFORE TRUNCATE ON "registro_de_supresion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "solicitud_de_cierre_de_cuenta_sin_truncate" BEFORE TRUNCATE ON "solicitud_de_cierre_de_cuenta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_texto_sin_truncate" BEFORE TRUNCATE ON "version_de_texto" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "acto_registrable_sin_truncate" BEFORE TRUNCATE ON "acto_registrable" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "identidad_sin_truncate" BEFORE TRUNCATE ON "identidad" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "perfil_propio_sin_truncate" BEFORE TRUNCATE ON "perfil_propio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "metodo_de_acceso_sin_truncate" BEFORE TRUNCATE ON "metodo_de_acceso" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "credencial_local_sin_truncate" BEFORE TRUNCATE ON "credencial_local" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "sesion_sin_truncate" BEFORE TRUNCATE ON "sesion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "control_de_sesion_sin_truncate" BEFORE TRUNCATE ON "control_de_sesion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "registro_de_idempotencia_sin_truncate" BEFORE TRUNCATE ON "registro_de_idempotencia" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── T-06-02: lista blanca de la máquina de estado de cuenta (06 §5.7) ─────────────────────────
CREATE FUNCTION "be_identidad_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- §5.7.2: estado inicial tras un registro exitoso = OPERATIVA.
    IF NEW."estado_operativo_de_cuenta" <> 'OPERATIVA' THEN
      RAISE EXCEPTION 'BE: estado inicial debe ser OPERATIVA (06 §5.7.2)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una Identidad no se elimina (INV-06-29)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."autoria_de_creacion_id", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."autoria_de_creacion_id", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el alta de una Identidad es inmutable' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."estado_operativo_de_cuenta" IS DISTINCT FROM OLD."estado_operativo_de_cuenta" AND NOT (
       (OLD."estado_operativo_de_cuenta" = 'OPERATIVA'  AND NEW."estado_operativo_de_cuenta" = 'SUSPENDIDA')   -- SuspenderCuenta
    OR (OLD."estado_operativo_de_cuenta" = 'SUSPENDIDA' AND NEW."estado_operativo_de_cuenta" = 'OPERATIVA')    -- RestablecerCuenta
    OR (OLD."estado_operativo_de_cuenta" = 'OPERATIVA'  AND NEW."estado_operativo_de_cuenta" = 'CERRADA')      -- CerrarCuenta
  ) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA % -> % (06 §5.7.4)', OLD."estado_operativo_de_cuenta", NEW."estado_operativo_de_cuenta"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "identidad_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "identidad" FOR EACH ROW EXECUTE FUNCTION "be_identidad_guardar"();

-- INV-06-22: toda Identidad registrada tiene exactamente un Perfil propio (verificado al confirmar la transacción).
CREATE FUNCTION "be_identidad_con_perfil_propio"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "perfil_propio" WHERE "identidad_id" = NEW."id") THEN
    RAISE EXCEPTION 'BE: Identidad % sin Perfil propio (INV-06-22)', NEW."id" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "identidad_con_perfil_propio" AFTER INSERT ON "identidad"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_identidad_con_perfil_propio"();

-- Perfil propio: no se elimina; solo cambia la referencia a su versión efectiva (06 §5.5).
CREATE FUNCTION "be_perfil_propio_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un Perfil propio no se elimina (INV-06-29)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: la historia del Perfil propio es inmutable' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "perfil_propio_guardar" BEFORE UPDATE OR DELETE ON "perfil_propio" FOR EACH ROW EXECUTE FUNCTION "be_perfil_propio_guardar"();

-- ─── Actos A1/A2/A3: evidencia inmutable; única transición VIGENTE → REVOCADO para tipos revocables ─
CREATE FUNCTION "be_acto_registrable_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'VIGENTE' OR NEW."momento_de_revocacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un acto nace VIGENTE' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un acto registrable no se elimina (08 §12.2)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."tipo", NEW."version_de_texto_id", NEW."hash_del_texto", NEW."finalidad",
      NEW."superficie", NEW."direccion_ip", NEW."agente_de_usuario", NEW."actor_id", NEW."autoria_id", NEW."procedencia",
      NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."tipo", OLD."version_de_texto_id", OLD."hash_del_texto", OLD."finalidad",
      OLD."superficie", OLD."direccion_ip", OLD."agente_de_usuario", OLD."actor_id", OLD."autoria_id", OLD."procedencia",
      OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: la evidencia de un acto es inmutable (08 §12.2)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'VIGENTE' AND NEW."estado" = 'REVOCADO' AND OLD."tipo" IN ('TERMINOS', 'DATOS_SALUD_BE')
          AND NEW."momento_de_revocacion" IS NOT NULL) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en acto % (% -> %)', OLD."tipo", OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "acto_registrable_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "acto_registrable" FOR EACH ROW EXECUTE FUNCTION "be_acto_registrable_guardar"();

-- ─── Sesión: nace ACTIVA; ACTIVA → FINALIZADA | REVOCADA; datos de emisión inmutables ──────────
CREATE FUNCTION "be_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'ACTIVA' THEN
      RAISE EXCEPTION 'BE: una sesión nace ACTIVA' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una sesión no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."superficie", NEW."momento_de_ocurrencia", NEW."momento_de_registro", NEW."expira_en", NEW."version_de_control")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."superficie", OLD."momento_de_ocurrencia", OLD."momento_de_registro", OLD."expira_en", OLD."version_de_control") THEN
    RAISE EXCEPTION 'BE: los datos de emisión de una sesión son inmutables' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'ACTIVA' AND NEW."estado" IN ('FINALIZADA', 'REVOCADA')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en sesión (% -> %)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "sesion_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "sesion" FOR EACH ROW EXECUTE FUNCTION "be_sesion_guardar"();

-- tokenVersion: solo crece de a uno.
CREATE FUNCTION "be_control_de_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: el control de sesión no se elimina' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."identidad_id" <> OLD."identidad_id" OR NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión de control de sesión solo avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "control_de_sesion_guardar" BEFORE UPDATE OR DELETE ON "control_de_sesion" FOR EACH ROW EXECUTE FUNCTION "be_control_de_sesion_guardar"();

-- ─── Credencial local: no se modifica; solo se suprime al cierre, con registro de supresión (08 R-02, §18) ─
CREATE FUNCTION "be_credencial_local_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_identidad uuid;
  v_estado "EstadoOperativoDeCuenta";
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'BE: la credencial no se modifica en WP-02 (cambio de credencial fuera de alcance)' USING ERRCODE = 'restrict_violation';
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
CREATE TRIGGER "credencial_local_guardar" BEFORE UPDATE OR DELETE ON "credencial_local" FOR EACH ROW EXECUTE FUNCTION "be_credencial_local_guardar"();

-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('terminos-2026-09-demo', 'TERMINOS', $be_texto$Términos de uso$be_texto$, 'USO_DEL_SERVICIO', $be_texto$Términos de uso de BE — versión de demostración 2026-09

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

1. BE es una plataforma que ayuda a asesorados y profesionales a organizar su trabajo de salud y entrenamiento.
2. Para usar BE necesitás una cuenta propia. Tu cuenta es personal e intransferible.
3. Crear una cuenta no te da acceso a datos de otras personas ni autoriza a ningún profesional a ver tus datos.
4. Podés cerrar tu cuenta cuando quieras desde Cuenta → Cerrar mi cuenta. El cierre impide nuevas sesiones y no se puede deshacer.
5. BE puede suspender una cuenta cuando exista un fundamento válido según su política. La suspensión no borra tu historia.
6. Estos términos pueden cambiar. Una versión nueva no se considera aceptada hasta que la aceptes.$be_texto$, '9373ea14836695df3f08a1947e34c3c3272d8cc84e29fe5c63c8320e7bb55d9b', '2026-09-18T00:00:00.000Z');
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('privacidad-2026-09-demo', 'PRIVACIDAD_INFO', $be_texto$Información de privacidad$be_texto$, 'INFORMACION_DEL_TRATAMIENTO', $be_texto$Información de privacidad de BE — versión de demostración 2026-09

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Responsable: BE (proyecto académico). Contacto de privacidad: el canal que se publique antes de operar con datos reales.

Finalidades: crear y mantener tu cuenta; permitirte iniciar sesión; registrar la evidencia de los actos que realizás (esta información, los términos y los consentimientos que otorgues).

Datos que tratamos al crear tu cuenta: tu correo electrónico como identificador de acceso (obligatorio para crear la cuenta) y la contraseña, que se guarda solo como hash y nunca en claro. Sin estos datos no se puede crear la cuenta.

Destinatarios y encargados: el proveedor de infraestructura donde funciona BE. Ningún profesional accede a tus datos por el solo hecho de que crees una cuenta.

Datos de salud: crear la cuenta no autoriza el tratamiento de datos de salud. Ese tratamiento requiere un consentimiento separado, que podés otorgar o no más adelante.

Acceso excepcional de soporte: BE prevé un acceso excepcional, auditado y limitado, para resolver incidentes. Se registra y se informa.

Transferencias internacionales: la infraestructura puede estar fuera de Argentina. Antes de operar con datos reales se informará el destino y el mecanismo.

Tus derechos: acceder, rectificar y suprimir tus datos, y cerrar tu cuenta. El canal para ejercerlos se publicará antes de operar con datos reales.

Esta información es una constancia de que te informamos. No es un consentimiento para tratar datos de salud.$be_texto$, '4d1d98a8b260d2f71481bac860fafb3da6c4fe251d69e6e05710ed897c9afbcd', '2026-09-18T00:00:00.000Z');
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('datos-salud-2026-09-demo', 'DATOS_SALUD_BE', $be_texto$Tratamiento de datos de salud$be_texto$, 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY', $be_texto$Consentimiento para el tratamiento de datos de salud por BE — versión de demostración 2026-09

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Si lo otorgás, BE podrá tratar los datos de salud que registres para operar el servicio y para mantener tu historia longitudinal.

Este consentimiento no autoriza a ningún profesional. Cada profesional necesita un consentimiento específico por alcance y finalidad.

Podés revocarlo cuando quieras. La revocación corta el tratamiento hacia adelante y no borra en silencio la historia ya registrada.$be_texto$, 'a6e7a55ba7e2433aa28873226e71f91efe4fa08acb32d8ee32acad9c42b82d70', '2026-09-18T00:00:00.000Z');
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('cierre-cuenta-2026-09-demo', 'CONSECUENCIAS_DE_CIERRE', $be_texto$Cerrar mi cuenta$be_texto$, 'CONSECUENCIAS_DEL_CIERRE', $be_texto$Cerrar mi cuenta

El cierre impide nuevas sesiones y nuevas operaciones cuando se hace efectivo. Los vínculos activos se finalizan mediante eventos y la historia no se borra silenciosamente. La conservación o supresión posterior se aplica según la política de privacidad.

El cierre no se puede deshacer.$be_texto$, '9fe2d19c00bc2987a0277c78f053d9b9de01fcd2e6d709db31cfc31924da5c5b', '2026-09-18T00:00:00.000Z');
