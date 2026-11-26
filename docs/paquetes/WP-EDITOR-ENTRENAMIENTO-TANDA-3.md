# WP-EDITOR-ENTRENAMIENTO-TANDA-3 · El editor de Entrenamiento, tanda 3 (DL-199)

**Estado:** PROGRAMADO en `wp-editor-entrenamiento-tanda-3`, que salió de la tanda 2 (#325, ya integrada; la rama la unió
con `git merge origin/main`). PR en borrador, sin integrar. Las decisiones ET3-D01 a ET3-D39 están **a ratificar** por
Dirección. Las cuatro **Plantillas de BE** de la semilla son una **propuesta, a validar por Elián**.

**Origen.** El encargo del 2026-11-25 para la prueba completa de Dirección (Elián, licenciado y entrenador): «la calidad
tiene que ser excelente y la estética primordial». Seis puntos, en este orden: las Plantillas de BE curadas por
Administración, la sugerencia de progresión desde lo que hizo la persona, el cardio, reordenar y «Deshacer», lo BAJA de
las tandas 1 y 2 y la pasada de densidad del editor (E5).

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. La jerarquía del plan (B10-06), el criterio de intensidad
por ejercicio (uno o ninguno, REG-06-128), el RPE como otra forma de escribir el RIR (DL-192), la progresión como regla de
la fase (EE-D30), las aproximaciones de DL-178, el 1RM de referencia de DL-198 y «ubica, no califica»: nada de rojo ni
verde de juicio.

---

## 1. Requisitos

### Las Plantillas de BE (ET3-01 a ET3-06)

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET3-01 | **Cuatro planes completos de BE**, con su planificación: «Cuerpo completo · 3 días», «Torso y pierna · 4 días», «Empuje, tracción y pierna · 3 o 6 días» y «Por grupo muscular · 5 días». Cada uno con dos fases por semanas, aproximaciones «Por %» en los principales, progresión (lineal o doble, con una semana de descarga) e intensidad del plan en % RM. | `packages/domain/src/plantillas-de-be.ts` (`PLANTILLAS_DE_BE`, `armarPlantillaDeBe`) |
| ET3-02 | **En «Empezar desde una plantilla»**, un selector de origen «Mis plantillas · Plantillas de BE», como el del Recetario de BE. Las de BE se leen la primera vez que se eligen; cada una dice su división, sus días y semanas y la marca «Propuesta, a validar por Elián»; la elegida muestra sus fases (semanas y progresión), sus sesiones y sus ejercicios («3 × 10 · 65 % RM») en una vista con alto reservado, sin correr la lista. | `pro/advisees/empezar-desde-plantilla.tsx`, `training/plan.tsx`, `globals.css` (bloque DL-199 de «Empezar desde una plantilla») |
| ET3-03 | **Al aplicarla a una persona, BE resuelve cada carga en % RM con el 1RM de esa persona** (el que usa BE en DL-198, de este profesional): la carga común redondeada al paso del implemento, la referencia con el origen del 1RM («1RM 100 kg · declarado el …») y las aproximaciones arriba. Sin 1RM, la carga queda «Sin indicar» y se dice. El aviso: «4 de 6 cargas en % RM salen del 1RM de la persona; las otras quedan para completar. Sin 1RM, para completar: …». | `conLasCargasDeLaPlantillaDeBe`, `resumenDeLasCargas`; API-TPB-02 en `planes.service.ts` (`crearDesdePlantillaDeBe`); `uno-rm.service.ts` (`vigentesDe`) |
| ET3-04 | **El plan nace como desde una plantilla propia:** el PDP de Entrenamiento con la persona, el objetivo efectivo, un solo borrador, el hecho y la auditoría; la planificación pasa a cada fase y ejercicio del plan nuevo por su lugar (`planificacionDesdeLaPlantilla`). | `planes.service.ts` (`crearVersionBorrador`, `desdePlantillaDeBe`) |
| ET3-05 | **Administración las cura:** `/admin/training-templates` (en el menú) las muestra todas con su contenido, su estado y su historia (quién, cuándo y por qué), y las **retira** (con un motivo opcional) o las **vuelve a ofrecer**. Retirada, no se lista ni se aplica; los planes que ya salieron de ella no cambian. | API-TPB-03 y 04, `administracion/plantillas-de-be-admin.service.ts`, `admin/training-templates/` |
| ET3-06 | **El catálogo de cada entorno:** cada ejercicio se nombra por su número de wger (el catálogo base de DL-141) y se resuelve, al leer y al aplicar, a la versión vigente disponible del ejercicio que lo representa. Lo que no está, no entra, y se dice. | `apps/api/src/entrenamiento/plantillas-de-be.ts` (`catalogoDeLasPlantillasDeBe`) |

