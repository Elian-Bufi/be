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

- **Qué está listo:** la rama de versión `aab/candidata-0.18.0-2` (`VERSION = '0.18.0-candidata.2'` y
  `versionCode: 31` sobre esta rama, que se vuelve a mezclar en ella con cada corrección; el commit de origen del
  artefacto será la cabeza de esa rama al construir, y va en el nombre del archivo y en `esperado.json`), el árbol
  `C:\Users\bufim\BE-aab` (sin `node_modules`: hay que correr `npm ci`), el plugin de firma, los scripts, bundletool
  1.18.3 en `C:\Users\bufim\BE-herramientas\bundletool\` y la carpeta de salida `C:\Users\bufim\BE-artefactos\aab\`.
- **Qué pasó:** el 2026-10-28 se intentó dos veces. La primera, con un árbol espejado por junctions, falló al compilar
  el dominio (faltaba el `node_modules` anidado con zod 4.6.x: un artefacto construido así no sería fiel al lockfile).
  La segunda, con `npm ci` en el árbol (el procedimiento documentado), la cortó la poca memoria de la PC: el guardián de
  memoria de la sesión detuvo el proceso y `npm ci` terminó con `0xC0000142` en el preinstall de Prisma, con ~700 MB
  libres. La construcción de Gradle (~2,5 GB, 40 min) no se lanzó: no era viable en esas condiciones. Después de las
  correcciones del verificador, con la rama de versión actualizada (`b6ea7c3`), se midió de nuevo: 733 MB libres de
  6.030, sin Chrome, Java ni Node. Y después de las correcciones de la revisión adversaria (18:40 UTC): 685 MB libres,
  con la sesión de Claude (unos 820 MB entre tres procesos) y el antivirus (229 MB) como procesos más grandes. Sin
  margen, y sin repetir intentos (pedido de Dirección): el bloqueo es la memoria libre de la PC.
- **Cómo construirlo (punto de reanudación): el lanzador `scripts/aab/lanzar-aab.ps1`**, con Claude y Chrome
  cerrados (mejor después de reiniciar la PC), desde una ventana de PowerShell:

  ```
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\bufim\BE-aab\scripts\aab\lanzar-aab.ps1
  ```

  y para consultar el resultado (desde cualquier ventana, también mientras corre):

  ```
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\bufim\BE-aab\scripts\aab\lanzar-aab.ps1 -Consultar
  ```

  El lanzador comprueba (Node 22 de fnm, npm, git; rama `aab/candidata-0.18.0-2`, commit igual al publicado, árbol
  limpio; JDK de Android Studio, build-tools 36, NDK, bundletool, tar, curl; los archivos de datos y del respaldo,
  solo que existan; memoria y disco libres), y después corre en orden `npm ci`, `construir-aab.mjs` y
  `verificar-aab.mjs` contra el `esperado.json` de esa construcción, y revisa el registro con el detector de
  credenciales. Se detiene en el primer fallo, sin reintentos y sin verificar un artefacto anterior (si hay uno del
  mismo commit, lo aparta en `previos\`). Termina con una sola línea: **TERMINADO**, **FALLÓ en <paso>** o
  **BLOQUEADO por <motivo>**, y deja `C:\Users\bufim\BE-artefactos\aab\registros\<fecha-hora>\` con `lanzador.log`,
  `estado.json` y, si llegó, `verificacion.md`, `verificacion.json`, `construccion.json` y `esperado.json`. El
  artefacto queda en `C:\Users\bufim\BE-artefactos\aab\0.18.0-candidata.2\be-0.18.0-candidata.2-<commit>.aab`. Con
  `-SoloComprobar` hace solo las comprobaciones. El umbral de memoria es del lanzador (2.500 MB libres; `-MinimoMb`
  lo cambia bajo tu responsabilidad): no garantiza que Gradle llegue, solo evita arrancar en las condiciones en que ya
  falló. Cuando termine, copiá `verificacion.md`, `construccion.json` y `esperado.json` del registro a esta carpeta.
- **Lo probado del lanzador (28/10, sin construir):** los caminos de bloqueo (rama equivocada, árbol sucio, memoria
  insuficiente), `-Consultar` sin lanzamientos y después de cada uno, y las comprobaciones completas hasta el final
  con un umbral bajo (`-SoloComprobar -MinimoMb 100`: Node 22, rama `aab/candidata-0.18.0-2` igual a `origin`, árbol
  limpio, versión 0.18.0-candidata.2 / 31, herramientas, datos y respaldo presentes). Lo que NO se probó: `npm ci`,
  la construcción y la verificación sobre un AAB real, porque la PC tenía 461 MB libres con esta sesión abierta
  (14 procesos de Claude, ~1 GB). El revisor del registro se probó con un registro limpio (0 hallazgos) y con un
  secreto sintético (1 hallazgo, sin mostrarlo).
- **Si el primer artefacto falla:** el registro dice en qué paso. `npm ci` o Gradle que se cortan son la construcción
  (memoria, red, SDK); un `verificar-aab.mjs` con código 2 es una herramienta o el `esperado.json`; un código 1 con
  `verificacion.md` es el artefacto o la configuración (la tabla dice qué comprobación falló y qué valor leyó contra
  cuál esperaba); y si el valor leído es correcto y la comprobación igual da mal, es el verificador. No atribuirlo
  al script de antemano: mirar primero el valor leído.

## Si esta PC no alcanza: alternativas (nada activado, ningún secreto movido)

0. **Antes de cambiar de máquina:** reiniciar la PC y lanzar sin abrir nada más. Las APK anteriores (0.13.2 a
   0.18.0-candidata.1) se construyeron en esta misma PC con todo cerrado; lo que hoy no deja margen es la sesión de
   Claude (~1 GB), Chrome y los agentes de Dell (~260 MB entre SupportAssist y TechHub, que se pueden detener).
1. **Otra PC propia** (Windows, la del lanzador; Linux o macOS con ajuste): 8 GB de RAM (16 mejor), 20 GB libres,
   git, Node 22.23.2, JDK 17 (el de Android Studio o Temurin), Android SDK con platform 36, build-tools 36.0.0 y
   NDK 27.1.12297006, bundletool. Clonar el repo en la rama de versión y copiar `BE-datos-locales` (firebase y
   google) y el respaldo de la keystore **solo si la PC es tuya**: los secretos no viajan a una máquina de terceros.
   En Windows, el lanzador con `-Node22`, `-JavaHome`, `-AndroidHome`, `-Bundletool`, `-Datos` y `-Respaldo`. En
   Linux o macOS, `construir-aab.mjs` llama a `gradlew.bat`: habría que ajustarlo a `gradlew` (no está hecho).
   Costo: ninguno.
2. **GitHub Actions, sin la keystore:** un workflow manual en un runner Linux de GitHub construye el AAB **sin
   firma de release** (sin las variables de firma, el plugin deja la de debug) y lo sube como artefacto del workflow;
   después, en tu PC, se firma con `jarsigner` y la keystore del respaldo (un AAB es un jar; Play acepta esa firma).
   Así la clave nunca sale de tu PC. Lo que sí habría que cargar como secretos del repositorio: `google-services.json`
   y el client ID web (datos privados, no credenciales; el `google-services.json` termina embebido en toda APK). Costo:
   gratis en un repositorio público; en uno privado, el plan Free de GitHub incluye 2.000 minutos por mes y después
   un runner Linux cuesta alrededor de USD 0,008 por minuto (una construcción de 30 a 40 minutos, unos USD 0,30).
   Memoria del runner: 7 GB garantizados (más en repositorios públicos). No se creó ningún workflow.
3. **EAS Build (Expo):** la keystore **ya está** en EAS (es la que generó), así que no hay que mover ningún secreto, y
   EAS firma con ella, que es exactamente la clave de firma de la app que Play va a recibir. Hace falta un perfil de
   `eas.json` con `buildType: app-bundle` (el perfil `test` hoy produce APK) y una sesión de Expo con permiso sobre
   el proyecto. Costo: el plan gratuito tiene un cupo mensual de construcciones con cola de menor prioridad; los
   planes pagos arrancan en unas decenas de dólares por mes (ver expo.dev/pricing antes de decidir). Tarda 15 a 25
   minutos. No se lanzó ninguna construcción ni se cambió el perfil.
- **Cómo verificarlo:** `node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado <carpeta>/esperado.json` (el
  `esperado.json` lo deja `construir-aab.mjs` a partir de las fuentes de la construcción); copiar `verificacion.md`,
  `construccion.json` y `esperado.json` a esta carpeta (no tienen secretos). El verificador exige cada valor esperado
  (paquete, versión, versionCode, commit, ambiente, Google, Firebase, invitaciones, los dos certificados) y «todo
  bien» solo si cada comprobación obligatoria corrió y dio bien; si no hay red para leer el `assetlinks.json`
  publicado, esa comprobación queda pendiente y no hay «todo bien».
- **Lo que debería dar** (predicción, no resultado): paquete `com.elianbufi.be`, versionCode 31, targetSdk 36, las
  cuatro arquitecturas, 16 KB en verde en el artefacto, App Link `https://be-web-1ngj.onrender.com/invitacion`,
  ambiente `test` y el commit de la rama de versión, certificado SHA-256 `61569691…893e06` (la keystore de EAS,
  hasta que exista la clave de subida separada).

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

