# Nutrición (Plan, Registros y Revisiones) · plan de implementación (solo lectura: no compilé ni ejecuté nada)

Cubre las maquetas **16** (plan activo), **17** (versión en preparación), **18** (activar el plan), **21** (agregar un ítem), **20** (registros) y **06** (preparar revisión; entera acá, con lo que difiere en Entrenamiento).

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `WEB` = `REPO\apps\web\src` · `ADV` = `WEB\app\pro\advisees` · `NUT` = `ADV\nutrition` · `SEG` = `ADV\seguimiento` · `COMP` = `WEB\components` · `LIB` = `WEB\lib` · `CSS` = `WEB\app\globals.css`
- De `NUT`: `NN` = `nutricion.tsx` (119 líneas) · `PG` = `page.tsx` (24) · `PL` = `plan.tsx` (240) · `ED` = `editor.tsx` (782) · `RG` = `registros.tsx` (277) · `DR` = `detalle-de-registro.tsx` (204) · `RV` = `revisiones.tsx` (415) · `RS` = `resumen.tsx` (240) · `FO` = `formularios.tsx` (373) · `HA` = `habituales.tsx` (302) · `PT` = `plantillas.tsx` (167) · `IM` = `importacion.tsx` (344)
- De `ADV`: `EV` = `evidencia-de-revision.tsx` (166) · `EVL` = `evidencia.ts` (70) · `RP` = `retorno-y-preparacion.tsx` (72) · `PER` = `periodo.tsx` (47) · `WS` = `workspace.tsx` (315) · `TRV` = `training\revisiones.tsx` (376)
- De `SEG`: `LT` = `linea-de-tiempo.tsx` (980) · `HR` = `hecho-en-un-renglon.ts` (192) · `RO` = `registro-original.tsx` (231) · `CSL` = `como-se-lee.tsx` (274) · `BAR` = `barra.tsx` (130) · `TIRA` = `tira-del-objetivo.tsx` (78) · `CON` = `contraste.tsx` (280)
- `DOM` = `REPO\packages\domain\src` · `CN` = `DOM\contratos-nutricion.ts` (568) · `CRC` = `DOM\contratos-registro-de-comidas.ts` (178) · `CA` = `DOM\contratos-analisis.ts` · `COPN` = `DOM\copy-nutricion.ts` (153) · `COPR` = `DOM\copy-recetas.ts` (264) · `CDC` = `DOM\contraste-de-comida.ts` (134) · `DDL` = `DOM\dia-de-la-linea.ts` (292) · `NU` = `DOM\nutricion.ts` (442) · `CLI` = `DOM\cliente-http.ts` (1.313)
- `API` = `REPO\apps\api\src` · `ARV` = `API\nutricion\revisiones.service.ts` · `ACT` = `API\nutricion\nutricion.controller.ts` · `APL` = `API\nutricion\planes.service.ts` · `ACC` = `API\nutricion\cantidades-consumidas.ts` · `ALT` = `API\analisis\lectura-linea-de-tiempo.ts`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` · `M16`, `M17`, `M20`, `M06` = `MQ\partes\NN-cuerpo.html` · `M18`, `M21` = `MQ\partes\NN-encima.html` · `ARM` = `MQ\armar.mjs`
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas` · `R` = `H\recorrido.mjs` (4.689) · `RC` = `H\recorrido-comprension.mjs` (1.692) · `NRW` = `REPO\EVIDENCIA\NUTRICION-RECETAS\herramientas\recorrido\recorrido-web.mjs` (289) · `NRR` = `…\recorrido-web-registros.mjs` (86) · `SCR` = `REPO\scripts`
- `EA` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE` · `CRIT` = `EA\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `EA\diseno\iconos\CATALOGO.md` · `ACE` = `EA\ACEPTACION.md` · `REL` = `EA\relevamientos\informacion-y-nutricion.md`
- `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md`

**Con qué leí**
- **Las maquetas:** los seis HTML de `MQ\partes` y sus seis imágenes en `EA\diseno\maquetas\claro\`. Los `-cuerpo.html` empiezan debajo del marco: el marco de una pestaña de área lo arma `ARM:120-135` y se ve en las imágenes y en `MQ\16-plan-de-nutricion.html:15-29`. La 18 y la 21 son la 17 con algo encima (`ARM:40-51, 57`).
- **La barra de la maqueta no vale** (`MQ\16-plan-de-nutricion.html:9-13`): es anterior a E-17 y E-19 (`WP:136, 138`).
- **Lo que ninguna maqueta dibuja:** la pestaña «Resumen» de Nutrición y la lista de revisiones registradas (`CRIT:600`); el plan sin borrador, sin plan o sin objetivo; una opción de receta abierta en el editor; el detalle de un registro de una opción del plan; «Crear manualmente» e «Importar» abiertos y el formulario de «Agregar estimación» (`CRIT:602`); la lista de comidas habituales; la 06 sin resultado elegido o con «Cambiar objetivo»; y los anchos de 1280 y 1024 (`CRIT:239-241`).
- **El árbol:** rama `wp-escritorio-amable`, HEAD `c565f0c` (2026-10-11 03:37). Empecé con el árbol limpio y terminé con diez archivos cambiados sin commit y dos nuevos: alguien trabajaba en Analizar mientras yo leía (`SEG\analizar.tsx`, `etapas.tsx`, `geometria.ts`, `minigrafico.tsx`, `preguntas.tsx`, `selector.tsx`; `DOM\entrenamiento-del-analisis.ts`; `CSS`, con unas 340 líneas más; y `RC`, que pasó de 1.692 a 1.861 líneas).
- **De `CSS`, de `SEG\analizar.tsx` y de `RC` doy las líneas de `c565f0c`** (`git show HEAD:`), no las del árbol de trabajo. En `RC` lo que cambió está de la línea 804 en adelante y es de Analizar (`recorridoConsulta`, `coberturaConHuecos`, `recorridoEtapas`): lo que cito de la revisión no cambió de texto, pero en el árbol de trabajo está corrido entre 64 y 169 líneas. Ningún otro archivo que cito cambió.
- **Los archivos de Nutrición no cambian desde `269d930`** (`git log`), anterior a `ab90860`: los números de línea de `REL` siguen valiendo para `NUT`, `EV`, `EVL`, `RP`, `PER` y `TRV`. Los verifiqué igual, leyendo cada archivo entero.
- **No vi las pantallas de hoy** en un navegador. Las alturas de «antes» son las de `EA\parte-0\alturas-antes.json` (2026-10-10, 1440 × 900, asesorado A).
- **No abrí el legajo.** Donde el código dice que un texto sale del legajo, cito el comentario del código.

Todo lo que afirmo del código lo leí, con su línea. Lo que deduzco o calculo va con **[supongo]** o **[estimo]**. Después de escribir volví a abrir los archivos citados y corregí las líneas que no coincidían.

## 1. Lo que condiciona el plan

1. **El marco de las pestañas de área no existe, y es de las cuatro áreas.**
   - La maqueta (`ARM:120-135`): «Volver a la ficha, donde estabas»; el `h1` con el área; «Ana Ruiz · Asesorado · 5db647»; «Acceso actual · Nutrición · Activo»; «Actualizar» y «Consultado a las 10:32»; debajo, las pestañas con ícono y «Cómo se lee esta vista».
   - Hoy (`NN:101-104, 112`): miga, `h1`, el enlace de retorno solo si se llegó con `volver`, y pestañas sin ícono. Lo mismo en `ADV\training\entrenamiento.tsx:99-101`, `ADV\anthropometry\antropometria.tsx:105-107` y `ADV\forms\formularios.tsx:96-98`.
   - **La página no dice de quién es:** `NN:75-107` no lee el nombre del asesorado. Tampoco hay acceso actual, «Actualizar», hora ni ayuda de vista.
   - El nombre y el estado del vínculo salen de la lista de vínculos leída entera, como en la ficha (`WS:91-95, 111, 162, 290-297`). Esa lectura no consume el cupo de lecturas protegidas (`API\vinculo\vinculos.service.ts:67-86`; solo el detalle lo consume, `:90`).
   - **«Actualizar» choca con tres formularios.** Hoy ninguna pestaña de área lo tiene: cada vista lee al montarse (`PL:59-61`; `RG:37-39`; `RV:56-58`; `RS:53-55`). Con la regla de la ficha («vuelve a leer todo lo que la vista muestra», E-58, `WP:192`), se pierde lo escrito en el editor (`ED:145-157` rearma la estructura y pone `sucio` en falso), en la revisión (`RV:47-48`: `setR(null)` desmonta el formulario) y en la estimación (`RG:30-31, 193-194`). DEC-16.
   - **Sin `volver` no hay otro camino a la ficha que la miga** (`COMP\migas.tsx:24-26`). Pasa al llegar desde «Pendientes» de `/pro` (`REL:482`). La maqueta no tiene miga y dibuja el enlace siempre: sin `volver` no puede decir «donde estabas».
   - Es trabajo de una sola vez para Nutrición, Entrenamiento, Antropometría e Información: conviene que lo haga un paso común del paquete y no cada área.

2. **Lo marcado «propuesta» no entra, y deja huecos en la 16 y en la 17.**
   - **Los rangos de macros** (`M16:49-55, 65-72`; `M17:79-86, 124-134`) son un dato que BE no tiene: `DiaTipoEntradaSchema` (`CN:164-168`) y `ComidaEntradaSchema` (`CN:158-163`) son objetos estrictos sin campos de rango. `WP:265` y `CRIT:505-507` lo dejan fuera.
   - **La estimación de cada opción** (`M16:82-85, 95-98`; `M17:127-131`) no llega en la lectura del plan del profesional: cada ítem trae nombre, cantidad y estado de preparación (`CN:173-182`) y la opción, su lista (`CN:192`). El dato existe para la APK (`planned`, `CRC:103-114`): en «Hoy» del asesorado (`CRC:155-177`; ruta `me/…`, `API\nutricion\registro-de-comidas.controller.ts:26`) y dentro de un registro (`CRC:139`). `WP:268`: «Segundo paquete, si se decide».
   - **«Lo que cubren las N opciones»** (`M16:72`; `M17:133`) sale de esas estimaciones: tampoco.
   - **Qué queda sin eso.** En la 16, cada opción es su lista de ítems. En la 17, la columna derecha de la comida abierta (510 de 1.376 px, `M17:22`) no tiene nada que mostrar. DEC-13.
   - **Sí entra la tira del «Objetivo del día»** (`M16:46`; `M17:77`): los cuatro números están en el objetivo (`CN:120-121`; `CRIT:500-501`) y la pestaña ya lo lee (`PL:44`; `ED:147`).

3. **La lectura de Registros no trae el nombre de la opción ni cómo se informaron las cantidades.**
   - Hoy la pestaña lee solo API-NUT-17 (`RG:32`). Por comida trae `state`, `registeredOptionId`, `executionId`, `differentMealExecutionIds` y `quantityDifferences` (`CN:462-480`): el identificador de la opción, no su nombre.
   - Las ingestas de esa lectura traen `consumedItems` (`CN:402`), que es una proyección a la forma vieja (`API\nutricion\lectura-nutricion.ts:228`; la misma alimenta el contraste, `ARV:129`; `ACC:56-61`): las porciones del plan confirmadas llegan como ítems con las cantidades del plan, sin confirmar llega vacío, y «no lo comió» o sin cantidad no figuran. Con eso no se distingue «Porciones del plan» de «Cantidades informadas iguales al plan», ni «sin confirmar» de «informó todo sin cantidad». El campo `mode` de la ingesta no sirve para esto: es la modalidad de prescripción (`CN:336, 394`).
   - La maqueta pide, por fila, la opción, cómo informó y la diferencia (`M20:82-95`), y una cantidad por vista (`M20:58-62`).
   - **Llega por otra lectura que ya existe:** la línea de tiempo (API-DSH-04) filtrada a comidas de Nutrición, que la ficha ya usa para lo mismo (`CON:164-169`). Por registro trae el mismo identificador (`ALT:169-172`; `RG:92` y `RO:121` abren el registro con él), el modo y la diferencia comprobada como rasgos (`ALT:154-162`; `CA:371-381`) y los detalles «Opción», «Cantidades» y «Frente a lo indicado» (`ALT:176-190`). El website ya sabe escribirlo en un renglón: `renglonDelHecho` (`HR:35-47`), con prueba (`SCR\hecho-en-un-renglon.test.mjs:37-72`).
   - **Lo que cuesta:** llega de a 50 como mucho (`API\analisis\consultas.ts:110, 176`); cada página es una lectura protegida y registra una decisión por alcance (`API\autorizacion\pdp.guard.ts:32, 55-57`; `API\autorizacion\pdp.service.ts:139-169`). Admite 366 días (`API\analisis\consultas.ts:33`); el contexto de revisión, 92 (`ARV:40`).
   - **Lo que coincide y lo que no:** las dos consultas piden lo mismo, los registros de ese asesorado sobre planes de ese profesional, por la fecha civil del registro (`ARV:107-116`; `API\analisis\fuentes.ts:84-91`). La única diferencia es que la línea de tiempo trae también los anulados (`API\analisis\fuentes.ts:81-82`; `ALT:191`) y el contraste los deja afuera (`ARV:106, 112`). Las cuentas no pueden salir de los conteos de la línea de tiempo (`CA:424-428`), que cuentan registros y no comidas del plan: hay que contar sobre las filas que se muestran.
   - **Un hueco que no se puede contar:** con un plan de varios días tipo, un día sin registros llega sin comidas (`NU:426-427`; `RG:123-124`). «Sin registro N» no puede sumar esas comidas, y tiene que decirlo.
   - DEC-1 y DEC-2.

4. **Tres piezas de Nutrición las usa la ficha; otras tres, Entrenamiento.**
   - `VersionSoloLectura` (`PL:198-240`): la ficha la muestra como planificación de una etapa y de una activación (`RO:30, 209-219`), en una columna de 24 a 30 rem (`CSS:3020-3022`) o en un panel de 42 rem (`CSS:3416-3419`). Un recorrido lee ahí «Versión N · activada el» (`R:3151`). Y una versión anterior no es «lo que ve el asesorado» (`M16:36`).
   - `DetalleDeRegistroDeComida` (`DR:56-138`): la ficha (`RO:29, 121`). Lo miran `R:745`, `R:2917-2964`, `RC:926-942` y `NRR:44-55`. `WP:281` dejó para este paquete que entre bien en una columna angosta.
   - `SeleccionDeEvidencia` (`EV:68-166`) y `EVL`: Entrenamiento (`TRV:30, 248-256`), con comprobaciones (`RC:1497-1506`) y prueba (`SCR\evidencia-de-revision.test.mjs`).
   - `FiltroDePeriodo` (`PER:24-47`): seis pantallas (`RG:44`; `RV:70`; `TRV:71`; `ADV\training\ejecuciones.tsx:113`; `ADV\anthropometry\evolucion.tsx:61`; `WEB\app\pro\pendientes.tsx:206`).
   - `RP`: las cuatro áreas (`NN:23`; `ADV\training\entrenamiento.tsx:23`; `ADV\anthropometry\antropometria.tsx:22`; `ADV\forms\formularios.tsx:27`).
   - `procedenciaDeElemento` (`IM:341-344`): `WEB\app\pro\recipes\editor-de-receta.tsx:32`.
   - **Las clases del editor de hoy no son solo de Nutrición.** `.jerarquia`, `.nodo*`, `.items`, `.fila-de-item` y `.buscador` (`CSS:1146-1215`) las usan `ADV\training\editor.tsx`, `ADV\training\plan.tsx`, `WEB\app\pro\templates\*` y `WEB\app\pro\recipes\editor-de-receta.tsx`. No se tocan (E-02, `WP:106`): lo nuevo entra con clases nuevas.

5. **El editor no se ve con los datos de prueba, y lo cubren recorridos que no están entre los siete.**
   - El asesorado A tiene un solo día tipo («Día habitual»), cuatro comidas, a lo sumo dos opciones por comida y ninguna receta (`H\datos\escenario.mjs:49-97`). No tiene borrador de Nutrición: el generador activa sus dos versiones (`H\datos\generar.mjs:334-338`) y el único borrador que crea después es de Entrenamiento (`H\datos\comprension.mjs:196`). Los otros asesorados usan esos mismos dos planes y también quedan activados (B: `H\datos\generar.mjs:283, 565`; C: `:605, 609`; E: `H\datos\comprension.mjs:251-252`).
   - Con esos datos no aparecen el selector de día tipo, «Ver la opción 3», una opción de receta, ni las maquetas 17, 18 y 21 enteras.
   - **Ninguno de los siete recorridos comprueba Plan ni Registros de Nutrición.** `R:882-888` entra a la pestaña y vuelve con «Atrás»; `H\paginas.mjs:39` las captura sin comprobar.
   - Lo único que maneja el editor y Registros son `NRW:221-275` y `NRR:43-56` (de WP-NUTRICION-RECETAS, con su propio entorno), por texto e identificador: `#comida-0-{j}`, `fieldset.nodo--comida:nth-of-type(n)`, `li.fila-de-item`, «Ver registro». Con el DOM nuevo se rompen casi todos (§7.1).
   - La 06 sí está cubierta: unas quince comprobaciones de `RC` (§7.1).

