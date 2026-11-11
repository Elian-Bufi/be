-- WP-TABLERO-ALTA-GAMA · TB-52 a TB-56 (DEUDA_LEGAJO DL-163 D-13, ampliada por Dirección el 2026-11-07): lo que la persona
-- comparte de otras áreas, el plan del otro y el pedido. Migración aditiva: tres enumeraciones y tres tablas nuevas, la
-- versión de texto del acto, un CHECK en las novedades y un índice parcial en las decisiones; y una regla ampliada de lo
-- citado en una nota de coordinación (TB-53, CRD-D5), que reemplaza su función sin tocar ninguna fila.
-- - `autorizacion_de_resumenes`: «Compartir con mis profesionales lo de otras áreas», un acto de la persona distinto de A3,
--   de B2 y de la autorización de los hábitos (08 C-11 y C-12). Versionada como esa: cada cambio es una fila nueva que
--   sucede a la anterior; la ACTIVA guarda el texto aceptado y su hash (08 §12.2).
-- - `destinatario_de_resumenes`: los permisos de cada versión ACTIVA, por el componente de vínculo de quien recibe y el de
--   quien lleva el área de origen, con el nivel (RESUMEN o RESUMEN_Y_PLAN, TA-85) y desde cuándo rige ese nivel (TA-96).
-- - `pedido_de_acceso_a_plan`: un profesional le pide a la persona ver su plan de otra área (TB-56; TA-95). No cambia
--   ningún acceso: lo decide ella. Un pedido nuevo, a los 7 días del último, reemplaza al pendiente (como DL-165 D-24).
-- Quién ve qué lo decide la API con el PDP (API-RES-06): el par con el vínculo aceptado, el B2, las cuentas y el A3; la
-- autorización vigente que lo nombra con ese nivel; y la fila de la matriz (TA-87).
-- Garantías en la base, aunque el código se equivoque:
--   - la autorización y sus renglones solo se agregan, también frente a TRUNCATE; el pedido solo se resuelve, una vez, y no
--     se borra (08 §29);
--   - las versiones de una persona van de a una, sin huecos ni bifurcaciones, y la ACTIVA acepta un texto de su tipo;
--   - un renglón es de una versión ACTIVA, por un vínculo de quien recibe con esa persona, desde el componente de otro
--     profesional en esa área, a quien no la lleva; Antropometría no tiene plan;
--   - un pedido pendiente por profesional, persona y área; de otra área, con plan; la novedad del pedido lo nombra;
--   - una nota cita el plan de otra área solo si la persona se lo comparte al autor con el plan (TB-53).
-- Datos sintéticos en `test`. Con personas reales, después de la revisión legal (VJR-1, VJR-4 y VJR-5 del 08, y las dos
-- preguntas de WP-TABLERO-ALTA-GAMA §9) y del gate del 08 §42: el texto es una propuesta pendiente de validación jurídica.

-- 1. La versión de texto del acto, generada desde @be/domain (`node scripts/generar-sql-catalogo-de-textos.cjs --ids
--    resumenes-compartidos-2026-11-propuesta`). La aprobada entra como sucesora, con otro id, y no hereda aceptaciones
--    (09 §31.2.6).
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('resumenes-compartidos-2026-11-propuesta', 'RESUMENES_COMPARTIDOS', $be_texto$Compartir con mis profesionales lo de otras áreas$be_texto$, 'COMPARTIR_OTRAS_AREAS_CON_PROFESIONALES', $be_texto$Compartir con mis profesionales lo de otras áreas — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea lo de otra área tuya, la que lleva otro profesional. La das por profesional y por área, en uno de dos niveles:
- Resumen: lo de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.
- Resumen y plan: además, tu plan vigente de esa área, completo y de solo lectura, como lo ves vos en tu app, con su objetivo, quién lo armó, desde cuándo rige, la fecha de la próxima revisión y cuánto registraste cada semana desde que rige. No incluye los borradores, las versiones anteriores, lo que se habló en una revisión, las notas internas ni las evaluaciones. Antropometría no tiene plan: de esa área, solo el resumen.

Quiénes lo ven: solo los profesionales que elijas, en el nivel que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Quien ve tu plan no lo puede cambiar. Le puede dejar una nota a quien lleva esa área, y esa nota también la ves vos.

Un profesional te puede pedir ver tu plan de otra área. Pedirlo no le da acceso: lo decidís vos, y podés decir que no.

Cada vez que un profesional abre tu plan de otra área, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Para sumar a alguien o pasar de «Resumen» a «Resumen y plan», aceptás este texto otra vez. Podés bajar de nivel, sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '774d3a27ed2391eda7a10fc74ce1b7aa8fa3fb1939e6ef6feb1d50522e9664d3', '2026-11-07T00:00:00.000Z');

