# WP-ANTROPOMETRIA-RESULTADOS · El resultado completo de cada método, encadenado y sin casilleros

> **El pedido de Dirección (25/11):** «Hoy en día hay que tildar casilleros para tener más de un resultado… no es
> práctico. Revisá la experiencia que le estamos dando a los profesionales en esa área». Su ejemplo: Jackson y Pollock de
> 7 pliegues entrega de una vez la suma, la densidad, el % de grasa (Siri o Brožek), la masa grasa y la libre de grasa y,
> en una evaluación completa, el fraccionamiento en cuatro componentes con Rocha y Würch.
>
> Rama `wp-antropometria-resultados`, desde `main` (859a2a0d). Registro: **DL-200** en `docs/DEUDA_LEGAJO.md`. Las
> decisiones de continuador (**AR-D01 a AR-D16**) están **a ratificar**. No se integra sola.

## 0. En criollo

El profesional elige el método, no cada resultado. Al elegir «Jackson y Pollock, 7 pliegues» antes de medir, la tarjeta
dice qué pide (7 pliegues, la edad y el peso) y qué va a dar (la suma, la densidad, el % de grasa con Siri y Brožek, la
masa grasa y la libre de grasa); con un toque suma el fraccionamiento en cuatro componentes, que pide la talla y los dos
diámetros de Rocha. La figura pide exactamente eso.

En la toma, arriba, el resumen: «% de grasa 12,0 % del peso corporal · masa grasa 9,3 kg · masa libre de grasa 67,7 kg ·
suma de 7 pliegues 82,0 mm», cada valor con su origen y su cambio desde la toma anterior («−1,1 puntos desde el 12 nov»).
Debajo, cada método en su desplegable, con todo lo que da en el orden en que se lee una evaluación: lo medido, la ecuación,
la conversión, las masas y el fraccionamiento. Cada valor dice de qué ecuación sale y tiene su «?» en la esquina con la
fórmula, la cuenta hecha con los números de la toma y la fuente. Lo que falta para un paso se dice en ese paso: «Para la
masa ósea (Rocha) faltan el diámetro biestiloideo (muñeca) y el diámetro bicondíleo del fémur (rodilla)». Las ecuaciones
por sexo y la conversión (Siri o Brožek) se eligen una vez, arriba, y los números cambian en su lugar.

Al registrar la toma, BE guarda en la historia lo que tiene método en el catálogo (la suma de 7 pliegues, el % de grasa con
Siri, la masa ósea de Rocha): eso entra en «Evolución», en la app de la persona y puede quedar como referencia. Lo demás
(la densidad, las masas de Jackson y Pollock, el fraccionamiento) se calcula en el momento, desde lo medido, con la misma
regla siempre.

## 1. Lo que encontré al revisar el área (con ojo de profesional)

