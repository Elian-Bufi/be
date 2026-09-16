# BE-LEG-10 v0.7 — B10-07 Antropometría UX P0 TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-10 — Diseño UI/UX y Prototipos`  
> **Bloque:** `B10-07 — Antropometría UX P0`  
> **Versión documental:** `v0.7.1`  
> **Fecha:** `2026-09-06`  
> **Estado:** `BORRADOR UX — NO CANÓNICO · CORRECCIÓN POST-CONTRARREVISIÓN`  
> **Continuidad:** corrige hallazgos demostrados sobre el B10-07 rehecho; no modifica por sí mismo ningún documento aprobado/canonizado  
> **Fuentes comportamentales y de dominio:** BE-LEG-05 v0.14 · BE-LEG-06 v0.1 · BE-LEG-08 vigente aprobado  
> **Insumo contractual:** BE-LEG-09 v0.15 `NO CANÓNICO / CONGELADO COMO INSUMO`  
> **Continuidad UX:** BE-LEG-10 v0.2/v0.3/v0.4/v0.5/v0.6  
> **Capacidad:** Antropometría transversal; no constituye una tercera especialidad  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Objeto del bloque

B10-07 define la experiencia P0 de Antropometría sin reabrir el dominio ni convertir UX en fuente de verdad para fórmulas, permisos, contratos o persistencia.

Debe materializar en experiencia de usuario la conducta ya aprobada para:

- `RF-047 — Registrar evaluación antropométrica`;
- `RF-048 — Emitir cálculos antropométricos reproducibles`;
- `RF-049 — Consultar evolución antropométrica`;
- `RF-050 — Corregir evaluación antropométrica`;
- `UC-P19 — Registrar evaluación antropométrica`;
- `UC-P20 — Consultar evolución antropométrica`;
- `UC-I09 — Emitir cálculos antropométricos reproducibles`;
- `UC-E03 — Corregir evaluación antropométrica`;
- `UC-I12 — Registrar corrección trazable`.

## 0.1. Precisión de cobertura sobre `RF-050`

La contrarrevisión verificó una deuda previa al Documento 10:

```text
04 / RF-050
→ exige corregir O anular una medición

05 / UC-E03 + UC-I12
→ materializa corrección trazable
→ no materializa una variante de anulación

06 / M-09 + B-06
→ estructura corrección y recálculo
→ no define semántica propia de anulación
```

Por tanto, B10-07 **no puede afirmar cobertura íntegra de RF-050 ni inventar desde UX la semántica faltante**.

Tratamiento en este bloque:

- la rama de **corrección** sí se materializa en UX;
- la rama de **anulación** queda declarada como deuda canónica/transversal a resolver en la Auditoría de Impacto;
- hasta esa resolución, UX no crea CTA, estado, contrato ni efecto de anulación por cuenta propia.

Esta precisión corrige la sobredeclaración de cobertura sin modificar 04/05/06.

`RF-051` y `UC-P21/UC-P22` —descubrimiento limitado del servicio antropométrico— continúan fuera de este bloque P0 y no deben colarse como marketplace, turnos, pagos, ranking, reseñas ni contratación.

---

# 1. Resultado esperado

La experiencia profesional debe permitir:

```text
SHELL-PRO
→ Cartera
→ asesorado
→ Antropometría
→ preparar evaluación
→ revisar datos disponibles y su procedencia
→ seleccionar protocolo de medición
→ registrar o incorporar mediciones directas
→ revisar completitud y consistencia técnica
→ descubrir métodos de cálculo compatibles
→ ejecutar uno o varios cálculos reproducibles
→ comparar resultados
→ recibir, cuando corresponda, sugerencias transparentes
→ elegir/adoptar una referencia profesional
→ registrar la evaluación
→ corregir sin sobrescribir
→ conocer dependencias afectadas
→ recalcular selectivamente
→ consultar historia
→ consultar evolución longitudinal con comparabilidad explícita
```

La experiencia del asesorado debe permitir, dentro de su autorización y visibilidad aplicables:

```text
SHELL-ADV
→ consultar resultados propios
→ distinguir medido / reportado / calculado
→ consultar evolución
→ comprender rupturas o límites de comparabilidad
→ responder formularios pertinentes solicitados por un profesional
```

No se crea un “plan antropométrico”.

---

# 2. Invariantes UX de B10-07

La superficie debe preservar simultáneamente:

```text
dato self-reported ≠ medición directa
medición directa ≠ resultado derivado
protocolo de medición ≠ método de cálculo
método compatible ≠ método sugerido
método sugerido ≠ método elegido
resultado calculado ≠ referencia adoptada
referencia adoptada ≠ decisión profesional
resultado derivado ≠ diagnóstico
corrección ≠ edición destructiva
recálculo ≠ reescritura histórica
cambio metodológico ≠ incomparabilidad automática
SIN_DATO ≠ 0
historia ≠ continuidad visual automática
```

---

# 3. Principio rector de trazabilidad visible

> **Toda cifra antropométrica relevante debe poder responder “de dónde salió”.**

Según el tipo de dato, BE debe poder mostrar o hacer inspeccionable:

- qué representa;
- quién lo registró o reportó;
- momento de ocurrencia y registro cuando aplique;
- procedencia;
- protocolo identificado si es medición directa;
- unidad original;
- conversiones explícitas si existen;
- método y versión si es derivado;
- especificación/version de cálculo aplicable;
- fórmula o referencia técnica cuando corresponda;
- inputs efectivamente utilizados;
- unidades de esos inputs;
- precisión/redondeo aplicados;
- resultado producido;
- correcciones y relación con originales;
- dependencias y recálculos posteriores.

La interfaz puede resumir esta información en la vista principal, pero no eliminar la posibilidad de reconstruirla.

---

# 4. Frontera de propiedad documental

B10-07 **presenta** y **orquesta UX**. No redefine:

| Tema | Propietario |
|---|---|
| conducta observable | 04/05 |
| estructura de medición, derivado, dependencias, comparabilidad, corrección | 06 |
| mecanismo arquitectónico | 07 |
| autorización, privacidad, acceso, retención, auditoría | 08 |
| shape/operaciones contractuales | 09 |
| UI, navegación, copy y prototipos | 10 |
| pruebas | 11A |
| trazabilidad integral | 12 |

La adenda transversal de métodos/cálculos/sugerencias/formularios de `BE-LEG-10 v0.5` permanece como decisión UX de trabajo pendiente de Auditoría de Impacto Transversal.

---

# 5. Gate de capacidad y autorización

Antropometría debe poder operar para un profesional con capacidad antropométrica válida aun cuando no posea especialidad de Nutrición o Entrenamiento.

Ruta conceptual:

```text
SHELL-PRO
→ Cartera / contexto autorizado
→ asesorado
→ Antropometría
```

La visibilidad de una pantalla jamás sustituye la autorización contextual.

Un profesional sin capacidad/habilitación/autorización aplicable no obtiene capacidad operativa por conocer la ruta.

Pausa, revocación y finalización consumen las políticas vigentes de vínculo/consentimiento/autorización; B10-07 no crea excepciones de lectura residual.

---

# 6. Arquitectura de información profesional

Dentro de `WORKSPACE-ADVISEE` se propone:

```text
Antropometría
├─ Resumen
├─ Evaluaciones
├─ Nueva evaluación
└─ Evolución
```

`Métodos` no necesita ser navegación primaria permanente. Puede existir como subvista contextual de `Nueva evaluación` y del detalle de cálculo.

**Motivo:** el profesional trabaja sobre una evaluación concreta; el catálogo metodológico es soporte del proceso, no un destino administrativo autónomo en P0.

---

# 7. Resumen antropométrico

## `CAND-10-ANT-01`

Objetivo: ofrecer lectura operativa sin producir score, diagnóstico ni juicio corporal.

Puede mostrar:

- última evaluación;
- fecha;
- protocolo identificado;
- cantidad/estado de mediciones;
- principales resultados derivados seleccionados para visualización;
- existencia de referencia profesional adoptada;
- comparabilidad con evaluación anterior;
- correcciones posteriores relevantes;
- acceso a evolución;
- CTA `Nueva evaluación`.

No mostrar:

```text
Estado corporal: malo
Riesgo corporal
Score físico
Score de salud
Resultado BE definitivo
```

---

# 8. Flujo principal de nueva evaluación

## `CAND-10-ANT-02`

```text
Nueva evaluación
↓
1. Contexto y datos disponibles
2. Protocolo de medición
3. Mediciones directas
4. Revisión de mediciones
5. Métodos compatibles
6. Cálculos
7. Comparación / referencia profesional
8. Revisión final
9. Registrar evaluación
```

El componente final puede ser stepper, pantalla larga seccionada o combinación responsive. El documento fija la secuencia semántica, no el widget definitivo.

## 8.1. `UC-P19 V04` — Evaluación en preparación / retomable

El 05 aprobado contempla expresamente que, cuando la política lo permita, una evaluación pueda guardarse como borrador y retomarse posteriormente.

B10-07 materializa su **visibilidad UX P0** sin fijar todavía la estructura técnica propietaria de 06/09:

```text
Nueva evaluación
→ trabajo parcial
→ Guardar para continuar después
→ estado UX: EN PREPARACIÓN / BORRADOR
→ retomar bajo autorización vigente
→ revisar
→ registrar evaluación
```

Reglas:

- `EN PREPARACIÓN / BORRADOR ≠ EVALUACIÓN REGISTRADA`;
- el estado debe ser inequívoco y no depender solo del color;
- solo el profesional autorizado puede retomarlo desde su workspace, sujeto a reevaluación de autorización;
- no se presenta como `Última evaluación` registrada;
- no alimenta la evolución longitudinal como evaluación confirmada;
- no se proyecta al asesorado como resultado antropométrico registrado;
- una cifra o cálculo obtenido durante la preparación no se presenta como histórico confirmado hasta que la evaluación se registre conforme al flujo;
- una falla al guardar el borrador no se presenta como éxito.

La **estructura persistente, estado técnico, caducidad, concurrencia y contrato** de este borrador quedan expresamente para la Auditoría de Impacto sobre 06/09. B10-07 decide aquí únicamente la distinción y visibilidad necesarias para no presentar un borrador como evaluación completa.

Esta regla amplía `CAND-10-ANT-02`; no crea una candidata paralela.

---

# 9. Datos disponibles antes de medir

BE puede disponer de datos procedentes de:

```text
perfil
formulario solicitado
medición realizada en esta evaluación
medición histórica
importación controlada
otro recurso autorizado del propio asesorado
```

Cada dato debe conservar **tipo y procedencia**.

La UI no debe copiar un valor histórico y presentarlo como “medido hoy”.

---

# 10. Formularios previos solicitados por profesional

## `CAND-10-ANT-A`

Cuando sea pertinente, el profesional puede solicitar una plantilla BE versionada para reunir datos necesarios antes de la evaluación.

Ejemplos posibles, sin congelar catálogo:

- altura reportada;
- peso reportado;
- datos personales requeridos por un método;
- condiciones o antecedentes pertinentes para la finalidad autorizada;
- información operativa necesaria para preparar la evaluación.

Reglas UX:

1. finalidad visible;
2. pertinencia visible;
3. no constructor libre tipo Google Forms en P0;
4. respuestas identificadas como `self-reported`;
5. correcciones de respuesta no sobrescriben silenciosamente la anterior;
6. responder no equivale a medición profesional;
7. el formulario no amplía por sí mismo el consentimiento o el acceso.

**Recomendación:** RATIFICAR COMO PATRÓN TRANSVERSAL, sujeto a Auditoría de Impacto posterior.

---

# 11. Self-reported no se promociona a medición

Ejemplo correcto:

```text
Peso reportado por asesorado
78 kg
Fuente: formulario previo
```

Si durante la evaluación el profesional obtiene una medición:

```text
Peso medido
77.4 kg
Fuente: evaluación actual
```

Ambos hechos pueden coexistir.

No:

```text
78 kg self-reported
→ silenciosamente convertido en “peso medido”
```

---

# 12. Admisibilidad de inputs

Que un dato esté disponible no significa que un método pueda utilizarlo.

La especificación versionada del método debe determinar, entre otras condiciones, qué tipo de input admite.

Por tanto:

```text
DATO DISPONIBLE
≠
INPUT ADMISIBLE PARA TODO MÉTODO
```

Si un método admite un dato self-reported, el cálculo conserva esa procedencia. Si exige medición directa y solo existe un dato reportado, debe figurar como requisito faltante.

---

# 13. Protocolo de medición

## `CAND-10-ANT-03`

Antes de registrar mediciones directas, el profesional identifica el protocolo aplicable a la toma.

La UX puede exponer:

- nombre/identificador;
- versión o referencia identificable cuando corresponda;
- mediciones esperadas;
- unidades esperadas;
- instrucciones o notas técnicas disponibles;
- condición requerida/opcional si el protocolo la define.

El protocolo pertenece al contexto de **cómo se obtuvo una medición directa**.

No se confunde con la especificación versionada de un método de cálculo.

---

# 14. Protocolo de medición ≠ especificación del cálculo ≠ método

Distinción obligatoria:

```text
PROTOCOLO DE MEDICIÓN
→ contexto de toma y observación

MÉTODO DE CÁLCULO
→ procedimiento que produce un derivado

ESPECIFICACIÓN/VERSIÓN DEL MÉTODO
→ define fórmula/regla, inputs, unidades, precisión y dependencias reproducibles
```

Puede existir relación entre ellos, pero UX no los fusiona en un único selector opaco.

Esta precisión reemplaza la formulación ambigua `specification/protocolo` del borrador previo de B10-07.

---

# 15. Captura de mediciones directas

## `CAND-10-ANT-04`

La UI puede agrupar campos por familias de medición definidas por el protocolo/catálogo, por ejemplo:

```text
masa/estatura
pliegues
circunferencias
longitudes/diámetros
otras mediciones admitidas
```

Cada registro visible debe diferenciar al menos:

- nombre;
- valor;
- unidad original;
- estado de captura;
- procedencia;
- autoría/contexto cuando corresponda.

Si un protocolo requiere repeticiones, la UI debe poder representar múltiples tomas y el valor finalmente utilizado sin perder las tomas originales.

---

# 16. Captura rápida en campo

## `CAND-10-ANT-05`

Antropometría exige eficiencia operativa. Se propone que el prototipo P0 soporte:

```text
lista densa de mediciones
+ teclado numérico adecuado
+ guardar y avanzar
+ foco al siguiente campo
+ edición previa a registro final
```

No obligar a abrir un modal independiente por cada medición.

La captura rápida nunca habilita sobrescritura posterior del histórico ya registrado.

**Recomendación:** RATIFICAR CON PROTOTIPO.

---

# 17. Unidad original y conversión

Regla UX:

> **La unidad original nunca desaparece por una conversión.**

Si BE presenta una unidad normalizada:

```text
captura original: X unidad A
presentación normalizada: Y unidad B
```

la conversión debe ser explícita y reproducible.

No usar una conversión para hacer parecer que el valor se capturó originalmente en otra unidad.

---

# 18. Ayuda anatómica

La UX puede utilizar ilustraciones, maniquíes, marcadores o referencias visuales para facilitar la toma.

Regla:

```text
asset visual ≠ definición del punto/medición
```

La identificación de la medición pertenece al protocolo/catálogo; el recurso visual es ayuda de interacción.

La producción del sistema visual detallado queda para la fase posterior de prototipos y no se congela desde este bloque.

---

# 19. Revisión de mediciones

## `CAND-10-ANT-06`

Antes de ejecutar cálculos, la interfaz debe permitir revisar:

```text
qué fue medido
qué falta
qué dato proviene de otra fuente
qué unidad se utilizó
qué validaciones técnicas no se cumplen
```

Copy válido:

```text
Falta una medición requerida
Unidad no admitida por este protocolo/método
Formato no válido
Dato no disponible
```

Evitar afirmar `clínicamente incorrecto` cuando BE solo verificó estructura, formato o reglas técnicas definidas.

---

# 20. `SIN_DATO` como estado real

La ausencia se representa como ausencia.

Copy de usuario:

```text
Sin dato
No registrado
Falta medición
```

No:

```text
0
```

Tampoco un `0` real puede reinterpretarse automáticamente como ausencia.

---

# 21. Importación antropométrica controlada

## `CAND-10-ANT-IMP`

B10-07 debe admitir el origen externo ya previsto por el dominio sin asumir proveedor, CSV, planilla, columnas ni transporte concretos.

Flujo UX conceptual:

```text
Incorporar datos externos
→ identificar fuente
→ revisar datos recibidos
→ resolver mapeo/compatibilidad cuando corresponda
→ revisar unidades
→ mostrar transformaciones si existen
→ validar procedencia
→ confirmar incorporación
```

La importación no sobrescribe una evaluación existente de forma silenciosa.

---

# 22. Procedencia de datos importados

El detalle debe permitir reconstruir, según disponibilidad contractual:

- origen externo;
- actor/fuente;
- fecha/contexto;
- valores originales;
- unidades originales;
- transformaciones explícitas;
- decisión profesional de incorporación/rechazo/corrección cuando corresponda.

Si la información externa es insuficiente, la UX debe permitir corregir o rechazar sin inventar datos.

La definición del formato/proveedor y de la operación contractual concreta no pertenece a B10-07.

---

# 23. Catálogo de métodos

El profesional puede ver métodos preestablecidos y versionados disponibles para el tipo de resultado buscado.

La UI no congela aquí un catálogo científico concreto.

Puede soportar métodos destinados a producir, entre otros resultados aprobados por dominio/configuración:

- composición corporal estimada;
- relaciones/índices;
- masas derivadas;
- otros cálculos antropométricos reproducibles.

Nombres históricos del proyecto pueden utilizarse solo como fixtures de prototipo, no como lista canónica del producto.

---

# 24. Métodos compatibles

## `CAND-10-ANT-07`

Para cada método/version, la UX debe mostrar:

- qué resultado produce;
- versión;
- inputs requeridos;
- inputs actualmente disponibles;
- inputs faltantes;
- tipo/procedencia de inputs relevantes;
- limitaciones o condiciones aplicables;
- referencia técnica disponible.

Estados UX conceptuales:

```text
Compatible con los datos actuales
Faltan datos
No aplicable en este contexto
Histórico / no seleccionable para nuevo cálculo
```

Los nombres contractuales definitivos pertenecen a 09.

---

# 25. Compatibilidad ≠ sugerencia

Un método puede ser técnicamente ejecutable y no estar sugerido.

```text
Compatible
```

significa que cumple condiciones para ejecutarse.

```text
Sugerido por BE
```

si existe, es una capa distinta y debe tener fundamento visible.

No utilizar la posición visual, color dominante o CTA principal para convertir una sugerencia en elección forzada.

---

# 26. Sugerencias transparentes de método

## `CAND-10-ANT-SUG`

Cuando BE sugiera un método, debe exponer de manera comprensible:

- qué criterio disparó la sugerencia;
- qué datos están disponibles;
- qué limitación relevante existe;
- qué alternativas compatibles permanecen disponibles.

Secuencia semántica:

```text
BE identifica compatibilidad
→ BE puede sugerir
→ profesional elige qué ejecutar
→ profesional interpreta
→ profesional adopta o no una referencia
→ profesional decide
```

La sugerencia nunca ejecuta ni adopta automáticamente el método.

**Recomendación:** RATIFICAR como instancia de la decisión transversal de Dirección.

---

# 27. Ejecutar cálculo reproducible

## `CAND-10-ANT-08`

Antes de ejecutar, la UI debe permitir verificar el snapshot lógico de inputs que se utilizará.

Después de ejecutar, el resultado debe quedar vinculado a:

```text
método
versión/especificación
fórmula o referencia inequívoca
inputs utilizados
procedencia de inputs
unidades
precisión/redondeo
resultado
fecha/contexto
```

