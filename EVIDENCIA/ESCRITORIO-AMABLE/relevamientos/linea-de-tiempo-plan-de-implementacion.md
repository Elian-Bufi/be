# Línea de tiempo · plan de implementación (solo lectura: no compilé ni ejecuté nada)

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `SEG` = `REPO\apps\web\src\app\pro\advisees\seguimiento` · `ADV` = `REPO\apps\web\src\app\pro\advisees`
- `LT` = `SEG\linea-de-tiempo.tsx` **del árbol de trabajo** (918 líneas) · `LT@HEAD` = el mismo archivo en `3d2a188` (454 líneas)
- `RO` = `SEG\registro-original.tsx` · `HR` = `SEG\hecho-en-un-renglon.ts` · `CSS` = `REPO\apps\web\src\app\globals.css`
- `DOM` = `REPO\packages\domain\src` · `DLL` = `DOM\dia-de-la-linea.ts` · `API` = `REPO\apps\api\src` · `LAPI` = `API\analisis\lectura-linea-de-tiempo.ts` · `CTRL` = `API\analisis\analisis.controller.ts`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` (cuerpo en `MQ\partes\02-cuerpo.html`; estados en `19-cuerpo.html`)
- `R` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\recorrido.mjs` · `RC` = `…\herramientas\recorrido-comprension.mjs`
- `CRIT` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `…\diseno\iconos\CATALOGO.md` · `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md`
- `ACE-PRO`, `ACE-CP`, `ACE` = los `ACEPTACION.md` de `EVIDENCIA\DASHBOARD-PROFESIONAL`, `DASHBOARD-COMPRENSION` y `ESCRITORIO-AMABLE`

**La implementación se escribió mientras yo leía.** Empecé con el árbol limpio en `3d2a188`; miré el estado cinco veces y cada vez había más. Lo último que vi, sin confirmar en git:
- nuevos: `DLL` (284 líneas) y su prueba (279), `HR` (102) y `REPO\scripts\hecho-en-un-renglon.test.mjs` (141);
- modificados: `LT` (+650 −186), `CSS` (+486 −50), `SEG\como-se-lee.tsx` (la ayuda de la línea), `RO`, `SEG\analizar.tsx`, `contexto.tsx`, `resumen.tsx`, `ADV\workspace.tsx`, `DOM\index.ts` y `REPO\package.json`;
- **sin tocar:** `R`, `RC`, `GUIA`, `WP`, `ACE` y la API.

Por eso este documento no es un plan previo: dice qué quedó escrito, lo contrasta con lo que BE entrega y con lo que los recorridos miran, y deja lo que falta. Leí enteros `DLL`, su prueba, `HR` y `LT`; del `CSS` nuevo, la estructura (columnas, cortes de ancho, desplazamiento); de la ayuda, el texto. Las líneas que cito de esos archivos son las del árbol de trabajo en la última lectura y pueden haberse corrido: al cerrar este documento `LT` ya tenía 922 líneas (cuatro más, todas después de la 472). Volví a mirar las de los puntos 1.3 y 1.10 (`LT:210, 256, 282, 392, 463, 472`): seguían igual.

Todo lo que afirmo sobre el código lo leí, con su línea. Donde deduzco o calculo sin haber medido, lo marco **[supongo]** o **[estimo]**.

## 1. Lo que condiciona el plan

1. **Los recorridos no se adaptaron, y `recorrido.mjs funcional` se corta en la línea de tiempo.** `R` termina el modo en la primera excepción (`R:3038-3040`) y la línea de tiempo está antes de Analizar (`R:602-706`). Sobre el DOM nuevo:
   - **Cortan el modo:** `R:628` (los chips de área están dentro de «Más filtros», cerrado: `LT:368-370`), `R:648-654` (ningún botón empieza con «Abrir registro»: `LT:647`), `R:655` (a 1440 el detalle es un `aside`, no un `dialog`: `LT:442`) y `R:674` (el botón de buscar salió de `.filtros-de-linea` y no tiene texto: `LT:346-362`).
   - **Fallan a la vista:** `R:612`, `R:704` y `R:970` leen «(\d+) hechos coinciden», y sin filtros ahora se escribe «N hechos en el período» (`LT:320`); arrastran PRO-04 y PRO-21. `R:616` (el `h3` del día trae ahora la fecha corta y la larga: `LT:612-618`). `R:618` («Carga tardía» pasó a «Cargado otro día»: `DLL:97`). `R:636` («Ver más» pasó a «Ver días anteriores»: `LT:433`). `R:1909` (la línea ya tiene ayuda).
   - **Pasan sin proteger lo que decían:** la parte de las áreas de `R:644` y `RC:552`, según los datos. El detalle está en §7.4.
   - Una pasada completa son 25 minutos: conviene sumarle a `R` un modo `linea` y correrlo solo antes (§5, paso 2).

2. **«Hitos» quedó con dos definiciones en la misma ficha.**
   - En `DLL:22-27` es todo lo que no es una comida ni una sesión: nueve tipos, **con la toma**. La ayuda lo dice así (`SEG\como-se-lee.tsx`, `DeLinea`).
   - En Analizar son ocho, sin la toma (`SEG\analizar.tsx:117`), y la capa se llama «Hitos (activaciones, objetivos, revisiones)» (`:501`). El pie dice «Hitos (N)» (`:602`).
   - Con la base de la parte 2, Analizar dibuja 11 (`ACE:159`). **[estimo]** El chip de la línea diría 19 para el mismo período (11 más las 8 tomas de `WP:186`).
   - Las maquetas ya traían el desacuerdo: «Hitos 10» en la 02 y «Hitos (4)» en la 03, la 05 y la 09 (`CAT:106`).
   - **Propongo** que Analizar lea `TIPOS_DE_HITO` y corrija su rótulo. `R:1548-1565` (E-31) compara las líneas con su lista, no con un número fijo: sigue pasando. §8, DEC-1.

3. **Dos defectos de antes siguen en el árbol** (leídos en el código; no los vi en pantalla).
   - **El registro de una activación dice «Versión 0».** Ni el detalle al costado (`LT:463`) ni el panel (`LT:472`) pasan `numeroDeVersion`; `RO:218, 230` usan `numero ?? 0` y `VersionSoloLectura` lo escribe (`ADV\nutrition\plan.tsx:202`). El número está en la entrada: detalle «Versión» (`LAPI:104`). Ya pasaba en `LT@HEAD:297`.
   - **«Actualizar» deja las tandas siguientes de la consulta anterior.** Vuelve a leer la primera página (`SEG\contexto.tsx:184`), pero las demás se guardan por `clave`, que no cambia (`LT:203-212`), y se pegan a la primera nueva (`LT:277`). Si entre las dos lecturas entró un hecho, uno se pierde. Contradice E-58 (`WP:192`: «vale para las tres vistas»). Arreglo: atar las tandas extra al `generatedAt` de la primera.

