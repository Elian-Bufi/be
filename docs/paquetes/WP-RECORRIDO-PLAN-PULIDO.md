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

## 1. Alcance (RP-01 a RP-09, RP-19, RP-20 y RP-21)

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
| RP-20 | Las franjas por comida (§8): en cada comida, plegada o abierta, un renglón por kcal, P, C y G con la banda del rango indicado, una marca por opción y la del promedio, y «3 de 4 adentro · promedio 28 g P»; la misma franja con la opción abierta sola (en vivo, también en su cuadro) y una porción de cada receta al elegirla, con «Primero las que entran» | `franjas-por-comida.ts`, `franjas-de-la-comida.tsx`, `comida-del-editor.tsx`, `cuadro-de-la-opcion.tsx`, `editor.tsx` (`ElegirReceta`), `globals.css` |
| RP-21 | «Rangos y totales» rediseñado (§8): el día arriba, con sus íconos y su tramo frente al rango del día; cada comida con lo que aportan sus opciones y su franja compacta; lo que no suma, una vez y en chico | `rangos-y-totales.tsx`, `franjas-de-la-comida.tsx`, `editor.tsx` (`rangos` del panel), `globals.css` |

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
(`editor.tsx`: solo se sacó el montaje). Su chequeo es un renglón propio del reparto, debajo de «Proponer estos rangos»,
con su alto reservado (`chequeoDeLaSuma`, `chequeoEnPalabras`):

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
| RP-D23 | (Pedido del 22/11.) La suma de los rangos frente al objetivo sale de arriba de las comidas del editor y su chequeo es una línea del reparto, debajo de «Proponer estos rangos» (cambia al proponer y puede ocupar dos renglones: arriba, bajaba el botón), con su alto reservado; sin la tabla del reparto (un objetivo sin gramos por día ni cálculo), igual se ve; los íconos, cuál queda afuera, por cuánto y su base; el detalle, detrás de un «?». Sin colores de juicio (NUP-06). Las comidas todavía sin guardar no entran en el chequeo (no pueden tener rango; el autoguardado las guarda enseguida). En el paso de las comidas del asistente la tabla queda como estaba, debajo de las comidas | Alternativa: la línea en la fila «Todo el día» (más apretada) |
| RP-D24 | La regla única: el renglón del aviso, `.avisos-con-lugar` (cada campo que puede avisar reserva su renglón) y las tablas en vivo con columnas fijas y «—». Se aplica donde Elián recorre la planificación (§7.3). Un aviso de dos renglones todavía crece uno | Alternativa: el aviso posicionado encima de lo de abajo, sin ocupar lugar (tapa lo que sigue mientras dura) |
| RP-D25 | El resumen de errores ya no se achica al corregir, en todo el website: lo corregido queda tachado con su tilde hasta el envío siguiente; con todo corregido dice «Ya corregiste lo marcado.», como aviso informativo. Matiza ED-04 en lo visual (el aviso del campo sí se va al corregir). El lector de pantalla lo oye una vez por envío, no a cada corrección; cada envío cuenta, también el que pasa la revisión | Como GOV.UK, que no lo cambia hasta reenviar. Alternativa: el resumen fijo sin marcar lo corregido, o achicarse como antes |
| RP-D26 | En el calculador, el gasto en reposo se calcula y se muestra siempre con los datos, el método y el sexo; el gasto total y las tablas de macros (si se piden) están siempre, con «—»; la nota de la población, en un renglón reservado solo con los métodos que la pueden decir (hoy, ten Haaf con el peso) | El reposo no depende del factor, el ajuste ni los g/kg. Alternativa: dejar el último cálculo a la vista, atenuado, mientras se corrige |

### 7.7 La revisión del PR

Lo que encontró la revisión adversaria y se corrigió en la rama, con su prueba:

