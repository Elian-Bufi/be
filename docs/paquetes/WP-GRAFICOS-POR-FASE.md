# WP-GRAFICOS-POR-FASE · Los gráficos por período corto, por versión del plan, y lo indicado frente a lo hecho

> **El pedido de Dirección (20/11), después de mostrarle gráficos de un año a un profesor de powerlifting:** «En 12 meses
> se ven demasiado cargados los datos: ¿se pueden poner en 3 meses o por los ciclos o fases? ¿Se puede definir qué tan
> grandes? ¿Y qué tal entre lo planificado y lo realizado?». Antes había pedido la **franja** (si el plan indica de 8 a 10
> repeticiones, el gráfico pinta el rango indicado y marca lo que hizo) y el **volumen programado frente al hecho**.
>
> Rama `wp-graficos-por-fase`, desde `main` (76c35aba). Registro: **DL-187** en `docs/DEUDA_LEGAJO.md`. Las decisiones de
> continuador (**GPF-D01 a GPF-D13**) están **a ratificar**. No se integra sola.

## 0. En criollo

1. **Un solo selector de período en todos los gráficos de la persona.** El cuadro del ejercicio, «Patrones» (de la ficha
   y del plan), «Analizar», «Armá tu gráfico» y los cruces eligen el período igual: 4 semanas, 12 semanas, 6 meses, un año,
   desde que la acompañás, a medida (dos fechas) y **por versión del plan**: se elige una versión de Entrenamiento o de
   Nutrición y el período es exactamente lo que rigió, con «La anterior» y «La siguiente» a la vista para recorrerlas.
2. **La franja.** En «Carga, repeticiones y RIR» (GR-03), el rango de repeticiones indicado (y la carga sugerida, si la
   hay en esa unidad) va de fondo, en gris, en escalones según la versión que rige; lo registrado se marca encima, y cada
   punto dice dónde queda: «dentro de lo indicado (8 a 10 rep)», «2 por encima de lo indicado (8 a 10 rep)». Ubica, no
   califica: ni colores de juicio ni palabras de juicio.
3. **Lo indicado y lo hecho del volumen.** Un gráfico nuevo en el historial del ejercicio: las series indicadas frente a
   las hechas y la carga × repeticiones indicada frente a la hecha, por sesión o por semana. Las tres series nuevas
   («Series indicadas», «Carga × repeticiones indicada» y «… hecha») se pueden sumar en «Armá tu gráfico».
4. **«Patrones» deja elegir el ejercicio.** Abre con el básico (sentadilla, press de banca, peso muerto…) con más sesiones
   del período; antes era siempre el más registrado, y salían accesorios.

La «Fase» del plan (DL-181) no tiene fechas: el período por fase se elige por la **versión** (GPF-D01).

## 1. Alcance (GPF-01 a GPF-11)

