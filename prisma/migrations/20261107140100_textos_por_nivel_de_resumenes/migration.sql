-- WP-TABLERO-ALTA-GAMA · TB-55 (DEUDA_LEGAJO DL-163 D-13, ampliada; Dirección, 2026-11-07: «un texto distinto por nivel»,
-- que reemplaza TA-99 y ratifica TA-85). Migración aditiva: dos versiones de texto, una tabla nueva y dos funciones; no
-- cambia ninguna fila ni las migraciones ya escritas.
-- - Los textos: el de «resumen» (`resumenes-compartidos-2026-11-propuesta-2`, tipo RESUMENES_COMPARTIDOS) sucede al texto
--   único de 20261107120100, que queda como historia y no hereda aceptaciones (09 §31.2.6); el de «resumen y plan»
--   (`resumenes-y-plan-compartidos-2026-11-propuesta`) es del tipo nuevo RESUMENES_Y_PLAN_COMPARTIDOS. Los dos, propuestas
--   pendientes de validación jurídica.
-- - `texto_aceptado_de_resumenes`: qué texto tiene aceptado cada nivel en una versión ACTIVA de la autorización, con su
--   hash (08 §12.2). Un permiso nuevo de «resumen» pide el de «resumen»; dar o subir a «resumen y plan», el de «resumen y
--   plan»; bajar o retirar no pide ninguno, y la versión nueva conserva los que ya tenía (lo decide la API, API-RES-02).
-- - `be_autorizacion_de_resumenes_guardar` se reemplaza (como `be_referencia_de_nota_guardar` en 20261107120100, TA-108):
--   el texto de la columna de la autorización puede ser de cualquiera de los dos tipos (el del nivel más alto aceptado).
-- Garantías en la base, aunque el código se equivoque:
--   - los textos aceptados solo se agregan, también frente a TRUNCATE (08 §29);
--   - son de una versión ACTIVA, y el de cada nivel es una versión de texto de su tipo, con su hash;
--   - al confirmar la transacción, cada renglón nuevo tiene aceptado el texto de su nivel en su versión (el de «resumen y
--     plan» vale también para un renglón de «resumen»).
-- Datos sintéticos en `test`. Con personas reales, después de la revisión legal (§9 del paquete; VJR-5 suma la pregunta del
-- fundamento del objetivo) y del gate del 08 §42.

-- 1. Las dos versiones de texto, generadas desde @be/domain (`node scripts/generar-sql-catalogo-de-textos.cjs --ids
--    resumenes-compartidos-2026-11-propuesta-2,resumenes-y-plan-compartidos-2026-11-propuesta`).
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde", "reemplaza_a_id") VALUES ('resumenes-compartidos-2026-11-propuesta-2', 'RESUMENES_COMPARTIDOS', $be_texto$Compartir el resumen de otras áreas con mis profesionales$be_texto$, 'COMPARTIR_RESUMEN_DE_OTRAS_AREAS_CON_PROFESIONALES', $be_texto$Compartir el resumen de otras áreas con mis profesionales — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea el resumen de otra área tuya, la que lleva otro profesional. La das por profesional y por área.

Qué ve: el resumen de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Por ejemplo, de Entrenamiento, los días por semana del plan y las sesiones que registraste; de Antropometría, el peso y la composición en kilos, con su método; de Nutrición, solo desde cuándo rige tu plan y las fechas de tus revisiones, sin números. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.

Qué no ve: tu plan completo. Para eso hay otra autorización, «Compartir el plan de otras áreas con mis profesionales», que se acepta aparte.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Cada vez que un profesional lo abre, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '6153eff056a37b986519dbe406d6378c0d3a8d80c5c75397bf59faa9f8ff7d1f', '2026-11-07T12:00:00.000Z', 'resumenes-compartidos-2026-11-propuesta');
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('resumenes-y-plan-compartidos-2026-11-propuesta', 'RESUMENES_Y_PLAN_COMPARTIDOS', $be_texto$Compartir el plan de otras áreas con mis profesionales$be_texto$, 'COMPARTIR_PLAN_DE_OTRAS_AREAS_CON_PROFESIONALES', $be_texto$Compartir el plan de otras áreas con mis profesionales — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea tu plan de otra área, la que lleva otro profesional: Nutrición o Entrenamiento. Antropometría no tiene plan. La das por profesional y por área.

Qué ve: tu plan vigente de esa área, completo y de solo lectura, como lo ves vos en tu app; su objetivo, con el fundamento que escribió tu profesional; quién lo armó; desde cuándo rige; la fecha de la próxima revisión; y cuánto registraste cada semana desde que rige, hasta las últimas 12 semanas. También ve el resumen de esa área.

Qué no ve: los borradores, las versiones anteriores, lo que se habló en una revisión, las notas internas de tus profesionales ni sus evaluaciones.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir.

Quien ve tu plan no lo puede cambiar. Le puede dejar una nota a quien lleva esa área, y esa nota también la ves vos.

Un profesional te puede pedir ver tu plan de otra área. Pedirlo no le da acceso: lo decidís vos, y podés decir que no.

Cada vez que un profesional abre tu plan de otra área, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés pasar a compartir solo el resumen, sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '61e0f29043089c9f562a8660d1dd1850081267080bc80f1e34600d0464688ee5', '2026-11-07T12:00:00.000Z');

