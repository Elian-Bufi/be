# WP-EDITORES-PROFESIONAL — crear con un asistente, editar en una estación de trabajo

> **Estado:** DECLARADO el 2026-11-11, solo documentación. Espera el sí de Dirección al alcance (las partes ED-00 a
> ED-58), a las decisiones ED-D1 a ED-D16 y a las maquetas, antes de programar (ACTA-DIR-034). Las decisiones de
> producto se registran en DEUDA_LEGAJO **DL-167**.
>
> **Encargo** (Dirección, 2026-11-11):
> - Que los editores del website sean «aptos para cualquiera, con las funciones de un profesional de alto nivel»; «menos
>   scroll»; «cada pantalla lleva a acciones claras».
> - Ante la auditoría de UX de los editores: «todo el rediseño antes de congelar la app el 25/11».
> - El mismo día, una dirección de diseño: «hacé intuitiva la creación de planes, que sean pequeñas pantallas o cuadros
>   cuando aparece mucha información, que sea un flujo de pantallas y cuadros para tomar decisiones, y que la carga de
>   presets sea fácil de usar e intuitiva».
>
> **Fuentes:**
> - la auditoría de UX del website profesional (ChatGPT, 2026-11-11), con 74 posiciones (A01-A32, B01-B28, C01-C14);
> - las correcciones de Claude a esa auditoría (§4);
> - las capturas de la corrida del 2026-11-10 (`92c7c6c`, 1440 × 900, Azul noche), hechas con
>   `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/flujos-de-planificacion.mjs`, que vive en la rama
>   `wp-tablero-flujos-capturas`;
> - el código de `main` `bb757d9`.
>
> La auditoría y las capturas no están en el repo; lo que hace falta de ellas está acá. Las maquetas están fuera del repo,
> en la página «Editores del profesional» de Dirección.
>
> **Esta declaración:** rama `wp-editores-profesional`, desde `main` `bb757d9`. No toca código ni migraciones.

## 0. Legajo y decisiones que cita

- **04:** RF-030 y RF-039 a RF-041 (diseñar, validar y activar los planes); RNF-ACC-001 (accesibilidad).
- **05:**
  - UC-P10, UC-P11, UC-P15 y UC-P16 (diseñar, validar y activar), con UC-I04 (la instantánea al activar);
  - UC-P13 y UC-P18 (revisar), con UC-I05 y UC-I06 (registrar la revisión y aplicar la próxima acción);
  - UC-P32 y UC-P33 (pedir información y responderla);
  - el glosario, «Borrador de plan» (una versión que no se presenta a la persona como plan vigente).
- **06:**
  - REG-06-119 y REG-06-120 (las modalidades de prescripción: el plato armado y las porciones de intercambio);
  - REG-06-123 (el objetivo nutricional, versionado) e INV-06-133 (BE no calcula el requerimiento);
  - REG-06-126 (el microciclo, opcional) e INV-06-143 (la periodización es del profesional);
  - REG-06-145 (la próxima revisión, explícita);
  - REG-06-158 (mostrar no redondea en silencio).
- **08:** §11 (cada profesional ve la porción de sus alcances); C-11 y C-12 (el consentimiento); §27.3 (sin caché de
  autorización); §29 (la auditoría).
- **09:** los contratos de los planes (API-TRN-07 a 14 y API-NUT-07 a 12); API-SER-01 y 02 (los objetivos por serie y
  la capacidad del cliente); API-FRM-01 a 03 (pedir información).
- **10:**
  - B10-04 (vínculo, consentimiento y privacidad);
  - B10-05 (Nutrición);
  - B10-06 (Entrenamiento: el plan nace de un objetivo vigente, y el objetivo, de una evaluación);
  - B10-10 (accesibilidad, textos y diseño adaptable).
- **11A:** TEST-PRJ-009 (nada califica). Los oráculos nuevos son TEST-EDP-001 a 046 (§5.6).
- **DL:**
  - DL-091 (los números en rioplatense) y DL-108, DL-109 y DL-119 (plantillas, habituales y recetas);
  - DL-122 (las capacidades del cliente), DL-131 (las preguntas vienen marcadas) y DL-137 D-7 (lo nuevo va en
    operaciones nuevas);
  - DL-145, DL-146 y DL-148 («Empezar el plan», las ayudas y los borradores con autoguardado);
  - DL-152 (lo que leen las APK instaladas no cambia);
  - DL-163, con D-17 a D-21 y las partes TB-38, TB-39, TB-41, TB-43, TB-46, TB-47 y TB-48 de WP-TABLERO-ALTA-GAMA;
  - DL-164 y DL-165 (los formularios de inicio) y DL-166 PV-4 (la regla de los desplegables);
  - **DL-167, nueva**, con este paquete.
- **La guía:** `docs/ux/GUIA-UX-UI.md`. Suma dos pautas (ED-10 y ED-14): el cuadro enfocado y el asistente.

## 1. Objetivo y demostrables

Que cualquier profesional cree un plan en pocos pasos claros, y que uno de alto nivel lo ajuste rápido, sin perder de
vista qué versión edita, qué ve la persona, qué falta y cómo volver atrás. La frase para el tribunal: «crear es una
decisión por cuadro; editar es una mesa de trabajo; activar sigue siendo un acto del profesional».

| Qué | Hoy (capturas del 2026-11-10) | Al cerrar el paquete |
|---|---|---|
| Cambiar el plan de Entrenamiento y activarlo (flujo A) | 26 clics del camino, 14 pasos; páginas de hasta 2,7 pantallas (la agenda) | 14 a 18 clics en la estación; ninguna zona de edición pasa de 1,5 pantallas |
| Cambiar el plan de Nutrición y activarlo (flujo B) | 39 clics del camino; la receta obliga a salir del plan y volver con 4 clics | 20 a 25 clics; la receta se crea en un cuadro y vuelve sola a la comida |
| Crear el primer plan | «Empezar el plan» ordena la evaluación y el objetivo; después, un editor largo | Un asistente de 7 pasos, en cuadros, con presets que se aplican con un clic |
| Pedir información (C11 a C13) | 4 clics hasta el panel; el panel mide 10,2 pantallas y tiene 107 controles | 1 clic desde la ficha; el cuadro entra en una pantalla, con las partes plegadas y contadas |
| Un borrador que no sirve | No se puede descartar: traba otra versión y las plantillas | «Descartar la versión en preparación», con confirmación |
| Salir del editor con cambios | Recargar avisa; un enlace interno (por ejemplo «Mis recetas») no avisa | Guarda antes de salir o pregunta |
| Los totales de Nutrición | No existen: solo el objetivo general | La estimación de cada opción al instante y, si Dirección lo decide, un día de referencia |
| Activar | La imposibilidad aparece después de abrir la confirmación; la app de la persona, al final | «Antes de activar» dice todo antes: lo que cambia, lo que ve la persona, su app y la fecha |

## 2. La arquitectura: crear con el asistente, editar en la estación

**Simple por defecto, potente cuando hace falta.** Hay dos caminos sobre el mismo borrador y las mismas operaciones de
hoy:
- **el asistente**, para crear un plan y para quien empieza;
- **la estación**, para ajustar un plan ya creado, para revisar y para el experto.

Comparten las piezas: el cuadro enfocado, el buscador, la planilla de series, la opción con sus totales y la galería de
presets. Ningún camino escribe algo que el otro no pueda abrir.

### 2.1 El asistente (crear)

Una decisión por paso, en cuadros, con «Paso N de 7», el nombre del paso y los pasos siguientes a la vista. Abajo, una
sola acción principal («Siguiente: Ejercicios») y «Atrás».

- **El borrador se crea en el paso 1** con la operación de hoy (copiar el vigente, desde una plantilla o en blanco), y se
  guarda solo entre pasos:
  - «Siguiente» guarda y espera la respuesta del servidor. Si falla, el paso queda abierto con el error y
    «Reintentar»;
  - dentro de un paso sigue el autoguardado de DL-148.
- **Volver atrás no pierde nada:** cada paso se lee del borrador guardado. Cambiar el punto de partida después del paso
  1 reemplaza lo armado: pide confirmación, descarta el borrador (TB-47) y crea otro.
- **Retomar:** el asistente no guarda en qué paso quedó. El paso que sigue se deduce de lo que tiene el borrador (sin
  sesiones, paso 2; con sesiones sin ejercicios, paso 3…), y la ficha ofrece «Seguir con el asistente · paso 4 de 7».
- **La regla de B10-06 queda:** el plan nace de un objetivo vigente, y el objetivo, de una evaluación. Si falta alguno,
  el asistente empieza por ahí, con la pieza «Empezar el plan» de hoy (DL-145).

| Paso | Entrenamiento | Nutrición |
|---|---|---|
| 1 | **Punto de partida**, en tarjetas grandes y sin nada elegido: «Copiar el plan vigente», «Desde una plantilla», «Desde un preset», «En blanco» | Lo mismo |
| 2 | **Estructura:** cuántas sesiones y sus nombres; un preset de estructura («Torso / Piernas · 4 días») las escribe | **Objetivo:** el vigente, o una versión nueva con un preset de reparto de macros (ED-30) |
| 3 | **Ejercicios por sesión:** el buscador en un cuadro, eligiendo varios a la vez; una sesión habitual se suma con un clic | **Tipos de día:** uno o «Entrenamiento y descanso», con sus días de la semana si Dirección habilita TB-41 |
| 4 | **Prescripción con un preset** («Hipertrofia 4×8-12 RIR 2», «Fuerza 5×5», «Resistencia 3×15» o uno propio), editable después | **Comidas,** con presets de estructura del día («4 comidas», «5 con colación») y las comidas habituales |
| 5 | **Días de la semana** de cada sesión | **Opciones y alimentos,** en un cuadro por opción, con los totales al instante |
| 6 | **Revisar:** lo que impide activar y lo que queda sin completar, cada cosa con su lugar | Lo mismo |
| 7 | **Activar:** el cuadro «Antes de activar» (ED-07) | Lo mismo |

### 2.2 La estación de tres zonas (editar) — Alternativa B de la auditoría

A 1440 × 900:
- **El marco del área, en una fila:** volver, el nombre de la persona y el área, las secciones y el acceso.
- **La barra de comandos, fija:**
  - la versión («Versión 9 · en preparación · Diego no la ve») y el selector con la activa;
  - el estado de guardado (ED-03);
  - «Revisar», la acción principal del momento («Guardar» con cambios, «Activar…» sin ellos) y «⋯» («Guardar como
    plantilla», «Guardar como preset», «Comparar con la vigente», «Rehacer con el asistente», «Descartar la versión en
    preparación»).
- **Tres zonas**, cada una con su propio desplazamiento y solo si hace falta (la página no se desplaza):
  - **izquierda (~240 px), la estructura:** en Entrenamiento, el bloque, las semanas, las sesiones con su día y los
    ejercicios de la elegida; en Nutrición, los días tipo con sus días, las comidas y las opciones;
  - **centro, lo elegido:** la planilla de la sesión o la tabla de la opción;
  - **derecha (~320 px), el contexto, en pestañas:** «Antes de activar», en vivo; «Lo que trabaja la semana» o «Rangos
    y totales»; y «Otras áreas», si la persona las comparte (TB-54).

