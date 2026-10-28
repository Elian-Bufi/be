# Recetas · fichas y prompts (16)

Las dieciséis recetas de ejemplo del manifiesto congelado, con su archivo esperado, lo que lleva cada una y el prompt para
generar su foto. **Ninguna tiene imagen todavía:** esta sesión no tenía una herramienta que genere imágenes, y un prompt
no es una imagen. La foto es una referencia visual: no mide la porción ni cambia ningún cálculo.

## Cómo se va a ver

- **Website:** 4:3, recorte al centro (object-fit: cover), hasta 28rem de ancho; la miniatura, 6,5rem de ancho (apps/web/src/app/globals.css:2312-2327).
- **APK:** 16:10 por omisión, recorte al centro (resizeMode cover): la opción del día, el carrusel y la ficha de la opción (apps/mobile/src/imagen-de-medio.tsx:52 y :97; pantallas/nutricion-hoy.tsx:604, nutricion.tsx:365, opcion-de-comida.tsx:213).
- **Servidor:** se recodifica en JPEG de calidad 82, hasta 1600 px en el lado mayor y sin agrandar; la transparencia se aplana sobre blanco (apps/api/src/medios/procesamiento-de-imagen.ts:54-58; packages/domain/src/contratos-medios.ts:32-43).
- **El criterio que ya existía:** horizontal, cerca de 4:3 (de 1,25 a 1,40), al menos 1600 px en el lado mayor y hasta 10 MB; el plato dentro de la franja central de 16:10 (EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs:160-171). Las fichas lo usan tal cual.

Con una foto 4:3 y el plato dentro de la franja central de 16:10 (un doceavo del alto libre arriba y abajo), el plato se ve
entero en las dos: el website no recorta una 4:3 y la APK recorta solo esas dos franjas. La maqueta de
`encuadre-de-recetas.svg` lo dibuja.

**A prestar atención al generarlas:** muchas herramientas entregan 1536 × 1024 (3:2) o 1024 × 1024. La revisión de
`recetas.mjs` pide entre 1,25 y 1,40 de proporción y 1600 px en el lado mayor: hay que pedir 4:3 o recortar a 4:3 y
escalar a 1600 × 1200 antes de subirla, con el plato todavía dentro de la franja central.

## El estilo común (va al principio de cada prompt)

- Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
- Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
- Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
- Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
- Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
- Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.

## 01 · Avena cocida con banana y canela

- **Archivo esperado:** `01-avena-cocida-con-banana-y-canela.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Avena arrollada, cruda | 40 g | crudo |
| Leche parcialmente descremada (2 % de grasa) | 200 g | listo para consumir |
| Banana cruda | 100 g | crudo |
| Canela molida | 2 g | listo para consumir |

- **Preparación:** Cocinar la avena con la leche 5 minutos. Servir con la banana en rodajas y la canela.
- **Presentación:** Avena cocida en leche, cremosa, en el cuenco; encima, rodajas de banana y una línea fina de canela molida. Una cuchara a la derecha.
- **No debe aparecer:** miel, frutos secos, frutos rojos, hojas de menta, leche aparte.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Avena cocida con banana y canela», 1 porción. Ingredientes, en estas cantidades: Avena arrollada, cruda: 40 g; Leche parcialmente descremada (2 % de grasa): 200 g; Banana cruda: 100 g; Canela molida: 2 g.
Preparación: Cocinar la avena con la leche 5 minutos. Servir con la banana en rodajas y la canela.
Presentación: Avena cocida en leche, cremosa, en el cuenco; encima, rodajas de banana y una línea fina de canela molida. Una cuchara a la derecha.
No debe aparecer: miel, frutos secos, frutos rojos, hojas de menta, leche aparte.
```

</details>

## 02 · Tostadas integrales con palta y huevo

