# Antropometría · plan de implementación (solo lectura: no compilé ni ejecuté nada)

Pantallas: **22** (las tomas; hoy «Evaluaciones»), **29** (una medición con su historia; se abre sobre la 22) y **23** (cargar una toma sobre la figura; hoy la pestaña «En preparación»). Y lo que no está dibujado: Evolución, Lámina, «Calcular con un método», el detalle de un resultado y los formularios de corregir y de anular.

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento` (rama `wp-escritorio-amable`, HEAD `c565f0c`)
- `WEB` = `REPO\apps\web\src` · `ADV` = `WEB\app\pro\advisees` · `ANT` = `ADV\anthropometry` · `SEG` = `ADV\seguimiento` · `COMP` = `WEB\components` · `LIB` = `WEB\lib` · `CSS` = `WEB\app\globals.css` · `TOK` = `WEB\app\tokens.css`
- En `ANT`: `AN` = `antropometria.tsx` (123 líneas) · `EV` = `evaluaciones.tsx` (434) · `CA` = `calculos.tsx` (408) · `PR` = `preparacion.tsx` (596) · `FG` = `figura.tsx` (115) · `EVO` = `evolucion.tsx` (106) · `GEV` = `grafico-de-evolucion.tsx` (408) · `LA` = `lamina.tsx` (598) · `LD` = `lamina-dibujo.tsx` (1.078) · `LDE` = `lamina-descarga.tsx` (84) · `PG` = `page.tsx` (24)
- `DOM` = `REPO\packages\domain\src` · `CAN` = `DOM\contratos-antropometria.ts` · `CCA` = `DOM\contratos-calculo.ts` · `COPA` = `DOM\copy-antropometria.ts` · `FA` = `DOM\figura-antropometrica.ts` (la silueta vieja) · `FL` = `DOM\figura-de-lamina.ts` (la figura de Dirección) · `LAM` = `DOM\lamina.ts` · `NOM` = `DOM\nombres-de-metricas.ts` · `EVD` = `DOM\evolucion-antropometrica.ts` · `CLI` = `DOM\cliente-http.ts` · `OAS` = `DOM\openapi.ts` · `CAR` = `DOM\cartera.ts`
- `API` = `REPO\apps\api\src` · `CTRL` = `API\antropometria\antropometria.controller.ts` · `EVS` = `API\antropometria\evaluaciones.service.ts` · `MES` = `API\antropometria\mediciones.service.ts` · `LCA` = `API\antropometria\lectura-calculo.ts` · `LAN` = `API\antropometria\lectura-antropometria.ts` · `PAGI` = `API\http\paginacion.ts`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` · `M22` = `MQ\partes\22-cuerpo.html` · `M23` = `MQ\partes\23-cuerpo.html` · `M29` = `MQ\partes\29-encima.html` · `ARM` = `MQ\armar.mjs`
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas` · `R` = `H\recorrido.mjs` · `RC` = `H\recorrido-comprension.mjs` · `PGS` = `H\paginas.mjs`
- `EA` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE` · `CRIT` = `EA\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `EA\diseno\iconos\CATALOGO.md` · `RELA` = `EA\relevamientos\antropometria.md` · `MOD` = `EA\relevamientos\espacio-profesional-plan-de-implementacion.md`
- `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md` · `DL` = `REPO\docs\DEUDA_LEGAJO.md`
- `SC` = `REPO\scripts` · `CP` = `SC\copy-pantallas.test.cjs` · `CT` = `SC\contraste.test.cjs`

**Con qué leí**
- **Las maquetas:** las tres partes (`M22`, `M23`, `M29`), las imágenes de `EA\diseno\maquetas\claro\` (22, 23 y 29; las de Azul noche no las abrí) y, para el marco del área, los HTML armados (`MQ\22-tomas-de-antropometria.html:15-29`) y `ARM:59-73, 83-90, 121-123`.
- **El código, en HEAD `c565f0c`.** Desde `ab90860` (el commit de `RELA`) en `ANT` cambió solo `LA` (+5/−1, en `4b84714`): los números de línea de `RELA` para `EV`, `CA`, `PR`, `FG`, `EVO` y `GEV` siguen valiendo. Los de `CSS` se corrieron (ejemplo: `.evaluaciones` estaba en 2257 y está en 2307).
- **El árbol cambió mientras leía, y siguió cambiando.** Al cerrar este documento, otra sesión tiene sin commit: `CSS` (+330/−14, todo después de la línea 5569 de HEAD), `RC` (+207/−38, desde la línea 804), seis archivos de `SEG` (`analizar`, `etapas`, `geometria`, `minigrafico`, `preguntas`, `selector`), uno del dominio (`entrenamiento-del-analisis.ts`) y tres archivos de prueba. No tocó ningún archivo de `ANT`. **Los números de línea de `CSS`, de `RC` y de `SEG\analizar.tsx` son los de HEAD** (los verifiqué con `git show HEAD:`). En la copia de trabajo, lo de `CSS` posterior a la 5569 se corrió, y en `RC` la comprobación R3 está 64 líneas más abajo.
- **No vi ninguna pantalla andando.** Lo de hoy lo leí del código; los altos de hoy son los de `EA\parte-0\alturas-despues.json:125-152` (1440 × 900, del 10/10).
- Conté las líneas de cada archivo con una búsqueda, sin ejecutar nada.

Todo lo que afirmo del código lo leí, con su línea. Lo que deduzco va con **[supongo]** y lo que calculo sin medir, con **[estimo]**.

## 1. Lo que condiciona el plan

1. **Hoy la carga y la lámina usan dos figuras distintas. La maqueta 23 pasa la carga a la de Dirección.**

   | Pantalla | Qué figura usa | Sitios |
   |---|---|---|
   | «En preparación» (la carga) | Una silueta dibujada para BE, de frente y de espalda, sin sexo (`FG:19-60`; `PR:43, 239, 447-453`) | **14** (`FA:119-134`): 8 pliegues (6 de frente y 2 de espalda) y 6 perímetros |
   | «Lámina» | Los PNG de Dirección (`LD:399`: `/figura/{archivo}`; copias en `REPO\apps\web\public\figura\`) | Cuerpo entero: **24** = 13 perímetros + 11 pliegues, en hombre (`FL:238-265`) y en mujer (`FL:329-356`). Tren superior: 19 = 10 + 9 (`FL:274-296, 365-387`). Tren inferior: 10 = 5 + 5 (`FL:305-318, 396-409`) |
   | «Evaluaciones» y «Evolución» | Ninguna | — |
   | APK | La de Dirección (`REPO\apps\mobile\src\composicion-de-la-figura.ts`) | Fuera de este plan |

   - Con el «Perfil antropométrico completo» (30 mediciones: `SC\catalogo-antropometrico\catalogo-perfil-completo.cjs:5-36`), hoy 10 de sus 24 pliegues y perímetros no tienen punto en la carga: pectoral, axilar medio y antebrazo; cuello, hombros, pecho, antebrazo, muñeca, abdomen y tobillo.
   - **Los sitios de la maqueta son los del dominio, número por número** (`M23:146-160` contra `FL:329-343`), y su cuenta es la de `anilloEnLaLamina` (`M23:163`; `FL:821-824`; el alto del anillo, 0,17 de su ancho: `FL:803`). Usando esas funciones no se mueve ningún punto, y una prueba lo puede fijar como la de la APK (`SC\composicion-de-la-figura.test.mjs:44-53`).
   - Dos pliegues no vienen del compositor: bíceps y cresta ilíaca. Sus coordenadas «las ubicó el ejecutor sobre cada figura y Dirección las tiene que validar» (`FL:126-138`). De frente casi coinciden con tríceps y supraespinal, y no se corren para separarlos.
   - Tríceps y subescapular son de la cara posterior: en la figura de Dirección van sobre el frente, con la marca «posterior» (`FL:140-149`; `COPA:241`). La vista «De espalda» de hoy desaparece.
   - Las claves del protocolo y las de la figura son las mismas (`catalogo-perfil-completo.cjs:9-32` y `FL:50-77`): no hace falta ninguna tabla de equivalencias.

2. **La maqueta 23 dibuja solo «Perímetros».** «Pliegues 0 de 11» está como la otra mitad (`M23:72-73`), sin dibujar. La regla escrita es «Los campos del tronco van a la derecha de la figura y los del brazo y la pierna a la izquierda, para que ninguna guía cruce el cuerpo de más» (`CRIT:402-405`), y los grupos de pliegues del compositor mezclan tronco y brazo en una misma tarjeta (`FL:478-494`: pectoral, axilar media, tríceps y bíceps van juntos). Además, a los 440 px de ancho de la figura, bíceps y tríceps quedan a unos 3 px uno del otro, y cresta ilíaca y supraespinal, a 3 px en la de hombre y a 7 en la de mujer **[estimo, con `FL:256-261, 347-352`]**: dos campos apuntan casi al mismo lugar, y no se pueden separar. Hay que decidir la composición de pliegues antes de programarla (DEC-A14).

3. **La lista de tomas no trae el protocolo ni cuántas mediciones tienen corrección.**
   - El resumen de cada toma trae `measurementCount`, `derivedResultCount`, `metrics` y `annulledCount`, la fecha de la toma y la de registro (`CAN:176-190`; `EVS:267-280`). Nada más.
   - La maqueta agrupa la lista por protocolo y dice «30 mediciones · 1 corregida» (`M22:54-61`).
   - El protocolo y las correcciones están en el detalle de cada toma (`CAN:119, 125`), que es una lectura protegida por toma (`CTRL:97-101`; el cupo es de 120 por minuto y por profesional: `API\config\entorno.ts:133-140`). `OAS:2633-2676` no lista API-ANT-04 entre las protegidas, pero el controlador sí la cuenta.
   - Hoy la pantalla tampoco lo muestra en la lista (`EV:161-166`): el protocolo lo saca de la toma abierta (`EV:203, 254-259`). DEC-A1.

4. **«Lo que cambió con la corrección» (pantalla 29) se puede armar con lo que ya llega, por relación.**
   - Al corregir, la API reemite las corridas que usaban esa medición, con el valor nuevo como entrada (`MES:104-106, 270-289`; `DOM\antropometria.ts:232-252`).
   - La lista de corridas dice qué corrida reemplaza a cuál (`supersedesRunId`, `supersededByRunId`: `CCA:116-117, 130-131`) y, de cada entrada, de qué medición salió y **con qué valor se calculó** (`sourceRef`, `magnitude`: `CCA:87-95`; `LCA:96-100`).
   - Entonces, para una corrección: las corridas de la toma que reemplazan a otra, que usan esta medición con el valor corregido, y cuya reemplazada la usaba con el valor anterior. De cada par salen el valor de ahora y el de «antes». Es una relación, no una coincidencia de fechas.
   - La respuesta de corregir ya trae ese impacto (`dependencyImpact`: `MES:114`), pero el contrato del cliente no lo declara (`CLI:952`; `OAS:1215`: `MedicionSchema.loose()`). La de anular sí (`CAN:285-297`). Hoy la pantalla lo ignora en los dos casos (`EV:301-303, 311-314`).
   - Si una corrida quedó sin sucesora (falta una entrada vigente), el texto ya existe y no se usa: «No se pudo recalcular: falta una medición vigente. No se reemplaza por cero.» (`COPA:63`).

5. **«En preparación» deja de ser una pestaña, pero `vista=preparacion` no se puede quitar ni renombrar.** La usan y la fijan:
   - el botón «Preparar una toma» del Resumen (`SEG\resumen-area.tsx:255`) y su comprobación (`R:2374-2378`);
   - el pendiente «Evaluación en preparación» del Espacio profesional (`WEB\app\pro\pendiente-en-una-fila.ts:69-73`; `SC\espacio-profesional.test.mjs:168`; `H\cartera-simulada.mjs:60`);
   - las capturas (`PGS:41`).
   Queda como un estado de la página: abre la carga, con «Tomas» marcada (`ARM:61`) y «‹ Tomas» para volver (`M23:57`).

6. **Hay un solo borrador a la vista y no se puede descartar** (`PR:121`: toma el primero de la lista). Hoy la pestaña «En preparación» lo deja siempre a un clic. Sin la pestaña, desde «Tomas» no se sabe si hay uno salvo que se lea la lista de borradores (API-ANT-08, otra lectura protegida: `CTRL:79-84`). DEC-A13.

7. **Hoy cada clic vuelve a leer todo, y la lista se lee de a 20.**
   - Elegir otra toma vuelve a pedir la lista y el detalle y reemplaza la vista por «Cargando…» (`EV:75-94, 102, 160`; `AN:69`); el bloque de cálculos vuelve a pedir todos los métodos y todas las corridas del asesorado (`CA:35-50`). Son tres lecturas protegidas o más por clic (API-ANT-03, API-ANT-04 y API-CAL-02: `CTRL:89, 99, 221`). Pasa lo mismo después de corregir, anular, calcular o dejar una referencia (`EV:177-180`; `CA:80-84, 95-98`).
   - La lista pide una sola página (`EV:77`), de 20 (`PAGI:9`), ordenada por fecha de registro (`PAGI:83`), y la pantalla la reordena por fecha de la toma (`EV:54, 80`). La Lámina sí la lee entera (`LA:105`).
   - «5 registradas» (`M22:48`) necesita la lista entera.
   - Si las tomas quedan en memoria durante la visita, un acceso retirado deja de notarse en el clic siguiente: hay que volver a preguntar como la ficha, al volver a la pestaña del navegador y con «Actualizar» (`ADV\workspace.tsx:120-123, 149-155`). El comentario de hoy dice «cada vista pregunta a la API… sin caché» (`AN:5`).

8. **El marco del área no existe.** Hoy la página tiene migas, título, «Volver a la ficha» y pestañas (`AN:105-108, 116`), en un contenedor de 76 rem (`PG:17`; `CSS:476-478`). La maqueta tiene una franja como la de la ficha: volver, el área, la persona, el acceso actual, «Actualizar» con la hora, las pestañas y «Cómo se lee esta vista» (`MQ\22-tomas-de-antropometria.html:15-29`).
   - Es común a las cuatro áreas: las cuatro arman igual su cabecera (`ADV\nutrition\nutricion.tsx:101-112`; `ADV\training\entrenamiento.tsx:99-110`; `ADV\forms\formularios.tsx:96-99`). Conviene que sea **una pieza y un solo dueño** (DEC-A3).
   - El nombre de la persona hoy no está en la página: solo se lee para escribirlo dentro de la lámina (`LA:107-112`). Sale de los vínculos, que no son una lectura protegida.
   - El alias («Ana Ruiz») no existe: queda la referencia (`WP:259`, DL-040).
   - «Actualizar» y la hora hoy no existen en las pestañas de área: cada vista lee al montarse.

9. **Los colores de la figura no pueden escribirse en la hoja de estilos ni en un `.tsx`.**
   - Una prueba falla con cualquier color literal (`#…`, `rgb(`) fuera de `TOK` en todo `apps\web\src` (`CT:343-371`). La maqueta los escribe a mano (`M23:16-19`). Salidas: tokens nuevos, `color-mix` sobre tokens (como la cara pública, `CT:257`) o los colores de la figura que ya tiene el dominio (`FL:597-649`), como hace la lámina (`LD:19-24`).
   - La prueba de contraste pide 3:1 para «los puntos de la figura antropométrica» (`CT:9, 114-120`) y hoy mide los cuatro tokens de la silueta vieja (`TOK:59-62, 114-117`).
   - **El anillo de la maqueta en Claro no llega a 3:1:** `#00a8d8` sobre `#e9f0fa` da unos 2,4:1 **[estimo, a mano]**. En Azul noche (`#27d5f9` sobre `#0a2c47`) da unos 8:1 **[estimo]**. Encima del maniquí, que es casi blanco, es menos todavía **[supongo]**. DEC-A17.
   - El fondo de la escena es un degradé (`M23:16`), y la guía dice que las superficies de trabajo son mates, sin degradé (`GUIA:252-253`).

