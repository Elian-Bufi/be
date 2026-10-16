-- WP-NOVEDADES-Y-AVISOS (DEUDA_LEGAJO DL-133; pedido de Dirección del 2026-10-16): el centro de novedades (RF-061, P1;
-- UC-P30) y los avisos push no sensibles (RF-062, P2; UC-E08), con el modelo del 06 §5.11 (T-06-07 y T-06-08), y las
-- preferencias de los recordatorios diarios de registro.
-- Migración aditiva: seis enumeraciones y cinco tablas nuevas, sin tocar las existentes.
-- 1. Tablas, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: las novedades y sus lecturas solo se agregan; una sola
--    suscripción vigente por teléfono; el token con la forma de Expo; un recordatorio es de BE y de un día, y las demás
--    novedades tienen quien las originó.

-- CreateEnum
CREATE TYPE "TipoDeNovedad" AS ENUM ('PLAN_ACTIVADO', 'REVISION_REGISTRADA', 'SOLICITUD_RECIBIDA', 'SOLICITUD_ACEPTADA', 'SOLICITUD_RECHAZADA', 'VINCULO_PAUSADO', 'VINCULO_REANUDADO', 'VINCULO_FINALIZADO', 'CONSENTIMIENTO_REVOCADO', 'RECORDATORIO_DE_COMIDAS', 'RECORDATORIO_DE_ENTRENAMIENTO');

-- CreateEnum
CREATE TYPE "PlataformaDeAviso" AS ENUM ('ANDROID');

-- CreateEnum
CREATE TYPE "MotivoDeBajaDeSuscripcion" AS ENUM ('RETIRADA', 'REEMPLAZADA', 'OTRA_CUENTA', 'TOKEN_INVALIDO');

-- CreateEnum
CREATE TYPE "EstadoDeAvisoPush" AS ENUM ('EN_CURSO', 'ENVIADO', 'RECHAZADO', 'SIN_RESPUESTA', 'AGRUPADO');

-- CreateEnum
CREATE TYPE "TipoDeRecordatorio" AS ENUM ('COMIDAS', 'ENTRENAMIENTO');

-- CreateEnum
CREATE TYPE "EstadoDePreferencia" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateTable
CREATE TABLE "novedad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destinatario_id" UUID NOT NULL,
    "tipo" "TipoDeNovedad" NOT NULL,
    "alcance" "Alcance",
    "fuente_id" UUID,
    "referencia_tipo" TEXT,
    "referencia_id" UUID,
    "fecha_local" DATE,
    "clave_de_unicidad" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectura_de_novedad" (
    "novedad_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectura_de_novedad_pkey" PRIMARY KEY ("novedad_id")
);

-- CreateTable
CREATE TABLE "suscripcion_push" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "plataforma" "PlataformaDeAviso" NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_alta" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_baja" TIMESTAMPTZ(3),
    "motivo_de_baja" "MotivoDeBajaDeSuscripcion",

    CONSTRAINT "suscripcion_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviso_push" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "novedad_id" UUID NOT NULL,
    "suscripcion_id" UUID NOT NULL,
    "estado" "EstadoDeAvisoPush" NOT NULL,
    "ticket" TEXT,
    "detalle" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 1,
    "momento_de_intento" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aviso_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencia_de_recordatorio" (
    "identidad_id" UUID NOT NULL,
    "tipo" "TipoDeRecordatorio" NOT NULL,
    "estado" "EstadoDePreferencia" NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preferencia_de_recordatorio_pkey" PRIMARY KEY ("identidad_id","tipo")
);

-- CreateIndex
CREATE UNIQUE INDEX "novedad_clave_de_unicidad_key" ON "novedad"("clave_de_unicidad");

-- CreateIndex
CREATE INDEX "novedad_destinatario_id_momento_de_registro_id_idx" ON "novedad"("destinatario_id", "momento_de_registro" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "suscripcion_push_identidad_id_idx" ON "suscripcion_push"("identidad_id");

-- CreateIndex
CREATE INDEX "aviso_push_estado_momento_de_intento_idx" ON "aviso_push"("estado", "momento_de_intento");

-- CreateIndex
CREATE UNIQUE INDEX "aviso_push_novedad_id_suscripcion_id_key" ON "aviso_push"("novedad_id", "suscripcion_id");

-- AddForeignKey
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "lectura_de_novedad" ADD CONSTRAINT "lectura_de_novedad_novedad_id_fkey" FOREIGN KEY ("novedad_id") REFERENCES "novedad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_novedad_id_fkey" FOREIGN KEY ("novedad_id") REFERENCES "novedad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripcion_push"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "preferencia_de_recordatorio" ADD CONSTRAINT "preferencia_de_recordatorio_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;



-- ─── Las novedades y sus lecturas solo se agregan (08 §29; 06 §5.11) ───────────────────────────────────────────────
CREATE TRIGGER "novedad_solo_agregar" BEFORE UPDATE OR DELETE ON "novedad" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "novedad_sin_truncate" BEFORE TRUNCATE ON "novedad" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "lectura_de_novedad_solo_agregar" BEFORE UPDATE OR DELETE ON "lectura_de_novedad" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "lectura_de_novedad_sin_truncate" BEFORE TRUNCATE ON "lectura_de_novedad" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La forma de una novedad ────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_clave_valida" CHECK (char_length("clave_de_unicidad") BETWEEN 1 AND 200);
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_referencia_completa" CHECK (("referencia_tipo" IS NULL) = ("referencia_id" IS NULL));
-- Todas las de hoy son de un área. Una novedad general (UC-P30, V01) relajaría esta regla en su propia migración.
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_con_alcance" CHECK ("alcance" IS NOT NULL);
-- Un recordatorio lo emite BE y es de un día; las demás novedades tienen quien las originó y no son de un día.
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_recordatorio_coherente" CHECK (
  CASE WHEN "tipo" IN ('RECORDATORIO_DE_COMIDAS', 'RECORDATORIO_DE_ENTRENAMIENTO')
       THEN "fuente_id" IS NULL AND "fecha_local" IS NOT NULL
       ELSE "fuente_id" IS NOT NULL AND "fecha_local" IS NULL
  END);
ALTER TABLE "lectura_de_novedad" ADD CONSTRAINT "lectura_de_novedad_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── Las suscripciones: una vigente por teléfono, con una baja coherente ────────────────────────────────────────────
CREATE UNIQUE INDEX "suscripcion_push_una_vigente_por_dispositivo" ON "suscripcion_push" ("dispositivo_id") WHERE "momento_de_baja" IS NULL;
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_token_de_expo" CHECK ("token" ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,190}\]$');
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_baja_coherente" CHECK (
  ("momento_de_baja" IS NULL) = ("motivo_de_baja" IS NULL) AND ("momento_de_baja" IS NULL OR "momento_de_baja" >= "momento_de_alta"));
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- ─── Los avisos ─────────────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_intentos_positivos" CHECK ("intentos" >= 1);
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_textos_acotados" CHECK (
  ("ticket" IS NULL OR char_length("ticket") <= 200) AND ("detalle" IS NULL OR char_length("detalle") <= 200));

-- ─── Las preferencias ───────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE "preferencia_de_recordatorio" ADD CONSTRAINT "preferencia_de_recordatorio_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
