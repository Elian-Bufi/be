# BE-LEG-10 v0.6 — B10-06 Entrenamiento UX P0 TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-10 — Diseño UI/UX y Prototipos`  
> **Bloque:** `B10-06 — Entrenamiento UX P0`  
> **Versión:** `v0.6`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR UX — NO CANÓNICO`  
> **Dependencias:** BE-LEG-05 · 06 · 08 · BE-LEG-09 v0.15 **NO CANÓNICO / CONGELADO COMO INSUMO** · BE-LEG-10 v0.2/v0.3/v0.5  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Objetivo del bloque

Diseñar la experiencia P0 de Entrenamiento para:

```text
PROFESIONAL
datos/evaluación
→ métodos/cálculos de soporte cuando correspondan
→ objetivo
→ borrador de plan
→ bloques/microciclos/sesiones
→ prescripciones
→ validar
→ activar
→ revisar ejecuciones
→ registrar revisión
→ aplicar continuidad/progresión/cierre

ASESORADO
consultar Hoy
→ iniciar sesión
→ registrar ejecución incremental
→ sustituciones/desvíos
→ confirmar
→ consultar registro
→ corregir cuando esté permitido
```

La UX preserva:

```text
planificado ≠ ejecutado
borrador de ejecución ≠ registro definitivo
sin registro ≠ no realizado
sustitución ≠ modificación del plan
RIR/%RM = criterios de prescripción
esfuerzo percibido = dato de ejecución
cálculo/sugerencia ≠ decisión profesional
```

---

# 1. Arquitectura profesional

Dentro de:

```text
WORKSPACE-ADVISEE
→ Entrenamiento
```

propuesta:

```text
Resumen
Plan
Ejecuciones
Revisiones
```

Las evaluaciones, objetivo y métodos pueden integrarse en `Resumen`/`Plan` según el flujo.

No crear una navegación fragmentada de:

```text
Evaluaciones
Objetivos
Bloques
Microciclos
Sesiones
Series
RMs
```

como módulos globales desconectados.

---

# 2. Resumen de Entrenamiento

## `CAND-10-TRN-01`

Bloques:

```text
Estado del proceso
Objetivo efectivo
Plan activo
Última evaluación
Métodos/cálculos relevantes
Última ejecución
Última revisión
Próxima acción
```

No mostrar:

- score general;
- fatiga clínica inferida;
- “riesgo” automático;
- progresión recomendada como decisión BE.

---

# 3. Datos previos / evaluación

El profesional puede llegar con:

```text
datos del perfil
formularios solicitados
antecedentes reportados
lesiones/limitaciones reportadas
evaluaciones previas
antropometría autorizada
```

Cada dato debe conservar origen.

Ejemplo:

```text
Altura
175 cm
Fuente: reportado por asesorado

