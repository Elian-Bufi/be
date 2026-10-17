# WP-NOTAS-DE-COORDINACION — La nota de coordinación entre los profesionales de una persona · definición del paquete

> **Lo que aprobó Dirección el 2026-10-16:** hacerla «con todas las opciones recomendadas» de la propuesta
> (`docs/propuestas/NOTAS-DE-COORDINACION_ficha.md`): CRD-D1 a CRD-D8, la opción A o la recomendada en cada una.
>
> **Legajo:**
> - **04 RF-057** (P0, núcleo que no se recorta): documentar contexto de coordinación sin transferir responsabilidad ni facultades entre especialidades.
> - **05 UC-E07** (§11.8), extensión de UC-P24: coordinar no es prescribir, ni modificar, ni decidir sobre otra área, ni transferir responsabilidad; no hay chat general.
> - **06 T-06-43** (M-11): autor, destinatario, alcance y pertinencia.
> - **08:** §9.15 y 08:495 (sin notas secretas sobre el titular), §11-bis.3 (el texto libre, sin resúmenes automáticos), Q-005 y §14 (en pausa o terminado, sin lectura profesional), §52 VJR-5.
> - **09 §11.6:** API-CRD-01 `POST /api/v1/advisees/{adviseeId}/coordination-notes`; la lectura del profesional es la línea de tiempo.
> - **11A:** TEST-RF-057 y TEST-UC-E07.
>
> **Decisiones:** DEUDA_LEGAJO DL-140 (D-1 a D-8 aprobadas; E-1 a E-11, del ejecutor, a ratificar).

## 1. Qué cambia para cada uno

**El profesional que escribe**, en la ficha de la persona:
- «Nota de coordinación», al lado de «Solicitar contexto», abre el diálogo. También lo abre «Notas recientes del equipo», en el Resumen.
- Arriba, siempre, **lo que una nota no hace:** no prescribe, no modifica planes ni objetivos de otra área, no decide sobre otra área y no transfiere responsabilidad.
- **Para:** «Todos los profesionales que acompañan a <persona>», con sus nombres y sus áreas de hoy, o uno en particular.
- **Desde tu área:** si acompaña a la persona en dos áreas, elige una; con una, se dice cuál.
- **Para qué:** «Contexto para tu área», «Cambio en mi área que conviene que sepas» o «Pedido de coordinación». No viene elegida.
- **La nota:** hasta 600 caracteres, con «Escribí solo lo que el otro profesional necesita para su trabajo» y la cuenta de caracteres.
- **Citar algo de tu área** (optativo): hasta tres de sus planes activados, revisiones o tomas en esa área, del último año.
- Junto al botón, **«La persona también la lee, en su app»**. Es texto, sin adjuntos, y BE no lo resume ni lo interpreta.
- Una nota propia no se edita ni se borra: en su detalle, en la Línea de tiempo, está **«Corregir con otra nota»**, que la cita.

**Los otros profesionales que la reciben:**
- una novedad: «Lic. Sofía Paz dejó una nota de coordinación sobre Diego Sosa». El aviso del teléfono dice solo «Tenés una novedad.»;
- la nota, como un hito de la **Línea de tiempo** de la ficha: quién, para qué y cuándo; al abrirla, desde qué área, para quién, el texto y lo que cita;
- las tres últimas en el **Resumen**, en «Notas recientes del equipo», con el texto que se abre en el lugar y el camino a todas en la Línea de tiempo;
- lo citado, por su rótulo («Plan de Nutrición, versión 3, activada el 10/10/2026»): nombrarlo no lo abre.

**La persona**, en la APK: **«Notas entre tus profesionales»**, desde Cuenta y desde Vínculos. Todas las notas sobre ella, completas: quién la escribió, desde qué área, para qué, para quién, cuándo, el texto, lo que cita y si una corrige a otra. Siguen ahí con el vínculo en pausa o terminado; sin el A3 vigente, la pantalla dice por qué no las muestra.

## 2. El modelo (DL-140)

| Pieza | Qué es |
|---|---|
| `nota_de_coordinacion` | Autor, persona, área de origen, finalidad, modo de destinatarios (TODOS o UNO), texto (1 a 600 caracteres), la nota que corrige, procedencia y los dos instantes. Solo se agrega |
| `destinatario_de_nota` | Los profesionales concretos que la recibieron, guardados al escribirla. Nunca el autor ni la persona; con UNO, uno solo. Solo se agrega |
| `referencia_de_nota` | Lo citado, hasta tres, por tipo e identificador: del autor con esa persona, de su área de origen y registrado. Solo se agrega |
| La novedad | `NOTA_DE_COORDINACION_RECIBIDA`, una por destinatario, en la misma transacción. Nombra la nota; el texto de la novedad lo arma BE al leer, sin el de la nota |

Toda nota tiene a quién llegar: la base no confirma una sin destinatarios. Una nota que solo vea su autor sería una nota privada, y no entra (§4).

## 3. El contrato

