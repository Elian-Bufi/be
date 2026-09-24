# Tramo de consolidación — definición

> **Estado:** **CERRADO** el 2026-09-24 en `main` (PRs #66 a #70 y el de cierre), con la defensa en `DEFENSA/CONSOLIDACION.md` y la evidencia en `EVIDENCIA/CONSOLIDACION/`. Abierto el 2026-09-22. Autorizado por Dirección el 2026-09-22 al elegir «consolidar y pulir» para los nueve días que quedan hasta la entrega del 2026-10-01, en lugar de abrir WP-08/09/10. Esta definición queda registrada en `main` antes del primer commit de código, como exige la regla de trabajo del proyecto.
> **Qué es y qué no es.** No es un paquete nuevo de dominio: no agrega ninguna familia contractual del inventario P0 (09:2654-2668) ni ningún RF que no estuviera ya autorizado en un paquete cerrado. Es el cierre de tres cosas que los paquetes anteriores dejaron declaradas como deuda y que se defienden mal si quedan abiertas: **DL-091**, **DL-089** y la **condición de cierre de DL-031** (el dashboard sin contenido).
> **Fuera de este tramo, con fundamento:** WP-08 (zonas musculares, wger, material didáctico), WP-09 (verificación profesional real y administración, DL-036), el resto de WP-10 (cartera, timeline, TVCC-30), Open Food Facts, RF-051, RF-061, RF-062, RF-003/004/005. La razón está en `docs/DEUDA_LEGAJO.md` y en la nota de MESA de WP-07: una deuda declarada con su fundamento se defiende; un dashboard vacío o un producto que se comporta distinto según la pestaña, no.

---

## 1. OBJECTIVE

Que el producto que ya existe se comporte **igual en sus tres dominios** y que el dashboard del profesional **muestre algo de cada uno**, sin inventar nada que el legajo no pida y sin abrir superficie nueva.

Tres tramos, cada uno con su PR (o sus PRs) y su verificación:

| Tramo | Deuda | Qué cambia |
|---|---|---|
| **A. Patrones de pantalla** | DL-091 | Nutrición y antropometría (web y APK) adoptan los cuatro patrones que el cierre de WP-06 corrigió en entrenamiento |
| **B. Historia propia del asesorado** | DL-089 | Las lecturas del historial registrado del titular en entrenamiento exigen solo el A3, como en los otros dos dominios |
| **C. Contenido del dashboard** | DL-031 (condición de cierre) | API-DSH-03 devuelve un resumen factual por dominio en vez de `summary: null` siempre |

## 2. Tramo A — los cuatro patrones (DL-091)

**Fuentes.** B10-06:1145-1148 (una escritura denegada limpia el contenido en la interacción siguiente); B10-10:36 y 164-165 (el error se asocia a su campo, `aria-invalid` y texto, no solo color); B10-10:376 (un error de lectura ofrece la alternativa segura, no un reintento que repite lo mismo); B10-06 §41-§44 (el período se elige).

**Qué se hace, en cada dominio y en cada superficie:**

1. **Escritura denegada → contenido retirado.** El contexto de la pestaña gana `accesoRetirado(r)` como en `training/entrenamiento.tsx`; cada escritura lo consulta y, si recibe el 404 no revelador, la pestaña entera pasa a «no disponible». En la APK, la pantalla del asesorado hace lo propio con la lectura siguiente.
2. **Período elegible.** El filtro `FiltroDePeriodo` de entrenamiento se saca de `training/periodo.tsx` a un componente compartido y lo usan los registros y las revisiones de nutrición y la evolución de antropometría, con la misma validación previa (hasta 92 días, «Desde» no posterior a «Hasta») y el error junto al campo.
3. **Error por campo.** Todos los formularios de nutrición y antropometría (objetivo, plan, elementos del catálogo, revisión, mediciones, evaluación, cálculo) marcan el campo con `error=` en `Campo` — que ya lo soporta — además del resumen de errores. En la APK, el `Campo` propio gana la misma propiedad.
4. **Números rioplatenses.** Un solo lugar en el dominio, `packages/domain/src/formato-numeros.ts` (`numero`, `cantidad`, `leerNumero`), con su prueba. Toda cantidad mostrada pasa por ahí; toda entrada numérica se lee con `leerNumero`, que acepta coma o punto. El dato guardado no cambia.

**Verificación.** `tsc` y lint limpios en web y APK; las pruebas del dominio; recorrido manual en el navegador de cada formulario tocado (sin capturas: las capturas van al final, por decisión de Dirección).

## 3. Tramo B — historia propia del asesorado (DL-089)

**Fuentes.** 08:199 (el titular tiene acceso pleno a «Plan entrenamiento + ejecución»); 08:58 (el fin del vínculo corta al profesional «sin destruir la historia del asesorado»); 05:8944 (UC-P17 exige vínculo y consentimiento vigentes **para ejecutar**); 08:406 (revocado el A3 se suspende toda operación sensible del titular).

**Decisión: opción A**, la recomendada en la deuda. Las lecturas del historial ya registrado del titular —API-TRN-19 (sus ejecuciones) y API-TRN-09 sobre versiones ACTIVADAS (su plan tal como lo aceptó)— exigen solo el A3 vigente, exactamente como `nutricion/ingestas.service.ts:listarPropias` y `antropometria/evolucion.service.ts`. Lo que **opera** sobre el plan vigente —«Hoy», abrir un borrador, confirmar, corregir— sigue pasando por el PDP del profesional (UC-P17 E03): el titular conserva su historia, no la capacidad de seguir ejecutando un plan cuyo profesional ya no tiene acceso.

**Verificación.** Prueba de integración: con B2 revocado, el titular sigue leyendo sus ejecuciones (200) y su plan activado (200), y «Hoy» sigue `NOT_AVAILABLE`; con A3 revocado, todo lo propio responde como hoy. El profesional sigue recibiendo 404. Se agrega a `contrato.int-spec.ts` o al spec de entrenamiento, según donde viva la prueba equivalente de nutrición.

## 4. Tramo C — contenido del dashboard (DL-031, condición de cierre)

**Fuentes.** 09 v0.11 §15 (API-DSH-03: `summary{}` por dominio, `reviews{}`, `nextActions[]`, `projectionAvailability[]`; **regla crítica**: read model ≠ fuente de verdad ≠ revisión ≠ score; no existe `overallHealthScore`/`overallCompliance`/`globalRisk`); RF-053 (04:618-624: cada dato conserva dominio y procedencia; los faltantes se muestran como tales; no hay score global); B10-08 §8 y §10 (estructura del dashboard; tarjetas de dominio: disponibilidad, resumen factual, último evento visible, próxima acción visible, acceso al detalle; **prohibido** semáforo clínico, «estado general», color de riesgo, score, ranking); B10-08 §8.4 (`partialView` es un banner único, sin listar lo oculto); B10-08 §9 y DEC-10-UX-01 (resumen ≠ análisis profundo: el dashboard no absorbe proyecciones).

**Decisión — recorte honesto de WP-10.** Se llena `summary` con **lo que ya existe en los read models de cada dominio**, sin cálculos nuevos ni agregados que puedan leerse como puntaje:

| Dominio | `summary` |
|---|---|
| Nutrición | plan vigente (id de versión, `activatedAt`), objetivo efectivo (kcal por día, con su autoría), última revisión visible (`reviewedAt`), próxima revisión acordada (`nextReviewAt`), cantidad de ingestas registradas en el período |
| Entrenamiento | plan vigente (id de versión, `activatedAt`), objetivo efectivo, última revisión visible, próxima revisión, cantidad de ejecuciones en el período y última ejecución (`occurredAt`) |
| Antropometría | última evaluación visible (`evaluatedAt`, método, autoría), cantidad de evaluaciones en el período, próxima revisión si el dominio la tiene |

Cada bloque conserva dominio, período, procedencia y autoría (B10-08 §8.3). `reviews`, `nextActions` y `projectionAvailability` **no se agregan**: pertenecen a la cola de revisiones (B10-08 §6), a coordinación (§13) y a las proyecciones (B10-09), que son WP-10 y quedan fuera. Se declara en DEUDA_LEGAJO como ampliación de DL-031, no como deuda nueva.

**Contrato.** `EntradaDeDominioSchema` de `contratos-vinculo.ts` deja de fijar `summary: z.null()` y pasa a una unión por dominio, con `summary` nullable cuando el PDP permite pero no hay datos todavía (RF-053: «faltantes como tales»). Es un cambio aditivo dentro de una operación ya declarada: no altera el inventario de 122.

**Verificación.** Prueba de integración por dominio: con datos sembrados el resumen trae lo esperado; sin datos, `summary: null`; con un alcance denegado, esa entrada sigue `available: false` y `partialView: true`, y el resumen de los otros dominios no revela nada del denegado. El website muestra las tarjetas con el resumen y el enlace al detalle; la APK no cambia (el dashboard es del profesional).

## 5. Orden y cierre

1. Esta definición → `main`.
2. Tramos A, B y C en paralelo, cada uno en su rama; se integran en orden **B, C, A** (A es el más grande y toca más archivos: mejor que se rebase sobre los otros).
3. Después de los tres: DEUDA_LEGAJO (DL-089 y DL-091 a CERRADA con su PR; DL-031 con la condición de cierre cumplida y la ampliación declarada), versión 0.8.0 en las tres aplicaciones, despliegue a `test`, verificación de URLs, y APK.
4. Capturas: **al final de todo**, junto con las de WP-07, por decisión de Dirección del 2026-09-22.

## 6. Lo que este tramo no arregla y queda dicho

- No hay recuperación de contraseña ni ingreso con Google (WP-02 §8): sigue fuera.
- No hay cola de revisiones, próximas acciones ni proyecciones en el dashboard (WP-10).
- La matriz de pertinencia de formularios sigue siendo maximalmente permisiva (DL-095).
- Los comentarios de código que todavía dicen «wger llega en WP-07» pasan a decir WP-08 en el tramo A, de paso.

## 7. Cierre — lo que se hizo distinto de lo definido

- **Tramo B:** además de API-TRN-19 y API-TRN-09, se incluyó **API-TRN-08** para el titular. Sin él, TRN-09 devolvía 200 sobre una versión que la lista ya no ofrecía (PR #67; DL-089).
- **Tramo A:** una revisión de calidad independiente encontró cinco fallas que ninguna prueba cubría, y se corrigieron antes de integrar (DL-091, resolución). Una de ellas no era del tramo: **API-ANT-06 cortaba la serie en silencio a los 92 días** desde WP-05; ahora responde `400 PERIOD_TOO_LONG`.
- **Tramo A, APK:** no se agregó selector de período, porque la APK de entrenamiento tampoco lo tiene (§2, punto 2).
- **Versión:** 0.8.0 en las tres aplicaciones. **Sin APK propia de este tramo:** la próxima APK se construye una sola vez al terminar el paquete de identidad visual, que también la cambia, y lleva las dos cosas.
- **Orden de integración:** fue B, C, A, como se definió en §5.
