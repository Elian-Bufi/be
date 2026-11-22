# WP-APP-0-32 · La app para la APK 0.32: el carrusel, la foto grande, el título en la cabecera, los macros con íconos, Kerr, RPE e imágenes livianas

> **Las decisiones de Dirección (22/11):** Elián prefiere el carrusel a los segmentos en Nutrición · Hoy, con imán y
> también flechas «por si no se entiende», sin la tarjeta vecina asomando; la foto grande «como estaba antes» («lo visual
> suma mucho»); el título solo en la cabecera en Nutrición y Entrenamiento, para que sin desplazar se vean la imagen, los
> macros y la carga de una foto; los macros con ícono, número y abreviatura como en el website (RP-07); y que la app 0.32
> muestre los nombres de Kerr (DL-190), pregunte en RPE (DL-192) y use las imágenes livianas (DL-191).
>
> Rama `wp-app-0-32`, desde `main` (3cb789d8). Registro: **DL-194** en `docs/DEUDA_LEGAJO.md`. Las decisiones del
> continuador (**A32-D01 a A32-D15**) están **a ratificar**. Este paquete es el código de la app: **la APK 0.32 no se armó
> ni se publicó acá**. No se integra solo.

## 0. En criollo

En **Nutrición · Hoy** vuelve el carrusel: las opciones de una comida se pasan deslizando con el dedo (se detienen de a
una, enteras) o con las flechas de arriba, que dicen «Opción 2 de 3» y tienen los puntitos debajo. Cada opción ocupa todo
el ancho: la de al lado no asoma. Con una sola opción no hay flechas ni puntitos. La foto de la opción vuelve a ser grande,
a todo el ancho; si la receta no tiene foto, en lugar de un marco vacío va la miniatura del plato al lado del nombre.

Arriba de Nutrición y de Entrenamiento ya no está el título grande: «Nutrición» y «Entrenamiento» quedan siempre en la
cabecera, entre el logo y la campana, como aparecían al bajar. Lo que se gana de alto es para la foto, los macros y «Comí
algo diferente».

Los macros se escriben como en el website: el ícono de cada uno arriba y, debajo, «529 kcal», «30,0 g P», «44,0 g C»,
«12,0 g G». TalkBack sigue diciendo la palabra entera.

En **Entrenamiento**, si el profesional eligió RPE en el plan, la app pregunta el esfuerzo en RPE (de 10 a 6,5 y «6 o
menos», eligiendo de una lista) y muestra todo en RPE; lo que manda sigue siendo el RIR, como siempre.

En **Mi evolución**, las mediciones nuevas de Kerr y sus cinco masas se ven con su nombre.

Las imágenes pesan menos: cada lugar pide la medida que necesita (la chica donde la imagen es chica y la grande a todo el
ancho), y la foto de una comida se achica en el teléfono antes de subirla. Si la API todavía no sabe de medidas, la app
pide la de siempre.

## 1. Alcance

