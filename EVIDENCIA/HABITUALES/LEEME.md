# Evidencia · «Mis habituales» del profesional (DL-109)

Decisiones de Elián del 2026-09-30 (DL-109: elementos **y** bloques; reguardar con el mismo nombre **reemplaza, con aviso**), sobre las reglas de las plantillas (DL-108). Rama `feat/mis-habituales`, sobre `feat/plantillas-de-entrenamiento` (`f43d404`, PR #121). Para auditoría, **sin integrar, sin desplegar y sin APK**.

## Qué puede hacer el profesional

1. **Ejercicios y alimentos habituales.** En cada resultado del buscador del catálogo, «Marcar como habitual» / «Quitar de habituales». Los marcados aparecen arriba de los resultados, en el bloque «Mis habituales»: un clic los agrega a la prescripción o al ítem, sin buscar.
2. **Sesiones y comidas habituales.** En cada sesión (o comida) del borrador, «Guardar como habitual»: el diálogo trae el nombre de la sesión, explica qué copia y qué no, tiene el interruptor de cargas (o cantidades) **apagado** y lista **cada nota de texto libre** con «Vaciar». Si ya hay una con ese nombre, avisa «Ya tenés una sesión habitual «X»: se reemplaza por esta» y el botón dice «Reemplazar» (D-2). Después, «Agregar una sesión habitual» (o comida) inserta una copia en el borrador, tantas veces como haga falta: es de ese plan, y el servidor le asigna los identificadores al guardar.
3. **Plantillas y habituales** (la página «Mis plantillas», ahora con las cuatro secciones): sesiones y comidas habituales con detalle (ejercicios o alimentos por nombre), renombrar y quitar; ejercicios y alimentos habituales con quitar. La sección del área que el profesional no tiene se oculta.

Solo el profesional que los creó los ve y los usa; lo ajeno es 404 neutral; un asesorado o un profesional de otra área, 403. Quitar no borra: la fila queda QUITADO y volver a marcar, o a guardar con ese nombre, la reactiva.

## Cómo está hecho

- **Prisma:** `EjercicioHabitual`, `SesionHabitual`, `AlimentoHabitual`, `ComidaHabitual`, enum `EstadoDeHabitual` (ACTIVO, QUITADO; nunca booleanos), ocho eventos; migración `20260930160000_mis_habituales` derivada del schema con `prisma migrate diff`.
- **@be/domain:** `contratos-habituales.ts` (API-HAB-01..05 y API-HAN-01..05), `habituales.ts` (notas de una sesión o comida, sin identificadores, sin cargas o cantidades), `copy-habituales.ts`, código `PRESET_NAME_TAKEN`, cliente HTTP, OpenAPI regenerado.
- **API:** `entrenamiento/habituales.service.ts` y `nutricion/habituales.service.ts` con los ejecutores de cada dominio (idempotencia del POST, PATCH sin clave, eventos, procedencia, 404 neutral). La sesión o comida se valida como parte de un borrador (forma, criterios, referencias del catálogo disponibles para este profesional) y se guarda sin identificadores de nodo y sin cargas o cantidades salvo pedido. Un nombre QUITADO se libera corriendo el nombre normalizado, sin borrar la fila.
- **Website:** `pro/advisees/training/habituales.tsx` y `pro/advisees/nutrition/habituales.tsx` (bloque del buscador, botón por resultado, diálogo, selector para insertar), los dos `editor.tsx`, `pro/templates/mis-habituales.tsx` y `mis-habituales-nutricion.tsx`, enlace «Plantillas y habituales».
- **Sin APK.** Ninguna lectura del asesorado cambia.

## Pruebas

| Prueba | Resultado |
|---|---|
| Integración `habituales.int-spec.ts` (entrenamiento): marcar, listar con la forma del buscador, quitar y volver a marcar; ejercicio inexistente o de otro profesional 422; asesorado y nutricionista 403; sesión guardada sin ids ni cargas y con nombres de ejercicios; con cargas; nombre tomado 409; `replaces` reemplaza y sube la versión; ajeno 404; renombrar; quitar y no listar; nombre de una quitada reactiva; campo desconocido 400; insertada dos veces en un borrador real con ids distintos asignados por el servidor | **6/6** (7/7 con escrituras simultáneas) |
| Integración `habituales-nutricionales.int-spec.ts`: lo mismo con alimentos y comidas (`quantity: null` salvo `copyQuantities`; alimento cargado por otro 422 `CATALOG_REFERENCE_INVALID`; modalidad por intercambios 422 `EXCHANGE_MODE_NOT_AVAILABLE`) | **3/3** (4/4 con escrituras simultáneas) |
| Contrato (TEST-CT) con las diez operaciones observadas (éxitos, 400, 403, 404, 409, 422, 401) | 12/12 |
| Esquema (`schema.int-spec`: deriva vacía, sin booleanos) | 51/51 |
| Regresión: nutrición 21/21 · plantillas 6/6 y 3/3 (el servicio de catálogo cambió por dentro) | ✅ |
| Dominio (`habituales.test.ts`: notas con lugar relativo, vaciar sin mutar, sin ids, sin cargas y sin cantidades, copy sin términos prohibidos; 39 operaciones de entrenamiento y 35 de nutrición) | 356/356 |
| Typecheck API y web · OpenAPI regenerado y verificado | ✅ |
| Recorrido web local de entrenamiento (`recorrido.mjs`), escritorio 1280 px y móvil 390 px | **20/20 y 20/20** |
| Recorrido web local de nutrición (`recorrido-nutricion.mjs`), escritorio y móvil | **20/20 y 20/20** |

Auditoría de la API por un revisor independiente antes del cierre: dos hallazgos corregidos (la comida quitada se borraba al liberar su nombre, ahora queda QUITADO como en entrenamiento; el 422 de nutrición devolvía `VALIDATION_FAILED` y ahora usa el mismo código principal que un borrador, `CATALOG_REFERENCE_INVALID` / `EXCHANGE_MODE_NOT_AVAILABLE`).

### Recorridos web locales (contra la base que dejó cada spec)

| Control | Entrenamiento | Nutrición |
|---|---|---|
| Cada sesión (comida) del borrador ofrece «Guardar como habitual» | ✅ ✅ | ✅ ✅ |
| El diálogo explica qué copia, trae el nombre, cargas (cantidades) apagadas y las notas con «Vaciar» | ✅ ✅ | ✅ ✅ |
| «Vaciar» saca una nota, una por una | ✅ ✅ | ✅ ✅ |
| Sin nombre, no se guarda | ✅ ✅ | ✅ ✅ |
| Guardada: aviso, diálogo cerrado, y el selector la ofrece | ✅ ✅ | ✅ ✅ |
| Con el mismo nombre: aviso «se reemplaza» y botón «Reemplazar»; reemplaza sin 409 | ✅ ✅ | ✅ ✅ |
| Insertada dos veces en el borrador, con aviso; el borrador se guarda (ids del servidor) | ✅ ✅ | ✅ ✅ |
| El buscador muestra «Mis habituales»; marcar lo agrega al bloque y el botón pasa a «Quitar de habituales»; elegir desde el bloque agrega y cierra | ✅ ✅ | ✅ ✅ |
| Nada califica | ✅ ✅ | ✅ ✅ |
| «Plantillas y habituales»: lista, detalle por nombre, renombrar, quitar | ✅ ✅ | ✅ ✅ |
| Sin desplazamiento horizontal; sin errores de consola (salvo el 403 esperado del área que no se tiene) | ✅ ✅ | ✅ ✅ |

Capturas: `01-dialogo-guardar-sesion-habitual.png`, `02-dialogo-reemplazar.png`, `03-sesion-habitual-insertada.png`, `04-buscador-con-habituales.png`, `05-mis-habituales-detalle.png`, `movil-05-mis-habituales-detalle.png`, y `nutricion-01..05` con `nutricion-movil-05`.

## Escrituras simultáneas (corrección posterior)

Una prueba nueva lanza seis pedidos a la vez contra la base. Contra el código anterior encontró que **seis «quitar» simultáneos del mismo alimento dejaban seis eventos de quitado** para una sola transición, y que dos ediciones con la misma versión esperada podían pisarse. El 500 por nombre duplicado, que figuraba como límite, también quedó resuelto.

- **Marcar y quitar** son idempotentes también a la vez: la inserción ignora el duplicado y cada transición se condiciona al estado, así queda una fila y un evento, y todos reciben 200.
- **Guardar** con un nombre nuevo tomado a la vez: la base deja pasar uno; el resto recibe 409 `PRESET_NAME_TAKEN`, que el website convierte en «Reemplazar».
- **Renombrar y quitar** una sesión o comida escriben condicionados a la versión leída: si otra edición ganó, 409 `VERSION_CONFLICT`.
- Lo mismo se corrigió en las plantillas (PR #121) y llega a esta rama por merge. La traducción de la violación de unicidad es `sinDuplicar` en `apps/api/src/prisma/concurrencia.ts`.

| Prueba | Resultado |
|---|---|
| Seis marcas y seis quitas simultáneas; seis guardados con el mismo nombre; seis ediciones con la misma versión (entrenamiento y nutrición) | marcas y quitas: todas 200, una fila y un evento; guardados y ediciones: un solo éxito y el resto 409 con su código; ningún 500 · tres corridas seguidas en verde en cada área |
| La misma prueba contra el código anterior | **falla**: seis eventos de quitado donde hubo uno |
| Specs de plantillas en esta rama, tres corridas · contrato (TEST-CT) · API unitarias | 7/7 y 4/4 · 12/12 · 51/51 |

## Límites

- Un ejercicio o alimento habitual que deja de estar disponible desaparece de la lista, sin aviso.
- Los favoritos no se paginan (tope 200 por profesional).
- La estructura de una sesión o comida habitual no se edita en «Plantillas y habituales»: se vuelve a guardar desde el editor, con reemplazo.
- Teclado en PC verificado por automatización, no por Dirección. No validado por Dirección, no desplegado.
