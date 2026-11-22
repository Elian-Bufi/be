# WP-RECORRIDO-PLAN-PULIDO · El recorrido de la planificación: cabecera, calculador y reparto por comida

> **El pedido de Dirección (21/11):** Elián recorrió la planificación de Nutrición en el escritorio profesional (1920 ×
> 1080, Windows al 125 %, el navegador al 75 %) y pidió «ponete a solucionar todo, empezá ya».
>
> Rama `wp-recorrido-plan-pulido`, desde `main` (aef7c87e). Registro: **DL-188** en `docs/DEUDA_LEGAJO.md`. Las decisiones
> de continuador (**RP-D01 a RP-D17**) están **a ratificar**. No se integra sola. En paralelo, `wp-evaluacion-inicial-2`
> (otro frente) es dueño de `primer-plan.tsx`, `evaluacion/`, `forms/`, la evaluación dentro de `nutrition/formularios.tsx`
> y el texto «Todavía no hay un plan activo»: este paquete no los toca (de `formularios.tsx`, solo el objetivo y el
> calculador).
>
> **RP-19 «Sin saltos» (22/11),** rama `wp-recorrido-sin-saltos`, desde `main` (32142486): «cuando hay un error se mueve
> todo de lugar». Decisiones **RP-D18 a RP-D26, a ratificar**. Detalle en el §7.

## 0. En criollo

La cabecera de cada área queda en una franja: la vuelta como botón («Espacio profesional» o «Ficha de Ana»), el área, la
persona, el acceso en un chip y, a la derecha, el contexto. Ya no hay «Actualizar» ni «Consultado a las»: al volver a la
pestaña, BE se fija solo si hay algo nuevo y lo dice con «Hay datos nuevos · Ver». El calculador del objetivo se llama
«Calcular», usa la toma con un toque, esconde detrás de «?» y «Fuente» lo largo (la fórmula y la cuenta siguen a la
vista), pide el ajuste como «Déficit» o «Superávit» sin signos y suma la ecuación para deportistas de ten Haaf (2014). El
reparto por comida sale del objetivo y pasa al plan, a la vista en cada día tipo. Cada cantidad de kcal o de macros lleva
su ícono, y la cuenta de los gramos del objetivo del día queda detrás de un «?».

## 1. Alcance (RP-01 a RP-09 y RP-19)

