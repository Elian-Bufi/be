# Antes/después de la cartera: lectura persona por persona («base») contra lectura por conjuntos («propuesta»)

Generado por `test/rendimiento/analizar-ab.mjs` a partir de `resultados/ab`. Perfil completo; corrida 40692787787; commit 038555a3b63f7384095d87677aad872920a983de; 4 CPU (AMD EPYC 7763 64-Core Processor), 15.61 GB; Node v22.23.2; PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit. Etapa final: terminado, 85 min.

**Un resultado de acá describe esta máquina: no dice nada de Render.** Las dos versiones corrieron alternadas en el mismo proceso, contra la misma base y las mismas carteras; cada lote comprobó qué versión tenía puesta (columna «versión ok»), y las sentencias por pedido lo confirman.

- Lotes: 36 (0 incompletos). Versión puesta como se esperaba en todos: **sí**.
- Pedidos medidos: 3320; con error o sin respuesta: **0**.
- Inventario de pendientes de cada cartera con las dos versiones (una apertura completa por versión): B50 coinciden · B100 coinciden · B200-1 coinciden · B200-2 coinciden · B200-3 coinciden · B200-4 coinciden · B200-5 coinciden · H200 coinciden.


## Latencia por escenario (ms, medida en el cliente)

| Escenario | Rep. | Versión | Pedidos | Errores | p50 | p95 | máx. | media | Páginas/s | Versión ok |
|---|---|---|---|---|---|---|---|---|---|---|
| **S-B50** | r1 | base | 50 | 0 | 541 | 565 | 569 | 544 | — | sí |
|  | r1 | propuesta | 50 | 0 | 241 | 261 | 435 | 247 | — | sí |
|  | r2 | base | 50 | 0 | 506 | 526 | 803 | 514 | — | sí |
|  | r2 | propuesta | 50 | 0 | 240 | 255 | 475 | 246 | — | sí |
|  | juntas | base | 100 | 0 | 528 | 562 | 803 | 529 | — | — |
|  | juntas | propuesta | 100 | 0 | 241 | 257 | 475 | 246 | — | — |
| **S-B100** | r1 | base | 50 | 0 | 1.036 | 1.073 | 1.339 | 1.046 | — | sí |
|  | r1 | propuesta | 50 | 0 | 465 | 478 | 775 | 473 | — | sí |
|  | r2 | base | 50 | 0 | 1.034 | 1.081 | 1.168 | 1.039 | — | sí |
|  | r2 | propuesta | 50 | 0 | 480 | 506 | 786 | 487 | — | sí |
|  | juntas | base | 100 | 0 | 1.035 | 1.073 | 1.339 | 1.042 | — | — |
|  | juntas | propuesta | 100 | 0 | 473 | 503 | 786 | 480 | — | — |
| **S-B200** | r1 | base | 50 | 0 | 2.045 | 2.248 | 2.428 | 2.072 | — | sí |
|  | r1 | propuesta | 50 | 0 | 959 | 1.068 | 1.333 | 979 | — | sí |
|  | r2 | base | 50 | 0 | 1.851 | 2.084 | 2.369 | 1.918 | — | sí |
|  | r2 | propuesta | 50 | 0 | 924 | 974 | 1.256 | 937 | — | sí |
|  | juntas | base | 100 | 0 | 2.032 | 2.216 | 2.428 | 1.995 | — | — |
|  | juntas | propuesta | 100 | 0 | 938 | 1.040 | 1.333 | 958 | — | — |
| **S-H200** | r1 | base | 50 | 0 | 2.323 | 2.676 | 2.699 | 2.407 | — | sí |
|  | r1 | propuesta | 50 | 0 | 970 | 1.043 | 1.147 | 979 | — | sí |
|  | r2 | base | 50 | 0 | 2.356 | 2.581 | 2.644 | 2.383 | — | sí |
|  | r2 | propuesta | 50 | 0 | 966 | 1.029 | 1.277 | 980 | — | sí |
|  | juntas | base | 100 | 0 | 2.350 | 2.644 | 2.699 | 2.395 | — | — |
|  | juntas | propuesta | 100 | 0 | 968 | 1.036 | 1.277 | 979 | — | — |
| **A-B200** | r1 | base | 90 | 0 | 1.931 | 2.232 | 2.455 | 2.014 | — | sí |
|  | r1 | propuesta | 90 | 0 | 984 | 1.063 | 1.397 | 1.000 | — | sí |
|  | r2 | base | 90 | 0 | 2.051 | 2.223 | 2.399 | 2.074 | — | sí |
|  | r2 | propuesta | 90 | 0 | 909 | 975 | 1.277 | 924 | — | sí |
|  | juntas | base | 180 | 0 | 2.045 | 2.223 | 2.455 | 2.044 | — | — |
|  | juntas | propuesta | 180 | 0 | 954 | 1.057 | 1.397 | 962 | — | — |
| **A-H200** | r1 | base | 90 | 0 | 2.451 | 2.737 | 3.035 | 2.493 | — | sí |
|  | r1 | propuesta | 90 | 0 | 944 | 996 | 1.299 | 958 | — | sí |
|  | r2 | base | 90 | 0 | 2.309 | 2.497 | 2.783 | 2.354 | — | sí |
|  | r2 | propuesta | 90 | 0 | 960 | 1.009 | 1.321 | 973 | — | sí |
|  | juntas | base | 180 | 0 | 2.413 | 2.690 | 3.035 | 2.423 | — | — |
|  | juntas | propuesta | 180 | 0 | 953 | 1.003 | 1.321 | 965 | — | — |
| **C1** | r1 | base | 50 | 0 | 1.997 | 2.064 | 2.329 | 2.009 | 0,50 | sí |
|  | r1 | propuesta | 50 | 0 | 912 | 1.005 | 1.243 | 927 | 1,08 | sí |
|  | r2 | base | 50 | 0 | 2.040 | 2.168 | 2.428 | 2.056 | 0,49 | sí |
|  | r2 | propuesta | 50 | 0 | 929 | 969 | 1.276 | 943 | 1,06 | sí |
|  | juntas | base | 100 | 0 | 2.019 | 2.102 | 2.428 | 2.032 | — | — |
|  | juntas | propuesta | 100 | 0 | 917 | 969 | 1.276 | 935 | — | — |
| **C3** | r1 | base | 150 | 0 | 3.174 | 3.597 | 3.641 | 3.207 | 0,93 | sí |
|  | r1 | propuesta | 150 | 0 | 1.457 | 1.836 | 1.913 | 1.484 | 2,01 | sí |
|  | r2 | base | 150 | 0 | 3.174 | 3.578 | 3.748 | 3.202 | 0,93 | sí |
|  | r2 | propuesta | 150 | 0 | 1.467 | 1.844 | 1.933 | 1.495 | 2,00 | sí |
|  | juntas | base | 300 | 0 | 3.174 | 3.578 | 3.748 | 3.205 | — | — |
|  | juntas | propuesta | 300 | 0 | 1.461 | 1.836 | 1.933 | 1.489 | — | — |
| **C5** | r1 | base | 250 | 0 | 4.629 | 5.040 | 5.459 | 4.679 | 1,06 | sí |
|  | r1 | propuesta | 250 | 0 | 2.136 | 2.551 | 2.646 | 2.178 | 2,28 | sí |
|  | r2 | base | 250 | 0 | 5.117 | 5.871 | 6.040 | 5.148 | 0,97 | sí |
|  | r2 | propuesta | 250 | 0 | 2.266 | 2.883 | 3.167 | 2.352 | 2,11 | sí |
|  | juntas | base | 500 | 0 | 4.801 | 5.608 | 6.040 | 4.914 | — | — |
|  | juntas | propuesta | 500 | 0 | 2.175 | 2.712 | 3.167 | 2.265 | — | — |


