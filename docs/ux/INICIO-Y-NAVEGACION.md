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
| **Nutrición de hoy** | API-NUT-14 `hoyNutricional(díaTipo)`. Clave `hoy-nutricional:<día>:<díaTipo>`, la de Nutrición. El día tipo es la misma elección de Nutrición: `hoy-nutricional:dia` | `planState`, `activePlan.dayTypes[]` (`label`), `selectedDayTypeId`, `registeredIntake[]` (`origin`, `recordedAt`, `executionId`) | Sesión y A3 (DL-115) | Ver el plan: `plan-actual`. Registrar: `hoy` con `accion: 'registrar'`, que lleva a las comidas o a elegir el día. El último registro de hoy: `registro-nutricional`, con su id | Verificando · sin plan · no disponible · **elegir el día tipo: con varios y ninguno elegido, se pide la elección** (DL-049) · sin registros hoy (`NO_DATA`, nunca «0 %») · sin A3 · error | Parámetro de ruta nuevo: `accion` en `hoy` |
| **Actividad: entrenamiento** | API-TRN-19-LISTA `misEjecucionesDeEntrenamiento` de los últimos 30 días, en `leerActividadDeEntrenamiento`. Es la lista de «Tu historial», que no se pagina (hasta 92 días) | `executions[]` con su `effectiveView.sessionCondition`, **con las correcciones aplicadas**. El encabezado dice el período que respondió la API (`data.period`), no el pedido | Sesión y A3 | `historial-de-entrenamiento` | Verificando · sin registros en 30 días (un dato real, no una falla) · sin A3 · error | Ninguna |
| **Actividad: nutrición** | API-NUT-16-LISTA `listarMisIngestas` con `limit` 1 (el del contrato), en `leerUltimoRegistro`. Es **una lectura aparte**, con su ciclo y su clave (`inicio-ultimo-registro`), y se pide **solo si hoy no hay registros**. La tarjeta no la espera | `data[0]`: `executionId`, `localDate`, `origin` | Sesión y A3 | `registro-nutricional`, con su id | Nunca registró · sin leer (una falla pasajera: la tarjeta no afirma nada) · sin A3 | **«Días con registros en 30 días» no se puede calcular con una página.** Exige recorrer todas las páginas o un agregado de la API (D-1). Se muestra lo último que se registró, con su fecha |
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
- Ir a la pantalla en la que ya se está (tocar su destino en la barra, o el avatar en Cuenta) no pregunta: no la
  desmonta ni pierde nada, solo sube.
- Lo declarado lo borra cada pantalla al desmontarse, no la pregunta. Si la pregunta lo borrara y la pantalla siguiera
  montada, la salida siguiente perdería lo escrito sin preguntar.

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
  - vidrio ahumado sin desenfoque (`barraVidrio`): el escalón elevado al 94 % en Azul noche y el blanco al 95 % en Claro;
  - las cinco etiquetas siempre a la vista, a 12 sp, que crecen hasta 1,15 veces y, solo si no entran, bajan hasta un
    80 %. Medido en el render del navegador: desde 390 dp no se achica ninguna, en 360 dp un 4 % con letra grande y en
    320 dp un 17 % con letra grande; ninguna se corta;
  - el destino elegido lleva el ícono y la etiqueta en `barraElegido`, la etiqueta en negrita y un brillo radial suave
    detrás del ícono. No hay puntito, recuadro, aro ni botón central;
  - mide su alto real y el contenido deja ese espacio libre al final.
