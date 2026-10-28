# La cartera leída por conjuntos: hipótesis, cambio y medición antes/después (2026-10-28)

Encargo de Dirección del 2026-10-28: reducir el tiempo de carga de la cartera profesional (API-CAR-01) conservando el
comportamiento del producto, sus permisos y su trazabilidad. Parte de la segunda medición ([CONCURRENCIA.md](CONCURRENCIA.md),
corrida 40660575008) y de su propuesta priorizada, cuya alternativa 1 es la que se implementa acá.

**Un resultado de esta página describe la máquina donde corrió (un runner de GitHub): no dice nada de Render.**

## 1. Dónde se pierde el tiempo (lo que ya estaba medido, confirmado en el código)

Una página de la cartera con 200 personas, en el código de `main` (`e4512cb`), hace tres cosas (`apps/api/src/cartera/lectura-cartera.ts`):

| Paso | Qué hace | Sentencias con 200 personas | Tiempo (mediana, S-B200 r1 de la corrida 40660575008) |
|---|---|---|---|
| 1. Vínculos | Una consulta: los alcances ACEPTADO del profesional, hasta 200 personas | 1 | dentro de los 5 a 12 ms «entre bloques» |
| 2. PDP | Por persona, `decidirPorAlcance`: su transacción (BEGIN, bloqueo compartido, hechos de los tres alcances, 3 filas en `decision_de_acceso`, COMMIT) | 200 × 5 = 1.000 | 1.083 ms (57 %) |
| 3. Lectura de hechos | Una transacción que recorre **persona por persona y área por área**: plan y versión efectiva, borrador, Proceso abierto, expectativa de revisión, solicitud sin respuesta, actividad del período | ~1.320 (6,6 por persona) | 879 ms (43 %) |
| Orden, paginación, respuesta | En memoria | 0 | 5 a 12 ms |

La lectura del paso 3 son 1.320 sentencias que suman **21 ms de ejecución en PostgreSQL** y tardan **880 ms**: es casi todo
idas y vueltas entre la API y la base (una conexión con la transacción abierta, esperando la sentencia siguiente). Con
historia (S-H200) son 2.000 sentencias, 78 ms de SQL y 1.100 a 1.250 ms. El paso 2 son 200 transacciones con 200
confirmaciones al disco: es la cola (p95) y la mitad del tiempo, pero es la pieza de autorización (ver §3).

El website (`apps/web/src/app/pro/espacio-profesional.tsx`, `DE_LA_CARTERA = { limite: 50, paginas: 4 }`) pide hasta cuatro
páginas seguidas al abrir el espacio profesional, y cada página repite los tres pasos.

**El mapa del recorrido, para comprobarlo en el código:**

| Tramo | Dónde | Qué comprobar |
|---|---|---|
| Acción en el website | `apps/web/src/app/pro/espacio-profesional.tsx` (`DE_LA_CARTERA`, `useListaCompleta`) y `apps/web/src/lib/lista-completa.ts` (`todasLasPaginas`) | De a 50, hasta 4 páginas seguidas con el `nextCursor`; «Ver más», otras 4 |
| Solicitud | `GET /api/v1/me/portfolio?limit=50[&cursor=…]`, `apps/api/src/cartera/cartera.controller.ts` (`consultar`, `leerConsulta`) | `SesionGuard`, validación de la query, límite por actor; el controlador no decide nada |
| Servicio de cartera | `apps/api/src/cartera/lectura-cartera.ts` (`leerCartera`) | Los cuatro pasos, en ese orden |
| Paso 1 · vínculos | `leerCartera`, `prisma.alcanceDeVinculo.findMany` | Alcances ACEPTADO del profesional, hasta `MAXIMO_DE_ASESORADOS` (200) |
| Paso 2 · autorización | `apps/api/src/autorizacion/pdp.service.ts` (`decidirPorAlcance`, `bloquearLoQueCorta`, `leerFilas`), `prisma/migrations/20261003000000_pdp_bloqueos_en_una_llamada` | Una transacción por persona: bloqueo compartido, hechos de los tres alcances, `createMany` de 3 filas, COMMIT |
| Paso 3 · lecturas de hechos | Antes: `dePlanificacion`, `deAntropometria`, `solicitudAbierta` (copia congelada en `test/integration/soporte-cartera-anterior.ts`). Después: `leerHechosPorConjuntos` y `ProcesoService.proximasRevisionesVigentes` | Una transacción `prisma.$transaction`; `nombresDeAsesoradosPorPar` igual en las dos |
| Armado de pendientes | `leerCartera` (el bucle sobre `pares`) y `clasificarRevision` (`packages/domain/src/cartera.ts`) | El mismo orden interno de hechos por par |
| Orden y paginación | `ordenarPendientes` (`packages/domain/src/cartera.ts`), `paginarCartera`, `leerCursorDeCartera` | Orden por urgencia con desempate estable; cursor = clave del último ítem |
| Respuesta | `CarteraResponse` (`packages/domain/src/contratos-cartera.ts`) | `today`, `timeZone`, `period`, `partialView`, `items`, `page` |