### La sugerencia de progresión y el cardio (ET3-10 a ET3-15)

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET3-10 | **«+2,5 kg la próxima», con su motivo** («Hizo las 3 series con 10 repeticiones a RIR 2 o más y 60 kg el 24 nov.»), si en la última vez registrada hizo todas las series efectivas con el tope del rango, el RIR pedido o más (en RPE, el pedido o menos) y la carga planificada (doble progresión). | `packages/domain/src/sugerencia-de-progresion.ts` |
| ET3-11 | **En el panel del ejercicio**, arriba de la carga, desde la misma lectura de «La vez pasada» (API-TRN-21): sin pedidos nuevos. | `panel-del-editor.tsx`, `training/sugerencia-de-progresion.tsx` |
| ET3-12 | **«Aplicar» o «Descartar»; nunca cambia nada solo.** «Aplicar» escribe por el cambio del editor (lo toma «Deshacer»); «Descartar» se recuerda por ejercicio y por vez registrada. El «?» en la esquina con un ejemplo resuelto; sin colores de juicio; el renglón, reservado. | `sugerencia-de-progresion.tsx` |
| ET3-13 | **El cardio en el editor:** duración en minutos, distancia opcional (km o m) e intensidad (zona 1 a 5, esfuerzo de 0 a 10 o en palabras), en lugar de la planilla de series; sin aproximaciones, «Editar todas», criterio, escritura rápida ni 1RM. Lo que no entra queda en su campo, marcado, con el motivo en un renglón reservado. | `training/cardio-del-ejercicio.tsx`, `packages/domain/src/cardio-de-la-prescripcion.ts` |
| ET3-14 | **El renglón del cardio**, «30 min · 12 km · zona 2»: plegado en el editor, en «Ver como la persona» y en la app (sale de `renglonDelEjercicio`, en el dominio). | `lectura-del-plan-de-entrenamiento.ts`, `vista-de-la-persona.tsx` |
| ET3-15 | **Un ejercicio del grupo Cardio** (clasificación de DL-197) entra como cardio desde «Agregar ejercicios»; en «Más», «Cargar como cardio» y «Cargar con series». En «Antes de activar», un cardio sin duración es `INCOMPLETO_CARDIO_SIN_DURACION`, y no se le piden repeticiones ni intensidad. | `editor.tsx`, `revisar-el-plan.ts`, `editor-del-plan-de-entrenamiento.ts` |

