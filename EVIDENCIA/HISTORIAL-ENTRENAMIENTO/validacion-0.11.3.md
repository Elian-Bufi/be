# «Tu historial» (DL-096) — validación en dispositivo con la APK 0.11.3

**Resultado: aprobada.** Dirección hizo la tanda de pruebas pedida el **2026-09-27** con la **APK 0.11.3** y confirmó que **todos los puntos funcionaron correctamente**. La confirmación llegó por mensaje en la sesión de trabajo, junto con las siete capturas. Se tomaron entre las 21:43:57 y las 21:50:33 (EXIF, −03:00). Las interacciones sin captura pueden haber ocurrido dentro de esa franja o apenas después.

**Puntos pedidos** (LEEME, «Pendiente en dispositivo, con la 0.11.3», y `hallazgos-validacion-telefono.md` §5):
- el teclado sobre «Reps» y «RIR», y «Registrar corrección» alcanzable con el teclado abierto;
- que con el teclado cerrado no quede espacio de más;
- que «Sesiones registradas» cargue después de las 21 h;
- el final del detalle en modo de navegación por gestos;
- Hoy → detalle → volver;
- volver después de guardar una corrección.

Este registro separa tres fuentes de evidencia, porque no valen lo mismo:
1. **Lo que se ve en las capturas** (`capturas-0.11.3/`): hecho observable, con hora EXIF.
2. **Lo que confirmó Dirección** sin captura: interacciones que la foto no puede mostrar, como qué botón se tocó o un recorrido que no se fotografió.
3. **Las pruebas automatizadas** que ya existían: comprueban la lógica, no el dispositivo.

Las siete capturas muestran un teléfono Android con navegación de **tres botones**. Según Dirección, es la cuenta sintética del asesorado de demostración; la `07` muestra como autor «Asesorado · c36743». Solo datos sintéticos.

## 1. Lo observable en las capturas

| Captura | Hora (EXIF, −03:00) | Qué se ve |
|---|---|---|
| `01-bienvenida-version-0.11.3` | 21:43:57 | Al pie: **«app 0.11.3 · test · commit 13280e6»**, la misma versión y el mismo commit que la release `be-apk-0.11.3`. Que el archivo instalado sea el de la release (SHA-256 en `LEEME.md`) no se ve: es palabra de Dirección. |
| `02-historial-carga-21-44` | 21:44:47 | «Tu historial»: **«Sesiones registradas» carga** (Sesión A · 25 de sept de 2026 · Realizada · Corregida), sin el mensaje «No pudimos cargar esta vista», y «Tus planes» (Prof. Demo Entrenamiento · 21 de sept de 2026 · Vigente). **21:44:47 −03:00 son las 00:44:47 UTC del 28/09**: la fecha UTC ya es la del día siguiente, justo la condición en la que la 0.11.1 fallaba con `PERIOD_IN_FUTURE` (hallazgo 4). |
| `03-detalle-volver-a-tu-historial` | 21:45:15 | Detalle de Sesión A: el enlace dice **«Volver a Tu historial»** y la fecha es **25 de sept de 2026, la misma que en la lista**. Se ven la corrección vigente (27 de sept, 4:25 p. m., 60 kg × 10) y el registro original (60 kg × 8). |
| `04-de-vuelta-en-tu-historial` | 21:45:21 | «Tu historial» otra vez, **6 segundos después de la `03`** según el EXIF (el reloj visible marca 21:45 en las dos). «Sesiones registradas» vuelve a cargar después de las 21 h. **La captura no muestra desde dónde ni cómo se llegó** (enlace o Atrás): que sea el regreso desde el detalle lo confirma Dirección. |
| `05-correccion-con-teclado-abierto` | 21:49:32 | Formulario de la serie (Press de banca, Serie 1) con Carga 60 y Reps 10, los valores de la corrección vigente de la `03`. Por eso es «Corregir registro», aunque el título no entra en la captura. **Con el teclado numérico abierto, «Reps» (10) y «RIR (opcional)», vacío, se ven enteros por encima del teclado**; el borde de RIR queda justo en el borde del teclado. La captura **no muestra qué campo tiene el foco** ni si el desplazamiento fue automático. Para comparar: en la 0.11.2, «Reps» quedaba tapado (`capturas-0.11.2/03-teclado-tapa-reps.jpg`, hallazgo 5). |
| `06-correccion-registrada-original-conservado` | 21:50:09 | Aviso **«Corrección registrada. El registro original se conserva.»**, la nueva corrección vigente (27 de sept, **9:50 p. m.**, motivo «Prueba.3», 60 kg × **12** · RIR **8** · esfuerzo 7) y, debajo, el **registro original** (60 kg × 8). Entre la `05` y esta pasan 37 segundos, y Reps y RIR cambiaron (10 → 12; vacío → 8). **La hora de guardado se muestra como 27 de sept, 9:50 p. m.**, igual que el teléfono, y no se corre al 28, aunque en UTC ya es otro día. El enlace sigue diciendo «Volver a Tu historial». |
| `07-final-del-detalle-corregir-registro` | 21:50:33 | Final del detalle, con el teclado cerrado: registro original, «Historial de correcciones» con las tres correcciones (fecha, autor «Asesorado · c36743» y motivo) y **«Corregir registro» entero por encima de la barra de tres botones**. Debajo del botón queda solo el margen base, **sin un hueco del alto del teclado**. |

**Nota sobre la barra del sistema.** En las capturas `02`, `03`, `04` y `06`, la barra translúcida de tres botones queda sobre contenido, porque la vista todavía no llegó al final. Es lo esperable en pantalla completa (edge-to-edge) a mitad del desplazamiento. El hallazgo 3 se evalúa al **final** del contenido, y ese final solo está fotografiado para el detalle (`07`), no para «Tu historial» ni para el formulario de corrección.

