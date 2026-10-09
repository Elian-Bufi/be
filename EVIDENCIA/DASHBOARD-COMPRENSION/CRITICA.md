# Crítica de producto y propuestas (encargo §14)

Escrita después de usar la ficha con los escenarios D y E como lo haría un profesional que prepara una consulta. Es mi
opinión de responsable de producto, no una aprobación: lo que sigue necesita la mirada de Dirección.

## 1 · Lo que mejoré por mi cuenta, dentro del alcance

Detectado al recorrer las pantallas; cada uno está en el código, en la guía de UX y, cuando corresponde, con su prueba.

| Mejora | Por qué |
|---|---|
| **Un mismo plan, un mismo número** en la ficha, las etapas, la línea de tiempo y la pestaña Plan (D-20) | La API numeraba con el token de concurrencia: un plan activado sin cambios era «v2» en la ficha y «Versión 1» en la pestaña Plan. Era un defecto de la base. |
| **El primer pantallazo** con la tabla de objetivo y planificación y la primera observación (D-14) | Con tres columnas angostas, la síntesis quedaba debajo del pliegue. Se cambió la composición, no la letra. |
| **El contraste de nutrición en una tabla con filtros de hechos** (D-16; corregido en la pasada del 2026-10-09, D-30) | 50 tarjetas ocupaban 5.500 px. El primer filtro, «que no registraron las porciones del plan», mezclaba el modo de registro con una diferencia (unas cantidades a mano pueden coincidir con el plan): la revisión de Dirección lo marcó, y ahora el modo y la diferencia comprobada van en columnas y filtros separados. |
| **La cobertura dice desde cuándo hubo plan** (D-15) | «1 de 90 días» de un plan activado hoy se leía como 89 días sin registrar. |
| **Lo que falla en la síntesis va primero** y **un solo «Reintentar» trae todo** | Escondido detrás de «Ver todas», un faltante parecía «nada pendiente»; con dos «Reintentar», uno no traía los gráficos. |
| **El conflicto al guardar los indicadores conserva la elección** (D-22) | El aviso prometía «se volvieron a leer» sin hacerlo y cada intento chocaba otra vez. |
| **«Volver a la ficha» desde el origen de un dato y desde el Resumen inicial** (D-19) | Ir al registro completo hacía perder el análisis armado. |
| **El acercamiento se suelta al cambiar de análisis** | Sobrevivía sin estar en la URL: el IMC aparecía sin puntos. |
| Detalles: «1 registro», marcas enteras en ejes de repeticiones y RIR, la unidad una vez en el título, «Agregar una métrica» plegado cuando ya hay tres, qué es un subtotal dicho en el lugar, parámetros de versión solo UUID | Cada uno confundía o dejaba pasar algo que no debía. |

## 2 · Oportunidades para una fase siguiente, por valor

### 1. La cartera de asesorados no dice a quién mirar primero

- **Observado:** la síntesis existe por asesorado, pero la cartera (`/pro`) no muestra nada de ella. Para saber quién
  tiene una revisión sin aplicar o una próxima revisión en tres días hay que abrir cada ficha.
- **Beneficia a:** el profesional con varios asesorados, al empezar el día.
- **Propuesta:** en la cartera, por asesorado y sin calificar, los pendientes explícitos de prioridad 1 (revisión sin
  aplicar, próxima revisión acordada, borrador sin activar) y la fecha del último registro. Las mismas reglas del dominio
  (`sintesisDelResumen`), no otras.
- **Necesita:** una lectura agregada por cartera (hoy serían N lecturas de DSH-03), con el PDP por vínculo; nada nuevo en
  el legajo de datos.
- **Esfuerzo:** medio (una lectura nueva con su contrato y TEST-CT; la web reutiliza la síntesis). **Riesgo:** que se lea
  como un ranking; se evita ordenando por fecha y sin colores de urgencia.
- **Cómo se comprueba:** tiempo hasta abrir la ficha de quien tiene la revisión más próxima, con y sin la columna.

### 2. Registrar una revisión obliga a tildar decenas de evidencias

> **Hecho en la pasada del 2026-10-09 (D-29), a pedido de Dirección:** la evidencia se marca agrupada por día y por
> tipo, con una casilla explícita por día y otra por el período, lo marcado a la vista («Marcaste 12 de 73…», «Lo que
> marcaste» con «Quitar») y nada marcado al abrir. No se hicieron las selecciones preparadas por BE que proponía esta
> ficha («Marcar lo nuevo desde la revisión anterior»): el pedido fue selección explícita por grupo, y marcar no es
> examinar. Queda como posibilidad, si Dirección la quiere.

- **Observado:** «Preparar la revisión» abre bien el período, pero «Evidencia que examinaste» lista 70 casillas, una por
  comida (se ve al seguir «Preparar la revisión de Nutrición» en la guía de demostración).
- **Beneficia a:** cada revisión registrada.
- **Propuesta:** agrupar la evidencia por día y por tipo, con «Marcar lo nuevo desde la revisión anterior» y «Marcar las
  que no registraron las porciones del plan» como selecciones visibles y editables, dichas como preparadas por BE.
- **Necesita:** nada de API (la lista ya está); reglas del dominio que ya existen (novedades, calidad).
- **Esfuerzo:** bajo a medio. **Riesgo:** que se lea como una evidencia elegida por BE; por eso queda sin marcar hasta que
  el profesional lo pide.
- **Cómo se comprueba:** clics y tiempo para registrar una revisión con evidencia completa.

### 3. «Se activó otra versión del plan»: falta ver qué cambió

