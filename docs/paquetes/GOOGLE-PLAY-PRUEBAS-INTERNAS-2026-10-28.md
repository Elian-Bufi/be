# Google Play · pruebas internas: ruta, bloqueos y preparación (2026-10-28)

Encargo de Dirección del 2026-10-28 (a la tarde): dejar una ruta de distribución comprobada contra el código y los
artefactos de BE para empezar por **pruebas internas** de Google Play, con las protecciones del teléfono activas, todo
lo preparable terminado y una lista breve de lo que depende de Dirección. Rama `wp-google-play-pruebas-internas` desde
`main` `e4512cb`; nada se integra, despliega ni publica.

**Hito 1 (15:35 UTC):** la investigación de solo lectura (tres frentes, un agente por vez, 208 lecturas, fuentes
oficiales citadas) terminó y acá queda reconciliada. Es un avance, no una promesa de publicación.

## Lo comprobado sobre nuestros artefactos

| Qué | Hecho | Dónde se comprobó |
|---|---|---|
| Paquete | `com.elianbufi.be`, único, sin variantes por ambiente | `apps/mobile/app.config.ts:91`; `aapt2` sobre dos APK; `EVIDENCIA/PUBLICACION-0.18.0-candidata.1/verificacion.txt` |
| Candidata vigente | `be-apk-0.18.0-candidata.1`, commit `b64d0c4`, **versionCode 30** (lo informado por Dirección es correcto); estable `0.13.2`, `4b49d43`, versionCode 22. Ninguna release trae un AAB | `gh release list/view` |
| `main` | sigue en `0.13.2` / versionCode 22: las versiones de las candidatas viven solo en las ramas `apk/candidata-*` (un commit de dos líneas sobre `main`) | `git show e4512cb:apps/mobile/app.config.ts` |
| Certificado | todas las APK publicadas van firmadas con la **misma clave**: RSA 2048, esquema v2, SHA-256 `61569691…893e06` (SHA-1 `b108ec55…36e6`). Es la keystore que EAS generó y administra; hay copia local en `C:/Users/bufim/be-firma-respaldo/` (`credentials.json` + `credentials/android/keystore.jks`) y copia remota en EAS | `apksigner verify --print-certs` sobre la 0.16.0 y la build EAS 0.1.0; la 0.13.2 y la 0.18.0 por su EVIDENCIA |
| Cómo se compila hoy | localmente, desde la 0.11.1: `expo prebuild --platform android --clean` con el env del perfil `test` + `GOOGLE_SERVICES_JSON` y `GOOGLE_WEB_CLIENT_ID` desde `BE-datos-locales`, un `signingConfigs.release` agregado a mano al `android/` generado (lee `BE_FIRMA_KEYSTORE`, `BE_FIRMA_KEYSTORE_PASSWORD`, `BE_FIRMA_KEY_ALIAS`, `BE_FIRMA_KEY_PASSWORD`) y `gradlew assembleRelease` con un worker (~40 min). `apk.yml` (EAS en la nube) nunca funcionó: 0 secretos en GitHub | `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md`; `EVIDENCIA/PUBLICACION-0.18.0-candidata.1/LEEME.md`; `docs/DESPLIEGUE.md:142-152` |
| Toolchain | Expo 57 / RN 0.86.3: minSdk 24, **targetSdk 36**, compileSdk 36, AGP 8.12, NDK 27.1; 4 ABI; sin R8. Play exige API 36 desde el 31/08/2026: **cumple**. 16 KB: verificado en la 0.16.0 (`zipalign -P 16` y ELF 0x4000); la 0.18.0 y el AAB, por verificar | `node_modules/react-native/gradle/libs.versions.toml`; `aapt2`; `zipalign`, `llvm-readelf` |
| Firebase | `google-services.json` fuera del repo (`BE-datos-locales/firebase/`), proyecto `be-app-c4623`, **sin huellas** de certificado; solo FCM como transporte de Expo Push | `app.config.ts:13-19,111`; `docs/DESPLIEGUE.md:98-106` |
| Google | `@react-native-google-signin` con el client **web** embebido; el client **Android** de Google Cloud está atado al paquete + **SHA-1 de la clave de EAS**; la API verifica el id token contra `GOOGLE_CLIENT_IDS` | `apps/mobile/src/google.ts`; `apps/api/src/acceso-google/verificador-de-google.ts`; `docs/DESPLIEGUE.md:115-128` |
| App Links | `/invitacion` con `autoVerify`; `apps/web/public/.well-known/assetlinks.json` declara **una** SHA-256: la de EAS; publicado y resuelto por Google | `app.config.ts:99-110`; `curl` al sitio y a la API de Digital Asset Links |
| Canal | lo único del código atado al canal es el website: la landing y el fallback de `/invitacion` apuntan a `github.com/…/releases/latest` y la landing dice «Se instala fuera de Google Play»; el ADR DV-08 descartó Play para la entrega académica | `apps/web/src/app/page.tsx:11,117`; `abrir-invitacion.tsx:16,46,58`; `docs/mesa/MESA_02/DV-08_09/DV-08_ADR.md:85` |

