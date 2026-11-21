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