**A 1280 × 800**, la derecha pasa a un panel que se abre con «Panel» y se superpone al centro, sin achicar las celdas, y
la izquierda baja a 200 px. **A 1920 × 1080** (el monitor de Dirección), el centro gana el ancho: la estación llega a
1840 px y no se corta en 1600 como la ficha. Lo que se ve primero no cambia con el ancho.

### 2.3 El cuadro enfocado

Cuando aparece mucha información, va en un cuadro (un diálogo o un panel lateral) y no en la página:
- el detalle de una serie;
- una receta;
- el buscador de ejercicios o de alimentos;
- una opción en el asistente;
- la galería de presets;
- «Antes de activar»;
- pedir información.

Las reglas:
- **un solo botón principal por cuadro;**
- el título dice qué se decide;
- Escape y «Cancelar» no escriben nada;
- el foco entra al título y vuelve adonde estaba;
- si el cuadro tiene cambios, cerrarlo pregunta;
- un cuadro no abre otro cuadro encima. El paso siguiente reemplaza al anterior en el mismo cuadro, con «Atrás».

### 2.4 Los presets: qué se reusa y qué es nuevo

**Un preset es un punto de partida que el profesional aplica con un clic y ajusta después.** BE no lo aplica solo ni
lo propone para una persona. Un preset aplicado escribe valores en el borrador, que se ven y se cambian como cualquier
otro, y no queda una regla guardada. La galería (ED-11) los muestra juntos, con su vista previa, en dos grupos: «De BE»
y «Tuyos».

| Tipo de preset | De BE (nuevo, contenido estático versionado en el dominio) | Tuyos | ¿Modelo nuevo? |
|---|---|---|---|
| Plan entero (Entrenamiento) | — | **Plantillas de plan** (TPL, DL-108): ya existen | No: se reusa |
| Estructura (sesiones o días) | «Cuerpo entero · 3 días», «Torso / Piernas · 4 días», «Empuje / Tirón / Piernas» (solo nombres y días sugeridos) | Una plantilla de plan sin ejercicios (TPL) | No; falta verificar al programar que TPL acepta sesiones vacías (TA-) |
| Sesión con ejercicios | — (BE no elige ejercicios: ED-D2) | **Sesiones habituales** (HAB, DL-109): ya existen | No |
| Ejercicio | — | **Ejercicios habituales** (HAB): ya existen | No |
| Prescripción (series × repeticiones, RIR, descanso) | «Hipertrofia 4×8-12 · RIR 2 · 90 s», «Fuerza 5×5 · RIR 2 · 3 min», «Resistencia 3×15 · RIR 3 · 45 s», «Técnica 3×8 · RIR 4» (sin cargas) | **Prescripciones habituales** | **Sí:** ED-13 (API-HAB-06 a 08, una tabla) |
| Plan entero (Nutrición) | — | **Plantillas de plan** (TPN, DL-108): ya existen | No |
| Reparto de macros del objetivo | «Equilibrado 50/20/30», «Más proteína 40/30/30», «Menos carbohidratos 30/30/40» (en % de las kcal que escribe el profesional) | **Repartos habituales** | **Sí:** ED-13 (API-HAN-06 a 08, una tabla) |
| Tipos de día | «Un solo día tipo», «Entrenamiento y descanso» (nombres) | Una plantilla de plan (TPN) | No |
| Estructura del día («comida tipo») | «4 comidas», «5 comidas con colación», «6 comidas» (nombres, con la opción 1 vacía) | **Comidas habituales** (HAN, DL-109): ya existen, con sus alimentos | No |
| Alimento | — | **Alimentos habituales** (HAN): ya existen | No |
| Preparación | — | **Mis recetas** (REC, DL-119): ya existen, con sus versiones | No |

**Lo que no se duplica:**
- «Guardar como preset» guarda en lo que ya existe (una plantilla, una sesión habitual, una comida habitual o una
  receta), y solo suma dos modelos chicos: la prescripción habitual y el reparto habitual;
- «Mis habituales» y «Mis plantillas» siguen siendo las bibliotecas. La galería es la forma de elegir dentro del editor
  y del asistente, no un tercer lugar donde se guardan cosas.

### 2.5 Simple por defecto, potente cuando hace falta

| Para quien empieza | Para el experto (se suma, nunca hace falta) |
|---|---|
| El asistente, de a un paso | La estación, con su planilla |
| Presets en tarjetas | La prescripción en una línea: «4×8-12 RIR 2 · 60 kg · 90 s» (ED-22) |
| Un ejercicio o un alimento por vez | Elegir varios a la vez (ED-21) |
| Botones con nombre | Atajos a la vista en «Atajos»: Ctrl+K (buscar), Ctrl+S (guardar), Ctrl+D (copiar hacia abajo), flechas, Enter y Escape (ED-54) |
| Ayuda de primer uso, que se cierra | «Vista planilla» como preferencia (ED-54) y progresión por semana (ED-50) |

## 3. Lo que no se rompe

- **Versión privada → revisar → activar con confirmación, e historial.** El plan vigente es de solo lectura; se cambia
  con una versión nueva que la persona no ve hasta activarla. Guardar no activa, y cada versión activada queda en el
  historial con su instantánea (UC-I04).
- **«Revisar» no juzga la calidad:** dice lo que impide activar y lo que queda sin completar, sin evaluar el programa
  ni la dieta.
- **«¿Cuándo la revisás?» no cambia,** con «Sin fecha por ahora» incluida (REG-06-145 y TB-15): es una regla vigente,
  no un defecto (§4).
- **Lo que lee una APK instalada no cambia** (DL-152). Ninguna parte suma un campo ni un valor a lo que leen; lo
  nuevo va en operaciones nuevas (DL-137 D-7).
- **Sin «cumplimiento», «adherencia» ni «racha»,** tampoco en negación (B05 del encargo del 23/10). **El cuerpo no se
  califica:** ningún color dice bien o mal; lo que cae fuera de un rango se dice con palabras.
- **BE no calcula el requerimiento** (INV-06-133) **ni escribe por su cuenta:** los presets y las ayudas (escalar,
  progresión, copiar) escriben solo cuando el profesional las toca, con vista previa.
- **Un hueco no es un cero:** «Sin dato» nombra qué falta (`SUM_SOURCE_PER_100G_V1`).
- **Nada viene elegido** en una decisión del profesional (el punto de partida, la fecha, las preguntas obligatorias que
  la plantilla no sugiere).
- **Las preguntas de un pedido vienen todas marcadas** (DL-131): compactar el cuadro no cambia qué se pide ni el
  consentimiento.

## 4. Lo que dice la auditoría y lo que verificamos

**Las correcciones de Claude, obligatorias:**
- **A21, «Sin fecha por ahora», no es un defecto.** Es la regla vigente (REG-06-145 y TB-15). La pregunta 1 de la §12
  de la auditoría no se toma.
- **B28 (no se guarda una versión con un día duplicado)** tiene causa probable en el límite de 16 KB por pedido de la API
  (`apps/api/src/bootstrap.ts:11`, `LIMITE_DE_CUERPO = '16kb'`): el comentario de la segunda corrida lo vio rechazado en
  el parser, con un 400 sin ruta. Lo arregla otro carril. Acá solo se diseña cómo se ve un error al guardar (ED-03).
- **Descartar el borrador:** la API existe (API-PLE-05 y API-PLN-07, TB-47, integradas el 2026-11-07), y el cliente
  también (`cliente-http.ts:915` y `:1237`). Falta el website (ED-01).
- **A17, el bloqueo de «Activar» por la app de la persona, es correcto también en el caso real.** La API exige que la
  persona haya usado una app que muestre los objetivos por serie (`titularCapaz`,
  `apps/api/src/entrenamiento/compatibilidad-de-clientes.ts:64`). Una persona invitada que todavía no instaló nada no
  la declaró, y la estable publicada es la 0.13.2, que no los muestra: si la instala, vería los valores generales. Lo
  que falla es el momento: se avisa al final. ED-08 y ED-D7.
- **Los avisos que siguen a la vista después de corregir (A26, B12-B14, C07) no son un artefacto de la captura:** está
  confirmado en el código. Los errores se calculan solo al enviar (`setErrores` en `enviar`):
  - `training/revisiones.tsx:314`;
  - `recipes/editor-de-receta.tsx:209`;
  - `nutrition/formularios.tsx:78`;
  - `solicitar-vinculo.tsx:72`, donde `editar` no los limpia.

  Siguen hasta el próximo envío (ED-04).
- **B07 y B23, el día de descanso con una sola comida,** los armó el script a propósito. Prioridad media (ED-D4).

**Lo que la auditoría no tenía, verificado en el código:**
- **Códigos internos a la vista del profesional.** Al elegir un formulario, «Pedir información» muestra el propósito de
  la plantilla (`forms/pedir.tsx:414`). Ese propósito dice «Sucede a la v2 (DL-165, ronda 2.1)…» y «(DL-100)»; está en
  `packages/domain/src/plantillas-de-inicio.ts:519`, `:884`, `:927`, `:984`, `:1006` y `:1018`, y en las migraciones que
  lo cargan. Se ve en la captura C13 (ED-05).
- **«Asesorado» en el website y «persona» en la app.** Hay textos que dicen las dos cosas en la misma frase:
  - «Adaptalo a la persona antes de activarlo: no es visible para el asesorado»;
  - «Tus asesorados»;
  - «Ficha del asesorado · BE»;
  - «Identificador BE del asesorado»;
  - «El asesorado ya tiene un plan…» (`training/editor.tsx:432`).

  Son unos 116 renglones del dominio con «asesorado» en un texto (ED-06).
- **Explicaciones repetidas en cada pantalla.**
  - Arriba de cada editor: «El asesorado no ve esta versión, y guardar no la activa…» (`training/editor.tsx:731` y
    `nutrition/editor.tsx:555`). Lo repiten el selector de versión y la ayuda.
  - Debajo de cada «Agregar»: «Del catálogo BE, de tus habituales o creado a mano.» (`training/editor.tsx:1049` y
    `nutrition/comida-del-editor.tsx:273`).
  - En cada receta, el párrafo largo del peso comestible (ED-17).
- **Se pueden perder cambios al salir.** El autoguardado espera una pausa de 4 s (`lib/autoguardado.ts:15`) y no corre
  si algo no se puede guardar. `beforeunload` cubre recargar y cerrar la pestaña (`marco-del-area.tsx:80-89`), pero la
  navegación interna con `next/link` no dispara ese aviso: la barra (`components/navegacion.tsx`), «Volver a la ficha» y
  las secciones. Si el profesional escribe y en menos de 4 s va a «Mis recetas» para crear una receta, eso se pierde sin
  aviso (ED-02).
- **«2.400» se rechaza a propósito.** `leerNumero` acepta el punto como decimal («72.5») y, por eso, rechaza la forma
  ambigua «1.850» (`packages/domain/src/formato-numeros.ts:67`, DL-091). No es un error de programación: es una regla que
  Dirección puede afinar (ED-D8).
- **Tres preguntas de la §12 de la auditoría ya están resueltas en el código:**
  - la receta editada después: la opción guarda `recipeVersionId`, la versión, no la receta (DL-119);
  - el descarte: D-21 de DL-163 (TB-47);
  - la edición simultánea: DL-148 responde un conflicto explícito, con 409, y no pisa nada.

  Se pide ratificar que el rediseño las conserve, no decidirlas de nuevo.

**Los estados de la evidencia,** en cada parte (§5):
- confirmado en capturas;
- confirmado en código;
- hipótesis.

Ninguna parte se da por hecha con una maqueta.

