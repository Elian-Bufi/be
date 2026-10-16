# Información · plan de implementación (solo lectura: no compilé ni ejecuté nada)

Pantallas: **26** (las solicitudes; hoy la vista «Solicitudes») y **27** («Pedir información»; hoy una pestaña, y en el diseño un botón que abre el pedido al costado, en tres pasos, sobre la 26).

Esta parte es independiente de la de Antropometría. Comparten una sola pieza: el marco del área (2.0).

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento` (rama `wp-escritorio-amable`, HEAD `c565f0c`)
- `WEB` = `REPO\apps\web\src` · `ADV` = `WEB\app\pro\advisees` · `FRM` = `ADV\forms` · `SEG` = `ADV\seguimiento` · `COMP` = `WEB\components` · `LIB` = `WEB\lib` · `CSS` = `WEB\app\globals.css`
- En `FRM`: `FO` = `formularios.tsx` (250 líneas) · `PE` = `pedir.tsx` (248) · `PGF` = `page.tsx` (24)
- `CIT` = `ADV\training\contexto-citable.ts` (154): la lectura de respuestas que ya hace Entrenamiento
- `DOM` = `REPO\packages\domain\src` · `CF` = `DOM\contratos-formularios.ts` · `COPF` = `DOM\copy-formularios.ts` · `FOR` = `DOM\formularios.ts` · `CLI` = `DOM\cliente-http.ts` · `OAS` = `DOM\openapi.ts` · `CAR` = `DOM\cartera.ts`
- `API` = `REPO\apps\api\src` · `FCT` = `API\formularios\formularios.controller.ts` · `SOL` = `API\formularios\solicitudes.service.ts` · `LFO` = `API\formularios\lectura-formularios.ts` · `RES` = `API\formularios\respuestas.service.ts` · `PAGI` = `API\http\paginacion.ts`
- `MIG1` = `REPO\prisma\migrations\20260921220000_formularios_de_informacion_profesional\migration.sql` · `MIG2` = `REPO\prisma\migrations\20260928000000_plantilla_de_entrenamiento\migration.sql`
- `APKF` = `REPO\apps\mobile\src\pantallas\formularios.tsx`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` · `M26` = `MQ\partes\26-cuerpo.html` · `M27` = `MQ\partes\27-encima.html` · `M26H` = `MQ\26-solicitudes-de-informacion.html`
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas` · `R` = `H\recorrido.mjs` · `RC` = `H\recorrido-comprension.mjs` · `PGS` = `H\paginas.mjs`
- `EA` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE` · `CRIT` = `EA\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `EA\diseno\iconos\CATALOGO.md` · `MOD` = `EA\relevamientos\espacio-profesional-plan-de-implementacion.md`
- `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md`
- `SC` = `REPO\scripts` · `CP` = `SC\copy-pantallas.test.cjs`

**Con qué leí**
- **Las maquetas:** las dos partes (`M26`, `M27`), el armado con el marco (`M26H:15-29`) y las imágenes 26 y 27 de `EA\diseno\maquetas\claro\`. Las de Azul noche no las abrí.
- **El código, en HEAD `c565f0c`.** Desde `ab90860` (el commit del relevamiento anterior, `EA\relevamientos\informacion-y-nutricion.md`) no cambió ningún archivo de `FRM`.
- **El árbol cambió mientras leía.** Otra sesión tiene sin commit, entre otros, `RC` (+207/−38) y `CSS` (+330/−14). **Los números de línea de `RC` y de `CSS` son los de HEAD** (verificados con `git show HEAD:`). En la copia de trabajo, la comprobación R3 está 64 líneas más abajo (1009-1024) y lo de `CSS` posterior a la 5569 se corrió. No tocó ningún archivo de `FRM`.
- **No vi ninguna pantalla andando.** Y hoy no se puede ver la 26 con datos: los datos de prueba no tienen ninguna solicitud de formulario (1.10). El «antes» medido de «Solicitudes» es la lista vacía: 900 px (`EA\parte-0\alturas-despues.json:153-159`); el de «Pedir información», 932 (`:160-166`).
- **Lo que busqué para afirmar que algo no está:** `COPY_FORMULARIOS.` en `REPO\apps\mobile\src`; `expo-notifications` y «notificaci» en `REPO\apps\mobile`; `form-requests`, `form-templates` y «formulario» en `H\datos`; `terminosProhibidosDeFormulariosEn` en todo el repositorio.
- **No abrí el legajo.** Donde aparece una cita del legajo, es la que trae el comentario del código, y lo digo.

Todo lo que afirmo del código lo leí, con su línea. Lo que deduzco va con **[supongo]** y lo que calculo sin medir, con **[estimo]**.

## 1. Lo que condiciona el plan

1. **«Pedir información» hoy es una vista con dirección propia, y se llega a ella por cuatro lados.**
   - Es `vista=pedir` (`FO:30-33, 79, 111`).
   - Se llega desde: «Solicitar contexto» del marco de la ficha (`ADV\workspace.tsx:176-179`, con `volver`); «Solicitar contexto» de «La información disponible», en la ficha (`SEG\informacion.tsx:166-170`, con `volver`); «Solicitar contexto» de Entrenamiento (`ADV\training\resumen.tsx:178-181`: `vista=pedir&plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento`); y la pestaña de la propia página (`FO:99`).
   - Los pendientes del Espacio profesional llevan a `vista=solicitudes` (`WEB\app\pro\pendiente-en-una-fila.ts:69-73`).
   - `vista`, `plantilla` y `volver` no se pueden renombrar. Con el diseño, `vista=pedir` pasa a querer decir «las solicitudes, con el pedido abierto encima» (DEC-I6).

2. **Una comprobación del recorrido se rompe con un cajón modal si no se adapta en el mismo cambio.**
   - R3 (`RC:945-960`) toca «Solicitar contexto» en el marco de la ficha, espera `/pro/advisees/forms`, lee el texto de `main`, hace clic con el mouse en `.retorno-a-la-ficha a` («Volver a la ficha») y comprueba tres cosas: que la pantalla ofrecía volver, que no salió ninguna escritura y que hay tantas solicitudes como antes.
   - Protege dos cosas: que el pedido tiene vuelta a la ficha, y que salir sin enviar no escribe nada.
   - Con el pedido en un diálogo modal, la página de atrás no recibe clics: el clic real de `clic` (`RC:227-244`) cae sobre el diálogo y la espera de `RC:957` vence **[supongo: no lo corrí]**. Hay que cerrar primero el cajón, o volver desde adentro.
   - `.retorno-a-la-ficha` es la clase del enlace de hoy (`ADV\retorno-y-preparacion.tsx:35-42`): el marco nuevo la conserva, o R3 cambia su selector en el mismo commit (E-06, `WP:110`).

3. **Las cantidades de las vistas no llegan.**
   - La lista se pagina (20 por defecto, 50 como máximo: `PAGI:9-10`) y la pantalla lee una sola página (`FO:125`).
   - El filtro `status` admite un valor por vez (`SOL:153, 166`): no sirve para contar las tres vistas de una lectura.
   - «Todas 3 · Sin responder 1 · Respondidas 2» (`M26:51-53`) pide leer la lista entera y contar en el navegador, como se hizo con los pendientes (E-83, `WP:223`). Es una lectura protegida (`FCT:63-67`; `OAS:2671`).

4. **La lista no dice si la persona corrigió su respuesta, ni cuándo respondió.**
   - Cada solicitud de la lista trae su estado, y nada de la respuesta (`CF:140-155`). El servicio lee de la respuesta solo su identificador (`SOL:27`).
   - La maqueta escribe «· corrigió su respuesta» en el renglón (`M26:66`).
   - Está en el detalle (`CF:288-291`), que es una lectura protegida por solicitud (`FCT:70-75`). Entrenamiento ya lo hace así para su «Contexto declarado»: lee el detalle de cada solicitud respondida de su área (`CIT:58-65`). DEC-I2.

5. **Tres datos llegan en la lista y hoy no se muestran:** en qué área se pidió (`scope`, `CF:146`), cuántas preguntas (`requestedFieldCodes`, `CF:151`) y cuáles son requeridas (`requiredFieldCodes`, `CF:152`). El renglón de hoy dice el nombre, el estado, la fecha y el propósito (`FO:144-149`).

6. **«La respuesta que rige», «Antes: …» y «Respondió 1 de las 2» no llegan: se arman en la pantalla.**
   - Llega la respuesta original (`CF:287`), cada corrección con su conjunto completo de respuestas y a cuál sucede (`CF:263-271`), y cuál rige (`CF:276-280, 289`). Nada dice qué cambió.
   - La API ordena las correcciones por fecha (`SOL:216`); la que rige se elige por relación (`effectiveView`), nunca por fecha (lo dice el comentario de `FO:202-203`).
   - **Una parte ya existe, en Entrenamiento:** `CIT:66-69` resuelve el conjunto que rige (y saltea la cadena que no se puede resolver), y `CIT:33-36` escribe un valor con su unidad y con coma decimal. Tiene su prueba (`SC\contexto-citable.test.mjs`). Hay que usar esas dos cosas, no escribir otras (E-97, `WP:237`).
   - Lo que falta es comparar la versión que rige con la anterior, pregunta por pregunta. Es una función pura, con su prueba.
   - Un defecto de hoy, que la función corrige: con la cadena sin resolver (`NOT_RESOLVABLE`), la pantalla rotula «Vigente» a la respuesta original (`FO:206, 214`).

7. **«Las preguntas vienen todas elegidas» choca con una regla escrita en el código.**
   - El comentario de `PE:7-9` dice que la pantalla, a propósito, «no pide el formulario entero por defecto: hay que elegir campo por campo», porque «la minimización es del profesional, no del catálogo» (cita el legajo, 09:1528; no lo abrí). El código lo cumple: al elegir un formulario, la selección queda vacía (`PE:75-79`).
   - La única precarga es la del formulario de Entrenamiento cuando se llega desde Entrenamiento: seis preguntas, cinco requeridas, ratificadas por Dirección (`PE:17-19, 80-85`; `FOR:90-99`).
   - La maqueta dibuja ese caso: «6 de 6 elegidas», con cinco requeridas (`M27:54, 57-62`). Y el criterio lo generaliza a todo formulario (C-73, `CRIT:427-428`), en la lista de cambios «para validar» (`CRIT:262`).
   - Hay que decidirlo antes de programar el paso 2 del pedido (DEC-I1).

8. **La nota de hoy sobre las requeridas no es cierta, y la del diseño sí.**
   - Hoy: «Un campo requerido igual puede quedar sin responder: el asesorado decide.» (`COPF:30`).
   - La API rechaza una respuesta a la que le falta una requerida (`RES:204-205`), y la APK lo avisa antes de enviar (`APKF:233-234`). Lo que la persona puede dejar sin responder es la solicitud entera.
   - Diseño: «Si responde, las requeridas no pueden quedar vacías.» (`M27:54`; C-74, `CRIT:429-431`). «Obligatorio» sigue prohibido (`COPF:126`); «requerida» no.

9. **Ninguna prueba mira las palabras de estas dos pantallas.**
   - `CP` tiene cuatro dominios y la ficha (`CP:34-76, 126-130`). Ninguno incluye `FRM`: el del Espacio profesional toma solo los `.tsx` sueltos de `app\pro` (`CP:24, 72`), y `CP:17` ni importa el detector de formularios.
   - El texto del dominio sí está cuidado (`DOM\contratos-wp07.test.ts:146-157`; `DOM\errores-de-formulario.test.ts:163, 234`). El comentario de `COPF:12-13` dice que una prueba mira también «el texto de las pantallas»: para el website del profesional, hoy no es así. Se miró una vez, a mano, sobre capturas (`REPO\EVIDENCIA\WP-07\LEEME.md:25`).
   - Al reescribir conviene sumar el bloque (E-05, `WP:109`).
   - Un límite de la prueba del dominio: pasa cada valor de `COPF` directo al detector (`DOM\contratos-wp07.test.ts:148-150`). Si un texto nuevo es una función (como «N de M elegidas»), la prueba falla: esos textos se arman en la pantalla, o la prueba se adapta.

10. **Los datos de prueba no tienen ninguna solicitud de formulario.**
    - Ningún generador las crea (busqué en `H\datos`). R3 cuenta «tantas como antes» (`RC:947, 959`), que hoy es cero.
    - Para ver la 26 hacen falta: una sin responder, una respondida y una respondida y corregida, en dos áreas. La respuesta y la corrección las hace el asesorado (API-FRM-07 y 08: `FCT:86-111`).
    - Sumarlas al escenario principal cambia los pendientes que esperan los otros recorridos (E-98, `WP:238`). DEC-I17.

11. **El marco del área, en Información.** Es la pieza común con las otras tres áreas (ver el plan de Antropometría, 1.8 y 2.0). Tres cosas son propias de acá:
    - La maqueta dice «Acceso actual · Las tres áreas» (`M26H:20`). Esa forma se descartó en la ficha, porque el profesional dejaba de ver cuáles (E-10, `WP:124`).
    - La barra tiene una sola pestaña, «Solicitudes» (`M26H:26`): un control que no cambia nada.
    - Su ícono es `solicitud` (la persona con el signo más), que en el catálogo quiere decir «Solicitar un vínculo con un asesorado nuevo» (`CAT:219`). El ícono del área es `informacion` (`CAT:58`).

12. **El cajón de 800 px no es el panel que existe.**
    - El panel lateral de hoy mide `min(42rem, 46vw)` desde 64 rem de ancho (`CSS:3409-3426`): 662 px a 1440 **[estimo]**. La maqueta pide 800 (`M27:5`), y a 1024, «el pedido ocupa todo el ancho» (`CRIT:260`).
    - Es un modificador nuevo: la clase compartida no se toca (E-02, `WP:106`).

13. **El aviso de éxito de hoy vive en la página, y un cajón modal lo taparía.**
    - «Solicitud enviada.» sale en un aviso flotante de la página, con «Volver a la ficha, donde estabas» si se llegó desde ella (`FO:86, 100-109`; `PE:124-130`).
    - El modelo es el de «Solicitar vínculo»: al enviarse, el diálogo se cierra y la página dice qué pasó (`WEB\app\pro\solicitar-vinculo.tsx:12-13, 73-78`; E-91, `WP:231`).
    - Hoy la lista se actualiza sola porque la vista se monta de nuevo (`FO:110`). Con el cajón encima de la lista, hay que volver a leerla al enviar.

14. **Un número declarado se escribe de dos maneras en dos pantallas.**
    - Información: sin unidad y con punto decimal. La APK manda la respuesta sin unidad (`APKF:218-231`), la API la guarda en `null` (`LFO:142-146`) y la pantalla escribe `String(valor)` y la unidad solo si vino (`FO:243-244`). «45», no «45 min».
    - Entrenamiento: «la declarada por la persona o, si falta, la de la plantilla», con coma decimal (`CIT:33-36, 84-85`).
    - La unidad está en la pregunta de la plantilla (`CF:55`), que el detalle ya lee para los rótulos (`FO:176-179`).

15. **Las citas internas de dos descripciones están en la base, no en la pantalla.**
    - «…(08:201-204)» (`MIG1:285`) y «…(CAND-10-TRN-A)» (`MIG2:17`) son parte del texto guardado de cada formulario. La API lo entrega tal cual (`LFO:88`) y la pantalla lo muestra (`PE:166`).
    - El criterio las da por mudadas (`CRIT:220`) y la maqueta las dibuja sin ellas (`M27:47`).
    - Sacarlas es cambiar un dato de la base (el catálogo es de solo agregado: `MIG2:3`), o recortar el texto en la pantalla. Lo primero está fuera de lo permitido; lo segundo es la pantalla reescribiendo un dato. Va aparte (3.1).

16. **De antes, que queda a la vista al reescribir.**
    - **La lista puede decir «no hay más» cuando hay.** La API lee una página más uno, saca las de áreas sin acceso y recién ahí decide si hay más (`SOL:171-178`; `PAGI:86-97`). Si entre las leídas hay alguna de un área sin acceso, la página sale corta y sin cursor. Solo pesa con más solicitudes que una página.
    - **Después de iniciar sesión desde Información, se vuelve a Cuenta.** `/pro/advisees/forms` no está entre las rutas con retorno (`LIB\copy.ts:24, 34-43`; `FO:82`).
    - **Con `volver=entrenamiento`, «Volver a la ficha, donde estabas» lleva al Resumen de la ficha,** no a donde estaba la persona **[lo deduzco de `SEG\estado.ts:313-331`]**. La vuelta que sirve es el enlace «Volver a Entrenamiento» (`PE:143-150`).
    - **Enviado desde Entrenamiento, el éxito no se ve.** El aviso se guarda en una página de la que se sale en la línea siguiente (`PE:127-129`; `FO:86`). No encontré que Entrenamiento lo diga al llegar **[supongo]**.
    - **Un formulario sin área propia arranca en «Entrenamiento»** (`PE:44`), aunque sea de hábitos o de salud. Si el profesional no tiene esa área, la API responde 404 y la pantalla dice «No pudimos abrir este contenido.», que es el texto neutral del asesorado, no el del profesional (`SOL:62-68`; `PE:123`; `LIB\intento.ts:44, 54-55`; `DOM\copy-vinculo.ts:132, 134`).
    - **«Viniste desde Entrenamiento: el formulario, los campos y el alcance ya están elegidos»** se muestra con `volver=entrenamiento` aunque falte `plantilla=`, y entonces no hay nada elegido (`PE:50-51, 143-145`).
    - **Si falla la lectura de la plantilla, el detalle muestra los códigos de las preguntas** (`FO:179, 192, 241`), contra lo que dice su propio comentario (`FO:175`).
    - **Después de un resultado incierto, cambiar lo elegido y reenviar reusa la clave del intento anterior** (`PE:47, 118-120`). «Solicitar vínculo» la descarta al cambiar un dato (`WEB\app\pro\solicitar-vinculo.tsx:55-59`).
    - **Cada vez que se abre un detalle se vuelve a leer,** con dos lecturas (`FO:153, 170-185`).

## 2. Región por región

### 2.0 El marco del área, en Información (`M26H:15-29`)

| Región | Maqueta | Hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Volver | «Volver a la ficha, donde estabas» (`M26H:17`) | Solo con un `volver` válido (`FO:98`; `ADV\retorno-y-preparacion.tsx:35-42`); si no, la miga (`FO:96`) | Tiene que estar siempre: desde un pendiente se llega sin `volver`. Con `volver=entrenamiento`, dice «Volver a Entrenamiento» (1.16) |
| Título y persona | «Información» + «Ana Ruiz · Asesorado · 5db647» (`M26H:18`) | `h1` (`FO:97`); la persona no se nombra | La referencia, sin alias. Sale de los vínculos, que la página hoy no lee |
| Acceso actual | «Las tres áreas [Activo]» (`M26H:20`) | No se dice | Las áreas con su nombre (E-10). Acá explican la lista: se ven solo las solicitudes de las áreas con acceso hoy (`SOL:151, 173-177`) |
| «Actualizar» y hora | Sí (`M26H:21-22`) | No existen: la vista lee al montarse (`FO:130-132`) | Vuelve a leer la lista y el detalle abierto (E-58, `WP:192`) |
| Pestañas | Una: «Solicitudes» (`M26H:26`) | Dos: «Solicitudes» y «Pedir información» (`FO:30-33, 99`) | Las claves de URL no cambian. DEC-I16 |
| Ayuda | «Cómo se lee esta vista» (`M26H:27`) | No hay | Texto nuevo: qué quiere decir cada estado, «Declarado por la persona», «Requerida», «la que rige», y que una solicitud no se cancela ni se edita |
| Contenedor | El ancho de la ficha | 76 rem (`PGF:17`; `CSS:476-478`) | `contenido--ficha` y el cuerpo en 100 rem |

### 2.1 Pantalla 26 · Solicitudes

| Región | Maqueta (texto exacto) | Qué la provee hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Título | «Solicitudes» + «Lo que le pediste a esta persona y lo que declaró. No responder también es una opción.» (`M26:46`) | `h2` (`FO:139`) | Texto nuevo. La segunda frase ya existe en el dominio, dentro de `COPF:54` |
| Acción | «Pedir información», con `solicitar` (`M26:47`) | La pestaña (`FO:32`) | Abre el cajón (2.2). El texto existe (`COPF:20`) |
| Vistas | «Ver · Todas 3 · Sin responder 1 · Respondidas 2» (`M26:49-54`) | No hay | `BotonDeVista`, con la cantidad contada sobre la lista entera (1.3). Elegir no dispara lecturas. «Sin responder» y «Respondida» son textos que comparte la APK (`COPF:49-50`; `APKF:88`): no se tocan |
| Lista | Una tarjeta; por renglón: el nombre, el estado (con `reloj` si está sin responder), «Pedido el 25 sept · Nutrición · 3 preguntas [· corrigió su respuesta]» y «Para qué: «…»» (`M26:58-74`) | `ol.historial`: nombre e insignia; «Pedido el {fecha y hora} · {propósito}»; botón «Ver detalle» (`FO:141-156`) | El área y la cantidad llegan y hoy no se muestran (1.5). «Corrigió» no llega (1.4). El orden es el de la API: la más nueva primero (`SOL:170`; `PAGI:83`). El propósito es texto libre de hasta 300 caracteres (`CF:115`): dos renglones como mucho, y entero en el detalle |
| Elegida | Recuadro (`M26:17, 64`) | El botón dice «Cerrar» (`FO:151`) | El renglón entero abre el detalle; el estado, con `aria-current` |
| Al pie | «Ves las solicitudes de las áreas a las que tenés acceso hoy. Una solicitud no se cancela ni se edita: se puede pedir otra.» (`M26:75`) | No se dice | Las dos cosas son ciertas (`SOL:151, 173-177`; `FOR:5-7`) |
| Detalle: forma | Una tarjeta al costado, con «Detalle de la solicitud» y «Cerrar» (`M26:78-79`) | Debajo de su renglón (`FO:153`) | Al costado desde 75 rem; más angosto, encima de la lista (2.5) |
| Detalle: cabecera | El nombre y el estado (`M26:80`) | En el renglón (`FO:145`) | El foco va al título al abrir |
| Detalle: el pedido | «Lo pediste: El 22 sept 2026 a las 18:43, en Entrenamiento» · «Para qué» · «Respondió: El 22 sept a las 18:43 y lo corrigió a las 18:44» (`M26:81-85`) | «Pedido el…» en la lista; «Respondido el…» dentro de «Respuesta original» (`FO:216-218`); la fecha de cada corrección (`FO:226-228`) | Todo llega en el detalle (`CF:146, 154, 270, 291`) |
| Detalle: lo declarado | «Lo que declaró» + «Declarado por la persona» (con `reportado`) + «No es una medición ni un diagnóstico.» (`M26:88`) | Un aviso con la frase larga (`FO:209-211`; `COPF:109`) y la insignia en cada dato (`FO:244`) | Se dice una vez (`CRIT:218`). La frase corta es nueva y tiene que conservar la negación: el detector acepta «no es … medición» y rechaza la palabra afirmada (`COPF:144-146`) |
| Detalle: tabla | «Pregunta» y «Respuesta que rige»; «Requerida» junto a la pregunta; «Corregida» y «Antes: «…»» junto a la respuesta (`M26:89-99`) | Una lista por versión, con todo lo respondido (`FO:236-250`) | Se arma en la pantalla (1.6). Cada pregunta pedida es una fila, también la que quedó sin responder (2.3). El valor, con `valorDeclarado` (1.14) |
| Detalle: historia | «Historia de la respuesta» + «La respuesta original se conserva.»; cada versión con su fecha; la corrección, con «Vigente» y «Motivo que escribió: «…»»; la original, con «Respondió 1 de las 2 preguntas.» (`M26:102-108`) | Bloques completos, uno debajo del otro (`FO:212-231`) | Nada se pierde: lo respondido en cada versión queda a un clic (DEC-I13). «Vigente», por relación. El motivo puede tener hasta 1.000 caracteres (`CF:218`) |

### 2.2 Pantalla 27 · Pedir información (se abre sobre la 26)

| Región | Maqueta | Qué la provee hoy | Qué cambia y qué cuidar |
|---|---|---|---|
| Forma | Un cajón a la derecha, de 800 px, con velo (`M27:3-5`) | Una vista (`PE:133-247`) | Diálogo modal: retiene el foco, y Escape no corta un envío en curso (`WEB\app\pro\solicitar-vinculo.tsx:47-52, 97-100`). El velo no puede ser un color escrito a mano (`SC\contraste.test.cjs:343-371`) |
| Cabecera | «Ana Ruiz · Asesorado · 5db647» + «Pedir información» + «Cerrar» (`M27:38-41`) | El título es el de la pestaña | La referencia, sin alias |
| Aviso | «Pedir información no amplía tu acceso ni el consentimiento: hasta que responda, no hay dato nuevo.» (`M27:42`) | El mismo aviso, con el texto del dominio (`PE:152-154`; `COPF:44`) | Va el del dominio («hasta que el asesorado responda»): tiene prueba |
| Paso 1 | «Qué formulario» + «Catálogo de demostración: no es un catálogo clínico.»; una lista de opciones con «6 preguntas»; la descripción, solo en el elegido (`M27:45-50`) | «Formularios disponibles», la nota, y cada formulario con su descripción y «Elegir» o «Elegido» (`PE:156-173`) | La cantidad llega (`fieldCount`, `CF:79`). Elegir lee la versión (`PE:66-72`): el paso 2 tiene que decir que está cargando, o que falló |
| Paso 2 | «Qué preguntas» + «6 de 6 elegidas. Si responde, las requeridas no pueden quedar vacías.»; tabla con una casilla, «Pregunta», «Responde con» y «Requerida» (`M27:54-63`) | Un grupo por sección; por pregunta, una casilla, su texto de ayuda y, si está elegida, otra casilla «Requerido: {pregunta}» (`PE:180-214`) | DEC-I1. «Responde con» sale del tipo y la unidad (`CF:53, 55`). «Requerida» se puede marcar solo en una pregunta elegida. Cada casilla necesita su nombre completo para el lector de pantalla, como hoy (`PE:206-208`) |
| Paso 3 | «Para qué y en qué área»: «Para qué lo necesitás» + «Queda registrado y el asesorado lo ve.»; «Área», con candado + «Este formulario es solo de Entrenamiento.» (`M27:67-71`) | El campo, con su ayuda de dos frases, hasta 300 caracteres (`PE:216-223`; `COPF:34-35`); un selector «Alcance», con una sola opción si el formulario tiene área (`PE:225-235`; `COPF:36, 38`) | Con área propia, bloqueado. Sin área propia, hay que elegir (2.3; DEC-I8) |
| Pie | «Enviar solicitud» + «Le llega a su teléfono, en «Información». No se puede cancelar ni editar después de enviarla.» (`M27:74-77`) | El botón, apagado sin propósito (`PE:237-241`) | Lo que hay que leer antes de un acto que no se deshace queda a la vista, junto al botón (`GUIA:36-38`). La primera frase: ver 4.3 |

### 2.3 Lo que no está dibujado: cómo queda con el marco nuevo, sin cambiarle el contenido

| Qué | Dónde está hoy | Cómo queda |
|---|---|---|
| **El detalle de una solicitud sin responder** | Las preguntas pedidas, en un renglón, y «Todavía sin responder. No responder también es una opción.» (`FO:191-194`; `COPF:54`) | La misma tarjeta: «Lo pediste», «Para qué», las preguntas pedidas con «Requerida», y esa frase en el lugar de la tabla. Sin «Historia» |
| **Una pregunta pedida que quedó sin responder** | No se ve como fila: se ve solo que falta entre lo respondido (`FO:239`) | Una fila con «Sin responder». La persona omite lo que no responde (`CF:181-184`): es un hueco, no un valor vacío |
| **Una respuesta «Sí o no»** | «Sí» o «No» (`FO:243`) | Igual. En el pedido, «Responde con: Sí o no». Existe una pregunta así: «Fuma actualmente» (`MIG1:294`) |
| **Un formulario sin área propia** (dos de los tres: `MIG1:286, 293`) | El selector ofrece las tres áreas (`PE:229`) | «Área» es un selector, sin candado ni la nota del candado |
| **Un formulario con más de una sección** | Un grupo con su título por sección (`PE:181-182`) | El título de la sección, como una fila de grupo de la tabla. Hoy los tres formularios tienen una sola sección (`MIG1:287, 294`; `MIG2:19`), así que no se ve |
| **El texto de ayuda de cada pregunta** | Debajo de la pregunta (`PE:193-197`) | Un segundo renglón, más tenue (DEC-I11). Es lo que va a leer la persona, y a veces dice el rango admitido («Un número entero entre 1 y 7», `MIG2:19`), que no llega de otra forma |
| **La llegada desde Entrenamiento** | Un aviso y «Volver a Entrenamiento» (`PE:143-150`); la precarga (`PE:80-85`) | El aviso, debajo del aviso de siempre, solo si de verdad hay precarga. «Volver a Entrenamiento», en el cajón y en el marco |
| **Los rechazos al enviar** | Un aviso con el foco, arriba; tres textos propios y el general (`PE:31-35, 123, 137-141`; `COPF:39-41`) | Dentro del cajón, con el foco. Lo elegido se conserva |
| **Sin ninguna pregunta elegida** | «Elegí al menos un campo para pedir.», al tocar «Enviar» (`PE:105`; `COPF:31`) | Igual. Con «0 de 6 elegidas» a la vista, el botón puede además esperar |
| **Más de una corrección** | Todas, en el orden de la API (`FO:221-231`) | Todas en la historia, la más nueva arriba. «Antes» es el último valor distinto del que rige, yendo hacia atrás por la cadena (DEC-I14) |
| **Una cadena que no se puede resolver** | La original lleva «Vigente» (defecto, 1.6) | En el lugar de la tabla, que no se puede decir cuál rige. Todas las versiones en la historia, ninguna con «Vigente» (DEC-I15) |
| **El catálogo vacío** | «Todavía no hay formularios disponibles.» (`PE:159`; `COPF:25`) | En el paso 1 |
| **El éxito** | Aviso flotante en la página (`FO:100-109`) | El cajón se cierra, la lista se vuelve a leer y la página lo dice (1.13) |

### 2.4 Estados (pantalla 19; `CRIT:222-235`)

| Estado | Hoy | Con el marco nuevo |
|---|---|---|
| Sin sesión; cuenta cargando, con falla o sin espacio profesional | `FO:89-92` | Igual, con el título a la vista |
| Asesorado no disponible (404) | «No encontramos un recurso disponible para esta acción.» + «Volver» (`FO:57-66, 70`) | El mismo texto |
| Lista cargando o con falla | «Cargando…» o «No pudimos cargar esta vista.», sin motivo (`FO:69-71`) | Bloque de estado, con qué se carga o por qué falló (`COMP\estados.tsx:40-72`; `LIB\fallas.ts:10-35`). Las vistas, sin número |
| Sin solicitudes | «Todavía no le pediste información a esta persona.» (`FO:140`; `COPF:47`) | Igual, con «Pedir información» como paso siguiente |
| Una vista sin ninguna | No existe | La vista se muestra con su cero, y la lista dice que ninguna coincide (no que no hay solicitudes) |
| Detalle cargando, con falla o ya no disponible | Lo mismo que la lista, dentro del renglón (`FO:188`) | En la tarjeta del detalle; la lista sigue |
| Falla solo la plantilla | Se ven los códigos (1.16) | Se dice que no se pudieron leer las preguntas, con «Reintentar». Nunca un código |
| El catálogo no se pudo leer | La vista entera en error (`PE:134`) | En el cajón |
| Lista leída a medias (más de las que se leen de una vez) | No existe: lee 20 y no avisa | Las cantidades son «al menos» y hay «Ver más» (`LIB\lista-completa.ts:24-25, 50-53`) |

### 2.5 En 1280 y en 1024 (`CRIT:260`); 768 y 390

| Ancho | 26 · Solicitudes | 27 · Pedir información |
|---|---|---|
| 1440 | Lista de 520 px y el detalle en el resto (`M26:7`): unos 860 px **[estimo]** | Cajón de 800 px; quedan 640 de la página a la vista |
| 1280 | «Igual, más angosto»: el detalle queda en unos 700 px, y la columna de la respuesta, en unos 350 (la de la pregunta mide 290: `M26:33`) **[estimo]** | Igual; quedan 480 px de la página |
| 1024 | «El detalle se abre encima de la lista». Si usa el panel de hoy, mide 471 px (`CSS:3419`) y la tabla de dos columnas no entra: la pregunta arriba y la respuesta debajo **[estimo]** | «El pedido ocupa todo el ancho» |
| 768 y 390 | Una columna; el detalle, como diálogo centrado (`CSS:3409-3414`) | Diálogo a todo el ancho; la tabla de preguntas, una pregunta por bloque |

Dos medidas de la maqueta que no alcanzan:
- Las filas de la tabla de preguntas miden 42 px (`M27:24`). El objetivo mínimo es de 44 (`GUIA:133`).
- El cajón está dibujado para 960 px de alto (`M27:5`). Con filas de 44 y el formulario de seis preguntas, el contenido ronda los 880 px **[estimo]**: en una ventana de 900 entra justo, y con el texto de ayuda de cada pregunta, no. El pie (el botón y la advertencia) tiene que quedar fijo y el cuerpo desplazarse adentro, como ya hace el panel (`CSS:3412-3413`).

## 3. Qué dato llega y qué no

| Lo que muestra el diseño | ¿Llega? | Operación y campo | Con lo que hay |
|---|---|---|---|
| Las solicitudes | Sí, de a páginas | API-FRM-04 (`CLI:1231-1233`) | Leerlas todas: de a 50 (`PAGI:10`) |
| «Todas 3 · Sin responder 1 · Respondidas 2» | **No** | — | Contar la lista leída entera (1.3) |
| El nombre del formulario y el estado | Sí | `templateName`, `status` (`CF:150, 153`) | — |
| «Pedido el 25 sept» | Sí | `createdAt` (`CF:154`) | Sin el año si es del año en curso (`LIB\formato.ts:35`; E-57) |
| «Nutrición» | Sí | `scope` (`CF:146`), con `ETIQUETA_DE_ALCANCE` (`DOM\alcance.ts:46`) | — |
| «3 preguntas» | Sí | `requestedFieldCodes` (`CF:151`) | Se cuentan |
| «· corrigió su respuesta», en la lista | **No** | — | Está en el detalle (`CF:288`). DEC-I2 |
| «Para qué» | Sí | `purpose` (`CF:145`) | — |
| «Respondió el … y lo corrigió a las …» | Sí, en el detalle | `response.submittedAt`, `rectifications[].recordedAt` (`CF:291, 270`) | — |
| El texto de cada pregunta | Sí, con otra lectura | API-FRM-02: `sections[].fields[].label` (`CF:52`), con la plantilla y la versión de la solicitud (`CF:148-149`) | No es una lectura protegida (`FCT:41-45`). Se puede guardar por versión durante la visita, como hace `CIT:70-76` |
| «Requerida» | Sí | `requiredFieldCodes` (`CF:152`) | — |
| «Respuesta que rige» | Sí, por relación | `effectiveView`, `original.answers`, `rectifications[].answers` (`CF:287-289`) | 1.6 |
| «Corregida» y «Antes: …» | Se calcula | La cadena: `previousRectificationId` (`CF:265`) | 1.6 |
| «Declarado por la persona» | Sí | `provenance`, que es siempre `SELF_REPORTED` (`CF:177`) | — |
| «Motivo que escribió» | Sí | `rectifications[].reason` (`CF:266`) | — |
| «Respondió 1 de las 2 preguntas» | Se calcula | `original.answers` contra `requestedFieldCodes` | — |
| La unidad de un número respondido | A medias | `answers[].unit` viene en `null` desde la APK (1.14) | La de la pregunta (`CF:55`) |
| Los formularios, con «6 preguntas» | Sí | API-FRM-01: `name`, `purpose`, `fieldCount`, `domain` (`CF:69-81`) | Lee una página de 20 (`PE:57`); hoy son tres |
| «Responde con: Número · min» | Sí | API-FRM-02: `dataType`, `unit` (`CF:53, 55`) | — |
| El rango admitido de un número («entre 1 y 7») | **No** | Los límites son internos (`LFO:43-45`) | Solo en el texto de ayuda de la pregunta (`CF:57`) |
| El área bloqueada | Sí | `domain` de la versión (`CF:93`) | — |
| A qué áreas tengo acceso, para ofrecer solo esas | No en estas lecturas | — | Sale de los vínculos, si el marco los lee. Hoy se ofrecen las tres «sin adivinar» (`PE:13-14`) |
| El alias («Ana Ruiz») | **No existe** | — | La referencia (`WP:259`) |
| «Consultado a las 10:32» | **No** | — | El reloj del navegador al llegar la lectura (`LIB\lista-completa.ts:26, 47`) |
| «Le llega a su teléfono» | **No hay aviso** | — | 4.3 |

### 3.1 Pide ampliar la API o cambiar un dato (aparte: no está en los pasos)

| # | Qué | Línea | Qué resolvería |
|---|---|---|---|
| 1 | En cada solicitud de la lista: si su respuesta tiene correcciones, y cuándo se respondió | `CF:140-155` no lo tiene; `SOL:27` lee solo el identificador de la respuesta | «· corrigió su respuesta» en el renglón, sin una lectura por solicitud |
| 2 | Las cantidades por estado | `CF:158`: la página no trae totales | Las tres vistas con su número sin leer la lista entera |
| 3 | Que la lista decida «hay más» antes de sacar las de áreas sin acceso | `SOL:171-178` | Que una página no salga corta y sin cursor (1.16). No cambia el contrato: es un arreglo de la API |
| 4 | La descripción de dos formularios, sin la cita interna | `MIG1:285`; `MIG2:17` (dato de la base) | Lo que dibuja la maqueta (`M27:47`). Pide una versión nueva de cada formulario |
| 5 | El alias del asesorado | `WP:259` (DL-040, abierta) | «Ana Ruiz» |

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Hoy existe y la maqueta no lo muestra (dónde queda)

| # | Qué | Dónde está | Dónde queda |
|---|---|---|---|
| 1 | La pestaña «Pedir información» | `FO:32` | El botón de «Solicitudes». La dirección `vista=pedir` sigue (1.1) |
| 2 | Las migas | `FO:96` | El marco |
| 3 | «Ver detalle» y «Cerrar» en cada renglón | `FO:150-152` | El renglón abre; «Cerrar», en el detalle |
| 4 | La hora del pedido, en la lista | `FO:148` (`fecha` da día y hora) | En el detalle («a las 18:43») |
| 5 | «Campos: a · b · c» | `FO:191-193` | Las filas de la tabla, una por pregunta pedida |
| 6 | «Todavía sin responder. No responder también es una opción.» | `FO:194`; `COPF:54` | En el detalle de una solicitud sin responder (2.3) |
| 7 | El aviso «Esta información la declaró el asesorado. No es una medición ni un diagnóstico.» | `FO:209-211`; `COPF:109` | El encabezado «Lo que declaró», con su etiqueta y la frase corta. La frase larga, en la ayuda de la vista |
| 8 | «Declarado por la persona» en cada dato | `FO:244` | Una vez, en el encabezado |
| 9 | «Respuesta original», con todo lo que respondió | `FO:212-220` | En la historia; lo respondido, a un clic (DEC-I13) |
| 10 | Cada corrección, con todo lo que respondió | `FO:221-231` | Igual |
| 11 | La descripción de cada formulario | `PE:166` | La del elegido, a la vista; las otras aparecen al elegirlas (elegir no envía nada) |
| 12 | «Elegir» y «Elegido» | `PE:167-169` | Una opción por formulario |
| 13 | El nombre del formulario como título del armado | `PE:177` | Lo dice la opción elegida |
| 14 | «Elegí qué campos pedir» | `PE:178`; `COPF:28` | «Qué preguntas», con la cuenta |
| 15 | El título de cada sección | `PE:181-182` | Fila de grupo, si hay más de una sección (2.3) |
| 16 | El texto de ayuda de cada pregunta | `PE:193-197` | DEC-I11 |
| 17 | «Requerido: {pregunta}», que aparece solo si la pregunta está elegida | `PE:198-210` | La columna «Requerida», apagada en una pregunta sin elegir |
| 18 | La segunda frase de la ayuda del propósito: «Explicá para qué vas a usar esta información.» | `COPF:35` | Se conserva: la maqueta dibuja solo la primera (`M27:69`) |
| 19 | El selector de área con las tres opciones | `PE:225-235` | El mismo selector, cuando el formulario no tiene área propia |
| 20 | «Esta plantilla es de un solo Alcance: la solicitud va con ese.» | `COPF:38` | «Este formulario es solo de {área}.» (`M27:70`) |
| 21 | «Viniste desde Entrenamiento…» y «Volver a Entrenamiento» | `PE:143-150` | En el cajón (2.3) |
| 22 | Los tres rechazos con su texto | `PE:31-35`; `COPF:39-41` | En el cajón, con las palabras nuevas (DEC-I9) |
| 23 | El aviso de éxito con «Volver a la ficha, donde estabas» | `FO:100-109` | En la página, al cerrarse el cajón, con el mismo enlace |
| 24 | Volver a Entrenamiento al enviar | `PE:128-129` | Igual |

### 4.2 La maqueta lo muestra y BE no lo tiene

- **No existe:** el alias; un aviso al teléfono.
- **No llega en esa lectura:** «corrigió su respuesta», en la lista; las cantidades por estado.
- **Hay que calcularlo en el navegador:** las cantidades de las vistas; la respuesta que rige, pregunta por pregunta; «Corregida» y «Antes»; «Respondió 1 de las 2»; «6 de 6 elegidas»; la hora de la consulta.
- **Llega y hoy no se muestra:** el área de cada solicitud; cuántas preguntas tiene; cuáles son requeridas; con qué se responde cada pregunta.

### 4.3 La maqueta dice algo que en BE no es así, o no dice lo que BE dice

| La maqueta | En BE | Qué hacer |
|---|---|---|
| «Ana Ruiz · Asesorado · 5db647» | Solo la referencia | Un dato |
| «Acceso actual · Las tres áreas» | Descartado en la ficha (E-10, `WP:124`) | Las áreas con su nombre |
| La pestaña «Solicitudes» con la persona y el signo más | Ese dibujo es «solicitar un vínculo» (`CAT:219`); el del área es `informacion` (`CAT:58`) | DEC-I16 |
| «Le llega a su teléfono, en «Información».» | BE no manda ningún aviso: la APK no tiene notificaciones (lo busqué). La solicitud aparece en «Información» de la APK cuando la persona la abre | Decir lo que pasa: «La va a ver en su teléfono, en «Información».» |
| «…hasta que responda, no hay dato nuevo.» | «…hasta que el asesorado responda, no hay dato nuevo.» (`COPF:44`) | El texto del dominio |
| La descripción del formulario, sin la cita | La cita es parte del dato (1.15) | 3.1 |
| «6 de 6 elegidas», al elegir un formulario | Ninguna elegida, salvo al llegar desde Entrenamiento (1.7) | DEC-I1 |
| Cinco «Requerida» ya marcadas | Es la precarga ratificada de ese formulario, y hoy vale solo al llegar desde Entrenamiento (`PE:51, 80-85`; `FOR:98`). Para los otros dos no hay ninguna | DEC-I1 |
| «Área», «formulario», «pregunta» | «Alcance», «plantilla», «campo» (`COPF:24-41`) | DEC-I9 |
| «Respondió 1 de las 2 preguntas.» | El dominio pide no medir la ausencia: «ni con un cero, ni con un porcentaje de completitud» (`COPF:9-10`). Esto es una cuenta, no un porcentaje, y pasa el detector | Dejarla donde está dibujada, en la historia. Nunca en la lista, nunca como proporción (DEC-I19) |
| Filas de 42 px en la tabla de preguntas | El mínimo es 44 (`GUIA:133`) | 44 |
| El velo y la sombra del cajón, con colores a mano (`M27:3-5`) | Solo tokens (`SC\contraste.test.cjs:343-371`) | Los del diálogo de hoy |
| No dibuja: una solicitud sin responder abierta, una pregunta sin responder, «Sí o no», un formulario sin área, un rechazo, una cadena sin resolver | Existen | 2.3 |
| La barra superior | Vieja | No se toca |

## 5. Piezas del primer paquete: dónde encaja cada una

| Pieza | Dónde | Para qué acá |
|---|---|---|
| `Icono` y el catálogo | `COMP\icono.tsx:35-56`; `DOM\iconos.ts` | Están todos: `solicitar`, `solicitud`, `informacion`, `reloj`, `reportado`, `corregido`, `cerrar`, `info`, `tilde`, `candado`, `volver`, `acceso`, `actualizar`, `ayuda` (`DOM\iconos.ts:74-170`). No hace falta dibujar ninguno |
| `BotonDeVista` | `COMP\vista-con-nombre.tsx:14-51` | Las tres vistas de «Solicitudes», con su cantidad y con «al menos» si la lista no se leyó entera. La elegida va llena y lo dice `aria-pressed` |
| `useListaCompleta` | `LIB\lista-completa.ts:30-60` | La lista entera, de a 50. Da la hora de la consulta para el marco, guarda el motivo de una falla y no hace saltar la pantalla al actualizar |
| `BloqueDeEstado`, `EstadoVacio`, `lib\fallas.ts` | `COMP\estados.tsx:24-72`; `LIB\fallas.ts:10-35` | Los estados de 2.4 |
| El detalle al costado | `SEG\linea-de-tiempo.tsx:85, 157-167, 294-332, 450, 483-512`; `CSS:3012-3022, 3267-3309` | Es el patrón de la 26. Se reusa el comportamiento: el corte de 75 rem, el foco al título, Escape, «Cerrar» devuelve el foco al renglón, y el panel encima cuando la ventana es angosta. Las clases, no: la lista de la maqueta mide 520 px fijos y la de la línea de tiempo se reparte de otro modo (E-02). El lector del corte (`useDetalleAlCostado`) es privado de ese archivo: hay que sacarlo a un lugar común, como se hizo con el botón de vista (E-97) |
| `PanelDeRegistro` y `.dialogo--panel` | `SEG\registro-original.tsx:50-95`; `CSS:3409-3426` | La forma del detalle en una ventana angosta. El componente no: lee un registro por su cuenta |
| `.dialogo--formulario` y «Solicitar vínculo» | `CSS:6118-6124`; `WEB\app\pro\solicitar-vinculo.tsx:47-52, 93-102` | El modelo del cajón del pedido: se abre modal, el foco entra por el primer control, Escape no corta un envío, y al enviarse se cierra y la página lo dice. Cambia el tamaño y que va al costado |
| `ComoSeLeeEstaVista` | `SEG\como-se-lee.tsx:237-274` | La cáscara (botón, diálogo, foco al título) sirve; el componente está atado a las vistas de la ficha (`:15, 231-235`). Hay que separarla, una vez, para las cuatro áreas |
| `AvisoFlotante` | `COMP\ayuda.tsx:33-67` | El éxito, en la página, después de cerrarse el cajón. Con un enlace adentro no se va solo (`seQueda`) |
| `.etiqueta-de-dato` | `CSS:3817-3828` | «Sin responder», «Respondida», «Requerida», «Corregida», «Vigente», «Declarado por la persona» |
| El marco de la ficha | `ADV\workspace.tsx:169-211`; `CSS:4289-4435` | El modelo del marco del área |
| La guía | `GUIA` I y II | I.1.2 (`:36-38`: lo que se lee antes de un acto que no se deshace queda a la vista); I.3 y `:133` (44 px); II.3 (`:289-292`: la dirección dice dónde se está, y por eso `vista=pedir` sigue abriendo el pedido); II.8 (`:552, 555, 559-561`: las piezas). Hay que sumar el cajón de formulario a la tabla de II.8 |

Y una pieza que no es del primer paquete, pero ya existe: **`valorDeclarado` y la elección del conjunto que rige, en `CIT:33-36, 66-69`**, con su prueba. Es de Entrenamiento: conviene mudar esas dos cosas a un lugar común y que las dos pantallas las usen, coordinando con quien lleve Entrenamiento.

## 6. Pasos, en un orden que deja la pantalla funcionando

Cada compilación del website tarda de 2 a 5 minutos, con la API apagada (`MOD:311`). `npm run typecheck` va antes de cada una. Una prueba nueva de `SC` hay que sumarla a la lista de `REPO\package.json:33`.

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Sin compilar: el «antes» y los datos.** Crear, en el escenario descartable, una solicitud sin responder, una respondida y una respondida y corregida (que cambie una respuesta y agregue otra), en dos áreas. Capturar las dos vistas de hoy a 1440, 1280, 1024, 768 y 390 | `H\datos` (DEC-I17) | Bajo | `paginas.mjs` (`PGS:42`); `ver.mjs` |
| 1 | **Sin compilar: lo que no es pantalla, con sus pruebas.** (a) Una función pura: de la respuesta y la plantilla, por cada pregunta pedida, el valor que rige, si cambió y cuál era antes; cuántas respondió la original; y el caso de la cadena sin resolver. Usa lo de `CIT`. (b) Los textos nuevos del lado del profesional en `COPF`, como cadenas. (c) El bloque de Información en `CP`, con el detector de formularios | Un `.ts` nuevo en `FRM`; una prueba nueva en `SC`; `COPF`; `CP`; `package.json` | Bajo | `npm test`. Poner «obligatorio» en una pantalla y ver que la prueba lo dice |
| 2 | **Compilación 1: «Solicitudes» (26), dentro del marco.** La lista entera, las vistas con su cantidad, el renglón con área y cantidad de preguntas, la nota al pie, y el detalle al costado con la tabla y la historia. «Pedir información» ya es un botón, que por ahora lleva a la vista de hoy | `FO`, `PGF`, el marco (si todavía no está), el lector del corte, `CSS` | **Medio:** la lista leída entera, el detalle nuevo y el selector de R3 | `typecheck`; compilar; `ver.mjs` con `#clic:`; `recorrido-comprension.mjs` (R3) |
| 3 | **Compilación 2: «Pedir información» (27), en el cajón.** Los tres pasos; `vista=pedir` abre «Solicitudes» con el cajón encima; las cuatro entradas; la precarga y la vuelta a Entrenamiento; el éxito en la página y la lista releída. **R3 se adapta en este mismo commit** | `PE`, `FO`, `CSS`, `RC` | **Alto** | Enviar una solicitud en el descartable; salir sin enviar; llegar desde la ficha, desde Entrenamiento y desde un pendiente |
| 4 | **Mirar y medir, sin compilar.** Cinco anchos, dos temas; el detalle y el cajón abiertos; cada estado; fallas y rechazos simulados | — | — | `ver.mjs` con `#clic:`, `#falla:` y `#entrega:` (`H\ver.mjs:8-17`) |
| 5 | **Compilación 3: lo que salga de mirar,** y las comprobaciones nuevas (§8.2) | `CSS`, `R` | Bajo | El modo nuevo del recorrido |
| 6 | **Una vez, al final:** los recorridos completos sobre datos recién generados, y la CI | — | — | — |
| 7 | **Documentos.** `GUIA`: II.8 (el cajón de formulario; el detalle al costado, ahora en dos pantallas) y II.3 (las migas de área). La definición y la aceptación del segundo paquete. `SC\auditoria-accesibilidad.mjs:129-130`, que busca un enlace «Pedir información» que la ficha ya no tiene | Documentos | Bajo | — |

