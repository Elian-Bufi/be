-- WP-06 · Circuito de entrenamiento (B-08, 06:4947-5786). Definición: docs/paquetes/WP-06.md.
--
-- Tablas, claves e índices generados con `prisma migrate diff` desde schema.prisma, para que la prueba de deriva
-- no encuentre diferencias. Las garantías que Prisma no puede expresar van a mano, al final.

-- CreateEnum
CREATE TYPE "CondicionDeSesion" AS ENUM ('REALIZADA', 'REALIZADA_CON_DESVIO', 'NO_REALIZADA');

-- CreateEnum
CREATE TYPE "GranularidadDeRegistro" AS ENUM ('SERIE', 'EJERCICIO_O_SESION');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeEntrenamiento" AS ENUM ('EjercicioDeCatalogoCreado', 'EvaluacionDeEntrenamientoRegistrada', 'VersionDeObjetivoDeEntrenamientoEmitida', 'BorradorDePlanDeEntrenamientoCreado', 'BorradorDePlanDeEntrenamientoGuardado', 'VersionDePlanDeEntrenamientoActivada', 'BorradorDeEjecucionCreado', 'BorradorDeEjecucionGuardado', 'EjecucionRegistrada', 'EjecucionCorregida', 'RevisionDeEntrenamientoRegistrada');

