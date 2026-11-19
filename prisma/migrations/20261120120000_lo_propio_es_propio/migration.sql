-- WP-NUTRICION-ALIMENTOS (DL-180), segundo tramo: lo propio es propio y Administración suma al canon (NUA-D14 a D16;
-- decisión de Dirección del 2026-11-19; docs/paquetes/WP-NUTRICION-ALIMENTOS.md). Solo agrega: una tabla de hechos y sus
-- guardias, cierra `alimento_compartido` y reemplaza el cuerpo de la guardia de `revision_administrativa_de_alimento`
-- (creadas en esta misma rama). Ninguna fila existente cambia ni se borra.
-- - NUA-D14: un alimento cargado a mano lo ve y lo cita solo quien lo cargó. `alimento_compartido` (primer tramo) queda
--   como historia: la API ya no la lee, y acá se cierra (no admite filas nuevas). Lo que se compartió vuelve a ser propio
--   sin borrar nada; los planes, las recetas y los registros que ya lo citan conservan su copia.
-- - NUA-D15: Administración revisa todas las cargas a mano, con el nombre del profesional que las cargó (la guardia ya no
--   pide que estén compartidas). El equivalente puede ser de la tabla oficial (USDA) o del canon.
-- - NUA-D16: `alimento_del_canon`, los alimentos que Administración suma al catálogo verificado, con su fuente citada y, si
--   partió de una carga a mano, cuál. Son alimentos de BE: sin profesional que los cargue, de todos.

-- CreateTable
CREATE TABLE "alimento_del_canon" (
    "elemento_id" UUID NOT NULL,
    "fuente" TEXT NOT NULL,
    "origen_id" UUID,
    "administrador_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alimento_del_canon_pkey" PRIMARY KEY ("elemento_id")
);

-- AddForeignKey
ALTER TABLE "alimento_del_canon" ADD CONSTRAINT "alimento_del_canon_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "alimento_del_canon" ADD CONSTRAINT "alimento_del_canon_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "alimento_del_canon" ADD CONSTRAINT "alimento_del_canon_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Guardias ─────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE "alimento_del_canon" ADD CONSTRAINT "alimento_del_canon_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "alimento_del_canon" ADD CONSTRAINT "alimento_del_canon_fuente" CHECK (char_length(btrim("fuente")) BETWEEN 1 AND 500);

-- Lo suma un administrador con su rol vigente; el alimento es de BE (importado por BE, sin profesional que lo cargue y sin
-- un producto de Open Food Facts detrás), y el origen, si lo hay, es una carga a mano.
CREATE FUNCTION "be_alimento_del_canon_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un alimento lo suma al canon un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'CONTROLLED_IMPORT' AND e."creado_por_id" IS NULL
       AND NOT EXISTS (SELECT 1 FROM "item_externo_de_catalogo" x WHERE x."elemento_nutricional_id" = e."id")) THEN
    RAISE EXCEPTION 'BE: el canon suma alimentos de BE, no cargas a mano ni productos importados' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."origen_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" o WHERE o."id" = NEW."origen_id" AND o."procedencia" = 'PROFESSIONAL_MANUAL') THEN
    RAISE EXCEPTION 'BE: un alimento del canon parte de una carga a mano' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "alimento_del_canon_guardar" BEFORE INSERT ON "alimento_del_canon" FOR EACH ROW EXECUTE FUNCTION "be_alimento_del_canon_guardar"();
CREATE TRIGGER "alimento_del_canon_solo_agregar" BEFORE UPDATE OR DELETE ON "alimento_del_canon" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "alimento_del_canon_sin_truncate" BEFORE TRUNCATE ON "alimento_del_canon" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- NUA-D14: lo cargado a mano no se comparte. `alimento_compartido` queda como historia y no admite filas nuevas.
CREATE FUNCTION "be_alimento_compartido_cerrado"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'BE: lo cargado a mano es de quien lo cargó; no se comparte' USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER "alimento_compartido_cerrado" BEFORE INSERT ON "alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_alimento_compartido_cerrado"();

-- NUA-D15: Administración revisa todas las cargas a mano (ya no solo las compartidas). El equivalente es de la tabla oficial
-- (USDA) o del canon, en una versión disponible.
CREATE OR REPLACE FUNCTION "be_revision_administrativa_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = NEW."administrador_id" AND "estado" = 'VIGENTE') THEN
    RAISE EXCEPTION 'BE: un alimento lo revisa un administrador con su rol vigente' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e JOIN "version_de_elemento_nutricional" v ON v."elemento_id" = e."id"
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND v."id" = NEW."version_id") THEN
    RAISE EXCEPTION 'BE: Administración revisa una versión de un alimento cargado a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."equivalente_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "version_de_elemento_nutricional" t
     WHERE t."elemento_id" = NEW."equivalente_id" AND t."disponibilidad" = 'DISPONIBLE'
       AND (t."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
            OR EXISTS (SELECT 1 FROM "alimento_del_canon" c WHERE c."elemento_id" = t."elemento_id"))
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = t."id")) THEN
    RAISE EXCEPTION 'BE: el equivalente es un alimento verificado y disponible' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(r."numero") FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: una revisión de un alimento sigue a la anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
