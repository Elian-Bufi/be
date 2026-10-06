# BE · Tres recetas de demostración y cálculo verificable

Fotos generadas por IA para el catálogo de prueba. Una receta rinde una porción. Las fotos son ilustrativas: los gramos los define la ficha, no la imagen. Estas opciones sirven para probar el software; no se presentan como equivalencias nutricionales ni como prescripción personalizada.

## Valores esperados para una porción

| Receta | kcal | Carbohidratos | Grasas | Proteínas |
|---|---:|---:|---:|---:|
| Pollo con arroz y verduras | 529 | 56,6 g | 13,2 g | 44,0 g |
| Salmón con papa y brócoli | 580 | 51,5 g | 24,2 g | 39,6 g |
| Lentejas con arroz y verduras | 459 | 75,1 g | 9,4 g | 21,3 g |

Todos los ingredientes se pesan en su parte comestible después de la cocción indicada, salvo el aceite, que se pesa listo para usar. No son pesos de compra en crudo. No se aplican factores de cocción adicionales a estos datos cocidos.

## Método y alcance de la verificación

Para cada nutriente: suma de (gramos del ingrediente / 100 × nutriente por 100 g). Las kcal se suman desde la energía declarada por USDA. No se obliga a que coincidan con proteínas×4 + carbohidratos×4 + grasas×9. Se mantienen valores sin redondear y se redondea solo para mostrar: kcal a entero y gramos a un decimal, HALF_UP.

Carbohidratos corresponde a «Carbohydrate, by difference» de USDA; no representa carbohidratos netos. La fibra se conserva en el conjunto para trazabilidad, aunque la franja de la UI muestre solo cuatro columnas. No se resta la fibra arbitrariamente.

Estos resultados son exactos para la aritmética y los datos seleccionados; son estimaciones nutricionales para alimentos reales, que tienen variabilidad. No se midieron las comidas de las imágenes. La ejecución de verificar_calculos.py acredita el conjunto, no el backend, las cargas de foto ni la APK de BE.

