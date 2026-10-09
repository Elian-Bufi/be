# WP-DASHBOARD-COMPRENSION — comprender, investigar y actuar con continuidad

> Encargo de Dirección del 2026-10-09, «BE · Encargo de evolución del dashboard profesional». Rama
> `wp-dashboard-comprension`, apilada sobre `wp-dashboard-profesional` en `6c8e0b4` (PR #153, en borrador). PR propio en
> borrador contra esa rama; cuando #153 se integre, la base pasa a `main` sin reescribir la historia. **Sin merge ni
> despliegue.** Reanudación: `docs/paquetes/REANUDACION-COMPRENSION.md`. Evidencia: `EVIDENCIA/DASHBOARD-COMPRENSION/`.

La experiencia buscada: **«Entendí qué cambió, sé qué datos sostienen esa lectura y sé qué necesito revisar».**

## 0. Base y alcance

- **Base aceptada** (encargo §2): las soluciones de DL-126 (proyecciones con derivaciones definidas), DL-127 (búsqueda de
  la línea de tiempo por POST) y DL-128 (vistas en el servidor) son la base de continuidad. No aprueba fórmulas clínicas
  nuevas ni publicación; los requisitos documentales que todavía correspondan siguen en `docs/DEUDA_LEGAJO.md`.
- **Sin cambios:** #151, #152, DEMO-A01, la base de `test`, `main` y las APK. Sin gastos ni servicios nuevos.
- **Datos locales:** una base propia, `be_test_comprension` (PostgreSQL 16 en :55442), con su carpeta de trabajo
  `herramientas/trabajo-comprension/` (ignorada por git). La base `be_test_dashboard` del paquete anterior no se toca:
  queda recuperable para comparar.
- **Comprobación heredada** (encargo §3): dirigida, no una auditoría nueva. Lo cerrado en `6c8e0b4` se conserva con sus
  pruebas (resúmenes sobre observaciones, referencia explícita, búsqueda por POST, clases, revalidación).

## 1. Mapa de integración: necesidad → componente → operación → dato fuente

| Necesidad | Componente (web) | Operación | Dato fuente |
|---|---|---|---|
| Persona, acceso actual y período | `workspace.tsx` (cabecera), `barra.tsx` | API-REL-02 (vínculos), API-DSH-03 | Vínculo y alcance (estado mínimo), resumen por dominio |
| Objetivo vigente y plan por área | Resumen: «Objetivo y etapa» | API-DSH-03; API-PRJ-01 (vigencias) | `objective` y `activePlan` de cada dominio; versiones activadas con su vigencia |
| Corte de la última revisión, por área | Resumen: «Para tu próxima revisión» | API-DSH-03 (`lastReview`) | Revisión registrada (NUT-18 / TRN-22), con su instante |
| Novedades desde la revisión | Síntesis (dominio) | API-DSH-04 con `since` (extensión aditiva, DL-127) | Entradas: `recordedAt`, `occurredAt`/`occurredDate` y el instante de cada relación (rectificación, anulación, corrección) |
| Revisión registrada sin aplicar; próxima revisión | Síntesis | API-NUT-17 / API-TRN-21 (`previousReviews`), API-DSH-03 (`nextReviewAt`) | `application` de cada revisión; próxima revisión del plan |
| Cambios de planificación y comparabilidad | Síntesis, Analizar | API-DSH-04 (activaciones, objetivos); API-PRJ-01 (tramos) | Versiones activadas; grupos de comparabilidad de antropometría |
| Cobertura del período | Resumen, Analizar | API-PRJ-01 (cobertura nutricional), API-DSH-04 (`periodCounts`) | Registros con y sin cantidades; sesiones por calidad; tomas |
| Preguntas profesionales | `preguntas.tsx` (lista, parámetros y pregunta en curso); entrada también en el Resumen | — (configuración) | Catálogo `PREGUNTAS_PROFESIONALES` del dominio, con parámetros tipados; `resolverPregunta` con lo que hay del asesorado |
| Series, referencias y comparaciones | `analizar.tsx`, `lienzo.tsx`, `series.ts` | API-PRJ-01 | Observaciones (día, sesión o toma) y su agrupación visual |
| Etapas de planificación | `etapas.tsx` (tarjetas A y B, tabla por métrica, lista de etapas del gráfico) | API-PRJ-01 (vigencias; `planVersionIds`, extensión aditiva) | Versiones activadas (instante de activación, sucesora, cierre); la versión que ejecuta cada registro (clave foránea) |
| Contraste con lo indicado | `contraste.tsx` | Entrenamiento: API-TRN-21 (contexto de revisión) + `EvolucionDelEjercicio`; Nutrición: API-DSH-04 (comidas, con filtro de calidad) y API-ING-03 al costado | Prescripción vinculada a la ejecución; opción registrada con sus cantidades (`contrasteDeLaComida`) |
| Información para revisar | `informacion.tsx` | API-DSH-03, API-DSH-04 (`periodCounts`), API-PRJ-01 (cobertura y medidas) | Cobertura, último registro, objetivo vigente, corte, comparabilidad |
| Origen de un dato y planificación de una etapa | `registro-original.tsx` (panel lateral) | API-ING-03, API-TRN-19, API-ANT-0x, API-NUT-09 / API-TRN-09 | Registro, toma o versión de plan (instantánea) |
| Preparar y registrar una revisión | Pestaña del área, vista Revisiones | API-NUT-17/18/19/20, API-TRN-21/22/23/24 | Contexto de revisión; revisión registrada; aplicación |
| Solicitar contexto | Pestaña Información | API-FRM-03 | Plantillas y solicitud |
| Búsqueda en catálogos sin texto en la URL | Editores de plan y recetas | API-NUT-13-BUSQUEDA, API-TRN-13-BUSQUEDA (POST, aditivas) | Catálogo de alimentos y de ejercicios; el GET con `q` queda como contrato legado |
| Vistas guardadas | `vistas-guardadas.tsx` | API-VAN-01 a 04 | Configuración (identificadores), nunca resultados |

## 2. Decisiones (reversibles, dentro del alcance)

Se completan a medida que se implementan; cada una dice por qué y cómo conserva el objetivo. Las que tocan contratos están
en `docs/DEUDA_LEGAJO.md` (DL-129 y DL-130).

| # | Decisión | Por qué |
|---|---|---|
| D-01 | **El corte de cada área es su última revisión registrada** (API-DSH-03, `lastReview.recordedAt`). Antropometría no tiene revisiones en BE: su alcance es siempre el período elegido, y se dice. | El encargo pide un corte por área y «sin revisión, el período». Abrir la ficha no crea nada. |
| D-02 | **Novedades por instantes, no por `updatedAt`:** ocurrió después (hecho y registro posteriores), se incorporó después (hecho anterior, registro posterior) o se corrigió después (rectificación, anulación o corrección con instante posterior). El corte se excluye. Extensión aditiva `since` + `sinceCounts` de API-DSH-04, también en el cuerpo de la búsqueda. | Lo que se cargó tarde es información nueva aunque el hecho sea viejo; la revisión misma no es una novedad. |
| D-03 | **La lectura de novedades cubre hasta un año hacia atrás** (el máximo del análisis); si el corte es anterior, la observación lo dice. | El encargo pide explicar el tramo cubierto si se supera el máximo. |
| D-04 | **API-DSH-03 aditivo:** `lastReview.application`, `draftPlan` y `objective.effectiveFrom`. | «Revisión registrada sin aplicar» y «borrador sin activar» son pendientes explícitos; «objetivo vigente hoy» necesita su fecha. Solo la web lee DSH-03. |
| D-05 | **API-PRJ-01 aditivo:** en cada punto, el método con su naturaleza y las versiones del plan que ejecutan sus registros; en cada vigencia, el instante y el motivo del corte; en las métricas antropométricas, los grupos de comparabilidad. La naturaleza sale de la categoría de la ficha del método (DL-111), generada en el dominio por el mismo script del catálogo; la migración sellada queda idéntica. API-ANT-06 no cambia. | «Calculado no es siempre estimado» (el IMC es un índice); las etapas necesitan la referencia histórica de cada registro; la APK valida ANT-06 con un esquema estricto. |
| D-06 | **Lentes de etapa:** entrenamiento por la versión que ejecutó cada sesión; nutrición y antropometría por las fechas de la etapa, diciendo cuántas observaciones tienen registros asociados a otra versión. | La API de comidas asocia el registro a la versión vigente cuando se carga: una comida vieja cargada tarde no se reatribuye ni se esconde. |
| D-07 | **La comparación de etapas usa `resumirPeriodo` y `compararResumenes`**, los mismos de «Comparar dos períodos», sobre las observaciones originales. | No hay un segundo motor (regresión 1.875 kcal con n = 8 conservada). |
| D-08 | **Seis preguntas, cuatro a la vista y dos en «Más preguntas»;** parámetros solo identificadores; el ejercicio, la medida corporal, la versión y las etapas se eligen siempre; lo de otro asesorado se vuelve a pedir. | «Sin sustitución silenciosa»; el preset anterior elegía el primer ejercicio. |
| D-09 | **Síntesis por reglas y plantillas fijas**, con prioridad (pendientes, planificación y comparabilidad, información nueva, cobertura) y una prueba que rechaza palabras que califican. | El encargo prohíbe IA y juicios («mejoró», «no cumplió»). |
| D-10 | **Búsqueda en catálogos por POST** (API-NUT-13-BUSQUEDA y API-TRN-13-BUSQUEDA); el GET se conserva. | Mismo riesgo que DL-127: el texto en la URL queda fuera del control de BE. |
| D-11 | **Detalle de comida con los estados de la toma y la sesión:** sin acceso (sin reintentar), falla recuperable con su motivo. | §3.B: «sin reintentos indefinidos por falta de permiso». |
| D-12 | **Lecturas de a cuatro en la ficha** (`limitarLectura`). | En las capturas «antes», una base cargada devolvió 503 (P2028) con todas las lecturas juntas. |
| D-13 | **Las preguntas reemplazan a los presets** y se entra por ellas desde el Resumen («Empezar por una pregunta», junto a las acciones) y desde Analizar sin métricas. La serie, la unidad y las dos últimas etapas se sugieren a la vista y se confirman; el ejercicio, la medida y la versión, nunca. | El preset anterior elegía el primer ejercicio del período; el encargo pide la entrada visible en las dos vistas. |
| D-14 | **El primer pantallazo responde** con quién, qué se busca, qué cambió y qué requiere revisión: la cabecera ocupa una línea de identidad técnica (el acceso se dice una vez si todas las áreas están en el mismo estado; sin el rótulo que repetía la miga) y «Objetivo y planificación» es una tabla con una fila por área (objetivo vigente hoy, planificación —vigente hoy y lo que rigió—, revisiones). | Con tres columnas angostas, el bloque llenaba los 900 px y la síntesis quedaba debajo del pliegue (encargo §5 y §10). |
| D-15 | **Cobertura con lo que hace falta para leerla:** qué es un subtotal («falta algún dato») y, si el plan empezó a regir dentro del período, desde cuándo (`primerPlanDelPeriodo`). | «1 de 90 días con algún registro» de un plan activado hoy se leía como 89 días sin registrar. |
| D-16 | **Contraste de nutrición en una tabla** (una fila por comida: opción, cantidades, versión del plan) con un filtro de hechos, «Solo las que no registraron las porciones del plan», y «Ver más». | La lista de tarjetas ocupaba 5.500 px para 50 comidas; el filtro responde la pregunta sin un porcentaje global. |
| D-17 | **«¿Con qué información cuento?» muestra el objetivo que se revisa** y el corte lleva a lo nuevo desde esa revisión. | Para revisar un objetivo hay que tenerlo a la vista; continuidad entre resumen, análisis y origen. |
| D-18 | **Comparar etapas muestra, debajo de la tabla A/B, los gráficos** de sus métricas con el período de las dos etapas. Agrupar, acercar o cambiar la referencia mueven el gráfico, no la tabla. | Recorrido 4 del encargo (agrupar, acercar, referencia conservada, guardar y reabrir). |
| D-19 | **Retorno con `volver` en todas las salidas de la ficha**: acciones del Resumen, información para revisar y el enlace del panel de origen a la pestaña del área. La ficha en su estado inicial también es un lugar al que volver (`vista=resumen`). | Sin `volver`, ir al registro completo hacía perder el análisis; desde el Resumen inicial no aparecía «Volver a la ficha». |
| D-20 | **Corrección de la base (#153): la versión de un plan que ve la persona es su orden de activación** en API-PRJ-01 (`label`), en la línea de tiempo y en la ficha, como en la pestaña Plan (`numerosDeVersion`). El `version` de la fila es el token de concurrencia (09:255-257): un plan activado sin cambios era «v2» en la ficha y «Versión 1» en la pestaña Plan. El borrador no lleva número (DSH-03 `draftPlan` sin `version`). | Un mismo plan no puede tener dos números en dos pantallas. Prueba de regresión en `comprension.int-spec.ts`. |
| D-21 | **Los parámetros de una pregunta que son versiones de plan solo aceptan UUID.** | Con `IdOpaco` (cualquier texto) un texto libre podía viajar en la URL o quedar en una vista guardada. |
| D-22 | **Corrección de la base: un conflicto al guardar los indicadores** vuelve a leer la elección guardada y conserva lo marcado; guardar de nuevo es una decisión explícita. | El aviso decía «se volvieron a leer» sin hacerlo, y cada intento chocaba con la misma versión vieja. |
| D-23 | **Corrección de la herramienta:** `datos/regenerar.sh` escribe en `BE_TRABAJO`. | Escribía siempre en `trabajo/`: la regeneración de este paquete pisó `trabajo/demo-profesionales.txt` y borró `trabajo/estado.json` del paquete anterior (ver la evidencia). |
| D-24 | **`docs/ux/GUIA-UX-UI.md` reorganizada** en principios generales, website profesional y APK, con la regla de «una línea» aclarada (una línea de explicación; el contexto para decidir no se pliega) y la tabla de lo que se amplió o sustituyó. | Pedido de Dirección del 2026-10-09, dentro de este encargo. |
| D-25 | **Estados que no esconden nada:** «No pudimos completar esta parte» va antes que las observaciones; un solo «Reintentar» trae las series y lo que hay en el período; el acercamiento de un gráfico se suelta al cambiar de métricas, período o pregunta (no está en la URL). | Hallazgos del recorrido `funcional`: la falla quedaba debajo de la lista; con dos «Reintentar», uno no traía los gráficos; un acercamiento viejo dejaba el IMC sin puntos. |
| D-26 | **Las vistas guardadas se retoman desde el comienzo de Analizar** (solo para abrir) y, al abrir una, el panel sigue abierto con su aviso en el análisis armado. | Hallazgo de la regresión de #153: sin métricas no había cómo abrir una vista guardada. |
| D-27 | **Un lanzador versionado de PostgreSQL 16 local** (`herramientas/postgres-local`, embedded-postgres fijado en 16.14.0-beta.17): levanta :55442 con las bases pedidas y se apaga en orden con `pg_ctl stop -m fast` (`parar.mjs`, probado); Ctrl+C pasa por el mismo apagado (no se pudo probar sin una consola interactiva). | La guía de demostración daba por hecho un PostgreSQL que solo existía en la sesión de trabajo, y Docker no funciona en este equipo. En Windows, el `stop()` de la librería mata el proceso a la fuerza. |

## 3. Hitos

| # | Hito | Estado |
|---|---|---|
| 0 | Base y mapa: ramas, contratos, componentes, permisos; datos de hoy; capturas «antes» | Hecho: capturas «antes» de `6c8e0b4` sobre los datos del 9/10 (58/60; las dos fallas son un 503 de la base local, ver evidencia) |
| 1 | Diseño aplicado: jerarquía de las tres vistas y los seis recorridos sobre datos reales | Hecho sobre la pantalla misma (recorrido `mirar`), no en bocetos: de ahí salieron D-14 a D-19 |
| 2 | Dominio y lecturas: síntesis, cortes de revisión, preguntas, etapas, retorno | Hecho (c1a23aa), corregido después (D-20, D-21) |
| 3 | Resumen y preguntas | Hecho (cc17ba2, 96cbb49) |
| 4 | Análisis, etapas y acciones | Hecho (cc17ba2, 1661c69) |
| 5 | Acabado visual y accesibilidad | Hecho: axe sin violaciones en 18 pantallas (compilación final), teclado, zoom al 200 %, dos temas; el lector de pantalla con una persona queda pendiente |
| 6 | Recorridos finales y revisión propia | Hecho: capturas, `funcional`, `revocacion` y regresión de #153 sobre una sola compilación y una sola generación de datos; crítica en la evidencia |
| 7 | Entrega en borrador | Hecho: PR #154 en borrador contra `wp-dashboard-profesional`, sin merge ni despliegue |