## 2. La alternativa elegida y las dos que se compararon

| Alternativa | Qué cambia | Beneficio probable | Riesgo | ¿Toca una garantía? |
|---|---|---|---|---|
| **1. Leer los hechos por conjuntos** (la que se implementa) | El paso 3 pasa de 5 a 7 consultas por persona y área a **una consulta por tipo de hecho para toda la cartera**, cada una acotada a los pares (profesional, asesorado) que el PDP permitió en ese alcance. Misma transacción, mismo resultado | El bloque de 880 ms (43 % de la página; 1.250 ms con historia) cae a decenas de ms: la página, del orden de un 40 % menos | Bajo: es una lectura; el resultado se compara byte a byte con la versión anterior | No: no toca autorización, auditoría, contratos ni orden |
| 2. Las 200 decisiones del PDP en una sola transacción | Un BEGIN, los bloqueos compartidos de toda la cartera, una lectura de hechos de todos los pares, un `createMany` de 600 filas, un COMMIT | El paso 2 (57 %) pasa de 200 confirmaciones a 1 | Medio: una transacción más larga retiene los bloqueos compartidos de toda la cartera; un corte (revocar, pausar, suspender) espera ese tiempo; cambia el instante de cada decisión | **Sí: cambia la ventana de los bloqueos y la relación decisión–corte.** Es una decisión de Dirección (08 §27) |
| 3. No recalcular la cartera en cada página | Que el website pida solo lo que necesita, subir el `limit`, servir las páginas siguientes de lo calculado, o paginar por personas | Abrir el espacio profesional dejaría de costar 4 páginas | Alto en producto: cambia el contrato (`LIMITE_MAXIMO`), la pantalla o el orden; servir de lo calculado es una caché de autorización (08 §27.3: prohibida) | **Sí: contrato, pantalla o regla del legajo.** Decisión de Dirección |

Se elige la 1 por beneficio probable alto, riesgo bajo, complejidad acotada a un archivo y verificación directa (la respuesta
anterior es el oráculo). Las otras dos quedan como propuesta en §7, con el análisis de la revocación concurrente para la 2.

## 3. Lo que se conserva, y por qué

- **Los contratos:** `CarteraResponse` no cambia; el website y las APK vigentes reciben lo mismo. El cursor, el `limit`, los
  filtros `domain`, `kind`, `periodStart`, `periodEnd`, igual.
- **El contenido y el orden:** cada par (persona, área) produce los mismos hechos, en el mismo orden interno; el orden final
  lo sigue dando `ordenarPendientes` (@be/domain), estable, sobre la misma lista de entrada. Un empate total (misma persona,
  dos dominios, mismo tipo y fecha) se resuelve igual porque la lista de entrada conserva el orden de los vínculos.
- **Los permisos:** el paso 2 no cambia una línea. Las consultas por conjuntos reciben, por alcance, **exactamente** los
  asesorados que el PDP permitió en ese alcance (`ids[alcance]`): una persona permitida en Nutrición y denegada en
  Entrenamiento aparece solo en las consultas de Nutrición. No se lee de más para filtrar después.
- **La auditoría:** las mismas 200 transacciones del PDP, las mismas 3 filas por persona con su `request_id`.
- **La transacción de lectura:** sigue siendo una (READ COMMITTED, como antes), con menos sentencias adentro: una foto
  más corta, no una garantía distinta.
- **Las revocaciones concurrentes:** el instante de cada decisión y la ventana de sus bloqueos no cambian; la lectura de hechos
  nunca decidió nada ni lo decide ahora.

## 4. Hipótesis y criterio de suficiencia (escritos antes de medir)

Sobre el mismo arnés de la segunda medición, en una misma corrida y una misma máquina, con la versión anterior («base»,
la copia congelada de `e4512cb`) y la propuesta alternadas lote a lote:

