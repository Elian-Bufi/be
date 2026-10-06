-- WP-ENTRENAMIENTO-SERIES (docs/paquetes/WP-ENTRENAMIENTO-SERIES.md §9.2): la imagen del ejercicio (DL-123) y los tiempos
-- de la sesión (DL-124). Migración aditiva: nada de lo anterior se reescribe. El plan no cambia de tablas: los objetivos
-- por serie (DL-122) viajan en su JSON, y un plan sin ellos queda igual.
-- 1. Tablas, enums, índices y claves foráneas generados desde prisma/schema.prisma con `prisma migrate diff`. La finalidad
--    REFERENCIA_DE_EJERCICIO entró en la migración anterior, que es propia (20261006100000).
-- 2. Garantías en la base, aunque el código se equivoque: la imagen de un ejercicio declara su autoría; cada cambio de
--    imagen sigue al anterior, sobre un ejercicio propio y con un medio propio; los eventos de tiempo son del titular del
--    borrador, en una sola corrida y sin huecos; una sola sesión en curso por titular; solo agregar y sin TRUNCATE.

-- CreateEnum
CREATE TYPE "CambioDeImagenDeEjercicio" AS ENUM ('ASOCIAR', 'RETIRAR');

-- CreateEnum
CREATE TYPE "RevisionTecnicaDeImagen" AS ENUM ('PENDIENTE_DE_REVISION_PROFESIONAL', 'REVISADA_POR_PROFESIONAL');

-- CreateEnum
CREATE TYPE "TipoDeEventoDeTiempo" AS ENUM ('SESION_INICIADA', 'SESION_PAUSADA', 'SESION_REANUDADA', 'SESION_FINALIZADA', 'EJERCICIO_ACTIVADO', 'DESCANSO_INICIADO', 'DESCANSO_FINALIZADO', 'SERIE_CRONOMETRADA_INICIADA', 'SERIE_CRONOMETRADA_FINALIZADA', 'MEDICION_DEJADA_INCOMPLETA');

-- CreateEnum
CREATE TYPE "OrigenDelInstante" AS ENUM ('MONOTONICO', 'RELOJ_CIVIL_RECUPERADO', 'DECLARADO');

-- CreateTable
CREATE TABLE "asociacion_de_imagen_de_ejercicio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejercicio_id" UUID NOT NULL,
    "version_de_ejercicio_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "cambio" "CambioDeImagenDeEjercicio" NOT NULL,
    "medio_id" UUID,
    "texto_alternativo" TEXT,
    "licencia" JSONB,
    "revision_tecnica" "RevisionTecnicaDeImagen",
    "autor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asociacion_de_imagen_de_ejercicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_de_tiempo_de_entrenamiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "borrador_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "corrida_id" TEXT NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "evento_id" TEXT NOT NULL,
    "tipo" "TipoDeEventoDeTiempo" NOT NULL,
    "contenido" JSONB NOT NULL,
    "instante_civil" TIMESTAMPTZ(3) NOT NULL,
    "ancla_monotonica" TEXT,
    "ms_monotonicos" DOUBLE PRECISION,
    "origen_del_instante" "OrigenDelInstante" NOT NULL,
    "descanso_recomendado_segundos" INTEGER,
    "procedencia" JSONB NOT NULL,
    "momento_de_recepcion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_de_tiempo_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asociacion_de_imagen_de_ejercicio_medio_id_idx" ON "asociacion_de_imagen_de_ejercicio"("medio_id");

