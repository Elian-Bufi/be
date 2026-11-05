-- WP-FORMULARIOS-RONDA-2 · FR-10 (DEUDA_LEGAJO DL-165 D-9, ratificada por Dirección el 2026-11-05): la sección común de
-- hábitos. Migración aditiva: dos enumeraciones y tres tablas nuevas, y la versión de texto del acto; no cambia nada que
-- ya exista.
-- - `habitos_de_la_persona`: los hábitos de la persona, que son de ella y no de un área. Cada versión guarda las respuestas
--   de la parte «Tus hábitos» en el formato V2, siempre declaradas por ella, y la vigente es la última (D-16).
-- - `autorizacion_de_habitos`: «Compartir mis hábitos con mis profesionales», un acto de la persona distinto de A3 y de B2
--   (no autoriza un Alcance: una categoría hacia una lista explícita, 08 C-11 y C-12). Cada cambio es una fila nueva que
--   sucede a la anterior; la ACTIVA guarda el texto aceptado y su hash (08 §12.2).
-- - `destinatario_de_habitos`: la lista explícita de cada versión ACTIVA, por profesional y por componente de vínculo sin
--   terminar: si los recibe (y desde cuándo) o si la persona dijo que no. Un componente que no está (un profesional que la
--   acompaña después, o que vuelve con otro vínculo) no los recibe (D-17).
-- Quién los ve lo decide la API con el PDP (API-HBT-05): la autorización tiene que estar ACTIVA y nombrar al profesional
-- con un componente que el PDP permite hoy (aceptado, ni en pausa ni terminado, con su B2 y el A3 de la persona).
-- Garantías en la base, aunque el código se equivoque:
--   - las tres tablas solo se agregan, también frente a TRUNCATE (08 §29);
--   - las versiones de una persona van de a una, sin huecos ni bifurcaciones (los hábitos y la autorización);
--   - una versión de hábitos que viene de un formulario nombra una Respuesta de la misma persona, y una de «Mis hábitos»
--     no nombra ninguna;
--   - la autorización la da y la retira la persona; la ACTIVA acepta una versión del texto de su tipo, con su hash, y la
--     RETIRADA no acepta ninguna;
--   - un renglón de la lista es de una versión ACTIVA y nombra un componente de vínculo del profesional con esa persona.
-- Datos sintéticos en `test`. Con personas reales, después de la revisión legal (VJR-1, VJR-4 y VJR-5 del 08) y del gate
-- del 08 §42: el texto es una propuesta pendiente de validación jurídica.

-- 1. La versión de texto del acto, generada desde @be/domain (`node scripts/generar-sql-catalogo-de-textos.cjs --ids
--    habitos-compartidos-2026-11-propuesta`). La aprobada entra como sucesora, con otro id, y no hereda aceptaciones
--    (09 §31.2.6).
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('habitos-compartidos-2026-11-propuesta', 'HABITOS_COMPARTIDOS', $be_texto$Compartir mis hábitos con mis profesionales$be_texto$, 'COMPARTIR_HABITOS_CON_PROFESIONALES', $be_texto$Compartir mis hábitos con mis profesionales — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es sobre una sola categoría de datos: tus hábitos. Son las respuestas de la parte «Tus hábitos»: a qué hora te levantás y te acostás, cuántas horas dormís, cómo es tu día en movimiento, el ejercicio o el deporte de tu semana y cómo viene tu semana en estrés. No incluye tu salud (medicación, condiciones o embarazo) ni el resto de tus formularios.

Qué cambia: sin esta autorización, cada profesional ve solo lo que le respondiste a él, en su formulario. Con ella, los profesionales que elijas ven tus hábitos vigentes, aunque se los hayas contado a otro profesional o en «Mis hábitos». Ven la versión vigente, con su fecha y como declarada por vos. No ven de qué formulario salió ni tus versiones anteriores.

Quiénes los ven: solo los profesionales que elijas en la lista, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlos. Un profesional que empiece a acompañarte después no los ve: BE te pregunta antes, y si no respondés, no los ve.

Cada vez que un profesional los abre, queda registrado.

Podés cambiar la lista o retirar esta autorización cuando quieras, desde «Mis hábitos». Al retirarla, ninguno de tus profesionales los ve desde ese momento. No se borra nada: tus hábitos siguen en tu app, y lo que cada profesional tiene de su propio formulario sigue siendo suyo. Retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '039e752d5c17f469f640068f246cba10190c5a563ad9b546a05269996b5326ee', '2026-11-05T00:00:00.000Z');