- **H1 · Sentencias.** Con 200 personas (perfil base), la página pasa de ~2.330 sentencias a ~1.015: el paso 3, de ~1.320 a
  no más de 15, y deja de crecer con las personas. Con historia, de ~3.000 a ~1.015 también (lo que crecía con la historia
  era el paso 3).
- **H2 · Latencia de una página.** La mediana con 200 personas (perfil base) baja al menos un 35 %; con historia, al menos
  un 40 %; con 50 y 100 personas, en una proporción parecida (el paso 3 pesa lo mismo en proporción).
- **H3 · La cola.** El p95 baja menos que la mediana (la cola sale del PDP, que no cambia).
- **H4 · Concurrencia.** Con 3 y 5 profesionales a la vez, la mediana baja y las páginas por segundo suben, pero menos que en
  secuencial: el PDP y su espera del WAL siguen siendo el cuello de botella compartido.
- **H5 · Lo que no cambia.** Las mismas filas de `decision_de_acceso` por pedido (3 por persona), las mismas 206
  transacciones por página con 200 personas, cero errores, respuestas idénticas a la base.

**Mejora suficiente** (fijado antes de ver los números): en la misma corrida, (a) respuestas idénticas a la base en todas las
pruebas de equivalencia; (b) las mismas filas de auditoría; (c) la mediana de la página con 200 personas baja **≥ 30 %** en
perfil base y con historia; (d) el p95 no empeora; (e) cero errores y cero tiempos agotados; (f) el bloque de lectura con
200 personas baja a **≤ 100 ms** de mediana. Si (a) o (b) fallan, no se integra. Si (c) queda entre 15 y 30 %, se informa
como mejora parcial y se decide con Dirección. Si queda por debajo del 15 % o dentro de la variación entre repeticiones de
la misma versión, el resultado es negativo y se dice.

## 5. Resultados (corrida 40692787787, 2026-10-28)

**Dónde:** un runner `ubuntu-24.04` de GitHub (AMD EPYC 7763, 4 CPU virtuales, 15,6 GB; otro procesador que el de la
segunda medición), Node 22.23.2, PostgreSQL 16.15 en un contenedor de la misma máquina con `pg_stat_statements`
precargado. 85 minutos; siembra de 1.350 personas en 261 s, sin errores. **Ni esta PC ni Render.** Todo sale de
[`resultados/ab-2026-10-28/`](resultados/ab-2026-10-28/) (`muestras.jsonl`, `lotes.jsonl`, `resumen-ab.md`), generado por
`test/rendimiento/analizar-ab.mjs`; las tablas de acá se copiaron de ese resumen.

**Las condiciones:** 36 lotes (18 escenarios × 2 versiones), cada uno con su calentamiento (3 pedidos por cartera) y
11,5 s de asentamiento antes y después; 50 observaciones por cliente y por lote (15 aperturas de 6 páginas en los lotes de
apertura); las dos versiones alternadas (base, propuesta, …; la segunda repetición al revés); versión puesta como se
esperaba en los 36 lotes; **3.320 pedidos medidos, 0 errores, 0 tiempos agotados**. Antes de medir, el inventario de
pendientes de las 8 carteras con las dos versiones: **idéntico en las 8** (260 pendientes en las de 200 personas, 279
en la de historia).

### La tabla principal: latencia de una página (ms, en el cliente; las dos repeticiones juntas, 100 pedidos por versión salvo aclaración)

| Escenario | Qué es | p50 base | p50 propuesta | **Δ p50** | p95 base | p95 propuesta | Δ p95 | Ruido: la base entre r1 y r2 (p50) |
|---|---|---|---|---|---|---|---|---|
| S-B50 | 1 profesional, 50 personas, perfil base | 528 | 241 | **−54,4 %** | 562 | 257 | −54,3 % | −6,5 % |
| S-B100 | 1 profesional, 100 personas | 1.035 | 473 | **−54,3 %** | 1.073 | 503 | −53,1 % | −0,2 % |
| S-B200 | 1 profesional, 200 personas | 2.032 | 938 | **−53,8 %** | 2.216 | 1.040 | −53,1 % | −9,5 % |
| S-H200 | 1 profesional, 200 personas con historia | 2.350 | 968 | **−58,8 %** | 2.644 | 1.036 | −60,8 % | +1,4 % |
| A-B200 | Apertura completa, 200 personas: por página (180 pedidos) | 2.045 | 954 | **−53,4 %** | 2.223 | 1.057 | −52,5 % | +6,2 % |
| A-H200 | Apertura completa, con historia: por página (180 pedidos) | 2.413 | 953 | **−60,5 %** | 2.690 | 1.003 | −62,7 % | −5,8 % |
| C1 | 1 profesional en bucle cerrado, 200 personas | 2.019 | 917 | **−54,6 %** | 2.102 | 969 | −53,9 % | +2,2 % |
| C3 | 3 profesionales a la vez, 200 personas cada uno (300 pedidos) | 3.174 | 1.461 | **−54,0 %** | 3.578 | 1.836 | −48,7 % | 0,0 % |
| C5 | 5 profesionales a la vez, 200 personas cada uno (500 pedidos) | 4.801 | 2.175 | **−54,7 %** | 5.608 | 2.712 | −51,6 % | +10,5 % |