## 5. Partes

Cada parte deja la rama en un estado que sirve aunque el plazo corte lo que sigue. Las decisiones de la implementación se
numeran desde EDT-01, como TA- en WP-TABLERO-ALTA-GAMA: cada una dice qué se eligió y qué otra opción había, y las que
cambian la forma de un contrato se ratifican antes de integrar.

### 5.1 Resumen

| ID | Parte | Prioridad | Resuelve | API o base |
|---|---|---|---|---|
| ED-00 | Declaración, línea de base y medición | P0 | — | No |
| ED-01 | Descartar la versión en preparación | P0 | A30, B26, A06 | No (usa TB-47) |
| ED-02 | Salir con cambios sin guardar | P0 | nuevo | No |
| ED-03 | El estado de guardado, inequívoco, y el error recuperable | P0 | A07, B28 (cómo se ve) | No |
| ED-04 | Los avisos se actualizan al corregir | P0 | A25, A26, B03, B12-B14, C03, C06, C07, C12 | No |
| ED-05 | Textos sin códigos internos | P0 | nuevo, C13 | No |
| ED-06 | «Persona» en todo el website profesional | P0 | nuevo | No |
| ED-07 | «Antes de activar»: la previsualización | P0 | A09, A10, A20-A22, B20, B22, B23 | No |
| ED-08 | La app de la persona, avisada a tiempo | P0 | A17 | No |
| ED-10 | El cuadro enfocado | P1 | A11, B13, C13 | No |
| ED-11 | La galería de presets | P1 | A06, A32, nuevo | No |
| ED-12 | «Guardar como preset» con lo que ya existe | P1 | A05, A19 | No |
| ED-13 | Los dos presets propios nuevos: prescripción y reparto | P1 | nuevo | **Sí:** API-HAB-06 a 08, API-HAN-06 a 08 y dos tablas |
| ED-14 | El asistente: pasos, «Paso N de 7», volver y retomar | P1 | nuevo, A06-A08, B06-B08 | No |
| ED-15 | La estación de tres zonas y su barra de comandos | P1 | A07, A14, B06, §6.1 de la auditoría | No |
| ED-16 | Las entradas desde la ficha: crear, ajustar o seguir | P1 | A02, A03, B01, B02, B04, C11 | No |
| ED-17 | Las ayudas, una sola vez | P1 | nuevo | No |
| ED-20 | El asistente de Entrenamiento | P1 | A07, A08, A11, A15, A18 | No |
| ED-21 | Elegir varios ejercicios a la vez | P1 | A11-A13 | No |
| ED-22 | Prescribir con un preset o en una línea | P1 | A15 | No |
| ED-23 | La planilla de series y el detalle en un cuadro | P1 | A14-A16 | No |
| ED-24 | Sesiones y días en la estación | P1 | A08, A18 | No |
| ED-25 | El panel de Entrenamiento | P1 | A09, A20, TB-38 (Entrenamiento) | No |
| ED-30 | El asistente de Nutrición | P1 | B02-B04, B06-B10 | No |
| ED-31 | La opción en un cuadro, con los totales al instante | P1 | B09, B10, B18, B19, TB-38 (Nutrición) | **Sí:** API-PLN-01, ya declarada |
| ED-32 | La receta sin salir del plan | P1 | B11-B17 | No |
| ED-33 | Días tipo, comidas y opciones en la estación | P1 | B07, B08, B27 | No |
| ED-34 | El panel de Nutrición: rangos y día de referencia | P1 | B06, B19-B21, TB-39 | **Sí:** API-PLN-02 y 03, ya declaradas |
| ED-40 | Pedir información, compacto | P1 | C11-C14 | No |
| ED-41 | Invitar y solicitar el vínculo, sin ambigüedad | P1 | C01-C09 | No |
| ED-50 | Progresión por semana | P2 | nuevo | No (sobre los microciclos de hoy) |
| ED-51 | Escalar una opción | P2 | nuevo | No (lee ED-31) |
| ED-52 | Cambiar un alimento por un equivalente | P2 | nuevo | No |
| ED-53 | Listas de intercambio (modalidad B), solo declaradas | P2 | nuevo | Sí, cuando se decida |
| ED-54 | La vista planilla con teclado | P2 | §7 C de la auditoría | No |
| ED-55 | El plan para la persona, impreso o en PDF | P2 | nuevo | No |
| ED-56 | Comparar versiones y el motivo del ajuste | P2 | A04, A28, A29, B05 | No |
| ED-57 | Bibliotecas en tabla | P2 | A31, A32 | No |
| ED-58 | Revisiones, condensadas | P2 | A24, A25, A27 | No |

### 5.2 P0 · Lo que bloquea o arriesga datos

**ED-00 · Declaración, línea de base y medición**
- *Evidencia:* las capturas y `flujos.json` de la corrida del 2026-11-10 (`92c7c6c`).
- *Toca:* `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/flujos-de-planificacion.mjs`, que se trae de
  `wp-tablero-flujos-capturas` a la rama del paquete sin cambiar sus 73 tareas, y `capturas-del-tablero.yml` (trabajo
  `flujos`). El alto pasa a medir el desplazamiento de cada zona (`[data-zona]`): en la estación, la página siempre mide
  una pantalla, y medirla diría «1» sin decir nada (§7).
- *Dado* el `main` del día en que se arranca, *cuando* corre el trabajo `flujos`, *entonces* `flujos.json` queda en
  `EVIDENCIA/EDITORES-PROFESIONAL/antes/`, con los clics, campos y altos por paso y su hash.
- *Pruebas:* la corrida misma; TEST-EDP-001 (las 73 tareas son las mismas antes y después: un hash de la lista de
  códigos y de lo que hace cada paso).

**ED-01 · Descartar la versión en preparación**
- *Resuelve:* A30 y B26; también A06, porque con un borrador abierto no se puede empezar desde una plantilla.
- *Evidencia:* confirmado en capturas («NO EXISTE») y en código (la API y el cliente ya lo hacen; el website no lo
  llama).
- *Toca:*
  - `training/editor.tsx` y `nutrition/editor.tsx` (el «⋯» de la barra);
  - `training/plan.tsx` y `nutrition/plan.tsx` (el retorno a la vigente);
  - `components/dialogo.tsx`;
  - `copy-entrenamiento.ts` y `copy-nutricion.ts`.
- *Dado* una versión en preparación que nunca se activó, *cuando* el profesional elige «⋯ → Descartar la versión en
  preparación» y confirma, *entonces*:
  - el borrador deja de existir y la vigente no cambia;
  - vuelven «Ajustar el plan» y «Empezar desde una plantilla»;
  - el cuadro dijo antes el nombre, la versión de la que salió y que no se deshace, con «Cancelar» como opción
    enfocada;
  - con cambios sin guardar, el cuadro lo dice.
- *Pruebas:* un recorrido de navegador (cancelar, descartar y después empezar desde una plantilla); TEST-EDP-002 (la
  vigente nunca ofrece descartar, y un segundo clic reusa la misma `Idempotency-Key`).

**ED-02 · Salir con cambios sin guardar**
- *Evidencia:* confirmado en código (§4); hipótesis en uso real: la captura B11 guardó antes de salir.
- *Toca:*
  - `marco-del-area.tsx` (`useCambiosSinGuardar` suma la guardia de la navegación interna);
  - `components/navegacion.tsx`;
  - `lib/autoguardado.ts` (guardar ya, sin esperar la pausa);
  - un `components/salida-segura.tsx` nuevo.
- *Dado* un editor con cambios, *cuando* el profesional toca un enlace interno, *entonces*:
  - si se puede guardar, se guarda («Guardando antes de salir…») y sigue;
  - si no se puede, un cuadro «Tenés cambios sin guardar», con «Seguir editando» (principal) y «Salir sin guardar»;
  - nunca se pierde nada en silencio, y nada se guarda en el navegador (DL-148).
- *Pruebas:* un recorrido (escribir y, al segundo, ir a «Mis recetas»: el cambio está al volver); TEST-EDP-003.

**ED-03 · El estado de guardado, inequívoco, y el error recuperable**
- *Resuelve:* A07; de B28, cómo se ve el error.
- *Evidencia:* confirmado en capturas (B28: «El servicio no está disponible», sin salida) y en código (`EstadoDeGuardado`
  ya distingue estados; falta la recuperación).
- *Toca:* `training/editor.tsx`, `nutrition/editor.tsx`, el componente del estado de guardado y `lib/fallas.ts`.
- *Los estados de la barra,* con texto e ícono, nunca solo color:
  - «Cambios sin guardar · se guarda solo»;
  - «Guardando…»;
  - «Guardado a las 23:34», solo con la respuesta del servidor;
  - «No pudimos guardar. Tus cambios siguen en esta pantalla, y la versión activa no cambió. [Reintentar]», con el
    detalle técnico plegado (la operación y el código, sin datos de la persona);
  - «Otra pestaña guardó cambios», con «Ver la última», el conflicto de DL-148.
- *Dado* un guardado que falla, *cuando* el profesional toca «Reintentar», *entonces* se reintenta con el mismo cuerpo, y
  activar sigue apagado hasta guardar.
- *Depende de:* el arreglo del límite de 16 KB, en el otro carril.
- *Pruebas:* un recorrido con la API que responde 503 y después 200; TEST-EDP-004 («Guardado» nunca aparece sin la
  respuesta del servidor).

**ED-04 · Los avisos se actualizan al corregir**
- *Resuelve:* A25 y A26; B03 y B12-B14; C03, C06, C07 y C12.
- *Evidencia:* confirmado en código (§4) y en capturas (B14 muestra «Agregá al menos un ingrediente» con tres
  ingredientes).
- *Toca:*
  - `components/formulario.tsx` (`ResumenDeErrores`, `Campo`);
  - `training/revisiones.tsx` y `nutrition/revisiones.tsx`;
  - `nutrition/formularios.tsx`;
  - `recipes/editor-de-receta.tsx`;
  - `solicitar-vinculo.tsx` e `invitar-persona.tsx`;
  - `forms/pedir.tsx`.
- *Dado* un formulario que ya mostró sus errores, *cuando* el profesional corrige un campo, *entonces*:
  - el aviso de ese campo se va al salir de él;
  - el resumen se recalcula y desaparece cuando no queda nada;
  - un lector de pantalla oye «Listo para registrar»;
  - el foco no salta mientras se escribe.
- *Pruebas:* unitarias de la validación por campo; un recorrido sobre la revisión (enviar vacía, completar y ver que el
  resumen se va); TEST-EDP-005.

**ED-05 · Textos sin códigos internos**
- *Evidencia:* confirmado en capturas (C13) y en código (§4).
- *Toca:*
  - `forms/pedir.tsx` (la descripción de cada plantilla sale de una tabla del dominio por su clave, en palabras para
    el profesional);
  - un `packages/domain/src/descripciones-de-plantillas.ts` nuevo;
  - `scripts/copy-pantallas.test.cjs` (T13).

  El propósito guardado no cambia: las versiones de plantilla son inmutables, y el próximo propósito sale limpio.
- *Dado* cualquier pantalla de /pro, *cuando* se recorre, *entonces* ningún texto visible dice `DL-`, `TB-`, `RF-`,
  `UC-`, `API-`, `REG-`, «ronda» ni un código parecido.
