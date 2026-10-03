# Candidata 0.13.2 · Decisiones que quedan para Dirección

> **Fecha:** 2026-10-03 · **De:** el ejecutor técnico.
> **Qué es:** las decisiones que la tanda encontró fuera de lo autorizado. La tanda no las tomó: dejó registradas las
> opciones y una recomendación, y siguió. La integración de la candidata (#140) y la APK 0.13.2 esperan la aprobación de
> Dirección.
>
> **Actualización, tanda de cierre (2026-10-03).** Dirección decidió E-1 y autorizó E-4: las dos quedaron implementadas,
> sin integrar. E-3 sigue a ratificar. El resto sigue como está.

| # | Tema | Opciones | Recomendación | Evidencia |
|---|---|---|---|---|
| **E-1** | **El token en el teléfono** (DL-012) | A. Dejarlo como está.<br>B. Guardarlo en el almacenamiento seguro hasta que venza, con el mismo vencimiento, y borrarlo al cerrar la sesión | **Decidida por Dirección el 2026-10-03: B**, sin la contraseña y sin renovación. Implementada en #136: se verifica con la API al abrir. Falta el teléfono | `docs/DEUDA_LEGAJO.md` (DL-012) · `EVIDENCIA/NAVEGACION-Y-SESION` |
| **E-2** | **El límite que queda del 503 (P2028).** Con una persona no hay errores. Con tres páginas a la vez, un tercio de los pedidos recibe 503 | 1. Agrupar las lecturas con `include`: la función en preview `relationJoins` o SQL propio.<br>2. Una cola de transacciones en la API.<br>3. Dimensionar el pool y la espera con los núcleos y la latencia reales de Render | **Primero 3**, que no cambia código. **Después 1**, si Render muestra el mismo patrón: SQL propio en las dos lecturas más pesadas (el detalle de una toma y los cálculos), sin activar una función en preview | `EVIDENCIA/P2028/LEEME.md`, «Segunda tanda» |
| **E-3** | **Las excepciones de la auditoría** (DL-114): node-forge y braces, sin versión corregida, hasta el 2026-10-31 | A. Ratificarlas hasta esa fecha, con una revisión antes del vencimiento.<br>B. No ratificarlas: la auditoría vuelve a fallar en la CI | **A.** Las dos entran solo por la cadena de construcción de la APK y no viajan en ella. Revisadas de nuevo en la tanda de cierre: siguen sin versión corregida. Una CI verde hoy las incluye | `scripts/auditoria-de-dependencias.cjs` · DL-114 · #137 |
| **E-4** | **Los objetivos táctiles de la figura de la APK.** Las filas de las tarjetas miden 44 dp con la letra normal, y las áreas de los sitios, 44 dp. La regla de la APK es 48 | A. Dejar 44 dp como desvío declarado.<br>B. Subir a 48 dp. Recompone las tarjetas: con la letra normal entran menos y la figura pasa a números antes | **Autorizada en la tanda de cierre e implementada en #138.** Las filas miden 48 dp y el modo no cambia. Cada sitio responde hasta 24 dp de su dibujo, salvo los que coinciden de frente, que se eligen por su fila | `docs/ux/GUIA-UX-UI.md` §5, §7 y §12 · `EVIDENCIA/PULIDO-0.13.2/apk-maquetas` (12 y 13) |
| **E-5** | **Períodos de más de 90 días en la evolución de la APK** («6 meses», «1 año») | A. Seguir con 30, 60 y 90 días, lo que la API sirve hoy.<br>B. Ampliar el contrato de API-ANT-06 y medir su costo | **A** para la entrega del 10/10 | Guía de UX §7 |
| **E-6** | **Comparar otras tomas** en la APK. Hoy compara la última con la anterior comparable | A. Seguir así.<br>B. Un selector de tomas, que exige que la API sirva un par cualquiera o el historial entero | **A** para la entrega. Cuando una medida no tiene con qué compararse, la pantalla ya dice por qué | Guía de UX §7 |
| **E-7** | **El sistema visual nuevo en el website.** La APK tiene superficies en escalones y el cian para orientar. El website sigue con sus tokens; la actualización a estas paletas ya estaba decidida y pendiente | A. Una tanda propia después de la 0.13.2.<br>B. Ahora | **A.** El website no tiene regresiones: se verificó en 360, 390 y 1440 px, con letra normal y grande | `EVIDENCIA/PULIDO-0.13.2/web` |
| **E-8** | **La lámina con letra grande en el teléfono.** La imagen empieza a 974 px y no entra en la primera pantalla (con la letra normal empieza a 578-605 px) | A. Aceptarlo.<br>B. Compactar los controles con letra grande | **A** hasta mirarlo en el teléfono | `EVIDENCIA/PULIDO-0.13.2/web/LEEME.md` |

**Decidido, no pendiente:** TalkBack no se realizó, por decisión de Dirección. La letra grande es obligatoria en la
prueba del teléfono.