- **API-CRD-01** `POST /api/v1/advisees/{adviseeId}/coordination-notes`, con Idempotency-Key: exactamente la del 09.
- **API-CRD-01-LISTA** `GET /api/v1/advisees/{adviseeId}/coordination-notes/recipients`: desde qué área puede escribir el profesional y a quién (los otros profesionales que hoy acompañan a la persona). No trae notas.
- **API-CRD-01-PROPIA** `GET /api/v1/me/coordination-notes`: las notas sobre la persona.
- **API-DSH-04** (y su búsqueda): las notas que el profesional escribió o recibió, como entradas `COORDINATION_NOTE_RECORDED`. Es la lectura del profesional que fija el 09 §11.6: no hay otra.
- **API-NOV-01 y 02:** la novedad `COORDINATION_NOTE_RECEIVED`, que abre la ficha de la persona.

Ninguna respuesta que lee la APK instalada cambia de forma (la prueba C01). Las formas y los errores están en DL-140.

## 4. Quién la lee, y cuándo

| | Vínculo aceptado y B2 vigente | En pausa, B2 revocado o terminado |
|---|---|---|
| **El autor** | La lee en la línea de tiempo y la puede corregir | No la lee ni escribe (08 Q-005) |
| **Un destinatario** | La lee en la línea de tiempo, con su novedad | No la lee; si vuelve el acceso, la vuelve a ver |
| **Otro profesional de la persona** que no la recibió | No la ve | No la ve |
| **Un profesional que se suma después** | No ve las anteriores: los destinatarios quedaron guardados | — |
| **La persona** | Todas, en la APK | Todas (08 §14.3); sin el A3 vigente, ninguna (08:406) |

«Acompaña hoy» lo decide el PDP: algún alcance permitido para ese profesional con esa persona.

## 5. Lo que no entra

- Un chat, respuestas en hilo o mensajes entre la persona y el profesional (UC-E07: «no existe chat general»).
- Notas privadas del profesional sobre la persona (serían «notas secretas», 08 §9.15), ni el borrador solo del autor de UC-E07 V05.
- Resúmenes o interpretaciones automáticas del texto (08 §11-bis.3), y adjuntos.
- Abrir lo citado desde la nota: se nombra. Cada uno lo abre, si puede, desde su área.
- Una novedad para la persona por una nota sobre ella (DL-140, E-6).

## 6. Las decisiones (DL-140), con sus alternativas

**Aprobadas por Dirección:**
- **D-1 · Todos o uno, solo los que hoy la acompañan,** guardados al escribirla. *Descartadas:* siempre todos; por alcance, que se rompe con dos áreas.
- **D-2 · La persona la lee.** *Descartada:* solo por la exportación.
- **D-3 · Texto libre de 600 caracteres,** con el aviso, sin adjuntos ni resúmenes. *Descartada:* solo plantillas cerradas.
- **D-4 · Finalidad de una lista cerrada; el área de origen es la del autor.**
- **D-5 · Lo citado, solo del área del autor; nombrarlo no da acceso.**
- **D-6 · Una novedad por destinatario; el aviso, genérico.**
- **D-7 · Solo se agrega; para corregir, otra nota que la cita.**
- **D-8 · En la Línea de tiempo, en el Resumen y en la APK.**

**Del ejecutor, a ratificar** (detalle en DL-140): la lectura en la línea de tiempo sin un GET propio (E-1); la nota con el área de origen aunque quien la recibe no la tenga (E-2); «acompaña hoy» según el PDP, más estricto que la letra (E-3); el 422 cuando no tiene a quién llegar (E-4); los bloqueos (E-5); sin novedad para la persona (E-6); la corrección que no se puede leer, sin fecha (E-7); la finalidad sin elegir de entrada (E-8); lo citado que no se abre desde la nota (E-9); la nota como el hecho (E-10); y la sesión sin MFA (E-11).

## 7. Pruebas

- **Dominio** (`notas-de-coordinacion.test.ts`): el contrato (600 caracteres, recorte, finalidades, destinatarios, hasta tres referencias sin repetir, sin campos de más), el copy contra todas las listas de términos prohibidos, los cuatro límites y los dos avisos, los rótulos, la novedad sin el texto, el aviso genérico, el hito y el OpenAPI.
- **Integración** (`notas-de-coordinacion.int-spec.ts`, contra PostgreSQL y un Expo Push falso): TEST-RF-057 y TEST-UC-E07, en DL-140. Más `contrato.int-spec.ts` (las tres operaciones) y `schema.int-spec.ts` (TRUNCATE).
- **Website y APK:** el renglón de la nota (`hecho-en-un-renglon.test.mjs`), la pantalla y su navegación (`historial-navegacion.test.mjs`) y las palabras de las pantallas (`copy-pantallas.test.cjs`).

## 8. Estado (2026-10-17)

- **Dominio, API, website y APK:** hechos en `wp-notas-de-coordinacion`, sin integrar, con sus pruebas.
- **Falta:** construir la APK y probarla en el teléfono; las capturas del website; que Dirección ratifique E-1 a E-11; y, antes de datos reales, VJR-5 y el texto que la acompaña.
