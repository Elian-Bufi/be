# Evidencia de WP-DASHBOARD-COMPRENSION

Encargo de Dirección del 2026-10-09, «evolución del dashboard profesional», y su ampliación del mismo día sobre la guía de
UX. Rama `wp-dashboard-comprension`, apilada sobre `wp-dashboard-profesional` (#153). Definición y decisiones:
`docs/paquetes/WP-DASHBOARD-COMPRENSION.md`. **Nada de esto es una aprobación de una persona:** son comprobaciones de
herramientas con su resultado esperado calculado aparte, y capturas para mirar.

## Qué hay acá

| Archivo o carpeta | Qué es |
|---|---|
| `ACEPTACION.md` | La matriz CP-01 a CP-30, con la evidencia y el estado de cada criterio |
| `GUIA-DE-DEMOSTRACION.md` | Para recorrer la ficha como profesional, con el comando técnico al final |
| `CRITICA.md` | La crítica de producto: lo que mejoré dentro del alcance, ocho oportunidades por valor y lo que descarto |
| `GUIA-UX-INFORME.md` | La guía de UX en este encargo: qué pautas ya se cumplían, cuáles se ajustaron y qué contradicciones hay |
| `LECTOR-DE-PANTALLA.md` | Por qué no se probó con un lector de pantalla, qué se verificó en su lugar y el guion para hacerlo |
| `antes/` | Las tres vistas antes del encargo (compilación `6c8e0b4`, 1440, 1280 y 1024 px, dos temas) |
| `despues/` | Las mismas vistas después, las pantallas nuevas, la primera pantalla, los modos del gráfico y los estados críticos |
| `recorridos/` | Resultados de los recorridos (JSON), sus capturas y el árbol de accesibilidad del Resumen |

## Cómo se produjo

- **Compilación:** la web estática y la API de la rama en `269d930` (con la pasada de corrección y
  usabilidad del 2026-10-09), con la API local en :3001 y la web en :3000 (la CSP de `render.yaml`). Las corridas de
  abajo son de esa compilación y de una sola generación de datos, salvo `revocacion`, que es de `1661c69` (la pasada no
  la toca).
- **Datos:** `datos/regenerar-comprension.sh` sobre una base propia, `be_test_comprension` (PostgreSQL 16 local): la base
  sintética de #153 (verificación 25/25) y, encima, los escenarios D y E de `datos/comprension.mjs` (verificación 10/10,
  `recorridos/verificacion-del-escenario.json`). El escenario D tiene revisiones de Nutrición (hace 20 días, aplicada) y
  de Entrenamiento (hace 9, sin aplicar), un borrador sin activar, comidas y sesiones cargadas o corregidas después de los
  cortes, una sesión del plan anterior cargada después de activar el nuevo, una merienda informada a mano con las mismas
  cantidades de la opción (desde la pasada: el modo de registro no es una diferencia) y tomas medidas, reportadas y
  calculadas. El E es una persona con una sola área, sin revisiones y con el plan activado hoy.
- **Recorridos** (`herramientas/recorrido-comprension.mjs`): `capturas`, `funcional` y `revocacion` (cuentas
  descartables), y la regresión del paquete anterior (`herramientas/recorrido.mjs funcional`, adaptada a la interfaz
  nueva: preguntas en lugar de presets, «Agrupar por», la clase «calculado» que dice su naturaleza).

## Resultados de la corrida final

| Recorrido | Resultado | Archivo |
|---|---|---|
| `capturas` (las tres vistas en 1440, 1280 y 1024 px y dos temas; pantallas nuevas y la revisión de Nutrición; 768 y 390 px; primera pantalla a 1440 × 900 y 1280 × 800; modos del gráfico; estados) | 79/79 | `recorridos/resultado-capturas.json`, `despues/` |
| `funcional` (recorridos 1, 2, 3, 4 y 6; escenario E; clases del dato; búsqueda; teclado, zoom y árbol de accesibilidad; tiempos; y, desde la pasada, la evidencia agrupada, el modo frente a la diferencia, la cobertura con huecos y Analizar con etapas) | 75/75 | `recorridos/resultado-funcional.json` y sus capturas |
| `revocacion` (recorrido 5, cuentas descartables, dos pestañas), de `1661c69` | 6/6 | `recorridos/resultado-revocacion.json` |
| Regresión de #153 (`recorrido.mjs funcional`) | 70/70 (la primera corrida, 69/70: ver abajo) | `recorridos/regresion-recorrido-dashboard-profesional.json` |
| `mirar` (20 pantallas nuevas o cambiadas: axe, desborde, doble desplazamiento, errores de consola) | 20/20 | se mira en la pantalla; no se versiona |
| Verificación del escenario | 10/10 | `recorridos/verificacion-del-escenario.json` |

