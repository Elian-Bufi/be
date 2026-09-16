# MESA-02-00 — Plantilla de nota de derivación

> **Uso:** copiar esta plantilla dentro de cada `MESA_02_0X_DV-XX/` y completar solo con evidencia disponible.  
> **Regla:** un campo no verificable se marca `NO EVIDENCIADO`; nunca se completa por memoria.

# NOTA DE DERIVACIÓN — DV-XX

## 1. Identidad del entregable

| Campo | Valor |
|---|---|
| Entregable Da Vinci | `DV-XX — [TÍTULO]` |
| Artefacto MESA | `[NOMBRE]` |
| Fecha de producción | `[AAAA-MM-DD]` |
| Estado | `[BASELINE | CONCEPTUAL — A RECONCILIAR CON REPOSITORIO]` |
| Runtime utilizado como evidencia | `NO` |
| Git | `SIN OPERACIONES` |

## 2. Fuentes del legajo

Registrar **una fila por objeto realmente leído**.

| Fuente | Versión | Archivo real consultado | SHA-256 recalculado | Estado de acceso | Uso exacto |
|---|---|---|---|---|---|
| `BE-LEG-XX` | `vX.Y` | `[archivo]` | `[64 hex]` | `VERIFIED` | `[qué se derivó]` |
| `[fuente faltante]` | `[v]` | — | — | `NO EVIDENCIADO` | `NO UTILIZADO PARA AFIRMACIONES` |

### Regla de custodia

```text
nombre recordado
≠ fuente leída

cita de una revisión secundaria
≠ objeto primario disponible
```

Si la fuente primaria requerida está `NO EVIDENCIADO`, el fragmento dependiente no se cierra.

## 3. Qué se condensó

Describir qué material canónico se redujo o agrupó para presentación.

| Material de origen | Condensación realizada | Criterio de condensación | IDs preservados |
|---|---|---|---|
| `[fuente/sección]` | `[qué se agrupó]` | `[legibilidad / partición / índice / síntesis]` | `[IDs]` |

La condensación no cambia:

- identidad del objeto;
- relación;
- prioridad;
- estado;
- actor;
- semántica;
- propietario documental.

## 4. Qué se omitió deliberadamente

| Elemento omitido | Motivo | Dónde sigue disponible | Impacto semántico |
|---|---|---|---|
| `[detalle]` | `[densidad / duplicación / fuera de alcance del DV]` | `[fuente]` | `NINGUNO` |

No usar “omitido por simplicidad” sin indicar por qué la omisión no altera interpretación.

## 5. Declaración explícita de no cambio

Completar literalmente:

```text
ESTE ARTEFACTO NO:
- crea RF;
- crea RNF;
- crea UC;
- crea entidades;
- crea relaciones de dominio;
- crea estados;
- crea transiciones;
- crea endpoints;
- cambia prioridades;
- cambia políticas;
- afirma implementación;
- afirma despliegue;
- afirma pruebas ejecutadas.
```

Añadir cualquier restricción específica del DV.

## 6. Estado de reconciliación

Seleccionar uno:

```text
BASELINE — no requiere reconciliación con repositorio para su semántica documental.

CONCEPTUAL — A RECONCILIAR CON REPOSITORIO.
```

Si es `CONCEPTUAL — A RECONCILIAR CON REPOSITORIO`, completar:

| Punto a reconciliar | Fuente documental | Evidencia runtime requerida en intake | Estado actual |
|---|---|---|---|
| `[punto]` | `[legajo]` | `[schema/código/config/etc.]` | `TO VERIFY` |

No adelantar el resultado de la reconciliación.

## 7. Campos `TO VERIFY`

| Campo | Por qué no puede inferirse | Quién/qué lo resuelve |
|---|---|---|
| `[campo]` | `[razón]` | `[Dirección / intake / runtime]` |

Si no hay campos:

```text
TO VERIFY: NINGUNO PARA ESTE ARTEFACTO
```

## 8. IDs canónicos referenciados

Lista exhaustiva, sin rangos ambiguos si la contrarrevisión necesita comprobar presencia individual:

```text
[ID-001]
[ID-002]
...
```

Agrupar por familia cuando ayude:

- RF:
- RNF:
- UC:
- M:
- T-06:
- REG-06:
- INV-06:
- API:
- TEST:
- otros:

## 9. Figuras producidas

| Figura | Fuente editable | SVG | PNG | Nodos | Conectores | Estado |
|---|---|---|---|---:|---:|---|
| `Figura DV-XX.n — ...` | `[archivo]` | `[archivo]` | `[archivo]` | `[n]` | `[n]` | `[BASELINE / CONCEPTUAL...]` |

Reglas de aceptación:

```text
nodos <= 25
conectores <= 40
```

## 10. Léxico y afirmaciones de estado

Registrar el barrido sobre texto visible y documentación acompañante:

| Control | Resultado |
|---|---|
| `implementado` como afirmación de runtime | `0` |
| `desplegado` como afirmación de runtime | `0` |
| `funciona` como afirmación de runtime | `0` |
| `probado` como afirmación de runtime | `0` |
| datos personales inventados | `0` |

Las palabras pueden aparecer dentro de una **prohibición o cita del criterio de control**; la misión debe distinguir uso normativo de afirmación factual.

## 11. Autoverificación

- [ ] fuentes primarias realmente leídas;
- [ ] hashes recalculados;
- [ ] nombres tomados de `MESA_02_00_NOMBRES_CANONICOS.md`;
- [ ] IDs preservados;
- [ ] condensaciones declaradas;
- [ ] omisiones declaradas;
- [ ] no cambio semántico declarado;
- [ ] reconciliación declarada;
- [ ] `TO VERIFY` visibles;
- [ ] densidad conforme;
- [ ] fuente editable + SVG + PNG presentes cuando aplica;
- [ ] manifiesto generado desde bytes finales;
- [ ] misión de contrarrevisión incluida.

## 12. Cierre de la nota

```text
ARTEFACTO:
[APTO PARA CONTRARREVISIÓN | NO CERRABLE — FUENTE NO EVIDENCIADA]

CAMBIO CANÓNICO:
NINGUNO

IMPLEMENTACIÓN:
NO AFIRMADA

GIT:
SIN OPERACIONES
```