| ID | Qué | Dónde |
|---|---|---|
| RP-01 | La cabecera de las vistas de área en una sola franja: la vuelta como botón fantasma con flecha («Espacio profesional» o «Ficha de {nombre}»); el acceso en un chip que no se parte, con el detalle en su pista; sin «Actualizar» ni «Consultado a las»; al volver a la pestaña, se lee en silencio y, si algo cambió, «Hay datos nuevos · Ver» (`role="status"`), que vuelve a montar la sección en la misma pestaña y pasa por la guardia de la salida (un borrador sin guardar no se pisa). El mismo criterio en la ficha de la persona | `marco-del-area.tsx`, `datos-nuevos.ts`, `workspace.tsx`, `lugar-del-espacio.ts`, `globals.css` |
| RP-02 | A cargo del otro frente del paquete (`wp-evaluacion-inicial-2`) | — |
| RP-03 | Los errores en línea no desplazan los campos: las filas de campos de /pro se alinean por arriba, y un botón suelto en la fila baja lo que ocupa un rótulo | `globals.css` |
| RP-04 | A cargo del otro frente del paquete (`wp-evaluacion-inicial-2`) | — |
| RP-05 | El calculador del objetivo: «Calcular»; «Usar la toma del {fecha}» o «Cargar a mano»; «Hacer una antropometría», opcional, si el profesional tiene Antropometría con la persona; «De dónde sale», de la fuente; lo largo detrás de «?» y «Fuente»; el desplegable del método a todo el ancho; el día de descanso en su renglón; proteína y grasa en g/kg con mínimo, máximo y paso 0,1; el ajuste sin signo («Mantener / Déficit / Superávit»); «Usar estos valores en el objetivo», primario, al pie; la distribución por comida sale del objetivo | `calculador.tsx`, `calculador-del-objetivo.ts`, `referencia-del-objetivo.tsx`, `formularios.tsx` (solo el objetivo), `components/explicacion-a-pedido.tsx`, `contratos-objetivo-y-calculador.ts` (`LIMITES_DE_LOS_GRAMOS_POR_KG`) |
| RP-06 | El reparto por comida, en el plan: «Reparto por comida» a la vista en cada día tipo (y en el paso de los rangos del asistente), con la parte del día de cada comida que suma 100 y el rango propuesto de kcal, P, C y G. Reemplaza al cuadro «Proponer rangos desde el cálculo del objetivo» sin duplicarlo; solo llena lo vacío o pide confirmar | `propuesta-de-rangos.ts`, `propuesta-de-rangos-del-plan.tsx`, `editor.tsx` |
| RP-07 | Ícono, número y abreviatura: «[rayo] 2.500 kcal», «[ícono] 112 g P», con el nombre completo para el lector de pantalla. Una pieza (`CantidadDelMacro` y sus compañeras), en el calculador, lo guardado con el objetivo, las comidas, los rangos, la suma frente al objetivo, el reparto y «Rangos y totales» | `abreviaturas-de-macros.ts`, `cantidad-del-macro.tsx` y sus usos |
| RP-08 | La cuenta de los gramos detrás de un «?» junto al objetivo del día; si no coinciden con las kcal, el aviso corto sigue a la vista | `suma-de-los-rangos.tsx`, `planificacion.ts` |
| RP-09 | ten Haaf y Weijs (2014) en el calculador, en sus dos variantes (con peso, talla, edad y sexo; y con la masa libre de grasa), con su fuente, población, fórmula a la vista y pruebas; cada método dice para quién sirve | `calculador-de-macros.ts`, `contratos-objetivo-y-calculador.ts`, `docs/api/openapi.json` |
| RP-19 | Sin saltos: con un error, nada cambia de lugar. El reparto por comida muestra siempre el rango de cada fila, la suma de las partes en vivo y lo que falta en «Todo el día», con columnas fijas y el porqué del botón en un renglón reservado; su chequeo de la suma de los rangos frente al objetivo reemplaza al cuadro que aparecía arriba de las comidas. Una regla reutilizable (el renglón del aviso, `.avisos-con-lugar` y el resumen de errores que no se achica) en el calculador, el objetivo, la evaluación inicial, el paso 1 de los asistentes y el cuadro del rango (§7) | `propuesta-de-rangos.ts`, `propuesta-de-rangos-del-plan.tsx`, `suma-de-los-rangos.tsx`, `editor.tsx` (solo saca el cuadro), `components/formulario.tsx`, `components/validacion-viva.ts`, `components/campo-de-fecha.tsx`, `calculador.tsx`, `calculador-del-objetivo.ts`, `formularios.tsx`, `evaluacion/evaluacion-inicial.tsx`, `asistente/punto-de-partida.tsx`, `pasos-del-asistente.tsx`, `rangos-indicados-del-plan.tsx`, `globals.css` (bloque RP-19) |

## 2. ten Haaf y Weijs (2014), verificado en la fuente

Coeficientes leídos en el artículo original (sección «Results», las ecuaciones «in kJ and kcal»):

- **Con el peso:** REE (kcal/día) = 11,936 × peso (kg) + 587,728 × talla (m) − 8,129 × edad (años) + 191,027 × sexo (1
  hombre, 0 mujer) + 29,279.
- **Con la masa libre de grasa:** REE (kcal/día) = 22,771 × masa libre de grasa (kg) + 484,264.
- **Población:** 90 deportistas recreativos de 18 a 35 años (53 hombres y 37 mujeres), de los Países Bajos, con el gasto
  medido por calorimetría indirecta y la composición por pletismografía.
- **Cita:** ten Haaf T, Weijs PJM. Resting energy expenditure prediction in recreational athletes of 18-35 years:
  confirmation of Cunningham equation and an improved weight-based alternative. PLoS One. 2014;9(10):e108460.
  doi:10.1371/journal.pone.0108460. El artículo dice «Volume 9, Issue 10»; Europe PMC lo lista como 9(9). Se cita como lo
  imprime el artículo.

Casos de las pruebas, calculados a mano: mujer de 68 kg, 162 cm y 45 años, 811,648 + 952,11936 − 365,805 + 0 + 29,279 =
1.427,24 → 1.427 kcal (con la nota de que queda fuera de los 18 a 35 años); hombre de 70 kg, 175 cm y 30 años, 1.840,48 →
1.840 kcal; 46,5 kg de masa libre de grasa, 1.543,12 → 1.543 kcal.

