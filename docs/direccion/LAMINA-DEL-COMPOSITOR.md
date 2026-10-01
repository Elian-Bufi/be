# La lámina del compositor de Dirección (v13.3)

**Fecha:** 2026-10-01 · **Fuente:** `docs/direccion/BE-VIS-Compositor_v13.3.html` (recibido el 2026-09-20; ver `UI-ANTROPOMETRIA.md`)
**Datos tipados:** `packages/domain/src/figura-de-lamina.ts` · **Imágenes:** `packages/domain/assets/figura/`

El compositor es un HTML de Dirección que arma láminas de 1080 × 1920 px con la toma antropométrica de una persona —la figura, sus sitios de toma y los valores en tarjetas— y las exporta como PNG. Este documento describe cómo las arma, para dibujar la misma lámina en el website y en la APK. Todo sale del código del compositor; lo que es medición o inferencia propia está marcado como tal.

**Cómo se verificó.** El `<script>` del compositor se ejecutó en Node con un DOM simulado y se comparó contra `figura-de-lamina.ts`: cada número de `FIGS`, los rótulos, los grupos de tarjetas, los encuadres, los colores de `PAL`, las capas de anillos y puntos en los tres temas, y la posición de cada tarjeta y cada línea guía en Medición y en Serie. Fueron 12.355 comprobaciones sin diferencias, y las dos mutaciones deliberadas que se probaron sobre el archivo (una posición, un grosor) se detectaron. Las seis imágenes son byte a byte el base64 del compositor.

---

## 1. Las figuras

Seis PNG, uno por sexo y encuadre (`FIGS[sexo][vista]`: sexos `m`/`f`; vistas `all`, `sup`, `inf`). Todos son RGBA de 8 bits, 900 × 1350 px, sin entrelazar y sin metadatos; el fondo es transparente y el cuerpo, un maniquí blanco azulado sin rasgos, de frente, con alfa 251 (98 % opaco). Ocupan 3.130 KB en total; en el compositor, en base64, son 4,27 MB de sus 4,4 MB.

| Archivo | Píxeles | Bytes | KB | Caja del cuerpo, % (arriba · alto · centro · ancho) | Borde recortado | Brazos |
|---|---|---|---|---|---|---|
| `hombre-entero.png` | 900 × 1350 | 411.154 | 401,5 | 2,41 · 90,1 · 50 · 43,65 | — | sí |
| `hombre-tren-superior.png` | 900 × 1350 | 743.101 | 725,7 | 3,91 · 90,69 · 49,9 · 71,58 | abajo, fundido en las filas 1209–1281 | sí |
| `hombre-tren-inferior.png` | 900 × 1350 | 560.625 | 547,5 | 4,49 · 91,6 · 50 · 53,22 | arriba, fundido en las filas 6–123 | no |
| `mujer-entero.png` | 900 × 1350 | 366.147 | 357,6 | 2,86 · 91,54 · 49,8 · 40,14 | — | sí |
| `mujer-tren-superior.png` | 900 × 1350 | 620.017 | 605,5 | 5,27 · 83,53 · 50 · 62,99 | abajo, corte neto en la fila 1201 | sí |
| `mujer-tren-inferior.png` | 900 × 1350 | 504.138 | 492,3 | 4,49 · 91,15 · 50,1 · 46 | arriba, fundido en las filas 6–120 | no |

La caja del cuerpo es la que declara el compositor (`top`, `bh`, `cx`, `bw`) y la usa para encuadrar la figura. Medida sobre el alfa, coincide con diferencias de hasta 1 punto, que vienen de los fundidos.

**¿Se repiten imágenes?** No: las seis son distintas (huellas SHA-256 en el archivo de datos). Los trenes muestran el mismo maniquí y la misma pose que el cuerpo entero, encuadrados más cerca, pero **no son recortes del entero**. Alineando cada tren con el entero del mismo sexo (escala y desplazamiento óptimos), las siluetas no calzan exactas y la definición es mayor:

| Tren | Escala respecto del entero | Coincidencia de siluetas (IoU, sin los fundidos) | Diferencia media de color |
|---|---|---|---|
| Hombre, superior | × 1,67 | 0,95 | 7,8 niveles de 255 |
| Mujer, superior | × 1,60 | 0,91 | 4,8 |
| Hombre, inferior | × 1,75 | 0,85 | 9,9 |
| Mujer, inferior | × 1,66 | 0,80 | 5,9 |

El tren inferior, además, es el maniquí **sin brazos** (en el entero, las manos caen al costado de caderas y muslos). Conclusión práctica: no se pueden obtener recortando el entero sin perder definición —y el inferior, de ninguna manera—; hay que llevar las seis.

El compositor trae además, embebidos, tres subconjuntos de Poppins (Regular, Medium y Bold, de 5,1 a 5,2 KB cada uno) y dos logos para el pie (7,3 KB el claro, 8,4 KB el oscuro); no se extrajeron porque no son figuras.

---

## 2. Las posiciones

### 2.1 El sistema de coordenadas

Las posiciones de `FIGS` son **relativas a la imagen de la figura**, no al lienzo de la lámina:

