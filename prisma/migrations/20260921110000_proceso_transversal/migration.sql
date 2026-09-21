-- WP-06 · El Proceso operativo deja de estar atado a nutrición.
--
-- El legajo declara el Proceso (B-04) y la capacidad (B-05) transversales: «ActivarVersion reutiliza B-04
-- AbrirProceso» también para entrenamiento (06:5164). WP-04 los construyó con referencias solo a tablas de
-- nutrición y un CHECK literal «proceso_operativo_solo_nutricion». El servicio en TypeScript ya era transversal; lo
-- que ataba era la base.
--
-- Se resuelve con columnas paralelas y claves foráneas reales, no con triggers que reemplacen claves: la base sigue
-- garantizando la integridad referencial por sí sola, y la clave hacia nutrición se conserva intacta.

-- AlterTable
ALTER TABLE "evento_de_proceso" ADD COLUMN     "revision_de_entrenamiento_id" UUID;

-- AlterTable
ALTER TABLE "proceso_operativo" ADD COLUMN     "version_de_apertura_entrenamiento_id" UUID,
ALTER COLUMN "version_de_apertura_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "proxima_revision" ADD COLUMN     "revision_de_entrenamiento_id" UUID,
ADD COLUMN     "version_de_plan_de_entrenamiento_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "proceso_operativo_version_de_apertura_entrenamiento_id_key" ON "proceso_operativo"("version_de_apertura_entrenamiento_id");

-- AddForeignKey
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_version_de_apertura_entrenamiento_id_fkey" FOREIGN KEY ("version_de_apertura_entrenamiento_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_revision_de_entrenamiento_id_fkey" FOREIGN KEY ("revision_de_entrenamiento_id") REFERENCES "revision_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_version_de_plan_de_entrenamiento_id_fkey" FOREIGN KEY ("version_de_plan_de_entrenamiento_id") REFERENCES "version_de_plan_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_revision_de_entrenamiento_id_fkey" FOREIGN KEY ("revision_de_entrenamiento_id") REFERENCES "revision_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- Garantías. Lo que se afloja arriba (NOT NULL de la apertura, el CHECK solo_nutricion) se vuelve a exigir acá,
-- ahora según el alcance del Proceso. Ninguna garantía que nutrición tenía se pierde.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Qué alcances abren Proceso ───────────────────────────────────────────────────────────────────
-- Nutrición y entrenamiento sí; antropometría no, por diseño (06 §8.9, §9.11.2; WP-05 §0 D-B, ratificada).
ALTER TABLE "proceso_operativo" DROP CONSTRAINT "proceso_operativo_solo_nutricion";
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_alcance_con_proceso" CHECK ("alcance" IN ('NUTRICION', 'ENTRENAMIENTO'));

-- La apertura es exactamente la del dominio del Proceso: la columna que corresponde, llena; la otra, vacía. Con esto
-- el NOT NULL que se sacó arriba sigue valiendo para nutrición, y existe también para entrenamiento.
ALTER TABLE "proceso_operativo" ADD CONSTRAINT "proceso_operativo_apertura_segun_alcance" CHECK (
  ("alcance" = 'NUTRICION' AND "version_de_apertura_id" IS NOT NULL AND "version_de_apertura_entrenamiento_id" IS NULL)
  OR ("alcance" = 'ENTRENAMIENTO' AND "version_de_apertura_entrenamiento_id" IS NOT NULL AND "version_de_apertura_id" IS NULL)
);

