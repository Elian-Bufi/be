# Cartera por conjuntos · nota única para retomar (2026-10-28)

Encargo de Dirección del 2026-10-28 (el segundo del día): reducir el tiempo de carga de la cartera profesional
(API-CAR-01) conservando el comportamiento del producto, sus permisos y su trazabilidad; una mejora acotada en un PR en
borrador, con comparación antes/después reproducible y una explicación visual.

## Dónde quedó

- **PR #222, en borrador**, rama `wp-cartera-lectura-por-conjuntos` sobre #221 (`wp-cartera-concurrencia-2026-10-28`,
  cuyo arnés reutiliza). Código de producto medido: `main` `e4512cb`. Nada se integró, desplegó ni cargó en test; las
  cuentas y los escenarios de la prueba breve quedaron como estaban.
- **El cambio de producto** son dos archivos: `apps/api/src/cartera/lectura-cartera.ts` (el paso 3, por conjuntos) y
  `apps/api/src/proceso/proceso.service.ts` (`proximasRevisionesVigentes`). Los pasos 1 (vínculos), 2 (PDP) y 4 (orden
  y página) no cambian.
- **La evidencia:** `EVIDENCIA/RENDIMIENTO-CARTERA/LECTURA-POR-CONJUNTOS.md` (diagnóstico, alternativas, hipótesis y
  criterio escritos antes de medir, resultados, revisión crítica, propuesta) y `resultados/ab-2026-10-28/` (cada
  muestra y cada lote de la medición). El PDF didáctico: `EVIDENCIA/RENDIMIENTO-CARTERA/didactico/salida/BE-cartera-por-conjuntos.pdf`
  (fuente `cartera-por-conjuntos.typ`, láminas desde código, respuestas en `RESPUESTAS.md`).
- **La rama descartable** `medicion/cartera-ab-2026-10-28` solo agrega el flujo de la medición; no se integra.

## Hechos comprobados

- La lectura por conjuntos devuelve **exactamente** lo mismo que la anterior: `test/integration/cartera-por-conjuntos.int-spec.ts`
  compara byte a byte con la copia congelada de `e4512cb` (`soporte-cartera-anterior.ts`) en carteras vacía, mixta
  (tres áreas, los siete tipos de pendiente, empates) y grande (40 personas), con todos los filtros, el período, páginas
  de 1, 2, 5 y 7, y ante revocar, pausar, reanudar y finalizar. Verificado en la CI del PR.
- Cada pedido deja las mismas 3 filas de decisión por persona con vínculo aceptado (CI y medición).
- Lo que crece con las personas es solo el PDP: 6 personas → 45 sentencias, 12 → 75 (5 por persona, 15 fijas; CI).
- La medición antes/después (corrida 40692787787, un runner de GitHub, las dos versiones alternadas en el mismo proceso
  y la misma base; 3.320 pedidos, 0 errores): con 200 personas, la mediana de una página pasó de 2.032 a 938 ms
  (−54 %); con historia, de 2.350 a 968 ms (−59 %); con 50 y 100 personas, −54 %; las cuatro páginas que lee el website
  al abrir, de 8,2 a 3,9 s (−53 %; 9,6 a 3,8 s con historia). Con 5 profesionales a la vez, el doble de páginas por
  segundo (1,06 → 2,28). El bloque de lectura pasó de 1.137 a 23 ms (1.383 a 48 con historia); el PDP no cambió. Mismas
  filas de decisión (3 por persona en cada pedido), mismos COMMIT. Detalle y condiciones en LECTURA-POR-CONJUNTOS.md §5.
  **No dice nada de Render.**

## Hipótesis (no comprobadas)

- En Render, con la base en otra máquina, cada ida y vuelta cuesta más que en el runner: el ahorro del paso 3 debería ser
  mayor en proporción. No se midió.
- El paso 2 (el PDP, 200 COMMIT por página) es ahora la mayor parte de la página; en concurrencia, la espera del WAL
  sigue siendo el techo. Sin medir con más de 5 profesionales.

## Alternativas descartadas (quedan como propuesta, decisión de Dirección)

- Las 200 decisiones del PDP en una sola transacción: cambia la ventana de los bloqueos y el instante de cada decisión
  (08 §27). Con análisis de la revocación concurrente en LECTURA-POR-CONJUNTOS.md §7.
- No repetir la cartera en cada página (website, `limit`, servir de lo calculado, paginar por personas): contrato,
  pantalla o regla del legajo (08 §27.3).
- Registrar menos por lectura: regla del legajo (08:634).
- `synchronous_commit = off`: descartada en #221 (el registro es la condición del acceso).

## Hallazgos fuera del paquete

- `test/integration/tvcc30.int-spec.ts` comparaba byte a byte el resultado conservado con el calculado; un cociente de
  17 dígitos (2/11) vuelve de la base con 16 (la lectura de JSON del cliente de Prisma no garantiza la ida y vuelta
  exacta). Lo destapó la suite nueva, que deja más Procesos en la ventana. La comparación pasó a 15 dígitos
  significativos (commit `876bff1`); si la huella conservada tiene que poder recalcularse desde la fila, es una
  pregunta para Dirección (RF-058, REG-06-196). Severidad: baja (presentación de un decimal); no toca el producto.
- El pendiente `REVIEW_UNDATED` (una expectativa de revisión sin fecha, REG-06-150) existe en el contrato y en el código
  de la cartera, pero ninguna operación de la API lo produce hoy: activar fija una expectativa solo si la versión trae
  fecha (`nutricion/planes.service.ts`, `entrenamiento/planes.service.ts`) y aplicar una revisión solo si la revisión la
  trae (`revisiones.service.ts`). La prueba de equivalencia lo siembra por SQL. Severidad: baja (rama sin uso); decidir
  si una revisión «sin fecha» debe poder registrarse como tal o si el tipo se retira del contrato.

## Próximos pasos

1. Dirección decide si integra #222 (después de #219 y #221, su base). Comprobación mínima posterior: abrir el espacio
   profesional en test con la cuenta de la cohorte y comparar la lista con la de antes (mismos ítems, mismo orden) y el
   tiempo de las cuatro páginas en la pestaña de red del navegador.
2. Si se quiere seguir con el rendimiento: la alternativa 2 (una transacción para las decisiones) necesita una decisión
   sobre la pieza de autorización y una prueba de carrera con PostgreSQL real antes de escribirla.
3. Borrar la rama `medicion/cartera-ab-2026-10-28` cuando Dirección lo decida.

## Cómo retomar

- Árbol de trabajo: `C:\Users\bufim\BE-cartera-lectura` (rama `wp-cartera-lectura-por-conjuntos`; `node_modules`
  espejado con junctions a `BE-Best`, salvo `@be/*`, que apuntan al árbol).
- Pruebas: `npm run test:integration` (CI) o `npx jest --config apps/api/jest.integration.config.js --runInBand
  cartera-por-conjuntos` con un PostgreSQL local (`TEST_DATABASE_URL`).
- Medición: el flujo de la rama descartable, o localmente con `BE_MEDIR_AB=1` (ver LECTURA-POR-CONJUNTOS.md §8).
- PDF: desde `EVIDENCIA/RENDIMIENTO-CARTERA/didactico`, `node datos.mjs <carpeta-de-resultados>` y `node construir.mjs`
  (Typst 0.15.1).
