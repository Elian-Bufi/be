# WP-05 — los siete oráculos TEST-ANT que el 11A dejó sin escribir

> **Qué es esto.** El 11A §16 enuncia los once escenarios de antropometría como **títulos de una línea**, sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:150-169). DV-05 materializa cuatro y lo admite: «Antropometría | 4 | 11». Los siete restantes —TEST-ANT-005 a 011— no tenían oráculo en ninguna parte.
>
> **Autorización.** DL-065, decidida por Dirección el 2026-09-20, opción A: «WP-05 escribe los siete oráculos faltantes con la plantilla de 11A §6, como entregable de legajo del paquete, y los implementa». Es el mismo criterio de oráculo derivado que WP-02 y WP-03 aplicaron bajo DL-027.
>
> **Qué no es esto.** No modifica el 11A. El legajo está protegido por `docs/MANIFEST.sha256` y editarlo rompería la verificación de hashes. Cuando Dirección quiera consolidar, toma estos siete y reemite el documento.
>
> **De dónde sale cada oráculo.** De la norma que el propio título cita o implica, con referencia `archivo:línea`. Un oráculo derivado dice qué hay que observar para aceptar la prueba; no inventa la regla, la lee.

---

## TEST-ANT-005 — La anulación preserva el original y fija la condición ANULADA

```text
TEST_ID              TEST-ANT-005
TITLE                annulment preserva original + condición ANULADA
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              06 §13 · REG-06-217 (la condición se deriva del evento de anulación)
                     REG-06-218 (ANULADA es terminal) · RF-050 (04:592: preservar el original y el motivo,
                     sin sobrescritura silenciosa) · 08 §56.12 (no presentarla como acción destructiva)
PRECONDITIONS        Profesional con capacidad antropométrica verificada y habilitada; vínculo aceptado con
                     el asesorado; B2 del alcance y A3 vigentes. Una evaluación REGISTRADA con al menos una
                     medición directa en condición EFFECTIVE.
SYNTHETIC_FIXTURE    Evaluación con peso 72,5 kg y talla 1,75 m, protocolo de laboratorio (demostración),
                     origen DIRECT_CAPTURE. Motivo de anulación: «Balanza mal calibrada.»
STEPS                1. Leer la medición y guardar su magnitud y su condición.
                     2. POST /anthropometry/measurements/{id}/annulments con un motivo.
                     3. Releer la evaluación por API-ANT-04.
EXPECTED             La respuesta trae condition = ANNULLED y el bloque annulment con su motivo, su autor y
                     su momento. En la relectura, la magnitud de la medición es **la misma de antes**, byte
                     a byte, y el motivo se conserva tal como se escribió.
NEGATIVE_ASSERTIONS  La fila de la medición no se borra ni se marca como eliminada. La magnitud no se pone
                     en cero, en null ni se reemplaza. El motivo no se normaliza ni se trunca. La evaluación
                     que la contiene sigue REGISTRADA y su propio contenido no cambia.
AUTOMATION           test/integration/antropometria.int-spec.ts
ENVIRONMENT          CI, PostgreSQL 16 real (Testcontainers); y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-05/resultados-integracion-*.md · capturas web-16 y web-17
```

**Por qué el oráculo pide releer.** Que la respuesta de la anulación diga `ANNULLED` no prueba que el original se conserve: lo prueba que una lectura posterior, por otra operación, devuelva la misma magnitud. La sobrescritura silenciosa que RF-050 prohíbe es justamente la que no se ve en la respuesta del acto.

---

## TEST-ANT-006 — La segunda anulación no duplica el efecto lógico

