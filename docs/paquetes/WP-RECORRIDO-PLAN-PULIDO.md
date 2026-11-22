# WP-RECORRIDO-PLAN-PULIDO · El recorrido de la planificación: cabecera, calculador y reparto por comida

> **El pedido de Dirección (21/11):** Elián recorrió la planificación de Nutrición en el escritorio profesional (1920 ×
> 1080, Windows al 125 %, el navegador al 75 %) y pidió «ponete a solucionar todo, empezá ya».
>
> Rama `wp-recorrido-plan-pulido`, desde `main` (aef7c87e). Registro: **DL-188** en `docs/DEUDA_LEGAJO.md`. Las decisiones
> de continuador (**RP-D01 a RP-D17**) están **a ratificar**. No se integra sola. En paralelo, `wp-evaluacion-inicial-2`
> (otro frente) es dueño de `primer-plan.tsx`, `evaluacion/`, `forms/`, la evaluación dentro de `nutrition/formularios.tsx`
> y el texto «Todavía no hay un plan activo»: este paquete no los toca (de `formularios.tsx`, solo el objetivo y el
> calculador).

## 0. En criollo

La cabecera de cada área queda en una franja: la vuelta como botón («Espacio profesional» o «Ficha de Ana»), el área, la
persona, el acceso en un chip y, a la derecha, el contexto. Ya no hay «Actualizar» ni «Consultado a las»: al volver a la
pestaña, BE se fija solo si hay algo nuevo y lo dice con «Hay datos nuevos · Ver». El calculador del objetivo se llama
«Calcular», usa la toma con un toque, esconde detrás de «?» y «Fuente» lo largo (la fórmula y la cuenta siguen a la
vista), pide el ajuste como «Déficit» o «Superávit» sin signos y suma la ecuación para deportistas de ten Haaf (2014). El
reparto por comida sale del objetivo y pasa al plan, a la vista en cada día tipo. Cada cantidad de kcal o de macros lleva
su ícono, y la cuenta de los gramos del objetivo del día queda detrás de un «?».

## 1. Alcance (RP-01 a RP-09)

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
| RP-20 | Las franjas por comida (§7): en cada comida, plegada o abierta, un renglón por kcal, P, C y G con la banda del rango indicado, una marca por opción y la del promedio, y «3 de 4 adentro · promedio 28 g P»; la misma franja con la opción abierta sola (en vivo, también en su cuadro) y una porción de cada receta al elegirla, con «Primero las que entran» | `franjas-por-comida.ts`, `franjas-de-la-comida.tsx`, `comida-del-editor.tsx`, `cuadro-de-la-opcion.tsx`, `editor.tsx` (`ElegirReceta`), `globals.css` |
| RP-21 | «Rangos y totales» rediseñado (§7): el día arriba, con sus íconos y su tramo frente al rango del día; cada comida con lo que aportan sus opciones y su franja compacta; lo que no suma, una vez y en chico | `rangos-y-totales.tsx`, `franjas-de-la-comida.tsx`, `editor.tsx` (`rangos` del panel), `globals.css` |

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

- Ratificar RP-D01 a RP-D17.
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

## 7. RP-20 y RP-21 · Las franjas por comida y «Rangos y totales» (22/11)

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