## La comparación: propuesta contra base, en la misma repetición

Δ = propuesta − base. La «variación de la base» es cuánto difirió la base entre sus dos repeticiones (p50): el piso de ruido con el que hay que comparar cada Δ.

| Escenario | Rep. | p50 base | p50 propuesta | Δ p50 (ms) | Δ p50 (%) | p95 base | p95 propuesta | Δ p95 (%) | Páginas/s base → propuesta | Variación de la base entre r1 y r2 |
|---|---|---|---|---|---|---|---|---|---|---|
| **S-B50** | r1 | 541 | 241 | -300 | -55,5 % | 565 | 261 | -53,8 % | — | -6,5 % |
|  | r2 | 506 | 240 | -266 | -52,6 % | 526 | 255 | -51,5 % | — |  |
|  | juntas | 528 | 241 | -287 | -54,4 % | 562 | 257 | -54,3 % | — |  |
| **S-B100** | r1 | 1.036 | 465 | -571 | -55,1 % | 1.073 | 478 | -55,5 % | — | -0,2 % |
|  | r2 | 1.034 | 480 | -554 | -53,6 % | 1.081 | 506 | -53,2 % | — |  |
|  | juntas | 1.035 | 473 | -562 | -54,3 % | 1.073 | 503 | -53,1 % | — |  |
| **S-B200** | r1 | 2.045 | 959 | -1.086 | -53,1 % | 2.248 | 1.068 | -52,5 % | — | -9,5 % |
|  | r2 | 1.851 | 924 | -927 | -50,1 % | 2.084 | 974 | -53,3 % | — |  |
|  | juntas | 2.032 | 938 | -1.094 | -53,8 % | 2.216 | 1.040 | -53,1 % | — |  |
| **S-H200** | r1 | 2.323 | 970 | -1.353 | -58,2 % | 2.676 | 1.043 | -61 % | — | +1,4 % |
|  | r2 | 2.356 | 966 | -1.390 | -59 % | 2.581 | 1.029 | -60,1 % | — |  |
|  | juntas | 2.350 | 968 | -1.382 | -58,8 % | 2.644 | 1.036 | -60,8 % | — |  |
| **A-B200** | r1 | 1.931 | 984 | -947 | -49 % | 2.232 | 1.063 | -52,4 % | — | +6,2 % |
|  | r2 | 2.051 | 909 | -1.142 | -55,7 % | 2.223 | 975 | -56,1 % | — |  |
|  | juntas | 2.045 | 954 | -1.091 | -53,4 % | 2.223 | 1.057 | -52,5 % | — |  |
| **A-H200** | r1 | 2.451 | 944 | -1.507 | -61,5 % | 2.737 | 996 | -63,6 % | — | -5,8 % |
|  | r2 | 2.309 | 960 | -1.349 | -58,4 % | 2.497 | 1.009 | -59,6 % | — |  |
|  | juntas | 2.413 | 953 | -1.460 | -60,5 % | 2.690 | 1.003 | -62,7 % | — |  |
| **C1** | r1 | 1.997 | 912 | -1.085 | -54,3 % | 2.064 | 1.005 | -51,3 % | 0,50 → 1,08 (+116 %) | +2,2 % |
|  | r2 | 2.040 | 929 | -1.111 | -54,5 % | 2.168 | 969 | -55,3 % | 0,49 → 1,06 (+116,3 %) |  |
|  | juntas | 2.019 | 917 | -1.102 | -54,6 % | 2.102 | 969 | -53,9 % | — |  |
| **C3** | r1 | 3.174 | 1.457 | -1.717 | -54,1 % | 3.597 | 1.836 | -49 % | 0,93 → 2,01 (+116,1 %) | 0 % |
|  | r2 | 3.174 | 1.467 | -1.707 | -53,8 % | 3.578 | 1.844 | -48,5 % | 0,93 → 2,00 (+115,1 %) |  |
|  | juntas | 3.174 | 1.461 | -1.713 | -54 % | 3.578 | 1.836 | -48,7 % | — |  |
| **C5** | r1 | 4.629 | 2.136 | -2.493 | -53,9 % | 5.040 | 2.551 | -49,4 % | 1,06 → 2,28 (+115,1 %) | +10,5 % |
|  | r2 | 5.117 | 2.266 | -2.851 | -55,7 % | 5.871 | 2.883 | -50,9 % | 0,97 → 2,11 (+117,5 %) |  |
|  | juntas | 4.801 | 2.175 | -2.626 | -54,7 % | 5.608 | 2.712 | -51,6 % | — |  |