-- 2. Las enumeraciones, las tablas, los índices y las claves foráneas, como los da `prisma migrate diff` desde
--    prisma/schema.prisma (los valores de enum, en la migración 20261107120000).
-- CreateEnum
CREATE TYPE "EstadoDeAutorizacionDeResumenes" AS ENUM ('ACTIVA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "NivelDeResumenCompartido" AS ENUM ('RESUMEN', 'RESUMEN_Y_PLAN');

-- CreateEnum
CREATE TYPE "EstadoDePedidoDeAccesoAPlan" AS ENUM ('PENDIENTE', 'ACEPTADO', 'NO_POR_AHORA', 'REEMPLAZADO');

-- CreateTable
CREATE TABLE "autorizacion_de_resumenes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asesorado_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "predecesora_id" UUID,
    "estado" "EstadoDeAutorizacionDeResumenes" NOT NULL,
    "version_de_texto_id" TEXT,
    "hash_del_texto" TEXT,
    "actor_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_ocurrencia" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autorizacion_de_resumenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinatario_de_resumenes" (
    "autorizacion_id" UUID NOT NULL,
    "alcance_de_vinculo_id" UUID NOT NULL,
    "origen_id" UUID NOT NULL,
    "profesional_id" UUID NOT NULL,
    "area" "Alcance" NOT NULL,
    "nivel" "NivelDeResumenCompartido" NOT NULL,
    "nivel_desde" TIMESTAMPTZ(3) NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinatario_de_resumenes_pkey" PRIMARY KEY ("autorizacion_id","alcance_de_vinculo_id","origen_id")
);

-- CreateTable
CREATE TABLE "pedido_de_acceso_a_plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profesional_id" UUID NOT NULL,
    "asesorado_id" UUID NOT NULL,
    "alcance_de_vinculo_id" UUID NOT NULL,
    "alcance" "Alcance" NOT NULL,
    "area" "Alcance" NOT NULL,
    "estado" "EstadoDePedidoDeAccesoAPlan" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "pedido_en" TIMESTAMPTZ(3) NOT NULL,
    "resuelto_en" TIMESTAMPTZ(3),
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_de_acceso_a_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_resumenes_predecesora_id_key" ON "autorizacion_de_resumenes"("predecesora_id");

-- CreateIndex
CREATE INDEX "autorizacion_de_resumenes_version_de_texto_id_idx" ON "autorizacion_de_resumenes"("version_de_texto_id");

-- CreateIndex
CREATE UNIQUE INDEX "autorizacion_de_resumenes_asesorado_id_version_key" ON "autorizacion_de_resumenes"("asesorado_id", "version");

-- CreateIndex
CREATE INDEX "destinatario_de_resumenes_profesional_id_idx" ON "destinatario_de_resumenes"("profesional_id");

-- CreateIndex
CREATE INDEX "destinatario_de_resumenes_alcance_de_vinculo_id_idx" ON "destinatario_de_resumenes"("alcance_de_vinculo_id");

-- CreateIndex
CREATE INDEX "destinatario_de_resumenes_origen_id_idx" ON "destinatario_de_resumenes"("origen_id");

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_plan_asesorado_id_estado_idx" ON "pedido_de_acceso_a_plan"("asesorado_id", "estado");

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_plan_profesional_id_asesorado_id_area_idx" ON "pedido_de_acceso_a_plan"("profesional_id", "asesorado_id", "area");

-- CreateIndex
CREATE INDEX "pedido_de_acceso_a_plan_alcance_de_vinculo_id_idx" ON "pedido_de_acceso_a_plan"("alcance_de_vinculo_id");