| # | Dónde | Lo que no era práctico | Qué se hizo |
|---|---|---|---|
| H-01 | Tomas · resultados | Cada resultado era una corrida aparte: para tener la suma, el % de grasa y las masas había que abrir «Calcular con un método», elegir en una lista de 27 métodos, calcular, cerrar y repetir. | Cada método da todo lo suyo, sin tocar nada (AR-01). |
| H-02 | Preparar la toma · «Qué vas a calcular» | Se elegía por familia de métrica con casilleros: «Suma de 7 pliegues» y «Grasa corporal (Jackson y Pollock, 7 pliegues, Siri)» eran dos casilleros distintos, y no se veía qué iba a dar cada uno. | Se elige el método entero, con un botón, y cada uno dice qué pide y qué va a dar (AR-06). |
| H-03 | Tomas · resultados | La densidad no se veía nunca: estaba adentro de la regla del % de grasa. | Es un paso propio, con su ecuación y sus coeficientes (AR-01). |
| H-04 | Tomas · resultados | Las masas grasa y libre de grasa solo existían para Durnin y Womersley; con Jackson y Pollock había que hacer la cuenta a mano. | Todo método de % de grasa da sus masas, si hay peso (AR-01). |
| H-05 | Catálogo (DL-112) | Brožek, Jackson y Pollock de 3, Yuhasz-Carter, Faulkner, Würch y el modelo de cuatro componentes estaban retirados: no se podían ver ni con los datos medidos. | Se calculan en la toma con su regla publicada; no se rehabilitan en el catálogo (AR-D03). |
| H-06 | Tomas · resultados | El fraccionamiento en cuatro componentes solo existía con la grasa de Faulkner, de hombres. | La misma estrategia con la grasa del método elegido (AR-D05). |
| H-07 | Calcular con un método | El sexo se elegía al elegir la variante, método por método; la lista mostraba «…, hombres» y «…, mujeres» juntos. | Las ecuaciones de hombres o de mujeres se eligen una vez por toma (AR-D07). |
| H-08 | Tomas · Kerr | Kerr tenía su propio cuadro, aparte, que pedía calcular las cinco masas una por una. | Kerr es un método más, con sus cinco masas, la suma y la diferencia con la balanza (AR-01). |
| H-09 | Tomas · comparar | «Desde el inicio y desde la anterior» comparaba las mediciones, no los resultados. | Cada resultado dice su cambio desde la toma anterior, el % de grasa en puntos (AR-02). |
| H-10 | Registrar la toma | Registrar no calculaba nada: después había que calcular cada resultado. | Al registrar, BE guarda lo elegido que tiene método en el catálogo (AR-05). |
| H-11 | Toda el área | Doce acciones subrayadas («Reintentar», «Ver anteriores», «Quitar»…), contra la regla del 22/11. | Botones discretos; la guardia `scripts/acciones-y-ayudas.test.cjs` ahora cubre Antropometría (AR-D14). |
| H-12 | Tomas · resultados | Las corridas guardadas, anteriores y vigentes, ocupaban el primer lugar aunque lo que se viene a ver es el resultado. | Lo guardado va plegado al final, «Guardados en la historia (N)» (AR-D15). |

Lo que vi y **no** cambié (queda en §7): «Evolución», «Composición corporal» y la lámina siguen leyendo solo lo guardado (las
corridas); la edad se escribe en cada toma; el sexo de la ecuación no se guarda con la toma.

## 2. Alcance

| ID | Qué | Dónde |
|---|---|---|
| AR-01 | La cadena de derivaciones reutilizable del dominio: cada método da lo medido, la ecuación, la conversión, las masas y el fraccionamiento, cada paso con su origen, su fórmula, la cuenta con los números de la toma, su fuente, su regla versionada y lo que le falta. 20 métodos (§3). | `packages/domain/src/resultados-antropometricos.ts`; `formulas-antropometricas.ts` exporta sus piezas (`PIEZAS_ANTROPOMETRICAS`) sin cambiar ninguna regla |
| AR-02 | La pantalla de resultados de una toma: el resumen arriba, cada método en su desplegable, el cambio de cada valor desde la toma anterior | `resultados-por-metodo.tsx`, `calculos.tsx`, `evaluaciones.tsx`, `globals.css` |
| AR-03 | El «?» de cada paso en la esquina, con la fórmula, la cuenta resuelta (de la toma o, si falta un dato, de la persona de ejemplo de la ficha) y la fuente; lo que falta, dicho en el paso | `resultados-por-metodo.tsx`, `resultados-antropometricos.ts` (`textoDeLoQueFalta`, `cuentaDeEjemplo`) |
| AR-04 | Ecuaciones por sexo y conversión, una vez por toma (segmentos); Brožek siempre al lado | `resultados-por-metodo.tsx` (`ecuaciones=`, `conversion=` en la dirección) |
| AR-05 | Guardar en la historia lo que tiene método SELECCIONABLE en el catálogo: al registrar la toma, con lo elegido, y desde cada método con un botón | `guardar-en-la-historia.ts`, `preparacion.tsx`, `resultados-por-metodo.tsx` |
| AR-06 | «Qué vas a calcular» por método: qué pide, qué va a dar, el fraccionamiento con un toque; la figura pide exactamente lo del método | `eleccion-de-metodos.tsx`, `preparacion.tsx`, `metodos-de-la-toma.ts` (`medicionesPedidas`) |
| AR-07 | Las acciones del área sin subrayado y la guardia que lo cuida | los `.tsx` de `anthropometry/`, `scripts/acciones-y-ayudas.test.cjs` |
| AR-08 | El recorrido de navegador `resultadosAntropometricos` (TEST-AR-NAV-01) | `test/navegador/recorridos.mjs`, `preparar.mjs`, `LEEME.md` |