- *Pruebas:* TEST-EDP-006, una regla nueva de T13 sobre los textos del dominio que usa el website y un recorrido que
  lee el texto visible, con su mutación (un texto con «DL-1» hace fallar la prueba).

**ED-06 · «Persona» en todo el website profesional**
- *Evidencia:* confirmado en código (§4).
- *Toca:*
  - `packages/domain/src/copy-*.ts`, en los textos que muestra el website;
  - los textos sueltos de `apps/web/src/app/pro/**`;
  - `app/pro/advisees/page.tsx` (el título de la pestaña);
  - T13.

  Lo que comparte la APK cambia en su próxima candidata; son textos compilados, no lecturas: DL-152 no se toca. Los
  textos legales con versión cambian en su versión siguiente.
- *Dado* el website profesional, *cuando* se recorre, *entonces* dice «persona» (o el nombre, o la referencia neutral)
  y nunca «asesorado»; el legajo no cambia.
- *Pruebas:* TEST-EDP-007 (T13 con «asesorad» prohibido en los textos de /pro, con la lista de excepciones legales).

**ED-07 · «Antes de activar»: la previsualización**
- *Resuelve:* A09, A10 y A20-A22; B20, B22 y B23.
- *Evidencia:* confirmado en capturas (A10: la imposibilidad aparece después de elegir la fecha) y en código
  (`abrirLaActivacion`).
- *Toca:*
  - `training/editor.tsx` y `nutrition/editor.tsx`;
  - `cuando-la-revisas.tsx` (no cambia su regla);
  - `versiones-del-plan.tsx`;
  - un `antes-de-activar.tsx` y un `comparar-versiones.ts` nuevos, en el website y sin React.
- *El cuadro tiene cuatro partes, y un solo botón principal: «Activar la versión 9 para Diego»:*
  1. lo que cambia frente a la vigente («+1 sesión · Tren superior liviano», «Sentadilla: 4×3 → 4×6-8»);
  2. lo que va a ver la persona, por día o por sesión, con las cuentas en palabras («Día de descanso: 1 comida»);
  3. su app (ED-08);
  4. «¿Cuándo la revisás?», igual que hoy.
- *Dado* un borrador con algo que impide activar, *cuando* el profesional mira la barra, *entonces* el botón dice
  «Activar · 1 cosa por corregir» y lleva a la lista; no abre la confirmación.
- *Dado* un borrador listo, *cuando* activa, *entonces* la vigente pasa a decir «Versión 9 vigente desde hoy · Diego ya
  la ve», con «Ver lo que recibe».
- *Pruebas:*
  - unitarias de `comparar-versiones`;
  - TEST-EDP-008: el cuadro no se abre con bloqueos, la validación final sigue siendo de la API y «Sin fecha por
    ahora» sigue disponible;
  - TEST-EDP-009: el resumen no califica, con T13 y sin color de estado.

**ED-08 · La app de la persona, avisada a tiempo**
- *Resuelve:* A17.
- *Evidencia:* confirmado en capturas y en código (§4).
- *Toca:*
  - `training/editor.tsx`;
  - `objetivos-por-serie.tsx`;
  - `ejercicio-del-editor.tsx`;
  - `copy-*.ts` (`COPY_COMPATIBILIDAD_DE_CLIENTES`, con «persona»).
- *Dado* una persona cuya app no muestra objetivos por serie, *cuando* el profesional escribe el primer valor propio de
  una serie, *entonces*:
  - el panel derecho y la celda dicen, en ese momento, «La app de Diego todavía no muestra objetivos distintos por
    serie»;
  - ofrecen «Pasar a objetivos generales», con vista previa de lo que queda;
  - nunca se convierte en silencio;
  - si la persona nunca abrió la app, el texto lo dice así («Diego todavía no abrió BE»), y explica qué versión los
    muestra.

  La regla de la API no cambia (ED-D7).
- *Pruebas:* TEST-EDP-010 (el aviso aparece al escribir y no al activar; la conversión pide confirmar y muestra lo que
  queda).

### 5.3 P1 · Lo común: cuadros, presets, asistente y estación

**ED-10 · El cuadro enfocado**
- *Resuelve:* A11 (2,1 pantallas), B13 y C13; es la regla de §2.3.
- *Evidencia:* confirmado en capturas.
- *Toca:*
  - `components/cajon.tsx` y `components/dialogo.tsx`, que se unen en `CuadroEnfocado`, con tamaño de panel o de
    diálogo, título, un solo principal y foco;
  - `globals.css`;
  - la guía, con la pauta «Cuadros enfocados».
- *Dado* un cuadro abierto, *cuando* se recorre con el teclado, *entonces* el foco queda adentro, Escape cierra sin
  escribir y el foco vuelve al botón que lo abrió; con cambios, cerrar pregunta.
- *Pruebas:* TEST-EDP-011, en el recorrido de teclado de la CI: un solo principal por cuadro, el foco y la vuelta.

**ED-11 · La galería de presets**
- *Resuelve:* A06 y A32 (las plantillas, sin vista previa ni acceso desde el editor); es el pedido de Dirección de
  presets «de primera clase».
- *Evidencia:* confirmado en código. Las plantillas (TPL y TPN), los habituales (HAB y HAN) y las recetas (REC) existen,
  cada uno con su lugar y su diálogo; los presets de BE no existen.
- *Toca:*
  - un `galeria-de-presets.tsx` nuevo, que lee con las operaciones de hoy (API-TPL-01, API-TPN-01, API-HAB-01 a 05,
    API-HAN-01 a 05 y API-REC-01) y con ED-13;
  - un `packages/domain/src/presets-de-be.ts` nuevo: el contenido de BE, versionado, con su prueba;
  - `empezar-desde-plantilla.tsx`, que pasa a ser una pestaña de la galería.
- *Cómo se ve:*
  - dos grupos, «De BE · punto de partida» y «Tuyos», y filtros por tipo;
  - cada tarjeta, con lo que trae («4 sesiones · sin ejercicios», «4×8-12 · RIR 2 · 90 s · sin cargas») y su vista
    previa al costado;
  - «Usar» aplica con un clic, y lo aplicado se puede deshacer mientras no se guarde;
  - los de BE llevan su rótulo y nunca muestran un ejercicio, un alimento ni una carga.
- *Dado* la galería abierta desde el paso 4, *cuando* el profesional toca «Usar» en «Hipertrofia 4×8-12 RIR 2»,
  *entonces*:
  - los ejercicios elegidos reciben 4 series de 8 a 12, RIR 2 y 90 s;
  - las cargas quedan vacías;
  - un aviso dice «Aplicado a 5 ejercicios · Deshacer».
- *Pruebas:*
  - TEST-EDP-012: un preset de BE nunca trae ejercicio, alimento ni carga; su versión queda en el contenido;
  - TEST-EDP-013: aplicar no guarda nada que el profesional no vea, y deshacer vuelve exacto;
  - TEST-EDP-014: nada viene elegido al abrir.

**ED-12 · «Guardar como preset» con lo que ya existe**
- *Resuelve:* A05 y A19.
- *Evidencia:* confirmado en código («Guardar como plantilla», «Guardar como habitual» y recetas existen por separado).
- *Toca:* `training/plantillas.tsx`, `training/habituales.tsx`, `nutrition/plantillas.tsx` y `nutrition/habituales.tsx`,
  más el «⋯» de la estación.
- *Cómo funciona:* un solo verbo, «Guardar como preset», con el tipo a elegir:
  - el plan → plantilla;
  - esta sesión → sesión habitual;
  - esta comida → comida habitual;
  - estas series → prescripción habitual (ED-13).

  Dice qué se copia y que los datos de la persona no viajan: no van las notas que la nombran, y la casilla «Incluir las
  notas» viene apagada, como pide A05.
- *Dado* una sesión armada, *cuando* el profesional la guarda como preset, *entonces* aparece en «Tuyos» de la galería
  y en «Mis habituales», sin duplicarse.
- *Pruebas:* TEST-EDP-015 (guardar como preset escribe en el modelo que ya existe; no hay una tabla «presets»).

**ED-13 · Los dos presets propios nuevos: la prescripción habitual y el reparto habitual**
- *Evidencia:* hipótesis de producto (pedido de Dirección); confirmado en código que no existen.
- *Toca:*
  - la API, `apps/api/src/entrenamiento/habituales.*` y `apps/api/src/nutricion/habituales.*`: API-HAB-06 a 08 (listar,
    guardar o reemplazar por nombre, quitar) y API-HAN-06 a 08;
  - `prisma/schema.prisma`, con dos tablas y una migración que solo agrega;
  - `packages/domain/src/contratos-habituales.ts` y `openapi.ts`;
  - la guardia de trazabilidad (las familias HAB y HAN, extendidas por DL-167).
- *Las reglas de siempre:* `Idempotency-Key`, `expectedVersion`, auditoría, el 404 de lo ajeno y nada que lea la APK.
- *Dado* un profesional, *cuando* guarda «Mi fuerza 5×3 · RIR 1», *entonces* lo ve solo él, y aplicarlo escribe las
  series del borrador como cualquier valor.
- *Pruebas:* integración con PostgreSQL (crear, reemplazar, quitar, lo ajeno) y TEST-EDP-016 (las APK instaladas leen
  lo mismo: `lecturas-de-las-apk.int-spec.ts`).

**ED-14 · El asistente: pasos, «Paso N de 7», volver y retomar**
- *Resuelve:* A06-A08 y B06-B08; es el pedido de Dirección: «un flujo de pantallas y cuadros para tomar decisiones».
- *Evidencia:* confirmado en código. «Empezar el plan» (`primer-plan.tsx`, DL-145) ordena la evaluación y el objetivo,
  y deja de ahí en adelante un editor largo.
- *Toca:*
  - un `apps/web/src/app/pro/advisees/asistente/` nuevo: el armazón, los pasos y `paso-que-sigue.ts`, sin React;
  - `primer-plan.tsx` (paso 0);
  - `editar-la-estructura.ts`;
  - la guía, con la pauta «El asistente».
- *Dado* un borrador del asistente, *cuando* el profesional toca «Atrás», *entonces* ve lo guardado de ese paso.
- *Dado* un borrador del asistente, *cuando* sale y vuelve, *entonces* la ficha ofrece «Seguir con el asistente · paso
  4 de 7», deducido del borrador.
- *Dado* un borrador del asistente, *cuando* toca «Siguiente» y el guardado falla, *entonces* no avanza, y su trabajo
  sigue en pantalla con «Reintentar» (ED-03).
- *Pruebas:*
  - unitarias de `paso-que-sigue` (un caso por paso);
  - un recorrido del asistente completo;
  - TEST-EDP-017: «Siguiente» nunca avanza sin la respuesta del servidor; cambiar el punto de partida pide confirmar.

**ED-15 · La estación de tres zonas y su barra de comandos**
- *Resuelve:* A07, A14 y B06; es la §6.1 de la auditoría: entrada fragmentada y pérdida de contexto.
- *Evidencia:* confirmado en capturas (A07: el editor arranca a mitad de la primera pantalla; A18: 2,7 pantallas).
- *Toca:*
  - `training/editor.tsx` y `nutrition/editor.tsx`, que se parten en zonas;
  - un `estacion/` nuevo, con el armazón, las zonas, la barra y `Panel`;
  - `marco-del-area.tsx`, con el modo de una fila en Plan;
  - `globals.css`, con la grilla de 1280, 1440 y 1920.

  Lo elegido sigue en la dirección (`bloque`, `micro`, `sesion`, `dia`, `comida`, más `opcion`), así que volver
  conserva el lugar.
