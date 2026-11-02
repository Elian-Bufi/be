# Alimentos · fichas y prompts (16)

Dieciséis alimentos del catálogo real, distintos entre sí, con el estado que dice su ficha. **Ninguno tiene imagen:**
esta sesión no tenía una herramienta que genere imágenes.

**Dónde se verían:** el catálogo nutricional no tiene ningún campo de imagen (prisma/schema.prisma:1218-1251: ElementoDeCatalogoNutricional y VersionDeElementoNutricional): las imágenes de alimentos quedan como material preparado, sin campos, contratos ni pantallas nuevas.

## Cómo se eligieron

- **Del catálogo base de USDA (DL-141), que dice el estado en el nombre** («Arroz blanco de grano largo, cocido»). El
  catálogo sintético de WP-04, el que usan la cohorte y la prueba breve, dice «Arroz blanco» o «Huevo», sin el estado: cada
  ficha anota su equivalente para que Dirección decida si la imagen sirve también para él.
- **Por uso:** las 16 recetas del manifiesto (41 alimentos distintos), los planes de la cohorte de test y los de la prueba
  breve. Un solo estado por alimento, el que más se usa: el huevo va duro y el pollo, a la parrilla, como en los planes.
- **Una variante no cuenta como otro alimento:** no hay dos estados de la misma comida.

**Quedaron afuera por poco:**

- Aceite de oliva (el más usado: 3 recetas y 22 veces en la cohorte): una imagen de aceite casi no ayuda a reconocerlo, porque el nombre ya lo dice.
- Huevo de gallina entero, crudo (3 recetas): no se suma porque el huevo ya está como huevo duro. Es la misma comida en otro estado, y contaría como variante.
- Pechuga de pollo cruda (receta 13) y merluza cruda (receta 8): los planes usan su versión cocida, y la merluza cocida («Merluza (whiting) cocida por calor seco») queda como reserva.

## El estilo común

- Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
- Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
- Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
- Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.

| Código | Alimento | Estado | catalogItemId | Versión |
|---|---|---|---|---|
| A01 | Tomate rojo maduro, crudo | crudo | `12ba4bb9-9d3f-560e-8151-28caab4e7d53` | `d4936913-5486-5279-933f-1066d2a6d4cd` |
| A02 | Pan integral de trigo, de molde | listo para consumir | `01c1bcd7-fef3-5f02-af20-7a894d7b2bc9` | `6305874f-0432-51ea-824b-d4b0cac3d4cd` |
| A03 | Yogur natural entero | listo para consumir | `eca4ad2a-c03a-5c28-b797-6185e777e0fb` | `1fcf08be-5d2b-5925-8362-40b8a8371ce6` |
| A04 | Huevo duro | cocido | `d287cf5d-9de5-546f-97b8-ccdf18758a33` | `00ca007a-f8e1-5f18-81e2-1fc1dfadfa53` |
| A05 | Leche parcialmente descremada (2 % de grasa) | listo para consumir | `52c909f8-b32b-568e-9bd8-0b571d624cf9` | `8d4f4e1b-d144-5f51-9f03-5d94afdef97a` |
| A06 | Avena arrollada, cruda | crudo | `11d4284a-4e16-56c8-8778-d818fe416702` | `cb7dabd1-e74f-58c0-9c9d-f17615c32f37` |
| A07 | Banana cruda | crudo | `6644e0f8-cbe7-5b2c-ac7b-e67361700779` | `c0c0b302-f3cf-5d0b-82e3-88de1e286252` |
| A08 | Lechuga de hoja verde, cruda | crudo | `5c894dfd-879f-5704-b448-9cf892e38e64` | `cba48281-15bd-5dbd-ab03-da734a64c727` |
| A09 | Arroz blanco de grano largo, cocido | cocido | `65bbfed9-71d1-5d61-9a23-9c89d0b92455` | `43a2da56-8a90-5cb5-b826-bc9cfc8aa1ae` |
| A10 | Pechuga de pollo sin piel, a la parrilla | cocido | `aec6c34e-2b7b-5e2d-97ec-132dc720b83e` | `aa7c87c9-deb0-5924-abc6-852afc206715` |
| A11 | Papa hervida sin cáscara, sin sal | cocido | `96031173-3ffa-5907-b32e-cb4206d776bf` | `ade5346c-ae9b-5609-a93e-57ccbe152ab7` |
| A12 | Zanahoria cruda | crudo | `eb93c9dc-12de-574b-9f3d-acb77eae8d35` | `f808e095-0a91-5f6b-8803-50b1f09547d5` |
| A13 | Cebolla cruda | crudo | `1e31d1a2-3618-5495-84ad-97626fbcac74` | `29d7457e-ce1c-5d0c-b1a5-a92253c74d5c` |
| A14 | Manzana con cáscara, cruda | crudo | `7934270b-50ce-5132-9b13-3f69260ca967` | `de4bb1a0-766b-5b9a-9382-a60673762534` |
| A15 | Lentejas hervidas sin sal | cocido | `0a3c813e-a2f9-5a36-9155-f86166b96085` | `0c3dfed4-03e5-5f1d-99da-7955d96bad98` |
| A16 | Brócoli hervido y escurrido, sin sal | cocido | `ed2d76ab-1993-5258-9496-0527315cd530` | `593b7623-921e-5004-930d-247ee5f1ff99` |

