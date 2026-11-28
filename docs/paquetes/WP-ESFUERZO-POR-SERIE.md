# WP-ESFUERZO-POR-SERIE · «Pedir el esfuerzo de cada serie»

> **La decisión de Dirección (26/11):** una casilla nueva en «Configurar plan», al lado de la del esfuerzo de la sesión,
> **«Pedir el esfuerzo de cada serie»**, apagada por defecto. Encendida, la app muestra el campo del esfuerzo en cada serie
> efectiva, como hasta ahora; apagada, no lo muestra: menos campos para quien no lo usa. Las aproximaciones nunca lo
> piden. Lo ya registrado se sigue viendo en la historia y en la corrección. Las plantillas y «Duplicar» copian el valor.
> En Registros, si el plan no lo pide, no quedan columnas vacías de esfuerzo.
>
> Rama `entrenamiento/esfuerzo-por-serie`, desde `main` (3d3b7e06). Registro: **DL-202** en `docs/DEUDA_LEGAJO.md`. Las
> decisiones de continuador (**EP-D01 a EP-D09**) están **a ratificar**. La app cambia en el código; la APK no se
> construyó ni se publicó. No se integra sola.

## 0. En criollo

En «Configurar plan», debajo de «Pedir el esfuerzo de la sesión al terminar», está «Pedir el esfuerzo de cada serie», con
su explicación en la notación que se está eligiendo: «La app le pregunta a la persona el RPE de cada serie efectiva, no de
las aproximaciones.» (o «el RIR», si el plan va en RIR). Un plan nuevo la tiene apagada.

Apagada, la tabla de la sesión de la app tiene una columna menos (Serie · kg · Rep. · Tiempo), la tarjeta de cada serie no
tiene el campo, «Ya la hice» tampoco, y la ayuda de la tabla no explica el RIR. Lo que se registra va sin esfuerzo: tildar
«como el plan» ya no copia el RIR indicado, porque nadie se lo preguntó a la persona. Encendida, todo es como hasta hoy,
salvo las aproximaciones: su celda del esfuerzo queda vacía, sin campo.

Un plan de antes no tiene la opción escrita. Para no sacarle el campo a quien ya lo usa, BE mira lo registrado: si la
persona ya declaró el esfuerzo de alguna serie efectiva de ese plan, la opción está encendida; si no, apagada. La casilla
lo muestra así, con una aclaración («Encendida porque la persona ya registró el esfuerzo de sus series en este plan.»), y
queda escrito cuando el profesional la toca.

En Registros, una versión que no pide el esfuerzo no dice «RIR: sin dato» en cada serie ni cuenta «con un dato sin
registrar», y la comparación por serie no ofrece «RIR» si nadie lo registró. Lo que sí se registró se sigue mostrando y
comparando.

## 1. Lo que hace

| # | Dónde | Qué |
|---|---|---|
| EP-01 | Dominio · `esfuerzo-de-cada-serie.ts` | Los textos (`COPY_ESFUERZO_DE_CADA_SERIE`), qué es declarar un esfuerzo (`declaroElEsfuerzo`, `hayEsfuerzoDeclarado`), cómo se resuelve la opción de un plan (`pideElEsfuerzoDeCadaSerie`) y qué serie muestra el campo en la app (`seMuestraElEsfuerzoDeLaSerie`). |
| EP-02 | Contrato | `planning.askSetEffort` (opcional, `true` o `false`) en la planificación; `askSetEffort` resuelto en API-SER-01 (el plan, para el profesional) y en API-SER-02 (la sesión, para la app que declara `training-set-effort-1`). La poda, las plantillas propias y las de BE lo copian si está escrito. |
| EP-03 | API · `lectura-por-serie.ts` | `pideElEsfuerzoDeCadaSerieDelPlan`: lo escrito manda; ausente, lee las ejecuciones de la persona en ese plan (con sus correcciones) y busca un esfuerzo declarado. Con el valor escrito no lee nada. |
| EP-04 | Website · «Configurar plan» | La casilla, en el bloque del esfuerzo de la sesión, apagada por defecto, con el texto en la notación elegida; un plan de antes la muestra como la resolvió la API, con su aclaración fija. |
| EP-05 | Website · Registros | Las versiones con `askSetEffort: false` no cuentan un RIR sin registrar como dato que falta, y la comparación por serie no abre la medida del RIR solo por el RIR indicado. |
| EP-06 | App · la sesión | La tabla y las tarjetas sin el campo del esfuerzo apagada; la aproximación sin campo siempre; la casilla, «Terminar serie», «Antes de finalizar» y «Ya la hice» registran sin esfuerzo lo que no lo muestra. La sesión guardada en el teléfono recuerda la opción. |
| EP-07 | App · la corrección | Apagada, un ejercicio sin ningún esfuerzo registrado no tiene el campo; uno con alguno lo sigue mostrando y no lo pierde. |

