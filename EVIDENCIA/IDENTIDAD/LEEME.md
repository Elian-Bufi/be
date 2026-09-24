# Evidencia · identidad visual y accesibilidad

Tramo definido en `docs/paquetes/WP-IDENTIDAD-VISUAL.md`, ejecutado el 2026-09-24. Defensa en `DEFENSA/IDENTIDAD.md`.

| Archivo | Qué demuestra | Garantía |
|---|---|---|
| `contraste.md` | La relación de contraste de cada par de colores que usan las pantallas, en los tres temas, calculada desde los tokens reales; y los dos defectos de WCAG 1.4.11 que había en `main` | RNF-ACC-001 («contraste suficiente») |
| `auditoria-accesibilidad.md` y `.json` | axe-core 4.13.0 sobre 21 pantallas núcleo del website, en escritorio y a 390 px: **cero violaciones** de WCAG 2.0, 2.1 y 2.2 A y AA | RNF-ACC-001 («auditoría automática»), RNF-ACC-003 (sin desborde en la superficie móvil) |
| `revision-apk.md` | La revisión manual de la APK, donde no hay un auditor automático equivalente | RNF-ACC-001 («revisión manual») |
| `verificacion-figura.md` | La toma antropométrica sobre la figura, recorrida en Chrome: la figura ubica y no califica | DL-073; RF-048 |

## Cómo se reproduce

- **Contraste:** `npm test` (incluye `scripts/contraste.test.cjs`). La tabla de `contraste.md` sale de los mismos pares.
- **Auditoría:** con la API y el website levantados y una cuenta profesional sintética vinculada a un asesorado,
  `BE_WEB_URL=… BE_AUDITORIA_CUENTAS=… node scripts/auditoria-accesibilidad.mjs <salida>`. Sale con código 1 si hay una violación crítica o seria. Se corrió sobre el **export estático de producción** (`npm run build:web`), no sobre `next dev`.
- **Control negativo:** la misma cadena, con una imagen sin texto alternativo inyectada en «Iniciar sesión», reporta `image-alt` (crítica). La auditoría detecta lo que tiene que detectar.

## Lo que axe-core deja para revisión manual

axe-core no puede medir el contraste de un texto sobre un degradé y lo deja como «incompleto» (232 nodos, todos `color-contrast`): son los textos de la cara pública y del encabezado, que se pintan sobre degradés. Esa medición la hace `scripts/contraste.test.cjs`, en los extremos de cada degradé y en la mezcla más clara del velo azul (prueba «el texto de la cara pública se lee en todo el degradé»).

## Lo que no está acá

Las capturas de pantalla se toman al final de la entrega, con las demás, por decisión de Dirección del 2026-09-22. La prueba con TalkBack y la letra del sistema al máximo en un Android físico va con las capturas de la APK.
