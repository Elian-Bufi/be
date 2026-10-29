# Cartera con concurrencia e historia · resumen generado

Generado por `test/rendimiento/analizar-concurrencia.mjs` a partir de las muestras de esta carpeta. Perfil: **completo**. Estado de la corrida: **terminado** (último lote: 18 de 18).

## La máquina y la base

| Dato | Valor |
|---|---|
| Corrida de GitHub Actions | 40660575008 (intento 1) |
| Commit medido | `d6d588b6c85594eff40c75d0aa4e0079e36caff2` |
| Runner | ubuntu24 20261023.334.3 |
| CPU | 4 · AMD EPYC 9V74 80-Core Processor |
| Memoria | 15,6 GB |
| Node | v22.23.2 |
| PostgreSQL | PostgreSQL 16.15 |
| Imagen de PostgreSQL | `postgres@sha256:0cefaabd882e42bcb2a2f3dc56d3ce4770560ba62fd7f197f1a2e008fd5731ab` |
| shared_buffers · max_connections | 16384 8kB · 100 |
| fsync · synchronous_commit | on · on |
| Conexiones de la API vistas (máximo en concurrencia · al terminar) | 5 · 5 |
| Duración de la corrida | 53 min (población: 276 s) |

## La población

| Filas en la base | B50 | B100 | B200-1 | B200-2 | B200-3 | B200-4 | B200-5 | H200 |
|---|---|---|---|---|---|---|---|---|
| Personas pedidas | 50 | 100 | 200 | 200 | 200 | 200 | 200 | 200 |
| alcancesNutricion | 50 | 100 | 200 | 200 | 200 | 200 | 200 | 200 |
| alcancesEntrenamiento | 25 | 50 | 100 | 100 | 100 | 100 | 100 | 100 |
| alcancesAntropometria | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 50 |
| versionesNutricionalesActivadas | 10 | 20 | 40 | 40 | 40 | 40 | 40 | 180 |
| versionesNutricionalesBorrador | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 60 |
| versionesDeEntrenamientoActivadas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 |
| procesosAbiertosNutricion | 10 | 20 | 40 | 40 | 40 | 40 | 40 | 120 |
| procesosAbiertosEntrenamiento | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 |
| proximasRevisiones | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 255 |
| revisionesNutricionales | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 60 |
| comidasRegistradas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7.620 |
| personasConComidas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 120 |
| sesionesDeEntrenamiento | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1.920 |
| personasConSesiones | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 80 |
| solicitudesDeFormulario | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 67 |
| solicitudesRespondidas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 33 |
| tomasAntropometricasRegistradas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 |
| tomasAntropometricasEnPreparacion | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 25 |
| medicionesAntropometricas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 100 |
| Pendientes (ítems) | 65 | 130 | 260 | 260 | 260 | 260 | 260 | 279 |
| Páginas de 50 | 2 | 3 | 6 | 6 | 6 | 6 | 6 | 6 |

- **B50**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 40 · training|NO_ACTIVE_PLAN 25
- **B100**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 80 · training|NO_ACTIVE_PLAN 50
- **B200-1**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 160 · training|NO_ACTIVE_PLAN 100
- **B200-2**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 160 · training|NO_ACTIVE_PLAN 100
- **B200-3**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 160 · training|NO_ACTIVE_PLAN 100
- **B200-4**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 160 · training|NO_ACTIVE_PLAN 100
- **B200-5**, pendientes por área y tipo: nutrition|NO_ACTIVE_PLAN 160 · training|NO_ACTIVE_PLAN 100
- **H200**, pendientes por área y tipo: anthropometry|ANTHRO_DRAFT_PENDING 25 · nutrition|NO_ACTIVE_PLAN 40 · nutrition|PLAN_DRAFT_PENDING 60 · nutrition|REVIEW_DUE_SOON 30 · nutrition|REVIEW_OVERDUE 30 · training|FORM_REQUEST_OPEN 34 · training|NO_ACTIVE_PLAN 20 · training|REVIEW_DUE_SOON 20 · training|REVIEW_OVERDUE 20

Toda la base al empezar a medir: 1.358 identidades, 32.860 decisiones de acceso (12,5 MB), 7.620 comidas registradas. Al terminar: 955.360 decisiones (362,8 MB).

## Latencia por lote

Latencia medida en el cliente (mismo proceso que la API), en ms. Cada lote, después de su calentamiento. Los pedidos con error **están** en la latencia y se cuentan aparte.

