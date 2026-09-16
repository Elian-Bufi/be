> **Addendum v5 — 13-09-2026:** C0 corregido y relaciones C2–C8 reconciliadas con DER v5. Las afirmaciones históricas inferiores no sustituyen `../DV-06/AJUSTES_CORRESPONDENCIA_v5.md`. Operaciones/guardas y máquinas v4 se conservan. Producción actual: ChatGPT/Codex; reverificación independiente pendiente.

# DV-07 — Diagrama de clases del dominio · veinte figuras

> **Produce:** Claude, por delegación de Dirección · 2026-09-11
> **Fuente única:** `BE-LEG-06 v0.1.1` — `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1`
> **Norma:** `BE_MESA_02_ESTANDAR_DE_CALIDAD_POR_ENTREGABLE` §2 · DV-07 nivel tesis + distinción
> **Estado:** `CONCEPTUAL — A RECONCILIAR CON REPOSITORIO (B-11 · H-07-DOM-01)` en las ocho vistas de clases
> **Reemplaza:** `DV-07` v1 (2026-09-10) · **Cambio semántico:** ninguno

## Qué cambió respecto de la versión anterior

| | v1 | v2 |
|---|---|---|
| Figuras | 9 | **20** |
| Diagramas de estado | **0** | **9** |
| Transiciones del 06 representadas | 0 | **37 de 37** |
| Operaciones con guarda | 0 | **39 operaciones · 79 guardas e invariantes** |
| Metamodelo | grilla de 19 cajas sin relaciones | **19 constructos · 19 relaciones nombradas** |
| Diagramas de secuencia | 0 | **2** |
| Enumeraciones con tokens exactos | parcial | **5** |

## Estructura del entregable

**Nueve diagramas de estado** (`DV-07.E1…E9`) — uno por cada máquina con lista blanca del 06: estado operativo de cuenta, verificación profesional por alcance, solicitud de vínculo, vínculo por alcance, consentimiento, proceso operativo, versión de plan, registro de ejecución real e incidencia administrativa. Cada transición lleva **nombre, guarda y evento** exactamente como la tabla de lista blanca del bloque propietario.

**Ocho vistas de clases** (`DV-07.1…8`) — identidad, vínculo, verificación, versionado, antropometría, nutrición, entrenamiento, revisión y analítica. Atributos idénticos a `DV-06`, operaciones con guarda, invariantes como restricciones al pie.

**Un metamodelo** (`DV-07.0`) — los diecinueve constructos raíz con las relaciones que los vinculan: una Máquina declara Estados y Transiciones; una Transición emite un Evento; una Proyección deriva de la Fuente de verdad y nunca la reemplaza.

**Dos diagramas de secuencia** (`DV-07.S1`, `S2`) — revocar consentimiento y anular medición. No los pide la escuela; demuestran que el comportamiento está diseñado y no solo enumerado.

## Las operaciones son transiciones, con guarda

Cada operación es una transición declarada, en infinitivo según `CONV-06-04`, con su condición entre corchetes:

```text
+ cerrarCuenta() [sesión válida ∧ confirmación explícita]
+ anular() [VIGENTE ∧ autorizado ∧ motivo]
+ activarVersión() [contenido completo ∧ profesional autorizado]
+ evaluar() [las 7 dimensiones, por operación]
```

Sin guarda, la operación mentiría por omisión: sugeriría que cualquiera puede invocarla en cualquier estado. **Cero métodos técnicos** — barrido de `Repository`, `Service`, `getter`, `setter`, `VARCHAR`: 0.

## Verificación reproducible

```text
figuras ......................... 20  (9 estados + 9 clases/metamodelo + 2 secuencias)
transiciones del 06 cubiertas ... 37 / 37   ·   faltantes: NINGUNA
operaciones distintas ........... 39
guardas e invariantes ........... 79
enumeraciones con tokens del 06 .. 5
léxico técnico o físico ......... 0
rótulo de reconciliación ........ 8 / 8 vistas de clases
```

El metamodelo queda exento del rótulo: no representa entidades de datos sino categorías de construcción.

## Prueba de tribunal

**¿Qué pregunta responde?** Cómo se comporta el sistema: qué estados existen, qué transiciones están permitidas, bajo qué condición y qué evento emiten. Y qué estructura tiene cada clase.

**¿Qué deja sin responder?** Cómo se persiste físicamente —intake— y cómo se distribuye en componentes —`DV-08`/`DV-09`.

**¿Un analista que no conoce BE entiende el comportamiento?** Sí. Cada máquina muestra su estado inicial, sus transiciones con guarda y el estado terminal, más una anotación con lo que el tribunal preguntaría: «la observación no es un quinto estado», «decidir ≠ aplicar», «lo emitido no se reescribe», «no existe reversión de la anulación».
