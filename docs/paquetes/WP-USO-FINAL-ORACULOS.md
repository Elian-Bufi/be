# WP-USO-FINAL — los oráculos TEST-UF de las etapas 1 y 2

> **Qué es esto.** El paquete (`WP-USO-FINAL.md` §6) declaró los oráculos TEST-UF-001 a 015 en una línea cada uno. Acá
> van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), como los TEST-AVR de
> `WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`. Este archivo trae los de la **etapa 1**, que Dirección pidió el 2026-11-11 al
> ratificar UF-D1 a UF-D13: UF-12 (DL-114), UF-00 (las APK anteriores en suspenso), UF-01 (el nombre obligatorio) y
> UF-08 (lo que dice el ambiente). UF-12 no tenía oráculo en el §6: se suma TEST-UF-016.
>
> **La etapa 2** (§13 del paquete, declarada el 2026-11-12) suma los oráculos de su primera mitad, al final de este
> archivo: TEST-UF-013 (UF-09), TEST-UF-014 (UF-11), TEST-UF-009 (UF-04) y TEST-UF-011 (UF-06), cada uno escrito antes del
> código de su parte.
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`. Los oráculos de las partes que faltan
> (TEST-UF-007, 008, 010 y 015) se escriben con su tanda.
>
> **De dónde sale cada oráculo.** De DL-169 y del paquete (con referencia a su sección), de las decisiones UF-D1 a UF-D13
> (ratificadas por Dirección el 2026-11-11) y, para UF-12, de DL-114. Un oráculo dice qué hay que observar para aceptar
> la prueba: no inventa la regla, la lee.
>
> **Cómo se escribieron.** Cada oráculo se escribió antes del código de su parte, y su prueba se verificó con una
> mutación: con el código de antes, o con la regla rota a propósito, la prueba se pone en rojo; con el cambio, en verde.
> La mutación de cada uno está en su campo AUTOMATION.

---

## TEST-UF-016 — DL-114 sin excepciones: la auditoría no depende de una prórroga

```text
TEST_ID              TEST-UF-016
TITLE                Desde el 2026-11-11 la auditoría de dependencias no tiene excepciones, aprueba el lockfile del
                     repositorio cualquier día y bloquea si un zod o un node-forge abarcado vuelve a producción
LEVEL                Script de la CI (scripts/auditoria-de-dependencias.cjs) y lockfile
PRIORITY             P0, con fecha: la excepción vencía el 2026-12-01 a las 00:00 UTC (21:00 ART del 30/11)
SOURCES              UF-12 (WP-USO-FINAL.md §4.1) · UF-D13 (§7) · DL-114 · WP-01 §2 · GHSA-86w9-cpqp-85rv ·
                     GHSA-mrhx-c7xc-m3w5
PRECONDITIONS        package-lock.json del repositorio, con node-forge 1.4.3 y la CLI de Expo 57.0.33.
SYNTHETIC_FIXTURE    Salidas de `npm audit --json` con la forma de npm 10: el aviso de zod sobre el zod 3 de la raíz y
                     el de node-forge sobre su copia; un lockfile mínimo con la forma del real.
STEPS                1. Leer la lista de excepciones del script.
                     2. Evaluar la salida con el aviso de zod y la de node-forge en @be/mobile, el 2026-11-11, el
                        2026-11-30 y el 2026-12-01.
                     3. Recorrer todas las copias de zod, de node-forge y de la CLI de Expo del lockfile del
                        repositorio.
                     4. Con npm de verdad (escenarios): auditar sin cambios el 2026-12-01, y con zod 3 o node-forge
                        1.4.0 de vuelta en producción.
EXPECTED             1 → la lista está vacía. 2 → los tres días bloquea (código 1), sin «exceptuado». 3 → toda copia
                     de zod anterior a la 4.6.6 está marcada de desarrollo y nada de producción la usa; ninguna CLI de
                     Expo pide zod; el dominio tiene la 4.6.6; ninguna copia de node-forge está en <=1.4.2. 4 → sin
                     cambios, la APK, la API y el website aprueban (0); las seis rutas vulnerables bloquean (1).
NEGATIVE_ASSERTIONS  Ningún día de los tres aprueba un aviso de zod o node-forge en la APK. La auditoría no aprueba por
                     una fecha: no hay vencimiento que la cambie. La copia vieja de desarrollo no hace fallar la de
                     producción.
