# EVIDENCIA · WP-06 — Circuito de entrenamiento

Qué prueba cada archivo. La lectura razonada está en `DEFENSA/WP-06.md`.

| Archivo | Qué es |
|---|---|
| `GUIA-DEMO.md` | El recorrido completo paso a paso: cuentas, datos a cargar y lo que tiene que verse. Es el guion de la demo en vivo y de las capturas de la APK |
| `web/web-01` a `web-22` (.png) | El website en `test` (API/web 0.6.0, commit `c50fdd9`), con Edge real por puppeteer: evaluación con fuentes, objetivo, el plan de borrador a activado, lo que no se entiende que no se guarda, las ejecuciones con lo planificado al lado de lo ejecutado, y la revisión que prepara un borrador sucesor. DEMO-PT y un asesorado sintético nuevo que registra por la API como APK |
| `web/recorrido.json` | Los pasos (URL, hora y términos prohibidos en el texto visible: 0 en los 22) y las 64 llamadas a la API con su status. Ningún 5xx. El único error es el 400 que el paso `web-12` provoca a propósito: una serie con «ocho» no se guarda |
| `adversariales-test.json` | La corrida en vivo de `node scripts/adversariales-wp06.mjs` contra `test` (API 0.6.0, `c50fdd9`): las variantes de entrenamiento de los adversariales 7 y 8, que nunca se habían ejecutado (DL-084), más «Comenzar» dos veces, el borrador que no es evidencia, «No pude realizarla» como acto, RPE que no es criterio, y cero juicio sobre 36 respuestas |
| `resultados-integracion-c50fdd9.md` y `.json` | La integración de la CI (PostgreSQL 16 real) sobre el commit final del paquete, por ID de prueba: 414/414, 22 suites, 133 identificadores, 0 fallos |
| `ci-verificar-c50fdd9.log` | El job de verificación de la misma CI: typecheck, dominio, copy de las pantallas, API unitaria, build y auditoría de dependencias |
| `verificacion-urls.txt` | API, website y descarga anónima del APK 0.6.0, con su SHA-256, verificados en vivo sobre el commit final |
| `apk.txt` | Identidad del APK 0.6.0: build EAS, commit, tamaño y la búsqueda de secretos en el bundle |
| `apk/` | **Las toma Dirección** en su teléfono con la Parte 3 de `GUIA-DEMO.md`: DEMO-A01 ya tiene un plan de entrenamiento activo en `test`. Se versionan sin EXIF |

## Lo que las capturas del website demuestran, en una frase cada una

- **`web-03` y `web-04`** — cada dato de la evaluación dice de dónde sale: lo informado por el asesorado no es un diagnóstico.
- **`web-09`** — validar ubica el problema («Bloque 1 → falta al menos una sesión») y no juzga el programa.
- **`web-11`** — % RM o RIR, nunca los dos; la carga sugerida aparte, y dicho; un rango (6-8) y una carga con decimales (62.5) se escriben sin que el campo los borre.
- **`web-12`** — lo que no se entiende no se guarda como otra cosa: el guardado falla y dice dónde.
- **`web-14` y `web-15`** — activar es un acto aparte con su consecuencia, y la versión activa queda en solo lectura con la huella de su instantánea.
- **`web-16`** — lo planificado al lado de lo ejecutado; la sustitución con sus dos puntas; la corrección vigente arriba y el registro original intacto abajo; «No realizada» solo porque el asesorado lo declaró; y los días sin registro como «no hay dato».
- **`web-18` a `web-21`** — ver el contexto no es revisar; no hay un séptimo resultado «Progresar»; AJUSTAR prepara un borrador sucesor y **la versión activa no cambia**.

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ningún archivo.
