# 15 · Diagrama de clases

*Las clases que guardan la historia de la persona y las que la ponen a trabajar en la API.*

> Ninguna escritura de salud ocurre sin permiso ni auditoría, porque no depende de que cada servicio se acuerde.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** Noviembre de 2026

> **Resumen.** Dos capas que se distinguen en cada vista: 146 clases de persistencia (los modelos de Prisma) con sus 280 asociaciones, y 101 clases inyectables y 40 controladores en la API. Primero, la persistencia de un vistazo, la forma común de toda escritura de un dato de salud y tres operaciones centrales, clase por clase; al final, el inventario completo, como anexo.

**Entregable:** 15 · Diagrama de clases
**Fecha:** Noviembre de 2026
**Lo acompaña:** El .docx editable. El nivel de los datos está en el entregable 14 (DER); el de los componentes, en el 17.

# Resumen

*Qué muestra este diagrama, por qué importa y la idea central del diseño.*

El DER (14) muestra cómo se guardan los datos. Este documento muestra las clases que los guardan y las que trabajan con ellos, en dos capas que se distinguen en cada vista:

- **La persistencia:** los 146 modelos de Prisma, uno por tabla, en los mismos trece módulos que el DER. Guardan la historia de la persona: cada plan como una sucesión de versiones, cada comida y cada sesión unidas a la versión del plan que regía cuando pasaron, cada toma con su protocolo y cada cálculo con su método, y cada corrección como un registro nuevo que no pisa al anterior. Por eso se puede ver qué se indicó, qué pasó y cómo cada cambio del plan fue afectando a la persona.
- **La API:** las 101 clases inyectables (servicios, ejecutores, guards y adaptadores), con 381 métodos públicos, y los 40 controladores, que son la puerta HTTP: 292 operaciones. Deciden quién puede hacer qué, escriben y auditan.

La decisión de diseño más importante une las dos capas: toda escritura de un dato de salud pasa por una sola clase abstracta, `EjecutorDeDominio`, que decide el permiso, escribe y deja la auditoría en la misma transacción. Ninguna escritura ocurre sin autorización ni auditoría, porque no depende de que cada servicio se acuerde.

![Figura 1: Las dos capas del diagrama y la clase que las une.Fuente: prisma/schema.prisma y apps/api/src: los modelos, las clases inyectables y los controladores](pendiente)

# 1. Cómo se lee

*La notación UML de las vistas y las láminas, y las convenciones para no repetir lo que ya está en el DER.*

![Figura 2: Los elementos de las vistas y de las láminas del inventario](pendiente)

> **Lo que no se repite.** Casi todas las clases de persistencia tienen un identificador, su procedencia y dos momentos (cuándo pasó y cuándo se registró): no se repiten en cada recuadro, están completos en el DER. Instante es un momento con zona horaria; FechaCivil, un día sin hora; Json, un contenido estructurado que valida el dominio. Las láminas y las fichas llaman «persona» a quien sigue el acompañamiento, también donde el esquema y el código usan otro nombre técnico (en columnas y valores del esquema y en un método de `ProcesoService`). El DER muestra las columnas con su nombre técnico y lo explica en sus convenciones.
>
> Las vistas (la persistencia de un vistazo, el núcleo y las tres operaciones) muestran solo las clases que cuentan cada historia. El inventario completo, con cada clase, sus atributos o sus métodos y sus relaciones, está en los anexos A y B.

# 2. La persistencia de un vistazo

*Las clases que cuentan la historia de la persona, sin atributos: el permiso, el seguimiento de cada área y, en cada una, el plan en versiones y lo que pasó bajo cada versión.*

Un `PlanNutricional` es una sucesión de `VersionDePlanNutricional`, cada una con su instantánea fija; cada `IngestaNutricional` apunta a la versión que regía cuando la persona la registró, y una `RevisionNutricional` del seguimiento puede dar origen a la versión siguiente. Entrenamiento repite la misma forma con sus clases, y Antropometría separa lo medido (`MedicionAntropometrica`) de lo calculado (`EjecucionDeCalculo`). El permiso es la otra mitad: el `Vinculo` entre el profesional y la persona, un `AlcanceDeVinculo` por área y su `Consentimiento`, con cada decisión de la persona como una versión.

Esa forma común es la que permite comparar períodos y áreas sobre el mismo eje del tiempo. Los gráficos del profesional no guardan copias: leen estas mismas clases por `AnalisisController` (la línea de tiempo, API-DSH-04, y las proyecciones, API-PRJ-01) y por las lecturas de Entrenamiento y de las notas propias, y en cada pedido el PDP vuelve a decidir el permiso. La historia anterior que la persona autoriza a un profesional nuevo de la misma área sale de las mismas clases: los planes activados, lo registrado bajo ellos, las tomas y las decisiones de las revisiones, en solo lectura y marcados como de otro profesional; las notas propias del profesional anterior no entran.

![Figura 3: La persistencia de un vistazo: las clases centrales y sus asociaciones, con la columna que las guarda y la multiplicidad real del esquema. Hacia Identidad solo se dibujan las del vínculo y el seguimiento: casi todas las demás clases también la referencian. El seguimiento también se asocia a la versión de Entrenamiento que lo abre. Cada módulo conserva su color](pendiente)

> **Texto de la figura:**
> - Persistencia *· modelos de Prisma*

# 3. El núcleo: cómo se ejecuta una operación

*Antes de ver cada operación conviene ver la forma que comparten todas las escrituras de datos de salud: del controlador al ejecutor de dominio, sus colaboradores y lo que escribe en la persistencia.*

1. **Valida**: El cuerpo se valida contra su contrato; si no cumple, 400.
2. **Clave**: Si la operación la exige, revisa la clave de idempotencia: un reintento no duplica.
3. **Decide**: En una transacción, PdpService decide el permiso antes de escribir.
4. **Escribe y audita**: El efecto, la auditoría de éxito y, con clave, el registro de idempotencia, juntos.
5. **O revierte**: Si el permiso se niega, se revierte, se anota la negativa y se responde 404.

*.*

Un controlador recibe el pedido, protegido por `SesionGuard`, y lo delega en un servicio de su módulo. El servicio no escribe por su cuenta: lo hace a través de una de las 10 subclases de `EjecutorDeDominio`, que solo fijan el alcance y su finalidad. Un reintento con la misma clave vuelve a decidir el permiso antes de devolver la respuesta guardada: si ya no se permite, es el mismo 404. La vista muestra también las tres clases de persistencia que escribe esa forma común: la decisión de acceso y la auditoría en cada escritura, y el registro de idempotencia cuando el pedido lleva su clave.

![Figura 4: El núcleo de la API: del controlador al ejecutor de dominio, sus colaboradores y las tres clases de persistencia que escribe la forma común. Fuente: apps/api/src/plataforma/ejecutor.ts](pendiente)

> **Texto de la figura:**
> - API *· servicios y controladores*Persistencia *· modelos de Prisma, con «persistencia» y su módulo*

# 4. Tres operaciones, clase por clase

*Las responsabilidades y las colaboraciones de tres operaciones centrales, con las clases reales de la API y lo que cada una lee o escribe en la persistencia.*

Cada operación se cuenta igual: para qué sirve, el pedido que la dispara, la vista de sus clases y una tabla de responsabilidades y colaboraciones (al estilo de las tarjetas CRC: clase, responsabilidad, colaboradores) con lo que hace cada clase en esa operación. En las vistas, las clases de persistencia llevan el estereotipo «persistencia» y su módulo; los números de las flechas siguen el orden del código.

**Tabla 1.** Las tres operaciones.

| Operación | El pedido | Para qué, en una línea |
| --- | --- | --- |
| Activar un plan | `POST /nutrition/plans/{planId}/activate` (API-NUT-12) | La versión activada queda fija, y todo lo que se registre desde ahí queda unido a ella. |
| Registrar una comida o una sesión | `POST /me/nutrition/meal-records` (API-ING-02) y `POST /training/execution-drafts/{draftId}/confirm` (API-TRN-18) | Lo que pasó queda unido a la versión del plan que regía, sin pisar lo anterior. |
| Retirar un permiso | `POST /me/consents/{consentId}/revoke` (API-CON-04) | La persona corta el acceso a un área cuando quiere, sin borrar la historia. |

## 4.1 Activar un plan

**Para qué.** Activar convierte el borrador del profesional en la versión vigente del plan. Desde ese momento, todo lo que la persona registre queda unido a esa versión; cuando el plan cambia, se activa una versión nueva y la anterior conserva lo que pasó mientras rigió. Por eso se puede ver, período por período, cómo cada cambio del plan fue afectando a la persona y por qué se tomó cada decisión.

**El pedido.** `POST /nutrition/plans/{planId}/activate` (API-NUT-12), con la versión esperada del borrador y una clave de idempotencia. En Entrenamiento, `PlanesDeEntrenamientoService.activar()` sigue el mismo molde con `EjecutorDeEntrenamiento` y deja su `InstantaneaDePlanDeEntrenamiento`.

![Figura 5: Activar un plan de nutrición: las clases de la API que colaboran y lo que cada una escribe en la persistencia, en el orden del código. Fuente: apps/api/src/nutricion/planes.service.ts](pendiente)

> **Texto de la figura:**
> - API *· servicios y controladores*Persistencia *· modelos de Prisma, con «persistencia» y su módulo*

**Tabla 2.** Activar un plan: responsabilidades y colaboraciones.

| Clase | Capa | Responsabilidad en esta operación | Colabora con |
| --- | --- | --- | --- |
| NutricionController | API · controlador | Recibe el pedido, protegido por SesionGuard, y lo delega. | PlanesService |
| PlanesService | API · servicio | Bloquea la versión y su plan; exige que sea un borrador nacido de la versión vigente y unido al objetivo vigente; serializa las activaciones de la persona y rechaza la activación si otro profesional tiene abierto su seguimiento nutricional (409). Valida la estructura, congela la instantánea con su huella, activa la versión, la vuelve la vigente del plan y registra el evento. | EjecutorNutricional, PdpService, EvaluacionesService, CatalogoService, ProcesoService y PublicadorDeNovedades |
| EjecutorNutricional | API · ejecutor | Hereda de EjecutorDeDominio: valida el cuerpo y la clave, abre la transacción y deja la auditoría de éxito y el registro de idempotencia. Si el permiso se niega, revierte y responde 404. | IdempotenciaService, AuditoriaService y PdpService |
| PdpService | API · servicio | Decide el permiso dentro de la transacción, con el vínculo y el consentimiento vigentes, y registra la decisión. | DecisionDeAcceso |
| EvaluacionesService | API · servicio | Da la versión vigente del objetivo, a la que el plan tiene que estar unido. | VersionDeObjetivoNutricional |
| CatalogoService | API · servicio | Da las versiones vigentes de los alimentos que cita el plan, para validarlo y congelarlo. | VersionDeElementoNutricional |
| ProcesoService | API · servicio | Abre el seguimiento del área, con su evento, o lo continúa; y fija la próxima revisión que trae la versión. | ProcesoOperativo, EventoDeProceso y ProximaRevision |
| PublicadorDeNovedades | API · servicio | Deja la novedad para la persona en la misma transacción; el aviso al teléfono sale después de confirmar. | Novedad |
| VersionDePlanNutricional | Persistencia · P05 | Pasa de BORRADOR a ACTIVADA, con su momento de activación. Desde ahí no se edita: un cambio es una versión nueva. | PlanNutricional |
| InstantaneaDePlanNutricional | Persistencia · P05 | Una por versión: la copia fija del plan, con su huella SHA-256 y las versiones del catálogo y de las recetas que cita. | VersionDePlanNutricional |
| PlanNutricional | Persistencia · P05 | Apunta a su versión vigente: una sola a la vez. | VersionDePlanNutricional |

