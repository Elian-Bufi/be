# Las recetas de ejemplo de la cohorte

Encargo de consolidación de Dirección del 2026-10-19, bloque 4 («Importación de las dieciséis recetas»). Son dieciséis
preparaciones de ejemplo para la cuenta de **Lic. Sofía Paz** (PRO_N, profesional de Nutrición de la cohorte de test),
con una foto de referencia cada una. Son datos de demostración: ninguna persona es real.

## En qué nivel están (2026-10-19)

BE separa tres cosas: el **catálogo** aporta ingredientes y composición; una **receta** aporta ingredientes, cantidades,
preparación, porciones e imagen; una **opción del plan** es lo que el profesional decidió indicarle a una persona.

| Nivel | Estado de las dieciséis |
|---|---|
| Definición local | **Sí**: el manifiesto congelado de esta carpeta (`manifiesto.json`). Antes era un borrador en una carpeta temporal, que elegía el primer resultado del buscador |
| Recetas guardadas en la cuenta de Sofía | **No.** Revisado en test el 2026-10-19 con `revisar`: la cuenta tiene **0 recetas** |
| Opciones de un plan | **No**: sin recetas guardadas, ningún plan puede citarlas |

Tenerlas en la cuenta de Sofía no las haría una biblioteca para todos los profesionales: serían recetas privadas de
ella. La biblioteca de recetas de BE es una propuesta aparte (`docs/propuestas/BIBLIOTECA-DE-RECETAS-DE-BE_ficha.md`).

**El cambio concreto que espera la autorización de Dirección:** crear en la cuenta de Sofía las dieciséis recetas del
manifiesto, cada una con su foto cuando esté. No toca planes. Ofrecerlas como opciones en un plan de Diego sería otra
cosa: una versión nueva de su plan, en borrador; y activarla, otra autorización más.

## El manifiesto

`manifiesto.json` es la fuente: número, nombre, descripción, porciones, pasos, la foto esperada y, por ingrediente, lo
que pedía el borrador (`buscado`), el alimento elegido (FDC, nombre, la preparación que dice la fuente, identidad y
**versión** en el catálogo), la cantidad en gramos y el estado (`RAW`, `COOKED` o `AS_PURCHASED`).

- **Cada ingrediente, resuelto a mano.** Ninguno sale del primer resultado de una búsqueda. Si el catálogo tenía más
  de un alimento para lo que pedía el borrador, el ingrediente lleva su `decision`: las cinco carnes picadas, las cuatro
  lechugas, los dos «Aceite de oliva» (el de demostración y el de USDA), las dos leches parcialmente descremadas, la
  nalga vacuna o de ternera, el bife crudo o asado, la papa hervida con o sin cáscara, el arroz de grano largo o medio,
  la pechuga con o sin piel, la manzana con o sin cáscara. La prueba de contenido lo exige.
- **Todo de USDA:** del catálogo base (DL-141) o de DL-119. Ninguno es de demostración, ni siquiera cuando se llama
  igual que uno de USDA.
- **El estado es el del alimento:** una cantidad cruda va con un alimento crudo y una cocida con uno cocido (los
  gramos de arroz cocido nunca se calculan con el arroz crudo). Todo en gramos, contra composiciones cada 100 g: no se
  convierten mililitros ni medidas caseras.
- **Cambios respecto del borrador**, cada uno en `cambiosRespectoDelBorrador`: «Tostadas con queso blanco y tomate»
  pasa a «Tostadas integrales con queso crema y tomate» (el catálogo no tiene queso blanco), «Fruta de estación con
  nueces» a «Manzana con nueces», y los pasos del guiso y de la tarta ya no usan ingredientes que no están en la lista.

Si un alimento del manifiesto tiene una versión más nueva en el catálogo (por ejemplo, un corte corregido), `revisar`
lo dice y no lo da por cargable: hay que decidir y cambiar el manifiesto, nunca en silencio.

## La herramienta

```
node recetas.mjs revisar --origen <API> --cuentas <cuentas.env> [--fotos <carpeta>] [--informe <archivo.json>]
node recetas.mjs cargar  --origen <API> --cuentas <cuentas.env> --fotos <carpeta> --estado <carpeta> --confirmo-escritura [--solo-con-foto]
```

