# WP-NUTRICION-COMPARACION · Objetivo, indicado y registrado en un mismo gráfico

**Estado:** definido e implementado el 2026-10-25 (encargo de Dirección, etapa C) en la rama
`wp-nutricion-comparacion`, sin integrar ni desplegar. Retoma la propuesta C de `docs/propuestas/AMPLIACIONES_2026-10-19.md` (#193), solo en el
website y solo en Nutrición. DEUDA_LEGAJO DL-158.

## 0. En criollo

En «Analizar», el gráfico de una métrica de Nutrición (calorías, proteínas, carbohidratos, grasas o fibra) muestra tres
cosas distintas, con su nombre y una forma propia cada una:
- **Registrado** (línea continua con puntos): lo que la persona registró, como hoy.
- **Objetivo del profesional** (línea discontinua): lo que fijó el objetivo, un escalón por versión. Hoy solo estaba para
  las calorías; ahora también para los macros en gramos.
- **Indicado en el plan** (rombos huecos): lo que el plan indicaba ese día, **solo cuando el plan no deja elegir** (cada
  comida con una sola opción). Si hay alternativas, no se inventa un número: se dice por qué no hay indicado del día.
  Por comida registrada, la lectura dice lo indicado de la opción que se eligió, al lado de lo registrado.

No es un puntaje ni una adherencia, no hay porcentajes ni colores de «bien» o «mal», y que dos líneas se acerquen no
dice que una cause la otra. **No prueba consumo**: lo registrado es lo que se registró, no lo que se comió. Con
alternativas en el plan no existe un único total diario indicado: la pantalla dice por qué y el detalle disponible (lo
indicado de la opción registrada en cada comida) se consulta en «Ver origen».

## 1. Decisiones (ratificadas por Dirección el 2026-10-25)

- **C-D1 · opción A:** por comida registrada, y por día solo cuando la regla determina lo indicado.
- **C-D2:** «Indicado en el plan» se llama distinto de «Objetivo del profesional».

## 2. Reglas de los datos

1. **Instantáneas históricas.** Lo indicado sale de la instantánea de la versión del plan: la que regía ese día, para el
   día; la que cita el registro, para una comida. Si el plan cambia después, lo indicado de ayer no cambia.
2. **El día tiene indicado solo si** rige una sola versión ese día, se conoce el día tipo (el plan tiene uno solo, o los
   registros del día dicen cuál) y **cada comida de ese día tipo tiene una sola opción**. Es la suma exacta de lo indicado
   de esas opciones, con las composiciones congeladas (`calcularNutrientes`).
3. **Sin indicado del día, se dice por qué:** sin plan vigente; cambió la versión del plan ese día; el plan tiene más de un
   día tipo y no se sabe cuál; una comida tiene varias opciones («Almuerzo: 3 opciones»); a un ingrediente le falta el
   dato del nutriente. **Las alternativas nunca se suman ni se promedian.**
4. **Por comida registrada:** una opción del plan tiene lo indicado de esa opción; **una comida diferente no es una opción
   del plan** y no tiene indicado. Un registro sin cantidades no da número registrado, aunque su opción tenga indicado.
5. **El objetivo:** el requerimiento energético (kcal/día) y los macros **en gramos por día**. Un macro expresado como
   proporción de las calorías se dice en texto y **no se dibuja ni se convierte**. La fibra no tiene objetivo.
6. **Lo registrado sigue con sus reglas** (DL-153 y anteriores): un hueco no es cero y no se une; un subtotal es un punto
   hueco; el día en curso va suelto; los anulados no cuentan.
7. **Valores absolutos primero.** Nada se expresa como porcentaje de otra cosa; no hay restas presentadas como
   desempeño. Sin «cumplimiento», «adherencia», puntaje ni clasificación (B05; T13).
8. **Coincidencia temporal: no indica causa** (al pie, como en las demás preguntas).

## 3. Casos que se prueban

| Caso | Indicado del día | Por comida |
|---|---|---|
| Una opción por comida | La suma de las opciones | Lo de su opción |
| Varias opciones en alguna comida | Sin indicado, con la comida y cuántas opciones | Lo de la opción elegida |
| Día parcial (falta una comida) | El del día igual (lo indica el plan) | Las registradas, con su indicado |
| Comida diferente | El del día igual | Sin indicado: no es una opción del plan |
| Día sin registros | El del plan, si se determina (el registrado es un hueco) | — |
| Cambio de versión ese día | Sin indicado: cambió la versión | Cada comida, con su versión |
| Día en curso | El del plan | Las registradas hasta ahora |
| Varios días tipo sin registros que digan cuál | Sin indicado | — |

## 4. Contrato (API-PRJ-01, solo campos aditivos)

En `NUTRITION_PRESCRIBED_VS_RECORDED.prescribed`:
- `objectiveSteps`: un escalón por versión del objetivo vigente en el período, para la métrica: `amount` (kcal/día o
  g/día) o `energyShare` (la proporción, que no se dibuja). La energía repite `energyRequirement`, que queda igual.
- `planned.days`: cada día del período **hasta hoy** (el día en curso incluido; un día futuro todavía no tiene la versión
  que va a regir) con `state` `DETERMINED` (`value`, versión y día tipo) o `UNDETERMINED` (`reason` y, si es por
  opciones, `mealsWithSeveralOptions`). Llega igual con la vista por semana: la pantalla no lo dibuja.
- `planned.meals`: cada registro del período con `value` o `reason` (`DIFFERENT_MEAL`, `OPTION_NOT_FOUND`,
  `NUTRIENT_DATA_MISSING`).

Ninguna APK lee PRJ-01 (DL-152 no cambia). Una pestaña del website abierta antes del despliegue puede ver «respuesta no
reconocida» hasta recargar. `RECORDS` no tiene objetivo ni indicado.

## 5. Pantalla (website, Analizar)

- **Tres capas por panel**, con el mismo eje temporal y los paneles sincronizados de siempre (hasta tres métricas). Se
  distinguen por el trazo y la forma además del color, y el encabezado de cada panel tiene su leyenda con las tres
  muestras. En «Juntas» y en «Cambio relativo» se dibuja solo lo registrado, como hoy.
- **Lectura** (el detalle de un día elegido, sin depender del puntero): la fecha; lo registrado con su calidad y su
  cobertura; el objetivo con su versión; lo indicado con la versión y el día tipo, o por qué no hay; y la regla.
- **Origen del dato:** cada comida del día con lo registrado y lo indicado de su opción, o por qué no tiene.
- **Tabla y exportación:** las columnas «Objetivo del profesional» e «Indicado en el plan», con el mismo texto cuando no
  hay número. Lo que el gráfico dibuja está en la tabla, y viceversa.
- **«Cómo se lee»:** las tres capas, la regla del indicado y que no se suman alternativas.
- Por semana, lo indicado no se dibuja (es por día): la lectura y la tabla lo dicen.
- Si ningún día del rango tiene un indicado del día (un plan con alternativas), no hay rombos y debajo del gráfico se dice
  por qué (el motivo más frecuente) y que lo de cada comida está en «Ver origen».

## 5 bis. Decisiones de implementación (a ratificar)

- **I-1 · Redondeo.** Lo indicado se muestra con el redondeo de lo registrado (`nutrienteParaMostrar`: kcal enteras,
  gramos con un decimal, HALF_UP sobre el exacto), para que se lean lado a lado. El objetivo, como lo escribió el
  profesional, igual que en la tira del objetivo.
- **I-2 · El día del cierre del seguimiento** (sin sucesora) sigue la regla del contraste: sin registros, «no regía ningún
  plan» al terminar el día; con registros, el de la versión que citan.
- **I-3 · Un plan con alternativas en casi todas las comidas** casi nunca tiene un indicado del día. Es la regla de C-D1:
  lo útil, en ese caso, es lo de cada comida, que está en «Ver origen». Si la prueba con profesionales pide más, la
  alternativa es mostrar lo indicado por comida también en la lectura del día (sin sumar).

## 6. Pruebas

- **Dominio:** cada caso de §3, que nada suma alternativas, el registro sin cantidades sin número, la comida diferente
  sin indicado y el valor exacto (comprobado a mano, independiente del código).
- **Integración (PRJ-01):** los escalones de los macros con sus fechas; lo indicado igual después de cambiar el plan; la
  forma del contrato (TEST-CT). Y el cruce con Administración (#210, del que depende este paquete desde la pasada de
  cierre del 2026-10-25): con Nutrición suspendida no hay ninguna de las tres capas; al rehabilitar vuelven iguales y lo
  guardado no cambia.
- **Navegador:** las tres capas, un hueco que no se une, la lectura y la tabla con los mismos valores, en Claro y Azul
  noche, con capturas.

## 7. Fuera del paquete

Entrenamiento (objetivos por serie y bandas de repeticiones), objetivos por tipo de día (PF-04, propuesta B), bandas de
macros, la APK, rangos normativos y cualquier conversión de proporciones a gramos.
