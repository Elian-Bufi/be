# Capturas del APK 0.9.1 en el teléfono de Dirección

El recorrido del asesorado en un Android real (Samsung, One UI), el 2026-09-25 entre las 11:30 y las 14:09 (hora de Buenos Aires). Cuenta **DEMO-A01** contra el ambiente `test`, APK `be-apk-0.9.1` → commit `0698868`. Son las capturas que pide `../GUIA-DE-CAPTURAS-APK.md`. Datos sintéticos. Sin metadatos EXIF, sin marca de dispositivo ni fecha embebida.

**Por qué 0.9.1 y no 0.9.0.** La 0.9.0 tenía un defecto en el campo Sí/No de formularios (FRM-2/NUM-6): lo escrito que no calzaba exacto con «sí» se guardaba como **No** sin avisar. Se corrigió en el PR #82 (Sí/No se elige, no se escribe) y se publicó la APK 0.9.1. Estas capturas son de esa versión, así que documentan la corrección funcionando, no el defecto.

## Identidad y navegación

| Captura | Qué demuestra |
|---|---|
| `apk-01-bienvenida-0.9.1` | Identidad del build al pie: `app 0.9.1 · test · commit 0698868` (07 §34, TEST-APK-008), tema oscuro e isotipo |
| `apk-02-cuenta` | Los accesos del asesorado: Nutrición, Entrenamiento, Antropometría, Información y Vínculos |

## Información profesional pertinente (WP-07, RF-071) — la corrección

| Captura | Qué demuestra |
|---|---|
| `apk-03-informacion-dos-estados` | Dos solicitudes conviviendo: una **«Respondida»** y otra **«Sin responder»** con «Completar». La ausencia de respuesta no se muestra como incumplimiento ni con un porcentaje (09:1586-1587) |
| `apk-04-formulario-si-o-no` | El campo **«Fuma actualmente»** con **dos botones Sí / No** y la ayuda «Elegí una opción. Podés dejarlo sin responder». Antes era texto libre: acá está la corrección del PR #82 |
| `apk-05-si-marcado` | La opción **«Sí» elegida** (fondo lleno, distinta de «No»), con la pista «Tocá de nuevo la opción elegida para dejar el campo sin responder»: volver a «sin responder» es posible, y ese tercer estado es el dato |
| `apk-06-respuesta-fuma-si` | «Respuesta enviada» y la lectura de vuelta: **«Fuma actualmente: Sí»**. El valor elegido se guardó y se lee intacto — la prueba de que ya no se invierte (09 §22.7) |

## Circuito de entrenamiento (WP-06)

| Captura | Qué demuestra |
|---|---|
| `apk-07-entrenamiento-hoy` | Las sesiones del plan con su prescripción: **«Carga sugerida 60 kg»**, **«75 % RM»** — prescripción del profesional, no medición del asesorado |
| `apk-08-registro-condicion-sesion` | El registro elige nivel de detalle (por serie / por ejercicio) y condición (**Realizada / Realizada con desvío**), y ofrece **«No pude realizarla»**: no entrenar es una opción legítima |
| `apk-09-serie-registrada-kg-lb` | Una serie registrada en borrador (**60 kg × 8 reps · esfuerzo 7**) con el selector de unidad **kg / lb** y RIR opcional. Lo planificado y lo hecho se muestran separados, nunca mezclados |
| `apk-10-correccion-conserva-original` | **La garantía más profunda del sistema:** la corrección (60 kg × **9** reps) convive con el **registro original** (× **8** reps), con «El registro original se conserva». Una corrección se agrega, nunca sobrescribe (REG-06) |

## Antropometría — honestidad del dato

| Captura | Qué demuestra |
|---|---|
| `apk-11-evolucion-peso-sin-dato` | «Mi evolución» de peso: los días sin medición se muestran como **«Sin dato»** (78 días), **no se completan con cero ni se unen con una línea**. Donde hay dato, tal cual: **71,2 kg · Medido** |
| `apk-12-evolucion-talla-comparabilidad` | La serie de talla y la regla al pie: **«Dos mediciones se comparan solo si comparten protocolo, método y unidad»**. La app no compara lo que no es comparable |

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ninguna captura.
