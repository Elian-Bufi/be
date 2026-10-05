# APK candidata 0.14.0-candidata.1 · Inicio y navegación (DL-117), con el pulido visual

**Estado: construida para probar en el teléfono, el 2026-10-05 (el reintento empezó el 4 a la noche). No publicada.**
- No se integró #146, no se desplegó nada y no se creó ninguna release.
- La estable sigue siendo la 0.13.2: `releases/latest` redirige a `be-apk-0.13.2`.
- Falta la prueba de Dirección en el teléfono.

| Dato | Valor |
|---|---|
| Archivo | `be-0.14.0-candidata.1-0a28dd6.apk` |
| SHA-256 | `57c23b27d41f17e3a304d807e0fd1e9c9b3ecb0db4de28d6373444ec6519e8fc` |
| Tamaño | 78.406.938 bytes |
| Versión | `0.14.0-candidata.1`, versionCode 23 |
| Commit construido | `0a28dd66e5ed5fd69b20afdd6a1aa5cba1af4faf`, en la rama `apk/candidata-0.14.0-1`. Es la candidata de #146 (`2e53ac8`) más la versión, y solo cambia `apps/mobile/app.config.ts`. Viaja incluido en la app |
| Entrega | Por cable, desde una copia permanente en la carpeta Descargas del equipo de construcción, junto a un archivo con estos datos y la verificación. El SHA-256 de la copia coincide con el de la salida de Gradle. El canal de archivos de la sesión admite hasta 30 MiB y el APK pesa 74,8 MiB. Sin release |

## Antes de construir

| Control | Resultado |
|---|---|
| Head de #146 | `2e53ac8d5fd296bd93eaaa3f8bacc207d32b4d5c`, en borrador y sin conflictos con `main` |
| CI de `2e53ac8` | Los cuatro controles en verde: verificar (typecheck, pruebas, build y auditoría), integración con PostgreSQL 16, imagen de la API con migración y readiness, y legajo |
| API desplegada | `be-api-hndp` sirve `2f0c140` según `/health/ready`, y sus respuestas traen la cabecera `Date` |
| Compatibilidad con la API | `apps/api` no cambia entre `2f0c140` y `2e53ac8`. El único cambio de contrato del cliente es `limit` en `GET /me/nutrition/executions`, y la API ya lo lee (API-NUT-16-LISTA). La app no llama rutas nuevas: el único `fetch` nuevo envuelve el existente para leer `Date` |
| Sesión guardada | `almacen-seguro.ts` y `sesion-persistente.ts` no cambian desde la 0.13.2. Siguen la misma clave, `be.sesion`, y el mismo `expo-secure-store` 57.0.4. La app no tiene dependencias nuevas |

## Construcción

- **Procedimiento.** El de la 0.13.2: el worktree `C:\b11`, aislado y limpio en el commit exacto, y un solo worker de Gradle. La firma es la existente, leída del respaldo protegido que está fuera del repositorio. Las exclusiones de credenciales se verificaron con `git check-ignore` antes de instalar.
- **Primer intento (22:30).** Claude Code cortó la tarea de fondo por falta de memoria mientras corría `npm ci`. Un minuto después, el `preinstall` de Prisma no pudo abrir su proceso (código 0xC0000142) y la instalación se detuvo. No se llegó a compilar.
- **Reintento (23:43).** Los mismos comandos, en tres etapas:
  - dependencias y proyecto nativo en primer plano: `npm ci` en 2 min, con 1045 paquetes como en la 0.13.2, y el prebuild en 1 min;
  - Gradle en segundo plano.
- **Gradle cortado y terminado solo.** Claude Code también cortó la tarea de Gradle por falta de memoria. Gradle siguió solo: el log siguió sumando tareas, y no se relanzó ni se duplicó nada.
- **Resultado:** `BUILD SUCCESSFUL in 1h 9m 17s`, con 393 tareas ejecutadas. Tardó el doble que la 0.13.2 porque el equipo tenía entre 0,3 y 0,5 GB libres y paginaba. El APK se escribió el 2026-10-05 a las 00:50, hora local. Al terminar no quedó ningún proceso de Gradle, y el worktree siguió en `0a28dd6` sin archivos versionados modificados.

## Verificación del artefacto

La salida completa está en `verificacion-del-artefacto.txt`. Se comparó con la APK estable `be-0.13.2-4b49d43.apk`.

