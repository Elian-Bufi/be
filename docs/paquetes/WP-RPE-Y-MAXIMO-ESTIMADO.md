# WP-RPE-Y-MAXIMO-ESTIMADO · El RPE como otra forma de escribir el RIR, y el máximo estimado en esa notación

> **La decisión de Dirección (22/11):** Elián, licenciado, preguntó si BE estaba haciendo el RPE (la escala de esfuerzo
> percibido) dentro de cada serie y si se podía relacionar con el RIR. Aprobó la propuesta: **una sola medida, dos
> notaciones** (RPE = 10 − RIR, la escala basada en RIR), el profesional elige la notación y la persona responde y ve todo
> en ella; y **el máximo estimado** de cada serie, dicho en esa notación y separado del máximo probado. El RPE de la sesión
> queda afuera.
>
> Rama `wp-rpe-y-maximo-estimado`, desde `main` (32142486). Registro: **DL-192** en `docs/DEUDA_LEGAJO.md`. Las decisiones
> de continuador (**RPE-D01 a RPE-D11**) están **a ratificar**. La APK va en la 0.32 (DL-194). No se integra sola.

## 0. En criollo

En el editor del plan de Entrenamiento, al pie de las sesiones, el profesional elige cómo se escribe el esfuerzo: **RIR**
(las repeticiones en reserva) o **RPE** (de 6 a 10). Es la misma medida escrita de dos formas: RPE 10 es el fallo, RPE 9
deja una repetición, RPE 8 deja dos, de a medio punto. BE guarda siempre el RIR: con RPE elegido, «RPE 8» se guarda como RIR
2, y el historial, los gráficos y lo que ven otros profesionales no cambian. Por debajo de RPE 6 (cuatro o más en reserva)
la gente estima mal cuánto le queda: BE lo agrupa en «6 o menos».

Con RPE elegido, todo se lee así: el objetivo de cada ejercicio y de cada serie, el plan, lo registrado y la fuerza
estimada. El plan nuevo de cualquier persona nace con la notación que el profesional usó la última vez.

El máximo estimado ya existía (Epley v1, DL-171) y no cambia de método: ahora cada valor dice con qué serie salió, en la
notación del plan («estimado con 5 reps a RPE 8 · 100 kg»), para que nunca se lea como una repetición máxima probada.

La APK de hoy no se toca: sigue preguntando el RIR, y lo que manda se guarda igual. La API ya expone la notación para que
la APK 0.32 pregunte en RPE.

## 1. Alcance

| ID | Qué | Dónde |
|---|---|---|
| RPE-01 | La notación del esfuerzo vive en la versión del plan: `effortNotation` (`RIR` o `RPE`) en API-TRN-07 y 10 (entrada, opcional), en las lecturas del profesional (API-TRN-07 a 10 y API-SER-01) y en el contenido de la versión (se guarda solo `RPE`; ausente es RIR). Se congela con la instantánea al activar y la sucesora la hereda | `contratos-entrenamiento.ts`, `contratos-entrenamiento-por-serie.ts`, `plan-de-entrenamiento.ts` (`conLaNotacion`), `planes.service.ts`, `series.service.ts`, `lectura-entrenamiento.ts`, `openapi.ts`, `docs/api/openapi.json` |
| RPE-02 | La conversión RIR ↔ RPE con la escala de Zourdos (2016): RPE = 10 − RIR, de 6 a 10 con medios puntos; «6 o menos» se guarda como RIR 4; lo escrito («8», «8,5», «6 o menos», «≤ 6») se lee como el RIR que se guarda | `notacion-del-esfuerzo.ts` |
| RPE-03 | Prescribir en RPE: el selector «Cómo se escribe el esfuerzo» al pie de las sesiones del editor; el criterio RIR se elige y se escribe como RPE; el objetivo general, las celdas de cada serie, la escritura en varias series a la vez y el renglón del ejercicio plegado, en la notación | `notacion-del-plan.tsx`, `editor.tsx`, `ejercicio-del-editor.tsx`, `editor-del-plan-de-entrenamiento.ts`, `globals.css` |
| RPE-04 | Ver en la notación lo indicado, lo registrado y el historial: «Plan» (renglón, encabezado, series, lo general), «Registros» (lo indicado, lo registrado y cómo quedó frente a lo indicado, con el sentido al revés en RPE: menos RIR es más RPE) y la fuerza estimada (la tarjeta, «Cómo se calculó», la serie observada y la evolución en «Analizar») | `notacion-del-esfuerzo.tsx` (el contexto), `entrenamiento.tsx`, `estructura-del-plan.tsx`, `plan.tsx`, `ejecuciones.tsx`, `registros-de-entrenamiento.ts`, `lectura-del-plan-de-entrenamiento.ts`, `presentacion-de-prescripcion.ts`, `copy-entrenamiento-por-serie.ts`, `fuerza/*` |
| RPE-05 | El máximo estimado en la notación: «estimado con 5 reps a RPE 8» o «a RIR 2» al lado de cada valor; la regla y los motivos de lo que no entra, en la notación («RPE 8 a 10 (RIR 0 a 2)», «el RPE es menor que 8»). El método (Epley v1) y sus límites no cambian | `notacion-del-esfuerzo.ts` (`conQueSeEstimo`, `copyDeLaEstimacion`, `motivoEnLaNotacion`), `fuerza.ts`, `tarjeta.tsx`, `como-se-calculo.tsx`, `serie-observada.tsx`, `fuerza-en-analizar.tsx` |
| RPE-06 | Para la app: la capacidad `training-effort-notation-1`; con ella el titular recibe `effortNotation` en API-TRN-09 y en la sesión para registrar (API-SER-02). Sin ella, la forma de siempre. La API sigue aceptando el RIR de la APK actual tal cual | `compatibilidad-de-clientes.ts` (dominio y API), `planes.service.ts`, `series.service.ts` |
| RPE-07 | El valor inicial: un borrador nace con la notación pedida; si no, la de la versión de la que parte; si no, la de la versión más nueva que escribió el profesional, con cualquier persona; si nunca eligió, RIR | `notacionInicial`, `planes.service.ts` (`ultimaNotacionDelProfesional`) |

