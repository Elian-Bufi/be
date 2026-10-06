# Fuente: paquete de Entrenamiento de Dirección (2026-10-06)

`BE_Entrenamiento_Autonomo_2026-10-06/` es el paquete que Dirección entregó con el encargo «BE · Cierre de Nutrición y
Entrenamiento por serie». La definición del trabajo está en `docs/paquetes/WP-ENTRENAMIENTO-SERIES.md`. El paquete se
copió íntegro y sin cambios: el manifiesto verifica y `verificar_paquete.py` da OK.

| Qué | Para qué se usa en BE |
|---|---|
| `BE_PROMPT_CLAUDE_ENTRENAMIENTO_2026-10-06.md` | El encargo, tal como lo pasó Dirección. La copia adjunta aparte es idéntica |
| `DECISIONES_Y_TIEMPOS.md` | Qué significa cada tiempo y qué no se puede inferir: la semántica que implementa el cálculo de tiempos |
| `REFERENCIAS_VISUALES.md` | Qué referencia usar y las excepciones que evitan copiar errores del dibujo |
| `ESTADO_REVISADO.md` | Lo que se leyó al preparar el paquete. Es una ayuda, no una certificación |
| `referencias/` | La dirección visual. Su principal es `01_series_y_descanso_actualizado.png`. Es composición, no especificación |
| `ejercicios/` | Las tres imágenes, generadas por IA, que el profesional sintético carga por el flujo real, y `CATALOGO.json`, con su procedencia |
| `datos/sesion_demo.json` | La sesión de tres ejercicios y nueve series, con sus objetivos por serie |
| `datos/casos_series.json` y `datos/casos_tiempos.json` | Los resultados esperados: 20 casos de series y 16 de tiempos. Los usan como oráculo las pruebas del dominio |
| `ACEPTACION.csv` | Los 31 criterios funcionales y su nivel de prueba |
| `verificar_paquete.py` y `VERIFICACION_PAQUETE.txt` | La verificación del paquete, sin red. **No prueba BE** |
| `fuentes/PROMPTS_IMAGENES.json` | Cómo se generaron las imágenes y la maqueta |
| `MANIFEST.sha256` | Los hashes del paquete |

- **Las imágenes de ejercicios** son ilustraciones generadas por IA para la demostración. No muestran personas reales y
  no tienen una licencia de terceros: su procedencia se registra como lo que es, generada por IA para BE. No certifican
  técnica, y su revisión técnica queda pendiente del profesional.
- **Los números** (cargas, RIR y descansos) son datos de prueba de la interfaz. No son una prescripción para una persona
  real.
- No se cambian los resultados esperados para que una prueba pase.
