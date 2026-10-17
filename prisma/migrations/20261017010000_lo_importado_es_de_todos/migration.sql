-- WP-CATALOGO-BASE (DEUDA_LEGAJO DL-141, D-1; aprobado por Dirección el 2026-10-16, tanda 3): «lo importado de OFF y de
-- wger queda para todos los profesionales, con su fuente». Hay un solo elemento por ítem externo (proveedor más
-- identificador): si un profesional importa uno que ya está, la resolución de su candidato apunta al que hay y no se
-- crea otro.
-- 1. La tabla `item_externo_de_catalogo`, generada desde prisma/schema.prisma con `prisma migrate diff`.
-- 2. Garantías en la base, aunque el código se equivoque: solo se agrega; cada ítem externo es del dominio de su
--    proveedor y apunta a un elemento importado de ese mismo proveedor e identificador.
-- 3. Lo importado antes de DL-141: se registra el más antiguo de cada ítem externo, que pasa a ser de todos. Si un mismo
--    ítem se había importado más de una vez, los demás siguen siendo de quien los importó (nada se reescribe).
-- 4. La resolución de un candidato: importar crea el elemento de su ítem externo o apunta al que ya está.

-- CreateTable
CREATE TABLE "item_externo_de_catalogo" (
    "proveedor" "ProveedorExterno" NOT NULL,
    "id_externo" TEXT NOT NULL,
    "elemento_nutricional_id" UUID,
    "ejercicio_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_externo_de_catalogo_pkey" PRIMARY KEY ("proveedor","id_externo")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_externo_de_catalogo_elemento_nutricional_id_key" ON "item_externo_de_catalogo"("elemento_nutricional_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_externo_de_catalogo_ejercicio_id_key" ON "item_externo_de_catalogo"("ejercicio_id");

-- AddForeignKey
ALTER TABLE "item_externo_de_catalogo" ADD CONSTRAINT "item_externo_de_catalogo_elemento_nutricional_id_fkey" FOREIGN KEY ("elemento_nutricional_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "item_externo_de_catalogo" ADD CONSTRAINT "item_externo_de_catalogo_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "ejercicio_de_catalogo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── 2. Garantías que Prisma no representa ───────────────────────────────────────────────────────────────────────────
-- Solo se agrega: un ítem externo no cambia de elemento ni desaparece (la cita de un plan no se mueve).
CREATE TRIGGER "item_externo_de_catalogo_solo_agregar" BEFORE UPDATE OR DELETE ON "item_externo_de_catalogo" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "item_externo_de_catalogo_sin_truncate" BEFORE TRUNCATE ON "item_externo_de_catalogo" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- Open Food Facts es nutrición y wger es entrenamiento, como el candidato (WP-08).
ALTER TABLE "item_externo_de_catalogo" ADD CONSTRAINT "item_externo_de_catalogo_del_dominio_del_proveedor" CHECK (
  ("proveedor" = 'OPEN_FOOD_FACTS' AND "elemento_nutricional_id" IS NOT NULL AND "ejercicio_id" IS NULL)
  OR ("proveedor" = 'WGER' AND "ejercicio_id" IS NOT NULL AND "elemento_nutricional_id" IS NULL)
);
ALTER TABLE "item_externo_de_catalogo" ADD CONSTRAINT "item_externo_de_catalogo_con_identificador" CHECK (btrim("id_externo") <> '');
ALTER TABLE "item_externo_de_catalogo" ADD CONSTRAINT "item_externo_de_catalogo_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');

-- El elemento es un importado (CONTROLLED_IMPORT) y vino de ese mismo ítem: su primera versión lo dice en la fuente
-- externa de su procedencia (WP-08). Así un ítem externo no puede apuntar a lo sembrado, a lo cargado a mano ni a otro
-- producto.
CREATE FUNCTION "be_item_externo_de_catalogo_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_procedencia TEXT;
  v_fuente JSONB;
BEGIN
  IF NEW."elemento_nutricional_id" IS NOT NULL THEN
    SELECT e."procedencia"::text, v."procedencia" -> 'fuenteExterna' INTO v_procedencia, v_fuente
      FROM "elemento_de_catalogo_nutricional" e
      LEFT JOIN "version_de_elemento_nutricional" v ON v."elemento_id" = e."id" AND v."predecesora_id" IS NULL
     WHERE e."id" = NEW."elemento_nutricional_id";
  ELSE
    SELECT e."procedencia"::text, v."procedencia" -> 'fuenteExterna' INTO v_procedencia, v_fuente
      FROM "ejercicio_de_catalogo" e
      LEFT JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id" AND v."predecesora_id" IS NULL
     WHERE e."id" = NEW."ejercicio_id";
  END IF;
  IF v_procedencia IS DISTINCT FROM 'CONTROLLED_IMPORT' THEN
    RAISE EXCEPTION 'BE: un ítem externo apunta a un elemento importado (CONTROLLED_IMPORT)' USING ERRCODE = 'check_violation';
  END IF;
  IF v_fuente IS NULL OR (v_fuente ->> 'provider') IS DISTINCT FROM NEW."proveedor"::text OR (v_fuente ->> 'externalId') IS DISTINCT FROM NEW."id_externo" THEN
    RAISE EXCEPTION 'BE: el elemento de un ítem externo vino de ese mismo proveedor e identificador' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "item_externo_de_catalogo_guardar" BEFORE INSERT ON "item_externo_de_catalogo" FOR EACH ROW EXECUTE FUNCTION "be_item_externo_de_catalogo_guardar"();


-- ─── 3. Lo importado antes de DL-141 ─────────────────────────────────────────────────────────────────────────────────
-- El elemento más antiguo de cada ítem externo pasa a ser el de todos. La procedencia dice de qué resolución salió.
INSERT INTO "item_externo_de_catalogo" ("proveedor", "id_externo", "elemento_nutricional_id", "ejercicio_id", "procedencia")
SELECT DISTINCT ON (c."proveedor", c."id_externo")
       c."proveedor", c."id_externo", r."elemento_nutricional_id", r."ejercicio_id",
       jsonb_build_object('fuente', 'migracion', 'siembra', 'WP-CATALOGO-BASE · DL-141', 'resolucionId', r."id"::text)
  FROM "resolucion_de_candidato" r
  JOIN "candidato_de_importacion" c ON c."id" = r."candidato_id"
 WHERE r."decision" = 'IMPORTAR'
 ORDER BY c."proveedor", c."id_externo", r."momento_de_registro", r."id";


-- ─── 4. La resolución de un candidato ────────────────────────────────────────────────────────────────────────────────
-- Importar apunta a un elemento siempre; crea una versión solo si el ítem externo todavía no estaba (D-1). Rechazar sigue
-- sin crear ni guardar nada.
ALTER TABLE "resolucion_de_candidato" DROP CONSTRAINT "resolucion_de_candidato_efecto_coherente";
ALTER TABLE "resolucion_de_candidato" ADD CONSTRAINT "resolucion_de_candidato_efecto_coherente" CHECK (
  ("decision" = 'IMPORTAR' AND num_nonnulls("elemento_nutricional_id", "ejercicio_id") = 1 AND "contenido_revisado" IS NOT NULL)
  OR
  ("decision" = 'RECHAZAR' AND num_nonnulls("elemento_nutricional_id", "ejercicio_id", "version_creada_id", "contenido_revisado") = 0)
);

-- Un elemento lo crea una sola resolución; las que llegan después solo lo citan. La versión, como antes, la crea una sola.
DROP INDEX "resolucion_de_candidato_un_elemento_nutricional";
DROP INDEX "resolucion_de_candidato_un_ejercicio";
CREATE UNIQUE INDEX "resolucion_de_candidato_crea_un_elemento_nutricional" ON "resolucion_de_candidato" ("elemento_nutricional_id") WHERE "elemento_nutricional_id" IS NOT NULL AND "version_creada_id" IS NOT NULL;
CREATE UNIQUE INDEX "resolucion_de_candidato_crea_un_ejercicio" ON "resolucion_de_candidato" ("ejercicio_id") WHERE "ejercicio_id" IS NOT NULL AND "version_creada_id" IS NOT NULL;

-- La base sostiene, además de lo de WP-08 (autor, vencimiento y hora de la base):
-- - importar incorpora un elemento CONTROLLED_IMPORT del dominio del candidato;
-- - si lo crea, es propio y la versión es suya (como en WP-08);
-- - y sea nuevo o el que ya estaba, es el elemento del ítem externo del candidato: el de su proveedor e identificador.
CREATE OR REPLACE FUNCTION "be_resolucion_de_candidato_insertar"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  c RECORD;
  v_procedencia TEXT;
  v_creado_por UUID;
  v_version_del_elemento BOOLEAN;
  v_del_item_externo BOOLEAN;
BEGIN
  NEW."momento_de_registro" := now();
  SELECT "profesional_id", "alcance", "vence_en", "proveedor", "id_externo" INTO c FROM "candidato_de_importacion" WHERE "id" = NEW."candidato_id";
  IF NEW."autor_id" <> c."profesional_id" THEN
    RAISE EXCEPTION 'BE: la resolución de un candidato es de quien lo pidió' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."momento_de_registro" > c."vence_en" THEN
    RAISE EXCEPTION 'BE: un candidato vencido no se resuelve' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."decision" = 'IMPORTAR' THEN
    IF c."alcance" = 'NUTRICION' AND NEW."elemento_nutricional_id" IS NOT NULL THEN
      SELECT "procedencia"::text, "creado_por_id" INTO v_procedencia, v_creado_por FROM "elemento_de_catalogo_nutricional" WHERE "id" = NEW."elemento_nutricional_id";
      v_version_del_elemento := EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" WHERE "id" = NEW."version_creada_id" AND "elemento_id" = NEW."elemento_nutricional_id");
      v_del_item_externo := EXISTS (
        SELECT 1 FROM "item_externo_de_catalogo"
         WHERE "proveedor" = c."proveedor" AND "id_externo" = c."id_externo" AND "elemento_nutricional_id" = NEW."elemento_nutricional_id");
    ELSIF c."alcance" = 'ENTRENAMIENTO' AND NEW."ejercicio_id" IS NOT NULL THEN
      SELECT "procedencia"::text, "creado_por_id" INTO v_procedencia, v_creado_por FROM "ejercicio_de_catalogo" WHERE "id" = NEW."ejercicio_id";
      v_version_del_elemento := EXISTS (SELECT 1 FROM "version_de_ejercicio" WHERE "id" = NEW."version_creada_id" AND "ejercicio_id" = NEW."ejercicio_id");
      v_del_item_externo := EXISTS (
        SELECT 1 FROM "item_externo_de_catalogo"
         WHERE "proveedor" = c."proveedor" AND "id_externo" = c."id_externo" AND "ejercicio_id" = NEW."ejercicio_id");
    ELSE
      RAISE EXCEPTION 'BE: el elemento importado tiene que ser del dominio del candidato' USING ERRCODE = 'check_violation';
    END IF;
    IF v_procedencia IS DISTINCT FROM 'CONTROLLED_IMPORT' THEN
      RAISE EXCEPTION 'BE: importar incorpora un elemento de procedencia CONTROLLED_IMPORT' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."version_creada_id" IS NOT NULL THEN
      IF v_creado_por IS DISTINCT FROM NEW."autor_id" THEN
        RAISE EXCEPTION 'BE: importar crea un elemento propio, de procedencia CONTROLLED_IMPORT' USING ERRCODE = 'check_violation';
      END IF;
      IF NOT v_version_del_elemento THEN
        RAISE EXCEPTION 'BE: la versión creada es una versión del elemento importado' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF NOT v_del_item_externo THEN
      RAISE EXCEPTION 'BE: importar usa el elemento de su ítem externo, uno solo por proveedor e identificador' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
