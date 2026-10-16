# APK candidata 0.16.0-candidata.1 · novedades, «Tu nombre», «Tus revisiones» y los arreglos de la 0.15.0-candidata.1

**Estado: construida y publicada como prerelease el 2026-10-16, para la prueba de Dirección en el teléfono.**
- Es `main` en `077c328` más la versión. Trae los dos arreglos de la 0.15.0-candidata.1 (#151 y #152), las novedades y los recordatorios (#163) y REV-A (#164).
- **Sin avisos push todavía.** Se construyó sin `google-services.json`, porque falta el proyecto de Firebase de Dirección (`docs/DESPLIEGUE.md`, «Avisos push»). En Cuenta, «Activar avisos» dice que no están disponibles en esta versión. Las novedades se ven igual, con la campana.
- La estable sigue siendo la 0.13.2: `releases/latest` no cambia.

| Dato | Valor |
|---|---|
| Archivo | `be-0.16.0-candidata.1-10816ae.apk` |
| SHA-256 | `867f4dd60c4d4f7c8dbef78d3d6d5f4e872a2cac18a9c72212c2f283142e85f2` |
| Tamaño | 83.362.137 bytes |
| Versión | `0.16.0-candidata.1`, versionCode 26 |
| Commit construido | `10816ae7f78995b6c73c71b165c69014dd583cf8`, en la rama `apk/candidata-0.16.0-1`: `main` en `077c328` más la versión, que solo cambia `apps/mobile/app.config.ts` |
| Entrega | La prerelease `be-apk-0.16.0-candidata.1`, con el APK y su `.sha256` |

## Qué trae respecto de la 0.15.0-candidata.1

- **Los arreglos de los defectos del teléfono:**
  - la foto de «Comí algo diferente» se sube en bytes con su tipo real (#151);
  - si hay otra sesión en curso, antes de iniciar ofrece continuarla o dejarla incompleta (#152).
- **Novedades (RF-061):**
  - la campana en la cabecera, con las no leídas;
  - la pantalla Novedades: tocar una la marca leída y lleva a su pantalla.
- **Cuenta:**
  - «Tu nombre» (DL-009 y DL-040);
  - «Avisos en este teléfono», con los recordatorios de comidas y de entrenamiento (DL-133).
- **Tus revisiones (REV-A, DL-134):**
  - desde «Plan actual» de Nutrición y desde Plan e Historial de Entrenamiento;
  - la novedad de una revisión abre esa revisión.

## Construcción

Local, en Windows, con Gradle y un solo worker, en el worktree `C:\b11` en el commit construido.
- **Firma:** la keystore histórica administrada por EAS, desde el respaldo de Dirección, con las contraseñas pasadas por entorno.
- **Entorno del perfil `test`:** `APP_ENV`, `API_BASE_URL`, `EAS_BUILD_GIT_COMMIT_HASH` y `NODE_ENV`.
- **Dependencia nativa nueva:** `expo-notifications` 57.0.21, con el ícono de aviso generado del isotipo.

- **`npm ci`:** 1.051 paquetes en 8 min; después el dominio y `expo prebuild --clean`.
- **El primer lanzamiento de Gradle no arrancó.** Con `NoDefaultCurrentDirectoryInExePath`, `cmd` no encuentra `gradlew.bat` por nombre; se relanzó con la ruta completa.
- **`BUILD SUCCESSFUL in 30m 45s`.** El código nativo de los módulos compila con seis procesos de `clang++` en paralelo, más allá de `org.gradle.workers.max=1`.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| Paquete y versión | `com.elianbufi.be`, versionCode 26, `0.16.0-candidata.1`; targetSdk 36 (`aapt2 dump badging`) |
| Firma | Esquema v2, un firmante. El certificado `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06` es el mismo de la 0.15.0-candidata.1 y de la 0.13.2: se instala encima |
| `assets/app.config` | `appEnv` test, la API `https://be-api-hndp.onrender.com`, el commit `10816ae…`, `googleServicesFile` nulo y los complementos `expo-secure-store`, respaldo de Android, `expo-image-picker` y `expo-notifications` |
| Permisos nuevos respecto de la 0.15.0-candidata.1 | `POST_NOTIFICATIONS` (se pide recién al tocar «Activar avisos»), `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `ACCESS_NETWORK_STATE`, el de recibir mensajes de FCM (`c2dm.permission.RECEIVE`) y el de la fuente de instalación de Google Play, que agregan expo-notifications y Firebase Messaging, y los de los números en el ícono de varios lanzadores (Samsung, Huawei, Oppo, Sony, HTC). Ninguno pide confirmación a la persona salvo `POST_NOTIFICATIONS`. Ver «Límites conocidos» |
| Credenciales | Ninguna coincidencia en 1.207 entradas: ni las contraseñas ni el alias de la firma (ASCII y UTF-16LE), ni `PRIVATE KEY`, ni el comienzo de la keystore, ni archivos `credentials.json`, `.jks`, `.keystore`, `.env` o `google-services.json` |
| Publicación | Prerelease `be-apk-0.16.0-candidata.1`, creada con `--latest=false`. El tag apunta a `10816ae7f78995b6c73c71b165c69014dd583cf8`; `releases/latest` sigue en `be-apk-0.13.2`; la descarga pública, sin sesión, pasa `sha256sum -c` |

## Cómo actualizar, sin desinstalar

Se instala encima de la 0.13.2 o de cualquier candidata anterior: el paquete y el certificado son los mismos y el versionCode es mayor. Desinstalar borraría la sesión guardada.

## Recorrido de prueba

1. **Instalar y entrar:** instalar encima de la actual y entrar con la cuenta de siempre, o con una de la cohorte (las credenciales están en `C:\Users\bufim\BE-datos-locales\cohorte-test\cuentas.env`).
2. **La campana:** tocar la de la cabecera. Con Diego, la lista puede estar vacía o tener el recordatorio de las 15:00.
3. **Revisiones:**
   - En Nutrición → Plan actual → «Ver las revisiones de tu profesional»: las ocho revisiones de Diego, completas.
   - Entrenamiento → Plan → lo mismo.
4. **Cuenta:**
   - «Tu nombre»: cambiarlo y ver en el website, como Sofía Paz, que Diego aparece con el nombre nuevo.
   - «Avisos en este teléfono» → «Activar avisos»: en esta versión dice que no están disponibles.
5. **Los dos arreglos:**
   - la foto de «Comí algo diferente», con la cámara o la galería;
   - iniciar una sesión de entrenamiento con otra en curso.
6. **El circuito completo, con dos personas:**
   - Martín Acosta registra en el website una revisión de Federico.
   - En la APK de Federico aparece la novedad, y tocarla abre la revisión.

## Límites conocidos

- **Avisos push:** esperan Firebase y otra construcción.
- **Permisos de más:** en la próxima construcción conviene bloquear con `android.blockedPermissions` los permisos de los lanzadores y el de la fuente de instalación de Google Play. BE no usa ninguno: el número va en la campana, no en el ícono, y no mide de dónde vino la instalación. Es minimizar (08).
- **Pendiente en Android:** TalkBack y la letra al máximo (RNF-ACC-001).