## A01 · Tomate rojo maduro, crudo (crudo)

- **Archivo:** `A01-tomate-rojo-maduro-crudo.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 5, 7, 11, 12 y 14; 9 veces en la cohorte; prueba breve.
- **Qué se ve:** Un tomate redondo rojo maduro entero y otro cortado al medio, crudos, con la pulpa y las semillas a la vista.
- **No debe aparecer:** tomate cocido o en salsa, aceite, sal, albahaca.
- **Equivalente en el catálogo sintético:** «tomate» (`97b275d1-6517-4dcf-825b-a348063a9144`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Tomate rojo maduro, crudo», crudo.
Mostrar: Un tomate redondo rojo maduro entero y otro cortado al medio, crudos, con la pulpa y las semillas a la vista.
No debe aparecer: tomate cocido o en salsa, aceite, sal, albahaca.
```

</details>

## A02 · Pan integral de trigo, de molde (listo para consumir)

- **Archivo:** `A02-pan-integral-de-trigo-de-molde.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 2, 5 y 15; 8 veces en la cohorte; prueba breve.
- **Qué se ve:** Dos rebanadas de pan integral de molde, SIN tostar, apoyadas una sobre otra, con la miga integral a la vista.
- **No debe aparecer:** pan tostado, manteca, untables, envase con marca.
- **Equivalente en el catálogo sintético:** «panIntegral» (`14a1912d-d5e1-42b7-87e2-a1508aa947bf`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Pan integral de trigo, de molde», listo para consumir.
Mostrar: Dos rebanadas de pan integral de molde, SIN tostar, apoyadas una sobre otra, con la miga integral a la vista.
No debe aparecer: pan tostado, manteca, untables, envase con marca.
```

</details>

## A03 · Yogur natural entero (listo para consumir)

- **Archivo:** `A03-yogur-natural-entero.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 3; 7 veces en la cohorte; prueba breve.
- **Qué se ve:** Yogur natural blanco, cremoso, en un cuenco blanco liso, con una superficie lisa.
- **No debe aparecer:** frutas, granola, miel, envase con marca.
- **Equivalente en el catálogo sintético:** «yogur» (`121f8f5f-4aa2-4ab9-8f7e-327f85ce5cf1`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Yogur natural entero», listo para consumir.
Mostrar: Yogur natural blanco, cremoso, en un cuenco blanco liso, con una superficie lisa.
No debe aparecer: frutas, granola, miel, envase con marca.
```