-- ─── Lista blanca del Proceso (06 §8, 06:3420-3432), ahora por alcance ────────────────────────────
CREATE OR REPLACE FUNCTION "be_proceso_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- AbrirProceso: inicio → ABIERTO, con una versión de apertura ACTIVADA de las mismas partes (REG-06-65).
    IF NEW."estado" <> 'ABIERTO' OR NEW."version" <> 1 THEN
      RAISE EXCEPTION 'BE: un Proceso nace ABIERTO (AbrirProceso)' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."alcance" = 'NUTRICION' AND NOT EXISTS (
         SELECT 1 FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id"
          WHERE v."id" = NEW."version_de_apertura_id" AND v."estado" = 'ACTIVADA'
            AND p."profesional_id" = NEW."profesional_id" AND p."asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: el Proceso se abre con la activación de una versión de las mismas partes (REG-06-65)' USING ERRCODE = 'check_violation';
    END IF;
    -- 06:5164: la activación de un plan de entrenamiento reutiliza AbrirProceso de B-04.
    IF NEW."alcance" = 'ENTRENAMIENTO' AND NOT EXISTS (
         SELECT 1 FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
          WHERE v."id" = NEW."version_de_apertura_entrenamiento_id" AND v."estado" = 'ACTIVADA'
            AND p."profesional_id" = NEW."profesional_id" AND p."asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: el Proceso se abre con la activación de una versión de las mismas partes (REG-06-65, 06:5164)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un Proceso no se elimina: CERRADO conserva evidencia (06:3409)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."profesional_id", NEW."asesorado_id", NEW."alcance", NEW."version_de_apertura_id", NEW."version_de_apertura_entrenamiento_id",
      NEW."procedencia", NEW."momento_de_ocurrencia", NEW."momento_de_registro")
     IS DISTINCT FROM (OLD."id", OLD."profesional_id", OLD."asesorado_id", OLD."alcance", OLD."version_de_apertura_id", OLD."version_de_apertura_entrenamiento_id",
      OLD."procedencia", OLD."momento_de_ocurrencia", OLD."momento_de_registro") THEN
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

-- ─── Revisiones: cada dominio revisa solo sus propios Procesos ────────────────────────────────────
-- Mientras todos los Procesos eran de nutrición, «Proceso ABIERTO» alcanzaba. Ahora que existen Procesos de
-- entrenamiento, sin exigir el alcance una revisión nutricional podría registrarse sobre un Proceso de entrenamiento.
-- Levantar el CHECK solo_nutricion abría ese cruce; esto lo cierra en el mismo acto (RNF-SEC-006, 04:782).
CREATE OR REPLACE FUNCTION "be_revision_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "proceso_operativo" WHERE "id" = NEW."proceso_id" AND "estado" = 'ABIERTO' AND "alcance" = 'NUTRICION') THEN
    RAISE EXCEPTION 'BE: la revisión nutricional se registra sobre un Proceso ABIERTO de nutrición (UC-P13)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

-- ─── Evento de proceso: ContinuidadOCierreAplicado enlaza la revisión de su dominio (REG-06-75) ───
ALTER TABLE "evento_de_proceso" DROP CONSTRAINT "evento_de_proceso_aplicacion_coherente";
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_aplicacion_coherente" CHECK (
  ("tipo" = 'ContinuidadOCierreAplicado') = ("tipo_de_aplicacion" IS NOT NULL AND ("revision_id" IS NOT NULL OR "revision_de_entrenamiento_id" IS NOT NULL))
);
ALTER TABLE "evento_de_proceso" ADD CONSTRAINT "evento_de_proceso_una_revision" CHECK (num_nonnulls("revision_id", "revision_de_entrenamiento_id") <= 1);

-- La revisión que enlaza el evento es de ese mismo Proceso: un evento no puede declarar aplicada una revisión ajena.
CREATE FUNCTION "be_evento_de_proceso_revision_coherente"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."revision_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "revision_nutricional" WHERE "id" = NEW."revision_id" AND "proceso_id" = NEW."proceso_id") THEN
    RAISE EXCEPTION 'BE: el evento enlaza una revisión de su mismo Proceso (REG-06-75)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."revision_de_entrenamiento_id" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM "revision_de_entrenamiento" WHERE "id" = NEW."revision_de_entrenamiento_id" AND "proceso_id" = NEW."proceso_id") THEN
    RAISE EXCEPTION 'BE: el evento enlaza una revisión de su mismo Proceso (REG-06-75)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "evento_de_proceso_revision_coherente" BEFORE INSERT ON "evento_de_proceso" FOR EACH ROW EXECUTE FUNCTION "be_evento_de_proceso_revision_coherente"();

-- ─── Próxima revisión: la fija una versión de plan o una revisión, de un solo dominio (REG-06-145) ─
ALTER TABLE "proxima_revision" DROP CONSTRAINT "proxima_revision_fuente_coherente";
ALTER TABLE "proxima_revision" ADD CONSTRAINT "proxima_revision_fuente_coherente" CHECK (
  ("fuente" = 'VERSION_DE_PLAN'
    AND num_nonnulls("version_de_plan_id", "version_de_plan_de_entrenamiento_id") = 1
    AND "revision_id" IS NULL AND "revision_de_entrenamiento_id" IS NULL)
  OR ("fuente" = 'REVISION'
    AND num_nonnulls("revision_id", "revision_de_entrenamiento_id") = 1
    AND "version_de_plan_id" IS NULL AND "version_de_plan_de_entrenamiento_id" IS NULL)
);

-- ─── Aplicación de la revisión de entrenamiento (REG-06-75, 77) ───────────────────────────────────
CREATE FUNCTION "be_aplicacion_de_entrenamiento_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_resultado "ResultadoDeRevision";
BEGIN
  SELECT "resultado" INTO v_resultado FROM "revision_de_entrenamiento" WHERE "id" = NEW."revision_id";
  -- INV-06-82, 83: solo FINALIZAR cierra el Proceso.
  IF (v_resultado = 'FINALIZAR') <> (NEW."tipo" = 'CIERRE_PROCESO') THEN
    RAISE EXCEPTION 'BE: solo FINALIZAR cierra el Proceso (INV-06-82, 83)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
       SELECT 1 FROM "evento_de_proceso" e
        WHERE e."id" = NEW."evento_id" AND e."tipo" = 'ContinuidadOCierreAplicado' AND e."revision_de_entrenamiento_id" = NEW."revision_id"
          AND e."tipo_de_aplicacion" = NEW."tipo" AND e."estado_posterior" = NEW."estado_de_proceso_posterior") THEN
    RAISE EXCEPTION 'BE: la aplicación enlaza el ContinuidadOCierreAplicado de su revisión (REG-06-75)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "aplicacion_de_revision_de_entrenamiento_insertar" BEFORE INSERT ON "aplicacion_de_revision_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_aplicacion_de_entrenamiento_insertar"();
