# Publicación · APK 0.13.1 (pulido de UX/UI: «Mi evolución» y los puntos de la figura en su lugar anatómico)

**Estado: PUBLICADA el 2026-10-02. Falta la validación de Dirección en el teléfono.**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.13.1, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.13.1/be-0.13.1-6213ec8.apk`
- **SHA-256:** `177834d21fca796acbe24409210eb62d8f3c8847535e81ef7e3a5b0a63229802` · **tamaño:** 78.104.642 bytes
- **Versión:** 0.13.1 · versionCode 21
- **Commit construido:** `6213ec8ae73c9edd13dcd36d6c5f7d7ab920e822`, el merge de #131 en `main`. La CI de `main` pasó los cuatro checks, y el commit viaja incluido en la app.

## Qué incluye

| Cambio | Decisión | En `main` |
|---|---|---|
| APK, «Mi evolución»: cada fecha se dice una vez. La de la toma va en el título; una línea dice con qué toma se compara y cuántas medidas y resultados hay; el período va en la evolución por medida; la fecha en cada fila aparece solo si es otra | Pedido de Dirección del 2026-10-02; DL-113, pulido | #131 |
| APK, figura de Pliegues: el bíceps a la altura del tríceps y la cresta ilíaca a la del supraespinal | Regla de Dirección del 2026-10-02: los puntos anatómicos no se mueven para resolver cruces | #131 |
| APK, figura: las tarjetas se apilan por la altura de sus sitios y los puntos se dibujan encima de las guías. Con todos los pliegues, en el hombre, los cruces bajaron de 4 o 5 a 0 o 1 | DL-113 | #131 |
| Website: la toma por fecha de ocurrencia, los cálculos antes que las mediciones, la preparación con las acciones fijas, el encabezado compacto y las pestañas en una línea. Viaja en el despliegue, no en la APK | DL-113, pulido | #131 |

**Compatibilidad.** La forma de las respuestas que lee la APK no cambió. La 0.13.0 sigue funcionando contra la API nueva, pero sin el orden nuevo de «Mi evolución» ni los puntos en su lugar, que viajan solo en la 0.13.1.

## Qué está desplegado (cada cosa por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `6213ec8` (merge de #131) | `/health/ready` informa el commit `6213ec8ae73c9edd13dcd36d6c5f7d7ab920e822`, construido a las 20:41 UTC, con la base de datos y las migraciones OK |
| **Website** (`be-web-1ngj`) | el mismo despliegue | Responde 200 en `/`, `/login/` y `/pro/advisees/anthropometry/`. Su CSS trae las clases nuevas, como `tomas__toma`, `medicion__fila`, `acciones--fijas`, `estado-vacio` y `desplazable-x` |
| **APK** | `6213ec8ae73c9edd13dcd36d6c5f7d7ab920e822` (#131) | El commit está incluido en `assets/app.config` |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md)), con **un solo worker de Gradle**.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 29m 29s`, en el primer intento.
  - A mitad del build, Claude Code cortó la tarea de fondo que lo había lanzado: la máquina se había quedado sin memoria.
  - Gradle siguió solo y el script terminó («fin OK»). No se relanzó nada.
  - `firmar.cjs` no escribe copias de la clave: le pasa a Gradle la ruta y las contraseñas por el entorno. Por eso el corte no dejó nada que limpiar.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio. No se generó ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.13.1 · `versionCode` 21 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.13.0**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `6213ec8ae73c9edd13dcd36d6c5f7d7ab920e822` · `construidoEn` `2026-10-02T20:41:09.409Z` |
| Código nuevo incluido | El bundle trae el orden por centro de la figura (`CENTRO`) y la barra inferior (`tablist`). El copy acentuado no se puede buscar, porque Hermes lo guarda en UTF-16 |
| react-native-svg | Sus clases nativas (`com/horcrux/svg`) están en el código del paquete |
| Imágenes de la figura | La tabla de recursos tiene `drawable/assets_figura_hombreentero` y `drawable/assets_figura_mujerentero` (`aapt2 dump resources`) |
| Credenciales privadas | Ninguna en las 1149 entradas, descomprimidas. No hay contraseñas ni alias, ni en ASCII ni en UTF-16LE. Tampoco aparece `PRIVATE KEY` ni el inicio de la keystore, ni hay archivos `credentials.json`, `.jks`, `.keystore` o `.env` |
| Archivo publicado | Se descargó de la release y se recalculó: el SHA-256 y el tamaño coinciden con los del archivo construido. `releases/latest` redirige a `be-apk-0.13.1` (`EVIDENCIA/ENTREGA/verificacion-urls-2026-10-02.txt`) |

## Recorrido de validación en el teléfono

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

1. **Instalar encima de la 0.13.0**, sin desinstalar.
   - **Esperado:** se instala como actualización y al pie dice «app 0.13.1 · test · commit 6213ec8».
2. **«Mi evolución»** (zona Evolución), con DEMO-A01.
   - **Esperado:** el título de la última toma dice su fecha.
   - **Esperado:** debajo hay una sola línea con la toma con que se compara y las cantidades.
   - **Esperado:** en las filas la fecha de la toma anterior no se repite, salvo que sea otra.
3. **La figura de Pliegues**, con una toma que tenga el perfil completo.
   - **Esperado:** el bíceps y el tríceps están en el mismo lugar del brazo. El tríceps lleva la marca de «posterior» en su tarjeta.
   - **Esperado:** la cresta ilíaca y el supraespinal están juntos en el borde del tronco.
   - **Esperado:** se entiende qué guía va a qué tarjeta. Si algún punto no está donde corresponde, decí dónde debería ir.
4. **Con la letra del sistema al máximo:** la primera pantalla de «Mi evolución» sigue legible.
5. **Si se puede:** TalkBack, la barra en un teléfono de 320 a 360 dp y el área segura con navegación por gestos y con tres botones.

**En el website, como DEMO-PA:**
1. Abrí la antropometría de «Asesorado · c36743» y elegí una toma.
   - **Esperado:** las tomas se nombran por su fecha y los cálculos están antes que las mediciones.
2. En «En preparación», bajá hasta la mitad del formulario.
   - **Esperado:** «Guardar» y el estado del guardado siguen fijos abajo, también con el teclado abierto.

**Qué cierra esta tanda:** con estos pasos se valida en el teléfono «Mi evolución» y la figura. «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.

**Lo que esta APK no trae:** la corrección de DL-115, el A3 del titular en antropometría y formularios. Está abierta para decisión de Dirección. Con la opción A, haría falta otra APK.