**El paso 3 es el más riesgoso.** Junta cuatro cosas: es la única escritura de la pantalla, y no se puede cancelar ni editar después; cambia qué viene elegido (según DEC-I1); tiene cuatro entradas con dos vueltas distintas (a la ficha y a Entrenamiento); y rompe una comprobación que existe.

Si el plazo corta después del paso 2, «Solicitudes» queda completa y el pedido sigue funcionando como hoy, a un clic.

## 7. Comportamiento que hay que conservar

**Sesión, permisos y acceso**
- Sin sesión, a «Iniciar sesión» (`FO:82, 89`).
- 404 es «no hay nada que mostrar», con el mismo texto para lo ajeno y lo inexistente (`FO:56-66`).
- Se listan solo las solicitudes de las áreas con acceso hoy; una solicitud de un área sin acceso no se ve ni se abre (`SOL:151, 173-177, 206-214`).
- Solo pide el profesional y solo responde el asesorado (`FOR:41-44`).

**Lo que no se puede hacer, y la pantalla no ofrece**
- Una solicitud no se cancela, no se edita, no se rechaza y no vence (`FOR:5-7`; `CF:10-11`). Tiene dos estados: sin responder y respondida.
- No se crea un formulario desde la pantalla: el catálogo es fijo (`CF:8`).
- El profesional no corrige ni completa una respuesta.