**Sin cambios de API ni de base:** no hay operación nueva, ni campo, ni migración; el OpenAPI no cambia. La cadena se calcula
en el website con las mediciones de la toma; lo que se guarda va por API-CAL-01, como antes.

## 3. Los métodos y sus cadenas

| Método | Lo medido | La ecuación | La conversión | Las masas | El fraccionamiento | Guarda en la historia |
|---|---|---|---|---|---|---|
| Jackson y Pollock, 7 pliegues (H: 1978; M: Jackson, Pollock y Ward 1980) | Σ7 | Densidad = a − b·S + c·S² − d·edad | Siri (Brožek al lado) | MG, MLG | 4C con Rocha y Würch | Σ7, % con Siri |
| Jackson y Pollock, 3 pliegues (por sexo) | Σ3 | Densidad | Siri / Brožek | MG, MLG | 4C | — (retirado, DL-112) |
| Durnin y Womersley, 4 pliegues | Σ4 | Densidad = c − m·log10(S), por franja de edad | Siri / Brožek | MG, MLG | 4C | % con Siri, MG y MLG con Siri |
| Yuhasz-Carter, 6 pliegues | Σ6 | % directo | — | MG, MLG | 4C | Σ6 (el % está retirado) |
| Faulkner, 4 pliegues (hombres) | Σ4 | % directo | — | MG, MLG | 4C de De Rose y Guimarães | — (retirado) |
| BAI · RFM · Deurenberg | — | % directo | — | MG, MLG | — | RFM (BAI y Deurenberg, retirados) |
| Suma de 6 y de 8 pliegues (ISAK) | Σ6 / Σ8 | — | — | — | — | Σ6 (Σ8, retirada) |
| Kerr (1988), cinco componentes | — | Piel (por sexo), adiposa, muscular, ósea, residual, cada una en % del peso estructurado | — | — | Peso estructurado y diferencia con el peso medido (kg y % del peso medido) | las cinco masas |
| Somatotipo de Heath y Carter | — | Endomorfia, mesomorfia, ectomorfia | — | — | X e Y de la somatocarta | los tres componentes |
| Lee (perímetros) · Lee (peso y talla) | — | MME, en kg y en % del peso | — | — | — | Lee perímetros (peso y talla, retirado) |
| Masa ósea (Rocha) · masa residual (Würch) | — | En kg y en % del peso | — | — | — | Rocha (Würch, retirado) |
| IMC · cintura/cadera · cintura/talla · conicidad | — | El índice | — | — | — | IMC, ICC, ICT (conicidad, retirada) |

Cada paso que tiene método en el catálogo usa **la misma regla publicada** (la prueba lo compara uno por uno); los demás
son derivaciones versionadas `be/derivacion/…@1`, con su fuente (la densidad de la tabla 4 de Jackson y Pollock, el modelo
de dos compartimentos, la somatocarta de Carter, la suma de Kerr).

## 4. Decisiones del continuador, a ratificar

