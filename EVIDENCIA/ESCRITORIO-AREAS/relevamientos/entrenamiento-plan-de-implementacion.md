# Entrenamiento (plan activo, registros y versión en preparación) · plan de implementación (solo lectura: no compilé ni ejecuté nada)

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `WEB` = `REPO\apps\web\src` · `ADV` = `WEB\app\pro\advisees` · `SEG` = `ADV\seguimiento` · `T` = `ADV\training` · `CSS` = `WEB\app\globals.css`
- En `T`: `ENT` = `entrenamiento.tsx` (117 líneas) · `PAG` = `page.tsx` (24) · `PLN` = `plan.tsx` (296) · `EDI` = `editor.tsx` (972) · `OPS` = `objetivos-por-serie.tsx` (172) · `EJE` = `ejecuciones.tsx` (364) · `SYT` = `series-y-tiempos.tsx` (181) · `CMP` = `comparacion.tsx` (1.058) · `HAB` = `habituales.tsx` (278) · `PLT` = `plantillas.tsx` (177) · `IMP` = `importacion.tsx` (241) · `RES` = `resumen.tsx` (620) · `REV` = `revisiones.tsx` (376)
- `DOM` = `REPO\packages\domain\src` · `CE` = `DOM\contratos-entrenamiento.ts` · `CS` = `DOM\contratos-entrenamiento-por-serie.ts` · `COPE` = `DOM\copy-entrenamiento.ts` · `COPS` = `DOM\copy-entrenamiento-por-serie.ts` · `CDE` = `DOM\comparacion-de-entrenamiento.ts` · `CLI` = `DOM\cliente-http.ts`
- `API` = `REPO\apps\api\src`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` · `M24`, `M25`, `M28` = `MQ\partes\24-cuerpo.html`, `25-cuerpo.html`, `28-cuerpo.html` · `M24P` = `MQ\24-plan-de-entrenamiento.html` (la página armada, con el marco)
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas` · `R` = `H\recorrido.mjs` · `RC` = `H\recorrido-comprension.mjs`
- `ES` = `REPO\EVIDENCIA\ENTRENAMIENTO-SERIES\herramientas\recorrido` · `RW` = `ES\recorrido-web.mjs` · `RWE` = `ES\recorrido-web-ejecuciones.mjs`
- `EA` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE` · `CRIT` = `EA\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `EA\diseno\iconos\CATALOGO.md` · `REL` = `EA\relevamientos\entrenamiento.md`
- `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md` · `CP` = `REPO\scripts\copy-pantallas.test.cjs`
- `B1006` = `REPO\docs\legajo\10_UX\BE_LEG_10_v0.6_B10_06_ENTRENAMIENTO_UX_P0_TOBE_2026-08-31(1).md`

**Con qué leí**
- **El código,** en la rama `wp-escritorio-amable`, HEAD `c565f0c`. Enteros: `ENT`, `PAG`, `PLN`, `EDI`, `OPS`, `EJE`, `SYT`, `CMP`, `HAB`, `PLT`, `IMP` y `WEB\app\pro\exercises\mis-ejercicios.tsx`. Por partes: `RES:56-95`, `REV:36-135` y `exercises\imagen-de-ejercicio.tsx` (por búsqueda). Del dominio, enteros: `CS`, `COPE`, `COPS`, `objetivos-por-serie.ts`, `relacion-con-el-objetivo.ts`, `presentacion-de-prescripcion.ts`, `compatibilidad-de-clientes.ts` y `dia-de-la-linea.ts`; por partes: `CE:185-766`, `CDE:1-460` y `610-826`, y `CLI` por búsqueda. De la API, solo lo necesario para confirmar un comportamiento.
- **El árbol cambió mientras leía, y seguía cambiando al cerrar.** Al empezar estaba limpio. Al cerrar este documento había cambios sin commit en diez archivos (1.318 líneas agregadas y 310 quitadas) y dos archivos nuevos: en `SEG` (`analizar.tsx`, `etapas.tsx`, `geometria.ts`, `minigrafico.tsx`, `preguntas.tsx`, `selector.tsx`, y el nuevo `etapas-en-pantalla.ts`), en `DOM\entrenamiento-del-analisis.ts`, en `RC` (entre las líneas 804 y 1186 del commit), en dos pruebas de `REPO\scripts` (una, nueva) y en `CSS` (de la línea 5569 del commit en adelante). Por lo que se ve en el cambio del dominio (los rótulos del detalle de un punto de una serie), es el trabajo pendiente de Analizar sobre las etapas y sobre el ejercicio. **Ningún archivo de `T` ni de `exercises` cambió;** tampoco `R`, `RW`, `RWE` ni `CP`. Las líneas que cito de `CSS`, de `RC`, de `SEG\analizar.tsx` y de `DOM\entrenamiento-del-analisis.ts` son las del commit `c565f0c`, y las comprobé contra el commit: en los archivos en edición, de esos puntos para abajo están corridas (al cerrar, en el archivo en edición el retorno a la ficha de `RC:823-833` estaba 64 líneas más abajo, sin cambios en su texto; `RC:1488-1540` tampoco estaba tocado).
- **El relevamiento anterior (`REL`) sigue valiendo línea por línea.** Se escribió sobre `ab90860`; desde entonces ningún commit tocó `T` ni `exercises` (el último es `cc17ba2`, del 9/10). Lo que cambió alrededor: las horas van en 24 horas (`WEB\lib\formato.ts:6`), las paletas, `Pestanas` admite un ícono (`WEB\components\pestanas.tsx:27, 39`) y `CP` sumó 63 líneas.
- **Las maquetas:** el cuerpo en HTML de las tres, la página armada de la 24 (de ahí sale el marco: `M24P:15-28`) y las tres imágenes en Claro. No miré las de Azul noche. La barra de las maquetas es vieja y no vale.
- **El criterio:** `CRIT:172-203` (los tres mapas), `222-235` (estados), `237-260` (1280 y 1024) y `396-460` (cambios C-58 a C-81, «lo que no se agregó» y la corrección del RIR).
- **Los recorridos:** `RW` y `RWE` enteros; `R` y `RC` por búsqueda y por tramos; `H\paginas.mjs`, `H\ver.mjs` y `CP` enteros.
- **El legajo:** abrí un solo archivo, `B1006` (que en su línea 8 se declara «BORRADOR UX — NO CANÓNICO»), y de él §1, §9, §11 a §18, §23, §24 y §41. No cito ningún otro.

Todo lo que afirmo del código lo leí, con su línea. Lo que deduzco o calculo sin haberlo medido va con **[supongo]** o **[estimo]**.

## 1. Lo que condiciona el plan

1. **Seis piezas de estas tres pantallas son también de las otras áreas.** Si cada agente arma la suya, quedan tres versiones de lo mismo.
   - **El marco del área** (`M24P:15-28`): hoy las cuatro pestañas de área arman el mismo encabezado con las mismas cuatro líneas: migas, `h1`, «Volver a la ficha» y pestañas (`ENT:99-110`; `ADV\nutrition\nutricion.tsx:101-112`; `ADV\anthropometry\antropometria.tsx:105-116`; `ADV\forms\formularios.tsx:96-99`).
   - **El selector de versión** («en preparación» y «activa»): C-39, igual en Nutrición (`MQ\partes\17-cuerpo.html:62`).
   - **El diálogo de activar** con la próxima revisión adentro: C-40 a C-42, dibujado para Nutrición (`MQ\partes\18-encima.html:24-35`).
   - **El selector de período** de los registros: hoy es un formulario común a los tres dominios (`ADV\periodo.tsx:24-47`).
   - **El detalle al costado** de una lista y **el menú de tres puntos**. Ninguno existe como pieza suelta (punto 13).
   - Están en DEC-1 a DEC-8. Conviene que se decidan una vez, antes de que nadie programe.

2. **Tres pruebas dicen cómo se pueden escribir los textos de estas pantallas.**
   - `CP:62-67` mira los `.tsx` que están sueltos en `T` (no entra en subcarpetas y no mira los `.ts`: `CP:24`), exige siete archivos o más y que cada uno tenga algún texto (`CP:104-109`). Un módulo `.ts` con textos, o una subcarpeta, quedan sin mirar si no se suman a la lista (como se hizo con `/pro` en `CP:72`).
   - `CP:219-231` hace fallar cualquier `.tsx` de `T` que escriba «no realizad…» o que lea `execution.sessionCondition`. **El chip de la maqueta «Con desvío o no realizada» (`M25:51`) no se puede escribir en la pantalla:** ese texto vive solo en el dominio (`COPE:33-37`; `DOM\dia-de-la-linea.ts:100`; `CDE:667-668`). DEC-16.
   - `DOM\contratos-wp06.test.ts:423-425` pasa cada valor de `COPY_ENTRENAMIENTO` por la lista de palabras y lo trata como cadena (`COPE:260`): si a ese objeto se le suma una función, la prueba se rompe. `COPY_ENTRENAMIENTO_POR_SERIE` sí tiene funciones (`COPS:26-78`) y ninguna prueba del dominio recorre sus textos.
   - La lista prohíbe «progresar» como subcadena (`COPE:252, 261`). «Progresando» pasa, y la pregunta del dominio ya lo dice (`DOM\preguntas-profesionales.ts:60`). «Intensidad 60 kg» no pasa (`COPE:265`): en «Lo general», «Intensidad» va con RIR o % RM, nunca al lado de kilos.

3. **Los siete recorridos del paquete casi no miran estas pantallas; los que sí las miran son de otro paquete y dependen del DOM de hoy.**
   - De `R` y `RC`, la pestaña Entrenamiento aparece en tres lugares: el retorno a la ficha (`RC:823-833`), el formulario de revisión (`RC:1488-1540`, que no es de estas tres pantallas) y dos destinos de enlaces (`R:2142, 2377`). Nada mira el plan, el editor ni las sesiones registradas.
   - `RW` y `RWE` (la evidencia de WP-ENTRENAMIENTO-SERIES) sí: arman un plan entero en el editor y leen las sesiones registradas. Buscan por los `id` de cada campo (`#b0-s0-p0-serie-1-carga`), por textos exactos («Guardar borrador», «Guardado.»), por `table.tabla--objetivos` y por `li.lista__item details`. Con el diseño nuevo se cortan casi enteros (§7.2). Lo que protegen sigue valiendo: DEC-31.

4. **Cinco piezas de `T` las usa la ficha.** Cambiarlas cambia también Analizar y el detalle de la línea de tiempo.
   - `Registro` (`EJE:209-249`) y `PlanSoloLectura` (`PLN:261-296`): `SEG\registro-original.tsx:31-32, 157, 230`.
   - `EvolucionDelEjercicio` (`CMP:701-809`), `nombreParaElegir` y `objetivosDe` (`EJE:252-261`): `SEG\contraste.tsx:34, 38, 87-96`.
   - `WP:281` dejó para este paquete «el registro de una comida, de una sesión o de una toma dentro del detalle». DEC-22.

5. **En el editor, la regla es el dato de tres estados, no el dibujo.** Cada objetivo de una serie puede estar ausente (toma lo general), ser `null` (sin objetivo) o tener un valor (`CE:216-226`; `DOM\objetivos-por-serie.ts:6-12`). De eso depende lo que recibe el teléfono y si el plan se puede activar.
   - Hoy lo hace `CampoHeredable` con un campo y una casilla (`OPS:36-88`), y el editor quita la clave cuando el campo queda vacío (`EDI:570-579`).
   - Lo que no se entiende viaja como `NaN`, para que el guardado lo rechace y señale el ejercicio en vez de guardar otra cosa (`EDI:489-528`; `OPS:75-81`).
   - Si alguna serie tiene un RIR o una carga distintos de los generales y el asesorado todavía no usó una app que los muestre, «Activar plan» queda apagado y dice por qué (`EDI:246-250, 306-318, 430, 438-442`; `DOM\compatibilidad-de-clientes.ts:57-79`). La API lo rechaza igual (`EDI:232-235`).
   - Cambiar el criterio borra el RIR de cada serie (`EDI:598-601`); cambiar la unidad cambia la de todas las series sin convertir (`EDI:657-663`); una serie nueva copia las repeticiones de la anterior y nada más (`EDI:778`).
   - La celda única de la maqueta tiene que conservar todo eso. Es la decisión más delicada del editor: DEC-24.

6. **El selector de versión trae un riesgo que hoy no existe: perder lo escrito.** Hoy el editor y el plan activo están en la misma página, uno debajo del otro (`PLN:128-141, 154-158`): mirar el plan activo no cierra nada. Con el selector, pasar a «activa» desmontaría el editor.
   - Lo mismo con «Actualizar»: la lectura de la vista pone el estado en «cargando» y saca todo lo que hay debajo, el editor incluido (`PLN:56, 109-110`; `ENT:66-71`).
   - Y con las pestañas, que ya hoy pierden lo escrito sin avisar (`ENT:111-114`; `REL:70`).
   - DEC-4 y DEC-5.

7. **En los registros, las cantidades y «frente a lo indicado» se calculan en el navegador, con lecturas que pueden fallar por separado.**
   - La lista sale de una lectura (`EJE:64-69`; `CLI:1131-1133`) y el objetivo de cada serie, de otra por cada versión del plan que aparece en el período (`EJE:92-103`; `CLI:1145-1147`). Si esa segunda falla, hoy se descarta en silencio (`EJE:98`) y la tabla lo dice con una nota (`SYT:94`).
   - Con la lista nueva, una sesión cuyo plan no se pudo leer **no puede decir «Dentro de lo indicado»**: tiene que decir que no se pudo leer lo indicado. Una falla no es ausencia de datos.
   - Los tiempos son una tercera lectura, una por sesión abierta (`SYT:75-83`; `CLI:1161-1163`).
   - Todas son lecturas protegidas, con el cupo de 120 por minuto (`API\entrenamiento\entrenamiento.controller.ts:91-95, 271-275`; `API\entrenamiento\entrenamiento-por-serie.controller.ts:33-37, 62-66`). Con 92 días y tres versiones: cuatro al abrir y una más por cada detalle.
   - El orden de la API es del más viejo al más nuevo (`API\entrenamiento\revisiones.service.ts:145`); la maqueta lo quiere al revés (C-68). Se invierte en el navegador: la lista llega entera, sin páginas (`CE:756`).

8. **«Distinto de lo indicado» ya quiere decir otra cosa en la ficha.** En la línea de tiempo trae las comidas con una diferencia comprobada y «las sesiones registradas como realizadas con cambios» (`DOM\dia-de-la-linea.ts:264-270`; E-67, `WP:206`). En la maqueta 25 son dos vistas: «Distinto de lo indicado» cuenta las sesiones con series distintas, calculadas (`M25:50`), y «Con desvío o no realizada», lo que la persona declaró (`M25:51`). Con el mismo nombre, la ficha y la pestaña mostrarían cantidades y sesiones distintas. DEC-15.

9. **La evolución de un ejercicio se muda a Analizar (C-67), y allá le faltan dos cosas.**
   - En Analizar el componente es el mismo (`SEG\contraste.tsx:38, 87-96`), pero «Abrir la ejecución» no hace nada: recibe una función vacía (`SEG\contraste.tsx:94`) y los dos botones se dibujan igual (`CMP:800-802, 1047-1049`). Es un defecto de antes.
   - En la pestaña, la evolución respeta el filtro «Versión del plan» (`EJE:80, 161`). En Analizar no hay ese filtro.
   - La maqueta nombra la pregunta «¿Cómo viene progresando…?» (`M25:67`), que en BE dibuja tres gráficos por serie (`DOM\preguntas-profesionales.ts:59-64`). El componente que sale de la pestaña está en la otra pregunta, «¿Lo registrado coincide con lo indicado?» (`SEG\contraste.tsx:44-46`). DEC-21.
   - **Mientras escribo esto, alguien está trabajando en el ejercicio de Analizar** (C-21, pendiente en `EA\ACEPTACION.md:750-752`): hay cambios sin commit en `SEG\preguntas.tsx` y en `DOM\entrenamiento-del-analisis.ts` (ver «Con qué leí»). Lo que quede de ese trabajo manda sobre lo que diga acá de Analizar. `SEG\contraste.tsx` no estaba tocado.