Por repetición, los Δ de p50 van de −49,0 % (A-B200 r1) a −61,5 % (A-H200 r1); ninguno se acerca al ruido de la base
(como mucho, 10,5 % en C5). **En milisegundos:** con 200 personas, una página pasa de ~2,0 s a ~0,94 s; con historia,
de ~2,35 s a ~0,97 s. La propuesta tarda casi lo mismo con o sin historia: lo que crecía con la historia era el paso 3.

### Páginas por segundo en concurrencia (bucle cerrado; por repetición)

| Clientes | Base r1 · r2 | Propuesta r1 · r2 | Cambio |
|---|---|---|---|
| 1 | 0,50 · 0,49 | 1,08 · 1,06 | +116 % |
| 3 | 0,93 · 0,93 | 2,01 · 2,00 | +116 % |
| 5 | 1,06 · 0,97 | 2,28 · 2,11 | +115 % · +117 % |

La máquina atiende el doble de páginas por segundo con la propuesta, en los tres niveles. Las conexiones de la API
siguieron siendo 5 (el máximo por omisión) en los dos casos; con 5 clientes, el hilo de Node estuvo ocupado el 73 a 77 %
del tiempo y la máquina usó unos 3 de sus 4 núcleos, igual en las dos versiones. Las esperas de las conexiones activas de
la base fueron sobre todo CPU en las dos (en esta máquina el WAL casi no apareció: 49 a 55 muestras de `IO:WALSync` en
C5, contra 911 a 1.098 de CPU; en la segunda medición, en otro procesador, había sido lo contrario).

### Dónde cambió el tiempo: los bloques del servidor (medianas por pedido, ms, r1)

| Escenario | Versión | Antes del PDP | PDP (tramo) | PDP p95 | Lectura (paso 3) | Lectura p95 | Después |
|---|---|---|---|---|---|---|---|
| S-B50 | base → propuesta | 6 → 5 | 234 → 222 | 248 → 242 | **300 → 11** | 314 → 15 | 1 → 1 |
| S-B100 | base → propuesta | 6 → 6 | 448 → 442 | 461 → 456 | **579 → 15** | 596 → 19 | 1 → 1 |
| S-B200 | base → propuesta | 8 → 8 | 898 → 924 | 986 → 1.034 | **1.137 → 23** | 1.192 → 27 | 1 → 1 |
| S-H200 | base → propuesta | 9 → 9 | 904 → 913 | 1.049 → 983 | **1.383 → 48** | 1.695 → 52 | 1 → 1 |
| C5 | base → propuesta | 15 → 15 | 2.056 → 2.071 | 2.468 → 2.486 | **2.541 → 43** | 2.949 → 52 | 1 → 1 |

- **El paso 3 dejó de crecer con las personas:** 11 ms con 50, 15 con 100, 23 con 200 y 48 con historia (antes: 300,
  579, 1.137 y 1.383). Con 5 profesionales a la vez, 43 ms (antes 2.541).
- **El paso 2 no cambió** (898 → 924, 904 → 913: dentro del ruido), como corresponde: es el mismo código. Ahora es el
  ~95 % de la página.
- **La cola también bajó:** el p95 de la página cayó tanto como la mediana (del 49 al 63 %). En esta corrida, la cola de
  la base estaba en los dos bloques (la lectura p95 era 1.192 y 1.695 ms), no solo en el PDP.

### Sentencias, SQL, transacciones y auditoría por pedido (medianas; lotes secuenciales y de apertura, con `pg_stat_statements.track = all`, que cuenta también las sentencias anidadas de las funciones y los disparadores)

