# La excepción del zod de Expo: procedencia comprobada (DL-114, ratificada por Dirección el 2026-10-24)

**Qué se responde acá.** Qué copia de zod es vulnerable en la APK, quién la usa, qué zod usa el dominio, cuál viaja en el
bundle de Android, y qué hace fallar la excepción. Todo es del 2026-10-24, sobre la rama
`seguridad/excepcion-zod-expo-propuesta` (sobre `seguridad/avisos-2026-10-23`, sobre `main` = `0fb1bff`).

## La ratificación

**Dirección de BE ratificó esta excepción el 2026-10-24, hasta el 2026-10-31 inclusive.** El texto completo está en
`docs/DEUDA_LEGAJO.md`, DL-114.
- **Qué ratificó.** Solo GHSA-mrhx-c7xc-m3w5, en el zod 3.25.76 de `node_modules/zod`, en la auditoría de `@be/mobile`,
  con procedencia exclusiva `@expo/cli` ← `expo` ← `@be/mobile`.
- **Con qué condiciones.** Se comprueban en cada auditoría, y todas son obligatorias:
  - ninguna ruta adicional de producción usa esa copia;
  - la copia no entra al bundle de Android;
  - fail closed: una procedencia nueva bloquea, una comprobación imposible no aprueba, y vencida, bloquea.
- **El vencimiento.** La CI compara la fecha UTC: vale hasta el 2026-10-31 a las 23:59:59 UTC (20:59:59 de Argentina).
  Desde el 2026-11-01 la auditoría falla en toda rama, salvo una decisión nueva.
- **Lo que no autoriza:**
  - integrar en `main` ni desplegar `test`;
  - otras excepciones, ni ampliar las de node-forge y braces o cambiar su vencimiento.

  El procedimiento para cuando haya esa autorización está en `INTEGRACION.md`, en esta carpeta, y no se ejecutó.

## El aviso

GHSA-mrhx-c7xc-m3w5 (CVE-2023-54404): zod puede agotar la memoria al validar una lista muy grande contra un esquema de
lista sin tope. Junta un error por cada elemento que falla, sin límite. Es de severidad alta (CVSS 7.5,
`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H`), abarca todo zod anterior a la 4.6.6 y se corrige en la 4.6.6. Se publicó el
2026-10-01 y se actualizó el 2026-10-23.

## Las copias de zod y quién las usa (`package-lock.json`)

| Copia | Versión | La usa en producción | La usa en desarrollo |
|---|---|---|---|
| `node_modules/zod` (la raíz) | 3.25.76 | solo `@expo/cli` 57.0.25 | `chromium-bidi` 17.0.2, por `puppeteer-core` (los recorridos) |
| `packages/domain/node_modules/zod` | 4.6.6 | solo `@be/domain` | — |

- A `@expo/cli` la usa en producción solo `expo` 57.0.23, y a `expo` lo pide `@be/mobile`. Cada camino de producción
  desde la APK hasta el zod 3 pasa por `expo → @expo/cli → zod`.
- `npm audit --omit=dev -w @be/mobile` lo confirma: encuentra vulnerable solo `node_modules/zod`, con `@expo/cli` como
  único efecto. En `@be/api`, `@be/web` y `@be/domain` no encuentra nada.
- **Por qué importa dónde está.** Node y Metro buscan `zod` subiendo por las carpetas `node_modules`. El dominio encuentra
  el suyo (4.6.6) antes de llegar a la raíz. Cualquier otro archivo del monorepo que importe `zod` sin tener una copia
  propia recibe el 3.25.76 de la raíz: la APK, la API, el website, los scripts.
- **La CLI usa ese zod** solo en `start/server/DevToolsPlugin.schema.js` y `createMCPDevToolsExtensionSchema.js`, para
  validar la definición de los complementos de DevTools que declaran los paquetes instalados (los encuentra el
  autolinking de Expo). No valida datos de las personas.
- **Y lo carga al construir.** Durante `export:embed`, el paso que usa Gradle, un registro de carga de módulos
  (`NODE_OPTIONS=--require`) anotó una sola carga de `node_modules/zod`, desde `DevToolsPlugin.schema.js`. El zod 3 se
  ejecuta en la máquina que construye, no en el teléfono.

