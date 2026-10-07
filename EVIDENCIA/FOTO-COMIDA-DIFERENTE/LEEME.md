# La foto de «Comí algo diferente» no se guardaba (APK 0.15.0-candidata.1)

**Estado (2026-10-07): causa comprobada y corrección implementada en la rama `arreglo/foto-comida-diferente`.**
- Las pruebas locales y la verificación contra `test` dan todo como se esperaba.
- **Falta probarlo en el teléfono**, y para eso hace falta una APK nueva: el cambio es solo de la APK. La API y el website
  no cambian, así que no hay nada que desplegar.

## Lo que se observó en el teléfono

Nutrición → Cena → «Comí algo diferente» → Cámara. Se toma y se acepta la foto, y la vista previa aparece bien. Se
completan la descripción y la cantidad aproximada. Al tocar «Guardar cena» aparece «Esa imagen no se puede usar: tiene
que ser JPG, PNG o WebP, de hasta 10 MB». El texto y la cantidad siguen en pantalla.

## La causa, comprobada

El rechazo lo emite la API, pero la falla está en cómo la APK leía y mandaba la foto. **Fallaba cualquier foto, de
cualquier tamaño.**

1. **El `fetch` de la APK es el de Expo.** Expo 57 instala `expo/fetch` como `fetch` global
   (`expo/src/winter/runtime.native.ts`, salvo con `EXPO_PUBLIC_USE_RN_FETCH`).
2. **La lectura daba un `Blob` sin tipo.** La pantalla leía la foto con `fetch(uri).blob()`. Para un `file://`, el lado
   nativo de `expo/fetch` (`OkHttpFileUrlInterceptor.kt`) arma la respuesta sin cabeceras: el tipo queda en el cuerpo y
   no se copia a las cabeceras. `FetchResponse.blob()` toma el tipo de la cabecera `content-type`, así que el `Blob`
   salía con el tipo vacío.
3. **La subida pisaba la cabecera.** Con un `Blob` como cuerpo, `normalizeBodyInitAsync` (`RequestUtils.ts`) devuelve
   `overriddenHeaders: [['Content-Type', body.type]]`. Eso reemplaza el `Content-Type: image/jpeg` que ponía el cliente,
   y el pedido salía con `Content-Type` vacío.
4. **La API lo rechazó bien.** API-MED-02 respondió, como dice su contrato, 422 `FILE_TYPE_NOT_ALLOWED`, con el
   problema en `Content-Type` y no en `(body)`.
5. **La pantalla culpó a la foto.** Trataba todo 422 `FILE_*` como un problema de la foto y mostraba «Esa imagen no se
   puede usar…». Volvía a la edición con la foto y el texto, que es lo que se vio.

**No era el tamaño.** En la candidata, la vista previa aparece solo si el selector informó un tipo admitido y, si
informó un tamaño, de hasta 10 MB. Además, el archivo que se sube es el que el selector volvió a comprimir. La foto sintética de la
reproducción pesa 1,86 MB y falla igual.

**Cómo se comprobó:**
- **En la fuente** de `expo` 57.0.23 y `expo-image-picker` 57.0.20, en los archivos citados.
- **Reproducción contra la API real de `test`**, en [`reproduccion-candidata.txt`](reproduccion-candidata.txt). Usa:
  - el módulo de la candidata (`5846274`);
  - la lectura y la subida como en la pantalla de la candidata;
  - el cliente real de `@be/domain`;
  - el `fetch` de Expo, con su código JS real y el lado nativo reproducido según su fuente.

  Sale el mismo mensaje que en el teléfono.
- **Una prueba en el repositorio** con el `RequestUtils.ts` real de Expo: con un `Blob` sin tipo, el `Content-Type`
  llega vacío.
- **Límite:** el lado nativo (la respuesta de un `file://` sin cabeceras) se reprodujo según la fuente, no se ejecutó en
  Android. No se pudo usar el emulador: la máquina tenía 0,4 GB libres. Lo que se vio en el teléfono coincide con la
  reproducción.

## En el mismo recorrido, la galería

Con `quality: 0.8`, que es la de la APK, `expo-image-picker` vuelve a codificar en Android toda imagen que se elige. Si
era PNG la deja en PNG y si no la pasa a JPEG, aunque declare el tipo del original y aunque el archivo conserve la
extensión `.webp` o `.gif`. Además, `fileSize` es el tamaño del original. Con la cabecera ya arreglada, la candidata igual
habría fallado así:
- **Un WebP de la galería:** subía bytes JPEG declarados como `image/webp`. La API los rechaza (`FILE_CONTENT_INVALID`,
  contenido distinto del declarado).
- **Un HEIC o un GIF:** se rechazaba al elegirlo, aunque el selector ya lo había convertido a JPEG.
- **Un original de más de 10 MB:** se rechazaba al elegirlo, aunque el archivo comprimido entrara en el límite.

## La corrección

- **`leerLaFoto`** (`apps/mobile/src/borrador-de-comida-diferente.ts`):
  - lee los bytes del archivo (`arrayBuffer`), nunca un `Blob`;
  - toma el tipo real de los primeros bytes (JPEG, PNG o WebP), igual que la API;
  - toma el tamaño de los bytes y las medidas del selector.
  - La pantalla sube esos bytes con ese tipo, y `expo/fetch` respeta el `Content-Type` declarado cuando el cuerpo son
    bytes.
