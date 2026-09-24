# BE — Plataforma integrada de inteligencia en salud

Trabajo final · Analista de Sistemas · Elián Bufi · entrega 2026-10-01.

BE se especificó por completo antes de escribir código. **La fuente de verdad es el legajo en [`docs/legajo`](docs/legajo)**. El código implementa lo que el legajo dice, y cada cambio lo demuestra con un bloque `TRACE` y pruebas.

| Ruta | Contenido |
|---|---|
| `apps/api` | API NestJS 11 · monolito modular |
| `apps/web` | Website Next.js 15.5 (export estático) |
| `apps/mobile` | App Expo SDK 57 · APK por EAS |
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
| APK 0.9.0 | `https://github.com/Elian-Bufi/be/releases/latest` (release permanente `be-apk-0.9.0`) |
| La demo, paso a paso | [`EVIDENCIA/ENTREGA/GUIA-DEMO.md`](EVIDENCIA/ENTREGA/GUIA-DEMO.md) |
| Qué demuestra cada paquete | `DEFENSA/` (la lectura razonada) y `EVIDENCIA/` (pruebas, capturas y resultados de la CI) |
| Qué quedó afuera y por qué | [`docs/DEUDA_LEGAJO.md`](docs/DEUDA_LEGAJO.md) |

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
