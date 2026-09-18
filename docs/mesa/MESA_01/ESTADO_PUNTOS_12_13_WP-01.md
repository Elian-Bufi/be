# MESA-01 — estado de DV-12 y DV-13 tras WP-01

> Nota de actualización del ejecutor técnico. **No modifica** `BE_MESA_01_MATRIZ_COBERTURA_DA_VINCI_14x14_2026-09-10.xlsx` ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256` y cualquier edición rompería la verificación de hashes de la entrega de Dirección (y el job `legajo` de la CI). Cuando Dirección quiera consolidarlo en la matriz, reemplaza el archivo y reemite el manifiesto.

**Fecha:** 2026-09-18 · **Paquete:** WP-01 · **Fuente de exigencia:** `Entregables.pdf` de la escuela, puntos 12 y 13 (no versionado: ver `docs/fuente_escolar/LEEME.md`).

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
| **APK (para la lámina 12)** | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.1.0/be-0.1.0-fd3ed53.apk` | release `be-apk-0.1.0` del repositorio público; **no expira**. Archivo `be-0.1.0-fd3ed53.apk`, 68 MB, SHA-256 `a0d5daa451b757db14b431745f6b10cc05c312eda287d8ccd18ed0f88c997229`; muestra `app 0.1.0 · test · commit fd3ed53` |
| APK (EAS, mismo archivo) | `https://expo.dev/artifacts/eas/vT70Js23NejC6YFJkDiRrC7at1UHJtfx2DEKYyf91V4.apk` | build `70c97eed-11c1-48ea-bb1e-6cc9a302ae54`; **expira 2026-10-02 17:43 UTC**: no usar en la lámina |
| Código fuente (APK y Website) | `https://github.com/Elian-Bufi/be` | **público** desde el 2026-09-18; monorepo (`apps/mobile`, `apps/web`) |
| Website | `https://be-web-1ngj.onrender.com` | «BE — en construcción» + identidad del build; cabeceras HSTS, CSP, X-Frame-Options, nosniff |
| API | `https://be-api-hndp.onrender.com/health` | 200 con ambiente, versión, commit y estado de base y migraciones |

## Decisiones tomadas (2026-09-18)

1. **Visibilidad del repositorio:** público. Las URLs de código de los puntos 12 y 13 son verificables por el tribunal.
2. **Vigencia del APK:** la URL de la lámina 12 es la del release del repositorio, que no expira. El artefacto de EAS queda como copia secundaria.

Pendiente para la lámina 12: la foto del APK instalado y abierto en un Android físico.