Fuentes: ocho registros completos de [USDA FoodData Central](https://fdc.nal.usda.gov/), consultados directamente mediante su [API oficial](https://fdc.nal.usda.gov/api-guide/) el 5/10/2026. Dataset SR Legacy (versión histórica final 2018; publicación FDC de estos registros 1/4/2019). Sus datos son de dominio público/CC0 según la guía de la API. No se presenta como una descarga de la versión más reciente de todos los alimentos.

Los registros originales seleccionados están en datos/usda_fuentes_completas.json. El brócoli usado es FDC 169967, cocido/hervido/escurrido; no se usó el registro crudo 170379 ni el congelado 170380.

## Pollo con arroz y verduras

Pechuga asada con arroz blanco, brócoli y zanahoria.

Archivo: fotos/01_pollo_arroz_verduras.png · Identificador: BE-DEMO-NUT-001 · Peso comestible total de la receta: 438 g.

| Ingrediente y estado | Cantidad | FDC |
|---|---:|---:|
| Pechuga de pollo sin piel, asada, parte comestible | 120 g | 171477 |
| Arroz blanco de grano largo, cocido | 160 g | 168878 |
| Brócoli hervido y escurrido, sin sal | 80 g | 169967 |
| Zanahoria hervida y escurrida, sin sal | 70 g | 170394 |
| Aceite de oliva | 8 g | 171413 |

**Preparación**

1. Cociná la pechuga sin piel al horno, sin aceite adicional. Comprobá 74 °C en el centro con termómetro. Una vez cocida, pesá 120 g de la parte comestible y cortala en láminas.
2. Cociná el arroz en agua sin aceite añadido y pesá 160 g del arroz cocido.
3. Herví por separado el brócoli y la zanahoria hasta la textura deseada. Escurrí y pesá 80 g de brócoli y 70 g de zanahoria.
4. Serví los ingredientes y distribuí los 8 g de aceite de oliva pesados sobre el arroz y las verduras. Ese es todo el aceite incluido en el cálculo.

Total sin redondear: 529,220 kcal; 56,570 g de carbohidratos; 13,186 g de grasas; 43,964 g de proteínas.

## Salmón con papa y brócoli

Salmón al horno con papa hervida y brócoli.

Archivo: fotos/02_salmon_papa_brocoli.png · Identificador: BE-DEMO-NUT-002 · Peso comestible total de la receta: 475 g.

| Ingrediente y estado | Cantidad | FDC |
|---|---:|---:|
| Salmón atlántico de cultivo, cocido por calor seco | 150 g | 175168 |
| Papa hervida con piel, solo pulpa comestible, sin sal | 220 g | 170438 |
| Brócoli hervido y escurrido, sin sal | 100 g | 169967 |
| Aceite de oliva | 5 g | 171413 |

**Preparación**

1. Cociná el salmón al horno sin aceite adicional. Comprobá 63 °C en el centro con termómetro. Retirá las espinas y pesá 150 g cocidos de la parte comestible.
2. Herví las papas con piel hasta que estén tiernas. Pelalas, cortalas y pesá 220 g de pulpa cocida; no incluyas la piel en ese peso.
3. Herví el brócoli, escurrilo y pesá 100 g cocidos.
4. Serví el salmón junto a la papa y el brócoli. Agregá los 5 g de aceite de oliva pesados. No se contabilizan otros aderezos.

Total sin redondear: 579,600 kcal; 51,466 g de carbohidratos; 24,155 g de grasas; 39,644 g de proteínas.

## Lentejas con arroz y verduras

Lentejas tiernas con arroz blanco, brócoli y zanahoria.

Archivo: fotos/03_lentejas_arroz_verduras.png · Identificador: BE-DEMO-NUT-003 · Peso comestible total de la receta: 428 g.

| Ingrediente y estado | Cantidad | FDC |
|---|---:|---:|
| Lentejas hervidas sin sal | 180 g | 172421 |
| Arroz blanco de grano largo, cocido | 100 g | 168878 |
| Brócoli hervido y escurrido, sin sal | 80 g | 169967 |
| Zanahoria hervida y escurrida, sin sal | 60 g | 170394 |
| Aceite de oliva | 8 g | 171413 |

**Preparación**

1. Cociná las lentejas en agua sin aceite añadido hasta que estén tiernas. Escurrí el líquido sobrante y pesá 180 g de lentejas cocidas.
2. Cociná el arroz por separado y pesá 100 g del arroz cocido.
3. Herví el brócoli y la zanahoria, escurrí y pesá 80 g y 60 g respectivamente.
4. Serví las lentejas con el arroz y las verduras. Distribuí los 8 g de aceite de oliva pesados sobre el plato.

Total sin redondear: 458,520 kcal; 75,080 g de carbohidratos; 9,400 g de grasas; 21,286 g de proteínas.

## Comprobaciones para la aplicación

El archivo datos/casos_calculo.json incluye once casos numéricos: cada receta completa, a la mitad y al doble; pollo con arroz aumentado de 160 a 200 g; pollo sin los 8 g de aceite. El desglose por ingrediente está en CSV. Si la UI no admite cero, quitar el aceite por la operación correspondiente produce el mismo caso matemático.

La duplicación se verifica antes de redondear. Una porción con cantidades sin confirmar no produce consumo cero ni toma automáticamente el valor de la porción prevista.

Ejecutar desde esta carpeta: python3 verificar_calculos.py (en Windows puede usarse py verificar_calculos.py). El script no modifica datos y no necesita acceso a internet.

## Fuentes de preparación

Las instrucciones culinarias fueron redactadas para estas recetas. Para los mínimos internos se consultó [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures): pollo 74 °C y pescado 63 °C. El rendimiento depende de la preparación; pesar después de cocinar evita inventar una conversión universal entre crudo y cocido.

Las fotos fueron creadas con la herramienta integrada de generación de imágenes de esta sesión; no fueron extraídas de un banco de imágenes. No acreditan autoría fotográfica humana ni un tamaño exacto de porción.
