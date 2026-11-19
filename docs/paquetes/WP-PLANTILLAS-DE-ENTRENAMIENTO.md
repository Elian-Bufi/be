# WP-PLANTILLAS-DE-ENTRENAMIENTO — crear y editar una plantilla de entrenamiento sin partir del plan de una persona

> **Lo que decidió Dirección (2026-11-19):** que un profesional pueda crear y editar una plantilla de plan de
> Entrenamiento desde «Mis plantillas», sin elegir a nadie: en blanco o desde una existente, con **el mismo núcleo del
> editor del plan**, autoguardado de lo que prepara, «Guardar plantilla» la primera vez y «Guardar nueva versión»
> después, con una revisión antes de guardar; editar la plantilla no toca los planes ya creados, y el plan que sale de
> ella dice el número de la versión que se aplicó. Quedan afuera, declarados como lo siguiente, el historial con
> diferencias, resolver conflictos con un diff y «usar una versión vieja como base».
>
> Rama `wp-plantillas-de-entrenamiento`, sobre `wp-entrenamiento-planificacion-2` (#292, con #291, #288 y #289 debajo).
> Registro en `docs/DEUDA_LEGAJO.md` (**DL-182**; la 180 es de `wp-nutricion-alimentos` y la 181, de
> `wp-entrenamiento-planificacion`). Las decisiones de continuador (**PLT-D01 a PLT-D18**) están **a ratificar**.
> La propuesta de ChatGPT del 2026-11-18 (flujo y guía visual) se verificó contra el código antes de seguirla: lo que se
> tomó, lo que no y por qué está en §3.

## 0. Lo que había

- **PF-09 (DL-108):** API-TPL-01 a 05. Una plantilla es un molde propio, sin persona, con versiones inmutables y un nombre
  único por profesional; las cargas sugeridas se copian solo con el interruptor (D-2). Se aplica con API-TRN-07 y
  `fromTemplateVersionId`; el plan registra `templateOrigin`, que solo lee el profesional.
- **«Mis plantillas»** (`/pro/templates`) consultaba, renombraba, describía, archivaba y reactivaba. La estructura solo se
  creaba desde el plan de una persona («Guardar como plantilla»). API-TPL-04 existía pero ninguna pantalla la usaba.
- **El editor del plan** (`advisees/training/editor.tsx`) dependía de la persona en todo su recorrido: la lectura
  (API-SER-01), el guardado (API-TRN-10), la revisión (API-TRN-11), la agenda, el asistente, activar, «Otras áreas», la
  fuerza estimada, «La vez pasada» y lo hecho en el buscador.
- **La nota de origen** del plan decía el número de la versión **vigente** de la plantilla en los dos casos del ternario
  (`plantillas.tsx`, la línea 137 que señaló la propuesta): con la plantilla en la versión 2, un plan creado desde la 1
  decía «versión 2». Lo mismo pasa en Nutrición (§6).

## 1. El alcance

| ID | Qué | Dónde |
| --- | --- | --- |
| PLT-01 | Crear una plantilla sin persona, en blanco («Nueva plantilla») | API-TPL-06 · `mis-plantillas.tsx` |
| PLT-02 | Crear una desde una existente («Crear otra desde esta»: una copia, con su nombre) | API-TPL-06 con `fromTemplateVersionId` |
| PLT-03 | Editar una existente: sus cambios en preparación («Editar» o «Retomar los cambios») | API-TPL-07 |
| PLT-04 | El mismo núcleo del editor: fases, sesiones, bloques «Seguido» y «En vueltas», ejercicios, series con calentamiento, criterio, escritura rápida, catálogo y presets | `editor.tsx` con `EditorDePlantilla` |
| PLT-05 | El autoguardado de lo preparado, con 409 y sin conflicto falso por una respuesta perdida (ED-61) | API-TPL-10 |
| PLT-06 | La revisión antes de guardar: lo que impide guardar y lo que queda para completar al usarla, sin reglas de una persona | API-TPL-11 · «Antes de guardar» |
| PLT-07 | «Guardar plantilla» (la versión 1) y «Guardar nueva versión» (la siguiente) | API-TPL-12 |
| PLT-08 | Descartar lo preparado: las versiones quedan como estaban | API-TPL-13 |
| PLT-09 | Lo que está en preparación, en la colección: una nueva «Sin título», y los cambios junto a su versión | API-TPL-08 |
| PLT-10 | El detalle: la estructura agrupada por fase, sesión y bloque, y las versiones con los planes que salieron de cada una | API-TPL-14 · `detalle-de-la-plantilla.tsx` |
| PLT-11 | Editar la plantilla no toca los planes ya creados | prueba de integración |
| PLT-12 | El plan dice el número de la versión que se aplicó, el correcto | `plantillas.tsx` (`NotaDeOrigen`) |
| PLT-13 | Lo que depende de una persona no aparece en el editor de la plantilla | `editor.tsx`, `entrenamiento.tsx` |
| PLT-14 | La plantilla es del profesional: lo ajeno es 404, igual que lo inexistente; un asesorado o un profesional de otra área, 403 | API |
| PLT-15 | Escrituras simultáneas: la base las ordena, una sola pasa y el resto es 409 | API |

## 2. El modelo y las operaciones

**La preparación** (`preparacion_de_plantilla_de_entrenamiento`, migración `20261119180000_…`, escrita con
`prisma migrate diff`; solo agrega una tabla, dos índices y tres claves foráneas):

```text
PreparacionDePlantillaDeEntrenamiento
  profesionalId                     ← de quién es; nadie más la ve
  plantillaId?   (único)            ← NULL: una plantilla nueva, que nace al guardarla
  versionBaseId?                    ← la versión vigente al abrirla; guardar exige que lo siga siendo
  nombre?, descripcion?             ← solo en una nueva (PLT-D05)
  estructura (JSONB)                ← la de entrada, normalizada y con los identificadores que pone el servidor
  cargas  NO_COPIADAS | COPIADAS    ← el interruptor de D-2 (DL-108)
  version                           ← el token de concurrencia (expectedVersion)
  procedencia, momentos
```

Las versiones siguen siendo `version_de_plantilla_de_plan_de_entrenamiento`, inmutables. Guardar usa las mismas
escrituras que API-TPL-01 y 04 (`crearConSuPrimeraVersion` y `agregarVersion` en `plantillas.service.ts`, que esas dos
operaciones ahora llaman sin cambiar su orden ni sus respuestas) y borra la preparación.

**Las nueve operaciones nuevas** (familia TPL de DL-108; aditivas: ninguna de antes cambia de forma):

| ID | Método y ruta | Qué |
| --- | --- | --- |
| API-TPL-06 | `POST /training/plan-template-drafts` | Una plantilla nueva: en blanco o copia de una versión propia. 201 |
| API-TPL-07 | `PUT /training/plan-templates/{templateId}/draft` | Editar una existente: abre su preparación (201) o devuelve la que ya hay (200). Archivada: 422 |
| API-TPL-08 | `GET /training/plan-template-drafts` | Lo que está en preparación |
| API-TPL-09 | `GET /training/plan-template-drafts/{draftId}` | Una preparación, con la estructura, el nombre vigente, la disponibilidad y la imagen de cada ejercicio |
| API-TPL-10 | `PATCH /training/plan-template-drafts/{draftId}` | El autoguardado; sin Idempotency-Key, con `expectedVersion`; el límite de cuerpo de los planes (700 KB) |
| API-TPL-11 | `POST /training/plan-template-drafts/{draftId}/review` | La revisión: `issues` (impide) y `toComplete` (para completar al usarla). 200 aunque no sea válida |
| API-TPL-12 | `POST /training/plan-template-drafts/{draftId}/publish` | Guardar: la plantilla o la versión siguiente. 201; 422 `OPERATION_NOT_READY`, 409 `TEMPLATE_NAME_TAKEN` o `VERSION_CONFLICT` |
| API-TPL-13 | `POST /training/plan-template-drafts/{draftId}/discard` | Descartar lo preparado |
| API-TPL-14 | `GET /training/plan-templates/{templateId}/versions` | Las versiones, con cuántos planes salieron de cada una |

Las reglas puras viven en `packages/domain/src/preparacion-de-plantilla.ts` (lo que impide guardar, lo que queda para
completar, sin cambios frente a la base, las cargas escritas), con su prueba. El OpenAPI suma las nueve (Entrenamiento
pasa de 66 a 75 operaciones, `contratos-wp06.test.ts`), y TEST-CT las observa a todas (`contrato.int-spec.ts`).

**La APK** recibe exactamente lo de antes: ninguna operación que lee cambió, las plantillas no llegan a la persona y no
hay capacidad nueva (PLT-D18). Además, Dirección aclaró el 2026-11-19 que no hace falta compatibilidad con APK viejas.

## 3. Decisiones de continuador (PLT-D01 a PLT-D18, a ratificar)

**A. La frontera**
- **PLT-D01 · Un solo editor, que recibe qué edita.** `EditorDePlan` recibe `plantilla` (`EdicionDePlantilla`: la
  preparación y qué hacer al guardarla o descartarla); `EditorDePlantilla` es ese mismo editor con la plantilla. Lo
  guardado (`LoGuardado`, en `lo-que-se-edita.ts`) es la versión del plan o la preparación, y las cuatro acciones que
  cambian (leer, guardar, revisar, y guardar como plantilla o activar) van a su operación. El núcleo no se copió. El
  editor del plan quedó igual en comportamiento: sus 638 pruebas siguen en verde **sin tocar ninguna** (las líneas que
  vigilan se conservaron tal cual), y sus quince escenas de capturas siguen en la misma corrida.
- **PLT-D02 · Lo preparado aparte de las versiones.** El autoguardado no toca ninguna versión: la vigente sigue
  disponible para aplicarse mientras se preparan cambios. Solo «Guardar» crea una versión.
- **PLT-D03 · La preparación se borra al guardarse o descartarse.** No es historia: la historia son las versiones
  (inmutables) y la auditoría de cada operación. Así alcanza un índice único común (PostgreSQL no compara los NULL) y la
  migración es la que escribe `prisma migrate diff`, sin un índice parcial a mano.
- **PLT-D04 · Una preparación por plantilla.** «Editar» abre o retoma (`PUT`, 201 o 200, como API-TRN-15): un segundo
  toque, u otra pestaña, da la misma; la plantilla bloqueada ordena dos a la vez. Las nuevas pueden ser varias.
- **PLT-D05 · El nombre y la descripción.** En una nueva se escriben en el editor y viajan con lo preparado; se exigen al
  guardar. En una existente son de la plantilla y se cambian en «Mis plantillas», sin crear versión (API-TPL-05):
  mandarlos con los cambios es 422. Así un nombre cambiado en el detalle no lo pisa una preparación vieja.

**B. Las reglas**
- **PLT-D06 · El autoguardado valida como el borrador de un plan** (forma, criterios, ejercicios que se pueden citar:
  422 con su lugar), pero **conserva un ejercicio que se retiró** del catálogo: lo dice la revisión y no se guarda como
  versión hasta cambiarlo. Antes, en el plan, ese guardado se rechazaba y lo escrito quedaba sin guardar.
- **PLT-D07 · «Desde una existente» es una copia:** otra plantilla, que nace como nueva con el nombre «X · copia» y sus
  cargas; no registra origen (el origen de una plantilla es un plan, DL-108). Una archivada se copia; editarla no (se
  reactiva antes, como para aplicarla).
- **PLT-D08 · Lo que impide guardar** es poco y no depende de ninguna persona: el nombre de una nueva, un nombre tomado,
  **ninguna sesión en toda la plantilla** (la propuesta lo sugería «como regla nueva»; se adoptó: una plantilla sin
  sesiones no sirve de base), un ejercicio que no se puede usar y una plantilla archivada. Cada cosa con su lugar; el
  nombre lleva a su campo.
- **PLT-D09 · Lo incompleto de un plan no impide guardar una plantilla:** una fase sin sesiones, una sesión sin
  ejercicios, un bloque vacío o «En vueltas» con uno solo quedan «para completar al usarla con una persona». Las reglas
  para activar siguen en el plan de cada persona, sin cambios.
- **PLT-D10 · Sin cambios no hay versión nueva** (`TEMPLATE_UNCHANGED`): la forma canónica, con el interruptor de las
  cargas, igual a la de la versión de base.
- **PLT-D11 · Las versiones dicen cuántos planes salieron de cada una**, en preparación o activados (no los descartados),
  sin nombrar a nadie: la plantilla no lleva personas, y nombrarlas pediría la decisión del PDP de cada una. Es el dato
  que ya existía (`origen_de_plantilla`).
- **PLT-D12 · Lo que depende de una persona no aparece** en el editor de la plantilla: los días (una línea dice que se
  eligen en el plan de cada persona), «Próximas fechas», el asistente, activar, «Otras áreas», el contexto de la persona
  (DL-179, que vive en el marco del área), la fuerza estimada, «La vez pasada» y lo hecho en el buscador. Se eligió
  sacarlos (no mostrarlos apagados): en una plantilla no hay a quién se refieren.
- **PLT-D13 · La revisión es un cuadro, «Antes de guardar»,** como «Antes de activar» en el plan: el mismo gesto en los
  dos editores, con «Ir a corregir» y «Volver a la revisión». Dice lo que impide, lo que queda para completar, **lo que
  cambia frente a la versión de la que partió** (con la regla de «Antes de activar») y qué queda guardado. Un solo
  principal: «Guardar plantilla» o «Guardar nueva versión», apagado con su motivo.
- **PLT-D14 · Las cargas (D-2 de DL-108):** lo preparado guarda lo que se escribió; el interruptor, apagado por omisión,
  decide qué va a la versión. La cabecera y «Antes de guardar» dicen cuántos ejercicios tienen una carga escrita y si va
  o no; lo que cambia frente a la base se compara con las cargas que irían.

**C. La colección, el detalle y aplicar**
- **PLT-D15 · El número de la versión aplicada.** La nota de origen lo lee de las versiones (API-TPL-14) por su
  `templateVersionId`; si no la encuentra, dice el nombre solo. «Empezar desde una plantilla» dice qué versión se aplica:
  la vigente.
- **PLT-D16 · «Nueva plantilla» crea la preparación al tocarlo.** La propuesta la creaba con la primera modificación;
  eso pedía un editor que funcione sin nada guardado. Lo vacío queda como «Sin título · en preparación», con «Retomar», y
  se descarta desde el editor.
- **PLT-D17 · Dónde vive cada cosa.** El editor, en `/pro/templates/training?preparacion=…` (lo que se mira, en la
  dirección, como en el plan; el retorno tras el login lo conoce). El detalle sigue en «Mis plantillas», el de siempre,
  con la estructura agrupada y las versiones; no una página aparte. Guardar vuelve ahí con la plantilla abierta y el aviso.
- **PLT-D18 · La APK no cambia** y las plantillas no llegan a la persona (§2).

**Lo que la propuesta pedía y no se hizo** (declarado como lo siguiente, salvo lo marcado): el historial con
diferencias; resolver un conflicto con un diff (hoy, como en el plan, «Cargar la versión guardada»); «usar una versión
vieja como base»; «Usar con una persona» desde el detalle con un selector de persona (hoy, una línea dice dónde se hace);
la búsqueda y los filtros de la colección; «Guardar como plantilla» desde el plan de una persona hacia una preparación
(sigue como estaba: crea la plantilla directo).

## 4. Las reglas, y dónde se prueban

| Regla | Prueba |
| --- | --- |
| Lo que impide guardar, lo que queda para completar, sin cambios, las cargas escritas; el contrato y el OpenAPI | `packages/domain/src/preparacion-de-plantilla.test.ts` · `contratos-wp06.test.ts` (75) |
| Crear, autoguardar (identificadores estables), revisar, guardar (versión 1 y 2), descartar, copiar | `test/integration/plantillas-independientes.int-spec.ts` |
| Editar no toca la versión 1 ni el plan creado desde ella; las versiones cuentan los planes | ídem |
| Archivada (422), base cambiada (409), nombre tomado (409), ejercicio retirado (se conserva, 422 al guardar) | ídem |
| Lo ajeno es 404 con el mismo cuerpo que lo inexistente; asesorado y profesional de otra área, 403 | ídem |
| Cuatro autoguardados y cuatro «Guardar» a la vez: uno solo; dos «Editar» a la vez: la misma preparación (con barrera, sin pausas) | ídem |
| Cada operación observada y declarada | `test/integration/contrato.int-spec.ts` (TEST-CT) |
| El límite de cuerpo del autoguardado | `apps/api/src/http/limite-de-cuerpo.spec.ts` |
| La frontera, lo que no aparece sin persona, el nombre y las cargas, ED-61, «Antes de guardar», la colección, el detalle y la nota de origen | `apps/web/test/plantillas-de-entrenamiento.test.mjs` |
| El editor del plan, sin cambios | las 638 pruebas del website, sin tocar ninguna |

**Las mutaciones del website** (cada una dejó en rojo `plantillas-de-entrenamiento.test.mjs`; se restauró el archivo):
guardar sin ir a la preparación; los días en la plantilla; el buscador pidiendo lo de la persona; el ejercicio del
catálogo pasado sin persona; el nombre mandado en una existente; las cargas que irían sin el interruptor; los metadatos
fuera de la huella de ED-61; lo que impide fuera del motivo del principal; «Editar» en una archivada; «Sin objetivo» en
el detalle; la nota de origen con la vigente.

## 5. Cómo se ve

Las capturas salen de la CI (`.github/workflows/capturas-de-la-planificacion.yml`, que ahora corre también en esta rama y
con los cambios de `/pro/templates`), con la herramienta de Entrenamiento: a las quince escenas del plan se suman la
16 (la colección con lo que está en preparación), la 17 (una plantilla nueva en blanco), la 18 (el editor de la
plantilla, con su bloque en vueltas), la 19 («Antes de guardar», con lo que cambia frente a la versión 1), la 20 (el
detalle con sus versiones, después de guardar la 2) y la 21 (el plan de Diego Sosa creado desde la versión 1, que dice
«versión 1»), en Claro y Azul noche, a 1280 × 800, 1536 × 730 y 1920 × 950. Cada escena verifica lo que tiene que verse
(nada de una persona en el editor de la plantilla, «Sin título», la versión aplicada, los planes de cada versión).

## 6. Lo que queda abierto

- **Ratificar PLT-D01 a PLT-D18.**
- **Lo siguiente, declarado:** el historial con diferencias, el conflicto con un diff y «usar una versión vieja como base».
- **Fuera del paquete (media):** la nota de origen del plan de **Nutrición** (`NotaDeOrigenNutricional`) tiene el mismo
  error que tenía la de Entrenamiento: dice el número de la versión vigente. El arreglo es el mismo, con una lectura de
  versiones que Nutrición todavía no tiene.
- **Prueba manual pendiente:** el editor de la plantilla con el teclado y un lector de pantalla, y una prueba con
  profesionales que no conocen la función (la que propuso ChatGPT: crear, dejar a medias, retomar, guardar y hacer una
  variante).

## 7. La revisión adversaria (2026-11-19)

**Corregido en la rama**, cada cosa con una prueba que queda en rojo sin el arreglo:
- **«Sin cambios» (PLT-D10) no se cumplía con una plantilla guardada como llegó** (media). API-TPL-01 y 04 guardan la
  estructura tal como llega (sin los campos omitidos y, a veces, sin el identificador de una fase o de un ejercicio); la
  preparación la guarda normalizada y con los identificadores que pone el servidor. Comparadas tal cual, una plantilla
  hecha con «Guardar como plantilla» podía no quedar nunca «sin cambios», y «Guardar nueva versión» sin tocar nada
  creaba una versión igual. Ahora las dos se normalizan y se comparan sin los identificadores de nodo
  (`sinCambiosFrenteALaBase`); un cambio real (repeticiones, calentamiento, un ejercicio, una fase, un bloque «En
  vueltas») sigue siéndolo. Prueba del dominio y de integración (API-TPL-01 → revisar y guardar: `TEMPLATE_UNCHANGED`).
- **El detalle con sus versiones ocupaba una columna angosta** a 1920 (pedido de Dirección): con una plantilla abierta,
  la sección toma el ancho de «Plantillas y habituales» y el detalle se reparte en dos: la estructura a la izquierda; las
  versiones, «Usar con una persona», el nombre y la descripción a la derecha.
- **El propósito del plan de Diego en el editor de la plantilla** (escena 18). En el producto, lo único que lleva el plan
  de una persona a una plantilla es «Guardar como plantilla», que muestra cada nota de texto libre (propósitos,
  instrucciones, notas) para confirmarla o vaciarla (D-3 de DL-108), y las cargas no van sin el interruptor (D-2). La
  herramienta de capturas armaba la plantilla por la API, sin ese paso: ahora vacía las notas como lo haría el
  profesional, y la escena 18 verifica que ninguna nota del plan de Diego aparezca en el editor.
- **El aviso al salir** decía «el plan en preparación» en la plantilla: ahora dice «la plantilla». La prueba que lo
  vigila mira cada texto en su editor (el de Nutrición sigue tal cual).
- **El panel de la plantilla era una pestaña sin pestañas** (`role="tabpanel"` con un rótulo que apuntaba a un elemento
  que no está): en la plantilla se rotula solo.

**Lo que queda, de severidad baja:**
- **Lo que D-3 no muestra** (fuera del paquete, de DL-108): los parámetros del profesional de cada ejercicio, la
  referencia del %RM y los nombres (de fases, sesiones y bloques) viajan a la plantilla sin pasar por la lista de notas.
  Un nombre como «Diego · piernas» llegaría a la plantilla. Propuesta: sumarlos a la lista de «Guardar como plantilla».
- **«Lo que cambia» en «Antes de guardar»** compara por identificador: con una versión de base guardada sin
  identificadores (vieja, o mandada así por la API), lo que no los tenía aparece como quitado y agregado, aunque la API
  diga «sin cambios». Con lo que guarda el website casi no pasa (manda los identificadores del plan).
- **Las preparaciones nuevas que nunca se guardan quedan** hasta que su profesional las descarta: no vencen. Solo las
  ve y las lista su profesional (API-TPL-08), y se descartan desde el editor.
- **En el editor de la plantilla, un lugar sin estructura dice «Plan»** (el nombre, «ninguna sesión»): diría «Plantilla».
- **El pie de la galería de presets** dice «Se escribe en el borrador: la persona no ve nada» también en la plantilla.
- **Un 404 de cualquier pedido del editor** (por ejemplo, resolver un candidato de wger vencido) se lee como «lo
  preparado ya no está», como el plan lo lee como «sin acceso». Es la regla de siempre, ahora también acá.
