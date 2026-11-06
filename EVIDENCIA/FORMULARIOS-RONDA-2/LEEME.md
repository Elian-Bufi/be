# Formularios, ronda 2 · la publicación de la APK 0.21.0-candidata.1 y la prueba de Dirección

**Dónde estamos.** WP-FORMULARIOS-RONDA-2 (DL-165) está integrado en `main` (`bdbf490`, #237, 2026-11-05), y la API y el
website de `test` lo sirven desde ese día, con las migraciones aplicadas. La APK que responde los formularios nuevos y
trae «Mis hábitos», la **0.21.0-candidata.1**, está publicada como prerelease para probarla en el teléfono. **La estable
sigue siendo la 0.13.2:** `releases/latest` no cambió. Falta la prueba de Dirección en el teléfono y en el escritorio
(abajo, con su tabla de resultados).

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

## Lo que queda pendiente

- **La prueba de Dirección**, con la tabla de arriba. Promover la candidata a estable sigue la regla de DL-152: no antes
  de la prueba de punta a punta en el teléfono, y solo con el «pasala a estable» de Dirección.
- **Ratificar las decisiones del FR-10**, D-14 a D-19 de DL-165 (`docs/DEUDA_LEGAJO.md`).
- **La pregunta por un profesional nuevo, en el teléfono** (TEST-FR2-009): la API, el dominio y la lógica de la APK la
  prueban, pero la guía no la recorre. Hace falta una cuenta con un profesional que se vincule después de compartir.
- **Sacar la 0.20.0-candidata.1 de `VIGENTES`** cuando Dirección actualice su teléfono: lo decide Dirección.
- **Las herramientas del AAB en `main`:** se integran con #223, que sigue en borrador. La candidata las trae por la
  unión `a991ef8`.
- **La revisión legal** del texto del permiso (`habitos-compartidos-2026-11-propuesta`, una propuesta) y de D-9, fuera
  del repo público. Con personas reales, solo después de esa revisión y del gate del 08 §42.