**Pedir**
- Pedir no concede nada: el aviso está siempre a la vista en el pedido (`PE:152-154`).
- Lo requerido es parte de lo pedido: al sacar una pregunta, deja de estar requerida (`PE:115-116`; `SOL:92-95`).
- Un formulario con área propia se pide solo en esa área (`PE:73-74`; `SOL:81-86`).
- El propósito es necesario, hasta 300 caracteres (`PE:222, 238`; `CF:115`).
- Hasta 60 preguntas por solicitud (`CF:117`).
- Una clave por intento, que se conserva solo si el resultado fue incierto (`PE:47, 118-120`; `LIB\intento.ts:18-38`).
- Los rechazos que dependen de lo elegido se dicen con su motivo, no como «el servicio no está disponible» (`PE:30-35`).
- Desde Entrenamiento: la precarga se puede cambiar antes de enviar, y al enviar se vuelve a Entrenamiento (`PE:17-19, 128-129`).

**Reglas de BE**
- Lo respondido es «declarado por la persona»: nunca una medición ni un diagnóstico (`COPF:108-109, 144-146`).
- No responder es una opción: «Sin responder» no es una alarma, no lleva color ni cuenta días. Ningún porcentaje, ningún «completó», ningún «obligatorio» (`COPF:123-131, 142`).
- Una pregunta sin responder es un hueco: no se muestra vacía ni con un cero.
- La respuesta que rige se elige por relación; la original se conserva y se ve (`FO:202-203`).
- La pantalla muestra el texto de cada pregunta, nunca su código (`FO:175`).
- Una falla no es «todavía no le pediste información».

