# Corrección · el aviso de desplazamiento de los gráficos de entrenamiento

Orden de Dirección del 2026-09-30 (corrección pequeña). Rama `fix/aviso-de-desplazamiento`, sobre `main` (`53cc70e`). Sin cambios de contrato, API ni base.

## El defecto

La prueba manual en Android de #115 vio «Hay más series a los costados…» con las tres series a la vista, y lo mismo con «Hay más sesiones…». El aviso salía de `scrollWidth > clientWidth + 1`: un desborde de unos píxeles del marco (márgenes del eje, el ancho mínimo por grupo redondeado hacia arriba) lo disparaba sin que hubiera ningún grupo oculto.

**Reproducido en el navegador**, con el código anterior: en una ejecución de dos series, en escritorio y en móvil de 390 px, el marco desbordaba por margen y el aviso aparecía.

## La corrección

El aviso ya no afirma nada que no mida. El gancho `useFueraDeLaVista` cuenta **los rótulos del eje cuyo recuadro cae fuera del marco** (los mismos `g > text.grafico__tick` por los que el teclado trae a la vista el elegido), y se vuelve a medir al desplazar y al cambiar de tamaño. El texto dice la cantidad real:

> 36 series quedan fuera de la vista: desplazá el gráfico o recorrelo con las flechas. La tabla tiene todas.

Con 0 fuera de la vista no hay aviso, aunque el marco desborde por un margen. Se conservan el desplazamiento interno, el ancho mínimo por grupo y el desplazamiento automático a la selección.

## Pruebas

| Prueba | Resultado |
|---|---|
| Unitarias del dominio de la comparación (34; el copy del aviso, con cantidad, sin términos prohibidos) | 34/34 |
| Recorrido de densidad, escritorio 1280 px y móvil 390 px (`recorrido-densidad.mjs`): con 47 series el aviso cuenta las que quedan fuera (36 en escritorio); con 2 series, todas a la vista, **sin aviso** aunque el marco desborde; el resto de los 48 controles de densidad, sin cambios | **48/48** |
| `npm test`, typecheck, OpenAPI (sin cambios), legajo y build | ver el PR |

Capturas: `cierre/12-aviso-47-series.png` (escritorio, «36 series quedan fuera de la vista») y `cierre/13-aviso-2-series-sin-aviso.png` (dos series, sin aviso).

## Límite

La cantidad cuenta grupos del eje, no barras ni puntos: es lo que el marco esconde y lo que las flechas recorren. La navegación por teclado en PC sigue verificada solo por automatización.
