# Paquete de generación de las fotos de las 66 recetas

**Para ejecutar en otra herramienta.** La sesión de Claude Code del 2026-10-28 no tenía con qué generar imágenes
(**BLOQUEADO_POR_HERRAMIENTA**, ver `docs/paquetes/NOCTURNO-2026-10-28.md`). Este paquete es para la sesión de ChatGPT
de Dirección, que sí genera imágenes. **Un prompt no es una foto:** hasta que no haya un archivo, la receta figura como
«falta la foto». Hoy: **0 de 66 con foto**.

## Paso a paso

1. **Un primer lote variado, para ajustar el estilo antes de seguir:**
   R017 (Tarta de pollo y puerro), R029 (Tallarines con pollo, brócoli y salsa blanca casera), R037 (Hamburguesa casera de pollo en pan con lechuga y tomate), R052 (Guiso de garbanzos, pollo y calabaza).
   Si algo se aparta de la serie (luz, fondo, vajilla, escala), corregirlo en el pedido y repetir.
2. **Una imagen por receta.** Pegar el prompt completo de cada una (ya trae el estilo común) y pedir formato horizontal:
   4:3 si la herramienta lo ofrece; si no, 3:2 apaisado (la herramienta de fotos lo recorta a 4:3 al centro y lo dice).
3. **Guardar cada imagen con su nombre de salida exacto** (por ejemplo, `R017-tarta-de-pollo-y-puerro.png`) en una sola
   carpeta de originales. También las 16 originales van con su código (`R001-…`). No editar las imágenes: el original se
   conserva tal cual.
4. **Mirar cada una contra su ficha antes de seguir.** Es la receta correcta, una sola porción, sin ingredientes que no
   estén en la receta, sin texto, manos ni marcas, con una cocción y una escala plausibles. Si no, regenerarla.
5. **Preparar las entregas** (sin tocar los originales), desde la raíz del repositorio:

   ```bash
   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs preparar --originales <originales> --entrega <entrega> --vistas <vistas> --herramienta "ChatGPT, generación de imágenes"
   ```

   Deja en `<entrega>` los JPEG de 1600 × 1200 que se suben a BE, con los nombres que esperan las herramientas de carga;
   en `<vistas>`, una hoja de revisión por foto y por tema (Claro y Azul noche), con los recortes reales de BE; y en
   `<entrega>/fotos.json`, el registro: medidas nativas, transformaciones, SHA-256, duplicados y fotos parecidas.
6. **Revisar las hojas** y anotar la revisión visual en el registro. Después:

   ```bash
   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs registrar --entrega <entrega>
   node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs
   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs
   ```

   Eso actualiza el inventario, la galería, el recetario y los PDF con las fotos que haya.
7. **Cargar en test es otra autorización:** las herramientas de carga escriben solo con `--confirmo-escritura`.

## Las 66, con su nombre de salida

