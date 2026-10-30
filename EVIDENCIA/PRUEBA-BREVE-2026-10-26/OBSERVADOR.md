# Prueba breve · hoja de quien observa (respuestas esperadas)

**No se la muestres a quien prueba antes de terminar.** El guion para quien prueba es `GUION.md`.

Cada fila dice lo que debería verse según el diseño (DL-151, DL-155 a DL-158). La columna **«Preparación»** dice si eso ya
se comprobó sin personas (por la API, en pantalla o en el APK) o si queda para la prueba. La columna **«Visto»** la completa
quien observa. Que alguien no lo entienda sin ayuda **es un resultado**, no un error de quien prueba: se anota tal cual.
**Nada de esto es todavía una validación con personas.**

**Fechas.** Los días de abajo se cuentan desde el día de la carga de la historia de Nutrición (26/10, hora de Buenos
Aires). Si la prueba es otro día, el período de «Analizar» es el mismo: del 18/10 al día de la prueba.

**Valores confirmados** el 26/10 con la composición congelada en la instantánea de cada plan (activados el
18/10 a las 10:00), comparados con lo que devuelve la API (fase `verificar`: los seis escenarios, sin diferencias) y
con lo que muestra el website.

## Quiénes son (cuentas «Prueba», sintéticas, de test)

