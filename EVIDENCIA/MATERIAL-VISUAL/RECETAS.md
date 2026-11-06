# Recetas · fichas y prompts (66)

Las 66 recetas de ejemplo: las 16 originales del manifiesto congelado y las 50 nuevas de la
ampliación del 2026-10-28. Cada una tiene su archivo esperado, lo que lleva y el prompt para generar su foto.
**Ninguna tiene imagen todavía:** las sesiones que prepararon el material no tenían una herramienta que genere imágenes, y un prompt no es una imagen.
La foto es una referencia visual: no mide la porción ni cambia ningún cálculo. Las recetas completas de las nuevas (ingredientes
por parte, pasos y composición) están en `EVIDENCIA/RECETAS-AMPLIACION/RECETARIO.md`.

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

- Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
- Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
- Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
- Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
- Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
- Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
- Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.

## Las 16 originales

### R001 · Avena cocida con banana y canela

- **Archivo esperado:** `01-avena-cocida-con-banana-y-canela.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Avena cocida con banana y canela», 1 porción. Ingredientes, en estas cantidades: Avena arrollada, cruda: 40 g; Leche parcialmente descremada (2 % de grasa): 200 g; Banana cruda: 100 g; Canela molida: 2 g.
Preparación: Cocinar la avena con la leche 5 minutos. Servir con la banana en rodajas y la canela.
Presentación: Avena cocida en leche, cremosa, en el cuenco; encima, rodajas de banana y una línea fina de canela molida. Una cuchara a la derecha.
No debe aparecer: miel, frutos secos, frutos rojos, hojas de menta, leche aparte.
```

</details>

### R002 · Tostadas integrales con palta y huevo

- **Archivo esperado:** `02-tostadas-integrales-con-palta-y-huevo.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tostadas integrales con palta y huevo», 1 porción. Ingredientes, en estas cantidades: Pan integral de trigo, de molde: 60 g; Palta cruda: 50 g; Huevo duro: 50 g.
Preparación: Tostar el pan. Untar la palta y sumar el huevo en rodajas.
Presentación: Dos rebanadas de pan integral de molde tostadas, con la palta untada y el huevo duro en rodajas encima.
No debe aparecer: semillas, sal en escamas, pimienta, brotes, tomate, limón.
```

</details>

### R003 · Yogur natural con granola y frutillas

- **Archivo esperado:** `03-yogur-natural-con-granola-y-frutillas.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Yogur natural con granola y frutillas», 1 porción. Ingredientes, en estas cantidades: Yogur natural entero: 200 g; Granola casera: 30 g; Frutillas crudas: 80 g.
Preparación: Servir el yogur con la granola y las frutillas cortadas.
Presentación: Yogur natural blanco en el cuenco, con la granola encima y las frutillas cortadas al medio. Una cuchara a la derecha.
No debe aparecer: miel, otras frutas, hojas de menta, chocolate.
```

</details>

### R004 · Licuado de banana con leche y avena

- **Archivo esperado:** `04-licuado-de-banana-con-leche-y-avena.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: vaso de vidrio liso de 300 ml.
Receta: «Licuado de banana con leche y avena», 1 porción. Ingredientes, en estas cantidades: Leche parcialmente descremada (2 % de grasa): 250 g; Banana cruda: 120 g; Avena arrollada, cruda: 20 g.
Preparación: Licuar todo hasta que quede liso.
Presentación: Licuado liso, color crema claro, en el vaso, sin espuma exagerada. Nada apoyado en el borde.
No debe aparecer: rodajas de banana de adorno, canela, avena espolvoreada, crema, pajita de colores.
```

</details>

### R005 · Tostadas integrales con queso crema y tomate

- **Archivo esperado:** `05-tostadas-integrales-con-queso-crema-y-tomate.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tostadas integrales con queso crema y tomate», 1 porción. Ingredientes, en estas cantidades: Pan integral de trigo, de molde: 60 g; Queso crema: 40 g; Tomate rojo maduro, crudo: 80 g.
Preparación: Tostar el pan. Untar el queso y sumar el tomate en rodajas.
Presentación: Dos rebanadas de pan integral de molde tostadas, con el queso crema untado y rodajas de tomate encima.
No debe aparecer: albahaca, orégano, aceite, sal o pimienta visibles, jamón.
```

</details>

### R006 · Milanesa de carne al horno con puré de calabaza

- **Archivo esperado:** `06-milanesa-de-carne-al-horno-con-pure-de-calabaza.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Milanesa de carne al horno con puré de calabaza», 1 porción. Ingredientes, en estas cantidades: Nalga vacuna, magra, cruda: 150 g; Pan rallado común: 25 g; Huevo de gallina entero, crudo: 25 g; Zapallo anco al horno, sin sal: 200 g.
Preparación: Pasar la carne por huevo y pan rallado. Hornear 20 minutos, dando vuelta a la mitad. Servir con el zapallo hecho puré.
Presentación: Una milanesa de carne horneada, dorada y crocante, con el puré de zapallo anco al lado, liso y naranja.
No debe aparecer: limón, perejil, papas fritas, ensalada, huevo frito.
```

</details>

### R007 · Bife a la plancha con papas al horno y ensalada

- **Archivo esperado:** `07-bife-a-la-plancha-con-papas-al-horno-y-ensalada.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Bife a la plancha con papas al horno y ensalada», 1 porción. Ingredientes, en estas cantidades: Bife de chorizo, magro, crudo: 150 g; Papa al horno con cáscara, sin sal: 200 g; Lechuga de hoja verde, cruda: 50 g; Tomate rojo maduro, crudo: 80 g; Aceite de oliva: 10 g.
Preparación: Cocinar el bife a la plancha. Servir con las papas y la ensalada condimentada con el aceite.
Presentación: Un bife a la plancha, con las marcas de la plancha; papas al horno con cáscara, cortadas, y una ensalada de lechuga y tomate apenas brillante por el aceite de oliva.
No debe aparecer: chimichurri, sal gruesa visible, cebolla, huevo frito, limón.
```

</details>

### R008 · Merluza al horno con puré de papa y brócoli

- **Archivo esperado:** `08-merluza-al-horno-con-pure-de-papa-y-brocoli.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Merluza al horno con puré de papa y brócoli», 1 porción. Ingredientes, en estas cantidades: Merluza (whiting), cruda: 150 g; Papa hervida sin cáscara, sin sal: 200 g; Brócoli hervido y escurrido, sin sal: 100 g.
Preparación: Hornear la merluza 15 minutos. Servir con el puré y el brócoli.
Presentación: Un filete de merluza al horno, blanco y apenas dorado; puré de papa liso y ramilletes de brócoli hervido, verde intenso.
No debe aparecer: limón, perejil, manteca visible, salsa.
```

</details>

### R009 · Fideos con salsa bolognesa

- **Archivo esperado:** `09-fideos-con-salsa-bolognesa.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Fideos con salsa bolognesa», 1 porción. Ingredientes, en estas cantidades: Fideos de trigo hervidos, sin sal: 200 g; Carne picada vacuna 90 % magra, cruda: 80 g; Puré de tomate sin sal agregada: 100 g; Cebolla cruda: 30 g.
Preparación: Dorar la cebolla y la carne. Sumar el puré de tomate y cocinar 15 minutos. Servir sobre los fideos.
Presentación: Fideos largos tipo spaghetti con la salsa bolognesa encima: carne picada y tomate, roja.
No debe aparecer: queso rallado, albahaca, perejil, pan.
```

</details>

### R010 · Guiso de lentejas con verduras