| Lote | Modo | Personas | Clientes | n | Con error | p50 | p95 | p99 | Máximo | Pedidos/s | Concurrencia efectiva |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01-S-B50-r1 | secuencial | 50 | 1 | 50 | 0 | 498 | 794 | 845 | 845 | 1,53 | 0,83 |
| 02-S-B100-r1 | secuencial | 100 | 1 | 50 | 0 | 1.029 | 1.484 | 1.818 | 1.818 | 0,84 | 0,90 |
| 03-S-B200-r1 | secuencial | 200 | 1 | 50 | 0 | 1.980 | 3.333 | 3.911 | 3.911 | 0,44 | 0,95 |
| 04-S-B200-sin-r1 | secuencial · sin instrumentar | 200 | 1 | 50 | 0 | 2.001 | 2.892 | 3.630 | 3.630 | 0,45 | 0,95 |
| 05-S-H200-r1 | secuencial | 200 | 1 | 50 | 0 | 2.285 | 3.683 | 3.962 | 3.962 | 0,39 | 0,96 |
| 06-A-B200-r1 | apertura | 200 | 1 | 90 | 0 | 1.760 | 2.917 | 3.391 | 3.391 | 0,51 | 0,98 |
| 07-A-H200-r1 | apertura | 200 | 1 | 90 | 0 | 2.164 | 2.850 | 3.181 | 3.181 | 0,44 | 0,99 |
| 08-C1-r1 | concurrente | 200 | 1 | 50 | 0 | 1.905 | 2.687 | 4.455 | 4.455 | 0,49 | 1,00 |
| 09-C3-r1 | concurrente | 200 | 3 | 150 | 0 | 2.781 | 4.480 | 5.436 | 5.471 | 1,01 | 2,97 |
| 10-C5-r1 | concurrente | 200 | 5 | 250 | 0 | 4.136 | 5.645 | 7.143 | 7.271 | 1,16 | 4,97 |
| 11-C5-r2 | concurrente | 200 | 5 | 250 | 0 | 4.216 | 5.383 | 5.599 | 5.741 | 1,16 | 4,98 |
| 12-C3-r2 | concurrente | 200 | 3 | 150 | 0 | 3.048 | 4.063 | 4.461 | 4.492 | 0,96 | 3,00 |
| 13-C1-r2 | concurrente | 200 | 1 | 50 | 0 | 1.976 | 2.660 | 3.634 | 3.634 | 0,49 | 1,00 |
| 14-S-B200-sin-r2 | secuencial · sin instrumentar | 200 | 1 | 50 | 0 | 1.960 | 2.966 | 3.331 | 3.331 | 0,46 | 0,95 |
| 15-S-B200-r2 | secuencial | 200 | 1 | 50 | 0 | 1.898 | 2.543 | 2.912 | 2.912 | 0,48 | 0,95 |
| 16-S-H200-r2 | secuencial | 200 | 1 | 50 | 0 | 2.354 | 3.594 | 4.701 | 4.701 | 0,38 | 0,96 |
| 17-S-B100-r2 | secuencial | 100 | 1 | 50 | 0 | 929 | 1.418 | 2.616 | 2.616 | 0,91 | 0,90 |
| 18-S-B50-r2 | secuencial | 50 | 1 | 50 | 0 | 649 | 1.573 | 2.167 | 2.167 | 1,16 | 0,87 |

## Dónde se va el tiempo del servidor

Medianas por pedido, en ms, de la instrumentación del arnés. «Antes del PDP»: sesión, límite y la consulta de vínculos. «PDP»: de la primera decisión a la última. «Lectura»: la transacción de pendientes. «Después»: orden, paginación y respuesta.

| Lote | Total | Antes del PDP | PDP | ms por decisión | Lectura | Después | PDP / total | Lectura / total | Reintentos del PDP | GC p50 · máx. |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-S-B50-r1 | 497 | 4,7 | 258 | 6,10 | 229 | 0,6 | 55 % | 44 % | 0 | 5,8 · 7,6 |
| 02-S-B100-r1 | 1.029 | 5,4 | 568 | 6,11 | 457 | 0,6 | 55 % | 44 % | 0 | 9,3 · 20,6 |
| 03-S-B200-r1 | 1.979 | 6,7 | 1.083 | 6,37 | 879 | 0,7 | 57 % | 43 % | 0 | 19,1 · 31,1 |
| 05-S-H200-r1 | 2.284 | 7,1 | 1.016 | 5,79 | 1.250 | 0,7 | 46 % | 53 % | 0 | 22,2 · 33,5 |
| 06-A-B200-r1 | 1.759 | 6,2 | 863 | 5,16 | 871 | 0,7 | 52 % | 47 % | 0 | 18,7 · 30,2 |
| 07-A-H200-r1 | 2.163 | 6,8 | 995 | 5,41 | 1.211 | 0,7 | 47 % | 53 % | 0 | 22,0 · 36,7 |
| 08-C1-r1 | 1.905 | 6,0 | 1.188 | 6,68 | 712 | 0,7 | 63 % | 36 % | 0 | 18,8 · 30,5 |
| 09-C3-r1 | 2.780 | 8,1 | 1.582 | 8,57 | 1.243 | 0,7 | 57 % | 43 % | 0 | 56,7 · 73,7 |
| 10-C5-r1 | 4.134 | 10,3 | 2.338 | 12,80 | 1.752 | 0,8 | 59 % | 41 % | 0 | 100,6 · 143,5 |
| 11-C5-r2 | 4.213 | 10,8 | 2.428 | 12,43 | 1.812 | 0,8 | 58 % | 42 % | 0 | 103,1 · 147,6 |
| 12-C3-r2 | 3.047 | 8,2 | 1.808 | 9,39 | 1.255 | 0,7 | 59 % | 41 % | 0 | 58,1 · 77,5 |
| 13-C1-r2 | 1.975 | 6,2 | 1.084 | 5,73 | 893 | 0,6 | 55 % | 45 % | 0 | 19,1 · 30,2 |
| 15-S-B200-r2 | 1.895 | 6,8 | 968 | 5,30 | 896 | 0,6 | 53 % | 47 % | 0 | 20,0 · 32,6 |
| 16-S-H200-r2 | 2.353 | 7,1 | 1.213 | 6,88 | 1.100 | 0,6 | 53 % | 47 % | 0 | 22,4 · 35,1 |
| 17-S-B100-r2 | 928 | 5,2 | 523 | 6,16 | 363 | 0,5 | 60 % | 40 % | 0 | 9,4 · 22,2 |
| 18-S-B50-r2 | 648 | 4,5 | 461 | 11,18 | 183 | 0,5 | 71 % | 29 % | 0 | 5,8 · 14,3 |

## La base por pedido

Promedios del lote entero (contadores de PostgreSQL de la base medida; el arnés lee desde otra base). «En transacción esperando a la API»: tiempo con una transacción abierta y la conexión ociosa, esperando la sentencia siguiente.

