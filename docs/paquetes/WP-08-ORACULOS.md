# WP-08 — los tres oráculos de la importación controlada que el 11A dejó sin escribir

> **Qué es esto.** El 11A trae `TEST-RF-028`, `TEST-RF-038` y `TEST-UC-I07` como filas de su matriz (11A:206, 217, 354), con el criterio de aceptación del 04 como única frase y sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:150-169). Es el mismo hueco estructural de DL-065, DL-075 y DL-094.
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`.
>
> **De dónde sale cada oráculo.** De la norma que cita, con referencia `archivo:línea`. Un oráculo derivado dice qué hay que observar; no inventa la regla.
>
> **Sin red.** Los tres se ejecutan contra un proveedor falso HTTP local, levantado por la propia prueba (D-H de `WP-08.md`). La prueba contra los proveedores reales se hace una vez, a mano, desde `test`, y queda en la evidencia.

---

## TEST-RF-028 — Importar un alimento de Open Food Facts, controlado

```text
TEST_ID              TEST-RF-028
TITLE                Open Food Facts: importación controlada con procedencia y fallback
LEVEL                Integración (API + PostgreSQL real + proveedor falso HTTP)
PRIORITY             P0 — compromiso académico de integración
SOURCES              04 RF-028 (04:378-385: «identifica proveedor y fecha; datos insuficientes se corrigen o
                     rechazan; una caída del proveedor permite continuar con catálogo propio y carga manual»)
                     09v12 §5 (API-INT-NUT-02/03) · 09v12 §2 (garantías de toda importación) · B10-05 §19-§20
PRECONDITIONS        Profesional con Nutrición verificada y habilitada. Proveedor falso con tres productos:
                     uno completo, uno sin composición y uno que no existe.
SYNTHETIC_FIXTURE    Códigos de barras de prueba (no reales); nombres y composiciones inventados.
STEPS                1. Crear un candidato con el producto completo (API-INT-NUT-02).
                     2. Resolverlo IMPORT corrigiendo un dato (API-INT-NUT-03).
                     3. Listar el catálogo (API-NUT-13) y ubicar el elemento.
                     4. Crear un candidato con el producto sin composición y resolverlo IMPORT tal cual.
                     5. Pedir un código que el proveedor no tiene.
                     6. Con el proveedor caído, crear un candidato; después, crear un alimento manual
                        (API-INT-NUT-01).
EXPECTED             1 → **201**: el candidato trae proveedor, identificador, `receivedAt`, `expiresAt`, contenido
                     normalizado y procedencia con el SHA-256 de lo recibido y la licencia. 2 → **200** con el
                     elemento creado y `correctedFields` con el dato corregido. 3 → el elemento figura con
                     `provenance: "CONTROLLED_IMPORT"` y `externalSource` con proveedor, identificador y fecha.
                     4 → **422 REVIEWED_CONTENT_INVALID** con la ruta de cada dato faltante. 5 → **422
                     IMPORT_SOURCE_NOT_FOUND**. 6 → **503 DEPENDENCY_UNAVAILABLE** con `fallback` y, acto
                     seguido, la carga manual responde **201**.
NEGATIVE_ASSERTIONS  El paso 1 **no** crea ningún elemento de catálogo: sin resolver, el catálogo no cambia. Un dato
                     que el proveedor no trajo viaja `null`, nunca `0`. El 503 no inventa datos ni crea un
                     candidato. El candidato conserva lo recibido: la corrección del paso 2 no lo reescribe.
AUTOMATION           test/integration/integraciones.int-spec.ts («TEST-RF-028 · …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); local contra PostgreSQL 16 embebido
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-08/resultados-integracion-*.md; una importación real contra
                     Open Food Facts desde `test`, con su procedencia visible
```

**Por qué el paso 4 es 422 y no 400.** La forma del contenido revisado admite `null`: es la misma del candidato. Lo que falta se valida como regla del dominio, y la respuesta dice **qué** completar. Un `400` de forma diría solo que el cuerpo no encaja, y el profesional no sabría qué dato le falta.

---

## TEST-RF-038 — Importar un ejercicio de wger, controlado

```text
TEST_ID              TEST-RF-038
TITLE                wger: importación controlada, sin aceptar la relación muscular como canónica
LEVEL                Integración (API + PostgreSQL real + proveedor falso HTTP)
PRIORITY             P0 — compromiso académico de integración
SOURCES              04 RF-038 (04:479-486) · 09v12 §7 (API-INT-TRN-02/03; 09v12:397-401: «una relación
                     músculo/zona recibida de wger no se acepta automáticamente como relación canónica BE»)
                     B10-06 §22 · REG-06-139 (la relación ejercicio-zona es 0..N)