## Dónde cambió el tiempo: los bloques del servidor (medianas por pedido, ms)

| Escenario | Rep. | Versión | Antes del PDP | PDP (tramo) | PDP p95 | Lectura | Lectura p95 | Después de la lectura | GC medio | Hilo de Node | Núcleos de la máquina |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **S-B50** | r1 | base | 6 | 234 | 248 | 300 | 314 | 1 | 7,30 | 20 % | 0,83 |
|  | r1 | propuesta | 5 | 222 | 242 | 11 | 15 | 1 | 3,96 | 20 % | 0,79 |
|  | r2 | base | 5 | 216 | 230 | 283 | 295 | 1 | 7,22 | 21 % | 0,87 |
|  | r2 | propuesta | 5 | 221 | 237 | 12 | 15 | 0 | 4,08 | 20 % | 0,79 |
| **S-B100** | r1 | base | 6 | 448 | 461 | 579 | 596 | 1 | 12,82 | 21 % | 0,92 |
|  | r1 | propuesta | 6 | 442 | 456 | 15 | 19 | 1 | 7,67 | 21 % | 0,85 |
|  | r2 | base | 6 | 450 | 471 | 576 | 598 | 1 | 12,69 | 22 % | 0,91 |
|  | r2 | propuesta | 6 | 457 | 483 | 15 | 18 | 1 | 7,75 | 22 % | 0,86 |
| **S-B200** | r1 | base | 8 | 898 | 986 | 1.137 | 1.192 | 1 | 24,87 | 23 % | 0,98 |
|  | r1 | propuesta | 8 | 924 | 1.034 | 23 | 27 | 1 | 14,56 | 23 % | 0,94 |
|  | r2 | base | 8 | 896 | 937 | 940 | 1.149 | 1 | 24,64 | 24 % | 0,95 |
|  | r2 | propuesta | 8 | 893 | 941 | 22 | 25 | 1 | 14,34 | 23 % | 0,92 |
| **S-H200** | r1 | base | 9 | 904 | 1.049 | 1.383 | 1.695 | 1 | 29,46 | 24 % | 0,94 |
|  | r1 | propuesta | 9 | 913 | 983 | 48 | 52 | 1 | 14,89 | 22 % | 0,89 |
|  | r2 | base | 9 | 936 | 1.001 | 1.418 | 1.495 | 1 | 29,54 | 25 % | 0,94 |
|  | r2 | propuesta | 8 | 909 | 965 | 48 | 52 | 1 | 14,93 | 23 % | 0,92 |
| **A-B200** | r1 | base | 8 | 937 | 1.006 | 976 | 1.229 | 1 | 25,68 | 25 % | 0,99 |
|  | r1 | propuesta | 8 | 950 | 1.028 | 23 | 27 | 1 | 15,09 | 25 % | 1,01 |
|  | r2 | base | 8 | 904 | 969 | 1.136 | 1.217 | 1 | 24,84 | 24 % | 0,99 |
|  | r2 | propuesta | 8 | 875 | 943 | 22 | 25 | 1 | 14,13 | 25 % | 1,00 |
| **A-H200** | r1 | base | 9 | 950 | 1.033 | 1.475 | 1.704 | 1 | 30,52 | 25 % | 0,99 |
|  | r1 | propuesta | 8 | 887 | 938 | 46 | 50 | 1 | 15,28 | 25 % | 1,00 |
|  | r2 | base | 8 | 895 | 948 | 1.391 | 1.594 | 1 | 29,21 | 25 % | 0,98 |
|  | r2 | propuesta | 8 | 902 | 951 | 47 | 51 | 1 | 15,06 | 24 % | 1,00 |
| **C1** | r1 | base | 7 | 871 | 903 | 1.112 | 1.162 | 1 | 23,86 | 23 % | 0,99 |
|  | r1 | propuesta | 8 | 879 | 957 | 22 | 27 | 1 | 13,61 | 26 % | 1,03 |
|  | r2 | base | 8 | 893 | 984 | 1.129 | 1.168 | 1 | 23,74 | 24 % | 1,01 |
|  | r2 | propuesta | 8 | 899 | 936 | 22 | 26 | 1 | 13,39 | 26 % | 1,03 |
| **C3** | r1 | base | 11 | 1.408 | 1.787 | 1.747 | 1.819 | 1 | 74,50 | 59 % | 2,66 |
|  | r1 | propuesta | 11 | 1.409 | 1.789 | 33 | 38 | 1 | 41,25 | 61 % | 2,64 |
|  | r2 | base | 11 | 1.405 | 1.780 | 1.744 | 1.834 | 1 | 73,12 | 59 % | 2,65 |
|  | r2 | propuesta | 11 | 1.421 | 1.791 | 33 | 38 | 1 | 40,80 | 59 % | 2,57 |
| **C5** | r1 | base | 15 | 2.056 | 2.468 | 2.541 | 2.949 | 1 | 128,31 | 75 % | 3,10 |
|  | r1 | propuesta | 15 | 2.071 | 2.486 | 43 | 52 | 1 | 71,43 | 77 % | 3,12 |
|  | r2 | base | 16 | 2.267 | 2.770 | 2.768 | 3.346 | 1 | 138,74 | 73 % | 3,05 |
|  | r2 | propuesta | 16 | 2.199 | 2.803 | 46 | 59 | 1 | 73,82 | 74 % | 2,98 |


