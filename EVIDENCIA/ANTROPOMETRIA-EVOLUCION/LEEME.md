# Evidencia · Evolución antropométrica visual (website profesional)

Orden de Dirección del 2026-09-30 (avance principal 1). Convierte la lectura de API-ANT-06 (RF-049; UC-P20) en una herramienta para explorar cambios en el tiempo, **sin cambiar contratos, API ni base**.

- **Rama:** `feat/evolucion-antropometrica-visual`, sobre `main` (`53cc70e`).
- **Estado:** para auditoría, **sin integrar, sin desplegar y sin APK**.
- **Dependencias:** ninguna con los otros PR de la tanda. Comparte dos ayudas de teclado y puntero con los gráficos de entrenamiento (`apps/web/src/lib/graficos.ts`): nada más.

## Qué puede hacer el profesional

En **Antropometría → Evolución**:

1. Elige el período (hasta 92 días) con el mecanismo existente.
2. Elige una **métrica** de las que trae la respuesta, con su cantidad de observaciones.
3. Si la métrica tiene observaciones con otro protocolo, método o unidad, elige el **grupo de comparabilidad** que ve: cada grupo tiene su propio eje, nunca se mezclan unidades.
4. Ve sus observaciones como **puntos sobre un eje temporal a escala**: un mes con dos mediciones se ve como un mes. Sin líneas: los días sin observación quedan vacíos.
5. Elige un punto con **clic, toque o teclado** (flechas, Inicio, Fin), o desde la tabla con «Ver en el gráfico».
6. Ve el **valor exacto y su contexto**: valor y unidad, momento de la toma, fecha de registro, clase (medido, reportado, calculado), protocolo, método si lo hay, si el valor vigente viene de una corrección, y por qué no es comparable con el anterior.
7. Abre la **evaluación de origen** en Evaluaciones, por la ruta y la lectura existentes.
8. Puede consultar una **tabla equivalente** con las mismas observaciones y los mismos huecos.
9. Puede **comparar** dos observaciones del mismo grupo: una resta con signo, unidad y días entre ambas, marcada como descriptiva.

## Cómo se lee (una sola interpretación)

Toda la lógica está en `packages/domain/src/evolucion-antropometrica.ts`. El gráfico, el panel y la tabla se dibujan con lo mismo.

| Tema | Regla |
|---|---|
| Identidad | Cada observación se identifica por `sourceId`. La selección sigue a la identidad, no a la fecha ni al índice |
| Mismo día | Si el contrato publica dos observaciones el mismo día, son dos puntos («1 de 2 del día»). Hoy la API publica **una observación vigente por día y métrica** (checkpoint diario, 09v11 §11): la pantalla no inventa la otra |
| Huecos | Siguen siendo tramos sin observación (`gaps`), en la tabla con su rango y sus días. No se completan, no se unen |
| Cero | Un cero registrado es cero: se dibuja y se lista como valor |
| Grupos | Mismo protocolo, método y unidad (REG-06-162). Un eje por grupo; el vigente al abrir es el de la observación más reciente; un grupo que ya no existe cae a ese. Sin conversión de unidades |
| No comparabilidad | Rombo en el gráfico y motivo en palabras en la tabla y el detalle (REG-06-164). Forma y texto, no solo color |
| Corrección | Rige el valor vigente (REG-06-16); se marca «Corregida» en la tabla y con centro claro en el punto; el original se conserva en la evaluación |
| Métrica al cambiar de período | Si sigue en la respuesta, se conserva; si no, se pasa a la primera y se dice. Sin detalle viejo ni filtro obsoleto |
| Diferencia | Solo dentro del mismo grupo y nunca de una observación consigo misma; aritmética y descriptiva («−1,5 kg, con 10 días de calendario entre las fechas»). Los días son de calendario en la zona del período. No es progreso ni resultado clínico |
| Zona horaria | El eje, sus marcas, los huecos, las fechas y las horas de la vista están en la **zona del período** (`period.timeZone`, la del asesorado), no en la del navegador. Los instantes no cambian: se muestran en esa zona |
| Grupos homónimos | Si dos grupos solo difieren en la versión del método o del protocolo, el nombre agrega la referencia de esa versión tal como la publica el contrato (recortada; entera si el recorte no alcanza). El detalle muestra la referencia completa del método |
| Vista parcial | `partialView` se muestra: hay evaluaciones de otro profesional que existen y no se ven |
| Origen | Abre Evaluaciones con `evaluacion=` en la URL; la lectura y la autorización son las de siempre |

