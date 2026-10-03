# Evidencia · El 503 intermitente (P2028): causa, corrección y medición

**Estado:** la corrección está implementada en el PR #134, **sin integrar**. Bajó los 503 en la reproducción
controlada, pero no los eliminó. Más abajo está el siguiente cuello de botella medido.

## Qué pasaba

- Un `503 DB_UNAVAILABLE` intermitente en lecturas concurrentes. `DEFENSA/WP-06.md` §5.5 lo dejó sin explicar, y volvió a
  aparecer en el recorrido local del pulido (2026-10-02), con nutrición y la lista de tomas.
- El filtro de errores lo registraba como `P2028`, sin la fase.

## La causa, con evidencia

1. **La fase es «Unable to start a transaction in the given time».** El pedido esperó más de 2 s, el `maxWait` por
   defecto de Prisma, a que el pool le diera una conexión para empezar su transacción. Se vio con un rastro temporal del
   mensaje en el build local; ahora el log técnico lo registra como `fase: "inicio"`, sin el mensaje.
2. **El pool tiene 9 conexiones**, el valor por defecto de Prisma para 4 núcleos físicos (4 × 2 + 1).
3. **Cada lectura protegida retiene su conexión durante todas sus idas y vueltas a la base, aunque la base trabaje
   muy poco:**
   - Con una sola lectura por vez, la base trabaja entre 0 y 11 ms por pedido, y el pedido dura entre 30 y 200 ms.
   - En la evolución antropométrica, la transacción quedaba abierta 156 ms con 11 ms de base: 71 ms eran el armado de la
     respuesta, antes del COMMIT.
   - Durante las ráfagas, `pg_stat_activity` mostró las 9 conexiones en `idle in transaction · ClientRead`: esperaban a la
     API, no a la base.
4. **Cuando cada ida y vuelta se estira** (una máquina sin CPU, o latencia entre la API y la base), las conexiones no se
   liberan, el pool se agota y los pedidos que esperan más de 2 s fallan con P2028.

## Cómo se reprodujo

- **Datos:** base local sintética (PostgreSQL 16, puerto 55432), sembrada con un profesional habilitado en tres
  verticales y un asesorado con tres tomas completas y 15 cálculos por toma.
- **API:** Node 22, desde `apps/api/dist`, con el pool por defecto (9), `maxWait` 2 s y `timeout` 5 s. **No se cambiaron.**
- **Latencia controlada:** un proxy TCP entre la API y la base que demora cada paquete 25 ms por sentido
  (`herramientas/proxy-con-latencia.cjs`). Simula de forma repetible que cada ida y vuelta se estira.
- **Carga:** tres páginas de un asesorado a la vez. Son 33 lecturas concurrentes: 11 por página, de nutrición, antropometría
  y vínculos (`herramientas/rafagas.mjs`).
- **Límite por actor:** el por defecto, de 120 consultas protegidas por minuto. La API se reinició antes de cada corrida para
  ponerlo en cero; con seis páginas, aparece un 429 antes de que se agote el pool.

## Antes y después, con las mismas condiciones

| Corrida | Commit | Pedidos | Con 200 | Con 503 (P2028, inicio) | Sin respuesta | Mediana | Máximo |
|---|---|---|---|---|---|---|---|
| Antes 1 | `main` `0909fa9` | 33 | 14 | **19** | 0 | ~3,2 s | ~5,0 s |
| Antes 2 | `main` `0909fa9` | 33 | 16 | **17** | 0 | 3,2 s | 4,9 s |
| Antes 3 | `main` `0909fa9` | 33 | 16 | **17** | 0 | 3,3 s | 5,0 s |
| Después 1 | PR #134 | 33 | 22 | **11** | 0 | 3,2 s | 5,1 s |
| Después 2 | PR #134 | 33 | 23 | **10** | 0 | 3,2 s | 4,6 s |
| Después 3 | PR #134 | 33 | 23 | **10** | 0 | 3,2 s | 4,7 s |

