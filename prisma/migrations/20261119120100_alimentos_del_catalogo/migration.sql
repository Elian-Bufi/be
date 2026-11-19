-- WP-NUTRICION-ALIMENTOS (DL-180; docs/paquetes/WP-NUTRICION-ALIMENTOS.md): los alimentos del catálogo. Solo agrega: dos
-- tipos, tres tablas, sus guardias y la siembra de los grupos del catálogo base. Ninguna fila existente cambia.
--
-- - NUA-01 y NUA-02 (corregir y retirar un alimento cargado a mano) no necesitan tablas: corregir emite una versión nueva
--   y retirar una versión RETIRADO, en la cadena de siempre (REG-06-99 a 101). Los planes activados y los registros
--   conservan la versión que citan.
-- - NUA-03: `alimento_compartido`, los alimentos cargados a mano que ven los demás profesionales de Nutrición, desde que
--   su autor los carga o los corrige con el aviso a la vista (NUA-D05). Lo cargado antes no se comparte solo.
-- - NUA-04: `revision_administrativa_de_alimento`, lo que decide Administración sobre un alimento cargado a mano:
--   certificado con una fuente, equivalente de uno verificado o la decisión quitada. Una fila por decisión.
-- - NUA-05: `grupo_de_alimento`, el grupo de cada alimento (su ícono), un hecho aparte de sus versiones.

-- CreateEnum
CREATE TYPE "GrupoDeAlimento" AS ENUM ('CARNES', 'PESCADOS', 'HUEVOS', 'LACTEOS', 'CEREALES', 'LEGUMBRES', 'VERDURAS', 'FRUTAS', 'ACEITES', 'FRUTOS_SECOS', 'DULCES', 'BEBIDAS', 'OTROS');

-- CreateEnum
CREATE TYPE "ResultadoDeRevisionDeAlimento" AS ENUM ('CERTIFICADO', 'EQUIVALENTE', 'QUITADA');

-- CreateTable
CREATE TABLE "grupo_de_alimento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "grupo" "GrupoDeAlimento" NOT NULL,
    "autor_id" UUID,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_de_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alimento_compartido" (
    "elemento_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alimento_compartido_pkey" PRIMARY KEY ("elemento_id")
);

-- CreateTable
CREATE TABLE "revision_administrativa_de_alimento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "elemento_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "resultado" "ResultadoDeRevisionDeAlimento" NOT NULL,
    "version_id" UUID NOT NULL,
    "fuente" TEXT,
    "equivalente_id" UUID,
    "administrador_id" UUID NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revision_administrativa_de_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupo_de_alimento_elemento_id_numero_key" ON "grupo_de_alimento"("elemento_id", "numero");

-- CreateIndex
CREATE INDEX "revision_administrativa_de_alimento_equivalente_id_idx" ON "revision_administrativa_de_alimento"("equivalente_id");

-- CreateIndex
CREATE UNIQUE INDEX "revision_administrativa_de_alimento_elemento_id_numero_key" ON "revision_administrativa_de_alimento"("elemento_id", "numero");

-- AddForeignKey
ALTER TABLE "grupo_de_alimento" ADD CONSTRAINT "grupo_de_alimento_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "grupo_de_alimento" ADD CONSTRAINT "grupo_de_alimento_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "alimento_compartido" ADD CONSTRAINT "alimento_compartido_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "version_de_elemento_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_equivalente_id_fkey" FOREIGN KEY ("equivalente_id") REFERENCES "elemento_de_catalogo_nutricional"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "identidad"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- ─── Guardias ─────────────────────────────────────────────────────────────────────────────────────

ALTER TABLE "grupo_de_alimento" ADD CONSTRAINT "grupo_de_alimento_numero_positivo" CHECK ("numero" >= 1);
ALTER TABLE "grupo_de_alimento" ADD CONSTRAINT "grupo_de_alimento_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "alimento_compartido" ADD CONSTRAINT "alimento_compartido_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_procedencia_es_objeto" CHECK (jsonb_typeof("procedencia") = 'object');
-- Certificar cita su fuente; un equivalente nombra a otro alimento; quitar no lleva ni una ni otro.
ALTER TABLE "revision_administrativa_de_alimento" ADD CONSTRAINT "revision_administrativa_de_alimento_coherente" CHECK (
  "numero" >= 1
  AND ("fuente" IS NULL OR char_length("fuente") BETWEEN 1 AND 500)
  AND CASE "resultado"
        WHEN 'CERTIFICADO' THEN "fuente" IS NOT NULL AND "equivalente_id" IS NULL
        WHEN 'EQUIVALENTE' THEN "equivalente_id" IS NOT NULL AND "equivalente_id" <> "elemento_id"
        ELSE "fuente" IS NULL AND "equivalente_id" IS NULL
      END);

-- El grupo lo elige quien cargó el alimento a mano; sin autor, lo siembra BE con una migración. Cada uno sigue al anterior.
CREATE FUNCTION "be_grupo_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."autor_id" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "elemento_de_catalogo_nutricional" e
     WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = NEW."autor_id") THEN
    RAISE EXCEPTION 'BE: el grupo de un alimento lo elige quien lo cargó a mano' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(g."numero") FROM "grupo_de_alimento" g WHERE g."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: el grupo de un alimento sigue al anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "grupo_de_alimento_guardar" BEFORE INSERT ON "grupo_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_grupo_de_alimento_guardar"();