Dolor/limitación de hombro
Fuente: formulario previo
```

No presentar self-reported como diagnóstico.

---

# 4. Solicitar datos faltantes

## `CAND-10-TRN-A`

Desde la evaluación:

```text
Falta información
→ Solicitar datos
```

Puede usar una plantilla:

```text
Antecedentes para entrenamiento
```

campos permitidos, por ejemplo:

- lesiones/limitaciones;
- experiencia;
- disponibilidad;
- frecuencia;
- equipamiento;
- hábitos relevantes;
- enfermedades/condiciones reportadas pertinentes;
- otros datos canónicos futuros.

**Recomendación:** RATIFICAR.

---

# 5. Métodos/cálculos de apoyo

## `CAND-10-TRN-B`

Entrenamiento consume el patrón de v0.5.

Ejemplos futuros posibles:

```text
estimación de 1RM
intensidad relativa
volumen
progresión
```

sin congelar en 10 las fórmulas concretas.

Pantalla:

```text
Métodos disponibles
├─ método A
├─ método B
└─ método C
```

Cada uno:

- datos requeridos;
- datos faltantes;
- resultado si se ejecutó;
- versión;
- procedencia;
- limitación.

---

# 6. Ejemplo — estimación de rendimiento

Flujo conceptual:

```text
dato de ejecución previa
↓
método de estimación
↓
resultado calculado
↓
Usar como referencia
↓
profesional decide prescripción
```

No:

```text
resultado calculado
→ modificar plan automáticamente
```

---

# 7. Objetivo de entrenamiento

## `CAND-10-TRN-02`

Nueva versión de objetivo.

Campos definidos por dominio posterior.

UX:

```text
Objetivo vigente
Historial
Nueva versión
```

No `Editar objetivo actual` si se preserva inmutabilidad.

---

# 8. Plan — arquitectura jerárquica

## `CAND-10-TRN-03`

```text
Plan
→ Bloque
→ Microciclo opcional
→ Sesión
→ Prescripción de ejercicio
```

El editor debe permitir un plan sin microciclos.

No forzar:

```text
Plan → Bloque → Microciclo vacío → Sesión
```

---

# 9. Pantalla Plan

```text
Plan
├─ Activo
├─ Borradores
└─ Historial
```

Badge:

```text
Borrador
Activo
Anterior
```

claro y no solo por color.

---

# 10. Crear borrador

Flujo:

```text
Crear plan
→ objetivo de referencia
→ estructura inicial
→ editor
```

No activar al crear.

---

# 11. Bloques

Card:

```text
Bloque 1
Nombre
Propósito profesional
Orden
```

El propósito es texto libre.

No hardcodear:

```text
Acumulación
Intensificación
Descarga
```

como únicos tipos.

---

# 12. Microciclo opcional

Si el profesional lo usa:

```text
Agregar microciclo
```

Si no:

```text
sesiones directamente dentro del bloque
```

La UI debe manejar ambas jerarquías de forma natural.

---

# 13. Sesión planificada

Cada sesión:

```text
Nombre
Orden
Indicaciones
Ejercicios
```

No confundir con una fecha concreta si el modelo no la fija.

---

# 14. Prescripción de ejercicio

## `CAND-10-TRN-04`

Card/row:

```text
Ejercicio
Series
Repeticiones
Intensidad
Descanso / parámetros
Notas
```

según schema final.

---

# 15. Intensidad — criterio explícito

La UI debe obligar a elegir:

```text
% RM
o
RIR
```

cuando aplique.

No mostrar ambos como si fueran obligatorios simultáneamente.

---

# 16. `% RM`

Ejemplo:

```text
Criterio:
% RM

Objetivo:
75 %
```

Si el profesional usa un cálculo de RM estimado:

```text
Referencia:
1RM estimado por método X
```

Debe poder abrir:

```text
Ver cálculo
```

---

# 17. RIR

Ejemplo:

```text
Criterio:
RIR

Objetivo:
2
```

La interfaz puede explicar:

```text
RIR = repeticiones en reserva
```

sin convertirlo en tutorial invasivo.

---

# 18. Carga sugerida

Si existe:

```text
Carga sugerida
```

debe distinguirse del criterio de intensidad.

No:

```text
carga = intensidad
```

---

# 19. Catálogo de ejercicios

## `CAND-10-TRN-05`

Dentro del editor:

```text
Agregar ejercicio
→ buscar catálogo BE
```

Opciones:

```text
Buscar
Crear manualmente
Importar desde wger
```

---

# 20. Ejercicio — información de catálogo

Puede mostrar:

```text
Nombre
Zona principal
Zonas secundarias
Material didáctico
Procedencia
```

No:

```text
Pectoral 63 %
Deltoides 24 %
```

si no existe ponderación canónica.

---

# 21. Visual muscular en catálogo

La representación visual puede resaltar zonas:

```text
PRIMARY
SECONDARY
```

pero:

```text
color/intensidad visual
≠ peso matemático
```

Los assets no son dominio.

---

# 22. Importación wger

Flujo:

```text
buscar candidato
→ preview
→ revisar
→ mapear/corregir zonas
→ importar
```

No aceptar automáticamente las relaciones musculares externas como canónicas.

---

# 23. Validación

## `CAND-10-TRN-06`

CTA:

```text
Validar plan
```

Issues vinculados a:

```text
bloque
→ sesión
→ ejercicio
```

Ejemplos:

```text
falta criterio de intensidad
referencia de ejercicio no válida
estructura incompleta
```

No:

```text
"Programa óptimo"
```

---

# 24. Activación

## `CAND-10-TRN-07`

Antes:

```text
Activar plan
```

Consecuencia:

> esta versión pasará a ser la planificación vigente del asesorado y la anterior se conservará.

No crear proceso/activar silenciosamente desde Save.

---

# 25. Asesorado — Hoy entrenamiento

## `CAND-10-TRN-08`

Pantalla:

```text
Entrenamiento de hoy
├─ sesión
├─ ejercicios
└─ estado
```

Estados:

```text
No iniciada
En curso
Registrada
```

No:

```text
No realizada
```

hasta que el asesorado registre explícitamente esa condición.

---

# 26. Iniciar entrenamiento

CTA:

```text
Comenzar sesión
```

Crea/recupera el borrador lógico.

Si ya existe:

```text
Continuar sesión
```

No crear otro draft.

---

# 27. Ejecución incremental

## `CAND-10-TRN-09`

La app debe permitir registrar mientras entrena.

Ejemplo:

```text
Press banca

