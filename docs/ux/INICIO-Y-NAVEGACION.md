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
| **Nutrición de hoy** | API-NUT-14 `hoyNutricional(díaTipo)`, en `leerNutricionDeInicio` (`src/lecturas-de-inicio.ts`). Clave `inicio-nutricion:<día>:<díaTipo>`. El día tipo es la misma elección de Nutrición: `hoy-nutricional:dia` | `planState`, `activePlan.dayTypes[]` (`label`), `selectedDayTypeId`, `registeredIntake[]` (`origin`, `recordedAt`, `executionId`) | Sesión y A3 (DL-115) | Ver el plan: `plan-actual`. Registrar: `hoy` con `accion: 'registrar'`, que lleva a las comidas o a elegir el día. El último registro de hoy: `registro-nutricional`, con su id | Verificando · sin plan · no disponible · **elegir el día tipo: con varios y ninguno elegido, se pide la elección** (DL-049) · sin registros hoy (`NO_DATA`, nunca «0 %») · sin A3 · error | Parámetro de ruta nuevo: `accion` en `hoy` |
| **Actividad: entrenamiento** | API-TRN-19-LISTA `misEjecucionesDeEntrenamiento` de los últimos 30 días. Es la lista de «Tu historial», que no se pagina (hasta 92 días) | `executions[]` con su `effectiveView.sessionCondition`, **con las correcciones aplicadas** | Sesión y A3 | `historial-de-entrenamiento` | Verificando · sin registros en 30 días (un dato real, no una falla) · sin A3 · error | Ninguna |
| **Actividad: nutrición** | API-NUT-16-LISTA `listarMisIngestas` con `limit` 1 (el del contrato), en la misma lectura de la tarjeta. Se pide **solo si hoy no hay registros** | `data[0]`: `executionId`, `localDate`, `origin` | Sesión y A3 | `registro-nutricional`, con su id | Nunca registró · sin leer (una falla pasajera: la tarjeta no afirma nada) · sin A3 | **«Días con registros en 30 días» no se puede calcular con una página.** Exige recorrer todas las páginas o un agregado de la API (D-1). Se muestra lo último que se registró, con su fecha |
| **Mediciones: última toma** | API-ANT-06-PROPIA `miEvolucionAntropometrica` vía `leerMiEvolucion`. Clave `mi-evolucion:ultimos-90`, la de Evolución | `metrics[].series[]`: `occurredAt`, `sourceEvaluationId`, `comparabilityGroup`, `value` y `unit` | Sesión y A3 | `mi-evolucion` | Verificando · sin mediciones · sin A3 · error | Ninguna |
| **Cambio entre observaciones comparables** | La misma lectura, con `ultimaToma()` del dominio | La medida, su anterior comparable y `diferenciaDescriptiva` (fechas y días) | — | `mi-evolucion` con `vista: 'evolucion'` y `metrica` | Sin anterior comparable: se dice por qué (`SIN_PREVIA`, `OTRO_GRUPO`) | Parámetros de ruta nuevos: `vista` y `metrica` |
| **Para responder** | API-FRM-06 `misSolicitudesDeFormulario` con `status: PENDING` y `limit` 3, junto con API-CON-05 `consultarRequisitoA3`, en `leerPendientes`. Clave `inicio-pendientes` | `data[]`: `formRequestId`, `templateName`, `professional.displayName`, `respondable` y `createdAt`. También `page.hasMore` y si falta el A3 | Sesión. Responder exige el A3 (DL-115) | Si se puede responder: «Completar», a `mi-solicitud` con su id. Sin A3: el aviso con `privacidad`. Si no se puede responder por otro motivo: lo dice, sin botón | Verificando · sin pendientes · **con más páginas: «más de 3», nunca su largo como total** · sin A3 · error | Ninguna: `limit` y `status` son del contrato |
| **Saludo y avatar** | API-ACC-05 `/me`. `profile` es `{}` | — | Sesión | Avatar: `cuenta`, desde la pantalla actual | — | Sin nombre ni foto en el contrato (DL-009): saludo neutro (D-2) |

**Qué se construye con contratos existentes:** todas las tarjetas. El cliente de `@be/domain` expone ahora el `limit` que
API-NUT-16-LISTA ya declaraba en el contrato; la API y el OpenAPI no cambian.

**Criterio de la medida destacada** (`medidaDestacada`): la primera medida de la última toma en el orden del catálogo de
BE, que empieza por el peso; si la toma solo tiene resultados de fórmulas, el primero de ellos. La tarjeta lo dice.

