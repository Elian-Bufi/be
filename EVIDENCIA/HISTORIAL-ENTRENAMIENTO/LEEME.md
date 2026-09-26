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

Solo datos sintéticos. Sin credenciales.
