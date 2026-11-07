# Formularios, ronda 2 · la publicación de las APK 0.21.0-candidata.1 y 0.22.0-candidata.1 y la prueba de Dirección

**Dónde estamos.** WP-FORMULARIOS-RONDA-2 (DL-165) está integrado en `main` (`bdbf490`, #237, 2026-11-05), y la API y el
website de `test` lo sirven desde ese día, con las migraciones aplicadas. La APK que responde los formularios nuevos y
trae «Mis hábitos», la **0.21.0-candidata.1**, está publicada como prerelease para probarla en el teléfono. **La estable
sigue siendo la 0.13.2:** `releases/latest` no cambió. Falta la prueba de Dirección en el teléfono y en el escritorio
(abajo, con su tabla de resultados).

**2026-11-06 · la ronda 2.1.** Dirección decidió «Tus hábitos» como formulario aparte y «Pedir acceso a sus hábitos» (DL-165,
D-15 y D-17 nuevas). Está integrada en `main` (`67d7f61`, #241), y la API y el website de `test` la sirven, con las
migraciones aplicadas. La APK que la trae, la **0.22.0-candidata.1**, está publicada como prerelease; la estable sigue siendo
la 0.13.2. Su publicación y su guía están más abajo, en «La publicación de la 0.22.0-candidata.1» y «La prueba de la 0.22».

## La publicación

| Dato | Valor |
|---|---|
| Archivo | `be-0.21.0-candidata.1-b5bc929.apk` |
| SHA-256 | `5685c8d74dc5c3c63b5e5a8d608702eafaf6bda436a981b9d1f20273ea2d9481` |
| Tamaño | 84.418.981 bytes |
| Versión | `0.21.0-candidata.1`, versionCode 34 (la 0.20.0-candidata.1 tenía 33) |
| Commit construido | `b5bc9291bf861e717732e59b2de4b0a3c640f70c`, en la rama `aab/candidata-0.21.0-1`: `main` en `bdbf490` (#237) + `a991ef8` (la unión de #223: el flujo del AAB sin firma y sus herramientas) + `b5bc929` (la versión, que solo cambia `apps/mobile/app.config.ts`) |
| Entrega | La prerelease `be-apk-0.21.0-candidata.1`, con el APK y su `.sha256`: https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.21.0-candidata.1 |

## Qué trae respecto de la 0.20.0-candidata.1

- **Una parte por pantalla** (D-1): «Parte 2 de 7», «Anterior», «Siguiente» y un repaso antes de enviar. Si queda una
  obligatoria sin responder, avisa y deja seguir.
- **Las ayudas, plegadas** (D-2 y D-3): «¿Para qué?» en cada pregunta, «Quitar respuesta» en las opcionales con algo
  elegido, y «queda como declarado por vos» una sola vez, al empezar. Ningún texto dice los minutos.
- **«Antes de entrenar» v3** (D-4 a D-6): los días y el momento en una tabla; los días por semana no pasan de los
  marcados; cada otra actividad dice qué días y en qué momento; el embarazo ya no viene pedido, y tampoco en «Cómo comés
  hoy» v2.
- **«Mis hábitos»**, en «Información» (D-9): el sueño, el día, la actividad y el estrés se cuentan una vez para los dos
  formularios, y el segundo pregunta «¿sigue igual?». Se comparten con los profesionales que la persona elige y se deja
  de compartir cuando quiere. El texto del permiso es una propuesta, pendiente de validación jurídica: solo para datos
  inventados.
- **El borrador ya no se pierde** (FR-01): si se cierra la app a mitad de un formulario, al volver está lo escrito,
  guardado cifrado en el teléfono.
- **Los formularios que se pidan desde ahora solo se ven en esta versión** (D-10): son de formato 3. La 0.20 sigue
  viendo los que ya estaban pedidos.

## Construcción y firma

El mismo camino que la 0.20.0-candidata.1: GitHub Actions construye **sin firma** y la PC de Dirección firma y verifica.
La keystore no sale de esa PC. Las herramientas (`scripts/aab/*`) viven en la rama de #223 y en la de la candidata,
todavía no en `main`.

1. **AAB sin firma** en la corrida 42127789684 de `aab-sin-firma.yml` (push a `aab/candidata-0.21.0-1`), en 11 minutos
   (10 de construcción, según `construccion.json`). `be-0.21.0-candidata.1-b5bc929-sin-firma.aab`, 57.913.000 bytes,
   SHA-256 `0366f6e739fa53d685e34e2a08e73cb624e3d61d7906715981c521d597117bae`. Es la misma huella que imprime el
   registro de la corrida, y el artefacto se borró de GitHub.
2. **Firma** con `scripts/aab/firmar-aab.mjs` y la keystore de EAS desde el respaldo de Dirección. Las 1.303 entradas
   quedaron iguales y solo se agregaron `META-INF/MANIFEST.MF`, `BE.SF` y `BE.RSA`. El AAB firmado,
   `be-0.21.0-candidata.1-b5bc929.aab`, pesa 58.034.333 bytes, con SHA-256
   `578997b48909e713b20bf22bb8bc82f205e5785946763d3820af9c68dd63552e`, y lleva el certificado `61569691…893e06`.
3. **Verificación del AAB** con `scripts/aab/verificar-aab.mjs`, con los valores del respaldo: **todo bien, 21 de 21.**
   Revisó:
   - el paquete, la versión y el versionCode;
   - targetSdk 36;
   - el App Link de la invitación y el esquema `be`;
   - el certificado;
   - las bibliotecas nativas sin comprimir y alineadas a 16 KB;
   - Firebase y Google;
   - el ambiente `test`, el commit y el árbol limpio;
   - `assetlinks.json` publicado;
   - ninguna credencial en el bundle.
4. **La APK universal** con `scripts/aab/apk-desde-aab.mjs`: bundletool sin firma y apksigner con solo el esquema v2,
   tomando como referencia la 0.20.0-candidata.1. **Todo bien, 23 de 23.** Revisó:
   - el mismo certificado y un solo firmante;
   - las 1.266 entradas, iguales a las de la universal;
   - un versionCode mayor (34 contra 33);
   - los mismos 10 permisos y las mismas ABI;
   - el App Link y Firebase;
   - zipalign a 16 KB;
   - la configuración embebida (`test`, la API de test y el commit `b5bc929`);
   - ninguna credencial entre los 1.266 archivos descomprimidos.

   Tardó 19,7 s. Con 714 MB libres al empezar se corrió con `--memoria-minima 650`; la mínima entre pasos fue 677 MB.
5. **Publicación.** Se comprobó después:
   - el tag `be-apk-0.21.0-candidata.1` apunta a `b5bc929`;
   - `releases/latest` sigue en `be-apk-0.13.2`;
   - la descarga pública da el mismo SHA-256.

Los registros, sin secretos y con el client ID web de Google tapado, están en `publicacion-0.21.0-candidata.1/`:
`construccion.json`, `esperado.json`, `firma.json`, `verificacion.json` y `verificacion.md` (el AAB), `apk.json` (la
APK) y los tres `.sha256`. Salvo el client ID, son copias exactas de los de la PC de Dirección.

## Las lecturas congeladas (DL-152)

`packages/domain/fixtures/lecturas-de-la-apk/0.21.0-candidata.1.json`, generado desde el tag con
`scripts/congelar-lo-que-lee-la-apk.mjs`. Se sumó a `VIGENTES` sin sacar la 0.20.0-candidata.1, que Dirección tiene
instalada hasta que actualice.
- **Lee 86 operaciones:** las 82 de la 0.20 y API-HBT-01 a 04, las de la persona. API-HBT-05 es del profesional y la
  llama el website.
- **Declara `forms-format-3`** además de `training-set-targets-1`. Por eso la API le entrega las versiones de formato 3.
- **Cambian cuatro lecturas de FRI, por el formato 3:** FRI-01 y FRI-03 leen el renglón con varias opciones, «pedida por
  defecto» y el tope de un número en una tabla; FRI-04 y FRI-05 lo mandan.
- **Suma un texto,** `HABITOS_COMPARTIDOS`, el del permiso para compartir los hábitos. El sobre de error y los detalles
  de rechazo son los mismos.
- **El script tenía una falla, corregida en este PR:** leía las capacidades solo escritas en el lugar, y la 0.21 las
  declara en una constante. Así congelaba la 0.21 sin `X-BE-Capabilities`, sin avisar, y la prueba habría pedido como
  una APK que no lee el formato 3. Ahora lee las dos formas y se niega si no sabe. La 0.20 sale idéntica byte a byte.
- **Sus escenarios** están en `test/integration/lecturas-de-las-apk.int-spec.ts`:
  - el formato 3: la bandeja, las dos versiones del catálogo, el tope de días, el renglón con varias opciones, lo
    cargado, «No es correcto», rectificar y la parte «Tus hábitos»;
  - «Mis hábitos»: contarlos, compartirlos, una profesional que llega después, un vínculo en pausa y dejar de compartir.

Los oráculos TEST-FR2-001 a 010 están escritos en `docs/paquetes/WP-FORMULARIOS-RONDA-2-ORACULOS.md`.

## La prueba de Dirección

*(2026-11-06: esta guía, la de la 0.21, la reemplaza «La prueba de la 0.22», más abajo. Al revisar la de la 0.22 contra el
código se vio que en esta pasa lo mismo: «Antes de entrenar», pedido con «Abrir Entrenamiento» → «Pedir
información», viene con las seis preguntas de DL-100. Son cuatro partes, sin la tabla de días ni la parte «Tus hábitos».)*

Con la computadora y el teléfono, en `test` y **con datos inventados**: `test` es solo para datos sintéticos. Las cuentas
son las de la prueba breve (`EVIDENCIA/PRUEBA-BREVE-2026-10-26/LEEME.md`). Sus credenciales están solo en
`BE-datos-locales\prueba-test\cuentas.env`, en la PC de Dirección: `PRO_` es «Lic. Prueba Dos Áreas»; `ASE_UNO_`,
«Prueba Uno»; y `ASE_DOS_`, «Prueba Dos».

La guía se escribió desde el código. Antes de copiarla se verificó cada rótulo en el código de la candidata (la APK en
`b5bc929`, el website en `bdbf490`), y todos existen. Seis pasos se ajustaron para que digan lo que muestra la app:
- Parte 1: la bienvenida se ve con la sesión cerrada.
- Parte 2: lo recuperado se ve al abrir de nuevo la solicitud, y la otra actividad está en «Tus hábitos».
- Parte 3: el botón de la tarjeta es «Ver mis hábitos», y el de compartir, «Compartir mis hábitos».
- Parte 5: al enviar, el website vuelve a Nutrición.

**Parte 1 · Instalar** (teléfono)
1. Abrir https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.21.0-candidata.1 y bajar `be-0.21.0-candidata.1-b5bc929.apk`.
2. Instalarla encima de la 0.20, sin desinstalar.
3. La bienvenida dice «app 0.21.0-candidata.1 · test · commit b5bc929». Se ve con la sesión cerrada: al instalar encima, la sesión sigue abierta.

**Parte 2 · Responder por partes** («Antes de entrenar», Prueba Uno)
1. **Computadora:** entrar a https://be-web-1ngj.onrender.com/pro con «Lic. Prueba Dos Áreas» (`PRO_`) y abrir a Prueba Uno. En la tarjeta de Entrenamiento, «Abrir Entrenamiento» → «Pedir información»: ya viene «Antes de entrenar». El embarazo viene sin marcar. «Enviar solicitud».
2. **Teléfono, con Prueba Uno (`ASE_UNO_`):** Inicio → «Para responder» → «Completar».
   - Pasar las partes con «Siguiente» («Parte N de 7»).
   - Abrir un «¿Para qué?».
   - En una pregunta opcional, elegir algo y probar «Quitar respuesta».
   - En «¿Qué días y en qué momento podés?», marcar 3 días y poner 5 en los días por semana: tiene que avisar.
   - En «¿Hacés ejercicio, deporte u otra actividad en la semana?» (parte «Tus hábitos»), elegir «Sí» y, en «Contame cuáles», cargar una con sus días y su momento.
   - A mitad, cerrar la app desde Recientes, volver a abrirla y abrir de nuevo la solicitud: tiene que decir «Recuperamos lo que habías escrito».
   - Al final, «Repasar» y enviar.
3. **Computadora:** actualizar. La Línea de tiempo muestra «Formulario pedido» y «Formulario respondido».

**Parte 3 · Mis hábitos y compartirlos** (Prueba Uno)
1. **Teléfono:** «Información» → «Ver mis hábitos», en la tarjeta «Mis hábitos». Están el sueño, el día y la semana que respondiste.
2. En «Compartir mis hábitos con mis profesionales», «Compartir mis hábitos» → leer el texto → «Acepto y comparto», con Lic. Prueba Dos Áreas marcado.
3. **Computadora:** en la página «Información» de Prueba Uno («Más» → «Pedir información», y cerrar el pedido), aparece «Sus hábitos · Compartido por la persona el …».
4. **Teléfono:** «Dejar de compartir» y confirmar. **Computadora:** actualizar; la tarjeta desaparece.

**Parte 4 · «¿Sigue igual?»** (Prueba Uno)
1. **Computadora:** volver a pedirle «Antes de entrenar» a Prueba Uno.
2. **Teléfono:** abrirlo. En «Tus hábitos» dice «Ya lo respondiste el …: ¿sigue igual?», con las respuestas anteriores.

**Parte 5 · Cargar con la persona** («Cómo comés hoy», Prueba Dos)
1. **Computadora:** abrir a Prueba Dos. En la tarjeta de Nutrición, «Abrir Nutrición» → «Pedir información»: ya vienen «Cómo comés hoy» y el «para qué». Mirar la cuenta de obligatorias. Enviar.
2. Al enviar, la página vuelve a Nutrición. Con «Más» → «Pedir información», cerrar el pedido y, en «Solicitudes», abrirla: «Cargar con la persona» está arriba. Cargar algunas partes y enviarla.
3. **Teléfono, con Prueba Dos (`ASE_DOS_`):** «Revisar» y confirmar.

**Parte 6 (opcional) · TalkBack:** recorrer una parte, un «¿Para qué?» y el texto del permiso de los hábitos.

**Si algo de la guía no coincide con la app,** anotalo como resultado: la guía se escribió desde el código, sin ver la 0.21 en un teléfono.

El límite de inicios de sesión es de 5 intentos cada 15 minutos por red y por cuenta (DL-015). Si una cuenta se bloquea,
hay que esperar 15 minutos.

### Resultados

| Parte | Paso | Qué se vio | ¿Como se esperaba? | Observación |
|---|---|---|---|---|
| 1 | Instalar encima y la bienvenida | | | |
| 2 | Pedir «Antes de entrenar», con el embarazo sin marcar | | | |
| 2 | Las partes, «Siguiente» y «Parte N de 7» | | | |
| 2 | «¿Para qué?» y «Quitar respuesta» | | | |
| 2 | Tres días marcados y cinco por semana | | | |
| 2 | Otra actividad, con sus días y su momento | | | |
| 2 | Cerrar desde Recientes y volver | | | |
| 2 | «Repasar» y enviar | | | |
| 2 | La Línea de tiempo en el escritorio | | | |
| 3 | «Mis hábitos» | | | |
| 3 | Compartirlos | | | |
| 3 | «Sus hábitos» en el escritorio | | | |
| 3 | Dejar de compartir | | | |
| 4 | «¿Sigue igual?» | | | |
| 5 | Pedir «Cómo comés hoy» y la cuenta de obligatorias | | | |
| 5 | Cargar con la persona, por partes | | | |
| 5 | Revisar y confirmar en el teléfono | | | |
| 6 | TalkBack | | | |

## La publicación de la 0.22.0-candidata.1

| Dato | Valor |
|---|---|
| Archivo | `be-0.22.0-candidata.1-1254269.apk` |
| SHA-256 | `8706fd1bf598d6b8d56ac5db24a12bdeb79765c3154ecd8afb2cd2fd4afcea86` |
| Tamaño | 84.451.749 bytes |
| Versión | `0.22.0-candidata.1`, versionCode 35 (la 0.21.0-candidata.1 tenía 34) |
| Commit construido | `1254269843c2dcd4270df349e48d2a59e1b450df`, en la rama `aab/candidata-0.22.0-1`: `main` en `67d7f61` (#241) + `7d339e6` (la unión de #223: el flujo del AAB sin firma y sus herramientas) + `1254269` (la versión, que solo cambia `apps/mobile/app.config.ts`) |
| Entrega | La prerelease `be-apk-0.22.0-candidata.1`, con el APK y su `.sha256`: https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.22.0-candidata.1 |

El mismo camino que la 0.21: GitHub Actions construye **sin firma** y la PC de Dirección firma y verifica. La keystore no
sale de esa PC.

1. **AAB sin firma** en la corrida 42163070554 de `aab-sin-firma.yml` (push a `aab/candidata-0.22.0-1`), en 10 minutos
   (9 de construcción, según `construccion.json`). `be-0.22.0-candidata.1-1254269-sin-firma.aab`, 57.923.079 bytes,
   SHA-256 `402c94bdb34dbf60a1f7c250043e5f12e0fe470e01127d8358cef997769a8992`. Es la misma huella que imprime el
   registro de la corrida, y el artefacto se borró de GitHub.
2. **Firma** con `scripts/aab/firmar-aab.mjs` y la keystore de EAS desde el respaldo de Dirección. Las 1.303 entradas
   quedaron iguales y solo se agregaron `META-INF/MANIFEST.MF`, `BE.SF` y `BE.RSA`. El AAB firmado,
   `be-0.22.0-candidata.1-1254269.aab`, pesa 58.044.413 bytes, con SHA-256
   `30cb860ebdab9ad252b0e25a125a0ff1f6358f700d875b782e15e7e631e4e6f7`, y lleva el certificado `61569691…893e06`.
3. **Verificación del AAB** con `scripts/aab/verificar-aab.mjs`: **todo bien, 21 de 21**, las mismas comprobaciones que en
   la 0.21.
4. **La APK universal** con `scripts/aab/apk-desde-aab.mjs`, tomando como referencia la 0.21.0-candidata.1: **todo bien,
   23 de 23.** El mismo certificado y un solo firmante; las 1.266 entradas, iguales a las de la universal; un versionCode
   mayor (35 contra 34); los mismos 10 permisos y las mismas ABI; ninguna credencial entre los 1.266 archivos
   descomprimidos.

   Tardó 18,7 s. Con 756 MB libres al empezar se corrió con `--memoria-minima 650`, que el script exige al arrancar; la
   mínima entre pasos fue 620 MB.
5. **Publicación.** Se comprobó después:
   - el tag `be-apk-0.22.0-candidata.1` apunta a `1254269`;
   - `releases/latest` sigue en `be-apk-0.13.2`;
   - la descarga pública da el mismo SHA-256, y GitHub informa esa huella para el archivo de la prerelease.

Los registros, sin secretos y con el client ID web de Google tapado, están en `publicacion-0.22.0-candidata.1/`:
`construccion.json`, `esperado.json`, `firma.json`, `verificacion.json` y `verificacion.md` (el AAB), `apk.json` (la
APK) y los tres `.sha256`. Salvo el client ID, son copias exactas, byte por byte, de los de la PC de Dirección.

### Las lecturas congeladas de la 0.22 (DL-152)

`packages/domain/fixtures/lecturas-de-la-apk/0.22.0-candidata.1.json`, generado desde el tag con
`scripts/congelar-lo-que-lee-la-apk.mjs`. Se sumó a `VIGENTES` sin sacar la 0.20.0-candidata.1 ni la 0.21.0-candidata.1,
porque Dirección todavía no actualizó.
- **Lee 88 operaciones:** las 86 de la 0.21, todas con la misma forma, y API-HBT-08 y 09, las de la persona que responden
  un pedido de acceso (los pedidos que esperan, y «Sí, que los vea» o «No, por ahora»). API-HBT-06 y 07 son del
  profesional y las llama el website.
- **Las cabeceras, los textos, el sobre de error y los detalles de rechazo son los de la 0.21.** Declara
  `training-set-targets-1` y `forms-format-3`.
- **La novedad del pedido no cambia ninguna lectura:** en el centro de novedades, el tipo y la vista ya eran texto. La 0.22
  la destaca por su tipo y la abre en «Mis hábitos», con el pedido.
- **Su escenario** está en `test/integration/lecturas-de-las-apk.int-spec.ts`: la novedad que abre «Mis hábitos», «No,
  por ahora», «Sí, que los vea» sin compartir todavía y con la autorización activa, y los pedidos que ya no esperan.

Los oráculos de la ronda 2.1, TEST-FR2-011 a 016, están en `docs/paquetes/WP-FORMULARIOS-RONDA-2-ORACULOS.md`.

## La prueba de la 0.22

**Qué cambia respecto de la 0.21** (la ronda 2.1, DL-165; `docs/paquetes/WP-FORMULARIOS-RONDA-2.md` §8):
- **«Tus hábitos» es un formulario aparte** (D-15 nueva). Lo pide cualquiera de los dos profesionales, desde su área, y lo
  puede volver a pedir. «Antes de entrenar» (v4) y «Cómo comés hoy» (v3) ya no traen esa parte: tienen seis partes.
- **Al pedir un formulario de área, el escritorio sugiere «Sumar «Tus hábitos»»**: marcada si el profesional no tiene los
  hábitos de la persona o si tienen más de 3 meses; sin marcar, con su fecha, si son recientes o si ya se los pidió y
  esperan su respuesta.
- **«Pedir acceso a sus hábitos»** (D-17 nueva): si la persona no se los comparte, el profesional se lo pide, y a ella le
  llega una novedad destacada como «Importante». Responde «Sí, que los vea» o «No, por ahora», y lo puede cambiar cuando
  quiera. El profesional puede volver a pedirlo a los 7 días.

**Antes de empezar:**
- La 0.22 está publicada como prerelease (arriba, «La publicación de la 0.22.0-candidata.1»). Con la sesión cerrada, la
  bienvenida dice «app 0.22.0-candidata.1 · test · commit 1254269».
- El website y la API de `test` sirven `main` en `67d7f61`, con las tres migraciones de la ronda 2.1 aplicadas: lo dicen
  el estado de la API y la identidad del build del website («web 0.11.1 · commit 67d7f61»), mirados el 2026-11-06.
- Las cuentas son las de la guía de la 0.21: `PRO_` es «Lic. Prueba Dos Áreas», `ASE_UNO_` es «Prueba Uno» y `ASE_DOS_` es
  «Prueba Dos». Sus credenciales están solo en `BE-datos-locales\prueba-test\cuentas.env`. Todo con datos inventados.
- **Si Prueba Uno todavía le comparte sus hábitos a Lic. Prueba Dos Áreas,** primero: «Información» → «Ver mis hábitos» →
  «Dejar de compartir» y confirmar. Si los comparte, «Pedir acceso a sus hábitos» no aparece: no hay nada que pedir. Lo
  mismo con Prueba Dos, para la Parte 5.
- Con estas cuentas, Lic. Prueba Dos Áreas acompaña a Prueba Uno solo en Entrenamiento y a Prueba Dos solo en Nutrición
  (`EVIDENCIA/PRUEBA-BREVE-2026-10-26/LEEME.md`). Por eso cada pedido de acceso sale de esa área.
- Para ver el aviso en el teléfono, los avisos tienen que estar activos en Prueba Uno y en Prueba Dos («Cuenta» → «Avisos
  en este teléfono»).

Cada rótulo de esta guía se verificó en el código de la rama `wp-habitos-formulario-aparte`: el website en
`apps/web/src/app/pro/advisees/forms/` y `seguimiento/resumen-area.tsx`, la APK en `apps/mobile/src/pantallas/`, y los
textos en `packages/domain/src/copy-habitos-de-la-persona.ts`, `copy-novedades.ts` y `copy-formularios.ts`. Respecto de la
guía de la 0.21 cambió esto:
- Parte 2: «Antes de entrenar» ya no trae «Tus hábitos», así que la otra actividad con sus días se carga en el formulario
  «Tus hábitos», no en «Antes de entrenar». «Tus hábitos», que tiene una sola parte, no muestra el número.
- Parte 4: «¿Sigue igual?» ya no se prueba pidiendo de nuevo «Antes de entrenar», sino volviendo a pedir «Tus hábitos».
- Parte 3: el texto del permiso se acepta también desde un pedido («Sí, que los vea»), no solo desde «Compartir mis hábitos».

**2026-11-06 · revisada contra lo publicado.** Se volvió a verificar cada rótulo y cada paso en el código de la publicación:
la APK en `1254269` (el tag) y el website en `67d7f61`. Se corrigió esto:
- Parte 2: «Antes de entrenar», pedido desde Entrenamiento, viene con las seis preguntas de DL-100, no con todas. Son cuatro
  partes («Parte N de 4»), sin la tabla de días, y con eso no hay tope ni «Quitar respuesta», que se ofrece solo en
  preguntas opcionales de elegir. Por eso la guía marca a mano «¿Qué días y en qué momento podés?», sin hacerla
  obligatoria.
  - **Desde la integración de este cambio** (DL-165 D-29, ratificada por Dirección el 2026-11-06: «Que venga
    completo»; rama `wp-entrenamiento-pedido-completo`), «Antes de entrenar» llega completo desde Entrenamiento, como
    desde «Más»: la Parte 2 tiene, en los pasos 1 y 6, lo que se hace en cada caso. Cuál toca se ve en el mismo cajón:
    si en «Qué preguntas» dice «Vienen todas elegidas: desmarcá las que no necesites.», el cambio ya está.
- Parte 2: el motivo «Ya tenés sus hábitos del …» sale solo si respondió un formulario que pedía preguntas de «Tus
  hábitos». Con una solicitud esperando, la casilla también viene sin marcar: hay que marcarla en los dos casos. En «Para
  responder» puede quedar otra solicitud de la prueba de la 0.21.
- Parte 2 y Parte 4: el botón para enviar un formulario es «Enviar respuesta».
- Parte 3: con estas cuentas no aparece «Se lo pedís desde …», que sale solo con más de un área.
- Parte 4: «Tus hábitos» no tiene área propia: hay que elegir Entrenamiento.
- Parte 5: el pedido de Inicio está en una tarjeta propia, «Te piden ver tus hábitos». El aviso «Solo … los va a ver»
  depende de que haya otro profesional. Si Prueba Dos no contó sus hábitos, la tarjeta del escritorio dice las dos cosas.
- Parte 3: con una sola área, la novedad dice el área y el para qué de Entrenamiento.
- Parte 7: decía «Cambiar con quiénes», que solo aparece si ya comparte, y se hacía al final, cuando ya no queda ningún
  pedido sin responder. Ahora va con un segundo teléfono, intercalada en la Parte 3 y en la Parte 4.

**Parte 1 · Instalar** (teléfono)
1. Abrir https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.22.0-candidata.1 y bajar `be-0.22.0-candidata.1-1254269.apk`.
2. Instalarla encima de lo que haya (la 0.21 o la 0.20), sin desinstalar.
3. La bienvenida dice «app 0.22.0-candidata.1 · test · commit 1254269». Se ve con la sesión cerrada: al instalar encima, la
   sesión sigue abierta.

**Parte 2 · Pedir «Antes de entrenar» y sumar «Tus hábitos»** (Prueba Uno)
1. **Computadora:** entrar a https://be-web-1ngj.onrender.com/pro con «Lic. Prueba Dos Áreas» (`PRO_`) y abrir a Prueba Uno.
   En la tarjeta de Entrenamiento, «Abrir Entrenamiento» → «Pedir información»: ya viene «Antes de entrenar».
   - **Desde la integración de este cambio** (DL-165 D-29): viene completo. Arriba dice «Viniste desde Entrenamiento: el
     formulario y el «para qué» ya están elegidos. Podés cambiarlos antes de enviar.», y en «Qué preguntas», «Vienen
     todas elegidas: desmarcá las que no necesites.». Están marcadas todas menos el embarazo, que viene sin marcar.
     «¿Qué días y en qué momento podés?» (en «Tu semana para entrenar») ya viene marcada y obligatoria: no hay que
     tocar nada.
   - Antes de esa integración (con el website en `67d7f61`): vienen las seis preguntas de Entrenamiento marcadas. En la
     lista de preguntas, marcar también «¿Qué días y en qué momento podés?» (en «Tu semana para entrenar»), sin marcarla
     como obligatoria.
2. Debajo de la lista de formularios, la casilla **«Sumar «Tus hábitos»»**, con «Es un formulario aparte, con su sueño, su
   día, su actividad y su semana. Se envía junto con este, como otra solicitud.». Debajo dice por qué viene así:
   - «Todavía no tenés sus hábitos.» o «Los hábitos que ves son del …: tienen más de 3 meses.»: viene marcada.
   - «Ya tenés sus hábitos del ….»: viene sin marcar. Pasa solo si Prueba Uno ya le respondió un formulario que pedía
     preguntas de «Tus hábitos».
   - «Ya le pediste sus hábitos el …: esperan su respuesta.»: viene sin marcar.

   Si viene sin marcar, por cualquiera de los dos motivos, marcala igual, para probar el envío de las dos.
3. «Enviar solicitud». La página vuelve a Entrenamiento y dice «Listo: enviaste «Antes de entrenar» y «Tus hábitos».».
4. **Teléfono, con Prueba Uno (`ASE_UNO_`):** Inicio → «Para responder». Están las dos de hoy: «Antes de entrenar» y «Tus
   hábitos». Puede haber otra, de la prueba de la 0.21, sin responder.
5. «Tus hábitos» → «Completar»:
   - es una sola pantalla, sin «Parte 1 de 1»;
   - si ya había hábitos, arriba dice «Ya lo respondiste el …: ¿sigue igual?», con lo vigente cargado;
   - en «¿Hacés ejercicio, deporte u otra actividad en la semana?», elegir «Sí» y, en «Contame cuáles», cargar una con sus
     días y su momento;
   - «Repasar» y «Enviar respuesta».
6. «Antes de entrenar» → «Completar»:
   - **desde la integración de este cambio** (DL-165 D-29), pasar las partes con «Siguiente» («Parte N de 6»: «Tu salud
     antes de entrenar», «Dolor y lesiones», «Tu experiencia», «Lo que buscás», «Tu semana para entrenar» y «Tus
     preferencias»); antes, eran cuatro («Parte N de 4»: de «Tu experiencia» a «Tus preferencias»). En los dos casos, no
     hay ninguna «Tus hábitos»;
   - abrir un «¿Para qué?»;
   - **desde la integración de este cambio**, «¿Qué días y en qué momento podés?» viene obligatoria, y ahí no está
     «Quitar respuesta»: marcar 3 días, y probar «Quitar respuesta» en «¿Qué actividad aeróbica te gusta?» (en «Tus
     preferencias»), que es opcional, después de elegir una. Antes, la tabla venía opcional: marcar 3 días y probar ahí
     «Quitar respuesta»;
   - con los 3 días marcados (si se quitaron, volver a marcarlos), poner 5 en los días por semana: tiene que avisar;
   - a mitad, cerrar la app desde Recientes, volver a abrirla y abrir de nuevo la solicitud: tiene que decir «Recuperamos lo
     que habías escrito»;
   - al final, «Repasar» y «Enviar respuesta».
7. «Información» → «Ver mis hábitos»: lo que respondió en «Tus hábitos», con «Así quedaron el …, en un formulario.».
8. **Computadora:** actualizar. La Línea de tiempo muestra los dos formularios pedidos y respondidos.

**Parte 3 · Pedir acceso y decir «No, por ahora»** (Prueba Uno)
1. **Computadora:** en la ficha de Prueba Uno, «Más» → «Pedir información», y cerrar el pedido. En «Información» está la
   tarjeta **«Sus hábitos»**, con «Por ahora no te comparte sus hábitos. Es su decisión.» y «Si le pedís acceso, le llega
   como una novedad importante en su app, con tu nombre y para qué te sirven. Puede decir que sí o que no, y cambiarlo cuando
   quiera.». Con estas cuentas la acompaña solo en Entrenamiento, así que el pedido sale de ahí. Si la acompañara en más de
   un área, diría «Se lo pedís desde …».
2. «Pedir acceso a sus hábitos». Dice «Listo: le pediste acceso. Lo decide la persona.» y «Le pediste acceso el …. Lo decide
   la persona.». El botón ya no está: dice «Podés volver a pedirlo desde el …», a los 7 días.
3. **Teléfono:** si los avisos están activos, llega «Tenés una novedad.», sin nombres ni datos.
4. La campana de la cabecera → Novedades. Está **«Te piden ver tus hábitos»**, con «Importante»: «Lic. Prueba Dos Áreas, de
   Entrenamiento, te pide ver tus hábitos. Le ayuda a armar un plan de entrenamiento que entre en tu semana. Es tu decisión:
   lo respondés en «Mis hábitos».». Tocarla.
5. Abre «Mis hábitos». Arriba, «Te piden ver tus hábitos»: quién pide, para qué le sirve, «Te lo pidió el …», «Vería tus
   hábitos vigentes: tu sueño, tu día, tu actividad y tu semana. No ve tu salud ni el resto de tus formularios.», «Es tu
   decisión. La podés cambiar cuando quieras, acá en «Mis hábitos».» y dos botones iguales: «Sí, que los vea» y «No, por
   ahora».
6. «No, por ahora». Arriba dice «Listo: por ahora, Lic. Prueba Dos Áreas no los ve. Lo podés cambiar cuando quieras.», y el
   pedido desaparece.
7. **Computadora:** actualizar. La tarjeta sigue sin hábitos y dice «Le pediste acceso el ….» y «Podés volver a pedirlo
   desde el …». No dice qué respondió la persona.

**Parte 4 · Cambiar de opinión, y «¿Sigue igual?»** (Prueba Uno)
1. **Teléfono:** en «Mis hábitos», «Compartir mis hábitos con mis profesionales» → «Compartir mis hábitos». Viene marcado
   Lic. Prueba Dos Áreas. Leer el texto → «Acepto y comparto».
2. **Computadora:** actualizar. La tarjeta «Sus hábitos» muestra «Compartido por la persona el …» y los hábitos.
3. Volver a pedirle **solo «Tus hábitos»**: «Más» → «Pedir información» → elegir «Tus hábitos» y, en el área,
   Entrenamiento → «Enviar solicitud». «Tus hábitos» no tiene área propia: con un área en la que no la acompaña, no se
   puede pedir.
4. **Teléfono:** abrir «Tus hábitos». Dice «Ya lo respondiste el …: ¿sigue igual?», con las respuestas anteriores. Cambiar una
   cosa, «Repasar» y «Enviar respuesta».
5. **Computadora:** actualizar. «Sus hábitos» muestra el cambio, «Actualizados el …, en un formulario.».
6. **Teléfono:** «Mis hábitos» → «Dejar de compartir» y confirmar. **Computadora:** actualizar. La tarjeta vuelve a decir
   «Por ahora no te comparte sus hábitos. Es su decisión.».

**Parte 5 · Pedir acceso y decir «Sí, que los vea», y cargar con la persona** (Prueba Dos)
1. **Computadora:** abrir a Prueba Dos. «Más» → «Pedir información», cerrar el pedido y, en «Sus hábitos», «Pedir acceso a
   sus hábitos».
2. **Teléfono, con Prueba Dos (`ASE_DOS_`):** en Inicio aparece una tarjeta propia, «Te piden ver tus hábitos», con quién
   pide, para qué le sirve y «Es tu decisión…». «Responder» abre «Mis hábitos», con el pedido arriba.
3. «Sí, que los vea». Aparece el texto del permiso entero, con «Texto propuesto, pendiente de validación jurídica.» →
   «Acepto y comparto». Arriba dice «Listo: Lic. Prueba Dos Áreas ya ve tus hábitos.».

   Si Prueba Dos todavía no comparte y tiene otro profesional, el «Sí» avisa antes «Solo Lic. Prueba Dos Áreas los va a ver.
   A tus otros profesionales los podés sumar cuando quieras.». Con estas cuentas no debería aparecer, porque Prueba Dos
   tiene un solo profesional.
4. **Computadora:** actualizar. «Sus hábitos» muestra «Compartido por la persona el …» y sus hábitos. Si Prueba Dos todavía
   no los contó, debajo dice «Todavía no contó sus hábitos.».
5. En la tarjeta de Nutrición, «Abrir Nutrición» → «Pedir información»: ya vienen «Cómo comés hoy» y el «para qué», y
   «Sumar «Tus hábitos»», sin marcar si Prueba Dos ya los comparte y son recientes. Mirar la cuenta de obligatorias y
   enviar.
6. Con «Más» → «Pedir información», cerrar el pedido y, en «Solicitudes», abrir «Cómo comés hoy»: «Cargar con la persona»
   está arriba. Cargar algunas partes y enviarla.
7. **Teléfono:** «Revisar» y confirmar.

**Parte 6 (opcional) · TalkBack:** la novedad lee «Sin leer. Importante.» antes del título; los dos botones del pedido se
anuncian como botones; recorrer una parte, un «¿Para qué?» y el texto del permiso.

**Parte 7 (opcional) · Un segundo teléfono con la 0.21**, con Prueba Uno. Va intercalada en la Parte 3 y en la Parte 4:
1. Entre el paso 2 y el paso 6 de la Parte 3: la novedad «Te piden ver tus hábitos» se ve con su texto, sin «Importante». Al
   tocarla, se queda en Novedades. No responderla en este teléfono. Después del paso 6 ya no queda ningún pedido esperando,
   y el mismo profesional no puede volver a pedir antes de 7 días.
2. Después del paso 3 de la Parte 4: abrir «Tus hábitos», que dice «Parte 1 de 1». Mirarla sin enviarla, porque se responde
   en el teléfono con la 0.22, en el paso 4.

La 0.21 también puede responder un pedido, sumando al profesional en «Mis hábitos»: con «Compartir mis hábitos» si no
comparte con nadie, o con «Cambiar con quiénes» si ya comparte con otro. Probarlo en el teléfono necesita otro pedido
esperando. Lo prueba la integración (`lecturas-de-las-apk.int-spec.ts`, con la 0.21).

**Si algo de la guía no coincide con la app,** anotalo como resultado. La guía se escribió desde el código, sin ver la 0.22 en
un teléfono.

El límite de inicios de sesión es de 5 intentos cada 15 minutos por red y por cuenta (DL-015). Si una cuenta se bloquea,
hay que esperar 15 minutos.

### Resultados de la 0.22

| Parte | Paso | Qué se vio | ¿Como se esperaba? | Observación |
|---|---|---|---|---|
| 1 | Instalar encima y la bienvenida | | | |
| 2 | «Sumar «Tus hábitos»» y su motivo | | | |
| 2 | Las dos solicitudes enviadas en un paso | | | |
| 2 | «Tus hábitos» aparte, sin «Parte 1 de 1» | | | |
| 2 | «Antes de entrenar» en sus partes (seis desde D-29; cuatro antes), «Quitar respuesta», el tope de días y lo recuperado | | | |
| 2 | «Mis hábitos» con lo respondido | | | |
| 3 | «Pedir acceso a sus hábitos» en el escritorio | | | |
| 3 | El aviso y la novedad «Importante» | | | |
| 3 | El pedido en «Mis hábitos» y «No, por ahora» | | | |
| 3 | El escritorio después del «no» | | | |
| 4 | Compartirlos desde «Mis hábitos» | | | |
| 4 | Volver a pedir «Tus hábitos» y «¿Sigue igual?» | | | |
| 4 | Dejar de compartir | | | |
| 5 | El pedido en Inicio y «Sí, que los vea» | | | |
| 5 | «Sus hábitos» en el escritorio | | | |
| 5 | «Cómo comés hoy» y cargar con la persona | | | |
| 6 | TalkBack | | | |
| 7 | La 0.21 con la novedad nueva | | | |

## Lo que queda pendiente

- **La prueba de Dirección**, con la tabla de arriba. Promover la candidata a estable sigue la regla de DL-152: no antes
  de la prueba de punta a punta en el teléfono, y solo con el «pasala a estable» de Dirección.
- **Ratificar las decisiones que quedan de DL-165** (`docs/DEUDA_LEGAJO.md`): D-19 y las de la ronda 2.1, D-20 a D-28. D-14,
  D-16 y D-18 las ratificó Dirección el 2026-11-06, y D-15 y D-17 las reemplazó ese día por las nuevas.
- **La prueba de la 0.22**, con su tabla de resultados. La 0.22 ya está construida, publicada como prerelease y con lo que
  lee congelado (DL-152).
- **La pregunta por un profesional nuevo, en el teléfono** (TEST-FR2-009): la API, el dominio y la lógica de la APK la
  prueban, pero la guía no la recorre. Hace falta una cuenta con un profesional que se vincule después de compartir.
- **Sacar la 0.20.0-candidata.1 y la 0.21.0-candidata.1 de `VIGENTES`** cuando Dirección actualice su teléfono: lo decide
  Dirección.
- **Las herramientas del AAB en `main`:** se integran con #223, que sigue en borrador. Las candidatas las traen por la
  unión: `a991ef8` en la 0.21 y `7d339e6` en la 0.22.
- **La revisión legal** del texto del permiso (`habitos-compartidos-2026-11-propuesta`, una propuesta) y de D-9, fuera
  del repo público. Con personas reales, solo después de esa revisión y del gate del 08 §42.