10. **Los números de versión salen de una lista que se lee de a 20, y los registros no la leen.**
    - «Versión N» no llega de la API: es el orden de activación, contado en la pantalla (`PLN:38-42`). La lista de versiones viene paginada, 20 por página (`API\http\paginacion.ts:9-10`; `CLI:1031-1033`), y `PLN:57` lee solo la primera. Con más de 20 versiones, los números salen mal y el borrador puede no aparecer. Defecto de antes; se arregla leyendo todo con `todasLasPaginas` (`CLI:1288-1291`).
    - En los registros, una versión se nombra por su fecha («Activada el…», `EJE:124`). La maqueta dice «frente al plan versión 3» (`M25:73`): hace falta esa misma lista, una lectura más.
    - **La guía dice que un borrador no tiene número** hasta activarse (`GUIA:393-395`); la maqueta escribe «4 · en preparación» (`M24:39`; `M28:59`). DEC-5.

11. **La maqueta dibuja el caso lindo.** No dibuja, y el código de hoy los resuelve todos:
    - microciclos (`PLN:278-288`; `EDI:335-355`); cinco o más sesiones o bloques (C-81 lo escribe y dice «no está dibujado», `CRIT:451-454`);
    - el criterio % RM con su referencia (`EDI:625-634`), las libras (`EDI:651-668`), los parámetros (`EDI:789-820`), la imagen del ejercicio (`PLN:239`; `EDI:583`);
    - el plan sin objetivo, sin versión activa o sin borrador (`PLN:122-126, 142-151, 158, 185`); la plantilla de origen (`EDI:305`); el bloqueo por la app (`EDI:306-318`); el objetivo más nuevo (`EDI:319-323`);
    - una sesión no realizada, resumida, con otro ejercicio, corregida o con el registro sin determinar (`CDE:191-203, 680-684`; `EJE:329-352`); una serie de más («No planificada», `SYT:123`); una sesión sin tiempos (`SYT:158`).
    - Están uno por uno en §4.

12. **Medidas de hoy y de la maqueta.**
    - **Antes, a 1440 × 900** (asesorado A, 10/10, antes del primer paquete): la pestaña Plan con el borrador, **22.719 px**, 25 pantallas; «Ejecuciones» con los 7 días por omisión, 1.298 px (`EA\parte-0\alturas-antes.json:104-116`). Hay que volver a medir: desde entonces cambiaron la barra y las paletas.
    - **Antes, a 1280** (capturas del 6/10): el editor con una sesión de tres ejercicios, 9.677 px y 116 controles; el plan activo, 2.774 px; una sesión registrada abierta, 3.337 px (`REL:978, 1004-1006`; `CRIT:194-195`).
    - **El ancho:** hoy la página topa en 76 rem, 1.216 px (`PAG:17`; `CSS:468-478`). La maqueta usa todo el ancho: 1.376 px útiles a 1440. La ficha topa en 100 rem (`CSS:4299-4305`). `.contenido--ancho` la usan siete páginas contando esta: no se toca (E-02). DEC-3.
    - **Las maquetas son de 1440 × 960.** El contenido termina cerca de los 775 px en la 24, de los 920 en la 25 y de los 910 en la 28 **[estimo, sobre la imagen]**. En el producto la barra mide 65 px (`GUIA:258`), no 56.
    - **A 1280 la 25 no entra como está dibujada:** con el detalle en 640 px (`M25:9`) y las columnas fijas de la lista (`M25:11`), a «Sesión y condición» le quedan unos 40 px **[estimo]**. Por eso el criterio pide que en el detalle «Indicado» y «Registrado» pasen a dos renglones (`CRIT:259`).
    - **El editor a 1280 tampoco:** con «Lo general» en 420 px (`M28:23`) y las columnas de `M28:95`, a «Nota» le quedan unos 100 px **[estimo]**. El criterio no tiene una fila para el editor de Entrenamiento a 1280 ni a 1024 (`CRIT:243-260`). DEC-30.

13. **Lo que ya existe para reusar, y dónde encaja.**

    | Pieza | Dónde está | Dónde encaja acá | Qué le falta |
    |---|---|---|---|
    | `Icono` | `WEB\components\icono.tsx:35-56` | Todos los íconos de las tres pantallas: los 18 están en la familia (`DOM\iconos.ts:72, 77, 91, 98, 108, 110, 115-117, 135-136, 143-146, 148-149, 172`; `EA\diseno\iconos\INVENTARIO.md:39, 40, 43`) | Nada. Tamaños: 20 en filas y botones, 18 en pestañas y enlaces, 15 en una etiqueta (`icono.tsx:7`) |
    | `Pestanas` con ícono | `WEB\components\pestanas.tsx:20-47` | Las cuatro secciones: `resumen`, `plan`, `lista` y `revision` (`M24P:26`) | Nada: se suma `icono` a `ENT:29-34` |
    | `BotonDeVista` | `WEB\components\vista-con-nombre.tsx:14-51` | Las cuatro vistas de los registros (`M25:49-52`). La unidad para el lector de pantalla: «sesión», «sesiones» | Nada. Conserva `.vista-de-la-linea` y `data-vista` |
    | «Más filtros» como botón | `SEG\linea-de-tiempo.tsx:397-405` | Versión del plan y ejercicio | Es código de esa pantalla: se copia el patrón (`aria-expanded`, `aria-controls`, cantidad puesta) |
    | `BloqueDeEstado`, `EstadoVacio` | `WEB\components\estados.tsx:24-72` | Cargando, falla con motivo, sin plan, sin sesiones, sin coincidencias | `EstadoDeLectura` (`ENT:66-71`) hoy no usa ninguno de los dos ni dice el motivo |
    | `motivoDeFalla`, `razonDeFalla`, `ICONO_DE_FALLA` | `WEB\lib\fallas.ts:10-35` | Toda lectura de la pestaña | Hoy `EDI:148` y `ENT:69` tiran el motivo |
    | `useListaCompleta` y `todasLasPaginas` | `WEB\lib\lista-completa.ts:30-60`; `CLI:1288-1291` | La lista de versiones del plan (punto 10) | Nada: la respuesta tiene la forma que piden (`CE:380`) |
    | «Cómo se lee esta vista» | `SEG\como-se-lee.tsx:237-274` | La ayuda única de Plan y de Registros: ahí van las notas que la maqueta saca de la vista (§4) | Está atada a las tres vistas de la ficha (`como-se-lee.tsx:231-241`): hay que separar el diálogo de su contenido. DEC-8 |
    | El detalle al costado | `SEG\linea-de-tiempo.tsx:84-85, 157-167, 450, 482-512`; `CSS:3012-3022, 3267-3312` | El detalle de una sesión registrada | No es una pieza: está escrito dentro de la línea de tiempo y su panel de «encima» depende del contexto de la ficha (`SEG\registro-original.tsx:117-118`). Además mide de 24 a 30 rem (`CSS:3020-3022`) y la maqueta pide 640 px. DEC-8 |
    | El renglón que se abre entero | `.entrada` y `.entrada__fila` (`SEG\linea-de-tiempo.tsx:677-711`; `CSS:3236`) | Cada sesión de la lista (`M25:60-64`) | Es un botón con `aria-current`, no un enlace |
    | La etiqueta con ícono | `.etiqueta-de-dato` (`CSS:3817-3828`; `SEG\linea-de-tiempo.tsx:660-667`) | «Realizada con desvío», «Medido», «Solo lectura», «Borrador» | Nada |
    | El control segmentado | `.segmentos` y `.segmento` (`CSS:3547-3613`; `SEG\analizar.tsx:448-466`) | Versión, bloque, microciclo y sesión | Son opciones nativas: «Agregar» no es una opción, es un botón al lado |
    | `.dialogo--formulario` | `WEB\app\pro\solicitar-vinculo.tsx:93-158`; `CSS:6118` | Cambiar un nombre, el propósito o las indicaciones; el buscador de ejercicios | Nada |
    | `DialogoDeConfirmacion` | `WEB\components\dialogo.tsx:27-84` | «Activar plan», «Guardar como plantilla», «Guardar como habitual» (ya lo usan: `EDI:468-484`; `PLT:76-121`; `HAB:189-238`) | El foco inicial va al primer control: con la fecha adentro iría a la fecha, no a «Volver» (`dialogo.tsx:4-6`; `MQ\partes\18-encima.html:19-20, 35`) |
    | El período como un solo control | `SEG\barra.tsx:25-129` | El período de los registros (`M25:45`) | Lee el período de la ficha, tiene un año entre los atajos y topa en 366 días (`barra.tsx:26, 70, 99-103`); acá el tope es 92 (`ADV\periodo.tsx:20`). DEC-7 |
    | Un menú que se despliega | `WEB\components\menu-de-cuenta.tsx` (161 líneas) | Los menús de tres puntos de la versión, el bloque, la sesión y el ejercicio | No hay uno genérico. DEC-8 |
    | Las fechas | `diaDelAnioEnCurso`, `diaConSuSemana`, `horaEnZona`, `rangoCivil` (`WEB\lib\formato.ts:35, 38, 39-43, 61-67`) | «26 sept», «sábado», «18:10», «11 – 27 sept 2026» | Nada |

14. **Las palabras: dónde viven y cuáles no coinciden.**
    - Los textos de la pestaña están repartidos: en el dominio (`COPE:66-217`; `COPS:17-94`; `CDE:639-693`) y escritos en la pantalla (`PLN:90, 124, 185`; `EDI:94-116, 302-303, 321, 691`; `EJE:150, 176, 194`; `SYT:94, 152, 158, 177`). E-05 pide dejarlos donde están (`WP:109`).
    - «Ejecuciones» está en un solo lugar a la vista de la pestaña (`COPE:71`, usado en `ENT:32`), más tres que la nombran: `RES:226` («Ver ejecuciones»), `SEG\registro-original.tsx:41` («Ver en Entrenamiento · Ejecuciones») y `CDE:674` («Abrir la ejecución», que se ve en Analizar). «Guardar borrador», en uno (`COPE:118`, usado en `EDI:425`). Ninguna prueba fija esas cadenas.
    - No coinciden, y hay que elegir: «activa» y «vigente» en la misma maqueta (`M24:39, 90`) contra «Activo» y «Anterior» de BE (`COPE:82-83`); «Indicado» (`M25:76`) contra «Planificado», «Plan de la serie» y «Frente al plan» (`SYT:107-109`; `CDE:643`); «Realizada con desvío» (`COPE:35`) contra «Con cambios» en la línea de tiempo (`DOM\dia-de-la-linea.ts:99`); «lo general del ejercicio» (`M24:68`) contra «la prescripción» (`OPS:61, 90`; `CDE:655-661`). DEC-11 y §4.6.

15. **Lo que dice el legajo, en el único archivo que abrí.** `B1006` es un borrador de UX, no canónico (`B1006:8`).
    - Nombra las cuatro secciones «Resumen, Plan, Ejecuciones, Revisiones» como propuesta (`B1006` §1, líneas 66-73) y «Profesional — Ejecuciones» con sus filtros: período, plan y ejercicio (§41, líneas 942-961). Llamarla «Registros» (C-65) se aparta de ese nombre: no cambia el legajo, pero conviene anotarlo en la definición del paquete, como hizo `WP` en su §7.
    - Pide insignias «Borrador, Activo, Anterior», claras y no solo por color (§9, líneas 285-302); manejar con naturalidad el plan con microciclos y sin ellos (§12, líneas 346-360); no confundir una sesión con una fecha (§13, línea 375); que la carga sugerida se distinga del criterio (§18, líneas 463-477).
    - Fija la frase de activar (§24, línea 607), que es `COPE:123`, y pide «no activar silenciosamente desde Save» (línea 609). Que «Activar plan» guarde antes (C-40) no lo contradice mientras activar siga siendo un acto aparte, con su confirmación.

16. **Los datos de prueba tienen casi todos los estados de los registros y casi ninguno del editor.**
    - El asesorado A tiene dos versiones activadas y un borrador, la v3 (`H\datos\comprension.mjs:9-11, 195-196`): el selector diría «3 · en preparación» y «2 · activa». La activa es «Fuerza progresión», con las sesiones «A · Tren inferior» y «B · Tren superior» (`H\datos\escenario.mjs:179-190`), las mismas de la maqueta.
    - Las sesiones registradas traen dos correcciones, las dos del profesional (`H\datos\generar.mjs:448-453`), un desvío con otro ejercicio, una sesión en libras, una no realizada, una resumida, varias cargadas otro día y una semana sin sesiones (`H\datos\escenario.mjs:195-207`; `H\datos\comprension.mjs:9-11`).
    - **Los planes no tienen objetivos por serie** (`H\datos\escenario.mjs:165`), ni descanso, ni notas, ni bases, ni imágenes, ni microciclos. Las sesiones se insertan por SQL (`H\datos\generar.mjs:428-445`): no tienen tiempos marcados **[supongo]**.
    - En casi todas las sesiones alguna serie queda por encima o por debajo de lo indicado (la carga sube cada semana sobre una sugerida fija; el RIR de la última serie baja): «Distinto de lo indicado» contaría casi todas **[estimo, leyendo `escenario.mjs:221-272`]**. Pesa en DEC-14.
    - Un texto del escenario dice «volumen» (el propósito del bloque de la v1, `H\datos\escenario.mjs:171`). Es un dato que escribió el profesional, no un texto de BE: una comprobación que busque esa palabra en toda la pantalla lo va a encontrar.

17. **Menores, de antes.**
    - El historial es una lista numerada automática, y su numeración va al revés que las versiones (`PLN:186-195`; `CSS:999-1006`; `REL:1273`).
    - `EJE` identifica la versión por su fecha y `PLN` por su número (`REL:1248`).
    - `SEG\registro-original.tsx:41` lleva a «Ejecuciones» sin decir qué sesión: llega a los últimos 7 días, donde esa sesión puede no estar. DEC-23.
    - El retorno del inicio de sesión admite la pestaña solo con `id` (`WEB\lib\copy.ts:22-43`; `REPO\scripts\retorno-seguro.test.mjs:21`): quien pierde la sesión en Plan vuelve al Resumen del área (`ENT:80`).
    - La ayuda del RIR pega dos frases sin punto (`EDI:611`; `REL:1272`).

## 2. Región por región

