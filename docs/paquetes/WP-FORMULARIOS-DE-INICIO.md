# WP-FORMULARIOS-DE-INICIO — los formularios de inicio de Nutrición y Entrenamiento

> **Estado:** RATIFICADO por Dirección el 2026-11-04 («ratifico y integraremos lo antes posible»), con las partes FI-00 a
> FI-09 y DL-164. Rama `wp-formularios-de-inicio`, desde `main` 8883e88.
>
> **Encargo** (Dirección, 2026-11-04):
> - «Arma tú los formularios [...] cosas que no pueden faltar [...] alimentos que sí, alimentos que no, comidas que come
>   habitualmente en su semana; las que son saludables o que se puede redosificar la porción las utilizaremos».
> - «Además de estar en la aplicación debería tener la opción el profesional de cargarlo desde el computador de escritorio
>   en caso de que se lo haga el profesional y luego el asesorado desde la app acepte que se carguen esos datos asociados a
>   su perfil».
> - «Las partes legales a resolver déjalas en un legajo para que las revise un profesional de la ley. Pero sigamos con la
>   producción».
> - «Si puedes mejorar las preguntas o agregar si ves necesario para los profesionales también».
>
> **Decisiones:** DEUDA_LEGAJO DL-164, de D-1 a D-9. **Datos:** solo sintéticos (la cohorte), en local y en test.

## 0. Legajo y decisiones que cita

- **04:** RF-071 (solicitar y completar información profesional pertinente).
- **05:** UC-P32 (el profesional solicita información estructurada) y UC-P33 (la persona completa lo solicitado).
- **06:** CAP-DAT; T-06-75, T-06-76 y T-06-77; REG-06-209 (la versión nunca se elimina), REG-06-210 (dos estados, sin
  retorno), REG-06-211, REG-06-212 (requerido ⊆ solicitado) y REG-06-213 (`respondable` es una proyección del PDP).
- **08:** §11-bis (categorías de dato, adaptada a P0). El paso a datos reales sigue detrás del gate del 08 (§42).
- **09:** v16.1 §22, API-FRM-01 a 08, **sin cambios de forma**. Las operaciones nuevas son la familia API-FRI-01 a 08, que
  el 09 no tiene y declara DL-164 (D-5).
- **11A:** TEST-FRM-001 a 007 siguen verdes; los oráculos nuevos son TEST-FRI-001 a 006 (§6).
- **DL:** DL-164; DL-152 (lo que lee la APK instalada no cambia); DL-137 D-7 (lo nuevo va en operaciones nuevas);
  DL-100 y DL-101 (contexto de entrenamiento y límites numéricos); DL-104 (un issue por campo); DL-109 («Mis habituales»);
  DL-040 (la referencia neutral).

## 1. Objetivo y demostrables

Que el profesional arranque la planificación con un formulario de inicio profesional, que la persona responda tocando y no
escribiendo, y que, cuando la entrevista es en el consultorio, el profesional lo cargue desde el escritorio y la persona lo
confirme en su app, con la procedencia escrita.

| Demostrable | Cómo se ve |
|---|---|
| Las dos plantillas | «Cómo comés hoy» (FRM-NUTRICION-INICIO v1) y «Antes de entrenar» (FRM-ENTRENAMIENTO v2) en «Pedir información». |
| Responder tocando | En la APK nueva: una opción, varias opciones, lista que se repite, tabla, alimentos y horarios, con las preguntas condicionales. |
| Cargar con la persona | En la ficha, «Cargar con la persona» abre el formulario completo; al enviar queda «Esperando que lo confirme». |
| Confirmar | En la APK, «Revisá lo que cargó Sofía»: corregir, «Confirmo que son mis datos» o «No es correcto». |
| La procedencia | La respuesta confirmada dice «Cargado por Sofía Paz el 4 nov · confirmado por la persona el 5 nov» y cuántas respuestas corrigió. |
| Las comidas habituales | Para cada comida que contó la persona: tal cual, ajustar la porción, mejorar o cambiar, y «Pasar a Mis habituales». |
| Nada se rompe | Las APK 0.13.2, 0.17.0-candidata.3 y 0.18.0-candidata.1 siguen leyendo lo que leían (DL-152). |

## 2. Lo que no cambia