### Reordenar, «Deshacer» y lo BAJA de las tandas 1 y 2 (ET3-20 a ET3-29)

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET3-20 | **«Deshacer»:** una pila de hasta 20 estados (la estructura, la planificación y la agenda), que se llena con cada cambio y se vacía al cargar; los identificadores que pone cada guardado pasan también a lo apilado. | `training/deshacer-del-editor.ts`, `editor.tsx` |
| ET3-21 | **Ctrl+Z (Cmd+Z)** fuera de campos y cuadros. Un cambio grande (quitar un ejercicio, una sesión, una semana o una fase; pasar a la intensidad del plan; aplicar una progresión) muestra «Quitaste «X». Deshacer» 8 segundos en el aviso flotante, que se queda mientras el foco o el puntero estén encima. | `editor.tsx` |
| ET3-22 | **Arrastrar** desde un asa de 44 px siempre visible; soltar marca el lugar con una sombra que no corre nada, y el ejercicio se mueve con la regla de «Subir/Bajar» (un bloque no se rompe). | `training/arrastrar-ejercicios.tsx`, `training/reordenar.ts` (`moverHasta`), `ejercicio-del-editor.tsx` |
| ET3-23 | **Con el teclado:** Alt+↑/↓ en el ejercicio y ↑/↓ con el foco en el asa; el foco acompaña al ejercicio y el lector oye «quedó en el lugar 2 de 3». | los mismos |
| ET3-24 | **El catálogo de «Agregar ejercicios», en caché:** se lee una vez por sesión de la pestaña (10 minutos, un pedido compartido entre las dos pantallas); crear, importar o reclasificar un propio lo invalida. | `training/catalogo-en-la-sesion.ts`, `pro/exercises/catalogo-de-be.tsx` |
| ET3-25 | **Si la lectura corta:** se ve lo leído y el renglón reservado dice «Se cargaron N ejercicios; faltan otros. Reintentar». No se guarda en la caché. | `agregar-ejercicio.tsx`, `catalogo-de-be.tsx` |
| ET3-26 | **Desmarcar una aproximación** le devuelve el descanso común (y el RIR común). | `aproximaciones.ts` (`serieAlDesmarcarLaAproximacion`) |
| ET3-27 | **«Catálogo de BE» filtra por quién lo cargó** (ningún profesional), no por la procedencia: la búsqueda con la clasificación suma `loadedByProfessional`. | `catalogo.service.ts`, `contratos-entrenamiento.ts`, `catalogo-de-be.tsx` (`esDelCatalogoDeBe`) |
| ET3-28 | **«Días de la semana»:** una sola parada de Tab por fila, con las flechas adentro. | `cuadros-del-plan.tsx` |
| ET3-29 | **La barra de fases:** el `tablist` queda solo con `aria-label`. | `barra-de-fases-en-pantalla.tsx` |

### La pasada de densidad (E5, ET3-30 en adelante)

Ver §6.

## 2. El contrato

- **API-TPB-01** `GET /training/be-templates` (SESSION): las que se ofrecen, para cualquier profesional de Entrenamiento
  (lo demás, 403). Cada una con su clave, su versión, la división, los días, las semanas, la intensidad, `validation`
  (`PROPOSAL`) y cada fase con sus sesiones y ejercicios (`exerciseId` o `null` si no está en el catálogo).
- **API-TPB-02** `POST /advisees/{adviseeId}/training/plans/from-be-template` (SESSION, `Idempotency-Key`): con
  `objectiveVersionId`, `templateKey`, `templateVersion` y, opcional, `effortNotation`. Responde el borrador (como
  API-TRN-07) y `beTemplate`: `loads` (por ejercicio en % RM: `RESOLVED` con `load` y `basis`, o `WITHOUT_ONE_REP_MAX`) y
  `unavailableExercises`. Otra versión: 409 `RESOURCE_CONFLICT` (`BE_TEMPLATE_VERSION_CHANGED`, con `currentVersion`);
  retirada: 422 `TEMPLATE_ARCHIVED`; clave inexistente o persona ajena: 404.
- **API-TPB-03** `POST /admin/training-templates/query` y **API-TPB-04** `POST /admin/training-templates/{templateKey}/decisions`
  (SESSION_MFA; la 04 con `Idempotency-Key`): `PUBLISH` o `WITHDRAW` (con `reason` opcional, solo al retirar). El mismo
  estado: 422 `INVALID_STATE_TRANSITION`.
