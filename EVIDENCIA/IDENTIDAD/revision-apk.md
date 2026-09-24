# Revisión manual de accesibilidad de la APK (RNF-ACC-001)

**Fecha:** 2026-09-24 · **Código revisado:** `apps/mobile` en la rama del tramo de identidad visual · **Método:** lectura de cada componente interactivo contra la lista de RNF-ACC-001 y B10-10 §7 (APK), §8, §12 y §14.

RNF-ACC-001 pide «auditoría automática y revisión manual» de «acceso, vínculo, Hoy, registro y revisión». En el website la parte automática la hace axe-core (`auditoria-accesibilidad.json`). En la APK no hay un auditor automático equivalente para React Native: esta es la revisión manual, y la de contraste sí es automática (`scripts/contraste.test.cjs`, tema de la APK).

## Lo que se revisó

Todas las pantallas de la APK usan las mismas piezas de `src/ui.tsx` y `src/dialogo.tsx`, así que revisar las piezas cubre los recorridos. Se buscaron además todos los `onPress` fuera de esas piezas (`grep`).

| Criterio (RNF-ACC-001 · B10-10) | Dónde se cumple | Resultado |
|---|---|---|
| Controles con nombre accesible y rol | `Boton` declara `accessibilityRole` (`button` o `link`); `Casilla`, `checkbox`; las opciones de los diálogos y de «¿Qué opción comiste?», `radio` | Cumple |
| Estado anunciado, no solo visual | `accessibilityState` con `disabled`, `busy`, `selected` y `checked` en botones, casillas y opciones | Cumple |
| Etiqueta persistente; el placeholder no la reemplaza (B10-10 §8) | `Campo` muestra la etiqueta arriba y la usa como `accessibilityLabel` | Cumple |
| Error asociado al campo, no solo en un resumen ni solo por color | `Campo` suma el error al nombre accesible del propio campo y lo muestra debajo con «⚠» | Cumple |
| Estados no dependientes solo del color (B10-10 §1, §12) | Insignias con texto («Medido», «Vigente», «Sin dato»); opción elegida con borde más grueso y punto; error con texto | Cumple |
| Objetivos táctiles de 48 dp (B10-10 §14) | `boton`, `entrada`, `filaDeCasilla`, `opcion` y `radio` tienen `minHeight: 48` | Cumple, con una excepción aceptada: «Cambiar» el día del plan es un enlace dentro de una oración, que WCAG 2.5.8 exceptúa |
| Anuncios de resultado | `Aviso` usa rol `alert` para errores y `announceForAccessibility` al aparecer | Cumple |
| Sin gestos exclusivos | Todo se hace con toques; «Volver» es un botón además del gesto del sistema | Cumple |
| Contraste del tema oscuro | Pares de la APK en `scripts/contraste.test.cjs`: texto 4,5:1, bordes de control 3:1 | Cumple (prueba automática) |
| Imágenes decorativas fuera del lector | El isotipo de la barra y de la bienvenida se marca `accessible={false}`: la marca ya la dice el texto «BE» | Cumple |

## Lo que queda para el teléfono

La prueba en un Android físico con TalkBack —el orden de lectura real y el tamaño de letra del sistema al máximo (B10-10 §13)— se hace con las capturas finales de la APK, que toma Dirección.