- **Archivo esperado:** `10-guiso-de-lentejas-con-verduras.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Guiso de lentejas con verduras», 1 porción. Ingredientes, en estas cantidades: Lentejas hervidas sin sal: 200 g; Zanahoria cruda: 50 g; Zapallo anco crudo: 80 g; Cebolla cruda: 30 g.
Preparación: Cocinar la cebolla, la zanahoria y el zapallo en un poco de agua. Sumar las lentejas y cocinar hasta que espese.
Presentación: Guiso espeso de lentejas con cubos de zanahoria y de zapallo, y cebolla, en el cuenco. Una cuchara a la derecha.
No debe aparecer: chorizo, panceta, perejil, pan, huevo.
```

</details>

### R011 · Tarta de acelga con ensalada de tomate

- **Archivo esperado:** `11-tarta-de-acelga-con-ensalada-de-tomate.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de acelga con ensalada de tomate», 1 porción. Ingredientes, en estas cantidades: Acelga hervida, sin sal: 150 g; Huevo de gallina entero, crudo: 50 g; Harina de trigo blanca de uso general, enriquecida: 40 g; Aceite de girasol: 10 g; Tomate rojo maduro, crudo: 100 g.
Preparación: Hacer una masa con la harina, el aceite y un poco de agua. Mezclar la acelga con el huevo y cubrir con la masa. Hornear 30 minutos y servir con la ensalada de tomate.
Presentación: Una porción de tarta de acelga: masa casera dorada y relleno verde de acelga con huevo; al lado, rodajas de tomate solas.
No debe aparecer: queso, huevo duro, cebolla, orégano, aceite sobre el tomate.
```

</details>

### R012 · Bowl de quinoa con garbanzos, huevo y verduras

- **Archivo esperado:** `12-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Bowl de quinoa con garbanzos, huevo y verduras», 1 porción. Ingredientes, en estas cantidades: Quinoa cocida: 150 g; Garbanzos hervidos, sin sal: 100 g; Huevo duro: 50 g; Tomate rojo maduro, crudo: 60 g; Zanahoria cruda: 40 g; Aceite de oliva: 10 g.
Preparación: Armar el bowl con todo y condimentar con el aceite.
Presentación: Bowl armado por sectores: quinoa, garbanzos, un huevo duro en mitades, tomate en cubos y zanahoria rallada, con un brillo de aceite de oliva.
No debe aparecer: palta, semillas, hojas verdes, limón, salsas.
```

</details>

### R013 · Wok de pollo con verduras y arroz

- **Archivo esperado:** `13-wok-de-pollo-con-verduras-y-arroz.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Wok de pollo con verduras y arroz», 1 porción. Ingredientes, en estas cantidades: Pechuga de pollo sin piel ni hueso, cruda: 150 g; Morrón rojo crudo: 60 g; Cebolla cruda: 40 g; Zanahoria cruda: 40 g; Arroz blanco de grano largo, cocido: 150 g; Aceite de girasol: 10 g.
Preparación: Saltear el pollo en tiras y después las verduras. Servir con el arroz.
Presentación: Tiras de pollo salteadas con morrón rojo, cebolla y zanahoria en tiras; al lado, arroz blanco de grano largo.
No debe aparecer: salsa de soja, sésamo, cebolla de verdeo, maní, palitos.
```

</details>

### R014 · Hamburguesa casera al plato con ensalada

- **Archivo esperado:** `14-hamburguesa-casera-al-plato-con-ensalada.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Hamburguesa casera al plato con ensalada», 1 porción. Ingredientes, en estas cantidades: Carne picada vacuna 90 % magra, cruda: 150 g; Lechuga de hoja verde, cruda: 50 g; Tomate rojo maduro, crudo: 80 g; Cebolla cruda: 20 g.
Preparación: Formar la hamburguesa y cocinarla a la plancha. Servir con la ensalada.
Presentación: Un medallón de carne casero a la plancha, al plato y sin pan, con una ensalada de lechuga, tomate y cebolla al lado.
No debe aparecer: pan de hamburguesa, queso, papas fritas, kétchup, mostaza o mayonesa, huevo.
```

</details>

### R015 · Omelette de espinaca con tostada

- **Archivo esperado:** `15-omelette-de-espinaca-con-tostada.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

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
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Omelette de espinaca con tostada», 1 porción. Ingredientes, en estas cantidades: Huevo de gallina entero, crudo: 100 g; Espinaca cruda: 60 g; Pan integral de trigo, de molde: 30 g; Aceite de oliva: 5 g.
Preparación: Batir los huevos y cocinarlos con la espinaca. Servir con la tostada.
Presentación: Un omelette doblado con espinaca, y una tostada de pan integral de molde al lado.
No debe aparecer: queso, jamón, tomate, hierbas, manteca.
```

</details>

### R016 · Manzana con nueces

- **Archivo esperado:** `16-manzana-con-nueces.jpg` (el del manifiesto congelado; su herramienta lo busca por el número). **Estado:** ficha lista, sin imagen.

| Ingrediente | Cantidad | Estado |
|---|---|---|
| Manzana con cáscara, cruda | 150 g | crudo |
| Nueces de nogal, peladas | 20 g | listo para consumir |

