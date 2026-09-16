# BE-LEG-10 v0.4 — B10-05 Nutrición UX P0 TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-10 — Diseño UI/UX y Prototipos`  
> **Bloque:** `B10-05 — Nutrición UX P0`  
> **Versión:** `v0.4`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR UX — NO CANÓNICO`  
> **Dependencias:** BE-LEG-05 · 06 · 08 · BE-LEG-09 v0.15 **NO CANÓNICO / CONGELADO COMO INSUMO** · BE-LEG-10 v0.2/v0.3  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Objetivo del bloque

Diseñar la experiencia P0 de Nutrición para:

```text
PROFESIONAL
evaluar
→ definir objetivo
→ crear plan
→ editar borrador
→ validar
→ activar
→ revisar ejecución
→ registrar revisión profesional
→ aplicar continuidad/cierre

ASESORADO
consultar Hoy
→ registrar comida prescripta
→ registrar comida fuera de prescripción
→ consultar registros
→ conservar evidencia propia
```

La UX debe preservar las separaciones ya definidas:

```text
objetivo profesional
≠ cálculo automático de BE

borrador
≠ plan activo

plan prescripto
≠ ingesta real

sin registro
≠ incumplimiento

comida fuera del plan
≠ comida prescripta realizada

registro libre
≠ estimación profesional

visualizar
≠ revisar profesionalmente
```

---

# 1. Principio rector de Nutrición

> **BE organiza, registra y hace visible el proceso nutricional; no reemplaza la decisión profesional.**

La interfaz no debe sugerir que BE:

- decide calorías;
- elige macros;
- califica al asesorado;
- determina si “comió bien”;
- diagnostica;
- convierte ausencia de datos en incumplimiento;
- transforma una descripción libre en medición precisa.

---

# 2. Arquitectura general del dominio Nutrición

## Profesional

Dentro de:

```text
WORKSPACE-ADVISEE
→ Nutrición
```

se propone:

```text
Nutrición
├─ Resumen
├─ Evaluaciones y objetivos
├─ Plan
├─ Ejecución / Registros
└─ Revisiones
```

No se crean cinco productos separados; son secciones del mismo contexto nutricional.

## Asesorado

En APK:

```text
Nutrición
├─ Hoy
├─ Plan actual
├─ Registros
└─ Detalle de registro
```

---

# 3. `CAND-10-NUT-A — Navegación profesional de Nutrición`

Propuesta:

```text
tabs o subnav local:

Resumen
Plan
Registros
Revisiones
```

Las evaluaciones/objetivos pueden vivir dentro de `Resumen` o `Plan`, según prueba de usabilidad.

No crear una navegación global llamada:

```text
Evaluaciones
Objetivos
Planes
Comidas
Adherencia
```

porque fragmenta el workflow profesional.

**Recomendación:** RATIFICAR como arquitectura conceptual; posición exacta se valida en prototipo.

---

# 4. Pantalla profesional — Resumen nutricional

## `CAND-10-NUT-01`

Objetivo:

> entender el estado nutricional operativo sin abrir todas las fuentes.

Bloques candidatos:

```text
Estado del proceso
Objetivo efectivo
Plan activo
Última evaluación
Última revisión válida
Próxima acción
Disponibilidad de registros
```

No mostrar:

```text
score de adherencia
semáforo clínico
"paciente en riesgo"
```

---

# 5. Estado del proceso

Debe responder:

```text
¿hay proceso?
¿hay objetivo efectivo?
¿hay borrador?
¿hay plan activo?
¿hay revisión pendiente?
```

Ejemplo:

```text
Plan activo
Versión 3
Activado el 22/08/2026

