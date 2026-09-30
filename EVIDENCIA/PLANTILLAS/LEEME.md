# Evidencia · Plantillas del profesional (PF-09; DL-108) — entrenamiento

Decisiones de Elián del 2026-09-30 sobre la ficha `docs/propuestas/PLANTILLAS-DEL-PROFESIONAL_ficha.md` (D-1 a D-7), registradas como DL-108. Rama `feat/plantillas-de-entrenamiento`, sobre `main` (`53cc70e`). Para auditoría, **sin integrar, sin desplegar y sin APK**.

## Qué puede hacer el profesional

1. **Guardar como plantilla** una versión de plan (la activa, desde «Plan activo»; o el borrador tal como está, desde el editor). El diálogo dice qué copia y qué no, tiene el interruptor de cargas **apagado** (D-2) y lista **cada nota de texto libre** (propósito de bloque y microciclo, instrucciones de sesión, nota de prescripción, nota por serie) con «Vaciar» por cada una (D-3). Sin nombre no se puede guardar.
2. **Empezar desde una plantilla** al crear un plan (con o sin plan activo): el borrador nace de la persona, con su objetivo (D-5), y el editor dice «Creada desde la plantilla «…», versión N. El plan es de esta persona: la plantilla no cambia si lo editás».
3. **Mis plantillas** (en la navegación profesional): lista con estado, versión, sesiones, cargas, origen y fecha; filtro por estado; detalle en solo lectura con los nombres vigentes de los ejercicios; renombrar y describir; **archivar** y reactivar. Una archivada no se aplica ni se versiona.

Solo el profesional que la creó la ve y la aplica (D-1). Si deja BE, quedan inactivas; los planes creados no dependen de ellas (D-4).

## Cómo está hecho

- **API** (`apps/api/src/entrenamiento/plantillas.service.ts`, API-TPL-01..05): la misma autorización que el catálogo propio (profesional de Entrenamiento verificado y habilitado; lo ajeno 404 neutral); la estructura se valida como un plan y se guarda tal como entra (sin cargas salvo pedido); versiones inmutables (historia por adición en la base); nombre único por profesional; `expectedVersion`. `POST advisees/{id}/training/plans` con `fromTemplateVersionId` (API-TRN-07) normaliza la estructura como cualquier plan y registra el origen; `templateOrigin` se expone solo en lecturas del profesional, nunca al titular (la APK instalada valida con esquemas estrictos).
- **Dominio:** `contratos-plantillas.ts`, `plantillas-de-plan.ts` (notas a confirmar y vaciar), `copy-plantillas.ts`.
- **Website:** `apps/web/src/app/pro/advisees/training/plantillas.tsx` (diálogo, «Empezar desde una plantilla», nota de origen), `plan.tsx` y `editor.tsx` (botones), `apps/web/src/app/pro/templates/` («Mis plantillas»), enlace en la navegación profesional.
- **Sin APK.** Nutrición queda para el PR-3 con el mismo patrón.

## Pruebas

| Prueba | Resultado |
|---|---|
| Integración `plantillas.int-spec.ts` (PostgreSQL 16 local, por los flujos reales): guardar sin y con cargas, notas conservadas, sin datos del asesorado, lista y detalle con nombres de ejercicios; nombre único (mayúsculas y acentos), ejercicio inexistente 422, campo desconocido 400; ajeno 404 en lectura, versión y edición; asesorado y nutricionista 403; versión nueva con conflicto, inmutabilidad, nombre tomado 409, archivar, archivada 422, filtro; aplicar: borrador con origen, ids de nodo estables y únicos, carga y nota del molde, origen visible para el profesional y no para el titular, la plantilla no ata al plan; fuentes excluyentes, ajena, inexistente, archivada | **6/6** |
| Contrato (TEST-CT) con las cinco operaciones observadas | 12/12 |
| Integración de entrenamiento (126), contexto (21), comparación (12): sin cambios de conducta | ✅ |
| Dominio (`plantillas-de-plan.test.ts`: notas en orden con lugar y rótulo, vaciar sin mutar, sin cargas, nombre normalizado, copy sin términos prohibidos) | 351/351 |
| Recorrido web local, escritorio 1280 px y móvil 390 px (`recorrido.mjs`, contra la base que dejó la prueba de integración) | **12/12 y 12/12** |
| Typecheck API y web · OpenAPI regenerado y verificado · legajo íntegro | ✅ |

### Recorrido web local

| Control | Escritorio | Móvil |
|---|---|---|
| El plan activo ofrece «Guardar como plantilla» y, sin borrador, «Empezar desde una plantilla» (primera corrida) · con borrador, el editor muestra la nota de origen y ofrece «Guardar como plantilla» | ✅ | ✅ |
| El diálogo explica qué copia, cargas apagadas, notas con «Vaciar» | ✅ | ✅ |
| «Vaciar» saca una nota (una por una) | ✅ | ✅ |
| Sin nombre, no se puede guardar | ✅ | ✅ |
| Guardada: aviso y diálogo cerrado | ✅ | ✅ |
| El selector se recarga con la plantilla recién guardada (defecto encontrado y corregido en la primera corrida) | ✅ | — |
| El borrador nace de la plantilla, con «Creada desde la plantilla «…», versión 1» | ✅ | — |
| Nada califica (sin «óptimo», «recomendado», «puntaje», «cumplimiento») | ✅ | ✅ |
| «Mis plantillas»: lista con estado, versión, sesiones, cargas y origen | ✅ | ✅ |
| Detalle con los nombres vigentes de los ejercicios y series con repeticiones (defecto de carga en el render, encontrado y corregido) | ✅ | ✅ |
| Archivar: aviso y estado «Archivada»; el filtro por activas la deja fuera | ✅ | ✅ |
| Sin desplazamiento horizontal; sin errores de consola | ✅ | ✅ |

Capturas: `01-dialogo-guardar-plantilla.png`, `02-borrador-desde-plantilla.png`, `03-mis-plantillas-detalle.png`, `movil-03-mis-plantillas-detalle.png`.

## Límites

- Un ejercicio del catálogo no disponible al aplicar responde 422 con el detalle (como al guardar un plan), en vez de crear el borrador señalado: desvío documentado de TPL-CU-04.
- Los identificadores de nodo que la plantilla declara se conservan en el plan (REG-06-111): son por plan, no «nuevos».
- La estructura de una plantilla no se edita en «Mis plantillas»: se guarda una versión nueva desde un plan, que es donde se trabaja.
- Solo entrenamiento. Teclado en PC verificado por automatización, no por Dirección. No validado por Dirección, no desplegado.