6. **«Activar plan» cambia de flujo sin cambiar de contrato: son dos escrituras.**
   - C-40: «Activar plan» guarda antes de pedir la confirmación. Hoy está apagado con cambios sin guardar (`ED:405, 417`); «Validar plan» ya guarda solo (`ED:202-204`).
   - C-41: la próxima revisión se pide en el diálogo. La activación lleva solo la versión esperada (`CN:263`; `CLI:739-746`). La fecha se guarda en el borrador (`CN:259`; `APL:321`) y BE la fija al activar (`APL:444-447`).
   - Entonces «Activar esta versión» es: guardar la fecha si cambió (API-NUT-10, que devuelve otro token de versión) y, con ese token, activar (API-NUT-12). Un reintento de un resultado incierto tiene que repetir la misma activación con la misma clave (`ED:143, 216-217`), sin volver a guardar. DEC-8.

7. **Los recorridos esperan textos y estructura de la revisión.**
   - «Preparado por BE para esta revisión: el período va del {fecha con año}» y «Período: {fecha} a» (`RC:213-224, 1492`).
   - «Marcaste N de» (`RC:990, 1506`), «las N comidas» o «marcar la comida» en el rótulo de cada día (`RC:993`), y los registros de un día dentro de su `.evidencia__dia` (`RC:1016-1018`).
   - `form button` «Cancelar» y `form button[type="submit"]` «Registrar revisión» (`RC:1031, 1517`): los botones de la barra tienen que seguir dentro del formulario.
   - Cada `.evidencia__dia` tiene que tener su casilla. El recorrido lee el rótulo del primer `.evidencia__dia` y después marca la primera casilla de día que encuentra (`RC:984, 993, 1006-1012`): si un día sin registros lleva esa clase y queda primero, las dos cosas dejan de hablar del mismo día.
   - La planificación y el objetivo tienen que seguir siendo casillas `.acto`, hijas directas de la primera `.evidencia__seccion`, con la versión del plan primero (`RC:986-987, 1501, 1530`).
   - «Sin doble desplazamiento» en la pantalla de la revisión, a tres anchos y en los dos temas (`RC:305-313, 502-532`): la barra fija y la grilla no pueden tener desplazamiento propio.
   - La maqueta cambia varios de esos textos (§4.3). Cada uno se decide: o se conserva, o se actualiza la comprobación en el mismo cambio (E-06, `WP:110`).

8. **El ancho.** Las páginas de área topan en 76 rem (`PG:17`; `CSS:476-478`): 1.152 px útiles a 1440 **[estimo: 1.216 menos dos márgenes de 32]**. Las maquetas usan 1.376. La comida abierta de la 17 pide 510 px de costado más una tabla con 484 px de columnas fijas (`M17:22, 111`); la 20, 420 px de detalle (`M20:9`); la 06, 600 px de segunda columna (`M06:6`). Hace falta un contenedor como el de la ficha (`CSS:4289-4305`: franja de lado a lado y cuerpo hasta 100 rem). `.contenido--ancho` la usan otras seis páginas: no se toca.

9. **Lo que se elige no puede ir a la URL del retorno.** El retorno del inicio de sesión admite la pestaña de Nutrición solo con `id` (`LIB\copy.ts:24, 34-43`; `SCR\retorno-seguro.test.mjs:22, 32`): ya hoy, quien vuelve a entrar cae en «Resumen» (`NN:79, 82`). El día tipo elegido, la comida y la opción abiertas, la versión del selector, la vista de Registros y el registro abierto son de la visita. DEC-7.

10. **Cambiar de lugar con cambios sin guardar.** Hoy el borrador y el plan activo están en la misma página (`PL:118-174`), así que nada se desmonta al mirar uno u otro. Con el selector de versión (C-39), pasar a «activa» desmonta el editor y pierde lo escrito, salvo que quede montado y oculto. Cambiar de pestaña ya lo pierde hoy, sin aviso (`NN:113-116`).

11. **Fallas que hoy se muestran como vacío, o sin motivo** (defectos de antes).
    - `EstadoDeLectura` dice «No pudimos cargar esta vista.» sin motivo (`NN:68-73`; `COMP\estados.tsx:74`; `DOM\copy.ts:37`). Las piezas para decirlo ya existen (`LIB\fallas.ts:10-35`; `COMP\estados.tsx:40-72`).
    - Una búsqueda del catálogo que falla dice «No encontramos alimentos con ese nombre.» (`ED:549, 615`); la de la estimación, nada (`RG:161-165`).
    - Si no se pueden leer los alimentos habituales, las comidas habituales o las plantillas, la pantalla muestra «todavía no marcaste…», no dibuja el bloque o dice «No tenés plantillas activas para aplicar.» (`HA:50-52, 125-131`; `PT:127-135`). El comentario lo declara a propósito para un profesional sin Nutrición (`HA:11, 44`), pero vale igual para una falla de red.
    - DEC-21.

12. **Lecturas y cupo** (120 lecturas protegidas por minuto, `API\config\entorno.ts:133-139`).
    - Resumen: 4 (`RS:40-45`). Plan: 3, y 5 con borrador, con el objetivo leído dos veces (`PL:44, 51`; `ED:147`). Registros: 1, más una por cada «Ver registro» (`RG:32`; `DR:71`; `API\nutricion\registro-de-comidas.controller.ts:47`) y otra por cada foto que se muestra (`LIB\medios.ts:91`; `API\medios\medios.controller.ts:33-35`). Revisiones: 2, y 4 si se llega con `preparar=1`, porque lee dos veces (`RV:49, 60-65`; `RC:207-211`).
    - No consumen: el catálogo y las plantillas (`ACT:127-142, 160-170`: no llaman a `limitar`), ni las recetas ni los habituales (busqué `consumir` en `API\nutricion\recetas.controller.ts` y en `API\nutricion\habituales.controller.ts`: no está).
    - Con lo que propongo: el marco suma la lectura de vínculos (no consume); Registros suma una lectura de la línea de tiempo por cada 50 registros del período. Una semana con cuatro comidas por día es una página; un mes, tres **[estimo]**.

13. **Medidas de hoy y de la maqueta.**
    - Antes, a 1440 × 900 (`EA\parte-0\alturas-antes.json`): Resumen 906 px; Plan 2.268 (2,5 pantallas, solo el plan activo); Registros 3.922 (4,4 pantallas, con el período de siete días que propone la API); Revisiones 900 (formulario cerrado). Del editor y de la revisión abierta no hay medida.
    - Las maquetas son de 1440 × 960, con una barra de 56 px (`MQ\plano.css:89`); la del producto mide 65 (`WP:138`). El marco de la ficha mide 143 (`WP:124`); el del área no lleva período **[estimo: entre 100 y 143 px]**.
    - Diálogo de activar: 580 px (`M18:8`); `.dialogo` topa en 36 rem (`CSS:895-896`). Panel de «Agregar ítem»: 780 px (`M21:5`); el panel lateral que existe mide min(42 rem, 46 vw): 662 px a 1440 **[estimo]** (`CSS:3416-3419`).

14. **Lo que ya existe para reusar.**

    | Pieza | Dónde | Dónde encaja |
    |---|---|---|
    | `Icono` y la familia | `COMP\icono.tsx:35-56`; `DOM\iconos.ts` | Todos los de las seis maquetas están: `comida`, `opciones`, `receta`, `rango`, `activar`, `duplicar`, `plantillas`, `habitual`, `ordenar`, `menu`, `distinto`, `sin-confirmar`, `desvio`, `a-mano`, `plan`, `imagen`, `alimento`, `descargar`, `guion`, `volver`, `acceso` (`CAT:47-229`). `DR:201` todavía usa un emoji de cámara |
    | `BotonDeVista` | `COMP\vista-con-nombre.tsx:14-51` | Las cinco vistas de Registros. Acepta la cantidad en `null` (sin número) y qué se cuenta para el lector de pantalla |
    | `BloqueDeEstado`, `EstadoVacio` | `COMP\estados.tsx:24-72` | Cargando, falla con motivo, falla de una parte, sin datos. El bloque de carga no lleva la clase `.cargando`, que es la que esperan los recorridos (`R:142-145`; `RC:124-127`) |
    | `motivoDeFalla`, `razonDeFalla`, `ICONO_DE_FALLA` | `LIB\fallas.ts:10-35` | `EstadoDeLectura` de las cuatro pestañas y el detalle de un registro (ya lo usa: `DR:88`) |
    | `todasLasPaginas`, `useListaCompleta` | `CLI:1288-1312`; `LIB\lista-completa.ts:30-60` | La línea de tiempo del período para Registros. Hace falta un adaptador: espera `data` como lista y la línea de tiempo trae `data.entries` (como `WEB\app\pro\pendientes.tsx:49-53` hizo con la cartera) |
    | La ayuda única por vista | `CSL:237-274`; `CSS:5503-5549` | Está atada a las tres vistas de la ficha (`CSL:231-241`). Hay que separar el diálogo (botón, foco en el título, cierre) de su contenido; `Renglon` (`CSL:19-28`) sirve tal cual |
    | El detalle al costado | `LT:84-85, 157-167, 291-332, 450, 482-499`; `CSS:3012-3022, 3267-3312` | Registros. La lógica (si entra al costado, foco al título, Escape, devolver el foco) está dentro de la línea de tiempo: se saca a un lugar común con sus clases, como E-97 hizo con las vistas (`WP:237`) |
    | El panel lateral | `RO:50-95`; `CSS:3409-3433` | «Agregar ítem» (21) y el detalle en ventanas angostas. Hoy está atado al registro de origen: hace falta la cáscara sola |
    | El diálogo con formulario | `WEB\app\pro\solicitar-vinculo.tsx:92-158`; `CSS:6118-6124` | El formulario de «Agregar estimación»; elegir una comida habitual o una plantilla |
    | `DialogoDeConfirmacion` | `COMP\dialogo.tsx:27-84` | Activar (18). Admite contenido propio (el resumen y la fecha) |
    | El control segmentado | Solo marcado y estilos: `SEG\analizar.tsx:448-460` (en `c565f0c`); `CSS:3547-3609` | Día tipo y selector de versión. No es un componente todavía |
    | La etiqueta con ícono | `.etiqueta-de-dato` (`CSS:3817`; `LT:660-667`) | «Solo lectura», «Borrador», «Fuera del plan», «1 sin confirmar» |
    | `TiraDelObjetivo` | `TIRA:29-78`; `CSS:4624-4644` | «Objetivo del día». No depende de la ficha: recibe las calorías y los macros |
    | El control de período | `BAR:25-130`; `CSS:2688` | Registros y «Cambiar el período» de la 06. Hoy lee y escribe la URL de la ficha y topa en 366 días (`BAR:26, 70`): hay que darle el período y el tope por parámetro. DEC-20 |
    | `renglonDelHecho`, `rasgosDeUnHecho`, `ICONO_DEL_RASGO` | `HR:35-47, 117-128`; `DDL:82-92` | La fila de una comida registrada en Registros |
    | `contrasteDeLaComida`, `frenteALoIndicadoEnPalabras` | `CDC:38-59, 119-134` | «Diferencia observada» y la tabla del detalle |
    | La barra de acciones pegada al pie | `.acciones--fijas` (`CSS:2412-2432`; `GUIA:535, 572`) | La barra de «Registrar revisión» (06). Se pega con `position: sticky`: no es fija a la ventana ni tiene desplazamiento propio (`CSS:2416-2425`) |
    | `Pestanas` con ícono | `COMP\pestanas.tsx:20-47` | Las cuatro pestañas del área |
    | Fechas | `LIB\formato.ts:14, 22, 35, 38-43, 61-67` | Hora de la consulta, día sin año (E-57), rango del período, hora en la zona del registro |

15. **Los textos: dónde viven y qué los cuida.**
    - `COPY_NUTRICION`, las etiquetas y los efectos de los resultados: `COPN:11-124`, con prueba de palabras (`DOM\dominio-wp04.test.ts:508-515`). `COPY_REGISTRO_PARA_EL_PROFESIONAL` y `COPY_REGISTRO_DE_COMIDAS`: `COPR:123-264`, con prueba y varios textos exactos (`DOM\recetas-y-registro.test.ts:33-56`). Las frases de «frente a lo indicado»: `CDC:108-134`, exactas (`DOM\comprension-del-dashboard.test.ts:782-807`).
    - Lo escrito en las pantallas de `NUT` pasa por la lista de Nutrición (`SCR\copy-pantallas.test.cjs:34-49`): prohíbe, entre otras, «%», «desvío», «bien», «mal», «cumplimiento» y «adherencia» (`COPN:130-147`).
    - **Tres huecos de esa prueba:** no mira los `.ts` de `NUT` (toma solo `.tsx`, `:24, 39`), ni `EV`, `EVL` y `RP`, que están en `ADV` (la lista de la ficha toma `SEG`, `workspace.tsx` y `periodo.tsx`, `:126-130`). Un módulo puro nuevo, un texto nuevo en la evidencia o el componente del marco, si va en `ADV`, quedan afuera si no se suman.
    - **La prueba mira todo texto escrito en el archivo, no solo lo que se ve:** cualquier cadena que no esté en `className`, `style`, `id`, `htmlFor`, `key` o `href` (`:82, 88-100`). Un «%» en un nombre accesible o en una plantilla de texto de una pantalla de `NUT` la hace fallar.
    - «Desvío», con tilde, está prohibido; el ícono se llama `desvio`, sin tilde, y no choca. La etiqueta de BE es «Fuera del plan» (`COPN:83`).
    - La pestaña todavía dice «Energía» en la importación (`IM:38`) y «Requerimiento energético» en el Resumen y en el objetivo (`RS:178`; `FO:260`). E-34 lo dejó para este paquete (`WP:158`). DEC-22.

