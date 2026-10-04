# Inicio y navegación de la APK

**Estado:** decidido por Dirección el 2026-10-04 ([DL-117](../DEUDA_LEGAJO.md)). Se implementa en ramas sin integrar.
**Alcance:** la APK del asesorado. El website no cambia.
**Qué amplía:** un Inicio personal que reúne lo disponible de los módulos. **No** autoriza el dashboard interdisciplinario
profesional con notas y coordinación, ni una política de permisos nueva. Cada dato de Inicio se lee con la misma
operación, y bajo el mismo permiso, que en su módulo.

---

## 1. Decisiones de Dirección (2026-10-04)

- **Barra inferior:** cinco destinos, en este orden: **Inicio · Nutrición · Entrenamiento · Evolución · Información**.
  Cuenta deja la barra y pasa al avatar de la cabecera.
- **Cabecera única:**
  - a la izquierda, el menú auxiliar en las pantallas principales, o volver en un detalle (volver tiene prioridad);
  - al centro, la marca BE;
  - a la derecha, el avatar.
- **Avatar y saludo.** `MeResponse.profile` es `{}` («datos propios mínimos», DL-009): no hay nombre ni foto que mostrar.
  - El avatar es un ícono neutro de persona y el saludo es «Hola», sin nombre.
  - No se deriva un nombre del correo, de un identificador ni de una respuesta de salud.
- **Ambiente de prueba:** una franja compacta bajo la cabecera, siempre a la vista (08 §33).
- **Inicio** es la entrada normal después de iniciar sesión o de recuperar una sesión guardada válida. El destino de la
  reautenticación (volver a Cuenta) se conserva.

## 2. Matriz de datos y acciones (etapa 1)

Cada tarjeta lee **una operación que ya existe**, con la misma clave de memoria que su módulo (`src/lecturas.ts`). Al
entrar se verifica antes de mostrar (G2 de `EVIDENCIA/NAVEGACION-Y-SESION`). `/me` valida la sesión, pero no autoriza
por sí solo los datos de salud: cada lectura trae su propio permiso.

| Elemento | Fuente existente | Campos | Permisos | Destino exacto | Estados | Dependencia |
|---|---|---|---|---|---|---|
| **Entrenamiento de hoy** | API-TRN-14 `hoyDeEntrenamiento`. Clave `entrenamiento-hoy:<día>`, la de Entrenamiento | `date`, `planState`, `occurrences[]`: `occurrenceId`, `plannedSession` (`label`, `blockLabel`, `prescriptions`) y `execution` (`state`, `draftId`, `executionId`, `sessionCondition`) | Sesión y A3 vigente (08:406). Con el vínculo pausado o un consentimiento revocado, `NOT_AVAILABLE` | Comenzar o continuar: `abrirBorradorDeEjecucion` (API-TRN-15, una escritura que va **solo al tocar**) y después `sesion-de-entrenamiento`. Registrada: `ejecucion-de-entrenamiento`, con su id | Verificando · sin plan (`NO_ACTIVE_PLAN`) · no disponible (`NOT_AVAILABLE`) · **varias sesiones: se elige, no se toma la primera** (DL-077) · registrada como no completada (no se dice «completada») · sin A3 · error · sin red | Ninguna |
| **Nutrición de hoy** | API-NUT-14 `hoyNutricional(díaTipo)`. Clave `hoy-nutricional:<día>:<díaTipo>`, la de Nutrición. El día tipo se recuerda en `hoy-nutricional:dia` | `planState`, `activePlan.dayTypes[]` (`label`, `meals`), `selectedDayTypeId`, `registeredIntake[]`, `dataState` | Sesión y A3 (DL-115) | Ver el plan: `plan-actual`. Registrar: `hoy` con `accion: 'registrar'`, que lleva a las comidas o a elegir el día. Un registro: `registro-nutricional`, con su id | Verificando · sin plan · no disponible · **elegir el día tipo: con varios y ninguno elegido, se pide la elección** (DL-049) · sin registros hoy (`NO_DATA`, nunca «0 %») · sin A3 · error | Parámetro de ruta nuevo: `accion` en `hoy` |
| **Actividad: entrenamiento** | API-TRN-19-LISTA `misEjecucionesDeEntrenamiento` de los últimos 30 días. Es la lista de «Tu historial», que no se pagina (hasta 92 días) | `executions[]` con su `effectiveView.sessionCondition`, **con las correcciones aplicadas** | Sesión y A3 | `historial-de-entrenamiento` | Verificando · sin registros en 30 días (un dato real, no una falla) · sin A3 · error | Ninguna |
| **Actividad: nutrición** | API-NUT-16-LISTA `listarMisIngestas`, primera página, ordenada por **momento de registro** descendente. Se pide solo si hoy no hay registros | `data[0]` (`localDate`, `occurredAt`, `recordedAt`) y `page.hasMore` | Sesión y A3 | `registro-nutricional`, con su id | Verificando · nunca registró · sin A3 · error | **«Días con registros en 30 días» no se puede calcular con la primera página.** Exige recorrer todas las páginas o un agregado de la API (D-1). La alternativa honesta es lo último que se registró, con su fecha |
| **Mediciones: última toma** | API-ANT-06-PROPIA `miEvolucionAntropometrica` vía `leerMiEvolucion`. Clave `mi-evolucion:ultimos-90`, la de Evolución | `metrics[].series[]`: `occurredAt`, `sourceEvaluationId`, `comparabilityGroup`, `value` y `unit` | Sesión y A3 | `mi-evolucion` | Verificando · sin mediciones · sin A3 · error | Ninguna |
| **Cambio entre observaciones comparables** | La misma lectura, con `ultimaToma()` del dominio | La medida, su anterior comparable y `diferenciaDescriptiva` (fechas y días) | — | `mi-evolucion` con `vista: 'evolucion'` y `metrica` | Sin anterior comparable: se dice por qué (`SIN_PREVIA`, `OTRO_GRUPO`) | Parámetros de ruta nuevos: `vista` y `metrica` |
| **Pendiente de revisar** | API-FRM-06 `misSolicitudesDeFormulario` y API-CON-05 `consultarRequisitoA3`, vía `leerLista`. Clave `mis-solicitudes`, la de Información | `data[]`: `formRequestId`, `templateName`, `professional.displayName`, `status`, `respondable` y `createdAt`. También `page.hasMore` y si falta el A3 | Sesión. Responder exige el A3 (DL-115) | Si se puede responder: `mi-solicitud`, con su id. Sin A3: `privacidad`. Si no se puede responder por otro motivo: lo dice, sin botón | Verificando · sin pendientes · **lista parcial: no se presenta su largo como total** · sin A3 · error | `leerLista` tiene que exponer `hayMas` |
| **Saludo y avatar** | API-ACC-05 `/me`. `profile` es `{}` | — | Sesión | Avatar: `cuenta`, desde la pantalla actual | — | Sin nombre ni foto en el contrato (DL-009): saludo neutro (D-2) |

