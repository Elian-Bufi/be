# WP-EDITORES-PROFESIONAL — crear con un asistente, editar en una estación de trabajo

> **Estado:** APROBADO por Dirección el 2026-11-12 (00:30, Buenos Aires), con la página de maquetas v3 entera:
> - el alcance de las 53 partes (ED-00 a ED-76) y las maquetas v3 (ACTA-DIR-034);
> - las decisiones ED-D1 a ED-D21, como se recomendaban (§6.1);
> - las recomendaciones de Claude del 2026-11-11 (R1 a R13 de la página), que pasan a ratificadas por Dirección el
>   2026-11-12.
>
> Sobre R3, el RIR obligatorio de 0 a 2 en la serie observada, Dirección dijo: «de acuerdo con lo del RIR, aclarémoselo
> a los profesionales nomás». El website del profesional explica la regla en tres lugares (ED-72, ED-73 y ED-75), y la
> persona no ve nada de esto en la v1. La etapa 1 se programa desde el 2026-11-12 (§8). Las decisiones de producto se
> registran en DEUDA_LEGAJO **DL-167**; la del método de fuerza, en **DL-171**.
>
> *Antes:* DECLARADO el 2026-11-11 y actualizado el mismo día con el paquete V3 de ChatGPT y las decisiones de Dirección
> sobre su juicio (§6.2).
>
> **Encargo** (Dirección, 2026-11-11):
> - Que los editores del website sean «aptos para cualquiera, con las funciones de un profesional de alto nivel»; «menos
>   scroll»; «cada pantalla lleva a acciones claras».
> - Ante la auditoría de UX de los editores: «todo el rediseño antes de congelar la app el 25/11».
> - El mismo día, una dirección de diseño: «hacé intuitiva la creación de planes, que sean pequeñas pantallas o cuadros
>   cuando aparece mucha información, que sea un flujo de pantallas y cuadros para tomar decisiones, y que la carga de
>   presets sea fácil de usar e intuitiva».
> - Sobre el juicio del paquete V3, las decisiones DJ-1 a DJ-16 (§6.2). Entre ellas: **Epley v1 como el método de BE
>   para estimar la repetición máxima, en esta actualización** (DL-171); la app nueva guarda qué escribió la persona y
>   qué vino del plan (DJ-2); una sola entrada fija, «Revisar y activar…» (DJ-6); y el rango del día en Nutrición (DJ-4).
> - Las fuentes de esa estimación: la serie que observa el profesional y las series que escribió la persona. Y su uso
>   para planificar: el profesional elige un % y BE sugiere los kilos, con el redondeo a la vista, que él confirma.
> - El vidrio también en el website del profesional, dentro de este rediseño, con la línea de la APK (DL-170).
>
> **Fuentes:**
> - la auditoría de UX del website profesional (ChatGPT, 2026-11-11), con 74 posiciones (A01-A32, B01-B28, C01-C14);
> - las correcciones de Claude a esa auditoría (§4);
> - las capturas de la corrida del 2026-11-10 (`92c7c6c`, 1440 × 900, Azul noche), hechas con
>   `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/flujos-de-planificacion.mjs`, que vive en la rama
>   `wp-tablero-flujos-capturas`;
> - el código de `main` `bb757d9` y, para esta actualización, `f4ef3c4`;
> - el paquete V3 de ChatGPT (2026-11-11): seis documentos, una vertical de fuerza y láminas que no son normativas;
> - el juicio de Claude sobre V3 (2026-11-11), armado sobre siete revisiones y verificado en `main` `f4ef3c4`, solo
>   leyendo.
>
> La auditoría, las capturas, V3 y el juicio no están en el repo; lo que hace falta de ellos está acá (§4 y §13). Las
> maquetas están fuera del repo, en la página «Editores del profesional» de Dirección.
>
> **Esta declaración:** rama `wp-editores-profesional`, desde `main` `bb757d9`, con `main` traído hasta `f4ef3c4`
> (#249, #222, #252 y #254). No toca código ni migraciones.

## 0. Legajo y decisiones que cita

- **04:** RF-030 y RF-039 a RF-041 (diseñar, validar y activar los planes); RF-025 (la historia empieza con el
  profesional actual); RNF-ACC-001 (accesibilidad).
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
  - REG-06-158 (mostrar no redondea en silencio);
  - de la fuerza: REG-06-182 e INV-06-192 (la marca personal es observada; una estimación no se presenta como marca),
    REG-06-202 a 207 (el patrón de cálculo T-06-N12), INV-06-152 (la carga lleva unidad; nada se infiere) y 06:5431
    (B-08 no fija fórmula de repetición máxima ni convierte entre criterios).
- **08:** §11 (cada profesional ve la porción de sus alcances); C-11 y C-12 (el consentimiento); §27.3 (sin caché de
  autorización); §29 (la auditoría).
- **09:** los contratos de los planes (API-TRN-07 a 14 y API-NUT-07 a 12); API-SER-01 y 02 (los objetivos por serie y
  la capacidad del cliente); API-FRM-01 a 03 (pedir información); el registro de la ejecución (API-TRN-15 a 20);
  «Analizar» (API-PRJ-01); 09v10:356 («No se fija fórmula propia de estimación de RM»). La familia nueva API-FZA-01 a
  03 (la serie observada) la declara DL-171.
- **10:**
  - B10-04 (vínculo, consentimiento y privacidad);
  - B10-05 (Nutrición);
  - B10-06 (Entrenamiento: el plan nace de un objetivo vigente, y el objetivo, de una evaluación; la referencia del
    % RM, «1RM estimado por método X», B10-06:426-431);
  - B10-08 («1RM estimado como PR», excluido; «marca observada ≠ 1RM estimado», l. 87 y 122);
  - B10-10 (accesibilidad, textos y diseño adaptable).
- **11A:** TEST-PRJ-009 (nada califica) y TEST-PRJ-004 (nada se infiere). Los oráculos nuevos son TEST-EDP-001 a 067 y
  los del método, RM-01 a RM-43 (§5.8 y §5.9).
- **DL:**
  - DL-091 (los números en rioplatense) y DL-108, DL-109 y DL-119 (plantillas, habituales y recetas);
  - DL-122 (las capacidades del cliente), DL-131 (las preguntas vienen marcadas) y DL-137 D-7 (lo nuevo va en
    operaciones nuevas);
  - DL-126 (ninguna carga se llama 1RM) y DL-161 (la serie dice cómo se cargó);
  - DL-145, DL-146 y DL-148 («Empezar el plan», las ayudas y los borradores con autoguardado);
  - DL-152, con la enmienda de DL-169 (UF-00: cuenta solo la última APK distribuida, hoy la 0.23.0-candidata.2);
  - DL-163, con D-13 (la matriz §3.1), D-17 a D-21 y las partes TB-38, TB-39, TB-41, TB-43, TB-46, TB-47 y TB-48 de
    WP-TABLERO-ALTA-GAMA;
  - DL-164 y DL-165 (los formularios de inicio) y DL-166 PV-4 (la regla de los desplegables);
  - DL-168 (el límite de 16 KB, resuelto) y DL-170 (el vidrio de la APK, «el del website va en WP-EDITORES-PROFESIONAL»);
  - **DL-167, nueva**, con este paquete, y **DL-171, nueva**, con el método de fuerza.
- **La guía:** `docs/ux/GUIA-UX-UI.md`. Suma dos pautas (ED-10 y ED-14), el cuadro enfocado y el asistente, y cambia
  una: II.2, «Superficies mates», pasa a la receta del vidrio (ED-18).

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
| Salir del editor con cambios | Recargar avisa; un enlace interno (por ejemplo «Mis recetas») no avisa; el editor de recetas y las plantillas, nada | Guarda antes de salir o pregunta, en todos los editores |
| Guardar | «Guardado» solo con el servidor, pero el autoguardado reintenta cada 4 s un error que no se arregla solo, y una respuesta perdida puede terminar en un conflicto falso | Un error permanente espera un cambio; una respuesta perdida no da conflicto; «Guardar ahora», fijo junto al estado |
| Los totales de Nutrición | No existen: solo el objetivo general | La estimación de cada opción al instante y el rango del día (DJ-4) |
| Activar | La imposibilidad aparece después de abrir la confirmación; la app de la persona bloquea al final; un 409 da un error genérico | «Revisar y activar…», fijo, abre «Antes de activar», que dice todo antes: lo que impide, lo que cambia, lo que ve la persona, su app en una línea y la fecha |
| La fuerza | «Analizar» muestra la carga y un RIR que puede ser el del plan; BE no estima la repetición máxima | La estimación Epley v1, solo para el profesional, desde una serie que observó o que la persona escribió; los kilos desde un %, con su confirmación |
| La apariencia | Mate (GUIA II.2) | Vidrio, con la línea de la APK (ED-18) |

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
  Lo deducido es una sugerencia: el indicador muestra los siete pasos y el profesional elige (V3 X-01).
- **Salir a la estación:** «Seguir en la estación» está en el pie de cada paso; el borrador es el mismo, y lo que el
  asistente no muestra (los valores propios de una serie, las notas) sobrevive a pasar por él (ED-14).
- **La regla de B10-06 queda:** el plan nace de un objetivo vigente, y el objetivo, de una evaluación. Si falta alguno,
  el asistente empieza por ahí, con la pieza «Empezar el plan» de hoy (DL-145).

| Paso | Entrenamiento | Nutrición |
|---|---|---|
| 1 | **Punto de partida**, en tarjetas grandes y sin nada elegido: «Copiar el plan vigente», «Desde una plantilla», «Desde un preset», «En blanco» | Lo mismo |
| 2 | **Estructura:** cuántas sesiones y sus nombres; un preset de estructura («Torso / Piernas · 4 días») las escribe | **Objetivo:** el vigente («Objetivo general», con su versión y su fecha), o una versión nueva con el reparto en gramos (ED-30, DJ-7) |
| 3 | **Ejercicios por sesión:** el buscador en un cuadro, eligiendo varios a la vez; una sesión habitual se suma con un clic | **Tipos de día:** uno o «Entrenamiento y descanso», con sus días de la semana si Dirección habilita TB-41 |
| 4 | **Prescripción con un preset** («Hipertrofia 4×8-12 RIR 2», «Fuerza 5×5», «Resistencia 3×15» o uno propio), editable después | **Comidas,** con presets de estructura del día («4 comidas», «5 con colación») y las comidas habituales |
| 5 | **Días de la semana** de cada sesión | **Opciones y alimentos,** en un cuadro por opción, con los totales al instante |
| 6 | **Revisar:** lo que impide activar y lo que queda sin completar, cada cosa con su lugar | Lo mismo |
| 7 | **Activar:** el cuadro «Antes de activar» (ED-07) | Lo mismo |

### 2.2 La estación de tres zonas (editar) — Alternativa B de la auditoría

A 1440 × 900:
- **El marco del área, en una fila:** volver, el nombre de la persona y el área, las secciones y el acceso.
- **La barra de comandos, fija, con cada acción siempre en el mismo lugar** (DJ-6; V3 01 §0):
  - la versión («Versión 9 · en preparación · Diego no la ve») y el selector con la activa. El borrador lleva número:
    hay uno solo por plan, así que es el de las activadas más uno (DJ-6 cambia la regla «un borrador no tiene número»);
  - el estado de guardado (ED-03) y, a su lado, **«Guardar ahora»**, fijo y secundario: guarda sin esperar la pausa, y
    está apagado, con su motivo, cuando no hay nada que guardar;
  - **«Revisar y activar…»**, la única entrada a activar, fija y llena: abre «Antes de activar» (ED-07). No cambia de
    nombre ni de lugar mientras se escribe, y nunca pasa a ser «Guardar»;
  - «⋯» («Guardar como preset», que guarda el plan como plantilla, o una sesión, una comida o unas series, ED-12;
    «Comparar con la vigente», «Rehacer con el asistente» y «Descartar la versión en preparación»).
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
| Estructura (sesiones o días) | «Cuerpo entero · 3 días», «Torso / Piernas · 4 días», «Empuje / Tirón / Piernas · 6 días» (solo nombres y días sugeridos) | Una plantilla de plan sin ejercicios (TPL) | No: la plantilla usa la misma estructura de entrada que el borrador (`contratos-plantillas.ts`), que admite sesiones vacías; una prueba lo confirma al programar, con su EDT |
| Sesión con ejercicios | — (BE no elige ejercicios: ED-D2) | **Sesiones habituales** (HAB, DL-109): ya existen | No |
| Ejercicio | — | **Ejercicios habituales** (HAB): ya existen | No |
| Prescripción (series × repeticiones, RIR, descanso) | «Hipertrofia 4×8-12 · RIR 2 · 90 s», «Fuerza 5×5 · RIR 2 · 3 min», «Resistencia 3×15 · RIR 3 · 45 s», «Técnica 3×8 · RIR 4» (sin cargas) | **Prescripciones habituales** | **Sí:** ED-13 (API-HAB-06 a 08, una tabla) |
| Plan entero (Nutrición) | — | **Plantillas de plan** (TPN, DL-108): ya existen | No |
| Reparto de macros del objetivo | — (sin «%» antes del 25/11: DJ-7. Pasar un % a gramos usaría 4/4/9 sin decirlo, y el «%» está prohibido en los textos de Nutrición) | **Repartos habituales,** en gramos, como los escribe el profesional | **Sí:** ED-13 (API-HAN-06 a 08, una tabla) |
| Tipos de día | «Un solo día tipo», «Entrenamiento y descanso» (nombres) | Una plantilla de plan (TPN) | No |
| Estructura del día («comida tipo») | «4 comidas», «5 comidas con colación», «6 comidas» (nombres, con la opción 1 vacía) | **Comidas habituales** (HAN, DL-109): ya existen, con sus alimentos | No |
| Alimento | — | **Alimentos habituales** (HAN): ya existen | No |
| Preparación | — | **Mis recetas** (REC, DL-119): ya existen, con sus versiones | No |

**Los presets de BE de Entrenamiento son siete:** tres estructuras, cada una con sus días sugeridos («Cuerpo entero ·
3 días», «Torso / Piernas · 4 días» y «Empuje / Tirón / Piernas · 6 días»), y cuatro prescripciones («Hipertrofia
4×8-12 · RIR 2 · 90 s», «Fuerza 5×5 · RIR 2 · 3 min», «Resistencia 3×15 · RIR 3 · 45 s» y «Técnica 3×8 · RIR 4»).
Recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12. Sigue valiendo ED-D2: Dirección los valida
antes de publicarlos.

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

### 2.6 Los estados, en dos ejes

V3 propone una máquina de nueve estados que mezcla dos cosas (02 §F). En BE son dos ejes que se combinan, más los
transitorios del acto de activar y lo que corta el trabajo. No hay un estado «revisado sin bloqueos»: validar es la
condición de activar, no algo que se guarda (`schema.prisma`, la versión del plan).

| Eje | Estados | De dónde sale | Qué se puede y qué no |
|---|---|---|---|
| **El guardado** (la pantalla) | «Guardando…» · «Guardado a las 14:32» («Guardado», sin hora, después de recargar: DJ-10) · «Pendiente de guardar» (o «… falta completar algo») · «No se pudo guardar» (sin respuesta, demasiado grande u otro rechazo) · el conflicto («cambió en otra pestaña») | `estadoDeGuardado` y `falloDeGuardado` (`@be/domain`) | «Guardado» solo con la respuesta del servidor. Con un fallo o un conflicto, lo escrito sigue en pantalla y nada se guarda en el navegador (DL-148 D-5) |
| **La versión** (el servidor) | En preparación (el borrador, «Versión 9 · en preparación») · activada (la vigente o una del historial) · descartada | El estado de la versión del plan | El borrador se edita, y se descarta si nunca se activó (TB-47). Una activada no se edita ni se descarta: la sucede otra |
| **El acto de activar** | Activando · resultado incierto (no hubo respuesta) | ED-07 y ED-62 | Con el resultado incierto, se relee la versión antes de repetir, con la misma clave |
| **Lo que corta** | Acceso retirado · sesión perdida · falta completar | `accesoRetirado`, `sesionPerdida` y `loQueNoDejaGuardar` | Se dice qué pasó; nunca un «Guardado» |

### 2.7 El vidrio del website

Dirección lo pidió el 2026-11-11 dentro de este rediseño, con la misma línea que la APK (WP-APP-VUELTA-2, DL-170):
- **el fondo,** un degradé con dos destellos suaves;
- **las superficies,** translúcidas, con un borde fino de luz y un brillo arriba que se apaga a la mitad;
- **el resplandor,** solo en el botón principal, que es uno por vista;
- **el cian, solo para lo que se toca:** enlaces, casillas y botones. No va en bordes de tarjetas ni en títulos (GUIA
  I.6), y el foco sigue siendo ámbar;
- **`backdrop-filter`, con criterio:** en la barra de comandos, los cuadros enfocados y el panel; nunca en la planilla
  ni en una tabla con muchas filas, que siguen opacas para leer bien y para que el desplazamiento no se trabe.

Lo programa ED-18, y cambia la pauta II.2 de la guía («Superficies mates»).

## 3. Lo que no se rompe

- **Versión privada → revisar → activar con confirmación, e historial.** El plan vigente es de solo lectura; se cambia
  con una versión nueva que la persona no ve hasta activarla. Guardar no activa, y cada versión activada queda en el
  historial con su instantánea (UC-I04).
- **«Revisar» no juzga la calidad:** dice lo que impide activar y lo que queda sin completar, sin evaluar el programa
  ni la dieta.
- **«¿Cuándo la revisás?» no cambia,** con «Sin fecha por ahora» incluida (REG-06-145 y TB-15): es una regla vigente,
  no un defecto (§4).
- **Lo que lee la APK no cambia sin una decisión** (DL-152, con la enmienda de DL-169: cuenta solo la última APK
  distribuida, hoy la 0.23.0-candidata.2). Lo nuevo va en operaciones nuevas (DL-137 D-7). La única excepción de este
  paquete es la que decidió Dirección: la procedencia por campo (ED-70, DJ-2), que la API acepta primero y la candidata
  del 25/11 manda. La 0.23.0-candidata.2 no lee una ejecución registrada con ella: es el caso que ya declaró DL-161.
- **Lo indicado no es fuerza** (DL-171). Una estimación sale solo de una serie que escribió la persona o que observó el
  profesional, nunca de una prescripción ni de un valor que vino del plan. Es una estimación: nunca una
  marca, nunca se celebra, nunca dispara un aviso, nunca la ve la persona y nunca invita a hacer un máximo.
- **BE sugiere, el profesional decide:** los kilos que salen de un % (ED-76) se escriben solo con su confirmación, y
  ninguna estimación nueva cambia una carga ya escrita.
- **Sin «cumplimiento», «adherencia» ni «racha»,** tampoco en negación (B05 del encargo del 23/10). **El cuerpo no se
  califica:** ningún color dice bien o mal; lo que cae fuera de un rango se dice con palabras.
- **BE no calcula el requerimiento** (INV-06-133) **ni escribe por su cuenta:** los presets y las ayudas (escalar,
  progresión, copiar) escriben solo cuando el profesional las toca, con vista previa.
- **Un hueco no es un cero:** «Sin dato» nombra qué falta (`SUM_SOURCE_PER_100G_V1`).
- **Nada viene elegido** en una decisión del profesional (el punto de partida, la fecha, las preguntas obligatorias que
  la plantilla no sugiere).
- **Las preguntas de un pedido vienen marcadas como las trae la plantilla** (DL-131; desde DL-165 D-4, el embarazo
  viene sin pedir): compactar el cuadro no cambia qué se pide ni el consentimiento.

## 4. Lo que dice la auditoría y lo que verificamos

**Las correcciones de Claude, obligatorias:**
- **A21, «Sin fecha por ahora», no es un defecto.** Es la regla vigente (REG-06-145 y TB-15). La pregunta 1 de la §12
  de la auditoría no se toma.
- **B28 (no se guardaba una versión con un día duplicado) ya está resuelto** (DL-168, integrada en `main` con #252 y
  #254): el límite de 16 KB por pedido pasó a 700 KB en las diez escrituras de planes, plantillas y recetas, el rechazo
  trae TOO_BIG y los editores lo dicen sin borrar lo escrito (`apps/api/src/http/limite-de-cuerpo.ts`;
  `falloDeGuardado`). ED-03 ya no depende de otro carril. Quedan los habituales, todavía en 16 KB (ED-64).
- **Descartar el borrador:** la API existe (API-PLE-05 y API-PLN-07, TB-47, integradas el 2026-11-07), y el cliente
  también (`cliente-http.ts:915` y `:1237`). Falta el website (ED-01).
- **A17, el bloqueo de «Activar» por la app de la persona, pasa a ser un aviso** (DJ-5). La API exige que la persona
  haya usado una app que muestre los objetivos por serie (`titularCapaz`,
  `apps/api/src/entrenamiento/compatibilidad-de-clientes.ts`). Desde el 11/11 cuenta solo la 0.23.0-candidata.2, que
  los muestra (DL-169, UF-00), y quien instale va a tener la última: el único caso que queda es el de la persona que
  todavía no abrió la app. Activar deja de esperarla y el editor lo dice en una línea (ED-08). La entrega a un cliente
  sin la capacidad sigue retenida, como hoy.
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

**Lo que destapó la revisión de V3, confirmado en el código** (§13; partes nuevas, todas P0):
- el autoguardado vuelve a intentar cada 4 s ante un error que no se arregla solo (ED-60);
- una respuesta perdida puede terminar en un conflicto falso, y «Cargar la versión guardada» descarta lo escrito
  después: es pérdida de datos (ED-61);
- activar con un 409 o un 422 da «No pudimos activar el plan. Probá de nuevo.», y reintentar da lo mismo (ED-62);
- «Analizar» llama «declarado» a un RIR que pudo venir del plan (ED-63);
- los habituales siguen con 16 KB (ED-64);
- el editor de recetas y las plantillas no avisan al salir con cambios (ED-65).

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
| ED-07 | «Antes de activar»: una sola entrada fija | P0 | A09, A10, A20-A22, B20, B22, B23; V3 V-01 y V-02 | No |
| ED-08 | La app de la persona: un aviso, no un bloqueo | P0 | A17, con DJ-5 | **Sí:** API-TRN-12 deja de esperar la capacidad |
| ED-60 | El autoguardado no insiste ante un error que no se arregla solo | P0 | V3 PR-B; hallazgo | No |
| ED-61 | Sin conflicto falso por una respuesta perdida | P0 | V3 X-02; hallazgo | No |
| ED-62 | Activar después de un 409 o un 422 | P0 | V3 V-02; hallazgo | No |
| ED-63 | El RIR de «Analizar» dice de dónde sale | P0 | hallazgo | No |
| ED-64 | Los habituales grandes se guardan | P0 | hallazgo | **Sí:** API-HAB-04 y 05 y API-HAN-04 y 05, a 700 KB |
| ED-65 | Recetas y plantillas avisan al salir con cambios | P0 | V3 X-02; hallazgo | No |
| ED-10 | El cuadro enfocado | P1 | A11, B13, C13 | No |
| ED-11 | La galería de presets, con alcance y vista previa | P1 | A06, A32; V3 E-04 y E-05, con DJ-8 | No |
| ED-12 | «Guardar como preset» con lo que ya existe | P1 | A05, A19; DJ-11 | No |
| ED-13 | Los dos presets propios nuevos: prescripción y reparto | P1 | nuevo | **Sí:** API-HAB-06 a 08, API-HAN-06 a 08 y dos tablas |
| ED-14 | El asistente: pasos, «Paso N de 7», volver, retomar y salir a la estación | P1 | nuevo, A06-A08, B06-B08; V3 X-01 | No |
| ED-15 | La estación de tres zonas y su barra de comandos fija | P1 | A07, A14, B06, §6.1 de la auditoría; DJ-6 | No |
| ED-16 | Las entradas desde la ficha: crear, ajustar o seguir | P1 | A02, A03, B01, B02, B04, C11 | No |
| ED-17 | Las ayudas, una sola vez | P1 | nuevo | No |
| ED-18 | El vidrio del website | P1 (hoja) | pedido de Dirección (DL-170) | No |
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
| ED-70 | La procedencia por campo en la app | **P0** (la APK se congela el 25/11) | DJ-2; V3 F-03 | **Sí:** un campo opcional en API-TRN-15 a 20, sin migración; y la APK |
| ED-71 | El método Epley v1 | P1 | DJ-1; V3 F-02 | No (dominio) |
| ED-72 | La serie observada por el profesional | P1 | la fuente (a) de Dirección; V3 F-03 | **Sí:** API-FZA-01 a 03 y una tabla (la migración solo agrega) |
| ED-73 | «Cómo se calculó» | P1 | V3 F-02 | No |
| ED-74 | La evolución de fuerza por ejercicio | P1 | V3 F-01 | **Sí:** una clave nueva de API-PRJ-01, sin migración |
| ED-75 | La tarjeta de fuerza en el detalle del ejercicio | P1 | V3 E-03 | No |
| ED-76 | Usar la estimación para planificar: del % a los kilos | P1 | la fuente (c) de Dirección; reemplaza DJ-12 | No (escribe con API-TRN-10, como hoy) |

Son 53 partes: las 39 de la declaración, la del vidrio, seis P0 que destapó V3 y siete de la vertical de fuerza (§5.8).

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
- *Suma V3:*
  - **la definición de terminado de diez puntos** (V3 05 §D), al principio de `WP-EDITORES-PROFESIONAL-ORACULOS.md`: cada
    botón con su función, estado, alcance, permiso y respuesta ante un error; lo guardado vuelve sin pérdida; los
    totales salen de la fuente; teclado, foco, lector, contraste y zoom al 200 %; capturas a 1280, 1440 y 1920; lo que
    ve la app; el historial; los textos; las pruebas; y la integración con su aprobación;
  - **la línea de base de accesibilidad** de los editores de hoy (teclado, lector de pantalla y zoom al 200 %), que
    nadie midió todavía;
  - **pruebas de uso de 20 minutos con guion,** con un perfil experto y uno principiante (y, si alcanza, una
    nutricionista y un acceso limitado), con la cohorte sintética y «Ocultar nombres». Se anotan el tiempo, los errores
    y dónde se trabó, sin atribuirles evidencia clínica.

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
- *Suma V3:* si «descartar y crear» (empezar desde una plantilla con un borrador abierto) falla a mitad, el cuadro dice
  qué quedó hecho y ofrece reintentar la creación; nunca deja al profesional sin saber si hay borrador.
- *Pruebas:* un recorrido de navegador (cancelar, descartar y después empezar desde una plantilla, y «descartar y crear»
  con la creación que falla); TEST-EDP-002 (la vigente nunca ofrece descartar, y un segundo clic reusa la misma
  `Idempotency-Key`).

**ED-02 · Salir con cambios sin guardar**
- *Evidencia:* confirmado en código (§4); hipótesis en uso real: la captura B11 guardó antes de salir.
- *Toca:*
  - `marco-del-area.tsx` (`useCambiosSinGuardar` suma la guardia de la navegación interna);
  - `components/navegacion.tsx`;
  - `lib/autoguardado.ts` (guardar ya, sin esperar la pausa);
  - un `components/salida-segura.tsx` nuevo.
- *Dado* un editor con cambios, *cuando* el profesional toca un enlace interno, *entonces* (ED-D10, reescrita):
  - si se puede guardar, aparece «Guardando antes de salir…» y se sale con la respuesta del servidor;
  - si no se puede, falla o hay conflicto, un cuadro «Tenés cambios sin guardar», con «Seguir editando» (principal) y
    «Salir sin guardar»;
  - nunca se pierde nada en silencio, y nada se guarda en el navegador (DL-148).
- *Suma V3:* la guardia usa el `onNavigate` de `<Link>` en la barra, las pestañas de la ficha y el marco del área.
  «Atrás» del navegador queda como un límite declarado. El editor de recetas y las plantillas, que hoy no tienen
  guardia, van en ED-65.
- *Pruebas:* un recorrido (escribir y, al segundo, ir a «Mis recetas»: el cambio está al volver), otro con la red
  cortada y otro con un 409; TEST-EDP-003.

**ED-03 · El estado de guardado, inequívoco, y el error recuperable**
- *Resuelve:* A07; de B28, cómo se ve el error.
- *Evidencia:* confirmado en capturas (B28, antes de DL-168: «El servicio no está disponible», sin salida) y en código
  (`estadoDeGuardado` y `falloDeGuardado` ya distinguen los estados y los tres fallos de DL-168; faltan el lugar fijo,
  «Reintentar» y el detalle).
- *Toca:* `training/editor.tsx`, `nutrition/editor.tsx`, el componente del estado de guardado y `lib/fallas.ts`.
- *Los estados de la barra* son los textos del dominio (`COPY_GUARDADO`), con texto e ícono, nunca solo color. Si uno
  cambia, cambia ahí y se declara en DL-167:
  - «Pendiente de guardar» (o «Pendiente de guardar: falta completar algo»);
  - «Guardando…»;
  - «Guardado a las 23:34», solo con la respuesta del servidor; después de recargar, «Guardado», sin hora (DJ-10);
  - los tres fallos de DL-168, con el detalle técnico plegado (la operación y el código, sin datos de la persona) y
    «Reintentar»: sin respuesta («No pudimos guardar los cambios. Tus cambios siguen acá. Reintentá.»), demasiado grande
    y el rechazo propio de cada caso;
  - «No se pudo guardar: se reintenta al seguir editando o con «Guardar cambios»» (`noSePudoReintento`) pasa a nombrar
    «Reintentar», la acción que tiene al lado: con DJ-6, «Guardar cambios» deja de existir. Es un cambio de
    `COPY_GUARDADO`, declarado en DL-167 (la declaración decía «Guardar ahora», que hace lo mismo que «Reintentar»: lo
    corrigió la revisión adversaria de la etapa 1);
  - la barra dice cada fallo con su texto, por su motivo (`COPY_GUARDADO.falloEnLaBarra`), también el del autoguardado:
    sin respuesta, el de DL-168; demasiado grande, «No se pudo guardar: es demasiado grande. Tus cambios siguen acá.»,
    con el aviso que dice qué hacer; el rechazo, «No se pudo guardar: no se aceptó el cambio. Tus cambios siguen acá.»;
  - el conflicto de DL-148, con «Cargar la versión guardada», solo si es real (ED-61).
- *Dado* un guardado que falla sin respuesta, *cuando* el profesional toca «Reintentar», *entonces* se reintenta con lo
  que está en pantalla, y «Activar la versión…» sigue apagado, con su motivo, hasta guardar.
- *Ya no depende de otro carril:* el límite está resuelto (DL-168). El reintento sin fin y el conflicto falso son ED-60 y
  ED-61.
- *Pruebas:* un recorrido con la API que responde 503 y después 200; TEST-EDP-004 («Guardado» nunca aparece sin la
  respuesta del servidor, y los textos son los de `COPY_GUARDADO`).

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

**ED-07 · «Antes de activar»: una sola entrada fija**
- *Resuelve:* A09, A10 y A20-A22; B20, B22 y B23; V3 V-01 y V-02, en un solo cuadro (DJ-6).
- *Evidencia:* confirmado en capturas (A10: la imposibilidad aparece después de elegir la fecha) y en código
  (`abrirLaActivacion`).
- *Toca:*
  - `training/editor.tsx` y `nutrition/editor.tsx`;
  - `cuando-la-revisas.tsx` (no cambia su regla);
  - `versiones-del-plan.tsx`;
  - un `antes-de-activar.tsx` y un `comparar-versiones.ts` nuevos, en el website y sin React.
- *La entrada:* «Revisar y activar…», fija en la barra (ED-15). Abre el cuadro siempre, también con algo por corregir:
  el cuadro valida al abrirse (lo local al instante y después la validación de la API) y dice qué impide activar.
- *El cuadro tiene cinco partes, y un solo botón principal: «Activar la versión 9 de Entrenamiento»:*
  1. **lo que impide activar,** cada cosa con «Ir a corregir», que lleva a su lugar (la celda, la comida o el paso) y
     vuelve. Mientras haya algo, el principal está apagado y dice por qué («Falta corregir 1 cosa»). Lo que queda sin
     completar y no impide se dice aparte, sin bloquear;
  2. **lo que cambia** frente a la vigente, con contadores («2 modificados · 1 agregado · 0 quitados») y la lista
     («+1 sesión · Tren superior liviano», «Sentadilla: 4×3 → 4×6-8»);
  3. **lo que va a ver la persona,** por día o por sesión, con las cuentas en palabras («Día de descanso: 1 comida
     incluida»);
  4. **su app,** en una línea, si todavía no la abrió (ED-08);
  5. **«¿Cuándo la revisás?»,** igual que hoy, con «Sin fecha por ahora» y nada elegido.
- *Con cambios sin guardar,* el cuadro ofrece primero «Guardar ahora», y el principal sigue apagado hasta la respuesta
  del servidor (V3 V-02).
- *Dado* un borrador con una sesión sin ejercicios, *cuando* el profesional toca «Revisar y activar…», *entonces* el
  cuadro abre con «Tren superior liviano: sin ejercicios · Ir a corregir», y «Activar la versión 9 de Entrenamiento»
  está apagado, con su motivo.
- *Dado* un borrador listo, *cuando* activa, *entonces* el cuadro dijo antes «La versión 8 queda en el historial», y la
  vigente pasa a decir «Versión 9 vigente desde hoy · Diego ya la ve», con «Ver lo que recibe».
- *Un 409 o un 422 al activar* va por ED-62.
- *Pruebas:*
  - unitarias de `comparar-versiones` (los contadores salen de la diferencia, nunca de un texto);
  - TEST-EDP-008: la validación final sigue siendo de la API, el principal no se enciende con algo por corregir y «Sin
    fecha por ahora» sigue disponible;
  - TEST-EDP-009: el resumen no califica, con T13 y sin color de estado.

**ED-08 · La app de la persona: un aviso, no un bloqueo**
- *Resuelve:* A17, con DJ-5.
- *Evidencia:* confirmado en capturas (A17) y en código: activar un plan con objetivos por serie espera que la persona
  haya abierto una app con la capacidad (409 CLIENT_CAPABILITY_REQUIRED; `compatibilidad-de-clientes.ts` y
  `entrenamiento/planes.service.ts`).
- *Toca:*
  - la API: API-TRN-12 deja de esperar ese registro. La entrega a un cliente sin la capacidad sigue retenida, como hoy,
    y API-SER-01 sigue diciendo si la persona ya abrió la app;
  - `training/editor.tsx`, `antes-de-activar.tsx` y `copy-*.ts` (`COPY_COMPATIBILIDAD_DE_CLIENTES`, con el nombre);
  - `compatibilidad-de-clientes.int-spec.ts`, que cambia por decisión y con su mutación.
- *Dado* Diego, que todavía no abrió BE, *cuando* Martín activa un plan con objetivos por serie, *entonces* el plan se
  activa, y «Antes de activar» dijo en una línea: «Diego todavía no abrió BE: cuando instale la app, va a ver las series
  así.»
- *Va en* la ventana del vie 20, la de lo que cambia la conducta de la API (§8). Hasta entonces, si el 409 aparece,
  ED-62 lo dice con su texto.
- *Pruebas:* TEST-EDP-010 (activar no espera la capacidad; la entrega a un cliente sin ella sigue retenida; el aviso
  aparece una vez y no bloquea).

**Lo que destapó V3: seis defectos del código actual, P0**

**ED-60 · El autoguardado no insiste ante un error que no se arregla solo**
- *Resuelve:* el reintento cada 4 s (V3 PR-B: «no convertir un error de tamaño en reintento infinito»).
- *Evidencia:* confirmado en código, sin reproducir todavía. `habilitado` no mira el fallo: cuando un guardado falla,
  `guardando` vuelve a `false`, el efecto se rearma y el autoguardado reintenta a los 4 s (`lib/autoguardado.ts`;
  `training/editor.tsx`, donde se llama a `useAutoguardado`). Con un plan grande, cada intento sube hasta 700 KB y deja
  un rechazo auditado.
- *Toca:* `lib/autoguardado.ts`, `training/editor.tsx` y `nutrition/editor.tsx`.
- *Dado* un guardado rechazado por tamaño o por otro motivo del contrato (`DEMASIADO_GRANDE` u `OTRO`), *cuando* el
  profesional no cambia nada, *entonces* no hay otro intento hasta que cambie lo escrito o toque «Reintentar».
- *Dado* un guardado sin respuesta (`SIN_RESPUESTA`), *cuando* sigue sin conexión, *entonces* los intentos se espacian
  (4, 8, 16, 32 y 60 s, y después cada 60 s), y vuelven a 4 s con el evento `online` o con un cambio.
- *Pruebas:* TEST-EDP-047, con temporizadores falsos: un solo intento por cambio después de `DEMASIADO_GRANDE`; la
  espera creciente después de `SIN_RESPUESTA`. Con la regla de hoy, la prueba falla (mutación).

**ED-61 · Sin conflicto falso por una respuesta perdida**
- *Resuelve:* una pérdida de datos que V3 pidió probar («respuesta fuera de orden», «fallo después de confirmación»).
- *Evidencia:* confirmado en código, sin reproducir. Ante un 409 por versión, el editor relee y compara con el cuerpo
  que acaba de mandar (`training/editor.tsx`, el caso `VERSION_CONFLICT`). Si se perdió la respuesta de un guardado y el
  profesional siguió escribiendo, lo guardado es suyo pero ya no es idéntico: aparece «cambió en otra pestaña», y
  «Cargar la versión guardada» descarta lo escrito después.
- *Toca:* `training/editor.tsx`, `nutrition/editor.tsx` y una función nueva sin React (`es-lo-que-mande.ts`).
- *Dado* un guardado cuya respuesta se perdió, *cuando* el siguiente da 409, *entonces* el editor relee la versión y la
  compara, sin los identificadores que puso el servidor, con cada cuerpo que mandó desde esa pantalla y no tuvo
  respuesta:
  - si coincide con uno, adopta la versión del servidor (su token y sus identificadores) y vuelve a mandar lo escrito
    después, sin conflicto;
  - si no coincide con ninguno, es un conflicto real (DL-148), y «Cargar la versión guardada» avisa que reemplaza lo que
    está en pantalla.
- *Alternativa* (EDT, si la comparación no alcanza): una `Idempotency-Key` en API-TRN-10 y API-NUT-10, que es un cambio
  de API.
- *Pruebas:* TEST-EDP-048 y el recorrido «respuesta perdida» (la red corta la respuesta, el profesional escribe y el
  siguiente guardado da 409): termina guardado, sin el aviso de conflicto y sin perder lo escrito.

**ED-62 · Activar después de un 409 o un 422**
- *Resuelve:* V3 V-02: «si una activación se procesó pero se perdió la respuesta, se debe consultar el estado antes de
  repetir».
- *Evidencia:* confirmado en código: un 409 o un 422 al activar da «No pudimos activar el plan. Probá de nuevo.», y
  reintentar da lo mismo (`training/editor.tsx`, el final de la activación); «Volver» descarta la clave
  (`lib/intento.ts`).
- *Toca:* `training/editor.tsx`, `nutrition/editor.tsx`, `lib/intento.ts` y `antes-de-activar.tsx`.
- *Dado* un 409 o un 422 al activar, o una activación sin respuesta, *cuando* vuelve el resultado, *entonces* el cuadro
  relee la versión y dice lo que pasó:
  - «Ya quedó activa», si la versión está activada;
  - el conflicto, si otra pestaña cambió el borrador o activó otra versión;
  - lo que impide activar, con su lugar, si fue un 422 de la validación.
- *La clave de idempotencia* no se descarta mientras el resultado sea incierto: «Volver» la conserva y el intento
  siguiente la reusa.
- *Pruebas:* TEST-EDP-049 (cada código da su texto; con el resultado incierto, el reintento usa la misma clave).

**ED-63 · El RIR de «Analizar» dice de dónde sale**
- *Resuelve:* «Analizar» dice «Las repeticiones en reserva que declaró la persona» de un RIR que pudo venir del plan.
- *Evidencia:* confirmado en código: la explicación de `entrenamiento.rir` en `metricas-del-analisis.ts`, y la APK, que
  completa el RIR vacío con el del plan (`apps/mobile/src/series-de-la-sesion.ts`, `serieAlTildar`).
- *Toca:* `packages/domain/src/metricas-del-analisis.ts` (el nombre, la explicación y los límites de la métrica, con la
  versión del diccionario) y, con ED-70, `series-del-analisis.ts`.
- *Ahora:* la métrica se llama «RIR registrado en la serie» y dice «Lo escribió la persona o, si dejó el campo vacío,
  quedó el del plan. Hasta que la app guarde quién escribió cada dato, no se distinguen.»
- *Con ED-70:* el RIR que escribió la persona va lleno; el que vino del plan, hueco, con la leyenda «del plan»; el de
  antes de la procedencia, hueco, con «sin saber si lo escribió».
- *Dado* una serie con RIR 2 que vino del plan, *cuando* el profesional mira el RIR en «Analizar», *entonces* nunca lee
  «declaró la persona».
- *Pruebas:* TEST-EDP-050 (el texto; con ED-70, la forma del punto según la procedencia).

**ED-64 · Los habituales grandes se guardan**
- *Resuelve:* los habituales siguen en 16 KB: DL-168 subió solo planes, plantillas y recetas.
- *Evidencia:* confirmado en código (las diez rutas de `limite-de-cuerpo.ts` no incluyen API-HAB-04 y 05 ni API-HAN-04
  y 05); el tamaño real de una sesión o una comida habitual grande, a medir.
- *Toca:* `apps/api/src/http/limite-de-cuerpo.ts` (las cuatro rutas, y las de ED-13 si la medición lo pide),
  `limite-de-cuerpo.spec.ts`, `guardado-de-planes-grandes.int-spec.ts` y los diálogos de «Guardar como habitual», con
  `falloDeGuardado`.
- *Dado* una sesión habitual de 8 ejercicios × 6 series con notas, *cuando* el profesional la guarda, *entonces* se
  guarda; y si algo no entra, el diálogo dice «demasiado grande» sin perder lo escrito.
- *Va en* la ventana del vie 20, la de lo que cambia la conducta de la API (§8).
- *Pruebas:* TEST-EDP-051 (las rutas, contra sus controladores; sin ellas en la lista, la prueba falla).

**ED-65 · Recetas y plantillas avisan al salir con cambios**
- *Resuelve:* el editor de recetas y las páginas de plantillas no tienen guardia.
- *Evidencia:* confirmado en código por la revisión de versiones de V3.
- *Toca:* `recipes/editor-de-receta.tsx`, `templates/*` y `components/salida-segura.tsx` (de ED-02).
- *Dado* una receta con cambios, *cuando* el profesional toca un enlace interno o recarga, *entonces* un cuadro «Tenés
  cambios sin guardar», con «Seguir editando» como principal. No se guarda sola: guardar una receta crea una versión.
- *En las plantillas y los habituales,* el detalle se abre en la lista: cerrarlo, abrir otro, cambiar el filtro o quitar
  un habitual (la lista vuelve a leerse) también pasan por la guardia si ese detalle tiene cambios; si no, van derecho
  (`useDetalleConGuardia`; lo encontró la revisión adversaria de la etapa 1).
- *Pruebas:* TEST-EDP-052 (cada editor con cambios tiene la guardia: una prueba recorre la lista de editores, y otra, las
  cuatro listas con el detalle en el lugar).

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

**ED-11 · La galería de presets, con alcance y vista previa**
- *Resuelve:* A06 y A32 (las plantillas, sin vista previa ni acceso desde el editor); es el pedido de Dirección de
  presets «de primera clase». Suma V3 E-04 y E-05, con DJ-8.
- *Evidencia:* confirmado en código. Las plantillas (TPL y TPN), los habituales (HAB y HAN) y las recetas (REC) existen,
  cada uno con su lugar y su diálogo; los presets de BE no existen.
- *Toca:*
  - un `galeria-de-presets.tsx` nuevo, que lee con las operaciones de hoy (API-TPL-01, API-TPN-01, API-HAB-01 a 05,
    API-HAN-01 a 05 y API-REC-01) y con ED-13;
  - un `packages/domain/src/presets-de-be.ts` nuevo: el contenido de BE, versionado, con su prueba;
  - `empezar-desde-plantilla.tsx`, que pasa a ser una pestaña de la galería.
- *Cómo se ve:*
  - dos grupos, «De BE · punto de partida» y «Tuyos», filtrados por la tarea desde donde se abre (V3 E-05), y por tipo;
  - cada tarjeta, con lo que trae («4 sesiones · sin ejercicios», «4×8-12 · RIR 2 · 90 s · sin cargas») y su vista
    previa al costado;
  - los de BE llevan su rótulo y nunca muestran un ejercicio, un alimento ni una carga.
- *Cómo se aplica (DJ-8):*
  - **con un clic, si solo llena lo vacío;**
  - **con una vista previa del alcance, si pisa algo:** a qué se aplica (este ejercicio, los elegidos o la sesión), qué
    cambia fila por fila, «antes → después», y cuántas series agrega o quita, con lo que se pierde de cada una;
  - **las cargas se conservan:** si el preset cambia las repeticiones o el RIR, la carga queda escrita y marcada
    «escrita para 6-8: revisala», sin cambiarla;
  - **«Deshacer» es una operación inversa,** que también se autoguarda: devuelve los valores de antes y no depende de
    que el autoguardado no haya corrido.
- *Dado* la galería abierta desde la sesión, *cuando* el profesional toca «Usar» en «Hipertrofia 4×8-12 RIR 2» con
  cinco ejercicios que tienen 3×6-8 y sus cargas, *entonces*:
  - la vista previa dice «Se actualizan 5 ejercicios de Torso A. Las cargas se conservan y quedan para revisar. Cada
    uno pasa de 3 a 4 series.»;
  - al aplicar, las cargas siguen escritas, con la marca «escrita para 6-8: revisala»;
  - un aviso dice «Aplicado a 5 ejercicios · Deshacer».
- *Pruebas:*
  - TEST-EDP-012: un preset de BE nunca trae ejercicio, alimento ni carga; su versión queda en el contenido;
  - TEST-EDP-013 (reescrita por DJ-8): aplicar nunca borra una carga; lo que muestra la vista previa es lo que queda;
    «Deshacer» devuelve exacto aunque ya se haya autoguardado; aplicar dos veces no duplica series;
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
- *Suma DJ-11:* una opción de receta no entra en una plantilla ni en una comida habitual (`RECIPE_OPTION_NOT_ALLOWED`).
  Antes de guardar, la vista previa dice qué no entra («La opción 2 de Merienda es una receta: no se guarda en el
  preset»). Admitir `recipeVersionId` queda para después del 25/11.
- *Los habituales grandes* van en ED-64.
- *Pruebas:* TEST-EDP-015 (guardar como preset escribe en el modelo que ya existe; no hay una tabla «presets»; lo que no
  entra se dice antes).

**ED-13 · Los dos presets propios nuevos: la prescripción habitual y el reparto habitual**
- *Evidencia:* hipótesis de producto (pedido de Dirección); confirmado en código que no existen.
- *Toca:*
  - la API, `apps/api/src/entrenamiento/habituales.*` y `apps/api/src/nutricion/habituales.*`: API-HAB-06 a 08 (listar,
    guardar o reemplazar por nombre, quitar) y API-HAN-06 a 08;
  - `prisma/schema.prisma`, con dos tablas y una migración que solo agrega;
  - `packages/domain/src/contratos-habituales.ts` y `openapi.ts`;
  - la guardia de trazabilidad (las familias HAB y HAN, extendidas por DL-167).
- *Las reglas de siempre:* `Idempotency-Key`, `expectedVersion`, auditoría, el 404 de lo ajeno y nada que lea la APK.
  El reparto habitual se guarda en gramos (DJ-7). Sus rutas entran en la lista de 700 KB si la medición de ED-64 lo pide.
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
- *Suma V3 (X-01):*
  - «Seguir en la estación» en el pie de cada paso: el borrador es el mismo;
  - el paso que se deduce del borrador solo se sugiere: el indicador muestra los siete y el profesional elige;
  - la prueba con borradores mezclados (sesiones con y sin ejercicios, series con valores propios, días sin asignar);
  - **el oráculo de ida y vuelta:** lo que el asistente no muestra (los valores propios de una serie, las notas, los
    parámetros) sobrevive a pasar por él.
- *Pruebas:*
  - unitarias de `paso-que-sigue` (un caso por paso, y los borradores mezclados);
  - un recorrido del asistente completo;
  - TEST-EDP-017: «Siguiente» nunca avanza sin la respuesta del servidor; cambiar el punto de partida pide confirmar;
  - TEST-EDP-055: un borrador con valores por serie pasa por los siete pasos y sale idéntico.

**ED-15 · La estación de tres zonas y su barra de comandos fija**
- *Resuelve:* A07, A14 y B06; es la §6.1 de la auditoría: entrada fragmentada y pérdida de contexto. Con DJ-6, la barra
  de V3 01 §0.
- *Evidencia:* confirmado en capturas (A07: el editor arranca a mitad de la primera pantalla; A18: 2,7 pantallas) y en
  código: hoy hay dos botones fijos y solo cambia cuál va lleno (`training/editor.tsx`). La versión anterior de esta
  parte los juntaba en uno que cambiaba de función con el autoguardado; V3 tenía razón (§13).
- *Toca:*
  - `training/editor.tsx` y `nutrition/editor.tsx`, que se parten en zonas;
  - un `estacion/` nuevo, con el armazón, las zonas, la barra y `Panel`;
  - `marco-del-area.tsx`, con el modo de una fila en Plan;
  - `globals.css`, con la grilla de 1280, 1440 y 1920;
  - `packages/domain/src/versiones-de-plan.ts`: el número del borrador, las activadas más uno (DJ-6).

  Lo elegido sigue en la dirección (`bloque`, `micro`, `sesion`, `dia`, `comida`, más `opcion`), así que volver
  conserva el lugar.
- *La barra* es la de §2.2: la versión numerada, el estado con «Guardar ahora» al lado, «Revisar y activar…» y «⋯». Cada
  acción tiene un lugar que no cambia; en la barra, el único botón lleno es «Revisar y activar…».
- *Dado* un profesional que escribe, *cuando* corre el autoguardado o cambia el estado, *entonces* «Guardar ahora» y
  «Revisar y activar…» no se mueven ni cambian de nombre.
- *Dado* un plan con 8 versiones activadas, *cuando* se abre su borrador, *entonces* la barra dice «Versión 9 · en
  preparación», también después de descartar otro borrador: un borrador descartado no consume número.
- *Dado* 1440 × 900, *cuando* se abre la estación, *entonces* la barra de comandos y las tres zonas entran en la
  pantalla, la página no se desplaza y cada zona se desplaza sola.
- *Dado* 1280 × 800, *cuando* se abre la estación, *entonces* el panel derecho se abre con «Panel».
- *Dado* 1920 × 1080, *cuando* se abre la estación, *entonces* el centro ocupa el ancho hasta 1840 px.
- *Pruebas:*
  - capturas en Claro y Azul noche a 1280, 1440 y 1920;
  - la prueba de contraste;
  - TEST-EDP-018: el recorrido por teclado de las tres zonas, con saltos «Ir a la estructura», «Ir al editor» e «Ir al
    panel»;
  - TEST-EDP-054: el lugar y el nombre de «Guardar ahora» y de «Revisar y activar…» no cambian al escribir, al guardar
    ni al fallar; la prueba de `versiones-de-plan` numera el borrador;
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

**ED-18 · El vidrio del website**
- *Resuelve:* el pedido de Dirección del 2026-11-11 (§2.7), con la misma línea visual que la APK (DL-170).
- *Evidencia:* la maqueta de WP-APP-VUELTA-2; en el website, la pauta vigente dice lo contrario (GUIA II.2, «Superficies
  mates»).
- *Toca:*
  - `apps/web/src/app/tokens.css` y `globals.css`: el fondo, dos niveles de superficie (el de afuera, con el borde de
    luz, la línea de luz y la sombra; el de adentro, sin sombra) y el resplandor del principal;
  - `components/cajon.tsx` y `components/dialogo.tsx` (el `CuadroEnfocado` de ED-10), la barra de ED-15 y el panel;
  - `scripts/contraste.test.cjs`, con un par por cada token nuevo;
  - la guía: II.2 pasa a «Superficies de vidrio en el website», con la receta, y su lista de control.
- *Las reglas:*
  - el contraste AA se mide en el peor punto de cada superficie translúcida, en Claro y en Azul noche: 4,5:1 el texto y
    3:1 los bordes de los controles;
  - con `prefers-reduced-transparency`, con `forced-colors` y sin soporte de `backdrop-filter`, todo vuelve a ser opaco;
  - nada se anima, y con `prefers-reduced-motion` no hay transición de brillo;
  - la planilla y las tablas largas, opacas; el cian, nunca en bordes de tarjetas ni en títulos; el foco, ámbar; un solo
    resplandor por vista.
- *Dado* la estación en Azul noche a 1440 × 900, *cuando* se abre un cuadro, *entonces* el cuadro y la barra son de
  vidrio, la planilla sigue opaca y todo el texto pasa 4,5:1 sobre su fondo real.
- *Corte:* es una hoja. Si el contraste medido en el peor punto no da, o el rendimiento no da, el website queda mate y
  no frena a las demás (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12).
- *Pruebas:* TEST-EDP-053 (los pares de contraste de los tokens nuevos; el modo opaco con `forced-colors` y con la
  transparencia reducida; un solo resplandor por vista) y capturas en los dos temas a 1280, 1440 y 1920.

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
  - el buscador con filtros en chips, por zona y por nombre (el catálogo no guarda el equipo);
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
- *Suma V3 (E-02 y E-03):*
  - **un verbo para cada copia:** «Copiar el ejercicio a…», «Copiar la prescripción a…» y «Copiar estas series a…»; hoy
    el menú solo tiene «Duplicar» y «Quitar» (`training/ejercicio-del-editor.tsx`);
  - **lo que se pierde se dice antes:** bajar de 4 a 3 series o «Volver a carga uniforme» muestra los valores propios
    que se van («Quitar la serie 4: se pierde su RIR (1) y su carga (82,5 kg)»), con «Cancelar» enfocado;
  - **elegir varios ejercicios,** con una barra contextual («3 ejercicios elegidos»), para aplicarles lo mismo: es P2 y
    es lo primero que cae.
- *Lo que no existe y no se suma:* el tipo de serie (aproximación o efectiva), la variante y el equipamiento (DJ-13), y
  el RPE como criterio de la prescripción, que da 422 (REG-06-129).
- *Pruebas:* TEST-EDP-024 (lo que se ve como heredado es lo que la API guarda como heredado, contra
  `planExigeObjetivosPorSerie`), TEST-EDP-056 (quitar una serie con valores propios los nombra antes y «Cancelar» no
  toca nada) y un recorrido por teclado.

**ED-24 · Sesiones y días en la estación**
- *Resuelve:* A08 (3 clics por sesión) y A18 (2,7 pantallas, 95 acciones).
- *Evidencia:* confirmado en capturas.
- *Toca:* `training/estructura-del-plan.tsx`, `training/agenda-del-plan.tsx` y `training/editor.tsx`.
- *En la estructura, a la izquierda:*
  - «+ Sesión», con el nombre en el lugar y Enter;
  - «Duplicar» y «Copiar a otra semana»;
  - cada sesión, con sus días en siete chips (L M X J V S D) y «Sin día»;
  - la agenda entera, en una tira de la semana arriba, sin abrir un diálogo.

  Las reglas de DL-137 no cambian: el inicio, los avisos y lo que se mueve. De V3 (E-01) se suman «Copiar la sesión
  a…», con destino (otra semana o bloque) y vista previa, y «Duplicar el día».
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
- *Paso 2 (DJ-7: sin «%» antes del 25/11):*
  - el objetivo vigente, con el nombre «Objetivo general», su versión y su fecha; o una versión nueva del objetivo
    (REG-06-123), como hoy;
  - el reparto se escribe en gramos, como hoy, y un reparto propio guardado (ED-13) los escribe tal cual. BE no trae
    repartos en %: pasarlos a gramos usaría 4/4/9 sin decirlo, y el «%» está prohibido en los textos de Nutrición
    (`copy-nutricion.ts`);
  - sin objetivo, el asistente empieza por la evaluación (B10-06; DL-145).
- *Paso 4:* la estructura del día o una comida habitual.
- *Paso 5:* la opción en un cuadro (ED-31).
- *Dado* Sofía con «2.400» kcal, *cuando* aplica su reparto «Mi base · 300 / 120 / 80 g», *entonces* ve 300 g de
  carbohidratos, 120 g de proteínas y 80 g de grasas antes de guardar, los puede cambiar, y BE no propone las kcal.
- *Pruebas:* TEST-EDP-027 (reescrita por DJ-7: ningún texto de Nutrición dice «%»; el reparto se escribe en gramos; sin
  objetivo, el asistente no ofrece el paso 2) y un recorrido completo.

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
- *Suma (la revisión de Nutrición de V3):*
  - el origen en cada fila del plan, con el rótulo «dato de demostración», que hoy se pierde después de agregar el ítem
    (`nutrition/agregar-item.tsx`), y un aviso en «Antes de activar» si el plan lleva alguno;
  - un ítem en unidades dice «en unidades: sin estimación»: la unidad no tiene equivalencia en gramos;
  - API-PLN-01 devuelve, por ítem, la composición y la versión que usaría la instantánea: así el cálculo del website y
    el de la API dan lo mismo (ED-D6);
  - «fuente identificada», nunca «fuente verificada» (RF-060);
  - la cuenta no lee el estado crudo o cocido: sale del alimento elegido del catálogo, con la energía de la fuente y
    nunca 4/4/9 (`SUM_SOURCE_PER_100G_V1`);
  - los totales de cada opción alimentan el rango del día (ED-34).
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
- *Suma V3 (N-03):*
  - **dos salidas:** «Guardar la receta y agregarla a Merienda» (principal) y «Guardar solo en Mis recetas»;
  - **la recuperación:** son dos escrituras sin transacción conjunta. Si la receta se guardó y el agregado al plan
    falló, el cuadro lo dice y ofrece «Agregarla a Merienda» con el `recipeVersionId` que devolvió la API, sin crear
    otra receta;
  - la foto, como un paso después de guardar;
  - si hay una versión más nueva de la receta que usa la opción: «Hay una versión 3 de esta receta · Usarla», con la
    vista previa de lo que cambia;
  - sin «masa final», tiempo ni dificultad: no existen en BE.
- *Una opción es de alimentos o de receta,* nunca las dos: la receta entra como una porción que arma el servidor.
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
  - «+ Opción de alimentos» y «+ Opción de receta», por separado, y en «⋯» copiar de otra comida o usar una comida
    habitual;
  - un día tipo sin comidas dice «Sin comidas»; uno con algunas, «1 comida incluida», sin color y sin bloquear (ED-D4).
- *Suma V3:* quitar un día tipo o una comida con contenido pide confirmar, con lo que se va («Quitar Merienda: 2
  opciones y 7 alimentos»). Hoy se borran en el acto (`nutrition/editor.tsx`).
- *Dado* el día de descanso, *cuando* Sofía toca «+ Comida» y escribe «Colación», *entonces* la comida existe con su
  opción 1 abierta, en un clic.
- *Pruebas:* TEST-EDP-031 (duplicar un día no comparte identificadores con el original), TEST-EDP-057 (quitar con
  contenido pide confirmar y nombra lo que se va; «Cancelar» no toca nada) y las de topes de TB-48.

**ED-34 · El panel de Nutrición: rangos y el rango del día**
- *Resuelve:* B06 y B19-B21; TB-39, con la forma ratificada en D-17; el total del día, con DJ-4.
- *Evidencia:* confirmado en código. Los rangos están declarados y no implementados: API-PLN-02 y 03.
- *Toca:* `estacion/panel.tsx`, un `nutrition/rangos.tsx` nuevo y la API (API-PLN-02 y 03, en su rama).
- *Las pestañas:*
  - «Antes de activar», en vivo, como ED-25;
  - «Rangos y totales»:
    - el rango de la comida, con cada opción ubicada como en D-17, sin color, y «Usar lo que cubren como rango» solo al
      tocarlo;
    - **el rango del día (DJ-4):** «El día va de 1.850 a 2.420 kcal según lo que elija», de la opción que menos aporta
      a la que más en cada comida. Ninguna opción viene elegida. Si una opción no tiene total, el rango dice «Sin dato»
      y nombra qué lo impide; solo lo ve el profesional;
    - la tabla compacta del día (V3 N-01): una fila por comida, con kcal, proteínas, carbohidratos y grasas como rango
      («de 420 a 610 kcal»), sin «%» y sin semáforo.
- *Lo que enmienda DJ-4:* TB-38 («sin total del día») y TEST-TAG-025, ratificadas el 5/11 (WP-TABLERO-ALTA-GAMA). La
  prueba de TB-39 pasa de «las opciones nunca se suman como un total del día» a «las alternativas de una comida nunca se
  suman entre sí; el rango del día suma el mínimo y el máximo de cada comida». «Analizar» y DL-158 no cambian.
- *Dado* las cuatro comidas del día de entrenamiento, *cuando* Sofía mira «Rangos y totales», *entonces*:
  - ve el rango del día y el de cada comida;
  - dos alternativas de una misma comida nunca se suman entre sí;
  - si una opción del almuerzo no tiene total, el rango del día dice «Sin dato» y nombra el ingrediente;
  - nada de esto lo ve la persona.
- *Pruebas:* TEST-EDP-032 (reescrita por DJ-4: el rango suma el mínimo y el máximo de cada comida, nunca dos
  alternativas de la misma; un hueco da «Sin dato»), TEST-EDP-029 y la prueba que reemplaza a TEST-TAG-025.

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

  Abajo, fijo: «Vas a pedir 49 preguntas (19 obligatorias) para Nutrición. Pedir no amplía tu acceso.» y un solo
  principal, «Enviar solicitud». Son las cuentas de «Cómo comés hoy» v3: 50 preguntas, el embarazo sin pedir (DL-165
  D-4) y 19 obligatorias (DL-165 D-21).
- *Dado* «Cómo comés hoy», *cuando* Sofía la elige, *entonces*:
  - el cuadro entra en una pantalla con las partes plegadas;
  - las preguntas pedidas son las mismas que hoy (DL-131 y DL-165 D-4);
  - las obligatorias se cuentan a la vista;
  - lo condicional se dice en su parte.
- *Suma (la revisión de permisos de V3):*
  - si ya hay un pedido pendiente del mismo formulario, el cuadro lo dice antes de enviar («Ya le pediste "Cómo comés
    hoy" el 3/11 y todavía no respondió») y deja enviar igual;
  - una línea de lo que le llega a la persona;
  - la descripción para el profesional sale del dominio, sin códigos y sin tocar la tabla de solo agregar (ED-05);
  - no se muestran «categorías permitidas»: la matriz es permisiva a propósito, y mostrarlas sería una precisión falsa;
  - cancelar o hacer vencer un pedido queda para después (DJ-16: cambia REG-06-210).
- *Pruebas:* TEST-EDP-033 (lo enviado es exactamente lo marcado, con las partes plegadas o abiertas), TEST-EDP-034
  (plegar no oculta una obligatoria: la cuenta de cada parte las nombra) y TEST-EDP-058 (el aviso de un pedido
  pendiente aparece antes de enviar y no lo impide).

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
  ejemplo, «+2,5 kg por semana en S2 y S3; S4, descarga: bajar las cargas un 10 % y una serie menos, redondeo a
  2,5 kg». Hay vista previa con «+2,5 · igual · −1» y se escribe con «Escribir en el borrador». No queda una regla
  guardada. La app, hasta TB-44, muestra las semanas juntas y en orden (ED-D11).
- *Dado* Piernas A en S1, *cuando* Martín genera S2 a S4, *entonces* cada celda tiene su valor escrito y se puede
  cambiar antes de guardar.
- *Pruebas:* de propiedad de `progresion` (deshacer devuelve S1 exacta; el redondeo es el elegido; ningún registro de la
  persona cambia nada) y TEST-EDP-036.
- *Abierto, con recomendación:* el texto de la declaración, «−10 % de carga», choca con la guardia de Entrenamiento,
  que solo admite «% RM». Recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12: cuando se programe,
  el texto es «Bajar las cargas un 10 %», y la guardia admite «% de la carga» además de «% RM» (bajar una carga es una
  indicación, no una calificación). Sin código ahora.

**ED-51 · Escalar una opción**
- *Evidencia:* idea de producto.
- *Toca:* `nutrition/totales.tsx` y un `nutrition/escalar.ts` nuevo.
- *Cómo funciona (ED-D12, reescrita):* «Escalar…», proporcional y con vista previa antes y después:
  - **a un valor** («a 600 kcal») o al rango de la comida, solo si se conoce el total de ese nutriente en la opción;
  - si no, **por un factor** («× 0,85»), con el «Sin dato» a la vista;
  - nunca una opción de receta;
  - se redondea según la unidad (gramos y mililitros, a 5), y lo que está en unidades no se escala.
- *Dado* una opción de 703 kcal, *cuando* Sofía la escala a 600, *entonces* cada cantidad en gramos baja en la misma
  proporción, redondeada a 5 g; lo que está en unidades queda igual y lo dice; la vista previa da el total nuevo.
- *Pruebas:* TEST-EDP-037 (con un hueco en la energía no se ofrece «a un valor»; escalar nunca toma lo desconocido como
  0).

**ED-52 · Cambiar por otro alimento (misma energía)**
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
  Nunca un borrador ni lo que la persona no ve (ED-D14), ni las evaluaciones o las notas del profesional, y respeta
  «Ocultar nombres».
- *Pruebas:* TEST-EDP-040 (un borrador no se imprime; lo impreso es la instantánea).

**ED-56 · Comparar versiones y el motivo del ajuste**
- *Resuelve:* A04, A28, A29 y B05.
- *Toca:* `comparar-versiones.ts` (de ED-07), `versiones-del-plan.tsx` y `aplicar-la-revision.ts`.
- *Cómo funciona:* «Comparar con la vigente», en el «⋯». El borrador que nace de una revisión lleva una banda «Motivo
  del ajuste», con el fundamento y el enlace a la revisión.
- *Suma DJ-9:* la misma comparación, dentro del conflicto de DL-148: «Ver diferencias» y «Guardar lo mío encima», con
  confirmación (amplía DL-148 D-3). Antes del 25/11 va solo el arreglo del conflicto falso (ED-61).
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

### 5.8 La vertical de fuerza: la estimación de la repetición máxima

Dirección decidió el 2026-11-11 que BE estime la repetición máxima con Epley v1 **en esta actualización**, solo para el
profesional y en el website (DJ-1; DL-171). La estimación tiene dos fuentes y un uso:
- **(a) la serie que observa el profesional:** en el ejercicio, escribe kg × repeticiones y el RIR, y BE calcula la
  estimación y la guarda con la fecha, el autor y el método (ED-72);
- **(b) las series que escribió la persona:** solo los valores que escribió ella, para lo cual la app nueva guarda qué
  escribió y qué vino del plan (DJ-2; ED-70). Las series de antes quedan fuera;
- **(c) planificar con ella:** el profesional elige un % y BE sugiere los kilos, con el redondeo a la vista, que él
  confirma; nunca hay carga automática (ED-76). Reemplaza la recomendación DJ-12 del juicio («no calcular cargas»).

**Lo que ya existe** (sin tocar nada):
- lo indicado y lo hecho son estructuras separadas; la ejecución es inmutable, una por ocurrencia, y las correcciones
  solo se agregan, con autor y rol (`packages/domain/src/entrenamiento.ts`; `schema.prisma`);
- cada serie registrada guarda la carga con su unidad (kg o lb, sin convertir), las repeticiones, el RIR de 0 a 20 con
  decimales, el esfuerzo percibido, cómo se cargó (`TYPED` o `AS_PLANNED`, DL-161) y la duración
  (`SerieEjecutadaSchema`);
- la fecha civil, la zona y el momento de la ocurrencia, aparte del momento del registro;
- «Analizar» calcula al leer, declara su especificación, su versión y su método, y dibuja huecas las series de carga
  rápida;
- la clave TRAINING_PERSONAL_RECORDS, que hoy responde que falta la especificación. **La estimación nunca va ahí**
  (B10-08: «marca observada ≠ 1RM estimado»).

**Lo que falta, y por qué existe esta vertical:**
- **el dato:** al tildar, la APK completa lo vacío con el plan (`carga ?? plan.carga`, `repeticiones ?? plan.repeticiones`
  y `rir ?? plan.rir`) y marca la serie `TYPED` en cuanto se escribe un campo (`apps/mobile/src/series-de-la-sesion.ts`,
  `serieAlTildar`). Si el plan dice 60 kg × 8 con RIR 2 y la persona escribe solo «10», queda 60 kg × 10 con RIR 2, como
  si lo hubiera escrito todo. Lo arregla ED-70;
- **el legajo:** 09v10:356, REG-06-182 y 06:5431 dicen que BE no fija una fórmula de repetición máxima. DL-171 registra
  la decisión de Dirección que lo enmienda, sin tocar el legajo;
- **el canal:** el único para un valor derivado es el patrón de cálculo T-06-N12 (REG-06-202). Epley v1 es una
  especialización de ese patrón para Entrenamiento: un método con identidad y versión inmutable (REG-06-203) y entradas
  admisibles (REG-06-204). Las estimaciones de (b) se calculan al leer, porque las ejecuciones no cambian; las de (a) se
  guardan con la observación, como hecho histórico (REG-06-205).

**Qué toca la API y la base, y qué va en la APK de esta actualización:**

| Parte | Dominio | API | Base | Website | APK |
|---|---|---|---|---|---|
| ED-70 | `fieldOrigins` en la serie ejecutada | API-TRN-15 a 20 lo aceptan y lo devuelven | Nada: las series viven en el JSON del borrador, la ejecución y la corrección | Lo muestra y lo conserva al corregir | **Sí:** lo manda |
| ED-71 | El método, la elegibilidad, la lista y los textos | — | — | — | No |
| ED-72 | La observación | API-FZA-01 a 03 | **Una tabla nueva, con disparadores de solo agregar; la migración solo agrega** | El cuadro | No |
| ED-73 | Los textos | — | — | El cuadro | No |
| ED-74 | La derivación | Una clave nueva de API-PRJ-01 | Nada | La métrica | No |
| ED-75 | — | Lee ED-72 y ED-74 | — | La tarjeta | No |
| ED-76 | La cuenta y el redondeo | Escribe con API-TRN-10, como hoy | — | El cuadro | No |

**ED-70 · La procedencia por campo en la app (DJ-2)**
- *Resuelve:* la carga, las repeticiones o el RIR que vinieron del plan se registran sin marca; BEV3-016 y V3 F-03.
- *Prioridad:* P0 de la vertical. La APK se congela el 25/11 y, sin esto, todo lo que se registre hasta después de la
  tesis queda ambiguo.
- *Evidencia:* confirmado en código (`serieAlTildar`; el contrato dice que el RIR «nunca se infiere», y la APK lo
  completa igual: `SerieEjecutadaSchema`).
- *El contrato* (`@be/domain`): un campo opcional de la serie ejecutada, `fieldOrigins`, con `PERSON` o `PLAN` para la
  carga, las repeticiones y el RIR que tengan valor. Como DL-161 I-1, lo que no existe no se guarda: un objeto vacío no
  viaja. Una serie `AS_PLANNED` no lo lleva (todo es del plan). Un valor sin su clave es «sin saber quién lo escribió».
  No es la `procedencia` que ya guarda cada escritura (T-06-23: la operación, la superficie y el pedido): dice de dónde
  salió cada valor de la serie. El código lo llama `fieldOrigins` para no confundirlas.
- *Toca:*
  - el dominio: `contratos-entrenamiento.ts` y `registro-por-niveles.ts` (`serieEnSuForma`; `problemasDeCoherencia`
    rechaza, con su código, una clave sin valor o `PERSON` en una serie `AS_PLANNED`); en una corrección, cambiar solo
    la procedencia no es una corrección (`CORRECTION_WITHOUT_CHANGES`, como DL-161 I-4);
  - la API: API-TRN-15 a 20 y 19-LISTA lo guardan y lo devuelven en su forma, y `docs/api/openapi.json` lo suma en cada
    aparición de la serie ejecutada. En una corrección del profesional, un valor que cambió no puede decir `PERSON`
    (422). Como DL-161 I-3, la API no recalcula el plan para verificar `PLAN`: lo cubre la prueba de la APK;
  - el website: Registros y su detalle dicen «del plan», discreto, en el valor que vino del plan; corregir conserva la
    procedencia de lo que no cambia y saca la clave de lo que cambia el profesional;
  - la APK: `serieAlTildar` (cada valor con su origen); el registro rápido, «Ya la hice» (lo tildado sin escribir sigue
    `AS_PLANNED`, sin el campo, y lo escrito lleva su origen); y la corrección desde la app (lo que la persona cambia
    pasa a `PERSON`; lo demás conserva su origen).
- *Sin migración:* las series viven en el JSON de `contenido`. Sin capacidad nueva en `X-BE-Capabilities`, como
  recomendó DL-161: la 0.23.0-candidata.2 no lee una ejecución con el campo, y la candidata nueva pasa a ser la única
  vigente (UF-00).
- *El orden:* primero la API, que acepta el campo; después la APK, que lo manda. Una APK que lo mande a una API que no
  lo conoce recibe 400 en cada registro (los esquemas son estrictos): la API va en la ventana del vie 20, y la candidata
  se construye después (§8).
- *Dado* el plan 60 kg × 8 con RIR 2, *cuando* la persona escribe solo «10» y tilda, *entonces* la serie se registra
  60 kg × 10 con RIR 2 y `fieldOrigins` `{ load: PLAN, completedRepetitions: PERSON, rir: PLAN }`.
- *Dado* una serie registrada antes, *cuando* se lee, *entonces* no trae el campo y queda fuera de la estimación, con su
  motivo.
- *Pruebas:* TEST-EDP-059 (el contrato, la API y la APK: cada combinación de escrito y heredado; `AS_PLANNED` sin el
  campo; la 0.23.0-candidata.2 sigue leyendo lo que ella registra) y TEST-EDP-060 (una corrección del profesional no
  puede atribuirle a la persona un valor que cambió).

**ED-71 · El método Epley v1**
- *Resuelve:* DJ-1; V3 03 §3 a §6, con las correcciones del juicio. La especificación completa está en DL-171.
- *Toca:* un `packages/domain/src/estimacion-de-fuerza.ts` nuevo, sin React ni base (la especificación `BE-E1RM`,
  versión 1, método `EPLEY_V1`; la lista cerrada de ejercicios; la elegibilidad con sus motivos; la regla por sesión;
  el formato), `copy-entrenamiento.ts` (los textos y la guardia de fuerza) y el comentario de B-08 en
  `entrenamiento.ts`, que pasa a citar DL-171.
- *La cuenta:* n_eq = repeticiones + RIR. Si n_eq es 1, la estimación es la carga. Si no, carga × (1 + n_eq/30), con
  n/30 exacto, nunca 0,0333.
- *Las bandas, sobre n_eq:* núcleo, hasta 10; orientativa, de más de 10 a 12; fuera, más de 12 (no hay valor).
- *Lo que entra,* todo junto:
  - un ejercicio de la lista cerrada de la v1 (ED-D18), sin sustituir en esa sesión;
  - una serie escrita por la persona (`TYPED`, con la carga, las repeticiones y el RIR de procedencia `PERSON`) o una
    observada por el profesional (ED-72);
  - carga mayor que 0, en kg o en lb, sin convertir;
  - repeticiones enteras, desde 1;
  - RIR de 0 a 2, con decimales;
  - la base de la carga, ausente o TOTAL_EXTERNAL, y la de las repeticiones, ausente o PER_SET: por implemento o por
    lado, fuera en la v1.
- *La regla por sesión:* de las series que entran de un ejercicio en una ejecución, la de mayor carga, por unidad; a
  igual carga, la primera. Nunca «la mayor estimación», que sube sola cuando hay más series. Con «Incluir las de 11 a
  12» apagado, elige entre las de hasta 10 repeticiones equivalentes; encendido, entre todas las de hasta 12 (ED-74).
- *Cómo se muestra:* «≈ 98 kg», al medio kilo o a la libra entera, con el rótulo «estimación · Epley v1»; de 11 a 12,
  «estimación orientativa · Epley v1». La décima, solo en «Cómo se calculó» (REG-06-158). Sin intervalo ni «±».
- *Lo que nunca hace:* calcular desde la prescripción, avisar, celebrar, entrar en las marcas, llegar a la persona o
  invitar a un máximo.
- *Pruebas:* RM-01 a RM-35 y RM-43 (abajo), en `estimacion-de-fuerza.test.ts`, cada negativa con su mutación.

**ED-72 · La serie observada por el profesional**
- *Resuelve:* la fuente (a) de Dirección; V3 F-03, en lo que toca al profesional.
- *Toca:*
  - la base: una tabla nueva, la observación, con la persona, el ejercicio del catálogo, la fecha civil y la zona, la
    carga con su unidad, las repeticiones, el RIR, la nota, el autor y la estimación (especificación, versión, método,
    banda, entradas y valor), y disparadores que impiden cambiarla o borrarla. La migración solo agrega;
  - la API, una familia nueva: API-FZA-01 (registrar, con `Idempotency-Key`), API-FZA-02 (listar las de una persona,
    por ejercicio) y API-FZA-03 (corregir o anular: una observación nueva que sucede a la anterior, con su motivo y
    `expectedVersion`). Los permisos son los de la evaluación de entrenamiento (API-TRN-01 a 03): el PDP de
    Entrenamiento, decidido en la transacción; lo ajeno, el 404 de lo inexistente; cada lectura y cada escritura,
    auditadas (08 §29). La guardia de trazabilidad suma la familia FZA con DL-171;
  - el website: «Registrar una serie observada», un cuadro enfocado que se abre desde la tarjeta del ejercicio (ED-75),
    con la carga y su unidad, las repeticiones, el RIR observado (obligatorio, de 0 a 2), la fecha y una nota
    opcional. La estimación se ve en vivo, con «Cómo se calculó», y hay un solo principal: «Guardar la serie
    observada».
- *El RIR* (recomendación de Claude del 2026-11-11, R3, ratificada por Dirección el 2026-11-12, sobre «y el RIR si
  aplica»): si la serie fue al fallo, el RIR es 0 y se escribe igual; con un RIR mayor que 2, Epley no estima, y una
  observación que no se puede estimar no se guarda (ED-D19). Sin RIR, el cuadro dice el motivo en palabras: «Sin RIR no
  se puede estimar».
- *La regla, explicada al profesional* (Dirección, 2026-11-12, sobre R3: «aclarémoselo a los profesionales nomás»):
  debajo del campo del RIR, en una línea, «BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR que se
  escribe es menos confiable.» El texto sale del dominio (`COPY_FUERZA.reglaDelRir`, ED-71) y es el mismo en los tres
  lugares (este cuadro, ED-73 y ED-75). La persona no ve nada de esto en la v1.
- *Lo que no hace:* no la lee la APK; no es un «1RM medido» ni un test (D-V3-03, después); no pregunta «¿fue un
  máximo?».
- *Dado* Martín en el Press de banca plano con barra de Diego, *cuando* registra 85 kg × 5 con RIR 1, *entonces* se
  guarda la observación con su estimación (102,0 kg, núcleo, Epley v1, Martín y la fecha) y la tarjeta la muestra.
- *Dado* 60 kg × 15 con RIR 0, *cuando* intenta guardarla, *entonces* el cuadro dice «Con más de 12 repeticiones
  equivalentes no se estima» y no guarda nada (ED-D19).
- *Dado* 80 kg × 5 sin RIR, *cuando* intenta guardarla, *entonces* el cuadro dice «Sin RIR no se puede estimar» y no
  guarda nada.
- *Dado* el cuadro recién abierto, *cuando* Martín llega al campo del RIR, *entonces* el campo dice «De 0 a 2» y, debajo,
  «BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR que se escribe es menos confiable.»; con 80 kg × 5
  y RIR 3, el cuadro dice «Con un RIR mayor que 2 no se estima» y no guarda nada.
- *Pruebas:* TEST-EDP-061 (integración con PostgreSQL: crear, suceder, anular, lo ajeno, la auditoría, que la base
  impida cambiarla o borrarla y que la persona no la reciba), TEST-EDP-062 (la familia FZA en la guardia de
  trazabilidad y en `openapi.json`), y RM-36 y RM-37.

**ED-73 · «Cómo se calculó» (V3 F-02)**
- *Toca:* un `fuerza/como-se-calculo.tsx` nuevo, que se abre desde cualquier valor: la tarjeta, un punto de la
  evolución o el cuadro de ED-76. Dentro de otro cuadro se abre en el mismo, con «Atrás» (ED-10).
- *El cuadro dice:*
  - qué es: «Una estimación de la carga para una repetición, hecha con una serie. No es una repetición máxima
    medida.»;
  - los datos: el ejercicio, la fecha civil, la carga, las repeticiones, el RIR y quién los escribió («la escribió Diego
    en la app» o «la observó Martín»), con el enlace a la serie de origen;
  - la cuenta con sus números: «8 + 2 = 10 repeticiones equivalentes · 80 × (1 + 10/30) = 106,7 kg»;
  - la banda y el método: «hasta 10 repeticiones equivalentes · Epley v1» (de 11 a 12, «estimación orientativa»);
  - qué no significa: «No se levantaron 106,7 kg. No es una marca. No es una indicación de carga: la carga la elegís
    vos con un % RM.» (como ED-76);
  - en esa sesión, qué series no entraron y por qué («Serie 3: el RIR es el del plan»);
  - la regla del RIR, en una línea, junto a la banda: «BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR
    que se escribe es menos confiable.» (Dirección, 2026-11-12, sobre R3; el mismo texto que ED-72).
- *Dado* cualquier valor a la vista, *cuando* se abre «Cómo se calculó», *entonces* la cuenta reproduce el valor con los
  datos de origen, también después de que exista una versión nueva del método.
- *Dado* una sesión con 80 × 8 con RIR 2 y una serie con RIR 3, *cuando* Martín abre «Cómo se calculó» de su valor,
  *entonces* lee la regla del RIR y, entre las series que no entraron, «Serie 2: el RIR es mayor que 2».
- *Pruebas:* TEST-EDP-063 (cada valor se reproduce; la regla del RIR está; los textos pasan la guardia).

**ED-74 · La evolución de fuerza por ejercicio (V3 F-01)**
- *Toca:*
  - la API: una clave nueva de API-PRJ-01 para la estimación por ejercicio, con su derivación (`BE-E1RM`, versión 1,
    `EPLEY_V1`). Se calcula al leer, desde el registro vigente de cada sesión (la corrección vigente o el original), y
    suma las observaciones de ED-72. Nunca TRAINING_PERSONAL_RECORDS. Sin migración;
  - el website: la métrica «1RM estimado (Epley v1)» de «Analizar», de la familia «estimación» y no de «carga», por
    ejercicio y por unidad, que se abre ya filtrada desde la tarjeta (ED-75).
- *Cómo se ve:*
  - el punto lleno, hasta 10 repeticiones equivalentes; hueco, de 11 a 12, con «Incluir las de 11 a 12» apagado de
    entrada (el rótulo dice «de más de 10 a 12»: el RIR admite decimales, y 10 con RIR 0,5 ya es orientativa; DL-171,
    precisión del 2026-11-12); la observación del profesional, con otra forma y su leyenda;
  - la regla por sesión sigue al interruptor (recomendación de Claude del 2026-11-11, ratificada por
    Dirección el 2026-11-12; DL-171): apagado, elige la serie que entra de mayor carga entre las de hasta 10 repeticiones
    equivalentes, y una sesión que solo tiene series de 11 a 12 queda sin punto; encendido, entre todas las de hasta 12;
  - sin línea a través de un hueco; kg y lb, aparte;
  - la diferencia entre dos estimaciones, en kg («estimación: 90 → 98 kg»), nunca un % ni «fuerza real»; con un solo
    punto, ninguna;
  - la tabla de origen: la fecha, la carga, las repeticiones, el RIR, quién lo escribió, la banda, el valor y «Cómo se
    calculó»;
  - el período empieza «desde el inicio del acompañamiento» (RF-025, DJ-14) y, si hay más, dice «Hay registros con otro
    profesional que no ves».
- *Permisos:* los de una clave de Entrenamiento en «Analizar» (el PDP y ser el profesional del plan). Sin fila en la
  matriz §3.1, no viaja a otra área ni a RES-06.
- *Dado* Diego con tres sesiones de press de banca escritas con la app nueva, *cuando* Martín abre la evolución,
  *entonces* ve los dos puntos de hasta 10 repeticiones equivalentes, con su fecha civil, y al encender «Incluir las de
  11 a 12» aparece el de 70 × 12 con RIR 0, hueco.
- *Dado* una sesión con 70 kg × 12 con RIR 0 y 65 kg × 8 con RIR 2, *cuando* Martín abre la evolución, *entonces*, con
  el interruptor apagado, el punto de esa sesión es el de 65 × 8: 65 × (1 + 10/30) = 86,7 kg, lleno, «≈ 86,5 kg»; al
  encenderlo, pasa a ser el de 70 × 12: 70 × (1 + 12/30) = 98,0 kg, hueco.
- *Pruebas:* TEST-EDP-064 (nunca un punto desde la prescripción; la clave de marcas no cambia; la persona y otra área
  no la reciben), y RM-41, RM-42 y RM-43.

**ED-75 · La tarjeta de fuerza en el detalle del ejercicio (V3 E-03)**
- *Toca:* el cuadro «Detalle» del ejercicio (ED-23) y un `fuerza/tarjeta.tsx` nuevo.
- *Cómo se ve,* aparte de «Series del plan», bajo «Lo registrado», y nunca mezclada con la prescripción:
  - «Fuerza estimada · Press de banca plano con barra» (el nombre del catálogo);
  - «≈ 98 kg · 11 nov · estimación orientativa · Epley v1» (de 11 a 12; de hasta 10, por ejemplo, «≈ 86,5 kg · 11 nov ·
    estimación · Epley v1»);
  - «70 kg × 10 · RIR 2 · la escribió Diego en la app» (o «la observó Martín»);
  - «Cómo se calculó», «Ver evolución» y «Registrar una serie observada».
- *Qué serie muestra* (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12): la regla por sesión
  de ED-74 con el interruptor apagado, sobre la última sesión con series que entran. Si esa sesión solo tiene series de
  11 a 12, muestra la de mayor carga de ellas como «estimación orientativa».
- *Sin estimación:* «Todavía no hay series que permitan estimar», con lo que hace falta en palabras y «Registrar una
  serie observada». Cuando lo que falta es una serie que entre, lo que hace falta incluye la regla del RIR, con el texto
  de ED-72: «BE estima solo con series de RIR 0 a 2: más lejos del fallo, el RIR que se escribe es menos confiable.»
  (Dirección, 2026-11-12, sobre R3).
- *Solo en los ejercicios de la lista* de la v1; en los demás no aparece. Si ED-74 no llegó (§8), la tarjeta muestra
  solo las observaciones.
- *Dado* Diego con una sesión escrita en la app nueva (70 kg × 10 con RIR 2 en el Press de banca plano con barra),
  *cuando* Martín abre el «Detalle» de ese ejercicio en la estación, *entonces* la tarjeta dice «≈ 98 kg» con su fecha,
  «estimación orientativa» (son 12 repeticiones equivalentes) y quién la escribió, aparte de lo que indica el plan, y
  abrirla no cambia nada de la prescripción.
- *Dado* que la última sesión tiene 70 kg × 12 con RIR 0 y 65 kg × 8 con RIR 2, *cuando* Martín abre el «Detalle»,
  *entonces* la tarjeta dice «≈ 86,5 kg · 11 nov · estimación · Epley v1», con «65 kg × 8 · RIR 2».
- *Dado* un ejercicio de la lista sin series que entren, *cuando* se abre su «Detalle», *entonces* la tarjeta dice qué
  hace falta y ofrece «Registrar una serie observada», sin ningún valor.
- *Dado* un ejercicio de la lista cuyas series escritas por la persona tienen RIR 3, o ningún RIR, *cuando* se abre su
  «Detalle», *entonces* la tarjeta dice «Todavía no hay series que permitan estimar» y la regla del RIR, con «Registrar
  una serie observada», sin ningún valor.
- *Pruebas:* TEST-EDP-065 (la tarjeta lee lo registrado, nunca la prescripción; el estado vacío, con la regla del RIR;
  fuera de la lista no aparece).

**ED-76 · Usar la estimación para planificar: del % a los kilos**
- *Resuelve:* la fuente (c) de Dirección; reemplaza la recomendación DJ-12.
- *Toca:* `ejercicio-del-editor.tsx` y `objetivos-por-serie.tsx` (la entrada), un `fuerza/carga-desde-la-estimacion.tsx`
  nuevo y una función del dominio, sin React (`cargaDesdeLaEstimacion`: el %, el paso y el sentido del redondeo).
- *Cómo funciona,* desde la fila general del ejercicio o desde las series elegidas: «Calcular la carga desde la
  estimación…» abre un cuadro con
  - las estimaciones de ese ejercicio en la misma unidad, con su fecha, su origen y su antigüedad («de hace 7
    semanas»), ninguna elegida (ED-D20);
  - el % RM que escribe el profesional;
  - el paso del redondeo (2,5 kg de entrada; 1 y 0,5 kg; 5 y 2,5 lb) y su sentido (ED-D17);
  - la cuenta a la vista: «75 % RM de 98,0 kg = 73,5 kg → 72,5 kg (múltiplo de 2,5, hacia abajo)», con el resultado
    editable;
  - un solo principal: «Escribir 72,5 kg en Press de banca».
- *Lo que escribe,* solo al confirmar, en el borrador (que se autoguarda y nunca se activa solo):
  - la carga sugerida, en la fila general o en las series elegidas;
  - si el criterio es % RM, el % y la referencia «1RM estimado · Epley v1 · 11/11/2026» (B10-06:426-431): el método y
    la fecha, nunca el valor, porque el plan viaja a otras áreas (RES-06);
  - si el criterio es RIR, solo la carga: BE no convierte entre criterios (06:5431).
- *Lo que nunca hace:* escribir sin el clic, recalcular al abrir el plan o cuando aparece una estimación nueva, ni
  pasar de kg a lb.
- *Dado* el Press de banca con una estimación de 98,0 kg, *cuando* Martín escribe 75 % y confirma, *entonces* la carga
  general es 72,5 kg y la referencia dice el método y la fecha.
- *Dado* el mismo cuadro, *cuando* Martín toca «Cancelar», *entonces* no se escribe nada.
- *Pruebas:* TEST-EDP-066 (nada se escribe sin confirmar; el redondeo es el elegido y se ve; la referencia nunca lleva el
  valor; RES-06 no lleva ninguna estimación), y RM-38 a RM-40.

**Los oráculos del método.** Los de V3 03 §12, adaptados y sin la fuente retractada (RM-01 a RM-22), más los del juicio
y los de las decisiones del 11/11. Los del método (RM-01 a RM-35 y RM-43, la regla por sesión con el interruptor de
ED-74) viven en `estimacion-de-fuerza.test.ts`; los de la observación, el cálculo de la carga y los permisos (RM-36 a
RM-42), en las pruebas de ED-72, ED-76 y ED-74; todos, en el
archivo de oráculos. La cuenta usa el valor con todos sus decimales, y la vista, «≈» al medio kilo.

| ID | Caso | Resultado |
|---|---|---|
| RM-01 | Una prescripción 70 × 12 con RIR 0, sin registro | Ningún valor: lo indicado no es fuerza |
| RM-02 | Escrita por la persona: 70 × 12 con RIR 0 | 98,0 kg (n_eq 12), orientativa, con la fecha civil de la sesión |
| RM-03 | 80 × 6 con RIR 2 | 101,3 kg (n_eq 8), núcleo; en la vista, «≈ 101,5 kg» |
| RM-04 | 70 × 12 con RIR 2 | Fuera (n_eq 14), con su motivo; ni 102,6 ni 102,7 a la vista |
| RM-05 | 90 × 5 con RIR 0 | 105,0 kg, núcleo |
| RM-06 | 100 × 1 con RIR 0 | 100,0 kg (n_eq 1: la carga), nunca 103,3, y nunca «1RM real» |
| RM-07 | 100 × 1 con RIR 2 | 110,0 kg (n_eq 3), núcleo: «estimación», nunca «orientativa» |
| RM-08 | Sin RIR | Fuera («sin RIR»); nunca se supone 0 |
| RM-09 | 15 repeticiones | Fuera (más de 12 equivalentes) |
| RM-10 | Press de banca con barra y press en máquina | Nunca en la misma línea: la identidad es el `exerciseId` |
| RM-11 | Una corrección cambia la carga de la serie elegida | Si la corrige la persona desde la app, se recalcula al leer con el registro vigente; si la corrige el profesional, ese valor pierde su procedencia (ED-70) y la serie queda fuera, con su motivo. En los dos casos, el original queda en el historial y su valor se reproduce |
| RM-12 | Un solo punto; después, dos | Con uno, ningún cambio; con dos, la diferencia en kg entre estimaciones, nunca un % |
| RM-13 | Cualquier vista | Nunca «1RM real», «máximo real», «récord» ni «marca personal» |
| RM-14 | Cada punto | Dice el método y la versión |
| RM-15 | Una sesión del 11/11 a las 23:30 en la zona de la persona | Se dibuja el 11 nov, con la fecha civil y la zona de la ejecución; nunca por UTC ni con Buenos Aires fijo |
| RM-16 | Un ejercicio fuera de la lista | Sin valor y sin tarjeta |
| RM-17 | Una dominada, con o sin asistencia, sin carga | Sin valor: la v1 no modela el peso corporal |
| RM-18 | La misma serie, cuando exista una v2 del método | La v1 se sigue reproduciendo; nunca dos valores del mismo método para la misma serie |
| RM-19 | La persona corrige el RIR de 2 a 1 | Un valor nuevo al leer, con la corrección a la vista; el plan no cambia |
| RM-20 | El profesional cambia el RIR objetivo en un borrador | Ninguna estimación cambia |
| RM-21 | Cada valor | Dice de dónde sale («la escribió Diego en la app» o «la observó Martín») y su fecha; nunca «validado» |
| RM-22 | Cada vista | Sin intervalo ni «±»; al medio kilo, con «≈»; la décima, solo en «Cómo se calculó» |
| RM-23 | Una serie de carga rápida (`AS_PLANNED`) | Sin valor |
| RM-24 | La persona escribe solo las repeticiones; la carga y el RIR son los del plan | Fuera («la carga y el RIR son los del plan») |
| RM-25 | Un ejercicio sustituido en la sesión | Fuera |
| RM-26 | 0 kg | Sin valor |
| RM-27 | 70 × 10 con RIR 2, y 70 × 12 con RIR 0 | n_eq 12 las dos: 98,0 kg, orientativas |
| RM-28 | 80 × 6 con RIR 1,5 | 100,0 kg (n_eq 7,5), núcleo |
| RM-29 | Series en kg y en lb del mismo ejercicio | Dos series aparte; nunca se convierte |
| RM-30 | La carga por implemento, o las repeticiones por lado | Fuera en la v1 |
| RM-31 | Cualquier estimación | Ningún aviso, novedad ni «Te toca a vos» |
| RM-32 | Los textos nuevos | Pasan las guardias de Entrenamiento y de fuerza, con su mutación |
| RM-33 | Una serie registrada antes de la procedencia | Fuera, con su motivo |
| RM-34 | En una sesión, 80 × 10 con RIR 1 (109,3) y 95 × 3 con RIR 1 (107,7) | Se toma 95 × 3: 107,7 kg; nunca la mayor estimación |
| RM-35 | Dos series que entran, con la misma carga | La primera de la sesión |
| RM-36 | El profesional observa 85 × 5 con RIR 1 | 102,0 kg (n_eq 6), guardada con la fecha, el autor, el método y la versión; no se edita: se sucede |
| RM-37 | Observa 60 × 15 con RIR 0, 80 × 5 con RIR 3 o 80 × 5 sin RIR | No se estima, lo dice y no se guarda (ED-D19) |
| RM-38 | 75 % RM de 98,0 kg, con paso de 2,5 kg | «73,5 → 72,5 kg», a la vista; se escribe solo al confirmar |
| RM-39 | 75 % RM de 220 lb, con paso de 5 lb | 165 lb; nunca se pasa a kg |
| RM-40 | La referencia del % RM que escribe ED-76 | El método y la fecha, nunca el valor |
| RM-41 | La persona (la API y la APK) | Nunca recibe una estimación ni una serie observada |
| RM-42 | Un profesional sin el PDP de Entrenamiento, u otra área | El 404 de lo inexistente; nada viaja por la matriz §3.1 ni por RES-06 |
| RM-43 | Una sesión: 70 × 12 RIR 0 y 65 × 8 RIR 2 | Apagado, 65 × 8: 86,67, «≈ 86,5 kg»; encendido, 70 × 12: 98,0 |

### 5.9 Los oráculos

Se escriben con sus trece campos en `WP-EDITORES-PROFESIONAL-ORACULOS.md`, antes del código de cada parte, como los de
`WP-FORMULARIOS-DE-INICIO-ORACULOS.md`, y el archivo empieza con la definición de terminado de diez puntos (ED-00).
Cada comprobación negativa («la pantalla no dice X», «nunca suma cero») tiene su mutación verificada. Son:
- TEST-EDP-001 a 043, de las partes de la declaración, con 004, 008, 010, 013, 015, 027 y 032 reescritas por las
  decisiones del 11/11;
- TEST-EDP-047 a 058, de las partes que suma V3 (ED-60 a ED-65, ED-18 y los criterios nuevos de ED-14, ED-15, ED-23,
  ED-33 y ED-40);
- TEST-EDP-059 a 066, de la vertical de fuerza (ED-70 a ED-76), y RM-01 a RM-43, del método;
- cuatro transversales:
  - TEST-EDP-044: ningún texto nuevo dice «cumplimiento», «adherencia» ni «racha», tampoco en negación;
  - TEST-EDP-045: ningún color nuevo dice bien o mal; los tokens nuevos tienen su par en `contraste.test.cjs`;
  - TEST-EDP-046: lo que lee la APK vigente no cambia, salvo la procedencia (ED-70). Las lecturas congeladas de la
    0.23.0-candidata.2 siguen verdes con lo que ella registra, y el caso de una ejecución con procedencia leída por
    ella queda declarado y probado, como en DL-161;
  - TEST-EDP-067: ninguna respuesta a la persona (la API y la APK), ni RES-06, ni «Otras áreas» lleva una estimación o
    una serie observada.

## 6. Decisiones (DL-167 y DL-171)

Cada una con la recomendación y la alternativa. Las del paquete son ED-D; las del juicio de V3, DJ (§6.2); las de la
implementación, EDT-. El estado, al 2026-11-12: las ED-D y las DJ, todas decididas; las EDT, a ratificar cuando
aparezcan.

### 6.1 Las del paquete (ED-D)

- **Decididas el 11/11:** ED-D5 (por DJ-4), ED-D7 (por DJ-5), ED-D9 (aprobada antes), y ED-D10 y ED-D12, reescritas
  como recomendó el juicio.
- **Decididas el 2026-11-12, como se recomendaban** (Dirección aprobó la página de maquetas v3 entera): ED-D1 a ED-D4
  (ED-D2, con DJ-7 aplicada), ED-D6, ED-D8, ED-D11 y ED-D13 a ED-D16; y las de la fuerza, ED-D17 a ED-D21. En cada una
  rige la columna «Recomendación».

| ID | Pregunta | Recomendación | Alternativa |
|---|---|---|---|
| ED-D1 | ¿Cuándo el asistente y cuándo la estación? | Sin plan, «Crear el plan» abre el asistente. Con plan vigente, «Ajustar el plan» abre la estación, y «Rehacer con el asistente» queda en el «⋯». Quien prefiera el asistente lo tiene siempre a un clic, y el asistente tiene «Seguir en la estación» en el pie (V3) | El asistente siempre primero: más pasos para el experto en cada ajuste |
| ED-D2 | ¿Qué trae BE como preset y quién lo valida? | Solo esquemas sin datos de la persona: estructuras (nombres y días sugeridos), prescripciones sin cargas y estructuras del día. **Sin repartos en %** (DJ-7). Ningún ejercicio ni alimento elegido por BE; versionados en el dominio; Dirección los valida antes de publicarlos; rótulo «De BE · punto de partida, no una recomendación» | Presets de BE con ejercicios y alimentos: más rápido, pero BE elegiría el contenido de la prescripción (INV-06-143) y pediría validación disciplinar |
| ED-D3 | ¿Dónde se guardan los presets propios? | En lo que ya existe (plantillas, habituales y recetas), más dos modelos chicos: la prescripción habitual y el reparto habitual (ED-13) | Un modelo genérico «preset», con un JSON por tipo: un concepto nuevo que duplica plantillas y habituales |
| ED-D4 | ¿Un día tipo puede tener solo algunas comidas? (B07 y B23; §12.2 de la auditoría) | Sí: es decisión del profesional. Se dice como cuenta («Día de descanso: 1 comida») en «Antes de activar» y en el plan activo, sin color y sin bloquear | Una marca explícita «día parcial»: un campo nuevo que toca la API y lo que lee la app |
| ED-D5 | ¿Un día de referencia con totales? (B19; §12.3) | **Decidida por DJ-4:** el rango del día, «el día va de X a Y kcal según lo que elija», con «Sin dato» si falta y sin una opción elegida, solo para el profesional (ED-34). Enmienda TB-38 y TEST-TAG-025, y la prueba de TB-39 | «Un día posible», con una opción por comida (la propuesta anterior de esta decisión); o nada, como estaba ratificado |
| ED-D6 | ¿Cómo son «al instante» los totales? | El editor calcula con la función del dominio (`SUM_SOURCE_PER_100G_V1`) apenas cambia una cantidad; al guardar, API-PLN-01 confirma, y una prueba asegura que dan lo mismo | Esperar a la API en cada cambio: con Render, cerca de un segundo por cambio |
| ED-D7 | La persona sin la app que muestra los objetivos por serie (A17) | **Decidida por DJ-5:** un aviso, no un bloqueo. Desde el 11/11 cuenta solo la 0.23.0-candidata.2 (UF-00), que los muestra; activar deja de esperar a quien todavía no abrió la app, y el editor lo dice en una línea (ED-08). La entrega a un cliente sin la capacidad sigue retenida | Mantener el bloqueo y avisarlo a tiempo en el editor (la recomendación anterior, atada a la 0.13.2) |
| ED-D8 | «2.400» en un campo (B03) | En los campos enteros (kcal, repeticiones y segundos), «2.400» se lee 2400 y se dice «Se guarda como 2400 kcal». En los decimales sigue DL-091. Es una función nueva del dominio; `leerNumero` no cambia | Dejar la regla como está: el aviso ya explica cómo escribirlo |
| ED-D9 | ¿«Persona» o «asesorado» en el website? | **Decidida:** «persona», o el nombre (DL-169), en todo lo visible del website profesional, como en la app y en la ficha canónica. Los textos legales con versión cambian en su versión siguiente, y el legajo no se toca | Dejar «asesorado» en el website, que es el término del legajo |
| ED-D10 | Salir con cambios sin guardar | **Decidida, reescrita:** si se puede guardar, aparece «Guardando antes de salir…» y se sale con la respuesta del servidor; si no se puede, falla o hay conflicto, el cuadro, con «Seguir editando» como principal. «Atrás» del navegador queda como un límite declarado | Preguntar siempre |
| ED-D11 | La progresión por semana antes del 25/11 | Sobre los microciclos de hoy, con vista previa y sin regla guardada. La app muestra las semanas juntas, en orden, hasta TB-44 | Esperar a TB-43 y TB-44 (las semanas en el calendario y la app que muestra la que toca), que piden la API y una APK nueva |
| ED-D12 | Escalar una opción | **Decidida, reescrita:** «a un valor» solo si se conoce el total de ese nutriente; si no, «por un factor», con el «Sin dato» a la vista. Nunca una opción de receta. Se redondea según la unidad, y lo que está en unidades no se escala. ED-52 pasa a llamarse «Cambiar por otro alimento (misma energía)» | Escalar también las porciones de una receta: un campo nuevo en la opción |
| ED-D13 | Listas de intercambio (modalidad B) | No antes del 25/11: piden un catálogo de grupos, un modelo, una app y validación. Mientras tanto, «Cambiar por un equivalente» (ED-52) | Empezar ahora con un catálogo de grupos chico |
| ED-D14 | El plan en PDF para la persona | Imprimir desde el navegador una versión activada, con encabezado y leyenda de confidencialidad; sin PDF en el servidor | Un PDF que genera la API, con auditoría: otra dependencia y otra operación |
| ED-D15 | Solicitudes que inicia la persona (C10; §12.6) | No crear la bandeja: la ayuda dice que el vínculo lo pide el profesional y lo acepta la persona | Una bandeja «Solicitudes recibidas», con autorización de las dos partes y su análisis legal |
| ED-D16 | Atajos y planilla | «Vista simple» por defecto y «Vista planilla» como preferencia del navegador; atajos visibles y nunca necesarios | La planilla como única vista de la estación |
| ED-D17 | ¿Hacia dónde redondea la carga sugerida desde un %? (ED-76) | Hacia abajo, al múltiplo elegido (2,5 kg de entrada): nunca más que el % pedido. El resultado se ve antes y después, y se puede editar | Al múltiplo más cercano |
| ED-D18 | ¿Qué ejercicios entran en la v1? (ED-71) | Los de barra, con carga externa total y patrón bilateral, del catálogo base, con sus nombres de ahí: «Sentadilla trasera con barra», «Sentadilla frontal con barra», «Press de banca plano con barra», «Peso muerto convencional», «Press de hombros con barra» (el press militar con barra) y «Remo inclinado con barra, agarre prono» (el de agarre supino es otro ejercicio). La especificación los fija por su `exerciseId`. Sumar uno es una versión nueva de la especificación | Abrir a cualquier ejercicio con carga externa: máquinas y poleas no se comparan entre sí |
| ED-D19 | ¿Una serie observada que no se puede estimar se guarda? (ED-72) | No: la observación existe para estimar, y el cuadro dice por qué no se puede | Guardarla «sin estimación», como dato de la evaluación |
| ED-D20 | ¿Qué estimación usa el cálculo de la carga? (ED-76) | La que elige el profesional, con su fecha, su origen y su antigüedad a la vista; ninguna elegida de entrada | La más reciente, elegida de entrada |
| ED-D21 | ¿La persona ve su serie observada? | No en la v1 (DJ-1: solo el profesional). Entra en lo que la persona puede pedir de sus datos cuando exista UF-06 | Mostrarla en la próxima APK |

**ED-D19 y el RIR de la serie observada** (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12,
sobre «y el RIR si aplica» de la fuente (a)): el RIR es obligatorio, de 0 a 2. Si la serie fue al fallo, es 0 y se
escribe igual; con un RIR mayor que 2, Epley no estima, y una observación que no se puede estimar no se guarda. Sin RIR,
el cuadro dice «Sin RIR no se puede estimar» (ED-72).

### 6.2 Las del juicio de V3 (DJ), decididas por Dirección el 2026-11-11

| ID | Pregunta | Lo decidido | Dónde |
|---|---|---|---|
| DJ-1 | ¿BE adopta un método propio de estimación de la repetición máxima? | **Sí:** Epley v1, en esta actualización, con las reglas de DL-171; solo para el profesional y en el website; nunca como marca; nunca invitar a un máximo | DL-171; ED-71 a ED-76 |
| DJ-2 | ¿La serie registrada guarda qué campos vinieron del plan? | **Sí, en la APK de esta actualización.** Las series de antes, sin procedencia, quedan fuera del cálculo | ED-70 |
| DJ-3 | ¿Qué se celebra de lo que hace la persona? | **Un acto, nunca un número** (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12; abajo) | DL-170 |
| DJ-4 | ¿Un total del día en el editor de Nutrición? | **El rango del día,** con «Sin dato» si falta, sin una opción elegida, solo para el profesional; enmienda TB-38 y TEST-TAG-025 | ED-34 |
| DJ-5 | ¿Se sigue bloqueando la activación si la persona nunca abrió una app que muestre objetivos por serie? | **No: un aviso** | ED-08 |
| DJ-6 | ¿Cómo se revisa y se activa? | **Una entrada fija, «Revisar y activar…»,** que abre «Antes de activar»: valida al abrirse, lleva a cada cosa por corregir y deja «Activar la versión de [área]» apagado, con su motivo, hasta resolverlas. «Guardar ahora», fijo y secundario junto al estado. El borrador, numerado | ED-07, ED-15 |
| DJ-7 | ¿Repartos de macros en porcentaje? | **No antes del 25/11:** en gramos | ED-30, ED-13, ED-D2 |
| DJ-8 | ¿Qué pasa con las cargas al aplicar un preset? | **Se conservan** y se marcan para revisar; vista previa cuando el preset pisa valores o cambia la cantidad de series | ED-11 |
| DJ-9 | ¿Qué se hace ante un conflicto 409? | Antes del 25/11, solo el conflicto falso; «Ver diferencias» y «Guardar lo mío encima», P2 | ED-61, ED-56 |
| DJ-10 | ¿La hora del último guardado después de recargar? | «Guardado», sin hora | ED-03 |
| DJ-11 | ¿Recetas dentro de plantillas y comidas habituales? | Antes del 25/11, «Guardar como preset» dice qué no entra; después, `recipeVersionId` | ED-12 |
| DJ-12 | ¿«Usar como referencia»? | **Reemplazada** por la fuente (c): el profesional elige un % y BE sugiere los kilos, que él confirma; la referencia del % RM nombra el método y la fecha, nunca el valor | ED-76; DL-171 |
| DJ-13 | ¿Tipo de serie (aproximación o efectiva)? | Con una APK nueva, después; en la v1, las bandas y el RIR dejan afuera las de aproximación | ED-23 |
| DJ-14 | ¿El profesional nuevo ve la historia del anterior? | No: RF-025, desde el inicio del acompañamiento | ED-74 |
| DJ-15 | ¿Registrar fuera del plan, u otro deporte? | Fuera de alcance | §10 |
| DJ-16 | ¿Cancelar o hacer vencer pedidos de información? | Después (cambia REG-06-210); antes del 25/11, solo el aviso de pendiente | ED-40 |

**DJ-3, con la recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12:** se aplica la regla de
Dirección del 8/11, registrada en DL-170: «se celebra un acto, nunca un número». En la v1 la estimación es solo del
profesional (ED-D21), así que la app no celebra nada de fuerza, y el ejemplo del juicio («Primera vez con 82,5 kg × 5»)
queda descartado. Si una etapa posterior muestra algo a la persona, se celebra el acto (por ejemplo, «Registraste las
4 series»), nunca la carga ni la estimación.

**De V3, lo que se conserva como está:** el acceso transversal a otras áreas («Otras áreas», TB-54; D-V3-01); los
gráficos por fecha real y por ejercicio (D-V3-06); ninguna activación conjunta de las áreas (D-V3-08); y la
estimación, fuera de la APK de la persona (D-V3-02, por DJ-1). El 1RM medido con protocolo (D-V3-03) queda para después.

**Las de la auditoría que el código ya resolvió** (se pide ratificar que el rediseño las conserve):
- la receta editada después no cambia el plan (`recipeVersionId`, DL-119);
- el descarte, solo de un borrador nunca activado (D-21, TB-47);
- la edición simultánea responde un conflicto explícito (DL-148).

### 6.3 Las de la implementación (EDT), a ratificar por Dirección

Las tomó Claude al programar la etapa 1 (EDT-01 a EDT-10), la etapa 2 del website (EDT-11 a EDT-20) y la etapa 3 del
website (EDT-21 en adelante), el 2026-11-12. Ninguna cambia la forma de un contrato ni lo que la API acepta o devuelve. Cada una dice qué se eligió y qué otra opción había, y su commit la explica.

| ID | Parte | Lo elegido | La alternativa |
|---|---|---|---|
| EDT-01 | ED-63 | Una versión aparte para los textos del diccionario de métricas (`VERSION_DE_LOS_TEXTOS_DEL_DICCIONARIO`); la de las derivaciones, la que devuelve API-PRJ-01, no sube: sin ventana (R1) | Subir la versión única, en la ventana del vie 20 |
| EDT-02 | ED-60 | Un cambio escrito mientras viajaba un guardado rechazado cuenta como el cambio que destraba el autoguardado: lo nuevo se intenta en la primera pausa | Esperar el próximo cambio |
| EDT-03 | ED-61 | Un identificador que creó el guardado perdido va solo a una parte nueva con el mismo contenido que se mandó, en su lugar o movida; una parte que ya existía se busca por su identificador. Una parte que cambió después del envío queda sin el suyo, y el guardado siguiente la crea de nuevo con lo que está en pantalla. Nunca se asigna un identificador a otra parte ni se repite (corregida el 2026-11-12: el injerto por posición se lo daba a otra parte, por ejemplo a una nueva que se agregaba arriba) | Seguir cada parte con una clave propia del editor, que cambiaba la forma de lo que se guarda; o injertar por posición, que cruzaba identificadores |
| EDT-04 | ED-03 | El detalle técnico, plegado y solo para el profesional, muestra el estado HTTP y el código del error, como pide ED-03. 10-B01:1146-1189 dice que el código no se muestra | Solo el motivo en palabras y la hora |
| EDT-05 | ED-07 | El cuadro vive en `cuadro-antes-de-activar.tsx` y la regla, en `antes-de-activar.ts` (los oráculos la nombran así) | `antes-de-activar.tsx`, el nombre de §5.2, que dejaba ambigua la importación |
| EDT-06 | ED-07 | «Lo que va a ver la persona»: cada sesión con sus días y lo que tiene; en Nutrición, cada día tipo con sus comidas | Un resumen por semana, que depende de TB-44 |
| EDT-07 | ED-62 | `useClaveDeIntento` no cambia para las demás escrituras: `descartar()` sigue tirando la clave, y los editores no lo llaman con un resultado incierto. Con lo que se manda (`de`), otro pedido usa otra clave | Que `descartar()` la conserve siempre: en los diálogos del vínculo, la misma clave con otro cuerpo da 409 IDEMPOTENCY_KEY_REUSED |
| EDT-08 | ED-02 | La guardia de la salida es un contexto en `app/pro/layout.tsx`, alrededor de la compuerta de UF-01, y los enlaces la consultan en el `onNavigate` de `<Link>`. Desde el 2026-11-12, todos por `Enlace` (`components/enlace.tsx`): en `app/pro/**` y `components/**` nadie importa `next/link` directo, y cada `router.push` pasa por `antesDeSalir`, salvo tres con su motivo (la revisión adversaria encontró la marca, la campana, el menú de la cuenta y «Ir a Mis recetas» sin la guardia) | Interceptar todos los clics del documento, que también toma enlaces que no navegan; o poner la guardia enlace por enlace, que dejaba afuera los que nadie se acordaba |
| EDT-09 | ED-04 | La salida de un campo se escucha una vez, en el `onBlur` del `<form>`, y el campo se reconoce por su `id` y los de sus grupos | Un `onBlur` en cada campo, cerca de cuarenta controles |
| EDT-10 | ED-06 | Lo que también devuelve la API y dice «asesorado» (el mensaje del 409 CLIENT_CAPABILITY_REQUIRED y la referencia neutral de quien no tiene nombre) cambia con ED-08, en la ventana del vie 20. Hasta entonces, T13 los cuenta uno por uno | Cambiarlo ya y redesplegar la API fuera de la ventana |
| EDT-11 | ED-14 | El asistente es una vista de la página, una tarjeta por paso, y no un `<dialog>`: el buscador de ejercicios y la galería se abren como cuadros enfocados sin apilar uno sobre otro | Un diálogo por paso, que obligaba a abrir el buscador encima de otro cuadro (§2.3 lo prohíbe) |
| EDT-12 | ED-11 y ED-22 | La marca «escrita para 6-8: revisala» es de la pantalla: no viaja ni se guarda, y no sobrevive a recargar | Guardarla en la prescripción, que cambiaba el contrato (ventana del vie 20) |
| EDT-13 | ED-14 | El paso pedido vive en la dirección (`asistente=N`); el sugerido se deduce del borrador. «Siguiente» usa el mismo guardado que la estación y espera su respuesta; si viaja un autoguardado, espera a que termine en vez de mandar otro | Un guardado propio del asistente, con su estado aparte |
| EDT-14 | ED-20 | «Desde un preset» crea el borrador en blanco y abre la galería de estructuras en el paso 2 (`preset=estructura`, una vez) | Un preset como origen del borrador en la API, que no existe |
| EDT-15 | ED-16 | «Ajustar el plan» llega con `crear=vigente`: la vista del plan crea la versión desde la vigente una vez por llegada y, con un borrador, lo abre sin crear otro. La ficha ofrece «Seguir el borrador»; «Seguir con el asistente · paso N de 7» está en el «⋯» de la estación, porque la ficha no lee la estructura del borrador | Leer cada borrador desde la ficha para deducir el paso: una lectura más por persona y área |
| EDT-16 | ED-16 | La acción del plan va, por ahora, en la tarjeta de Entrenamiento; Nutrición la suma con su asistente y su estación (ED-30 y ED-33, etapa 3) | Las dos tarjetas ya, con Nutrición sin asistente |
| EDT-17 | ED-21 | Lo creado a mano o importado queda marcado y entra con «Agregar», como lo demás; marcar no escribe nada | Que lo creado entre solo, como antes |
| EDT-18 | ED-23 | «Volver a lo general» quita la clave del objetivo, también la de «Sin objetivo»: no deja `null` | Dejar `null`, que es «Sin objetivo en esta serie» (DL-122) |
| EDT-19 | ED-18 | El vidrio, solo en la estación y el asistente (`body:has(.estacion)`), y casi opaco en Claro (95 %; en Azul noche, 90 %): con menos, el borde de un campo no llega a 3:1 cuando pasa texto por detrás. «Lo que puede pasar detrás» es una lista de trece tokens más el fondo con sus destellos, sin el QR ni la figura | Todo el website de vidrio; o medir contra todos los tokens, que dejaba Claro opaco del todo |
| EDT-20 | ED-23 | `CuadroEnfocado` suma `focoEnCancelar`, para las confirmaciones que hacen perder algo (quitar una serie con valores propios) | Un `DialogoDeConfirmacion` aparte dentro de la planilla |
| EDT-21 | ED-31 y ED-34 | Los totales se estiman en el website con la cuenta del dominio (§8.2). La composición de cada alimento sale del buscador al elegirlo, de los habituales o, para lo que ya estaba en el plan, de una lectura del buscador por su nombre que se acepta solo si vuelve el mismo alimento (por su identidad); de a tres lecturas, una vez cada uno. Si no vuelve, «Sin dato: no se pudo leer su composición» | Esperar a API-PLN-01 (la ventana del vie 20) y no mostrar totales hasta entonces; o una lectura nueva del catálogo por identidad, que es de la API |
| EDT-22 | ED-34 | El rango de cada comida va del mínimo al máximo **de cada nutriente por separado**: el mínimo de proteínas puede venir de otra opción que el de las kcal. El del día suma esos mínimos y esos máximos | Tomar los macros de la opción con menos y con más kcal |
| EDT-23 | ED-34 | En Nutrición, el panel es una columna al costado del editor que ya existía (desde 1280; por debajo, abajo), con «Rangos y totales» primero y «Antes de activar» en vivo | Pasar el editor de Nutrición a la estación de tres zonas (ED-15 para Nutrición), que es más grande y queda para después |
| EDT-24 | ED-33 | «Contenido» es un alimento o una receta en alguna opción; en un día tipo, alguna comida. Una «Opción 1» vacía recién creada se quita sin preguntar. La confirmación se suma también al quitar una opción | Preguntar siempre, también sin nada escrito |
| EDT-25 | ED-32 | La receta nueva se crea en un cuadro; agregarla al plan es un cambio del borrador que viaja con el autoguardado. «No se pudo agregar» es que la comida ya no está o llegó a doce opciones: el reintento usa la misma versión y no la duplica | Un PATCH propio justo después de crear la receta, con su falla aparte |
| EDT-26 | ED-40 | El aviso dice «Ya hay un pedido de «Cómo comés hoy» del 3/11 que todavía no respondió. Podés enviar otro igual.»: sale de las solicitudes de la persona, y así es cierto sin saber quién lo pidió | «Ya le pediste…», el texto de §5.6, que supone que lo pidió el mismo profesional |
| EDT-27 | ED-40 | Las partes vienen plegadas solo si el formulario tiene más de una; con algo por completar en las preguntas, se abren todas para que el foco llegue. El buscador de preguntas no se suma todavía | Plegadas siempre; o el buscador ya, en esta tanda |
| EDT-28 | ED-41 | Los textos nuevos viven en el website (`vinculo-en-palabras.ts`); los de `COPY_INVITACION` y `COPY_VINCULO` no cambian, porque los leen la APK y la API | Cambiarlos en el dominio, que reconstruye la API (`render.yaml`) |
| EDT-29 | ED-41 | Un estado nombra el acceso solo para decir que lo decide la persona: «Usada · el vínculo empezó; el acceso a sus datos lo decide la persona» y «Aceptada · …» (TEST-EDP-035) | «Usada» y «Aceptada» a secas |
| EDT-30 | ED-23 | «Copiar la prescripción a…» y «Copiar estas series a…» van a otros ejercicios de la misma sesión. La prescripción es todo menos el ejercicio, su identificador y su nota; las series, solo las series | A cualquier ejercicio del plan, con un destino de dos niveles |
| EDT-31 | ED-24 | La sesión copiada a otro bloque o semana conserva su nombre (es la misma sesión en otra semana), va al final del destino y sin días: los elige con los chips | El sufijo «(copia)», como «Duplicar» |
| EDT-32 | ED-21 | Los chips por zona filtran lo que trajo la búsqueda, y varias zonas se suman (o): un ejercicio entra si nombra alguna, como principal o secundaria | Que se crucen (y); o filtrar el catálogo entero, que es de la API |
| EDT-33 | ED-23 | No se suma «Detalle» de la serie en un cuadro: una serie tiene cinco campos en el contrato (repeticiones, RIR, carga, descanso y nota) y los cinco ya están en su fila; el tempo y los parámetros por serie no existen (DJ-13) | Un cuadro que repite la fila |
| EDT-34 | ED-14 | «Lo que llevás armado» se ve desde el paso 2 y se deduce del borrador (no se guarda): la estructura y, por sesión, sus ejercicios, lo que falta prescribir y sus días, hasta ocho sesiones | Guardarlo como un resumen aparte del asistente |

**Ratificación (2026-11-12).** Dirección escribió «Ratifico todo como recomendaste y ok para integrar»:
- EDT-01 a EDT-20 quedan ratificadas. En EDT-04, el código del error plegado va solo en el website del profesional y
  sin datos de la persona.
- EDT-21 a EDT-34 se aplican con la delegación del mismo día («Okey a tus recomendaciones») y quedan ratificadas como se
  recomendaron.
- ED-24, «Duplicar el día»: copia las sesiones de ese día a otro día.
- ED-11: las plantillas van como una pestaña más de la galería, y el borrador anota de qué plantilla salió.
- Las dos quedan para la próxima tanda, porque no son parte del website integrado hoy.

**Las de la API (EDT-35 en adelante), a ratificar.** Las tomó Claude al programar la tarea 1 (la API y el dominio, rama
`wp-editores-api`), el 2026-11-12. Todas son aditivas: ninguna cambia lo que leen las APK.

| ID | Parte | Lo elegido | La alternativa |
|---|---|---|---|
| EDT-35 | ED-70 | Un `fieldOrigins` vacío no se guarda (se normaliza, como `TYPED`); `PLAN` en una serie `AS_PLANNED` se acepta, y solo `PERSON` se rechaza (FIELD_ORIGIN_PERSON_AS_PLANNED), como dice §5.8 | Rechazar el objeto vacío con un 422 |
| EDT-36 | ED-70 | En una corrección del profesional, cada serie se compara con la vigente por la prescripción y el número de serie, con los valores en su forma canónica (la carga vigente sale de JSONB con otro orden de claves). La procedencia se conserva o se saca, nunca se cambia ni se agrega: un valor que no cambió lleva la clave que tenía o ninguna; uno que cambió, o el de una serie nueva, va sin clave. `PERSON` en un valor que cambió es FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE; lo demás (de `AS_PLANNED`, de una serie de antes o de `PLAN` a `PERSON`, o `PLAN` en un valor que cambió) es FIELD_ORIGIN_NOT_PRESERVED. Así el profesional no le agrega el campo a una serie de la 0.24 (revisión adversaria del 12/11) | Comparar por posición, que se cruza si el profesional agrega o quita una serie |
| EDT-37 | ED-72 | Las rutas son `/advisees/{adviseeId}/training/observed-sets` (FZA-01 y 02) y `/training/observed-sets/{id}/successors` (FZA-03, con `action` CORRECT o VOID). La versión es la posición en la cadena (`v1`, `v2`): suceder a una que ya tiene sucesora es 409 | Un PATCH sobre la observación, que se parece a editarla |
| EDT-38 | ED-72 | FZA-02 lista solo las vigentes del propio profesional (como las evaluaciones, DL-057), hasta 200 y sin paginar: el tope es definitivo, `hasMore` dice que hay más y `nextCursor` es siempre `null`. La evolución (API-PRJ-01) las suma todas, sin tope: el período ya está acotado. Una fecha futura es 422 OBSERVED_DATE_IN_FUTURE | Sumar las de otros profesionales, que la matriz no deja ver |
| EDT-39 | ED-72 | La tabla `serie_observada` lleva un enum `tipo` (OBSERVADA o ANULACION): la anulación es una fila sin valores. La base repite la guardia de lo estimable (carga mayor que 0, RIR de 0 a 2, hasta 12 repeticiones equivalentes) y la de la sucesión, con `IS NOT NULL` explícito (`serie_observada_sin_nulos`, en una migración que solo agrega): un CHECK que da NULL se cumple | Una columna booleana, que la prueba del esquema prohíbe; o validar solo en la API |
| EDT-40 | ED-74 | La clave es `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`, una extensión de BE aparte de las ocho del 09 (`CLAVES_DE_PROYECCION_DE_BE`; TEST-PRJ-001 no cambia). El resultado trae cada punto con sus entradas, quién lo escribió y su origen, y las series que no entraron con su motivo, para «Cómo se calculó»; no una serie analítica. Las observaciones siguen el interruptor, como las sesiones | Reusar la serie analítica de la progresión, que no lleva las entradas de la cuenta |
| EDT-41 | ED-74 | En esta clave, `exerciseId` es el ejercicio del catálogo (uuid), no la clave `e:`/`v:` de la progresión: la lista de la v1 es por ejercicio | La clave de la progresión, que admite versiones sueltas |
| EDT-42 | ED-13 | Las rutas son `/training/prescription-presets` y `/nutrition/macro-presets`; quitar es el PATCH con `state: REMOVED` (que también renombra), como API-HAB-05; reemplazar pide `replaces` y `expectedVersion`. Una serie con carga es 400: no se descarta en silencio | DELETE; o descartar las cargas sin decirlo |
| EDT-43 | ED-13 | Las dos familias comparten una pieza de la API (`plataforma/presets-propios.ts`), con filas mutables y la historia en los eventos, como DL-109; quedan en 16 KB | Un servicio por familia, que repetía las mismas reglas |
| EDT-44 | ED-64 | Suben a 700 KB las cuatro rutas que nombra §5.1 (también API-HAB-05 y API-HAN-05, que solo renombran o quitan) | Solo las dos de guardar, y los PATCH en 16 KB: sus cuerpos no pasan de unos cientos de bytes. **La revisión adversaria del 12/11 recomienda esta alternativa;** no se cambió porque §5.1 nombra las cuatro: decide Dirección al ratificar |
| EDT-46 | ED-70 (TEST-EDP-046) | La APK 0.24 lee lo que ella registra, también después de que el profesional lo corrige (EDT-36 le impide agregar el campo). Una ejecución con procedencia, registrada con la APK nueva, no la lee la 0.24 («respuesta no reconocida» en ese detalle, en «Tu historial» del período y en el borrador): pasa solo si la misma persona vuelve a la 0.24 o usa dos teléfonos con versiones distintas. Queda como riesgo aceptado, como el de DL-161, y lo prueba `procedencia-por-campo.int-spec.ts` | Una capacidad nueva en `X-BE-Capabilities` (como DL-122): la API devuelve `fieldOrigins` solo a quien la declara. Una corrección desde la 0.24 perdería la procedencia sin aviso |
| EDT-45 | API-PLN-01 | La ruta es la del TB-38 (`/nutrition/plans/{planId}/option-estimates`). Un borrador se estima con lo que usaría la instantánea si se activara hoy; un alimento que ya no está disponible queda sin composición y la opción dice «sin dato» por él | Rechazar el borrador hasta que se pueda activar |

**Las del website (EDT-47 en adelante), a ratificar.** Las tomó Claude al programar la tarea 2 (el website de la API,
rama `wp-editores-api`), el 2026-11-12. Ninguna cambia la API ni lo que leen las APK.

| ID | Parte | Lo elegido | La alternativa |
|---|---|---|---|
| EDT-47 | ED-75 | El detalle con la fuerza es un cuadro al costado, «Detalle y fuerza estimada», que se abre desde el cuerpo del ejercicio y desde su «Más», solo en los ejercicios de la lista. «Lo que indica el plan» va arriba, en una línea, y «Lo registrado» abajo. «Las últimas sesiones» de la maqueta 14 queda para después: la tabla de origen de la evolución dice lo mismo | La tarjeta dentro del cuerpo del ejercicio, mezclada con la planilla |
| EDT-48 | ED-72 | La fecha de la observación se escribe en la zona que devuelve API-PRJ-01 en su período, y «Hoy» es el último día de ese período: el website no tiene una lectura de la zona de la persona | Una lectura nueva de la zona de la persona |
| EDT-49 | ED-72 | El RIR observado se elige de 0 a 2 de a medio (maqueta 17), más «Más de 2», que existe para que el cuadro diga «Con un RIR mayor que 2 no se estima» y no guarde nada (ED-D19) | Un campo libre |
| EDT-50 | ED-74 | La evolución es una pregunta del website (`pregunta=fuerza-estimada`), como la de la composición (TA-25): no se guarda como vista y usa el período de la ficha. El gráfico es propio (SVG), con la tabla de origen como su texto | Sumarla a `ID_DE_PREGUNTAS`, que cambia lo que acepta la API |
| EDT-51 | ED-76 | El cuadro de la carga escribe en la fila general; «desde las series elegidas» queda para después. El % RM de entrada es el del criterio, si es % RM | Escribir también en las series elegidas |
| EDT-52 | ED-13 | «Estas series, como prescripción habitual» sale del «⋯» de la versión y pide elegir el ejercicio de la sesión. Aplicar una habitual sigue DJ-8 como un preset de BE, y un objetivo propio de una serie que cambia se nombra antes | Guardarla desde el «Más» de cada ejercicio |
| EDT-53 | ED-24 | «Duplicar el día» va en la tira de la semana. Cada copia queda después de su original, con «(copia)», y lleva un identificador de sesión del cliente para entrar en la agenda con el día de destino en el mismo guardado (la API conserva el que recibe) | Copias sin identificador, con los días elegidos después de guardar |
| EDT-54 | ED-11 | Reemplazar el borrador con una plantilla son dos operaciones de hoy: descartar (API-PLE-05) y crear desde la plantilla (API-TRN-07). Si la segunda falla, la versión activa sigue igual y el diálogo de plantillas queda abierto con el motivo | Una operación nueva de la API que lo haga de una vez |

### 6.4 Las del cierre del website (EDC), a ratificar por Dirección

Las tomó Claude al programar el cierre del website (§8.7), el 2026-11-12, en paralelo con la rama de la API. Ninguna
cambia un contrato ni lo que la API acepta o devuelve.

| ID | Parte | Lo elegido | La alternativa |
|---|---|---|---|
| EDC-01 | ED-41 | «Solicitudes enviadas» es una sección a todo el ancho al pie del Espacio. Los filtros se cruzan (estado y persona); la persona se elige de una lista, por su identidad, porque con «Ocultar nombres» no se puede buscar un nombre que no se ve. Desde «Esperan respuesta» y tras un envío repetido llega con «Pendientes» | Una página propia; o un buscador de texto por persona |
| EDC-02 | ED-40 | El buscador mira la pregunta, su aclaración y el título de su parte, con todas las palabras. Buscando, «Pedir todas» y «Ninguna» de cada parte se reemplazan por «Pedir las n» y «Ninguna de las n», sobre lo que coincide | Dejar los de cada parte, que tocan preguntas que no se ven |
| EDC-03 | ED-33 | «Copiar desde otra comida» ofrece las opciones de todas las comidas del plan, de todos los días tipo, salvo la misma comida (para eso está «Duplicar opción») y las vacías. La copia conserva su nombre | Copiar comidas enteras; o el sufijo «(copia)» |
| EDC-04 | ED-33 | «Usar una comida habitual» suma sus opciones como opciones de la comida: con una sola, toma el nombre de la habitual; con varias, «Cena · Pescado». Nunca pasa de doce y dice cuántas no entraron | Solo su primera opción; o reemplazar las de la comida |
| EDC-05 | ED-31 | «Agregar ítem» abre la opción en un cuadro (maqueta 06), que trabaja sobre una copia: el borrador cambia con «Guardar la opción». El cajón que buscaba al enviar se retira; «Crear a mano» e «Importar» van adentro del cuadro | Sumar el cuadro y dejar el cajón (dos caminos para lo mismo); o un cuadro que escribe en vivo; o el buscador en línea debajo de la tabla de la estación, como dibuja la maqueta 08, que agrega sin abrir nada pero deja sin lugar el total al instante y el rango de la comida |
| EDC-06 | ED-31 | El buscador busca mientras se escribe (desde dos letras, con una pausa de 250 ms), con los habituales primero; las flechas eligen y Enter suma el marcado. La lista es una grilla (combobox con grilla, ARIA 1.2): cada resultado lleva su estrella de habitual (DL-109) en su propia celda, a la que se llega con la flecha a la derecha; Enter la alterna | Buscar al enviar, como antes: Enter no podía elegir |
| EDC-07 | ED-31 | En la lista, el origen va como texto breve, sin enlace (una opción de una lista no lleva un enlace adentro), con «Dato de demostración» y la completitud («Sin dato de fibra»). Un habitual que trajo también el catálogo usa lo del catálogo | El enlace con su pista, como en la tabla del cajón |
| EDC-08 | ED-32 | La foto es un paso del mismo cuadro después de guardar (con las dos salidas y tras el reintento del agregado), con «Volver al plan» como único principal; lo que pasó se dice al volver | Un aviso con un enlace a Mis recetas |
| EDC-09 | ED-32 | Se leen las recetas de las opciones del día tipo que se mira (API-REC-03, una vez cada una). La vista previa compara una porción de la versión nueva (sus ingredientes divididos por las porciones) con la porción que la API armó para el plan. Usarla cambia la versión que cita la opción y su nombre, si era el de la receta | Leer todas las recetas del plan al entrar; o comparar con la versión anterior entera, que no tiene lectura propia |
| EDC-10 | ED-21 | Los parecidos se buscan por el nombre entero y, con menos de tres, por su palabra más larga; se ordenan por las palabras que comparten y se muestran hasta cinco. Uno que se llama igual pide «Crear igual»; elegir un parecido lo marca, como lo creado | Impedir crear uno igual; o buscar solo por el nombre entero |
| EDC-11 | ED-30 | Los pasos de Nutrición son Punto de partida, Objetivo, Días tipo, Comidas, Opciones, Revisar y Activar. El 1 vive en la vista del plan; del 2 al 7, en el editor, con la estación montada detrás. No hay «Desde un preset»: los repartos propios son ED-13 | Un paso propio para el reparto, que necesita ED-13 |
| EDC-12 | ED-30 | El número de la versión del objetivo es su lugar, por fecha de creación, entre las versiones de su mismo objetivo (la API no lo devuelve). Se cuentan todas las páginas; si la lista no se lee entera, se dice solo la fecha. Una versión nueva escrita en el paso 2 usa el formulario de siempre; el borrador cuenta como cambiado recién cuando llega la relectura del objetivo (antes, un guardado saldría sin él), y «Siguiente» espera esa relectura | Esperar a que la API devuelva el número |
| EDC-13 | ED-16 | «Empezar el plan» de la ficha abre el asistente también en Nutrición (enmienda EDT-16). Fuera del asistente, el «⋯» de la versión ofrece «Seguir con el asistente · paso N de 7» | Nutrición sin entrada al asistente desde la ficha |
| EDC-14 | ED-31 | Hasta API-PLN-02/03, la tarjeta del cuadro se llama «Lo que cubren las opciones de Almuerzo»: es lo que cubren las opciones, de la menor a la mayor, y no el rango indicado por el profesional de las maquetas 06 y 08 («dentro», «por encima»), que todavía no existe. Lo que no se leyó todavía dice «leyendo», nunca «no se pudo leer» | Llamarla «Rango del almuerzo», como la maqueta, con el riesgo de que se lea como una meta |

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
- BC01 a BC08: Sofía crea el primer plan de Nutrición de Lucas, con el asistente;
- AF01 a AF05: Martín abre el Press de banca de Diego en la estación, registra una serie observada, abre «Cómo se
  calculó», calcula la carga al 75 % RM y la confirma. Se miden los clics y los campos, sin una meta previa: es una
  pantalla nueva.

**Las metas** son de diseño, no un ahorro demostrado: se dan por cumplidas solo con la corrida.

| Tramo del flujo A (Entrenamiento) | Hoy | Meta en la estación | Por qué |
|---|---|---|---|
| De la ficha al borrador (A03, A04, A07) | 3 | 1 | «Ajustar el plan» desde la tarjeta |
| Una sesión nueva (A08) | 3 | 1 | «+ Sesión», nombre y Enter |
| Los ejercicios (A11, A12, A14) | 3 | 3 | Abrir, marcar y «Agregar» |
| La prescripción (A15, A16) | 5 | 2 | Una línea y la nota |
| La agenda (A18) | 7 | 5 | Un chip por sesión, sin abrir ni cerrar un diálogo |
| Guardar y revisar (A19, A20) | 2 | 0 | Autoguardado y panel en vivo |
| Activar (A21, A22) | 3 | 3 | «Revisar y activar…», la fecha y «Activar la versión 9 de Entrenamiento» |
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

**Antes de programar:** el sí de Dirección a las partes (ED-00 a ED-76) y a las maquetas corregidas (§13.4)
(ACTA-DIR-034). **Dado el 2026-11-12**, con la página de maquetas v3 entera: las decisiones del 11/11 (§6.2) y las del
12/11 (§6.1) ya están.

| Etapa | Fechas | Partes | Se integra | Se mide |
|---|---|---|---|---|
| 0 · Aprobación | mié 11 y jue 12 | Esta actualización (V3, DJ-1 a DJ-16 y DL-171); las maquetas corregidas; ED-00 | Esta declaración, si Dirección la aprueba | La línea de base en `main` y la de accesibilidad |
| 1 · P0 y el método | jue 12 a sáb 14 | En el website: ED-01 a ED-07, ED-60 a ED-63 y ED-65. En el dominio: ED-71 (el contrato de ED-70 va en la rama de la API: etapa 2) | El website, y lo del dominio según «Los redespliegues» (abajo) | A, B y C con el script |
| 2 · Lo común, Entrenamiento y la API | dom 15 a mié 18 | ED-10 a ED-18 y ED-20 a ED-25. En la rama de la API, todo lo que va en la ventana: ED-70, ED-72, ED-74, ED-08, ED-13, ED-64 y API-PLN-01 a 03 (la ventana se adelanta al vie 20 para darle tres días a la APK). En la rama de la APK: ED-70, sobre la candidata de UF-01 (WP-USO-FINAL) y del vidrio (WP-APP-VUELTA-2) | El website, con su CI y sus capturas | A y AC |
| **Corte** | **mié 18, 20 h** | Lo que sigue depende de §8.1 | | |
| 3 · Nutrición, pedir información y la fuerza en el website | jue 19 a dom 22 | ED-30 a ED-34, ED-40 y ED-41; ED-72 (el cuadro), ED-73, ED-75, ED-76 y ED-74 (la métrica). **Lo que cambia la conducta de la API, en su ventana: el vie 20**, con todo lo de la API de este paquete y API-PLN-01 a 03, antes que la APK | La API el vie 20; después, el website | B, BC, C y AF |
| 4 · La APK, P2 y cierre | lun 23 y mar 24 | La candidata con ED-70 (y UF-01 y el vidrio de la APK), construida en Actions después de la ventana, publicada y probada en el teléfono de Dirección. P2 por hojas: ED-50, ED-51, ED-55, ED-56 y el resto. La evidencia y la galería de capturas | Lo que esté verde | Todo, con la corrida final |
| Congelamiento | mié 25 | — | Nada más | — |

**Los redespliegues** (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12; DL-167):
- `render.yaml` reconstruye la API con cualquier cambio en `packages/domain/**`, y varias partes lo tocan (los textos
  de ED-01, ED-03, ED-05, ED-06 y ED-63, y ED-71; en la etapa 2, ED-11, ED-15 y ED-22). Si el cambio no altera lo que la
  API acepta o devuelve (funciones que solo usa el website: textos, estados de guardado, cálculos de pantalla), se
  integra cuando está verde, sin ventana. Cada parte se clasifica con este criterio al integrarla.
- Lo que cambia la conducta de la API (rutas, migraciones, validaciones, el contrato de ED-70) va en la ventana del
  vie 20.
- La IP del operador (la regla de entrada que Dirección abre en la base de `test` para cargar datos directo) solo
  importa cuando hay una carga directa en la base, y se pide después del último merge del día. No hacen falta ventanas
  fijas por ella.

**El orden con los otros paquetes** (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12):
- WP-USO-FINAL (DL-169) y WP-APP-VUELTA-2 (DL-170) se integran antes que este paquete (DL-167 y DL-171), en ese orden,
  para que el índice de DEUDA_LEGAJO no choque;
- UF-06 (lo que la persona puede pedir de sus datos) y UF-11 (el segundo factor), de WP-USO-FINAL, se integran antes que
  la API de fuerza (ED-72 y ED-74), o en la misma ventana.

### 8.1 El punto de corte: el mié 18 a las 20 h

1. **ED-70 no se corta.** Es lo único que no puede esperar: la APK se congela el 25/11. Si su API o su APK no están
   verdes, toman los días de las hojas de P1 (ED-21, ED-22 y ED-24) y de la fuerza en el website.
2. **La fuerza en el website** (ED-72 a ED-76) entra en la etapa 3 solo si las bases (ED-03, ED-10, ED-14 y ED-15)
   están verdes. Si no, pasa después del congelamiento, con DL-171, la especificación y los oráculos listos, y ED-71 ya
   en el dominio.
3. **Dentro de la fuerza, el orden de caída:** primero ED-74 (la curva, que hasta que la app nueva junte series tiene
   pocos puntos), después ED-75, después ED-76 y por último ED-73. ED-70 y ED-71 quedan; ED-72 queda si su API entra en
   la ventana (punto 4). Si caen ED-72 y también ED-70, no queda ninguna fuente hasta la próxima APK.
4. **La ventana del vie 20** (la de lo que cambia la conducta de la API): lo que no esté verde en la rama de la API el
   jue 19 a las 20 h no entra. El orden de caída: API-PLN-02 y 03, ED-74, ED-13, API-PLN-01, ED-72, ED-64, ED-08 y,
   último, ED-70.
5. **La APK:** la candidata se construye solo con la API ya desplegada en `test`. Si el lun 23 la API con ED-70 no está
   en `test`, la candidata sale sin ED-70 y DL-171 deja escrita la regla conservadora: hasta la próxima APK, solo
   cuenta la fuente (a).

### 8.2 El criterio de corte de siempre

- **las bases:** ED-03, ED-10, ED-14 y ED-15. Si una falla, se arregla antes de seguir;
- **las hojas,** que salen sin frenar a las demás: ED-18, ED-41, ED-50 a ED-58, la selección por lote de ED-23 y la
  galería de ED-11 si no llegan sus modelos;
- **si lo de la API no entra en la ventana** (ED-13 y API-PLN-01 a 03):
  - la galería sale con los presets de BE y los propios que ya existen;
  - los totales se calculan solo en el website, rotulados como estimación del editor.

**Lo que no se toca en ninguna etapa:**
- `docs/legajo/**`, `docs/MANIFEST.sha256` y `render.yaml`;
- lo que lee la APK vigente, salvo la procedencia por campo (ED-70).

### 8.3 La etapa 2 en el website: lo hecho y lo que queda (2026-11-12)

Programada en la rama `wp-editores-profesional` (PR #251, en borrador), sin la API ni la APK:

| Parte | Commit | Lo que quedó |
|---|---|---|
| ED-10 | 29a83bf5 | El cuadro enfocado, con las reglas de §2.3 (TEST-EDP-011) |
| ED-22 y ED-11 (dominio) | 2e27cf69 | La prescripción en una línea y los siete presets de BE (TEST-EDP-012, 013, 023 y 056) |
| ED-15, ED-24, ED-25, ED-17, ED-11 y ED-12 | 491a773f | La estación de tres zonas, los chips de los días, el panel en vivo, la ayuda de primer uso, la galería y «Guardar como preset» (TEST-EDP-013 a 015, 018, 020, 025, 026 y 054) |
| ED-14, ED-20 y ED-16 | 400d8d32 | El asistente de siete pasos y las entradas desde la ficha (TEST-EDP-017, 019, 021 y 055) |
| ED-21 | 958a4e0b | Elegir varios ejercicios, con un solo «Agregar» (TEST-EDP-022) |
| ED-23 | c8a37280 | La planilla de series: varias a la vez, Ctrl+D y lo que se pierde dicho antes (TEST-EDP-024 y 056) |
| ED-18 | 82f0f9f6 | El vidrio, medido en su peor punto (TEST-EDP-053) |
| Revisión: ED-11 y ED-22 | 7a464289 | Un criterio % RM que pasa a RIR se nombra antes; la vista previa dice la intensidad (TEST-EDP-056) |
| Revisión: ED-14 y la estación | b7351642 | El asistente recorre todas las semanas; el paso 4 dice qué pisa; el preset de estructura no borra nada propio; la marca de la carga sigue al ejercicio; el cajón pregunta al cerrar con marcados; «Siguiente» espera al autoguardado; textos y nombres accesibles (TEST-EDP-017, 019, 021 y 055, este con datos) |
| Revisión: ED-15 | f1e52d79 | A 1440 entran las tres zonas; con la estación, la ficha llega a 1840 px |

**Lo que queda, declarado:**
- **ED-15:** el marco del área en una fila (sigue en tres renglones), y el alto de las zonas medido en un navegador.
- **ED-11:** el alcance «Este ejercicio» o «Los elegidos» desde el «⋯» de cada ejercicio: la galería se abre desde la
  sesión y se aplica a sus ejercicios.
- **ED-14, frente a las maquetas 01 y 03:** el panel «Lo que llevás armado», y en el paso 4 las pestañas por sesión y
  las tarjetas de presets en línea (hoy, cada sesión en una lista con su botón de presets).
- **ED-13** es de la API (la ventana del vie 20): hasta entonces, «Estas series, como prescripción habitual» está
  apagado con su motivo, y la galería trae los presets de BE y los propios que ya existen (§8.2).
- **ED-11:** `empezar-desde-plantilla.tsx` todavía no es una pestaña de la galería (sigue su diálogo, desde la vista
  del plan y desde el paso 1 del asistente).
- **ED-21:** los filtros por zona en chips y «Crear un ejercicio propio» con los parecidos: el catálogo busca por nombre
  al enviar, y filtrar por zona pide una lectura nueva.
- **ED-23:** la fila «General» dentro de la tabla (lo general sigue debajo), «Detalle» de la serie en un cuadro, los
  tres verbos de copia y elegir varios ejercicios (P2, lo primero que cae).
- **ED-24:** «Copiar la sesión a…» con destino y vista previa, «Copiar a otra semana» y «Duplicar el día».
- **ED-25:** la cuenta por zona de «Lo que trabaja la semana» necesita las zonas de cada ejercicio en el borrador.
- **ED-15 y ED-18:** las capturas en Claro y Azul noche a 1280, 1440 y 1920 y el zoom al 200 %, en la corrida de la
  etapa 2 con la API local; la medición de §7 (A y AC), también.
- **ED-16:** «Armar la versión del plan con este objetivo» (B04) es de Nutrición: etapa 3.

### 8.4 La etapa 3 en el website: lo hecho y lo que queda (2026-11-12)

Programada en la rama `wp-editores-profesional` (PR #251, en borrador), sin la API ni la APK. Las decisiones nuevas son
EDT-21 a EDT-34 (§6.3), a ratificar.

| Parte | Commit | Lo que quedó |
|---|---|---|
| ED-31, ED-33 y ED-34 | 4094e956 | En el editor de Nutrición: el total de cada opción al instante, el panel con «Rangos y totales» (el rango del día, DJ-4, y una fila por comida, sin «%») y «Antes de activar» en vivo; «Opción de alimentos» y «Opción de receta» por separado; «+ Comida» con su opción 1; quitar con contenido pregunta (TEST-EDP-029, 032 y 057; ED-30: ningún texto de Nutrición dice «%») |
| ED-32 | 574d381b | «Receta nueva» desde la comida, en un cuadro, con «Guardar la receta y agregarla a Merienda» y «Guardar solo en Mis recetas», y la recuperación si el agregado no se puede (TEST-EDP-030 en su parte del website) |
| ED-40 y ED-41 | 3f5b340e | Las partes plegadas con su cuenta, «Pedir todas» y «Ninguna», el resumen fijo junto al botón, lo que le llega a la persona y el aviso de un pedido pendiente; las dos entradas del vínculo con su subtítulo, los estados en palabras y el vencimiento con hora (TEST-EDP-033, 034, 035 y 058) |
| ED-23 y ED-24 | 6bbec3c1 | «Copiar la sesión a…» y «Copiar a otra semana», con destino y vista previa; «Copiar el ejercicio a…», «Copiar la prescripción a…» y «Copiar estas series a…» |
| ED-14 | f60a8520 | «Lo que llevás armado», al costado de cada paso del asistente |
| ED-21 | c53087e5 | Los chips por zona sobre lo encontrado |

**Lo que corrigió la revisión de la etapa 3 (2026-11-12):**

| Parte | Commit | Lo que se corrigió |
|---|---|---|
| ED-32 y ED-33 | af4382cc | La receta nueva llega a una comida recién creada aunque el autoguardado le haya dado identidad con el cuadro abierto; la receta (nueva o elegida) ocupa la «Opción 1» sin tocar de una comida nueva, en vez de dejar una opción vacía que impedía activar; se suma sobre la estructura de ahora, sin perder los identificadores de un guardado que llegó en el medio |
| ED-40 | d2fcac1f | La falta en las preguntas abre las partes como estado: al marcar una casilla, la tabla ya no se pliega con el foco adentro (2.4.3). Plegada, una parte deja a la vista la pregunta que no viene pedida y su aviso (maqueta 13) |
| ED-30 y ED-21 | dcee974f | AA de contraste: la nota del día tipo elegido (11,9:1 en Claro y 10,3:1 en Azul noche) y el borde del chip de zona (3,4:1 y 6,3:1) |
| ED-23 | 1c1f64f6 | La vista previa de la copia no dice «las 0 series», cuenta la base de la carga y de las repeticiones, y dice en singular una sola cosa |
| ED-31 | ac9f8075 | El total de la opción se lee con los nombres completos (maqueta 08); las iniciales quedan a la vista |

**Lo que queda, declarado:**
- **De la API (la ventana del vie 20):** ED-13 (los presets propios de prescripción), ED-64, API-PLN-01 (con ella, los
  totales dejan de ser una estimación del editor y la composición de lo ya guardado llega con el plan), API-PLN-02 y 03
  («Usar lo que cubren como rango») y la fuerza (ED-72 a ED-76).
- **ED-30:** el asistente de Nutrición (el objetivo en el paso 2 con «Objetivo general», su versión y su fecha; un
  reparto propio guardado, que es ED-13). El reparto se sigue escribiendo en gramos, como hoy, y ningún texto de
  Nutrición dice «%».
- **ED-31:** el buscador dentro del cuadro de la opción (Enter elige y sigue abierto) y el origen «dato de demostración»
  en cada fila del plan.
- **ED-32:** la foto como paso después de guardar y «Hay una versión 3 de esta receta · Usarla».
- **ED-33:** en el «⋯» de la comida, copiar una opción de otra comida o usar una comida habitual como opción.
- **ED-40:** el buscador de preguntas. **ED-41:** «Solicitudes enviadas» como sección con filtros (corte).
- **ED-11:** las plantillas como pestaña de la galería. La galería se abre desde un borrador que ya existe, y aplicar una
  plantilla ahí no deja su origen (`templateOrigin` lo pone la API solo al crear desde una plantilla). Pide una decisión:
  reemplazar el borrador (descartarlo y crear desde la plantilla) o una operación nueva de la API.
- **ED-23:** la fila «General» dentro de la tabla (lo general sigue debajo) y elegir varios ejercicios (P2). El
  «Detalle» de la serie no se suma (EDT-33).
- **ED-24:** «Duplicar el día». V3 no dice si copia las sesiones de ese día o les suma otro día en la agenda; se
  programa cuando Dirección elija.
- **ED-21:** «Crear un ejercicio propio» con los parecidos. **ED-14:** en el paso 4, las pestañas por sesión y las
  tarjetas de presets en línea.
- **Las capturas y la medición** de esta etapa (Claro y Azul noche a 1280, 1440 y 1920, y el zoom al 200 %), en la
  corrida con la API local.

### 8.5 La API y el dominio (tarea 1): lo hecho y lo que queda (2026-11-12)

Programada en la rama `wp-editores-api` (PR #258, en borrador), sobre main 23904ee. Las decisiones nuevas son EDT-35 a
EDT-45 (§6.3), a ratificar.

| Parte | Lo que quedó |
|---|---|
| ED-64 | API-HAB-04 y 05 y API-HAN-04 y 05 a 700 KB (TEST-EDP-051) |
| ED-70 | `fieldOrigins` en la serie ejecutada de API-TRN-15 a 20, sin migración ni capacidad nueva; la corrección del profesional no le atribuye a la persona lo que cambió (TEST-EDP-059 y 060) |
| ED-72 | API-FZA-01 a 03 y la tabla `serie_observada`, de solo agregar (TEST-EDP-061 y 062; RM-36, RM-37, RM-41 y RM-42) |
| ED-74 | La clave `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE` de API-PRJ-01, calculada al leer (TEST-EDP-064; RM-01, RM-11, RM-16, RM-23 a 25, RM-29, RM-33 y RM-43) |
| ED-13 | API-HAB-06 a 08 y API-HAN-06 a 08, con sus dos tablas |
| API-PLN-01 | Los totales de cada opción, calculados por el servidor (TEST-EDP-028 del lado de la API) |

**Lo que queda, declarado:**
- **API-PLN-02 y 03** (los rangos por día tipo y por comida): son lo primero que cae (§8.1). En g por kg piden
  el peso de la última toma, que es de Antropometría, y guardarlos en la versión y en su instantánea toca la
  activación: van en la próxima tanda, con su decisión. El editor sigue armando el rango del día con los totales
  (EDT-21 y EDT-22), que ahora puede confirmar con API-PLN-01.
- **El website** de ED-72 a ED-76, ED-13 y API-PLN-01 es la tarea 2; **la APK** de ED-70, su rama.

### 8.6 El website de la API (tarea 2): lo hecho y lo que queda (2026-11-12)

Programado en la rama `wp-editores-api` (PR #258, en borrador). Las decisiones nuevas son EDT-47 a EDT-54 (§6.3), a
ratificar.

| Parte | Commit | Lo que quedó |
|---|---|---|
| ED-72 a ED-76 | 43b6e77f | El detalle del ejercicio con la tarjeta de fuerza, «Cómo se calculó», «Registrar una serie observada» y «Calcular la carga desde la estimación…» en el mismo cuadro, con «Atrás»; la evolución en «Analizar» (TEST-EDP-063, 065 y 066 en su parte del website; RM-36, RM-37, RM-40 y RM-43) |
| ED-13 | 0b3a1e8d | Guardar y usar las prescripciones habituales (la galería, «Tuyos») y los repartos habituales en el objetivo de Nutrición, en gramos |
| ED-24 y ED-11 | 620a6557 | «Duplicar el día» en la tira de la semana; las plantillas como pestaña de la galería de estructura, que reemplazan el borrador |

**Lo que queda, declarado:**
- **ED-74:** las capturas de las maquetas 14 a 18 en Claro y Azul noche, con la API local y una persona con series de
  la app nueva; hasta entonces, lo verifican las pruebas y la CI.
- **ED-75:** «Las últimas sesiones» del detalle (EDT-47). **ED-76:** escribir en las series elegidas (EDT-51).
- **ED-72:** corregir o anular una observación (API-FZA-03) desde el website.
- **ED-30:** el asistente de Nutrición con el reparto propio en su paso 2. Quedó al integrar el cierre del website
  (§8.7): el paso 2 escribe la versión nueva con el mismo formulario del objetivo, que trae los repartos habituales.

### 8.7 El cierre del website: lo pendiente de V3 que no choca con la API (2026-11-12)

Programado en la rama `wp-editores-cierre` (PR #259, en borrador), en paralelo con `wp-editores-api` (la fuerza, ED-11,
ED-13, ED-24 y la API): no toca ED-11, ED-13, ED-14, ED-23 ni ED-24, ni `training/editor.tsx`. Las decisiones nuevas
son EDC-01 a EDC-14 (§6.4), a ratificar. Las pruebas, en `apps/web/test/editores-cierre.test.mjs`.

| Parte | Commit | Lo que quedó |
|---|---|---|
| ED-41 | 5f37aba5 | «Solicitudes enviadas» como sección, con filtros por estado y por persona, y el vencimiento de las pendientes |
| ED-40 | 77314500 | El buscador de preguntas: «Pedir las n» y «Ninguna de las n» sobre lo que coincide (TEST-EDP-033 y 034) |
| ED-33 | ab14910a | En el «⋯» de la comida, «Copiar desde otra comida» y «Usar una comida habitual» (TEST-EDP-031) |
| ED-31 | e4c2d10c | La opción en un cuadro (maqueta 06): el buscador adentro, Enter suma y sigue abierto, el total al instante, el rango de su comida y el objetivo general |
| ED-32 | 978ab8bc | La foto como paso después de guardar y «Hay una versión 3 de esta receta · Usar la versión 3», con lo que cambia en una porción (TEST-EDP-030) |
| ED-21 | 87bd51d2 | «Crear un ejercicio propio», con los parecidos del catálogo antes de crear |
| ED-30 | 5f6598fd | El asistente de Nutrición: siete pasos, el objetivo general con su versión y el reparto en gramos (TEST-EDP-027 y 017) |
| Revisión | (esta tanda) | Lo que encontró la revisión del cierre: la estrella de habitual vuelve al cuadro, activar desde el paso 7 lleva al plan activo, el objetivo nuevo del paso 2 sin carrera, las composiciones de todos los días tipo, «Guardar la opción» con la regla del plan, «Agregar una opción» sin opciones vacías y la accesibilidad de ED-21 y ED-40. El recorrido de navegador «asistenteDeNutricion» recorre del paso 1 al 7, activa y ve el plan activo |
| Integración con #258 | (el merge de main) | El paso 2 del asistente ofrece los repartos habituales (API-HAN-06 a 08): la versión nueva del objetivo se escribe con el formulario de siempre, que ahora trae «Usar un reparto habitual» y «Guardar este reparto como habitual», en gramos |

**Lo que queda, declarado:**
- **API-PLN-01 en la vista previa de la receta:** la operación ya está en main (#258); conectarla hace que la vista
  previa de una versión nueva de la receta deje de ser una estimación por porción. El reparto propio del paso 2 (ED-13,
  el «Dado» de «Mi base · 300 / 120 / 80 g») ya no queda: llegó con la integración.
- **ED-31:** el origen «dato de demostración» en cada fila del plan y su aviso en «Antes de activar»: lo ya guardado no
  trae su procedencia, y leerla ítem por ítem es una lectura más por alimento (llega con API-PLN-01).
- **ED-41:** los filtros y sus cuentas son de las solicitudes ya leídas (hasta 200), y lo dicen.
- **Las capturas y la medición** de esta tanda (Claro y Azul noche a 1280, 1440 y 1920, y el zoom al 200 %), en la
  corrida con la API local.
- **ED-30, los presets de BE de los pasos 3 y 4** (§2.1 y §2.4): «Un solo día tipo» y «Entrenamiento y descanso»; «4
  comidas», «5 comidas con colación» y «6 comidas». Esperan `presets-de-be` y ED-11, de la otra rama; EDC-11 solo
  retira «Desde un preset» del paso 1.
- **ED-30, las pruebas de §5.5:** TEST-EDP-021 para Nutrición (el borrador que deja el asistente es el mismo que deja la
  estación con los mismos datos) y el recorrido desde un preset, que espera a los presets.
- **La herramienta de capturas** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/recorrido.mjs`): su tramo «Agregar ítem»
  todavía comprueba el cajón que se retiró (`.agregar-item__buscador`, buscar al enviar, «Limpiar búsqueda»). Se
  reescribe para el cuadro de ED-31 antes de la corrida con la API local, que es donde se puede comprobar.

## 9. Riesgos

| Riesgo | Efecto | Qué se hace |
|---|---|---|
| **El plazo:** 53 partes en 14 días, con WP-USO-FINAL, WP-APP-VUELTA-2 y la tesis compitiendo por los mismos días | Llegar al 25/11 con todo a medias | Lo de V3 entra como criterios de partes que ya existían; P0 se integra solo; las etapas tienen un punto de corte con el orden de caída escrito (§8.1); P2 va por hojas; cada etapa deja algo usable |
| **La APK que se congela el 25/11 tiene que traer la procedencia** (ED-70) | Si no la trae, todo lo que la persona registre hasta después de la tesis queda fuera de la fuente (b), y el RIR sigue ambiguo | ED-70 no se corta (§8.1); su API va en la ventana del vie 20 y la candidata se construye después; si igual no llega, DL-171 deja la regla conservadora: solo cuenta la fuente (a) |
| **Tres ramas tocan la misma APK:** ED-70, UF-01 (WP-USO-FINAL) y el vidrio (WP-APP-VUELTA-2) | Una candidata con conflictos, o sin una de las tres | Una sola candidata, armada en un orden acordado: primero lo que cambia el contrato (UF-01 y ED-70), después el vidrio, y al final las lecturas congeladas |
| **El orden API → APK** | Una APK que manda `fieldOrigins` a una API que no lo conoce recibe 400 en cada registro: los esquemas son estrictos | La API primero (vie 20) y la candidata después; una prueba compara lo que manda la APK con el contrato desplegado en `test` |
| **La 0.23.0-candidata.2 no lee una ejecución con procedencia** | Si la misma persona vuelve a esa versión, ve «respuesta no reconocida» en esa sesión y en su historial | Es el caso que ya declaró DL-161; con UF-00, la candidata nueva pasa a ser la única vigente y la descarga sirve siempre la última |
| **La fuerza desplaza lo que Dirección pidió primero** | P1 de los editores, a medias | El orden de caída de §8.1: la fuerza en el website cae antes que las bases |
| **Compite con la documentación de la tesis** | Dirección no llega a aprobar o probar, y la tesis se atrasa | Una aprobación por etapa, con la página de maquetas; las pruebas de Dirección, en 20 minutos por etapa y con guion; la tesis cita este paquete en lugar de describirlo de nuevo |
| **Dos caminos (asistente y estación)** | Doble superficie, comportamientos distintos | Comparten piezas; TEST-EDP-021 compara el borrador que deja cada uno |
| **Los presets de BE se leen como recomendación** | Pregunta del tribunal; choca con INV-06-143 | Sin ejercicios, alimentos ni cargas; rótulo; validación de Dirección (ED-D2) |
| **El bucle del autoguardado y el conflicto falso** | Subidas repetidas de hasta 700 KB y rechazos auditados; un profesional que toca «Cargar la versión guardada» y pierde lo escrito | ED-60 y ED-61, en la etapa 1, con el recorrido de la respuesta perdida. El límite de 16 KB ya no es un riesgo (DL-168) |
| **El redespliegue de la API** | Cada cambio en `packages/domain/**` la reconstruye | Lo que cambia su conducta, en la ventana del vie 20, y la APK después; lo demás, sin ventana; la IP del operador, después del último merge del día (§8) |
| **La memoria de la máquina (5,9 GB)** | No se puede levantar el website ni la API locales | La CI hace las capturas y los recorridos; acá, renders de a uno |
| **La APK congelada el 25/11** | Las semanas se ven todas juntas hasta TB-44 | ED-D11 lo dice en pantalla; la app de la persona ya no bloquea la activación (DJ-5) |
| **La densidad de la estación** | Contraste, foco y zoom al 200 % se rompen | Contraste, T13 y recorridos por teclado en cada parte; capturas a 1280, 1440 y 1920 |
| **Medir con selectores nuevos** | Comparar tareas distintas | Las 73 tareas, congeladas con un hash; las nuevas, aparte |
| **Las partes de WP-TABLERO-ALTA-GAMA** | Declarar dos veces lo mismo | §11: este paquete programa TB-38, TB-39 y TB-46 dentro de la estación, y sus IDs se conservan como referencia |
| **«Persona» en textos que comparte la APK** | La próxima candidata cambia textos | Se listan antes; T13 en las dos superficies; los textos legales con versión, aparte |
| **Una pregunta del tribunal: «¿BE no prohibía estimar el 1RM?»** | Una contradicción aparente con el legajo | DL-171 registra la decisión de Dirección, qué enmienda y por qué; el legajo no se edita |
| **Citar una fuente retractada o los números de V3** | Un error en la tesis | Hughes y colaboradores (2020) no se cita: está retractada. La cita de los 330 kg de V3 se corrige antes de usarla (§13.2) |
| **Una estimación que viaja** | La estimación sale del área por la referencia del % RM del plan (RES-06) | ED-76 escribe el método y la fecha, nunca el valor (TEST-EDP-066); sin fila en la matriz §3.1, no viaja. Con el % y la carga del plan se deduce la estimación (72,5 ÷ 0,75 ≈ 96,7): se acepta, porque es un dato de la propia persona y no expone nada a terceros (recomendación de Claude del 2026-11-11, ratificada por Dirección el 2026-11-12; DL-171) |
| **Pocos datos para la curva** | Con «Hipertrofia 8-12 · RIR 2», casi todo queda orientativo o fuera, y las series de antes no cuentan | La serie observada (a) cubre el arranque; la tarjeta dice qué hace falta; la curva es lo primero que cae |
| **El profesional entra sin segundo factor (UF-11) y la persona no puede pedir sus datos (UF-06)** | Pantallas nuevas con datos de salud | Las pruebas y la evidencia de este paquete, solo en `test`, con la cohorte sintética y «Ocultar nombres»; UF-06 y UF-11 (WP-USO-FINAL) se integran antes que la API de fuerza (ED-72 y ED-74), o en la misma ventana (§8); la observación entra en lo que la persona puede pedir (ED-D21) |
| **El asistente borra lo que no muestra** | Se pierden valores por serie al pasar por él | El oráculo de ida y vuelta (TEST-EDP-055) |
| **Presets que pisan datos** | Se pierden cargas propias | DJ-8: se conservan, con vista previa (TEST-EDP-013) |
| **El vidrio del website** | Contraste, foco o rendimiento que se rompen con la transparencia | ED-18 es una hoja: mide en el peor punto, vuelve a opaco con `forced-colors` y con la transparencia reducida y, si no da, el website queda mate |
| **Textos prohibidos** («%» en Nutrición, «volumen», «marca personal», «1RM real», inglés) | Rompen T13 o el tono de BE | Todo texto nuevo pasa por las guardias de las dos áreas y por la de fuerza |
| **Maquetas con errores frente a Dirección o la mesa** | Se pierde credibilidad | Las correcciones de §13.4, antes de mostrarlas |

## 10. Fuera de alcance

- Cambiar «¿Cuándo la revisás?» o «Sin fecha por ahora» (REG-06-145, TB-15).
- Mostrarle a la persona los rangos, el rango del día, los presets, las estimaciones de una opción o cualquier
  estimación de fuerza, salvo lo que ya ve.
- Una regla de progresión guardada que BE aplique sola, una carga escrita sin el clic del profesional, y cambiar una
  carga por lo que registró la persona.
- La modalidad B de intercambios (ED-53, solo declarada) y la bandeja de solicitudes recibidas (ED-D15).
- La APK, salvo la procedencia por campo (ED-70) y los textos de «persona» en su próxima candidata.
- De la fuerza: el 1RM medido con protocolo (D-V3-03); el tipo de serie (DJ-13); el peso corporal y la asistencia; la
  variante y el equipamiento como campos; comparar fórmulas; celebrar (DJ-3); la estimación en la APK (D-V3-02);
  «Exportar informe»; y heredar la historia de otro profesional (DJ-14).
- Registrar fuera del plan u otro deporte (DJ-15), y cancelar o hacer vencer un pedido (DJ-16).
- Mezclar receta y alimentos en una opción; la franja horaria, la masa final de una receta y el peso por unidad.
- La barra lateral y las pestañas de la ficha que dibuja V3.
- La cartera, «Te toca a vos», «Tu semana» y el Resumen de la ficha (WP-TABLERO-ALTA-GAMA).
- Las lecturas de registros (B24 y B25), que no son editores.

## 11. Relación con WP-TABLERO-ALTA-GAMA

| Parte del tablero | Estado en `main` | En este paquete |
|---|---|---|
| TB-38, lo que el profesional no ve al planificar | Declarada, sin programar | Se programa en ED-25 (Entrenamiento) y en ED-31 (Nutrición, API-PLN-01). DJ-4 enmienda su «sin total del día» con el rango del día (ED-34) |
| TB-39, los rangos de Nutrición | Declarada, sin programar | Se programa en ED-34, con la prueba modificada por DJ-4; TEST-TAG-025, reemplazada |
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
| A17 la app de la persona | ED-08 (DJ-5: un aviso) | B17 receta como opción | ED-32 | | |
| A18 agenda | ED-24, ED-20 | B18 opción de receta | ED-31 | | |
| A19 plantilla del borrador | ED-12 | B19 totales | ED-31, ED-34 (DJ-4), ED-D6 | | |
| A20 revisar antes de activar | ED-25, ED-07 | B20 revisar con error | ED-34 | | |
| A21 activar | ED-07; la fecha no cambia (regla vigente) | B21 corregido | ED-31, ED-34 | | |
| A22 activado | ED-07 | B22 activar | ED-07 | | |
| A23 cola | Fuera (TB-11 a TB-14) | B23 activado | ED-07, ED-D4 | | |
| A24 revisiones | ED-58 | B24 registros | Fuera (lectura) | | |
| A25 revisión vacía | ED-04, ED-58 | B25 registro y plan | Fuera (lectura) | | |
| A26 revisión llena | ED-04 (confirmado en código) | B26 descartar | ED-01 | | |
| A27 registrada | ED-58 | B27 duplicar día | ED-33 | | |
| A28 ajuste aplicado | ED-56 | B28 error de guardado | Resuelto por DL-168 (#252 y #254); cómo se ve, ED-03 | | |
| A29 borrador del ajuste | ED-56 | | | | |
| A30 descartar | ED-01 | | | | |
| A31 mis ejercicios | ED-57 | | | | |
| A32 plantillas y habituales | ED-11, ED-57 | | | | |

## 13. Lo que suma V3

El paquete V3 de ChatGPT (2026-11-11) entra como insumo, no como plan, como recomendó el juicio de Claude del mismo día.
Entiende bien las reglas de BE —lo indicado no es lo hecho, nada se da por guardado sin el servidor, las versiones van
por área, «Sin fecha por ahora» vale y lo ausente no es cero—, pero no vio el código ni este paquete: pide como nuevo lo
que ya existe y da por existentes campos que BE no tiene. Sus quince ítems de editores caen en partes que ya estaban;
lo realmente nuevo es la fuerza. No hacen falta sus seis documentos ni un backlog paralelo: esta sección y DL-167 los
reemplazan.

### 13.1 Lo que suma, y dónde entra

| # | Lo que trae V3 | Por qué mejora el paquete | Dónde entra |
|---|---|---|---|
| 1 | Guardar y Activar en lugares fijos (01 §0) | La versión anterior de ED-15 los juntaba en un botón que cambiaba con el autoguardado; el código de hoy ya los tiene fijos | §2.2 y ED-15 (DJ-6) |
| 2 | El preset con alcance y «antes → después» (E-04) | ED-11 vaciaba las cargas y prometía un deshacer que el autoguardado reduce a 4 s | ED-11 (DJ-8) |
| 3 | Un verbo para cada copia (E-02; 02 §G) | Hoy el menú del ejercicio solo tiene «Duplicar» y «Quitar» | ED-23, ED-24 y ED-33 |
| 4 | Mostrar lo que se pierde al quitar series o al volver a carga uniforme | ED-23 no lo decía | ED-23 |
| 5 | El asistente con salida a la estación, retomar con borradores mezclados y paridad (00 §4) | Faltaban la salida y la prueba de ida y vuelta | ED-14 |
| 6 | Confirmar con alcance al quitar un día tipo o una comida (N-01) | Hoy se borran en el acto | ED-33 |
| 7 | La receta con dos salidas, y la recuperación si el agregado falla (N-03) | Son dos escrituras sin transacción conjunta | ED-32 |
| 8 | Una tabla de estados (02 §F) | Faltaba la vista del ciclo; se redibujó en dos ejes | §2.6 |
| 9 | Los casos borde, la definición de terminado y las pruebas con perfiles (02 §I y §J; 05 §D) | Había oráculos por parte, no por pantalla, ni pruebas de uso | ED-00 y §5.9 |
| 10 | Los contadores de la revisión y «la versión N queda en el historial» (V-02) | Dice cuánto cambia sin leer la lista | ED-07 |
| 11 | La tabla compacta del día en Nutrición (N-01) | La maqueta 07 no la tenía | ED-34 (DJ-4) |
| 12 | Elegir varios ejercicios, con una barra contextual (E-02) | Habilita aplicar lo mismo a los elegidos | ED-23 (P2) |
| 13 | Las preguntas de robustez (X-02, V-02 y PR-B) | Al seguirlas aparecieron seis fallas reales del código | ED-60 a ED-65 |
| 14 | El rigor de la fuerza (03): lo indicado no es lo hecho, nunca desde la prescripción, estimado no es medido, nunca inducir un máximo, y 22 oráculos con la aritmética correcta | Es la base de DL-171 | ED-70 a ED-76 |

### 13.2 Lo que no se toma

| Qué dice V3 | Por qué no |
|---|---|
| Guardar el borrador en el dispositivo y «Copiar cambios pendientes» (X-02) | Un borrador es información de salud: nada se guarda en el navegador (DL-148 D-5). El texto es «siguen en esta pantalla; si la cerrás, se pierden» |
| Una máquina de nueve estados, con «revisado sin bloqueos» (02 §F) | Validar es la condición de activar, no un estado; son dos ejes (§2.6) |
| Revisar y activar en dos pantallas (V-01 → V-02) | Activar ya lleva clave de idempotencia, versión esperada y un candado por persona y área: el paso extra suma clics, no seguridad. Va un solo cuadro (DJ-6) |
| Explicar por qué algo está restringido (P-01) | UC-I02 E05 prohíbe decir qué dimensión se denegó: la ficha dice «Vista parcial» |
| Eliminar o invalidar ejecuciones (02 §D.7; F-01) | Solo se agregan correcciones, y la base lo impide |
| La procedencia «Importado» (03 §11) | No existe: el registro original es siempre de la persona, y cada corrección guarda autor y rol |
| «Otros profesionales no ven fuerza salvo alcance explícito» | En BE, sin fila en la matriz §3.1, no viaja. La referencia del % RM sí viaja con el plan: por eso nunca lleva el valor |
| «Exportar informe» de fuerza | Hoy nadie exporta, y la persona no puede descargar sus datos (UF-06) |
| La zona horaria fija de Buenos Aires (00 §3; RM-15) | Cada ejecución guarda su fecha civil y su zona: «la zona civil de la persona» |
| «reps + RIR» como un método aparte, Brzycki a la vista y «la mayor e1RM de la sesión» | Epley v1 usa siempre n_eq; hay un solo método en la v1; por sesión, la serie de mayor carga (DL-171) |
| El tipo de serie, la variante y el equipamiento, el peso corporal y la asistencia, el RPE en la prescripción (E-02, E-03 y H2) | No existen; el RPE como criterio da 422 (REG-06-129); sumarlos cambia lo que lee la APK |
| Registrar un ejercicio fuera del plan (02 §I.20) | Cada ejercicio registrado es una prescripción de la sesión (`PRESCRIPTION_NOT_IN_SESSION`) |
| La barra lateral con «Biblioteca» y «Reportes», y la ficha con pestañas | La navegación es una barra superior, y «Reportes» no existe |
| El «número de revisión del servidor» (H1) | El `version` es el token de concurrencia; el número es el orden de activación (con DJ-6, el borrador es el de las activadas más uno) |
| Una opción con alimentos y receta, y la receta con una cantidad libre (N-02 y N-03) | Las opciones son de una clase o de la otra, y la receta entra como una porción que arma el servidor |
| El total «parcial», el respaldo 4/4/9 y la cuenta «según el estado» | `SUM_SOURCE_PER_100G_V1` usa la energía de la fuente y no lee el estado; lo que falta queda vacío y se nombra |
| La masa final de la receta, la franja horaria, la opción «principal», la dificultad y el tiempo | No existen |
| «Fuente verificada» | RF-060: lo importado no es un dato verificado por BE; se dice «fuente identificada» |
| «Diferencia respecto al objetivo: +10 kcal» | D-17: se ubica frente al rango, sin color, y se llama «Objetivo general» |
| El límite de 16 KB como arreglo pendiente, y la «app antigua» | Ya resueltos: DL-168 y UF-00 |
| Las imágenes como diseño | El foco de BE es ámbar y el cian solo marca lo que se toca; las láminas usan términos prohibidos («adherencia», «volumen», «%» en Nutrición, «podés considerar +2,5 kg»), colores que juzgan, inglés («Deload», «Full body», «Smoothie»), «Clientes», una foto en lugar del monograma y un iPhone; tienen números que no cierran y objetos táctiles de la mitad del mínimo de la guía. Sirven como repertorio de patrones |
| La tarjeta de los 330 kg y 32 repeticiones | V3 la ubica en el panel 03, pero está en la lámina 00b, panel 4, con 80 + 82,5 + 82,5 + 85 = 330 kg y 8 + 8 + 7 + 6 = 29 repeticiones. Llegó a la conclusión correcta (sacarla) con la evidencia equivocada: hay que corregirlo antes de citar V3 en la tesis |
| La fuente de Hughes y colaboradores (2020) | Está retractada (PMID 33337690; la retractación, PMID 33470601). Tampoco se usa Macarilla (2022), que trata la predicción por velocidad y no Epley |

### 13.3 Las piezas de V3 y las partes

| V3 | Partes | | V3 | Partes |
|---|---|---|---|---|
| P-01 Ficha | ED-16 | | V-01 y V-02 Revisar y activar | ED-07 y ED-62 |
| E-01 Estructura | ED-24 | | X-01 Asistente | ED-14, ED-20 y ED-30 |
| E-02 Planilla | ED-23 | | X-02 Guardado y salida | ED-02, ED-03, ED-60, ED-61 y ED-65 |
| E-03 Detalle por serie | ED-23 y ED-75 | | C-01 Vincular y pedir | ED-40 y ED-41 |
| E-04 Preset con alcance | ED-11 | | F-01 Evolución de fuerza | ED-74 |
| E-05 Biblioteca | ED-11 y ED-57 | | F-02 Cómo se calculó | ED-73 |
| N-01 Días tipo | ED-33 y ED-34 | | F-03 Registro | ED-70 y ED-72 |
| N-02 Opción | ED-31 | | N-03 Receta | ED-32 |

**El backlog de V3 (BEV3-001 a 020):**

| BEV3 | Partes | | BEV3 | Partes |
|---|---|---|---|---|
| 001 Lenguaje | ED-05, ED-06 y TEST-EDP-044 | | 011 Crear asistido | ED-14, ED-20 y ED-30 |
| 002 Versión y borrador por área | ED-15 (DJ-6) y §2.6 | | 012 Días tipo y comidas | ED-33 |
| 003 Guardado, errores y conflicto | ED-03, ED-60 y ED-61 | | 013 Opción y cálculos | ED-31 |
| 004 Descartar el borrador | ED-01 | | 014 Receta en contexto | ED-32 |
| 005 Activar con la fecha | ED-07 y ED-62 | | 015 Vincular y pedir | ED-40 y ED-41 |
| 006 Estructura de sesiones | ED-24 | | 016 Registros reales | ED-70 y ED-72 |
| 007 Planilla | ED-23 y ED-25 | | 017 Estimación versionada | ED-71 y ED-73 |
| 008 Detalle por serie | ED-23 | | 018 Gráfico de fuerza | ED-74 |
| 009 Presets con alcance | ED-11 (DJ-8) | | 019 Estimación en el ejercicio | ED-75 |
| 010 Biblioteca por tareas | ED-11 y ED-57 | | 020 La estimación en la app | Fuera (D-V3-02, por DJ-1) |

### 13.4 Las maquetas, antes de mostrarlas

Los números de pantalla de esta lista son los de la versión 1 de la página de maquetas; la versión 2 (2026-11-11, en
vidrio y con la fuerza) aplica todos los puntos.

- «Activar · 1 cosa por corregir» pasa a «Revisar y activar…», fijo, y el cuadro abre con lo que impide activar.
- «Guardar ahora», fijo y secundario junto al estado; «Versión 9 · en preparación» queda (DJ-6).
- Sacar el chip «a decidir».
- Los rangos, como dato y no como deslizadores; el rango del día y la tabla compacta (DJ-4).
- Nada de cian en bordes de tarjetas, y un solo botón lleno por vista.
- Los chips, con el nombre completo y sin abreviaturas; «Hip thrust» y «Bowl», en castellano, con el nombre del
  catálogo.
- Tres números que no cierran: la «Merienda · opción 1» que en la 08 es la opción 2; el «3 × 12» con la serie 3 sin
  repeticiones y el separador doble; y «· 3 días» en la 04.
- El bloque «La app de Diego: BE 0.23…» se achica a la línea de ED-08.
- El vidrio de ED-18, con la línea de la APK.
- La tarjeta de fuerza (ED-75) y el cuadro de ED-76, con números que cierran (los de RM-02 y RM-38).