### 2.0 El marco del área (común a las cuatro áreas; `M24P:15-28`)

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Contenedor | Todo el ancho, 32 px a cada lado (`MQ\plano.css:113`) | `main.contenido.contenido--ancho`, 76 rem (`PAG:17`; `CSS:468-478`) | Clase nueva (E-02). DEC-3 |
| Volver | `volver` + «Volver a la ficha, donde estabas» (`M24P:17`) | El enlace existe solo si se llegó desde la ficha (`ADV\retorno-y-preparacion.tsx:25-42`; `ENT:82, 101`). Siempre están las migas «Espacio profesional › Ficha del asesorado › Entrenamiento» (`ENT:99`; `WEB\components\migas.tsx:24-26`) | La clase `.retorno-a-la-ficha` y las palabras «Volver a la ficha» las busca `RC` (§7.1). Sin `volver`, «donde estabas» no es cierto. DEC-2. `GUIA:286-288` todavía dice que las pestañas de área llevan migas |
| Título | `h1` «Entrenamiento» + «Ana Ruiz · Asesorado · 5db647» (`M24P:18`) | `h1` (`ENT:100`). La persona no se nombra en toda el área (`REL:12`) | El nombre visible llega con los vínculos (`advisee.displayName`); el alias no existe (DL-040, fuera de alcance: `WP:259`). Es una lectura nueva en la pestaña, la misma de la ficha (`ADV\workspace.tsx:94, 111, 162`), que no gasta el cupo **[supongo, por lo que dice el plan del Espacio profesional, §6]** |
| Acceso | `acceso` + «Acceso actual · Entrenamiento · Activo» (`M24P:19-20`) | No está en la pestaña | Con las palabras de BE: `estadoParaMostrar` (`ADV\workspace.tsx:290-297`). Si una lectura o una escritura de la pestaña responde «no disponible», el marco no puede seguir diciendo «Activo» (`ENT:84-89`) |
| Actualizar | Botón + «Consultado a las 10:32» (`M24P:21-22`) | No existe: cada vista tiene su lectura (`PLN:55`; `EJE:64`; `EDI:144`) | «Actualizar» vuelve a leer todo lo que la vista muestra (E-58, `WP:192`). La hora es la del navegador al recibir la respuesta (`WEB\lib\formato.ts:14`). Con cambios sin guardar: DEC-4 |
| Pestañas | `resumen` Resumen · `plan` Plan · `lista` Registros · `revision` Revisiones (`M24P:26`) | Las cuatro, sin ícono; la tercera dice «Ejecuciones» (`ENT:29-34, 110`) | Cambia el texto, no la clave: `vista=ejecuciones` sigue (E-03, `WP:107`; `H\paginas.mjs:40`; `SEG\registro-original.tsx:41`). Siguen siendo enlaces con `replace` y conservan `volver` (`ENT:110`) |
| Ayuda | `ayuda` + «Cómo se lee esta vista» (`M24P:27`) | Ayudas sueltas: `EDI:301-304, 930-932`; `EJE:148-151`; `SYT:139-148`; `CMP:510-515, 767-774`; `IMP:181-183` | Una por vista (C-04). Las que explican un diálogo o el buscador quedan en su lugar |
| Estados del área | No dibujados | Sin sesión, cargando, falla, sin espacio profesional (`ENT:92-95`); «no disponible», el mismo texto para lo inexistente, lo ajeno y lo revocado (`ENT:54-63, 68`); una escritura denegada saca todo el contenido de la pestaña (`ENT:84-89, 102`) | Se conservan los seis. El `h1` y el camino de vuelta tienen que estar en todos |

### 2.1 Maqueta 24 · el plan activo (`PLN`, `OPS`)

| Región | Maqueta (texto exacto) | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | `h2` «Versión» + segmentos «4 · en preparación» y «3 · activa» (`M24:38-39`) | Sin selector. Con borrador: el editor entero y, debajo, «Plan activo» (`PLN:128-141, 154-158`) | DEC-5. Sin borrador no hay nada que elegir: queda «Plan activo», como en la maqueta 16 (`MQ\partes\16-cuerpo.html:36`) |
| Estado | Etiqueta «Solo lectura» + «Activada el 1 sept · es lo que ve el asesorado» (`M24:40`) | Insignia «Activo» (`PLN:155-157`) y «Versión N · activada el {fecha y hora}» (`PLN:264-266`) | La fecha, sin año si es de este año (E-57). Se pierde la hora de activación: DEC-11 |
| Acción | `plantillas` + «Guardar como plantilla» (`M24:41`) | Botón y diálogo (`PLN:161-177`; `PLT:27-122`) | Igual. Al guardar, el selector de plantillas se vuelve a cargar (`PLN:52, 149, 174`) |
| Bloque | «Bloque **Fuerza: progresión** · 2 sesiones · Propósito: más carga, menos repeticiones» (`M24:44`) | Todos los bloques abiertos: nombre y « · propósito» (`PLN:272-277`) | Con un bloque es texto; con más, se elige. «2 sesiones» se cuenta en la pantalla. DEC-13 |
| Microciclo | No dibujado | «Microciclo: {nombre} · {propósito}» (`PLN:278-288`) | Un renglón entre el bloque y la sesión (C-81) |
| Sesión | Segmentos «A · Tren inferior» y «B · Tren superior» + «Sin día asignado: tu asesorado elige cuál hace.» + «3 ejercicios · 12 series» (`M24:46-51`) | Todas las sesiones abiertas (`PLN:229-258, 289-291`) | Texto nuevo (C-80), cierto: el teléfono muestra todas (`CE:489-492`). El nombre es texto libre de hasta 120 caracteres (`CE:267`): DEC-13 |
| Indicaciones | «Indicaciones de la sesión» + el texto (`M24:52`) | Un párrafo sin rótulo (`PLN:234`) | El rótulo ya existe (`COPE:108`). Sin indicaciones, el renglón no va |
| Ejercicio abierto: cabecera | `entrenamiento` + nombre + «4 series · criterio de intensidad: RIR» + `arriba` (`M24:57`) | Imagen chica, si tiene, y nombre (`PLN:238-241`) | `cantidadDeSeries` (`COPE:50`), `ETIQUETA_DE_CRITERIO` (`COPE:47`), `sinCriterio` (`COPE:95`). Es un botón con `aria-expanded`. La imagen: DEC-12 |
| Tabla de series | Título «Lo que recibe tu asesorado»; «Serie · Carga sugerida · Rep. · RIR · Descanso recomendado · Nota» (`M24:60-65`) | «Serie · Carga · Rep. · RIR (solo si aplica) · Descanso recomendado»; lo heredado dice « · de la prescripción»; las bases van en el título (`OPS:112-166`; `PLN:247-252`) | **La nota de cada serie llega y hoy se descarta** (`CS:123`; `OPS:104-106`): C-69. « · de la prescripción» sale de acá (`CRIT:177`). La columna RIR sigue apareciendo solo si hace falta (`PLN:250`). «Sin objetivo» se conserva (`COPS:39`; `OPS:94`) |
| Lo general | «Intensidad · RIR 2», «La carga se cuenta · carga externa total», «Las repeticiones · por serie», «Notas · …» (`M24:67-75`) | Una lista: la intensidad con su referencia, cada parámetro y «Notas: …» (`PLN:222-227, 242-246`) | Los parámetros y la referencia del % RM no están dibujados: DEC-12. Una base sin declarar no ocupa fila (`OPS:130-131`) |
| Ejercicios cerrados | «Remo con barra · 4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00»; «Dominadas · 4 × 6 rep. · sin criterio de intensidad · descanso 02:00» (`M24:79-84`) | No existe | Texto nuevo y calculado: DEC-10. `seriesPlanificadas` ya da «4 × 8-10», con guion y sin «rep.», y tiene prueba (`DOM\presentacion-de-prescripcion.ts:29-37`): no se toca, se escribe otra función |
| Historial | «Versión 3 · activada el 1 sept · vigente»; «Versión 2 · activada el 3 ago · anterior, conservada» (`M24:87-93`) | Una sección aparte, con insignia «Activo» o «Anterior» (`PLN:182-196`) | Al costado, 340 px. Las palabras: DEC-11. Sin enlaces: una versión anterior no se abre, hoy tampoco |
| Huella | «Huella de la instantánea: 8c1e47a2b90f3d56…», al pie del historial (`M24:94`) | Arriba del plan (`PLN:267-271`) | Es la de la versión que se mira (`CE:367`) |

### 2.2 Maqueta 25 · los registros (`EJE`, `SYT`, `CMP`)

| Región | Maqueta (texto exacto) | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | `h2` «Sesiones registradas» + «Lo indicado y lo registrado, serie por serie. Lo que no se registró dice «Sin registrar»: no se interpreta.» (`M25:44`) | `h2` «Sesiones registradas», tercero de la página, después de los filtros y de la evolución (`EJE:174`) | Pasa a ser lo primero |
| Período | `calendario` + «Período: 11 – 27 sept 2026 · 17 días» (`M25:45`) | «Desde», «Hasta» y «Ver período»; vacío, los últimos 7 días; hasta 92, validado antes de pedir (`EJE:59, 113`; `ADV\periodo.tsx:20-47`; `API\entrenamiento\revisiones.service.ts:36-38`). Debajo, «Período: … a …» (`EJE:141-143`) | DEC-7. El período sigue fuera del estado de la lectura: si no se puede leer, el control sigue ahí (`ADV\periodo.tsx:4-6`) |
| Vistas | «Todas las sesiones 5» · `distinto` «Distinto de lo indicado 2» · `desvio` «Con desvío o no realizada 1» · «Con series sin registrar 1» (`M25:49-52`) | No existen | Se cuentan en el navegador. Reglas y nombres: DEC-14, DEC-15 y DEC-16. Una sesión puede estar en más de una vista |
| Más filtros | `filtros` + «Más filtros» (`M25:53`) | A la vista: «Versión del plan» y «Ejercicio» (`EJE:117-140`) | Adentro, los dos de hoy. El ejercicio se elige por su identidad en el catálogo, no por nombre (`EJE:75-79, 257-261`) |
| Lista | Columnas «Día · Sesión y condición · Series · Frente a lo indicado»; fila «26 sept, sábado · A · Tren inferior · Realizada con desvío · 7 de 10 registradas · 3 series sin registrar» (`M25:58-64`) | Una tarjeta por sesión, «{sesión} · {día} · {condición}», con «Ver detalle» (`EJE:297-302`) | La condición sale de lo que rige (`COPE:26-30, 43-45`). «N de M registradas» y la última columna se calculan (DEC-14, DEC-17). De la más nueva a la más vieja (C-68) |
| Días sin sesión | «**12 días del período sin sesión registrada.** Sin registro no quiere decir que no haya entrenado: no hay dato. Ver los días» (`M25:66`) | Sección «Días sin registro» con todos los días en un renglón, o «Ninguno.» (`EJE:192-196`) | La cantidad sale de `missingData` (`CE:759`). «Ver los días» abre la lista de hoy. Con cero días, se dice (no desaparece) |
| A Analizar | `analizar` + «¿Cómo viene progresando un ejercicio? Verlo en Analizar» (`M25:67`) | El bloque «Planificado y registrado»: evolución de un ejercicio, con su gráfico y su tabla (`EJE:145-171`) | DEC-21. Sale de la pestaña y queda en Analizar (punto 1.9) |
| Detalle: cabecera | «Detalle del registro» + `cerrar` «Cerrar»; «Sesión B · Tren superior»; etiquetas `reportado` «Reportado» y «Realizada» (`M25:71-72`) | «Ver detalle» despliega debajo de la fila (`EJE:301-302`) | Al costado (C-66). «Reportado» no llega (§3). «Sesión» no se antepone si el nombre ya empieza así (E-82, `WP:221`; los nombres por omisión son «Sesión A», `EDI:118`) |
| Detalle: cuándo | «Ocurrió el 24 sept a las 18:10 · se registró a las 19:22 · frente al plan versión 3, el de ese día» (`M25:73`) | «Registrado el {fecha y hora}» (`EJE:339`). Cuándo ocurrió y la versión, solo en el panel de la evolución (`CMP:796-799`) | Llegan los dos instantes y la zona (`CE:671, 676-677`). El número de versión: punto 1.10 |
| Detalle: la tabla | «Serie · Indicado · Registrado · Frente a lo indicado»; un renglón por ejercicio («Press de banca · 4 de 4 series registradas»); la serie distinta, en negrita: «RIR: por debajo» (`M25:76-91`) | Una tabla por ejercicio: «Serie · Plan de la serie · Registrado · Frente al plan · Descanso · Duración» (`SYT:102-131`). Y además, con los mismos datos: un gráfico con su tabla de valores, la lista de lo planificado y la del registro original (§4.3) | «Indicado» es `textoDelPlanDeLaSerie` (`COPS:192-195`), con prueba. «Registrado», `SYT:48-52`. Las palabras «por debajo», «por encima», «dentro del rango», «igual», «sin dato» ya existen (`COPS:220-229`). «Dentro de lo indicado» es nueva. La negrita sola no alcanza: el texto ya dice la diferencia |
| Detalle: tiempos | «Tiempos de la sesión · transcurrido 54:20 · pausas 03:10 · sin pausas 51:10 · `medido` Medido» (`M25:94`) | Una lista con cada tiempo y su calidad, más uno por ejercicio y «Sin ejercicio asignado» (`SYT:159-176`) | Cada uno de los tres tiempos trae su propia calidad (`CS:368`): una sola etiqueta vale si las tres coinciden; si no, cada una con la suya. Los estados de hoy se conservan (§4.3) |
| Detalle: pie | `descanso` «Descansos y duración de cada serie» · `plan` «Ver la sesión en el plan» (`M25:95`) | Dos columnas de la tabla (`SYT:110-111, 126-127`); lo planificado, en una lista dentro del detalle (`EJE:311-328`) | El primero abre, en el lugar, lo que hoy son esas dos columnas, los tiempos por ejercicio y la ayuda de las calidades. El segundo: DEC-20 |

### 2.3 Maqueta 28 · la versión en preparación (`EDI`, `OPS`, `HAB`, `PLT`, `IMP`)