| Código | Receta | Origen | Guardar como | Se entrega como | Estado |
|---|---|---|---|---|---|
| R001 | Avena cocida con banana y canela | original | `R001-avena-cocida-con-banana-y-canela.png` | `01-avena-cocida-con-banana-y-canela.jpg` | Falta la foto |
| R002 | Tostadas integrales con palta y huevo | original | `R002-tostadas-integrales-con-palta-y-huevo.png` | `02-tostadas-integrales-con-palta-y-huevo.jpg` | Falta la foto |
| R003 | Yogur natural con granola y frutillas | original | `R003-yogur-natural-con-granola-y-frutillas.png` | `03-yogur-natural-con-granola-y-frutillas.jpg` | Falta la foto |
| R004 | Licuado de banana con leche y avena | original | `R004-licuado-de-banana-con-leche-y-avena.png` | `04-licuado-de-banana-con-leche-y-avena.jpg` | Falta la foto |
| R005 | Tostadas integrales con queso crema y tomate | original | `R005-tostadas-integrales-con-queso-crema-y-tomate.png` | `05-tostadas-integrales-con-queso-crema-y-tomate.jpg` | Falta la foto |
| R006 | Milanesa de carne al horno con puré de calabaza | original | `R006-milanesa-de-carne-al-horno-con-pure-de-calabaza.png` | `06-milanesa-de-carne-al-horno-con-pure-de-calabaza.jpg` | Falta la foto |
| R007 | Bife a la plancha con papas al horno y ensalada | original | `R007-bife-a-la-plancha-con-papas-al-horno-y-ensalada.png` | `07-bife-a-la-plancha-con-papas-al-horno-y-ensalada.jpg` | Falta la foto |
| R008 | Merluza al horno con puré de papa y brócoli | original | `R008-merluza-al-horno-con-pure-de-papa-y-brocoli.png` | `08-merluza-al-horno-con-pure-de-papa-y-brocoli.jpg` | Falta la foto |
| R009 | Fideos con salsa bolognesa | original | `R009-fideos-con-salsa-bolognesa.png` | `09-fideos-con-salsa-bolognesa.jpg` | Falta la foto |
| R010 | Guiso de lentejas con verduras | original | `R010-guiso-de-lentejas-con-verduras.png` | `10-guiso-de-lentejas-con-verduras.jpg` | Falta la foto |
| R011 | Tarta de acelga con ensalada de tomate | original | `R011-tarta-de-acelga-con-ensalada-de-tomate.png` | `11-tarta-de-acelga-con-ensalada-de-tomate.jpg` | Falta la foto |
| R012 | Bowl de quinoa con garbanzos, huevo y verduras | original | `R012-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.png` | `12-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.jpg` | Falta la foto |
| R013 | Wok de pollo con verduras y arroz | original | `R013-wok-de-pollo-con-verduras-y-arroz.png` | `13-wok-de-pollo-con-verduras-y-arroz.jpg` | Falta la foto |
| R014 | Hamburguesa casera al plato con ensalada | original | `R014-hamburguesa-casera-al-plato-con-ensalada.png` | `14-hamburguesa-casera-al-plato-con-ensalada.jpg` | Falta la foto |
| R015 | Omelette de espinaca con tostada | original | `R015-omelette-de-espinaca-con-tostada.png` | `15-omelette-de-espinaca-con-tostada.jpg` | Falta la foto |
| R016 | Manzana con nueces | original | `R016-manzana-con-nueces.png` | `16-manzana-con-nueces.jpg` | Falta la foto |
| R017 | Tarta de pollo y puerro | nueva | `R017-tarta-de-pollo-y-puerro.png` | `R017-tarta-de-pollo-y-puerro.jpg` | Falta la foto |
| R018 | Tarta de zapallitos y ricota | nueva | `R018-tarta-de-zapallitos-y-ricota.png` | `R018-tarta-de-zapallitos-y-ricota.jpg` | Falta la foto |
| R019 | Tarta de atún, tomate y huevo | nueva | `R019-tarta-de-atun-tomate-y-huevo.png` | `R019-tarta-de-atun-tomate-y-huevo.jpg` | Falta la foto |
| R020 | Tarta de calabaza, cebolla y queso | nueva | `R020-tarta-de-calabaza-cebolla-y-queso.png` | `R020-tarta-de-calabaza-cebolla-y-queso.jpg` | Falta la foto |
| R021 | Empanadas de carne magra al horno | nueva | `R021-empanadas-de-carne-magra-al-horno.png` | `R021-empanadas-de-carne-magra-al-horno.jpg` | Falta la foto |
| R022 | Empanadas de pollo y verduras | nueva | `R022-empanadas-de-pollo-y-verduras.png` | `R022-empanadas-de-pollo-y-verduras.jpg` | Falta la foto |
| R023 | Empanadas de humita | nueva | `R023-empanadas-de-humita.png` | `R023-empanadas-de-humita.jpg` | Falta la foto |
| R024 | Empanadas de lentejas y calabaza | nueva | `R024-empanadas-de-lentejas-y-calabaza.png` | `R024-empanadas-de-lentejas-y-calabaza.jpg` | Falta la foto |
| R025 | Pizza casera de muzzarella y tomate | nueva | `R025-pizza-casera-de-muzzarella-y-tomate.png` | `R025-pizza-casera-de-muzzarella-y-tomate.jpg` | Falta la foto |
| R026 | Pizza casera de pollo y verduras asadas | nueva | `R026-pizza-casera-de-pollo-y-verduras-asadas.png` | `R026-pizza-casera-de-pollo-y-verduras-asadas.jpg` | Falta la foto |
| R027 | Fainá de garbanzo y cebolla con ensalada | nueva | `R027-faina-de-garbanzo-y-cebolla-con-ensalada.png` | `R027-faina-de-garbanzo-y-cebolla-con-ensalada.jpg` | Falta la foto |
| R028 | Calzone de espinaca y ricota | nueva | `R028-calzone-de-espinaca-y-ricota.png` | `R028-calzone-de-espinaca-y-ricota.jpg` | Falta la foto |
| R029 | Tallarines con pollo, brócoli y salsa blanca casera | nueva | `R029-tallarines-con-pollo-brocoli-y-salsa-blanca-casera.png` | `R029-tallarines-con-pollo-brocoli-y-salsa-blanca-casera.jpg` | Falta la foto |
| R030 | Fideos con atún, tomate y aceitunas | nueva | `R030-fideos-con-atun-tomate-y-aceitunas.png` | `R030-fideos-con-atun-tomate-y-aceitunas.jpg` | Falta la foto |
| R031 | Ravioles de ricota y espinaca con salsa de tomate | nueva | `R031-ravioles-de-ricota-y-espinaca-con-salsa-de-tomate.png` | `R031-ravioles-de-ricota-y-espinaca-con-salsa-de-tomate.jpg` | Falta la foto |
| R032 | Canelones de ricota y espinaca al horno | nueva | `R032-canelones-de-ricota-y-espinaca-al-horno.png` | `R032-canelones-de-ricota-y-espinaca-al-horno.jpg` | Falta la foto |
| R033 | Lasaña de carne y berenjena | nueva | `R033-lasana-de-carne-y-berenjena.png` | `R033-lasana-de-carne-y-berenjena.jpg` | Falta la foto |
| R034 | Ñoquis de papa con tuco de carne | nueva | `R034-noquis-de-papa-con-tuco-de-carne.png` | `R034-noquis-de-papa-con-tuco-de-carne.jpg` | Falta la foto |
| R035 | Polenta cremosa con tuco de carne magra | nueva | `R035-polenta-cremosa-con-tuco-de-carne-magra.png` | `R035-polenta-cremosa-con-tuco-de-carne-magra.jpg` | Falta la foto |
| R036 | Fideos con salsa de lentejas y tomate | nueva | `R036-fideos-con-salsa-de-lentejas-y-tomate.png` | `R036-fideos-con-salsa-de-lentejas-y-tomate.jpg` | Falta la foto |
| R037 | Hamburguesa casera de pollo en pan con lechuga y tomate | nueva | `R037-hamburguesa-casera-de-pollo-en-pan-con-lechuga-y-tomate.png` | `R037-hamburguesa-casera-de-pollo-en-pan-con-lechuga-y-tomate.jpg` | Falta la foto |
| R038 | Hamburguesa de lentejas y avena en pan | nueva | `R038-hamburguesa-de-lentejas-y-avena-en-pan.png` | `R038-hamburguesa-de-lentejas-y-avena-en-pan.jpg` | Falta la foto |
| R039 | Medallones de garbanzo y zanahoria con ensalada | nueva | `R039-medallones-de-garbanzo-y-zanahoria-con-ensalada.png` | `R039-medallones-de-garbanzo-y-zanahoria-con-ensalada.jpg` | Falta la foto |
| R040 | Milanesa de pollo napolitana al horno con ensalada | nueva | `R040-milanesa-de-pollo-napolitana-al-horno-con-ensalada.png` | `R040-milanesa-de-pollo-napolitana-al-horno-con-ensalada.jpg` | Falta la foto |
| R041 | Sándwich de pollo desmenuzado, huevo y verduras | nueva | `R041-sandwich-de-pollo-desmenuzado-huevo-y-verduras.png` | `R041-sandwich-de-pollo-desmenuzado-huevo-y-verduras.jpg` | Falta la foto |
| R042 | Sándwich casero de lomito con verduras | nueva | `R042-sandwich-casero-de-lomito-con-verduras.png` | `R042-sandwich-casero-de-lomito-con-verduras.jpg` | Falta la foto |
| R043 | Pastel de papa con carne magra y arvejas | nueva | `R043-pastel-de-papa-con-carne-magra-y-arvejas.png` | `R043-pastel-de-papa-con-carne-magra-y-arvejas.jpg` | Falta la foto |
| R044 | Pastel de calabaza y pollo | nueva | `R044-pastel-de-calabaza-y-pollo.png` | `R044-pastel-de-calabaza-y-pollo.jpg` | Falta la foto |
| R045 | Zapallitos rellenos de carne y arroz | nueva | `R045-zapallitos-rellenos-de-carne-y-arroz.png` | `R045-zapallitos-rellenos-de-carne-y-arroz.jpg` | Falta la foto |
| R046 | Berenjenas rellenas de lentejas y verduras | nueva | `R046-berenjenas-rellenas-de-lentejas-y-verduras.png` | `R046-berenjenas-rellenas-de-lentejas-y-verduras.jpg` | Falta la foto |
| R047 | Albóndigas de carne con salsa de tomate y arroz | nueva | `R047-albondigas-de-carne-con-salsa-de-tomate-y-arroz.png` | `R047-albondigas-de-carne-con-salsa-de-tomate-y-arroz.jpg` | Falta la foto |
| R048 | Pollo al limón con batatas al horno | nueva | `R048-pollo-al-limon-con-batatas-al-horno.png` | `R048-pollo-al-limon-con-batatas-al-horno.jpg` | Falta la foto |
| R049 | Merluza en papillote con verduras y papa | nueva | `R049-merluza-en-papillote-con-verduras-y-papa.png` | `R049-merluza-en-papillote-con-verduras-y-papa.jpg` | Falta la foto |
| R050 | Tortilla de papa, cebolla y arvejas al horno | nueva | `R050-tortilla-de-papa-cebolla-y-arvejas-al-horno.png` | `R050-tortilla-de-papa-cebolla-y-arvejas-al-horno.jpg` | Falta la foto |
| R051 | Arroz con pollo y arvejas en una olla | nueva | `R051-arroz-con-pollo-y-arvejas-en-una-olla.png` | `R051-arroz-con-pollo-y-arvejas-en-una-olla.jpg` | Falta la foto |
| R052 | Guiso de garbanzos, pollo y calabaza | nueva | `R052-guiso-de-garbanzos-pollo-y-calabaza.png` | `R052-guiso-de-garbanzos-pollo-y-calabaza.jpg` | Falta la foto |
| R053 | Guiso de porotos, arroz y verduras | nueva | `R053-guiso-de-porotos-arroz-y-verduras.png` | `R053-guiso-de-porotos-arroz-y-verduras.jpg` | Falta la foto |
| R054 | Bifes a la criolla con papas | nueva | `R054-bifes-a-la-criolla-con-papas.png` | `R054-bifes-a-la-criolla-con-papas.jpg` | Falta la foto |
| R055 | Carbonada de carne magra, zapallo y choclo | nueva | `R055-carbonada-de-carne-magra-zapallo-y-choclo.png` | `R055-carbonada-de-carne-magra-zapallo-y-choclo.jpg` | Falta la foto |
| R056 | Arroz cremoso con hongos y arvejas | nueva | `R056-arroz-cremoso-con-hongos-y-arvejas.png` | `R056-arroz-cremoso-con-hongos-y-arvejas.jpg` | Falta la foto |
| R057 | Ensalada de arroz, atún, huevo y tomate | nueva | `R057-ensalada-de-arroz-atun-huevo-y-tomate.png` | `R057-ensalada-de-arroz-atun-huevo-y-tomate.jpg` | Falta la foto |
| R058 | Salpicón de pollo, papa y verduras | nueva | `R058-salpicon-de-pollo-papa-y-verduras.png` | `R058-salpicon-de-pollo-papa-y-verduras.jpg` | Falta la foto |
| R059 | Ensalada de garbanzos, huevo, remolacha y zanahoria | nueva | `R059-ensalada-de-garbanzos-huevo-remolacha-y-zanahoria.png` | `R059-ensalada-de-garbanzos-huevo-remolacha-y-zanahoria.jpg` | Falta la foto |
| R060 | Ensalada de fideos, porotos blancos y verduras | nueva | `R060-ensalada-de-fideos-porotos-blancos-y-verduras.png` | `R060-ensalada-de-fideos-porotos-blancos-y-verduras.jpg` | Falta la foto |
| R061 | Panqueques de avena y ricota con banana | nueva | `R061-panqueques-de-avena-y-ricota-con-banana.png` | `R061-panqueques-de-avena-y-ricota-con-banana.jpg` | Falta la foto |
| R062 | Budín de banana, avena y yogur | nueva | `R062-budin-de-banana-avena-y-yogur.png` | `R062-budin-de-banana-avena-y-yogur.jpg` | Falta la foto |
| R063 | Scones integrales de queso | nueva | `R063-scones-integrales-de-queso.png` | `R063-scones-integrales-de-queso.jpg` | Falta la foto |
| R064 | Arroz con leche y canela | nueva | `R064-arroz-con-leche-y-canela.png` | `R064-arroz-con-leche-y-canela.jpg` | Falta la foto |
| R065 | Galletas caseras de avena y maní con yogur natural | nueva | `R065-galletas-caseras-de-avena-y-mani-con-yogur-natural.png` | `R065-galletas-caseras-de-avena-y-mani-con-yogur-natural.jpg` | Falta la foto |
| R066 | Tarta dulce de ricota y limón | nueva | `R066-tarta-dulce-de-ricota-y-limon.png` | `R066-tarta-dulce-de-ricota-y-limon.jpg` | Falta la foto |