</details>

## A04 · Huevo duro (cocido)

- **Archivo:** `A04-huevo-duro.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 2 y 12; 7 veces en la cohorte («huevo», cocido en la prueba breve).
- **Qué se ve:** Un huevo duro pelado entero y otro cortado al medio, con la yema firme y amarilla.
- **No debe aparecer:** huevo crudo, huevo frito, sal, pimienta, cáscara rota alrededor.
- **Equivalente en el catálogo sintético:** «huevo» (`77026f96-bd1d-440c-8158-e28e6df3d67a`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Huevo duro», cocido.
Mostrar: Un huevo duro pelado entero y otro cortado al medio, con la yema firme y amarilla.
No debe aparecer: huevo crudo, huevo frito, sal, pimienta, cáscara rota alrededor.
```

</details>

## A05 · Leche parcialmente descremada (2 % de grasa) (listo para consumir)

- **Archivo:** `A05-leche-parcialmente-descremada-2-de-grasa.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 1 y 4; 7 veces en la cohorte.
- **Qué se ve:** Un vaso de vidrio liso con leche blanca, lleno hasta tres cuartos.
- **No debe aparecer:** espuma de café, cereales, envase con marca.
- **Ojo:** La imagen no muestra el porcentaje de grasa: lo dice el nombre.
- **Equivalente en el catálogo sintético:** «leche» (`77ace701-cd14-49c6-877c-1a858da71bcd`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Leche parcialmente descremada (2 % de grasa)», listo para consumir.
Mostrar: Un vaso de vidrio liso con leche blanca, lleno hasta tres cuartos.
No debe aparecer: espuma de café, cereales, envase con marca.
```

</details>

## A06 · Avena arrollada, cruda (crudo)

- **Archivo:** `A06-avena-arrollada-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 1 y 4; 5 veces en la cohorte; prueba breve.
- **Qué se ve:** Copos de avena arrollada secos, crudos, en un cuenco blanco liso y unos pocos sueltos al lado.
- **No debe aparecer:** avena cocida o en papilla, leche, frutas.
- **Equivalente en el catálogo sintético:** «avena» (`1d73a14d-1fa1-4a10-84c2-3b7537c5b520`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Avena arrollada, cruda», crudo.
Mostrar: Copos de avena arrollada secos, crudos, en un cuenco blanco liso y unos pocos sueltos al lado.
No debe aparecer: avena cocida o en papilla, leche, frutas.
```

</details>

## A07 · Banana cruda (crudo)

- **Archivo:** `A07-banana-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 1 y 4; 5 veces en la cohorte; prueba breve.
- **Qué se ve:** Una banana amarilla madura, entera y con cáscara, sin manchas marrones grandes.
- **No debe aparecer:** banana pelada en rodajas, racimo grande, otras frutas.
- **Equivalente en el catálogo sintético:** «banana» (`c6113e6e-e6c2-4f79-8a98-5f9d836b8018`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Banana cruda», crudo.
Mostrar: Una banana amarilla madura, entera y con cáscara, sin manchas marrones grandes.
No debe aparecer: banana pelada en rodajas, racimo grande, otras frutas.
```

</details>

## A08 · Lechuga de hoja verde, cruda (crudo)

- **Archivo:** `A08-lechuga-de-hoja-verde-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 7 y 14; 5 veces en la cohorte; prueba breve.
- **Qué se ve:** Hojas sueltas de lechuga de hoja verde, crudas y frescas, de borde ondulado.
- **No debe aparecer:** lechuga repollada (criolla redonda), aceite, tomate, ensalada armada.
- **Equivalente en el catálogo sintético:** «lechuga» (`fe14b950-2fe4-47f1-84c9-cd842c31ff6d`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Lechuga de hoja verde, cruda», crudo.
Mostrar: Hojas sueltas de lechuga de hoja verde, crudas y frescas, de borde ondulado.
No debe aparecer: lechuga repollada (criolla redonda), aceite, tomate, ensalada armada.
```