## Lo que no hace

- No interpola, imputa, arrastra, suaviza ni calcula tendencias.
- No convierte unidades ni normaliza valores.
- No agrega doble eje, anillos de composición, porcentajes de cumplimiento ni fórmulas.
- No agrega endpoints, migraciones ni campos.

## Pruebas

| Prueba | Qué cubre | Resultado |
|---|---|---|
| Unitarias del dominio (`evolucion-antropometrica.test.ts`, 13, con datos validados contra el esquema estricto) | serie vacía y un punto; cero registrado; huecos iniciales, intermedios y finales; dos observaciones el mismo día; selección por `sourceId`; cambio de protocolo, método y unidad; corrección; métrica que deja de estar; diferencia solo en el mismo grupo; límites y marcas del período en la zona del período; días de calendario con cambio de fecha en menos de 12 h; grupos que solo difieren en la versión del método o del protocolo; copy sin términos prohibidos | ver el PR |
| Integración `evolucion-antropometrica.int-spec.ts` (4), por los flujos reales contra PostgreSQL | dos evaluaciones el mismo día (la API publica una por día) y la corrección vigente; medición anulada y borrador excluidos, huecos; otra unidad como otro grupo; `partialView` con otro profesional y el origen accesible | **4/4** |
| Recorrido web local, escritorio 1280 px y móvil 390 px | ver la tabla siguiente | **18/18 y 18/18** |
| `npm test`, typecheck, OpenAPI (sin cambios), legajo y build del website | | ver el PR |

### Recorrido web local

Entorno: la API compilada de `main`, PostgreSQL 16 embebido, `next dev` y Chrome sin interfaz, el 2026-09-30, con datos sintéticos sembrados por los flujos reales (siete evaluaciones de peso, dos el mismo día, una corregida, una en libras; una cintura; una talla anulada; un borrador sin registrar; una evaluación de otro profesional). **No es el ambiente `test` desplegado.**

| Control | Resultado |
|---|---|
| Vista parcial visible por la evaluación de otro profesional | ✅ |
| Métricas de la respuesta con su cantidad; la anulada aparece con 0 | ✅ |
| Peso: dos grupos (kg y lb), selector y aviso; el vigente es el de la observación más reciente | ✅ |
| Puntos sin líneas: 5 en kg; la de lb no está en ese eje | ✅ |
| La tabla tiene las 6 observaciones (la de lb señalada «en otro grupo») y los huecos | ✅ |
| La corrección se marca igual en la tabla («Corregida») y en el punto (centro claro) | ✅ |
| Clic sobre un punto: el detalle es el de esa observación, con valor, momento, registro, clase, protocolo, corrección y comparabilidad; marcado en la tabla | ✅ |
| Comparación: resta con signo, unidad y días, con la aclaración | ✅ |
| Teclado: Inicio, flechas y Fin cambian la observación elegida | ✅ |
| Grupo lb: un punto, el aviso de una sola observación, sin detalle viejo | ✅ |
| Cintura: un grupo, sin selector, sin rombos | ✅ |
| Abrir el origen: Evaluaciones con la evaluación en la URL y su detalle cargado | ✅ |
| Cambiar a un período sin la métrica: cae a la primera disponible y se dice; sin detalle viejo | ✅ |
| Sin la API: «Reintentar», sin gráfico viejo, período editable | ✅ |
| Sin errores de consola (salvo el corte deliberado de la API) | ✅ |
| Móvil: los mismos controles, sin desplazamiento horizontal de la página | ✅ |

Capturas en esta carpeta: `01` puntos en kg con tabla; `02` detalle de la observación; `03` comparación; `04` grupo en libras con un punto; `05` la evaluación de origen abierta; `06` error con «Reintentar»; `movil-*` las mismas en 390 px.

## Límites

- **Una observación por día y métrica** es lo que publica la API (checkpoint diario). Si dos evaluaciones del mismo día deben verse por separado, es un cambio de la lectura, fuera de esta orden. La presentación ya lo soporta.
- **El método** se identifica por su versión en el contrato; la pantalla muestra esa referencia y no inventa su nombre.
- **La métrica** se muestra por su código (`peso`, `cintura`), como en la lectura existente.
- **Teclado en PC:** verificado con automatización; no equivale a la prueba manual de Dirección.
- No validado por Dirección, no desplegado.

## Tanda 2 (2026-09-30): casos de la auditoría, reproducidos y corregidos