Los datos crudos de cada pedido, con su estado y su duración, están en `herramientas/antes-*.json` y
`herramientas/despues-*.json`. Del primer «antes» se conservó solo el resumen.

**Consultas por lectura**, de a una lectura y sin latencia agregada:

| Lectura | Antes | Después |
|---|---|---|
| Lista de tomas | 17 | 12 |
| Detalle de una toma | 24 | 19 |
| Cálculos | 25 | 20 |
| Evolución antropométrica | 25 (201 ms) | 20 (134 ms) |
| Evaluaciones de nutrición | 15 | 10 |
| Objetivo vigente de nutrición | 14 | 9 |
| Métodos y vínculos (no pasan por el PDP) | 10 y 14 | 10 y 14 |

## La corrección

No cambia tiempos de espera, tamaño del pool ni límites.
1. **El PDP toma sus seis bloqueos en una sola llamada.** La función `be_bloquear_lo_que_corta` (migración
   `20261003000000`) ejecuta las mismas seis sentencias, en el mismo orden y con los mismos modos, dentro de la misma
   transacción de la decisión.
   - Pasa de seis idas y vueltas a una.
   - `migrate diff` no compara funciones. Por eso la prueba de esquema verifica, específicamente, que exista con su firma
     y que bloquee las seis tablas en el orden único, en modo compartido.
2. **La evolución arma su respuesta después del COMMIT.**
   - La decisión del PDP y las tres lecturas (mediciones, corridas y mediciones ajenas) siguen dentro de la transacción.
   - Después corre solo la transformación pura, con lo leído en ella.
3. **El log técnico registra la fase del P2028:** `inicio` o `vencida`, nunca el mensaje.

## Qué no prueba

- **No demuestra** que el incidente original tuviera exactamente esta causa. La latencia agregada es un sustituto
  repetible de «cada ida y vuelta se estira».
- **No explica ni elimina** los ~3 s que se perciben al entrar a «Mi evolución» en la APK. Esa medición manual va contra
  Render, con otro hardware y otra red.
- **En Render**, el pool depende de los núcleos de esa instancia, que no se midieron: el ambiente `test` no se tocó.

## El siguiente cuello de botella medido

- **Las lecturas del dominio con `include` de Prisma**, que hace una consulta por relación: el detalle de una toma hace 19 y
  los cálculos 20, con muy poco trabajo de base. Agruparlas con un *join* bajaría las idas y vueltas.
- **Tres consultas de sesión por pedido** (sesión, identidad y control de sesión), que podrían ser una.

Las dos son propuestas para otra tanda: cambian código compartido por todas las lecturas.

## Segunda tanda (2026-10-03): carga de una persona, estrés y un experimento descartado

**Condiciones.** Iguales a las de arriba, en otra base sintética (`be_p2028b`):
- base detrás del proxy de 25 ms por sentido;
- API reiniciada antes de cada corrida, para que el límite por actor no contamine;
- pool de 9 conexiones, `maxWait` de 2 s y `timeout` de 5 s, sin cambios.

Los datos crudos están en `herramientas/2026-10-03/`.

**Carga de una persona.** Una página de un asesorado: sus 11 lecturas a la vez, tres veces seguidas. Son 33 pedidos por
corrida.

| Corrida | Commit | Pedidos | Con 200 | Errores | Mediana | Máximo |
|---|---|---|---|---|---|---|
| 1 | `main` `0909fa9` | 33 | 33 | 0 | 2,07 s | 3,53 s |
| 2 | `main` `0909fa9` | 33 | 33 | 0 | 1,99 s | 3,57 s |
| 3 | `main` `0909fa9` | 33 | 33 | 0 | 1,97 s | 3,57 s |
| 1 | PR #134 `d5c4bb2` | 33 | 33 | 0 | 1,58 s | 2,99 s |
| 2 | PR #134 `d5c4bb2` | 33 | 33 | 0 | 1,59 s | 2,94 s |
| 3 | PR #134 `d5c4bb2` | 33 | 33 | 0 | 1,61 s | 2,93 s |

