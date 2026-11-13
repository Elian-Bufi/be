-- API-PLN-02 y API-PLN-03 (WP-EDITORES-PROFESIONAL ED-34; WP-TABLERO-ALTA-GAMA TB-39; decisión de Dirección del
-- 2026-11-13, «Último peso, guardado en gramos»): los rangos de macronutrientes que indica el profesional en una versión del
-- plan de Nutrición, con los gramos y el peso del que salieron.
-- Tabla propia, 1 a 1 con la versión, y no una columna: la guarda de la versión exige que su `version` avance de a uno en
-- cada cambio, y los rangos tienen su propia revisión para no chocar con el autoguardado de la estructura.
-- CreateTable
CREATE TABLE "rangos_de_plan_nutricional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_de_plan_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "contenido" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rangos_de_plan_nutricional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rangos_de_plan_nutricional_version_de_plan_id_key" ON "rangos_de_plan_nutricional"("version_de_plan_id");

-- AddForeignKey
ALTER TABLE "rangos_de_plan_nutricional" ADD CONSTRAINT "rangos_de_plan_nutricional_version_de_plan_id_fkey" FOREIGN KEY ("version_de_plan_id") REFERENCES "version_de_plan_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Los rangos se escriben solo mientras la versión es un BORRADOR: activada, quedan fijos con ella (INV-06-109), y una
-- descartada no se escribe. La revisión empieza en 1 y avanza de a uno; la versión a la que pertenecen no cambia, y no se
-- borran.
CREATE FUNCTION "be_rangos_de_plan_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: los rangos de una versión de plan no se eliminan' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "version_de_plan_nutricional" WHERE "id" = NEW."version_de_plan_id" AND "estado" = 'BORRADOR') THEN
    RAISE EXCEPTION 'BE: los rangos se escriben solo en un BORRADOR; activada, la versión es inmutable (INV-06-109)' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW."revision" <> 1 THEN
      RAISE EXCEPTION 'BE: los rangos empiezan en la revisión 1' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW."id", NEW."version_de_plan_id") IS DISTINCT FROM (OLD."id", OLD."version_de_plan_id") THEN
    RAISE EXCEPTION 'BE: los rangos conservan su versión de plan' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW."revision" <> OLD."revision" + 1 THEN
    RAISE EXCEPTION 'BE: la revisión de los rangos avanza de a uno' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "rangos_de_plan_nutricional_guardar" BEFORE INSERT OR UPDATE OR DELETE ON "rangos_de_plan_nutricional" FOR EACH ROW EXECUTE FUNCTION "be_rangos_de_plan_guardar"();