- **Preparación:** Cortar la manzana y servir con las nueces.
- **Presentación:** Una manzana roja con cáscara, cortada en gajos, y nueces peladas en mitades al lado.
- **No debe aparecer:** miel, canela, yogur, otras frutas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Manzana con nueces», 1 porción. Ingredientes, en estas cantidades: Manzana con cáscara, cruda: 150 g; Nueces de nogal, peladas: 20 g.
Preparación: Cortar la manzana y servir con las nueces.
Presentación: Una manzana roja con cáscara, cortada en gajos, y nueces peladas en mitades al lado.
No debe aparecer: miel, canela, yogur, otras frutas.
```

</details>

## Las 50 nuevas

La foto muestra **una porción** de una receta que rinde varias: el prompt dice qué porción y lo que lleva la receta, sin
las cantidades de la receta entera (que harían pensar en una fuente). Las cantidades están en el recetario.

### R017 · Tarta de pollo y puerro

- **Archivo esperado:** `R017-tarta-de-pollo-y-puerro.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra un cuarto de tarta.
- **Presentación:** Una porción triangular (un cuarto) de tarta casera abierta, con el borde de masa dorado y el corte a la vista: cubos de pollo y rodajas de puerro ligados con huevo, apenas gratinado arriba.
- **No debe aparecer:** tapa de masa arriba, ensalada, jamón, queso derretido en hilos, hierbas frescas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de pollo y puerro». Rinde 4 porciones; la foto muestra una sola: un cuarto de tarta.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, pechuga de pollo, puerro, cebolla, huevo, leche descremada, queso parmesano rallado.
Presentación: Una porción triangular (un cuarto) de tarta casera abierta, con el borde de masa dorado y el corte a la vista: cubos de pollo y rodajas de puerro ligados con huevo, apenas gratinado arriba.
No debe aparecer: tapa de masa arriba, ensalada, jamón, queso derretido en hilos, hierbas frescas.
```

</details>

### R018 · Tarta de zapallitos y ricota

- **Archivo esperado:** `R018-tarta-de-zapallitos-y-ricota.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra un cuarto de tarta.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno verde claro de zapallito rallado y ricota, firme y apenas dorado arriba; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, tomate, jamón, cebolla de verdeo encima, ensalada.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de zapallitos y ricota». Rinde 4 porciones; la foto muestra una sola: un cuarto de tarta.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, zapallitos, cebolla, ricota, huevo, queso parmesano rallado.
Presentación: Una porción triangular (un cuarto) de tarta abierta, con el relleno verde claro de zapallito rallado y ricota, firme y apenas dorado arriba; el borde de masa dorado.
No debe aparecer: tapa de masa arriba, tomate, jamón, cebolla de verdeo encima, ensalada.
```

</details>

### R019 · Tarta de atún, tomate y huevo

- **Archivo esperado:** `R019-tarta-de-atun-tomate-y-huevo.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra un cuarto de tarta.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno de atún, tomate y morrón ligado con huevo, y rodajas de huevo duro asomando arriba; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, aceitunas, mayonesa, lechuga, queso gratinado.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de atún, tomate y huevo». Rinde 4 porciones; la foto muestra una sola: un cuarto de tarta.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, atún al natural, tomate, cebolla, morrón rojo, huevo, huevo duro, orégano.
Presentación: Una porción triangular (un cuarto) de tarta abierta, con el relleno de atún, tomate y morrón ligado con huevo, y rodajas de huevo duro asomando arriba; el borde de masa dorado.
No debe aparecer: tapa de masa arriba, aceitunas, mayonesa, lechuga, queso gratinado.
```

</details>

### R020 · Tarta de calabaza, cebolla y queso

- **Archivo esperado:** `R020-tarta-de-calabaza-cebolla-y-queso.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra un cuarto de tarta.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno naranja de calabaza, hilos de cebolla dorada y una capa fina de queso gratinado; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, semillas de zapallo, hojas verdes, jamón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tarta de calabaza, cebolla y queso». Rinde 4 porciones; la foto muestra una sola: un cuarto de tarta.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, calabaza, cebolla, huevo, queso muzzarella.
Presentación: Una porción triangular (un cuarto) de tarta abierta, con el relleno naranja de calabaza, hilos de cebolla dorada y una capa fina de queso gratinado; el borde de masa dorado.
No debe aparecer: tapa de masa arriba, semillas de zapallo, hojas verdes, jamón.
```

</details>

### R021 · Empanadas de carne magra al horno

- **Archivo esperado:** `R021-empanadas-de-carne-magra-al-horno.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 3 empanadas.
- **Presentación:** Tres empanadas al horno, doradas y con repulgue; una abierta al medio muestra el relleno de carne picada con huevo duro y aceituna.
- **No debe aparecer:** salsa criolla, limón, empanadas fritas con burbujas, papas fritas, pasas de uva.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Empanadas de carne magra al horno». Rinde 4 porciones; la foto muestra una sola: 3 empanadas.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, carne picada magra, cebolla, morrón rojo, cebolla de verdeo, pimentón, huevo duro, aceitunas verdes, huevo.
Presentación: Tres empanadas al horno, doradas y con repulgue; una abierta al medio muestra el relleno de carne picada con huevo duro y aceituna.
No debe aparecer: salsa criolla, limón, empanadas fritas con burbujas, papas fritas, pasas de uva.
```

</details>

### R022 · Empanadas de pollo y verduras

- **Archivo esperado:** `R022-empanadas-de-pollo-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 3 empanadas.
- **Presentación:** Tres empanadas al horno, doradas, con un repulgue distinto del de las de carne; una cortada al medio muestra el relleno cremoso de pollo desmenuzado con verduras.
- **No debe aparecer:** salsa, limón, aceitunas, huevo duro, empanadas fritas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Empanadas de pollo y verduras». Rinde 4 porciones; la foto muestra una sola: 3 empanadas.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, pollo hervido, cebolla, morrón rojo, zanahoria, cebolla de verdeo, leche descremada, pimentón, huevo.
Presentación: Tres empanadas al horno, doradas, con un repulgue distinto del de las de carne; una cortada al medio muestra el relleno cremoso de pollo desmenuzado con verduras.
No debe aparecer: salsa, limón, aceitunas, huevo duro, empanadas fritas.
```

</details>

### R023 · Empanadas de humita

- **Archivo esperado:** `R023-empanadas-de-humita.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 3 empanadas.
- **Presentación:** Tres empanadas al horno, doradas, con su propio repulgue; una abierta muestra el relleno amarillo y cremoso de choclo.
- **No debe aparecer:** queso derretido, carne, salsa, mazorca de choclo entera, empanadas fritas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Empanadas de humita». Rinde 4 porciones; la foto muestra una sola: 3 empanadas.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, choclo en granos, cebolla, morrón rojo, leche descremada, huevo.
Presentación: Tres empanadas al horno, doradas, con su propio repulgue; una abierta muestra el relleno amarillo y cremoso de choclo.
No debe aparecer: queso derretido, carne, salsa, mazorca de choclo entera, empanadas fritas.
```

</details>

### R024 · Empanadas de lentejas y calabaza

- **Archivo esperado:** `R024-empanadas-de-lentejas-y-calabaza.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 3 empanadas.
- **Presentación:** Tres empanadas al horno, doradas; una abierta muestra el relleno de lentejas con cubos de calabaza naranja.
- **No debe aparecer:** carne, queso, huevo duro, salsa, empanadas fritas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Empanadas de lentejas y calabaza». Rinde 4 porciones; la foto muestra una sola: 3 empanadas.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, lentejas hervidas, calabaza, cebolla, morrón rojo, ajo, pimentón.
Presentación: Tres empanadas al horno, doradas; una abierta muestra el relleno de lentejas con cubos de calabaza naranja.
No debe aparecer: carne, queso, huevo duro, salsa, empanadas fritas.
```

</details>

### R025 · Pizza casera de muzzarella y tomate

- **Archivo esperado:** `R025-pizza-casera-de-muzzarella-y-tomate.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 2 porciones de pizza (un cuarto).
- **Presentación:** Dos porciones triangulares de pizza casera de masa de espesor normal, con muzzarella derretida, rodajas de tomate y orégano.
- **No debe aparecer:** aceitunas, jamón, albahaca, morrón, borde relleno.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Pizza casera de muzzarella y tomate». Rinde 4 porciones; la foto muestra una sola: 2 porciones de pizza (un cuarto).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, puré de tomate, ajo, orégano, queso muzzarella, tomate.
Presentación: Dos porciones triangulares de pizza casera de masa de espesor normal, con muzzarella derretida, rodajas de tomate y orégano.
No debe aparecer: aceitunas, jamón, albahaca, morrón, borde relleno.
```

</details>

### R026 · Pizza casera de pollo y verduras asadas

- **Archivo esperado:** `R026-pizza-casera-de-pollo-y-verduras-asadas.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 2 porciones de pizza (un cuarto).
- **Presentación:** Dos porciones triangulares de pizza casera de masa apenas integral, con tiras de pollo dorado, verduras asadas (morrón, cebolla, zucchini y berenjena) y poca muzzarella.
- **No debe aparecer:** aceitunas, rúcula, jamón, huevo, salsa barbacoa.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Pizza casera de pollo y verduras asadas». Rinde 4 porciones; la foto muestra una sola: 2 porciones de pizza (un cuarto).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, harina integral, morrón rojo, cebolla, zucchini, berenjena, pechuga de pollo, pimentón, puré de tomate, orégano, queso muzzarella.
Presentación: Dos porciones triangulares de pizza casera de masa apenas integral, con tiras de pollo dorado, verduras asadas (morrón, cebolla, zucchini y berenjena) y poca muzzarella.
No debe aparecer: aceitunas, rúcula, jamón, huevo, salsa barbacoa.
```

</details>

### R027 · Fainá de garbanzo y cebolla con ensalada

- **Archivo esperado:** `R027-faina-de-garbanzo-y-cebolla-con-ensalada.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra 2 porciones de fainá y un cuarto de la ensalada.
- **Presentación:** Dos porciones de fainá dorada y fina, con cebolla en pluma encima, y al lado una ensalada de lechuga, tomate y huevo duro.
- **No debe aparecer:** pizza, queso, aceitunas, pimienta en grano.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Fainá de garbanzo y cebolla con ensalada». Rinde 4 porciones; la foto muestra una sola: 2 porciones de fainá y un cuarto de la ensalada.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina de garbanzo, cebolla, lechuga, tomate, huevo duro.
Presentación: Dos porciones de fainá dorada y fina, con cebolla en pluma encima, y al lado una ensalada de lechuga, tomate y huevo duro.
No debe aparecer: pizza, queso, aceitunas, pimienta en grano.
```

</details>

### R028 · Calzone de espinaca y ricota

- **Archivo esperado:** `R028-calzone-de-espinaca-y-ricota.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Tartas, empanadas, pizzas y masas saladas. **Rinde:** 4 porciones; la foto muestra un calzone.
- **Presentación:** Un calzone dorado en forma de media luna, cortado al medio para mostrar el relleno verde y blanco de espinaca y ricota.
- **No debe aparecer:** salsa de tomate, jamón, albahaca, ensalada.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Calzone de espinaca y ricota». Rinde 4 porciones; la foto muestra una sola: un calzone.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, espinaca, ajo, ricota, queso muzzarella, queso parmesano rallado, huevo.
Presentación: Un calzone dorado en forma de media luna, cortado al medio para mostrar el relleno verde y blanco de espinaca y ricota.
No debe aparecer: salsa de tomate, jamón, albahaca, ensalada.
```

</details>

### R029 · Tallarines con pollo, brócoli y salsa blanca casera

- **Archivo esperado:** `R029-tallarines-con-pollo-brocoli-y-salsa-blanca-casera.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la preparación).
- **Presentación:** Un plato de tallarines con salsa blanca, cubos de pollo y ramilletes de brócoli verde, con queso parmesano rallado por encima.
- **No debe aparecer:** panceta, hongos, perejil, crema espesa en exceso, pan.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Tallarines con pollo, brócoli y salsa blanca casera». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la preparación).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): tallarines secos, pechuga de pollo, brócoli, harina 000, leche descremada, queso parmesano rallado.
Presentación: Un plato de tallarines con salsa blanca, cubos de pollo y ramilletes de brócoli verde, con queso parmesano rallado por encima.
No debe aparecer: panceta, hongos, perejil, crema espesa en exceso, pan.
```

</details>

### R030 · Fideos con atún, tomate y aceitunas

- **Archivo esperado:** `R030-fideos-con-atun-tomate-y-aceitunas.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la preparación).
- **Presentación:** Un plato de fideos largos con salsa roja de tomate, trozos de atún y rodajas de aceituna negra, con perejil picado.
- **No debe aparecer:** queso rallado, albahaca, alcaparras, pan, limón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Fideos con atún, tomate y aceitunas». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la preparación).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): fideos secos, ajo, cebolla, tomate pelado en lata, orégano, atún al natural, aceitunas negras, perejil fresco.
Presentación: Un plato de fideos largos con salsa roja de tomate, trozos de atún y rodajas de aceituna negra, con perejil picado.
No debe aparecer: queso rallado, albahaca, alcaparras, pan, limón.
```

</details>

### R031 · Ravioles de ricota y espinaca con salsa de tomate

- **Archivo esperado:** `R031-ravioles-de-ricota-y-espinaca-con-salsa-de-tomate.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra unos 15 ravioles, con su salsa.
- **Presentación:** Un plato con unos 15 ravioles caseros cuadrados, de bordes cortados, cubiertos en parte con salsa de tomate; uno abierto deja ver el relleno verde y blanco.
- **No debe aparecer:** queso rallado encima, albahaca, crema, carne.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Ravioles de ricota y espinaca con salsa de tomate». Rinde 4 porciones; la foto muestra una sola: unos 15 ravioles, con su salsa.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, huevo, ricota, espinaca, queso parmesano rallado, cebolla, ajo, tomate pelado en lata, orégano.
Presentación: Un plato con unos 15 ravioles caseros cuadrados, de bordes cortados, cubiertos en parte con salsa de tomate; uno abierto deja ver el relleno verde y blanco.
No debe aparecer: queso rallado encima, albahaca, crema, carne.
```

</details>

### R032 · Canelones de ricota y espinaca al horno

- **Archivo esperado:** `R032-canelones-de-ricota-y-espinaca-al-horno.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra 3 canelones con su salsa.
- **Presentación:** Tres canelones de panqueque en un plato, con salsa de tomate y salsa blanca gratinada con queso; uno cortado muestra el relleno verde de espinaca y ricota.
- **No debe aparecer:** carne, jamón, albahaca, pan.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Canelones de ricota y espinaca al horno». Rinde 4 porciones; la foto muestra una sola: 3 canelones con su salsa.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, leche descremada, huevo, espinaca, cebolla, ricota, queso parmesano rallado, tomate pelado en lata, ajo, queso muzzarella.
Presentación: Tres canelones de panqueque en un plato, con salsa de tomate y salsa blanca gratinada con queso; uno cortado muestra el relleno verde de espinaca y ricota.
No debe aparecer: carne, jamón, albahaca, pan.
```

</details>

### R033 · Lasaña de carne y berenjena

- **Archivo esperado:** `R033-lasana-de-carne-y-berenjena.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 6 porciones; la foto muestra un sexto de la fuente.
- **Presentación:** Una porción rectangular de lasaña con las capas a la vista (placas de pasta, salsa de carne roja, rodajas de berenjena y salsa blanca) y el queso gratinado arriba.
- **No debe aparecer:** albahaca, ricota en grumos, pan de ajo, ensalada.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Lasaña de carne y berenjena». Rinde 6 porciones; la foto muestra una sola: un sexto de la fuente.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): placas de lasaña secas, berenjena, cebolla, zanahoria, ajo, carne picada magra, tomate pelado en lata, orégano, leche descremada, queso muzzarella, queso parmesano rallado.
Presentación: Una porción rectangular de lasaña con las capas a la vista (placas de pasta, salsa de carne roja, rodajas de berenjena y salsa blanca) y el queso gratinado arriba.
No debe aparecer: albahaca, ricota en grumos, pan de ajo, ensalada.
```

</details>

### R034 · Ñoquis de papa con tuco de carne

- **Archivo esperado:** `R034-noquis-de-papa-con-tuco-de-carne.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra un plato de ñoquis con su tuco.
- **Presentación:** Un plato de ñoquis de papa con tuco rojo y trozos de carne tierna, con un poco de queso parmesano rallado.
- **No debe aparecer:** albahaca, crema, salsa blanca, pan.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Ñoquis de papa con tuco de carne». Rinde 4 porciones; la foto muestra una sola: un plato de ñoquis con su tuco.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): papa hervida, harina 000, huevo, carne para tuco, cebolla, zanahoria, morrón rojo, ajo, tomate pelado en lata, orégano, queso parmesano rallado.
Presentación: Un plato de ñoquis de papa con tuco rojo y trozos de carne tierna, con un poco de queso parmesano rallado.
No debe aparecer: albahaca, crema, salsa blanca, pan.
```

</details>

### R035 · Polenta cremosa con tuco de carne magra

- **Archivo esperado:** `R035-polenta-cremosa-con-tuco-de-carne-magra.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra un plato hondo de polenta con su tuco.
- **Presentación:** Un plato hondo con polenta amarilla cremosa y tuco de carne en cubos por encima.
- **No debe aparecer:** queso derretido en hilos, hongos, salchichas, albahaca.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Polenta cremosa con tuco de carne magra». Rinde 4 porciones; la foto muestra una sola: un plato hondo de polenta con su tuco.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): polenta, leche descremada, queso parmesano rallado, peceto, cebolla, morrón rojo, zanahoria, ajo, tomate pelado en lata, pimentón, orégano.
Presentación: Un plato hondo con polenta amarilla cremosa y tuco de carne en cubos por encima.
No debe aparecer: queso derretido en hilos, hongos, salchichas, albahaca.
```

</details>

### R036 · Fideos con salsa de lentejas y tomate

- **Archivo esperado:** `R036-fideos-con-salsa-de-lentejas-y-tomate.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Pastas y polenta. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la preparación).
- **Presentación:** Un plato de fideos cortos (mostachol) con una salsa espesa y rojiza de lentejas rojas y tomate, sin carne.
- **No debe aparecer:** carne picada, queso rallado, albahaca, crema.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Fideos con salsa de lentejas y tomate». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la preparación).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): fideos secos, lentejas rojas, cebolla, zanahoria, apio, ajo, tomate pelado en lata, pimentón.
Presentación: Un plato de fideos cortos (mostachol) con una salsa espesa y rojiza de lentejas rojas y tomate, sin carne.
No debe aparecer: carne picada, queso rallado, albahaca, crema.
```

</details>

### R037 · Hamburguesa casera de pollo en pan con lechuga y tomate

- **Archivo esperado:** `R037-hamburguesa-casera-de-pollo-en-pan-con-lechuga-y-tomate.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra una hamburguesa en pan, con lechuga, tomate y mostaza.
- **Presentación:** Una hamburguesa de pollo casera, dorada, en su pan abierto, con lechuga y rodajas de tomate; se ve que la carne es clara, de pollo.
- **No debe aparecer:** queso cheddar, panceta, papas fritas, huevo frito, kétchup o mayonesa.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Hamburguesa casera de pollo en pan con lechuga y tomate». Rinde 4 porciones; la foto muestra una sola: una hamburguesa en pan, con lechuga, tomate y mostaza.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): pechuga de pollo, cebolla, ajo, perejil fresco, pan rallado, huevo, pimentón, pan de hamburguesa, lechuga, tomate, mostaza.
Presentación: Una hamburguesa de pollo casera, dorada, en su pan abierto, con lechuga y rodajas de tomate; se ve que la carne es clara, de pollo.
No debe aparecer: queso cheddar, panceta, papas fritas, huevo frito, kétchup o mayonesa.
```

</details>

### R038 · Hamburguesa de lentejas y avena en pan

- **Archivo esperado:** `R038-hamburguesa-de-lentejas-y-avena-en-pan.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra una hamburguesa en pan, con lechuga, tomate y mayonesa liviana.
- **Presentación:** Una hamburguesa de lentejas y avena, de color marrón con trocitos de zanahoria, en su pan con lechuga y tomate; se nota que no es de carne.
- **No debe aparecer:** queso, panceta, papas fritas, aspecto de carne vacuna.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Hamburguesa de lentejas y avena en pan». Rinde 4 porciones; la foto muestra una sola: una hamburguesa en pan, con lechuga, tomate y mayonesa liviana.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): lentejas hervidas, avena arrollada, cebolla, zanahoria, ajo, huevo, pimentón, pan de hamburguesa, lechuga, tomate, mayonesa liviana.
Presentación: Una hamburguesa de lentejas y avena, de color marrón con trocitos de zanahoria, en su pan con lechuga y tomate; se nota que no es de carne.
No debe aparecer: queso, panceta, papas fritas, aspecto de carne vacuna.
```

</details>

### R039 · Medallones de garbanzo y zanahoria con ensalada

- **Archivo esperado:** `R039-medallones-de-garbanzo-y-zanahoria-con-ensalada.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra 2 medallones, un cuarto de la ensalada y de la salsa.
- **Presentación:** Dos medallones de garbanzo dorados, con trocitos de zanahoria a la vista, al lado de una ensalada de lechuga, tomate y cebolla y una cucharada de salsa blanca de yogur.
- **No debe aparecer:** pan, papas fritas, carne, semillas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Medallones de garbanzo y zanahoria con ensalada». Rinde 4 porciones; la foto muestra una sola: 2 medallones, un cuarto de la ensalada y de la salsa.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): garbanzos de lata, zanahoria, cebolla, ajo, perejil fresco, huevo, pan rallado, lechuga, tomate, yogur griego descremado.
Presentación: Dos medallones de garbanzo dorados, con trocitos de zanahoria a la vista, al lado de una ensalada de lechuga, tomate y cebolla y una cucharada de salsa blanca de yogur.
No debe aparecer: pan, papas fritas, carne, semillas.
```

</details>

### R040 · Milanesa de pollo napolitana al horno con ensalada

- **Archivo esperado:** `R040-milanesa-de-pollo-napolitana-al-horno-con-ensalada.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra una milanesa napolitana con un cuarto de la ensalada.
- **Presentación:** Una milanesa de pollo napolitana horneada, con salsa de tomate, jamón y muzzarella derretida con orégano, al lado de una ensalada de lechuga, tomate y cebolla.
- **No debe aparecer:** papas fritas, huevo frito, limón, aceitunas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Milanesa de pollo napolitana al horno con ensalada». Rinde 4 porciones; la foto muestra una sola: una milanesa napolitana con un cuarto de la ensalada.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): pechuga de pollo, huevo, ajo, perejil fresco, pan rallado, puré de tomate, jamón cocido, queso muzzarella, orégano, lechuga, tomate, cebolla.
Presentación: Una milanesa de pollo napolitana horneada, con salsa de tomate, jamón y muzzarella derretida con orégano, al lado de una ensalada de lechuga, tomate y cebolla.
No debe aparecer: papas fritas, huevo frito, limón, aceitunas.
```

</details>

### R041 · Sándwich de pollo desmenuzado, huevo y verduras

- **Archivo esperado:** `R041-sandwich-de-pollo-desmenuzado-huevo-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra un sándwich de 2 rebanadas, con su relleno.
- **Presentación:** Un sándwich de pan integral de molde cortado en diagonal, con el relleno a la vista: pollo desmenuzado, rodajas de huevo duro, tomate, lechuga y zanahoria rallada.
- **No debe aparecer:** jamón, queso, papas fritas, palta.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Sándwich de pollo desmenuzado, huevo y verduras». Rinde 4 porciones; la foto muestra una sola: un sándwich de 2 rebanadas, con su relleno.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): pan integral de molde, pollo hervido, huevo duro, lechuga, tomate, zanahoria, mayonesa liviana.
Presentación: Un sándwich de pan integral de molde cortado en diagonal, con el relleno a la vista: pollo desmenuzado, rodajas de huevo duro, tomate, lechuga y zanahoria rallada.
No debe aparecer: jamón, queso, papas fritas, palta.
```

</details>

### R042 · Sándwich casero de lomito con verduras

- **Archivo esperado:** `R042-sandwich-casero-de-lomito-con-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Hamburguesas, sándwiches y milanesa. **Rinde:** 4 porciones; la foto muestra un sándwich de lomito.
- **Presentación:** Un sándwich de lomito en pan francés, abierto a la mitad, con un bife fino de lomo, morrón y cebolla a la plancha, lechuga y tomate.
- **No debe aparecer:** jamón, queso, huevo frito, papas fritas, panceta.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Sándwich casero de lomito con verduras». Rinde 4 porciones; la foto muestra una sola: un sándwich de lomito.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): lomo, pan francés, morrón rojo, cebolla, lechuga, tomate, mayonesa liviana.
Presentación: Un sándwich de lomito en pan francés, abierto a la mitad, con un bife fino de lomo, morrón y cebolla a la plancha, lechuga y tomate.
No debe aparecer: jamón, queso, huevo frito, papas fritas, panceta.
```

</details>

### R043 · Pastel de papa con carne magra y arvejas

- **Archivo esperado:** `R043-pastel-de-papa-con-carne-magra-y-arvejas.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra un cuarto de la fuente.
- **Presentación:** Una porción cuadrada de pastel de papa con las dos capas a la vista: abajo el relleno de carne picada con arvejas, arriba el puré dorado.
- **No debe aparecer:** huevo duro, aceitunas, pasas de uva, queso gratinado.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Pastel de papa con carne magra y arvejas». Rinde 4 porciones; la foto muestra una sola: un cuarto de la fuente.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): carne picada magra, cebolla, morrón rojo, arvejas, pimentón, orégano, papa hervida, leche descremada, manteca, huevo.
Presentación: Una porción cuadrada de pastel de papa con las dos capas a la vista: abajo el relleno de carne picada con arvejas, arriba el puré dorado.
No debe aparecer: huevo duro, aceitunas, pasas de uva, queso gratinado.
```

</details>

### R044 · Pastel de calabaza y pollo

- **Archivo esperado:** `R044-pastel-de-calabaza-y-pollo.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra un cuarto de la fuente.
- **Presentación:** Una porción de pastel en dos capas: abajo el relleno cremoso de pollo con morrón, arriba el puré naranja de calabaza dorado.
- **No debe aparecer:** papa, carne picada, huevo duro, aceitunas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Pastel de calabaza y pollo». Rinde 4 porciones; la foto muestra una sola: un cuarto de la fuente.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): calabaza, queso parmesano rallado, pechuga de pollo, cebolla, morrón rojo, cebolla de verdeo, leche descremada, pimentón.
Presentación: Una porción de pastel en dos capas: abajo el relleno cremoso de pollo con morrón, arriba el puré naranja de calabaza dorado.
No debe aparecer: papa, carne picada, huevo duro, aceitunas.
```

</details>

### R045 · Zapallitos rellenos de carne y arroz

- **Archivo esperado:** `R045-zapallitos-rellenos-de-carne-y-arroz.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra 2 zapallitos (4 mitades) rellenos.
- **Presentación:** Cuatro mitades de zapallito redondo rellenas de carne y arroz, gratinadas con queso, en un plato.
- **No debe aparecer:** salsa de tomate, ensalada, pan, huevo frito.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Zapallitos rellenos de carne y arroz». Rinde 4 porciones; la foto muestra una sola: 2 zapallitos (4 mitades) rellenos.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): zapallitos, arroz, carne picada magra, cebolla, morrón rojo, ajo, huevo, pimentón, queso parmesano rallado.
Presentación: Cuatro mitades de zapallito redondo rellenas de carne y arroz, gratinadas con queso, en un plato.
No debe aparecer: salsa de tomate, ensalada, pan, huevo frito.
```

</details>

### R046 · Berenjenas rellenas de lentejas y verduras

- **Archivo esperado:** `R046-berenjenas-rellenas-de-lentejas-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra una berenjena (2 mitades) rellena.
- **Presentación:** Dos mitades de berenjena asada rellenas de lentejas con verduras, gratinadas con muzzarella.
- **No debe aparecer:** carne, pan, ensalada, salsa blanca.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Berenjenas rellenas de lentejas y verduras». Rinde 4 porciones; la foto muestra una sola: una berenjena (2 mitades) rellena.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): berenjena, lentejas hervidas, cebolla, morrón rojo, zanahoria, ajo, tomate pelado en lata, pimentón, queso muzzarella.
Presentación: Dos mitades de berenjena asada rellenas de lentejas con verduras, gratinadas con muzzarella.
No debe aparecer: carne, pan, ensalada, salsa blanca.
```

</details>

### R047 · Albóndigas de carne con salsa de tomate y arroz

- **Archivo esperado:** `R047-albondigas-de-carne-con-salsa-de-tomate-y-arroz.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra 5 albóndigas con salsa y un cuarto del arroz.
- **Presentación:** Cinco albóndigas de carne en salsa de tomate, al lado de una porción de arroz blanco.
- **No debe aparecer:** queso rallado, pan, papas, perejil fresco encima.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Albóndigas de carne con salsa de tomate y arroz». Rinde 4 porciones; la foto muestra una sola: 5 albóndigas con salsa y un cuarto del arroz.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): carne picada magra, pan rallado, huevo, cebolla, ajo, perejil fresco, morrón rojo, tomate pelado en lata, orégano, arroz.
Presentación: Cinco albóndigas de carne en salsa de tomate, al lado de una porción de arroz blanco.
No debe aparecer: queso rallado, pan, papas, perejil fresco encima.
```

</details>

### R048 · Pollo al limón con batatas al horno

- **Archivo esperado:** `R048-pollo-al-limon-con-batatas-al-horno.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra una suprema con un cuarto de las batatas.
- **Presentación:** Una suprema de pollo al horno, dorada y brillante por la marinada, con gajos de batata asada.
- **No debe aparecer:** rodajas de limón, romero, papas, ensalada.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Pollo al limón con batatas al horno». Rinde 4 porciones; la foto muestra una sola: una suprema con un cuarto de las batatas.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): suprema de pollo, ajo, orégano, pimentón, batata.
Presentación: Una suprema de pollo al horno, dorada y brillante por la marinada, con gajos de batata asada.
No debe aparecer: rodajas de limón, romero, papas, ensalada.
```

</details>

### R049 · Merluza en papillote con verduras y papa

- **Archivo esperado:** `R049-merluza-en-papillote-con-verduras-y-papa.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra un paquete.
- **Presentación:** Un paquete de papel manteca abierto sobre el plato, con un filete de merluza blanco y jugoso sobre rodajas de papa, bastones de zanahoria, zucchini, cebolla y morrón, con perejil picado.
- **No debe aparecer:** rodajas de limón, manteca, salsa, arroz.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Merluza en papillote con verduras y papa». Rinde 4 porciones; la foto muestra una sola: un paquete.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): merluza, papa, zanahoria, zucchini, cebolla, morrón rojo, ajo, perejil fresco.
Presentación: Un paquete de papel manteca abierto sobre el plato, con un filete de merluza blanco y jugoso sobre rodajas de papa, bastones de zanahoria, zucchini, cebolla y morrón, con perejil picado.
No debe aparecer: rodajas de limón, manteca, salsa, arroz.
```

</details>

### R050 · Tortilla de papa, cebolla y arvejas al horno

- **Archivo esperado:** `R050-tortilla-de-papa-cebolla-y-arvejas-al-horno.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Platos de horno y sartén. **Rinde:** 4 porciones; la foto muestra un cuarto de tortilla.
- **Presentación:** Un cuarto de tortilla de papa alta, dorada por fuera, con el corte cocido y firme donde se ven cubos de papa, cebolla y arvejas.
- **No debe aparecer:** huevo líquido en el centro, jamón, queso, ensalada, pan.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Tortilla de papa, cebolla y arvejas al horno». Rinde 4 porciones; la foto muestra una sola: un cuarto de tortilla.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): papa hervida, cebolla, arvejas, huevo.
Presentación: Un cuarto de tortilla de papa alta, dorada por fuera, con el corte cocido y firme donde se ven cubos de papa, cebolla y arvejas.
No debe aparecer: huevo líquido en el centro, jamón, queso, ensalada, pan.
```

</details>

### R051 · Arroz con pollo y arvejas en una olla

- **Archivo esperado:** `R051-arroz-con-pollo-y-arvejas-en-una-olla.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la olla).
- **Presentación:** Un plato de arroz con pollo de color anaranjado por el pimentón, con cubos de pollo, morrón y arvejas verdes.
- **No debe aparecer:** mariscos, chorizo, huevo duro, aceitunas, limón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Arroz con pollo y arvejas en una olla». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la olla).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): pechuga de pollo, cebolla, morrón rojo, ajo, pimentón, arroz, arvejas.
Presentación: Un plato de arroz con pollo de color anaranjado por el pimentón, con cubos de pollo, morrón y arvejas verdes.
No debe aparecer: mariscos, chorizo, huevo duro, aceitunas, limón.
```

</details>

### R052 · Guiso de garbanzos, pollo y calabaza

- **Archivo esperado:** `R052-guiso-de-garbanzos-pollo-y-calabaza.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un cuenco (un cuarto de la olla).
- **Presentación:** Un cuenco de guiso espeso con garbanzos, cubos de pollo y de calabaza naranja, en un caldo rojizo.
- **No debe aparecer:** chorizo, panceta, pan, arroz, perejil.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Guiso de garbanzos, pollo y calabaza». Rinde 4 porciones; la foto muestra una sola: un cuenco (un cuarto de la olla).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): garbanzos de lata, pechuga de pollo, calabaza, cebolla, morrón rojo, zanahoria, ajo, tomate pelado en lata, pimentón.
Presentación: Un cuenco de guiso espeso con garbanzos, cubos de pollo y de calabaza naranja, en un caldo rojizo.
No debe aparecer: chorizo, panceta, pan, arroz, perejil.
```

</details>

### R053 · Guiso de porotos, arroz y verduras

- **Archivo esperado:** `R053-guiso-de-porotos-arroz-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un cuenco (un cuarto de la olla).
- **Presentación:** Un cuenco de guiso espeso de porotos colorados con arroz, cubos de zapallo y verduras.
- **No debe aparecer:** carne, chorizo, panceta, pan, queso.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Guiso de porotos, arroz y verduras». Rinde 4 porciones; la foto muestra una sola: un cuenco (un cuarto de la olla).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): porotos, arroz, cebolla, morrón rojo, zanahoria, calabaza, ajo, tomate pelado en lata, pimentón.
Presentación: Un cuenco de guiso espeso de porotos colorados con arroz, cubos de zapallo y verduras.
No debe aparecer: carne, chorizo, panceta, pan, queso.
```

</details>

### R054 · Bifes a la criolla con papas

- **Archivo esperado:** `R054-bifes-a-la-criolla-con-papas.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un bife con un cuarto de las papas y las verduras.
- **Presentación:** Un bife de nalga cocido a la cacerola sobre rodajas de papa, con aros de cebolla, morrón y tomate cocidos y un poco de jugo.
- **No debe aparecer:** huevo frito, arvejas, chorizo, pan, papas fritas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Bifes a la criolla con papas». Rinde 4 porciones; la foto muestra una sola: un bife con un cuarto de las papas y las verduras.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): bifes de nalga, papa, cebolla, morrón rojo, morrón verde, tomate, ajo, perejil fresco, orégano, pimentón.
Presentación: Un bife de nalga cocido a la cacerola sobre rodajas de papa, con aros de cebolla, morrón y tomate cocidos y un poco de jugo.
No debe aparecer: huevo frito, arvejas, chorizo, pan, papas fritas.
```

</details>

### R055 · Carbonada de carne magra, zapallo y choclo

- **Archivo esperado:** `R055-carbonada-de-carne-magra-zapallo-y-choclo.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un cuenco (un cuarto de la olla).
- **Presentación:** Un cuenco de carbonada espesa con cubos de carne, de zapallo naranja, de papa y de batata, y granos de choclo amarillo.
- **No debe aparecer:** duraznos, chorizo, pan, arroz.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Carbonada de carne magra, zapallo y choclo». Rinde 4 porciones; la foto muestra una sola: un cuenco (un cuarto de la olla).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): carne para guisar, cebolla, morrón rojo, ajo, tomate pelado en lata, zapallo, choclo en granos, papa, batata, pimentón, orégano.
Presentación: Un cuenco de carbonada espesa con cubos de carne, de zapallo naranja, de papa y de batata, y granos de choclo amarillo.
No debe aparecer: duraznos, chorizo, pan, arroz.
```

</details>

### R056 · Arroz cremoso con hongos y arvejas

- **Archivo esperado:** `R056-arroz-cremoso-con-hongos-y-arvejas.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ollas, legumbres y arroz. **Rinde:** 4 porciones; la foto muestra un plato hondo (un cuarto de la olla).
- **Presentación:** Un plato hondo de arroz cremoso con láminas de champiñón dorado, arvejas verdes y perejil picado.
- **No debe aparecer:** pollo, crema, queso en hebras, panceta, hongos de otras variedades.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato hondo blanco liso de 23 cm.
Receta: «Arroz cremoso con hongos y arvejas». Rinde 4 porciones; la foto muestra una sola: un plato hondo (un cuarto de la olla).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): manteca, cebolla, ajo, hongos, arroz, arvejas, queso parmesano rallado, perejil fresco.
Presentación: Un plato hondo de arroz cremoso con láminas de champiñón dorado, arvejas verdes y perejil picado.
No debe aparecer: pollo, crema, queso en hebras, panceta, hongos de otras variedades.
```

</details>

### R057 · Ensalada de arroz, atún, huevo y tomate

- **Archivo esperado:** `R057-ensalada-de-arroz-atun-huevo-y-tomate.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ensaladas completas y platos fríos. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la ensalada).
- **Presentación:** Un plato de ensalada de arroz blanco con atún, cubos de tomate, granos de choclo, aceitunas verdes y cuartos de huevo duro.
- **No debe aparecer:** mayonesa, lechuga, arvejas, jamón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Ensalada de arroz, atún, huevo y tomate». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la ensalada).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): arroz cocido, atún al natural, huevo duro, tomate, choclo de lata, aceitunas verdes, mostaza.
Presentación: Un plato de ensalada de arroz blanco con atún, cubos de tomate, granos de choclo, aceitunas verdes y cuartos de huevo duro.
No debe aparecer: mayonesa, lechuga, arvejas, jamón.
```

</details>

### R058 · Salpicón de pollo, papa y verduras

- **Archivo esperado:** `R058-salpicon-de-pollo-papa-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ensaladas completas y platos fríos. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto del salpicón).
- **Presentación:** Un plato de salpicón: pollo desmenuzado, cubos de papa y de zanahoria, arvejas, morrón y huevo picado, unidos con un aderezo cremoso claro.
- **No debe aparecer:** lechuga, pan, aceitunas, jamón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Salpicón de pollo, papa y verduras». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto del salpicón).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): pollo hervido, papa hervida, zanahoria hervida, arvejas, morrón rojo, cebolla, huevo duro, mayonesa liviana, yogur natural descremado, mostaza.
Presentación: Un plato de salpicón: pollo desmenuzado, cubos de papa y de zanahoria, arvejas, morrón y huevo picado, unidos con un aderezo cremoso claro.
No debe aparecer: lechuga, pan, aceitunas, jamón.
```

</details>

### R059 · Ensalada de garbanzos, huevo, remolacha y zanahoria

- **Archivo esperado:** `R059-ensalada-de-garbanzos-huevo-remolacha-y-zanahoria.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ensaladas completas y platos fríos. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la ensalada).
- **Presentación:** Un plato de ensalada con garbanzos, cubos de remolacha morada, zanahoria rallada, cebolla de verdeo y cuartos de huevo duro.
- **No debe aparecer:** lechuga, queso, atún, pan, semillas.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Ensalada de garbanzos, huevo, remolacha y zanahoria». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la ensalada).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): garbanzos de lata, huevo duro, remolacha hervida, zanahoria, cebolla de verdeo, perejil fresco, mostaza.
Presentación: Un plato de ensalada con garbanzos, cubos de remolacha morada, zanahoria rallada, cebolla de verdeo y cuartos de huevo duro.
No debe aparecer: lechuga, queso, atún, pan, semillas.
```

</details>

### R060 · Ensalada de fideos, porotos blancos y verduras

- **Archivo esperado:** `R060-ensalada-de-fideos-porotos-blancos-y-verduras.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Ensaladas completas y platos fríos. **Rinde:** 4 porciones; la foto muestra un plato (un cuarto de la ensalada).
- **Presentación:** Un plato de ensalada de fideos tirabuzón con porotos blancos, cubos de tomate, morrón, pepino y muzzarella, y rodajas de aceituna negra.
- **No debe aparecer:** atún, mayonesa, lechuga, jamón.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Ensalada de fideos, porotos blancos y verduras». Rinde 4 porciones; la foto muestra una sola: un plato (un cuarto de la ensalada).
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): fideos secos, porotos blancos, tomate, morrón rojo, pepino, cebolla, aceitunas negras, queso muzzarella, perejil fresco, orégano.
Presentación: Un plato de ensalada de fideos tirabuzón con porotos blancos, cubos de tomate, morrón, pepino y muzzarella, y rodajas de aceituna negra.
No debe aparecer: atún, mayonesa, lechuga, jamón.
```

</details>

### R061 · Panqueques de avena y ricota con banana

- **Archivo esperado:** `R061-panqueques-de-avena-y-ricota-con-banana.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 4 porciones; la foto muestra 2 panqueques con su relleno.
- **Presentación:** Dos panqueques de avena doblados en cuatro, rellenos de ricota, con rodajas de banana asomando y una línea fina de canela.
- **No debe aparecer:** miel, dulce de leche, chocolate, frutos rojos, crema.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato playo blanco liso de 26 cm.
Receta: «Panqueques de avena y ricota con banana». Rinde 4 porciones; la foto muestra una sola: 2 panqueques con su relleno.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): avena arrollada, leche descremada, huevo, canela, ricota, banana.
Presentación: Dos panqueques de avena doblados en cuatro, rellenos de ricota, con rodajas de banana asomando y una línea fina de canela.
No debe aparecer: miel, dulce de leche, chocolate, frutos rojos, crema.
```

</details>

### R062 · Budín de banana, avena y yogur

- **Archivo esperado:** `R062-budin-de-banana-avena-y-yogur.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 10 porciones; la foto muestra una rebanada de unos 2,5 cm.
- **Presentación:** Una rebanada de budín de banana y avena, húmedo, con copos de avena a la vista, en un plato chico.
- **No debe aparecer:** nueces, chips de chocolate, glaseado, banana fresca de adorno, manteca.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato de postre blanco liso de 20 cm.
Receta: «Budín de banana, avena y yogur». Rinde 10 porciones; la foto muestra una sola: una rebanada de unos 2,5 cm.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): banana, huevo, yogur natural entero, avena arrollada, harina integral, canela.
Presentación: Una rebanada de budín de banana y avena, húmedo, con copos de avena a la vista, en un plato chico.
No debe aparecer: nueces, chips de chocolate, glaseado, banana fresca de adorno, manteca.
```

</details>

### R063 · Scones integrales de queso

- **Archivo esperado:** `R063-scones-integrales-de-queso.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 8 porciones; la foto muestra 2 scones.
- **Presentación:** Dos scones integrales de queso, altos y dorados, uno partido al medio con la miga a la vista.
- **No debe aparecer:** manteca untada, mermelada, jamón, queso en hebras.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato de postre blanco liso de 20 cm.
Receta: «Scones integrales de queso». Rinde 8 porciones; la foto muestra una sola: 2 scones.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina integral, harina 000, manteca, queso rallado, leche descremada, huevo.
Presentación: Dos scones integrales de queso, altos y dorados, uno partido al medio con la miga a la vista.
No debe aparecer: manteca untada, mermelada, jamón, queso en hebras.
```

</details>

### R064 · Arroz con leche y canela

- **Archivo esperado:** `R064-arroz-con-leche-y-canela.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 4 porciones; la foto muestra un cuenco.
- **Presentación:** Un cuenco de arroz con leche cremoso con canela molida espolvoreada arriba.
- **No debe aparecer:** cáscara de limón, pasas de uva, dulce de leche, canela en rama, crema.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: cuenco blanco liso de 15 cm.
Receta: «Arroz con leche y canela». Rinde 4 porciones; la foto muestra una sola: un cuenco.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): arroz, leche parcialmente descremada, canela.
Presentación: Un cuenco de arroz con leche cremoso con canela molida espolvoreada arriba.
No debe aparecer: cáscara de limón, pasas de uva, dulce de leche, canela en rama, crema.
```

</details>

### R065 · Galletas caseras de avena y maní con yogur natural

- **Archivo esperado:** `R065-galletas-caseras-de-avena-y-mani-con-yogur-natural.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 8 porciones; la foto muestra 2 galletas y 125 g de yogur natural.
- **Presentación:** Dos galletas de avena y maní, rústicas, al lado de un cuenco chico con yogur natural blanco.
- **No debe aparecer:** chips de chocolate, miel, frutas, granola.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato de postre blanco liso de 20 cm.
Receta: «Galletas caseras de avena y maní con yogur natural». Rinde 8 porciones; la foto muestra una sola: 2 galletas y 125 g de yogur natural.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): avena arrollada, harina integral, maní tostado sin sal, pasta de maní, huevo, canela, yogur natural descremado.
Presentación: Dos galletas de avena y maní, rústicas, al lado de un cuenco chico con yogur natural blanco.
No debe aparecer: chips de chocolate, miel, frutas, granola.
```

</details>

### R066 · Tarta dulce de ricota y limón

- **Archivo esperado:** `R066-tarta-dulce-de-ricota-y-limon.jpg` (la herramienta de la ampliación lo busca por el código). **Estado:** ficha lista, sin imagen.
- **Familia:** Desayunos, meriendas y preparaciones dulces. **Rinde:** 8 porciones; la foto muestra un octavo de tarta.
- **Presentación:** Un octavo de tarta de ricota, con el relleno blanco y firme y la masa dorada, en un plato chico.
- **No debe aparecer:** frutos rojos, merengue, dulce de leche, rodajas de limón, azúcar impalpable.

<details><summary>Prompt</summary>

```text
Fotografía gastronómica realista, generada por IA para la app de nutrición BE. Una sola porción, presentada como en una casa cuidada, sin producción de restaurante.
Luz natural suave desde la izquierda, sombras leves. Fondo neutro cálido y liso, gris claro o beige, sin textura llamativa. Superficie mate.
Vajilla blanca y coherente en toda la serie, según la receta: plato playo liso de 26 cm, plato hondo liso de 23 cm, plato de postre liso de 20 cm, cuenco liso de 15 cm o vaso de vidrio liso de 300 ml. Cubiertos solo si se indican.
Cámara a unos 45 grados, centrada y a la misma distancia en toda la serie: el plato ocupa cerca del 70 % del ancho. Si hace falta mostrar un relleno o unas capas, la cámara puede bajar un poco.
Formato horizontal 4:3, al menos 1600 × 1200 px. Todo el plato dentro de la franja central: arriba y abajo, un doceavo del alto queda solo con fondo (así se ve entero en 4:3 en el website y en 16:10 en la app). Si la herramienta solo ofrece 3:2 apaisado, dejar más aire a los costados: se recorta a 4:3.
Cocción plausible y comida apoyada de forma natural, con los ingredientes distinguibles. Sin exceso de queso, salsa ni aceite brillante. La porción tiene una escala razonable para el plato.
Sin texto, sin marcas de agua, sin logos, sin personas ni manos. Nada comestible que no esté en la receta: sin salsas, guarniciones, hierbas, semillas ni adornos agregados.
Recipiente: plato de postre blanco liso de 20 cm.
Receta: «Tarta dulce de ricota y limón». Rinde 8 porciones; la foto muestra una sola: un octavo de tarta.
Lo que lleva la receta (en la foto, solo lo que se ve en esa porción): harina 000, manteca, huevo, ricota.
Presentación: Un octavo de tarta de ricota, con el relleno blanco y firme y la masa dorada, en un plato chico.
No debe aparecer: frutos rojos, merengue, dulce de leche, rodajas de limón, azúcar impalpable.
```

</details>


---
Generado por `herramientas/generar.mjs` desde el manifiesto congelado, el de la ampliación del 2026-10-28 y `herramientas/seleccion.mjs` (commit de referencia `e4512cb`). No editar a mano: cambiar la selección y volver a generar.
