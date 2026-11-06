# Cartera con historia y concurrencia: dónde se va el tiempo (segunda medición, 2026-10-28)

Encargo nocturno del 2026-10-28, §13 (trabajo adicional A). Corrida **40660575008** de GitHub Actions, en un runner
`ubuntu-24.04` (AMD EPYC 9V74, 4 CPU virtuales = 2 núcleos con 2 hilos, 15,6 GB), Node 22.23.2 y PostgreSQL 16.15 en un
contenedor de la misma máquina. **Un resultado de acá describe esa máquina: no dice nada de Render.** La primera medición
(corrida 40641148313, en el [LEEME](LEEME.md)) queda como referencia: sus archivos no se tocaron.

Todo lo de esta página sale de los archivos de [`resultados/concurrencia-2026-10-28/`](resultados/concurrencia-2026-10-28/):
cada pedido medido está en `muestras.jsonl`, cada lote en `lotes.jsonl`, y el resumen generado en `resumen.md`.

## En criollo: lo que se ve

**Un profesional usando el sistema.** Con 200 personas en su cartera, la primera página de pendientes tarda unos 2 s en
esta máquina (mediana 1,9 a 2,0 s; con historia en las tres áreas, 2,3 s). Pero el website no pide una página: pide
hasta cuatro seguidas, y **cada página vuelve a procesar la cartera entera**. Abrir el espacio profesional con 200
personas lleva unos 8 s (9 s con historia) y deja 2.400 filas nuevas en la historia de decisiones de acceso. El tiempo
crece en línea con las personas (unos 10 ms por persona y por página). De cada página, solo un 10 % es PostgreSQL
ejecutando consultas: el resto es esperar que el disco confirme cada una de las 200 decisiones (una transacción por
persona) y las 2.300 idas y vueltas entre la API y la base.

**Varias personas a la vez.** Con 3 profesionales leyendo su cartera al mismo tiempo, cada página tarda 1,5 veces más y
la máquina atiende el doble. Con 5, cada página tarda 2,1 veces más (4,1 a 4,2 s) y la máquina atiende 2,4 veces más
(1,16 páginas por segundo). Pasar de 3 a 5 casi no suma capacidad (+15 a +21 %) y sí demora (+38 a +49 %). No hubo un
solo error: ningún 5xx, ningún tiempo agotado, ningún reintento ni deadlock.

**El límite que se vio.** La capacidad se aplana en unas 1,16 páginas por segundo con 5 profesionales, sin que se agote
nada del todo: la máquina usó 2,5 de sus 4 núcleos, el hilo de Node estuvo ocupado el 60 % del tiempo y la API usó sus
5 conexiones a la base (el máximo que Prisma abre por omisión en esta máquina). Lo que más esperan las conexiones activas
es escribir y confirmar en el registro de transacciones de PostgreSQL (el WAL): entre el 54 y el 59 % de las veces que
se las miró. Lo compatible con los datos es que las 200 confirmaciones por página hacen fila para el disco, y que las
idas y vueltas pasan por el único hilo de la API.

**Lo que no se puede concluir todavía.** Nada sobre Render: ahí la base está en otra máquina (cada una de las 2.300
idas y vueltas cruza la red), la CPU y el disco son otros. Tampoco cuántos profesionales reales aguanta: los clientes de
esta prueba piden sin pausa, no se probó con más de 5, ni con personas registrando comidas al mismo tiempo, ni con meses
de historia. Y el mismo arnés anterior, en dos máquinas «iguales» de GitHub, dio 1,2 s y 1,7 s con 200 personas: solo
se compara dentro de una corrida. Una corrida exitosa no es un rendimiento aceptado.

## La tabla principal

Latencia medida en el cliente, en ms. Cada lote, después de su propio calentamiento; los escenarios clave, dos veces
(«r1» al principio de la corrida, «r2» al final). **Ningún pedido falló** (los fallidos estarían en la latencia y se
contarían aparte).

| Escenario | Qué es | Pedidos por lote | r1: p50 · p95 · máx. | r2: p50 · p95 · máx. | Páginas por segundo (r1 · r2) |
|---|---|---|---|---|---|
| S-B50 | Un profesional, 50 personas, perfil base | 50 | 498 · 794 · 845 | 649 · 1.573 · 2.167 | — |
| S-B100 | Un profesional, 100 personas | 50 | 1.029 · 1.484 · 1.818 | 929 · 1.418 · 2.616 | — |
| S-B200 | Un profesional, 200 personas | 50 | 1.980 · 3.333 · 3.911 | 1.898 · 2.543 · 2.912 | — |
| S-B200 sin instrumentar | Lo mismo, sin ninguna instrumentación | 50 | 2.001 · 2.892 · 3.630 | 1.960 · 2.966 · 3.331 | — |
| S-H200 | Un profesional, 200 personas con historia | 50 | 2.285 · 3.683 · 3.962 | 2.354 · 3.594 · 4.701 | — |
| C1 | 1 profesional en bucle cerrado, 200 personas | 50 | 1.905 · 2.687 · 4.455 | 1.976 · 2.660 · 3.634 | 0,49 · 0,49 |
| C3 | 3 profesionales a la vez, 200 personas cada uno | 150 | 2.781 · 4.480 · 5.471 | 3.048 · 4.063 · 4.492 | 1,01 · 0,96 |
| C5 | 5 profesionales a la vez, 200 personas cada uno | 250 | 4.136 · 5.645 · 7.271 | 4.216 · 5.383 · 5.741 | 1,16 · 1,16 |
| A-B200 | Apertura completa, 200 personas: por página | 90 (15 aperturas de 6 páginas) | 1.760 · 2.917 · 3.391 | — | — |
| A-H200 | Lo mismo, con historia: por página | 90 (15 aperturas de 6 páginas) | 2.164 · 2.850 · 3.181 | — | — |