## Los prompts

### R001 · Avena cocida con banana y canela

- **Guardar como:** `R001-avena-cocida-con-banana-y-canela.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Avena cocida en leche, cremosa, en el cuenco; encima, rodajas de banana y una línea fina de canela molida. Una cuchara a la derecha.
- **No debe aparecer:** miel, frutos secos, frutos rojos, hojas de menta, leche aparte.

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

### R002 · Tostadas integrales con palta y huevo

- **Guardar como:** `R002-tostadas-integrales-con-palta-y-huevo.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Dos rebanadas de pan integral de molde tostadas, con la palta untada y el huevo duro en rodajas encima.
- **No debe aparecer:** semillas, sal en escamas, pimienta, brotes, tomate, limón.

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

### R003 · Yogur natural con granola y frutillas

- **Guardar como:** `R003-yogur-natural-con-granola-y-frutillas.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Yogur natural blanco en el cuenco, con la granola encima y las frutillas cortadas al medio. Una cuchara a la derecha.
- **No debe aparecer:** miel, otras frutas, hojas de menta, chocolate.

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

### R004 · Licuado de banana con leche y avena

- **Guardar como:** `R004-licuado-de-banana-con-leche-y-avena.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Licuado liso, color crema claro, en el vaso, sin espuma exagerada. Nada apoyado en el borde.
- **No debe aparecer:** rodajas de banana de adorno, canela, avena espolvoreada, crema, pajita de colores.

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