16. **Menores, de antes.**
    - Después de registrar una revisión a la que se llegó con `preparar=1`, el formulario vuelve a abrirse, vacío: la recarga lo monta de nuevo con `abiertoAlEntrar` (`RV:107, 111-114, 159`). Lo anotó `REL:1066` **[supongo, como ahí: no lo vi andar]**.
    - Cambiar el período descarta la revisión a medio escribir (`RV:47-48`; `REL:1065`).
    - El texto de cada comida en la evidencia dice la hora y «Comida del plan», no cuál comida es (`RV:178`). El nombre llega en la misma respuesta (`CN:463-468`).
    - Una comida con las porciones del plan confirmadas trae una diferencia de cero por ítem (`NU:387-400` no filtra el cero), y la pantalla la escribe como «… · 0 g» (`RG:109-115`). La raya «—» sale solo cuando no hay ítems con cantidad (`RG:116`) **[lo leí; no lo vi en pantalla]**.
    - Un ingrediente que la persona marcó «no lo comí» no aparece en «Diferencia observada» (`ACC:56-61`); sí en «Ver registro» (`CDC:49`).
    - Desde el plan activo se puede guardar como plantilla un plan con opciones de receta: sus ítems viajan como una opción común (`PL:163`; `DOM\plantillas-de-plan.ts:97-114`). Desde el editor, no (`ED:411`). Son dos reglas para el mismo botón.
    - El número de versión se calcula con la primera página de la lista de planes (`PL:27-30, 44`; `APL:239-245`): con más versiones que una página se correría **[supongo]**.
    - Un conflicto de versión al guardar dice «Actualizá la vista antes de volver a intentar» (`LIB\intento.ts:49-53`; `DOM\copy-vinculo.ts:140`), y la pestaña no tiene con qué actualizar sin perder lo escrito (`CRIT:235` pide «Actualizar la vista» conservando lo escrito).

## 2. Región por región

### 2.0 El marco del área (común a las seis maquetas y a las otras tres áreas)

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Contenedor | Franja de lado a lado; cuerpo de 1.376 px | `main.contenido.contenido--ancho` (`PG:17`; `CSS:476-478`) | Punto 1.8. El marco va dentro de `main`, como en la ficha (`ADV\page.tsx:20`; `WS:170`): `H\ver.mjs:99` toca solo lo que está en `main` |
| Volver | «← Volver a la ficha, donde estabas», siempre (`ARM:123`) | Miga (`NN:101`) y enlace solo con `volver` (`NN:103`; `RP:35-42`) | DEC-16. Conservar la clase `.retorno-a-la-ficha` (`RC:466, 827, 956`) y que `volver` siga en cada pestaña (`NN:112`; `RP:33`) |
| Título | `h1` «Nutrición» y, al lado, la persona (`ARM:124`) | `h1` (`NN:102`); la persona no se nombra | Sin alias (DL-040, `WP:259`): solo «Asesorado · 5db647» |
| Acceso | «Acceso actual · Nutrición · Activo» (`ARM:125-126`) | No existe | Con las palabras de BE: «Activo · acceso contextual» y los otros estados (`DOM\copy-vinculo.ts:218-228`). Si una lectura responde 404, el marco no puede seguir diciendo «Activo» (hoy la pestaña se vacía: `NN:70, 86-91`) |
| Actualizar y hora | `ARM:127-128` | No existen | Punto 1.1. La hora es la del navegador (`LIB\formato.ts:14`) |
| Pestañas | Con ícono: `resumen`, `plan`, `lista`, `revision` (`ARM:85`) | Sin ícono (`NN:29-34, 112`) | Las claves de la URL no cambian. Cambiar de pestaña reemplaza la entrada del historial (`COMP\pestanas.tsx:38`): igual |
| Ayuda | «Cómo se lee esta vista» (`ARM:133`) | Ayudas sueltas (`ED:243-246`; `RG:62-66`) | Una por pestaña; en Plan, una para la lectura y otra para la edición |
| Estados | No dibujados | Sin sesión, cargando, falla, sin espacio profesional (`NN:94-97`); acceso retirado (`NN:104`) | Iguales, con el `h1` en todos |

### 2.1 Maqueta 16 · el plan activo

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Plan activo» · «Solo lectura» · «Versión 2 · activada el 7 sept · es lo que ve el asesorado» (`M16:36`) | `h2` (`PL:151`); insignia y «Versión N · activada el {fecha con hora}» (`PL:201-203`) | Conservar «Versión N · activada el» (`R:3151`). «es lo que ve el asesorado», solo si es la efectiva (`CN:237-238`) |
| Acciones | «Guardar como plantilla» y, lleno, «Crear nueva versión a partir de esta» (`M16:38-39`) | «Crear nueva versión…» arriba, solo sin borrador y con objetivo (`PL:132-144`); «Guardar como plantilla» debajo del plan, con su diálogo (`PL:155-171`) | Con un borrador abierto no se ofrece crear otro (`PL:7`; la API responde 409, `APL:161`). Falta lugar para «Empezar desde una plantilla» (§4.1) |
| Día tipo | Segmentos (`M16:45`) | Todos, uno debajo del otro (`PL:209-211`) | Con un solo día tipo no hay qué elegir: se dice su nombre, sin control (C-21, `CRIT:299-300`). Hasta 7 (`CN:169`) |
| Objetivo del día | Tira (`M16:46`) | No está en el plan | `TiraDelObjetivo`. DEC-15 |
| Rango del día tipo | `M16:49-55` | — | No entra (1.2) |
| Comida plegada | Cubiertos, nombre, «2 opciones · se elige una», flecha (`M16:60`) | `h4`, todo abierto (`PL:212-214`) | Botón con `aria-expanded`. Con una opción, «1 opción», sin «se elige una». Cuál arranca abierta: DEC-7 |
| Comida abierta | Opciones de a dos; «Ver la opción 3» (`M16:64, 73-100`) | Una debajo de otra (`PL:215-233`) | En la columna angosta de la ficha, una por fila (1.4) |
| Rango de la comida, «lo que cubren» | `M16:65-72` | — | No entra |
| Opción | «Opción 1: Pollo, arroz y verduras»; «Pollo · 120 g · cocido» (`M16:75-81`) | El mismo formato (`PL:217, 223-231`) | Con una sola opción, sin «Opción 1:» (`PL:217`) |
| Opción de receta | «De tu receta «Tarta de atún», versión 2 · una porción» (`M16:90`) | «Receta «…», versión N» y «La opción lleva los ingredientes de una porción de la receta.» (`PL:218-222`; `COPR:94, 96`) | Los textos de BE. `NRW:274` cuenta «Receta «» |
| Estimación | `M16:82-85` | No llega | No entra |
| Historial | Al costado, 340 px; la huella, al pie (`M16:111-118`) | Sección debajo (`PL:176-190`); huella bajo el título (`PL:204-208`) | Mismos textos; «Todavía no se activó ninguna versión.» (`PL:179`) |

### 2.2 Maqueta 17 · la versión en preparación

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Versión» · selector «3 · en preparación / 2 · activa» · «Borrador» · «El asesorado no la ve» (`M17:61-63`) | `h2` «Versión en preparación» con la insignia (`ED:240-242`); el plan activo, debajo (`PL:150-174`) | DEC-6. `NRW:224-225` espera ese texto y `section[aria-labelledby="titulo-borrador"]`. Punto 1.10 |
| Estado del guardado | Junto a los botones (`M17:65`) | Al pie, con `aria-live` (`ED:376-378`; `COPN:62-64`) | Los tres textos |
| Menú de la versión | «⋯ Más acciones de esta versión» (`M17:66`) | «Guardar como plantilla» entre los botones (`ED:408-415`) | Con su regla de recetas (`ED:411`) |
| Validar, activar, guardar | `M17:67-69` | `ED:398-407` | «Guardar cambios» apagado sin cambios (`ED:399`; `NRW:262` lo espera) |
| Día tipo | Segmentos, «＋ Agregar», menú «Cambiar el nombre de este día tipo o quitarlo» (`M17:75-76`) | `fieldset` con el nombre siempre abierto (`ED:256-258`); «Agregar día tipo» (`ED:359-361`); «Quitar día tipo» si hay más de uno (`ED:344-348`) | DEC-10. «Agregar» es un botón al lado del grupo, no una opción del grupo |
| Objetivo del día | Tira (`M17:77`) | Aviso si hay un objetivo más nuevo (`ED:248-252`) | El aviso se queda: dice un efecto de guardar (`GUIA:36-38`) |
| Rango del día tipo | `M17:79-86` | — | No entra |
| Comida plegada | `M17:89-91` | `fieldset` con «Nombre de la comida» (`ED:260-262`) | Plegada, tiene que avisar si adentro hay un problema o una cantidad ilegible |
| Comida abierta | «Subir», «⋯ Más» (`M17:97-98`) | «Subir» (apagado en la primera), «Quitar comida», «Guardar como habitual» (`ED:310-322`) | «Más»: cambiar el nombre, quitar, guardar como habitual |
| Opciones | Pestañas; «Agregar opción ▾» (`M17:104-109`) | Un `fieldset` por opción, todas abiertas (`ED:263-297`); «Agregar opción» y «Agregar receta como opción» (`ED:299-309`) | Hasta 12 (`CN:162`): tienen que poder desplazarse. El nombre largo se corta en la pestaña y se lee entero adentro (C-38) |
| Ítems | Tabla: alimento, cantidad, unidad, estado de preparación, quitar (`M17:110-116`) | `FilaDeItem` (`ED:468-527`) | Conservar: el campo guarda lo escrito (`ED:470-479`); el error bajo la cantidad (`ED:481, 491`); la unidad apagada sin cantidad (`ED:503`); «Sin indicar» (`ED:514`); el botón de quitar con su nombre, «Quitar {alimento}» (`ED:522-524`) |
| Opción de receta | Pestaña con ícono (`M17:106`); el contenido no está dibujado | `OpcionDeReceta` (`ED:697-719`) | En lectura, sin campos ni «Agregar ítem» (`ED:267-268`); antes de guardar, «Los ingredientes de una porción se cargan al guardar el borrador.» (`COPR:97`) |
| Pie de la opción | «＋ Agregar ítem», «Del catálogo BE, de tus habituales o creado a mano», «Cambiar el nombre», «Quitar opción 1» (`M17:117-121`) | «Agregar ítem» (`ED:587-593`); «Quitar opción N» (`ED:293-295`) | §2.4 |
| Rango de la comida | Columna de 510 px (`M17:124-134`) | — | No entra. DEC-13 |
| Agregar comida | «＋ Agregar comida», «Agregar una comida habitual» (`M17:144-147`) | «Agregar comida» (`ED:341-343`); lista y botón que no se dibujan si no hay ninguna (`HA:264-302`) | Una comida nace sin nombre (`ED:341`) y el contrato no admite el nombre vacío (`CN:160`). DEC-10 |
| Próxima revisión | No está: pasa a la 18 | Campo al pie (`ED:364-374`) | §2.3 |
| Problemas | No dibujados | Aviso con «Día → Comida → Opción N → Ítem N → motivo» (`ED:384-397`; `ED:94-116`) | Se queda, arriba |

### 2.3 Maqueta 18 · activar el plan

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Al abrir | El editor ya dice «Guardado» (`ARM:48`; `M18:2`) | «Activar plan» apagado con cambios sin guardar (`ED:405, 417`) | C-40: con cambios, guardar y recién después abrir. Si el guardado falla, no se abre y se dice por qué (`ED:189-192`) |
| Título y texto | «Activar plan» y el texto de BE (`M18:24-25`) | `ED:444, 457`; `COPN:69-71` | Palabra por palabra: ya coincide |
| Qué entra y qué queda | «Versión 3 pasa a ser la vigente: 2 días tipo y 8 comidas.» · «Versión 2, activa desde el 7 sept, queda en el historial.» (`M18:26-29`) | No existe | Se cuenta de la estructura (`ED:122`) y de la versión efectiva (`PL:48`). En la primera activación no hay segunda línea. El número: DEC-6 |
| Próxima revisión | Fecha «opcional» y su ayuda (`M18:30-34`) | El campo del editor, con la misma ayuda (`ED:364-374`) | Punto 1.6. DEC-8 |
| Botones y foco | El foco en «Volver» (`M18:19, 35`) | `DialogoDeConfirmacion` (`ED:442-458`) | Con un campo antes de los botones, el foco inicial cae en el campo (`COMP\dialogo.tsx:5-6`). DEC-9 |
| Errores | No dibujados | Con problemas, el diálogo se cierra y se listan (`ED:221-225`); sin capacidad, otro plan vigente, resultado incierto y falla, adentro (`ED:226-228`; `COPN:72, 75`) | Iguales |
| Después | No dibujado | «Versión activada. El asesorado ya ve esta planificación como vigente.» y se relee (`PL:125-128`) | Igual. `NRW:270-271` espera que el diálogo se cierre y «Plan activo» |