Lo comprueban las pruebas de integración de `test/integration/nutricion.int-spec.ts`: una versión activada no se edita, no se valida ni se vuelve a activar, y su contenido no cambia; activar con la misma clave devuelve el mismo resultado sin repetir el efecto; y la prueba de RF-031 rechaza la activación con otro seguimiento nutricional abierto (ACTIVE_PLAN_CONFLICT).

## 4.2 Registrar una comida o una sesión

**Para qué.** La persona registra desde la app lo que comió: la opción del plan, con sus porciones, o una comida diferente, con texto, fotos o los dos. Cada registro queda unido a la versión del plan que regía; así el profesional compara lo indicado con lo registrado en cada período, sin reconstruir nada. Corregir no borra: anular o completar las cantidades agrega un registro nuevo.

**El pedido.** `POST /me/nutrition/meal-records` (API-ING-02), con una clave de idempotencia. Una sesión de entrenamiento sigue el mismo molde (tabla de abajo).

![Figura 6: Registrar una comida: las clases de la API que colaboran y lo que cada una lee o escribe en la persistencia, en el orden del código. Fuente: apps/api/src/nutricion/registro-de-comidas.service.ts](pendiente)

> **Texto de la figura:**
> - API *· servicios y controladores*Persistencia *· modelos de Prisma, con «persistencia» y su módulo*

**Tabla 3.** Registrar una comida: responsabilidades y colaboraciones.

| Clase | Capa | Responsabilidad en esta operación | Colabora con |
| --- | --- | --- | --- |
| RegistroDeComidasController | API · controlador | Recibe el pedido de la app, protegido por SesionGuard, y lo delega. | RegistroDeComidasService |
| RegistroDeComidasService | API · servicio | Comprueba que el plan citado sea el vigente de la persona (si cambió, lo dice y no reasigna en silencio) y que la comida no sea futura. Con una opción del plan, la busca en la instantánea vigente; con una comida diferente, une las fotos, que no pueden estar unidas a otro registro. Una sola comida efectiva por comida y día: una igual devuelve la existente; una distinta es un conflicto (409). Registra el evento. | EjecutorNutricional, PdpService, IngestasService y MediosService |
| EjecutorNutricional | API · ejecutor | La forma común: valida, revisa la clave, abre la transacción y audita. | IdempotenciaService y AuditoriaService |
| PdpService | API · servicio | Decide con la persona como titular y el profesional del plan, y registra la decisión. | DecisionDeAcceso |
| IngestasService | API · servicio | Da el plan vigente, el del seguimiento abierto, con su instantánea; y la comida ya registrada ese día, si la hay. | VersionDePlanNutricional, InstantaneaDePlanNutricional e IngestaNutricional |
| MediosService | API · servicio | Comprueba que cada foto sea de la persona, esté disponible y sea de una comida. | Medio |
| IngestaNutricional | Persistencia · P05 | La comida registrada, unida a su versión del plan, con su día y su zona horaria. No se edita: la anulación y la corrección de cantidades son registros aparte. | VersionDePlanNutricional, AnulacionDeIngesta y RectificacionDeCantidades |
| EvidenciaVisualDeIngesta | Persistencia · P06 | Une cada foto a la comida, con su autoría. La base no deja unir una foto a dos registros. | IngestaNutricional y Medio |

Lo comprueban las pruebas de `test/integration/registro-de-comidas.int-spec.ts`: un doble envío no duplica; una foto ajena, ya unida a otro registro, de una receta o inexistente se rechaza (MEDIA_REFERENCE_INVALID); y deshacer anula sin borrar, y lo anulado deja de contar.

**Tabla 4.** La sesión de entrenamiento, con el mismo molde.

| Parte | En la sesión |
| --- | --- |
| El pedido | `POST /training/execution-drafts/{draftId}/confirm` (API-TRN-18), con una clave de idempotencia. |
| Controlador | `EntrenamientoController`, protegido por `SesionGuard`. |
| Servicio | `EjecucionesDeEntrenamientoService.confirmar()`: la sesión se arma como borrador mientras la persona entrena y, al confirmarla, queda registrada, unida a su versión del plan y con su momento dentro del período en que esa versión regía. Una sola sesión registrada por cada sesión de la agenda. |
| Ejecutor | `EjecutorDeEntrenamiento`, la misma forma común. |
| Persistencia | `EjecucionDeEntrenamiento` (Persistencia · P08), unida a `VersionDePlanDeEntrenamiento`, y su `EventoDeEntrenamiento`. Corregirla agrega una `CorreccionDeEjecucionDeEntrenamiento`. |
| Lo comprueban | Las pruebas de `test/integration/entrenamiento.int-spec.ts`: un reintento de confirmar no duplica, y otra confirmación de la misma sesión es EXECUTION_ALREADY_REGISTERED (409); corregir no sobrescribe: el original queda y la corrección es la vista efectiva. |

## 4.3 Retirar un permiso

**Para qué.** La persona decide quién ve cada área y lo puede cambiar cuando quiera, desde la app. Retirar el permiso de un área corta el acceso de ese profesional desde su operación siguiente, sin borrar la historia: la revocación queda como un hecho más, con su momento y su evidencia, y el profesional se entera por sus novedades. Es la condición necesaria para trabajar con datos de salud.

**El pedido.** `POST /me/consents/{consentId}/revoke` (API-CON-04). No lleva clave de idempotencia porque lo es por su sentido: revocar dos veces devuelve lo mismo, con la misma fecha, y deja una sola revocación.

**Por qué no pasa por EjecutorDeDominio.** No escribe un dato de salud: escribe el permiso mismo. Tiene su propia transacción, con la auditoría adentro, y el mismo cuidado con la concurrencia: bloquea las filas del alcance y del consentimiento en modo de actualización, mientras que cada decisión de `PdpService` las toma en modo compartido (la función `be_bloquear_lo_que_corta`). Si el profesional está escribiendo en ese instante, uno espera al otro: ninguna decisión que permite queda con un momento posterior al retiro.

![Figura 7: Retirar un permiso: las clases de la API que colaboran, lo que escriben en la persistencia y la decisión siguiente del PdpService, que ya deniega. Fuente: apps/api/src/consentimiento/consentimiento-profesional.service.ts](pendiente)

> **Texto de la figura:**
> - API *· servicios y controladores*Persistencia *· modelos de Prisma, con «persistencia» y su módulo*

**Tabla 5.** Retirar un permiso: responsabilidades y colaboraciones.

| Clase | Capa | Responsabilidad en esta operación | Colabora con |
| --- | --- | --- | --- |
| ConsentimientosController | API · controlador | Recibe el pedido de la app, protegido por SesionGuard, y lo delega. | ConsentimientoProfesionalService |
| ConsentimientoProfesionalService | API · servicio | Solo la persona titular revoca; a cualquier otro le responde como si el consentimiento no existiera (404). Bloquea el alcance y el consentimiento, pasa el consentimiento a REVOCADO, agrega la versión de la revocación con su evidencia (superficie, dirección IP y agente), registra el evento y deja la novedad para el profesional. No finaliza el vínculo ni borra nada. | AuditoriaService y PublicadorDeNovedades |
| AuditoriaService | API · servicio | Escribe la auditoría en la misma transacción: sin auditoría, no hay retiro. | RegistroDeAuditoria |
| PublicadorDeNovedades | API · servicio | Deja la novedad CONSENTIMIENTO_REVOCADO para el profesional. | Novedad |
| PdpService | API · servicio | En la operación siguiente del profesional, decide con el consentimiento revocado: deniega, lo registra y la respuesta es 404, igual que la de un dato inexistente. No guarda decisiones en memoria. | Consentimiento y DecisionDeAcceso |
| Consentimiento | Persistencia · P03 | Uno por alcance del vínculo y finalidad; su situación pasa de VIGENTE a REVOCADO. | AlcanceDeVinculo y VersionDeConsentimiento |
| VersionDeConsentimiento | Persistencia · P03 | La cadena de decisiones de la persona: la revocación es una versión nueva, encadenada a la anterior. | Consentimiento |
| EventoDeVinculo | Persistencia · P03 | El hecho ConsentimientoRevocado, con su estado previo y su estado posterior. | Consentimiento |

Lo comprueban las pruebas de `test/integration/consentimiento.int-spec.ts` (retirar Entrenamiento no toca Nutrición: el profesional de Entrenamiento pierde el acceso, el de Nutrición lo conserva, y la revocación queda como versión y como hecho; revocar dos veces deja una sola revocación) y la de concurrencia de `test/integration/concurrencia-wp03.int-spec.ts`: con lecturas en curso, ninguna decisión que permite tiene un momento posterior a la revocación, y toda lectura que empieza después de confirmarla da 404.

# Anexo A. La persistencia, módulo por módulo

*Las 146 clases de persistencia en los mismos trece módulos que el DER, con sus atributos propios y sus 280 asociaciones. Es el inventario generado del esquema.*

Cada lámina lleva arriba el rótulo de su capa y su módulo. Una clase de otra lámina aparece resumida, con su módulo (P01 a P13) o su número de lámina, solo para ubicar la asociación. Cada asociación se dibuja una vez, en la lámina de la clase que tiene la columna.

**Tabla 6.** Los trece módulos de la persistencia: qué guarda cada uno, cuántas clases, asociaciones y láminas tiene.