## 2. Las decisiones a ratificar

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| EP-D01 | La opción vive en la planificación (`planning.askSetEffort`), como la del esfuerzo de la sesión, con sus dos valores escritos: `true` o `false`. | Es una opción del plan, se versiona con él y la copian «Duplicar» (la versión nueva parte de la vigente) y las plantillas sin código aparte. Hace falta el `false` escrito para apagarla en un plan de antes que la tiene encendida por sus registros. | `z.literal(true)` como `askSessionEffort`: no deja apagar un plan de antes. |
| EP-D02 | **Planes de antes:** ausente, se pide solo si la persona ya declaró el esfuerzo de alguna serie efectiva de ese plan (cualquier versión, en lo registrado o en una corrección). Declarar es un RIR con valor que no vino del plan: no cuentan las tildadas «como el plan», el RIR con `fieldOrigins.rir: 'PLAN'` ni las aproximaciones. La API lo resuelve en cada lectura (API-SER-01 y API-SER-02); queda escrito cuando el profesional toca la casilla. | Es lo más simple que respeta el pedido: no hay migración ni base que tocar, un plan nuevo (sin registros) queda apagado, y a quien ya usaba el campo no se le saca. Es la misma regla en la app y en el website, porque sale de un solo lugar. | Una migración que escriba el valor: congela la detección y toca la base. «Ausente = encendida»: contradice «apagada por defecto». Mirar solo la última sesión: una semana sin escribirlo apagaría el campo. |
| EP-D03 | **Apagada, la serie se registra sin esfuerzo:** ni lo que haya quedado escrito ni el RIR indicado al tildar «como el plan» (antes viajaba con origen `PLAN`). Pasa en la sesión, «Terminar serie», «Antes de finalizar», «Ya la hice» y las series que se suman en la corrección. | Lo que no se le preguntó a la persona no se registra a su nombre, aunque sea del plan. Así, además, Registros no muestra un esfuerzo que nadie dijo. | Seguir copiando el RIR del plan con origen `PLAN`: deja un dato que la persona nunca vio como pregunta. |
| EP-D04 | **Las aproximaciones nunca lo piden**, ni con la opción encendida: en la tabla, su celda del esfuerzo queda vacía (sin campo, para que las columnas sigan alineadas); en la tarjeta y en «Ya la hice», no está. Es un cambio respecto de hoy, que lo mostraba. | Es lo que pide Dirección («de cada serie efectiva, no de las aproximaciones»). | Sacar la celda: desalinea la tabla. |
| EP-D05 | **La corrección** muestra el campo en un ejercicio si el plan lo pide o si alguna de sus series lo tiene registrado. La historia («Tu historial», el detalle de la sesión) muestra lo que hay, como siempre. | La corrección corrige lo registrado: un esfuerzo que está se tiene que poder ver y cambiar. Uno que no está, con la opción apagada, no se ofrece. | Ocultarlo siempre apagada: escondería lo registrado y una corrección lo borraría. |
| EP-D06 | **Capacidad `training-set-effort-1`:** la API manda `askSetEffort` en API-SER-02 solo a la app que la declara; la APK instalada (0.32) no la declara, no recibe el campo y sigue preguntando el esfuerzo, como hoy. API-SER-01, que lee solo el website, lo manda siempre. | Es la regla de DL-196: las capacidades moldean la forma, nunca retienen; el esquema estricto de la APK instalada rechazaría el campo. | Mandarlo a todos: rompería la lectura de la APK instalada. |
| EP-D07 | **Registros:** en una versión que no pide el esfuerzo, un RIR sin registrar no es «un dato sin registrar» ni «RIR: sin dato», y la comparación por serie no ofrece «RIR» si nadie lo registró. Lo registrado se compara como siempre. Revisiones no tiene una columna de esfuerzo por serie: no cambia. | Es el pedido: sin columnas vacías de esfuerzo cuando el plan no lo pide. Lo indicado («Plan de la serie: 60 kg · 8 rep. · RIR 2») sigue diciendo el RIR: es lo que el profesional prescribe y la persona lee. | Ocultar también el RIR indicado: borraría la prescripción. |
| EP-D08 | **Las Plantillas de BE** no traen la opción: el plan que sale de una queda apagado (sin registros). Las plantillas propias copian lo que tenga escrito el plan del que salen. | El pedido es apagada por defecto, y las de BE son propuestas a validar (DL-199). Si Dirección quiere alguna encendida, se suma el campo a su definición. | Encenderla en todas las de BE: contradice el defecto. |
| EP-D09 | **«Ver como la persona»** y los renglones del plan (en la app y en el website) siguen mostrando el RIR o el RPE indicado. | Es la prescripción, no la pregunta: la persona la lee en «Plan de la serie» y sigue sirviendo de guía. | — |

## 3. Las pruebas

- **Dominio** (`packages/domain/src/esfuerzo-de-cada-serie.test.ts`, TEST-EP-01 a 06): la opción en sus dos estados y
  ausente, qué cuenta como declarar, la poda y las plantillas, la capacidad y la cabecera, y Registros.
- **App** (`scripts/esfuerzo-de-cada-serie.test.mjs`): la casilla de la sesión, «Antes de finalizar» con una aproximación,
  «Ya la hice» con y sin cambios, y la corrección, encendida y apagada; la capacidad y la columna en el código.
- **API** (`apps/api/src/entrenamiento/esfuerzo-de-cada-serie.spec.ts`): lo escrito no lee nada; ausente, apagado sin
  esfuerzos y encendido con uno en lo registrado o en una corrección; el campo solo a quien declara la capacidad.
- **Website** (`apps/web/test/esfuerzo-de-cada-serie.test.mjs`): la casilla en el bloque, apagada por defecto, con la
  notación, el estado de un plan de antes, Registros y el CSS junto a su tema.

## 4. Lo que queda afuera

- **La APK no se construyó ni se publicó.** Hasta la próxima, la app instalada sigue preguntando el esfuerzo de todas las
  series (EP-D06), también con la opción apagada.
- Mirarlo en pantalla con Dirección (la casilla en «Configurar plan» y la sesión con una columna menos).
- Si alguna Plantilla de BE va encendida (EP-D08).
- Los gráficos de Analizar que usan el RIR (la mediana del RIR, «Carga, repeticiones y RIR») no cambian: ya dicen «sin RIR
  escrito» cuando no hay.