| Escenario | Sentencias base → propuesta | Diferencia | SQL ejecutándose (ms) | COMMIT | Filas de decisión por pedido | Ítems |
|---|---|---|---|---|---|---|
| S-B50 | 1.563 → 1.240 | −323 | 88 → 77 | 51 → 51 | 150 → 150 (en los 100 pedidos) | 50 |
| S-B100 | 3.118 → 2.465 | −653 | 179 → 150 | 101 → 101 | 300 → 300 (en los 100) | 50 |
| S-B200 | 6.228 → 4.915 | −1.313 | 329 → 318 | 201 → 201 | 600 → 600 (en los 100) | 50 |
| S-H200 | 7.048 → 5.067 | −1.981 | 414 → 343 | 201 → 201 | 600 → 600 (en los 100) | 50 |
| A-B200 / A-H200 | 6.228 → 4.915 / 7.048 → 5.067 | −1.313 / −1.981 | 348 → 330 / 438 → 332 | 201 → 201 | 600 → 600 (en los 180 de cada uno) | 50 |

- **La diferencia es exactamente el paso 3:** −1.313 con 200 personas y −1.981 con historia, lo que la segunda medición
  había contado para ese bloque (~1.320 y ~2.000). Lo que queda (4.915 y 5.067) es el PDP, que no cambia, y la sesión,
  los vínculos y las once sentencias nuevas.
- **La CI lo cuenta de otra forma, con el mismo resultado:** solo sentencias de nivel superior, 45 con 6 personas y 75
  con 12 (5 por persona, todas del PDP; 15 fijas).
- **La auditoría y las transacciones son las mismas:** 3 filas de decisión por persona en cada uno de los 3.320 pedidos
  (los concurrentes también: 600 por pedido en C1, C3 y C5), 201 COMMIT por página con 200 personas en las dos versiones,
  y las transacciones del lote iguales (10.3 mil por lote de 50 pedidos).
- **El tiempo de SQL ejecutándose** bajó un poco (329 → 318, 414 → 343 ms): las once consultas por conjuntos cuestan
  menos que las 1.320 chicas, pero no es ahí donde estaba el tiempo. Lo que desapareció son las idas y vueltas.

### Lo que lee el website al abrir el espacio profesional (30 aperturas por versión)

| Apertura | Páginas | Las primeras 4 páginas: p50 · p95 | Toda la lista: p50 · p95 | Filas de decisión por apertura |
|---|---|---|---|---|
| A-B200 base | 6 | 8.227 · 8.725 | 12.345 · 13.068 | 3.600 |
| A-B200 propuesta | 6 | **3.854 · 4.114** (−53 %) | 5.791 · 6.186 | 3.600 |
| A-H200 base | 6 | 9.622 · 10.668 | 14.408 · 16.112 | 3.600 |
| A-H200 propuesta | 6 | **3.816 · 4.202** (−60 %) | 5.744 · 6.135 | 3.600 |

Es la suma de los pedidos que hace el website, medida en el cliente del arnés: **no es el tiempo de pantalla** (el
navegador no se midió). Cada página sigue dejando 600 filas de decisión: la apertura, 2.400.

### Las hipótesis, una por una

| | Qué decía | Qué pasó |
|---|---|---|
| H1 · sentencias | El paso 3, de ~1.320 a ≤ 15; deja de crecer con las personas | **Se cumplió:** −1.313 por página con 200 personas, −1.981 con historia; el bloque pasó de 1.137 ms a 23 ms y de 1.383 a 48 |
| H2 · latencia | ≥ 35 % menos con 200 personas, ≥ 40 % con historia, parecido con 50 y 100 | **Se cumplió y de sobra:** −54 % (200), −59 % (historia), −54 % (50 y 100) |
| H3 · la cola | El p95 baja menos que la mediana | **No fue así:** bajó igual (−53 % y −61 %). La cola de la base también estaba en la lectura; el PDP solo no la explicaba en esta máquina |
| H4 · concurrencia | Mejora, pero menos que en secuencial, por el WAL compartido | **Mejoró igual que en secuencial** (−54 %, el doble de páginas por segundo): en esta máquina el WAL casi no esperó; la CPU de PostgreSQL fue lo que más apareció |
| H5 · lo que no cambia | Mismas filas, mismas transacciones, cero errores, respuestas idénticas | **Se cumplió:** 3 filas por persona en los 3.320 pedidos, 201 COMMIT por página, 0 errores, inventarios idénticos en las 8 carteras |