## 2. Interacciones confirmadas por Dirección (sin captura)

Dirección confirmó que todos los puntos pedidos funcionaron. Lo que sigue queda registrado como **confirmación de Dirección**, no como hecho observado en una captura:
- **volver a «Tu historial» con el enlace y con el botón Atrás** del sistema. Las capturas `03` → `04` muestran el destino de un regreso, pero no con qué mecanismo;
- **Hoy → detalle → volver a Hoy**;
- **volver a «Tu historial» después de guardar** la corrección: la `06` muestra el enlace correcto, no el destino;
- con el teclado abierto, **tocar Reps y RIR y llegar a «Registrar corrección»**. Las capturas muestran que se editaron los dos campos y se guardó (`05` → `06`), no que el teclado siguiera abierto al tocar el botón;
- el **final del detalle en modo de navegación por gestos**. **Precisión:** ninguna captura muestra ese modo, y en esta validación Dirección llamó «gestos» al Atrás («Por gestos funciona, entiendo que es como el botón de atras»). Queda como confirmación general de Dirección, **sin evidencia observable**. Si se necesita una comprobación explícita, alcanza con una captura del final del detalle con la barra de gestos. No bloquea el cierre, porque el defecto reportado ocurrió con tres botones y está corregido y fotografiado.

## 3. Pruebas automatizadas que ya existían

| Qué comprueban | Dónde | Nivel |
|---|---|---|
| El detalle vuelve a su origen («Tu historial» u «Hoy»); la pantalla de registro vuelve a Hoy; el enlace nombra «Tu historial» | `scripts/historial-navegacion.test.mjs` §1 | Función de producción (`anterior`, `textoDeVolverA`) |
| `fechaCivil` conserva el día en cinco zonas, en límites de mes y año y en un bisiesto | `scripts/historial-navegacion.test.mjs` §2 | Función de producción |
| En el instante de las 21:04, el cálculo viejo (`toISOString`) reproduce la causa. `ultimosDiasEnZona` da 29/6 a 26/9 con el dispositivo en cuatro zonas (Buenos Aires, UTC, Kiritimati, Los Ángeles) y respeta los límites de mes y año | `scripts/historial-navegacion.test.mjs` §3 | La causa, con un cálculo de referencia; la corrección, con la función de producción |
| El `KeyboardAvoidingView` raíz usa `padding` también en Android, con el `ScrollView` adentro | `scripts/historial-navegacion.test.mjs` §4 | Lectura del código fuente, no efecto en pantalla |
| API-TRN-19-LISTA: el titular lista lo propio; otro usuario no; con B2 revocado conserva la lectura y «Hoy» pasa a no disponible; A3 revocado da 403; la corrección no oculta el original; sin plan vigente, un período sin registros devuelve la lista vacía; rechaza un período sin fechas, futuro o mayor a un año | `test/integration/entrenamiento.int-spec.ts` (bloque DL-096) | Integración con PostgreSQL 16 |

Estas pruebas corren en la CI de cada PR. **No sustituyen la validación en el dispositivo**: la complementan. La prueba de integración del período solo confirma que la API rechaza un período futuro; la franja de 21 a 24 h depende de la APK, y la cubren la §3 y la captura `02`.

## 4. Hallazgos cerrados

| Hallazgo (`hallazgos-validacion-telefono.md`) | Corrección | Cierre |
|---|---|---|
| 1 · Volver desde el detalle iba siempre a Hoy | #89 (0.11.1) | **Confirmado por Dirección:** enlace, Atrás, Hoy y regreso después de guardar. La captura `03` muestra el texto del enlace; la `04`, el destino de un regreso. Pruebas §1 |
| 2 · Fecha distinta en lista y detalle | #89 (0.11.1) | Capturas `02` y `03`: 25 de sept en las dos. La `06` muestra la hora de guardado en la zona de la persona después de las 21 h. Pruebas §2 |
| 3 · Barra del sistema sobre el contenido inferior | #89 (0.11.1) | Captura `07`: final del detalle con tres botones, que es la condición en la que se reportó. El modo por gestos queda como confirmación general de Dirección, sin captura (§2) |
| 4 · «Sesiones registradas» no cargaba de 21 a 24 h | #94 (0.11.2) | Capturas `02` (00:44:47 UTC del 28/09) y `04`. Pruebas §3 |
| 5 · El teclado tapaba los campos de abajo | #97 (0.11.3) | Captura `05`: Reps y RIR visibles con el teclado abierto. Captura `07`: con el teclado cerrado, sin espacio de más. Tocar Reps y RIR y llegar a «Registrar corrección» con el teclado abierto: confirmado por Dirección. Prueba §4 |

## 5. Limitaciones conocidas que se conservan

No son defectos de esta entrega; quedan registradas para una revisión funcional posterior (Plan Funcional, PF-07, DEC-09):
- **Ventana automática de 90 días:** «Sesiones registradas» muestra los últimos 90 días civiles, calculados en Buenos Aires. Lo anterior no se ve.
- **Sin selector de período ni paginación:** la persona no puede elegir otro rango.
- **El desplazamiento se reinicia** al volver del detalle: la pantalla se vuelve a montar y la ventana se recalcula.

También siguen registrados, fuera de DL-096:
- el patrón de fecha anterior en nutrición y antropometría (hallazgo 2, «latente»);
- el mensaje ante un valor fuera de rango en formularios (DL-104).

Solo datos sintéticos. Sin credenciales.