**Accesibilidad**
- «Saltar al contenido», un `h1`, foco visible, 44 px en cada objetivo.
- Un estado se dice con palabras: «Sin responder» lleva ícono y texto; la elegida de las vistas, por su relleno.
- En la tabla del pedido, cada casilla tiene su nombre completo («Pedir: …», «Requerida: …»).
- El cajón retiene el foco y lo devuelve al botón que lo abrió; el detalle al costado, al renglón.

**Enlaces y parámetros**
- `id`, `vista` (`solicitudes`, `pedir`), `plantilla` y `volver` quedan como están.
- Entre vistas se navega con `router.replace` (`FO:85`): Atrás vuelve a donde se vino (la ficha, Entrenamiento o los pendientes).

## 8. Las pruebas y los recorridos que tocan estas pantallas

### 8.1 Lo que hoy las toca

| # | Dónde | Qué mira | Qué protege | Con lo nuevo |
|---|---|---|---|---|
| 1 | `RC:945-960` (R3) | «Solicitar contexto» lleva a `/pro/advisees/forms`; `main` dice «Volver a la ficha»; clic en `.retorno-a-la-ficha a`; ninguna escritura; tantas solicitudes como antes | Que el pedido tiene vuelta, y que salir sin enviar no escribe | **Falla** con el cajón modal (1.2). Se adapta en el paso 3: cerrar el cajón y volver. Lo que protege no cambia |
| 2 | `SC\espacio-profesional.test.mjs:169`; `R:3446` | Un pendiente de formulario abre `/pro/advisees/forms?id=…&vista=solicitudes` | La parte 5 | Pasa, si `vista=solicitudes` sigue |
| 3 | `SC\espacio-profesional.test.mjs:151`; `R:3441, 3585`; `CAR:152, 177` | «Formulario sin responder desde el…» | La parte 5 | No se toca |
| 4 | `DOM\contratos-wp07.test.ts:146-157` | Todo `COPF`, sin términos prohibidos | Pedir no es obligar; lo declarado no es una medición | Los textos nuevos de `COPF` pasan por ahí, y tienen que ser cadenas (1.9) |
| 5 | `DOM\errores-de-formulario.test.ts:163, 195-196, 234, 247` | Los textos de la APK al responder | El lado del asesorado | No se toca |
| 6 | `SC\contexto-citable.test.mjs` | La lectura de respuestas de Entrenamiento | Que se cita la versión vista | Si se muda `valorDeclarado` o la elección de lo que rige, esta prueba sigue al archivo |
| 7 | `SC\contraste.test.cjs:343-371` | Ningún color literal en `apps\web\src` | Todo color se puede medir | El velo y la sombra de la maqueta no se pueden copiar |
| 8 | `PGS:42` | Captura `solicitudes` y `pedir`, y mide el alto | Nada: es el antes y el después | Sigue: las dos direcciones existen. `pedir` va a ser la lista con el cajón encima |
| 9 | `SC\auditoria-accesibilidad.mjs:129-130` | Un enlace «Pedir información» desde la ficha | Axe; está fuera de la CI y vieja (`WP:288`) | Ya no encuentra ese texto en la ficha (hoy dice «Solicitar contexto») |
| 10 | `R:142-153` y `RC:124-135` (`quieto`) | Que no queden pedidos en vuelo ni un `.cargando` | Que no se mida a medio cargar | Vale igual |
| 11 | `SC\retorno-seguro.test.mjs:13-40` | Las rutas con retorno después de iniciar sesión | Que el retorno no salga del sitio | `/pro/advisees/forms` no está en la lista ni en la prueba (DEC-I18) |

