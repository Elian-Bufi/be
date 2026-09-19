# EVIDENCIA · WP-04 — Circuito nutricional

Qué prueba cada archivo. La lectura razonada está en `DEFENSA/WP-04.md` §8.

| Archivo | Qué es |
|---|---|
| `GUIA-DEMO.md` | El recorrido completo paso a paso: cuenta, datos a cargar y lo que tiene que verse. Es el guion de la demo en vivo y de las capturas del APK |
| `web/web-01` a `web-19` (.png) | El website en `test`, con Edge real por puppeteer: el estado final de cada paso de las partes 1, 3 y 5 de la guía. DEMO-PN, una asesorada sintética nueva y DEMO-PT |
| `web/recorrido.json` | Los pasos (URL, hora y términos prohibidos en el texto visible: 0 en los 19) y cada llamada a la API con su status. Ningún 5xx |
| `adversariales-test.json` | La corrida en vivo de `node scripts/adversariales-wp04.mjs` contra `test` (API 0.4.0, `6e8efc4`): casos 8 y 7 nutricional (DL-042), cruce de alcance en las 18 operaciones y cero puntaje en las 83 respuestas |
| `resultados-integracion-*.md` y `.json` | La integración de la CI (PostgreSQL 16 real), por ID de prueba, y la salida de Jest |
| `ci-verificar-*.log` | El job de verificación de la misma CI: typecheck, dominio, copy de las pantallas, API unitaria, build y auditoría |
| `verificacion-urls.txt` | API, website y descarga anónima del APK, con su SHA-256 |
| `apk.txt` | Identidad del APK 0.4.0: build EAS, commit, `app.config` embebido y la búsqueda de credenciales en el bundle (0) |
| `apk/` | Capturas del APK en el teléfono de Dirección (partes 0, 2 y 4 de la guía). **Pendiente** |

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ningún archivo.