- **Migración aditiva** `20261126120000_plantillas_de_be`: el tipo `EstadoDePlantillaDeBe` y la tabla
  `decision_sobre_plantilla_de_be`, **de solo agregar** (ni UPDATE, ni DELETE, ni TRUNCATE), con la clave validada, el
  motivo solo al retirar y la decisión de un administrador con su rol vigente (en la base).
- **API-TRN-13-BUSQUEDA** suma `loadedByProfessional`, opcional, **solo con `withClassification`** (la APK no la pide).
- **El cardio no cambia el contrato** (ET3-D13): va en los parámetros del profesional de siempre.
- La familia TPB es propia de BE (`scripts/trazabilidad-de-operaciones.test.cjs`); el OpenAPI de Entrenamiento tiene 84
  operaciones. `docs/api/openapi.json` regenerado.
- **La APK:** no lee nada nuevo. Ninguna lectura nueva que congelar (DL-152).

## 3. Decisiones a ratificar

| Id | Decisión |
| --- | --- |
| ET3-D01 | **Las Plantillas de BE son datos versionados de BE**, en el dominio, y no filas creadas por un comando como el Recetario (DL-191): así están en todos los entornos (test incluido) sin correr una semilla a mano, y nombran los ejercicios por su número de wger. Las cura Dirección: corregirlas es una versión nueva en el código. **Administración decide si cada una se ofrece o se retira**, con su historia por adición; sin ninguna decisión, se ofrece. |
| ET3-D02 | **La semilla: cuatro, una por división**, con lo clásico de un gimnasio argentino (barra, mancuernas, poleas y máquinas comunes): los principales en % RM del 60 al 82 %, con tres aproximaciones; los accesorios con repeticiones. Dos fases cada una (base y más pesada), progresión lineal de 2,5 kg por semana (doble de 8 a 10 en la primera fase de empuje, tracción y pierna) y descarga al 85 % de la carga en la última semana. Dicen **«Propuesta, a validar por Elián»** en pantalla y en Administración hasta que Dirección las valide. |
| ET3-D03 | **El 1RM que resuelve las cargas** es el que usa BE para ese profesional con esa persona (la regla de API-RMX-01, ET2-D03), resuelto en la API al aplicar, dentro de la misma transacción. La carga, redondeada al paso del implemento (EE-D03, ET1-D06); la referencia del % RM, con el origen del 1RM (la que ve la persona); las aproximaciones «Por %», arriba. **Sin 1RM, la carga queda sin indicar** y no se generan aproximaciones: se completa a mano, o se calibra y se usa «Poner las cargas desde el 1RM» (ET2-D12). Nada se inventa. |
| ET3-D04 | **Los accesorios van sin intensidad** (`withoutIntensity`): con repeticiones y la carga «Sin indicar». Pedirles un 1RM a un curl o a una apertura no es lo que hace un entrenador. |
| ET3-D05 | **Un ejercicio que no está en el catálogo de ese entorno no entra**, y se dice en la vista («no está en el catálogo: no entra») y en el aviso al aplicar. No se reemplaza por otro en silencio. |
| ET3-D06 | **Aplicarla es una operación nueva** (API-TPB-02), no un campo más de API-TRN-07: «lo nuevo va en operaciones nuevas», y la respuesta dice cómo se resolvió cada carga. El origen no va en `origenDePlantilla` (que es de las plantillas propias, con su identificador); queda en la auditoría de API-TPB-02 con la versión creada. |
| ET3-D07 | **La plantilla no trae los días:** la agenda es de la persona. Dice los días sugeridos en palabras («lun · mié · vie») y el profesional los elige en «Días de la semana». |
| ET3-D08 | **La versión que se vio:** si cambió, 409 y la pantalla vuelve a leer; una retirada responde 422 `TEMPLATE_ARCHIVED`, el mismo código que una plantilla propia archivada. |
| ET3-D09 | **Fuera de esta tanda:** «Copiar a Mis plantillas» una de BE, y que un profesional proponga una suya a las de BE (como el Recetario). Quedan para cuando Dirección valide la semilla. |
| ET3-D10 | La sugerencia **nunca cambia nada sola.** «Aplicar» sube la carga común y la propia de cada serie efectiva (una pirámide sigue siendo pirámide); las aproximaciones no se tocan; sin carga planificada, la nueva queda como común. |
| ET3-D11 | **El paso:** el de la progresión de la fase, si lo hay; si no, el del implemento (barra y lo demás 2,5 kg, mancuernas 2, máquina 5; en libras 5, y 10 en máquina). Una serie tildada «como el plan» cuenta como hecha. Solo se mira la última vez registrada, serie por serie por su número. |
| ET3-D12 | **Con una progresión en la fase** que alcanza a ese ejercicio, no se sugiere nada (no se cuenta la subida dos veces). Tampoco en cardio ni en una plantilla (no hay persona). |
| ET3-D13 | **El cardio va en los parámetros del profesional**, con tres rótulos fijos de BE: «Duración» (min, o «Sin indicar»), «Distancia» (km o m) e «Intensidad» («Zona 2», «Esfuerzo 6 de 10» o texto), y una sola serie efectiva sin repeticiones, carga ni criterio. Viaja igual por todas las lecturas, las plantillas, las copias y «Mis habituales», y **la APK publicada lo lee sin romperse y lo muestra en el detalle del ejercicio** («Duración: 30 min»); en la tarjeta dice «1 serie». **Revisión:** la APK publicada no tilda «como el plan» una serie sin repeticiones ni carga (`serieDelPlan` devuelve `null`): para marcarla hecha, la persona escribe un dato. El editor lo dice en el «?» del cardio. Se reconoce como cardio si tiene la «Duración» de BE y, a lo sumo, una serie sin repeticiones ni carga (una plancha con «Duración 30 s» sigue siendo de fuerza). Un campo propio queda para cuando la app registre el tiempo y la distancia hechos. |
| ET3-D14 | **Los límites del cardio:** de 0,5 a 600 min; más de 0 y hasta 1000 km o 100 000 m; esfuerzo de 0 a 10. Lo que no entra no se guarda. |
| ET3-D15 | **Pasar a series y volver no guarda lo de antes.** Al pasar a cardio se va lo de fuerza (repeticiones, carga, descanso, bases y criterio); al volver, se van los tres parámetros de BE y queda una serie para completar. Los parámetros propios del profesional se conservan. |
| ET3-D20 | **La pila de «Deshacer», de 20.** Lo escrito seguido (menos de un segundo entre cambios) cuenta como un solo cambio; cada movimiento de un ejercicio se deshace solo. |
| ET3-D21 | **El «Deshacer» de un cambio grande** va en el aviso flotante de siempre (no corre nada, RP-19) y dura 8 segundos. Los «Deshacer» del preset y de las vueltas siguen como estaban. |
| ET3-D22 | **Ctrl+Z no actúa dentro de un campo de texto** (deshace el navegador) **ni con un cuadro abierto** (lo de adentro es un borrador). No hay «Rehacer». |
| ET3-D23 | **Arrastrar sigue la regla de «Subir» y «Bajar»:** dentro de un bloque se mueve entre los suyos, y uno suelto salta el bloque entero. Para meterlo en un bloque sigue «Pasar a…». |
| ET3-D24 | **La caché del catálogo vive en la memoria de la pestaña**, por sesión y por 10 minutos; no en `sessionStorage`, así el token no queda guardado en ningún lado. |
| ET3-D25 | **Una lectura incompleta** se muestra con su aviso y no se guarda en la caché. |
| ET3-D26 | **Al desmarcar una aproximación** se le saca siempre el descanso propio, aunque lo hubiera escrito el profesional; la carga y las repeticiones quedan. |
| ET3-D27 | **«Catálogo de BE» es lo que no cargó ningún profesional.** Un ejercicio de wger que importó un profesional es de ese profesional. Con una API que todavía no manda el campo, se usa el criterio de antes. |
| ET3-D28 | **En «Días de la semana»,** la parada de cada fila es la última celda que tuvo el foco; al abrir el cuadro, el nombre. |
| ET3-D29 | **En la barra de fases** queda el `aria-label` («Las fases, en orden: elegí una para verla») y se va el `aria-labelledby`, que repetía el nombre de la sección. |

