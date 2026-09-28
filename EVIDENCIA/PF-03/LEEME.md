# Evidencia · PF-03, incremento 1 — «Lo planificado, visible y comparable»

Decisión: [DL-105](../../docs/DEUDA_LEGAJO.md) (PF03-D-1, opción A, Dirección, 2026-09-28). Ficha: `docs/propuestas/PF-03_profundizacion-de-entrenamiento.md`.

| PR | Qué entrega | Estado |
|---|---|---|
| PR-1 · dominio y website | Presentación compartida y fiel de la prescripción; editor con nota por serie, atajo de descanso y ayuda de tempo; Plan y Ejecuciones con lo planificado completo | Para auditoría, sin integrar |
| PR-2 · APK | «Hoy», la sesión y el historial con la presentación completa; lo planificado como referencia al registrar; ayuda del motivo | Para auditoría, sin integrar. Se publica en una sola APK junto con DL-104 |

**Sin cambios de contrato.** Esta tanda no toca `contratos-*.ts`, `cliente-http.ts`, OpenAPI, la API ni la base. Solo cambia cómo se muestra lo que ya viaja. Las respuestas que lee la APK 0.11.3 no cambian de forma.

## PR-1 · dominio y website

**Qué cambia.**
- **Dominio** (`packages/domain/src/presentacion-de-prescripcion.ts`). Una sola presentación para la web y la APK, que reemplaza las dos que había.
  - Todas las series: iguales («3 × 10»), distintas («Serie 1: 10 · Serie 2: 8 · Serie 3: 6»), rangos («8-12») y sin fijar («sin repeticiones fijadas»).
  - La nota de cada serie, la intensidad con su criterio y la referencia del profesional, la carga sugerida, los parámetros con su unidad y la nota.
  - La referencia de lo planificado para una serie («planificadas 8 repeticiones»), que **nunca** se carga como realizado.
- **Editor web.**
  - Nota por serie, de hasta 200 caracteres. El contrato ya la tenía y el editor la conservaba, pero no se podía escribir.
  - «Agregar descanso» precarga **solo** el rótulo «Descanso» y la unidad «s», sin un valor inventado. Si queda vacío, el guardado lo señala. No se ofrece si ya hay un descanso.
  - Una ayuda para escribir el tempo con palabras.
- **Plan (website).** El plan activo muestra lo planificado completo, una línea por dato.
- **Ejecuciones (website).**
  - «Planificado» muestra la prescripción completa de la versión que rigió esa sesión (su instantánea), más las indicaciones.
  - Cada serie registrada dice lo planificado para ella («· planificadas 8»), sin porcentajes ni calificaciones.

**Pruebas.**
- **Unitarias del dominio** (`presentacion-de-prescripcion.test.ts`, 9, dentro de las 291 del dominio):
  - la pirámide 10/8/6 serie por serie, nunca «3 × 10»;
  - series iguales, rangos, series sin fijar y notas por serie;
  - la intensidad con su referencia y la coma decimal;
  - el orden completo de las líneas;
  - la ausencia de criterio (explícita en la web);
  - la referencia de la serie, con concordancia («planificada 1 repetición»), sin fijar y con su nota;
  - que no haya términos prohibidos.
- **Integración contra PostgreSQL** (`test/integration/prescripcion-visible.int-spec.ts`, 4). Edita con la **misma función del editor web** (`estructuraComoEntrada`, que pasó al dominio para eso):
  - editar, guardar, validar, activar y consultar conserva las notas por serie, los parámetros y la nota; «Hoy» trae la pirámide completa y valida contra el esquema estricto de la APK;
  - la sucesora parte de la instantánea con las notas, y reeditarla no las pierde;
  - **lo planificado nunca se carga como realizado:** el borrador de ejecución nace vacío, y una serie guardada sin repeticiones queda sin repeticiones, sin tomar las 6 planificadas;
  - una ejecución registrada con la pirámide sigue mostrando 10/8/6 después de activar una versión con 5 × 5, leída por el profesional y por el asesorado.
- **Regresión:** entrenamiento, PF-02 y contrato, 129/129 con las 3 primeras; con la cuarta, entrenamiento, PF-02 y PF-03 dan 118/118.
- **Revisión acotada**, con dos revisores de solo lectura:
  - no encontró defectos en los datos, el contrato ni la navegación;
  - hubo cinco hallazgos bajos, todos corregidos: una aserción que no podía fallar, un comentario inexacto, la copia de la función del editor en la prueba, la concordancia de «1 repetición» y la nota de la serie pendiente. El quinto, la verificación del artefacto de la publicación, se corrigió en el PR-2. `npm test` (dominio 291, scripts 31, API 47), typecheck, OpenAPI al día, build del website y legajo.

### Recorrido web local (12/12 controles)

Recorrido con la API compilada, PostgreSQL 16, `next dev`, Chrome sin interfaz y datos sintéticos, el 2026-09-28. El asesorado registra la sesión por la API, como lo haría la APK. **No es el ambiente `test` desplegado.**

| Control | Resultado |
|---|---|
| El editor ofrece la nota de cada serie y la ayuda para el tempo (`01`) | ✅ |
| «Agregar descanso» aparece solo en el ejercicio que no tiene descanso, y precarga rótulo y unidad con el valor vacío (`01`) | ✅ |
| Guardar con el descanso vacío no guarda y señala el ejercicio (`02`) | ✅ |
| Después de guardar, el editor conserva la nota de la serie 2; el plan valida sin problemas | ✅ |
| El plan activo muestra la pirámide serie por serie, la nota, la intensidad con su referencia, la carga, los parámetros y las indicaciones, y ya no «3 × 10» (`03`) | ✅ |
| Ejecuciones muestra lo planificado completo y «planificadas N» en cada serie registrada; lo registrado es lo que escribió la persona; sin porcentajes ni calificaciones (`04`) | ✅ |

El único mensaje en la consola del navegador es el `400` esperado del guardado con el descanso vacío.

## Pendiente

- **PR-2 (APK):** su evidencia se agrega en ese PR. La APK no corre en el navegador: sus pantallas se verifican con typecheck, revisión del código y la presentación compartida probada. La comprobación en un teléfono queda para la publicación conjunta con DL-104.
- **Publicación conjunta (APK 0.12.0):** PF-03 y DL-104 en una sola construcción, después de auditar los PR. Todavía no se construye ni se publica.
- Sin cambios: la **prueba de concurrencia real** de las citas (PF-02) sigue pendiente.

Solo datos sintéticos. Sin credenciales.