| ID | Qué | Dónde |
|---|---|---|
| A32-01 | **El carrusel de las opciones** en lugar de los segmentos de AV2-21: deslizar con imán (`snapToInterval`) y flechas «Opción anterior» y «Opción siguiente» (48 dp, deshabilitadas en los extremos), «Opción n de m» y los puntitos. Cada tarjeta a todo el ancho, sin asomo de la vecina. Con una sola opción, ningún control. TalkBack anuncia «Opción n de m» al cambiar, una vez; solo la tarjeta a la vista se recorre. Se mantiene: la opción se recuerda por su identidad y solo la que estuvo a la vista pide su imagen | `carrusel-de-opciones.ts`, `pantallas/nutricion-hoy.tsx` (`CarruselDeOpciones`, `TarjetaDeOpcion`, `BotonDeFlecha`) |
| A32-02 | **La foto grande**, a todo el ancho y en 16:10; sin foto, la miniatura de reemplazo de 72 dp que ya existía, al lado del nombre. «Ver detalle» va al lado del nombre. Los macros y «Comí esta opción» quedan alineados abajo en todas las tarjetas | `pantallas/nutricion-hoy.tsx` |
| A32-03 | **El título solo en la cabecera** en Nutrición y Entrenamiento: `TituloSoloEnLaCabecera` registra un título fijo, que la cabecera muestra siempre (como el que sube al desplazar) y que TalkBack lee como encabezado. Las demás pantallas siguen con el título grande que sube | `ui.tsx`, `titulo-de-la-cabecera.ts` (`fijar`, `FIN_DEL_TITULO_FIJO`), `titulo-en-la-cabecera.tsx` (`useTituloFijo`), `cabecera.tsx`, `pantallas/nutricion.tsx`, `pantallas/entrenamiento.tsx` |
| A32-04 | **Los macros con íconos** (RP-07 en la app): ícono, número y abreviatura del website (`kcal`, `g P`, `g C`, `g G`), en el orden del website (kcal, proteínas, carbohidratos y grasas), en la franja de «Hoy», del detalle de la opción y del registro. El lector de pantalla lee «Proteínas: 30,0 g» | `franja-de-macros.ts`, `piezas-de-nutricion.tsx` |
| A32-05 | **Imágenes livianas** (DL-191, §4 de WP-RECETARIO-E-IMAGENES): cada marco pide la miniatura (`?variant=thumbnail`) o la grande (`large`) según su tamaño; la variante va en la clave del acceso recordado; si la API no la conoce, la de siempre. La foto de una comida se achica a 1600 px en JPEG al elegirla, una sola vez, con `expo-image-manipulator` | `cargador-de-imagen.ts`, `imagen-de-medio.tsx` (`liviana`), `achicar-la-foto.ts`, `pantallas/comida-diferente.tsx`, `apps/mobile/package.json` |
| A32-06 | **Kerr con sus nombres** (DL-190): la app ya toma los nombres del dominio (`nombreDeMetrica`, `nombreDeMetodo`); una prueba fija que las siete mediciones y las cinco masas se ven con su nombre, en su bloque de Indicadores y con su método | `scripts/selector-de-tomas.test.mjs` |
| A32-07 | **Lecturas congeladas** (DL-152): el script de congelado no leía la consulta armada a mano de API-CMP-01 y por eso la 0.30 y la 0.31 no se pudieron congelar; queda corregido. Ver §5 | `scripts/congelar-lo-que-lee-la-apk.mjs` |
| A32-08 | **RPE** (DL-192, §7 de WP-RPE-Y-MAXIMO-ESTIMADO): la capacidad `training-effort-notation-1`; `effortNotation` de API-TRN-09 y API-SER-02; el esfuerzo en RPE se elige con `OPCIONES_DE_RPE` y se manda el `rir` con su `fieldOrigins.rir`; lo indicado y lo registrado, con `textoDeRir`, `textoDelPlanDeLaSerie`, `lineasDePrescripcion` y `serieRegistradaEnPalabras` | `api.ts`, `esfuerzo-en-la-app.ts`, `selector-de-rpe.tsx`, `almacen-de-entrenamiento.ts`, `series-de-la-sesion.ts`, `registro-rapido.ts`, `correccion-de-la-sesion.ts`, `la-vez-pasada-en-la-sesion.ts`, `pantallas/sesion-enfocada.tsx`, `entrenamiento.tsx`, `registro-rapido.tsx`, `correccion-de-entrenamiento.tsx`, `plan-por-serie.tsx`, `historial.tsx` |

## 2. Decisiones del continuador (a ratificar)

