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

La cantidad cuenta grupos del eje, no barras ni puntos: es lo que el marco esconde y lo que las flechas recorren. Desplazar el gráfico **no siempre baja el número**: lo que entra por un lado puede dejar grupos ocultos del otro; el aviso desaparece solo cuando todos caben en el marco. La navegación por teclado en PC sigue verificada solo por automatización.

## Tanda 2 (2026-09-30): la primera carga y los redibujos sin cambio de tamaño

Pendiente de la auditoría: el gancho medía al montar (antes de que Recharts ubicara los rótulos) y después solo ante cambios de tamaño y desplazamiento. Comprobación con `sonda-primera-carga.mjs`: 47 series, ancho angosto (**720 px y 420 px**), desde la primera carga del gráfico (abrir el detalle y muestrear cada 100 ms el número del aviso y la cuenta real de rótulos fuera del marco, con la misma regla).

| Ancho | Primera carga | Tras cambiar la variable (mismo marco) | Desplazado al final |
|---|---|---|---|
| 720 px (marco 596 px) | 0 durante ≤ 100 ms tras el primer dibujo (SVG ya a 4572 px) → **41 = 41** | 41 = 41 | 41 = 41 (las ocultas quedan del lado izquierdo) |
| 420 px (marco 307 px) | 0 durante ≤ 100 ms → **44 = 44** | 44 = 44 | 44 = 44 |

No se reprodujo un conteo incorrecto en estado estable: la notificación inicial del `ResizeObserver` llega después del primer dibujo real. Como eso no demuestra que cubra todo redibujo, se agregó el mecanismo más simple: **volver a medir después de cada dibujo del componente** (un `useEffect` sin dependencias; si el número no cambia, React no vuelve a dibujar). Sin `setTimeout`, sin sondeo, sin observadores de la página. Con el cambio, las mismas tres mediciones coinciden en los dos anchos; el recorrido de densidad completo se volvió a correr (ver el PR).