**La APK.** El método no viaja a la persona: `ObjetivoParaAsesorado` (lo que lee la APK) no lleva la declaración del
método, y el cálculo (API-OBC-03) es solo para el profesional; la APK no valida `MetodoDeReposo` en ninguna parte. La APK
0.31 no rompe. El nombre del método sí llega, como texto, a los profesionales con los que la persona comparte Nutrición
(API-RES-06), en el website.

## 3. El contrato

No cambia ninguna operación. Lo único que crece es el enum `MetodoDeReposo` (dos valores al final), que viaja en
API-OBC-02 y API-OBC-03: lo guardado antes se sigue leyendo, `docs/api/openapi.json` está al día y la tabla del cálculo
guarda el contenido en JSONB (sin migración). Los topes de los g/kg del contrato (0 a 5 y 0 a 3) no se tocaron: los
límites nuevos valen para lo que escribe el website (RP-D07).

## 4. Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D01 | El detalle del acceso va en la pista del chip; el panel de contexto no suma un bloque de acceso | El panel es del contexto de la persona. Alternativa: un renglón «Acceso» en «Lo importante» |
| RP-D02 | «Hay datos nuevos» compara una huella del acceso y de lo que llega de otros: los registros de la persona (cuántos y el último) y lo que escribió otro profesional (objetivo, revisión, toma). No cuenta lo que escribe quien mira (su borrador, la versión que activó, su objetivo, su revisión o su toma) | Lo propio ya está en pantalla. Alternativas: comparar todo (avisaría por lo propio) o tomar la huella al irse de la pestaña (perdería lo que llegó antes de irse) |
| RP-D03 | Se vuelve a leer al volver a la pestaña si pasaron 15 segundos desde la última lectura (antes, 60 para el acceso) | Un cambio de ventana corto no lee de nuevo |
| RP-D04 | «Ver» vuelve a montar la sección en la misma pestaña (la URL la conserva) y pasa por la guardia de la salida: un borrador con autoguardado se guarda antes; lo que no se puede guardar pregunta, y «Seguir editando» no pisa nada. El diálogo propio del marco (que solo descartaba) se retiró | Es la misma guardia que la de los enlaces. Alternativa: apagar «Ver» mientras haya algo sin guardar |
| RP-D05 | El marco lee el resumen (API-DSH-03, 7 días) también al entrar, para tener la huella de partida y lo que el resumen deja leer | Una lectura más por visita. Alternativa: un recurso liviano de «novedades del área» |
| RP-D06 | La ficha de la persona (`workspace.tsx`) es la misma pieza: el mismo criterio, con «Reintentar» si el acceso no se leyó. «Te toca a vos» (`te-toca-a-vos.tsx`) es otra pieza —el pie de una lista con «Ver más» y su propio «Actualizar»—: queda como estaba | — |
| RP-D07 | Los límites de los g/kg (proteína 0,6 a 3,0; grasa 0,5 a 2,5; paso 0,1) son constantes del dominio con nombre y los aplica el website; la API no rechaza un pedido fuera de ellos, para no cambiar el contrato ni la lectura de lo guardado | Alternativa: un esquema de pedido más estricto en API-OBC-02 |
| RP-D08 | «De dónde sale» se deduce de la fuente («Toma del 17/11», «Cargado a mano»); la nota de la masa libre de grasa a mano ya no se escribe ni se manda (`leanMassNote: null`; el contrato no la pide) | Se pierde poder anotar «bioimpedancia del consultorio». Alternativa: mandar «Cargado a mano» |
| RP-D09 | «Hacer una antropometría» se ofrece con `anthropometryEnabled` (API-OBC-01) y abre la carga de una toma en otra pestaña, con «Volver a leer las tomas» al volver: lo escrito en el objetivo no se pierde | Alternativa: ir en la misma pestaña, por la guardia de la salida |
| RP-D10 | El ajuste: «Mantener / Déficit / Superávit» y la cantidad en kcal por día o en porcentaje del gasto total, mayor que cero; un signo escrito se avisa en el campo. Se guarda con su signo | — |
| RP-D11 | La distribución por comida (el texto libre del objetivo) deja de escribirse: lo nuevo va con `mealDistribution: null`. El website no la mostraba en ninguna vista; lo guardado queda con su versión | Su lugar es el reparto por comida del plan (RP-06) |
| RP-D12 | El reparto, por omisión, con una parte por comida para las kcal y los tres macros; «Repartir cada macro por separado» vuelve al reparto por macro. La parte sugerida por el nombre es el promedio de las tres sugeridas por macro, en enteros que suman 100. Las kcal de cada comida se muestran como la cuenta de sus gramos propuestos (4, 4 y 9); no se guardan (el rango del plan no tiene kcal) | El formato del pedido: «su porcentaje del objetivo del día» |
| RP-D13 | Cada día tipo propone y guarda lo suyo (antes, el cuadro proponía todos a la vez) | Va con estar a la vista en el día |
| RP-D14 | ten Haaf entra como `TEN_HAAF_2014_WEIGHT` y `TEN_HAAF_2014_LEAN_MASS`; fuera de los 18 a 35 años, la variante con el peso dice una nota neutra y se aplica igual (no se guarda la nota) | Como las otras: BE no elige ni impide; ubica |
| RP-D15 | RP-07: la tira «Objetivo del día», que ya tenía el ícono y la palabra, queda como estaba (es de donde salen los íconos); en las tablas, el ícono va en el rótulo de la columna o de la fila, donde ya está la unidad | Alternativa: el ícono en cada celda |
| RP-D16 | El «?» del objetivo del día va en el mismo renglón que la tira; abierto, la cuenta ocupa su renglón | — |
| RP-D17 | RP-03 cubre `fila-de-dato`, los campos del ingrediente, el par del editor de Entrenamiento y la medición libre. Con un rótulo de dos renglones (una ventana angosta) un campo puede quedar más abajo que su vecino | Alternativa: una grilla con subgrid (rótulo, control y error por fila) |

