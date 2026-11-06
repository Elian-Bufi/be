-- WP-TABLERO-ALTA-GAMA · TB-47 (DEUDA_LEGAJO DL-163 D-21): descartar un borrador de plan que nunca se activó, en
-- Nutrición y en Entrenamiento (API-PLN-07 y API-PLE-05). No cambia ninguna fila ni ninguna columna: suma una transición
-- a las dos guardas de la versión de plan y pasa a parciales cuatro índices únicos de la cadena.
-- El 05 define el borrador como una versión que «no se presenta al asesorado como plan vigente» (glosario, «Borrador de
-- plan»): descartarlo no borra nada que la persona haya visto. Una versión activada no se descarta nunca.
-- Garantías en la base, aunque el código se equivoque:
--   - solo un BORRADOR pasa a DESCARTADA, sin cambiar contenido, objetivo, próxima revisión, origen de plantilla, plan,
--     predecesora, autoría ni origen; la versión avanza de a uno y nunca tuvo activación;
--   - DESCARTADA es terminal: no vuelve a BORRADOR ni se activa;
--   - una ACTIVADA sigue inmutable, y ninguna versión se borra: la historia es por adición (06 §4.4);
--   - el descarte deja su hecho en la misma transacción (los constraint triggers `…_con_hecho` de 20260920100000 y
--     20260921100000 ya lo exigen para todo cambio de estado: un evento con `estado_posterior` DESCARTADA);
--   - lo descartado no ocupa lugar en la cadena (REG-06-12): una sola sucesora y una sola raíz por plan, sin contarlo.
-- Quién y cuándo quedan en el evento (actor y momento) y en la auditoría de la operación; sin columnas nuevas (TA-63).

-- ─── 1. La lista blanca de la versión de plan nutricional (06 §10.7 y DL-163 D-21) ─────────────────────────────────
-- El cuerpo de 20260920100000, completo, con lo nuevo: DESCARTADA es terminal y la transición BORRADOR → DESCARTADA.
CREATE OR REPLACE FUNCTION "be_version_de_plan_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
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
  -- DL-163 D-21: una versión DESCARTADA es terminal; no vuelve a BORRADOR ni se activa.
  IF OLD."estado" = 'DESCARTADA' THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: una versión DESCARTADA es terminal (DL-163 D-21)' USING ERRCODE = 'check_violation';
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
  IF OLD."estado" = 'BORRADOR' AND NEW."estado" = 'DESCARTADA' THEN
    -- DescartarBorrador (DL-163 D-21): se descarta lo que había, sin cambiarlo, y nunca tuvo activación.
    IF (NEW."contenido", NEW."version_de_objetivo_id", NEW."proxima_revision", NEW."origen_de_plantilla")
       IS DISTINCT FROM (OLD."contenido", OLD."version_de_objetivo_id", OLD."proxima_revision", OLD."origen_de_plantilla") THEN
      RAISE EXCEPTION 'BE: descartar no cambia el borrador: se descarta lo que había (DL-163 D-21)' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."momento_de_activacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una versión descartada nunca se activó (DL-163 D-21)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en versión de plan % -> % (06 §10.7)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;

-- ─── 2. La lista blanca de la versión de plan de entrenamiento (06:5157-5159 y DL-163 D-21) ─────────────────────────
-- El cuerpo de 20260921100000, completo, con lo mismo nuevo.
CREATE OR REPLACE FUNCTION "be_version_de_plan_de_entrenamiento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
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
  -- DL-163 D-21: una versión DESCARTADA es terminal; no vuelve a BORRADOR ni se activa.
  IF OLD."estado" = 'DESCARTADA' THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA: una versión DESCARTADA es terminal (DL-163 D-21)' USING ERRCODE = 'check_violation';
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
  IF OLD."estado" = 'BORRADOR' AND NEW."estado" = 'DESCARTADA' THEN
    -- DescartarBorrador (DL-163 D-21): se descarta lo que había, sin cambiarlo, y nunca tuvo activación.
    IF (NEW."contenido", NEW."version_de_objetivo_id", NEW."proxima_revision", NEW."origen_de_plantilla")
       IS DISTINCT FROM (OLD."contenido", OLD."version_de_objetivo_id", OLD."proxima_revision", OLD."origen_de_plantilla") THEN
      RAISE EXCEPTION 'BE: descartar no cambia el borrador: se descarta lo que había (DL-163 D-21)' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."momento_de_activacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: una versión descartada nunca se activó (DL-163 D-21)' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en versión de plan de entrenamiento % -> % (06:5157-5159)', OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
END $$;

-- ─── 3. La cadena, sin lo descartado (REG-06-12; TA-67) ───────────────────────────────────────────────────────────
-- Un borrador descartado no ocupa el lugar de raíz ni el de sucesora: después de descartarlo, el borrador nuevo vuelve a
-- ser la raíz del plan (si nunca se activó) o la sucesora de la vigente, como exige `be_plan_guardar` al activar. Los
-- índices únicos completos pasan a parciales. Prisma no modela índices parciales (como `…_una_raiz` y `…_un_borrador`):
-- schema.prisma deja de declarar `@unique` en `predecesoraId` y la relación pasa a uno a muchos.
DROP INDEX "version_de_plan_nutricional_predecesora_id_key";
CREATE UNIQUE INDEX "version_de_plan_nutricional_una_sucesora" ON "version_de_plan_nutricional" ("predecesora_id") WHERE "estado" <> 'DESCARTADA';
DROP INDEX "version_de_plan_nutricional_una_raiz";
CREATE UNIQUE INDEX "version_de_plan_nutricional_una_raiz" ON "version_de_plan_nutricional" ("plan_id") WHERE "predecesora_id" IS NULL AND "estado" <> 'DESCARTADA';

DROP INDEX "version_de_plan_de_entrenamiento_predecesora_id_key";
CREATE UNIQUE INDEX "version_de_plan_de_entrenamiento_una_sucesora" ON "version_de_plan_de_entrenamiento" ("predecesora_id") WHERE "estado" <> 'DESCARTADA';
DROP INDEX "version_de_plan_de_entrenamiento_una_raiz";
CREATE UNIQUE INDEX "version_de_plan_de_entrenamiento_una_raiz" ON "version_de_plan_de_entrenamiento" ("plan_id") WHERE "predecesora_id" IS NULL AND "estado" <> 'DESCARTADA';