-- CreateIndex
CREATE INDEX "asociacion_de_imagen_de_ejercicio_version_de_ejercicio_id_idx" ON "asociacion_de_imagen_de_ejercicio"("version_de_ejercicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "asociacion_de_imagen_de_ejercicio_ejercicio_id_numero_key" ON "asociacion_de_imagen_de_ejercicio"("ejercicio_id", "numero");

-- CreateIndex
CREATE INDEX "evento_de_tiempo_de_entrenamiento_asesorado_id_tipo_idx" ON "evento_de_tiempo_de_entrenamiento"("asesorado_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_tiempo_de_entrenamiento_borrador_id_secuencia_key" ON "evento_de_tiempo_de_entrenamiento"("borrador_id", "secuencia");

-- CreateIndex
CREATE UNIQUE INDEX "evento_de_tiempo_de_entrenamiento_borrador_id_evento_id_key" ON "evento_de_tiempo_de_entrenamiento"("borrador_id", "evento_id");

-- AddForeignKey
ALTER TABLE "asociacion_de_imagen_de_ejercicio" ADD CONSTRAINT "asociacion_de_imagen_de_ejercicio_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asociacion_de_imagen_de_ejercicio" ADD CONSTRAINT "asociacion_de_imagen_de_ejercicio_version_de_ejercicio_id_fkey" FOREIGN KEY ("version_de_ejercicio_id") REFERENCES "version_de_ejercicio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "asociacion_de_imagen_de_ejercicio" ADD CONSTRAINT "asociacion_de_imagen_de_ejercicio_medio_id_fkey" FOREIGN KEY ("medio_id") REFERENCES "medio"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "evento_de_tiempo_de_entrenamiento" ADD CONSTRAINT "evento_de_tiempo_de_entrenamiento_borrador_id_fkey" FOREIGN KEY ("borrador_id") REFERENCES "borrador_de_ejecucion_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Medio: la imagen de un ejercicio declara su autoría (REG-06-134; DL-123) ─────────────────────────────────────
-- Las reglas de las otras dos finalidades (medio_estado_coherente, be_medio_guardar) no cambian: la nueva no las toca.
ALTER TABLE "medio" ADD CONSTRAINT "medio_de_ejercicio_con_autoria" CHECK (
  "finalidad" <> 'REFERENCIA_DE_EJERCICIO' OR ("autoria" IS NOT NULL AND btrim("autoria") <> '')
);

-- ─── Imagen de un ejercicio: cada cambio sigue al anterior, sobre un ejercicio propio y con un medio propio (DL-123) ──
-- Asociar lleva el medio, el texto alternativo, la licencia y la revisión técnica; retirar, nada de eso. La licencia es
-- obligatoria y tiene una de sus dos formas (REG-06-134): nunca un valor por defecto.
ALTER TABLE "asociacion_de_imagen_de_ejercicio" ADD CONSTRAINT "asociacion_de_imagen_de_ejercicio_coherente" CHECK (
  "numero" >= 1
  AND (("cambio" = 'ASOCIAR') = ("medio_id" IS NOT NULL))
  AND (("cambio" = 'ASOCIAR') = ("texto_alternativo" IS NOT NULL))
  AND (("cambio" = 'ASOCIAR') = ("licencia" IS NOT NULL))
  AND (("cambio" = 'ASOCIAR') = ("revision_tecnica" IS NOT NULL))
  AND ("texto_alternativo" IS NULL OR btrim("texto_alternativo") <> '')
  AND ("licencia" IS NULL OR (jsonb_typeof("licencia") = 'object' AND "licencia" ->> 'kind' IN ('NO_EXTERNAL_LICENSE', 'EXTERNAL')))
);
CREATE FUNCTION "be_asociacion_de_imagen_de_ejercicio_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."numero" <> COALESCE((SELECT max("numero") FROM "asociacion_de_imagen_de_ejercicio" WHERE "ejercicio_id" = NEW."ejercicio_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: cada cambio de la imagen de un ejercicio sigue al anterior (DL-123)' USING ERRCODE = 'check_violation';
  END IF;
  -- REG-06-135: solo lo cargado a mano por quien asocia, en una versión de ese ejercicio. El catálogo sembrado no recibe
  -- imágenes de profesionales, y la asociación es por identidad, nunca por nombre.
  IF NOT EXISTS (
       SELECT 1 FROM "ejercicio_de_catalogo" e JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id"
        WHERE e."id" = NEW."ejercicio_id" AND v."id" = NEW."version_de_ejercicio_id"
          AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: la imagen va en una versión de un ejercicio cargado a mano por quien la asocia (REG-06-135)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."cambio" = 'ASOCIAR' AND NOT EXISTS (
       SELECT 1 FROM "medio" m
        WHERE m."id" = NEW."medio_id" AND m."finalidad" = 'REFERENCIA_DE_EJERCICIO' AND m."estado" = 'DISPONIBLE' AND m."propietario_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: la imagen de un ejercicio es un medio DISPONIBLE de quien la asocia, de finalidad REFERENCIA_DE_EJERCICIO (DL-123)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "asociacion_de_imagen_de_ejercicio_insertar" BEFORE INSERT ON "asociacion_de_imagen_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_asociacion_de_imagen_de_ejercicio_insertar"();

-- ─── Eventos de tiempo: del titular del borrador, una corrida, secuencia sin huecos y nada después del fin (DL-124) ──
-- El contenido es el evento validado, con la misma identidad que sus columnas. La corrida empieza con su inicio: el
-- primero es SESION_INICIADA, y solo el primero. Un instante monotónico lleva su ancla; uno civil o declarado, no. El
-- recomendado histórico es del inicio de un descanso.
ALTER TABLE "evento_de_tiempo_de_entrenamiento" ADD CONSTRAINT "evento_de_tiempo_coherente" CHECK (
  "secuencia" >= 1
  AND (("tipo" = 'SESION_INICIADA') = ("secuencia" = 1))
  AND (("origen_del_instante" = 'MONOTONICO') = ("ancla_monotonica" IS NOT NULL))
  AND (("ancla_monotonica" IS NULL) = ("ms_monotonicos" IS NULL))
  AND ("ms_monotonicos" IS NULL OR "ms_monotonicos" >= 0)
  AND ("descanso_recomendado_segundos" IS NULL OR ("tipo" = 'DESCANSO_INICIADO' AND "descanso_recomendado_segundos" >= 0))
  AND jsonb_typeof("contenido") = 'object'
  AND "contenido" ->> 'eventId' = "evento_id"
  AND "contenido" ->> 'runId' = "corrida_id"
  AND "contenido" ->> 'sequence' = "secuencia"::text
);
CREATE FUNCTION "be_evento_de_tiempo_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "borrador_de_ejecucion_de_entrenamiento" WHERE "id" = NEW."borrador_id" AND "asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: los tiempos de una sesión son del titular de su borrador (DL-124)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."secuencia" <> COALESCE((SELECT max("secuencia") FROM "evento_de_tiempo_de_entrenamiento" WHERE "borrador_id" = NEW."borrador_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: la secuencia de los eventos de tiempo no tiene huecos (DL-124)' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM "evento_de_tiempo_de_entrenamiento" WHERE "borrador_id" = NEW."borrador_id" AND ("corrida_id" <> NEW."corrida_id" OR "tipo" = 'SESION_FINALIZADA')) THEN
    RAISE EXCEPTION 'BE: un borrador tiene una sola corrida, y después de su fin no se registra nada (DL-124)' USING ERRCODE = 'check_violation';
  END IF;
  -- Una sola sesión en curso por titular: la ocupa otro borrador suyo sin ejecución registrada, empezado y sin terminar.
  -- El servicio lo decide bajo un cerrojo por titular; la base lo sostiene aunque el código se equivoque.
  IF NEW."tipo" = 'SESION_INICIADA' AND EXISTS (
       SELECT 1 FROM "evento_de_tiempo_de_entrenamiento" i
        WHERE i."asesorado_id" = NEW."asesorado_id" AND i."tipo" = 'SESION_INICIADA' AND i."borrador_id" <> NEW."borrador_id"
          AND NOT EXISTS (SELECT 1 FROM "evento_de_tiempo_de_entrenamiento" f WHERE f."borrador_id" = i."borrador_id" AND f."tipo" = 'SESION_FINALIZADA')
          AND NOT EXISTS (SELECT 1 FROM "ejecucion_de_entrenamiento" x WHERE x."borrador_id" = i."borrador_id")) THEN
    RAISE EXCEPTION 'BE: el titular ya tiene otra sesión en curso (DL-124)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "evento_de_tiempo_de_entrenamiento_insertar" BEFORE INSERT ON "evento_de_tiempo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_evento_de_tiempo_insertar"();

-- ─── Historia por adición: append-only y sin TRUNCATE ─────────────────────────────────────────────────────────────
CREATE TRIGGER "asociacion_de_imagen_de_ejercicio_solo_agregar" BEFORE UPDATE OR DELETE ON "asociacion_de_imagen_de_ejercicio" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_tiempo_de_entrenamiento_solo_agregar" BEFORE UPDATE OR DELETE ON "evento_de_tiempo_de_entrenamiento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();

CREATE TRIGGER "asociacion_de_imagen_de_ejercicio_sin_truncate" BEFORE TRUNCATE ON "asociacion_de_imagen_de_ejercicio" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "evento_de_tiempo_de_entrenamiento_sin_truncate" BEFORE TRUNCATE ON "evento_de_tiempo_de_entrenamiento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
