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
>
> **RP-24 «Cierre de Nutrición» (22/11),** rama `wp-cierre-de-nutricion`, desde `wp-franjas-promedio-y-elegidas` (RP-23):
> las acciones sin subrayado, el «?» en la esquina, la imagen de la receta en el editor y lo BAJA que se veía. Decisiones
> **RP-D90 a RP-D99, a ratificar**. Detalle en el §11.
>
> **RP-25 «Guardar como receta» (23/11),** rama `wp-opcion-como-receta`, desde `main`: una opción de alimentos se guarda
> como receta desde el editor y ahí mismo se le carga la foto. Decisiones **RP-D100 a RP-D105, a ratificar**. Detalle en
> el §12.

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
- **Visto en la CI, de otro frente:** la escena 08 de las capturas del objetivo y el calculador
  (`EVIDENCIA/OBJETIVO-Y-CALCULADOR/herramientas/capturas.mjs`) busca `[data-frente-a-los-rangos]` en el almuerzo, y desde
  RP-20 (#309) la comida del editor muestra las franjas: la escena espera 30 s y falla. No es de esta rama (no toca
  `nutrition/**`).
- `docs/DEUDA_LEGAJO.md` (DL-188) no se tocó: al integrar, sumarle RP-22 y RP-D60 a RP-D72.

## 10. RP-23 · El promedio, y las opciones que se eligen (22/11)

> **El pedido:** Dirección, con capturas: las franjas por comida (RP-20 y RP-21) «se ven muy sucias» cuando se juntan
> todas las opciones. La franja de la comida (plegada o abierta) muestra por macro la banda del rango indicado y la marca
> del promedio, sin el punto de cada opción; al desplegar la comida, cada opción lleva una casilla y un punto de su color;
> tildada, su punto aparece en ese color en las cuatro barras, junto al promedio (lleno adentro, hueco afuera). Por
> defecto no hay nada tildado. La franja dentro de la opción abierta queda como está. El panel «Rangos y totales», con la
> misma regla. Y un arreglo: el día, cuando todavía no se puede sumar, dibujaba un punto en el medio de cada barra que no
> significaba nada. Rama `wp-franjas-promedio-y-elegidas`, desde main. Decisiones **RP-D80 a RP-D84, a ratificar**.

### En criollo

Cada comida, debajo de su encabezado, muestra ahora en cada renglón (kcal, P, C y G) solo la banda del rango y una raya:
el promedio de sus opciones. Al abrir la comida, cada opción tiene a su izquierda una casilla y un punto de color (la 1,
azul; la 2, violeta; la 3, verde azulado; la 4, magenta; la 5, gris pizarra). Si se tilda, el punto de esa opción aparece
en su color en las cuatro barras de la comida y en las de su comida en el panel: lleno si queda adentro del rango, hueco si
queda afuera. El color dice cuál es; la forma, dónde queda. Lo tildado se recuerda mientras la pestaña está abierta, por
plan. La franja de la opción abierta y la de la receta que se elige no cambiaron. En el panel, el día que todavía no se
suma deja su pista vacía, con el mismo alto, en vez del punto del medio.

### El punto del medio

Sin dato, el día dibujaba la banda de su rango sola. La escala de la franja va de 0 al doble del centro del rango
(RP-D42), así que la banda queda siempre en el medio; en la pista angosta del panel, una banda de ±10 % mide lo mismo que
un punto. Sin el tramo al lado no decía nada: parecía un dato. Ahora, sin dato, la pista queda vacía (más tenue) y vuelve
la banda con el tramo cuando el día se puede sumar (RP-D84).

### Lo que cambió

| Dónde | Antes | Ahora |
|---|---|---|
| La franja de la comida (`comida-del-editor.tsx`, `franjas-de-la-comida.tsx`) | Un punto por opción y la raya del promedio (con dos o más) | La banda y la raya del promedio; con una sola opción, la raya es su valor (`rayaDelPromedio`). Solo las opciones tildadas suman su punto (`marcasALaVista`), en su color (`data-color-de-la-opcion`) |
| La cabecera de cada opción | El botón desplegable, solo | A su izquierda, en el mismo renglón, la casilla y el punto de color (`CasillaEnLasBarras`), fuera del botón: tildar no abre la opción |
| El panel «Rangos y totales» (`rangos-y-totales.tsx`) | Un punto por opción en cada comida | La misma regla que la comida: el promedio y las tildadas, en su color |
| El día en el panel (`tramosDelDia`) | Sin dato, la banda sola en el medio de cada barra | Sin dato, la pista vacía, con su alto (`sinDato`, `data-sin-dato`) |
| Lo que oye el lector (`franjaDelRenglon`, `franjasEnPalabras`) | El rango, cada opción, el promedio y cuántas adentro | El rango, el promedio, cada opción con dónde queda (todas, tildadas o no) y cuántas adentro; al final, «En las barras, solo el promedio.» o «En las barras, el promedio y Opción 2 (violeta).» |
| «Cómo se leen los rangos y totales» (el «?» del panel) | «cada punto, una opción» | La banda, la raya del promedio (con una sola opción, su valor) y el punto de cada opción tildada, en su color |
| Los colores (`tokens.css`) | — | `--opcion-1` a `--opcion-5`, en Claro y en Azul noche, medidos por `scripts/contraste.test.cjs` |
| El estado (`opciones-en-las-barras.ts`, nuevo) | — | Vive en el editor (`useOpcionesEnLasBarras(planId)`) y se recuerda en `sessionStorage` por plan, con try/catch; sin nada tildado, no queda nada guardado |

