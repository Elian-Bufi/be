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

1. **Pista de pruebas internas** de Play Console (hasta 100 probadores por lista de correos; Play dice que estas
   pruebas *pueden* no pasar por la revisión estándar y que una versión *suele* estar disponible en minutos, con el
   primer enlace demorado horas: no es una garantía de ausencia de revisión ni de disponibilidad inmediata; se puede
   empezar antes de completar la ficha). **No** el «uso compartido interno de apps»: vuelve a firmar con una clave de
   prueba y rompería la actualización, Google y los App Links.
2. **Play App Signing con nuestra clave:** al crear la primera versión, en *App integrity* elegir **«Provide a copy of
   your app signing key»** y subir la keystore de EAS cifrada con la herramienta PEPK. Play acepta RSA 2048 como clave
   propia. Así la clave de firma de la app (*app signing key*, la que firma lo que llega a los teléfonos) sigue siendo
   la de hoy: la versión de Play **actualiza la APK instalada sin desinstalar**, «Continuar con Google» y los App Links
   siguen funcionando **sin tocar nada**. La opción por defecto de Play (claves generadas por Google, firma híbrida) y
   la que recomienda la guía manual de Expo son **incorrectas para BE**: obligarían a desinstalar (se pierden la sesión
   y el entrenamiento en curso), romperían Google hasta registrar tres SHA-1 nuevas y los App Links hasta sumar tres
   SHA-256 a `assetlinks.json` y redesplegar el website.
3. **Clave de subida (*upload key*):** la que firma el AAB antes de subirlo; la guarda Dirección y se puede resetear si
   se pierde. **Recomendación (ratificada por Dirección el 28/10): conservar nuestra clave de aplicación y usar una
   clave de subida separada.** Todavía no se genera ni se reemplaza ninguna clave: cuando Dirección la genere, se
   registra su certificado en Play y el AAB se firma con ella (las mismas variables `BE_FIRMA_*` apuntan a esa
   keystore). Hasta entonces, el AAB candidato se firma con la keystore de EAS para verificar toda la cadena, y se
   vuelve a firmar con la clave de subida antes de subirlo (`jarsigner`: quitar `META-INF/` y firmar de nuevo).
4. **El artefacto:** un Android App Bundle (obligatorio para apps nuevas desde agosto de 2021), construido con el mismo
   procedimiento local de las APK cambiando `assembleRelease` por `:app:bundleRelease`, con un *config plugin* que
   inyecte la firma (para que `prebuild --clean` no la borre), ambiente **test** (`be-api-hndp` / `be-web-1ngj`, como
   todas las APK; el perfil `production` de `eas.json` no tiene `API_BASE_URL` ni `WEB_BASE_URL`), **versionCode 31**
   (mayor que el 30 instalado; desde ahí GitHub y Play comparten una sola secuencia) y, siguiendo la convención de las
   candidatas, una rama `aab/candidata-0.18.0-2` = esta rama + un commit de versión. Validación local con `bundletool`,
   `keytool`, `jarsigner` y `zipalign` contra los valores esperados; el artefacto queda fuera del repositorio.
5. **Los evaluadores:** en la lista de correos de la pista interna (cuentas de Google), cargados también como usuarios
   de prueba de la pantalla de consentimiento de OAuth (sigue en modo prueba); abren el enlace de participación,
   instalan desde Play Store con Play Protect activo, y las actualizaciones llegan solas.

## Bloqueos: lo que solo puede hacer Dirección

1. Crear la **cuenta de Play Console** (US$ 25 por única vez, DNI, tarjeta, OTP de correo y teléfono; si es personal,
   verificar un teléfono Android con la app Play Console).
2. Elegir el **tipo de cuenta**: Play exige cuenta de **organización** (D-U-N-S) para las apps de salud, y para
   Google «salud» incluye las categorías de actividad física y de nutrición (la declaración de apps de salud las
   lista: *Activity and Fitness*, *Nutrition and Weight Management*). BE registra entrenamiento, nutrición y
   antropometría y se presenta como «plataforma integrada de inteligencia en salud»: **hay que asumir la cuenta de
   organización.** Va **antes de pagar**; no encontré si una cuenta personal se puede convertir.
3. Crear la app `com.elianbufi.be` (el nombre de paquete es permanente) y aceptar las condiciones de Play App Signing.
4. En la primera versión, elegir **«Provide a copy of your app signing key»** y correr PEPK sobre
   `be-firma-respaldo/credentials/android/keystore.jks` (alias y contraseña en su `credentials.json`): solo Dirección.