| Región | Maqueta (texto exacto) | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Versión | «Versión» + segmentos + etiqueta «Borrador» + «El asesorado no la ve» (`M28:58-60`) | `h2` «Versión en preparación» + insignia «Borrador» + una ayuda plegada (`EDI:298-304`) | La nota de la plantilla de origen, el bloqueo por la app y el objetivo más nuevo (`EDI:305-323`) no están dibujados: van debajo de este renglón (§4.4) |
| Estado y acciones | «● Cambios sin guardar» · menú «Más acciones de esta versión» · «Validar plan» · `activar` «Activar plan» · «Guardar cambios» (`M28:62-66`) | Al pie de la página: el estado en un renglón (`EDI:400-402`) y cuatro botones: «Guardar borrador», «Validar plan», «Activar plan», «Guardar como plantilla» (`EDI:423-436`) | Suben arriba. El estado conserva `aria-live` y sus tres valores («Guardando…»). «Guardar como plantilla» va al menú (C-78). «Activar plan»: DEC-6. El aviso con la lista de problemas tiene que verse desde arriba (`EDI:408-421`) |
| Bloque | Segmentos «Fuerza: progresión» y «+ Agregar»; menú «Cambiar el nombre de este bloque, organizarlo por microciclos o quitarlo»; «2 sesiones»; «Propósito … Cambiar» (`M28:70-76`) | Cada bloque abierto, con «Nombre del bloque» y «Propósito profesional (opcional)» siempre a la vista (`EDI:326-334`), y sus botones al pie (`EDI:356-378`) | «Organizar por microciclos» existe solo si el bloque no tiene sesiones (`EDI:366-370`); «Quitar bloque», solo si hay más de uno (`EDI:373-377`). El menú tiene que decir por qué una opción no está. DEC-26 |
| Sesión | Segmentos + «+ Agregar ▾»; menú «Cambiar el nombre de esta sesión, guardarla como habitual o quitarla»; «Sin día asignado…»; «3 ejercicios · 12 series» (`M28:77-83`) | Cada sesión abierta, con «Nombre de la sesión» e «Indicaciones (opcional)» a la vista (`EDI:255-261`), «Guardar como habitual» y «Quitar sesión» (`EDI:283-290`); «Agregar sesión» y el selector de sesión habitual, al pie del bloque (`EDI:363-365, 379`) | «Agregar ▾» junta la sesión nueva y la habitual (`CRIT:203`). El selector de habituales existe solo si hay alguna (`HAB:244`) |
| Indicaciones | «Indicaciones de la sesión … Cambiar» (`M28:84`) | Un área de texto siempre abierta (`EDI:258-261`) | Sin indicaciones: «Agregar indicaciones» **[supongo: no está dibujado]** |
| Ejercicio abierto: cabecera | `entrenamiento` + nombre + «4 series» + «⋯ Más» + `arriba` (`M28:88-91`) | Imagen chica y nombre (`EDI:582-585`); «Quitar {nombre}» al pie (`EDI:825-827`) | En «Más» va, por lo menos, «Quitar {nombre}». No hay reordenar ni duplicar: no entran (`CRIT:456-457`) |
| Series | Una tabla: «Serie · Repeticiones · Carga sugerida · RIR · Descanso · Nota»; cada celda, un campo; en gris, lo que toma de lo general; «Sin objetivo ▾» en la misma celda (`M28:94-100`) | Por cada serie, una caja con cinco campos; tres de ellos con su casilla «Sin objetivo en esta serie» y su renglón de ayuda (`EDI:727-775`; `OPS:61-86`) | Es el punto 1.5. La columna RIR existe solo con el criterio RIR (`EDI:748`). Los rótulos de hoy dicen cómo llenar cada campo (`EDI:735, 751`): no pueden desaparecer. DEC-24, DEC-25, DEC-28 |
| Pie de las series | «+ Agregar serie» · «En gris, lo que la serie toma de lo general. Escribí un valor para que tenga el suyo, o elegí «Sin objetivo». Es lo que recibe tu asesorado.» · «Quitar la última serie» (`M28:101-105`) | Los dos botones (`EDI:776-786`) y, debajo, la tabla «Así lo ve tu asesorado» (`EDI:787`; `OPS:169-172`) | La tabla de vista previa sale (C-76): la que se edita ya muestra lo que resuelve `objetivosEfectivos` (`DOM\objetivos-por-serie.ts:74-89`). Hasta 20 series (`CE:252`) |
| Lo general | «Lo general del ejercicio · Todo es opcional»: «Criterio de intensidad», «Objetivo (RIR)», «Carga sugerida» con su unidad, «Descanso recomendado», «Notas» (`M28:108-116`) | Cuatro grupos con sus ayudas: el criterio y su objetivo (`EDI:586-637`), la carga, la unidad y cómo se cuenta (`EDI:638-688`), el descanso en segundos (`EDI:689-704`) y las notas (`EDI:821-824`) | Con un criterio elegido, el objetivo **no** es opcional (`EDI:621-622`): «Todo es opcional» no es cierto así (§4.6). Con % RM aparece la referencia (`EDI:625-634`), sin dibujar. El descanso: DEC-25 |
| A un clic | `abajo` «Cómo se cuentan la carga y las repeticiones» · `mas` «Agregar parámetro» (`M28:117`) | Dos listas siempre a la vista (`EDI:669-686, 709-726`) y el grupo de parámetros (`EDI:789-820`) | Si ya hay una base elegida o algún parámetro, el bloque se abre solo: no se esconde un dato cargado **[supongo]** |
| Ejercicios cerrados | Los mismos renglones de la 24 (`M28:122-127`) | No existe | DEC-10. Acá el renglón sale de lo escrito y todavía sin guardar |
| Agregar ejercicio | `mas` «Agregar ejercicio» + «Del catálogo BE, de tus habituales o creado a mano» (`M28:128-131`) | «Agregar ejercicio» abre un buscador dentro de la sesión (`EDI:275-282, 833-972`) | El buscador no está dibujado (`CRIT:599`). Falta nombrar «importado de wger» (`EDI:949-966`). DEC-29 |

### 2.4 Estados (`CRIT:222-235`; no hay una maqueta de estados para estas pantallas)

| Estado | Hoy | Con el bloque de estado |
|---|---|---|
| Cargando una vista | «Cargando…» (`ENT:67`; `WEB\components\estados.tsx:15-21`) | Que diga qué se carga. Los recorridos esperan a que no quede ningún `.cargando` (`R:142-153`): el bloque nuevo no lleva esa clase |
| No se pudo leer | «No pudimos cargar esta vista.» sin motivo (`ENT:69`; `EDI:243`) | Con el motivo (`WEB\lib\fallas.ts:19-32`) |
| No se pudo leer el plan de una versión, en los registros | Nota dentro del detalle (`SYT:94`) | «No pudimos completar esta parte»: la fila dice que lo indicado no se pudo leer, con «Reintentar» |
| No se pudieron leer los tiempos | «No pudimos leer los tiempos de esta sesión.» + «Reintentar» (`SYT:150-157`) | Igual, dentro del detalle |
| Sin objetivo | «Para planificar, primero definí el objetivo en Resumen…» (`PLN:122-126`) | Sin datos, con lo que falta. Sin objetivo no se ofrece crear (`PLN:142, 151`) |
| Sin plan activo | «Todavía no hay un plan activo.» (`COPE:75`; `PLN:158`) | Sin datos, con la acción: DEC-9 |
| Sin versiones activadas | «Todavía no se activó ninguna versión.» (`PLN:185`) | Igual, en el historial |
| Sin sesiones en el período | «Todavía no hay sesiones registradas en este período.» (`COPE:125`; `EJE:175`) | Sin datos: que no es un cero, y cuántos días tiene el período |
| El filtro o la vista no deja ninguna | «Ninguna sesión registrada del período coincide con el filtro.» (`EJE:176`) | Sin coincidencias: cuántas hay en el período y «Quitar los filtros» |
| Sin acceso | El mismo texto para todo (`ENT:54-63`) | Igual |
| El contenido cambió | «Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.» (`WEB\lib\intento.ts:49-53`; `EDI:188`) | El criterio pide «Actualizar la vista» y que lo escrito se conserve (`CRIT:235`). Hoy no hay botón y actualizar descarta lo escrito (`EDI:144-156`): DEC-4 |
| No se sabe si se guardó | «No pudimos confirmar el resultado. Reintentá.» (`EDI:236`) | Igual |

### 2.5 En 1280 y en 1024 (`CRIT:258-259`); 768 y 390

| Pantalla | 1280 | 1024 | Qué cuidar |
|---|---|---|---|
| Plan activo | «El historial se angosta» | «El historial va debajo; lo general del ejercicio, debajo de la tabla» | A 1280, a la tabla de seis columnas le quedan unos 480 px **[estimo]**: «Nota» baja de renglón |
| Registros | «En el detalle, «Indicado» y «Registrado» pasan a dos renglones» | «El detalle se abre encima de la lista» | El corte de la línea de tiempo es 75 rem (`SEG\linea-de-tiempo.tsx:84-85`): conviene el mismo |
| Editor | Sin regla escrita | Sin regla escrita | DEC-30 |
| 768 y 390 | — | — | No es el objetivo, pero no se rompe (`GUIA:225-226`). Una tabla de campos no se convierte sola en tarjetas: se desplaza dentro de su caja (`.desplazable-x`) |

## 3. Qué dato llega y qué no

| Lo que muestra el diseño | ¿Llega? | Operación y campo | Con lo que hay |
|---|---|---|---|
| «Versión 3» | **No** como número | API-TRN-08, la lista de versiones (`CE:378-380`) | El orden de activación (`PLN:38-42`), con la lista leída entera |
| «4 · en preparación» | **No** | — | Las activadas más uno. Hay un solo borrador por plan (`PLN:8`). DEC-5 |
| «Activada el 1 sept» | Sí | `activatedAt` (`CE:365`) | — |
| «es lo que ve el asesorado» | Sí | `isEffective` (`CE:363`) | Con el seguimiento cerrado, ninguna versión es la efectiva **[supongo, por `REL:901`]** |
| Bloque, propósito, sesiones, indicaciones | Sí | API-SER-01 (`CS:155-177`) | — |
| «2 sesiones», «3 ejercicios · 12 series» | **No** | — | Se cuentan |
| Criterio y objetivo de intensidad, con su referencia | Sí | `intensity` (`CS:145`; `CE:294-297`) | `intensidadPlanificada` (`DOM\presentacion-de-prescripcion.ts:40-45`) |
| Por serie: carga, repeticiones, RIR y descanso | Sí | `sets[].target` y `targetOrigin` (`CS:129-131`) | Es lo que recibe el teléfono, ya resuelto |
| La nota de cada serie | Sí; hoy no se muestra | `sets[].note` (`CS:123`) | — |
| Cómo se cuentan la carga y las repeticiones | Sí | `loadBasis`, `repetitionBasis` (`CS:148-149`) | `COPS:113-122` |
| Notas y parámetros del ejercicio | Sí | `note`, `professionalParameters` (`CS:150-151`) | — |
| La huella | Sí | `snapshotDigest` (`CE:367`) | 16 caracteres (`PLN:269`) |
| El renglón de un ejercicio cerrado | **No** | — | Se arma. DEC-10 |
| El período de los registros | Sí | API-TRN-21 `period` (`CE:753`) | — |
| Las cuatro cantidades de las vistas | **No** | — | Se cuentan sobre `registeredExecutions` (`CE:756`), que llega entera |
| «sábado» | **No** | `date` (`CE:670`) | Se calcula de la fecha civil |
| La condición de la sesión | Sí | `sessionCondition` de lo que rige (`CE:634, 673-675`) | `registroVigente` (`COPE:26-30`) |
| «7 de 10 registradas» | **No** | Lo planificado: `plannedSession.prescriptions[].sets` (`CE:298, 672`). Lo registrado: `exercises[].sets` (`CE:596`) | `compararEjecucion` ya une las dos cosas, serie por serie (`CDE:220-275`) |
| «2 series con diferencias», «Dentro de lo indicado» | **No** | El objetivo de cada serie viene de API-SER-01 de la versión de ese día (`EJE:92-104`) | Las relaciones ya existen (`DOM\relacion-con-el-objetivo.ts:21-56`). Falta la regla que las junta: DEC-14 |
| «12 días del período sin sesión registrada» | Sí | `missingData` (`CE:759`) | — |
| «Ocurrió… · se registró…» | Sí | `occurredAt`, `recordedAt`, `timeZone` (`CE:671, 676-677`) | — |
| «frente al plan versión 3» | El plan, sí; el número, **no** | `planId` (`CE:666`); `activePlanVersions` trae solo las del período, sin número (`CE:755`) | Una lectura más: la lista de versiones |
| «Reportado» | **No existe** | `CE:533-539` (la serie) y `CE:662-678` (la sesión) no traen la clase del dato; en Analizar, las series de entrenamiento van con `dataClass: null` (`DOM\entrenamiento-del-analisis.ts:153, 184, 224`) | Pide ampliar (abajo) |
| «Tiempos de la sesión», con su calidad | Sí | API-TIE-03 `session`, cada duración con su `quality` (`CS:319, 368`) | Una lectura por sesión abierta |
| Descansos y duración de cada serie | Sí | `rests`, `timedSets` (`CS:333-354, 372-373`) | `textoDeDescanso` (`COPS:211-217`), con prueba |
| Quién corrigió, cuándo y por qué | Sí; no está dibujado | `corrections[]` (`CE:641-651`) | DEC-19 |
| El motivo de la sesión | Sí; no está dibujado | `reason` (`CE:635`) | §4.3 |
| «Cambios sin guardar» | Es de la pantalla | `EDI:128, 401` | — |
| «Consultado a las 10:32» | **No** | — | El reloj del navegador |
| «Ana Ruiz» | **No existe** | — | DL-040 |
| «Acceso actual · Activo» | Sí | Los vínculos (`ADV\workspace.tsx:290-297`) | — |

**Pide ampliar la API o el dominio. No está en los pasos.**
1. **La clase del dato de una sesión o de una serie («Reportado»).** No está en `CE:533-539` ni en `CE:662-678`. Es C-09, que `WP:260` dejó «para decidir». Sin eso, la etiqueta no se dibuja: una constante escrita en la pantalla afirmaría un dato que la lectura no trae (una corrección la puede haber hecho el profesional: `CE:649`).
2. **Que «Distinto de lo indicado» de la línea de tiempo cuente lo mismo que la vista de los registros.** La línea de tiempo filtra por rasgos que calcula la API, y para una sesión hay tres: resumida, no realizada y con desvío (`DOM\dia-de-la-linea.ts:47-49`). La diferencia serie por serie no es un rasgo.
3. **El número de versión dentro del contexto de revisión** (`CE:755`). Se resuelve con una lectura que ya existe; si se quisiera ahorrar, es un campo nuevo.
4. **El alias del asesorado** (DL-040), para el marco.

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 El marco del área

| # | Qué | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | Las migas, con dos enlaces | `ENT:99` | Se van, como en la ficha. El camino a la ficha queda en el enlace de arriba y el del Espacio profesional, en la barra. DEC-2 |
| 2 | «Volver a la ficha», solo si se llegó desde ella | `ENT:101` | En el marco. Sin `volver`, con otras palabras |
| 3 | El estado «no disponible» y el que saca toda la pestaña tras una escritura denegada | `ENT:54-63, 84-89, 102` | El marco se queda con el título y el camino de vuelta; sin pestañas ni contenido (como `ADV\workspace.tsx:213-227`) |

### 4.2 El plan activo (maqueta 24)

| # | Qué | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | El aviso de lo que se acaba de hacer (éxito abajo; error con el foco) | `PLN:112-121` | Igual. Son cuatro: el borrador creado (`PLN:90`), el creado desde una plantilla (`PLN:104`), el plan activado (`PLN:136`) y la plantilla guardada (`PLN:175`) |
| 2 | «Para planificar, primero definí el objetivo en Resumen…» | `PLN:122-126` | Arriba de todo, como estado |
| 3 | «Crear plan» o «Crear nueva versión a partir de esta» | `PLN:142-148` | DEC-9 |
| 4 | «Empezar desde una plantilla»: lista y botón, o «No tenés plantillas activas para aplicar.» | `PLN:149`; `PLT:125-156` | DEC-9 |
| 5 | El error «Esa plantilla está archivada…» | `PLN:103` | Igual |
| 6 | «Todavía no hay un plan activo.» y «Todavía no se activó ninguna versión.» | `PLN:158, 185` | §2.4 |
| 7 | El microciclo, con su nombre y su propósito | `PLN:278-288` | Un renglón de selector (C-81) |
| 8 | La imagen del ejercicio | `PLN:239` | DEC-12. `RW:342-344` cuenta las imágenes |
| 9 | Los parámetros del ejercicio y la referencia del % RM | `PLN:222-227` | DEC-12 |
| 10 | « · de la prescripción» en cada valor heredado | `OPS:93-101` | Sale del plan activo y queda en el editor, como el gris (`CRIT:177`). `RW:263, 333` lo quitan antes de comparar |
| 11 | La hora de activación | `PLN:191, 265` | DEC-11 |
| 12 | Todas las sesiones y todos los ejercicios a la vez | `PLN:272-293` | Una sesión elegida y un ejercicio abierto (C-69). Para comparar dos sesiones hay que cambiar de una a otra: es la decisión del diseño |
| 13 | «Sin criterio de intensidad», dicho | `PLN:223`; `COPE:95` | En la cabecera del ejercicio y en su renglón cerrado (`M24:83`) |

### 4.3 Los registros (maqueta 25)