- **Sin valores por omisión.** El origen de la API y el archivo de cuentas van siempre explícitos (en test:
  `https://be-api-hndp.onrender.com` y `C:\Users\bufim\BE-datos-locales\cohorte-test\cuentas.env`). Las credenciales se
  leen con `leerCuentas` (`../cohorte/destino.mjs`) y nunca se imprimen.
- **`revisar` solo lee.** Inicia una sesión con PRO_N, mira qué recetas tiene la cuenta, busca cada alimento en el
  catálogo (que exista, que sea la versión vigente, de USDA, con el nombre del manifiesto), calcula cada receta con
  API-REC-07 (no guarda nada) y lo compara con el cálculo hecho de nuevo sin la lógica de BE; en las recetas 1, 9 y 13,
  también con 2 porciones y con 50 g más del primer ingrediente. Revisa las fotos sin subirlas.
- **`cargar` escribe** y necesita la autorización de Dirección y `--confirmo-escritura`. Repite la revisión, y si no hay
  problemas crea cada receta que falte y le asocia su foto. Se puede cortar y retomar sin duplicar: una receta que ya
  está con su nombre no se crea de nuevo (si está con otros ingredientes, no se toca), cada escritura lleva una clave de
  idempotencia que sale de lo que manda, la foto se sube una vez por receta y lo hecho queda en `--estado`. Sin foto, la
  receta se carga igual y la foto se asocia en una corrida posterior (con `--solo-con-foto`, espera a tenerla).
- `manifiesto.mjs` tiene las funciones puras que usan la herramienta y la prueba de contenido
  (`scripts/recetas-de-ejemplo.test.mjs`, en `npm test`).

**No se corrió `cargar`**: el encargo no autoriza escribir en test.

## La revisión del 2026-10-19 contra test

`revisar --origen https://be-api-hndp.onrender.com`, sin escribir nada (el informe completo, con cada comprobación, está
en `revision-test-2026-10-19.json`; la hora es UTC):

| Preparadas | Cargables | Con foto | Verificadas | Ya en la cuenta |
|---|---|---|---|---|
| 16 | 16 | 0 | 16 | 0 |

- **Cargables:** los 41 alimentos están en el catálogo de test, en la versión que cita el manifiesto, de USDA y con su
  nombre.
- **Verificadas:** el cálculo de API-REC-07 coincide con el independiente en las dieciséis, y en las recetas 1, 9 y 13
  también con 2 porciones y con un ingrediente cambiado.
- **Con foto: 0.** La carpeta de las fotos todavía no existe en esta máquina.

Por porción: 01 346 kcal · 02 309 · 03 294 · 04 308 · 05 306 · 06 396 · 07 529 · 08 342 · 09 507 · 10 301 · 11 354 ·
12 537 · 13 511 · 14 294 · 15 277 · 16 209.

## Las fotos que faltan

Van en una carpeta fuera del repo (en esta máquina, `C:\Users\bufim\BE-datos-locales\fotos-recetas`), una por receta,
con el número de dos cifras al principio. La herramienta las busca por el número:

`01-avena-cocida-con-banana-y-canela.jpg` · `02-tostadas-integrales-con-palta-y-huevo.jpg` ·
`03-yogur-natural-con-granola-y-frutillas.jpg` · `04-licuado-de-banana-con-leche-y-avena.jpg` ·
`05-tostadas-integrales-con-queso-crema-y-tomate.jpg` · `06-milanesa-de-carne-al-horno-con-pure-de-calabaza.jpg` ·
`07-bife-a-la-plancha-con-papas-al-horno-y-ensalada.jpg` · `08-merluza-al-horno-con-pure-de-papa-y-brocoli.jpg` ·
`09-fideos-con-salsa-bolognesa.jpg` · `10-guiso-de-lentejas-con-verduras.jpg` ·
`11-tarta-de-acelga-con-ensalada-de-tomate.jpg` · `12-bowl-de-quinoa-con-garbanzos-huevo-y-verduras.jpg` ·
`13-wok-de-pollo-con-verduras-y-arroz.jpg` · `14-hamburguesa-casera-al-plato-con-ensalada.jpg` ·
`15-omelette-de-espinaca-con-tostada.jpg` · `16-manzana-con-nueces.jpg`

