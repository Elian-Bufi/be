-- WP-NUTRICION-ALIMENTOS (DL-180), segundo tramo: las medidas caseras (NUA-08, aprobadas por Dirección el 2026-11-16;
-- docs/paquetes/WP-NUTRICION-ALIMENTOS.md). Solo agrega una tabla de hechos y sus guardias; ninguna fila existente cambia.
-- - `medidas_caseras_de_alimento`: la unidad, la cucharada, la taza y la porción de un alimento, con su equivalencia en la
--   unidad de su composición. Un hecho aparte de sus versiones, como el grupo: la vigente es la de mayor número. Las define
--   quien cargó el alimento a mano; sin autor, las sembraría BE desde una fuente que las documente (en este tramo, ninguna:
--   no se inventan equivalencias para la tabla oficial).
-- - Los planes no las leen: cada ítem guarda la medida que eligió y su equivalencia de ese momento, y la cantidad sigue en
--   gramos (o mililitros), que es la que cuenta.

-- CreateTable
CREATE TABLE "medidas_caseras_de_alimento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "medidas" JSONB NOT NULL,
    "autor_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medidas_caseras_de_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medidas_caseras_de_alimento_elemento_id_numero_key" ON "medidas_caseras_de_alimento"("elemento_id", "numero");

-- AddForeignKey
ALTER TABLE "medidas_caseras_de_alimento" ADD CONSTRAINT "medidas_caseras_de_alimento_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "medidas_caseras_de_alimento" ADD CONSTRAINT "medidas_caseras_de_alimento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Guardias ─────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE "medidas_caseras_de_alimento" ADD CONSTRAINT "medidas_caseras_de_alimento_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Un arreglo de a lo sumo cuatro medidas; cada una, un tipo conocido y una equivalencia mayor que cero y de hasta 5000.
ALTER TABLE "medidas_caseras_de_alimento" ADD CONSTRAINT "medidas_caseras_de_alimento_forma" CHECK (
  "numero" >= 1
  AND jsonb_typeof("medidas") = 'array'
  AND jsonb_array_length("medidas") <= 4
  AND NOT jsonb_path_exists("medidas", '$[*] ? (!exists(@.kind) || !exists(@.amount) || !(@.kind == "UNIT" || @.kind == "TABLESPOON" || @.kind == "CUP" || @.kind == "PORTION") || !(@.amount > 0 && @.amount <= 5000))'));

-- Las define quien cargó el alimento a mano; sin autor, las siembra BE. Cada una sigue a la anterior.
CREATE FUNCTION "be_medidas_caseras_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."autor_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: las medidas caseras de un alimento las define quien lo cargó a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(m."numero") FROM "medidas_caseras_de_alimento" m WHERE m."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: las medidas caseras de un alimento siguen a las anteriores' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "medidas_caseras_de_alimento_guardar" BEFORE INSERT ON "medidas_caseras_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_medidas_caseras_de_alimento_guardar"();
CREATE TRIGGER "medidas_caseras_de_alimento_solo_agregar" BEFORE UPDATE OR DELETE ON "medidas_caseras_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "medidas_caseras_de_alimento_sin_truncate" BEFORE TRUNCATE ON "medidas_caseras_de_alimento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
