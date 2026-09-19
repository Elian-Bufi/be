-- WP-04 · Circuito nutricional (docs/paquetes/WP-04.md): Proceso (06 §8), capacidad (06 §9), catálogo, evaluación,
-- objetivo, plan versionado con instantánea, ingesta, corrección trazable y revisión (06 §10, §12).
-- 1. Tablas, enums y claves foráneas generados desde prisma/schema.prisma.
-- 2. Garantías en la base: unicidades parciales, CHECKs, listas blancas por trigger y hechos en la misma transacción.
-- 3. Catálogo sintético sembrado (WP-04 T14): 40 alimentos con valores de demostración.

-- CreateEnum
CREATE TYPE "ModoDeCapacidad" AS ENUM ('LIMITADA', 'SIN_LIMITE');

-- CreateEnum
CREATE TYPE "EstadoDeProceso" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "MotivoDeCierreDeProceso" AS ENUM ('REVISION_FINALIZAR', 'FINALIZACION_DE_VINCULO', 'CIERRE_DE_CUENTA');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeProceso" AS ENUM ('ProcesoOperativoAbierto', 'ContinuidadOCierreAplicado', 'ProcesoOperativoCerrado');

-- CreateEnum
CREATE TYPE "TipoDeAplicacion" AS ENUM ('CONTINUIDAD', 'CIERRE_PROCESO');

-- CreateEnum
CREATE TYPE "FuenteDeProximaRevision" AS ENUM ('VERSION_DE_PLAN', 'REVISION');

-- CreateEnum
CREATE TYPE "ProcedenciaDeCatalogo" AS ENUM ('BE_SYNTHETIC_SEED', 'PROFESSIONAL_MANUAL');

-- CreateEnum
CREATE TYPE "EstadoDeVersionDePlan" AS ENUM ('BORRADOR', 'ACTIVADA');

-- CreateEnum
CREATE TYPE "OrigenDeIngesta" AS ENUM ('PRESCRIPTA', 'FUERA_DE_PRESCRIPCION');

-- CreateEnum
CREATE TYPE "ModoDeRegistroDeIngesta" AS ENUM ('OPCIONES_DE_PLATO', 'DESCRIPCION_LIBRE');

-- CreateEnum
CREATE TYPE "ResultadoDeRevision" AS ENUM ('MANTENER', 'AJUSTAR', 'SUSTITUIR', 'REPROGRAMAR_REVISION', 'CAMBIAR_OBJETIVO', 'FINALIZAR');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeNutricion" AS ENUM ('ElementoDeCatalogoCreado', 'EvaluacionNutricionalRegistrada', 'VersionDeObjetivoEmitida', 'BorradorDePlanCreado', 'BorradorDePlanGuardado', 'VersionDePlanActivada', 'IngestaRegistrada', 'CorreccionDeIngestaRegistrada', 'RevisionRegistrada');

-- CreateTable
CREATE TABLE "capacidad_profesional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identidad_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "modo" "ModoDeCapacidad" NOT NULL,
    "limite" INTEGER,
    "actor_servicio" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacidad_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proceso_operativo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "estado" "EstadoDeProceso" NOT NULL DEFAULT 'ABIERTO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "motivo_de_cierre" "MotivoDeCierreDeProceso",
    "version_de_apertura_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_cierre" TIMESTAMPTZ(3),

    CONSTRAINT "proceso_operativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_proceso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeProceso" NOT NULL,
    "proceso_id" UUID NOT NULL,
    "tipo_de_aplicacion" "TipoDeAplicacion",
    "revision_id" UUID,
    "estado_previo" "EstadoDeProceso",
    "estado_posterior" "EstadoDeProceso" NOT NULL,
    "datos" JSONB,
    "actor_id" UUID,
    "actor_servicio" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_proceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxima_revision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proceso_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "fecha_objetivo" DATE,
    "fuente" "FuenteDeProximaRevision" NOT NULL,
    "version_de_plan_id" UUID,
    "revision_id" UUID,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxima_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elemento_de_catalogo_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "procedencia" "ProcedenciaDeCatalogo" NOT NULL,
    "creado_por_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elemento_de_catalogo_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_elemento_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "nombre" TEXT NOT NULL,
    "composicion" JSONB NOT NULL,
    "disponible" BOOLEAN NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_elemento_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "contexto" TEXT,
    "valoracion" JSONB NOT NULL,
    "referencias" JSONB NOT NULL,
    "notas" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivo_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivo_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_objetivo_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "objetivo_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "evaluacion_id" UUID NOT NULL,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL,
    "vigente_hasta" TIMESTAMPTZ(3),
    "requerimiento_energetico" JSONB NOT NULL,
    "distribucion_de_macronutrientes" JSONB NOT NULL,
    "distribucion_por_comida" TEXT,
    "fundamento" TEXT NOT NULL,
    "declaracion_de_metodo" TEXT,
    "revision_de_origen_id" UUID,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_objetivo_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "version_efectiva_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "estado" "EstadoDeVersionDePlan" NOT NULL DEFAULT 'BORRADOR',
    "version" INTEGER NOT NULL DEFAULT 1,
    "version_de_objetivo_id" UUID NOT NULL,
    "contenido" JSONB NOT NULL,
    "proxima_revision" DATE,
    "revision_de_origen_id" UUID,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_activacion" TIMESTAMPTZ(3),

    CONSTRAINT "version_de_plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instantanea_de_plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_de_plan_id" UUID NOT NULL,
    "contenido" JSONB NOT NULL,
    "huella" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instantanea_de_plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingesta_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_de_plan_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "origen" "OrigenDeIngesta" NOT NULL,
    "modo" "ModoDeRegistroDeIngesta" NOT NULL,
    "fecha_local" DATE NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "dia_tipo_id" TEXT,
    "comida_id" TEXT,
    "opcion_id" TEXT,
    "items_consumidos" JSONB NOT NULL DEFAULT '[]',
    "observacion" TEXT,
    "descripcion" TEXT,
    "descripcion_de_porcion" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingesta_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correccion_de_ingesta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingesta_id" UUID NOT NULL,
    "correccion_previa_id" UUID,
    "estimacion" JSONB NOT NULL,
    "declaracion" TEXT NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correccion_de_ingesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proceso_id" UUID NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "evidencias" JSONB NOT NULL,
    "interpretacion" TEXT NOT NULL,
    "resultado" "ResultadoDeRevision" NOT NULL,
    "fundamento" TEXT NOT NULL,
    "proxima_accion" JSONB NOT NULL,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacion_de_revision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "tipo" "TipoDeAplicacion" NOT NULL,
    "estado_de_proceso_posterior" "EstadoDeProceso" NOT NULL,
    "version_de_plan_creada_id" UUID,
    "version_de_objetivo_creada_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacion_de_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_nutricion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeNutricion" NOT NULL,
    "profesional_id" UUID,
    "asesorado_id" UUID,
    "recurso_tipo" TEXT NOT NULL,
    "recurso_id" UUID NOT NULL,
    "estado_previo" TEXT,
    "estado_posterior" TEXT,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_nutricion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "capacidad_profesional_predecesora_id_key" ON "capacidad_profesional"("predecesora_id");