Serie 1
Carga: 80 kg
Reps: 8
RIR: 2

+ Registrar serie
```

Guardado incremental.

---

# 28. Estados por serie

```text
Pendiente
Registrada en borrador
```

No es ejecución definitiva hasta confirmar sesión.

---

# 29. Granularidad

Debe soportar:

```text
SET
```

y:

```text
EXERCISE_OR_SESSION
```

sin obligar a todos a registrar serie por serie.

---

# 30. `SET`

Captura:

```text
carga
unidad
repeticiones
RIR opcional
esfuerzo percibido opcional
```

No inventar valores faltantes.

---

# 31. `EXERCISE_OR_SESSION`

Para flujos de menor detalle:

```text
ejercicio realizado
resumen
```

o:

```text
sesión realizada
resumen
```

No sintetizar series falsas.

---

# 32. Sustitución de ejercicio

## `CAND-10-TRN-10`

Dentro del ejercicio prescripto:

```text
Sustituir ejercicio
```

Flujo:

```text
ejercicio prescripto
→ buscar realizado
→ confirmar sustitución
```

La sesión muestra:

```text
Prescripto:
Press banca

Realizado:
Press con mancuernas
```

No modifica el plan original.

---

# 33. Desvío de sesión

Condición:

```text
Realizada
Realizada con desvío
No realizada
```

`No realizada` es una acción explícita.

No se deriva de ausencia.

---

# 34. Registrar “No realizada”

## `CAND-10-TRN-11`

Acción secundaria:

```text
No pude realizarla
```

Motivo:

```text
opcional
```

No se fuerza explicación.

---

# 35. Confirmar sesión

## `CAND-10-TRN-12`

Antes:

```text
Revisar sesión
```

Resumen:

```text
ejercicios realizados
sustituciones
series
desvíos
condición final
```

CTA:

```text
Confirmar sesión
```

---

# 36. Efecto de confirmar

Después:

```text
Sesión registrada
```

El borrador deja de ser editable como borrador.

No:

```text
Guardar entrenamiento
```

si la semántica real es confirmación definitiva.

---

# 37. Corrección posterior

## `CAND-10-TRN-13`

Si está permitida:

```text
Ejecución registrada
→ Corregir registro
```

Requiere:

```text
motivo
cambio
```

No sobrescribe original.

---

# 38. Presentación de correcciones

Detalle:

```text
Registro original
Corrección vigente
Historial de correcciones
```

No simplemente reemplazar el valor visual.

---

# 39. Progreso del asesorado

La sección Progreso puede mostrar:

```text
carga
repeticiones
RIR
marcas
```

cuando la proyección esté disponible.

No:

```text
score de entrenamiento
```

---

# 40. Métodos y progreso

Si una marca/estimación deriva de un método:

```text
Estimación
Método X
```

Debe diferenciarse de:

```text
Carga realmente ejecutada
```

---

# 41. Profesional — Ejecuciones

## `CAND-10-TRN-14`

Vista:

```text
Ejecuciones
├─ período
├─ sesión
├─ condición
└─ detalle
```

Filtros:

- período;
- plan;
- ejercicio;
- registrada/no registrada cuando sea legítimo.

No:

- disciplinado/no disciplinado;
- mal rendimiento.

---

# 42. Contexto de revisión

## `CAND-10-TRN-15`

Reúne:

```text
objetivo
plan
ejecuciones
correcciones
datos faltantes
proyecciones disponibles
revisiones previas
```

---

# 43. Proyecciones útiles a revisión

Puede enlazar:

```text
volumen por ejercicio
volumen por zona
volumen efectivo vs total
progresión
PR
distribución muscular
```

Sin decidir automáticamente.

---

# 44. Umbral de volumen efectivo

Si se usa:

```text
Configuración profesional
```

Debe ser visible:

```text
Umbral utilizado: ...
```

No aplicar una constante oculta.

---

# 45. Registrar revisión

## `CAND-10-TRN-16`

Formulario:

```text
Período
Evidencia
Interpretación
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