10. **Una guardia fija el archivo, una clase y un campo de la pantalla 22.** `CP:192-208` abre `ANT\evaluaciones.tsx`, busca el elemento con `className="medicion__fila"` y exige que lea `effectiveMagnitude` y que no use `medicion.magnitude` como titular. Protege que el renglón muestre el valor que rige, no el original. Con el renglón nuevo hay que cambiarla en el mismo commit (E-06, `WP:110`), y el titular del panel 29 queda bajo la misma regla.

11. **Los textos: quién los comparte y qué los cuida.**
    - `CP:51-61, 104-109` recorre todos los `.tsx` de `ANT`: cada archivo tiene que tener algún texto, y ninguno puede decir «normal», «puntaje», «diagnóstico» (afirmado), «se completó», «eliminar medición» y los demás de `COPA:298-317`. Un archivo nuevo sin textos hace fallar la prueba.
    - `DOM\dominio-wp05.test.ts:372-397` pasa todo `COPA` por esa lista y fija cuatro expresiones en tres textos: anular «no borra nada» y «se conservan»; una anulada «no se reactiva»; y los días sin medición «no se completan con cero».
    - «Evaluaciones» pasa a «Tomas» (C-58, `CRIT:398-399`). La palabra «evaluación» está en unos 20 textos de `COPA` (`:18-27, 42-48, 90, 106, 148, 210, 237, 256-257, 263, 268`), en 5 de `EVD:280-297` y en 3 de la cartera (`CAR:153, 164, 178`). Busqué en `apps\mobile`: la APK no usa ninguna de esas claves, así que cambiarlas no pide una APK nueva.
    - Los textos de la figura ya existen y sí los usa la APK: «Medidas en la figura», «Perímetros», «Pliegues», «Figura», «Hombre», «Mujer» (`COPA:176-182`; `REPO\apps\mobile\src\pantallas\figura-de-la-toma.tsx:182-185, 241-242`). Se usan como están.
    - «Cambios sin guardar» y «Guardado» existen (`COPA:37-38`); el primero hoy no se usa.

12. **Los datos de prueba no se parecen a la maqueta.**
    - El asesorado A tiene ocho tomas en 90 días (`H\datos\escenario.mjs:303-331`; `H\datos\comprension.mjs:204-215`). La más completa tiene 10 mediciones; ninguna tiene el perfil de 30.
    - Hay dos protocolos («Perfil…» y «Protocolo de laboratorio (demostración)», `escenario.mjs:280-283`), una corrección (cintura, 95 → 90,5), una anulación (bíceps) y dos IMC (`comprension.mjs:226-234`).
    - La corrección y la anulación se insertan por SQL (`H\datos\generar.mjs:486-495`): no hay corridas reemitidas, así que «lo que cambió con la corrección» no tiene nada que mostrar **[supongo]**.
    - No hay ninguna toma en preparación en el asesorado A **[supongo: no encontré ninguna]**.
    - Para ver la 22, la 23 y la 29 como en la maqueta hace falta una toma completa, varios cálculos y una corrección hecha por la API (DEC-A22).

13. **La guía todavía pide que esta pestaña se use en un teléfono.** «La regla de los 390 px de ancho vale para el website del asesorado y para la pestaña Antropometría» (`GUIA:232-233, 959`). El paquete dice que el profesional trabaja en escritorio y que a 768 y 390 «solo no se rompe» (`WP:289`). Con la carga sobre una escena de 880 px, las dos cosas no entran juntas (DEC-A20).

14. **Las figuras del compositor.** El cierre de DL-073 dice que la carga usó una silueta propia porque «las imágenes del compositor no se usaron porque su origen y su licencia no están documentados» (`DL:1655`). Desde DL-111 se usan en la lámina y en la APK, por pedido de Dirección (`DL:2377`). La carga sería el tercer lugar. No encontré dónde quedó documentado el origen (§11).

15. **Medidas de hoy y de la maqueta.**
    - **Hoy**, a 1440 × 900: «Evaluaciones», 1.174 px; «En preparación», 3.016 (3,4 pantallas); «Evolución», 1.569; «Lámina», 1.382 (`EA\parte-0\alturas-despues.json:125-152`).
    - **La 23:** la escena mide 880 × 632 y la imagen se muestra a 440 × 660 (`M23:16, 18, 162`); cada tarjeta, 292 px, con filas de 48 (`M23:21, 24`); la columna de datos, 448 (`M23:9`). Con el contenedor de la ficha (100 rem, `CSS:4299-4305`), a 1440 la escena queda en 880 px **[estimo]**: coincide.
    - **A 1280**, con la columna de datos en 448, la escena queda en 720 px y entre las dos tarjetas sobran 136, menos que el cuerpo de la figura (177 px en la de mujer y 192 en la de hombre: 40,14 % y 43,65 % de 440, `FL:328, 237`) **[estimo]**. La regla escrita es «los datos de la toma se angostan» (`CRIT:257`): para que la escena conserve unos 830 px, esa columna baja a unos 340 **[estimo]**.
    - **La 22:** lista de 280 px (`M22:5`) y tres columnas de mediciones de 262, 316 y el resto (`M22:35`). A 1280 la tercera queda en unos 250 px y los perímetros no entran en dos subcolumnas **[estimo]**. A 1024, «la lista pasa arriba, como un selector; las familias, una debajo de la otra» (`CRIT:256`).