Las de la pasada de densidad (ET3-D30 en adelante), en §6.

## 4. Pruebas

- **Dominio:** `packages/domain/src/plantillas-de-be.test.ts` (TEST-ET3-01 a 06: la semilla, cada número de wger contra el
  catálogo base, el armado con su planificación, las cargas con el 1RM y sin él, la lectura para la pantalla y las
  palabras) y `editor-de-entrenamiento-tanda-3.test.ts` (TEST-ET3-10 a 19: la sugerencia y el cardio).
  `contratos-wp06.test.ts` cuenta 84 operaciones de Entrenamiento y ninguna propiedad con «percent».
- **Integración** (corre en la CI, `test/integration/plantillas-de-be.int-spec.ts`): TEST-ET3-API-01 (la semilla y quién la
  lee), 02 (aplicada: la sentadilla con 65 kg de un 1RM de 100 kg y sus tres aproximaciones, el press de banca sin 1RM,
  la planificación y el 409 del segundo borrador), 03 (lo ajeno, la versión, la clave, la clave de idempotencia), 04
  (Administración: retirar, no listar ni aplicar, la historia, volver a ofrecer y el 403 de un profesional), 05 (la base: el
  rol vigente y solo agregar) y 06 (`loadedByProfessional`). `schema.int-spec.ts`: la tabla nueva no se trunca.