La regresión de #153 se adaptó a la interfaz nueva en seis puntos, cada uno comentado en el script: la pregunta de
alimentación y medidas en lugar del preset (con la medida elegida), la comparación de etapas en lugar del preset de dos
períodos, «Agrupar por · Semana» en lugar de «Por semana», la referencia del cambio relativo comprobada en la URL (se
dibuja en ese modo), la clase «calculado» que dice su naturaleza y el selector de áreas del asesorado B leído después de
«Análisis personalizado» (Analizar empieza por las preguntas). Las expectativas de valores no cambiaron.

Pruebas fuera del navegador: dominio 590/590, scripts 301/301 (la lista de `npm test`, con `retorno-a-la-ficha` y
`evidencia-de-revision`), API unitarias 80/80, integración 50/50 contra PostgreSQL 16 local (contrato, análisis,
dashboard y comprensión, con la regresión de la numeración de versiones y el modo frente a la diferencia), typecheck de
los cuatro espacios, OpenAPI al día. En la primera corrida de `npm test`, una prueba de salud de la API agotó su tiempo
(30 s) con el equipo cargado; sola dio 9/9 y la suite completa, con dos procesos, 80/80. La CI corre en el PR.

La regresión de #153 dio 69/70 la primera vez: PRO-11 esperaba la redacción vieja de la media de los indicadores («sin
contar hoy»). La pasada la cambió a propósito por la cobertura compartida («hoy, en curso: fuera de la media»); la
comprobación pide lo mismo con la redacción nueva, y la segunda corrida dio 70/70.

## Para leer con cuidado

- **Uno de los «hechos anteriores cargados después»** de la síntesis es el objetivo de la base sintética: el generador lo
  registra al generar, con vigencia desde hace 84 días. Para la síntesis es una incorporación posterior al corte (lo es,
  en estos datos). La verificación del escenario cuenta solo comidas y sesiones; el recorrido compara contra la API con
  la regla de la síntesis.
- **El recorrido `funcional` registra una revisión sintética de Entrenamiento** (recorrido 2): por eso las capturas
  `despues/` se toman antes.
- **Incidente con la carpeta del paquete anterior:** `datos/regenerar.sh` escribía siempre en `herramientas/trabajo/`. La
  primera regeneración de este paquete (2026-10-09, 01:27) pisó `trabajo/demo-profesionales.txt` y borró
  `trabajo/estado.json` de #153. La base de #153 (`be_test_dashboard`) no se tocó. Se corrigió el script (D-23) y se
  reconstruyeron los dos archivos desde esa base, solo leyendo: la lista de profesionales es exacta (salió del archivo
  de profesionales descartables, intacto); `estado.json` tiene correos, identidades, vínculos y versiones de los planes,
  y dice en `reconstruido.faltan` lo que no se reconstruyó (se lee de la base o se regenera todo).
- **Error mío durante la pasada, con la base de #153:** al reiniciar la API a mano exporté la carpeta de trabajo pero no
  `BE_E2E_DATABASE_URL`, y `entorno.sh` usa por omisión `be_test_dashboard` (la base local de #153). Durante unos
  minutos la API apuntó ahí y quedaron **dos registros de auditoría de inicios de sesión rechazados** (`API-ACC-02`,
  «identificador inexistente», sin sujeto ni identificador). No se creó ninguna sesión ni cambió ningún dato; la tabla
  es de solo agregar (con disparadores que lo impiden), y no los borré. `entorno.sh` ahora se niega a arrancar si la
  carpeta de trabajo no es `trabajo/` y falta la base.
- **Lector de pantalla:** no probado con una persona (`LECTOR-DE-PANTALLA.md`).
- **Rendimiento:** medido en este equipo, con la API y la base locales. No se generaliza a Render.