| Lote | Transacciones | Filas insertadas | ms activos en la base | ms en transacción esperando a la API | Registros WAL | KB de WAL | Sincronizaciones WAL | ms sincronizando WAL | Bloques leídos del disco | Checkpoints | Autovacuum de decisiones |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01-S-B50-r1 | 56,2 | 150,2 | 195,1 | 256,9 | 1.242 | 116,5 | 50,1 | 135,82 | 0,0 | 0 | 1 |
| 02-S-B100-r1 | 106,3 | 300,5 | 389,4 | 518,2 | 2.480 | 230,9 | 100,2 | 268,89 | 0,0 | 0 | 2 |
| 03-S-B200-r1 | 206,4 | 600,5 | 830,9 | 1.003,0 | 4.948 | 559,7 | 200,7 | 607,24 | 0,0 | 1 | 1 |
| 04-S-B200-sin-r1 | 206,5 | 600,5 | 773,1 | 1.007,7 | 4.946 | 449,0 | 200,3 | 0,00 | 0,0 | 0 | 1 |
| 05-S-H200-r1 | 206,4 | 600,5 | 761,4 | 1.282,7 | 5.499 | 656,8 | 200,5 | 464,67 | 0,0 | 1 | 1 |
| 06-A-B200-r1 | 206,3 | 600,3 | 597,6 | 984,7 | 4.950 | 479,2 | 200,4 | 373,04 | 2,3 | 0 | 1 |
| 07-A-H200-r1 | 206,4 | 600,3 | 694,6 | 1.255,2 | 5.496 | 620,8 | 200,5 | 405,30 | 0,1 | 1 | 1 |
| 08-C1-r1 | 206,3 | 600,2 | 887,8 | 976,1 | 4.964 | 750,9 | 200,6 | 657,97 | 0,1 | 1 | 1 |
| 09-C3-r1 | 206,5 | 600,1 | 1.014,4 | 1.482,4 | 4.948 | 479,0 | 194,8 | 303,60 | 31,0 | 0 | 1 |
| 10-C5-r1 | 206,5 | 600,1 | 1.410,7 | 2.260,1 | 4.940 | 569,1 | 185,0 | 320,63 | 46,7 | 1 | 1 |
| 11-C5-r2 | 206,4 | 600,1 | 1.317,2 | 2.342,6 | 4.948 | 634,8 | 186,1 | 290,30 | 97,7 | 1 | 1 |
| 12-C3-r2 | 206,3 | 600,1 | 1.159,1 | 1.505,5 | 4.965 | 725,7 | 194,5 | 384,34 | 122,7 | 1 | 1 |
| 13-C1-r2 | 206,3 | 600,0 | 682,5 | 1.025,4 | 4.933 | 514,1 | 200,4 | 441,41 | 12,9 | 0 | 0 |
| 14-S-B200-sin-r2 | 206,3 | 600,2 | 683,6 | 1.020,5 | 4.933 | 734,1 | 200,6 | 0,00 | 390,6 | 1 | 0 |
| 15-S-B200-r2 | 206,3 | 600,0 | 606,9 | 1.023,2 | 4.934 | 737,1 | 200,6 | 369,82 | 0,0 | 0 | 0 |
| 16-S-H200-r2 | 206,4 | 600,0 | 985,6 | 1.273,8 | 5.479 | 822,6 | 200,8 | 681,83 | 7,5 | 1 | 0 |
| 17-S-B100-r2 | 106,1 | 300,0 | 388,0 | 500,1 | 2.463 | 495,2 | 100,2 | 270,36 | 0,0 | 0 | 0 |
| 18-S-B50-r2 | 56,1 | 150,0 | 444,9 | 248,8 | 1.232 | 120,0 | 50,1 | 386,28 | 0,0 | 0 | 0 |

## Filas nuevas en `decision_de_acceso`, pedido por pedido

Contadas por el `request_id` de cada pedido, después de medir. «Esperadas» = 3 por persona (una por área del catálogo).

| Lote | Esperadas por pedido | Mínimo | Máximo | Distribución (valor (pedidos)) | Bytes agregados a la tabla en el lote |
|---|---|---|---|---|---|
| 01-S-B50-r1 | 150 | 150 | 150 | 150 (50) | 2.973.696 |
| 02-S-B100-r1 | 300 | 300 | 300 | 300 (50) | 5.742.592 |
| 03-S-B200-r1 | 600 | 600 | 600 | 600 (50) | 11.223.040 |
| 04-S-B200-sin-r1 | 600 | 600 | 600 | 600 (50) | 10.289.152 |
| 05-S-H200-r1 | 600 | 600 | 600 | 600 (50) | 11.116.544 |
| 06-A-B200-r1 | 600 | 600 | 600 | 600 (90) | 24.158.208 |
| 07-A-H200-r1 | 600 | 600 | 600 | 600 (90) | 21.135.360 |
| 08-C1-r1 | 600 | 600 | 600 | 600 (50) | 11.460.608 |
| 09-C3-r1 | 600 | 600 | 600 | 600 (150) | 36.610.048 |
| 10-C5-r1 | 600 | 600 | 600 | 600 (250) | 54.976.512 |
| 11-C5-r2 | 600 | 600 | 600 | 600 (250) | 62.980.096 |
| 12-C3-r2 | 600 | 600 | 600 | 600 (150) | 37.928.960 |
| 13-C1-r2 | 600 | 600 | 600 | 600 (50) | 12.754.944 |
| 14-S-B200-sin-r2 | 600 | 600 | 600 | 600 (50) | 12.312.576 |
| 15-S-B200-r2 | 600 | 600 | 600 | 600 (50) | 13.099.008 |
| 16-S-H200-r2 | 600 | 600 | 600 | 600 (50) | 11.124.736 |
| 17-S-B100-r2 | 300 | 300 | 300 | 300 (50) | 5.005.312 |
| 18-S-B50-r2 | 150 | 150 | 150 | 150 (50) | 2.564.096 |

