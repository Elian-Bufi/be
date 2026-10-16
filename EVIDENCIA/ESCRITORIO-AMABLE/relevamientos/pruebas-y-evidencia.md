# Qué comprobaciones automáticas dependen hoy de los textos y la estructura de `/pro`

Trabajo de solo lectura: no ejecuté pruebas, compilaciones ni servidores. «En corrida» son los números de los JSON versionados de la última corrida; «en código», los sitios de llamada que conté. Los conteos de selectores y textos salen de una extracción por patrón y son aproximados.

**Prefijos (rutas absolutas):**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas`; `R` = `H\recorrido.mjs`; `RC` = `H\recorrido-comprension.mjs`
- `DP` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL`; `DC` = `REPO\EVIDENCIA\DASHBOARD-COMPRENSION`
- `SEG` = `REPO\apps\web\src\app\pro\advisees\seguimiento`; `DOM` = `REPO\packages\domain\src`

## Lo esencial

- **`apps/web` no tiene pruebas propias.** En CI lo cubren el typecheck, el build y 7 archivos de `REPO\scripts` (lógica pura y escaneo del código fuente, sin DOM).
- **La única verificación de pantalla son los recorridos con puppeteer `R` y `RC`.** No corren en CI y ubican por clase CSS más texto visible; no hay ningún `data-testid`, ni en los scripts ni en `apps/web/src`.
- **Renombrar los modos rompe una sola afirmación de texto** (`R:784`). Reordenarlos o cambiar su marcado rompe más, porque se eligen por índice.
- **«Energía» → «Calorías» rompe 2 pruebas de dominio y 3 puntos de los recorridos.** Además deja una prueba de integración pasando en falso (`REPO\test\integration\analisis.int-spec.ts:132`).
- **El mayor riesgo de debilitar son unas 25 comprobaciones negativas** del tipo «la pantalla NO dice X». Si X cambia de redacción, pasan sin proteger nada (lista en la sección 7).
- **Nadie compara capturas** y no hay lint (ESLint no está instalado ni configurado).

## 1. Pruebas del website

- **En `apps/web`: ninguna.** `REPO\apps\web\package.json:6-10` solo tiene `dev`, `build` y `typecheck`; no hay archivos `*.test.*` ni `*.spec.*`, ni jest, vitest o playwright.
- **Comando:** `npm test` en la raíz (`REPO\package.json:33`). Compila el dominio, corre `node --test dist/**/*.test.js` del dominio, 27 archivos de `scripts/` y el jest de la API.
- **Marco:** `node:test` con `node:assert/strict`. Los `.mjs` importan `.ts` directo y sin banderas, así que necesitan el Node 22.23.2 de `.nvmrc`; el `node` que resolvió mi shell es v20.15.1.
- **Tamaño (conteo estático de `test(`):** scripts 27 archivos y 295 casos (`DC\LEEME.md:55` informa 301/301); dominio 37 archivos y 571 casos (590/590 en corrida); API 14 `*.spec.ts`; integración 48 `*.int-spec.ts`.
- **Cómo ubican elementos:** no lo hacen. No hay DOM, rol, `data-testid` ni texto renderizado.

