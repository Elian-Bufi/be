-- WP-ADMINISTRACION (DL-155; docs/paquetes/WP-ADMINISTRACION.md): el rol administrativo, el segundo factor TOTP, la clase
-- de sesión y el actor explícito de los hechos de M-02. Lo que Prisma no modela está acá: un rol vigente por identidad,
-- un autenticador activo y uno pendiente, las transiciones de cada estado, lo inmutable y la identidad separada.

-- ─── Enumeraciones nuevas ──────────────────────────────────────────────────────────────────────────────────────────────
CREATE TYPE "ClaseDeSesion" AS ENUM ('PERSONAL', 'ADMINISTRATIVA');
CREATE TYPE "TipoDeActorDeVerificacion" AS ENUM ('SERVICIO_INTERNO', 'ADMINISTRADOR');
CREATE TYPE "EstadoDeRolAdministrativo" AS ENUM ('VIGENTE', 'RETIRADO');
CREATE TYPE "MotivoDeCodigoDeIncorporacion" AS ENUM ('INCORPORACION', 'RESTABLECIMIENTO');
CREATE TYPE "EstadoDeFactorTotp" AS ENUM ('PENDIENTE', 'ACTIVO', 'REEMPLAZADO', 'REVOCADO', 'DESCARTADO');
CREATE TYPE "MetodoDeSegundoFactor" AS ENUM ('TOTP', 'CODIGO_DE_RECUPERACION', 'CONFIGURACION');

-- ─── Los hechos de M-02: quién los hizo, de forma explícita ────────────────────────────────────────────────────────────
-- Las filas que ya existen son todas del servicio interno (DL-036): la columna nueva nace con ese valor para ellas, sin
-- tocar ninguna otra columna ni disparar el «solo agregar» (ALTER TABLE con un valor por defecto constante no reescribe
-- filas). Después se quita el valor por defecto: cada hecho nuevo tiene que declarar su actor.
ALTER TABLE "evento_de_verificacion" ADD COLUMN "tipo_de_actor" "TipoDeActorDeVerificacion" NOT NULL DEFAULT 'SERVICIO_INTERNO';
ALTER TABLE "evento_de_verificacion" ALTER COLUMN "tipo_de_actor" DROP DEFAULT;
ALTER TABLE "evento_de_verificacion" ADD COLUMN "administrador_id" UUID;
ALTER TABLE "evento_de_verificacion" ADD COLUMN "mensaje_al_profesional" TEXT;
ALTER TABLE "evento_de_verificacion" ADD COLUMN "version_previa" INTEGER;
ALTER TABLE "evento_de_verificacion" ALTER COLUMN "actor_servicio" DROP NOT NULL;
CREATE INDEX "evento_de_verificacion_administrador_id_idx" ON "evento_de_verificacion"("administrador_id");
ALTER TABLE "evento_de_verificacion" ADD CONSTRAINT "evento_de_verificacion_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Un actor, y el que corresponde: el servicio interno, con su nombre y sin administrador ni texto comunicado; un
-- administrador, con su identidad y sin nombre de servicio.
ALTER TABLE "evento_de_verificacion" ADD CONSTRAINT "evento_de_verificacion_actor_coherente" CHECK (
  ("tipo_de_actor" = 'SERVICIO_INTERNO' AND "actor_servicio" IS NOT NULL AND "administrador_id" IS NULL AND "mensaje_al_profesional" IS NULL)
  OR ("tipo_de_actor" = 'ADMINISTRADOR' AND "administrador_id" IS NOT NULL AND "actor_servicio" IS NULL AND "fundamento" IS NOT NULL));
ALTER TABLE "evento_de_verificacion" ADD CONSTRAINT "evento_de_verificacion_textos_acotados" CHECK (
  ("mensaje_al_profesional" IS NULL OR char_length("mensaje_al_profesional") BETWEEN 1 AND 600)
  AND ("tipo_de_actor" = 'SERVICIO_INTERNO' OR char_length("fundamento") BETWEEN 1 AND 1000));
ALTER TABLE "evento_de_verificacion" ADD CONSTRAINT "evento_de_verificacion_version_previa_positiva" CHECK ("version_previa" IS NULL OR "version_previa" >= 1);

-- ─── La sesión: PERSONAL o ADMINISTRATIVA, inmutable ───────────────────────────────────────────────────────────────────
ALTER TABLE "sesion" ADD COLUMN "clase" "ClaseDeSesion" NOT NULL DEFAULT 'PERSONAL';