**Ninguna comprobación abre hoy «Solicitudes» para mirar algo, ni envía una solicitud de formulario.** No hay nada que adaptar adentro, salvo R3: hay que escribirlo. Tampoco hay negativas sobre estas pantallas.

### 8.2 Comprobaciones nuevas que conviene escribir

**En la CI (la función pura):**
- Sin respuesta; con la original sola; con una corrección que cambia un valor, que agrega una respuesta y que saca una.
- Dos correcciones encadenadas que llegan desordenadas: rige la que dice la relación.
- La cadena sin resolver: ninguna rige.
- Una pregunta pedida y nunca respondida; un código que no está en la plantilla.
- Un número con y sin unidad; un «Sí o no».

**En el recorrido** (lo esperado, a mano desde la API con la sesión de la página):
- **La lista:** tantos renglones como la API, leída entera y en su orden; cada uno con su nombre, estado, día, área, cantidad de preguntas y propósito.
- **Las vistas:** cada cantidad es la que se ve al elegirla; «Sin responder» y «Respondidas» suman «Todas»; una vista en cero se muestra; elegir no dispara lecturas.
- **Negativa con su positiva:** la página no tiene la pestaña «Pedir información» ni «Ver detalle»; el botón «Pedir información» está.
- **El detalle:** a 1440 se abre al costado y la lista sigue a la vista (medido); el foco va al título; Escape y «Cerrar» lo devuelven al renglón; a 1024 se abre encima.
- **La respuesta que rige, en pantalla:** cada valor es el de la versión que dice la API; «Corregida» y «Antes» coinciden con lo calculado aparte; la pregunta sin responder dice «Sin responder».
- **Lo declarado:** «Declarado por la persona» aparece una vez; el texto de `main` no afirma «medición» ni «diagnóstico» y no tiene ningún «%» (con el detector del dominio).
- **El pedido:** `vista=pedir` abre el cajón sobre la lista; el foco entra; Escape lo cierra; cerrar sin enviar no escribe nada y deja `vista=solicitudes` con su `volver`.
- **Los tres pasos:** elegir un formulario lee su versión; «N de M elegidas» sigue a las casillas; «Requerida» no se puede marcar en una pregunta sin elegir; «Responde con» es el tipo y la unidad de la API.
- **El área:** con un formulario de Entrenamiento, bloqueada, y el pedido sale con esa área; con uno sin área, no sale nada hasta elegir.
- **Enviar, en el descartable:** sale un solo `POST`, con lo elegido; el cajón se cierra; la página dice «Solicitud enviada.»; la lista tiene una más, sin responder, y las cantidades suben.
- **Desde Entrenamiento:** abre con las seis preguntas y las cinco requeridas, y al enviar vuelve a `/pro/advisees/training`.
- **Un rechazo simulado** (422 y 404): el texto que corresponde, dentro del cajón, y lo escrito sigue.
- **Fallas simuladas de la lista** (429, 503, sin red): el motivo, y nunca «Todavía no le pediste información».
- **Axe, en los dos temas:** la lista, el detalle y el cajón.
- **Sin desborde** a cinco anchos, y la primera pantalla medida, informada.
- **Las lecturas,** contadas: una protegida al entrar y una al abrir un detalle.
- **Prueba de la prueba** de cada medición nueva.