- *Dado* 1440 × 900, *cuando* se abre la estación, *entonces* la barra de comandos y las tres zonas entran en la
  pantalla, la página no se desplaza y cada zona se desplaza sola.
- *Dado* 1280 × 800, *cuando* se abre la estación, *entonces* el panel derecho se abre con «Panel».
- *Dado* 1920 × 1080, *cuando* se abre la estación, *entonces* el centro ocupa el ancho hasta 1840 px.
- *Pruebas:*
  - capturas en Claro y Azul noche a 1280, 1440 y 1920;
  - la prueba de contraste;
  - TEST-EDP-018: el recorrido por teclado de las tres zonas, con saltos «Ir a la estructura», «Ir al editor» e «Ir al
    panel»;
  - el zoom al 200 % sin perder funciones (B10-10).

**ED-16 · Las entradas desde la ficha: crear, ajustar o seguir**
- *Resuelve:* A02, A03, B01, B02 y B04; C11.
- *Evidencia:* confirmado en capturas (de la ficha al editor, 3 clics: «Abrir Entrenamiento», «Plan», «Nueva versión»).
- *Toca:* `accion-de-la-ficha.ts`, `workspace.tsx`, `seguimiento/resumen-area.tsx` y `nutrition/resumen.tsx`. Usa la
  cadena de TB-09; no la reemplaza.
- *Cada tarjeta de área ofrece la acción del momento:*
  - «Crear el plan» abre el asistente, sin plan;
  - «Ajustar el plan» crea la versión nueva y abre la estación, con plan vigente;
  - «Seguir el borrador» (o «Seguir con el asistente · paso N de 7»), con borrador.

  Después de guardar un objetivo nuevo, la tarjeta del objetivo ofrece «Armar la versión del plan con este objetivo»
  (B04). «Pedir información» queda a la vista en la ficha, no en «Más» (C11).
- *Dado* Diego con un plan vigente, *cuando* Martín toca «Ajustar el plan», *entonces* está en la estación con la
  versión 9 en preparación, en un clic.
- *Pruebas:* TEST-EDP-019 (la acción sale del estado del área, un caso por estado) y la cuenta de clics de §7.

**ED-17 · Las ayudas, una sola vez**
- *Evidencia:* confirmado en código (§4).
- *Toca:*
  - `training/ayuda-del-plan.tsx` y `nutrition/ayuda-del-plan.tsx`;
  - los textos de los editores;
  - `comida-del-editor.tsx`;
  - `copy-recetas.ts`;
  - un `primer-uso.tsx` nuevo.
- *Cómo queda:*
  - la barra dice «Diego no la ve» una vez, como chip;
  - lo que explica va a «Cómo se lee esta vista» (DL-146) o a una ayuda de primer uso de tres renglones, que se
    cierra y se recuerda en el navegador. Es una preferencia, no un dato de salud;
  - lo que hace falta para decidir no se pliega (DL-166 PV-4).
- *Dado* un profesional que ya cerró la ayuda, *cuando* abre otro editor, *entonces* no la ve de nuevo, y la encuentra
  en «Cómo se lee esta vista».
- *Pruebas:* TEST-EDP-020 (T13 cuenta cada frase de ayuda una sola vez por vista).

### 5.4 P1 · Entrenamiento

**ED-20 · El asistente de Entrenamiento**
- *Resuelve:* A07, A08, A11, A15 y A18, por el camino de crear.
- *Evidencia:* maqueta; los pasos usan operaciones de hoy.
- *Toca:*
  - `asistente/entrenamiento/*.tsx`;
  - `training/agregar-ejercicio.tsx`, que se reusa dentro del cuadro de ED-21;
  - `training/agenda-del-plan.tsx`, que se reusa en el paso 5.
- *Los pasos* son los de §2.1:
  - en el paso 2, un preset de estructura escribe las sesiones con sus nombres;
  - en el paso 5, los días que traiga el preset aparecen marcados y rotulados «del preset», para confirmar.
- *Dado* Diego con su plan vigente, *cuando* Martín elige «Copiar el plan vigente», *entonces* los pasos 2 a 5 vienen
  completos y puede saltar al que necesita desde el indicador de pasos.
- *Pruebas:* un recorrido completo desde un preset y desde copiar el vigente, y TEST-EDP-021 (el borrador que deja el
  asistente es el mismo que deja la estación con los mismos datos).

**ED-21 · Elegir varios ejercicios a la vez**
- *Resuelve:* A11, A12 y A13.
- *Evidencia:* confirmado en capturas (66 acciones en el panel; «Elegir» y «Marcar como habitual», por separado).
- *Toca:* `training/agregar-ejercicio.tsx` y `training/habituales.tsx`.
- *El cuadro tiene:*
  - el buscador con filtros en chips (equipo y zona);
  - los habituales arriba;
  - una casilla por fila y la estrella de habitual en la fila;
  - las variantes con nombre completo;
  - abajo, «Agregar 3 a Piernas A», con una prescripción opcional para los tres (ED-22).

  «Crear un ejercicio propio» sugiere primero los parecidos.
- *Dado* «sentadilla» escrita, *cuando* Martín marca dos y crea uno, *entonces* los tres entran a la sesión en el orden
  marcado, con un solo «Agregar».
- *Pruebas:* TEST-EDP-022 (el orden marcado se respeta y nada entra sin «Agregar») y un recorrido por teclado.

**ED-22 · Prescribir con un preset o en una línea**
- *Resuelve:* A15 (27 campos a la vista).
- *Evidencia:* confirmado en capturas.
- *Toca:*
  - un `packages/domain/src/prescripcion-rapida.ts` nuevo: `leerPrescripcion`, que lee
    «4×8-12 RIR 2 · 60 kg · 90 s», «5x5 @RIR1» y «3×15», y devuelve series, repeticiones o rango, criterio, carga y
    descanso, o lo que no entendió;
  - `ejercicio-del-editor.tsx`;
  - `series-y-tiempos.tsx`.
- *Cómo funciona:*
  - se escribe en un campo por ejercicio, se ve una vista previa («4 series · 8 a 12 · RIR 2 · 60 kg · 1:30») y se
    aplica con Enter;
  - nunca adivina: lo que no entiende queda marcado y no se aplica nada;
  - la gramática se lee en «Atajos».
- *Dado* «4×8-12 RIR 2 · 60 kg · 90 s», *cuando* se aplica, *entonces* el ejercicio queda con esos valores generales y 4
  series que los heredan.
- *Pruebas:* unitarias y de propiedad de `leerPrescripcion` (lo que escribe se vuelve a leer igual; «2.5 kg» y «2,5
  kg» valen lo mismo; nada ambiguo se aplica); TEST-EDP-023.

**ED-23 · La planilla de series y el detalle en un cuadro**
- *Resuelve:* A14, A15 y A16.
- *Evidencia:* confirmado en capturas (los valores heredados y los propios se parecen).
- *Toca:* `ejercicio-del-editor.tsx`, `objetivos-por-serie.tsx` y `series-y-tiempos.tsx`.
- *Cada ejercicio es una tabla compacta:*
  - una fila «General» y una fila por serie;
  - el valor heredado, en el tono tenue y con «↳ general» en la descripción accesible; el propio, con un punto y
    «propio»;
  - se eligen varias series y se les escribe un valor (o «Volver a lo general»);
  - Ctrl+D copia hacia abajo;
  - «Detalle» abre la serie en un cuadro (ED-10), con todos sus campos: nota, parámetros y tempo.

  El renglón plegado dice «3 series · 1 sin repeticiones», sin color.
- *Dado* tres series elegidas, *cuando* Martín escribe «2:00» en descanso, *entonces* las tres lo tienen propio, y
  «Volver a lo general» lo quita.
- *Pruebas:* TEST-EDP-024 (lo que se ve como heredado es lo que la API guarda como heredado, contra
  `planExigeObjetivosPorSerie`) y un recorrido por teclado.

**ED-24 · Sesiones y días en la estación**
- *Resuelve:* A08 (3 clics por sesión) y A18 (2,7 pantallas, 95 acciones).
- *Evidencia:* confirmado en capturas.
- *Toca:* `training/estructura-del-plan.tsx`, `training/agenda-del-plan.tsx` y `training/editor.tsx`.
- *En la estructura, a la izquierda:*
  - «+ Sesión», con el nombre en el lugar y Enter;
  - «Duplicar» y «Copiar a otra semana»;
  - cada sesión, con sus días en siete chips (L M X J V S D) y «Sin día»;
  - la agenda entera, en una tira de la semana arriba, sin abrir un diálogo.

  Las reglas de DL-137 no cambian: el inicio, los avisos y lo que se mueve.
- *Dado* cinco sesiones, *cuando* Martín toca un chip por sesión, *entonces* la agenda queda armada con cinco clics y se
  guarda sola.
- *Pruebas:* las de la agenda de hoy siguen verdes; TEST-EDP-025 (un día con dos sesiones se dice, no se impide, como
  hoy).

**ED-25 · El panel de Entrenamiento**
- *Resuelve:* A09 y A20; TB-38 en su parte de Entrenamiento.
- *Evidencia:* confirmado en código (`loQueQuedaSinCompletarEnEntrenamiento` existe y se ve solo después de «Revisar
  el plan»).
- *Toca:* `revisar-el-plan.ts`, `training/zonas-de-la-sesion.tsx` y `estacion/panel.tsx`.
- *Las pestañas:*
  - «Antes de activar»: lo que impide activar y lo que queda sin completar, en vivo, con su lugar. «Revisar» sigue
    pidiendo la validación a la API antes de activar;
  - «Lo que trabaja la semana»: las series por zona, contadas del plan con la regla de D-15, sin mínimos y nunca junto
    a lo registrado;
  - «Otras áreas» (TB-54).
- *Dado* una sesión sin ejercicios, *cuando* se mira el panel, *entonces* dice «Tren superior liviano: sin ejercicios»
  con su enlace, sin esperar a «Revisar».
- *Pruebas:* TEST-EDP-026 (lo que el panel dice en vivo es lo que la API responde al validar, en los casos de la
  prueba) y TEST-EDP-009.

### 5.5 P1 · Nutrición

**ED-30 · El asistente de Nutrición**
- *Resuelve:* B02-B04 y B06-B10, por el camino de crear.
- *Evidencia:* maqueta.
- *Toca:*
  - `asistente/nutricion/*.tsx`;
  - `nutrition/formularios.tsx` (el objetivo, en el paso 2);
  - `nutrition/habituales.tsx`.
- *Paso 2:*
  - el reparto de BE o el propio escribe los gramos con las kcal que escribió el profesional, mostrando la cuenta
    («50 % de 2.400 kcal = 300 g de carbohidratos»);
  - guardar el objetivo es una versión nueva del objetivo (REG-06-123), como hoy.
- *Paso 4:* la estructura del día o una comida habitual.
- *Paso 5:* la opción en un cuadro (ED-31).
- *Dado* Sofía con «2.400» kcal, *cuando* aplica «Equilibrado 50/20/30», *entonces*:
  - ve 300 g de carbohidratos, 120 g de proteínas y 80 g de grasas antes de guardar, y los puede cambiar;
  - BE no propone las kcal.
- *Pruebas:* TEST-EDP-027 (el reparto es aritmética a la vista; sin kcal escritas no se aplica) y un recorrido completo.