## La ruta recomendada (y por qué)

1. **Pista de pruebas internas** de Play Console (hasta 100 probadores por lista de correos, sin revisión previa,
   disponible en minutos, se puede empezar antes de completar la ficha). **No** el «uso compartido interno de apps»:
   vuelve a firmar con una clave de prueba y rompería la actualización, Google y los App Links.
2. **Play App Signing con nuestra clave:** al crear la primera versión, en *App integrity* elegir **«Provide a copy of
   your app signing key»** y subir la keystore de EAS cifrada con la herramienta PEPK. Play acepta RSA 2048 como clave
   propia. Así la clave de firma de la app (*app signing key*, la que firma lo que llega a los teléfonos) sigue siendo
   la de hoy: la versión de Play **actualiza la APK instalada sin desinstalar**, «Continuar con Google» y los App Links
   siguen funcionando **sin tocar nada**. La opción por defecto de Play (claves generadas por Google, firma híbrida) y
   la que recomienda la guía manual de Expo son **incorrectas para BE**: obligarían a desinstalar (se pierden la sesión
   y el entrenamiento en curso), romperían Google hasta registrar tres SHA-1 nuevas y los App Links hasta sumar tres
   SHA-256 a `assetlinks.json` y redesplegar el website.
3. **Clave de subida (*upload key*):** la que firma el AAB antes de subirlo. Google recomienda que sea distinta de la de
   firma y se puede resetear si se pierde. Para la primera subida se puede usar la misma keystore de EAS (está
   permitido) y pedir después una clave de subida aparte; o generar la clave de subida nueva antes de la primera
   subida. **Lo decide Dirección** (ver «Decisiones»); ninguna clave existente se genera ni se reemplaza acá.
4. **El artefacto:** un Android App Bundle (obligatorio para apps nuevas desde agosto de 2021), construido con el mismo
   procedimiento local de las APK cambiando `assembleRelease` por `:app:bundleRelease`, con un *config plugin* que
   inyecte la firma (para que `prebuild --clean` no la borre), ambiente **test** (`be-api-hndp` / `be-web-1ngj`, como
   todas las APK; el perfil `production` de `eas.json` no tiene `API_BASE_URL` ni `WEB_BASE_URL`), **versionCode 31**
   (mayor que el 30 instalado; desde ahí GitHub y Play comparten una sola secuencia) y, siguiendo la convención de las
   candidatas, una rama `aab/candidata-0.18.0-2` = esta rama + un commit de versión. Validación local con `bundletool`
   y `apksigner`; el artefacto queda fuera del repositorio.
