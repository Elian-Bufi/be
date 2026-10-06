# Estado que se revisó al preparar el paquete

Lectura del 06/10/2026. Esta revisión no modificó el repositorio ni ejecutó BE. El agente que implemente debe volver a comprobar el estado actual.

## GitHub

- PR #147, https://github.com/Elian-Bufi/be/pull/147 : abierto, borrador, rama `wp-nutricion-recetas`, head `de37f62a7ed5b2941e43dabbbcf8ce338a52bff7`, base `apk/navegacion`.
- PR #146, https://github.com/Elian-Bufi/be/pull/146 : abierto, borrador, head `9021c47c1b9a2fe6f28774245e4e95db97e55588`, base main. La metadata de la base mostraba `63cba8e3e7d6a25e4d0332420a2e0726ad1e4caa`.
- El informe de Claude y el cuerpo de #147 declaran CI verde y 78 controles locales. No se verificaron de nuevo esos recorridos desde este paquete; las consultas disponibles de estados no devolvieron las ejecuciones de Actions. No convertir esa ausencia en una confirmación independiente de CI.
- #146 advierte que un merge puede disparar despliegue de API/web. Por eso la corrección de seguridad dirigida a main se prepara en un PR, sin integrarla.
- No se construyó, publicó, integró ni desplegó nada al preparar este paquete.

## Fuentes del repositorio leídas

Referencia de lectura: head de #147 indicado arriba.

- `docs/DEUDA_LEGAJO.md`, especialmente DL-120 y DL-121.
- `docs/paquetes/WP-NUTRICION-RECETAS.md`.
- `docs/propuestas/INSUMOS-EXPLORACION-VISUAL_2026-10-05.md`.
- Tramos de `packages/domain/src/contratos-entrenamiento.ts`: prescripción, catálogo y ejecución.

Enlaces de ejemplo reproducibles:

- https://github.com/Elian-Bufi/be/blob/de37f62a7ed5b2941e43dabbbcf8ce338a52bff7/packages/domain/src/contratos-entrenamiento.ts
- https://github.com/Elian-Bufi/be/blob/de37f62a7ed5b2941e43dabbbcf8ce338a52bff7/docs/DEUDA_LEGAJO.md
- https://github.com/Elian-Bufi/be/blob/de37f62a7ed5b2941e43dabbbcf8ce338a52bff7/docs/paquetes/WP-NUTRICION-RECETAS.md

## Hallazgos para no rehacer ni romper lo existente

| Tema | Lo observado | Consecuencia |
|---|---|---|
| Repeticiones prescritas | Exactas o rango por serie | Reutilizar; no sustituir por un valor único del ejercicio |
| RIR realizado | Ya existe nullable, número 0–20, decimal permitido | No duplicar campo ni reducir el dominio a chips 0–5 |
| Carga/repeticiones realizadas | Campos nullable; cero explícito admitido en los casos definidos | Vacío no equivale a cero; mantener semántica vigente |
| Intensidad y carga sugerida | De la prescripción completa en lo revisado | Delta mínimo para objetivos efectivos por serie |
| Criterio intensidad | PERCENT_RM o RIR; carga sugerida complementaria | No introducir RPE o carga como criterio alternativo sin encargo |
| Draft y ejecución | Recursos separados y confirmación explícita | Serie guardada en borrador no equivale a ejecución final registrada |
| Granularidad | Serie o ejercicio/sesión | No fabricar series al abrir un registro resumido |
| Occurrence y snapshots | Identidad opaca emitida por servidor; plan versionado | No construir occurrenceId ni reinterpretar historia desde el plan actual |
| Recursos didácticos | Identidad/versiones/autoría/licencia de IMAGE; resolver pendiente en la revisión previa | Reutilizar medios con propósito y permisos adecuados, no una URL pegada |
| Plan Hoy | Sesiones del plan; no asignación automática a días | No inventar calendario semanal |
| Bloques | Sesiones/microciclos del plan | No confundir con superseries/circuitos dentro de la sesión |
| Tiempos | No se encontraron campos de medición estructurada en lo revisado | Nuevo delta explícito, no números en notas libres |

## Nutrición: pendientes relevantes del informe recibido

- PostgreSQL para imágenes está implementado detrás de una interfaz y se probó reinicio local; el proveedor remoto y su vencimiento siguen siendo otra comprobación.
- EVIDENCIA_VISUAL audita acceso sin crear un acto registrable. Debe respetarse el contrato real de permisos/finalidad y no inventar consentimientos.
- Comida diferente ocupa su contexto de comida/fecha, pero sigue fuera de prescripción en el contraste. Aclarar UI sin falsear cumplimiento.
- Arreglo reportado `source-map-js` 1.2.2 en la rama de Nutrición, pendiente llevar de forma mínima a otras ramas si lo necesitan. Verificar auditoría vigente.
- Cámara/galería, gestos y comportamiento nativo no se probaron en el teléfono. Se necesitará una candidata futura, fuera de esta ejecución autónoma.
- Base local detenida por memoria, datos conservados: no es evidencia de pérdida de datos ni motivo para recrearla.

Este documento es una ayuda de continuidad, no una certificación de todo el legajo ni de la seguridad del producto.