- **El resumen de errores, en todo el website.** Con `role="alert"` (en vivo, urgente y entero), cada corrección (un
  renglón que se marca, el título que pasa a «Ya corregiste lo marcado.») hacía que el lector de pantalla volviera a leer
  el resumen completo al salir del campo, encima del rótulo del campo siguiente. Ahora lleva `aria-live="off"` y se vuelve
  a montar en cada envío: se anuncia una vez por envío, como antes, y el «Listo para…» lo sigue diciendo
  `AnuncioDeLosAvisos`.
- **Un envío que pasa la revisión también cuenta.** Cinco formularios vaciaban los errores sin contar el envío
  (recuperación asistida, restablecer el segundo factor, incorporar y cambiar el nombre, en Administración; vincular la
  cuenta de Google): con el resumen nuevo quedaba «Ya corregiste lo marcado.» con lo anterior tachado durante el envío y
  después de que salía bien. Ahora cuentan el envío.
- **«revisá la marcada» no tenía marca.** La parte o el margen que no se entiende solo llevaba `aria-invalid`; ahora se ve
  con el borde y la sombra del error, sin cambiar de tamaño.
- **El chequeo de la suma, debajo del botón.** Con el objetivo afuera de la suma (por ejemplo, unas kcal escritas lejos de
  las que suman los gramos, o un margen chico) la línea ocupa dos renglones o más, y cambia justo al proponer: arriba de
  «Proponer estos rangos», lo bajaba. Sin la tabla del reparto (un objetivo sin gramos por día ni cálculo con macros, o un
  cálculo que no se pudo leer) el chequeo no se veía en ningún lado del editor; ahora sí. Solo la línea está en vivo: el
  detalle del «?» no se anuncia entero al abrirlo.
- **El recorrido `sinSaltos`** espera la letra (`document.fonts.ready`) antes de la primera foto de los lugares.
## 8. RP-20 y RP-21 · Las franjas por comida y «Rangos y totales» (22/11)

> **El pedido de Dirección (22/11),** probando el editor del plan de Nutrición: «estaría bueno que eso esté en cada comida
> con cada uno de los macros. Así se ve cómo, sumando alimentos, se va llegando a los macros planteados para esa comida y
> si entra dentro del margen». Lo crítico no es la suma del día frente al objetivo (da bien por construcción): es que cada
> opción o receta caiga dentro del rango de su comida y que, en promedio, vaya por buen camino. Y del panel «Rangos y
> totales»: «ponele más amor, que se vea mejor estéticamente, agregale íconos a los macros también». Más tarde, Dirección
> confirmó que todo se mueve en tiempo real al cambiar los alimentos, no solo la opción abierta.
>
> Rama `wp-recorrido-barras-por-comida`, desde `main` (32142486). En paralelo, `wp-recorrido-sin-saltos` (RP-19, desde
> RP-D18) es dueño de `propuesta-de-rangos*`, `suma-de-los-rangos.tsx` y su montaje en el editor: este frente no los toca.
> Decisiones **RP-D40 a RP-D49, a ratificar**.

### En criollo

Cada comida muestra, debajo de su nombre y aunque esté plegada, cuatro renglones: kcal, proteínas, carbohidratos y grasas.
En cada uno, una banda celeste es el rango indicado de la comida; cada opción es un punto (lleno si queda adentro, hueco si
queda afuera) y una raya marca el promedio de las opciones. A la derecha dice, en corto, «3 de 4 adentro ·
promedio 28 g P». Adentro de la opción que se arma, lo mismo con esa opción sola, y el punto se corre con cada tecla de una
cantidad; también en el cuadro de la opción. Al elegir una receta, cada una dice dónde queda una porción frente al rango
de la comida, y se pueden ver primero las que entran. El panel «Rangos y totales» arranca con el día, sigue con cada comida
(lo que aportan sus opciones, con su ícono, y su franja chica) y dice una sola vez lo que falta. No hay rojo ni verde: la
franja ubica, no califica, y no bloquea nada.

### Cómo se lee una franja

- **La escala va de 0 al doble del centro del rango** (RP-D42). Con el mismo margen, la banda queda en el mismo lugar y con
  el mismo ancho en los cuatro renglones: con ±10 %, entre el 45 y el 55 % de la pista. Una marca a la derecha de la banda
  está por encima; a la izquierda, por debajo. Lo que pasa del borde se fija al borde, con una flecha.