-- ─── El rol administrativo ─────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "rol_administrativo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "estado" "EstadoDeRolAdministrativo" NOT NULL DEFAULT 'VIGENTE',
    "nombre_visible" TEXT NOT NULL,
    "fundamento" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_retiro" TIMESTAMPTZ(3),
    "fundamento_del_retiro" TEXT,
    "operador_del_retiro" TEXT,

    CONSTRAINT "rol_administrativo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rol_administrativo_identidad_id_idx" ON "rol_administrativo"("identidad_id");
ALTER TABLE "rol_administrativo" ADD CONSTRAINT "rol_administrativo_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Como máximo un rol vigente por identidad.
CREATE UNIQUE INDEX "rol_administrativo_vigente_por_identidad" ON "rol_administrativo"("identidad_id") WHERE "estado" = 'VIGENTE';
ALTER TABLE "rol_administrativo" ADD CONSTRAINT "rol_administrativo_textos" CHECK (
  char_length("nombre_visible") BETWEEN 1 AND 80 AND char_length("fundamento") BETWEEN 1 AND 1000 AND char_length("operador") BETWEEN 1 AND 120);
ALTER TABLE "rol_administrativo" ADD CONSTRAINT "rol_administrativo_retiro_coherente" CHECK (
  ("estado" = 'VIGENTE' AND "momento_de_retiro" IS NULL AND "fundamento_del_retiro" IS NULL AND "operador_del_retiro" IS NULL)
  OR ("estado" = 'RETIRADO' AND "momento_de_retiro" IS NOT NULL AND char_length("fundamento_del_retiro") BETWEEN 1 AND 1000
      AND char_length("operador_del_retiro") BETWEEN 1 AND 120));
ALTER TABLE "rol_administrativo" ADD CONSTRAINT "rol_administrativo_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- Una identidad administrativa es una identidad separada (criterio de Dirección del 2026-10-25): no es profesional ni parte
-- de un vínculo, una solicitud o una invitación. Nace VIGENTE; solo pasa a RETIRADO; lo demás no cambia; no se borra.
CREATE FUNCTION "be_rol_administrativo_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'VIGENTE' THEN
      RAISE EXCEPTION 'BE: un rol administrativo nace VIGENTE' USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."identidad_id")
       OR EXISTS (SELECT 1 FROM "verificacion_profesional" WHERE "identidad_id" = NEW."identidad_id")
       OR EXISTS (SELECT 1 FROM "habilitacion" WHERE "identidad_id" = NEW."identidad_id")
       OR EXISTS (SELECT 1 FROM "solicitud_de_vinculo" WHERE "profesional_id" = NEW."identidad_id" OR "asesorado_id" = NEW."identidad_id")
       OR EXISTS (SELECT 1 FROM "vinculo" WHERE "profesional_id" = NEW."identidad_id" OR "asesorado_id" = NEW."identidad_id")
       OR EXISTS (SELECT 1 FROM "invitacion_de_vinculo" WHERE "profesional_id" = NEW."identidad_id") THEN
      RAISE EXCEPTION 'BE: una identidad administrativa no es profesional ni parte de un vínculo (identidad separada)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un rol administrativo no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."nombre_visible", NEW."fundamento", NEW."operador", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."nombre_visible", OLD."fundamento", OLD."operador", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el rol administrativo conserva su asignación' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'VIGENTE' AND NEW."estado" = 'RETIRADO') THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en rol administrativo (% -> %)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "rol_administrativo_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "rol_administrativo" FOR EACH ROW EXECUTE FUNCTION "be_rol_administrativo_guardar"();
CREATE TRIGGER "rol_administrativo_sin_truncate" BEFORE TRUNCATE ON "rol_administrativo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- Y al revés: a una identidad con rol vigente no se le crea un perfil profesional ni entra en un vínculo, una solicitud o
-- una invitación (la siembra de demostración tampoco puede convertirla en profesional).
CREATE FUNCTION "be_sin_rol_administrativo"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ids uuid[];
BEGIN
  IF TG_TABLE_NAME IN ('solicitud_de_vinculo', 'vinculo') THEN
    v_ids := ARRAY[NEW."profesional_id", NEW."asesorado_id"];
  ELSIF TG_TABLE_NAME = 'invitacion_de_vinculo' THEN
    v_ids := ARRAY[NEW."profesional_id"];
  ELSE
    v_ids := ARRAY[NEW."identidad_id"];
  END IF;
  IF EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = ANY(v_ids) AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: una identidad administrativa no opera como profesional ni como persona (% )', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "perfil_profesional_sin_rol_administrativo" BEFORE INSERT ON "perfil_profesional" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();