El resultado se etiqueta inequívocamente como **derivado/calculado**.

---

# 28. Múltiples ejecuciones

El profesional puede ejecutar uno o varios métodos compatibles.

Cada ejecución es independiente.

No:

```text
Método A + Método B + Método C
→ promedio automático BE
```

Sí:

```text
Resultado A
Resultado B
Resultado C
```

con trazabilidad individual.

---

# 29. Comparación de métodos

## `CAND-10-ANT-09`

Cuando los resultados puedan contrastarse de forma legítima, la vista puede mostrar:

| Dimensión | Método A | Método B |
|---|---|---|
| versión | visible | visible |
| resultado | visible | visible |
| unidad | visible | visible |
| inputs principales | visible | visible |
| procedencia | visible | visible |
| limitaciones | visible | visible |

Puede mostrar diferencias matemáticas si son válidas.

No debe producir:

- promedio automático;
- ranking metodológico opaco;
- “método ganador” del sistema;
- “valor real”;
- “resultado definitivo”.

---

# 30. Resultado calculado ≠ referencia profesional

## `CAND-10-ANT-10`

Representación:

```text
Resultados calculados
├─ Método A · valor X
├─ Método B · valor Y
└─ Método C · valor Z

Referencia profesional
→ Método A · valor X
```

La referencia adoptada:

- no modifica el cálculo;
- no elimina alternativas;
- conserva quién/cuándo la adoptó cuando corresponda;
- puede cambiar hacia adelante sin reescribir la selección anterior.

---

# 31. Referencia profesional ≠ decisión profesional

La UI debe evitar inferir que adoptar una cifra resuelve automáticamente una decisión de Nutrición, Entrenamiento o cualquier otra acción profesional.

```text
cálculo
→ posible sugerencia
→ resultado consultado
→ referencia adoptada
→ interpretación/decisión profesional
```

Son capas distintas.

Una actualización antropométrica no modifica un plan activo automáticamente.

---

# 32. Resultados derivados y cadenas de cálculo

Un resultado puede depender directamente de mediciones o de resultados intermedios reproducibles.

Ejemplo abstracto:

```text
mediciones
→ derivado intermedio
→ derivado final
```

La UI no necesita mostrar el grafo completo por defecto, pero sí debe permitir inspeccionar la cadena suficiente para comprender el origen.

---

# 33. “Cómo se obtuvo”

## `CAND-10-ANT-11`

Panel profesional secundario:

```text
Resultado
Método y versión
Inputs
Procedencia de inputs
Unidades
Precisión
Resultados intermedios, si existen
Fecha de ejecución
```

Acción opcional:

```text
Ver fórmula / referencia técnica
```

Esto materializa reproducibilidad sin saturar la pantalla principal.

---

# 34. Registro de la evaluación

Una evaluación puede registrarse sin ejecutar todos los métodos existentes.

Debe preservar una unidad coherente con:

- contexto;
- protocolo identificado;
- mediciones directas incorporadas;
- procedencias;
- resultados derivados efectivamente ejecutados;
- referencias profesionales adoptadas, si existen.

No presentar como guardado exitoso algo que no pudo persistirse/auditarse conforme al contrato aplicable.

## 34.1. Preparación ≠ registro final

Si existe un borrador conforme a `UC-P19 V04`:

```text
Guardar para continuar después
≠
Registrar evaluación
```

La transición visual a `Evaluación registrada` requiere la confirmación final y las validaciones aplicables. Antes de ese punto, el borrador conserva una presentación profesional inequívoca de `En preparación` y queda fuera de las superficies longitudinales/propias que presuponen una evaluación registrada.

---

# 35. Detalle de evaluación

## `CAND-10-ANT-12`

Secciones sugeridas:

```text
Contexto
Mediciones directas
Datos reportados utilizados
Resultados derivados
Métodos / especificaciones utilizadas
Referencia profesional
Correcciones
Procedencia
```

Mediciones directas, datos self-reported y resultados derivados deben tener semántica visual diferente incluso si comparten unidad.

---

# 36. Corrección trazable

## `CAND-10-ANT-13`

Flujo:

```text
Detalle
→ elemento corregible
→ Corregir
→ ver original
→ introducir nuevo valor/metadato permitido
→ motivo cuando corresponda
→ previsualizar impacto
→ confirmar corrección
```

No utilizar `Editar` cuando implique mutación retrospectiva del histórico.

---

# 37. Corrección de distintos elementos

P0 debe poder expresar al menos las variantes ya previstas por conducta:

- corrección de medición directa;
- corrección de metadato;
- corrección de unidad identificada;
- nueva corrección sobre una cadena previa.

Cada nueva corrección se agrega a la historia.

---

# 38. Vista previa de impacto

Antes de confirmar una corrección que afecte inputs de cálculo, BE debe informar qué derivados quedan afectados.

Ejemplo:

```text
Esta corrección afecta 4 resultados derivados.
3 dependen directamente de la medición.
1 depende de un resultado intermedio afectado.
```

No es obligatorio exponer el grafo técnico completo al usuario general.

---

# 39. Recálculo selectivo de dependencias

## `CAND-10-ANT-14`

Después de una corrección válida:

```text
original preservado
→ corrección registrada
→ dependencias afectadas identificadas
→ solo derivados dependientes se recalculan
→ nuevos resultados se agregan
→ resultados anteriores se conservan
```

No recalcular elementos independientes.

No declarar la evolución recalculada como completa si no puede identificarse la dependencia necesaria.

---

# 40. Historia de correcciones y recálculos

La UI debe poder reconstruir:

```text
medición original
→ cálculo original
→ corrección 1
→ recálculo 1
→ corrección 2
→ recálculo 2
→ vista efectiva actual
```

Cada hecho mantiene su fecha/autoría/procedencia según corresponda.

La historia no se “limpia” para presentar una única verdad retrospectiva.

---

# 41. Conflicto concurrente

Si la cadena cambió mientras el profesional estaba corrigiendo, la UX debe evitar sobrescribir la versión vigente.

Copy conceptual:

```text
La evaluación cambió desde que la abriste.
Revisá la versión actual antes de continuar.
```

La resolución contractual pertenece a 09.

---

# 42. Evolución longitudinal

## `CAND-10-ANT-15`

La evolución puede ofrecer selección por métrica/resultado y representar:

- fechas/períodos;
- valores existentes;
- unidad;
- origen directo/derivado;
- protocolo cuando afecte comprensión;
- método/version para derivados;
- correcciones relevantes;
- estado de comparabilidad.

No crea análisis causal automático.

---

# 43. Comparabilidad no se decide por nombre de métrica