-- 2. Las enumeraciones, las tablas, los índices y las claves foráneas, generados desde prisma/schema.prisma con
--    `prisma migrate diff`.
-- CreateEnum
CREATE TYPE "OrigenDeHabitos" AS ENUM ('FORMULARIO', 'MIS_HABITOS');

-- CreateEnum
CREATE TYPE "EstadoDeAutorizacionDeHabitos" AS ENUM ('ACTIVA', 'RETIRADA');

-- CreateTable
CREATE TABLE "habitos_de_la_persona" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "contenido" JSONB NOT NULL,
    "origen" "OrigenDeHabitos" NOT NULL,
    "respuesta_de_formulario_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habitos_de_la_persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autorizacion_de_habitos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "predecesora_id" UUID,
    "estado" "EstadoDeAutorizacionDeHabitos" NOT NULL,
    "version_de_texto_id" TEXT,
    "hash_del_texto" TEXT,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizacion_de_habitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinatario_de_habitos" (
    "autorizacion_id" UUID NOT NULL,
    "alcance_de_vinculo_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "incluido" BOOLEAN NOT NULL,
    "incluido_desde" TIMESTAMPTZ(3),
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinatario_de_habitos_pkey" PRIMARY KEY ("autorizacion_id","alcance_de_vinculo_id")
);

-- CreateIndex
CREATE INDEX "habitos_de_la_persona_respuesta_de_formulario_id_idx" ON "habitos_de_la_persona"("respuesta_de_formulario_id");

-- CreateIndex
CREATE UNIQUE INDEX "habitos_de_la_persona_asesorado_id_version_key" ON "habitos_de_la_persona"("asesorado_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_habitos_predecesora_id_key" ON "autorizacion_de_habitos"("predecesora_id");

-- CreateIndex
CREATE INDEX "autorizacion_de_habitos_version_de_texto_id_idx" ON "autorizacion_de_habitos"("version_de_texto_id");

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_habitos_asesorado_id_version_key" ON "autorizacion_de_habitos"("asesorado_id", "version");

-- CreateIndex
CREATE INDEX "destinatario_de_habitos_profesional_id_idx" ON "destinatario_de_habitos"("profesional_id");

-- CreateIndex
CREATE INDEX "destinatario_de_habitos_alcance_de_vinculo_id_idx" ON "destinatario_de_habitos"("alcance_de_vinculo_id");

-- AddForeignKey
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_respuesta_de_formulario_id_fkey" FOREIGN KEY ("respuesta_de_formulario_id") REFERENCES "respuesta_de_formulario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "autorizacion_de_habitos"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_version_de_texto_id_fkey" FOREIGN KEY ("version_de_texto_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_habitos" ADD CONSTRAINT "destinatario_de_habitos_autorizacion_id_fkey" FOREIGN KEY ("autorizacion_id") REFERENCES "autorizacion_de_habitos"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_habitos" ADD CONSTRAINT "destinatario_de_habitos_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_habitos" ADD CONSTRAINT "destinatario_de_habitos_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── 3. Las tres tablas solo se agregan (08 §29) ────────────────────────────────────────────────────────────────────
CREATE TRIGGER "habitos_de_la_persona_solo_agregar" BEFORE UPDATE OR DELETE ON "habitos_de_la_persona" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "habitos_de_la_persona_sin_truncate" BEFORE TRUNCATE ON "habitos_de_la_persona" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "autorizacion_de_habitos_solo_agregar" BEFORE UPDATE OR DELETE ON "autorizacion_de_habitos" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "autorizacion_de_habitos_sin_truncate" BEFORE TRUNCATE ON "autorizacion_de_habitos" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_habitos_solo_agregar" BEFORE UPDATE OR DELETE ON "destinatario_de_habitos" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_habitos_sin_truncate" BEFORE TRUNCATE ON "destinatario_de_habitos" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── 4. La forma de cada fila ───────────────────────────────────────────────────────────────────────────────────────
-- Un CHECK que da NULL pasa: por eso cada comparación sobre el JSON lleva su COALESCE (como 20261104120200).
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_origen_y_respuesta" CHECK (("origen" = 'FORMULARIO') = ("respuesta_de_formulario_id" IS NOT NULL));
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_contenido_v2" CHECK (
  COALESCE(jsonb_typeof("contenido") = 'object' AND "contenido" ->> 'format' = '2' AND jsonb_typeof("contenido" -> 'answers') = 'array', FALSE));
