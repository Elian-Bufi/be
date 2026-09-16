# BE-LEG-10 v0.8 — B10-08/B10-09 · Cartera, Dashboard, Timeline, Coordinación y Proyecciones UX P0 TO-BE

> **Producto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** 10 — Diseño UI/UX y Prototipos  
> **Versión:** `v0.8`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR UX P0 TO-BE — NO APROBADO · NO CANÓNICO`  
> **Bloques:** `B10-08 + B10-09`  
> **Autorización:** `ACTA-DIR-027`  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Propósito

Esta versión diseña la experiencia P0 de:

```text
B10-08
Cartera
Dashboard interdisciplinario
Timeline
Coordinación
Progreso longitudinal propio

B10-09
Ocho proyecciones M-11
Visualización profunda
Estados longitudinales
partialView
Configuración de umbral profesional
```

No crea nuevas reglas de dominio ni contratos.

---

# 1. Fuentes propietarias

| Documento | SHA-256 | Uso |
|---|---|---|
| 04 v0.4.2.1 | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` | RF-052…058, RF-065 |
| 05 v0.15 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` | UC-P23, P24, P31, E07 |
| 06 v0.1.1 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` | M-11, ocho proyecciones, invariantes |
| 08 v0.1.5 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` | acceso/partial view/no residual |
| 09 v0.16 | `0b9bc99a6a27e182695be02397a79908a7bc012bcd078472acd8aa8f79ae6ce4` | DSH/PRJ/CRD |
| 10 v0.7.2 | `69023cd009a4b80f815253ca092b31f69d2b19e8c19cc7e8f1092760b82badb7` | reconciliación previa |
| 10 v0.1 | `1b9f0551ec6f20e91cbe917c657d6259cc004bbf954e4b8fd5144297088e8a9c` | arquitectura UX preliminar |

Precedencia:

```text
04 → obligación
05 → conducta observable
06 → semántica/read model
08 → revelabilidad
09 → contrato
10 → representación/interacción
```

---

# 2. Alcance y no alcance

## 2.1. Incluido

- `SHELL-PRO → Cartera`;
- workspace del asesorado;
- cola de revisión;
- dashboard interdisciplinario;
- timeline longitudinal;
- coordinación P0;
- `SHELL-ADV → Progreso`;
- ocho proyecciones profesionales;
- threshold profesional para volumen efectivo;
- empty/partial/no-data/not-comparable;
- navegación entre resumen y análisis profundo.

## 2.2. Excluido

- score global;
- ranking de asesorados;
- gravedad/riesgo clínico;
- diagnóstico;
- predicción futura;
- 1RM estimado como PR;
- fórmula universal de volumen;
- ponderación automática PRIMARY/SECONDARY;
- comparación con terceros;
- nueva API;
- nueva taxonomía de proyecciones;
- chat general;
- B10-02/B10-03;
- responsive final y tokens de accesibilidad — B10-10.

---

# 3. Invariantes UX

```text
cartera ≠ triage clínico

pendiente ≠ gravedad

dashboard ≠ fuente de verdad
dashboard ≠ revisión
dashboard ≠ score

timeline ≠ causalidad

proyección ≠ decisión profesional

partialView ≠ error

NO_DATA ≠ 0

NOT_COMPARABLE ≠ tendencia continua

PRIMARY / SECONDARY ≠ ponderación

marca observada ≠ 1RM estimado

prescrito vs registrado ≠ adherencia score

coordinar ≠ prescribir
coordinar ≠ modificar
coordinar ≠ transferir responsabilidad
```

---

# 4. Mapa de superficies

## Profesional

```text
SHELL-PRO
└─ Cartera
   ├─ Cartera
   └─ Revisiones pendientes
      ↓
   Asesorado
   └─ Workspace
      ├─ Resumen
      │  └─ Dashboard
      ├─ Timeline
      ├─ Nutrición
      ├─ Entrenamiento
      ├─ Antropometría
      └─ Análisis
         └─ Proyecciones
