# Prueba breve · hoja de quien observa (respuestas esperadas)

**No se la muestres a quien prueba antes de terminar.** El guion para quien prueba es `GUION.md`.

Cada fila dice lo que debería verse según el diseño (DL-151, DL-155 a DL-158) y lo que ya comprobó la preparación
automática. La columna «Visto» la completa quien observa. Que alguien no lo entienda sin ayuda **es un resultado**, no un
error de quien prueba: se anota tal cual.

**Fechas.** Los días de abajo se cuentan desde el día de la carga de la historia de Nutrición (26/10, hora de Buenos
Aires). Si la prueba es otro día, el período de «Analizar» es el mismo: del 18/10 al día de la prueba.

**Valores preliminares.** Todavía no se cargó la historia: los números de abajo salen de la composición del catálogo base (la de la migración, la misma que usa la cohorte) y se confirman con la instantánea del plan al cargarla.

## Quiénes son (cuentas «Prueba», sintéticas, de test)

| Cuenta | Para qué está | Estado |
|---|---|---|
| Lic. Prueba Dos Áreas | El profesional descartable: Nutrición y Entrenamiento, el único que se puede suspender | Verificado y habilitado en las dos áreas (`BE_DEMO_PROFESIONALES`, #215) |
| Prueba Uno | El teléfono: la sesión para sustituir un ejercicio | Vínculo de Entrenamiento con autorización; plan por serie activado con «Sesión de prueba» |
| Prueba Dos | Nutrición con indicado del día: una sola opción por comida | Vínculo y autorización desde el 17/10; objetivo y plan desde el 18/10; comidas del 19/10 al 25/10 |
| Prueba Tres | Nutrición con alternativas: sin indicado del día | Igual que Dos, con alternativas en desayuno, almuerzo y cena |
| Prueba Cuatro | Rehabilitar no devuelve una autorización revocada | Vínculo de Nutrición aceptado; la persona **revocó la autorización** |
| Prueba Cinco | Rehabilitar no devuelve un vínculo finalizado | La persona **finalizó el vínculo** de Nutrición |

## Parte A · Administración

| # | Qué debería verse | Visto |
|---|---|---|
| A2 | **Nutrición:** Verificación «Verificada» · Habilitación «Concedida» · «Puede operar» · «Puede operar Nutrición en BE.» · «3 personas vinculadas.» Son Dos, Tres y Cuatro: Cuatro cuenta aunque revocó la autorización, porque el vínculo sigue aceptado; Cinco no, porque lo finalizó. **Entrenamiento:** lo mismo, con «1 persona vinculada.» (Uno). De las personas se ve solo cuántas son, nunca quiénes | |
| A3 | Título «Suspender · Nutrición de Lic. Prueba Dos Áreas». **Qué cambia:** «Deja de poder operar Nutrición en BE desde su próxima acción, aunque tenga la sesión abierta.» **Qué sigue igual:** sus planes, registros y borradores se conservan; las otras áreas no cambian; la habilitación queda como está. **A quién se avisa:** al profesional, con una novedad que no lleva el fundamento interno, y a «las 3 personas vinculadas en Nutrición», con el efecto y sin los motivos. El botón dice «Suspender Nutrición» y no es la opción por defecto | |
| A4 | Nutrición «Suspendida» · «No puede operar Nutrición: la verificación está suspendida.» Arriba, «Se avisó al profesional y a 3 personas vinculadas.» En el historial, «Área suspendida», «De «Verificada» a «Suspendida».», con el fundamento interno y el texto comunicado. Entrenamiento sigue «Puede operar» | |
| A5 | **La sesión del profesional sigue abierta** (DL-157): no lo echa. **Prueba Dos**, en Nutrición, no muestra datos: la ficha dice que por ahora no hay acceso, sin dar el motivo. **Prueba Uno**, en Entrenamiento, se ve como antes. **Novedades:** «Nutrición: acceso suspendido», con «Administración te escribió: «…»» (el texto para el profesional, no el fundamento) y «tus planes, registros y borradores se conservan, y las otras áreas no cambian» | |
| A6 | Título «Rehabilitar · Nutrición de Lic. Prueba Dos Áreas». **Qué cambia:** «La verificación de Nutrición vuelve a verificada.» y «Vuelve a poder operar Nutrición: el acceso a cada persona depende otra vez de su vínculo y su autorización.» **Qué sigue igual:** «No se reactivan vínculos finalizados ni autorizaciones revocadas.», «La suspensión queda en el historial.» y las otras áreas | |
| A7 | **Prueba Dos** vuelve a mostrar todo, igual que antes: nada se perdió. **Prueba Cuatro** sigue sin acceso, porque revocó la autorización. **Prueba Cinco** sigue fuera, porque finalizó el vínculo: si aparece, es con la referencia neutral («Asesorado · …»), sin su nombre. Novedad «Nutrición: verificación rehabilitada» | |

## Parte B · Nutrición (Calorías, del 18/10 al 26/10)

**Prueba Dos.** Los valores esperados se calcularon aparte, sin las funciones del producto (`herramientas/esperado.mjs`).

| Día | Objetivo del profesional | Indicado en el plan | Registrado |
|---|---|---|---|
| 18/10 | 1.800 kcal | 1.572 kcal | — (ese día empezó el plan; sin registros) |
| 19/10 | 1.800 kcal | 1.572 kcal | 1.730 kcal |
| 20/10 | 1.800 kcal | 1.572 kcal | 1.418 kcal |
| 21/10 | 1.800 kcal | 1.572 kcal | 1.745 kcal |
| 22/10 | 1.800 kcal | 1.572 kcal | — **hueco**: no se registró nada |
| 23/10 | 1.800 kcal | 1.572 kcal | 1.435 kcal |
| 24/10 | 1.800 kcal | 1.572 kcal | 1.032 kcal, **subtotal**: el almuerzo se registró sin cantidades |
| 25/10 | 1.800 kcal | 1.572 kcal | 1.590 kcal |
| 26/10 | 1.800 kcal | 1.572 kcal | — (hoy: todavía sin registros) |

| # | Qué debería verse | Visto |
|---|---|---|
| B2 | Tres capas con nombre propio en la leyenda: **Registrado** (línea continua con puntos), **Objetivo del profesional** (línea discontinua, 1.800 kcal desde el 18/10) e **Indicado en el plan** (rombos huecos, uno por día, 1.572 kcal). Se espera que quien prueba diga, con sus palabras: «lo que fijó el profesional», «lo que decía el plan ese día» y «lo que la persona anotó» | |
| B3 | El **22/10** no tiene punto registrado y la línea no lo une: es un hueco, no un cero. Ese día igual tiene rombo, porque el plan indicaba lo mismo. El **24/10** tiene un punto hueco (subtotal): el almuerzo se registró sin cantidades. El 18/10 (el día en que empezó el plan) y hoy tampoco tienen registros | |
| B4 | El 24/10, en «Ver origen de Calorías», cada comida trae lo registrado y lo indicado de su opción. Desayuno: registrado 363 kcal (comió lo del plan) · indicado 363 kcal. **Almuerzo: registrado sin cantidades (no da número); indicado 558 kcal**. Merienda: registrado 176 kcal (comió lo del plan) · indicado 176 kcal. Cena: registrado 493 kcal (cantidades informadas) · indicado 475 kcal | |
| B5 | **Prueba Tres:** no hay rombos. Debajo del gráfico dice por qué: «Sin indicado del día: Desayuno tiene 2 opciones; Almuerzo tiene 3 opciones; Cena tiene 2 opciones. BE no elige entre ellas ni las suma.» Lo indicado está por comida, en «Ver origen»: la opción elegida, con su indicado. El 23/10, la cena es «Comida diferente: no es una opción del plan y no tiene indicado.», y el día es un subtotal. Objetivo: 1.900 kcal | |
| B6 | No aparece «cumplimiento», «adherencia», ningún porcentaje ni colores de bien o mal. Al pie: «Que los valores se acerquen o se alejen no indica que una cosa cause la otra.» | |

**Prueba Tres, registrado por día:** 20/10 1.572 kcal · 21/10 1.288 kcal · 22/10 1.411 kcal · 23/10 1.097 kcal (subtotal: la cena fue una comida diferente) · 24/10 1.396 kcal · 25/10 1.381 kcal. Objetivo: 1.900 kcal. El 22/10 no es un hueco en Tres: registró todo.

## Parte C · Teléfono

Son T1 a T5 del guion del teléfono, más la instalación y lo guardado.

| # | Qué debería verse | Visto |
|---|---|---|
| C1 | Se instala **como actualización**: el paquete y el certificado son los mismos (61569691…893e06) y el versionCode sube a 30. Si había una sesión abierta, sigue | |
| C2 | La bienvenida dice «app 0.18.0-candidata.1 · test · commit b64d0c4» | |
| C3 | «Sesión de prueba»: el primer ejercicio (3 × 10, 40 kg, descanso 90 s) y el segundo ejercicio (3 × 8, 50 kg, descanso 120 s) | |
| C4 (T1) | Antes de buscar, el diálogo nombra el planificado y dice que la sustitución vale para **todas** las series de este ejercicio en esta sesión, las registradas y las que faltan, y que no se puede cambiar una serie sola. Abajo: «Ya registraste 2 series de este ejercicio: pasan a contar como el que elijas» | |
| C5 (T2, T3) | Antes de guardar pregunta: «Las 2 series que ya registraste de «el primer ejercicio» pasan a contar como «(el elegido)», y las que registres después también. Sus datos no cambian, y lo planificado por tu profesional tampoco.» Al confirmar, la tarjeta dice «Ejecutado: (el elegido) · Sustituido» debajo del planificado, y las series 1 y 2 conservan su número, su carga y sus repeticiones. La búsqueda no ofrece el planificado (T12) | |
| C6 (T4) | La serie 3 queda en el mismo ejercicio, con el ejecutado. No aparece un ejercicio nuevo ni una serie repetida | |
| C7 (T5) | Pregunta antes, con las tres series. Al confirmar, las tres vuelven al planificado tal cual y la insignia «Sustituido» desaparece | |
| C8 | En el historial, la sesión tiene el primer ejercicio con 3 series y el segundo ejercicio con 3, sin sustitución: es lo último que quedó | |
| C9 (T6) | En el website, lo confirmado muestra lo mismo, y el plan de Prueba Uno no cambió | |

## Qué ya se comprobó sin personas

_Se completa al terminar la preparación._
