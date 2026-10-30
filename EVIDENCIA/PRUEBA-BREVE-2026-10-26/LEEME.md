# Prueba breve de la tanda del 2026-10-25 · cuentas, escenarios y guion

Encargo de Dirección del 2026-10-26: preparar y realizar la validación de uso de la tanda integrada el 2026-10-25
(Administración, la comparación de Nutrición y la sustitución en el teléfono), con datos sintéticos descartables en test y
la APK `0.18.0-candidata.1`. **Nada de esto es una validación con personas todavía:** la prueba la hacen Dirección y quien
ella elija, con `GUION.md` (quien prueba) y `OBSERVADOR.md` (quien observa, con las respuestas esperadas).

## Qué hay en esta carpeta

| Archivo | Para qué |
|---|---|
| `GUION.md` | La prueba de 25 a 30 minutos, en tres partes: los objetivos y qué hacer, sin las respuestas |
| `OBSERVADOR.md` | Lo que debería verse en cada paso, con los valores calculados aparte, y la columna «Visto» |
| `herramientas/escenarios.mjs` | Cómo se prepararon las cuentas y los datos (fases `cuentas`, `api`, `pasado` y `verificar`) |
| `herramientas/datos.mjs` | Los planes, los objetivos y las comidas, sin lógica: lo que se cargó |
| `herramientas/esperado.mjs` | Lo esperado de la comparación, con aritmética propia y **sin las funciones del producto** |
| `herramientas/comprobaciones.mjs` | Lo que exige la fase `verificar` a cada escenario, sin red; sus pruebas, en `comprobaciones.test.mjs` (`node --test`) |
| `herramientas/ver-en-pantalla.mjs` | La comprobación en el website, de solo lectura, con la cuenta del profesional descartable |
| `preparacion/` | Lo que dieron la verificación y la comprobación en pantalla, con sus capturas |

## Las cuentas (sintéticas, de test, con «Prueba» en el nombre)

Todas son nuevas, con correo `@example.invalid`. Ninguna es de la cohorte, de la demostración ni Diego Sosa. **Las
credenciales no están en el repositorio:** se generaron al azar y viven solo en
`C:\Users\bufim\BE-datos-locales\prueba-test\cuentas.env`, en la máquina de Dirección. El estado de la carga (los
identificadores, nunca las credenciales) queda en `estado.json` de esa carpeta.

| Cuenta | Identidad | Para qué |
|---|---|---|
| Lic. Prueba Dos Áreas | `428175d3-eb0b-40ba-a468-5de645eb8e45` | El profesional descartable, con Nutrición y Entrenamiento. Es **el único que se puede suspender** en test |
| Prueba Uno | `69060add-4b3e-4cf1-8409-426226874deb` | El teléfono: Entrenamiento con «Sesión de prueba» |
| Prueba Dos | `7a2091dc-db07-4b31-9863-ea1106f90824` | Nutrición con indicado del día (una opción por comida) |
| Prueba Tres | `1a70506a-b364-4589-8662-cd82311d24a6` | Nutrición con alternativas (sin indicado del día) |
| Prueba Cuatro | `dce879df-f09f-4660-901a-960b85b30946` | Nutrición con la autorización revocada por la persona |
| Prueba Cinco | `de078e1a-b94e-4ae0-99bf-b0781c85e65d` | Nutrición con el vínculo finalizado por la persona |

La cuenta administrativa de Dirección es aparte: la crea y la incorpora ella (`EVIDENCIA/ADMINISTRACION/OPERACION.md` §2),
y no tiene vínculos.

**El profesional nuevo y la configuración.** En test, un profesional sale del servicio interno (DL-036): la cuenta se
registra por la API pública y la siembra la verifica al arrancar, si está declarada en `BE_DEMO_PROFESIONALES`. Por eso
#215, un PR solo de configuración, agrega sus dos entradas **a continuación** de las ocho que había (los Demo y la
cohorte), sin cambiarlas.

## Cómo se preparó

1. **`cuentas`**, por la API, como el website y la APK: las seis altas (con la mayoría de edad), el permiso de datos de
   salud (A3) y el nombre de cada persona.
2. **`api`**, por la API, todo lo que es de hoy:
   - **Uno:** el vínculo de Entrenamiento con su autorización, la evaluación, el objetivo y un plan por serie activado.
     Tiene una sesión, «Sesión de prueba», con dos ejercicios de tres series y descanso indicado: la preparación que pide
     el guion del teléfono;
   - **Cuatro:** el vínculo de Nutrición y la autorización, que después la persona revocó;
   - **Cinco:** el vínculo de Nutrición y la autorización, y después la persona finalizó el vínculo.
