# Guion de verificación manual · encargo del 2026-10-23

**Nada de esto está hecho.** Es lo que falta comprobar a mano. La columna «Hecho» se completa al hacerlo, con la fecha y quién.

> **Al 2026-10-24, a la noche:** sigue todo sin hacer.
> - En `test` ya están #201, #202, #206, #207 y #198, en `2811991`.
> - Lo que este guion prueba de #195, #200 y #203 sigue esperando que se integren.
> - W15 se puede hacer hoy en `test`.
> - El teléfono necesita una candidata nueva, que requiere autorización.

**Dónde:**
- **El website:** la versión integrada en `test` cuando Dirección la integre. Antes, con la API y el website locales de la rama `wp-integracion-2026-10-23`.
- **El teléfono:** una candidata nueva construida desde esa misma rama. Hoy no existe.
- **Con quién:** una persona sintética propia. **No con Diego ni con la cohorte**, que son escenarios de demostración.

## Website (el profesional)

**Preparación:**
- Un plan de Nutrición activo, con cuatro comidas.
- La persona registra desde el teléfono las cuatro comidas un día y tres al día siguiente (falta la cena).

| # | Acción | Resultado esperado | Hecho |
|---|---|---|---|
| W1 | Abrir la ficha, Resumen, indicador «Calorías registradas» | Dice «1 subtotal · 1 comida del plan sin registro». En ninguna parte dice «sin faltantes» | |
| W2 | Abrir el indicador (lleva a Analizar) y elegir el día de las tres comidas | «Subtotal de lo registrado · …», «Comidas del plan: 3 de 4 registradas · 1 sin registro», «Sin registro: Cena» | |
| W3 | Elegir el día de las cuatro comidas | «Cada comida del plan registrada, con cantidades» | |
| W4 | Exportar el CSV de Analizar y abrirlo en una planilla | La columna «Comidas del plan»; «subtotal» en el día de las tres. Ninguna celda dice «sin faltantes» y ninguna fila se corre de columna | |
| W5 | Nutrición, Registros, el mismo día | «3 de 4 comidas registradas · 1 sin registro»: lo mismo que Analizar | |
| W6 | Nutrición, Revisiones, «Nueva revisión»: marcar dos comidas del primer día y la versión del plan, y registrar | En la lista: «Nutrición · período revisado: … · registró: (tu nombre)» y «Evidencia seleccionada: 2 comidas · 1 versión del plan» | |
| W7 | «Ver la evidencia» | Solo las dos comidas marcadas y el plan, aunque el período tenga más comidas. Cada una con su fecha y su nombre | |
| W8 | «Abrir» en una comida; después, Escape | Se abre el panel con el registro. Escape lo cierra, el foco vuelve a «Abrir» y la lista sigue abierta | |
| W9 | En el teléfono, la persona deshace una de las dos comidas. En el website, «Actualizar» y «Ver la evidencia» | La comida sigue en la lista, con «Se deshizo después de esta revisión (fecha y hora): quedó fuera de los totales» | |
| W10 | Recargar la página | La revisión y su evidencia siguen ahí | |
| W11 | Repetir W7 y W8 solo con el teclado (Tab, Enter, Escape) | Todo se alcanza y el foco se ve siempre | |
| W12 | Repetir W7 en el tema Claro y en Azul noche | La lista se lee en los dos, con buen contraste | |
| W13 | La persona retira el consentimiento de Nutrición desde el teléfono. En el website, «Actualizar» | «Acceso no disponible»: no aparece ninguna comida ni ningún detalle de la evidencia | |
| W14 | Entrenamiento: una revisión con una sesión; la persona corrige la sesión; «Ver la evidencia» | La sesión, con «Se corrigió después de esta revisión (…)» | |
| W15 | En `test`, con Chrome, Edge y Firefox: entrar a la ficha y recargar (DL-147) | Sigue en la ficha, con la vista y el período. Safari pide entrar de nuevo, y es lo esperado | |

## Teléfono (la persona)

**Preparación:**
- Una candidata nueva desde la integración, instalada sobre la que haya.
- Un plan de entrenamiento con un ejercicio de tres series.

| # | Acción | Resultado esperado | Hecho |
|---|---|---|---|
| T1 | Sesión enfocada, «Sustituir ejercicio», sin series registradas | La ayuda dice que vale para todas las series de ese ejercicio en la sesión y que no se puede cambiar una serie sola. Se busca y se elige con «Confirmar sustitución: …» | |
| T2 | Registrar una serie | La tarjeta dice «Ejecutado: (el elegido) · Sustituido» debajo del planificado, y la serie queda con el elegido | |
| T3 | Con dos series registradas, sustituir por otro | Antes de guardar pregunta: «Las 2 series que ya registraste … pasan a contar como …, y las que registres después también» | |
| T4 | «Volver al planificado», con series y sin series | Con series, las devuelve al planificado tal cual. Sin series, el ejercicio vuelve a estar como antes | |
| T5 | Sustituir con un descanso o una serie cronometrada en curso | El temporizador sigue igual: no se reinicia ni se duplica | |
| T6 | Sin conexión, intentar sustituir | Dice que necesita conexión. Lo registrado no se pierde | |
| T7 | Finalizar con un ejercicio sustituido sin series | Avisa antes de confirmar, con la salida: registrar una serie o volver al planificado | |
| T8 | TalkBack en la tarjeta y en el diálogo | Se oyen el planificado, el ejecutado y el alcance | |
| T9 | Con el teclado en pantalla abierto en la búsqueda | El campo y los resultados se ven; nada queda tapado | |
| T10 | En un teléfono con la **0.13.2** (la estable) contra la API integrada: abrir «Hoy», registrar una comida, abrir «Tu historial» | Todo funciona: lo probó la CI con lo congelado (DL-152), y el teléfono lo confirma | |
| T11 | «Tus revisiones» en la candidata | La revisión de W6 se lee completa. Su forma no cambió | |
| T12 | Aviso de una revisión nueva, con Firebase configurado | Llega el aviso y abre la revisión | |
