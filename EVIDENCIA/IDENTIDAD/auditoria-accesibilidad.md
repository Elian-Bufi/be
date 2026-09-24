# Auditoría automática de accesibilidad del website (RNF-ACC-001)

**Fecha:** 2026-09-24 · **Herramienta:** axe-core 4.13.0 en Chrome, por `scripts/auditoria-accesibilidad.mjs` · **Reglas:** WCAG 2.0, 2.1 y 2.2, niveles A y AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) · **Build:** export estático de producción del website de la rama del tramo, contra la API local, con datos sintéticos · **Criterio de cierre:** cero violaciones críticas o serias.

**Resultado: 42 pantallas, 0 violaciones** de ningún nivel de impacto, 0 errores de consola. Detalle por pantalla en `auditoria-accesibilidad.json`.

## Lo que se recorrió

RNF-ACC-001 nombra los recorridos «acceso, vínculo, Hoy, registro y revisión». En el website están acceso, vínculo y revisión; «Hoy» y «registro» son de la APK (ver `revision-apk.md`). El recorrido se hace como una persona —con los enlaces, porque la sesión vive solo en memoria (DL-012)— y dos veces: a 1280 px y a 390 px.

| Recorrido | Pantallas | Escritorio | 390 px |
|---|---|---|---|
| Acceso | Landing, Crear cuenta, Términos, Iniciar sesión, Cuenta | 0 | 0 |
| Vínculo | Vínculos, Privacidad y consentimientos, Espacio profesional | 0 | 0 |
| Revisión | Workspace del asesorado; Nutrición: Resumen, Plan, Registros, Revisiones; Entrenamiento: Resumen, Plan, Ejecuciones, Revisiones; Antropometría: Evaluaciones, En preparación (con la figura), Evolución; Información | 0 | 0 |

## Lo que axe-core no puede decidir solo

232 nodos quedaron como «incompletos», todos de la regla `color-contrast`: son textos sobre un degradé (la cara pública y el encabezado), donde axe-core no sabe qué color hay detrás de cada letra. Ese contraste lo mide `scripts/contraste.test.cjs` en los extremos del degradé y en su mezcla más clara, y cumple (ver `contraste.md`).

## Control negativo

Para descartar una auditoría que no mira: con una imagen sin texto alternativo inyectada en «Iniciar sesión», la misma cadena reporta `image-alt` con impacto crítico.