3. **`pasado`**, la historia de Nutrición de Dos y Tres, con el mismo criterio que la cohorte
   (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/LEEME.md`), porque la API no deja registrar en el pasado:
   - por SQL, con su fecha: el vínculo y la autorización (17/10), el objetivo (18/10), la activación del plan (18/10) y
     las comidas (19/10 a 25/10);
   - por la API: la evaluación, con la fecha del hecho, y el borrador del plan;
   - lo escrito por SQL sigue las reglas de la base: los disparadores quedan activos, cada estado nace como en la API y
     cada transición deja su hecho en la misma transacción. La instantánea del plan se arma con la misma función del
     dominio que usa la API. La procedencia es `DATOS-SINTETICOS` / `SIEMBRA-PRUEBA-BREVE`.
4. **`verificar`**, solo lectura y estricta: lee por la API los seis escenarios obligatorios y los compara con
   `esperado.mjs`.
   - Dice cuáles comprobó y cuáles faltan.
   - Termina con 0 y «SIN DIFERENCIAS» solo si están los seis, sin diferencias. Con diferencias, termina con 1.
   - Si falta una fase, o la API no deja concluir, dice «PREPARACIÓN INCOMPLETA» y termina con 2. No dejan concluir una
     sesión que no sirve, el límite de pedidos, un 5xx o una falla de red.
   - Para Cuatro y Cinco exige el rechazo exacto del contrato, `404 RESOURCE_NOT_FOUND`. Exige también el vínculo como lo
     ve el profesional y que la misma sesión lea otra cosa en el mismo momento.
5. **La comprobación en pantalla** (`ver-en-pantalla.mjs`): entra una vez como el profesional y bloquea toda escritura.
   Mira:
   - las tres capas de Dos, con sus números, el hueco y el subtotal;
   - el motivo de Tres;
   - «Ver origen» de las dos;
   - las fichas de Cuatro y Cinco.

**Lo que no es real.** Las cuentas se crearon hoy y su historia de Nutrición empieza días antes. Los borradores de los
planes de Dos y Tres se crearon hoy y figuran activados en el pasado. Es lo mismo que pasa con la cohorte: una historia
sintética para la prueba, no un registro.

## Los escenarios de Nutrición

**Prueba Dos: una sola opción por comida**, un solo día tipo y una sola versión vigente. El día tiene indicado. El
objetivo es de 1800 kcal: es distinto de lo indicado a propósito, para que las tres capas no se superpongan.

| Comida | La opción (cada una, la única) | Indicado |
|---|---|---|
| Desayuno | Yogur con avena y banana: yogur 200 g, avena 40 g, banana 100 g | 363 kcal (362,6) |
| Almuerzo | Pollo con arroz y ensalada: pollo 150 g, arroz 150 g, lechuga 60 g, tomate 100 g, aceite 10 g | 558 kcal (557,9) |
| Merienda | Fruta y nueces: manzana 150 g, nueces 15 g | 176 kcal (176,1) |
| Cena | Merluza con papa y brócoli: merluza 180 g, papa 200 g, brócoli 150 g, aceite 10 g | 475 kcal (475,4) |
| **El día** | | **1.572 kcal** (1572) |

**Prueba Tres: alternativas** en desayuno (2), almuerzo (3) y cena (2). No hay indicado del día; lo indicado está en
cada comida registrada. El objetivo es de 1900 kcal.

**Las comidas.** Cada día, lo que se registró de cada comida:
- «comí lo del plan»;
- cantidades informadas, a veces con «no lo comí»;
- un registro sin cantidades;
- y, en Tres, una comida diferente.

Están en `herramientas/datos.mjs`, y los valores esperados en `OBSERVADOR.md`. Lo que se buscó mostrar:
- **un hueco**: el 22/10, Dos no registró nada. No es cero, y la línea no lo une. En pantalla es un día «sin
  registros», en gris (en la leyenda, «Hueco» nombra otra cosa: el punto vacío de un subtotal);
- **un registro incompleto**: el 24/10, el almuerzo de Dos se registró sin cantidades. Ese día es un subtotal, y la
  comida tiene indicado pero no tiene número registrado.

## Lo comprobado automáticamente

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

## Lo que queda para las personas

- La prueba breve entera (`GUION.md`): la hace Dirección.
- El guion completo del teléfono (`EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`, T1 a T14 y R1 a R3), con
  TalkBack en T13. La prueba breve no lo reemplaza.
- Un lector de pantalla en el website y la prueba con profesionales (DL-153, DL-154 y DL-158).
- La candidata no pasa a estable sin esas pruebas (regla de DL-152).

## Cuándo se borran

Las cuentas y los datos «Prueba» se conservan para repetir la prueba. Cuando Dirección decida que ya no hacen falta:
- se quita la entrada de `BE_DEMO_PROFESIONALES`, con otro PR solo de configuración (la siembra deja de prepararlo; su
  historia se conserva, como todo en BE);
- y se borra `C:\Users\bufim\BE-datos-locales\prueba-test`.