CREATE TRIGGER "grupo_de_alimento_solo_agregar" BEFORE UPDATE OR DELETE ON "grupo_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "grupo_de_alimento_sin_truncate" BEFORE TRUNCATE ON "grupo_de_alimento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- Se comparte solo lo cargado a mano.
CREATE FUNCTION "be_alimento_compartido_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "elemento_de_catalogo_nutricional" e WHERE e."id" = NEW."elemento_id" AND e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'BE: se comparte solo un alimento cargado a mano' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "alimento_compartido_guardar" BEFORE INSERT ON "alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_alimento_compartido_guardar"();
CREATE TRIGGER "alimento_compartido_solo_agregar" BEFORE UPDATE OR DELETE ON "alimento_compartido" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "alimento_compartido_sin_truncate" BEFORE TRUNCATE ON "alimento_compartido" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- La revisión: de un administrador con su rol vigente, sobre una versión de un alimento cargado a mano, siguiendo a la
-- anterior. El equivalente es un alimento de la tabla oficial (USDA, DL-119 y DL-141), en una versión disponible.
CREATE FUNCTION "be_revision_administrativa_de_alimento_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
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
       AND t."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = t."id")) THEN
    RAISE EXCEPTION 'BE: el equivalente es un alimento verificado y disponible' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."numero" <> COALESCE((SELECT max(r."numero") FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = NEW."elemento_id"), 0) + 1 THEN
    RAISE EXCEPTION 'BE: una revisión de un alimento sigue a la anterior' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "revision_administrativa_de_alimento_guardar" BEFORE INSERT ON "revision_administrativa_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_revision_administrativa_de_alimento_guardar"();
CREATE TRIGGER "revision_administrativa_de_alimento_solo_agregar" BEFORE UPDATE OR DELETE ON "revision_administrativa_de_alimento" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "revision_administrativa_de_alimento_sin_truncate" BEFORE TRUNCATE ON "revision_administrativa_de_alimento" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();