## 2. La escala, verificada en la fuente

La escala de RPE basada en las repeticiones en reserva es la de **Zourdos y colaboradores (2016)**, *Novel resistance
training-specific rating of perceived exertion scale measuring repetitions in reserve*, Journal of Strength and
Conditioning Research 30(1): 267-275. Su uso para indicar la intensidad lo describen **Helms, Cronin, Storey y Zourdos
(2016)**, *Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training*,
Strength and Conditioning Journal 38(4): 42-49. La precisión de la estimación de las repeticiones que quedan, según qué tan
lejos se está del fallo, la revisan **Halperin y colaboradores (2022)**, Sports Medicine 52: 377-390.

| RPE | Lo que dice la escala | RIR que guarda BE |
|---|---|---|
| 10 | Esfuerzo máximo | 0 |
| 9,5 | No quedaba otra repetición, pero se podía subir un poco la carga | 0,5 |
| 9 | Quedaba 1 | 1 |
| 8,5 | Quedaban 1 o 2 | 1,5 |
| 8 | Quedaban 2 | 2 |
| 7,5 | Quedaban 2 o 3 | 2,5 |
| 7 | Quedaban 3 | 3 |
| 6,5 | (medio punto entre 7 y 6) | 3,5 |
| 6 o menos | La escala agrupa 5 y 6 como «4 a 6 en reserva», y lo de abajo como esfuerzo liviano | 4 |

**RPE = 10 − RIR** es la lectura que usan Helms y el powerlifting para los medios puntos (RPE 8,5 = RIR 1,5). BE la aplica
igual en los dos sentidos, y por eso el valor de las dos notaciones es el mismo número guardado.

## 3. El máximo estimado (criterio)

- **El método es el de DL-171, sin cambios:** Epley v1 (`BE-E1RM`, versión 1, `EPLEY_V1`), carga × (1 + (reps + RIR) / 30),
  con las repeticiones hasta el fallo (repeticiones equivalentes, n_eq = reps + RIR).
- **Dónde es confiable (DL-171, ratificado el 12/11):** RIR de 0 a 2 (**RPE 8 a 10**) y hasta 12 repeticiones equivalentes;
  hasta 10 es el núcleo y de más de 10 a 12, «estimación orientativa»; un ejercicio de la lista cerrada de la v1, la carga
  externa total, sin carga rápida ni valores del plan. «6 o menos» (RIR 4) nunca estima.
- **Por qué no RIR ≤ 4 (RPE 6):** ampliar la ventana es una versión nueva del método (`BE-E1RM` v2) y una decisión de
  Dirección; la v1 dejó el RIR en 0 a 2 porque lejos del fallo el RIR que se escribe es menos confiable (R3, aprobada el
  12/11; Zourdos 2016; Halperin 2022). Queda anotado como alternativa (RPE-D05).
- **Cómo se muestra:** el valor («≈ 123,5 kg · estimación · Epley v1») y, al lado, con qué serie salió, en la notación del
  plan: «estimado con 5 reps a RPE 8 · 100 kg» o «estimado con 5 reps a RIR 2 · 100 kg». En «Cómo se calculó», el dato del
  esfuerzo en la notación, con su RIR al lado («8 (RIR 2)»), porque la cuenta de Epley usa el RIR.
