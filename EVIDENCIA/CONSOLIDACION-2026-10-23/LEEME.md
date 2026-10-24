# Encargo de consolidación del 2026-10-23 · nota de reanudación

**Dónde estamos.** Lo del encargo está en seis PR en borrador, más este documental (#205). La combinación se probó junta en #204, que no se integra. Nada se integró ni se desplegó. Antes de integrar hay que decidir la excepción de #202: la auditoría de dependencias frena la CI de toda rama.

**Qué hay en esta carpeta:**
- `MATRIZ-DE-ESTADO.md`: qué está integrado, qué está preparado y cómo se verificó cada cosa.
- `MAPA-DE-RECORRIDOS.md`: cada recorrido corregido, de la pantalla a la base y de vuelta.
- `DECISIONES-EXPLICADAS.md`: las diez decisiones, cada una con su concepto.
- `GUION-DE-VERIFICACION.md`: lo que falta comprobar a mano, en el website y en el teléfono.
- `ux01/`: la reproducción de UX-01, con la salida de antes y la de después.

Fuera de la carpeta están `docs/paquetes/WP-ADMINISTRACION.md` y la nota del 2026-10-23 de `docs/QUE-FALTA.md`.

## La base

- `main` = `0fb1bff` (2026-10-20 02:22 -03). Es lo que corre `test`: la API 0.11.1 y el website.
- La APK estable es la 0.13.2 (`4b49d43`).
- La candidata es la 0.17.0-candidata.3 (`cf55288`, construida desde `4091d5e`).

## Los PR y su CI

| PR | Rama · cabeza | Sobre | Qué trae | CI de esa cabeza (corrida) |
|---|---|---|---|---|
| #201 | `seguridad/avisos-2026-10-23` · `1d7bb08` | `main` | Next 15.5.28, zod 4.6.6, multer 2.5.0 y body-parser 2.4.0 | Integración 823/823 · recorridos 12/12 · la auditoría falla solo en `@be/mobile` (40054692533) |
| #202 | `seguridad/excepcion-zod-expo-propuesta` · `916cb05` | #201 | La excepción acotada que se propone (DL-114). **No integrar sin tu decisión** | La CI no corre en una rama apilada que no empieza con `wp-`. En local: 13/13, y la auditoría aprueba en los tres espacios |
| #195 | `wp-apk-sustitucion` · `294e1a8` | `main` | DL-151: la sustitución vuelve a la APK, con el alcance dicho antes de confirmar | Integración 826/826 · recorridos 12/12; en la otra corrida, 11/12 por el intermitente (40047108877 y 40047106407) · APK 82/82 en local |
| #198 | `wp-compatibilidad-apk` · `0c96901` | `main` | DL-152: lo que leen la 0.13.2 y la candidata.3, congelado | Integración 842/842 · recorridos 12/12 (40047186521 y 40047190501) |
| #200 | `wp-nutricion-cobertura` · `a81ada6` | `main` | DL-153: las comidas del plan sin registro (UX-01) | Integración 824/824 · recorridos 13/13; en la otra, 12/13 por el intermitente (40051928558 y 40051923458) · dominio 848/848 en local |
| #203 | `wp-revision-evidencia` · `1cc6593` | #200 | DL-154: la evidencia de una revisión (UX-02) | Integración 829/829 · recorridos 14/14 (40058634147) · dominio 853/853 en local |
| #204 | `wp-integracion-2026-10-23` · `f64083b` | `main` | #201, #195, #198, #200 y #203, juntos (sin #202). **No se integra** | Integración 851/851, con las lecturas congeladas de las dos APK · recorridos 14/14 · imagen y legajo (40058651719) |
| #205 | `wp-docs-consolidacion-2026-10-23` | `main` | Esta carpeta, `QUE-FALTA` y `WP-ADMINISTRACION`. Solo documentación | En `4dfa23d`, que en código es igual a `main`: integración 823/823 · recorridos 12/12; en la otra corrida, 11/12 por el intermitente (40060760127 y 40060722378) |

**`verificar` falla en todas, solo en `npm audit`.** Fallan los avisos publicados después del 20/10: en #201 y #204, solo el zod de la CLI de Expo; en las demás, también Next, multer y body-parser, que vienen de `main`. Los tipos, el OpenAPI sin deriva, las pruebas unitarias y los builds pasan.

## Dependencias

- **Nada se integra con `verificar` en rojo**, y ese control es obligatorio. Por eso primero va #201, y #202 o su alternativa.
- **#203 va sobre #200.** Comparten el OpenAPI generado, `DEUDA_LEGAJO.md`, la guía y pruebas del dominio.
- **#202 va sobre #201.**
- **#198 protege a las APK publicadas.** Conviene integrarlo antes de cualquier cambio de respuesta. Los cambios de este encargo no tocan lo que leen las APK, y #204 lo prueba.
- **La APK nueva de #195** se construye desde la rama al día con `main`, o después de integrar. Desde #189, cada fila de API-TRN-13-BUSQUEDA trae `origin`, y una APK construida sobre la base vieja rechazaría esa respuesta.

## Orden de integración propuesto (no se ejecutó)

1. **#201**, y **#202** si lo aprobás, con la base cambiada a `main`.
2. **#195.** En la API y el dominio solo cambia comentarios, así que no toca lo que leen las APK.
3. **#198**: desde ahí, cada PR prueba lo que leen las APK publicadas.
4. **#200.**
5. **#203**, con la base cambiada a `main`.
6. **El documental (#205)**, en cualquier momento: no comparte archivos con los otros y describe el estado al 23/10, con fechas.

**Por qué este orden.** Va en el orden de los DL (151 a 154): así cada fila nueva de `DEUDA_LEGAJO.md` cae después de la anterior, sin conflictos. Si el orden cambia, los conflictos son solo de orden en ese archivo y se resuelven poniendo las filas por número, como en #204.

Integrar en `main` despliega en `test` cuando pasa la CI (`render.yaml`: `autoDeployTrigger: checksPass`). Antes de cada merge, la rama tiene que volver a pasar la CI sobre el `main` nuevo. Si el orden cambia, o se integra otra cosa en el medio, se repite la prueba de #204.

## Cómo retomar

- **Node 22**, con fnm: `fnm use 22`. Se probó con la 22.23.2.
- **Después de cambiar de rama:** `npx prisma generate`.
- **Dominio y scripts:** `npm test` (reconstruye el dominio). Tipos: `npm run typecheck`. Contrato: `npm run openapi:verificar`.
- **Integración y recorridos:** necesitan Docker y PostgreSQL, y corren en la CI (`.github/workflows/ci.yml`). En local, `test/navegador/LEEME.md`.
- **UX-01:**
  - `npm run build -w @be/domain`;
  - `node EVIDENCIA/CONSOLIDACION-2026-10-23/ux01/reproducir-ux01.mjs .`;
  - sobre `main` da `ux01/antes.txt`, y sobre #200, `ux01/despues.txt`.
- **La CI de un commit:** `gh run view <corrida> --log`, con los números de la tabla.

## Qué necesita un teléfono, el ambiente remoto o una persona

- **El teléfono, con una candidata nueva.** No existe todavía, y construirla y publicarla necesita tu autorización. Son T1 a T12 del guion. La sustitución de #195 solo se puede ver ahí.
- **El ambiente `test`:**
  - W15, la sesión con recarga en Chrome, Edge y Firefox, se puede hacer hoy: DL-147 ya está en `test`;
  - W1 a W14 esperan la integración.
- **Una persona:** la prueba con profesionales (el protocolo de DL-150). Solo ella dice si DL-153 y DL-154 sirven.

## Fuera de alcance: tres recomendaciones

**1. Que la APK tolere campos nuevos y diga su versión (CMP-01).**
- **Problema.** La APK rechaza cualquier campo nuevo en una respuesta que lee (`z.strictObject`). Para no romper las instaladas, cada cambio va en una operación nueva; este encargo sumó dos. El contrato crece con operaciones casi iguales.
- **Beneficio.** La API podría sumar campos sin romper teléfonos. Con la versión en una cabecera, sabría qué APK siguen en uso y cuándo retirar una operación vieja.
- **Dependencia.** Una APK nueva, porque la tolerancia vive en el teléfono. Las instaladas siguen estrictas, así que #198 hace falta hasta retirarlas. Hay que decidir qué hace la APK con lo que no conoce: ignorarlo y registrarlo.
- **Criterio de decisión.** Antes de la próxima estable, si va a vivir meses en teléfonos de personas. Si las APK se reemplazan seguido, alcanza con las operaciones nuevas.

**2. Arreglar el recorrido intermitente `faltaUnaParte`.**
- **Problema.** Falló en una de las dos corridas de tres ramas:
  - #195, que no toca el website;
  - #200;
  - #205, que en código es igual a `main`.

  En las tres falló la corrida por push y pasó la del PR, que corren a la vez. En la de #200 (40051923458), dos pedidos que no eran la falla simulada no llegaron a la API: no están en su registro. La causa no está confirmada, y apunta a la intercepción de pedidos del recorrido.
- **Beneficio.** Que un recorrido en rojo vuelva a significar algo. Hoy enseña a ignorarlo.
- **Dependencia.** Ninguna: toca solo `test/navegador/`.
- **Criterio de decisión.** Antes de hacer obligatorios los recorridos, o si vuelve a fallar en las próximas corridas.

**3. Que la subida de fotos verifique la ruta firmada antes de leer el cuerpo (SEG-02 de la auditoría del 21/10).**
- **Problema.** API-MED-02 lee hasta 10 MB y recién después verifica la ruta firmada (`apps/api/src/medios/medios.service.ts`, `subir`). Lo hace a propósito, para responder el 404 del contrato y no cortar la conexión. Pero cualquiera, sin cuenta, puede mandar 10 MB a una ruta inventada. Según la auditoría, que no midió el umbral, unas decenas de pedidos a la vez pueden agotar la memoria de la única instancia de la API.
- **Beneficio.** Se cierra el camino sin credenciales para tumbar la API entera, sin cambiar el contrato. Con la ruta inválida, el cuerpo se descarta a medida que llega, sin acumularlo, y la respuesta sigue siendo el 404.
- **Dependencia.** Ninguna de producto: un despliegue de la API, sin APK nueva. Lleva una prueba con 10 MB y una ruta inválida, que no acumule.
- **Criterio de decisión.** Antes de que la dirección de la API circule fuera del equipo, en una demo pública o un piloto con personas. Es un cambio chico.