- **Archivo esperado:** `02-tostadas-integrales-con-palta-y-huevo.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Pan integral de trigo, de molde | 60 g | listo para consumir |
| Palta cruda | 50 g | crudo |
| Huevo duro | 50 g | cocido |

- **Preparación:** Tostar el pan. Untar la palta y sumar el huevo en rodajas.
- **Presentación:** Dos rebanadas de pan integral de molde tostadas, con la palta untada y el huevo duro en rodajas encima.
- **No debe aparecer:** semillas, sal en escamas, pimienta, brotes, tomate, limón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tostadas integrales con palta y huevo», 1 porción. Ingredientes, en estas cantidades: Pan integral de trigo, de molde: 60 g; Palta cruda: 50 g; Huevo duro: 50 g.
Preparación: Tostar el pan. Untar la palta y sumar el huevo en rodajas.
Presentación: Dos rebanadas de pan integral de molde tostadas, con la palta untada y el huevo duro en rodajas encima.
No debe aparecer: semillas, sal en escamas, pimienta, brotes, tomate, limón.
```

</details>

## 03 · Yogur natural con granola y frutillas

- **Archivo esperado:** `03-yogur-natural-con-granola-y-frutillas.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Yogur natural entero | 200 g | listo para consumir |
| Granola casera | 30 g | listo para consumir |
| Frutillas crudas | 80 g | crudo |

- **Preparación:** Servir el yogur con la granola y las frutillas cortadas.
- **Presentación:** Yogur natural blanco en el cuenco, con la granola encima y las frutillas cortadas al medio. Una cuchara a la derecha.
- **No debe aparecer:** miel, otras frutas, hojas de menta, chocolate.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Yogur natural con granola y frutillas», 1 porción. Ingredientes, en estas cantidades: Yogur natural entero: 200 g; Granola casera: 30 g; Frutillas crudas: 80 g.
Preparación: Servir el yogur con la granola y las frutillas cortadas.
Presentación: Yogur natural blanco en el cuenco, con la granola encima y las frutillas cortadas al medio. Una cuchara a la derecha.
No debe aparecer: miel, otras frutas, hojas de menta, chocolate.
```

</details>

## 04 · Licuado de banana con leche y avena

- **Archivo esperado:** `04-licuado-de-banana-con-leche-y-avena.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Leche parcialmente descremada (2 % de grasa) | 250 g | listo para consumir |
| Banana cruda | 120 g | crudo |
| Avena arrollada, cruda | 20 g | crudo |

- **Preparación:** Licuar todo hasta que quede liso.
- **Presentación:** Licuado liso, color crema claro, en el vaso, sin espuma exagerada. Nada apoyado en el borde.
- **No debe aparecer:** rodajas de banana de adorno, canela, avena espolvoreada, crema, pajita de colores.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: vaso de vidrio liso de 300 ml.
Receta: «Licuado de banana con leche y avena», 1 porción. Ingredientes, en estas cantidades: Leche parcialmente descremada (2 % de grasa): 250 g; Banana cruda: 120 g; Avena arrollada, cruda: 20 g.
Preparación: Licuar todo hasta que quede liso.
Presentación: Licuado liso, color crema claro, en el vaso, sin espuma exagerada. Nada apoyado en el borde.
No debe aparecer: rodajas de banana de adorno, canela, avena espolvoreada, crema, pajita de colores.
```

</details>

## 05 · Tostadas integrales con queso crema y tomate

- **Archivo esperado:** `05-tostadas-integrales-con-queso-crema-y-tomate.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Pan integral de trigo, de molde | 60 g | listo para consumir |
| Queso crema | 40 g | listo para consumir |
| Tomate rojo maduro, crudo | 80 g | crudo |

- **Preparación:** Tostar el pan. Untar el queso y sumar el tomate en rodajas.
- **Presentación:** Dos rebanadas de pan integral de molde tostadas, con el queso crema untado y rodajas de tomate encima.
- **No debe aparecer:** albahaca, orégano, aceite, sal o pimienta visibles, jamón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tostadas integrales con queso crema y tomate», 1 porción. Ingredientes, en estas cantidades: Pan integral de trigo, de molde: 60 g; Queso crema: 40 g; Tomate rojo maduro, crudo: 80 g.
Preparación: Tostar el pan. Untar el queso y sumar el tomate en rodajas.
Presentación: Dos rebanadas de pan integral de molde tostadas, con el queso crema untado y rodajas de tomate encima.
No debe aparecer: albahaca, orégano, aceite, sal o pimienta visibles, jamón.
```

