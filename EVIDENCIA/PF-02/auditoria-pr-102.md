# Evidencia · auditoría del PR #102 — las tres correcciones

La auditoría del #102 sobre `e688368` pidió tres correcciones antes de integrar. Este documento reúne la evidencia de cada una. Resumen general: `LEEME.md`. Decisión documentada: DL-102 en `docs/DEUDA_LEGAJO.md`, párrafo «Precondición de versión».

## Qué cambió

| Corrección | API y contrato | Website |
|---|---|---|
| **1. Versión vista y versión citada** | Cada cita puede llevar `expectedVersion`: la versión de la respuesta que el profesional vio. La API la compara en la **misma lectura** que fija la cita, **después** de autorizar (PDP) y de verificar la pertenencia. Si cambió, responde `409 VERSION_CONFLICT` con el issue `FORM_RESPONSE_VERSION_CHANGED` y no registra ni la evaluación ni las citas. El campo es opcional en el contrato, para no romper clientes anteriores; API-TRN-01 declara el 409 en OpenAPI. | Siempre envía `expectedVersion` al citar. Ante el 409 conserva lo escrito, muestra el aviso con «Actualizar el contexto» y bloquea «Registrar evaluación» hasta actualizar. Al actualizar, desmarca y señala las elegidas que cambiaron; las que siguen iguales quedan marcadas. |
| **2. Paginación del contexto** | Sin cambios: se usa el cursor que FRM-04 ya tenía. | Pide de a 20 Solicitudes. Si una página no trae respuestas de entrenamiento y quedan más, dice «hay más solicitudes para revisar», no «no hay respuestas». «Cargar más» agrega la página siguiente y conserva la selección. |
| **3. Máximo de 20 citas** | Sin cambios: el contrato ya admitía hasta 20. | Muestra «Podés citar hasta 20 respuestas. Marcaste N de 20.». Con 20 marcadas, las demás casillas quedan deshabilitadas y aparece el aviso del máximo. Desmarcar libera un lugar. Antes de enviar se valida de nuevo, y ninguna selección se descarta sin avisar. |

**Hallazgo de la revisión acotada, ya corregido.** Al actualizar después de un 409, el website releía la misma cantidad de páginas que antes. Si entre tanto la persona había respondido otras Solicitudes, una elegida podía quedar en una página posterior y darse por «ya no disponible» cuando seguía existiendo. Ahora sigue leyendo hasta encontrar todas las elegidas, o hasta que FRM-04 no tenga más páginas (`cargarPaginasDeCitables`). La cubren una prueba unitaria y la fase «corrimiento» del recorrido.

## Pruebas automáticas

**Integración, contra PostgreSQL 16 y la API real** (`test/integration/contexto-entrenamiento.int-spec.ts`, bloque «6. precondición de versión»):
- **Cargar v1, rectificar a v2 y enviar lo de v1 → 409**, sin evaluación ni citas nuevas en la base. Después, con la versión actualizada, se registra y cita v2. Es el caso secuencial que pidió la auditoría; **no reemplaza** la prueba de concurrencia real, que sigue pendiente.
- Si la rectificación quitó el campo elegido, también es 409, no 422: lo que cambió es la versión.
- Sobre una respuesta ajena o inexistente, la precondición no se evalúa y sigue el 422 neutral idéntico. Un 409 nunca revela que la respuesta existe.
- Con la versión correcta se registra igual que sin precondición (compatibilidad del contrato).

**Contrato** (`test/integration/contrato.int-spec.ts`, TEST-CT): la prueba de PF-02 termina citando la v1 después de la rectificación, que da 409 `VERSION_CONFLICT`, y después la v2, que da 201. TEST-CT observa `409 VERSION_CONFLICT` en API-TRN-01, lo encuentra declarado en el contrato y valida el 201 contra el esquema de éxito.

**Unitarias del website** (`scripts/contexto-citable.test.mjs`, parte de `npm test`; 7 pruebas con una fuente falsa en lugar de la API):
- **Paginación:** una primera página de 20 Solicitudes de NUTRICIÓN no deja citables pero trae cursor. La segunda trae las de entrenamiento y la selección se conserva entre páginas.
- **Versión:** cada citable lleva el `version` de FRM-05 (v1 o v2) y la cita lo envía. La reconciliación desmarca y señala lo que cambió o ya no está. Al actualizar se sigue leyendo hasta encontrar las elegidas.
- **Tope:** se pueden marcar 20; la 21 no se marca y la selección de 20 queda intacta. Desmarcar deja 19 y se puede marcar otra. La validación del envío acepta 20 y rechaza 21.

