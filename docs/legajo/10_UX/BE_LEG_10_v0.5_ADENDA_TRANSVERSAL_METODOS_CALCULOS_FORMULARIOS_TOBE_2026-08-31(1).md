# BE-LEG-10 v0.5 — Adenda transversal: Métodos, Cálculos, Sugerencias y Formularios de Datos TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-10 — Diseño UI/UX y Prototipos`  
> **Naturaleza:** `ADENDA TRANSVERSAL`  
> **Versión:** `v0.5`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR UX — NO CANÓNICO`  
> **Origen:** decisión explícita de Dirección durante B10-05/B10-06  
> **Dependencias:** BE-LEG-05 · 06 · 08 · BE-LEG-09 v0.15 **NO CANÓNICO / CONGELADO COMO INSUMO**  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Motivo de la adenda

Dirección aclaró dos capacidades que deben formar parte del diseño TO-BE:

1. el profesional **decide**, pero BE puede ofrecer:
   - métodos preestablecidos;
   - cálculos reproducibles;
   - sugerencias metodológicas;
   - comparación de métodos;
   - registro de qué método se utilizó para obtener un resultado;

2. el profesional puede solicitar al asesorado que complete **formularios de datos pertinentes** antes o durante el proceso, por ejemplo:
   - altura;
   - peso;
   - intolerancias;
   - antecedentes;
   - enfermedades o condiciones que afecten el entrenamiento;
   - lesiones/limitaciones;
   - hábitos;
   - otros datos necesarios según dominio y finalidad.

Esta adenda evita dos extremos incorrectos:

```text
EXTREMO A
BE decide automáticamente por el profesional

EXTREMO B
BE es solo un formulario pasivo sin herramientas de cálculo/soporte
```

TO-BE:

```text
BE aporta estructura + método + cálculo + trazabilidad
↓
profesional interpreta
↓
profesional elige
↓
decisión profesional queda registrada
```

---

# 1. Decisión de Dirección — soporte metodológico

## `DIR-10-MET-A`

**RESUELTA POR DIRECCIÓN.**

BE deberá poder presentar al profesional **métodos de cálculo preestablecidos y versionados** cuando sean pertinentes al dominio.

El profesional podrá:

```text
ver métodos disponibles
→ revisar qué datos requiere cada uno
→ ejecutar cálculo
→ comparar resultados cuando corresponda
→ aceptar uno como referencia
→ descartarlo
→ elegir otro
→ registrar qué método utilizó
```

El resultado del cálculo:

```text
≠ decisión profesional final
```

hasta que el profesional lo adopte en la operación correspondiente.

---

# 2. Ejemplo conceptual — Nutrición

Según datos disponibles, la UX podría mostrar:

```text
Métodos disponibles con tus datos actuales

✓ Método A
  requiere: edad, sexo, peso, altura

✓ Método B
  requiere: masa libre de grasa

○ Método C
  requiere: % grasa corporal validado