Los colores se escriben en `tokens.css` y no en `globals.css`: es el único lugar del website donde se escribe un color
(lo exige la prueba de contraste, que falla con un color literal fuera de los tokens). `globals.css` los usa, dentro del
bloque de RP-20 y RP-21.

### Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D80 | En la comida y en el panel, la raya es el promedio de las opciones con el dato; con una sola, su valor. Los puntos, solo los de las opciones tildadas. El resumen a la derecha («1 de 3 adentro · promedio 28 g P») no cambia | Con una sola opción, sin raya, la comida quedaba con la banda sola. Alternativa: con una sola opción, su punto siempre a la vista |
| RP-D81 | Cinco colores por lugar (la 1, la 2…), que vuelven a empezar desde la sexta: azul, violeta, verde azulado, magenta y gris pizarra. 3:1 o más contra la tarjeta y el fondo suave; ΔE 20 o más entre sí y contra la banda, el foco, el error, el éxito y los enlaces; ningún matiz de juicio (ni rojo, ni ámbar, ni verde). En Azul noche, las mismas familias, más claras | Una comida rara vez pasa de cinco opciones, y la casilla y el texto dicen de cuál es cada punto. Alternativa: seis o más colores, que ya no se distinguen bien sin caer en el rojo o el verde |
| RP-D82 | Por defecto no hay nada tildado. Lo tildado vive en la pantalla y se recuerda por plan en `sessionStorage` (mientras la pestaña está abierta), con la clave del día tipo, la comida y la opción. Una opción que todavía no se guardó (o cuya comida o día tipo no se guardaron) tiene la casilla apagada hasta el autoguardado: su lugar cambia al quitar, duplicar o mover, y la marca pasaría a otra opción | La sesión basta para ir y volver o recargar, y no deja restos en la computadora. Alternativa: `localStorage`, que lo recuerda para siempre |
| RP-D83 | La casilla y el punto van a la izquierda de la cabecera de cada opción, fuera del botón que la despliega, en el mismo renglón (no cambian su alto). La etiqueta la oye el lector: «Mostrar la opción 2 en las barras de la comida (su punto es violeta)»; el punto dice su color al pasar el puntero. Las casillas están si la comida tiene franja | Dentro del botón, tildar abriría la opción. Alternativa: las casillas debajo de la franja de la comida, a la vista también plegada, con un renglón más |
| RP-D84 | El día en el panel, sin dato: la pista vacía y más tenue, con su alto; vuelve la banda con el tramo. Lo que oye el lector no cambia («Energía del día: sin dato») | La banda sola, centrada por la escala, era el «punto en el medio» que no decía nada. Alternativa: la banda sola, más tenue |

### Lo que se probó

- `apps/web/test/franjas-por-comida.test.mjs`: la raya del promedio sola por defecto, con una opción su valor; solo las
  tildadas, con su color y su forma; la paleta por lugar, que vuelve a empezar, con sus nombres y en los dos temas; lo que
  oye el lector (el promedio primero, todas las opciones y qué hay en las barras); las casillas (nada tildado por defecto,
  por plan en la sesión, un almacenamiento roto que no corta nada, la clave por comida); la casilla fuera del botón, en el
  renglón de la cabecera, con su etiqueta; los estilos en el bloque de RP-20 y RP-21; el día sin dato con la pista vacía.
- `scripts/contraste.test.cjs`: los cinco colores contra la tarjeta y el fondo suave en los dos temas, y una prueba nueva:
  se distinguen entre sí y de la banda, el foco, el error, el éxito y los enlaces, sin matiz de juicio.
- El recorrido `franjasPorComida`: plegada, solo la raya (ningún punto en la comida ni en el panel); la opción abierta,
  como estaba; tildar la casilla del arroz suma sus cuatro puntos, en su color, en la comida y en el panel, sin que cambie
  ningún alto, con el mismo color que el punto de la casilla y recordado en la sesión; con la cantidad vacía, el día deja
  la pista vacía; después, lo de siempre (la marca se mueve igual en los tres lugares, sin saltos, a cuatro anchos).