16. **De antes, menores, que quedan a la vista al reescribir.**
    - Un rechazo de la API que la pantalla no prevé se dice «El servicio no está disponible en este momento. Probá de nuevo más tarde.» (`LIB\intento.ts:60-61`; `DOM\copy.ts:44`). Pasa con la fecha de toma futura (`EVS:468-472`), con un método al que le faltan entradas (`API\antropometria\calculos.service.ts:122`) y con una corrección en otra unidad (`MES:73-80`). El comentario de `CA:7-9` dice que se muestra el motivo, y no es así (`CA:263`).
    - Una falla de lectura no dice su motivo (`AN:71`; `COMP\estados.tsx:74-85`).
    - El aviso «Evaluación registrada. Ya forma parte de la evolución.» se guarda en una vista que se desmonta en la misma función (`PR:143-146`): puede no verse.
    - Un borrador sin mediciones pierde en pantalla su fecha: se reconstruye desde la primera medición (`PR:198-204`), aunque la evaluación trae su `occurredAt` (`CAN:168`) y el tipo local no lo lee (`PR:48-63`).
    - Los plurales: «1 mediciones», «2 anulada» (`EV:163-164, 207`).
    - El aviso de «dos métodos» promete que en la evolución «se ven los dos» (`CA:344-346`); `RELA` (R-1) encontró que la API publica uno por día y métrica.
    - El motivo escrito en «Corregir» aparece en «Anular» y al revés: comparten el estado (`EV:277`).
    - El orden de las familias no es el mismo en la toma y en la carga (`EV:252`; `FA:16`).

## 2. Región por región

### 2.0 El marco del área (pieza común: `MQ\22-tomas-de-antropometria.html:15-29`)

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Volver | «Volver a la ficha, donde estabas», con `volver` | Solo si la URL trae un `volver` válido (`ADV\retorno-y-preparacion.tsx:25-42`); si no, la miga «Ficha del asesorado» lleva a la ficha en su estado inicial (`COMP\migas.tsx:24-26`) | Sin migas, llegando desde «Pendientes» no queda cómo ir a la ficha: el enlace tiene que estar siempre, con otro texto cuando no hay `volver` (DEC-A3) |
| Título y persona | «Antropometría» + «Ana Ruiz · Asesorado · 5db647» | `h1` (`AN:106`); la persona no se nombra | La referencia, sin alias. Un `h1` por página |
| Acceso actual | «Antropometría [Activo]» | No se dice | Sale del vínculo de esta área, con las palabras de BE (`estadoParaMostrar`, como `ADV\workspace.tsx:290-297`) |
| «Actualizar» y hora | Sí | No existen | Vuelve a leer todo lo que la vista muestra (E-58, `WP:192`) |
| Pestañas | «Tomas» (`lista`), «Evolución» (`analizar`), «Lámina» (`imagen`) (`ARM:86`) | «Evaluaciones», «En preparación», «Evolución», «Lámina» (`AN:30-35`) | `Pestanas` ya admite ícono (`COMP\pestanas.tsx:27, 39`). Las claves de URL no cambian: `evaluaciones`, `preparacion`, `evolucion`, `lamina`. `VISTAS` se exporta con las cuatro (`AN:30-36`): las pestañas son tres; los valores válidos de `vista`, cuatro |
| Ayuda | «Cómo se lee esta vista» | Cinco ayudas generales, plegadas y repartidas (`EV:229-231`; `CA:67-69`; `PR:414-416`; `GEV:99-103`; `LA:558-564`) | Una por vista, en el marco (C-04). Nada se borra: se junta. Las que son de un cálculo o de un método (`CA:149-153, 159-172, 350-362`) no son de la vista: se quedan con su cálculo |
| Contenedor | Ancho de la ficha | 76 rem (`PG:17`) | `contenido--ficha` (`CSS:4289-4292`) y el cuerpo en 100 rem |

### 2.1 Pantalla 22 · Tomas

| Región | Maqueta (texto exacto) | Qué la provee hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Tomas» + «5 registradas. Una toma registrada no se edita: cada medición se corrige o se anula, y queda constancia.» (`M22:48`) | `h2` «Tomas registradas» (`EV:144`); la insignia «Solo lectura» en el título de la toma (`EV:213`) | La frase reemplaza a la insignia (`CRIT:161`). La cuenta, sobre la lista entera (1.7). Texto nuevo |
| Acción | «Preparar una toma», con `mas` (`M22:49`) | Solo en el estado vacío (`EV:149-151`); si no, la pestaña «En preparación» | Lleva a `vista=preparacion`. Si ya hay una en preparación, tiene que decirlo (DEC-A13) |
| Lista | Agrupada por protocolo, con `protocolo`; cada toma: «24 sept 2026 · 8:40» y «30 mediciones · 1 corregida» (`M22:53-61`) | `ol.tomas` de botones: fecha de la toma, «N mediciones», « · k anulada», « · registrada el…» (`EV:157-170`) | El protocolo y «corregida» no llegan en la lista (1.3; DEC-A1). «Registrada el» pasa al encabezado de la toma. En la maqueta son enlaces (`nav`): la toma elegida va a la URL (`evaluacion=`, que ya existe: `EV:68-72`) |
| Toma elegida | Recuadro (`M22:15`) | `aria-current="true"` (`EV:160`; `CSS:2291-2294`) | Se conserva el estado accesible |
| Encabezado de la toma | «Toma del 24 sept 2026, 8:40» + etiqueta «Medido» + «Ver lámina» (`M22:66-67`) | `h2` (`EV:212-214`); «Ver lámina» (`EV:219-223`) | «Medido» se dice una vez si todas las mediciones comparten la clase; si no, la fila marca la suya. La hora sale «08:40» (`LIB\formato.ts:10-11`) |
| Metadatos | «Perfil antropométrico completo · 30 mediciones, 1 corregida · registrada el 24 sept a las 9:02 · Contexto: «En ayunas…»» (`M22:69`) | «Protocolo: … · N mediciones (k anulada) · registrada el … por {autor}» (`EV:205-209, 216`); el contexto, suelto y sin rótulo (`EV:217`) | Todo llega en el detalle. «por {autor}» no está en la maqueta: ver 4.1 |
| Resultados: cabecera | «Resultados calculados» + «Calculado» + «Cada uno, con su método. BE no elige uno.» + «Ver 3 anteriores, sin efecto» + «Calcular con un método» (`M22:73-74`) | «Cálculos» + botón primario + ayuda «Cómo conviven los cálculos» (`CA:59-69`) | «Resultados calculados» ya existe (`COPA:57`, sin uso). La frase larga (`COPA:93-94`) va a la ayuda de la vista |
| Resultados: lista | Por categoría (Índices, Sumas de pliegues, Grasa corporal), una línea por método con su valor; «Referencia» como etiqueta (`M22:76-94`) | Una lista con todas las corridas, vigentes y sin efecto, en el orden de la API (`CA:90-102, 136-205`) | El dominio ya agrupa así para la lámina: `resultadosDeLaToma`, `agruparPorCategoria`, `corridaVigente`, `corridasSinEfecto` (`LAM:584, 622-627, 647-648, 656-660`; `LA:288, 300-312`). El renglón es un enlace: abre el detalle del resultado (2.4) |
| Mediciones: cabecera | «Mediciones» + «Elegí una para ver su historia, corregirla o anularla.» (`M22:98`) | `h3` + ayuda «Medido, reportado o calculado» (`EV:228-231`) | La ayuda va a la de la vista |
| Mediciones: lista | Por familia; el nombre sin la familia («Cintura»); la unidad una vez por familia («Perímetros · cm»); solo la excepción marcada («Corregida») (`M22:99-153`) | Por familia, una fila con nombre, valor con unidad, «Medido · Vigente» y dos botones (`EV:232-245, 329-348`) | Los 60 botones se van al panel (C-62). El renglón entero abre la 29. Nombres cortos y unidad: DEC-A11 y DEC-A12. La guardia `CP:192-208` (1.10) |
| Orden | Tres columnas: Masa y estatura, Diámetros y Otras · Pliegues · Perímetros (`M22:100-152`). Dentro de cada familia, «el orden del protocolo» (`M22:34`), que es el del catálogo (`SC\catalogo-antropometrico\catalogo-perfil-completo.cjs:9-35`) | Masa y estatura, Perímetros, Pliegues, Diámetros, Otras (`EV:252`); dentro, el orden en que se registraron (`LAN:62-65`) | DEC-A10. `compararPorCatalogo` existe (`DOM\resumen-de-la-toma.ts:61`) |

### 2.2 Pantalla 29 · Una medición (se abre sobre la 22)

| Región | Maqueta | Qué la provee hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Forma | Un cajón a la derecha, de 600 px, con velo (`M29:3-5`) | No existe: todo se despliega debajo de la fila (`EV:355-431`) | Es el patrón de `PanelDeRegistro` (`SEG\registro-original.tsx:50-95`; `.dialogo--panel`, `CSS:3405-3426`): `dialog` modal, panel de toda la altura desde 64 rem. DEC-A6 |
| Cabecera | «Toma del 24 sept 2026, 8:40 · Perímetros» + «Perímetro de cintura» + «Cerrar» (`M29:35-36`) | El nombre en la fila (`EV:330`) | El nombre completo del catálogo. El foco va al título (E-62, `WP:196`) |
| Valor que rige | «84 cm» + «Medido», «Vigente», «Corregida» (`M29:38`) | `EV:331, 333-336` | Sigue siendo `effectiveMagnitude`. Sin valor vigente: «Sin valor vigente» y el aviso de la cadena (`EV:371-379`; `COPA:119-120`) |
| Datos | «Protocolo» y «Se tomó» (`M29:39-42`) | Una nota, solo si difieren de los de la toma (`EV:349-353`) | Acá van siempre |
| Historia | Cada corrección con su valor, «Por qué se corrigió», quién y cuándo; y «Valor original: 48 cm» (`M29:44-50`) | El desplegable «Correcciones (n)»: valor original, lista «valor · motivo · autor · fecha», «Valor vigente» (`EV:355-381`) | Lo mismo, a la vista. «La corregiste vos» necesita comparar el autor con la cuenta (`CAN:98`; `ADV\workspace.tsx:81`); si no, el nombre |
| Lo que cambió | «Se volvieron a calcular los 3 resultados que usan esta medición…», cada uno con «antes» (`M29:52-62`) | No existe (`EV:303`: solo «Corrección registrada») | Por relación, desde las corridas que ya se leen (1.4). DEC-A7 |
| Acciones | «Corregir medición» (`corregido`) y «Anular esta medición» (`anulado`) (`M29:66-67`) | «Corregir» y «Anular» en cada fila (`EV:337-346`) | No están si la medición está anulada (`EV:337`) |
| Nota | «Corregir pide el valor y el motivo, y conserva la unidad. Anular no borra nada…» (`M29:69`) | El aviso de anular (`EV:418-420`; `COPA:125-126`) y «no se reactiva» (`COPA:130`) | Son textos del dominio con prueba (1.11): se usan esos, no la redacción de la maqueta |
| Medición anulada | No dibujada | El aviso con motivo, autor y fecha, y «Una medición anulada no se reactiva…» (`EV:383-391`) | Va en el panel, sin acciones |