- **Separado del máximo probado:** BE no guarda todavía una repetición máxima medida con protocolo (D-V3-03 de DL-171, para
  después). La estimación nunca va en TRAINING_PERSONAL_RECORDS, nunca se llama máximo ni marca, y cuando exista el probado
  va en su propio renglón: ninguno pisa al otro (RPE-D06).

## 4. Decisiones del continuador (a ratificar)

- **RPE-D01 · La notación vive en la versión del plan,** con el valor inicial de lo último que usó el profesional (RPE-07).
  Así la app sabe en cuál preguntar (la versión que rige ese día) y se congela con la instantánea: una versión activada no
  cambia de notación; para cambiarla, una versión nueva, como cualquier cambio del plan. Alternativas: una preferencia del
  profesional (no dice nada a la app de la persona y cambiaría planes ya activados) o una por persona (la versión ya la
  cubre).
- **RPE-D02 · Lo guardado es solo el RIR:** en la prescripción (el criterio sigue siendo `RIR`, REG-06-128; «RPE 8» es el
  criterio RIR con el valor 2), en la serie registrada, en la observada y en la estimación. Cambiar la notación no
  reescribe ningún número. Sin migración: la notación va en el contenido JSON de la versión, y solo cuando es RPE (lo que
  no existe no se guarda, como DL-161).
- **RPE-D03 · «6 o menos»:** es la opción más baja y se guarda como RIR 4. En RPE, todo RIR de 4 o más se lee «RPE 6 o
  menos»; en RIR, el número se lee tal cual. Escribir un RPE de 1 a 6 es «6 o menos»; uno de 6 a 10 que no cae en un medio
  punto (8,3) no se entiende. Un RIR guardado con otros decimales (1,25) se lee exacto en RPE (8,75), sin redondear. No se
  guarda una marca de «o más»: lo de debajo de RPE 6 no entra en la estimación y el RIR 4 es su piso. En RPE, una serie
  indicada «6 o menos» y registrada con 4 o más en reserva se lee «Dentro de lo indicado»: las dos dicen «RPE 6 o menos», y
  una diferencia que la pantalla no muestra no se nombra (en RIR, el número se compara tal cual).
- **RPE-D04 · Lo que sigue en RIR:** los gráficos (`entrenamiento.rir` de «Analizar», con su eje en RIR), la comparación
  gráfica por serie de Registros y lo que ven otros profesionales, porque leen el valor guardado. Una sola notación por
  pantalla: las tablas de texto de Registros y de la fuerza se leen en la del plan. En el editor, todo va en la del
  borrador: también «La vez pasada» y los renglones de «Antes de activar», que además nombra el cambio de notación frente a
  la vigente («Cómo se escribe el esfuerzo: RIR → RPE»): la app de la persona va a preguntar distinto aunque ningún número
  cambie.
- **RPE-D05 · El máximo estimado no cambia de método ni de límites** (§3). Ampliarlo a RPE 6 sería `BE-E1RM` v2.
- **RPE-D06 · «estimado con N reps a RPE X» al lado de cada valor,** y la estimación nunca como máximo probado (§3).
- **RPE-D07 · El historial y la fuerza se leen en la notación del plan vigente de la persona** (si no hay vigente, la de la
  versión más nueva), no en la de cada versión: una persona que pasó de un plan en RIR a uno en RPE ve todo su historial en
  RPE, con los mismos números guardados. Mientras se lee la notación, o si la lectura falla, RIR: nunca un número cambiado.
- **RPE-D08 · La APK de hoy no cambia:** pregunta y manda el RIR, que se guarda igual. La notación sale al titular solo con
  `training-effort-notation-1` (API-TRN-09 y API-SER-02). A diferencia de los objetivos por serie (DL-122) y del
  calentamiento (DL-178), un plan en RPE **no se retiene ni se bloquea su activación**: una APK que pregunta en RIR guarda
  exactamente lo mismo. Por eso la capacidad tampoco se registra.
- **RPE-D09 · Fuera de este paquete:** el RPE de la sesión (Foster, CR-10 × minutos), que va con «registrar otro deporte»
  (`be-ideas-proximas-actualizaciones`), y `perceivedExertion`, el esfuerzo percibido de la serie del 09 (de 0 a 10): es otra
  escala, no se escribe con la notación y no se mezcla con el RIR.
- **RPE-D10 · Las plantillas no llevan notación** (su estructura es la de entrada y no la tiene): el plan que nace de una
  plantilla toma la última del profesional, y en el editor de plantillas no hay selector. La escritura rápida de una línea
  («4×8-12 RIR 2») sigue entendiendo el RIR; escribir «RPE 8» en esa línea queda para después.