</details>

## 06 · Milanesa de carne al horno con puré de calabaza

- **Archivo esperado:** `06-milanesa-de-carne-al-horno-con-pure-de-calabaza.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Nalga vacuna, magra, cruda | 150 g | crudo |
| Pan rallado común | 25 g | listo para consumir |
| Huevo de gallina entero, crudo | 25 g | crudo |
| Zapallo anco al horno, sin sal | 200 g | cocido |

- **Preparación:** Pasar la carne por huevo y pan rallado. Hornear 20 minutos, dando vuelta a la mitad. Servir con el zapallo hecho puré.
- **Presentación:** Una milanesa de carne horneada, dorada y crocante, con el puré de zapallo anco al lado, liso y naranja.
- **No debe aparecer:** limón, perejil, papas fritas, ensalada, huevo frito.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Milanesa de carne al horno con puré de calabaza», 1 porción. Ingredientes, en estas cantidades: Nalga vacuna, magra, cruda: 150 g; Pan rallado común: 25 g; Huevo de gallina entero, crudo: 25 g; Zapallo anco al horno, sin sal: 200 g.
Preparación: Pasar la carne por huevo y pan rallado. Hornear 20 minutos, dando vuelta a la mitad. Servir con el zapallo hecho puré.
Presentación: Una milanesa de carne horneada, dorada y crocante, con el puré de zapallo anco al lado, liso y naranja.
No debe aparecer: limón, perejil, papas fritas, ensalada, huevo frito.
```

</details>

## 07 · Bife a la plancha con papas al horno y ensalada

- **Archivo esperado:** `07-bife-a-la-plancha-con-papas-al-horno-y-ensalada.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Bife de chorizo, magro, crudo | 150 g | crudo |
| Papa al horno con cáscara, sin sal | 200 g | cocido |
| Lechuga de hoja verde, cruda | 50 g | crudo |
| Tomate rojo maduro, crudo | 80 g | crudo |
| Aceite de oliva | 10 g | listo para consumir |

- **Preparación:** Cocinar el bife a la plancha. Servir con las papas y la ensalada condimentada con el aceite.
- **Presentación:** Un bife a la plancha, con las marcas de la plancha; papas al horno con cáscara, cortadas, y una ensalada de lechuga y tomate apenas brillante por el aceite de oliva.
- **No debe aparecer:** chimichurri, sal gruesa visible, cebolla, huevo frito, limón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Bife a la plancha con papas al horno y ensalada», 1 porción. Ingredientes, en estas cantidades: Bife de chorizo, magro, crudo: 150 g; Papa al horno con cáscara, sin sal: 200 g; Lechuga de hoja verde, cruda: 50 g; Tomate rojo maduro, crudo: 80 g; Aceite de oliva: 10 g.
Preparación: Cocinar el bife a la plancha. Servir con las papas y la ensalada condimentada con el aceite.
Presentación: Un bife a la plancha, con las marcas de la plancha; papas al horno con cáscara, cortadas, y una ensalada de lechuga y tomate apenas brillante por el aceite de oliva.
No debe aparecer: chimichurri, sal gruesa visible, cebolla, huevo frito, limón.
```

</details>

## 08 · Merluza al horno con puré de papa y brócoli

- **Archivo esperado:** `08-merluza-al-horno-con-pure-de-papa-y-brocoli.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Merluza (whiting), cruda | 150 g | crudo |
| Papa hervida sin cáscara, sin sal | 200 g | cocido |
| Brócoli hervido y escurrido, sin sal | 100 g | cocido |

- **Preparación:** Hornear la merluza 15 minutos. Servir con el puré y el brócoli.
- **Presentación:** Un filete de merluza al horno, blanco y apenas dorado; puré de papa liso y ramilletes de brócoli hervido, verde intenso.
- **No debe aparecer:** limón, perejil, manteca visible, salsa.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Merluza al horno con puré de papa y brócoli», 1 porción. Ingredientes, en estas cantidades: Merluza (whiting), cruda: 150 g; Papa hervida sin cáscara, sin sal: 200 g; Brócoli hervido y escurrido, sin sal: 100 g.
Preparación: Hornear la merluza 15 minutos. Servir con el puré y el brócoli.
Presentación: Un filete de merluza al horno, blanco y apenas dorado; puré de papa liso y ramilletes de brócoli hervido, verde intenso.
No debe aparecer: limón, perejil, manteca visible, salsa.
```