- **Las kcal del rango salen de sus gramos,** con 4, 4 y 9 kcal por gramo (RP-D41), como la suma de NUP-06: el rango del
  plan no tiene kcal. Las kcal de cada opción siguen saliendo de la fuente de cada alimento.
- **El texto ubica en gramos o kcal:** «adentro», «por encima, 6 g», «por debajo, 120 kcal». Nunca un «%» suelto ni las
  palabras de juicio.
- **El lector de pantalla** oye el renglón entero, con cada opción: «Proteínas: rango indicado 25 a 31 g P. Opción 1: 28 g
  P · adentro. 2 · Pollo: 34 g P · por encima, 3 g. Promedio 28 g P, adentro. 1 de 2 opciones adentro». Lo dibujado va
  oculto para él.

### Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D40 | Las franjas de la comida van debajo de su encabezado, fuera del botón que la abre, plegada o abierta: cuatro renglones (kcal, P, C y G) con su ícono y su letra, los límites del rango, la pista y el resumen. Con la franja a la vista, el encabezado deja de repetir «Indicado: …» (los límites están en cada renglón); lo que aportan las opciones sigue ahí. Sin rango indicado no se dibuja nada: adentro queda el renglón para indicarlo (`RangoEnUnRenglon`) | Adentro del botón, su nombre accesible sería de varias oraciones. Alternativa: solo con la comida abierta |
| RP-D41 | La banda de las kcal sale de los gramos indicados con 4, 4 y 9 kcal por gramo, y solo si los tres macros tienen rango: el piso, con un mínimo que falta como cero; el tope, si los tres tienen máximo. Las kcal de cada opción son las de la fuente: pueden diferir un poco de las del 4, 4 y 9 (la fibra, el redondeo de cada fuente). Lo explica el «?» de «Rangos y totales», y el lector de pantalla lo oye en el renglón de las kcal | El rango del plan no tiene kcal (API-PLN-03). Alternativa: sumar un rango de kcal a API-PLN-03 (cambia el contrato) |
| RP-D42 | La escala de cada renglón va de 0 al doble del centro del rango (con un solo lado, ese lado es el centro; un rango en cero, hasta un poco más que el mayor de los valores). Lo que pasa del borde se fija al borde con una flecha. Las cifras se comparan como se muestran: las kcal enteras y los gramos a un decimal | Es la que pidió Dirección como ejemplo: arranca en cero y la banda cae igual en los cuatro renglones. Alternativa: una escala de la mitad a 1,5 veces el centro, con el doble de detalle, que no arranca en cero |
| RP-D43 | El promedio es la media simple de las opciones que tienen el dato, en una raya más alta que la pista; con una sola opción no hay promedio. «N de M adentro» (el lector de pantalla oye «opciones») cuenta las que tienen el dato. Una opción sin alimentos no cuenta; las que se están leyendo, las recetas que se calculan al guardar y las que tienen un dato que falta se cuentan aparte («1 leyendo», «1 al guardar», «1 sin dato») | Las opciones pesan lo mismo (B05). Alternativa: la mediana |
| RP-D44 | El día frente a su rango pasa al panel, como un tramo (de la opción que menos suma a la que más) sobre la banda del rango del día, si lo tiene. Adentro de la opción abierta del editor ya no se repite; en el cuadro de la opción sigue en líneas, porque el cuadro tapa el panel | Dirección: lo crítico es cada comida. Alternativa: el tramo también adentro de la opción |
| RP-D45 | En el panel, lo que aportan las opciones de cada comida sale de las que tienen el dato; una opción sin alimentos se nombra en el renglón de su comida («· 1 sin alimentos»), y una comida entera sin alimentos ocupa un renglón, sin «Sin dato». Lo demás que falta (una cantidad, una composición) va en una sola nota al pie. El día sigue sin sumar a medias: con un hueco, sus cuatro renglones quedan en su lugar con «—» y un renglón corto dice por qué | Antes, una opción vacía dejaba toda la comida en «Sin dato» y la lista se repetía al pie. Alternativa: dejar «Sin dato» en la comida |
| RP-D46 | Al elegir una receta, la porción que trae la lista de «Mis recetas» (API-REC-02, `calculation.perServing` de su versión vigente) frente al rango de la comida, renglón por renglón: su valor y «adentro», «por encima, 6 g» o «por debajo, 4 g». «Primero las que entran en el rango de …» ordena: más renglones adentro primero; entre las que tienen los mismos, la más cercana (un dato que falta cuenta como lejos). No esconde ninguna. Sin rango, lo dice y no compara | La composición viene en la lista: ningún pedido por receta (nada de N+1). Alternativa: un filtro que esconda las que no entran |
| RP-D47 | Sin saltos: cada renglón tiene su alto fijo (1,6 rem; 2,55 rem con menos de 46 rem de ancho, como la comida a 1280, con la pista arriba), y el resumen no se parte: se lleva 1,6 partes del ancho contra 1 de la pista, y entra entero. Mientras se leen los rangos, la comida ya guardada reserva sus cuatro renglones. Una opción que se vuelve a leer queda donde estaba, punteada; una que nunca tuvo lugar no se dibuja y el resumen la cuenta. Nada se anima, como el vidrio (ED-18). RP-19 («Sin saltos») no estaba en `main` al cerrar: si su regla pide otra cosa, se alinea | Alternativa: una marca «leyendo» en el centro de la banda |
| RP-D48 | Todo sale de lo que está en pantalla (`rangosDelDia` del borrador, en cada render): la franja de la comida, la de la opción y el panel se mueven con cada tecla, y ubican igual a cada opción. Una opción de receta se ubica con la porción que armó la API al guardar, la de la versión guardada; hasta el guardado, «al guardar». El panel lo dice en una nota corta | Lo pidió Dirección (22/11) |
| RP-D49 | Los colores: la banda en el acento (`--azul` al 42 %, con su borde); las marcas en el color del texto, con un anillo del fondo; afuera, hueca. Sin `--error` ni `--exito`, y sin tokens nuevos: los dos temas de /pro (Claro y Azul noche) salen de los mismos | Ubica, no califica (NUP-D05) |