## 5. Lo que queda

- Ratificar RP-D01 a RP-D17, y RP-D18 a RP-D26 (RP-19, §7).
- **La APK:** los íconos con el número y la abreviatura (RP-07) no están en el teléfono.
- **Verlo en pantalla:** el flujo de capturas del objetivo (`EVIDENCIA/OBJETIVO-Y-CALCULADOR/herramientas/capturas.mjs`) se
  actualizó a los controles nuevos, pero esta rama no está en los disparadores de `capturas-de-la-planificacion.yml` y no
  se corrió. Falta mirarlo a 1920 × 1080 con Windows al 125 % y el navegador al 75 %, en Claro y en Azul noche.
- Probar con un lector de pantalla el chip, «Hay datos nuevos · Ver», los «?» y el reparto.
- `COPY_VINCULO.accesoNoSeLeyo` y `COPY_PISTAS.ficha.actualizar` quedaron sin uso en el website (siguen en el dominio).
- «Te toca a vos» sigue con «Actualizar» y «Consultado a las» (RP-D06).

## 6. Revisión adversaria del PR (21/11)

Lo que se corrigió en la rama, con su prueba:

- **La CI:** «Hacer una antropometría» era un `<a>` suelto (lo rechaza `scripts/enlaces-del-website.test.cjs`); pasa a ser
  un `Enlace` con `target="_blank"`, como «Ir a Mis alimentos».
- **El «%» del reparto (RP-06):** la base es lo que suman los gramos del día (4, 4 y 9), de donde salen las kcal de cada
  comida. Con un objetivo cuyos gramos no suman sus kcal, «46 % de las 2.100 kcal» quedaba al lado de 823 a 1.005 kcal
  (el 46 % de 1.985). Matiza RP-D12: la parte sigue siendo del objetivo del día; su base en kcal es la de la cuenta.
- **Un día tipo sin comidas** ya no dice «se propone solo el rango del día» (no se proponía nada): pide agregarlas y
  guardar. El cuadro anterior sí proponía ese rango; si hace falta, es un agregado.
- **En el paso de los rangos del asistente,** cada «Reparto por comida» dice de qué día tipo es.
- **Renombrar una comida** ya no borra las partes escritas del reparto.
- **El reparto va después de las comidas** (y de «Agregar comida») en el día tipo. Arriba, al llegar el cálculo del
  objetivo crecía unos 450 px y corría las comidas bajo el puntero: un clic caía en la tabla del reparto (dos recorridos
  de la CI fallaron así), y las comidas quedaban debajo del pliegue. Alternativa: arriba, leyendo el cálculo antes de
  pintar el día.