- `y`: distancia desde el borde superior de la imagen, en **% del alto** de la imagen;
- `x`: desplazamiento horizontal desde el **centro** de la imagen, en **% del ancho**; negativo es a la izquierda de quien mira, que es el lado derecho de la persona (la figura está de frente): los sitios de un solo lado se marcan todos sobre el lado derecho;
- `w` (solo anillos): el **ancho total** del anillo, en % del ancho de la imagen. El alto del anillo es 0,17 de su ancho (`ringG`: `ry = rx · 0,17`).

En píxeles de la imagen (900 × 1350): `px = 900 · (0,5 + x/100)`, `py = 1350 · y/100`, ancho del anillo `= 900 · w/100`. En el lienzo, primero se ubica la imagen (§ 3.2) y después `cx = imgX + imgAncho · (0,5 + x/100)`, `cy = imgY + imgAlto · y/100`, `rx = imgAncho · w/200` (`ringG` y `dotG`). Las coordenadas completas de cada sexo y encuadre, por clave de BE, están en `FIGURAS_DE_LA_LAMINA`.

Las posiciones las calibró Dirección a mano (modo «Calibrar» del compositor: arrastre, flechas de a 0,2 %, Mayúsculas de a 1 %) y se copiaron tal cual. Control propio sobre las imágenes: todos los sitios caen dentro de la silueta salvo tres del **tren inferior del hombre**, que quedan sobre la franja que se desvanece arriba —el anillo del abdomen (alfa 124, en el límite), el punto suprailíaco (alfa 6, a 13 px del borde de la imagen) y el abdominal (alfa 87)—. El anillo mide entre 0,85 y 1,5 veces el ancho del segmento que rodea, salvo en la muñeca del hombre entero y de los dos trenes superiores y en el tobillo de la mujer entera, donde mide entre 1,6 y 1,9 veces: el anillo es una marca visual, no una medida anatómica. Pecho y brazos no se pueden controlar así, porque en la silueta el brazo toca el torso.

### 2.2 Correspondencia de claves

Columna «Planilla»: el código con que el lector de datos del compositor (`AL`) reconoce cada medida en el export de Notion. Encuadres: E = entero, TS = tren superior, TI = tren inferior.

| Compositor | Rótulo en la lámina | Planilla | Clave de BE | Encuadres | Posterior |
|---|---|---|---|---|---|
| `cuello` | Cuello | CM3 | `perimetro-cuello` | E · TS | |
| `hombros` | Hombros | CM13 | `perimetro-hombros` | E · TS | |
| `pecho` | Pecho | CM4 | `perimetro-pecho` | E · TS | |
| `brazoRel` | Brazo relajado | «brazo relajado» | `perimetro-brazo-relajado` | E · TS | |
| `brazoCon` | Brazo contraído | «brazo contraído» | `perimetro-brazo-flexionado` | E · TS | |
| `antebrazo` | Antebrazo | CM10 | `perimetro-antebrazo` | E · TS | |
| `munecaC` | Muñeca | CM12 | `perimetro-muneca` | E · TS | |
| `cintura` | Cintura | CM1 | `perimetro-cintura` | E · TS | |
| `abdomen` | Abdomen bajo | CM5 | `perimetro-abdomen` | E · TS · TI | |
| `cadera` | Cadera | CM2 | `perimetro-cadera` | E · TS · TI | |
| `muslo` | Muslo | CM8 | `perimetro-muslo` | E · TI | |
| `pantorrilla` | Pantorrilla | CM9 | `perimetro-pantorrilla` | E · TI | |
| `tobillo` | Tobillo | CM11 | `perimetro-tobillo` | E · TI | |
| `plPectoral` | Pectoral | PL6 | `pliegue-pectoral` | E · TS | |
| `plAxilar` | Axilar media | PL7 | `pliegue-axilar-media` | E · TS | |
| `plTriceps` | Tríceps | PL1 | `pliegue-triceps` | E · TS | **sí** |
| `plSubescapular` | Subescapular | PL2 | `pliegue-subescapular` | E · TS | **sí** |
| `plAntebrazo` | Antebrazo | «pl antebrazo» | `pliegue-antebrazo` | E · TS | |
| `plSuprailiaco` | Suprailíaco | PL3 | `pliegue-supraespinal` | E · TS · TI | |
| `plAbdominal` | Abdominal | PL4 | `pliegue-abdominal` | E · TS · TI | |
| `plMuslo` | Muslo anterior | PL5 | `pliegue-muslo-frontal` | E · TI | |
| `plPantorrilla` | Pantorrilla | «pl pantorrilla» | `pliegue-pantorrilla` | E · TI | |
| `doCodo` | Codo | DO3 | `diametro-humero` | bloque al pie | |
| `doMuneca` | Muñeca | DO1 | `diametro-biestiloideo` | bloque al pie | |
| `doRodilla` | Rodilla | DO2 | `diametro-femur` | bloque al pie | |

