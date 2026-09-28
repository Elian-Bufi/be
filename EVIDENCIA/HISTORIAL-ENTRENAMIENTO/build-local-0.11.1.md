# APK 0.11.1 — build local con Gradle (desvío del procedimiento EAS)

Registro de procedencia de `be-0.11.1-44bea3a.apk`. **No la construyó EAS y no tiene ID de build de EAS.** El 2026-09-26, EAS rechazó el build porque la cuenta `elianbufi` agotó los builds Android del plan gratuito del mes. Dirección aceptó construirla localmente, sin compras ni suscripciones, y documentarlo como desvío. La firma es la **keystore existente administrada por EAS**: no se generó ni se reemplazó ninguna clave.

## Por qué Gradle nativo y no `eas build --local`

`eas build --local` no corre en Windows (`Unsupported platform, macOS or Linux is required to build apps for Android`), y la máquina no tiene WSL. Se reprodujeron a mano los pasos que EAS ejecuta en el perfil `test`.

## Herramientas

| Herramienta | Versión | Origen de la versión |
|---|---|---|
| Sistema | Windows 11 Home, 5,9 GB de RAM | máquina de Dirección |
| Node / npm | 22.23.2 / 10.9.8 | `eas.json` → perfil `test` → `node` |
| JDK | OpenJDK 17.0.10 (JBR de Android Studio) | requerido por AGP 8.12 |
| Android SDK Platform | 36 | `compileSdk`/`targetSdk` de `react-native/gradle/libs.versions.toml` (RN 0.86.3) |
| Build-Tools | 36.0.0 | `buildTools` del mismo archivo |
| NDK | 27.1.12297006 | `ndkVersion` del mismo archivo |
| CMake | 3.22.1 | valor por defecto de AGP 8.12; ningún módulo nativo fija otra |
| Gradle / AGP | 9.3.1 / 8.12.0 | wrapper de la plantilla de Expo 57 / `libs.versions.toml` |
| Android command-line tools | 16111833 | para instalar los paquetes del SDK |

## Procedimiento