### 8.3 Dónde escribirlas

- Una función propia dentro de una sesión que ya existe y un modo `informacion`, junto a los de `R:4`: el límite es de cinco inicios de sesión cada quince minutos (`MOD:38`).
- Enviar una solicitud escribe y no se deshace: va en el modo `descartable` (`R:25`), que no comparte datos con los otros recorridos (`WP:238`).
- R3 se queda donde está, en `RC`.

## 9. Tamaño

| Archivo | Líneas hoy | Qué le pasa **[estimo]** |
|---|---|---|
| `FO` | 250 | Se reescribe casi entero (85 %). Quedan el contexto, el 404 y los estados de la cuenta (`:36-93`, unas 60 líneas). Lo nuevo: la lista con sus vistas, unas 170; el detalle, unas 200 |
| `PE` | 248 | La lógica (`:37-131`, unas 95 líneas) queda, con unas 30 tocadas (qué viene elegido, cerrar, releer). El dibujo (`:133-247`, unas 115) se reescribe entero: unas 230 |
| `PGF` | 24 | Una clase |
| Nuevos | — | La función pura, unas 130 líneas, y su prueba, unas 170. El marco del área y la cáscara de la ayuda son compartidos (están contados en el plan de Antropometría) |
| `CSS` | 6.153 | Entran unas 300 líneas (renglones, detalle, tabla de respuestas, historia, cajón, pasos, tabla de preguntas). No sale nada: las clases de hoy son compartidas (`.historial`, `CSS:999`; `.datos`, `CSS:838`; `.insignia`, `CSS:868`; `.campo-de-plantilla`, que usa también `ADV\training\resumen.tsx:487`) |
| `COPF` | 148 | Unas 15 cadenas cambian o entran, todas del lado del profesional |
| `CP` | 239 | Unas 10 líneas: un bloque |
| `RC` | — | R3: unas 5 líneas |