- **Sin par en el compositor:** `pliegue-biceps` y `pliegue-cresta-iliaca`. No tienen posición en ninguna figura: van en la lista, fuera de la lámina, hasta que Dirección los calibre.
- **Sin par en BE:** ninguna; las 25 claves del compositor tienen la suya. El compositor también lee «Suma 7 pliegues» (`suma7`), que es un dato cargado (§ 3.5), no un sitio.
- **`plSuprailiaco` → `pliegue-supraespinal`.** Es la única equivalencia con decisión. El compositor lo ubica de frente, sobre la línea axilar anterior y apenas arriba de la cresta ilíaca (a unos 0,8 del medio ancho de la cintura, desde el centro); es el «suprailíaco» de Jackson-Pollock 7 y ACSM (PL1 a PL7 son exactamente los siete sitios de JP7), que en la nomenclatura ISAK se corresponde con el **supraespinal** —no son idénticos: cambian el reparo y la dirección del pliegue—. La **cresta ilíaca** de ISAK se toma en la línea medioaxilar, al costado del cuerpo, y el compositor no la dibuja. La figura de la toma que ya está en main ubica también el supraespinal en ese lugar (`figura-antropometrica.ts`).
- **Pliegues posteriores** (`POST`): tríceps y subescapular. La figura está de frente, así que el punto se dibuja debajo de la imagen —el cuerpo lo tapa— y encima queda su contorno punteado; la fila de la tarjeta va al 60 % de opacidad con la marca «posterior» y su guía es más fina y de puntos cortos (§ 3.3 y 3.4).
- `brazoCon` se rotula «Brazo contraído»: es el brazo flexionado y contraído. `abdomen` se rotula «Abdomen bajo».

---

## 3. Cómo arma la lámina

El compositor tiene dos modos —**Medición** (una toma) y **Serie** (varias tomas de una persona)— y tres láminas en cada uno: **Circunferencias**, **Pliegues** y **Conclusiones** (en Serie, **Evolución**). Circunferencias y Pliegues admiten los tres encuadres (Entero, Tren superior, Tren inferior); Conclusiones no lleva figura; Serie no tiene cuerpo entero (pasa a tren superior). Los temas son tres: **Claro**, **Oscuro** y **Azul**.

### 3.1 Lienzo y capas

- **Lienzo:** 1080 × 1920 px (`SW` × `SH`); lo que se sale del lienzo queda recortado. Se exporta al doble: PNG de 2160 × 3840.
- **Capas de Circunferencias y Pliegues, de abajo hacia arriba** (todas en posición absoluta, se pintan en este orden): fondo del tema → grilla del piso → velo superior (`haze`) → aura → resplandor del piso → capa «debajo» de la figura → imagen → capa «encima» de la figura → líneas guía → tarjetas → bloque del pie (diámetros o método) → viñeta (`vig`) → encabezado → pie de página. La viñeta queda **encima de las tarjetas**: en Oscuro oscurece los bordes; en Azul oscurece una zona centrada en (26 %, 44 %), detrás de la columna de tarjetas; en Claro no existe.
- **Grilla del piso** (`auraHTML`), centrada en (`centroX`, `arriba + altoDelCuerpo`), es decir, a los pies: 8 elipses de semiejes `rx = 110 + p² · 1180` y `ry = 0,2 · rx` (con `p = i/8`), trazo de 2 px y opacidad `gridOp · (1 − 0,7 p)`; y 15 rayos a ángulos de −77° a 77° cada 11°, desde (`cx + tan a · 90`, pies + 18) hasta (`cx + tan a · 1500`, pies + 430), opacidad `gridOp · 0,5`.
- **Velo superior:** un degradé vertical del color del fondo a transparente, de 0 a `pies − 260`, que esconde la grilla salvo cerca del piso.
- **Aura:** un óvalo de 860 × 1240 centrado en (`centroX`, `arriba + 0,45 · altoDelCuerpo`), degradé radial. **Piso:** un óvalo de 580 × 96 centrado en `centroX`, de `pies − 34` a `pies + 62` (solo entero y tren inferior).

### 3.2 La figura en la lámina

La imagen se escala para que la caja del cuerpo mida `altoDelCuerpo` y se corre para que su borde superior caiga en `arriba` y su centro en `centroX` (`figGeom`): `escala = altoDelCuerpo / (1350 · alto / 100)`, `imgAncho = 900 · escala`, `imgAlto = 1350 · escala`, `imgX = centroX − (centro / 100) · imgAncho`, `imgY = arriba − (arriba% / 100) · imgAlto`, con `alto`, `centro` y `arriba%` de la caja del cuerpo de la figura.

| Modo | Encuadre | altoDelCuerpo | centroX | arriba | Piso |
|---|---|---|---|---|---|
| Medición (`LAY`) | Entero | 1270 | 840 | 408 | sí |
| Medición | Tren superior | 1120 | 875 | 300 | no |
| Medición | Tren inferior | 1300 | 845 | 360 | sí |
| Serie (`SLAY`) | Tren superior | 820 | 540 | 560 | no |
| Serie | Tren inferior | 1150 | 540 | 530 | sí |

Resultado (px del lienzo):