- **El chip del acceso (RP-01, RP-D01):** «Vínculo activo» solo se leía como acceso vigente; ahora dice «· acceso
  pendiente» o «· acceso no disponible». Con pista, el chip recibe el foco: la pista llega con el teclado.
- **Los recorridos:** la pista al tacto volvía a mirarse después de navegar a otra página (pasaba sin probar nada); y
  `clic` repite si el «Reparto por comida», que llega tarde arriba de las comidas, corre el elemento fuera de la ventana.

## 7. RP-19 · Sin saltos (22/11)

> **El pedido de Dirección (22/11, con capturas):** en el «Reparto por comida», con unas partes que no suman 100 (24 + 28
> + 24 + 23 = 99) «se mueve todo de lugar». Es un problema que vuelve en /pro: «cuando hay un error se mueve todo de
> lugar». RP-03 ya lo había resuelto en las filas de campos; el patrón seguía en otros lados. **Agregado del mismo día:**
> al tocar «Proponer estos rangos», el cuadro «Los rangos de las comidas frente al objetivo del día» aparecía de golpe
> arriba de las comidas y corría toda la pantalla; y, como notó Elián, casi siempre iba a decir «adentro», porque los
> rangos que salen del reparto contienen el objetivo por construcción.

### 7.1 El problema y la causa

En el reparto había cuatro saltos juntos, y los cuatro tenían la misma causa: **lo que depende de un dato se sacaba de la
página cuando el dato no servía, en vez de quedarse en su lugar diciendo que no sirve**.

- `propuestaDelDia` devolvía `{ ok: false }` con cualquier suma distinta de 100, y la tabla tomaba eso como «no hay
  rangos»: cada fila perdía su rango (la columna de las kcal pasaba a «—» y se iban los gramos de debajo de cada campo) y
  las filas se achicaban. El rango de una comida no depende de las demás, pero la pantalla lo hacía depender.
- La tabla era de ancho automático: al cambiar «566 a 690 kcal» por «—» las columnas se reacomodaban y los campos se
  corrían a la izquierda.
- Debajo de la tabla aparecía un párrafo `campo__error` por macro y empujaba el botón; el texto junto al botón aparecía y
  se iba; «Lo que ya escribiste» aparecía arriba del botón solo cuando la suma daba 100.
- El cuadro de la suma de los rangos (NUP-06) vivía arriba de las comidas y crecía al llegar los rangos propuestos.

El mismo patrón, en el recorrido de la planificación: en el **calculador**, un factor, un ajuste o unos g/kg que no se
entendían borraban la fórmula y la cuenta del gasto en reposo (que están arriba del campo del factor: el campo subía
mientras se escribía), la tabla del gasto total y las de los macros, y aparecía un párrafo arriba de «Usar estos valores»;
en el **objetivo** y la **evaluación inicial**, el aviso de cada campo aparecía y se iba al salir del campo, y el resumen
de errores se achicaba un renglón con cada corrección; en el **paso 1 de los asistentes**, «Elegí un punto de partida»
bajaba «Siguiente» justo después de tocarlo; en el **cuadro del rango de una comida**, el aviso de un mínimo o un máximo
alargaba su fila mientras se escribía.

### 7.2 La regla adoptada

**Lo que aparece o se va mientras se escribe o se elige tiene su lugar reservado; vacío, ocupa lo mismo.** Un error no
corre los campos ni los botones. Lo que responde a un botón va al lado (en su renglón) o debajo de él, nunca arriba. Es la
regla de los campos de texto de Material Design (el texto de ayuda y el de error comparten un renglón reservado debajo del
campo) y del resumen de errores de GOV.UK (no cambia hasta el envío siguiente). Tres piezas, una sola regla:

1. **El renglón del aviso** (`RenglonDelAviso`, `components/formulario.tsx`): un renglón de alto fijo (`.renglon-del-aviso`,
   1,55 rem) para un aviso, lo que falta de una suma o por qué un botón está apagado. Al lado de un botón
   (`juntoAlBoton`), con el alto del botón, y el botón arriba de su fila: aunque el texto ocupe dos renglones, no se mueve.