Los 7 archivos de `REPO\scripts\` que tocan el website:

| Archivo | Casos | Qué mira | Cómo |
|---|---|---|---|
| `copy-pantallas.test.cjs` | 6 sitios (8 en corrida) | Los `.tsx` de `pro/advisees/nutrition`, `pro/recipes`, `pro/advisees/anthropometry` y `pro/advisees/training` (:39-64) | AST de TypeScript: literales, plantillas y texto JSX contra las listas prohibidas (:94-107). Exige al menos 8, 5 y 7 archivos por dominio. Guardia de `className="medicion__fila"` con `effectiveMagnitude` (:131-147) y de «No realizada» (:158-170) |
| `contraste.test.cjs` | 12 (6 del website) | `tokens.css`, `globals.css` y todo `apps/web/src/**/*.{css,ts,tsx}` | Pares de tokens a 4,5:1 y 3:1 (:79-120, :161-174, :238-246); matiz y ΔE de `--metrica-1..3` (:201-228); ningún color literal fuera de tokens (:344-371) |
| `retorno-a-la-ficha.test.mjs` | 6 | `SEG\estado.ts` | Funciones puras: URL, `volver`, pregunta, corte |
| `evidencia-de-revision.test.mjs` | 4 | `REPO\apps\web\src\app\pro\advisees\evidencia.ts` | Funciones puras y textos exactos (:24, :52, :61) |
| `contexto-citable.test.mjs` | 7 | `REPO\apps\web\src\app\pro\advisees\training\contexto-citable.ts` | Funciones puras |
| `retorno-seguro.test.mjs` | 3 | `REPO\apps\web\src\lib\copy.ts` | `destinoSeguro` |
| `figura-de-lamina.test.cjs` | 2 | `REPO\apps\web\public\figura` | sha256 |

**Hueco de cobertura:** `copy-pantallas` no recorre `SEG\*` (Resumen, Línea de tiempo, Analizar), ni `workspace.tsx`, `espacio-profesional.tsx`, `pendientes.tsx`, `templates/`, `exercises/` ni `components/`. Los nombres nuevos que pongas ahí no pasan por ninguna lista de palabras en CI.

## 2. Recorridos con navegador

### Modos y cantidad de comprobaciones

| Script · modo | En corrida | Resultado versionado |
|---|---|---|
| `R funcional` | 70 (69 evaluadas y 1 dato) | `DP\resultados\01-recorrido-funcional.json`; regresión 70/70 en `DC\recorridos\regresion-recorrido-dashboard-profesional.json` |
| `R capturas` | 60 (PRO-23 ×30, PRO-08 ×30) | `DP\resultados\02-capturas-anchos-y-temas.json` |
| `R descartable` | 15 (PRO-10 ×10, PRO-20 ×5) | `DP\resultados\06-escenario-descartable.json` |
| `R todo` (por omisión) | `funcional` más `capturas` | — |
| `RC mirar [ancho] [tema]` (por omisión) | 20, una por pantalla | No se versiona; el LEEME dice 20/20 |
| `RC capturas` | 79 (CP-27 ×74, CP-01 ×2, GUIA-II.1 ×3) | `DC\recorridos\resultado-capturas.json` |
| `RC funcional` | 75 (66 evaluadas y 9 datos) | `DC\recorridos\resultado-funcional.json` |
| `RC revocacion` | 6 (R5 ×1, CP-23 ×5) | `DC\recorridos\resultado-revocacion.json` |
| `RC clases` (`RC:1454`, fuera del texto de uso) | 4 y 1 dato, en código | No encontré resultado |

- **En código:** `R funcional` tiene 60 `comprobar(`, 5 `comprobarGraficos(` y 1 `informar(`.
- **Comportamiento ante una falla:** `R` aborta el modo entero en la primera excepción (`R:1206-1207`), así que un selector que falta al principio tapa todo lo que sigue. `RC` aísla por parte (`RC:55-61`).
- **Otros scripts de `H`:** `humo.mjs` no comprueba nada (3 capturas `fullPage`); `tiempos.mjs` y `datos\verificar.mjs` van contra la API, sin pantalla.

### Qué necesitan para correr

- **Node 22 en el PATH** (`H\entorno.sh:8`) y **Chrome en una ruta fija**, `C:/Program Files/Google/Chrome/Application/chrome.exe` (`R:73`, `RC:75`).
- **`npm ci` en la raíz:** `puppeteer-core` y `axe-core` son devDependencies de la raíz (`REPO\package.json:40-43`). También hace falta `packages/domain/dist` compilado (`R:39`).
- **PostgreSQL 16 local en :55442** (`H\postgres-local\iniciar.mjs`, embedded-postgres, sin Docker). La base es `be_test_dashboard` para `R` y `be_test_comprension` para `RC`.
- **API compilada en :3001:** `entorno.sh compilar-api` y `entorno.sh api [BE_DEMO_PROFESIONALES]`.
- **Website como export estático,** no en dev: `entorno.sh compilar-web` y `entorno.sh web` lo sirven en :3000 con la CSP de `render.yaml` (`H\servir-web.mjs`). Las URL están fijas en `R:27-28` y `RC:28-29`.
- **Datos:** `H\datos\regenerar.sh` para `R`, o `H\datos\regenerar-comprension.sh` para `RC`. Dejan `estado.json` en la carpeta de trabajo, que git ignora.
- **Variables:** `BE_TRABAJO`, `BE_E2E_DATABASE_URL` (obligatoria si la carpeta no es `trabajo/`, `entorno.sh:16-19`), `BE_REPO`, `BE_PG_DATOS`.
- **Cuentas descartables** para `descartable` y `revocacion`: `node datos/generar.mjs descartable-cuentas`, reiniciar la API con `demo-profesionales-descartable.txt`, y `node datos/generar.mjs descartable-datos`.
- **Límites:** 5 inicios de sesión cada 15 minutos, en memoria; conviene reiniciar la API antes de cada corrida (`DP\ACEPTACION.md:36-37`).
- **Orden:** `RC funcional` registra una revisión sintética (`RC:570-571`), así que `capturas` va antes y hay que regenerar para repetir.

**Estado de la máquina ahora (lo observé, no toqué nada):**
- Los puertos 3000, 3001 y 55442 están en escucha.
- `estado.hoy` vale 2026-10-08 en `H\trabajo` y 2026-10-09 en `H\trabajo-comprension`, y hoy es 2026-10-10. Varias comprobaciones comparan contra «hoy» (`R:493`, `R:647`), así que hay que regenerar.
- `trabajo-comprension\estado.json` no tiene `descartable`, y en `trabajo\estado.json` figura con `datos=false`. `revocacion` y `descartable` abortarían hasta regenerar esas cuentas.

### Dependencia de selectores y textos

- **`R`:** unos 211 usos de selector (93 distintos, unas 50 clases o ids) y 126 patrones de texto: 49 clics por texto, 3 etiquetas de campo y unas 90 regex.
- **`RC`:** unos 232 usos de selector (131 distintos, unas 75 clases o ids) y 116 patrones de texto: 46 clics por texto, 4 etiquetas y unas 88 regex.
- Las regex son en su mayoría sobre texto de pantalla; algunas van sobre URL, CSV o el registro de la API.
- **Por rol o aria, muy pocos:** `nav[aria-label="Vistas del seguimiento"]` (×6 en `R`) y `section p[role="status"]`.
- **También por índice de elemento** y por clases internas de recharts.

**Los 30 más usados en `R`** (subcadena, incluye selectores compuestos):
- Selectores: `dialog[open]` ×26; `details.vistas-guardadas` ×17; `.panel-de-lectura` ×12; `recharts-*` ×11; `.entrada` (con `__area`, `__titulo`) ×10; `.referencias` ×9; `.analizar__lienzo` ×9; `figure.grafico__figura` ×8; `.grafico__lienzo` ×8; `nav[aria-label="Vistas del seguimiento"] a` ×6; `section p[role="status"]` ×5; `.indicador` ×4; `.linea-de-tiempo__dia` ×4; `.referencia-del-cambio` ×4; `.grafico__titulo` ×3; `.metricas-elegidas` ×3; `.agregar-metrica` ×3; `.filtros-de-linea` ×3; `.periodo-del-seguimiento__opciones button` ×3; `.parametros-de-pregunta`, `.analizar__opciones label`, `.leyenda`, `.exportar` y `.apariencia select` ×2 cada uno.
- Textos: «no está disponible (con tu acceso actual)» ×9; «N hechos coinciden» ×5; «Ver el origen de este dato» ×4; «Ver más» ×4; «Descargar los datos (CSV)» ×3; «Ver en Nutrición» ×3.
- «Superpuestas» aparece ×3, pero solo una vez como afirmación (`R:784`). «Cambio relativo» aparece ×5, solo en descripciones.

**Los 30 más usados en `RC`:**
- Selectores: `.evidencia__*` ×26 (dentro de `#revision-evidencia` ×10 y `#trn-revision-*` ×9); `dialog[open]` ×18; `.observacion` (con `__alcance`, `__texto`, `__pie`, `[data-regla]`) ×17; `.encabezado-de-bloque` ×11; `.parametros-de-pregunta` ×10; `details.vistas-guardadas` ×8; `.apariencia select` ×6; `.acciones-del-resumen` ×6; `.contraste` ×6; `.tabla-de-etapas` ×6; `.panel-de-lectura` ×5; `.capa` ×5; `details.comparar-a-mano` ×5; `.editor-de-indicadores` ×5; `.comparacion-de-etapas` ×4; `data-clase` ×4; `figure.grafico__figura` ×3; `.retorno-a-la-ficha a` ×3; `.tabla-de-planificacion tbody tr` ×3; `.ficha__acceso` ×3; `.para-tu-revision` ×3; `h1` ×3.
- Textos: «sin registros» ×8; «con valor» ×7; «Ver todas» ×7; «Volver a la ficha» ×6; «no está disponible» ×6; etiqueta «Ejercicio» ×5; «Reintentar» ×4; «Para tu próxima revisión» ×3.

Verifiqué en `apps/web/src` que estos ganchos existen (por ejemplo `SEG\analizar.tsx:537-539` y `SEG\resumen.tsx:484-490`).

### Qué protege cada bloque

**`R funcional` (`R:462-979`):**

| Líneas | Claves | Comportamiento protegido |
|---|---|---|
| 466-482 | PRO-01, 02, 11, 12, 15 | Tres pestañas con texto exacto; 4 indicadores; media sin el día en curso; cobertura con denominador y sin «%» |
| 484-585 | PRO-03, 04, 05, 16, 17 | Orden por fecha del hecho y carga tardía; rectificado y anulado; filtros en la URL; «Ver más» sin repetir; el texto buscado nunca viaja en una URL; Esc devuelve foco, posición y URL |
| 595-829 | PRO-06 a 11, 18, 19, 22, 26 | Tres paneles; la cuarta métrica pide reemplazo; gráficos dibujados de verdad (DOM y píxeles); superposición y relativo bloqueados con su motivo; la referencia no se mueve con el zoom; teclado; «Sin dato… No es simultáneo»; comparación sin causas; CSV; vistas guardadas |
| 831-855 | PRO-21 | Una respuesta tardía no pisa a otra ni mezcla personas |
| 857-869 | PRO-20 | Vista parcial; el selector ofrece solo áreas permitidas |
| 871-895 | PRO-21 | 503 parcial con «Reintentar»; un 429 no es «sin datos»; sin red no hay ceros |
| 897-914 | PRO-22, 23, 25 | Reflujo a 320 px; texto al 200 %; axe en 5 vistas; sin errores de JavaScript |
| 916-978 | PRO-19, 20, 04 | La vista se reabre en otra sesión; un tercero ve «No encontramos un recurso disponible» sin pestañas ni valores; el registro de la API no tiene el texto buscado |

**`R capturas` (`R:983-1041`):** 2 temas × 5 anchos (1440, 1280, 1024, 768, 390) × 3 vistas. Comprueba que no haya desborde, exactamente 3 pestañas y 5 botones de período (`R:1007`), y los gráficos dibujados.

**`R descartable` (`R:1051-1197`):** clases del dato (medido, reportado, calculado) en gráfico, leyenda, lectura, tabla y CSV. Después, el corte al revocar: no sale archivo, el origen no repite el valor, los gráficos se retiran y la línea de tiempo queda sin tomas.

**`RC`:**

| Bloque (líneas) | Claves | Comportamiento protegido |
|---|---|---|
| `mirar` (307-414) | MIRAR | 20 pantallas: sin desborde, axe sin violaciones, sin doble desplazamiento, sin errores |
| `capturas` (423-541) | CP-27, CP-01, GUIA-II.1 | Cinco anchos y dos temas; primera observación visible a 1440×900 (`RC:471-476`); lo principal por encima de y=800 a 1280×800 (`RC:484-499`) |
| `recorridoConsulta` (579-715) | CP-01, 02, 03, 05, 07, 21, R1 | Orden de los `h2` y cero gráficos en el Resumen; cada observación con alcance, hecho, «Sale de» y acción; ninguna califica; mirar no escribe; foco y retorno |
| `escenarioUnaArea` (721-748) | CP-04, 08 | Con una sola área no hay filas ni conteos de las otras |
| `recorridoNutricion` y `evidenciaDeLaRevision` (751-903) | R3, CP-09, 24 | El modo de registro no es una diferencia; sin confirmar no pasa a consumido; el detalle no disponible va sin valores; nada marcado al abrir; cancelar no escribe |
| `coberturaConHuecos` y `recorridoEtapas` (910-1087) | CP-14, 17, 18, 26, R4 | Un hueco no sale del denominador (nunca «N de N días»); semana y zoom no cambian la tabla; la letra no baja de 0,95 rem (`RC:1024-1030`) |
| `clasesDelDato` (1090-1133) | CP-11, 12, 13 | Clase por forma; el aro de selección va debajo de la marca; el IMC es un índice |
| `recorridoRecuperacion` (1159-1222) | CP-06, 22, R6 | Una falla de lectura no se muestra como «no hay novedades» y va primero; el conflicto conserva lo elegido |
| `accesibilidad` (1225-1264) | CP-28 | Tab alcanza las acciones con foco visible; zoom al 200 %; ningún enlace o botón sin nombre en el árbol de accesibilidad |
| `recorridoEntrenamiento` (1287-1367) | CP-09, 19, 20 | Preparar no escribe; registrar hace un solo POST |
| `revocacion` (1376-1444) | R5, CP-23 | La cabecera deja de decir «Activo» sin recargar; los gráficos se retiran; exportar no da archivo |

### Otros scripts con puppeteer sobre `/pro` (de paquetes anteriores, fuera de CI)

- **`REPO\EVIDENCIA\ENTRENAMIENTO-SERIES\herramientas\recorrido\recorrido-web.mjs`** (unos 18 controles) y **`recorrido-web-ejecuciones.mjs`** (unos 9): cubren `/pro/exercises` y la pestaña Entrenamiento. Usan botones por texto («Crear plan», «Agregar sesión», «Validar plan», «Activar plan») y `.lista__titulo`, `li.lista__item`, `table.tabla--objetivos`.
- **`REPO\EVIDENCIA\NUTRICION-RECETAS\herramientas\recorrido\recorrido-web.mjs`** (unos 14) y **`recorrido-web-registros.mjs`** (unos 10): cubren `/pro/recipes` y Nutrición. Usan «Guardar receta», «Agregar ítem», «Cargar imagen», y `#receta-nombre`, `figure.figura-de-receta img`, `table.tabla--calculo`.
- **`REPO\EVIDENCIA\PULIDO-0.13.2\web\candidata\herramientas\*.mjs`:** solo capturas de Antropometría, sin comprobaciones. Cargan `puppeteer-core` desde un directorio temporal de otra sesión, así que no son reproducibles tal cual.
- **`REPO\scripts\auditoria-accesibilidad.mjs`:** axe en 21 pantallas × 2 anchos; pide `BE_WEB_URL` y `BE_AUDITORIA_CUENTAS`. Navega por texto exacto (:55-58). Por lectura está desactualizado: busca «Asesorado», «Abrir Nutrición» y «Abrir Entrenamiento», pero la miga hoy dice «Ficha del asesorado» y `tarjetas-de-dominio.tsx` no tiene importadores. No lo ejecuté.

## 3. Pruebas del dominio que fijan textos

Se corren con `npm test -w @be/domain` (después de `tsc`) y están en CI.

**Listas de términos prohibidos:**
- `DOM\copy-nutricion.ts:130-147`: adherencia, cumplido, incumplido, cumplimiento, %, puntaje, score, comida trampa, desvío, bien, mal, entre otros.
- `DOM\copy-antropometria.ts:298-317`: diagnóstico, interpolado, imputado, se completó, peso ideal, sobrepeso, normal, anormal, score, puntaje, eliminar medición. Admite las negaciones (:324-336).
- `DOM\copy-entrenamiento.ts:237-257`: score, puntaje, cumplimiento, adherencia, fatiga, progresar, volumen, marca personal, efectividad. Además prohíbe «%» salvo «% RM» (:259-267).
- `DOM\copy-formularios.ts:123-131`, `DOM\cartera.ts:117-120` (inactivo, riesgo, alerta, semáforo, ranking, racha) y `DOM\copy-integraciones.ts:62`.
- `DOM\sintesis-del-resumen.ts:444`: `PALABRAS_QUE_CALIFICAN` (mejor, peor, cumpl, adherencia, riesgo, alerta, bien, mal, suficiente, debería, fall).

**Pruebas que las aplican al copy:**
- `DOM\dominio-wp04.test.ts:508-515`, `dominio-wp05.test.ts:373-405`, `contratos-wp06.test.ts:423-431`, `contratos-wp07.test.ts:147-156`, `contratos-wp08.test.ts:139-151`, `cartera.test.ts:55-58`.
- `DOM\comprension-del-dashboard.test.ts:635-647`, `:690` y `:737-738`.
- Sobre nombres de campos del contrato: `dominio-wp04.test.ts:466`, `dominio-wp05.test.ts:283` y `contratos-wp06.test.ts:339`.

**Textos exactos fijados con `assert.equal`, `deepEqual` o `match`:**

| Archivo | Qué fija |
|---|---|
| `DOM\comprension-del-dashboard.test.ts:555-563, :581-585, :619, :632` | Textos de la síntesis: «Desde la revisión del 20/9», «En el período seleccionado», «No pudimos completar esta parte (…)», «No hay registros nuevos…» |
| mismo archivo, `:301-317, :354-380` | Cobertura: «14 días: 2 con valor», «12 sin registros», «hoy, en curso: fuera de la media», «3 sesiones: 2 con valor» |
| mismo archivo, `:713-735` | «Igual a lo indicado», «Distinta de lo indicado en 1 de 2 ingredientes», «No se puede comprobar: sin confirmar», «No se compara: fuera de lo indicado» |
| `DOM\analisis-longitudinal.test.ts:127, :539` | «Energía registrada» |
| mismo archivo, `:785-791, :814-855` | Resumen en texto; «Reportado por la persona, no medido»; «Calculado por un método» |
| `DOM\exportacion-del-analisis.test.ts:88-103, :130-136, :163, :200` | Celdas y cabeceras del CSV; nombre del archivo |
| `DOM\recetas-y-registro.test.ts:40-56` | En `:52`, las etiquetas de nutriente ya son «Calorías», «Carbohidratos», «Grasas», «Proteínas» |
| `DOM\cartera.test.ts:56-57` | «Revisión vencida hace 1 día», «Revisión hoy» |
| `DOM\comparacion-de-entrenamiento.test.ts:161, :215-216, :244` | «dentro del rango», «−1 del mínimo», «+2 del máximo» |
| `DOM\evolucion-antropometrica.test.ts` (unas 22 líneas) y `DOM\entrenamiento-por-serie.test.ts:311-312, :548-553` | Textos de Evolución y de series |

**Lo que ninguna prueba fija:** los textos de las preguntas (`DOM\preguntas-profesionales.ts:43-86`). Solo los usan los recorridos, por fragmento: `R:602`, `RC:363`, `RC:672`, `RC:1240`.

**Textos que arma la API:** los títulos y etiquetas de la línea de tiempo salen de `REPO\apps\api\src\analisis\lectura-linea-de-tiempo.ts:102-386`. Los fija la integración en `REPO\test\integration\analisis.int-spec.ts:132, :342` y `comprension.int-spec.ts:120-121, :155, :159`.

## 4. CI

`REPO\.github\workflows\ci.yml` se dispara con push a `main` y a `wp-*`, y con PR a `main` (:5-9). Cancela la corrida anterior de la misma rama (:13-16).

| Job | Qué corre | ¿Toca el website? |
|---|---|---|
| `legajo` (:19-25) | `bash scripts/verificar-legajo.sh` | No |
| `verificar` (:27-49) | `npm ci`; `npm run typecheck` (incluye `tsc --noEmit` de `@be/web`); OpenAPI sin drift; `npm test`; build de la API; `npm run build:web`; `npm run audit:prod` | Sí: typecheck, los 7 scripts de la sección 1, build y auditoría de dependencias |
| `integracion` (:51-70) | Integración de la API con PostgreSQL 16 (Testcontainers) | Solo por los textos que arma la API |
| `imagen-api` (:72-121) | Imagen Docker y humo | No |

- **`legajo` sí verifica `docs/MANIFEST.sha256`:** 207 de 208 entradas, byte a byte. El manifiesto cubre `docs/LEEME.md`, `actas/`, `fuente_escolar/`, `intake/`, `legajo/` y `mesa/`; no incluye `docs/ux/` ni `docs/paquetes/`. Editar la guía de UX no lo rompe.
- **No hay** lint, job de accesibilidad, puppeteer ni comparación de capturas. Busqué pixelmatch, snapshot, looks-same, odiff, percy y chromatic fuera de `node_modules`, sin resultados.
- **`apk.yml`** es manual o por tag `apk-v*` y no toca el website.
- **Despliegue:** Render despliega `be-web` desde `main` cuando pasan los checks (`REPO\render.yaml:66-73`).

## 5. Guía de UX (`REPO\docs\ux\GUIA-UX-UI.md`, 835 líneas, en borrador a ratificar)

**Índice (línea):**
- 29 Parte I · Principios generales: 31 I.1 Principios; 65 I.2 Texto; 97 I.3 Avisos y diálogos; 109 I.4 Estados; 128 I.5 Accesibilidad, tamaño y letra; 141 I.6 Color y temas; 161 I.7 Datos, cálculos y gráficos.
- 179 Parte II · Website profesional: 185 II.1 Escritorio primero; 200 II.2 Superficies mates; 210 II.3 Navegación transversal; 231 II.4 Contexto suficiente para decidir; 255 II.5 Continuidad; 278 II.6 Patrones del entorno de seguimiento; 321 II.7 Estados; 336 II.8 Componentes y patrones; 376 II.9 Pestaña Antropometría; 393 II.10 Website del asesorado y cara pública.
- 410 Parte III · APK: 412 III.1; 468 III.2; 506 III.3; 526 III.4; 628 III.5; 654 III.6.
- 676 Parte IV · Verificación: 678 IV.1 Lista de control por pantalla; 724 IV.2 Cómo se verifica.
- 744 Parte V · Qué cambió el 2026-10-09: 750 V.1; 779 V.2.
- 802 Lo que se sabe que falta.

**Reglas que nombran cosas concretas de pantalla:**

| Línea | Regla |
|---|---|
| 187-191 | Anchos 1440, 1280 y 1024; a 768 y 390 no se rompe. Lo principal en la primera pantalla a 1280×800; a 1440×900, además, la primera observación |
| 194-196 | En Analizar, tres zonas desde 1280 px (lo que se elige, los gráficos y la lectura) y dos desde 1024. En el Resumen, «Para tu próxima revisión» y las acciones lado a lado. El orden del documento no cambia |
| 197-198 | Sin doble desplazamiento; el panel de lectura va sin barra propia |
| 202-208 | Superficies mates: `.seccion`, `.subseccion`, `.panel`; sin vidrio ni degradé |
| 212-229 | Nombre como título; acceso por área en una línea con «Actualizar»; tres pestañas; miga «Ficha del asesorado»; URL solo con identificadores; «Volver a la ficha, donde estabas»; pestañas en una línea |
| 234-253 | Cada observación con área, alcance, hecho, «Sale de…» y acción; formato de la cobertura sin porcentaje; «día en curso» |
| 269-274 | Evidencia por día; nada marcado al abrir; «Marcaste 12 de 73…»; «Lo que marcaste» y «Quitar»; nunca «examinado» |
| 280-283 | Orden del Resumen; cuatro observaciones a la vista y «Ver todas»; hasta cuatro indicadores |
| 284-288 | Preguntas principales y «Más preguntas»; «Ver la respuesta»; «Análisis personalizado» |
| 292-296 | Analizar: hasta tres métricas; **«paneles sincronizados por defecto»**; «Agrupar por» (cada registro, día o semana); la referencia solo en el modo relativo; el aro no tapa la marca |
| 297-314 | «Comparar otros dos períodos…» plegada; «Coincidencia temporal: no indica causa» una sola vez; etapas A y B; textos del contraste |
| 324-334 | El encabezado deja de decir «Activo»; lo que falta va primero; un solo «Reintentar» |
| 341-363 | Tabla de piezas: `.encabezado-de-bloque` («Ver todas (8)»), `.boton--compacto` (44 px), `.desplazable-x`, `.observacion`, `.tarjeta-de-pregunta`, `.aviso-de-filtro` |
| 132-139 | Objetivos de 44 px (`2.75rem`); zoom al 200 %; no se achica la letra |
| 143-159 | Solo tokens; 4,5:1 y 3:1 («íconos que comunican», línea 152); el acento no decora; el significado no va solo en el color |
| 163-175 | Tabla equivalente; medido, reportado y calculado se distinguen por forma; un hueco se dibuja como hueco |
| 38-45 | Ni verde ni rojo, ni semáforos, ni porcentajes de cumplimiento |

**«Formas distintas por métrica»:** la guía lo dice en general (líneas 159 y 170). La regla concreta (círculo, cuadrado, triángulo; línea continua, rayada, punteada) vive en `SEG\lienzo.tsx:26-30`.

**Qué se verifica automáticamente:**
- **En CI:** palabras prohibidas con `copy-pantallas` (la guía lo cita en la línea 693; no cubre la ficha); tokens y contraste con `contraste.test.cjs` (línea 705); reglas del dominio.
- **A mano, con los recorridos:** primera pantalla (`RC:471-499`); anchos, desborde y doble desplazamiento (`RC:455-469`, `R:991-1008`); letra de la cobertura de al menos 0,95 rem (`RC:1030`); teclado, foco y zoom (`RC:1229-1262`, `R:627-648`, `R:899-906`); «Sale de» (`RC:603-607`); estados; axe.
- **Nadie lo verifica:** los 44 px en el website (solo la APK tiene pruebas de 48 dp), las «tres zonas», las superficies mates, la forma por métrica (solo de costado, por el texto de la leyenda en `R:784` y los píxeles por color) y el lector de pantalla.

## 6. Evidencia de aceptación

**`DC\ACEPTACION.md`:**
- P-1 a P-5 en las líneas 21-25, con columnas `# | Qué se pidió | Evidencia | Cómo | Estado`.
- CP-01 a CP-30 en las líneas 29-58, con columnas `ID | Criterio | Evidencia | Cómo | Estado`.
- De las 35 filas, **6 citan un `.png` concreto** (P-1, P-2, P-3, CP-01, CP-06, CP-12) y CP-27 depende del conjunto de capturas.
- **21 citan un texto de pantalla entre «»** (P-1 a P-5; CP-02 a 06, 09, 12, 13, 15, 16, 18 a 21, 23, 24).
- 31 se apoyan en un recorrido con navegador; 4 no (P-5, CP-15, CP-16, CP-30).
- Las capturas están en `DC\antes`, `DC\despues` y `DC\recorridos`.

**`DP\ACEPTACION.md`:**
- PRO-01 a PRO-26 en las líneas 51-76, con columnas `ID | Escenario | Resultado esperado | Evidencia | Estado | Pendiente`.
- De las 26 filas, **2 citan un patrón `.png`** (PRO-02, PRO-07) y 7 citan capturas en total (se suman PRO-01, 08, 10, 20, 23).
- **14 citan textos entre «»**; 22 se apoyan en el recorrido.
- Las capturas están en `DP\capturas-web` y los resultados en `DP\resultados\01…07`.

Los nombres de captura llevan el nombre viejo de los modos (`analizar-superpuestas-*`, `analizar-paneles-*`, `analizar-relativo-*`); los generan `R:1015-1024` y `RC:505-513`. «Paneles sincronizados», «Superpuestas» y «Cambio relativo» aparecen 44 veces en 15 `.md` de `docs` y `EVIDENCIA`.

## 7. Si cambiás X, se rompe Y, que protege Z

**A. Pone la CI en rojo**

| # | Si cambiás | Se rompe | Protege |
|---|---|---|---|
| 1 | «Energía» en el catálogo de métricas (`DOM\metricas-del-analisis.ts:101`) | `DOM\analisis-longitudinal.test.ts:127` y `:539` | Que un subtotal no se llame consumo ni total diario; el formato del resumen en texto |
| 2 | Íconos SVG o estilos con `#hex` o `rgb()` en cualquier `.css`, `.ts` o `.tsx` de `apps/web/src` | `REPO\scripts\contraste.test.cjs:344-371` | Que todo color pase por tokens medibles |
| 3 | Tokens `--metrica-1..3`, `--grafico-*`, foco o bordes, o un verde, rojo o ámbar para métricas | `contraste.test.cjs:79-174, :201-228, :238-246` | Contraste AA en los dos temas; no calificar por color |
| 4 | Textos nuevos en `nutrition/`, `recipes/`, `anthropometry/` o `training/` con «%», «bien», «mal», «normal», «volumen», «progresar», «puntaje» | `REPO\scripts\copy-pantallas.test.cjs:94-107` | No calificar; un hueco no es un valor |
| 5 | Mover o renombrar archivos de esas carpetas, quitar `className="medicion__fila"`, o escribir «No realizada» en una pantalla | `copy-pantallas.test.cjs:96, :131-147, :158-170` | Mostrar el valor vigente; no derivar «no realizada» de la ausencia |
| 6 | Redacción de la síntesis, la cobertura o «frente a lo indicado» en el dominio | `DOM\comprension-del-dashboard.test.ts:301-380, :555-632, :713-735` | Que un hueco no sea cero; cortes por área; el modo no es una diferencia |
| 7 | Textos de `evidencia.ts` («Todavía no marcaste nada.», «Marcaste N de M…») | `REPO\scripts\evidencia-de-revision.test.mjs:24, :52, :61`; también `RC:867, :881, :1314` | Nada marcado al abrir; marcar no es examinar |
| 8 | Lectores de la URL en `SEG\estado.ts` (por ejemplo, al agrupar filtros) | `REPO\scripts\retorno-a-la-ficha.test.mjs` | El retorno validado; nunca texto libre en la URL |

Sobre la fila 4: el extractor también toma atributos como `aria-label`, `title`, props de íconos y `width="100%"`. Solo excluye `className`, `style`, `id`, `htmlFor`, `key` y `href` (`copy-pantallas.test.cjs:71-92`). Hoy no hay ningún «%» en `nutrition/` ni `recipes/`.

**B. Se debilita en silencio (lo más delicado)**

| # | Si cambiás | Qué pasa en falso | Protege |
|---|---|---|---|
| 9 | La etiqueta «Energía registrada» de la API (`REPO\apps\api\src\analisis\lectura-linea-de-tiempo.ts:184`) | `REPO\test\integration\analisis.int-spec.ts:132` busca la etiqueta vieja y espera `undefined` | Que un registro sin confirmar no muestre energía |
| 10 | Textos de estados vacíos o de error | `R:888` (`!/No hay hechos registrados/`), `R:893` (`!/No hay datos de ninguna área/`), `RC:1189` (`!/No hay registros nuevos/`) | Que un error no se muestre como ausencia de datos ni como cero |
| 11 | Textos de acceso | `R:965` (`!/Analizar|kcal|Peso muerto/`), `R:1182` (`/Descargado:/`), `R:1191` (`/Toma|kg/`), `RC:739`, `RC:746`, `RC:1430` (`!/Abrir Antropometría|Ver la toma/`) | 404 idéntico, corte al revocar, acceso parcial |
| 12 | Vocabulario | `RC:609-610` (seis palabras), `R:798` (`!/mejor|peor|gracias a|provoc|causó/`), `R:480` (`!/%/`), `RC:881` (`/examin/`), `RC:732`, `R:1070`, `RC:1126` | No calificar; no afirmar causas |
| 13 | Formato de la cobertura | `R:798`, `RC:952`, `RC:1005` (`!/(\d+) de \1 días/`) | El defecto «N de N días» |

Al renombrar el texto positivo hay que actualizar la regex negativa en el mismo cambio. Hay una ya frágil hoy: `RC:1173` (`!/2fa34a/`) depende de una generación de datos concreta.

**C. Rompe los recorridos con ruido (hay que actualizarlos antes de regenerar la evidencia)**

| # | Si cambiás | Se rompe | Protege |
|---|---|---|---|
| 14 | El título «Superpuestas en valores reales (…)» (`SEG\lienzo.tsx:139`) | `R:784` | PRO-08: misma familia y unidad en un gráfico, con trazos distintos |
| 15 | El orden o el marcado de los modos (`SEG\analizar.tsx:422-428, :537-539`) | `R:611-613` (`.modo-elegible` [1] y [2], con `/unidades distintas/` y `/Peso: no tiene observaciones/`) y `R:680` (`input[name="modo-de-lectura"]`[2]) | PRO-08: bloqueos con su motivo |
| 16 | «Energía» como inicio de fila en las tablas | `R:737, :741`; `RC:939, :991` | PRO-18 y CP-18: semana igual a día; cobertura con huecos |
| 17 | Agrupar los filtros de la línea de tiempo | `R:507` (`.filtros-de-linea fieldset button.chip`), `R:509` («Tipo de hecho»), `R:552-553`, `R:546, :581`, `R:490-491` («N hechos coinciden») | PRO-04 |
| 18 | Botones de período (cantidad, textos «7 días» y «90 días») o pestañas | `R:837-839`, `R:1003-1007` (exige 5 y 3), `R:472` (texto exacto «Resumen,Línea de tiempo,Analizar») | PRO-21, PRO-23 ×30, PRO-01 |
| 19 | «Agrupar por» o los filtros del contraste | `R:739, :769`; `RC:1044`; `RC:760, :772, :784` (`.contraste .capa`); `RC:768` | CP-17, R3, CP-09 |
| 20 | El orden de las columnas | `RC:768-789` (`.tabla-del-contraste`, celdas [3] y [4]); `RC:994-1008`; `RC:948-951`; `R:264-269` | Modo frente a diferencia; cobertura |
| 21 | Convertir un `<details>` en otro control | `abrirDetalles` (`R:213-216`) sobre `details.intervalo`, `.tabla-de-datos`, `.vistas-guardadas`, `.preguntas-profesionales__mas`, `.agregar`, `.comparar-a-mano` | PRO-06, 08, 10, 19; R4 |
| 22 | Íconos sin nombre accesible | `RC:1261-1262`; axe en `RC:327-334` y `R:482, :538, :585, :672, :895, :912` | CP-28, PRO-22 |
| 23 | Íconos o insignias con texto dentro de un elemento que se compara exacto | `R:472`, `R:523` (`.entrada__area`), `R:866` (etiqueta «Área»), `RC:1019`, `RC:1358` | PRO-01, 04, 20 |
| 24 | La disposición | `RC:471-476` y `RC:593` (primera observación a y ≤ 900); `RC:484-499` (`.tabla-de-planificacion tbody tr`, `.tarjeta-de-pregunta`, `.entrada` con y < 800); `RC:590-592` (orden de los `h2`, cero gráficos); `RC:249-257` (cualquier panel con desplazamiento propio); `RC:1018, :1028` (`details.comparar-a-mano` justo después de `.comparacion-de-etapas`); `RC:1183-1187` | CP-01, GUIA-II.1, CP-27, R4, CP-06 |
| 25 | El gráfico: márgenes, eje Y, clases, aro | `R:251-252` (62 y 78 px, atados a `SEG\lienzo.tsx:275, :319`); `R:296-422` (`.grafico__elegible`, clases de recharts, ninguna marca tapada, al menos 100 px del color de cada métrica); `RC:1107-1111` (`circle[fill="none"][stroke="var(--texto)"]` como primer hijo) | PRO-08, CP-12 |
| 26 | Ganchos de teclado y foco | `R:627-648` (`.grafico__lienzo` enfocable, Inicio, Fin y flechas, «Lectura del»); `R:539-543`; `RC:695-698`; `RC:1237` (foco por `outline` o `box-shadow`, con tope de 60 Tab) | PRO-05, PRO-22, CP-21, CP-28 |
| 27 | Textos de acceso positivos | «no está disponible con tu acceso actual» (`R:1154, :1166, :1174, :1191`; `RC:814, :1423, :1425`); «No se descargó ningún archivo» (`R:1145`, `RC:1435`); «No encontramos un recurso disponible» (`R:965`); `.ficha__acceso` con «Antropometría: Activo» (`RC:1419, :1424`) | PRO-20, CP-23, CP-24 |
| 28 | Cantidades exactas | 4 `.indicador` (`R:474`); 6 `.recientes li` (`R:481`); 3 `.panel-de-lectura__metrica` (`R:648`); 2 `.etapa` (`RC:1074`); 4 fechas (`RC:1034`) | PRO-02, PRO-07, CP-26, R4 |

**D. Consistencia documental (no rompe nada automático)**
- La guía, en la línea 292 («paneles sincronizados») y en 194-196 y 280-283 si cambia la disposición.
- `DOM\preguntas-profesionales.ts:75` («…en paneles sincronizados.»).
- Los nombres de captura y las 44 menciones en `.md`.
- `DOM\copy-recetas.ts:78` dice «Energía y macros estimados», mientras `:24` ya dice «Calorías».

## 8. Lo que no pude determinar leyendo

- **Si los recorridos funcionan contra `next dev`.** Están escritos y documentados solo contra el export estático. Siguen los pedidos por `url.startsWith('http://localhost:3001')` (`R:85`, `RC:85`), y en dev, sin `BE_API_BASE_URL`, el website llama a `/api` en el mismo origen (`REPO\apps\web\next.config.mjs`). Por lectura no servirían tal cual; no lo probé.
- **Si las pruebas pasan hoy.** No ejecuté nada. Los números son de las corridas versionadas del 2026-10-08 y 09.
- **Los 6 casos de diferencia** entre mi conteo estático de scripts (295) y los 301 que informa el LEEME. Supongo que son pruebas generadas en bucles, pero no lo verifiqué.
- **Cómo pasan los resultados y capturas** de `H\trabajo*` a las carpetas versionadas. No encontré un script que lo haga; parece manual.
- **Si el `<title>` de un SVG entra en el `innerText`** que comparan `R:472` y `R:523`. Depende del navegador.
- **Qué procesos son los que escuchan** en 3000, 3001 y 55442, y de qué compilación.
- **El detalle de la anti-enumeración y el 404** en `REPO\test\integration\analisis.int-spec.ts`. Lo cito por `DP\ACEPTACION.md:70`; no leí esas pruebas.
