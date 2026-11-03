# Prueba del miércoles 4/11: la APK nueva de punta a punta (unos 50 minutos)

**Dónde estamos.** La `0.19.0-candidata.1` (3/11) se revisó en el código y en la CI, pero todavía no se usó en un
teléfono. Esta hoja junta lo que falta de la prueba breve (parte B y C4 a C9, en `EVIDENCIA/PRUEBA-BREVE-2026-10-26/GUION.md`
de la rama de #217, árbol `C:\Users\bufim\BE-prueba-breve`) con lo nuevo de la candidata: la sesión guiada, el registro
rápido y la corrección. Las partes B y C miden si se entiende sin ayuda: **las respuestas esperadas están en
`OBSERVADOR.md` y no se leen antes**. Lo nuevo (D a F) no tiene guion en el repositorio: sale de las notas de la release
y de las revisiones del código del 2/11.

**Cómo anotar.** En cada casilla: «bien», «raro» o «falla», y una frase con tus palabras. Si es «falla», una captura con
el nombre del paso (`c5-…`, `d3-…`). Al terminar se pasa a `OBSERVADOR.md` (columna «Visto», para B y C) y a
`RESULTADOS.md` (todo, con la severidad de cada defecto), los dos en la rama de #217.

## Antes de empezar

- [ ] `/health/ready` de test responde `b62ce90`.
- [ ] `BE_REPO=<un árbol con packages/domain/dist y node_modules> node herramientas/escenarios.mjs verificar`, desde la
      carpeta de la prueba (solo lectura, Node 22, inicia una sesión por cuenta): si da diferencias, mirarlas antes,
      porque la parte A y C3 ya cambiaron datos a propósito.
- [ ] La APK instalada **encima**, sin desinstalar; el SHA-256 del archivo empieza con `13549f73` y termina con `282a`.
      La bienvenida dice «app 0.19.0-candidata.1 · test · commit 42dd257».
- [ ] Ventana privada en `https://be-web-1ngj.onrender.com/pro` con Lic. Prueba Dos Áreas. Credenciales en
      `C:\Users\bufim\BE-datos-locales\prueba-test\cuentas.env`, nunca en el chat.
- [ ] **Cuidar el viernes:** nada sobre Diego; y Prueba Uno tiene que llegar con la sesión de ese día sin iniciar y una
      pendiente de otro día (`DEMO.md`).

## Parte B · Nutrición en el website (10 min) — Prueba Dos y Prueba Tres, Calorías, del 18/10 al 26/10

- [ ] **B1-B2** «Analizar» de Prueba Dos, sin abrir «Cómo se lee»: ¿qué representa cada línea o forma?
- [ ] **B3** Un día sin registros y un día incompleto: ¿qué dice la pantalla de cada uno?
- [ ] **B4** En el día incompleto, «Ver origen de Calorías»: ¿qué comida falta registrar con cantidades? ¿qué decía el plan?
- [ ] **B5** Prueba Tres, misma métrica y período: ¿por qué no hay indicado del día? ¿dónde está lo indicado de cada comida?
- [ ] **B6** Todo de nuevo: ¿algo hace pensar que BE califica a la persona?

## Parte C · Sustituir un ejercicio en la sesión (10 min) — Prueba Uno

En la 0.19, «registrar una serie» es **tildar su casilla**, al final de la fila.

- [ ] **C3** Entrenamiento → «Sesión de prueba» → «Iniciar entrenamiento»; en el primer ejercicio, tildá dos series.
- [ ] **C4** «Sustituir ejercicio», sin elegir nada: ¿a qué series va a afectar el cambio?
- [ ] **C5** Buscá «press», elegí otro ejercicio y confirmá: ¿qué pasó con las dos series? ¿cambió el plan?
- [ ] **C6** Tildá la tercera serie: ¿en qué ejercicio quedó?
- [ ] **C7** «Sustituir ejercicio» → «Volver al planificado»: ¿qué cambió?
- [ ] **C8** Hacé el segundo ejercicio con la parte D y «Finalizar». Abrí el historial y esa sesión: ¿es lo que hiciste?
- [ ] **C9** En `/pro`, Prueba Uno → Entrenamiento: ¿ves lo mismo que en el teléfono? ¿cambió el plan?

## Parte D · La sesión guiada (dentro de C8, antes de «Finalizar»)

- [ ] **D1** Arriba, la franja: ¿se entiende en qué ejercicio y serie vas, y el tiempo de la sesión y del ejercicio?
- [ ] **D2** Tildá la serie 1 sin escribir: ¿la fila queda en azul con el borde fino? Cambiá al tema Claro: ¿se sigue viendo?
- [ ] **D3** En la serie 2 escribí otra carga y tildala: ¿queda lo escrito?
- [ ] **D4** En la serie 3 escribí algo **sin tildar**, pasá a otra fila, mandá la app a segundo plano y volvé: ¿sigue lo
      escrito? (es el defecto D-C1). Al tocar «Finalizar», ¿avisa que hay algo sin registrar?
- [ ] **D5** Con el modo avión unos segundos, destildá y volvé a tildar una serie; quitá el modo avión: ¿la serie sigue
      tildada después de un rato?

## Parte E · «Ya la hice» (5 min) — en una pendiente de otro día

- [ ] **E1** «La hice ese día» → «¿Cómo fue…?»: ¿se entienden las opciones y los pasos?
- [ ] **E2** «Hice todo lo planificado» → «Listo para registrar»: ¿se ven los valores del plan de cada ejercicio?
- [ ] **E3** «Cambiar» en un ejercicio y destildá una serie: ¿alcanza para decir «hice una menos», o querés un botón aparte?
- [ ] **E4** «Cambiar la serie»: escribí solo las repeticiones y dejá la carga vacía. Después de registrar, ¿qué carga quedó?
- [ ] **E5** «Registrar sesión» → «Listo»: ¿qué dice de cómo lo va a ver tu profesional?

## Parte F · Corregir (5 min) — la sesión de C8

- [ ] **F1** En el historial, la sesión → «Corregir»: ¿lo que faltó aparece en gris para sumarlo?
- [ ] **F2** Destildá una serie: ¿queda tachada, con «Deshacer», y «Qué cambia» lo dice?
- [ ] **F3** Sumá una serie tildándola, elegí el motivo y registrá: ¿se ve lo corregido? ¿lo de antes sigue?
- [ ] **F4** En `/pro`: ¿la sesión dice cómo se cargó (carga completa, rápida, rápida con cambios)? ¿lo tildado sin
      escribir va con punto hueco y sin compararse con lo indicado?

## Al terminar

- [ ] Lo más difícil de entender y qué cambiarías.
- [ ] ¿Queda una pendiente de Prueba Uno para el viernes?
- [ ] TalkBack: ¿una pasada corta ahora (activarlo, recorrer la sesión y tildar una casilla con doble toque: ¿dice que es
      una casilla y si está marcada?) o se declara como límite en la diapositiva 13?
- [ ] Con lo anotado se completan la diapositiva 9, las notas de la 11, la 13 y la pregunta 19 de `PREGUNTAS.md`.