</details>

## A09 · Arroz blanco de grano largo, cocido (cocido)

- **Archivo:** `A09-arroz-blanco-de-grano-largo-cocido.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 13; 4 veces en la cohorte; prueba breve (cocido).
- **Qué se ve:** Arroz blanco de grano largo, cocido, con los granos sueltos, en un cuenco blanco liso.
- **No debe aparecer:** arroz crudo, verduras, manteca, perejil.
- **Equivalente en el catálogo sintético:** «arroz» (`c76065f4-cfaf-4e86-8cf5-297a557a18f5`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Arroz blanco de grano largo, cocido», cocido.
Mostrar: Arroz blanco de grano largo, cocido, con los granos sueltos, en un cuenco blanco liso.
No debe aparecer: arroz crudo, verduras, manteca, perejil.
```

</details>

## A10 · Pechuga de pollo sin piel, a la parrilla (cocido)

- **Archivo:** `A10-pechuga-de-pollo-sin-piel-a-la-parrilla.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** 7 veces en la cohorte («pollo»; cocido en la prueba breve); la receta 13 usa la pechuga cruda.
- **Qué se ve:** Una pechuga de pollo sin piel, a la parrilla, con las marcas de la parrilla, entera y con un corte que muestra la carne blanca cocida.
- **No debe aparecer:** pollo crudo, piel, salsas, limón, guarnición.
- **Ojo:** No está en el manifiesto: sus identificadores salen de la migración 20261019120100_catalogo_base_de_alimentos (versión sembrada); confirmar que sigue vigente antes de usarla.
- **Equivalente en el catálogo sintético:** «pollo» (`fdac8b88-6dbe-4406-86b0-bf0c155ce0e2`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Pechuga de pollo sin piel, a la parrilla», cocido.
Mostrar: Una pechuga de pollo sin piel, a la parrilla, con las marcas de la parrilla, entera y con un corte que muestra la carne blanca cocida.
No debe aparecer: pollo crudo, piel, salsas, limón, guarnición.
```

</details>

## A11 · Papa hervida sin cáscara, sin sal (cocido)

- **Archivo:** `A11-papa-hervida-sin-cascara-sin-sal.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 8; 7 veces en la cohorte; prueba breve (cocida).
- **Qué se ve:** Papas peladas y hervidas, enteras y una cortada al medio, de pulpa clara y mate.
- **No debe aparecer:** papa con cáscara, papas fritas, puré, manteca, perejil.
- **Equivalente en el catálogo sintético:** «papa» (`c03d2e0a-1915-4202-8d48-ecd4ce4dac56`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Papa hervida sin cáscara, sin sal», cocido.
Mostrar: Papas peladas y hervidas, enteras y una cortada al medio, de pulpa clara y mate.
No debe aparecer: papa con cáscara, papas fritas, puré, manteca, perejil.
```

</details>

## A12 · Zanahoria cruda (crudo)

- **Archivo:** `A12-zanahoria-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 10, 12 y 13; 3 veces en la cohorte; prueba breve.
- **Qué se ve:** Dos zanahorias crudas enteras, peladas o lavadas, sin hojas, y una cortada en rodajas.
- **No debe aparecer:** zanahoria cocida, zanahoria rallada con aceite, hojas grandes.
- **Equivalente en el catálogo sintético:** «zanahoria» (`1b1539fc-63cd-4c1d-896d-a382e226cccc`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Zanahoria cruda», crudo.
Mostrar: Dos zanahorias crudas enteras, peladas o lavadas, sin hojas, y una cortada en rodajas.
No debe aparecer: zanahoria cocida, zanahoria rallada con aceite, hojas grandes.
```

</details>

## A13 · Cebolla cruda (crudo)