```

`Análisis` puede resolverse como subnavegación dentro del workspace; no se crea una entrada global nueva.

## Asesorado

```text
SHELL-ADV
└─ Progreso
   ├─ Nutrición
   ├─ Entrenamiento
   └─ Antropometría
```

Consume `API-DSH-05`, no `API-PRJ-01` como superficie profesional.

---

# 5. B10-08 — Cartera profesional

## 5.1. Objetivo

Permitir que el profesional organice trabajo por **hechos operativos**:

- asesorado;
- alcance;
- proceso;
- pendiente real;
- última revisión válida;
- próxima acción;
- disponibilidad de datos.

No clasificar personas.

## 5.2. Binding

```text
Cartera
→ API-DSH-01

Revisiones pendientes
→ API-DSH-02
```

## 5.3. Arquitectura recomendada

```text
Cartera

[ Cartera ] [ Revisiones pendientes ]

Filtros:
Alcance
Estado del proceso
Pendiente sí/no

Listado operativo
```

La elección visual `tabla desktop / cards compactas responsive` queda a prototipo/B10-10; la **semántica de columnas** queda cerrada aquí.

## 5.4. Fila de cartera

Contenido P0:

```text
Nombre del asesorado

Alcance / dominio
Estado de proceso

Revisión
- Pendiente / no pendiente
- Última revisión válida, cuando exista

Próxima acción
- texto/estado autorizado

Disponibilidad descriptiva
- Nutrición
- Entrenamiento
- Antropometría
```

No mostrar:

```text
Riesgo alto
Paciente crítico
Mala adherencia
Urgente por IA
Score 42/100
Peor rendimiento
```

## 5.5. Orden y filtros

Se permiten dimensiones reales soportadas por 06/09:

- nombre;
- alcance;
- pendiente;
- fecha real;
- estado operativo;
- disponibilidad.

UX no introduce ranking clínico.

### `CAND-10-DSH-01`

**Cartera como tabla operativa en desktop con fallback card responsive.**

Estado: `CANDIDATA DE PRESENTACIÓN — PROTOTIPO`.

---

# 6. Cola de revisiones

## 6.1. Objetivo

Separar “tengo trabajo pendiente” de “el asesorado está mal”.

## 6.2. Binding

```text
API-DSH-02
```

Filtros contractuales:

```text
domain
status
```

## 6.3. Item

```text
Asesorado
Dominio
Pendiente desde
Motivo operativo
Fuentes relacionadas disponibles
```

Copy permitido:

```text
Revisión pendiente
Nueva evidencia disponible
Revisión programada
Próxima acción pendiente
```

Copy prohibido:

```text
Riesgo
Gravedad
Alerta médica
Incumplidor
```

Abrir un pendiente:

```text
≠ resolver
≠ revisar
```

Solo el caso propietario registra la revisión.

### `CAND-10-DSH-02`

**Tab separado “Revisiones pendientes” dentro de Cartera.**

Estado: `RATIFICABLE EN UX · PROTOTIPAR`.

---

# 7. Empty states de Cartera

## Sin asesorados

> **Todavía no tenés asesorados activos en este contexto.**

CTA solo hacia flujo ya permitido de vínculo/cartera.

## Sin pendientes

> **No hay revisiones pendientes para los filtros actuales.**

No usar lenguaje de “todo está bien” o “todos saludables”.

## Datos parciales

No completar disponibilidad no autorizada con “No tiene datos”.

---

# 8. Dashboard interdisciplinario

## 8.1. Binding

```text
API-DSH-03
```

## 8.2. Estructura

```text
Asesorado + período

[ Vista parcial, si aplica ]

Nutrición
Entrenamiento
Antropometría

Revisiones
Próximas acciones