AUTOMATION           scripts/auditoria-de-dependencias.test.cjs («TEST-UF-016 · …», dos pruebas) y
                     scripts/auditoria-de-dependencias.escenarios.cjs (nueve escenarios, `npm run audit:escenarios`).
                     Mutaciones: el lockfile de antes (CLI 57.0.25 con zod 3 en producción) → falla la del lockfile;
                     node-forge en 1.4.2 → falla la del lockfile; una excepción de zod de vuelta en EXCEPCIONES →
                     falla la de la lista. Con el código de antes, las dos dieron rojo.
ENVIRONMENT          `npm test` (la prueba) y `npm run audit:prod` en la CI; los escenarios, a mano y con red
EVIDENCE_EXPECTED    La CI verde con «✓ @be/mobile: sin avisos altos ni críticos» sin líneas de «exceptuado»; los nueve
                     escenarios en verde (DL-114, 2026-11-11). Que la APK construida con la CLI nueva funciona se
                     comprueba con la candidata 0.24.0-candidata.1 en el teléfono: esta prueba no lo da por aprobado.
```

---

## TEST-UF-006 — Solo la última APK distribuida está congelada, y su lectura pasa contra la API de hoy

```text
TEST_ID              TEST-UF-006
TITLE                VIGENTES es exactamente la última versión distribuida (la 0.23.0-candidata.2), y la prueba de
                     integración lee todas sus lecturas contra la API de hoy
LEVEL                Dominio (fixtures y contrato) e integración (API real con PostgreSQL)
PRIORITY             P0 (habilita UF-01)
SOURCES              UF-00 (WP-USO-FINAL.md §4.1) · UF-D11 (§7) · DL-169 · DL-152 (y su enmienda del 2026-11-11)
PRECONDITIONS        La carpeta packages/domain/fixtures/lecturas-de-la-apk/ y el tag be-apk-0.23.0-candidata.2
                     (c9ec44f).
SYNTHETIC_FIXTURE    Lo congelado de la .2 con `node scripts/congelar-lo-que-lee-la-apk.mjs be-apk-0.23.0-candidata.2`;
                     las cuentas sintéticas de la prueba de integración.
STEPS                1. Listar las versiones congeladas en la carpeta.
                     2. Comparar cada lectura congelada con el contrato de hoy (verbo, ruta, sesión, clave).
                     3. En la integración, pedir cada operación que llama la .2, como la pide, y leer la respuesta real
                        con su esquema; al final, exigir haberlas leído todas.
EXPECTED             1 → exactamente ['0.23.0-candidata.2'], con su tag, su commit y su versionCode (37). 2 → ninguna
                     diferencia. 3 → todas leídas sin rechazo, salvo las que `SOLO_EL_RECHAZO` declara para esa
                     versión (con UF-01: el alta con correo y la de Google, que la API rechaza sin el nombre).
NEGATIVE_ASSERTIONS  No queda un congelado de una versión que ya no se distribuye (0.13.2, 0.20 a 0.23.0-candidata.1).
                     Un cambio de la API que rompe una lectura de la .2 hace fallar la CI.
AUTOMATION           packages/domain/src/lecturas-de-la-apk.test.ts («TEST-UF-006 · …») y
                     test/integration/lecturas-de-las-apk.int-spec.ts. Mutaciones: con VIGENTES nuevo y los congelados
                     viejos todavía en la carpeta → rojo; dejando solo el de la 0.23.0-candidata.1 de más → rojo.
ENVIRONMENT          `npm test` (dominio) y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde en `verificar` y en `integracion`
```

---

## TEST-UF-001 — El alta con correo sin nombre no crea nada

```text
TEST_ID              TEST-UF-001
TITLE                API-ACC-01 sin profile.displayName responde 422 TERMS_VERSION_NOT_ACCEPTABLE con el issue
                     DISPLAY_NAME_REQUIRED y no crea la identidad ni nada más; vacío o inválido, 422 VALIDATION_FAILED
LEVEL                Integración (API real con PostgreSQL) y dominio (la regla del nombre y el contrato)
PRIORITY             P0
SOURCES              UF-01 (WP-USO-FINAL.md §4.1, puntos 1 y 3) · UF-D1 y UF-D5 (§7) · DL-169 · DL-138 D-10 (el
                     precedente) · 09v8 ACC-01