**El criterio de suficiencia** (§4) se cumple en sus seis puntos: respuestas idénticas (la prueba de equivalencia en la
CI y los inventarios de la medición), mismas filas de auditoría, p50 con 200 personas −54 % en perfil base y −59 % con
historia (el umbral era 30 %), p95 no peor (bajó más de 50 %), cero errores y cero tiempos agotados, y el bloque de
lectura en 23 y 48 ms (el umbral era 100).

### Lo que sigue sin saberse

Nada de Render (otra CPU, la base en otra máquina y la red en el medio: ahí cada ida y vuelta cuesta más, así que el
ahorro del paso 3 debería pesar más en proporción, pero no se midió). Cuántos profesionales reales aguanta (C3 y C5
piden sin pausa). Más de 5 a la vez, escrituras simultáneas, meses de historia. El tiempo en el navegador. Y la máquina
importa: esta corrida fue en un AMD EPYC 7763 y la segunda medición en un 9V74 (la base dio 2,03 s acá y 1,94 s allá con
200 personas; el reparto de esperas de la base fue distinto): **solo se compara dentro de una misma corrida.**

## 6. Revisión crítica (intentando refutar el cambio)

| Pregunta | Respuesta, con lo que la sostiene |
|---|---|
| ¿La mejora depende de un caso favorable? | Se midió con 50, 100 y 200 personas, con y sin historia, en secuencial y con 1, 3 y 5 profesionales a la vez, y la apertura completa. Lo que la propuesta ahorra son las idas y vueltas del paso 3, que crecen con los pares: cuanto más chica la cartera, menos ahorra en valor absoluto (y nada en una cartera vacía, que no hace ninguna consulta de hechos en las dos versiones). |
| ¿Puede crecer mucho la memoria al agrupar lecturas? | Cada consulta devuelve del orden de los pares (hasta 200 personas × 3 alcances = 600 filas chicas): los borradores con `DISTINCT ON` (una fila por par), los Procesos (uno por par, índice parcial), las expectativas (una por Proceso), la actividad agrupada (una fila por persona) y, desde la observación de Dirección del 28/10 (§8), también las solicitudes sin respuesta y las evaluaciones en preparación con `DISTINCT ON`: la base elige la más antigua de cada par; antes se traían todas y se reducían en memoria. No hay lectura de contenidos (planes, comidas, sesiones): solo fechas y cantidades. |
| ¿Una cartera grande perjudica a las pequeñas? | Cada pedido lee su propia cartera; las consultas usan los índices existentes (`plan_*(profesional_id, asesorado_id)` único, `proceso_operativo(profesional_id, asesorado_id, alcance)`, `solicitud_de_formulario(asesorado_id, profesional_id, momento_de_registro)`, `evaluacion_antropometrica(asesorado_id, profesional_id, estado)`, `proxima_revision(proceso_id)`, `version_de_plan_*(plan_id)`) con listas de hasta 200 ids. Lo que una cartera grande sigue costando a las demás es el paso 2 (200 confirmaciones al disco), igual que antes. |
| ¿Se amplió alguna ventana de acceso después de una revocación? | No. El paso 2 no cambia: cada persona se decide en su transacción, con los mismos bloqueos, antes de leer. La lectura solo recibe pares ya permitidos y es más corta que antes: la distancia entre la decisión y el dato que se devuelve se achica, no se agranda. Lo prueban las pruebas de revocación, pausa y finalización (respuesta idéntica a la anterior) y el inventario de pendientes de la medición con las dos versiones. |
| ¿Cambió el resultado entre páginas? | No: cada página recalcula igual que antes (los mismos cuatro pasos) y el cursor es el mismo. La prueba recorre la lista de a 1, 2, 5 y 7 y la compara con la lectura de una vez y con el oráculo. |
| ¿Se conservaron las decisiones de auditoría? | Sí: las mismas 3 filas por persona con vínculo aceptado y por pedido, con su `request_id` (prueba de integración por HTTP, y la cuenta por pedido de la medición). |
| ¿Se trasladó el cuello de botella a otro lugar? | Se quedó donde ya estaba más de la mitad: el paso 2 (el PDP y sus 200 COMMIT). Con la lectura casi gratis, el PDP pasa a ser la mayor parte de la página; en concurrencia, la espera del WAL sigue siendo compartida. Es la alternativa 2 de §7, que requiere decisión de Dirección. |
| ¿La complejidad agregada justifica el beneficio? | El cambio vive en una función (`leerHechosPorConjuntos`, ~130 líneas) y un método del servicio de Procesos; los pasos 1, 2 y 4 son los mismos. A cambio, el paso 3 deja de crecer con las personas y la página baja del orden de lo medido en §5. La copia congelada queda en `test/` como oráculo permanente. |
| ¿Qué quedó afuera? | La suspensión de una cuenta (es administrativa; el PDP la corta igual que antes porque no cambió), el teléfono y el navegador (no se midió el tiempo de pantalla), Render. |

