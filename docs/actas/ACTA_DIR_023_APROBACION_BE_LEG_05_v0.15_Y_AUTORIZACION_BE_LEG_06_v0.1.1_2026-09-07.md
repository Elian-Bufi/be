# ACTA-DIR-023 — Aprobación documental de BE-LEG-05 v0.15 y autorización de redacción de BE-LEG-06 v0.1.1

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — aprobación documental + autorización de parche siguiente  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Antecedentes

`ACTA-DIR-021` ratificó el mapa transversal y `ACTA-DIR-022` aprobó documentalmente BE-LEG-04 v0.4.2.1 y autorizó BE-LEG-05 v0.15.

La contrarrevisión externa independiente de BE-LEG-05 v0.15 concluyó:

```text
CONFORME — BE-LEG-05 v0.15 APTO PARA DECISIÓN DE DIRECCIÓN

56 UC = 33 P + 13 I + 9 E + 1 S
69 RF
5 TR
HALLAZGOS BLOQUEANTES: 0
AJUSTES OBLIGATORIOS: 0
```

Verificó especialmente:

- `UC-I13` como único patrón transversal de cálculo reproducible;
- `UC-I09` como especialización antropométrica real;
- preservación de `DEC-046 §4.4/§4.9` + `INV-06-133`;
- `UC-P32` / `UC-P33` como objetivos actorales distintos;
- `UC-P19 V04` intacta;
- `UC-E03` ampliado a `corregir o anular`;
- `anulación ≠ borrado`;
- cero invasión de 06/07/08/09/10.

---

## 2. Aprobación de BE-LEG-05 v0.15

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_05_v0.15_MAESTRO_CASOS_DE_USO_E_HISTORIAS_PARCHE_TRANSVERSAL_2026-09-07.md` | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` |

Resultado aprobado para continuar el parche:

```text
69 RF
56 UC
5 TR

UC NUEVOS:
UC-I13
UC-P32
UC-P33

UC EXISTENTE AMPLIADO:
UC-E03 — corregir o anular medición antropométrica

UC-P19 V04:
PRESERVADO
```

La aprobación es documental y **no ejecuta canonización Git**.

---

## 3. Autorización de BE-LEG-06 v0.1.1

Se autoriza redactar:

```text
BE-LEG-06 v0.1.1
BORRADOR DE PARCHE TRANSVERSAL
```

sobre la baseline aprobada/canónica:

```text
BE-LEG-06 v0.1
SHA-256 2200dba6313a11a8dfcfd3f62fa12d00f27bbf99985e9a61ef62eebf3228b727
```

### 3.1. CAP-MET

06 debe:

1. conservar `T-06-N12 — Regla de cálculo` como constructo raíz;
2. no crear una segunda definición paralela de cálculo reproducible;
3. modelar como mínimo:
   - Método/versión profesional;
   - Ejecución de cálculo;
   - Referencia profesional adoptada;
4. declarar requisitos de input y procedencia admisible;
5. conservar snapshot/referencias de inputs y resultado;
6. permitir varias ejecuciones independientes;
7. preservar:
   ```text
   cálculo ≠ sugerencia ≠ selección ≠ referencia ≠ decisión
   ```
8. preservar `DEC-046 §4.4/§4.9` e `INV-06-133`;
9. permitir que Nutrición y Entrenamiento referencien cálculo de apoyo sin convertirlo en objetivo automático;
10. hacer que Antropometría especialice el patrón común ya existente.

### 3.2. CAP-DAT

06 debe modelar, partiendo del mínimo:

```text
Plantilla BE versionada
Solicitud estructurada
Respuesta estructurada autoinformada
```

`Campo` y `Respuesta de campo` comienzan como estructuras internas, no entidades, salvo necesidad demostrada.

Debe preservar:

```text
SELF_REPORTED ≠ medición
SELF_REPORTED ≠ diagnóstico
solicitud ≠ consentimiento
solicitud ≠ autorización
mismo valor ≠ misma procedencia
```

### 3.3. ANT-DRAFT

Dentro de `M-09`, 06 debe materializar técnicamente `UC-P19 V04` distinguiendo:

```text
EN_PREPARACIÓN ≠ REGISTRADA
```

sin crear una nueva especialidad, plan o historia longitudinal falsa.

### 3.4. ANT-VOID

Dentro de `M-09`, 06 debe materializar la rama de anulación de `RF-050`:

```text
ANULADA ≠ BORRADA
```

La condición efectiva se resuelve usando el mecanismo ya existente de `REG-06-16`, inciso 4:

> el área propietaria puede declarar condiciones efectivas adicionales dentro de su propia semántica, sin borrar el original ni convertirlas en categoría global de M-06.

`B-06` no se reabre ni redefine.

---

## 4. Estrategia de parche autorizada

Para preservar la baseline por bloques:

- no renumerar B-00…B-13;
- no reescribir los 14 bloques históricos por estilo;
- mantener `209/209` como trazabilidad de la arquitectura inicial;
- incorporar un bloque normativo **posterior al maestro baseline**, explícitamente identificado como parche transversal;
- usar IDs nuevos posteriores a los máximos actuales:
  - `REG-06-202+`;
  - `INV-06-211+`;
- cualquier nuevo término `T-06-*` debe declararse como alta del parche, no como si hubiera existido en B-00 original.

---

## 5. Fronteras

No corresponde definir en 06:

- política fina de consentimiento/acceso/retención → 08;
- endpoints/DTO/idempotencia → 09;
- UI/copy → 10;
- pruebas → 11A;
- trazabilidad final → 12;
- nueva topología/módulos/proveedores → 07.

BE-LEG-07 permanece:

```text
SIN CAMBIO
```

---

## 6. Estado

```text
BE-LEG-05 v0.15:
APROBADO DOCUMENTALMENTE
NO CANONIZADO POR ESTE ACTO

BE-LEG-06 v0.1:
BASELINE CANÓNICA

BE-LEG-06 v0.1.1:
AUTORIZADO A REDACTAR
NO APROBADO

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE DE 06 v0.1.1

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
