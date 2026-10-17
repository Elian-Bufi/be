# APK candidata 0.17.0-candidata.1 · la invitación, los días de entrenamiento y el alta con mayoría de edad

**Estado:** construida y publicada como prerelease el 2026-10-16, para la prueba de Dirección en el teléfono.
- Es `main` en `4a546cb` más la versión. Trae:
  - la invitación en la APK (#173);
  - la agenda de entrenamiento (#174 y #175);
  - el acceso con Google y la declaración de mayoría de edad (#176);
  - los permisos recortados (#166).
- **Sin avisos push:** se construyó sin `google-services.json`, porque falta el proyecto de Firebase de Dirección (`docs/DESPLIEGUE.md`, «Avisos push»).
- **Sin «Continuar con Google»:** se construyó sin `GOOGLE_WEB_CLIENT_ID`, porque faltan los client IDs (`docs/DESPLIEGUE.md`, «Entrar con Google»). El botón no aparece.
- **La estable sigue siendo la 0.13.2:** `releases/latest` no cambia.

| Dato | Valor |
|---|---|
| Archivo | `be-0.17.0-candidata.1-f8637a0.apk` |
| SHA-256 | `83600a35922bc9eb5677048f508aee386aafe2a7eb2818185f488e2386d3d441` |
| Tamaño | 83.864.480 bytes |
| Versión | `0.17.0-candidata.1`, versionCode 27 |
| Commit construido | `f8637a0231ae6e3611b0724d75e2e928ea1e593f`, en la rama `apk/candidata-0.17.0-1`: `main` en `4a546cb` más la versión, que solo cambia `apps/mobile/app.config.ts` |
| Entrega | La prerelease `be-apk-0.17.0-candidata.1`, con el APK y su `.sha256` |

## Qué trae respecto de la 0.16.0-candidata.1

- **La invitación (DL-136):**
  - el enlace de la invitación abre la app en esa invitación (App Link verificado del website y esquema `be://`);
  - «Tengo un código» en Cuenta y en Vínculos;
  - aceptar crea la solicitud y la acepta, y después sigue el consentimiento de siempre.
- **Los días de entrenamiento (DL-137):**
  - con un plan con días: «Hoy te toca», «Te quedó pendiente» (con «Hacerla hoy» y «Saltearla») y «Lo que viene»;
  - al empezar una sesión con otra pendiente, la app pregunta;
  - Inicio muestra lo de hoy y lo pendiente;
  - sin días, todo sigue como antes.
- **El alta (DL-138 y DL-023):** pide declarar la mayoría de edad. El código de «Continuar con Google» está, pero sin client ID no se muestra.
- **Los permisos:** solo los que la app usa (#166).

## Construcción

Local, en Windows, en el worktree `C:\b11`, con Gradle y un solo worker. Duró unos 43 minutos, más 13 de `npm ci`.

- **Firma:** la keystore histórica administrada por EAS, desde el respaldo de Dirección, con las contraseñas pasadas por entorno.
- **Entorno del perfil `test`:** `APP_ENV`, `API_BASE_URL`, `WEB_BASE_URL` (nuevo: el host del App Link de la invitación), `EAS_BUILD_GIT_COMMIT_HASH` y `NODE_ENV`.
- **Dependencia nativa nueva:** `@react-native-google-signin/google-signin` 16.1.5. Compiló con React Native 0.86 sin cambios.
- **Pasos:**
  1. `npx expo prebuild --platform android --no-install --clean`;
  2. la firma por entorno y Gradle con un worker;
  3. `gradlew assembleRelease`.
- **El log de Gradle quedó vacío en esta corrida.** El final se confirmó con el archivo de la APK, y después se detuvo el demonio.

## Verificación del artefacto

- **Paquete y versión:** `com.elianbufi.be`, versionCode 27, versionName `0.17.0-candidata.1`, targetSdk 36 (`aapt2 dump badging`).
- **Permisos:** INTERNET, CAMERA, POST_NOTIFICATIONS, VIBRATE, ACCESS_NETWORK_STATE, WAKE_LOCK, el de recepción de FCM, el del receptor interno, y los de almacenamiento solo hasta Android 12.
- **El enlace de la invitación:** el filtro `https` con `autoVerify` para `be-web-1ngj.onrender.com` con el prefijo `/invitacion`, y el esquema `be`.
- **Firma:** el certificado tiene SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, el mismo de todas las versiones (`apksigner verify --print-certs`).
- **Configuración embebida (`assets/app.config`):**
  - lleva el ambiente, la API, el commit y el proyecto de EAS;
  - ninguna credencial;
  - sin `google-services.json`;
  - el client ID de Google queda vacío y la app solo acepta un texto, así que el botón no aparece.

## Cómo actualizar, sin desinstalar

Se instala encima de la 0.13.2 o de cualquier candidata anterior: el paquete y el certificado son los mismos, y el versionCode es mayor. Desinstalar borraría la sesión guardada.

## Recorrido de prueba

1. **Instalar y entrar** con la cuenta de siempre, o con una de la cohorte (`C:\Users\bufim\BE-datos-locales\cohorte-test\cuentas.env`).
2. **La invitación:**
   - en el website, como profesional: «Invitar a una persona» → «Compartir por WhatsApp» o copiar el enlace;
   - en el teléfono, tocar el enlace. Abre BE en la invitación; aceptar, y después el consentimiento.
   - Con el código: Cuenta → «Tengo un código».
3. **Los días de entrenamiento:**
   - en el website, en el plan en preparación de una persona: «Días de entrenamiento» → elegir días y fecha de inicio → guardar y activar;
   - en el teléfono de esa persona, Entrenamiento → Hoy: «Hoy te toca», «Lo que viene»;
   - si quedó una sesión de un día anterior sin registrar, «Te quedó pendiente»: probar «Saltearla» y «Hacerla hoy».
4. **El alta:** crear una cuenta nueva y ver la casilla de mayoría de edad.

## Lo que falta para la versión final

El `google-services.json` de Firebase y el client ID web de Google, para construir la 0.17.0-candidata.2 con avisos push y con «Continuar con Google».