4. **Lo que la entrada decía y ya no se ve en ningún lado.** `DatosDelHecho` muestra los detalles de la entrada solo si el hecho no tiene registro propio (`LT:712, 771-780`). Para una comida, una sesión, una toma o una activación, la fila muestra un dato (`HR:35-73`) y el resto queda en manos del registro de origen, que no lo dice todo:

   | Detalle de la entrada | Dónde lo arma la API | ¿Lo dice el registro de origen? |
   |---|---|---|
   | «Frente a lo indicado: Distinta de lo indicado en 2 de 4 ingredientes» | `LAPI:182` | La tabla, sí; la frase del dominio, no (`ADV\nutrition\detalle-de-registro.tsx:145-173`) |
   | «Rigió hasta: 4/9/2026» (una activación) | `LAPI:106` | No |
   | «Resultados de métodos», «Mediciones corregidas», «Mediciones anuladas» (una toma) | `LAPI:376-378` | No como cuenta (`RO:176-198` las muestra una por una) |
   | «Plan: versión 2» | `LAPI:189, 255` | Lo cubre la relación, que sí se lista (`LT:763-769`; `LAPI:198, 262`) |
   | «Calorías registradas», «Foto», «Observación», «Ejercicios», «Condición», «Protocolo» | `LAPI:184-188, 250-254, 375` | Sí |

   Y **la búsqueda sigue mirando todos los detalles** (`DOM\linea-de-tiempo.ts:168`): puede traer una fila que no dice a la vista por qué coincide. Propuesta: en el detalle, todos los detalles que la fila no mostró, para cualquier hecho (DEC-6); y con texto buscado, que la fila diga dónde coincide (DEC-8).

5. **Textos: lo que quedó, contra lo que BE escribe.**

   | La maqueta dice | BE escribe | Dónde | Cómo quedó |
   |---|---|---|---|
   | «Peso 77,9 kg» · «Medido» en la fila de la toma | No llega en la entrada | `LAPI:372-379` | Bien: «N mediciones» (`HR:53`). Se puede traer con una lectura más: DEC-7 |
   | «Corregido» · «Se corrigió» (en una comida) | «Rectificado» | `LT@HEAD:84, 100`; `LAPI:196`; `R:624` | Bien: `DLL:95`, `HR:97` |
   | «Lo que aporta, con las cantidades que informó» | «Estimación de lo consumido»; sin cantidades, «Macros sin calcular» | `DOM\copy-recetas.ts:145, 192` | Bien: quedó el componente del dominio (`LT:463`). La frase de la maqueta **es falsa** con las porciones del plan confirmadas |
   | «Distinta en 2 de 4.» | «Distinta de lo indicado en 2 de 4 ingredientes» | `DOM\contraste-de-comida.ts:122` | No se ve (punto 4) |
   | «7 series» | «Series con datos: 7» | `LAPI:251` | `HR:50` escribe «7 series». Son las que tienen algún dato, no las de la sesión: DEC-10 |
   | «Sesión A · Tren inferior» | «Sesión registrada · A · Tren inferior» | `LAPI:248` | `HR:50` antepone «Sesión». La etiqueta la escribe el profesional: si ya empieza así, queda «Sesión Sesión A». La prueba no tiene ese caso (`scripts\hecho-en-un-renglon.test.mjs:75`) |
   | «Porciones del plan» | «las del plan, confirmadas»; «Confirmó las porciones del plan» | `LAPI:62`; `DOM\contraste-de-comida.ts:109` | `HR:42` usa la corta, con el respaldo de `CAT:107`. En el dominio esas palabras ya nombran lo previsto (`DOM\copy-recetas.ts:177`): que el nombre accesible diga «confirmó» |
   | «Cantidades informadas» | «informadas a mano» | `LAPI:62` | Bien: es la forma corta de `CRIT:376-377` |
   | «Cargado otro día» | «Carga tardía» | `LT@HEAD:328` | Etiqueta nueva (`DLL:97`). El filtro y su chip siguen diciendo «carga tardía» (`LT:879, 894`): unificar |
   | La toma, con la marca de hito | Hito: activaciones, objetivos, revisiones | `SEG\analizar.tsx:117, 501` | Punto 2 |
   | «Esperá unos segundos y probá de nuevo» (pantalla 19) | «Esperá un minuto y reintentá.» | `SEG\contexto.tsx:121` | Bien: quedó el de BE (`LT:388`). El de la maqueta **es falso**: el límite es por minuto (`R:147`) |
   | «Ningún hecho coincide con estos filtros» · «Quitar los filtros» (19) | «Ningún hecho coincide con los filtros.» · «Limpiar filtros» | `LT@HEAD:268, 278` | Quedaron los de hoy (`LT:396, 399`): `R:667, 702` siguen encontrando el botón |

   **Un ícono fuera del catálogo:** `HR:85` pone los cubiertos (`comida`) en «Comida diferente». `CAT:119` reserva `desvio` para «una comida diferente o una sesión con cambios», el mismo en las dos áreas, a propósito; los cubiertos son «cada comida del plan» (`GUIA:206`). DEC-9.

6. **Punto de atención: «Distinto de lo indicado» junta lo comprobado con lo declarado.** `DLL:261` suma `SESSION_WITH_DEVIATION`. En una comida, la diferencia la comprueba BE, ingrediente por ingrediente. En una sesión, «con cambios» es la condición que eligió la persona (`LAPI:234`): una sesión «Realizada» con series distintas de lo indicado no entra, y una «con cambios» puede tener las cargas iguales. `queTrae` lo dice bien (`DLL:259`) y la ayuda lo repite; el nombre del chip, no. La cuenta es exacta (los dos rasgos son de áreas distintas). DEC-2.

