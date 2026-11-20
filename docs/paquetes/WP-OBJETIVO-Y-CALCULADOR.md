# WP-OBJETIVO-Y-CALCULADOR · El objetivo con una toma de referencia y el calculador de macros

> **El pedido de Dirección (19/11), textual:** «En el objetivo: vincularlo a una toma de antropometría de referencia;
> conectarlo con un calculador de macros, que estime el gasto con su método a la vista y proponga los rangos por día y por
> comida. Ojo, que una cosa es que desarrolles cálculo de macros, que uses los datos de la antropometría, y otra es que a
> las comidas (almuerzo, merienda, cena, etc.) se le pueda poner un rango de macros de referencia para saber que esa receta
> cumple con esos rangos aproximados.»
>
> Rama `wp-objetivo-y-calculador`, desde `main` (24f91c1e). Registro: **DL-186** en `docs/DEUDA_LEGAJO.md`. Las decisiones
> de continuador (**OBC-D01 a OBC-D17**) están **a ratificar**. No se integra sola.

## 0. En criollo

Son dos cosas, y quedan separadas en la pantalla y en el modelo:

1. **El cálculo de macros, en el objetivo.** Al escribir una versión nueva del objetivo, la profesional abre «Calcular con
   la antropometría»: elige una toma de Antropometría de la persona (si se la habilitó) o escribe los datos a mano; elige el
   método del gasto en reposo y ve su fórmula con letras, la misma con los números de la toma, de dónde salió cada dato y
   la cita; elige el factor de actividad (y, si quiere, otro para el día de descanso) y el ajuste; escribe la proteína y la
   grasa en g/kg y los carbohidratos salen por diferencia. «Usar estos valores» lleva las kcal, los gramos y la declaración
   del método al objetivo, que ella revisa y guarda con su fundamento. El objetivo queda vinculado a la toma, con los
   valores de ese momento: si llega una toma nueva, se avisa y no se recalcula nada solo.
2. **El rango de referencia de cada comida, en el plan.** Ya existía (NUP-04 a 06): cada comida puede tener su rango, y
   cada receta u opción se ubica frente a él («dentro del rango», «12 g por encima del rango»). Lo nuevo es un puente: en el
   editor, «Proponer rangos desde el cálculo del objetivo» reparte los gramos del día entre las comidas como elija la
   profesional (por omisión, más carbohidratos en el desayuno y el almuerzo y la merienda con más proteína y grasa), y con
   un botón los guarda como rangos del plan. Nunca pisa un rango ya escrito sin una casilla aparte.

Todo es una estimación, y se dice sin alarmismo. Ubica, no califica.

## 1. Alcance (OBC-01 a OBC-10)

| ID | Qué | Dónde |
|---|---|---|
| OBC-01 | Este paquete y DL-186 | `docs/paquetes/WP-OBJETIVO-Y-CALCULADOR.md`, `docs/DEUDA_LEGAJO.md` |
| OBC-02 | La toma de referencia, con la frontera de permisos: **API-OBC-01** lista las tomas registradas del profesional con su peso, talla, edad y las corridas de las que sale la masa libre de grasa, solo con el PDP de Antropometría; sin permiso, ninguna (ni valores ni existencia), y la decisión denegada queda registrada | `apps/api/src/nutricion/objetivo-y-calculador.service.ts` y `.controller.ts`, `packages/domain/src/contratos-objetivo-y-calculador.ts` |
| OBC-03 | El calculador en «Nueva versión de objetivo», abierto a pedido, con «Usar estos valores en el objetivo» | `apps/web/src/app/pro/advisees/nutrition/calculador.tsx`, `calculador-del-objetivo.ts`, `formularios.tsx` |
| OBC-04 | El gasto en reposo con su método a la vista: Mifflin-St Jeor (1990), Harris-Benedict revisada (Roza y Shizgal, 1984), FAO/OMS/UNU (1985), Katch-McArdle y Cunningham (1980), cada uno con su fórmula, los datos que usa, su población y su cita. Si falta un dato, lo dice; fuera de la población de la ecuación, lo dice | `packages/domain/src/calculador-de-macros.ts` |
| OBC-05 | El gasto total (factor de actividad, con otro para el día de descanso), el ajuste que escribe el profesional, y los macros: proteína y grasa en g/kg del peso o de la masa libre de grasa, carbohidratos por diferencia; g, g/kg, kcal y la parte de la energía con su base y su número | `calculador-de-macros.ts`, `calculador.tsx` |
| OBC-06 | Guardar el objetivo con su referencia y su cálculo en una sola transacción (**API-OBC-02**), rehecho en el servidor con la misma función; leerlo (**API-OBC-03**) con el aviso de una toma más nueva o de un dato corregido o anulado; con el acceso revocado, la toma, los datos y el resultado se retienen | `objetivo-y-calculador.service.ts`, `referencia-del-objetivo.tsx`, `resumen.tsx`, migración `20261120160000_calculo_del_objetivo` |
| OBC-07 | La propuesta de rangos por día tipo y por comida, con el reparto que elige el profesional («Repartir parejo», «Sugerido por el nombre de cada comida»), el margen y, si el cálculo los tiene, el día de entrenamiento o el de descanso; se guarda por API-PLN-03 | `propuesta-de-rangos.ts`, `propuesta-de-rangos-del-plan.tsx`, `editor.tsx` (el panel y el asistente) |
| OBC-08 | La propuesta nunca pisa un rango escrito sin confirmar: por omisión completa lo que falta; la casilla «Reemplazar también…» dice qué se reemplaza y qué se conserva | `propuesta-de-rangos.ts` |
| OBC-09 | Lo que ya existía, verificado de punta a punta: el rango de cada comida y cada receta u opción ubicada frente a él (NUP-04 a 06) | capturas 07 y 08 |
| OBC-10 | Las pruebas (dominio, website, integración con la frontera de permisos, contrato) y las capturas en la CI a 1920, 1440 y 1280 | `calculador-de-macros.test.ts`, `apps/web/test/objetivo-y-calculador.test.mjs`, `test/integration/objetivo-y-calculador.int-spec.ts`, `contrato.int-spec.ts`, `EVIDENCIA/OBJETIVO-Y-CALCULADOR/herramientas/capturas.mjs` |