### 2.4 Maqueta 21 · agregar un ítem

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Contenedor | Panel a la derecha con velo; el editor se ve detrás (`M21:2-5`) | Un recuadro dentro de la opción (`ED:594-690`) | Diálogo modal al costado: retiene el foco, Escape cierra y el foco vuelve a «Agregar ítem». Lo de atrás se ve y no se toca |
| Cabecera | «Almuerzo · opción 1: Pollo, arroz y verduras» · «Agregar ítem» · «Cerrar» (`M21:37-38`) | «Cerrar búsqueda», al pie (`ED:686-688`) | — |
| Buscador | Campo con lupa, con el foco, y «4 en el catálogo» (`M21:40`) | Campo con rótulo y botón «Buscar»; busca al enviar (`ED:545-550, 596-601`) | Se piden 20 y no llega un total (`CLI:751-753`; `CN:317`): la cuenta es exacta solo sin más páginas. DEC-11 |
| Habituales | «Alimentos habituales · Los que marcaste: se agregan con un clic»; chips (`M21:43-49`) | «Mis habituales», una lista de botones con aspecto de enlace (`HA:77-101`) | «Alimentos habituales» ya está en el dominio (`DOM\copy-habituales.ts:10`). Se quedan el vacío (`HA:82`) y el motivo si falla al marcar (`HA:94-98`) |
| Resultados | Tabla «Cada 100 g»: calorías, carbohidratos, grasas, proteínas (`M21:54-63`) | «{nombre} · {kcal} kcal cada 100 g» o «cada 100 ml» (`ED:617-623`) | Los cuatro valores llegan (`CN:291-299`). Hay alimentos cada 100 ml (`CN:292`): el título no vale para toda la tabla |
| Procedencia | «Importado de Open Food Facts · 2 oct» (`M21:67`) | `ED:622`; `IM:341-344` | Igual |
| Por fila | Chinche («Marcar como habitual» o «Quitar de habituales») y «Elegir» (`M21:64-67`) | `BotonHabitual`, con `aria-pressed` y nombre (`HA:104-111`); «Elegir {alimento}» (`ED:625-636`) | «Elegir» necesita el alimento en su nombre accesible; `NRW:249-250` lo busca por ese texto |
| Pie | «El alimento se agrega sin cantidad…» · «Catálogo BE con valores sintéticos de demostración.» · «Crear manualmente» · «Importar desde Open Food Facts» (`M21:71-76`) | `ED:602` (`COPN:97`); `ED:663-685` | El ítem ya nace sin cantidad (`ED:288`). DEC-12 |
| Sin resultados | No dibujado | «No encontramos alimentos con ese nombre.» (`ED:615`) | Igual, y distinto de una falla (1.11) |

### 2.5 Maqueta 20 · los registros

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Registros» · «Lo indicado y lo registrado, día por día. Lo que no se registró dice «Sin registro»: no se interpreta.» (`M20:53`) | Plegado en «Cómo se lee»: «Lo prescripto y lo registrado…» (`RG:62-66`) | «Prescripto» o «indicado»: §4.3 |
| Período | Un control: «Período: 21 – 27 sept 2026 · 7 días» (`M20:54`) | «Desde», «Hasta», «Ver período» (`RG:44`) y «Período: X a Y» (`RG:59-61`) | Hasta 92 días (`PER:20`). Sin elegir, los siete que propone la API, dichos (`ARV:38, 79-80`; `RG:7-8`). El control queda fuera del estado de lectura (`RG:43`). DEC-20 |
| Vistas | «Todas las comidas 28 · Distinto de lo indicado 1 · Sin confirmar 1 · Comida diferente 1 · Sin registro 5» (`M20:57-62`) | No hay filtros | Punto 1.3. Una vista en cero se muestra con su cero (E-67, `WP:206`) |
| Columnas | Una vez: comida, registrado, cantidades, diferencia observada (`M20:67`) | Una tabla por día, con tres columnas (`RG:72-80`) | Si las filas dejan de ser una tabla, el lector de pantalla pierde las columnas: o es una tabla con un cuerpo por día, o cada dato lleva su rótulo oculto |
| Día liso | «27 sept · domingo» · «3 de 4 comidas registradas · 1 sin registro» (`M20:69-77, 99-102`) | Una sección por día (`RG:68-69`) | DEC-3 y DEC-5. Día sin ningún registro: «Sin registro» (`RG:70`) |
| Día abierto | Tarjeta con sus comidas (`M20:79-97`) | `RG:82-119` | El orden es el del plan (`NU:429-433`) |
| Fila registrada | «Desayuno · Tostadas con queso · Porciones del plan · Igual a lo indicado ›» (`M20:82`) | «Registrado», la observación y «Ver registro» (`RG:88-93`) | La fila entera abre el detalle. Las palabras: DEC-4 |
| Con cantidades informadas | «Cantidades informadas» · «Pollo +30 g · Aceite +5 g» (`M20:93`) | «{ítem}: prescripto X · registrado Y · ±Z» (`RG:109-115`) | La resta llega sin «no lo comió» (1.16): §3 |
| Sin registro | «Merienda · Sin registro» (`M20:84`) | `RG:104` | Sin flecha: no abre nada |
| Con comida diferente | «Sin opción del plan registrada» · «Comida diferente: «Pizza con amigos», 3 porciones» · «No se resta» (`M20:85`) | «Sin opción del plan registrada · Comida diferente registrada» y «Ver registro» (`RG:94-102`); y otra vez en «Fuera del plan» (`RG:128-138`) | C-50. Sigue sin contar como comida registrada (`CN:469-473`) |
| Días anteriores | «Ver el 22 y el 21 sept» (`M20:103`) | Todos los días del período | Es local: la lectura trae el período entero |
| Detalle | Al costado, 420 px (`M20:106-133`) | Se despliega debajo con «Ver registro» (`DR:35-45`); la estimación, en «Fuera del plan» (`RG:219-273`) | Al abrir, el foco va al título; «Cerrar» y Escape lo devuelven a la fila (como `LT:299-332`). Lo que el detalle de hoy dice y la maqueta no: §4.1 |

### 2.6 Maqueta 06 · preparar revisión (Nutrición)

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Nueva revisión de Nutrición» · «En preparación · sin registrar» (`M06:49`) | Botón «Nueva revisión» que abre el formulario en el lugar; `h2` «Nueva revisión» (`RV:226-233, 253`) | DEC-17 |
| Período | «Período: del 10 al 27 sept, desde tu última revisión» · «Cambiar el período» (`M06:50`) | Aviso «Preparado por BE para esta revisión: el período va del … (la última revisión fue el …) a hoy. …» (`RP:60-72`), «Período: X a Y» (`RV:255-257`) y el filtro, arriba de todo (`RV:70`) | Punto 1.7. Sin revisiones previas el período es el que propone la API y se dice (`RP:67`). DEC-19 y DEC-20 |
| Paso 1 | «Lo que miraste · Marcá solo lo que examinaste. Nada viene marcado.» (`M06:55`) | «Evidencia que examinaste» y una ayuda más larga (`EV:96-99`) | La frase «dejá marcados solo los que miraste» es la que pide `GUIA:345-350`: se queda |
| Plan y objetivo | «Plan · versión 2, activado el 7 sept» · «Objetivo vigente» (`M06:57-58`) | Subtítulo «Planificación y objetivo»; «Plan activado el {fecha con hora}» (`EV:110-119`; `RV:180-181`) | El número de versión no viene en el contexto (`CN:557`): sale de la lista de planes, que esta pestaña hoy no lee (`RV:49`). `RC:1501` toca `.evidencia__seccion > .acto input` |
| Todo el período | «Marcar las 44 comidas» (`M06:60`) | «Marcar las N comidas del período (D días) · sin marcar» (`EV:127-131`) | — |
| Días | Grilla de tres: «11 sept · 3 comidas · Ver»; en parte, «24 sept · 2 de 4 comidas»; sin registros, «14 sept · sin registros», sin casilla (`M06:16-23, 110-120`) | Una fila por día con registros: «{día} · marcar las N comidas · {estado}» y «Ver las N» (`EV:41-66`) | Los días sin registros llegan (`CN:560-561`; `ARV:156`) y hoy no se usan acá. Un día sin registros no puede llevar la clase `.evidencia__dia`, y las comidas de un día siguen dentro del suyo (1.7). DEC-18 |
| Lo marcado | «Marcaste 3 comidas de 2 días.» · «Ver lo que marcaste» (`M06:62`) | «Marcaste 3 de 46: 3 comidas de 2 días.» (`EV:106-108`; `EVL:53-66`) y «Lo que marcaste (N)», con «Quitar» y «Desmarcar todo» (`EV:141-163`) | El texto tiene prueba (`SCR\evidencia-de-revision.test.mjs:52, 61`). DEC-19 |
| Paso 2 | «Lo que observaste»: interpretación, «Describe lo observado. No es un diagnóstico.» (`M06:66-70`) | `RV:268-288`; el texto de BE, `COPN:93` | El de BE |
| Paso 3: resultado | Seis en dos columnas; «Qué hace cada resultado»; el efecto del elegido (`M06:72-84`) | Seis, cada uno con su efecto debajo (`RV:289-303`; `COPN:26-43`) | Nada viene elegido (`RV:162`). Los efectos no se reescriben (`WP:76-77`); los otros cinco, a un clic (C-15) |
| Fundamento, próxima acción, próxima revisión | `M06:85-98` | `RV:304-333` | Con «Finalizar», «Cierre» y sin fecha (`RV:315, 324`); con «Reprogramar», la fecha es obligatoria (`RV:192, 327`) |
| Nuevo objetivo | No dibujado | Con «Cambiar objetivo», nueve campos (`RV:334-339`; `FO:214-310`) | §4.1 |
| Errores | No dibujados | Resumen con enlaces a cada campo y error en el campo (`RV:186-196, 235-249, 258`; `COMP\formulario.tsx:52-72`) | Los identificadores no cambian: `revision-evidencia`, `-interpretacion`, `-resultado`, `-fundamento`, `-accion`, `-proxima` |
| Barra | Fija abajo: «Todavía no se registró nada. Registrar deja asentada la revisión; no cambia el plan.» · «Cancelar» · «Registrar revisión» (`M06:103-106`) | Botones al pie del formulario (`RV:345-352`); arriba, «Abrir esta pantalla no cuenta como revisión…» (`RV:74`; `COPN:92`) | La clase que ya existe se pega al pie con `position: sticky` (`CSS:2416-2425`): la barra queda dentro del `form` (1.7) y no suma un desplazamiento propio. Un error enfocado queda por encima (`CSS:2412-2414`; `GUIA:572`) |

**Qué difiere en Entrenamiento** (la maqueta está dibujada solo para Nutrición):
- **Contexto e identificadores:** `useEntrenamiento` y `trn-revision-…` (`TRV:151, 182-189, 249, 259-298`).
- **La evidencia son sesiones:** «{sesión} · {condición registrada}», por día (`TRV:169-174`); «sesión» y «sesiones» (`TRV:253`); «No hay sesiones registradas en el período.» (`TRV:254`).
- **Los días sin registro:** hay una línea que los cuenta (`TRV:257`). En Entrenamiento lo común es que la mayoría de los días no tenga sesión: una grilla con todos los días del período quedaría casi toda en «sin registros» **[supongo]**. DEC-18.
- **El botón y el título dicen «Registrar revisión»** (`TRV:235, 242`), no «Nueva revisión».
- **La interpretación no lleva la ayuda** de «no es un diagnóstico» (`TRV:258-261`).
- **Los errores van al resumen** (`TRV:247`) y, de los campos, solo la evidencia marca el suyo (`TRV:255`): la interpretación, el resultado, el fundamento y la acción no (`TRV:258-279`).
- **El resultado** tiene una ayuda propia (`TRV:264`) y sus propios efectos (`TRV:268`).
- **«Cambiar objetivo» pide dos campos,** no nueve (`TRV:289-301`).
- **Aplicar** se llama «Aplicar próxima acción» y avisa «Próxima acción aplicada…» (`TRV:341-344, 370`), no «Aplicar continuidad».
- **Sus comprobaciones:** `RC:1488-1539` (§7.1, fila 20).

### 2.7 Estados (`CRIT:222-235`)

| Estado | Hoy | Con el bloque de estado |
|---|---|---|
| Cargando | «Cargando…» (`NN:69`; `COMP\estados.tsx:15-21`) | Que diga qué se carga, y que lleve `.cargando` (1.14) |
| No se pudo leer | «No pudimos cargar esta vista.», sin motivo (`NN:71`) | Con su motivo y «Reintentar» (1.11) |
| Falló una parte | No existe | En Registros: si la segunda lectura falla, los días se ven igual y lo que depende de ella dice «No pudimos completar esta parte», sin números (DEC-1). En el plan: la tira del objetivo ya lo sabe decir (`TIRA:68-75`) |
| Sin datos | «Todavía no hay un plan activo.» (`PL:152`); «Para planificar, primero definí el objetivo…» (`PL:112-116`); «Todavía no hay revisiones registradas.» (`RV:123`); día «Sin registro» (`RG:70`) | Con su acción cuando existe: «Crear nuevo plan», «Ir a Resumen» |
| Sin coincidencias | No existe | Una vista de Registros en cero: que con eso elegido no hay, cuántas comidas hay en el período y «Ver todas» |
| Sin acceso | «No encontramos un recurso disponible para esta acción.» y «Volver» (`NN:56-65`); en el detalle, «Este registro no está disponible con tu acceso actual.» (`DR:87`) | Los textos de BE |
| Acceso retirado al escribir | Se retira toda la pestaña (`NN:86-91, 104`) | Igual |
| El contenido cambió | «Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.» (`LIB\intento.ts:49-53`) | Punto 1.16: falta con qué actualizar sin perder lo escrito |
| Resultado incierto | «No pudimos confirmar el resultado. Reintentá.» (`DOM\copy.ts:41`); en la importación, el candidato queda bloqueado (`IM:156-159, 239-245`) | Igual |

### 2.8 En 1280 y en 1024 (`CRIT:252-255`); 768 y 390

| Pantalla | Regla escrita | Qué cuidar |
|---|---|---|
| 06 | 1280: los días, de a dos por fila. 1024: una sola columna, los tres pasos uno debajo del otro; la barra sigue fija | `RC:502-532` la captura a esos tres anchos y exige que no haya desborde ni doble desplazamiento |
| 16 | 1280: el historial se angosta. 1024: el historial va debajo; las opciones, una por fila | La misma pieza va en la columna angosta de la ficha (1.4): conviene que responda al ancho de su caja, no al de la ventana |
| 17 | 1280: el rango de la comida se angosta. 1024: va debajo de los ítems | Sin rangos, no aplica. La tabla de ítems tiene 484 px de columnas fijas más el nombre (`M17:111`) |
| 20 | **No hay regla escrita** | Por analogía con la línea de tiempo y con los registros de Entrenamiento (`CRIT:248, 259`): al costado desde 1.200 px; más angosto, encima. A 1280, con el detalle abierto, la fila no entra en un renglón **[estimo: quedan unos 70 px para el nombre de la opción]** |
| 21 | **No hay regla escrita** | El panel de hoy mide 46 vw: 589 px a 1280 **[estimo]**, para una tabla de cinco columnas y dos botones |
| 18 | — | Es un diálogo: no cambia |
| 768 y 390 | No se rompe (`WP:66, 289`) | `NRR:71-74` comprueba el plan activo a 390 sin desborde |

## 3. Qué dato llega y qué no