Objetivo vigente
2.600 kcal · P/C/G ...
```

si esos valores fueron declarados profesionalmente.

No:

```text
BE recomienda 2.600 kcal
```

---

# 6. Evaluación nutricional

## `CAND-10-NUT-02`

Flujo:

```text
Nutrición
→ Nueva evaluación
```

Formulario por secciones.

Principios:

- solo campos respaldados por dominio/requisitos;
- progressive disclosure;
- evidencia/referencias visibles;
- `occurredAt` diferenciado de `recordedAt`;
- autoría visible;
- notas profesionales separadas de datos estructurados.

No diseñar una historia clínica genérica.

---

# 7. Guardado de evaluación

Patrón:

```text
completar
→ revisar
→ guardar evaluación
```

No necesita “publicar” si el dominio no define ese estado.

Success:

```text
Evaluación registrada
```

CTA:

```text
Definir objetivo
Volver a Nutrición
```

---

# 8. Objetivo nutricional

## `CAND-10-NUT-03`

El profesional crea una nueva versión.

UI debe explicitar:

```text
Nueva versión de objetivo
```

no:

```text
Editar objetivo actual
```

si la semántica real es inmutable/versionada.

Campos:

```text
evaluación de referencia
vigencia
requerimiento energético estimado
macronutrientes
distribución por comidas opcional
fundamento
método/procedencia declarada cuando corresponda
```

---

# 9. Regla visual — BE no calcula el objetivo como autoridad

Si el sistema ofrece ayudas de cálculo futuras:

```text
herramienta
→ valor estimado
→ profesional revisa
→ profesional decide
```

Pero P0 no debe construir un CTA central:

```text
Calcular objetivo con BE
```

como sustituto de la decisión profesional.

---

# 10. Historia de objetivos

Mostrar versiones:

```text
V3 · vigente
V2 · anterior
V1 · anterior
```

con:

- vigencia;
- autor;
- fundamento;
- evaluación de referencia.

No mostrar solamente:

```text
"Último objetivo"
```

sin historia.

---

# 11. Plan nutricional — arquitectura profesional

## `CAND-10-NUT-04`

Pantalla:

```text
Plan
├─ Activo
├─ Borradores
└─ Historial
```

Un borrador no debe parecer activo.

Badge:

```text
Borrador
```

visible siempre.

---

# 12. Crear borrador

Flujo:

```text
Plan
→ Crear nuevo plan
→ elegir objetivo de referencia
→ crear estructura inicial
→ editor
```

Success:

```text
Borrador creado
```

No:

```text
Plan creado correctamente
```

si todavía no está activo.

---

# 13. Editor de plan

## Jerarquía visual

```text
Plan
→ Día tipo
→ Comida
→ Opción
→ Ítem
```

Debe verse esa jerarquía.

No usar una tabla plana gigante.

---

# 14. Día tipo

Representación:

```text
Día de entrenamiento
Día de descanso
Día de trabajo
...
```

según nombre profesional.

Regla:

> Día tipo no es una fecha del calendario.

La UI no muestra:

```text
Lunes 31/08
```

salvo que exista una regla temporal explícita separada.

---

# 15. Comidas dentro del día tipo

Card/section:

```text
Desayuno
Almuerzo
Merienda
Cena
```

son labels del profesional, no enum obligatorio.

Permitir:

- ordenar;
- agregar;
- quitar;
- renombrar.

Sin hardcodear cuatro comidas.

---

# 16. Modalidad A — opciones de plato

La UX P0 debe soportar:

```text
Comida
├─ Opción 1
├─ Opción 2
└─ Opción N
```

Cada opción:

```text
Ítem
Cantidad
Unidad
Estado de preparación
```

Cuando hay cantidad:

```text
unidad + estado de preparación
```

son obligatorios.

---

# 17. Modalidad B — intercambios

El contrato la contempla pero puede estar capability-gated.

UX:

```text
si no disponible
→ no mostrar opción seleccionable
```

No mostrar:

```text
"Próximamente"
```

en un workflow profesional crítico salvo decisión de producto.

Si se habilita:

```text
grupo de intercambio
→ porciones prescriptas
```

sin duplicar el contenido versionado del grupo.

---

# 18. Catálogo nutricional

## `CAND-10-NUT-05`

Dentro del editor:

```text
Agregar ítem
→ buscar catálogo BE
```

Opciones:

```text
Buscar
Crear manualmente
Importar desde proveedor
```

según capacidad P0.

No hacer que Open Food Facts sea la búsqueda principal obligatoria.

---

# 19. Importación controlada

Flujo:

```text
buscar/importar candidato
↓
vista previa
↓
revisar datos
↓
corregir/completar
↓
Importar a BE
o
Rechazar
```

UI distingue:

```text
Dato del proveedor
Dato corregido por profesional
Dato final en catálogo BE
```

No:

```text
"Importado"
```

antes de resolver el candidato.

---

# 20. Fallo del proveedor

Si Open Food Facts no responde:

```text
No pudimos consultar el proveedor.
Podés seguir usando el catálogo BE o cargar un alimento manualmente.
```

No bloquear el editor.

---

# 21. Guardado del borrador

El editor debe permitir:

```text
Guardar cambios
```

sin activar.

Estado:

```text
Guardado
Cambios sin guardar
Guardando
Error al guardar
```

No autoactivar.

---

# 22. Validación

## `CAND-10-NUT-06`

CTA:

```text
Validar plan
```

Resultado:

```text
Plan válido
```

o:

```text
Hay elementos por corregir
```

con issues vinculados a la ubicación exacta.

Ejemplo:

```text
Día de entrenamiento
→ Almuerzo
→ Opción 2
→ falta estado de preparación
```

---

# 23. Qué NO debe decir validación

No:

```text
"Este plan es nutricionalmente correcto"
"El plan cumple"
"Plan saludable"
```

Validación significa:

> estructura y precondiciones contractuales listas para activar.

---

# 24. Activación

## `CAND-10-NUT-07`

Acción crítica:

```text
Activar plan
```

Pre-confirmación:

```text
Estás por activar esta versión.
El asesorado pasará a consultar esta planificación como vigente.
La versión anterior se conservará en el historial.
```

Si aplica nuevo proceso/capacidad, no exponer internals.

---

# 25. Falla de activación

Escenarios:

```text
plan cambió
capacidad no disponible
autorización cambió
otro plan quedó activo
```

UX:

```text
No pudimos activar esta versión.
Revisá el estado actual antes de volver a intentarlo.
```

Cuando sea seguro, mostrar issue específico.

No decir:

```text
constraint violation
version conflict 0x...
```

---

# 26. Plan activo

Una vez activo:

```text
Activo
Versión
Fecha de activación
Objetivo relacionado
```

La estructura visible al asesorado debe corresponder al snapshot emitido.

No al catálogo actual.

---

# 27. Asesorado — Hoy nutricional

## `CAND-10-NUT-08`

Objetivo:

> mostrar qué información nutricional corresponde hoy y permitir registrar lo que realmente ocurrió.

Secciones:

```text
Tu plan de hoy
Comidas del plan
Agregar comida fuera del plan
Registros de hoy
```

---

# 28. Día tipo en Hoy

Si existe una regla canónica que determina el Día tipo:

```text
mostrar el aplicable
```

Si el usuario debe elegir entre días tipo:

```text
selector explícito
```

No seleccionar silenciosamente el primero.

No convertir día tipo en fecha.

---

# 29. Card de comida prescripta

Ejemplo conceptual:

```text
Almuerzo