### R005 · Tostadas integrales con queso crema y tomate

- **Guardar como:** `R005-tostadas-integrales-con-queso-crema-y-tomate.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Dos rebanadas de pan integral de molde tostadas, con el queso crema untado y rodajas de tomate encima.
- **No debe aparecer:** albahaca, orégano, aceite, sal o pimienta visibles, jamón.

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

### R006 · Milanesa de carne al horno con puré de calabaza

- **Guardar como:** `R006-milanesa-de-carne-al-horno-con-pure-de-calabaza.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Una milanesa de carne horneada, dorada y crocante, con el puré de zapallo anco al lado, liso y naranja.
- **No debe aparecer:** limón, perejil, papas fritas, ensalada, huevo frito.

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

### R007 · Bife a la plancha con papas al horno y ensalada

- **Guardar como:** `R007-bife-a-la-plancha-con-papas-al-horno-y-ensalada.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Un bife a la plancha, con las marcas de la plancha; papas al horno con cáscara, cortadas, y una ensalada de lechuga y tomate apenas brillante por el aceite de oliva.
- **No debe aparecer:** chimichurri, sal gruesa visible, cebolla, huevo frito, limón.

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

### R008 · Merluza al horno con puré de papa y brócoli

- **Guardar como:** `R008-merluza-al-horno-con-pure-de-papa-y-brocoli.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Un filete de merluza al horno, blanco y apenas dorado; puré de papa liso y ramilletes de brócoli hervido, verde intenso.
- **No debe aparecer:** limón, perejil, manteca visible, salsa.

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

### R009 · Fideos con salsa bolognesa

- **Guardar como:** `R009-fideos-con-salsa-bolognesa.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Fideos largos tipo spaghetti con la salsa bolognesa encima: carne picada y tomate, roja.
- **No debe aparecer:** queso rallado, albahaca, perejil, pan.

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

### R010 · Guiso de lentejas con verduras

- **Guardar como:** `R010-guiso-de-lentejas-con-verduras.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Guiso espeso de lentejas con cubos de zanahoria y de zapallo, y cebolla, en el cuenco. Una cuchara a la derecha.
- **No debe aparecer:** chorizo, panceta, perejil, pan, huevo.

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

### R011 · Tarta de acelga con ensalada de tomate