-- ─── NUA-05 · La siembra de los grupos ─────────────────────────────────────────────────────────────
-- El grupo de cada alimento de la tabla oficial (USDA FoodData Central · SR Legacy) sale de la curaduría del catálogo base
-- (`prisma/datos/catalogo-base/alimentos.json`, campo `grupo`, con la correspondencia de `GRUPO_DE_LA_CURADURIA` de
-- @be/domain); los ocho de DL-119 no tienen `grupo` en la curaduría y van por su FDC. Se busca cada alimento por su FDC en
-- la procedencia de sus versiones, así que vale aunque una corrección haya emitido otra (los cortes, 20261019210000).
-- Saltea lo que ya tiene grupo: correrla dos veces no agrega nada.
INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "procedencia", "momento_de_registro")
SELECT DISTINCT ON (v."elemento_id") v."elemento_id", 1, g."grupo"::"GrupoDeAlimento",
       '{"fuente":"catalogo-base-grupos","siembra":"WP-NUTRICION-ALIMENTOS · DL-180 · NUA-05","nota":"El grupo de la curaduría del catálogo base (prisma/datos/catalogo-base/alimentos.json)."}'::jsonb,
       '2026-11-19T00:00:00.000Z'::timestamptz
  FROM (VALUES
    ('168878', 'CEREALES'), -- Arroz blanco de grano largo, cocido
    ('169967', 'VERDURAS'), -- Brócoli hervido y escurrido, sin sal
    ('170394', 'VERDURAS'), -- Zanahoria hervida y escurrida, sin sal
    ('170438', 'VERDURAS'), -- Papa hervida con piel, solo pulpa comestible, sin sal
    ('171413', 'ACEITES'), -- Aceite de oliva
    ('171477', 'CARNES'), -- Pechuga de pollo sin piel, asada, parte comestible
    ('172421', 'LEGUMBRES'), -- Lentejas hervidas sin sal
    ('175168', 'PESCADOS'), -- Salmón atlántico de cultivo, cocido por calor seco
    ('168936', 'CEREALES'), -- Harina de trigo blanca de uso general, enriquecida
    ('168895', 'CEREALES'), -- Harina de trigo leudante, enriquecida
    ('168893', 'CEREALES'), -- Harina de trigo integral
    ('168867', 'CEREALES'), -- Harina de maíz amarilla (polenta), cruda
    ('169698', 'CEREALES'), -- Almidón de maíz
    ('174288', 'CEREALES'), -- Harina de garbanzos
    ('173904', 'CEREALES'), -- Avena arrollada, cruda
    ('173905', 'CEREALES'), -- Avena cocida con agua, sin sal
    ('168872', 'CEREALES'), -- Salvado de avena, crudo
    ('169722', 'CEREALES'), -- Salvado de trigo
    ('168877', 'CEREALES'), -- Arroz blanco de grano largo, crudo
    ('168880', 'CEREALES'), -- Arroz blanco de grano medio, cocido
    ('169703', 'CEREALES'), -- Arroz integral de grano largo, crudo
    ('169704', 'CEREALES'), -- Arroz integral de grano largo, cocido
    ('169736', 'CEREALES'), -- Fideos secos de trigo, crudos
    ('169737', 'CEREALES'), -- Fideos de trigo hervidos, sin sal
    ('168910', 'CEREALES'), -- Fideos integrales hervidos
    ('169731', 'CEREALES'), -- Fideos al huevo secos, crudos
    ('169732', 'CEREALES'), -- Fideos al huevo hervidos
    ('168874', 'CEREALES'), -- Quinoa cruda
    ('168917', 'CEREALES'), -- Quinoa cocida
    ('170688', 'CEREALES'), -- Trigo burgol, crudo
    ('170287', 'CEREALES'), -- Trigo burgol cocido
    ('172675', 'CEREALES'), -- Pan tipo francés o de Viena
    ('174924', 'CEREALES'), -- Pan blanco de molde (lactal)
    ('172688', 'CEREALES'), -- Pan integral de trigo, de molde
    ('168013', 'CEREALES'), -- Pan multicereal
    ('172684', 'CEREALES'), -- Pan de centeno
    ('174915', 'CEREALES'), -- Pan árabe blanco
    ('174928', 'CEREALES'), -- Pan rallado común
    ('175036', 'CEREALES'), -- Tortilla de maíz
    ('175037', 'CEREALES'), -- Tortilla de harina de trigo
    ('172746', 'CEREALES'), -- Galletitas saladas tipo soda
    ('174950', 'CEREALES'), -- Galletitas de manteca
    ('174987', 'CEREALES'), -- Croissant de manteca
    ('172706', 'CEREALES'), -- Bizcochuelo
    ('175024', 'CEREALES'), -- Masa para tarta, cruda
    ('167959', 'CEREALES'), -- Pochoclo sin aceite
    ('170250', 'CEREALES'), -- Galletas de arroz inflado integral, sin sal
    ('169677', 'CEREALES'), -- Papas fritas de paquete, saladas
    ('171646', 'CEREALES'), -- Granola casera
    ('172420', 'LEGUMBRES'), -- Lentejas secas, crudas
    ('174284', 'LEGUMBRES'), -- Lentejas rojas secas, crudas
    ('173756', 'LEGUMBRES'), -- Garbanzos secos, crudos
    ('173757', 'LEGUMBRES'), -- Garbanzos hervidos, sin sal
    ('173800', 'LEGUMBRES'), -- Garbanzos en lata, escurridos
    ('173734', 'LEGUMBRES'), -- Porotos negros secos, crudos
    ('173735', 'LEGUMBRES'), -- Porotos negros hervidos, sin sal
    ('175202', 'LEGUMBRES'), -- Porotos blancos secos, crudos
    ('175203', 'LEGUMBRES'), -- Porotos blancos hervidos, sin sal
    ('173744', 'LEGUMBRES'), -- Porotos colorados secos, crudos
    ('175194', 'LEGUMBRES'), -- Porotos colorados hervidos, sin sal
    ('174270', 'LEGUMBRES'), -- Porotos de soja secos, crudos
    ('174271', 'LEGUMBRES'), -- Porotos de soja hervidos, sin sal
    ('169282', 'LEGUMBRES'), -- Porotos de soja verdes (edamame), crudos
    ('172429', 'LEGUMBRES'), -- Arvejas secas partidas, hervidas, sin sal
    ('170377', 'LEGUMBRES'), -- Habas frescas, crudas
    ('170378', 'LEGUMBRES'), -- Habas frescas hervidas, sin sal
    ('172475', 'LEGUMBRES'), -- Tofu firme
    ('172476', 'LEGUMBRES'), -- Tofu blando
    ('174289', 'LEGUMBRES'), -- Hummus comercial
    ('172446', 'LEGUMBRES'), -- Bebida de soja sin fortificar
    ('174832', 'LEGUMBRES'), -- Bebida de almendras sin azúcar
    ('169957', 'LEGUMBRES'), -- Brotes de soja (de poroto mung), crudos
    ('169991', 'VERDURAS'), -- Acelga cruda
    ('170401', 'VERDURAS'), -- Acelga hervida, sin sal
    ('168462', 'VERDURAS'), -- Espinaca cruda
    ('168463', 'VERDURAS'), -- Espinaca hervida, sin sal
    ('169247', 'VERDURAS'), -- Lechuga romana cruda
    ('169249', 'VERDURAS'), -- Lechuga de hoja verde, cruda
    ('168429', 'VERDURAS'), -- Lechuga mantecosa, cruda
    ('169248', 'VERDURAS'), -- Lechuga capuchina (iceberg), cruda
    ('169387', 'VERDURAS'), -- Rúcula cruda
    ('170068', 'VERDURAS'), -- Berro crudo
    ('169992', 'VERDURAS'), -- Radicheta cruda
    ('168421', 'VERDURAS'), -- Kale crudo
    ('169975', 'VERDURAS'), -- Repollo blanco crudo
    ('169977', 'VERDURAS'), -- Repollo colorado crudo
    ('170383', 'VERDURAS'), -- Repollitos de Bruselas crudos
    ('169986', 'VERDURAS'), -- Coliflor cruda
    ('170397', 'VERDURAS'), -- Coliflor hervida, sin sal
    ('170379', 'VERDURAS'), -- Brócoli crudo
    ('170457', 'VERDURAS'), -- Tomate rojo maduro, crudo
    ('170051', 'VERDURAS'), -- Tomate pelado en lata, en su jugo
    ('170460', 'VERDURAS'), -- Puré de tomate sin sal agregada
    ('170459', 'VERDURAS'), -- Extracto de tomate sin sal agregada
    ('170393', 'VERDURAS'), -- Zanahoria cruda
    ('169295', 'VERDURAS'), -- Zapallo anco crudo
    ('169296', 'VERDURAS'), -- Zapallo anco al horno, sin sal
    ('168448', 'VERDURAS'), -- Zapallo crudo
    ('168449', 'VERDURAS'), -- Zapallo hervido, sin sal
    ('169291', 'VERDURAS'), -- Zucchini crudo
    ('169292', 'VERDURAS'), -- Zucchini hervido, sin sal
    ('169228', 'VERDURAS'), -- Berenjena cruda
    ('170108', 'VERDURAS'), -- Morrón rojo crudo
    ('170427', 'VERDURAS'), -- Morrón verde crudo
    ('169383', 'VERDURAS'), -- Morrón amarillo crudo
    ('170106', 'VERDURAS'), -- Ají picante rojo, crudo
    ('170000', 'VERDURAS'), -- Cebolla cruda
    ('170005', 'VERDURAS'), -- Cebolla de verdeo cruda
    ('169246', 'VERDURAS'), -- Puerro crudo
    ('169230', 'VERDURAS'), -- Ajo crudo
    ('168409', 'VERDURAS'), -- Pepino con cáscara, crudo
    ('169988', 'VERDURAS'), -- Apio crudo
    ('169276', 'VERDURAS'), -- Rabanito crudo
    ('169145', 'VERDURAS'), -- Remolacha cruda
    ('169146', 'VERDURAS'), -- Remolacha hervida
    ('169961', 'VERDURAS'), -- Chauchas crudas
    ('169141', 'VERDURAS'), -- Chauchas hervidas, sin sal
    ('170419', 'VERDURAS'), -- Arvejas frescas, crudas
    ('170017', 'VERDURAS'), -- Arvejas congeladas, hervidas, sin sal
    ('169998', 'VERDURAS'), -- Choclo amarillo crudo
    ('169999', 'VERDURAS'), -- Choclo amarillo hervido, sin sal
    ('169214', 'VERDURAS'), -- Choclo amarillo en lata, escurrido
    ('170026', 'VERDURAS'), -- Papa cruda con cáscara
    ('170093', 'VERDURAS'), -- Papa al horno con cáscara, sin sal
    ('170440', 'VERDURAS'), -- Papa hervida sin cáscara, sin sal
    ('168555', 'VERDURAS'), -- Puré de papas casero con leche entera y manteca
    ('170118', 'VERDURAS'), -- Papas fritas congeladas, al horno, sin sal agregada
    ('168482', 'VERDURAS'), -- Batata cruda
    ('168483', 'VERDURAS'), -- Batata al horno con cáscara, sin sal
    ('168484', 'VERDURAS'), -- Batata hervida sin cáscara
    ('169985', 'VERDURAS'), -- Mandioca cruda
    ('169251', 'VERDURAS'), -- Champiñones crudos
    ('168569', 'VERDURAS'), -- Palmitos en lata
    ('169096', 'VERDURAS'), -- Aceitunas verdes en salmuera
    ('169094', 'VERDURAS'), -- Aceitunas negras en lata
    ('168389', 'VERDURAS'), -- Espárragos crudos
    ('169205', 'VERDURAS'), -- Alcaucil crudo
    ('170416', 'VERDURAS'), -- Perejil fresco
    ('168558', 'VERDURAS'), -- Pepinillos en vinagre
    ('171688', 'FRUTAS'), -- Manzana con cáscara, cruda
    ('171689', 'FRUTAS'), -- Manzana sin cáscara, cruda
    ('169118', 'FRUTAS'), -- Pera cruda
    ('173944', 'FRUTAS'), -- Banana cruda
    ('169097', 'FRUTAS'), -- Naranja cruda
    ('169098', 'FRUTAS'), -- Jugo de naranja recién exprimido
    ('169105', 'FRUTAS'), -- Mandarina cruda
    ('174673', 'FRUTAS'), -- Pomelo rosado crudo
    ('167746', 'FRUTAS'), -- Limón sin cáscara, crudo
    ('167747', 'FRUTAS'), -- Jugo de limón exprimido
    ('167762', 'FRUTAS'), -- Frutillas crudas
    ('169928', 'FRUTAS'), -- Durazno amarillo crudo
    ('169112', 'FRUTAS'), -- Duraznos en almíbar
    ('171697', 'FRUTAS'), -- Damasco crudo
    ('169949', 'FRUTAS'), -- Ciruela cruda
    ('168162', 'FRUTAS'), -- Ciruelas pasas
    ('174683', 'FRUTAS'), -- Uvas crudas
    ('168165', 'FRUTAS'), -- Pasas de uva negras, sin semilla
    ('168153', 'FRUTAS'), -- Kiwi crudo
    ('169124', 'FRUTAS'), -- Ananá crudo
    ('169910', 'FRUTAS'), -- Mango crudo
    ('169926', 'FRUTAS'), -- Mamón crudo
    ('169092', 'FRUTAS'), -- Melón cantalupo crudo
    ('167765', 'FRUTAS'), -- Sandía cruda
    ('171719', 'FRUTAS'), -- Cerezas crudas
    ('171711', 'FRUTAS'), -- Arándanos crudos
    ('167755', 'FRUTAS'), -- Frambuesas crudas
    ('173021', 'FRUTAS'), -- Higos frescos
    ('174665', 'FRUTAS'), -- Higos secos
    ('169108', 'FRUTAS'), -- Maracuyá crudo
    ('170169', 'FRUTAS'), -- Coco fresco
    ('170170', 'FRUTAS'), -- Coco rallado sin azúcar
    ('171705', 'FRUTAS'), -- Palta cruda
    ('168191', 'FRUTAS'), -- Dátiles medjool
    ('173933', 'FRUTAS'), -- Jugo de manzana envasado, sin azúcar agregada
    ('171695', 'FRUTAS'), -- Puré de manzana sin azúcar
    ('171767', 'CARNES'), -- Lomo vacuno, magro, crudo
    ('170641', 'CARNES'), -- Lomo vacuno, magro, a la parrilla
    ('173116', 'CARNES'), -- Bife de chorizo, magro, crudo
    ('171813', 'CARNES'), -- Bife de chorizo, magro, asado
    ('172143', 'CARNES'), -- Ojo de bife, magro, crudo
    ('172142', 'CARNES'), -- Ojo de bife, magro, a la parrilla
    ('174055', 'CARNES'), -- Cuadril, magro, crudo
    ('168634', 'CARNES'), -- Cuadril, magro, asado
    ('173998', 'CARNES'), -- Peceto, magro, crudo
    ('170633', 'CARNES'), -- Peceto, magro, al horno
    ('171757', 'CARNES'), -- Nalga vacuna, magra, cruda
    ('168649', 'CARNES'), -- Nalga vacuna, magra, a la parrilla
    ('173125', 'CARNES'), -- Bola de lomo, magra, cruda
    ('169563', 'CARNES'), -- Vacío, magro y grasa, crudo
    ('168733', 'CARNES'), -- Vacío, magro y grasa, asado
    ('168745', 'CARNES'), -- Entraña, magra, asada
    ('170612', 'CARNES'), -- Pecho vacuno, magro, braseado
    ('169441', 'CARNES'), -- Osobuco vacuno, magro, crudo
    ('169480', 'CARNES'), -- Paleta vacuna, magra, cruda
    ('171790', 'CARNES'), -- Carne picada vacuna 95 % magra, cruda
    ('174028', 'CARNES'), -- Carne picada vacuna 95 % magra, dorada a la sartén
    ('174030', 'CARNES'), -- Carne picada vacuna 90 % magra, cruda
    ('171796', 'CARNES'), -- Carne picada vacuna 85 % magra, cruda
    ('174036', 'CARNES'), -- Carne picada vacuna 80 % magra, cruda
    ('171799', 'CARNES'), -- Carne picada vacuna 80 % magra, dorada a la sartén
    ('168652', 'CARNES'), -- Carne picada vacuna 70 % magra, cruda
    ('171797', 'CARNES'), -- Medallón de carne picada 80 % magra, asado
    ('169451', 'CARNES'), -- Hígado vacuno crudo
    ('168627', 'CARNES'), -- Hígado vacuno a la sartén
    ('170599', 'CARNES'), -- Mondongo crudo
    ('174769', 'CARNES'), -- Mondongo hervido
    ('170196', 'CARNES'), -- Lengua vacuna cruda
    ('170598', 'CARNES'), -- Lengua vacuna hervida
    ('170194', 'CARNES'), -- Molleja vacuna cruda
    ('175269', 'CARNES'), -- Nalga de ternera, magra, cruda
    ('173822', 'CARNES'), -- Nalga de ternera, magra, al horno
    ('174313', 'CARNES'), -- Pierna de cordero, magra, cruda
    ('174314', 'CARNES'), -- Pierna de cordero, magra, al horno
    ('172493', 'CARNES'), -- Costillar de cordero, magro, crudo
    ('172495', 'CARNES'), -- Costillar de cordero, magro, al horno
    ('175303', 'CARNES'), -- Carne de chivo, cruda
    ('175304', 'CARNES'), -- Carne de chivo al horno
    ('172521', 'CARNES'), -- Conejo crudo
    ('168249', 'CARNES'), -- Solomillo de cerdo, magro, crudo
    ('168250', 'CARNES'), -- Solomillo de cerdo, magro, al horno
    ('168302', 'CARNES'), -- Carré de cerdo deshuesado, magro, crudo
    ('167829', 'CARNES'), -- Costeleta de cerdo, magra, cruda
    ('168240', 'CARNES'), -- Costeleta de cerdo, magra, asada
    ('168262', 'CARNES'), -- Bondiola de cerdo, magra, asada
    ('167853', 'CARNES'), -- Pechito de cerdo, magro y grasa, crudo
    ('167854', 'CARNES'), -- Pechito de cerdo, magro y grasa, braseado
    ('167902', 'CARNES'), -- Carne picada de cerdo, cruda
    ('168277', 'CARNES'), -- Panceta ahumada, cruda
    ('173864', 'CARNES'), -- Jamón cocido feteado
    ('174573', 'CARNES'), -- Mortadela
    ('174603', 'CARNES'), -- Salame tipo italiano, de cerdo
    ('172968', 'CARNES'), -- Salchichas tipo Viena
    ('171624', 'CARNES'), -- Salchichas de pollo
    ('171077', 'CARNES'), -- Pechuga de pollo sin piel ni hueso, cruda
    ('171534', 'CARNES'), -- Pechuga de pollo sin piel, a la parrilla
    ('171478', 'CARNES'), -- Pechuga de pollo sin piel, hervida
    ('171474', 'CARNES'), -- Pechuga de pollo con piel, cruda
    ('171075', 'CARNES'), -- Pechuga de pollo con piel, al horno
    ('172385', 'CARNES'), -- Muslo de pollo con piel, crudo
    ('173625', 'CARNES'), -- Muslo de pollo con piel, al horno
    ('172373', 'CARNES'), -- Pata de pollo con piel, cruda
    ('172378', 'CARNES'), -- Pata muslo de pollo con piel, cruda
    ('172390', 'CARNES'), -- Alitas de pollo con piel, crudas
    ('173630', 'CARNES'), -- Alitas de pollo con piel, al horno
    ('171447', 'CARNES'), -- Pollo entero con piel, crudo
    ('171450', 'CARNES'), -- Pollo entero con piel, al horno
    ('171054', 'CARNES'), -- Pollo sin piel, al horno
    ('171060', 'CARNES'), -- Hígado de pollo crudo
    ('174491', 'CARNES'), -- Hígado de pollo a la sartén
    ('171098', 'CARNES'), -- Pechuga de pavo sin piel, cruda
    ('171496', 'CARNES'), -- Pechuga de pavo sin piel, al horno
    ('171505', 'CARNES'), -- Carne picada de pavo, cruda
    ('173713', 'PESCADOS'), -- Merluza (whiting), cruda
    ('175161', 'PESCADOS'), -- Merluza (whiting) cocida por calor seco
    ('173709', 'PESCADOS'), -- Atún claro al natural, escurrido
    ('173708', 'PESCADOS'), -- Atún claro en aceite, escurrido
    ('175159', 'PESCADOS'), -- Atún aleta amarilla fresco, crudo
    ('175139', 'PESCADOS'), -- Sardinas en aceite, escurridas
    ('175119', 'PESCADOS'), -- Caballa cruda
    ('175167', 'PESCADOS'), -- Salmón atlántico de cultivo, crudo
    ('175138', 'PESCADOS'), -- Salmón rosado crudo
    ('173717', 'PESCADOS'), -- Trucha arco iris de cultivo, cruda
    ('174196', 'PESCADOS'), -- Lenguado crudo
    ('171955', 'PESCADOS'), -- Bacalao fresco, crudo
    ('174190', 'PESCADOS'), -- Bacalao seco y salado
    ('175176', 'PESCADOS'), -- Tilapia cruda
    ('174183', 'PESCADOS'), -- Anchoas en aceite, escurridas
    ('174223', 'PESCADOS'), -- Calamar crudo
    ('171982', 'PESCADOS'), -- Calamar frito
    ('174216', 'PESCADOS'), -- Mejillones crudos
    ('174217', 'PESCADOS'), -- Mejillones cocidos al vapor
    ('174214', 'PESCADOS'), -- Almejas crudas
    ('174218', 'PESCADOS'), -- Pulpo crudo
    ('174249', 'PESCADOS'), -- Pulpo hervido
    ('174210', 'PESCADOS'), -- Langostinos y camarones crudos
    ('171971', 'PESCADOS'), -- Langostinos y camarones hervidos
    ('174203', 'PESCADOS'), -- Kanikama (imitación de cangrejo de surimi)
    ('171287', 'HUEVOS'), -- Huevo de gallina entero, crudo
    ('173424', 'HUEVOS'), -- Huevo duro
    ('173423', 'HUEVOS'), -- Huevo frito
    ('172187', 'HUEVOS'), -- Huevos revueltos
    ('172186', 'HUEVOS'), -- Huevo poché
    ('172185', 'HUEVOS'), -- Omelette de huevo
    ('172183', 'HUEVOS'), -- Clara de huevo cruda
    ('172184', 'HUEVOS'), -- Yema de huevo cruda
    ('172191', 'HUEVOS'), -- Huevo de codorniz crudo
    ('171265', 'LACTEOS'), -- Leche entera (3,25 % de grasa)
    ('171267', 'LACTEOS'), -- Leche parcialmente descremada (2 % de grasa)
    ('170872', 'LACTEOS'), -- Leche parcialmente descremada (1 % de grasa)
    ('171269', 'LACTEOS'), -- Leche descremada fluida
    ('173454', 'LACTEOS'), -- Leche en polvo entera
    ('170877', 'LACTEOS'), -- Leche en polvo descremada
    ('171275', 'LACTEOS'), -- Leche condensada azucarada
    ('170879', 'LACTEOS'), -- Leche chocolatada entera
    ('171284', 'LACTEOS'), -- Yogur natural entero
    ('170887', 'LACTEOS'), -- Yogur natural descremado
    ('171304', 'LACTEOS'), -- Yogur griego natural entero
    ('170894', 'LACTEOS'), -- Yogur griego natural descremado
    ('173456', 'LACTEOS'), -- Yogur con frutas, parcialmente descremado
    ('173461', 'LACTEOS'), -- Dulce de leche
    ('167575', 'LACTEOS'), -- Helado de crema sabor vainilla
    ('168809', 'LACTEOS'), -- Helado de chocolate
    ('167574', 'LACTEOS'), -- Flan casero con caramelo
    ('168782', 'LACTEOS'), -- Arroz con leche listo para consumir
    ('169596', 'LACTEOS'), -- Gelatina de postre preparada con agua
    ('170859', 'LACTEOS'), -- Crema de leche para batir
    ('170845', 'LACTEOS'), -- Queso muzzarella de leche entera
    ('171244', 'LACTEOS'), -- Queso muzzarella semidescremada, baja humedad
    ('171247', 'LACTEOS'), -- Queso parmesano rallado
    ('170850', 'LACTEOS'), -- Queso provolone
    ('172175', 'LACTEOS'), -- Queso azul
    ('173414', 'LACTEOS'), -- Queso cheddar
    ('171251', 'LACTEOS'), -- Queso suizo (emmental)
    ('171241', 'LACTEOS'), -- Queso gouda
    ('173419', 'LACTEOS'), -- Queso edam
    ('170849', 'LACTEOS'), -- Queso port salut
    ('170851', 'LACTEOS'), -- Ricota de leche entera
    ('171248', 'LACTEOS'), -- Ricota de leche parcialmente descremada
    ('173418', 'LACTEOS'), -- Queso crema
    ('172179', 'LACTEOS'), -- Queso cottage
    ('173420', 'LACTEOS'), -- Queso feta
    ('173435', 'LACTEOS'), -- Queso de cabra blando
    ('171025', 'ACEITES'), -- Aceite de girasol
    ('172338', 'ACEITES'), -- Aceite de girasol alto oleico
    ('171029', 'ACEITES'), -- Aceite de maíz
    ('171411', 'ACEITES'), -- Aceite de soja
    ('172336', 'ACEITES'), -- Aceite de canola
    ('171412', 'ACEITES'), -- Aceite de coco
    ('173410', 'ACEITES'), -- Manteca con sal
    ('173430', 'ACEITES'), -- Manteca sin sal
    ('171400', 'ACEITES'), -- Grasa vacuna
    ('171401', 'ACEITES'), -- Grasa de cerdo
    ('172346', 'ACEITES'), -- Margarina (80 % de grasa), con sal
    ('171009', 'ACEITES'), -- Mayonesa
    ('173594', 'ACEITES'), -- Mayonesa liviana
    ('170567', 'FRUTOS_SECOS'), -- Almendras crudas
    ('170187', 'FRUTOS_SECOS'), -- Nueces de nogal, peladas
    ('170581', 'FRUTOS_SECOS'), -- Avellanas crudas
    ('170162', 'FRUTOS_SECOS'), -- Castañas de cajú crudas
    ('170184', 'FRUTOS_SECOS'), -- Pistachos crudos
    ('170182', 'FRUTOS_SECOS'), -- Nueces pecán
    ('170569', 'FRUTOS_SECOS'), -- Nueces de Brasil
    ('172430', 'FRUTOS_SECOS'), -- Maní crudo
    ('173806', 'FRUTOS_SECOS'), -- Maní tostado sin sal
    ('172470', 'FRUTOS_SECOS'), -- Pasta de maní cremosa, sin sal
    ('170554', 'FRUTOS_SECOS'), -- Semillas de chía
    ('169414', 'FRUTOS_SECOS'), -- Semillas de lino
    ('170562', 'FRUTOS_SECOS'), -- Semillas de girasol peladas
    ('170556', 'FRUTOS_SECOS'), -- Semillas de zapallo peladas
    ('170150', 'FRUTOS_SECOS'), -- Semillas de sésamo
    ('170189', 'FRUTOS_SECOS'), -- Tahini (pasta de sésamo)
    ('169655', 'DULCES'), -- Azúcar blanca común
    ('168833', 'DULCES'), -- Azúcar negra
    ('169656', 'DULCES'), -- Azúcar impalpable
    ('169640', 'DULCES'), -- Miel de abejas
    ('169641', 'DULCES'), -- Mermelada de frutas
    ('169593', 'DULCES'), -- Cacao amargo en polvo
    ('167587', 'DULCES'), -- Chocolate con leche
    ('167976', 'DULCES'), -- Chocolate semiamargo
    ('170273', 'DULCES'), -- Chocolate amargo (70 a 85 % de cacao)
    ('167990', 'DULCES'), -- Caramelos duros
    ('173647', 'BEBIDAS'), -- Agua potable de red
    ('174842', 'BEBIDAS'), -- Soda
    ('171890', 'BEBIDAS'), -- Café de filtro preparado
    ('171891', 'BEBIDAS'), -- Café expreso
    ('171893', 'BEBIDAS'), -- Café instantáneo en polvo
    ('173227', 'BEBIDAS'), -- Té negro preparado
    ('171917', 'BEBIDAS'), -- Té verde preparado
    ('174852', 'BEBIDAS'), -- Gaseosa cola común
    ('173205', 'BEBIDAS'), -- Gaseosa lima-limón común
    ('171869', 'BEBIDAS'), -- Agua tónica
    ('168746', 'BEBIDAS'), -- Cerveza común
    ('173190', 'BEBIDAS'), -- Vino tinto de mesa
    ('174837', 'BEBIDAS'), -- Vino blanco de mesa
    ('174815', 'BEBIDAS'), -- Bebida destilada de 40 % (gin, ron, vodka, whisky)
    ('173468', 'OTROS'), -- Sal fina de mesa
    ('172237', 'OTROS'), -- Vinagre de alcohol
    ('173469', 'OTROS'), -- Vinagre de manzana
    ('172234', 'OTROS'), -- Mostaza preparada
    ('168556', 'OTROS'), -- Kétchup
    ('174277', 'OTROS'), -- Salsa de soja
    ('170931', 'OTROS'), -- Pimienta negra molida
    ('170932', 'OTROS'), -- Pimienta de cayena
    ('171329', 'OTROS'), -- Pimentón
    ('171328', 'OTROS'), -- Orégano seco
    ('170923', 'OTROS'), -- Comino en semillas
    ('171320', 'OTROS'), -- Canela molida
    ('171326', 'OTROS'), -- Nuez moscada molida
    ('171325', 'OTROS'), -- Ajo en polvo
    ('175043', 'OTROS'), -- Levadura seca de panadería
    ('172803', 'OTROS'), -- Polvo de hornear
    ('174536', 'OTROS'), -- Caldo de pollo listo para consumir
    ('171538', 'OTROS')  -- Caldo de carne listo para consumir
  ) AS g("fdc", "grupo")
  JOIN "version_de_elemento_nutricional" v
    ON v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY' AND v."procedencia" -> 'fuenteExterna' ->> 'externalId' = g."fdc"
 WHERE NOT EXISTS (SELECT 1 FROM "grupo_de_alimento" x WHERE x."elemento_id" = v."elemento_id")
 ORDER BY v."elemento_id";