-- 2. La tabla, su índice y sus claves foráneas, como los da `prisma migrate diff` desde prisma/schema.prisma.
-- CreateTable
CREATE TABLE "texto_aceptado_de_resumenes" (
    "autorizacion_id" UUID NOT NULL,
    "nivel" "NivelDeResumenCompartido" NOT NULL,
    "version_de_texto_id" TEXT NOT NULL,
    "hash_del_texto" TEXT NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "texto_aceptado_de_resumenes_pkey" PRIMARY KEY ("autorizacion_id","nivel")
);

-- CreateIndex
CREATE INDEX "texto_aceptado_de_resumenes_version_de_texto_id_idx" ON "texto_aceptado_de_resumenes"("version_de_texto_id");

-- AddForeignKey
ALTER TABLE "texto_aceptado_de_resumenes" ADD CONSTRAINT "texto_aceptado_de_resumenes_autorizacion_id_fkey" FOREIGN KEY ("autorizacion_id") REFERENCES "autorizacion_de_resumenes"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "texto_aceptado_de_resumenes" ADD CONSTRAINT "texto_aceptado_de_resumenes_version_de_texto_id_fkey" FOREIGN KEY ("version_de_texto_id") REFERENCES "version_de_texto"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ══════════════════════════════════════════════════════════════════════════════════════════════════
-- 3. Garantías de la base.
-- ══════════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Solo se agregan (08 §29) ─────────────────────────────────────────────────────────────────────
CREATE TRIGGER "texto_aceptado_de_resumenes_solo_agregar" BEFORE UPDATE OR DELETE ON "texto_aceptado_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "texto_aceptado_de_resumenes_sin_truncate" BEFORE TRUNCATE ON "texto_aceptado_de_resumenes" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── El texto de cada nivel: de una versión ACTIVA, de su tipo y con su hash ──────────────────────
CREATE FUNCTION "be_texto_aceptado_de_resumenes_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "autorizacion_de_resumenes" WHERE "id" = NEW."autorizacion_id" AND "estado" = 'ACTIVA') THEN
    RAISE EXCEPTION 'BE: un texto aceptado de lo de otras áreas es de una autorización activa' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "version_de_texto"
     WHERE "id" = NEW."version_de_texto_id" AND "hash" = NEW."hash_del_texto"
       AND "tipo"::text = CASE NEW."nivel" WHEN 'RESUMEN' THEN 'RESUMENES_COMPARTIDOS' ELSE 'RESUMENES_Y_PLAN_COMPARTIDOS' END) THEN
    RAISE EXCEPTION 'BE: el texto aceptado de un nivel es una versión del texto de su nivel, con su hash (08 §12.2)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "texto_aceptado_de_resumenes_guardar" BEFORE INSERT ON "texto_aceptado_de_resumenes" FOR EACH ROW EXECUTE FUNCTION "be_texto_aceptado_de_resumenes_guardar"();

-- ─── Cada renglón nuevo, con el texto de su nivel aceptado en su versión ──────────────────────────
-- Diferido: la API escribe la versión, sus renglones y sus textos en la misma transacción. El de «resumen y plan» incluye
-- el resumen de esa área: alcanza también para un renglón de «resumen» (bajar de nivel no pide otro texto).
CREATE FUNCTION "be_destinatario_de_resumenes_con_texto"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "texto_aceptado_de_resumenes" t
     WHERE t."autorizacion_id" = NEW."autorizacion_id"
       AND (t."nivel" = NEW."nivel" OR (NEW."nivel" = 'RESUMEN' AND t."nivel" = 'RESUMEN_Y_PLAN'))) THEN
    RAISE EXCEPTION 'BE: un renglón de lo de otras áreas no se da sin el texto aceptado de su nivel' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "destinatario_de_resumenes_con_texto" AFTER INSERT ON "destinatario_de_resumenes"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "be_destinatario_de_resumenes_con_texto"();

-- ─── La autorización acepta un texto de cualquiera de los dos tipos ───────────────────────────────
-- La misma función de 20261107120100, salvo el tipo del texto de la columna: el del nivel más alto que la versión tiene
-- aceptado. Lo de cada nivel está en `texto_aceptado_de_resumenes`.
CREATE OR REPLACE FUNCTION "be_autorizacion_de_resumenes_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
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
    SELECT 1 FROM "version_de_texto"
     WHERE "id" = NEW."version_de_texto_id" AND "tipo"::text IN ('RESUMENES_COMPARTIDOS', 'RESUMENES_Y_PLAN_COMPARTIDOS') AND "hash" = NEW."hash_del_texto") THEN
    RAISE EXCEPTION 'BE: la autorización de lo de otras áreas acepta una versión de su texto, con su hash (08 §12.2)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