Filas de decisión de pedidos que no son muestras (siembra e inventario): 0 pedidos, 0 filas. Sin request_id: [].

## Concurrencia: la máquina

| Lote | Clientes | Hilo de Node ocupado | Núcleos del proceso | Núcleos de PostgreSQL | Núcleos ocupados de la máquina | iowait | Conexiones de la API (máx.) | Activas (máx. · prom.) | Esperas vistas (activas) |
|---|---|---|---|---|---|---|---|---|---|
| 01-S-B50-r1 | 1 | 16 % | 0,40 | 0,24 | 0,71 | 5 % | — | — | — |
| 02-S-B100-r1 | 1 | 17 % | 0,46 | 0,26 | 0,79 | 6 % | — | — | — |
| 03-S-B200-r1 | 1 | 17 % | 0,45 | -0,28 | 0,78 | 7 % | — | — | — |
| 04-S-B200-sin-r1 | 1 | 17 % | 0,46 | 0,06 | 0,80 | 6 % | — | — | — |
| 05-S-H200-r1 | 1 | 19 % | 0,50 | 0,29 | 0,87 | 5 % | — | — | — |
| 08-C1-r1 | 1 | 18 % | 0,47 | 0,22 | 0,77 | 8 % | 5 | 1 · 0,47 | IO:WALSync 130 · CPU 56 · Client:ClientRead 8 |
| 09-C3-r1 | 3 | 46 % | 1,11 | -0,37 | 2,08 | 6 % | 5 | 3 · 1,27 | CPU 299 · LWLock:WALWrite 241 · IO:WALSync 173 · Client:ClientRead 32 · IO:DataFileExtend 1 · IO:WALWrite 1 |
| 10-C5-r1 | 5 | 59 % | 1,32 | -0,08 | 2,53 | 6 % | 5 | 5 · 2,05 | LWLock:WALWrite 698 · CPU 657 · IO:WALSync 326 · Client:ClientRead 65 · IO:DataFileExtend 2 · LWLock:BufferContent 1 |
| 11-C5-r2 | 5 | 60 % | 1,33 | -0,15 | 2,57 | 5 % | 5 | 5 · 1,89 | CPU 682 · LWLock:WALWrite 574 · IO:WALSync 293 · Client:ClientRead 67 · IO:DataFileExtend 1 · IO:WALInitSync 1 |
| 12-C3-r2 | 3 | 44 % | 1,07 | 0,74 | 2,02 | 7 % | 5 | 3 · 1,36 | CPU 316 · LWLock:WALWrite 265 · IO:WALSync 231 · Client:ClientRead 37 · IO:DataFileExtend 2 · IO:WALInitSync 1 |
| 13-C1-r2 | 1 | 19 % | 0,50 | -0,21 | 0,88 | 5 % | 5 | 1 · 0,45 | CPU 94 · IO:WALSync 84 · Client:ClientRead 6 |
| 14-S-B200-sin-r2 | 1 | 18 % | 0,47 | 0,28 | 0,83 | 5 % | — | — | — |
| 15-S-B200-r2 | 1 | 19 % | 0,50 | -0,15 | 0,87 | 4 % | — | — | — |
| 16-S-H200-r2 | 1 | 19 % | 0,48 | 0,03 | 0,79 | 7 % | — | — | — |
| 17-S-B100-r2 | 1 | 18 % | 0,47 | 0,21 | 0,76 | 6 % | — | — | — |
| 18-S-B50-r2 | 1 | 12 % | 0,31 | 0,14 | 0,51 | 11 % | — | — | — |

## Apertura completa · A-B200

15 aperturas (15 completas). Páginas por apertura: 6 (15). Ítems por apertura: 260 (15). Tiempo de una apertura: p50 11.164 ms, p95 14.848 ms; las primeras 4 páginas (lo que lee el website de una vez): p50 7.938 ms. Filas de decisión por apertura: 3.600 (15); en las primeras 4 páginas: 2.400 (15).

| Página | n | Con error | p50 (ms) | p95 (ms) | PDP p50 | Lectura p50 | Ítems | Filas de decisión |
|---|---|---|---|---|---|---|---|---|
| 1 | 15 | 0 | 2.001 | 3.112 | 1.110 | 870 | 50 (15) | 600 (15) |
| 2 | 15 | 0 | 1.760 | 2.701 | 848 | 869 | 50 (15) | 600 (15) |
| 3 | 15 | 0 | 2.112 | 2.917 | 1.206 | 874 | 50 (15) | 600 (15) |
| 4 | 15 | 0 | 1.715 | 3.391 | 826 | 869 | 50 (15) | 600 (15) |
| 5 | 15 | 0 | 1.651 | 2.498 | 780 | 871 | 50 (15) | 600 (15) |
| 6 | 15 | 0 | 1.727 | 3.266 | 849 | 872 | 10 (15) | 600 (15) |

## Apertura completa · A-H200

15 aperturas (15 completas). Páginas por apertura: 6 (15). Ítems por apertura: 279 (15). Tiempo de una apertura: p50 13.269 ms, p95 15.785 ms; las primeras 4 páginas (lo que lee el website de una vez): p50 9.178 ms. Filas de decisión por apertura: 3.600 (15); en las primeras 4 páginas: 2.400 (15).

| Página | n | Con error | p50 (ms) | p95 (ms) | PDP p50 | Lectura p50 | Ítems | Filas de decisión |
|---|---|---|---|---|---|---|---|---|
| 1 | 15 | 0 | 2.227 | 3.181 | 967 | 1.212 | 50 (15) | 600 (15) |
| 2 | 15 | 0 | 2.089 | 2.874 | 889 | 1.211 | 50 (15) | 600 (15) |
| 3 | 15 | 0 | 2.353 | 2.807 | 1.202 | 1.211 | 50 (15) | 600 (15) |
| 4 | 15 | 0 | 2.196 | 2.861 | 998 | 1.210 | 50 (15) | 600 (15) |
| 5 | 15 | 0 | 2.360 | 2.935 | 1.140 | 1.209 | 50 (15) | 600 (15) |
| 6 | 15 | 0 | 2.057 | 2.793 | 918 | 1.214 | 29 (15) | 600 (15) |