| Modo | Figura | Escala | x | y | Ancho × alto |
|---|---|---|---|---|---|
| Medición | hombre, entero | 1,044 | 370,2 | 374 | 939,7 × 1409,5 |
| Medición | hombre, tren superior | 0,915 | 464,2 | 251,7 | 823,3 × 1235 |
| Medición | hombre, tren inferior | 1,051 | 371,9 | 296,3 | 946,1 × 1419,2 |
| Medición | mujer, entero | 1,028 | 379,4 | 368,3 | 924,9 × 1387,4 |
| Medición | mujer, tren superior | 0,993 | 428,1 | 229,3 | 893,9 × 1340,8 |
| Medición | mujer, tren inferior | 1,056 | 368,6 | 296 | 950,8 × 1426,2 |
| Serie | hombre, tren superior | 0,670 | 239,2 | 524,6 | 602,8 × 904,2 |
| Serie | hombre, tren inferior | 0,930 | 121,5 | 473,6 | 837 × 1255,5 |
| Serie | mujer, tren superior | 0,727 | 212,8 | 508,3 | 654,5 × 981,7 |
| Serie | mujer, tren inferior | 0,935 | 118,6 | 473,4 | 841,1 × 1261,7 |

En Medición la figura va a la derecha y las tarjetas a la izquierda. En el **tren superior** el brazo del lado izquierdo de la persona sale del lienzo (unos 90 px el hombre, 76 px la mujer), y en el tren inferior del hombre, 17 px de cadera: el compositor lo recorta con el borde de la lámina. Para que se vea igual, hay que recortar igual.

### 3.3 Anillos y puntos

**Anillo** (perímetro): una elipse de semiejes `rx` y `0,17 · rx`, aproximada con 56 segmentos. Se dibuja en dos capas: **debajo de la imagen**, la elipse completa (el cuerpo la tapa y asoma por los costados); **encima**, la mitad trasera (la de arriba) punteada y la delantera (la de abajo) llena. En Medición:

| Capa | Tramo | Color (`PAL`) | Grosor | Opacidad | Guiones |
|---|---|---|---|---|---|
| debajo | completo | `ringA` | 10 | `gA` | |
| debajo | completo | `ringA` | 5 | `gB` | |
| debajo (solo Oscuro) | completo | `under` | 4,6 | 0,7 | |
| debajo | completo | `ringB` | 2,4 | 0,92 | |
| encima | trasero | `ringB` | 2,2 | 0,3 (0,45 en Oscuro) | 4 5 |
| encima | delantero | `ringA` | 11 | `gA` + 0,02 | |
| encima | delantero | `ringA` | 6 | `gB` + 0,06 | |
| encima (solo Oscuro) | delantero | `under` | 6,8 | 1 | |
| encima | delantero | `ringCore` | 3,4 | 1 | |

**Punto** (pliegue), en Medición: encima de la imagen, dos halos rellenos de `ringA` (radio 17 al 14 %, radio 10 al 20 %), un relleno `dotFill` de radio 7,5 (solo Claro: blanco), un aro `dotRing` de radio 7,5 y 2,2 de grosor, y un centro `dotCore` de radio 3. **Punto posterior:** debajo de la imagen, halo `ringA` de radio 15 al 20 %, aro `dotRing` 7,5 / 2,2 y centro `dotCore` 3; encima, un disco `postBack` de radio 12,5 (Oscuro y Azul), un aro `post` de radio 7,5 y grosor 2 punteado 3 / 3,4, y un centro `post` de radio 2,2.

En Serie el dibujo es más liviano: el anillo no tiene resplandor (debajo: mitad trasera `ringB` 2, punteada 4 5, opacidad 0,32 o 0,45; encima: `under` 5,6 en Oscuro y `ringCore` 2,8); el punto usa halos de radio 15 y 9, aro de 6,5 y 2 de grosor y centro de 2,6; el posterior, halo 13, aros de 6,5 y centro de 2. Las recetas completas están en `DIBUJO_EN_MEDICION` y `DIBUJO_EN_SERIE`.

**Colores de la figura por tema** (`PAL`, confirmados contra el dibujo):

| `PAL` | Uso | Claro | Oscuro | Azul |
|---|---|---|---|---|
| `ringA` | resplandor del anillo y **halo** de los puntos | `#00C4EE` | `#78E1FA` | `#00C4EE` |
| `ringB` | anillo debajo de la figura y su mitad trasera | `#00B8E0` | `#A8EAFC` | `#22D3F5` |
| `ringCore` | mitad delantera del anillo | `#00C8F0` | `#C4F0FF` | `#00C8F0` |
| `gA` / `gB` | opacidad del resplandor ancho / angosto | 0,10 / 0,17 | 0,13 / 0,20 | 0,13 / 0,21 |
| `under` | sombra bajo el anillo | — | `rgba(8,27,60,.55)` | — |
| `lead` | línea guía | `rgba(30,107,242,.5)` | `rgba(150,222,246,.58)` | `rgba(200,235,255,.62)` |
| `leadDot` | punto de la guía | `#1E6BF2` | `rgba(150,222,246,.9)` | `#CFEEFF` |
| `dotRing` / `dotCore` | aro y centro del punto | `#00A8D8` | `#EAFBFF` | `#FFFFFF` |
| `dotFill` | relleno del aro | `#FFFFFF` | — | — |
| `post` | guía, aro y centro de un pliegue posterior | `#94A3B8` | `rgba(214,232,250,.92)` | `rgba(224,240,255,.95)` |
| `postBack` | disco bajo el contorno posterior | — | `rgba(8,27,60,.32)` | `rgba(8,34,84,.22)` |
| `grid` / `gridOp` | grilla del piso | `#1E6BF2` / 0,26 | `#7FD8F2` / 0,34 | `#CFEBFF` / 0,30 |