```text
TEST_ID              TEST-ANT-006
TITLE                doble anulación no duplica efecto lógico
LEVEL                Integración (API + PostgreSQL real) y dominio (función pura)
PRIORITY             P0
SOURCES              06 §13 · REG-06-218 (ANULADA es terminal) · RNF-REC-002 (idempotencia)
                     DV-05 adversarial 6 · DL-059, decidida: la segunda anulación responde 200
PRECONDITIONS        Las de TEST-ANT-005, con la medición ya anulada una vez.
SYNTHETIC_FIXTURE    Primera anulación con motivo «Balanza mal calibrada.»; segunda con «Otro motivo.»,
                     enviada con una Idempotency-Key **distinta**.
STEPS                1. Anular la medición (201).
                     2. Anular la misma medición otra vez, con clave nueva y motivo distinto.
                     3. Repetir con la **misma** clave dos veces seguidas.
                     4. Contar filas de anulación y eventos emitidos.
EXPECTED             La segunda responde 200 con alreadyAnnulled = true y devuelve **la anulación que ya
                     existía**: el mismo identificador y el primer motivo, no el segundo. Con la misma clave,
                     la respuesta se replica idéntica. Queda exactamente **una** fila de anulación y **un**
                     evento MedicionAnulada.
NEGATIVE_ASSERTIONS  No responde 409 ni 422: repetir un acto terminal no es un conflicto, es un reintento
                     que ya está satisfecho. El motivo de la segunda **no** reemplaza al primero. No se emite
                     un segundo evento, no se recalculan derivados otra vez, y ninguna cadena se bifurca.
AUTOMATION           test/integration/antropometria.int-spec.ts · test/integration/maquinas-wp05.int-spec.ts
                     packages/domain/src/dominio-wp05.test.ts · scripts/adversariales-wp05.mjs (caso 6)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    EVIDENCIA/WP-05/adversariales-test.json, caso «6»
```

**Por qué el oráculo insiste en el motivo.** Devolver 200 sin más dejaría pasar una implementación que pisa el motivo original con el segundo. El motivo es parte de la historia que REG-06-217 manda conservar: la prueba tiene que observar **cuál** de los dos quedó.

---

## TEST-ANT-007 — No existe reversión implícita

```text
TEST_ID              TEST-ANT-007
TITLE                no existe reversión implícita
LEVEL                Integración (API + PostgreSQL real) y dominio (función pura)
PRIORITY             P0
SOURCES              06 §13 · REG-06-218 (la anulación es terminal, sin transición de salida)
                     REG-06-219 (corregir y anular son actos distintos) · 08 §56.12
PRECONDITIONS        Las de TEST-ANT-005, con la medición ya anulada.
SYNTHETIC_FIXTURE    Corrección intentada sobre la medición anulada, con magnitud 73,1 kg.
STEPS                1. Anular la medición.
                     2. Intentar corregirla por API-ANT-05.
                     3. Verificar la condición y la magnitud efectiva después del intento.
EXPECTED             La corrección se rechaza con 422. La medición sigue ANULADA y su magnitud no cambió.
NEGATIVE_ASSERTIONS  Corregir **no** reactiva la medición. No existe ninguna operación que devuelva una
                     medición anulada a EFFECTIVE: ni corrección, ni reintento, ni una anulación con un
                     campo que la deshaga. La máquina de estado del dominio no declara esa transición y la
                     base tampoco la admite.
AUTOMATION           test/integration/antropometria.int-spec.ts · test/integration/maquinas-wp05.int-spec.ts
                     packages/domain/src/dominio-wp05.test.ts
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en los resultados de integración · copy «Una medición anulada no se
                     reactiva. Si hay una observación nueva, se registra como una medición nueva.» (web-17)
```

**Por qué el oráculo nombra las tres capas.** Una prueba que solo mira la API deja abierto que el código haga lo correcto por casualidad. Este caso se verifica en el dominio (la transición no existe), en la API (422) y en la base (el trigger rechaza el `UPDATE` directo), igual que «reabrir una versión activada falla» en WP-04.

---

## TEST-ANT-008 — Un input anulado obliga a reevaluar las dependencias

```text
TEST_ID              TEST-ANT-008
TITLE                input anulado reevalúa dependencias
LEVEL                Dominio (función pura) e integración
PRIORITY             P0
SOURCES              06 §13 y §20.3 · REG-06-220 inciso 6 (la ausencia se representa como ausencia)
                     REG-06-221 (una medición anulada deja de contar) · REG-06-161 (recálculo selectivo)
                     REG-06-204 (el recálculo no se saltea la admisibilidad)
PRECONDITIONS        Evaluación REGISTRADA con peso y talla; una corrida de cálculo que usa las dos como
                     entradas, con una versión de método vigente.
SYNTHETIC_FIXTURE    Método de demostración v2 (regla demo/peso-sobre-talla-cuadrado@1, 3 decimales).
                     Corrida original sobre peso 72,5 kg y talla 1,75 m.
STEPS                1. Ejecutar el cálculo y guardar su resultado.
                     2. Anular la **talla**, que es una entrada obligatoria del método.
                     3. Leer la corrida original y el impacto que reporta la anulación.
EXPECTED             La corrida original **se conserva** con su resultado intacto, y pasa a presentarse como
                     sin efecto. El impacto declara la corrida en withoutSuccessor, nombrando la entrada que
                     falta. Cada entrada de la corrida publica su propia condición, derivada del evento real.
NEGATIVE_ASSERTIONS  **No se inventa un sucesor**: sin la entrada obligatoria no hay resultado reproducible,
                     y una ausencia no se completa con cero, con el último valor ni con un promedio. La
                     corrida original no se borra ni se reescribe. El recálculo no se saltea la admisibilidad.
AUTOMATION           packages/domain/src/dominio-wp05.test.ts · test/integration/calculos.int-spec.ts
ENVIRONMENT          CI, PostgreSQL 16 real
EVIDENCE_EXPECTED    Fila del caso en los resultados de integración
```