**ED-31 · La opción en un cuadro, con los totales al instante**
- *Resuelve:* B09, B10, B18 y B19; TB-38 en su parte de Nutrición (API-PLN-01).
- *Evidencia:* confirmado en capturas (B19: «NO EXISTE»; B10: el estado queda «Sin indicar» y se descubre al
  revisar) y en código (el cálculo `SUM_SOURCE_PER_100G_V1` existe en el dominio).
- *Toca:*
  - `nutrition/comida-del-editor.tsx` y `nutrition/agregar-item.tsx`;
  - un `nutrition/totales.tsx` nuevo;
  - la API, `apps/api/src/nutricion/*`: API-PLN-01 devuelve la estimación de cada opción y, por ítem, la composición
    que usó.
- *Cómo funciona:*
  - cantidad, unidad y estado, en la fila; el estado sin indicar se dice en la fila apenas se agrega el alimento;
  - el buscador, dentro del cuadro: Enter elige y el cuadro sigue abierto para el próximo;
  - la fuente, la completitud y «dato de demostración» se ven en cada resultado;
  - los totales de la opción («703 kcal · P 45 g · C 97 g · G 15 g») se recalculan al instante con la función del
    dominio, y al guardar los confirma la API (ED-D6);
  - lo que falta dice «Sin dato» y qué ingrediente lo impide.
- *Dado* banana a 120 g, *cuando* Sofía la pasa a 150 g, *entonces* la estimación cambia en el momento, y un ítem sin
  composición deja ese nutriente «Sin dato», nunca 0.
- *Pruebas:*
  - TEST-EDP-028: el cálculo del website y el de API-PLN-01 dan lo mismo en una tabla de casos;
  - TEST-EDP-029: un hueco nunca suma cero;
  - TEST-EDP-016: lo que leen las APK no cambia.

**ED-32 · La receta sin salir del plan**
- *Resuelve:* B11-B17.
- *Evidencia:* confirmado en capturas (B16: volver cuesta 4 clics y se pierde el lugar).
- *Toca:*
  - `recipes/editor-de-receta.tsx`, que pasa a poder montarse en un cuadro;
  - `recipes/calculo-de-receta.tsx`;
  - `nutrition/recetas-para-elegir.ts` y `comida-del-editor.tsx`.

  En /pro/recipes, la tabla compacta y los totales fijos al costado (B13 y B14).
- *Cómo funciona:* «+ Opción → Receta nueva» abre la receta en un cuadro grande. Tiene:
  - los ingredientes en una tabla, con su estado;
  - los totales de la receta y de una porción, fijos al costado;
  - un solo principal: «Guardar la receta y agregarla a Merienda».

  Al cerrar, el plan está en el mismo día, la misma comida y la nueva opción elegida.
- *Dado* el día habitual con la merienda abierta, *cuando* Sofía crea y guarda una receta de tres ingredientes,
  *entonces* la opción 2 de la merienda es esa receta, en su versión 1, y no navegó fuera del plan.
- *Pruebas:* un recorrido con el lugar (día, comida y opción) y TEST-EDP-030 (la opción guarda `recipeVersionId`; editar
  la receta después no cambia la versión del plan).

**ED-33 · Días tipo, comidas y opciones en la estación**
- *Resuelve:* B07, B08 (4 clics para una comida) y B27 (duplicar un día, 5 clics).
- *Evidencia:* confirmado en capturas.
- *Toca:* `nutrition/estructura-del-plan.tsx`, `nutrition/editor.tsx` y `comida-del-editor.tsx`.
- *En la estructura, a la izquierda:*
  - «+ Día tipo», «Duplicar y editar» (nombre en el lugar, «copia independiente»);
  - «+ Comida», que nace con su opción 1 lista;
  - «+ Opción ▾» (alimentos, receta, copiar de otra comida, comida habitual);
  - un día tipo sin comidas dice «Sin comidas»; uno con algunas, «1 comida» (ED-D4).
- *Dado* el día de descanso, *cuando* Sofía toca «+ Comida» y escribe «Colación», *entonces* la comida existe con su
  opción 1 abierta, en un clic.
- *Pruebas:* TEST-EDP-031 (duplicar un día no comparte identificadores con el original) y las de topes de TB-48.

**ED-34 · El panel de Nutrición: rangos y día de referencia**
- *Resuelve:* B06 y B19-B21; TB-39, con la forma ratificada en D-17.
- *Evidencia:* confirmado en código. Los rangos están declarados y no implementados: API-PLN-02 y 03.
- *Toca:* `estacion/panel.tsx`, un `nutrition/rangos.tsx` nuevo y la API (API-PLN-02 y 03, en su rama).
- *Las pestañas:*
  - «Antes de activar», en vivo, como ED-25;
  - «Rangos y totales»: el rango de la comida, con cada opción ubicada como en D-17, sin color, y «Usar lo que cubren
    como rango» solo al tocarlo;
  - si Dirección lo aprueba (ED-D5), «Un día posible»: una opción por comida, la 1 por defecto y a la vista, sumadas
    con su «Sin dato», con el rótulo «no es lo que come».
- *Dado* las cuatro comidas del día de entrenamiento, *cuando* Sofía elige la opción 2 del almuerzo, *entonces*:
  - el día posible cambia;
  - las alternativas nunca se suman entre sí;
  - nada de esto lo ve la persona.
- *Pruebas:* TEST-EDP-032 (las alternativas de una comida nunca se suman; el día posible usa una por comida) y
  TEST-EDP-029.

### 5.6 P1 · Vincular y pedir información

**ED-40 · Pedir información, compacto**
- *Resuelve:* C11-C14.
- *Evidencia:* confirmado en capturas (C13: 10,2 pantallas, 107 controles) y en código (`pedir.tsx`).
- *Toca:* `forms/pedir.tsx`, `forms/solicitudes.tsx`, `forms/page.tsx` y `workspace.tsx` (el botón a la vista).
- *El cuadro tiene tres pasos, cada uno en una línea cuando está listo:*
  - el formulario, con su descripción sin códigos (ED-05);
  - las preguntas, por partes plegadas, cada una con «12 de 12 pedidas · 3 obligatorias · 1 que se suma si corresponde»,
    «Pedir todas» o «Ninguna» por parte, un buscador y «Ver todas»;
  - el para qué y el área.

  Abajo, fijo: «Vas a pedir 50 preguntas (38 obligatorias) para Nutrición. Pedir no amplía tu acceso.» y un solo
  principal, «Enviar solicitud».
- *Dado* «Cómo comés hoy», *cuando* Sofía la elige, *entonces*:
  - el cuadro entra en una pantalla con las partes plegadas;
  - todas las preguntas siguen pedidas (DL-131);
  - las obligatorias se cuentan a la vista;
  - lo condicional se dice en su parte.
- *Pruebas:* TEST-EDP-033 (lo enviado es exactamente lo marcado, con las partes plegadas o abiertas) y
  TEST-EDP-034 (plegar no oculta una obligatoria: la cuenta de cada parte las nombra).

**ED-41 · Invitar y solicitar el vínculo, sin ambigüedad**
- *Resuelve:* C01-C09.
- *Evidencia:* confirmado en capturas.
- *Toca:* `invitar-persona.tsx`, `solicitar-vinculo.tsx`, `solicitudes-enviadas.tsx` y `esperan-respuesta.tsx`.
- *Cómo queda:*
  - dos botones con subtítulo: «Invitar a alguien nuevo · enlace, QR o código» y «Pedir el vínculo a quien ya usa BE
    · con su identificador»;
  - la invitación lista prioriza «Compartir» y «Copiar el enlace», con el vencimiento en fecha y hora;
  - los estados en palabras: «Invitación creada · todavía no la usó» y «Pendiente de respuesta de Camila»;
  - «Solicitudes enviadas» pasa de diálogo a una sección con filtros, si alcanza (corte).
- *Dado* una invitación creada, *cuando* Sofía vuelve al Espacio, *entonces* la ve como pendiente, con su vencimiento,
  y nunca como un acceso.
- *Pruebas:* las de la invitación de hoy siguen verdes; TEST-EDP-035 (ningún estado pendiente se dice como acceso).

### 5.7 P2 · Alta gama, con criterio de corte

**ED-50 · Progresión por semana**
- *Resuelve:* el pedido de alta gama; es D-19 aplicada sobre lo que existe hoy.
- *Evidencia:* maqueta (la grilla de TB-43 ya fue ratificada).
- *Toca:* `training/estructura-del-plan.tsx`, un `training/progresion.ts` nuevo (sin React) y la grilla «Semana por
  semana».
- *Cómo funciona:* «Progresión» escribe en los microciclos que ya existen (S1…S4) lo que dice el profesional. Por
  ejemplo, «+2,5 kg por semana en S2 y S3; S4, descarga: −10 % de carga y una serie menos, redondeo a 2,5 kg». Hay
  vista previa con «+2,5 · igual · −1» y se escribe con «Escribir en el borrador». No queda una regla guardada. La app,
  hasta TB-44, muestra las semanas juntas y en orden (ED-D11).
- *Dado* Piernas A en S1, *cuando* Martín genera S2 a S4, *entonces* cada celda tiene su valor escrito y se puede
  cambiar antes de guardar.
- *Pruebas:* de propiedad de `progresion` (deshacer devuelve S1 exacta; el redondeo es el elegido; ningún registro de la
  persona cambia nada) y TEST-EDP-036.

**ED-51 · Escalar una opción**
- *Evidencia:* idea de producto.
- *Toca:* `nutrition/totales.tsx` y un `nutrition/escalar.ts` nuevo.
- *Cómo funciona:* «Escalar a…» con un número que escribe la profesional o con el rango de la comida. Es proporcional,
  con redondeo a 5 g, y tiene vista previa antes y después. No se aplica a una opción de receta (ED-D12).
- *Dado* una opción de 703 kcal, *cuando* Sofía la escala a 600, *entonces* cada cantidad baja en la misma proporción,
  redondeada, y la vista previa dice el total nuevo con su «Sin dato» si falta algo.
- *Pruebas:* TEST-EDP-037 (sin el dato de un ítem, no escala ese ítem y lo dice).

**ED-52 · Cambiar un alimento por un equivalente**
- *Evidencia:* idea de producto; es el puente hasta la modalidad B.
- *Toca:* `nutrition/agregar-item.tsx`.
- *Cómo funciona:* «Cambiar por…» en la fila, con el buscador. Cada resultado dice la cantidad que da la misma energía
  («arroz 120 g → fideos 105 g»), y lo elegido es un ítem común de la modalidad A.
- *Pruebas:* TEST-EDP-038.

**ED-53 · Listas de intercambio (modalidad B), solo declaradas**
- *Evidencia:* legajo (REG-06-120: grupo declarado y versionado, porciones, aporte de referencia y desvío). Su
  implementación «puede diferirse hasta disponer del catálogo de grupos».
- *Qué pide:* un catálogo de grupos, un modelo, operaciones, una app que lo muestre (capacidad nueva) y validación
  disciplinar. No entra antes del 25/11 (ED-D13). Se declara para no perderla.

**ED-54 · La vista planilla con teclado**
- *Resuelve:* la Alternativa C de la auditoría.
- *Toca:* `estacion/planilla.tsx`.
- *En Entrenamiento,* la sesión o la semana entera como planilla (ejercicio × serie, y columnas). Tiene:
  - copiar hacia abajo y rellenar un rango;
  - pegar desde una planilla (TSV), con vista previa;
  - deshacer lo no guardado.