## Sentencias, SQL, transacciones y filas de auditoría por pedido (lotes secuenciales y de apertura; medianas)

| Escenario | Rep. | Versión | Sentencias | SQL ejecutándose (ms) | COMMIT | Filas de decisión por pedido (mín. · máx.) | Ítems | Transacciones del lote (pg_stat_database) | Sincronizaciones del WAL · ms |
|---|---|---|---|---|---|---|---|---|---|
| **S-B50** | r1 | base | 1.563 | 88 | 51 | 150 · 150 (50 pedidos) | 50 | 2.807 | 2.511 · 411 |
|  | r1 | propuesta | 1.240 | 77 | 51 | 150 · 150 (50 pedidos) | 50 | 2.802 | 2.504 · 384 |
|  | r2 | base | 1.563 | 82 | 51 | 150 · 150 (50 pedidos) | 50 | 2.805 | 2.514 · 392 |
|  | r2 | propuesta | 1.240 | 76 | 51 | 150 · 150 (50 pedidos) | 50 | 2.802 | 2.507 · 376 |
| **S-B100** | r1 | base | 3.118 | 179 | 101 | 300 · 300 (50 pedidos) | 50 | 5.315 | 5.017 · 771 |
|  | r1 | propuesta | 2.465 | 150 | 101 | 300 · 300 (50 pedidos) | 50 | 5.313 | 5.020 · 750 |
|  | r2 | base | 3.118 | 175 | 101 | 300 · 300 (50 pedidos) | 50 | 5.308 | 5.019 · 773 |
|  | r2 | propuesta | 2.465 | 158 | 101 | 300 · 300 (50 pedidos) | 50 | 5.304 | 5.019 · 820 |
| **S-B200** | r1 | base | 6.228 | 329 | 201 | 600 · 600 (50 pedidos) | 50 | 10.317 | 10.018 · 1.530 |
|  | r1 | propuesta | 4.915 | 318 | 201 | 600 · 600 (50 pedidos) | 50 | 10.308 | 10.025 · 1.619 |
|  | r2 | base | 6.228 | 335 | 201 | 600 · 600 (50 pedidos) | 50 | 10.319 | 10.042 · 1.526 |
|  | r2 | propuesta | 4.915 | 312 | 201 | 600 · 600 (50 pedidos) | 50 | 10.306 | 10.021 · 1.461 |
| **S-H200** | r1 | base | 7.048 | 414 | 201 | 600 · 600 (50 pedidos) | 50 | 10.320 | 10.039 · 1.872 |
|  | r1 | propuesta | 5.067 | 343 | 201 | 600 · 600 (50 pedidos) | 50 | 10.308 | 10.025 · 1.641 |
|  | r2 | base | 7.048 | 429 | 201 | 600 · 600 (50 pedidos) | 50 | 10.320 | 10.025 · 1.562 |
|  | r2 | propuesta | 5.067 | 340 | 201 | 600 · 600 (50 pedidos) | 50 | 10.306 | 10.033 · 1.635 |
| **A-B200** | r1 | base | 6.228 | 348 | 201 | 600 · 600 (90 pedidos) | 50 | 18.576 | 18.059 · 2.802 |
|  | r1 | propuesta | 4.915 | 330 | 201 | 600 · 600 (90 pedidos) | 50 | 18.557 | 18.047 · 2.854 |
|  | r2 | base | 6.228 | 337 | 201 | 600 · 600 (90 pedidos) | 50 | 18.568 | 18.053 · 2.779 |
|  | r2 | propuesta | 4.915 | 304 | 201 | 600 · 600 (90 pedidos) | 50 | 18.550 | 18.048 · 2.796 |
| **A-H200** | r1 | base | 7.048 | 438 | 201 | 600 · 600 (90 pedidos) | 50 | 18.571 | 18.063 · 2.895 |
|  | r1 | propuesta | 5.067 | 332 | 201 | 600 · 600 (90 pedidos) | 50 | 18.553 | 18.049 · 2.759 |
|  | r2 | base | 7.048 | 405 | 201 | 600 · 600 (90 pedidos) | 50 | 18.566 | 18.068 · 2.791 |
|  | r2 | propuesta | 5.067 | 337 | 201 | 600 · 600 (90 pedidos) | 50 | 18.548 | 18.044 · 2.715 |
| **C1** | r1 | base | — | — | — | 600 · 600 (50 pedidos) | 50 | 10.316 | 10.027 · 1.496 |
|  | r1 | propuesta | — | — | — | 600 · 600 (50 pedidos) | 50 | 10.313 | 10.014 · 1.511 |
|  | r2 | base | — | — | — | 600 · 600 (50 pedidos) | 50 | 10.318 | 10.028 · 1.587 |
|  | r2 | propuesta | — | — | — | 600 · 600 (50 pedidos) | 50 | 10.306 | 10.034 · 1.465 |
| **C3** | r1 | base | — | — | — | 600 · 600 (150 pedidos) | 50 | 30.970 | 30.040 · 5.148 |
|  | r1 | propuesta | — | — | — | 600 · 600 (150 pedidos) | 50 | 30.928 | 29.884 · 4.642 |
|  | r2 | base | — | — | — | 600 · 600 (150 pedidos) | 50 | 30.955 | 30.007 · 5.071 |
|  | r2 | propuesta | — | — | — | 600 · 600 (150 pedidos) | 50 | 30.939 | 29.854 · 4.766 |
| **C5** | r1 | base | — | — | — | 600 · 600 (250 pedidos) | 50 | 51.608 | 49.889 · 9.913 |
|  | r1 | propuesta | — | — | — | 600 · 600 (250 pedidos) | 50 | 51.567 | 49.160 · 9.230 |
|  | r2 | base | — | — | — | 600 · 600 (250 pedidos) | 50 | 51.617 | 49.739 · 11.088 |
|  | r2 | propuesta | — | — | — | 600 · 600 (250 pedidos) | 50 | 51.553 | 49.042 · 9.866 |