PRECONDITIONS        Los textos vigentes (A1, A2 y la mayoría de edad) en la base; un correo sintético sin cuenta.
SYNTHETIC_FIXTURE    Correos `@example.invalid`; nombres sintéticos («Persona Sintética»).
STEPS                1. Pedir el alta con los actos vigentes y sin `profile`; con `profile: {}`.
                     2. Pedir el alta con `profile.displayName` en blanco y con 61 caracteres.
                     3. Contar identidades, perfiles, métodos y actos de ese correo, y leer la auditoría del pedido.
EXPECTED             1 → 422 TERMS_VERSION_NOT_ACCEPTABLE, issue DISPLAY_NAME_REQUIRED en `profile.displayName` (el
                     código que la 0.23 traduce a «Actualizá la app para continuar»). 2 → 422 VALIDATION_FAILED con
                     DISPLAY_NAME_REQUIRED o INVALID_DISPLAY_NAME. 3 → ninguna fila nueva; el correo sigue libre.
NEGATIVE_ASSERTIONS  No queda una identidad sin perfil ni un perfil sin nombre. El nombre nunca aparece en la
                     auditoría ni en el registro de la API.
AUTOMATION           test/integration/nombre-obligatorio.int-spec.ts («TEST-UF-001 · …»); dominio:
                     contratos-perfil-propio.test.ts y acceso-google.test.ts. Mutaciones: un vacío que no cuenta como
                     falta → rojo en el dominio; la API que acepta el alta sin nombre → rojo en la integración.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-UF-002 — El alta con Google sin nombre tampoco, y con Google el nombre llega propuesto

```text
TEST_ID              TEST-UF-002
TITLE                API-GOO-03 sin nombre responde lo mismo que API-ACC-01; API-GOO-01 propone el nombre de la cuenta
                     de Google en details.name; la pantalla lo trae en el campo, y se corrige o se confirma
LEVEL                Integración, dominio (el cliente y la regla de los pasos de Google) y clientes
PRIORITY             P0
SOURCES              UF-01 (§4.1, puntos 2 y 3) · UF-D1 y UF-D2 (§7) · DL-169 · DL-138
PRECONDITIONS        La API con un client ID de Google de prueba y el verificador con claves sintéticas (como
                     acceso-google.int-spec.ts).
SYNTHETIC_FIXTURE    ID tokens firmados con una clave sintética, con `name` («Persona de Google»), sin `name` y con un
                     `name` de 80 caracteres.
STEPS                1. API-GOO-01 con una cuenta de Google sin identidad, con y sin `name`.
                     2. API-GOO-03 sin `profile`, y con el nombre propuesto corregido.
                     3. Leer el perfil propio de la cuenta creada.
EXPECTED             1 → 404 GOOGLE_ACCOUNT_NOT_FOUND con `details: { email, name }`; `name` null si falta o no se puede
                     guardar. 2 → sin perfil, 422 TERMS_VERSION_NOT_ACCEPTABLE con DISPLAY_NAME_REQUIRED y nada creado;
                     con el nombre, 201 y la sesión. 3 → el nombre corregido, versión v1.
NEGATIVE_ASSERTIONS  La API no guarda el nombre de Google sin que la persona lo confirme: lo que se guarda es lo que
                     mandó el alta. El nombre no aparece en la auditoría.
AUTOMATION           test/integration/nombre-obligatorio.int-spec.ts («TEST-UF-002 · …»); dominio:
                     pasos-de-acceso-google.test.ts y acceso-google.test.ts. Mutaciones: el paso CREAR sin el nombre y
                     el cliente sin `nombreDeGoogle` → rojo en el dominio.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; en el teléfono, «Crear la cuenta con Google» con el nombre de la cuenta (la candidata)
```

---

## TEST-UF-003 — La cuenta nace con su nombre: perfil propio v1, con auditoría y sin el nombre en ella

