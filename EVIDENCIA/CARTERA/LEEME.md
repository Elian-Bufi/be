# Evidencia · Cartera del profesional: «Pendientes» (API-DSH-04, PF-07, DL-107)

Decisión de Elián del 2026-09-30 sobre la ficha `docs/propuestas/PF-07_vista-de-cartera.md`, registrada como DL-107. Rama `feat/cartera-profesional`, sobre `main` (`53cc70e`). Para auditoría, **sin integrar, sin desplegar y sin APK**.

## Qué puede hacer el profesional

En el espacio profesional, arriba de «Tus asesorados», ve **Pendientes**: una fila por asesorado y dominio donde hay algo objetivo que hacer, con la fecha que lo origina:

| Pendiente | De dónde sale | «Abrir» lleva a |
|---|---|---|
| Revisión vencida hace N días · Revisión en N días (hasta 7) · Revisión pendiente desde el … | La expectativa de revisión vigente del Proceso abierto (REG-06-145/150), clasificada por fechas civiles | Revisiones |
| Plan en borrador desde el … | Una versión BORRADOR posterior a la última activada (o sin ninguna) | Plan |
| Sin plan activo | Vínculo aceptado sin Proceso abierto y sin borrador | Plan |
| Formulario sin responder desde el … | Solicitud de este profesional sin respuesta | Formularios → Solicitudes |
| Evaluación en preparación desde el … | Evaluación antropométrica en preparación de este profesional | Antropometría → En preparación |

Cada fila trae la **última actividad registrada** del asesorado en ese dominio dentro del período, o «Sin registros en el período». Es un dato: **no** hay filas por «sin registros», ni colores, ni «inactivo» (DL-107 D-3). Filtros por dominio y tipo; el período acota solo la actividad. Un dominio que el profesional no puede ver no aparece ni se explica (B10-08 §8.4); si alguno quedó fuera, un aviso único.

## Cómo está hecho

- `packages/domain/src/cartera.ts`: clasificación de la revisión (vencida / próxima / sin fecha / todavía no), orden por urgencia objetiva con empates por antigüedad, copy con un control de términos que califiquen (los de los tres dominios más «inactivo», «riesgo», «alerta», «ranking», «racha»).
- `packages/domain/src/fechas-civiles.ts`: fecha civil por zona, días de calendario, inicio del día y validez de una fecha. Compartible con la evolución antropométrica (#116) cuando se integre.
- `apps/api/src/cartera/`: `GET /me/portfolio`. Recorre los vínculos con alcance ACEPTADO del profesional; el PDP decide y **registra** por asesorado y alcance (como API-DSH-03); todos los hechos se leen en **una** transacción; paginación por cursor sobre la lista ordenada; tope de 200 asesorados por lectura. Sin tablas nuevas.
- `apps/web/src/app/pro/pendientes.tsx`: la sección, con los mismos componentes de lista, período y avisos que el resto del website.

## Pruebas

| Prueba | Resultado |
|---|---|
| Unitarias del dominio (`cartera.test.ts`, `fechas-civiles.test.ts`): clasificación por fechas civiles con cambio de mes y de año y ventana parametrizable; orden y estabilidad; copy sin términos prohibidos y detección de los propios; fechas civiles por zona | 353/353 |
| Integración `cartera.int-spec.ts` (PostgreSQL 16 local, por los flujos reales de la API): vencida, borrador y sin plan con su orden y su actividad; próxima dentro y fuera de la ventana; formulario sin responder; evaluación en preparación; A3 revocado → desaparece y `partialView`; otro profesional y un asesorado no ven nada; 401; query inválida; filtros, período y paginación | **6/6** |
| Unitarias de la API | 47/47 |
| Recorrido web local, escritorio 1280 px (`recorrido.mjs`, contra la base que dejó la prueba de integración: profesional de nutrición con tres asesorados y profesional de entrenamiento con dos) | **12/12** |
| Recorrido web local, móvil 390 px | **11/12** (ver límites) |
| Typecheck API y web · OpenAPI regenerado y verificado · legajo íntegro | ✅ |

### Recorrido web local

| Control | Escritorio | Móvil |
|---|---|---|
| «Pendientes» es la primera sección, con su subtítulo | ✅ | ✅ |
| Tres filas en orden de urgencia: revisión vencida, plan en borrador, sin plan activo | ✅ | ✅ |
| La vencida dice hace cuántos días y su último registro; las otras «Sin registros en el período» | ✅ | ✅ |
| «Abrir» apunta a la vista que resuelve (revisiones / plan / plan) | ✅ | ✅ |
| Sin «inactivo», «riesgo», «cumplimiento» ni «adherencia» | ✅ | ✅ |
| Filtrar por tipo «Plan en borrador» deja una fila | ✅ | ✅ |
| Filtrar por dominio «Entrenamiento» muestra el vacío honesto | ✅ | ✅ |
| Período pasado sin actividad: la vencida sigue, su actividad pasa a «Sin registros en el período» | ✅ | ⚠️ no ejecutable por la automatización (el input de fecha bajo emulación táctil no tomó el teclado) |
| «Abrir» lleva a Nutrición → Revisiones del asesorado | ✅ | ✅ |
| Sin desplazamiento horizontal de la página | ✅ | ✅ |
| Entrenamiento: «Revisión en 3 días» y «Formulario sin responder», con «Abrir» hacia revisiones y solicitudes | ✅ | ✅ |
| Sin errores de consola ni de página | ✅ | ✅ |

Capturas: `01-pendientes.png` (nutrición: vencida, borrador, sin plan), `02-vacio.png` (filtro sin resultados), `03-entrenamiento.png` (próxima y formulario), `04-periodo-sin-actividad.png`, `movil-01-pendientes.png`.

## Límites

- «Hoy» es la fecha civil en la zona por defecto de BE (Buenos Aires); la respuesta la informa. Una zona por profesional queda para después.
- Con carteras muy grandes, la lectura por asesorado (decisiones registradas una por alcance) pide la estrategia de la ficha (§f.2); tope de 200 por lectura.
- Dos pendientes del mismo tipo en un dominio (dos solicitudes sin responder) se muestran como uno, el más antiguo.
- El período en móvil no se pudo ejecutar por la automatización; el comportamiento no depende del ancho, pero queda para la prueba manual.
- Teclado en PC verificado por automatización, no por Dirección. No validado por Dirección, no desplegado.