## Sentencias por pedido (lotes secuenciales con estadísticas)

### 01-S-B50-r1

50 pedidos. Sentencias por pedido: 588 a 589. COMMIT por pedido: 51 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 53,7 ms, p95 57,4 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 50–50 | 19,58 | 0,392 |
| PDP · bloqueos compartidos (función) | 50–50 | 14,78 | 0,296 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 825–825 | 11,51 | 0,014 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 50–50 | 11,14 | 0,223 |
| Lectura · actividad nutricional (conteo y última) | 50–50 | 2,66 | 0,053 |
| Lectura · proceso abierto | 75–75 | 1,57 | 0,021 |
| Lectura · plan nutricional | 50–50 | 1,06 | 0,021 |
| Lectura · solicitud de formulario abierta | 75–75 | 1,01 | 0,014 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,56 | 0,558 |
| Lectura · versiones del plan nutricional | 20–20 | 0,43 | 0,022 |
| Lectura · nombres de las personas | 1–1 | 0,30 | 0,300 |
| Lectura · plan de entrenamiento | 25–25 | 0,26 | 0,010 |
| Lectura · actividad de entrenamiento (conteo y última) | 25–25 | 0,26 | 0,010 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 150–150 | 0,15 | 0,001 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,11 | 0,113 |
| Lectura · próxima revisión vigente | 10–10 | 0,08 | 0,008 |
| Sesión (guard) | 1–1 | 0,05 | 0,045 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,029 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| COMMIT | 51–51 | 0,02 | 0,000 |
| BEGIN | 51–51 | 0,02 | 0,000 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,006 |

### 02-S-B100-r1

50 pedidos. Sentencias por pedido: 1.168 a 1.169. COMMIT por pedido: 101 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 112,5 ms, p95 119,0 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 100–100 | 39,83 | 0,398 |
| PDP · bloqueos compartidos (función) | 100–100 | 29,90 | 0,299 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 100–100 | 24,07 | 0,241 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 1.650–1.650 | 23,27 | 0,014 |
| Lectura · actividad nutricional (conteo y última) | 100–100 | 8,54 | 0,085 |
| Lectura · proceso abierto | 150–150 | 3,16 | 0,021 |
| Lectura · plan nutricional | 100–100 | 2,19 | 0,022 |
| Lectura · solicitud de formulario abierta | 150–150 | 2,09 | 0,014 |
| Lectura · versiones del plan nutricional | 40–40 | 0,86 | 0,022 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,62 | 0,617 |
| Lectura · actividad de entrenamiento (conteo y última) | 50–50 | 0,51 | 0,010 |
| Lectura · nombres de las personas | 1–1 | 0,51 | 0,508 |
| Lectura · plan de entrenamiento | 50–50 | 0,48 | 0,010 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 300–300 | 0,31 | 0,001 |
| Lectura · próxima revisión vigente | 20–20 | 0,19 | 0,009 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,13 | 0,127 |
| Sesión (guard) | 1–1 | 0,04 | 0,045 |
| COMMIT | 101–101 | 0,04 | 0,000 |
| BEGIN | 101–101 | 0,04 | 0,000 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,029 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,005 |

### 03-S-B200-r1

50 pedidos. Sentencias por pedido: 2.328 a 2.329. COMMIT por pedido: 201 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 207,3 ms, p95 218,2 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 76,38 | 0,382 |
| PDP · bloqueos compartidos (función) | 200–200 | 58,27 | 0,291 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 51,22 | 0,256 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300–3.300 | 44,99 | 0,014 |
| Lectura · proceso abierto | 300–300 | 6,23 | 0,021 |
| Lectura · plan nutricional | 200–200 | 4,29 | 0,021 |
| Lectura · solicitud de formulario abierta | 300–300 | 4,04 | 0,013 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 1,90 | 0,010 |
| Lectura · versiones del plan nutricional | 80–80 | 1,73 | 0,022 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 1,01 | 0,010 |
| Lectura · plan de entrenamiento | 100–100 | 0,89 | 0,009 |
| Lectura · nombres de las personas | 1–1 | 0,89 | 0,888 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,71 | 0,710 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,61 | 0,001 |
| Lectura · próxima revisión vigente | 40–40 | 0,30 | 0,008 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,16 | 0,165 |
| COMMIT | 201–201 | 0,08 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,04 | 0,043 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,027 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |
| Otra · SELECT t.typname, t.typtype, t.typelem, t.typbasetype, t.typ | 0–1 | 0,00 | 0,013 |

### 05-S-H200-r1

50 pedidos. Sentencias por pedido: 2.998 a 2.999. COMMIT por pedido: 201 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 276,1 ms, p95 299,6 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 83,19 | 0,416 |
| PDP · bloqueos compartidos (función) | 200–200 | 59,14 | 0,296 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 56,79 | 0,284 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.450–3.450 | 46,94 | 0,014 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 34,23 | 0,171 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 8,00 | 0,080 |
| Lectura · proceso abierto | 300–300 | 6,71 | 0,022 |
| Lectura · solicitud de formulario abierta | 350–350 | 6,52 | 0,019 |
| Lectura · versiones del plan nutricional | 280–280 | 6,26 | 0,022 |
| Lectura · próxima revisión vigente | 200–200 | 4,69 | 0,023 |
| Lectura · plan nutricional | 200–200 | 4,42 | 0,022 |
| Lectura · versiones del plan de entrenamiento | 160–160 | 3,55 | 0,022 |
| Lectura · antropometría | 100–100 | 1,95 | 0,020 |
| Lectura · nombres de las personas | 1–1 | 0,94 | 0,943 |
| Lectura · plan de entrenamiento | 100–100 | 0,93 | 0,009 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,80 | 0,803 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,62 | 0,001 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,16 | 0,161 |
| COMMIT | 201–201 | 0,09 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,05 | 0,047 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,029 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |

### 06-A-B200-r1

90 pedidos. Sentencias por pedido: 2.328 a 2.330. COMMIT por pedido: 201 (90). Tiempo de ejecución en la base (sentencias de primer nivel): p50 207,3 ms, p95 220,0 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 78,36 | 0,392 |
| PDP · bloqueos compartidos (función) | 200–200 | 56,27 | 0,281 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 52,57 | 0,263 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300–3.300 | 43,31 | 0,013 |
| Lectura · proceso abierto | 300–300 | 6,19 | 0,021 |
| Lectura · solicitud de formulario abierta | 300–300 | 4,04 | 0,013 |
| Lectura · plan nutricional | 200–200 | 3,99 | 0,020 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 1,85 | 0,009 |
| Lectura · versiones del plan nutricional | 80–80 | 1,70 | 0,021 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 1,01 | 0,010 |
| Lectura · nombres de las personas | 1–1 | 0,90 | 0,898 |
| Lectura · plan de entrenamiento | 100–100 | 0,90 | 0,009 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,71 | 0,708 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,62 | 0,001 |
| Lectura · próxima revisión vigente | 40–40 | 0,27 | 0,007 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,17 | 0,166 |
| COMMIT | 201–201 | 0,08 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,04 | 0,036 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,026 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,023 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |
| Otra · SELECT t.typname, t.typtype, t.typelem, t.typbasetype, t.typ | 0–1 | 0,00 | 0,013 |

### 07-A-H200-r1

90 pedidos. Sentencias por pedido: 2.998 a 2.999. COMMIT por pedido: 201 (90). Tiempo de ejecución en la base (sentencias de primer nivel): p50 267,1 ms, p95 301,2 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 82,54 | 0,413 |
| PDP · bloqueos compartidos (función) | 200–200 | 57,71 | 0,289 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 55,64 | 0,278 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.450–3.450 | 45,91 | 0,013 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 32,52 | 0,163 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 7,94 | 0,079 |
| Lectura · proceso abierto | 300–300 | 6,54 | 0,022 |
| Lectura · solicitud de formulario abierta | 350–350 | 6,14 | 0,018 |
| Lectura · versiones del plan nutricional | 280–280 | 6,10 | 0,022 |
| Lectura · próxima revisión vigente | 200–200 | 4,45 | 0,022 |
| Lectura · plan nutricional | 200–200 | 4,27 | 0,021 |
| Lectura · versiones del plan de entrenamiento | 160–160 | 3,41 | 0,021 |
| Lectura · antropometría | 100–100 | 1,90 | 0,019 |
| Lectura · nombres de las personas | 1–1 | 0,96 | 0,962 |
| Lectura · plan de entrenamiento | 100–100 | 0,89 | 0,009 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,77 | 0,770 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,62 | 0,001 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,16 | 0,159 |
| COMMIT | 201–201 | 0,08 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,04 | 0,038 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,025 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,023 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |
| Otra · SELECT t.typname, t.typtype, t.typelem, t.typbasetype, t.typ | 0–1 | 0,00 | 0,014 |

### 15-S-B200-r2

50 pedidos. Sentencias por pedido: 2.328 a 2.329. COMMIT por pedido: 201 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 217,6 ms, p95 253,9 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 83,36 | 0,417 |
| PDP · bloqueos compartidos (función) | 200–200 | 60,64 | 0,303 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 53,87 | 0,269 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300–3.300 | 47,14 | 0,014 |
| Lectura · proceso abierto | 300–300 | 6,43 | 0,021 |
| Lectura · solicitud de formulario abierta | 300–300 | 4,49 | 0,015 |
| Lectura · plan nutricional | 200–200 | 4,46 | 0,022 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 2,05 | 0,010 |
| Lectura · versiones del plan nutricional | 80–80 | 1,84 | 0,023 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 1,05 | 0,011 |
| Lectura · plan de entrenamiento | 100–100 | 0,98 | 0,010 |
| Lectura · nombres de las personas | 1–1 | 0,96 | 0,956 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,74 | 0,744 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,61 | 0,001 |
| Lectura · próxima revisión vigente | 40–40 | 0,36 | 0,009 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,17 | 0,171 |
| COMMIT | 201–201 | 0,09 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,05 | 0,049 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,030 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,005 |
| Otra · SELECT t.typname, t.typtype, t.typelem, t.typbasetype, t.typ | 0–1 | 0,00 | 0,014 |

### 16-S-H200-r2

