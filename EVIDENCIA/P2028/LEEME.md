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
