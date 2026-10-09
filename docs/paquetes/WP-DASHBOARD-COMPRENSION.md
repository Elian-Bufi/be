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
| Preguntas profesionales | `selector.tsx` → recorrido de preguntas | — (configuración) | Catálogo `PREGUNTAS_PROFESIONALES` del dominio, con parámetros tipados |
| Series, referencias y comparaciones | `analizar.tsx`, `lienzo.tsx`, `series.ts` | API-PRJ-01 | Observaciones (día, sesión o toma) y su agrupación visual |
| Etapas de planificación | Analizar: «Comparar etapas» | API-PRJ-01 (vigencias; `planVersionId`, extensión aditiva) | Versiones activadas (instante de activación, sucesora, cierre); la versión que ejecuta cada registro (clave foránea) |
| Contraste con lo indicado | Recorrido «¿Lo registrado coincide con lo indicado?» | Entrenamiento: API-TRN-19 + comparación existente; Nutrición: API-ING-03 | Prescripción vinculada a la ejecución; opción registrada con sus cantidades |
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

## 3. Hitos

| # | Hito | Estado |
|---|---|---|
| 0 | Base y mapa: ramas, contratos, componentes, permisos; datos de hoy; capturas «antes» | Hecho: capturas «antes» de `6c8e0b4` sobre los datos del 9/10 (58/60; las dos fallas son un 503 de la base local, ver evidencia) |
| 1 | Diseño aplicado: jerarquía de las tres vistas y los seis recorridos sobre datos reales | — |
| 2 | Dominio y lecturas: síntesis, cortes de revisión, preguntas, etapas, retorno | Hecho en dominio y API (dominio 583/583, scripts 291/291, integración 49/49); el retorno, en la web |
| 3 | Resumen y preguntas | — |
| 4 | Análisis, etapas y acciones | — |
| 5 | Acabado visual y accesibilidad | — |
| 6 | Recorridos finales y revisión propia | — |
| 7 | Entrega en borrador | — |
