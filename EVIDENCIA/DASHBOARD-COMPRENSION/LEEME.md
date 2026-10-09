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

- **Compilación:** la web estática y la API de la rama en `1661c69`, con la API local en :3001 y la web en :3000 (la CSP
  de `render.yaml`). Todas las corridas de abajo son de esa compilación y de una sola generación de datos.
- **Datos:** `datos/regenerar-comprension.sh` sobre una base propia, `be_test_comprension` (PostgreSQL 16 local): la base
  sintética de #153 (verificación 25/25) y, encima, los escenarios D y E de `datos/comprension.mjs` (verificación 10/10,
  `recorridos/verificacion-del-escenario.json`). El escenario D tiene revisiones de Nutrición (hace 20 días, aplicada) y
  de Entrenamiento (hace 9, sin aplicar), un borrador sin activar, comidas y sesiones cargadas o corregidas después de los
  cortes, una sesión del plan anterior cargada después de activar el nuevo y tomas medidas, reportadas y calculadas. El E
  es una persona con una sola área, sin revisiones y con el plan activado hoy.
- **Recorridos** (`herramientas/recorrido-comprension.mjs`): `capturas`, `funcional` y `revocacion` (cuentas
  descartables), y la regresión del paquete anterior (`herramientas/recorrido.mjs funcional`, adaptada a la interfaz
  nueva: preguntas en lugar de presets, «Agrupar por», la clase «calculado» que dice su naturaleza).

## Resultados de la corrida final

| Recorrido | Resultado | Archivo |
|---|---|---|
| `capturas` (las tres vistas en 1440, 1280 y 1024 px y dos temas; pantallas nuevas; 768 y 390 px; primera pantalla a 1440 × 900 y 1280 × 800; modos del gráfico; estados) | 73/73 | `recorridos/resultado-capturas.json`, `despues/` |
| `funcional` (recorridos 1, 2, 3, 4 y 6; escenario E; clases del dato; búsqueda; teclado, zoom y árbol de accesibilidad; tiempos) | 59/59 | `recorridos/resultado-funcional.json` y sus capturas |
| `revocacion` (recorrido 5, cuentas descartables, dos pestañas) | 6/6 | `recorridos/resultado-revocacion.json` |
| Regresión de #153 (`recorrido.mjs funcional`) | 70/70 | `recorridos/regresion-recorrido-dashboard-profesional.json` |
| `mirar` (18 pantallas nuevas: axe, desborde, doble desplazamiento, errores de consola) | 18/18 | se mira en la pantalla; no se versiona |
| Verificación del escenario | 10/10 | `recorridos/verificacion-del-escenario.json` |

La regresión de #153 se adaptó a la interfaz nueva en seis puntos, cada uno comentado en el script: la pregunta de
alimentación y medidas en lugar del preset (con la medida elegida), la comparación de etapas en lugar del preset de dos
períodos, «Agrupar por · Semana» en lugar de «Por semana», la referencia del cambio relativo comprobada en la URL (se
dibuja en ese modo), la clase «calculado» que dice su naturaleza y el selector de áreas del asesorado B leído después de
«Análisis personalizado» (Analizar empieza por las preguntas). Las expectativas de valores no cambiaron.

Pruebas fuera del navegador: dominio 585/585, scripts 297/297 (la lista de `npm test`, con `retorno-a-la-ficha` nueva),
API unitarias 80/80, integración 49/49 contra PostgreSQL 16 local (contrato, análisis, dashboard y comprensión, con la
regresión de la numeración de versiones), typecheck de la web, OpenAPI al día. La CI corre en el PR.

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
- **Lector de pantalla:** no probado con una persona (`LECTOR-DE-PANTALLA.md`).
- **Rendimiento:** medido en este equipo, con la API y la base locales. No se generaliza a Render.