7. **El detalle al costado: cinco cosas para mirar en pantalla.**
   - **La carrera está resuelta** donde hacía falta: `key` en `LT:463`. `DetalleDeRegistroDeComida` no descarta una respuesta tardía (`detalle-de-registro.tsx:68-77`); sin la `key`, pasar de una comida a otra podía pintar la primera. Falta su comprobación (§7.5).
   - **La columna no está reservada.** Aparece al elegir (`LT:411`; `CSS:3037-3047`): la lista se angosta, las filas pueden partirse y lo de arriba cambia de alto. `R:662-664` exige la misma posición al cerrar: se cumple, pero al abrir la fila tocada puede moverse. DEC-3.
   - **Se pega y tiene su propio desplazamiento** (`CSS:3264-3268`). Es una excepción a «sin doble desplazamiento» (`GUIA:238-239`), la misma que ya tenía el panel (`CSS` de `.dialogo--panel`). Hay que escribirla en la guía. `RC:305-313` lo mide con el detalle cerrado: no lo ve. DEC-4.
   - **Escape cierra solo con el foco adentro del detalle** (`LT:446-450`). Al abrir, el foco va al título (`LT:294-296`): el camino de `R:660` funciona. Con el foco de vuelta en la lista, Escape no hace nada.
   - **Un grupo con una comida elegida no se puede cerrar** (`LT:423`): el botón cambia su estado y el grupo sigue abierto. Al cerrar el detalle, el grupo se cierra solo si se lo había cerrado, y el foco vuelve a una fila oculta (`LT:300`).
   - El corte es `75rem`, 1200 px (`LT:83`); su comentario dice «1280 px y más». `CRIT:248` pide el detalle encima a 1024: se cumple.

8. **Qué sale de `periodCounts` sin lecturas nuevas** (lo que preguntaste).
   - **Sale:** «Todo», «Hitos», «Distinto de lo indicado» y «Sin confirmar». `periodCounts` se calcula sobre todas las entradas autorizadas del período, antes de todos los filtros, también del texto buscado y de `since` (`CTRL:145`; lo comprueba `REPO\test\integration\analisis.int-spec.ts:162`). La cuenta coincide con lo que lista el filtro: ni `conteosDelPeriodo` ni `cumpleFiltros` miran el estado (`DOM\linea-de-tiempo.ts:170-185, 254-268`), y `DOM\dia-de-la-linea.test.ts:240-254` lo fija.
   - **No sale con `novedades` activo:** ahí la consulta es de otra ventana, un año (`LT:178`). Ya está resuelto con una lectura aparte de un solo hecho (`LT:226-235`). Cuesta un pedido más: la medición de `RC:1462` va a decir cuatro, no tres (`ACE-CP:57`).
   - **«Lo nuevo desde la revisión» no lleva número,** como en la maqueta (`MQ\partes\02-cuerpo.html:56`): pediría una lectura con `since` por área. Elegido, su número es el `totalMatching` (`LT:321`).
   - **El agrupado por día sale de la página,** sin otra lectura: cada comida trae fecha, estado, rasgos y carga tardía. La página corta por cantidad (50, el máximo: `API\analisis\consultas.ts:110`), así que del último día pueden faltar las comidas más tempranas. Lo resuelve la retención (`DLL:195-197`; `LT:278`).
   - **Una página alcanza para una semana:** 330 hechos en 90 días (`CRIT:17`) son 3,7 por día; 50 hechos, unos 13 días **[estimo]**.

9. **Medidas.** La maqueta está dibujada a 1440 × 960 (`MQ\generar.mjs:23`), con una barra de 56 px y un marco de 116 (`MQ\plano.css:89, 99, 104`): los días empiezan a los 293 px. En el producto, la barra mide 65, el marco 143 y el aire 20 (`ACE:36, 77-79`): el contenido empieza en 228 y los días, cerca de los 328 **[estimo]**. Son 36 px más abajo en una ventana 60 px más corta.
   - Con las medidas de la maqueta (`MQ\partes\02-cuerpo.html:8-25`), un día liso ocupa unos 54 px y una tarjeta de dos renglones, 106 **[estimo]**.
   - La semana más reciente del asesorado A terminaría cerca de los 872 px **[estimo]**: entra en 900 con unos 30 px de margen. Es el margen que falló en E-55 (`ACE:423-431`). A 1280 la fila de vistas baja un renglón y la semana no entra **[estimo]**.
   - La primera tanda mediría cerca de 1.300 px **[estimo]**, contra 10.728 (`REPO\EVIDENCIA\ESCRITORIO-AMABLE\parte-0\alturas-antes.json:58`). Ese número es anterior a la parte 1: el «antes» hay que medirlo con el marco de hoy, sobre `3d2a188`.
   - DEC-5 propone qué exigir.

10. **Filtros, URL y búsqueda: quedó bien; tres detalles.**
    - Los ocho parámetros siguen (`SEG\estado.ts:111-133, 288-291`). Una vista con nombre escribe `tipos` o `calidad` y reemplaza todo, también el texto buscado (`LT:264-267`).
    - `agrupar` se apaga con todo lo que recorta dentro del día (`LT:256`), también `tardias` y `plan`, que `DLL:172-173` no nombraba.
    - «Tipo de hecho» dice «Hitos (todos sus tipos)» o «Varios tipos (N)» en vez de «Todos» (`LT:820-828`).
    - **`plan` sigue sin control:** se lee de la URL y se quita con su chip (`LT:896`). `CRIT:63` lo lista en «Más filtros». DEC-13.
    - **Los días sin hechos** se dicen solo en «Todo» (`LT:282`) y entre días de la lista. No cubren los extremos: de hoy al primer día, ni del último al comienzo del período cuando ya no quedan tandas.
    - **El aviso de vista parcial se dice dos veces:** en el marco (`ADV\workspace.tsx:197-202`) y en la vista (`LT:392`). `CRIT:234` pide uno.

11. **La carga inicial está cuidada.** `LT` entra con la ficha (`ADV\workspace.tsx:45`); el panel, el contenido y el enlace van con `dynamic` (`LT:76-78`), y `HR` importa solo tipos. `R:1974-1984, 2403-2407` (E-54) lo comprueba.

12. **`MQ\partes\02-linea-de-tiempo.md` es de la versión 1** («Sin confirmar 9», columna «Plan»). Contradice al HTML: no usarlo. Fuera de esta parte: `…\herramientas\tiempos.mjs:70` mide la búsqueda con `q` en la URL, que la API rechaza con 400 (`API\analisis\consultas.ts:136-141`).

## 2. Región por región de la maqueta 02

### 2.0 Marco y esqueleto