| Módulo | Qué guarda | Clases | Asociaciones | Láminas |
| --- | --- | --- | --- | --- |
| P01 Identidad y acceso | La identidad, raíz del modelo: el perfil propio con sus versiones, los métodos de acceso, las sesiones y la recuperación del acceso. | 14 | 21 | 5 |
| P02 Administración, derechos y auditoría | La seguridad y la historia: el rol de Administración, el segundo factor, los derechos de la persona, la decisión de acceso, la auditoría, la idempotencia y las incidencias. | 16 | 22 | 7 |
| P03 Profesionales, vínculos y consentimiento | El profesional y su relación con la persona: el vínculo, un alcance por área y su consentimiento, con versiones. | 14 | 30 | 6 |
| P04 Proceso de acompañamiento | El seguimiento de un área con una persona en el tiempo: sus eventos, la próxima revisión y el cálculo de los ciclos de seguimiento cerrados en 30 días; y las notas propias del profesional, que solo lee su autor. | 6 | 19 | 4 |
| P05 Nutrición | El catálogo de alimentos, la evaluación, el objetivo y el plan en versiones, la comida registrada y la revisión. | 14 | 27 | 6 |
| P06 Recetas, fotos y registro de comidas | Las recetas, las fotos privadas y lo que completa el registro de comidas. | 8 | 12 | 3 |
| P07 Antropometría | Lo medido separado de lo calculado, con las entradas exactas de cada cálculo. | 11 | 22 | 5 |
| P08 Entrenamiento | El catálogo de ejercicios, la evaluación, el objetivo, el plan en versiones, la sesión en curso, la sesión registrada con su nota, la revisión y la fuerza estimada. | 18 | 40 | 8 |
| P09 Catálogos e importación | Lo que llega de un proveedor externo, que pasa por un candidato y una resolución antes de entrar al catálogo. | 11 | 23 | 4 |
| P10 Formularios y hábitos | Los formularios (pedido, propuesta, respuesta y rectificación) y los hábitos, que son de la persona. | 11 | 24 | 5 |
| P11 Lo que se comparte entre áreas | Lo que la persona decide compartir entre áreas y las notas de coordinación entre sus profesionales. | 7 | 18 | 2 |
| P12 Herramientas del profesional | Las herramientas del profesional: moldes y elementos habituales y las vistas de análisis que guarda, sin datos de ninguna persona. | 11 | 15 | 3 |
| P13 Novedades y avisos | Las novedades y los avisos al teléfono. | 5 | 7 | 1 |

![Figura 8: **P01 Identidad y acceso (1 de 5).** Clases: Identidad, PerfilPropio, VersionDePerfilPropio y MetodoDeAcceso](pendiente)

> **Texto de la figura:**
> - Persistencia *· P01 Identidad y acceso · 1 de 5*

![Figura 9: **P01 Identidad y acceso (2 de 5).** Clases: CambioDeMetodoDeAcceso y CredencialLocal](pendiente)

> **Texto de la figura:**
> - Persistencia *· P01 Identidad y acceso · 2 de 5*