-- AddForeignKey
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "autorizacion_de_resumenes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_version_de_texto_id_fkey" FOREIGN KEY ("version_de_texto_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_autorizacion_id_fkey" FOREIGN KEY ("autorizacion_id") REFERENCES "autorizacion_de_resumenes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_asesorado_id_fkey" FOREIGN KEY ("asesorado_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_alcance_de_vinculo_id_fkey" FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- 3. Garantías de la base. Prisma no representa triggers, CHECK ni índices parciales: por eso viven acá.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── La autorización y sus renglones solo se agregan (08 §29) ─────────────────────────────────────
CREATE TRIGGER "autorizacion_de_resumenes_solo_agregar" BEFORE UPDATE OR DELETE ON "autorizacion_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "autorizacion_de_resumenes_sin_truncate" BEFORE TRUNCATE ON "autorizacion_de_resumenes" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_resumenes_solo_agregar" BEFORE UPDATE OR DELETE ON "destinatario_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "destinatario_de_resumenes_sin_truncate" BEFORE TRUNCATE ON "destinatario_de_resumenes" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La forma de cada fila ────────────────────────────────────────────────────────────────────────
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_primera_sin_predecesora" CHECK (("version" = 1) = ("predecesora_id" IS NULL));
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_texto_solo_al_darla" CHECK (
  ("estado" = 'ACTIVA') = ("version_de_texto_id" IS NOT NULL) AND ("estado" = 'ACTIVA') = ("hash_del_texto" IS NOT NULL));
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_la_da_la_persona" CHECK ("actor_id" = "asesorado_id");
ALTER TABLE "autorizacion_de_resumenes" ADD CONSTRAINT "autorizacion_de_resumenes_procedencia_es_objeto" CHECK (COALESCE(jsonb_typeof("procedencia") = 'object', FALSE));

-- Antropometría no tiene plan: de esa área, solo el resumen (TA-85).
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_antropometria_sin_plan" CHECK ("area" <> 'ANTROPOMETRIA' OR "nivel" = 'RESUMEN');
ALTER TABLE "destinatario_de_resumenes" ADD CONSTRAINT "destinatario_de_resumenes_otro_componente" CHECK ("alcance_de_vinculo_id" <> "origen_id");

ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_resuelto_segun_estado" CHECK (("estado" = 'PENDIENTE') = ("resuelto_en" IS NULL));
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_resuelto_despues" CHECK ("resuelto_en" IS NULL OR "resuelto_en" >= "pedido_en");
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_version_positiva" CHECK ("version" >= 1);
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_no_a_si_mismo" CHECK ("profesional_id" <> "asesorado_id");
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_procedencia_es_objeto" CHECK (COALESCE(jsonb_typeof("procedencia") = 'object', FALSE));
-- El plan de otra área, y de un área que tiene plan.
ALTER TABLE "pedido_de_acceso_a_plan" ADD CONSTRAINT "pedido_de_acceso_a_plan_de_otra_area_con_plan" CHECK ("area" IN ('NUTRICION', 'ENTRENAMIENTO') AND "area" <> "alcance");

-- ─── Uno pendiente por profesional, persona y área (TB-56) ────────────────────────────────────────
CREATE UNIQUE INDEX "pedido_de_acceso_a_plan_una_pendiente" ON "pedido_de_acceso_a_plan" ("profesional_id", "asesorado_id", "area") WHERE "estado" = 'PENDIENTE';

-- ─── Cada versión sucede a la anterior de la misma persona, y cada renglón es de su lista ─────────
-- La autorización: sucede a la última versión de la misma persona (sin bifurcar la cadena) y, si queda ACTIVA, acepta una
-- versión de texto de su tipo con el hash de esa versión (08 §12.2: la mostrada es la aceptada).
CREATE FUNCTION "be_autorizacion_de_resumenes_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."predecesora_id" IS NULL THEN
    IF EXISTS (SELECT 1 FROM "autorizacion_de_resumenes" WHERE "asesorado_id" = NEW."asesorado_id") THEN
      RAISE EXCEPTION 'BE: la autorización de lo de otras áreas de esta persona ya tiene una primera versión' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM "autorizacion_de_resumenes"
     WHERE "id" = NEW."predecesora_id" AND "asesorado_id" = NEW."asesorado_id" AND "version" = NEW."version" - 1
       AND "version" = (SELECT MAX("version") FROM "autorizacion_de_resumenes" WHERE "asesorado_id" = NEW."asesorado_id")) THEN
    RAISE EXCEPTION 'BE: una versión de la autorización de lo de otras áreas sucede a la última de la misma persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."estado" = 'ACTIVA' AND NOT EXISTS (
    SELECT 1 FROM "version_de_texto" WHERE "id" = NEW."version_de_texto_id" AND "tipo" = 'RESUMENES_COMPARTIDOS' AND "hash" = NEW."hash_del_texto") THEN
    RAISE EXCEPTION 'BE: la autorización de lo de otras áreas acepta una versión de su texto, con su hash (08 §12.2)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "autorizacion_de_resumenes_guardar" BEFORE INSERT ON "autorizacion_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_autorizacion_de_resumenes_guardar"();

