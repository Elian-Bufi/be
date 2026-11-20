# WP-EVALUACION-Y-FORMULARIOS — vincular a la evaluación inicial los formularios que la persona ya respondió

> **Estado:** PROGRAMADO en la rama `wp-evaluacion-y-formularios`, desde `main` 24f91c1e (PR en borrador, sin integrar).
> Las decisiones de continuador EVF-D01 a EVF-D13 están **a ratificar**. DEUDA_LEGAJO **DL-185**: si al integrar el número
> choca con otro paquete, se renumera.
>
> **Encargo** (Dirección, 2026-11-19): «En la evaluación inicial: poder vincular los formularios que la persona ya
> respondió». Mañana Dirección prueba de punta a punta las planificaciones de los profesionales.
>
> **Datos:** solo sintéticos (la cohorte de #161 y lo que suman las capturas), en local, en la CI y en `test`.

## 0. Legajo y decisiones que cita

- **04:** RF-026 y RF-036 (la evaluación de Nutrición y la de Entrenamiento); RF-071 (solicitar y completar información
  profesional pertinente); RNF-SEC-006 (segregación por dominio) y RNF-PRI-001 (minimización).
- **05:** UC-P09 y UC-P14 (evaluación y objetivo); UC-P32 y UC-P33 (el profesional solicita, la persona completa).
- **06:** REG-06-97 (la evaluación es un hecho: no se sobrescribe); REG-06-209 (una versión de formulario nunca se elimina);
  06 §4.4 (historia por adición).
- **08:** §11 (cada profesional ve la porción de sus Alcances), §11-bis (pertinencia) y §19.7 (quién miró).
- **09:** v16.1 §22 (FRM) y las evaluaciones (API-NUT-01 a 03, API-TRN-01 a 03), **sin cambios de forma**. Las operaciones
  nuevas son la familia **API-EVF-01 a 04**, que el 09 no tiene y declara DL-185.
- **DL:** DL-048 (la evaluación como datos con su fuente); DL-057 (cada profesional ve y usa solo lo propio); DL-102 y
  DL-179 (la cita de una respuesta en la evaluación: por referencia, con la versión vigente, `expectedVersion` y el 422
  neutral); DL-137 D-7 (lo nuevo va en operaciones nuevas); DL-145 y DL-146 («Empezar el plan» y su paso «Evaluación
  inicial»); DL-152 (lo que lee la APK instalada no cambia); DL-164 y DL-165 (los formularios de inicio y «Tus hábitos»);
  DL-179 CTX-D09 (la conducta alimentaria, con cuidado) y CTX-D10 (solo los formularios propios).
- **La lección del 19/11:** «Citar» al fundamento del objetivo copiaba datos de salud a un texto que viaja con el plan que
  la persona comparte. Este paquete no copia ninguna respuesta a un campo que lea otra persona u otra área (EVF-D06).

## 1. Objetivo y demostrables

Que el profesional, al registrar la evaluación inicial de Nutrición o de Entrenamiento, vea los formularios que la persona
ya le respondió en esa área, con su nombre y su fecha, y los vincule a la evaluación; que después los pueda abrir, ver que
hay una versión más nueva si la persona corrigió, vincular la más nueva o desvincularlos. Sin copiar nada.

| Demostrable | Cómo se ve |
|---|---|
| Elegir al registrar | En «Empezar el plan» → «Registrar la evaluación» (y en «Nueva evaluación» de Resumen): «Formularios que respondió (opcional)», con cada formulario, su fecha, «Ver respuestas» y la casilla «Vincular». |
| Lo vinculado | Debajo de «Registrada el …» (y en la última evaluación de Resumen): «Formularios vinculados», con «Respondido el …», «vinculado el …», «Ver respuestas» y «Desvincular». «Vincular un formulario» suma otros. |
| La versión más nueva | Si la persona corrigió después: «La persona registró una versión más nueva el …. La evaluación conserva la que vinculaste.» y «Vincular la más nueva». «Ver respuestas» sigue mostrando la vinculada. |
| La persona | No ve nada nuevo: la APK no cambia y ninguna lectura suya trae los vínculos. |

## 2. Lo que no cambia

- Las operaciones de la evaluación (API-NUT-01 a 03, API-TRN-01 a 03) y sus formas; las citas por pregunta de DL-102 y
  DL-179 siguen como están (EVF-D13).
- La evaluación es un hecho que no se edita (REG-06-97): lo que se vincula vive en una tabla aparte.
- Las lecturas de los formularios (FRM, FRI, CTX) y quién ve qué: la regla de vincular es la misma con que hoy se leen.
- La APK y lo que lee (DL-152): no se toca.

## 3. Partes

| ID | Parte | Toca la API | Se acepta cuando |
|---|---|---|---|
| EVF-00 | Declaración | No | Este paquete y DL-185 están en el repo. |
| EVF-01 | Los datos | Sí (migración) | `vinculo_de_formulario_en_evaluacion`, escrita con `prisma migrate diff` más sus guardias: solo agrega. La base repite la pertenencia (la Solicitud del mismo profesional, del Alcance de la evaluación, de la misma persona), el «nace vigente», un solo vínculo vigente por respuesta, el «solo se desvincula, una vez» y el no borrar ni truncar. |
| EVF-02 | Las operaciones | Sí | API-EVF-01 a 04 (§4), con el PDP del Alcance de la evaluación en la misma transacción, idempotencia en las escrituras, el mismo 404 para lo ajeno, lo inexistente y lo no autorizado, y el 422 neutral para un formulario que no se puede vincular. |
| EVF-03 | El contrato | — | `contratos-evaluacion-y-formularios.ts` y `copy-evaluacion-y-formularios.ts` en el dominio, el cliente HTTP, el OpenAPI (`docs/api/openapi.json`) y la familia EVF en la guardia de trazabilidad. |
| EVF-04 | Elegir al registrar | No | En el formulario de la evaluación de Nutrición y de Entrenamiento (en «Empezar el plan» y en Resumen): los formularios del área que la persona respondió, de API-CTX-01, con su nombre, su fecha y «Ver respuestas»; al registrar, los elegidos se vinculan con la versión que se vio. |
| EVF-05 | En la evaluación registrada | No | En «Empezar el plan» (paso 1) y en Resumen: la lista, «Ver respuestas» (API-EVF-04), «Desvincular», «Vincular un formulario» y, si hay una más nueva, el aviso y «Vincular la más nueva». |
| EVF-06 | La privacidad | — | Vincular no escribe respuestas en ninguna parte; la evaluación se lee igual antes y después; la persona no ve nada nuevo. Una prueba de integración lo fija. |
| EVF-07 | Las pruebas | — | Dominio (TEST-EVF-001 a 004), unidad de la API (TEST-EVF-005 y 006), integración contra PostgreSQL (TEST-EVF-010 a 021), el contrato (TEST-CT con EVF-01 a 04) y el website (TEST-EVF-030 a 035). |
| EVF-08 | Las capturas | — | En la CI (`capturas-de-la-planificacion`, el trabajo «Evaluación y formularios»): Nutrición y Entrenamiento, en Claro y Azul noche, a 1920, 1440 y 1280. |

## 4. Las operaciones nuevas (familia API-EVF)

`{area}` es `nutrition` o `training`; cualquier otra cosa, el 404 de lo inexistente.

| ID | Método y ruta | Qué hace |
|---|---|---|
| API-EVF-01 | `GET /{area}/evaluations/{evaluationId}/linked-forms` | Los vinculados hoy, en el orden en que se vincularon: la referencia (respuesta, Solicitud, plantilla, versión vinculada y su fecha, cuándo se vinculó) y `laterVersion` si la persona registró una más nueva. Nunca las respuestas. |
| API-EVF-02 | `POST /{area}/evaluations/{evaluationId}/linked-forms` | Vincular uno o varios, cada uno con `expectedVersion` (la vista en API-CTX-01). Todos o ninguno. Ya vinculado en esa versión: queda igual (200). En una anterior: la nueva lo reemplaza (201). Versión cambiada: 409. Ajeno, de otra área o inexistente: el mismo 422. Hasta 20 por evaluación. |
| API-EVF-03 | `POST /{area}/evaluations/{evaluationId}/linked-forms/{linkId}/removal` | Desvincular: la fila queda con la fecha. Repetirlo responde 200 sin cambiar nada. |
| API-EVF-04 | `GET /{area}/evaluations/{evaluationId}/linked-forms/{linkId}` | Abrir uno vinculado: el vínculo y lo que respondió la persona **en la versión vinculada**, por sección y en palabras, con la forma de API-CTX-01. Uno desvinculado: 404. |

Quién: solo el autor de la evaluación, con el PDP del Alcance permitido (vínculo aceptado, ni en pausa ni terminado, B2 y
A3). Es la misma condición con que lee la evaluación, en el mismo orden (existe, PDP, autoría). Las lecturas consumen el
límite de consultas protegidas; las escrituras llevan `Idempotency-Key` y quedan en la auditoría con su recurso.

## 5. Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué | Alternativa |
|---|---|---|---|
| EVF-D01 | **Nutrición y Entrenamiento.** Antropometría queda afuera: no tiene un paso «Evaluación inicial» (su evaluación es la toma) ni formularios de inicio propios. | El pedido es la evaluación inicial; en Antropometría no hay un paso equivalente. | Sumar la toma, si Dirección quiere vincular formularios a una toma. |
| EVF-D02 | **Referencia, no copia.** Queda el id de la respuesta y la versión vigente al vincular (la original o la rectificación), con su fecha y la del vínculo. Ningún texto ni valor de una respuesta se escribe en la evaluación. | Lo pidió Dirección y es la regla de DL-102: la declaración de la persona no se vuelve observación del profesional. | — |
| EVF-D03 | **Qué se vincula: lo que él puede ver, de esa área.** Las respuestas a Solicitudes del mismo profesional, del Alcance de la evaluación, respondidas (no las pendientes ni las propuestas sin confirmar). Ni de otro profesional, ni de otra área del mismo profesional, ni los hábitos que la persona comparte (API-HBT-05: no son una respuesta a una Solicitud suya). | Es exactamente la regla con que hoy se leen (FRM-05, FRI-03, CTX-01) y se citan (DL-102). Si el vínculo cruzara áreas, abrirlo dependería de un permiso que no es el de la evaluación. | Cruzar áreas para quien lleva las dos, con su PDP: más complejo y sin pedido. |
| EVF-D04 | **Una versión más nueva se ubica, no se reemplaza sola.** La evaluación conserva la vinculada; la lista dice que hay una más nueva y cuándo, sin color de alerta; «Ver respuestas» muestra la vinculada; «Vincular la más nueva» la reemplaza y la anterior queda desvinculada en la base. | La evaluación se fundó en lo que había (como la cita). Que cambie sola reescribiría la historia. | Mostrar las dos versiones lado a lado (lo siguiente, si hace falta). |
| EVF-D05 | **Hasta 20 por evaluación**, como las citas. | El mismo tope de DL-102; una evaluación inicial no tiene más formularios. | — |
| EVF-D06 | **La persona no ve nada nuevo.** La APK no cambia; los vínculos no viajan al plan compartido, al resumen, a otras áreas ni a las plantillas; las lecturas de la persona no los traen. Abrir uno pasa por el PDP y queda registrado como cualquier lectura de su área. | La lección del 19/11 («Citar» copiaba datos de salud al fundamento que se comparte). | Mostrarle a la persona qué formularios usó su profesional: es una decisión de producto, con su texto. |
| EVF-D07 | **Se vincula también después.** Sobre una evaluación ya registrada se puede vincular, desvincular y vincular la más nueva. | La evaluación no cambia (REG-06-97); el vínculo es un dato aparte que se agrega y se retira. Si al registrar no estaba el formulario, se suma cuando la persona responda. | Solo al registrar (más rígido). |
| EVF-D08 | **Al registrar con elegidos: dos pedidos.** Primero la evaluación (API-NUT-01 o TRN-01, sin cambios) y después los vínculos (API-EVF-02, todos o ninguno). Si el segundo falla, la evaluación queda registrada y el paso lo avisa: se vinculan desde la evaluación registrada. | No duplicar ni cambiar las operaciones de la evaluación («lo nuevo va en operaciones nuevas»). | Una operación «registrar con vínculos», atómica, nueva: duplica la validación de la evaluación. |
| EVF-D09 | **Desvincular no borra.** La fila queda con la fecha (historia por adición, 06 §4.4); uno desvinculado no se abre (404) y volver a vincular es una fila nueva. | Saber qué se usó y cuándo sirve después (auditoría, una revisión). | Borrar (pierde la historia). |
| EVF-D10 | **Los errores:** el 422 es el de la evaluación del área (`NUTRITION_EVALUATION_INVALID`, `TRAINING_EVALUATION_INVALID`) con el issue `FORM_RESPONSE_LINK_INVALID`, neutral; el 409 es `VERSION_CONFLICT` con `FORM_RESPONSE_VERSION_CHANGED`; la ruta lleva `{area}`. | Los mismos códigos que la cita; una sola familia para las dos áreas. | Un código propio (`EVALUATION_FORM_LINK_INVALID`): un enum más sin ganancia. |
| EVF-D11 | **Sin un hecho propio en la línea de tiempo.** Queda la auditoría (operación y recurso) y la decisión del PDP. | Un tipo de evento nuevo exige un enum y su migración; no se pidió verlo en la línea de tiempo. | Sumarlo a la línea de tiempo de la ficha (DL-127) si Dirección quiere verlo. |
| EVF-D12 | **Dónde se ve.** En «Empezar el plan», dentro del paso 1, al registrar y debajo de «Registrada el …»; en Resumen, al registrar una evaluación nueva, en la última evaluación de Nutrición y en cada evaluación de Entrenamiento. | Es donde el profesional mira la evaluación hoy; no hace falta una pantalla nueva. | — |
| EVF-D13 | **Vincular no reemplaza a citar.** «Citar» sigue sirviendo para traer una respuesta puntual como dato de la evaluación; vincular trae el formulario entero, como referencia. | Son dos usos: la pregunta que fundó un dato y el formulario que se consultó. | Unificarlos (cambia DL-102 y DL-179). |

## 6. Oráculos

- **Dominio** (`packages/domain/src/contratos-evaluacion-y-formularios.test.ts`): TEST-EVF-001 (vincular pide la versión
  vista, de 1 a 20, y nada más), 002 (un vínculo no trae respuestas), 003 (las dos áreas y su Alcance), 004 (los textos sin
  el vocabulario prohibido ni calificaciones).
- **Unidad de la API** (`apps/api/src/evaluacion-y-formularios/evaluacion-y-formularios.spec.ts`): TEST-EVF-005 (la versión
  vigente de una respuesta) y 006 (la vinculada y la más nueva).
- **Integración** (`test/integration/evaluacion-y-formularios.int-spec.ts`): TEST-EVF-010 (vincular y abrir, en las dos
  áreas), 011 (idempotencia), 012 (la más nueva: aviso, 409 sin escribir, reemplazo), 013 (desvincular), 014 (de otra
  evaluación o área: 404), 015 (otro profesional, con o sin vínculo, y la persona: 404 idéntico en las cuatro), 016 (B2
  revocado, pausa y Administración), 017 (ajeno, otra área, inexistente: 422 idéntico, todos o ninguno), 018 (la
  privacidad: la evaluación igual, la persona sin nada nuevo, la fila sin respuestas), 019 (el tope de 20), 020 y 021 (la
  base).
- **Contrato** (`test/integration/contrato.int-spec.ts`): EVF-01 a 04 con sus éxitos y errores declarados.
- **Website** (`apps/web/test/evaluacion-y-formularios.test.mjs`): TEST-EVF-030 a 035 (qué se ofrece para vincular, el
  aviso de la más nueva, la selección, lo que dice la pantalla y que no se guarda nada de la persona en el navegador).

## 7. Fuera de alcance

- Antropometría (EVF-D01).
- Mostrarle a la persona qué formularios se vincularon (EVF-D06).
- Vincular formularios de la historia anterior o de otro profesional (EVF-D03).
- Comparar dos versiones de un formulario lado a lado (EVF-D04).
- El hecho en la línea de tiempo (EVF-D11).