**Fuera de este paquete:** la APK (la persona no ve el calculador, y lo que lee no cambia); la evaluación inicial (la toca
WP-EVALUACION-Y-FORMULARIOS, DL-185); vincular el factor de actividad con la agenda de entrenamiento de la persona.

## 2. Las operaciones nuevas (familia OBC, DL-186)

| ID | Método y ruta | Qué |
|---|---|---|
| API-OBC-01 | `GET /advisees/{adviseeId}/nutrition/objective-reference/measurements` | Las tomas que se pueden usar de referencia (hasta 12, de la más nueva a la más vieja) y si Antropometría está habilitada |
| API-OBC-02 | `POST /advisees/{adviseeId}/nutrition/objectives/with-reference` | Una versión nueva del objetivo (como API-NUT-04) con su referencia y, si se usó, su cálculo, en una transacción. Idempotente |
| API-OBC-03 | `GET /nutrition/objective-versions/{versionId}/reference` | Lo guardado con una versión del objetivo, tal cual, y cómo está hoy la toma |

API-NUT-04 no cambia: el objetivo escrito sin el calculador se guarda como siempre. Una tabla nueva,
`calculo_del_objetivo_nutricional` (una fila por versión, append-only con sus disparadores), es la única migración.

## 3. Las cuentas (con sus fuentes)

- **Mifflin-St Jeor (1990):** 10 × peso + 6,25 × talla − 5 × edad + 5 (hombres) o − 161 (mujeres). Mifflin MD y col., Am J
  Clin Nutr 1990;51(2):241-247.
- **Harris-Benedict revisada:** hombres 88,362 + 13,397 × peso + 4,799 × talla − 5,677 × edad; mujeres 447,593 + 9,247 ×
  peso + 3,098 × talla − 4,330 × edad. Roza AM, Shizgal HM, Am J Clin Nutr 1984;40(1):168-182.
- **FAO/OMS/UNU (1985), Schofield por peso:** hombres 15,3 × peso + 679 (18 a 29), 11,6 × peso + 879 (30 a 59), 13,5 × peso
  + 487 (60 o más); mujeres 14,7 × peso + 496, 8,7 × peso + 829 y 10,5 × peso + 596. WHO TRS 724, 1985.
- **Katch-McArdle:** 370 + 21,6 × masa libre de grasa. **Cunningham (1980):** 500 + 22 × masa libre de grasa. Am J Clin Nutr
  1980;33(11):2372-2374.
- **Factor de actividad:** los niveles de la FAO/OMS/UNU (2004): 1,40 a 1,69, 1,70 a 1,99 y 2,00 a 2,40.
- **Macros:** proteína y grasa = g/kg × kilos de la base, al gramo; carbohidratos = (energía − 4 × proteína − 9 × grasa) / 4;
  la parte de la energía, con su base («28,3 % de las 1.725 kcal»).

Ejemplo de las pruebas (mujer de 68 kg, 162 cm y 45 años, factor 1,55, −300 kcal, 1,8 y 0,9 g/kg del peso): 1.306,5 kcal
en reposo; 2.025 kcal de gasto total; 1.725 kcal con el ajuste; 122 g de proteínas, 172 g de carbohidratos y 61 g de grasas.

