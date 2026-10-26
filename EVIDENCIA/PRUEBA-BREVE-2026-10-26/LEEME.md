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
4. **`verificar`**, solo lectura: lee por la API lo preparado y lo compara con `esperado.mjs`.

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
- **un hueco**: el 22/10, Dos no registró nada. No es cero, y la línea no lo une;
- **un registro incompleto**: el 24/10, el almuerzo de Dos se registró sin cantidades. Ese día es un subtotal, y la
  comida tiene indicado pero no tiene número registrado.

## Lo comprobado automáticamente

_Se completa al terminar la preparación._

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