Opción 1
[contenido]

Opción 2
[contenido]

Registrar comida
```

Puede mostrar material didáctico disponible.

No mostrar score de “calidad”.

---

# 30. Registrar comida prescripta

## `CAND-10-NUT-09`

Flujo:

```text
Comida del plan
→ Registrar
→ seleccionar opción realizada
→ registrar información real permitida
→ guardar
```

Debe distinguir:

```text
prescripto
vs
registrado
```

---

# 31. Estado de registro

Después:

```text
Registrado
```

No:

```text
Cumplido
```

salvo que una futura regla profesional explícita use ese término.

---

# 32. Comida fuera del plan — decisión de Dirección

## `CAND-10-NUT-10`

CTA separado:

```text
Agregar comida fuera del plan
```

No vive dentro de una comida prescripta.

Formulario:

```text
¿Qué comiste?
[texto libre]

Porción aproximada
[opcional / si el contrato final lo permite]

Foto
[opcional si media está habilitada]
```

### Regla

```text
context = OUTSIDE_PRESCRIPTION
recording.mode = FREE_DESCRIPTION
```

---

# 33. Copy para comida libre

Preferir:

```text
"Contanos qué comiste."
```

y aclaración:

```text
"Podés describirlo con tus palabras. No hace falta que sea una medición exacta."
```

No:

```text
"Describí tu incumplimiento"
"Comida trampa"
"Desvío"
```

---

# 34. Múltiples comidas libres

La pantalla debe permitir:

```text
+ Agregar otra comida fuera del plan
```

aunque ya haya una registrada ese día.

No limitar a:

```text
1 registro libre/día
```

---

# 35. Evidencia visual opcional

Si fotos están activadas:

```text
Agregar foto
(opcional)
```

La UI no:

- infiere automáticamente cantidades;
- muestra “IA detectó 350 kcal”;
- exige foto para guardar;
- expone EXIF.

---

# 36. Success de comida libre

```text
Comida registrada
```

Aclaración opcional:

```text
"Este registro queda separado de las comidas prescriptas en tu plan."
```

No:

```text
"Plan incumplido"
```

---

# 37. Registros del asesorado

## `CAND-10-NUT-11`

Vista:

```text
Hoy
Ayer
fecha...
```

Items diferenciados:

```text
DEL PLAN
FUERA DEL PLAN
```

No por color solamente.

---

# 38. Detalle del registro

Mostrar:

```text
Tipo
Fecha/hora
Contenido registrado
Plan/ocurrencia de referencia si aplica
Foto si existe
Correcciones/estructuración visible cuando corresponda
```

Para comida libre:

```text
Tu descripción original
```

siempre preservada.

---

# 39. Estructuración profesional posterior

## `CAND-10-NUT-12`

En el workspace profesional:

```text
Registro libre
→ Estructurar como estimación
```

Formulario:

```text
Descripción original [read-only]
Estimación estructurada
Declaración de estimación
```

Guardar:

```text
Agregar estimación
```

No:

```text
Corregir lo que comió
```

---

# 40. Presentación de la estimación

Debe decir:

```text
Estimación profesional
```

y conservar:

```text
Registro original
```

La UI no sustituye uno por otro.

---

# 41. Registros profesionales

## `CAND-10-NUT-13`

Dentro de:

```text
Nutrición
→ Registros
```

Filtros:

```text
período
tipo
con/sin plan
```

No:

```text
cumplidores/no cumplidores
```

---

# 42. Contraste prescripto vs registrado

Mostrar descriptivamente:

```text
Prescripto
Registrado
Diferencia observada
Datos faltantes
```

No producir:

```text
82 % adherencia
"bien"
"mal"
```

---

# 43. `NO_DATA`

Si no hay registro:

```text
Sin registro
```

No:

```text
0 %
No cumplido
```

Visualmente, los vacíos deben ser explícitos.

---

# 44. Contexto de revisión profesional

## `CAND-10-NUT-14`

Acceso:

```text
Nutrición
→ Revisiones
→ Nueva revisión
```

o desde:

```text
Revisiones pendientes
```

La pantalla reúne:

```text
período
objetivo
plan/es activos
registros
contraste descriptivo
datos faltantes
revisiones previas
```

---

# 45. La pantalla de revisión NO decide

No mostrar:

```text
"Recomendación BE: ajustar"
```

Puede facilitar:

```text
evidencia
comparación
historia
```

La decisión es del profesional.

---

# 46. Registrar revisión válida

## `CAND-10-NUT-15`

Formulario:

```text
Período
Evidencia utilizada
Interpretación profesional
Resultado
Fundamento
Próxima acción
```

Resultados:

```text
Mantener
Ajustar
Sustituir
Reprogramar revisión
Cambiar objetivo
Finalizar
```

Copy humano, mapeado a la taxonomía técnica.

---

# 47. Revisión ≠ visualizar

Abrir:

```text
dashboard
registros
plan
```

no marca:

```text
Revisión realizada
```

Debe existir CTA explícito:

```text
Registrar revisión
```

---

# 48. Aplicar continuidad

## `CAND-10-NUT-16`

Después de registrar una revisión:

```text
Revisión registrada
↓
Aplicar próxima acción
```

Separar ambos pasos.

Ejemplo:

```text
Resultado: Ajustar