**Acciones de una sesión de hoy:** «Comenzar sesión» y «Continuar sesión» abren el borrador con el mismo circuito de
Entrenamiento de hoy (`useAbrirOcurrencia`), solo al tocarlos. Consultar una sesión registrada es «Ver registro», el
mismo texto del módulo.
**Qué necesita parámetros de navegación:**
- `hoy` con `accion`;
- `mi-evolucion` con `vista` y `metrica`;
- el origen (`desde`) en los detalles.

**Qué requiere una decisión o una ampliación de la API:**
- D-1: el agregado de días con registros nutricionales;
- D-2: el nombre o la foto del perfil;
- D-3: listar todas las tomas, si una evaluación del mismo día queda tapada (§5);
- D-4: un agregado de la actividad de entrenamiento por período, para no descargar las sesiones solo para contarlas.

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

Son tres cosas separadas:
- **`moduloDe(ruta)`** (`src/navegacion.ts`): a qué módulo pertenece una pantalla. Cuenta y sus subpantallas son el
  módulo `cuenta`.
- **`pestanaActiva(ruta)`** (`src/navegacion.ts`): qué destino se resalta. Es la raíz donde empieza la cadena de origen,
  o el módulo de la pantalla. **Cuenta no resalta ninguno:** no es un sexto destino ni una especialidad.
- **La barra se ve** (`conSesion` en `App.tsx`) con una sesión verificada, y se oculta con el teclado abierto
  (`src/barra-de-zonas.tsx`).

### Sin pérdidas silenciosas

Una pantalla con algo escrito y sin guardar lo declara (`useCambiosSinGuardar`, en `src/cambios-sin-guardar.tsx`).
Salir por la barra, la cabecera, el avatar, el menú o el botón atrás pregunta antes, con el diálogo del sistema:
«Seguir acá» o «Salir sin guardar». Lo que una pantalla hace por sí misma (registrar y pasar al detalle, ir a
Privacidad desde un aviso) lo decide esa pantalla, y que la sesión termine no pregunta.

| Pantalla | Qué declara |
|---|---|
| Nutrición, una comida del plan | Las cantidades o la observación escritas con la tarjeta abierta |
| Nutrición, comida fuera del plan | La descripción o la porción escritas |
| Sesión de entrenamiento | El motivo, el resumen de la sesión o la hora, distintos de lo guardado en el borrador |
| Sesión de entrenamiento, un ejercicio | Una serie a medio cargar, o un resumen distinto del guardado |
| Corrección de un registro | El motivo o cualquier valor distinto del registro vigente |
| Una solicitud de formulario | Las respuestas o el motivo del borrador |
| Crear cuenta | El correo o la contraseña escritos |

### Barra y cabecera: cómo se ven

- **Barra.** Una cápsula flotante:
  - con márgenes de 12 dp a los costados, u 8 en un teléfono de menos de 360 dp;
  - extremos redondeados del todo y un borde fino (`barraBorde`);
  - vidrio ahumado sin desenfoque (`barraVidrio`): el escalón elevado al 90 % en Azul noche y el blanco al 92 % en Claro;
  - las cinco etiquetas siempre a la vista, a 12 sp, que crecen hasta 1,15 veces y, solo si no entran, bajan hasta un
    85 %;
  - el destino elegido lleva el ícono y la etiqueta en `barraElegido`, la etiqueta en negrita y un brillo radial suave
    detrás del ícono. No hay puntito, recuadro, aro ni botón central;
  - mide su alto real y el contenido deja ese espacio libre al final.
- **Contraste del vidrio.** `scripts/contraste.test.cjs` mide las etiquetas sobre la mezcla del vidrio con cada color
  del tema, el peor caso de lo que puede pasar detrás. El mínimo medido es 6,02:1 en Azul noche y 5,76:1 en Claro.
- **Cabecera.**
  - A la izquierda: «Volver» con su flecha, que le dice al lector de pantalla adónde vuelve; el menú en una raíz; o
    nada. También en Crear cuenta e Iniciar sesión, que vuelven a Bienvenida.
  - Al centro: el isotipo y «BE», con un brillo contenido en su lugar.
  - A la derecha: el avatar neutro, de 48 dp.
  - Debajo: la franja del ambiente de prueba, y un borde fino sobre el que corre la línea de actualización en cian.

## 4. Solicitudes por visita