- **RPE-D11 · El selector va al pie de la columna de las sesiones,** debajo de las fechas, a la vista y con su lugar
  reservado: dos chips (RIR y RPE) y una línea corta; lo largo y las fuentes, detrás del «?» (`ExplicacionAPedido`). La barra
  de comandos ya está llena, y la notación es del plan entero, no de una sesión.

## 5. La API, la base y la APK

- **Sin migración.** `effortNotation` vive en el contenido JSON de la versión (y de su instantánea). Los planes de antes no
  la tienen y se leen RIR.
- **La compatibilidad:** los campos nuevos de entrada son opcionales (sin el campo, la notación del borrador no cambia) y
  los de salida también (ausente es RIR). Al titular sin la capacidad no le sale nada nuevo: la última APK congelada
  (0.29.0-candidata.1) lee «Hoy», el plan y la sesión, y registra con el RIR, sin un rechazo (TEST-RPE-024).
- **El RPE como criterio sigue siendo un 422** (`INTENSITY_CRITERION_INVALID`, REG-06-129): RPE es una notación, no un
  tercer criterio (TEST-RPE-021).
- **Autorización:** las lecturas y la edición son las de siempre (el profesional del plan; lo ajeno es el 404 de lo
  inexistente, TEST-RPE-025). El valor inicial lee solo versiones del mismo profesional, y solo su notación.

## 6. Pruebas

- **Dominio** (`packages/domain/src/notacion-del-esfuerzo.test.ts`): TEST-RPE-001 a 005 (la conversión en los dos
  sentidos, los bordes, «6 o menos», la ida y vuelta sin perder nada, lo escrito), 006 y 007 (los textos de la serie, del
  plan y de lo registrado; la comparación con el sentido al revés), 008 (la notación guardada, la inicial y la de la
  persona), 009 a 011 (el máximo estimado: el texto, valores conocidos de Epley y los límites de confiabilidad) y 012 (las
  guardias de Entrenamiento y de fuerza).
- **Integración** (corre en la CI, `test/integration/rpe-y-maximo-estimado.int-spec.ts`): TEST-RPE-020 (lo viejo sigue
  igual), 021 (elegir, conservar y quitar; el RPE como criterio es 422), 022 (se congela y la sucesora la hereda), 023 (el
  valor inicial, con otra persona), 024 (la última APK congelada registra en RIR con un plan en RPE; la 0.32 recibe la
  notación) y 025 (otro profesional recibe el 404 de lo inexistente).
- **Website** (`apps/web/test/rpe-y-maximo-estimado.test.mjs`): TEST-RPE-040 a 046 (la serie de origen y con qué se estimó,
  la regla y los motivos, el cuadro de la serie observada, el editor, lo registrado y la fuerza en la notación, y las
  guardias; el 046, el cambio de notación en «Antes de activar» y «La vez pasada» en la del borrador).
- **Navegador** (`test/navegador/recorridos.mjs`, `notacionDelEsfuerzo`): TEST-RPE-030, elegir RPE en el editor, ver «RPE
  8», que se guarde solo, que siga al recargar y que la API diga RPE con el RIR 2 guardado.

## 7. Lo que le falta a la APK para DL-194 (0.32)

- Declarar `training-effort-notation-1` en `X-BE-Capabilities` y leer `effortNotation` de API-TRN-09 y de API-SER-02.
- Preguntar el esfuerzo de cada serie en la notación del plan, con las opciones del dominio (`OPCIONES_DE_RPE`: 10 a 6,5 y
  «6 o menos»), y **mandar el RIR** (`rir`), con su procedencia (`fieldOrigins.rir`) como hasta ahora.
- Mostrar en la notación lo indicado (`textoDeRir(rir, notacion)`, `textoDelPlanDeLaSerie(o, notacion)`,
  `lineasDePrescripcion(p, { notacion })`) y lo registrado (`serieRegistradaEnPalabras(s, notacion)`).
- Congelar sus lecturas nuevas (DL-152) y probar en el teléfono que una sesión en RPE guarda el RIR esperado.

## 8. Lo que queda

- Ratificar RPE-D01 a RPE-D11.
- Mirarlo en pantalla (1920 × 1080, Windows al 125 %, navegador al 75 %) y con un lector de pantalla: por la memoria del
  equipo no se corrió `next build` ni el recorrido en el navegador localmente; los corre la CI.
- La escritura rápida en RPE (RPE-D10) y, si Dirección lo pide, `BE-E1RM` v2 con RPE 6 a 7,5 (RPE-D05).
- El RPE de la sesión, con «registrar otro deporte» (RPE-D09).