- **Guardar como:** `R011-tarta-de-acelga-con-ensalada-de-tomate.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Una porción de tarta de acelga: masa casera dorada y relleno verde de acelga con huevo; al lado, rodajas de tomate solas.
- **No debe aparecer:** queso, huevo duro, cebolla, orégano, aceite sobre el tomate.

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

### R012 · Bowl de quinoa con garbanzos, huevo y verduras

- **Guardar como:** `R012-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.png`. **Familia:** Ensaladas completas y platos fríos. **Estado:** Falta la foto.
- **Presentación:** Bowl armado por sectores: quinoa, garbanzos, un huevo duro en mitades, tomate en cubos y zanahoria rallada, con un brillo de aceite de oliva.
- **No debe aparecer:** palta, semillas, hojas verdes, limón, salsas.

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

### R013 · Wok de pollo con verduras y arroz

- **Guardar como:** `R013-wok-de-pollo-con-verduras-y-arroz.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Tiras de pollo salteadas con morrón rojo, cebolla y zanahoria en tiras; al lado, arroz blanco de grano largo.
- **No debe aparecer:** salsa de soja, sésamo, cebolla de verdeo, maní, palitos.

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

### R014 · Hamburguesa casera al plato con ensalada

- **Guardar como:** `R014-hamburguesa-casera-al-plato-con-ensalada.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Un medallón de carne casero a la plancha, al plato y sin pan, con una ensalada de lechuga, tomate y cebolla al lado.
- **No debe aparecer:** pan de hamburguesa, queso, papas fritas, kétchup, mostaza o mayonesa, huevo.

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

### R015 · Omelette de espinaca con tostada

- **Guardar como:** `R015-omelette-de-espinaca-con-tostada.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Un omelette doblado con espinaca, y una tostada de pan integral de molde al lado.
- **No debe aparecer:** queso, jamón, tomate, hierbas, manteca.

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

### R016 · Manzana con nueces

- **Guardar como:** `R016-manzana-con-nueces.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Una manzana roja con cáscara, cortada en gajos, y nueces peladas en mitades al lado.
- **No debe aparecer:** miel, canela, yogur, otras frutas.

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

### R017 · Tarta de pollo y puerro

- **Guardar como:** `R017-tarta-de-pollo-y-puerro.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Una porción triangular (un cuarto) de tarta casera abierta, con el borde de masa dorado y el corte a la vista: cubos de pollo y rodajas de puerro ligados con huevo, apenas gratinado arriba.
- **No debe aparecer:** tapa de masa arriba, ensalada, jamón, queso derretido en hilos, hierbas frescas.

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

### R018 · Tarta de zapallitos y ricota

- **Guardar como:** `R018-tarta-de-zapallitos-y-ricota.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno verde claro de zapallito rallado y ricota, firme y apenas dorado arriba; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, tomate, jamón, cebolla de verdeo encima, ensalada.

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

### R019 · Tarta de atún, tomate y huevo

- **Guardar como:** `R019-tarta-de-atun-tomate-y-huevo.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno de atún, tomate y morrón ligado con huevo, y rodajas de huevo duro asomando arriba; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, aceitunas, mayonesa, lechuga, queso gratinado.

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

### R020 · Tarta de calabaza, cebolla y queso

- **Guardar como:** `R020-tarta-de-calabaza-cebolla-y-queso.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Una porción triangular (un cuarto) de tarta abierta, con el relleno naranja de calabaza, hilos de cebolla dorada y una capa fina de queso gratinado; el borde de masa dorado.
- **No debe aparecer:** tapa de masa arriba, semillas de zapallo, hojas verdes, jamón.

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

### R021 · Empanadas de carne magra al horno

- **Guardar como:** `R021-empanadas-de-carne-magra-al-horno.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Tres empanadas al horno, doradas y con repulgue; una abierta al medio muestra el relleno de carne picada con huevo duro y aceituna.
- **No debe aparecer:** salsa criolla, limón, empanadas fritas con burbujas, papas fritas, pasas de uva.

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

### R022 · Empanadas de pollo y verduras

- **Guardar como:** `R022-empanadas-de-pollo-y-verduras.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Tres empanadas al horno, doradas, con un repulgue distinto del de las de carne; una cortada al medio muestra el relleno cremoso de pollo desmenuzado con verduras.
- **No debe aparecer:** salsa, limón, aceitunas, huevo duro, empanadas fritas.

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

### R023 · Empanadas de humita

- **Guardar como:** `R023-empanadas-de-humita.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Tres empanadas al horno, doradas, con su propio repulgue; una abierta muestra el relleno amarillo y cremoso de choclo.
- **No debe aparecer:** queso derretido, carne, salsa, mazorca de choclo entera, empanadas fritas.

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

### R024 · Empanadas de lentejas y calabaza

- **Guardar como:** `R024-empanadas-de-lentejas-y-calabaza.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Tres empanadas al horno, doradas; una abierta muestra el relleno de lentejas con cubos de calabaza naranja.
- **No debe aparecer:** carne, queso, huevo duro, salsa, empanadas fritas.

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

### R025 · Pizza casera de muzzarella y tomate

- **Guardar como:** `R025-pizza-casera-de-muzzarella-y-tomate.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Dos porciones triangulares de pizza casera de masa de espesor normal, con muzzarella derretida, rodajas de tomate y orégano.
- **No debe aparecer:** aceitunas, jamón, albahaca, morrón, borde relleno.

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

### R026 · Pizza casera de pollo y verduras asadas