```text
TEST_ID              TEST-UF-003
TITLE                El alta con nombre (correo o Google) crea el perfil propio v1 en la misma transacción, con la
                     auditoría del alta, que no guarda el nombre
LEVEL                Integración
PRIORITY             P0
SOURCES              UF-01 (§4.1, punto 1) · DL-169 · DL-009 y DL-040 · REG-06-20 · 09v7 T18
PRECONDITIONS        —
SYNTHETIC_FIXTURE    Correo sintético y «  Persona   Sintética  » (con espacios de más).
STEPS                1. Crear la cuenta con correo y con nombre.
                     2. Leer API-ACC-06-PROPIA con la sesión.
                     3. Leer la versión del perfil y la auditoría del alta en la base.
EXPECTED             1 → 201. 2 → `displayName: 'Persona Sintética'` (normalizado), `version: 'v1'`. 3 → una versión,
                     número 1, con procedencia de API-ACC-01; la auditoría del alta no contiene el nombre.
NEGATIVE_ASSERTIONS  El perfil no queda en v0. El nombre no está en ninguna fila de auditoría.
AUTOMATION           test/integration/nombre-obligatorio.int-spec.ts («TEST-UF-003 · …»). Mutación: el alta que no
                     crea la versión 1 → rojo.
ENVIRONMENT          El job de integración de la CI
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-UF-004 — El nombre se cambia pero no se quita, y la base lo sostiene

```text
TEST_ID              TEST-UF-004
TITLE                API-ACC-06 con displayName null o vacío responde 422 y el nombre anterior sigue; la base rechaza
                     una versión nueva del perfil sin nombre, y conserva las viejas
LEVEL                Integración (API y base)
PRIORITY             P0
SOURCES              UF-01 (§4.1, punto 5) · UF-D3 (§7) · DL-169 · REG-06-20
PRECONDITIONS        Una cuenta con nombre (v1).
SYNTHETIC_FIXTURE    —
STEPS                1. API-ACC-06 con `displayName: null` y con «   ».
                     2. Leer el perfil.
                     3. Insertar en la base, por fuera de la API, una versión nueva con `nombre_visible` NULL.
EXPECTED             1 → 422 INVALID_PROFILE_DATA con el issue DISPLAY_NAME_REQUIRED. 2 → el nombre de antes, v1.
                     3 → la base lo rechaza (disparador `version_de_perfil_propio_con_nombre`).
NEGATIVE_ASSERTIONS  No se crea la versión 2. Las versiones viejas con NULL no se tocan (la historia es de solo agregar).
AUTOMATION           test/integration/nombre-obligatorio.int-spec.ts («TEST-UF-004 · …») y perfil-propio.int-spec.ts.
                     Mutaciones: la API que acepta null → rojo; la migración sin el disparador → rojo.
ENVIRONMENT          El job de integración de la CI
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-UF-005 — «Antes de seguir»: API-ACC-07 lista el nombre que falta y deja de listarlo al guardarlo

```text
TEST_ID              TEST-UF-005
TITLE                Una cuenta sin nombre ve DISPLAY_NAME en API-ACC-07 (con el nombre profesional propuesto, si
                     tiene perfil profesional); al guardarlo, la lista queda vacía; la web y la app no siguen sin él
LEVEL                Integración, dominio y clientes (website y APK)
PRIORITY             P0
SOURCES              UF-01 (§4.1, punto 4) · UF-D4 (§7) · DL-169
PRECONDITIONS        Una cuenta anterior a DL-169, sin versión del perfil (creada en la base como las de `test`), y
                     otra con perfil profesional.
SYNTHETIC_FIXTURE    La cuenta sin nombre se arma insertando la identidad por fuera del alta, como las de antes.
STEPS                1. API-ACC-07 de la cuenta sin nombre, y de la que tiene perfil profesional.
                     2. Guardar el nombre con API-ACC-06 y volver a pedir API-ACC-07.
                     3. En la web y en la app, entrar con la cuenta sin nombre.
EXPECTED             1 → `steps: [{ step: 'DISPLAY_NAME', suggestion: null }]`; con perfil profesional, `suggestion` es
                     su nombre profesional. 2 → `steps: []`. 3 → «Antes de seguir» con «¿Cómo te llamás?»; no se llega
                     a otra pantalla hasta guardar; «Cerrar sesión» siempre está.
NEGATIVE_ASSERTIONS  Una cuenta con nombre no ve el paso. Un paso que el cliente no conoce no se saltea: pide
                     actualizar (APK) o recargar (web).
AUTOMATION           test/integration/nombre-obligatorio.int-spec.ts («TEST-UF-005 · …»); dominio:
                     contratos-perfil-propio.test.ts; website: apps/web/test/nombre-y-ambiente.test.mjs; APK:
                     apps/mobile/src/nombre-obligatorio.test.ts. Mutaciones: la API que no lista el paso; sin
                     `conocePasos`; el website que deja pasar sin respuesta; la APK que abre sin respuesta como
                     «abierta»; el 409 que no se vuelve a leer y el `expectedVersion` fijo → cada una en rojo.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; en el teléfono, con una cuenta sin nombre (la candidata)
```

