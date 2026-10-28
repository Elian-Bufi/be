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

## 5. Resultados

*(Se completa con la corrida de la medición. Hasta entonces, esta sección dice «sin medir».)*

## 6. Revisión crítica

*(Se completa al cerrar.)*

## 7. Lo que queda como propuesta (no se implementa acá)

*(Se completa al cerrar: la alternativa 2 con el análisis de la revocación concurrente, la 3 con sus opciones.)*
