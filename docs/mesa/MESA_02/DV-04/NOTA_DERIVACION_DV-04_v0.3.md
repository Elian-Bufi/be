# DV-04 v0.3 — Casos de uso · reemisión con layout determinista

> **Produce:** Claude, por delegación de Dirección · 2026-09-10
> **Base semántica:** `DV-04 v0.1.1` (28/28 verificados) · **Fuente:** `BE-LEG-05 v0.15` `d6a787bf…`
> **Aplica:** `MESA_02_00_ADDENDUM_LEGIBILIDAD_v1` (`LEG-01…05`) + regla nueva `LEG-06`
> **Estado:** BASELINE · **Runtime:** ninguno · **Git:** sin operaciones
> **Cambio semántico:** NINGUNO

## LEG-06 — regla nueva que este entregable introduce

> Cuando una vista tiene estructura conocida —una secuencia, una agrupación temática—, **el layout se calcula, no se delega a un motor de grafo**. PlantUML y herramientas equivalentes son adecuadas para grafos irregulares; para estructuras conocidas producen zigzags y cruces que ningún ajuste de estilo corrige.

Se propone incorporarla al kit. Evidencia: §4.

## Qué cambió respecto de v0.1.1

| | v0.1.1 | v0.3 |
|---|---|---|
| Motor | PlantUML (layout automático) | SVG con posiciones calculadas |
| Casos hogar | 56 | **56** |
| `<<include>>` declarados | 102 | **102** |
| `<<include>>` dibujados | 102 | **30** |
| `<<include>>` en nota + CSV | 0 | **72** |
| `<<extend>>` | 11 | **11** |
| Cadena de secuencia | inexistente | **recta en 6 vistas** |
| Cruces de conectores | numerosos | **0** |
| Aspecto máximo de elipse | ≈ 9:1 | **≈ 1,8:1** |
| Leyenda | texto gris | **muestras visuales del trazo real** |
| Subtítulo explicativo | no | **sí, en las 8 vistas** |

**Ninguna relación se perdió.** Las 72 invocaciones a `UC-I02`, `UC-I03` y `UC-I11` están declaradas en la leyenda de cada vista y en `DV-04_RELACIONES_UML.csv`.

## Layouts aplicados

| Vista | Layout | Fundamento |
|---|---|---|
| 04.1 Identidad | secuencia | registro → sesión → cierre |
| 04.2 Verificación | secuencia | alta → resolución → suspensión/rehabilitación |
| 04.3 Vínculo | secuencia | solicitud → aceptación → consentimiento → revocación → gestión |
| 04.4 Nutrición | secuencia | evaluación → diseño → activación → ejecución → revisión |
| 04.5 Entrenamiento | secuencia | espejo de 04.4 |
| 04.6 Antropometría | secuencia + rama | registro → evolución; publicación → descubrimiento |
| 04.7 Cartera | agrupación | sin secuencia natural; cinco materias |
| 04.8 Incluidos | agrupación | casos invocados, no ejecutados por actor |

Las dos vistas por agrupación lo declaran en su nota: *«Vista sin secuencia natural: los casos se agrupan por materia.»*

## Verificación reproducible

```text
casos hogar 56 · únicos 56 · faltantes 0 · extra 0
includes: 102 declarados = 30 dibujados + 72 en nota
extends dibujados 11 = declarados 11
TR como elipse 0
vistas 8 · alturas 700…900 px · todas ≤ 900
```

## Prueba de los treinta segundos

**SÍ.** En las seis vistas con secuencia, la cadena verde recorre el eje horizontal con el actor entrando por un carril inferior dedicado: un lector identifica el orden del proceso, quién lo ejecuta y qué casos auxiliares se invocan. Las dos vistas por agrupación titulan cada columna con su materia y declaran la ausencia de secuencia.

## Campos TO VERIFY

Ninguno en este entregable.