---

## TEST-UF-012 — En producción no hay avisos de prueba, y en test se pueden apagar

```text
TEST_ID              TEST-UF-012
TITLE                Los avisos de prueba salen del ambiente: en producción no aparecen nunca; en test aparecen salvo
                     con BE_AVISOS_DE_PRUEBA=no; ninguna pantalla los escribe por su cuenta
LEVEL                Dominio (la regla) y estructura del código del website y de la APK
PRIORITY             P0
SOURCES              UF-08 (WP-USO-FINAL.md §4.1) · DL-169 · 08 §33
PRECONDITIONS        `packages/domain/src/ambiente-de-prueba.ts`.
SYNTHETIC_FIXTURE    —
STEPS                1. Evaluar la regla con production, test, development, un ambiente desconocido y el interruptor.
                     2. Recorrer el código del website y de la APK buscando los textos de prueba.
EXPECTED             1 → production, nunca; test y development, sí, salvo con «no»; desconocido, sí. 2 → los textos
                     viven solo en `AVISOS_DE_PRUEBA` del dominio, y cada pantalla que los usa pasa por la regla.
NEGATIVE_ASSERTIONS  Ninguna pantalla escribe «Ambiente de prueba», «correo inventado», «cuenta de Google de prueba» ni
                     «APK de prueba» por su cuenta.
AUTOMATION           packages/domain/src/ambiente-de-prueba.test.ts, scripts/avisos-de-prueba.test.mjs y, del website,
                     apps/web/test/nombre-y-ambiente.test.mjs. Mutaciones: producción que los muestra; un texto escrito
                     en una pantalla; el pie sin la regla; la APK sin el interruptor; next.config con producción por
                     omisión → cada una en rojo.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; las capturas con y sin el interruptor quedan para la candidata
```

---

# La etapa 2 (2026-11-12)

## TEST-UF-013 — En producción el catálogo de demostración no se ofrece ni se acepta; en test, sí

```text
TEST_ID              TEST-UF-013
TITLE                Con APP_ENV production la API no ofrece los ítems BE_SYNTHETIC_SEED en los buscadores ni los
                     acepta en un plan nuevo; en test sí, con su origen; las filas sembradas quedan
LEVEL                Dominio (la regla), unidad de la API (el filtro de cada catálogo) e integración (API real con
                     PostgreSQL, una app con APP_ENV production y otra con test sobre la misma base)
PRIORITY             P0
SOURCES              UF-09 (WP-USO-FINAL.md §4.1) · UF-D10 (§7) · DL-169 · REG-06-135 · 08 §33
PRECONDITIONS        El catálogo que siembran las migraciones de WP-04 y WP-05 (Arroz blanco, Pechuga de pollo,
                     Sentadilla, Press de banca…), con procedencia BE_SYNTHETIC_SEED.
SYNTHETIC_FIXTURE    Un profesional de Nutrición y uno de Entrenamiento sintéticos, cada uno con una persona vinculada y
                     su objetivo, preparados en la app de test.
STEPS                1. Evaluar la regla con production, test, development, un ambiente desconocido y uno que falta.
                     2. Armar el filtro de cada catálogo con la regla de cada ambiente.
                     3. En test: buscar «Arroz blanco» (API-NUT-13 y API-NUT-13-BUSQUEDA) y «Sentadilla»
                        (API-TRN-13-BUSQUEDA).
                     4. En producción: las mismas búsquedas, y cada catálogo entero, sin texto.
                     5. En producción: crear un plan nutricional con el arroz sembrado y uno de entrenamiento con la
                        sentadilla sembrada. En test, los mismos pedidos.
                     6. Contar las filas sembradas antes y después.
EXPECTED             1 → test y development, sí; production, un ambiente desconocido y uno que falta, no. 2 → fuera de
                     test y development, el filtro excluye BE_SYNTHETIC_SEED en los dos catálogos; en test, no excluye
                     nada. 3 → aparecen, con provenance BE_SYNTHETIC_SEED. 4 → ninguna fila con provenance
                     BE_SYNTHETIC_SEED. 5 → en producción, 422 con el issue CATALOG_REFERENCE_INVALID (Nutrición) y 422
                     EXERCISE_REFERENCE_INVALID (Entrenamiento), sin plan creado; en test, 201. 6 → las mismas filas.
NEGATIVE_ASSERTIONS  En producción ningún buscador ofrece un ítem de demostración y ninguna validación de algo nuevo
                     (plan, plantilla, receta, habitual o registro) lo acepta. En test no cambia nada. Lo decide el
                     APP_ENV de la API, nunca el cliente. No se borra ni se marca ninguna fila.
AUTOMATION           packages/domain/src/ambiente-de-prueba.test.ts («TEST-UF-013 · …»),
                     apps/api/src/plataforma/catalogo-de-demostracion.spec.ts y
                     test/integration/catalogo-de-demostracion.int-spec.ts. Mutaciones: la regla que ofrece el catálogo
                     en producción → rojo en el dominio; el filtro que no excluye nada → rojo en la unidad de la API.
ENVIRONMENT          `npm test` (dominio y API) y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde
```

