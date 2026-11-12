# WP-USO-FINAL — los oráculos TEST-UF de las etapas 1 y 2

> **Qué es esto.** El paquete (`WP-USO-FINAL.md` §6) declaró los oráculos TEST-UF-001 a 015 en una línea cada uno. Acá
> van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), como los TEST-AVR de
> `WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`. Este archivo trae los de la **etapa 1**, que Dirección pidió el 2026-11-11 al
> ratificar UF-D1 a UF-D13: UF-12 (DL-114), UF-00 (las APK anteriores en suspenso), UF-01 (el nombre obligatorio) y
> UF-08 (lo que dice el ambiente). UF-12 no tenía oráculo en el §6: se suma TEST-UF-016.
>
> **La etapa 2** (§13 del paquete, declarada el 2026-11-12) suma los oráculos de su primera mitad, al final de este
> archivo: TEST-UF-013 (UF-09), TEST-UF-014 (UF-11), TEST-UF-009 (UF-04) y TEST-UF-011 (UF-06), cada uno escrito antes del
> código de su parte. Después, los de la segunda mitad, en el orden en que se programó: TEST-UF-007 y 008 (UF-03) y
> TEST-UF-017 (UF-07, que no tenía oráculo en el §6).
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`. Los oráculos de las partes que faltan se
> escriben con su tanda; TEST-UF-015 (la restauración repite las supresiones) espera a UF-10, que es de Dirección.
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

---

# La segunda mitad de la etapa 2 (2026-11-12)

## TEST-UF-007 — Pedir la recuperación responde igual exista o no la cuenta

```text
TEST_ID              TEST-UF-007
TITLE                API-ACC-P1-01 responde el mismo 202, con la misma forma y el mismo vencimiento, para un correo sin
                     cuenta, una cuenta con contraseña, una que solo entra con Google y una que no opera; solo cambia lo
                     que llega por correo; el cupo de 3 por hora por correo vale igual exista o no la cuenta
LEVEL                Dominio (qué hace el pedido según la cuenta, y la respuesta), unidad de la API (el adaptador del
                     correo) e integración (API real con PostgreSQL y un proveedor de correo falso local)
PRIORITY             P0
SOURCES              UF-03 (WP-USO-FINAL.md §4.1) · UF-D9 (§7) · DL-169 · 04 RF-005 (UC-E09) · 08 §24.4 y §24.5 · 08 §38
                     (recuperación: 3 por hora) · 09 v0.12 §10 (API-ACC-P1-01: «202, mismo shape exista o no exista la
                     cuenta»)
PRECONDITIONS        La API con el proveedor de correo configurado contra un servidor falso local; otra app sin proveedor.
SYNTHETIC_FIXTURE    Correos `@example.invalid`: uno sin cuenta, una cuenta con contraseña, una cuenta creada con Google
                     (verificador con claves sintéticas), una cerrada y una suspendida.
STEPS                1. Decidir el pedido con cada situación de la cuenta, con y sin proveedor de correo.
                     2. Pedir la recuperación (API-ACC-P1-01) con cada correo; comparar status, claves, `delivery` y el
                        vencimiento (`expiresAt` menos el momento del pedido).
                     3. Leer lo que recibió el proveedor falso y la auditoría de cada pedido.
                     4. Pedir 4 veces en una hora con el mismo correo, con cuenta y sin cuenta.
                     5. Sin proveedor: el mismo pedido.
EXPECTED             1 → con contraseña y operativa: pedido con código (por correo, si hay proveedor); solo con Google:
                     sin pedido, y el aviso «Continuar con Google» si hay proveedor; sin cuenta, cerrada o suspendida:
                     nada. 2 → siempre 202 `{ data: { recoveryId, expiresAt, delivery } }`, `expiresAt` a los 30 minutos
                     y `delivery` EMAIL, sin otra diferencia. 3 → un correo con el código a la cuenta con contraseña, uno
                     que nombra «Continuar con Google» a la de Google y ninguno a las demás; la auditoría registra cada
                     pedido sin el correo ni el código (sin cuenta: RECHAZO sin sujeto). 4 → el cuarto, 429 en los dos
                     casos. 5 → 202 con `delivery` ASSISTED y ningún correo.
NEGATIVE_ASSERTIONS  La respuesta nunca dice si la cuenta existe, si entra con Google ni si opera. El código no está en la
                     respuesta, en la auditoría ni en el registro de la API: la base guarda solo su huella (HMAC). Un
                     pedido no cambia la contraseña ni cierra sesiones.