Dos aclaraciones sobre `PAL`: el **halo de los puntos se pinta con `ringA`** (al 14 % y al 20 %), no con `dotHalo` ni `dotMid`; esas dos claves, igual que `backDash`, están definidas pero el compositor no las usa (en Claro coinciden por casualidad con `ringA`; en Oscuro y Azul, no). Y `gHalo` vale 0 en los tres temas, así que su resplandor extra nunca se dibuja.

### 3.4 Tarjetas y líneas guía (Medición)

Las tarjetas se apilan a la izquierda (`panelHTML`): x = 44, ancho 418, una fila de 62 px por sitio y 10 px de relleno arriba y abajo. Se agrupan así (`GR` y `GF`; en orden):

| Lámina | Entero | Tren superior | Tren inferior |
|---|---|---|---|
| Circunferencias | cuello, hombros, pecho · brazo relajado, brazo contraído, antebrazo, muñeca · cintura, abdomen bajo, cadera · muslo, pantorrilla, tobillo | los tres primeros grupos | abdomen bajo, cadera · muslo, pantorrilla, tobillo |
| Pliegues | pectoral, axilar media, tríceps · subescapular, antebrazo · suprailíaco, abdominal · muslo anterior, pantorrilla | los tres primeros grupos | suprailíaco, abdominal · muslo anterior, pantorrilla |

**Ubicación vertical** (`apilarTarjetas`): cada tarjeta arranca centrada en la altura media de sus sitios; en orden de altura, se empujan hacia abajo para dejar 26 px entre ellas, sin subir de y = 250; si la última pasa de y = 1650, se suben desde abajo —la última y, mientras no quede hueco, las anteriores— y ninguna queda arriba de 250. Ejemplo, hombre entero: tarjetas de perímetros en y = 551,5 / 783,5 / 1077,5 / 1309,5.

**Fila:** a 26 px de cada borde, en línea: el rótulo (ocupa el resto), el valor y la unidad (36 px de ancho: «cm» o «mm»). Entre filas, una línea de 1 px. Un pliegue posterior lleva el rótulo al 60 % y la marca «posterior».

**Línea guía** (una por fila): sale de (476, centro de la fila), corre horizontal hasta x = 516 y sigue recta hasta el sitio: el borde izquierdo del anillo menos 10 px (en `cy`), o 16 px a la izquierda del punto. Trazo `lead` de 1,8 punteado 8 / 7; en el inicio, un punto `leadDot` de radio 3,6. Para un pliegue posterior: trazo `post` de 1,5 punteado 3 / 5 y punto `post` de radio 3.

### 3.5 Pies de lámina

- **Circunferencias — «DIÁMETROS ÓSEOS»:** el rótulo en (48, 1684) y tres tarjetas de 314 × 82 en y = 1712, desde x = 44 cada 334 px: Codo, Muñeca, Rodilla. Cada una: rótulo a 24 px del borde izquierdo, valor a 62 px del derecho y «cm» a 24 px del derecho. Los diámetros no tienen sitio en la figura.
- **Pliegues — método, sitios y suma:** una tarjeta de 992 × 92 en (44, 1706) con tres columnas separadas por líneas verticales de 62 px: «MÉTODO» / «Jackson-Pollock 7» (21 px), «SITIOS» / la cantidad de pliegues **dibujados en el encuadre** —9, 7 o 4, no los 7 del método— y «SUMA 7 PLIEGUES» / el valor cargado en «mm». El compositor no suma: `suma7` es un dato más.

### 3.6 Encabezado y etiqueta del encuadre

- **Claro y Azul:** título centrado en y = 88 («CIRCUNFERENCIAS», «PLIEGUES», «CONCLUSIONES»), y debajo, en y = 158, la línea «NOMBRE · ANTROPOMETRÍA · FECHA» en mayúsculas.
- **Oscuro:** la fecha en una píldora de vidrio de 196 × 54 en (52, 56); el título dentro de una píldora centrada (alto 70, márgenes de 44 px) en y = 48; el nombre en mayúsculas debajo, en y = 138.
- **Etiqueta del encuadre:** una píldora arriba a la derecha (y = 60, a 52 px del borde, alto 46, márgenes de 26 px) con «CUERPO ENTERO», «TREN SUPERIOR» o «TREN INFERIOR» (`TAG`). Conclusiones no la lleva. En Serie dice «SERIE · TREN SUPERIOR» (o inferior) y, en Evolución, «SERIE».

### 3.7 Pie de página

El logo centrado en y = 1826, de 40 px de alto (el claro en tema Claro; el oscuro en Oscuro y Azul), y debajo, en y = 1886, «BETTER EVERYDAY».

