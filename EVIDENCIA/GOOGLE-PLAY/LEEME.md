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

## El AAB candidato

Se completa con `verificacion.md` (lo escribe `scripts/aab/verificar-aab.mjs`) y `construccion.json` (lo escribe
`scripts/aab/construir-aab.mjs`), copiados a esta carpeta sin ningún secreto. El artefacto mismo queda fuera del
repositorio, en `C:\Users\bufim\BE-artefactos\aab\<versión>\`.

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