-- Los de demostración de WP-04 (sintéticos), por su identificador.
INSERT INTO "grupo_de_alimento" ("elemento_id", "numero", "grupo", "procedencia", "momento_de_registro")
SELECT d."id"::uuid, 1, d."grupo"::"GrupoDeAlimento",
       '{"fuente":"catalogo-sintetico-wp04","siembra":"WP-NUTRICION-ALIMENTOS · DL-180 · NUA-05","nota":"El grupo del catálogo de demostración de WP-04."}'::jsonb,
       '2026-11-19T00:00:00.000Z'::timestamptz
  FROM (VALUES
    ('c76065f4-cfaf-4e86-8cf5-297a557a18f5', 'CEREALES'),     -- Arroz blanco
    ('b5b80403-b196-4961-8f9e-3ec31a7faf52', 'CEREALES'),     -- Arroz integral
    ('d23db71c-a95f-4ad8-87a9-51e47fb7ac2e', 'CEREALES'),     -- Fideos secos
    ('c03d2e0a-1915-4202-8d48-ecd4ce4dac56', 'VERDURAS'),     -- Papa
    ('c8217184-c49e-4b11-8c3a-c316b1b09ab7', 'VERDURAS'),     -- Batata
    ('1d73a14d-1fa1-4a10-84c2-3b7537c5b520', 'CEREALES'),     -- Avena arrollada
    ('14a1912d-d5e1-42b7-87e2-a1508aa947bf', 'CEREALES'),     -- Pan integral
    ('2a83fdae-3244-4b9f-8fe0-8d423861f382', 'CEREALES'),     -- Pan francés
    ('fdac8b88-6dbe-4406-86b0-bf0c155ce0e2', 'CARNES'),       -- Pechuga de pollo
    ('371c1568-f138-4236-8ab9-15ce21dc1eb6', 'CARNES'),       -- Carne vacuna magra
    ('c1636c35-bbec-48d8-8590-177565d1e2e0', 'PESCADOS'),     -- Merluza
    ('77026f96-bd1d-440c-8158-e28e6df3d67a', 'HUEVOS'),       -- Huevo
    ('41c1705e-aad6-4d57-8ab4-fef172f538ae', 'LEGUMBRES'),    -- Lentejas
    ('b283eb32-c57d-4662-8c4a-bddbc9133dd6', 'LEGUMBRES'),    -- Garbanzos
    ('5a0f80cb-ca00-4a8c-8ea0-02dd0ba7fdc8', 'LEGUMBRES'),    -- Tofu
    ('77ace701-cd14-49c6-877c-1a858da71bcd', 'LACTEOS'),      -- Leche descremada
    ('121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1', 'LACTEOS'),      -- Yogur natural
    ('025d7e5b-124c-416f-83e1-bbdd1cf78f20', 'LACTEOS'),      -- Queso fresco
    ('8a7b3d47-778a-40e9-8116-04a6702c28e0', 'LACTEOS'),      -- Ricota
    ('eaf534d4-f839-4acc-8a6d-53d8dc359e29', 'FRUTAS'),       -- Manzana
    ('c6113e6e-e6c2-4f79-8a98-5f9d836b8018', 'FRUTAS'),       -- Banana
    ('404ca218-947b-4c73-8990-0e626928050c', 'FRUTAS'),       -- Naranja
    ('fb220d6d-ccfd-4eb5-8bf3-5b9e370cccb0', 'FRUTAS'),       -- Frutillas
    ('fe14b950-2fe4-47f1-84c9-cd842c31ff6d', 'VERDURAS'),     -- Lechuga
    ('97b275d1-6517-4dcf-825b-a348063a9144', 'VERDURAS'),     -- Tomate
    ('1b1539fc-63cd-4c1d-896d-a382e226cccc', 'VERDURAS'),     -- Zanahoria
    ('29110cf4-5657-4bc1-810b-0867712e8d0f', 'VERDURAS'),     -- Zapallo
    ('513510d2-911c-4042-8e58-0a58e712a4d3', 'VERDURAS'),     -- Brócoli
    ('080d39b0-cf43-4331-866f-9d01b460338c', 'VERDURAS'),     -- Espinaca
    ('72b8f490-c8d1-4eab-8562-f0be2ee21476', 'VERDURAS'),     -- Cebolla
    ('93f1554d-0039-4c43-817e-11cabd37f75a', 'ACEITES'),      -- Aceite de oliva
    ('89b288a3-ab81-4ffd-818b-d0d188564dda', 'FRUTAS'),       -- Palta
    ('14a4a789-8c9c-4790-84aa-e2f02391702d', 'FRUTOS_SECOS'), -- Nueces
    ('3f82653e-ee1e-465d-8248-960766985b91', 'FRUTOS_SECOS'), -- Almendras
    ('106f74b8-7861-4e7e-892e-5a01f7af2d2c', 'FRUTOS_SECOS'), -- Mantequilla de maní
    ('4bab8794-97dc-4abd-8da3-e45adb3cda12', 'DULCES'),       -- Miel
    ('f513c235-14ad-4ed0-851b-3953553cb2c7', 'BEBIDAS'),      -- Café sin azúcar
    ('2f3f7128-5d8c-42c9-836d-443944afe4b5', 'BEBIDAS'),      -- Té sin azúcar
    ('58372e24-4c8a-4433-8eb4-0b8c6ca4a47f', 'BEBIDAS'),      -- Agua
    ('88714e7a-76a3-4b74-88d1-1a5524773df8', 'BEBIDAS')       -- Jugo de naranja exprimido
  ) AS d("id", "grupo")
 WHERE EXISTS (SELECT 1 FROM "elemento_de_catalogo_nutricional" e WHERE e."id" = d."id"::uuid)
   AND NOT EXISTS (SELECT 1 FROM "grupo_de_alimento" x WHERE x."elemento_id" = d."id"::uuid);