Con todas las repeticiones juntas, el perfil base da: 50 personas, p50 579 ms (p95 1.104); 100, p50 988 (p95 1.418);
200, p50 1.943 (p95 2.912). «Páginas por segundo» solo tiene sentido en los lotes concurrentes: en los secuenciales hay
una pausa fija entre pedidos.

## Dónde se va el tiempo de una página

### La cuenta completa de un pedido

Promedios por pedido de cada lote, en ms. «SQL» es la ejecución de las sentencias en PostgreSQL (`pg_stat_statements`,
pedido por pedido); «confirmar» es el tiempo sincronizando el WAL con el disco (`pg_stat_wal`), que ocurre después de
cada COMMIT y no entra en la ejecución de la sentencia; «transacción abierta esperando a la API» es el tiempo en que
una conexión tiene una transacción abierta y espera la sentencia siguiente (`idle_in_transaction_time`): las idas y
vueltas entre la API y la base.

| | S-B200 r1 | S-B200 r2 | S-H200 r1 | C1 r1 | C5 r1 |
|---|---|---|---|---|---|
| Latencia media del pedido | 2.167 | 1.977 | 2.430 | 2.061 | 4.279 |
| Activo en la base | 831 (38 %) | 607 (31 %) | 761 (31 %) | 888 (43 %) | 1.411 (33 %) |
| · de eso, SQL ejecutándose (mediana por pedido; en C1 y C5, promedio del lote) | 207 (10 %) | 218 (11 %) | 276 (11 %) | 214 (10 %) | 360 (8 %) |
| · de eso, confirmando en el disco | 607 (28 %) | 370 (19 %) | 465 (19 %) | 658 (32 %) | 321 (8 %) |
| · de eso, otras esperas en la base | ~17 | ~19 | ~20 | ~16 | ~730 (17 %) |
| Transacción abierta esperando a la API | 1.003 (46 %) | 1.023 (52 %) | 1.283 (53 %) | 976 (47 %) | 2.260 (53 %) |
| Fuera de transacciones (sesión, paso 1, entre una decisión y otra, HTTP) | ~333 (15 %) | ~347 (18 %) | ~386 (16 %) | ~197 (10 %) | ~608 (14 %) |
| Sentencias por pedido | 2.328 | 2.328 | 2.998 | 2.328 | 2.328 |
| Transacciones confirmadas por pedido | 206 | 206 | 206 | 206 | 206 |

- **Una página con 200 personas ejecuta 2.328 sentencias en 206 transacciones**, siempre las mismas: 200 del PDP (una
  por persona, cada una con BEGIN, bloqueos, hechos, registro y COMMIT), 1 de lectura de pendientes y 5 sentencias
  sueltas (la sesión y la consulta de vínculos). Con 50 personas son 588; con 100, 1.168: 11,6 por persona más 8 fijas.
- **PostgreSQL ejecutando consultas es apenas el 8 al 11 % del tiempo.** Lo demás es esperar al disco y las idas y
  vueltas. En concurrencia, «otras esperas en la base» (1.050 ms con 5 profesionales, casi todo esperar que otra
  conexión termine de escribir el WAL) reemplaza a «confirmando en el disco»: una sola sincronización confirma varias
  transacciones, y las demás esperan su turno.

### Por bloque: el PDP y la lectura

Medianas por pedido del servidor, en ms (instrumentación por pedido).

| Lote | Total | PDP (de la primera decisión a la última) | p95 del PDP | ms por decisión | Lectura de pendientes | p95 de la lectura | PDP / total |
|---|---|---|---|---|---|---|---|
| S-B50 r1 | 497 | 258 | 559 | 6,1 | 229 | 240 | 55 % |
| S-B100 r1 | 1.029 | 568 | 1.026 | 6,1 | 457 | 479 | 55 % |
| S-B200 r1 | 1.979 | 1.083 | 2.453 | 6,4 | 879 | 911 | 57 % |
| S-B200 r2 | 1.895 | 968 | 1.642 | 5,3 | 893 | 961 | 53 % |
| S-H200 r1 | 2.284 | 1.016 | 2.416 | 5,8 | 1.250 | 1.324 | 46 % |
| C1 r1 | 1.905 | 1.188 | 1.953 | 6,7 | 712 | 733 | 63 % |
| C3 r1 | 2.780 | 1.582 | 3.207 | 8,6 | 1.243 | 1.298 | 57 % |
| C5 r1 | 4.134 | 2.338 | 4.272 | 12,8 | 1.752 | 2.054 | 59 % |
| C5 r2 | 4.213 | 2.428 | 3.423 | 12,4 | 1.812 | 2.076 | 58 % |

- **El PDP es algo más de la mitad del tiempo; la lectura, algo menos.** Lo que pasa entre los bloques (sesión, consulta
  de vínculos, orden y respuesta) es de 5 a 12 ms.
- **La lectura es casi toda idas y vueltas:** con 200 personas, unas 1.320 sentencias suman 21 ms de SQL en la base, y
  el bloque tarda 880 ms.