---

# 46. Progresión

La UI no crea un séptimo resultado:

```text
Progresar
```

Puede mostrar una acción profesional como:

```text
Ajustar plan
```

con detalle:

```text
progresión de carga
nuevo bloque
...
```

según efecto.

---

# 47. Aplicar continuidad

## `CAND-10-TRN-17`

Después de registrar:

```text
Aplicar próxima acción
```

Si requiere plan sucesor:

```text
crear nueva versión/borrador
```

No editar snapshot activo histórico.

---

# 48. Integración con formularios

Escenario:

```text
profesional necesita antecedentes/limitaciones
↓
Solicitar información
↓
asesorado completa
↓
respuesta self-reported
↓
aparece como contexto en evaluación
```

No se convierte en diagnóstico ni autorización.

---

# 49. Integración con métodos

Escenario:

```text
profesional quiere estimación que requiere dato X
↓
panel de suficiencia
↓
falta X
↓
Solicitar dato
↓
respuesta
↓
método habilitado
↓
calcular
↓
usar como referencia
```

---

# 50. Seguridad

Si vínculo/B2 se corta durante sesión profesional:

```text
siguiente operación deny
→ UI limpia contenido
```

En APK del asesorado, la historia propia permanece según política.

---

# 51. Estados de interfaz profesional

```text
NO_EVALUATION
EVALUATION_AVAILABLE

NO_OBJECTIVE
OBJECTIVE_EFFECTIVE

NO_PLAN
DRAFT
VALIDATION_ISSUES
ACTIVE
HISTORICAL

NO_EXECUTIONS
EXECUTIONS_AVAILABLE

REVIEW_PENDING
REVIEW_REGISTERED
REVIEW_APPLIED
```

---

# 52. Estados APK

```text
NO_SESSION
NOT_STARTED
DRAFT_IN_PROGRESS
READY_TO_CONFIRM
REGISTERED
REGISTERED_WITH_DEVIATION
NOT_COMPLETED_RECORDED
OFFLINE/UNCONFIRMED
```

---

# 53. Copy recomendado

| Evitar | Preferir |
|---|---|
| Fallaste la sesión | Sesión no realizada |
| Incumplimiento | Registro / ejecución |
| Recomendación BE | Sugerencia / cálculo de referencia |
| Mejor ejercicio | Ejercicio seleccionado por profesional |
| Intensidad 80 kg | Carga 80 kg; criterio de intensidad separado |
| RPE prescripto | RIR / %RM según criterio; esfuerzo percibido en ejecución |
| Corregir plan ejecutado | Corregir registro de ejecución |

---

# 54. Accesibilidad durante entrenamiento

Especial atención:

- targets grandes;
- una mano;
- inputs numéricos apropiados;
- teclado numérico;
- no perder foco al guardar serie;
- feedback háptico opcional;
- lector de pantalla;
- acción sustitución accesible;
- no depender de swipe;
- evitar modales excesivos entre series.

---

# 55. UX de baja fricción

Registrar una serie debería requerir el mínimo de pasos.

Preferencia:

```text
carga
reps
RIR opcional
→ guardar
```

