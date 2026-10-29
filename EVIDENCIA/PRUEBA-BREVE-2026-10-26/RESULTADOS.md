# Prueba breve · resultados (PARCIALES)

**Estado al 2026-10-29:**
- **Parte A (Administración):** hecha por Dirección el 2026-10-27 a la mañana, de 11:09 a 11:21 (hora de Buenos Aires,
  según las pantallas).
- **Parte C (Teléfono):** empezó el 2026-10-29 a la tarde. Se hicieron C2 y C3, y apareció un defecto (**D-C1**). La
  sesión quedó registrada sin el primer ejercicio, así que C4 a C8 pasan a otro día.
- **Pendientes:** la **Parte B (Nutrición)** y la pasada con **TalkBack**.

Esto no es todavía la validación de uso. Es el registro de lo que se vio hasta ahora, comparado con `OBSERVADOR.md`.

Quien observó fue el asistente, por el chat, con las capturas que mandó Dirección. Las respuestas en voz alta están
citadas tal cual.

## Antes de empezar: el acceso administrativo

- Dirección creó su cuenta (`@example.invalid`), la incorporó con el comando del Shell de be-api y configuró el segundo
  factor. Ni el código, ni el QR, ni los códigos de recuperación pasaron por el chat.
- **Al escanear el QR con la cámara del teléfono, se abrió Samsung Pass** en lugar de la aplicación de códigos
  (observación O-4).
- Comprobación del procedimiento (OPERACION.md §2): con la cuenta administrativa, `/pro` lleva a «Iniciar sesión», y la
  entrada responde «No pudimos verificar los datos de acceso.». **Coincide:** la cuenta administrativa no entra al
  website profesional.

## Parte A · Administración

| # | Lo que se vio o se dijo | ¿Coincide con OBSERVADOR? |
|---|---|---|
| A1 | La lista tiene 7 profesionales, con la situación de cada área; «Lic. Prueba Dos Áreas» aparece sin buscar | Sí |
| A2 | Respuesta: **«3»** (personas afectadas por una decisión en Nutrición). La ficha: Nutrición y Entrenamiento «Puede operar», «3 personas vinculadas.» y «1 persona vinculada.» | Sí |
| A3 | Respuesta: **«se entiende»**. El diálogo dice qué cambia, qué sigue igual y a quién se avisa, palabra por palabra como lo esperado; el botón dice «Suspender Nutrición» | Sí |
| A4 | Nutrición «Suspendida», «No puede operar Nutrición: la verificación está suspendida.»; Entrenamiento sigue «Puede operar»; aviso «Se avisó al profesional y a 3 personas vinculadas.» | Sí |
| A5 | La sesión del profesional siguió abierta. En la cartera, Dos y Tres: «Nutrición: Vínculo activo · Acceso no disponible»; Uno, Entrenamiento normal. La ficha de Dos: «Por ahora no tenés acceso a la información de esta persona…». Novedad «Nutrición: acceso suspendido» con el texto para el profesional y sin el fundamento | Sí (con la observación O-2) |
| A6 | El diálogo de rehabilitar coincide palabra por palabra. **Predicción de Dirección, antes de confirmar:** «se lo habilita pero debe poder revincularse y autorizarse» | El diálogo, sí. La predicción, en parte (O-3) |
| A7 | Dos volvió entera («Activo · con acceso»), **sin revincularse ni autorizar nada**: objetivo, plan versión 1 y 24 registros. Cuatro sigue «Consentimiento revocado · Acceso no disponible». Cinco sigue como «Asesorado · 85e65d», «Finalizado» | Sí |

De paso, el Resumen de Prueba Dos mostró **1.492 kcal** y **99,9 g** de media de los días con valor: coinciden con lo
calculado aparte (la media de los 6 días registrados).

## Parte C · Teléfono · funcional (2026-10-29)

La APK 0.18.0-candidata.1 ya estaba instalada. Dirección pidió confirmar la versión desde la app y no reinstalarla si
coincidía. Las horas son las del teléfono. Las capturas están en `capturas-parte-c/`.

