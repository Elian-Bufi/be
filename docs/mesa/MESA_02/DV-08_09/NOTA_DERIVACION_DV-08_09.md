# DV-08 y DV-09 — Arquitectura y componentes

> **Produce:** Claude, por delegación de Dirección · 2026-09-11
> **Fuente única:** `BE-LEG-07 v0.1.11` — `ef4a4b08…` · inventario de familias: `BE-LEG-09 v0.16.1`
> **Estado:** `ARQUITECTURA OBJETIVO — DESPLIEGUE NO VERIFICADO` · `COMPONENTES OBJETIVO — CÓDIGO NO VERIFICADO`
> **Runtime:** ninguno · **Git:** sin operaciones · **Cambio semántico:** ninguno · **07 no reabierto**

## DV-08 — Arquitectura

| Figura | Contenido |
|---|---|
| DV-08.1 | C4 nivel 1 — Contexto: 3 actores, 4 sistemas externos, 7 relaciones con protocolo |
| DV-08.2 | C4 nivel 2 — Contenedores: APK, Website, API, PostgreSQL, con el PDP visible |
| DV-08.3 | Ambientes y régimen de datos: dev, test/demo y producción con sus gates |
| `DV-08_ADR.md` | **Siete decisiones arquitectónicas** en formato ADR + estado AS-IS vs TO-BE |

Los ADR responden lo que un tribunal técnico pregunta primero: por qué monolito y no microservicios, por qué un PDP único, por qué historia por adición, por qué auditoría dentro de la transacción, por qué Render-first, por qué APK sin tiendas, por qué concurrencia optimista. Cada uno con contexto, decisión, **alternativas consideradas** y consecuencias, trazado a su `ASR` y al `RNF` que lo justifica.

## DV-09 — Componentes

| Figura / archivo | Contenido |
|---|---|
| DV-09.1 | C4 nivel 3 — 18 componentes API + PostgreSQL externo, 16 dependencias declaradas |
| `DV-09_FAMILIAS.csv` | Las 15 familias API asignadas a componente y área de dominio |
| `DV-09_MATRIZ_DEPENDENCIAS.csv` | 16 dependencias permitidas + **6 prohibiciones explícitas** |

**Asignación verificada: 15 familias, 122 operaciones, cero huérfanas, cero duplicadas.** La suma por familia da exactamente el inventario P0 del Documento 09.

La matriz de dependencias declara la modularidad objetivo: declara no solo lo permitido sino **lo prohibido y por qué** — nutrición no conoce entrenamiento; las proyecciones leen de la base y no invocan dominios; los motores de cálculo son puros y no tocan persistencia; el PDP decide pero no ejecuta lógica de dominio.

## Verificación reproducible

```text
DV-08: 3 figuras · 7 ADR · 3 actores · 4 externos · 4 contenedores
DV-09: 18 componentes API + PostgreSQL externo · 16 dependencias · 6 prohibiciones
familias API: 15/15 asignadas · operaciones: 122 · huérfanas: 0 · duplicadas: 0
tecnologías fuera del 07: 0
rótulo de no-verificación: conservar en las figuras de arquitectura y componentes
```

## Prueba de tribunal

**¿Qué responde?** Cómo está construido BE y **por qué así**. Los ADR convierten cada decisión en algo defendible en dos minutos.

**¿Qué deja sin responder?** Si el código real coincide — se verifica en el intake, y las brechas `B-1…B-11` ya están enumeradas en la sección AS-IS vs TO-BE del ADR.

**¿Un arquitecto que no conoce BE lo entiende?** Sí. El nivel 1 muestra con quién habla el sistema; el nivel 2, de qué está hecho y dónde vive el PDP; el nivel 3, cómo se descompone por dentro y qué dependencias están prohibidas.


## Addendum v5 — 13-09-2026

ChatGPT/Codex corrige DV-09.1: cinco columnas, límite API visible y PostgreSQL fuera del proceso NestJS según 07 §18. Se conservan las 18 cajas de componentes, familias y matriz. La nota original describe una arquitectura objetivo; ninguna dependencia acredita integración ejecutada. Los SVG/PNG son los artefactos editables/visualizables; los motores v5 están en HERRAMIENTAS.
