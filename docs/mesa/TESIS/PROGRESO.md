# Tesis v1 — registro de avance

> Para retomar después de una interrupción: leer este archivo de arriba abajo, después `LEEME.md`.
> Encargo de Dirección del 2026-10-20 (madrugada): documentación de tesis según «Entregables» de la Escuela Da Vinci,
> versión 2025.05, y base de la defensa. Rama `mesa/tesis-v1`, árbol de trabajo `C:\Users\bufim\BE-tesis`.

## Reglas que gobiernan este trabajo

- Orden obligatorio de los 14 apartados; anexos después del 14.
- Gantt (10) y enlaces (11, 12 y 13): **diferidos por Dirección**. Se conservan los apartados, con «Pendiente de
  incorporación en el cierre». No se deduce el mes de presentación.
- El repositorio es **público**: el logo de la escuela, los correos institucionales y las credenciales no van a Git.
  Viven en `C:\Users\bufim\BE-datos-locales\tesis\` y solo entran en la versión de evaluación del PDF, que se compila
  localmente.
- `docs/legajo/**` y todo lo listado en `docs/MANIFEST.sha256` no se editan. La tesis deriva; no reescribe.
- Producto implementado ≠ aprobado pendiente ≠ propuesta. Comprobación local o de CI ≠ verificación remota.
- No se cambia el producto para que coincida con un gráfico: los defectos van a `DISCREPANCIAS.md` como pendientes.
- Memoria limitada: una tarea pesada por vez, sin navegadores simultáneos, sin vigilantes permanentes.

## Herramientas (fuera del repositorio)

| Herramienta | Versión | Dónde | SHA-256 del archivo bajado |
|---|---|---|---|
| Typst | 0.15.1 | `C:\Users\bufim\BE-herramientas\typst-0.15.1\` | `19ce3551…6736` (`typst-x86_64-pc-windows-msvc.zip`) |
| Inter | 4.1 | copia en `docs/mesa/TESIS/tipografias/` (OFL) | `9883fdd4…b11e` (`Inter-4.1.zip`) |
| JetBrains Mono | 2.304 | copia en `docs/mesa/TESIS/tipografias/` (OFL) | `6f6376c6…7bbf` (`JetBrainsMono-2.304.zip`) |
| Node | 22 (fnm) | el del proyecto | — |

## Hitos

| # | Hito | Estado | Fecha |
|---|---|---|---|
| A | Cierre técnico autorizado (etapas 2 a 5 del encargo por etapas) | **hecho** (ver bitácora); falta el informe final | 2026-10-20 |
| B | Inventario de fuentes y versión de referencia (`datos/version.json`: main `0fb1bff`) | **hecho** | 2026-10-20 |
| C | Guía visual, motor de láminas y dos láminas patrón (ARQ-02, DER-03) | **hecho** (`c290925`) | 2026-10-20 |
| D | Documento: 14 apartados | pendiente | |
| E | Anexos: flujos, DFD, secuencias y estados, trazabilidad, glosario | pendiente | |
| F | Tres pasadas de revisión | pendiente | |
| G | Base de la defensa: guion, preguntas, demo, presentación | pendiente | |
| H | Informe final | pendiente | |

## Bitácora

- **2026-10-20 01:55** — Etapa 2 verificada en test con Chrome 155.0.8059.80: borrador, recarga con texto sin guardar,
  conflicto entre pestañas y navegación sin conexión, 11/11. El vínculo de la persona de verificación quedó finalizado.
- **2026-10-20 02:05** — Rama `mesa/tesis-v1` creada desde `main` `f65cf03`. Typst 0.15.1 probado: respeta Inter y
  JetBrains Mono dentro de los SVG.
- **2026-10-20 02:10** — #189 integrado (`20f1bb7`), CI de main verde, API de test en `20f1bb7` con la migración de
  los cortes aplicada.
- **2026-10-20 02:22** — #192 integrado (`0fb1bff`; solo cambia el website). Revisión de solo lectura de las 16 recetas
  contra la API de test (`20f1bb7`): 16 cargables, 16 verificadas, 0 con foto, 0 en la cuenta de Sofía. Nada escrito.
- **2026-10-20 03:10** — Etapa 5: el agente dejó #198 en borrador (CI verde, `ac1a183`): las APK 0.13.2 y
  0.17.0-candidata.3 leen 82 operaciones distintas (44 y 80); se congelaron sus esquemas y una prueba de integración
  lee respuestas reales con ellos; sin incompatibilidad nueva; DL-152 D-1 a D-5 a ratificar. No se integró.
- **2026-10-20 03:40** — Hito C: guía visual (`estilo/tokens.json`), motor de láminas con revisión automática, ARQ-02 y
  DER-03 aprobadas como patrón (revisadas sueltas y dentro del PDF), plantilla Typst con variante pública y de
  evaluación, portada y esqueleto de los 14 apartados. Commit `c290925`, rama subida.
- **Cómo seguir:** `node laminas/construir.mjs [ID]` (láminas) y `node construir-documento.mjs --png <carpeta>`
  (documento y páginas para revisar). Próximo: extraer las 56 fichas de DV-04 y la evidencia por caso
  (`herramientas/evidencia-por-caso.mjs`), asignar estados con fundamento (`datos/estado.json`) y escribir los
  apartados 2 a 9 en orden.
- Inventario técnico: `herramientas/leer-esquema.mjs` → `datos/esquema.json` (113 modelos, 78 enumeraciones, 212
  relaciones); `herramientas/evidencia-por-requisito.mjs` → `datos/evidencia-rf.json` (69 RF con su evidencia). Contra
  el inventario del 09, 104 de 122 operaciones P0 implementadas (faltan las 13 PRO, DSH-01/02/05, PRJ-02/03).