## El zod del dominio

- `packages/domain/package.json` pide `zod` 4.6.6 exacto, y el lockfile lo instala anidado en
  `packages/domain/node_modules/zod`.
- En la API: la imagen copia esa carpeta aparte (`apps/api/Dockerfile`, línea 50), porque sin ella el dominio resolvería
  el zod de la raíz.
- En la APK: ver el bundle, abajo.
- Fuera de `packages/domain`, ningún archivo del repositorio importa `zod`.

## Lo que viaja en el bundle de Android

**La candidata.3 publicada** (`be-apk-0.17.0-candidata.3`):
- El APK de la construcción del 2026-10-19 (`C:/b11`) tiene el SHA-256 `d6b7384244bef7c27ee202506facc77bf94ae8b5ffcf24a93c90eabf296cdad6`, el mismo que GitHub da para el APK publicado.
- Su mapa de fuentes (`index.android.bundle.packager.map`) tiene 1.124 módulos.
- El zod que lleva es solo el de `packages/domain/node_modules/zod`: 95 módulos. `v4/core/versions.cjs` dice
  `{ major: 4, minor: 6, patch: 5 }`. Es vulnerable, y es lo que ejecutan hoy los teléfonos con la candidata.
- No tiene ningún módulo de `node_modules/zod`.
- Tiene un módulo de la CLI: `@expo/cli/build/metro-require/require.js`, el sistema de módulos de Metro, que no importa
  nada. Por eso no alcanza con decir que la CLI es de construcción: la prueba tiene que ser sobre la copia de zod.

**La 0.13.2 (estable).** No quedó su mapa. Según el lockfile del commit con que se construyó (`4b49d43`), el dominio tenía
zod 4.6.5. No se verificó en el binario.

**Esta propuesta**, con `npm ci` de la APK, el dominio y la raíz desde su lockfile, y `npm run audit:prod` en Windows
(Node 22.23.2, 2026-10-24, tres minutos con un solo proceso de Metro):

```
✓ @be/api: sin avisos altos ni críticos fuera de las excepciones declaradas
✓ @be/web: sin avisos altos ni críticos fuera de las excepciones declaradas
· @be/mobile: exceptuado hasta el 2026-10-31 · node-forge · GHSA-86w9-cpqp-85rv (DL-114)
· @be/mobile: exceptuado hasta el 2026-10-31 · zod · GHSA-mrhx-c7xc-m3w5 (DL-114)
    procedencia comprobada en package-lock.json: node_modules/zod 3.25.76 ← @expo/cli 57.0.25 ← expo 57.0.23 ← @be/mobile
    en desarrollo también la usa node_modules/chromium-bidi (chromium-bidi 17.0.2) (fuera de esta auditoría de producción)
    bundle de Android (1127 módulos): ninguno de node_modules/zod; zod en el bundle: packages/domain/node_modules/zod 4.6.6 (95 módulos)
✓ @be/mobile: sin avisos altos ni críticos fuera de las excepciones declaradas
```

La resolución de Node en esa instalación da lo mismo: desde `packages/domain/dist`, `zod` es
`packages/domain/node_modules/zod` (4.6.6); desde `apps/mobile` y `apps/mobile/src`, es `node_modules/zod` (3.25.76).

La CI corre la misma auditoría, con el mismo bundle, en cada push a una rama `wp-*` y en cada PR a `main`.

## Qué hace fallar la excepción

`scripts/auditoria-de-dependencias.cjs` exceptúa el aviso en `@be/mobile` solo si se cumple todo esto en la misma corrida:

1. npm encuentra vulnerable solo `node_modules/zod`, y el lockfile dice 3.25.76.
2. En producción la usa solo `@expo/cli` 57.0.25; a la CLI, solo `expo` 57.0.23; y `@be/mobile` pide `expo`.
3. El bundle de Android de ese commit no tiene módulos de `node_modules/zod` ni de otra copia de zod anterior a la 4.6.6.
   Se construye como Gradle (`expo export:embed --platform android --dev false`), y `node_modules` coincide con el lockfile.

