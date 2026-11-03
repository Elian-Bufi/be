# BE — Plataforma integrada de inteligencia en salud

Trabajo final · Analista de Sistemas · Elián Bufi · entrega 2026-10-20 · presentación 2026-11-06. Dirección pasó la entrega del 2026-10-01 al 2026-10-10 el 2026-09-27, y del 2026-10-10 al 2026-10-20 el 2026-10-05.

**Estado al 2026-11-03:**
- `main` está en `8883e88`. Lo último integrado: el 2026-11-02, las dos integraciones de la semana de la presentación (el registro por niveles, el catálogo visual, Administración y las recetas; la sesión por serie, la corrección, el registro rápido y los niveles del escritorio), y el 2026-11-03, las zonas de la demostración revisadas.
- El ambiente `test` sirve `b62ce90`, como dice la API en `/health/live`. Lo que entró después solo cambia evidencia y no redespliega nada.
- La APK de prueba es la `be-apk-0.19.0-candidata.1`, prerelease del 2026-11-03, construida sobre `b62ce90`. La estable sigue siendo la 0.13.2.
- Qué está integrado, desplegado, verificado y validado, y qué falta para cerrar, al 2026-10-28, en
  [`docs/ESTADO-Y-RUTA-DE-CIERRE.md`](docs/ESTADO-Y-RUTA-DE-CIERRE.md). Si cada decisión está integrada, revisado
  contra `main` el 2026-11-03, en [`docs/DEUDA_LEGAJO.md`](docs/DEUDA_LEGAJO.md).

BE se especificó por completo antes de escribir código. **La fuente de verdad es el legajo en [`docs/legajo`](docs/legajo)**. El código implementa lo que el legajo dice, y cada cambio lo demuestra con un bloque `TRACE` y pruebas.

| Ruta | Contenido |
|---|---|
| `apps/api` | API NestJS 11 · monolito modular |
| `apps/web` | Website Next.js 15.5 (export estático) |
| `apps/mobile` | App Expo SDK 57 · APK sin cuota de EAS: construida localmente con Gradle desde la 0.11.1; la 0.19.0-candidata.1, sin firma en GitHub Actions y firmada en la PC de Dirección |
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
| APK candidata en prueba | `be-apk-0.19.0-candidata.1`, prerelease del 2026-11-03: `https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.19.0-candidata.1` |
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
