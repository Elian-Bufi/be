# MESA-01 — estado de DV-12 y DV-13 tras WP-01

> Nota de actualización del ejecutor técnico. **No modifica** `BE_MESA_01_MATRIZ_COBERTURA_DA_VINCI_14x14_2026-09-10.xlsx` ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256` y cualquier edición rompería la verificación de hashes de la entrega de Dirección (y el job `legajo` de la CI). Cuando Dirección quiera consolidarlo en la matriz, reemplaza el archivo y reemite el manifiesto.

**Fecha:** 2026-09-17 · **Paquete:** WP-01 · **Fuente de exigencia:** `docs/fuente_escolar/Entregables.pdf`, puntos 12 y 13.

## Cambio de estado

El informe MESA-01 clasificaba `DV-11`…`DV-14` en «D. Solo puede cerrarse con runtime». Con WP-01:

| Punto | Qué pide el entregable | Estado anterior | Estado ahora |
|---|---|---|---|
| **12** | URL para descargar la APK · URL del repositorio con el código fuente de la APK | pendiente (requiere runtime) | **disponible con placeholder** |
| **13** | URL del Website hosteado · URL del repositorio con el código fuente del Website | pendiente (requiere runtime) | **disponible con placeholder** |
| `DV-11`, `DV-14` | — | pendiente | sin cambios: siguen requiriendo funcionalidad real |

«Disponible con placeholder» significa que la URL existe, responde y es verificable desde un dispositivo externo, pero la pantalla **no tiene funcionalidad**: dice «BE — en construcción». No sustituye el cierre funcional de `DV-11` ni `DV-14`.

## URLs

| Recurso | URL | Notas |
|---|---|---|
| APK (EAS) | `https://expo.dev/artifacts/eas/cVuX-59OzpvEKF1PrYzW2s-l4UFmgKJDKsDWhCdD5io.apk` | build `d2159ebc-b618-4cb2-bb2c-e3ce2e581001`, perfil `test`, 68 MB, SHA-256 `4aa99d860e7a52b855024a933ee9201f6fa4f084c98a4b7d1ee272d6d57349e3`. **Expira 2026-10-01 19:02 UTC.** |
| APK (copia durable) | `https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.1.0` | mismo archivo; requiere que el repositorio sea público para descargarse sin sesión |
| Código fuente (APK y Website) | `https://github.com/Elian-Bufi/be` | **repositorio privado hoy**: el tribunal no puede abrirlo |
| Website | pendiente de completar con la URL de Render | ver `DEFENSA/WP-01.md` |
| API | pendiente de completar con la URL de Render | `GET /health` |

## Dos cosas que hay que decidir antes de la entrega

1. **Visibilidad del repositorio.** Los puntos 12 y 13 piden la URL del código fuente. Con el repositorio privado, esas dos URLs no son verificables por el tribunal. Opciones: hacerlo público, o dar acceso de lectura a los evaluadores.
2. **Vigencia del APK.** El artefacto de EAS expira el mismo día de la entrega. O se publica la copia durable (depende del punto 1), o se vuelve a construir el APK cerca de la fecha de defensa.
