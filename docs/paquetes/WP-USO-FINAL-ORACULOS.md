# WP-USO-FINAL — los oráculos TEST-UF de la etapa 1

> **Qué es esto.** El paquete (`WP-USO-FINAL.md` §6) declaró los oráculos TEST-UF-001 a 015 en una línea cada uno. Acá
> van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), como los TEST-AVR de
> `WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`. Este archivo trae los de la **etapa 1**, que Dirección pidió el 2026-11-11 al
> ratificar UF-D1 a UF-D13: UF-12 (DL-114), UF-00 (las APK anteriores en suspenso), UF-01 (el nombre obligatorio) y
> UF-08 (lo que dice el ambiente). UF-12 no tenía oráculo en el §6: se suma TEST-UF-016.
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`. Los oráculos de las otras partes
> (TEST-UF-007 a 011 y 013 a 015) se escriben con su tanda.
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
