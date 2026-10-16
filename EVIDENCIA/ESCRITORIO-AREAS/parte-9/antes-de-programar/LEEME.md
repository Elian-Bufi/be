# Parte 9 · Cargar una toma sobre la figura: los pliegues, antes de programar

**Estado: propuesta, a validar por Dirección.** El 2026-10-15 se programó la propuesta «b» (parte 9, PR #158; F-128):
la pantalla está en `../carga/`. Cambiar el reparto es cambiar una tabla (`TARJETAS_DE_LA_CARGA`, en
`apps/web/src/app/pro/advisees/anthropometry/composicion-de-la-carga.ts`); mover un sitio, el dato de
`figura-de-lamina.ts`, que comparten la Lámina y el teléfono. La leyenda quedó abajo a la derecha, no a la izquierda
como en este dibujo: de ese lado sobra lugar.

La maqueta 23 (`EVIDENCIA/ESCRITORIO-AMABLE/diseno/maquetas/claro/23-cargar-una-toma.png`) dibuja la carga de una toma
con la mitad de «Perímetros». La otra mitad, «Pliegues», figura solo como un botón («Pliegues 0 de 11»). La definición
del paquete pide dibujarla y mostrarla antes de programar (parte 9; DEC-A14 del plan de Antropometría): es la mitad de
la pantalla.

## Qué hay acá

| Archivo | Qué es |
|---|---|
| `pliegues-propuesta-claro.png` y `pliegues-propuesta-azul-noche.png` | **La propuesta.** La misma pantalla de la maqueta 23, con «Pliegues» elegido |
| `alternativa-a-tronco-bajo-a-la-derecha.png` | La otra forma de repartir los campos que proponía el plan de implementación |
| `alternativa-c-todo-a-la-izquierda.png` | Todos los campos a la izquierda, como la lámina en modo Medición |

Las fuentes (HTML) están con las demás maquetas, fuera del repositorio: `BE-maquetas/planos-fuente/partes/30-cuerpo.html`.

## Lo que se dibujó, y por qué

- **Un pliegue es un punto, no un anillo.** Es el dibujo que ya usa la lámina (`figura-de-lamina.ts`, `DIBUJO_EN_MEDICION`).
- **Los once sitios están donde los guarda BE** (`figura-de-lamina.ts`, figura «mujer, cuerpo entero»): nueve vienen del
  compositor de Dirección; el bicipital y la cresta ilíaca los ubicó BE (DL-113) y **siguen pendientes de validación**.
  Ningún punto se movió para acomodar el dibujo.
- **Los once quedan del lado izquierdo de la imagen,** que es el lado derecho de la persona. Por eso los campos no se
  reparten mitad y mitad, como en Perímetros.
- **Con dato y sin dato se distinguen por la forma, no por el color,** igual que los anillos: con dato, el aro lleno y su
  centro; sin dato, el aro punteado y vacío.
- **Posterior** (tricipital y subescapular): el sitio está en la cara de atrás y la figura está de frente. El punto va
  en gris, su guía es punteada y el campo lo dice con la palabra «posterior», que es la de BE (`laminaPosterior`).
- **Dos pares casi coinciden de frente** (tricipital y bicipital; cresta ilíaca y supraespinal): están a la misma
  altura, en caras o líneas distintas. No se separan (regla de Dirección del 2 de octubre). Sus guías llegan casi al
  mismo punto, y la leyenda lo dice.
- **Los nombres son los cortos del dominio** (`nombreCortoDeMetrica`): «Tricipital», «Bicipital», «Muslo frontal»… El
  nombre completo («Pliegue tricipital») queda como nombre accesible del campo.
- **La figura no cambia de lugar** al pasar de Perímetros a Pliegues.

## Las tres formas de repartir los campos

| | A la izquierda | A la derecha | Guías que se cruzan | Lo que se ve |
|---|---|---|---|---|
| **Propuesta (b)** | Pectoral, axilar medio, tricipital, bicipital · antebrazo, cresta ilíaca, supraespinal · muslo frontal, pantorrilla | Subescapular y abdominal: los dos que están junto a la línea media | 0 | Dos guías pasan sobre medio tronco; las demás entran por el costado |
| Alternativa a (la del plan) | Las tarjetas del compositor, menos la del tronco bajo | Cresta ilíaca, supraespinal y abdominal | 1 | Tres guías cruzan el abdomen entero para llegar al borde opuesto del tronco |
| Alternativa c | Los once | Nada | 0 | Una pila de cuatro tarjetas y un abanico de guías largas; la leyenda queda sobre las piernas de la figura |

Elegí la **b**: es la que menos cuerpo tapa y no cruza ninguna guía.

## Lo que necesito que mires

1. **El reparto de los campos** (b, a o c).
2. **Cómo se dice un pliegue sin dato y uno posterior** (el aro punteado; el gris con la palabra «posterior»).
3. **La nota de los dos pares** en la leyenda: si se queda ahí o pasa a «Cómo se lee esta vista».
4. **Los dos sitios que ubicó BE** (bicipital y cresta ilíaca): siguen como en la lámina.
5. Lo que no está dibujado y sale de la maqueta 23 sin cambios: los datos de la toma, lo de fuera de la figura, los
   botones y la figura de hombre.

## Límites

- Es un dibujo: no hay pantalla, ni datos, ni comprobaciones.
- Solo la figura de mujer, de cuerpo entero. La de hombre usa los sitios de su propia figura, que BE ya tiene.
- Los valores son inventados.
