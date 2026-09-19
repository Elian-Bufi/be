-- WP-03 · Vínculo, consentimiento y PDP (docs/paquetes/WP-03.md). Migración aditiva sobre WP-02.
-- 06 §6 mínimo (T-06-09…13, DL-036) · 06 §7 (T-06-15…19, T-06-45; REG-06-44…61; INV-06-50…68) · 08 §12.2, §12.3,
-- §13, §14, §27, §29 · 09v8 REL/CON · 09 §31-§37 · 09v11 §15 (DSH-03 mínimo, DL-031).
-- Primera mitad: DDL generado por `prisma migrate diff` desde schema.prisma. Segunda mitad: garantías escritas a mano.

-- CreateEnum
CREATE TYPE "Alcance" AS ENUM ('NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA');

-- CreateEnum
CREATE TYPE "Finalidad" AS ENUM ('ACOMPANAMIENTO_NUTRICIONAL', 'PLANIFICACION_DEL_ENTRENAMIENTO', 'EVALUACION_ANTROPOMETRICA');

-- CreateEnum
CREATE TYPE "TipoDePerfilProfesional" AS ENUM ('SANITARIO', 'NO_SANITARIO');

-- CreateEnum
CREATE TYPE "EstadoDeVerificacionProfesional" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoDeHabilitacion" AS ENUM ('CONCEDIDA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "EstadoDeSolicitudDeVinculo" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA');