Con una persona no hay errores, ni antes ni después. #134 baja la mediana de ~2,0 s a ~1,6 s y el máximo de ~3,55 s a
~2,95 s. Son tres corridas por lado: no alcanzan para percentiles.

**Estrés.** Tres páginas a la vez: 33 lecturas simultáneas, como en la primera tanda.

| Corrida | Commit | Pedidos | Con 200 | Con 503 (P2028, inicio) | Sin respuesta (60 s) | Mediana | Máximo con respuesta |
|---|---|---|---|---|---|---|---|
| 1 | PR #134 `d5c4bb2` | 33 | 21 | 11 | 1 | 3,26 s | 5,2 s |
| 2 | PR #134 `d5c4bb2` | 33 | 21 | 12 | 0 | 3,22 s | 4,4 s |
| 3 | PR #134 `d5c4bb2` | 33 | 22 | 11 | 0 | 3,25 s | 5,2 s |

Confirma lo medido en la primera tanda, 11, 10 y 10. En la primera ráfaga después de reiniciar la API, un pedido quedó sin
respuesta hasta que el cliente cortó a los 60 s. No se investigó: queda anotado.

**Experimento E1, descartado: el guard de sesión en una sola consulta.**
- **El cambio.** El guard leía la sesión, la identidad y el control de sesión con tres consultas fuera de la
  transacción. Se probó una sola, con las mismas comprobaciones.
- **El efecto en las consultas.** El detalle de una toma bajó de 19 a 17, los cálculos de 20 a 18 y las evaluaciones de
  nutrición de 10 a 8.
- **El estrés:**

  | Corrida | Pedidos | Con 200 | Con 503 | Sin respuesta | Mediana |
  |---|---|---|---|---|---|
  | E1-1 | 33 | 19 | 13 | 1 | 2,70 s |
  | E1-2 | 33 | 20 | 13 | 0 | 2,73 s |
  | E1-3 | 33 | 20 | 13 | 0 | 2,69 s |

- **Por qué se descartó.** La mediana bajó, pero los 503 subieron de 11–12 a 13. Al terminar antes el guard, más
  pedidos llegan juntos a pedir su transacción, y la espera de 2 s se supera más seguido. No mejora el P2028, así que no
  se incorporó. El código del experimento está en `herramientas/2026-10-03/experimento-e1-sesion.guard.ts.txt`.

**Qué domina el costo hoy.** Medido con el contador temporal, de a una lectura. Una lectura protegida hace:
- 3 consultas de sesión, fuera de la transacción;
- dentro de la transacción: `BEGIN`, el PDP (bloqueos, hechos y la decisión registrada) y las lecturas del dominio con
  `include`, una por relación (10 en el detalle de una toma, 11 en los cálculos, 1 en las evaluaciones de nutrición),
  más los nombres de los profesionales y el `COMMIT`.
- Lo que retiene la conexión son las idas y vueltas dentro de la transacción. Con 33 transacciones de unas 16 idas y
  vueltas, y 9 conexiones, no todas pueden empezar en 2 s.

**El límite que queda, delimitado.** Con una persona no hay errores. Con tres páginas a la vez y cada ida y vuelta
estirada a 50 ms, un tercio de los pedidos recibe 503: el pool no da abasto en el `maxWait`. Las salidas cambian algo
de fondo, y quedan como decisión:
1. **Agrupar las lecturas con `include` en *joins*.** Prisma 6.19 lo hace con `relationLoadStrategy: 'join'`, pero solo
   activando la función en preview `relationJoins`, que cambia el cliente generado entero. La otra vía es reescribir
   esas lecturas en SQL. Ataca la causa.
2. **Una cola de transacciones en la API**, con un tope de espera propio. Cambia el 503 por demora y hay que revisar las
   transacciones anidadas para no crear un bloqueo mutuo.
3. **Dimensionar el pool y el `maxWait` con los núcleos y la latencia reales de Render**, que no se midieron.

Nada de esto toca los bloqueos, la auditoría ni la consistencia. Tampoco explica los ~3 s de «Mi evolución» en el
teléfono, que se miden contra Render, con otra red y otro hardware.
