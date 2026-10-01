# Publicación · APK 0.12.2 (evolución física: figura de la lámina, resultados de las fórmulas)

**Estado: PUBLICADA el 2026-10-01. Falta la validación de Dirección en el teléfono.**
- **Release permanente:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.12.2, marcada Latest. Las anteriores se conservan.
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.12.2/be-0.12.2-0308355.apk`
- **SHA-256:** `c282ffaf9e8e859a48123d4b5773c0daabf88bca8f92f6ae748231576fdce283` · **tamaño:** 71.756.095 bytes
- **Versión:** 0.12.2 · versionCode 19
- **Commit construido:** `0308355187301cff26103dcd2b21d921a902b7cd` (`main`, merge de #126), con la CI de `main` en verde, incluido en la app.

## Qué incluye

| Cambio | Decisión | En `main` |
|---|---|---|
| «Mi evolución» con la última toma sobre la figura de la lámina, los resultados de las fórmulas con su método y la evolución por medida con nombres; mira hasta un año atrás si los últimos 90 días no tienen tomas | Dirección, 2026-09-30 (noche); DL-111, a ratificar | #126 (`0308355`) |
| Catálogo antropométrico de BE: protocolo «Perfil antropométrico completo» y 40 métodos con fuente; la evolución suma los resultados de las fórmulas | DL-111 | #126 |
| Lámina del compositor en el website del profesional; ficha del método al elegirlo | DL-111 | #126 |

**Compatibilidad.** La forma de las respuestas que lee la APK no cambió. La 0.12.1 sigue funcionando contra la API nueva: ve los resultados de las fórmulas como puntos «calculados», con el código de la métrica en lugar del nombre.

## Qué está desplegado (cada cosa por separado)

| Pieza | Commit | Cómo se comprobó |
|---|---|---|
| **API** (`be-api-hndp`) | `0308355` (merge de #126) | `/health/ready`: `commit` `0308355187301cff26103dcd2b21d921a902b7cd`, base de datos OK, migraciones OK (incluye las dos del catálogo de BE) |
| **Website** (`be-web-1ngj`) | el mismo despliegue | responde 200 en `/`, `/login/` y `/pro/advisees/anthropometry/`, y sirve las seis figuras de la lámina con el tamaño exacto del compositor (por ejemplo `/figura/hombre-entero.png`, 411.154 bytes) |
| **APK** | `0308355187301cff26103dcd2b21d921a902b7cd` (#126) | Commit incluido en `assets/app.config` |

## Construcción

- **Procedimiento:** el local ya aprobado, con Gradle nativo en Windows y la firma existente ([`build-local-0.11.1.md`](../HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md)), con **un solo worker de Gradle**.
- **Tiempo y resultado:** `BUILD SUCCESSFUL in 19m 43s`, en el primer intento, con 352 tareas de Gradle.
- **Firma:** la keystore existente administrada por EAS, leída del respaldo protegido fuera del repositorio. No se generó ni se reemplazó ninguna clave, y las credenciales no aparecen en pantalla, en logs ni en el repositorio.
- **Sin dependencias nuevas.** La figura usa los componentes de React Native que ya estaban; sus dos imágenes van empaquetadas.

## Verificación del artefacto

| Control | Resultado |
|---|---|
| `applicationId` | `com.elianbufi.be` (`aapt2 dump badging`) |
| Versión | `versionName` 0.12.2 · `versionCode` 19 |
| Firma | `apksigner verify`: válida, 1 firmante, esquema v2 |
| Certificado | SHA-256 `61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06`, **idéntico al de la 0.12.1**: se instala como actualización |
| Arquitecturas | `lib/arm64-v8a`, `lib/armeabi-v7a`, `lib/x86`, `lib/x86_64` |
| Valores efectivos incluidos (`assets/app.config`) | `appEnv` `test` · `apiBaseUrl` `https://be-api-hndp.onrender.com` · `commit` `0308355187301cff26103dcd2b21d921a902b7cd` · `construidoEn` `2026-10-01T05:52:22.426Z` |
| Código nuevo incluido | El bundle contiene `be-figura-de-la-toma` (la elección de figura), `laminaFondo` (los colores de la lámina), «Grasa corporal (Durnin y Womersley, Siri)» y «Suma de 6 pliegues (ISAK)» (los nombres del catálogo) |
| Imágenes de la figura | La tabla de recursos tiene `drawable/assets_figura_hombreentero` y `drawable/assets_figura_mujerentero` (`aapt2 dump resources`); el empaquetado acorta las rutas dentro del archivo |
| Credenciales privadas | Ninguna: las 1144 entradas, descomprimidas, sin contraseñas ni alias (ASCII y UTF-16LE), sin `PRIVATE KEY` ni el inicio de la keystore, y sin archivos `credentials.json`, `.jks`, `.keystore` ni `.env` |
| Archivo publicado | Se descargó de la release y se volvió a calcular: SHA-256 y tamaño idénticos al construido. `releases/latest` redirige a `be-apk-0.12.2` |

