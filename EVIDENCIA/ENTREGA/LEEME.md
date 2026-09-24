# Evidencia · cierre de la entrega

El estado que se entrega el 2026-10-01: qué está desplegado, con qué garantías y qué queda en manos de Dirección. Es el paso 4 del plan que Dirección eligió el 2026-09-22 («consolidar y pulir»). No agrega RF ni operaciones.

## Lo entregado

| Qué | Dónde | Versión y commit |
|---|---|---|
| Website | `https://be-web-1ngj.onrender.com` | 0.9.0 · `796a5fe` |
| API | `https://be-api-hndp.onrender.com` (`/health/ready`) | 0.9.0 · `15d7781` |
| APK | release permanente `be-apk-0.9.0` → `be-0.9.0-fd08380.apk`, SHA-256 `021af7b1a21f5ac90b342000f5f5f23e0f818a0256d345d5e033c6cf82e4551d` | 0.9.0 · `fd08380` |

**Por qué hay tres commits.** Los dos cambios posteriores a `fd08380` (PR #76 y #77) son del website y de una función pura del dominio que ni la API ni la APK usan. No tocan la API, la APK, el esquema ni el contrato: `docs/api/openapi.json` es idéntico. Render redespliega cada servicio solo cuando cambian sus archivos (`buildFilter` de `render.yaml`):
- el #77 tocó solo el website, así que la API sigue en `15d7781`, con el mismo código de API que `796a5fe`;
- una APK nueva sería el mismo producto con otro número.

`verificacion-urls.txt` muestra la diferencia archivo por archivo.

## Archivos

| Archivo | Qué demuestra |
|---|---|
| `GUIA-DEMO.md` | La demo para el tribunal (DV-11), paso a paso, con qué mostrar en cada uno y qué garantía del legajo sostiene |
| `capturas-web/` | El website en `test`, recorrido con Chrome por puppeteer con las cuentas demo. `recorrido.json` guarda los pasos, lo observado en cada pantalla y las llamadas a la API: 31, ninguna 4xx ni 5xx. Todas las pantallas son de DEMO-A01, como en la guía. En la figura se escribieron dos valores **sin guardar**: el recorrido no deja nada nuevo en `test` |
| `resultados-integracion-796a5fe.json` y `.md` | La suite de integración de la CI de `main` en el último commit: **427/427** en 23 suites, 133 identificadores del 11A, contra PostgreSQL 16 real |
| `ci-verificar-796a5fe.log` | El job `verificar` de esa corrida: typecheck, pruebas del dominio (259/259), guardias de copy y de contraste (14/14), pruebas unitarias de la API (33/33), build y auditoría de dependencias |
| `verificacion-urls.txt` | El despliegue de `test` tal como se entrega: readiness con las migraciones aplicadas, cabeceras de seguridad, CORS solo para el website, la URL de la API en el build (DL-030) y la descarga anónima de la APK con su SHA-256 |

## Las capturas del website

| Captura | Qué muestra |
|---|---|
| `web-01-landing` | La cara pública: qué es BE, qué hace por cada persona y lo que no hace |
| `web-02-acceso` | Iniciar sesión, en el tema oscuro |
| `web-03-espacio-profesional` | Una tarjeta por asesorado, con cada alcance y su estado |
| `web-04-workspace` | Las tarjetas de dominio con su resumen factual, sin puntaje ni semáforo, y la vista parcial que no dice por qué |
| `web-05-nutricion-registros` | Lo prescripto y lo registrado por día. Los días y las comidas sin dato dicen «Sin registro» (17 veces en la pantalla), nunca un cero |
| `web-06-figura` y `web-06-figura-detalle` | La toma sobre la figura: un pliegue de 8,5 mm y uno de 31 mm con un único relleno, medido en la pantalla (`rgb(23, 69, 154)` para los dos). La figura ubica, no califica |
| `web-07-landing-celular` | La landing a 390 px, sin desborde |

## Lo que se encontró y se corrigió al cerrar

La revisión de cierre recorrió el estado desplegado como lo va a recorrer el tribunal. Encontró cuatro defectos y los corrigió:

1. **El cambio de protocolo en la toma antropométrica** (PR #76). Una medición cargada fuera del protocolo no pasaba a su campo, y una medición en otra unidad podía quedar escondida detrás de la unidad del campo. Ahora hay una sola regla de dominio, con pruebas, que aplica B10-07 §17. Detalle en `EVIDENCIA/IDENTIDAD/verificacion-figura.md`.
2. **«Guardado por última vez» mostraba la hora de la pantalla** (PR #77, defecto de WP-05). Ahora dice la hora del último guardado según la API (B10-07 §8.1).
3. **Faltaba `EVIDENCIA/CONSOLIDACION/`**, que `docs/paquetes/WP-CONSOLIDACION.md` citaba: está en este cierre.
4. **`docs/DESPLIEGUE.md` presentaba como vigente la APK 0.3.0.** Ahora dice la 0.9.0 y el historial completo, y avisa cuándo vence la base de `test`.

## Lo que queda en manos de Dirección

- **Las capturas de la APK** en el teléfono (WP-07 y 0.9.0), con la prueba de TalkBack y la letra del sistema al máximo que pide la revisión manual de RNF-ACC-001.
- **WP-08** (PR #72, Open Food Facts y wger): implementado, revisado y al día con `main`. Espera que Dirección confirme que el ACTA-DIR-034 lo cubre. Integrarlo pide una APK nueva.
- **Las deudas abiertas** de `docs/DEUDA_LEGAJO.md`, cada una con sus opciones.

## Límites del ambiente

- La API del plan gratuito duerme a los 15 minutos: abrir `/health/ready` unos minutos antes de la demo.
- **La base de `test` vence cerca del 2026-10-18** (30 días desde su creación, más 14 de gracia). Si la defensa es después, ver `docs/DESPLIEGUE.md` → «Límites del plan gratuito».
- El artefacto de EAS de la APK vence el 2026-10-08; el release de GitHub es permanente.

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ningún archivo de esta carpeta.