2. **Los formularios con los avisos en su lugar** (`.avisos-con-lugar`): cada campo que puede avisar reserva el renglón
   de su aviso. `Campo` y `CampoDeFecha` se marcan solos (`data-con-aviso`) cuando reciben `error`, aunque sea `null`; los
   campos escritos a mano llevan `data-con-aviso`. Sin aviso, el renglón vacío es un `::after` del mismo alto; con aviso,
   el aviso lo ocupa. El campo con aviso tampoco cambia de tamaño: el borde sigue de 1 px y el segundo píxel del error es
   una sombra (con un borde de 2 px, el factor del calculador se ensanchaba y corría 2 px al campo de al lado; lo encontró
   el recorrido `sinSaltos`). No cambia nada fuera de los formularios que la usan.
3. **Las tablas que cambian en vivo**, con columnas fijas (`table-layout: fixed` y `<colgroup>`) y cada celda con su
   renglón siempre, con «—» cuando no hay número.

Y el **resumen de errores** (`ResumenDeErrores`, en todo el website) no se achica al corregir: lo corregido queda tachado,
con su tilde, hasta el envío siguiente (`renglonesDelResumen`, en `validacion-viva.ts`).

### 7.3 Lo que cambió

**El reparto por comida** (`propuesta-de-rangos.ts`, `propuesta-de-rangos-del-plan.tsx`):

- Cada fila muestra siempre su rango de kcal y de cada macro con la parte que tiene escrita (`rangosPorFila`). Con 100 es
  exactamente lo que se propone y se guarda; si no, cada comida lleva su parte del rango del día. Una parte vacía o que no
  es un número deja «—» en el mismo renglón.
- «Todo el día» dice la suma de las partes en vivo («99 %», marcada si no da 100), su base («de las 1.985 kcal») y,
  debajo, en su renglón, lo que falta o sobra en la unidad de la base: «faltan 20 kcal», «sobran 60 kcal» (por macro, «faltan
  1,3 g») o «revisá la marcada»; vacío cuando da 100. El lector de pantalla oye la frase con su base. Los párrafos de error
  de debajo de la tabla se fueron. El rango del día ya no depende del reparto (`rangoDelDia`).
- La base del «%» va una vez, en el rótulo de su columna: «Parte del día · % de las 1.985 kcal» (por macro, «% de los
  130 g»).
- Columnas fijas, con el contenedor `desplazable-x` de siempre.
- Al lado de «Proponer estos rangos», un renglón reservado, siempre presente: por qué está apagado («Las partes no suman
  100: ajustalas para proponer.», el margen, «No hay nada nuevo para guardar…») o lo que se guardó («Se guardaron 3 rangos
  de la propuesta.»). Proponer sigue bloqueado mientras una suma no dé 100, y lo que se guarda no cambió.
- «Lo que ya escribiste» y el error del servidor van debajo del botón; «Lo que ya escribiste» se ve aunque la suma no dé
  100 (depende de lo que ya está escrito, no de la propuesta).

**La suma de los rangos frente al objetivo** (el agregado del 22/11): sale de arriba de las comidas del editor
(`editor.tsx`: solo se sacó el montaje). Su chequeo es un renglón propio del reparto, debajo de la tabla, con su alto
reservado (`chequeoDeLaSuma`, `chequeoEnPalabras`):

- «La suma de los rangos de las comidas contiene el objetivo del día», con los íconos de las kcal y los macros.
- Si algo queda afuera, cuál, por cuánto y con su base: «El objetivo del día queda afuera de la suma de los rangos de las
  comidas: proteínas, 12 g por encima del máximo (objetivo 112 g).»
- Si a una comida le falta el mínimo o el tope, que de ese lado no se compara.
- Sin rangos indicados, el renglón queda vacío, con su alto.
- El detalle por macro (la tabla con las franjas de NUP-06) queda detrás de un «?», que se abre hacia abajo: no corre nada
  de lo que está arriba. La cuenta es la misma de NUP-06 (`sumaDeLosRangos`, de `planificacion.ts`, sin tocarlo).

**La regla, donde Elián recorre la planificación:**