---

## TEST-UF-014 — `/pro` pide el segundo factor: sin él, la sesión no actúa como profesional

```text
TEST_ID              TEST-UF-014
TITLE                Una sesión de una identidad con perfil profesional, sin el segundo factor verificado, no lee ni
                     decide nada como profesional (ni por el PDP, ni por un área, ni por sus listas), y como persona
                     sigue igual; lo configura dentro de los 10 minutos de entrar, lo verifica con el autenticador o
                     con un código de recuperación, y lo reemplaza
LEVEL                Dominio (el estado y la evaluación del PDP), integración (API real con PostgreSQL) y website (la
                     compuerta de /pro)
PRIORITY             P0
SOURCES              UF-11 (WP-USO-FINAL.md §4.1) · UF-D12 (§7) · DL-169 · 08 §25 · 08 §27.2 · 08 §42, condición 6 ·
                     DL-155 (el segundo factor de Administración)
PRECONDITIONS        BE_CLAVE_DEL_SEGUNDO_FACTOR configurada (como en test desde #214).
SYNTHETIC_FIXTURE    Un profesional sintético de Nutrición con una persona vinculada (B2 y A3); el autenticador se
                     simula con otpauth sobre la clave que devuelve la configuración.
STEPS                1. Evaluar el estado con y sin perfil profesional, verificado, con autenticador, sin él dentro y
                        fuera de los 10 minutos; evaluar el PDP con todo a favor salvo el segundo factor.
                     2. Con una sesión nueva del profesional, sin segundo factor: pedir el tablero de la persona
                        (API-DSH-03), su cartera (API-CAR-01), el catálogo (API-NUT-13-BUSQUEDA), sus vínculos
                        (API-REL-05) e invitar (API-INV-01). Como persona: /me (API-ACC-05) y lo que falta (API-ACC-07).
                     3. Leer el estado (API-MFA-01), configurar (API-MFA-04 y 05) y repetir el paso 2.
                     4. Otra sesión: el estado; un código que no vale; el código del autenticador (API-MFA-02); otra
                        sesión con un código de recuperación (API-MFA-03), y el mismo código otra vez.
                     5. Reemplazar el autenticador desde una sesión reciente verificada (API-MFA-04 y 05) y generar
                        códigos nuevos (API-MFA-06).
                     6. En el website: entrar a /pro con cada estado.
EXPECTED             1 → sin perfil, NO_REQUERIDO; verificado, VERIFICADO; con autenticador, REQUERIDO; sin él,
                     CONFIGURACION_REQUERIDA hasta los 10 minutos e INICIO_RECIENTE_REQUERIDO después; el PDP deniega
                     por SITUACION. 2 → API-DSH-03 404; la cartera vacía; el catálogo 403; API-REL-05 sin los vínculos
                     donde es el profesional; API-INV-01 403; como persona, todo 200 y API-ACC-07 sin pasos nuevos.
                     3 → ENROLLMENT_REQUIRED con su plazo; al confirmar, diez códigos y VERIFIED; el paso 2 da 200 con
                     los datos. 4 → REQUIRED; 422 con los intentos que quedan; VERIFIED; con el código de recuperación,
                     VERIFIED con un código menos, y el mismo código otra vez, 422. 5 → el autenticador nuevo vale y el
                     viejo no; las otras sesiones vuelven a pedir el código; los códigos viejos dejan de valer. 6 → la
                     página no se monta hasta VERIFIED; «Cerrar sesión» siempre está.
NEGATIVE_ASSERTIONS  Ninguna lectura ni decisión profesional corre sin el segundo factor, por ninguna superficie (08 §27.2:
                     ocultar un botón no es control de acceso). La app de la persona no lo pide: lo que la 0.24 lee como
                     persona sigue igual. API-ACC-07 no suma un paso (la 0.24 pediría actualizar). Ni la clave ni los
                     códigos quedan en la auditoría ni en el registro.
AUTOMATION           packages/domain/src/segundo-factor-del-profesional.test.ts («TEST-UF-014 · …»),
                     test/integration/segundo-factor-del-profesional.int-spec.ts y, del website,
                     apps/web/test/segundo-factor-del-profesional.test.mjs. Mutaciones: el estado que deja pasar sin
                     verificar; el PDP sin la condición → rojo en el dominio; la compuerta que deja pasar un estado que
                     no conoce → rojo en el website.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; en /pro, la configuración con una app de códigos (pendiente de prueba manual)
```