5. **Los evaluadores:** en la lista de correos de la pista interna (cuentas de Google), cargados también como usuarios
   de prueba de la pantalla de consentimiento de OAuth (sigue en modo prueba); abren el enlace de participación,
   instalan desde Play Store con Play Protect activo, y las actualizaciones llegan solas.

## Bloqueos: lo que solo puede hacer Dirección

1. Crear la **cuenta de Play Console** (US$ 25 por única vez, DNI, tarjeta, OTP de correo y teléfono; si es personal,
   verificar un teléfono Android con la app Play Console).
2. Elegir el **tipo de cuenta**: Play exige cuenta de **organización** (D-U-N-S) para «Health apps, such as Medical
   apps…» y no aclara si Activity & Fitness o Nutrition entran. BE se presenta como «plataforma integrada de
   inteligencia en salud». Va **antes de pagar**; no encontré si una cuenta personal se puede convertir.
3. Crear la app `com.elianbufi.be` (el nombre de paquete es permanente) y aceptar las condiciones de Play App Signing.
4. En la primera versión, elegir **«Provide a copy of your app signing key»** y correr PEPK sobre
   `be-firma-respaldo/credentials/android/keystore.jks` (alias y contraseña en su `credentials.json`): solo Dirección.
5. Decidir la clave de subida (misma keystore o una nueva) y, si es nueva, generarla y guardarla.
6. Cargar la lista de probadores y sumarlos como usuarios de prueba de OAuth en Google Cloud (`be-app-c4623`).
7. Revisar en Google Cloud si la API key de Firebase está restringida por app Android (si Play firmara con otra clave,
   los avisos dejarían de llegar; con nuestra clave no cambia nada).
8. Revisar el ADR DV-08 («fuera de stores») y el texto del website si Play pasa a ser un canal.

Nada de esto frena la preparación local: el AAB se puede construir y validar sin acceso a Play Console.

## Riesgos de actualización e integraciones

| Riesgo | Qué pasa | Cómo se evita |
|---|---|---|
| Play firma con claves de Google (opción por defecto; también lo que dice la guía de Expo) | el certificado no coincide con `6156…3e06`: hay que desinstalar la APK (se pierden la sesión y el entrenamiento en curso); Google da `DEVELOPER_ERROR` hasta crear client IDs Android con las SHA-1 de Play (tres con la firma híbrida); los enlaces de invitación abren el website en vez de la app hasta sumar las SHA-256 a `assetlinks.json` y redesplegar | elegir «Provide a copy of your app signing key» **antes** de la primera versión, y comprobar en *App integrity* que la SHA-256 de la clave de firma sea `61569691…893e06` antes de que nadie instale |
| versionCode menor o repetido | Android rechaza el downgrade; Play rechaza un versionCode usado | AAB con 31; una sola secuencia para GitHub y Play de ahí en más |
| `prebuild --clean` borra la firma manual | el AAB saldría firmado con la clave de debug (Play lo rechaza) o con la equivocada | config plugin que inyecta `signingConfigs.release` desde las variables `BE_FIRMA_*` en cada prebuild |
| El AAB se construye con el perfil `production` tal como está | la app queda sin API y sin App Link | construir con el env de `test` hasta que exista un ambiente de producción |
| Uso compartido interno de apps | Play vuelve a firmar con una clave de prueba | usar la pista de pruebas internas |
| Memoria de la PC durante el build (~40 min; falló por memoria en la 0.11.3) | build cortado | medir la RAM antes, un worker, sin Chrome |
| Política: cuenta personal con una app de salud; privacidad de demostración sin contacto (DL-028); «Cerrar mi cuenta» conserva los datos (DL-019; Play dice que desactivar no es borrar) | no bloquean la pista interna; bloquean pruebas cerradas, abiertas y producción (Data safety, declaración de apps de salud, borrado de cuenta) | decidirlo antes de pasar de la pista interna |
| Cuenta personal y producción | 12 probadores 14 días seguidos en una prueba cerrada | solo si se apunta a producción |
| 16 KB verificado solo en la APK 0.16.0 | Play bloquea actualizaciones sin 16 KB desde el 01/02/2027 | verificar el AAB con `zipalign -P 16` |

