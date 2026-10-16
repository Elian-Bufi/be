# WP-TVCC-30 — La métrica de validación de la tesis, calculada y conservada · definición del paquete

> **Mandato de Dirección del 2026-10-16:** «que vayas haciendo los casos de uso y los requisitos funcionales que venimos desarrollando y que faltan», «que te orientes a través de los legajos para seguir» y «si no es mucho el riesgo, directamente tómala».
>
> **Legajo:**
> - **02:** §16, la North Star.
> - **04:** RF-058 (P1).
> - **05:** UC-S01 (§14.10).
> - **06:** B-12, REG-06-186 a 201. Consume REG-06-75 (ContinuidadOCierreAplicado), REG-06-145 y 146 (expectativas de revisión), REG-06-149 y REG-06-150 (revisión pendiente).
> - **07:** §24 y §42.1. Es un cálculo a pedido desde el dominio, en el módulo `analitica`, y no es telemetría.
> - **09:** ANA-P1 «internal/reproducible; HTTP only when 12 closes spec», y TRACE-DEBT-12-001.
> - **11A:** §21, de TEST-TVCC-001 a TEST-TVCC-012.
> - **12:** §12 a §27, SPEC-TVCC30-v1 (candidata).
>
> **Decisiones:** DEUDA_LEGAJO DL-135.

## 1. Objetivo y demostrables

La tesis no promete mejoras de salud ni de retención: promete que **BE hace que el seguimiento profesional se cierre de forma trazable**. La TVCC-30 lo mide:

> De los ciclos de seguimiento que vencieron en una ventana de 30 días, cuántos tuvieron antes del corte una revisión profesional válida con su continuidad o su cierre aplicados.

Hasta hoy estaba definida en el legajo, pero no se podía calcular.

**Demostrables:**
- **Un comando:** el responsable de validación lo corre y obtiene N, D y la tasa de un corte, con cada ciclo y el motivo por el que entró o quedó afuera.
- **La conservación:** el resultado queda guardado con su huella. Recalcularlo con los mismos datos da la misma huella.
- **Las doce pruebas del 11A §21** pasan en la CI, junto con la prueba de integración contra PostgreSQL.
- **Un primer resultado sobre la cohorte sintética.** Es una demostración, no una medición.

## 2. Qué es un ciclo en BE, y cuándo cierra

El 12 deja a la implementación dos cosas: qué es un ciclo y cuál es su fin canónico. BE ya guardaba todo lo necesario, así que no hubo que agregar hechos nuevos.

- **El Proceso operativo** de Nutrición o de Entrenamiento. Es uno por profesional, persona y alcance.
- **Su cadena de expectativas de revisión** (`proxima_revision`). La fija la versión de plan al activarse o la revisión al aplicarse, y reprogramar agrega una sucesora.
- **Sus revisiones,** y la aplicación de cada una, con el evento `ContinuidadOCierreAplicado`.

Con eso, el mapeo (DL-135):

| Concepto del 12 | En BE |
|---|---|
| Ciclo | Un tramo de la cadena de expectativas, que termina en la que satisface una revisión aplicada. Las que una versión de plan reemplazó antes son reprogramaciones del mismo ciclo |
| Fin canónico (ancla) | La fecha de la primera expectativa del tramo que venció estando vigente. Si una revisión cerró el ciclo antes de que venciera, la fecha que tenía en ese momento. Sin fecha, el día en que se registró (REG-06-150) |
| Revisión válida con próxima acción o cierre aplicado | La primera revisión cuya aplicación se registró con esa expectativa vigente. Lo que la revisión fija al aplicarse ya es el ciclo siguiente |
| Antes del corte | Registrado antes de las 00:00 del día siguiente al corte, en Buenos Aires |
| Demo | Las cuentas que se declaran demo en la corrida. BE no las marca en su modelo |
| Vínculo elegible | El vínculo por alcance ACEPTADO y el B2 VIGENTE cuando el ciclo venció |

**Lo que no suma** (12 §24): abrir pantallas, escribir notas y editar sin revisión no dejan hechos que el cálculo lea. Tampoco suman:
- **reprogramar después del vencimiento:** el ciclo queda anclado en la primera fecha;
- **una revisión sin aplicar;**
- **una segunda revisión** sobre la misma expectativa.

## 3. Cómo se clasifica cada ciclo (12 §16)

Primero se arma el universo U: los ciclos con el ancla dentro de la ventana. Después, a cada uno se le aplican los criterios en este orden, y el primero que falla es su motivo:

| Motivo | Resultado | Criterio |
|---|---|---|
| `VERTICAL_SIN_REVISION` | Excluido | §16.3 |
| `CUENTA_DEMO` | Excluido | §16.1 |
| `SEGUIMIENTO_CERRADO_ANTES_DEL_ANCLA` | Excluido | §16.2. El vínculo terminó, o la cuenta se cerró, antes de que el ciclo venciera |
| `VINCULO_PAUSADO_EN_EL_ANCLA`, `VINCULO_NO_VIGENTE_EN_EL_ANCLA`, `CONSENTIMIENTO_NO_VIGENTE_EN_EL_ANCLA` | Excluido | §16.2 |
| `SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA`, `CADENA_DE_EXPECTATIVAS_INCONSISTENTE` | No resoluble | §16.5. Bloquea el valor (§21) |
| — | Elegible | Entra en D, y en N si cerró antes del corte |

**El valor:**
- con D > 0 y nada no resoluble, N/D;
- con D = 0, «sin valor» con N = 0 y D = 0, nunca «0 %» (§20);
- con algo no resoluble, «sin valor» y el detalle (§21).

## 4. Modelo (migración aditiva `20261016160000_resultado_tvcc30`)

`resultado_tvcc30` guarda cada corrida, y solo admite agregar filas.

**Qué guarda cada fila:**
- la especificación y el mapeo;
- el corte, la zona y la ventana;
- N, D y los conteos;
- el resultado completo en su forma canónica;
- la huella SHA-256;
- el ejecutor, el ambiente y la procedencia.

**Cómo se encadenan:** cada corrida es sucesora de la última del mismo corte y zona. Otra especificación sobre el mismo corte es otro resultado y no reemplaza al anterior (REG-06-198).

**Qué controla la base:**
- N y D van juntos, y N ≤ D;
- solo hay tasa con D > 0 y nada no resoluble;
- la huella tiene forma de SHA-256;
- no se puede modificar, borrar ni truncar.

## 5. Cómo se corre

Es interno y no tiene HTTP: el 09 no cambia. Lo corre el responsable de validación, que es el actor de UC-S01, con la API construida.

```text
node apps/api/dist/analitica/calcular-tvcc30.js --ejecutor "Dirección" [--corte AAAA-MM-DD] [--demo <archivo o ids separados por comas>] [--salida resultado.json] [--sin-conservar]
```

- **En test:** desde la consola del servicio `be-api` en Render (Shell), en `/app`. Las cuentas DEMO se declaran con `--demo`. Los cinco identificadores están fuera del repo, en `C:\Users\bufim\BE-datos-locales\cohorte-test\cuentas-demo-tvcc30.txt`.
- **En local:** con `DATABASE_URL` apuntando a la base.

**Qué muestra en pantalla:** la ventana, N, D, la tasa si existe, y cuántos ciclos quedaron afuera y por qué. No muestra identificadores de personas.

## 6. Pruebas y evidencia

- **`packages/domain/src/tvcc30.test.ts`:** de TEST-TVCC-001 a TEST-TVCC-012 contra la regla, con hechos armados a mano.
- **`test/integration/tvcc30.int-spec.ts`** (TEST-RF-058 · UC-S01), contra PostgreSQL real:
  - los ciclos salen de recorridos reales por la API: plan con fecha de revisión, revisión aplicada, revisión sin aplicar y vínculo pausado;
  - mirar el tablero y la cartera no cambia la huella;
  - dos corridas quedan encadenadas con la misma huella, y otra especificación es otro resultado;
  - la base rechaza modificar, borrar o guardar un resultado incoherente.
- **`schema.int-spec.ts`:** `resultado_tvcc30` rechaza `TRUNCATE`.
- **`EVIDENCIA/TVCC-30/LEEME.md`:** el primer resultado sobre la cohorte.

## 7. Fuera de alcance

- **La operación HTTP y la pantalla:** esperan que el 12 cierre la especificación y que haya un consumidor (09; TRACE-DEBT-12-001).
- **Marcar las cuentas demo en el modelo de identidad:** hoy se declaran en cada corrida.
- **Exportar el resultado a un informe académico:** el JSON de `--salida` es la base.

## 8. Estado (2026-10-16)

- **Implementado:** dominio, API, migración, comando, pruebas y documentación.
- **Verificado:**
  - las doce pruebas del dominio pasan;
  - la integración local pasa (`tvcc30` y `schema`, 58 de 58);
  - el ensayo sobre la cohorte local da 5 de 7.
- **Pendiente:**
  - la CI;
  - correrlo en test desde la consola de Render;
  - que Dirección ratifique D-1 a D-9.