### 2.3 Pantalla 23 · Cargar una toma

| Región | Maqueta | Qué la provee hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Volver | «‹ Tomas» (`M23:57`) | La pestaña «Evaluaciones» | Conserva `volver`. Con cambios sin guardar: DEC-A18 |
| Título | «Toma en preparación» + «Borrador» + «12 de 30 mediciones cargadas. No es historia hasta que la registres.» (`M23:58-59`) | «Evaluación en preparación» o «Nueva evaluación» + ayuda plegada (`PR:413-416`) | La cuenta se calcula con lo escrito (`PR:238`). La frase larga (`COPA:21`) va a la ayuda |
| Estado y botones | «Cambios sin guardar» + «Registrar toma» + «Guardar», arriba (`M23:60-64`) | Barra fija al pie: «Guardado por última vez: …», «Abierta el: …» o «Todavía no se guardó.»; «Guardar»; «Registrar evaluación» solo con borrador y con mediciones (`PR:569-579, 71-74`) | Saber si hay cambios es nuevo: comparar lo escrito con lo guardado. La hora del guardado sale de la API, nunca del reloj (`PR:65-70`). El catálogo dice que «Guardar» de un formulario va sin ícono (`CAT:166`); la maqueta le pone `guardar` (DEC-A23) |
| Familias | «Medidas en la figura»: «Perímetros 9 de 13» · «Pliegues 0 de 11» (`M23:70-74`) | Un `fieldset` por familia en una lista (`PR:455-457`) | El control segmentado existe como estilo (`.segmentos`, `CSS:3544-3612`; `SEG\analizar.tsx:448-458`). Los textos, `COPA:180-182` |
| Figura | «Figura»: «Mujer» · «Hombre» (`M23:75`) | No existe en la carga; en la Lámina, «Hombre» · «Mujer», arranca en Hombre (`LA:219, 538-547`) | No es un dato y no se guarda (`LA:15-16`). DEC-A16 |
| Escena | La figura, un anillo por sitio, una tarjeta por grupo con cada campo unido a su sitio (`M23:78-102`) | La silueta con puntos y anillos, sin campos: tocar un punto lleva al campo de la lista (`FG:62-115`; `PR:364-376`) | La geometría es una función pura sobre `FL` (1.1). Los grupos de perímetros de la maqueta son los del compositor (`FL:455-461`): 1 y 3 a la derecha, 2 y 4 a la izquierda. Las tarjetas se apilan con `apilarTarjetas` (`FL:846-870`; `M23:168-178`) |
| Con dato o sin dato | Anillo con la mitad de adelante llena, o entero y punteado; el color es el mismo (`M23:197-204`) | Punto lleno o vacío, anillo continuo o punteado (`CSS:1513-1538`) | Por la forma, nunca por el color. La figura no recibe los valores (`FA:136-155`): se conserva |
| Campo con el foco | Un halo ancho en su anillo (`M23:196`) | `activa` y halo (`PR:474-475`; `CSS:1545-1548`) | Igual |
| Leyenda | «Con dato», «Sin dato» y «La figura ubica el sitio de toma; no califica el valor.» (`M23:104-108`) | «Pliegue», «Perímetro», «Lleno: ya tiene dato…» y la misma frase (`FG:97-112`) | La frase no cambia |
| Datos de la toma | «Cuándo se tomó», «Cómo se obtuvo», «Protocolo», «Contexto (opcional)» (`M23:114-120`) | Los mismos cuatro campos (`PR:419-443`) | Cambiar de protocolo no pierde nada (`PR:221-235`). El campo de fecha sigue siendo el nativo |
| Fuera de la figura | «Peso», «Talla», «Edad en la toma»; «Diámetros · cm · 0 de 3»; «Agregar otra medición» (`M23:124-134`) | En la lista, por familia (`PR:455-505`); «Fuera del protocolo» con sus tres campos y «Quitar medición» (`PR:510-563`) | Regla: lo que tiene sitio en la figura va en la escena; todo lo demás del protocolo, acá, por familia. El nombre es el del protocolo («Edad al momento de la toma», no el de la maqueta) |

### 2.4 Lo que no está dibujado: cómo queda con el marco nuevo, sin cambiarle el contenido

| Qué | Dónde está hoy | Cómo queda |
|---|---|---|
| **Evolución** | `EVO:52-105`; `GEV:95-141` | Pestaña «Evolución» del marco, al ancho de la ficha. El contenido no cambia: «Período», la nota del período, el aviso de vista parcial (`EVO:80-84`), «Métrica», el grupo de comparabilidad, el gráfico, «Observación elegida» con su comparación, y la tabla. Las tres frases de «Cómo se lee» (`GEV:99-103`) van a la ayuda de la vista. «Abrir la evaluación de origen» (`EVD:283`) cambia la palabra |
| **Lámina** | `LA:434-568` | Pestaña «Lámina». El contenido no cambia: qué se muestra, la imagen con «Descargar imagen», «Cómo se ve» y las notas. La ayuda del pie (`LA:558-564`) va a la de la vista. La toma elegida ya viaja en `evaluacion=` (`LA:99, 458`); hoy se pierde al cambiar de pestaña (`AN:116`) y conviene conservarla |
| **«Calcular con un método»** | Un panel en el lugar (`CA:74-87, 281-406`) | En el cajón (DEC-A9), con lo mismo: el método en dos grupos, su ficha (qué es, «Da», «Pide» con lo que falta, «Población»), el aviso de «ya calculada», «Fuente y regla del método», «Cambiar de qué medición sale cada dato», «Cancelar» y «Calcular». No se pliega lo que hace falta para decidir (`GUIA:570-571`) |
| **Un resultado** | Cada corrida, en la lista (`CA:136-205`) | Al tocar su renglón (DEC-A8): el valor con su precisión, «Calculado», la fecha, «Reemplaza a un cálculo anterior…», «Con qué se calculó» (versión, regla, precisión y entradas) y «Dejar como referencia» con su aviso y «Por qué esta» |
| **Los que quedaron sin efecto** | En la misma lista, con «Sin efecto» y «Por qué está sin efecto» (`CA:146, 149-153`) | Detrás de «Ver N anteriores, sin efecto», cada uno con lo de arriba |
| **Corregir** | En la fila: «Valor ({unidad})», «Por qué se corrige», «Cancelar», «Corregir medición»; apagado sin valor o sin motivo; el número ilegible se marca en el campo (`EV:284-304, 393-414`) | En el pie del panel 29, en el lugar de los dos botones. El contenido no cambia |
| **Anular** | En la fila: el aviso, «Por qué se anula», «Cancelar», «Anular esta medición»; apagado sin motivo (`EV:306-315, 416-431`) | Igual, en el panel. El aviso queda a la vista antes del botón (`GUIA:36-38`). El botón no es rojo (`EV:426`) |
| **Registrar** | `DialogoDeConfirmacion`, con el foco en «Volver» (`PR:582-593`) | Igual. Cambia la palabra: «Registrar toma», «Registrar esta toma» |

### 2.5 Estados (pantalla 19; `CRIT:222-235`)

| Estado | Hoy | Con el marco nuevo |
|---|---|---|
| Sin sesión; cuenta cargando, con falla o sin espacio profesional | `AN:98-101` | Igual, con el título a la vista |
| Área no disponible (404) | «No encontramos un recurso disponible para esta acción.» + «Volver» (`AN:57-66, 70`) | El mismo texto |
| Una escritura que recibe 404 | Se retira todo el contenido de la pestaña (`AN:90-95, 108`) | Igual: también cierra el cajón |
| Lista cargando o con falla | «Cargando…» o «No pudimos cargar esta vista.», sin motivo (`AN:69-71`) | Bloque de estado con qué se carga o por qué falló (`COMP\estados.tsx:40-72`; `LIB\fallas.ts`) |
| Sin tomas | «Todavía no hay evaluaciones registradas.» + nota + «Preparar una toma» (`EV:145-156`) | Igual, con «tomas». La nota nombra la pestaña que se va: se reescribe |
| La toma pedida por URL no está, o falló | Dos avisos, con «Volver a la lista…» y «Reintentar» (`EV:116-139`; `EVD:295-297`) | Igual: la lista sigue completa |
| Cálculos cargando, con falla, sin métodos, sin cálculos | `CA:70-71, 88-89` | En el lugar del bloque, con motivo. «Sin calcular» no es un cero |
| Carga: sin borrador; borrador sin mediciones; protocolo sin métricas | «Todavía no se guardó.» (`PR:570`); «Una evaluación sin mediciones no se puede registrar.» y el botón apagado (`PR:564, 575`); «No hay ninguna evaluación en preparación.» (`PR:516`) | Igual. Un protocolo sin sitios en la figura no dibuja la escena: todo va en «Fuera de la figura» (hoy `toma--sin-figura`, `PR:447`) |
| Carga: algo para corregir | Aviso con el foco y un enlace por campo (`PR:389-409`); el error junto al campo (`PR:494-499`) | Igual. El enlace cambia de familia si el campo está en la otra mitad (DEC-A19) |
| Conflicto de versión | «Este contenido cambió desde que lo abriste…» (`LIB\intento.ts:49-53`) | Igual: lo escrito se conserva |

### 2.6 En 1280 y en 1024 (`CRIT:256-257`); 768 y 390

| Ancho | 22 · Tomas | 23 · Cargar una toma |
|---|---|---|
| 1440 | Como la maqueta | Como la maqueta |
| 1280 | «La lista de tomas se angosta»; la tercera columna no alcanza para dos subcolumnas (1.15) | «Los datos de la toma se angostan» |
| 1024 | «La lista pasa arriba, como un selector; las familias, una debajo de la otra» | «La figura y sus campos ocupan el ancho; los datos de la toma y lo que no tiene sitio van debajo» |
| 768 y 390 | Una columna; el cajón, como diálogo centrado (`CSS:3409-3414`) | La escena no entra: los campos en lista, por familia, sin guías (DEC-A20) |