Si aparece otra ruta, bloquea (código 1). Si algo no se puede comprobar, no aprueba (código 2). Vencida o en otro espacio,
bloquea.

## Pruebas

**Unitarias** (`scripts/auditoria-de-dependencias.test.cjs`, en `npm test`): 30, de las que 17 son nuevas. Las negativas:
- la APK declara zod 3;
- una biblioteca de la APK trae zod 3;
- la APK importa zod sin declararlo (lo ve solo el bundle);
- otra copia vulnerable, anidada o con alias;
- una copia de desarrollo que entra al bundle;
- cambia la versión de la copia o de un eslabón;
- la APK pide la CLI directamente;
- la APK deja de pedir expo;
- la ruta de desarrollo pasa a producción;
- falta el lockfile, una entrada o la lista de npm;
- el bundle no se construye o no es el de la APK;
- `node_modules` no coincide con el lockfile;
- el aviso se amplía o cambia de forma;
- el vencimiento (el 31/10 vale, el 1/11 no);
- los otros espacios.

**Mutaciones.** Se desactivó cada control, uno por vez, y se volvieron a correr las pruebas. Las 16 mutaciones hicieron
fallar al menos una. Con la lógica de la propuesta anterior, que no mira la procedencia, fallan 12.

**Con npm de verdad** (`npm run audit:escenarios`). Cada escenario corre en una carpeta temporal con los manifiestos y el
lockfile, regenerado por npm. Tardan unos 30 s.

| Escenario | Propuesta anterior (`916cb05`) | Corregida |
|---|---|---|
| 1. La APK declara zod 3.25.76 | **0, aprueba** | 1: «apps/mobile (@be/mobile) también usa node_modules/zod en producción» |
| 2. Una biblioteca de la APK pide zod ^3.25.0 | **0, aprueba** | 1: «sintetica/biblioteca-sintetica 1.0.0 también usa node_modules/zod en producción» |
| 3. La API declara zod 3.25.76 | 1 | 1 |
| 4. Sin cambios, el 2026-11-01 | 1, vencida | 1, vencida |
| 5. Sin cambios y sin poder construir el bundle | **0, aprueba** | 2: no se pudo comprobar la procedencia |

El escenario 5 también muestra que, sin cambios, la procedencia del lockfile real se demuestra: si no, daría 1 y no 2.

**Negativa con el bundle real.** Por la duración de la corrida, la APK importó zod sin declararlo: un archivo nuevo,
`apps/mobile/src/prueba-negativa-zod.ts` (`import { z } from 'zod'`), importado desde `index.ts`. El lockfile no
cambia, así que solo lo puede ver el bundle. Con el mismo `npm audit` y el bundle de Android construido como Gradle:

```
código 1
✗ @be/mobile: high · zod · GHSA-mrhx-c7xc-m3w5 · la excepción no cubre esta ruta: el bundle de Android incluye 10 módulos de node_modules/zod (3.25.76): la APK la usaría al ejecutarse
```

Al terminar, `index.ts` quedó igual al original y el archivo se borró.

## Límites

- La auditoría de producción no mira las dependencias de desarrollo, por decisión de WP-01 §2. La ruta de Puppeteer al
  zod 3 se informa y no cuenta.
- El bundle prueba lo que viaja en la APK. No prueba qué carga la CLI en la máquina que construye.
- Un `import 'zod'` sin declarar en la API o el website recibiría el zod 3 de la raíz, y npm no lo vería. Ninguna
  excepción lo tapa, pero la auditoría tampoco lo detecta.
- Una biblioteca que copie el código de zod dentro de sus propios archivos no se reconoce por la carpeta.

## Cómo repetirlo

```
npm ci                                                   # con Node 22
npm run audit:prod                                       # construye el dominio, audita y arma el bundle de Android
BE_AUDITORIA_MAX_WORKERS=1 npm run audit:prod            # lo mismo, en una máquina con poca memoria
node --test scripts/auditoria-de-dependencias.test.cjs   # las 30 pruebas
npm run audit:escenarios                                 # los cinco escenarios con npm de verdad (necesita red)
```

Para el mapa de una APK ya construida: `copiasEnElBundle(require(<mapa>).sources, 'zod')`, que exporta el script.
