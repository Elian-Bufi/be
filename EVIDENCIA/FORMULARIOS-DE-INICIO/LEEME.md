# Formularios de inicio · la publicación de la APK 0.20.0-candidata.1 y la prueba de Dirección

**Dónde estamos.** WP-FORMULARIOS-DE-INICIO (DL-164) está integrado en `main` (`92db513`, 2026-11-05), y la API y el
website de `test` lo sirven. La APK que responde los formularios nuevos, la **0.20.0-candidata.1**, está publicada como
prerelease para probarla en el teléfono. **La estable sigue siendo la 0.13.2:** `releases/latest` no cambió. Falta la
prueba de Dirección en el teléfono y en el escritorio (abajo, con su tabla de resultados).

## La publicación

| Dato | Valor |
|---|---|
| Archivo | `be-0.20.0-candidata.1-40b12e9.apk` |
| SHA-256 | `93c748c2245ce4ebe79c64487690cc1c225bdec969d72b36c4e220cb6a5ae239` |
| Tamaño | 84.337.061 bytes |
| Versión | `0.20.0-candidata.1`, versionCode 33 (la 0.19.0-candidata.1 tenía 32) |
| Commit construido | `40b12e95d0b4d0c99fc5a822e12e4e7a7c0cb661`, en la rama `aab/candidata-0.20.0-1`: `main` en `92db513` (#234) + `58f72bd` (las herramientas del AAB de #223, como en la 0.19.0-candidata.1) + `40b12e9` (la versión, que solo cambia `apps/mobile/app.config.ts`) |
| Entrega | La prerelease `be-apk-0.20.0-candidata.1`, con el APK y su `.sha256`: https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.20.0-candidata.1 |
| Autorización | La de Dirección del 2026-11-05: «Sí, integrá y publicá» |

## Qué trae respecto de la 0.19.0-candidata.1

- **«Cómo comés hoy» (Nutrición) y «Antes de entrenar» (Entrenamiento v2)**, para responder tocando: una o varias
  opciones, listas que se repiten, horarios, alimentos y tablas, con preguntas que aparecen solo cuando aplican (D-1 y
  D-2).
- **La bandeja de la persona** (API-FRI-02): en Inicio, la tarjeta «Para responder»; en la barra, «Información». Una
  solicitud con algo cargado por el profesional dice «Para confirmar» y se abre con «Revisar».
- **«Revisá lo que cargó…»** (D-4 y D-6): «Confirmo que son mis datos», «Corregir» o «No es correcto». Lo que no se
  confirma no queda en el perfil y, si se rechaza, se borra.
- **TalkBack** anuncia cada pregunta y cada error.
- Lo demás de `main` desde la 0.19.0-candidata.1 es de la API, del website o de la evidencia.

## Construcción y firma

El mismo camino que la 0.19.0-candidata.1: GitHub Actions construye **sin firma** y la PC de Dirección firma y verifica.
La keystore no sale de esa PC. Las herramientas (`scripts/aab/*`) viven en la rama de #223 y en la de la candidata,
todavía no en `main`.

1. **AAB sin firma** en la corrida 42009507187 de `aab-sin-firma.yml` (push a `aab/candidata-0.20.0-1`), en 9 min.
   `be-0.20.0-candidata.1-40b12e9-sin-firma.aab`, 57.876.883 bytes, SHA-256
   `5122ab63c036602216967891777b804bc6bb05baf4b2361f7a07ab2f9186fe47`. Se descargó con la misma huella que imprime el
   registro de la corrida, y el artefacto se borró de GitHub.
2. **Firma** con `scripts/aab/firmar-aab.mjs` y la keystore de EAS desde el respaldo de Dirección. Las 1.303 entradas
   quedaron iguales y solo se agregaron `META-INF/MANIFEST.MF`, `BE.SF` y `BE.RSA`. El AAB firmado,
   `be-0.20.0-candidata.1-40b12e9.aab`, pesa 57.998.218 bytes, con SHA-256
   `f8e874650bdcd87353f16cf4972c11848ae10c5f457e3dd74baa8f283300d71f`, y lleva el certificado `61569691…893e06`.
3. **Verificación del AAB** con `scripts/aab/verificar-aab.mjs --respaldo`: **todo bien, 21 de 21.** Revisó:
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
   tomando como referencia la 0.19.0-candidata.1 instalada. **Todo bien, 23 de 23.** Revisó:
   - el mismo certificado y un solo firmante;
   - las mismas entradas que la universal;
   - un versionCode mayor (33 contra 32);
   - los mismos 10 permisos y las mismas ABI;
   - el App Link y Firebase;
   - zipalign a 16 KB;
   - la configuración embebida (`test`, la API de test y el commit `40b12e9`);
   - ninguna credencial entre los 1.266 archivos descomprimidos.

   Tardó 23 s. Con 0,72 GB libres se corrió con `--memoria-minima 650` (en vez de 1.000); la mínima entre pasos fue
   579 MB.
5. **Publicación.** Se comprobó después:
   - el tag `be-apk-0.20.0-candidata.1` apunta a `40b12e9`;
   - `releases/latest` sigue en `be-apk-0.13.2`;
   - la descarga pública da el mismo SHA-256.

Los registros, sin secretos y con el client ID web de Google tapado, están en `publicacion-0.20.0-candidata.1/`:
`construccion.json`, `esperado.json`, `firma.json`, `verificacion.json` y `verificacion.md` (el AAB), `apk.json` (la
APK) y los tres `.sha256`.

## Las lecturas congeladas (DL-152)

`packages/domain/fixtures/lecturas-de-la-apk/0.20.0-candidata.1.json`, generado desde el tag con
`scripts/congelar-lo-que-lee-la-apk.mjs`. Lee 82 operaciones: deja FRM-02 y FRM-05 a 08 y lee FRI-01 a 05 y 08. Su
escenario está en `test/integration/lecturas-de-las-apk.int-spec.ts`. Se sumó a `VIGENTES` sin sacar las candidatas
anteriores. Los oráculos TEST-FRI-001 a 006 están escritos en `docs/paquetes/WP-FORMULARIOS-DE-INICIO-ORACULOS.md`.

## La prueba de Dirección

Con la computadora y el teléfono, en `test` y **con datos inventados**: `test` es solo para datos sintéticos. Las cuentas
son las de la prueba breve (`EVIDENCIA/PRUEBA-BREVE-2026-10-26/LEEME.md`). Sus credenciales están solo en
`BE-datos-locales\prueba-test\cuentas.env`, en la PC de Dirección. «Lic. Prueba Dos Áreas» tiene Nutrición y
Entrenamiento, y su Nutrición quedó rehabilitada después de la parte A.

**Parte 1 · Instalar** (teléfono)
1. Abrir https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.20.0-candidata.1 y descargar
   `be-0.20.0-candidata.1-40b12e9.apk`.
2. Instalarla **encima** de la que está, sin desinstalar.
3. La bienvenida dice «app 0.20.0-candidata.1 · test · commit 40b12e9».

**Parte 2 · La persona responde sola «Antes de entrenar»** (Entrenamiento, Prueba Uno)
1. En la computadora, entrar a https://be-web-1ngj.onrender.com/pro con «Lic. Prueba Dos Áreas» y abrir a «Prueba Uno».
2. Ir a la pestaña «Información» y elegir «Pedir información». Completar:
   - el formulario: «Antes de entrenar»;
   - las preguntas: vienen todas elegidas;
   - para qué y en qué área: escribir para qué lo necesitás (por ejemplo, «Para armar tu plan») y elegir Entrenamiento.

   Después, «Enviar solicitud».
3. En el teléfono, entrar con «Prueba Uno». En Inicio, la tarjeta «Para responder» trae la solicitud: «Completar».
4. Responder algunas preguntas y, a la mitad, cerrar la app y volver a abrirla: lo escrito sigue.
5. Probar una pregunta condicional: elegir una respuesta que abre otra pregunta, y después cambiarla para que se cierre.
6. «Enviar respuesta».
7. En la computadora, actualizar. La solicitud figura como respondida y se leen las respuestas en palabras.

**Parte 3 · El profesional la carga y la persona corrige y confirma** (Nutrición, Prueba Dos)
1. En la computadora, abrir a «Prueba Dos» y pedir «Cómo comés hoy», en el área Nutrición.
2. En «Solicitudes», abrirla y elegir «Cargar con la persona».
3. Completar algunas respuestas y «Enviar para que lo confirme». La solicitud queda «Esperando que lo confirme».
4. En el teléfono, cerrar la sesión de Prueba Uno y entrar con «Prueba Dos». La solicitud dice «Para confirmar»; abrirla
   con «Revisar».
5. Se ve «Revisá lo que cargó Lic. Prueba Dos Áreas». Elegir «Corregir», cambiar una respuesta y «Confirmo que son mis
   datos».
6. En la computadora, actualizar. La respuesta dice quién la cargó y cuándo la confirmó la persona, más «Corrigió 1
   respuesta antes de confirmar».

**Parte 4 (opcional) · «No es correcto»** (Nutrición, Prueba Tres)
1. En la computadora, pedir «Cómo comés hoy» a «Prueba Tres», cargarla y enviarla.
2. En el teléfono, entrar con «Prueba Tres», abrirla con «Revisar» y elegir «No es correcto» y después «Sí, descartar».
   Se ve «Listo: se borró lo que se había cargado. El formulario sigue pendiente.».
3. En la computadora, actualizar. Dice «La persona no confirmó lo cargado (…). El formulario sigue pendiente.».

**Parte 5 (opcional) · TalkBack** (teléfono)
- Activar TalkBack en Ajustes → Accesibilidad.
- Abrir un formulario pendiente y recorrer algunas preguntas: cada una se anuncia con su texto y si es obligatoria.
- Intentar enviar con una obligatoria sin responder: el error se anuncia.
- Desactivar TalkBack al terminar.

El límite de inicios de sesión es de 5 intentos cada 15 minutos por red y por cuenta (DL-015). Si una cuenta se bloquea,
hay que esperar 15 minutos.

### Resultados

| Parte | Paso | Qué se vio | ¿Como se esperaba? | Observación |
|---|---|---|---|---|
| 1 | Instalar encima | | | |
| 2 | Pedir «Antes de entrenar» | | | |
| 2 | Responder, cerrar y volver | | | |
| 2 | La condicional | | | |
| 2 | Lo respondido en el escritorio | | | |
| 3 | Cargar con la persona | | | |
| 3 | Revisar, corregir y confirmar | | | |
| 3 | Lo confirmado en el escritorio | | | |
| 4 | «No es correcto» | | | |
| 5 | TalkBack | | | |

## Lo que queda pendiente

- **La prueba de Dirección**, con la tabla de arriba. Promover la candidata a estable sigue la regla de DL-152: no antes
  de la prueba de punta a punta en el teléfono, y solo con el «pasala a estable» de Dirección.
- **Ratificar las decisiones de la implementación**, D-10 a D-15 de DL-164 (`docs/DEUDA_LEGAJO.md`).
- **Sacar de `VIGENTES` las candidatas anteriores**, si Dirección lo decide: según Dirección, el único teléfono con una
  candidata es el suyo. La 0.19.0-candidata.1 nunca se congeló.
- **Las herramientas del AAB en `main`:** se integran con #223, que sigue en borrador.
- **El legajo legal para el abogado** (D-8), fuera del repo público. Con personas reales, solo en producción y después de
  esa revisión.