</details>

## 09 · Fideos con salsa bolognesa

- **Archivo esperado:** `09-fideos-con-salsa-bolognesa.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Fideos de trigo hervidos, sin sal | 200 g | cocido |
| Carne picada vacuna 90 % magra, cruda | 80 g | crudo |
| Puré de tomate sin sal agregada | 100 g | listo para consumir |
| Cebolla cruda | 30 g | crudo |

- **Preparación:** Dorar la cebolla y la carne. Sumar el puré de tomate y cocinar 15 minutos. Servir sobre los fideos.
- **Presentación:** Fideos largos tipo spaghetti con la salsa bolognesa encima: carne picada y tomate, roja.
- **No debe aparecer:** queso rallado, albahaca, perejil, pan.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Fideos con salsa bolognesa», 1 porción. Ingredientes, en estas cantidades: Fideos de trigo hervidos, sin sal: 200 g; Carne picada vacuna 90 % magra, cruda: 80 g; Puré de tomate sin sal agregada: 100 g; Cebolla cruda: 30 g.
Preparación: Dorar la cebolla y la carne. Sumar el puré de tomate y cocinar 15 minutos. Servir sobre los fideos.
Presentación: Fideos largos tipo spaghetti con la salsa bolognesa encima: carne picada y tomate, roja.
No debe aparecer: queso rallado, albahaca, perejil, pan.
```

</details>

## 10 · Guiso de lentejas con verduras

- **Archivo esperado:** `10-guiso-de-lentejas-con-verduras.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Lentejas hervidas sin sal | 200 g | cocido |
| Zanahoria cruda | 50 g | crudo |
| Zapallo anco crudo | 80 g | crudo |
| Cebolla cruda | 30 g | crudo |

- **Preparación:** Cocinar la cebolla, la zanahoria y el zapallo en un poco de agua. Sumar las lentejas y cocinar hasta que espese.
- **Presentación:** Guiso espeso de lentejas con cubos de zanahoria y de zapallo, y cebolla, en el cuenco. Una cuchara a la derecha.
- **No debe aparecer:** chorizo, panceta, perejil, pan, huevo.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Guiso de lentejas con verduras», 1 porción. Ingredientes, en estas cantidades: Lentejas hervidas sin sal: 200 g; Zanahoria cruda: 50 g; Zapallo anco crudo: 80 g; Cebolla cruda: 30 g.
Preparación: Cocinar la cebolla, la zanahoria y el zapallo en un poco de agua. Sumar las lentejas y cocinar hasta que espese.
Presentación: Guiso espeso de lentejas con cubos de zanahoria y de zapallo, y cebolla, en el cuenco. Una cuchara a la derecha.
No debe aparecer: chorizo, panceta, perejil, pan, huevo.
```

</details>

## 11 · Tarta de acelga con ensalada de tomate