| # | Qué | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | La evolución de un ejercicio: gráfico, panel de valores, tabla, capas, variable y serie | `EJE:145-171`; `CMP:701-1058` | En Analizar, donde ya está (`SEG\contraste.tsx`). DEC-21 |
| 2 | La ayuda «Qué entra en la comparación», con el aviso de ejercicios con el mismo nombre | `EJE:148-151` | En «Cómo se lee esta vista»; el aviso de homónimos, junto al filtro «Ejercicio» |
| 3 | Los filtros «Versión del plan» y «Ejercicio» | `EJE:117-140` | «Más filtros» |
| 4 | «Desde», «Hasta», «Ver período» y sus dos errores | `ADV\periodo.tsx:29-46` | Dentro del control del período. DEC-7 |
| 5 | El gráfico de barras por serie, con su variable, sus capas, sus botones de serie y su teclado | `CMP:383-468, 520-617` | DEC-18 |
| 6 | El panel «Valores de la serie» | `CMP:269-353` | DEC-18 |
| 7 | La «Tabla de valores» por ejercicio y variable | `CMP:639-685` | La tabla nueva la reemplaza: dice las tres variables a la vez. DEC-18 |
| 8 | Los avisos de otro ejercicio, de resumen y de registro sin determinar | `CMP:485-518` | En el renglón del ejercicio, dentro de la tabla. Con los textos del dominio (`CDE:680-684`) |
| 9 | Lo general de cada ejercicio y las indicaciones de la sesión | `EJE:311-328` | «Ver la sesión en el plan». DEC-20 |
| 10 | «Corrección vigente»: quién, cuándo, el motivo y el registro corregido | `EJE:329-337` | DEC-19 |
| 11 | «Registro original»: cuándo se registró, la condición, cómo se registró y el motivo | `EJE:338-340, 212-216` | Cuándo y la condición, en la cabecera. **El motivo es lo que escribió la persona** («Viaje laboral»): va a la vista, bajo el título. Cómo se registró («Por serie»), junto a la condición |
| 12 | «Planificado: X · Ejecutado: Y» + «Sustituido» | `EJE:220-224` | En el renglón del ejercicio |
| 13 | El esfuerzo percibido de una serie | `EJE:236`; `CMP:238` | En la celda «Registrado», si vino. Hoy la APK lo deja vacío (`REL:1279`) |
| 14 | El resumen de un ejercicio o de la sesión, cuando no hay series | `EJE:242, 246` | En el renglón del ejercicio y bajo el título. Las series dicen «Registro resumido» (`SYT:124`) |
| 15 | «Historial de correcciones» | `EJE:341-352` | DEC-19 |
| 16 | Las columnas «Descanso» y «Duración» | `SYT:110-111, 126-127` | «Descansos y duración de cada serie» |
| 17 | El tiempo de cada ejercicio y «Sin ejercicio asignado» | `SYT:167-174` | Ahí mismo |
| 18 | La ayuda «Qué dice cada tiempo» | `SYT:139-148` | La calidad sigue al lado de cada tiempo; la explicación, en «Cómo se lee esta vista» |
| 19 | «Esta sesión no tiene tiempos marcados en la app.» y «La sesión se cerró sin afirmar cuándo terminó…» | `SYT:158, 177` | En el renglón de tiempos |
| 20 | «No planificada» y «—» | `SYT:123-125` | En la celda «Indicado». La raya sola se reemplaza por palabras (C-51 lo pide para Nutrición) |
| 21 | La nota «No se pudo leer el plan de cada serie de esa versión…» | `SYT:94` | §2.4 |
| 22 | La lista de días sin registro, y «Ninguno.» | `EJE:194-195` | «Ver los días» |
| 23 | Abrir una sesión desde un punto de la evolución, con el foco | `EJE:106-109, 286-295` | Se va con la evolución. Desde Analizar: DEC-21 |

### 4.4 El editor, control por control (maqueta 28)

| # | Control o texto de hoy | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | Ayuda «Qué es una versión en preparación» | `EDI:301-304` | «El asesorado no la ve» ya está a la vista; «Guardar no activa» y la nota de la versión de origen, en «Cómo se lee esta vista» |
| 2 | «Creada desde la plantilla «X», versión N…» | `EDI:305`; `PLT:159-173` | Un renglón bajo el título |
| 3 | El aviso «Todavía no podés activar este plan» y el de «ya usa una versión de BE que muestra…» | `EDI:306-318` | Bajo el título, atado a «Activar plan». `RW:304-311, 321-322` lo buscan |
| 4 | «Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.» | `EDI:319-323` | Bajo el título |
| 5 | «Nombre del bloque» | `EDI:333` | Menú del bloque: «Cambiar el nombre» |
| 6 | «Propósito profesional (opcional)» + «Texto libre: BE no fija tipos de bloque.» | `EDI:334` | «Cambiar», a la derecha; la ayuda, dentro de ese diálogo |
| 7 | «Agregar sesión» | `EDI:345-347, 363-365` | «+ Agregar ▾» |
| 8 | «Agregar una sesión habitual» + «Agregar esta sesión habitual» | `EDI:352, 379`; `HAB:242-271` | Dentro de «Agregar ▾», con el mismo texto de cada opción (`HAB:252`). El aviso «Sesión habitual agregada al borrador…» se conserva (`EDI:175`) |
| 9 | «Organizar por microciclos» | `EDI:366-370` | Menú del bloque y estado vacío del bloque |
| 10 | «Agregar microciclo» | `EDI:357-360` | «+ Agregar» del renglón «Microciclo» |
| 11 | «Nombre del microciclo», su propósito y «Quitar microciclo» | `EDI:341-342, 348-350` | Menú del microciclo |
| 12 | «Quitar bloque» | `EDI:373-377` | Menú del bloque |
| 13 | «Agregar bloque» | `EDI:383-385` | «+ Agregar» del renglón «Bloque» |
| 14 | «Nombre de la sesión» | `EDI:257` | Menú de la sesión |
| 15 | «Indicaciones (opcional)» | `EDI:258-261` | «Cambiar» |
| 16 | «Guardar como habitual» y su diálogo | `EDI:284-286, 455-466`; `HAB:129-239` | Menú de la sesión. El diálogo no cambia |
| 17 | «Quitar sesión» | `EDI:287-289` | Menú de la sesión |
| 18 | La imagen del ejercicio | `EDI:583` | En la cabecera del ejercicio abierto. DEC-12 |
| 19 | «Criterio» y su ayuda del RIR | `EDI:588-612` | «Lo general». La ayuda: DEC-28 |
| 20 | «Objetivo (% RM)» u «Objetivo (RIR)» | `EDI:615-624` | «Lo general» |
| 21 | «Referencia de la repetición máxima (opcional)» + su ayuda | `EDI:625-634` | «Lo general», solo con % RM |
| 22 | «Carga», «Unidad» y la ayuda de la carga sugerida | `EDI:638-668` | «Lo general». DEC-28 |
| 23 | «Cómo se cuenta la carga» | `EDI:669-686` | A un clic |
| 24 | «Descanso recomendado (segundos)» + su ayuda | `EDI:689-704` | «Lo general», escrito «02:30». DEC-25 |
| 25 | «Qué cuentan las repeticiones» | `EDI:709-726` | A un clic |
| 26 | «Serie N: repeticiones (un número o un rango, 8-12)» | `EDI:733-740` | La celda. El formato tiene que seguir dicho: DEC-28 |
| 27 | «Serie N: carga sugerida (kg)» + casilla + ayuda | `EDI:741-747` | La celda. DEC-24 |
| 28 | «Serie N: RIR objetivo (0 a 10)» + casilla + ayuda | `EDI:748-756` | La celda, solo con el criterio RIR |
| 29 | «Serie N: descanso (segundos)» + casilla + ayuda | `EDI:757-764` | La celda |
| 30 | «Serie N: nota (opcional)» | `EDI:766-772` | La celda |
| 31 | «Agregar serie» y «Quitar la última serie» | `EDI:776-786` | Igual, al pie de la tabla |
| 32 | La tabla «Así lo ve tu asesorado» | `EDI:787` | Sale (C-76). `RW:261-271` la lee: §7.2 |
| 33 | «Descanso / parámetros (opcional)»: cada parámetro con tres campos y «Quitar parámetro»; «Agregar parámetro»; la ayuda del tempo | `EDI:789-820` | A un clic. El grupo pasa a llamarse solo «Parámetros» **[supongo]**: el descanso ya tiene su campo (`REL:1270`) |
| 34 | «Notas (opcional)» | `EDI:821-824` | «Lo general» |
| 35 | «Quitar {nombre}» | `EDI:825-827` | «⋯ Más» |
| 36 | «Agregar ejercicio» | `EDI:866-872` | Igual |
| 37 | El buscador entero: buscar en el catálogo, la nota del catálogo de demostración, «Mis habituales», los resultados con «Marcar como habitual» y «Elegir {nombre}», «Crear manualmente», «Importar desde wger» y «Cerrar búsqueda» | `EDI:874-971`; `HAB:69-98`; `IMP:134-234` | DEC-29. Todo adentro, sin quitar nada |
| 38 | «Próxima revisión (opcional)» + su ayuda | `EDI:388-398` | En el diálogo de activar (C-41). DEC-6 |
| 39 | «Guardando…», «Hay cambios sin guardar.», «Guardado.» | `EDI:400-402` | Arriba, junto a los botones |
| 40 | El aviso de error con la lista «{dónde} → {problema}» | `EDI:408-421, 77-116` | Bajo el renglón de los botones. DEC-27 |
| 41 | «Validar revisa la forma del plan, no su calidad…» | `EDI:422`; `COPE:121` | «Cómo se lee esta vista» (`CRIT:203`). «El borrador no tiene problemas de estructura.» sigue (`COPE:120`) |
| 42 | «Guardar borrador» | `EDI:424-426` | «Guardar cambios» |
| 43 | «Validar plan», que guarda antes si hace falta | `EDI:427-429, 206-214` | Igual |
| 44 | «Activar plan», apagado con cambios sin guardar | `EDI:430-432` | Guarda antes. DEC-6 |
| 45 | «Guardar como plantilla» y su diálogo | `EDI:433-435, 443-453` | Menú de la versión |
| 46 | «Guardá los cambios antes de activar.» | `EDI:437` | Sale: ya no hace falta |
| 47 | El motivo por el que no se puede activar, atado al botón | `EDI:438-442` | Igual, arriba. `RW:307-311` lo comprueba |
| 48 | El diálogo «Activar plan» y sus cinco errores | `EDI:468-484, 230-236` | DEC-6 |

**Comportamientos del editor que no son un control, y se conservan:** cada cambio marca «sin guardar» y borra el aviso anterior (`EDI:162-167`); guardar manda la versión que se vio y, si hay un objetivo más nuevo, pasa el borrador a ese (`EDI:182-183`); después de guardar se vuelve a leer con API-SER-01 (`EDI:191-203`); un ejercicio nuevo entra con una serie sin repeticiones y sin criterio (`EDI:280`); quitar una sesión, un bloque o un ejercicio no pide confirmación, porque nada se guarda hasta «Guardar» (`EDI:271, 287, 374`).

### 4.5 La maqueta lo muestra y BE no lo tiene

- **No existe el dato:** «Reportado» en una sesión (§3) y el alias.
- **Hay que calcularlo en el navegador:** los números de versión; «2 sesiones» y «3 ejercicios · 12 series»; el renglón de un ejercicio cerrado; las cuatro cantidades de las vistas; «7 de 10 registradas»; «2 series con diferencias» y «Dentro de lo indicado»; el día de la semana; la hora de la consulta.
- **Es pantalla nueva sobre datos que llegan:** el selector de versión, de bloque y de sesión; un ejercicio abierto; la nota de cada serie en el plan activo; el historial al costado; las vistas; el detalle al costado, en una tabla; la celda de una serie; «Sin día asignado…».
- **Es una función que no existe y no entra** (`CRIT:456-457`): reordenar o duplicar un ejercicio, quitar una serie del medio, descartar el borrador. Tampoco abrir una versión anterior desde el historial (`REL:934`).

### 4.6 La maqueta dice algo que en BE no es así, o no dice lo que BE dice

| La maqueta | En BE | Qué hacer |
|---|---|---|
| «4 · en preparación» | Un borrador no tiene número (`GUIA:393-395`) | DEC-5 |
| «3 · activa» arriba y «vigente» en el historial | «Activo» y «Anterior» (`COPE:82-83`; `B1006` §9); «Vigente» es la palabra de la APK (`COPE:149`) | DEC-11 |
| «Indicado» y «Frente a lo indicado» | «Plan de la serie», «Frente al plan» (`SYT:107-109`); «Planificado» en Analizar (`CDE:643`) | Los encabezados nuevos se escriben en la pantalla; los textos del dominio, con prueba, no se tocan. Analizar sigue diciendo «Planificado» en ese componente. Se anota |
| «Distinto de lo indicado» = series distintas | En la línea de tiempo, las sesiones con desvío (`DOM\dia-de-la-linea.ts:264-270`) | DEC-15 |
| «Con desvío o no realizada», escrito en la pantalla | La guardia de `CP:219-231` | DEC-16 |
| «Reportado», junto a la sesión | No hay clase del dato en una sesión | No se dibuja (§3) |
| «Medido», una vez para los tres tiempos | Cada tiempo trae su calidad (`CS:368`) | Una etiqueta si coinciden; si no, cada una |
| «¿Cómo viene progresando un ejercicio?» | La pregunta dice «este ejercicio» (`DOM\preguntas-profesionales.ts:60`) | DEC-21 |
| «Sesión B · Tren superior» | El nombre es el que escribió el profesional; «Sesión» no se antepone si ya empieza así (E-82) | La regla de E-82 |
| «Lo general del ejercicio · Todo es opcional» | Con un criterio elegido, el objetivo es obligatorio (`EDI:621-622`) | DEC-28 |
| «Guardar cambios» | «Guardar borrador» (`COPE:118`) | Cambia el valor en el dominio (C-78). Solo lo usa `EDI:425` |
| El descanso, «02:30» | Se escribe en segundos (`EDI:691, 694`) | DEC-25 |
| «Del catálogo BE, de tus habituales o creado a mano» | Falta la cuarta entrada: importarlo de wger (`EDI:949-966`) | Sumarla al texto |
| No dibuja el plan sin RIR en una tabla | La columna RIR aparece solo si hace falta (`PLN:250`; `EDI:748`) | Igual que hoy |
| No dibuja el motivo de una sesión ni una corrección | Llegan (`CE:635, 641-651`) | §4.3, filas 10, 11 y 15 |

## 5. Pasos, en un orden que deja la pantalla funcionando