## Recorrido local del website: los tres casos

**Qué es y qué no es.** Recorrido en la máquina de desarrollo, el 2026-09-28, con el código de este commit. Se usó:
- la API compilada contra una base PostgreSQL 16 nueva, con todas las migraciones;
- el website en `next dev`;
- Chrome sin interfaz manejado con `puppeteer-core`;
- datos sintéticos sembrados por la API: un profesional verificado como demo en NUTRICIÓN y ENTRENAMIENTO, y un asesorado con A3, los dos vínculos y B2. El asesorado respondió primero 4 Solicitudes de entrenamiento (24 respuestas citables) y después 20 de nutrición. Así la primera página de FRM-04, que trae las más nuevas, es toda de otro alcance.

Para ese profesional sintético la API local corrió con `RATE_LIMIT_LOGIN_MAX=50`, porque el recorrido inicia sesión varias veces seguidas. El límite de inicio de sesión no es objeto de esta prueba, y el código y los ambientes desplegados no cambian.

**No es el ambiente `test` de Render** y no reemplaza la prueba completa web → respuesta desde la APK → evaluación en el ambiente desplegado.

### Caso 2 · Paginación (fase `paginacion-y-tope`, 10/10 controles, sin errores de consola)

| Control | Resultado |
|---|---|
| La primera página no deja citables: no dice «no hay respuestas», dice «hay más solicitudes para revisar» y ofrece «Cargar más» (`01`) | ✅ |
| «Cargar más» trae las 24 respuestas de entrenamiento y ya no se ofrece más (`02`) | ✅ |

### Caso 3 · Máximo de 20 citas (la misma fase)

| Control | Resultado |
|---|---|
| Con 20 marcadas: «Marcaste 20 de 20», las 4 restantes deshabilitadas y el aviso del máximo (`03`) | ✅ |
| Intentar marcar la 21 no la marca y no descarta ninguna de las 20 (`03`) | ✅ |
| Desmarcar una deja 19 y habilita las demás; después se marca otra y vuelven a ser 20, con la nueva incluida (`04`) | ✅ |

### Caso 1 · Versión vista y versión citada (fase `conflicto`, 10/10)

| Control | Resultado |
|---|---|
| El profesional escribe un dato, marca «3 días por semana» (v1) y otra respuesta (`05`) | ✅ |
| La persona rectifica esa respuesta a v2 («4 días») por la API, fuera de la pantalla | ✅ |
| Al registrar: 409, aviso de conflicto, «La evaluación no se registró», lo escrito se conserva y «Registrar evaluación» queda deshabilitado (`06`) | ✅ |
| «Actualizar el contexto»: la respuesta muestra v2, queda desmarcada y señalada con «Cambió desde que la elegiste»; la otra sigue marcada y lo escrito sigue ahí (`07`) | ✅ |
| Vuelta a marcar y registrada: «Contexto citado» muestra «4 días por semana» (`08`) | ✅ |

### Caso 1 bis · Conflicto con corrimiento de página (fase `corrimiento`, 6/6)

Mientras el profesional elige, la persona responde 20 Solicitudes nuevas de nutrición, lo que corre las de entrenamiento a la tercera página, y rectifica una elegida.

| Control | Resultado |
|---|---|
| Aparecen las 20 Solicitudes nuevas y la rectificación a v2 | ✅ |
| Al registrar: 409 sin registrar | ✅ |
| Al actualizar se leen las páginas necesarias y están las 24 respuestas. La cambiada aparece en v2, desmarcada y señalada, no como «ya no disponible». La que no cambió sigue marcada aunque se corrió de página (`09`) | ✅ |
| Se registra citando v2 y la que no cambió (`10`) | ✅ |

Los únicos mensajes en la consola del navegador son los dos `409 (Conflict)` esperados, que Chrome registra solo.

### Comprobación en la base

Para el asesorado del recorrido, el log de la API muestra `POST …/training/evaluations` con **409, 201, 409, 201**. En la base hay exactamente **2 evaluaciones**, cada una con 2 citas. En las dos, la cita de «días por semana» apunta a la rectificación (v2). Los 409 no escribieron nada.

## Sigue pendiente, sin cambios

- La **prueba de concurrencia real** de las citas (#101): dos transacciones simultáneas. El caso secuencial de arriba no la reemplaza.
- La prueba completa **web → respuesta desde la APK → evaluación** en el ambiente desplegado, una vez integrado el #102.
- **DL-104** (mensaje ante un valor fuera de rango).

Solo datos sintéticos. Sin credenciales.
