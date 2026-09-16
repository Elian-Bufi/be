# MESA-02 · Tabla maestra de correspondencia

> **Produce:** Claude, por delegación de Dirección · 2026-09-11
> **Norma que la exige:** `BE_MESA_02_ESTANDAR_DE_CALIDAD_POR_ENTREGABLE` §4
> **Naturaleza:** instrumento de consistencia entre entregables. No modifica el legajo.
> **Archivo:** `MESA_02_CORRESPONDENCIA.csv` — 79 filas, 17 columnas

## Para qué existe

Los entregables `DV-04`, `DV-06`, `DV-07` y `DV-09` nombran los mismos conceptos. Sin una fuente única, cada uno los nombra distinto y el tribunal ve tres vocabularios. Esta tabla fija **un nombre canónico por concepto** y registra cómo se llama en cada entregable, incluido el rótulo corto que las figuras usan bajo `LEG-01`.

Ningún entregable de la mesa se declara listo sin verificarse contra ella.

## Fuentes y método

| Columna | Fuente | Método |
|---|---|---|
| `T-06`, `concepto_canonico` | `BE-LEG-06 v0.1.1` cuadros §4.1 y §20 | extracción directa de las 79 filas con `T-06-NN` |
| `regimen` | `06` B-00 §5.5 | los `T-06-01…79` son `PROPIETARIO-06` por definición: B-00 asigna identificador propio solo a lo que el 06 posee |
| `areas_M` | `06` columna de área en el cuadro de términos | primer `M-xx` declarado; los nueve términos del parche transversal (`T-06-64…66`, `72…77`) se asignaron desde §20 y `DEC-047` |
| `bloque_06`, `seccion_maestra_06` | `06` §18.1 índice de trazabilidad | tabla área → bloque → sección |
| `UC_05_que_lo_usan` | `BE-LEG-05 v0.15` §4…§14 | los UC se clasifican por el bloque temático del 05 en que viven, y el bloque se mapea a áreas `M-xx` |
| `RF_04` | `05` §16.2 cobertura de requisitos | matriz autoritativa `RF → UC` de 69 filas, invertida a `UC → RF` |
| `familias_API_09` | `BE-LEG-09 v0.16.1` | familia que expone el área |
| `nombre_corto_figura` | derivado | rótulo de ≤ 22 caracteres para figuras; **no es canónico** (`NOMBRES_CANONICOS §3`) |
| `nombre_DV-06`, `nombre_DV-07` | derivado | DER conserva el nombre canónico; clases lo convierte a `PascalCase` |

## Verificación

```text
filas ......................... 79 / 79 términos T-06 del 06
términos sin área ............. 0
términos con UC y RF .......... 79 / 79
RF cubiertos .................. 69 / 69   (RF-016 y RF-063 retirados, ausentes)
UC referenciados .............. 56 / 56
áreas cubiertas ............... 13 / 13   (M-00 … M-12)
```

## Distribución por área

| Área | Términos | Bloque | UC del área |
|---|---:|---|---:|
| `M-01` identidad, perfil y cuenta | 8 | B-01 | 12 |
| `M-02` perfil profesional y verificación | 6 | B-02 | 4 |
| `M-03` vínculo, consentimiento y autorización | 8 | B-03 | 12 |
| `M-04` ciclo funcional del proceso | 2 | B-04 | 9 |
| `M-05` capacidad configurada | 1 | B-05 | 10 |
| `M-06` versionado e historia común | 5 | B-06 | 9 |
| `M-07` circuito nutricional | 17 | B-07 | 7 |
| `M-08` circuito de entrenamiento | 15 | B-08 | 6 |
| `M-09` antropometría | 6 | B-10 | 8 |
| `M-10` revisión y continuidad | 5 | B-09 | 3 |
| `M-11` proyecciones y métodos | 5 | B-11 | 4 |
| `M-12` analítica y TVCC-30 | 1 | B-12 | 13 |

## Advertencias de uso

**Los `UC` y `RF` de una fila son los de su área, no los de ese término en particular.** El 06 no declara trazabilidad término-por-UC; declara área-por-bloque. La columna responde «qué casos de uso tocan el área a la que este término pertenece», que es el nivel de granularidad que el legajo sostiene. Afirmar un mapeo más fino sería inventarlo.

**`nombre_corto_figura` no es canónico.** Es rótulo de presentación bajo `LEG-01`; el ID `T-06-NN` siempre queda visible junto a él, y el nombre completo vive en esta tabla y en el índice de cada entregable.

**Los nueve términos del parche transversal** (`T-06-64` a `66`, `72` a `77`) recibieron área desde §20 del 06 y `DEC-047`, no desde el cuadro §4.1, que es anterior al parche. Queda declarado por si un revisor busca su fila en el cuadro original y no la encuentra.