- **Guardar como:** `R026-pizza-casera-de-pollo-y-verduras-asadas.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Dos porciones triangulares de pizza casera de masa apenas integral, con tiras de pollo dorado, verduras asadas (morrón, cebolla, zucchini y berenjena) y poca muzzarella.
- **No debe aparecer:** aceitunas, rúcula, jamón, huevo, salsa barbacoa.

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

### R027 · Fainá de garbanzo y cebolla con ensalada

- **Guardar como:** `R027-faina-de-garbanzo-y-cebolla-con-ensalada.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Dos porciones de fainá dorada y fina, con cebolla en pluma encima, y al lado una ensalada de lechuga, tomate y huevo duro.
- **No debe aparecer:** pizza, queso, aceitunas, pimienta en grano.

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

### R028 · Calzone de espinaca y ricota

- **Guardar como:** `R028-calzone-de-espinaca-y-ricota.png`. **Familia:** Tartas, empanadas, pizzas y masas saladas. **Estado:** Falta la foto.
- **Presentación:** Un calzone dorado en forma de media luna, cortado al medio para mostrar el relleno verde y blanco de espinaca y ricota.
- **No debe aparecer:** salsa de tomate, jamón, albahaca, ensalada.

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

### R029 · Tallarines con pollo, brócoli y salsa blanca casera

- **Guardar como:** `R029-tallarines-con-pollo-brocoli-y-salsa-blanca-casera.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato de tallarines con salsa blanca, cubos de pollo y ramilletes de brócoli verde, con queso parmesano rallado por encima.
- **No debe aparecer:** panceta, hongos, perejil, crema espesa en exceso, pan.

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

### R030 · Fideos con atún, tomate y aceitunas

- **Guardar como:** `R030-fideos-con-atun-tomate-y-aceitunas.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato de fideos largos con salsa roja de tomate, trozos de atún y rodajas de aceituna negra, con perejil picado.
- **No debe aparecer:** queso rallado, albahaca, alcaparras, pan, limón.

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

### R031 · Ravioles de ricota y espinaca con salsa de tomate

- **Guardar como:** `R031-ravioles-de-ricota-y-espinaca-con-salsa-de-tomate.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato con unos 15 ravioles caseros cuadrados, de bordes cortados, cubiertos en parte con salsa de tomate; uno abierto deja ver el relleno verde y blanco.
- **No debe aparecer:** queso rallado encima, albahaca, crema, carne.

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

### R032 · Canelones de ricota y espinaca al horno

- **Guardar como:** `R032-canelones-de-ricota-y-espinaca-al-horno.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Tres canelones de panqueque en un plato, con salsa de tomate y salsa blanca gratinada con queso; uno cortado muestra el relleno verde de espinaca y ricota.
- **No debe aparecer:** carne, jamón, albahaca, pan.

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

### R033 · Lasaña de carne y berenjena

- **Guardar como:** `R033-lasana-de-carne-y-berenjena.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Una porción rectangular de lasaña con las capas a la vista (placas de pasta, salsa de carne roja, rodajas de berenjena y salsa blanca) y el queso gratinado arriba.
- **No debe aparecer:** albahaca, ricota en grumos, pan de ajo, ensalada.

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

### R034 · Ñoquis de papa con tuco de carne

- **Guardar como:** `R034-noquis-de-papa-con-tuco-de-carne.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato de ñoquis de papa con tuco rojo y trozos de carne tierna, con un poco de queso parmesano rallado.
- **No debe aparecer:** albahaca, crema, salsa blanca, pan.

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

### R035 · Polenta cremosa con tuco de carne magra

- **Guardar como:** `R035-polenta-cremosa-con-tuco-de-carne-magra.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato hondo con polenta amarilla cremosa y tuco de carne en cubos por encima.
- **No debe aparecer:** queso derretido en hilos, hongos, salchichas, albahaca.

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

### R036 · Fideos con salsa de lentejas y tomate

- **Guardar como:** `R036-fideos-con-salsa-de-lentejas-y-tomate.png`. **Familia:** Pastas y polenta. **Estado:** Falta la foto.
- **Presentación:** Un plato de fideos cortos (mostachol) con una salsa espesa y rojiza de lentejas rojas y tomate, sin carne.
- **No debe aparecer:** carne picada, queso rallado, albahaca, crema.

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

### R037 · Hamburguesa casera de pollo en pan con lechuga y tomate

- **Guardar como:** `R037-hamburguesa-casera-de-pollo-en-pan-con-lechuga-y-tomate.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Una hamburguesa de pollo casera, dorada, en su pan abierto, con lechuga y rodajas de tomate; se ve que la carne es clara, de pollo.
- **No debe aparecer:** queso cheddar, panceta, papas fritas, huevo frito, kétchup o mayonesa.

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

### R038 · Hamburguesa de lentejas y avena en pan

- **Guardar como:** `R038-hamburguesa-de-lentejas-y-avena-en-pan.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Una hamburguesa de lentejas y avena, de color marrón con trocitos de zanahoria, en su pan con lechuga y tomate; se nota que no es de carne.
- **No debe aparecer:** queso, panceta, papas fritas, aspecto de carne vacuna.

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

### R039 · Medallones de garbanzo y zanahoria con ensalada

- **Guardar como:** `R039-medallones-de-garbanzo-y-zanahoria-con-ensalada.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Dos medallones de garbanzo dorados, con trocitos de zanahoria a la vista, al lado de una ensalada de lechuga, tomate y cebolla y una cucharada de salsa blanca de yogur.
- **No debe aparecer:** pan, papas fritas, carne, semillas.

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