### Lo que queda

- Ratificar RP-D80 a RP-D84.
- Mirarlo en pantalla en los dos temas, con cinco opciones tildadas, a 1280 y a 1920 × 1080 con Windows al 125 %, y con un
  lector de pantalla.
- La APK no tiene franjas: no cambia.

## 11. RP-24 · Cierre de Nutrición (22/11)

> **El pedido:** Dirección está terminando el recorrido de la planificación de Nutrición y quiere cerrarla con este paquete
> para pasar a Entrenamiento. Cinco puntos: (1) no usar texto subrayado como enlace para acciones, «a menos que lo
> amerite: ensucia mucho y da aspecto de web vieja» (el ejemplo: «Cambiar el rango de Desayuno» en «Rangos indicados»);
> (2) el «?» no va al lado del título, va en la esquina superior derecha de su sección o tarjeta; (3) la imagen de la
> receta, en el editor del plan; (4) «Ver como la persona»; (5) lo BAJA abierto de las correcciones de Nutrición que se ve
> en pantalla. **El punto 4 salió del alcance** el mismo día por decisión de Dirección: queda como idea (abajo). Rama
> `wp-cierre-de-nutricion`, desde `wp-franjas-promedio-y-elegidas` (RP-23, #316, todavía sin integrar), porque toca los
> mismos archivos. Decisiones **RP-D90 a RP-D99, a ratificar**. Sin operaciones nuevas ni migraciones; no toca la APK.

### En criollo

Las acciones de la planificación dejaron de verse como enlaces azules subrayados: ahora son botones discretos, del color de
acento, sin borde ni subrayado hasta que el puntero o el teclado los tocan, y del alto de un renglón. Lo único que sigue
subrayado es lo que lleva a otro lado: el resumen de problemas que salta al campo, «Ver plan», «Ir a Revisiones», «Abrir
el borrador en Plan», abrir una receta de la lista y los enlaces a otra página. «Rangos indicados» se rediseñó: en cada
renglón, el nombre (Todo el día, Desayuno…) y a la derecha «Cambiar» (o «Indicar»); abajo, proteínas, carbohidratos y
grasas en tres columnas, con su ícono, su número y su abreviatura, alineadas entre renglones. El lector de pantalla sigue
oyendo «Cambiar el rango de Desayuno».

El «?» de una sección va arriba a la derecha y lo que explica aparece flotando debajo, encima de lo que sigue: no corre
nada (RP-19). Se cierra con Escape, con otro toque o tocando afuera. Una opción que es una receta muestra su miniatura en
la cabecera y, abierta, «Cargar la imagen» o «Cambiar la imagen», como en el cajón. Y se corrigieron seis cosas chicas que
se veían: el ajuste del objetivo con signo, el «Hay datos nuevos» de la medianoche, «Usarla ahora» que no volvía, el
renglón de la versión del objetivo que saltaba, los íconos que faltaban en las tarjetas del cuadro de la opción y el 422
genérico de Administración.

### Cuándo un enlace lo amerita (el criterio)

| Va subrayado (enlace) | Va como botón (discreto, quieto o secundario) |
|---|---|
| Lleva a otra página (`Enlace`, `Link`, `<a href>`) | Cambia algo: cambiar, quitar, duplicar, vaciar, deshacer, usar |
| Lleva a otra vista de la misma pantalla y se lee dentro de una frase: «Ver plan», «Ir a Revisiones», «Abrir el borrador en Plan», «Ir al resumen» | Abre un cuadro, un cajón o un diálogo («Indicar el rango», «Crear a mano», «Importar») |
| Salta al lugar de un problema (el resumen de errores: cada renglón es un salto, el patrón de siempre) | Despliega o pliega («Ver», «Ocultar», «Abrir todas», «Ver más») |
| Abre un elemento de una lista que funciona como índice («Abrir Avena con frutas») | Reintenta, vuelve a leer, vuelve atrás dentro de un cuadro («Volver a la búsqueda»: la vuelta es un botón, como en RP-01) |

En el código, un botón que navega lleva `data-navega` además de `boton--enlace`; todo lo demás es `boton--discreto` (nuevo,
en `globals.css` junto a `.boton--enlace`). La guardia `scripts/acciones-y-ayudas.test.cjs` recorre el JSX con el
compilador de TypeScript y falla si en la planificación (Nutrición, Entrenamiento, la evaluación, plantillas, habituales,
recetas, las piezas de `apps/web/src/app/pro/advisees/` y los componentes que usan: `texto-a-pedido`, `cuadro-enfocado`,
`campo-de-fecha`, `estados`) vuelve un `boton--enlace` sin `data-navega`, o un `<a>` con `onClick` y sin `href`.

**Lo que pasó a botón (119 lugares en la planificación, más 7 en los componentes):** en Nutrición, «Cambiar el nombre»,
«Duplicar opción n», «Quitar opción n» y las acciones de inicio de cada comida; «Cambiar el rango de…» e «Indicar el rango
de…» (la lista y cada comida); «Usarla ahora»; «Cancelar» de una comida habitual; «Borrar la búsqueda» y «Agregar como
opción: …» del cajón de recetas; «Volver a la opción», «Crear a mano» e «Importar» del cuadro de la opción; «Abrir todas» y
«Plegar todas»; «Reintentar» y «Volver a leer las tomas» del calculador; «Vaciar» de plantillas y habituales; «Guardar» y
«Cancelar» de los repartos habituales; «Ver lo que recibe»; «Cerrar», «Ver la comida diferente» y los alimentos del
buscador en Registros; «Quitar dato» y «Quitar» de los formularios. En Entrenamiento, las mismas acciones del editor (más
sesión, duplicar el día, deshacer las vueltas o la aplicación, quitar la prescripción, los días del preset, ocultar la
vuelta), el criterio, los parámetros, la selección de series, la agenda (mover, deshacer, quitar los días), el buscador de
ejercicios, «Ver los días», «Ver valores», «Ver más sesiones». En la evaluación, «Cambiar la fecha», «Usar la de ahora»,
«Ver todo», «Volver a leer», «Cambiar», «Ver respuestas», «Desvincular», «Vincular la más nueva». En plantillas, habituales
y recetas, «Ver»/«Cerrar», «Quitar», «Volver a la lista», «Quitar paso», «Limpiar búsqueda», «Retirar la imagen» y
«Cargar/Cambiar la imagen». En las piezas compartidas, «Hay datos nuevos · Ver», «Reintentar» del acceso, la versión
anterior y la siguiente del período, «Ver»/«Ocultar» de la evidencia, «Quitar», «Desmarcar todo», «Mostrar» y «Volver a
ocultar» las notas propias, «Qué hace cada resultado» y «Atrás» de la galería. En los componentes, «Cambiar» y «Agregar» de
`TextoAPedido` (la «Nota para la persona · Cambiar»), «Atrás», «Cerrar» y «Cancelar» del cuadro enfocado, «Hoy» del
calendario, «Reintentar» de los estados y «Cómo se lee esta vista».

**Lo que quedó como enlace (18 lugares), con su porqué:** el resumen de problemas del editor de Nutrición y del de
Entrenamiento, «Ir a corregir» y los «Ir a…» de la revisión del plan (saltan al lugar del problema); los atajos «Ir al
editor» e «Ir al panel» de Entrenamiento (saltos de navegación); «Ir al resumen» (Nutrición y Entrenamiento), «Ver plan»,
el primer plan, «Abrir borrador», «Ir a Revisiones», «Ver registros», «Ver revisiones» y «Abrir el borrador en Plan»
(cambian de vista, dentro de una frase); «Abrir …» en Mis recetas y en el Recetario de BE (la lista es un índice); y «Ver la
toma» de la evaluación, un `Enlace` a Antropometría. Fuera de la planificación (Seguimiento, gráficos, Antropometría,
formularios de la persona, seguridad) no se tocó nada: es un paso siguiente con la misma guardia.

### La regla del «?» en la esquina

- **La pieza:** `EncabezadoConAyuda` (en `components/explicacion-a-pedido.tsx`) arma el renglón del título con el «?» a la
  derecha. En un grupo sin renglón de título (un `fieldset`, un campo, un aviso), el contenedor lleva
  `con-ayuda-en-la-esquina` y el «?» se ubica arriba a la derecha, con su lugar reservado para no tapar el texto.
- **Lo que abre flota** (`lugar="esquina"`): debajo del «?», alineado a su derecha, encima de lo que sigue, con la sombra
  de los paneles. No ocupa lugar: abrirlo no corre lo que se está editando. Escape lo cierra y devuelve el foco al «?»;
  también otro toque o tocar afuera.
- **«Fuente» sigue en la línea** de lo que cita (el nombre del método): es una referencia, no la ayuda de la sección.
- **Dónde se aplicó:** en todo /pro (los 19 «?» que había): «Rangos y totales», «Rangos indicados» y el «Reparto por
  comida» (encabezados), la suma de los rangos y «Sugerido» del reparto, la cuenta de los gramos del objetivo, el método,
  el sexo y el factor del calculador, el «?» del recetario (que estaba adentro del `h2`), el de «Tus habituales» y
  «Plantillas de entrenamiento», las cargas de una plantilla, cómo se lee la tabla de series, el RPE y los dos avisos de
  «todavía no se puede activar». El bloque `.titulo-con-ayuda`, que lo ponía al lado del título, se retiró.
- **La guardia** (`scripts/acciones-y-ayudas.test.cjs`): en /pro y en los componentes, un «?» sin `lugar="esquina"`, un
  «?» adentro de un título o la clase `titulo-con-ayuda` hacen fallar la prueba.

### La imagen de la receta en el editor

Dirección preguntó si la imagen de la receta se carga «aquí», en el editor del plan. Ahora sí: la opción que es una receta
muestra su miniatura en la cabecera (del alto del renglón: no la agranda) y, abierta, la misma pieza del cajón
(`ImagenEnElCajon`): «Cargar la imagen de la receta» o «Cambiar la imagen de la receta», que abre el recuadro de siempre. La
imagen es de la receta: cambiarla acá la cambia en Mis recetas y en los planes que la ofrecen. Las miniaturas salen de la
lista propia (API-REC-02, una sola lectura de hasta diez páginas, solo si el plan tiene alguna receta), que ya trae las
rutas firmadas en lote: **ningún pedido por miniatura** (el límite es de 120 lecturas por minuto). Sin rutas firmadas, el
plato de respaldo, sin pedir nada (`imagenes-de-las-recetas.ts`).

### Lo BAJA que se veía en pantalla

| Qué | Antes | Ahora |
|---|---|---|
| El ajuste del objetivo («Con qué se calculó») | «−300 kcal por día», «+10 % de…» | «Déficit de 300 kcal por día», «Superávit del 10 % de las 2.450 kcal del gasto total», como se escribe en el calculador (`ajusteEnPalabras`) |
| «Hay datos nuevos» a medianoche | El conteo de registros es «dentro del período»: a las 0:00 el período corre y el conteo cambia sin que nadie registre nada | La huella lleva el período; con otro período, el conteo no se compara (lo nuevo lo dice la fecha del último registro) |
| `objetivoPedido` | Quedaba en `true` después de guardar: si llegaba otra versión del objetivo, el borrador pasaba a usarla sin «Usarla ahora», y el botón no volvía | Vuelve a `false` cuando el borrador cita el objetivo vigente |
| El renglón de la versión del objetivo | «Vigente desde…» pasaba a «Versión 3, vigente desde…» al llegar el número y saltaba de renglón, corriendo la tira | Va en su propio renglón (`flex-basis: 100%`) |
| Los íconos en las tarjetas | El cuadro de la opción («Al instante», «Rango de…») mostraba los macros sin ícono | Cada macro con su ícono, y la fibra con el suyo (RP-07) |
| El 422 de /admin/recipes | «No está disponible» para todo | «Esta propuesta ya se decidió…», «No se puede sumar: tiene alimentos cargados a mano…» o «No se pudo guardar la decisión…» (`textoDeLaDecision`) |

**Lo que no se hizo, y por qué:**

- **Kerr «quedó dentro del 4 %»:** el texto es la población de los seis métodos de Kerr en el catálogo antropométrico
  (`scripts/catalogo-antropometrico/catalogo-metodos.cjs` y la migración `20261121150000_kerr_cinco_componentes`). Va en la
  base: cambiarlo pide una migración nueva del catálogo, que este paquete no hace (sin migraciones). Texto propuesto:
  «…y la diferencia quedó por debajo del 4 % del peso medido, salvo en fisicoculturistas (8 % del peso medido)».
- **«Sin anotar» contra «Sin indicar»:** «Sin anotar» está solo en la APK (`apps/mobile/src/selector-de-rpe.tsx`, el
  selector del RPE). La APK no se toca en este paquete: va en su próxima versión.
- **El renglón «Indicado» de la comida plegada y el aviso de la cantidad** (RP-19 §7.4, del frente de las barras):
  siguen anotados; no se vieron en el recorrido de Dirección.

### Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D90 | Las acciones de la planificación son botones discretos (`boton--discreto`): color de acento, sin borde ni subrayado hasta el puntero o el foco, 2 rem de alto. El subrayado queda para la navegación (tabla de arriba), marcada con `data-navega`. «Rangos indicados»: nombre y acción corta («Cambiar» o «Indicar») en el renglón, y los tres macros en tres columnas iguales debajo; el lector oye la acción completa | Un ícono de lápiz habría pedido un ícono nuevo en la familia (la APK y el website comparten 129) y no dice «indicar» cuando no hay rango. Alternativa: el renglón entero tocable, con una flecha |
| RP-D91 | El «?» va en la esquina superior derecha de su sección, tarjeta o grupo, y lo que abre flota (no ocupa lugar). Escape, otro toque o tocar afuera lo cierran. «Fuente» sigue en su línea | Desplegado en el lugar, el «?» corría lo de abajo (RP-19). Alternativa: un diálogo, que tapa más y pide cerrarlo |
| RP-D92 | La miniatura de la receta, en la cabecera de la opción; cargar o cambiar la imagen, con la opción abierta (la misma pieza del cajón). Las rutas, de la lista propia en lote, una vez por pantalla; si vencen (15 minutos), queda el plato hasta volver a abrir el editor | Releer la lista sola cada 15 minutos gasta lecturas sin que nadie mire. Alternativa: releerla al volver a la pestaña |
| RP-D93 | «Hay datos nuevos» compara el conteo de registros solo dentro del mismo período | El conteo es «dentro del período»: corre solo a medianoche. Alternativa: sacar el conteo de la huella (un registro cargado con fecha de otro día no se notaría) |
| RP-D94 | Administración dice por qué no se decidió una propuesta (ya decidida, con alimentos cargados a mano, un dato que no se acepta) | Un 422 tiene su explicación; «no disponible» es para la red y el servicio |
| RP-D95 | El ajuste guardado se dice en palabras y sin signo, como se escribe: «Déficit de 300 kcal por día» | Igual que el calculador (RP-05). Por dentro se sigue guardando con su signo |
| RP-D96 | «Usarla ahora» se cumple y se apaga cuando el borrador cita el objetivo vigente | Si queda prendido, una versión del objetivo posterior entra sin pedirla |
| RP-D97 | Las tarjetas del cuadro de la opción llevan el ícono de cada macro y de la fibra | Es la misma cantidad que en el editor (RP-07) |
| RP-D98 | La versión del objetivo, en su propio renglón | Llega después que el objetivo y cambia de largo. Alternativa: reservar el ancho del texto largo |
| RP-D99 | «Ver como la persona» queda como idea para después, por decisión de Dirección del 22/11 | Ver abajo |

### Idea para después: «Ver como la persona»

Que el profesional vea el plan en preparación como lo va a ver la persona en la app: una acción en el editor de Nutrición
que abre un cajón con un marco de teléfono, con el día tipo, las comidas, el carrusel de opciones (flechas, puntitos y
«Opción n de m»), la foto grande 16:10 o la miniatura de reemplazo, los macros con ícono, número y abreviatura, la nota
para la persona y «Comí esta opción» inactivo; con los textos de `apps/mobile/src/pantallas/nutricion-hoy.tsx`,
`carrusel-de-opciones.ts` y `COPY_REGISTRO_DE_COMIDAS`, y «Así lo va a ver {nombre} cuando actives el plan». Solo lectura
del borrador en pantalla, sin pedidos nuevos salvo las imágenes firmadas (las de RP-D92 ya sirven). Dirección la sacó del
alcance el 22/11: no se empezó.

### Lo que se probó

- `scripts/acciones-y-ayudas.test.cjs` (nuevo, en `npm test`): la guardia de las acciones y los «?», y una prueba de que
  reconoce lo que tiene que rechazar.
- `apps/web/test/cierre-de-nutricion.test.mjs` (nuevo): «Hay datos nuevos» a medianoche, el ajuste en palabras,
  `objetivoPedido`, el renglón de la versión, los íconos de las tarjetas, el 422 de Administración, «Rangos indicados», el
  «?» que flota y la miniatura con las rutas en lote (`recetasDelPlan`, `porReceta`).
- Las pruebas de RP-21, RP-22, RP-07, RP-08, RP-19 y del RPE, al día con la pieza nueva.
- El recorrido de navegador `cierreDeNutricion` (`test/navegador/recorridos.mjs`): a 1440 con el panel abierto, el «?»
  del día contra el borde derecho, que al abrirse no corre nada y que Escape cierra y devuelve el foco; «Rangos
  indicados» con «Cambiar» o «Indicar» sin subrayado y los macros alineados; ningún botón subrayado en el editor ni en el
  panel salvo los que navegan.
- Por la memoria del equipo no se corrió el chequeo de tipos completo del website ni el navegador en local: los corre la
  CI. El CSS se verificó con postcss y `scripts/contraste.test.cjs` (no hay colores nuevos).

### Lo que queda

- Ratificar RP-D90 a RP-D99.
- Mirarlo en la pantalla de Dirección (1920 × 1080, Windows al 125 %, el navegador del 75 al 100 %), en Claro y en Azul
  noche, y con un lector de pantalla (el «?» que flota y «Cambiar» con su nombre completo).
- La misma guardia de acciones, fuera de la planificación (Seguimiento, gráficos, Antropometría, formularios de la
  persona).
- Kerr y «Sin anotar» (arriba), y «Ver como la persona» si Dirección la retoma.

## 12. RP-25 · Una opción de alimentos que se guarda como receta, con su foto (23/11)

> **El pedido de Dirección (23/11):** una opción del plan armada con alimentos sueltos (por ejemplo, «Galletas de arroz con
> huevo») no podía tener imagen, porque la imagen es de la receta (DL-191 y RP-24). Elián quiere convertirla en receta
> desde el editor y cargar la foto ahí mismo: «así no carga muchas fotos para cada plan; una vez que carga una foto es
> porque se vuelve una de sus recetas». Rama `wp-opcion-como-receta`, desde `main`. Decisiones **RP-D100 a RP-D105, a
> ratificar**. Sin operaciones nuevas ni migraciones: usa API-REC-01 (crear la receta), API-ALI-04 (la versión de cada
> alimento) y API-REC-05 (la imagen), como Mis recetas. No toca la APK.

### En criollo

En una opción de alimentos con algo adentro aparecen dos accesos. Al lado de su cabecera, donde una receta muestra su
miniatura, «Agregar foto» (un botón discreto con el ícono de la imagen); con la opción abierta, junto a «Cambiar el
nombre», «Guardar como receta». Los dos abren el mismo cuadro: si se llegó por la foto, la primera línea explica que una
foto es de una receta y que, para sumarla, la opción se guarda en Mis recetas y pasa a ser esa receta. Debajo, lo que
lleva para una porción («Avena, 50 g, Crudo») y que la persona ve los mismos alimentos y cantidades. Si algo no entra en
una receta (un alimento sin cantidad o sin estado, una cantidad en unidades), se dice alimento por alimento y el botón
queda apagado con su porqué. Al guardar, la receta queda en Mis recetas (versión 1), la opción pasa a ser esa receta y el
mismo cuadro ofrece cargar la foto con el recuadro de siempre. Al volver al plan, la miniatura está en la cabecera.

### Cómo funciona

- **La receta** (API-REC-01): el nombre de la opción, sus alimentos con su cantidad y su estado, **una porción**, sin
  pasos. Con una porción, la que el servidor arma para el plan (DL-119, `cantidadDeUnaPorcion`) es la misma que la persona
  ya tenía. La versión del catálogo de cada alimento se lee en el momento (API-ALI-04, por identidad), porque una receta
  cita versiones. Una clave de idempotencia por cuerpo: reintentar sin respuesta no crea dos recetas.
- **La opción pasa a ser esa receta** en el borrador, como si se la hubiera agregado desde el cajón: conserva su identidad
  (`optionId`) y su nombre, y cita la versión 1 (`recipeVersionId`, `items: []`). Se busca por su identidad, o por su
  lugar y su nombre si todavía no se guardó, y el cambio se aplica sobre la estructura vigente: si mientras tanto llegó un
  autoguardado, sus identificadores no se pierden. Viaja con el autoguardado siguiente; un guardado que estaba en vuelo
  no la pisa (cuenta como una edición posterior), y un 409 sigue el camino de siempre (`VERSION_CONFLICT`, ED-61).
- **La foto**, en el mismo cuadro, con `ImagenDeReceta` (`imagen-de-receta.tsx`, la pieza de Mis recetas y del cajón).
- **La miniatura de la cabecera:** API-REC-05 no devuelve las rutas firmadas de una receta propia, así que una imagen
  recién cargada en esta pantalla se pide una vez por su medio (API-MED-03). Es un pedido por cada imagen que se carga, no
  por miniatura: las demás siguen saliendo de la lista propia en lote (RP-D92). Lo mismo vale para la imagen que se carga
  o cambia en el cuerpo de una opción de receta, que hasta ahora dejaba el plato de respaldo en la cabecera
  (`imagenDeLaCabecera`).
- **Las reglas vigentes:** las dos acciones son `boton--discreto` (sin subrayado); el acceso de la cabecera va al lado del
  botón de la cabecera, no adentro (un botón no va dentro de otro) y no agranda el renglón; el error del pedido tiene su
  renglón reservado al pie del cuadro (`RenglonDelAviso`, RP-19). Sin «%» y sin las palabras prohibidas.
- **Archivos:** `opcion-como-receta.ts` (la lógica, sin React), `guardar-como-receta.tsx` (el cuadro),
  `comida-del-editor.tsx` (los dos accesos), `editor.tsx` (el cuadro y la opción que cambia), `imagenes-de-las-recetas.ts`
  (`imagenDeLaCabecera`) y `globals.css` (`.opcion-plegable__foto`, junto a `.opcion-plegable__fila`).

### Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué / alternativa |
|---|---|---|
| RP-D100 | La receta se crea directo, sin pasar por el editor de recetas: el nombre de la opción, sus alimentos con su cantidad y su estado, una porción y sin pasos. La versión de cada alimento es la vigente, leída al guardar | Dirección pidió hacerlo en un paso. Con una porción, la persona ve las mismas cantidades. Alternativa: abrir el editor de recetas lleno con la opción (más completo, pero un paso más y un formulario largo) |
| RP-D101 | En la cabecera, «Agregar foto» con el ícono de la imagen, al lado del botón de la cabecera, solo en las opciones de alimentos con algún alimento. Su nombre accesible y su `title` dicen «se guarda como receta»; la primera línea del cuadro lo explica | «Agregar foto · se guarda como receta» a la vista en cada opción repetiría lo mismo hasta doce veces por comida. Alternativa: ese texto largo a la vista |
| RP-D102 | Lo que una receta no admite se dice antes, alimento por alimento, y no se guarda nada: un alimento sin cantidad o sin estado de preparación, una cantidad que no se entiende, en unidades, con más de un decimal (revisión adversaria: la porción del plan la arma el servidor con un decimal, así que 2,25 g pasaría a 2,3 g y 0,04 g a 0, que deja el borrador sin poder guardarse) o de más de 5000 g o ml, más de 40 alimentos o notas de más de 500 caracteres en total | Completarlo o redondearlo solo (por ejemplo, el estado «Tal como se adquiere») cambiaría lo que ve la persona sin que nadie lo decida. Alternativa: dejar que lo diga el servidor (un error menos claro) |
| RP-D103 | Las notas de los alimentos pasan a la descripción de la receta, una por renglón («Huevo: bien cocido»), que la persona lee junto a la receta. Las medidas caseras («2 cucharadas») quedan en gramos: solo las veía el profesional | Una receta no tiene notas por ingrediente; sin esto, la persona dejaría de leerlas. Alternativa: no dejar guardarla con notas |
| RP-D104 | La opción conserva su identidad y su nombre, y pasa a citar la versión 1. Si mientras tanto ya no está (se quitó), la receta igual queda en Mis recetas y el cuadro lo dice, sin deshacerla. El autoguardado no se pausa: el cambio se aplica sobre la estructura vigente | Son dos escrituras sin transacción conjunta, como la receta nueva de ED-32. Conservar la identidad mantiene lo que ya la cita. Alternativa: borrar la receta si la opción no está (otra escritura que puede fallar) |
| RP-D105 | Una imagen recién cargada en esta pantalla se pide una vez por su medio para la miniatura de la cabecera; las demás, de la lista en lote (RP-D92) | API-REC-05 no firma las rutas de una receta propia. Alternativa: que API-REC-05 las devuelva (un cambio de la API) |

### Lo que se probó

- `apps/web/test/opcion-como-receta.test.mjs` (nuevo, en `npm test`): lo que impide, el cuerpo de API-REC-01 (una porción,
  las notas en la descripción, el nombre), el alimento que el catálogo ya no devuelve y el 422 con su ruta, la opción que
  pasa a citar la receta (por identidad aunque se mueva, por lugar y nombre si es nueva, el reintento), la miniatura de
  una imagen recién cargada, los dos accesos como botones discretos y las palabras prohibidas.
- `cierre-de-nutricion.test.mjs` y `franjas-por-comida.test.mjs`, al día con la miniatura y el acceso nuevo.
- El recorrido de navegador `opcionComoReceta` (`test/navegador/recorridos.mjs`): en el borrador de las franjas, «Agregar
  foto» en la cabecera de «Avena» (sin subrayado y fuera del botón de la cabecera), el cuadro con lo que lleva, «Guardar
  como receta», la receta en Mis recetas con una porción y 50 g crudos, la foto cargada en el mismo cuadro, la miniatura
  en la cabecera sin agrandar el renglón y el borrador guardado con la opción que cita la receta.
- Por la memoria del equipo no se corrió el chequeo de tipos completo del website ni el navegador en local: los corre la
  CI. Se revisaron los tipos de los archivos nuevos y del editor por separado. El CSS se verificó con postcss y
  `scripts/contraste.test.cjs` (no hay colores nuevos).

### Lo que queda

- Ratificar RP-D100 a RP-D105.
- Hecho en la revisión adversaria (23/11): cerrar el cuadro después de un pedido sin respuesta conserva la clave de
  idempotencia (volver a intentarlo no crea otra receta), y al cerrar, el foco vuelve a la cabecera de la opción, porque el
  acceso que abrió el cuadro ya no está.
- Mirarlo en la pantalla de Dirección y con un lector de pantalla (el nombre accesible de «Agregar foto»).
- Si Dirección lo quiere, «Guardar como receta» también desde una comida habitual o una plantilla.