PRECONDITIONS        Profesional con Entrenamiento verificado y habilitado. Proveedor falso con un ejercicio que
                     trae traducción al español, músculos principales y secundarios, y licencia.
SYNTHETIC_FIXTURE    Ejercicio de prueba con número inventado; nombres y músculos de ejemplo.
STEPS                1. Crear un candidato (API-INT-TRN-02).
                     2. Resolverlo IMPORT sin cambiar el nombre (API-INT-TRN-03).
                     3. Listar el catálogo de ejercicios (API-TRN-13) y ubicar el ejercicio.
                     4. Crear otro candidato y resolverlo REJECT.
                     5. Intentar resolver de nuevo el del paso 4.
EXPECTED             1 → **201**: el nombre en español, los músculos declarados **como dato del proveedor** y la
                     licencia con su autoría. 2 → **200** con el ejercicio creado y `correctedFields` vacío.
                     3 → el ejercicio figura con `provenance: "CONTROLLED_IMPORT"`, `externalSource`, y
                     **`muscleZones: []`**. 4 → **200** con `exercise: null`. 5 → **422
                     IMPORT_CANDIDATE_NOT_RESOLVABLE**.
NEGATIVE_ASSERTIONS  Ninguna zona BE sale de los músculos de wger. El rechazo no crea ningún ejercicio. Un
                     candidato resuelto no vuelve a aparecer como resoluble.
AUTOMATION           test/integration/integraciones.int-spec.ts («TEST-RF-038 · …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); local contra PostgreSQL 16 embebido
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-08/resultados-integracion-*.md; una importación real contra
                     wger desde `test`
```

---

## TEST-UC-I07 — Importar un elemento externo con revisión controlada

```text
TEST_ID              TEST-UC-I07
TITLE                UC-I07: no hay importación ciega, la fuente no se pierde y el candidato es de quien lo creó
LEVEL                Integración (API + PostgreSQL real) y base de datos
PRIORITY             P0
SOURCES              05 §14.5 (UC-I07: precondiciones, flujo, garantías mínimas y criterio de cierre)
                     09v12 §3 («solo puede resolverse por actor autorizado») · 09v12:83-84 (la recuperación del
                     proveedor no pisa datos manuales; ningún I/O externo dentro de una transacción)
PRECONDITIONS        Dos profesionales de Nutrición verificados y habilitados, A y B.
SYNTHETIC_FIXTURE    Un producto completo en el proveedor falso.
STEPS                1. A crea un candidato.
                     2. B intenta resolverlo.
                     3. A lo resuelve IMPORT; después reintenta la misma operación con la misma Idempotency-Key.
                     4. En la base: intentar modificar el candidato, borrar la resolución, o insertar una segunda
                        resolución para el mismo candidato.
                     5. Un candidato vencido: intentar resolverlo.
EXPECTED             2 → **404**, idéntico al de un candidato inexistente. 3 → **200** y el reintento devuelve la
                     misma respuesta **sin crear un segundo elemento**. 4 → la base **rechaza** las tres
                     operaciones. 5 → **422 IMPORT_CANDIDATE_NOT_RESOLVABLE**.
NEGATIVE_ASSERTIONS  B no ve ni resuelve el candidato de A. El 404 no revela que el candidato existe. La
                     resolución no puede quedar sin autor, ni con un autor distinto del profesional del
                     candidato, aunque el servicio se equivocara.
AUTOMATION           test/integration/integraciones.int-spec.ts («TEST-UC-I07 · …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); local contra PostgreSQL 16 embebido
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-08/resultados-integracion-*.md
```

**Por qué la base y no solo el servicio.** «La key no sustituye: unique constraint; transacción» (09v7). Las garantías de un solo resultado por candidato y de autoría las sostiene la base con un índice único y un trigger, igual que en los demás dominios: si mañana alguien escribe otro servicio que resuelve candidatos, la base sigue diciendo que no.