## 7. Lo que queda como propuesta (no se implementa acá)

**Alternativa 2 · las decisiones de una lectura en una sola transacción.** Hoy, con 200 personas, el paso 2 son 200
transacciones (una por persona) y 200 confirmaciones al disco. En una sola transacción serían un BEGIN, los bloqueos
compartidos de toda la cartera (en el orden único, como hace DL-140 para los destinatarios de una nota), una lectura de
hechos de todos los pares, un `createMany` de 600 filas y un COMMIT: de 200 confirmaciones a 1 y de ~1.000 idas y vueltas
a unas pocas. **Qué cambia ante una revocación concurrente:** hoy, un corte que llega mientras se decide a la persona 37
espera solo esa decisión (milisegundos) y la persona 38 ya lo ve. Con una transacción única, el corte espera a que terminen
las 200 decisiones (todo el paso 2), y todas las decisiones llevan el mismo instante y la misma foto. No es una pérdida
de corrección (el corte sigue quedando antes o después de cada decisión, nunca en el medio), pero sí una ventana de
espera más larga para quien corta y una decisión menos «de a una». Es la pieza de autorización (08 §27): **lo decide
Dirección**, con una prueba de carrera con PostgreSQL real antes de integrar.

**Alternativa 3 · no repetir la cartera en cada página.** Cuatro opciones, todas con un cambio de contrato, de pantalla o
de regla: (a) que el website pida solo la primera página hasta que haga falta contar, con otra lectura liviana para los
conteos (cambia la pantalla y agrega un contrato); (b) subir el `limit` máximo de esta lectura, hoy 50 (contrato 09);
(c) calcular una vez y servir las páginas siguientes de lo calculado (choca con decidir en cada pedido sin caché, 08
§27.3 y 08:601); (d) paginar por personas antes de procesar (cambia el orden por urgencia y la cobertura de cada página).
Con el paso 3 por conjuntos, cada página cuesta mucho menos y la urgencia de esta alternativa baja.

**Qué se registra por lectura.** Tres filas por persona y por página, también en áreas sin vínculo; la tabla no se borra.
No se recomienda tocarlo para ganar velocidad: el legajo exige registrar cada decisión (08:634) y las alternativas 1 y 2
no lo necesitan. Si Dirección quisiera revisarlo, es una decisión del legajo (retención de auditoría, 08 §16).

## 8. Observaciones de Dirección (2026-10-28, tarde), para cerrar antes de proponer la integración

**Observación 1 · solicitudes sin respuesta y evaluaciones en preparación.** Se recuperaban completas (todas las de los
pares permitidos) y se reducían en memoria a la más antigua por par. Ahora las elige la base con `DISTINCT ON (asesorado,
alcance)` y `DISTINCT ON (asesorado)`, una fila por par, con el mismo alcance de permisos (cada rama del `OR` es un alcance
con sus asesorados permitidos; la evaluación, solo los permitidos en Antropometría) y el mismo criterio (la más antigua
por `momento_de_registro`, con `id` como desempate, que no cambia el valor elegido). El resultado lo fija la misma prueba
de equivalencia contra la copia congelada. Son las mismas dos sentencias: no cambia la cantidad de idas y vueltas, cambia
cuántas filas viajan. **No se volvió a correr la medición** (Dirección pidió no reiniciarla ni duplicarla): la corrida
40692787787 midió la versión anterior de estas dos consultas; esta no puede sumar idas y vueltas ni filas, así que el
resultado medido es una cota conservadora.