CREATE TRIGGER "verificacion_profesional_sin_rol_administrativo" BEFORE INSERT ON "verificacion_profesional" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();
CREATE TRIGGER "habilitacion_sin_rol_administrativo" BEFORE INSERT ON "habilitacion" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();
CREATE TRIGGER "solicitud_de_vinculo_sin_rol_administrativo" BEFORE INSERT ON "solicitud_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();
CREATE TRIGGER "vinculo_sin_rol_administrativo" BEFORE INSERT ON "vinculo" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();
CREATE TRIGGER "invitacion_de_vinculo_sin_rol_administrativo" BEFORE INSERT ON "invitacion_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_sin_rol_administrativo"();

-- Una decisión de un administrador exige su rol vigente al decidir, y nadie decide sobre sí mismo.
CREATE FUNCTION "be_evento_de_verificacion_administrador_vigente"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."tipo_de_actor" = 'ADMINISTRADOR' THEN
    IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
      RAISE EXCEPTION 'BE: una decisión administrativa exige un rol administrativo vigente' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."administrador_id" = NEW."identidad_id" THEN
      RAISE EXCEPTION 'BE: nadie decide sobre su propia verificación' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "evento_de_verificacion_administrador_vigente" BEFORE INSERT ON "evento_de_verificacion" FOR EACH ROW EXECUTE FUNCTION "be_evento_de_verificacion_administrador_vigente"();

-- La sesión: nace ACTIVA; sus datos de emisión, ahora con la clase, no cambian. Una sesión ADMINISTRATIVA exige el rol
-- vigente, y una identidad con rol vigente no abre sesiones PERSONAL.
CREATE OR REPLACE FUNCTION "be_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'ACTIVA' THEN
      RAISE EXCEPTION 'BE: una sesión nace ACTIVA' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."clase" = 'ADMINISTRATIVA' AND NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."identidad_id" AND "estado" = 'VIGENTE') THEN
      RAISE EXCEPTION 'BE: una sesión administrativa exige un rol administrativo vigente' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."clase" = 'PERSONAL' AND EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."identidad_id" AND "estado" = 'VIGENTE') THEN
      RAISE EXCEPTION 'BE: una identidad administrativa no abre sesiones comunes' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una sesión no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."superficie", NEW."momento_de_ocurrencia", NEW."momento_de_registro", NEW."expira_en", NEW."version_de_control", NEW."clase")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."superficie", OLD."momento_de_ocurrencia", OLD."momento_de_registro", OLD."expira_en", OLD."version_de_control", OLD."clase") THEN
    RAISE EXCEPTION 'BE: los datos de emisión de una sesión son inmutables' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'ACTIVA' AND NEW."estado" IN ('FINALIZADA', 'REVOCADA')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en sesión (% -> %)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- ─── El código de incorporación ────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "codigo_de_incorporacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "huella" TEXT NOT NULL,
    "motivo" "MotivoDeCodigoDeIncorporacion" NOT NULL,
    "fundamento" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_uso" TIMESTAMPTZ(3),
    "momento_de_anulacion" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_de_incorporacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "codigo_de_incorporacion_huella_key" ON "codigo_de_incorporacion"("huella");
CREATE INDEX "codigo_de_incorporacion_identidad_id_idx" ON "codigo_de_incorporacion"("identidad_id");
ALTER TABLE "codigo_de_incorporacion" ADD CONSTRAINT "codigo_de_incorporacion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Un solo código vigente por identidad: emitir otro anula el anterior en la misma transacción.
CREATE UNIQUE INDEX "codigo_de_incorporacion_vigente_por_identidad" ON "codigo_de_incorporacion"("identidad_id") WHERE "momento_de_uso" IS NULL AND "momento_de_anulacion" IS NULL;
ALTER TABLE "codigo_de_incorporacion" ADD CONSTRAINT "codigo_de_incorporacion_huella_sha256" CHECK ("huella" ~ '^[0-9a-f]{64}$');
ALTER TABLE "codigo_de_incorporacion" ADD CONSTRAINT "codigo_de_incorporacion_fin_unico" CHECK ("momento_de_uso" IS NULL OR "momento_de_anulacion" IS NULL);
ALTER TABLE "codigo_de_incorporacion" ADD CONSTRAINT "codigo_de_incorporacion_textos" CHECK (char_length("fundamento") BETWEEN 1 AND 1000 AND char_length("operador") BETWEEN 1 AND 120);
ALTER TABLE "codigo_de_incorporacion" ADD CONSTRAINT "codigo_de_incorporacion_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
CREATE FUNCTION "be_codigo_de_incorporacion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."momento_de_uso" IS NOT NULL OR NEW."momento_de_anulacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un código de incorporación nace sin usar' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un código de incorporación no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."huella", NEW."motivo", NEW."fundamento", NEW."operador", NEW."vence_en", NEW."procedencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."huella", OLD."motivo", OLD."fundamento", OLD."operador", OLD."vence_en", OLD."procedencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: un código de incorporación no cambia' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD."momento_de_uso" IS NOT NULL OR OLD."momento_de_anulacion" IS NOT NULL THEN
    RAISE EXCEPTION 'BE: un código de incorporación usado o anulado no vuelve a cambiar' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "codigo_de_incorporacion_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "codigo_de_incorporacion" FOR EACH ROW EXECUTE FUNCTION "be_codigo_de_incorporacion_guardar"();