AUTOMATION           packages/domain/src/recuperacion-de-acceso.test.ts («TEST-UF-007 · …»),
                     apps/api/src/plataforma/correo.spec.ts y test/integration/recuperacion-de-acceso.int-spec.ts.
                     Mutaciones: el pedido que le da un código a una cuenta cerrada → rojo en el dominio; el adaptador
                     que manda sin la clave del proveedor → rojo en la unidad de la API.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; con el proveedor real, un correo de recuperación recibido (pendiente: lo elige Dirección)
```

---

## TEST-UF-008 — Un código vencido, usado o ajeno no cambia nada; el vigente cambia la contraseña y cierra las sesiones

```text
TEST_ID              TEST-UF-008
TITLE                API-ACC-P1-02 con un código que no vale responde el mismo 422 y no cambia nada; con el vigente, la
                     identidad es la misma, la contraseña nueva entra y la vieja no, todas las sesiones terminan y los
                     vínculos siguen; cinco códigos que no valen anulan el pedido; la recuperación asistida (API-ADM-18)
                     da un código de un solo uso con fundamento y cierra las sesiones
LEVEL                Dominio (el estado de un código y su forma), integración (API real con PostgreSQL) y la base (la
                     credencial cambia solo con su cambio registrado)
PRIORITY             P0
SOURCES              UF-03 (§4.1) · UF-D9 (§7) · DL-169 · 04 RF-005 («solicitudes inválidas o vencidas no modifican el
                     acceso») · 08 §24.4, §24.6 y §26.3 (el cambio de credencial revoca las sesiones) · 09 v0.12 §10
                     (API-ACC-P1-02)
PRECONDITIONS        Una persona con contraseña, un vínculo de Nutrición y dos sesiones abiertas (web y APK); un
                     administrador incorporado por el comando interno, con su autenticador.
SYNTHETIC_FIXTURE    Correos `@example.invalid`; contraseñas sintéticas; el autenticador con otpauth.
STEPS                1. Evaluar el estado de un código: vigente, vencido, usado, anulado; y la forma (diez caracteres de
                        Crockford, con guion o sin él, en minúsculas).
                     2. Completar (API-ACC-P1-02) con un código que no es, con uno de otra cuenta, con un `recoveryId`
                        inventado y con una contraseña nueva corta.
                     3. Completar con el código vigente; entrar con la vieja y con la nueva; usar los tokens de antes;
                        leer la identidad y el vínculo; volver a usar el mismo código.
                     4. Un código vencido (escrito en la base con su vencimiento ya pasado): completar.
                     5. Cinco códigos que no valen sobre el mismo pedido, y después el correcto.
                     6. API-ADM-18 sin segundo factor, sin fundamento, a una cuenta administrativa, a una que solo entra
                        con Google, a un correo sin cuenta y a la persona; la persona pide y completa con ese código.
                     7. En la base: cambiar el hash de una credencial sin su cambio registrado.
EXPECTED             1 → solo el vigente vale; la forma se normaliza (`abcde-fghjk` = `ABCDEFGHJK`) y otra longitud es
                     `null`. 2 → 422 RECOVERY_CODE_INVALID en los tres primeros, sin cambios; la contraseña corta, 422
                     VALIDATION_FAILED sin gastar un intento. 3 → 204; la vieja, 401; la nueva, 201; los tokens de antes,
                     401 SESSION_REVOKED; la misma identidad y el mismo vínculo; el mismo código otra vez, 422. 4 → 422 y
                     la contraseña de antes sigue. 5 → el sexto intento, aun con el código correcto, 422. 6 → 403
                     MFA_REQUIRED; 422 VALIDATION_FAILED con RATIONALE_REQUIRED, ACCOUNT_IS_ADMINISTRATIVE y
                     ACCOUNT_WITHOUT_PASSWORD; 404; 201 con el código (una sola vez) y las sesiones de la persona
                     revocadas; con ese código, 204. 7 → la base lo rechaza.
NEGATIVE_ASSERTIONS  Nunca se crea otra identidad ni se toca el método de Google. Un rechazo no cambia la credencial ni
                     cierra sesiones. El código no queda en la base en claro (solo su huella), ni en la auditoría, ni
                     en la idempotencia (API-ADM-18 no la usa: cada pedido emite uno nuevo y anula el anterior). La
                     auditoría registra el cambio, la revocación y la emisión asistida sin el fundamento.