- Las ocho operaciones FRM y sus formas (`contratos-formularios.ts`). Para una versión que usa tipos nuevos, FRM-06 no la
  lista y FRM-02, 05, 07 y 08 responden el mismo 404 que a lo inexistente: la APK instalada nunca la ve (D-5).
- La Solicitud tiene dos estados, `PENDING → RESPONDED` (REG-06-210). La propuesta no es un estado (D-3).
- La respuesta es siempre `SELF_REPORTED` (09 §22.7): lo que carga el profesional es una transcripción que la persona
  confirma (D-4).
- La autorización: Vínculo, Alcance, B2 y el PDP en cada operación; A3 para la persona.
- El catálogo es de solo agregar y sintético de demostración (D-D de WP-07).

## 3. Partes

| ID | Parte | Toca la API | Se acepta cuando |
|---|---|---|---|
| FI-00 | Declaración y línea de base | No | Este paquete y DL-164 están en el repo antes del código. |
| FI-01 | Seis tipos nuevos y preguntas condicionales | No | `contratos-formularios-v2.ts`, `formularios-v2.ts` y `copy-formularios-v2.ts` en el dominio, con sus pruebas: cada tipo rechaza lo que no corresponde, lo oculto por una condición no se guarda y el obligatorio oculto no se exige. |
| FI-02 | Las dos plantillas en el catálogo | Sí (migración) | FRM-NUTRICION-INICIO v1 y FRM-ENTRENAMIENTO v2 por migración que solo agrega; reutilizan los campos que ya existen; `be_solo_agregar` sigue pasando; una prueba del dominio valida su contenido contra el contrato V2. |
| FI-03 | Las APK instaladas no se rompen | Sí | Las solicitudes con tipos nuevos no aparecen en FRM-06 y FRM-02, 05, 07 y 08 responden 404 para ellas. `lecturas-de-las-apk.int-spec.ts` sigue verde. |
| FI-04 | La persona responde en la APK, tocando | No | Los nueve tipos en la APK, con condicionales, el borrador que no se pierde, los dos temas y su texto para TalkBack. |
| FI-05 | El profesional lo carga desde el escritorio | Sí | En la ficha, «Cargar con la persona» abre el formulario completo y «Enviar para que lo confirme» lo guarda (API-FRI-06). Se puede corregir mientras espera y retirar (API-FRI-07). |
| FI-06 | La persona confirma lo cargado | Sí | En la APK, la novedad y «Revisá lo que cargó…»: corregir, confirmar (API-FRI-04 con `fromProposal`) o rechazar (API-FRI-08). Sin confirmar no queda en su perfil ni lo ve otro profesional; si lo rechaza, se borra. |
| FI-07 | Las comidas habituales, para decidir | No | En la respuesta de «Cómo comés hoy», las cuatro decisiones por comida y «Pasar a Mis habituales» (DL-109). Nada viene elegido. |
| FI-08 | Pruebas de punta a punta y evidencia | — | El recorrido con la cohorte en local; la candidata de la APK en test; `EVIDENCIA/FORMULARIOS-DE-INICIO/`. |
| FI-09 | El legajo legal para el abogado | — | Fuera del repo público: las preguntas concretas para un abogado, con los textos a validar (D-8). |

## 4. Las operaciones nuevas (familia API-FRI, DL-164 D-5)

Sirven para cualquier Solicitud, de P0 o con tipos nuevos: el website y la APK nueva usan solo estas. Las de FRM quedan
para las APK instaladas.