5. Generar y guardar la clave de subida separada (cuando lo decidas; no se genera en esta tanda) y registrar su
   certificado en Play; hasta entonces, el candidato se firma con la keystore de EAS.
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
| Política: BE es una app de salud para Play (actividad física y nutrición entran en «salud»): cuenta de organización, declaración de apps de salud; privacidad de demostración sin contacto (DL-028); «Cerrar mi cuenta» conserva los datos (DL-019; Play dice que desactivar no es borrar) | la cuenta de organización va antes de crear la app; lo demás no bloquea la pista interna y sí las pruebas cerradas, abiertas y producción (Data safety, declaración de apps de salud, borrado de cuenta) | decidir el tipo de cuenta antes de pagar; lo demás, antes de pasar de la pista interna |
| Cuenta personal y producción | 12 probadores 14 días seguidos en una prueba cerrada | solo si se apunta a producción |
| 16 KB verificado solo en la APK 0.16.0 | Play bloquea actualizaciones sin 16 KB desde el 01/02/2027 | verificar el AAB con `zipalign -P 16` |

## Archivos que requerirían cambios (y los que no)

| Archivo | Cambio | Para qué |
|---|---|---|
| `apps/mobile/plugins/firma-de-subida.js` (nuevo) | config plugin que agrega `signingConfigs.release` leyendo `BE_FIRMA_*` del entorno; sin las variables, no toca nada | que `prebuild --clean` no borre la firma; sirve para la APK y para el AAB |
| `apps/mobile/app.config.ts` | sumar el plugin a `plugins`; **no** cambiar `android.package` (91); VERSION (8) y versionCode (92) cambian solo en la rama de versión `aab/candidata-*` | convención de las candidatas |
| `scripts/aab/` (nuevos) | `construir-aab.mjs` (prebuild + `:app:bundleRelease`, un worker, env de test desde `BE-datos-locales`, firma desde `credentials.json` sin imprimir nada) y `verificar-aab.mjs` (exige cada valor esperado: paquete, versión, versionCode, commit, árbol limpio, ambiente, Google, Firebase, invitaciones y los dos certificados; bundletool validate, manifiesto, `keytool`/`jarsigner`, config del bundle y alineación ELF para 16 KB, `zipalign -P 16` sobre la APK universal, credenciales en todo el bundle descomprimido; «todo bien» solo si todo corrió y dio bien) | reproducible y verificable |
| `docs/DESPLIEGUE.md` | sección «Google Play · pruebas internas»: clave de subida y de firma, PEPK, versionCode compartido, recorrido del evaluador | documentación operativa |
| `EVIDENCIA/GOOGLE-PLAY/` (nuevo) | verificaciones del AAB candidato (sin secretos) | comprobado automáticamente / pendiente |
| `apps/web/public/.well-known/assetlinks.json` | **no cambia** si Play firma con nuestra clave | — |
| `apps/web/src/app/page.tsx`, `invitacion/abrir-invitacion.tsx` | **no en esta tanda**: enlaces y texto del canal (decisión de Dirección sobre DV-08) | — |
| `apps/mobile/eas.json`, `.github/workflows/apk.yml` | **no cambian** para el camino local; por EAS haría falta un perfil `app-bundle` y `EXPO_TOKEN` | — |
| `.gitignore` | ya ignora `android/`, `*.aab`, `credentials.json`, `credentials/`, `*.jks`, `*.keystore`, `keystore.properties` | — |

## Decisiones de Dirección (con recomendación)

1. **Clave de firma de la app en Play:** nuestra clave de EAS (ratificado el 28/10; conserva actualización, Google y
   App Links). La alternativa, claves de Google, obliga a desinstalar y a registrar huellas nuevas en Google Cloud y
   `assetlinks.json`.
2. **Clave de subida:** separada de la de firma (ratificado el 28/10). Queda pendiente generarla y registrar su
   certificado; mientras tanto, nada se genera ni se reemplaza, y el AAB candidato se firma con la keystore de EAS
   para verificar la cadena (se vuelve a firmar con la clave de subida antes de subirlo).
3. **Tipo de cuenta:** organización (D-U-N-S), porque para Play la actividad física y la nutrición son salud. Decidir
   el nombre de la organización y tramitar el D-U-N-S antes de pagar.
4. **Ambiente y versión del AAB:** test (`be-api-hndp`), `0.18.0-candidata.2` / versionCode 31 desde `main` `e4512cb`
   (lo que test sirve hoy) más esta rama. Alternativa: el mismo `b64d0c4` de la candidata.1 con versionCode 31.
5. **El canal en el website y DV-08:** cuándo cambiar «Se instala fuera de Google Play» y los enlaces a GitHub.

## Guía breve de lo que hacés vos (en orden)

1. **Decidir** (antes de pagar): la organización y su D-U-N-S (para Play, BE es una app de salud); nuestra clave como
   clave de firma y una clave de subida separada quedaron ratificadas el 28/10; la clave de subida se genera cuando lo
   digas, no antes.
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