### Lo que se probó

- **Unitarias** (`apps/web/test/franjas-por-comida.test.mjs`): los límites de cada renglón y las kcal de los gramos; la
  escala y la banda en el mismo lugar en los cuatro renglones; la posición de cada marca, adentro y afuera con su
  diferencia; el promedio y el conteo; lo que se fija al borde; sin rango y con un renglón sin rango; sin alimentos (una
  sola indicación); lo que se lee, lo que se calcula al guardar y lo que falta; el día; lo que falta en el día, una vez; la
  receta frente al rango y «Primero las que entran»; los textos, sin «%» ni palabras prohibidas; y que la pieza, el panel,
  el cajón de recetas y los estilos digan lo que este apartado describe.
- **De navegador** (`franjasPorComida` en `test/navegador/recorridos.mjs`): la comida plegada con sus cuatro renglones,
  dos marcas y el promedio; al borrar la cantidad del arroz en la opción abierta, su marca se va de los tres lugares y ni
  las franjas ni el bloque del día cambian de alto; al escribir la nueva, su marca vuelve en otro lugar, en la opción, en
  la comida y en el panel, las tres en el mismo lugar y sin cambiar de alto; a 1280, 1440, 1536 y 2048 de ancho el panel
  no se desplaza de costado y ningún resumen, límite ni renglón de ayuda se corta con «…». Capturas con datos sintéticos.

### Revisión adversaria (22/11)

Lo que se corrigió en la rama, con su prueba:

- **Lo largo, detrás de un «?»** (pedido de Dirección para todo el recorrido): en «Rangos y totales», cómo se lee una
  franja (la banda, los puntos llenos y huecos, la raya del promedio: no había otra leyenda), cómo se suma el día, de
  dónde salen las kcal del rango (antes solo en la pista del ratón, que no llega al teclado ni al lector), con qué porción
  va una receta y que es una estimación del editor, en un «?» junto al título del día. La explicación de «Rangos
  indicados», en un «?» junto a su título; en el paso del asistente, que la presenta con su propio título, sigue a la vista.