Análisis disponibles
```

## 8.3. Regla principal

El dashboard es **composición de read models**, no mezcla semántica.

Cada bloque conserva:

- dominio;
- período;
- procedencia;
- autoría;
- unidad/método cuando aplique;
- estado de dato.

## 8.4. Vista parcial

Si:

```text
partialView = true
```

mostrar un aviso genérico:

> **Vista parcial según tu acceso actual.**

No listar automáticamente:

```text
No tenés acceso a Antropometría
Existe Nutrición pero está bloqueada
Hay datos ocultos
```

Los dominios no revelables se omiten salvo que 08/09 permita legítimamente revelar su existencia.

### `CAND-10-DSH-03`

**Banner único de partialView + omisión de dominios ocultos por defecto.**

Estado: `RATIFICABLE`.

---

# 9. Jerarquía del dashboard

El Dashboard **no debe absorber las ocho proyecciones profundas**.

Se resuelve Q10-03 así:

```text
Dashboard
→ resumen interdisciplinario
→ disponibilidad / accesos a análisis

Proyección profunda
→ pantalla “Análisis”
→ API-PRJ-01
```

Por tanto:

- no cargar ocho gráficos pesados en Resumen;
- no transformar dashboard en “control center” saturado;
- una proyección puede tener teaser/resumen **solo si API-DSH-03 ya lo incluye**;
- el detalle analítico vive en B10-09.

### `DEC-10-UX-01 — Resumen ≠ análisis profundo`

Estado: `DECISIÓN UX CANDIDATA PARA DIRECCIÓN`.

Fundamento: H-09-PRJ-01 + separación M-11/DSH/PRJ.

---

# 10. Tarjetas de dominio

Cada dominio puede mostrar:

```text
Estado de disponibilidad
Resumen factual
Último evento/revisión visible
Próxima acción visible
Acceso a detalle
```

No usar:

- semáforo clínico;
- “estado general”;
- color de riesgo;
- score;
- ranking.

Los estados visuales deben describir **datos**, no persona.

---

# 11. Timeline longitudinal

## 11.1. Binding

```text
API-DSH-04
```

Filtros:

```text
domain
type
periodStart
periodEnd
```

## 11.2. Entrada

```text
Dominio
Tipo de evento
Resumen factual

Ocurrió:
occurredAt

Registrado:
recordedAt

Autor / procedencia
Relaciones reconstruibles
```

`occurredAt` es la fecha principal cuando existe.

`recordedAt` se muestra como metadato secundario cuando aporta contexto.

Si `occurredAt` falta, no copiar `recordedAt` en su lugar.

## 11.3. Relaciones

Mostrar únicamente relaciones que llegan reconstruibles:

```text
Plan → ejecución
Evaluación → resultado derivado
Original → corrección
Revisión → acción aplicada
```

No dibujar flechas causales por proximidad temporal.

### `CAND-10-TIM-01`

**Timeline cronológico por ocurrencia con `Registrado el…` como metadato secundario.**

Estado: `RATIFICABLE`.

---

# 12. Visualización de correcciones y anulación en timeline

Cuando exista historia autorizada:

```text
Medición original
→ Corrección
```

y:

```text
Medición original
→ Anulación
```

son relaciones distintas.

No:

```text
Original reemplazado
Original eliminado
```

Una anulación no borra el evento histórico.

---

# 13. Coordinación P0

## 13.1. Binding

```text
Escritura
→ API-CRD-01

Lectura
→ Timeline / Dashboard
```

No existe GET P0 propio de coordinación.

## 13.2. Entrada UX

Acción contextual:

> **Agregar nota de coordinación**

Disponible dentro del workspace del asesorado cuando el contexto es revelable.

## 13.3. Formulario

P0:

```text
Dominio de origen
Finalidad
Destinatario / visibilidad permitida
Nota
Referencias autorizadas
```

Mensajes de límite:

> La nota aporta contexto. No modifica planes, objetivos ni decisiones de otro profesional.

## 13.4. Prohibido

```text
chat libre
inbox general
prescripción cruzada
editar plan ajeno
registrar revisión por el destinatario
transferir responsabilidad
```

## 13.5. Referencias protegidas

Si una referencia no es visible para el destinatario:

- no se vuelve visible por mencionarla;
- UX no promete “el destinatario verá este dato”.

## 13.6. Borrador solo-autor

`UC-E07 V05` existe conductualmente, pero 09 mantiene una condición abierta de lectura.

Por tanto P0 v0.8:

```text
NO diseña guardado persistente de borrador de coordinación
```

Si se necesita:

```text
hallazgo demostrado
→ reconciliar 08/09
```

### `CAND-10-CRD-01`

**Coordinación como acción contextual, no mensajería.**

Estado: `RATIFICABLE`.

---

# 14. Progreso longitudinal propio — APK

## 14.1. Binding

```text
API-DSH-05
```

## 14.2. Arquitectura

```text
Progreso