- **Observado:** la etapa abre la planificación completa de cada versión, pero no la diferencia entre las dos.
- **Beneficia a:** comparar etapas y preparar la revisión de un plan.
- **Propuesta:** «Qué cambió entre la versión 1 y la 2»: opciones, porciones y prescripciones agregadas, quitadas o
  cambiadas, desde las instantáneas inmutables.
- **Necesita:** una función de diferencia en el dominio sobre las instantáneas que la API ya sirve; sin contrato nuevo.
- **Esfuerzo:** medio. **Riesgo:** bajo, si dice «distinto» y no «mejor».
- **Cómo se comprueba:** encontrar qué cambió en el desayuno entre dos versiones, con y sin la vista.

### 4. Pedir contexto sobre un registro concreto

- **Observado:** desde una comida «sin confirmar», «Solicitar contexto» abre el catálogo de formularios en blanco: el
  profesional tiene que escribir de qué comida habla.
- **Propuesta:** «Preguntar por este registro» que lleve la cita del registro (como las citas de entrenamiento, DL-102),
  sin texto clínico en la URL.
- **Necesita:** citas de registros de comida en API-FRM-03 (hoy existen para entrenamiento): contrato y legajo.
- **Esfuerzo:** medio. **Riesgo:** de privacidad bajo (la cita es un identificador), pero exige decisión de Dirección.

### 5. Una relación entre áreas que el profesional calcula a mano: proteínas por kilo de peso

- **Observado:** se ven proteínas y peso en paneles sincronizados, pero «g de proteína por kg» se calcula de cabeza.
- **Propuesta:** una métrica derivada con su definición (como DL-126): proteínas registradas del día ÷ el peso
  comparable más cercano, con la regla de cuál se usa y su cobertura.
- **Necesita:** una derivación aprobada (fórmula y comparabilidad) y su ficha. **Riesgo:** alto si se presenta como
  «adecuado»; es una métrica descriptiva y así se dice.

### 6. La línea de tiempo filtrada a lo nuevo es una lista larga

- **Observado:** 70 hechos nuevos desde la revisión de Nutrición, todos en la misma lista.
- **Propuesta:** dentro del filtro, tres grupos con su cuenta y su ancla: «ocurrió después», «se cargó después» y «se
  corrigió después» (la misma clasificación del dominio).
- **Necesita:** nada de API (`sinceCounts` ya separa). **Esfuerzo:** bajo.

### 7. Indicadores por asesorado

- **Observado:** los indicadores elegidos «valen para todos tus asesorados»; un asesorado de fuerza y otro de nutrición
  necesitan otros.
- **Propuesta:** una elección por asesorado que pisa la general, dicha en pantalla.
- **Necesita:** extender API-VAN (uso por asesorado). **Esfuerzo:** medio.

### 8. Analizar sigue siendo largo con una pregunta en curso

> **Hecho en parte en la pasada del 2026-10-09 (D-31), solo para la pregunta de etapas:** la comparación a mano quedó
> plegada debajo de la tabla A/B, el resumen en texto plegado, sin la lista de etapas repetida y con cada límite una
> vez. Con las demás preguntas, lo de abajo sigue igual: la pasada no se amplió.

- **Observado:** con una pregunta, la columna izquierda despliega «Cómo se leen», «Agrupar por» y «Capas» completos, y
  debajo de los gráficos siguen «Comparar dos períodos», la tabla y el resumen en texto.
- **Propuesta:** con una pregunta en curso, plegar «Capas» y «Comparar dos períodos» (que con las etapas pierde sentido),
  y dejar «Agrupar por» como la única opción abierta.
- **Necesita:** nada. **Esfuerzo:** bajo. **Riesgo:** esconder algo que alguien usa; se mide antes.

## 3 · Ideas que descarto

- **Un resumen con IA o una «conclusión» automática:** el encargo lo excluye y, con estos datos, sería una interpretación
  clínica sin autor.
- **Un porcentaje de cumplimiento o semáforos:** mezcla comidas sin confirmar con confirmadas y califica.
- **Recordatorios o sondeos para avisar cambios de acceso:** el evento al volver a la pestaña alcanza; un sondeo
  permanente cuesta y no agrega seguridad (la API decide en cada lectura).
- **Unir Nutrición y Entrenamiento en una «etapa clínica» común:** el encargo lo excluye; las etapas son de cada plan.

## 4 · Respuestas a las preguntas del encargo

- **¿Qué sigue obligando a recordar o reunir a mano?** Qué cambió entre dos versiones del plan (3) y a quién mirar
  primero en la cartera (1).
- **¿Qué se entiende técnicamente pero resulta incómodo?** Marcar la evidencia de una revisión (2, resuelto en la pasada
  del 2026-10-09) y la longitud de Analizar con una pregunta en curso (8, resuelto solo para las etapas).
- **¿Qué relación entre áreas todavía no se puede explorar?** Proteínas por kilo de peso (5) y el volumen de entrenamiento
  junto a medidas que no sean el peso (hoy se puede superponer en paneles, no relacionar).
- **¿Qué dato faltante justificaría pedirlo?** Las cantidades de las comidas «sin confirmar»: con la cita del registro (4),
  la pregunta es concreta y la respuesta completa el dato que ya existe, sin un dato sensible nuevo.
- **¿Qué simplificaría o retiraría?** «Comparar dos períodos» cuando hay etapas (8) y los textos de ayuda repetidos.
- **¿Qué debería mejorar en la cartera?** Los pendientes explícitos por asesorado (1), sin rediseñarla.
