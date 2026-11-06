# WP-FORMULARIOS-RONDA-2 — los formularios de inicio, después de la prueba de Dirección

> **Estado:** RATIFICADO por Dirección el 2026-11-05, pregunta por pregunta (D-1 a D-9; DEUDA_LEGAJO DL-165). En D-7 y
> D-9 Dirección eligió distinto de la recomendación. FR-01 y FR-02 se programaron antes de ratificar, porque corrigen lo
> que WP-FORMULARIOS-DE-INICIO ya pedía (FI-04 y PF-02). Rama `wp-formularios-ronda-2`, desde
> `wp-formularios-ronda-2-fallas` (`main` bbfe316 más FR-01 y FR-02). FR-03 a FR-10 programados en la rama (PR #237);
> las decisiones de la implementación D-10 a D-13 las ratificó Dirección el 2026-11-05. **Ronda 2.1 (2026-11-06, §8):**
> Dirección decidió «Tus hábitos» como formulario aparte (D-15 nueva) y «Pedir acceso a sus hábitos» (D-17 nueva), que
> reemplazan a las anteriores, y ratificó D-14, D-16 y D-18; D-19 sigue a ratificar, y las de la ronda 2.1 (D-20 a D-28),
> también. Programada en la rama `wp-habitos-formulario-aparte` (FR-12 a FR-15; PR en borrador).
>
> **Origen:** la prueba de Dirección del 2026-11-05 en la APK 0.20.0-candidata.1 y en el escritorio
> (`EVIDENCIA/FORMULARIOS-DE-INICIO/LEEME.md`, «Resultados»). Dirección: «es lo mismo pero cambia la experiencia de la
> persona».
>
> **Datos:** solo sintéticos, en local y en `test`. D-9 cambia quién ve qué: con personas reales espera la revisión legal
> (legajo legal; VJR-1, VJR-4 y VJR-5 del 08) y el gate del 08 §42.

## 0. Legajo y decisiones que cita

- **04:** RF-071; RNF-SEC-006 (segregación por dominio, «salvo autorización explícita»); RNF-PRI-001 (minimización) y
  RNF-PRI-002 (revocación efectiva).
- **05:** UC-P32 (el profesional solicita) y UC-P33 (la persona completa).
- **06:** REG-06-209 (una versión no se cambia: lo nuevo es una versión nueva) y REG-06-212 (requerido ⊆ solicitado).
- **08:** §11 (la matriz: cada profesional ve la porción de sus Alcances), §11-bis (pertinencia), C-11 (la compartición
  excepcional queda «como capacidad futura que requeriría diseño propio»), C-12 (una ampliación exige una aceptación nueva
  del titular) y §42 (gate de datos reales).
- **09:** v16.1 §22, sin cambios. La familia API-FRI de DL-164 no cambia de forma para lo que lee la APK 0.20.
- **DL:** DL-164 (los formularios de inicio); DL-152 (lo que leen las APK instaladas no cambia); DL-122 (las capacidades
  que declara el cliente, `X-BE-Capabilities`); DL-137 D-7 (lo nuevo va en operaciones nuevas); DL-100 (el contexto de
  entrenamiento); DL-127 (la línea de tiempo, API-DSH-04).

## 1. Las dos fallas (programadas antes de ratificar)

| ID | Qué | Toca la API | Se acepta cuando |
|---|---|---|---|
| FR-01 | El borrador del formulario no se pierde al cerrar la app (FI-04) | No | Lo escrito se guarda cifrado en el teléfono, por cuenta y por solicitud, con el mismo almacén que el entrenamiento en curso (`almacen-cifrado.ts`: AES-256-GCM, la clave en el almacenamiento seguro, fuera del respaldo). Se borra al enviar, al descartar, al cerrar la sesión y cuando la solicitud deja de estar pendiente. Una prueba fija cada caso. En el teléfono: cerrar la app desde Recientes y volver, y lo escrito sigue |
| FR-02 | Nutrición pide información desde su área, como Entrenamiento (PF-02) | No | El Resumen de Nutrición tiene «Pedir información», con «Cómo comés hoy» elegido y un «para qué» sugerido que se puede cambiar. Al enviar, vuelve a Nutrición |

## 2. Lo que decidió Dirección (DL-165)

1. **D-1 · Una pantalla por parte**, en la app y en «Cargar con la persona» de la web.
   - Cada parte del formulario (las `sections` de la plantilla: seis en cada una) va en su pantalla, con «Parte N de 6»,
     «Anterior» y «Siguiente».
   - Al final, un repaso de lo respondido antes de enviar.
   - Si falta una obligatoria, se avisa al pasar de parte, pero se puede seguir y volver.
2. **D-2 · Las ayudas, plegadas.**
   - El «para qué» de cada pregunta pasa a un botón «¿Para qué?».
   - «Lo que respondas queda como declarado por vos» se dice una sola vez, al empezar.
   - «Tocá de nuevo la opción elegida para dejarla sin responder» se reemplaza por «Quitar respuesta», que aparece solo
     cuando hay algo elegido en una pregunta opcional.
   - Los ejemplos quedan como texto de muestra en las respuestas de texto.
   - TalkBack sigue pudiendo leerlo todo.
3. **D-3 · Sin «Te lleva unos N minutos».** Lo reemplaza «Parte 1 de 6».
4. **D-4 · El embarazo, sin elegir al pedir y no obligatorio**, en los dos formularios (`nut_embarazo`, `trn_embarazo`).
   - Cada pregunta de la plantilla dice si viene pedida por defecto: hasta ahora, al pedir, venían todas elegidas.
   - En Entrenamiento, la pregunta de las indicaciones médicas suma «un embarazo o un parto reciente» como ejemplo.
5. **D-5 · Los días y el horario, en una tabla.** «Antes de entrenar» pregunta una fila por día y una opción por fila:
   Temprano, Mañana, Mediodía, Tarde, Noche, Varía o No puedo. Reemplaza a `trn_dias_posibles` y `trn_franja`.
   - `trn_dias_por_semana` no puede pasar de los días marcados: es una regla nueva en el dominio y en la API, y la app la
     avisa antes de enviar.
6. **D-6 · Otra actividad, con sus días.** En «Contame cuáles» (`trn_otros_deportes`), cada renglón suma «Qué días»
   (varios) y «En qué momento». Hace falta un subtipo nuevo de varias opciones dentro del renglón.
7. **D-7 (eligió distinto de la propuesta) · Quedan las 20 obligatorias de «Cómo comés hoy».** Al pedir, en la web, se
   tienen que ver más claras. En «Cargar con la persona», más visibles también. (En la plantilla son 22: 21, y la de las
   alergias, que se ve solo si hay alergia.)
8. **D-8 · Las solicitudes, a la vista en el escritorio.**
   - En la solicitud, «Cargar con la persona» va arriba, junto al estado, y no debajo de todas las preguntas.
   - «Pedir información» va en el Resumen de cada área con formulario. Nutrición ya lo tiene desde FR-02; Entrenamiento
     lo tiene desde PF-02 (DL-100).
   - La Línea de tiempo de la ficha suma los formularios: pedido, respondido, cargado, confirmado o rechazado.
   - La tarjeta de las respuestas en el Resumen («Lo que contó al empezar») va con el tablero, en WP-TABLERO-ALTA-GAMA.
9. **D-9 (eligió distinto) · Una sección común de hábitos, ya.**
   - Entran solo hábitos: el sueño y los horarios, la actividad del día, el deporte en la semana y el estrés. La salud
     (medicación, condiciones y embarazo) queda en cada área, como hoy.
   - La ven los profesionales de la persona solo si ella activa un interruptor propio en su app: «Compartir mis hábitos
     con mis profesionales», con la lista de quiénes los ven. Lo puede retirar.
   - Sin activarlo, cada profesional ve solo lo de su formulario.
   - Esto cambia quién ve qué: en producción espera la revisión legal. En `test` se construye con datos sintéticos.

## 3. Las partes

FR-06, FR-07 y FR-08 se programan en el orden del que dependen: primero el subtipo (FR-08) y la regla (FR-07), después
las plantillas que los usan (FR-06). Así la migración de las plantillas se escribe una sola vez.

| ID | Qué | Toca la API | Decisión | Se acepta cuando |
|---|---|---|---|---|
| FR-05 | Ayudas plegadas, «Quitar respuesta» y sin los minutos | No | D-2, D-3 | En la APK y en «Cargar con la persona», el «para qué» se abre con «¿Para qué?» (TalkBack lo anuncia como botón que se despliega); «Lo que respondas queda como declarado por vos» va una vez; «Quitar respuesta» aparece solo con algo elegido en una pregunta opcional; la ayuda de una respuesta de texto es su texto de muestra; ningún texto dice los minutos |
| FR-03 | Una pantalla por parte en la app, con el repaso | No | D-1 | «Parte N de M» (M: las partes con alguna pregunta pedida), «Anterior» y «Siguiente»; al pasar con una obligatoria sin responder, la parte siguiente lo avisa y deja volver; el repaso dice lo respondido por parte, lo que falta y «Cambiar»; el borrador del teléfono (FR-01) sigue igual. La lógica de las partes es del dominio, con sus pruebas |
| FR-04 | Una pantalla por parte en «Cargar con la persona», el botón arriba y las obligatorias a la vista | No | D-1, D-7, D-8 | Lo mismo que FR-03 en la web; en la solicitud, «Cargar con la persona» va arriba, junto al estado; al pedir, cada obligatoria dice «Obligatoria» en su fila y se cuentan; al cargar, cada parte dice cuántas obligatorias le faltan |
| FR-08 | El subtipo de varias opciones dentro de un renglón, que la APK 0.20 no ve | Sí | D-6 | El formato 3 del contrato V2 y la capacidad `forms-format-3` (`X-BE-Capabilities`, como DL-122): sin ella, una versión de formato 3 no existe para ese pedido (FRI-02 no la lista; FRI-01, 03, 04, 05, 06, 07 y 08 responden el 404 de lo inexistente); la APK nueva y la web la declaran y dibujan el subtipo; `lecturas-de-las-apk.int-spec.ts` lo prueba para la 0.20 |
| FR-07 | La regla «no más días que los marcados» | Sí | D-5 | Un número puede tener su tope en una tabla anterior (`maxFromMatrix`, solo en el formato 3): `validarRespuestasV2` lo rechaza con `FORM_ANSWER_MORE_THAN_MARKED`, la API responde 422 con ese issue y la app y la web lo avisan antes de enviar |
| FR-06 | Las versiones nuevas de las dos plantillas | Sí | D-4, D-5, D-6 | «Pedida por defecto» por pregunta (`requestedByDefault`, solo en el formato 3); FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO v3 por migración que solo agrega, sucesoras de las de DL-164, que quedan históricas; el embarazo sin pedir y no obligatorio; la tabla de días; otra actividad con sus días; la web pide lo que dice la plantilla. Las solicitudes ya creadas siguen en su versión |
| FR-09 | «Pedir información» en cada área y los formularios en la Línea de tiempo | Sí | D-8 | El Resumen de Nutrición y el de Entrenamiento lo tienen; API-DSH-04 suma cinco tipos de hecho (pedido, respondido, cargado, confirmado y rechazado), solo de las solicitudes de quien consulta y en sus Alcances permitidos, y la web los dibuja y abre la solicitud |
| FR-10 | La sección común de hábitos, con el interruptor de la persona | Sí | D-9; D-14 a D-19 | Programado (§4 y §7). La parte «Tus hábitos», igual en las dos versiones nuevas; FRI-04 agrega una versión de los hábitos en la misma transacción; la familia API-HBT-01 a 05; «Mis hábitos», el interruptor, la pregunta por un profesional nuevo y el retiro en la APK; «Sus hábitos» en Información del website; el texto del acto, una propuesta. La integración con PostgreSQL prueba el 404 sin autorización y fuera de la lista, el corte al retirar, al pausar y al terminar el vínculo, y que un profesional nuevo no se suma solo. Con personas reales, después de la revisión legal y del gate del 08 §42 (§4.6) |
| FR-11 | La candidata 0.21.0-candidata.1, sus lecturas congeladas y la evidencia, con TalkBack | No | — | Fuera de esta rama: la construye y la publica Dirección. *(2026-11-05: publicada como prerelease; los oráculos TEST-FR2-001 a 010, con sus trece campos, en `WP-FORMULARIOS-RONDA-2-ORACULOS.md`; la publicación, las lecturas congeladas y la guía de la prueba de Dirección, en `EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md`.)* |

## 4. FR-10 · la sección común de hábitos (programada)

El diseño lo revisó Dirección el 2026-11-05 y se programó como está acá. Lo que hubo que decidir al programarlo va en §7
(D-14 a D-19, a ratificar). Dónde está cada cosa:
- **Dominio:** `SECCION_DE_HABITOS` en `plantillas-de-inicio.ts`; las reglas en `habitos-de-la-persona.ts`; los contratos
  en `contratos-habitos-de-la-persona.ts`; los textos en `copy-habitos-de-la-persona.ts`; el texto del acto en `textos.ts`.
- **Base:** las migraciones `20261105130000_tipos_de_habitos_de_la_persona` y `20261105130100_habitos_de_la_persona`,
  que solo agregan. La de las plantillas, `20261105120000_formularios_ronda_2_plantillas`, se regeneró con la parte: no
  corrió en ningún ambiente, y solo inserta las dos versiones nuevas (las de DL-164, en `main`, no cambian).
- **API:** `formularios/habitos.service.ts`, `habitos.controller.ts` y `habitos-de-la-persona.ts`; el agregado en
  FRI-04 (`respuestas-v2.service.ts`); el retiro al cerrar la cuenta (`identidad/cierre.service.ts`); la decisión del
  PDP para una lectura que no depende del Alcance (`decidirAlgunAlcanceEnTransaccion`).
- **APK:** «Mis hábitos» (`pantallas/mis-habitos.tsx`, `habitos-en-el-telefono.ts`), la entrada en Información, la
  tarjeta de Inicio cuando hay algo que preguntar y «¿Sigue igual?» en `pantallas/formularios.tsx`.
- **Website:** la tarjeta «Sus hábitos» (`forms/tarjeta-de-sus-habitos.tsx`, `forms/sus-habitos.ts`) y la precarga de
  «Cargar con la persona» cuando el profesional ya los recibe (`forms/cargar.tsx`).
- **Pruebas:** `habitos-de-la-persona.test.ts` y `plantillas-de-inicio.test.ts` (dominio),
  `habitos-de-la-persona.int-spec.ts` (integración con PostgreSQL), `habitos-en-el-telefono.test.ts` (APK) y
  `sus-habitos.test.mjs` (website).

### 4.1 Qué preguntas

Una parte «Tus hábitos», igual en los dos formularios, con cuatro temas. Reutiliza los códigos que ya existen cuando la
pregunta es la misma (el criterio de DL-164), y los que hoy tienen el prefijo de un área pasan a un código neutro:

| Tema | Pregunta | Tipo | Código | Viene de |
|---|---|---|---|---|
| El sueño y los horarios | ¿A qué hora te levantás y te acostás? (entre semana y el fin de semana) | Horarios | `habitos_horarios` | `nut_horarios` (Nutrición) |
| | ¿Cuántas horas dormís habitualmente? | Número (h, de 3 a 14) | `horas_de_sueno` | Entrenamiento, y FRM-HABITOS de P0 |
| La actividad del día | ¿Cómo es tu día, en movimiento? | Una opción | `nivel_de_actividad` | Los dos formularios (ya es el mismo código) |
| El deporte en la semana | ¿Hacés ejercicio, deporte u otra actividad en la semana? | Sí o no | `habitos_hace_deporte` | `trn_otro_deporte` y `nut_actividad_semanal` |
| | Contame cuáles (qué, qué días, en qué momento, minutos y qué tan exigente) | Lista, con el subtipo de FR-08 | `habitos_deportes` | `trn_otros_deportes` (v3) |
| El estrés | ¿Cómo viene tu semana, en estrés? | Una opción | `habitos_estres` | `trn_estres` |

Quedan en cada área, como hoy: la medicación (`medicacion_relevante`), las condiciones (`condiciones_declaradas` y las
`trn_salud_*`), el embarazo (`nut_embarazo`, `trn_embarazo`), lo de comer en la jornada (`nut_hora_de_entrenamiento` es de
Nutrición) y fumar (`fuma`, en Entrenamiento: no está en la lista de Dirección). Sumar una pregunta a la sección común es
una decisión de Dirección.

**Cómo quedaron las plantillas** (en las versiones nuevas de FR-06, FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO v3, sin
versiones extra; la D-15 anterior). *(2026-11-06: desde la ronda 2.1, la parte es un formulario aparte, «Tus hábitos»
(FRM-HABITOS v2), y las vigentes de área ya no la traen: §8.3. Estas dos siguen así, históricas.)*

| Formulario | Partes, en orden | Lo que se movió a «Tus hábitos» |
|---|---|---|
| «Cómo comés hoy» v2 (56 preguntas) | **Tus hábitos** · Tu día · Las comidas de tu semana · Alimentos que sí y que no · Lo que tomás · Tu salud y la comida · Lo que buscás | De «Tu día»: los horarios (`nut_horarios`), el día en movimiento (`nivel_de_actividad`) y el ejercicio de la semana (`nut_actividad_semanal`). «¿En qué momento del día solés entrenar?» queda en «Tu día» y se abre con «Sí» en el deporte de la parte común |
| «Antes de entrenar» v3 (43 preguntas) | Tu salud antes de entrenar · Dolor y lesiones · Tu experiencia · Lo que buscás · **Tus hábitos** · Tu semana para entrenar · Tus preferencias | De «Tu semana para entrenar»: el día fuera del entrenamiento (`nivel_de_actividad`), el otro deporte y sus actividades (`trn_otro_deporte`, `trn_otros_deportes`). De «Descanso y preferencias»: las horas de sueño y el estrés; la sección queda como «Tus preferencias» |

Las dos tienen siete partes: «Parte N de 7» cuando se pide todo (antes, seis). El repaso no cambia: dice lo respondido por
parte, también la de los hábitos. Las obligatorias de la parte son las mismas en los dos formularios: los horarios, las
horas de sueño, el día en movimiento, si hace deporte y, con «Sí», cuáles. Por eso «Cómo comés hoy» v2 queda con 24
obligatorias en la plantilla (22 a la vista; las alergias y la lista del deporte, detrás de su condición) y «Antes de
entrenar» v3, con 23. El profesional las puede cambiar al pedir, como siempre.

### 4.2 Dónde vive el dato

- **Una entidad nueva de la persona, no de un área:** `habitos_de_la_persona`, de solo agregar. Cada versión guarda las
  respuestas de la sección en el formato V2 (las mismas formas que una respuesta de formulario), siempre `SELF_REPORTED`,
  con su momento de registro y de dónde salió (un formulario respondido o «Mis hábitos»). La vigente es la última; las
  anteriores quedan en la historia de la persona (una corrección agrega, nunca pisa).
- **Cómo se carga:** al responder o confirmar un formulario cuya versión tiene la parte «Tus hábitos», FRI-04 agrega, en
  la misma transacción, una versión de sus hábitos con lo que respondió de esa parte. La respuesta del formulario guarda
  sus respuestas como hoy: por eso, sin el interruptor, cada profesional sigue viendo solo lo de su formulario. La persona
  también los ve y los cambia en «Mis hábitos», en su app.
- **La persona no responde dos veces lo mismo:** cuando otro formulario pide la parte «Tus hábitos», la app la trae con
  lo vigente para que confirme o cambie («Ya lo respondiste el 5/11: ¿sigue igual?»). Es su propio dato, en su teléfono;
  lo que envía es una respuesta nueva del área que la pidió.
- **Programado así** (D-16, D-18): lo que el formulario preguntó de la parte reemplaza lo vigente (y lo que dejó sin
  responder, sale); lo que no preguntó queda como estaba. Rectificar una respuesta no cambia los hábitos. En la web,
  «Cargar con la persona» no precarga nada de los hábitos, salvo que ese profesional ya los reciba por la autorización
  (API-HBT-05); así, un profesional nunca ve por esta vía lo que la persona respondió en el formulario de otra área.

### 4.3 La autorización nueva y sus operaciones

- **El acto:** «Compartir mis hábitos con mis profesionales», un acto de la persona distinto de A3 y de B2: no autoriza un
  Alcance, sino una categoría (hábitos) hacia profesionales con vínculo vigente. Se guarda versionado en
  `autorizacion_de_habitos`: la persona, el estado (`ACTIVA` o `RETIRADA`), la lista explícita de profesionales que la
  reciben, la versión del texto que aceptó, cuándo la dio y cuándo la retiró. Cada cambio es una fila nueva.
- **La lista es explícita** (08 C-12: ampliar exige una aceptación nueva): al activarla se eligen los profesionales con
  vínculo vigente, todos marcados. Un profesional que se vincula después no la recibe solo: la app le pregunta a la persona
  si lo suma, y sin respuesta no lo suma.
- **Operaciones nuevas, familia API-HBT** (lo nuevo va en operaciones nuevas, DL-137 D-7). El diseño las llamaba API-HAB,
  pero HAB ya es «Mis habituales» de entrenamiento (DL-109) y repetir un ID es lo que prohíbe DL-116: van como HBT (D-14).

| ID | Método y ruta | Quién | Qué hace |
|---|---|---|---|
| API-HBT-01 | `GET /me/habits` | La persona | Sus hábitos vigentes, su historia, el estado de la autorización, sus profesionales con lo que la autorización dice de cada uno, y el texto del acto |
| API-HBT-02 | `POST /me/habits` | La persona | Una versión nueva de sus hábitos desde «Mis hábitos» (Idempotency-Key, la validación de V2, con la vigente que vio) |
| API-HBT-03 | `PUT /me/habits/sharing` | La persona | Activar la autorización o cambiar con quiénes, con la versión que vio y el texto que acepta |
| API-HBT-04 | `POST /me/habits/sharing/withdrawal` | La persona | Retirarla, para todos a la vez |
| API-HBT-05 | `GET /advisees/{adviseeId}/habits` | El profesional | Los hábitos vigentes de la persona, si la autorización está activa y lo incluye y su vínculo está vigente. Si no, el 404 de lo inexistente |

  Las escrituras van con Idempotency-Key, auditoría y evento, como FRI. HBT-05 no depende del Alcance: la autorización es
  de la persona y por profesional. Pasa por el PDP para el vínculo vigente (ni en pausa ni terminado, 08 §14.1) y el A3 de
  la persona; cada lectura queda en el registro de accesos (`decision_de_acceso`), del que sale lo que la persona puede
  saber de quién vio sus datos (08 §19.7).

### 4.4 Qué ve cada profesional

- **Sin la autorización, o sin estar en la lista:** lo de su formulario, como hoy. HBT-05 le responde el 404 de lo
  inexistente: no se entera de que hay hábitos de otra área.
- **Con la autorización y en la lista:** la versión vigente de los hábitos, con su fecha y «Declarado por la persona». No
  ve de qué formulario salió ni el área del otro profesional: el origen se dice como «en un formulario» o «en Mis hábitos».
  Tampoco ve la historia: es de la persona.
- **En la web:** una tarjeta «Sus hábitos», en Información de la ficha, con «Compartido por la persona el 5/11». La Línea
  de tiempo no suma un hecho por cada cambio: los hábitos no son un hecho del área.

### 4.5 Qué pasa al retirarla

- El acceso se corta a futuro, para todos y en el momento: desde ahí HBT-05 responde 404 (RNF-PRI-002).
- No se borra nada: los hábitos son de la persona y siguen en su app; lo que cada profesional tiene de su propio
  formulario sigue siendo suyo, como hoy. Lo que un profesional ya vio no se puede «desver»: se dice en el texto del acto.
- Terminar o pausar un vínculo corta a ese profesional, aunque la autorización siga activa. Cerrar la cuenta la retira.

### 4.6 Compatibilidad y legal

- La APK 0.20 no llama API-HBT y no ve las versiones que traigan la parte «Tus hábitos» (formato 3, FR-08): nada cambia
  para ella. Una prueba del dominio lo fija: ningún congelado de `VIGENTES` lee una operación HBT. *(2026-11-05: la
  0.21.0-candidata.1 lee las de la persona, 01 a 04, con su forma congelada. Desde ahí la prueba fija que hasta la 0.20 no
  se lee ninguna, y desde la 0.21, solo esas cuatro; DL-152.)*
- Lo legal va al legajo legal, fuera del repo público: el texto del acto; su base (el consentimiento expreso del titular
  para una categoría sensible hacia perfiles no sanitarios, VJR-1 y VJR-4 del 08, y el paso de información entre sus
  profesionales, VJR-5); la revocación y lo que se informa. En `test`, con datos sintéticos; con personas reales, después
  de esa revisión y del gate del 08 §42.
- **El texto del acto es una propuesta**, como `EVIDENCIA_VISUAL` en DL-125: `habitos-compartidos-2026-11-propuesta`
  (tipo `HABITOS_COMPARTIDOS`), con «Texto propuesto, pendiente de validación jurídica.» en el texto mismo, y la API lo
  informa con `approval: 'PENDING_APPROVAL'`. La versión aprobada entra como sucesora, con otro id, y no hereda las
  aceptaciones de esta. No se agregó ningún interruptor de configuración ni se tocó `render.yaml`.
- **Habilitarlo con personas reales espera la revisión legal y el gate del 08 §42.** Hasta entonces, la autorización se
  usa solo en `test` y con cuentas sintéticas.

## 5. Compatibilidad con las APK instaladas

- **La 0.20.0-candidata.1 no cambia lo que lee** (DL-152): las versiones de formato 2 (FRM-NUTRICION-INICIO v1 y
  FRM-ENTRENAMIENTO v2) salen idénticas por FRI-01, 02 y 03, y las solicitudes ya creadas siguen en su versión.
- **Lo nuevo no le llega:** las versiones nuevas son de formato 3 y solo se entregan a un cliente que declara
  `forms-format-3` (la APK nueva y la web). Para la 0.20 son el 404 de lo inexistente, como lo que hizo FI-03 con las APK
  anteriores. La consecuencia: lo que se pida de los dos formularios desde que esto esté en `test` lo responde la APK
  nueva (FR-11), o se carga con la persona desde el escritorio.
- **Las lecturas congeladas** (`lecturas-de-las-apk.int-spec.ts`, `lecturas-de-la-apk.test.ts`) suman el caso: la 0.20 no
  ve una solicitud de formato 3.
- **`VIGENTES` queda con la 0.13.2 y la 0.20.0-candidata.1:** ningún teléfono tiene la 0.17.0-candidata.3 ni la
  0.18.0-candidata.1 (Dirección ya actualizó a la 0.20; nota en DL-152). *(2026-11-05: se suma la 0.21.0-candidata.1, sin
  sacar la 0.20.)*

## 6. Fuera de esta ronda

- La tarjeta de las respuestas en el Resumen de la ficha: WP-TABLERO-ALTA-GAMA.
- La candidata 0.21.0-candidata.1 (FR-11): la construye y la publica Dirección.
- Cambiar las versiones ya publicadas: una versión no se toca (REG-06-209).
- Del FR-10: avisarle al profesional (una novedad) cuando la persona empieza a compartirle sus hábitos o deja de hacerlo, y
  una pantalla de la persona con quién vio sus datos (08 §19.7; el registro ya existe). Son ideas, sin decidir. Con la ronda
  2.1, lo mismo para la respuesta a un pedido de acceso: el profesional lo ve en API-HBT-07, sin aviso.
- La candidata 0.22 (FR-16): la construye y la publica Dirección.

## 7. Decisiones de la implementación

D-10 a D-13 (FR-06 a FR-09) las **ratificó Dirección el 2026-11-05**; el detalle está en DL-165. D-14 a D-19 son las del
FR-10: el 2026-11-06 Dirección **ratificó D-14, D-16 y D-18** y **reemplazó D-15 y D-17** por las nuevas de la ronda 2.1
(§8.1); **D-19 sigue a ratificar**. Lo que sigue es como quedaron programadas el 2026-11-05:

- **D-14 · La familia se llama API-HBT, no API-HAB.** HAB ya es «Mis habituales» de entrenamiento (DL-109), y la guardia
  de trazabilidad frena un ID repetido (DL-116). Las rutas y lo que hace cada una son las del diseño.
- **D-15 · Dónde va la parte, y lo que eso cambia.** Primera en «Cómo comés hoy», donde la v1 abría con los horarios; antes
  de «Tu semana para entrenar» en «Antes de entrenar», donde estaban esas preguntas (la salud sigue primera). Las dos
  quedan con siete partes. «Descanso y preferencias» pasa a ser «Tus preferencias». Las obligatorias de la parte son las
  mismas en los dos formularios, así que «Cómo comés hoy» suma dos (las horas de sueño y, con «Sí», la lista del deporte).
- **D-16 · La versión que agrega un formulario.** Lo que el formulario preguntó de la parte reemplaza lo vigente, y lo que
  la persona dejó sin responder sale; lo que no preguntó queda como estaba. Cada formulario respondido agrega una versión,
  aunque no cambie nada: es lo que la persona confirmó ese día. Rectificar una respuesta (FRI-05) no cambia los hábitos,
  porque lo vigente puede ser más nuevo que ese formulario; se corrigen en «Mis hábitos», que no exige ninguna pregunta y
  pide la vigente que se vio (409 si entró otra).
- **D-17 · La lista explícita es por componente de vínculo.** Cada renglón nombra al profesional y cada componente sin
  terminar (aceptado o en pausa) que tenía en ese momento: si los recibe y desde cuándo, o si la persona dijo que no. El
  «no» queda: no se le vuelve a preguntar. Un profesional que vuelve con otro vínculo después de terminar es alguien que
  llega después, y se le pregunta. Un área nueva del mismo profesional se registra en la próxima versión. Límite: si se
  termina el área por la que se lo sumó y sigue otra más nueva, sin una versión en el medio, se le vuelve a preguntar.
- **D-18 · «¿Sigue igual?»** Solo en el teléfono de la persona: una solicitud nueva (sin respuesta, sin nada cargado, sin
  borrador recuperado) trae lo vigente de lo que pide, y la parte lo dice. En la web, solo si ese profesional ya los recibe,
  con «Sus hábitos, como los compartió el <fecha>: preguntale si siguen igual.».
- **D-19 · El acto y el corte.** El texto es una versión propia del catálogo, propuesta. Compartir pide la versión vigente
  del texto (409 CONSENT_VERSION_STALE, como CON-02) y el A3; retirar no pide el A3, porque siempre se puede. Revocar el A3
  no la retira, pero la suspende: el PDP niega HBT-05 mientras tanto, como con todo lo demás. Cerrar la cuenta la retira.
  Un retiro queda antes o después de cada lectura, nunca en el medio (un cerrojo por persona: compartido para leer,
  exclusivo para escribir). La pregunta por un profesional nuevo va en «Mis hábitos» y, solo cuando hay algo que preguntar,
  en una tarjeta de Inicio. Límite: si nadie recibe los hábitos hoy (todos terminaron su vínculo), «No, por ahora» no se
  ofrece, porque compartir pide al menos un profesional; la persona puede sumarlo o dejar de compartir.

## 8. Ronda 2.1 · «Tus hábitos» aparte y «Pedir acceso a sus hábitos» (2026-11-06)

> **Estado:** decidido por Dirección el 2026-11-06, pregunta por pregunta (DL-165). D-15 y D-17 nuevas, que reemplazan a
> las anteriores; D-14, D-16 y D-18 ratificadas; D-19 sigue a ratificar. Programado en la rama
> `wp-habitos-formulario-aparte`, desde `main` (`758b4d8`). Lo que hubo que decidir al programarlo va en §8.6 (D-20 a
> D-28, **a ratificar**). La APK 0.22 la construye y la publica Dirección (FR-16).
>
> **Datos:** como la ronda 2, solo sintéticos, en local y en `test`. Con personas reales, después de la revisión legal y del
> gate del 08 §42 (§4.6).

### 8.1 Lo que decidió Dirección

1. **D-15 (nueva) · «Tus hábitos», un formulario aparte.** En sus palabras: «Puede estar en un formulario separado que sea
   de hábitos, que puedan enviar ambos profesionales. Por ejemplo, inicia hoy el nutricionista y le envía el formulario de
   nutrición y hábitos, y en 3 meses el entrenador comienza y le envía el formulario de entrenamiento y el de hábitos si es
   que quiere actualizarlo, y si no ya lo tiene disponible. O, por ejemplo, pasan 6 meses más y algún profesional quiere
   reenviarle el formulario de hábitos para saber si todo sigue igual.»
   - «Tus hábitos» pasa a ser una plantilla propia, de formato 3, con las seis preguntas de §4.1. FRM-HABITOS ya existía en
     P0: va como su versión 2. La pide y la vuelve a pedir cualquier profesional con el vínculo vigente, en su área.
   - Las de área salen en versiones nuevas, sin la parte: «Cómo comés hoy» v3 y «Antes de entrenar» v4, por una migración
     que solo agrega. Las v2 y v3 de la ronda 2 ya corrieron en `test` y no se tocan: sus Solicitudes siguen andando y
     siguen sumando hábitos al responderse.
   - La regla de FRI-04 queda general: cualquier versión con las preguntas de hábitos agrega una versión de los hábitos.
2. **La sugerencia al pedir** (ratificada). Al pedir un formulario de área, el cajón ofrece «Sumar «Tus hábitos»»:
   marcada si el profesional no ve hábitos de la persona (ni de una respuesta suya ni compartidos, HBT-05) o si los que ve
   tienen más de 3 meses; sin marcar, con su fecha, si son recientes. Nunca puede revelar que la persona contó sus hábitos a
   otro profesional. Con la casilla marcada, se envían las dos solicitudes en un paso, y si una falla se dice cuál.
3. **D-16 ratificada:** lo respondido reemplaza lo vigente.
4. **D-18 ratificada:** «¿Sigue igual?» solo en el teléfono de la persona; ahora vale también para «Tus hábitos» aparte.
5. **D-14 ratificada:** la familia API-HBT.
6. **D-17 (nueva) · la persona siempre decide, y el profesional puede pedir.** En sus palabras: «Debería tener la opción
   siempre de poder cambiar su opinión y darle acceso, ya que es parte del beneficio al profesional. Tiene que entender la
   persona que es importante brindar ese acceso... obvio, siempre que quiera. El profesional puede reenviar la solicitud de
   acceso y que a la persona le llegue como importante... igualmente, siempre, indiscutiblemente, el acceso de sus datos a
   terceros es su decisión... nunca una obligación.»
   - La persona suma o saca a cualquier profesional en cualquier momento, desde «Mis hábitos» («Cambiar con quiénes»).
   - El profesional tiene «Pedir acceso a sus hábitos». Le llega a la persona como una novedad destacada como importante,
     con el aviso push genérico de DL-133.
   - La novedad dice quién pide, para qué le sirve y que es su decisión. «Sí, que los vea» y «No, por ahora» pesan lo mismo:
     sin presión, sin «recomendado» y sin culpa.
   - Un límite para que no sea insistente: una pendiente por vez por profesional, y volver a pedir recién a los 7 días del
     último (D-24, a ratificar).
   - Ya no va la repregunta automática al actualizar los hábitos.
7. **Compatibilidad:** las lecturas congeladas de la 0.13.2, la 0.20 y la 0.21 siguen pasando. La novedad nueva no rompe a
   una APK que no la conoce, y la 0.21 responde «Tus hábitos» aparte (formato 3).

### 8.2 Las partes

| ID | Qué | Toca la API | Decisión | Se acepta cuando |
|---|---|---|---|---|
| FR-12 | «Tus hábitos» aparte y las de área sin la parte | Sí | D-15 nueva; D-20, D-21 | FRM-HABITOS v2, FRM-NUTRICION-INICIO v3 y FRM-ENTRENAMIENTO v4 en `20261106120000_formularios_ronda_2_1_plantillas`, generada desde el dominio y sin tocar las dos anteriores; FRM-03 ya no deja pedir FRM-HABITOS v1 ni las de la ronda 2, y sus Solicitudes ya pedidas siguen; responder cualquier versión con la parte agrega una versión de los hábitos |
| FR-13 | «Sumar «Tus hábitos»» al pedir un formulario de área | Sí | D-22 | API-HBT-07 dice lo que ve este profesional; el cajón marca o no la casilla con `sugerenciaDeSumarHabitos` y su fecha; con la casilla, dos solicitudes en un paso, y si una falla se dice cuál; una prueba de integración fija que lo que la persona respondió a otro profesional no aparece |
| FR-14 | «Pedir acceso a sus hábitos», la novedad y el límite | Sí | D-17 nueva; D-23 a D-25 | API-HBT-06 a 09; la novedad `HABITS_ACCESS_REQUESTED` con el aviso genérico; una pendiente por vez y 7 días entre pedidos, en el dominio y en la base; «Sí» es compartir (texto y A3) y «No, por ahora» no cambia nada; sumarlo desde «Mis hábitos» da por aceptado su pedido; la tarjeta «Sus hábitos» del website sin acceso ofrece pedirlo |
| FR-15 | La APK 0.22: la novedad destacada, el pedido, «Tus hábitos» aparte y «Mis hábitos» | Sí (lee 08 y 09) | D-17 nueva, D-18; D-26, D-27 | «Importante» con palabras; el pedido en «Mis hábitos» y en Inicio, con las dos respuestas del mismo peso; quien tiene un pedido no recibe además la pregunta por el profesional nuevo; «Tus hábitos» aparte se responde y trae «¿Sigue igual?»; «Cambiar con quiénes» vuelve a sumar a quien dijo que no |
| FR-16 | La candidata 0.22, sus lecturas congeladas y la evidencia, con TalkBack | No | — | Fuera de esta rama: la construye y la publica Dirección. La guía de la prueba, en `EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md`, «La prueba de la 0.22» |

### 8.3 Las plantillas

| Plantilla | Versión | Partes, en orden | Preguntas | Obligatorias (a la vista) |
|---|---|---|---|---|
| «Tus hábitos» (FRM-HABITOS) | v2, sin área propia, sucede a la v1 de P0 | Tus hábitos | 6: las de §4.1 | 5 (4) |
| «Cómo comés hoy» (FRM-NUTRICION-INICIO) | v3, sucede a la v2 | Tu día · Las comidas de tu semana · Alimentos que sí y que no · Lo que tomás · Tu salud y la comida · Lo que buscás | 50 | 19 (18) |
| «Antes de entrenar» (FRM-ENTRENAMIENTO) | v4, sucede a la v3 | Tu salud antes de entrenar · Dolor y lesiones · Tu experiencia · Lo que buscás · Tu semana para entrenar · Tus preferencias | 37 | 18 (18) |

- La parte de «Tus hábitos» v2 es `SECCION_DE_HABITOS`, campo por campo: la misma que traen «Cómo comés hoy» v2 y «Antes de
  entrenar» v3. Por eso las tres agregan hábitos igual, y «¿Sigue igual?» funciona igual en las tres.
- Las de área son las de la ronda 2 sin esa parte; lo demás no cambia, pregunta por pregunta. La única excepción es «¿En qué
  momento del día solés entrenar?», que en la v2 se abría con el «Sí» de la parte: en la v3 queda a la vista, opcional, y
  suma «No entreno» (D-21).
- Las de la ronda 2 quedan históricas. FRM-03 responde 422 `FORM_TEMPLATE_NOT_SELECTABLE` si se las pide, como a toda versión
  con sucesora (REG-06-209). FRM-HABITOS v1 (P0, contrato V1), lo mismo: sus Solicitudes ya pedidas las sigue respondiendo la
  APK instalada por FRM-07.

### 8.4 Las operaciones nuevas (familia API-HBT)

Lo que lee la 0.21 (HBT-01 a 04) no cambia de forma (DL-152): todo lo nuevo va en operaciones nuevas (DL-137 D-7).

| ID | Método y ruta | Quién | Qué hace |
|---|---|---|---|
| API-HBT-06 | `POST /advisees/{adviseeId}/habits/access-requests` | El profesional | Pide acceso desde un área en la que la acompaña (`scope`). Publica la novedad a la persona. 422 `HABITS_ACCESS_REQUEST_TOO_SOON` (con `availableFrom`) antes de los 7 días; 422 `HABITS_ALREADY_SHARED` si ya los recibe; sin acceso en esa área, el 404 de lo inexistente |
| API-HBT-07 | `GET /advisees/{adviseeId}/habits/status` | El profesional | Sin ver ningún hábito: sus áreas, si los recibe y desde cuándo, lo más nuevo que ve, desde cuándo espera una solicitud con la parte, su último pedido (pendiente o respondido, sin decir qué) y si puede pedirlo hoy o desde cuándo |
| API-HBT-08 | `GET /me/habits/access-requests` | La persona | Los pedidos que esperan su respuesta, de profesionales con el vínculo aceptado en esa área. Sin el A3, 403 |
| API-HBT-09 | `POST /me/habits/access-requests/{accessRequestId}/answer` | La persona | `SHARE` («Sí, que los vea»), con la versión de la autorización y el texto mostrado, o `NOT_NOW` («No, por ahora») |

- **La base:** `pedido_de_acceso_a_habitos` (migraciones `20261106120100` y `20261106120200`, que solo agregan). Una
  pendiente por profesional y persona (índice parcial); nace PENDIENTE desde un componente de vínculo de ese profesional
  con esa persona; se resuelve una sola vez (ACEPTADO, NO_POR_AHORA o REEMPLAZADO); no se borra ni se trunca; la novedad
  nombra el pedido. Cada paso queda en la bitácora de los formularios (`PedidoDeAccesoAHabitos…`).
- **La novedad:** «Te piden ver tus hábitos». «‹Nombre›, de ‹Área›, te pide ver tus hábitos. ‹Para qué le sirve›. Es tu
  decisión: lo respondés en «Mis hábitos».» El para qué, por área: «Le ayuda a armar un plan de comidas que entre en tu
  semana.» (Nutrición), «Le ayuda a armar un plan de entrenamiento que entre en tu semana.» (Entrenamiento) y «Le ayuda a
  leer tus tomas junto con tu descanso y tu actividad.» (Antropometría). Nunca un hábito. El aviso push dice «Tenés una
  novedad.», como siempre.
- **Dónde está cada cosa:** las reglas en `habitos-de-la-persona.ts` (dominio: `sugerenciaDeSumarHabitos`,
  `tienenMasDeTresMeses`, `puedePedirAcceso`, `compartirAlAceptarUnPedido`); los contratos en
  `contratos-habitos-de-la-persona.ts`; los textos en `copy-habitos-de-la-persona.ts` y `copy-novedades.ts`; la API en
  `formularios/habitos.service.ts` y `formularios/habitos-de-la-persona.ts`; el website en `forms/sumar-habitos.ts`,
  `forms/pedir.tsx`, `forms/sus-habitos.ts` y `forms/tarjeta-de-sus-habitos.tsx`; la APK en `habitos-en-el-telefono.ts`,
  `novedades-en-el-telefono.ts`, `pantallas/mis-habitos.tsx`, `pantallas/inicio-informacion.tsx` y `pantallas/novedades.tsx`.
- **Pruebas:** `plantillas-de-inicio.test.ts` y `habitos-de-la-persona.test.ts` (dominio); `habitos-de-la-persona.int-spec.ts`,
  `plantillas-de-inicio.int-spec.ts`, `contrato.int-spec.ts` y `lecturas-de-las-apk.int-spec.ts` (integración con PostgreSQL);
  `sumar-habitos.test.mjs` y `sus-habitos.test.mjs` (website); `habitos-en-el-telefono.test.ts` y
  `novedades-en-el-telefono.test.ts` (APK).

### 8.5 Compatibilidad con las APK instaladas

- **0.13.2 y 0.20:** no ven nada de esto. Las versiones nuevas son de formato 3 (D-10), y no leen API-HBT. Lo que ya tenían
  pedido sigue igual. Si leen el centro de novedades (la 0.20), la novedad nueva se lee con su esquema: `kind` y
  `open.view` son texto.
- **0.21:** las lecturas congeladas siguen pasando, con escenarios nuevos:
  - responde «Tus hábitos» aparte sola (una parte: «Parte 1 de 1», el repaso y «¿Sigue igual?»), y sigue respondiendo una
    Solicitud de la ronda 2 pedida antes;
  - lee la novedad nueva sin destacarla: la muestra con su texto y, al abrirla, se queda en Novedades (no conoce
    `MY_HABITS`). La persona la puede responder sumándolo en «Mis hábitos»: API-HBT-03 da por aceptado el pedido (D-25);
  - «Mis hábitos» (HBT-01 a 04) no cambia de forma, con o sin un pedido esperando.
- **0.22:** suma API-HBT-08 y 09. Sus lecturas se congelan desde su tag, como las de la 0.21 (DL-152): la prueba del dominio
  ya admite que una APK desde la 0.21 lea las de la persona (01 a 04, 08 y 09) y nunca las del profesional (05 a 07).
  *(2026-11-06: la 0.22.0-candidata.1, `1254269`, congelada. Lee 88 operaciones, las 86 de la 0.21 con la misma forma y
  HBT-08 y 09, y se sumó a `VIGENTES` sin sacar la 0.20 ni la 0.21; nota en DL-152.)*

### 8.6 Decisiones de la implementación (a ratificar)

Están completas en DL-165. En corto:
- **D-20 · La regla general de FRI-04:** la reconoce el código de la parte (`tus_habitos`), en cualquier versión.
- **D-21 · Las tres versiones nuevas:** «Tus hábitos» v2 sucede a la v1 de P0; las de área pierden la parte y nada más,
  salvo la hora de entrenar de Nutrición.
- **D-22 · La sugerencia:** sale de API-HBT-07; los tres meses son de calendario; una pendiente no se marca; las dos
  solicitudes van en un paso, primero la de área.
- **D-23 · «Pedir acceso»:** la novedad se destaca por su tipo; el profesional no ve qué respondió la persona.
- **D-24 · El límite:** una pendiente por vez y 7 días desde el último; el nuevo reemplaza al pendiente.
- **D-25 · La respuesta:** «Sí» es compartir; sin compartir todavía, solo para quien pidió; «No, por ahora» no toca nada.
- **D-26 · Lo que queda del mecanismo anterior:** la lista por componente; sin repregunta automática.
- **D-27 · En la APK 0.22:** «Importante» con palabras; dos botones iguales; sin «Parte 1 de 1».
- **D-28 · La 0.21 y el texto del acto:** la 0.21 recibe la novedad; el texto del acto no cambia.