- **Al elegir** se mira que sea una imagen y que sus medidas estén dentro de lo admitido. El tipo y el tamaño del
  original ya no deciden.
- **`motivoDelRechazo`:** solo un rechazo por los bytes (`(body)`) o por el tamaño culpa a la foto. Uno por la cabecera
  o por lo declarado es una falla del envío: la pantalla ofrece «Reintentar» y «Guardar sin la foto», y no dice que la
  foto no sirve.
- **No cambian:**
  - los límites (10 MB, de 64 a 8000 px por lado y hasta 40 MP);
  - la validación de la API;
  - la recodificación en el servidor, que no copia EXIF, GPS, ICC ni XMP;
  - la calidad del selector (una prueba exige que siga siendo menor que 1);
  - la clave única del registro (API-ING-02), que evita registros duplicados;
  - lo que queda en pantalla ante un error: la foto y el texto.
- **No se agregó reducción de la foto.** No hacía falta para este defecto, y el selector ya convierte el formato. Una
  foto de más de 8000 px por lado o de más de 40 MP, como las de los modos de 50 MP, sigue rechazándose al elegirla, con
  el aviso que da las medidas. Reducirla en el teléfono requeriría un módulo nativo nuevo.

## Pruebas

**1. En el repositorio:**
- `scripts/registro-de-comidas.test.mjs`: 30 de 30. Hay cuatro pruebas nuevas y dos ajustadas:
  - el tipo por los bytes;
  - la lectura de la foto, incluidos un archivo que ya no está y uno de más de 10 MB;
  - qué rechazo culpa a la foto;
  - el envío con el código real de `expo/fetch`;
  - la verificación de código de la pantalla, que exige bytes, el tipo real y ningún `.blob()`.
- Todas las pruebas de `scripts/` del comando `test`: 293 de 293.
- El tipado de la APK pasa.

**2. Contra `test`, con el arreglo:** está en [`verificacion-arreglo.txt`](verificacion-arreglo.txt). Usa siete archivos
sintéticos con la forma en que los deja el selector de Android, el `fetch` de Expo emulado y la API real, como DEMO-A01.

| Archivo (como lo deja el selector) | Al elegir y al leer | Envío y API | Lo guardado |
|---|---|---|---|
| Cámara, 4000×3000, JPEG | Aceptada; tipo real `image/jpeg` | `Content-Type: image/jpeg` → 200 | 1600×1200, sin EXIF |
| Cámara vertical, 3000×4000 | Aceptada; `image/jpeg` | 200 | 1200×1600: conserva la orientación |
| Captura de la galería, PNG 1080×2400 | Aceptada; `image/png` | 200 | 720×1600, en JPEG |
| WebP de la galería (bytes JPEG, `.webp`) | Aceptada; `image/jpeg` | 200 | 1600×1200 |
| HEIC de la galería (bytes JPEG, declara `image/heic`) | Aceptada; `image/jpeg` | 200 | 1600×1200 |
| GIF de la galería (bytes JPEG, `.gif`) | Aceptada; `image/jpeg` | 200 | 480×360 |
| Más de 10 MB después de comprimir | Rechazada al leerla, sin pedir la ruta | No se envía | — |

Además, la misma subida repetida en la misma ruta devolvió el mismo medio.

**Ninguna de estas pruebas es el teléfono.** Los archivos son imágenes generadas, que imitan la salida del selector
según su fuente. El envío sale desde Node, con el `fetch` de Expo emulado: su código JS es el real y el lado nativo se
reprodujo según la fuente.

## Lo que falta en el teléfono, con una APK nueva

1. **Cámara:** Cena → «Comí algo diferente» → Cámara → «Guardar cena». Tiene que quedar registrada, con la foto en el
   registro.
2. **Galería:** una foto común y, si el teléfono tiene, un HEIC o un WebP.
3. **Sin red:** activar el modo avión y tocar «Guardar». Tiene que aparecer un error, con la foto y el texto todavía en
   pantalla. Después, volver a conectar y tocar «Reintentar»: tiene que quedar un solo registro.
4. **El profesional:** en el website, DEMO-PN tiene que ver la foto del registro.

## Datos de `test`

Las pruebas se hicieron como DEMO-A01 y no registran comidas, para no tocar la cena que quedó pendiente en el teléfono.
Cada foto subida en las pruebas se suprimió con API-MED-05, que deja su registro de supresión. Quedan dos intenciones sin
bytes, que no guardan ninguna imagen: la del intento en el teléfono y la de la primera reproducción.

## Herramientas

En [`herramientas/`](herramientas/), sin credenciales:
- `expo-fetch-emulado.mjs`;
- `fotos-android.mjs`;
- `reproducir.mjs`;
- `verificar-arreglo.mjs`.

Piden el token de una sesión APK de la cuenta de prueba en `BE_TOKEN_A01`. `BE_API` es opcional. Para reproducir el
defecto, `MODULO` tiene que apuntar al `borrador-de-comida-diferente.ts` de la candidata.