[ Nutrición ] [ Entrenamiento ] [ Antropometría ]

Período

Contenido longitudinal propio
```

No crear score interdisciplinario.

## 14.3. Reglas

- solo información propia;
- planificación ≠ ejecución;
- directo ≠ derivado;
- ocurrió ≠ registrado;
- autoría/procedencia visibles cuando aporten comprensión;
- límites de comparación visibles;
- no comparación con terceros.

## 14.4. NO_DATA

> **No hay datos registrados para este período.**

No:

> 0

## 14.5. NOT_COMPARABLE

> **Estos registros no pueden mostrarse como una misma tendencia con los criterios disponibles.**

Se puede mostrar historia separada, no línea continua.

### `CAND-10-ADV-PROG-01`

**Progreso propio por dominio, no feed interdisciplinario único.**

Estado: `RATIFICABLE`.

---

# 15. B10-09 — Catálogo de ocho proyecciones

Taxonomía cerrada:

1. `TRAINING_VOLUME_BY_EXERCISE`
2. `TRAINING_VOLUME_BY_MUSCLE_ZONE`
3. `TRAINING_EFFECTIVE_VS_TOTAL_VOLUME`
4. `TRAINING_PROGRESSION_BY_EXERCISE`
5. `TRAINING_PERSONAL_RECORDS`
6. `TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE`
7. `ANTHROPOMETRY_LONGITUDINAL`
8. `NUTRITION_PRESCRIBED_VS_RECORDED`

No agregar novena proyección desde UX.

---

# 16. Navegación de Análisis

Dentro del workspace profesional:

```text
Análisis

Entrenamiento
- Volumen por ejercicio
- Volumen por zona
- Volumen efectivo vs total
- Progresión
- Marcas personales
- Distribución por zona

Antropometría
- Evolución longitudinal

