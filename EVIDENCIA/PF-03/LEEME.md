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
- **Regresión:** entrenamiento, PF-02 y contrato, 129/129 con las 3 primeras; con la cuarta, entrenamiento, PF-02 y PF-03 dan 118/118. `npm test` (dominio 291, scripts 31, API 47), typecheck, OpenAPI al día, build del website y legajo.
- **Revisión acotada**, con dos revisores de solo lectura. No encontró defectos en los datos, el contrato ni la navegación. Marcó cinco hallazgos de severidad baja, todos corregidos:
  1. una aserción que no podía fallar;
  2. un comentario inexacto, y una copia a mano de la función del editor en la prueba;
  3. la concordancia de «1 repetición»;
  4. la nota de la serie pendiente, que no se mostraba;
  5. la verificación del artefacto de la publicación, más angosta que la del procedimiento (corregida en el PR-2).

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

## PR-2 · APK

**Qué cambia** (`apps/mobile/src/pantallas/entrenamiento.tsx` e `historial.tsx`):
- **«Hoy», la sesión y «Tu historial»** usan la presentación compartida, con una línea por dato. Antes mostraban «3 × 10» para una pirámide y no mostraban parámetros ni notas.
- **Sesión:**
  - arriba, «Indicaciones de la sesión», que antes solo aparecían en la tarjeta de «Hoy»;
  - cada serie pendiente dice «Pendiente · planificadas N repeticiones», y el campo de repeticiones **sigue vacío**, así que lo realizado lo escribe la persona;
  - el motivo tiene la ayuda «Si cambiaste algo de lo planificado o no pudiste entrenar, podés contar por qué.».
- **No cambia:** la navegación (DL-096), el borrador, la confirmación, la corrección ni los contratos.

**Cómo se comprobó.**
- **Typecheck de la APK y revisión del código.**
- **Textos de pantalla:** salen de la presentación compartida, probada por unitarias. Las respuestas de la API que la alimentan («Hoy» y la ejecución) se probaron en integración contra el esquema estricto de la APK.
- **Control de términos prohibidos** de las pantallas de entrenamiento (`scripts/copy-pantallas.test.cjs`).
- **No se probó en un teléfono ni en un emulador.** La APK no corre en el navegador, y en esta tanda no se construye.

## Pendiente

- **Comprobación nativa de PR-2:** en la publicación conjunta con DL-104 ([`EVIDENCIA/PUBLICACION-0.12.0/LEEME.md`](../PUBLICACION-0.12.0/LEEME.md), pasos A a D).
- **Publicación conjunta (APK 0.12.0):** PF-03 y DL-104 en una sola construcción, después de auditar los PR. Todavía no se construye ni se publica.
- Sin cambios: la **prueba de concurrencia real** de las citas (PF-02) sigue pendiente.

Solo datos sintéticos. Sin credenciales.
