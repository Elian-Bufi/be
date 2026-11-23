# 18 · Gantt

*El cronograma de BE, de la idea a la mesa examinadora: etapas, tareas, fechas, duraciones, dependencias e hitos.*

> Primero entender, después construir: el código empezó cuando la especificación estaba cerrada.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** Noviembre de 2026

> **Resumen.** Ocho etapas, de junio a diciembre de 2026. Primero la especificación completa; después el núcleo, en diez días; dos vueltas de ampliación, una de consolidación, el cierre y la defensa.

**Entregable:** 18 · Gantt
**Fecha:** Noviembre de 2026
**Lo acompaña:** El .docx editable con el mismo contenido.

# Resumen

*Cómo se ordenó el trabajo en el tiempo y qué habilitó cada etapa.*

El proyecto se planificó en ocho etapas. La especificación completa se escribió antes de programar: la visión y el alcance, el modelo de negocio, los requisitos, los casos de uso, el modelo de dominio, la arquitectura, la seguridad, los contratos de la API y el plan de pruebas. Con eso cerrado, el núcleo (cuentas, vínculos, permisos y las tres áreas) se construyó en diez días, porque cada parte ya tenía definidos sus requisitos, sus operaciones y sus pruebas. Después vinieron dos vueltas de ampliación, una de consolidación con la prueba en el teléfono, el cierre con los gráficos comparativos y la entrega al tutor, y la defensa.

- **8** etapas: De junio a diciembre de 2026.
- **2 meses** de especificación: Antes de la primera línea de código.
- **10 días** para el núcleo: Del 16 al 25 de septiembre.
- **25/11** entrega al tutor: Antes de la mesa examinadora.

![Figura 1: Los hitos del proyecto](pendiente)

> **Texto de la figura:**
> - 18/9
> - Primera app
> - La app, publicada para instalar en el teléfono.
> - 25/9
> - El ciclo completo
> - Del plan a la revisión, funcionando en la nube.
> - 20/10
> - Primera versión de la tesis
> - El primer documento completo.
> - 25/10
> - Administración
> - La habilitación de profesionales por área, con segundo factor.
> - 6/11
> - Presentación al tutor
> - El sistema, de punta a punta.
> - 25/11
> - Entrega al tutor
> - Los entregables y el documento de tesis.
> - 9–22/12
> - Mesa examinadora
> - La fecha exacta la fija la escuela.

# 1. El diagrama de Gantt

*Cada barra es una tarea, agrupada por etapa; la barra oscura es la duración de la etapa y los rombos, sus hitos.*

Tres decisiones ordenan el cronograma:

- **01 · Especificar primero.** Dos meses para la especificación completa y ninguna línea de código. Por eso el núcleo entró en diez días: cada parte tenía sus requisitos, sus operaciones y sus pruebas.

- **02 · El ciclo completo, temprano.** Antes de ampliar, el ciclo entero (del plan a la revisión) funcionando en la nube. Cada ampliación se sumó sobre algo que ya andaba de punta a punta.

- **03 · Probar en todas las etapas.** Cada cambio entra con sus pruebas automáticas y la verificación en verde, y la prueba en el teléfono ordena la vuelta siguiente.

*Figura 2: Las tres decisiones que ordenan el cronograma.*

![Figura 3: El diagrama de Gantt de BE, de junio a diciembre de 2026, por semanas. Responsable de todas las tareas: Elián Gastón Bufi](pendiente)

# 2. Las tareas

*Cada tarea con su inicio, su fin, su duración, de qué depende y qué la da por terminada.*

**Tabla 1.** Las tareas del cronograma. Las duraciones son en días corridos.

| Etapa | Tarea | Inicio | Fin | Días | Depende de | La da por terminada |
| --- | --- | --- | --- | --- | --- | --- |
| 1 · Idea | Propuesta y prototipo | 11/6 | 17/7 | 37 | — | La propuesta presentada en el Seminario de Sistemas y un prototipo |
| 2 · Especificación | Visión, alcance, negocio, requisitos, casos de uso, dominio, arquitectura, seguridad, contratos de la API y plan de pruebas | 18/7 | 15/9 | 60 | Idea | Los documentos de la especificación, cerrados y versionados |
| 3 · Núcleo | Identidad, cuenta y acceso | 16/9 | 19/9 | 4 | Especificación | Crear la cuenta, entrar y salir, en la app y en el website |
| 3 · Núcleo | Vínculo, consentimiento y permisos | 19/9 | 20/9 | 2 | Identidad | La persona acepta el vínculo y autoriza cada área |
| 3 · Núcleo | Nutrición, Entrenamiento y Antropometría | 19/9 | 22/9 | 4 | Vínculo | Un plan activado como versión, lo registrado aparte y las tomas con su método |
| 3 · Núcleo | Pedidos de información y hábitos | 21/9 | 22/9 | 2 | Vínculo | El profesional pide información y la persona responde desde la app |
| 3 · Núcleo | Seguimiento profesional | 22/9 | 25/9 | 4 | Las tres áreas | El ciclo completo, de la evaluación a la revisión, funcionando en la nube |
| 4 · Ampliación | Escritorio del profesional por áreas | 26/9 | 21/10 | 26 | Núcleo | La cartera, la ficha, la línea de tiempo y «Analizar» en el website |
| 4 · Ampliación | Recetas, entrenamiento por serie, agenda y acceso con Google | 26/9 | 21/10 | 26 | Núcleo | Cada función, con sus pruebas y en la app publicada |
| 5 · Consolidación | Administración y segundo factor | 22/10 | 25/10 | 4 | Escritorio | La habilitación de profesionales por área, con fundamento |
| 5 · Consolidación | Prueba en el teléfono | 26/10 | 30/10 | 5 | Administración | El recorrido completo probado en un teléfono, con sus hallazgos |
| 6 · Segunda vuelta | Formularios de inicio y coordinación entre áreas | 2/11 | 7/11 | 6 | Prueba en el teléfono | El resumen y el plan vigente de otras áreas, con el permiso de la persona |
| 6 · Segunda vuelta | Editores, fuerza estimada y acceso | 8/11 | 13/11 | 6 | Formularios | Los editores que se guardan solos, el 1RM estimado y el segundo factor del profesional |
| 7 · Cierre | Pulido de la app y del website | 14/11 | 18/11 | 5 | Segunda vuelta | Las tandas del pulido, con su revisión |
| 7 · Cierre | Gráficos comparativos | 14/11 | 22/11 | 9 | Segunda vuelta | Las comparativas en el tiempo, por área y entre áreas |
| 7 · Cierre | Historia anterior | 17/11 | 22/11 | 6 | Gráficos comparativos | El profesional nuevo ve la historia anterior, con la autorización de la persona |
| 7 · Cierre | Pruebas finales, manuales y video | 20/11 | 25/11 | 6 | Gráficos e historia anterior | La medición de los casos de prueba, los manuales con capturas reales y el video |
| 8 · Defensa | Correcciones del tutor | 26/11 | 8/12 | 13 | Entrega al tutor | La devolución del tutor, atendida |
| 8 · Defensa | Ensayo de la defensa | 1/12 | 8/12 | 8 | Correcciones | La presentación y la demostración, ensayadas |
| 8 · Defensa | Mesa examinadora | 9/12 | 22/12 | — | Correcciones | La defensa ante el tribunal (fecha que fija la escuela) |