## 3. Qué dato llega y qué no

| Lo que muestra el diseño | ¿Llega? | Operación y campo | Con lo que hay |
|---|---|---|---|
| «5 registradas» | Como lista | API-ANT-03 (`CLI:920-925`) | Contar la lista leída entera (`todasLasPaginas`, `CLI:1288-1313`) |
| Fecha de cada toma | Sí | `occurredAt` (`CAN:188`) | — |
| «30 mediciones» · «1 anulada» | Sí | `summary.measurementCount`, `annulledCount` (`CAN:181-187`) | — |
| «1 corregida», en la lista | **No** | — | Está en el detalle (`corrections`, `CAN:125`). DEC-A1 |
| El protocolo de cada toma, en la lista | **No** | — | Está en el detalle (`protocol.protocolName`, `CAN:47-54, 119`). DEC-A1 |
| Protocolo, registro, contexto y clase de la toma abierta | Sí | API-ANT-04: `measurements[].protocol`, `registeredAt`, `context`, `dataClass` (`CAN:158-173, 118`) | El protocolo es el más frecuente entre sus mediciones (`EV:254-259`) |
| Resultados vigentes, por categoría | Sí | API-CAL-02 (`CCA:97-134`) y API-MTH-01 (`category`, `CCA:56`) | `LAM:622-660` |
| «Referencia» | Sí | `referenceForPurpose` (`CCA:119`) | Es una sola por asesorado, profesional y finalidad (`API\antropometria\calculos.service.ts:258`): marcar una se la saca a la de otra toma |
| «Ver 3 anteriores, sin efecto» | Sí | `effective`, `supersededByRunId` (`CCA:129-131`) | `LAM:647-648` |
| El valor que rige | Sí | `effectiveMagnitude` (`CAN:127`); `null` si la cadena no se resuelve | — |
| La historia | Sí | `magnitude`, `corrections[]` con motivo, autor y fecha (`CAN:93-100, 116, 125`) | — |
| «La corregiste vos» | Se deduce | `corrections[].author.identityId` contra la cuenta | — |
| «Lo que cambió con la corrección», con «antes» | Sí, por relación | API-CAL-02: `supersedesRunId`, `inputProvenance[].sourceRef` y `magnitude` (`CCA:87-95, 116-117`) | 1.4. `magnitude` es opcional en el contrato (`CCA:91`): si no viene, no se atribuye |
| Lo mismo, apenas se corrige | Viaja; no está declarado | `dependencyImpact` en la respuesta de API-ANT-05 (`MES:114`; `CLI:952`) | No usarlo sin declararlo (3.1) |
| Lo que pasó con los cálculos al anular | Sí | `dependencyImpact` (`CAN:285-297`) | Hoy se ignora (`EV:314`) |
| La toma en preparación | Sí | API-ANT-08 y API-ANT-09 (`CLI:913-918, 931-933`) | Una, la primera (`PR:121`) |
| «12 de 30», «9 de 13», «0 de 3» | Se calculan | El contenido del protocolo (API-ANT-01, `CAN:68-80`; `FA:51-62`) y lo escrito | — |
| «Cambios sin guardar» | Se calcula | Lo escrito contra el borrador leído | — |
| Dónde va cada sitio | Sí, en el dominio | `FL:229-412` | — |
| El alias («Ana Ruiz») | **No existe** | — | DL-040 |
| «Consultado a las 10:32» | **No** | — | El reloj del navegador al recibir la respuesta (`LIB\formato.ts:14`) |

### 3.1 Pide ampliar la API (aparte: no está en los pasos)

| # | Qué | Línea del contrato | Qué resolvería |
|---|---|---|---|
| 1 | El protocolo de cada toma en el resumen de la lista | `CAN:176-190` (`summary` no lo tiene); `EVS:267-280` | Agrupar la lista sin leer el detalle de cada toma |
| 2 | Cuántas mediciones de la toma tienen corrección | El mismo: hay `annulledCount` y no hay uno de corregidas | «30 mediciones · 1 corregida» en la lista |
| 3 | Declarar `dependencyImpact` en la respuesta de corregir | `CLI:952` y `OAS:1215`. Ya viaja (`MES:114`) | Decir lo que cambió apenas se corrige, sin releer las corridas |
| 4 | La causa de una corrida reemitida (qué corrección o anulación la produjo) | `CCA:97-134` no la tiene | Atribuir sin deducir por los valores de las entradas |
| 5 | La cuenta de resultados de cada toma | `EVS:274`: `derivedResultCount` va siempre en 0 | La maqueta no la pide; queda anotado |

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Hoy existe y la maqueta no lo muestra (dónde queda)

| # | Qué | Dónde está | Dónde queda |
|---|---|---|---|
| 1 | La pestaña «En preparación» | `AN:32` | «Preparar una toma» en «Tomas»; la URL sigue (1.5) |
| 2 | « · registrada el {día}» en cada renglón de la lista | `EV:165` | En los metadatos de la toma abierta |
| 3 | «por {autor}» en los metadatos | `EV:208` | Se conserva en esa línea. Cada profesional ve solo sus tomas (`EVS:260`): es siempre el mismo |
| 4 | La insignia «Solo lectura» | `EV:213` | La frase del título (`M22:48`) |
| 5 | «Medido · Vigente» en cada fila | `EV:333-336` | Una vez en el encabezado; la fila marca la excepción («Reportado», «Corregida», «Anulada», «Sin valor vigente») |
| 6 | «Corregir» y «Anular» en cada fila, con su nombre accesible | `EV:337-346` | En el panel 29 |
| 7 | La nota «Protocolo: … · fecha» cuando una medición difiere de su toma | `EV:349-353` | En el panel, siempre |
| 8 | «Correcciones (n)» y «Valor vigente» | `EV:355-381` | «Historia de esta medición», en el panel |
| 9 | El aviso de una medición anulada y «no se reactiva» | `EV:383-391` | En el panel |
| 10 | Ayuda «Medido, reportado o calculado» | `EV:229-231`; `PR:438-440` | En «Cómo se lee esta vista» |
| 11 | Ayuda «Cómo conviven los cálculos» | `CA:67-69` | En la ayuda; la frase corta queda a la vista |
| 12 | De cada cálculo: fecha, «Reemplaza a un cálculo anterior…», «Con qué se calculó» | `CA:154-172` | En el detalle del resultado |
| 13 | «Dejar como referencia», su aviso y «Por qué esta» | `CA:174-203` | En el detalle del resultado |
| 14 | Los cálculos sin efecto, con «Por qué está sin efecto» | `CA:146-153` | Detrás de «Ver N anteriores, sin efecto» |
| 15 | La etiqueta «De una evaluación en preparación» | `CA:145` | En el detalle del resultado, si aparece. Con el flujo de hoy no puede: el contexto sale del estado actual de la toma (`LCA:87`) y el bloque muestra solo corridas de una toma registrada (`CA:48`; `EV:225`) |
| 16 | Los avisos de éxito y de error de cada acción | `EV:106-115`; `CA:132`; `COPA:89, 101, 105, 117, 128-129` | El éxito, donde se mira; el error, con el foco. Dentro del cajón, un aviso flotante de la página queda detrás del diálogo: se dice adentro, o se cierra y lo dice la página (E-91, `WP:231`) |
| 17 | Los dos avisos de «toma pedida que no está» | `EV:116-139` | Arriba de la lista |
| 18 | Carga: ayuda «Qué es una evaluación en preparación» | `PR:414-416` | En la ayuda; la frase corta, en el título |
| 19 | Carga: el selector de unidad cuando el protocolo admite varias | `PR:480-487` | Se conserva, al lado del campo. No es un caso teórico: dos protocolos de demostración declaran una medida en metros y en otra unidad (`REPO\prisma\migrations\20260924130000_protocolo_de_pliegues_y_perimetros\migration.sql:18`; `REPO\prisma\migrations\20260920220000_metodos_y_calculos\migration.sql:129`) |
| 20 | Carga: «Cargado» o «Sin cargar» en cada fila | `PR:493` | Lo dicen el campo y la figura (`CRIT:168`). Fuera de la figura, la cuenta del grupo |
| 21 | Carga: el aviso de errores con enlaces, y el error en el campo | `PR:389-409, 494-499` | Se conservan |
| 22 | Carga: las filas «Fuera del protocolo» y «Quitar medición» | `PR:517-557` | Detrás de «Agregar otra medición» |
| 23 | Carga: cuándo se guardó por última vez, o cuándo se abrió | `PR:570` | Junto al estado: «Guardado · {fecha}» |
| 24 | Carga: «Guardar» lleno sin borrador y «Registrar» lleno con borrador | `PR:571-577` | DEC-A18 |
| 25 | Carga: tocar un sitio lleva a su campo; el nombre al pasar el puntero | `PR:376`; `FG:74-75` | Tocar el anillo enfoca su campo |
| 26 | Carga: la leyenda «Pliegue» / «Perímetro» | `FG:98-109` | La dicen los dos segmentos, con su ícono |
| 27 | Carga: la nota «Tocá un punto para ir a su campo…» | `PR:451` | En la ayuda |
| 28 | Carga: la barra fija al pie | `PR:569` | Arriba (`CRIT:169`). `.acciones--fijas` queda sin uso en el website: la usa solo esta pantalla |
| 29 | La vista «De espalda» | `FG:57-60` | Los dos sitios posteriores, sobre el frente, con «posterior» |
| 30 | Las migas | `AN:105` | El marco (DEC-A3) |

### 4.2 La maqueta lo muestra y BE no lo tiene

- **No existe el dato:** el alias.
- **No llega en esa lectura:** el protocolo y las corregidas de cada toma, en la lista (3.1).
- **Hay que calcularlo en el navegador:** la cuenta de tomas, «lo que cambió con la corrección», «12 de 30» y las cuentas por familia, «Cambios sin guardar», el nombre corto de cada medición, la unidad común de una familia y la hora de la consulta.
- **Es pantalla nueva sobre datos que llegan:** el marco, el panel de una medición, los resultados por categoría, la figura con los campos.

### 4.3 La maqueta dice algo que en BE no es así, o no dice lo que BE dice

