# BE — Plataforma integrada de inteligencia en salud

Trabajo final · Analista de Sistemas · Elián Bufi · entrega 2026-10-20 · presentación 2026-11-06. Dirección pasó la entrega del 2026-10-01 al 2026-10-10 el 2026-09-27, y del 2026-10-10 al 2026-10-20 el 2026-10-05.

**Estado al 2026-11-06:**
- `main` está en `48cb864`. Lo último integrado:
  - el 2026-11-05, los formularios de inicio (DL-164), que se responden tocando y en los que la persona confirma lo que
    cargó el profesional, y la ronda 2 (DL-165): una parte por pantalla, las ayudas plegadas, la tabla de días y «Mis
    hábitos», los hábitos que la persona decide compartir con sus profesionales;
  - el 2026-11-06, la ronda 2.1 (DL-165): «Tus hábitos» como formulario aparte, que cualquier profesional pide y vuelve a
    pedir, y el pedido de acceso a los hábitos, que la persona responde en «Mis hábitos»; y, desde Entrenamiento, «Antes de
    entrenar» llega completo (DL-165 D-29);
  - el cierre de cada candidata de la APK, con lo que lee congelado (DL-152): la 0.20 y la 0.21 el 2026-11-05, y la 0.22
    el 2026-11-06;
  - el 2026-11-06 también, el comando de curaduría del catálogo (DL-081 y DL-162), con un tiempo propio para sus
    transacciones: con el de Prisma, una carga de varios ejercicios contra la base de `test` se cortaba (P2028).
- El tablero de alta gama (WP-TABLERO-ALTA-GAMA, DL-163) está declarado en `main` desde el 2026-11-06. Dirección ratificó
  el 2026-11-05 sus 21 decisiones y el alcance completo, las partes TB-00 a TB-49: TB-49, «Lo que contó al empezar», se
  sumó con el sí. La etapa A se programa en dos PR en borrador, #240 (el website) y #243 (la API), y todavía no está en
  `main` ni en `test`.
- El ambiente `test` sirve `33dcad9`, como decía la API en `/health/live` el 2026-11-06 a las 11:14 (hora de Argentina).
  Lo que entró después, #232, cambia la API, así que Render la vuelve a desplegar al tomar `main`.
- La APK candidata vigente es la `be-apk-0.22.0-candidata.1`, prerelease del 2026-11-06, construida sobre `67d7f61` (la
  ronda 2.1) con las herramientas del AAB y la versión. La estable sigue siendo la 0.13.2. La prueba de lo que leen las
  APK instaladas (DL-152) sigue leyendo también lo de la 0.20.0-candidata.1 y la 0.21.0-candidata.1.
- Qué está integrado, desplegado, verificado y validado, y qué falta para cerrar, al 2026-10-28, en
  [`docs/ESTADO-Y-RUTA-DE-CIERRE.md`](docs/ESTADO-Y-RUTA-DE-CIERRE.md). Si cada decisión está integrada y ratificada,
  revisado contra `main` el 2026-11-06, en [`docs/DEUDA_LEGAJO.md`](docs/DEUDA_LEGAJO.md).

BE se especificó por completo antes de escribir código. **La fuente de verdad es el legajo en [`docs/legajo`](docs/legajo)**. El código implementa lo que el legajo dice, y cada cambio lo demuestra con un bloque `TRACE` y pruebas.

| Ruta | Contenido |
|---|---|
| `apps/api` | API NestJS 11 · monolito modular |
| `apps/web` | Website Next.js 15.5 (export estático) |
| `apps/mobile` | App Expo SDK 57 · APK sin cuota de EAS: construida localmente con Gradle desde la 0.11.1; desde la 0.19.0-candidata.1, sin firma en GitHub Actions y firmada en la PC de Dirección |
| `packages/domain` | Lo que comparten la API, el website y la APK: tipos y enums del Documento 06, contratos del 09, copy de las pantallas y reglas puras, con sus pruebas |
| `prisma` | Schema y migraciones |
| `test/integration` | Integración contra PostgreSQL 16 real (Testcontainers) |
| `docs/legajo` · `docs/actas` · `docs/mesa` | Legajo canónico, actas y derivaciones MESA (referencia, no canon) |
| `docs/MANIFEST.sha256` | Hashes de la entrega de Dirección: `npm run legajo:verificar` |
| `docs/DEUDA_LEGAJO.md` | Tensiones entre el legajo y la implementación, para decisión de Dirección |
| `DECISIONES_TECNICAS.md` | Versiones elegidas y por qué |
| `docs/DESPLIEGUE.md` | Cómo se despliega y cómo se hace rollback |

## La entrega

| Qué | Dónde |
|---|---|
| Website, en el ambiente `test` | `https://be-web-1ngj.onrender.com` |
| APK vigente (0.13.2) | `https://github.com/Elian-Bufi/be/releases/latest`, que siempre apunta a la última. Cada versión tiene su release permanente `be-apk-x.y.z`; la vigente y sus controles están en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) |
| APK candidata en prueba | `be-apk-0.22.0-candidata.1`, prerelease del 2026-11-06: `https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.22.0-candidata.1` |
| Estado y ruta de cierre, al 2026-10-28 | [`docs/ESTADO-Y-RUTA-DE-CIERRE.md`](docs/ESTADO-Y-RUTA-DE-CIERRE.md) |
| Para entender BE: guía central, cuaderno de datos y plan de estudio | [`docs/guias/ENTENDER-BE/LEEME.md`](docs/guias/ENTENDER-BE/LEEME.md) |
| La demo, paso a paso | [`EVIDENCIA/ENTREGA/GUIA-DEMO.md`](EVIDENCIA/ENTREGA/GUIA-DEMO.md) |
| Qué demuestra cada paquete | `DEFENSA/` (la lectura razonada) y `EVIDENCIA/` (pruebas, capturas y resultados de la CI) |
| Qué quedó afuera y por qué | [`docs/DEUDA_LEGAJO.md`](docs/DEUDA_LEGAJO.md) |
| Qué falta desarrollar | [`docs/QUE-FALTA.md`](docs/QUE-FALTA.md) |
| Buenas prácticas de UX y UI | [`docs/ux/GUIA-UX-UI.md`](docs/ux/GUIA-UX-UI.md) |

## Desarrollo

Requiere Node 22 (`.nvmrc`).

```bash
npm ci
npx prisma generate
npm run typecheck
npm test                  # domain + api (sin base de datos)
npm run test:integration  # requiere Docker
npm run build:api && npm run build:web
npm run audit:prod        # falla con altos o críticos
```

Solo datos sintéticos, en todos los ambientes.