### 3.8 Tipografía

Poppins en tres pesos (400, 500 y 700), embebida como subconjunto de 89 caracteres: letras, cifras, vocales con tilde, ñ, ü y `% ( ) + , - . / : ° · – —`. **No trae las flechas** (→ ↑ ↓) que usa el modo Serie, que el navegador resuelve con otra fuente. BE tiene que usar la familia completa.

| Elemento | Tamaño / peso | Detalle |
|---|---|---|
| Título (Claro, Azul) | 56 / 700 | interletra 0,5 px |
| Línea de nombre y fecha | 19 / 500 | mayúsculas, interletra 1,6 px |
| Título en píldora (Oscuro) | 36 / 700 | interletra 1,5 px |
| Fecha en píldora / nombre (Oscuro) | 21 / 500 · 20 / 500 | el nombre en mayúsculas, interletra 3 px |
| Etiqueta del encuadre | 17 / 500 | interletra 1 px |
| Rótulo de fila | 24 / 400 | |
| Valor de fila | 32 / 700 | cifras tabulares |
| Unidad | 17 / 500 | |
| Marca «posterior» | 14 / 500 | interletra 0,5 px, píldora de radio 7 |
| Rótulo de bloque («DIÁMETROS ÓSEOS», «INSIGHTS CLAVE») | 16 / 500 | interletra 2,5 px |
| Pie de Pliegues: rótulo / valor | 14 / 500 · 21 o 24 / 700 | interletra 1,5 px en el rótulo |
| Título de tarjeta (Conclusiones) | 25 / 500 | centrado |
| «BETTER EVERYDAY» | 13 / 500 | interletra 4 px |

Los valores se muestran como se cargaron, con coma decimal; un dato que falta se muestra como «—», nunca como cero. TMB, gasto diario y calorías objetivo se redondean a entero.

### 3.9 Colores de la lámina por tema

| Elemento | Claro | Oscuro | Azul |
|---|---|---|---|
| Fondo | degradé 163°: `#F2F6FC` → `#E9F0FA` 46 % → `#DEE8F6` 78 % → `#D6E2F3` | degradé 158°: `#0B1A2C` → `#081422` 40 % → `#050D17` 72 % → `#081524` | degradé 104°: `#071B3D` → `#0C2E63` 34 % → `#14468F` 62 % → `#1E63C8` |
| Tarjeta (vidrio) | `#FFFFFF`, borde `rgba(255,255,255,.9)`, radio 22, sombra `0 10 30 rgba(20,50,100,.13)` | degradé `rgba(28,48,74,.72)` → `rgba(16,30,50,.66)`, borde `rgba(150,200,235,.23)`, radio 26, sombra interior clara y `0 16 40 rgba(0,0,0,.42)` | degradé `rgba(255,255,255,.14)` → `.07`, borde `rgba(255,255,255,.26)`, radio 24, sombra interior y `0 16 40 rgba(3,12,30,.34)` |
| Título / línea de nombre | `#0A1F44` / `#1E6BF2` | `#FFFFFF` (píldora) / `rgba(206,226,244,.55)` | `#FFFFFF` / `#A9D6FF` |
| Etiqueta del encuadre | fondo blanco, borde `rgba(30,107,242,.4)`, texto `#1E6BF2` | fondo `rgba(95,212,240,.13)`, borde `rgba(95,212,240,.42)`, texto `#A0E6FA` | fondo `rgba(255,255,255,.13)`, borde `rgba(255,255,255,.38)`, texto `#DCEEFF` |
| Rótulo · valor · unidad de fila | `#334155` · `#1E6BF2` · `#94A3B8` | `rgba(224,238,250,.82)` · `#FFFFFF` · `rgba(255,255,255,.45)` | `rgba(255,255,255,.86)` · `#FFFFFF` · `rgba(255,255,255,.55)` |
| Separador de filas | `#E8F0FC` | `rgba(255,255,255,.10)` | `rgba(255,255,255,.16)` |
| Marca «posterior» | fondo `#EDF1F7`, texto `#8496AD` | fondo `rgba(255,255,255,.09)`, texto `rgba(206,224,247,.62)` | fondo `rgba(255,255,255,.12)`, texto `rgba(216,236,255,.72)` |
| Rótulo de bloque · rótulo del pie de Pliegues · su valor | `#6B7C96` · `#6B7C96` · `#0A1F44` | `rgba(170,205,235,.6)` · `rgba(170,205,235,.63)` · `#FFFFFF` | `rgba(214,234,255,.7)` · `rgba(214,234,255,.72)` · `#FFFFFF` |
| «BETTER EVERYDAY» | `#7C93B5` | `rgba(170,205,235,.47)` | `rgba(214,234,255,.6)` |

Las variables `--be` (`#2E8FFF`), `--cy` (`#5FD4F0`) y `--ring` (`#C4F0FF`) que cita `UI-ANTROPOMETRIA.md` son de la **interfaz del compositor**, no de la lámina: `--be` pinta sus botones y `--cy` y `--ring` no se usan en ninguna parte. El azul de la lámina en tema Claro es `#1E6BF2`, y `#C4F0FF` aparece solo como `ringCore` del tema Oscuro.