**Lo que se espera de cada una** (`FOTO_ESPERADA` en `manifiesto.mjs`; `revisar` lo comprueba):
- JPEG, PNG o WebP de hasta 10 MB; el servidor la recodifica en JPEG de hasta 1600 px por el lado mayor, sin metadatos,
  y no la agranda: el lado mayor, desde 1600 px;
- horizontal, cerca de 4:3 (de 1,25 a 1,40), con **el plato dentro de la franja central de 16:10** (en una de 1600 ×
  1200, los 1000 px del medio): el website la muestra en 4:3 y la APK en 16:10, las dos recortando al centro, así que se
  ve entero en las dos;
- el plato entero y centrado, con aire alrededor, sobre un fondo neutro y con luz pareja; la misma escala y el mismo
  ángulo en las dieciséis (cenital o a 45°), una porción como la de la receta;
- sin texto, marcas, manos ni personas: es una **imagen de referencia** de la preparación, no la foto de lo que comió
  alguien, y no mide la porción.
- Se suben como «Generada por IA para BE» (`AI_GENERATED`), como las de la demostración.

## La calidad de las imágenes de receta (revisión del 2026-10-19)

Se revisó el circuito de medios para las imágenes de receta en el website y en la APK (código de `main` en `d3e7c69`):

| Dónde | Proporción | Recorte | Sin foto |
|---|---|---|---|
| Website, tarjeta de «Mis recetas» | 4:3, 104 × 78 px | al centro (`cover`) | ícono en el mismo marco |
| Website, detalle de la receta | 4:3, hasta 448 × 336 px | al centro | no dibuja el marco |
| APK, carrusel, detalle de la opción y opción registrada | 16:10, el ancho de la pantalla | al centro | ícono y «Sin imagen de referencia» |

Lo que ya estaba bien: el espacio se reserva antes de cargar (no hay saltos), el texto alternativo dice «Imagen de
referencia: …» y el aviso de que no mide la porción va en la descripción del grupo; las fotos privadas de un registro
(`MEAL_EVIDENCE`) siguen separadas de las de receta (`RECIPE_REFERENCE`): otra finalidad al subir, otra regla al asociar,
otra al leer, otra auditoría y otro componente.

**Arreglado en el website (este PR):**
- si la imagen no se pudo mostrar, el detalle lo dice y ofrece «Reintentar» (antes se veía igual que «sin imagen», y
  recargar la página cerraba la sesión);
- mientras carga, el indicador de siempre; sin imagen, el ícono del plato de la familia de BE en lugar de un emoji;
- las imágenes de receta se recuerdan en la pestaña: ir y volver de «Mis recetas» ya no repite el acceso y la descarga
  de cada una (cada acceso se audita y consume el cupo de lecturas: con dieciséis recetas, unas pocas idas y vueltas por
  minuto llegaban al límite). Las fotos privadas de un registro no se recuerdan;
- en la tarjeta, la imagen es decorativa (el nombre ya está en el título y en «Abrir»); en una columna angosta, no pasa
  del tamaño del detalle; y se decodifica sin frenar la página.

**Para decidir:** la proporción. El website muestra 4:3 y la APK 16:10. Con fotos 4:3 y el plato en la franja central
no se pierde nada; si Dirección quiere que el profesional vea exactamente el recorte de la persona, el website puede
pasar a 16:10 solo para recetas (un modificador de estilo; las fotos de los registros no cambian).

**Propuesta para la API, no implementada:** una miniatura de 480 px por el lado mayor, generada en el mismo
procesamiento de la imagen y guardada junto al medio, que la supresión borra igual que el original; la pediría la
tarjeta con un parámetro del acceso (`?variant=THUMBNAIL`) sin cambiar la forma de la respuesta. Hoy la tarjeta de
104 × 78 px baja la imagen entera de 1600 px como data URL (la CSP del website admite solo `self` y `data:`).

**En la APK (no se publica en este encargo; queda anotado):** al fallar desaparece el rótulo y la tarjeta salta unos
20 dp; la imagen se decodifica entera (1600 px) para un marco de unos 330 dp; y en Android las imágenes podrían quedar en
la caché de disco del cargador, lo que para las fotos privadas de un registro habría que revisar contra el 08 (la
supresión alcanza las cachés de lectura). A verificar en un teléfono.