Cada tarjeta pide lo suyo una vez por entrada: así verifica antes de mostrar (G2). Lo recordado en la sesión evita
recalcular y redibujar, no pedir. Contado con un cliente que anota cada pedido (`scripts/inicio.test.mjs`, sección 4):

| Momento | Solicitudes | Cuáles |
|---|---|---|
| Abrir Inicio, con registros de comida hoy | **6** | TRN-14, NUT-14, FRM-06 y CON-05 (juntas), TRN-19-LISTA, ANT-06-PROPIA |
| Abrir Inicio, sin registros de comida hoy | **7** | Las mismas y NUT-16-LISTA con `limit` 1, después de NUT-14 |
| Sin mediciones en los últimos 90 días | **+3** como mucho | ANT-06-PROPIA mira hacia atrás de a 90 días, hasta un año (`leerMiEvolucion`) |
| Volver a Inicio, o volver después de registrar algo | Las mismas | Inicio se monta de nuevo y verifica |
| Elegir el día del plan en la tarjeta | **1 o 2** | NUT-14 con el día elegido, y NUT-16-LISTA si hoy no hay registros |

**Lo que se descarga.**
- TRN-19-LISTA trae cada sesión de los 30 días completa, con su plan, su original y sus correcciones, para contarlas.
  Inicio guarda solo la cuenta. Un agregado por período lo evitaría, y queda como opción (D-4).
- NUT-16-LISTA trae una sola fila.
- FRM-06 trae como mucho tres solicitudes.

**Encadenadas.** Solo una, y se puede evitar: NUT-16-LISTA espera a NUT-14 para saber si hoy hay registros. Pedirla
siempre en paralelo sumaría una solicitud en cada visita con registros. Se eligió encadenarla, porque solo demora el
renglón del último registro y no la tarjeta.

## 4 bis. Mi evolución: el selector de tomas (etapa 4)

- **Las tomas.** T1, T2, T3… son las evaluaciones del período, de la más vieja a la más nueva, con su fecha real
  (`tomasDelPeriodo`, en `@be/domain`). Cada toma es una evaluación (`sourceEvaluationId`), **nunca una fecha**: dos
  evaluaciones del mismo día son dos tomas. T1 es la primera toma del período que se ve, no la primera de la historia: el
  período está escrito debajo del selector.
- **Una sola elección.** Elegir una toma cambia a la vez la figura (el mapa corporal), las medidas, los resultados de las
  fórmulas, sus gráficos chicos y la comparación. Sin elección, o si la toma elegida ya no está en la respuesta, se ve la
  última. La elección se recuerda mientras dure la sesión (`mi-evolucion:toma`). Inicio puede abrir una vista y una
  medida (`vista`, `metrica`).
- **La comparación.** Cada medida de la toma elegida va con la anterior del mismo grupo de comparabilidad, de una
  evaluación anterior a ella (`tomaDe`). Es la regla que ya tenía la última toma (REG-06-162/164).
- **Los gráficos chicos.** Cada medida y cada resultado lleva un punto por toma, sin líneas. Una toma sin la medida, o
  con otro protocolo, método o unidad, es un hueco: no hay punto (`valoresPorToma`). La toma elegida va resaltada. Debajo
  está su lista equivalente («T1 82,4 · T2 sin dato · T3 80 kg»), y el lector de pantalla dice cada toma con su fecha.
- **Lo que no cambia.** Los sitios anatómicos de la figura y los métodos: no se movió ni se quitó ninguno. La vista
  «Evolución» sigue mostrando una medida en el tiempo, con su gráfico de puntos y su lista.

## 5. Dependencias y decisiones abiertas

- **D-1.** «Días con registros nutricionales en un período» exige un agregado de la API o recorrer el historial
  paginado. Mientras tanto, Inicio muestra lo último que se registró, con su fecha, y no lo presenta como un resumen
  del período.
- **D-2.** No hay nombre ni foto en el perfil (DL-009). El saludo y el avatar quedan neutros.
- **D-4.** La actividad de entrenamiento cuenta sesiones que descarga completas (TRN-19-LISTA). Un agregado por período
  ahorraría la descarga. Es una decisión de contrato y no se tomó en esta tanda.
- **D-3.** La API proyecta una observación efectiva por día y medida. Una toma se reconstruye por su `sourceEvaluationId`.
  Si dos evaluaciones caen el mismo día, de la tapada se ve solo lo que la API expone. Listar todas las tomas exigiría
  ampliar el contrato.