- **Archivo esperado:** `11-tarta-de-acelga-con-ensalada-de-tomate.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Acelga hervida, sin sal | 150 g | cocido |
| Huevo de gallina entero, crudo | 50 g | crudo |
| Harina de trigo blanca de uso general, enriquecida | 40 g | listo para consumir |
| Aceite de girasol | 10 g | listo para consumir |
| Tomate rojo maduro, crudo | 100 g | crudo |

- **Preparación:** Hacer una masa con la harina, el aceite y un poco de agua. Mezclar la acelga con el huevo y cubrir con la masa. Hornear 30 minutos y servir con la ensalada de tomate.
- **Presentación:** Una porción de tarta de acelga: masa casera dorada y relleno verde de acelga con huevo; al lado, rodajas de tomate solas.
- **No debe aparecer:** queso, huevo duro, cebolla, orégano, aceite sobre el tomate.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de acelga con ensalada de tomate», 1 porción. Ingredientes, en estas cantidades: Acelga hervida, sin sal: 150 g; Huevo de gallina entero, crudo: 50 g; Harina de trigo blanca de uso general, enriquecida: 40 g; Aceite de girasol: 10 g; Tomate rojo maduro, crudo: 100 g.
Preparación: Hacer una masa con la harina, el aceite y un poco de agua. Mezclar la acelga con el huevo y cubrir con la masa. Hornear 30 minutos y servir con la ensalada de tomate.
Presentación: Una porción de tarta de acelga: masa casera dorada y relleno verde de acelga con huevo; al lado, rodajas de tomate solas.
No debe aparecer: queso, huevo duro, cebolla, orégano, aceite sobre el tomate.
```

</details>

## 12 · Bowl de quinoa con garbanzos, huevo y verduras

- **Archivo esperado:** `12-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Quinoa cocida | 150 g | cocido |
| Garbanzos hervidos, sin sal | 100 g | cocido |
| Huevo duro | 50 g | cocido |
| Tomate rojo maduro, crudo | 60 g | crudo |
| Zanahoria cruda | 40 g | crudo |
| Aceite de oliva | 10 g | listo para consumir |

- **Preparación:** Armar el bowl con todo y condimentar con el aceite.
- **Presentación:** Bowl armado por sectores: quinoa, garbanzos, un huevo duro en mitades, tomate en cubos y zanahoria rallada, con un brillo de aceite de oliva.
- **No debe aparecer:** palta, semillas, hojas verdes, limón, salsas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Bowl de quinoa con garbanzos, huevo y verduras», 1 porción. Ingredientes, en estas cantidades: Quinoa cocida: 150 g; Garbanzos hervidos, sin sal: 100 g; Huevo duro: 50 g; Tomate rojo maduro, crudo: 60 g; Zanahoria cruda: 40 g; Aceite de oliva: 10 g.
Preparación: Armar el bowl con todo y condimentar con el aceite.
Presentación: Bowl armado por sectores: quinoa, garbanzos, un huevo duro en mitades, tomate en cubos y zanahoria rallada, con un brillo de aceite de oliva.
No debe aparecer: palta, semillas, hojas verdes, limón, salsas.
```

</details>

## 13 · Wok de pollo con verduras y arroz

- **Archivo esperado:** `13-wok-de-pollo-con-verduras-y-arroz.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Pechuga de pollo sin piel ni hueso, cruda | 150 g | crudo |
| Morrón rojo crudo | 60 g | crudo |
| Cebolla cruda | 40 g | crudo |
| Zanahoria cruda | 40 g | crudo |
| Arroz blanco de grano largo, cocido | 150 g | cocido |
| Aceite de girasol | 10 g | listo para consumir |

- **Preparación:** Saltear el pollo en tiras y después las verduras. Servir con el arroz.
- **Presentación:** Tiras de pollo salteadas con morrón rojo, cebolla y zanahoria en tiras; al lado, arroz blanco de grano largo.
- **No debe aparecer:** salsa de soja, sésamo, cebolla de verdeo, maní, palitos.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Wok de pollo con verduras y arroz», 1 porción. Ingredientes, en estas cantidades: Pechuga de pollo sin piel ni hueso, cruda: 150 g; Morrón rojo crudo: 60 g; Cebolla cruda: 40 g; Zanahoria cruda: 40 g; Arroz blanco de grano largo, cocido: 150 g; Aceite de girasol: 10 g.
Preparación: Saltear el pollo en tiras y después las verduras. Servir con el arroz.
Presentación: Tiras de pollo salteadas con morrón rojo, cebolla y zanahoria en tiras; al lado, arroz blanco de grano largo.
No debe aparecer: salsa de soja, sésamo, cebolla de verdeo, maní, palitos.
```

</details>

## 14 · Hamburguesa casera al plato con ensalada

