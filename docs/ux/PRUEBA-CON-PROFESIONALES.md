# Prueba breve con profesionales

Bloque 6 del encargo de consolidación del espacio profesional (2026-10-19). Este documento es un protocolo para hacer la prueba: todavía no se hizo. **Ninguna persona que no participe figura como validación humana**, y este documento no valida nada por sí solo. Los recorridos de navegador (`test/navegador/LEEME.md`) prueban que las pantallas se comportan como se diseñaron. Esta prueba mide si un profesional las entiende y las usa sin ayuda.

## Para qué

- Saber si un profesional real completa cinco tareas del trabajo diario, cuánto duda, en qué se equivoca y cuándo necesita ayuda.
- La meta de la ayuda (las pistas, la ayuda de cada vista y la Guía) es resolver dudas. **Que se use no es una falla:** la falla es una duda que la ayuda no resuelve o una ayuda que no se encuentra.

## Quiénes y cómo

- **Participantes:** de 3 a 5 profesionales que no hayan usado BE, con al menos un nutricionista y un profesional de entrenamiento. Participan por su cuenta y firman un consentimiento para grabar la pantalla y la voz. No hace falta grabar la cara.
- **Formato:** 45 minutos por persona, presencial o por videollamada con pantalla compartida, en una computadora (1366 px o más). La persona piensa en voz alta. Quien facilita lee cada tarea tal cual y no ayuda salvo que se lo pidan. Si la persona lleva 3 minutos trabada, se ofrece la ayuda y se anota.
- **Datos:** cuentas sintéticas del ambiente de prueba, una por participante, preparadas antes (ver «Preparación»). Nunca datos de salud de una persona real.
- **Roles:** una persona facilita y otra observa y anota con la planilla de abajo. Si hay una sola persona, se graba y se anota después.

## Preparación (antes de cada sesión)

Cada participante tiene su cuenta profesional, habilitada en Nutrición y Entrenamiento, con cuatro personas vinculadas:

| Persona | Estado | Para qué tarea |
|---|---|---|
| Nueva | Vinculada hoy, sin evaluación, objetivo ni plan | T2 |
| Con plan | Plan activo de Nutrición hace 3 semanas, con registros de comidas | T3 |
| Con huecos | Plan activo y registros con días sin cargar, un día con solo el almuerzo y una comida diferente | T4 |
| Con revisión | Plan activo con la próxima revisión acordada para dentro de 2 días, registros de las últimas dos semanas y una toma de peso | T1 y T5 |

- Los datos se cargan con la API del ambiente de prueba. Se pueden reutilizar las ayudas de `test/navegador/preparar.mjs`, con una base y un origen **declarados** (nunca la base de otro trabajo).
- Antes de empezar se comprueba que las cuatro fichas se ven como dice la tabla. La sesión se abre en `/pro`.

## Las tareas

Se leen así, sin nombrar pantallas ni botones:

1. **T1 · Encontrar un pendiente.** «Una de tus personas necesita que la mires esta semana. Encontrala y contame qué tenés que hacer y para cuándo.»
   - Éxito: llega a la persona con la revisión cercana desde «Pendientes» o desde la ficha y dice la fecha.
2. **T2 · Crear un primer plan.** «[Nueva] te pidió empezar. Dejale un plan de comidas listo para que lo vea en su teléfono, con al menos un desayuno.»
   - Éxito: plan activo con al menos una comida, una opción y un alimento con cantidad.
   - Se anota si encontró el orden (evaluación, objetivo, plan) sin ayuda.
3. **T3 · Modificar un plan existente.** «A [Con plan] le cuesta el almuerzo: bajale la porción y que lo vea en su teléfono.»
   - Éxito: una versión nueva activa con la cantidad cambiada.
   - Se anota si entendió que se crea una versión nueva y que la anterior queda en la historia.
4. **T4 · Interpretar una comparación con datos incompletos.** «Mirá cómo le fue a [Con huecos] la semana pasada. ¿Comió menos de lo indicado?»
   - Éxito: dice que los datos no alcanzan para afirmarlo. Por ejemplo, que hay días sin registro, que un día tiene una sola comida o que la ausencia no es un cero.
   - Es un error concluir «comió menos» por los huecos.
5. **T5 · Cerrar una revisión.** «Hacé la revisión de [Con revisión] que tenías acordada y dejá fijada la próxima.»
   - Éxito: revisión registrada con al menos una evidencia elegida, una interpretación, una decisión y la fecha de la próxima.

Al terminar cada tarea: «Del 1 al 7, ¿qué tan fácil fue?» (pregunta única de facilidad, SEQ). Al final, tres preguntas abiertas: qué fue lo más confuso, qué te faltó y qué cambiarías primero.

## Qué se mide y cómo se anota

Por tarea:

| Medida | Cómo |
|---|---|
| Finalización | Completa sin ayuda / completa con ayuda / no completa |
| Tiempo | Desde que termina la consigna hasta que dice «listo» o abandona |
| Dudas | Cantidad y cita textual («¿esto ya lo ve la persona?») |
| Errores | Acción que no lleva a la meta: si se dio cuenta y si la corrigió |
| Ayuda | Cuál usó (pista, ayuda de la vista, Guía o quien facilita) y si le resolvió la duda |
| Facilidad | SEQ de 1 a 7 |

Planilla (una fila por participante y tarea):

| Participante | Perfil | Tarea | Finalización | Tiempo | Dudas (citas) | Errores | Ayuda usada / ¿resolvió? | SEQ | Notas |
|---|---|---|---|---|---|---|---|---|---|
| P1 | | T1 | | | | | | | |

## Cómo se informa

- Por tarea: cuántos la completaron sin ayuda, con ayuda y no la completaron; la mediana de tiempo y de SEQ; las dudas repetidas; los errores que se repiten.
- Hallazgos ordenados por gravedad: bloquea la tarea, la demora o la confunde.
- Cada hallazgo lleva una cita o un momento de la grabación y la pantalla en que ocurrió.
- **Con 3 a 5 personas, los números describen lo que pasó:** no son porcentajes generalizables. Se informa «2 de 4», no «50 %».
- Lo que no se probó se dice. Ejemplos: la APK, un lector de pantalla o profesionales de antropometría.

## Pruebas del teléfono que siguen pendientes (candidata 0.17.0-3)

Estas pruebas requieren el teléfono y **no se dan por hechas porque el build pasó**. Las mejoras del website pueden avanzar mientras tanto.

- [ ] Aceptación del vínculo con las dos decisiones del consentimiento: aceptar y no aceptar los datos de salud.
- [ ] Regreso por «Completar» cuando falta un paso del acceso.
- [ ] Acceso efectivo: lo que el profesional ve después de aceptar.
- [ ] Días de entrenamiento: la agenda y la sesión del día.
- [ ] Avisos (notificaciones push).
