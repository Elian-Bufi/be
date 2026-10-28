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

Cada corrida deja un JSON y una tabla con la máquina donde corrió, en `resultados/`.

### 2026-10-28, en un runner de GitHub

**Dónde:** un runner `ubuntu-24.04` de GitHub (4 CPU, 15,6 GB, Node 22.23.2), con PostgreSQL 16 en un contenedor de
la misma máquina. Corrida 40641148313, desde la rama descartable `medicion/cartera-2026-10-28` (que solo agrega el
flujo `medicion-cartera.yml`; no se integra). El repositorio es público: la corrida no tuvo costo. **Ni esta PC ni
Render.**

| Personas | Mediana (ms) | p95 (ms) | Máximo (ms) | Filas nuevas en `decision_de_acceso` por lectura | Transacciones por lectura (aprox.) |
|---|---|---|---|---|---|
| 50 | 312 | 336 | 344 | 150 | 62 |
| 100 | 617 | 870 | 978 | 300 | 117 |
| 200 | 1.233 | 1.495 | 1.580 | 600 | 200 |

20 lecturas por tamaño, después de 3 de calentamiento. Las tres devolvieron la primera página de 50 ítems.

**Qué dice, en esta máquina:**

- **H1, en línea: se cumple.** La mediana crece unos 6,2 ms por persona (312 ms con 50, 617 con 100, 1.233 con 200).
  Duplicar las personas duplica el tiempo.
- **H3, las filas: se cumple exactamente.** Cada lectura agrega 3 filas por persona a `decision_de_acceso`: una por
  área, también en las áreas sin vínculo. Con 200 personas, 600 filas cada vez que se abre la cartera. Si ese
  profesional la abre 20 veces en un día, son 12.000 filas de historia por día, que no se borran.
- **Las transacciones** son una por persona, más unas pocas fijas (aproximado): el PDP abre una por cada una.
- **H2, el peso del PDP: no se midió directamente.** La medición no separa el paso 2 del 3. Que el tiempo y las
  transacciones crezcan juntos, de a una por persona, es compatible con H2, pero no la prueba.

**Qué no dice:** cuánto tarda en Render (otra CPU, la base en otra máquina y la red en el medio), ni con varios
profesionales a la vez. El tope de 200 personas por lectura (`MAXIMO_DE_ASESORADOS`) hace que 200 sea el peor caso de
una sola cartera.

**Para decidir, no para implementar acá:** si 1,2 s con 200 personas es aceptable, y si cada apertura de la cartera
tiene que dejar 3 filas por persona en la historia de decisiones. Cualquier cambio (decidir en lote, paginar por
personas, registrar distinto) toca una regla del legajo y la arquitectura del PDP.