-- Un renglón: de una versión ACTIVA; el componente de quien recibe es de un vínculo suyo con esa persona; el de origen, de
-- otro profesional de esa persona y del área del renglón; y quien recibe no lleva esa área (la ve por su Alcance, TA-87).
CREATE FUNCTION "be_destinatario_de_resumenes_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_asesorado uuid;
BEGIN
  SELECT a."asesorado_id" INTO v_asesorado FROM "autorizacion_de_resumenes" a WHERE a."id" = NEW."autorizacion_id" AND a."estado" = 'ACTIVA';
  IF v_asesorado IS NULL THEN
    RAISE EXCEPTION 'BE: un renglón de lo de otras áreas es de una autorización activa' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
     WHERE av."id" = NEW."alcance_de_vinculo_id" AND vi."profesional_id" = NEW."profesional_id" AND vi."asesorado_id" = v_asesorado) THEN
    RAISE EXCEPTION 'BE: quien recibe lo de otras áreas lo recibe por un vínculo suyo con esa persona' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
     WHERE av."id" = NEW."origen_id" AND av."alcance" = NEW."area" AND vi."asesorado_id" = v_asesorado AND vi."profesional_id" <> NEW."profesional_id") THEN
    RAISE EXCEPTION 'BE: lo de otras áreas sale del componente de otro profesional de esa persona, en esa área' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
     WHERE vi."profesional_id" = NEW."profesional_id" AND vi."asesorado_id" = v_asesorado AND av."alcance" = NEW."area" AND av."estado" <> 'FINALIZADO') THEN
    RAISE EXCEPTION 'BE: el receptor lleva esa área con la persona: no se le comparte' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "destinatario_de_resumenes_guardar" BEFORE INSERT ON "destinatario_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_destinatario_de_resumenes_guardar"();

-- ─── El pedido: quién lo hace, desde dónde, y lo único que puede cambiar ──────────────────────────
-- Nace PENDIENTE, en su versión 1, desde un componente de vínculo de ese profesional con esa persona, de esa área. Que el
-- componente esté aceptado (ni en pausa ni terminado), con su B2 y el A3 de la persona, lo decide el PDP de la API.
CREATE FUNCTION "be_pedido_de_acceso_a_plan_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."estado" <> 'PENDIENTE' OR NEW."version" <> 1 THEN
    RAISE EXCEPTION 'BE: un pedido de ver un plan nace PENDIENTE, en su versión 1 (TB-56)' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
       SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
        WHERE av."id" = NEW."alcance_de_vinculo_id" AND av."alcance" = NEW."alcance"
          AND vi."profesional_id" = NEW."profesional_id" AND vi."asesorado_id" = NEW."asesorado_id") THEN
    RAISE EXCEPTION 'BE: el pedido sale de un componente de vínculo de ese profesional con esa persona, de esa área (TB-56)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "pedido_de_acceso_a_plan_insertar" BEFORE INSERT ON "pedido_de_acceso_a_plan" FOR EACH ROW EXECUTE FUNCTION "be_pedido_de_acceso_a_plan_insertar"();