| Cuenta | Para qué está | Estado |
|---|---|---|
| Lic. Prueba Dos Áreas | El profesional descartable: Nutrición y Entrenamiento, el único que se puede suspender | Verificado y habilitado en las dos áreas (`BE_DEMO_PROFESIONALES`, #215). Comprobado el 26/10: lee el Entrenamiento de Uno y la Nutrición de Dos |
| Prueba Uno | El teléfono: la sesión para sustituir un ejercicio | Vínculo de Entrenamiento con autorización; plan por serie activado el 26/10 con «Sesión de prueba» |
| Prueba Dos | Nutrición con indicado del día: una sola opción por comida | Vínculo y autorización desde el 17/10; objetivo y plan (activado a las 10:00) desde el 18/10; comidas del 19/10 al 25/10 |
| Prueba Tres | Nutrición con alternativas: sin indicado del día | Igual que Dos, con alternativas en desayuno, almuerzo y cena |
| Prueba Cuatro | Rehabilitar no devuelve una autorización revocada | Vínculo de Nutrición aceptado el 26/10; la persona **revocó la autorización** |
| Prueba Cinco | Rehabilitar no devuelve un vínculo finalizado | La persona **finalizó el vínculo** de Nutrición el 26/10 |

## Parte A · Administración

| # | Qué debería verse | Preparación | Visto |
|---|---|---|---|
| A2 | **Nutrición:** Verificación «Verificada» · Habilitación «Concedida» · «Puede operar» · «Puede operar Nutrición en BE.» · «3 personas vinculadas.» Son Dos, Tres y Cuatro: Cuatro cuenta aunque revocó la autorización, porque el vínculo sigue aceptado; Cinco no, porque lo finalizó. **Entrenamiento:** lo mismo, con «1 persona vinculada.» (Uno). De las personas se ve solo cuántas son, nunca quiénes | Pendiente (cuenta administrativa). Los vínculos que cuenta, confirmados por la API | |
| A3 | Título «Suspender · Nutrición de Lic. Prueba Dos Áreas». **Qué cambia:** «Deja de poder operar Nutrición en BE desde su próxima acción, aunque tenga la sesión abierta.» **Qué sigue igual:** sus planes, registros y borradores se conservan; las otras áreas no cambian; la habilitación queda como está. **A quién se avisa:** al profesional, con una novedad que no lleva el fundamento interno, y a «las 3 personas vinculadas en Nutrición», con el efecto y sin los motivos. El botón dice «Suspender Nutrición» y no es la opción por defecto | Pendiente (cuenta administrativa) | |
| A4 | Nutrición «Suspendida» · «No puede operar Nutrición: la verificación está suspendida.» Arriba, «Se avisó al profesional y a 3 personas vinculadas.» En el historial, «Área suspendida», «De «Verificada» a «Suspendida».», con el fundamento interno y el texto comunicado. Entrenamiento sigue «Puede operar» | Pendiente (cuenta administrativa) | |
| A5 | **La sesión del profesional sigue abierta** (DL-157): no lo echa. **Prueba Dos**, en Nutrición, no muestra datos: la ficha dice que por ahora no hay acceso, sin dar el motivo. **Prueba Uno**, en Entrenamiento, se ve como antes. **Novedades:** «Nutrición: acceso suspendido», con «Administración te escribió: «…»» (el texto para el profesional, no el fundamento) y «tus planes, registros y borradores se conservan, y las otras áreas no cambian» | Pendiente. Antes de suspender, confirmado: el profesional lee la Nutrición de Dos y el Entrenamiento de Uno | |
| A6 | Título «Rehabilitar · Nutrición de Lic. Prueba Dos Áreas». **Qué cambia:** «La verificación de Nutrición vuelve a verificada.» y «Vuelve a poder operar Nutrición: el acceso a cada persona depende otra vez de su vínculo y su autorización.» **Qué sigue igual:** «No se reactivan vínculos finalizados ni autorizaciones revocadas.», «La suspensión queda en el historial.» y las otras áreas | Pendiente (cuenta administrativa) | |
| A7 | **Prueba Dos** vuelve a mostrar todo, igual que antes: nada se perdió. **Prueba Cuatro** sigue sin acceso, porque revocó la autorización. **Prueba Cinco** sigue fuera, porque finalizó el vínculo: si aparece, es con la referencia neutral («Asesorado · …»), sin su nombre. Novedad «Nutrición: verificación rehabilitada» | Pendiente. Antes de suspender, confirmado: Cuatro y Cinco dan el rechazo del contrato (404) y Cinco aparece sin su nombre | |

## Parte B · Nutrición (Calorías, del 18/10 al 26/10)

**Prueba Dos.** Los valores esperados se calcularon aparte, sin las funciones del producto (`herramientas/esperado.mjs`),
con la composición congelada en la instantánea de cada plan (la tabla del final de esta parte).

| Día | Objetivo del profesional | Indicado en el plan | Registrado |
|---|---|---|---|
| 18/10 | 1.800 kcal | 1.572 kcal | — (ese día empezó el plan; sin registros, en gris) |
| 19/10 | 1.800 kcal | 1.572 kcal | 1.730 kcal |
| 20/10 | 1.800 kcal | 1.572 kcal | 1.418 kcal |
| 21/10 | 1.800 kcal | 1.572 kcal | 1.745 kcal |
| 22/10 | 1.800 kcal | 1.572 kcal | — **sin registros** (en gris; no es un cero) |
| 23/10 | 1.800 kcal | 1.572 kcal | 1.435 kcal |
| 24/10 | 1.800 kcal | 1.572 kcal | 1.032 kcal, **subtotal**: el almuerzo se registró sin cantidades |
| 25/10 | 1.800 kcal | 1.572 kcal | 1.590 kcal |
| 26/10 | 1.800 kcal | 1.572 kcal | — (hoy: todavía sin registros) |

| # | Qué debería verse | Preparación | Visto |
|---|---|---|---|
| B2 | Tres capas con nombre propio en la leyenda: **Registrado** (línea continua con puntos), **Objetivo del profesional** (línea discontinua, 1.800 kcal desde el 18/10) e **Indicado en el plan** (rombos huecos, uno por día, 1.572 kcal). Se espera que quien prueba diga, con sus palabras: «lo que fijó el profesional», «lo que decía el plan ese día» y «lo que la persona anotó» | Confirmado: API y pantalla | |
| B3 | El **22/10** no tiene punto y la línea no lo une: es un día sin registros, no un cero. El gráfico lo sombrea en gris y su lectura dice «Sin registros en esta fecha.», con el valor más cercano y «No es simultáneo.». Ese día igual tiene rombo, porque el plan indicaba lo mismo. El **24/10** es un punto vacío: la lectura dice «Subtotal de lo registrado» y «Falta: 1 registro(s) sin cantidades», porque el almuerzo se registró sin cantidades. El 18/10 (el día en que empezó el plan) también está en gris. **A mirar:** en la leyenda, «Hueco» es el punto vacío del subtotal, no el día sin registros. Anotá si quien prueba confunde los dos | Confirmado: API (el día sin registros corta la línea; el día incompleto es parcial) y pantalla (gris, «Sin registros en esta fecha.» y «Subtotal de lo registrado»). La confusión de palabras, a observar | |
| B4 | El 24/10, «Ver origen» dice «Sale de 4 registros de comida» y trae, por comida, la opción, su «Indicado en el plan» y lo registrado. Desayuno: «Yogur con avena y banana», registrado 363 kcal (comió lo del plan) · indicado 363 kcal. **Almuerzo: «Macros sin calcular» (se registró sin cantidades); indicado 558 kcal («Pollo con arroz y ensalada»)**. Merienda: «Fruta y nueces», registrado 176 kcal (comió lo del plan) · indicado 176 kcal. Cena: «Merluza con papa y brócoli», registrado 493 kcal (cantidades informadas) · indicado 475 kcal. Al pie: «Total del día 1.032 kcal» e «Indicado en el plan para el día 1.572 kcal» | Confirmado: API y pantalla | |
| B5 | **Prueba Tres:** no hay rombos. Debajo del gráfico dice por qué, corto: «Indicado en el plan: ningún día de estas fechas tiene un indicado del día (comidas con varias opciones). Lo indicado de cada comida registrada está en «Ver origen».» La lectura del 23/10 lo dice entero: «Sin indicado del día: Desayuno tiene 2 opciones; Almuerzo tiene 3 opciones; Cena tiene 2 opciones. BE no elige entre ellas ni las suma.» En «Ver origen», cada comida trae la opción elegida y su indicado; la cena dice «Comió algo diferente: «Pizza con amigos, dos porciones»», «Comida diferente: no es una opción del plan y no tiene indicado.» y «Macros sin calcular». El día es un subtotal (1.097 kcal) y al pie dice «Indicado en el plan para el día sin indicado: comidas con varias opciones». Objetivo: 1.900 kcal | Confirmado: API y pantalla | |
| B6 | No aparece «cumplimiento», «adherencia», ningún porcentaje ni colores de bien o mal. Al pie: «Que los valores se acerquen o se alejen no indica que una cosa cause la otra.» | Confirmado en pantalla, en «Analizar» y «Ver origen» | |

**Prueba Tres, registrado por día:** 20/10 1.572 kcal · 21/10 1.288 kcal · 22/10 1.411 kcal · 23/10 1.097 kcal (subtotal: la cena fue una comida diferente) · 24/10 1.396 kcal · 25/10 1.381 kcal. Objetivo: 1.900 kcal. El 22/10, Tres registró todo: no es un día sin registros.

**La composición congelada en las instantáneas** (cada 100 g, la que usan las cuentas de arriba):

| Alimento | kcal | Proteínas (g) | En el plan de |
|---|---|---|---|
| aceite | 884 | 0 | Dos y Tres |
| arroz | 130 | 2,7 | Dos y Tres |
| avena | 379 | 13,2 | Dos y Tres |
| banana | 89 | 1,1 | Dos y Tres |
| brócoli | 34 | 2,8 | Dos y Tres |
| carne | 187 | 27 | Tres |
| cebolla | 40 | 1,1 | Tres |
| espinaca | 23 | 2,9 | Tres |
| huevo | 143 | 12,6 | Tres |
| lechuga | 15 | 1,4 | Dos y Tres |
| lentejas | 116 | 9 | Tres |
| manzana | 52 | 0,3 | Dos y Tres |
| merluza | 90 | 18 | Dos y Tres |
| naranja | 47 | 0,9 | Tres |
| nueces | 654 | 15,2 | Dos y Tres |
| pan integral | 247 | 13 | Tres |
| papa | 87 | 1,9 | Dos y Tres |
| pollo | 165 | 31 | Dos y Tres |
| queso fresco | 264 | 18 | Tres |
| tomate | 18 | 0,9 | Dos y Tres |
| yogur | 61 | 3,5 | Dos y Tres |
| zanahoria | 41 | 0,9 | Tres |
| zapallo | 26 | 1 | Tres |

## Parte C · Teléfono

Son T1 a T5 del guion del teléfono, más la instalación y lo guardado.

| # | Qué debería verse | Preparación | Visto |
|---|---|---|---|
| C1 | Se instala **como actualización**: el paquete y el certificado son los mismos (61569691…893e06) y el versionCode sube a 30. Si había una sesión abierta, sigue | Confirmado en el APK (paquete, certificado y versionCode 30). En el teléfono, pendiente | |
| C2 | La bienvenida dice «app 0.18.0-candidata.1 · test · commit b64d0c4» | Confirmado en el APK (versión, ambiente y commit). En el teléfono, pendiente | |
| C3 | «Sesión de prueba»: Press de banca (3 × 10, 40 kg, descanso 90 s) y Sentadilla (3 × 8, 50 kg, descanso 120 s) | Confirmado por la API: lo que ve Uno hoy, sin empezar | |
| C4 (T1) | Antes de buscar, el diálogo nombra el planificado y dice que la sustitución vale para **todas** las series de este ejercicio en esta sesión, las registradas y las que faltan, y que no se puede cambiar una serie sola. Abajo: «Ya registraste 2 series de este ejercicio: pasan a contar como el que elijas» | Pendiente (teléfono) | |
| C5 (T2, T3) | Antes de guardar pregunta: «Las 2 series que ya registraste de «Press de banca» pasan a contar como «(el elegido)», y las que registres después también. Sus datos no cambian, y lo planificado por tu profesional tampoco.» Al confirmar, la tarjeta dice «Ejecutado: (el elegido) · Sustituido» debajo del planificado, y las series 1 y 2 conservan su número, su carga y sus repeticiones. La búsqueda no ofrece el planificado (T12) | Pendiente (teléfono). La búsqueda trae ejercicios para sustituir: confirmado por la API | |
| C6 (T4) | La serie 3 queda en el mismo ejercicio, con el ejecutado. No aparece un ejercicio nuevo ni una serie repetida | Pendiente (teléfono) | |
| C7 (T5) | Pregunta antes, con las tres series. Al confirmar, las tres vuelven al planificado tal cual y la insignia «Sustituido» desaparece | Pendiente (teléfono) | |
| C8 | En el historial, la sesión tiene Press de banca con 3 series y Sentadilla con 3, sin sustitución: es lo último que quedó | Pendiente (teléfono) | |
| C9 (T6) | En el website, lo confirmado muestra lo mismo, y el plan de Prueba Uno no cambió | Pendiente (teléfono) | |

## Qué ya se comprobó sin personas

Preparación del 2026-10-26, en test. Las salidas completas están en `preparacion/`.

- **Integración.** #215 entró en `b40421d` (19:11 UTC) y #216 en `e4512cb` (19:30 UTC).
  - Cada uno estaba al día con `main` y tenía la CI de su cabeza en verde. La CI de `main` también dio verde.
  - La API y el website sirven `e4512cb` desde las 19:43 UTC, con readiness, base y migraciones en OK.
- **El profesional descartable opera las dos áreas.** La siembra lo preparó al arrancar la API con #215. Con su sesión,
  pidió el vínculo de Entrenamiento de Uno y los de Nutrición de Cuatro y Cinco. Ahora lee el plan de Uno y la comparación
  de Dos.
- **La cohorte sigue funcionando.** La comprobación es de solo lectura, con una entrada por profesional y sin Diego Sosa:
  - Sofía Paz lee Nutrición y Antropometría;
  - Martín Acosta lee Entrenamiento;
  - Lucía Benítez lee Antropometría.
- **La historia de Nutrición de Dos y Tres** se cargó por SQL el 2026-10-26, de 19:57:29 a 19:58:04 UTC.
  - Se usó la IP de esta máquina, habilitada en be-db-test (`186.123.136.127/32`). La primera conexión entró a las
    19:57:14 UTC.
  - Hubo una lectura de control en la misma ventana. Todo lo escrito con la procedencia `SIEMBRA-PRUEBA-BREVE` es de las
    cuentas «Prueba»: 0 filas ajenas.
  - Siguen activos los 47 disparadores de esas tablas.
  - Cada plan tiene su instantánea y figura activado el 18/10 a las 10:00.
- **El acceso temporal se cerró.**
  - A las 20:26:48 UTC, una conexión nueva desde esta máquina se rechaza («Server has closed the connection»), como antes
    de abrirlo.
  - La regla del workspace («0.0.0.0/0 · everywhere») no se tocó. Con la lista de la base vacía, la base no se alcanza
    desde internet, como declara `render.yaml`.
  - Quedó abierto hasta las 20:26 porque Render pide dos pasos para vaciar la lista: «Save» y, después, escribir «block
    all internet traffic to PostgreSQL». Sin el segundo, el cambio no se aplica: la última conexión que entró fue a las
    20:24:42 UTC.
  - La API siguió conectada: readiness en OK, y la verificación de abajo se repitió a las 20:27 UTC sin diferencias.
- **La verificación estricta** (`escenarios.mjs verificar`, solo lectura):
  - los 6 escenarios obligatorios, comprobados;
  - «SIN DIFERENCIAS», salida 0;
  - sus casos negativos, en `comprobaciones.test.mjs`: 20 de 20;
  - antes de cargar la historia, la misma herramienta dio «PREPARACIÓN INCOMPLETA» y salida 2, con Dos, Tres y la
    Nutrición del profesional como faltantes.
- **En pantalla** (`ver-en-pantalla.mjs`): una entrada como el profesional, solo lectura y con toda escritura bloqueada.
  - 48 de 48 controles, el 2026-10-26 a las 20:31 UTC, con la base ya cerrada al exterior.
  - Hubo dos intentos antes, y ninguna falla fue del producto:
    - el primero dio 43 de 46: tres textos esperados mal escritos (la calidad con mayúscula y la nota de debajo del
      gráfico de Tres);
    - el segundo dio 46 de 46, pero las capturas de «Ver origen» salieron con las comidas recargándose. La captura de
      página completa cambia el tamaño de la ventana y el panel vuelve a cargar los registros.
  - La herramienta ahora agranda la ventana, espera las comidas leídas y lo controla antes de capturar.
- **El APK** de la candidata: los controles de la publicación, en `EVIDENCIA/PUBLICACION-0.18.0-candidata.1/`.

**No es una validación con personas.** Esto prueba que los escenarios están cargados y que la API y la pantalla dicen lo
calculado aparte. No prueba que alguien lo entienda sin ayuda: eso es la prueba breve.