| ID | Decisión | Por qué | Alternativa |
|---|---|---|---|
| AR-D01 | Se elige **el método entero** (20 métodos, en el orden del catálogo y, adentro, por nombre); ya no cada métrica. | Es como piensa el profesional: «mido Jackson y Pollock», no «mido la suma y después el %». | Mantener las familias de DL-190 con un «elegir todo». |
| AR-D02 | Lo que se ve en la toma se **calcula en el momento** desde lo medido, con reglas versionadas; **solo se guarda como corrida lo que tiene método seleccionable** en el catálogo. La densidad, las masas de Jackson y Pollock y el fraccionamiento con otra grasa no van a «Evolución» ni a la APK. | No hace falta API ni migración; la APK 0.32 no ve métricas nuevas; un método publicado no se edita. | Publicar como métodos nuevos (migración de solo agregar) la densidad y las masas de cada ecuación, para que entren en la evolución y en «Composición corporal». |
| AR-D03 | Lo que DL-112 retiró (Brožek, JP3, Yuhasz-Carter, Faulkner, BAI, Deurenberg, Würch, Lee con peso, 4C, conicidad, Σ8) **se calcula y se ve** en la toma con su regla publicada, pero **no se guarda**. | Elián los nombró en el pedido; rehabilitarlos es revertir una decisión de Dirección. | Republicarlos como versión nueva y seleccionable. |
| AR-D04 | Siri por omisión; Brožek siempre al lado del %; un toque («% de grasa con: Siri · Brožek») hace que mande Brožek, y las masas y el fraccionamiento lo siguen. Vale para toda la toma. | Siri es la que usaron los autores; Brožek se compara de un vistazo. | Las dos conversiones como dos pasos completos, sin elegir. |
| AR-D05 | El fraccionamiento en cuatro componentes usa **la grasa del método** (JP7, JP3, DW, Yuhasz-Carter) más Rocha, Würch y la muscular por diferencia, la estrategia de De Rose y Guimarães (1980), que la publicaron con Faulkner. Solo en métodos de pliegues (no BAI, RFM ni Deurenberg). | Es el pedido de Elián («la grasa de JP7 combinada con Rocha y Würch»). | Solo con Faulkner, como se publicó. |
| AR-D06 | El resumen es el del método pedido («Resumen con»), si no el elegido antes de medir, el guardado en la toma o, sin nada de eso, **el de grasa que usa más de lo medido** (con los 7 pliegues, el de 7, no el de 3). | Muestra lo que el profesional midió; no es una calificación de métodos (REG-06-205). | El primero del catálogo, siempre. |
| AR-D07 | Las ecuaciones de hombres o de mujeres se eligen una vez por toma; vienen de la figura con que se registró la toma, de los resultados guardados por sexo o, si no hay nada, Hombres con la nota «Elegí las de la persona: la toma no lo guarda». | El sexo no es un dato de la toma (DL-111, decisión 5). | Guardar el sexo de la ecuación con la toma: cambia DL-111 y pide un campo nuevo. |
| AR-D08 | Al registrar, BE guarda en la historia lo que lo elegido da y tiene método en el catálogo; el cuadro de confirmación lo dice. Si algo falla, la toma queda registrada igual y el aviso lo dice. | Registrar y después calcular uno por uno era el paso de más (H-10). | Guardar solo a pedido. |
| AR-D09 | Kerr: cada masa también en % del peso estructurado; en las masas y el fraccionamiento de 4C, en % del peso corporal. | Así se lee cada modelo; todo % dice su base. | Solo kg. |
| AR-D10 | El somatotipo suma su punto en la somatocarta (X = III − I, Y = 2·II − (I + III)), con los componentes al décimo, como el manual. | Es lo que se dibuja; ya estaban los tres componentes. | Sin la somatocarta. |
| AR-D11 | El «?» de cada paso muestra la cuenta con los números de la toma; si falta un dato, un ejemplo resuelto con la persona de prueba de la ficha (H1 o M2), dicho así. | El ejemplo resuelto siempre está, y nunca se confunde con la toma. | Solo la fórmula. |
| AR-D12 | En los resultados aparecen los métodos que dan su primer resultado (Kerr, las cinco masas; el somatotipo, los tres componentes), más los elegidos y los guardados, aunque les falte algo. | Lo demás sería ruido; lo elegido nunca se esconde. | Todos los métodos, siempre. |
| AR-D13 | El cambio de cada valor es contra la toma registrada anterior, con las mismas ecuaciones y la misma conversión; el % en puntos. | Es la comparación que se hace en el consultorio. | Contra la primera toma también. |
| AR-D14 | Las acciones subrayadas del área pasan a botones discretos y la guardia de acciones y ayudas cubre `advisees/anthropometry`. | Regla de Dirección del 22/11. | — |
| AR-D15 | «Nuevo cálculo» queda para calcular un método puntual del catálogo; lo guardado va plegado al final. | No se pierde nada de DL-111. | Sacarlo. |
| AR-D16 | Una dirección guardada con las familias de DL-190 (`metodos=grasa-jackson-pollock-7`) se lee como el método que las da. | Un enlace viejo no se rompe. | — |

## 5. Compatibilidad

- **La APK 0.32** sigue leyendo «Mi evolución» igual: la API no cambió y lo que se guarda son corridas de métodos que ya
  existían.
- **API:** sin cambios; el OpenAPI no se regenera porque no cambió.
- **Catálogo:** ninguna regla publicada cambió; `formulas-antropometricas.ts` solo exporta sus piezas. `scripts/catalogo-antropometrico/` no se tocó.