| ID | Qué | Dónde |
|---|---|---|
| GPF-01 | Este paquete y DL-187 | `docs/paquetes/WP-GRAFICOS-POR-FASE.md`, `docs/DEUDA_LEGAJO.md` |
| GPF-02 | El selector único: el control de período de la ficha (`ControlDePeriodo`) con las opciones de los gráficos, en el cuadro del ejercicio, en «Patrones» del plan y, en la ficha, en «Patrones» y «Analizar» (que llevan los cruces y «Armá tu gráfico») | `control-de-periodo.tsx`, `graficos/selector-de-periodo-de-graficos.tsx`, `seguimiento/barra.tsx`, `historial-del-ejercicio.tsx`, `patrones-del-plan-en-pantalla.tsx` |
| GPF-03 | Las opciones y sus reglas, puras: 4 y 12 semanas, 6 meses, un año, desde que la acompañás (el último año si fue antes, y se dice), a medida (hasta 366 días, sin pasar de hoy) | `graficos/periodo-de-los-graficos.ts` |
| GPF-04 | Por versión del plan: la vigencia exacta de una versión activada de Entrenamiento o de Nutrición (`etapasDelArea`, la misma etapa de «Comparar etapas»), con «La anterior» y «La siguiente»; en la ficha viaja en la dirección (`etapa=TRAINING:<id>` con `desde` y `hasta`; `p=vinculo`) | `periodo-de-los-graficos.ts`, `graficos/etapas-de-la-persona.ts`, `seguimiento/estado.ts` (`periodoDeLaFicha`) |
| GPF-05 | La franja de lo indicado en GR-03 (repeticiones y carga sugerida), en escalones por versión, y la ubicación de cada punto en su lectura y en la tabla | `graficos/entrenamiento/franja-de-lo-indicado.ts`, `carga-repeticiones-y-rir*.ts(x)`, `carriles.ts`, `paneles-alineados.tsx`, `marcas.tsx` |
| GPF-06 | «Series y carga × repeticiones: lo indicado y lo hecho»: dos paneles alineados, lleno lo hecho y hueco lo indicado, por sesión o por semana, en el historial del ejercicio | `graficos/entrenamiento/programado-y-hecho.ts` y `-en-pantalla.tsx` |
| GPF-07 | Tres series nuevas del catálogo, del comparador (API-TRN-21 y API-SER-01): `entrenamiento.series-indicadas`, `entrenamiento.carga-por-repeticiones-indicada` y `…-hecha`, para «Armá tu gráfico» | `packages/domain/src/series-disponibles-entrenamiento.ts`, `graficos/lecturas.ts` |
| GPF-08 | «Patrones»: elegir el ejercicio de los gráficos; abre con el básico con más sesiones | `graficos/patrones/patrones.ts`, `cuerpo-de-patrones-en-pantalla.tsx` |
| GPF-09 | Pruebas de unidad de lo puro y de lectura de las pantallas: TEST-GPF-001 a 013; ajuste de dos pruebas de GR-03 que leían el código | `apps/web/test/graficos-por-fase.test.mjs`, `graficos-entrenamiento.test.mjs` |
| GPF-10 | Capturas en la CI del entorno del tutor: «Patrones» de Tomás en 12 semanas, el selector abierto, una versión elegida y la anterior, la franja en la sentadilla y las series y la carga × repeticiones en «Armá tu gráfico» (trae `capturasDeGraficos` de `capturas-graficos-para-max`) | `scripts/entorno-del-tutor/ci.mjs` |
| GPF-11 | Lenguaje: nada de «asesorado», «cumplimiento», «adherencia», «racha», «puntaje», «estación» ni «volumen» en pantalla; «Sin indicar» | la guardia `terminosProhibidosEnUnGrafico` en TEST-GPF-007, 010, 011 y 013 |

Sin migraciones, sin operaciones nuevas en la API y sin cambios en la APK.

## 2. Las lecturas y la autorización (GPF-04, GPF-07)

- **Nada nuevo en la API** (GPF-D10). Las versiones se leen de API-PRJ-01 (`TRAINING_PROGRESSION_BY_EXERCISE` y
  `NUTRITION_PRESCRIBED_VS_RECORDED`, que ya devuelven `planVersions`) en el último año, que es su tope (366 días). Lo
  indicado y lo hecho salen del comparador que ya leen GR-03 y GR-05: API-TRN-21 en tramos de 92 días (su tope) y API-SER-01
  por versión. La API decide con el PDP en cada lectura: un área que este profesional no acompaña responde 404 y no ofrece
  versiones ni series; no hay caché de datos de salud en el navegador.
- **Lo anterior al vínculo no se dibuja** (TB-16): todo período lleva el día del vínculo y el eje empieza ahí.
- **Ningún tope se amplía.** Un período a medida tiene hasta 366 días; una versión más larga se ve en sus últimos 366, y se
  dice; «desde que la acompañás» con más de un año es el último año, y se dice.