| Dónde | Qué saltaba | Ahora |
|---|---|---|
| Calculador (`calculador.tsx`, `calculador-del-objetivo.ts`) | Un factor, un ajuste o unos g/kg que no se entendían borraban la fórmula y la cuenta del reposo (arriba del factor), el gasto total y los macros; «Completá los datos de arriba» aparecía arriba del botón; los avisos de cada campo aparecían mientras se escribía | El gasto en reposo se calcula siempre con los datos, el método y el sexo (`reposoEnVivo`), con sus tres renglones; el gasto total y las tablas de macros, siempre (con «—»), con columnas fijas; lo que el cálculo no pudo hacer, en un renglón reservado; el porqué del botón, a su lado; `.avisos-con-lugar` |
| Objetivo (`formularios.tsx`) | El aviso de cada campo y el resumen que se achicaba al corregir | `.avisos-con-lugar` (con la evaluación de referencia y el fundamento, escritos a mano) y el resumen fijo |
| Evaluación inicial (`formularios.tsx`, `evaluacion/evaluacion-inicial.tsx`) | Los avisos de la fecha y de «Otros datos»; el aviso de un dato de «Lo que necesita el cálculo» al tocar «Listo» | `.avisos-con-lugar`; el dato que se cambia trae su renglón reservado |
| «Empezar el plan» (`asistente/punto-de-partida.tsx`, `pasos-del-asistente.tsx`) | «Elegí un punto de partida» bajaba «Siguiente» | El renglón reservado, en Nutrición y en Entrenamiento |
| El cuadro del rango de una comida (`rangos-indicados-del-plan.tsx`) | El aviso de un mínimo, un máximo o el peso alargaba su fila mientras se escribía | Su renglón reservado en cada celda; el peso a mano, con `.avisos-con-lugar` |

### 7.4 Lo que encontró la auditoría y quedó anotado

- **La comida plegada, al proponer** (`comida-del-editor.tsx`): cada comida suma el renglón «Indicado: …» y corre lo de
  abajo, incluido el reparto, un renglón por comida. Es del frente de las barras por comida (que está tocando ese
  archivo): no se tocó. Propuesta: reservar ese renglón, o llevarlo al de lo que aporta.
- **La cantidad de un alimento en el editor** (`comida-del-editor.tsx`): el aviso de un número que no se entiende aparece
  mientras se escribe y alarga su fila; el campo no se mueve, las filas de abajo sí. Mismo frente. Propuesta: un aviso
  posicionado junto al campo, sin ocupar lugar, como en una planilla.
- **La toma antropométrica**: los avisos aparecen solo al guardar o registrar y no cambian mientras se corrige; reservar un
  renglón en cada una de las treinta mediciones alargaría la figura. Queda como está.
- **Lo que responde a un envío** (un fallo del servidor en el objetivo y la evaluación): aparece después del clic, recibe
  el foco y queda arriba de los botones, como estaba. En el reparto y el calculador ya va debajo.
- **Lo que crece debajo de lo que se escribe**: la cuenta de los gramos del objetivo (NUP-07) al escribir los gramos, y la
  fórmula del calculador al escribir los datos (el texto cambia de largo). No mueven el campo que se escribe.
- **El mismo patrón fuera del recorrido de la planificación**, para un paso siguiente con las mismas piezas: el editor de
  Entrenamiento (`ejercicio-del-editor.tsx`), los formularios de la persona (`forms/campos-v2.tsx`), el período
  (`control-de-periodo.tsx`), Seguimiento (`selector.tsx`, `vistas-guardadas.tsx`), la nota de coordinación, el editor de
  recetas, invitar y solicitar un vínculo.

### 7.5 Las pruebas

- `apps/web/test/recorrido-plan-pulido.test.mjs` (seis pruebas RP-19): el rango por fila con sumas de 99, con una parte
  vacía, con una que no es un número y con 100 (igual a lo que se guarda); la suma en vivo y lo que falta o sobra (con el
  medio punto de siempre); el chequeo de la suma de los rangos (sin rangos, del reparto, escritos a mano, sin tope); la
  pantalla del reparto; la regla reutilizable y el resumen; el calculador sin factor.
- `test/navegador/recorridos.mjs`, recorrido `sinSaltos`: en el reparto, 99, una parte vacía y otra vez 100 no mueven los
  campos, las columnas, el margen ni «Proponer estos rangos» más de 1 px; al proponer, la primera comida y lo de adentro del
  reparto no se mueven y el chequeo dice que contiene el objetivo; en el objetivo, corregir las kcal después de un envío
  con errores no mueve los demás campos ni el botón; en el calculador, vaciar el factor no mueve el factor, los g/kg ni
  «Usar estos valores». Con capturas.
- `objetivo-y-calculador.test.mjs` y `planificacion-de-nutricion.test.mjs`, al día con el «%» en el rótulo y la suma en el
  reparto. El flujo de capturas de la planificación (`EVIDENCIA/NUTRICION-PLANIFICACION/herramientas/capturas.mjs`) busca
  el chequeo en el reparto.

