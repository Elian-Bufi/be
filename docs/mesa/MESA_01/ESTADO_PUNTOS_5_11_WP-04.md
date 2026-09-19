# MESA-01 — estado de DV-11 y de DV-05 tras WP-04

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-20 · **Paquete:** WP-04 «Circuito nutricional» · **Fuente de exigencia:** `Entregables.pdf` de la escuela. El punto 11 es DV-11 en la matriz: «URL a una DEMO que muestre funcionalidades de APK y Website».

## Punto 11 — Demo de APK y Website

### Qué pide la matriz y qué hay ahora

La matriz lista seis elementos para cerrar DV-11:

| Elemento | Estado tras WP-04 | Dónde |
|---|---|---|
| Aplicación ejecutable | ✅ Website y API 0.4.0 en `test`, y APK 0.4.0 en un release permanente. El circuito nutricional funciona de punta a punta: el profesional en el website y el asesorado en el APK | `EVIDENCIA/WP-04/verificacion-urls.txt` · `apk.txt` |
| Usuarios demo | ✅ DEMO-PN (Nutrición), DEMO-PT (Entrenamiento), DEMO-A01 y DEMO-A02 (asesorados). Contraseñas fuera del repositorio | `ESTADO_PUNTOS_5_14_WP-03.md` |
| Datos sintéticos | ✅ Correos `@example.invalid`. Catálogo de 40 alimentos con valores sintéticos de demostración, rotulados así en pantalla | migración `20260920100000_circuito_nutricional` |
| Guion | ✅ `EVIDENCIA/WP-04/GUIA-DEMO.md`: seis partes, con la cuenta, los datos a cargar y lo que tiene que verse en cada paso | — |
| Grabación | **No se hizo**, por instrucción de Dirección para WP-04. En su lugar: capturas del estado final de cada paso (19 del website, automatizadas contra `test`) y las del APK en el teléfono de Dirección | `EVIDENCIA/WP-04/web/` |
| Hosting del video o link | La demo se muestra en vivo sobre las URLs de `test`, siguiendo la guía. No hay link a un video | — |

### URLs de la demo

| Recurso | URL |
|---|---|
| Website | `https://be-web-1ngj.onrender.com` |
| APK 0.4.0 | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.4.0/be-0.4.0-7b21cc7.apk` (SHA-256 `446a60c7…20a99b`, no expira) |
| API (salud) | `https://be-api-hndp.onrender.com/health/ready` |

### Qué muestra la demo

Es el primer circuito completo de salud:
1. La profesional **evalúa**.
2. **Fija el objetivo**, con fundamento y sin cálculo de BE.
3. **Planifica y activa**.
4. El asesorado **ve la versión activada** en el APK y **registra** lo que comió, dentro y fuera del plan.
5. La profesional **revisa** con un contraste descriptivo, sin puntaje, y **aplica** la continuidad.
6. Corrige el plan con una **versión sucesora**. La anterior se conserva.
7. Un profesional de otro alcance **no ve nada**.

### Estado de DV-11

| | Antes de WP-04 | Ahora |
|---|---|---|
| **DV-11** | Bloqueado por runtime (WP-01: URLs con placeholder) | **Demostrable en vivo, con guía.** La grabación no se hizo, por decisión de Dirección. Si la mesa exige un video, se graba siguiendo `GUIA-DEMO.md` sin cambiar nada del producto |

Los dominios de antropometría (WP-05) y entrenamiento (WP-06) van a sumar partes a la demo. La guía está pensada para crecer por partes.

## Punto 5 — Casos de prueba: los adversariales de DL-042

| # | Caso | Estado en CI | Estado en `test` (2026-09-19, API 0.4.0 `6e8efc4`) |
|---|---|---|---|
| 8 | Editar un plan activado: falla en las tres capas; la corrección es una sucesora y la anterior queda intacta | PASS (D1, D2, `maquinas-wp04.int-spec.ts`) | **PASA** |
| 7 | (variante nutricional) Un día sin registro es «sin dato», nunca cero ni incumplimiento | PASS (E2E-04, INV-06-13) | **PASA** |
| 6 | Anular dos veces una medición | — | asignado a **WP-05** (antropometría) |
| 10 | Borrador de evaluación de otro profesional | — | asignado a **WP-05** (antropometría) |
| 7 | (variante de mediciones) Evolución con un hueco de datos | — | asignado a **WP-05** |

Además, WP-04 corre en vivo el cruce de alcance (D9: 18 operaciones con el mismo 404 que lo inexistente) y el control de cero puntaje sobre todas las respuestas de la corrida. Los cuatro pasan: `EVIDENCIA/WP-04/adversariales-test.json`.

Con WP-03, **8 de los 10 adversariales de DV-05** son ejecutables en vivo: 1, 2, 3, 4, 5, 7 (nutricional), 8 y 9.

### Casos del catálogo que WP-04 ejecuta

CI del PR #26 (`9ed2305`): integración **240/240** en PostgreSQL 16 real. El detalle por ID está en `EVIDENCIA/WP-04/resultados-integracion-*.md`, que agrupa cada prueba por el primer ID de su título. Los TEST-RF y TEST-NUT se verifican como pasos de E2E-04: cada paso está marcado con su ID en `test/integration/nutricion.int-spec.ts`.

| Caso | Oráculo | Estado |
|---|---|---|
| **E2E-04** | Evaluar, fijar objetivo, planificar, activar, ver en «Hoy», registrar, revisar y aplicar | PASS |
| **TEST-RF-027, 029 a 035** | Catálogo, objetivo, borrador, activación atómica, vista del asesorado, registro, contraste y revisión | PASS |
| **TEST-NUT-001 a 006** | Validar no activa, prescripto ≠ registrado, descripción original conservada, fuera del plan, sin dato ≠ incumplimiento, componentes de la revisión | PASS |
| **TEST-PRJ-009** | Cero puntaje en schemas, OpenAPI, respuestas y copy | PASS |
| **TEST-RNF-SEC-006** | Otro alcance ≡ inexistente | PASS |
| **TEST-AUTH-003 (completo), 004, 005** | Sin A3 no hay plan; revocar B2 o A3 corta en la operación siguiente | PASS |
| **TEST-RNF-REC-002** | Un reintento no duplica ingesta, activación ni aplicación | PASS |
| **Reabrir una versión activada falla** | Oráculo derivado (DL-027): dominio, API y base | PASS |