Dos puntos con la misma etiqueta no son automáticamente equivalentes.

La compatibilidad debe evaluarse conforme a las reglas del dominio/especificación considerando las dimensiones que correspondan, entre ellas protocolo, método, versión y unidad.

Regla clave:

> **Un cambio metodológico es una señal para evaluar compatibilidad; no es por sí solo una sentencia de incomparabilidad.**

---

# 44. Estados de comparabilidad en UX

La UI debe poder expresar conceptualmente:

```text
Comparable
Parcialmente comparable
No comparable
Información insuficiente para decidir
```

Los tokens contractuales definitivos pertenecen a 09; `PARTIALLY_COMPARABLE` se consume como antecedente del borrador contractual, no se canoniza desde UX.

---

# 45. Representación de series comparables

Cuando una serie es comparable, puede existir continuidad visual normal.

Debe mantenerse visible el método/protocolo relevante cuando su cambio sea significativo para interpretar la serie.

---

# 46. Representación de comparabilidad parcial

Una comparación limitada debe mostrar explícitamente la limitación.

Opciones de diseño a prototipar:

- segmentación;
- cambio de estilo de línea;
- anotación;
- banda/etiqueta metodológica;
- tabla acompañante.

No convertir una comparación limitada en continuidad homogénea.

---

# 47. Series no comparables

Si el dominio determina que dos tramos no son comparables, no deben dibujarse como una única continuidad.

Ejemplo conceptual:

```text
Serie / especificación A
────●────●────●

[ruptura de comparabilidad]

Serie / especificación B
                 ●────●────●
```

La interfaz debe explicar la causa disponible de la ruptura.

---

# 48. `SIN_DATO` longitudinal

Si falta una observación:

```text
fecha 1 → valor
fecha 2 → SIN_DATO
fecha 3 → valor
```

No se permite:

- interpolar;
- imputar;
- arrastrar último valor;
- completar con cero;
- fabricar punto intermedio.

La visualización debe conservar el hueco.

---

# 49. No causalidad y no diagnóstico

La UX puede decir:

```text
Cambio desde la evaluación anterior
```

No debe decir automáticamente:

```text
Bajó por el plan nutricional
Mejoró por el entrenamiento
Riesgo elevado
Estado clínico X
```

La visualización describe datos autorizados; no crea diagnóstico, causalidad ni score global.

---

# 50. Experiencia del asesorado

En `SHELL-ADV`, la antropometría propia puede presentarse desde una superficie de progreso/historia coherente con el sitemap P0, sin replicar la consola profesional.

Debe priorizar:

- fecha de última evaluación;
- resultados que corresponda mostrar;
- etiqueta `Medido`, `Reportado` o `Calculado/Estimado`;
- evolución;
- límites de comparabilidad;
- detalle de método cuando aporte comprensión y esté habilitado.

No exponer herramientas de elección metodológica, corrección profesional o administración de protocolos.

---

# 51. Lenguaje de composición corporal

Cuando se muestre un resultado derivado al asesorado, usar copy del tipo:

```text
Porcentaje de grasa estimado
Resultado calculado
Método: …
Fecha: …
```

Evitar:

```text
Tu grasa real
Tu estructura es deficiente
Tu cuerpo está mal
Valor perfecto
```

---

# 52. Cruce con Nutrición y Entrenamiento

Antropometría puede aportar información autorizada a otras áreas sin convertirse en su motor decisorio.

```text
resultado antropométrico
→ disponible como dato autorizado
→ profesional lo interpreta dentro de su alcance
→ posible decisión profesional posterior
```

No:

```text
nuevo % de grasa
→ BE modifica automáticamente calorías
→ BE modifica automáticamente volumen/cargas
```

El reuso cross-domain conserva procedencia y no amplía acceso.

---

# 53. Estados vacíos

## Sin evaluaciones

```text
Todavía no hay evaluaciones antropométricas registradas.
```

Profesional autorizado: CTA `Nueva evaluación`.

## Evaluación sin cálculos

```text
Hay mediciones registradas, pero todavía no se ejecutaron cálculos derivados.
```

## Método sin datos suficientes

```text
Faltan datos para ejecutar este método.
```

Mostrar cuáles, si es revelable.

## Evolución sin serie comparable

```text
Existen resultados históricos, pero no forman una única serie comparable.
```

Permitir consultar evaluaciones individuales.

---

# 54. Errores y copy técnico

Copy principal orientado a acción:

```text
Falta una medición requerida
La unidad no es compatible
Este método no puede ejecutarse con los datos actuales
La evaluación cambió; revisá la versión vigente
Tu acceso ya no está disponible
No pudimos registrar la corrección
```

No mostrar como copy primario:

```text
PDP_DENIED
FORMULA_VERSION_NOT_FOUND
DEPENDENCY_GRAPH_ERROR
```

Los códigos pueden existir para diagnóstico técnico, no como lenguaje principal de UX.

---

# 55. Accesibilidad mínima inseparable del flujo

La revisión exhaustiva de accesibilidad queda para la fase transversal posterior, pero B10-07 no puede diseñar una interacción que dependa solo del color.

Mínimos ya exigibles al prototipo:

- label + unidad asociados;
- errores expresados en texto;
- foco predecible en captura rápida;
- gráficos con alternativa tabular;
- estado de comparabilidad expresado en texto y no solo estilo/color.

---

# 56. Responsive / tablet — criterio, no cierre visual

La toma antropométrica puede beneficiarse de tablet o notebook táctil.

El prototipo debe probar que:

- el profesional puede capturar una secuencia larga sin micro-modales;
- la unidad permanece visible;
- el teclado no tapa el campo activo;
- se puede revisar antes de registrar;
- la trazabilidad no se sacrifica por velocidad.

El sistema responsive definitivo se desarrolla después de B10-08/B10-09 según el orden del handoff.

---

# 57. Binding UX ↔ API-09 provisional

Se conserva el binding del borrador contractual como **insumo no canónico**:

| Necesidad UX | Familia 09 provisional |
|---|---|
| descubrir especificaciones aplicables | `API-ANT-01` |
| crear/registrar evaluación | `API-ANT-02` |
| listar evaluaciones | `API-ANT-03` |
| consultar detalle | `API-ANT-04` |
| corregir | `API-ANT-05` |
| consultar evolución | `API-ANT-06` |

No se crean endpoints desde UX.

El antecedente contractual `BE-LEG-09 v0.11` ya contempla en `API-ANT-02` un origen de captura `CONTROLLED_IMPORT`, con procedencia y resumen de incorporación. Por tanto, **la existencia básica de importación controlada no se trata como superficie contractual ausente**.

Lo que sí debe auditarse es si el flujo UX previo de:

```text
identificar fuente
→ revisar/mapping/compatibilidad
→ revisar unidades/transformaciones
→ confirmar incorporación
```

queda suficientemente representado por `API-ANT-02 + preparationReference` o necesita una aclaración/superficie contractual adicional.

Los siguientes comportamientos deben entrar en la Auditoría de Impacto antes de asumir que caben íntegramente en esas seis operaciones:

- múltiples ejecuciones de métodos como recursos explícitos;
- sugerencias metodológicas persistentes o efímeras;
- adopción de referencia profesional;
- formularios solicitados y sus respuestas versionadas;
- flujo previo de preparación/revisión de importación controlada;
- consulta detallada de dependencias/recálculos.

---

# 58. Matriz de candidatos B10-07

| ID | Propuesta | Estado recomendado |
|---|---|---|
| `CAND-10-ANT-01` | resumen antropométrico no diagnóstico | RATIFICAR |
| `CAND-10-ANT-02` | flujo secuencial de evaluación | RATIFICAR |
| `CAND-10-ANT-A` | formulario previo BE versionado, self-reported | RATIFICAR + AUDITAR IMPACTO |
| `CAND-10-ANT-03` | protocolo de medición identificado | RATIFICAR |
| `CAND-10-ANT-04` | captura agrupada de mediciones directas | RATIFICAR |
| `CAND-10-ANT-05` | captura rápida sin sacrificar trazabilidad | RATIFICAR CON PROTOTIPO |
| `CAND-10-ANT-06` | revisión previa de mediciones | RATIFICAR |
| `CAND-10-ANT-IMP` | importación controlada con revisión/procedencia | RATIFICAR; CONTRATO A AUDITAR |
| `CAND-10-ANT-07` | métodos muestran requisitos y compatibilidad | RATIFICAR |
| `CAND-10-ANT-SUG` | sugerencia transparente separada de compatibilidad/elección | RATIFICAR + AUDITAR IMPACTO |
| `CAND-10-ANT-08` | cálculo reproducible con snapshot de inputs | RATIFICAR |
| `CAND-10-ANT-09` | comparación sin promedio/ganador automático | RATIFICAR |
| `CAND-10-ANT-10` | adopción explícita de referencia profesional | RATIFICAR + AUDITAR IMPACTO |
| `CAND-10-ANT-11` | panel “Cómo se obtuvo” | RATIFICAR |
| `CAND-10-ANT-12` | detalle separa directos/reportados/derivados | RATIFICAR |
| `CAND-10-ANT-13` | corrección trazable con preview de impacto | RATIFICAR |
| `CAND-10-ANT-14` | recálculo selectivo de dependientes | RATIFICAR |
| `CAND-10-ANT-15` | evolución con comparabilidad explícita | RATIFICAR |

Estos IDs son de diseño UX de trabajo; no son decisiones globales `DEC-*`.

---

# 59. Escenarios adversariales de UX

## ADV-ANT-01 — Dato reportado presentado como medido

**Fallo si:** un formulario de peso aparece luego como “Peso medido”.  
**Respuesta:** mantener procedencia y coexistencia con medición posterior.

## ADV-ANT-02 — Método ejecutable confundido con recomendado

**Fallo si:** “Compatible” activa por defecto la elección.  
**Respuesta:** separar compatibilidad, sugerencia, selección y referencia.

## ADV-ANT-03 — Sugerencia convertida en decisión

**Fallo si:** BE adopta automáticamente el resultado sugerido.  
**Respuesta:** acción profesional explícita.

## ADV-ANT-04 — Cálculo sin versión

**Fallo si:** se muestra resultado derivado que no puede reconstruirse.  
**Respuesta:** no declarar reproducible; bloquear confirmación del derivado conforme al contrato.

## ADV-ANT-05 — Corrección destructiva

**Fallo si:** el nuevo valor reemplaza el original.  
**Respuesta:** corrección aditiva + vista efectiva.

## ADV-ANT-06 — Recálculo indiscriminado

**Fallo si:** corregir una circunferencia recalcula resultados independientes.  
**Respuesta:** recálculo por dependencias afectadas.

## ADV-ANT-07 — Dependencia indeterminable

**Fallo si:** el sistema publica una nueva evolución como completa sin saber qué derivado debía recalcular.  
**Respuesta:** preservar corrección, declarar limitación y no fabricar consistencia.

## ADV-ANT-08 — `SIN_DATO` convertido en cero

**Fallo si:** el gráfico cae a cero ante ausencia.  
**Respuesta:** hueco real.

## ADV-ANT-09 — Cambio de método tratado siempre como ruptura

**Fallo si:** cualquier cambio de versión divide automáticamente la serie.  
**Respuesta:** evaluar compatibilidad según regla versionada.

## ADV-ANT-10 — Serie no comparable unida

**Fallo si:** una incompatibilidad confirmada sigue representada con continuidad homogénea.  
**Respuesta:** ruptura/segmentación explícita.

## ADV-ANT-11 — Importación pierde origen

**Fallo si:** datos externos quedan indistinguibles de captura local.  
**Respuesta:** procedencia preservada y revisable.

## ADV-ANT-12 — Antropometría modifica planes automáticamente

**Fallo si:** un nuevo resultado altera Nutrición/Entrenamiento sin decisión profesional.  
**Respuesta:** solo disponibilizar dato autorizado.

## ADV-ANT-13 — Profesional sin capacidad opera por URL

**Fallo si:** navegar directo habilita escritura.  
**Respuesta:** gate contextual server-side; UX muestra estado no autorizado sin revelar más de lo permitido.

## ADV-ANT-14 — Score/diagnóstico encubierto

**Fallo si:** el resumen agrega “estado corporal”, riesgo o nota global.  
**Respuesta:** retirar semántica agregada no canónica.

---

# 60. Prototipos P0 que B10-07 deja preparados

## `PROTO-10-ANT-01 — Nueva evaluación / captura`

```text
contexto
→ protocolo
→ mediciones agrupadas
→ revisión
→ datos faltantes
```

Debe probar captura rápida desktop/tablet.

## `PROTO-10-ANT-02 — Métodos y comparación`

```text
inputs disponibles
→ métodos compatibles
→ sugerencia transparente, si existe
→ ejecutar A y B
→ comparar
→ adoptar referencia
```

Debe hacer evidente `compatible ≠ sugerido ≠ elegido ≠ adoptado`.

## `PROTO-10-ANT-03 — Corrección`

```text
detalle
→ corregir medición
→ preview de dependencias
→ confirmar
→ ver recálculos nuevos + historia preservada
```

## `PROTO-10-ANT-04 — Evolución`

```text
métrica
→ serie
→ cambio metodológico
→ evaluación de comparabilidad
→ continuidad / comparación limitada / ruptura
```