- *En Nutrición,* comida × día tipo.
- *La preferencia:* «Vista simple» o «Vista planilla», recordada en el navegador. Los atajos, en «Atajos» (ED-D16).
- *Pruebas:* TEST-EDP-039 (pegar nunca escribe sin vista previa) y un recorrido por teclado.

**ED-55 · El plan para la persona, impreso o en PDF**
- *Toca:* una ruta de impresión de la versión activada y su hoja de estilo para imprimir.
- *Cómo funciona:* «Imprimir o guardar en PDF», solo de una versión activada. El encabezado lleva la persona, el área,
  la versión, desde cuándo rige y el profesional. Lleva la leyenda «Datos de salud: tratalo con confidencialidad».
  Nunca un borrador ni lo que la persona no ve (ED-D14).
- *Pruebas:* TEST-EDP-040 (un borrador no se imprime; lo impreso es la instantánea).

**ED-56 · Comparar versiones y el motivo del ajuste**
- *Resuelve:* A04, A28, A29 y B05.
- *Toca:* `comparar-versiones.ts` (de ED-07), `versiones-del-plan.tsx` y `aplicar-la-revision.ts`.
- *Cómo funciona:* «Comparar con la vigente», en el «⋯». El borrador que nace de una revisión lleva una banda «Motivo
  del ajuste», con el fundamento y el enlace a la revisión.
- *Pruebas:* TEST-EDP-041.

**ED-57 · Bibliotecas en tabla**
- *Resuelve:* A31 y A32.
- *Toca:* `exercises/mis-ejercicios.tsx` y `templates/*`.
- *Cómo queda:* tabla por defecto (nombre, origen, zonas, imagen y en qué planes se usa); la galería, como opción.
- *Pruebas:* TEST-EDP-042.

**ED-58 · Revisiones, condensadas**
- *Resuelve:* A24, A25 y A27.
- *Toca:* `training/revisiones.tsx` y `nutrition/revisiones.tsx`.
- *Cómo queda:* una tabla de revisiones (fecha, resultado, próxima acción y estado) y el detalle en un cuadro;
  «Registrar la revisión» y «Preparar el borrador del ajuste», como dos actos encadenados y visibles, nunca automáticos.
- *Pruebas:* las de revisiones siguen verdes; TEST-EDP-043.

### 5.8 Los oráculos

Se escriben con sus trece campos en `WP-EDITORES-PROFESIONAL-ORACULOS.md`, antes del código de cada parte, como los de
`WP-FORMULARIOS-DE-INICIO-ORACULOS.md`. Cada comprobación negativa («la pantalla no dice X», «nunca suma cero») tiene su
mutación verificada. Son TEST-EDP-001 a 043 (los de las partes) y tres transversales:
- TEST-EDP-044: ningún texto nuevo dice «cumplimiento», «adherencia» ni «racha», tampoco en negación;
- TEST-EDP-045: ningún color nuevo dice bien o mal; los tokens nuevos tienen su par en `contraste.test.cjs`;
- TEST-EDP-046: lo que leen las APK instaladas no cambia (`lecturas-de-las-apk.int-spec.ts` en verde, sin tocar sus
  fijaciones).

## 6. Decisiones pendientes (DL-167)

Cada una con la recomendación y la alternativa. Las numera ED-D; las de la implementación, EDT-.

| ID | Pregunta | Recomendación | Alternativa |
|---|---|---|---|
| ED-D1 | ¿Cuándo el asistente y cuándo la estación? | Sin plan, «Crear el plan» abre el asistente. Con plan vigente, «Ajustar el plan» abre la estación, y «Rehacer con el asistente» queda en el «⋯». Quien prefiera el asistente lo tiene siempre a un clic | El asistente siempre primero: más pasos para el experto en cada ajuste |
| ED-D2 | ¿Qué trae BE como preset y quién lo valida? | Solo esquemas sin datos de la persona: estructuras (nombres y días sugeridos), prescripciones sin cargas, repartos en % y estructuras del día. Ningún ejercicio ni alimento elegido por BE; versionados en el dominio; Dirección los valida antes de publicarlos; rótulo «De BE · punto de partida, no una recomendación» | Presets de BE con ejercicios y alimentos: más rápido, pero BE elegiría el contenido de la prescripción (INV-06-143) y pediría validación disciplinar |
| ED-D3 | ¿Dónde se guardan los presets propios? | En lo que ya existe (plantillas, habituales y recetas), más dos modelos chicos: la prescripción habitual y el reparto habitual (ED-13) | Un modelo genérico «preset», con un JSON por tipo: un concepto nuevo que duplica plantillas y habituales |
| ED-D4 | ¿Un día tipo puede tener solo algunas comidas? (B07 y B23; §12.2 de la auditoría) | Sí: es decisión del profesional. Se dice como cuenta («Día de descanso: 1 comida») en «Antes de activar» y en el plan activo, sin color y sin bloquear | Una marca explícita «día parcial»: un campo nuevo que toca la API y lo que lee la app |
| ED-D5 | ¿Un día de referencia con totales? (B19; §12.3) | Sí, explícito: «Un día posible», con una opción por comida (la 1 por defecto, a la vista y cambiable), solo para el profesional y con su «Sin dato». Modifica la prueba de TB-39: de «las opciones nunca se suman como un total del día» a «las alternativas nunca se suman entre sí» | Lo ratificado en D-17 y D-20: estimación por opción y rangos por comida, sin total del día |
| ED-D6 | ¿Cómo son «al instante» los totales? | El editor calcula con la función del dominio (`SUM_SOURCE_PER_100G_V1`) apenas cambia una cantidad; al guardar, API-PLN-01 confirma, y una prueba asegura que dan lo mismo | Esperar a la API en cada cambio: con Render, cerca de un segundo por cambio |
| ED-D7 | La persona sin la app que muestra los objetivos por serie (A17) | La regla de la API queda mientras la estable sea la 0.13.2. El editor lo avisa al escribir el primer valor propio y ofrece «Pasar a objetivos generales», con vista previa. Cuando Dirección promueva a estable una versión que los muestre, se revisa el caso «todavía no abrió la app» con su DL | Relajar ya la regla para quien nunca abrió una app: si instala la 0.13.2, ve valores que no son los de sus series |
| ED-D8 | «2.400» en un campo (B03) | En los campos enteros (kcal, repeticiones y segundos), «2.400» se lee 2400 y se dice «Se guarda como 2400 kcal». En los decimales sigue DL-091. Es una función nueva del dominio; `leerNumero` no cambia | Dejar la regla como está: el aviso ya explica cómo escribirlo |
| ED-D9 | ¿«Persona» o «asesorado» en el website? | «Persona» en todo lo visible del website profesional, como en la app y en la ficha canónica. Los textos legales con versión cambian en su versión siguiente, y el legajo no se toca | Dejar «asesorado» en el website, que es el término del legajo |
| ED-D10 | Salir con cambios sin guardar | Si se puede guardar, guardar antes de salir y seguir; si no, preguntar, con «Seguir editando» como principal | Preguntar siempre |
| ED-D11 | La progresión por semana antes del 25/11 | Sobre los microciclos de hoy, con vista previa y sin regla guardada. La app muestra las semanas juntas, en orden, hasta TB-44 | Esperar a TB-43 y TB-44 (las semanas en el calendario y la app que muestra la que toca), que piden la API y una APK nueva |
| ED-D12 | Escalar una opción | A un número que escribe el profesional o al rango de la comida, proporcional, redondeo a 5 g y con vista previa; no en una opción de receta | Escalar también las porciones de una receta: un campo nuevo en la opción |
| ED-D13 | Listas de intercambio (modalidad B) | No antes del 25/11: piden un catálogo de grupos, un modelo, una app y validación. Mientras tanto, «Cambiar por un equivalente» (ED-52) | Empezar ahora con un catálogo de grupos chico |
| ED-D14 | El plan en PDF para la persona | Imprimir desde el navegador una versión activada, con encabezado y leyenda de confidencialidad; sin PDF en el servidor | Un PDF que genera la API, con auditoría: otra dependencia y otra operación |
| ED-D15 | Solicitudes que inicia la persona (C10; §12.6) | No crear la bandeja: la ayuda dice que el vínculo lo pide el profesional y lo acepta la persona | Una bandeja «Solicitudes recibidas», con autorización de las dos partes y su análisis legal |
| ED-D16 | Atajos y planilla | «Vista simple» por defecto y «Vista planilla» como preferencia del navegador; atajos visibles y nunca necesarios | La planilla como única vista de la estación |

**Las de la auditoría que el código ya resolvió** (se pide ratificar que el rediseño las conserve):
- la receta editada después no cambia el plan (`recipeVersionId`, DL-119);
- el descarte, solo de un borrador nunca activado (D-21, TB-47);
- la edición simultánea responde un conflicto explícito (DL-148).

## 7. Medición: antes y después

**El mismo script:** `flujos-de-planificacion.mjs`, con sus 73 tareas (A01-A32, B01-B27 y C01-C14, sin B28, que es un
anexo de una corrida anterior). Las tareas y sus códigos no cambian; cambian los selectores donde cambió la pantalla.
TEST-EDP-001 lo cuida con un hash de la lista. Se publica `flujos.json` antes y después, paso por paso.

**Lo que se mide igual:**
- los clics del paso y del camino, separando los desvíos;
- los campos completados;
- las acciones y los campos a la vista y en la página.

**Lo que cambia en el alto:** en la estación, la página mide una pantalla. El script mide el alto de cada zona
(`scrollHeight / clientHeight` de cada `[data-zona]`) y del cuadro abierto, y reporta el mayor. En el antes, el alto
sigue siendo el de la página.

**Las tareas nuevas van después de las 73, sin tocarlas:**
- AC01 a AC08: Martín crea el primer plan de Entrenamiento de Lucas Fernández, desde un preset, con el asistente;
- BC01 a BC08: Sofía crea el primer plan de Nutrición de Lucas, con el asistente.

**Las metas** son de diseño, no un ahorro demostrado: se dan por cumplidas solo con la corrida.

| Tramo del flujo A (Entrenamiento) | Hoy | Meta en la estación | Por qué |
|---|---|---|---|
| De la ficha al borrador (A03, A04, A07) | 3 | 1 | «Ajustar el plan» desde la tarjeta |
| Una sesión nueva (A08) | 3 | 1 | «+ Sesión», nombre y Enter |
| Los ejercicios (A11, A12, A14) | 3 | 3 | Abrir, marcar y «Agregar» |
| La prescripción (A15, A16) | 5 | 2 | Una línea y la nota |
| La agenda (A18) | 7 | 5 | Un chip por sesión, sin abrir ni cerrar un diálogo |
| Guardar y revisar (A19, A20) | 2 | 0 | Autoguardado y panel en vivo |
| Activar (A21, A22) | 3 | 3 | «Activar…», la fecha y la confirmación |
| **Total del camino** | **26** | **15 (meta: 14 a 18)** | |