Capturas en `tanda-2/`. Navegador en **Asia/Tokyo** (UTC+9) con el período en **America/Argentina/Buenos_Aires** (UTC−3), para que cualquier dependencia de la zona del navegador salte a la vista. Datos: los de la siembra original más una cintura tomada a las 23:00 locales (02:00Z del día siguiente) y una cintura con la **versión 2 del mismo protocolo** (mismo nombre; grupo homónimo).

| Caso | Reproducción | Corrección | Control |
|---|---|---|---|
| 1. Extremo del período | Período de un día (27/9): la toma de las 23:00 locales era válida para la API y quedaba fuera del eje (`T23:59:59Z`) | `limitesDelPeriodo` y `marcasDelPeriodo` en el dominio, calculados en la zona del período con `Intl` (sin la zona del navegador); las marcas son fechas civiles y ninguna cae después del último día; el rótulo se dibuja con la fecha civil de esa zona; la vista entera (tabla, detalle, recuadro) muestra fechas y horas en esa zona y lo dice | `01`: un punto, una marca «27 sept 2026», la toma a la derecha del eje; período completo con 6 marcas, la última ≤ «hasta» |
| 1b. Días de la diferencia | `Math.round(ms / 24 h)`: fechas consecutivas podían decir «0 días» | Días de calendario entre las fechas civiles de la zona del período: «con 1 día de calendario entre las fechas», «el mismo día». Sin tocar los valores ni su resta. Prueba unitaria con cambio de fecha a 1,5 h y mismo día a 14,5 h | `04` |
| 2. Comparación consigo misma | A elegida, B comparada, B pasa a principal: el selector excluía a B pero conservaba el valor y la diferencia era B − B | La comparada vale solo si existe, está en el grupo y no es la elegida; si no, el estado se vacía (selector en «No comparar»). `diferenciaDescriptiva` devuelve `null` para la misma observación | `05`; cambio de grupo también la vacía |
| 3. Grupos y métodos homónimos | `nombreDelGrupo` daba el mismo rótulo a dos grupos con igual protocolo y unidad y distinta versión de método o de protocolo; el detalle decía «un método declarado» | `nombreDelGrupo(g, todos)` agrega «(método <ref>)» o «(versión del protocolo <ref>)» solo cuando hay homónimos, con la referencia recortada o entera si el recorte coincide; `protocoloEnPalabras` y `metodoEnPalabras` en el detalle. Prueba unitaria donde **solo cambia la versión del método** | `02` y `03` (versión del protocolo, reproducida en el navegador); la versión del método, en la prueba unitaria: la base local no tiene dos versiones de método con cálculos |
| 5. `?evaluacion=` inválido | Una evaluación pedida que no existe dejaba la pestaña entera en «No disponible»; el parámetro solo inicializaba el estado | La lista se muestra siempre; 404 → aviso neutral (no distingue inexistente de no autorizada) con «Volver a la lista de evaluaciones» (saca el parámetro de la URL y abre la más reciente); otro fallo → «Reintentar» y la misma vuelta. `evaluacion=` se sigue si cambia después | `06` (inexistente), `07` (corte del detalle con la lista visible; reintento OK); cambio del parámetro sin recargar: el detalle pasa a la nueva |

Recorrido dirigido `recorrido-tanda2.mjs`: **17/17**. Dominio: 13 pruebas de evolución, suite completa 360/360.

**Cierre (2026-09-30): recorrido original sobre el código final (`7d30e9f`), 20/20.** Los dos controles que habían quedado en 16/18 se actualizaron a la siembra ampliada, conservando su exigencia:
- *Métricas con su cantidad:* `cintura (6)` = 4 cinturas de la siembra base + 2 de la tanda 2 (la nocturna con la versión 1 del protocolo y una con la versión 2); `peso (6)` y `talla (0)` sin cambios.
- *Cintura* (antes «un grupo, sin selector, 4 puntos sin rombos») se reparte en tres controles: dos grupos homónimos con nombres distintos por la versión del protocolo, de 5 y 1 observaciones; el grupo vigente es el de la observación más reciente (versión 1) con **5 puntos y 1 rombo** (la toma de hace 4 días no es comparable con la anterior, que es la de la versión 2) y sin la de la versión 2 en el eje; la tabla lista las 6 y marca la de la versión 2 «en otro grupo».

Los 18 controles anteriores se conservan tal cual. Solo cambiaron el recorrido (fuera del repo) y este registro: no se repitieron builds ni suites generales.

**Fuera de esta tanda, sin cambios:** la API publica una observación efectiva por día y métrica; el recorrido actual no permite ver todas las tomas de un mismo día.
