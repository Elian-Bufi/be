# WP-DASHBOARD-PROFESIONAL — Entorno profesional de seguimiento y análisis longitudinal · definición del paquete

> **Estado:** DEFINIDO el 2026-10-08. La implementación avanza por hitos en la rama `wp-dashboard-profesional`, sin
> integrar. El estado de cada hito está en `docs/paquetes/REANUDACION-DASHBOARD.md` y lo probado, en
> `EVIDENCIA/DASHBOARD-PROFESIONAL/`.
>
> **Encargo:** «BE · Entorno profesional de seguimiento y análisis longitudinal», de Dirección, del 2026-10-08 (entrega
> académica de referencia: 2026-10-20).
>
> **Autorización del encargo:**
> - **Sí:** investigar fuentes públicas, revisar el repositorio, diseñar, desarrollar en una rama aislada, contratos,
>   consultas, preferencias y migraciones aditivas estrictamente necesarias, pruebas reversibles en local y en CI con
>   datos sintéticos, y un PR revisable en borrador.
> - **No:** merge, despliegue, publicación de una APK, gastos, servicios externos ni cambios en los permisos del
>   asesorado.
> - Las autorizaciones previas sobre los arreglos de la candidata (#151 y #152) conservan su alcance y no se extienden a
>   este módulo, que **no es requisito para publicarlos**.
>
> **Base:** `main` en `ace91eb`. No incluye #151 ni #152, que siguen en sus ramas y no se tocan.
>
> **Datos:** solo sintéticos, en bases locales descartables. No se tocan DEMO-A01, sus sesiones ni sus planes en `test`.

## 0. Fuentes leídas

- **Encargo** completo (§0 a §20) y su matriz PRO-01 a PRO-26.
- **04:** RF-034 (analizar evidencia nutricional), RF-053 (dashboard interdisciplinario), RF-054 (línea temporal
  integrada) y RF-055 y 056 como contexto.
- **05:** UC-P24 (dashboard y línea temporal), UC-I02 (autorización contextual) y UC-I03 (preservar historia).
- **06:** M-11 y T-06-42 (los modelos de lectura no son fuente de verdad ni puntaje), T-06-24 (ocurrencia y registro
  son un par obligatorio) y T-06-35 (evolución antropométrica comparable).
- **09 v0.11** (`docs/legajo/09_AUX/BE_LEG_09_v0.11_…`):
  - §10 a §12: comparabilidad, API-ANT-06 y la regla común de los modelos de lectura;
  - §15: API-DSH-03;
  - §16: API-DSH-04, línea de tiempo longitudinal;
  - §18 a §23: API-PRJ-01 a 03, `ProjectionKey`, estados longitudinales y vista parcial.
- **10 B10-08/09 v0.8** (borrador UX no aprobado; se usa como dirección de diseño):
  - §3 invariantes, §8 a §12 (dashboard y línea de tiempo), §16 a §18 (Análisis), §23, §26 y §27 (proyecciones
    implementadas);
  - §29 y §30 (estados y accesibilidad), §32 (navegación) y §34 y §35 (escenarios adversariales).
- **11A:** TEST-RF-053, TEST-RF-054, TEST-UC-P24, TEST-CT-DSH-04, TEST-CT-PRJ-01, TEST-DSH-002, TEST-TIM-001/002,
  TEST-PRJ-001/002/005/008/009 y E2E-07.
- **DEUDA_LEGAJO:** DL-031 (DSH-03 mínimo), DL-054 (eventos persistidos como fuente del futuro timeline), DL-116 (el ID
  API-DSH-04), DL-121 (registro de comidas v2), DL-122 a 124 (series y tiempos).
- **Repositorio:** dos relevamientos, del website profesional y de la API, los permisos y la infraestructura (resumidos
  en §2), y lectura directa de `lectura-dashboard.ts`, `calculo-nutricional.ts`, `comparacion-de-entrenamiento.ts`,
  `evolucion-antropometrica.ts`, `contratos-registro-de-comidas.ts` y `contratos-antropometria.ts`.

## 1. Objetivo y demostrables

El profesional entra a la ficha de un asesorado y, con los datos que **su acceso vigente** autoriza:

1. **Resumen:**
   - ve qué tiene que revisar: objetivo y planes vigentes con versión y fecha;
   - 3 o 4 indicadores elegidos por él, con su unidad, fecha, fuente, calidad y n;
   - «Desde la última revisión» solo si hay una revisión real;
   - la cobertura por área y los eventos recientes.
2. **Línea de tiempo:** reconstruye qué pasó y cuándo:
   - eventos de todas las áreas autorizadas, por **fecha del hecho**, con «Registrado el…» como dato secundario;
   - rectificaciones y anulaciones como relaciones, no como eventos nuevos;
   - filtros, búsqueda y paginación estable.
3. **Analizar:** explora hasta **tres métricas**:
   - en paneles sincronizados (unidades distintas), superpuestas (misma unidad compatible) o como cambio relativo con
     una referencia explícita;
   - con los planes como contexto, una tabla de datos y «Cómo se calcula»;
   - con la comparación de dos períodos y vistas guardadas.
4. Desde un evento o un punto **abre el registro original** y vuelve a la misma selección.

**Recorrido vertical prioritario** (pedido por Dirección el 2026-10-08): resumen del asesorado → línea de tiempo →
análisis de hasta tres métricas → registro original.

## 2. Delta frente a lo que existe

| Necesidad | Existe | Se reutiliza | Delta de este paquete | Bloqueado |
|---|---|---|---|---|
| Ficha con tres vistas | Ficha `/pro/advisees?id=` sin pestañas, con «Resumen» de 3 tarjetas (`workspace.tsx`). Pestañas por dominio en sus páginas (`Pestanas`, `vista=`) | `Pestanas`, migas, `useEspacioProfesional`, `EstadoDeLectura` | Pestañas Resumen / Línea de tiempo / Analizar en la ficha; estado en la URL; `destinoSeguro` con `vista` | — |
| Autorización por área | PDP de 7 dimensiones por alcance; `PdpGuard` + `@OperacionProtegida` deciden y registran por alcance y responden 404 sin ninguno (`pdp.guard.ts`) | Tal cual, sin ampliar permisos | Las lecturas nuevas usan el mismo guard; `partialView` como en DSH-03 | Sin matriz de pertinencia (DL-039) |
| Resumen | API-DSH-03, con resumen factual por dominio (`lectura-dashboard.ts`) | Tal cual | La web manda el período (hoy no lo manda). Los indicadores y la cobertura se componen con API-PRJ-01 y API-DSH-04 | — |
| Línea de tiempo | Eventos de solo agregar (`evento_de_*`) y tablas fuente con `fecha_local` y `momento_de_ocurrencia`. API-DSH-04 especificada en el 09 y **sin implementar** | Tablas fuente y eventos de proceso (DL-054) | **API-DSH-04** con la ruta del 09 | — |
| Series de métricas | API-ANT-06 en el servidor (comparabilidad, huecos y corrección). Entrenamiento en el cliente con `comparacion-de-entrenamiento.ts`. Nutrición: contraste NUT-17 (7 a 92 días) y `consumed` por registro (`calcularNutrientes`) | Esos cálculos del dominio, sin fórmulas paralelas | **API-PRJ-01** para las 3 proyecciones con derivación definida (§6) | 5 de las 8 claves no tienen especificación (§6.4) |
| Vistas guardadas | No existen. Solo el tema en `localStorage` | Patrón de filas mutables de «Mis habituales» | Tabla `vista_de_analisis` y familia **API-VAN** (DL-128) | — |
| Gráficos | `recharts` 3.10 (evolución antropométrica y comparación de entrenamiento), accesibles, con tabla equivalente, compatibles con la CSP | `lib/graficos.ts`, `prepararSerie`, `dominioDelEjeVertical` y los patrones de marco accesible | Paneles sincronizados, superposición y cambio relativo; 3 tokens de color de métrica en los dos temas, con su prueba de contraste | — |
| Datos sintéticos de 12 semanas | Ayudantes de integración (`soporte-*.ts`) y recorridos con `preparar.mjs` | Ayudantes y SQL al estilo de `soporte-entrenamiento.ts` | Generador reproducible (§10) | Por la API, una activación siempre queda en «ahora»: la historia de planes se siembra con fixtures documentados |

## 3. Arquitectura elegida

**Tres vistas dentro de la ficha del asesorado** (B10-08 §4 y §32; encargo §5). La comparación con las otras dos
arquitecturas está en `EVIDENCIA/DASHBOARD-PROFESIONAL/INVESTIGACION.md` §3.
- No hay `/dashboard` universal ni menú nuevo.
- Las pestañas de dominio (Nutrición, Entrenamiento, Antropometría e Información) siguen siendo el lugar del registro
  original.
- El estado compartido (período) y el propio de cada vista viajan en la URL, con identificadores opacos y fechas: así
  volver recupera la selección. **Nunca** viaja texto clínico.

## 4. Operaciones

| ID | Método y ruta | Qué hace | Estado |
|---|---|---|---|
| API-DSH-03 | `GET /advisees/{adviseeId}/dashboard` | Resumen por dominio | Existe; **no cambia de forma** |
| **API-DSH-04** | `GET /advisees/{adviseeId}/timeline` | Línea de tiempo longitudinal (09 v0.11 §16) | **Nueva** (DL-127) |
| **API-PRJ-01** | `GET /advisees/{adviseeId}/projections/{projectionKey}` | Proyección profunda (09 v0.11 §19 y §20) | **Nueva**, con 3 claves derivadas y 5 que responden `INSUFFICIENT_INFORMATION` (DL-126) |
| **API-VAN-01** | `GET /me/analysis-views` | Vistas de análisis propias del profesional | **Nueva** (familia de BE, DL-128) |
| **API-VAN-02** | `POST /me/analysis-views` | Guardar una vista (solo configuración, nunca datos de salud) | **Nueva** |
| **API-VAN-03** | `PUT /me/analysis-views/{viewId}` | Reemplazar una vista, con versión esperada | **Nueva** |
| **API-VAN-04** | `DELETE /me/analysis-views/{viewId}` | Borrar una vista propia | **Nueva** |

**Reglas comunes:**
- Sesión del profesional; el PDP decide por alcance y registra cada decisión.
- Sin ningún alcance permitido, 404 idéntico al de un asesorado inexistente.
- `partialView` es un aviso único y no se nombran los dominios ocultos (B10-08 §8.4).
- Cada respuesta declara `generatedAt` y sus fuentes (09 v0.11 §12).
- Parámetros desconocidos → 400.
- El período va en fechas civiles del asesorado, hasta 366 días.
- El límite de lecturas protegidas por actor es el de siempre.
- Ninguna operación cambia permisos ni concede acceso: las vistas guardadas se revalidan al abrirse, porque las
  lecturas de datos vuelven a pasar por el PDP.

## 5. Línea de tiempo (API-DSH-04)

**Fuentes** (todas acotadas al profesional que consulta y a los alcances que el PDP permitió):

| Área | Entrada | Ocurrió | Registrado | Relaciones |
|---|---|---|---|---|
| Nutrición | Plan activado (versión) | `momento_de_activacion` | el mismo | Sucede a la versión anterior |
| Nutrición | Objetivo (versión) | `vigente_desde` | su registro | — |
| Nutrición | Registro de comida (uno por registro, **no** por ítem) | `momento_de_ocurrencia` (el hecho) | `momento_de_registro` | Rectificación de cantidades (relación, no un evento de consumo nuevo) y anulación (la entrada sigue, marcada) |
| Nutrición | Revisión | su registro | el mismo | Sobre el proceso |
| Entrenamiento | Plan activado y objetivo | como en Nutrición | — | — |
| Entrenamiento | Sesión registrada (una por ejecución, con su condición y un resumen de las series) | `momento_de_ocurrencia` | `momento_de_registro` | Plan → ejecución (versión y sesión planificada); corrección |
| Entrenamiento | Revisión | su registro | el mismo | — |
| Antropometría | Evaluación registrada (una por toma, con sus métricas) | `momento_de_ocurrencia` | `momento_de_registro_de_evaluacion` | Corrección y anulación de una medición |
| Proceso | Seguimiento abierto, continuidad o cierre (DL-054) | su ocurrencia | su registro | — |

**Reglas:**
- `occurredAt` y `recordedAt` son independientes. Si falta uno, va `null`: nunca se copia el otro (TEST-TIM-001).
- Un hecho con solo fecha lleva `occurredDate` y `occurredAt: null`: no se inventa una hora.
- **Orden estable:** fecha del hecho descendente, después `recordedAt` y después el identificador. El cursor es opaco y
  codifica esa clave.
- **No hay relaciones por cercanía temporal** (TEST-TIM-002).
- Los borradores del asesorado no llegan: el profesional no los ve (09v10:980). Los datos que siguen solo en un teléfono
  tampoco: la línea de tiempo dice «recibido por BE».
- **Filtros del 09:** `domain`, `type`, `periodStart` y `periodEnd`.
- **Extensiones de BE** (DL-127): `state` (vigente, rectificado o anulado), `quality` (cantidades sin confirmar o
  parciales), `planVersionId`, `exerciseId` y `q`. `q` busca en el **período completo** del conjunto autorizado, no solo
  en lo cargado.
- **Conteos** solo de fuentes autorizadas: un alcance denegado no aporta ni un número (TEST-DSH-002).

## 6. Proyecciones y métricas (API-PRJ-01)

### 6.1 Diccionario versionado

El diccionario es `packages/domain/src/metricas-del-analisis.ts`, versión `BE-METRICAS-2026-10-v1`. El detalle de cada
métrica está en `EVIDENCIA/DASHBOARD-PROFESIONAL/DICCIONARIO-DE-METRICAS.md`. Para cada métrica define:
- identidad y nombre profesional;
- unidad y escala (razón, intervalo, ordinal o conteo);
- fuente (`projectionKey`) y alcance que exige;
- clase (dato bruto o derivado) y fórmula;
- fecha aplicable;
- agregadores permitidos por grano;
- comparabilidad y tratamiento de ausencias;
- redondeo, cobertura y enlace al origen;
- si admite superposición y cambio relativo.

### 6.2 Claves implementadas (derivación definida)

| Clave | Métricas | Fuente canónica |
|---|---|---|
| `NUTRITION_PRESCRIBED_VS_RECORDED` | Energía, proteínas, carbohidratos, grasas y fibra **registradas**; registros por día; requerimiento energético del objetivo | `consumed` de cada registro efectivo (`calcularNutrientes`, `SUM_SOURCE_PER_100G_V1`): se suma lo conocido y se declara lo que falta |
| `TRAINING_PROGRESSION_BY_EXERCISE` | Carga de la serie más pesada (kg o lb, sin mezclar), repeticiones por serie, RIR declarado y series registradas, por identidad del ejercicio | Ejecuciones registradas en su vista vigente, con `comparacion-de-entrenamiento.ts` (identidad, objetivo histórico de cada serie) |
| `ANTHROPOMETRY_LONGITUDINAL` | Cada métrica de ANT-06 (masa corporal, perímetros, pliegues y derivados) | `construirSerie` de API-ANT-06, con grupos de comparabilidad, huecos y estado de corrección |

### 6.3 Reglas de las series

- **Puntos reales,** sin interpolar, imputar ni arrastrar. Las líneas se cortan en los huecos y en los cambios de grupo
  comparable (TEST-PRJ-005 y 008).
- **Lo desconocido es `null` con motivo,** nunca 0. El 0 real es un dato (TEST-PRJ-002).
- **Nutrición:**
  - un día con registros sin cantidades o con nutrientes sin dato es un **subtotal** («Subtotal de lo registrado»);
  - lo previsto de una opción nunca se suma como consumido;
  - no se suman alternativas;
  - una media semanal dice su denominador (días con cantidades / días del período);
  - no hay puntaje de adherencia (TEST-PRJ-009).
- **Entrenamiento:**
  - kg y lb nunca se mezclan, y ejercicios distintos tampoco;
  - el RIR es ordinal (mediana, sin cambio relativo). RIR nulo es «sin informar» y RIR 0 es una respuesta.
- **Antropometría:**
  - dos tomas del mismo día siguen siendo dos;
  - un cambio de método corta la serie;
  - sin el error de medición documentado no hay intervalos ni «cambio significativo».
- **Granos:** original, día o semana, solo si la métrica los admite. La semana va de lunes a domingo en la zona civil del
  asesorado, y una semana parcial se marca como tal.
- **Cambio relativo:** `100 × (valor − referencia) / referencia`, con una referencia explícita (rango, agregador y n).
  Si la referencia es ≤ 0 o falta, no se calcula y se dice por qué.
- **Comparación de dos períodos:** duración, n, cobertura y el mismo resumen por métrica, sin conclusiones causales.

### 6.4 Claves sin especificación

Estas claves están en el catálogo cerrado (8/8, ninguna extra: TEST-PRJ-001), pero responden `INSUFFICIENT_INFORMATION`
con el motivo `SPECIFICATION_PENDING`. No inventan datos ni muestran pantallas aparentemente operativas.

| Clave | Por qué no se deriva todavía |
|---|---|
| `TRAINING_VOLUME_BY_EXERCISE` | No hay una convención de carga externa para todas las bases (mancuerna única, por implemento o total) ni para la unilateralidad: no se agregan cargas ambiguas (encargo §12) |
| `TRAINING_VOLUME_BY_MUSCLE_ZONE` y `TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE` | No hay un mapeo canónico de zonas ni de roles (WP-08 fuera de la entrega) |
| `TRAINING_EFFECTIVE_VS_TOTAL_VOLUME` | Necesita el umbral del profesional (API-PRJ-02 y 03), que no es parte de este encargo |
| `TRAINING_PERSONAL_RECORDS` | El 09 exige una especificación aprobada de qué es una marca; BE no la tiene |

## 7. UX

La especificación completa está en `EVIDENCIA/DASHBOARD-PROFESIONAL/ESPECIFICACION.md`. Los puntos que fija este
documento:

- **Resumen ≠ análisis profundo** (DEC-10-UX-01): pocas piezas y ningún gráfico de las proyecciones.
- **Línea de tiempo:** se agrupa por día civil y se expande a demanda. Filtros y chips activos, «Limpiar filtros» y tres
  estados distintos (sin datos, sin coincidencias y error).
- **Analizar:**
  - selector de hasta 3 métricas; la cuarta pide elegir cuál reemplazar;
  - presets por pregunta profesional, que siguen siendo editables;
  - los tres modos de lectura;
  - un panel de lectura persistente (sin tooltips efímeros como único medio);
  - intervalo con dos campos de fecha además del arrastre;
  - tabla, resumen textual y «Cómo se calcula».
- **Ningún juicio de color** sobre cambios corporales o de rendimiento. No hay porcentaje global, semáforo ni ranking.
- **Accesibilidad:** objetivo WCAG 2.2 AA en los recorridos implementados (teclado, foco, reflow a 390 px, contraste y
  mensajes de estado).

## 8. Compatibilidad

- Las operaciones son nuevas. **Ninguna respuesta existente cambia de forma.** DSH-03 solo empieza a recibir el período
  desde la web.
- La APK no consume nada de esto y no cambia.
- **La migración es aditiva:** una tabla nueva, `vista_de_analisis`, sin tocar datos ni columnas existentes.

## 9. Modelo

`vista_de_analisis`:
- `id`, `profesional_id`, `nombre` y `uso` (`ANALISIS` o `INDICADORES_DEL_RESUMEN`);
- `configuracion` (jsonb validado por el esquema del dominio, **sin datos de salud**);
- `version`, `momento_de_creacion` y `momento_de_actualizacion`.

Es mutable y propia del profesional, como «Mis habituales»; sus escrituras quedan en la auditoría. Hay un índice único
parcial: a lo sumo una configuración `INDICADORES_DEL_RESUMEN` por profesional.

## 10. Datos sintéticos

El generador es reproducible, con semilla fija, sobre una base local descartable. Su especificación y los resultados
esperados, que son independientes de la implementación, están en
`EVIDENCIA/DASHBOARD-PROFESIONAL/DATOS-SINTETICOS.md`.

**Por la API real:**
- cuentas, A3, vínculos y consentimientos (actos reales, nada falsificado);
- las acciones de los últimos días: comidas, rectificación y anulación del asesorado, una sesión y una toma.

**Por fixtures SQL documentados**, al estilo de `soporte-entrenamiento.ts` y respetando los triggers y los eventos en la
misma transacción, la historia de 12 semanas:
- versiones de plan activadas en el pasado (por la API la activación siempre queda en «ahora»);
- comidas y sesiones de etapas anteriores;
- tomas, con fechas del hecho y de registro explícitas.

**Casos difíciles incluidos:**
- dos etapas de plan;
- cantidades confirmadas, modificadas y ausentes;
- comida diferente sin macros;
- nutriente incompleto;
- RIR nulo y 0;
- kg y lb;
- descansos medidos, estimados y sin dato;
- dos tomas el mismo día;
- sitio ausente;
- cambio de método;
- carga tardía, rectificación y anulación;
- profesional multiárea, profesional de alcance parcial y tercero sin acceso;
- revocación;
- respuesta lenta;
- período vacío y período denso;
- **cobertura nutricional que baja sin que bajen las cantidades de los días cuantificados;**
- **un cambio de técnica que parece un salto de composición.**

## 11. Pruebas y evidencia

| Nivel | Qué cubre |
|---|---|
| Dominio (`packages/domain/src/*.test.ts`) | Diccionario, agregaciones, subtotales nutricionales, entrenamiento por serie, cortes de comparabilidad, cambio relativo, comparación de períodos y orden y cursor de la línea de tiempo |
| Integración (`test/integration/*.int-spec.ts`) | DSH-04, PRJ-01 y VAN: autorización parcial, tercero y revocación (consultas, conteos, búsqueda y fuentes); 404 sin enumeración; orden y paginación estables; rectificación y anulación una sola vez; `migrate diff` vacío |
| Recorridos (puppeteer con la API y el website locales) | El recorrido vertical y la exploración completa, interactuando con los controles; respuesta lenta; teclado; anchos 1440, 1280, 1024, 768 y 390 px y los dos temas |
| Rendimiento | El conjunto de 12 semanas y uno mayor, con un presupuesto declarado antes de medir |

**Pruebas del 11A** que corresponden: TEST-RF-053, TEST-RF-054, TEST-UC-P24, TEST-CT-DSH-04, TEST-CT-PRJ-01,
TEST-DSH-002, TEST-TIM-001, TEST-TIM-002, TEST-PRJ-001, 002, 005, 008 y 009, y E2E-07.

**Matriz de aceptación PRO-01 a PRO-26:** está en `EVIDENCIA/DASHBOARD-PROFESIONAL/ACEPTACION.md`, con el escenario, el
entorno, la evidencia y lo pendiente.

## 12. Fuera de alcance (encargo §19, B10-08/09 y decisión del 2026-09-22)

- **Cartera y cola de revisiones** (API-DSH-01 y 02). Se conserva API-CAR-01.
- **Coordinación** (API-CRD-01).
- **Progreso propio en la APK** (API-DSH-05) y nuevas capturas móviles.
- **Umbral de volumen efectivo** (API-PRJ-02 y 03).
- **Zonas musculares.**
- **TVCC-30.**
- **Exportación elaborada.** Si se incluye una exportación CSV básica, se prueba con el mismo rigor de permisos.
- **Análisis estadístico y predictivo:** anotaciones nuevas, análisis de rezagos, correlaciones, alertas clínicas,
  modelos predictivos e IA generativa.

## 13. Deudas (DEUDA_LEGAJO)

- **DL-126:** Analizar sobre API-PRJ-01: 3 de 8 claves con derivación y el resto `INSUFFICIENT_INFORMATION`.
- **DL-127:** API-DSH-04 en BE: fuentes, forma de la entrada y extensiones de filtro.
- **DL-128:** vistas de análisis guardadas, familia API-VAN.
- **DL-054:** se cierra en la parte de la línea de tiempo, que consume los eventos de proceso persistidos.

## 14. Estado de la implementación

Se completa al cerrar cada hito; mientras tanto, ver `REANUDACION-DASHBOARD.md`.