### 7.6 Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D18 | Cada fila del reparto muestra su rango con la parte que tiene escrita aunque la suma no dé 100. Con 100, es lo que se guarda (el resto mayor reparte los redondeos); si no, cada comida redondea su parte del rango del día, y puede diferir en 1 g de lo que se propone al ajustar. Una parte vacía o ilegible deja «—». Con 100 y una parte vacía, la fila muestra lo que se guardaría (0 g) | El rango de una comida no depende de las demás. Alternativa: ocultar los rangos hasta que sume 100 (lo de antes, que movía todo) |
| RP-D19 | La base del «%» de cada parte va una vez, en el rótulo de la columna («% de las 1.985 kcal»; por macro, «% de los 130 g»), y no al lado de cada campo (los campos ya no llevan un «%» suelto). «Todo el día» dice la suma con su base («99 %», «de las 1.985 kcal») y, en su renglón, lo que falta o sobra en kcal (o en g, por macro), marcado como error. El pedido decía «99 % · falta 1 %»: el «1 %» suelto no dice de qué es (regla del 18/11, que la prueba de las pantallas hace cumplir), y en kcal dice además cuánto es | Al lado de cada campo, la tabla no entraba a 1.280 px con columnas fijas. Alternativas: «falta el 1 % de las 1.985 kcal», en dos o tres renglones (la celda más alta), o la base al lado de cada campo, con la tabla más ancha |
| RP-D20 | El rango del día en «Todo el día» es siempre el del objetivo con su margen | Antes, sin 100, mostraba los gramos sin margen y cambiaba de texto |
| RP-D21 | Columnas fijas con anchos en rem (comida 7, parte 8,5, kcal 10,5 y 8,5 por macro), la tabla a 0,92 rem y las cantidades sin partirse: donde no entra, la tabla se desplaza de costado | Alternativa: dejar partir las cantidades, con dos renglones reservados en cada celda (filas más altas) |
| RP-D22 | Lo que responde a «Proponer» va al lado del botón (lo que se guardó, en el renglón reservado) o debajo («Lo que ya escribiste», el error del servidor). «Lo que ya escribiste» se ve aunque la suma no dé 100. Lo que se guardó ya no va al aviso de la lista de rangos del asistente, que corría todo (y en el editor no se veía) | Alternativa: «Lo que ya escribiste» arriba del botón, con su alto reservado |
| RP-D23 | (Pedido del 22/11.) La suma de los rangos frente al objetivo sale de arriba de las comidas del editor y su chequeo es una línea del reparto, con su alto reservado, los íconos, cuál queda afuera, por cuánto y su base; el detalle, detrás de un «?». Sin colores de juicio (NUP-06). Las comidas todavía sin guardar no entran en el chequeo (no pueden tener rango; el autoguardado las guarda enseguida). En el paso de las comidas del asistente la tabla queda como estaba, debajo de las comidas | Alternativa: la línea en la fila «Todo el día» (más apretada) |
| RP-D24 | La regla única: el renglón del aviso, `.avisos-con-lugar` (cada campo que puede avisar reserva su renglón) y las tablas en vivo con columnas fijas y «—». Se aplica donde Elián recorre la planificación (§7.3). Un aviso de dos renglones todavía crece uno | Alternativa: el aviso posicionado encima de lo de abajo, sin ocupar lugar (tapa lo que sigue mientras dura) |
| RP-D25 | El resumen de errores ya no se achica al corregir, en todo el website: lo corregido queda tachado con su tilde hasta el envío siguiente; con todo corregido dice «Ya corregiste lo marcado.», como aviso informativo. Matiza ED-04 en lo visual (el aviso del campo sí se va al corregir) | Como GOV.UK, que no lo cambia hasta reenviar. Alternativa: el resumen fijo sin marcar lo corregido, o achicarse como antes |
| RP-D26 | En el calculador, el gasto en reposo se calcula y se muestra siempre con los datos, el método y el sexo; el gasto total y las tablas de macros (si se piden) están siempre, con «—»; la nota de la población, en un renglón reservado solo con los métodos que la pueden decir (hoy, ten Haaf con el peso) | El reposo no depende del factor, el ajuste ni los g/kg. Alternativa: dejar el último cálculo a la vista, atenuado, mientras se corrige |