```

Si existe una antropometría válida:

```text
% grasa corporal
→ puede habilitar métodos que dependan de composición corporal
```

Si solo existen datos básicos:

```text
peso + altura + edad + sexo
→ quedan disponibles únicamente métodos compatibles
```

La interfaz puede sugerir:

```text
"Este método está disponible porque contás con los datos requeridos."
```

No:

```text
"Este es el mejor método para tu paciente."
```

salvo una regla profesional/canónica futura que lo permita.

---

# 3. Ejemplo conceptual — Antropometría

La evaluación puede ofrecer distintos métodos configurados:

```text
Método 1
Método 2
Método 3
...
```

Cada cálculo conserva:

```text
método
versión
fórmula/especificación
entradas
unidades
precisión
resultado
fecha
actor
procedencia
```

Si el profesional cambia de método:

```text
resultado anterior no desaparece
```

Se conserva la historia de qué se calculó y con qué método.

---

# 4. Ejemplo conceptual — Entrenamiento

La misma arquitectura puede soportar, cuando 06/09 lo habiliten:

```text
estimaciones de rendimiento
estimación de 1RM
métodos de progresión
criterios de intensidad
cálculos de volumen
otros métodos profesionales versionados
```

Sin congelar en 10 qué fórmula científica será canónica.

El 10 define la **experiencia de elección y trazabilidad**, no el catálogo científico definitivo.

---

# 5. Arquitectura transversal — `METHOD WORKSPACE`

Se propone un patrón común:

```text
Datos disponibles
↓
Métodos compatibles
↓
Método seleccionado
↓
Vista de entradas
↓
Calcular
↓
Resultado
↓
Interpretación/limitaciones
↓
Usar como referencia
o
Descartar / comparar
```

Nombre UX final por dominio:

- Nutrición: `Métodos de cálculo`;
- Antropometría: `Métodos`;
- Entrenamiento: `Cálculos / métodos`, según caso.

No se recomienda exponer al usuario profesional una abstracción técnica llamada literalmente `Method Workspace`.

---

# 6. `MethodCard`

Cada método debe poder mostrar:

```text
Nombre
Qué estima/calcula
Datos requeridos
Datos opcionales
Datos disponibles
Datos faltantes
Unidad de salida
Versión
Referencia/procedencia
Limitaciones/resumen
```

Estado:

```text
AVAILABLE
MISSING_DATA
NOT_APPLICABLE
DEPRECATED
```

En UI:

```text
Disponible
Faltan datos
No aplicable
Método anterior
```

---

# 7. Selección de método

## `CAND-10-MET-A`

La selección no debe ser un dropdown ciego.

Preferencia:

```text
lista comparativa de métodos
+
requisitos
+
estado de disponibilidad
```

para que el profesional comprenda por qué puede/no puede usar cada uno.

**Recomendación:** RATIFICAR.

---

# 8. Sugerencias

## `CAND-10-MET-B`

BE puede ordenar o destacar métodos por reglas transparentes como:

```text
compatible con los datos disponibles
requiere menos supuestos
es el método elegido previamente por este profesional
es el método configurado como preferencia profesional
```

Pero debe distinguir:

```text
Sugerido
```

de:

```text
Seleccionado
```

y de:

```text
Aplicado
```

No debe presentarse como decisión clínica automática.

**Recomendación:** RATIFICAR.

---

# 9. Comparación de métodos

Cuando sea legítimo comparar:

```text
Método A    resultado X
Método B    resultado Y
Método C    no disponible
```

Cada resultado conserva su propio:

- método;
- entradas;
- versión;
- precisión;
- procedencia.

No promediar automáticamente resultados de métodos diferentes.

No inventar:

```text
"resultado BE definitivo"
```

---

# 10. `CalculationRun`

Se necesita representar conceptualmente una ejecución de cálculo:

```text
CalculationRun
├─ methodVersion
├─ inputSnapshot
├─ result
├─ unit
├─ precision
├─ occurred/calculatedAt
├─ actor
└─ provenance
```

La UX debe poder reconstruir:

> “Este valor salió de este método, usando estos datos.”

---

# 11. Adoptar un resultado

## `CAND-10-MET-C`

CTA recomendado:

```text
Usar como referencia
```

No:

```text
Aceptar recomendación
```

si el resultado todavía no constituye decisión profesional.

Después:

```text
resultado metodológico
→ se vincula al objetivo/evaluación/prescripción
```

con autoría profesional.

---

# 12. Resultado calculado vs decisión profesional

Representación:

```text
Cálculo
Método: ...
Resultado: ...

↓ profesional

Decisión utilizada en el plan
Valor: ...
Fundamento: ...
```

Pueden coincidir numéricamente.

Pero son conceptos distintos.

---

# 13. Override profesional

El profesional puede decidir:

```text
resultado método = 2500
objetivo profesional = 2400
```

si su práctica y el dominio lo permiten.

La UI debe permitir:

```text
Usar resultado
o
Ingresar valor profesional
```

y registrar el fundamento cuando corresponda.

No presentar la diferencia como error.

---

# 14. Preferencias metodológicas del profesional

Pueden existir configuraciones como:

```text
Método preferido para X
```

pero:

```text
preferido ≠ obligatorio
```

Una preferencia puede:

- preseleccionar visualmente;
- ordenar opciones;
- ahorrar tiempo.

Nunca:

- saltar revisión profesional;
- ocultar otros métodos válidos;
- reemplazar los requisitos de datos.

---

# 15. Dependencia entre dominios

BE puede reutilizar un dato válido de otro dominio **siempre que**:

- pertenezca al mismo asesorado;
- esté autorizado;
- sea pertinente;
- su procedencia sea válida;
- la semántica sea compatible.

Ejemplo conceptual:

```text
Antropometría
→ % grasa corporal derivado