## Estado al cierre (2026-10-28, 16:50 UTC) y punto de reanudación

- **Hecho:** plugin de firma (`apps/mobile/plugins/firma-de-subida.js`, con su prueba en `npm test`), scripts
  `scripts/aab/construir-aab.mjs` (escribe también `esperado.json` desde las fuentes de la construcción) y
  `verificar-aab.mjs` (corregido el 28/10 a la tarde: exige paquete, versión, versionCode, commit, ambiente, Google,
  Firebase, invitaciones y los dos certificados; «todo bien» solo si cada comprobación obligatoria corrió y dio bien;
  busca credenciales en todo el bundle descomprimido, con una prueba que mete secretos sintéticos en un zip y comprueba
  que los detecta sin devolverlos; y completa 16 KB con la configuración del bundle y la alineación ELF de cada
  biblioteca de 64 bits, dejando dicho que la ejecución en un dispositivo de 16 KB es una prueba aparte),
  `docs/DESPLIEGUE.md` («Google Play · pruebas internas»), el guion de prueba en `EVIDENCIA/GOOGLE-PLAY/LEEME.md`, la
  rama de versión `aab/candidata-0.18.0-2` publicada, bundletool 1.18.3 descargado, PR #223 en borrador.
- **Revisión adversaria del verificador (28/10, un agente de solo lectura) y lo corregido:** (1) la heurística de
  PKCS#12 marcaba cualquier PKCS#7 SignedData, o sea el bloque de firma JAR `META-INF/*.RSA` de todo AAB firmado:
  «todo bien» era inalcanzable; ahora se exige la forma PFX (`INTEGER 3` + OID pkcs7-data) y la prueba incluye un
  SignedData que NO debe marcarse y un PFX que sí. (2) El esperado se comprobaba por presencia de claves: un `null` o
  un `""` pasaba por `null === null`; ahora `scripts/aab/esperado.mjs` exige cada campo con su forma (commit de 40 hex,
  URL https, client ID `…apps.googleusercontent.com`, huellas de 64 hex) y ningún valor leído del artefacto puede ser
  `null` para dar bien. (3) Sin `google-services.json` o sin el client ID, la construcción seguía y el verificador no
  distinguía «falta» de «a propósito»; ahora `construir-aab.mjs` corta salvo `--sin-firebase` / `--sin-google`, y lo
  declara en el esperado. (4) 16 KB: se lee también `uncompressNativeLibraries.alignment` (`PAGE_ALIGNMENT_16K`), el
  RELRO de cada ELF, y `zipalign` tiene que informar todas las bibliotecas de la APK sin comprimir y alineadas.
  (5) `credenciales.mjs` usaba `require` en un módulo ESM para los archivos grandes (fallaba por encima de 64 MB);
  ahora los recorre enteros por bloques con solapamiento, busca también nombres de variables sin valor, PEM en base64
  y en UTF-16, contenedores anidados y, con `--respaldo`, los valores literales de las contraseñas (sin escribirlos).
  (6) Árbol sucio: antes avisaba y seguía; ahora corta salvo `--permitir-sucio`, y `arbolLimpio` va en el esperado.
  (7) `jarsigner -verify -strict`, `assetlinks.json` con `handle_all_urls` y `new URL(…)`, bundletool con `-Xmx768m`,
  SHA-256 por flujo. Lo que la revisión pidió y no se hizo: `build-apks --device-spec` para un arm64 con SDK 35
  (redundante con la APK universal y `zipalign`) y buscar secretos del respaldo por omisión (queda detrás de
  `--respaldo`, para que el verificador no lea la keystore sin pedirlo). La CI de `fca2452` falló en Ubuntu porque la
  prueba usaba `tar.exe` de Windows; ahora la prueba escribe y lee el zip con Node, sin herramientas externas.
- **CI de la rama (cinco trabajos: legajo, verificar, integración, recorridos, imagen):** verde en `6690af0` (corrida
  40730842576, las correcciones de la revisión) y verde en `7475ea1` (corridas 40734129288 y 40734140772, el lanzador
  y su documentación); las de `9ba8526` quedaron canceladas por superadas. La rama de versión `aab/candidata-0.18.0-2`
  (`e4e1caa`) es esta rama más el commit de versión; la CI no corre sobre `aab/*`.