| Región | Maqueta | Cómo quedó | Atención |
|---|---|---|---|
| Marco | «Cómo se lee esta vista» | Ayuda nueva, «Cómo se lee la Línea de tiempo», con trece renglones y «Qué trae cada vista (5)» plegado | `R:1905-1910` afirma que el botón no está |
| Cuerpo | Sin tarjeta que envuelva; dos columnas, `1fr 412px` (`MQ…02-cuerpo.html:7`) | `section.linea` sin tarjeta (`LT:325`); `.linea__cuerpo` de una columna, o `1fr` y de 24 a 30 rem con el detalle (`CSS:3037-3047`) | Punto 1.7 |
| Títulos | `h2` de la vista; fecha en un `p`; `h2` en el detalle | `h2` (`LT:327`), `h3` por día (`LT:612`), `h3` en el detalle (`LT:459`) | Bien: el día sigue en el árbol de títulos |

### 2.1 Cabecera y vistas

| Región | Maqueta (textos exactos) | Cómo quedó | Atención |
|---|---|---|---|
| Cuenta | «154 hechos en el período. Cada uno está en el día en que ocurrió.» | Igual, en `p[role="status"]` (`LT:316-330`). Con filtros: «N hechos coinciden, de M del período.» | Usa `numero`: desde 1.000 lleva punto. `R:612` y `RC:771` leen `(\d+)` y tomarían solo los últimos tres dígitos |
| Vistas | «Ver» · «Todo 154» · «Hitos 10» · «Lo nuevo desde la revisión ▾» · «Distinto de lo indicado 7» · «Sin confirmar 4» | Botones con `aria-pressed` y `data-vista` (`LT:481-495`); la cuenta, con «hechos» para el lector de pantalla. Volver a tocar la elegida deja «Todo» | Puntos 1.2 y 1.6 |
| «Lo nuevo desde la revisión» | Chip con flecha, sin cantidad | Con una sola área con revisión, actúa directo; con dos, despliega (`LT:501-572`). Sin ninguna, no está | No dibujado en la maqueta: mirar el desplegable en los dos temas |
| Buscador | Campo con lupa | `form.buscador-de-la-linea`; el botón es la lupa, con nombre «Buscar» (`LT:346-362`) | `R:674` |
| «Más filtros» | Botón | Botón con `aria-expanded` y la cantidad de filtros; abre áreas, tipo, ejercicio, estado, calidad y tardías (`LT:363-370, 788-884`). Se abre solo con una combinación a medida (`LT:313`) | `R:628` |
| Filtros activos | No dibujado | Solo con una combinación a medida o texto buscado (`LT:385, 886-918`). «Tipo: hitos» en vez de nueve chips | Bien |
| Aviso del corte | No dibujado | Igual que antes (`LT:372-383`) | `RC:770, 779` pasan |

### 2.2 Los días y las filas

| Región | Maqueta | Cómo quedó | Atención |
|---|---|---|---|
| Fecha | «27 sept» · «domingo» | Corta a la vista y larga para el lector de pantalla, sin año si es el año en curso (`LT:612-618`) | `R:616` |
| Día liso | Un renglón sin tarjeta | `data-novedades="no"` (`LT:611`; `DLL:206`) | Medir (punto 1.9) |
| Días sin hechos | No dibujado | «Del 5 al 9 oct: 5 días sin hechos registrados», solo en «Todo» (`LT:577-582, 605-610`) | Los extremos (punto 1.10) |
| Hito | Barra · ícono · nombre · dato · hora · flecha | `data-hito` y barra por CSS (`LT:646`; `CSS:3209-3214`) | La toma (punto 1.2) |
| Sesión | «Sesión A · Tren inferior» · «7 series» · hora | `HR:48-51`; sus rasgos, como etiqueta | Punto 1.5 |
| Grupo | «Comidas» · «4 registradas» · etiquetas · flecha | Botón con `aria-expanded`; adentro, las comidas ocultas con `hidden` (`LT:678-707`). Anuncia todos los rasgos, también los que la maqueta callaba | Bien. Cuenta todas, también las anuladas, y lo dice con su etiqueta |
| Comida | hora · nombre · opción · etiquetas · modo · flecha | `HR:37-47`; `LT:641-675` | La opción sale sin su número («2 · Tostadas…» pasa a «Tostadas…», `HR:40`) |
| Elegida | Contorno | `aria-current` (`LT:647`) | Bien |
| Hora | «8:40» | «08:40» (24 horas, `REPO\apps\web\src\lib\formato.ts:6`); «sin hora» si no tiene (`LT:644`) | Bien |
| Días anteriores | No dibujado | «Ver días anteriores» · «Se ven N de M hechos, hasta el…» (`LT:430-440`) | `R:636, 681` |

### 2.3 El detalle

| Región | Maqueta | Cómo quedó | Atención |
|---|---|---|---|
| Cabecera | «Detalle del registro» · «Cerrar» · título | Igual; el título, de `tituloDelHecho` (`LT:452-461`; `HR:76-80`) | Bien |
| Etiquetas | Área y rasgos | `LT:724-734` | Bien |
| Fechas | «Ocurrió» · «Se cargó» · «Se corrigió» | De la entrada, con el autor junto a «Se cargó» y el verbo según la relación (`LT:735-762`) | Una toma puede traer hasta 40 relaciones de medición (`LAPI:385-386`): son 40 renglones |
| Nota | «La corrección no mueve el hecho: sigue en el 24 sept.» | «Lo que se cargó o se corrigió después no mueve el hecho: sigue en el…» (`LT:770`) | Bien |
| «Lo que aporta» y la tabla | Tira de cuatro; tabla con la fila distinta en negrita | El componente de hoy: lista de cinco y tabla sin marcar | Es compartido con la pestaña Nutrición (E-02): no tocar acá |
| «…en el plan, versión 2» | Título de la tabla | La relación «Registrado sobre la versión 2 del plan» (`LT:763-769`) | Bien |
| Pie | «Ver en Nutrición · Registros» | `EnlaceAlArea`, con `volver` (`RO:102`) | Bien |
| Hito sin registro propio | No dibujado | Sus detalles, y debajo «Este hecho no tiene un registro propio…» (`RO:124`) | Esa frase sobra cuando ya se ven sus datos |

### 2.4 Estados (pantallas 15 y 19) y anchos

