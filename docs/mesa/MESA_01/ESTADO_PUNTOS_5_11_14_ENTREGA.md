# MESA-01 — estado de DV-05 y de DV-11 a DV-14 al cierre de la entrega

> Nota de actualización del ejecutor técnico. **No modifica** la matriz, el informe del 2026-09-10 ni `docs/mesa/MESA_02/DV-05/DV-05_CASOS_DE_PRUEBA.csv`: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección.

**Fecha:** 2026-09-24 · **Estado que se entrega:** website 0.9.0 · `796a5fe`, API 0.9.0 · `15d7781`, APK 0.9.0 · `fd08380`. Por qué hay tres commits: `EVIDENCIA/ENTREGA/LEEME.md`. · **Fuente de exigencia:** `Entregables.pdf` de la escuela (no versionado: ver `docs/fuente_escolar/LEEME.md`).

Esta nota reemplaza, **para las láminas**, las URLs de `ESTADO_PUNTOS_12_13_WP-01.md`. Aquella nota daba la APK 0.1.0, un placeholder sin funcionalidad, y queda como registro de su momento.

## Puntos 12 y 13 — las URLs de las láminas

| Punto | Recurso | URL |
|---|---|---|
| **12** | APK | `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.9.0/be-0.9.0-fd08380.apk`. Release permanente, 69,7 MB, SHA-256 `021af7b1a21f5ac90b342000f5f5f23e0f818a0256d345d5e033c6cf82e4551d` |
| **12** | Código fuente de la APK | `https://github.com/Elian-Bufi/be` (`apps/mobile`), público |
| **13** | Website | `https://be-web-1ngj.onrender.com` |
| **13** | Código fuente del website | `https://github.com/Elian-Bufi/be` (`apps/web`) |

**Cuál poner en la lámina 12.** Hay dos opciones:
- **La URL fija de la 0.9.0**, si la lámina tiene que coincidir byte a byte con lo que se evaluó.
- **`https://github.com/Elian-Bufi/be/releases/latest`**, si tiene que seguir a la última APK. La landing usa esta.

Hoy las dos llevan al mismo archivo. Si WP-08 se integra con una APK nueva, solo la segunda la sigue.

La descarga sin credenciales y el SHA-256 se verificaron en vivo: `EVIDENCIA/ENTREGA/verificacion-urls.txt`.

## Punto 11 — la demo

La URL de la demo es la del website, con la APK de arriba. El recorrido para el tribunal está en `EVIDENCIA/ENTREGA/GUIA-DEMO.md`, en unos 22 minutos:
1. la cara pública;
2. el espacio profesional;
3. la toma sobre la figura;
4. la información pertinente;
5. el asesorado en la APK;
6. cómo se sabe que es cierto.

Las capturas del website en `test` están en `EVIDENCIA/ENTREGA/capturas-web/`. Las de la APK 0.9.1 (`0698868`), tomadas en un Android real con DEMO-A01, están en `EVIDENCIA/ENTREGA/capturas-apk/`.

## Punto 14 — usuarios por rol

| Alias | Rol | Superficie | Estado verificado el 2026-09-24 |
|---|---|---|---|
| **DEMO-A01** | Asesorado | APK | Inicia sesión. Vínculo aceptado y consentimiento activo con DEMO-PN, DEMO-PT y DEMO-PA. En el website aparece como «Asesorado · c36743» |
| **DEMO-A02** | Asesorado | APK | Inicia sesión |
| **DEMO-PN** | Profesional sanitario: Nutrición, con la capacidad antropométrica | Website | Inicia sesión; 23 vínculos |
| **DEMO-PT** | Profesional no sanitario: Entrenamiento | Website | Inicia sesión; 12 vínculos |
| **DEMO-PA** | Profesional con la capacidad antropométrica, sin especialidad (06 §8.10) | Website | Inicia sesión; 18 vínculos |

Los correos y las contraseñas van en la lámina desde `.env.cuentas-demo`, en el clon local de Dirección. No están en el repositorio. Los correos de A01 y A02 ya son públicos en `EVIDENCIA/WP-02/cuentas-demo.txt`.

**El rol administrador no existe en la entrega.** Ningún paquete lo implementó. La verificación y habilitación de los profesionales la hace un servicio interno al arrancar la API (DL-036), sin pantalla ni endpoint. Si la lámina pide «diferentes roles», los que hay son asesorado y profesional, con tres perfiles profesionales distintos.

## Punto 5 — DV-05: lo que la CI prueba con el ID del catálogo

Se contó, sobre la CI de `main` en `796a5fe`, cuántas pruebas **nombran en su título** cada uno de los 59 casos del catálogo. Entran las 427 de integración y las 273 unitarias del dominio y de las guardias. Las 33 unitarias de la API no dejan su título en el log, así que no se cuentan. El cálculo se rehace con `scripts/cobertura-dv05.cjs`, y el resultado caso por caso está en `EVIDENCIA/ENTREGA/cobertura-dv05.json`.

| Familia | Casos nombrados por una prueba que pasa | Sin una prueba que los nombre |
|---|---|---|
| TEST-RF | 10 de 25 | RF-006, 007, 010, 012, 026, 032, 042, 047, 048, 049, 050, 054, 059, 070, 071 |
| TEST-AUTH | 12 de 13 | AUTH-010 |
| TEST-DOM | 3 de 9 | DOM-001, 003, 004, 005, 006, 007 |
| TEST-CAL | 4 de 4 | — |
| TEST-FRM | 1 de 4 | FRM-001, 002, 004 |
| TEST-ANT | 3 de 4 | ANT-002 |
| **Total** | **33 de 59** (P0: 25 de 47 · P1: 8 de 12) · **ninguno falla** | 26 |

**Cómo leer los 26.** «Sin una prueba que los nombre» no quiere decir «sin probar». Varios se ejercitan con pruebas que llevan otro identificador del 11A:
- los E2E de cada paquete, como E2E-04 y E2E-05;
- las pruebas por invariante;
- las de antropometría, que usan TEST-ANT en lugar de TEST-RF-047 a 050.

Otros se verificaron en vivo, según la nota de cada paquete.

Lo que el conteo muestra es que esos 26 no tienen, en la CI, **una prueba escrita contra su oráculo del catálogo**. Mapearlos uno por uno queda pendiente para la mesa.

Los 10 casos adversariales de DV-05 son ejecutables en vivo desde WP-05: `ESTADO_PUNTOS_5_11_WP-05.md`.