| Lo que muestra el diseño | ¿Llega? | Operación y campo | Con lo que hay |
|---|---|---|---|
| La persona, en el marco | La referencia | API-REL-05, `advisee.displayName` (`WS:111, 162`) | Sin alias |
| Acceso actual del área | Sí | API-REL-05: estado del vínculo, del consentimiento y del acceso | `estadoParaMostrar` (`WS:290-297`) |
| «Consultado a las…» | No | — | El reloj del navegador |
| «Versión 2 · activada el 7 sept» | Sí | API-NUT-08 y 09, `activatedAt` (`CN:240`) | El número se calcula (`PL:27-30`) |
| «es lo que ve el asesorado» | Sí | `isEffective` (`CN:237-238`) | — |
| Días tipo, comidas, opciones, ítems | Sí | API-NUT-09, `dayTypes` (`CN:173-200, 246`) | — |
| «2 opciones · se elige una» | Se cuenta | — | — |
| «Objetivo del día» | Sí | API-NUT-06 (`CN:120-121, 134`), o API-NUT-05 por `objectiveVersionId` (`CN:235`) | DEC-15 |
| Rango del día tipo y de la comida | **No existe** | `CN:158-168` | Fuera (§3.1) |
| Estimación de cada opción | **No llega** | `CN:173-182, 192` | Fuera (§3.1) |
| «Lo que cubren las N opciones» | **No** | Depende de lo anterior | Fuera |
| La receta de una opción | Sí | `recipe` (`CN:184-190, 208`) | — |
| Historial y huella | Sí | API-NUT-08 (`CN:251-252`); `snapshotDigest` (`CN:241-242`) | — |
| «3 · en preparación» | El número, no | Un borrador no tiene `activatedAt` (`CN:240`) | Activadas más uno. DEC-6 |
| Cantidad, unidad, estado de preparación | Sí | `CN:141-147`; g, ml o unidad (`CN:35`) | — |
| «2 días tipo y 8 comidas» | Se cuenta | La estructura en pantalla | — |
| «Versión 2, activa desde el 7 sept» | Sí | `activatedAt` de la efectiva | — |
| La próxima revisión, al activar | Se guarda antes | API-NUT-10, `nextReviewAt` (`CN:259`) | Punto 1.6 |
| Alimentos habituales | Sí | API-HAN-01 (`CLI:677-679`) | — |
| Calorías y macros cada 100 g | Sí | API-NUT-13-BUSQUEDA, `composition` (`CN:291-299`) | — |
| «4 en el catálogo» | A medias | 20 por búsqueda, sin total (`CLI:752`; `CN:317`) | «20 o más» si hay más páginas |
| Procedencia de un alimento | Sí | `externalSource` (`CN:312-313`) | — |
| Los días con las comidas del plan | Sí | API-NUT-17, `descriptiveContrast.days[].meals[]` (`CN:481-490`) | — |
| Registrado o sin registro | Sí | `state` (`CN:466`) | — |
| El nombre de la opción registrada | **No en API-NUT-17** (`CN:467`: solo el identificador) | API-DSH-04, detalle «Opción» (`ALT:177`) | O el plan de cada versión del período (API-NUT-09; `CN:391, 401`), o API-ING-03 por registro (`CRC:139`) |
| «Porciones del plan», «Cantidades informadas», sin confirmar | **No en API-NUT-17** (`CN:402`; `ACC:56-61`) | API-DSH-04, `quality` (`CA:371-381`; `ALT:156-158`) | O API-ING-03, `consumption.status` (`CRC:117-124`) |
| «Igual a lo indicado», «Distinta de lo indicado en…» | **No en API-NUT-17** | API-DSH-04, detalle «Frente a lo indicado», solo con cantidades informadas (`ALT:182`) | Lo demás se dice con `frenteALoIndicadoEnPalabras` (`CDC:119-134`), como en `CON:150-155` |
| «Pollo +30 g · Aceite +5 g» | A medias | `quantityDifferences` (`CN:477-479`): solo ítems con cantidad en la misma unidad (`NU:387-400`) | Entero, en el detalle (`DR:145-173`). §3.1 |
| La comida diferente, en su comida | Sí | `differentMealExecutionIds` (`CN:475`); `outsidePrescription` (`CN:489`) | — |
| «Pizza con amigos» y «3 porciones» | Sí | `description` (`CN:405`); `approximateQuantity` (`CRC:145`; `ALT:179`) | El contexto trae además `portionDescription` (`CN:406`; `RG:205`) |
| Las cantidades de las vistas | **No** | — | Contar en el navegador, con el período leído entero |
| «3 de 4 comidas registradas» | Se cuenta | `meals[].state` | — |
| «el 25 sept a las 21:40» | Sí | `occurredAt`, `timeZone` (`CN:395, 398`) | — |
| Las fotos | Sí | API-ING-03, `evidence` (`CRC:147`) y API-MED-03 (`DR:195-204`) | Cada foto es una lectura protegida más (1.12) |
| «Macros sin calcular» y lo consumido | Sí | `consumed` (`CRC:141-142`) | — |
| La estimación del profesional | Sí, por otra lectura | `corrections` y `effectiveView` de la ingesta (`CN:407-408`): están en API-NUT-17, no en API-ING-03 (`CRC:126-149`) | El detalle necesita las dos |
| «del 10 al 27 sept, desde tu última revisión» | Sí | `previousReviews[].recordedAt` (`CN:562`; `RP:50-57`) | — |
| «Plan · versión 2» en la evidencia | La fecha; el número, con otra lectura | `activePlanVersions` (`CN:557`) y API-NUT-08 | — |
| Los días sin registros, en la evidencia | Sí | `missingData` (`CN:560-561`) | — |
| «Marcar las 44 comidas» | Sí | `registeredIntakes` (`CN:558`), sin las anuladas (`ARV:106-113`) | — |
| El efecto de cada resultado | Sí, del dominio | `COPN:36-43` | — |

### 3.1 Pide ampliar la API (no está en los pasos)

1. **La estimación de cada opción en el plan del profesional** (C-36). `OpcionDeComidaSchema` (`CN:192`) e `ItemPrescriptoSchema` (`CN:173-182`) no traen aporte. Para una opción de receta en su versión vigente sí llega la estimación por porción, por las recetas (`DOM\contratos-recetas.ts:59-63, 141`; `ED:763`): es una parte, no el dato. DEC-14.
2. **«Lo que cubren las N opciones».** Depende de la anterior.
3. **Los rangos de macros por día tipo y por comida.** Tocan el legajo, el contrato, la base, el editor y Analizar (`CRIT:505-518`). Abren además si el objetivo pasa a ser por día tipo (`CRIT:515-518`).
4. **El modo de las cantidades y el nombre de la opción, en el contraste** (`CN:462-480`). Con eso Registros se arma con una sola lectura. Mientras tanto, con dos (DEC-1).
5. **«No lo comió» y «sin cantidad», en las diferencias del contraste** (`CN:477-479`; `ACC:56-61`).
6. **El total de una búsqueda del catálogo** (`CN:317`).

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Hoy existe y la maqueta no lo muestra (dónde quedaría)

| # | Qué | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | La miga | `NN:101` | Sale, como en la ficha; «Volver a la ficha», siempre (DEC-16) |
| 2 | «Para planificar, primero definí el objetivo en Resumen…» | `PL:112-116` | Bloque de «sin datos» del plan, con «Ir a Resumen» |
| 3 | «Crear nuevo plan» y «Todavía no hay un plan activo.» | `PL:139-143, 152` | Bloque de «sin datos», con su acción |
| 4 | «Empezar desde una plantilla»: lista, «Crear el borrador desde esta plantilla», «No tenés plantillas activas para aplicar.» | `PL:145`; `PT:121-152` | Junto a «Crear nueva versión…» o «Crear nuevo plan», como un botón quieto que abre la lista en un diálogo |
| 5 | Avisos de «Borrador creado», «Borrador creado desde la plantilla…», «Versión activada…», «Plantilla guardada…» y sus errores | `PL:79-80, 93-94, 107-111, 126, 169` | Iguales |
| 6 | El plan activo a la vista mientras hay un borrador | `PL:150-174` | En el selector de versión |
| 7 | La ayuda «Qué es una versión en preparación» | `ED:243-246` | «El asesorado no la ve», a la vista; «Guardar no activa» y «La versión activa no cambia hasta que actives esta», en «Cómo se lee esta vista» |
| 8 | La nota de origen de la plantilla | `ED:247`; `PT:154-167` | Una línea bajo el título de la versión |
| 9 | «Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.» | `ED:248-252` | A la vista, junto a la tira del objetivo |
| 10 | Los campos de nombre del día tipo, de la comida y de la opción | `ED:258, 262, 266` | A pedido (DEC-10) |
| 11 | «Quitar comida» y «Guardar como habitual», con su aviso de recetas | `ED:313-322`; `COPR:98` | Menú «Más» de la comida |
| 12 | «Quitar día tipo» | `ED:344-348` | Menú del día tipo |
| 13 | «Agregar receta como opción» y la lista de recetas: «Ver más», vacío con enlace a «Mis recetas», error si la cuenta no tiene Nutrición | `ED:302-309, 324-336, 722-782` | Dentro de «Agregar opción»; la lista, en el panel al costado (DEC-12) |
| 14 | «Las opciones de una comida no son equivalencias nutricionales: cada una muestra su propia estimación.» | `ED:337`; `COPR:95` | Bajo las pestañas de una comida con recetas. Habla de una estimación que el website todavía no muestra: §9 |
| 15 | La lista de comidas habituales, con «N alimentos» y «con o sin cantidades», y su aviso al agregar | `HA:264-302` | El botón de la maqueta la abre; sin ninguna, lo dice (`DOM\copy-habituales.ts:23`) |
| 16 | La próxima revisión | `ED:364-374` | En el diálogo de activar |
| 17 | La lista de problemas de «Validar plan» y de guardar, y «Plan válido» | `ED:209, 384-397` | Arriba, bajo el título; y una marca en la comida y en la opción que lo tienen |
| 18 | «Hay cantidades que no se entienden…» | `ED:173-176` | Igual |
| 19 | «Guardá los cambios antes de activar.» | `ED:417` | Deja de hacer falta (C-40) |
| 20 | Los diálogos de «Guardar como plantilla» y «Guardar como habitual» | `PT:25-119`; `HA:142-257` | Iguales |
| 21 | «Crear manualmente»: nombre y cuatro valores cada 100 g, con sus errores | `ED:552-585, 642-662` | Dentro del panel, al elegirlo |
| 22 | «Importar desde Open Food Facts»: código, candidato, siete campos, importar o rechazar, resultado incierto, proveedor caído | `IM:74-338` | Dentro del panel |
| 23 | La lista «Fuera del plan» al pie de cada día | `RG:128-138` | Cada comida diferente, en su comida; la que no se registró en ninguna, en un renglón propio del día (C-50) |
| 24 | «Estimación profesional: … (autor, fecha; N estimaciones en la historia)» y «La historia de estimaciones no se puede resolver.» | `RG:207-217` | En el detalle, como un bloque más |
| 25 | El formulario de «Agregar estimación»: qué estimás, gramos, alimento del catálogo, errores | `RG:219-270` | Se abre desde el detalle |
| 26 | «· porción: …» y la observación de la fila | `RG:91, 205` | En el detalle (`DR:123` ya dice la observación) |
| 27 | «El plan tiene más de un día tipo y ese día no hay registros que indiquen cuál correspondía.» · «Ese día no había un plan vigente.» | `RG:123-127` | En el renglón de ese día |
| 28 | Del detalle: registro deshecho; estado de las cantidades; tabla por ingrediente; «Cantidades completadas o corregidas el…»; lo consumido y «Sin cantidad o sin dato: …»; «Registrado el…»; la foto que no se pudo mostrar | `DR:93, 101, 103-105, 135, 145-193, 200` | Todo se queda en el detalle |
| 29 | La lista «Revisiones registradas»: «Aplicar continuidad», el efecto de lo que falta aplicar, «Aplicada {fecha}», sus avisos y «Abrir el borrador en Plan» | `RV:76-97, 121-136, 357-415` | El estado por defecto de la pestaña (DEC-17) |
| 30 | «Revisión pendiente desde el…» | `RV:98-104` | Arriba de la lista y, en la 06, junto al período |
| 31 | Seguimiento cerrado o sin empezar | `RV:116-120` | En el lugar de «Nueva revisión» |
| 32 | «Abrir esta pantalla no cuenta como revisión…» | `RV:74` | En la lista y en «Cómo se lee esta vista» |
| 33 | En la evidencia: el subtítulo «Planificación y objetivo»; el estado de cada grupo («sin marcar», «todas marcadas», «N de M marcadas»); «Quitar» y «Desmarcar todo» | `EV:34, 112, 149-161` | El estado de cada día, en su renglón; lo demás, en «Ver lo que marcaste» |
| 34 | El grupo «Nuevo objetivo», con sus nueve campos | `RV:334-339` | En el paso 3, debajo del efecto, cuando se elige «Cambiar objetivo» |
| 35 | El resumen de errores y la falla al registrar | `RV:258, 340-344` | Arriba de los pasos; la falla, sobre la barra |
| 36 | Después de registrar: «Revisión registrada. Todavía no se aplicó: aplicala desde la lista.» con «Volver a la ficha, donde estabas» | `RV:79-83, 112` | Igual, y la pantalla vuelve a la lista |
| 37 | La pestaña «Resumen»: estado del seguimiento, objetivo con su historia, «Nueva evaluación», «Definir objetivo» o «Nueva versión de objetivo» | `RS:116-237`; `FO` | Queda como está, con el marco nuevo: falta dibujarla (`CRIT:600`) |

### 4.2 La maqueta lo muestra y BE no lo tiene

- **No existe el dato:** los rangos por día tipo y por comida; el alias.
- **Existe y no llega al profesional:** la estimación de cada opción y lo que cubren las opciones.
- **Llega por otra lectura:** el nombre de la opción, el modo de las cantidades y lo comprobado frente a lo indicado (Registros); el número de versión de un plan (evidencia).
- **Hay que calcularlo en el navegador:** las cinco cantidades de Registros; «N de M comidas registradas»; «2 días tipo y 8 comidas»; el número que va a tener el borrador; la hora de la consulta.
- **Es pantalla nueva sobre datos que llegan:** el marco; el selector de versión; los días tipo como segmentos; las comidas plegadas; las opciones en pestañas; la tabla de ítems; el panel de «Agregar ítem» con los cuatro valores; las vistas de Registros y el detalle al costado; los tres pasos de la revisión, la grilla de días con los que no tienen registros y la barra.

### 4.3 La maqueta dice algo que en BE no es así, o no dice lo que BE dice

