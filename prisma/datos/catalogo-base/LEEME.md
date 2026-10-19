# Catálogo base · los datos curados

WP-CATALOGO-BASE, DEUDA_LEGAJO **DL-141**, tramos 2 (ejercicios, D-3) y 3 (alimentos, D-4). Aprobado por Dirección el
2026-10-16 (tanda 3). Estos dos archivos son la fuente de las migraciones que siembran el catálogo base y de
`docs/catalogo/FUENTES.md`. Se revisan en el PR: lo que dice cada uno es lo que queda en la base.

| Archivo | Qué tiene |
|---|---|
| `ejercicios.json` | 186 ejercicios de **wger** (https://wger.de/), con la licencia y la autoría de cada texto |
| `alimentos.json` | 385 alimentos de **USDA FoodData Central · SR Legacy** (dominio público), y los nombres que se suman a los 8 de DL-119 |

## De dónde salió cada cosa

**Lo que decide BE (la curaduría):**
- qué entra: los ejercicios frecuentes de gimnasio, peso corporal, máquinas, mancuernas, poleas, movilidad y cardio
  básico; los alimentos frecuentes en Argentina, crudos o en preparaciones simples;
- el nombre en castellano rioplatense (en los ejercicios, la traducción de wger cuando sirve; si no, una propia);
- la preparación de cada alimento, en castellano;
- los nombres alternativos de otros países («Estocadas» AR, «Desplantes» MX, «Aguacate», «Frijoles negros» MX, «Elote» MX…).

**Lo que dice la fuente**, que escribe `scripts/catalogo-base/completar-con-las-fuentes.mjs` y nunca se edita a mano:
- **wger**, consultado el **2026-10-19** en `https://wger.de/api/v2/exerciseinfo/` (y `license`, `language`,
  `exercisecategory`, `muscle`, `equipment`): el UUID, la categoría, los músculos y el material que declara wger; la
  licencia y la autoría del ejercicio; y cada traducción usada (inglés siempre, castellano si existe), con su número, su
  licencia y su autoría. `origenDelNombre` es `WGER` si el nombre es la traducción de wger (a lo sumo con otras
  mayúsculas) y `PROPIO` si es de BE.
- **USDA**, el CSV oficial bajado el **2026-10-19** de
  `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip`
  (SHA-256 `b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0`): el NDB, la descripción original, la
  fecha de publicación, la categoría y la composición cada 100 g con los nutrientes de FoodData Central 1008 (energía,
  kcal), 1003 (proteínas), 1005 (carbohidratos «by difference»), 1004 (grasas) y 1079 (fibra), más el 1018 (alcohol) en
  las bebidas que lo tienen, solo para la prueba de coherencia (la composición del dominio no lo lleva).

## Reglas de la curaduría

- **No se inventa nada.** Un alimento sin un registro razonable en SR Legacy no entra (la yerba mate, el queso cremoso,
  el dulce de membrillo, el matambre, el pejerrey…). Uno al que SR Legacy no le informa la fibra tampoco: la composición
  tiene que estar completa.
- **Solo SR Legacy.** El proveedor del dominio para USDA es `USDA_FDC_SR_LEGACY` (DL-119); Foundation Foods sería otro
  conjunto, con otra referencia.
- **Sin licencias dudosas.** Todos los textos de wger usados declaran licencia (CC BY-SA 3.0, CC BY-SA 4.0 o CC0 1.0).
  Cuando wger no declara la autoría de un texto, queda `null` y FUENTES.md lo dice. Sin imágenes ni descripciones.
- **Nada repetido.** Ni dos ítems con el mismo nombre en un catálogo, ni un nombre igual a uno de demostración (WP-04,
  WP-06) o de DL-119 (D-5: lo sintético se queda); ni un FDC que ya sembró DL-119.
- **Nombres alternativos.** El inglés de la fuente va siempre, salvo que sea igual al nombre («Burpees», «Dulce de
  Leche»). En los ejercicios es de origen `PROVEEDOR` (wger), igual que la traducción de wger cuando es un nombre
  alternativo. En los alimentos todo es `SIEMBRA_DE_BE`: USDA no es un proveedor de la tabla de nombres. La región va solo
  cuando el nombre es de un país (ISO 3166-1 alfa-2).
- **Pocas sentadillas.** A lo sumo 18 ejercicios con la palabra «sentadilla»: la búsqueda con errores de tipeo de la APK
  instalada trae 20 por página, del más nuevo al más viejo, y la «Sentadilla» de demostración tiene que seguir apareciendo
  (lo exige la prueba de contenido).
- **Los números del proveedor falso de las pruebas** (901 a 907, `test/integration/soporte-proveedores.ts`) no son
  ejercicios del catálogo base.

## Cómo se regenera

1. Bajar las fuentes a una carpeta nueva fuera del repositorio:
   - wger: `node scripts/catalogo-base/descargar-wger.mjs <carpeta-wger>`
   - USDA: bajar y descomprimir el ZIP de arriba en `<carpeta-usda>` (y comparar su SHA-256).
2. Editar la curaduría en estos JSON: agregar un ítem es agregar `{ "wgerId", "nombre", "nombresAlternativos" }` o
   `{ "fdcId", "nombre", "grupo", "preparacion", "nombresAlternativos" }`.
3. Completar con la fuente:
   `node scripts/catalogo-base/completar-con-las-fuentes.mjs --usda <carpeta-usda>/FoodData_Central_sr_legacy_food_csv_2018-04 --wger <carpeta-wger>`
   (con `--verificar`, no escribe: falla si algo no coincide con la fuente).
4. Generar: `node scripts/catalogo-base/generar-migracion.mjs` escribe las dos migraciones y `docs/catalogo/FUENTES.md`
   (con `--verificar`, falla si no coinciden). Correrlo dos veces da los mismos archivos: los identificadores son UUID v5
   en el espacio «be.dl-141.catalogo-base».
5. Correr la prueba de contenido: `node --test scripts/catalogo-base.test.mjs` (después de `npm run build:domain`).

**Una migración aplicada no se regenera.** Prisma guarda la suma de verificación de cada migración: una vez integradas,
`20261019120000_catalogo_base_de_ejercicios` y `20261019120100_catalogo_base_de_alimentos` quedan como están. Un cambio
posterior al catálogo base es una migración nueva (y, para un ítem ya sembrado, una versión nueva: REG-06-99 a 101).

## Qué hace la migración

- **Ejercicios:** cada uno es `CONTROLLED_IMPORT` sin profesional que lo cargue y queda en `item_externo_de_catalogo`
  (proveedor WGER y su número): importar después ese mismo ejercicio desde wger apunta a este (D-1). Si un profesional ya
  lo había importado, no se crea otro y los nombres alternativos se suman al que había.
- **Alimentos:** cada uno es `CONTROLLED_IMPORT` sin profesional, como los de referencia de DL-119, con la misma forma de
  procedencia (proveedor `USDA_FDC_SR_LEGACY`, FDC, licencia CC0-1.0 y `usdaReference`). Un FDC que ya está en el
  catálogo no se vuelve a crear.
- Cada inserción saltea lo que ya está (`ON CONFLICT DO NOTHING`, `WHERE NOT EXISTS`): correrla dos veces no agrega nada.
  Solo agrega filas; no toca tablas, triggers ni lo sembrado antes.