-- CreateIndex
CREATE INDEX "capacidad_profesional_identidad_id_idx" ON "capacidad_profesional"("identidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "proceso_operativo_version_de_apertura_id_key" ON "proceso_operativo"("version_de_apertura_id");

-- CreateIndex
CREATE INDEX "proceso_operativo_profesional_id_asesorado_id_alcance_idx" ON "proceso_operativo"("profesional_id", "asesorado_id", "alcance");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_proceso_secuencia_key" ON "evento_de_proceso"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_proceso_proceso_id_idx" ON "evento_de_proceso"("proceso_id");

-- CreateIndex
CREATE UNIQUE INDEX "proxima_revision_predecesora_id_key" ON "proxima_revision"("predecesora_id");

-- CreateIndex
CREATE INDEX "proxima_revision_proceso_id_idx" ON "proxima_revision"("proceso_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_elemento_nutricional_predecesora_id_key" ON "version_de_elemento_nutricional"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_elemento_nutricional_elemento_id_idx" ON "version_de_elemento_nutricional"("elemento_id");

-- CreateIndex
CREATE INDEX "evaluacion_nutricional_asesorado_id_profesional_id_momento__idx" ON "evaluacion_nutricional"("asesorado_id", "profesional_id", "momento_de_registro");

-- CreateIndex
CREATE UNIQUE INDEX "objetivo_nutricional_profesional_id_asesorado_id_key" ON "objetivo_nutricional"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_objetivo_nutricional_predecesora_id_key" ON "version_de_objetivo_nutricional"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_objetivo_nutricional_objetivo_id_idx" ON "version_de_objetivo_nutricional"("objetivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_nutricional_version_efectiva_id_key" ON "plan_nutricional"("version_efectiva_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_nutricional_profesional_id_asesorado_id_key" ON "plan_nutricional"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_plan_nutricional_predecesora_id_key" ON "version_de_plan_nutricional"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_plan_nutricional_plan_id_idx" ON "version_de_plan_nutricional"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "instantanea_de_plan_nutricional_version_de_plan_id_key" ON "instantanea_de_plan_nutricional"("version_de_plan_id");

-- CreateIndex
CREATE INDEX "ingesta_nutricional_asesorado_id_fecha_local_idx" ON "ingesta_nutricional"("asesorado_id", "fecha_local");

-- CreateIndex
CREATE INDEX "ingesta_nutricional_version_de_plan_id_idx" ON "ingesta_nutricional"("version_de_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "correccion_de_ingesta_correccion_previa_id_key" ON "correccion_de_ingesta"("correccion_previa_id");

-- CreateIndex
CREATE INDEX "correccion_de_ingesta_ingesta_id_idx" ON "correccion_de_ingesta"("ingesta_id");

-- CreateIndex
CREATE INDEX "revision_nutricional_proceso_id_idx" ON "revision_nutricional"("proceso_id");

-- CreateIndex
CREATE UNIQUE INDEX "aplicacion_de_revision_revision_id_key" ON "aplicacion_de_revision"("revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "aplicacion_de_revision_evento_id_key" ON "aplicacion_de_revision"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_nutricion_secuencia_key" ON "evento_de_nutricion"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_nutricion_asesorado_id_momento_de_registro_idx" ON "evento_de_nutricion"("asesorado_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "evento_de_nutricion_recurso_id_idx" ON "evento_de_nutricion"("recurso_id");

-- AddForeignKey
ALTER TABLE "capacidad_profesional" ADD CONSTRAINT "capacidad_profesional_identidad_id_fkey" FOREIGN KEY ("identidad_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "capacidad_profesional" ADD CONSTRAINT "capacidad_profesional_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "capacidad_profesional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_version_de_apertura_id_fkey" FOREIGN KEY ("version_de_apertura_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_operativo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "revision_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_operativo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "proxima_revision"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "revision_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_elemento_nutricional" ADD CONSTRAINT "version_de_elemento_nutricional_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_elemento_nutricional" ADD CONSTRAINT "version_de_elemento_nutricional_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_elemento_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_nutricional" ADD CONSTRAINT "evaluacion_nutricional_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_nutricional" ADD CONSTRAINT "evaluacion_nutricional_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "objetivo_nutricional" ADD CONSTRAINT "objetivo_nutricional_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "objetivo_nutricional" ADD CONSTRAINT "objetivo_nutricional_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_nutricional_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_nutricional_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_objetivo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_nutricional_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_nutricional_revision_de_origen_id_fkey" FOREIGN KEY ("revision_de_origen_id") REFERENCES "revision_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_nutricional" ADD CONSTRAINT "plan_nutricional_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_nutricional" ADD CONSTRAINT "plan_nutricional_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_nutricional" ADD CONSTRAINT "plan_nutricional_version_efectiva_id_fkey" FOREIGN KEY ("version_efectiva_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_nutricional_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_nutricional_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_nutricional_version_de_objetivo_id_fkey" FOREIGN KEY ("version_de_objetivo_id") REFERENCES "version_de_objetivo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_nutricional_revision_de_origen_id_fkey" FOREIGN KEY ("revision_de_origen_id") REFERENCES "revision_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "instantanea_de_plan_nutricional" ADD CONSTRAINT "instantanea_de_plan_nutricional_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_ingesta" ADD CONSTRAINT "correccion_de_ingesta_ingesta_id_fkey" FOREIGN KEY ("ingesta_id") REFERENCES "ingesta_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_ingesta" ADD CONSTRAINT "correccion_de_ingesta_correccion_previa_id_fkey" FOREIGN KEY ("correccion_previa_id") REFERENCES "correccion_de_ingesta"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_nutricional" ADD CONSTRAINT "revision_nutricional_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_operativo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aplicacion_de_revision" ADD CONSTRAINT "aplicacion_de_revision_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "revision_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aplicacion_de_revision" ADD CONSTRAINT "aplicacion_de_revision_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento_de_proceso"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════
-- WP-04 · Garantías en la base (docs/paquetes/WP-04.md T4-T9). Repiten las reglas de @be/domain: si el servicio
-- tuviera un error, la base igual rechaza la escritura.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Unicidades parciales ─────────────────────────────────────────────────────────────────────────
-- INV-06-74 / REG-06-78: como máximo un Proceso ABIERTO por (profesional, asesorado, alcance).
CREATE UNIQUE INDEX "proceso_operativo_uno_abierto" ON "proceso_operativo" ("profesional_id", "asesorado_id", "alcance") WHERE "estado" = 'ABIERTO';
-- REG-06-12: cadenas lineales. Una raíz por objeto (y, por el índice único de predecesora_id, una sucesora por versión).
CREATE UNIQUE INDEX "capacidad_profesional_una_raiz" ON "capacidad_profesional" ("identidad_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "proxima_revision_una_raiz" ON "proxima_revision" ("proceso_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "version_de_elemento_nutricional_una_raiz" ON "version_de_elemento_nutricional" ("elemento_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "version_de_objetivo_nutricional_una_raiz" ON "version_de_objetivo_nutricional" ("objetivo_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "version_de_plan_nutricional_una_raiz" ON "version_de_plan_nutricional" ("plan_id") WHERE "predecesora_id" IS NULL;
-- REG-06-12 (bifurcación sin regla de ramas): un solo BORRADOR por plan.
CREATE UNIQUE INDEX "version_de_plan_nutricional_un_borrador" ON "version_de_plan_nutricional" ("plan_id") WHERE "estado" = 'BORRADOR';
-- REG-06-107 / DL-049: una ingesta prescripta por (versión, fecha local, comida). Las libres no tienen clave natural.
CREATE UNIQUE INDEX "ingesta_nutricional_prescripta_unica" ON "ingesta_nutricional" ("version_de_plan_id", "fecha_local", "comida_id") WHERE "origen" = 'PRESCRIPTA';
-- REG-06-15: una sola primera corrección por ingesta.
CREATE UNIQUE INDEX "correccion_de_ingesta_una_raiz" ON "correccion_de_ingesta" ("ingesta_id") WHERE "correccion_previa_id" IS NULL;

-- ─── CHECKs ───────────────────────────────────────────────────────────────────────────────────────
-- REG-06-81: LIMITADA lleva un límite entero no negativo; SIN_LIMITE no lleva límite.
ALTER TABLE "capacidad_profesional" ADD CONSTRAINT "capacidad_profesional_limite_coherente" CHECK (
  ("modo" = 'LIMITADA' AND "limite" IS NOT NULL AND "limite" >= 0) OR ("modo" = 'SIN_LIMITE' AND "limite" IS NULL)
);
-- El cierre existe exactamente cuando el Proceso está CERRADO.
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_cierre_coherente" CHECK (
  ("estado" = 'ABIERTO' AND "motivo_de_cierre" IS NULL AND "momento_de_cierre" IS NULL)
  OR ("estado" = 'CERRADO' AND "motivo_de_cierre" IS NOT NULL AND "momento_de_cierre" IS NOT NULL)
);
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_solo_nutricion" CHECK ("alcance" = 'NUTRICION');
-- Evento de proceso: exactamente un actor; ContinuidadOCierreAplicado ⇔ tipo de aplicación y revisión (REG-06-75).
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_un_actor" CHECK (("actor_id" IS NOT NULL) <> ("actor_servicio" IS NOT NULL));
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_aplicacion_coherente" CHECK (
  ("tipo" = 'ContinuidadOCierreAplicado') = ("tipo_de_aplicacion" IS NOT NULL AND "revision_id" IS NOT NULL)
);
-- REG-06-145: la próxima revisión la fija una versión de plan o una revisión válida, nunca las dos.
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_fuente_coherente" CHECK (
  ("fuente" = 'VERSION_DE_PLAN' AND "version_de_plan_id" IS NOT NULL AND "revision_id" IS NULL)
  OR ("fuente" = 'REVISION' AND "revision_id" IS NOT NULL AND "version_de_plan_id" IS NULL)
);
-- REG-06-123: el fundamento del objetivo es obligatorio.
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_con_fundamento" CHECK (btrim("fundamento") <> '');
ALTER TABLE "version_de_objetivo_nutricional" ADD CONSTRAINT "version_de_objetivo_vigencia_coherente" CHECK ("vigente_hasta" IS NULL OR "vigente_hasta" > "vigente_desde");
-- La activación existe exactamente cuando la versión está ACTIVADA.
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_activacion_coherente" CHECK (("estado" = 'BORRADOR') = ("momento_de_activacion" IS NULL));
ALTER TABLE "instantanea_de_plan_nutricional" ADD CONSTRAINT "instantanea_huella_sha256" CHECK ("huella" ~ '^[0-9a-f]{64}$');
-- Ingesta: la prescripta referencia día tipo, comida y opción y no trae texto libre; la libre conserva su texto y no
-- marca ninguna comida (CONS:599-612).
ALTER TABLE "ingesta_nutricional" ADD CONSTRAINT "ingesta_nutricional_origen_coherente" CHECK (
  ("origen" = 'PRESCRIPTA' AND "modo" = 'OPCIONES_DE_PLATO' AND "dia_tipo_id" IS NOT NULL AND "comida_id" IS NOT NULL AND "opcion_id" IS NOT NULL
    AND "descripcion" IS NULL AND "descripcion_de_porcion" IS NULL)
  OR ("origen" = 'FUERA_DE_PRESCRIPCION' AND "modo" = 'DESCRIPCION_LIBRE' AND "descripcion" IS NOT NULL AND btrim("descripcion") <> ''
    AND "dia_tipo_id" IS NULL AND "comida_id" IS NULL AND "opcion_id" IS NULL AND "items_consumidos" = '[]'::jsonb AND "observacion" IS NULL)
);
-- REG-06-141: interpretación y fundamento no vacíos; período bien formado.
ALTER TABLE "revision_nutricional" ADD CONSTRAINT "revision_nutricional_componentes" CHECK (
  btrim("interpretacion") <> '' AND btrim("fundamento") <> '' AND "periodo_inicio" <= "periodo_fin"
);
-- INV-06-82, 83: solo FINALIZAR cierra el Proceso.
ALTER TABLE "aplicacion_de_revision" ADD CONSTRAINT "aplicacion_de_revision_cierre_coherente" CHECK (
  ("tipo" = 'CIERRE_PROCESO') = ("estado_de_proceso_posterior" = 'CERRADO')
);

-- ─── Historia por adición: append-only y sin TRUNCATE ─────────────────────────────────────────────
CREATE TRIGGER "capacidad_profesional_solo_agregar" BEFORE UPDATE OR DELETE ON "capacidad_profesional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_proceso_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_proceso" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "proxima_revision_solo_agregar" BEFORE UPDATE OR DELETE ON "proxima_revision" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "elemento_de_catalogo_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "elemento_de_catalogo_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_elemento_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_elemento_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evaluacion_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "evaluacion_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "objetivo_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "objetivo_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_objetivo_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_objetivo_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "instantanea_de_plan_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "instantanea_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "ingesta_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "ingesta_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_ingesta_solo_agregar" BEFORE UPDATE OR DELETE ON "correccion_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "revision_nutricional_solo_agregar" BEFORE UPDATE OR DELETE ON "revision_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "aplicacion_de_revision_solo_agregar" BEFORE UPDATE OR DELETE ON "aplicacion_de_revision" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_nutricion_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_nutricion" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "capacidad_profesional_sin_truncate" BEFORE TRUNCATE ON "capacidad_profesional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "proceso_operativo_sin_truncate" BEFORE TRUNCATE ON "proceso_operativo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_proceso_sin_truncate" BEFORE TRUNCATE ON "evento_de_proceso" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "proxima_revision_sin_truncate" BEFORE TRUNCATE ON "proxima_revision" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "elemento_de_catalogo_nutricional_sin_truncate" BEFORE TRUNCATE ON "elemento_de_catalogo_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_elemento_nutricional_sin_truncate" BEFORE TRUNCATE ON "version_de_elemento_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evaluacion_nutricional_sin_truncate" BEFORE TRUNCATE ON "evaluacion_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "objetivo_nutricional_sin_truncate" BEFORE TRUNCATE ON "objetivo_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_objetivo_nutricional_sin_truncate" BEFORE TRUNCATE ON "version_de_objetivo_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "plan_nutricional_sin_truncate" BEFORE TRUNCATE ON "plan_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plan_nutricional_sin_truncate" BEFORE TRUNCATE ON "version_de_plan_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "instantanea_de_plan_nutricional_sin_truncate" BEFORE TRUNCATE ON "instantanea_de_plan_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "ingesta_nutricional_sin_truncate" BEFORE TRUNCATE ON "ingesta_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_ingesta_sin_truncate" BEFORE TRUNCATE ON "correccion_de_ingesta" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "revision_nutricional_sin_truncate" BEFORE TRUNCATE ON "revision_nutricional" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "aplicacion_de_revision_sin_truncate" BEFORE TRUNCATE ON "aplicacion_de_revision" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_nutricion_sin_truncate" BEFORE TRUNCATE ON "evento_de_nutricion" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── REG-06-12 / REG-06-15: la predecesora es del mismo objeto ────────────────────────────────────
CREATE FUNCTION "be_sucesion_del_mismo_objeto"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_ok boolean;
BEGIN
  IF TG_TABLE_NAME = 'capacidad_profesional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "capacidad_profesional" WHERE "id" = NEW."predecesora_id" AND "identidad_id" = NEW."identidad_id");
  ELSIF TG_TABLE_NAME = 'proxima_revision' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "proxima_revision" WHERE "id" = NEW."predecesora_id" AND "proceso_id" = NEW."proceso_id");
  ELSIF TG_TABLE_NAME = 'version_de_elemento_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" WHERE "id" = NEW."predecesora_id" AND "elemento_id" = NEW."elemento_id");
  ELSIF TG_TABLE_NAME = 'version_de_objetivo_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_objetivo_nutricional" WHERE "id" = NEW."predecesora_id" AND "objetivo_id" = NEW."objetivo_id");
  ELSIF TG_TABLE_NAME = 'version_de_plan_nutricional' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_plan_nutricional" WHERE "id" = NEW."predecesora_id" AND "plan_id" = NEW."plan_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_ingesta' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_ingesta" WHERE "id" = NEW."correccion_previa_id" AND "ingesta_id" = NEW."ingesta_id");
  ELSE
    RAISE EXCEPTION 'BE: be_sucesion_del_mismo_objeto no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'BE: en % la predecesora tiene que ser del mismo objeto (REG-06-12, REG-06-15)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "capacidad_profesional_sucesion" BEFORE INSERT ON "capacidad_profesional" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "proxima_revision_sucesion" BEFORE INSERT ON "proxima_revision" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "version_de_elemento_nutricional_sucesion" BEFORE INSERT ON "version_de_elemento_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "version_de_objetivo_nutricional_sucesion" BEFORE INSERT ON "version_de_objetivo_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "version_de_plan_nutricional_sucesion" BEFORE INSERT ON "version_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "correccion_de_ingesta_sucesion" BEFORE INSERT ON "correccion_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();

-- ─── T-06-29: lista blanca de la Versión de plan (06 §10.7) ───────────────────────────────────────
CREATE FUNCTION "be_version_de_plan_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- CrearBorrador: inicio → BORRADOR.
    IF NEW."estado" <> 'BORRADOR' OR NEW."version" <> 1 OR NEW."momento_de_activacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una versión de plan nace BORRADOR (06 §10.7, CrearBorrador)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una versión de plan no se elimina: la historia es por adición (06 §4.4)' USING ERRCODE = 'restrict_violation';
  END IF;
  -- INV-06-109; 06:4307: no existe transición que edite una ACTIVADA ni que la devuelva a BORRADOR.
  IF OLD."estado" = 'ACTIVADA' THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: una versión ACTIVADA es inmutable; corregirla exige una versión sucesora (INV-06-109, 06:4307)' USING ERRCODE = 'check_violation';
  END IF;
  IF (NEW."id", NEW."plan_id", NEW."predecesora_id", NEW."autor_id", NEW."procedencia", NEW."momento_de_registro", NEW."revision_de_origen_id")
     IS DISTINCT FROM (OLD."id", OLD."plan_id", OLD."predecesora_id", OLD."autor_id", OLD."procedencia", OLD."momento_de_registro", OLD."revision_de_origen_id") THEN
    RAISE EXCEPTION 'BE: la versión de plan conserva plan, predecesora, autoría y origen' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión del borrador avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."estado" = 'BORRADOR' AND NEW."estado" = 'BORRADOR' THEN
    RETURN NEW; -- GuardarBorrador
  END IF;
  IF OLD."estado" = 'BORRADOR' AND NEW."estado" = 'ACTIVADA' THEN
    -- ActivarVersion: se activa lo que se validó, y la instantánea existe ANTES de la vigencia (REG-06-104, 06:1391).
    IF (NEW."contenido", NEW."version_de_objetivo_id", NEW."proxima_revision") IS DISTINCT FROM (OLD."contenido", OLD."version_de_objetivo_id", OLD."proxima_revision") THEN
      RAISE EXCEPTION 'BE: activar no cambia el contenido: se activa lo que se validó (REG-06-104)' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "instantanea_de_plan_nutricional" WHERE "version_de_plan_id" = NEW."id") THEN
      RAISE EXCEPTION 'BE: sin instantánea no hay activación (REG-06-104, INV-06-111)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en versión de plan % -> % (06 §10.7)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "version_de_plan_nutricional_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "version_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_version_de_plan_guardar"();

-- La instantánea se toma sobre un BORRADOR que se está activando: una versión ya activada no se re-fotografía.
CREATE FUNCTION "be_instantanea_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "version_de_plan_nutricional" WHERE "id" = NEW."version_de_plan_id" AND "estado" = 'BORRADOR') THEN
    RAISE EXCEPTION 'BE: la instantánea se toma al activar un BORRADOR (REG-06-104)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "instantanea_de_plan_nutricional_insertar" BEFORE INSERT ON "instantanea_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_instantanea_insertar"();

-- ─── T-06-28: la relación efectiva solo avanza a la sucesora activada (INV-06-110; 06:4355-4360) ───
CREATE FUNCTION "be_plan_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."version_efectiva_id" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un plan nace sin versión efectiva' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un plan no se elimina: la historia es por adición' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."profesional_id", NEW."asesorado_id", NEW."momento_de_registro") IS DISTINCT FROM (OLD."id", OLD."profesional_id", OLD."asesorado_id", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el plan conserva partes y registro' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version_efectiva_id" IS NOT DISTINCT FROM OLD."version_efectiva_id" THEN
    RETURN NEW;
  END IF;
  IF NEW."version_efectiva_id" IS NULL OR NOT EXISTS (
       SELECT 1 FROM "version_de_plan_nutricional" v
        WHERE v."id" = NEW."version_efectiva_id" AND v."plan_id" = NEW."id" AND v."estado" = 'ACTIVADA'
          AND v."predecesora_id" IS NOT DISTINCT FROM OLD."version_efectiva_id") THEN
    RAISE EXCEPTION 'BE: la versión efectiva solo pasa a la sucesora ACTIVADA de la anterior (INV-06-110)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "plan_nutricional_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_plan_guardar"();

-- ─── T-06-25: lista blanca del Proceso (06 §8, 06:3420-3432) ──────────────────────────────────────
CREATE FUNCTION "be_proceso_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- AbrirProceso: inicio → ABIERTO, con una versión de apertura ACTIVADA de las mismas partes (REG-06-65).
    IF NEW."estado" <> 'ABIERTO' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: un Proceso nace ABIERTO (AbrirProceso)' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (
         SELECT 1 FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id"
          WHERE v."id" = NEW."version_de_apertura_id" AND v."estado" = 'ACTIVADA'
            AND p."profesional_id" = NEW."profesional_id" AND p."asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: el Proceso se abre con la activación de una versión de las mismas partes (REG-06-65)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un Proceso no se elimina: CERRADO conserva evidencia (06:3409)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."profesional_id", NEW."asesorado_id", NEW."alcance", NEW."version_de_apertura_id", NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."profesional_id", OLD."asesorado_id", OLD."alcance", OLD."version_de_apertura_id", OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el Proceso conserva partes, alcance y acto de apertura' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión del Proceso avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  -- AplicarContinuidad (ABIERTO → ABIERTO) y los tres cierres (ABIERTO → CERRADO). CERRADO es terminal (INV-06-86).
  IF NOT ((OLD."estado" = 'ABIERTO' AND NEW."estado" = 'ABIERTO') OR (OLD."estado" = 'ABIERTO' AND NEW."estado" = 'CERRADO')) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en Proceso % -> % (06 §8; INV-06-86)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "proceso_operativo_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "proceso_operativo" FOR EACH ROW EXECUTE FUNCTION "be_proceso_guardar"();

-- ─── Ingesta, corrección, revisión y aplicación ────────────────────────────────────────────────────
-- REG-06-105, 106: la ingesta se registra contra una versión ACTIVADA del plan del mismo asesorado.
CREATE FUNCTION "be_ingesta_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id"
        WHERE v."id" = NEW."version_de_plan_id" AND v."estado" = 'ACTIVADA' AND p."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: la ingesta referencia una versión ACTIVADA del plan del asesorado (REG-06-105)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "ingesta_nutricional_insertar" BEFORE INSERT ON "ingesta_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_ingesta_insertar"();

-- CONS:641-672: solo se estructura una ingesta libre.
CREATE FUNCTION "be_correccion_de_ingesta_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "ingesta_nutricional" WHERE "id" = NEW."ingesta_id" AND "origen" = 'FUERA_DE_PRESCRIPCION' AND "modo" = 'DESCRIPCION_LIBRE') THEN
    RAISE EXCEPTION 'BE: solo se estructura una ingesta libre fuera de prescripción (CONS:636-640)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "correccion_de_ingesta_insertar" BEFORE INSERT ON "correccion_de_ingesta" FOR EACH ROW EXECUTE FUNCTION "be_correccion_de_ingesta_insertar"();

-- UC-P13: se revisa un Proceso ABIERTO.
CREATE FUNCTION "be_revision_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "proceso_operativo" WHERE "id" = NEW."proceso_id" AND "estado" = 'ABIERTO') THEN
    RAISE EXCEPTION 'BE: la revisión se registra sobre un Proceso ABIERTO (UC-P13)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "revision_nutricional_insertar" BEFORE INSERT ON "revision_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_revision_insertar"();

-- REG-06-75, 77: la aplicación enlaza el evento ContinuidadOCierreAplicado de su revisión, y FINALIZAR ⇔ CIERRE_PROCESO.
CREATE FUNCTION "be_aplicacion_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_resultado "ResultadoDeRevision";
BEGIN
  SELECT "resultado" INTO v_resultado FROM "revision_nutricional" WHERE "id" = NEW."revision_id";
  IF (v_resultado = 'FINALIZAR') <> (NEW."tipo" = 'CIERRE_PROCESO') THEN
    RAISE EXCEPTION 'BE: solo FINALIZAR cierra el Proceso (INV-06-82, 83)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
       SELECT 1 FROM "evento_de_proceso" e
        WHERE e."id" = NEW."evento_id" AND e."tipo" = 'ContinuidadOCierreAplicado' AND e."revision_id" = NEW."revision_id"
          AND e."tipo_de_aplicacion" = NEW."tipo" AND e."estado_posterior" = NEW."estado_de_proceso_posterior") THEN
    RAISE EXCEPTION 'BE: la aplicación enlaza el ContinuidadOCierreAplicado de su revisión (REG-06-75)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "aplicacion_de_revision_insertar" BEFORE INSERT ON "aplicacion_de_revision" FOR EACH ROW EXECUTE FUNCTION "be_aplicacion_insertar"();

-- ─── Cada transición deja su hecho en la misma transacción (08 §17; patrón de WP-03) ──────────────
CREATE FUNCTION "be_transicion_con_hecho_wp04"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_con_hecho boolean;
BEGIN
  IF TG_TABLE_NAME = 'version_de_plan_nutricional' THEN
    SELECT EXISTS (
      SELECT 1 FROM "version_de_plan_nutricional" f JOIN "evento_de_nutricion" e ON e."recurso_id" = f."id"
       WHERE f."id" = NEW."id" AND e."estado_posterior" = f."estado"::text AND e."xmin" = pg_current_xact_id()::xid) INTO v_con_hecho;
  ELSIF TG_TABLE_NAME = 'proceso_operativo' THEN
    SELECT EXISTS (
      SELECT 1 FROM "proceso_operativo" f JOIN "evento_de_proceso" e ON e."proceso_id" = f."id"
       WHERE f."id" = NEW."id" AND e."estado_posterior" = f."estado" AND e."xmin" = pg_current_xact_id()::xid) INTO v_con_hecho;
  ELSE
    RAISE EXCEPTION 'BE: be_transicion_con_hecho_wp04 no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_con_hecho THEN
    RAISE EXCEPTION 'BE: la transición de % % no registró su hecho en la misma transacción (08 §17)', TG_TABLE_NAME, NEW."id" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "version_de_plan_nutricional_con_hecho" AFTER INSERT OR UPDATE ON "version_de_plan_nutricional"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_transicion_con_hecho_wp04"();
CREATE CONSTRAINT TRIGGER "proceso_operativo_con_hecho" AFTER INSERT OR UPDATE ON "proceso_operativo"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_transicion_con_hecho_wp04"();

-- ─── Catálogo sintético (WP-04 T14) ───────────────────────────────────────────────────────────────
-- Valores SINTÉTICOS de demostración, cada 100 g o 100 ml. Identificadores deterministas: iguales en todos los ambientes.
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c76065f4-cfaf-4e86-8cf5-297a557a18f5', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('21d82a09-8077-4a8e-8ddc-068f62e67626', 'c76065f4-cfaf-4e86-8cf5-297a557a18f5', 'Arroz blanco', '{"referenceAmount":"100g","energyKcal":130,"proteinG":2.7,"carbohydrateG":28,"fatG":0.3}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('b5b80403-b196-4961-8f9e-3ec31a7faf52', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('ba33d48f-3656-416f-89da-33b45332784d', 'b5b80403-b196-4961-8f9e-3ec31a7faf52', 'Arroz integral', '{"referenceAmount":"100g","energyKcal":112,"proteinG":2.6,"carbohydrateG":23.5,"fatG":0.9}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('d23db71c-a95f-4ad8-87a9-51e47fb7ac2e', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('69db1d47-d205-4913-8a7d-81cb01742ae0', 'd23db71c-a95f-4ad8-87a9-51e47fb7ac2e', 'Fideos secos', '{"referenceAmount":"100g","energyKcal":158,"proteinG":5.8,"carbohydrateG":31,"fatG":0.9}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c03d2e0a-1915-4202-8d48-ecd4ce4dac56', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('8fab26b4-e611-483c-80a4-ec9d35e488f5', 'c03d2e0a-1915-4202-8d48-ecd4ce4dac56', 'Papa', '{"referenceAmount":"100g","energyKcal":87,"proteinG":1.9,"carbohydrateG":20,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c8217184-c49e-4b11-8c3a-c316b1b09ab7', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('a77f12cf-aaed-48f6-814c-d16d5bd23823', 'c8217184-c49e-4b11-8c3a-c316b1b09ab7', 'Batata', '{"referenceAmount":"100g","energyKcal":90,"proteinG":2,"carbohydrateG":20.7,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('1d73a14d-1fa1-4a10-84c2-3b7537c5b520', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('bec042f5-4889-408b-8a9c-082c248537c6', '1d73a14d-1fa1-4a10-84c2-3b7537c5b520', 'Avena arrollada', '{"referenceAmount":"100g","energyKcal":379,"proteinG":13.2,"carbohydrateG":67.7,"fatG":6.5}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('14a1912d-d5e1-42b7-87e2-a1508aa947bf', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('a5ba2d8f-f8d8-4f00-8655-e5d7f2b64c3d', '14a1912d-d5e1-42b7-87e2-a1508aa947bf', 'Pan integral', '{"referenceAmount":"100g","energyKcal":247,"proteinG":13,"carbohydrateG":41,"fatG":3.4}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('2a83fdae-3244-4b9f-8fe0-8d423861f382', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('e90b07bd-d730-4362-8a21-fa222cfff04d', '2a83fdae-3244-4b9f-8fe0-8d423861f382', 'Pan francés', '{"referenceAmount":"100g","energyKcal":270,"proteinG":8.8,"carbohydrateG":55,"fatG":1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('fdac8b88-6dbe-4406-86b0-bf0c155ce0e2', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('1e76e0c9-de36-4e9e-8079-7864a35bd0bd', 'fdac8b88-6dbe-4406-86b0-bf0c155ce0e2', 'Pechuga de pollo', '{"referenceAmount":"100g","energyKcal":165,"proteinG":31,"carbohydrateG":0,"fatG":3.6}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('371c1568-f138-4236-8ab9-15ce21dc1eb6', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('bda30c1c-8dda-4b2f-829f-a6def033b7fd', '371c1568-f138-4236-8ab9-15ce21dc1eb6', 'Carne vacuna magra', '{"referenceAmount":"100g","energyKcal":187,"proteinG":27,"carbohydrateG":0,"fatG":8.5}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c1636c35-bbec-48d8-8590-177565d1e2e0', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('6c67fe73-4698-449c-80a3-caf876e33297', 'c1636c35-bbec-48d8-8590-177565d1e2e0', 'Merluza', '{"referenceAmount":"100g","energyKcal":90,"proteinG":18,"carbohydrateG":0,"fatG":1.7}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('77026f96-bd1d-440c-8158-e28e6df3d67a', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('e91dc331-02be-4967-8db7-9b86363269c2', '77026f96-bd1d-440c-8158-e28e6df3d67a', 'Huevo', '{"referenceAmount":"100g","energyKcal":143,"proteinG":12.6,"carbohydrateG":0.7,"fatG":9.5}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('41c1705e-aad6-4d57-8ab4-fef172f538ae', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('5f39e037-ca14-49b6-8e58-dbd4a487cf23', '41c1705e-aad6-4d57-8ab4-fef172f538ae', 'Lentejas', '{"referenceAmount":"100g","energyKcal":116,"proteinG":9,"carbohydrateG":20.1,"fatG":0.4}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('b283eb32-c57d-4662-8c4a-bddbc9133dd6', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('5865705a-9bd8-4dfb-8fa3-9750a15b6c33', 'b283eb32-c57d-4662-8c4a-bddbc9133dd6', 'Garbanzos', '{"referenceAmount":"100g","energyKcal":164,"proteinG":8.9,"carbohydrateG":27.4,"fatG":2.6}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('5a0f80cb-ca00-4a8c-8ea0-02dd0ba7fdc8', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('aa6b45a7-90b8-4d6e-8a8b-2a0ffe26a726', '5a0f80cb-ca00-4a8c-8ea0-02dd0ba7fdc8', 'Tofu', '{"referenceAmount":"100g","energyKcal":76,"proteinG":8.1,"carbohydrateG":1.9,"fatG":4.8}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('77ace701-cd14-49c6-877c-1a858da71bcd', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('dcdc5c4c-0d0e-4d8c-89c3-e098dbb2ea99', '77ace701-cd14-49c6-877c-1a858da71bcd', 'Leche descremada', '{"referenceAmount":"100ml","energyKcal":35,"proteinG":3.4,"carbohydrateG":5,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('75a490da-f9c5-41fc-8287-7ddf26fd9218', '121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1', 'Yogur natural', '{"referenceAmount":"100g","energyKcal":61,"proteinG":3.5,"carbohydrateG":4.7,"fatG":3.3}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('025d7e5b-124c-416f-83e1-bbdd1cf78f20', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('b4072750-3d37-4e34-823f-9f7d67ec2770', '025d7e5b-124c-416f-83e1-bbdd1cf78f20', 'Queso fresco', '{"referenceAmount":"100g","energyKcal":264,"proteinG":18,"carbohydrateG":3,"fatG":20}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('8a7b3d47-778a-40e9-8116-04a6702c28e0', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('92bc9550-f873-40e0-8564-8b5d1ef2691c', '8a7b3d47-778a-40e9-8116-04a6702c28e0', 'Ricota', '{"referenceAmount":"100g","energyKcal":174,"proteinG":11.3,"carbohydrateG":3,"fatG":13}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('eaf534d4-f839-4acc-8a6d-53d8dc359e29', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('f5d9ac74-6512-4adc-839a-cc46e8eef5da', 'eaf534d4-f839-4acc-8a6d-53d8dc359e29', 'Manzana', '{"referenceAmount":"100g","energyKcal":52,"proteinG":0.3,"carbohydrateG":13.8,"fatG":0.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('c6113e6e-e6c2-4f79-8a98-5f9d836b8018', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('bf4a5bbe-dc5e-4936-803e-0feba9a68aef', 'c6113e6e-e6c2-4f79-8a98-5f9d836b8018', 'Banana', '{"referenceAmount":"100g","energyKcal":89,"proteinG":1.1,"carbohydrateG":22.8,"fatG":0.3}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('404ca218-947b-4c73-8990-0e626928050c', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('93261e24-c756-4de1-8307-1dcf7b724ef6', '404ca218-947b-4c73-8990-0e626928050c', 'Naranja', '{"referenceAmount":"100g","energyKcal":47,"proteinG":0.9,"carbohydrateG":11.8,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('fb220d6d-ccfd-4eb5-8bf3-5b9e370cccb0', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('b2008723-3c51-451c-8844-9734114cc223', 'fb220d6d-ccfd-4eb5-8bf3-5b9e370cccb0', 'Frutillas', '{"referenceAmount":"100g","energyKcal":32,"proteinG":0.7,"carbohydrateG":7.7,"fatG":0.3}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('fe14b950-2fe4-47f1-84c9-cd842c31ff6d', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('b33c8d4b-e158-423b-82c7-b31936120da4', 'fe14b950-2fe4-47f1-84c9-cd842c31ff6d', 'Lechuga', '{"referenceAmount":"100g","energyKcal":15,"proteinG":1.4,"carbohydrateG":2.9,"fatG":0.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('97b275d1-6517-4dcf-825b-a348063a9144', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('40687372-c2f9-4bdb-86c1-a7ddff58fce0', '97b275d1-6517-4dcf-825b-a348063a9144', 'Tomate', '{"referenceAmount":"100g","energyKcal":18,"proteinG":0.9,"carbohydrateG":3.9,"fatG":0.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('1b1539fc-63cd-4c1d-896d-a382e226cccc', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('07c0144b-40e8-4b0d-85fc-e9a8900c621b', '1b1539fc-63cd-4c1d-896d-a382e226cccc', 'Zanahoria', '{"referenceAmount":"100g","energyKcal":41,"proteinG":0.9,"carbohydrateG":9.6,"fatG":0.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('29110cf4-5657-4bc1-810b-0867712e8d0f', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('65c91c1d-925a-415d-88cd-0f07d9a8579b', '29110cf4-5657-4bc1-810b-0867712e8d0f', 'Zapallo', '{"referenceAmount":"100g","energyKcal":26,"proteinG":1,"carbohydrateG":6.5,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('513510d2-911c-4042-8e58-0a58e712a4d3', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('8d7829a5-0a29-4f91-8006-1cdceae1bb08', '513510d2-911c-4042-8e58-0a58e712a4d3', 'Brócoli', '{"referenceAmount":"100g","energyKcal":34,"proteinG":2.8,"carbohydrateG":6.6,"fatG":0.4}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('080d39b0-cf43-4331-866f-9d01b460338c', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('e6050399-8f3d-4a27-8ab9-3951005f6d45', '080d39b0-cf43-4331-866f-9d01b460338c', 'Espinaca', '{"referenceAmount":"100g","energyKcal":23,"proteinG":2.9,"carbohydrateG":3.6,"fatG":0.4}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('72b8f490-c8d1-4eab-8562-f0be2ee21476', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('036c82c1-942c-40be-8a5b-b5db8915c44b', '72b8f490-c8d1-4eab-8562-f0be2ee21476', 'Cebolla', '{"referenceAmount":"100g","energyKcal":40,"proteinG":1.1,"carbohydrateG":9.3,"fatG":0.1}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('93f1554d-0039-4c43-817e-11cabd37f75a', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('88c51715-928c-4774-82cb-4573952420a9', '93f1554d-0039-4c43-817e-11cabd37f75a', 'Aceite de oliva', '{"referenceAmount":"100ml","energyKcal":884,"proteinG":0,"carbohydrateG":0,"fatG":100}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('89b288a3-ab81-4ffd-818b-d0d188564dda', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('10b9d42a-59e9-4ebd-81fb-7c939af99bcf', '89b288a3-ab81-4ffd-818b-d0d188564dda', 'Palta', '{"referenceAmount":"100g","energyKcal":160,"proteinG":2,"carbohydrateG":8.5,"fatG":14.7}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('14a4a789-8c9c-4790-84aa-e2f02391702d', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('b037269c-675d-410b-88be-b255d9ba305a', '14a4a789-8c9c-4790-84aa-e2f02391702d', 'Nueces', '{"referenceAmount":"100g","energyKcal":654,"proteinG":15.2,"carbohydrateG":13.7,"fatG":65.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('3f82653e-ee1e-465d-8248-960766985b91', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('5410500f-c4a4-49e9-8b64-aa4d14eee2c5', '3f82653e-ee1e-465d-8248-960766985b91', 'Almendras', '{"referenceAmount":"100g","energyKcal":579,"proteinG":21.2,"carbohydrateG":21.6,"fatG":49.9}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('106f74b8-7861-4e7e-892e-5a01f7af2d2c', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('fb7e6b97-9a1b-4bf0-88ed-00c66d114a2d', '106f74b8-7861-4e7e-892e-5a01f7af2d2c', 'Mantequilla de maní', '{"referenceAmount":"100g","energyKcal":588,"proteinG":25,"carbohydrateG":20,"fatG":50}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('4bab8794-97dc-4abd-8da3-e45adb3cda12', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('cf471bff-04cf-4138-8807-092893680cd0', '4bab8794-97dc-4abd-8da3-e45adb3cda12', 'Miel', '{"referenceAmount":"100g","energyKcal":304,"proteinG":0.3,"carbohydrateG":82.4,"fatG":0}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('f513c235-14ad-4ed0-851b-3953553cb2c7', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('cd2b416d-eb1a-4a65-8c68-a8d0b039a232', 'f513c235-14ad-4ed0-851b-3953553cb2c7', 'Café sin azúcar', '{"referenceAmount":"100ml","energyKcal":2,"proteinG":0.3,"carbohydrateG":0,"fatG":0}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('2f3f7128-5d8c-42c9-836d-443944afe4b5', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('1ce95775-ea07-4929-8013-2c47ddde357d', '2f3f7128-5d8c-42c9-836d-443944afe4b5', 'Té sin azúcar', '{"referenceAmount":"100ml","energyKcal":1,"proteinG":0,"carbohydrateG":0.3,"fatG":0}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('58372e24-4c8a-4433-8eb4-0b8c6ca4a47f', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('58daf3b1-a329-429b-8843-bba055f5918c', '58372e24-4c8a-4433-8eb4-0b8c6ca4a47f', 'Agua', '{"referenceAmount":"100ml","energyKcal":0,"proteinG":0,"carbohydrateG":0,"fatG":0}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
INSERT INTO "elemento_de_catalogo_nutricional" ("id", "procedencia", "momento_de_registro") VALUES ('88714e7a-76a3-4b74-88d1-1a5524773df8', 'BE_SYNTHETIC_SEED', '2026-09-20T00:00:00.000Z');
INSERT INTO "version_de_elemento_nutricional" ("id", "elemento_id", "nombre", "composicion", "disponible", "procedencia", "momento_de_registro") VALUES ('40026df4-08fe-4371-8223-fc537ac1a4a1', '88714e7a-76a3-4b74-88d1-1a5524773df8', 'Jugo de naranja exprimido', '{"referenceAmount":"100ml","energyKcal":45,"proteinG":0.7,"carbohydrateG":10.4,"fatG":0.2}', true, '{"fuente":"catalogo-sintetico-wp04","nota":"Valores sintéticos de demostración: no son una tabla de composición de referencia."}', '2026-09-20T00:00:00.000Z');
