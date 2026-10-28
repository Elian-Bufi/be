# Rendimiento de la cartera (API-CAR-01) con 50, 100 y 200 personas

Encargo nocturno del 2026-10-27, §10. Commit de referencia: `e4512cb`.

## En una línea

Una medición reproducible de la cartera del profesional, en un entorno aislado (un PostgreSQL 16 que nace vacío), con
50, 100 y 200 personas sintéticas. **Un resultado de acá describe la máquina donde corrió: no dice nada de Render.**

## Qué hace la cartera, leído en el código

`apps/api/src/cartera/lectura-cartera.ts` (`leerCartera`):

1. **Una consulta** trae los vínculos aceptados del profesional, con un tope de 200 personas (`MAXIMO_DE_ASESORADOS`).
2. **Por cada persona**, el PDP decide por área (`decidirPorAlcance`): su propia transacción, con los bloqueos
   compartidos de `be_bloquear_lo_que_corta`, una lectura de hechos y **una fila nueva en `decision_de_acceso` por
   área**. Con 200 personas son unas 200 transacciones seguidas y hasta 600 filas por cada vez que se abre la cartera.
3. **Una transacción de lectura** recorre persona por persona y área por área (`dePlanificacion`, `deAntropometria`),
   con varias consultas cada vez.

De ahí salen tres hipótesis, que la medición pone a prueba y que **no son resultados**:

- **H1.** La latencia crece más o menos en línea con la cantidad de personas.
- **H2.** El paso 2 (una decisión registrada por persona y área) pesa más que el resto.
- **H3.** `decision_de_acceso` crece unas tres filas por persona cada vez que se abre la cartera: con 200 personas,
  del orden de 600 filas por lectura. Es historia que no se borra (append-only).

## Cómo se mide

`test/rendimiento/cartera.rendimiento.ts`, con su configuración `test/rendimiento/jest.rendimiento.config.js`. Usa el
mismo arnés que las pruebas de integración y arma la población por la API, como ellas:

- un profesional con Nutrición y Entrenamiento;
- cada persona con el vínculo de Nutrición; una de cada dos, también con Entrenamiento; una de cada cinco, con un plan
  nutricional activado;
- los tamaños se acumulan: 50, después 100 y después 200 personas en la misma cartera.

Para cada tamaño, después de tres lecturas de calentamiento, 20 lecturas de `GET /api/v1/me/portfolio?limit=50`:

| Métrica | Cómo | Precisión |
|---|---|---|
| Latencia (mínimo, mediana, p95, máximo) | Reloj alrededor de cada pedido, en el mismo proceso | Exacta para esa máquina |
| Filas nuevas en `decision_de_acceso` por lectura | Conteo antes y después | Exacta |
| Transacciones confirmadas por lectura | `pg_stat_database.xact_commit`, con 1,2 s de pausa para que se publique | Aproximada |
| Ítems devueltos | La respuesta | Exacta |

No es parte de la CI: su nombre no termina en `.int-spec.ts`, y solo corre con `BE_MEDIR_RENDIMIENTO=1`.

## Cómo correrla

En un PostgreSQL 16 local y vacío (la guardia del arnés rechaza una base que no sea `localhost`), desde la raíz, con
las dependencias instaladas:

```bash
npm run build:domain
BE_MEDIR_RENDIMIENTO=1 TEST_DATABASE_URL=postgresql://…@localhost:…/be_rendimiento \
  npx jest --config test/rendimiento/jest.rendimiento.config.js --runInBand
```

Variables opcionales: `BE_CARTERA_TAMANIOS` (por omisión `50,100,200`), `BE_CARTERA_LECTURAS` (20) y
`BE_RENDIMIENTO_SALIDA` (por omisión, `resultados/` en esta carpeta). Sin `TEST_DATABASE_URL`, el arnés levanta un
contenedor con Testcontainers.

**En esta PC no se corrió:** el 2026-10-28 había 0,5 GB de memoria libre de 5,9, y levantar PostgreSQL, la API y sembrar
200 personas a la vez arriesgaba la máquina. Se corrió en un runner de GitHub (ver «Resultados»).

## Cómo leer los resultados

- Comparar los tamaños entre sí, en la misma corrida: eso dice cómo crece.
- No comparar con Render. Render tiene otra CPU, otra memoria, la base en otra máquina y una red en el medio.
- Un p95 alto con una mediana baja habla de esperas o de ruido de la máquina, no de la cartera en sí.
- Lo que se decida a partir de acá (paginar personas, decidir el PDP en lote, no registrar una decisión por lectura) es
  un cambio de arquitectura: **no se implementa en este encargo**, y necesita una decisión de Dirección y del legajo
  (registrar cada decisión es una regla, 08:634).

## Resultados

Ver `resultados/`. Cada corrida deja un JSON y una tabla con la máquina donde corrió.