**La distinción que el oráculo fija.** Anular una entrada y corregirla llevan a lugares distintos: corregir produce una corrida sucesora (REG-06-161), anular deja la corrida **sin sucesor posible** y lo dice. Confundirlas daría un número nuevo donde corresponde una ausencia declarada.

---

## TEST-ANT-009 — SIN_DATO no se transforma en cero

```text
TEST_ID              TEST-ANT-009
TITLE                SIN_DATO no se transforma en cero
LEVEL                Dominio (función pura) e integración
PRIORITY             P0
SOURCES              06 §13 · INV-06-176 (no interpolar, no imputar, no arrastrar)
                     INV-06-177 (un día sin medición vigente es ausencia de dato, no un valor)
                     REG-06-165/166 · RF-049 (04:583) · DV-05 adversarial 7, variante de mediciones
PRECONDITIONS        Asesorado con mediciones registradas en algunos días del período y ninguna en otros.
SYNTHETIC_FIXTURE    Período de tres meses con dos mediciones de peso: una el día 14 y otra el último día
                     del período, a las 21:41 hora local. Una medición de valor **cero medido** en otra
                     corrida, para distinguir «cero observado» de «sin dato».
STEPS                1. Consultar la evolución por API-ANT-06 y por la lectura propia del asesorado.
                     2. Inspeccionar los días con dato, los tramos sin dato y las banderas de honestidad.
                     3. Verificar el último día del período, tomado en hora local.
EXPECTED             Los días con medición vigente aparecen como puntos con su valor y su unidad. Los días
                     sin medición aparecen agrupados en tramos con state = NO_DATA y su cantidad de días.
                     Un **cero medido** sí es un punto disponible, con valor 0. La medición de la tarde del
                     último día aparece: el período se corta en hora local, no en UTC.
NEGATIVE_ASSERTIONS  Un tramo sin dato **no tiene ningún campo donde poner un valor**: no es un punto con
                     el valor vacío, es otra forma. honesty.interpolated, .imputed y .carriedForward viajan
                     como literales false en el contrato, no como booleanos libres. Ninguna respuesta trae
                     un valor inventado para un día sin medición.
AUTOMATION           packages/domain/src/dominio-wp05.test.ts · test/integration/antropometria.int-spec.ts
                     scripts/adversariales-wp05.mjs (caso «7-mediciones»)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    web-18 · apk-05-peso-corregido-hoy · adversariales-test.json, caso «7-mediciones»
```

**Por qué el fixture incluye un cero medido.** Sin él, una implementación que devuelva `0` para los días sin dato pasaría la prueba por el lado equivocado. El oráculo tiene que poder distinguir «la persona pesó cero» —imposible, pero observable— de «no sabemos cuánto pesó».

---

## TEST-ANT-010 — Lo no comparable no forma línea continua

```text
TEST_ID              TEST-ANT-010
TITLE                no comparable no forma línea continua
LEVEL                Dominio (función pura) e integración
PRIORITY             P0
SOURCES              06 §13 · REG-06-162 (comparar exige evaluación explícita de compatibilidad)
                     REG-06-163/164 · REG-06-166 (no unir un hueco con el punto anterior)
                     INV-06-173/174/175 · DL-064, decidida: metadato calculado por tramo
PRECONDITIONS        Asesorado con dos mediciones de la misma métrica tomadas con **distinta unidad de
                     origen** o distinto protocolo.
SYNTHETIC_FIXTURE    Dos mediciones de talla en el mismo período: una en centímetros (82 cm) y otra en
                     metros (0,81 m), con el mismo protocolo.
STEPS                1. Consultar la evolución de esa métrica.
                     2. Inspeccionar el grupo de comparabilidad de cada punto y el motivo declarado.
EXPECTED             Los dos puntos **se muestran igual**, ninguno se oculta. Cada uno declara su grupo de
                     comparabilidad, y el segundo declara por qué no es comparable con el anterior (UNIT).
                     Los grupos se publican con su protocolo, su método y su unidad.
NEGATIVE_ASSERTIONS  **No se convierte la unidad en silencio** para forzar la comparación: convertir es un
                     acto explícito y reproducible (REG-06-155). No se descarta el punto incomparable. No se
                     dibuja una línea entre puntos de grupos distintos, y la pantalla no ofrece un gráfico
                     de línea en ninguna de las dos superficies.
AUTOMATION           packages/domain/src/dominio-wp05.test.ts · scripts/adversariales-wp05.mjs
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    adversariales-test.json, campo «noComparable» del caso «7-mediciones» · copy «Dos
                     mediciones se comparan solo si comparten protocolo, método y unidad. Cuando no, se
                     muestran igual, señaladas.» (web-18, apk-04, apk-05)
```