---

## TEST-UF-009 — Administración incorpora a un profesional real, con su matrícula, y cambia su nombre profesional

```text
TEST_ID              TEST-UF-009
TITLE                API-ADM-14 incorpora una cuenta que ya existe como profesional, solo con una sesión administrativa
                     con segundo factor y con fundamento: crea el perfil con su matrícula y, por área, la verificación y
                     la habilitación, con los hechos de M-02 del administrador; API-ADM-15 cambia el nombre profesional
                     con su hecho, y la base no deja cambiarlo sin él
LEVEL                Dominio (la forma del pedido), integración (API real con PostgreSQL) y website (/admin)
PRIORITY             P0
SOURCES              UF-04 (WP-USO-FINAL.md §4.1) · UF-D6, UF-D7 y UF-D8 (§7) · DL-169 · DL-155 · DL-036 · 06 §6.8 ·
                     WP-ADMINISTRACION §2 y §6
PRECONDITIONS        Un administrador incorporado por el comando interno, con su autenticador; una cuenta común con
                     nombre, creada por el alta.
SYNTHETIC_FIXTURE    Correos `@example.invalid`; matrícula sintética («MN 000000», «Ciudad Autónoma de Buenos Aires»);
                     el autenticador con otpauth.
STEPS                1. Evaluar la forma del pedido: sin fundamento, sin nombre, sanitario sin matrícula, no sanitario
                        con matrícula, sin áreas o con un área repetida.
                     2. API-ADM-14 con una sesión común, con una administrativa sin segundo factor y con una vigente.
                     3. Incorporar la cuenta (sanitario, Nutrición, con matrícula) y leer la ficha (API-ADM-11).
                     4. Repetir con la misma Idempotency-Key y con otra; incorporar un correo que no existe y una cuenta
                        administrativa.
                     5. El profesional entra a /pro (configura su segundo factor), invita a una persona y la persona,
                        al aceptar, ve su nombre profesional.
                     6. API-ADM-15 con el nombre que se vio y con otro; actualizar el nombre en la base sin su hecho.
EXPECTED             1 → 422 con RATIONALE_REQUIRED, DISPLAY_NAME_REQUIRED, LICENSE_REQUIRED, LICENSE_NOT_APPLICABLE,
                     SCOPES_REQUIRED o SCOPE_REPEATED. 2 → 403 ACTION_FORBIDDEN, 403 MFA_REQUIRED y 201. 3 → la ficha con
                     el nombre profesional, el tipo, la matrícula y Nutrición en CAN_OPERATE; en la base, el perfil con
                     su matrícula y los hechos PerfilProfesionalCreado, AlcancePresentado, AlcanceVerificado y
                     HabilitacionConcedida del administrador, con el fundamento. 4 → la misma respuesta; 422
                     ALREADY_PROFESSIONAL; 404; 422 ACCOUNT_IS_ADMINISTRATIVE. 5 → 201 la invitación; la persona ve el
                     nombre profesional. 6 → 200 con el nombre nuevo, que ve la persona, y el hecho con el nombre
                     anterior; 409 VERSION_CONFLICT; la base lo rechaza.
NEGATIVE_ASSERTIONS  Nada queda a medias: un rechazo no crea perfil, verificación, habilitación ni hechos. Nadie se
                     incorpora a sí mismo. El nombre profesional no cambia sin fundamento ni sin su hecho. La auditoría
                     no guarda el fundamento ni la matrícula.
AUTOMATION           packages/domain/src/incorporacion-de-profesionales.test.ts («TEST-UF-009 · …»),
                     test/integration/incorporacion-de-profesionales.int-spec.ts y la prueba de contrato. Mutaciones: la
                     forma que acepta un sanitario sin matrícula → rojo en el dominio.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; en /admin, la incorporación de una cuenta sintética (pendiente de prueba manual)
```