- **Contraste del vidrio.** `scripts/contraste.test.cjs` mide las etiquetas sobre la mezcla del vidrio con cada color
  del tema, el peor caso de lo que puede pasar detrás. El mínimo medido es 6,86:1 en Azul noche y 6,13:1 en Claro.
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
| Volver del segundo plano con Inicio abierto | Las mismas | Cada tarjeta confirma de nuevo, con lo confirmado a la vista mientras tanto (G3) |
| «Reintentar» en una tarjeta | Solo las de esa tarjeta | Las demás no se tocan |
| A la medianoche, con Inicio abierto | Las de las tarjetas de hoy y la de la actividad | Cambia el día de la API, y con él sus claves (`useDiaDeLaApi`), a la medianoche **del servidor**: la hora sale de la cabecera `Date` de cada respuesta (`reloj-del-servidor.ts`), la misma con la que la sesión mide su vigencia, y se cuenta con un reloj monótono: cambiar la hora del teléfono no la mueve, y una respuesta lenta no la atrasa. Como esa estimación nunca se adelanta al servidor, cuando cambia la clave la API ya está en el día nuevo, y el día que se muestra no vuelve atrás. Si la API igual responde que el período termina mañana (antes de la primera respuesta, o si el reloj del teléfono se movió), la actividad pide una vez más, un día antes, y dice ese período |

**Medición local** (cierre del 2026-10-04; detalle en
`EVIDENCIA/INICIO-Y-NAVEGACION/herramientas/medir-inicio/resultados.md`). El conteo de arriba no dice cuánto tarda. Se
midió en esta computadora, con el cliente real de @be/domain y las lecturas reales de las tarjetas, contra un servidor
local con datos sintéticos válidos contra los contratos y una red simulada. **No es una medición en el teléfono ni contra
la API de test.** Supuestos: 60 ms de servidor por lectura y HTTP/2 sobre una conexión, que en frío se abre antes de la
primera respuesta.

| Tarjeta (caso típico) | Solicitudes | Bytes | Utilizable, 4G lento | Utilizable, 3G lento |
|---|---|---|---|---|
| Para responder | 2 | 2,1 KB | 0,62 s | 1,51 s |
| Entrenamiento de hoy | 1 | 7,8 KB | 0,77 s | 2,06 s |
| Nutrición de hoy | 1 | 14,4 KB | 0,86 s | 2,47 s |
| Mediciones | 1 | 46,7 KB | 1,20 s | 3,79 s |
| Tu actividad | 1 | 105,1 KB | 1,50 s | 4,99 s |
| **Toda la visita** | **6** | **176,1 KB** | **1,50 s** | **4,99 s** |

- **Sin registros de comida hoy:** la tarjeta de Nutrición se puede usar a los 0,82 s (4G lento), y el renglón del
  último registro llega a los 1,09 s. Antes de este cierre la tarjeta esperaba los dos pedidos.
- **Sin mediciones recientes:** Mediciones hace 4 pedidos, uno detrás de otro (1,52 s en 4G lento, 4,37 s en 3G lento).
- **Historial con muchas correcciones** (60 sesiones en 30 días): la tarjeta de actividad baja 539 KB y tarda 3,75 s en
  4G lento y 13,9 s en 3G lento. Es la que más pesa en todos los casos.
- **Consultas repetidas.** En una visita no se repite ninguna. Volver a una pantalla vuelve a pedir: es la verificación
  de permisos de cada entrada (G2), y no se debilitó. Las tres ventanas hacia atrás de Mediciones se piden en cada
  visita porque cualquiera pudo cambiar; pedirlas juntas ahorraría entre 0,3 y 1 s con las mismas solicitudes (medido,
  no implementado). Inicio y Nutrición comparten ahora la lectura de «Hoy» (`hoy-nutricional:<día>:<díaTipo>`).

**Lo que se descarga.**
- TRN-19-LISTA trae cada sesión completa, con su plan, su original y sus correcciones, para contarlas: 105 KB en el caso
  típico y 539 KB con muchas correcciones. Inicio guarda solo la cuenta.
- La API no comprime sus respuestas. **Simulación local, no medición:** comprimiendo con gzip en la simulación, la
  visita típica bajaría de 176 KB a 8,5 KB y de 1,50 a 0,62 s en 4G lento; la del historial pesado, de 610 KB a 14 KB y
  de 13,9 a 1,7 s en 3G lento. No se midió en el teléfono ni contra la API de test, y no se verificó si Render comprime en
  su borde: las rutas públicas de la API son chicas y no alcanzan para saberlo.
