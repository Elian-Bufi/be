# Evidencia · identidad visual y accesibilidad

Tramo definido en `docs/paquetes/WP-IDENTIDAD-VISUAL.md`, cerrado el 2026-09-24 con la versión 0.9.0 (PRs #73 a #75), más un ajuste posterior de la toma antropométrica (PR #76). Defensa en `DEFENSA/IDENTIDAD.md`; nota de MESA en `docs/mesa/MESA_01/ESTADO_PUNTOS_5_11_IDENTIDAD.md`.

| Archivo | Qué demuestra | Garantía |
|---|---|---|
| `contraste.md` | La relación de contraste de cada par de colores que usan las pantallas, en los tres temas, calculada desde los tokens reales; y los dos defectos de WCAG 1.4.11 que había en `main` | RNF-ACC-001 («contraste suficiente») |
| `auditoria-accesibilidad.md` y `.json` | axe-core 4.13.0 sobre 21 pantallas núcleo del website, en escritorio y a 390 px: **cero violaciones** de WCAG 2.0, 2.1 y 2.2 A y AA | RNF-ACC-001 («auditoría automática»), RNF-ACC-003 (sin desborde en la superficie móvil) |
| `revision-apk.md` | La revisión manual de la APK, donde no hay un auditor automático equivalente | RNF-ACC-001 («revisión manual») |
| `verificacion-figura.md` | La toma antropométrica sobre la figura, recorrida en Chrome: la figura ubica y no califica; y el cambio de protocolo con mediciones ya cargadas, sin pérdidas ni unidades escondidas (PR #76) | DL-073; RF-048; B10-07 §17 |
| `resultados-integracion-fd08380.json` y `.md` | La suite de integración de la CI de `main` en el commit de cierre `fd08380`: **427/427** en 23 suites, contra PostgreSQL 16 real, con la migración del protocolo de pliegues y perímetros | 11A por ID de prueba |
| `ci-verificar-fd08380.log` | El job `verificar` de esa corrida: typecheck, pruebas unitarias del dominio y de la API, guardias de copy y de contraste, build y auditoría de dependencias | RNF-ACC-001 (la prueba de contraste corre en CI) |
| `verificacion-urls.txt` | El despliegue de `test` en 0.9.0 y `fd08380`, verificado después del merge: readiness con las migraciones aplicadas, cabeceras de seguridad y la landing nueva | 07 §37 |
| `apk.txt` | La APK 0.9.0: build de EAS, commit, SHA-256, la configuración embebida (tema oscuro), la búsqueda de secretos en cero y la descarga anónima del release permanente | 07 §34, RNF-PORT-001, TEST-APK-008, 08 §32 |

## Cómo se reproduce

- **Contraste:** `npm test` (incluye `scripts/contraste.test.cjs`). La tabla de `contraste.md` sale de los mismos pares.
- **Auditoría:** con la API y el website levantados y una cuenta profesional sintética vinculada a un asesorado,
  `BE_WEB_URL=… BE_AUDITORIA_CUENTAS=… node scripts/auditoria-accesibilidad.mjs <salida>`. Sale con código 1 si hay una violación crítica o seria. Se corrió sobre el **export estático de producción** (`npm run build:web`), no sobre `next dev`.
- **Control negativo:** la misma cadena, con una imagen sin texto alternativo inyectada en «Iniciar sesión», reporta `image-alt` (crítica). La auditoría detecta lo que tiene que detectar.

## Lo que axe-core deja para revisión manual

axe-core no puede medir el contraste de un texto sobre un degradé y lo deja como «incompleto» (232 nodos, todos `color-contrast`): son los textos de la cara pública y del encabezado, que se pintan sobre degradés. Esa medición la hace `scripts/contraste.test.cjs`, en los extremos de cada degradé y en la mezcla más clara del velo azul (prueba «el texto de la cara pública se lee en todo el degradé»).

## Lo que no está acá

- **Las capturas del website** en `test` están en `EVIDENCIA/ENTREGA/capturas-web/`: se tomaron al cerrar la entrega, con el ajuste de la toma ya desplegado, y muestran este tramo y la consolidación.
- **Las capturas de la APK 0.9.0** las toma Dirección en su teléfono, con las demás, por su decisión del 2026-09-22. Con ellas va la prueba con TalkBack y la letra del sistema al máximo en un Android físico.