Por pantalla **[estimo]**: la 26, unas 430 líneas nuevas o reescritas y 170 de estilos; la 27, unas 300 y 130 de estilos. Más 300 entre la función pura y su prueba. En total, cerca de 730 líneas de pantalla, 300 de estilos y 300 de pruebas, sin contar los recorridos. Es menos de la mitad de Antropometría.

## 10. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-I1 | Qué preguntas vienen elegidas al elegir un formulario | Ninguna, como hoy, con «Elegir todas» a un clic y la cuenta a la vista. La precarga ratificada (seis y cinco) sigue valiendo al llegar desde Entrenamiento. Generalizarla a todo formulario cambia una regla que el código atribuye al legajo: se registra como deuda y lo decide Dirección antes de programarlo | Todas elegidas, como la maqueta (C-73): es menos trabajo para el profesional y más datos pedidos por omisión |
| DEC-I2 | «Corrigió su respuesta», en la lista | No mostrarlo en el renglón por ahora: lo dice el detalle, a un clic. Pedir aparte la ampliación (3.1) | Leer el detalle de cada solicitud respondida al entrar: una lectura protegida por cada una, como hace Entrenamiento (`CIT:62-65`) |
| DEC-I3 | Las cantidades de las vistas | Leer la lista entera, de a 50, y contar en el navegador. Si quedan páginas, «50+» y «Ver más» | Vistas sin número |
| DEC-I4 | Una vista en cero | Se muestra con su cero: es una respuesta (como E-67 y E-84) | Ocultarla |
| DEC-I5 | Qué se ve al entrar, y dónde vive el detalle | Nada abierto: la lista a todo el ancho, hasta su tope. Al elegir, la lista queda en 520 px y el detalle al costado. La solicitud abierta es de la visita, no va a la URL (como el hecho elegido de la línea de tiempo y E-95) | Abrir la primera al entrar, como la maqueta: cuesta dos lecturas sin que nadie las pida |
| DEC-I6 | Qué hace `vista=pedir`, y a dónde lleva «Cerrar» | `vista=pedir` abre «Solicitudes» con el cajón encima. «Cerrar» deja `vista=solicitudes`, con su `volver`: la persona queda en Información y el marco le ofrece la vuelta (a la ficha o a Entrenamiento). Enviar vuelve a Entrenamiento si vino de ahí, como hoy | Que «Cerrar» devuelva directo a donde se vino: más corto, pero quien quería mirar las solicitudes tiene que entrar de nuevo |
| DEC-I7 | Después de enviar | El cajón se cierra, la lista se vuelve a leer y la página dice «Solicitud enviada.» con el enlace de vuelta. Vista «Todas», para que la nueva se vea | Dejar el cajón abierto con el aviso adentro |
| DEC-I8 | El área de un formulario sin área propia | Sin nada elegido («Elegí un área»); el envío espera. Se ofrecen las tres, como hoy | Dejar «Entrenamiento» elegida (`PE:44`), o mostrar solo las áreas con acceso |
| DEC-I9 | Las palabras | «Formulario», «pregunta», «área» y «requerida» en la pantalla y en los textos del profesional de `COPF`, incluidos los tres rechazos. Las claves, los enumerados y los parámetros no cambian (E-03). Los textos que comparte la APK no se tocan | Cambiar solo lo que dibuja la maqueta: quedan «Alcance» y «plantilla» en los mensajes de error |
| DEC-I10 | La nota de las requeridas | El texto de la maqueta, en el lugar del de hoy (`COPF:30`) | — |
| DEC-I11 | El texto de ayuda de cada pregunta | Un segundo renglón, más tenue, debajo de la pregunta | A pedido (un «ver más»): la tabla queda como la maqueta y se pierde de vista el rango de un número |
| DEC-I12 | Las citas internas de dos descripciones | La pantalla no las recorta. Va a 3.1 | Recortar en la pantalla el paréntesis final: es reescribir un dato |
| DEC-I13 | La historia | Cada versión en un renglón, como la maqueta, y a un clic, todo lo que se respondió en esa versión | Solo el renglón: se dejaría de ver lo que hoy se ve |
| DEC-I14 | Contra qué se dice «Corregida» y «Antes» | «Corregida», si lo que rige es distinto de lo que respondió al principio. «Antes», el último valor distinto, yendo hacia atrás por la cadena. Con una sola corrección es lo que dibuja la maqueta | Comparar solo con la versión inmediata anterior |
| DEC-I15 | La cadena que no se puede resolver | Decirlo en el lugar de la tabla, mostrar todas las versiones en la historia y no rotular ninguna «Vigente» | Dejar el defecto de hoy anotado |
| DEC-I16 | El marco de Información | Las áreas con su nombre y su estado. La barra de una sola pestaña se conserva, por igualdad con las otras áreas, con el ícono del área (`informacion`) | Como la maqueta: «Las tres áreas» y el ícono de «solicitar un vínculo» |
| DEC-I17 | Datos para ver las pantallas | En el escenario descartable, por la API: tres solicitudes en dos áreas, una respuesta y una corrección. Lo que cueste armar (muchas solicitudes, la cadena sin resolver), con una respuesta simulada, dicha como tal | Sumarlas al escenario principal: cambia los pendientes de los otros recorridos |
| DEC-I18 | Volver a Información después de iniciar sesión | Sumar la ruta a la lista de retorno y a su prueba: dos líneas (`LIB\copy.ts:24`; `SC\retorno-seguro.test.mjs:21-22`) | Dejarlo anotado como defecto de antes |
| DEC-I19 | «Respondió 1 de las 2 preguntas.» | Como está dibujada, y solo en la historia | Sacarla: lo dice la tabla, con «Antes: sin responder» |
| DEC-I20 | «Solicitar contexto» (ficha y Entrenamiento) y «Pedir información» (área): una acción con dos nombres (`CRIT:467`) | No tocarlo en este paquete: cambia el marco de la ficha, un texto del dominio de Entrenamiento (`DOM\copy-entrenamiento.ts:195`) y R3 (`RC:952`). Decidirlo aparte | Unificar ahora en «Pedir información» |