### R040 · Milanesa de pollo napolitana al horno con ensalada

- **Guardar como:** `R040-milanesa-de-pollo-napolitana-al-horno-con-ensalada.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Una milanesa de pollo napolitana horneada, con salsa de tomate, jamón y muzzarella derretida con orégano, al lado de una ensalada de lechuga, tomate y cebolla.
- **No debe aparecer:** papas fritas, huevo frito, limón, aceitunas.

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

### R041 · Sándwich de pollo desmenuzado, huevo y verduras

- **Guardar como:** `R041-sandwich-de-pollo-desmenuzado-huevo-y-verduras.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Un sándwich de pan integral de molde cortado en diagonal, con el relleno a la vista: pollo desmenuzado, rodajas de huevo duro, tomate, lechuga y zanahoria rallada.
- **No debe aparecer:** jamón, queso, papas fritas, palta.

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

### R042 · Sándwich casero de lomito con verduras

- **Guardar como:** `R042-sandwich-casero-de-lomito-con-verduras.png`. **Familia:** Hamburguesas, sándwiches y milanesa. **Estado:** Falta la foto.
- **Presentación:** Un sándwich de lomito en pan francés, abierto a la mitad, con un bife fino de lomo, morrón y cebolla a la plancha, lechuga y tomate.
- **No debe aparecer:** jamón, queso, huevo frito, papas fritas, panceta.

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

### R043 · Pastel de papa con carne magra y arvejas

- **Guardar como:** `R043-pastel-de-papa-con-carne-magra-y-arvejas.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Una porción cuadrada de pastel de papa con las dos capas a la vista: abajo el relleno de carne picada con arvejas, arriba el puré dorado.
- **No debe aparecer:** huevo duro, aceitunas, pasas de uva, queso gratinado.

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

### R044 · Pastel de calabaza y pollo

- **Guardar como:** `R044-pastel-de-calabaza-y-pollo.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Una porción de pastel en dos capas: abajo el relleno cremoso de pollo con morrón, arriba el puré naranja de calabaza dorado.
- **No debe aparecer:** papa, carne picada, huevo duro, aceitunas.

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

### R045 · Zapallitos rellenos de carne y arroz

- **Guardar como:** `R045-zapallitos-rellenos-de-carne-y-arroz.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Cuatro mitades de zapallito redondo rellenas de carne y arroz, gratinadas con queso, en un plato.
- **No debe aparecer:** salsa de tomate, ensalada, pan, huevo frito.

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

### R046 · Berenjenas rellenas de lentejas y verduras

- **Guardar como:** `R046-berenjenas-rellenas-de-lentejas-y-verduras.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Dos mitades de berenjena asada rellenas de lentejas con verduras, gratinadas con muzzarella.
- **No debe aparecer:** carne, pan, ensalada, salsa blanca.

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

### R047 · Albóndigas de carne con salsa de tomate y arroz

- **Guardar como:** `R047-albondigas-de-carne-con-salsa-de-tomate-y-arroz.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Cinco albóndigas de carne en salsa de tomate, al lado de una porción de arroz blanco.
- **No debe aparecer:** queso rallado, pan, papas, perejil fresco encima.

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

### R048 · Pollo al limón con batatas al horno

- **Guardar como:** `R048-pollo-al-limon-con-batatas-al-horno.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Una suprema de pollo al horno, dorada y brillante por la marinada, con gajos de batata asada.
- **No debe aparecer:** rodajas de limón, romero, papas, ensalada.

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

### R049 · Merluza en papillote con verduras y papa

- **Guardar como:** `R049-merluza-en-papillote-con-verduras-y-papa.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Un paquete de papel manteca abierto sobre el plato, con un filete de merluza blanco y jugoso sobre rodajas de papa, bastones de zanahoria, zucchini, cebolla y morrón, con perejil picado.
- **No debe aparecer:** rodajas de limón, manteca, salsa, arroz.

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

### R050 · Tortilla de papa, cebolla y arvejas al horno

- **Guardar como:** `R050-tortilla-de-papa-cebolla-y-arvejas-al-horno.png`. **Familia:** Platos de horno y sartén. **Estado:** Falta la foto.
- **Presentación:** Un cuarto de tortilla de papa alta, dorada por fuera, con el corte cocido y firme donde se ven cubos de papa, cebolla y arvejas.
- **No debe aparecer:** huevo líquido en el centro, jamón, queso, ensalada, pan.

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

### R051 · Arroz con pollo y arvejas en una olla

- **Guardar como:** `R051-arroz-con-pollo-y-arvejas-en-una-olla.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un plato de arroz con pollo de color anaranjado por el pimentón, con cubos de pollo, morrón y arvejas verdes.
- **No debe aparecer:** mariscos, chorizo, huevo duro, aceitunas, limón.

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

### R052 · Guiso de garbanzos, pollo y calabaza

- **Guardar como:** `R052-guiso-de-garbanzos-pollo-y-calabaza.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un cuenco de guiso espeso con garbanzos, cubos de pollo y de calabaza naranja, en un caldo rojizo.
- **No debe aparecer:** chorizo, panceta, pan, arroz, perejil.

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

### R053 · Guiso de porotos, arroz y verduras

- **Guardar como:** `R053-guiso-de-porotos-arroz-y-verduras.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un cuenco de guiso espeso de porotos colorados con arroz, cubos de zapallo y verduras.
- **No debe aparecer:** carne, chorizo, panceta, pan, queso.

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