AUTOMATION           packages/domain/src/recuperacion-de-acceso.test.ts («TEST-UF-008 · …») y
                     test/integration/recuperacion-de-acceso.int-spec.ts, más la prueba de contrato. Mutación: el estado
                     que deja pasar un código vencido → rojo en el dominio.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; en el teléfono y en el website, «¿Olvidaste tu contraseña?» de punta a punta (pendiente
                     de prueba manual: la candidata del 25/11)
```

---

## TEST-UF-017 — El canal de ayuda y contacto sale de la configuración y está a un toque en la web y en la app

```text
TEST_ID              TEST-UF-017
TITLE                API-SOP-01 publica, sin sesión, las direcciones de soporte y de privacidad que tiene la configuración
                     de la API (`BE_CONTACTO_SOPORTE` y `BE_CONTACTO_PRIVACIDAD`), o `null` si no están; el website las
                     muestra en «Ayuda y contacto» (enlace del pie y /account) y la APK en Perfil → «Ayuda y contacto»,
                     siempre leídas de la API; ninguna dirección real queda escrita en el código
LEVEL                Dominio (la forma y los textos), unidad de la API (la configuración), integración (API real), website,
                     APK y una guardia sobre el código fuente
PRIORITY             P0
SOURCES              UF-07 (WP-USO-FINAL.md §4.1) · §13.2 («las direcciones de soporte y de privacidad, por configuración.
                     Ninguna dirección personal queda en el repositorio») · DL-169 · 08 §19 (el canal de los derechos) ·
                     textos.ts:87 («el canal que se publique antes de operar con datos reales»)
PRECONDITIONS        La API con las dos direcciones configuradas, y otra sin ninguna.
SYNTHETIC_FIXTURE    Direcciones `@example.invalid`; ninguna real.
STEPS                1. Leer la configuración con las dos direcciones, con una sola, sin ninguna, con una que no es un
                        correo y, en producción, con una sintética.
                     2. Pedir API-SOP-01 sin sesión a las dos apps.
                     3. Recorrer el pie y /account del website, y los ajustes de Perfil de la APK.
                     4. Buscar direcciones de correo escritas en el código fuente del dominio, la API, el website y la APK
                        (sin contar las pruebas).
EXPECTED             1 → las dos, una o ninguna se leen tal cual (en minúsculas); una que no es un correo, o una sintética
                     en producción, no deja arrancar la API y el mensaje nombra la variable, no el valor. 2 → 200
                     `{ data: { supportEmail, privacyEmail } }` con las configuradas o con `null`, con caché pública
                     corta; nunca pide sesión. 3 → el pie enlaza «Ayuda y contacto» (/help), /account lo muestra, y
                     Perfil tiene el ajuste «Ayuda y contacto» después de «Tus datos». 4 → solo dominios reservados
                     (`.invalid`, `.example`, `.test`, `example.com`).
NEGATIVE_ASSERTIONS  Ninguna pantalla escribe una dirección fija: si la configuración cambia, la APK instalada muestra la
                     nueva sin reconstruirse. Sin configuración, ni la web ni la app inventan una: dicen que el canal
                     todavía no está publicado. API-SOP-01 no lee la base ni datos de nadie.
AUTOMATION           packages/domain/src/ayuda-y-contacto.test.ts («TEST-UF-017 · …»), apps/api/src/config/entorno.spec.ts,
                     test/integration/ayuda-y-contacto.int-spec.ts, la prueba de contrato, scripts/sin-correos-en-el-codigo.test.cjs
                     y TEST-AVR-004 (vuelta-de-rosca), que cambia con la fila nueva de Perfil. Mutaciones: una dirección real
                     escrita en una pantalla → rojo en la guardia; la configuración que acepta una dirección sintética en
                     producción → rojo en la unidad de la API.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; con las direcciones cargadas en Render, «Ayuda y contacto» en el website y en la app
                     (pendiente: las direcciones las define Dirección)
```

---

## TEST-UF-010 — La versión nueva de los textos no dice «demostración», queda sin publicar y, publicada, se pide en «Antes de seguir»

```text
TEST_ID              TEST-UF-010
TITLE                Las versiones nuevas de los diez textos de uso real (términos, privacidad, datos de salud, B2
                     sanitario y no sanitario, cierre, evidencia visual y lo que se comparte entre áreas) no dicen
                     «demostración», suceden a la vigente de su tipo con su hash y quedan sin publicar mientras falte la
                     validación jurídica; publicadas, ningún texto vigente dice «demostración», API-ACC-07 pide a quien
                     aceptó la anterior los términos y la privacidad nuevos (solo a un cliente que los sabe mostrar) y
                     API-ACC-08 registra el acto con la versión que la pantalla mostró
