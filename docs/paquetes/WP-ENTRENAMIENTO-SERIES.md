# WP-ENTRENAMIENTO-SERIES — Entrenamiento por serie: objetivos por serie, imagen del ejercicio y tiempos con certeza · definición del paquete

> **Estado:** DEFINIDO el 2026-10-06, con el dominio escrito y probado. La API, la web y la APK se implementan sobre
> esta definición (§13).
>
> **Encargo:** «BE · Cierre de Nutrición y Entrenamiento por serie», de Dirección, del 2026-10-06, con el paquete
> `BE_Entrenamiento_Autonomo_2026-10-06`.
> - El manifiesto verifica y `verificar_paquete.py` da OK: 20 casos de series y 16 de tiempos. Ese verificador no
>   prueba BE: los mismos casos se corren contra el dominio de BE en `packages/domain/src/tiempos-y-series.test.ts`.
> - El paquete se copia íntegro en `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/`.
> - Entrega prevista: 2026-10-20.
>
> **Autorización:** desarrollo, migraciones aditivas en bases locales de prueba, pruebas reversibles, commits, push y PR
> en borrador. Quedan fuera el merge, el push a main, el despliegue, las bases remotas, la publicación de una APK, Gradle
> y cualquier gasto.
>
> **Base:** `9bf832b`, el cierre de Nutrición en `wp-nutricion-recetas` (#147). Esta rama es `wp-entrenamiento-series`
> y su PR va apilado sobre #147. Cuando #147 se integre, la base del PR pasa a ser la rama que lo reciba, sin reescribir
> la historia. No se mezcla con #146.
>
> **Dirección visual elegida:** `referencias/01_series_y_descanso_actualizado.png` es la principal; la 02 vale para la
> recuperación y la 03 solo para la composición general. Se aplican las trece excepciones de `REFERENCIAS_VISUALES.md`.
> En particular:
> - no hay calendario semanal ni días de descanso inventados;
> - se usan el logo y los íconos reales;
> - no hay +15 s ni comparación con la sesión anterior;
> - los números de las láminas son sintéticos y no se copian;
> - ningún dato ni lógica sale de los píxeles.

**Fuentes leídas:**
- **El paquete:**
  - `DECISIONES_Y_TIEMPOS.md`, que es la semántica de los tiempos;
  - `REFERENCIAS_VISUALES.md`, `ESTADO_REVISADO.md` y `ejercicios/CATALOGO.json`;
  - `datos/` (`sesion_demo.json`, `casos_series.json` y `casos_tiempos.json`) y `ACEPTACION.csv`.
- **06:**
  - REG-06-111 (unidad y significado identificables), REG-06-112 (instantánea al activar) y REG-06-128 (dos criterios
    de intensidad que se excluyen);
  - REG-06-130 a 132 (registro, condición y granularidad);
  - REG-06-134 a 136 (recurso didáctico versionado, con autoría y licencia obligatoria);
  - 06:1422-1462 (corrección y vista efectiva).
- **09v10:** §5 y §6 (estructura del plan), §9 (recurso didáctico con `provenance`; sin licencia se rechaza) y TRN-14 a
  21.
- **Repositorio:** el relevamiento del modelo vigente de prescripción, ejecución, catálogo, medios, pantallas de la APK,
  editor de la web, recuperación de sesión y brillo de las tarjetas.

## 1. Objetivo y demostrables

1. **El profesional prepara la sesión.**
   - Configura cada serie con su propio objetivo: repeticiones exactas o en rango, RIR objetivo, carga sugerida con
     unidad y descanso recomendado.
   - Lo común va en la prescripción y lo distinto en cada serie.
   - La vista previa de la web resuelve el mismo objetivo efectivo que recibe el teléfono.
2. **Sube la imagen de cada ejercicio por el flujo real:** subir, ver, guardar, reemplazar y retirar. La imagen va
   asociada a la identidad y la versión del ejercicio, con procedencia, licencia honesta y estado de revisión técnica.
3. **El asesorado entrena con la sesión enfocada:**
   - la imagen y la técnica del ejercicio activo;
   - una tabla compacta con lo planificado en gris;
   - registra cada serie y su RIR;
   - marca descansos y, si quiere, cronometra una serie;
   - pausa y finaliza.
4. **Los tiempos se guardan como eventos idempotentes.**
   - Cada tiempo tiene una calidad: medido, estimado, incompleto o sin dato.
   - Nada se inventa al reabrir la app.
5. **El profesional ve lo planificado frente a lo registrado:** los objetivos históricos, la carga, las repeticiones y
   el RIR informados, y los tiempos con su certeza. No hay puntajes, volumen, cumplimiento ni recomendaciones.
6. **Recuperación de sesión según la referencia 02.**
   - Hay un umbral de demora documentado.
   - Una falla de red no cierra la sesión.
7. **El brillo interno recortado de las tarjetas se corrige.**

**La demostración mínima, con cuentas sintéticas:**
1. el profesional crea los tres ejercicios y les carga los tres PNG del paquete;
2. arma «Piernas A» con los objetivos por serie de `sesion_demo.json` y la activa;
3. el teléfono recibe exactamente esos objetivos;
4. el asesorado inicia la sesión, registra series y RIR, mide descansos y una serie, y finaliza;
5. el profesional ve lo persistido.

## 2. Delta frente a lo que existe

| Tema | Hoy | Delta |
|---|---|---|
| Repeticiones por serie | Exactas o en rango, por serie | Se reusan tal cual |
| RIR objetivo | Uno por prescripción: el objetivo del criterio RIR, de 0 a 10 | **Por serie, con herencia** (§3) |
| Carga sugerida | Una por prescripción | **Por serie, con herencia** (§3) |
| Descanso | Solo como parámetro libre «Descanso» | **Campo estructurado** en la prescripción y en la serie (§3). El parámetro libre no se reinterpreta |
| Base de la carga y de las repeticiones | No existe | **Declarada en la prescripción** (§3) |
| Imagen del ejercicio | `didacticResources` siempre vacío; no hay tabla ni finalidad de medio | **Finalidad `EXERCISE_REFERENCE`** y asociación de solo agregar (§4) |
| Tiempos | No hay campos, tablas ni endpoints | **Eventos de tiempo** en el borrador de ejecución (§5) |
| RIR realizado | Admite null, de 0 a 20, con decimales | Se reusa: no se duplica ni se reduce a 0–5 |
| Serie realizada | Carga, repeticiones y RIR que admiten null; el cero explícito vale; confirmar exige carga o repeticiones | Se reusa |
| APK: sesión | Sin pestañas; la carga se precarga como valor; el RIR usa teclado numérico entero; no persiste nada localmente | **Sesión enfocada nueva** (§7) |
| APK: recuperación | «Verificando…» y tres bloques vacíos; el tiempo agotado cuenta como falta de red | **Pantalla de la referencia 02**, con umbral y causas distinguidas (§7.6) |
| APK: brillo | `BrilloDeVidrio` mide el contenido sin el relleno y deja una placa recortada | **Superficie mate** (§7.7) |

## 3. Objetivos por serie (DL-122)

**Modelo.** Se guarda en el JSON del plan, que ya es de solo agregar por versión. No hay tablas nuevas.
- **En la prescripción** (`PrescripcionEntradaSchema`):
  - `restSeconds`: entero de 0 a 3600, o `null`. 0 es «sin pausa», por ejemplo en una superserie;
  - `loadBasis`:
    - `SINGLE_IMPLEMENT`: una mancuerna o implemento;
    - `PER_IMPLEMENT`: por mancuerna o implemento;
    - `TOTAL_EXTERNAL`: carga externa total;
  - `repetitionBasis`: `PER_SET` o `PER_SIDE` (por lado, sin duplicar).
  
  Ausente o `null` es «no declarado». La UI no supone nada: no muestra «24 kg» por dos mancuernas de 12 ni duplica las
  repeticiones por pierna.
- **En la serie** (`SeriePrescriptaEntradaSchema`), tres campos nuevos (`rir`, `suggestedLoad` y `restSeconds`), cada
  uno con tres estados:
  - **ausente:** hereda de la prescripción;
  - **`null`:** la serie no tiene ese objetivo, aunque la prescripción lo tenga;
  - **un valor:** lo sobrescribe.
- **La resolución es una sola,** `objetivosEfectivos` en `packages/domain/src/objetivos-por-serie.ts`. Devuelve el
  objetivo de cada serie y su origen: `SET`, `PRESCRIPTION` o `NONE`. La usan:
  - la API, al responder;
  - el editor web, en la vista previa;
  - la APK.
  
  `null` es «sin objetivo», nunca cero. El cero es un valor: RIR 0, 0 kg o 0 s.

**Reglas.**
- **El RIR por serie existe solo si el criterio de la prescripción es RIR.**
  - Con %RM sería un segundo criterio (REG-06-128): el %RM rige para todas las series y conserva su referencia.
  - La carga sugerida es informativa.
  - No se convierte RIR en RPE ni %RM en kilos.
- **El RIR objetivo va de 0 a 10, con decimales,** igual que el de la prescripción. El RIR realizado sigue admitiendo de
  0 a 20.
- **Al guardar,** un RIR por serie sin criterio RIR o fuera de rango es `422 INTENSITY_CRITERION_INVALID`. Los motivos
  son `SET_RIR_WITHOUT_RIR_CRITERION` y `SET_RIR_OUT_OF_RANGE` (`problemasDeObjetivosPorSerie`).
- **El índice de una serie es su posición.**
  - No se guarda: igual que en la lectura vigente.
  - La identidad histórica de un objetivo es: versión del plan, prescripción e índice.
  - Una versión activada es inmutable y se lee desde su instantánea, así que el objetivo histórico no cambia.
- **Plantillas y habituales «sin cargas»** quitan también la carga de cada serie y conservan el RIR y el descanso
  (`sinCargasSugeridas` y `sinCargasDeLaSesion`).

**Lecturas.**
- **API-SER-01** (profesional) devuelve la versión de plan con, por serie:
  - lo declarado, con sus tres estados;
  - el objetivo efectivo y su origen;
  - la imagen de cada ejercicio.
- **API-SER-02** (titular) devuelve la sesión de una ocurrencia lista para registrar.
- API-TRN-09, 14 y siguientes, que lee la APK 0.13.2, **no cambian** (§8).

## 4. Imagen del ejercicio (DL-123)

- **Medio.**
  - Finalidad nueva `EXERCISE_REFERENCE` (base: `REFERENCIA_DE_EJERCICIO`), con su propia migración: PostgreSQL no usa
    un valor de enum nuevo en la misma transacción que lo crea.
  - Sube un profesional de Entrenamiento verificado y habilitado.
  - Se reusa toda la infraestructura de Nutrición:
    - intención y subida firmadas;
    - recodificación sin metadatos;
    - almacenamiento detrás de la interfaz;
    - acceso por PDP y auditado.
  - No se usa la finalidad de la foto de comida ni sus reglas.
- **Asociación** (`asociacion_de_imagen_de_ejercicio`).
  - Es de solo agregar, con número correlativo, como la de la receta.
  - Cada registro tiene:
    - ejercicio y versión;
    - acción, `ASOCIAR` o `RETIRAR`;
    - el medio;
    - texto alternativo, licencia y revisión técnica;
    - autor y momento.
  - Reemplazar es asociar de nuevo y retirar es un registro `RETIRAR`. El medio nunca se borra.
  - Se asocia por identidad (`exerciseId` y `exerciseVersionId`), nunca por coincidencia de nombre.
  - Solo se asocian imágenes a ejercicios propios (`PROFESSIONAL_MANUAL` del mismo profesional). El catálogo sembrado
    no recibe imágenes de profesionales (REG-06-135).
- **Licencia, obligatoria.**
  - Hay dos formas:
    - `NO_EXTERNAL_LICENSE`, con los términos de uso escritos;
    - `EXTERNAL`, con identificador, nombre y URL.
  - Nunca hay un valor por defecto.
  - Las tres imágenes de la demostración son generadas por IA para este encargo. Se cargan con:
    - procedencia `AI_GENERATED`;
    - autoría declarada;
    - `NO_EXTERNAL_LICENSE`, con el uso que dice `CATALOGO.json`;
    - revisión técnica `PENDING_PROFESSIONAL_REVIEW`.
  - No se les inventa una licencia ni se las declara CC0.
- **Rol.**
  - La imagen ilustra para reconocer el ejercicio, y la UI lo dice: no certifica la técnica.
  - No hay video.
- **Quién la ve:**
  - el profesional dueño;
  - el asesorado que tiene activado un plan de ese profesional que incluye el ejercicio, con acceso de Entrenamiento
    vigente.
  
  Es el mismo criterio que la visibilidad del catálogo. Lo demás es 404.
- **Historia.**
  - En API-SER-02 de una sesión ya registrada, la imagen es la vigente al registrar (`imagesAsOf`).
  - Si el medio ya no se puede leer, se conserva su identidad y se muestra el ícono de respaldo.
  - La instantánea del plan no cambia de formato.
- **API-TRN-13 sigue devolviendo `didacticResources: []`.** Poblarlo exige decidir qué es `resourceId` frente a la
  asociación, y no hace falta para el encargo. Queda anotado en DL-123.

## 5. Tiempos de la sesión (DL-124)

**Qué se afirma** (tabla de `DECISIONES_Y_TIEMPOS.md`):

| Tiempo | Cuándo existe | Qué no es |
|---|---|---|
| **Transcurrido de la sesión** | Con inicio y fin explícitos | Minutos de esfuerzo |
| **Sin pausas** | Descuenta las pausas declaradas | Tiempo bajo tensión |
| **Asociado al ejercicio** | Por los tramos de ejercicio activo | Tiempo haciendo repeticiones |
| **Descanso registrado** | Con inicio y fin explícitos, ligado a su serie | Que no entrenó mientras corría |
| **Duración medida de una serie** | Solo con un par válido de inicio y fin | — |

Nunca se crea un descanso ni una serie medida porque haya dos registros seguidos.

**Eventos** (`EventoDeTiempoSchema`).
- **Tipos:**
  - `SESSION_STARTED`, `SESSION_PAUSED`, `SESSION_RESUMED` y `SESSION_FINISHED`. El fin tiene dos resoluciones:
    `FINISHED` y `LEFT_INCOMPLETE`;
  - `EXERCISE_ACTIVATED`;
  - `REST_STARTED` y `REST_FINISHED`;
  - `SET_TIMING_STARTED` y `SET_TIMING_FINISHED`;
  - `MEASUREMENT_LEFT_INCOMPLETE`.
- **Cada evento lleva:**
  - `eventId`, generado por el cliente;
  - `runId`, la identidad de la sesión en curso;
  - `sequence`, el orden causal, sin huecos;
  - `compoundActionId`, si la acción es compuesta;
  - un instante con el reloj civil, el monotónico con su ancla de proceso y el origen: `MONOTONIC`,
    `RECOVERED_WALL_CLOCK` o `DECLARED`.
- **Abrir la técnica no es un evento.**

**Reglas** (`aplicarEventos`, en `packages/domain/src/sesion-de-entrenamiento.ts`, igual en la API y en la APK).
- **Duplicados y conflictos.**
  - Un evento repetido con el mismo contenido es `DUPLICATE` y no suma.
  - El mismo identificador con otro contenido es `CONFLICT`: no reemplaza en silencio.
  - Otra secuencia ocupada también es `CONFLICT`.
  - Un hueco es `SEQUENCE_GAP`.
  - Desde el primer evento que no se registra, los siguientes del pedido no se procesan.
- **Una sola corrida por borrador y una sola sesión en curso por titular.** Un segundo inicio desde otro dispositivo es
  `SESSION_ALREADY_STARTED`, y otra sesión en curso es `ANOTHER_SESSION_IN_PROGRESS`. Los relojes de dos dispositivos
  no se mezclan: lo que cruza procesos es estimado.
- **Mediciones.**
  - A lo sumo una medición abierta: un descanso o una serie cronometrada.
  - En pausa no se mide nada.
  - Para pausar, primero se cierra lo abierto. La APK lo hace como acción compuesta: finaliza el descanso y pausa.
  - La acción compuesta «finalizar descanso e iniciar serie» queda auditada con su `compoundActionId`.
- **El descanso queda ligado a la serie que lo originó**, aunque después se enfoque otra fila. Cambiar de ejercicio
  durante un descanso es legítimo.
- **Al finalizar,** lo abierto se resuelve primero: «terminó ahora», que es `DECLARED`, o «dejarla incompleta». Dejar
  la sesión incompleta (`LEFT_INCOMPLETE`) no afirma cuándo terminó: nunca se cierra a la hora de reabrir.
- **Eventos después de registrar la ejecución.** Se aceptan mientras la corrida no esté cerrada: así llegan los que el
  teléfono tenía pendientes. Después, `SESSION_FINISHED`. Lo que llega tarde conserva su secuencia y sus instantes, y
  `receivedAt` no reemplaza al reloj de la sesión.

**Cálculo** (`calcularTiempos`).
- **La sesión, los ejercicios y lo no asignado** salen de una sola línea de tiempo. Es monotónica si todo se tomó en el
  mismo proceso. Si no, es civil y la calidad es `ESTIMATED`.
- **Los descansos y las series** salen de su propio par de instantes, cada uno con su calidad.
- **El descanso trae su recomendado histórico,** el de la instantánea para esa prescripción y esa serie, y la diferencia
  sin juicio: «01:45 registrado · 01:30 recomendado · +00:15».
- **Resolución interna:** el milisegundo. Se redondea solo al mostrar.

**Los relojes en Android.** El reloj monotónico que lee la app (`performance.now()`, CLOCK_MONOTONIC) no avanza
mientras el teléfono duerme.
- Si el reloj civil se adelanta al monotónico más de 2 s (`TOLERANCIA_ENTRE_RELOJES_MS`), el teléfono pudo haber
  dormido, o alguien adelantó la hora. La duración sale del civil y es `ESTIMATED`.
- Si el civil retrocede, el monotónico sigue valiendo (caso T11).
- Lo que se muestra mientras corre se recalcula desde los instantes (`enVivo`), nunca sumando ticks. La API no recibe
  un evento por segundo.

**Medianoche.**
- La ocurrencia es la fecha local de inicio.
- Una sesión que cruza la medianoche sigue en su borrador, y la APK la retoma por API-TIE-04 aunque ya sea otro día.
- La resta de instantes no depende de la zona.

**Privacidad.**
- **Quién ve los tiempos:** el titular y el profesional del plan, con las mismas reglas que la ejecución (API-TRN-19).
- **Qué no se captura:** ubicación, audio, cámara, sensores ni datos de terceros.
- **Al primer uso, la APK dice:** «Guardamos los tiempos que marcás para que vos y tu entrenador puedan revisarlos».

## 6. Operaciones

Todas son nuevas y van en familias propias, declaradas en la guardia de trazabilidad: SER (DL-122), EJE (DL-123) y TIE
(DL-124).

| ID | Método y ruta | Quién | Notas |
|---|---|---|---|
| API-SER-01 | GET `/training/plans/{planId}/detail` | Profesional del plan | La versión de plan con objetivos por serie, bases e imágenes |
| API-SER-02 | GET `/training/occurrences/{occurrenceId}/session` | Titular | Sesión para registrar. Una ocurrencia que no puede ejecutar y sin borrador ni ejecución es 404 |
| API-TIE-01 | POST `/training/execution-drafts/{draftId}/timing-events` | Titular | Hasta 30 eventos. Responde por evento (`RECORDED`, `DUPLICATE`, `CONFLICT` o `REJECTED`) y los tiempos. Sin Idempotency-Key: la identidad es la del evento |
| API-TIE-02 | GET `/training/execution-drafts/{draftId}/timing` | Titular | Tiempos y eventos, para retomar |
| API-TIE-03 | GET `/training/executions/{executionId}/timing` | Titular y profesional, como TRN-19 | |
| API-TIE-04 | GET `/me/training/session-in-progress` | Titular | La sesión en curso de cualquier día, o `null` |
| API-EJE-01 | GET `/training/own-exercises` | Profesional de Entrenamiento | Ejercicios propios con su imagen vigente, hasta 500 |
| API-EJE-02 | PUT `/training/exercises/{exerciseId}/image` | Profesional dueño | Idempotency-Key y `expectedImageVersion` (0 si no tenía). 409 `VERSION_CONFLICT`; 422 `MEDIA_REFERENCE_INVALID` o `EXERCISE_REFERENCE_INVALID` |
| API-EJE-03 | DELETE `/training/exercises/{exerciseId}/image?expectedImageVersion=N` | Profesional dueño | Idempotency-Key. Retira sin borrar |

Cambian además:
- **API-TRN-07 y 10:** su entrada admite los campos de §3. Las usa solo la web.
- **API-MED-01 y 03:** la finalidad nueva y su regla de acceso.

Las respuestas que lee la APK 0.13.2 no cambian (§8).

## 7. UX

### 7.1 Entrada (APK)
- **Destinos y pestañas.**
  - Siguen los cinco destinos.
  - Dentro de Entrenamiento hay tres pestañas: **Hoy**, **Plan** e **Historial**. Se reusa `Pestanas` de Nutrición.
- **Hoy:**
  - las sesiones del plan vigente que se pueden hacer hoy (todas, como ahora), cada una con «N ejercicios · M series» y
    su estado;
  - la acción es «Iniciar entrenamiento», o «Continuar entrenamiento» si hay una en curso;
  - «Registrar otro día» queda como acción secundaria.
- **Plan:**
  - las sesiones del plan en su orden, con sus ejercicios, imágenes y objetivos por serie, en solo lectura;
  - sin calendario y sin días de descanso.
- **Historial:** el de hoy, más los tiempos de cada sesión registrada.

### 7.2 Sesión enfocada
- **Sin barra inferior.** La navegación es segura y conserva el estado al salir y volver.
- **Arriba:**
  - volver, el nombre de la sesión y un temporizador discreto, «Sesión 04:12», que muestra el tiempo sin pausas;
  - «Ver rutina», que es una acción explícita.
- **El ejercicio activo:**
  - su imagen, de 112 dp (en el rango de 100 a 140), o un ícono de respaldo si no tiene;
  - su nombre, «Ejercicio 1 de 3» y «Ver técnica».
- **«Ver técnica»** muestra:
  - la imagen grande, su texto alternativo y su rol;
  - procedencia, autoría, licencia y revisión técnica;
  - las notas.
  
  Ver la técnica de otro ejercicio desde «Ver rutina» no cambia el activo. Volver deja la misma fila, el mismo borrador y
  el mismo objetivo.
- **«Siguiente ejercicio» es explícito:** no se avanza solo.

### 7.3 Tabla de series
- **Columnas:** Serie, carga con unidad (y su base si está declarada), Rep. y RIR.
- **La fila activa** se marca con borde y con el texto «Serie actual».
- **Las filas guardadas** muestran sus valores y «Guardada».
- **Con texto grande,** la tabla pasa a tarjetas apiladas.
- **Placeholders:**
  - muestran el objetivo de esa serie en un gris accesible, y nunca se envían;
  - sin objetivo, dicen «Sin objetivo».
- **Banda persistente:** «Plan de la serie N: 16 kg · 12–16 rep. · RIR 3 · Descanso recomendado 01:30».
- **El RIR** es opcional, con la ayuda «Cuántas repeticiones más creés que podrías haber hecho manteniendo la técnica»
  y el ejemplo «RIR 2: creés que te quedaban 2 repeticiones».
  - Admite 0 y decimales, con teclado decimal.
  - Nunca se calcula.
- **Teclados:** decimal para la carga y el RIR; entero para las repeticiones.
- **Carga.** Se distinguen tres casos:
  - 0 kg informado;
  - sin carga prescrita, que dice «Sin objetivo»;
  - carga no informada, que queda vacía.
  
  No se compara kg con lb.
- **«Registrar serie N»** guarda solo lo escrito.
  - Está deshabilitado sin carga ni repeticiones, con «Anotá la carga o las repeticiones que hiciste».
  - No se ofrece «Realizada sin detalle»: el dominio exige carga o repeticiones para confirmar (`SET_WITHOUT_DATA`).
  - Nunca se fabrica una serie.
  - Un doble toque es una sola operación.
- **Guardar una serie no inicia un descanso.**

### 7.4 Descanso, serie cronometrada y pausa
- **Descanso.**
  - Al pie: «Descanso · Recomendado tras la serie N: 01:30» y «Iniciar descanso».
  - Mientras corre: «Descanso · Serie N», el conteo ascendente, «Recomendado: 01:30», «Finalizar descanso» y «Al
    terminar, seguís con la serie N+1».
  - El aro es apoyo visual: no termina el descanso al completarse.
  - No hay +15 s ni cierre automático.
- **«Cronometrar serie»** es opcional.
  - Inicia y finaliza la medición de esa serie.
  - Con un descanso en curso, la acción compuesta «Finalizar descanso e iniciar la serie N» queda auditada.
- **«Pausar sesión» y «Reanudar sesión».** Si hay una medición abierta, pausar la finaliza primero, en la misma acción.
- **Lectores de pantalla.** No se anuncia el conteo cada segundo: solo el inicio y el fin.
- **Movimiento reducido.** El aro no se anima.

### 7.5 Finalizar
- **Antes de finalizar** se ve un resumen:
  - por ejercicio, «N de M series registradas» y las que quedan «Sin registrar» (DL-106 sigue: la ausencia no es «no
    realizada»);
  - los tiempos;
  - las mediciones abiertas para resolver;
  - la condición de la sesión, como hoy.
- **Finalizar** manda `SESSION_FINISHED` y después confirma el borrador (API-TRN-18).
- **Persistencia local.**
  - Se guarda por cuenta: la sesión en curso, los eventos pendientes y las series pendientes.
  - Se distinguen cuatro estados: pendiente en el teléfono, sincronizado, error recuperable con «Reintentar», y
    conflicto (otro dispositivo cambió el borrador).
  - Un conflicto no se pisa: se muestra y se resuelve.
- **Si la app se cerró con mediciones abiertas,** al volver se pregunta: «La app se cerró con mediciones abiertas. No
  las cerramos por vos: decidí qué pasó».

### 7.6 Recuperación de sesión (referencia 02)
- **Mientras comprueba:**
  - el isotipo y «BE» reales, con «Ambiente de prueba»;
  - «Preparando tu espacio» y «Comprobando tu sesión»;
  - un indicador de actividad, estático con movimiento reducido;
  - «Un momento, por favor».
  
  Sin porcentajes.
- **Umbral de demora: 5 s.** Pasado ese tiempo:
  - dice «Está tardando más de lo habitual» y «Todavía no pudimos comprobar tu sesión»;
  - ofrece «Podés volver a intentarlo sin cerrar la app» y «Reintentar»;
  - avisa «Si continúa, revisá tu conexión».
  
  El pedido sigue hasta su tope de 10 s.
- **Causas distinguidas:**
  - **sin conexión:** el pedido falló sin respuesta;
  - **tiempo agotado:** pasaron los 10 s;
  - **servicio no disponible:** 5xx o 429;
  - **credencial inválida:** solo esta vuelve a iniciar sesión.
  
  Una falla de red no borra la credencial ni cierra la sesión. Los borradores locales quedan aislados por cuenta.

### 7.7 Brillo de las tarjetas
- **Causa.** `BrilloDeVidrio` dibujaba un SVG de 100 % que React Native 0.86 mide contra el contenido sin el relleno
  (`AbsolutePercentAgainstInnerSize`). Quedaba una placa luminosa recortada 16 a 24 dp antes del borde.
- **Corrección.** Superficie mate uniforme con su borde, sin el degradado interno. Es lo que pide la excepción 13 de
  `REFERENCIAS_VISUALES.md`.
- La verificación en Android queda pendiente del teléfono: el render del navegador no usa Yoga.

### 7.8 Web del profesional
- **Editor de la prescripción.**
  - Por serie: repeticiones, RIR (con criterio RIR), carga sugerida y descanso.
  - Cada celda muestra lo heredado como placeholder: escribir sobrescribe, vaciar vuelve a heredar, y «Sin objetivo»
    quita el objetivo.
  - En la prescripción: el descanso recomendado, la base de la carga y la de las repeticiones. El atajo que agregaba un
    parámetro «Descanso» se reemplaza por el campo estructurado; los parámetros existentes se muestran como estaban.
  - «Así lo ve tu asesorado»: la vista previa con `objetivosEfectivos`.
  - Un aviso dice que la APK 0.13.2 muestra solo los valores generales de cada prescripción (§8).
- **«Mis ejercicios»** (`/pro/exercises`): los ejercicios propios, con su imagen. Se puede subir, ver, guardar con sus
  datos, reemplazar y retirar.
- **Ejecuciones.**
  - Por serie, el objetivo histórico frente a la carga, las repeticiones y el RIR informados. La relación es
    descriptiva: dentro del rango, por debajo, por encima.
  - Los tiempos de la sesión, cada uno con su calidad y su explicación.
  - Sin puntajes.

## 8. Compatibilidad

- **Las respuestas que lee la APK 0.13.2 no cambian.**
  - Son 12 operaciones TRN:
    - 08 y 09;
    - 13 a 20;
    - 14-PERIODO y 19-LISTA.
  - Se suman las 4 NUT de antes.
  - Sus formas están congeladas en `packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json`. Se generaron
    compilando las fuentes del tag `be-apk-0.13.2` y dan igual que las de `9bf832b`.
  - La prueba C01 exige que sigan iguales.
- **Lo nuevo va en operaciones nuevas.** No se agrega ningún campo a una respuesta que la APK valide estrictamente, y no
  se flexibiliza ninguna validación.
- **Los datos viejos no se reinterpretan.**
  - Un parámetro libre «Descanso» sigue siendo un parámetro y no se convierte en descanso estructurado.
  - Una ejecución registrada sin tiempos sigue sin tiempos: no se le calcula ninguno.
- **Lo que no se puede evitar.**
  - La APK 0.13.2 lee la prescripción con su forma vieja: ve la intensidad y la carga **de la prescripción**, no las de
    cada serie.
  - Si el profesional sobrescribe por serie, esa APK muestra el valor general.
  - El editor lo avisa, y DL-122 deja a Dirección la decisión de una versión mínima antes de usarlo con personas.

## 9. Modelo (migraciones aditivas, solo en bases locales)

1. **`…_finalidad_referencia_de_ejercicio`:** `ALTER TYPE "FinalidadDeMedio" ADD VALUE 'REFERENCIA_DE_EJERCICIO'`.
   Es una migración propia.
2. **`…_imagen_y_tiempos_de_entrenamiento`:**
   - la tabla `asociacion_de_imagen_de_ejercicio`, de solo agregar, con número correlativo único por ejercicio y un
     trigger que exige un medio de esa finalidad, propio y disponible;
   - la tabla `evento_de_tiempo_de_entrenamiento`, de solo agregar:
     - borrador, titular, corrida y secuencia (únicos);
     - identificador del evento, único por borrador;
     - tipo, contenido JSON, instante civil, monotónico y origen;
     - recomendado histórico del descanso;
     - recepción;
   - los índices.
   - Sin TRUNCATE.

El plan no cambia de tablas: los objetivos por serie viajan en su JSON.

## 10. Decisiones reversibles de este paquete

Cada una tiene un motivo, y se puede cambiar sin migrar datos de personas:

1. **RIR por serie solo con criterio RIR, de 0 a 10.** Es la regla de un solo criterio (REG-06-128) y el mismo rango
   que la prescripción.
2. **Descanso de 0 a 3600 s, entero.** 0 es una superserie: es explícito, no ausencia.
3. **Base de carga con tres valores y de repeticiones con dos, en la prescripción.** Con un enum, la tabla puede
   decir «kg por mancuerna» sin calcular nada.
4. **El descanso estructurado reemplaza al atajo del parámetro libre.** Los parámetros existentes no se tocan.
5. **Lecturas nuevas (SER-01 y SER-02)** en lugar de ampliar API-TRN-09 o 14, que lee la APK instalada.
6. **La imagen va en una historia de solo agregar.** Se resuelve a la fecha del registro. La instantánea no cambia de
   formato.
7. **Licencia en dos formas, sin valor por defecto.** Las imágenes de IA van sin licencia externa, con sus términos de
   uso.
8. **Los eventos cuelgan del borrador.** Se acepta una corrida por borrador y una en curso por titular, con
   `LEFT_INCOMPLETE` para cerrar sin afirmar el fin.
9. **Pausar exige cerrar la medición abierta.** La APK lo hace en una acción compuesta.
10. **Tolerancia de 2 s entre relojes.** Pasada esa tolerancia, la duración es estimada (§5).
11. **El temporizador de la cabecera muestra el tiempo sin pausas.** Se congela en pausa.
12. **No hay «Realizada sin detalle».** El dominio exige carga o repeticiones para confirmar.
13. **El umbral de demora de la recuperación es de 5 s;** el tope del pedido sigue en 10 s.
14. **El brillo se resuelve con una superficie mate.**
15. **La imagen de la sesión enfocada mide 112 dp.**

## 11. Pruebas y evidencia

| ACEPTACION.csv | Dónde se prueba |
|---|---|
| P01, P02 | Dominio (`entrenamiento-por-serie.test.ts`, con `sesion_demo.json`) e integración de la API (guardar, leer SER-01 y SER-02) |
| P03, P04, P05 | Integración de medios y de la imagen (finalidad, PDP, otro profesional, otro asesorado); recorrido web → API → APK renderizada |
| M01 a M04 | Componentes de la APK (placeholders nunca enviados, RIR null, 0 y decimal, carga 0, vacío, doble toque) e integración (idempotencia y conflicto) |
| M05 | Recorrido de la APK: ir a la técnica y volver conserva fila, borrador y objetivo |
| T01 a T05, T08 | Dominio, con reloj inyectado, contra `casos_tiempos.json` y el ejemplo principal; integración de API-TIE-01 a 04 (duplicados, tardíos, otro dispositivo) |
| T06, T07 | Dominio para la lógica (reinicio, reloj civil, divergencia); **Android pendiente** (pantalla bloqueada, muerte del proceso) |
| H01, H02 | Web y API: vista del profesional; editar el plan o la imagen después no reescribe lo registrado |
| R01 a R03 | Lógica de recuperación de la APK (causas, umbral, sin cierre de sesión) y aislamiento por cuenta |
| C01 | Dominio (formas congeladas) e integración (las respuestas de la APK instalada no cambian) |
| V01 | Renders de componentes: 360, 390 y 412 de ancho × Azul noche y Claro × escala 1, 1,3 y 2 |
| V02 | **Android pendiente:** teclado real, TalkBack y zona segura |
| N01 a N03, E01 | Cerrados en el cierre de Nutrición (`9bf832b`), #146 y #148; evidencia final en `EVIDENCIA/ENTRENAMIENTO-SERIES/` |

- **Android.** Los casos que necesitan Android quedan pendientes: no se sustituyen por renders del navegador. No se
  construye una APK en este encargo.
- **Datos.** Son sintéticos y entran por los flujos reales. No hay datos personales ni credenciales en capturas,
  registros ni Git.

## 12. Fuera de alcance

- **Una serie declarada «no realizada»:** sigue DL-106.
- **RIR o %RM por serie con otro criterio,** RPE y tempo estructurado.
- **Alternativas preaprobadas:** PF03-D-4.
- **Video y `didacticResources` en API-TRN-13.**
- **Corregir eventos de tiempo:** los tiempos son lo que se marcó, con su calidad. Corregir la ejecución (API-TRN-20)
  sigue igual.
- **La APK nueva, su compilación y su publicación,** el merge y el despliegue.

## 13. Deudas (DEUDA_LEGAJO)

- **DL-122:** objetivos efectivos por serie.
- **DL-123:** imagen del ejercicio con licencia, procedencia y revisión técnica.
- **DL-124:** tiempos de la sesión como eventos con calidad.

Las tres están decididas por el encargo. Las decisiones que quedan para Dirección figuran en cada entrada.

## 14. Estado de la implementación

| Parte | Estado |
|---|---|
| Dominio: contratos, resolución, eventos, cálculo, textos y formas congeladas | Hecho el 2026-10-06; 499 pruebas del dominio y la guardia de trazabilidad, verdes |
| API: migraciones, servicios, endpoints e integración | En curso |
| Web: editor por serie, «Mis ejercicios» y vista de ejecuciones | En curso |
| APK: pestañas, sesión enfocada, tiempos, persistencia, recuperación y brillo | En curso |
| Recorrido y evidencia | Pendiente |
