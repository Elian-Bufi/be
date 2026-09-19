# Capturas del APK 0.3.0 en el teléfono de Dirección — guía

Es el tramo del asesorado en el APK, más la captura del momento en que se corta el acceso. Toma unos 10 minutos.

**Cuentas** (las contraseñas están en `.env.cuentas-demo`):
- **Asesorado en el teléfono:** DEMO-A01.
- **Profesional en la computadora, en el website:** DEMO-PT (Entrenamiento, perfil no sanitario). El recorrido web de la evidencia usó DEMO-PN; con DEMO-PT se ve también el texto de B2 para un profesional que no es de la salud (08 §12.3).

**APK:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.3.0/be-0.3.0-08cdd08.apk` (SHA-256 `b40fea60…3bb72ced`). Instalalo encima del 0.2.0.

Un minuto antes, abrí `https://be-api-hndp.onrender.com/health/ready` para despertar la API.

| # | Dónde | Qué hacer | Captura |
|---|---|---|---|
| 1 | Teléfono | Abrir la app | `apk-01-bienvenida-0.3.0`: tiene que decir `app 0.3.0 · test · commit 08cdd08` |
| 2 | Teléfono | Iniciar sesión con DEMO-A01 → Cuenta | `apk-02-cuenta-identificador`: sección «Tu identificador BE» |
| 3 | Computadora | En `https://be-web-1ngj.onrender.com/login`, iniciar sesión con DEMO-PT → «Ir al espacio profesional» → «Solicitar vínculo» con el identificador de DEMO-A01 (se puede mandar con «Compartir») y alcance Entrenamiento | — |
| 4 | Teléfono | Cuenta → «Vínculos» → la solicitud pendiente | `apk-03-solicitud-recibida` |
| 5 | Teléfono | «Aceptar vínculo» | `apk-04-vinculo-aceptado` (dice que falta revisar el consentimiento) |
| 6 | Teléfono | «Revisar consentimiento» | `apk-05-pantalla-previa-consentimiento`: tiene que decir «No es un profesional de la salud…» |
| 7 | Teléfono | «Autorizar acceso» | `apk-06-acceso-autorizado` |
| 8 | Teléfono | Volver a Cuenta → «Privacidad y consentimientos» → «Autorizar tratamiento de mis datos de salud» | `apk-07-privacidad-a3-otorgado` |
| 9 | Computadora | En «Tus asesorados», «Abrir» → el Resumen muestra Entrenamiento | captura de la pantalla de la computadora (`apk-08-web-acceso`) |
| 10 | Teléfono | Vínculos → el vínculo → «Revocar acceso de Prof. Demo Entrenamiento» | `apk-09-confirmar-revocacion` |
| 11 | Teléfono | «Revocar acceso» | `apk-10-acceso-revocado` |
| 12 | Computadora | «Actualizar» en el workspace | `apk-11-web-acceso-cortado`: «No encontramos un recurso disponible para esta acción» y «Consentimiento revocado» |

Si podés, sacá una foto del teléfono y la computadora juntos en los pasos 11 y 12: es la captura del corte que pide el brief.

Mandame las capturas como en WP-01 y WP-02. Les quito los metadatos EXIF antes de versionarlas.
