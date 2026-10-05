# APK candidata 0.14.0-candidata.2 · «Mi evolución» en tres vistas (DL-118), con el ajuste del 2026-10-05

**Estado: construida y publicada como prerelease el 2026-10-05, para validar en el teléfono.**
- **DL-118 todavía no se validó en Android.** Hasta ahora, «Mi evolución» en tres vistas y el ajuste del 2026-10-05 solo
  se revisaron en renders del navegador (`EVIDENCIA/MI-EVOLUCION-TRES-VISTAS`, en la rama `apk/navegacion`).
- No se integró #146, que sigue en borrador, y no se desplegó nada.
- La estable sigue siendo la 0.13.2: `releases/latest` apunta a `be-apk-0.13.2`.
- Falta la prueba de Dirección en el teléfono.

| Dato | Valor |
|---|---|
| Archivo | `be-0.14.0-candidata.2-b4eb286.apk` |
| SHA-256 | `e33e6ac2bc548650f15d4e1b3a5ea691a1b27095bd6c411d02a196b9137a1b24` |
| Tamaño | 80.848.758 bytes. Son 2,4 MB más que la candidata 1: las cuatro figuras de los trenes que usa Progreso |
| Versión | `0.14.0-candidata.2`, versionCode 24 |
| Commit construido | `b4eb286fdc16f8bd4fa732de997fbaf785f9382c`, en la rama `apk/candidata-0.14.0-2`. Es el head de #146 (`9021c47c1b9a2fe6f28774245e4e95db97e55588`) más la versión, y solo cambia `apps/mobile/app.config.ts`. Viaja incluido en la app |
| Entrega | La prerelease [`be-apk-0.14.0-candidata.2`](https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.14.0-candidata.2), con el APK y su `.sha256`. Hay además una copia permanente en la carpeta Descargas del equipo de construcción, con una ficha de datos y de verificación |

## Publicación

Se publicó el 2026-10-05, con la autorización de Dirección, como **prerelease**. Se subió el mismo archivo verificado, sin
recompilar.

| Control | Resultado |
|---|---|
| Antes del tag | `apk.yml` escucha solo tags `apk-v*`, y `ci.yml`, los push a `main` y `wp-*` y los PR a `main`. Render despliega con los push a `main`. Un tag `be-apk-*` no dispara ninguno |
| Release | `be-apk-0.14.0-candidata.2`, creada con `--prerelease --latest=false`: es prerelease y no borrador |
| Tag | `be-apk-0.14.0-candidata.2` apunta al commit completo `b4eb286fdc16f8bd4fa732de997fbaf785f9382c`. Es liviano, como el de la candidata 1. Después de crearlo no corrió ningún workflow |
| Adjuntos | `be-0.14.0-candidata.2-b4eb286.apk`, de 80.848.758 bytes, y `be-0.14.0-candidata.2-b4eb286.apk.sha256` |
| Descarga | Los dos adjuntos se bajaron de los enlaces públicos, sin autenticación, con HTTP 200. El SHA-256 es `e33e6ac2…1b24` y la comprobación con el `.sha256` publicado da OK. El APK es idéntico byte a byte al verificado |
| La estable | `releases/latest` sigue apuntando a `be-apk-0.13.2` |
| #146 | Sigue en borrador, en `9021c47`, sin merge ni despliegue |

- **Descarga directa:** https://github.com/Elian-Bufi/be/releases/download/be-apk-0.14.0-candidata.2/be-0.14.0-candidata.2-b4eb286.apk
- **Prerelease:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.14.0-candidata.2

## Antes de construir

| Control | Resultado |
|---|---|
| Base | `9021c47c1b9a2fe6f28774245e4e95db97e55588`, el head de #146, en borrador |
| CI de `9021c47` | Los cuatro controles en verde: verificar (typecheck, pruebas, build y auditoría), integración con PostgreSQL 16, imagen de la API con migración y readiness, y legajo |
| Compatibilidad con la API | La API desplegada sirve `2f0c140`. Entre ese commit y `9021c47` no cambian `apps/api`, `prisma`, `render.yaml` ni los contratos del dominio. Desde la candidata 1, el único cambio del dominio es un texto (`copy-antropometria.ts`) |
| Versión | El versionCode 24 es el siguiente libre: la 0.13.2 usa el 22 y la candidata 1, el 23. El tag y la release no existían |
| Cambios de versión | Solo `apps/mobile/app.config.ts`: `0.14.0-candidata.2` y versionCode 24. No se agregó ningún ajuste funcional ni visual |

## Construcción

- **Procedimiento.** El de la candidata 1, en tres etapas, en un árbol de trabajo aislado y limpio en el commit exacto,
  con un solo worker de Gradle. La firma es la existente, leída del respaldo protegido que está fuera del repositorio.
  Antes de instalar se verificó con `git check-ignore` que las credenciales quedan excluidas.
- **Etapa 1, dependencias.** `npm ci`, en primer plano: 1045 paquetes, como en la candidata 1, en 12 min. El equipo
  tenía unos 0,7 GB libres.
- **Etapa 2, proyecto nativo.** El dominio y el `prebuild`, en 2 min. El proyecto generado declara versionCode 24 y
  versionName 0.14.0-candidata.2, con las cuatro arquitecturas.
- **Etapa 3, Gradle, en segundo plano.** Claude Code cortó la tarea de fondo por falta de memoria a los pocos minutos.
  Gradle siguió solo: el log siguió sumando tareas, y no se relanzó ni se duplicó nada.
- **Resultado:** `BUILD SUCCESSFUL in 41m 57s`, con 393 tareas ejecutadas.
  - El APK se escribió el 2026-10-05 a las 14:19, hora local.
  - Al terminar no quedó ningún proceso de Gradle.
  - El árbol siguió en `b4eb286`, sin archivos versionados modificados.