-- CreateEnum
CREATE TYPE "EstadoDeAlcanceDeVinculo" AS ENUM ('ACEPTADO', 'PAUSADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "SituacionDeConsentimiento" AS ENUM ('VIGENTE', 'REVOCADO');

-- CreateEnum
CREATE TYPE "DecisionDeConsentimiento" AS ENUM ('OTORGAMIENTO', 'NUEVA_VERSION', 'REVOCACION', 'REOTORGAMIENTO');

-- CreateEnum
CREATE TYPE "RolEnVinculo" AS ENUM ('PROFESIONAL', 'ASESORADO');

-- CreateEnum
CREATE TYPE "MotivoDeTransicionDeVinculo" AS ENUM ('DECISION_PERSONAL', 'DISPONIBILIDAD', 'OBJETIVO_CUMPLIDO', 'CAMBIO_DE_PROFESIONAL', 'OTRO', 'CIERRE_DE_CUENTA');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeVinculo" AS ENUM ('SolicitudDeVinculoCreada', 'SolicitudDeVinculoAceptada', 'SolicitudDeVinculoRechazada', 'SolicitudDeVinculoCaducada', 'SolicitudDeVinculoInvalidada', 'AlcanceDeVinculoAceptado', 'AlcanceDeVinculoPausado', 'AlcanceDeVinculoReanudado', 'AlcanceDeVinculoFinalizado', 'ConsentimientoOtorgado', 'NuevaVersionDeConsentimientoAceptada', 'ConsentimientoRevocado', 'ConsentimientoOtorgadoNuevamente');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeVerificacion" AS ENUM ('PerfilProfesionalCreado', 'AlcancePresentado', 'ObservacionRegistrada', 'SubsanacionPresentada', 'AlcanceVerificado', 'AlcanceRechazado', 'AlcancePresentadoNuevamente', 'AlcanceSuspendido', 'AlcanceRehabilitado', 'HabilitacionConcedida', 'HabilitacionRetirada');

-- CreateEnum
CREATE TYPE "ResultadoDeDecision" AS ENUM ('PERMITIDA', 'DENEGADA');

-- CreateEnum
CREATE TYPE "DimensionDeAutorizacion" AS ENUM ('ROL', 'ESPECIALIDAD_O_CAPACIDAD', 'SITUACION', 'VINCULO', 'CONSENTIMIENTO', 'FINALIDAD', 'ALCANCE');

-- AlterTable
ALTER TABLE "version_de_texto" ADD COLUMN     "reemplaza_a_id" TEXT;

-- CreateTable
CREATE TABLE "perfil_profesional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "tipo" "TipoDePerfilProfesional" NOT NULL,
    "nombre_visible" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificacion_profesional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "estado" "EstadoDeVerificacionProfesional" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_ultima_transicion" TIMESTAMPTZ(3),

    CONSTRAINT "verificacion_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilitacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "estado" "EstadoDeHabilitacion" NOT NULL DEFAULT 'CONCEDIDA',
    "version" INTEGER NOT NULL DEFAULT 1,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_ultima_transicion" TIMESTAMPTZ(3),

    CONSTRAINT "habilitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_verificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeVerificacion" NOT NULL,
    "identidad_id" UUID NOT NULL,
    "alcance" "Alcance",
    "estado_previo" TEXT,
    "estado_posterior" TEXT,
    "fundamento" TEXT,
    "actor_servicio" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_de_vinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "iniciador" "RolEnVinculo" NOT NULL,
    "estado" "EstadoDeSolicitudDeVinculo" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "antecedente_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vence_en" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_resolucion" TIMESTAMPTZ(3),

    CONSTRAINT "solicitud_de_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alcance_de_vinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vinculo_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "solicitud_de_origen_id" UUID NOT NULL,
    "estado" "EstadoDeAlcanceDeVinculo" NOT NULL DEFAULT 'ACEPTADO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "pausado_por" "RolEnVinculo",
    "motivo_de_ultima_transicion" "MotivoDeTransicionDeVinculo",
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alcance_de_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alcance_de_vinculo_id" UUID NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "situacion" "SituacionDeConsentimiento" NOT NULL DEFAULT 'VIGENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_consentimiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "consentimiento_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "decision" "DecisionDeConsentimiento" NOT NULL,
    "situacion_resultante" "SituacionDeConsentimiento" NOT NULL,
    "version_de_texto_id" TEXT,
    "hash_del_texto" TEXT,
    "alcance" "Alcance" NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "categorias" JSONB NOT NULL DEFAULT '[]',
    "version_de_matriz" TEXT,
    "superficie" "Superficie",
    "direccion_ip" TEXT,
    "agente_de_usuario" TEXT,
    "actor_id" UUID NOT NULL,
    "autoria_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_vinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeVinculo" NOT NULL,
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "solicitud_de_vinculo_id" UUID,
    "alcance_de_vinculo_id" UUID,
    "consentimiento_id" UUID,
    "version_de_consentimiento_id" UUID,
    "estado_previo" TEXT,
    "estado_posterior" TEXT NOT NULL,
    "motivo" "MotivoDeTransicionDeVinculo",
    "actor_id" UUID,
    "actor_servicio" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_de_acceso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "operacion" TEXT NOT NULL,
    "resultado" "ResultadoDeDecision" NOT NULL,
    "actor_id" UUID NOT NULL,
    "sujeto_id" UUID,
    "alcance" "Alcance" NOT NULL,
    "finalidad" "Finalidad" NOT NULL,
    "dimensiones_desfavorables" "DimensionDeAutorizacion"[],
    "alcance_de_vinculo_id" UUID,
    "consentimiento_id" UUID,
    "version_de_consentimiento_id" UUID,
    "version_de_matriz" TEXT,
    "superficie" "Superficie",
    "request_id" TEXT,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_de_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_profesional_identidad_id_key" ON "perfil_profesional"("identidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "verificacion_profesional_identidad_id_alcance_key" ON "verificacion_profesional"("identidad_id", "alcance");

-- CreateIndex
CREATE UNIQUE INDEX "habilitacion_identidad_id_alcance_key" ON "habilitacion"("identidad_id", "alcance");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_verificacion_secuencia_key" ON "evento_de_verificacion"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_verificacion_identidad_id_alcance_idx" ON "evento_de_verificacion"("identidad_id", "alcance");

-- CreateIndex
CREATE INDEX "solicitud_de_vinculo_profesional_id_estado_idx" ON "solicitud_de_vinculo"("profesional_id", "estado");

-- CreateIndex
CREATE INDEX "solicitud_de_vinculo_asesorado_id_estado_idx" ON "solicitud_de_vinculo"("asesorado_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_profesional_id_asesorado_id_key" ON "vinculo"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE UNIQUE INDEX "alcance_de_vinculo_solicitud_de_origen_id_key" ON "alcance_de_vinculo"("solicitud_de_origen_id");

-- CreateIndex
CREATE INDEX "alcance_de_vinculo_vinculo_id_alcance_idx" ON "alcance_de_vinculo"("vinculo_id", "alcance");

-- CreateIndex
CREATE UNIQUE INDEX "consentimiento_alcance_de_vinculo_id_finalidad_key" ON "consentimiento"("alcance_de_vinculo_id", "finalidad");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_consentimiento_predecesora_id_key" ON "version_de_consentimiento"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_consentimiento_consentimiento_id_idx" ON "version_de_consentimiento"("consentimiento_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_vinculo_secuencia_key" ON "evento_de_vinculo"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_vinculo_asesorado_id_momento_de_registro_idx" ON "evento_de_vinculo"("asesorado_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "evento_de_vinculo_alcance_de_vinculo_id_idx" ON "evento_de_vinculo"("alcance_de_vinculo_id");

-- CreateIndex
CREATE INDEX "evento_de_vinculo_consentimiento_id_idx" ON "evento_de_vinculo"("consentimiento_id");

-- CreateIndex
CREATE UNIQUE INDEX "decision_de_acceso_secuencia_key" ON "decision_de_acceso"("secuencia");

-- CreateIndex
CREATE INDEX "decision_de_acceso_actor_id_sujeto_id_alcance_momento_de_re_idx" ON "decision_de_acceso"("actor_id", "sujeto_id", "alcance", "momento_de_registro");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_texto_reemplaza_a_id_key" ON "version_de_texto"("reemplaza_a_id");

-- AddForeignKey
ALTER TABLE "version_de_texto" ADD CONSTRAINT "version_de_texto_reemplaza_a_id_fkey" FOREIGN KEY ("reemplaza_a_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_profesional" ADD CONSTRAINT "perfil_profesional_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificacion_profesional" ADD CONSTRAINT "verificacion_profesional_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitacion" ADD CONSTRAINT "habilitacion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_de_verificacion" ADD CONSTRAINT "evento_de_verificacion_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_antecedente_id_fkey" FOREIGN KEY ("antecedente_id") REFERENCES "solicitud_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo" ADD CONSTRAINT "vinculo_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo" ADD CONSTRAINT "vinculo_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alcance_de_vinculo" ADD CONSTRAINT "alcance_de_vinculo_vinculo_id_fkey" FOREIGN KEY ("vinculo_id") REFERENCES "vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alcance_de_vinculo" ADD CONSTRAINT "alcance_de_vinculo_solicitud_de_origen_id_fkey" FOREIGN KEY ("solicitud_de_origen_id") REFERENCES "solicitud_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimiento" ADD CONSTRAINT "consentimiento_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_de_consentimiento" ADD CONSTRAINT "version_de_consentimiento_consentimiento_id_fkey" FOREIGN KEY ("consentimiento_id") REFERENCES "consentimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_de_consentimiento" ADD CONSTRAINT "version_de_consentimiento_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_consentimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_de_consentimiento" ADD CONSTRAINT "version_de_consentimiento_version_de_texto_id_fkey" FOREIGN KEY ("version_de_texto_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- Garantías en la base (WP-03). Complementan @be/domain: si el código se equivoca, la base rechaza.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Integridad referencial de hechos y decisiones (sin CASCADE: historia por adición, 08 §17) ──
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_solicitud_de_vinculo_id_fkey" FOREIGN KEY ("solicitud_de_vinculo_id") REFERENCES "solicitud_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_consentimiento_id_fkey" FOREIGN KEY ("consentimiento_id") REFERENCES "consentimiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_version_de_consentimiento_id_fkey" FOREIGN KEY ("version_de_consentimiento_id") REFERENCES "version_de_consentimiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_sujeto_id_fkey" FOREIGN KEY ("sujeto_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_consentimiento_id_fkey" FOREIGN KEY ("consentimiento_id") REFERENCES "consentimiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_version_de_consentimiento_id_fkey" FOREIGN KEY ("version_de_consentimiento_id") REFERENCES "version_de_consentimiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ─── Coherencia estructural ─────────────────────────────────────────────────────────────────────
-- Finalidad sintética del alcance (DL-039): la finalidad no se amplía ni se cruza entre alcances (REG-06-61).
CREATE FUNCTION "be_finalidad_de_alcance"("a" "Alcance") RETURNS "Finalidad" LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE "a"
    WHEN 'NUTRICION' THEN 'ACOMPANAMIENTO_NUTRICIONAL'::"Finalidad"
    WHEN 'ENTRENAMIENTO' THEN 'PLANIFICACION_DEL_ENTRENAMIENTO'::"Finalidad"
    WHEN 'ANTROPOMETRIA' THEN 'EVALUACION_ANTROPOMETRICA'::"Finalidad"
  END
$$;
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_finalidad_del_alcance" CHECK ("finalidad" = "be_finalidad_de_alcance"("alcance"));
ALTER TABLE "alcance_de_vinculo" ADD CONSTRAINT "alcance_de_vinculo_finalidad_del_alcance" CHECK ("finalidad" = "be_finalidad_de_alcance"("alcance"));
ALTER TABLE "version_de_consentimiento" ADD CONSTRAINT "version_de_consentimiento_finalidad_del_alcance" CHECK ("finalidad" = "be_finalidad_de_alcance"("alcance"));
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_finalidad_del_alcance" CHECK ("finalidad" = "be_finalidad_de_alcance"("alcance"));

-- Partes distintas: nadie se vincula consigo mismo.
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_partes_distintas" CHECK ("profesional_id" <> "asesorado_id");
ALTER TABLE "vinculo" ADD CONSTRAINT "vinculo_partes_distintas" CHECK ("profesional_id" <> "asesorado_id");

-- Solicitud: la resolución existe exactamente cuando salió de PENDIENTE.
ALTER TABLE "solicitud_de_vinculo" ADD CONSTRAINT "solicitud_de_vinculo_resolucion_coherente" CHECK (("estado" = 'PENDIENTE') = ("momento_de_resolucion" IS NULL));

-- REG-06-44 / INV-06-51: «solo una puede estar PENDIENTE» entre solicitudes equivalentes (profesional, destinatario,
-- Alcance y finalidad). Índice único parcial: lo garantiza la base, no un if (07:3060).
CREATE UNIQUE INDEX "solicitud_de_vinculo_pendiente_equivalente" ON "solicitud_de_vinculo" ("profesional_id", "asesorado_id", "alcance", "finalidad") WHERE "estado" = 'PENDIENTE';

-- INV-06-58 (FINALIZADO no se reabre) + DL-034: un solo componente no FINALIZADO por (vínculo, alcance).
CREATE UNIQUE INDEX "alcance_de_vinculo_no_finalizado" ON "alcance_de_vinculo" ("vinculo_id", "alcance") WHERE "estado" <> 'FINALIZADO';

-- Quién pausó existe mientras está PAUSADO, no mientras está ACEPTADO, y se conserva al finalizar («preserva pausa previa»).
ALTER TABLE "alcance_de_vinculo" ADD CONSTRAINT "alcance_de_vinculo_pausa_coherente" CHECK (
  ("estado" = 'PAUSADO' AND "pausado_por" IS NOT NULL) OR ("estado" = 'ACEPTADO' AND "pausado_por" IS NULL) OR "estado" = 'FINALIZADO'
);

-- REG-06-50: la revocación emite una versión sin texto; toda otra decisión referencia el texto aceptado y su hash.
ALTER TABLE "version_de_consentimiento" ADD CONSTRAINT "version_de_consentimiento_texto_segun_decision" CHECK (
  ("decision" = 'REVOCACION' AND "situacion_resultante" = 'REVOCADO' AND "version_de_texto_id" IS NULL AND "hash_del_texto" IS NULL)
  OR ("decision" <> 'REVOCACION' AND "situacion_resultante" = 'VIGENTE' AND "version_de_texto_id" IS NOT NULL AND "hash_del_texto" IS NOT NULL)
);
-- REG-06-12: cadena lineal — una raíz por consentimiento (y, por el índice único de predecesora_id, una sucesora por versión).
CREATE UNIQUE INDEX "version_de_consentimiento_una_raiz" ON "version_de_consentimiento" ("consentimiento_id") WHERE "predecesora_id" IS NULL;

-- Actos A1/A2/A3: como máximo uno VIGENTE por tipo y por identidad. Protege el otorgamiento de A3 (API-CON-06) ante
-- requests concurrentes: el reotorgamiento es un acto nuevo solo después de revocar el anterior (09:2508, 09:2607).
CREATE UNIQUE INDEX "acto_registrable_uno_vigente_por_tipo" ON "acto_registrable" ("identidad_id", "tipo") WHERE "estado" = 'VIGENTE';

-- Versiones de texto: una raíz por tipo; la cadena es lineal por el índice único de reemplaza_a_id (REG-06-12).
CREATE UNIQUE INDEX "version_de_texto_una_raiz_por_tipo" ON "version_de_texto" ("tipo") WHERE "reemplaza_a_id" IS NULL;

-- Evento de vínculo: exactamente un actor; el servicio solo puede ser el sistema.
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_un_actor" CHECK (("actor_id" IS NOT NULL) <> ("actor_servicio" IS NOT NULL));
ALTER TABLE "evento_de_vinculo" ADD CONSTRAINT "evento_de_vinculo_servicio" CHECK ("actor_servicio" IS NULL OR "actor_servicio" = 'SISTEMA');

-- Decisión de acceso: PERMITIDA ⇔ ninguna dimensión desfavorable, y registra componente y versión de consentimiento
-- (REG-06-50; 08:307). DENEGADA ⇔ al menos una dimensión desfavorable (RF-015: atribuible).
ALTER TABLE "decision_de_acceso" ALTER COLUMN "dimensiones_desfavorables" SET NOT NULL;
ALTER TABLE "decision_de_acceso" ADD CONSTRAINT "decision_de_acceso_coherente" CHECK (
  ("resultado" = 'PERMITIDA' AND cardinality("dimensiones_desfavorables") = 0
    AND "alcance_de_vinculo_id" IS NOT NULL AND "consentimiento_id" IS NOT NULL AND "version_de_consentimiento_id" IS NOT NULL)
  OR ("resultado" = 'DENEGADA' AND cardinality("dimensiones_desfavorables") > 0)
);

-- ─── Historia por adición: tablas append-only y sin TRUNCATE ────────────────────────────────────
CREATE TRIGGER "perfil_profesional_solo_agregar" BEFORE UPDATE OR DELETE ON "perfil_profesional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "vinculo_solo_agregar" BEFORE UPDATE OR DELETE ON "vinculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_consentimiento_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_consentimiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_verificacion_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_verificacion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_vinculo_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "decision_de_acceso_solo_agregar" BEFORE UPDATE OR DELETE ON "decision_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "perfil_profesional_sin_truncate" BEFORE TRUNCATE ON "perfil_profesional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "verificacion_profesional_sin_truncate" BEFORE TRUNCATE ON "verificacion_profesional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "habilitacion_sin_truncate" BEFORE TRUNCATE ON "habilitacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_verificacion_sin_truncate" BEFORE TRUNCATE ON "evento_de_verificacion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "solicitud_de_vinculo_sin_truncate" BEFORE TRUNCATE ON "solicitud_de_vinculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "vinculo_sin_truncate" BEFORE TRUNCATE ON "vinculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "alcance_de_vinculo_sin_truncate" BEFORE TRUNCATE ON "alcance_de_vinculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "consentimiento_sin_truncate" BEFORE TRUNCATE ON "consentimiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_consentimiento_sin_truncate" BEFORE TRUNCATE ON "version_de_consentimiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_vinculo_sin_truncate" BEFORE TRUNCATE ON "evento_de_vinculo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "decision_de_acceso_sin_truncate" BEFORE TRUNCATE ON "decision_de_acceso" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Versión de texto: la sucesora es del mismo tipo (REG-06-12: «misma entidad y ámbito») ────────
CREATE FUNCTION "be_version_de_texto_sucesion"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."reemplaza_a_id" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "version_de_texto" WHERE "id" = NEW."reemplaza_a_id" AND "tipo" = NEW."tipo") THEN
    RAISE EXCEPTION 'BE: una versión solo reemplaza a otra del mismo tipo (REG-06-12)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_texto_sucesion" BEFORE INSERT ON "version_de_texto" FOR EACH ROW EXECUTE FUNCTION "be_version_de_texto_sucesion"();

-- ─── T-06-11: lista blanca de la verificación profesional por Alcance (06 §6.8.2) ──────────────────
CREATE FUNCTION "be_verificacion_profesional_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- PresentarAlcance: inicio → PENDIENTE.
    IF NEW."estado" <> 'PENDIENTE' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: una trayectoria de verificación nace PENDIENTE (06 §6.8.2 PresentarAlcance)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una verificación profesional no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."alcance", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."alcance", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: la trayectoria de verificación conserva identidad, alcance y alta' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión de la verificación avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (
       (OLD."estado" = 'PENDIENTE'  AND NEW."estado" = 'PENDIENTE')   -- RegistrarObservacion · PresentarSubsanacion
    OR (OLD."estado" = 'PENDIENTE'  AND NEW."estado" = 'VERIFICADO')  -- VerificarAlcance
    OR (OLD."estado" = 'PENDIENTE'  AND NEW."estado" = 'RECHAZADO')   -- RechazarAlcance
    OR (OLD."estado" = 'RECHAZADO'  AND NEW."estado" = 'PENDIENTE')   -- VolverAPresentar
    OR (OLD."estado" = 'VERIFICADO' AND NEW."estado" = 'SUSPENDIDO')  -- SuspenderAlcance
    OR (OLD."estado" = 'SUSPENDIDO' AND NEW."estado" = 'VERIFICADO')  -- RehabilitarAlcance
  ) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en verificación % -> % (06 §6.8.2)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "verificacion_profesional_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "verificacion_profesional" FOR EACH ROW EXECUTE FUNCTION "be_verificacion_profesional_guardar"();

-- ─── T-06-13: habilitación mínima — concesión explícita y retiro (REG-06-79; DL-036) ─────────────
CREATE FUNCTION "be_habilitacion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'CONCEDIDA' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: la habilitación nace por concesión explícita (REG-06-79)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una habilitación no se elimina (historia)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."alcance", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."alcance", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: la habilitación conserva identidad, alcance y alta' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión de la habilitación avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT ((OLD."estado" = 'CONCEDIDA' AND NEW."estado" = 'RETIRADA') OR (OLD."estado" = 'RETIRADA' AND NEW."estado" = 'CONCEDIDA')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en habilitación % -> %', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "habilitacion_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "habilitacion" FOR EACH ROW EXECUTE FUNCTION "be_habilitacion_guardar"();

-- ─── T-06-16: lista blanca de la Solicitud de vínculo (06 §7.3.2) ──────────────────────────────────
CREATE FUNCTION "be_solicitud_de_vinculo_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- CrearSolicitud: inicio → PENDIENTE. «no concede acceso ni capacidad».
    IF NEW."estado" <> 'PENDIENTE' OR NEW."version" <> 1 OR NEW."momento_de_resolucion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una solicitud nace PENDIENTE (06 §7.3.2 CrearSolicitud)' USING ERRCODE = 'check_violation';
    END IF;
    -- Elegibilidad estructural mínima: el profesional tiene perfil profesional (rol).
    IF NOT EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = NEW."profesional_id") THEN
      RAISE EXCEPTION 'BE: la contraparte profesional no tiene perfil profesional' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una solicitud no se elimina: las terminales preservan historia (INV-06-54)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."profesional_id", NEW."asesorado_id", NEW."alcance", NEW."finalidad", NEW."iniciador", NEW."antecedente_id",
      NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro", NEW."vence_en")
     IS DISTINCT FROM (OLD."id", OLD."profesional_id", OLD."asesorado_id", OLD."alcance", OLD."finalidad", OLD."iniciador", OLD."antecedente_id",
      OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro", OLD."vence_en") THEN
    RAISE EXCEPTION 'BE: el contenido de una solicitud es inmutable (reiterar crea una nueva, REG-06-45)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión de la solicitud avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (OLD."estado" = 'PENDIENTE' AND NEW."estado" IN ('ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en solicitud % -> % (06 §7.3.2)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "solicitud_de_vinculo_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "solicitud_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_solicitud_de_vinculo_guardar"();

-- ─── T-06-15: lista blanca del Vínculo por Alcance (06 §7.5.2) ─────────────────────────────────────
CREATE FUNCTION "be_alcance_de_vinculo_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_solicitud "solicitud_de_vinculo"%ROWTYPE;
  v_vinculo "vinculo"%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- AceptarAlcanceDeVinculo: inicio → ACEPTADO [Solicitud ACEPTADA]. «NO concede Consentimiento».
    IF NEW."estado" <> 'ACEPTADO' OR NEW."version" <> 1 OR NEW."pausado_por" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un alcance de vínculo nace ACEPTADO (06 §7.5.2 AceptarAlcanceDeVinculo)' USING ERRCODE = 'check_violation';
    END IF;
    SELECT * INTO v_solicitud FROM "solicitud_de_vinculo" WHERE "id" = NEW."solicitud_de_origen_id";
    SELECT * INTO v_vinculo FROM "vinculo" WHERE "id" = NEW."vinculo_id";
    IF v_solicitud."estado" IS DISTINCT FROM 'ACEPTADA'
       OR v_solicitud."profesional_id" IS DISTINCT FROM v_vinculo."profesional_id"
       OR v_solicitud."asesorado_id" IS DISTINCT FROM v_vinculo."asesorado_id"
       OR v_solicitud."alcance" IS DISTINCT FROM NEW."alcance"
       OR v_solicitud."finalidad" IS DISTINCT FROM NEW."finalidad" THEN
      RAISE EXCEPTION 'BE: el alcance de vínculo exige su Solicitud ACEPTADA, con las mismas partes, alcance y finalidad' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un vínculo no se elimina: finalizar preserva historia (INV-06-64)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."vinculo_id", NEW."alcance", NEW."finalidad", NEW."solicitud_de_origen_id", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."vinculo_id", OLD."alcance", OLD."finalidad", OLD."solicitud_de_origen_id", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el alcance de vínculo conserva partes, alcance, finalidad y origen' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión del alcance de vínculo avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (
       (OLD."estado" = 'ACEPTADO' AND NEW."estado" = 'PAUSADO')      -- PausarAlcance
    OR (OLD."estado" = 'PAUSADO'  AND NEW."estado" = 'ACEPTADO')     -- ReanudarAlcance
    OR (OLD."estado" = 'ACEPTADO' AND NEW."estado" = 'FINALIZADO')   -- FinalizarAlcance · preserva historia
    OR (OLD."estado" = 'PAUSADO'  AND NEW."estado" = 'FINALIZADO')   -- FinalizarAlcance · preserva pausa previa
  ) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en alcance de vínculo % -> % (06 §7.5.2)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  -- [decisión + motivo] (06:3108; DL-033): motivo de lista cerrada al pausar y al finalizar.
  -- IS NULL explícito: en SQL, NULL NOT IN (...) no es verdadero y dejaría pasar una pausa sin motivo.
  IF NEW."estado" = 'PAUSADO' AND (NEW."motivo_de_ultima_transicion" IS NULL OR NEW."motivo_de_ultima_transicion" NOT IN ('DECISION_PERSONAL', 'DISPONIBILIDAD', 'OTRO')) THEN
    RAISE EXCEPTION 'BE: pausar exige un motivo de pausa (06:3108; DL-033)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."estado" = 'FINALIZADO' AND (NEW."motivo_de_ultima_transicion" IS NULL OR NEW."motivo_de_ultima_transicion" = 'DISPONIBILIDAD') THEN
    RAISE EXCEPTION 'BE: finalizar exige un motivo de finalización (04:345; DL-033)' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."estado" = 'PAUSADO' AND NEW."estado" = 'FINALIZADO' AND NEW."pausado_por" IS DISTINCT FROM OLD."pausado_por" THEN
    RAISE EXCEPTION 'BE: finalizar desde PAUSADO preserva la pausa previa (06:3111)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "alcance_de_vinculo_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "alcance_de_vinculo" FOR EACH ROW EXECUTE FUNCTION "be_alcance_de_vinculo_guardar"();

-- ─── T-06-17: lista blanca del Consentimiento (06 §7.7.5) ──────────────────────────────────────────
CREATE FUNCTION "be_consentimiento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_alcance "alcance_de_vinculo"%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un consentimiento no se elimina: la evidencia se conserva (INV-06-64)' USING ERRCODE = 'restrict_violation';
  END IF;
  SELECT * INTO v_alcance FROM "alcance_de_vinculo" WHERE "id" = NEW."alcance_de_vinculo_id";
  IF TG_OP = 'INSERT' THEN
    -- OtorgarConsentimiento: inicio → VIGENTE, sobre un Vínculo por Alcance ACEPTADO y con su misma finalidad.
    IF NEW."situacion" <> 'VIGENTE' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: un consentimiento nace VIGENTE (06 §7.7.5 OtorgarConsentimiento)' USING ERRCODE = 'check_violation';
    END IF;
    IF v_alcance."estado" IS DISTINCT FROM 'ACEPTADO' OR v_alcance."finalidad" IS DISTINCT FROM NEW."finalidad" THEN
      RAISE EXCEPTION 'BE: el consentimiento exige el vínculo por alcance ACEPTADO y su misma finalidad (06:3127; REG-06-61)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW."id", NEW."alcance_de_vinculo_id", NEW."finalidad", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."alcance_de_vinculo_id", OLD."finalidad", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el consentimiento conserva su identidad longitudinal (06:3127)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: cada decisión sobre el consentimiento avanza su versión de a uno (REG-06-50)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT (
       (OLD."situacion" = 'VIGENTE'  AND NEW."situacion" = 'VIGENTE')   -- AceptarNuevaVersion
    OR (OLD."situacion" = 'VIGENTE'  AND NEW."situacion" = 'REVOCADO')  -- RevocarConsentimiento
    OR (OLD."situacion" = 'REVOCADO' AND NEW."situacion" = 'VIGENTE')   -- OtorgarNuevamente
  ) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en consentimiento % -> % (06 §7.7.5)', OLD."situacion", NEW."situacion" USING ERRCODE = 'check_violation';
  END IF;
  -- Aceptar una versión nueva u otorgar nuevamente exige el vínculo por alcance ACEPTADO; revocar no.
  IF NEW."situacion" = 'VIGENTE' AND v_alcance."estado" IS DISTINCT FROM 'ACEPTADO' THEN
    RAISE EXCEPTION 'BE: otorgar exige el vínculo por alcance ACEPTADO' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "consentimiento_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "consentimiento" FOR EACH ROW EXECUTE FUNCTION "be_consentimiento_guardar"();

-- ─── REG-06-50: cada Versión de consentimiento es una decisión del titular, encadenada y con su evidencia ─
CREATE FUNCTION "be_version_de_consentimiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_consentimiento "consentimiento"%ROWTYPE;
  v_alcance "alcance_de_vinculo"%ROWTYPE;
  v_vinculo "vinculo"%ROWTYPE;
  v_predecesora "version_de_consentimiento"%ROWTYPE;
  v_texto "version_de_texto"%ROWTYPE;
BEGIN
  SELECT * INTO v_consentimiento FROM "consentimiento" WHERE "id" = NEW."consentimiento_id";
  SELECT * INTO v_alcance FROM "alcance_de_vinculo" WHERE "id" = v_consentimiento."alcance_de_vinculo_id";
  SELECT * INTO v_vinculo FROM "vinculo" WHERE "id" = v_alcance."vinculo_id";
  -- INV-06-62: solo el asesorado titular otorga o revoca, y es el autor de su decisión.
  IF NEW."actor_id" IS DISTINCT FROM v_vinculo."asesorado_id" OR NEW."autoria_id" IS DISTINCT FROM v_vinculo."asesorado_id" THEN
    RAISE EXCEPTION 'BE: solo el asesorado titular decide sobre su consentimiento (INV-06-62)' USING ERRCODE = 'check_violation';
  END IF;
  -- La evidencia repite el alcance y la finalidad del componente (08 §12.2).
  IF NEW."alcance" IS DISTINCT FROM v_alcance."alcance" OR NEW."finalidad" IS DISTINCT FROM v_consentimiento."finalidad" THEN
    RAISE EXCEPTION 'BE: la versión registra el alcance y la finalidad del consentimiento' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."version_de_texto_id" IS NOT NULL THEN
    SELECT * INTO v_texto FROM "version_de_texto" WHERE "id" = NEW."version_de_texto_id";
    IF v_texto."tipo" NOT IN ('CONSENTIMIENTO_PROFESIONAL_SANITARIO', 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO') OR v_texto."hash" <> NEW."hash_del_texto" THEN
      RAISE EXCEPTION 'BE: la versión aceptada es un texto de B2 y copia su hash (08 §12.2)' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  -- Cadena lineal (REG-06-12) y decisión coherente con la situación previa (06 §7.7.5).
  IF NEW."predecesora_id" IS NULL THEN
    IF NEW."decision" <> 'OTORGAMIENTO' THEN
      RAISE EXCEPTION 'BE: la primera versión es un otorgamiento (06 §7.7.5 OtorgarConsentimiento)' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    SELECT * INTO v_predecesora FROM "version_de_consentimiento" WHERE "id" = NEW."predecesora_id";
    IF v_predecesora."consentimiento_id" IS DISTINCT FROM NEW."consentimiento_id" THEN
      RAISE EXCEPTION 'BE: la predecesora pertenece al mismo consentimiento' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT (
         (NEW."decision" = 'NUEVA_VERSION'  AND v_predecesora."situacion_resultante" = 'VIGENTE')
      OR (NEW."decision" = 'REVOCACION'     AND v_predecesora."situacion_resultante" = 'VIGENTE')
      OR (NEW."decision" = 'REOTORGAMIENTO' AND v_predecesora."situacion_resultante" = 'REVOCADO')
    ) THEN
      RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en la cadena de consentimiento (% tras %)', NEW."decision", v_predecesora."situacion_resultante"
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_consentimiento_insertar" BEFORE INSERT ON "version_de_consentimiento" FOR EACH ROW EXECUTE FUNCTION "be_version_de_consentimiento_insertar"();

-- Al confirmar la transacción: la situación del consentimiento es la de la cabeza de su cadena, y hay exactamente una
-- versión por decisión (REG-06-50: cada decisión expresa emite una Versión; INV-06-60: VIGENTE referencia versión).
CREATE FUNCTION "be_consentimiento_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_cantidad integer;
  v_cabeza "SituacionDeConsentimiento";
BEGIN
  SELECT count(*) INTO v_cantidad FROM "version_de_consentimiento" WHERE "consentimiento_id" = NEW."id";
  SELECT v."situacion_resultante" INTO v_cabeza FROM "version_de_consentimiento" v
   WHERE v."consentimiento_id" = NEW."id"
     AND NOT EXISTS (SELECT 1 FROM "version_de_consentimiento" s WHERE s."predecesora_id" = v."id");
  IF v_cantidad <> NEW."version" OR v_cabeza IS DISTINCT FROM NEW."situacion" THEN
    RAISE EXCEPTION 'BE: el consentimiento % no coincide con su cadena de versiones (REG-06-50, INV-06-60)', NEW."id" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "consentimiento_coherente" AFTER INSERT OR UPDATE ON "consentimiento"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_consentimiento_coherente"();

-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('b2-sanitario-2026-09-demo', 'CONSENTIMIENTO_PROFESIONAL_SANITARIO', $be_texto$Autorizar acceso a un profesional de la salud$be_texto$, 'AUTORIZACION_DE_ACCESO_PROFESIONAL', $be_texto$Autorización de acceso a un profesional de la salud — versión de demostración 2026-09

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Autorizás a este profesional a acceder, dentro de BE, a la información pertinente y necesaria para la finalidad y el alcance que se indican en esta pantalla. No autorizás el acceso a toda tu información.

El profesional es un profesional de la salud: trata tu información en el marco de la relación profesional sanitaria, con deber de secreto profesional.

Este consentimiento vale solo para este profesional, este alcance y esta finalidad. No autoriza a otros profesionales ni otros alcances.

Podés revocarlo cuando quieras. La revocación corta el acceso hacia adelante, no finaliza el vínculo y no borra en silencio tu historia.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '913b8a9be1a387617e6fedbc9b1d24e1237c0bf2f785e209cc9d56c027ca8f17', '2026-09-19T00:00:00.000Z');
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('b2-no-sanitario-2026-09-demo', 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO', $be_texto$Autorizar acceso a un profesional que no es de la salud$be_texto$, 'AUTORIZACION_DE_ACCESO_PROFESIONAL', $be_texto$Autorización de acceso a un profesional que no es de la salud — versión de demostración 2026-09

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Autorizás a este profesional a acceder, dentro de BE, solo a la información pertinente y necesaria para la finalidad y el alcance que se indican en esta pantalla, con el mínimo detalle suficiente. No autorizás el acceso a tu expediente completo.

Este profesional no es un profesional de la salud. BE le impone un deber de confidencialidad sobre la información a la que accede.

Este consentimiento vale solo para este profesional, este alcance y esta finalidad. No autoriza a otros profesionales ni otros alcances.

Podés revocarlo cuando quieras. La revocación corta el acceso hacia adelante, no finaliza el vínculo y no borra en silencio tu historia.

Aceptar esta versión no acepta versiones futuras.$be_texto$, 'b85090bdc5cd7b730a91093d14cba57c83f13d644b55dff97157535b67db4023', '2026-09-19T00:00:00.000Z');
