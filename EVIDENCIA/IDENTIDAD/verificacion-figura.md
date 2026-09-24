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

## Cambiar de protocolo con mediciones ya cargadas (ajuste posterior al cierre)

Al capturar en `test` apareció un caso que la verificación de arriba no cubría: un borrador guardado antes del tramo, con el protocolo de laboratorio y el perímetro de cintura cargado **fuera del protocolo**. Al pasar a «Pliegues y perímetros», la cintura seguía en la lista libre en vez de ir a su campo, la figura no la mostraba como cargada y dos títulos decían «Otras mediciones» (el grupo del protocolo y la carga libre). Revisándolo apareció un caso más fino: una medición en una unidad que el protocolo no declara —la cadera en mm, cuando el protocolo la pide en cm— se habría ubicado en el campo, que muestra «cm», con los mm escondidos detrás.

El ajuste: el reparto entre los campos del protocolo y lo de fuera es una sola regla del dominio (`repartirEnElProtocolo`), que usan tanto la apertura del borrador como el cambio de protocolo. Una medición va a su campo si el protocolo la declara **en esa unidad**, si tiene valor y si el campo sigue libre; si no, queda fuera del protocolo tal como está. Nada se descarta y la unidad nunca se convierte (B10-07 §17). Los títulos pasan a ser «Otras mediciones del protocolo» y «Fuera del protocolo», y los rótulos de la figura («De frente», «De espalda») bajan para no pisar los pies.

**Fecha:** 2026-09-24 · **Entorno:** API y website locales de la rama, el mismo PostgreSQL embebido · **Partida:** un borrador con el protocolo de laboratorio y dos mediciones fuera del protocolo: cintura 81 cm y cadera 950 mm.

| Paso | Resultado |
|---|---|
| Abrir «En preparación» | El borrador abre con el protocolo de laboratorio y las dos mediciones fuera del protocolo; los títulos son «Otras mediciones del protocolo» y «Fuera del protocolo» |
| Pasar a «Pliegues y perímetros» | La cintura va a su campo (81 cm), no queda repetida y su anillo se llena. La cadera en mm **se queda fuera del protocolo**, con su unidad, y su anillo sigue vacío |
| Volver al laboratorio | Las dos vuelven fuera del protocolo, sin pérdidas ni duplicados |
| Pasar otra vez a «Pliegues y perímetros» y guardar | Lo que se manda conserva cada unidad de origen: cintura 81 cm, cadera 950 mm |
| Reabrir el borrador guardado | La cintura en su campo; la cadera en mm, fuera del protocolo: al leer tampoco se esconde |
| Medir los rótulos de la figura | Quedan debajo de los pies, sin tocar la silueta |

12 comprobaciones, ninguna falla; sin errores de consola.

## Lo que lo sostiene en el código

- `packages/domain/src/figura-antropometrica.ts`: `puntosDeLaFigura` recibe el conjunto de claves con dato, no los valores; `repartirEnElProtocolo` decide qué va a cada campo y qué queda fuera del protocolo.
- `packages/domain/src/figura-antropometrica.test.ts`: un punto lleva solo su sitio, su nombre y si tiene dato; una medición va a su campo solo si el protocolo la declara en esa unidad, y el reparto no pierde nada.
- `scripts/contraste.test.cjs`: el contorno y los puntos de la figura, a 3:1 como mínimo.