## Recorrido de validación en el teléfono

Iniciá sesión **una sola vez por cuenta**: el límite es de 5 intentos cada 15 minutos. La API se duerme a los 15 minutos, así que la primera pantalla puede tardar unos 25 segundos.

1. **Instalar encima de la 0.12.1**, sin desinstalar.
   - **Esperado:** se instala como actualización y al pie dice «app 0.12.2 · test · commit 0308355».
2. **Cargar una toma en el website, como profesional.** Elegí un asesorado vinculado en Antropometría, entrá a **Preparación** y cargá una toma con el protocolo **«Perfil antropométrico completo»**. Alcanza con peso, talla, edad, unos perímetros y unos pliegues. Registrala.
3. **Calcular.** En el detalle de la evaluación, «Calcular con un método».
   - **Esperado:** cada método dice qué da, qué pide (con el valor de la toma o por qué falta), la fuente y la población.
   - Calculá dos o tres métodos, por ejemplo el IMC, una suma de pliegues y un porcentaje de grasa.
4. **Ver la lámina.** «Ver lámina»: recorré Circunferencias, Pliegues, Conclusiones y Serie, cambiá el tema y descargá la imagen.
5. **En el teléfono, con la cuenta del asesorado:** abrí **«Mi evolución»**.
   - **Esperado:** «Tu última toma» con la fecha, la figura con los perímetros medidos y, al cambiar a «Pliegues», los pliegues.
   - **Esperado:** cada tarjeta muestra el valor y, si hay una toma anterior comparable, la diferencia con signo.
   - **Esperado:** «Mujer» cambia la figura, y la elección se recuerda al volver.
   - **Esperado:** «Resultados de las fórmulas» lista lo calculado en el paso 3, cada uno con su método.
   - **Esperado:** «Evolución por medida» muestra cada medida con su nombre, y al tocarla se abre su serie.
6. **Una segunda toma** con valores algo distintos, unos días después, y volver a calcular.
   - **Esperado:** en la APK aparecen las diferencias y la fecha de la toma anterior.

**Qué cierra esta tanda.** Con los pasos 1 a 6, la figura y los resultados en el teléfono. «Implementado», «CI verde», «publicado» y «verificado en el teléfono» se informan por separado.

## Límites

- **APK sin teléfono.** La figura se revisó con una maqueta HTML de las mismas cuentas (`EVIDENCIA/ANTROPOMETRIA-DL111/`), no en un dispositivo.
- **TalkBack y teclado:** no se verificaron. La figura está oculta para el lector de pantalla: los mismos datos, completos, están en la lista.
- **Validación profesional:** los coeficientes, sitios y poblaciones de las fórmulas no los revisó todavía un profesional de Dirección (DL-111, a ratificar).
- **Datos:** solo sintéticos, sin credenciales.