- **El resumen de la comida se cortaba** con «…» a 1280 y, con el promedio afuera, a 1536 (la pantalla de Dirección):
  «1 de 2 opciones adentro · promedio 6,9 g C (por …». Ahora dice «1 de 2 adentro · …» (el lector oye «opciones»), se
  lleva 1,6 partes del ancho contra 1 de la pista y, con menos de 46 rem (la comida a 1280), va debajo de la pista. El
  aviso de una comida sin alimentos se acortó por lo mismo.
- **El bloque del día del panel cambiaba de alto** cada vez que el día no se podía sumar: al sumar un alimento antes de
  escribir su cantidad, o al borrar una cantidad para reescribirla, sus cuatro renglones pasaban a una nota y todo lo de
  abajo subía. Ahora el renglón de ayuda y los cuatro renglones están siempre: sin dato, «—» y la banda del rango del día,
  y el porqué corto en el renglón de ayuda («Todavía no se suma: abajo dice qué falta.»).
- **El lector de pantalla** oía «Las opciones de Almuerzo…» en la franja de una sola opción y en la de una receta; ahora
  cada variante dice lo suyo, y el renglón de las kcal dice que su rango sale de los gramos.
- **El cuadro de la opción** se titulaba «Frente al rango de …» aunque la comida no tuviera rango (solo ubicaba el día).
- **Un total que no es un número** quedaba «adentro» por descarte; ahora es «sin dato» (no debería llegar, pero no
  ubica nada que no se pueda medir).
- **El cálculo en cada tecla** cuesta del orden de 1 ms por render con 6 comidas de 5 opciones (medido con node): no
  hace falta memoizarlo (guardar el resultado entre renders). Lo caro sigue siendo la suma de nutrientes de
  `rangosDelDia`, que no cambió.

### Lo que queda

- Ratificar RP-D40 a RP-D49.
- Mirarlo en la pantalla de Dirección (1920 × 1080, Windows al 125 %, el navegador del 75 al 100 %), en Claro y en Azul
  noche, y con un lector de pantalla real.
- Los pasos del asistente (`pasos-del-asistente.tsx`) no muestran las franjas: el editor sí.
- La porción de una receta en el cajón es la del cálculo guardado de su versión vigente; ya en el plan, la opción se
  estima con la composición de hoy de cada alimento del catálogo: pueden diferir un poco.
- **Alinear con RP-19 al integrar** (de la revisión, sin corregir acá): al tocar «Proponer estos rangos» (el reparto va
  debajo de las comidas), cada comida suma sus cuatro renglones arriba del botón; el navegador compensa lo que queda
  fuera de la ventana, no la comida que se ve. Mientras se leen los rangos, la comida guardada reserva sus renglones y,
  si no tiene rango, los suelta. En el panel, la franja de una comida aparece al sumar su primer alimento. Propuesta:
  reservar la franja de toda comida guardada cuando el día tipo tenga rangos o reparto.
- `docs/DEUDA_LEGAJO.md` (DL-188) no se tocó en esta rama, para no chocar con el otro frente: al integrar, sumarle RP-20,
  RP-21 y RP-D40 a RP-D49.

## 9. RP-22 · Entrenamiento antes de la prueba (22/11)

> **El pedido:** Dirección prueba la planificación de Entrenamiento del profesional. Lo que marcó en el recorrido de
> Nutrición (la cabecera, «Empezar el plan», los avisos que corren todo, lo largo a la vista, los números sin límites ni
> paso, lo anotado del catálogo y del resumen) se lleva a Entrenamiento con las mismas piezas. Rama
> `wp-entrenamiento-antes-de-la-prueba`, desde `wp-recorrido-sin-saltos` (RP-19). Decisiones **RP-D60 a RP-D72, a
> ratificar**. No toca la lógica ni los textos de la intensidad (el frente del RPE, DL-192) ni `nutrition/**`.

### En criollo

En el editor de Entrenamiento, escribir algo que no se entiende ya no corre nada: la celda se marca en su lugar, del
mismo tamaño, y un renglón que siempre está debajo de la tabla de series dice qué corregir y cómo se escribe («No se
entiende la carga común: va un número desde 0.»). Lo mismo en el bloque en vueltas (el aviso del descanso ocupa el
renglón de la indicación), en el objetivo del criterio (al pie de su recuadro), en la barra de las series elegidas, en el
período y en los números de los formularios de la persona. Las repeticiones, el descanso y la carga tienen su mínimo, su
máximo y su paso: con ↑ y ↓ suman o restan 1 repetición, 15 segundos o 2,5 kg, y en la fila Común, las repeticiones y el
descanso del bloque aparecen las flechitas al pasar el mouse. El pie de la tabla (cómo se lee cada valor, el
calentamiento y los atajos) va detrás de un «?». El catálogo de ejercicios, a 1280, es más ancho.

### Lo que ya estaba

- **La cabecera** (`marco-del-area.tsx`) es la misma pieza en las cuatro áreas: Entrenamiento ya tenía la franja única, el
  chip de acceso que no se parte, la vuelta como botón y «Hay datos nuevos · Ver» al volver a la pestaña. No se cambió.
- **«Empezar el plan»** (`primer-plan.tsx`) es la misma pieza que en Nutrición: la franja compacta de los tres pasos, sin el
  bloque de «Todavía no hay un plan activo» y con la fecha automática («Hoy, 13:06 · cambiar») en la evaluación.
- **«Sin indicar»:** en pantalla, el editor y la versión activa ya decían «Sin indicar»
  (`COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo` vale «Sin indicar»); «Sin objetivo» quedaba solo en dos comentarios del
  código, que se corrigieron.

### Lo que cambió

| Dónde | Qué saltaba o faltaba | Ahora |
|---|---|---|
| La tabla de series (`ejercicio-del-editor.tsx`, `planilla-de-series.ts`) | El aviso de la carga o el descanso comunes aparecía dentro de la celda y alargaba la fila mientras se escribía; las celdas de cada serie se marcaban sin decir nada; el borde de 2 px corría el valor | Cada celda se marca con el borde y una sombra (sin cambiar de tamaño); un renglón reservado debajo de la tabla (`loQueNoSeEntiendeEnLasSeries`, `textoDeLoQueNoSeEntiende`) dice la primera celda, cómo se escribe y cuántas más, y cada celda mal escrita lo nombra para el lector de pantalla |
| La barra de las series elegidas | «No se entiende el valor» aparecía al tocar «Escribir» y bajaba la tabla | Su renglón, siempre, en la barra |
| El objetivo del criterio | Su aviso, debajo del campo, desalineaba la fila (los campos se alinean por abajo) | Al pie del recuadro, en su renglón, con el nombre del campo; el campo se marca |
| El bloque en vueltas (`bloque-del-editor.tsx`) | El aviso del descanso aparecía en la cabecera del bloque y la alargaba | El renglón de la indicación está siempre en un bloque en vueltas; mientras el descanso no se entiende, el aviso ocupa ese renglón |
| Los números | Sin límites ni paso; una carga negativa o un descanso de más de una hora los rechazaba la API sin nombrar el lugar | Repeticiones de 1 a 1000, descanso de 00:00 a 60:00 y carga desde 0 (los del contrato); fuera de eso no se entienden y no se guardan. ↑ y ↓ dan un paso (1, 15 s, 2,5 kg o 5 lb; con Mayúsculas, cuatro) y las flechitas (`components/flechas-del-numero.tsx`) |
| El pie de la tabla | Tres párrafos a la vista (cómo se lee, el calentamiento, Ctrl+D) | Detrás de un «?» (`ExplicacionAPedido`), con las flechas |
| La evaluación (`resumen.tsx`) | El exceso de citas y el conflicto llevaban el mismo `id` (`trn-contexto`): el resumen los junta por `id` y mostraba dos veces el texto del conflicto | `trn-contexto-limite` y `trn-contexto-conflicto`, cada uno lleva a su lugar; el formulario, con `.avisos-con-lugar` |
| El período (`control-de-periodo.tsx`) y los números de los formularios (`forms/campos-v2.tsx`) | El aviso aparecía y corría lo de abajo | Su renglón reservado |
| El catálogo de ejercicios (`agregar-ejercicio.tsx`) | A 1280 × 800 el pie tapaba los resultados; «Agregar» sin marcar sumaba un párrafo al pie | El cajón de 35 rem desde 1280 (como desde 1440): la línea de «Con historial» ocupa un renglón menos y tres elegidos entran en uno; el pie se aprieta con poca altura; el aviso va en el título de los elegidos |
| Las bases de la carga y de las repeticiones (el recuadro del criterio) | Las opciones largas («una sola mancuerna o implemento») se cortaban en un desplegable de 12 rem y el rótulo «Qué cuentan las repeticiones» ocupaba dos renglones | 17 rem: se leen enteras |
| La revisión y el objetivo de Entrenamiento (`revisiones.tsx`, `resumen.tsx`) | Los avisos de cada campo aparecían y corrían lo de abajo | `.avisos-con-lugar` |
| Plantillas y habituales (`templates/mis-plantillas.tsx`, `templates/mis-habituales.tsx`) | Dos párrafos a la vista arriba de las plantillas y uno arriba de los habituales; el filtro «Estado» a todo el ancho de la columna | Los párrafos detrás de un «?»; el filtro, angosto |
| El editor de una plantilla (`edicion-de-plantilla.tsx`) | «Plantillas y habituales» como enlace subrayado (lo que RP-01 sacó de las áreas); la ayuda de las cargas, a la vista | La vuelta como botón fantasma con flecha, como en las áreas; la ayuda de las cargas detrás de un «?» (lo escrito en esta plantilla sigue a la vista) |

### Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D60 | En la tabla de series, la celda que no se entiende se marca en su lugar y el texto va a un renglón reservado debajo de la tabla: la primera celda, cómo se escribe y «También…» o «Y N celdas más, marcadas.» | Una tabla no tiene lugar para un renglón por celda. Alternativa: el aviso posicionado junto a la celda, como en una planilla, tapando la fila de abajo mientras dura |
| RP-D61 | Los límites del contrato valen en el website: una carga negativa y un descanso de más de 60:00 «no se entienden» y no se guardan | Antes se mandaban y la API los rechazaba sin decir dónde. No cambia el contrato |
| RP-D62 | El paso: 1 repetición, 15 segundos, 2,5 kg o 5 lb; con Mayúsculas, cuatro. Desde una celda vacía, la flecha parte del valor común; sin él, escribe 8, 01:00 o 20 kg. Un valor fuera de la grilla va al paso siguiente (62 → 62,5 con ↑). Un rango de repeticiones no tiene paso | Lo que cambia de una serie a otra en una sala. Alternativa: 1 kg y 5 s |
| RP-D63 | Las flechitas a la vista van en la fila Común, en las repeticiones y en el descanso del bloque; en la carga y el descanso de cada serie, que ya tienen la marca y su menú, solo ↑ y ↓. Aparecen con el mouse encima o con el foco (en una pantalla táctil, siempre) y no reciben el foco | Como las del campo numérico del navegador, que no sirve acá (no acepta «02:30» ni un rango). Alternativa: en todas las celdas, más angostas |
| RP-D64 | El RIR y el % RM no tienen paso ni flechitas, y el objetivo del criterio solo cambió de lugar su aviso, que ahora nombra el campo («No se entiende el objetivo: va un número.») | Los cambia el frente del RPE (DL-192) |
| RP-D65 | En un bloque «En vueltas», el renglón de la indicación está siempre; sin ejercicios queda vacío, con su alto; con el descanso mal escrito, el aviso lo ocupa | La indicación sin el descanso no dice lo que va a ver la persona |
| RP-D66 | El pie de la tabla de series (cómo se lee cada valor, el calentamiento, Ctrl+D y las flechas), detrás de un «?» | Dirección no quiere párrafos a la vista; la celda ya dice «común», «propio» o «Sin indicar» |
| RP-D67 | El catálogo: 35 rem de ancho desde 1280; con una ventana de 860 px de alto o menos, el pie con menos aire. La línea de «Con historial» queda a la vista (revisión del 15/11) y las fichas siguen debajo de su título, hasta dos renglones (revisión del tramo 2) | Alternativa: la línea de «Con historial» detrás de un «?», que ganaría dos renglones |
| RP-D68 | «Empezar el plan» de Entrenamiento conserva «Registrar la evaluación» y «Pedir información a la persona» antes de abrir la evaluación; Nutrición la abre directamente (RP-12) | La evaluación de Entrenamiento es una lista de datos libres, no el pantallazo del caso. Alternativa: abrirla directamente también |
| RP-D69 | Cada problema del resumen de la evaluación de Entrenamiento con su `id`: el exceso de citas lleva al límite de citas y el conflicto a su aviso | — |
| RP-D70 | El período (el panel de «Elegir el período») y los números de los formularios de la persona reservan el renglón de su aviso | Es la regla de RP-19 (RP-D24) en las piezas que la auditoría marcó |
| RP-D71 | Plantillas y habituales: lo que explica cada sección, detrás de un «?»; en el editor de una plantilla, la vuelta como en las áreas (RP-01) y la ayuda de las cargas detrás de un «?» | Lo mismo que se pidió para las áreas. Alternativa: dejar los párrafos, más cortos |
| RP-D72 | Ícono, número y abreviatura (RP-07) no se suman en Entrenamiento: el renglón de cada ejercicio ya dice «3 × 8 rep. · 60 kg · RIR 2» y la tabla lleva la unidad en el rótulo de la columna | Un ícono por cantidad no suma claridad donde las cantidades son de una sola clase. Alternativa: íconos en la versión activa |

### Lo que se probó

- `apps/web/test/entrenamiento-antes-de-la-prueba.test.mjs`: el paso de cada número (con su borde, la grilla y el valor
  común), los límites, el renglón de lo que no se entiende (una, dos y más celdas), dónde va cada aviso, las flechitas, el
  bloque en vueltas, el período y los formularios, los `id` de la evaluación, el catálogo y el vocabulario de lo nuevo.
- `editores-restos.test.mjs` (ED-23), al día con el renglón reservado.
- El recorrido `sinSaltos` suma el editor de Entrenamiento: una carga común que no se entiende, una negativa, un descanso de
  61:00 y unas repeticiones al revés no mueven las filas, las celdas, «Agregar serie» ni «Revisar y activar…»; todo
  corregido, el renglón queda vacío; ↑ suma 1 repetición y 2,5 kg. Con capturas.
- Las capturas de la planificación de Entrenamiento (`EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/capturas.mjs`)
  suman 1440 × 900 y 2048 × 1000, «Empezar el plan» con Héctor Funes (sintético), el descanso del bloque y la carga común
  que no se entienden.

### Lo que queda

- Ratificar RP-D60 a RP-D72.
- **El cambio de criterio** (C7): el aviso de lo que se quitó, con «Deshacer», aparece debajo del recuadro y baja las
  series. Responde a una elección y va debajo de ella; es del frente del RPE.
- **La escritura rápida:** su lectura («Se lee: …», «Se pierde: …») cambia de largo mientras se escribe y, en una ventana
  angosta, puede pasar a dos renglones. Propuesta: reservar dos renglones.
- `objetivos-por-serie.tsx` (`CampoHeredable`, `TablaDeObjetivos`) no se usa en ninguna pantalla: código muerto, que toca el
  frente del RPE.
- `docs/DEUDA_LEGAJO.md` (DL-188) no se tocó: al integrar, sumarle RP-22 y RP-D60 a RP-D72.