| # | Lo que se vio o se dijo | ¿Coincide con OBSERVADOR? |
|---|---|---|
| C1 | No se repitió: la candidata ya estaba instalada. «Se instala encima sin perder nada» queda **sin observar** | Sin observar |
| C2 (16:12) | La bienvenida dice «app 0.18.0-candidata.1 · test · commit b64d0c4». Coincide con la prerelease be-apk-0.18.0-candidata.1 (vc 30, b64d0c4). Captura: `c2-version.jpg` | Sí |
| C2 (16:55) | Antes de entrar preguntó: **«Y abro prueba uno en el escritorio?»** (O-5). Entró con Prueba Uno en el teléfono. Inicio: «Sesión de prueba · Bloque de prueba · 2 ejercicios · 6 series · No iniciada». Entró desde Inicio y no desde la pestaña Entrenamiento: es equivalente | Sí (con O-5) |
| C3 (17:06 a 17:12) | El plan coincide: Press de banca 3 × 40 kg × 10, RIR 2, descanso 01:30; Sentadilla 3 × 50 kg × 8, RIR 2, descanso 02:00. En Press de banca escribió valores en las series 1 y 2, **sin tocar «Registrar serie»**. Pasó a Sentadilla y registró tres series. Desde Sentadilla tocó «Finalizar entrenamiento» sin volver a Press de banca, eligió «Realizada» y confirmó. **Quedó registrada solo Sentadilla** (58 kg × 8 · RIR 3, 55 × 3 · RIR 1 y 55 × 9 · RIR 1); Press de banca, sin series (05:48 medidos); total 07:54 | **No.** La consigna era registrar dos series en el primer ejercicio, y no quedaron. Causa: el defecto D-C1 |
| C4 a C8 | No se pudieron hacer: la sesión ya estaba confirmada, y la API admite un solo borrador por persona, versión del plan, sesión y día. Pasan a otro día | Pendiente |
| C9 | No se llegó | Pendiente |

**Lo que dijo Dirección después de C3, tal cual:**
- «Hay un problema y es que en la serie solo se visualiza el valor por defecto, cuando lo modifico se ve el cambio, pero
  al cambiar de serie se ve el default o recomendado, cuando vuelvo a tocar la serie modificada me vuelven a aparecer
  los pesos que puse.... ahi vi que el problema era que tenia que poner registrar serie. Pero el botón esta lejos del
  cuadro, sugiero ponerlo debajo o al lado de los 3 cuadros. O que si cargas números se vean, en otra actualización creo
  que no pasaba ese error de que no se vean mismo si estan todas las series cargadas que se puedan cargar todas o ahi
  mismo avisar si quedo alguna sin cargar antes de pasar al próximo ejercicio o omitir»
- «Puse finalizar entrenamiento directamente, lo siento, no pase a los otros ejercicios directamente»

### Defecto D-C1 (severidad alta): lo escrito y no registrado no se ve, y se pierde sin aviso

**Qué pasa:** en la tabla de series, lo que se escribe en una serie y no se registra queda guardado en la memoria de la
pantalla, pero solo se muestra mientras esa serie está activa. Al pasar a otra serie, la fila vuelve a mostrar el plan
en gris. Una persona puede creer que cargó series que no están, y la sesión queda «Realizada» sin ese ejercicio.

**Lo que se ve en las capturas:**
- `c3-1-press-serie-2-escrita.jpg` (17:06): la serie 2 activa tiene 45 · 9 · 3 escritos, y la serie 1 muestra el plan
  en gris (40 · 10 · 2).
- `c3-2-press-serie-1-escrita.jpg` (17:08): con la serie 1 activa (45), la serie 2 vuelve a mostrar el plan en gris,
  aunque tenía 45 · 9 · 3 escritos.
- `c3-3-sentadilla-boton-lejos.jpg` (17:12): pasa lo mismo en Sentadilla. La serie 1 muestra el plan (50 · 8 · 2) y
  después quedó registrada con 58 · 8 · 3. «Registrar serie 3» aparece abajo, después de «Cambiar a lb», del plan de la
  serie, de la ayuda del RIR y de «Cronometrar serie».
- `c3-4-sentadilla-tres-guardadas.jpg` y `c3-5-sesion-registrada.jpg` (17:12): las tres series de Sentadilla
  guardadas, y la sesión registrada sin Press de banca.

**Lo comprobado en el código de la candidata (b64d0c4):**
- Lo escrito se guarda por fila (`entrenamiento.tsx:897`). La tabla recibe solo lo de la fila activa
  (`entrenamiento.tsx:987` y `:1472`).
- Una fila no activa y sin registrar muestra siempre el plan en gris (`sesion-enfocada.tsx:318-328`).
- La protección contra pérdidas (`useCambiosSinGuardar`, `entrenamiento.tsx:995`) pregunta solo al salir de la pantalla.
  Pasar a otro ejercicio (`pasarA`) no pregunta.