| La maqueta | En BE | Qué hacer |
|---|---|---|
| «Acceso actual · Nutrición · Activo» | «Activo · acceso contextual» y cinco estados más (`DOM\copy-vinculo.ts:218-228`) | Las de BE |
| «Ana Ruiz · Asesorado · 5db647» | Sin alias | Un renglón |
| «De tu receta «Tarta de atún», versión 2 · una porción» | «Receta «Tarta de atún», versión 2» y «La opción lleva los ingredientes de una porción de la receta.» (`COPR:94, 96`) | Las de BE |
| «3 · en preparación»; «Versión 3 pasa a ser la vigente» | Un borrador no tiene número hasta activarse (`GUIA:393-395`; `PL:23-30`) | DEC-6 |
| «Igual a lo indicado» junto a «Porciones del plan» (`M20:82`) | Con las porciones del plan confirmadas BE dice «Sin diferencia: son las porciones del plan»; «Igual a lo indicado» es para cantidades informadas que coinciden (`CDC:123-130`; `DOM\comprension-del-dashboard.test.ts:782`; `RC:904-910`) | Las de BE (DEC-4) |
| «No se resta» (`M20:85`) | «No se compara: fuera de lo indicado» (`CDC:132`) | La de BE |
| «Lo indicado y lo registrado» | La pantalla dice «prescripto» (`RG:64`; `COPN:78`) y el detalle, «Indicado» (`DR:155`) | Una sola palabra. El código atribuye «Prescripto» al legajo (`RG:4-5`): no lo abrí. DEC-4 |
| «Lo registró en «Cena» el 25 sept a las 21:40. No reemplaza la comida prescripta.» | «Lo registró en «Cena». En el contraste figura fuera del plan: no reemplaza la comida prescripta.» (`COPR:139`) | El de BE; la hora, aparte |
| «Una descripción y una foto no alcanzan para calcularlos. Podés sumar tu estimación…» | No existe | Texto nuevo |
| «Cada 100 g», para toda la tabla | Hay alimentos cada 100 ml (`CN:292`) | Decirlo en la fila que difiere |
| «4 en el catálogo» | La búsqueda no da un total | «20 o más» si hay más páginas |
| «Marcaste 3 comidas de 2 días.» | «Marcaste 3 de 46: 3 comidas de 2 días.», con prueba | DEC-19 |
| «Reprogramar la revisión», «Cambiar el objetivo» | «Reprogramar revisión», «Cambiar objetivo» (`COPN:30-31`). La línea de tiempo ya dice las de la maqueta (`ALT:51-52`): hoy BE tiene las dos | DEC-19 |
| «**Mantener:** el plan sigue igual…» | «El plan sigue igual. Se registra la próxima acción.» (`COPN:37`) | El nombre en negrita y el efecto, tal cual |
| «Marcá solo lo que examinaste. Nada viene marcado.» | Una frase más larga (`EV:98`) | La de BE |
| «Registrar deja asentada la revisión; no cambia el plan.» | No existe; es cierto: aplicar es otro acto (`RV:8`) | Texto nuevo |
| La 06 con «Mantener» elegido | Nada viene elegido (`RV:162`) | Sin elegir, el lugar del efecto dice que falta elegir |
| «Plan · versión 2, activado el 7 sept» | «Plan activado el 4 sept 2026, 09:30» (`RV:180`) | Con la lista de planes |
| «Hoy, solo en la APK»; «Propuesta · dato nuevo» | — | No se dibujan en el producto |

## 5. Pasos, en un orden que deja la pantalla funcionando

Cada compilación del website tarda varios minutos y va con la API apagada (lo dice el plan de la parte 5, `EA\relevamientos\espacio-profesional-plan-de-implementacion.md:311`). Conviene agrupar: un paso, una compilación.

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Sin compilar: el «antes» y los datos.** Capturas de las cuatro pestañas y de la revisión preparada a 1440, 1280, 1024, 768 y 390. Decidir con qué datos se van a mirar el editor, una receta y dos días tipo (DEC-25) | — | Ninguno | `H\ver.mjs` con `nombre=pro/advisees/nutrition?id={a}&vista=plan` (la ruta, sin la barra inicial: `H\ver.mjs:5-7`) |
| 1 | **Sin pantalla: las reglas.** Los días de Registros (unir el contraste con los registros de la línea de tiempo; filas, estados y vistas con su cuenta); el resumen de un día; qué entra y qué queda al activar; los días de la evidencia con los que no tienen registros; los textos nuevos. Y sumar a la prueba de palabras lo que hoy no mira (1.15) | Módulos puros en `NUT` o en `DOM`; `EVL`; `SCR\copy-pantallas.test.cjs`; pruebas nuevas en `SCR` y su alta en `REPO\package.json:33` | Bajo | `npm test`. La partición: cada fila está en un solo estado y los estados suman «Todas» |
| 2 | **El marco del área y los estados.** Contenedor ancho, volver, persona, acceso, «Actualizar» con la hora, pestañas con ícono y la ayuda (vacía hasta su paso). `EstadoDeLectura` con motivo. Las vistas de adentro, como están | `PG`, `NN`, un componente nuevo en `ADV`, `CSL`, `CSS` | **Medio:** es de las cuatro áreas; «Actualizar» y los formularios | Las cuatro pestañas abren igual que antes. `RC mirar` y `capturas` (la revisión preparada sigue pasando) |
| 3 | **Plan activo (16).** `VersionSoloLectura` nueva, que sirva también en la columna de la ficha; cabecera con sus acciones; historial al costado; tira del objetivo; los estados sin plan y sin objetivo | `PL`, `PT`, `CSS` | **Medio:** la usa la ficha | `R linea` (E-74, `R:3151`) y `R analizar`; `NRR:71-74` a 390 |
| 4 | **Editor (17).** La misma lógica, con otra composición: selector de versión, días tipo, comidas plegadas, opciones en pestañas, tabla de ítems, menús, nombres a pedido | `ED` (y archivos nuevos al lado), `PL`, `HA`, `CSS`; `NRW` | **Alto** | `typecheck`; el recorrido del editor reescrito (§7.3) |
| 5 | **Activar (18).** Guardar antes; el diálogo con lo que entra, lo que queda y la fecha; guardar la fecha y activar | `ED`, `COMP\dialogo.tsx` | **Alto:** dos escrituras | Activar con y sin fecha, con un problema de validación y con un resultado incierto simulado |
| 6 | **Agregar ítem (21).** El panel al costado, con habituales, resultados en tabla, crear a mano e importar | Archivo nuevo en `NUT`, `HA`, `IM`, `RO` o `COMP` (la cáscara del panel), `CSS` | Medio | Agregar por las cuatro vías; una falla de la búsqueda no dice «no encontramos» |
| 7 | **Registros (20).** Las dos lecturas, los días, las vistas, la fila, el detalle al costado y la estimación desde el detalle | `RG`, `DR`, `LT` (sacar el detalle al costado), `BAR`, `CSS` | **Medio a alto:** dos lecturas, piezas de la ficha | Las cuentas contra la API, calculadas a mano; `R linea` sigue pasando (E-70, E-73) |
| 8 | **Preparar revisión (06), en Nutrición.** La lista de revisiones como estado por defecto; la pantalla de tres pasos, con la grilla y la barra | `RV`, `EV`, `EVL`, `RP`, `CSS`; `RC` | **Medio a alto:** `EV` es compartido | `RC funcional` (R3, y CP-19 y CP-20 de Entrenamiento, que usa la misma evidencia), `RC mirar` y `capturas` |
| 9 | **Mirar y medir.** Cinco anchos, dos temas, cada cosa abierta, una falla de cada lectura. Ajustes. Borrar lo que quedó sin uso, solo lo que es de Nutrición (`.diferencia`, `.seccion--compacta`) | `CSS` | Bajo | `H\ver.mjs` con `#clic:` y `#falla:` |
| 10 | **La pasada completa** de los siete recorridos sobre datos recién generados, y la CI | — | — | Como en las partes anteriores (`ACE:517`) |
| 11 | **Documentos.** `GUIA`: II.3 (migas y marco del área), II.5, II.6 y II.8 (piezas nuevas), y su parte V. La definición del segundo paquete y su acta | Documentos | Bajo | — |

Si el plazo corta después del paso 3, queda el marco y el plan activo nuevos, con el editor de siempre debajo. Los pasos 4 y 5 van juntos: el editor nuevo sin «Activar» nuevo deja la próxima revisión sin lugar. El 8 no depende del 4 al 7 y puede ir antes.

## 6. Comportamiento que hay que conservar

**Sesión y permisos**
- Sin sesión, a «Iniciar sesión» con retorno a la pestaña (`NN:82, 94`). Una cuenta sin espacio profesional, su aviso (`NN:97`).
- Un 404 es «no hay nada que mostrar», con el mismo texto para lo ajeno, lo inexistente y lo revocado (`NN:7-8, 56-65, 70`).
- Una escritura denegada retira el contenido de toda la pestaña (`NN:9-10, 86-91`); lo usan las nueve escrituras de `NUT`.
- Las fotos de un registro son privadas: se piden con su acceso firmado y no se guardan (`DR:9, 195-204`).

**Enlaces y parámetros**
- `id`, `vista` (`resumen`, `plan`, `registros`, `revisiones`), `volver` y `preparar=1` (`NN:76-79`; `RP:25-33, 44`). Llegan desde la ficha (`SEG\resumen-area.tsx:96, 131, 151, 157, 171`; `RO:36-48`; `SEG\informacion.tsx:88`) y desde `/pro` (`SCR\espacio-profesional.test.mjs:166, 170`).
- Una vista desconocida cae en «Resumen» (`NN:79`).
- El retorno a la ficha se valida y no sale del mismo asesorado (`RP:25-30`; `SEG\estado.ts:313`).
- «Abrir el borrador en Plan», después de aplicar una revisión (`RV:84-90`), tiene que caer en la versión en preparación.

**Escrituras**
- Una clave por intento; el reintento de un resultado incierto usa la misma (`LIB\intento.ts:18-38`). Vale para crear el borrador, activar, crear un alimento, importar, estimar, registrar y aplicar una revisión, guardar una plantilla y una comida habitual.
- Guardar el borrador va con la versión que la pantalla mostró, sin clave (`ED:180-185`; `CLI:730-733`).
- Guardar no activa; validar no activa; activar pide confirmación; registrar y aplicar una revisión son dos actos (`ED:8-9`; `RV:8`; `GUIA:341-344`).
- Una opción de receta viaja como nombre y versión de receta, sin ítems (`ED:58-69`).
- Un ítem nuevo nace sin cantidad ni estado (`ED:288`); con cantidad, el estado es obligatorio y lo dice la validación (`ED:7, 110`).
- Una cantidad que no se entiende no se guarda como el último número válido: bloquea el guardado y se marca (`ED:173-176, 463-466, 494-498`).
- La versión activa no se edita: solo «Crear nueva versión a partir de esta» (`PL:5-7`).
- La evidencia viaja como una referencia por registro marcado (`EVL:69-70`; `RV:205`).
- La descripción original de una comida diferente no se toca: la estimación se agrega (`RG:9-10, 178-187`).

**Lecturas**
- El período de Registros y de la revisión se valida antes de pedir (`PER:29-36`) y su control queda fuera del estado de lectura (`RG:43`; `RV:69`).
- Una respuesta tardía del registro abierto no pinta otro (`R:2948-2964` lo comprueba en la ficha).
- Los alimentos habituales se leen una vez para todos los buscadores del borrador (`ED:138-139`), con marcado optimista y vuelta atrás si falla (`HA:58-72`).

**Reglas de BE**
- Ubicar, nunca calificar. Sin porcentajes, sin «adherencia», sin verde ni rojo (`RG:4-6`; `RS:4-7`; `CN:17-18`).
- «N de M comidas registradas» es una cuenta, no un cumplimiento. Un día sin registros es «Sin registro», nunca «0 de 4» ni un cero (`RG:70`).
- Sin confirmar sigue sin confirmar; lo previsto nunca se muestra como consumido (`DR:5-8`; `CDC:7`).
- Una comida diferente no reemplaza la comida prescripta ni la marca como registrada (`CN:469-473`; `COPR:138-139`).
- El modo de registro no es una diferencia (`CDC:68-71`; `DOM\comprension-del-dashboard.test.ts:806`).
- Las opciones de una comida no se presentan como equivalentes (`ED:13`).
- BE no sugiere un resultado ni marca evidencia (`RV:6-7`; `EV:10`). Marcar no es haber examinado (`EV:13-14`).
- Ningún ícono dice un estado por su color (`GUIA:204-205`); una tilde no va al lado de un dato (`GUIA:208-209`).

**Accesibilidad**
- Un `h1`; «Saltar al contenido» y `main#contenido` (`PG:17`).
- Cada campo con su rótulo, su ayuda atada y su error con texto (`COMP\formulario.tsx:16-35`); el resumen de errores recibe el foco y enlaza a cada campo (`COMP\formulario.tsx:52-72`).
- La casilla de un grupo, en estado mixto cuando corresponde (`EV:24-38`).
- Lo que se despliega dice si está abierto; lo elegido, si está elegido. Un panel se cierra con Escape y al salir con Tab (E-21, `WP:140`).
- Un botón que es solo un ícono lleva un nombre que dice lo que hace: «Quitar Pollo» (`COMP\icono.tsx:5-6`).
- Objetivos de 44 px; no se achica la letra (`GUIA:133-140`).
- Sin doble desplazamiento, con la excepción escrita del detalle al costado (`GUIA:240-244`).

## 7. Las pruebas y los recorridos que tocan estas pantallas

### 7.1 Lo que hoy fija textos, selectores o estructura

**En `npm test` (CI)**

| # | Dónde | Qué mira | Qué protege | Con el DOM nuevo | Cómo adaptarla |
|---|---|---|---|---|---|
| 1 | `SCR\copy-pantallas.test.cjs:34-49, 88-115` | Los textos de todos los `.tsx` de `NUT`, contra la lista de Nutrición | Que no entre una palabra que califica ni un «%» | Pasa si los textos nuevos no las traen | Sumar los `.ts` nuevos de `NUT`, `EV`, `EVL`, `RP` y el marco (1.15) |
| 2 | `SCR\evidencia-de-revision.test.mjs:22-62` | `EVL`: «Todavía no marcaste nada.» (`:24`); «Marcaste 5 de 7: 3 comidas de 2 días, 1 versión del plan y el objetivo.» (`:52`); «las 3 comidas», «la sesión» (`:34-35`); una referencia por registro (`:54-60`) | Nada marcado al abrir; marcar no es examinar; el contrato no cambia | Falla si se adopta la frase de la maqueta | DEC-19. Sumar los días sin registros |
| 3 | `SCR\hecho-en-un-renglon.test.mjs:37-72` | El renglón de una comida: opción, «Porciones del plan», «Cantidades informadas» | Que el renglón no invente | Pasa | Nada; Registros lo reusa |
| 4 | `SCR\retorno-a-la-ficha.test.mjs:18-60` | `volver` hacia `…/nutrition?id=…&vista=revisiones` (`:22`) | El retorno validado | Pasa | Nada |
| 5 | `SCR\retorno-seguro.test.mjs:22, 32` | El retorno del inicio de sesión: la pestaña con `id` y nada más | Que el retorno no acepte parámetros sueltos | Pasa si no se suma un parámetro al retorno | Nada (DEC-7) |
| 6 | `SCR\espacio-profesional.test.mjs:166, 170` | Los destinos de «Abrir» de un pendiente | Que cada pendiente lleve a donde se resuelve | Pasa | Nada |
| 7 | `SCR\contraste.test.cjs:343-370` | Ningún color escrito fuera de los tokens | Contraste medido | Pasa con tokens | Declarar un par nuevo, si aparece (`:79`) |
| 8 | `DOM\dominio-wp04.test.ts:354-456, 507-515` | El contraste por día; `COPY_NUTRICION`, etiquetas y efectos sin palabras prohibidas | REG del contraste; no calificar | Pasa | Un texto nuevo en `COPN` queda cubierto solo |
| 9 | `DOM\comprension-del-dashboard.test.ts:734-807` | Frases exactas de «frente a lo indicado» (`:782-804`) | El modo no es una diferencia | Pasa si se usan esas frases | Nada (DEC-4) |
| 10 | `DOM\recetas-y-registro.test.ts:33-56` | «Estimación para las porciones del plan», «Porciones del plan», «Macros sin calcular» y el orden de los nutrientes (`:43-52`) | Los textos que comparten web y APK | Pasa | Nada |
| 11 | `DOM\habituales.test.ts:115-117`; `DOM\plantillas-de-plan.test.ts:90-91`; `DOM\contratos-wp08.test.ts:139-151` | El copy de habituales, plantillas e integraciones | No calificar | Pasa | Nada |
| 12 | `REPO\test\integration\*.int-spec.ts` (nutrición, registro de comidas, recetas, plantillas, habituales, análisis) | La API | Reglas, permisos, contratos | No cambia | Nada |