## `PROTO-10-ANT-05 — Formulario previo`

```text
profesional solicita plantilla
→ asesorado responde
→ dato queda self-reported
→ evaluación lo muestra con procedencia
→ eventual medición directa coexiste
```

## `PROTO-10-ANT-06 — Importación controlada`

```text
fuente externa
→ revisión
→ unidades/procedencia
→ incorporar/rechazar/corregir
→ evaluación conserva origen
```

---

# 61. Criterios futuros para BE-LEG-11A

Una futura suite deberá verificar, como mínimo:

1. `self-reported` nunca aparece como medición directa sin nuevo hecho de medición;
2. protocolo de medición no se confunde con especificación/método de cálculo;
3. medición directa nunca aparece como resultado derivado ni viceversa;
4. unidad original permanece reconstruible tras conversión;
5. método informa versión/especificación aplicable;
6. cálculo conserva inputs, unidades, precisión y procedencia;
7. método con input obligatorio ausente no produce resultado válido;
8. dato disponible pero no admisible no se usa silenciosamente;
9. múltiples métodos no se promedian automáticamente;
10. sugerencia no ejecuta ni adopta automáticamente;
11. adopción de referencia no elimina resultados alternativos;
12. referencia adoptada no modifica automáticamente un plan;
13. corrección preserva original y cadena previa;
14. corrección de metadato sin dependencia no recalcula derivados innecesarios;
15. corrección con dependencias recalcula solo afectados;
16. resultado anterior permanece disponible tras recálculo;
17. dependencia indeterminable no produce historia falsamente completa;
18. `SIN_DATO` nunca se transforma en 0;
19. valor 0 real nunca se transforma automáticamente en ausencia;
20. no hay interpolación, imputación, carry-forward ni punto artificial;
21. cambio de método/protocolo/version/unidad dispara evaluación de compatibilidad;
22. cambio metodológico no implica automáticamente incomparabilidad;
23. serie confirmada como no comparable no se une como continuidad homogénea;
24. comparación parcial comunica su limitación;
25. importación controlada conserva procedencia y valores originales disponibles;
26. dato importado no se presenta como captura local;
27. profesional exclusivamente antropométrico válido puede operar sin especialidad Nutrición/Entrenamiento;
28. profesional sin capacidad/autorización no opera por URL directa;
29. visualización no crea score global, diagnóstico ni causalidad;
30. el asesorado distingue medido/reportado/calculado en su superficie;
31. una evaluación `En preparación / borrador` nunca se presenta como registrada, no alimenta evolución confirmada y solo puede retomarse bajo autorización vigente.

---

# 62. Hallazgos de esta reconstrucción

## `H-10-ANT-01 — Separación terminológica insuficiente en borrador previo`

El borrador previo utilizaba `specification/protocolo` como bloque conjunto. La fuente de dominio distingue el protocolo identificado de la medición directa y la especificación versionada del cálculo derivado.

**Tratamiento:** corregido en §§13–14 sin cambiar la conducta aprobada.

## `H-10-ANT-02 — Regla de comparabilidad insuficientemente explícita en el borrador previo`

El borrador previo ya contemplaba estados de comparabilidad, pero no formulaba con suficiente precisión la regla de dominio según la cual un cambio de protocolo/método/versión/unidad es una **señal para evaluar compatibilidad**, no una sentencia automática de ruptura.

**Tratamiento:** precisión incorporada en §§43–47.

## `H-10-ANT-03 — Importación controlada ampliada y alineada con el dominio`

El borrador previo ya contenía importación controlada. La reconstrucción la amplía para hacer explícitos neutralidad de formato/proveedor, procedencia, revisión, unidades y transformaciones, sin inventar un transporte concreto.

**Tratamiento:** ampliado en §§21–22 y prototipo dedicado; §57 reconoce que `API-ANT-02` ya contempla `CONTROLLED_IMPORT` y deja a auditoría únicamente la suficiencia del flujo previo de preparación/revisión.

## `H-10-ANT-04 — Adenda transversal ya genera deuda verificable`

Métodos/sugerencias/referencia profesional y formularios no deben propagarse silenciosamente hacia 04/05/06/08/09/11A/12.

**Tratamiento:** no se modifican ahora esos legajos; se eleva a Auditoría de Impacto Transversal después de cerrar B10-07.

## `H-10-ANT-05 — API-09 puede ser insuficiente para recursos nuevos`

Las seis operaciones `API-ANT-01…06` cubren el circuito base del borrador contractual. `API-ANT-02` ya contempla `CONTROLLED_IMPORT`; la posible insuficiencia se concentra en persistencia explícita de múltiples ejecuciones, referencia profesional, formularios y eventual flujo previo de preparación/revisión de importación.

**Tratamiento:** no se inventan endpoints; clasificar en la Auditoría de Impacto.

## `H-10-ANT-06 — UC-P19 V04 no estaba materializada en UX`

La contrarrevisión independiente detectó que el 05 aprobado permite guardar una evaluación antropométrica como borrador retomable y deriva su estructura/visibilidad a 06/10.

El B10-07 rehecho distinguía edición previa a registro final, pero no hacía observable el estado `En preparación / borrador`.

**Tratamiento:** corregido en §8.1 y §34.1; criterio 31 agregado a §61. La estructura técnica permanece pendiente de Auditoría de Impacto sobre 06/09.

## `H-10-ANT-07 — RF-050 exige también anulación y la cadena 05/06 no la materializa`

El 04 aprobado exige:

```text
corregir O anular una medición
```

La cadena 05/06 materializa corrección trazable y recálculo, pero no define la semántica de anulación.

**Tratamiento:** B10-07 no inventa una acción de anulación. Se corrige la sobredeclaración de cobertura en §0.1 y se eleva la deuda a Auditoría de Impacto para 05/06/08/09/10/11A/12.

---

# 63. Auditoría de impacto que queda habilitada — pero NO ejecutada en este bloque

Con B10-05, v0.5, B10-06 y B10-07 ya existe suficiente evidencia UX para auditar transversalmente:

| Área conceptual | Pregunta de auditoría |
|---|---|
| Método preestablecido | ¿ya está generalizado fuera de Antropometría o debe abstraerse? |
| Versión/especificación de método | ¿qué documento la posee y cómo se referencia? |
| Ejecución de cálculo | ¿es evento/resultado embebido o recurso explícito? |
| Sugerencia | ¿persistente, efímera, auditable, y con qué procedencia? |
| Referencia profesional adoptada | ¿requiere entidad/estado/evento propio? |
| Inputs admisibles | ¿cómo se tipa measured/self-reported/imported/derived? |
| Plantilla de formulario | ¿requiere RF/UC/dominio/contrato nuevos? |
| Solicitud de formulario | ¿ciclo de vida y autorización? |
| Respuesta de formulario | ¿versionado/corrección/procedencia? |
| Reuso cross-domain | ¿qué acceso y qué procedencia se conservan? |
| Evaluación en preparación | ¿qué estado/entidad/contrato materializa `UC-P19 V04` sin volverla evaluación registrada? |
| Anulación antropométrica (`RF-050`) | ¿cómo se materializa la rama canónica de anulación hoy ausente en 05/06, con qué autorización, historia y efectos sobre derivados/evolución? |
| Importación antropométrica | `API-ANT-02` ya admite `CONTROLLED_IMPORT`; ¿el flujo previo de preparación/revisión requiere aclaración o superficie adicional? |

Documentos a clasificar:

```text
04 — RF
05 — UC
06 — dominio
08 — seguridad/gobierno
07 — solo si aparece impacto arquitectónico real
09 — contratos
10 — UX
11A — pruebas
12 — trazabilidad
```

Clasificación:

```text
ACLARACIÓN
DERIVACIÓN NECESARIA
CAPACIDAD NUEVA
CAMBIO SUSTANTIVO
```

No se abre ninguna corrección sobre esos legajos dentro de B10-07.

---

# 64. Estado de salida

```text
BE-LEG-10: v0.7.1 — BORRADOR UX / NO CANÓNICO

B10-01:
SITEMAP / ACTORES / SHELLS / ROUTING — DESARROLLADO PREVIAMENTE

B10-04:
VÍNCULO / CONSENTIMIENTO / PRIVACIDAD — DESARROLLADO PREVIAMENTE

B10-05:
NUTRICIÓN UX P0 — DESARROLLADO

ADENDA v0.5:
MÉTODOS / CÁLCULOS / SUGERENCIAS / FORMULARIOS — INCORPORADA COMO DECISIÓN UX DE TRABAJO

B10-06:
ENTRENAMIENTO UX P0 — DESARROLLADO

B10-07:
ANTROPOMETRÍA UX P0 — CORREGIDO POST-CONTRARREVISIÓN

ANTROPOMETRÍA:
CAPACIDAD TRANSVERSAL — NO TERCERA ESPECIALIDAD

DIRECTO / REPORTADO / IMPORTADO / DERIVADO:
PROCEDENCIA EXPLÍCITA

PROTOCOLO DE MEDICIÓN:
SEPARADO DE MÉTODO Y ESPECIFICACIÓN DE CÁLCULO

MÉTODOS:
PREESTABLECIDOS / VERSIONADOS / REPRODUCIBLES
COMPATIBILIDAD ≠ SUGERENCIA ≠ ELECCIÓN

CÁLCULO:
MÉTODO + VERSIÓN/ESPECIFICACIÓN + FÓRMULA/REFERENCIA + INPUTS + UNIDADES + PRECISIÓN + PROCEDENCIA

REFERENCIA PROFESIONAL:
EXPLÍCITA — NO BORRA ALTERNATIVAS — NO EQUIVALE A DECISIÓN FINAL

CORRECCIÓN:
NO DESTRUCTIVA

RECALCULO:
SELECTIVO POR DEPENDENCIAS

EVOLUCIÓN:
SIN_DATO ≠ 0
SIN INTERPOLACIÓN / IMPUTACIÓN / CARRY-FORWARD
CAMBIO METODOLÓGICO → EVALUAR COMPATIBILIDAD
NO COMPARABLE → NO CONTINUIDAD HOMOGÉNEA

IMPORTACIÓN:
CONTROLADA / PROCEDENCIA CONSERVADA / FORMATO Y PROVEEDOR NO FIJADOS DESDE UX
API-ANT-02 YA CONTEMPLA CONTROLLED_IMPORT COMO ORIGEN PROVISIONAL

EVALUACIÓN EN PREPARACIÓN:
UC-P19 V04 MATERIALIZADA EN UX
BORRADOR ≠ REGISTRADA
RETOMABLE BAJO AUTORIZACIÓN VIGENTE
NO ALIMENTA EVOLUCIÓN CONFIRMADA

RF-050 / ANULACIÓN:
DEUDA CANÓNICA DETECTADA
04 LA EXIGE
05/06 NO LA MATERIALIZAN
UX NO INVENTA SEMÁNTICA
PASA A AUDITORÍA TRANSVERSAL

VISUALIZACIÓN:
NO DIAGNÓSTICA / NO CAUSAL / SIN SCORE GLOBAL

API-09:
API-ANT-01…06 CONSUMIDAS SOLO COMO INSUMO PROVISIONAL NO CANÓNICO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE PASO DOCUMENTAL:
CONTRASTE CORTO POST-CORRECCIÓN
→ si no quedan hallazgos relevantes, congelar B10-07 como candidato de trabajo
→ AUDITORÍA DE IMPACTO TRANSVERSAL
→ reforzar únicamente documentos realmente afectados
→ luego B10-08/B10-09 dashboard, timeline, coordinación y proyecciones
→ después accesibilidad/copy/responsive y prototipos P0
```

---

# 65. Condición de revisión

Este artefacto queda **APTO PARA CONTRASTE CORTO POST-CORRECCIÓN**, no aprobado ni canonizado.

La contrarrevisión original produjo hallazgos; esta v0.7.1 incorpora únicamente los demostrados y la adjudicación de Dirección/productor:

- `MAJOR-01` aceptado: `UC-P19 V04` / evaluación retomable;
- `MINOR-01` aceptado: precisión de `H-10-ANT-02/03`;
- `MINOR-02` aceptado: `CONTROLLED_IMPORT` ya existe en `API-ANT-02`;
- `MINOR-03` absorbido por el criterio 31;
- `OBSERVATION-01` **reclasificada a MAJOR de trazabilidad**: RF-050 exige anulación y 05/06 no la materializan; no se inventa desde UX, se eleva a Auditoría de Impacto.

El contraste corto debe verificar especialmente:

1. contradicción con `RF-047…050` y `UC-P19/P20/I09/E03/I12`;
2. invasión de 06, 08 o 09;
3. uso de `self-reported` como medición;
4. cálculo no reproducible;
5. elección metodológica implícita;
6. adopción profesional silenciosa;
7. corrección destructiva;
8. recálculo no selectivo;
9. pérdida de procedencia de importación;
10. incomparabilidad automática por cambio metodológico;
11. continuidad falsa de series no comparables;
12. fabricación de datos ausentes;
13. diagnóstico/causalidad/score global;
14. creación accidental de una tercera especialidad;
15. propagación silenciosa de capacidades nuevas hacia legajos anteriores.

**Productor ≠ revisor. El contraste corto debe volver a ser independiente.**

