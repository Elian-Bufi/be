# Guion del teléfono · sustitución de ejercicios (DL-151, #195)

**Nada de esto está hecho.** Es lo que falta probar a mano, en un teléfono Android con una candidata construida desde
esta rama al día con `main`. Hoy no hay candidata: construirla y publicarla necesita autorización de Dirección. La
columna «Hecho» se completa al probar, con la fecha y quién.

**Preparación**
- Una persona sintética propia (nunca Diego ni la cohorte de demostración) con un plan de entrenamiento activo: una
  sesión con dos ejercicios de tres series cada uno, con descanso indicado.
- El profesional, con acceso a esa persona en Entrenamiento, para mirar lo confirmado desde el website.
- Abrir la sesión de hoy en «Entrenamiento» y empezarla (sesión enfocada, registro por serie).

## Lo principal: cambiar el ejercicio después de registrar series

| # | Acción | Resultado esperado | Hecho |
|---|---|---|---|
| T1 | En el primer ejercicio, registrar las series 1 y 2. Después, «Sustituir ejercicio» | Antes de buscar, el diálogo dice el planificado y que la sustitución vale para **todas** las series de este ejercicio en esta sesión, las registradas y las que faltan, y que no se puede cambiar una serie sola. Debajo: «Ya registraste 2 series de este ejercicio: pasan a contar como el que elijas» | |
| T2 | Buscar otro ejercicio y tocar «Confirmar sustitución: …» | Antes de guardar pregunta: «Las 2 series que ya registraste de «(planificado)» pasan a contar como «(elegido)», y las que registres después también. Sus datos no cambian, y lo planificado por tu profesional tampoco.» Nunca dice «solo las próximas series» | |
| T3 | Confirmar | La tarjeta dice «Ejecutado: (elegido) · Sustituido» debajo del planificado. Las series 1 y 2 siguen con su número, su carga y sus repeticiones. Ninguna carga se convierte | |
| T4 | Registrar la serie 3 | Queda en el mismo ejercicio, con el ejecutado. No aparece un ejercicio nuevo ni una serie repetida | |
| T5 | «Sustituir ejercicio» otra vez y «Volver al planificado: …» | Pregunta antes, con las tres series. Al confirmar, las tres vuelven al planificado, tal cual, y la insignia «Sustituido» desaparece | |
| T6 | En el website (el profesional), después de finalizar la sesión con una sustitución | Lo confirmado muestra el planificado y el ejecutado, y el plan no cambió | |

## El resto de las reglas

| # | Acción | Resultado esperado | Hecho |
|---|---|---|---|
| T7 | En el segundo ejercicio, sin series, sustituir y no registrar nada. Tocar «Finalizar» | Antes de confirmar avisa: «Sustituiste «…» por «…», pero no registraste ninguna serie…», con la salida: registrar una o volver al planificado | |
| T8 | En ese mismo ejercicio, «Volver al planificado» | El ejercicio queda como antes de sustituir, y finalizar ya no avisa por él | |
| T9 | Sustituir con un descanso en curso (y otra vez con una serie cronometrada en curso) | El temporizador sigue igual: no se reinicia, no se duplica, y la fila enfocada es la misma | |
| T10 | Con el modo avión, abrir «Sustituir ejercicio» y buscar | Dice que sustituir necesita conexión y que lo registrado sigue guardado en el teléfono. Lo escrito en la búsqueda queda | |
| T11 | Con conexión inestable, confirmar una sustitución y cortar la conexión justo después | Si no hubo respuesta: «No sabemos si la sustitución llegó…». Al volver la conexión, la tarjeta muestra lo que quedó guardado; sin duplicados | |
| T12 | La búsqueda no ofrece el planificado | Ni en otra versión: para volver está su propio botón | |
| T13 | TalkBack en la tarjeta, el diálogo y la pregunta de T2 | Se oyen el planificado, el ejecutado, el alcance y cuántas series pasan | |
| T14 | Con el teclado abierto en la búsqueda | El campo, los resultados y «Volver al planificado» se ven; nada queda tapado | |

## Regresiones que conviene mirar en el mismo teléfono

| # | Acción | Resultado esperado | Hecho |
|---|---|---|---|
| R1 | Una sesión sin sustituciones, de punta a punta | Igual que en la candidata anterior: series, descansos y finalizar | |
| R2 | Cerrar la aplicación a mitad de una sesión con una sustitución y volver a abrirla | La sesión sigue, con la sustitución y las series | |
| R3 | La 0.13.2 (estable) contra la API de esta rama: abrir Entrenamiento y registrar una serie | Funciona como siempre (lo probó la CI con las lecturas congeladas, DL-152) | |