### R054 · Bifes a la criolla con papas

- **Guardar como:** `R054-bifes-a-la-criolla-con-papas.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un bife de nalga cocido a la cacerola sobre rodajas de papa, con aros de cebolla, morrón y tomate cocidos y un poco de jugo.
- **No debe aparecer:** huevo frito, arvejas, chorizo, pan, papas fritas.

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

### R055 · Carbonada de carne magra, zapallo y choclo

- **Guardar como:** `R055-carbonada-de-carne-magra-zapallo-y-choclo.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un cuenco de carbonada espesa con cubos de carne, de zapallo naranja, de papa y de batata, y granos de choclo amarillo.
- **No debe aparecer:** duraznos, chorizo, pan, arroz.

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

### R056 · Arroz cremoso con hongos y arvejas

- **Guardar como:** `R056-arroz-cremoso-con-hongos-y-arvejas.png`. **Familia:** Ollas, legumbres y arroz. **Estado:** Falta la foto.
- **Presentación:** Un plato hondo de arroz cremoso con láminas de champiñón dorado, arvejas verdes y perejil picado.
- **No debe aparecer:** pollo, crema, queso en hebras, panceta, hongos de otras variedades.

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

### R057 · Ensalada de arroz, atún, huevo y tomate

- **Guardar como:** `R057-ensalada-de-arroz-atun-huevo-y-tomate.png`. **Familia:** Ensaladas completas y platos fríos. **Estado:** Falta la foto.
- **Presentación:** Un plato de ensalada de arroz blanco con atún, cubos de tomate, granos de choclo, aceitunas verdes y cuartos de huevo duro.
- **No debe aparecer:** mayonesa, lechuga, arvejas, jamón.

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

### R058 · Salpicón de pollo, papa y verduras

- **Guardar como:** `R058-salpicon-de-pollo-papa-y-verduras.png`. **Familia:** Ensaladas completas y platos fríos. **Estado:** Falta la foto.
- **Presentación:** Un plato de salpicón: pollo desmenuzado, cubos de papa y de zanahoria, arvejas, morrón y huevo picado, unidos con un aderezo cremoso claro.
- **No debe aparecer:** lechuga, pan, aceitunas, jamón.

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

### R059 · Ensalada de garbanzos, huevo, remolacha y zanahoria

- **Guardar como:** `R059-ensalada-de-garbanzos-huevo-remolacha-y-zanahoria.png`. **Familia:** Ensaladas completas y platos fríos. **Estado:** Falta la foto.
- **Presentación:** Un plato de ensalada con garbanzos, cubos de remolacha morada, zanahoria rallada, cebolla de verdeo y cuartos de huevo duro.
- **No debe aparecer:** lechuga, queso, atún, pan, semillas.

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

### R060 · Ensalada de fideos, porotos blancos y verduras

- **Guardar como:** `R060-ensalada-de-fideos-porotos-blancos-y-verduras.png`. **Familia:** Ensaladas completas y platos fríos. **Estado:** Falta la foto.
- **Presentación:** Un plato de ensalada de fideos tirabuzón con porotos blancos, cubos de tomate, morrón, pepino y muzzarella, y rodajas de aceituna negra.
- **No debe aparecer:** atún, mayonesa, lechuga, jamón.

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

### R061 · Panqueques de avena y ricota con banana

- **Guardar como:** `R061-panqueques-de-avena-y-ricota-con-banana.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Dos panqueques de avena doblados en cuatro, rellenos de ricota, con rodajas de banana asomando y una línea fina de canela.
- **No debe aparecer:** miel, dulce de leche, chocolate, frutos rojos, crema.

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

### R062 · Budín de banana, avena y yogur

- **Guardar como:** `R062-budin-de-banana-avena-y-yogur.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Una rebanada de budín de banana y avena, húmedo, con copos de avena a la vista, en un plato chico.
- **No debe aparecer:** nueces, chips de chocolate, glaseado, banana fresca de adorno, manteca.

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

### R063 · Scones integrales de queso

- **Guardar como:** `R063-scones-integrales-de-queso.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Dos scones integrales de queso, altos y dorados, uno partido al medio con la miga a la vista.
- **No debe aparecer:** manteca untada, mermelada, jamón, queso en hebras.

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

### R064 · Arroz con leche y canela

- **Guardar como:** `R064-arroz-con-leche-y-canela.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Un cuenco de arroz con leche cremoso con canela molida espolvoreada arriba.
- **No debe aparecer:** cáscara de limón, pasas de uva, dulce de leche, canela en rama, crema.

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

### R065 · Galletas caseras de avena y maní con yogur natural

- **Guardar como:** `R065-galletas-caseras-de-avena-y-mani-con-yogur-natural.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Dos galletas de avena y maní, rústicas, al lado de un cuenco chico con yogur natural blanco.
- **No debe aparecer:** chips de chocolate, miel, frutas, granola.

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

### R066 · Tarta dulce de ricota y limón

- **Guardar como:** `R066-tarta-dulce-de-ricota-y-limon.png`. **Familia:** Desayunos, meriendas y preparaciones dulces. **Estado:** Falta la foto.
- **Presentación:** Un octavo de tarta de ricota, con el relleno blanco y firme y la masa dorada, en un plato chico.
- **No debe aparecer:** frutos rojos, merengue, dulce de leche, rodajas de limón, azúcar impalpable.

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

---
Generado por `EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs` desde el inventario del material visual. No editar a mano.