## 6. Pruebas

**Dominio** (`resultados-antropometricos.test.ts`, 14 pruebas):

| ID | Qué |
|---|---|
| TEST-AR-01 | JP7 de una vez: Σ7, densidad (MA-13: 1,0783 / 1,0579 / 1,0391 g/cm³), % con Siri y Brožek (MA-19, MA-20, MA-23, MA-24), MG y MLG (MA-34, MA-35); el resumen y la cuenta del «?» |
| TEST-AR-02 | Cada paso con método en el catálogo da lo mismo que su regla publicada (JP7, JP3, DW, Faulkner, ISAK) |
| TEST-AR-03 | Cuatro componentes con la grasa de JP7 (suman el peso); con Faulkner, los casos de MA-53 (34,3 / 40,0 / 39,1 kg); Würch por sexo |
| TEST-AR-04 | Lo que falta se dice en su paso, con nombre; un cero y Faulkner en mujeres dicen por qué |
| TEST-AR-05 | Durnin y Womersley con los ejemplos **publicados** de la tabla 9 (19,2 / 29,0 / 33,2 / 25,5 %), la franja de edad, Siri y Brožek |
| TEST-AR-06 | ISAK (Σ6 y Σ8), Yuhasz-Carter, Faulkner, RFM, BAI y Deurenberg |
| TEST-AR-07 | Kerr con el **Phantom** de Ross y Wilson (adiposa 25,6, muscular 24,5, residual 6,1 kg), el peso estructurado y la diferencia |
| TEST-AR-08 | Somatotipo con el sujeto 573 **publicado** en el manual de Carter (1,6 - 5,4 - 3,2) y la somatocarta |
| TEST-AR-09 | Lee, Rocha e índices |
| TEST-AR-10 | Antes de medir: lo que pide cada método, lo que va a dar y la dirección vieja |
| TEST-AR-11 | Los valores de la toma sin convertir en silencio y los métodos que dan algo, en el orden del catálogo |
| TEST-AR-12 | El cambio de cada valor (el % en puntos) |
| TEST-AR-13 | Las palabras no califican |
| TEST-AR-14 | Lo que pide en palabras y el ejemplo resuelto del «?» |

Jackson y Pollock no publican ejemplos resueltos en el original: sus casos son los de la ficha (calculados con la cuenta a
la vista y verificados con una segunda implementación). Durnin y Womersley, Heath y Carter y Kerr sí se prueban contra lo
publicado.

**Website** (`apps/web/test/antropometria-resultados.test.mjs`, TEST-AR-WEB-01 a 08, y la de DL-190 actualizada): sin
casilleros, el resumen y los desplegables, el «?» en la esquina con su ejemplo, los segmentos, guardar en la historia al
registrar y desde la toma, «Qué vas a calcular» por método, sin acciones subrayadas y los colores con tokens.

**Navegador:** `resultadosAntropometricos` (TEST-AR-NAV-01): elegir JP7 antes de medir (qué pide, qué da, la figura con
sus 7 pliegues y el fraccionamiento), la toma con todo a la vista sin tildar nada, Brožek sin mover los renglones, el «?»
de la densidad y guardar en la historia, con la API. Capturas en Claro y Azul noche.

## 7. Lo que queda

- **Ratificar AR-D01 a AR-D16.** Las que más cambian algo de antes: AR-D02 (qué se guarda), AR-D03 (los retirados se ven) y
  AR-D05 (el fraccionamiento con otra grasa).
- **«Evolución», «Composición corporal» y la lámina** siguen leyendo solo lo guardado: una toma con JP7 muestra ahí la suma
  y el %, no la densidad ni las masas. Si Dirección quiere verlas en la evolución, el camino es AR-D02, alternativa
  (publicar los métodos nuevos con una migración de solo agregar, con su prueba de la APK).
- **El sexo de la ecuación** se elige por toma; guardarlo con la toma pide revisar DL-111, decisión 5.
- **La edad** se escribe en cada toma; podría salir de la fecha de nacimiento, si el perfil la tiene.
- **Mirarlo en pantalla con Dirección** (1920 × 1080 y 1440), con una toma real con Jackson y Pollock.