Cada compilación del website tarda unos minutos y reconstruye el dominio antes (`H\entorno.sh:31-37`); va con la API apagada (`H\entorno.sh:6`). `npm run typecheck` va antes de cada compilación. Los riesgos y los tamaños son **[estimo]**.

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Sin compilar: el «antes».** Plan (con el borrador y con «activa» sola), los registros (7 y 90 días, con una sesión abierta) y el editor, a 1440, 1280, 1024, 768 y 390, en los dos temas, sobre datos recién generados. Contar los controles del editor | — | Ninguno | `H\ver.mjs` con `plan=pro/advisees/training?id={a}&vista=plan` y `…&vista=ejecuciones#clic:Ver detalle` (la ruta, sin la barra inicial: `H\ver.mjs:5-7`) |
| 1 | **Sin compilar: lo que no es pantalla, en el dominio y con sus pruebas.** (a) El renglón de un ejercicio y las cuentas de una sesión. (b) Leer y escribir un descanso como «02:30». (c) Los registros: qué pasó con cada serie (registrada, sin registrar, con diferencias, no se compara), qué dice la fila de una sesión, y las vistas con su nombre, lo que traen y su cuenta. (d) Los textos nuevos, como cadenas. (e) Sumar a `CP` los módulos `.ts` nuevos que tengan texto | `DOM` (dos módulos nuevos y sus pruebas, `COPE`), `CP` | Bajo en (a), (b) y (d); **medio** en (c): son reglas nuevas, y de ellas salen números | `npm test`. Para (c): cada sesión del escenario cae en una fila que se puede escribir a mano; una sesión no realizada o resumida no cuenta «series sin registrar»; con el plan sin leer, nunca «Dentro de lo indicado» |
| 2 | **Compilación 1: el marco del área,** con el contenido de hoy adentro. El contenedor ancho; quién es, el acceso, «Actualizar» y la hora; las pestañas con ícono y «Registros»; los estados con su motivo; el diálogo de ayuda, todavía sin contenido. «Registros» también en `RES:226` y en `SEG\registro-original.tsx:41` | `ENT`, `PAG`, `COPE:71`, `CSS`, y la pieza común (DEC-1) | **Medio:** lo comparten cuatro áreas, y por acá pasan `RC:823-833` y `RC:1488-1540` | `typecheck`; compilar; `recorrido-comprension.mjs funcional` (CP-19, CP-20, CP-21); `ver.mjs` de las cuatro secciones |
| 3 | **Compilación 2: el plan activo** (maqueta 24). El selector de versión; el bloque y la sesión elegidos; un ejercicio abierto con su tabla (con la nota) y lo general; el historial al costado con la huella; crear versión y empezar desde una plantilla. **El editor de hoy sigue entero** dentro de «en preparación», sin tocarlo. La lista de versiones se lee completa | `PLN`, `OPS:90-166`, `PLT:125-156`, `CSS` | Medio | `typecheck`; compilar; el modo nuevo del recorrido (§7.4); `ver.mjs` con `#clic:` sobre cada sesión y cada ejercicio |
| 4 | **Compilación 3: los registros** (maqueta 25). La lista con sus vistas, «Más filtros», los días sin sesión y el detalle al costado, en una tabla. La evolución sale de la pestaña y queda el enlace. En Analizar, «Abrir la ejecución» deja de no hacer nada | `EJE`, `SYT`, `SEG\contraste.tsx:94`, `SEG\registro-original.tsx:136-160` (DEC-22), `CSS` | **Medio a alto:** se reescribe la vista, y lo que dice sale de las reglas del paso 1 | Lo mismo, con el período en 90 días; cada fila contra lo esperado, escrito a mano desde la API |
| 5 | **Compilación 4: el editor, la composición** (maqueta 28, primera mitad). Arriba, el estado y los botones; el bloque, el microciclo y la sesión como selectores con su menú; un ejercicio abierto con «Lo general» al costado; el buscador en su lugar nuevo. **Las series, todavía con los campos y las casillas de hoy** | `EDI:252-487, 538-726, 789-972`, `HAB:242-271`, `CSS` | **Alto:** es el archivo más grande y todo cambia de lugar | Armar una sesión de punta a punta por la pantalla, guardar, validar y volver a entrar: lo leído es lo escrito. Contar los controles |
| 6 | **Compilación 5: el editor, la celda y activar** (segunda mitad). La tabla de series con una celda por objetivo; el descanso como «02:30»; sale «Así lo ve tu asesorado»; «Activar plan» guarda antes y pide la próxima revisión | `EDI:727-788, 388-398, 423-442, 468-484`, `OPS:36-88, 169-172`, `CSS` | **Alto** (§«el paso más riesgoso», abajo) | Las nueve series de «Piernas A» del paquete de Dirección, escritas por la pantalla, dan en la API el mismo dato de tres estados que hoy. Con objetivos distintos por serie y la app vieja, «Activar plan» sigue apagado |
| 7 | **Mirar y medir, sin compilar.** Los cinco anchos, los dos temas, cada estado de §2.4, el teclado y axe | — | — | `ver.mjs` con `#falla:training/plans`, `#falla:review-context`, `#falla:/detail`, `#falla:/timing` |
| 8 | **Compilación 6: lo que salga de mirar.** Borrar las clases que quedaron sin uso: `.serie-del-editor`, `.campos-de-la-serie`, `.campo__casilla` (`CSS:2529-2558`) y, si ya nadie las usa, `.datos-de-tiempo` (`CSS:2561-2580`). **No** `.jerarquia`, `.nodo*`, `.fila-de-item`, `.items` ni `.buscador`: las usan el editor de Nutrición y las plantillas | `CSS`, el recorrido | Bajo | El recorrido del paquete; `H\paginas.mjs` para el «después» |
| 9 | **Una vez, al final:** los siete recorridos sobre datos recién generados, y la CI | — | — | Como en la parte 5 del primer paquete |
| 10 | **Documentos.** `GUIA` (II.3, las migas de las áreas, `:286-288`; II.6, el número del borrador, `:393-395`; II.1, si el detalle de una sesión se desplaza adentro, `:240-244`; II.8, las piezas nuevas); la definición del paquete, con la nota sobre «Ejecuciones» y `B1006`; el acta; `EVIDENCIA\DASHBOARD-COMPRENSION\GUIA-DE-DEMOSTRACION.md:33`, que nombra «Ver en Entrenamiento · Ejecuciones»; el `LEEME` de ENTRENAMIENTO-SERIES, si sus guiones quedan viejos (DEC-31) | Documentos | Bajo | — |

**Por qué este orden.** El marco va primero porque las tres pantallas cuelgan de él. El plan activo va antes que el editor porque el selector de versión es donde vive el editor, y porque el selector de sesión y el renglón de un ejercicio cerrado se hacen una vez y el editor los vuelve a usar. Los registros no dependen del editor: pueden ir antes o después. Si el plazo corta después del paso 3, queda el plan nuevo con el editor viejo adentro: se ve desparejo, pero anda. No conviene cortar entre el 5 y el 6 por mucho tiempo: quedaría la composición nueva con las series viejas, que miden casi lo mismo que hoy.

**El paso más riesgoso es el 6.**
- La celda tiene que escribir exactamente lo mismo que hoy escriben un campo y una casilla: la clave ausente, `null` o un valor (punto 1.5). Un error ahí no se ve en la pantalla del profesional: se ve en el teléfono del asesorado, o en un plan que no se deja activar.
- El descanso cambia de unidad al escribirse, y hoy un texto que no se entiende viaja como `NaN` para que el guardado lo frene.
- Sale la tabla que hoy sirve de control («Así lo ve tu asesorado»): lo que el profesional ve en gris pasa a ser la única vista previa.
- «Activar plan» pasa de un paso a dos escrituras seguidas, con el token de versión cambiando en el medio (`EDI:183, 195, 220`).
- Es justo lo que comprueba `RW`, que con el diseño nuevo ya no puede encontrar sus campos (§7.2).
- Baja el riesgo: escribir primero, como funciones puras con su prueba, «qué manda al guardado esta celda» y «cómo se lee un descanso»; y repetir por la pantalla las nueve series de «Piernas A», comparando lo que guardó la API con lo de hoy.

## 6. Comportamiento que hay que conservar

**Sesión y permisos**
- Sin sesión, a «Iniciar sesión» con retorno a la pestaña (`ENT:80, 92`). Solo viaja `id` (`WEB\lib\copy.ts:22-43`).
- El 404 dice lo mismo para lo inexistente, lo ajeno y lo revocado (`ENT:54-63, 68`). Una escritura denegada saca todo el contenido de la pestaña, no solo esa acción (`ENT:9-10, 84-89`).
- `useEntrenamiento`, `EstadoDeLectura` y `NoDisponible` los usan también `RES`, `REV`, `IMP` y `SYT`: su firma no cambia.

**Enlaces y parámetros**
- `vista=resumen|plan|ejecuciones|revisiones`, `volver` y `preparar=1` quedan igual (`ENT:76-77`; `ADV\retorno-y-preparacion.tsx:25-44`). Las pestañas conservan `volver` (`ENT:110`).
- Llegan con `vista=plan`: «Abrir» de un borrador pendiente en el Espacio profesional (`REPO\scripts\espacio-profesional.test.mjs:167`), «Ir a la planificación» del Resumen de la ficha (`SEG\resumen-area.tsx:102, 200`), el origen de una versión (`SEG\registro-original.tsx:42`) y «Abrir el borrador en Plan», después de aplicar una revisión (`REV:87-89`). **Si hay borrador, tiene que ser lo que se ve al llegar.**
- Llegan con `vista=ejecuciones`: el origen de una sesión (`SEG\registro-original.tsx:41`) y «Ver ejecuciones» del Resumen del área (`RES:225`).
- Se navega con el router, sin recargar: recargar cierra la sesión.

**Lecturas y límites**
- Al abrir Plan con borrador, hoy son cinco lecturas protegidas: la lista, el objetivo vigente, la versión activa y, en el editor, el borrador y otra vez el objetivo (`PLN:57, 64`; `EDI:146`). Las plantillas y los habituales no gastan el cupo (`API\entrenamiento\entrenamiento.controller.ts:160-163`; `API\entrenamiento\habituales.controller.ts:23-50`).
- Los gráficos se cargan recién cuando hacen falta (`EJE:52-55`): la vista de los registros no tiene que traer la biblioteca de gráficos al abrir.
- Los tiempos se piden al abrir una sesión, no antes (`EJE:303-306`; `SYT:81-83`).
- Una respuesta vieja no pisa a una nueva (`EJE:94-102`; `HAB:105-119`).

**Escrituras**
- Una clave por intento, y la misma al reintentar un resultado incierto (`PLN:53, 84-86`; `EDI:138, 220-221, 479`; `WEB\lib\intento.ts:18-38`).
- Guardar va con la versión que se vio, sin clave (`EDI:183`). «Validar plan» guarda antes si hace falta (`EDI:207`).
- Los cinco errores de activar se dicen dentro del diálogo, y el de la app vuelve a leer el borrador (`EDI:224-236`).

**Reglas de BE**
- Cada sesión se compara con la versión del plan que regía ese día, nunca con la de hoy (`SYT:5-6`; `CDE:5-7`).
- «No realizada» solo si la persona lo registró así. Una serie que falta es «Sin registrar», no «no realizada» ni cero (`CDE:12-15, 191-203`; `COPE:9-14`).
- Un día sin sesión no dice nada de la persona (`EJE:194`). Sin colores de acierto o de error, sin porcentajes, sin un total de «cuánto se hizo».
- Lo que rige es la corrección, si hay; el original no se pierde (`COPE:22-30`; `EJE:329-340`).
- El ejercicio se sigue por su identidad en el catálogo, no por su nombre (`CDE:26-34`).
- El RIR objetivo es un número, y el RIR de una serie existe solo con el criterio RIR (`DOM\objetivos-por-serie.ts:14-16, 99-108`).
- Activar es un acto aparte, con su consecuencia a la vista (`COPE:123`; `B1006` §24).
- Los textos de `COPS`, `CDE`, `DOM\presentacion-de-prescripcion.ts` y `DOM\compatibilidad-de-clientes.ts:82-89` tienen prueba: no se reescriben.

**Accesibilidad**
- Un `h1`, «Saltar al contenido» y `main#contenido` (`PAG:17`).
- Cada campo con su rótulo. En una tabla de campos, el nombre de cada celda sale de su fila y su columna («Serie 3: RIR»), y lo que toma de lo general se dice con `aria-describedby`, no solo con el gris.
- 44 px en cada objetivo (`M28:28, 31` los dibuja así); foco visible; el orden del documento es el que se ve.
- Lo elegido, con su estado (`aria-pressed`, `aria-current` o la opción nativa marcada); lo que se despliega, con `aria-expanded`, y se cierra con Escape y al salir con Tab (E-21, `WP:140`).
- El éxito de una acción no mueve el foco; un error lo recibe (`PLN:113-120`; `EDI:403-410`).
- Un diálogo es modal y devuelve el foco a quien lo abrió (`GUIA:98-108`).

## 7. Las pruebas y los recorridos que tocan estas pantallas

### 7.1 Lo que las toca hoy, línea por línea

| # | Dónde | Qué mira | Qué protege | Con el DOM nuevo | Cómo adaptarla |
|---|---|---|---|---|---|
| 1 | `CP:62-67` | Los textos de los `.tsx` sueltos en `T`: al menos siete archivos, cada uno con algún texto (`CP:104-109`) | Que Entrenamiento no tenga puntajes, juicios ni «%» fuera de «% RM» | Pasa, si los archivos nuevos son `.tsx` en `T` | Sumar a la lista los `.ts` con texto y cualquier subcarpeta |
| 2 | `CP:219-231` | Que ningún `.tsx` de `T` escriba «no realizad…» ni lea `execution.sessionCondition` | Que «No realizada» nunca salga de la falta de un registro | **Falla** si el nombre de la vista se escribe en la pantalla | El nombre sale del dominio (DEC-16) |
| 3 | `CP:126-158` | La ficha, con las tres listas; incluye `registro-original.tsx` y `contraste.tsx` | Lo mismo, en la ficha | Pasa | Nada |
| 4 | `DOM\contratos-wp06.test.ts:423-425` | Cada valor de `COPY_ENTRENAMIENTO`, como cadena | Las palabras del dominio | Se rompe si se le suma una función | Los textos con una variable van a otro objeto, con su prueba |
| 5 | `DOM\contratos-wp06.test.ts:427-431` | Cómo se comporta la lista: «% RM» pasa, «Intensidad 80 kg» no, «progresión» pasa | La lista misma | Pasa | Nada |
| 6 | `DOM\presentacion-de-prescripcion.test.ts:33-126` | «3 × 10», «3 × 8-12», una línea por serie cuando difieren | Que una pirámide no se muestre como series iguales | Pasa: esas funciones no se tocan | El renglón nuevo es otra función, con su prueba |
| 7 | `DOM\entrenamiento-por-serie.test.ts:311-312, 546-556` | Las cadenas exactas del plan de una serie, de un descanso y de una duración | Los textos de «Indicado», de los descansos y de los tiempos | Pasa: se usan tal cual | Nada |
| 8 | `DOM\tiempos-y-series.test.ts:112, 143` | La duración redondeada solo al mostrar; los 20 casos de «dentro, por debajo, por encima» | Las relaciones neutrales | Pasa: la regla nueva se apoya en ellas | Nada |
| 9 | `DOM\comparacion-de-entrenamiento.test.ts:701-713` y el resto | `COPY_COMPARACION` y `compararEjecucion` | La comparación serie por serie | Pasa | Nada |
| 10 | `DOM\compatibilidad-de-clientes.test.ts:43-70` | Cuándo un plan exige objetivos por serie | El bloqueo de activar | Pasa, si el editor sigue llamando a `planExigeObjetivosPorSerie` con lo escrito (`EDI:249`) | Nada |
| 11 | `DOM\plantillas-de-plan.test.ts:90-92`; `DOM\habituales.test.ts:115-117` | Los textos de los dos diálogos | Las palabras | Pasa | Nada |
| 12 | `REPO\scripts\retorno-seguro.test.mjs:21` | El retorno del inicio de sesión admite la pestaña solo con `id` | Que no se vuelva a cualquier dirección | Pasa | Un parámetro nuevo no sobrevive al inicio de sesión: no cambiarlo |
| 13 | `REPO\scripts\retorno-a-la-ficha.test.mjs:59` | `conRetorno` sobre la ruta del área | El retorno a la ficha | Pasa | Nada |
| 14 | `REPO\scripts\espacio-profesional.test.mjs:167` | «Abrir» de un borrador pendiente lleva a `…/training?id=…&vista=plan` | El destino de un pendiente | Pasa | Al llegar se tiene que ver el borrador (DEC-5) |
| 15 | `REPO\scripts\contexto-citable.test.mjs:14` | Importa `T\contexto-citable.ts` por su ruta | La evaluación del Resumen | Pasa | No mover ese archivo |
| 16 | `REPO\scripts\contraste.test.cjs:344-370` | Ningún color escrito fuera de los tokens | Las paletas | Pasa, si el CSS nuevo usa tokens | Nada |
| 17 | `REPO\scripts\auditoria-accesibilidad.mjs:117, 122-126` | Toca la pestaña por su texto exacto «Ejecuciones» | axe en las pestañas de área | Se corta. Ya estaba vieja y fuera de la CI (`WP:288`) | Actualizarla o retirarla, con el resto de `WP:288` |
| 18 | `H\paginas.mjs:33, 40` | Captura las cuatro secciones por su `vista` | Nada: es el antes y después | Sirve igual. Ve solo lo cerrado | Usarla para el «después» |
| 19 | `H\ver.mjs:99, 156` | `#clic:` toca botones, resúmenes, enlaces y rótulos de `main`; `#buscar:` | Nada | Sirve, si lo nuevo son botones dentro de `main` | Nada |
| 20 | `RC:823-833` (CP-21) | Del origen de un punto a «Ver en Entrenamiento…»; espera la ruta del área; toca `.retorno-a-la-ficha a` que contiene «Volver a la ficha»; compara la URL de la ficha | Ir al área y volver sin perder la configuración | Pasa si el marco conserva esa clase y esas palabras. Busca por «contiene» (`RC:227-241`): con «· Registros» sigue sirviendo | Nada, si se conservan |
| 21 | `RC:1488-1540` (CP-19, CP-20) | «Preparar la revisión de Entrenamiento» abre el formulario; lee `main`, `#trn-revision-…`, `[role="status"]` y «Volver a la ficha» | Que preparar no escriba y que registrar sea una sola escritura | No es de estas pantallas, pero pasa por el marco | Correrla en el paso 2 |
| 22 | `R:2142, 2377` | Los destinos de «Abrir Entrenamiento» y de «Preparar la revisión…» | E-49 y E-56 | Pasa | Nada |
| 23 | `R:142-153`; `RC:124-130` (`quieto`) | Espera que no queden pedidos en vuelo ni un `.cargando` | Que no se mida a medio cargar | Con el bloque de estado, espera solo por los pedidos | Que el bloque de carga lleve `.cargando`, o esperar por selector |
| 24 | `RW:215-327` | El editor, de punta a punta | §7.2 | **Se corta** | §7.2 |
| 25 | `RW:330-345` | El plan activo | §7.2 | **Se corta** | §7.2 |
| 26 | `RWE:71-104` | Las sesiones registradas | §7.2 | **Se corta** | §7.2 |