-- Solo se resuelve, una vez: de PENDIENTE a otro estado, con su momento. No cambia nada más y no vuelve a PENDIENTE.
CREATE FUNCTION "be_pedido_de_acceso_a_plan_actualizar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."id" <> OLD."id" OR NEW."profesional_id" <> OLD."profesional_id" OR NEW."asesorado_id" <> OLD."asesorado_id"
     OR NEW."alcance_de_vinculo_id" <> OLD."alcance_de_vinculo_id" OR NEW."alcance" <> OLD."alcance" OR NEW."area" <> OLD."area"
     OR NEW."version" <> OLD."version" OR NEW."pedido_en" <> OLD."pedido_en" OR NEW."procedencia" <> OLD."procedencia"
     OR NEW."momento_de_registro" <> OLD."momento_de_registro" THEN
    RAISE EXCEPTION 'BE: un pedido de ver un plan solo se resuelve: no cambia nada más (TB-56)' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD."estado" <> 'PENDIENTE' OR NEW."estado" = 'PENDIENTE' THEN
    RAISE EXCEPTION 'BE: un pedido de ver un plan se resuelve una sola vez (estaba %)', OLD."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "pedido_de_acceso_a_plan_actualizar" BEFORE UPDATE ON "pedido_de_acceso_a_plan" FOR EACH ROW EXECUTE FUNCTION "be_pedido_de_acceso_a_plan_actualizar"();

CREATE TRIGGER "pedido_de_acceso_a_plan_sin_borrar" BEFORE DELETE ON "pedido_de_acceso_a_plan" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "pedido_de_acceso_a_plan_sin_truncate" BEFORE TRUNCATE ON "pedido_de_acceso_a_plan" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── La novedad del pedido lo nombra ──────────────────────────────────────────────────────────────
-- El tipo se compara como texto: el valor se agregó en la migración 20261107120000.
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_pedido_de_acceso_a_plan_referenciado" CHECK (
  "tipo"::text <> 'PEDIDO_DE_ACCESO_A_PLAN'
  OR ("referencia_tipo" = 'PedidoDeAccesoAPlan' AND "referencia_id" IS NOT NULL));

-- ─── Quién miró lo compartido (API-RES-01, 08 §19.7) ──────────────────────────────────────────────
-- La persona lee las lecturas permitidas de API-RES-06 sobre ella, de la más nueva a la más vieja. Un índice parcial: solo
-- esas decisiones, que son pocas al lado del resto.
CREATE INDEX "decision_de_acceso_lecturas_de_lo_compartido" ON "decision_de_acceso" ("sujeto_id", "secuencia" DESC)
  WHERE "operacion" = 'API-RES-06' AND "resultado" = 'PERMITIDA';

-- ─── TB-53 · CRD-D5, ampliada: lo citado en una nota ──────────────────────────────────────────────
-- Hasta acá, una nota citaba solo lo del área desde la que se escribió y del autor con esa persona. Desde TB-53, también la
-- versión ACTIVADA vigente del plan de otra área que el autor ve por lo que la persona le comparte: la versión efectiva de
-- un plan de esa persona con otro profesional, y la última autorización de la persona ACTIVA, con un renglón que nombra al
-- autor en esa área con «resumen y plan», desde un componente sin terminar del profesional del plan y por un componente sin
-- terminar del autor. Que el autor tenga hoy su vínculo aceptado y su B2 lo decide el PDP de la API, como en API-RES-06.
-- Lo demás no cambia: una revisión o una toma de otra área, y lo de otro profesional, se siguen rechazando.
CREATE OR REPLACE FUNCTION "be_referencia_de_nota_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_nota "nota_de_coordinacion"%ROWTYPE;
  v_area "Alcance";
  v_valida boolean;
