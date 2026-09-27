# Evidencia · publicación de «Tu historial de entrenamiento» (DL-096, 0.11.0)

Estado de la publicación del 2026-09-26. El incremento (API-TRN-19-LISTA + pantalla «Tu historial») se integró en el PR #86 (merge `696717e`) y se versionó a 0.11.0 en el PR #87 (merge `eb31269`).

## Lo publicado

| Componente | Versión · commit | Comprobación |
|---|---|---|
| API | 0.11.0 · `eb31269` | `readiness-0.11.0.json`: readiness OK, base y migraciones OK. `endpoint-desplegado.txt`: `GET /me/training/executions` responde 401 (existe, exige sesión) |
| Website | 0.11.0 · `eb31269` | HTTP 200; redesplegado por el mismo `checksPass` que la API, desde el mismo commit |
| APK | 0.11.0 · versionCode 13 · `eb31269` | release permanente `be-apk-0.11.0`; SHA-256 del archivo publicado = SHA-256 del artefacto construido (abajo); firma histórica y `applicationId` intactos |

## APK

- **Release:** https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.11.0
- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.0/be-0.11.0-eb31269.apk`
- **Build EAS:** `df0feac6-8104-4255-9a4b-ff3cefc1873a`, perfil `test`
- **SHA-256:** `bf2ecffc9e797bcea7aedd1c9790ae08a625fc060b30c37799944d8f959c2686` (verificado: descargado del release y re-hasheado, idéntico al construido)
- **Tamaño:** 69.723.530 bytes
- Firma: misma clave que todas las anteriores (`61569691…3e06`), `applicationId` `com.elianbufi.be`: se instala como actualización sobre la 0.10.0.

## Ascendencia

`eb31269` (API/web/APK desplegadas) desciende de `696717e` (merge del PR #86, que trae la implementación). Verificado con `git merge-base --is-ancestor`.

## Qué NO está comprobado

La **pantalla «Tu historial» en un dispositivo** no está observada: la comprobación visual la hace Dirección con esta APK 0.11.0. Lo verificado hasta acá es API/contrato/integración (CI con PostgreSQL 16) y la identidad del artefacto. **DL-096 sigue EN CURSO** hasta esa evidencia en el teléfono.

## Publicación 0.11.1 — correcciones de la validación en teléfono

Estado del 2026-09-26. Las correcciones de los hallazgos de Dirección sobre la 0.11.0 (`hallazgos-validacion-telefono.md`) se integraron en el PR #89 (merge `23786dd`) y se versionaron a 0.11.1 en el PR #90 (merge `44bea3a`, versionCode 14). `44bea3a` desciende de `23786dd` (verificado con `git merge-base --is-ancestor`).

| Componente | Versión · commit | Estado |
|---|---|---|
| API | 0.11.1 · `44bea3a` | `readiness-0.11.1.json`: readiness OK, base y migraciones OK, commit `44bea3a` |
| Website | 0.11.1 · `44bea3a` | HTTP 200; redesplegado por el mismo `checksPass` |
| APK | 0.11.1 · versionCode 14 · `44bea3a` | release permanente `be-apk-0.11.1`, **construida localmente con Gradle** (EAS rechazó el build por la cuota mensual del plan gratuito), con la firma existente. Procedencia y verificaciones: `build-local-0.11.1.md` |

- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.1/be-0.11.1-44bea3a.apk`
- **SHA-256:** `f09cfb1b7113ea2cd56965a9aa4014beae00e4dbfb7302f31012bd5aa7b3d3cb` (descargado del release y re-hasheado: idéntico al construido)
- **Firma:** certificado `61569691…893e06`, igual al de la 0.11.0: se instala encima como actualización.
- Sin ID de build de EAS: no lo tiene.

**Pendiente en dispositivo:** todo lo que enumera `hallazgos-validacion-telefono.md`. **DL-096 sigue EN CURSO.**

## Publicación 0.11.2 — período del historial en Buenos Aires

Estado del 2026-09-26. La validación de la 0.11.1 encontró que «Sesiones registradas» no cargaba de 21 a 24 h en Buenos Aires: la API respondía 400 `PERIOD_IN_FUTURE`. Causa, reproducción y corrección en `hallazgos-validacion-telefono.md` §4 y `periodo-en-futuro-reproduccion.txt`. Se corrigió en el PR #94 (merge `0c9e5c0`) y se versionó en el PR #95 (merge `46fd1fa`).

| Componente | Versión · commit | Estado |
|---|---|---|
| APK | 0.11.2 · versionCode 15 · `46fd1fa` | release permanente `be-apk-0.11.2`, build local con Gradle y la firma existente. Verificaciones en `build-local-0.11.1.md`, sección 0.11.2 |
| API | 0.11.1 · `44bea3a` | **sin redesplegar**: la corrección es solo de la APK, y #94/#95 no tocan rutas de los `buildFilter`. Tras la integración, el readiness sigue en `44bea3a` |
| Website | 0.11.1 · `44bea3a` | sin cambios |

- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.2/be-0.11.2-46fd1fa.apk`
- **SHA-256:** `c1e24d6eb9e9a355354ddac3d9b81ec0f88d8509a3ec92870fa5e95261684dae` (descargado del release y re-hasheado: idéntico al construido)

**Pendiente en dispositivo, con la 0.11.2:**
- que «Sesiones registradas» cargue después de las 21 h;
- los retornos desde Historial y desde Hoy;
- que las fechas coincidan;
- la corrección de un registro;
- el área inferior con teclado y con la navegación del sistema.

**DL-096 sigue EN CURSO.**

## Publicación 0.11.3 — el teclado deja de tapar los campos

Estado del 2026-09-27. La validación de la 0.11.2 encontró que, con el teclado abierto, «Reps» quedaba tapado en «Corregir registro» (`hallazgos-validacion-telefono.md` §5). La corrección y la versión (0.11.3, versionCode 16) van juntas en el PR #97 (merge `13280e6`).

| Componente | Versión · commit | Estado |
|---|---|---|
| APK | 0.11.3 · versionCode 16 · `13280e6` | release permanente `be-apk-0.11.3`, build local con Gradle y la firma existente. Verificaciones en `build-local-0.11.1.md`, sección 0.11.3 |
| API y website | 0.11.1 · `44bea3a` | **sin redesplegar**: el #97 no toca rutas de los `buildFilter`; el readiness sigue en `44bea3a` |

- **Descarga directa:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.11.3/be-0.11.3-13280e6.apk`
- **SHA-256:** `4be0de7995283be46f719fd24fe60ef51a8f2d16e53a4bab557863caca0fdbae` (descargado del release y re-hasheado: idéntico al construido)

**Pendiente en dispositivo, con la 0.11.3:**
- el teclado sobre «Reps» y «RIR», y «Registrar corrección» alcanzable con el teclado abierto;
- que «Sesiones registradas» cargue después de las 21 h;
- el final del detalle en modo de navegación por gestos;
- Hoy → detalle → volver;
- volver después de guardar una corrección.

**DL-096 sigue EN CURSO.**

Solo datos sintéticos. Sin credenciales.
