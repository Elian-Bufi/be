# Catálogo base · los datos curados

WP-CATALOGO-BASE, DEUDA_LEGAJO **DL-141**, tramos 2 (ejercicios, D-3) y 3 (alimentos, D-4). Aprobado por Dirección el
2026-10-16 (tanda 3). Estos archivos son la fuente de las migraciones que siembran y corrigen el catálogo base y de
`docs/catalogo/FUENTES.md`. Se revisan en el PR: lo que dice cada uno es lo que queda en la base.

| Archivo | Qué tiene |
|---|---|
| `ejercicios.json` | 186 ejercicios de **wger** (https://wger.de/), con la licencia y la autoría de cada texto |
| `alimentos.json` | 385 alimentos de **USDA FoodData Central · SR Legacy** (dominio público), y los nombres que se suman a los 8 de DL-119 |
| `correcciones.json` | La correspondencia con la fuente (encargo de Dirección del 2026-10-19, bloque 4): los cortes vacunos revisados contra dos fuentes de cortes, con su nombre fiel y su condición (directa o aproximada), y los nombres alternativos retirados o sumados con el mismo criterio |

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
- **Un nombre dice lo que es.** Un nombre regional parecido no prueba una composición equivalente: el nombre de un corte
  dice la pieza que describe la fuente («Bife de vacío», el flank steak; no el vacío entero), y si la correspondencia es
  aproximada, lo dice su procedencia. Un nombre alternativo ayuda a encontrar, pero no convierte dos alimentos en el
  mismo: no va si nombra otro ingrediente u otra preparación («Copos de avena» no es la avena cocida).
- **La búsqueda no decide la curaduría.** Cuántos ítems tienen una palabra no es una regla del catálogo: el buscador
  tolera que crezca (los parecidos van del nombre más cercano a lo escrito al menos cercano, y las pruebas recorren todas
  las páginas). Hasta el 2026-10-19 había un tope de 18 sentadillas para que la de demostración no saliera de la primera
  página de la APK instalada; se quitó con ese cambio del buscador.
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
4. Generar: `node scripts/catalogo-base/generar-migracion.mjs` escribe las tres migraciones y `docs/catalogo/FUENTES.md`
   (con `--verificar`, falla si no coinciden). Correrlo dos veces da los mismos archivos: los identificadores son UUID v5
   en el espacio «be.dl-141.catalogo-base».
5. Correr la prueba de contenido: `node --test scripts/catalogo-base.test.mjs` (después de `npm run build:domain`).

**Una migración aplicada no se regenera.** Prisma guarda la suma de verificación de cada migración: una vez integradas,
`20261019120000_catalogo_base_de_ejercicios` y `20261019120100_catalogo_base_de_alimentos` quedan como están, y
`ejercicios.json` y `alimentos.json` siguen diciendo lo que sembraron. Un cambio posterior al catálogo base es una
migración nueva (y, para un ítem ya sembrado, una versión nueva: REG-06-99 a 101). Así se hizo la primera:
`correcciones.json` → `20261019210000_catalogo_base_correspondencia_de_cortes`. Un cambio más es otro archivo de
correcciones y otra carpeta, nunca esta migración regenerada.

## Qué hace la migración

- **Ejercicios:** cada uno es `CONTROLLED_IMPORT` sin profesional que lo cargue y queda en `item_externo_de_catalogo`
  (proveedor WGER y su número): importar después ese mismo ejercicio desde wger apunta a este (D-1). Si un profesional ya
  lo había importado, no se crea otro y los nombres alternativos se suman al que había.
- **Alimentos:** cada uno es `CONTROLLED_IMPORT` sin profesional, como los de referencia de DL-119, con la misma forma de
  procedencia (proveedor `USDA_FDC_SR_LEGACY`, FDC, licencia CC0-1.0 y `usdaReference`). Un FDC que ya está en el
  catálogo no se vuelve a crear.
- **Correcciones:** un corte que cambia de nombre es una versión nueva de su alimento, sucesora de la del tramo 3, con la
  misma composición, la misma disponibilidad y la misma fuente externa (se copian de la versión anterior, en la base); su
  procedencia suma la correspondencia (`DIRECTA` o `APROXIMADA`, con la pieza, la grasa, el fundamento y las fuentes). La
  versión anterior queda, con las instantáneas que la citan. Un nombre retirado es un hecho aparte
  (`retiro_de_nombre_alternativo_de_alimento`), con su motivo.
- Cada inserción saltea lo que ya está (`ON CONFLICT DO NOTHING`, `WHERE NOT EXISTS`): correrla dos veces no agrega nada.
  Solo agrega filas; no toca tablas, triggers ni lo sembrado antes.
