# Google Play · pruebas internas: el AAB candidato y el guion de prueba (2026-10-28)

WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (encargo de Dirección del 2026-10-28). La ruta, los bloqueos y las decisiones están en
`docs/paquetes/GOOGLE-PLAY-PRUEBAS-INTERNAS-2026-10-28.md`; lo operativo, en `docs/DESPLIEGUE.md` («Google Play · pruebas
internas»). **Nada se publicó en Google Play ni en GitHub Releases; la APK vigente (0.18.0-candidata.1) no se tocó.**

## Estados, para no confundirlos

| Estado | Qué significa acá |
|---|---|
| Comprobado automáticamente | lo verificó un script sobre el artefacto o lo fijó una prueba de la CI |
| Pendiente en el teléfono | solo se puede comprobar instalando en un teléfono real |
| Pendiente en Play Console | necesita la cuenta y la consola de Dirección |

## El AAB candidato: preparado, **no construido** en esta sesión

- **Qué está listo:** la rama de versión `aab/candidata-0.18.0-2` (commit `b2fc0e6` = esta rama en `3c091e8` + un commit
  con `VERSION = '0.18.0-candidata.2'` y `versionCode: 31`), el árbol `C:\Users\bufim\BE-aab`, el plugin de firma, los
  scripts, bundletool 1.18.3 en `C:\Users\bufim\BE-herramientas\bundletool\` y la carpeta de salida
  `C:\Users\bufim\BE-artefactos\aab\`.
- **Qué pasó:** el 2026-10-28 se intentó dos veces. La primera, con un árbol espejado por junctions, falló al compilar
  el dominio (faltaba el `node_modules` anidado con zod 4.6.x: un artefacto construido así no sería fiel al lockfile).
  La segunda, con `npm ci` en el árbol (el procedimiento documentado), la cortó la poca memoria de la PC: el guardián de
  memoria de la sesión detuvo el proceso y `npm ci` terminó con `0xC0000142` en el preinstall de Prisma, con ~700 MB
  libres. La construcción de Gradle (~2,5 GB, 40 min) no se lanzó: no era viable en esas condiciones.
- **Cómo construirlo (punto de reanudación):** con la PC lo más libre posible (sin Chrome; medir la RAM primero), en
  `C:\Users\bufim\BE-aab`, con Node 22 (`C:\Users\bufim\AppData\Roaming\fnm\node-versions\v22.23.2\installation`):
  `npm ci`, y después `node scripts/aab/construir-aab.mjs` (prebuild + `:app:bundleRelease`, firma desde el respaldo
  por el entorno, un worker, sin demonio). Deja `C:\Users\bufim\BE-artefactos\aab\0.18.0-candidata.2\be-0.18.0-candidata.2-b2fc0e6.aab`,
  su `.sha256` y `construccion.json`.
- **Cómo verificarlo:** `node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado-sha256-cert 61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`;
  copiar `verificacion.md` y `construccion.json` a esta carpeta (no tienen secretos).
- **Lo que debería dar** (predicción, no resultado): paquete `com.elianbufi.be`, versionCode 31, targetSdk 36, las
  cuatro arquitecturas, 16 KB en verde, App Link `https://be-web-1ngj.onrender.com/invitacion`, ambiente `test` y
  commit `b2fc0e6…`, certificado SHA-256 `61569691…893e06`.

## Guion de prueba

### A. Instalación limpia desde Play (pendiente en Play Console y en el teléfono)

1. Dirección sube el AAB a la pista interna con «Provide a copy of your app signing key» y comprueba en *App integrity*
   la SHA-256 `61569691…893e06`. Copia el enlace de participación.
2. En un teléfono **sin** BE instalada, con la cuenta de Google de la lista de probadores y Play Protect activo: abrir el
   enlace, aceptar la prueba, instalar desde Play Store.
3. Esperado: la app abre; Cuenta → «Acerca de» muestra `0.18.0-candidata.2`, el commit de la construcción y el ambiente
   `test`. No se tocan las protecciones del teléfono.

### B. Actualización compatible sobre la APK anterior (pendiente en el teléfono)

1. En el teléfono de Dirección, con la 0.18.0-candidata.1 (versionCode 30) instalada desde GitHub y la sesión abierta:
   anotar la versión en Cuenta y que la sesión está activa.
2. Abrir el enlace de participación e instalar desde Play Store (Play la toma como actualización: mismo paquete, mismo
   certificado, versionCode 31 > 30).
3. Esperado: **sin desinstalar**, la app conserva la sesión y el entrenamiento en curso, y muestra la versión nueva.
   Si Play pidiera desinstalar o apareciera «paquete con firma distinta», la clave de firma de Play no es la de EAS:
   parar y revisar *App integrity*.
4. Después, comprobar que una APK nueva de GitHub con versionCode 32 también se instale encima (misma clave): es la
   regla de una sola secuencia de versionCode.

### C. Inicio de sesión (pendiente en el teléfono)

1. Correo y contraseña: entrar y salir.
2. «Continuar con Google» con un usuario de prueba de la pantalla de consentimiento: tiene que entrar. Si dice «Ahora no
   podemos usar Google» justo después de elegir la cuenta, la huella de la firma no coincide con el client ID Android
   (`docs/DESPLIEGUE.md`, «Entrar con Google»).

### D. Invitaciones (pendiente en el teléfono)

1. Desde el website de test, invitar a una persona: enlace, QR y código.
2. Tocar el enlace en WhatsApp: tiene que abrir la app directo (App Link verificado). Si abre la página web `/invitacion`,
   el App Link no se verificó para esta firma: `adb shell pm get-app-links com.elianbufi.be` para ver el estado.
3. El QR y el código, como en la candidata.1.

### E. Notificaciones (pendiente en el teléfono)

1. Cuenta → «Activar avisos» y aceptar el permiso.
2. Desde el website, activar un plan de esa persona: llega «BE · Tenés una novedad.», y tocarlo abre Novedades.
   Si la versión de Play no recibe avisos y la APK sí, revisar en Google Cloud si la API key de Firebase está
   restringida por app Android (con nuestra clave no debería cambiar nada).

### F. Lo comprobado automáticamente (sin teléfono ni Play Console)

Está en `verificacion.md`: bundle válido, paquete, versión y versionCode, targetSdk 36, 64 bits, páginas de 16 KB,
App Link de la invitación, ambiente embebido (`test`, `be-api-hndp`, commit), certificado del AAB y ausencia de
credenciales adentro. Y en la CI del PR: el plugin de firma (3 pruebas) y lo de siempre.