- **Website:** `apps/web/test/plantillas-de-be.test.mjs` (TEST-ET3-30 a 34), `editor-de-entrenamiento-tanda-3-a.test.mjs`
  (TEST-ET3-20 a 29: deshacer, reordenar y lo BAJA) y `editor-de-entrenamiento-tanda-3-b.test.mjs` (TEST-ET3-40 a 44: la
  sugerencia y el cardio).
- **Navegador** (`test/navegador/recorridos.mjs`, en la CI, con capturas en los dos temas en el artefacto
  `resultados-recorridos`): `plantillaDeBe` (TEST-ET3-NAV-01: el selector de origen, la vista que no corre la lista, la
  marca de propuesta, aplicar, el aviso y lo guardado por la API), `editorTanda3Reordenar` (TEST-ET3-NAV-02: Alt+↓,
  arrastrar, Ctrl+Z, quitar y «Deshacer») y `editorTanda3Cardio` (TEST-ET3-NAV-03: la sugerencia de +2,5 kg y Aplicar, y
  el ciclismo como cardio, el valor que no entra sin saltos, el plegado y «Ver como la persona»).
- **La APK:** no se tocó (no lee nada nuevo).
- Guardias: `contraste`, `acciones-y-ayudas`, `copy-pantallas`, `trazabilidad-de-operaciones`.

## 5. Lo que queda

- Ratificar ET3-D01 a ET3-D39 y **validar las cuatro Plantillas de BE** (ejercicios, % RM, series, fases y progresión).
  Validada una, pasa a `VALIDATED` y deja de decir «Propuesta».
- **La APK (próxima versión):** dibujar el cardio como una tarjeta propia (duración, distancia, zona y «Lo hice») en lugar
  de «1 serie sin repeticiones fijadas» más los parámetros; el renglón «30 min · …» ya le llega con el dominio nuevo.
  Registrar el tiempo y la distancia hechos pide el campo propio de ET3-D13.