| Control | Resultado |
|---|---|
| Que sea la candidata | El `prebuild` borró la salida anterior. El APK nuevo pesa 78.406.938 bytes (la 0.13.2 pesaba 78.331.378) y declara versionCode 23 |
| `applicationId` | `com.elianbufi.be`, según `aapt2 dump badging` |
| Versión | `versionName` 0.14.0-candidata.1 · `versionCode` 23 · `minSdk` 24 · `targetSdk` 36. Los SDK son iguales a los de la 0.13.2 |
| Firma | `apksigner verify`: válida, un firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.13.2** |
| Actualización sobre la 0.13.2 | Se puede: el paquete y el certificado son los mismos, y el versionCode es mayor (23 contra 22) |
| Valores incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `0a28dd66e5ed5fd69b20afdd6a1aa5cba1af4faf` · `construidoEn` `2026-10-05T02:55:13.399Z` · plugin `expo-secure-store` |
| SecureStore nativo | 13 referencias a `expo/modules/securestore` en el código, como en la 0.13.2 |
| Exclusión del respaldo | El manifiesto declara `fullBackupContent` y `dataExtractionRules`. Las reglas excluyen el archivo `SecureStore` de las preferencias compartidas en el respaldo completo, en el de la nube y en la transferencia entre dispositivos, y son idénticas a las de la 0.13.2 |
| Permisos | Los mismos 8 de la 0.13.2 |
| Arquitecturas | `arm64-v8a`, `armeabi-v7a`, `x86` y `x86_64` |
| Figura | Las clases de `react-native-svg` y las imágenes `assets_figura_hombreentero` y `assets_figura_mujerentero` |
| Credenciales privadas | Ninguna en las 1162 entradas |

La conservación efectiva de la sesión al actualizar se prueba en el teléfono, en el paso 1 del recorrido.

## Cómo actualizar sobre la 0.13.2, sin desinstalar

1. Con la 0.13.2 instalada y la sesión abierta, abrí el archivo en el teléfono y tocá «Actualizar». Android puede pedir permiso para instalar apps desde esa fuente.
2. **No desinstales la 0.13.2.** Desinstalar borra la sesión guardada, y además no se probaría la actualización.
3. Android la acepta como actualización por tres razones: el paquete es el mismo (`com.elianbufi.be`), el certificado es el mismo y el versionCode es mayor, 23 contra 22.
4. Volver a la 0.13.2 no se puede sin desinstalar, porque Android no instala un versionCode menor.

## Recorrido de prueba

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

1. **Actualización sobre la 0.13.2 y sesión.**
   - Instalá encima de la 0.13.2, con la sesión abierta, y abrí la app.
   - **Esperado:** «Verificando tu sesión guardada…» y después Inicio, sin pedir la contraseña.
   - La versión se ve en Ajustes → Apps → BE: `0.14.0-candidata.1`. La bienvenida no aparece, porque la sesión sigue.
2. **Inicio → acción → Atrás.**
   - Desde una tarjeta de Inicio, tocá una acción: «Ver la toma», «Ver su evolución» o la de Nutrición.
   - **Esperado:** se abre el destino con «Volver». Atrás, con el gesto o el botón, vuelve a Inicio a la misma altura.
3. **Cambios sin guardar.**
   - En Nutrición, empezá a registrar una comida y tocá otro destino de la barra, o Atrás.
   - **Esperado:** «¿Salir sin guardar?». «Seguir» conserva lo escrito y «Salir» lo descarta. Tocar Nutrición estando en Nutrición no pregunta.
4. **Toma y sitio en el mapa.**
   - En Mi evolución → Mapa corporal, elegí T1, T2 y T3 en los chips, y tocá un sitio en la figura y después una fila.
   - **Esperado:** cambian los valores y el punto resaltado de cada minigráfico. Se resaltan la fila, la guía y el sitio, y el detalle aparece debajo.
5. **Evolución con la medida elegida.**
   - En el detalle, tocá «Ver su evolución».
   - **Esperado:** se abre la pestaña Evolución con la misma medida, su grupo comparable y días que incluyen esa toma.
6. **Indicadores.**
   - **Esperado:** con la letra de siempre, van en dos columnas.
   - Tocá una tarjeta. **Esperado:** se abre a todo el ancho con el valor anterior, el método, el gráfico, la lista y «Ver su evolución».
7. **Letra.**
   - Primero con la letra de siempre: Inicio, la barra en una fila, el mapa con el cuerpo grande y los valores en columna, e indicadores.
   - Después, la letra intermedia y la máxima del sistema.
   - **Esperado:** con la máxima, la figura va con números y los valores van en la lista con sus puntos. Las pestañas y la barra pasan a dos filas, y no se corta ningún texto.
8. **El final sobre la barra.**
   - Bajá hasta el final de Inicio y de Mi evolución, con la barra en una fila y en dos.
   - **Esperado:** el último contenido queda libre sobre la cápsula.
9. **Sin conexión.**
   - Con la app abierta, activá el modo avión y tocá una acción. **Esperado:** el aviso sin conexión.
   - Cerrá la app y abrila en modo avión. **Esperado:** «No pudimos verificar tu sesión», con «Reintentar».
   - Sacá el modo avión y tocá «Reintentar». **Esperado:** entra sin pedir la contraseña.

Dirección evalúa en Android las guías inferiores, la legibilidad de los minigráficos y la barra en dos filas.

## Límites conocidos

- **Sin probar en el teléfono.** La conservación de la sesión al actualizar se prueba en el paso 1.
- **Lo visual solo se vio en el navegador:**
  - la sombra del vidrio (`elevation`);
  - el brillo en `react-native-svg`;
  - las fuentes de fabricante.
- **El versionCode 23 queda usado.** La próxima versión estable debe usar 24 o más para instalarse encima de la candidata.
- **La base de `test` vence alrededor del 18/10.**
- **TalkBack no se realiza,** por decisión de Dirección.