| La maqueta | En BE | Qué hacer |
|---|---|---|
| «Ana Ruiz · Asesorado · 5db647» | Solo la referencia | Un dato |
| «24 sept 2026 · 8:40» | La hora sale con dos cifras (`LIB\formato.ts:10-11`) | El formato de BE |
| «Edad en la toma» | «Edad al momento de la toma» (`NOM:12`) | El nombre del protocolo |
| «Guardar» con el señalador | «No es "Guardar cambios" de un formulario: ese botón va sin ícono» (`CAT:166`) | Sin ícono (DEC-A23) |
| La nota del pie del panel 29 | Dos textos del dominio con prueba (`COPA:125-126, 130`) | Los del dominio |
| Los colores del anillo y de las guías, a mano | Solo tokens (`CT:343-371`) | 1.9 |
| Fondo en degradé | Superficies mates (`GUIA:252-253`) | DEC-A17 |
| «Figura: Mujer · Hombre», con Mujer elegida | «Hombre · Mujer», arranca en Hombre (`LA:219, 541-544`) | DEC-A16 |
| No dibuja Pliegues, ni una medición anulada, ni un resultado abierto, ni un protocolo sin figura | Existen | 2.3, 2.4 y 2.5 |
| La barra superior | Vieja | No se toca |

## 5. Piezas del primer paquete: dónde encaja cada una

| Pieza | Dónde | Para qué acá |
|---|---|---|
| `Icono` y el catálogo | `COMP\icono.tsx:35-56`; `DOM\iconos.ts` | Están todos los de las tres pantallas: `lista`, `analizar`, `imagen`, `protocolo`, `medido`, `calculado`, `corregido`, `anulado`, `pliegue`, `perimetro`, `borrador`, `mas`, `cerrar`, `izquierda`, `volver`, `acceso`, `actualizar`, `ayuda`, `calendario`, `abajo` (`DOM\iconos.ts:77-175`). No hace falta dibujar ninguno |
| El marco de la ficha | `ADV\workspace.tsx:169-211`; `CSS:4286-4435` | Modelo del marco del área: las mismas clases de base y tres renglones (E-10) |
| `ComoSeLeeEstaVista` | `SEG\como-se-lee.tsx:237-274` | El botón y el diálogo sirven tal cual, pero el componente está atado a las vistas de la ficha (`:15, 231-235`) e importa piezas de ella (`:12, 16`). Hay que separar la cáscara (botón, diálogo, foco al título) del contenido de cada vista |
| El detalle al costado | `SEG\linea-de-tiempo.tsx:85, 157-167, 294-332, 482-512`; `CSS:3011-3022, 3266-3309` | En la 22 la toma abierta está siempre a la vista: no es este patrón. Sirve el manejo del foco (al título al abrir; al renglón al cerrar; Escape) |
| `PanelDeRegistro` y `.dialogo--panel` | `SEG\registro-original.tsx:50-95`; `CSS:3405-3426` | El cajón de la 29, de «Calcular con un método» y del detalle de un resultado. `PanelDeRegistro` lee por su cuenta el registro: se usa su forma (diálogo, encabezado, «Cerrar»), no el componente |
| `.dialogo--formulario` | `WEB\app\pro\solicitar-vinculo.tsx:93-102`; `CSS:6118-6124` | El modelo para un formulario en un diálogo: Escape no corta un envío en curso (`:97-100`). Vale para corregir y anular dentro del cajón |
| `DialogoDeConfirmacion` | `COMP\dialogo.tsx:27-84` | «Registrar toma», como hoy |
| `BloqueDeEstado`, `EstadoVacio` | `COMP\estados.tsx:24-32, 40-72` | Los estados de 2.5 |
| `lib\fallas.ts` | `LIB\fallas.ts:10-35` | El motivo y el ícono de una falla de lectura |
| `useListaCompleta` | `LIB\lista-completa.ts:30-60` | La lista de tomas entera, con «actualizando» sin que la pantalla salte |
| `BotonDeVista` | `COMP\vista-con-nombre.tsx:14-51` | En estas tres pantallas no hay vistas con cantidad. Los segmentos «Perímetros 9 de 13» son otro control (una opción elegida entre dos), no un filtro |
| `.segmentos`, `.etiqueta-de-dato` | `CSS:3544-3612, 3816-3828` | Los dos segmentos de la 23 y todas las etiquetas («Medido», «Calculado», «Corregida», «Borrador», «Referencia», «Vigente»). Hoy son solo clases, escritas a mano en cada lugar (`SEG\analizar.tsx:448-458, 1078`; `SEG\linea-de-tiempo.tsx:662, 780`; `SEG\resumen-indicadores.tsx:284`) |
| La guía | `GUIA` I y II | I.1.2 (lo que se lee antes de un acto queda a la vista), I.3, I.4, I.6 (solo tokens), I.7 (tabla equivalente: en la 23 la dan los campos con su rótulo), I.8, II.1, II.3, II.8. II.9 hay que reescribirla |

## 6. Pasos, en un orden que deja la pantalla funcionando

Cada compilación del website tarda de 2 a 5 minutos, con la API apagada (`MOD:311`). `npm run typecheck` va antes de cada una. Las pruebas nuevas de `SC` hay que sumarlas a la lista de `REPO\package.json:33`: no es un comodín.

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Sin compilar: el «antes» y los datos.** Las cuatro vistas a 1440, 1280, 1024, 768 y 390, sobre datos recién generados. Decidir de dónde sale una toma completa (DEC-A22) | — | Ninguno | `paginas.mjs` (`PGS:41`); `ver.mjs` con `vista=evaluaciones` y `vista=preparacion` |
| 1 | **Sin compilar: lo que no es pantalla, con sus pruebas.** (a) Dominio: los textos con «toma» (C-58) y los nuevos; el nombre corto de una medición dentro de su familia, probado contra las 27 mediciones de pliegues, perímetros y diámetros del catálogo (`NOM:73-104`). (b) Website, función pura: las tomas en orden, los tramos de protocolo, lo que resume cada toma, las mediciones por familia en el orden del catálogo, la unidad común y «lo que cambió» por relación. (c) Website, función pura: la composición de la carga (imagen, sitios con las funciones de `FL`, tarjetas a los dos lados, guías), con la prueba «ningún sitio se mueve». (d) Tokens de la figura y sus pares en `CT` | `COPA`, `EVD`, `NOM` y sus pruebas; dos `.ts` nuevos en `ANT`; dos pruebas nuevas en `SC`; `TOK`; `CT`; `package.json` | Bajo | `npm test`. Romper a propósito un sitio y un tramo, y ver que la prueba lo dice |
| 2 | **Compilación 1: el marco del área, con el contenido de hoy adentro.** Franja, tres pestañas con ícono, `vista=preparacion` como estado de la página, «Actualizar» con hora, el aviso de éxito a nivel del área (para que «registrada» se vea) y la ayuda de la vista con lo que hoy está plegado. Evolución y Lámina quedan terminadas en este paso | `AN`, `PG`, `EVO`, `GEV`, `LA` (poco), la pieza del marco, `SEG\como-se-lee.tsx` (separar la cáscara), `CSS` | **Medio:** es una pieza que usan otras tres áreas y toca una del primer paquete | `typecheck`; compilar; las cuatro URL abren lo de siempre; `recorrido.mjs` completo (por `R:2374-2378` y `RC:945-960`) |
| 3a | **Compilación 2: Tomas (22) y una medición (29).** La lista entera, sin volver a leer en cada clic; el encabezado de la toma; las mediciones por familia; el panel con la historia, lo que cambió, y corregir y anular con su contenido de hoy. La guardia `CP:192-208` cambia en este mismo commit. Los cálculos siguen como están | `EV`, `CSS`, `CP` | **Alto:** se mudan dos escrituras que no se deshacen | `typecheck`; `npm test`; compilar; `ver.mjs` con `#clic:`; corregir y anular en el escenario descartable |
| 3b | **Compilación 3: los resultados.** Por categoría, los sin efecto a pedido, el detalle de un resultado con «Dejar como referencia» y «Calcular con un método» en el cajón | `CA`, `CSS` | Medio | Calcular un IMC y dejarlo como referencia en el descartable |
| 3c | **Solo si se elige (DEC-A1):** el protocolo de cada toma y las corregidas en la lista, leyendo los detalles | `EV`, la función pura | Medio: lecturas protegidas | Contar las lecturas al abrir, con `v.urls` |
| 4a | **Compilación 4: el marco de la carga (23), con los campos todavía en lista.** «‹ Tomas», el título con la cuenta, «Cambios sin guardar» o «Guardado», los botones arriba, «Datos de la toma» y «Fuera de la figura» a la derecha | `PR` | Medio: detectar cambios sin guardar es nuevo | Escribir, guardar, cambiar de protocolo, registrar |
| 4b | **Compilación 5: la figura de Dirección con los campos unidos a su sitio.** Perímetros y pliegues, mujer y hombre, con dato y sin dato por la forma, el foco, los errores, los cortes de 1280 y 1024 y la lista para pantallas angostas. Sale la silueta vieja | `PR`, un componente nuevo en lugar de `FG`, `CSS`, `TOK`; si se decide, `FA` y su prueba | **Alto:** geometría, orden del foco, contraste, y es la pantalla donde se cargan datos | La prueba de 1c; en pantalla, medir cada anillo contra `FL`; axe en los dos temas; teclado |
| 5 | **Mirar y medir, sin compilar.** Cinco anchos, dos temas; el panel, el cálculo y la carga abiertos; cada estado; fallas simuladas | — | — | `ver.mjs` con `#clic:`, `#falla:` y `#entrega:` (`H\ver.mjs:8-17`) |
| 6 | **Compilación 6: lo que salga de mirar,** las comprobaciones nuevas (§8.2) y borrar las clases que quedaron sin uso | `CSS`, `R` | Bajo | El modo nuevo del recorrido |
| 7 | **Una vez, al final:** la pasada completa de los recorridos sobre datos recién generados, y la CI | — | — | — |
| 8 | **Documentos.** `GUIA`: II.9 entera, II.3 (las migas de área), II.8 (piezas), II.1 y la fila de `:959` si se decide DEC-A20, y la Parte V. La definición y la aceptación del segundo paquete. `SC\auditoria-accesibilidad.mjs:118`, que espera las pestañas viejas | Documentos | Bajo | — |

**Aparte, con su propio riesgo:** «Evaluación en preparación» en los pendientes del Espacio profesional (`CAR:153, 164, 178`). E-84 dejó dicho que cambia junto con C-58 (`WP:224`). Toca `SC\espacio-profesional.test.mjs:152`, `DOM\cartera.test.ts:67-68`, `R:3442, 3585` y la cartera simulada: es de la parte 5 del primer paquete. Conviene un commit propio.

