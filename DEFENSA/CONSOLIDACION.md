# DEFENSA — Tramo de consolidación

> Ejecutado el 2026-09-22/24. La definición se registró **antes del primer commit de código**: `docs/paquetes/WP-CONSOLIDACION.md` (PR #66).
>
> **Por qué existe.** A nueve días de la entrega, Dirección eligió «consolidar y pulir» en vez de abrir paquetes nuevos: que el producto que ya existía se comportara igual en sus tres dominios y que el dashboard dejara de estar vacío. No agrega ninguna familia contractual ni ningún RF que no estuviera ya autorizado: cierra tres deudas que los paquetes anteriores habían dejado declaradas y que se defienden mal si quedan abiertas — **DL-089**, **DL-091** y la condición de cierre de **DL-031**.

## 1. Qué hace el tramo

1. **El asesorado conserva su historia de entrenamiento** aunque revoque el acceso de su profesional (DL-089). Antes, revocar el B2 le devolvía un 404 sobre las sesiones que él mismo había registrado. Ahora sus lecturas de historia exigen solo su A3, como ya pasaba en nutrición y antropometría. **La garantía vive en la API**: la APK todavía no tiene una pantalla de historial de entrenamiento, y el 09 no declara una operación para listar las ejecuciones propias (DL-096).
2. **El dashboard muestra algo de cada dominio** (DL-031). Hasta este tramo, `API-DSH-03` respondía `summary: null` para todo: WP-04, 05 y 06 agregaron sus operaciones, pero ninguno volvió al dashboard. Ahora cada dominio autorizado trae su plan vigente, su objetivo con autoría, la última revisión, la próxima y cuántos registros hubo en el período.
3. **Las tres pestañas se comportan igual** (DL-091): una escritura denegada retira el contenido, el período se elige, el error va al campo, y los números se leen y se escriben con coma.

| Superficie | Qué cambió |
|---|---|
| API | TRN-08/09/19 del titular con A3; `API-DSH-03` con resúmenes; `API-ANT-06` rechaza períodos de más de 92 días |
| Website | Tarjetas de dominio en el Resumen; nutrición y antropometría con los cuatro patrones |
| APK | Números con coma, errores en su campo y retiro por 404 en nutrición y antropometría |

## 2. Dónde vive cada garantía

### 2.1 El derecho del titular no depende de un tercero

Las lecturas de **historia** —la ejecución registrada, el plan tal como se aceptó, la lista de sus planes— pasan por `exigirA3Vigente`, no por el PDP evaluado sobre el profesional. Las **operaciones** —«Hoy», abrir un borrador, confirmar, corregir— siguen por el PDP. La línea no es arbitraria: el 08 le da al titular acceso pleno a su plan y su ejecución (08:199) y dice que el fin del vínculo corta al profesional «sin destruir la historia del asesorado» (08:58); UC-P17 pide vínculo y consentimiento vigentes **para ejecutar** (05:8944). Revocado el A3, se corta también lo propio (08:406). Las cuatro caras tienen su prueba.

### 2.2 El dashboard no puede filtrar lo que el PDP negó

El controlador pide el resumen **solo** de los alcances que el PDP permitió, dentro de una única transacción de lectura. Un dominio negado no llega a consultarse: no hay conteo, fecha ni identificador que pueda escaparse al resumen de otro. La prueba arma un profesional con dos alcances, revoca uno, y verifica que el negado sea exactamente `{ available: false, reason: "NOT_AVAILABLE_TO_VIEW" }`.

### 2.3 Un conteo no es una adherencia

El resumen cuenta registros —«2 ingestas en el período»—, nunca calcula un porcentaje ni una calificación. La regla crítica del 09 v0.11 §15 prohíbe `overallHealthScore`, `overallCompliance` y `globalRisk`; la prueba recorre **las claves** de la respuesta y falla si aparece `score`, `risk`, `compliance`, `adherence`, `rating`, `level`, `grade` u `overall`. Las tarjetas del website no usan color de estado: el B10-08 §10 prohíbe el semáforo.

### 2.4 Mostrar no redondea, y leer no adivina

Un solo lugar del dominio formatea los números para las dos superficies (`formato-numeros.ts`). Sin un máximo explícito, se muestran **todos** los decimales del dato; un cálculo se muestra con la precisión que declara su método, aunque termine en cero (REG-06-158). Y al leer lo que escribe la persona, «1.850» se rechaza por ambiguo: en una pantalla que muestra miles con punto es mil ochocientos cincuenta, y sería 1,85 si el punto se tomara como decimal.

## 3. Lo que encontró la revisión independiente

El tramo A se escribió en parte con agentes en paralelo, y hasta ese momento solo lo había verificado el compilador. Una revisión independiente, con la consigna de leer cada escritura y cada número, encontró cinco fallas que **ninguna de las más de 400 pruebas** cubría:

| Falla | Qué habría pasado |
|---|---|
| `leerNumero("1.850") = 1,85` | un objetivo de 1.850 kcal guardado como 1,85 kcal |
| redondeo a 2 decimales al mostrar | una talla de 1,755 m vista como 1,76; un cálculo de 3 decimales mostrando 2 |
| cantidad ilegible en el editor | se guardaba el último número válido, en silencio |
| número ilegible en Formularios de la APK | un requerido parecía faltante; un opcional desaparecía |
| **`API-ANT-06` sin tope** | la serie se cortaba en el día 92 mientras la respuesta informaba el período completo |

La última no era del tramo: estaba en `main` desde WP-05. La encontró la revisión del filtro de período, que la hizo visible. Todas se corrigieron antes de integrar, con su prueba.

## 4. Tres preguntas que puede hacer el tribunal

**¿Por qué el asesorado ve su historia si revocó el consentimiento?**
Porque revocó el acceso **de su profesional** (B2), no el suyo. Su propio consentimiento para tratar datos de salud (A3) sigue vigente, y con él, su derecho a ver lo que registró. Si revoca el A3, deja de verlo — está probado. Lo que no puede hacer con el B2 revocado es seguir **ejecutando** el plan de un profesional que ya no tiene acceso: esa línea la traza el propio UC-P17.

**¿El dashboard no es una forma de reunir datos de distintas especialidades que cada profesional no debería ver juntos?**
Cada profesional ve en el dashboard **solo** los dominios que el PDP le autoriza, uno por uno, y el resumen de cada dominio sale de ese dominio y de nada más. Un nutricionista sin alcance de entrenamiento no ve ni que existe un plan de entrenamiento: la entrada es la misma que para cualquier dominio no disponible, y el aviso de vista parcial es uno solo, sin detalle (B10-08 §8.4).

**Si todo pasaba el compilador y las pruebas, ¿cómo se encontraron esas cinco fallas?**
Leyendo. Las pruebas verifican lo que alguien pensó en verificar; ninguna había pensado en un número escrito con punto de miles. Por eso el tramo se cerró con una revisión independiente, con la consigna explícita de buscar escenarios concretos de falla, y cada hallazgo se verificó en el código antes de corregirlo. Es la misma lección que dejó WP-07 con las pantallas: una parte de la calidad solo aparece mirando.

## 5. Qué quedó fuera

- `reviews{}`, `nextActions[]` y `projectionAvailability[]` del dashboard: son la cola de revisiones, la coordinación y las proyecciones — el resto de WP-10, fuera de la entrega (ver DL-031).
- Selector de período en la APK: entrenamiento tampoco lo tiene en esa superficie; el patrón es de la revisión profesional.
- Una pantalla de historial de entrenamiento en la APK, que haría visible en el teléfono lo que DL-089 garantiza en la API (DL-096).
- Las capturas de las pantallas nuevas: por decisión de Dirección, todas las capturas van al final de la entrega.