| Estado | Maqueta | Cómo quedó | Atención |
|---|---|---|---|
| Cargando, falla, sin acceso | Un bloque con ícono, qué pasó, por qué y qué hacer | Los de antes: `Cargando`, `ErrorConReintento`, un párrafo (`LT:387-389`) | No es el bloque de la pantalla 19. DEC-11 |
| Sin hechos | No dibujado | «No hay hechos registrados en este período.» y «No es un cero…» (`LT:406-408`) | Bien: `R:1022` sigue negando un texto que existe |
| Sin coincidencias | «…En el período hay 154 hechos…» · «Quitar los filtros» | `EstadoVacio` con «Hay N hechos en el período elegido.» y «Limpiar filtros» (`LT:395-404`) | Bien |
| 1280 | El buscador y «Más filtros», a un segundo renglón | Por `flex-wrap` **[supongo]** | Mirar |
| 1024 | El detalle, encima | `PanelDeRegistro` (`LT:472-474`) | `R:655` a 1024 |
| 768 y 390 | No se rompe | Hay un corte en `47.99rem` (`CSS:3362`) | `R:2813-2833` |

## 3. Qué dato llega y qué no

| Lo que pide el diseño | ¿Llega? | Dónde | Qué se muestra |
|---|---|---|---|
| Cantidad de «Todo», «Hitos», «Distinto», «Sin confirmar» | Sí | `periodCounts` (`DOM\contratos-analisis.ts:424-428`) | `cuentaDeLaVista` (`DLL:273`) |
| Esas cantidades con un corte activo | No en la misma respuesta | `LT:178` | Una lectura aparte (`LT:227`) |
| Cantidad de «Lo nuevo desde la revisión» | No, sin una lectura con `since` | `sinceCounts` (`:445-448`) | Sin cantidad |
| El corte de cada área | Sí, sin lectura | `panel…lastReview.recordedAt` | `LT:238-243` |
| Comidas del día y sus rasgos | Sí, de la página | `quality`, `state`, `recordedLate` | El grupo; el último día, retenido |
| Conteos por día | **No** | La API no los da | No hacen falta |
| Nombre de la comida y de la opción | Sí | Título (`LAPI:175`); detalle «Opción», con su número adelante (`LAPI:177`) | `HR:38-40` |
| Texto de una comida diferente | Sí | Detalle «Descripción» (`LAPI:178`) | Es texto de la persona: `overflow-wrap` en la fila |
| Modo de registro | Sí | `quality` (`LAPI:156-158`) | `HR:41-45` |
| «Distinta en N de M» | Sí, la frase | Detalle «Frente a lo indicado» (`LAPI:182`) | **No se muestra** (punto 1.4) |
| Macros de la comida y tabla por ingrediente | No en la entrada. Sí en API-ING-03 | `consumed`, `option.items`, `consumption.items` (`DOM\contratos-registro-de-comidas.ts:139-142`) | Al abrir el detalle: una lectura por registro |
| «Ocurrió», «Se cargó», «Se corrigió» | Sí, en la entrada | `occurredAt`, `recordedAt`, `relations[].at` (`LAPI:70-73, 196, 263`) | `LT:735-762`. Antes, el panel de una comida no decía «ocurrió» |
| Versión del plan del registro | Sí | Detalle «Plan» y la relación | La relación |
| Series de la sesión | Sí, si se registró por serie | Detalle «Series con datos» (`LAPI:251`) | «N series» |
| Peso de la toma y su clase | **No en la entrada.** Sí con una lectura más | API-PRJ-01 con `metric=peso`: cada punto trae `value`, `dataClass` y la toma de origen (`DOM\antropometria-del-analisis.ts:102, 112`), que es el `source.id` de la entrada (`LAPI:369`) | «N mediciones». DEC-7 |
| Número de versión de una activación | Sí | Detalle «Versión» (`LAPI:104`) | **No se pasa** al registro de origen (punto 1.3) |
| Autor | Sí, o `null` | `author` (`:409`) | Junto a «Se cargó» |
| Días sin hechos | Se deducen de las fechas leídas | `DLL:221-225` | Solo en «Todo» |

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Lo que había en `LT@HEAD` y dónde quedó

| # | Qué | Dónde estaba | Dónde quedó |
|---|---|---|---|
| 1 | «Lo que se cargó otro día lo dice; una corrección no es un registro nuevo.» | `LT@HEAD:171` | En la ayuda |
| 2 | Chips de área y lista de tipos, a la vista | `LT@HEAD:194-227` | En «Más filtros» (`LT:800-838`) |
| 3 | Estado, Calidad, tardías, Ejercicio | `LT@HEAD:377-419` | En «Más filtros», los cuatro estados enteros (E-03) |
| 4 | Botón «Buscar» y el ejemplo «cena o sentadilla» | `LT@HEAD:230-234` | El botón, con la lupa. **El ejemplo se fue:** no está en el campo ni en la ayuda |
| 5 | Filtros activos y «Limpiar filtros» | `LT@HEAD:424-454` | Igual, cuando hacen falta |
| 6 | «…; se ven M.» | `LT@HEAD:255` | Junto a «Ver días anteriores» |
| 7 | El área en palabras | `LT@HEAD:324` | Oculta a la vista, fuera de los grupos (`LT:651`); adentro de «Comidas» no está |
| 8 | Todos los detalles de la entrada | `LT@HEAD:330-339` | **Solo en los hechos sin registro propio** (punto 1.4) |
| 9 | «Registrado el… · autor» y las relaciones | `LT@HEAD:340-353` | En el detalle |
| 10 | La entrada anulada, con borde rayado | `CSS` de `.entrada--anulada` | `data-anulada` y la etiqueta «Anulado» con su ícono |
| 11 | «Ver más (N restantes)» | `LT@HEAD:287-294` | «Ver días anteriores» |
| 12 | El aviso de vista parcial | `LT@HEAD:264` | Sigue (`LT:392`), repetido con el del marco |
| 13 | El chip «Una versión de plan», sin control que lo ponga | `LT@HEAD:432` | Igual |

### 4.2 La maqueta lo muestra y BE no lo tenía

**Quedó hecho, con datos que llegan:** las vistas con nombre y su cantidad; el agrupado por día; el día liso; la marca de hito; las etiquetas con ícono; la fila que abre; la fecha corta; el detalle al costado con sus fechas; el registro elegido; «Más filtros» como botón; la lupa; la ayuda.

**No se hizo porque el dato no llega en la entrada:** el peso y la clase de la toma.

**La maqueta decía algo que en BE no es así, y quedó lo de BE:** «Corregido» en una comida; «Lo que aporta, con las cantidades que informó»; «unos segundos» en la falla por el límite. **Quedó lo de la maqueta:** la toma como hito y «7 series».