**Recorridos con navegador (locales; los siete de la pasada completa)**

| # | Dónde | Qué mira | Qué protege | Con el DOM nuevo | Cómo adaptarla |
|---|---|---|---|---|---|
| 13 | `RC:213-224` | Espera en `main`: «Preparado por BE para esta revisión: el período va del {fecha con año}» y «Período: {esa fecha} a» | No leer la revisión antes de que llegue el período preparado | **Se rompe** si cambia la frase o la fecha pierde el año | DEC-19. Esperar por un atributo del período, no por el texto |
| 14 | `RC:445-468` (`mirar`) | Llega con «Preparar la revisión de Nutrición»; toca `#revision-evidencia .evidencia__dia` (`.evidencia__grupo-casilla input`, `.evidencia__ver`, `.evidencia__registros label input`) y `details.evidencia__marcadas`; después `.retorno-a-la-ficha a` | Dos pantallas sin desborde, sin faltas de axe, sin doble desplazamiento y sin errores (`RC:383-390`) | Pasa si se conservan esas clases y los registros siguen dentro de su día | DEC-18 |
| 15 | `RC:502-532` (`capturas`, CP-27) | La revisión preparada a 1440, 1280 y 1024, en los dos temas | Sin desborde ni doble desplazamiento (seis comprobaciones); que el enlace exista (`RC:505`) | Pasa si la barra y la grilla no tienen desplazamiento propio | Nada |
| 16 | `RC:967-1034` (R3) | `.evidencia__resumen` igual a «Todavía no marcaste nada.» (`:998`); cada `.evidencia__dia` con su `.evidencia__grupo-casilla` (`:984`), y más días que uno y menos que comidas (`:998`); las comidas de cada día, leídas del rótulo «las N comidas» o «marcar la comida» (`:993`); el alto del bloque contra el de una casilla `.evidencia__seccion .acto` por registro (`:986-987, 1002-1004`); «Marcaste N de» y «N comidas de 1 día» (`:990, 1012`); `.evidencia__lista li` y su botón (`:1025-1027`); `form button` «Cancelar» y ninguna escritura (`:1031-1033`) | Nada marcado al abrir; marcar un día marca sus comidas; cancelar no escribe | **Se rompe en `:993`** con «3 comidas»; en `:990` con la frase de la maqueta; y en `:1006-1012` si un día sin registros lleva `.evidencia__dia` y queda primero | Conservar «marcar las N comidas» como nombre de la casilla (lo de más, oculto a la vista), o actualizar `:993`. Los días sin registros, con otra clase |
| 17 | `RC:1488-1539` (CP-19 y CP-20, Entrenamiento) | «Preparado por BE para esta revisión» (`:1492`); `#trn-revision-evidencia` y sus casillas (`:1497-1502`); la primera `.evidencia__seccion > .acto input` tiene que ser la versión del plan (`:1501, 1530`); `#trn-revision-interpretacion`, `-resultado label` «Mantener», `-fundamento`, `-accion` (`:1507-1510`); `form button[type="submit"]` «Registrar revisión» (`:1517`); un solo POST y «Volver a la ficha» (`:1533-1539`) | Preparar no escribe; una referencia por registro; registrar es una sola escritura | Pasa mientras Entrenamiento conserve su formulario. La evidencia compartida cambia para los dos | Mismo cuidado que la fila 16 |
| 18 | `RC:926-942` (CP-09, CP-24) | El detalle de una comida, en `dialog[open]`: «sin confirmar» e «indicado» (`:931`); con un 404 simulado, «no está disponible» y ningún gramo ni kcal (`:942`) | Sin confirmar no pasa a consumido; lo que no se puede leer no muestra valores | Pasa si el detalle nuevo conserva esas palabras | Nada |
| 19 | `R:745` y `R:2917-2964` (PRO-05, E-70, E-73) | El detalle de una comida en `.detalle-del-hecho`: «Ver en Nutrición», «Ocurrió», «Se cargó»; `h3` con el foco; `.enlace-al-area a` igual a «Ver en Nutrición · Registros»; `position: sticky`; una respuesta demorada no pinta otra | El detalle al costado de la ficha | Pasa si al sacar la pieza a un lugar común se conservan clases y estructura | Nada (como E-97) |
| 20 | `R:873-888` (PRO-26, PRO-05) | Del origen de un punto a la pestaña de Nutrición, y «Atrás» | Ir al área y volver sin perder el análisis | Pasa | Nada |
| 21 | `R:3138-3156` (E-74) | En el detalle de un plan activado: «Versión N · activada el», no «Versión 0 ·», y «Ver en Nutrición · Plan» | Que la planificación abra con su número | Pasa si la frase se conserva | Conservarla |
| 22 | `R:2139-2147, 2376` (E-49, E-56) | Los destinos hacia la pestaña, con `volver` y con `preparar=1` | Que cada acción lleve a su pantalla | Pasa | Nada |
| 23 | `R:142-145`; `RC:124-127` | Espera que no queden pedidos ni un `.cargando` | Que no se mida a medio cargar | Si la carga nueva no lleva esa clase, espera solo por los pedidos | Que el bloque de carga lleve `.cargando` |

**Otros guiones (no están en la pasada de los siete)**

| # | Dónde | Qué mira | Con el DOM nuevo | Cómo adaptarla |
|---|---|---|---|---|
| 24 | `NRW:221-275` | El editor entero: «Crear nuevo plan»; «Versión en preparación»; `section[aria-labelledby="titulo-borrador"]`; «Agregar comida» y `#comida-0-{j}`; «Agregar receta como opción» y «…: {nombre}»; «Agregar opción» y `#opcion-0-{j}-0`; «Agregar ítem» dentro de `fieldset.nodo--comida:nth-of-type(n)`; `.buscador input`, «Buscar», «Elegir {alimento}»; `li.fila-de-item` con su cantidad y `select[id$="-preparacion"]`; «Guardar cambios» apagado después de guardar; cuatro «Receta «»; «Activar plan», `dialog[open]`, «Activar esta versión»; «Plan activo» | **Se rompe casi entero:** los nombres dejan de ser campos siempre abiertos, las comidas se pliegan, el buscador pasa a un panel y las filas a una tabla | Reescribirlo en el mismo cambio (E-06), o conservar los identificadores `comida-i-j` y `opcion-i-j-k` en el campo que aparece al cambiar el nombre (DEC-10) |
| 25 | `NRR:43-56` | Al menos tres «Ver registro»; los toca todos y espera dos fotos en `.fotos-del-registro img`; «Informó lo que comió de cada ingrediente», «Estimación de lo consumido», «no lo comió», «Macros sin calcular», «Cantidad aproximada: 2 porciones», «Sin descripción» | **Se rompe:** ya no hay «Ver registro» ni varios detalles abiertos a la vez | Abrir cada fila y leer el detalle |
| 26 | `NRR:71-75` | A 390 px, el plan activo sin desborde | Pasa si no se rompe a 390 | Nada |
| 27 | `H\paginas.mjs:39` | Captura las cuatro pestañas y mide el alto | Pasa | Usarla para el «después» |
| 28 | `H\ver.mjs:99, 136, 156` | `#clic:` toca botones, resúmenes, enlaces y rótulos de `main`; cierra los diálogos entre rutas; `#buscar:` usa `main input[type="search"]` | Sirve si lo nuevo está en `main` y el buscador del catálogo es de tipo búsqueda | Nada |
| 29 | `SCR\auditoria-accesibilidad.mjs:116, 120-127` | Busca «Abrir Nutrición» y la miga «Asesorado» por texto exacto | Ya está vieja (`WP:288`) | Fuera de este plan |

### 7.2 Comprobaciones nuevas que conviene escribir

Lo esperado se calcula a mano desde la API, con la sesión de la página, sin el dominio (como en las partes anteriores).

- **El marco:** la persona, el acceso con las palabras de BE, la hora que cambia con «Actualizar» y las lecturas que salen; «Volver a la ficha» con y sin `volver`; las cuatro pestañas con su ícono y la URL de siempre.
- **«Actualizar» con cambios sin guardar** en el editor y en la revisión: no se pierde nada de lo escrito.
- **Plan activo:** la versión, la fecha y «es lo que ve el asesorado»; cada comida con su cantidad de opciones; abrir una muestra sus opciones con los ítems de la API; el historial y la huella; la tira con los cuatro números del objetivo. Con un solo día tipo no hay selector.
- **La misma pieza en la ficha:** una versión anterior no dice «es lo que ve el asesorado», y entra sin desborde en la columna del detalle.
- **Editor:** agregar un día tipo, una comida y una opción, y cambiarles el nombre; agregar un ítem y escribir cantidad, unidad y estado; subir una comida; quitar; guardar y releer: la estructura que devuelve la API es la que se armó. Una cantidad ilegible en una opción cerrada se avisa afuera. «Validar plan» marca la comida y la opción con el problema.
- **El selector de versión:** con cambios sin guardar, ir a «activa» y volver conserva lo escrito.
- **Activar:** con cambios, guarda y recién después abre; el diálogo dice lo que entra y lo que queda, contado a mano; el foco inicial; con una fecha salen un PATCH y un POST, en ese orden; sin fecha, solo el POST; con un problema de validación, el diálogo se cierra y se listan; con un resultado incierto simulado, el reintento no repite el PATCH.
- **Agregar ítem:** el panel abre con el foco en el buscador; Escape lo cierra y devuelve el foco; los cuatro valores de cada resultado son los de la API; un alimento cada 100 ml lo dice; marcar y quitar un habitual; una falla simulada de la búsqueda dice su motivo y no «no encontramos»; crear a mano e importar agregan el ítem.
- **Registros:** las cinco cantidades, contadas a mano; elegir una vista deja las filas que cuenta y no pide nada; una vista en cero dice «sin coincidencias» y el total; cada fila, con su opción, su modo y su frase; un día sin registros dice «Sin registro»; una comida diferente está en su comida y no cuenta como registrada.
- **Registros, cuando falla una parte:** con un 503 simulado en la línea de tiempo, los días siguen a la vista, las dos columnas que dependen de ella lo dicen y las vistas que dependen de ella no llevan número.
- **El detalle:** se abre al costado a 1440 y encima a 1024; foco al título; Escape y «Cerrar» devuelven el foco a la fila; tocar otra fila mientras la primera carga deja la segunda; la foto; la estimación del profesional; «Agregar estimación» hace una sola escritura y la lista no salta.
- **Revisión:** sin `preparar`, la pestaña muestra la lista; con `preparar=1`, la pantalla de tres pasos con el período desde la última revisión; los días sin registros están y no se pueden marcar; el efecto visible es el del resultado elegido y los otros cinco están a un clic, con las palabras del dominio; «Cambiar el período» no borra lo escrito; registrar hace una sola escritura, la pantalla vuelve a la lista y el formulario no reaparece.
- **Negativas, con su positiva:** en todo `main`, con todo abierto, ningún «%» ni palabra de la lista de Nutrición; y, con el mismo selector, que el contenido esté.
- **Axe en los dos temas:** el marco; el plan con una comida abierta; el editor; el diálogo de activar; el panel de agregar ítem; Registros con el detalle; la revisión con un día abierto.
- **El teclado:** se llega a todo en el orden en que se ve, con el foco visible.
- **La primera pantalla, medida** a 1440 × 900 y a 1280 × 800, con datos recién generados: qué entra del plan, del editor y de Registros. La regla de la guía es que lo principal de cada vista empiece en la primera pantalla a 1280 × 800 (`GUIA:227-233`). Se exige lo que tenga margen y lo demás se informa (como E-55 y E-72).
- **La composición** a 1440, 1280, 1024, 768 y 390: sin desborde de costado.

### 7.3 Dónde escribirlas

- **Lo que solo lee** (marco, plan activo, Registros, la revisión sin registrar): una función nueva dentro de la sesión de `fichaRecompuesta` (`R:4086`), con su modo propio junto a los de `R:4674-4681`. No suma un inicio de sesión.
- **Lo que escribe** (crear el borrador, editarlo, activar, agregar un ítem, estimar, registrar): en `descartable` (`R:4481`), con cuentas que se crean para esa corrida. Ese profesional ya tiene vínculo de Nutrición con su asesorado, sin evaluación, objetivo ni plan de Nutrición (`H\datos\generar.mjs:638-678`: solo carga tomas y dos cálculos): el recorrido hace toda la cadena. Los registros del asesorado se cargan por la API.
- **Lo que los datos no tienen** (dos días tipo, tres opciones, una receta): o lo arma ese mismo recorrido en su plan descartable, o se mira con una respuesta simulada en el navegador, dicha como tal (E-98, `WP:238`; `H\ver.mjs:13-17`).
- **No sumar un borrador de Nutrición al asesorado A:** cambia lo que esperan los otros recorridos de su Resumen (el pendiente «borrador sin activar»). DEC-25.
- Cada lectura protegida del recorrido cuenta para el cupo: una semana de Registros son dos (el contexto y una página de la línea de tiempo).