- Al finalizar, la pantalla «Antes de finalizar» lista cada ejercicio con «N de M series registradas» y las que quedan
  «Sin registrar» (`SeriesDelResumen`). Para Press de banca tuvo que decir «0 de 3 series registradas · Sin registrar:
  serie 1, serie 2, serie 3». **No hay captura de esa pantalla**: es lo que dice el código. Es un dato a la vista, no
  una pregunta, y no frenó el cierre.
- `finalizar()` (`entrenamiento.tsx:1188`) no revisa lo escrito sin registrar. `problemaParaConfirmar` frena solo por
  un ejercicio **sustituido** sin series (T7). Un ejercicio planificado sin ninguna serie no frenó el cierre, y la API
  aceptó la sesión sin él: es lo que se vio.
- Según el código, «Realizada» no viene marcada: la pantalla dice «Todavía no indicaste cómo resultó la sesión.» hasta
  que se elige.

**Desde cuándo:** desde la tabla por serie (e6bd769, 6/10, 0.15.0-candidata.1). No es una regresión de la 0.18. La
estable 0.13.2 tenía otro formulario; eso puede explicar el «en otra actualización creo que no pasaba».

**Corrección acotada propuesta (no aplicada).** Toca solo la APK (`entrenamiento.tsx`, `sesion-enfocada.tsx` y los
textos), no la API:
1. Una serie no activa con algo escrito muestra lo escrito, con la marca «Escrita, sin registrar», y no el plan en gris.
2. «Registrar serie N» va justo debajo de la tabla, antes del plan de la serie y de la ayuda. Es lo que sugirió
   Dirección.
3. Antes de pasar a otro ejercicio o de finalizar, si hay series escritas sin registrar, pregunta: «Registrarlas»,
   «Descartarlas» o «Volver».
4. Al finalizar, si un ejercicio planificado no tiene ninguna serie, lo nombra y ofrece «Volver» o «Finalizar igual».

**Descartado por ahora:** «registrar todas juntas». Cambia el modelo por serie: el descanso y los tiempos de cada serie.

**Para verla en el teléfono** hace falta una candidata nueva, y eso necesita la autorización de Dirección.

## Parte C · TalkBack

Pendiente. Va en una pasada aparte, al final de lo funcional: es T13 del guion del teléfono
(`EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`). No se mezcla con los resultados funcionales.

## Qué está comprobado, qué falta y qué no se probó

1. **Comprobaciones de Dirección, hechas:** la Parte A, 7 de 7 (27/10). De la Parte C, C2 y C3 (29/10), con el
   defecto D-C1.
2. **La prueba con profesionales:** no se hizo. Nada de este registro valida el uso por profesionales.
3. **Sigue sin probarse:**
   - la Parte B;
   - C1 (instalar encima);
   - C4 a C9 (la sustitución dentro de la prueba breve);
   - TalkBack (T13);
   - del guion del teléfono, T7 a T14 y R1 a R3;
   - los avisos push en el teléfono y los días de la agenda.

## Observaciones (para que decida Dirección; ninguna se cambió)

| # | Qué | Por qué importa |
|---|---|---|
| O-1 | En el tema Azul noche, el botón «Continuar con Google» del inicio de sesión tiene un borde blanco | Detalle visual del tema oscuro |
| O-2 | Durante una suspensión, la ficha del asesorado dice «…Si se vinculó hace poco, puede que todavía no haya completado sus autorizaciones en la app» | La pista apunta a la persona cuando la causa es del profesional: puede llevar a reclamarle algo al asesorado. El motivo real llegó por Novedades |
| O-3 | Dirección esperaba que, al rehabilitar, las personas tuvieran que «revincularse y autorizarse»; para Dos no hizo falta | «El acceso a cada persona depende otra vez de su vínculo y su autorización» puede leerse como que hay que rehacerlos. Es un resultado de comprensión, no un defecto |
| O-4 | Escanear el QR con la cámara abre Samsung Pass | OPERACION.md podría decir que el QR se escanea desde la aplicación de códigos |
| O-5 | El guion dice «Entrá con Prueba Uno» sin decir dónde, y Dirección preguntó si era en el escritorio | Es del guion, no del producto: podría decir «en el teléfono» |

## Estado de test después de la Parte A

Nutrición de «Lic. Prueba Dos Áreas» quedó **rehabilitada** (verificada otra vez). El historial guarda la suspensión y
la rehabilitación. Las cuentas y los datos están listos para las partes B y C.

## Estado de test después de C3 (2026-10-29)

Prueba Uno tiene la «Sesión de prueba» del 29/10 registrada como «Realizada», con solo Sentadilla. Ese registro queda en
su historial, y el profesional también lo va a ver en C9. Para C4 a C8 hace falta un borrador nuevo, en otro día.