Nutrición
→ método de cálculo que requiere composición corporal
```

El profesional debe poder ver:

```text
Fuente:
Antropometría del 20/08/2026
Método: ...
```

No copiar el número como si fuera entrada manual nueva.

---

# 16. Datos faltantes

Si un método requiere:

```text
altura
peso
edad
% grasa
```

y falta `% grasa`:

```text
Método no disponible
Falta:
% grasa corporal
```

CTA posibles:

```text
Usar otro método
Solicitar datos
Registrar/evaluar dato
```

según actor y dominio.

Esto conecta directamente con los formularios solicitados por Dirección.

---

# 17. Decisión de Dirección — formularios solicitados por el profesional

## `DIR-10-DAT-A`

**RESUELTA POR DIRECCIÓN.**

El profesional deberá poder solicitar al asesorado información necesaria para su proceso mediante formularios estructurados.

Ejemplos:

```text
altura
peso
intolerancias
preferencias alimentarias
antecedentes relevantes
condiciones/enfermedades reportadas
lesiones
limitaciones
hábitos
datos requeridos para un método
```

La información:

```text
es reportada por el asesorado
≠ diagnóstico
≠ dato verificado automáticamente
```

salvo que otra fuente/proceso la valide.

---

# 18. Impacto documental detectado

Esta capacidad **no debe inventarse exclusivamente en el Documento 10**.

Puede requerir propagación hacia:

```text
04 — requisito funcional
05 — caso de uso/flujo
06 — modelo de datos
08 — categorías, minimización y autorización
09 — contratos API
11A — pruebas
12 — trazabilidad
```

Estado:

```text
CHANGE-CANDIDATE-10-DAT-01
```

No bloquea el diseño UX actual porque Dirección ya confirmó la intención de producto, pero **deberá reconciliarse formalmente antes de canonizar 10**.

---

# 19. Principio de minimización

Un profesional no debería poder enviar:

```text
"Completá todos tus datos de salud"
```

como requerimiento genérico.

La solicitud debe indicar:

```text
qué dato
para qué
en qué dominio/alcance
quién lo solicita
```

y limitarse a información pertinente.

---

# 20. Arquitectura de formularios

Se propone:

```text
FORM TEMPLATE
↓
PROFESSIONAL REQUEST
↓
ADVISEE RESPONSE
↓
SUBMITTED RESPONSE
↓
PROFESSIONAL CONSUMPTION
```

No editar silenciosamente una respuesta ya enviada.

Si cambia:

```text
nueva respuesta / corrección trazable
```

---

# 21. `FormTemplate`

Plantillas versionadas.

Ejemplos conceptuales:

```text
Datos básicos
Antecedentes para entrenamiento
Hábitos nutricionales
Intolerancias/preferencias
Pre-evaluación antropométrica
Datos para cálculo metodológico
```

El contenido exacto pertenece a definición posterior.

---

# 22. Formularios estándar vs personalizados

## P0 recomendado

Priorizar:

```text
plantillas BE versionadas
+
selección de campos/secciones permitidas
```

sobre:

```text
constructor libre tipo Google Forms
```

Razones:

- seguridad;
- coherencia;
- trazabilidad;
- validación;
- categorías de datos;
- minimización;
- reutilización.

---

# 23. Pregunta personalizada

Puede contemplarse después una pregunta libre limitada.

Si existe:

```text
pregunta
+ categoría
+ finalidad
+ obligatoriedad
```

No debe permitir al profesional escapar del modelo de autorización mediante un textbox arbitrario.

---

# 24. Pantalla profesional — solicitar información

## `CAND-10-DAT-01`

Dentro del workspace:

```text
Solicitar información
```

Flujo:

```text
elegir plantilla
→ seleccionar secciones/campos permitidos
→ revisar finalidad
→ enviar solicitud
```

Resumen antes de enviar:

```text
Solicitás:
- altura
- peso
- lesiones actuales
- condiciones relevantes para entrenamiento