**Observación 2 · el caso decimal de la TVCC-30.** La forma canónica de la huella (`canonicoTvcc30`, @be/domain) es el
JSON del resultado con las claves ordenadas e incluye los cocientes (`tasa`, `porcentaje`) como doubles. Un cociente de 17
dígitos (2/11 = 0,18181818181818182) vuelve de la base como 0,1818181818181818. **Reproducido en la CI del 28/10**
(corrida 40712848030, `tvcc30.int-spec.ts`): la huella guardada (`9d6bb495…`) **no coincide** con la recalculada desde
la fila recuperada (`a4574858…`); la tasa calculada 0,16666666666666666 quedó guardada en `jsonb` como
0,1666666666666667 (16 dígitos); un literal de 17 dígitos escrito por SQL se conserva y Prisma lo lee exacto. O sea: **el
dígito se pierde al escribir a través de Prisma**, no al leer ni en PostgreSQL (la primera atribución, «la lectura de
JSON de Prisma», era errónea; la reproducción la corrigió). **Es un problema previo, no una regresión:** la cartera por
conjuntos no toca la TVCC-30 ni la serialización; lo destapó la suite nueva porque dejó más Procesos en la ventana de la
prueba (d = 11) y el cociente dejó de ser exacto. La garantía afectada es «el resultado conservado se puede verificar con
su huella» (12 §22, REG-06-196): hoy se cumple para la huella guardada junto con el resultado (se calcula en memoria
antes de guardar y no cambia), pero no para una verificación hecha recalculando desde la fila cuando hay un cociente de
17 dígitos: la fila guardada no es byte a byte el resultado calculado. Qué habría que decidir (no se cambia nada acá):
que la forma canónica no incluya los cocientes derivados (`n` y `d` bastan y son enteros), o que los cocientes se
redondeen a una precisión declarada antes de calcular la huella y de guardar (así lo guardado y lo hashado coinciden), o
que se conserve también el texto canónico. Cualquiera cambia qué huellas son válidas: lo decide Dirección.

## 9. Cómo reproducir la medición

**El arnés** es `test/rendimiento/cartera-ab.rendimiento.ts`: el de la segunda medición (`cartera-concurrencia.rendimiento.ts`)
con cada escenario corrido con las dos versiones, alternadas (base y después propuesta en la primera repetición; al revés en
la segunda), en el mismo proceso, la misma base y las mismas carteras. La versión se cambia reemplazando la exportación
`leerCartera` del módulo que usa el controlador (CommonJS) por la copia congelada (`test/integration/soporte-cartera-anterior.ts`),
sin tocar el código de producto; cada lote comprueba cuál quedó puesta y lo anota (`versionComoSeEsperaba`), y las
sentencias por pedido lo confirman por sí solas. Antes de los lotes, el inventario de pendientes de cada cartera se toma con
las dos versiones y se anota si coinciden. El análisis es `test/rendimiento/analizar-ab.mjs` (sin dependencias).

**En GitHub Actions**, como esta vez: la rama descartable `medicion/cartera-ab-2026-10-28` solo agrega el flujo
`.github/workflows/medicion-cartera-ab.yml`, que comprueba que la copia congelada sea la de `main` `e4512cb` (solo pueden
diferir el encabezado, los `import` y el alias), corre el humo (el arnés entero en miniatura, en otra máquina) y, si pasa,
la medición completa en una máquina nueva. No toca test ni Render: PostgreSQL 16 nace vacío en el runner.

**En una máquina propia** con PostgreSQL 16 local y vacío, con `pg_stat_statements` precargado, desde la raíz y con las
dependencias instaladas (no en la PC de trabajo: siembra 1.350 personas y escribe cerca de un millón de filas):

```bash
docker run -d --name be-pg -p 55432:5432 -e POSTGRES_USER=be_test -e POSTGRES_PASSWORD=be_test_sintetico \
  -e POSTGRES_DB=be_test postgres:16-alpine -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.max=10000
npm run build:domain
BE_MEDIR_AB=1 TEST_DATABASE_URL=postgresql://be_test:be_test_sintetico@localhost:55432/be_test \
  BE_CONCURRENCIA_SALIDA=$PWD/resultados/ab \
  npx jest --config test/rendimiento/jest.rendimiento.config.js --runInBand --forceExit 'test/rendimiento/cartera-ab\.rendimiento\.ts$'
node test/rendimiento/analizar-ab.mjs resultados/ab
```

`BE_CONCURRENCIA_PERFIL=humo` corre lo mismo en miniatura (carteras de 5, 10 y 8 personas, 3 observaciones por lote).

**Los archivos de una corrida** (`resultados/ab-2026-10-28/`): `muestras.jsonl` (cada pedido, con su versión, sus tramos
del servidor y, en los secuenciales, sus sentencias), `lotes.jsonl` (cada lote, con la versión puesta y los contadores de
la base y de la máquina), `actividad.jsonl`, `filas-de-decision.json`, `consultas.json`, `poblacion.json` (con el inventario
de pendientes de cada cartera con las dos versiones), `entorno.json`, `estado.json`, `postgres.log`, `maquina.txt`, y los
generados `resumen-ab.md` y `resumen-ab.json`.
