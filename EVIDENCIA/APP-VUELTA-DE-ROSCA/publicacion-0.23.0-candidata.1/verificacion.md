# Verificación del AAB be-0.23.0-candidata.1-6eac0a7.aab

58076606 bytes · SHA-256 `a0fec16af7e228e2cef8020c23abad2223f94f66ade8a42dc86de35181c2fe47` · verificado 2026-11-08T02:27:33.512Z

**Todo bien: sí.**

| Comprobación obligatoria | Resultado | Detalle |
|---|---|---|
| Bundle válido (`bundletool validate`) | sí | |
| Paquete | sí | `com.elianbufi.be` (esperado `com.elianbufi.be`) |
| Versión y versionCode | sí | `0.23.0-candidata.1` / 36 (esperado `0.23.0-candidata.1` / 36) |
| Versión embebida (app.config) | sí | `0.23.0-candidata.1` |
| Commit embebido y árbol limpio al construir | sí | `6eac0a7b18c364e7835a3e2063e207bf8460dc9b` (esperado `6eac0a7b18c364e7835a3e2063e207bf8460dc9b`); árbol limpio: sí |
| Ambiente embebido | sí | appEnv `test` · API `https://be-api-hndp.onrender.com` (esperado `test` · `https://be-api-hndp.onrender.com`); el website se comprueba por el host del App Link |
| Google (client ID web) | sí | presente: sí; esperado: el client ID web registrado |
| Firebase (recursos de FCM) | sí | comprobado: sí; project_id `be-app-c4623` (esperado `be-app-c4623`); google_app_id sí; gcm_defaultSenderId sí; google_api_key sí |
| targetSdk ≥ 36 | sí | minSdk 24 · targetSdk 36 |
| Certificado del AAB (clave de subida) y sin entradas sin firmar | sí | 1 firmante(s) · SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06` · SHA-1 `b108ec558c0568abb4ccc2d7495d49b4e24836e6` · SHA256withRSA (esperado `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`) · autofirmado: sí · jarsigner -strict (código 4): verificado; el único aviso es la cadena de un certificado autofirmado, lo normal en Android |
| App Link de la invitación | sí | https://be-web-1ngj.onrender.com/invitacion (esperado el host de `https://be-web-1ngj.onrender.com`) |
| Esquema `be` | sí | esquemas be, https |
| assetlinks.json publicado con la clave de firma de la app | sí | HTTP 200, application/json, 1 declaración(es) del paquete con handle_all_urls, 1 huella(s), incluye la esperada: sí |
| 64 bits | sí | arm64-v8a, armeabi-v7a, x86, x86_64 |
| 16 KB · bibliotecas nativas sin comprimir (config del bundle) | sí | uncompressNativeLibraries `true` · extractNativeLibs en el manifiesto `false` (informativo) |
| 16 KB · alineación pedida por el bundle | sí | `PAGE_ALIGNMENT_16K` (se exige PAGE_ALIGNMENT_16K o 64K) |
| 16 KB · ELF de 64 bits (PT_LOAD a 16384, cada segmento en sus páginas, RELRO sin código ni datos ajenos en sus páginas) | sí | 34 de 64 bits (34 de 32, informativas) |
| 16 KB · `zipalign -c -P 16` sobre la APK universal, todas las bibliotecas sin comprimir y alineadas | sí | 68 en la APK, 68 bien, 0 comprimidas o mal |
| Sin credenciales adentro (todo el bundle descomprimido) | sí | 1306 archivos revisados de 1306 entradas, 171839502 bytes; valores del respaldo buscados: sí; hallazgos: 0 |

Informativo: clave de subida separada de la clave de firma de la app: no (la misma keystore; la recomendación ratificada es separarlas cuando Dirección genere la clave de subida). Permisos (10): ACCESS_NETWORK_STATE, CAMERA, INTERNET, POST_NOTIFICATIONS, READ_EXTERNAL_STORAGE, VIBRATE, WAKE_LOCK, WRITE_EXTERNAL_STORAGE, com.elianbufi.be.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION, com.google.android.c2dm.permission.RECEIVE.

**Pendiente en un dispositivo (no lo prueba este script):**
- Que la app arranque y funcione en un dispositivo o emulador con páginas de 16 KB (Android 15 o posterior con esa configuración): la alineación comprobada acá es la del artefacto, no la ejecución.

La APK universal la firma bundletool con una clave de debug: sirve para mirar adentro, no para instalar ni para comparar certificados. El certificado que importa es el del AAB (la clave de subida); el que verán los teléfonos es el de la clave de firma de la app que guarde Google, y es el que tiene que estar en assetlinks.json y en el client ID Android de Google.