CREATE TRIGGER "codigo_de_incorporacion_sin_truncate" BEFORE TRUNCATE ON "codigo_de_incorporacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── El autenticador TOTP ──────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "factor_totp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "estado" "EstadoDeFactorTotp" NOT NULL DEFAULT 'PENDIENTE',
    "secreto_cifrado" TEXT NOT NULL,
    "ultimo_paso" BIGINT,
    "fallos_seguidos" INTEGER NOT NULL DEFAULT 0,
    "sesion_de_configuracion_id" UUID,
    "vence_en" TIMESTAMPTZ(3),
    "momento_de_activacion" TIMESTAMPTZ(3),
    "momento_de_baja" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factor_totp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "factor_totp_identidad_id_estado_idx" ON "factor_totp"("identidad_id", "estado");
ALTER TABLE "factor_totp" ADD CONSTRAINT "factor_totp_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE UNIQUE INDEX "factor_totp_activo_por_identidad" ON "factor_totp"("identidad_id") WHERE "estado" = 'ACTIVO';
CREATE UNIQUE INDEX "factor_totp_pendiente_por_identidad" ON "factor_totp"("identidad_id") WHERE "estado" = 'PENDIENTE';
-- El secreto, solo cifrado: «v1.<iv>.<texto cifrado>.<etiqueta>», en base64url (AES-256-GCM).
ALTER TABLE "factor_totp" ADD CONSTRAINT "factor_totp_secreto_cifrado" CHECK ("secreto_cifrado" ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$');
ALTER TABLE "factor_totp" ADD CONSTRAINT "factor_totp_estado_coherente" CHECK (
  ("estado" = 'PENDIENTE' AND "vence_en" IS NOT NULL AND "momento_de_activacion" IS NULL AND "momento_de_baja" IS NULL)
  OR ("estado" = 'ACTIVO' AND "momento_de_activacion" IS NOT NULL AND "momento_de_baja" IS NULL)
  OR ("estado" IN ('REEMPLAZADO', 'REVOCADO') AND "momento_de_activacion" IS NOT NULL AND "momento_de_baja" IS NOT NULL)
  OR ("estado" = 'DESCARTADO' AND "momento_de_activacion" IS NULL AND "momento_de_baja" IS NOT NULL));
ALTER TABLE "factor_totp" ADD CONSTRAINT "factor_totp_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Los códigos que no valen, seguidos, en cualquier sesión: con 10, el autenticador queda bloqueado (se vuelve a 0 con un
-- código que vale, o con uno de recuperación).
ALTER TABLE "factor_totp" ADD CONSTRAINT "factor_totp_fallos_seguidos" CHECK ("fallos_seguidos" >= 0);
CREATE FUNCTION "be_factor_totp_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'PENDIENTE' OR NEW."ultimo_paso" IS NOT NULL OR NEW."fallos_seguidos" <> 0 THEN
      RAISE EXCEPTION 'BE: un autenticador nace PENDIENTE, sin pasos usados ni fallos' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un autenticador no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."secreto_cifrado", NEW."sesion_de_configuracion_id", NEW."vence_en", NEW."procedencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."secreto_cifrado", OLD."sesion_de_configuracion_id", OLD."vence_en", OLD."procedencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el secreto y la configuración de un autenticador no cambian' USING ERRCODE = 'restrict_violation';
  END IF;
  -- Un código ya usado no vale otra vez: el último paso aceptado solo avanza.
  IF OLD."ultimo_paso" IS NOT NULL AND (NEW."ultimo_paso" IS NULL OR NEW."ultimo_paso" < OLD."ultimo_paso") THEN
    RAISE EXCEPTION 'BE: el último paso de un autenticador solo avanza' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (
       (OLD."estado" = 'PENDIENTE' AND NEW."estado" IN ('ACTIVO', 'DESCARTADO'))
    OR (OLD."estado" = 'ACTIVO' AND NEW."estado" IN ('ACTIVO', 'REEMPLAZADO', 'REVOCADO'))
  ) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en autenticador (% -> %)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "factor_totp_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "factor_totp" FOR EACH ROW EXECUTE FUNCTION "be_factor_totp_guardar"();