-- CreateTable
CREATE TABLE "ejercicio_de_catalogo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "procedencia" "ProcedenciaDeCatalogo" NOT NULL,
    "creado_por_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejercicio_de_catalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_ejercicio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejercicio_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "nombre" TEXT NOT NULL,
    "disponibilidad" "DisponibilidadDeElemento" NOT NULL DEFAULT 'DISPONIBLE',
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "valoracion" JSONB NOT NULL,
    "referencias" JSONB NOT NULL,
    "notas" TEXT,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivo_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivo_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_objetivo_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "objetivo_id" UUID NOT NULL,
    "predecesora_id" UUID,
    "evaluacion_id" UUID NOT NULL,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL,
    "vigente_hasta" TIMESTAMPTZ(3),
    "objetivo" JSONB NOT NULL,
    "fundamento" TEXT NOT NULL,
    "revision_de_origen_id" UUID,
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "version_de_objetivo_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "version_efectiva_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_de_plan_de_entrenamiento" (
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

    CONSTRAINT "version_de_plan_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instantanea_de_plan_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_de_plan_id" UUID NOT NULL,
    "contenido" JSONB NOT NULL,
    "huella" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instantanea_de_plan_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrador_de_ejecucion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "version_de_plan_id" UUID NOT NULL,
    "sesion_planificada_id" TEXT NOT NULL,
    "fecha_local" DATE NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "granularidad" "GranularidadDeRegistro",
    "condicion" "CondicionDeSesion",
    "motivo" TEXT,
    "contenido" JSONB NOT NULL DEFAULT '{}',
    "momento_de_ocurrencia" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "momento_de_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "borrador_de_ejecucion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejecucion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "version_de_plan_id" UUID NOT NULL,
    "sesion_planificada_id" TEXT NOT NULL,
    "fecha_local" DATE NOT NULL,
    "zona_horaria" TEXT NOT NULL,
    "borrador_id" UUID NOT NULL,
    "granularidad" "GranularidadDeRegistro",
    "condicion" "CondicionDeSesion" NOT NULL,
    "motivo" TEXT,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejecucion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correccion_de_ejecucion_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejecucion_id" UUID NOT NULL,
    "correccion_previa_id" UUID,
    "autor_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correccion_de_ejecucion_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_de_entrenamiento" (
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

    CONSTRAINT "revision_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacion_de_revision_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "revision_id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "tipo" "TipoDeAplicacion" NOT NULL,
    "estado_de_proceso_posterior" "EstadoDeProceso" NOT NULL,
    "version_de_plan_creada_id" UUID,
    "version_de_objetivo_creada_id" UUID,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicacion_de_revision_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secuencia" BIGSERIAL NOT NULL,
    "tipo" "TipoDeEventoDeEntrenamiento" NOT NULL,
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

    CONSTRAINT "evento_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "version_de_ejercicio_predecesora_id_key" ON "version_de_ejercicio"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_ejercicio_ejercicio_id_idx" ON "version_de_ejercicio"("ejercicio_id");

-- CreateIndex
CREATE INDEX "evaluacion_de_entrenamiento_asesorado_id_profesional_id_mom_idx" ON "evaluacion_de_entrenamiento"("asesorado_id", "profesional_id", "momento_de_registro");

-- CreateIndex
CREATE UNIQUE INDEX "objetivo_de_entrenamiento_profesional_id_asesorado_id_key" ON "objetivo_de_entrenamiento"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_objetivo_de_entrenamiento_predecesora_id_key" ON "version_de_objetivo_de_entrenamiento"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_objetivo_de_entrenamiento_objetivo_id_idx" ON "version_de_objetivo_de_entrenamiento"("objetivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_de_entrenamiento_version_efectiva_id_key" ON "plan_de_entrenamiento"("version_efectiva_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_de_entrenamiento_profesional_id_asesorado_id_key" ON "plan_de_entrenamiento"("profesional_id", "asesorado_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_de_plan_de_entrenamiento_predecesora_id_key" ON "version_de_plan_de_entrenamiento"("predecesora_id");

-- CreateIndex
CREATE INDEX "version_de_plan_de_entrenamiento_plan_id_idx" ON "version_de_plan_de_entrenamiento"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "instantanea_de_plan_de_entrenamiento_version_de_plan_id_key" ON "instantanea_de_plan_de_entrenamiento"("version_de_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrador_de_ejecucion_de_entrenamiento_asesorado_id_version_key" ON "borrador_de_ejecucion_de_entrenamiento"("asesorado_id", "version_de_plan_id", "sesion_planificada_id", "fecha_local");

-- CreateIndex
CREATE UNIQUE INDEX "ejecucion_de_entrenamiento_borrador_id_key" ON "ejecucion_de_entrenamiento"("borrador_id");

-- CreateIndex
CREATE INDEX "ejecucion_de_entrenamiento_asesorado_id_fecha_local_idx" ON "ejecucion_de_entrenamiento"("asesorado_id", "fecha_local");

-- CreateIndex
CREATE UNIQUE INDEX "ejecucion_de_entrenamiento_asesorado_id_version_de_plan_id__key" ON "ejecucion_de_entrenamiento"("asesorado_id", "version_de_plan_id", "sesion_planificada_id", "fecha_local");

-- CreateIndex
CREATE UNIQUE INDEX "correccion_de_ejecucion_de_entrenamiento_correccion_previa__key" ON "correccion_de_ejecucion_de_entrenamiento"("correccion_previa_id");

-- CreateIndex
CREATE INDEX "correccion_de_ejecucion_de_entrenamiento_ejecucion_id_idx" ON "correccion_de_ejecucion_de_entrenamiento"("ejecucion_id");

-- CreateIndex
CREATE INDEX "revision_de_entrenamiento_proceso_id_idx" ON "revision_de_entrenamiento"("proceso_id");

-- CreateIndex
CREATE UNIQUE INDEX "aplicacion_de_revision_de_entrenamiento_revision_id_key" ON "aplicacion_de_revision_de_entrenamiento"("revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "aplicacion_de_revision_de_entrenamiento_evento_id_key" ON "aplicacion_de_revision_de_entrenamiento"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_entrenamiento_secuencia_key" ON "evento_de_entrenamiento"("secuencia");

-- CreateIndex
CREATE INDEX "evento_de_entrenamiento_asesorado_id_momento_de_registro_idx" ON "evento_de_entrenamiento"("asesorado_id", "momento_de_registro");

-- CreateIndex
CREATE INDEX "evento_de_entrenamiento_recurso_id_idx" ON "evento_de_entrenamiento"("recurso_id");

-- AddForeignKey
ALTER TABLE "ejercicio_de_catalogo" ADD CONSTRAINT "ejercicio_de_catalogo_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_ejercicio" ADD CONSTRAINT "version_de_ejercicio_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_ejercicio" ADD CONSTRAINT "version_de_ejercicio_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_ejercicio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_de_entrenamiento" ADD CONSTRAINT "evaluacion_de_entrenamiento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evaluacion_de_entrenamiento" ADD CONSTRAINT "evaluacion_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "objetivo_de_entrenamiento" ADD CONSTRAINT "objetivo_de_entrenamiento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "objetivo_de_entrenamiento" ADD CONSTRAINT "objetivo_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivo_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_objetivo_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_evaluacion_id_fkey" FOREIGN KEY ("evaluacion_id") REFERENCES "evaluacion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_revision_de_origen_id_fkey" FOREIGN KEY ("revision_de_origen_id") REFERENCES "revision_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_de_entrenamiento" ADD CONSTRAINT "plan_de_entrenamiento_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_de_entrenamiento" ADD CONSTRAINT "plan_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "plan_de_entrenamiento" ADD CONSTRAINT "plan_de_entrenamiento_version_efectiva_id_fkey" FOREIGN KEY ("version_efectiva_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_version_de_objetivo_id_fkey" FOREIGN KEY ("version_de_objetivo_id") REFERENCES "version_de_objetivo_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_revision_de_origen_id_fkey" FOREIGN KEY ("revision_de_origen_id") REFERENCES "revision_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "instantanea_de_plan_de_entrenamiento" ADD CONSTRAINT "instantanea_de_plan_de_entrenamiento_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "borrador_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "borrador_de_ejecucion_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "borrador_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "borrador_de_ejecucion_de_entrenamiento_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_entrenamiento" ADD CONSTRAINT "ejecucion_de_entrenamiento_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_entrenamiento" ADD CONSTRAINT "ejecucion_de_entrenamiento_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ejecucion_de_entrenamiento" ADD CONSTRAINT "ejecucion_de_entrenamiento_borrador_id_fkey" FOREIGN KEY ("borrador_id") REFERENCES "borrador_de_ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "correccion_de_ejecucion_de_entrenamiento_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "correccion_de_ejecucion_de_entrenamiento_correccion_previa_fkey" FOREIGN KEY ("correccion_previa_id") REFERENCES "correccion_de_ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "correccion_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "correccion_de_ejecucion_de_entrenamiento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_de_entrenamiento" ADD CONSTRAINT "revision_de_entrenamiento_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "proceso_operativo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aplicacion_de_revision_de_entrenamiento" ADD CONSTRAINT "aplicacion_de_revision_de_entrenamiento_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "revision_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "aplicacion_de_revision_de_entrenamiento" ADD CONSTRAINT "aplicacion_de_revision_de_entrenamiento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "evento_de_proceso"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- WP-06 · Garantías de la base. Lo que sigue sostiene las reglas de B-08 aunque el código se equivoque.
-- Prisma no representa triggers, CHECK ni índices parciales: por eso viven acá y no en schema.prisma.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Cadenas lineales por relación, nunca por fecha (B-06; REG-06-12, 15, 16) ─────────────────────
-- Una sola raíz por objeto; la unicidad de la predecesora ya la puso Prisma. Con las dos, bifurcar es imposible.
CREATE UNIQUE INDEX "version_de_ejercicio_una_raiz" ON "version_de_ejercicio" ("ejercicio_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "version_de_objetivo_de_entrenamiento_una_raiz" ON "version_de_objetivo_de_entrenamiento" ("objetivo_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "version_de_plan_de_entrenamiento_una_raiz" ON "version_de_plan_de_entrenamiento" ("plan_id") WHERE "predecesora_id" IS NULL;
CREATE UNIQUE INDEX "correccion_de_ejecucion_de_entrenamiento_una_raiz" ON "correccion_de_ejecucion_de_entrenamiento" ("ejecucion_id") WHERE "correccion_previa_id" IS NULL;
-- Un solo borrador de plan abierto a la vez, como en nutrición.
CREATE UNIQUE INDEX "version_de_plan_de_entrenamiento_un_borrador" ON "version_de_plan_de_entrenamiento" ("plan_id") WHERE "estado" = 'BORRADOR';

-- La predecesora es del mismo objeto. Se redefine la función compartida con todas las ramas anteriores intactas.
CREATE OR REPLACE FUNCTION "be_sucesion_del_mismo_objeto"() RETURNS trigger LANGUAGE plpgsql AS $$
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
  ELSIF TG_TABLE_NAME = 'version_de_especificacion_antropometrica' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_especificacion_antropometrica" WHERE "id" = NEW."predecesora_id" AND "especificacion_id" = NEW."especificacion_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_medicion' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_medicion" WHERE "id" = NEW."correccion_previa_id" AND "medicion_id" = NEW."medicion_id");
  ELSIF TG_TABLE_NAME = 'referencia_de_calculo' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (
      SELECT 1 FROM "referencia_de_calculo"
       WHERE "id" = NEW."predecesora_id" AND "asesorado_id" = NEW."asesorado_id" AND "profesional_id" = NEW."profesional_id" AND "finalidad" = NEW."finalidad");
  -- WP-06
  ELSIF TG_TABLE_NAME = 'version_de_ejercicio' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_ejercicio" WHERE "id" = NEW."predecesora_id" AND "ejercicio_id" = NEW."ejercicio_id");
  ELSIF TG_TABLE_NAME = 'version_de_objetivo_de_entrenamiento' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_objetivo_de_entrenamiento" WHERE "id" = NEW."predecesora_id" AND "objetivo_id" = NEW."objetivo_id");
  ELSIF TG_TABLE_NAME = 'version_de_plan_de_entrenamiento' THEN
    v_ok := NEW."predecesora_id" IS NULL OR EXISTS (SELECT 1 FROM "version_de_plan_de_entrenamiento" WHERE "id" = NEW."predecesora_id" AND "plan_id" = NEW."plan_id");
  ELSIF TG_TABLE_NAME = 'correccion_de_ejecucion_de_entrenamiento' THEN
    v_ok := NEW."correccion_previa_id" IS NULL OR EXISTS (SELECT 1 FROM "correccion_de_ejecucion_de_entrenamiento" WHERE "id" = NEW."correccion_previa_id" AND "ejecucion_id" = NEW."ejecucion_id");
  ELSE
    RAISE EXCEPTION 'BE: be_sucesion_del_mismo_objeto no contempla la tabla %', TG_TABLE_NAME;
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'BE: en % la predecesora tiene que ser del mismo objeto (REG-06-12, REG-06-15)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_ejercicio_sucesion" BEFORE INSERT ON "version_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "version_de_objetivo_de_entrenamiento_sucesion" BEFORE INSERT ON "version_de_objetivo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "version_de_plan_de_entrenamiento_sucesion" BEFORE INSERT ON "version_de_plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();
CREATE TRIGGER "correccion_de_ejecucion_de_entrenamiento_sucesion" BEFORE INSERT ON "correccion_de_ejecucion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_sucesion_del_mismo_objeto"();

-- ─── Historia por adición: lo que es historia no se edita, no se borra y no se trunca (06 §4.4) ──
CREATE TRIGGER "ejercicio_de_catalogo_solo_agregar" BEFORE UPDATE OR DELETE ON "ejercicio_de_catalogo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evaluacion_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "evaluacion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "objetivo_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "objetivo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_objetivo_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "version_de_objetivo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "instantanea_de_plan_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "instantanea_de_plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
-- INV-06-124: la ejecución registrada original es inmutable.
CREATE TRIGGER "ejecucion_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "ejecucion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_ejecucion_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "correccion_de_ejecucion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "revision_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "revision_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "aplicacion_de_revision_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "aplicacion_de_revision_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "ejercicio_de_catalogo_sin_truncate" BEFORE TRUNCATE ON "ejercicio_de_catalogo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "version_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evaluacion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "evaluacion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "objetivo_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "objetivo_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_objetivo_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "version_de_objetivo_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "plan_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "plan_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "version_de_plan_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "version_de_plan_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "instantanea_de_plan_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "instantanea_de_plan_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "borrador_de_ejecucion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "borrador_de_ejecucion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "ejecucion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "ejecucion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "correccion_de_ejecucion_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "correccion_de_ejecucion_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "revision_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "revision_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "aplicacion_de_revision_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "aplicacion_de_revision_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "evento_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── Coherencia de datos ──────────────────────────────────────────────────────────────────────────
ALTER TABLE "version_de_ejercicio" ADD CONSTRAINT "version_de_ejercicio_con_nombre" CHECK (btrim("nombre") <> '');
-- REG-06-98 / RF-064: el objetivo lleva fundamento, y su vigencia está bien formada.
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_con_fundamento" CHECK (btrim("fundamento") <> '');
ALTER TABLE "version_de_objetivo_de_entrenamiento" ADD CONSTRAINT "version_de_objetivo_de_entrenamiento_vigencia_coherente" CHECK ("vigente_hasta" IS NULL OR "vigente_hasta" > "vigente_desde");
-- La activación existe exactamente cuando la versión está ACTIVADA.
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_activacion_coherente" CHECK (("estado" = 'BORRADOR') = ("momento_de_activacion" IS NULL));
ALTER TABLE "instantanea_de_plan_de_entrenamiento" ADD CONSTRAINT "instantanea_de_plan_de_entrenamiento_huella_sha256" CHECK ("huella" ~ '^[0-9a-f]{64}$');
-- La sesión planificada tiene identificador; sin él la ocurrencia no es identificable (REG-06-115).
ALTER TABLE "borrador_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "borrador_de_ejecucion_sesion_identificable" CHECK (btrim("sesion_planificada_id") <> '');
ALTER TABLE "ejecucion_de_entrenamiento" ADD CONSTRAINT "ejecucion_de_entrenamiento_sesion_identificable" CHECK (btrim("sesion_planificada_id") <> '');
-- Sin entrenamiento no se usó ninguna granularidad: NO_REALIZADA va sin ella, y las otras dos condiciones la exigen.
-- Obligar a elegir una para «No pude realizarla» sería registrar un hecho que no ocurrió (REG-06-131, REG-06-132).
ALTER TABLE "ejecucion_de_entrenamiento" ADD CONSTRAINT "ejecucion_de_entrenamiento_granularidad_segun_condicion" CHECK (("condicion" = 'NO_REALIZADA') = ("granularidad" IS NULL));
-- La corrección dice por qué (REG-06-116: «conserva actor, motivo…»).
ALTER TABLE "correccion_de_ejecucion_de_entrenamiento" ADD CONSTRAINT "correccion_de_ejecucion_con_motivo" CHECK (btrim("motivo") <> '');
-- REG-06-141: interpretación y fundamento no vacíos; período bien formado.
ALTER TABLE "revision_de_entrenamiento" ADD CONSTRAINT "revision_de_entrenamiento_componentes" CHECK (
  btrim("interpretacion") <> '' AND btrim("fundamento") <> '' AND "periodo_inicio" <= "periodo_fin"
);

-- ─── El objetivo de una versión es del mismo asesorado y profesional (REG-06-102) ─────────────────
CREATE FUNCTION "be_version_de_objetivo_de_entrenamiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "objetivo_de_entrenamiento" o JOIN "evaluacion_de_entrenamiento" e
         ON e."profesional_id" = o."profesional_id" AND e."asesorado_id" = o."asesorado_id"
        WHERE o."id" = NEW."objetivo_id" AND e."id" = NEW."evaluacion_id") THEN
    RAISE EXCEPTION 'BE: el objetivo se funda en una evaluación de las mismas partes (REG-06-98)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "version_de_objetivo_de_entrenamiento_insertar" BEFORE INSERT ON "version_de_objetivo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_version_de_objetivo_de_entrenamiento_insertar"();

-- ─── Lista blanca de la versión de plan (06:5157-5159; sin salida de ACTIVADA, 06:4307) ───────────
CREATE FUNCTION "be_version_de_plan_de_entrenamiento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- CrearBorrador: inicio → BORRADOR. El objetivo es de las mismas partes que el plan.
    IF NEW."estado" <> 'BORRADOR' OR NEW."version" <> 1 OR NEW."momento_de_activacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una versión de plan de entrenamiento nace BORRADOR (CrearBorrador, 06:5157)' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (
         SELECT 1 FROM "plan_de_entrenamiento" p
           JOIN "version_de_objetivo_de_entrenamiento" vo ON vo."id" = NEW."version_de_objetivo_id"
           JOIN "objetivo_de_entrenamiento" o ON o."id" = vo."objetivo_id"
          WHERE p."id" = NEW."plan_id" AND o."profesional_id" = p."profesional_id" AND o."asesorado_id" = p."asesorado_id") THEN
      RAISE EXCEPTION 'BE: el plan se ata a un objetivo de las mismas partes (09v10:686)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: una versión de plan no se elimina: la historia es por adición (06 §4.4)' USING ERRCODE = 'restrict_violation';
  END IF;
  -- INV-06-109; 06:4307: no existe transición que edite una ACTIVADA ni que la devuelva a BORRADOR.
  IF OLD."estado" = 'ACTIVADA' THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: una versión ACTIVADA es inmutable; cambiarla exige una sucesora (INV-06-109, INV-06-127)' USING ERRCODE = 'check_violation';
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
    -- ActivarVersion: se activa lo que se validó, y la instantánea existe ANTES de la vigencia (REG-06-104).
    IF (NEW."contenido", NEW."version_de_objetivo_id", NEW."proxima_revision") IS DISTINCT FROM (OLD."contenido", OLD."version_de_objetivo_id", OLD."proxima_revision") THEN
      RAISE EXCEPTION 'BE: activar no cambia el contenido: se activa lo que se validó (REG-06-104)' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "instantanea_de_plan_de_entrenamiento" WHERE "version_de_plan_id" = NEW."id") THEN
      RAISE EXCEPTION 'BE: sin instantánea no hay activación («si no puede preservarse la instantánea, el plan no se activa», 05:8878)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en versión de plan de entrenamiento % -> % (06:5157-5159)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "version_de_plan_de_entrenamiento_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "version_de_plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_version_de_plan_de_entrenamiento_guardar"();

-- La instantánea se toma sobre un BORRADOR que se está activando: una versión ya activada no se re-fotografía.
CREATE FUNCTION "be_instantanea_de_entrenamiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "version_de_plan_de_entrenamiento" WHERE "id" = NEW."version_de_plan_id" AND "estado" = 'BORRADOR') THEN
    RAISE EXCEPTION 'BE: la instantánea se toma al activar un BORRADOR (REG-06-104)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "instantanea_de_plan_de_entrenamiento_insertar" BEFORE INSERT ON "instantanea_de_plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_instantanea_de_entrenamiento_insertar"();

-- ─── La relación efectiva solo avanza a la sucesora activada (INV-06-110) ─────────────────────────
CREATE FUNCTION "be_plan_de_entrenamiento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
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
       SELECT 1 FROM "version_de_plan_de_entrenamiento" v
        WHERE v."id" = NEW."version_efectiva_id" AND v."plan_id" = NEW."id" AND v."estado" = 'ACTIVADA'
          AND v."predecesora_id" IS NOT DISTINCT FROM OLD."version_efectiva_id") THEN
    RAISE EXCEPTION 'BE: la versión efectiva solo pasa a la sucesora ACTIVADA de la anterior (INV-06-110)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "plan_de_entrenamiento_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "plan_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_plan_de_entrenamiento_guardar"();

-- ─── Borrador de ejecución (06:5202-5219) ─────────────────────────────────────────────────────────
-- Nace contra una versión ACTIVADA del plan del propio asesorado (INV-06-121: nunca ligado a un borrador de plan).
-- Se edita mientras no se confirmó. Confirmado, queda congelado: no existe la vuelta de REGISTRADA a BORRADOR.
CREATE FUNCTION "be_borrador_de_ejecucion_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un borrador de ejecución no se elimina: si se confirmó, es el origen de una ejecución' USING ERRCODE = 'restrict_violation';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: un borrador de ejecución nace en versión 1 (CrearBorradorEjecucion)' USING ERRCODE = 'check_violation';
    END IF;
    IF NOT EXISTS (
         SELECT 1 FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
          WHERE v."id" = NEW."version_de_plan_id" AND v."estado" = 'ACTIVADA' AND p."asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: la ejecución se registra contra una versión ACTIVADA del plan del asesorado (INV-06-121, REG-06-105)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF EXISTS (SELECT 1 FROM "ejecucion_de_entrenamiento" WHERE "borrador_id" = OLD."id") THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: un borrador confirmado no se edita; la vuelta de REGISTRADA a BORRADOR no existe (06:5221)' USING ERRCODE = 'check_violation';
  END IF;
  IF (NEW."id", NEW."asesorado_id", NEW."version_de_plan_id", NEW."sesion_planificada_id", NEW."fecha_local", NEW."zona_horaria", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."asesorado_id", OLD."version_de_plan_id", OLD."sesion_planificada_id", OLD."fecha_local", OLD."zona_horaria", OLD."momento_de_registro") THEN
    RAISE EXCEPTION 'BE: el borrador conserva su ocurrencia: asesorado, versión, sesión y fecha' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."version" <> OLD."version" + 1 THEN
    RAISE EXCEPTION 'BE: la versión del borrador de ejecución avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "borrador_de_ejecucion_de_entrenamiento_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "borrador_de_ejecucion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_borrador_de_ejecucion_guardar"();

-- ─── Ejecución registrada (ConfirmarEjecucion) ────────────────────────────────────────────────────
-- Nace de su borrador y hereda su ocurrencia exacta. La unicidad por ocurrencia (REG-06-115) la puso Prisma como
-- índice único sobre (asesorado, versión, sesión, fecha local): dos confirmaciones concurrentes no pasan las dos.
CREATE FUNCTION "be_ejecucion_de_entrenamiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM "borrador_de_ejecucion_de_entrenamiento" b
        WHERE b."id" = NEW."borrador_id" AND b."asesorado_id" = NEW."asesorado_id" AND b."version_de_plan_id" = NEW."version_de_plan_id"
          AND b."sesion_planificada_id" = NEW."sesion_planificada_id" AND b."fecha_local" = NEW."fecha_local" AND b."zona_horaria" = NEW."zona_horaria") THEN
    RAISE EXCEPTION 'BE: la ejecución nace de su borrador y conserva su ocurrencia (ConfirmarEjecucion, 06:5219)' USING ERRCODE = 'check_violation';
  END IF;
  -- Se confirma lo que se guardó: granularidad y condición son las del borrador, que ya no puede estar vacío.
  IF NOT EXISTS (
       SELECT 1 FROM "borrador_de_ejecucion_de_entrenamiento" b
        WHERE b."id" = NEW."borrador_id" AND b."granularidad" IS NOT DISTINCT FROM NEW."granularidad" AND b."condicion" = NEW."condicion") THEN
    RAISE EXCEPTION 'BE: se confirma lo que el borrador declaró: granularidad y condición (REG-06-131, REG-06-132)' USING ERRCODE = 'check_violation';
  END IF;
  -- El instante de la sesión cae en la fecha local de su ocurrencia. BE no inventa la hora de una sesión pasada, y
  -- tampoco acepta una que la contradiga: la sesión del lunes no ocurrió el martes (09v10:188-189).
  IF (NEW."momento_de_ocurrencia" AT TIME ZONE NEW."zona_horaria")::date <> NEW."fecha_local" THEN
    RAISE EXCEPTION 'BE: la ejecución ocurre en la fecha local de su ocurrencia' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "ejecucion_de_entrenamiento_insertar" BEFORE INSERT ON "ejecucion_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_ejecucion_de_entrenamiento_insertar"();

-- ─── La revisión de entrenamiento es sobre un Proceso ABIERTO de entrenamiento (UC-P18) ───────────
CREATE FUNCTION "be_revision_de_entrenamiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "proceso_operativo" WHERE "id" = NEW."proceso_id" AND "estado" = 'ABIERTO' AND "alcance" = 'ENTRENAMIENTO') THEN
    RAISE EXCEPTION 'BE: la revisión de entrenamiento se registra sobre un Proceso ABIERTO de entrenamiento (UC-P18)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "revision_de_entrenamiento_insertar" BEFORE INSERT ON "revision_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_revision_de_entrenamiento_insertar"();

-- ─── Cada transición del plan deja su hecho en la misma transacción (08 §17; patrón de WP-03 y WP-04) ─
CREATE FUNCTION "be_transicion_con_hecho_wp06"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_con_hecho boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "version_de_plan_de_entrenamiento" f JOIN "evento_de_entrenamiento" e ON e."recurso_id" = f."id"
     WHERE f."id" = NEW."id" AND e."estado_posterior" = f."estado"::text AND e."xmin" = pg_current_xact_id()::xid) INTO v_con_hecho;
  IF NOT v_con_hecho THEN
    RAISE EXCEPTION 'BE: la transición de % % no registró su hecho en la misma transacción (08 §17)', TG_TABLE_NAME, NEW."id" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "version_de_plan_de_entrenamiento_con_hecho" AFTER INSERT OR UPDATE ON "version_de_plan_de_entrenamiento"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_transicion_con_hecho_wp06"();

-- ─── Catálogo sintético de ejercicios (WP-06, RF-037) ─────────────────────────────────────────────
-- Nombres de demostración con identificadores deterministas, iguales en todos los ambientes, como los catálogos de
-- WP-04 y WP-05. El 06 **no fija ejercicios** (INV-06-143): esto no es una recomendación ni una prescripción, es el
-- mínimo para que un profesional pueda planificar sin wger (RF-037). Las zonas musculares llegan con WP-07.
INSERT INTO "ejercicio_de_catalogo" ("id", "procedencia", "momento_de_registro") VALUES
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e03', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e04', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e05', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e06', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e07', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e08', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e09', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e10', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e11', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e12', 'BE_SYNTHETIC_SEED', '2026-09-21T00:00:00.000Z');

INSERT INTO "version_de_ejercicio" ("id", "ejercicio_id", "nombre", "disponibilidad", "procedencia", "momento_de_registro") VALUES
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01', 'Sentadilla', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', 'Press de banca', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e03', 'Press con mancuernas', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e04', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e04', 'Peso muerto', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e05', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e05', 'Remo con barra', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e06', 'Dominadas', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e07', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e07', 'Press militar', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e08', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e08', 'Zancadas', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e09', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e09', 'Curl de bíceps', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e10', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e10', 'Extensión de tríceps', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e11', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e11', 'Plancha', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z'),
  ('4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e12', '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e12', 'Hip thrust', 'DISPONIBLE', '{"fuente":"catalogo-sintetico-wp06","nota":"Catálogo de demostración: no es una recomendación ni una prescripción (INV-06-143)."}', '2026-09-21T00:00:00.000Z');