- **La cola (p95) sale del PDP, no de la lectura ni del ruido:** la lectura casi no varía (879 → 911 ms), el PDP sí
  (1.083 → 2.453). El pedido más lento de S-B200 r1 (3.911 ms) y el más rápido (1.594 ms) ejecutaron las mismas 2.329 y
  2.328 sentencias, con el mismo tiempo de SQL (212 y 203 ms), los mismos registros de WAL y ninguna lectura de disco.
  La diferencia está en decisiones sueltas de 300 a 480 ms (lo normal es 3,5 ms), dentro de transacciones del PDP y
  fuera de la ejecución de SQL. Lo único que el PDP hace además de sus sentencias es confirmar 200 veces, y confirmar
  espera al disco: es la explicación compatible con los datos (no se midió la espera de cada COMMIT por separado).
- **El recolector de basura de Node no explica la cola:** pesa 17 a 22 ms por pedido en los secuenciales de 200
  personas, igual en los rápidos y en los lentos.

## Varios profesionales a la vez

| Lote | Clientes | p50 (ms) | Páginas por segundo | Concurrencia efectiva | Hilo de Node ocupado | Núcleos del proceso de Node | Núcleos ocupados de la máquina (de 4) | Conexiones de la API (máx.) | Activas en la base (máx. · promedio) | Esperas de las conexiones activas |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 r1 | 1 | 1.905 | 0,49 | 1,00 | 18 % | 0,47 | 0,77 | 5 | 1 · 0,47 | IO:WALSync 130 · CPU 56 · ClientRead 8 |
| C3 r1 | 3 | 2.781 | 1,01 | 2,97 | 46 % | 1,11 | 2,08 | 5 | 3 · 1,27 | CPU 299 · LWLock:WALWrite 241 · IO:WALSync 173 · ClientRead 32 |
| C5 r1 | 5 | 4.136 | 1,16 | 4,97 | 59 % | 1,32 | 2,53 | 5 | 5 · 2,05 | LWLock:WALWrite 698 · CPU 657 · IO:WALSync 326 · ClientRead 65 |
| C5 r2 | 5 | 4.216 | 1,16 | 4,98 | 60 % | 1,33 | 2,57 | 5 | 5 · 1,89 | CPU 682 · LWLock:WALWrite 574 · IO:WALSync 293 · ClientRead 67 |
| C3 r2 | 3 | 3.048 | 0,96 | 3,00 | 44 % | 1,07 | 2,02 | 5 | 3 · 1,36 | CPU 316 · LWLock:WALWrite 265 · IO:WALSync 231 · ClientRead 37 |
| C1 r2 | 1 | 1.976 | 0,49 | 1,00 | 19 % | 0,50 | 0,88 | 5 | 1 · 0,45 | CPU 94 · IO:WALSync 84 · ClientRead 6 |

- **Bucle cerrado:** cada profesional tiene siempre un pedido en vuelo, así que la concurrencia efectiva es la pedida
  (3,0 y 5,0). Es una prueba de esfuerzo: un profesional real no abre su cartera 50 veces seguidas.
- **«Esperas»** cuenta las conexiones activas de la API vistas en cada estado, cada 250 ms (una conexión activa sin
  espera está usando CPU). Con 5 profesionales, entre el 54 y el 59 % de esas observaciones son escribir o sincronizar
  el WAL.
- **Las conexiones:** la API nunca pasó de 5, el máximo que Prisma abre por omisión en esta máquina (núcleos físicos ×
  2 + 1 = 2 × 2 + 1). Con 5 clientes, las 5 estuvieron en uso; con más, los pedidos esperarían una conexión. **No se
  midió con más de 5.**
- **El SQL también se encarece:** la misma página pasa de ~214 ms de SQL con un profesional a ~360 ms con cinco, y cada
  decisión del PDP, de ~6 ms a ~12,6 ms.
- **La CPU de PostgreSQL proceso por proceso no se usa:** el arnés sumaba los procesos vivos y, cuando Prisma cerraba una
  conexión ociosa con mucha CPU acumulada, la diferencia daba negativa (en 7 de los 18 lotes de `resumen.md`; en otros,
  demasiado baja para ser cierta). La CPU de la máquina, que sí es exacta, da el total: lo que no es el proceso de Node
  (PostgreSQL y el sistema) va de 0,3 núcleos con un profesional a 1,2 con cinco. Para otra corrida, la cuenta tiene que
  hacerse proceso por proceso.

## La apertura completa y el cursor

La paginación ocurre **después** de procesar toda la cartera (`paginarCartera` en `lectura-cartera.ts`): cada página,
también la que se pide con el cursor, vuelve a decidir con el PDP por cada persona, vuelve a leer todo y vuelve a dejar
3 filas por persona en `decision_de_acceso`. Lo confirma la medición:

| Página | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| A-B200: p50 (ms) | 2.001 | 1.760 | 2.112 | 1.715 | 1.651 | 1.727 |
| A-B200: filas nuevas de decisión | 600 | 600 | 600 | 600 | 600 | 600 |
| A-H200: p50 (ms) | 2.227 | 2.089 | 2.353 | 2.196 | 2.360 | 2.057 |
| A-H200: filas nuevas de decisión | 600 | 600 | 600 | 600 | 600 | 600 |

| Apertura | Páginas | Ítems | Tiempo de toda la lista: p50 · p95 | Las primeras 4 páginas (lo que lee el website de una vez): p50 | Filas de decisión: toda la lista · primeras 4 |
|---|---|---|---|---|---|
| A-B200 | 6 | 260 | 11.164 · 14.848 ms | 7.938 ms | 3.600 · 2.400 |
| A-H200 | 6 | 279 | 13.269 · 15.785 ms | 9.178 ms | 3.600 · 2.400 |