---

## TEST-UF-011 — La persona descarga lo suyo, sin datos de terceros, y pide sus derechos por un canal que Administración resuelve

```text
TEST_ID              TEST-UF-011
TITLE                API-EXP-01 y 02 generan la exportación propia y la entregan por una ruta firmada y temporal, con lo
                     del titular y sin datos de terceros salvo la referencia mínima de sus profesionales; API-RGT-01 a 03
                     registran y listan los pedidos de acceso, rectificación y supresión con su plazo, y Administración
                     los resuelve con fundamento (API-ADM-16 y 17)
LEVEL                Dominio (los plazos y el contrato), integración (API real con PostgreSQL), website y APK
PRIORITY             P0
SOURCES              UF-06 (WP-USO-FINAL.md §4.1) · DL-169 · 08 §18 y §19 · 08 §21 (rutas de 15 minutos) · 09 v0.12 §14
                     (API-RGT-01 a 03) y §15 (API-EXP-01 y 02) · Ley 25.326, art. 14 y 16 (plazos a confirmar con la
                     asesoría)
PRECONDITIONS        Una persona con un vínculo de Nutrición, un plan activado, registros y una medida; otra persona con
                     sus propios registros, vinculada al mismo profesional.
SYNTHETIC_FIXTURE    Personas y profesional sintéticos (`@example.invalid`); un administrador con su autenticador.
STEPS                1. Calcular el plazo de cada tipo de pedido desde un viernes y desde un lunes.
                     2. API-EXP-01 con los tres dominios y sin dominios; API-EXP-02 de la propia y de una ajena.
                     3. Descargar por la ruta firmada; con la firma alterada; vencida.
                     4. Buscar en el archivo los identificadores y el nombre de la otra persona.
                     5. API-RGT-01 de cada tipo, API-RGT-02 de uno propio y de uno ajeno, API-RGT-03.
                     6. API-ADM-16 y API-ADM-17 (resolver con respuesta y fundamento; otra vez; sin fundamento).
EXPECTED             1 → acceso: diez días corridos; rectificación y supresión: cinco días hábiles (de lunes a viernes).
                     2 → 201 con el estado READY y su vencimiento; sin dominios, 422; la propia, 200 con una ruta de
                     descarga que vence a los 15 minutos; la ajena, 404. 3 → 200 con el archivo (JSON, como adjunto),
                     con el perfil, los vínculos y sus consentimientos, los registros, los planes activados, las medidas
                     y los formularios; alterada o vencida, 404. 4 → ninguno de los dos aparece. 5 → 201 con el plazo;
                     el propio, 200; el ajeno, 404; la lista solo con los propios. 6 → la lista con el pendiente; 200
                     resuelto; otra vez, 422; sin fundamento, 422; la persona ve la respuesta, no el fundamento.
NEGATIVE_ASSERTIONS  El archivo no se guarda en la base: se arma al descargarlo. Ningún dato de otra persona ni el correo
                     de un profesional. La auditoría registra el pedido y cada entrega, sin el contenido. Un pedido no se
                     borra ni se reescribe.
AUTOMATION           packages/domain/src/derechos-del-titular.test.ts («TEST-UF-011 · …»),
                     test/integration/derechos-del-titular.int-spec.ts y la prueba de contrato. Mutaciones: el plazo de
                     la supresión en días corridos → rojo en el dominio; la ruta firmada que no vence → rojo en la unidad
                     de la API.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; la descarga desde /account y desde la app (pendiente de prueba manual)
```