## 8. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-1 | De dónde salen, en Registros, el nombre de la opción, el modo de las cantidades y lo comprobado | Dos lecturas que ya existen: el contexto de revisión arma los días y las comidas del plan; la línea de tiempo del mismo período (comidas de Nutrición, de a 50, leída entera) da lo de cada registro. Se unen por identificador en una función pura, con prueba. Si la segunda falla, los días se ven y lo que depende de ella lo dice, sin números | Pedir la ampliación del contexto (una lectura; queda fuera de este plan). O una lectura por registro: 28 por semana y unas 120 por mes, que es el cupo de un minuto. O no mostrar esas dos columnas |
| DEC-2 | Qué es una fila y qué cuenta cada vista de Registros | Definirlo en el dominio, como las vistas de la línea de tiempo (`DDL:255-272`). Una fila es una comida del plan en un día, o una comida diferente que no se registró en ninguna. Cada fila está en un solo estado: registrada, con comida diferente o sin registro; los tres suman «Todas las comidas». «Sin confirmar» y «Distinto de lo indicado» son rasgos de las registradas. Los días sin plan o sin día tipo determinado no aportan filas, y se dice cuántos son | Contar registros, como la línea de tiempo: «Sin registro» no existiría |
| DEC-3 | Qué días arrancan abiertos | Los que tienen algo distinto de lo indicado o una comida diferente; los demás, en un renglón con sus cuentas. Es lo que dibuja la maqueta (`M20:69-102`) **[supongo que esa es su regla]**. Con una vista elegida, cada día muestra abiertas solo las filas que coinciden | Todos cerrados; o abiertos los que tienen cualquier rasgo, como la línea de tiempo (`DDL:214`) |
| DEC-4 | Las palabras de «Diferencia observada» | Las del dominio: «Sin diferencia: son las porciones del plan», «Igual a lo indicado», «Distinta de lo indicado en N de M ingredientes», «No se puede comprobar: sin confirmar», «No se compara: fuera de lo indicado»; y, al lado, las restas que llegan. En los textos nuevos, «indicado»; los títulos que ya son del dominio no se tocan | Las de la maqueta: dicen «igual» de algo que BE no comparó, y contradicen a la ficha |
| DEC-5 | «N de M comidas registradas» | La frase de la maqueta para un día con algún registro, contando solo las registradas; un día sin ninguno dice «Sin registro»; un día sin plan o sin día tipo determinado conserva su frase de hoy | «0 de 4»: se lee como un cero |
| DEC-6 | El selector de versión y el número del borrador | El selector, con el borrador elegido por defecto si existe. El borrador se llama «En preparación», sin número; en el diálogo de activar, «Esta versión pasa a ser la vigente (será la versión 3)». Así no se cambia la regla de la guía | «3 · en preparación», como la maqueta: hay que cambiar `GUIA:393-395`, y el número es una promesa hasta que se activa |
| DEC-7 | Dónde vive lo elegido | En la visita, como `/pro` (E-95): versión del selector, día tipo, comida y opción abiertas, vista de Registros, registro abierto. Al entrar al plan activo, abierta la primera comida; al entrar al editor, ninguna | En la URL: no sobrevive al retorno del inicio de sesión y `WP:71-73` pide no tocar parámetros |
| DEC-8 | Cómo activa «Activar esta versión» | Si hay cambios, guardar antes de abrir. Al confirmar: si la fecha cambió, guardarla; con el token nuevo, activar. Un reintento por resultado incierto repite solo la activación, con la misma clave | Dejar la fecha en el editor (contra C-41), o cambiar el contrato de activar (fuera de alcance) |
| DEC-9 | El foco al abrir el diálogo de activar | En «Volver», como dice la maqueta, con un parámetro nuevo de `DialogoDeConfirmacion` que no cambia a los demás diálogos | En el campo de fecha, que es el comportamiento de hoy con un control antes de los botones |
| DEC-10 | Nombres «a pedido» | «Cambiar el nombre» muestra el campo en el lugar, con el mismo identificador de hoy y el foco adentro; Enter o salir lo confirma. Al agregar un día tipo, una comida o una opción, el campo aparece abierto, porque una comida sin nombre no se puede guardar | Un diálogo por cada cambio de nombre; o un nombre por omisión («Comida 3») |
| DEC-11 | «Agregar ítem»: cuándo busca y cuándo se cierra | Busca al enviar (Enter o la lupa), como hoy. Después de «Elegir» o de tocar un habitual, el panel queda abierto, lo anuncia («Agregado: Arroz») y se cierra con «Cerrar» | Buscar mientras se escribe, con demora; o cerrarse al elegir, como hoy |
| DEC-12 | Dónde se abren «Crear manualmente», «Importar», la lista de recetas y la de comidas habituales | Las dos primeras, dentro del panel de «Agregar ítem», en el lugar de los resultados, con «Volver a la búsqueda». Las recetas, en el mismo panel, desde «Agregar opción». Las comidas habituales y las plantillas, en un diálogo con su lista | Paneles o diálogos anidados: el foco y Escape se complican |
| DEC-13 | La columna derecha de la comida abierta, sin rangos ni estimación | No se dibuja: la tabla de ítems usa el ancho, con un tope para que no se estire. Ninguna etiqueta «propuesta» en el producto | Dejar el lugar con un «todavía no disponible»: ocupa un tercio de la pantalla para no decir nada |
| DEC-14 | La estimación que sí llega (opciones de receta, por porción) | No mostrarla sola: dos opciones lado a lado, una con estimación y otra sin, se leen como «esta no tiene calorías». Esperar a que llegue para todas | Mostrarla solo en las de receta, con una nota en las otras |
| DEC-15 | Qué objetivo muestra la tira del plan | El que cita la versión que se mira (`CN:235`), leído de la lista de objetivos. Si hay uno más nuevo, se dice, como ya hace el editor (`ED:248-252`) | El vigente hoy: más simple, y puede no ser el del plan que se está leyendo |
| DEC-16 | El marco del área | Un solo componente para las cuatro áreas, con las clases del marco de la ficha. Sin miga; «Volver a la ficha, donde estabas» con `volver` y «Volver a la ficha» sin él. «Actualizar» no toca un formulario con cambios sin guardar: lo dice y pregunta. Contenedor propio, hasta 100 rem | La miga y el marco, los dos; o «Actualizar» por pestaña |
| DEC-17 | La pestaña Revisiones | Por defecto, la lista de revisiones registradas con «Nueva revisión». La 06 es la pantalla de una revisión nueva: se abre con ese botón o con `preparar=1`. Al registrar o cancelar vuelve a la lista y `preparar` sale de la URL | Todo en una página, como hoy: la lista quedaría debajo de dos columnas |
| DEC-18 | La grilla de días | En Nutrición, todos los días del período, con los que no tienen registros a la vista y sin casilla. «Ver» despliega las comidas de ese día debajo de su fila, a todo el ancho, sin sacarlas de su día en el documento. En Entrenamiento, solo los días con sesiones y la cuenta de los demás, como hoy (`TRV:257`) | La misma grilla completa en las dos áreas |
| DEC-19 | Los textos de la 06 que difieren de BE | Conservar «Marcaste N de M: …», «marcar las N comidas» como nombre de la casilla, «Preparado por BE» junto al período y los nombres de resultado del dominio. Actualizar solo lo que cambie de formato (la fecha sin año), en el mismo cambio que su comprobación | Las frases de la maqueta: hay que cambiar el dominio, su prueba y cinco comprobaciones |
| DEC-20 | El período | Un solo control, el de la ficha, con el período y el tope por parámetro (92 días; atajos de 7, 30 y 90). En la 06, «Cambiar el período» lo abre. El formulario conserva lo escrito y, al cambiar el período, quita solo las marcas de registros que ya no están, y lo dice | Seguir con «Desde», «Hasta» y «Ver período» dentro de un desplegable |
| DEC-21 | Las fallas que hoy se muestran como vacío | Corregirlas en este paquete: búsqueda del catálogo, habituales, comidas habituales y plantillas dicen su motivo. Una cuenta sin Nutrición no llega a esta pestaña con acceso | Dejarlas: contradice la regla de que una falla no es una ausencia |
| DEC-22 | «Calorías» por «Energía» | En la importación (`IM:38`), y el orden calorías, carbohidratos, grasas, proteínas en el panel y en «Crear manualmente». «Requerimiento energético estimado» no se toca | Dejarlo para cuando se dibuje el Resumen |
| DEC-23 | La tabla de Registros | Una tabla de verdad, con un cuerpo por día y el encabezado una sola vez | Filas sueltas con rótulos ocultos en cada dato |
| DEC-24 | Los registros deshechos | Siguen fuera de Registros, como hoy; se ven en la línea de tiempo | Mostrarlos atenuados: cambia lo que cuenta la pestaña |
| DEC-25 | Con qué datos se prueba el editor | En el escenario descartable, por la pantalla; lo que falte, con una respuesta simulada dicha como tal | Sumar un borrador, una receta y otro día tipo al asesorado A: mueve los otros recorridos |
| DEC-26 | Dónde viven las reglas y los textos nuevos | Las vistas de Registros y sus cuentas, en el dominio, con prueba de partición. Los textos de una sola pantalla, en la pantalla (E-05, `WP:109`), con la prueba de palabras extendida | Todo en la pantalla: las cuentas quedan sin prueba |

## 9. Lo que no pude determinar leyendo

- **Cuánto mide lo nuevo.** No hay medida de hoy del editor ni de la revisión abierta; lo demás son medidas de las maquetas.
- **Si las filas y las tablas entran a 1280 y a 1024** con los nombres reales. Los del catálogo son largos («Arroz blanco de grano largo, cocido», `H\datos\escenario.mjs:32`). La 20 y la 21 no tienen regla escrita para esos anchos.
- **Si la unión por identificador cierra en la práctica.** Leí que las dos consultas piden los mismos registros, salvo los anulados (1.3). No comprobé con datos que cada registro del contraste tenga su entrada en la línea de tiempo, ni qué se ve si entre una lectura y la otra el asesorado registra, rectifica o deshace una comida.
- **Qué registra el PDP** cuando la pestaña de Nutrición lee la línea de tiempo para un profesional sin vínculo en las otras dos áreas. Leí que guarda una decisión por cada fila que lee, permitida o denegada (`API\autorizacion\pdp.service.ts:139-169`); no leí qué filas trae (`leerFilas`). Si son siempre las tres áreas, cada página deja dos denegaciones a nombre de ese profesional, y eso ya pasa hoy cuando la ficha lee la línea de tiempo **[supongo]**.
- **Si hoy se ve «… · 0 g»** en una comida con las porciones del plan (1.16). Lo deduzco del código.
- **Cómo se ve hoy el rechazo de una comida sin nombre** al guardar: el contrato no la admite (`CN:160`), y la pantalla diría «revisá este elemento» (`ED:189-191, 391`) **[supongo]**.
- **Si la frase de `ED:337`** («cada una muestra su propia estimación») tiene que seguir mientras el website no muestre ninguna estimación.
- **Si los recorridos de WP-NUTRICION-RECETAS se siguen corriendo.** No están en la pasada de los siete (`ACE:517`) y usan otro entorno.
- **Cómo se comporta un diálogo dentro de otro** (por ejemplo, «Guardar como habitual» con un panel abierto) en cuanto a foco y Escape.
- **Si el número de versión se corre** con más de una página de planes (1.16).
- **Qué quiere Dirección** con: qué días arrancan abiertos; el número del borrador; la miga; lo que queda en el lugar de los rangos. Las maquetas están validadas por confianza, no pantalla por pantalla (`WP:9-10`), y las 22 a 29 ni siquiera las había visto (`CRIT:586`).
- **Cómo queda cada cosa en Azul noche** con los tokens reales: la pestaña de opción elegida, el segmento elegido, la fila elegida de Registros y el velo del panel.
- **El lector de pantalla:** nada de esto se puede saber leyendo.

## 10. Tamaño

Lo de hoy: 3.487 líneas en `NUT`, más 355 de `EV`, `EVL`, `RP` y `PER`. Todo lo que sigue es **[estimo]**.

| Archivo | Líneas hoy | Qué le pasa |
|---|---|---|
| `NN` | 119 | El marco sale a un componente común (unas 180 líneas nuevas en `ADV`). `EstadoDeLectura` (`:68-73`) se reescribe. Queda parecido en tamaño |
| `PG` | 24 | Una clase |
| `PL` | 240 | `VistaDePlan` (`:32-195`): se recompone la presentación (unas 110 líneas); las lecturas y las escrituras (`:42-96`) quedan. `VersionSoloLectura` (`:198-240`) se reescribe entera: de 43 a unas 160 |
| `ED` | 782 | La lógica (`:49-232`, unas 185 líneas) queda casi igual, con el cambio de activar. El marcado de `EditorDeBorrador` (`:238-460`, 222 líneas) se reescribe entero: unas 400, repartidas en dos o tres archivos. `FilaDeItem` (`:468-527`) pasa a fila de tabla: piel. `BuscadorDeCatalogo` (`:533-691`, 159 líneas) pasa al panel: se reescribe el marcado y se conserva `crear` (`:552-585`). `OpcionDeReceta` y `ElegirReceta` (`:697-782`): piel |
| `RG` | 277 | `Contraste` (`:52-143`) se reescribe entero: unas 350, más un módulo puro de unas 180 con su prueba. De `RegistroLibre` (`:145-277`) quedan `buscar` y `enviar` (`:161-195`); su presentación pasa al detalle |
| `DR` | 204 | `VerRegistro` (`:35-45`) deja de usarse. `DetalleDeRegistroDeComida` (`:56-138`) se recompone en bloques y suma la estimación del profesional: unas 260 |
| `RV` | 415 | `VistaDeRevisiones` (`:36-142`): se parte en lista y pantalla nueva. El marcado del formulario (`:251-354`) se reescribe entero. La lógica (`:157-224`) y `ItemDeRevision` (`:357-415`) quedan; este último, solo piel. Unas 470 |
| `EV` | 166 | El marcado se reescribe casi entero (grilla, días sin registros, resumen al pie): unas 220. Es compartido con Entrenamiento |
| `EVL` | 70 | Suma los días del período: unas 95, con su prueba |
| `RP` | 72 | El enlace de retorno pasa al marco; el aviso de preparación cambia de forma |
| `PER` | 47 | Sin cambios si se generaliza el control de la ficha; lo siguen usando otras cuatro pantallas |
| `HA` | 302 | `BloqueDeHabituales` (`:77-101`) y `BotonHabitual` (`:104-111`): piel. `InsertarComidaHabitual` (`:264-302`): marcado nuevo. Los ganchos de lectura suman el motivo de la falla. El diálogo queda |
| `PT` | 167 | `InicioDesdePlantillaNutricional` (`:121-152`): marcado nuevo. Lo demás queda |
| `IM` | 344 | Piel, y «Calorías» por «Energía» (`:38`) |
| `RS`, `FO` | 240 y 373 | Sin cambios: no están dibujados |
| `CSS` | 6.153 | Entre 900 y 1.100 líneas nuevas; se borran pocas (las clases viejas del editor las usan otras pantallas) |
| `COMP`, `SEG` | — | Extraer sin cambiar de clases: el diálogo de la ayuda (`CSL:237-274`), el detalle al costado (`LT`), la cáscara del panel (`RO:50-95`), el control de período (`BAR:25-130`), el control segmentado y la etiqueta. Unas 300 líneas que se mueven |
| Recorridos | — | Entre 600 y 900 líneas nuevas en `R`, más la reescritura de `NRW:221-275` y `NRR:43-56` si se conservan |

**Por pantalla** (TSX y TS, sin estilos ni recorridos): el marco, unas 250; la 16, unas 300; la 17, unas 550; la 18, unas 100; la 21, unas 300; la 20, unas 800 con su módulo y su prueba; la 06, unas 500. En total, entre 2.500 y 3.000 líneas tocadas o nuevas, de las que más o menos un tercio es lógica que se conserva y cambia de lugar.