Si el plazo corta después del paso 3b, «Tomas» queda completa y la carga sigue funcionando como hoy dentro del marco nuevo. No conviene cortar entre 4a y 4b: la carga quedaría sin figura.

## 7. Comportamiento que hay que conservar

**Sesión, permisos y acceso**
- Sin sesión, a «Iniciar sesión» con retorno a `/pro/advisees/anthropometry?id=…` (`AN:82`). El retorno guarda solo el `id` (`LIB\copy.ts:24, 34-43`; `SC\retorno-seguro.test.mjs:21-22, 32`): `vista` se pierde, como hoy.
- 404 es «no hay nada que mostrar», con el mismo texto para lo ajeno y lo inexistente (`AN:56-66`).
- Una escritura denegada retira el contenido de toda la pestaña (`AN:90-95`; `EV:300, 311`; `CA:129, 262`; `PR:314, 354`).
- Solo carga el profesional, y cada uno ve solo sus tomas (`EVS:260`).

**Lo que no se puede hacer, y la pantalla no ofrece**
- Una toma registrada no se edita ni se le agregan mediciones; nada se borra; una medición anulada no se corrige ni se reactiva (`EV:337`; `MES:65-68`); una corrección conserva la unidad (`EV:294, 397`; `MES:70-80`).
- No existe «descartar el borrador». No se agrega.

**La carga**
- Guardar y registrar son dos actos. Registrar guarda antes lo que está en pantalla (`PR:296-357`), pide confirmación y, si al guardar quedó vacía, no registra y lo dice (`PR:343-349`).
- El momento, el protocolo y el origen son de la toma, no de cada guardado (`PR:174-181`).
- Un campo vacío no es un error y no se guarda (`PR:286-288`). Coma o punto decimal; «1.850» se rechaza por ambiguo, con su aviso propio (`PR:249-250`; `DOM\formato-numeros.ts:67-85`).
- Cambiar de protocolo no pierde nada: lo que el nuevo no declara, o declara en otra unidad, pasa a «fuera del protocolo» (`PR:215-235`). La unidad nunca se convierte.
- La figura no recibe los valores (`FA:147-155`; `PR:238-239`).
- Una clave de intento por escritura (`LIB\intento.ts:18-38`); el borrador viaja con su versión (`PR:310`).

**Reglas de BE**
- Ubicar, nunca calificar: todos los sitios del mismo color; ningún rango ni semáforo.
- Los cálculos conviven: sin promedio, sin «mejor», en el orden del catálogo (`LAM:593-595`); la referencia es un acto del profesional.
- El titular de una medición es el valor que rige; si la cadena no se resuelve, no se inventa uno (`EV:323-328`).
- Un resultado, con los decimales que declara su método (`CA:138-142`).
- «Sin calcular» y «Sin dato» no son cero. Una falla no es «todavía no hay tomas».

**Accesibilidad**
- «Saltar al contenido», un `h1`, foco visible, 44 px en cada objetivo.
- El orden del documento es el que se ve. En la carga, el orden del foco (DEC-A15).
- Cada anillo dice su estado por la forma; el dibujo es decorativo y los campos, con su rótulo, son el camino del teclado y del lector de pantalla (`M23:80`: el dibujo va oculto para el lector).
- Con los nombres cortos hay dos «Antebrazo» y dos «Pantorrilla» (un pliegue y un perímetro de cada uno: `SC\catalogo-antropometrico\catalogo-perfil-completo.cjs:18-19, 25, 31`): el nombre accesible es el completo.

**Enlaces y parámetros**
- `id`, `vista` (`evaluaciones`, `preparacion`, `evolucion`, `lamina`), `evaluacion` y `volver` quedan como están.
- Se navega con `router.replace` y `next/link` (`AN:85-89`): recargar cierra la sesión.

## 8. Las pruebas y los recorridos que tocan estas pantallas

### 8.1 Lo que hoy las toca

| # | Dónde | Qué mira | Qué protege | Con lo nuevo |
|---|---|---|---|---|
| 1 | `CP:192-208` | `ANT\evaluaciones.tsx`, la clase `medicion__fila` y `effectiveMagnitude` | El renglón muestra el valor que rige | **Falla** si cambia el archivo, la clase o la expresión. Se adapta en el mismo commit, apuntando al renglón y al titular del panel |
| 2 | `CP:51-61, 102-115` | Todos los `.tsx` de `ANT`: con texto, y sin términos de `COPA:298-317` | No calificar; un hueco no es un valor | Un archivo nuevo sin textos falla. «normal», «puntaje» y «diagnóstico» afirmado, también |
| 3 | `CP:177-180` | El detector de «diagnóstico» y su negación | La prueba de la prueba | No cambia |
| 4 | `DOM\dominio-wp05.test.ts:372-397` | Todo `COPA`, y cuatro expresiones fijas en tres textos (`COPA:125-126, 130, 143`) | Anular no es borrar; sin dato no es cero | Los textos nuevos de `COPA` pasan por ahí. Esos tres textos no se tocan |
| 5 | `DOM\evolucion-antropometrica.test.ts:255-260` | Todo `COPY_EVOLUCION` | Sin términos prohibidos | Cambiar «evaluación» por «toma» en `EVD:280-297` pasa |
| 6 | `CT:114-120, 238-246` | Los cuatro tokens de la silueta, a 3:1 | Los puntos de la figura se ven | Si salen esos tokens, salen los pares y entran los nuevos (DEC-A17) |
| 7 | `CT:343-371` | Ningún color literal en `apps\web\src` | Todo color se puede medir | Los de la maqueta no se pueden copiar (1.9) |
| 8 | `SC\figura-de-lamina.test.cjs:18-36` | La huella de los seis PNG, también en `apps\web\public\figura` | Los sitios caen sobre el cuerpo | No se toca ninguna imagen |
| 9 | `DOM\figura-antropometrica.test.ts:89-120` | La silueta vieja: qué dibuja, que no recibe valores, que cada sitio cae adentro | Ubicar, nunca calificar | Si sale `SITIOS_DE_LA_FIGURA`, esas tres pruebas se reemplazan por las de la figura nueva. Las cinco del protocolo (`:17-87`) siguen |
| 10 | `SC\composicion-de-la-figura.test.mjs:44-53` | La figura de la APK | Ningún sitio se mueve | No se toca. Es el modelo de la prueba nueva |
| 11 | `R:2124-2149` | Las tarjetas del Resumen: destino a `/pro/advisees/anthropometry?` y la acción «Preparar una toma» | E-49 | Pasa, si la ruta sigue |
| 12 | `R:2372-2380` | El destino de «Preparar una toma»: `…anthropometry?id=…&vista=preparacion&volver=` | E-56 | Pasa, si `vista=preparacion` sigue (1.5) |
| 13 | `R:3441-3446, 3585` | Los textos y destinos de los pendientes | Parte 5 | Cambian solo si se toca la cartera (§6, «aparte») |
| 14 | `SC\espacio-profesional.test.mjs:152, 168` | «Evaluación en preparación desde el 25 sept» y la ruta con `vista=preparacion` | Parte 5 | Lo mismo |
| 15 | `RC:867, 1636` | Negativas: sin acceso, el Resumen no dice «Preparar una toma» | Acceso parcial y revocación | No cambian: son de la ficha |
| 16 | `R:4544` | El panel de la ficha muestra la toma con «Reportado» | PRO-10 | Es `SEG\registro-original.tsx:162-203`, no la pestaña. No cambia |
| 17 | `PGS:41` | Captura las cuatro vistas y mide el alto | Nada: es el antes y el después | Sigue: las cuatro URL existen |
| 18 | `SC\auditoria-accesibilidad.mjs:118` | Las pestañas «Evaluaciones», «En preparación» y «Evolución» | Axe; está fuera de la CI y vieja (`WP:288`) | Se corta. Decidir con el resto del guion |
| 19 | `REPO\EVIDENCIA\PULIDO-0.13.2\web\candidata\herramientas\capturar-candidata.mjs:135-141` | `.tomas__fecha`, `.tomas__toma[aria-current]`, `.lamina__svg` | Nada: capturas del 3/10 | Queda vieja; no es reproducible tal cual (`EA\relevamientos\pruebas-y-evidencia.md:138`) |
| 20 | `R:142-153` y `RC:124-135` (`quieto`) | Espera que no queden pedidos en vuelo ni ningún `.cargando` | Que no se mida a medio cargar | `Cargando` lleva esa clase (`COMP\estados.tsx:17`); el bloque de estado en «cargando», no (`COMP\estados.tsx:58`): ahí el recorrido espera solo por los pedidos |

**Ningún recorrido abre hoy una pestaña de Antropometría para comprobar algo.** No hay nada que adaptar adentro: hay que escribirlo. Y no hay ninguna comprobación negativa sobre estas pantallas.

`SEG\registro-original.tsx:45-46` dice «Ver en Antropometría · Evaluaciones»: cambia la palabra. No encontré ninguna comprobación que lo fije.

### 8.2 Comprobaciones nuevas que conviene escribir

Lo esperado, a mano desde la API con la sesión de la página.
- **La lista:** tantas tomas como la API (leída entera), en orden de fecha de la toma; abre la más reciente; cada renglón con su fecha y sus cuentas.
- **Elegir otra toma:** la URL lleva `evaluacion=`, no sale ninguna lectura de la lista y la pantalla no pasa por «Cargando…».
- **El valor que rige, en pantalla:** la cintura del escenario dice 90,5 cm y «Corregida»; el bíceps, «Anulada», atenuado, y su panel no tiene acciones.
- **Negativa con su positiva:** en la lista no hay ningún «Corregir» ni «Anular»; en el panel están los dos.
- **El panel:** se abre con el foco en el título; Escape lo cierra y devuelve el foco al renglón; la historia tiene el original y la corrección con su motivo.
- **Corregir, en el descartable:** sale un solo `POST`; el panel muestra la corrección; los resultados que usaban la medición aparecen con su «antes», igual a la corrida reemplazada según la API.
- **Anular:** «Anulada», sin acciones; el resultado que dependía queda «Sin efecto» y dice que no se recalculó, sin un cero.
- **Los resultados:** por categoría y en el orden del catálogo; cada uno con los decimales que declara su método; «Ver N anteriores» solo si N > 0.
- **La carga, medida:** cada anillo está donde lo pone `anilloEnLaLamina` sobre la caja real de la imagen, con medio píxel de margen; en mujer y en hombre; en perímetros y en pliegues.
- **Con dato o sin dato:** escribir un valor cambia la forma del anillo (no el color), sube «1 de 13» y aparece «Cambios sin guardar»; al guardar, «Guardado», y el pedido lleva lo escrito.
- **El teclado:** el foco recorre los campos en el orden decidido.
- **Un número ilegible:** el aviso lleva al campo, aunque esté en la otra familia.
- **Registrar:** el diálogo, y al confirmar vuelve a «Tomas» con la toma nueva abierta y el aviso a la vista.
- **Fallas simuladas en la lista** (429, 503, sin red): el motivo, y nunca «Todavía no hay tomas».
- **Axe, en los dos temas:** Tomas, el panel, el cálculo y la carga en sus dos familias.
- **Sin desborde** a cinco anchos, y la primera pantalla medida, informada.
- **Las lecturas al abrir «Tomas»,** contadas, con un tope.
- **Prueba de la prueba** de cada medición nueva.