Está en `verificacion.md`, contra los valores esperados: bundle válido, paquete, versión y versionCode, commit y
árbol limpio al construir, ambiente (`test`, `be-api-hndp`), el client ID web de Google, los recursos de Firebase,
targetSdk 36, 64 bits, el App Link de la invitación y el `assetlinks.json` publicado con la clave de firma de la app,
16 KB **en el artefacto** (la configuración del bundle: bibliotecas nativas sin comprimir y `PAGE_ALIGNMENT_16K`; la
alineación ELF de cada biblioteca de 64 bits: PT_LOAD a 16384 y fin del RELRO alineado; y `zipalign -c -P 16` sobre la
APK universal con todas las bibliotecas sin comprimir), el certificado del AAB con `keytool` y `jarsigner -strict`, y la
ausencia de credenciales en todo el bundle descomprimido (por nombre, por contenido y, con `--respaldo`, los valores
literales de las contraseñas del respaldo, que se leen y nunca se escriben). «Todo bien» solo si cada comprobación
obligatoria corrió y dio true; una pendiente o un valor que no se pudo leer lo impiden. Y en la CI del PR: el plugin de
firma (3 pruebas) y el verificador (`scripts/aab/verificar-aab.test.cjs`: secretos sintéticos dentro de un zip, el
bloque de firma JAR que NO es un secreto, un PKCS#12 sintético, un zip anidado, archivos grandes por bloques, ELF
sintéticos de 64 y 32 bits con y sin RELRO, y el esperado incompleto o vacío que nunca da «todo bien»). CI verde en
`6690af0` (corrida 40730842576) y en `7475ea1` (corridas 40734129288 y 40734140772).

### G. Lo que 16 KB deja para un dispositivo (pendiente en el teléfono)

La alineación comprobada en F es la del artefacto. Que la app arranque y funcione con páginas de 16 KB se prueba en
un dispositivo o emulador con esa configuración (Android 15 o posterior, imagen de 16 KB): abrir la app, entrar,
registrar una comida con foto y recibir un aviso. No se hizo.