### 3.10 La lámina «Conclusiones» (Medición)

No lleva figura ni etiqueta de encuadre. Tiene cuatro tarjetas:

1. **Composición corporal** (52, 236; 560 × 470): Masa muscular (`musculo`), Masa grasa (`masaGrasa`), Masa ósea (`osea`) y Masa magra (`masaMagra`), en kg, una por fila cada 64 px; abajo, separado, **Peso total** (`peso`).
2. **Grasa corporal** (636, 236; 392 × 470): un anillo de progreso (radio 86, trazo 15, desde arriba en sentido horario, color `gauge` sobre `gTrack`) con el **% de grasa JP7** (`grasaPct`) en el centro y el rótulo «JP7»; debajo, **TMB** (`tmb`) en kcal, «Energía basal diaria».
3. **Perfil nutricional diario** (52, 742; 976 × 560): Actividad, Objetivo, Gasto diario (`get`, kcal) y Calorías objetivo (`calObj`, kcal, en color `accent`); y una fila por macronutriente —Proteínas, Carbohidratos, Grasas— con un anillo chico del porcentaje (radio 30, trazo 9), los gramos y las kcal.
4. **Insights clave** (52, 1352; 976 × 392): hasta cuatro textos libres con viñeta; la tarjeta no aparece si no hay ninguno.

**Qué calcula el compositor:** casi nada. Todos esos valores son **datos cargados** (pegados del export de Notion como «etiqueta: valor» o escritos a mano). Las únicas cuentas son:

- kcal de cada macronutriente = `round(gramos × 4)` para proteínas y carbohidratos, `round(gramos × 9)` para grasas;
- el anillo de grasa y los de macronutrientes recortan el porcentaje a [0, 100];
- TMB, gasto diario y calorías objetivo se redondean a entero al mostrarse.

**Referencia, no fuente: lo que sugieren los números del ejemplo.** El botón «Ejemplo» carga una toma cuyos derivados cierran, aproximadamente, con estas relaciones. No están en el compositor —las calcula Notion— y hay que confirmarlas con Dirección antes de usarlas:

- masa grasa ≈ peso × %grasa / 100 (76,85 × 10,1 % = 7,76 → 7,8); masa magra ≈ peso − masa grasa (69,1);
- TMB ≈ 370 + 21,6 × masa magra (Katch-McArdle: 1862); gasto diario ≈ TMB × 1,55 con actividad «Moderado» (2886); calorías objetivo ≈ gasto × 1,15 con objetivo «Volumen» (3319);
- proteínas ≈ 2 g por kg de masa magra (138,1 g); grasas ≈ 1 g por kg de peso (76,85 g); carbohidratos ≈ el resto de las calorías / 4 (519 g); cada porcentaje ≈ kcal del macronutriente / calorías objetivo (17 %, 21 %, 63 %);
- músculo 31,1 kg coincide con 0,45 × masa magra; la masa ósea (12,4 kg) no se reconstruye con las fórmulas usuales (Rocha da 12,7 con los diámetros del ejemplo).

Y una advertencia: el **10,1 % de grasa del ejemplo no sale de sus propios pliegues**. Con Jackson-Pollock 7 para hombres (densidad = 1,112 − 0,00043499 · S + 0,00000055 · S² − 0,00028826 · edad) y Siri (% = 495 / densidad − 450), la suma del ejemplo (41,5 mm, que sí es la suma de PL1 a PL7) y 21 años dan **4,6 %**. El ejemplo sirve para ver la lámina, no como caso de prueba.

### 3.11 Modo Serie

Agrupa las tomas de una persona leídas de un CSV de Notion (hasta 8, que pasan a llamarse T1…Tn) y arma tres láminas:

- **Encabezado:** como en Medición, con la línea «NOMBRE · EVOLUCIÓN ANTROPOMÉTRICA · fecha T1 → fecha Tn»; debajo, una fila de chips «T1…Tn» con su fecha (el último resaltado), en tarjetas de hasta 310 px de ancho en y = 212, unidas por un trazo de 10 × 3.
- **Franja de resumen** (Circunferencias y Pliegues; 992 × 106 en y = 352): PESO (kg), % GRASA JP7 y MASA MAGRA (kg), como cadena «T1 → … → Tn» (o primera → última si son más de tres), la última resaltada.
- **Circunferencias y Pliegues:** la figura centrada (§ 3.2) y las tarjetas en **dos columnas** de 284 px (x = 34 y x = 762), entre y = 486 y y = 1800, separadas 18 px. Los sitios se reparten por su posición lateral: la mitad de los sitios (redondeada para arriba) que quedan más a la izquierda —los del brazo— va a la columna izquierda, y el resto a la derecha; cada columna se ordena por altura y todas sus tarjetas miden `min(348, ⌊(1314 − 18 · (n − 1)) / n⌋)`. La guía sale del borde de la tarjeta que mira a la figura, 30 px debajo de su borde superior, corre 34 px y sigue recta hasta el sitio (el borde del anillo de ese lado ± 7 px, o el punto ± 15 px), con el punto de radio 3 **en el sitio**. Cada tarjeta muestra el último valor grande, la variación T1 → Tn con flecha, un gráfico de línea de la serie y los valores en una píldora; la tarjeta compacta (alto menor de 280) achica márgenes y letras.
- **Evolución:** seis tarjetas de 470 × 436 en dos columnas desde (44, 372): PESO, % GRASA JP7, MASA MAGRA, MÚSCULO, SUMA 7 PLIEGUES y CINTURA, cada una con ícono, último valor, variación absoluta, «% vs T1» y gráfico grande; al pie, «n TOMAS · T1 fecha → Tn fecha».