- **Archivo esperado:** `14-hamburguesa-casera-al-plato-con-ensalada.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Carne picada vacuna 90 % magra, cruda | 150 g | crudo |
| Lechuga de hoja verde, cruda | 50 g | crudo |
| Tomate rojo maduro, crudo | 80 g | crudo |
| Cebolla cruda | 20 g | crudo |

- **Preparación:** Formar la hamburguesa y cocinarla a la plancha. Servir con la ensalada.
- **Presentación:** Un medallón de carne casero a la plancha, al plato y sin pan, con una ensalada de lechuga, tomate y cebolla al lado.
- **No debe aparecer:** pan de hamburguesa, queso, papas fritas, kétchup, mostaza o mayonesa, huevo.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Hamburguesa casera al plato con ensalada», 1 porción. Ingredientes, en estas cantidades: Carne picada vacuna 90 % magra, cruda: 150 g; Lechuga de hoja verde, cruda: 50 g; Tomate rojo maduro, crudo: 80 g; Cebolla cruda: 20 g.
Preparación: Formar la hamburguesa y cocinarla a la plancha. Servir con la ensalada.
Presentación: Un medallón de carne casero a la plancha, al plato y sin pan, con una ensalada de lechuga, tomate y cebolla al lado.
No debe aparecer: pan de hamburguesa, queso, papas fritas, kétchup, mostaza o mayonesa, huevo.
```

</details>

## 15 · Omelette de espinaca con tostada

- **Archivo esperado:** `15-omelette-de-espinaca-con-tostada.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Huevo de gallina entero, crudo | 100 g | crudo |
| Espinaca cruda | 60 g | crudo |
| Pan integral de trigo, de molde | 30 g | listo para consumir |
| Aceite de oliva | 5 g | listo para consumir |

- **Preparación:** Batir los huevos y cocinarlos con la espinaca. Servir con la tostada.
- **Presentación:** Un omelette doblado con espinaca, y una tostada de pan integral de molde al lado.
- **No debe aparecer:** queso, jamón, tomate, hierbas, manteca.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Omelette de espinaca con tostada», 1 porción. Ingredientes, en estas cantidades: Huevo de gallina entero, crudo: 100 g; Espinaca cruda: 60 g; Pan integral de trigo, de molde: 30 g; Aceite de oliva: 5 g.
Preparación: Batir los huevos y cocinarlos con la espinaca. Servir con la tostada.
Presentación: Un omelette doblado con espinaca, y una tostada de pan integral de molde al lado.
No debe aparecer: queso, jamón, tomate, hierbas, manteca.
```

</details>

## 16 · Manzana con nueces

- **Archivo esperado:** `16-manzana-con-nueces.jpg` (el del manifiesto; `fotoDe` lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Manzana con cáscara, cruda | 150 g | crudo |
| Nueces de nogal, peladas | 20 g | listo para consumir |

- **Preparación:** Cortar la manzana y servir con las nueces.
- **Presentación:** Una manzana roja con cáscara, cortada en gajos, y nueces peladas en mitades al lado.
- **No debe aparecer:** miel, canela, yogur, otras frutas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro liso, gris claro cálido o beige, sin textura llamativa. Superficie mate.
Vajilla coherente para toda la serie: plato playo blanco liso de 26 cm, o cuenco blanco liso de 15 cm, o vaso de vidrio liso de 300 ml, según la receta. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada, misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app).
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la lista de ingredientes: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Manzana con nueces», 1 porción. Ingredientes, en estas cantidades: Manzana con cáscara, cruda: 150 g; Nueces de nogal, peladas: 20 g.
Preparación: Cortar la manzana y servir con las nueces.
Presentación: Una manzana roja con cáscara, cortada en gajos, y nueces peladas en mitades al lado.
No debe aparecer: miel, canela, yogur, otras frutas.
```

</details>


---
Generado por `herramientas/generar.mjs` desde el manifiesto congelado y `herramientas/seleccion.mjs` (commit de referencia `e4512cb`). No editar a mano: cambiar la selección y volver a generar.