- Arrastrar con el dedo en una pantalla táctil (el arrastre del navegador no anda con el dedo): ahí quedan el teclado y
  «Subir/Bajar».
- En «Más opciones › Notas y parámetros», los tres parámetros del cardio se ven y se pueden editar a mano (BAJA).
- Mirarlo en pantalla, en los dos temas, a 1280, 1440 y 1920, y con un lector de pantalla: por la memoria del equipo no se
  corrieron localmente `tsc` de la API, del website ni de la APK, `next build` ni los recorridos; los corre la CI.

## 6. La pasada de densidad del editor (E5)

Menos texto a la vista, las explicaciones detrás del «?» de la esquina (con su ejemplo resuelto) y un renglón menos donde
se podía, sin cambiar comportamiento ni atributos `data-*`. Se partió de las capturas de los recorridos de la CI de #325.

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET3-30 | **Los gráficos de semanas** (la carga por semana, la progresión en el panel y en el asistente): la indicación del teclado y la nota del método pasan a un «?» en la esquina del gráfico, junto a la estrella, con cómo se leen las formas y un ejemplo resuelto. El renglón de la lectura queda reservado (RP-19). | `grafico-de-semanas.tsx`, `panel-de-la-parte-b.tsx` |
| ET3-31 | **El panel:** de qué es y la herramienta («El plan · Almanaque») en un renglón; «Carga para N repeticiones» que no aplica, en un renglón con su «?»; «Estructuras» sin la lista a la vista; el almanaque sin fechas, en una línea («Sin fechas todavía: elegí el inicio en «Configurar plan».»). | `panel-de-la-parte-b.tsx`, `almanaque.tsx`, `globals.css` |
| ET3-32 | **«Revisión para activar»:** cómo se actualiza pasa al «?» del título. | `editor.tsx` |
| ET3-33 | **La sesión:** «Agregar indicaciones de la sesión» en el renglón de «Presets». | `editor.tsx`, `globals.css` |
| ET3-34 | **«Ver como la persona» y el 1RM:** la explicación general se dice una vez, en su «?». | `vista-de-la-persona.tsx`, `uno-rm-del-ejercicio.tsx` |

| Id | Decisión |
| --- | --- |
| ET3-D30 | El «?» de cada gráfico de semanas es fijo (cómo se lee y un ejemplo) y quien lo usa le suma su método. |
| ET3-D31 | Sin una semana elegida, el renglón de la lectura queda vacío pero reservado; la indicación la oye el lector. |
| ET3-D32 | «Carga para N repeticiones» que no aplica: un renglón, sin tarjeta. |
| ET3-D33 | En el panel, de qué es y la herramienta van en un solo renglón. |
| ET3-D34 | «Estructuras», sin la lista a la vista. |
| ET3-D35 | Cómo se actualiza la revisión va en el «?» del título, no en un párrafo al pie. |
| ET3-D36 | Las indicaciones de la sesión van en el renglón de «Presets» (el tabulador pasa primero por «Presets»). |
| ET3-D37 | En «Ver como la persona» y en el cuadro del 1RM, la explicación general se dice una sola vez, en el «?». |
| ET3-D38 | El almanaque sin fechas dice dónde se eligen, en una línea. |
| ET3-D39 | La barra de fases, el ejercicio y la planilla no se tocaron: ya tenían sus «?» en la esquina y lo que muestran son datos o acciones. |

**Quedó para decidir con Dirección:** la tarjeta «Cómo se usa el editor» (aparece una vez y se cierra con «Entendido»;
dejarle solo el título es un cambio del componente común `primer-uso.tsx`); «La vez pasada» repetido en el título del
marco y en su sección; el «?» de la tabla de series, al lado de «Agregar serie» y no en la esquina; y, en el popover de la
revisión, lo que abre el «?» puede pedir desplazar dentro del popover. Mirarlo en las capturas de la CI.
