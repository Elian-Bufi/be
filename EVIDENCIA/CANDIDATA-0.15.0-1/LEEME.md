# APK candidata 0.15.0-candidata.1 · Antropometría, Nutrición y Entrenamiento para probar en el teléfono

**Estado: construida y publicada como prerelease el 2026-10-06, para la prueba de Dirección en el teléfono.**
- Es `main` integrado, con #146, #147, #149 y #150, contra `test` ya desplegado.
- Nada de lo nuevo se validó todavía en Android: lo probado es la CI, el recorrido local (162/162) y `test` desde el
  servidor y el navegador.
- La estable sigue siendo la 0.13.2: `releases/latest` apunta a `be-apk-0.13.2`.
- EVIDENCIA_VISUAL sigue como propuesta (DL-125), con la exigencia apagada en `test`.

| Dato | Valor |
|---|---|
| Archivo | `be-0.15.0-candidata.1-5846274.apk` |
| SHA-256 | `4126f3d9d0d88a3f01a435032c635e532dd5989a30f4def27f7afe1abb182866` |
| Tamaño | 81.612.294 bytes |
| Versión | `0.15.0-candidata.1`, versionCode 25 |
| Commit construido | `5846274c879cb69d29f05a9e2b82fc3f49d0c8e1`, en la rama `apk/candidata-0.15.0-1`. Es `main` en `ace91eb` más la versión, y solo cambia `apps/mobile/app.config.ts`. Viaja incluido en la app |
| Entrega | La prerelease [`be-apk-0.15.0-candidata.1`](https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.15.0-candidata.1), con el APK y su `.sha256`. Hay además una copia permanente en la carpeta Descargas del equipo de construcción, con una ficha de datos y de verificación |

## Integración y despliegue

| Paso | Resultado |
|---|---|
| #149 → `wp-nutricion-recetas` | Integrado (`d8a1a32`) |
| #147 → `apk/navegacion` | Integrado (`02136f5`) |
| #146 → `main` | Integrado (`d727226`), con el árbol idéntico al head que pasó la CI |
| #148 | Cerrado: sus arreglos quedaron dentro de la cadena |
| #150 → `main` | Integrado (`ace91eb`), con la CI en verde. Corrige las reglas de respaldo que rechazó el lint de Android en el primer intento de esta construcción (ver Construcción) |
| API de `test` | `/health/ready`: commit `d727226`, base OK, migraciones OK. #150 solo toca la APK y sus pruebas, así que no redespliega |
| Website de `test` | Sirve `d727226` |

No se hizo respaldo de la base remota antes de desplegar: Dirección retiró ese requisito el 2026-10-06, porque los datos de
`test` son sintéticos. No se borró ni se recreó nada.

## Antes de construir

- La versión `0.15.0-candidata.1` y el versionCode 25 estaban libres: no había un tag ni una release con ese nombre, y el
  versionCode publicado más alto era 24 (la 0.14.0-candidata.2).
- La firma es la histórica: la keystore administrada por EAS, la misma de la 0.13.2 y de las candidatas 0.14.0.

## Construcción

Local, en Windows, con Gradle y un solo worker, en un worktree limpio y separado en el commit construido.

- **Primer intento (sobre `d727226`):** falló en `:app:lintVitalRelease` después de 34 min 19 s. Fueron 12 errores
  «RKStorage is not in an included path»: las reglas de respaldo excluían la base de AsyncStorage, pero esa base no estaba
  incluida, y Android solo admite excluir lo incluido. Se corrigió en #150, que deja una sola inclusión (las preferencias)
  y excluye solo el almacenamiento seguro. La base de AsyncStorage sigue fuera del respaldo.
- **Segundo intento (sobre `ace91eb` más la versión):** `BUILD SUCCESSFUL in 34m 10s`, 434 tareas, con `lintVitalRelease` en
  verde.

## Verificación del artefacto

La salida completa está en [`verificacion-del-artefacto.txt`](verificacion-del-artefacto.txt).