Próxima acción:
Crear nueva versión del plan
```

CTA:

```text
Aplicar continuidad
```

---

# 49. Por qué separar revisión y aplicación

Permite distinguir:

```text
decisión profesional registrada
≠
cambio operativo aplicado
```

Evita éxito parcial.

---

# 50. Finalizar proceso nutricional

Si resultado:

```text
Finalizar
```

La aplicación debe explicar consecuencia operacional definida por 06.

No:

```text
Eliminar plan
```

Historia se conserva.

---

# 51. Plan anterior y versión sucesora

Una nueva planificación:

```text
NO edita snapshot activo histórico
```

La UI:

```text
Crear nueva versión
```

o:

```text
Crear plan sucesor
```

según semántica final.

---

# 52. Read-only de versiones activadas

Una versión histórica activada debe presentarse:

```text
Solo lectura
```

No permitir editarla desde un botón ambiguo.

Acción:

```text
Crear nueva versión a partir de esta
```

si se habilita.

---

# 53. Estados de interfaz — profesional

## Evaluación

```text
EMPTY
FORM
SAVING
SAVED
ERROR
```

## Objetivo

```text
NO_EFFECTIVE_OBJECTIVE
EFFECTIVE
HISTORY
```

## Plan

```text
NO_PLAN
DRAFT
VALIDATION_ISSUES
READY_TO_ACTIVATE
ACTIVE
HISTORICAL
```

## Revisión

```text
NO_REVIEW_DUE
PENDING
DRAFT_FORM
REGISTERED
APPLIED
```

---

# 54. Estados de interfaz — asesorado

## Hoy

```text
LOADING
PLAN_AVAILABLE
NO_ACTIVE_PLAN
PARTIAL_VIEW
ERROR
OFFLINE
```

## Registro

```text
NOT_RECORDED
SUBMITTING
REGISTERED
UNCONFIRMED
RETRYABLE_ERROR
```

---

# 55. Offline / pérdida de red

La APK no promete offline completo.

Pero si el usuario presiona guardar:

```text
enviando
```

y se pierde confirmación:

```text
"No pudimos confirmar si se guardó."
→ Reintentar / actualizar
```

No volver a habilitar un submit nuevo que genere duplicado lógico.

---

# 56. Accesibilidad — editor profesional

El editor debe soportar:

- teclado;
- foco visible;
- reordenamiento accesible;
- alternativa a drag-and-drop;
- errores asociados al ítem exacto;
- estructura semántica de headings;
- no depender de color para `DRAFT/ACTIVE`.

---

# 57. Accesibilidad — APK nutricional

- touch targets suficientes;
- labels completos;
- fotos con descripción funcional;
- selección de opción compatible con lector de pantalla;
- estados de guardado anunciados;
- no usar swipe como única forma de acción;
- copy legible en pantallas pequeñas.

---

# 58. Responsive profesional

## Desktop

Editor puede usar:

```text
sidebar/context panel
+
canvas principal
+
panel de catálogo
```

## Tablet

```text
paneles colapsables
```

## Mobile web

No forzar edición compleja equivalente.

Puede ofrecer:

```text
consulta
cambios simples
```

y dejar edición estructural compleja para viewport adecuado, con mensaje claro.

---

# 59. Visualización de macros/energía

Si se muestran:

```text
kcal
proteínas
carbohidratos
grasas
```

se presentan como:

```text
objetivo declarado por profesional
```

No como recomendación automática.

Puede usarse:

- cards;
- barras;
- distribución gráfica.

Sin valoración:

```text
ideal
malo
exceso peligroso
```

---

# 60. Copy — términos recomendados

| Evitar | Preferir |
|---|---|
| Dieta | Plan nutricional, salvo contexto profesional donde “dieta” sea explícito |
| Cumplimiento | Registro / contraste |
| Cheat meal | Comida fuera del plan |
| Fallaste | Sin registro / registrado fuera del plan |
| Corregir comida | Agregar estimación profesional |
| Plan perfecto | Plan válido estructuralmente |
| BE recomienda | Objetivo definido por tu profesional |
| Adherencia 0% | Sin registro |

---

# 61. Flujo profesional P0 completo

```text
Workspace
→ Nutrición
→ Nueva evaluación
→ Guardar