**Sin dibujar en la maqueta, y ya escrito** (hay que mirarlo en pantalla, en los dos temas): los rasgos de una sesión; una comida diferente; un hecho anulado o sin hora; la fila de cada hito; el detalle de una sesión, una toma y una planificación; «Más filtros» abierto; el desplegable de «Lo nuevo»; una búsqueda con resultados; una combinación a medida; los días sin hechos; el día que sigue; 1280 y 1024; un período que cruza el año.

## 5. Pasos que faltan, en un orden que deja la vista funcionando

Cada compilación del website tarda de 2 a 5 minutos y la pasada completa, 25: los pasos están juntos por compilación. Si se toca el dominio, su `dist` se reconstruye antes (`REPO\packages\domain\package.json:6-14`).

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Medir el «antes»** con el marco de hoy, sobre la compilación de `3d2a188`, si todavía existe: alto de la línea con A, 90 días, 1440 × 900 | — | Ninguno | `paginas.mjs` o `ver.mjs` |
| 1 | **Antes de compilar, lo que cambia textos o datos:** decidir DEC-1 (hitos) y DEC-2; pasar el número de versión (punto 1.3); atar las tandas a la lectura (punto 1.3); los detalles en el detalle (DEC-6); el ícono (DEC-9); la guarda de «Sesión» y «series con datos» (DEC-10); unificar «carga tardía» | `LT`, `HR` y su prueba, `DLL` y su prueba, `SEG\analizar.tsx:117, 501` | Medio | `npm test` (dominio y `scripts`); typecheck |
| 2 | **Adaptar los recorridos en el mismo commit** (§7) y sumar el modo `linea` a `R`, como `resumen` y `analizar` (`R:2578-2598, 3036-3037`) | `R`, `RC` | **Alto:** sin esto, `funcional` no llega a Analizar | Compilar; `recorrido.mjs linea`; después `funcional` |
| 3 | **Mirar y medir:** 1440, 1280 y 1024, los dos temas; el detalle abierto con cada clase de hecho; la primera pantalla, con su prueba de la prueba | `CSS` | Medio | `ver.mjs` con `#clic:`; `R capturas`; `RC capturas` |
| 4 | **Documentos:** `GUIA:227-229, 238-239, 330-332, 432-433, 476, 488` y V.3 (`:930-972`); `ACE` con la tabla de equivalencias; `WP` §4 (E-65 en adelante), §6 y §8 | Documentos | Bajo | Los siete recorridos sobre una base recién generada (`ACE:439-446`) |
| 5 | **Opcional: el peso de la toma** (DEC-7) | `LT` | Medio: una lectura más y un cruce | Contra API-PRJ-01, a mano |

Los pasos 1 y 2 entran en una compilación; el 3, en otra si hay que corregir; la pasada completa, una vez, al final.

## 6. Comportamiento que hay que conservar

**Estados**
- Cargando, falla con su motivo, sin acceso, sin hechos y sin coincidencias son cinco cosas distintas (`LT:387-409`). Una falla nunca dice «no hay hechos» (`R:1022`).
- Una respuesta de otro filtro no se pinta: `useLectura`, y las tandas extra por `clave` (`LT:218`). Vale también para el detalle (`LT:463`).
- `quieto()` espera a que no haya ningún `.cargando` (`R:134-145`): el detalle carga con `Cargando` (`LT:77`), que lo lleva.

**Filtros y URL**
- Los ocho parámetros, con sus valores. Un enlace viejo con `calidad=QUANTITIES_DIFFER_FROM_PLAN` abre como combinación a medida (`dia-de-la-linea.test.ts:278`).
- El texto buscado no va en ninguna URL ni en el registro de la API (`R:692-701, 1115-1122`). No se restaura al volver de otra pestaña: es a propósito.
- Los enlaces que llegan de afuera: `SEG\resumen-area.tsx:104` e `informacion.tsx:40` (`areas` y `novedades`) y `resumen.tsx:146` (`tardias=1`, que abre «Más filtros»).
- «Ver todo el período elegido» quita el corte y deja lo demás (`LT:379`; `RC:781`).

**Paginación**
- Cursor estable, 50 por tanda, sin repetir ni perder (`R:644, 689`). Lo que falta se dice contra lo que se ve (`aLaVista`, `LT:278, 436`), no contra lo leído.

**El detalle**
- Cada apertura vuelve a leer con el PDP: sin caché (`SEG\contexto.tsx:5`).
- Escape cierra, el foco vuelve a la fila, y la posición y la URL no cambian (`R:660-664`).
- El hecho elegido, los grupos abiertos y las tandas leídas son estado de la visita, no de la URL.

**Reglas de BE**
- Sin verde ni rojo, sin porcentajes, sin «N de M comidas»: «Comidas · 4 registradas» no lleva denominador.
- El hecho queda en el día en que ocurrió; la carga tardía y la corrección se dicen y no lo mueven (PRO-03, PRO-16).
- Un rasgo se reconoce por su ícono y su palabra. Agrupar no esconde (`DLL:9-10`).

**Accesibilidad**
- Un `h1`, el `h2` de la vista y un `h3` por día. El orden del documento es el que se ve: lista y, después, detalle.
- 44 px en cada fila, cada chip y cada opción (`CSS` de `.vista-de-la-linea`, `.entrada__fila`).
- Ningún botón sin nombre: la lupa dice «Buscar» (`LT:360`).
- Sin desborde a 768, 390 y 320.

**Presupuesto**
- La primera tanda: 144 ms a 90 días y 384 a un año (`ACE-PRO:150-151`).
- Lecturas de esta vista: una al abrir; una más con un corte; una por «días anteriores»; una al abrir «Más filtros»; una por registro abierto.
- **120 lecturas por minuto.** Cada fila que se abre es una lectura. `abrirResumen` pasa por esta vista (`R:1964-1967`): lo que se sume acá lo paga también ese recorrido.

## 7. Las comprobaciones de los recorridos que tocan la línea de tiempo

### 7.1 `recorrido.mjs`: hay que adaptarlas