El website (`apps/web/src/app/pro/espacio-profesional.tsx`, `DE_LA_CARTERA = { limite: 50, paginas: 4 }`) lee la
cartera de a 50 y hasta 4 páginas seguidas, para contar los pendientes de cada vista; «Ver más» lee otras 4. El máximo de
`limit` es 50 (`LIMITE_MAXIMO`, `apps/api/src/http/paginacion.ts`).

## Las filas de auditoría

- **Cada pedido medido dejó exactamente 3 filas por persona** en `decision_de_acceso`, contadas por su `request_id`:
  150, 300 o 600, sin ninguna excepción en los 1.580 pedidos medidos y los 90 de calentamiento, también en concurrencia.
  Ninguna fila quedó sin su pedido: las 922.500 filas que se agregaron durante la medición son exactamente la suma de
  las de cada pedido.
- **Las 3 filas son una por área del catálogo**, también en las áreas sin vínculo (en el perfil base, la mitad de las
  decisiones de cada página es de un área en la que la persona no tiene vínculo).
- **Cuánto ocupan:** la tabla pasó de 32.860 filas (12,5 MB) a 955.360 (362,8 MB) en la hora de medición: unos 400
  bytes por fila con sus índices. Una página con 200 personas agrega unos 230 KB; una apertura del website (4 páginas),
  unos 0,9 MB; la lista completa (6 páginas), unos 1,4 MB. **La tabla no se borra (solo se agrega).** Como ejemplo, no
  como medición: un profesional con 200 personas que abre su espacio 20 veces por día agregaría 48.000 filas y unos
  18 MB por día.

## La historia

| Filas de la cartera, contadas en la base | B200 (perfil base) | H200 (con historia) |
|---|---|---|
| Personas | 200 | 200 |
| Vínculos aceptados: Nutrición · Entrenamiento · Antropometría | 200 · 100 · 0 | 200 · 100 · 50 |
| Versiones de plan nutricional activadas · en borrador | 40 · 0 | 180 · 60 |
| Versiones de plan de entrenamiento activadas | 0 | 80 |
| Procesos abiertos: Nutrición · Entrenamiento | 40 · 0 | 120 · 80 |
| Próximas revisiones (cadena) · revisiones nutricionales | 0 · 0 | 255 · 60 |
| Comidas registradas (personas con comidas) | 0 | 7.620 (120) |
| Sesiones de entrenamiento registradas (personas) | 0 | 1.920 (80) |
| Solicitudes de formulario (respondidas) | 0 | 67 (33) |
| Tomas antropométricas registradas · en preparación (mediciones) | 0 · 0 | 100 · 25 (100) |
| Pendientes (páginas de 50) | 260 (6) | 279 (6) |

Pendientes de H200 por área y tipo: Nutrición, 40 sin plan activo, 60 con borrador, 30 con revisión vencida y 30 con
revisión próxima; Entrenamiento, 34 formularios sin responder, 20 sin plan, 20 con revisión vencida y 20 próxima;
Antropometría, 25 tomas en preparación. La siembra de la historia no tuvo errores.

**Qué cambia con la historia:** la página pasa de 2.328 a 2.998 sentencias (todas las áreas y más hechos por persona) y
el SQL de 207 a 276 ms (el conteo de comidas registradas pasa de 0,01 a 0,17 ms por persona). La lectura de pendientes
crece de 880 a 1.100–1.250 ms; el PDP no cambia (las mismas 200 decisiones). La página entera, de 1,9–2,0 s a 2,3–2,35 s
(+15 a +24 %). **El costo crece más por la cantidad de idas y vueltas que por el volumen de datos:** con 21 días de
comidas por versión y 8 semanas de entrenamiento, el volumen todavía no pesa. Más meses de historia no se midieron.

## Repeticiones, deriva y la máquina

- **Entre la primera y la segunda repetición**, los escenarios de 100 y 200 personas quedaron dentro de un 10 % (S-B200,
  1.980 y 1.898 ms; C5, 4.136 y 4.216). El de 50 personas se corrió: 498 → 649 ms de mediana y 794 → 1.573 de p95. Al
  final de la corrida, cada sincronización del WAL tardaba en promedio 7,7 ms, contra 2,7 ms al principio; la base había
  pasado de 12,5 a 363 MB solo en decisiones, y los checkpoints (cada 5 min, `postgres.log`) escribían hasta el 69 % de
  `shared_buffers` (128 MB) en cada pasada. **El mismo escenario empeoró por lo que le pasaba a la base, no por ruido.**
- **La velocidad de confirmar en el disco varía entre lotes** (de 1,6 a 7,7 ms por sincronización en promedio) y explica
  buena parte de la diferencia entre repeticiones: S-B200 r1 tardó 190 ms más en promedio que r2, y esperó 237 ms más al
  disco.
- **La máquina importa mucho:** el arnés anterior, sin cambios, dio en este runner 449, 1.228 y 1.713 ms de mediana con
  50, 100 y 200 personas (`control/`), contra 312, 617 y 1.233 en el runner de la referencia. Son dos máquinas del mismo
  tipo de GitHub. Las comparaciones valen dentro de una misma corrida.

## Cuánto cuesta medir

El escenario de 200 personas se corrió dos veces sin ninguna instrumentación (ni las envolturas en la aplicación ni las
estadísticas del servidor), intercalado con los instrumentados:

| S-B200 | Pedidos | p50 | p95 | Media |
|---|---|---|---|---|
| Instrumentado (r1 y r2) | 100 | 1.943 | 2.912 | 2.072 |
| Sin instrumentar (r1 y r2) | 100 | 1.976 | 2.892 | 2.088 |

La diferencia (−33 ms, −2 %) es menor que la que hay entre dos repeticiones del mismo escenario: **la instrumentación no
tiene un costo que se pueda distinguir** en secuencial. En concurrencia no se midió sin instrumentación (no hay un lote
concurrente sin instrumentar).

## Comparación con la primera medición

| Personas | Referencia 40641148313 (otro runner): p50 · p95 | Control: el arnés anterior en este runner: p50 · p95 | Esta medición, instrumentada (100 pedidos): p50 · p95 | Sin instrumentar (100 pedidos): p50 · p95 |
|---|---|---|---|---|
| 50 | 312 · 336 | 449 · 643 | 579 · 1.104 | — |
| 100 | 617 · 870 | 1.228 · 1.721 | 988 · 1.418 | — |
| 200 | 1.233 · 1.495 | 1.713 · 3.090 | 1.943 · 2.912 | 1.976 · 2.892 |

- **Lo que se repite:** el crecimiento en línea (unos 6 ms por persona en la referencia, unos 10 en este runner) y las
  3 filas por persona y por lectura.
- **Lo que no se separó:** por qué el arnés nuevo dio 13 % más que el control en la misma máquina con 200 personas.
  Hay varias diferencias a la vez: la base de la medición nueva tiene 1.350 personas (el control, 350) y su tabla de
  decisiones creció 30 veces durante la corrida, las pausas son de 0,1 s y no de 2,4 s, el cliente HTTP es otro y el
  contenedor de PostgreSQL también. No hay corridas que las aíslen.

## Qué cambia respecto de la primera medición

| | Primera medición (40641148313) | Segunda medición (esta) |
|---|---|---|
| Carteras | Una sola, que crece de 50 a 100 y a 200 personas | Ocho carteras, cada una de un profesional distinto: 50, 100, cinco de 200 (perfil base) y una de 200 con historia |
| Perfil de las personas | Nutrición; la mitad también Entrenamiento; una de cada cinco con plan nutricional | El mismo (perfil base), y además un perfil con historia en las tres áreas |
| Concurrencia | No: una lectura por vez | 1, 3 y 5 profesionales leyendo a la vez, cada uno su cartera |
| Páginas | La primera (50 ítems) | La primera, y la apertura completa: todas las páginas con el cursor |
| Observaciones | 20 por tamaño, después de 3 de calentamiento | 50 por cliente y por lote, después de 3 de calentamiento por cartera; los escenarios clave, dos veces |
| Desglose del tiempo | No | Por pedido: el bloque de decisiones del PDP, la transacción de lectura y el resto; las sentencias de la base y su tiempo |
| Filas de `decision_de_acceso` | Promedio, por diferencia de conteos | Por pedido, contadas por su `request_id` |
| Transacciones | Aproximadas (`pg_stat_database` con 1,2 s de pausa) | Exactas por pedido (los COMMIT de `pg_stat_statements`) y por lote (`pg_stat_database` con 11,5 s de asentamiento) |
| La máquina | Latencia y conteos | Además: hilo de Node, CPU del proceso y de la máquina, recolector de basura, WAL, checkpoints, autovacuum y, en concurrencia, la actividad de la base cada 250 ms |
| PostgreSQL | Testcontainers (`postgres:16-alpine`) | La misma imagen (`postgres@sha256:0cefaabd…5731ab`) en un contenedor propio, con `pg_stat_statements` precargado |

## Qué se midió exactamente

