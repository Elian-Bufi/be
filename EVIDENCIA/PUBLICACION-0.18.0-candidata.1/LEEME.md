# APK candidata 0.18.0-candidata.1 · la sustitución de ejercicios en la sesión enfocada

**Estado:** construida y publicada como prerelease el 2026-10-26 a las 09:51 (hora de Buenos Aires), por autorización de Dirección del 2026-10-26. Es para
probarla en el teléfono. **La estable sigue siendo la 0.13.2:** `releases/latest` no cambió.

| Dato | Valor |
|---|---|
| Archivo | `be-0.18.0-candidata.1-b64d0c4.apk` |
| SHA-256 | `e9686aeeb014c53ed686872f917b6760ffca06cc15e52240aae011affaac2ce5` |
| Tamaño | 84.012.692 bytes |
| Versión | `0.18.0-candidata.1`, versionCode 30 (la candidata.3 tenía 29) |
| Commit construido | `b64d0c446568f14947f22fae11adc98c226d45c5`, en la rama `apk/candidata-0.18.0-1`. Es `main` en `2c4d445` (la tanda del 2026-10-25 integrada) más la versión, que solo cambia `apps/mobile/app.config.ts` |
| Entrega | La prerelease `be-apk-0.18.0-candidata.1`, con el APK y su `.sha256`: https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.18.0-candidata.1 |

## Qué trae respecto de la 0.17.0-candidata.3

- **La sustitución de ejercicios en la sesión enfocada (DL-151, #195).**
  - La sustitución vale para todas las series de ese ejercicio en esta sesión, las registradas y las que faltan.
  - No modifica el plan.
  - «Volver al planificado» la deshace.
  - Son 4 archivos de `apps/mobile` y el dominio compartido.
- **Desde la base de la candidata.3 (`4091d5e`), `main` no cambió nada más de la APK.** Lo demás de la tanda es de la API
  y del website: Administración, la comparación de Nutrición y la guía.

## Construcción

Local, en Windows, en el worktree `C:\b11` y en el commit construido, con el procedimiento de la candidata.3:
1. `npm ci` (1055 paquetes, 9 min) y el gancho `eas-build-post-install`, que construye el dominio.
2. `expo prebuild --platform android --no-install --clean`, con el entorno del perfil `test`:
   - `APP_ENV=test`;
   - la API y el website de test;
   - `EAS_BUILD_GIT_COMMIT_HASH`, el commit construido;
   - `NODE_ENV=production`;
   - Firebase (`google-services.json`) y el client ID web de Google, desde `BE-datos-locales`.
3. **La firma** es la keystore histórica de EAS, desde el respaldo de Dirección. Las contraseñas pasan por entorno y no
   quedan en archivos, en pantalla ni en el log.
4. Gradle `assembleRelease` con un solo worker: 39 min 54 s, 478 tareas, con entre 0,2 y 1,3 GB libres.

## Verificación del artefacto (antes de publicar)

| Control | Resultado |
|---|---|
| Paquete y versión (`aapt2 dump badging`) | `com.elianbufi.be`, versionCode 30, versionName `0.18.0-candidata.1` |
| Firma (`apksigner verify`) | válida, esquema v2, un firmante |
| Certificado | SHA-256 `61569691…893e06`, **idéntico al de la 0.17.0-candidata.3**: se instala como actualización |
| Permisos | los mismos 10 que la candidata.3 |
| App Link de la invitación | `autoVerify=true`, `https://be-web-1ngj.onrender.com/invitacion` y el esquema `be` |
| Configuración embebida (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `version` `0.18.0-candidata.1` · `commit` `b64d0c446568f14947f22fae11adc98c226d45c5` · el client ID web de Google presente |
| Firebase | los recursos `google_app_id`, `gcm_defaultSenderId`, `project_id` y `google_api_key` |
| La sustitución viene en el bundle | «Volver al planificado» está en `index.android.bundle` y no en el de la candidata.3; la búsqueda (`exercises/search`) también |
| Credenciales | **ninguna.** Se revisaron las 1265 entradas descomprimidas, con 45 búsquedas en ASCII y UTF-16 (abajo). La misma búsqueda sobre la candidata.3 da cero. Un control positivo con textos que sí están confirma que la búsqueda los encuentra |
| Archivos que no deben viajar | ninguno (`credentials.json`, `.jks`, `.keystore`, `.env`) |
| El árbol construido | `HEAD` en el commit construido y sin archivos versionados modificados |

La búsqueda de credenciales incluye:
- las contraseñas y el alias de la firma, y el comienzo de la keystore;
- los marcadores de clave privada;
- el host, la contraseña y el esquema de la URL de la base de test;
- las contraseñas de las cuentas sintéticas de la cohorte y de la prueba breve.

Se busca sin imprimir nada.

**Publicación:**
- el tag `be-apk-0.18.0-candidata.1` apunta al commit construido;
- `releases/latest` sigue en `be-apk-0.13.2`, con el mismo id y el mismo asset;
- la descarga pública da el mismo SHA-256 (`sha256sum -c`).

## Cómo actualizar, sin desinstalar

Se instala encima de la 0.13.2 o de cualquier candidata anterior: el paquete y el certificado son los mismos y el
versionCode es mayor. Desinstalar borraría la sesión guardada. La pantalla de bienvenida dice
«app 0.18.0-candidata.1 · test · commit b64d0c4».

## Qué falta

- **La prueba breve** (`EVIDENCIA/PRUEBA-BREVE-2026-10-26/GUION.md`, parte C), con la cuenta «Prueba Uno».
- **El guion completo del teléfono** (`EVIDENCIA/SUSTITUCION-DE-EJERCICIOS/GUION-DEL-TELEFONO.md`, T1 a T14 y R1 a R3),
  con TalkBack en T13.
- **Las lecturas congeladas de esta APK (DL-152)**, en su PR, con su CI.
- **No pasa a estable** sin esas pruebas, por la regla de DL-152. Promoverla lo decide Dirección.