No abrir una pantalla completa por cada set.

---

# 56. Valores repetidos

Se puede facilitar:

```text
copiar carga anterior
repetir objetivo
```

como ayuda de interacción.

Pero el usuario confirma/edita el valor real.

No autocompletar sin visibilidad.

---

# 57. Temporizadores

Un temporizador de descanso puede ser útil, pero:

```text
NO requisito P0 contractual
```

Puede diseñarse como mejora futura sin afectar la captura núcleo.

---

# 58. Offline

No se promete offline total.

Durante entrenamiento, por riesgo de conectividad:

```text
borrador local seguro
+
estado no confirmado
+
reconciliación
```

puede ser necesario en implementación.

El 10 solo exige:

```text
nunca falso éxito
```

---

# 59. Visualización muscular

Puede aparecer en:

```text
detalle de ejercicio
plan
proyecciones
```

pero debe usar las zonas canónicas.

No deducir activación fisiológica exacta por imagen.

---

# 60. Flujo profesional completo

```text
Entrenamiento
→ evaluación
→ datos/métodos si corresponde
→ objetivo
→ crear plan
→ bloques
→ sesiones
→ ejercicios
→ validate
→ activate

[asesorado ejecuta]

→ ejecuciones
→ proyecciones
→ revisión
→ aplicar continuidad
```

---

# 61. Flujo APK completo

```text
Hoy
→ sesión
→ Comenzar
→ ejecución draft
→ registrar sets/resumen
→ sustitución/desvío si existe
→ Revisar
→ Confirmar
→ Sesión registrada
```

---

# 62. Escenarios adversariales

## `S10-TRN-01`

Usuario toca Comenzar dos veces.

Resultado:

```text
mismo draft
```

## `S10-TRN-02`

Sale de la app.

Vuelve:

```text
Continuar sesión
```

## `S10-TRN-03`

No registra nada.

No convertir automáticamente en:

```text
No realizada
```

## `S10-TRN-04`

Sustituye ejercicio.

Plan permanece igual.

## `S10-TRN-05`

Confirma sesión y luego detecta error.

Corrección trazable.

## `S10-TRN-06`

Granularidad agregada.

No crear series sintéticas.

## `S10-TRN-07`

Método de cálculo cambia.

Resultado anterior conserva method/version.

## `S10-TRN-08`

Dato self-reported actualizado.

No sobrescribir evaluación histórica.

## `S10-TRN-09`

Revocación durante revisión.

Contenido se retira en próxima interacción.

---

# 63. Binding UX ↔ API provisional

| UX | Familia 09 |
|---|---|
| Evaluación | `API-TRN-01/02/03` |
| Objetivo | `API-TRN-04/05/06` |
| Plan | `API-TRN-07/08/09/10` |
| Validar | `API-TRN-11` |
| Activar | `API-TRN-12` |
| Catálogo | `API-TRN-13` + `API-INT-TRN-*` |
| Hoy | `API-TRN-14` |
| Crear/recuperar draft | `API-TRN-15` |
| Ver draft | `API-TRN-16` |
| Editar draft | `API-TRN-17` |
| Confirmar | `API-TRN-18` |
| Ejecución registrada | `API-TRN-19` |
| Corrección | `API-TRN-20` |
| Contexto revisión | `API-TRN-21` |
| Revisión | `API-TRN-22/23` |
| Aplicar continuidad | `API-TRN-24` |

Métodos/cálculos y formularios pueden requerir extensión aditiva del 09 antes de canonización.

---

# 64. Decisiones candidatas B10-06