**El código de producto es el mismo de la primera medición:** `main` en `e4512cb`. La rama de trabajo
(`wp-cartera-concurrencia-2026-10-28`) parte de `194820d` (la cabeza del PR #219), que no cambia nada en `apps/`,
`packages/`, `prisma/`, `package.json`, `package-lock.json` ni `.nvmrc` respecto de `e4512cb`
(`git diff --stat e4512cb 194820d -- apps packages prisma package.json package-lock.json .nvmrc` sale vacío). El arnés que
corrió es el del commit `1c59099`; la corrida salió de la rama descartable `medicion/cartera-concurrencia-2026-10-28`
(`d6d588b`), que solo agrega el flujo `.github/workflows/medicion-cartera-concurrencia.yml` y **no se integra**.

| Archivo (`test/rendimiento/`) | Qué hace |
|---|---|
| `cartera-concurrencia.rendimiento.ts` | El arnés: siembra las carteras, corre los lotes, guarda cada muestra |
| `soporte-medicion.ts` | La instrumentación y las lecturas de la base y de la máquina |
| `soporte-poblacion.ts` | Los dos perfiles de población y el inventario de filas |
| `analizar-concurrencia.mjs` | El análisis: lee las muestras crudas y escribe `resumen.md` y `resumen.json` (sin dependencias) |
| `cartera.rendimiento.ts` | El arnés de la primera medición, **sin cambios de comportamiento** (solo se corrigió su comentario «sin correr todavía»); se volvió a correr como control |

**La instrumentación agregada, sin tocar el código de producto.** Se monta desde el arnés sobre la aplicación ya
construida y se saca entre un lote y otro:

- Un middleware de observación (el gancho `antesDeIniciar` de `appDePrueba`, después del request id) abre un contexto
  por pedido de `GET /api/v1/me/portfolio` con `AsyncLocalStorage`.
- `PdpService.decidirPorAlcance` se envuelve en la instancia que inyecta Nest (una propiedad propia que tapa el método de
  la clase): cuenta cada decisión, su duración y el tramo de la primera a la última.
- `PrismaService.$transaction` se envuelve igual. Dentro de una decisión, la transacción es del PDP (más de una por
  decisión sería un reintento: no hubo ninguno); fuera, es la transacción de lectura de pendientes.
- En PostgreSQL: `pg_stat_statements` (también las sentencias internas de las funciones), `track_io_timing`,
  `track_wal_io_timing` y `track_functions`, prendidos con `ALTER SYSTEM` y recarga, y apagados en los lotes «sin
  instrumentar». Su costo está en «Cuánto cuesta medir».
- Las lecturas del arnés van por otra conexión, a la base `postgres` del mismo servidor: no se mezclan con las de la API
  en `pg_stat_database` ni en `pg_stat_statements`, que se filtran por la base medida.
- Cada lote verificó que las envolturas estuvieran puestas (o quitadas) como correspondía: en los 18, sí.

## Las poblaciones

Todo es sintético (correos en `example.invalid`), sembrado por la API real con los ayudantes de las pruebas de
integración, salvo lo que se aclara. 1.350 personas y 8 profesionales; la siembra tardó 276 s, en cuatro carriles.

- **Perfil base** (B50, B100 y B200-1 a B200-5): el mismo recorrido de la primera medición (`poblarHasta`): cada
  persona con el vínculo de Nutrición; una de cada dos, también con Entrenamiento; una de cada cinco, con un plan
  nutricional activado.
- **Perfil con historia** (H200; `soporte-poblacion.ts`, `personaConHistoria`), con g = i mod 10:
  - Nutrición, todas: g 0 a 2, plan v1 activado con 21 días de almuerzo y cena registrados, una comida de hoy, una
    revisión MANTENER aplicada y la sucesora v2 activada con otros 21 días (con g 0, además, un borrador v3); g 3 a 5,
    plan v1 activado con 21 días de comidas; g 6 y 7, solo un borrador; g 8 y 9, sin plan.
  - Entrenamiento, una de cada dos: vínculo; con g distinto de 8, plan activado y 24 sesiones en las 8 semanas
    anteriores; una de cada tres de ellas con una solicitud de formulario sin responder y otra con una respondida.
  - Antropometría, una de cada cuatro: vínculo y dos tomas registradas; una de cada ocho, además una en preparación.
  - La próxima revisión de los planes rota entre «hace 10 días», «en 3 días», «en 30 días» y «sin fecha».
  - **Por SQL** (con los mismos ayudantes de las pruebas de integración), porque la API no permite sembrarlo en el
    pasado: las sesiones de entrenamiento de semanas anteriores (la API solo abre una sesión de un día en que esa versión
    ya regía) y las tomas antropométricas registradas. Pasan por los disparadores de la base (versión activada, una
    sesión por día, la fecha de la ocurrencia).
- **Lo que se declara es lo contado en la base al terminar de sembrar** (la tabla de «La historia»), no este diseño.
- **Semillas:** no hay un generador aleatorio en la carga. La composición es determinista por índice; los
  identificadores son UUID aleatorios.

## El modelo de carga

| Modo | Qué hace | Concurrencia | Pausas |
|---|---|---|---|
| Secuencial | Un pedido por vez a la primera página (`?limit=50`) de una cartera | 1 | 100 ms entre pedidos, más las dos lecturas de `pg_stat_statements` del arnés (antes y después de cada pedido, fuera del reloj) |
| Apertura completa | La primera página y las siguientes con el `nextCursor`, hasta `hasMore = false`; 15 aperturas por cartera | 1 | Ninguna entre páginas; 100 ms entre aperturas |
| Concurrente | Un cliente por profesional, cada uno en **bucle cerrado**: pide la página siguiente apenas recibe la anterior | 1, 3 o 5 clientes, cada uno con su cartera de 200 personas | Ninguna |

- **Bucle cerrado, no abierto:** no se fija un ritmo de llegada; cada cliente tiene siempre un pedido en vuelo. Mide cómo
  se reparte la máquina entre C pedidos simultáneos, no cuántos profesionales reales aguanta. **Lo secuencial no dice
  nada de capacidad concurrente, y lo concurrente no es un patrón de uso.**
- **La concurrencia efectiva** es la suma de las latencias sobre la duración del lote (ley de Little).
- **El cliente corre en el mismo proceso que la API** (como en la primera medición), con conexiones HTTP persistentes.
  Comparte el hilo de Node: su trabajo (armar el pedido y leer unos KB de JSON) es chico, pero está dentro de la latencia.
- **Calentamiento separado:** 3 pedidos por cartera antes de cada lote, que no entran en las estadísticas (quedan en las
  muestras, marcados).
- **Asentamiento:** antes y después de cada lote, 11,5 s de espera. PostgreSQL publica los contadores de cada conexión
  cuando queda ociosa, a más tardar a los 10 s: así `pg_stat_database` y `pg_stat_wal` del lote no arrastran lo
  anterior. `pg_stat_statements` no tiene esa demora.
- **El orden de los lotes** alterna escenarios y repite los clave al final: S-B50, S-B100, S-B200, S-B200 sin
  instrumentar, S-H200, A-B200, A-H200, C1, C3, C5, C5, C3, C1, S-B200 sin instrumentar, S-B200, S-H200, S-B100 y S-B50.

## Cómo se atribuye cada número

| Número | Cómo | Precisión |
|---|---|---|
| Latencia | Reloj del cliente alrededor de cada pedido | Exacta para esa máquina; los pedidos con error estarían en la latencia y se contarían aparte |
| Tramos del servidor (antes del PDP, PDP, lectura, después) | Instrumentación por pedido (`AsyncLocalStorage`) | Exacta por pedido, también en concurrencia |
| Filas nuevas en `decision_de_acceso` | Agrupadas por `request_id` después de medir | Exacta por pedido, también en concurrencia |
| Sentencias, su tiempo de ejecución y los COMMIT | `pg_stat_statements` antes y después de cada pedido (lotes secuenciales instrumentados) | Exacta por pedido |
| Lo mismo en concurrencia | `pg_stat_statements` antes y después del lote | Total del lote: **no se atribuye a un pedido**; se informa el promedio |
| Transacciones, filas, tiempo activo, transacción abierta, WAL, checkpoints | `pg_stat_database`, `pg_stat_wal` y `pg_stat_bgwriter`, con asentamiento | Exacto para la ventana del lote (incluye el autovacuum, si corrió) |
| Hilo de Node, CPU del proceso y de la máquina | `eventLoopUtilization`, `process.cpuUsage`, `/proc/stat` | Del primer pedido medido al último |
| CPU de PostgreSQL por procesos | `/proc/<pid>/stat` | **No confiable en esta corrida** (ver «Varios profesionales a la vez»); no se usa |
| Pausas del recolector | `PerformanceObserver('gc')`, superpuestas con cada pedido | Exacta por pedido; en concurrencia una misma pausa cuenta para todos los pedidos en vuelo |
| Conexiones y esperas de la base | `pg_stat_activity` cada 250 ms en los lotes concurrentes | Muestreo |

## Qué queda sin medir

- **Render:** otra CPU (y la API con menos CPU asignada), la base en otra máquina con red en el medio (2.328 idas y
  vueltas por página con 200 personas), otro disco y otra configuración de PostgreSQL.
- **Más de 5 profesionales a la vez**, donde la API se queda sin conexiones libres (5 por omisión en esta máquina; en
  Render depende de la máquina, no de la CPU asignada). Ahí puede aparecer el 503 por no conseguir conexión (P2028).
- **Escrituras al mismo tiempo** (asesorados registrando comidas, profesionales activando planes): usan los mismos
  bloqueos compartidos y el mismo WAL.
- **Más historia** (meses o años), carteras de más de 200 personas (el tope de una lectura) y la tabla de decisiones
  después de meses de uso.
- **Un patrón de uso real** (llegadas abiertas con pausas humanas) y la apertura completa con varios profesionales a la
  vez (en concurrencia se midió solo la primera página).
- **El costo de la instrumentación en concurrencia**, la CPU de PostgreSQL por procesos y por qué el arnés nuevo dio un
  13 % más que el control en la misma máquina.
- **Ninguna de las mejoras de la propuesta se probó:** sus ganancias son estimaciones a partir de esta contabilidad.

## Propuesta priorizada

Nada de esto se implementó. El orden pesa la ganancia que la evidencia permite esperar contra lo que cada cambio toca.

| # | Qué | Lo que lo justifica | ¿Conserva el contrato y las reglas? | Qué haría falta |
|---|---|---|---|---|
| 1 | **Leer los pendientes por conjuntos:** una consulta por tipo de hecho para toda la cartera (planes y versiones, procesos y su próxima revisión, solicitudes, antropometría, actividad agrupada por persona) en lugar de 5 a 7 consultas por persona y área | La lectura es del 43 al 53 % de la página en secuencial (36 a 45 % en concurrencia): unas 1.320 sentencias (2.000 con historia) que suman 21 ms de SQL (78 con historia) en un bloque de 880 a 1.250 ms | Sí: el mismo resultado, en la misma transacción, sin tocar autorización ni auditoría | Una decisión técnica, con `test/integration/cartera.int-spec.ts` como oráculo (sin cambiarlo). Estimación: de ~1,3 mil sentencias a unas decenas; el bloque, de ~0,9 s a decenas de ms |
| 2 | **Las decisiones de una lectura en una sola transacción:** tomar los bloqueos compartidos de toda la cartera en el orden único, leer los hechos de todos los pares en una sentencia y registrar las 3 filas por persona en un solo `createMany` | El PDP es el 46 al 63 % de la página, carga toda la cola (p95) y hace 200 confirmaciones por página: 370 a 660 ms esperando al disco con un profesional, y con cinco la espera del WAL es lo que más se ve | Sí: las mismas decisiones, las mismas filas (una por persona y área, con su `request_id`) y la misma respuesta; la regla de registrar cada decisión (08:634) se cumple. Ya hay un antecedente de varios pares en una transacción (DL-140: `bloquearIdentidades` y `decidirDestinatariosEnTransaccion`) | Una revisión del PDP y de sus pruebas de concurrencia: una transacción más larga retiene los bloqueos compartidos de toda la cartera, y un corte (revocar, pausar) espera ese tiempo. Es la pieza de autorización: **lo decide Dirección**. Estimación: de 200 confirmaciones a 1 y de ~1.000 idas y vueltas a unas pocas |
| 3 | **No repetir la cartera entera en cada página** | Cada página repite todo: el website tarda 8 s (9 con historia) en sus 4 páginas y deja 2.400 filas; la lista completa, 11 a 13 s y 3.600 filas | Depende de la opción: (a) que el website pida solo la primera página hasta que haga falta contar, y cuente con otra lectura liviana: cambia la pantalla y agrega un contrato; (b) subir el `limit` máximo de esta lectura (hoy 50): contrato (09); (c) calcular una vez y servir las siguientes páginas de lo calculado: choca con decidir en cada pedido sin caché (08 §27.3; 08:601); (d) paginar por personas antes de procesar: cambia el orden por urgencia | Cualquiera de las cuatro es **decisión de Dirección** (y del legajo en c). Con 1 y 2 hechos, cada página costaría mucho menos y la urgencia baja |
| 4 | **Cuánto se registra por lectura y cuánto se guarda** | 3 filas por persona y por página, también en áreas sin vínculo (la mitad en el perfil base); unos 400 bytes por fila; la tabla no se borra | No: decidir solo las áreas con vínculo, registrar una fila por lectura o definir una retención cambian lo que queda en la auditoría | **Dirección y el legajo** (08:634 y la retención de auditoría). No se recomienda tocarlo para ganar velocidad: 1 y 2 no lo necesitan |
| 5 | **El entorno:** fijar explícito el tamaño del pool de conexiones (`connection_limit`) y medir en el ambiente del piloto | El pool por omisión depende de la máquina (5 acá) y con 5 profesionales se usó entero; la confirmación en el disco cambió de 1,6 a 7,7 ms entre lotes de la misma corrida | Sí: es configuración del despliegue | Una medición en el ambiente del piloto, con su propio protocolo (Render está fuera de esta tanda) |

**Descartada:** confirmar las decisiones sin esperar al disco (`synchronous_commit = off`). Bajaría la espera, pero ante una
caída se podrían perder las últimas decisiones registradas aunque el acceso ya se hubiera dado, y el registro es la
condición del acceso (UC-I02 E06).

## Qué criterio de aceptación habría que fijar antes de un piloto

Lo fija Dirección; esta medición no lo aprueba. Una propuesta de forma:

1. **El escenario:** el tamaño de cartera esperado (hasta 200), con historia de los meses que dure el piloto, y la
   cantidad de profesionales que pueden leer a la vez, en el ambiente del piloto (misma región, mismo plan de la API y de
   la base) y con escrituras de asesorados al mismo tiempo.
2. **La latencia:** un p95 máximo para la primera página y otro para abrir el espacio profesional (las páginas que lea
   el website).
3. **Los errores:** cero 5xx, cero tiempos agotados y cero esperas de conexión vencidas, en dos corridas independientes.
4. **La repetibilidad:** dos corridas en días distintos dentro de un margen fijado.
5. **La auditoría:** un crecimiento máximo de `decision_de_acceso` por profesional y por mes, o una retención definida.

## Cómo reproducirla

En GitHub Actions, como esta vez (el repositorio es público: la corrida no tiene costo): la rama descartable
`medicion/cartera-concurrencia-2026-10-28` solo agrega el flujo `.github/workflows/medicion-cartera-concurrencia.yml`,
que primero corre el humo (el arnés entero en miniatura, en otra máquina) y, si pasa, el control y la medición en la
misma máquina. Tardó 4 min el humo y 59 min la medición (5 de control y 53 de la medición nueva).

En una máquina con PostgreSQL 16 local y vacío, con `pg_stat_statements` precargado, desde la raíz y con las dependencias
instaladas (no en la PC de trabajo: siembra 1.350 personas y escribe cerca de un millón de filas):

```bash
docker run -d --name be-pg -p 55432:5432 -e POSTGRES_USER=be_test -e POSTGRES_PASSWORD=be_test_sintetico \
  -e POSTGRES_DB=be_test postgres:16-alpine -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.max=10000
npm run build:domain
BE_MEDIR_CONCURRENCIA=1 TEST_DATABASE_URL=postgresql://be_test:be_test_sintetico@localhost:55432/be_test \
  BE_CONCURRENCIA_SALIDA=$PWD/resultados/concurrencia \
  npx jest --config test/rendimiento/jest.rendimiento.config.js --runInBand --forceExit 'test/rendimiento/cartera-concurrencia\.rendimiento\.ts$'
node test/rendimiento/analizar-concurrencia.mjs resultados/concurrencia \
  EVIDENCIA/RENDIMIENTO-CARTERA/resultados/cartera-2026-10-28-06-04-41.json resultados/control
```

`BE_CONCURRENCIA_PERFIL=humo` corre lo mismo en miniatura.

**Los archivos de la corrida** (`resultados/concurrencia-2026-10-28/`): `muestras.jsonl` (cada pedido, con sus tramos
del servidor y, en los secuenciales, sus sentencias), `lotes.jsonl` (cada lote, con los contadores de la base y de la
máquina), `actividad.jsonl` (las muestras de `pg_stat_activity`), `filas-de-decision.json` (las filas por `request_id`),
`consultas.json` (el texto normalizado de cada sentencia, sin valores), `poblacion.json`, `entorno.json` (máquina, Node,
PostgreSQL y sus parámetros, imagen, commit, corrida y semillas), `estado.json`, `postgres.log` (las últimas 300 líneas),
`maquina.txt` y `control/` (el arnés anterior en la misma máquina). `resumen.md` y `resumen.json` los generó la CI con
la versión de `analizar-concurrencia.mjs` de `1c59099`; la versión actual (`30441c2`) agrega una tabla por escenario,
la parte del tiempo que es SQL y nombres para las sentencias de la sesión y del paso 1, sobre los mismos datos, y no se
volvió a correr sobre ellos. Las tablas de esta página se armaron a mano a partir de esos archivos.
