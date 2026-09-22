# EVIDENCIA · WP-07 — Información profesional pertinente

Qué prueba cada archivo. La lectura razonada está en `DEFENSA/WP-07.md`.

| Archivo | Qué es |
|---|---|
| `web/web-01` a `web-09` (.png) | El website en `test`, con Edge real por puppeteer: el catálogo, el pedido armado campo por campo, la Solicitud sin responder, la respuesta declarada por la persona, y la corrección con la original intacta. DEMO-PT y un asesorado sintético nuevo que se registra por la API y responde como lo haría la APK |
| `web/recorrido.json` | Los pasos (URL, hora y términos prohibidos en el texto visible: **0 en los 9**) y las 25 llamadas a la API con su status. Todas 200 o 201: ningún 4xx, ningún 5xx |
| `resultados-integracion-56c0c4d.md` y `.json` | La integración de la CI (PostgreSQL 16 real) sobre el commit que cierra el paquete, por ID de prueba: **415/415**, 22 suites, 133 identificadores, 0 fallos |
| `ci-verificar-56c0c4d.log` | El job de verificación de la misma CI: typecheck, dominio, copy de las pantallas, API unitaria, build y auditoría de dependencias |
| `verificacion-urls.txt` | API, website y descarga anónima del APK 0.7.0, con su SHA-256, verificados en vivo sobre el commit final |
| `apk.txt` | Identidad del APK 0.7.0: build EAS, commit, tamaño y la búsqueda de secretos en el bundle |
| `apk/` | **Las toma Dirección** en su teléfono: Cuenta → «Información» |

## Lo que las capturas demuestran, en una frase cada una

- **`web-03`** — ver el catálogo no concede nada: el aviso dice, antes de cualquier acción, que pedir no amplía el acceso ni el consentimiento.
- **`web-04` y `web-05`** — el pedido se arma **campo por campo**, no por formulario entero, y un campo marcado como requerido viene con el aviso de que igual puede quedar sin responder: el asesorado decide.
- **`web-06` y `web-07`** — una Solicitud sin responder se muestra como «Sin responder», con el texto «No responder también es una opción». No hay porcentaje de avance ni nada que la presente como un incumplimiento.
- **`web-08`** — lo respondido llega con el rótulo «Declarado por la persona» en cada dato, y el detalle abre diciendo que no es una medición ni un diagnóstico.
- **`web-09`** — corregir **agrega**: la respuesta original queda entera y fechada, la corrección aparece con su motivo, y la vigente se marca por relación. Además, los nombres de los campos son los de la plantilla, nunca los códigos internos.

## Verificación automática del texto

`recorrido.json` registra, por cada captura, los términos que el paquete prohíbe en el texto visible: `cumplimiento`, `completitud`, `obligatorio`, cualquier porcentaje, y `diagnóstico` o `medición` **afirmados**. El detector es el mismo del dominio (`terminosProhibidosDeFormulariosEn`), así que la prueba de copy y la evidencia miran exactamente la misma lista. **Cero hallazgos en las nueve capturas.**

Dos notas de método, porque un control que no se entiende no sirve de control:

- **El APK se rehízo.** El primer build salió con el commit vacío, porque se lanzó con archivos sin commitear. Un APK sin su commit no cumple la identidad de 07 §34 y TEST-APK-008, así que se descartó. El que está publicado es el segundo, con el árbol limpio.
- **El conteo de copy sobre el bundle del APK solo usa cadenas ASCII.** El bytecode de Hermes guarda en UTF-16 todo lo que lleva tilde, así que un 0 en una frase acentuada no probaría ausencia. Lo mismo vale, sin debilitarlo, para el control de secretos: las cadenas que busca son todas ASCII.

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ningún archivo.
