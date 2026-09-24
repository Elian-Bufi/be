# Verificación de la toma antropométrica sobre la figura (DL-073)

**Fecha:** 2026-09-24 · **Entorno:** API y website locales de la rama del tramo, PostgreSQL 16 embebido con la migración `20260924130000_protocolo_de_pliegues_y_perimetros`, una cuenta profesional sintética con un asesorado vinculado en Antropometría · **Navegador:** Chrome por puppeteer.

## Lo que se hizo y lo que se observó

| Paso | Resultado |
|---|---|
| Abrir «En preparación» | El protocolo propuesto es «Pliegues y perímetros (demostración)»; la figura muestra **14 puntos**, los de las métricas del protocolo que tienen sitio (peso y talla no tienen sitio y quedan solo en la lista) |
| Cargar peso, talla, un pliegue tricipital de **8,5 mm**, uno subescapular de **31 mm** y el perímetro de cintura | Los puntos de esas métricas pasan a llenos y la lista dice «Cargado» |
| Comparar el pliegue de 8,5 mm con el de 31 mm | **El mismo color** de relleno y de trazo: la figura ubica, no califica (RF-048; INV-06-06) |
| Tocar el punto del pliegue abdominal | El foco pasa a su campo en la lista (B10-10 §7: el punto es un atajo, la lista es el camino) |
| Escribir «9x» en un perímetro y guardar | No se manda nada; el error queda en ese campo |
| Guardar y volver a abrir | El borrador vuelve con los mismos valores («8,5», con coma) y los mismos puntos llenos |
| Registrar | Lleva a Evaluaciones, con las mediciones, su unidad de origen y el protocolo |

40 llamadas a la API, ninguna 4xx ni 5xx, sin errores de consola.

## Lo que lo sostiene en el código

- `packages/domain/src/figura-antropometrica.ts`: `puntosDeLaFigura` recibe el conjunto de claves con dato, no los valores.
- `packages/domain/src/figura-antropometrica.test.ts`: un punto lleva solo su sitio, su nombre y si tiene dato.
- `scripts/contraste.test.cjs`: el contorno y los puntos de la figura, a 3:1 como mínimo.