→ Nuevo objetivo
→ Guardar versión

→ Crear borrador de plan
→ Editar
→ Validar
→ Corregir issues
→ Validar
→ Activar

[ejecución del asesorado]

→ Revisiones
→ Contexto
→ Registrar revisión
→ Aplicar continuidad
```

---

# 62. Flujo asesorado — comida prescripta

```text
Hoy
→ Almuerzo
→ Registrar
→ elegir opción
→ completar registro
→ Guardar
→ Registrado
```

---

# 63. Flujo asesorado — comida fuera del plan

```text
Hoy
→ Agregar comida fuera del plan
→ describir
→ opcional foto
→ Guardar
→ Registrado como fuera del plan
```

Puede repetirse múltiples veces.

---

# 64. Flujo profesional — estructuración de comida libre

```text
Registros
→ abrir comida fuera del plan
→ ver descripción original
→ Estructurar como estimación
→ completar
→ guardar
```

Resultado:

```text
original
+
estimación profesional
```

---

# 65. Flujo de revisión

```text
Revisión pendiente
→ contexto
→ evidencia
→ interpretación
→ resultado
→ fundamento
→ próxima acción
→ Registrar revisión
→ Aplicar continuidad
```

---

# 66. Escenarios adversariales

## `S10-NUT-01`

Plan se valida.

Otro dato cambia antes de activar.

Resultado:

```text
activate revalida
→ UI muestra estado actual
```

No “activado” falso.

## `S10-NUT-02`

Asesorado registra una comida libre dos veces.

Si son dos comidas reales:

```text
dos registros
```

Si es retry del mismo submit:

```text
uno
```

## `S10-NUT-03`

Comida fuera del plan coincide casualmente con lo prescripto.

No auto-marcar prescripta como realizada.

## `S10-NUT-04`

Profesional estructura una comida libre.

Original permanece.

## `S10-NUT-05`

No hay registros durante tres días.

No dibujar:

```text
0 % adherencia
```

## `S10-NUT-06`

Proveedor externo cae durante edición.

Catálogo BE/manual continúa.

## `S10-NUT-07`

Plan activo usa alimento cuyo catálogo cambió después.

Mostrar snapshot/version emitida, no reescribir.

## `S10-NUT-08`

Revocación de B2 mientras el profesional revisa.

Siguiente lectura/acción:

```text
deny
→ limpiar contenido
```

---

# 67. Binding UX ↔ API provisional

La UI no se acopla a paths como autoridad, pero debe conocer el propósito contractual.

| UX | Familia 09 |
|---|---|
| Nueva evaluación | `API-NUT-01` |
| Historia evaluación | `API-NUT-02/03` |
| Nuevo objetivo | `API-NUT-04` |
| Historia/efectivo objetivo | `API-NUT-05/06` |
| Crear/leer plan | `API-NUT-07/08/09` |
| Editar borrador | `API-NUT-10` |
| Validar | `API-NUT-11` |
| Activar | `API-NUT-12` |
| Catálogo | `API-NUT-13` + `API-INT-NUT-*` |
| Hoy | `API-NUT-14` |
| Registrar ingesta | `API-NUT-15` |
| Detalle | `API-NUT-16` |
| Review context | `API-NUT-17` |
| Registrar revisión | `API-NUT-18` |
| Ver revisión | `API-NUT-19` |
| Aplicar continuidad | `API-NUT-20` |
| Estructurar comida libre | `API-NUT-21` |

Si la revisión externa del 09 cambia un path sin cambiar conducta:

```text
actualizar binding
→ no reabrir UX
```

---

# 68. Decisiones candidatas B10-05

| ID | Propuesta | Recomendación |
|---|---|---|
| `CAND-10-NUT-A` | navegación local Resumen/Plan/Registros/Revisiones | RATIFICAR CON PROTOTIPO |
| `CAND-10-NUT-B` | editor jerárquico Día tipo→Comida→Opción→Ítem | RATIFICAR |
| `CAND-10-NUT-C` | validación separada de activación | RATIFICAR |
| `CAND-10-NUT-D` | versiones activadas solo lectura; cambios por nueva versión | RATIFICAR |
| `CAND-10-NUT-E` | Hoy separa comida prescripta de comida fuera del plan | **RESUELTA POR DIRECCIÓN / RATIFICADA** |
| `CAND-10-NUT-F` | múltiples comidas libres/día | **RESUELTA POR DIRECCIÓN / RATIFICADA** |
| `CAND-10-NUT-G` | estimación profesional se muestra junto al original, no lo reemplaza | RATIFICAR |
| `CAND-10-NUT-H` | revisión y aplicación de continuidad son pasos distintos | RATIFICAR |
| `CAND-10-NUT-I` | sin registro se representa como `Sin registro`, nunca como incumplimiento | RATIFICAR |
| `CAND-10-NUT-J` | importación externa se revisa antes de ingresar al catálogo BE | RATIFICAR |

---

# 69. Hallazgos

## `H10-NUT-01 — “Adherencia” es un término UX riesgoso`

Aunque el dominio pueda usarlo históricamente, en interfaz P0 puede inducir un score no aprobado.

Recomendación:

```text
usar Registros / Contraste / Ejecución
```

salvo que exista métrica explícitamente canónica.

## `H10-NUT-02 — Modalidad C necesita entrada propia`

No ubicar:

```text
Agregar comida fuera del plan
```

dentro de una comida prescripta.

Eso produciría una falsa relación con esa ocurrencia.

## `H10-NUT-03 — Validar no debe parecer “aprobar nutricionalmente”`

Copy y estilo deben distinguir:

```text
completo/estructuralmente válido
```

de:

```text
profesionalmente adecuado
```

## `H10-NUT-04 — La estimación profesional necesita doble lectura`

Asesorado y profesional deben poder distinguir:

```text
lo que el asesorado dijo
vs
lo que el profesional estimó
```

sin reemplazo silencioso.

---

# 70. Prototipos requeridos B10-05

## `PROTO-10-NUT-01 — Profesional / plan`

```text
Resumen
→ crear plan
→ editor
→ validate issues
→ activate
```

## `PROTO-10-NUT-02 — Asesorado / Hoy`

```text
Hoy
→ comida del plan
→ registrar
```

## `PROTO-10-NUT-03 — Modalidad C`

```text
Hoy
→ comida fuera del plan
→ descripción libre
→ registrar
```

## `PROTO-10-NUT-04 — Revisión`

```text
contexto
→ decisión
→ registrar revisión
→ aplicar continuidad
```

## `PROTO-10-NUT-05 — Catálogo/importación`

```text
buscar
→ proveedor
→ candidato
→ revisar
→ importar
```

---

# 71. Criterios futuros 11A

1. draft nunca aparece al asesorado como activo;
2. validate no activa;
3. activate revalida;
4. snapshot histórico no cambia por catálogo;
5. día tipo no se convierte en fecha;
6. cantidad exige unidad/estado;
7. proveedor caído no bloquea manual;
8. comida libre no completa comida prescripta;
9. varias comidas libres/día son posibles;
10. retry no duplica el mismo evento;
11. registro libre original no se sobrescribe;
12. estimación se etiqueta;
13. no-data no se vuelve 0;
14. no score de adherencia;
15. visualizar no crea revisión;
16. aplicar continuidad requiere revisión válida;
17. revocación corta acceso durante review;
18. accesibilidad del editor y APK.

---

# 72. Estado de salida

```text
BE-LEG-10:
v0.4

B10-01:
DESARROLLADO EN BORRADOR

B10-04:
DESARROLLADO EN BORRADOR

B10-05:
NUTRICIÓN UX P0
DESARROLLADO EN BORRADOR

PROFESIONAL:
EVALUACIÓN
OBJETIVO
PLAN
VALIDATE
ACTIVATE
REGISTROS
REVISIÓN
CONTINUIDAD

ASESORADO:
HOY
COMIDA PRESCRIPTA
COMIDA FUERA DEL PLAN
REGISTROS

MODALIDAD C:
INCORPORADA
FUERA DE PRESCRIPCIÓN
MÚLTIPLES EVENTOS/DÍA

SIN REGISTRO:
≠ INCUMPLIMIENTO

REVISIÓN:
≠ VISUALIZACIÓN

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
B10-06 — ENTRENAMIENTO UX P0
```

---

*Fin de BE-LEG-10 v0.4 — B10-05 Nutrición UX P0 TO-BE.*