## Verificación del artefacto

La salida completa está en `verificacion-del-artefacto.txt`. Se comparó con la candidata 1,
`be-0.14.0-candidata.1-0a28dd6.apk`, y con la estable, `be-0.13.2-4b49d43.apk`.

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be`, según `aapt2 dump badging` |
| Versión | `versionName` 0.14.0-candidata.2 · `versionCode` 24 · `minSdk` 24 · `targetSdk` 36. Los SDK son los mismos de las dos anteriores |
| Firma | `apksigner verify`: válida, un firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la candidata 1 y al de la 0.13.2** |
| Actualización | Se puede sobre la candidata 1 y sobre la 0.13.2: el paquete y el certificado son los mismos, y el versionCode es mayor (24 contra 23 y 22) |
| Valores incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `b4eb286fdc16f8bd4fa732de997fbaf785f9382c` · `construidoEn` `2026-10-05T16:48:34.867Z` · plugin `expo-secure-store` |
| SecureStore nativo | 13 referencias a `expo/modules/securestore` en el código, como en las dos anteriores |
| Exclusión del respaldo | El manifiesto declara `fullBackupContent` y `dataExtractionRules`. Las reglas excluyen el archivo `SecureStore` de las preferencias compartidas en el respaldo completo, en el de la nube y en la transferencia entre dispositivos. Son idénticas a las de la candidata 1 y a las de la 0.13.2 |
| Permisos | Los mismos 8 de la candidata 1 y de la 0.13.2 |
| Arquitecturas | `arm64-v8a`, `armeabi-v7a`, `x86` y `x86_64` |
| Figuras | `react-native-svg`, las dos figuras enteras y las cuatro de los trenes: hombre y mujer, superior e inferior |
| Credenciales privadas | Ninguna en las 1166 entradas |

La conservación efectiva de la sesión al actualizar se prueba en el teléfono, en el paso 1 del recorrido.

## Cómo actualizar, sin desinstalar

1. Con la candidata 1 o la 0.13.2 instalada y la sesión abierta, abrí el APK en el teléfono y tocá «Actualizar».
   Android puede pedir permiso para instalar apps desde esa fuente.
2. **No desinstales la versión anterior.** Desinstalar borra la sesión guardada, y además no se probaría la actualización.
3. Android la acepta como actualización porque el paquete (`com.elianbufi.be`) y el certificado son los mismos y el
   versionCode es mayor.
4. Volver a una versión anterior no se puede sin desinstalar, porque Android no instala un versionCode menor.

## Recorrido de prueba

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos,
así que la primera pantalla puede tardar unos 25 segundos.

1. **Actualización y sesión.** Instalá encima de la candidata 1, con la sesión abierta, y abrí la app.
   - **Esperado:** entra sin pedir la contraseña.
   - En Ajustes → Apps → BE, la versión es `0.14.0-candidata.2`.
2. **Las tres vistas.** Abrí Mi evolución.
   - **Esperado:** pestañas Mapa corporal, Progreso e Indicadores.
   - Debajo, la fecha y «Última toma», sin «se compara con».
3. **Mapa corporal.**
   - **Esperado:** el nombre y el valor de cada sitio.
   - Tocá un sitio: aparecen el cambio con su fecha y «Ver su progreso».
   - Tocalo: se abre Progreso con ese sitio resaltado.
4. **Progreso.**
   - **Esperado:** la figura de la zona es una franja compacta, y la primera tarjeta queda cerca.
   - Pasá de Perímetros a Pliegues, de Torso a Piernas y de un panel del torso al otro: el cuerpo no se mueve.
   - En cada tarjeta: el valor grande, la flecha con su fecha, T1, T2… debajo de los puntos y los valores en fila.
   - La línea une solo tomas seguidas, y se corta si una toma no midió ese sitio.
   - Tocá una tarjeta: el gráfico grande con fechas, «Anterior», «Siguiente» y «La evolución, en lista».
5. **Indicadores.**
   - **Esperado:** mediciones, resultados como estimación, la edad como dato de la toma y los diámetros plegados.
   - En las tarjetas angostas, el cambio va debajo del valor.
6. **Otra toma.** Elegí la T1 en los chips.
   - **Esperado:** las tres vistas muestran esa toma.
   - Si a una vista le faltan datos de esa toma, lo dice con las dos fechas.
7. **Letra máxima.**
   - **Esperado:** todo apilado y ningún texto cortado.
   - La barra pasa a dos filas.
8. **El final sobre la barra.** Bajá hasta el final de cada vista.
   - **Esperado:** el último contenido queda entero sobre la cápsula, con el velo detrás.

## Límites conocidos

- **DL-118 sin validar en Android.** Solo se vieron en el navegador:
  - la línea entre tomas;
  - las flechas;
  - la franja de la figura;
  - el velo de la barra;
  - la sombra del vidrio.
- **D-3, una toma que puede estar incompleta.** Si dos evaluaciones caen el mismo día, la API muestra una medición por
  día y por medida, y de la otra evaluación se ve solo una parte. La pantalla lo avisa con «Esta toma puede estar
  incompleta». Resolverlo del todo exige ampliar el contrato de la API.
- **La línea depende de las tomas.** Una toma que no midió un sitio corta su línea: la visualización conserva el hueco
  (B10-07).
- **Progreso al abrir.** En un teléfono de 360 × 800 dp, la primera tarjeta queda justo debajo del borde.
- **El versionCode 24 queda usado.** La próxima versión estable debe usar 25 o más para instalarse encima de la
  candidata.
- **La base de `test`** vence alrededor del 16 al 18/10, antes de la entrega del 20/10.
- **TalkBack no se realiza,** por decisión de Dirección.