## 3. Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué |
|---|---|---|
| GPF-D01 | **Por fase = por versión del plan.** La «Fase» de DL-181 no tiene fechas (es la etapa del contenido, sin semanas): el período que se puede elegir con exactitud es la vigencia de una versión activada. Si Dirección quiere elegir una fase dentro de una versión, hace falta que la fase lleve su duración (una DL nueva) o armar una versión por fase | Inventar la fecha de una fase desde las sesiones registradas diría «la fase duró» lo que solo es «se registró» |
| GPF-D02 | **Por omisión:** el cuadro del ejercicio y «Patrones» del plan abren en 12 semanas (ya era así); la ficha sigue en 90 días, porque comparte el período con Resumen y Línea de tiempo y 90 días son casi 12 semanas; la composición corporal sigue en un año (las tomas son cada cuatro a seis semanas). Ningún gráfico abría el año entero por omisión: el año aparece cuando se lo elige | Cambiar el por omisión de la ficha movería los números del Resumen sin que nadie lo pidiera |
| GPF-D03 | A medida: hasta 366 días contando los dos, sin pasar de hoy | El tope de las lecturas de un año |
| GPF-D04 | En la ficha, las opciones de los gráficos van solo en «Patrones» y «Analizar»; Resumen y Línea de tiempo siguen con 7, 30 y 90 días y un año. La dirección acepta los atajos de las dos listas: lo elegido en una vista sigue en la otra | Un período, una sola dirección |
| GPF-D05 | «Por versión del plan» ofrece las versiones del último año de las dos áreas, cada una en su grupo, la vigente primero; una versión activada y reemplazada el mismo día no se ofrece (no tiene un día entero) | `etapasDelArea` y su regla del día del corte |
| GPF-D06 | **La franja ubica, no califica:** gris, sin color de juicio; la lectura dice «dentro de lo indicado (8 a 10 rep)», «2 por encima…», «1 por debajo…» o «igual a lo indicado (5 rep)». Si una misma versión indica rangos distintos en distintas sesiones del plan, la franja va del menor al mayor y lo dice («según la sesión del plan»); la marca hueca de cada sesión sigue diciendo la suya | B05: describir sin juzgar |
| GPF-D07 | Un % RM indicado no es una franja en el panel de la carga: BE no lo convierte a kg (09v10:356), y la nota lo dice | Sin base válida para convertir |
| GPF-D08 | **La convención de carga × repeticiones (DL-187):** la suma de carga × repeticiones de las series efectivas (sin calentamiento), con la carga como se registró (con mancuernas, por mancuerna: BE no suma implementos), en una sola unidad. Lo indicado: carga sugerida × repeticiones indicadas; un rango de repeticiones da un rango. Si a una serie le falta la carga o las repeticiones (o es un % RM), lo indicado de esa sesión queda «Sin indicar». Una sesión «no realizada» aporta 0; un registro resumido o un ejercicio sin registrar son sin dato, nunca 0. Una semana con una sesión sin dato no tiene total | La misma regla de «sin registro no es cero» del comparador |
| GPF-D09 | **En pantalla no se dice «volumen»**: es un término prohibido de Entrenamiento (B10-06, `TERMINOS_PROHIBIDOS_DE_ENTRENAMIENTO`, TEST-GRF-021). Se dice «carga × repeticiones» (kg·rep). Si Dirección quiere la palabra, hay que enmendar la lista con una DL | No se cambia una guardia del legajo sin ratificar |
| GPF-D10 | Las series y la carga × repeticiones se calculan en el website desde el comparador, sin operación nueva de API; el volumen de la proyección (`entrenamiento.volumen-carga-externa`, `TRAINING_VOLUME_BY_EXERCISE`) sigue sin ofrecerse. Por eso «Volumen de carga» no aparecía para la sentadilla en «Armá tu gráfico»: no aparecía para ningún ejercicio (estado `PIDE_DL`, sin convención) | Lo mismo que ya leen GR-03 y GR-05, con la misma autorización |
| GPF-D11 | Por grupo muscular, no en este paquete: pide los grupos de cada ejercicio en la lectura del comparador | No era barato |
| GPF-D12 | «Patrones» abre con el básico (la lista de la v1 del 1RM estimado) con más sesiones del período; si no hay, el de más sesiones. No se filtra «del plan vigente»: el índice del período no lo dice. Un ejercicio fijo de un enfoque se respeta; un gráfico de la carga no toma un ejercicio sin carga. La elección vive en la pantalla y no se guarda | Lo más útil sin una lectura más |
| GPF-D13 | En el cuadro del ejercicio y en «Patrones», la franja dura la vigencia de cada versión (las vigencias ya leídas); en «Analizar», y con una versión cuya vigencia no se leyó, va del primer al último día con sesiones de esa versión | Una lectura menos donde no hace falta |

## 4. Lo que queda

- Ratificar GPF-D01 a GPF-D13 (sobre todo D01, la fase sin fechas, y D09, la palabra «volumen»).
- Por grupo muscular (GPF-D11).
- Llevar el gráfico de series y carga × repeticiones a «Patrones» como sugerido (hoy está en el cuadro del ejercicio y,
  armado, en «Armá tu gráfico»).
- La prueba con un lector de pantalla del selector abierto y de «La anterior» / «La siguiente».