Las dos que más pesan son **DEC-I1** y **DEC-I6**.

## 11. Lo que no pude determinar leyendo

- **Cómo se ve.** Ningún alto ni ancho de lo nuevo está medido: salen de las medidas de la maqueta.
- **Cómo queda con textos largos:** un propósito de 300 caracteres en el renglón, una respuesta de hasta 2.000 (`CF:217`) en la tabla y un motivo de hasta 1.000 (`CF:218`) en la historia.
- **Si R3 falla como digo** con el cajón abierto. Lo deduzco de cómo hace clic; no lo corrí.
- **Si Entrenamiento dice algo al volver después de enviar.** No lo encontré.
- **Qué pasa de verdad al reenviar con otra selección después de un resultado incierto** (1.16): depende de cómo trate la API una clave repetida con otro cuerpo, que no leí.
- **Si la base de prueba desplegada tiene otros formularios** que los tres de las migraciones.
- **Cuánto tardan las lecturas** del detalle y de la plantilla.
- **Qué va a hacer con el marco del área** quien lleve Nutrición y Entrenamiento, y si acepta mudar `valorDeclarado`.
- **El lector de pantalla:** cómo anuncia una tabla con dos casillas por fila, y un cajón modal sobre una página con un detalle abierto.
- **Lo que dice el legajo** sobre elegir las preguntas una por una: leí la cita en el comentario del código, no el legajo.
- **Las imágenes de Azul noche** de las dos maquetas: no las abrí.
