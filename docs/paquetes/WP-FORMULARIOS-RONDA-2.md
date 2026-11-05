# WP-FORMULARIOS-RONDA-2 — los formularios de inicio, después de la prueba de Dirección

> **Estado:** RATIFICADO por Dirección el 2026-11-05, pregunta por pregunta (D-1 a D-9; DEUDA_LEGAJO DL-165). En D-7 y
> D-9 Dirección eligió distinto de la recomendación. FR-01 y FR-02 se programaron antes de ratificar, porque corrigen lo
> que WP-FORMULARIOS-DE-INICIO ya pedía (FI-04 y PF-02). Rama `wp-formularios-ronda-2`, desde
> `wp-formularios-ronda-2-fallas` (`main` bbfe316 más FR-01 y FR-02).
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
| FR-10 | La sección común de hábitos, con el interruptor de la persona | Sí | D-9 | Solo el diseño (§4). Se programa después de que lo revise Dirección |
| FR-11 | La candidata 0.21.0-candidata.1, sus lecturas congeladas y la evidencia, con TalkBack | No | — | Fuera de esta rama: la construye y la publica Dirección |

## 4. FR-10 · la sección común de hábitos: el diseño (sin programar)

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

### 4.3 La autorización nueva y sus operaciones

- **El acto:** «Compartir mis hábitos con mis profesionales», un acto de la persona distinto de A3 y de B2: no autoriza un
  Alcance, sino una categoría (hábitos) hacia profesionales con vínculo vigente. Se guarda versionado en
  `autorizacion_de_habitos`: la persona, el estado (`ACTIVA` o `RETIRADA`), la lista explícita de profesionales que la
  reciben, la versión del texto que aceptó, cuándo la dio y cuándo la retiró. Cada cambio es una fila nueva.
- **La lista es explícita** (08 C-12: ampliar exige una aceptación nueva): al activarla se eligen los profesionales con
  vínculo vigente, todos marcados. Un profesional que se vincula después no la recibe solo: la app le pregunta a la persona
  si lo suma, y sin respuesta no lo suma.
- **Operaciones nuevas, familia API-HAB** (lo nuevo va en operaciones nuevas, DL-137 D-7):

| ID | Método y ruta | Quién | Qué hace |
|---|---|---|---|
| API-HAB-01 | `GET /me/habits` | La persona | Sus hábitos vigentes, su historia y el estado de la autorización, con quiénes los ven |
| API-HAB-02 | `POST /me/habits` | La persona | Una versión nueva de sus hábitos desde «Mis hábitos» (Idempotency-Key, la validación de V2) |
| API-HAB-03 | `PUT /me/habits/sharing` | La persona | Activar la autorización o cambiar con quiénes, con la versión que vio y el texto que acepta |
| API-HAB-04 | `POST /me/habits/sharing/withdrawal` | La persona | Retirarla, para todos a la vez |
| API-HAB-05 | `GET /advisees/{adviseeId}/habits` | El profesional | Los hábitos vigentes de la persona, si la autorización está activa y lo incluye y su vínculo está vigente. Si no, el 404 de lo inexistente |

  Las escrituras van con Idempotency-Key, auditoría y evento, como FRI. HAB-05 no depende del Alcance: la autorización es
  de la persona y por profesional. Pasa por el PDP para el vínculo vigente (ni en pausa ni terminado, 08 §14.1) y el A3 de
  la persona; cada lectura queda en la auditoría de acceso, que la persona ve (08 §19.7).

### 4.4 Qué ve cada profesional

- **Sin la autorización, o sin estar en la lista:** lo de su formulario, como hoy. HAB-05 le responde el 404 de lo
  inexistente: no se entera de que hay hábitos de otra área.
- **Con la autorización y en la lista:** la versión vigente de los hábitos, con su fecha y «Declarado por la persona». No
  ve de qué formulario salió ni el área del otro profesional: el origen se dice como «en un formulario» o «en Mis hábitos».
  Tampoco ve la historia: es de la persona.
- **En la web:** una tarjeta «Sus hábitos», en Información de la ficha, con «Compartido por la persona el 5/11». La Línea
  de tiempo no suma un hecho por cada cambio: los hábitos no son un hecho del área.

### 4.5 Qué pasa al retirarla

- El acceso se corta a futuro, para todos y en el momento: desde ahí HAB-05 responde 404 (RNF-PRI-002).
- No se borra nada: los hábitos son de la persona y siguen en su app; lo que cada profesional tiene de su propio
  formulario sigue siendo suyo, como hoy. Lo que un profesional ya vio no se puede «desver»: se dice en el texto del acto.
- Terminar o pausar un vínculo corta a ese profesional, aunque la autorización siga activa. Cerrar la cuenta la retira.

### 4.6 Compatibilidad y legal

- La APK 0.20 no llama API-HAB y no ve las versiones que traigan la parte «Tus hábitos» (formato 3, FR-08): nada cambia
  para ella.
- Lo legal va al legajo legal, fuera del repo público: el texto del acto; su base (el consentimiento expreso del titular
  para una categoría sensible hacia perfiles no sanitarios, VJR-1 y VJR-4 del 08, y el paso de información entre sus
  profesionales, VJR-5); la revocación y lo que se informa. En `test`, con datos sintéticos; con personas reales, después
  de esa revisión y del gate del 08 §42.

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
  0.18.0-candidata.1 (Dirección ya actualizó a la 0.20; nota en DL-152).

## 6. Fuera de esta ronda

- Programar la sección común de hábitos (FR-10): espera la revisión de su diseño.
- La tarjeta de las respuestas en el Resumen de la ficha: WP-TABLERO-ALTA-GAMA.
- La candidata 0.21.0-candidata.1 (FR-11): la construye y la publica Dirección.
- Cambiar las versiones ya publicadas: una versión no se toca (REG-06-209).
