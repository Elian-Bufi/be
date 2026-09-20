# EVIDENCIA · WP-05 — Antropometría, métodos y cálculos

Qué prueba cada archivo. La lectura razonada está en `DEFENSA/WP-05.md`.

| Archivo | Qué es |
|---|---|
| `GUIA-DEMO.md` | El recorrido completo paso a paso: cuenta, datos a cargar y lo que tiene que verse. Es el guion de la demo en vivo y de las capturas del APK |
| `web/web-01` a `web-19` (.png) | El website en `test` (API/web 0.5.1, commit `4e5503f`), con Edge real por puppeteer: el estado final de cada paso — borrador, registro, cálculo, referencia, corrección, anulación, evolución y el borrador ajeno que no existe. DEMO-PA, una asesorada sintética nueva y DEMO-PN |
| `web/recorrido.json` | Los pasos (URL, hora y términos prohibidos en el texto visible: 0 en los 19) y las 55 llamadas a la API con su status. Ningún 5xx |
| `adversariales-test.json` | La corrida en vivo de `node scripts/adversariales-wp05.mjs` contra `test` (API 0.5.1, `4e5503f`): los seis casos que DL-042 asigna al paquete — doble anulación, serie con huecos, medición anulada, borrador de otro profesional, cálculo (admisibilidad, versión exacta, coexistencia, referencia) y cero juicio sobre 51 respuestas |
| `resultados-integracion-4e5503f.md` y `.json` | La integración de la CI (PostgreSQL 16 real) sobre el commit final del paquete, por ID de prueba: 294/294, 20 suites, 0 fallos |
| `ci-verificar-4e5503f.log` | El job de verificación de la misma CI: typecheck, dominio **169/169**, copy de las pantallas **5/5** (los dos dominios), API unitaria **33/33**, build y auditoría de dependencias |
| `verificacion-urls.txt` | API, website y descarga anónima del APK 0.5.1, con su SHA-256, verificados en vivo sobre el commit final |
| `apk.txt` | Identidad del APK 0.5.1: build EAS, commit, tamaño y la búsqueda de secretos en el bundle (0 en las cuatro). Explica por qué reemplaza a la 0.5.0 |
| `apk/` | Capturas del APK 0.5.1 en un Android real (Parte 0 y Parte 5 de la guía), con DEMO-A01 contra `test`. Las toma Dirección; quedan pendientes al momento de este commit |

## Lo que las capturas del website demuestran, en una frase cada una

- **`web-04` a `web-08`** — un borrador no es historia hasta que se registra, y el registro es un acto explícito con su propio aviso.
- **`web-10` a `web-13`** — el cálculo declara método, versión, regla y precisión; dos corridas conviven; dejar una como referencia es un acto del profesional que no toca a las otras.
- **`web-14` y `web-15`** — corregir conserva el valor original y dispara un recálculo que reemplaza al cálculo anterior sin borrarlo (REG-06-161), visible en el mismo cálculo con «Reemplaza a un cálculo anterior, que se conserva.». La tarjeta pasa a mostrar el valor que **rige** —`peso: 73.1 kg · Medido · Vigente · Corregida`— y el índice de abajo, 23.869 kg/m², sale de ese mismo número: las dos lecturas coinciden. El original no se pierde: está rotulado dentro de «Correcciones (1)». Que no coincidieran fue el tercer hallazgo del cierre (`DEFENSA/WP-05.md` §5.3).
- **`web-16` y `web-17`** — anular no es destructivo: la medición queda «Anulada» con su motivo y su historia a la vista, nunca borrada.
- **`web-18`** — la evolución agrupa los días sin dato en tramos (`84 días sin dato`, no 84 filas vacías), la medición corregida se marca «Corregida», y la medición anulada **desaparece de la serie sin convertirse en cero**.
- **`web-19`** — el borrador de DEMO-PA no existe para DEMO-PN, aunque los dos tengan capacidad antropométrica y vínculo activo con el mismo asesorado.

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ningún archivo.
