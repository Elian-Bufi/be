# Publicación · APK 0.13.2 (candidata 0.13.2: sesión guardada, «Mi evolución» por tareas y objetivos de 48 dp)

**Estado: PUBLICADA el 2026-10-03, con la aprobación de Dirección. Falta la prueba de Dirección en el teléfono.** La
publicación no implica aprobación visual, validación anatómica ni comprobación de la persistencia nativa. El P2028
conserva su estado de mejora parcial.

- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.13.2, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.13.2/be-0.13.2-4b49d43.apk`
- **SHA-256:** `a0b5bc461b48ca734ff2dfaffeb684b182d184b9ecb6eb579c1b9ad50a735037` · **tamaño:** 78.331.378 bytes
- **Versión:** 0.13.2 · versionCode 22
- **Commit construido:** `4b49d43f1a0e97488ae26d130022a572dadeddfd`, el merge de #141 en `main`. Es la candidata integrada
  más el número de versión, y viaja incluido en la app.

## Integración

| Paso | Resultado |
|---|---|
| Candidata aprobada | `5e54ecf`, sin cambios desde la aprobación. Los cuatro checks estaban aprobados y `main` seguía en `0909fa9` |
| Merge de #140 | `2f0c14056079bb29633a1bb9c824b40fb3b58605`, con commit de merge y sin squash |
| Equivalencia, antes del cambio de versión | El árbol de `main` en `2f0c140` es `adf66f9313df4b000bf8a7616d975c746cf09302`, el de la candidata aprobada. Los siete heads (`d06f0a3`, `25a34fa`, `f66bbe7`, `63a9e90`, `96e83bb`, `a7da3c7`, `7302888`) son ancestros de `main`, y GitHub marcó #133 a #140 como integrados |
| CI de `main` en `2f0c140` | Los cuatro checks en verde: integración 568 de 568 en 40 suites, dominio 446, scripts 125, API 56, auditoría con las dos excepciones ratificadas, imagen de la API con migración y readiness, y legajo |
| Cambio de versión (#141) | `4b49d43`. Solo cambia `apps/mobile/app.config.ts` (0.13.2, versionCode 22). La CI de `main` quedó en verde. Según los `buildFilter` de `render.yaml`, no redespliega: la API y el website siguieron en `2f0c140`, con la misma marca de construcción |

## Qué está desplegado (cada pieza por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `2f0c140` | `/health/ready`: estado OK, commit `2f0c14056079bb29633a1bb9c824b40fb3b58605`, construida a las 14:51:02 UTC, con la base de datos y las **migraciones OK** (incluida la función `be_bloquear_lo_que_corta` de #134). `/health/live` 200 |
| **Website** (`be-web-1ngj`) | `2f0c140` | El pie dice «web 0.11.1 · commit 2f0c140 · build 2026-10-03T14:51:18.893Z». Responden 200 `/`, `/login/` y `/pro/advisees/anthropometry/`, con HSTS y CSP. El JS de `/login` apunta a la API, y `/api/*` del website no llega a ella. CORS se permite solo desde el website. El CSS trae lo nuevo de #139: `lamina__visor`, las cinco grillas `minmax(min(…))` y la consulta de contenedor |
| **APK** | `4b49d43` | El commit está incluido en `assets/app.config` |

**Comprobación funcional mínima**, autorizada por Dirección. Se hizo con las cuentas demo, solo con lecturas: una sesión
por cuenta, que se cerró al terminar. No se modificaron datos ni se ejecutó carga.

| Paso | Respuesta |
|---|---|
| DEMO-A01, iniciar sesión (APK) | 201 |
| DEMO-A01, `/me` (API-ACC-05, la verificación de la sesión guardada) | 200, con 12 h de vigencia restante |
| DEMO-A01, «Hoy» de nutrición (API-NUT-14, con A3) | 200 |
| DEMO-A01, «Mi evolución» (API-ANT-06-PROPIA, con A3) | 200, con 59 medidas |
| DEMO-A01, cerrar la sesión | 204 |
| DEMO-PA, iniciar sesión (website) | 201 |
| DEMO-PA, tomas de DEMO-A01 (API-ANT-03) | 200, con 3 tomas |
| DEMO-PA, cerrar la sesión | 204 |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente
  ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md)), con **un solo worker de Gradle**.
- **Copia aislada y árbol limpio.** El worktree está fuera del repositorio, en el commit exacto. Las exclusiones de
  credenciales se verificaron con `git check-ignore` antes de instalar.
- **Pasos.** `npm ci`, que trae la dependencia nativa nueva `expo-secure-store` 57.0.4 desde el lockfile. Después, el hook
  `eas-build-post-install`, `expo prebuild --clean` con el plugin de `expo-secure-store` y `assembleRelease` firmado.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 34m 45s`, en el primer intento, sin otros procesos pesados en paralelo.
  Al terminar no quedó ningún proceso de Java ni de Gradle.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio. No se generó
  ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.

## Verificación del artefacto

La salida completa está en `verificacion-del-artefacto.txt`.

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.13.2 · `versionCode` 22 · `minSdk` 24 · `targetSdk` 36, iguales a la 0.13.1 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.13.1 y las anteriores** |
| Actualización sobre la 0.13.1 | Se puede: el mismo paquete, el mismo certificado y un versionCode mayor (22 contra 21) |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `4b49d43f1a0e97488ae26d130022a572dadeddfd` · `construidoEn` `2026-10-03T15:12:11.138Z` · plugins: `expo-secure-store` |
| SecureStore nativo | El código del paquete tiene 13 referencias a `expo/modules/securestore`; la 0.13.1 tenía 0 |
| Exclusión del respaldo | El manifiesto declara `fullBackupContent` (`xml/secure_store_backup_rules`) y `dataExtractionRules` (`xml/secure_store_data_extraction_rules`). Las dos reglas excluyen el archivo `SecureStore` de las preferencias compartidas: en el respaldo completo, en el respaldo en la nube y en la transferencia entre dispositivos |
| react-native-svg e imágenes de la figura | Las clases `com/horcrux/svg` están en el código, y la tabla de recursos tiene `drawable/assets_figura_hombreentero` y `drawable/assets_figura_mujerentero` |
| Credenciales privadas | Ninguna en las 1162 entradas, descomprimidas. No hay contraseñas ni alias, ni en ASCII ni en UTF-16LE. No aparece `PRIVATE KEY` ni el inicio de la keystore. No hay archivos `credentials.json`, `.jks`, `.keystore` ni `.env` |
| Archivo publicado | Se descargó de la release (HTTP 200) y se recalculó: el SHA-256 y el tamaño coinciden con los del archivo construido. `releases/latest` redirige a `be-apk-0.13.2`, y el tag apunta a `4b49d43` |

## Auditoría

Dirección ratificó, hasta el 2026-10-31, las excepciones específicas para GHSA-86w9-cpqp-85rv (node-forge) y
GHSA-vfj7-8cjw-p6xm (braces), con el alcance documentado en DL-114. No se ampliaron ni se exceptuaron otros avisos. El
control sigue fallando ante un vencimiento, ante cualquier otro aviso alto o crítico y ante un error de la auditoría.

## Recorrido de validación en el teléfono

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos,
así que la primera pantalla puede tardar unos 25 segundos.

1. **Instalar encima de la 0.13.1**, sin desinstalar. Poné la letra del sistema al máximo y el tema Azul noche.
   - **Esperado:** se instala como actualización, y la bienvenida dice «app 0.13.2 · test · commit 4b49d43».
   - Iniciá sesión con DEMO-A01. En Cuenta → Seguridad: «Tu sesión queda guardada de forma segura en este teléfono…».
2. **Cerrar y reabrir.** Cerrá la app desde Recientes y abrila.
   - **Esperado:** «Verificando tu sesión guardada…», sin datos de ninguna cuenta, y después Nutrición, sin pedir la
     contraseña.
3. **Sin red.** Con el modo avión, cerrá y reabrí.
   - **Esperado:** «No pudimos verificar tu sesión», con «Reintentar» e «Iniciar sesión de nuevo».
   - Sacá el modo avión y tocá «Reintentar»: tiene que entrar.
4. **Cerrar sesión.** Cerrá sesión en Cuenta, cerrá la app y abrila.
   - **Esperado:** la bienvenida, sin datos.
5. **La figura.** En «Mi evolución» → Última toma:
   - tocá un sitio aislado: se elige, con su aro y su detalle;
   - tocá el bíceps y el tríceps: aparece «Ahí quedan juntos…», y se elige uno desde su fila.
6. **El gráfico.** En «Evolución», elegí una medida, probá 30, 60 y 90 días, tocá puntos y usá «Anterior» y «Siguiente».
   - **Esperado:** «La evolución, en lista» coincide con el gráfico.
7. **El A3.** Revocalo en Privacidad.
   - **Esperado:** «Mi evolución», «Información» y «Hoy» muestran el aviso sin datos, y la sesión sigue abierta.
   - Volvé a otorgarlo: todo reaparece.
8. **El tema Claro.** Repetí los pasos 5 y 6.
9. **La letra.** Con la app abierta, cambiá el tamaño de letra del sistema.
   - **Esperado:** la sesión y la pantalla siguen.

TalkBack: no se realiza, por decisión de Dirección.

«Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado. Esta APK está
implementada, con CI verde y publicada. **No está verificada en el teléfono.**