1. **Copia aislada** (`git worktree`, fuera del repositorio) en el commit exacto `44bea3af3266a5744d050ae0124993f3259b7f53` (merge de #90). Las exclusiones de credenciales de #92 no existen en ese commit, así que se agregaron en `.git/info/exclude`. Se verificó con `git check-ignore` que `credentials.json` y `credentials/android/keystore.jks` quedan ignorados en esa copia.
2. **Instalación desde el lockfile:** `npm ci`, que instaló 989 paquetes.
3. **Hook de EAS** `eas-build-post-install` de `apps/mobile/package.json`, que ejecuta `npm run build:domain`. El repositorio no tiene un script `build` en la raíz: este hook es lo que corre EAS.
4. **Entorno del perfil `test`**, presente en la generación y en Gradle, porque `app.config.ts` se evalúa en los dos pasos: `APP_ENV=test`, `API_BASE_URL=https://be-api-hndp.onrender.com`, `EAS_BUILD_GIT_COMMIT_HASH=44bea3af3266a5744d050ae0124993f3259b7f53` y `NODE_ENV=production`.
5. **Generación del proyecto Android:** `npx expo prebuild --platform android --no-install --clean`. No cambió `package.json` y dejó `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`, las cuatro de la 0.11.0.
6. **Configuración nativa agregada** al proyecto generado (`apps/mobile/android/`, que no se versiona). No lleva secretos:
   - En `app/build.gradle`, un `signingConfigs.release` que lee la keystore, las contraseñas y el alias de las variables de entorno `BE_FIRMA_KEYSTORE`, `BE_FIRMA_KEYSTORE_PASSWORD`, `BE_FIRMA_KEY_ALIAS` y `BE_FIRMA_KEY_PASSWORD`. El `buildType release` lo usa cuando esas variables existen. Cumple el papel del script de firma que inyecta EAS.
   - En `gradle.properties`, memoria y concurrencia para esta máquina: `org.gradle.jvmargs=-Xmx2560m`, `org.gradle.workers.max=2`, `org.gradle.parallel=false` y `kotlin.daemon.jvmargs=-Xmx1024m`.
7. **Credenciales:** Dirección las bajó con `npx eas-cli@24.6.0 credentials -p android` → perfil `test` → «Download credentials from EAS to credentials.json».
   - Se copiaron a un respaldo fuera del repositorio, con permisos solo para su usuario y sin herencia. Los hashes coincidían con los originales antes de borrar las copias temporales.
   - Antes del build se verificó que el certificado de la keystore (`keytool`) es `61569691…893e06`, el de la 0.11.0.
   - Un lanzador lee las contraseñas del JSON y las pasa a Gradle por entorno. No aparecen en pantalla ni en logs.
8. **Build:** `gradlew assembleRelease`. Antes hubo un build de precalentamiento con la firma de debug, que se descartó. El build firmado tardó 3 min 8 s.

## Verificación del artefacto (antes de publicar)

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.11.1 · `versionCode` 14 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 (igual que la 0.11.0) |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.11.0**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` (las mismas cuatro) |
| Valores efectivos embebidos (`assets/app.config` del APK) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `44bea3af3266a5744d050ae0124993f3259b7f53` · `construidoEn` `2026-09-26T23:30:14.551Z` |
| Dependencia nativa | clases `com.th3rdwave.safeareacontext` en el dex y `RNCSafeAreaProvider` en el bundle, **ausentes en la 0.11.0** |
| Credenciales privadas | ninguna: las 1142 entradas, descomprimidas, no contienen las contraseñas ni el alias (ASCII y UTF-16LE), marcadores `PRIVATE KEY` ni el inicio de la keystore, y no hay archivos `credentials.json`, `.jks`, `.keystore` ni `.env`. La misma búsqueda sobre la 0.11.0 da 0 |

## Publicación

- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.11.1 (tag en `44bea3a`, marcado Latest; se conservan todas las anteriores)
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.1/be-0.11.1-44bea3a.apk`
- **SHA-256:** `f09cfb1b7113ea2cd56965a9aa4014beae00e4dbfb7302f31012bd5aa7b3d3cb`. Se descargó del release y se volvió a calcular: es idéntico al del artefacto construido.
- **Tamaño:** 70.697.871 bytes
- `releases/latest` redirige a `be-apk-0.11.1`.

## Qué NO está comprobado

Nada de esto observa la app en un dispositivo. Quedan pendientes de la comprobación visual de Dirección con esta APK:
- el recorrido de volver con el enlace, con el Atrás de Android y después de corregir un registro;
- que la fecha coincida entre lista y detalle;
- que el último control sea accesible con navegación por gestos y con tres botones;
- la pantalla de corrección con el teclado abierto y cerrado.

**DL-096 seguía EN CURSO** a la fecha de esta publicación; quedó cerrada el 2026-09-27 (`validacion-0.11.3.md`).

## Repetición para la 0.11.2 (2026-09-26)

Mismo procedimiento, herramientas y firma que arriba, sobre el commit `46fd1fae7d1c58a38d89987037bf38b255c7c2d0` (merge de #95). Pasos:
- la misma copia aislada, movida a ese commit, con las exclusiones verificadas con `git check-ignore`;
- `npm ci` (989 paquetes) y el hook `eas-build-post-install`;
- `expo prebuild --clean` con `EAS_BUILD_GIT_COMMIT_HASH` en ese SHA;
- la misma configuración nativa, que se vuelve a aplicar porque `--clean` regenera `android/`;
- `assembleRelease` firmado, en 28 min 34 s.

La versión de la APK se subió solo en `app.config.ts` (0.11.2, versionCode 15). `apps/mobile/package.json`, el lockfile, la API, el website y el OpenAPI no se tocaron: un cambio en `package.json` o `package-lock.json` redespliega API y web (`buildFilter` de `render.yaml`), y la corrección no los necesita.

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` |
| Versión | `versionName` 0.11.2 · `versionCode` 15 |
| Firma | válida, 1 firmante, esquema v2 |
| Certificado | `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, idéntico al de la 0.11.1 y la 0.11.0 |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos embebidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `46fd1fae7d1c58a38d89987037bf38b255c7c2d0` · `construidoEn` `2026-09-27T00:47:12.962Z` |
| Corrección incluida | el bundle JS contiene `ultimosDiasEnZona` y `hoyEnZona`, ausentes en la 0.11.1; el hash del bundle difiere |
| Dependencia nativa | `com.th3rdwave.safeareacontext` sigue en el dex |
| Credenciales privadas | ninguna: 1142 entradas sin contraseñas, alias, `PRIVATE KEY` ni keystore, y sin archivos de credenciales |

**Publicación:**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.11.2 (tag en `46fd1fa`, marcado Latest; se conservan todas las anteriores).
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.2/be-0.11.2-46fd1fa.apk`
- **SHA-256:** `c1e24d6eb9e9a355354ddac3d9b81ec0f88d8509a3ec92870fa5e95261684dae`. Se descargó del release y se volvió a calcular: es idéntico al del artefacto construido.
- **Tamaño:** 70.698.327 bytes.

## Repetición para la 0.11.3 (2026-09-27)

Mismo procedimiento, herramientas y firma, sobre el commit `13280e67ec1a94cac93d8cb4ece62765c116ff39` (merge de #97). La versión subió solo en `app.config.ts` (0.11.3, versionCode 16).

- **Primer intento fallido:** a los 22 min 53 s, en `:expo-modules-core:bundleLibRuntimeToJarRelease`, Windows respondió «Recursos insuficientes en el sistema para completar el servicio solicitado». Fue presión de memoria en la máquina de 5,9 GB, con otros procesos pesados abiertos. No fue un error del código ni de la configuración.
- **Reintento:** solo la etapa de Gradle, con `org.gradle.workers.max=1` (antes 2) en el `gradle.properties` generado. Terminó bien en 6 min 42 s, reutilizando lo compilado. Reducir la concurrencia no cambia el artefacto.

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` |
| Versión | `versionName` 0.11.3 · `versionCode` 16 |
| Firma | válida, 1 firmante, esquema v2 |
| Certificado | `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, idéntico al de las anteriores |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos embebidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `13280e67ec1a94cac93d8cb4ece62765c116ff39` · `construidoEn` `2026-09-27T22:50:44.066Z` |
| Código nuevo incluido | el hash del bundle JS difiere del de la 0.11.2 |
| Dependencia nativa | `com.th3rdwave.safeareacontext` sigue en el dex |
| Credenciales privadas | ninguna: 1142 entradas, sin contraseñas, alias, `PRIVATE KEY`, keystore ni archivos de credenciales |

**Publicación:**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.11.3 (tag en `13280e6`, marcado Latest; se conservan todas las anteriores).
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.3/be-0.11.3-13280e6.apk`
- **SHA-256:** `4be0de7995283be46f719fd24fe60ef51a8f2d16e53a4bab557863caca0fdbae`, idéntico al construido después de descargarlo.
- **Tamaño:** 70.698.327 bytes.

## Repetición para la 0.12.0 (2026-09-28)

Mismo procedimiento, herramientas y firma, sobre el commit `33b533dd484db4c3d21679f74798e377bca8dba1` (merge de #108), con CI 4/4 verde. La versión subió solo en `app.config.ts` (0.12.0, versionCode 17), en un PR propio.
- **Un solo worker de Gradle desde el comienzo** (`org.gradle.workers.max=1`), sin pruebas ni otros trabajos pesados en paralelo. `BUILD SUCCESSFUL in 18m 43s`, en el primer intento de Gradle.
- **Antes**, el primer lanzamiento se cortó en `npm ci` con `EBADENGINE`: en la máquina ya no estaba Node 22.23.2, que exige el repositorio. Se reinstaló esa versión con fnm y se repitió desde el principio.

Controles, publicación y recorrido de validación: [`EVIDENCIA/PUBLICACION-0.12.0/LEEME.md`](../PUBLICACION-0.12.0/LEEME.md).
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.12.0 (tag en `33b533d`, marcada Latest; se conservan todas las anteriores).
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.12.0/be-0.12.0-33b533d.apk`
- **SHA-256:** `077ed0f7b09e2ae794d02e6b0ec321df9b43dd313d5ac08b1cfc684127e79281`, idéntico al construido después de descargarlo.
- **Tamaño:** 70.711.403 bytes.


Solo datos sintéticos. Sin credenciales.
