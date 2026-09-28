# Evidencia · PF-02 — contexto de entrenamiento conectado con la evaluación

Ficha y decisiones: `docs/propuestas/PF-01-02_contexto-de-entrenamiento.md` (DL-100 a DL-103).

| PR | Qué entrega | Estado |
|---|---|---|
| #100 (1/3) | Plantilla «Antecedentes para entrenamiento» (DL-100) y límites NUMBER validados en el servidor (DL-101) | **Integrado** (`ea3e1ec`). La limitación de interfaz es DL-104: su opción A se integró con el #104 (`db9fcda`) y queda EN CURSO hasta comprobarla en una APK nueva |
| #101 (2/3) | Citas de respuestas en la evaluación, verificadas en el servidor (DL-102) | **Integrado** (`ff2001e`). Evidencia por dimensión: `auditoria-pr-101.md` |
| #102 (3/3) | Website: «Solicitar contexto» desde la evaluación, con retorno; citar respuestas y ver lo citado | **Integrado** (`c76f8dd`, 2026-09-28), auditado en `c775ef7`. Evidencia: `auditoria-pr-102.md` |

**Estado de PF-02 (2026-09-28): implementado e integrado, y desplegado en el ambiente `test`** (ver «Despliegue»). **No está validado de punta a punta:** falta el recorrido web → respuesta desde la APK → evaluación en el ambiente desplegado, que hace Dirección con los pasos de abajo.

## Correcciones de la auditoría del #102

La auditoría sobre `e688368` pidió tres correcciones. El detalle, las pruebas y las capturas (`auditoria-pr-102/`) están en `auditoria-pr-102.md`:
1. **Versión vista y versión citada.** El website envía la versión que mostró (`expectedVersion`). Si la persona rectificó en el medio, la API responde 409 sin registrar nada; el website conserva lo escrito y pide actualizar y revisar la selección.
2. **Paginación del contexto**, con el cursor de FRM-04 y «Cargar más». Una página sin respuestas de entrenamiento ya no se toma como vacío definitivo.
3. **Máximo de 20 citas**, visible en pantalla, sin descartar selecciones y validado también antes de enviar.

También se probaron en el navegador los **errores recuperables**: carga cortada, «Cargar más» cortado y envío con la respuesta perdida. En este último caso el reintento con la misma clave no duplica la evaluación.

## Adaptación del #102 al #101 integrado

Con el #101, la API devuelve en cada cita la unidad **que declaró la persona** o, si falta, la del campo de la plantilla. La lista de respuestas citables del formulario de evaluación usaba siempre la de la plantilla. Ahora aplica la misma regla (commit `c5435e2`), así lo que el profesional marca coincide con lo que después muestra «Contexto citado».

## Recorrido local del website (previo a la integración)

**Qué es y qué no es.** Es un recorrido en la máquina de desarrollo, el 2026-09-28, con el código del #102 sobre `main`, que incluye el #101 integrado. Se hizo primero sobre `c5435e2` y **se repitió sobre el código final**, con las correcciones de la auditoría: los mismos 10 controles, en verde y sin errores de consola. Las capturas son las de esta última repetición. Se usó:
- la API compilada contra PostgreSQL 16 local, con todas las migraciones aplicadas;
- el website en `next dev`;
- Chrome sin interfaz manejado con `puppeteer-core`;
- datos sintéticos sembrados por la API: un profesional de ENTRENAMIENTO verificado como demo y un asesorado con A3, vínculo y B2. El asesorado responde por la API, como lo haría la APK, **declarando la unidad «minutos»**.

**No es el ambiente `test` de Render** y no reemplaza la prueba completa web → respuesta desde la APK → evaluación en el ambiente desplegado, que sigue pendiente.

| Control | Resultado |
|---|---|
| El resumen de Entrenamiento ofrece «Solicitar contexto» junto a «Nueva evaluación» (`01`) | ✅ |
| El pedido llega precargado: «Antecedentes para entrenamiento», los seis campos, cinco requeridos (preferencias opcional), propósito «Planificar tu entrenamiento» y alcance Entrenamiento (`02`) | ✅ |
| Aviso «Viniste desde Entrenamiento», con enlace de vuelta (`02`) | ✅ |
| Al enviar, vuelve a Entrenamiento (CA-FOR-06, `03`) | ✅ |
| Respondida la Solicitud, el formulario de evaluación ofrece las cinco respuestas para citar (`04`) | ✅ |
| Cada citable dice «Declarado por la persona», con fecha y unidad: «45 **minutos**» (la declarada) y «3 días por semana» (la de la plantilla) (`04`) | ✅ |
| La evaluación registrada muestra «Contexto citado», con lo citado (`05`) | ✅ |
| Lo citado no aparece como dato de la valoración (CA-FOR-04, `05`) | ✅ |
| Errores en la consola del navegador | ninguno |