## La apertura completa: por página y lo que lee el website (las primeras cuatro páginas)

| Escenario | Versión | Aperturas | Páginas por apertura | p50 por página (1 … n) | Toda la lista: p50 · p95 | Primeras 4 páginas: p50 · p95 | Filas de decisión por apertura |
|---|---|---|---|---|---|---|---|
| **A-B200** | base | 30 | 6,00 | 2.049 · 2.046 · 2.045 · 2.044 · 2.024 · 2.043 | 12.345 · 13.068 | 8.227 · 8.725 | 3.600 |
|  | propuesta | 30 | 6,00 | 932 · 957 · 971 · 944 · 944 · 954 | 5.791 · 6.186 | 3.854 · 4.114 | 3.600 |
| **A-H200** | base | 30 | 6,00 | 2.413 · 2.427 · 2.401 · 2.419 · 2.418 · 2.368 | 14.408 · 16.112 | 9.622 · 10.668 | 3.600 |
|  | propuesta | 30 | 6,00 | 955 · 948 · 968 · 951 · 944 · 955 | 5.744 · 6.135 | 3.816 · 4.202 | 3.600 |


## Concurrencia: conexiones y esperas de la base (muestras de pg_stat_activity cada 250 ms)

| Escenario | Rep. | Versión | p50 | Páginas/s | Conexiones de la API (máx.) | Hilo de Node | Núcleos | Esperas de las conexiones activas |
|---|---|---|---|---|---|---|---|---|
| **C1** | r1 | base | 1.997 | 0,50 | 5 | 23 % | 0,99 | CPU 118 · Client:ClientRead 25 · IO:WALSync 12 |
|  | r1 | propuesta | 912 | 1,08 | 5 | 26 % | 1,03 | CPU 64 · IO:WALSync 17 · Client:ClientRead 5 |
|  | r2 | base | 2.040 | 0,49 | 5 | 24 % | 1,01 | CPU 109 · Client:ClientRead 13 · IO:WALSync 11 |
|  | r2 | propuesta | 929 | 1,06 | 5 | 26 % | 1,03 | CPU 65 · IO:WALSync 13 |
| **C3** | r1 | base | 3.174 | 0,93 | 5 | 59 % | 2,66 | CPU 465 · Client:ClientRead 42 · IO:WALSync 13 · LWLock:WALWrite 1 |
|  | r1 | propuesta | 1.457 | 2,01 | 5 | 61 % | 2,64 | CPU 274 · IO:WALSync 22 · Client:ClientRead 20 · LWLock:WALWrite 3 |
|  | r2 | base | 3.174 | 0,93 | 5 | 59 % | 2,65 | CPU 451 · Client:ClientRead 42 · IO:WALSync 24 |
|  | r2 | propuesta | 1.467 | 2,00 | 5 | 59 % | 2,57 | CPU 280 · Client:ClientRead 21 · IO:WALSync 14 · LWLock:WALWrite 2 |
| **C5** | r1 | base | 4.629 | 1,06 | 5 | 75 % | 3,10 | CPU 911 · Client:ClientRead 81 · IO:WALSync 49 · LWLock:WALWrite 5 |
|  | r1 | propuesta | 2.136 | 2,28 | 5 | 77 % | 3,12 | CPU 569 · Client:ClientRead 45 · IO:WALSync 38 · LWLock:WALWrite 10 |
|  | r2 | base | 5.117 | 0,97 | 5 | 73 % | 3,05 | CPU 1098 · Client:ClientRead 78 · IO:WALSync 55 · LWLock:WALWrite 7 |
|  | r2 | propuesta | 2.266 | 2,11 | 5 | 74 % | 2,98 | CPU 621 · IO:WALSync 53 · Client:ClientRead 38 · LWLock:WALWrite 10 |


