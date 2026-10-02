# Publicación · APK 0.13.0 (UX y UI: barra inferior, figura en SVG y menos texto; catálogo de 21 métodos)

**Estado: PUBLICADA el 2026-10-01. Falta la validación de Dirección en el teléfono.**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.13.0, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.13.0/be-0.13.0-0c02326.apk`
- **SHA-256:** `a628003530b39f0b8320f4bcb49360ce3de4105e700dbc7fb73444ed1f2310e7` · **tamaño:** 78.103.826 bytes
- **Versión:** 0.13.0 · versionCode 20
- **Commit construido:** `0c0232633033331f60934b36caee944bb1e6def4` (`main`, merge de #128), con la CI de `main` en verde, incluido en la app.

## Qué incluye

| Cambio | Decisión | En `main` |
|---|---|---|
| APK: barra inferior con cinco zonas (Nutrición, Entrenamiento, Evolución, Información, Cuenta); abre en Nutrición; atrás vuelve a Nutrición; la barra se esconde con el teclado | Dirección, 2026-10-01; DL-113, a ratificar | #128 (`0c02326`) |
| APK: la figura en SVG (anillos como elipses), con bíceps y cresta ilíaca; explicaciones plegadas en «Cómo se lee» | DL-113 | #128 |
| Website: éxitos donde se mira, diálogo modal para registrar, Cálculos con lo técnico a un toque, aviso de variantes por sexo, el resto de las pantallas con menos texto a la vista | DL-113 | #128 |
| Lámina: bíceps y cresta ilíaca sobre la figura; pie con las dos sumas y «Sin calcular» | DL-113 | #128 |
| Catálogo purgado: 21 métodos vigentes; los retirados se consultan como históricos y sus corridas siguen en la historia | DL-112, a ratificar | #128 |
| Auditoría de dependencias con excepción declarada para node-forge, que no tiene versión corregida | DL-114, provisoria | #128 |

**Compatibilidad.** La forma de las respuestas que lee la APK no cambió. La 0.12.2 sigue funcionando contra la API nueva, pero sin la barra ni la figura en SVG: esas dos cosas viajan solo en la 0.13.0.

## Qué está desplegado (cada cosa por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `0c02326` (merge de #128) | `/health/ready`: `commit` `0c0232633033331f60934b36caee944bb1e6def4`, base de datos OK, migraciones OK (incluye la de la purga, `20261002000000`). Con la cuenta DEMO-PA, en una consulta de solo lectura, el catálogo ofrece 22 métodos: los 21 de BE y el sintético de demostración, ninguno retirado y los 4 nuevos |
| **Website** (`be-web-1ngj`) | el mismo despliegue | responde 200 en `/`, `/login/` y `/pro/advisees/anthropometry/`, y su CSS trae las clases nuevas (`aviso-flotante`, `ayuda__cuerpo`) |
| **APK** | `0c0232633033331f60934b36caee944bb1e6def4` (#128) | Commit incluido en `assets/app.config` |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md)), con **un solo worker de Gradle**.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 26m 55s`, en el primer intento. La tarea de fondo que la lanzó se cortó por falta de memoria en la máquina, pero Gradle siguió solo y el script terminó («fin OK»). `firmar.cjs` no escribe copias de la clave: le pasa a Gradle la ruta y las contraseñas por el entorno, así que el corte no dejó nada que limpiar.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio. No se generó ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.
- **Dependencia nativa nueva:** `react-native-svg` 15.15.4, la versión que fija Expo 57. Por eso esta es la primera APK que puede dibujar la figura en SVG.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.13.0 · `versionCode` 20 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.12.2**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `0c0232633033331f60934b36caee944bb1e6def4` · `construidoEn` `2026-10-02T00:59:51.432Z` |
| Código nuevo incluido | El bundle trae `tablist` (la barra inferior), «Masa grasa (Durnin y Womersley)» y «Masa libre de grasa (Durnin y Womersley)» (los métodos nuevos) y «Sin calcular» (el pie de Pliegues) |
| react-native-svg | Sus clases nativas (`com/horcrux/svg`) están en el código del paquete |
| Imágenes de la figura | La tabla de recursos tiene `drawable/assets_figura_hombreentero` y `drawable/assets_figura_mujerentero` (`aapt2 dump resources`) |
| Credenciales privadas | Ninguna en las 1149 entradas, descomprimidas: sin contraseñas ni alias (ASCII y UTF-16LE), sin `PRIVATE KEY` ni el inicio de la keystore, y sin archivos `credentials.json`, `.jks`, `.keystore` ni `.env` |
| Archivo publicado | Se descargó de la release y se volvió a calcular: SHA-256 y tamaño idénticos al construido. `releases/latest` redirige a `be-apk-0.13.0` |

## Recorrido de validación en el teléfono

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

1. **Instalar encima de la 0.12.2**, sin desinstalar.
   - **Esperado:** se instala como actualización y al pie dice «app 0.13.0 · test · commit 0c02326».
2. **La barra inferior.**
   - Al entrar, la APK abre en Nutrición y abajo están las cinco zonas.
   - Tocá cada una: la elegida se marca con una barrita y en negrita.
   - Desde Entrenamiento, el botón atrás vuelve a Nutrición; desde Nutrición, sale de la app.
3. **El teclado.** En un campo de texto, por ejemplo al registrar una comida, la barra se esconde mientras escribís y vuelve al cerrar el teclado.
4. **«Mi evolución»** (zona Evolución).
   - **Esperado:** los anillos de los perímetros son elipses y no se rompen.
   - **Esperado:** en «Pliegues» aparecen el bíceps y la cresta ilíaca, si la toma los tiene.
   - **Esperado:** «Cómo se lee» y «La figura, en lista» se abren y se cierran.
5. **Cuenta.** Ya no tiene los botones de las zonas: quedan vínculos, estado, privacidad, apariencia, sesión y cierre.
6. **Si se puede:** TalkBack (cada zona se anuncia como pestaña, y la elegida como «seleccionada») y la letra del sistema al máximo.

**En el website, como profesional:**
1. Guardá una evaluación en preparación: «Guardado» aparece abajo. Registrala: el diálogo queda centrado.
2. Calculá un método: el aviso aparece abajo y se va solo. El selector ofrece 21 métodos.
3. Lámina, Pliegues: el bíceps y la cresta ilíaca, con su flecha. Si alguno no está bien ubicado, decí dónde tendría que ir.

**Qué cierra esta tanda.** Con estos pasos, la barra, la figura y los avisos en el teléfono. «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.