![Figura 10: **P01 Identidad y acceso (3 de 5).** Clases: Sesion y ReanudacionDeSesion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P01 Identidad y acceso · 3 de 5*

![Figura 11: **P01 Identidad y acceso (4 de 5).** Clases: ControlDeSesion, RecuperacionDeAcceso y CambioDeCredencial](pendiente)

> **Texto de la figura:**
> - Persistencia *· P01 Identidad y acceso · 4 de 5*

![Figura 12: **P01 Identidad y acceso (5 de 5).** Clases: VersionDeTexto, ActoRegistrable y CapacidadDeClienteDeclarada](pendiente)

> **Texto de la figura:**
> - Persistencia *· P01 Identidad y acceso · 5 de 5*

![Figura 13: **P02 Administración, derechos y auditoría (1 de 7).** Clases: RolAdministrativo y CodigoDeIncorporacion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 1 de 7*

![Figura 14: **P02 Administración, derechos y auditoría (2 de 7).** Clases: FactorTotp y CodigoDeRecuperacion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 2 de 7*

![Figura 15: **P02 Administración, derechos y auditoría (3 de 7).** Clases: SegundoFactorDeSesion, RestablecimientoDeSegundoFactor y PedidoDeDerecho](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 3 de 7*

![Figura 16: **P02 Administración, derechos y auditoría (4 de 7).** Clases: ExportacionPropia y DecisionDeAcceso](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 4 de 7*

![Figura 17: **P02 Administración, derechos y auditoría (5 de 7).** Clases: RegistroDeAuditoria y RegistroDeIdempotencia](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 5 de 7*

![Figura 18: **P02 Administración, derechos y auditoría (6 de 7).** Clases: EventoDeDominio, SolicitudDeCierreDeCuenta y RegistroDeSupresion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 6 de 7*

![Figura 19: **P02 Administración, derechos y auditoría (7 de 7).** Clases: Incidencia y CambioDeIncidencia](pendiente)

> **Texto de la figura:**
> - Persistencia *· P02 Administración, derechos y auditoría · 7 de 7*

![Figura 20: **P03 Profesionales, vínculos y consentimiento (1 de 6).** Clases: PerfilProfesional y CambioDeNombreProfesional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 1 de 6*

![Figura 21: **P03 Profesionales, vínculos y consentimiento (2 de 6).** Clases: VerificacionProfesional y Habilitacion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 2 de 6*

![Figura 22: **P03 Profesionales, vínculos y consentimiento (3 de 6).** Clases: EventoDeVerificacion, CapacidadProfesional y InvitacionDeVinculo](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 3 de 6*

![Figura 23: **P03 Profesionales, vínculos y consentimiento (4 de 6).** Clases: ResolucionDeInvitacion, SolicitudDeVinculo, Vinculo y AlcanceDeVinculo](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 4 de 6*

![Figura 24: **P03 Profesionales, vínculos y consentimiento (5 de 6).** Clases: Consentimiento y VersionDeConsentimiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 5 de 6*

![Figura 25: **P03 Profesionales, vínculos y consentimiento (6 de 6).** Clases: EventoDeVinculo](pendiente)

> **Texto de la figura:**
> - Persistencia *· P03 Profesionales, vínculos y consentimiento · 6 de 6*

![Figura 26: **P04 Proceso de acompañamiento (1 de 4).** Clases: ProcesoOperativo y EventoDeProceso](pendiente)

> **Texto de la figura:**
> - Persistencia *· P04 Proceso de acompañamiento · 1 de 4*

![Figura 27: **P04 Proceso de acompañamiento (2 de 4).** Clases: ProximaRevision](pendiente)

> **Texto de la figura:**
> - Persistencia *· P04 Proceso de acompañamiento · 2 de 4*

![Figura 28: **P04 Proceso de acompañamiento (3 de 4).** Clases: ResultadoTvcc30](pendiente)

> **Texto de la figura:**
> - Persistencia *· P04 Proceso de acompañamiento · 3 de 4*

![Figura 29: **P04 Proceso de acompañamiento (4 de 4).** Clases: NotaPropia y ArchivoDeNotaPropia](pendiente)

> **Texto de la figura:**
> - Persistencia *· P04 Proceso de acompañamiento · 4 de 4*

![Figura 30: **P05 Nutrición (1 de 6).** Clases: ElementoDeCatalogoNutricional, VersionDeElementoNutricional, EvaluacionNutricional y ObjetivoNutricional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 1 de 6*

![Figura 31: **P05 Nutrición (2 de 6).** Clases: VersionDeObjetivoNutricional y PlanNutricional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 2 de 6*

![Figura 32: **P05 Nutrición (3 de 6).** Clases: VersionDePlanNutricional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 3 de 6*

![Figura 33: **P05 Nutrición (4 de 6).** Clases: InstantaneaDePlanNutricional y RangosDePlanNutricional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 4 de 6*

![Figura 34: **P05 Nutrición (5 de 6).** Clases: IngestaNutricional, CorreccionDeIngesta y RevisionNutricional](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 5 de 6*

![Figura 35: **P05 Nutrición (6 de 6).** Clases: AplicacionDeRevision y EventoDeNutricion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P05 Nutrición · 6 de 6*

![Figura 36: **P06 Recetas, fotos y registro de comidas (1 de 3).** Clases: Receta y VersionDeReceta](pendiente)

> **Texto de la figura:**
> - Persistencia *· P06 Recetas, fotos y registro de comidas · 1 de 3*

![Figura 37: **P06 Recetas, fotos y registro de comidas (2 de 3).** Clases: AsociacionDeImagenDeReceta y Medio](pendiente)

> **Texto de la figura:**
> - Persistencia *· P06 Recetas, fotos y registro de comidas · 2 de 3*

![Figura 38: **P06 Recetas, fotos y registro de comidas (3 de 3).** Clases: ContenidoDeMedio, EvidenciaVisualDeIngesta, AnulacionDeIngesta y RectificacionDeCantidades](pendiente)

> **Texto de la figura:**
> - Persistencia *· P06 Recetas, fotos y registro de comidas · 3 de 3*

![Figura 39: **P07 Antropometría (1 de 5).** Clases: EspecificacionAntropometrica, VersionDeEspecificacionAntropometrica y RetiroDeEspecificacion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P07 Antropometría · 1 de 5*

![Figura 40: **P07 Antropometría (2 de 5).** Clases: EvaluacionAntropometrica y MedicionAntropometrica](pendiente)

> **Texto de la figura:**
> - Persistencia *· P07 Antropometría · 2 de 5*

![Figura 41: **P07 Antropometría (3 de 5).** Clases: CorreccionDeMedicion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P07 Antropometría · 3 de 5*

![Figura 42: **P07 Antropometría (4 de 5).** Clases: AnulacionDeMedicion, EjecucionDeCalculo y EntradaDeCalculo](pendiente)

> **Texto de la figura:**
> - Persistencia *· P07 Antropometría · 4 de 5*

![Figura 43: **P07 Antropometría (5 de 5).** Clases: ReferenciaDeCalculo y EventoDeAntropometria](pendiente)

> **Texto de la figura:**
> - Persistencia *· P07 Antropometría · 5 de 5*

![Figura 44: **P08 Entrenamiento (1 de 8).** Clases: EjercicioDeCatalogo, VersionDeEjercicio, EvaluacionDeEntrenamiento y CitaDeRespuestaEnEvaluacionDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 1 de 8*

![Figura 45: **P08 Entrenamiento (2 de 8).** Clases: ObjetivoDeEntrenamiento, VersionDeObjetivoDeEntrenamiento, RevisionDeEntrenamiento y AplicacionDeRevisionDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 2 de 8*

![Figura 46: **P08 Entrenamiento (3 de 8).** Clases: PlanDeEntrenamiento y VersionDePlanDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 3 de 8*

![Figura 47: **P08 Entrenamiento (4 de 8).** Clases: InstantaneaDePlanDeEntrenamiento y BorradorDeEjecucionDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 4 de 8*

![Figura 48: **P08 Entrenamiento (5 de 8).** Clases: EventoDeTiempoDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 5 de 8*

![Figura 49: **P08 Entrenamiento (6 de 8).** Clases: EjecucionDeEntrenamiento y NotaDeEjecucion](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 6 de 8*

![Figura 50: **P08 Entrenamiento (7 de 8).** Clases: CorreccionDeEjecucionDeEntrenamiento y EventoDeEntrenamiento](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 7 de 8*

![Figura 51: **P08 Entrenamiento (8 de 8).** Clases: SerieObservada](pendiente)

> **Texto de la figura:**
> - Persistencia *· P08 Entrenamiento · 8 de 8*

![Figura 52: **P09 Catálogos e importación (1 de 4).** Clases: CandidatoDeImportacion, ResolucionDeCandidato y ItemExternoDeCatalogo](pendiente)

> **Texto de la figura:**
> - Persistencia *· P09 Catálogos e importación · 1 de 4*

![Figura 53: **P09 Catálogos e importación (2 de 4).** Clases: NombreAlternativoDeAlimento, RetiroDeNombreAlternativoDeAlimento y NombreAlternativoDeEjercicio](pendiente)

> **Texto de la figura:**
> - Persistencia *· P09 Catálogos e importación · 2 de 4*

![Figura 54: **P09 Catálogos e importación (3 de 4).** Clases: RetiroDeNombreAlternativoDeEjercicio, AsociacionDeImagenDeEjercicio y ZonaMuscular](pendiente)

> **Texto de la figura:**
> - Persistencia *· P09 Catálogos e importación · 3 de 4*

![Figura 55: **P09 Catálogos e importación (4 de 4).** Clases: AsignacionDeZonasDeEjercicio y ZonaDeEjercicio](pendiente)

> **Texto de la figura:**
> - Persistencia *· P09 Catálogos e importación · 4 de 4*

![Figura 56: **P10 Formularios y hábitos (1 de 5).** Clases: PlantillaDeFormulario y VersionDePlantillaDeFormulario](pendiente)

> **Texto de la figura:**
> - Persistencia *· P10 Formularios y hábitos · 1 de 5*

![Figura 57: **P10 Formularios y hábitos (2 de 5).** Clases: SolicitudDeFormulario y PropuestaDeRespuestaDeFormulario](pendiente)

> **Texto de la figura:**
> - Persistencia *· P10 Formularios y hábitos · 2 de 5*

![Figura 58: **P10 Formularios y hábitos (3 de 5).** Clases: RespuestaDeFormulario, RectificacionDeRespuestaDeFormulario y EventoDeFormulario](pendiente)

> **Texto de la figura:**
> - Persistencia *· P10 Formularios y hábitos · 3 de 5*

![Figura 59: **P10 Formularios y hábitos (4 de 5).** Clases: HabitosDeLaPersona y AutorizacionDeHabitos](pendiente)

> **Texto de la figura:**
> - Persistencia *· P10 Formularios y hábitos · 4 de 5*

![Figura 60: **P10 Formularios y hábitos (5 de 5).** Clases: DestinatarioDeHabitos y PedidoDeAccesoAHabitos](pendiente)

> **Texto de la figura:**
> - Persistencia *· P10 Formularios y hábitos · 5 de 5*

![Figura 61: **P11 Lo que se comparte entre áreas (1 de 2).** Clases: AutorizacionDeResumenes, TextoAceptadoDeResumenes, DestinatarioDeResumenes y PedidoDeAccesoAPlan](pendiente)

> **Texto de la figura:**
> - Persistencia *· P11 Lo que se comparte entre áreas · 1 de 2*

![Figura 62: **P11 Lo que se comparte entre áreas (2 de 2).** Clases: NotaDeCoordinacion, DestinatarioDeNota y ReferenciaDeNota](pendiente)

> **Texto de la figura:**
> - Persistencia *· P11 Lo que se comparte entre áreas · 2 de 2*

![Figura 63: **P12 Herramientas del profesional (1 de 3).** Clases: PlantillaDePlanDeEntrenamiento, VersionDePlantillaDePlanDeEntrenamiento, PlantillaDePlanNutricional, VersionDePlantillaDePlanNutricional y EjercicioHabitual](pendiente)

> **Texto de la figura:**
> - Persistencia *· P12 Herramientas del profesional · 1 de 3*

![Figura 64: **P12 Herramientas del profesional (2 de 3).** Clases: SesionHabitual, AlimentoHabitual, ComidaHabitual y VistaDeAnalisis](pendiente)

> **Texto de la figura:**
> - Persistencia *· P12 Herramientas del profesional · 2 de 3*

![Figura 65: **P12 Herramientas del profesional (3 de 3).** Clases: PrescripcionHabitual y RepartoHabitual](pendiente)

> **Texto de la figura:**
> - Persistencia *· P12 Herramientas del profesional · 3 de 3*

![Figura 66: **P13 Novedades y avisos.** Clases: Novedad, LecturaDeNovedad, SuscripcionPush, AvisoPush y PreferenciaDeRecordatorio](pendiente)

> **Texto de la figura:**
> - Persistencia *· P13 Novedades y avisos*

# Anexo B. Las clases de la API, módulo por módulo

*Los 40 controladores y las 101 clases inyectables de la API, cada uno como una caja UML: su estereotipo, sus métodos públicos y con quién colabora. Es el inventario generado del código.*

Cada ficha tiene tres partes, como una clase en UML: arriba, el estereotipo (controlador, servicio, ejecutor, guard o adaptador) y el nombre; en el medio, los métodos públicos (en un controlador, cuántas operaciones HTTP atiende); abajo, con quién colabora. **Recibe** son las clases inyectables que le llegan por el constructor; **Persistencia**, las clases de persistencia que su archivo lee o escribe; **Le delegan**, los controladores que la llaman. Los ejecutores no tienen métodos propios: heredan los de `EjecutorDeDominio`.

Cada controlador dice qué guards lo protegen, contados operación por operación: los de la clase y los de cada método. Una operación sin guard de sesión es pública por su naturaleza (entrar, con contraseña o con Google; registrarse; recuperar el acceso; leer un texto legal publicado, el canal de contacto o el estado del servicio) o se autoriza de otra forma: el servicio valida la sesión él mismo (reanudarla con su cookie, cerrarla o pedir el cierre de la cuenta), una ruta firmada que vence (una foto o una exportación) o el secreto de la tarea programada de los recordatorios.

**Tabla 7.** La API por módulo: controladores, clases inyectables y métodos públicos.

| Módulo | Controladores | Clases | Métodos | Operaciones HTTP |
| --- | --- | --- | --- | --- |
| Sesión | 2 | 5 | 18 | 10 |
| Acceso con Google | 2 | 3 | 7 | 6 |
| Identidad | 2 | 6 | 9 | 8 |
| Recuperación del acceso | 1 | 1 | 3 | 2 |
| Derechos de la persona | 1 | 2 | 11 | 6 |
| Administración | 1 | 4 | 18 | 22 |
| Incidencias | 1 | 1 | 5 | 2 |
| Profesional | 0 | 2 | 6 | 0 |
| Vínculo | 2 | 3 | 21 | 14 |
| Consentimiento | 2 | 4 | 12 | 12 |
| Autorización (PDP) | 0 | 2 | 12 | 0 |
| Plataforma | 0 | 5 | 10 | 0 |
| Prisma | 0 | 1 | 1 | 0 |
| Proceso | 0 | 1 | 11 | 0 |
| Nutrición | 4 | 12 | 71 | 59 |
| Entrenamiento | 5 | 15 | 81 | 66 |
| Antropometría | 1 | 7 | 17 | 19 |
| Formularios | 3 | 8 | 25 | 25 |
| Medios | 2 | 3 | 9 | 5 |
| Integraciones | 0 | 2 | 2 | 0 |
| Novedades | 2 | 5 | 12 | 7 |
| Coordinación | 1 | 2 | 3 | 3 |
| Resúmenes | 1 | 2 | 9 | 9 |
| Análisis | 2 | 2 | 4 | 7 |
| Notas propias | 1 | 2 | 3 | 3 |
| Cartera | 1 | 0 | 0 | 2 |
| Tablero | 1 | 0 | 0 | 1 |
| Contacto | 1 | 0 | 0 | 1 |
| Salud del servicio | 1 | 1 | 1 | 3 |
| **Total** | **40** | **101** | **381** | **292** |

Cartera y el tablero resuelven sus lecturas con funciones, sin clases inyectables propias, y Contacto solo expone un controlador. Profesional, Autorización (PDP), Plataforma, Prisma, Proceso y Integraciones no tienen operaciones HTTP propias: sus clases las usan los demás módulos. `SolicitudesService` existe dos veces, en Vínculo y en Formularios: son clases distintas con el mismo nombre.

![](pendiente)

> **Texto de la figura:**
> - API**Sesión**2 controladores · 5 clases inyectables
> - «controlador · Sesión»
> - SegundoFactorDeLaSesionController
> - 6 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** SegundoFactorDeLaSesionService
> - «controlador · Sesión»
> - SesionesController
> - 4 operaciones HTTP
> - SesionGuard en 1 de 4
> - **Delega en:** SesionService, ReanudacionService
> - «servicio · Sesión»
> - ReanudacionService
> - +emitir()
> - +emitirAdministrativa()
> - +reanudar()
> - +reanudarAdministrativa()
> - **Recibe:** PrismaService, SesionService, AuditoriaService, LimitadorService
> - **Persistencia:** ControlDeSesion, Identidad, ReanudacionDeSesion, Sesion
> - **Le delegan:** SesionesController
> - «servicio · Sesión»
> - SegundoFactorDeLaSesionService
> - +estado()
> - +verificar()
> - +usarCodigoDeRecuperacion()
> - +iniciarConfiguracion()
> - +confirmarConfiguracion()
> - +regenerarCodigos()
> - **Recibe:** PrismaService, AuditoriaService, LimitadorService
> - **Persistencia:** CodigoDeRecuperacion, FactorTotp, Identidad, MetodoDeAcceso, PerfilProfesional, SegundoFactorDeSesion, Sesion
> - **Le delegan:** SegundoFactorDeLaSesionController
> - «guard · Sesión»
> - SesionGuard
> - +canActivate()
> - **Recibe:** PrismaService, TokensService
> - **Persistencia:** Sesion
> - «servicio · Sesión»
> - SesionService
> - +iniciar()
> - +abrirEn()
> - +respuesta()
> - +finalizarActual()
> - +revocarTodas()
> - **Recibe:** PrismaService, TokensService, CredencialesService, AuditoriaService, LimitadorService
> - **Persistencia:** ControlDeSesion, Identidad, MetodoDeAcceso, RolAdministrativo, SegundoFactorDeSesion, Sesion, SuscripcionPush
> - **Le delegan:** SesionesController
> - «servicio · Sesión»
> - TokensService
> - +firmar()
> - +verificar()
> - API**Acceso con Google**2 controladores · 3 clases inyectables
> - «controlador · Acceso con Google»
> - AccesoGoogleController
> - 3 operaciones HTTP
> - sin guard de sesión
> - **Delega en:** AccesoGoogleService, ReanudacionService
> - «controlador · Acceso con Google»
> - MetodosDeAccesoController
> - 3 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** MetodosDeAccesoService
> - «servicio · Acceso con Google»
> - AccesoGoogleService
> - +iniciar()
> - +vincular()
> - +registrar()
> - **Recibe:** PrismaService, VerificadorDeGoogle, SesionService, RegistroService, CredencialesService, AuditoriaService, LimitadorService, CorreoService
> - **Persistencia:** CambioDeMetodoDeAcceso, EventoDeDominio, MetodoDeAcceso
> - **Le delegan:** AccesoGoogleController
> - «servicio · Acceso con Google»
> - MetodosDeAccesoService
> - +listar()
> - +vincular()
> - +desvincular()
> - **Recibe:** PrismaService, VerificadorDeGoogle, CredencialesService, AuditoriaService, LimitadorService, CorreoService
> - **Persistencia:** CambioDeMetodoDeAcceso, CredencialLocal, EventoDeDominio, MetodoDeAcceso
> - **Le delegan:** MetodosDeAccesoController
> - «adaptador · Acceso con Google»
> - VerificadorDeGoogle
> - +verificar()
> - API**Identidad**2 controladores · 6 clases inyectables
> - «controlador · Identidad»
> - IdentidadController
> - 7 operaciones HTTP
> - SesionGuard en 5 de 7
> - **Delega en:** RegistroService, CuentaPropiaService, PerfilPropioService, CierreService
> - «controlador · Identidad»
> - TextosPublicadosController
> - 1 operación HTTP
> - sin guard de sesión
> - «servicio · Identidad»
> - CierreService
> - +solicitar()
> - **Recibe:** PrismaService, TokensService, IdempotenciaService, AuditoriaService, EstadoDeCuentaService, VinculosService, SolicitudesService
> - **Persistencia:** RegistroDeIdempotencia, Sesion, SolicitudDeCierreDeCuenta
> - **Le delegan:** IdentidadController
> - «servicio · Identidad»
> - CuentaPropiaService
> - +consultar()
> - **Recibe:** PrismaService
> - **Persistencia:** EventoDeDominio, Identidad, PerfilProfesional
> - **Le delegan:** IdentidadController
> - «ejecutor · Identidad»
> - EjecutorDePerfilPropio
> - hereda los métodos de EjecutorDeDominio
> - **Persistencia:** PerfilProfesional, PerfilPropio, VersionDePerfilPropio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Identidad»
> - EstadoDeCuentaService
> - +transicionar()
> - **Recibe:** AuditoriaService
> - **Persistencia:** ActoRegistrable, CredencialLocal, EventoDeDominio, Identidad, RegistroDeSupresion
> - «servicio · Identidad»
> - PerfilPropioService
> - +consultar()
> - +loQueFaltaParaSeguir()
> - +aceptarVersionVigente()
> - +editar()
> - **Recibe:** EjecutorDePerfilPropio
> - **Persistencia:** PerfilProfesional, PerfilPropio, VersionDePerfilPropio
> - **Le delegan:** IdentidadController
> - «servicio · Identidad»
> - RegistroService
> - +registrar()
> - +crearIdentidad()
> - **Recibe:** IdempotenciaService, CredencialesService, AuditoriaService, LimitadorService
> - **Persistencia:** ActoRegistrable, ControlDeSesion, CredencialLocal, EventoDeDominio, Identidad, MetodoDeAcceso, PerfilPropio, VersionDePerfilPropio, VersionDeTexto
> - **Le delegan:** IdentidadController
> - API**Recuperación del acceso**1 controlador · 1 clase inyectable
> - «controlador · Recuperación del acceso»
> - RecuperacionController
> - 2 operaciones HTTP
> - sin guard de sesión
> - **Delega en:** RecuperacionService
> - «servicio · Recuperación del acceso»
> - RecuperacionService
> - +pedir()
> - +completar()
> - +emitirAsistida()
> - **Recibe:** PrismaService, AuditoriaService, LimitadorService, CredencialesService, CorreoService
> - **Persistencia:** CambioDeCredencial, CredencialLocal, Identidad, MetodoDeAcceso, RecuperacionDeAcceso, RolAdministrativo
> - **Le delegan:** RecuperacionController
> - API**Derechos de la persona**1 controlador · 2 clases inyectables
> - «controlador · Derechos de la persona»
> - DerechosController
> - 6 operaciones HTTP
> - SesionGuard en 5 de 6
> - **Delega en:** DerechosService
> - «servicio · Derechos de la persona»
> - DerechosService
> - +pedir()
> - +pedidoPropio()
> - +pedidosPropios()
> - +exportar()
> - +exportacionPropia()
> - +descargar()
> - +consultarParaAdministracion()
> - +resolver()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, RutaDeExportacion, LimitadorService
> - **Persistencia:** ControlDeSesion, ExportacionPropia, Identidad, PedidoDeDerecho
> - **Le delegan:** DerechosController
> - «adaptador · Derechos de la persona»
> - RutaDeExportacion
> - +vencimiento()
> - +firmar()
> - +verificar()
> - API**Administración**1 controlador · 4 clases inyectables
> - «controlador · Administración»
> - AdministracionController
> - 22 operaciones HTTP
> - SesionAdministrativaGuard en 19 de 22; SegundoFactorGuard en 14 de 22
> - **Delega en:** AccesoAdministrativoService, AdministracionService, DerechosService, RecuperacionService, IncidenciasService
> - «servicio · Administración»
> - AccesoAdministrativoService
> - +iniciar()
> - +reanudar()
> - +cerrar()
> - +estado()
> - +verificarCodigo()
> - +usarCodigoDeRecuperacion()
> - +iniciarConfiguracion()
> - +confirmarConfiguracion()
> - +regenerarCodigos()
> - **Recibe:** PrismaService, TokensService, SesionService, CredencialesService, AuditoriaService, LimitadorService, ReanudacionService
> - **Persistencia:** CodigoDeIncorporacion, CodigoDeRecuperacion, FactorTotp, Identidad, MetodoDeAcceso, SegundoFactorDeSesion, Sesion
> - **Le delegan:** AdministracionController
> - «servicio · Administración»
> - AdministracionService
> - +consultar()
> - +ficha()
> - +historial()
> - +decidir()
> - +incorporar()
> - +cambiarNombre()
> - +restablecerSegundoFactor()
> - **Recibe:** PrismaService, VerificacionService, PublicadorDeNovedades, IdempotenciaService, AuditoriaService, LimitadorService
> - **Persistencia:** AlcanceDeVinculo, CambioDeNombreProfesional, CodigoDeRecuperacion, EventoDeVerificacion, FactorTotp, Habilitacion, Identidad, MetodoDeAcceso, PerfilProfesional, RestablecimientoDeSegundoFactor, RolAdministrativo, VerificacionProfesional, Vinculo
> - **Le delegan:** AdministracionController
> - «guard · Administración»
> - SegundoFactorGuard
> - +canActivate()
> - **Recibe:** PrismaService, AuditoriaService
> - **Persistencia:** SegundoFactorDeSesion, Sesion
> - «guard · Administración»
> - SesionAdministrativaGuard
> - +canActivate()
> - **Recibe:** PrismaService, TokensService, AuditoriaService
> - **Persistencia:** SegundoFactorDeSesion, Sesion
> - API**Incidencias**1 controlador · 1 clase inyectable
> - «controlador · Incidencias»
> - IncidenciasController
> - 2 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** IncidenciasService
> - «servicio · Incidencias»
> - IncidenciasService
> - +reportar()
> - +propias()
> - +consultar()
> - +detalle()
> - +cambiarEstado()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, LimitadorService
> - **Persistencia:** CambioDeIncidencia, Incidencia
> - **Le delegan:** IncidenciasController
> - API**Profesional**2 clases inyectables
> - «servicio · Profesional»
> - SiembraDemoService
> - +onApplicationBootstrap()
> - **Recibe:** PrismaService, VerificacionService
> - **Persistencia:** MetodoDeAcceso
> - «servicio · Profesional»
> - VerificacionService
> - +asegurarPerfilProfesional()
> - +crearPerfilIncorporado()
> - +transicionarVerificacion()
> - +transicionarHabilitacion()
> - +prepararProfesional()
> - **Persistencia:** EventoDeVerificacion, Habilitacion, PerfilProfesional, RolAdministrativo, VerificacionProfesional
> - API**Vínculo**2 controladores · 3 clases inyectables
> - «controlador · Vínculo»
> - InvitacionesController
> - 5 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** InvitacionesService
> - «controlador · Vínculo»
> - VinculoController
> - 9 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** SolicitudesService, VinculosService
> - «servicio · Vínculo»
> - InvitacionesService
> - +crear()
> - +listar()
> - +anular()
> - +ver()
> - +usar()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, LimitadorService, SolicitudesService
> - **Persistencia:** InvitacionDeVinculo, ResolucionDeInvitacion
> - **Le delegan:** InvitacionesController
> - «servicio · Vínculo»
> - SolicitudesService
> - +crear()
> - +crearEnTransaccion()
> - +listar()
> - +aceptar()
> - +rechazar()
> - +caducarVencidas()
> - +invalidarPorCierre()
> - +bloquearCuentas()
> - +profesionalHabilitado()
> - +profesionalDisponible()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, PublicadorDeNovedades
> - **Persistencia:** AlcanceDeVinculo, Habilitacion, Identidad, PerfilProfesional, RolAdministrativo, SolicitudDeVinculo, VerificacionProfesional, Vinculo
> - **Le delegan:** VinculoController
> - «servicio · Vínculo»
> - VinculosService
> - +listar()
> - +detalle()
> - +pausar()
> - +reanudar()
> - +finalizar()
> - +finalizarPorCierre()
> - **Recibe:** PrismaService, PdpService, IdempotenciaService, AuditoriaService, LimitadorService, ProcesoService, PublicadorDeNovedades
> - **Persistencia:** AlcanceDeVinculo, EventoDeVinculo, VersionDeConsentimiento, Vinculo
> - **Le delegan:** VinculoController
> - API**Consentimiento**2 controladores · 4 clases inyectables
> - «controlador · Consentimiento»
> - ConsentimientoController
> - 1 operación HTTP
> - protegido por SesionGuard
> - **Delega en:** ConsentimientoService
> - «controlador · Consentimiento»
> - ConsentimientosController
> - 11 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** ConsentimientoProfesionalService, ConsentimientoDeSaludService, EvidenciaVisualService
> - «servicio · Consentimiento»
> - ConsentimientoDeSaludService
> - +otorgar()
> - +historial()
> - +revocar()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService
> - **Persistencia:** ActoRegistrable, EventoDeDominio, Identidad, VersionDeTexto
> - **Le delegan:** ConsentimientosController
> - «servicio · Consentimiento»
> - ConsentimientoProfesionalService
> - +requisitos()
> - +otorgar()
> - +listar()
> - +revocar()
> - **Recibe:** PrismaService, PdpService, IdempotenciaService, AuditoriaService, LimitadorService, PublicadorDeNovedades
> - **Persistencia:** AlcanceDeVinculo, Consentimiento, PerfilProfesional, VersionDeConsentimiento, VersionDeTexto, Vinculo
> - **Le delegan:** ConsentimientosController
> - «servicio · Consentimiento»
> - ConsentimientoService
> - +requisito()
> - **Recibe:** PrismaService
> - **Persistencia:** ActoRegistrable, VersionDeTexto
> - **Le delegan:** ConsentimientoController
> - «servicio · Consentimiento»
> - EvidenciaVisualService
> - +requisito()
> - +otorgar()
> - +listar()
> - +revocar()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, LimitadorService
> - **Persistencia:** ActoRegistrable, AlcanceDeVinculo, Consentimiento, EventoDeDominio, PerfilProfesional, Vinculo
> - **Le delegan:** ConsentimientosController
> - API**Autorización (PDP)**2 clases inyectables
> - «guard · Autorización (PDP)»
> - PdpGuard
> - +canActivate()
> - **Recibe:** PdpService, LimitadorService
> - «servicio · Autorización (PDP)»
> - PdpService
> - +capturarDecisiones()
> - +reautorizar()
> - +decidirPorAlcance()
> - +decidirEnTransaccion()
> - +bloquearIdentidades()
> - +decidirDestinatariosEnTransaccion()
> - +decidirAlgunAlcanceEnTransaccion()
> - +registrarDenegacion()
> - +registrarRecursoNoRevelable()
> - +evaluarSinRegistrar()
> - +leerHechos()
> - **Recibe:** PrismaService
> - **Persistencia:** ActoRegistrable, AlcanceDeVinculo, Consentimiento, DecisionDeAcceso, Habilitacion, Identidad, PerfilProfesional, VerificacionProfesional, VersionDeConsentimiento, Vinculo
> - API**Plataforma**5 clases inyectables
> - «abstracta · Plataforma»
> - EjecutorDeDominio
> - +escribirIdempotente()
> - +escribirIdempotenteConPreparacion()
> - +escribir()
> - +leer()
> - +noRevelable()
> - **Recibe:** PrismaService, IdempotenciaService, AuditoriaService, PdpService
> - **La heredan:** EjecutorDeVistas, EjecutorAntropometrico, EjecutorDeCoordinacion, EjecutorDeEntrenamiento, EjecutorDeFormularios, EjecutorDePerfilPropio, EjecutorDeMedios, EjecutorDeNotasPropias, EjecutorNutricional, EjecutorDeResumenes
> - «servicio · Plataforma»
> - AuditoriaService
> - +registrar()
> - **Recibe:** PrismaService
> - **Persistencia:** RegistroDeAuditoria
> - «servicio · Plataforma»
> - CorreoService
> - +enviar()
> - +enviarSinEsperar()
> - «servicio · Plataforma»
> - CredencialesService
> - +onModuleInit()
> - +generarHash()
> - +verificar()
> - +costoDelSenuelo()
> - **Recibe:** PrismaService
> - **Persistencia:** CredencialLocal
> - «servicio · Plataforma»
> - IdempotenciaService
> - +yaRegistrada()
> - +ejecutar()
> - **Recibe:** PrismaService
> - **Persistencia:** RegistroDeIdempotencia
> - «servicio · Plataforma»
> - LimitadorService
> - +consumir()
> - API**Prisma**1 clase inyectable
> - «servicio · Prisma»
> - PrismaService
> - +onModuleDestroy()
> - **Hereda de:** PrismaClient
> - API**Proceso**1 clase inyectable
> - «servicio · Proceso»
> - ProcesoService
> - +abrirOContinuar()
> - +procesoAbierto()
> - +bloquear()
> - +aplicarResultado()
> - +cerrarPorFinalizacionDeVinculo()
> - +fijarProximaRevision()
> - +proximaRevisionVigente()
> - +proximasRevisionesVigentes()
> - +capacidadVigente()
> - +personasQueOcupan()
> - +configurarCapacidad()
> - **Persistencia:** AlcanceDeVinculo, CapacidadProfesional, Consentimiento, EventoDeProceso, Identidad, ProcesoOperativo, ProximaRevision, Vinculo
> - API**Nutrición**4 controladores · 12 clases inyectables
> - «controlador · Nutrición»
> - HabitualesNutricionalesController
> - 8 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** HabitualesNutricionalesService
> - «controlador · Nutrición»
> - NutricionController
> - 38 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** EvaluacionesService, PlanesService, CatalogoService, IngestasService, RevisionesService, LimitadorService, ImportacionNutricionalService, PlantillasNutricionalesService, RangosDeNutricionService
> - «controlador · Nutrición»
> - RecetasController
> - 7 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** RecetasService
> - «controlador · Nutrición»
> - RegistroDeComidasController
> - 6 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** RegistroDeComidasService, LimitadorService
> - «servicio · Nutrición»
> - CatalogoService
> - +listar()
> - +buscar()
> - +crear()
> - +disponibles()
> - +vigentes()
> - +vigenteDelElemento()
> - +exigirProfesionalDeNutricion()
> - +versionesCitables()
> - +versionesPorId()
> - **Recibe:** PrismaService, EjecutorNutricional
> - **Persistencia:** ElementoDeCatalogoNutricional, NombreAlternativoDeAlimento, RetiroDeNombreAlternativoDeAlimento, VersionDeElementoNutricional
> - **Le delegan:** NutricionController
> - «ejecutor · Nutrición»
> - EjecutorNutricional
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Nutrición»
> - EvaluacionesService
> - +crearEvaluacion()
> - +listarEvaluaciones()
> - +consultarEvaluacion()
> - +crearObjetivo()
> - +emitirVersionDeObjetivo()
> - +listarObjetivos()
> - +objetivoEfectivo()
> - +efectivaDe()
> - **Recibe:** EjecutorNutricional, PdpService
> - **Persistencia:** EvaluacionNutricional, ObjetivoNutricional, VersionDeObjetivoNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - HabitualesNutricionalesService
> - +listarAlimentos()
> - +marcarAlimento()
> - +listarComidas()
> - +guardarComida()
> - +editarComida()
> - **Recibe:** EjecutorNutricional, CatalogoService
> - **Persistencia:** AlimentoHabitual, ComidaHabitual
> - **Le delegan:** HabitualesNutricionalesController
> - «servicio · Nutrición»
> - ImportacionNutricionalService
> - +crearCandidato()
> - +resolver()
> - **Recibe:** PrismaService, EjecutorNutricional, CatalogoService, OpenFoodFacts
> - **Persistencia:** CandidatoDeImportacion, ElementoDeCatalogoNutricional, ResolucionDeCandidato, VersionDeElementoNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - IngestasService
> - +hoy()
> - +registrar()
> - +consultar()
> - +listarPropias()
> - +corregir()
> - +planVigente()
> - +contextoDeHoy()
> - +efectivaDeLaComida()
> - **Recibe:** EjecutorNutricional, PdpService, CatalogoService
> - **Persistencia:** ActoRegistrable, CorreccionDeIngesta, IngestaNutricional, InstantaneaDePlanNutricional, PlanNutricional, ProcesoOperativo, VersionDeObjetivoNutricional, VersionDePlanNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - PlanesService
> - +crearBorrador()
> - +crearVersionBorrador()
> - +listar()
> - +consultar()
> - +estimacionesDeLasOpciones()
> - +editarBorrador()
> - +validar()
> - +activar()
> - +descartar()
> - +leerVersion()
> - **Recibe:** EjecutorNutricional, PdpService, CatalogoService, EvaluacionesService, ProcesoService, PlantillasNutricionalesService, PublicadorDeNovedades
> - **Persistencia:** InstantaneaDePlanNutricional, ObjetivoNutricional, PlanNutricional, ProcesoOperativo, RangosDePlanNutricional, VersionDePlanNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - PlantillasNutricionalesService
> - +crear()
> - +listar()
> - +consultar()
> - +nuevaVersion()
> - +editar()
> - +versionParaAplicar()
> - **Recibe:** EjecutorNutricional, CatalogoService
> - **Persistencia:** PlantillaDePlanNutricional, VersionDePlanNutricional, VersionDePlantillaDePlanNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - RangosDeNutricionService
> - +leer()
> - +escribir()
> - **Recibe:** EjecutorNutricional, PdpService
> - **Persistencia:** DecisionDeAcceso, MedicionAntropometrica, PlanNutricional, RangosDePlanNutricional, VersionDePlanNutricional
> - **Le delegan:** NutricionController
> - «servicio · Nutrición»
> - RecetasService
> - +crear()
> - +listar()
> - +consultar()
> - +editar()
> - +asociarImagen()
> - +retirarImagen()
> - +calcular()
> - **Recibe:** EjecutorNutricional, CatalogoService, MediosService
> - **Persistencia:** AsociacionDeImagenDeReceta, Receta, VersionDeReceta
> - **Le delegan:** RecetasController
> - «servicio · Nutrición»
> - RegistroDeComidasService
> - +hoyConOpciones()
> - +registrar()
> - +consultar()
> - +listarPropios()
> - +rectificar()
> - +anular()
> - **Recibe:** EjecutorNutricional, PdpService, IngestasService, MediosService
> - **Persistencia:** AnulacionDeIngesta, EvidenciaVisualDeIngesta, IngestaNutricional, RectificacionDeCantidades, VersionDePlanNutricional
> - **Le delegan:** RegistroDeComidasController
> - «servicio · Nutrición»
> - RevisionesService
> - +contexto()
> - +registrar()
> - +consultar()
> - +evidencia()
> - +listarPropias()
> - +consultarPropia()
> - +aplicar()
> - +pendiente()
> - **Recibe:** EjecutorNutricional, PdpService, ProcesoService, PlanesService, EvaluacionesService, PublicadorDeNovedades
> - **Persistencia:** AplicacionDeRevision, EvaluacionNutricional, IngestaNutricional, ObjetivoNutricional, PlanNutricional, ProcesoOperativo, RevisionNutricional, VersionDeObjetivoNutricional, VersionDePlanNutricional
> - **Le delegan:** NutricionController
> - API**Entrenamiento**5 controladores · 15 clases inyectables
> - «controlador · Entrenamiento»
> - EntrenamientoController
> - 42 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** EvaluacionesDeEntrenamientoService, CatalogoDeEjerciciosService, PlanesDeEntrenamientoService, EjecucionesDeEntrenamientoService, RevisionesDeEntrenamientoService, LimitadorService, ImportacionDeEjerciciosService, PlantillasDeEntrenamientoService
> - «controlador · Entrenamiento»
> - EntrenamientoPorSerieController
> - 10 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** ObjetivosPorSerieService, TiemposDeSesionService, ImagenesDeEjercicioService, LimitadorService
> - «controlador · Entrenamiento»
> - FuerzaController
> - 3 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** SeriesObservadasService
> - «controlador · Entrenamiento»
> - HabitualesDeEntrenamientoController
> - 8 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** HabitualesDeEntrenamientoService
> - «controlador · Entrenamiento»
> - NotasDeLaSesionController
> - 3 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** NotasDeLaSesionService, LimitadorService
> - «servicio · Entrenamiento»
> - CatalogoDeEjerciciosService
> - +visibles()
> - +listar()
> - +buscar()
> - +fichas()
> - +crear()
> - +citables()
> - +ejercicioCitable()
> - +vigenteDelEjercicio()
> - +esProfesionalDeEntrenamiento()
> - **Recibe:** PrismaService, EjecutorDeEntrenamiento, PdpService
> - **Persistencia:** EjercicioDeCatalogo, NombreAlternativoDeEjercicio, PlanDeEntrenamiento, RetiroDeNombreAlternativoDeEjercicio, VersionDeEjercicio
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - CompatibilidadDeClientesService
> - +titularCapaz()
> - +registrarDeclaracion()
> - +registrarRetencion()
> - **Recibe:** PrismaService, AuditoriaService
> - **Persistencia:** CapacidadDeClienteDeclarada
> - «servicio · Entrenamiento»
> - EjecucionesDeEntrenamientoService
> - +hoy()
> - +agenda()
> - +ocurrenciasDelPeriodo()
> - +abrirBorrador()
> - +consultarBorrador()
> - +editarBorrador()
> - +confirmar()
> - +listarHistoriaPropia()
> - +consultarEjecucion()
> - +corregir()
> - +planConProcesoAbierto()
> - +versionesPertinentes()
> - +borradorDelTitular()
> - +ejecucionRevelable()
> - +ejecucionApi()
> - +ejecucionesApi()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService, CatalogoDeEjerciciosService, CompatibilidadDeClientesService
> - **Persistencia:** BorradorDeEjecucionDeEntrenamiento, CorreccionDeEjecucionDeEntrenamiento, EjecucionDeEntrenamiento, PlanDeEntrenamiento, ProcesoOperativo, VersionDePlanDeEntrenamiento
> - **Le delegan:** EntrenamientoController
> - «ejecutor · Entrenamiento»
> - EjecutorDeEntrenamiento
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Entrenamiento»
> - EvaluacionesDeEntrenamientoService
> - +crearEvaluacion()
> - +listarEvaluaciones()
> - +consultarEvaluacion()
> - +crearObjetivo()
> - +emitirVersionDeObjetivo()
> - +listarObjetivos()
> - +objetivoEfectivo()
> - +efectivaDe()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService
> - **Persistencia:** CitaDeRespuestaEnEvaluacionDeEntrenamiento, EvaluacionDeEntrenamiento, ObjetivoDeEntrenamiento, VersionDeObjetivoDeEntrenamiento
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - HabitualesDeEntrenamientoService
> - +listarEjercicios()
> - +marcarEjercicio()
> - +listarSesiones()
> - +guardarSesion()
> - +editarSesion()
> - **Recibe:** EjecutorDeEntrenamiento, CatalogoDeEjerciciosService
> - **Persistencia:** EjercicioDeCatalogo, EjercicioHabitual, SesionHabitual, VersionDeEjercicio
> - **Le delegan:** HabitualesDeEntrenamientoController
> - «servicio · Entrenamiento»
> - ImagenesDeEjercicioService
> - +listar()
> - +asociar()
> - +retirar()
> - +cambiarZonas()
> - **Recibe:** EjecutorDeEntrenamiento, MediosService
> - **Persistencia:** AsociacionDeImagenDeEjercicio, EjercicioDeCatalogo, VersionDeEjercicio
> - **Le delegan:** EntrenamientoPorSerieController
> - «servicio · Entrenamiento»
> - ImportacionDeEjerciciosService
> - +crearCandidato()
> - +resolver()
> - **Recibe:** PrismaService, EjecutorDeEntrenamiento, CatalogoDeEjerciciosService, Wger
> - **Persistencia:** CandidatoDeImportacion, EjercicioDeCatalogo, ResolucionDeCandidato, VersionDeEjercicio
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - NotasDeLaSesionService
> - +agregar()
> - +propias()
> - +delProfesional()
> - **Recibe:** EjecutorDeEntrenamiento, EjecucionesDeEntrenamientoService, PdpService
> - **Persistencia:** EjecucionDeEntrenamiento, NotaDeEjecucion
> - **Le delegan:** NotasDeLaSesionController
> - «servicio · Entrenamiento»
> - ObjetivosPorSerieService
> - +consultarPlan()
> - +consultarSesion()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService, CatalogoDeEjerciciosService, EjecucionesDeEntrenamientoService, CompatibilidadDeClientesService
> - **Persistencia:** BorradorDeEjecucionDeEntrenamiento, VersionDePlanDeEntrenamiento
> - **Le delegan:** EntrenamientoPorSerieController
> - «servicio · Entrenamiento»
> - PlanesDeEntrenamientoService
> - +crearBorrador()
> - +crearVersionBorrador()
> - +listar()
> - +consultar()
> - +editarBorrador()
> - +validar()
> - +activar()
> - +descartar()
> - +leerVersion()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService, CatalogoDeEjerciciosService, EvaluacionesDeEntrenamientoService, ProcesoService, PlantillasDeEntrenamientoService, CompatibilidadDeClientesService, PublicadorDeNovedades
> - **Persistencia:** InstantaneaDePlanDeEntrenamiento, ObjetivoDeEntrenamiento, PlanDeEntrenamiento, ProcesoOperativo, VersionDePlanDeEntrenamiento
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - PlantillasDeEntrenamientoService
> - +crear()
> - +listar()
> - +consultar()
> - +nuevaVersion()
> - +editar()
> - +versionParaAplicar()
> - **Recibe:** EjecutorDeEntrenamiento, CatalogoDeEjerciciosService
> - **Persistencia:** PlantillaDePlanDeEntrenamiento, VersionDePlanDeEntrenamiento, VersionDePlantillaDePlanDeEntrenamiento
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - RevisionesDeEntrenamientoService
> - +contexto()
> - +registrar()
> - +consultar()
> - +evidencia()
> - +listarPropias()
> - +consultarPropia()
> - +aplicar()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService, ProcesoService, PlanesDeEntrenamientoService, EvaluacionesDeEntrenamientoService, EjecucionesDeEntrenamientoService, PublicadorDeNovedades
> - **Persistencia:** AplicacionDeRevisionDeEntrenamiento, EjecucionDeEntrenamiento, EvaluacionDeEntrenamiento, ObjetivoDeEntrenamiento, PlanDeEntrenamiento, ProcesoOperativo, RevisionDeEntrenamiento, VersionDeObjetivoDeEntrenamiento, VersionDePlanDeEntrenamiento
> - **Le delegan:** EntrenamientoController
> - «servicio · Entrenamiento»
> - SeriesObservadasService
> - +registrar()
> - +listar()
> - +suceder()
> - **Recibe:** EjecutorDeEntrenamiento, PdpService
> - **Persistencia:** SerieObservada
> - **Le delegan:** FuerzaController
> - «servicio · Entrenamiento»
> - TiemposDeSesionService
> - +registrar()
> - +consultarDelBorrador()
> - +consultarDeLaEjecucion()
> - +sesionEnCurso()
> - **Recibe:** EjecutorDeEntrenamiento, EjecucionesDeEntrenamientoService
> - **Persistencia:** BorradorDeEjecucionDeEntrenamiento, EjecucionDeEntrenamiento, EventoDeTiempoDeEntrenamiento
> - **Le delegan:** EntrenamientoPorSerieController
> - API**Antropometría**1 controlador · 7 clases inyectables
> - «controlador · Antropometría»
> - AntropometriaController
> - 19 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** EspecificacionesService, EvaluacionesAntropometricasService, MedicionesService, EvolucionService, MetodosService, CalculosService, LimitadorService
> - «servicio · Antropometría»
> - CalculosService
> - +ejecutarCalculo()
> - +listar()
> - +consultar()
> - +adoptar()
> - **Recibe:** EjecutorAntropometrico, PdpService
> - **Persistencia:** EjecucionDeCalculo, MedicionAntropometrica, PerfilProfesional, ReferenciaDeCalculo, VersionDeEspecificacionAntropometrica
> - **Le delegan:** AntropometriaController
> - «ejecutor · Antropometría»
> - EjecutorAntropometrico
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Antropometría»
> - EspecificacionesService
> - +listar()
> - **Recibe:** EjecutorAntropometrico
> - **Persistencia:** VersionDeEspecificacionAntropometrica
> - **Le delegan:** AntropometriaController
> - «servicio · Antropometría»
> - EvaluacionesAntropometricasService
> - +crearRegistrada()
> - +crearBorrador()
> - +guardarBorrador()
> - +registrar()
> - +listarBorradores()
> - +listarRegistradas()
> - +consultar()
> - **Recibe:** EjecutorAntropometrico, PdpService
> - **Persistencia:** EjecucionDeCalculo, EntradaDeCalculo, EvaluacionAntropometrica, MedicionAntropometrica, VersionDeEspecificacionAntropometrica
> - **Le delegan:** AntropometriaController
> - «servicio · Antropometría»
> - EvolucionService
> - +consultar()
> - **Recibe:** EjecutorAntropometrico, PdpService
> - **Persistencia:** EjecucionDeCalculo, MedicionAntropometrica
> - **Le delegan:** AntropometriaController
> - «servicio · Antropometría»
> - MedicionesService
> - +corregir()
> - +anular()
> - **Recibe:** EjecutorAntropometrico, PdpService
> - **Persistencia:** AnulacionDeMedicion, CorreccionDeMedicion, EjecucionDeCalculo, MedicionAntropometrica
> - **Le delegan:** AntropometriaController
> - «servicio · Antropometría»
> - MetodosService
> - +listar()
> - +consultar()
> - **Recibe:** EjecutorAntropometrico
> - **Persistencia:** VersionDeEspecificacionAntropometrica
> - **Le delegan:** AntropometriaController
> - API**Formularios**3 controladores · 8 clases inyectables
> - «controlador · Formularios»
> - FormulariosController
> - 8 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** PlantillasService, SolicitudesService, RespuestasService, LimitadorService
> - «controlador · Formularios»
> - FormulariosDeInicioController
> - 8 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** VistasV2Service, RespuestasV2Service, PropuestasService, LimitadorService
> - «controlador · Formularios»
> - HabitosController
> - 9 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** HabitosService, LimitadorService
> - «ejecutor · Formularios»
> - EjecutorDeFormularios
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Formularios»
> - HabitosService
> - +mios()
> - +registrar()
> - +compartir()
> - +dejarDeCompartir()
> - +deLaPersona()
> - +pedirAcceso()
> - +paraElProfesional()
> - +pedidosQueEsperan()
> - +responderPedido()
> - **Recibe:** EjecutorDeFormularios, PdpService, PublicadorDeNovedades
> - **Persistencia:** PedidoDeAccesoAHabitos
> - **Le delegan:** HabitosController
> - «servicio · Formularios»
> - PlantillasService
> - +listar()
> - +consultar()
> - **Recibe:** EjecutorDeFormularios
> - **Persistencia:** PlantillaDeFormulario, VersionDePlantillaDeFormulario
> - **Le delegan:** FormulariosController
> - «servicio · Formularios»
> - PropuestasService
> - +cargar()
> - +retirar()
> - +rechazar()
> - **Recibe:** EjecutorDeFormularios, PdpService, PublicadorDeNovedades
> - **Persistencia:** PropuestaDeRespuestaDeFormulario, SolicitudDeFormulario
> - **Le delegan:** FormulariosDeInicioController
> - «servicio · Formularios»
> - RespuestasService
> - +responder()
> - +rectificar()
> - **Recibe:** EjecutorDeFormularios, PdpService
> - **Persistencia:** PropuestaDeRespuestaDeFormulario, RectificacionDeRespuestaDeFormulario, RespuestaDeFormulario, SolicitudDeFormulario, VersionDePlantillaDeFormulario
> - **Le delegan:** FormulariosController
> - «servicio · Formularios»
> - RespuestasV2Service
> - +responder()
> - +corregir()
> - **Recibe:** EjecutorDeFormularios, PdpService, PublicadorDeNovedades
> - **Persistencia:** PropuestaDeRespuestaDeFormulario, RectificacionDeRespuestaDeFormulario, RespuestaDeFormulario, SolicitudDeFormulario
> - **Le delegan:** FormulariosDeInicioController
> - «servicio · Formularios»
> - SolicitudesService
> - +crear()
> - +listar()
> - +consultarDetalle()
> - +listarPropias()
> - **Recibe:** EjecutorDeFormularios, PdpService
> - **Persistencia:** PerfilProfesional, RespuestaDeFormulario, SolicitudDeFormulario, VersionDePlantillaDeFormulario, Vinculo
> - **Le delegan:** FormulariosController
> - «servicio · Formularios»
> - VistasV2Service
> - +definicion()
> - +bandeja()
> - +vista()
> - **Recibe:** EjecutorDeFormularios, PdpService
> - **Persistencia:** PerfilProfesional, PropuestaDeRespuestaDeFormulario, RespuestaDeFormulario, SolicitudDeFormulario, VersionDePlantillaDeFormulario
> - **Le delegan:** FormulariosDeInicioController
> - API**Medios**2 controladores · 3 clases inyectables
> - «controlador · Medios»
> - MediosController
> - 3 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** MediosService, LimitadorService
> - «controlador · Medios»
> - RutasFirmadasController
> - 2 operaciones HTTP
> - sin guard de sesión
> - **Delega en:** MediosService
> - «ejecutor · Medios»
> - EjecutorDeMedios
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Medios»
> - MediosService
> - +crearIntencion()
> - +subir()
> - +acceso()
> - +contenido()
> - +suprimir()
> - +problemasDeReferencia()
> - **Recibe:** PrismaService, EjecutorDeMedios, PdpService, AuditoriaService, RutasFirmadas
> - **Persistencia:** ActoRegistrable, AsociacionDeImagenDeEjercicio, AsociacionDeImagenDeReceta, EjercicioDeCatalogo, InstantaneaDePlanDeEntrenamiento, InstantaneaDePlanNutricional, Medio, PlanDeEntrenamiento, PlanNutricional, Receta, RegistroDeSupresion, VersionDePlanDeEntrenamiento, VersionDePlanNutricional
> - **Le delegan:** MediosController, RutasFirmadasController
> - «adaptador · Medios»
> - RutasFirmadas
> - +vencimiento()
> - +firmar()
> - +verificar()
> - API**Integraciones**2 clases inyectables
> - «adaptador · Integraciones»
> - OpenFoodFacts
> - +consultar()
> - «adaptador · Integraciones»
> - Wger
> - +consultar()
> - API**Novedades**2 controladores · 5 clases inyectables
> - «controlador · Novedades»
> - NovedadesController
> - 6 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** NovedadesService, LimitadorService
> - «controlador · Novedades»
> - TareasController
> - 1 operación HTTP
> - sin guard de sesión
> - **Delega en:** RecordatoriosService
> - «adaptador · Novedades»
> - CanalExpo
> - +enviar()
> - «servicio · Novedades»
> - DespachadorDeAvisos
> - +programar()
> - +onModuleDestroy()
> - +despachar()
> - **Recibe:** PrismaService, CanalExpo
> - **Persistencia:** AvisoPush, LecturaDeNovedad, Novedad, SuscripcionPush
> - «servicio · Novedades»
> - NovedadesService
> - +listar()
> - +abrir()
> - +registrarSuscripcion()
> - +retirarSuscripcion()
> - +preferencias()
> - +reemplazarPreferencias()
> - **Recibe:** PrismaService, AuditoriaService
> - **Persistencia:** AlcanceDeVinculo, EventoDeVerificacion, LecturaDeNovedad, NotaDeCoordinacion, Novedad, PedidoDeAccesoAPlan, PerfilProfesional, PreferenciaDeRecordatorio, SolicitudDeVinculo, SuscripcionPush, Vinculo
> - **Le delegan:** NovedadesController
> - «servicio · Novedades»
> - PublicadorDeNovedades
> - +publicar()
> - **Recibe:** DespachadorDeAvisos
> - **Persistencia:** Novedad
> - «servicio · Novedades»
> - RecordatoriosService
> - +correr()
> - **Recibe:** PrismaService, PdpService, PublicadorDeNovedades, DespachadorDeAvisos
> - **Persistencia:** AnulacionDeIngesta, IngestaNutricional, PlanDeEntrenamiento, PlanNutricional, PreferenciaDeRecordatorio, ProcesoOperativo, VersionDePlanDeEntrenamiento
> - **Le delegan:** TareasController
> - API**Coordinación**1 controlador · 2 clases inyectables
> - «controlador · Coordinación»
> - NotasDeCoordinacionController
> - 3 operaciones HTTP
> - protegido por SesionGuard; PdpGuard en 1 de 3
> - **Delega en:** NotasDeCoordinacionService, LimitadorService
> - «ejecutor · Coordinación»
> - EjecutorDeCoordinacion
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Coordinación»
> - NotasDeCoordinacionService
> - +crear()
> - +destinatarios()
> - +propias()
> - **Recibe:** EjecutorDeCoordinacion, PdpService, PrismaService, PublicadorDeNovedades
> - **Persistencia:** DestinatarioDeNota, EvaluacionAntropometrica, NotaDeCoordinacion, ReferenciaDeNota, RevisionDeEntrenamiento, RevisionNutricional, VersionDePlanDeEntrenamiento, VersionDePlanNutricional, Vinculo
> - **Le delegan:** NotasDeCoordinacionController
> - API**Resúmenes**1 controlador · 2 clases inyectables
> - «controlador · Resúmenes»
> - ResumenesController
> - 9 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** ResumenesService, LimitadorService
> - «ejecutor · Resúmenes»
> - EjecutorDeResumenes
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Resúmenes»
> - ResumenesService
> - +mios()
> - +compartir()
> - +dejarDeCompartir()
> - +paraElProfesional()
> - +plan()
> - +loQueSeComparte()
> - +pedirVerElPlan()
> - +pedidosQueEsperan()
> - +responderPedido()
> - **Recibe:** EjecutorDeResumenes, PdpService, PublicadorDeNovedades, PlanesService, PlanesDeEntrenamientoService, EvaluacionesService, EvaluacionesDeEntrenamientoService, ProcesoService
> - **Persistencia:** EjecucionDeEntrenamiento, IngestaNutricional, ObjetivoDeEntrenamiento, ObjetivoNutricional, PedidoDeAccesoAPlan, ProcesoOperativo, VersionDePlanDeEntrenamiento
> - **Le delegan:** ResumenesController
> - API**Análisis**2 controladores · 2 clases inyectables
> - «controlador · Análisis»
> - AnalisisController
> - 3 operaciones HTTP
> - protegido por SesionGuard, PdpGuard
> - **Delega en:** PrismaService, EjecucionesDeEntrenamientoService
> - «controlador · Análisis»
> - VistasDeAnalisisController
> - 4 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** VistasDeAnalisisService
> - «ejecutor · Análisis»
> - EjecutorDeVistas
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Análisis»
> - VistasDeAnalisisService
> - +listar()
> - +crear()
> - +reemplazar()
> - +borrar()
> - **Recibe:** EjecutorDeVistas
> - **Persistencia:** VistaDeAnalisis
> - **Le delegan:** VistasDeAnalisisController
> - API**Notas propias**1 controlador · 2 clases inyectables
> - «controlador · Notas propias»
> - NotasPropiasController
> - 3 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** NotasPropiasService, LimitadorService
> - «ejecutor · Notas propias»
> - EjecutorDeNotasPropias
> - hereda los métodos de EjecutorDeDominio
> - **Hereda de:** EjecutorDeDominio
> - «servicio · Notas propias»
> - NotasPropiasService
> - +agregar()
> - +listar()
> - +archivar()
> - **Recibe:** EjecutorDeNotasPropias, PdpService, CatalogoDeEjerciciosService
> - **Persistencia:** ArchivoDeNotaPropia, NotaPropia, VersionDeEjercicio, VersionDePlanDeEntrenamiento, VersionDePlanNutricional
> - **Le delegan:** NotasPropiasController
> - API**Cartera**1 controlador
> - «controlador · Cartera»
> - CarteraController
> - 2 operaciones HTTP
> - protegido por SesionGuard
> - **Delega en:** PrismaService, PdpService, ProcesoService, LimitadorService
> - API**Tablero**1 controlador
> - «controlador · Tablero»
> - DashboardController
> - 1 operación HTTP
> - protegido por SesionGuard, PdpGuard
> - **Delega en:** PrismaService, ProcesoService
> - API**Contacto**1 controlador
> - «controlador · Contacto»
> - ContactoController
> - 1 operación HTTP
> - sin guard de sesión
> - API**Salud del servicio**1 controlador · 1 clase inyectable
> - «controlador · Salud del servicio»
> - HealthController
> - 3 operaciones HTTP
> - sin guard de sesión
> - **Delega en:** HealthService
> - «servicio · Salud del servicio»
> - HealthService
> - +readiness()
> - **Recibe:** PrismaService
> - **Le delegan:** HealthController

# Anexo C. Cómo se generó

*El inventario se genera del esquema y del código del repositorio; las vistas se arman leyendo el código de cada operación.*

**Tabla 8.** De dónde sale cada parte del diagrama.

| Parte | Fuente |
| --- | --- |
| Las clases de persistencia y sus asociaciones | `prisma/schema.prisma`: cada modelo es una clase y cada clave foránea, una asociación con su multiplicidad (1, 0..1 o *, según la columna sea obligatoria o única). |
| Las clases de la API | Las clases `@Injectable()` y `@Controller()` de `apps/api/src`: sus métodos públicos, las clases que reciben en el constructor y las tablas que su archivo lee o escribe, con Prisma o con SQL. |
| El núcleo | `apps/api/src/plataforma/ejecutor.ts` y sus 10 subclases. |
| Las tres operaciones | `nutricion/planes.service.ts` (activar), `nutricion/registro-de-comidas.service.ts` (registrar una comida), `entrenamiento/ejecuciones.service.ts` (confirmar una sesión) y `consentimiento/consentimiento-profesional.service.ts` (revocar), con sus pruebas de integración. |
| Las láminas | Mermaid 11.12.0, un archivo .mmd por lámina, generado del esquema. Cada lámina se dibuja en dos direcciones y queda la que se imprime más grande; si la letra más chica no llega a 7,2 pt en una página apaisada, el grupo se parte en dos y se vuelve a dibujar. |