| ID | Método y ruta | Quién | Qué hace |
|---|---|---|---|
| API-FRI-01 | `GET /form-templates/{templateId}/versions/{versionId}/definition` | Sesión | La estructura de cualquier versión en formato V2 (`VersionDePlantillaV2Schema`). Las de P0 se traducen (`campoV1AV2`). |
| API-FRI-02 | `GET /me/form-inbox` | La persona | Todas sus solicitudes, con `usesNewTypes`, `estimatedMinutes` y la propuesta que espera confirmación. |
| API-FRI-03 | `GET /form-requests/{formRequestId}/view` | Los dos actores | El detalle V2: la respuesta con su transcripción, la propuesta (para quien la cargó y para la persona) y el desenlace de la última no confirmada (solo para quien la cargó). Mismas negaciones que FRM-05. |
| API-FRI-04 | `POST /me/form-requests/{formRequestId}/answers` | La persona | Responder, sola o confirmando la propuesta (`fromProposal`, con su versión). Valida con `validarRespuestasV2`; guarda en el formato de la versión; con propuesta, escribe la transcripción y los campos corregidos. |
| API-FRI-05 | `POST /me/form-responses/{formResponseId}/corrections` | La persona | Rectificar una respuesta propia (V2); la original no se toca. |
| API-FRI-06 | `PUT /form-requests/{formRequestId}/proposal` | El profesional de la Solicitud | Cargar o reemplazar la propuesta mientras la Solicitud está pendiente. Mismo PDP que FRM-03 y la misma validación de respuestas. |
| API-FRI-07 | `POST /form-requests/{formRequestId}/proposal/withdrawal` | El profesional de la Solicitud | Retirar la propuesta: sus respuestas se borran (D-6). |
| API-FRI-08 | `POST /me/form-requests/{formRequestId}/proposal/rejection` | La persona | «No es correcto»: las respuestas propuestas se borran y la Solicitud sigue pendiente. |

Las escrituras van con `Idempotency-Key`, auditoría, decisión del PDP y evento de formulario, como las de FRM. Los
errores son los de la familia FRM más `VERSION_CONFLICT` (la propuesta cambió desde que se vio) y `RESOURCE_NOT_FOUND`
idéntico para lo ajeno.

## 5. Los datos

- `version_de_plantilla_de_formulario.contenido` de una versión V2: `{ "format": 2, "estimatedMinutes": n, "sections": [...] }`
  con los campos de `CampoDePlantillaV2Schema`. Las de P0 no cambian.
- Tabla nueva `propuesta_de_respuesta_de_formulario`: la Solicitud, el profesional, las respuestas (que se borran al
  rechazar o retirar), el estado (`PENDIENTE`, `CONFIRMADA`, `RECHAZADA`, `RETIRADA`), la versión, cuándo se cargó y
  cuándo terminó. Una sola pendiente por Solicitud.
- `respuesta_de_formulario.transcripcion` (nueva, nula): quién cargó, cuándo, cuándo confirmó la persona y qué corrigió.
- Los eventos nuevos de formulario y la novedad para la persona, cada enum nuevo en su migración propia.

## 6. Oráculos nuevos (11A, a escribir como los de `WP-07-ORACULOS.md`)

- **TEST-FRI-001 · Las APK instaladas no ven lo nuevo.** Una Solicitud de FRM-NUTRICION-INICIO no aparece en FRM-06, y
  FRM-02, 05 y 07 responden 404 idéntico al de lo inexistente.
- **TEST-FRI-002 · Lo oculto no se guarda.** Una respuesta a una pregunta condicional cerrada da `422 FORM_RESPONSE_INVALID`
  con `FORM_ANSWER_NOT_VISIBLE`; el obligatorio oculto no se exige.
- **TEST-FRI-003 · La propuesta no es del perfil.** Mientras espera, otro profesional con acceso no la ve (FRI-03 sin
  `proposal`), y nada de ella aparece en las lecturas de la persona salvo en su bandeja.
- **TEST-FRI-004 · Confirmar es responder.** La persona confirma con una corrección: la Solicitud pasa a `RESPONDED`, la
  respuesta es `SELF_REPORTED`, la transcripción dice quién cargó y el campo corregido.
- **TEST-FRI-005 · Rechazar y retirar borran.** Después de rechazar o retirar no queda ninguna respuesta propuesta en la base;
  la Solicitud sigue pendiente.
- **TEST-FRI-006 · Solo el profesional de la Solicitud carga.** Otro profesional, uno sin vínculo vigente o con B2 revocado
  recibe el mismo 404; con la versión vieja, `409 VERSION_CONFLICT`.

## 7. Fuera de alcance

- Otras plantillas y cambiar las de P0.
- Registrar otro deporte en la APK (idea guardada; acá entra solo la pregunta del formulario).
- Guardar las cuatro decisiones de las comidas: son una ayuda de pantalla; lo que queda es el habitual (D-9).
- Datos reales: solo después del legajo legal y del gate del 08.