### 8.3 Dónde escribirlas

- Una función propia dentro de una sesión que ya existe y un modo `antropometria`, como se hizo con `espacio` (`MOD:432`): el límite es de cinco inicios de sesión cada quince minutos (`MOD:38`).
- Corregir, anular, calcular y registrar escriben: van en el escenario descartable, que no comparte datos con los otros recorridos (`WP:238`).

## 9. Tamaño

| Archivo | Líneas hoy | Qué le pasa **[estimo]** |
|---|---|---|
| `AN` | 123 | Se reescribe la mitad: el marco, tres pestañas, la carga como estado, el aviso y «Actualizar» |
| `EV` | 434 | Se reescribe casi entero (85 %). Sobreviven las dos escrituras (`:284-315`, unas 35 líneas) y el orden de las tomas |
| `CA` | 408 | La lista y la corrida (`:30-206`), a la mitad. `NuevoCalculo` (`:211-408`) cambia de caja y casi nada más |
| `PR` | 596 | La lógica (`:45-380`, unas 335 líneas) queda, con unas 30 nuevas para los cambios sin guardar. El dibujo (`:382-595`, unas 215) se reescribe entero |
| `FG` | 115 | Se reemplaza: sale la silueta |
| `EVO`, `GEV` | 106 y 408 | Piel: la ayuda se muda y cambia una palabra (menos de 5 %) |
| `LA` | 598 | Piel: la ayuda y conservar la toma entre pestañas (menos de 5 %) |
| `LD`, `LDE` | 1.078 y 84 | No se tocan |
| `PG` | 24 | Una clase |
| Nuevos | — | El panel de una medición, unas 220 líneas; el detalle de un resultado, unas 120; la figura con campos, unas 250; dos funciones puras, unas 320 entre las dos; sus pruebas, unas 300; el marco del área, unas 160, compartido |
| `CSS` | 6.153 | Salen unas 400 líneas (`:1443-1676` y `:2260-2432`, menos lo que usan otras pantallas) y entran unas 550 |
| `COPA` | 337 | Unas 30 cadenas cambian o entran |

Por pantalla **[estimo]**: la 22 con la 29, unas 900 líneas nuevas o reescritas; la 23, unas 650; el marco, Evolución y Lámina, unas 250. En total, cerca de 1.800 líneas de pantalla, 550 de estilos y 300 de pruebas, sin contar los recorridos.

## 10. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-A1 | El protocolo y las «corregidas» de cada toma en la lista, que no llegan | Leer el detalle de las tomas listadas (hasta las 20 más recientes, de a tres) y marcar los tramos cuando llegan; con más, decir hasta dónde se leyó. Con cinco tomas son seis lecturas al entrar y ninguna al cambiar de toma (hoy, tres por clic). Pedir aparte la ampliación (3.1), que saca esas lecturas | La lista como hoy, sin protocolo, hasta que la API lo traiga: no cuesta lecturas y deja C-64 sin hacer |
| DEC-A2 | Cómo se agrupa | Por **tramo consecutivo** del mismo protocolo, en orden de fecha: muestra dónde cambió y los renglones no cambian de lugar cuando llegan los detalles. Con el asesorado A: Perfil, Laboratorio, Perfil | Un grupo por protocolo, como la maqueta: la toma de laboratorio (D-40) quedaría debajo de la de D-82 |
| DEC-A3 | El marco del área | Una pieza común con un solo dueño, antes que las pantallas. El enlace a la ficha, siempre: «Volver a la ficha, donde estabas» con `volver` e «Ir a la ficha» sin él. Las áreas, nombradas (E-10) | Que cada área arme el suyo |
| DEC-A4 | Hasta dónde llega «Tomas» | Pestaña, textos de `COPA` y de `EVD`, y el enlace de la ficha. La cartera, en un commit aparte. Las claves de URL y de los pendientes no cambian | Solo la pestaña: «evaluación» seguiría mezclada |
| DEC-A5 | Qué va a la URL | La toma elegida, en `evaluacion=`, que ya existe. La medición abierta y el cajón, no: son de la visita (como E-25 y E-95) | Un parámetro nuevo para la medición |
| DEC-A6 | Dónde se abre la 29 | Cajón modal, como la maqueta | Una tarjeta al costado sin velo: la toma ya ocupa ese lugar |
| DEC-A7 | «Lo que cambió con la corrección» | Por relación, desde las corridas, para la corrección que rige; con una corrida sin sucesora, el texto de `COPA:63`. Si la entrada no trae su valor, no se atribuye y se dice | Mostrarlo solo recién hecha la corrección, con la respuesta: al volver a abrir no estaría |
| DEC-A8 | El detalle de un resultado | En el mismo cajón | Desplegado debajo del renglón, como hoy |
| DEC-A9 | «Calcular con un método» | En el cajón | En el lugar, como hoy: empuja las mediciones |
| DEC-A10 | El orden de las familias | Uno solo, el del dominio (`FA:16`), en la toma y en la carga; dentro, el del catálogo. Las columnas ubican; el documento sigue ese orden | El orden en columnas de la maqueta |
| DEC-A11 | Los nombres cortos | Una función del dominio, con prueba: saca «Pliegue», «Perímetro» o «Diámetro» y su preposición; lo que no es del catálogo queda entero. El nombre accesible, el completo | Una tabla a mano en la pantalla |
| DEC-A12 | La unidad una vez por familia | Solo si todas sus mediciones la comparten; para el lector de pantalla, cada valor con su unidad | Siempre en cada fila |
| DEC-A13 | La toma en preparación, vista desde «Tomas» | Leer los borradores al abrir (una lectura más). Si hay uno, el botón dice «Seguir con la toma en preparación» y cuántas mediciones lleva | No leerlos: «Preparar una toma» abriría una toma ya empezada, sin avisar |
| DEC-A14 | Los pliegues sobre la figura | Dibujarlos antes de programar y mostrárselos a Dirección: es la mitad de la pantalla y no está en la maqueta. Punto de partida: los grupos del compositor (`FL:478-484`), el del tronco bajo a la derecha y los demás a la izquierda, con «posterior» en tríceps y subescapular | Programar con la regla escrita y corregir mirando |
| DEC-A15 | El orden del foco en la carga | El del protocolo. En perímetros coincide con los grupos: arriba a la derecha, brazo, cintura, pierna | Por columnas: primero toda la izquierda |
| DEC-A16 | «Figura» | El orden y el arranque de la Lámina y de la APK («Hombre · Mujer», Hombre). No se guarda; se recuerda durante la visita, también al pasar a la Lámina | El orden de la maqueta |
| DEC-A17 | Los colores de la escena | Tokens nuevos, medidos: el anillo a 3:1 o más sobre la escena en los dos temas; en Claro, un azul más profundo que el de la maqueta. Fondo plano. Declarar los pares en `CT` | Los colores de la lámina, desde el dominio: no los mide ninguna prueba y en Claro no llegan |
| DEC-A18 | El estado y los botones de la carga | Arriba, y pegados al desplazarse. Un solo botón lleno: «Guardar» si hay cambios o no hay borrador; «Registrar toma» si está todo guardado. Avisar antes de salir con cambios sin guardar | Como la maqueta, sin pegar |
| DEC-A19 | El error de un campo sobre la figura | Debajo de su fila, que crece; las tarjetas se vuelven a apilar | En un renglón aparte, debajo de la escena |
| DEC-A20 | Por debajo de unos 900 px | Los campos en lista, por familia, sin escena. Sacar de la guía la regla de 390 px para esta pestaña | Sostener la regla de 390: pide otra composición para el teléfono |
| DEC-A21 | La silueta vieja | Sacarla del website y del dominio, con sus tres pruebas, cuando la figura nueva esté probada | Dejarla en el dominio sin uso |
| DEC-A22 | Datos para ver las pantallas como en la maqueta | En el escenario descartable: una toma con el perfil completo, cinco o seis cálculos, una corrección hecha por la API y una toma en preparación a medio cargar | Una respuesta simulada, dicha como tal |
| DEC-A23 | «Guardar» | Sin ícono | Con el señalador: un dibujo con dos significados |
| DEC-A24 | Los rechazos que hoy se dicen «servicio no disponible» | Traducir los tres de estas pantallas (`CORRECTION_NOT_ALLOWED`, `UNIT_NOT_COMPATIBLE` y la fecha futura), como hace Información (`ADV\forms\pedir.tsx:31-35`) | Dejarlo anotado como defecto de antes |

## 11. Lo que no pude determinar leyendo

- **Cómo se ve.** Ningún alto ni ancho de lo nuevo está medido: salen de las medidas de la maqueta.
- **Si los nombres largos entran** en una fila de 48 px con la tarjeta de 292 («Brazo flexionado y contraído»), y qué pasa a 1280.
- **El contraste real del anillo sobre el maniquí.** Lo calculé sobre el color de la escena; la imagen no es un color plano.
- **Cómo quedan los pliegues:** once puntos, dos pares casi encimados y dos posteriores. No hay dibujo.
- **Qué va a hacer con el marco del área quien lleve Nutrición y Entrenamiento.**
- **Si quedó documentado el origen de las figuras del compositor** después de `DL:1655`.
- **Si la base de prueba tiene corridas reemitidas, o tomas con mediciones de más de un protocolo.** Leí los generadores, no la base.
- **Cuánto tardan las lecturas de detalle** que pide DEC-A1.
- **Si `auditoria-accesibilidad.mjs` anda hoy.**
- **Si a 1024 el campo de fecha nativo entra** en la columna de datos angostada.
- **El lector de pantalla:** cómo anuncia una fila cuyo dibujo está oculto, y si el orden del foco se sigue. No se puede saber leyendo.
- **Qué quiere Dirección** con la figura que arranca elegida, con los tramos de la lista y con la regla del teléfono. Las maquetas están validadas por confianza, no pantalla por pantalla (`WP:9-10`).