**Las dos salidas que el oráculo prohíbe.** Ante dos puntos incomparables hay dos atajos tentadores: convertir para que encajen, u ocultar el que molesta. Los dos producen una serie que miente. El legajo pide la tercera: mostrarlos y señalarlo.

---

## TEST-ANT-011 — La importación controlada conserva la procedencia

```text
TEST_ID              TEST-ANT-011
TITLE                controlled import conserva procedencia
LEVEL                Integración (API + PostgreSQL real) y dominio (contrato)
PRIORITY             P0
SOURCES              06 §13 · RNF-DAT-002 (procedencia obligatoria) · REG-06-154 (unidad de origen)
                     INV-06-167 (no exigir formato ni columnas a la referencia de preparación)
                     09v11:309-332 · DL-062, decidida: el flujo de carga va al paquete de integraciones
PRECONDITIONS        Las de TEST-ANT-005. La evaluación se toma con origen CONTROLLED_IMPORT.
SYNTHETIC_FIXTURE    Medición de peso 70,4 kg con source.type = CONTROLLED_IMPORT y
                     preparationReference = «prep-sintetica-7f3a» (cadena opaca, sin formato exigido).
STEPS                1. Crear la toma con origen de importación controlada y su referencia.
                     2. Registrarla.
                     3. Releerla por API-ANT-04 y consultar la evolución.
EXPECTED             La medición conserva su origen CONTROLLED_IMPORT y su referencia de preparación, tal
                     como se enviaron. En la serie, el punto declara su clase de dato y su grupo de
                     comparabilidad como cualquier otro.
NEGATIVE_ASSERTIONS  La referencia **no se valida contra ningún formato, proveedor ni catálogo**: cualquier
                     cadena vale (INV-06-167). Una medición que no es de importación controlada **no puede**
                     llevar referencia de preparación: la base lo rechaza, no solo el contrato. El origen no
                     se normaliza a DIRECT_CAPTURE ni se pierde al leer.
AUTOMATION           test/integration/antropometria.int-spec.ts · test/integration/maquinas-wp05.int-spec.ts
                     packages/domain/src/dominio-wp05.test.ts
ENVIRONMENT          CI, PostgreSQL 16 real
EVIDENCE_EXPECTED    Fila del caso en los resultados de integración
```

**Lo que este caso no prueba.** No prueba que exista un flujo de importación: por DL-062 ese flujo vive en el paquete de integraciones. Prueba que **el dato importado conserva de dónde vino**, que es la mitad que WP-05 sí tiene que garantizar y la que hace que el flujo, cuando llegue, no pueda saltearse la procedencia.

---

## Trazabilidad

| Oráculo | Implementado en | Estado |
|---|---|---|
| TEST-ANT-005 | `antropometria.int-spec.ts` | PASS |
| TEST-ANT-006 | `antropometria.int-spec.ts` · `maquinas-wp05.int-spec.ts` · `dominio-wp05.test.ts` · adversarial 6 | PASS |
| TEST-ANT-007 | `antropometria.int-spec.ts` · `maquinas-wp05.int-spec.ts` · `dominio-wp05.test.ts` | PASS |
| TEST-ANT-008 | `dominio-wp05.test.ts` · `calculos.int-spec.ts` | PASS |
| TEST-ANT-009 | `dominio-wp05.test.ts` · `antropometria.int-spec.ts` · adversarial 7 | PASS |
| TEST-ANT-010 | `dominio-wp05.test.ts` · adversarial 7 | PASS |
| TEST-ANT-011 | `antropometria.int-spec.ts` · `maquinas-wp05.int-spec.ts` · `dominio-wp05.test.ts` | PASS |

**Condición de cierre de DL-065.** El 11A incorpora estos siete oráculos y reemite su hash. Hasta entonces, viven acá.
