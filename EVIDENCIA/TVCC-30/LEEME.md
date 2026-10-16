# TVCC-30 · el primer cálculo, sobre la cohorte sintética

**Qué es esto:** la primera corrida de la métrica de validación de la tesis (RF-058 · UC-S01), sobre la cohorte de seis personas (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte`).

> **Es una demostración, no una medición.** Los datos son sintéticos: muestran que la métrica se calcula, se explica y se reproduce, no cómo funciona el seguimiento en la realidad.

**Más información:**
- **La definición y las decisiones:** `docs/paquetes/WP-TVCC-30.md` y DEUDA_LEGAJO DL-135.
- **Las pruebas:**
  - `packages/domain/src/tvcc30.test.ts` (TEST-TVCC-001 a 012);
  - `test/integration/tvcc30.int-spec.ts` (TEST-RF-058).

## Cómo se corrió

**Dónde y cuándo:** el 2026-10-16, en local, sobre la base `be_test_cohorte`. La cohorte se cargó ese día y su historia llega hasta el 16/10.

```text
node apps/api/dist/analitica/calcular-tvcc30.js --corte 2026-10-16 --ejecutor "Claude, por delegación de Dirección" --sin-conservar --salida <archivo>
```

**Sin `--demo`:** en esa base no hay cuentas DEMO, solo la cohorte y sus tres profesionales.

## Lo que mostró

```text
TVCC-30 · Tasa de ciclos cerrados trazables en ventana de 30 días
Corte 2026-10-16 (America/Argentina/Buenos_Aires) · ventana del 2026-09-17 al 2026-10-16, 30 fechas
Especificación SPEC-TVCC30-v1 (candidata, BE-LEG-12 v1.0-H §13 a §24) · BE-TVCC30-MAPEO-1 · DEUDA_LEGAJO DL-135
Universo: 7 ciclos · elegibles (D): 7 · cerrados (N): 5 · excluidos: 0 · no resolubles: 0
Cuentas declaradas demo: 0
Resultado: N/D = 5/7 = 71,4 %
Sin conservar (ensayo) · huella 3d3fe065770a64d7462fb8f9b8aa00fc35c83a3235fd72802a9a1947d4ea0ee2
```

## Los siete ciclos

Los siete vencieron estando vigentes. El resultado no lleva nombres: la persona se buscó en la base local con el identificador del Proceso, y es un personaje sintético de la cohorte.

| Ancla | Persona (sintética) | Área | ¿En N? | Qué lo cerró |
|---|---|---|---|---|
| 2026-09-25 | Federico Álvarez | Nutrición | Sí | MANTENER, aplicada el 25/9 |
| 2026-10-06 | Agustina Ledesma | Entrenamiento | Sí | AJUSTAR, aplicada el 6/10 |
| 2026-10-06 | Agustina Ledesma | Nutrición | Sí | AJUSTAR, aplicada el 6/10 |
| 2026-10-08 | Héctor Funes | Nutrición | Sí | CAMBIAR_OBJETIVO, aplicada el 8/10 |
| 2026-10-12 | Norma Castro | Nutrición | **No** | Nada: la revisión está vencida hace 4 días |
| 2026-10-15 | Federico Álvarez | Entrenamiento | **No** | Nada: la revisión está registrada pero sin aplicar |
| 2026-10-16 | Camila Ortiz | Entrenamiento | Sí | AJUSTAR, aplicada el 16/10 |

**Cómo se lee:**
- Los dos ciclos abiertos son los mismos pendientes que el escritorio del profesional muestra ese día.
- Si Sofía Paz revisa a Norma y Martín Acosta aplica la revisión de Federico, la tasa del 16/10 pasa a 7/7. La métrica se mueve con las revisiones, no con mirar pantallas.

## Reproducción

- **Los mismos datos dan la misma huella.** La huella es el SHA-256 de la forma canónica del resultado. Recalcular con los mismos datos, la misma especificación y el mismo corte da la misma huella (12 §22; TEST-TVCC-009).
- **Lo posterior no cambia el corte.** Lo que se registre después del 16/10 no cambia el resultado de ese corte, porque solo se leen hechos registrados antes del fin de la ventana.

**Se comprobó en la cohorte local el mismo 16/10, media hora después del ensayo:**
- La migración se aplicó y la TVCC-30 se corrió dos veces más, esta vez **conservándola**.
- Las dos corridas quedaron en `resultado_tvcc30`. La segunda es sucesora de la primera, y las dos llevan la misma huella que el ensayo (`3d3fe065…a0ee2`).

```text
Resultado: N/D = 5/7 = 71,4 %
Conservado: resultado_tvcc30 9128d7ec-… · huella 3d3fe065…a0ee2 · primero de ese corte
Resultado: N/D = 5/7 = 71,4 %
Conservado: resultado_tvcc30 911e9143-… · huella 3d3fe065…a0ee2 · sucesor de 9128d7ec-…
```

## Falta

- **Correrlo en test** desde la consola del servicio `be-api` en Render, declarando demo las cinco cuentas DEMO. El comando está en el paquete, §5.