| ID | Decisión | Por qué | Alternativa |
|---|---|---|---|
| A32-D01 | Las flechas, «Opción n de m» y los puntitos van en una sola fila **arriba** de la tarjeta (los puntitos debajo del contador), no encima de la foto | Una flecha encima de la foto pierde contraste según la imagen; arriba se ven antes de la foto, «por si no se entiende» el gesto | Flechas redondas superpuestas a los costados de la foto (ahorran 48 dp) |
| A32-D02 | La opción cambia **cuando el imán dejó una tarjeta entera** (`onMomentumScrollEnd`), no a mitad del gesto | Así el contador, los puntitos y TalkBack no dicen opciones de paso | Cambiar el contador mientras se desliza |
| A32-D03 | La foto va en **16:10** | Es la proporción «de antes» (la de la 0.25) y deja más alto para lo demás que 4:3 | 4:3 (unos 40 dp más alta) |
| A32-D04 | **Sin foto, la miniatura de 72 dp al lado del nombre**, no un marco grande con el plato | El «hueco enorme» del 29/10 era un marco grande vacío | Un marco del alto de la foto con el plato grande |
| A32-D05 | **«Ver detalle» al lado del nombre**, con 48 dp de toque, en lugar de una fila propia | Ahorra una fila (unos 50 dp) para que la foto, los macros y «Comí algo diferente» entren sin desplazar | La fila «Ver detalle ›» de antes |
| A32-D06 | «Cargar foto de comida» se leyó como **la fila «Comí algo diferente · Agregar foto o describir»**, que no cambia de lugar ni de texto | No hay otro control con ese nombre; es el que lleva a la cámara | Un botón nuevo «Cargar foto de comida» |
| A32-D07 | El título fijo va **al centro de la cabecera**, entre el logo y la campana, igual que el que sube al desplazar | «Como hoy aparece al bajar»; no cambia la cabecera de las demás pantallas | Alineado a la izquierda, pegado al logo |
| A32-D08 | Los macros, en el **orden del website** (kcal, P, C, G) y no en el de antes de la app (kcal, C, G, P) | La persona y el profesional leen lo mismo en el mismo orden | Mantener el orden de la app |
| A32-D09 | En la franja, **el ícono arriba del número** (no al lado) | Así entran las cuatro en una fila de 360 a 412 dp con la letra normal; con la letra ×1,3, dos por dos | Ícono al lado del número, como el website (dos por dos en casi todos los teléfonos) |
| A32-D10 | **La variante se elige por el tamaño del marco**: la miniatura (400 px) si el lado mayor del marco por la densidad del teléfono no pasa de 500 px; si no, la grande (1200 px). La foto a todo el ancho del carrusel, el detalle y el registro piden la grande; la imagen chica al lado de lo registrado, la miniatura | El §4 de WP-RECETARIO-E-IMAGENES pedía la miniatura «en el carrusel» cuando la foto del carrusel era de 72 dp; con la foto grande, 400 px se ven borrosos. La grande WebP de DL-191 igual pesa la mitad que el JPEG de antes | Miniatura en todo el carrusel |
| A32-D11 | **Tolerante a DL-191:** la app pasa la variante por el cliente del dominio; con el dominio de `main` sin DL-191 la variante no viaja; con DL-191, viaja, y si la API responde 400 se pide sin variante y no se vuelve a probar en el proceso | La 0.32 sirve con o sin #314 integrado, y con una API de antes | Esperar a #314 para programarlo |
| A32-D12 | **Achicar con una copia de la regla** `medidasAlAchicar` (1600 px, calidad 0,85) hasta que DL-191 esté en `main`; una prueba la compara con la del dominio cuando el dominio la trae. Si el teléfono no la puede achicar, se sube la original | No depender de #314 para compilar; achicar ahorra datos, no es condición para registrar | Importar `medidasAlAchicar` y esperar a #314 |
| A32-D13 | En RPE el esfuerzo **se elige de una lista** (las nueve opciones del dominio, en un diálogo con «Sin anotar» y «Volver»), sin teclado; en RIR, todo igual | «6 o menos» no se escribe con el teclado numérico y «8,3» no es de la escala | Un campo de texto que entienda «8,5» y «6 o menos» |
| A32-D14 | **Lo guardado no cambia por leerse en RPE:** un RIR de 4 o más se ve «6 o menos» y, si nadie lo toca, viaja con su RIR original (al destildar y en la corrección) | RPE-D03: el número guardado no cambia mientras nadie lo reescriba | Guardar 4 al reabrir |
| A32-D15 | **RPE, los bordes:** sin API-SER-02 (sin red, sesión general de «Hoy») se pregunta en RIR hasta que llega; «La vez pasada» se arma en la app en la notación del plan actual (`lineaDeLaVezPasada` del dominio no recibe notación); el detalle de una ejecución (API-TRN-19) queda en RIR porque no trae `effortNotation`. Textos propios a ratificar: «RPE (opcional)», «Qué tan cerca del fallo terminaste la serie, de 6 a 10…», «RPE 8: creés que te quedaban 2 repeticiones» y «El RPE va de 10 a 6, de a medio punto: …» | Sin dato de la notación, lo de siempre | Que API-TRN-19 lleve la notación (cambio de API) |

## 3. Lo que lee y manda la app

- **`X-BE-Capabilities`** suma `training-effort-notation-1`: con ella, API-TRN-09 y API-SER-02 traen `effortNotation`
  (ausente o `RIR` es RIR). Lo que manda la app no cambia de forma: `rir` y `fieldOrigins.rir`.
- **API-MED-03** con `?variant=thumbnail|large` cuando el cliente del dominio lo admite (DL-191). Con una API anterior, el
  400 por el parámetro hace que la app pida sin variante. La respuesta tiene la misma forma con variante o sin ella.
- **API-MED-02:** la foto de una comida sube achicada (JPEG, 1600 px en el lado mayor). La API la valida y la recodifica
  igual.
- **Nueva dependencia nativa:** `expo-image-manipulator` 57.0.22 (la de Expo 57). Entra en la próxima compilación de la
  APK; sin compilarla, la app no la tiene.

## 4. Pruebas