## Las poblaciones (lo contado en la base)

- **B50** (base, 50 personas pedidas): 65 pendientes en 2 páginas; vínculos 50; planes nutricionales 10; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B100** (base, 100 personas pedidas): 130 pendientes en 3 páginas; vínculos 100; planes nutricionales 20; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B200-1** (base, 200 personas pedidas): 260 pendientes en 6 páginas; vínculos 200; planes nutricionales 40; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B200-2** (base, 200 personas pedidas): 260 pendientes en 6 páginas; vínculos 200; planes nutricionales 40; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B200-3** (base, 200 personas pedidas): 260 pendientes en 6 páginas; vínculos 200; planes nutricionales 40; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B200-4** (base, 200 personas pedidas): 260 pendientes en 6 páginas; vínculos 200; planes nutricionales 40; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **B200-5** (base, 200 personas pedidas): 260 pendientes en 6 páginas; vínculos 200; planes nutricionales 40; comidas 0; sesiones 0; solicitudes 0; tomas 0. Las dos versiones coinciden en el inventario.
- **H200** (historia, 200 personas pedidas): 279 pendientes en 6 páginas; vínculos 200; planes nutricionales 160; comidas 7620; sesiones 1920; solicitudes 67; tomas 100. Las dos versiones coinciden en el inventario.

Siembra: 261 s. Errores de la historia: {}.

Filas de decisión sin request_id durante la medición: ninguna.