- NUT-16-LISTA trae una sola fila, y FRM-06 como mucho tres solicitudes.

**Encadenadas.** Solo una: NUT-16-LISTA espera a NUT-14 para saber si hoy hay registros. Pedirla siempre en paralelo
sumaría una solicitud en cada visita con registros. Desde el cierre del 2026-10-04 **solo demora el renglón del último
registro**: es una lectura aparte (`leerUltimoRegistro`), y la tarjeta se puede usar en cuanto llega NUT-14. El renglón y su botón van debajo de «Registrar» y «Ver el plan»: cuando llegan, no corren las acciones bajo el dedo. Antes, la
lectura de la tarjeta esperaba las dos respuestas, aunque este documento decía que solo demoraba el renglón. Se corrigió
el comportamiento, no la afirmación.

## 4 bis. Mi evolución: tres vistas y el selector de tomas

Desde DL-118 (Dirección, 2026-10-05), las vistas son **Mapa corporal, Progreso e Indicadores**. El delta frente al cierre
del 2026-10-04 y las reglas completas están en [MI-EVOLUCION-TRES-VISTAS.md](MI-EVOLUCION-TRES-VISTAS.md).

- **Las tomas.** T1, T2, T3… son las evaluaciones del período, de la más vieja a la más nueva, con su fecha real
  (`tomasDelPeriodo`, en `@be/domain`).
  - Cada toma es una evaluación (`sourceEvaluationId`), **nunca una fecha**: dos evaluaciones del mismo día son dos
    tomas.
  - T1 es la primera toma del período que se ve, no la primera de la historia: el período está en «Cómo se lee».
  - Cada vista lista solo las tomas que tienen datos para ella, con la misma numeración. Si la toma elegida no los
    tiene, la vista muestra la anterior más cercana y lo dice con las dos fechas.
- **La cabecera.**
  - Arriba van las vistas, en pestañas subrayadas de borde a borde. Con una sola vista, no hay pestañas.
  - Debajo, la fecha de la toma y cuál es («Última toma» o «Toma T2»), y las tomas en una fila de chips que se
    desplaza de costado.
  - No dice con qué fecha se compara: cada medida puede tener otra anterior comparable, y su tarjeta la dice (ajuste de
    Dirección del 2026-10-05).
  - Las explicaciones largas van en «Cómo se lee».
- **Sin vistas vacías.**
  - El mapa y Progreso aparecen si alguna toma tiene perímetros o pliegues; Indicadores, si alguna tiene indicadores.
  - «Ver la toma», desde Inicio, abre el mapa si la última toma tiene sitios y, si no, Indicadores.
  - La vista se resuelve una sola vez, con los datos.
- **Mapa corporal:** «¿cuáles son mis medidas más recientes?».
  - La figura, con el nombre y el valor de cada sitio de una toma, sin gráficos chicos ni diferencia.
  - Al tocar un sitio aparecen el cambio con su fecha y «Ver su progreso».
  - El encuadre es el del pulido del 2026-10-04: el cuerpo grande, arriba y recortado a la derecha. En Azul noche va
    atenuado.
  - Con letra ×1,3 o más, la figura va con números y los valores en la lista.
- **Progreso:** «¿qué cambió en esta parte del cuerpo?».
  - Dos elecciones: Perímetros o Pliegues, y Torso o Piernas.
  - La figura es la del tren del compositor, con un número por sitio. Cada sitio va en una sola zona, por su clave.
  - Desde el ajuste del 2026-10-05, la figura es una franja compacta con los sitios de la zona, y las tarjetas la
    siguen sin un título en el medio.
  - El torso, con más de cinco sitios, se reparte en dos paneles fijos.
  - Una tarjeta por sitio, con la forma del ejemplo de Dirección del 2026-10-05: el valor grande, el cambio con su
    flecha y su fecha, los puntos sobre fechas reales con la toma de cada uno, y los valores en fila. Al tocarla, el
    gráfico grande y la lista.
  - Comparar salió como apartado: su lectura está en estas tarjetas.