BEGIN
  SELECT * INTO v_nota FROM "nota_de_coordinacion" WHERE "id" = NEW."nota_id";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BE: la referencia no tiene nota' USING ERRCODE = 'foreign_key_violation';
  END IF;
  v_area := CASE NEW."tipo"
    WHEN 'VERSION_DE_PLAN_NUTRICIONAL' THEN 'NUTRICION'::"Alcance"
    WHEN 'REVISION_NUTRICIONAL' THEN 'NUTRICION'::"Alcance"
    WHEN 'VERSION_DE_PLAN_DE_ENTRENAMIENTO' THEN 'ENTRENAMIENTO'::"Alcance"
    WHEN 'REVISION_DE_ENTRENAMIENTO' THEN 'ENTRENAMIENTO'::"Alcance"
    ELSE 'ANTROPOMETRIA'::"Alcance"
  END;
  IF v_area <> v_nota."alcance_de_origen" THEN
    IF NEW."tipo" NOT IN ('VERSION_DE_PLAN_NUTRICIONAL', 'VERSION_DE_PLAN_DE_ENTRENAMIENTO') THEN
      RAISE EXCEPTION 'BE: una nota cita solo lo del área desde la que se escribió' USING ERRCODE = 'check_violation';
    END IF;
    v_valida := EXISTS (
      SELECT 1
        FROM (SELECT p."profesional_id", p."asesorado_id", p."version_efectiva_id" FROM "plan_nutricional" p WHERE NEW."tipo" = 'VERSION_DE_PLAN_NUTRICIONAL'
              UNION ALL
              SELECT p."profesional_id", p."asesorado_id", p."version_efectiva_id" FROM "plan_de_entrenamiento" p WHERE NEW."tipo" = 'VERSION_DE_PLAN_DE_ENTRENAMIENTO') pl
        JOIN LATERAL (SELECT a."id", a."estado" FROM "autorizacion_de_resumenes" a WHERE a."asesorado_id" = pl."asesorado_id" ORDER BY a."version" DESC LIMIT 1) au ON au."estado" = 'ACTIVA'
        JOIN "destinatario_de_resumenes" d ON d."autorizacion_id" = au."id" AND d."profesional_id" = v_nota."autor_id" AND d."area" = v_area AND d."nivel" = 'RESUMEN_Y_PLAN'
        JOIN "alcance_de_vinculo" avo ON avo."id" = d."origen_id" AND avo."estado" <> 'FINALIZADO'
        JOIN "vinculo" vo ON vo."id" = avo."vinculo_id" AND vo."profesional_id" = pl."profesional_id"
        JOIN "alcance_de_vinculo" avr ON avr."id" = d."alcance_de_vinculo_id" AND avr."estado" <> 'FINALIZADO'
       WHERE pl."version_efectiva_id" = NEW."recurso_id" AND pl."asesorado_id" = v_nota."asesorado_id" AND pl."profesional_id" <> v_nota."autor_id");
    IF NOT v_valida THEN
      RAISE EXCEPTION 'BE: una nota cita el plan de otra área solo si la persona se lo comparte al autor con el plan' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  v_valida := CASE NEW."tipo"
    WHEN 'VERSION_DE_PLAN_NUTRICIONAL' THEN EXISTS (
      SELECT 1 FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id"
       WHERE v."id" = NEW."recurso_id" AND v."estado" = 'ACTIVADA' AND p."profesional_id" = v_nota."autor_id" AND p."asesorado_id" = v_nota."asesorado_id")
    WHEN 'REVISION_NUTRICIONAL' THEN EXISTS (
      SELECT 1 FROM "revision_nutricional" r JOIN "proceso_operativo" pr ON pr."id" = r."proceso_id"
       WHERE r."id" = NEW."recurso_id" AND pr."profesional_id" = v_nota."autor_id" AND pr."asesorado_id" = v_nota."asesorado_id")
    WHEN 'VERSION_DE_PLAN_DE_ENTRENAMIENTO' THEN EXISTS (
      SELECT 1 FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
       WHERE v."id" = NEW."recurso_id" AND v."estado" = 'ACTIVADA' AND p."profesional_id" = v_nota."autor_id" AND p."asesorado_id" = v_nota."asesorado_id")
    WHEN 'REVISION_DE_ENTRENAMIENTO' THEN EXISTS (
      SELECT 1 FROM "revision_de_entrenamiento" r JOIN "proceso_operativo" pr ON pr."id" = r."proceso_id"
       WHERE r."id" = NEW."recurso_id" AND pr."profesional_id" = v_nota."autor_id" AND pr."asesorado_id" = v_nota."asesorado_id")
    ELSE EXISTS (
      SELECT 1 FROM "evaluacion_antropometrica" e
       WHERE e."id" = NEW."recurso_id" AND e."estado" = 'REGISTRADA' AND e."profesional_id" = v_nota."autor_id" AND e."asesorado_id" = v_nota."asesorado_id")
  END;
  IF NOT v_valida THEN
    RAISE EXCEPTION 'BE: lo citado no es un registro del autor con esta persona' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