Nutrición
- Prescripto vs registrado
```

Binding:

```text
API-PRJ-01
```

El listado puede consumir `projectionAvailability` del dashboard para evitar ofrecer accesos inútiles, pero la disponibilidad no se interpreta como score.

### `CAND-10-PRJ-01`

**Catálogo agrupado por dominio dentro de workspace.**

Estado: `RATIFICABLE`.

---

# 17. Estado común de una proyección

Estados UX derivados:

| Estado técnico | Representación UX |
|---|---|
| `AVAILABLE` | mostrar resultado |
| `NO_DATA` | “No hay datos para este período” |
| `NOT_COMPARABLE` | historia visible, sin tendencia homogénea |
| `INSUFFICIENT_INFORMATION` | “No hay información suficiente para construir esta vista” |
| `NOT_AVAILABLE_TO_VIEW` | usar solo si revelar existencia es legítimo |

Nunca representar `NO_DATA` como valor `0`.

---

# 18. partialView en proyección

Si:

```text
partialView = true
```

mostrar:

> **Vista parcial según tu acceso actual.**

El gráfico/resultado se construye únicamente con fuentes autorizadas.

No marcar gaps ocultos como “faltan datos de X” si eso filtra una categoría no revelable.

### `CAND-10-PRJ-02`

**partialView se informa a nivel de proyección, no mediante candados sobre fuentes ocultas.**

Estado: `RATIFICABLE`.

---

# 19. Proyección 1 — Volumen por ejercicio

## Semántica

- volumen observado;
- por ejercicio;
- por período;
- con criterio derivativo trazable;
- ausencia de carga/reps ≠ 0.

## Representación recomendada

Principal:

```text
lista ordenable + barras horizontales
```

Cada fila:

```text
Ejercicio
Volumen observado
Unidad
Estado de datos
```

Detalle:

- fuente/período;
- especificación utilizada.

No inventar trend si la response no lo provee.

### `CAND-10-PRJ-03`

**Barras horizontales + tabla accesible.**

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 20. Proyección 2 — Volumen por zona muscular

Debe separar:

```text
PRIMARY
SECONDARY
```

Sin coeficiente implícito.

Representación recomendada:

- barras agrupadas por zona;
- contribución primaria/secundaria visible por separado;
- no heatmap ponderado si no existe especificación de ponderación.

### `CAND-10-PRJ-04`

**Barras agrupadas antes que mapa corporal para volumen por zona.**

Fundamento: evita transformar rol en peso.

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 21. Proyección 3 — Volumen efectivo vs total

## Precondición profesional

La definición depende de umbral profesional versionado.

Binding:

```text
API-PRJ-02
API-PRJ-03
```

Si no existe configuración aplicable:

> **Configurá tu criterio de volumen efectivo para utilizar esta proyección.**

No:

> BE recomienda RIR ≤ 3.

## Visualización

Mostrar por separado:

```text
Total observado
Evaluable
Efectivo según tu criterio
No clasificable
```

Recomendación:

```text
barra segmentada + valores absolutos
```

No calcular “% de adherencia”.

### `CAND-10-PRJ-05`

**Barra segmentada con `notClassifiable` explícito.**

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 22. Configuración del umbral profesional

Superficie contextual dentro de la proyección:

```text
Criterio de volumen efectivo

Criterio actual:
RIR

Condición:
<configuración profesional>

Versión / actualizado
[ Editar criterio ]
```

Edición:

- explícita;
- con confirmación;
- no reescribe proyecciones históricas;
- no se presenta como criterio BE.

### `CAND-10-PRJ-06`

**Configuración contextual dentro de Volumen efectivo.**

Estado: `RATIFICABLE EN CONDUCTA · UI A PROTOTIPO`.

---

# 23. Proyección 4 — Progresión carga / reps / RIR

Unidades distintas no comparten eje.

Representación recomendada:

```text
Carga
[ gráfico ]

Repeticiones
[ gráfico ]

RIR
[ gráfico ]
```

Tres small multiples alineados por fecha.

Reglas:

- puntos observados únicamente;
- gaps visibles;
- cero interpolación;
- no reconstruir RIR de sesión a serie;
- correcciones conservadas.

### `CAND-10-PRJ-07`

**Small multiples sincronizados, sin dual-axis.**

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 24. Proyección 5 — Marcas personales

Mostrar únicamente PR **observadas** bajo criterio explícito.

Representación:

```text
Ejercicio
Tipo de marca
Valor
Fecha de ocurrencia
Fuente
```

Badge posible:

> **Observada**

Nunca:

```text
1RM estimado
PR proyectado
Próxima marca esperada
```

si no existe especificación propietaria.

### `CAND-10-PRJ-08`

**Listado de PR observadas, no “récordes inteligentes”.**

Estado: `RATIFICABLE`.

---

# 25. Proyección 6 — Distribución de trabajo por zona

Esta es la proyección apta para mapa corporal porque 06 delega la representación a 10.

## Opción principal candidata

```text
Mapa corporal no clínico
+ leyenda cuantitativa
+ tabla accesible de zonas
```

La intensidad representa `observedContribution`, **no riesgo, lesión ni calidad**.

No usar semáforo clínico.

La tabla es obligatoria como alternativa semántica para accesibilidad y precisión.

### `CAND-10-PRJ-09`

**Mapa corporal + tabla accesible.**

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 26. Proyección 7 — Evolución antropométrica longitudinal

Reutiliza honestidad B10-07.

Representación:

- métrica seleccionada;
- unidad;
- puntos reales;
- grupos de comparabilidad;
- gaps;
- segmentos no comparables separados;
- directo/derivado identificable cuando aplique.

No unir:

```text
grupo A ───── grupo B
```

si no son comparables.

Representación:

```text
línea por tramo comparable
+ ruptura visual
+ historia no comparable visible
```

### `CAND-10-PRJ-10`

**Línea quebrada por grupos de comparabilidad.**

Estado: `RATIFICABLE EN SEMÁNTICA · PROTOTIPO VISUAL`.

---

# 27. Proyección 8 — Prescripto vs registrado

Semántica:

```text
prescripto
vs
registrado
```

No:

```text
cumplimiento %
nota
aprobado/reprobado
```

Representación recomendada:

- pares de barras/valores por dimensión disponible;
- diferencias descriptivas;
- missing explícito;
- período visible.

Si no existe registro:

> **Sin registro para comparar en este período.**

No asumir incumplimiento.

### `CAND-10-PRJ-11`

**Comparación pareada descriptiva, sin score.**

Estado: `PRESENTACIÓN A PROTOTIPO`.

---

# 28. Q10-03 — Resolución UX

Pregunta:

> ¿Qué proyecciones P0 merecen visualización principal vs detalle?

Resolución candidata:

```text
Dashboard interdisciplinario
→ NO embebe proyecciones profundas completas