**Ninguna comprobación negativa de los siete recorridos mira estas pantallas.** Las de «sin %» de `R:3345` y `R:4050` son de la ficha y del Espacio profesional.

### 7.2 Los dos guiones de WP-ENTRENAMIENTO-SERIES, y qué protegen

No están entre los siete recorridos del paquete: tienen su propio entorno y su propia base (`ES\entorno.sh:2-12`), y el segundo necesita lo que deja el recorrido de la APK (`RWE:18`). No sé si hoy pasan.

| Dónde | Qué busca | Qué protege | Qué le pasa |
|---|---|---|---|
| `RW:216-221` | El botón «Crear plan»; los campos `#b0-nombre` y `#b0-s0-nombre`; «Agregar sesión» | Que se pueda armar un plan desde cero | El botón sigue. Los nombres ya no son campos a la vista |
| `RW:224-228` | «Agregar ejercicio», `#b0-s0-buscar-texto`, «Buscar», «Elegir {nombre}» | El buscador del catálogo | Depende de DEC-29 |
| `RW:229-242` | `#…-criterio`, `-objetivo`, `-carga`, `-unidad`, `-base-carga`, `-base-reps`, `-descanso` (escribe «90», en segundos) | Lo general del ejercicio | Los campos siguen; las bases quedan a un clic; el descanso se escribe distinto (DEC-25) |
| `RW:245-257, 93` | «Agregar serie»; `#…-serie-N`, `-carga`, `-rir`, `-descanso`; la casilla, buscada con `closest('.campo')` | **El dato de tres estados de cada serie** | Todo cambia: es la celda |
| `RW:261-271` | Las filas de «Así lo ve tu asesorado» son las del paquete, serie por serie | **Que lo escrito sea lo que recibe el teléfono** (DL-122) | La tabla sale: se lee la que se edita (el valor de cada celda y si está en gris) |
| `RW:293-298` | «Guardar borrador», el texto «Guardado.» y, después, 11 filas de `table.tabla--objetivos` en toda la página | Que el dato de tres estados vuelva igual después de guardar | Cambian los dos textos, y ya no están todas las sesiones a la vez: hay que recorrerlas |
| `RW:299-300` | «Validar plan» y `sinProblemas` | Validar | Sigue |
| `RW:304-311, 321-322` | Los tres textos del bloqueo; «Activar plan» apagado, con su motivo en `aria-describedby`; después, `listoParaActivar` | **Que un plan que la app no sabe mostrar no se active, y que se diga por qué** | Sigue, si el aviso y el atributo se conservan |
| `RW:324-327` | «Activar plan» → «Activar esta versión» → «Plan activado» | Activar | En el medio aparece la próxima revisión (DEC-6) |
| `RW:331-340` | «Lo que recibe tu asesorado»; las cinco tablas a la vez, cada fila con cuatro o cinco celdas, quitando « · de la prescripción» | Que el plan activo diga lo mismo que el paquete | Una sola tabla a la vez, y con una celda más (la nota) |
| `RW:342-344` | Cinco `img.imagen-de-ejercicio` a la vez | Que la imagen de cada ejercicio llegue (DL-123) | Se ve una a la vez, o ninguna si DEC-12 se resuelve de otro modo |
| `RWE:77-79` | `vista=ejecuciones`, «Sesiones registradas», dos `li.lista__item details summary` o más | Que el profesional vea lo que registró el asesorado | La ruta y el título siguen. La estructura, no |
| `RWE:45-67, 86` | Abre el `details`; por ejercicio (el título de su tabla), las celdas 1 y 2 de cada serie | El plan de ese día y lo registrado, por serie | Las mismas dos cadenas, en la tabla nueva |
| `RWE:88-89` | Las celdas 4 y 5: el descanso y la duración | Los descansos y las duraciones, con su calidad (DL-124) | Quedan a un clic |
| `RWE:90, 99-101` | `dl.datos-de-tiempo`: cada tiempo con su calidad | Que un tiempo estimado o incompleto no se muestre como medido | Los tres de la sesión, en el renglón; los de cada ejercicio, a un clic |

### 7.3 Comprobaciones nuevas que conviene escribir

Lo esperado se calcula a mano desde la API, con la sesión de la página (`leerApi`, `R:175-180`) y sin el dominio: `/advisees/{id}/training/plans`, `/training/plans/{planId}/detail`, `/advisees/{id}/training/review-context?periodStart=…&periodEnd=…` y `/training/executions/{id}/timing`.

**El marco**
- El título, la referencia de la persona, el acceso de Entrenamiento con las palabras de BE y la hora. «Actualizar» vuelve a pedir todo lo que la vista muestra, y la hora cambia.
- Con `volver`, el enlace vuelve a la ficha con la misma URL; sin `volver`, lleva a la ficha y no dice «donde estabas».
- Una falla simulada (`v.reglas`, como en `R:109-119`) en la lectura de la vista: dice el motivo; no dice «Todavía no hay…»; «Reintentar» la trae.

**El plan activo**
- El selector dice las versiones que da la API, con su número contado a mano. Al llegar con `vista=plan` y con borrador, se ve el borrador.
- Elegir cada sesión: sus ejercicios son los de la API; las cuentas («3 ejercicios · 12 series») coinciden; y **no sale ningún pedido** (`v.urls`).
- Un solo ejercicio abierto. Cada fila de su tabla, contra `sets[].target` y `sets[].note`; «Sin objetivo» donde el valor es `null`.
- El renglón de cada ejercicio cerrado, escrito a mano para los seis ejercicios del escenario.
- El historial: tantas filas como versiones activadas; una sola dice que es la que rige.
- «Guardar como plantilla» abre su diálogo con el foco adentro; Escape lo cierra y devuelve el foco.

**Los registros**
- Las cuatro cantidades, contadas a mano, con el período en 90 días. Elegir cada vista deja las filas que le tocan y no pide nada.
- El orden: de la más nueva a la más vieja.
- Cada fila: el día, la sesión, la condición de lo que rige, «N de M registradas» y la última columna. En particular: la no realizada no dice «0 de N registradas»; la resumida no dice «series sin registrar»; la corregida muestra lo corregido; la de libras dice que la carga no se compara.
- El detalle se abre al costado a 1440 y a 1280, y encima a 1024; el foco va al título; «Cerrar» y Escape lo devuelven a la fila.
- La tabla del detalle: «Indicado» es el objetivo de la versión **de ese día** (hay sesiones de la v1 y de la v2).
- Los tiempos: con el escenario, «no tiene tiempos marcados» **[supongo]**; con una falla simulada en `/timing`, lo dice y lo demás del detalle sigue.
- Una falla simulada en `/detail`: ninguna fila dice «Dentro de lo indicado».
- «Ver los días»: tantos días como `missingData`. El enlace a Analizar lleva la pregunta y el período.
- **Una negativa con su positiva:** en todo `main`, con un detalle abierto, sin «%» que no sea «% RM» y sin palabras que califican; y `main` tiene las filas que tiene que tener. El escenario trae la palabra «volumen» como dato (punto 1.16): la comprobación no puede buscarla en toda la pantalla sin sacar antes los textos del profesional.

**El editor** (las escrituras, sobre el borrador de A, que no se activa: DEC-32)
- Lo que hacía `RW`, por la pantalla nueva: armar un ejercicio con tres series, dejar una celda vacía (toma lo general), escribir un valor en otra y elegir «Sin objetivo» en una tercera; guardar; leer la API: la clave ausente, el valor y `null`.
- Escribir un descanso como «02:30», como «150» y como «abc»: los dos primeros guardan 150; el tercero frena el guardado y señala la serie.
- Cambiar el criterio a «Sin criterio»: la columna RIR se va y la API ya no trae RIR en ninguna serie.
- Con cambios sin guardar: pasar a «activa» y volver conserva lo escrito; «Actualizar» no lo pierde.
- «Activar plan» con cambios sin guardar: primero sale el guardado (un `PATCH`), después el diálogo; «Volver» no activa nada.
- Con un RIR distinto en una serie y la app vieja: «Activar plan» apagado, con su motivo.
- La primera pantalla, medida: a 1440 × 900, con un ejercicio de cuatro series abierto, hasta dónde llega. Y la cantidad de controles, contra los 116 de hoy.
- axe en los dos temas: cerrado, con un menú abierto, con el buscador y con el diálogo de activar. El teclado: con Tab se recorren las celdas en el orden en que se leen.

### 7.4 Dónde escribirlas

- Una función propia dentro de `fichaRecompuesta` (`R:4086-4112`), después de la del Espacio profesional, con un modo junto a los de `R:4674-4681`, como se hizo con `espacioProfesional` (`R:3426`). **Sin otro inicio de sesión:** `funcional` ya entra cuatro veces con el profesional (`R:615, 1157` y, por `R:1236-1237`, `R:4094` y `R:4128`) y el límite es cinco cada quince minutos (`R:6`).
- Cada lectura de `leerApi` cuenta para el cupo (`R:156-163, 175-180`).
- Las reglas de los registros (paso 1c) y la celda (paso 6) se prueban primero como funciones puras, con `npm test`: un error ahí se ve en segundos, y en el recorrido, después de una compilación.

## 8. Tamaño

Las líneas de hoy son del commit `c565f0c`. Lo demás es **[estimo]**.

| Archivo | Líneas hoy | Qué le pasa |
|---|---|---|
| `ENT` | 117 | Cambia un 40 %: el marco, los estados con motivo y los íconos de las pestañas |
| `PAG` | 24 | Una línea: la clase del contenedor |
| `PLN` | 296 | Se reescribe un 70 %: la vista (`:108-201`) y la lectura de solo lectura (`:229-296`). Quedan la lectura, crear y aplicar (`:55-106`) |
| `OPS` | 172 | La tabla cambia de columnas (unas 40 líneas); el campo con casilla (`:36-88`) se reemplaza por la celda |
| `EDI` | 972 | Queda casi igual la lógica (`:55-250` y `:489-532`, unas 240 líneas). Se reescribe el dibujo (`:252-487` y `:538-830`, unas 530). El buscador (`:833-972`, 140) cambia de lugar y de piel |
| `EJE` | 364 | Se reescribe un 80 %. Quedan `objetivosDe`, `nombreParaElegir` y, para la ficha, `Registro` |
| `SYT` | 181 | Se reescribe como la tabla del detalle. Quedan las funciones de texto (`:43-70`) |
| `CMP` | 1.058 | La evolución y lo que usa (unas 700 líneas) no se toca: es de Analizar. La parte por serie (`:355-685`, unas 330) queda a un clic o se retira (DEC-18) |
| `HAB` | 278 | Piel: el selector de sesión habitual (`:242-271`) pasa a «Agregar ▾». Los diálogos no cambian |
| `PLT` | 177 | Piel: «Empezar desde una plantilla» (`:125-156`) cambia de lugar |
| `IMP` | 241 | Piel, dentro del buscador |
| `RES`, `REV` | 620 y 376 | Fuera de este plan. Un texto en `RES:226` |
| `CSS` | 6.153 | De 700 a 800 líneas nuevas; se borran unas 60 |

| Pantalla | TSX (nuevo o reescrito) | CSS | Dominio | Pruebas del dominio |
|---|---|---|---|---|
| El marco del área (una vez, para las cuatro áreas) | 150 | 90 | — | — |
| El plan activo (24) | 350 | 170 | 60 | 90 |
| Los registros (25) | 650 a 750 | 220 | 200 | 230 |
| El editor (28) | 950 a 1.100, de las que unas 300 quedan como están | 320 | 50 | 70 |
| **Total** | **2.100 a 2.350** | **800** | **310** | **390** |

A eso se suman las comprobaciones del recorrido: de 600 a 900 líneas, si cada pantalla suma unos 30 resultados, como cada parte del primer paquete (`WP:334-335`).

**Qué se reescribe y qué solo cambia de piel.** Se reescriben los registros y el dibujo del editor. Cambia de composición, sin lógica nueva, el plan activo. Cambian solo de piel los tres diálogos (plantilla, habitual, activar), la importación de wger y el buscador por dentro. No se toca la evolución de un ejercicio.

## 9. Decisiones que quedan para quien implementa