50 pedidos. Sentencias por pedido: 2.998 a 2.999. COMMIT por pedido: 201 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 284,0 ms, p95 303,1 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200–200 | 86,28 | 0,431 |
| PDP · bloqueos compartidos (función) | 200–200 | 59,91 | 0,300 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200–200 | 57,34 | 0,287 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.450–3.450 | 47,96 | 0,014 |
| Lectura · actividad nutricional (conteo y última) | 200–200 | 37,23 | 0,186 |
| Lectura · actividad de entrenamiento (conteo y última) | 100–100 | 8,66 | 0,087 |
| Lectura · proceso abierto | 300–300 | 6,67 | 0,022 |
| Lectura · solicitud de formulario abierta | 350–350 | 6,49 | 0,019 |
| Lectura · versiones del plan nutricional | 280–280 | 6,34 | 0,023 |
| Lectura · próxima revisión vigente | 200–200 | 4,60 | 0,023 |
| Lectura · plan nutricional | 200–200 | 4,35 | 0,022 |
| Lectura · versiones del plan de entrenamiento | 160–160 | 3,48 | 0,022 |
| Lectura · antropometría | 100–100 | 2,07 | 0,021 |
| Lectura · nombres de las personas | 1–1 | 0,98 | 0,977 |
| Lectura · plan de entrenamiento | 100–100 | 0,94 | 0,009 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,81 | 0,807 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600–600 | 0,62 | 0,001 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,16 | 0,158 |
| COMMIT | 201–201 | 0,09 | 0,000 |
| BEGIN | 201–201 | 0,07 | 0,000 |
| Sesión (guard) | 1–1 | 0,04 | 0,044 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,027 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,024 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |
| Otra · SELECT t.typname, t.typtype, t.typelem, t.typbasetype, t.typ | 0–1 | 0,00 | 0,016 |

### 17-S-B100-r2

50 pedidos. Sentencias por pedido: 1.168 a 1.169. COMMIT por pedido: 101 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 108,0 ms, p95 122,0 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 100–100 | 41,67 | 0,417 |
| PDP · bloqueos compartidos (función) | 100–100 | 29,15 | 0,292 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 100–100 | 26,30 | 0,263 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 1.650–1.650 | 22,41 | 0,014 |
| Lectura · proceso abierto | 150–150 | 3,08 | 0,021 |
| Lectura · plan nutricional | 100–100 | 2,01 | 0,020 |
| Lectura · solicitud de formulario abierta | 150–150 | 1,91 | 0,013 |
| Lectura · actividad de entrenamiento (conteo y última) | 50–50 | 1,20 | 0,024 |
| Lectura · actividad nutricional (conteo y última) | 100–100 | 1,14 | 0,011 |
| Lectura · versiones del plan nutricional | 40–40 | 0,93 | 0,023 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,61 | 0,611 |
| Lectura · nombres de las personas | 1–1 | 0,51 | 0,507 |
| Lectura · plan de entrenamiento | 50–50 | 0,49 | 0,010 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 300–300 | 0,31 | 0,001 |
| Lectura · próxima revisión vigente | 20–20 | 0,16 | 0,008 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,12 | 0,121 |
| COMMIT | 101–101 | 0,05 | 0,000 |
| Sesión (guard) | 1–1 | 0,04 | 0,043 |
| BEGIN | 101–101 | 0,04 | 0,000 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,027 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,022 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,005 |

### 18-S-B50-r2

50 pedidos. Sentencias por pedido: 588 a 589. COMMIT por pedido: 51 (50). Tiempo de ejecución en la base (sentencias de primer nivel): p50 54,1 ms, p95 56,4 ms.

| Sentencia | Llamadas por pedido (mín.–máx.) | ms por pedido (media) | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 50–50 | 20,68 | 0,414 |
| PDP · bloqueos compartidos (función) | 50–50 | 14,72 | 0,294 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 50–50 | 12,61 | 0,252 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 825–825 | 11,19 | 0,014 |
| Lectura · proceso abierto | 75–75 | 1,51 | 0,020 |
| Lectura · plan nutricional | 50–50 | 0,96 | 0,019 |
| Lectura · solicitud de formulario abierta | 75–75 | 0,92 | 0,012 |
| Lectura · actividad de entrenamiento (conteo y última) | 25–25 | 0,60 | 0,024 |
| Lectura · actividad nutricional (conteo y última) | 50–50 | 0,56 | 0,011 |
| Paso 1 · alcances aceptados de la cartera | 1–1 | 0,55 | 0,547 |
| Lectura · versiones del plan nutricional | 20–20 | 0,45 | 0,023 |
| Lectura · nombres de las personas | 1–1 | 0,31 | 0,307 |
| Lectura · plan de entrenamiento | 25–25 | 0,22 | 0,009 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 150–150 | 0,15 | 0,001 |
| Otra · SELECT "public"."vinculo"."id", "public"."vinculo"."asesorad | 1–1 | 0,11 | 0,112 |
| Lectura · próxima revisión vigente | 10–10 | 0,08 | 0,008 |
| Sesión (guard) | 1–1 | 0,04 | 0,041 |
| Otra · SELECT "public"."identidad"."id", "public"."identidad"."esta | 1–1 | 0,03 | 0,027 |
| COMMIT | 51–51 | 0,02 | 0,000 |
| Otra · SELECT "public"."control_de_sesion"."identidad_id", "public" | 1–1 | 0,02 | 0,023 |
| BEGIN | 51–51 | 0,02 | 0,000 |
| Otra · SELECT $1 | 0–1 | 0,00 | 0,004 |

## Sentencias por pedido en concurrencia (promedio del lote)

### 08-C1-r1

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 80,68 | 0,403 |
| PDP · bloqueos compartidos (función) | 200,0 | 57,39 | 0,287 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 54,38 | 0,272 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 44,23 | 0,013 |
| Lectura · proceso abierto | 300,0 | 5,97 | 0,020 |
| Lectura · plan nutricional | 200,0 | 3,81 | 0,019 |
| Lectura · solicitud de formulario abierta | 300,0 | 3,58 | 0,012 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,20 | 0,011 |
| Lectura · versiones del plan nutricional | 80,0 | 1,75 | 0,022 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,42 | 0,014 |
| Lectura · nombres de las personas | 1,0 | 0,90 | 0,899 |
| Lectura · plan de entrenamiento | 100,0 | 0,88 | 0,009 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 0,72 | 0,715 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,62 | 0,001 |

