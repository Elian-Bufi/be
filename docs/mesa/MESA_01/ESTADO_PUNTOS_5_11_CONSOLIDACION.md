# MESA-01 — estado de DV-11 y de DV-05 tras el tramo de consolidación

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección.

**Fecha:** 2026-09-24 · **Tramo:** consolidación (`docs/paquetes/WP-CONSOLIDACION.md`) · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Por qué hubo un tramo sin número de paquete

A nueve días de la entrega, Dirección eligió cerrar lo que ya existía en vez de abrir paquetes nuevos: que las tres verticales se comportaran igual y que el dashboard dejara de estar vacío. El tramo no agrega RF ni operaciones: cierra DL-089, DL-091 y la condición de cierre de DL-031.

## Punto 11 — Demo de APK y Website

| Elemento | Qué cambia para la demo | Dónde |
|---|---|---|
| Dashboard del profesional | Antes mostraba solo enlaces. Ahora cada dominio autorizado trae un **resumen factual**: plan vigente, objetivo con quién lo escribió, última y próxima revisión, cuántos registros hubo en el período. Sin puntaje ni semáforo | `/pro/advisees?id=…` |
| Historia del asesorado | Si el asesorado revoca el acceso de su profesional de entrenamiento, **la API le sigue devolviendo sus sesiones registradas y su plan**; al profesional, no. **La APK todavía no tiene una pantalla de historial de entrenamiento**, así que en la demo se muestra por las pruebas, no en el teléfono (DL-096) | API |
| Coherencia entre pestañas | Nutrición y antropometría se comportan como entrenamiento: período elegible, error en el campo, retiro del contenido ante un 404, números con coma | Website y APK |

### Un momento de demo que suma

**La vista parcial que no delata.** Con un profesional que tiene dos alcances con el mismo asesorado: mostrar el Resumen con las dos tarjetas, revocar uno desde la APK, y actualizar. La tarjeta de ese dominio desaparece, aparece un único aviso «Vista parcial según tu acceso actual», y en el resumen del otro dominio no queda ni un conteo del negado. Es el PDP decidiendo en cada lectura, en treinta segundos.

## Punto 5 — DV-05

Sin cambios en el modelo de autorización. El tramo agrega pruebas de integración que un tribunal puede leer como casos de prueba: la revocación de B2 contra la historia propia (4 casos, `entrenamiento.int-spec.ts`), el dashboard que no filtra lo negado (7 casos, `dashboard.int-spec.ts`) y el período máximo de la evolución antropométrica (`antropometria.int-spec.ts`).

## Lo que esta nota no dice

No dice que el sistema esté completo. La cartera, el timeline y la cola de revisiones siguen fuera de la entrega, y el **compromiso académico de dos APIs externas (Q-API-001) está hoy en cero**: ver DL-086 en `docs/DEUDA_LEGAJO.md`.