ALTER TABLE "habitos_de_la_persona" ADD CONSTRAINT "habitos_de_la_persona_procedencia_es_objeto" CHECK (COALESCE(jsonb_typeof("procedencia") = 'object', FALSE));

ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_primera_sin_predecesora" CHECK (("version" = 1) = ("predecesora_id" IS NULL));
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_texto_solo_al_darla" CHECK (
  ("estado" = 'ACTIVA') = ("version_de_texto_id" IS NOT NULL) AND ("estado" = 'ACTIVA') = ("hash_del_texto" IS NOT NULL));
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_la_da_la_persona" CHECK ("actor_id" = "asesorado_id");
ALTER TABLE "autorizacion_de_habitos" ADD CONSTRAINT "autorizacion_de_habitos_procedencia_es_objeto" CHECK (COALESCE(jsonb_typeof("procedencia") = 'object', FALSE));

ALTER TABLE "destinatario_de_habitos" ADD CONSTRAINT "destinatario_de_habitos_desde_si_los_recibe" CHECK ("incluido" = ("incluido_desde" IS NOT NULL));

-- ─── 5. Cada versión sucede a la anterior de la misma persona, y cada renglón es de su lista ────────────────────────
-- Los hábitos: la versión que sigue (1 si es la primera) y, si viene de un formulario, una Respuesta de la misma persona.
-- Dos inserciones simultáneas con el mismo número: el índice único deja pasar una (la API las ordena con un cerrojo).
CREATE FUNCTION "be_habitos_de_la_persona_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."version" <> COALESCE((SELECT MAX("version") FROM "habitos_de_la_persona" WHERE "asesorado_id" = NEW."asesorado_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: una versión de los hábitos sigue a la última de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."respuesta_de_formulario_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "respuesta_de_formulario" WHERE "id" = NEW."respuesta_de_formulario_id" AND "asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: los hábitos de un formulario salen de una Respuesta de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "habitos_de_la_persona_guardar" BEFORE INSERT ON "habitos_de_la_persona" FOR EACH ROW EXECUTE FUNCTION "be_habitos_de_la_persona_guardar"();

-- La autorización: sucede a la última versión de la misma persona (sin bifurcar la cadena) y, si queda ACTIVA, acepta una
-- versión de texto de su tipo con el hash de esa versión (08 §12.2: la mostrada es la aceptada).
CREATE FUNCTION "be_autorizacion_de_habitos_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."predecesora_id" IS NULL THEN
    IF EXISTS (SELECT 1 FROM "autorizacion_de_habitos" WHERE "asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: la autorización de hábitos de esta persona ya tiene una primera versión' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM "autorizacion_de_habitos"
     WHERE "id" = NEW."predecesora_id" AND "asesorado_id" = NEW."asesorado_id" AND "version" = NEW."version" - 1
       AND "version" = (SELECT MAX("version") FROM "autorizacion_de_habitos" WHERE "asesorado_id" = NEW."asesorado_id")) THEN
    RAISE EXCEPTION 'BE: una versión de la autorización de hábitos sucede a la última de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."estado" = 'ACTIVA' AND NOT EXISTS (
    SELECT 1 FROM "version_de_texto" WHERE "id" = NEW."version_de_texto_id" AND "tipo" = 'HABITOS_COMPARTIDOS' AND "hash" = NEW."hash_del_texto") THEN
    RAISE EXCEPTION 'BE: la autorización de hábitos acepta una versión de su texto, con su hash (08 §12.2)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "autorizacion_de_habitos_guardar" BEFORE INSERT ON "autorizacion_de_habitos" FOR EACH ROW EXECUTE FUNCTION "be_autorizacion_de_habitos_guardar"();

-- Un renglón de la lista: de una versión ACTIVA, y por un componente de vínculo entre ese profesional y esa persona.
CREATE FUNCTION "be_destinatario_de_habitos_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "autorizacion_de_habitos" a
      JOIN "vinculo" vi ON vi."asesorado_id" = a."asesorado_id" AND vi."profesional_id" = NEW."profesional_id"
      JOIN "alcance_de_vinculo" av ON av."vinculo_id" = vi."id" AND av."id" = NEW."alcance_de_vinculo_id"
     WHERE a."id" = NEW."autorizacion_id" AND a."estado" = 'ACTIVA') THEN
    RAISE EXCEPTION 'BE: un renglón de la lista es de una autorización activa y de un vínculo del profesional con esa persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "destinatario_de_habitos_guardar" BEFORE INSERT ON "destinatario_de_habitos" FOR EACH ROW EXECUTE FUNCTION "be_destinatario_de_habitos_guardar"();