LEVEL                Dominio (los textos, la regla de publicación y qué pasos faltan), integración (API real con
                     PostgreSQL; la publicación simulada dentro de una transacción que se revierte), website y APK
PRIORITY             P0
SOURCES              UF-05 (WP-USO-FINAL.md §4.1) · §13.2 («la versión nueva queda sin publicar hasta esa validación») ·
                     §13.3 (API-ACC-07 no emite un paso nuevo hasta que haya una APK que lo entienda) · UF-D4 · DL-169 ·
                     08 §12.2 (versión mostrada = versión aceptada) · 08 §42, condición 1 · 09 §31.2.6 (una versión nueva
                     no hereda aceptaciones)
PRECONDITIONS        El catálogo vigente (las versiones de demostración) y las diez versiones nuevas sin publicar.
SYNTHETIC_FIXTURE    Personas sintéticas (`@example.invalid`); la publicación se simula insertando dos versiones nuevas en
                     una transacción que se revierte, así el catálogo de la base sigue igual al de @be/domain.
STEPS                1. Recorrer las versiones sin publicar: el tipo, a quién reemplazan, el hash y el texto.
                     2. Preguntar qué falta para publicar cada una.
                     3. Simular la publicación de todas sobre el catálogo vigente y leer los textos vigentes.
                     4. Calcular los pasos de una cuenta que aceptó la versión vigente, una que aceptó la anterior y una
                        sin aceptación, con y sin la capacidad del cliente.
                     5. Con la API: API-ACC-07 de una cuenta nueva (con la capacidad) y API-ACC-08 con la vigente, con
                        otra versión y con un campo de más.
                     6. En una transacción que se revierte: publicar los términos y la privacidad nuevos, pedir los pasos
                        de una cuenta que aceptó los anteriores, aceptar cada uno y volver a pedir los pasos.
EXPECTED             1 → ninguna dice «demostración»; cada una reemplaza a la vigente de su tipo y su hash es el SHA-256 de
                     su texto. 2 → a todas les falta la validación jurídica (y los datos marcados «[A COMPLETAR …]»): no
                     se pueden publicar. 3 → ningún texto vigente dice «demostración». 4 → con la capacidad, la vigente no
                     pide nada; la anterior o ninguna piden ACCEPT_TERMS o ACKNOWLEDGE_PRIVACY con el id de la versión
                     vigente en `suggestion`; sin la capacidad, ningún paso de textos. 5 → `steps` vacío; con la vigente,
                     200 sin un acto nuevo; con otra, 422 TERMS_VERSION_NOT_ACCEPTABLE o PRIVACY_VERSION_NOT_ACCEPTABLE;
                     un campo de más, 400. 6 → los dos pasos; aceptar los términos crea su acto con la versión y el hash
                     nuevos y deja solo la privacidad; aceptar la privacidad deja la lista vacía; aceptar otra vez no
                     duplica. Revertida la transacción, las versiones nuevas no quedan en la base.
NEGATIVE_ASSERTIONS  La 0.24 (sin la capacidad) nunca recibe un paso de textos: su lectura congelada de API-ACC-07 sigue
                     igual. Una versión nueva no hereda la aceptación de la anterior. Un texto sin publicar no está en la
                     base ni en el catálogo de @be/domain, y API-ACC-08 no lo acepta.
AUTOMATION           packages/domain/src/textos-de-uso-real.test.ts («TEST-UF-010 · …»),
                     test/integration/textos-de-uso-real.int-spec.ts, la prueba de contrato,
                     apps/mobile/src/nombre-obligatorio.test.ts y las lecturas congeladas de la 0.24. Mutaciones: la regla
                     que da por aceptada cualquier versión del tipo → rojo en el dominio; publicar con la validación
                     jurídica pendiente → rojo en el dominio.
ENVIRONMENT          `npm test` y el job de integración de la CI
EVIDENCE_EXPECTED    La CI verde; los textos validados por la asesoría (condición 1 del gate, pendiente) y, publicados,
                     «Antes de seguir» en el teléfono y en el website (pendiente de prueba manual)
```

**Oráculo existente que cambia con UF-05:** TEST-UF-005 fijaba la lista de pasos de API-ACC-07 en `['DISPLAY_NAME']`
(`contratos-perfil-propio.test.ts`). Con UF-05 la lista suma `ACCEPT_TERMS` y `ACKNOWLEDGE_PRIVACY`, y la prueba lleva una
nota que lo explica. Lo demás de TEST-UF-005 no cambia: una cuenta sin nombre ve el nombre primero, y la 0.24 no recibe los
pasos de textos porque no declara la capacidad.
