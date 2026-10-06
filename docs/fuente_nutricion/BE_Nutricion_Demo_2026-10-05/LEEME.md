# BE · Paquete de Nutrición para Claude

Preparado el 5 de octubre de 2026 a pedido de Elian. Incluye la dirección visual aprobada, tres fotos de recetas generadas por IA y un conjunto numérico trazable para construir y verificar el flujo real.

## Cómo usarlo

1. Descomprimí el ZIP completo y adjuntalo o dejalo accesible en el proyecto de Claude Code.
2. Usá BE_PROMPT_CLAUDE_NUTRICION_2026-10-05.md como instrucción de trabajo.
3. Las cuatro referencias visuales ya están incluidas y nombradas por función. No hace falta adivinar qué captura corresponde a cada pantalla.
4. Para cargar las recetas, usá los tres PNG de fotos/ y sus fichas en RECETAS_Y_CALCULOS.md. Los ingredientes y cantidades también están disponibles en JSON y CSV.

## Archivos

- fotos/: originales PNG de pollo con arroz y verduras, salmón con papa y brócoli, y lentejas con arroz y verduras. Se conservaron sin recortar ni recomprimir.
- referencias/: las cuatro capturas adjuntadas al aprobar el flujo, conservadas sin modificaciones.
- RECETAS_Y_CALCULOS.md: ingredientes, pesos, instrucciones, valores esperados, método y fuentes.
- datos/alimentos_usda_100g.json: ocho alimentos, estado de preparación, fuente y datos por 100 g.
- datos/usda_fuentes_completas.json: registros completos de USDA usados como evidencia de origen.
- datos/recetas_demo.json: recetas e ingredientes con cantidades y resultados calculados.
- datos/desglose_por_ingrediente.csv: aportes separados por ingrediente; abrir con un visor de CSV si se desea.
- datos/casos_calculo.json: once casos numéricos y casos de comportamiento que debe probar la aplicación.
- verificar_calculos.py: verificación local reproducible del conjunto, sin red.
- VERIFICACION.txt: resultado de la verificación realizada al preparar el paquete.
- MANIFEST.sha256: hashes de los archivos incluidos, excluido el propio manifiesto.

## Qué está listo y qué debe demostrar la implementación

Está listo el material de referencia y se verificó su aritmética. No se modificó el repositorio ni se ejecutó una carga real en BE durante la creación de este paquete.

Claude debe demostrar desde la web profesional la carga y persistencia de imágenes, edición de ingredientes, cálculo, asignación al plan y lectura en el móvil. Debe demostrar también el registro de consumo y las fotos privadas de comidas diferentes. Una captura o una imagen fija incluida en la app no acredita esos recorridos.

Las tres recetas son ejemplos de prueba, no un plan personal ni sustituciones equivalentes. La foto no determina gramos ni nutrientes. Los macros del carrusel corresponden a porciones previstas; el consumo real requiere las cantidades confirmadas que corresponda registrar.

Los datos proceden de USDA FoodData Central, SR Legacy, consultados el 5/10/2026. Se eligió una fuente identificada y fija para que la comparación sea reproducible. Las cifras de los mockups anteriores eran sintéticas y pueden diferir de las calculadas aquí.