| Tramo del flujo B (Nutrición) | Hoy | Meta en la estación | Por qué |
|---|---|---|---|
| El objetivo (B02 a B04) | 3 | 3 | Sin el desvío de «2.400» |
| Al borrador (B05, B06) | 2 | 1 | «Armar la versión del plan con este objetivo» |
| Día tipo, comida y opción (B07, B08) | 5 | 2 | «+ Comida» nace con su opción |
| El alimento (B09, B10) | 4 | 3 | Buscar, elegir y el estado en la fila |
| La receta (B11 a B18) | 18 | 10 | En un cuadro, sin salir ni volver |
| Corregir y revisar (B21) | 4 | 0 | El estado se pide al agregar; el panel, en vivo |
| Activar (B22, B23) | 3 | 3 | Igual |
| **Total del camino** | **39** | **22 (meta: 20 a 25)** | |

**Por el asistente,** el mismo cambio cuesta más clics, porque cada paso tiene su «Siguiente»: unos 19 en A y 23 en B.
Es el precio de guiar, y se mide aparte.

**El resto de las metas:**
- **C:** de la ficha a «Pedir información», de 4 clics a 1; el cuadro de C13, de 10,2 pantallas a 1, con las partes
  plegadas;
- **altos:** ninguna zona de edición ni cuadro pasa de 1,5 pantallas a 1440 × 900;
- **campos:** no más que hoy (A, 13; B, 17);
- **crear:** AC, 22 clics como máximo; BC, 25.

## 8. Plan de entregas hasta el 25/11

**Antes de programar:** el sí de Dirección a las partes, a las maquetas y a las decisiones (ACTA-DIR-034).

| Etapa | Fechas | Partes | Se integra | Se mide |
|---|---|---|---|---|
| 0 · Aprobación | mié 11 y jue 12 | ED-00; maquetas; ED-D1 a ED-D16 | Esta declaración, si Dirección la aprueba | La línea de base en `main` |
| 1 · P0 | jue 12 a sáb 14 | ED-01 a ED-08 | Sola: es solo website y no redespliega la API | A, B y C con el script |
| 2 · Lo común y Entrenamiento | dom 15 a mié 18 | ED-10 a ED-17 y ED-20 a ED-25; en la rama de la API, ED-13 | El website, con su CI y capturas | A y AC |
| 3 · Nutrición y pedir información | jue 19 a dom 22 | ED-30 a ED-34, ED-40 y ED-41; en la rama de la API, API-PLN-01 a 03 | La API en una sola ventana de redespliegue (sáb 21 o dom 22), y después el website | B, BC y C |
| 4 · Alta gama y cierre | lun 23 y mar 24 | Según el corte: ED-50, ED-51, ED-55 y ED-56, y después el resto de P2; la evidencia y la galería de capturas | Lo que esté verde | Todo, con la corrida final |
| Congelamiento | mié 25 | — | Nada más | — |

**El criterio de corte:**
- **las bases:** ED-03, ED-10, ED-14 y ED-15. Si una falla, se arregla antes de seguir;
- **las hojas,** que salen sin frenar a las demás: ED-41, ED-50 a ED-58 y la galería de ED-11 si no llegan sus
  modelos;
- **lo de la API** (ED-13 y API-PLN-01 a 03): si su rama no está verde el jue 20, pasa después del congelamiento.

  En ese caso:
  - la galería sale con los presets de BE y los propios que ya existen;
  - los totales se calculan solo en el website, rotulados como estimación del editor.

**Lo que no se toca en ninguna etapa:**
- `docs/legajo/**`, `docs/MANIFEST.sha256` y `render.yaml`;
- lo que leen las APK instaladas.

## 9. Riesgos

| Riesgo | Efecto | Qué se hace |
|---|---|---|
| **El plazo:** unas 40 partes en 14 días | Llegar al 25/11 con todo a medias | P0 se integra sola; etapas con corte; P2 por hojas; cada etapa deja algo usable |
| **Compite con la documentación de la tesis** | Dirección no llega a aprobar o probar, y la tesis se atrasa | Una aprobación por etapa, con la página de maquetas; las pruebas de Dirección, en 20 minutos por etapa y con guion; la tesis cita este paquete en lugar de describirlo de nuevo |
| **Dos caminos (asistente y estación)** | Doble superficie, comportamientos distintos | Comparten piezas; TEST-EDP-021 compara el borrador que deja cada uno |
| **Los presets de BE se leen como recomendación** | Pregunta del tribunal; choca con INV-06-143 | Sin ejercicios, alimentos ni cargas; rótulo; validación de Dirección (ED-D2) |
| **El límite de 16 KB (B28)** | Planes con cuatro semanas o muchas opciones no se guardan | Lo arregla el otro carril; ED-03 muestra el error recuperable; ED-50 espera ese arreglo |
| **El redespliegue de la API** | Cada redespliegue cierra la IP del operador en Render | Una sola ventana planificada con Dirección (etapa 3) |
| **La memoria de la máquina (5,9 GB)** | No se puede levantar el website ni la API locales | La CI hace las capturas y los recorridos; acá, renders de a uno |
| **La APK congelada el 25/11** | Las semanas se ven todas juntas hasta TB-44; los objetivos por serie siguen atados a la app | ED-D7 y ED-D11 lo dicen en pantalla; nada cambia lo que leen las APK |
| **La densidad de la estación** | Contraste, foco y zoom al 200 % se rompen | Contraste, T13 y recorridos por teclado en cada parte; capturas a 1280, 1440 y 1920 |
| **Medir con selectores nuevos** | Comparar tareas distintas | Las 73 tareas, congeladas con un hash; las nuevas, aparte |
| **Las partes de WP-TABLERO-ALTA-GAMA** | Declarar dos veces lo mismo | §11: este paquete programa TB-38, TB-39 y TB-46 dentro de la estación, y sus IDs se conservan como referencia |
| **«Persona» en textos que comparte la APK** | La próxima candidata cambia textos | Se listan antes; T13 en las dos superficies; los textos legales con versión, aparte |

## 10. Fuera de alcance

- Cambiar «¿Cuándo la revisás?» o «Sin fecha por ahora» (REG-06-145, TB-15).
- El arreglo del límite de 16 KB (otro carril).
- Mostrarle a la persona los rangos, el día posible, los presets o las estimaciones de una opción, salvo lo que ya ve.
- Una regla de progresión guardada que BE aplique sola, y cambiar una carga por lo que registró la persona.
- La modalidad B de intercambios (ED-53, solo declarada) y la bandeja de solicitudes recibidas (ED-D15).
- La APK, salvo los textos de «persona» en su próxima candidata.
- La cartera, «Te toca a vos», «Tu semana» y el Resumen de la ficha (WP-TABLERO-ALTA-GAMA).
- Las lecturas de registros (B24 y B25), que no son editores.

## 11. Relación con WP-TABLERO-ALTA-GAMA

| Parte del tablero | Estado en `main` | En este paquete |
|---|---|---|
| TB-38, lo que el profesional no ve al planificar | Declarada, sin programar | Se programa en ED-25 (Entrenamiento) y en ED-31 (Nutrición, API-PLN-01) |
| TB-39, los rangos de Nutrición | Declarada, sin programar | Se programa en ED-34, con la prueba modificada si se aprueba ED-D5 |
| TB-41, los días de cada día tipo | Declarada, sin programar | Fuera: si Dirección la quiere en el asistente, se suma al paso 3 de Nutrición |
| TB-43 y TB-44, las semanas del bloque | Declaradas, sin programar | ED-50 escribe sobre los microciclos de hoy; TB-43 y TB-44 siguen para después |
| TB-46, «Empezar el plan» en un solo cuadro | En parte | Es el paso 1 del asistente (ED-14), con «Desde un preset» como cuarta salida |
| TB-47, descartar un borrador | La API, integrada | ED-01 hace el website |
| TB-48, lo que se arregla en los editores | Terminada | Se conserva: duplicar, reordenar, topes y «Revisar el plan» |
| TB-54, el panel «Otras áreas» | Integrada | Es una pestaña del panel derecho de la estación |

## 12. Trazabilidad de las 74 posiciones de la auditoría

| Posición | Parte | Posición | Parte | Posición | Parte |
|---|---|---|---|---|---|
| A01 cartera | Fuera (TB-06 y TB-08); «persona», ED-06 | B01 ficha | ED-16 | C01 espacio | ED-41 |
| A02 ficha | ED-16 | B02 resumen y objetivo | ED-30, ED-34 | C02 invitar | ED-41 |
| A03 resumen | ED-16 | B03 «2.400» | ED-04, ED-D8 | C03 sin área | ED-04 |
| A04 vigente | ED-56, ED-16 | B04 objetivo guardado | ED-16 | C04 invitación lista | ED-41 |
| A05 plantilla de la activa | ED-12 | B05 vigente | ED-31, ED-56 | C05 esperan respuesta | ED-41 |
| A06 desde plantilla | ED-01, ED-11, ED-14 | B06 borrador | ED-15, ED-34 | C06 solicitar con errores | ED-04, ED-41 |
| A07 borrador | ED-03, ED-15 | B07 tipos de día | ED-33, ED-D4 | C07 solicitar completo | ED-04 (confirmado en código) |
| A08 agregar sesión | ED-24, ED-20 | B08 comida y opción | ED-33 | C08 enviada | ED-41 |
| A09 revisar con error | ED-07, ED-25 | B09 buscador | ED-31, ED-10 | C09 enviadas | ED-41 |
| A10 activar incompleto | ED-07 | B10 cantidad y estado | ED-31 | C10 recibidas | ED-D15 (no se crea) |
| A11 buscador | ED-21, ED-10 | B11 mis recetas | ED-32 | C11 pedir información | ED-40, ED-16 |
| A12 habituales | ED-21 | B12 receta con error | ED-04, ED-32 | C12 sin elegir | ED-04, ED-40 |
| A13 ejercicio propio | ED-21 | B13 buscador de la receta | ED-32, ED-10 | C13 elegido | ED-40, ED-05 |
| A14 sesión armada | ED-23 | B14 receta y cálculo | ED-32 | C14 pedido enviado | ED-40 |
| A15 prescripción | ED-22, ED-23 | B15 receta guardada | ED-32 | | |
| A16 objetivos por serie | ED-23 | B16 volver al borrador | ED-32, ED-15 | | |
| A17 la app de la persona | ED-08, ED-D7 | B17 receta como opción | ED-32 | | |
| A18 agenda | ED-24, ED-20 | B18 opción de receta | ED-31 | | |
| A19 plantilla del borrador | ED-12 | B19 totales | ED-31, ED-34, ED-D5, ED-D6 | | |
| A20 revisar antes de activar | ED-25, ED-07 | B20 revisar con error | ED-34 | | |
| A21 activar | ED-07; la fecha no cambia (regla vigente) | B21 corregido | ED-31, ED-34 | | |
| A22 activado | ED-07 | B22 activar | ED-07 | | |
| A23 cola | Fuera (TB-11 a TB-14) | B23 activado | ED-07, ED-D4 | | |
| A24 revisiones | ED-58 | B24 registros | Fuera (lectura) | | |
| A25 revisión vacía | ED-04, ED-58 | B25 registro y plan | Fuera (lectura) | | |
| A26 revisión llena | ED-04 (confirmado en código) | B26 descartar | ED-01 | | |
| A27 registrada | ED-58 | B27 duplicar día | ED-33 | | |
| A28 ajuste aplicado | ED-56 | B28 error de guardado | Otro carril (16 KB); cómo se ve, ED-03 | | |
| A29 borrador del ajuste | ED-56 | | | | |
| A30 descartar | ED-01 | | | | |
| A31 mis ejercicios | ED-57 | | | | |
| A32 plantillas y habituales | ED-11, ED-57 | | | | |