| Control | Resultado |
|---|---|
| Paquete y versión | `com.elianbufi.be`, versionCode 25, `0.15.0-candidata.1`; minSdk 24, targetSdk 36 |
| Firma | Esquema v2, un firmante. El certificado `61569691…893e06` es idéntico al de la 0.14.0-candidata.2 y al de la 0.13.2 |
| `assets/app.config` | `appEnv` test, la API `https://be-api-hndp.onrender.com` y el commit `5846274…` |
| Código nativo | Están el reloj desde el arranque, expo-crypto, expo-secure-store, react-native-svg y expo-image-picker |
| Respaldo | `allowBackup` con reglas propias. En el respaldo y en la extracción se incluyen las preferencias y se excluye el almacenamiento seguro |
| Permisos | Respecto de la candidata 2, se agrega solo `CAMERA`, para la foto de «Comí algo diferente». Se pide al tocar «Cámara», no al abrir la app |
| Credenciales | Ninguna coincidencia en 1183 entradas |
| Árbol construido | El HEAD es el commit esperado, sin archivos versionados modificados |

## Publicación

| Control | Resultado |
|---|---|
| Release | `be-apk-0.15.0-candidata.1`, prerelease, creada con `--latest=false` |
| Tag | Apunta a `5846274c879cb69d29f05a9e2b82fc3f49d0c8e1` |
| `releases/latest` | Sigue en `be-apk-0.13.2` |
| Adjuntos | El APK (81.612.294 bytes) y su `.sha256` |
| Descarga pública, sin sesión | HTTP 200, 81.612.294 bytes y el mismo SHA-256 (`sha256sum -c` OK) |

## Cómo actualizar, sin desinstalar

Se instala encima de la 0.13.2 o de una candidata 0.14.0: el paquete y el certificado son los mismos y el versionCode es
mayor. Desinstalar borraría la sesión guardada.

## Datos de prueba en `test`

Sobre las cuentas de siempre (DEMO-A01, DEMO-PN y DEMO-PT), con las mismas contraseñas y los mismos vínculos. No se creó
ni se borró ninguna cuenta.

- **Antropometría:** las tomas de DEMO-A01 del 24/9 y del 1/10 siguen ahí (59 métricas).
- **Nutrición:** tres recetas de DEMO-PN con foto, del paquete `BE_Nutricion_Demo_2026-10-05`. El plan de DEMO-A01 tiene
  una versión nueva activada, la sucesora de la anterior. Conserva las opciones de antes y suma las recetas: tres en el
  almuerzo y una en la cena.
- **Entrenamiento:** tres ejercicios de DEMO-PT con imagen, del paquete `BE_Entrenamiento_Autonomo_2026-10-06`. Hay un
  borrador nuevo del plan de DEMO-A01, ya validado, con las sesiones A y B de antes más «Piernas A», que tiene objetivos
  por serie, y «Recuperación de prueba». **No está activado:** un plan con objetivos distintos por serie se activa recién
  cuando DEMO-A01 abrió Entrenamiento con esta APK, que es la comprobación de capacidad (DL-122). Hoy la API informa
  `setTargetsDelivery: {required: true, adviseeClientCapable: false}`.

## Recorrido de prueba

1. Instalar la APK encima de la actual, sin desinstalar, y entrar como DEMO-A01.
2. **Antropometría:** en «Mi evolución» tienen que verse las tomas del 24/9 y del 1/10.
3. **Nutrición:** el almuerzo de hoy ofrece cuatro opciones, tres con foto. Abrir una receta, registrarla y deshacer el
   registro. Después, probar «Comí algo diferente» con una foto, de la cámara o de la galería.
4. **Entrenamiento:** abrir Entrenamiento. Eso registra que DEMO-A01 usa una app que muestra los objetivos por serie.
5. **Activar el plan por serie:** en el website, como DEMO-PT, abrir
   `https://be-web-1ngj.onrender.com/pro/advisees/training?id=547d703d-254f-4472-aa7b-d380f7c36743&vista=plan` (si ya
   estaba abierta, recargarla), y tocar «Activar plan» y después «Activar esta versión». Si el paso 4 no se hizo, el
   website lo dice («Todavía no podés activar este plan») y la API lo rechaza igual.
6. **De vuelta en la APK:** en «Piernas A» tienen que verse los objetivos de cada serie, el descanso cronometrado y la
   imagen de cada ejercicio. «Recuperación de prueba» sirve para cerrar la app con un descanso abierto y ver qué pasa al
   volver.

## Límites conocidos

- **Pendiente en Android:** pantalla bloqueada, cierre desde recientes, muerte del proceso, reinicio del teléfono, cambio
  de hora, respaldo y restauración, teclado y TalkBack.
- La continuidad de Render y los respaldos permanentes quedan para después de esta prueba, antes del vencimiento de la base
  de `test`.