**Comunes a las áreas: se deciden una vez, con los otros dos planes**

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-1 | El marco del área | Una sola pieza en `ADV`, para las cuatro áreas, hecha antes que cualquier pantalla: el camino a la ficha, el título, la referencia, el acceso de **esa** área, «Actualizar» con la hora, las pestañas con ícono y la ayuda. Cada área le pasa su «volver a leer» | Que cada área arme el suyo: cuatro copias de lo mismo |
| DEC-2 | El enlace de arriba cuando no se llegó desde la ficha, y las migas | Sin migas, como la ficha. Con `volver`, «Volver a la ficha, donde estabas», con la misma clase; sin `volver`, «Ir a la ficha», en el mismo lugar | Dejar las migas: ocupan un renglón, y el marco ya dice dónde se está |
| DEC-3 | El ancho y los cortes | Una clase nueva de contenedor, con el tope de la ficha (100 rem). El detalle al costado, desde 75 rem, como la línea de tiempo | Agrandar `.contenido--ancho`: cambia otras seis páginas |
| DEC-4 | «Actualizar» con cambios sin guardar en el editor | No vuelve a leer el borrador: actualiza lo demás y lo dice («Tenés cambios sin guardar: la versión en preparación no se volvió a leer»). El conflicto de versión ofrece «Actualizar la vista» y avisa que lo escrito se pierde | Apagar «Actualizar» mientras haya cambios: más simple, y deja la hora vieja sin explicación |
| DEC-5 | El selector de versión | «4 · en preparación», como la maqueta: el número que va a tener al activarse (las activadas más uno), y se corrige `GUIA:393-395`. Al entrar, el borrador si existe. La versión elegida es de la visita: no va a la URL. **Pasar a «activa» no desmonta el editor** | Sin número («En preparación»), como dice hoy la guía. O llevar la versión a la URL: es un parámetro nuevo, y `WP` §2 pide no tocar los parámetros |
| DEC-6 | «Activar plan» | Como la maqueta 18: guarda si hace falta, abre el diálogo, pide la próxima revisión ahí y dice qué versión entra y cuál queda. Son dos escrituras: guardar (con la fecha) y activar con el token nuevo. La frase de `COPE:123` se conserva. El foco entra en «Volver». Con el bloqueo por la app, el botón sigue apagado con su motivo | Dejar la fecha en el editor: más simple, y se aparta de C-41 y de lo que haga Nutrición |
| DEC-7 | El período de los registros | El control único de la ficha, hecho pieza: recibe el período, el tope y los atajos. Acá: 7, 30 y 90 días, tope 92, y por omisión los 7 de hoy. Es de la visita | Dejar «Desde», «Hasta» y «Ver período»: contra `CRIT:189` |
| DEC-8 | Las piezas que hoy están dentro de una pantalla | Sacarlas a `WEB\components` sin cambiarles las clases (como se hizo con las vistas con nombre, E-97): el detalle al costado, con su panel de encima; el diálogo de ayuda, sin su contenido; un menú que se despliega; el grupo de segmentos | Copiarlas: `GUIA:522-523` pide no crear otra pieza para lo mismo |

**El plan activo**

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-9 | Dónde van «Crear plan», «Crear nueva versión a partir de esta» y «Empezar desde una plantilla» | Sin borrador: arriba a la derecha, como la maqueta 16 (`MQ\partes\16-cuerpo.html:38-39`), «Crear nueva versión a partir de esta» y, a un clic a su lado, «Empezar desde una plantilla». Sin plan activo ni borrador: un estado vacío con las dos acciones. Sin objetivo, ninguna | Una sección «Crear» debajo del plan, como hoy: queda fuera de la primera pantalla |
| DEC-10 | El renglón de un ejercicio cerrado | Una función del dominio, con prueba. Si todas las series piden lo mismo: «4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00». Lo que cambia de una serie a otra se dice así: «4 series · 6–8 rep. · carga y RIR por serie · descanso 02:30». Nunca un rango de RIR | Mostrar la primera serie: es el defecto que `DOM\presentacion-de-prescripcion.ts:4-5` vino a corregir |
| DEC-11 | Las palabras de la versión y la hora de activación | Las de BE: «Borrador», «activa» y «Anterior». «Vigente» queda para la APK. El historial: «Versión 2 · activada el 3 ago · anterior». La hora, en el `title` de la fecha **[supongo que alcanza]** | Las de la maqueta («vigente», «anterior, conservada»): tres palabras para la versión que rige |
| DEC-12 | Lo que «Lo general» no dibuja | Los parámetros, como filas de la misma lista; la referencia del % RM, junto a la intensidad; la imagen chica, en la cabecera del ejercicio abierto, en lugar del ícono | Dejarlos fuera: se pierde lo que hoy se ve |
| DEC-13 | Cinco o más sesiones o bloques, los microciclos y los nombres largos | Lo que escribe C-81 (`CRIT:451-454`): hasta cuatro, botones; con cinco o más, una lista que dice cuál está abierta y cuántas hay; un renglón «Microciclo» si el bloque los usa. Un nombre largo se corta en el botón y se lee entero al lado | Siempre una lista: más simple, y el caso común (dos o tres sesiones) pierde un clic |

**Los registros**

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-14 | Qué es «una serie con diferencias» | Una serie registrada en la que las repeticiones o el RIR quedaron por encima o por debajo de lo indicado. La carga se dice en la fila («Carga: por encima de la sugerida») y **no cuenta**: BE la llama complemento, no obligación (`COPE:100`; `CDE:659`). Un dato que no se registró no es una diferencia: se dice aparte («RIR: sin dato»). Otra unidad u otro ejercicio: «no se compara» | Contar las tres por igual, como las lista hoy `SYT:57-61`: con cargas que suben sobre una sugerida fija, casi toda sesión queda «con diferencias» |
| DEC-15 | El nombre «Distinto de lo indicado» | En los registros la vista se llama «Con diferencias», que es lo que dice la fila («2 series con diferencias»), con el ícono `distinto`. «Distinto de lo indicado» conserva en la ficha el sentido que ya tiene | Dejar el nombre de la maqueta y explicar la diferencia en las dos ayudas: el mismo nombre con dos cantidades. O cambiar el sentido en la línea de tiempo: no se puede sin que la API lo calcule (§3) |
| DEC-16 | Dónde viven las vistas y sus reglas | En el dominio, con sus pruebas, como las de la línea de tiempo (`DOM\dia-de-la-linea.ts:237-292`). El nombre «Con desvío o no realizada» se arma con las etiquetas de la condición (`COPE:33-37`) | En la pantalla: lo frena `CP:219-231`. O en un `.ts` que la prueba no mira: es esconderle el texto a la prueba |
| DEC-17 | Qué dice la fila de una sesión que no se compara | Frases propias, en el dominio. No realizada: «La sesión se registró como no realizada», sin cuenta de series. Resumida: «Registro resumido: sin series». Con otro ejercicio: «N de M registradas» y «un ejercicio no se compara». Sin registro vigente: el texto de `CDE:680`. Ninguna cuenta como «series sin registrar» | Mostrar «0 de N registradas»: es un hueco dicho como un cero |
| DEC-18 | El gráfico por serie, el panel de valores y la tabla de valores | A un clic, en el pie del detalle («Ver en un gráfico»), cargado recién ahí. `ComparacionPorSerie` no se borra. Si Dirección confirma que la tabla lo reemplaza (C-66), se retira en otro cambio | Retirarlo ahora: C-66 dice que el detalle «es una tabla», pero el encargo pide no quitar ninguna función |
| DEC-19 | La corrección vigente, el registro original y el historial de correcciones | El detalle muestra lo que rige. Si hay una corrección, lo dice bajo el título (quién, cuándo y el motivo); la serie que cambió lleva «Corregida»; y a un clic, «Registro original y correcciones», con lo de hoy | Los tres bloques siempre abiertos, como hoy: es lo que hacía repetir cada dato cuatro veces |
| DEC-20 | «Ver la sesión en el plan» | Abre la sesión de la versión de ese día en el panel de costado, en solo lectura, con la misma pieza del plan activo. No navega y vale para una versión anterior (el plan ya está leído: `EJE:92-103`) | Ir a la pestaña Plan: ahí solo están la activa y el borrador |
| DEC-21 | El enlace a Analizar | Lleva a la ficha con la pregunta del ejercicio, el período de los registros y, si hay uno filtrado, el ejercicio. El texto es el de la pregunta del dominio, no uno nuevo. En Analizar, «Abrir la ejecución» abre el panel de origen de la ficha, que ya existe (`SEG\registro-original.tsx:122`) | Llevar a «¿Lo registrado coincide con lo indicado?», que es donde está el componente que sale de la pestaña: conserva más, y no es la pregunta que nombra el criterio (`CRIT:188`). Si Dirección no quiere «progresando» en el área: «Ver la evolución de un ejercicio en Analizar» |
| DEC-22 | La sesión registrada en el detalle de la ficha | La ficha usa la tabla nueva, en su forma angosta («Indicado» y «Registrado» en dos renglones), y lee el plan de ese día para saber lo indicado: una lectura más por sesión abierta | Dejar `Registro` como está, solo para la ficha: dos dibujos de la misma sesión. O armar «Indicado» con lo general que trae la sesión: en un plan con objetivos por serie, diría un valor que no es el de esa serie |
| DEC-23 | Llegar desde la ficha a una sesión en particular | No ahora: sigue llegando a los últimos 7 días, como hoy. Se anota como defecto de antes | Un parámetro `registro=`: abre esa sesión y ajusta el período. Es un parámetro nuevo |

**El editor**

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-24 | La celda de una serie | Un campo de texto y, en la misma celda, un botón chico que abre dos opciones: «Sin objetivo» y «Tomar de lo general». Vacío es «toma de lo general»: el valor heredado se ve escrito en gris y se dice en `aria-describedby`. Si lo general tampoco tiene, la celda dice «Sin objetivo» en gris. Elegido a mano, «Sin objetivo» va en el color del texto. Lo que manda cada estado, en una función pura con su prueba | Una lista desplegable que también deja escribir: no hay un control nativo que haga las dos cosas bien, y uno propio pide mucho teclado y mucho lector de pantalla |
| DEC-25 | El descanso | Se muestra «02:30». Al escribir se aceptan «2:30», «02:30», «1:00:00» y un número solo, que son segundos, como hoy («150»). «0» es sin pausa. Lo demás es un error del campo. La conversión, en el dominio, con prueba | Solo «mm:ss»: quien venía escribiendo «90» recibe un error |
| DEC-26 | Los menús y cómo se cambia un nombre | La pieza común de DEC-8. Cada menú, con lo de hoy y nada más. Una opción que no se puede usar se ve apagada y dice por qué. El nombre, el propósito y las indicaciones se cambian en un diálogo corto (`.dialogo--formulario`), con «Volver» y «Listo»: no guarda el plan, cambia lo escrito | Cambiar el nombre en el lugar: hay que decidir cuándo termina la edición, y la pestaña que se edita cambia de ancho |
| DEC-27 | Los problemas de «Validar», con una sola cosa abierta | Cada problema es un botón que lleva a su lugar: elige el bloque y la sesión, abre el ejercicio y pone el foco en la serie. Las palabras son las de hoy (`EDI:77-116`) | Dejar la lista como texto: con todo plegado, hay que ir a buscar cada cosa a mano |
| DEC-28 | Las ayudas de campo | Junto al campo, lo que hace falta para llenarlo: «un número o un rango, 8-12», «de 0 a 10», el formato del descanso. En «Cómo se lee esta vista», las explicaciones: qué es el RIR, que la carga sugerida no es el criterio, el tempo, qué revisa «Validar». «Todo es opcional» pasa a «Opcional», y el objetivo se marca como necesario cuando hay un criterio | Todo en la ayuda de la vista: el campo queda sin su formato a la vista, contra `GUIA:86` |
| DEC-29 | El buscador de ejercicios | Al costado, como «Agregar ítem» de Nutrición (C-52), con todo lo de hoy adentro y en el mismo orden. Si el otro plan resuelve distinto ese panel, se sigue ese | Dentro de la sesión, como hoy: empuja los ejercicios hacia abajo |
| DEC-30 | El editor a 1280 y a 1024 | Por debajo de unos 1.340 px de ancho útil **[estimo]**, «Lo general» va debajo de la tabla, en dos columnas. Es la regla del plan activo a 1024 (`CRIT:258`), aplicada antes | Angostar la columna «Nota»: a 1280 le quedan unos 100 px |

**Las pruebas y los datos**

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-31 | Los dos guiones de WP-ENTRENAMIENTO-SERIES | No se arreglan en su lugar. Lo que protegen (§7.2) se vuelve a escribir en el recorrido del paquete, con la equivalencia anotada (E-06, `WP:110`), y su `LEEME` dice que esos guiones corren contra el commit de aquel paquete | Actualizarlos: dependen del recorrido de la APK y de otra base, y habría que mantener dos recorridos del mismo editor |
| DEC-32 | Los datos para ver lo que el escenario no tiene | El recorrido escribe por la pantalla, sobre el borrador de A, lo que falta: objetivos por serie, descanso, notas, bases, un bloque con microciclos y sesiones hasta pasar de cuatro. No lo activa. La activación se prueba en un asesorado propio, con datos del generador | Sumar todo eso al escenario principal: cambia lo que esperan los otros recorridos (el Resumen de A y la cartera) |

## 10. Lo que no pude determinar leyendo

- **Cuánto mide lo nuevo.** Los altos y los anchos de 1.12, 2.5 y DEC-30 salen de las medidas de las maquetas; los de «antes», de mediciones anteriores al primer paquete.
- **Si la tabla de celdas entra a 1280** con valores reales (libras, decimales, veinte series), y cuánto ocupa el detalle de una sesión de doce series: en la maqueta termina justo al borde de los 960 px.
- **Cuántas sesiones del escenario quedan «con diferencias»** con cada regla de DEC-14. Lo deduje leyendo el generador.
- **Si las sesiones del escenario tienen tiempos marcados.** Creo que no: se insertan por SQL.
- **Si `RW` y `RWE` pasan hoy,** y si `auditoria-accesibilidad.mjs` corre.
- **Cuánto tarda el contexto de revisión con 92 días.** Trae cada sesión con su plan de ese día entero.
- **Si la lectura de los vínculos gasta el cupo.** Lo tomé del plan del Espacio profesional; no lo volví a leer en la API.
- **Si editar el borrador de A cambia algo que esperan los otros recorridos** (el pendiente «Plan en borrador desde…» de la cartera).
- **Qué van a proponer los otros dos planes** para el marco, el selector de versión, el período, el diálogo de activar y el panel de costado. Si difieren de DEC-1 a DEC-8, hay que elegir uno antes de empezar.
- **Qué trae el trabajo sin commit de `SEG`, del dominio y de `RC`.** Toca el ejercicio en Analizar (`SEG\preguntas.tsx`, `DOM\entrenamiento-del-analisis.ts`) y, en `RC`, los tramos de la consulta y de las etapas **[supongo, por la función que encabeza cada cambio: no leí el cambio entero]**: cuando esté en un commit hay que volver a leer DEC-21, el punto 1.9 y las líneas de `RC` que cito en §7.1.
- **Lo que no leí entero:** `RES`, `REV`, `DOM\plan-de-entrenamiento.ts` (de ahí sale `estructuraConObjetivosComoEntrada`, `:518`), `CDE:460-610`, y `R` y `RC`, que recorrí por búsqueda.
- **Qué quiere Dirección** con el número del borrador, con el gráfico por serie, con la palabra «progresando» y con cuánto del detalle de una sesión tiene que verse sin un clic. Las maquetas 22 a 29 son del 10/10: `CRIT:586` dice que «todavía no las vio Dirección», y `WP:9-10`, que lo que Dirección no corrigió le parece correcto por confianza, no por una revisión pantalla por pantalla.
- **Cómo se ve cada cosa en Azul noche:** el valor heredado en gris sobre el fondo de un campo, la serie distinta en negrita y el segmento elegido.
- **El lector de pantalla:** cómo se oye una tabla de campos con valores heredados. Nada de eso se puede saber leyendo.