| # | Línea | Qué mira | Qué protege | Qué pasa hoy sobre el DOM nuevo, y cómo adaptarla |
|---|---|---|---|---|
| 1 | 611-612 | «(\d+) hechos coinciden» en `section p[role="status"]` | El total del período | No coincide («N hechos en el período»): da `NaN`. Leer las dos formas y quitar los puntos de miles |
| 2 | 615-616 | El `h3` del día, largo | PRO-17 | Falla: el `h3` trae la corta y la larga. Leer `.linea-de-tiempo__fecha .visualmente-oculto` y, aparte, la corta |
| 3 | 617-621 | Una `.entrada` con «Carga tardía» y «Toma» en el día de ayer | PRO-03 | Falla. «Cargado otro día» |
| 4 | 622-625 | Las `.entrada` de ayer: un almuerzo «Rectificado», una merienda «Anulado» | PRO-16 | Las comidas están en un grupo cerrado, con `hidden`. **[supongo]** Lee igual su texto. Abrir el grupo antes, y sumar la positiva del grupo: «1 rectificada», «1 anulada» |
| 5 | 628 | **Clic** en `.filtros-de-linea fieldset button.chip` «Nutrición» | PRO-04 | **Corta el modo.** Abrir antes «Más filtros» (`.vistas-de-la-linea__mas`) |
| 6 | 630 | **Elige** «Tipo de hecho» | PRO-04 | Pasa con «Más filtros» abierto (`LT:816-838`) |
| 7 | 633-634 | La cuenta filtrada, menor que el total | PRO-04 | Falla por la 1 |
| 8 | 635-641 | Botones que empiezan con «Ver más» | PRO-04 | No pagina: falla la 9. «Ver días anteriores» |
| 9 | 642-644 | Los `data-id` de las `.entrada`, tantos como la cuenta; las áreas, todas Nutrición | PRO-04 | Los `data-id` cuentan también las ocultas: bien. Las áreas: `.entrada__area` existe solo fuera de los grupos y dice «Nutrición:», con dos puntos: la igualdad falla si hay un día con una sola comida, y si no hay ninguno pasa sola. Leer `data-area` de cada `.entrada` |
| 10 | 647-654 | El último botón «Abrir registro» | PRO-05 | **Corta el modo** (no hay ninguno). La última `.entrada__fila` a la vista; si es de un grupo, abrirlo antes |
| 11 | 655-664 | `dialog[open]` con «Ver en Nutrición»; axe; Escape; posición, foco y URL | PRO-05, PRO-22 | **Corta el modo.** A 1440, `aside.detalle-del-hecho`. Sumar una pasada a 1024 con `dialog[open]` |
| 12 | 674 | **Clic** en `.filtros-de-linea button[type="submit"]` «Buscar» | PRO-04 | **Corta el modo.** `.buscador-de-la-linea button[type="submit"]`, sin texto (o Enter en el campo) |
| 13 | 704-705, 970 | La cuenta vuelve al total | PRO-04, PRO-21 | Fallan por la 1 |
| 14 | 1905-1910 | La línea **no** tiene el botón de la ayuda | E-47 | Falla. Se invierte, con título, foco en el título, Escape y axe (como `R:2440-2459`) |
| 15 | 2857-2863 | A 390: **clic** en `.entrada button` «Abrir registro»; `dialog[open]` | El registro abierto en el teléfono | Corta el final de `capturas`. `.entrada__fila`; ahí sigue siendo un diálogo |
| 16 | 3013-3020 | **Negativa:** ninguna `.entrada` dice «Toma» ni «kg» | PRO-20 | Pasa. Ya era débil: si esa persona no tiene otros hechos, la lista está vacía **[supongo]**. Sumar la positiva antes de revocar: hay una `.entrada` con «Toma» |

### 7.2 `recorrido.mjs`: pasan sin tocar el guion

| Línea | Qué mira | Por qué sigue pasando |
|---|---|---|
| 604-607 | La pestaña y la URL | No cambió |
| 610 | Seis `.entrada` o más | Cuenta también las ocultas. Protege «a un clic», no «a la vista» |
| 613-614 | `.linea-de-tiempo__dia[data-fecha]`, descendentes, el primero hoy | El gancho se conservó (`LT:611`) |
| 667, 702 | **Clic** en «Limpiar filtros» | Sigue en los filtros activos (`LT:913-915`) |
| 673 | Escribe en `input[type="search"]` | Sigue (`LT:358`) |
| 676-678, 687-689 | Cada `.entrada__titulo` dice «cena» | Con texto buscado no se agrupa, y el título es el nombre de la comida |
| 692-701, 1115-1122 | El texto buscado, solo en el cuerpo de un POST | No cambió |
| 706 | axe en la línea | Hay controles nuevos: mirarlo |
| 1018-1022 | Con 429: «muchas consultas seguidas», y no «No hay hechos registrados» | Los dos textos siguen |
| 2813-2833 | `linea` a cinco anchos y dos temas, sin desborde | PRO-23 |

### 7.3 `recorrido-comprension.mjs`

| # | Línea | Modo | Qué mira | Qué pasa hoy, y cómo adaptarla |
|---|---|---|---|---|
| 1 | 413-417 | mirar | La línea con el corte: sin desborde, axe, sin doble desplazamiento | Pasa. El doble desplazamiento se mide con el detalle cerrado |
| 2 | 509, 516, 532 | capturas | `linea` y `linea-novedades`, tres anchos, dos temas | Pasa (CP-27) |
| 3 | 552, 558-562 | capturas | La primera `.entrada` empieza antes de los 800 px a 1280 × 800 | Pasa. Si la primera del documento estuviera en un grupo cerrado, mediría 0 y pasaría sola: mejor `.linea-de-tiempo__dia` |
| 4 | 770, 779-781 | funcional | El aviso del corte y su botón | Pasan |
| 5 | 771 | funcional | «(\d+) hechos? coincid» | Pasa («N hechos coinciden.»). Cuidado con el punto de miles |
| 6 | 772, 776 | funcional | Todas las `.entrada__area` son de Nutrición | Pasa: con un corte no se agrupa y cada fila la lleva. Mejor `data-area`, y exigir al menos una |
| 7 | 1462 | funcional | Tiempo de la línea con el corte | Informa cuatro pedidos, no tres |

### 7.4 Las que pasarían sin proteger nada

- **`R:644`, la parte de las áreas:** si ningún día tiene una sola comida, no hay ninguna `.entrada__area` y `every` da verdadero.
- **`RC:552`:** si la primera `.entrada` del documento está oculta.
- **`R:3015-3020`:** con la lista vacía. No es de esta parte, pero se arregla en el mismo cambio.
- **`R:610`:** pasa contando filas ocultas.

Las demás fallan a la vista o cortan el modo.

### 7.5 Comprobaciones nuevas que conviene escribir

Lo esperado, a mano desde la API (`leerApi`, `R:167-172`), sin el dominio.

