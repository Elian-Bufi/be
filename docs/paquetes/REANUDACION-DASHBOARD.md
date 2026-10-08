# Reanudación de WP-DASHBOARD-PROFESIONAL

> Es el archivo de reanudación del encargo de Dirección del 2026-10-08, «BE · Entorno profesional de seguimiento y
> análisis longitudinal». Se actualiza después de cada hito, para poder seguir si la sesión o la memoria se cortan.
> **No es evidencia:** lo probado y su resultado están en `EVIDENCIA/DASHBOARD-PROFESIONAL/LEEME.md`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-profesional`, desde `main` en `ace91eb`, en el árbol `../BE-Best-entrenamiento` (que tiene su `node_modules`) |
| Definición del paquete | `docs/paquetes/WP-DASHBOARD-PROFESIONAL.md` |
| Evidencia | `EVIDENCIA/DASHBOARD-PROFESIONAL/` |
| Arreglos de la candidata, que **no se tocan** | #151 (`arreglo/foto-comida-diferente`) y #152 (`arreglo/sesion-en-curso-al-iniciar`), contra `main` y sin integrar. Este paquete no depende de ellos y no es requisito para publicarlos |
| Datos de `test` | **No se usan.** DEMO-A01, sus sesiones (la del 6/10 sigue abierta) y sus planes no se tocan. Todo se prueba en local, con datos sintéticos propios |

## Límites del encargo (no se extienden)

- **Sí:** investigar, diseñar, desarrollar en esta rama, migraciones y contratos aditivos estrictamente necesarios,
  pruebas reversibles en local y en CI con datos sintéticos, y un PR en borrador con evidencia.
- **No:** merge, despliegue, publicación de una APK, gastos, servicios externos ni cambios en los permisos del asesorado.
- **Memoria de la máquina:** un proceso pesado por vez (build del website, API con PostgreSQL, Chrome) y como máximo
  dos agentes al mismo tiempo. No se arranca el emulador. Se apagan los procesos al terminar cada recorrido.

## Hitos

| # | Hito | Estado | Commit |
|---|---|---|---|
| 1 | Delta, investigación, especificación y definición del paquete | Hecho | `aa24073` |
| 2 | Dominio: diccionario de métricas, agregaciones, línea de tiempo y comparación de períodos, con pruebas | Hecho | `a1d94ce` |
| 3 | API: API-DSH-04 (línea de tiempo), API-PRJ-01 (proyecciones), vistas guardadas, con migración y pruebas de integración | Hecho | `a54b769` |
| 4 | Datos sintéticos reproducibles de 12 semanas y resultados esperados | Hecho | `fce8f98` |
| 5a | Website: Resumen, Línea de tiempo y Analizar dentro de la ficha; rendimiento, fallas y día en curso | Hecho | `ec175d8` |
| 5b | Revisión visual, diseño de escritorio, exportación CSV y recorrido real automatizado (`recorrido.mjs`, 86/86) | Hecho | (este commit) |
| 6 | Recorridos reales, capturas, accesibilidad, rendimiento y matriz de aceptación | Pendiente | — |
| 7 | PR en borrador con la CI del head final | Pendiente | — |

## Decisiones tomadas (resumen; el detalle está en la definición del paquete)

- Arquitectura A: tres vistas dentro de la ficha del asesorado (B10-08 §4 y §32), sin un `/dashboard` universal.
- Línea de tiempo = **API-DSH-04** con la ruta del 09 (`GET /advisees/{id}/timeline`). Proyecciones = **API-PRJ-01**
  (`GET /advisees/{id}/projections/{key}`). La guardia `scripts/trazabilidad-de-operaciones.test.cjs` exige la ruta del 09.
- Las vistas guardadas son una familia propia de BE (`VAN`, DL-128), declarada en `FAMILIAS_DE_BE` de la guardia de
  trazabilidad.
- **Entrenamiento por número de serie:** carga, repeticiones y RIR se comparan serie 1 con serie 1, sesión por sesión.
  Se descartó «la serie más pesada» porque el 09 prohíbe máximos, sumas y promedios entre series (09v10:1285-1295).
- **Nutrición:** el día es la suma exacta de lo conocido (subtotal si falta algo); la semana es la media de los días con
  valor, con su denominador. La anulación queda fuera y la rectificación cuenta una vez.
- **Antropometría:** cada toma es un punto; los tramos se cortan por grupo de comparabilidad y por
  `incomparableWithPrevious`. ANT-06 conserva su límite de 92 días; la proyección lee hasta 366.
- **Línea de tiempo:** orden por fecha del hecho descendente, con hora primero, `recordedAt` y el id; cursor opaco
  en base64url de esa clave. `q` busca en el período completo.
- **API (hito 3):** módulo `apps/api/src/analisis`. DSH-04 y PRJ-01 usan `PdpGuard` como DSH-03 (decisión por
  alcance; 404 sin ninguno). La validación de la consulta recibe también los parámetros de ruta (cambio mínimo en
  `pdp.guard.ts`). PRJ-01 con el alcance de su clave denegado y otro permitido: 200 `NOT_AVAILABLE_TO_VIEW`. Las
  series se arman después del COMMIT (como ANT-06). ANT-06 se refactorizó sin cambiar su forma: `seriesDeEvolucion`
  y `leerFilas` son compartidas, con el tope de días como parámetro (92 en ANT-06, 366 en la proyección).
- **Vistas guardadas:** tabla `vista_de_analisis` (migración 20261008120000), índice único parcial para los
  indicadores del Resumen, CHECK de nombre, versión y configuración. Hard delete auditado; 404 neutral para lo ajeno.
- **Datos sintéticos (hito 4):** `herramientas/datos/regenerar.sh` arma todo desde cero en `be_test_dashboard`: API
  real para cuentas, vínculos, borradores y lo reciente; SQL con fechas explícitas para la historia, con los disparadores
  activos y los hechos en la misma transacción. Un profesional con los tres alcances, el asesorado B con vista parcial y
  un tercero. `verificar.mjs` compara con valores escritos a mano: 25/25 (y detecta una mutación).
- **Antropometría en la proyección:** todas las tomas (dos el mismo día son dos puntos); ANT-06 sigue con un punto por
  día. El objetivo reemplazado rige hasta que empieza su sucesor.
- **Captura futura:** solo investigada (F-12 y F-13 en el diccionario); recomendación: circunstancias de la medición,
  esfuerzo percibido de la sesión y eventos de enfermedad, en ese orden.
- **Website (hito 5a):** `apps/web/src/app/pro/advisees/seguimiento/`. Pestañas y período en la URL; `q` nunca. Lecturas
  con guarda de respuesta tardía (contador de generación). recharts con carga diferida.
- **Rendimiento (PRO-24):** el Resumen hacía unas 15 lecturas y tardaba más de 4 s. Ahora: las sesiones se cargan en
  lote (`ejecucionesApi`, sin N+1), la línea de tiempo devuelve `periodCounts` (conteos por tipo, rasgo y cargas
  tardías, antes de los filtros) y la cobertura nutricional sale de la lectura de lo disponible. Resultado: 10 lecturas
  en dos olas, ~0,4 s.
- **Límite de lecturas protegidas:** 120 por minuto por profesional (el de siempre). Explorar muy rápido puede tocarlo:
  la pantalla dice «muchas consultas seguidas, esperá un minuto» con «Reintentar», distinto de la falta de red o de un
  servicio caído (`motivoDeFalla` y `textoDeFalla` en `contexto.tsx`). Una falla nunca se muestra como «sin datos».
- **Día en curso:** la serie ya marcaba `partialBucket`, pero ni la media del período ni la referencia lo usaban (con el
  desayuno de hoy, la media de 7 días bajaba ~240 kcal). Ahora la media y la mediana dejan fuera los baldes incompletos
  y dicen cuántos; el total los cuenta y lo dice; dos totales no se restan si alguno está incompleto
  (`PERIODO_INCOMPLETO`). En el gráfico son puntos huecos; la lectura, el detalle y la tabla dicen «día en curso».
- **Cambio relativo:** la referencia (regla, rango, valor, n, subtotales e incompletos) se muestra junto al control, y el
  panel de lectura da el cambio y el valor real.
- **Escritorio primero (Elián, 2026-10-08):** el entorno profesional es para escritorio; lo responsivo se conserva y solo
  tiene que no romperse. Contenedor de la ficha hasta 100rem; pestañas y período en una fila; Analizar en tres columnas
  desde 1280 px (selección y opciones | gráficos | lectura fija al costado) y en dos desde 1024 px; Resumen con los
  indicadores arriba y cobertura y últimos hechos lado a lado; el registro original en un panel lateral derecho.
- **Gráficos:** marcas según la densidad (con 90 días no se pisan; no se quita ningún punto) y altura según el ancho; en
  paneles separados la línea es continua (el rayado y el punteado quedan para cuando las series comparten gráfico); los
  hitos tienen su lista en texto. La calidad completa se dice «sin faltantes» (no choca con «día en curso»).
- **Exportación CSV (PRO-10 y PRO-20):** `exportacion-del-analisis.ts` en el dominio; arma en el navegador lo que la tabla
  muestra, con período, zona, método, calidad, cobertura y fecha de generación; `;` y coma decimal, UTF-8 con BOM;
  celdas de texto protegidas contra fórmulas; el archivo no lleva el nombre de nadie. Sin operación nueva en la API.
  La impresión no se ofrece: el tema oscuro y los controles exigirían una hoja de impresión propia (pendiente declarado).
- **Otros arreglos de la revisión:** «Otro rango» arranca del período vigente; borrar una vista guardada pide
  confirmación; un conflicto de versión recarga la lista de verdad; el día de la línea de tiempo con mayúscula solo al
  principio; plurales; el aviso de falla no se anida.
- **Recorrido real (`herramientas/recorrido.mjs`):** Chrome contra la web y la API locales; interactúa con los controles
  y comprueba resultados: filtros, paginación, búsqueda fuera de la URL, registro original con foco y posición, preset,
  cuarta métrica, teclado, origen de un punto, vuelta desde Nutrición, cambio relativo, comparación, CSV, vista guardada
  reabierta en otra sesión y borrada, respuesta tardía (período y asesorado), vista parcial, tercero, fallas 503, 429 y
  sin red simuladas en el navegador, reflujo a 320 px, texto al 200 %, axe en seis estados y 30 capturas.
  **Antes de correrlo, reiniciar la API** (`entorno.sh parar-api` y `api`): el límite de inicios de sesión (5 cada 15
  minutos) vive en memoria y las corridas seguidas lo agotan.

## Pruebas al cierre de cada hito

| Hito | Prueba | Resultado |
|---|---|---|
| 1 | `verificar-legajo` | Íntegro (207 de 208, como en `main`) |
| 2 | `analisis-longitudinal.test.ts` (oráculos a mano, con mutaciones: media semanal por suma y anulados contados, las dos detectadas) | 30/30 |
| 2 | Dominio completo | 546/546 |
| 3 | `analisis.int-spec.ts` (17) + `schema`, `evolucion-antropometrica` y `dashboard` | 87/87 contra PostgreSQL 16 local (base `be_test_analisis`) |
| 3 | Mutación: el controlador ignora el PDP | La prueba «alcance revocado» falla, como debe; restaurado |
| 3 | Unitarias: dominio 547, scripts 289, API 79/80 | La que falla es `medios/rutas-firmadas.spec.ts`: intermitente y ajena (ver hallazgos) |
| 3 | `npm run typecheck` y `generar-openapi --verificar` | Sin errores; OpenAPI al día |
| 4 | `regenerar.sh` + `verificar.mjs` (valores a mano) | 25/25; con la cena de la etapa 1 alterada, 23/71: detecta |
| 4 | Dominio completo; integración `analisis` (18), `evolucion-antropometrica` y `schema` | 548/548; 77/77 |
| 4 | Tiempos locales con 12 semanas (API en Node, PG local) | Línea de tiempo 212 ms; nutrición 110 ms; entrenamiento 166 ms |
| 5a | Dominio: `analisis-longitudinal.test.ts` (conteos del período; día en curso fuera de la media, de la referencia y de la resta de totales) | 33/33 |
| 5a | Integración `analisis` con `periodCounts` (no cambian con los filtros; un alcance revocado no aporta ni un conteo) | 18/18 (una corrida con un 503 intermitente; ver hallazgos) |
| 5a | `tiempos.mjs 84 7` (12 semanas, mediana de 7 después de calentar) | Cada lectura ≤ 184 ms (máx.); Resumen completo 409 ms |
| 5a | Typecheck de la web y de la API; `contraste.test.cjs` | Sin errores; 12/12 |
| 5b | Dominio completo (con `exportacion-del-analisis.test.ts`: desconocido, cero, subtotal, día en curso, redondeo, zona y fórmulas) | 553/553 |
| 5b | `recorrido.mjs todo` (funcional + capturas, API recién reiniciada) | 86/86; axe sin violaciones en 6 estados; Resumen con la API en uso 779 ms; primera carga en frío 2.617 ms (dato) |

## Hallazgos fuera del paquete

- **Baja · CI intermitente:** `apps/api/src/medios/rutas-firmadas.spec.ts` altera el último carácter base64url de la
  firma. Cuando ese carácter es A, B, C o D (1 de cada 16 firmas, porque cambia con la hora de vencimiento) solo cambian
  bits de relleno y la firma sigue valiendo: la prueba falla sin un defecto real. Se arregla alterando un carácter del
  medio. No se toca en este paquete.
- **Baja · 503 intermitente en local:** en una de tres corridas de `analisis.int-spec.ts`, la proyección antropométrica
  de más de 92 días respondió 503 (P2028). Esa corrida tardó 48,7 s contra 21 s de las otras: la máquina estaba cargada
  justo después de compilar. No se reprodujo aislada ni en la corrida completa siguiente. Es el patrón documentado en
  EVIDENCIA/P2028 (transacción de lectura con el plazo por defecto). Se vigila en la CI; si aparece allí, se trata.

## Próximo paso

Ver la tabla de hitos: el primero «En curso» o «Pendiente».