Dashboard
→ resumen + availability + acceso

Análisis
→ ocho proyecciones profundas
```

Dentro de cada dominio se puede mostrar una miniatura/resumen **solo si forma parte del read model DSH**, no ejecutando ocho PRJ como requisito del dashboard.

Esto evita:

- sobrecarga;
- duplicación contractual;
- dashboard convertido en analytics suite;
- falsas jerarquías entre proyecciones.

### `DEC-10-UX-02 — Proyecciones profundas viven en Análisis`

Estado: `CANDIDATA PARA DIRECCIÓN`.

---

# 29. Estados de carga/error

## Loading

Skeleton sin datos inventados.

## Error de proyección

> **No pudimos cargar esta vista.**

No sustituir por `NO_DATA`.

## NO_DATA

> **No hay datos para este período.**

## INSUFFICIENT_INFORMATION

> **No hay información suficiente para construir esta vista.**

## NOT_COMPARABLE

> **Los datos existen, pero no pueden representarse como una misma tendencia con los criterios disponibles.**

---

# 30. Accesibilidad de visualizaciones

Aunque el cierre global pertenece a B10-10, v0.8 fija mínimos:

- todo gráfico tiene título y período;
- valores clave tienen equivalente textual/tabular;
- color no es único canal;
- estados no dependen de rojo/verde;
- tooltips no contienen información esencial exclusiva;
- gaps/no comparabilidad tienen patrón además de color;
- mapa corporal tiene tabla equivalente;
- unidades siempre visibles.

---

# 31. Coordinación en timeline

Una nota autorizada puede aparecer como:

```text
Coordinación
Autor
Dominio
Finalidad
Fecha
Destinatario/visibilidad permitida
Resumen
```

No convertirla en burbuja de chat.

No mostrar referencias que el actor actual no puede consultar.

---

# 32. Navegación profesional consolidada

```text
Cartera
→ Asesorado
   → Resumen
   → Timeline
   → Nutrición
   → Entrenamiento
   → Antropometría
   → Análisis