- **Las vistas con nombre.** Con `timeline?…&limit=1`: Todo, la suma de `byEventType`; Hitos, esa suma sin `MEAL_RECORDED` ni `TRAINING_SESSION_RECORDED`; Distinto, `QUANTITIES_DIFFER_FROM_PLAN` más `SESSION_WITH_DEVIATION`; Sin confirmar, `QUANTITIES_UNCONFIRMED`. Al elegir cada una: la URL exacta, `aria-pressed` y la cuenta de la cabecera igual al `totalMatching` de la API con ese filtro.
- **Un solo «Hitos»:** el número del chip es el de «Hitos (N)» de Analizar para el mismo período (si se unifica; N no pasa de 50, `SEG\analizar.tsx:263`).
- **Los días.** Con las dos primeras tandas de la API, por fecha: cuántas comidas, cuántas con cada rasgo, si hay sesión o hito. Contra cada día en pantalla: `data-novedades`, «N registradas» (`data-cuenta`), las etiquetas. El último día de la primera tanda no está, y lo que se ve suma lo que dice el pie.
- **Un grupo abierto:** tantas filas como comidas, de la más temprana a la más tardía, con los identificadores de la API.
- **La primera pantalla,** con datos recién generados: el alto de la página (se informa, contra el «antes»); dónde termina el quinto día (se exige) y el séptimo (se informa), a 1440 × 900. Con su prueba de la prueba.
- **El detalle a 1440:** «Ocurrió» y «Se cargó» iguales a los instantes de la API; la fila con `aria-current`; Escape, foco y URL.
- **La carrera:** demorar tres segundos la lectura de una comida, tocar otra, esperar: el detalle es de la segunda.
- **Una activación de plan:** el detalle dice su número de versión, no «Versión 0».
- **«Actualizar» con dos tandas leídas:** lo que se ve no repite ni pierde identificadores contra la API.
- **Con el corte:** los chips dicen las cantidades del período elegido.
- **Cada parámetro viejo sigue abriendo:** una URL con cada uno de los ocho; el pedido a la API lleva `domain`, `type`, `state`, `quality`, `late`, `planVersionId`, `exerciseId` o `since`, y la pantalla dice el filtro.
- **Sin hechos:** un rango anterior al primer registro dice «No hay hechos registrados…» (la positiva de `R:1022`). **Sin coincidencias:** dice cuántos hay en el período, y «Limpiar filtros» vuelve a «Todo».
- **Los días sin hechos:** contra las fechas de la API, y ninguno con un filtro puesto.
- **Sin `%`** ni palabras que califican en toda la vista, con un grupo y el detalle abiertos.

## 8. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-1 | Qué es un hito | Una sola definición: Analizar lee `TIPOS_DE_HITO` y su capa nombra también las tomas | Dos nombres («Hitos de la planificación» en Analizar), o sacar la toma de `DLL:22` y de la ayuda |
| DEC-2 | «Distinto de lo indicado» | Como está, con la frase de `queTrae` en el nombre accesible del chip | Solo las comidas: el nombre dice exactamente lo que BE comprueba |
| DEC-3 | La columna del detalle | Reservada siempre desde el corte de ancho, con un texto corto cuando no hay nada elegido: abrir y cerrar no mueve la lista | Como está: la lista usa todo el ancho hasta que se elige algo |
| DEC-4 | El desplazamiento propio del detalle | Dejarlo y escribir la excepción en `GUIA:238-239` | Sin pegar: al tocar un hecho de abajo, el detalle queda fuera de la vista |
| DEC-5 | Qué se exige de «una semana a la vista» | A 1440 × 900, cinco días enteros; se informa el séptimo, y se mide también a 1920 × 950 y a 1280 | Exigir los siete: mi cuenta da 30 px de margen |
| DEC-6 | Los detalles de la entrada | En el detalle, todos los que la fila no mostró, para cualquier hecho | Como está: solo si no tiene registro propio (`LT:771`) |
| DEC-7 | El peso en la fila de la toma | En un paso aparte: una lectura más, solo con tomas a la vista; si falla, la fila queda como está | No traerlo |
| DEC-8 | Una búsqueda que coincide en lo que la fila no muestra | Con texto buscado, la fila suma el detalle que coincide (`normalizarTexto`, `DOM\linea-de-tiempo.ts:159`) | Dejarlo: se ve al abrir |
| DEC-9 | El ícono de «Comida diferente» | `desvio`, como dice `CAT:119` | `comida`, y corregir el catálogo |
| DEC-10 | «N series» y «Sesión …» | «N series con datos»; no anteponer «Sesión» si la etiqueta ya empieza así | Como está |
| DEC-11 | Cargando, falla y sin acceso | El bloque de la pantalla 19 (`BloqueDeEstado`), con el ícono del motivo | Como está: los componentes de antes |
| DEC-12 | El aviso de vista parcial | Sacarlo de la vista: ya está en el marco | Dejar los dos |
| DEC-13 | La versión del plan | Como hoy: solo por URL | Sumar la lista en «Más filtros»: las de Entrenamiento llegan con la lectura de ejercicios (`DOM\contratos-analisis.ts:291`); las de Nutrición piden otra |
| DEC-14 | El ejemplo de búsqueda | Sumarlo a la ayuda («por ejemplo, cena o sentadilla») | Dejarlo afuera |

## 9. Lo que no pude determinar leyendo

- **Si lo escrito compila y si sus pruebas pasan.** No ejecuté nada.
- **Cuánto mide cada cosa.** Los altos del punto 1.9 salen de la maqueta, no del `CSS` nuevo, que leí solo por su estructura.
- **Si los dos defectos del punto 1.3 se ven en pantalla.** Los seguí en el código.
- **Cuántos hitos y tomas tiene hoy la base `be_test_escritorio`.** Tomé 11 y 8 de `ACE` y de `WP`.
- **Cómo se ve cada registro de origen en una columna de 24 a 30 rem:** la tabla de la toma (`RO:176-198`) y la planificación entera de una versión.
- **Qué devuelve `innerText` de una fila adentro de un grupo cerrado** (§7.1, fila 4): lo deduzco de la especificación.
- **Si el asesorado descartable tiene hechos de Nutrición** (§7.1, fila 16).
- **Qué etiquetas de sesión escriben los profesionales:** en los datos de prueba es «A · Tren inferior».
- **Si una toma siempre trae peso,** y qué devuelve API-PRJ-01 con `metric=peso` cuando ninguna lo tiene.
- **Cómo se ve el desplegable de «Lo nuevo»** cuando el foco sale de él, y si entra en la ventana a 1024.
- **Si la prueba de palabras, extendida a la ficha (E-05, pendiente), choca con los textos nuevos.**
- **Hasta dónde llegó el árbol.** Lo último que vi es lo del encabezado.