## Archivos que requerirían cambios (y los que no)

| Archivo | Cambio | Para qué |
|---|---|---|
| `apps/mobile/plugins/firma-de-subida.js` (nuevo) | config plugin que agrega `signingConfigs.release` leyendo `BE_FIRMA_*` del entorno; sin las variables, no toca nada | que `prebuild --clean` no borre la firma; sirve para la APK y para el AAB |
| `apps/mobile/app.config.ts` | sumar el plugin a `plugins`; **no** cambiar `android.package` (91); VERSION (8) y versionCode (92) cambian solo en la rama de versión `aab/candidata-*` | convención de las candidatas |
| `scripts/aab/` (nuevos) | `construir-aab.mjs` (prebuild + `:app:bundleRelease`, un worker, env de test desde `BE-datos-locales`, firma desde `credentials.json` sin imprimir nada) y `verificar-aab.mjs` (bundletool validate, APK universal, `apksigner --print-certs`, paquete, versionCode, targetSdk, 16 KB, SHA-256) | reproducible y verificable |
| `docs/DESPLIEGUE.md` | sección «Google Play · pruebas internas»: clave de subida y de firma, PEPK, versionCode compartido, recorrido del evaluador | documentación operativa |
| `EVIDENCIA/GOOGLE-PLAY/` (nuevo) | verificaciones del AAB candidato (sin secretos) | comprobado automáticamente / pendiente |
| `apps/web/public/.well-known/assetlinks.json` | **no cambia** si Play firma con nuestra clave | — |
| `apps/web/src/app/page.tsx`, `invitacion/abrir-invitacion.tsx` | **no en esta tanda**: enlaces y texto del canal (decisión de Dirección sobre DV-08) | — |
| `apps/mobile/eas.json`, `.github/workflows/apk.yml` | **no cambian** para el camino local; por EAS haría falta un perfil `app-bundle` y `EXPO_TOKEN` | — |
| `.gitignore` | ya ignora `android/`, `*.aab`, `credentials.json`, `credentials/`, `*.jks`, `*.keystore`, `keystore.properties` | — |

## Decisiones de Dirección (con recomendación)

1. **Clave de firma de la app en Play:** nuestra clave de EAS (recomendado; conserva actualización, Google y App
   Links) o claves de Google (obliga a desinstalar y a registrar huellas nuevas en Google Cloud y `assetlinks.json`).
2. **Clave de subida:** la misma keystore de EAS para la primera subida (más simple; Google lo permite y lo recomienda
   en contra) o una clave de subida nueva desde el inicio (recomendación de Google; una clave más que guardar). Si se
   elige nueva después de construir el AAB candidato, el AAB se vuelve a firmar con ella (es un paso corto).
3. **Tipo de cuenta:** personal u organización (D-U-N-S) según cómo se clasifique BE como app de salud.
4. **Ambiente y versión del AAB:** test (`be-api-hndp`), `0.18.0-candidata.2` / versionCode 31 desde `main` `e4512cb`
   (lo que test sirve hoy) más esta rama. Alternativa: el mismo `b64d0c4` de la candidata.1 con versionCode 31.
5. **El canal en el website y DV-08:** cuándo cambiar «Se instala fuera de Google Play» y los enlaces a GitHub.

## Guía breve de lo que hacés vos (en orden)

1. **Decidir** (antes de pagar): tipo de cuenta (personal u organización), nuestra clave como clave de firma (recomendado)
   y si querés una clave de subida aparte.
2. **Cuenta:** https://play.google.com/console → alta de desarrollador (US$ 25, DNI, tarjeta, OTP; si es personal,
   verificar tu teléfono con la app Play Console).
