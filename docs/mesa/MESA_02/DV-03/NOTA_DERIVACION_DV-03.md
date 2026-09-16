# NOTA DE DERIVACIÓN — DV-03

## 1. Identidad

| Campo | Valor |
|---|---|
| Entregable | `DV-03 — Requisitos funcionales` |
| Artefacto | `DV-03_RF_POR_CANAL` |
| Fecha | `2026-09-10` |
| Estado | `BASELINE` |
| Evidencia runtime | `NINGUNA` |
| Git | `SIN OPERACIONES` |

## 2. Fuentes realmente leídas

| Fuente | Versión | Archivo | SHA-256 | Estado | Uso |
|---|---|---|---|---|---|
| BE-LEG-04 | v0.4.2.1 | `BE_LEG_04_v0.4.2.1_REQUERIMIENTOS_RF_RNF_PARCHE_TRANSVERSAL_POST_CONTRARREVISION_2026-09-07.md` | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` | VERIFIED | RF/RNF |
| BE-LEG-05 | v0.15 | `BE_LEG_05_v0.15_MAESTRO_CASOS_DE_USO_E_HISTORIAS_PARCHE_TRANSVERSAL_2026-09-07.md` | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` | VERIFIED | RF→UC |
| BE-LEG-09 | v0.16.1 | `BE_LEG_09_v0.16.1_CORRECCION_CONTRACTUAL_A3_2026-09-07.md` | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` | VERIFIED | RF→familia |
| BE-LEG-10 | B10-01 v0.2 | `B10-01.md` | `6946701f1aa9e1be0274d367c421b60f15055f9baf27bf2f311d92d9bcc68e35` | VERIFIED | actor→superficie |
| BE-LEG-10 | v0.10.1-G | `BE_LEG_10_v0.10.1_G_B10_11_CORREGIDO_RF_069_2026-09-07.md` | `205a31709a470156f18952a6d59197ed6ceb757961a70ad1a33e7d9614b6ce6c` | VERIFIED | continuidad UX |
| BE-LEG-02 | v0.2.1 | — | — | **NO EVIDENCIADO** | no utilizado para contenido interno |
| MESA-01 | 14×14 | `BE_MESA_01_MATRIZ_COBERTURA_DA_VINCI_14x14_2026-09-10.xlsx` | `135152a755b849d34c6dbd161f62183bd1ef8e9b9eba5f425c214d7387a641e5` | VERIFIED | subcriterios DV-03 |
| Da Vinci | v2025.05 | `Entregables.pdf` | `cd77a245c683b00a7eceab03bfccc64943e5741905613fa92b903183b49800a8` | VERIFIED | exigencia |

## 3. Qué se condensó

| Origen | Condensación | Criterio | Preservación |
|---|---|---|---|
| 69 fichas RF | tabla única | lectura académica | 69/69 IDs |
| línea `Obligación` | copia literal | evitar deriva semántica | 69/69 |
| matriz 05 | una celda UC por RF | trazabilidad | 69/69 |
| matriz 09 | una celda familia por RF | trazabilidad | 69/69 |
| 38 fichas RNF | tabla por categoría | lectura académica | 38/38 |

## 4. Qué se omitió deliberadamente

- criterios de aceptación detallados → permanecen en 04;
- escenarios/excepciones completos → permanecen en 05;
- rutas y payloads → permanecen en 09;
- navegación detallada → permanece en 10;
- criterios de medición RNF → permanecen en 04.

Impacto semántico: `NINGUNO`.

## 5. Qué no cambió

```text
NO crea RF/RNF/UC.
NO crea entidades, estados, transiciones, endpoints ni políticas.
NO cambia prioridades.
NO cambia títulos.
NO reescribe obligaciones.
NO afirma ejecución, despliegue o pruebas realizadas.
```

## 6. Estado de reconciliación

```text
BASELINE — no requiere reconciliación con repositorio para su semántica documental.
```

Cotejo secundario pendiente:

```text
BE-LEG-02 v0.2.1 §11:
NO EVIDENCIADO
```

## 7. Campos TO VERIFY

| Campo | Motivo | Resolución |
|---|---|---|
| Cotejo adicional con 02 §11 | objeto primario no disponible | aportar fuente; no inferir |

## 8. IDs canónicos referenciados

### RF
```text
RF-001 RF-002 RF-003 RF-004 RF-005 RF-006 RF-007 RF-008 RF-009 RF-010 RF-011 RF-012 RF-013 RF-014 RF-015 RF-017 RF-018 RF-019 RF-020 RF-021 RF-022 RF-023 RF-024 RF-025 RF-026 RF-027 RF-028 RF-029 RF-030 RF-031 RF-032 RF-033 RF-034 RF-035 RF-036 RF-037 RF-038 RF-039 RF-040 RF-041 RF-042 RF-043 RF-044 RF-045 RF-046 RF-047 RF-048 RF-049 RF-050 RF-051 RF-052 RF-053 RF-054 RF-055 RF-056 RF-057 RF-058 RF-059 RF-060 RF-061 RF-062 RF-064 RF-065 RF-066 RF-067 RF-068 RF-069 RF-070 RF-071
```

### RNF
```text
RNF-SEC-001 RNF-SEC-002 RNF-SEC-003 RNF-SEC-004 RNF-SEC-005 RNF-SEC-006 RNF-PRI-001 RNF-PRI-002 RNF-PRI-003 RNF-PERF-001 RNF-PERF-002 RNF-PERF-003 RNF-AVA-001 RNF-AVA-002 RNF-REC-001 RNF-REC-002 RNF-REL-001 RNF-ACC-001 RNF-ACC-002 RNF-ACC-003 RNF-PORT-001 RNF-MAN-001 RNF-MAN-002 RNF-MAN-003 RNF-MAN-004 RNF-OBS-001 RNF-OBS-002 RNF-OBS-003 RNF-INT-001 RNF-INT-002 RNF-INT-003 RNF-SCA-001 RNF-SCA-002 RNF-DAT-001 RNF-DAT-002 RNF-DAT-003 RNF-DAT-004 RNF-DAT-005
```

### UC presentes
```text
UC-E01 UC-E02 UC-E03 UC-E04 UC-E05 UC-E06 UC-E07 UC-E08 UC-E09 UC-I01 UC-I02 UC-I03 UC-I04 UC-I05 UC-I06 UC-I07 UC-I08 UC-I09 UC-I10 UC-I11 UC-I12 UC-I13 UC-P01 UC-P02 UC-P03 UC-P04 UC-P05 UC-P06 UC-P07 UC-P08 UC-P09 UC-P10 UC-P11 UC-P12 UC-P13 UC-P14 UC-P15 UC-P16 UC-P17 UC-P18 UC-P19 UC-P20 UC-P21 UC-P22 UC-P23 UC-P24 UC-P25 UC-P26 UC-P27 UC-P28 UC-P29 UC-P30 UC-P31 UC-P32 UC-P33 UC-S01
```

## 9. Figuras

```text
NO APLICA.
DV-03 es un entregable tabular y el prompt no exige figura.
```

## 10. Cierre

```text
ARTEFACTO: APTO PARA CONTRARREVISIÓN
CAMBIO CANÓNICO: NINGUNO
GIT: SIN OPERACIONES
```