- **No hecho:** el AAB candidato **no se construyó**: el primer intento (árbol espejado) no era fiel al lockfile y el
  segundo (`npm ci` en el árbol) lo cortó la poca memoria de la PC; la construcción de Gradle (~2,5 GB, ~40 min) no se
  lanzó. **Tercera medición, después de las correcciones y con la rama de versión actualizada (`b6ea7c3`, a las 17:55
  UTC): 733 MB libres de 6.030, sin Chrome, Java ni Node corriendo. No hay margen para `npm ci` más Gradle (el intento
  anterior se cortó con ~700 MB) y, por pedido de Dirección, no se repite: el bloqueo concreto es la memoria libre de
  la PC.** Cuarta medición, después de las correcciones de la revisión (18:40 UTC): 685 MB libres; los procesos más
  grandes son los de la sesión de Claude (515 + 155 + 150 MB) y el antivirus (229 MB): tampoco hay margen, y no se
  intentó. Detalle y comandos exactos en `EVIDENCIA/GOOGLE-PLAY/LEEME.md`. Por eso, lo «comprobado automáticamente»
  sobre el artefacto está pendiente; lo comprobado es la ruta, el código y la herramienta de verificación (con sus
  pruebas).
- **Para retomar: el lanzador** `scripts/aab/lanzar-aab.ps1` (28/10 noche), con Claude y Chrome cerrados, desde
  PowerShell: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\bufim\BE-aab\scripts\aab\lanzar-aab.ps1`
  y, para ver el resultado, lo mismo con `-Consultar`. Comprueba (Node 22, rama, commit igual al publicado, árbol
  limpio, herramientas, datos y respaldo por existencia, memoria y disco), corre `npm ci`, la construcción y la
  verificación contra el `esperado.json` de esa construcción, se detiene en el primer fallo sin reintentos ni
  artefactos anteriores, y deja un registro sin credenciales en `C:\Users\bufim\BE-artefactos\aab\registros\` con una
  línea final TERMINADO / FALLÓ en <paso> / BLOQUEADO por <motivo>. TERMINADO exige la verificación del AAB en «todo
  bien» y la revisión del registro limpia (la revisión corre siempre al cerrar; hallazgos o error del revisor son
  FALLÓ en «revision-del-registro»), y `-Consultar` solo muestra el registro si quedó revisado y limpio. Probado en
  sus comprobaciones y bloqueos y, con `-Simular`, en los cuatro veredictos (no en una construcción: 461 a 504 MB
  libres con la sesión abierta). Si esta PC no alcanza ni con todo cerrado, las
  alternativas (otra PC propia; GitHub Actions sin la keystore y firma local; EAS Build, donde la keystore ya está),
  con requisitos y costos, están en `EVIDENCIA/GOOGLE-PLAY/LEEME.md`; ninguna se activó. La APK vigente
  (0.18.0-candidata.1) no se toca.

## Avance del 2026-10-29: el AAB está construido, firmado y verificado

- **Decisión de Dirección (29/10):** la PC de Dirección no tiene memoria para Gradle (8 GB, 2 reservados al video) y la
  PC de escritorio familiar no se puede usar sin acceso físico (la keystore no viaja por red). Se eligió la alternativa
  2: construir en GitHub Actions **sin la keystore** y firmar en la PC de Dirección. Dirección cargó los dos secretos
  (`BE_GOOGLE_SERVICES_JSON`, `BE_GOOGLE_CLIENT_IDS`) con `gh secret set`, sin que Claude viera su contenido. El repo
  sigue público por decisión de Dirección (la descarga de la APK del website depende de las releases públicas).
- **Resultado:** `be-0.18.0-candidata.2-527474f.aab`, SHA-256 `d2ba02d5…7020f76d`, construido en la corrida
  40872124576 (13 min), firmado con la keystore de EAS en la PC de Dirección y verificado: **todo bien**, las 19
  comprobaciones. Detalle, evidencia y lo que encontró en las herramientas, en `EVIDENCIA/GOOGLE-PLAY/LEEME.md`.
- **Correcciones de las herramientas** que el primer AAB real hizo aparecer, ninguna en la app: la regla del RELRO de
  16 KB era más estricta que Android; `jarsigner -strict` marca toda clave de Android por autofirmada; y la firma
  llevaba los primeros 8 caracteres del alias en los nombres de `META-INF` (ahora `-sigfile BE`). Commits `2aa8526`,
  `31117ec` y `ef4d9fc`.
- **Archivos nuevos o cambiados:** `.github/workflows/aab-sin-firma.yml`, `scripts/aab/firmar-aab.mjs`,
  `construir-aab.mjs --sin-firma`, `plugins/firma-de-subida.js` (`BE_SIN_FIRMA`), `elf.mjs`, `esperado.mjs`,
  `verificar-aab.mjs`, `revisar-registro.mjs --respaldo` y sus pruebas.
- **Pendiente de Dirección:** cuenta de organización y D-U-N-S; en Play Console, la app, la pista interna, Play App
  Signing con la keystore de EAS por PEPK y la comprobación de la SHA-256 en *App integrity* antes de que nadie
  instale; la clave de subida separada; el guion de prueba en el teléfono. Nada se publicó ni se subió a Play.

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