3. **App:** «Crear app» → nombre BE, español, app, gratis, correo de contacto, declaraciones, aceptar Play App Signing.
   Paquete: `com.elianbufi.be` (es permanente).
4. **Probadores:** Testing → Internal testing → Testers → «Create email list» con las cuentas de Google de los
   evaluadores. Los mismos correos, como usuarios de prueba en la pantalla de consentimiento de OAuth
   (https://console.cloud.google.com, proyecto be-app-c4623), si van a entrar con Google.
5. **Primera versión:** Internal testing → «Create new release» → App integrity → **«Provide a copy of your app
   signing key»** → descargar PEPK y correr, en tu PC, con la keystore del respaldo (el alias y la contraseña están en
   su `credentials.json`; no los pegues en ningún chat):
   `java -jar pepk.jar --keystore=C:\Users\bufim\be-firma-respaldo\credentials\android\keystore.jks --alias=<alias> --output=C:\Users\bufim\be-firma-respaldo\pepk-salida.zip --encryptionkey=<la clave de cifrado que muestra Play>`
   y subir ese zip. Después, subir el `.aab` candidato, revisar que el versionCode sea 31, «Save and publish».
6. **Comprobar antes de que nadie instale:** Release → Setup → App integrity → App signing key certificate: SHA-256
   `61:56:96:91:BD:47:30:0F:C1:8F:32:C3:7A:84:80:FF:A5:1E:C5:4E:96:47:B6:12:5A:F4:40:53:5C:89:3E:06`. Si es otra, no
   publiques: la versión de Play no actualizaría la APK.
7. **Copiar el enlace** de Testers y seguir el guion de `EVIDENCIA/GOOGLE-PLAY/LEEME.md` (instalación, actualización
   sobre la APK, Google, invitaciones, avisos).

## Lo que sigue (preparación técnica autorizada)

- Plugin de firma, scripts de construcción y verificación, documentación, PR en borrador.
- Con la RAM medida: construir el AAB candidato (`0.18.0-candidata.2`, versionCode 31, ambiente test), validarlo con
  bundletool y apksigner, registrar su commit de origen y sus huellas en `EVIDENCIA/GOOGLE-PLAY/`, y dejar el archivo
  fuera del repositorio. La APK vigente no se toca.
- Guion de prueba en el teléfono y en Play Console: instalación, actualización sobre la APK anterior, inicio de sesión,
  invitaciones y notificaciones, separando lo comprobado automáticamente de lo pendiente.

## Fuentes oficiales leídas (las principales)

- Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756 y
  https://developer.android.com/studio/publish/app-signing
- Actualizaciones y certificados: https://developer.android.com/google/play/app-updates
- Pruebas internas: https://support.google.com/googleplay/android-developer/answer/9845334
- Cuenta y verificación: https://support.google.com/googleplay/android-developer/answer/6112435,
  …/answer/13634885, …/answer/14986433, …/answer/10841920, …/answer/14151465
- App Bundle: https://developer.android.com/guide/app-bundle; API objetivo:
  https://developer.android.com/google/play/requirements/target-sdk; 16 KB:
  https://developer.android.com/guide/practices/page-sizes
- Datos y salud: …/answer/10787469 (Data safety), …/answer/14738291 (apps de salud), …/answer/10144311 (User Data),
  …/answer/13327111 (borrado de cuenta)
- Google Sign-In y huellas: https://developers.google.com/android/guides/client-auth; App Links:
  https://developer.android.com/training/app-links/configure-assetlinks
- Expo: https://docs.expo.dev/guides/local-app-production/, https://docs.expo.dev/submit/android-manual/,
  https://docs.expo.dev/push-notifications/fcm-credentials/
- Verificación de desarrolladores de Android (2026-2027): https://developer.android.com/developer-verification. No se
  le atribuye ninguna advertencia de instalación actual: todavía no tenemos su texto exacto.