### 09-C3-r1

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 108,75 | 0,544 |
| PDP · bloqueos compartidos (función) | 200,0 | 80,30 | 0,402 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 73,20 | 0,366 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 58,60 | 0,018 |
| Lectura · proceso abierto | 300,0 | 6,97 | 0,023 |
| Lectura · solicitud de formulario abierta | 300,0 | 5,41 | 0,018 |
| Lectura · plan nutricional | 200,0 | 4,47 | 0,022 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,31 | 0,012 |
| Lectura · versiones del plan nutricional | 80,0 | 2,22 | 0,028 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,31 | 0,013 |
| Lectura · nombres de las personas | 1,0 | 1,30 | 1,297 |
| Lectura · plan de entrenamiento | 100,0 | 1,17 | 0,012 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 0,94 | 0,935 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,83 | 0,001 |

### 10-C5-r1

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 137,44 | 0,687 |
| PDP · bloqueos compartidos (función) | 200,0 | 100,61 | 0,503 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 90,59 | 0,453 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 72,68 | 0,022 |
| Lectura · proceso abierto | 300,0 | 8,04 | 0,027 |
| Lectura · solicitud de formulario abierta | 300,0 | 6,69 | 0,022 |
| Lectura · plan nutricional | 200,0 | 5,25 | 0,026 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,69 | 0,013 |
| Lectura · versiones del plan nutricional | 80,0 | 2,51 | 0,031 |
| Lectura · nombres de las personas | 1,0 | 1,59 | 1,595 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,48 | 0,015 |
| Lectura · plan de entrenamiento | 100,0 | 1,38 | 0,014 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 1,10 | 1,096 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,97 | 0,002 |

### 11-C5-r2

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 141,54 | 0,708 |
| PDP · bloqueos compartidos (función) | 200,0 | 103,31 | 0,517 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 92,40 | 0,462 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 74,36 | 0,023 |
| Lectura · proceso abierto | 300,0 | 8,28 | 0,028 |
| Lectura · solicitud de formulario abierta | 300,0 | 7,16 | 0,024 |
| Lectura · plan nutricional | 200,0 | 5,41 | 0,027 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,85 | 0,014 |
| Lectura · versiones del plan nutricional | 80,0 | 2,60 | 0,033 |
| Lectura · nombres de las personas | 1,0 | 1,58 | 1,584 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,52 | 0,015 |
| Lectura · plan de entrenamiento | 100,0 | 1,45 | 0,015 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 1,10 | 1,098 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,97 | 0,002 |

### 12-C3-r2

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 113,49 | 0,567 |
| PDP · bloqueos compartidos (función) | 200,0 | 82,59 | 0,413 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 76,90 | 0,385 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 59,50 | 0,018 |
| Lectura · proceso abierto | 300,0 | 7,11 | 0,024 |
| Lectura · solicitud de formulario abierta | 300,0 | 5,77 | 0,019 |
| Lectura · plan nutricional | 200,0 | 4,59 | 0,023 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,39 | 0,012 |
| Lectura · versiones del plan nutricional | 80,0 | 2,24 | 0,028 |
| Lectura · nombres de las personas | 1,0 | 1,29 | 1,286 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,28 | 0,013 |
| Lectura · plan de entrenamiento | 100,0 | 1,21 | 0,012 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 0,92 | 0,921 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,83 | 0,001 |

### 13-C1-r2

| Sentencia | Llamadas por pedido | ms por pedido | ms por llamada |
|---|---|---|---|
| PDP · registro de decisiones (createMany) | 200,0 | 84,74 | 0,424 |
| PDP · bloqueos compartidos (función) | 200,0 | 61,71 | 0,309 |
| PDP · lectura de hechos (una sentencia, tres áreas) | 200,0 | 54,91 | 0,275 |
| Interna · bloqueos dentro de la función *(dentro de otra)* | 3.300,0 | 47,73 | 0,014 |
| Lectura · proceso abierto | 300,0 | 6,45 | 0,022 |
| Lectura · solicitud de formulario abierta | 300,0 | 4,58 | 0,015 |
| Lectura · plan nutricional | 200,0 | 4,45 | 0,022 |
| Lectura · actividad nutricional (conteo y última) | 200,0 | 2,05 | 0,010 |
| Lectura · versiones del plan nutricional | 80,0 | 1,84 | 0,023 |
| Lectura · actividad de entrenamiento (conteo y última) | 100,0 | 1,06 | 0,011 |
| Lectura · plan de entrenamiento | 100,0 | 0,99 | 0,010 |
| Lectura · nombres de las personas | 1,0 | 0,93 | 0,934 |
| Paso 1 · alcances aceptados de la cartera | 1,0 | 0,71 | 0,708 |
| Interna · SELECT CASE "a" WHEN $2 THEN $3::"Finalidad" WHEN  *(dentro de otra)* | 600,0 | 0,62 | 0,001 |

## Comparación con la medición anterior

| Personas | Referencia 40641148313: p50 · p95 · máx. | Control (arnés anterior, esta máquina): p50 · p95 · máx. | Esta medición, instrumentada (todas las repeticiones): p50 · p95 · máx. (n) | Sin instrumentar: p50 · p95 · máx. (n) |
|---|---|---|---|---|
| 50 | 312 · 336 · 344 | 449 · 643 · 655 | 579 · 1.104 · 2.167 (100) | — |
| 100 | 617 · 870 · 978 | 1.228 · 1.721 · 2.305 | 988 · 1.418 · 2.616 (100) | — |
| 200 | 1.233 · 1.495 · 1.580 | 1.713 · 3.090 · 3.827 | 1.943 · 2.912 · 3.911 (100) | 1.976 · 2.892 · 3.630 (100) |

**Sobrecarga de la instrumentación** (escenario S-B200, aplicación y servidor juntos): mediana 1.943 ms con instrumentación y 1.976 ms sin ella (-32,8 ms, -2 %); media 2.072 contra 2.088 ms (-1 %).