Finalidad:
evaluar y planificar entrenamiento
```

---

# 25. Obligatorio vs opcional

Cada campo puede ser:

```text
requerido para continuar este proceso
opcional
```

Pero la UI debe usar “requerido” solo cuando realmente sea una precondición válida.

No usar obligatoriedad como dark pattern para datos no necesarios.

---

# 26. Pantalla asesorado — solicitud pendiente

Home/notification:

```text
[Profesional] necesita información para continuar con [finalidad].
```

CTA:

```text
Completar información
```

No:

```text
"Tu perfil está incompleto"
```

si el dato solo es requerido por ese profesional/contexto.

---

# 27. Formulario del asesorado

## `CAND-10-DAT-02`

Características:

- mobile-first;
- agrupado por secciones;
- progreso visible;
- autosave cuando sea seguro;
- explicaciones breves;
- opción “No lo sé” cuando corresponda;
- opción “Prefiero no responder” cuando la política permita;
- unidades claras;
- validación no agresiva.

---

# 28. Datos preexistentes

Si BE ya posee:

```text
altura = 175 cm
```

la UX puede precompletar:

```text
175 cm
Fuente: tu perfil
```

y permitir:

```text
Confirmar
Actualizar
```

si la semántica lo permite.

No duplicar el dato automáticamente como una nueva medición profesional.

---

# 29. Fuente del dato

Cada respuesta debe conservar procedencia:

```text
Reportado por el asesorado
```

vs:

```text
Medido por profesional
Calculado por BE/método
Importado
```

La UI debe distinguirlos.

---

# 30. Condiciones/enfermedades reportadas

Cuando el usuario completa:

```text
"¿Tenés alguna condición que pueda afectar tu entrenamiento?"
```

BE registra:

```text
self-reported
```

No:

```text
diagnosed = true
```

La UI nunca convierte un texto del usuario en diagnóstico.

---

# 31. Lesiones y limitaciones

Mismo principio:

```text
lesión/limitación reportada
```

Puede servir al profesional para planificar.

No debe disparar automáticamente:

- diagnóstico;
- contraindicación clínica;
- urgencia;
- tratamiento.

Reglas futuras pueden definir alertas no clínicas seguras si se aprueban.

---

# 32. Intolerancias y preferencias

Debe diferenciarse:

```text
intolerancia reportada
alergia reportada
preferencia
aversión
restricción cultural/religiosa
```

si el dominio finalmente lo modela.

No fusionar todo como:

```text
No come
```

---

# 33. Submit del formulario

Antes:

```text
Revisar respuestas
```

Después:

```text
Enviar información
```

Success:

```text
Información enviada
```

Mostrar:

- profesional solicitante;
- finalidad;
- fecha;
- estado.

---

# 34. Edición posterior

No sobrescribir silenciosamente una respuesta enviada.

Opciones:

```text
Actualizar respuesta
```

→ nueva versión/corrección trazable.

Si un dato es propiedad del perfil propio y se actualiza globalmente, el modelo deberá definir cómo se propaga.

Eso pertenece a 06/09.

---

# 35. Formularios y consentimiento

Una solicitud profesional:

```text
NO crea consentimiento
```

Si los datos solicitados necesitan B2 y no existe:

```text
flujo debe resolver primero el consentimiento correspondiente
```

No usar el formulario como bypass.

---

# 36. Formularios y `partialView`

Un profesional solo ve las respuestas que:

```text
PDP actual
+
finalidad
+
pertinencia
```

permitan.

Una respuesta histórica no crea acceso perpetuo.

---

# 37. Integración formulario → método

Flujo clave:

```text
Método seleccionado
↓
Falta altura y peso
↓
Solicitar datos
↓
Asesorado completa formulario
↓
Datos recibidos
↓
Método pasa a disponible
↓
Profesional calcula
```

La UX puede llevar al profesional de vuelta al punto donde estaba.

---

# 38. Integración formulario → evaluación

Otro flujo:

```text
Antes de evaluación
→ solicitar formulario
→ asesorado responde
→ profesional abre evaluación
→ datos reportados disponibles como contexto
```

No convertir automáticamente las respuestas en evaluación profesional.

---

# 39. Panel de suficiencia de datos

## `CAND-10-MET-D`

En cálculo/evaluación:

```text
Datos necesarios
✓ edad
✓ peso
✓ altura
○ masa libre de grasa
```

Acciones:

```text
Solicitar dato faltante
Usar otro método
```

**Recomendación:** RATIFICAR.

---

# 40. Historial metodológico

Dentro de una evaluación/objetivo:

```text
Método utilizado
Versión
Resultado
Datos de entrada
Fecha
Profesional
```

Si se recalcula con otra versión:

```text
nuevo CalculationRun
```

No reescribir el anterior.

---

# 41. Comparabilidad

Dos resultados solo deben presentarse como comparables cuando la metodología lo permita.

La UI puede decir:

```text
Método diferente
```

o:

```text
No comparable directamente
```

No dibujar una línea de evolución continua entre resultados incompatibles.

---

# 42. IA futura

Esta arquitectura deja un punto limpio para IA futura:

```text
BE puede sugerir método
BE puede resumir inputs
BE puede explicar diferencias
```

pero:

```text
IA suggestion
≠ professional decision
```

Y no se envían datos reales sensibles a IA externa mientras 08 lo prohíba.

---

# 43. Estado de confianza / suficiencia

No introducir:

```text
confianza clínica 92 %
```

sin definición canónica.

Sí se puede expresar de manera estructural:

```text
Datos requeridos completos
Faltan datos
Método no aplicable
```

---

# 44. Accesibilidad

Método disponible/no disponible:

- no solo por color;
- razones legibles;
- comparación usable con teclado;
- resultados anunciables;
- tabla alternativa a gráficos.

Formularios:

- labels;
- unidad;
- errores asociados;
- progreso no exclusivamente visual;
- “No lo sé” accesible;
- teclado apropiado por tipo de input.

---

# 45. Riesgos

## `R10-MET-01 — Automatización excesiva`

Un botón:

```text
"Elegir mejor método"
```

puede convertir BE en decisor.

Control:

```text
sugerir con razón
→ profesional elige
```

## `R10-MET-02 — Resultado sin procedencia`

Mostrar solo:

```text
24,8 %
```

sin método/fuente impide trazabilidad.

Control:

```text
result + method + version + inputs
```

## `R10-DAT-01 — Formulario como bypass de privacidad`

Control:

```text
template + category + purpose + PDP + consent
```

## `R10-DAT-02 — Formularios demasiado libres`

Control P0:

```text
plantillas BE
```

## `R10-DAT-03 — Respuesta del usuario presentada como verdad clínica`

Control:

```text
self-reported
```

---

# 46. Impactos registrados sobre documentos previos

## `IMPACT-09-10-MET-01`

Antropometría ya posee soporte explícito de method/specification/result.

Nutrición y Entrenamiento pueden requerir ampliar 09 para exponer de forma uniforme:

```text
method catalog
calculation run
method comparison/reference
```

si estos cálculos deben persistir o ser reproducibles como recursos propios.

Clasificación preliminar:

```text
ADITIVO
NO CONTRADICTORIO
REVISAR ANTES DE CANONIZAR 09/10
```

## `IMPACT-04-05-06-08-09-10-DAT-01`

Los formularios solicitados por profesionales parecen una **capacidad funcional transversal** y no solo una pantalla.

Requiere control de cambio/proyección documental antes de canonización.

No se debe ocultar como “campo extra del perfil”.

---

# 47. Decisiones / candidatas

| ID | Propuesta | Estado |
|---|---|---|
| `DIR-10-MET-A` | BE ofrece métodos/cálculos; profesional decide y queda registro del método | **RESUELTA POR DIRECCIÓN** |
| `DIR-10-DAT-A` | profesional puede solicitar formularios de datos pertinentes al asesorado | **RESUELTA POR DIRECCIÓN** |
| `CAND-10-MET-A` | método se elige en lista comparativa, no dropdown ciego | RATIFICAR |
| `CAND-10-MET-B` | sugerencias transparentes sin decisión automática | RATIFICAR |
| `CAND-10-MET-C` | CTA “Usar como referencia” antes de adoptar en decisión | RATIFICAR |
| `CAND-10-MET-D` | panel de suficiencia de datos | RATIFICAR |
| `CAND-10-DAT-01` | profesional solicita plantilla/campos/finalidad | RATIFICAR |
| `CAND-10-DAT-02` | formulario mobile-first al asesorado | RATIFICAR |
| `CAND-10-DAT-03` | P0 usa plantillas BE antes que builder libre | RATIFICAR |
| `CAND-10-DAT-04` | respuestas reportadas no sobrescriben evaluación profesional | RATIFICAR |

---

# 48. Próxima integración con B10-06

Entrenamiento deberá incorporar:

```text
Datos del asesorado
→ evaluación
→ métodos/cálculos disponibles
→ objetivo
→ plan
```

y permitir:

```text
faltan datos
→ solicitar formulario
→ continuar proceso
```

sin convertir el formulario en una autorización ni el cálculo en decisión automática.

---

# 49. Estado de salida

```text
ADENDA v0.5:
DESARROLLADA

MÉTODOS:
PREESTABLECIDOS
VERSIONADOS
REPRODUCIBLES
COMPARABLES CUANDO CORRESPONDA

PROFESIONAL:
SIEMPRE DECIDE

CÁLCULO:
≠ DECISIÓN PROFESIONAL

MÉTODO UTILIZADO:
QUEDA REGISTRADO

FORMULARIOS:
SOLICITABLES POR PROFESIONAL
PERTINENTES
ESTRUCTURADOS
SELF-REPORTED

PRIVACIDAD:
NO BYPASS
PDP + FINALIDAD + CONSENTIMIENTO

IMPACTO 09:
ADITIVO POSIBLE

IMPACTO 04/05/06/08/09:
FORMULARIOS REQUIEREN RECONCILIACIÓN TRANSVERSAL

IMPLEMENTACIÓN:
NO AUTORIZADA

SIGUIENTE:
B10-06 — ENTRENAMIENTO UX P0
CON SOPORTE DE MÉTODOS Y FORMULARIOS
```

---

*Fin de BE-LEG-10 v0.5 — Adenda transversal de Métodos, Cálculos, Sugerencias y Formularios de Datos.*