Son 10 controles, todos en verde. Las capturas están en `recorrido-local/`.

## Despliegue

Con el #102 y el #104 integrados, el ambiente `test` quedó desplegado desde `main`:
- **CI de `main`:** verde en `c76f8dd` (#102) y en `db9fcda` (#104).
- **API:** `https://be-api-hndp.onrender.com/health/ready` respondió el 2026-09-28 con `commit: db9fcda186d90e0b32e991b987edce5288153c6e`, base de datos OK y migraciones OK.
- **Website:** `https://be-web-1ngj.onrender.com` responde 200. El paquete que sirve la página de Entrenamiento contiene los textos del #102 (por ejemplo, «Actualizar el contexto»).
- Lo que esto demuestra: el código integrado está desplegado. **No** demuestra el recorrido con la APK, que queda para la comprobación de abajo.

## Comprobación pendiente de Dirección: website → respuesta desde la APK → evaluación

**Qué se necesita.**
- El website de `test` (`https://be-web-1ngj.onrender.com`) con la cuenta demo de Entrenamiento (DEMO-PT).
- La APK 0.11.3 instalada, con la cuenta demo del asesorado (DEMO-A01), que tiene vínculo y autorizaciones vigentes con DEMO-PT.
- La API se duerme a los 15 minutos: la primera pantalla puede tardar unos 25 segundos.
- Hay que iniciar sesión **una sola vez** por cuenta: el límite es de 5 intentos cada 15 minutos.

**Pasos.**
1. **Website (DEMO-PT) · pedir.** Entrar al asesorado «Asesorado · c36743» → Entrenamiento → **«Solicitar contexto»**. Debe abrir «Pedir información» con «Antecedentes para entrenamiento», los seis campos, cinco requeridos, el propósito y el alcance ya elegidos, y el aviso «Viniste desde Entrenamiento…». Enviar: vuelve a Entrenamiento. *Captura 1: el pedido precargado.*
2. **APK (DEMO-A01) · responder.** Pestaña **«Información»** → la solicitud nueva → completar con valores **dentro del rango**, por ejemplo 3 días y 45 minutos → «Enviar respuesta». Debe decir «Respuesta enviada.». *Captura 2.*
   - Con la APK 0.11.3, un valor fuera de rango (por ejemplo, 9 días) todavía muestra «El servicio no está disponible…». Es DL-104: la mejora llega con la APK nueva y **no** se valida en este recorrido.
3. **Website · citar.** Entrenamiento → **«Nueva evaluación»** → «Contexto declarado por la persona». Deben aparecer las respuestas con «Declarado por la persona» y su fecha, y el contador «Marcaste N de 20». Marcar «Cuántos días por semana…» y «Qué te gustaría poder hacer…», escribir un dato de la evaluación y registrar. En la lista, la evaluación muestra **«Contexto citado»** con los dos valores. *Captura 3.*
4. **APK · corregir.** En la misma solicitud, «Corregir mi respuesta» → 4 días, con un motivo → enviar. Debe decir «Corrección enviada.». *Captura 4.*
5. **Website · lo citado no cambia.** Recargar Entrenamiento. La evaluación sigue mostrando «3 días por semana», con el aviso «La persona actualizó esta respuesta después de la evaluación; acá se muestra lo que se citó.». *Captura 5.*
6. **Opcional · conflicto.** Abrir otra «Nueva evaluación», marcar «días por semana», corregir la respuesta en la APK (5 días) y, sin recargar el website, registrar. Debe aparecer «Una respuesta que marcaste cambió…», no se registra nada y lo escrito se conserva. Con «Actualizar el contexto», la respuesta vuelve desmarcada y señalada. *Captura 6.*

**Qué informar.** La hora de cada paso, las capturas y cualquier diferencia con lo esperado. Con los pasos 1 a 5 en verde, PF-02 se puede declarar validado en el ambiente desplegado.

## Pendiente

- La prueba completa **web → respuesta desde la APK → evaluación** en el ambiente desplegado: los pasos de arriba.
- La **prueba de concurrencia real** de las citas (#101). El caso secuencial de la auditoría del #102 (v1 → v2 → 409) no la reemplaza.
- **DL-104** (mensaje ante un valor fuera de rango): opción A integrada con el #104; falta comprobarla en una APK nueva, que sale en una sola publicación junto con PF-03 (DL-105).

Solo datos sintéticos. Sin credenciales.
