# Publicación · APK 0.12.1 (temas, formularios acotados y series por número)

**Estado: PUBLICADA el 2026-09-30. Falta la validación de Dirección en el teléfono.**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.12.1, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.12.1/be-0.12.1-fec9450.apk`
- **SHA-256:** `ade46654d918483b0acd385034b71b757f4d27b2df2818c375aefdda914f85f9` · **tamaño:** 70.842.323 bytes
- **Versión:** 0.12.1 · versionCode 18
- **Commit construido:** `fec9450963d29c3666c7fa057266f79fa6aae01f` (`main`, merge de #124), con la CI de `main` en verde, incluido en la app.

## Qué incluye

| Cambio | Decisión | En `main` |
|---|---|---|
| Dos temas con selector en Cuenta: «Azul noche» (predeterminado, medido en las pantallas de referencia) y «Claro» (compositor de láminas, con ajustes de contraste); la elección queda en el teléfono | Dirección, 2026-09-30 | #124 (`fec9450`) |
| El texto de una respuesta de formulario tiene tope (2000 caracteres) y el motivo de una corrección también (1000): el campo no deja pasarse | WP-07 §9.3; Dirección, 2026-09-30 | #123 (`3271c8d`) |
| Recuperación ante errores al responder y corregir un formulario: «Cargar lo guardado», «Volver a Información», resultado incierto separado | DL-104 | #113 (`53cc70e`) |
| Las series pendientes se calculan por número real de serie, no por cantidad de registros | Hallazgo registrado en la publicación 0.12.0 | `f103e82` (con #113) |

**Compatibilidad.** Ninguno de estos cambios toca las respuestas que lee la APK. La 0.12.0 sigue funcionando contra la API actual.

## Qué está desplegado (cada cosa por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `76f2a10` (merge de #122, con los once PR del 2026-09-30) | `/health/ready`: `commit` ese SHA, base de datos OK, migraciones OK |
| **Website** (`be-web-1ngj`) | el mismo despliegue | responde 200 en `/`, `/login/` y `/pro/templates/`, que muestra «Plantillas y habituales» |
| **APK** | `fec9450963d29c3666c7fa057266f79fa6aae01f` (#124) | Commit incluido en `assets/app.config` |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md)), con **un solo worker de Gradle**.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 26m 34s`, en el primer intento. Tardó más que la 0.12.0 (18 min 43 s) porque la máquina tenía poca memoria libre.
- **Corte de las tareas de fondo:** Claude Code cortó por falta de memoria las tareas de fondo que la seguían. Gradle siguió vivo y terminó, y se lo siguió leyendo su registro. No hubo que relanzarlo.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio. No se generó ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.
- **Dependencia nueva:** `@react-native-async-storage/async-storage` 2.2.0, la versión que fija Expo 57, para guardar la elección de tema. Quedó enlazada: sus clases están en `classes.dex` y `classes2.dex`.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.12.1 · `versionCode` 18 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.12.0**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `fec9450963d29c3666c7fa057266f79fa6aae01f` · `construidoEn` `2026-10-01T01:09:01.630Z` |
| Código nuevo incluido | El bundle contiene `be-apariencia` y `azul-noche` (temas) y `FORM_ANSWER_TOO_LONG` (formularios) |
| Credenciales privadas | Ninguna: las 1142 entradas, descomprimidas, sin contraseñas ni alias (ASCII y UTF-16LE), sin `PRIVATE KEY` ni el inicio de la keystore, y sin archivos `credentials.json`, `.jks`, `.keystore` ni `.env` |
| Archivo publicado | Se descargó de la release y se volvió a calcular: SHA-256 y tamaño idénticos al construido. `releases/latest` redirige a `be-apk-0.12.1` |

## Recorrido de validación en el teléfono

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

1. **Instalar encima de la 0.12.0**, sin desinstalar.
   - **Esperado:** se instala como actualización.
   - **Esperado:** al pie dice «app 0.12.1 · test · commit fec9450».
2. **Azul noche (predeterminado).** Recorré Hoy, Información, Tu historial, Vínculos y Cuenta.
   - **Esperado:** el fondo es más oscuro que en la 0.12.0, las tarjetas tienen un borde luminoso y el botón principal es claro con texto oscuro.
   - **Esperado:** todo el texto se lee bien.
3. **Cambiar a Claro.** Entrá a Cuenta → Apariencia → «Claro».
   - **Esperado:** toda la app pasa a fondo claro al instante, en la misma pantalla y sin cerrar la sesión.
   - Recorré las mismas pantallas y abrí un diálogo de confirmación.
4. **La elección queda guardada.** Cerrá la app del todo y volvé a abrirla.
   - **Esperado:** arranca en Claro.
   - Volvé a Azul noche para seguir.
5. **Formularios.** En una respuesta de texto, intentá escribir o pegar más de 2000 caracteres.
   - **Esperado:** el campo no deja pasarse.
   - **Esperado:** al corregir, el motivo tampoco pasa de 1000.
6. **Pendientes de la 0.12.0.** Siguen pendientes DL-104 y la parte de APK de PF-03. El recorrido está en [`EVIDENCIA/PUBLICACION-0.12.0/LEEME.md`](../PUBLICACION-0.12.0/LEEME.md), fases 4 a 10, y vale igual con la 0.12.1.
   - **Esperado en la fase 8:** se pueden registrar series salteadas, por ejemplo la 1 y la 3, sin que la app proponga mal la próxima.

**Qué cierra esta tanda.**
- Con los pasos 1 a 4, el aspecto de los dos temas en el teléfono.
- Con el paso 6, DL-104 y la parte de APK de DL-105.
- «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.

## Límites

- **TalkBack y teclado:** no se verificaron.
- **Diálogos del sistema:** las alertas nativas quedan oscuras en los dos temas.
- **Logo:** se mantiene la esfera cian. El logo con alas de las pantallas de referencia es una decisión de marca aparte.
- **Datos:** solo sintéticos, sin credenciales.