| ID | Propuesta | Recomendación |
|---|---|---|
| `CAND-10-TRN-A` | solicitar datos faltantes desde evaluación | RATIFICAR |
| `CAND-10-TRN-B` | workspace de métodos/cálculos como soporte, no decisión | RATIFICAR |
| `CAND-10-TRN-C` | editor Plan→Bloque→Microciclo opcional→Sesión→Ejercicio | RATIFICAR |
| `CAND-10-TRN-D` | criterio de intensidad explícito `%RM / RIR` | RATIFICAR |
| `CAND-10-TRN-E` | Today usa `Comenzar/Continuar sesión` sobre draft singular | RATIFICAR |
| `CAND-10-TRN-F` | ejecución incremental por set o agregada | RATIFICAR |
| `CAND-10-TRN-G` | sustitución conserva prescripto + realizado | RATIFICAR |
| `CAND-10-TRN-H` | No realizada solo por registro explícito | RATIFICAR |
| `CAND-10-TRN-I` | confirmación separa draft de evidencia definitiva | RATIFICAR |
| `CAND-10-TRN-J` | corrección posterior no sobrescribe original | RATIFICAR |
| `CAND-10-TRN-K` | revisión y aplicación separadas | RATIFICAR |

---

# 65. Hallazgos

## `H10-TRN-01 — Entrenamiento requiere más tolerancia de conectividad que otras verticales`

El usuario registra durante actividad física.

La implementación deberá considerar persistencia temporal/local sin declarar éxito remoto falso.

## `H10-TRN-02 — “No realizada” debe ser un evento`

No se puede derivar de:

```text
fecha pasada + sin registro
```

## `H10-TRN-03 — Método y medición real deben convivir`

Ejemplo:

```text
1RM estimado
≠ carga ejecutada
```

La UI debe diferenciarlos.

## `H10-TRN-04 — El método de programación no debe rigidizar el editor`

Bloques/microciclos son estructura.

La aplicación no debe imponer una escuela de periodización específica.

---

# 66. Prototipos requeridos

## `PROTO-10-TRN-01 — Profesional plan`

```text
plan
→ bloque
→ sesión
→ ejercicio
→ validate
→ activate
```

## `PROTO-10-TRN-02 — APK ejecución`

```text
Hoy
→ comenzar
→ registrar sets
→ confirmar
```

## `PROTO-10-TRN-03 — Sustitución/desvío`

```text
ejercicio
→ sustituir
→ registrar
→ resumen
```

## `PROTO-10-TRN-04 — Revisión`

```text
evidencia/proyecciones
→ decisión
→ aplicar continuidad
```

## `PROTO-10-TRN-05 — Método + dato faltante`

```text
método
→ dato faltante
→ solicitar formulario
→ respuesta
→ cálculo
→ usar como referencia
```

---

# 67. Criterios futuros 11A

1. plan draft no aparece como activo;
2. microciclo opcional;
3. `%RM/RIR` mutuamente correctos según schema;
4. esfuerzo percibido no se usa como prescripción si no corresponde;
5. validate no activa;
6. activate revalida;
7. comenzar dos veces no crea dos drafts;
8. draft persiste/recupera;
9. sin registro ≠ no realizada;
10. sustitución no cambia snapshot;
11. confirmación crea un solo original;
12. correction preserva original;
13. granularidad agregada no crea sets;
14. método conserva versión;
15. cálculo no cambia plan automáticamente;
16. formulario self-reported no crea diagnóstico;
17. revocación corta acceso;
18. accesibilidad durante ejecución.

---

# 68. Estado de salida

```text
BE-LEG-10:
v0.6

ADENDA v0.5:
MÉTODOS / CÁLCULOS / FORMULARIOS
INCORPORADA

B10-06:
ENTRENAMIENTO UX P0
DESARROLLADO EN BORRADOR

PROFESIONAL:
EVALUACIÓN
DATOS
MÉTODOS
OBJETIVO
PLAN
VALIDATE
ACTIVATE
EJECUCIONES
REVISIÓN
CONTINUIDAD

ASESORADO:
HOY
DRAFT DE SESIÓN
SETS / RESUMEN
SUSTITUCIÓN
CONFIRMACIÓN
CORRECCIÓN

PLANIFICADO:
≠ EJECUTADO

SIN REGISTRO:
≠ NO REALIZADA

MÉTODOS:
SOPORTE
NO DECISIÓN

IMPLEMENTACIÓN:
NO AUTORIZADA

SIGUIENTE:
B10-07 — ANTROPOMETRÍA UX P0
```

---

*Fin de BE-LEG-10 v0.6 — B10-06 Entrenamiento UX P0 TO-BE.*