- **Indicadores:** «¿qué datos y resultados tengo disponibles?». Cuatro bloques:
  - mediciones;
  - resultados, marcados como estimación;
  - la edad, como dato de la toma;
  - «Más datos de esta toma», plegado.

  Dos columnas cuando entran (`columnasDeIndicadores`). El detalle empieza con el resumen.
- **Una sola elección de toma y una de medida.** La toma elegida cambia a la vez las tres vistas. La medida elegida
  (`mi-evolucion:medida`) es la misma en el mapa, en Progreso y en los indicadores.
- **Los gráficos chicos.** Desde DL-118 son de **fechas reales**: el período de punta a punta, la escala visible, sin
  rellenos y un solo grupo de comparabilidad por gráfico. Desde el 2026-10-05, una línea une solo tomas seguidas del
  mismo grupo, y una toma sin la medida la corta.
  - Desde el ajuste del 2026-10-05 tienen tres líneas de referencia, la toma bajo cada punto y los valores en fila
    (`GUIA-UX-UI.md` §4).
  - El otro grupo se cuenta aparte y se elige en el detalle.
  - Con una sola observación no hay gráfico.
  - Los gráficos por orden de toma del cierre del 2026-10-04 se retiraron.
- **Una toma que puede estar incompleta (D-3).** Si otra evaluación cayó el mismo día:
  - la pantalla lo avisa en una línea que nombra la otra toma;
  - «Por qué» abre el detalle, que cuenta las medidas y los resultados que se ven;
  - «Cómo se lee» dice qué puede no verse de cualquier toma: BE muestra una medición por día y por medida, y no
    muestra una medición anulada o con correcciones que no se pueden ordenar.
- **Lo que no cambia.** Los contratos, los permisos y la vista profesional. Ningún método se ocultó ni se quitó: la
  propuesta de simplificación sigue en [MEDIDAS-Y-METODOS-EN-LA-APK.md](MEDIDAS-Y-METODOS-EN-LA-APK.md), sin implementar.
- **Revisión visual.** Renders de los componentes reales en el navegador, no capturas nativas:
  `EVIDENCIA/MI-EVOLUCION-TRES-VISTAS` (DL-118) y `EVIDENCIA/INICIO-Y-NAVEGACION` (antes).

## 5. Dependencias y decisiones abiertas

- **D-1.** «Días con registros nutricionales en un período» exige un agregado de la API o recorrer el historial
  paginado. Mientras tanto, Inicio muestra lo último que se registró, con su fecha, y no lo presenta como un resumen
  del período.
- **D-2.** No hay nombre ni foto en el perfil (DL-009). El saludo y el avatar quedan neutros.
- **D-4, diferida.** La actividad de entrenamiento cuenta sesiones que descarga completas (TRN-19-LISTA). En la
  simulación local del cierre del 2026-10-04 (§4), un agregado bajaría la tarjeta de 1,50 a 0,58 s en 4G lento, y
  comprimir las respuestas llevaría toda la visita a 0,62 s sin un endpoint nuevo ni un cambio de contrato. Son números
  simulados, no medidos. No se crea el agregado: primero, saber si Render comprime y, si no, decidir la compresión en la
  API.
- **D-3.** La API proyecta una observación efectiva por día y medida. Una toma se reconstruye por su `sourceEvaluationId`.
  Si dos evaluaciones caen el mismo día, de la tapada se ve solo lo que la API expone, y desde el cierre del 2026-10-04 la
  pantalla lo dice (§4 bis). Lo mismo pasa con un resultado calculado con dos métodos el mismo día: se ve uno, y eso no
  se puede detectar en el teléfono. Listar todas las tomas exigiría ampliar el contrato.