```

No crear `/dashboard` universal.

`Resumen` es contextual al asesorado.

---

# 33. Candidatas v0.8

| ID | Tema | Estado |
|---|---|---|
| `CAND-10-DSH-01` | tabla operativa / card responsive | PROTOTIPO |
| `CAND-10-DSH-02` | tab Revisiones pendientes | RATIFICABLE |
| `CAND-10-DSH-03` | banner partialView + omisión segura | RATIFICABLE |
| `CAND-10-TIM-01` | ocurrió primario / registrado secundario | RATIFICABLE |
| `CAND-10-CRD-01` | coordinación contextual, no chat | RATIFICABLE |
| `CAND-10-ADV-PROG-01` | progreso propio separado por dominio | RATIFICABLE |
| `CAND-10-PRJ-01` | catálogo de análisis por dominio | RATIFICABLE |
| `CAND-10-PRJ-02` | partialView sin candados de datos ocultos | RATIFICABLE |
| `CAND-10-PRJ-03` | volumen ejercicio barras + tabla | PROTOTIPO |
| `CAND-10-PRJ-04` | volumen zona barras agrupadas | PROTOTIPO |
| `CAND-10-PRJ-05` | efectivo/total barra segmentada | PROTOTIPO |
| `CAND-10-PRJ-06` | threshold contextual | CONDUCTA RATIFICABLE |
| `CAND-10-PRJ-07` | progresión small multiples | PROTOTIPO |
| `CAND-10-PRJ-08` | PR observadas | RATIFICABLE |
| `CAND-10-PRJ-09` | mapa corporal + tabla | PROTOTIPO |
| `CAND-10-PRJ-10` | antropometría por tramos comparables | RATIFICABLE / PROTOTIPO |
| `CAND-10-PRJ-11` | prescripto vs registrado descriptivo | PROTOTIPO |

Total nuevas candidatas v0.8:

```text
17
```

Decisiones UX candidatas:

```text
DEC-10-UX-01
Resumen ≠ análisis profundo