## 4. Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| OBC-D01 | La referencia y el cálculo se guardan con la versión del objetivo (una fila por versión, append-only), escritos en la misma transacción por una operación nueva; API-NUT-04 no cambia | Lo nuevo va en operaciones nuevas (DL-137). Alternativa: un campo opcional en API-NUT-04 |
| OBC-D02 | Sin Antropometría, la lista dice `anthropometryEnabled: false` y no devuelve ninguna toma (como API-PLN-02 dice `enabled`); pedir una toma devuelve el mismo 422 `MEASUREMENT_NOT_AVAILABLE` para «sin permiso», «no existe» y «es de otro»; la versión de objetivo ajena o inexistente, el mismo 404 | Lo que la profesional ya sabe (qué áreas le habilitó la persona) no es una fuga; ni valores ni existencia salen. Alternativa: 404 para la lista |
| OBC-D03 | Con el acceso revocado después, se retienen la toma, los datos, los parámetros y el resultado (de los g/kg y los gramos se deduce el peso); queda el método y lo que el objetivo guardó | Como `bodyWeightWithheld` de los rangos |
| OBC-D04 | El sexo de la ecuación lo elige el profesional: no es un dato de la toma | Como en el catálogo antropométrico (DL-111) |
| OBC-D05 | Cinco métodos (los del pedido y FAO/OMS/UNU 1985 por peso); las ecuaciones de adultos no se aplican antes de los 18 años | BE es para mayores de edad. Se pueden sumar Owen u Oxford (Henry, 2005) con su ficha |
| OBC-D06 | El factor de actividad se elige de las franjas de la FAO/OMS/UNU (2004) o se escribe (1,0 a 2,5); uno para el día y, a pedido, otro para el día de descanso. No se cruza con la agenda de entrenamiento: en la propuesta, el profesional elige qué día usa cada día tipo | Cruzarlo con la agenda es un paso aparte |
| OBC-D07 | El ajuste, en kcal (−1.500 a +1.500) o en porcentaje del gasto total (−40 a +40), igual para los dos días | — |
| OBC-D08 | Los macros al gramo; si la proteína y la grasa pasan la energía del día, los carbohidratos quedan en 0 g y se avisa | No se inventa un número negativo |
| OBC-D09 | La masa libre de grasa de la toma sale de una corrida vigente en kg o del % de grasa de una corrida con el peso de la toma (peso × (1 − %G/100), al décimo); el profesional elige cuál, y se ve | Las corridas son de la toma (REG-06-205: varias coexisten, ninguna gana sola) |
| OBC-D10 | Lo que la toma no tiene (talla, edad) se puede escribir a mano y queda marcado «a mano»; el peso, no: sin peso, la referencia es a mano | Un peso a mano en una toma confundiría la referencia |
| OBC-D11 | «Usar estos valores» llena las kcal y los gramos del día (el de entrenamiento, si hay dos) y la declaración del método; el profesional los puede cambiar. El objetivo guarda lo que él escribió; el cálculo, lo calculado | El objetivo sigue siendo su decisión (REG-06-123) |
| OBC-D12 | La propuesta usa el cálculo guardado con el objetivo vigente; si no tiene macros, los gramos por día del objetivo. Margen ±10 por omisión (0 a 50); reparto sugerido por el nombre de cada comida (pesos fijos, a la vista en el código) o parejo; se guarda en gramos, sin marca de que salió de la propuesta | API-PLN-03 no cambia. Alternativa: anotar en los rangos que salieron del cálculo |
| OBC-D13 | La propuesta completa solo lo que no tiene rango; reemplazar es una casilla aparte con la lista de lo que se reemplaza | «Nunca pisa rangos ya escritos sin confirmar» |
| OBC-D14 | Las tomas son las del propio profesional (como API-ANT-06); las de otro profesional de Antropometría no se ofrecen | Para eso está el resumen compartido (DL-163 D-13, DL-176) |
| OBC-D15 | El texto «BE no calcula requerimientos» del objetivo pasa a «El calculador da una estimación de partida: lo que se guarda es lo que escribís vos» | B05:312-318 («sin botón de Calcular») queda enmendado por el pedido de Dirección |
| OBC-D16 | El calculador es para el profesional: la persona no lo ve, `ObjetivoParaAsesorado` no cambia y la APK tampoco | — |
| OBC-D17 | Las capturas, en un trabajo más de `capturas-de-la-planificacion`, a 1920, 1440 y 1280 en Claro y a 1440 en Azul noche | — |

## 5. Lo que queda

- Ratificar OBC-D01 a OBC-D17.
- La exportación de los datos de la persona (derechos del titular) todavía no suma el cálculo del objetivo.
- Probar con un lector de pantalla el calculador y la tabla del reparto.
- Si Dirección lo pide: cruzar el factor con la agenda de entrenamiento, más métodos, y anotar en los rangos que salieron
  de la propuesta.
