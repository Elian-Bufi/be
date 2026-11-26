# WP-GRAFICOS-DEL-EJERCICIO · Los gráficos del ejercicio: la progresión, la serie por serie y la historia (DL-204)

**Estado:** PROGRAMADO en `entrenamiento/graficos-del-ejercicio`, desde `entrenamiento/presets-por-nivel` (#332, que
incluye #329) con `entrenamiento/progresion-por-ejercicio` (#330, DL-201) unida. PR en borrador, sin integrar. Las
decisiones GE-D01 a GE-D12 están **a ratificar** por Dirección. Registro: **DL-204** en `docs/DEUDA_LEGAJO.md`.

**Origen.** El pedido de Dirección del 2026-11-26: en el panel lateral del editor, el gráfico «<Ejercicio>: la carga por
semana» tiene que decir qué progresión lo rige, mostrar la progresión aplicada y llevar al cuadro de «Progresión…»; hace
falta un gráfico «Serie por serie»; y los dos tienen que mostrar lo anterior y lo realizado.

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. El panel solo muestra: lo que configura sigue en los
cuadros (ET1-D20). No hay API nueva ni migración: todo sale de lecturas que el panel ya hacía. La APK no se toca.

## 0. En criollo

El profesional abre la sentadilla de Diego en el editor. En el panel de la derecha, arriba del gráfico de la carga por
semana, lee «Progresión: **Lineal · +2,5 kg/sem · descarga S4** (la de la fase)» y, al lado, «Cambiar progresión…», que
abre el cuadro ancho con la sentadilla ya elegida. El gráfico empieza unas semanas antes de la fase: lo que el plan le
indicaba a Diego esos días va en una línea tenue punteada, lo que levantó va en puntos llenos, y una línea vertical marca
«Inicio del plan». Después, este plan con su progresión, con la semana de descarga sombreada.

Debajo, «Sentadilla: serie por serie»: una barra por serie, A1 y A2 más suaves (las aproximaciones), S1 a S4 llenas,
desde 0, y la línea punteada «1RM 101,5 kg». Al pasar por una barra se lee «25 kg · 25 % del 1RM». Con «Semana» elige S3
y ve cómo quedan las series con la progresión; si esa semana ya tiene registro, cada serie lleva su punto con lo que hizo.
Nada se pinta de rojo ni de verde y nada dice cuánto «cumplió».

## 1. Alcance

| # | Qué | Dónde |
|---|---|---|
| GE-01 | La regla que rige al ejercicio, en palabras y con su origen, arriba del gráfico. | `packages/domain/src/graficos-del-ejercicio.ts` (`reglaEnPalabras`, `origenEnPalabras`); `panel-de-la-parte-b.tsx` |
| GE-02 | «Cambiar progresión…» abre el cuadro ancho de DL-201 con el ejercicio elegido. | `editor.tsx` (`cargaPorSemanaDe`) |
| GE-03 | La historia hacia atrás: lo planificado antes y lo realizado, hasta 12 semanas antes del inicio de la fase, con el separador. | `graficos-del-ejercicio.ts` (`historiaAntesDelInicio`, `cargasPlanificadasDelEjercicio`, `cargasRealizadas`); `grafico-de-semanas.tsx` (`separador`, `nombreDeColumna`, la forma `antes`) |
| GE-04 | La leyenda fija con los tres y el renglón de los registros («Sin registros todavía»), reservado. | `panel-de-la-parte-b.tsx`, `globals.css` (junto a los gráficos de las semanas) |
| GE-05 | «Serie por serie»: las series en orden, desde 0, las aproximaciones más suaves, el 1RM punteado y el tooltip con la base. | `apps/web/.../training/serie-por-serie.tsx`; `seriesParaElGrafico`, `textoDeLaBarra` |
| GE-06 | El selector de semana, con la progresión que rige aplicada a cada serie. | `serie-por-serie.tsx` con `prescripcionDeLaSemana` |
| GE-07 | Lo realizado de la semana elegida, sobre cada serie. | `vezDeLaSemana`, `lecturaDeLaSerie` |
| GE-08 | «% del 1RM» como porcentaje con su base en la regla de los términos prohibidos. | `packages/domain/src/copy-entrenamiento.ts` |

## 2. Decisiones del continuador, a ratificar

| # | Decisión | Por qué |
|---|---|---|
| GE-D01 | **Ninguna lectura nueva.** Lo planificado antes y lo realizado salen de la misma lectura de 91 días que ya hace «La vez pasada» (API-TRN-21, contexto de revisión), que respeta el alcance: solo personas vinculadas con acceso a Entrenamiento. | Reusar antes que sumar API; el límite de 12 semanas entra en los 91 días. |
| GE-D02 | **«Planificado antes» es lo que indicaba el plan ese día**: la carga de trabajo de la prescripción en la instantánea de cada sesión registrada (`plannedSession`), que la API ya entrega con la carga de esa semana (DL-198). Es de la versión o del plan que regía, sea cual sea. Las semanas sin una sesión registrada quedan sin dato: no se reconstruyen las versiones viejas del plan. | Es el dato honesto y ya está; leer las versiones anteriores y proyectar sus fases pediría una lectura nueva y supondría fechas que no se registraron. |
| GE-D03 | **Hasta 12 semanas antes del inicio de la fase,** y solo desde la más vieja con algún dato: un ejercicio nuevo, sin historia, se ve como hoy (sin columnas de antes ni separador). | Lo pidió Dirección como límite razonable; columnas vacías no dicen nada. |
| GE-D04 | **Lo realizado va en puntos llenos, sin línea que los una,** en los dos gráficos (también en las semanas de la fase). Lo planificado antes, punteado y tenue (`--tenue`), con puntos huecos. | «Sin línea de juicio»: unir los puntos sugiere una tendencia que se lee como evaluación. |
| GE-D05 | **La leyenda tiene siempre los tres** (Planificado antes, Este plan, Realizado), aunque falte alguno; el renglón de los registros está siempre y dice «Leyendo los registros…», «Sin registros todavía» o nada. | RP-19: nada se mueve al llegar los registros. |
| GE-D06 | **Lo realizado de una semana es lo más alto registrado** (de las series con carga, en la unidad del ejercicio), el mismo criterio que ya usaba el gráfico de la fase. Los gráficos de Fuerza usan el máximo estimado, que sigue aparte, en rombos. | Coherencia con lo que BE ya muestra. |
| GE-D07 | **«% del 1RM»** se permite como porcentaje con su base nombrada, junto a la carga («25 kg · 25 % del 1RM»). Sin 1RM de referencia (o en otra unidad), no hay porcentaje. | Regla de producto: «%» siempre con su base; la parte del 1RM es su base. |
| GE-D08 | **El 1RM de referencia** es el vigente del ejercicio (API-RMX-01, `BE-E1RM` v2), leído con el mismo gancho del renglón del 1RM; el eje Y llega hasta él si es más alto que las cargas. | Es el que usa el % RM del plan; dibujarlo cortado escondería la base del porcentaje. |
| GE-D09 | **Serie por serie, en barras** (la carga planificada de esa semana) con **lo realizado en un punto lleno** sobre cada serie, en el segundo color (`--metrica-2`). Las aproximaciones, el mismo color con menos relleno y el borde entero. | Forma y color distinguen (TB-03); el borde mantiene el 3:1 en los dos temas. |
| GE-D10 | **La vez que se superpone** en «Serie por serie» es la más reciente de la semana elegida, de este mismo ejercicio y serie por serie; se nombra su fecha y su sesión. Se empareja por el número de serie (`setIndex`); una serie realizada de más se suma al final. | Con dos sesiones del ejercicio en la semana, mezclar las series de las dos no sería ninguna de las dos. |
| GE-D11 | **El selector de semana** arranca en la semana de hoy, si cae en la fase; si no, en la 1. Nombra la descarga y «esta semana». | Lo que más se mira es lo que viene. |
| GE-D12 | **Dónde va cada cosa:** la regla, «Cambiar progresión…» y «Serie por serie» van en el panel del ejercicio abierto; en los favoritos del plan, solo el gráfico de la carga por semana. El cardio no lleva «Serie por serie» ni «Cambiar progresión…». El separador dice «Inicio del plan» en la primera fase y «Inicio de la fase» en las demás. | Los favoritos son una vista de lectura; el cardio no tiene series de carga. |

## 3. Compatibilidad y la APK

- Sin migración ni contrato nuevo de la API. La lectura de «La vez pasada» suma a lo que ya tenía las sesiones leídas,
  dentro del website.
- `GraficoDeSemanas` suma dos propiedades opcionales (`separador`, `nombreDeColumna`) y una forma (`antes`); los que ya
  lo usaban (la vista previa de «Progresión…», los favoritos) siguen igual, salvo que lo realizado ya no lleva línea.
- La APK no cambia.

## 4. Pruebas

- Dominio: `packages/domain/src/graficos-del-ejercicio.test.ts` (TEST-GE-01 a 08): la regla en palabras, la semana antes
  del inicio con el tope, la historia, el ejercicio sin historia, lo planificado antes desde la instantánea, la serie por
  serie con la progresión y el 1RM, la vez de la semana y los términos prohibidos.
- Web: `apps/web/test/graficos-del-ejercicio.test.mjs` (TEST-GE-WEB-01 a 07). TEST-EE-56 se ajusta a las semanas de antes.
- Estilos: `node -e 'require("postcss").parse(...)'`, `scripts/contraste.test.cjs` y `scripts/acciones-y-ayudas.test.cjs`.

## 5. Lo que queda

- Ratificar GE-D01 a GE-D12 (sobre todo GE-D02, qué es «planificado antes»; GE-D04, lo realizado sin línea también en
  la fase; GE-D09, barras y punto).
- Mirarlo en pantalla con Dirección, en los dos temas, a 1280 y 1920: con una persona con historia (Diego Sosa) y con un
  ejercicio nuevo.
- Si Dirección quiere lo planificado antes también en las semanas sin sesión registrada, hace falta una lectura de solo
  lectura de las versiones anteriores del plan de la persona (con su alcance y sus pruebas): queda afuera de este paquete.