| Prueba | Qué fija | Dónde |
|---|---|---|
| TEST-A32-001 a 006 | El carrusel: sin asomo y de a una tarjeta entera; las flechas con su nombre, el contador y los puntitos, y nada con una sola opción; el anuncio; la opción recordada; la imagen solo de las vistas; la pantalla (imán, flechas, sin segmentos, sin región viva, «reducir movimiento»); la foto grande y la miniatura sin foto | `scripts/registro-de-comidas.test.mjs` §1 |
| TEST-A32-007 y §2 | Los íconos y las abreviaturas, iguales a los del website y presentes en la familia de íconos; el orden; «Sin dato»; las columnas a 360, 390 y 412 dp | `scripts/registro-de-comidas.test.mjs` §2 |
| TEST-A32-010 a 014 | La variante por marco; la variante en la clave y en la renovación; la tolerancia a una API sin variantes; las imágenes livianas en Nutrición y no en Entrenamiento; el achique (una vez, sin agrandar, la original si falla) | `scripts/imagen-de-medio.test.mjs` §5 |
| TEST-A32-020 | Kerr: nombres, bloques de Indicadores y método de cada masa | `scripts/selector-de-tomas.test.mjs` |
| (14 pruebas) | RPE: la notación de la lectura, las opciones, ida y vuelta, el RIR intacto, la casilla con su procedencia, «Ya la hice», la corrección, «La vez pasada», la capacidad | `scripts/esfuerzo-en-la-app.test.mjs` |
| TEST-PG-003 (DL-194) | El título fijo: siempre en la cabecera, no se mide, se va con su pantalla y se lee como encabezado | `apps/mobile/src/titulo-de-la-cabecera.test.ts`, `hora-de-lo-que-ves.test.ts` (jest, en la CI) |

Se corrieron en local, de a una por la memoria: `registro-de-comidas`, `imagen-de-medio`, `selector-de-tomas`,
`esfuerzo-en-la-app`, `copy-pantallas`, `inicio`, `historial-navegacion`, `vuelta-de-rosca`, `letra-autoalojada`,
`registro-rapido` y las de la sesión. El typecheck de la app y las pruebas de jest corren en la CI. No hubo capturas con
emulador.

## 5. Lecturas congeladas (DL-152)

- **El script** (`congelar-lo-que-lee-la-apk.mjs`) no reconocía la consulta armada a mano de API-CMP-01
  (`/me/sharing-proposal${consulta}`) y se negaba a congelar la 0.30 y la 0.31. Queda corregido: con él, la 0.31 se
  congela (107 operaciones: suma CMP-01 a 03, HIA-01 a 03, RES-09 y 10; ya no lee CON-01 ni 02; las de Entrenamiento
  cambian de forma con los bloques y los tipos de serie).
- **El congelado vigente sigue siendo la 0.29.** Reemplazarlo exige que la prueba de integración
  (`test/integration/lecturas-de-las-apk.int-spec.ts`) pida en nombre de la APK las seis lecturas nuevas y deje de pedir
  CON-01 y CON-02 a una APK que no las lee (`apk.lee(…)`): sin eso, la integración falla porque quedan lecturas sin leer.
- **Al publicar la 0.32:** taggearla `be-apk-0.32.0-…`, correr el script con ese tag, sumar a la integración lo de arriba
  y lo nuevo de la 0.32 (`effortNotation` en API-TRN-09 y API-SER-02 con la capacidad; API-MED-03 con `variant` si #314
  ya está), poner la versión en `VIGENTES` y borrar el archivo de la 0.29.

## 6. Qué conviene probar en el teléfono

1. **Nutrición · Hoy** con una comida de 1, 2 y 3 opciones: deslizar (se detiene en una entera, sin asomo), las flechas,
   los puntitos y «Opción n de m»; con una sola, sin controles. Con TalkBack: «Opción 2 de 3» al cambiar y las flechas con
   su nombre.
2. **Sin desplazar**, en tu teléfono: la foto, los macros, «Comí esta opción» y «Comí algo diferente». Si no entra, ver
   A32-D01, A32-D03 y A32-D05.
3. Una opción **sin foto**: la miniatura del plato al lado del nombre, sin un hueco grande.
4. **El título** en la cabecera en Nutrición y Entrenamiento, quieto al desplazar; en Inicio y en Novedades, como antes.
5. **Los macros** con íconos, a letra normal (cuatro en una fila) y con letra grande (dos por dos).
6. **La foto de una comida** sacada con la cámara: que suba rápido y se vea bien en el registro.
7. **RPE:** un plan en RPE (desde el website) → la sesión pregunta en RPE, se registra y en el website se ve el RIR
   esperado (RPE 8 = RIR 2); «Ya la hice» y la corrección también. Un plan en RIR, como siempre.
8. **Kerr:** una toma con Kerr → Mi evolución → Indicadores, con los nombres y sus masas.
9. Cuando #314 esté integrado: las fotos del carrusel nítidas (la grande) y la imagen chica de lo registrado liviana.

## 7. Lo que queda

- Ratificar A32-D01 a A32-D15.
- Armar y publicar la APK 0.32 (`expo-image-manipulator` entra con la compilación) y congelar sus lecturas (§5).
- Si #314 entra a `main`, cambiar la copia de la regla de achique por `medidasAlAchicar` del dominio (la prueba ya las
  compara).
- Mirarlo en el teléfono y con TalkBack (§6).