DEC-10-UX-02
Proyecciones profundas viven en Análisis
```

Ambas expresan la misma dirección en dos niveles; Dirección puede consolidarlas en una sola decisión al cierre.

---

# 34. Escenarios adversariales B10-08

## `ADV-10-DSH-01 — Pendiente como gravedad`

Falla si una fila usa score/riesgo para ordenar.

## `ADV-10-DSH-02 — Dominio oculto como card bloqueada`

Falla si partialView revela “hay datos que no podés ver”.

## `ADV-10-DSH-03 — Dashboard como revisión`

Falla si abrir Resumen cuenta como revisión.

## `ADV-10-DSH-04 — Timeline causal`

Falla si eventos cercanos se conectan sin relación de dominio.

## `ADV-10-DSH-05 — Ocurrencia inventada`

Falla si `recordedAt` rellena `occurredAt`.

## `ADV-10-DSH-06 — Coordinación como prescripción`

Falla si nota modifica plan/objetivo ajeno.

## `ADV-10-DSH-07 — Referencia protegida`

Falla si insertar referencia en nota concede lectura.

## `ADV-10-DSH-08 — Draft de coordinación inventado`

Falla si UX depende de borrador persistente sin contrato.

---

# 35. Escenarios adversariales B10-09

## `ADV-10-PRJ-01 — NO_DATA como cero`

Falla si ausencia produce barra en 0.

## `ADV-10-PRJ-02 — partialView agrega dato oculto`

Falla si agregado visible usa fuente no autorizada.

## `ADV-10-PRJ-03 — PRIMARY ponderado`

Falla si rol aplica coeficiente implícito.

## `ADV-10-PRJ-04 — Serie sin RIR clasificada`

Falla si ausencia se considera efectiva/inefectiva.

## `ADV-10-PRJ-05 — Interpolación`

Falla si línea inventa puntos entre sesiones.

## `ADV-10-PRJ-06 — PR estimada`

Falla si 1RM estimado aparece como marca observada.

## `ADV-10-PRJ-07 — Mapa como gravedad`

Falla si intensidad muscular se lee como lesión/riesgo.

## `ADV-10-PRJ-08 — Antropometría no comparable unida`

Falla si tramos incompatibles se dibujan continuos.

## `ADV-10-PRJ-09 — Nutrición score`

Falla si diferencias se convierten en adherencia/calificación.

## `ADV-10-PRJ-10 — Threshold BE`

Falla si el sistema fija universalmente criterio de efectividad.

## `ADV-10-PRJ-11 — Dashboard absorbe PRJ`

Falla si Resumen ejecuta/embebe las ocho vistas profundas obligatoriamente.

---

# 36. Prototipos candidatos

## `PROTO-10-DSH-01 — Cartera`

```text
Cartera
↔ Revisiones pendientes
→ abrir asesorado
```

## `PROTO-10-DSH-02 — Dashboard full/partial`

```text
Resumen completo
vs
Resumen partialView
```

## `PROTO-10-DSH-03 — Timeline + coordinación`

```text
timeline
→ detalle
→ agregar nota de coordinación
```

## `PROTO-10-ADV-01 — Progreso propio`

```text
Nutrición / Entrenamiento / Antropometría
→ estados longitudinales
```

## `PROTO-10-PRJ-01 — Catálogo de Análisis`

```text
8 proyecciones
→ estados disponibles/no-data
→ abrir detalle
```

## `PROTO-10-PRJ-02 — Entrenamiento analítico`

```text
volumen
→ progresión
→ efectivo/total
→ threshold
```

## `PROTO-10-PRJ-03 — Zonas musculares`

```text
volumen por zona
→ distribución
→ mapa + tabla
```

## `PROTO-10-PRJ-04 — Antropometría longitudinal`

```text
métrica
→ comparabilidad
→ gaps
```

## `PROTO-10-PRJ-05 — Nutrición prescripto vs registrado`

```text
prescripto
↔ registrado
→ missing
```

---

# 37. DoD B10-08

No cerrar si:

- cartera usa gravedad/riesgo;
- review queue inventa pendientes;
- dashboard mezcla dominios en score;
- partialView revela recursos ocultos;
- timeline confunde ocurrencia/registro;
- timeline inventa causalidad;
- coordinación prescribe;
- coordinación depende de draft no contractual;
- progreso propio compara terceros;
- falta binding DSH-01…05/CRD-01.

---

# 38. DoD B10-09

No cerrar si:

- falta una de las 8 proyecciones;
- aparece una 9.ª;
- NO_DATA se convierte en cero;
- partialView usa fuentes ocultas;
- rol de zona pondera sin specification;
- efectivo/total clasifica faltantes;
- progresión interpola;
- PR usa estimación;
- mapa corporal usa semántica clínica;
- antropometría une series no comparables;
- nutrición produce score;
- threshold lo fija BE;
- falta binding PRJ-01…03;
- dashboard absorbe analítica profunda como requisito.

---

# 39. Decisiones abiertas reales

Solo quedan abiertas a prototipo/Dirección:

1. `CAND-10-DSH-01` — tabla vs composición responsive.
2. composición exacta de cards de dashboard.
3. composición visual de cada proyección.
4. mapa corporal exacto y su escala.
5. consolidación `DEC-10-UX-01/02`.
6. nivel de mini-resumen de proyección que `API-DSH-03` pueda mostrar sin llamar PRJ.

No son preguntas de dominio ni contrato.

---

# 40. Estado de salida

```text
BE-LEG-10 v0.8
B10-08 + B10-09

ESTADO:
BORRADOR UX P0 TO-BE
NO APROBADO
NO CANÓNICO

B10-08:
CARTERA MODELADA
REVIEW QUEUE MODELADA
DASHBOARD MODELADO
PARTIAL VIEW MODELADA
TIMELINE MODELADO
COORDINACIÓN MODELADA
PROGRESO PROPIO MODELADO

B10-09:
8/8 PROYECCIONES REPRESENTADAS
0 PROYECCIONES EXTRA
PRJ-01…03 CONSUMIDAS
THRESHOLD PROFESIONAL MODELADO
NO_DATA / NOT_COMPARABLE / partialView MODELADOS

CANDIDATAS NUEVAS:
17

DECISIONES UX CANDIDATAS:
2 — CONSOLIDABLES

07:
SIN CAMBIO

B10-02/B10-03:
NO INICIADOS

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE v0.8
→ Dirección
→ B10-02/B10-03
```

---

*Fin BE-LEG-10 v0.8 — B10-08/B10-09.*