CREATE TRIGGER "factor_totp_sin_truncate" BEFORE TRUNCATE ON "factor_totp" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Los códigos de recuperación ───────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE "codigo_de_recuperacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "huella" TEXT NOT NULL,
    "momento_de_uso" TIMESTAMPTZ(3),
    "sesion_de_uso_id" UUID,
    "momento_de_invalidacion" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_de_recuperacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "codigo_de_recuperacion_huella_key" ON "codigo_de_recuperacion"("huella");
CREATE INDEX "codigo_de_recuperacion_identidad_id_lote_id_idx" ON "codigo_de_recuperacion"("identidad_id", "lote_id");
ALTER TABLE "codigo_de_recuperacion" ADD CONSTRAINT "codigo_de_recuperacion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "codigo_de_recuperacion" ADD CONSTRAINT "codigo_de_recuperacion_huella_hmac" CHECK ("huella" ~ '^[0-9a-f]{64}$');
ALTER TABLE "codigo_de_recuperacion" ADD CONSTRAINT "codigo_de_recuperacion_uso_coherente" CHECK (
  ("momento_de_uso" IS NULL) = ("sesion_de_uso_id" IS NULL) AND ("momento_de_uso" IS NULL OR "momento_de_invalidacion" IS NULL));
CREATE FUNCTION "be_codigo_de_recuperacion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."momento_de_uso" IS NOT NULL OR NEW."momento_de_invalidacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un código de recuperación nace sin usar' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un código de recuperación no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."lote_id", NEW."huella", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."lote_id", OLD."huella", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: un código de recuperación no cambia' USING ERRCODE = 'restrict_violation';
  END IF;
  -- Un solo uso: usado o invalidado, no vuelve a cambiar.
  IF OLD."momento_de_uso" IS NOT NULL OR OLD."momento_de_invalidacion" IS NOT NULL THEN
    RAISE EXCEPTION 'BE: un código de recuperación usado o invalidado no vuelve a cambiar' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "codigo_de_recuperacion_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "codigo_de_recuperacion" FOR EACH ROW EXECUTE FUNCTION "be_codigo_de_recuperacion_guardar"();
CREATE TRIGGER "codigo_de_recuperacion_sin_truncate" BEFORE TRUNCATE ON "codigo_de_recuperacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── El segundo factor de cada sesión administrativa ───────────────────────────────────────────────────────────────────
CREATE TABLE "segundo_factor_de_sesion" (
    "sesion_id" UUID NOT NULL,
    "identidad_id" UUID NOT NULL,
    "verificado_en" TIMESTAMPTZ(3),
    "metodo" "MetodoDeSegundoFactor",
    "ultima_actividad" TIMESTAMPTZ(3),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "segundo_factor_de_sesion_pkey" PRIMARY KEY ("sesion_id")
);
CREATE INDEX "segundo_factor_de_sesion_identidad_id_idx" ON "segundo_factor_de_sesion"("identidad_id");
ALTER TABLE "segundo_factor_de_sesion" ADD CONSTRAINT "segundo_factor_de_sesion_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesion"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "segundo_factor_de_sesion" ADD CONSTRAINT "segundo_factor_de_sesion_coherente" CHECK (
  ("verificado_en" IS NULL) = ("metodo" IS NULL) AND "intentos_fallidos" >= 0);
CREATE FUNCTION "be_segundo_factor_de_sesion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM "sesion" WHERE "id" = NEW."sesion_id" AND "identidad_id" = NEW."identidad_id" AND "clase" = 'ADMINISTRATIVA') THEN
      RAISE EXCEPTION 'BE: el segundo factor es de una sesión administrativa de esa identidad' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: el segundo factor de una sesión no se elimina' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."sesion_id", NEW."identidad_id", NEW."momento_de_registro") IS DISTINCT FROM (OLD."sesion_id", OLD."identidad_id", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el segundo factor conserva su sesión' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "segundo_factor_de_sesion_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "segundo_factor_de_sesion" FOR EACH ROW EXECUTE FUNCTION "be_segundo_factor_de_sesion_guardar"();
CREATE TRIGGER "segundo_factor_de_sesion_sin_truncate" BEFORE TRUNCATE ON "segundo_factor_de_sesion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
