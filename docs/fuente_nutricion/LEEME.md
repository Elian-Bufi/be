# Fuente: paquete de Nutrición de Dirección (2026-10-05)

`BE_Nutricion_Demo_2026-10-05/` es el paquete que Dirección entregó con el encargo «BE · Implementación de Nutrición con
recetas, fotos y macros verificables» (`docs/paquetes/WP-NUTRICION-RECETAS.md`). Se copió íntegro y sin cambios.

| Qué | Para qué se usa en BE |
|---|---|
| `BE_PROMPT_CLAUDE_NUTRICION_2026-10-05.md` | El encargo, tal como lo pasó Dirección |
| `RECETAS_Y_CALCULOS.md` | Las tres recetas, el método de cálculo y las fuentes |
| `datos/alimentos_usda_100g.json` | Los ocho alimentos que la migración siembra en el catálogo, con su fuente USDA |
| `datos/usda_fuentes_completas.json` | Los registros completos de USDA, como evidencia de origen |
| `datos/recetas_demo.json` y `datos/casos_calculo.json` | Los resultados esperados que comprueban las pruebas del dominio y de integración |
| `datos/desglose_por_ingrediente.csv` | El aporte de cada ingrediente, para revisar a mano |
| `fotos/` | Las tres fotos, generadas por IA, que el profesional sintético carga por el flujo real |
| `referencias/` | Las cuatro capturas aprobadas: la dirección visual de la APK |
| `verificar_calculos.py` y `VERIFICACION.txt` | La verificación del conjunto, sin red. No prueba BE |
| `MANIFEST.sha256` | Los hashes del paquete. Se comprueba con `sha256sum -c MANIFEST.sha256` desde la carpeta |

- **Licencias:** los datos de USDA FoodData Central son de dominio público (CC0), según la guía de su API. Las fotos son
  ilustraciones generadas por IA para la demostración: no son fotos de personas ni de comidas reales, y no muestran
  porciones medidas.
- **Verificación:** `verificar_calculos.py` se ejecutó el 2026-10-05 con el Python 3.12.7 embebible oficial, fuera del
  repositorio, y dio OK: 8 alimentos, 3 recetas y 11 casos numéricos. El 17 de 17 del manifiesto también coincide.