**Qué se construye con contratos existentes:** todas las tarjetas.
**Qué necesita parámetros de navegación:**
- `hoy` con `accion`;
- `mi-evolucion` con `vista` y `metrica`;
- el origen (`desde`) en los detalles.

**Qué requiere una decisión o una ampliación de la API:**
- D-1: el agregado de días con registros nutricionales;
- D-2: el nombre o la foto del perfil;
- D-3: listar todas las tomas, si una evaluación del mismo día queda tapada (§5).

## 3. Navegación

### Raíces y origen

- **Raíces:** `inicio`, `hoy` (Nutrición), `entrenamiento`, `mi-evolucion` (Evolución) y `mis-solicitudes` (Información).
  La barra lleva a ellas y las deja sin origen.
- **El origen.** Un detalle recuerda de dónde se abrió en `desde`, que es la ruta anterior completa. Lo asigna
  `navegar()` en `src/navegacion.ts`, una función pura que se prueba sin teléfono:
  - **ir a un detalle** lo abre con `desde` igual a la pantalla actual;
  - **reemplazar** hereda el `desde` de la pantalla actual. Pasa al registrar un borrador: el registro reemplaza al
    borrador, y volver lleva adonde se había abierto el borrador;
  - **ir a una pantalla que ya está en la cadena** vuelve a ella, sin duplicarla. Por ejemplo, después de consentir se
    vuelve al vínculo;
  - **la cadena tiene un tope** de seis niveles.

### Atrás

1. Primero cierra el menú, un diálogo o un visor: son `Modal`, y su `onRequestClose` actúa antes que la navegación.
2. Desde un detalle, vuelve a su `desde`. Si no lo tiene, vuelve a su pantalla madre, que es la de siempre.
3. Desde una raíz que no es Inicio, vuelve a Inicio.
4. Desde Inicio, deja actuar al sistema.
5. Navegar nunca cierra la sesión.

| Caso | Al volver |
|---|---|
| Un detalle abierto desde Inicio, por ejemplo una ejecución | Inicio |
| El mismo detalle abierto desde su módulo | El módulo (Entrenamiento de hoy o Tu historial) |
| Cuenta abierta desde el avatar | La pantalla desde la que se abrió |
| Privacidad abierta desde un aviso de A3 | La pantalla del aviso |
| Privacidad abierta desde Cuenta | Cuenta, que conserva su propio origen |
| Lo abierto desde el menú auxiliar | La raíz en la que se abrió el menú |

### Menú auxiliar

Lleva a funciones que ya existen y no tienen lugar en la barra: **Vínculos**, **Tu historial de entrenamiento** y
**Registros nutricionales**.
- No repite los destinos de la barra ni lo que ya está en Cuenta (privacidad, seguridad, apariencia, identificador).
- No tiene opciones sin destino operativo.
- Vínculos queda también dentro de Cuenta, como antes: no se quitó nada.

### Módulo, pestaña activa y barra

Son tres cosas separadas en `src/navegacion.ts`:
- **`moduloDe(ruta)`:** a qué módulo pertenece una pantalla. Cuenta y sus subpantallas son el módulo `cuenta`.
- **`pestanaActiva(ruta)`:** qué destino se resalta. Es la raíz donde empieza la cadena de origen, o el módulo de la
  pantalla. **Cuenta no resalta ninguno:** no es un sexto destino ni una especialidad.
- **`barraVisible`:** visible con sesión y oculta con el teclado abierto.

## 4. Solicitudes por visita

Se completa con la medición de la etapa 3.

## 5. Dependencias y decisiones abiertas

- **D-1.** «Días con registros nutricionales en un período» exige un agregado de la API o recorrer el historial
  paginado. Mientras tanto, Inicio muestra lo último que se registró, con su fecha, y no lo presenta como un resumen
  del período.
- **D-2.** No hay nombre ni foto en el perfil (DL-009). El saludo y el avatar quedan neutros.
- **D-3.** La API proyecta una observación efectiva por día y medida. Una toma se reconstruye por su `sourceEvaluationId`.
  Si dos evaluaciones caen el mismo día, de la tapada se ve solo lo que la API expone. Listar todas las tomas exigiría
  ampliar el contrato.
