# Capturas del APK 0.3.0 en el teléfono de Dirección

**Fecha:** 2026-09-19, entre las 12:50 y las 12:55 (hora local del teléfono). **Ambiente:** `test`.
**Cuentas:** DEMO-A01 (asesorado, en el APK) y DEMO-PT (Entrenamiento, no sanitario, en el website).
**APK:** release `be-apk-0.3.0`, `be-0.3.0-08cdd08.apk` (ver `../apk.txt`).

Las capturas están en orden cronológico. Se les quitaron los segmentos EXIF (APP1) sin recodificar la imagen.

- **Prefijo `apk-`:** es el APK. No tiene barra de dirección; la navegación es por «Volver a Cuenta» y «Volver al vínculo».
- **Prefijo `telefono-web-`:** es el website, abierto en el navegador del mismo teléfono.

| Captura | Hora | Qué muestra | Paso de `../GUIA-CAPTURAS-APK.md` |
|---|---|---|---|
| `apk-01-vinculos-sin-solicitudes.jpg` | 12:50 | Vínculos del asesorado, vacío | — |
| `apk-02-cuenta-identificador.jpg` | 12:50 | Cuenta: el botón «Vínculos», el estado operativo y «Tu identificador BE» con «Compartir» | 2 |
| `telefono-web-01-vinculos-sin-solicitudes.jpg` | 12:50 | La misma lista en el website: Cuenta · Vínculos · Privacidad | — |
| `telefono-web-02-pro-solicitar-vinculo.jpg` | 12:52 | DEMO-PT en el Espacio profesional: «Solicitar vínculo» con el identificador de DEMO-A01 | 3 |
| `telefono-web-03-pro-solicitar-entrenamiento.jpg` | 12:53 | El mismo formulario con el alcance Entrenamiento: la finalidad se fija por alcance | 3 |
| `apk-03-solicitud-recibida.jpg` | 12:53 | La solicitud pendiente: quién la pide, alcance, finalidad y vencimiento. Aclara que aceptar el vínculo no autoriza el acceso | 4 |
| `apk-04-vinculo-aceptado.jpg` | 12:53 | Vínculo activo, «Consentimiento: pendiente de tu decisión» y «Revisar consentimiento» | 5 |
| `apk-05-pantalla-previa-consentimiento.jpg` | 12:53 | La pantalla previa a B2, con el texto para un profesional no sanitario: «No es un profesional de la salud…» | 6 |
| `apk-06-acceso-autorizado.jpg` | 12:54 | «Acceso autorizado», con el profesional, el alcance, la finalidad, la fecha y el estado | 7 |
| `apk-07-vinculo-con-acceso.jpg` | 12:54 | El vínculo con «Revocar acceso de Prof. Demo Entrenamiento» y un historial de cuatro hechos | previo a 10 |
| `apk-08-acceso-revocado.jpg` | 12:55 | «Acceso revocado». El vínculo sigue activo: revocar no finaliza el vínculo | 11 |
| `apk-09-consentimiento-revocado.jpg` | 12:55 | Consentimiento «Revocado», con la hora de autorización y la de revocación, y «Autorizar nuevamente» | — |
| `apk-10-historial.jpg` | 12:55 | El historial con los cinco hechos y quién hizo cada uno | — |

**Pasos de la guía que no tienen captura:**
- **1:** la versión en la bienvenida. La pantalla de Vínculos no existe en el APK 0.2.0, así que las capturas son del 0.3.0.
- **8:** el otorgamiento de A3.
- **9:** el acceso del profesional.
- **10:** el diálogo de confirmación.
- **12:** el corte del lado del profesional.

El corte está evidenciado en el recorrido web (`../web/web-00-corte-lado-a-lado.png`, `web-19` y `web-20`) y en las mediciones (`../medicion-del-corte-test.json` y `../mediciones-ci-main-08cdd08.jsonl`).