**Cuentas de Serie:** variación = último − primero (de los valores presentes); «% vs T1» = variación / |primero| × 100. En los gráficos, la escala va de 0 a `niceCeil(1,15 × máximo)` (el siguiente valor «redondo»: 1; 1,5; 2; 2,5; 3; 4; 5; 6; 8 o 10 por una potencia de 10) para % grasa y suma de pliegues —y para los pliegues de las tarjetas—, y si no, de `máx(0, mínimo − 0,35 · rango)` a `máximo + 0,35 · rango`, donde el rango es el mayor entre máximo − mínimo, el 3 % del máximo y 0,6. Una toma sin dato no se une con línea llena: el tramo que la saltea va punteado y con menos opacidad, y la toma se marca con un círculo punteado sobre la línea interpolada, «para no simular una progresión continua que no se midió». Un 0 en una métrica derivada se trata como falta de dato (es una fórmula de Notion sin insumos).

**Colores de variación (`DCOL`):** el compositor pinta la variación de **verde si «mejoró» y naranja si «empeoró»** según la métrica (pliegues, % grasa y suma: bajar es mejor; masa magra y músculo: subir es mejor; peso, cintura y perímetros: neutro). Claro: `#149A54` / `#E0662F` / neutro `#1E6BF2`; Oscuro: `#4ADE80` / `#FBA34B` / `#5FD4F0`; Azul: `#8CF2B8` / `#FFC08A` / `#BFE7FF`. **No se trasladaron a `figura-de-lamina.ts`**: ver § 4, punto 1.

### 3.12 Exportación

html2canvas con `scale: 2` (PNG de 2160 × 3840, con las sombras apagadas durante la captura porque html2canvas las dibuja sin desenfoque). Nombre: `BE-{nombre}-{AAAAMMDD}-S{1|2|3}[-{all|sup|inf}].png`. En Medición, antes de exportar avisa si faltan datos (nombre, fecha, los sitios del encuadre y, en Circunferencias, los diámetros).

Funciones del compositor que **no** son de la lámina y quedan afuera: el lector de «etiqueta: valor» de Notion, Guardar/Abrir JSON, la calibración (arrastre, teclado, exportar e importar posiciones) y la carga de CSV (que Dirección aclaró que «era una prueba»).

---

## 4. Lo que queda por decidir

Ninguno de estos puntos se resolvió en código; se anotan para que Dirección decida.

1. **Colores «mejor / peor» del modo Serie (`DCOL`).** Pintar una variación de verde o naranja es calificarla, y choca con RF-048 («no se presenta como diagnóstico»), con RF-049 («no produce un score global de salud»), con INV-06-06 y con la regla de DL-073 («la figura ubica, nunca califica»). Opciones: (a) dibujar la variación en un solo color neutro, con flecha y signo; (b) mantener los colores con una decisión explícita de Dirección que acote RF-048 para esta vista.
2. **«Insights clave».** Son texto libre del profesional; el ejemplo trae juicios («rango atlético excelente»). En BE serían una nota del profesional con autor y fecha, no un resultado del sistema; hay que definir si la lámina los muestra y cómo se rotulan.
3. **«Conclusiones» mezcla dos verticales.** Composición corporal y % de grasa son cálculos antropométricos: en BE tienen que salir de un cálculo registrado con método y versión (RF-048), no de un número pegado. TMB, gasto, calorías objetivo y macronutrientes son prescripción nutricional, que vive en la vertical de nutrición. La lámina puede reunirlos, pero cada valor tiene que traer su procedencia.
4. **«Claro y azul».** El compositor tiene tres temas: Claro, Oscuro y **Azul** (fondo azul profundo con texto blanco). La instrucción de Dirección («usaremos la apariencia claro y azul») puede leerse como «los temas Claro y Azul», no como «un tema claro con acentos azules», que es como la tomó `UI-ANTROPOMETRIA.md`. Conviene confirmarlo.
5. **Suprailíaco → supraespinal**, y **bíceps y cresta ilíaca sin sitio** (§ 2.2). Si el cálculo de JP7 en BE toma el suprailíaco de otra clave, la lámina y el cálculo tienen que usar la misma.
6. **«SITIOS» en el pie de Pliegues** cuenta los pliegues dibujados (9, 7 o 4), no los siete del método que se nombra al lado. Puede confundir: en el entero dice «9» junto a «Jackson-Pollock 7».
7. **Calibración del tren inferior del hombre:** el punto suprailíaco (y = 1 %) y el abdominal quedan sobre la franja desvanecida, casi fuera del cuerpo visible (§ 2.1).