- **Archivo:** `A13-cebolla-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** recetas 9, 10, 13 y 14; 3 veces en la cohorte; prueba breve.
- **Qué se ve:** Una cebolla blanca entera con su piel y otra cortada al medio, cruda, con los anillos a la vista.
- **No debe aparecer:** cebolla dorada o cocida, cebolla de verdeo, aceite.
- **Equivalente en el catálogo sintético:** «cebolla» (`72b8f490-c8d1-4eab-8562-f0be2ee21476`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Cebolla cruda», crudo.
Mostrar: Una cebolla blanca entera con su piel y otra cortada al medio, cruda, con los anillos a la vista.
No debe aparecer: cebolla dorada o cocida, cebolla de verdeo, aceite.
```

</details>

## A14 · Manzana con cáscara, cruda (crudo)

- **Archivo:** `A14-manzana-con-cascara-cruda.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 16; 2 veces en la cohorte; prueba breve.
- **Qué se ve:** Una manzana roja entera con cáscara y dos gajos con cáscara, crudos.
- **No debe aparecer:** manzana pelada, manzana asada, canela, miel.
- **Equivalente en el catálogo sintético:** «manzana» (`eaf534d4-f839-4acc-8a6d-53d8dc359e29`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Manzana con cáscara, cruda», crudo.
Mostrar: Una manzana roja entera con cáscara y dos gajos con cáscara, crudos.
No debe aparecer: manzana pelada, manzana asada, canela, miel.
```

</details>

## A15 · Lentejas hervidas sin sal (cocido)

- **Archivo:** `A15-lentejas-hervidas-sin-sal.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 10; 2 veces en la cohorte; prueba breve (cocidas).
- **Qué se ve:** Lentejas hervidas, escurridas y sin caldo, en un cuenco blanco liso.
- **No debe aparecer:** lentejas secas crudas, guiso, verduras, chorizo.
- **Equivalente en el catálogo sintético:** «lentejas» (`41c1705e-aad6-4d57-8ab4-fef172f538ae`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Lentejas hervidas sin sal», cocido.
Mostrar: Lentejas hervidas, escurridas y sin caldo, en un cuenco blanco liso.
No debe aparecer: lentejas secas crudas, guiso, verduras, chorizo.
```

</details>

## A16 · Brócoli hervido y escurrido, sin sal (cocido)

- **Archivo:** `A16-brocoli-hervido-y-escurrido-sin-sal.jpg`. **Estado:** ficha lista, sin imagen.
- **Uso en BE:** receta 8; 3 veces en la cohorte; prueba breve (cocido).
- **Qué se ve:** Ramilletes de brócoli hervidos, verde intenso, tiernos y escurridos.
- **No debe aparecer:** brócoli crudo, manteca, queso, ajo.
- **Equivalente en el catálogo sintético:** «brocoli» (`513510d2-911c-4042-8e58-0a58e712a4d3`).

<details><summary>Prompt</summary>

```text
Fotografía realista de un alimento solo, para un catálogo de nutrición. Sin plato de comida armada: el alimento tal como lo identifica su ficha.
Fondo blanco cálido liso (#F7F5F0), luz natural suave desde la izquierda, sombra leve debajo. Misma escala relativa y misma cámara (a unos 30 grados) en toda la serie.
Formato cuadrado, 1200 × 1200 px, con el alimento centrado y un margen de un 12 % alrededor.
Sin texto, marcas de agua, logos, envases con marca ni personas. Nada que no sea el alimento y, si hace falta, un recipiente blanco liso.
Alimento: «Brócoli hervido y escurrido, sin sal», cocido.
Mostrar: Ramilletes de brócoli hervidos, verde intenso, tiernos y escurridos.
No debe aparecer: brócoli crudo, manteca, queso, ajo.
```

</details>


---
Generado por `herramientas/generar.mjs` desde el manifiesto congelado y `herramientas/seleccion.mjs` (commit de referencia `e4512cb`). No editar a mano: cambiar la selección y volver a generar.
