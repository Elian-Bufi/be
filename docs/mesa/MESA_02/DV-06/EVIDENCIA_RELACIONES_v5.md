# DV-06 — Registro razonado de relaciones v5

65 registros: se conservan los 62 identificadores por orden v4, se retira R004 y se agregan R063–R065 para representar conexiones expresas omitidas. No se modifica el 06.

EXPRESA reproduce multiplicidad del texto. DERIVACION_JUSTIFICADA distingue su razonamiento en cada fila; no es autorización de DDL. Una celda cardinal vacía significa que la fuente no fija ese extremo o que es dependencia, nunca cero. Las relaciones son conceptuales: ninguna composición autoriza borrado de historia.

## R001 — Identidad BE → Perfil propio

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 1

Identidad confirmada y Perfil propio: 1:1 expresamente declarado. No implica borrado en cascada.

**Fuente:** 06 §5.12, L2392–L2407

> ### 5.12. Relaciones y multiplicidades de M-01
> 
> | Relación | Multiplicidad | Condición |
> |---|---|---|
> | Identidad BE — Perfil propio | `1 : 1` tras registro exitoso | Perfil propio no crea identidad paralela |
> | Identidad BE — Versión de Perfil propio | `1 : 1..N` a través del Perfil propio | una efectiva; previas preservadas |
> | Identidad BE — Método de acceso | `1 : 0..N` | cada método vigente se asocia como máximo a una identidad |
> | Identidad BE — Estado operativo de cuenta | `1 : 1` | token de la máquina de §7 |
> | Identidad BE — Incidencia administrativa como reportante | `1 : 0..N` | acceso/visibilidad en 08 |
> | Incidencia administrativa — responsable administrativo | `1 : 0..1` vigente | asignación/política en 08 |
> | Novedad interna — referencia push | `1 : 0..N` | cada aviso referencia una sola novedad |
> 
> No se modela Perfil profesional como hijo de Perfil propio. Ambos se relacionan con la misma Identidad BE desde áreas distintas.
> 
> ---

## R002 — Identidad BE → Método de acceso

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..N

Una identidad admite 0..N métodos; cada método confirmado pertenece como máximo a una identidad. El extremo 1 corresponde a métodos ya asociados.

**Fuente:** 06 §5.12, L2392–L2407

> ### 5.12. Relaciones y multiplicidades de M-01
> 
> | Relación | Multiplicidad | Condición |
> |---|---|---|
> | Identidad BE — Perfil propio | `1 : 1` tras registro exitoso | Perfil propio no crea identidad paralela |
> | Identidad BE — Versión de Perfil propio | `1 : 1..N` a través del Perfil propio | una efectiva; previas preservadas |
> | Identidad BE — Método de acceso | `1 : 0..N` | cada método vigente se asocia como máximo a una identidad |
> | Identidad BE — Estado operativo de cuenta | `1 : 1` | token de la máquina de §7 |
> | Identidad BE — Incidencia administrativa como reportante | `1 : 0..N` | acceso/visibilidad en 08 |
> | Incidencia administrativa — responsable administrativo | `1 : 0..1` vigente | asignación/política en 08 |
> | Novedad interna — referencia push | `1 : 0..N` | cada aviso referencia una sola novedad |
> 
> No se modela Perfil profesional como hijo de Perfil propio. Ambos se relacionan con la misma Identidad BE desde áreas distintas.
> 
> ---

## R003 — Identidad BE → Incidencia administrativa

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..N

Identidad como reportante, no como sujeto clínico de la incidencia. Cardinalidades expresas.

**Fuente:** 06 §5.12, L2392–L2407

> ### 5.12. Relaciones y multiplicidades de M-01
> 
> | Relación | Multiplicidad | Condición |
> |---|---|---|
> | Identidad BE — Perfil propio | `1 : 1` tras registro exitoso | Perfil propio no crea identidad paralela |
> | Identidad BE — Versión de Perfil propio | `1 : 1..N` a través del Perfil propio | una efectiva; previas preservadas |
> | Identidad BE — Método de acceso | `1 : 0..N` | cada método vigente se asocia como máximo a una identidad |
> | Identidad BE — Estado operativo de cuenta | `1 : 1` | token de la máquina de §7 |
> | Identidad BE — Incidencia administrativa como reportante | `1 : 0..N` | acceso/visibilidad en 08 |
> | Incidencia administrativa — responsable administrativo | `1 : 0..1` vigente | asignación/política en 08 |
> | Novedad interna — referencia push | `1 : 0..N` | cada aviso referencia una sola novedad |
> 
> No se modela Perfil profesional como hijo de Perfil propio. Ambos se relacionan con la misma Identidad BE desde áreas distintas.
> 
> ---

## R004 — Identidad BE → Novedad interna

**Estado:** RETIRADA · **Evidencia:** RETIRADA_NO_SUSTENTADA · **Cardinalidades:** sin fijar : sin fijar

Se retira la asociación de titularidad individual: audiencia estructural no prueba titularRef ni 1:0..N. Novedad conserva audiencia y visibilidad según 08; no se deriva una FK a una sola identidad.

**Fuente:** 06 §5.11.1, L2326–L2343

> #### 5.11.1. Novedad interna (`T-06-07`)
> 
> `Novedad interna` representa contenido operativo **no clínico** consultable desde el centro interno de BE.
> 
> Estructura conceptual mínima:
> 
> | Elemento conceptual | Regla |
> |---|---|
> | identificador | estable |
> | contenido autorizado | no clínico y no sensible según política |
> | fuente o autoría | identificable |
> | momento de publicación/ocurrencia | conservado |
> | momento de registro | conservado cuando difiera |
> | audiencia | referencia estructural para que 08 evalúe visibilidad |
> | procedencia | conservada |
> 
> B-01 no define un ciclo de edición/publicación porque 04/05 no lo aprobaron como máquina.

## R005 — Novedad interna → Notificación push

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..N

Cada push referencia una Novedad; una Novedad puede originar 0..N push. Es referencia, no una segunda fuente clínica.

**Fuente:** 06 §5.12, L2392–L2407

> ### 5.12. Relaciones y multiplicidades de M-01
> 
> | Relación | Multiplicidad | Condición |
> |---|---|---|
> | Identidad BE — Perfil propio | `1 : 1` tras registro exitoso | Perfil propio no crea identidad paralela |
> | Identidad BE — Versión de Perfil propio | `1 : 1..N` a través del Perfil propio | una efectiva; previas preservadas |
> | Identidad BE — Método de acceso | `1 : 0..N` | cada método vigente se asocia como máximo a una identidad |
> | Identidad BE — Estado operativo de cuenta | `1 : 1` | token de la máquina de §7 |
> | Identidad BE — Incidencia administrativa como reportante | `1 : 0..N` | acceso/visibilidad en 08 |
> | Incidencia administrativa — responsable administrativo | `1 : 0..1` vigente | asignación/política en 08 |
> | Novedad interna — referencia push | `1 : 0..N` | cada aviso referencia una sola novedad |
> 
> No se modela Perfil profesional como hijo de Perfil propio. Ambos se relacionan con la misma Identidad BE desde áreas distintas.
> 
> ---

## R006 — Identidad BE → Cierre de cuenta

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Acto terminal de cierre de una identidad, no número de eventos de auditoría ni reintentos HTTP. El máximo uno se infiere de la terminalidad; el historial se preserva.

**Fuente:** 06 §5.8.1, L2181–L2199

> #### 5.8.1. Acto estructural
> 
> **`REG-06-24` — Cierre no destructivo.** `CerrarCuenta` produce un cambio operativo y eventos derivados, no un borrado histórico.
> 
> El cierre debe:
> 
> 1. dejar `Estado operativo de cuenta = CERRADA`;
> 2. impedir nuevas sesiones;
> 3. impedir nuevas operaciones;
> 4. hacer que las sesiones activas dejen de ser utilizables conforme a 07/08;
> 5. solicitar la finalización trazable de vínculos activos mediante las máquinas que definan `M-03/M-04`;
> 6. preservar Identidad BE;
> 7. preservar Perfil propio y sus versiones;
> 8. preservar autorías e historia;
> 9. no borrar revisiones, planes, mediciones ni decisiones;
> 10. registrar `CuentaCerrada`.
> 
> B-01 no define el mecanismo de invalidación de sesión ni las transiciones de vínculo/proceso: declara el **efecto requerido de coordinación** para sus bloques propietarios.

## R007 — Identidad BE → Especialidad

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..2

Se corrige el propietario a Identidad BE. Cero, una o ambas especialidades son expresas; 1 identifica la pertenencia contextual de la declaración, no la propiedad exclusiva del catálogo de especialidades.

**Fuente:** 06 §6.5, L2770–L2779

> ### 6.5. Especialidad, capacidad y Alcance
> 
> Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.
> 
> La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.
> 
> **`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.
> 
> Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.

## R008 — Identidad BE → Capacidad antropométrica

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Se corrige el propietario a Identidad BE. La capacidad antropométrica puede existir sin especialidades; 0..1 representa su declaración por identidad, no verificaciones históricas.

**Fuente:** 06 §6.5, L2770–L2779

> ### 6.5. Especialidad, capacidad y Alcance
> 
> Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.
> 
> La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.
> 
> **`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.
> 
> Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.

## R009 — Alcance profesional → Verificación profesional

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Se representa Alcance profesional en lugar de solo Especialidad. Cada solicitud verifica un alcance bajo identidad; nuevas presentaciones tras rechazo son ciclos distintos. No es 1:1 histórico.

**Fuente:** 06 §6.5, L2770–L2779; 06 §6.7, L2806–L2815

> ### 6.5. Especialidad, capacidad y Alcance
> 
> Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.
> 
> La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.
> 
> **`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.
> 
> Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.
> 
> ### 6.7. Solicitud y evidencia
> 
> Una `Solicitud de verificación` conserva identificador, Identidad profesional, exactamente un Alcance, ordinal de presentación, Versión de evidencia, actor/autoría, ocurrencia/registro, procedencia y antecedente cuando exista.
> 
> **`REG-06-34` — Evidencia presentada como Versión.** Cada presentación confirmada usa B-06; presentar no equivale a aprobar y nunca sobrescribe evidencia revisada.
> 
> **`REG-06-35` — Una trayectoria pendiente equivalente.** Para una misma Identidad BE + Alcance solo existe una trayectoria `PENDIENTE`; una subsanación continúa esa trayectoria. Tras un rechazo, una nueva presentación permitida crea un ciclo relacionado, no borra el anterior.
> 
> **`REG-06-36` — Ciclo numerado sin límite fijado por 06.** B-02 conserva ordinal monotónico. No fija máximo ni plazo; 08 puede limitar la admisibilidad.

## R010 — Verificación profesional → Observación / subsanación

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Observaciones como hechos ligados a solicitud/alcance/versión revisada. Cero o varias se infiere de su carácter eventual y subsanable; no se crea un quinto estado de verificación.

**Fuente:** 06 §6.8, L2816–L2845

> ### 6.8. Máquina de Verificación profesional por Alcance
> 
> #### 6.8.1. Estados cerrados
> 
> ```text
> PENDIENTE
> VERIFICADO
> RECHAZADO
> SUSPENDIDO
> ```
> 
> #### 6.8.2. Lista blanca
> 
> | Transición | Origen → destino | Actor | Condición | Efecto |
> |---|---|---|---|---|
> | `PresentarAlcance` | inicio → `PENDIENTE` | profesional | Alcance identificable + presentación válida | crea trayectoria y Versión |
> | `RegistrarObservacion` | `PENDIENTE → PENDIENTE` | administrador | versión exacta revisada + fundamento | registra observación |
> | `PresentarSubsanacion` | `PENDIENTE → PENDIENTE` | profesional | subsanación admitida | nueva Versión relacionada |
> | `VerificarAlcance` | `PENDIENTE → VERIFICADO` | administrador | resolución favorable | afecta solo ese Alcance |
> | `RechazarAlcance` | `PENDIENTE → RECHAZADO` | administrador | resolución desfavorable | conserva expediente |
> | `VolverAPresentar` | `RECHAZADO → PENDIENTE` | profesional | nueva presentación admitida | nuevo ciclo relacionado |
> | `SuspenderAlcance` | `VERIFICADO → SUSPENDIDO` | administrador | resolución explícita + motivo | corta nuevas operaciones |
> | `RehabilitarAlcance` | `SUSPENDIDO → VERIFICADO` | administrador | resolución explícita | restaura solo verificación |
> 
> Toda transición no listada está prohibida.
> 
> **`REG-06-37` — Observación no es quinto estado.** Es un hecho/tarea trazable ligado a solicitud, Alcance, Versión revisada, fundamento y posibilidad de subsanación.
> 
> **`REG-06-38` — Resolución específica de Versión y Alcance.** Toda resolución identifica una única Versión efectivamente revisada y un único Alcance.

## R011 — Verificación profesional → Habilitación

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Verificación y habilitación son dimensiones distintas. La dependencia no significa concesión automática ni composición.

**Fuente:** 06 §6.6, L2780–L2805

> ### 6.6. Habilitación
> 
> `Habilitación` es una dimensión independiente por Identidad + Alcance cuando aplique.
> 
> ```text
> VERIFICADO
> ≠ Habilitación efectiva
> ≠ Autorización sobre datos
> ```
> 
> #### 6.6.1. Modelo separado de Verificación profesional — `7.13-01`
> 
> La unidad `7.13-01` queda resuelta explícitamente mediante una relación estructural separada:
> 
> ```text
> Identidad BE
>   ├─ Verificación profesional por Alcance
>   └─ Habilitación por Alcance, cuando aplique
> ```
> 
> Ambas pueden coexistir con resultados distintos. La existencia, cambio o resolución favorable de una no muta la otra por implicación.
> 
> **`REG-06-33` — Verificación no crea Habilitación.** La resolución `VERIFICADO` nunca habilita por inferencia.
> 
> B-02 conserva la referencia estructural a Habilitación; la regla que la determina, su condición académica/comercial y la capacidad configurada se coordinan con M-05 y las políticas propietarias posteriores. B-02 no convierte Habilitación en estado de la máquina de Verificación ni en autorización de datos.

## R012 — Identidad BE → Capacidad configurada

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Se corrige el propietario a Identidad BE profesional. Una configuración efectiva común a Nutrición y Entrenamiento; 0 admite ausencia previa a configuración y no limita su historia versionada.

**Fuente:** 06 §9.5.1, L3734–L3739

> #### 9.5.1. Propiedad
> 
> **`REG-06-81` — La capacidad pertenece a la identidad profesional.**
> 
> Existe una única capacidad efectiva por identidad profesional para el cómputo. Nutrición y Entrenamiento no poseen bandas separadas que dupliquen al asesorado.

## R013 — Solicitud de vínculo → Vínculo — componente de alcance

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Una solicitud tiene exactamente un alcance; solo su aceptación crea/incorpora componente. El máximo 1 es derivación por solicitud aceptada, no límite de componentes del vínculo global.

**Fuente:** 06 §7.3, L3010–L3041; 06 §7.5, L3089–L3118

> ### 7.3. Solicitud de vínculo
> 
> Una Solicitud conserva identificador, profesional, asesorado o referencia de invitación pendiente, exactamente un Alcance, finalidad, actor iniciador, doble temporalidad, procedencia, estado y antecedente si se reitera.
> 
> La solicitud es atómica por Alcance; un Vínculo puede agrupar varios Alcances, manteniendo decisiones independientes.
> 
> #### 7.3.1. Estados
> 
> ```text
> PENDIENTE
> ACEPTADA
> RECHAZADA
> CADUCADA
> INVALIDADA
> ```
> 
> Los cuatro últimos son terminales para esa Solicitud concreta.
> 
> #### 7.3.2. Lista blanca
> 
> | Transición | Origen → destino | Actor | Condición | Efecto |
> |---|---|---|---|---|
> | `CrearSolicitud` | inicio → `PENDIENTE` | profesional o asesorado | Alcance/finalidad + elegibilidad estructural | no acceso; no capacidad |
> | `AceptarSolicitud` | `PENDIENTE → ACEPTADA` | asesorado | confirmación explícita + reevaluación | crea/incorpora Alcance de Vínculo |
> | `RechazarSolicitud` | `PENDIENTE → RECHAZADA` | asesorado | confirmación explícita | conserva antecedente |
> | `CaducarSolicitud` | `PENDIENTE → CADUCADA` | sistema bajo política 08 | condición temporal | plazo no fijado aquí |
> | `InvalidarSolicitud` | `PENDIENTE → INVALIDADA` | sistema/actor propietario | elegibilidad o contenido ya incompatibles | requiere nueva Solicitud |
> 
> **`REG-06-44` — Solicitud equivalente pendiente única.** Coinciden profesional, destinatario resoluble, Alcance y finalidad; solo una puede estar `PENDIENTE`.
> 
> **`REG-06-45` — Caducidad sin plazo en M-03.** B-03 define la transición, no la duración. Reiterar crea nueva Solicitud relacionada.
> 
> ### 7.5. Vínculo por Alcance
> 
> `Vínculo` agrupa `1..N` componentes de Alcance. Cada componente conserva Alcance, finalidad, Solicitud de origen, estado, actor/autoría, ocurrencia/registro, procedencia y motivo cuando aplique.
> 
> La máquina de T-06-15 opera por Alcance, evitando que un estado global oculte divergencias.
> 
> #### 7.5.1. Estados
> 
> ```text
> ACEPTADO
> PAUSADO
> FINALIZADO
> ```
> 
> #### 7.5.2. Lista blanca
> 
> | Transición | Origen → destino | Actor | Condición | Efecto |
> |---|---|---|---|---|
> | `AceptarAlcanceDeVinculo` | inicio → `ACEPTADO` | asesorado | Solicitud `ACEPTADA` | no concede Consentimiento |
> | `PausarAlcance` | `ACEPTADO → PAUSADO` | actor habilitado por 08 | decisión + motivo | bloquea operaciones incompatibles |
> | `ReanudarAlcance` | `PAUSADO → ACEPTADO` | actor habilitado por 08 | decisión explícita | no restaura otros gates |
> | `FinalizarAlcance` | `ACEPTADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva historia |
> | `FinalizarAlcance` | `PAUSADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva pausa previa |
> 
> `FINALIZADO` no tiene salida.
> 
> **`REG-06-47` — Operación total explícita.** Pausa/finalización total aplica transiciones por cada Alcance elegible; nunca hay cascada implícita.
> 
> **`REG-06-48` — Reanudación no restaura gates externos.** Solo cambia el Vínculo por Alcance.

## R014 — Vínculo — componente de alcance → Consentimiento vigente

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Consentimiento se lee como trayectoria versionada por titular/profesional/componente/finalidad. Cada decisión genera nueva versión. No equivale a N consentimientos simultáneamente vigentes.

**Fuente:** 06 §7.7, L3125–L3180

> ### 7.7. Consentimiento vigente
> 
> Se identifica longitudinalmente por asesorado + profesional + Alcance de Vínculo + finalidad.
> 
> #### 7.7.1. Relación Vínculo / Consentimiento / finalidad / Alcance — `7.5-01`
> 
> El consentimiento aplicable referencia exactamente:
> 
> - asesorado titular;
> - profesional;
> - componente de Vínculo por Alcance;
> - finalidad concreta;
> - Versión de consentimiento.
> 
> La relación no convierte Vínculo en Consentimiento ni permite ampliar finalidad o Alcance por inferencia.
> 
> #### 7.7.2. Reconstrucción de qué consentimiento gobernaba una operación — `7.5-02`
> 
> `REG-06-50` se aplica además como regla de reconstrucción: la estructura permite que una operación protegida/auditada conserve o resuelva una referencia a la **Versión de Consentimiento que era aplicable** en su contexto.
> 
> B-03 define la relación versionada; 08 define qué operaciones deben registrar esa referencia, la política de autorización y la auditoría. Una versión posterior nunca reescribe cuál gobernaba una operación histórica.
> 
> #### 7.7.3. Asimetría entre revocación y finalización — `7.5-05`
> 
> La unidad queda saldada por la combinación de:
> 
> - `REG-06-51`: revocar corta operaciones futuras del Alcance, preserva historia y no finaliza el Vínculo;
> - `REG-06-52`: pausar/finalizar Vínculo no crea Revocación implícita;
> - `INV-06-63`: Revocación no finaliza automáticamente el Vínculo;
> - `INV-06-64`: finalizar Vínculo no borra evidencia histórica de Consentimiento;
> - B-06: historia por adición y no sobrescritura.
> 
> Esta asimetría es normativa y no se reduce a una coincidencia de implementación.
> 
> **`REG-06-50` — Consentimiento siempre versionado.** Cada decisión expresa emite nueva `Versión` de B-06, conserva versión/texto referenciado de 08, actor, Alcance, finalidad, ocurrencia/registro y procedencia. Aceptar una versión nunca acepta futuras.
> 
> #### 7.7.4. Situaciones
> 
> ```text
> VIGENTE
> REVOCADO
> ```
> 
> #### 7.7.5. Transiciones
> 
> | Transición | Origen → destino | Actor | Efecto |
> |---|---|---|---|
> | `OtorgarConsentimiento` | inicio → `VIGENTE` | asesorado | primera Versión |
> | `AceptarNuevaVersion` | `VIGENTE → VIGENTE` | asesorado | Versión sucesora explícita |
> | `RevocarConsentimiento` | `VIGENTE → REVOCADO` | asesorado | Versión + evento de revocación |
> | `OtorgarNuevamente` | `REVOCADO → VIGENTE` | asesorado | nueva decisión explícita cuando 08 lo permita |
> 
> **`REG-06-51` — Revocación corta futuras operaciones sin borrar historia.** No finaliza Vínculo ni otros Alcances; SLA/retención/lectura histórica son de 08.
> 
> **`REG-06-52` — Estado de Vínculo no muta consentimiento implícitamente.** Pausar/finalizar no crea Revocación automática.

## R015 — Consentimiento vigente → Revocación

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Una revocación referencia la versión/otorgamiento que revoca. Máximo uno efectivo por esa versión; un nuevo otorgamiento permite una nueva revocación y conserva historia.

**Fuente:** 06 §7.7, L3125–L3180

> ### 7.7. Consentimiento vigente
> 
> Se identifica longitudinalmente por asesorado + profesional + Alcance de Vínculo + finalidad.
> 
> #### 7.7.1. Relación Vínculo / Consentimiento / finalidad / Alcance — `7.5-01`
> 
> El consentimiento aplicable referencia exactamente:
> 
> - asesorado titular;
> - profesional;
> - componente de Vínculo por Alcance;
> - finalidad concreta;
> - Versión de consentimiento.
> 
> La relación no convierte Vínculo en Consentimiento ni permite ampliar finalidad o Alcance por inferencia.
> 
> #### 7.7.2. Reconstrucción de qué consentimiento gobernaba una operación — `7.5-02`
> 
> `REG-06-50` se aplica además como regla de reconstrucción: la estructura permite que una operación protegida/auditada conserve o resuelva una referencia a la **Versión de Consentimiento que era aplicable** en su contexto.
> 
> B-03 define la relación versionada; 08 define qué operaciones deben registrar esa referencia, la política de autorización y la auditoría. Una versión posterior nunca reescribe cuál gobernaba una operación histórica.
> 
> #### 7.7.3. Asimetría entre revocación y finalización — `7.5-05`
> 
> La unidad queda saldada por la combinación de:
> 
> - `REG-06-51`: revocar corta operaciones futuras del Alcance, preserva historia y no finaliza el Vínculo;
> - `REG-06-52`: pausar/finalizar Vínculo no crea Revocación implícita;
> - `INV-06-63`: Revocación no finaliza automáticamente el Vínculo;
> - `INV-06-64`: finalizar Vínculo no borra evidencia histórica de Consentimiento;
> - B-06: historia por adición y no sobrescritura.
> 
> Esta asimetría es normativa y no se reduce a una coincidencia de implementación.
> 
> **`REG-06-50` — Consentimiento siempre versionado.** Cada decisión expresa emite nueva `Versión` de B-06, conserva versión/texto referenciado de 08, actor, Alcance, finalidad, ocurrencia/registro y procedencia. Aceptar una versión nunca acepta futuras.
> 
> #### 7.7.4. Situaciones
> 
> ```text
> VIGENTE
> REVOCADO
> ```
> 
> #### 7.7.5. Transiciones
> 
> | Transición | Origen → destino | Actor | Efecto |
> |---|---|---|---|
> | `OtorgarConsentimiento` | inicio → `VIGENTE` | asesorado | primera Versión |
> | `AceptarNuevaVersion` | `VIGENTE → VIGENTE` | asesorado | Versión sucesora explícita |
> | `RevocarConsentimiento` | `VIGENTE → REVOCADO` | asesorado | Versión + evento de revocación |
> | `OtorgarNuevamente` | `REVOCADO → VIGENTE` | asesorado | nueva decisión explícita cuando 08 lo permita |
> 
> **`REG-06-51` — Revocación corta futuras operaciones sin borrar historia.** No finaliza Vínculo ni otros Alcances; SLA/retención/lectura histórica son de 08.
> 
> **`REG-06-52` — Estado de Vínculo no muta consentimiento implícitamente.** Pausar/finalizar no crea Revocación automática.

## R016 — Vínculo — componente de alcance → Alcance

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Cada componente declara un Alcance; el mismo tipo de alcance puede aparecer en múltiples componentes de diferentes vínculos. Se corrige el 1:1 global de v4.

**Fuente:** 06 §7.5, L3089–L3118; 06 §6.5, L2770–L2779

> ### 7.5. Vínculo por Alcance
> 
> `Vínculo` agrupa `1..N` componentes de Alcance. Cada componente conserva Alcance, finalidad, Solicitud de origen, estado, actor/autoría, ocurrencia/registro, procedencia y motivo cuando aplique.
> 
> La máquina de T-06-15 opera por Alcance, evitando que un estado global oculte divergencias.
> 
> #### 7.5.1. Estados
> 
> ```text
> ACEPTADO
> PAUSADO
> FINALIZADO
> ```
> 
> #### 7.5.2. Lista blanca
> 
> | Transición | Origen → destino | Actor | Condición | Efecto |
> |---|---|---|---|---|
> | `AceptarAlcanceDeVinculo` | inicio → `ACEPTADO` | asesorado | Solicitud `ACEPTADA` | no concede Consentimiento |
> | `PausarAlcance` | `ACEPTADO → PAUSADO` | actor habilitado por 08 | decisión + motivo | bloquea operaciones incompatibles |
> | `ReanudarAlcance` | `PAUSADO → ACEPTADO` | actor habilitado por 08 | decisión explícita | no restaura otros gates |
> | `FinalizarAlcance` | `ACEPTADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva historia |
> | `FinalizarAlcance` | `PAUSADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva pausa previa |
> 
> `FINALIZADO` no tiene salida.
> 
> **`REG-06-47` — Operación total explícita.** Pausa/finalización total aplica transiciones por cada Alcance elegible; nunca hay cascada implícita.
> 
> **`REG-06-48` — Reanudación no restaura gates externos.** Solo cambia el Vínculo por Alcance.
> 
> ### 6.5. Especialidad, capacidad y Alcance
> 
> Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.
> 
> La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.
> 
> **`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.
> 
> Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.

## R017 — Alcance → Autorización contextual

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Alcance es uno de los siete insumos del PDP. Sin cardinalidad persistente ni autorización por sí solo.

**Fuente:** 06 §7.8, L3181–L3196

> ### 7.8. Autorización contextual
> 
> B-03 fija exactamente los siete insumos de RF-021:
> 
> 1. rol;
> 2. Especialidad o Capacidad aplicable;
> 3. situación aplicable;
> 4. Vínculo;
> 5. Consentimiento vigente;
> 6. finalidad;
> 7. Alcance.
> 
> **`REG-06-53` — Ninguna dimensión aislada autoriza.**
> 
> **`REG-06-54` — Ausencia estructural nunca se interpreta como permiso.** Si falta o es inconsistente una dimensión, B-03 no presume autorización. La política permitir/denegar y auditoría pertenecen a 08.

## R018 — Consentimiento vigente → Autorización contextual

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Consentimiento vigente es un insumo de evaluación por operación; no sustituye los otros gates.

**Fuente:** 06 §7.8, L3181–L3196

> ### 7.8. Autorización contextual
> 
> B-03 fija exactamente los siete insumos de RF-021:
> 
> 1. rol;
> 2. Especialidad o Capacidad aplicable;
> 3. situación aplicable;
> 4. Vínculo;
> 5. Consentimiento vigente;
> 6. finalidad;
> 7. Alcance.
> 
> **`REG-06-53` — Ninguna dimensión aislada autoriza.**
> 
> **`REG-06-54` — Ausencia estructural nunca se interpreta como permiso.** Si falta o es inconsistente una dimensión, B-03 no presume autorización. La política permitir/denegar y auditoría pertenecen a 08.

## R019 — Versión → Instantánea reproducible

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : sin fijar

Cada instantánea referencia exactamente una versión (expreso). El máximo de instantáneas por versión no está fijado globalmente: depende del área. Se retira 0..1 del extremo no sustentado.

**Fuente:** 06 §4.6.4, L1393–L1400

> #### 4.6.4. Cardinalidad común
> 
> Una Instantánea reproducible referencia **exactamente una Versión**.
> 
> Una Versión puede no requerir instantánea. Cuando el área propietaria la exige para un acto de emisión/activación, debe declarar su regla de unicidad y contexto. B-06 no inventa snapshots para toda entidad versionada.
> 
> ---

## R020 — Versión → Corrección trazable

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Aplicable cuando el registro corregido es una versión del área. Cada corrección conserva su raíz; varias rectificaciones pueden sucederse. No obliga a que toda corrección del sistema tenga una Versión como raíz.

**Fuente:** 06 §4.7.1, L1403–L1419

> #### 4.7.1. Estructura conceptual mínima
> 
> Una `Corrección trazable` conserva:
> 
> | Elemento conceptual | Regla |
> |---|---|
> | Identificador | identidad propia de la corrección |
> | Original | referencia obligatoria al registro histórico raíz |
> | Corrección previa | referencia opcional a la corrección inmediatamente anterior |
> | Contenido corregido | nueva afirmación/valor/condición según el área propietaria |
> | Actor | quién ejecuta o registra la corrección |
> | Autoría | responsabilidad atribuible a la corrección; no reasigna la del original |
> | Momento de ocurrencia | cuándo ocurrió la rectificación |
> | Momento de registro | cuándo BE la registró |
> | Motivo | se conserva cuando la política aplicable lo exige |
> | Procedencia | fuente/contexto de la rectificación |

## R021 — Versión → Procedencia

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Procedencia es contenido obligatorio de Versión, no se deriva tabla ni cardinalidad adicional.

**Fuente:** 06 §4.5.1, L1304–L1323

> #### 4.5.1. Estructura conceptual mínima
> 
> Una `Versión` conserva como mínimo:
> 
> | Elemento conceptual | Regla |
> |---|---|
> | Identificador | designa de forma estable esa versión concreta |
> | Referencia al objeto versionado | identifica qué entidad o representación de dominio versiona |
> | Ámbito | evita relacionar como sucesoras versiones de objetos o alcances diferentes |
> | Referencia a predecesora | opcional; cero para la primera versión, como máximo una predecesora directa |
> | Autoría | actor responsable del contenido o decisión versionada |
> | Actor de la operación | actor que ejecutó/registró la emisión cuando sea distinto de la autoría |
> | Momento de ocurrencia | cuándo ocurrió el hecho de emisión o presentación |
> | Momento de registro | cuándo BE lo registró |
> | Procedencia | de dónde proviene el contenido o evidencia |
> | Contenido emitido | representación semántica que queda inmutable tras la emisión |
> | Referencias de contexto | relaciones necesarias para reconstruir el sentido de esa versión |
> 
> No se fija cómo se almacena ninguno de estos elementos.

## R022 — Corrección trazable → Doble temporalidad

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Corrección conserva ocurrencia y registro. Es doble temporalidad, no dos objetos temporales ni reglas de almacenamiento.

**Fuente:** 06 §4.7.1, L1403–L1419

> #### 4.7.1. Estructura conceptual mínima
> 
> Una `Corrección trazable` conserva:
> 
> | Elemento conceptual | Regla |
> |---|---|
> | Identificador | identidad propia de la corrección |
> | Original | referencia obligatoria al registro histórico raíz |
> | Corrección previa | referencia opcional a la corrección inmediatamente anterior |
> | Contenido corregido | nueva afirmación/valor/condición según el área propietaria |
> | Actor | quién ejecuta o registra la corrección |
> | Autoría | responsabilidad atribuible a la corrección; no reasigna la del original |
> | Momento de ocurrencia | cuándo ocurrió la rectificación |
> | Momento de registro | cuándo BE la registró |
> | Motivo | se conserva cuando la política aplicable lo exige |
> | Procedencia | fuente/contexto de la rectificación |

## R023 — Versión → Versión

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..1 : sin fijar

Una versión declara predecesora opcional: 0..1 expreso. Se retira máximo de sucesoras global no fijado por el patrón; las reglas de sucesión pertenecen al área.

**Fuente:** 06 §4.5.1, L1304–L1323

> #### 4.5.1. Estructura conceptual mínima
> 
> Una `Versión` conserva como mínimo:
> 
> | Elemento conceptual | Regla |
> |---|---|
> | Identificador | designa de forma estable esa versión concreta |
> | Referencia al objeto versionado | identifica qué entidad o representación de dominio versiona |
> | Ámbito | evita relacionar como sucesoras versiones de objetos o alcances diferentes |
> | Referencia a predecesora | opcional; cero para la primera versión, como máximo una predecesora directa |
> | Autoría | actor responsable del contenido o decisión versionada |
> | Actor de la operación | actor que ejecutó/registró la emisión cuando sea distinto de la autoría |
> | Momento de ocurrencia | cuándo ocurrió el hecho de emisión o presentación |
> | Momento de registro | cuándo BE lo registró |
> | Procedencia | de dónde proviene el contenido o evidencia |
> | Contenido emitido | representación semántica que queda inmutable tras la emisión |
> | Referencias de contexto | relaciones necesarias para reconstruir el sentido de esa versión |
> 
> No se fija cómo se almacena ninguno de estos elementos.

## R024 — Proceso operativo → Activación de plan

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 1..N

Proceso abierto mediante activación inicial confirmada; nuevas versiones dentro del mismo proceso son continuidad. Se infiere una o más activaciones históricas, no composición con borrado.

**Fuente:** 06 §8.4, L3360–L3410; 06 §8.5, L3411–L3433

> ### 8.4. Proceso operativo
> 
> #### 8.4.1. Identidad
> 
> Un Proceso operativo conserva profesional, asesorado, Alcance funcional, acto de apertura, versión/plan de apertura cuando aplique, actor/autoría, ocurrencia, registro, procedencia y estado.
> 
> Una operación antropométrica aislada no crea por sí sola un Proceso de seguimiento de Nutrición/Entrenamiento.
> 
> #### 8.4.2. Proceso nuevo
> 
> **`REG-06-64` — Proceso nuevo como candidato.**
> 
> Una operación es `NUEVO` cuando pretende crear un identificador de Proceso para profesional + asesorado + Alcance y no existe un Proceso `ABIERTO` equivalente.
> 
> `NUEVO` no es estado persistido. Exige evaluación B-05 antes de crear el Proceso.
> 
> Una nueva versión de plan dentro de un Proceso abierto es continuidad.
> 
> #### 8.4.3. Proceso abierto
> 
> **`REG-06-65` — Apertura posterior a admisión.**
> 
> Un Proceso nuevo abre solo si:
> 
> 1. profesional, asesorado y Alcance son identificables;
> 2. la vertical puede emitir/activar la versión inicial;
> 3. B-05 admite la apertura por capacidad;
> 4. los demás gates estructurales son compatibles;
> 5. apertura y activación no se declaran exitosas parcialmente.
> 
> B-07/B-08 definirán la máquina concreta del Plan.
> 
> #### 8.4.4. Proceso vigente
> 
> **`REG-06-66` — Vigencia estructural sin estado paralelo.**
> 
> Un Proceso `ABIERTO` es estructuralmente `VIGENTE` cuando:
> 
> - la cuenta no introduce bloqueo operativo;
> - Verificación profesional = `VERIFICADO`;
> - existe Habilitación efectiva;
> - Vínculo por Alcance = `ACEPTADO`;
> - Consentimiento = `VIGENTE`;
> - el Proceso no está cerrado.
> 
> `VIGENTE` no equivale a Autorización contextual; 08 sigue evaluando cada operación.
> 
> #### 8.4.5. Proceso cerrado
> 
> `CERRADO` es terminal. Impide nueva ejecución/continuidad de ese identificador y conserva evidencia, versiones, revisiones y eventos. Una relación futura equivalente crea un Proceso nuevo.
> 
> ### 8.5. Máquina del Proceso operativo
> 
> #### 8.5.1. Estados cerrados
> 
> ```text
> ABIERTO
> CERRADO
> ```
> 
> #### 8.5.2. Lista blanca
> 
> | Transición | Origen → destino | Disparador | Condiciones | Evento principal |
> |---|---|---|---|---|
> | `AbrirProceso` | inicio → `ABIERTO` | activación vertical confirmada | `REG-06-64/65` + admisión B-05 | `ProcesoOperativoAbierto` |
> | `AplicarContinuidad` | `ABIERTO → ABIERTO` | UC-I06 con resultado distinto de `FINALIZAR` | revisión M-10 válida + consecuencia aplicable | `ContinuidadOCierreAplicado` (`CONTINUIDAD`) |
> | `CerrarPorRevision` | `ABIERTO → CERRADO` | UC-I06 con `FINALIZAR` | revisión M-10 válida + cierre explícito | `ContinuidadOCierreAplicado` (`CIERRE_PROCESO`) + `ProcesoOperativoCerrado` |
> | `CerrarPorFinalizacionVinculo` | `ABIERTO → CERRADO` | Vínculo pasa a `FINALIZADO` | mismo profesional/asesorado/Alcance | `ProcesoOperativoCerrado` |
> | `CerrarPorCierreCuenta` | `ABIERTO → CERRADO` | cuenta pasa a `CERRADA` | identidad correspondiente | `ProcesoOperativoCerrado` |
> 
> Toda transición no listada está prohibida.
> 
> Pausa, suspensión, revocación o pérdida de Habilitación no son estados del Proceso.

## R025 — Proceso operativo → ContinuidadOCierreAplicado

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Cada ContinuidadOCierreAplicado conserva Proceso y revisión origen; puede haber sucesivas continuidades y un cierre. No todo cierre de proceso cuenta como este evento.

**Fuente:** 06 §8.7.4, L3500–L3523

> #### 8.7.4. Resolución de Q-007
> 
> **`REG-06-75` — Evento técnico exacto de continuidad o cierre.**
> 
> `Q-007` queda **RESUELTA EN M-04**, coordinada con M-10, mediante:
> 
> ```text
> ContinuidadOCierreAplicado
> ```
> 
> Se emite solo después de aplicar exitosamente UC-I06 y conserva:
> 
> - Proceso;
> - Revisión válida origen;
> - Resultado semántico;
> - Próxima acción o cierre;
> - `CONTINUIDAD` o `CIERRE_PROCESO`;
> - estado antes/después;
> - referencias de versiones cuando correspondan;
> - actor/autoría;
> - ocurrencia;
> - registro;
> - procedencia.

## R026 — Activación de plan → Capacidad configurada

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

La apertura de proceso nuevo exige admisión de capacidad antes de activar. No implica que toda continuidad consuma una nueva unidad.

**Fuente:** 06 §8.4.3, L3378–L3391

> #### 8.4.3. Proceso abierto
> 
> **`REG-06-65` — Apertura posterior a admisión.**
> 
> Un Proceso nuevo abre solo si:
> 
> 1. profesional, asesorado y Alcance son identificables;
> 2. la vertical puede emitir/activar la versión inicial;
> 3. B-05 admite la apertura por capacidad;
> 4. los demás gates estructurales son compatibles;
> 5. apertura y activación no se declaran exitosas parcialmente.
> 
> B-07/B-08 definirán la máquina concreta del Plan.

## R027 — ContinuidadOCierreAplicado → Ciclo cerrado trazable

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Evento aplicado aporta insumos del ciclo trazable junto a revisión y evidencia; no crea por sí solo el ciclo ni calcula TVCC.

**Fuente:** 06 §8.7.5, L3524–L3538

> #### 8.7.5. Frontera con Ciclo cerrado trazable
> 
> **`REG-06-76` — Q-007 no redefine T-06-40.**
> 
> `ContinuidadOCierreAplicado` demuestra que la consecuencia funcional fue aplicada. M-10 conserva `T-06-40 — Ciclo cerrado trazable`.
> 
> ```text
> Revisión válida (M-10)
> + ContinuidadOCierreAplicado (M-04)
> → insumos para Ciclo cerrado trazable (M-10)
> → elegibilidad analítica posterior (M-12)
> ```
> 
> B-04 no calcula TVCC-30.

## R028 — Objetivo nutricional → Plan nutricional

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Referencia a Versión de Objetivo aplicable, no composición ni propiedad del Plan por el Objetivo. 0..N es inversa no exclusiva inferida; el pasaje completo enumera toda la estructura.

**Fuente:** 06 §10.7.1, L4270–L4285

> #### 10.7.1. Relación estructural
> 
> **`REG-06-102` — Plan relacionado con evaluación y objetivo.**
> 
> El Plan profesional conserva:
> 
> - asesorado;
> - profesional;
> - Alcance;
> - Evaluación de referencia;
> - Versión de Objetivo aplicable;
> - conjunto de Versiones de plan;
> - relación explícita a la Versión activada efectiva cuando exista.
> 
> El contenido prescriptivo concreto queda fuera del modelo conceptual de 06.

## R029 — Plan nutricional → Día tipo

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 1..N

Estructura de una Versión de plan emitida según REG-06-118, no requisito de un borrador UI vacío.

**Fuente:** 06 §10.17.1, L4552–L4567

> #### 10.17.1. Jerarquía interna del plan
> 
> **`REG-06-118` — Jerarquía nutricional de la Versión de plan.**
> 
> Una Versión de Plan nutricional conserva una jerarquía identificable:
> 
> ```text
> Versión de plan
> → Día tipo [1..N]
> → Comida [1..N]
> → Opción de comida [1..N]
> → Ítem prescripto [1..N]
> ```
> 
> El `Día tipo` es la unidad temporal interna de la vertical y **no se agenda en fechas**. Una misma Versión puede contener uno o varios Días tipo. La Instantánea reproducible conserva la jerarquía, el orden/contexto y las relaciones exactamente como fueron emitidos.

## R030 — Día tipo → Comida

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 1..N

Jerarquía emitida Día tipo–Comida; los hijos pertenecen a su contexto versionado.

**Fuente:** 06 §10.17.1, L4552–L4567

> #### 10.17.1. Jerarquía interna del plan
> 
> **`REG-06-118` — Jerarquía nutricional de la Versión de plan.**
> 
> Una Versión de Plan nutricional conserva una jerarquía identificable:
> 
> ```text
> Versión de plan
> → Día tipo [1..N]
> → Comida [1..N]
> → Opción de comida [1..N]
> → Ítem prescripto [1..N]
> ```
> 
> El `Día tipo` es la unidad temporal interna de la vertical y **no se agenda en fechas**. Una misma Versión puede contener uno o varios Días tipo. La Instantánea reproducible conserva la jerarquía, el orden/contexto y las relaciones exactamente como fueron emitidos.

## R031 — Comida → Opción de comida

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 1..N

Jerarquía emitida Comida–Opción; no confundir cantidad de alternativas con ejecución.

**Fuente:** 06 §10.17.1, L4552–L4567

> #### 10.17.1. Jerarquía interna del plan
> 
> **`REG-06-118` — Jerarquía nutricional de la Versión de plan.**
> 
> Una Versión de Plan nutricional conserva una jerarquía identificable:
> 
> ```text
> Versión de plan
> → Día tipo [1..N]
> → Comida [1..N]
> → Opción de comida [1..N]
> → Ítem prescripto [1..N]
> ```
> 
> El `Día tipo` es la unidad temporal interna de la vertical y **no se agenda en fechas**. Una misma Versión puede contener uno o varios Días tipo. La Instantánea reproducible conserva la jerarquía, el orden/contexto y las relaciones exactamente como fueron emitidos.

## R032 — Opción de comida → Ítem prescripto

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 1..N

Jerarquía emitida Opción–Ítem. Las modalidades se documentan en §10.17.2.

**Fuente:** 06 §10.17.1, L4552–L4567

> #### 10.17.1. Jerarquía interna del plan
> 
> **`REG-06-118` — Jerarquía nutricional de la Versión de plan.**
> 
> Una Versión de Plan nutricional conserva una jerarquía identificable:
> 
> ```text
> Versión de plan
> → Día tipo [1..N]
> → Comida [1..N]
> → Opción de comida [1..N]
> → Ítem prescripto [1..N]
> ```
> 
> El `Día tipo` es la unidad temporal interna de la vertical y **no se agenda en fechas**. Una misma Versión puede contener uno o varios Días tipo. La Instantánea reproducible conserva la jerarquía, el orden/contexto y las relaciones exactamente como fueron emitidos.

## R033 — Ítem prescripto → Elemento de catálogo

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Solo modalidad A y por referencia alimento/preparación conservada en el ítem. Inversa no exclusiva inferida; no se impone a modalidad B/C.

**Fuente:** 06 §10.17.2.1, L4580–L4585

> ##### 10.17.2.1. Modalidad A — opción de plato armado
> 
> Una Comida puede ofrecer alternativas cerradas de Opción de comida. Cada Ítem prescripto de una alternativa conserva referencia a alimento o preparación y, cuando existe cantidad, cantidad, unidad y Estado de preparación.
> 
> Esta modalidad es la base del MVP conforme a `DEC-046`; B-07 no fija qué alimentos, preparaciones, cantidades ni combinaciones debe prescribir el profesional.

## R034 — Ingesta registrada → Comida

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Referencia contextual cuando corresponde; un registro descriptivo libre no demuestra una relación obligatoria a una sola Comida. Se retiran ambas multiplicidades.

**Fuente:** 06 §10.9, L4364–L4397; 06 §10.17.2.3, L4601–L4614

> ### 10.9. Ejecución/adherencia — patrón reutilizable
> 
> **`REG-06-106` — Ejecución registrada vinculada a lo planificado.**
> 
> Todo registro confirmado de ejecución/adherencia conserva:
> 
> - asesorado;
> - dominio;
> - Versión activada de referencia;
> - parte, sesión u ocurrencia planificada a la que aplica, cuando corresponda;
> - momento de ocurrencia;
> - momento de registro;
> - autor;
> - contexto/observación permitida;
> - procedencia.
> 
> La ejecución nunca modifica la prescripción de la Versión activada.
> 
> #### 10.9.1. Unicidad
> 
> **`REG-06-107` — Reintento no duplica una ejecución equivalente.**
> 
> La vertical declara una clave lógica de unicidad por:
> 
> - asesorado;
> - Versión activada;
> - período/ocurrencia planificada aplicable.
> 
> Un reintento de la misma confirmación no crea un segundo hecho equivalente.
> 
> La concurrencia técnica y la idempotencia contractual se prueban en 11A/09.
> 
> ---
> 
> ##### 10.17.2.3. Modalidad C — registro descriptivo libre
> 
> **`REG-06-121` — Ingesta descriptiva preservada y estructuración profesional posterior trazable.**
> 
> La Ingesta registrada puede consistir en texto del asesorado que describe qué comió y en qué porciones. Este registro:
> 
> - no se clasifica como fallback de segunda categoría;
> - conserva el texto original;
> - puede ser estructurado posteriormente por un profesional asignando alimentos y cantidades estimadas;
> - cuando se estructura posteriormente, instancia `Corrección trazable` de B-06 sin modificar el original;
> - deja constancia de que la cuantificación resultante es **estimación profesional sobre descripción, no medición**.
> 
> No se crea una máquina de corrección propia de Nutrición.

## R035 — Objetivo de entrenamiento → Plan de entrenamiento

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Entrenamiento reutiliza REG-06-102. Referencia a versión de objetivo, no composición. La inversa no exclusiva se infiere, no es una restricción Prisma aprobada.

**Fuente:** 06 §11.4, L5062–L5078; 06 §10.7.1, L4270–L4285

> ### 11.4. Mapeo exacto al patrón B-07
> 
> | Estructura Entrenamiento | Regla común reutilizada | Diferencia |
> |---|---|---|
> | Evaluación de entrenamiento | `REG-06-97` | contenido de dominio distinto; no se fija |
> | Objetivo de entrenamiento | `REG-06-98` | RF-064; contenido profesional distinto |
> | Catálogo de ejercicios | `REG-06-99…101` | proveedor wger en importación |
> | Plan de entrenamiento | `REG-06-102/103` | contiene bloques/sesiones/prescripciones y, desde v0.1.1, Microciclo opcional |
> | Versión de plan | máquina B-07 §7 | mismos estados y transiciones |
> | Activación | `REG-06-104/105` | snapshot de planificación de entrenamiento |
> | Ejecución | `REG-06-106/107` | ejecución real tiene borrador y corrección |
> | Continuidad | `REG-06-108` | progresión especializa AJUSTAR/SUSTITUIR |
> 
> B-08 no crea sinónimos ni estados paralelos. Las adiciones v0.1.1 especializan la estructura interna de Entrenamiento sin duplicar reglas comunes.
> 
> ---
> 
> #### 10.7.1. Relación estructural
> 
> **`REG-06-102` — Plan relacionado con evaluación y objetivo.**
> 
> El Plan profesional conserva:
> 
> - asesorado;
> - profesional;
> - Alcance;
> - Evaluación de referencia;
> - Versión de Objetivo aplicable;
> - conjunto de Versiones de plan;
> - relación explícita a la Versión activada efectiva cuando exista.
> 
> El contenido prescriptivo concreto queda fuera del modelo conceptual de 06.

## R036 — Plan de entrenamiento → Bloque

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : sin fijar

Bloque contenido en una versión de plan. La fuente da jerarquía pero no mínimo numérico universal de bloques; se retira 1..N no declarado.

**Fuente:** 06 §11.6, L5111–L5144; 06 §11.17.1, L5379–L5396

> ### 11.6. Estructura de planificación de entrenamiento — baseline aprobada
> 
> **`REG-06-111` — Jerarquía estructural de planificación.**
> 
> Una Versión de Plan de entrenamiento puede organizar, en orden identificable:
> 
> ```text
> Plan
> → Bloques
> → Sesiones planificadas
> → Prescripciones
> ```
> 
> Una Prescripción:
> 
> - referencia un elemento del Catálogo propio;
> - pertenece a una Sesión planificada;
> - conserva los parámetros/unidades profesionales necesarios para interpretar lo indicado;
> - no define en 06 qué parámetros concretos deben utilizarse.
> 
> Si un parámetro es cuantitativo, su unidad y significado deben ser identificables conforme a B-00.
> 
> #### 11.6.1. Relaciones
> 
> **`REG-06-112` — Relaciones internas preservadas por Versión.**
> 
> La Versión activada/snapshot reconstruye el orden y las relaciones Plan ↔ Bloque ↔ Sesión ↔ Prescripción exactamente como fueron emitidas.
> 
> Cambios posteriores del borrador o catálogo no alteran esa estructura histórica.
> 
> La incorporación opcional de Microciclo en v0.1.1 es una **extensión compatible** de esta jerarquía; no sustituye ni invalida las relaciones aprobadas.
> 
> ---
> 
> #### 11.17.1. Jerarquía extendida
> 
> **`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**
> 
> La estructura de `REG-06-111` se extiende compatiblemente a:
> 
> ```text
> Versión de plan
> → Bloque
> → Microciclo [0..N]
> → Sesión
> → Prescripción de ejercicio
> ```
> 
> Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.
> 
> El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

## R037 — Bloque → Microciclo

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..N

Microciclo explícitamente opcional [0..N] bajo Bloque. La alternativa directa Bloque–Sesión se agrega como R065.

**Fuente:** 06 §11.17.1, L5379–L5396

> #### 11.17.1. Jerarquía extendida
> 
> **`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**
> 
> La estructura de `REG-06-111` se extiende compatiblemente a:
> 
> ```text
> Versión de plan
> → Bloque
> → Microciclo [0..N]
> → Sesión
> → Prescripción de ejercicio
> ```
> 
> Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.
> 
> El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

## R038 — Microciclo → Sesión

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : sin fijar

Aplica si la sesión se organiza dentro de microciclo. No se fuerza microciclo ni se infiere un mínimo de sesiones no declarado.

**Fuente:** 06 §11.17.1, L5379–L5396

> #### 11.17.1. Jerarquía extendida
> 
> **`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**
> 
> La estructura de `REG-06-111` se extiende compatiblemente a:
> 
> ```text
> Versión de plan
> → Bloque
> → Microciclo [0..N]
> → Sesión
> → Prescripción de ejercicio
> ```
> 
> Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.
> 
> El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

## R039 — Sesión → Prescripción de ejercicio

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : sin fijar

Cada prescripción pertenece a sesión según estructura; no se añade un mínimo universal durante preparación de plan.

**Fuente:** 06 §11.6, L5111–L5144; 06 §11.17.1, L5379–L5396

> ### 11.6. Estructura de planificación de entrenamiento — baseline aprobada
> 
> **`REG-06-111` — Jerarquía estructural de planificación.**
> 
> Una Versión de Plan de entrenamiento puede organizar, en orden identificable:
> 
> ```text
> Plan
> → Bloques
> → Sesiones planificadas
> → Prescripciones
> ```
> 
> Una Prescripción:
> 
> - referencia un elemento del Catálogo propio;
> - pertenece a una Sesión planificada;
> - conserva los parámetros/unidades profesionales necesarios para interpretar lo indicado;
> - no define en 06 qué parámetros concretos deben utilizarse.
> 
> Si un parámetro es cuantitativo, su unidad y significado deben ser identificables conforme a B-00.
> 
> #### 11.6.1. Relaciones
> 
> **`REG-06-112` — Relaciones internas preservadas por Versión.**
> 
> La Versión activada/snapshot reconstruye el orden y las relaciones Plan ↔ Bloque ↔ Sesión ↔ Prescripción exactamente como fueron emitidas.
> 
> Cambios posteriores del borrador o catálogo no alteran esa estructura histórica.
> 
> La incorporación opcional de Microciclo en v0.1.1 es una **extensión compatible** de esta jerarquía; no sustituye ni invalida las relaciones aprobadas.
> 
> ---
> 
> #### 11.17.1. Jerarquía extendida
> 
> **`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**
> 
> La estructura de `REG-06-111` se extiende compatiblemente a:
> 
> ```text
> Versión de plan
> → Bloque
> → Microciclo [0..N]
> → Sesión
> → Prescripción de ejercicio
> ```
> 
> Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.
> 
> El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

## R040 — Prescripción de ejercicio → Ejecución real

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

La ejecución referencia versión activada y parte/sesión/ocurrencia cuando aplica. Se retira el 0..1 global: la unicidad es por contexto y período/ocurrencia, no por prescripción en toda la historia.

**Fuente:** 06 §10.9, L4364–L4397; 06 §11.4, L5062–L5078

> ### 10.9. Ejecución/adherencia — patrón reutilizable
> 
> **`REG-06-106` — Ejecución registrada vinculada a lo planificado.**
> 
> Todo registro confirmado de ejecución/adherencia conserva:
> 
> - asesorado;
> - dominio;
> - Versión activada de referencia;
> - parte, sesión u ocurrencia planificada a la que aplica, cuando corresponda;
> - momento de ocurrencia;
> - momento de registro;
> - autor;
> - contexto/observación permitida;
> - procedencia.
> 
> La ejecución nunca modifica la prescripción de la Versión activada.
> 
> #### 10.9.1. Unicidad
> 
> **`REG-06-107` — Reintento no duplica una ejecución equivalente.**
> 
> La vertical declara una clave lógica de unicidad por:
> 
> - asesorado;
> - Versión activada;
> - período/ocurrencia planificada aplicable.
> 
> Un reintento de la misma confirmación no crea un segundo hecho equivalente.
> 
> La concurrencia técnica y la idempotencia contractual se prueban en 11A/09.
> 
> ---
> 
> ### 11.4. Mapeo exacto al patrón B-07
> 
> | Estructura Entrenamiento | Regla común reutilizada | Diferencia |
> |---|---|---|
> | Evaluación de entrenamiento | `REG-06-97` | contenido de dominio distinto; no se fija |
> | Objetivo de entrenamiento | `REG-06-98` | RF-064; contenido profesional distinto |
> | Catálogo de ejercicios | `REG-06-99…101` | proveedor wger en importación |
> | Plan de entrenamiento | `REG-06-102/103` | contiene bloques/sesiones/prescripciones y, desde v0.1.1, Microciclo opcional |
> | Versión de plan | máquina B-07 §7 | mismos estados y transiciones |
> | Activación | `REG-06-104/105` | snapshot de planificación de entrenamiento |
> | Ejecución | `REG-06-106/107` | ejecución real tiene borrador y corrección |
> | Continuidad | `REG-06-108` | progresión especializa AJUSTAR/SUSTITUIR |
> 
> B-08 no crea sinónimos ni estados paralelos. Las adiciones v0.1.1 especializan la estructura interna de Entrenamiento sin duplicar reglas comunes.
> 
> ---

## R041 — Prescripción de ejercicio → Catálogo de ejercicios

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Cada prescripción conserva referencia al elemento de catálogo de ejercicios. Reutilización por distintas prescripciones inferida, no catálogo propiedad del plan.

**Fuente:** 06 §11.6, L5111–L5144

> ### 11.6. Estructura de planificación de entrenamiento — baseline aprobada
> 
> **`REG-06-111` — Jerarquía estructural de planificación.**
> 
> Una Versión de Plan de entrenamiento puede organizar, en orden identificable:
> 
> ```text
> Plan
> → Bloques
> → Sesiones planificadas
> → Prescripciones
> ```
> 
> Una Prescripción:
> 
> - referencia un elemento del Catálogo propio;
> - pertenece a una Sesión planificada;
> - conserva los parámetros/unidades profesionales necesarios para interpretar lo indicado;
> - no define en 06 qué parámetros concretos deben utilizarse.
> 
> Si un parámetro es cuantitativo, su unidad y significado deben ser identificables conforme a B-00.
> 
> #### 11.6.1. Relaciones
> 
> **`REG-06-112` — Relaciones internas preservadas por Versión.**
> 
> La Versión activada/snapshot reconstruye el orden y las relaciones Plan ↔ Bloque ↔ Sesión ↔ Prescripción exactamente como fueron emitidas.
> 
> Cambios posteriores del borrador o catálogo no alteran esa estructura histórica.
> 
> La incorporación opcional de Microciclo en v0.1.1 es una **extensión compatible** de esta jerarquía; no sustituye ni invalida las relaciones aprobadas.
> 
> ---

## R042 — Catálogo de ejercicios → Relación Ejercicio–Zona

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..N

Ejercicio admite cero o más relaciones; cada relación conserva ejercicio/versionado, zona y rol. No confundir asignación con catálogo de zonas.

**Fuente:** 06 §11.26, L5649–L5663

> ### 11.26. Relación Ejercicio–Zona muscular con rol
> 
> **`REG-06-139` — Asociación versionada con rol declarado.**
> 
> Cada elemento del Catálogo de ejercicios admite **cero o más** Relaciones Ejercicio–Zona muscular. Cada relación conserva:
> 
> - referencia al ejercicio/catalog item y a su versión aplicable;
> - referencia al identificador estable de Zona;
> - Rol de implicación muscular declarado: `PRINCIPAL` o `SECUNDARIO`;
> - versión/procedencia de la asignación.
> 
> La asignación concreta de Zonas a un ejercicio es contenido profesional de catálogo y **no se fija en B-08**. El modelo tampoco introduce porcentajes, ponderaciones ni reglas automáticas para convertir el rol en volumen o intensidad; esas derivaciones pertenecen a `B-11` bajo el contrato de `ACTA-DIR-015 §5`.
> 
> ---

## R043 — Relación Ejercicio–Zona → Zona muscular

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Cada asignación referencia un ZoneId; una zona puede reutilizarse en múltiples asignaciones. Inversa no exclusiva inferida.

**Fuente:** 06 §11.26, L5649–L5663

> ### 11.26. Relación Ejercicio–Zona muscular con rol
> 
> **`REG-06-139` — Asociación versionada con rol declarado.**
> 
> Cada elemento del Catálogo de ejercicios admite **cero o más** Relaciones Ejercicio–Zona muscular. Cada relación conserva:
> 
> - referencia al ejercicio/catalog item y a su versión aplicable;
> - referencia al identificador estable de Zona;
> - Rol de implicación muscular declarado: `PRINCIPAL` o `SECUNDARIO`;
> - versión/procedencia de la asignación.
> 
> La asignación concreta de Zonas a un ejercicio es contenido profesional de catálogo y **no se fija en B-08**. El modelo tampoco introduce porcentajes, ponderaciones ni reglas automáticas para convertir el rol en volumen o intensidad; esas derivaciones pertenecen a `B-11` bajo el contrato de `ACTA-DIR-015 §5`.
> 
> ---

## R044 — Evaluación antropométrica → Medición directa

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Evaluación conserva conjunto de mediciones. EN_PREPARACION permite incompletitud; se retira el mínimo universal 1. La registrabilidad depende de las validaciones del contrato, no de este intervalo permisivo.

**Fuente:** 06 §13.5, L6206–L6224; 06 §13.6, L6225–L6253; 06 §20.5.2, L8612–L8632

> ### 13.5. Evaluación antropométrica
> 
> **`REG-06-151` — Evaluación antropométrica reconstruible.**
> 
> Toda Evaluación antropométrica conserva, como mínimo conceptual:
> 
> - asesorado;
> - profesional/actor responsable;
> - fecha o momento de evaluación;
> - Protocolo identificado y su referencia/versionado aplicable;
> - conjunto de Mediciones antropométricas directas y Cálculos antropométricos derivados, discriminados;
> - unidades de origen;
> - autoría, ocurrencia, registro y procedencia conforme a B-06;
> - referencias a correcciones cuando existan.
> 
> Una Evaluación no se convierte en Plan ni Revisión profesional de especialidad y Antropometría no adquiere ciclo de plan propio.
> 
> ---
> 
> ### 13.6. Medición directa y origen de captura
> 
> **`REG-06-152` — Medición directa separada de cálculo.**
> 
> Una Medición antropométrica directa representa un dato observado/registrado bajo un Protocolo identificado y conserva:
> 
> - métrica/sitio o magnitud identificable;
> - valor cuando existe;
> - unidad de origen;
> - protocolo y contexto aplicable;
> - autoría y procedencia;
> - origen de captura verificable.
> 
> Nunca se etiqueta un Cálculo derivado como Medición directa por el solo hecho de haber sido importado.
> 
> **`REG-06-153` — Importación controlada desde preparación externa, agnóstica de formato/proveedor.**
> 
> El origen de una Medición/Evaluación puede ser una **Importación controlada desde datos de preparación externa**. El patrón exige:
> 
> 1. conservar procedencia de la preparación externa y actor/importador;
> 2. validar que cada dato pueda clasificarse como medición directa, cálculo derivado u otro dato no incorporable antes de ingresar al modelo efectivo;
> 3. conservar protocolo/método/unidad/versión disponibles y registrar cualquier insuficiencia sin inventarlos;
> 4. mantener referencia reconstruible al origen importado;
> 5. no presuponer proveedor, exportador, archivo, columnas, serialización ni formato de transporte.
> 
> Formato y proveedor pertenecen a Documentos 07/09. La herramienta de preparación externa usada por Dirección es un **origen admitido**, no una dependencia canónica ni proveedor obligatorio.
> 
> ---
> 
> #### 20.5.2. Contenido provisional
> 
> **`REG-06-215` — Datos/cálculos de preparación no adquieren autoridad histórica por persistirse.**
> 
> Una Evaluación `EN_PREPARACION` puede conservar:
> 
> - mediciones parciales;
> - procedencia;
> - protocolo en preparación;
> - cálculos de apoyo ejecutados en contexto de preparación;
> - metadatos de concurrencia/versionado de trabajo.
> 
> Pero:
> 
> - no alimenta Serie longitudinal;
> - no aparece como última Evaluación registrada;
> - no crea resultado antropométrico confirmado para el asesorado;
> - una Ejecución realizada en preparación conserva `contexto = PREPARACION` y no se vuelve histórica/efectiva por sí sola.
> 
> Al registrar la Evaluación, 06 exige que los datos/resultados confirmados queden relacionados explícitamente con la Evaluación `REGISTRADA`; 09 definirá la operación/contrato exactos.

## R045 — Evaluación antropométrica → Cálculo derivado

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Evaluación distingue medidas y cálculos; ausencia de cálculo posible. Cada resultado incluido conserva contexto de evaluación y entradas exactas; no se convierte medición en cálculo.

**Fuente:** 06 §13.5, L6206–L6224; 06 §13.8.1, L6275–L6291

> ### 13.5. Evaluación antropométrica
> 
> **`REG-06-151` — Evaluación antropométrica reconstruible.**
> 
> Toda Evaluación antropométrica conserva, como mínimo conceptual:
> 
> - asesorado;
> - profesional/actor responsable;
> - fecha o momento de evaluación;
> - Protocolo identificado y su referencia/versionado aplicable;
> - conjunto de Mediciones antropométricas directas y Cálculos antropométricos derivados, discriminados;
> - unidades de origen;
> - autoría, ocurrencia, registro y procedencia conforme a B-06;
> - referencias a correcciones cuando existan.
> 
> Una Evaluación no se convierte en Plan ni Revisión profesional de especialidad y Antropometría no adquiere ciclo de plan propio.
> 
> ---
> 
> #### 13.8.1. Estructura
> 
> **`REG-06-156` — Resultado derivado reproducible.**
> 
> Un Cálculo antropométrico derivado conserva:
> 
> - métrica/resultado identificado;
> - Método de cálculo identificado y su versión;
> - Fórmula/regla de dominio aplicable identificada y versionada;
> - conjunto exacto de entradas efectivas y sus unidades;
> - resultado y unidad;
> - precisión y regla de redondeo aplicadas;
> - momento de cálculo, autoría/procedencia del método y procedencia del resultado;
> - relación de sucesión cuando un recálculo produce una versión posterior.
> 
> `UC-I09` puede reconstruir qué método, versión y entradas produjeron el resultado. B-10 no fija aquí una fórmula profesional concreta.

## R046 — Cálculo derivado → Método profesional versionado

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Resultado derivado identifica método y versión exacta; varios resultados pueden usar esa versión. Inversa no exclusiva inferida.

**Fuente:** 06 §13.8.1, L6275–L6291

> #### 13.8.1. Estructura
> 
> **`REG-06-156` — Resultado derivado reproducible.**
> 
> Un Cálculo antropométrico derivado conserva:
> 
> - métrica/resultado identificado;
> - Método de cálculo identificado y su versión;
> - Fórmula/regla de dominio aplicable identificada y versionada;
> - conjunto exacto de entradas efectivas y sus unidades;
> - resultado y unidad;
> - precisión y regla de redondeo aplicadas;
> - momento de cálculo, autoría/procedencia del método y procedencia del resultado;
> - relación de sucesión cuando un recálculo produce una versión posterior.
> 
> `UC-I09` puede reconstruir qué método, versión y entradas produjeron el resultado. B-10 no fija aquí una fórmula profesional concreta.

## R047 — Medición directa → Evolución

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Evolución es lectura derivada que conserva puntos y fuentes. Se retiran cardinalidades que aparentaban propiedad persistente de una serie sobre cada medición.

**Fuente:** 06 §13.12, L6375–L6405; 06 §14.7.7, L6799–L6805

> ### 13.12. Honestidad longitudinal: ausencia de dato ≠ cero
> 
> **`REG-06-165` — Disponibilidad explícita por métrica y checkpoint.**
> 
> Para cada métrica en un punto longitudinal, el modelo distingue explícitamente:
> 
> ```text
> REGISTRADO  → existe valor observado/derivado; el valor puede ser 0
> SIN_DATO    → no existe valor para esa métrica/checkpoint; no se almacena un 0 sustituto
> ```
> 
> `0` es un valor cuantitativo posible y **nunca funciona como sentinel de ausencia**.
> 
> **`REG-06-166` — Cero interpolación, imputación o completado de huecos.**
> 
> La Serie longitudinal antropométrica solo usa valores efectivamente registrados/derivados y comparables bajo §11. Un hueco permanece `SIN_DATO`. B-10 prohíbe:
> 
> - interpolar entre dos checkpoints;
> - arrastrar el último valor conocido;
> - completar con cero;
> - imputar promedio/estimación;
> - inventar un checkpoint para “suavizar” la serie.
> 
> Una proyección posterior puede **mostrar** la ausencia, pero no convertirla en dato. Esta es condición de aceptación de Entrega D.
> 
> **`REG-06-167` — Evolución longitudinal conserva fuente y clase del dato.**
> 
> Cada punto disponible conserva si proviene de Medición directa o Cálculo derivado, su Evaluación de origen, método/protocolo/unidad y cualquier limitación de comparabilidad. La Evolución antropométrica es lectura longitudinal; no crea una nueva medición ni modifica fuentes.
> 
> ---
> 
> #### 14.7.7. Evolución antropométrica longitudinal
> 
> **`REG-06-184` — Evolución antropométrica honesta.**  
> La proyección consume la Serie longitudinal antropométrica de B-10. Solo compara puntos cuya compatibilidad haya sido demostrada por `REG-06-162…164`. Conserva protocolo, método/versión, unidad y clase del dato cuando corresponda. `SIN_DATO` permanece ausencia: no se transforma en cero, no se interpola, no se imputa y no se arrastra el último valor.
> 
> Los segmentos no comparables permanecen visibles como registros históricos, pero no se convierten en una tendencia cuantitativa homogénea.

## R048 — Medición directa → Cálculo derivado

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Grafo de dependencias explícitas hacia entradas efectivas; no se deduce N:M de tablas ni uso obligatorio de toda medición.

**Fuente:** 06 §13.9, L6314–L6323

> ### 13.9. Dependencias y grafo de cálculo
> 
> **`REG-06-159` — Dependencias explícitas entre entradas y derivados.**
> 
> Cada resultado derivado referencia las entradas efectivas de las que depende. El conjunto de referencias forma un grafo dirigido reconstruible que permite identificar, para una Medición corregida, qué resultados quedan afectados de forma directa o transitiva.
> 
> B-10 no infiere dependencias por nombre de campo ni por posición en una exportación.
> 
> ---

## R049 — Revisión profesional válida → Resultado semántico

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Cada revisión válida declara un token del conjunto cerrado. El token se reutiliza en N revisiones; se corrige 1:1 que lo volvía exclusivo de una revisión.

**Fuente:** 06 §12.5, L5862–L5911

> ### 12.5. Revisión profesional válida
> 
> #### 12.5.1. Estructura
> 
> **`REG-06-141` — Revisión profesional válida como evento explícito.**
> 
> Una Revisión profesional válida existe solo como acto explícito registrado mediante `UC-I05` y conserva:
> 
> - dominio;
> - Proceso/período o ciclo identificable;
> - evidencia examinada y referencias reconstruibles a ella;
> - interpretación profesional **no diagnóstica**;
> - Resultado semántico de revisión;
> - fundamento;
> - Próxima acción o cierre;
> - autoría;
> - momento de ocurrencia y momento de registro;
> - procedencia.
> 
> Abrir, visualizar, filtrar, anotar aisladamente o modificar silenciosamente un plan **no** crea una Revisión profesional válida.
> 
> **`REG-06-142` — Evidencia vinculada y reconstruible.**
> 
> La evidencia utilizada queda relacionada explícitamente con la Revisión y con el contexto/versiones efectivas que el profesional examinó. Una corrección posterior de evidencia o revisión no borra el original: B-09 instancia la Corrección trazable de B-06 y la vista efectiva se determina por su cadena, no por “último registro” arbitrario.
> 
> #### 12.5.2. Validez mínima
> 
> **`REG-06-143` — Completitud obligatoria de la revisión.**
> 
> Sin evidencia identificable, interpretación, Resultado semántico, fundamento, Próxima acción o cierre, autoría y momento registrable **no existe revisión válida**. Un guardado parcial puede existir como borrador de interacción posterior, pero no produce los efectos de `UC-I05`/`UC-I06` ni resuelve un pendiente.
> 
> #### 12.5.3. Taxonomía única
> 
> **`REG-06-144` — Resultado semántico cerrado y compartido.**
> 
> B-09 adopta, sin extender, el conjunto:
> 
> ```text
> MANTENER
> AJUSTAR
> SUSTITUIR
> REPROGRAMAR_REVISION
> CAMBIAR_OBJETIVO
> FINALIZAR
> ```
> 
> “Progresar” e “iniciar un nuevo bloque” se especializan dentro de `AJUSTAR` o `SUSTITUIR` conforme a B-00; **no crean un séptimo resultado** y ninguna vertical define tokens paralelos.
> 
> ---

## R050 — Revisión profesional válida → Próxima acción

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..1

Próxima acción o cierre: uno puede no estar presente cuando hay cierre. Intervalo de la decisión efectiva por revisión; no limita sucesiones de decisiones temporales.

**Fuente:** 06 §12.5, L5862–L5911

> ### 12.5. Revisión profesional válida
> 
> #### 12.5.1. Estructura
> 
> **`REG-06-141` — Revisión profesional válida como evento explícito.**
> 
> Una Revisión profesional válida existe solo como acto explícito registrado mediante `UC-I05` y conserva:
> 
> - dominio;
> - Proceso/período o ciclo identificable;
> - evidencia examinada y referencias reconstruibles a ella;
> - interpretación profesional **no diagnóstica**;
> - Resultado semántico de revisión;
> - fundamento;
> - Próxima acción o cierre;
> - autoría;
> - momento de ocurrencia y momento de registro;
> - procedencia.
> 
> Abrir, visualizar, filtrar, anotar aisladamente o modificar silenciosamente un plan **no** crea una Revisión profesional válida.
> 
> **`REG-06-142` — Evidencia vinculada y reconstruible.**
> 
> La evidencia utilizada queda relacionada explícitamente con la Revisión y con el contexto/versiones efectivas que el profesional examinó. Una corrección posterior de evidencia o revisión no borra el original: B-09 instancia la Corrección trazable de B-06 y la vista efectiva se determina por su cadena, no por “último registro” arbitrario.
> 
> #### 12.5.2. Validez mínima
> 
> **`REG-06-143` — Completitud obligatoria de la revisión.**
> 
> Sin evidencia identificable, interpretación, Resultado semántico, fundamento, Próxima acción o cierre, autoría y momento registrable **no existe revisión válida**. Un guardado parcial puede existir como borrador de interacción posterior, pero no produce los efectos de `UC-I05`/`UC-I06` ni resuelve un pendiente.
> 
> #### 12.5.3. Taxonomía única
> 
> **`REG-06-144` — Resultado semántico cerrado y compartido.**
> 
> B-09 adopta, sin extender, el conjunto:
> 
> ```text
> MANTENER
> AJUSTAR
> SUSTITUIR
> REPROGRAMAR_REVISION
> CAMBIAR_OBJETIVO
> FINALIZAR
> ```
> 
> “Progresar” e “iniciar un nuevo bloque” se especializan dentro de `AJUSTAR` o `SUSTITUIR` conforme a B-00; **no crean un séptimo resultado** y ninguna vertical define tokens paralelos.
> 
> ---

## R051 — Revisión profesional válida → Revisión pendiente

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Pendiente deriva de expectativa explícita no satisfecha; una revisión válida contribuye a resolverla. No es una entidad hija creada por abrir la pantalla.

**Fuente:** 06 §12.8, L5961–L5985

> ### 12.8. Revisión pendiente
> 
> #### 12.8.1. Predicado exacto
> 
> **`REG-06-150` — Revisión pendiente deriva solo de una expectativa explícita de revisión no satisfecha.**
> 
> Para un instante de referencia `t`, un Proceso se proyecta como **Revisión pendiente** únicamente cuando:
> 
> 1. el Proceso está `ABIERTO`;
> 2. existe una expectativa **explícita y efectiva** de que ese Proceso sea revisado, procedente de una próxima revisión declarada por una versión de plan o de una Próxima acción registrada por una Revisión válida;
> 3. si esa expectativa posee momento/período objetivo futuro, dicho objetivo ya alcanzó `t`; si no posee un momento futuro, la necesidad queda pendiente desde su registro efectivo;
> 4. no existe una Revisión profesional válida efectiva, posterior y vinculada a esa expectativa, con su continuidad/cierre aplicada mediante `UC-I06`.
> 
> El motivo se conserva como dato operativo y no diagnóstico. El predicado no usa peso, adherencia, rendimiento, antropometría, inferencias clínicas ni scores para fabricar un pendiente. Si no existe expectativa explícita de revisión, B-09 no inventa una.
> 
> #### 12.8.2. Última revisión válida
> 
> La “última revisión válida” para reconstrucción es la **revisión efectiva según B-06 y su cadena de correcciones**, no simplemente la de mayor fecha de registro. Se preservan ocurrencia y registro por separado.
> 
> #### 12.8.3. Resolución del pendiente
> 
> Visualizar cartera/dashboard, abrir la Revisión, filtrar datos o guardar una nota aislada **no resuelve** el pendiente. Conforme a RF-055/UC-P23, el pendiente se resuelve únicamente cuando una Revisión profesional válida pertinente queda registrada y su continuidad/cierre se aplica mediante `UC-I06`. Una edición, nota, visualización o simple cambio de fecha fuera de ese circuito no cuenta como resolución.
> 
> ---

## R052 — Próxima acción → Ciclo cerrado trazable

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Solo aplicación efectiva por UC-I06 con revisión y consecuencia aporta evidencia al ciclo. Próxima acción propuesta por sí sola no cierra ciclo.

**Fuente:** 06 §12.7, L5936–L5960; 06 §8.7.5, L3524–L3538

> ### 12.7. Efectos de los seis resultados y continuidad
> 
> **`REG-06-147` — Aplicación de resultado mediante UC-I06/B-04.**
> 
> B-09 **no modifica directamente** la máquina `ABIERTO/CERRADO`. Tras una Revisión válida, `UC-I06` aplica la continuidad/cierre y emite el evento exacto `ContinuidadOCierreAplicado` de `REG-06-75`.
> 
> | Resultado | Efecto estructural de B-09 | Efecto de Proceso |
> |---|---|---|
> | `MANTENER` | conserva continuidad explícita; no fuerza una versión nueva por sí solo | `ABIERTO` |
> | `AJUSTAR` | cuando la decisión modifica un objeto versionado, crea/sucede versión mediante la vertical + B-06; conserva antecedente | `ABIERTO` |
> | `SUSTITUIR` | relaciona una versión sucesora cuando el objeto aplicable es sustituido; conserva la sustituida | `ABIERTO` |
> | `REPROGRAMAR_REVISION` | fija nueva próxima revisión sin alterar historia | `ABIERTO` |
> | `CAMBIAR_OBJETIVO` | emite/sucede la versión del Objetivo correspondiente; cualquier ajuste de Plan sigue reglas de su vertical | `ABIERTO` |
> | `FINALIZAR` | solicita cierre explícito mediante UC-I06 | `CERRADO` |
> 
> **`REG-06-148` — `AJUSTAR` y `SUSTITUIR` reutilizan versionado vertical.**
> 
> B-09 no crea una máquina universal de Plan ni Objetivo. Nutrición usa B-07 y Entrenamiento B-08; toda versión sucesora instancia B-06. En Entrenamiento, una progresión o nuevo Bloque sigue especializándose en `AJUSTAR`/`SUSTITUIR` según conserve o genere versión.
> 
> **`REG-06-149` — Sin éxito parcial de continuidad.**
> 
> Una Revisión registrada sin aplicación válida de `UC-I06` no se presenta como continuidad/cierre consumado. Un fallo al aplicar el efecto no emite `ContinuidadOCierreAplicado` y no resuelve por sí solo un pendiente.
> 
> ---
> 
> #### 8.7.5. Frontera con Ciclo cerrado trazable
> 
> **`REG-06-76` — Q-007 no redefine T-06-40.**
> 
> `ContinuidadOCierreAplicado` demuestra que la consecuencia funcional fue aplicada. M-10 conserva `T-06-40 — Ciclo cerrado trazable`.
> 
> ```text
> Revisión válida (M-10)
> + ContinuidadOCierreAplicado (M-04)
> → insumos para Ciclo cerrado trazable (M-10)
> → elegibilidad analítica posterior (M-12)
> ```
> 
> B-04 no calcula TVCC-30.

## R053 — Ciclo cerrado trazable → TVCC-30

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Conjuntos de ciclos fuente alimentan numerador/denominador con especificación, período y zona. Se retira relación 0..N:1 que sugería propiedad exclusiva.

**Fuente:** 06 §15.6, L7077–L7091

> ### 15.6. Componentes de numerador y denominador
> 
> **`REG-06-192` — Candidato a denominador trazable.**  
> El componente candidato a denominador se construye a partir de ciclos cuya evaluación los identifica como integrantes bajo la especificación referenciada. Conserva el conjunto de ciclos fuente; B-12 no define la regla analítica que los vuelve elegibles.
> 
> **`REG-06-193` — Candidato a numerador trazable.**  
> El componente candidato a numerador se construye como subconjunto trazable de ciclos evaluados conforme a la especificación y con los hechos requeridos por ella. Conserva cada ciclo fuente y el criterio aplicado.
> 
> **`REG-06-194` — Par inseparable para presentación analítica.**  
> Cuando B-12 materializa componentes TVCC-30, numerador y denominador se conservan y consultan como par bajo la misma especificación, período y zona. B-12 no autoriza presentar un numerador aislado como si fuera la métrica.
> 
> Esta regla no define la operación matemática que Documento 12 aplique sobre el par.
> 
> ---

## R054 — Revisión profesional válida → Proyección

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Proyecciones consumen fuentes de revisión/continuidad; no las sustituyen ni crean decisiones profesionales.

**Fuente:** 06 §12.9, L5986–L5999

> ### 12.9. Q-007, `REG-06-75` y TVCC-30
> 
> B-09 **consume, no redefine**, la resolución de Q-007 de B-04:
> 
> ```text
> Q-007: RESUELTA
> EVENTO: ContinuidadOCierreAplicado
> EMISIÓN: UC-I06 / REG-06-75
> ```
> 
> La combinación de Revisión válida + `ContinuidadOCierreAplicado` aporta hechos que `M-10/M-12` pueden utilizar para Ciclo cerrado trazable, pero B-09 **no calcula ni canoniza TVCC-30**. La definición analítica/versionada final pertenece al Documento 12.
> 
> ---

## R055 — Método profesional versionado → Ejecución de cálculo

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Cada corrida conserva versión exacta de método; múltiples corridas pueden coexistir. No se enlaza contra una versión vigente mutable.

**Fuente:** 06 §20.3.4, L8379–L8404

> #### 20.3.4. Ejecución reproducible
> 
> **`REG-06-205` — Ejecución de cálculo como hecho histórico independiente.**
> 
> Cada `T-06-73` conserva:
> 
> - versión exacta del Método;
> - finalidad/contexto;
> - actor profesional;
> - conjunto exacto de inputs efectivos;
> - procedencia/referencia de cada input;
> - resultado;
> - unidad;
> - precisión/redondeo aplicados;
> - ocurrencia/registro;
> - estado de éxito/error cuando corresponda.
> 
> Varias Ejecuciones pueden coexistir para la misma finalidad.
> 
> No se permite:
> 
> - sobrescribir una corrida previa;
> - promediar resultados silenciosamente;
> - declarar un ganador automático;
> - reconstruir pasado con una versión metodológica nueva.

## R056 — Ejecución de cálculo → Referencia profesional adoptada

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Adopción explícita referencia corrida y finalidad; nuevas referencias conservan sucesión. Se retira máximo uno histórico por corrida no fijado por la fuente.

**Fuente:** 06 §20.3.6, L8419–L8440

> #### 20.3.6. Referencia profesional adoptada
> 
> **`REG-06-207` — Adoptar una referencia es una relación, no una mutación del resultado.**
> 
> `T-06-74` conserva:
> 
> ```text
> profesional
> Ejecución referenciada
> finalidad/contexto
> momento de adopción
> fundamento opcional/relación con decisión posterior
> ```
> 
> La adopción:
> 
> - no modifica la Ejecución;
> - no borra otras Ejecuciones;
> - no convierte el resultado en verdad universal;
> - no crea objetivo/prescripción;
> - puede ser sucedida por otra referencia mediante historia, sin overwrite.

## R057 — Plantilla BE de solicitud → Solicitud estructurada

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Cada solicitud conserva versión exacta de plantilla. La misma versión puede usarse en varias solicitudes; no consulta una plantilla cambiante.

**Fuente:** 06 §20.4.2, L8483–L8503; 06 §20.4.3, L8504–L8534

> #### 20.4.2. Plantilla BE versionada
> 
> **`REG-06-209` — Plantilla de solicitud con versión inmutable.**
> 
> `T-06-75` conserva:
> 
> - identidad estable de plantilla;
> - versión;
> - finalidad/es compatibles;
> - secciones/campos;
> - tipo de dato;
> - unidad cuando corresponda;
> - categoría de dato;
> - requerido/opcional permitido;
> - reglas de validación estructural;
> - estado de seleccionabilidad.
> 
> Una solicitud referencia una versión exacta. Editar una plantilla crea una versión sucesora y no reinterpreta solicitudes/respuestas históricas.
> 
> P0 no modela un builder libre arbitrario. Las plantillas son estructuras BE controladas/versionadas.
> 
> #### 20.4.3. Solicitud estructurada
> 
> **`REG-06-210` — Solicitud request-driven y trazable.**
> 
> `T-06-76` conserva:
> 
> ```text
> requestId
> profesional solicitante
> asesorado
> contexto/vínculo de referencia
> finalidad
> alcance
> templateVersion
> subconjunto de secciones/campos cuando sea permitido
> requerido/opcional efectivo
> fecha de solicitud
> estado funcional
> ```
> 
> Estados mínimos:
> 
> ```text
> PENDIENTE
> RESPONDIDA
> ```
> 
> La existencia o estado de la Solicitud **no concede acceso**. La consultabilidad efectiva se deriva de autorización vigente conforme a 08.
> 
> La Solicitud no es consentimiento y no modifica por sí sola vínculo/alcance.

## R058 — Solicitud estructurada → Respuesta autoinformada

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Respuestas/rectificaciones históricas referencian solicitud y versión de plantilla. No equivale a múltiples respuestas efectivas simultáneas; se conserva cadena de corrección.

**Fuente:** 06 §20.4.4, L8535–L8554

> #### 20.4.4. Respuesta autoinformada
> 
> **`REG-06-211` — Respuesta vinculada a request/template exactos.**
> 
> `T-06-77` conserva:
> 
> - requestId;
> - templateVersion;
> - asesorado;
> - respuestas estructuradas;
> - unidad cuando corresponda;
> - procedencia `SELF_REPORTED`;
> - momento de envío;
> - autoría/ocurrencia/registro;
> - referencia a versión/respuesta anterior cuando existe rectificación.
> 
> Una Respuesta enviada no se sobrescribe silenciosamente.
> 
> La rectificación produce una versión/respuesta sucesora y preserva la anterior conforme al patrón histórico de B-06, sin crear una máquina de corrección paralela.

## R059 — Grupo de intercambio → Nutriente crítico

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

La prescripción por intercambio conserva nutriente crítico declarado por el grupo. La fuente no fija número de nutrientes por grupo ni exclusividad del nutriente; se retira 1:0..N.

**Fuente:** 06 §10.17.2.2, L4586–L4600

> ##### 10.17.2.2. Modalidad B — porciones de intercambio
> 
> **`REG-06-120` — Grupo de intercambio declarado y versionado.**
> 
> Una prescripción por intercambio conserva:
> 
> - Grupo de intercambio identificable;
> - cantidad de porciones prescriptas;
> - Nutriente crítico declarado por el grupo;
> - aporte de referencia versionado;
> - relación declarada y versionada entre alimento y Grupo de intercambio;
> - desvío real entre el alimento elegido y la referencia del grupo, cuando exista elección registrada.
> 
> La pertenencia de un alimento a un Grupo de intercambio **no es un atributo intrínseco** del alimento. La estructura queda modelada en v0.1.1; su implementación operativa puede diferirse hasta disponer del catálogo de grupos cargado. El desvío no se oculta.

## R060 — Ítem prescripto → Grupo de intercambio

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Solo modalidad B: ítem contextual de intercambio referencia grupo declarado/versionado. Inversa no exclusiva inferida; pertenencia alimento–grupo no es atributo intrínseco.

**Fuente:** 06 §10.17.2.2, L4586–L4600

> ##### 10.17.2.2. Modalidad B — porciones de intercambio
> 
> **`REG-06-120` — Grupo de intercambio declarado y versionado.**
> 
> Una prescripción por intercambio conserva:
> 
> - Grupo de intercambio identificable;
> - cantidad de porciones prescriptas;
> - Nutriente crítico declarado por el grupo;
> - aporte de referencia versionado;
> - relación declarada y versionada entre alimento y Grupo de intercambio;
> - desvío real entre el alimento elegido y la referencia del grupo, cuando exista elección registrada.
> 
> La pertenencia de un alimento a un Grupo de intercambio **no es un atributo intrínseco** del alimento. La estructura queda modelada en v0.1.1; su implementación operativa puede diferirse hasta disponer del catálogo de grupos cargado. El desvío no se oculta.

## R061 — Atlas de referencia de porciones → Catálogo global BE

**Estado:** ACTIVA · **Evidencia:** DEPENDENCIA_SIN_CARDINALIDAD · **Cardinalidades:** sin fijar : sin fijar

Se corrigen extremos: Atlas pertenece al Catálogo global. La fuente no demuestra vínculo directo Atlas–Ítem prescripto; no se fija multiplicidad adicional.

**Fuente:** 06 §10.25, L4821–L4844

> ### 10.25. Política de ámbito de recursos visuales
> 
> **`REG-06-135` — Ámbito y acumulación de recursos visuales.**
> 
> La pertenencia conceptual se separa de este modo:
> 
> 1. **Catálogo global de BE:** cada elemento admite **a lo sumo un recurso visual curado vigente**; las versiones históricas se conservan conforme a B-06.
> 2. **Preparaciones propias del profesional:** pueden asociar recursos visuales propios únicamente dentro del ámbito de ese profesional; esta facultad no convierte el catálogo global en un repositorio libre.
> 3. **Atlas de referencia de porciones:** pertenece al catálogo global como conjunto curado y acotado de referencias visuales de tamaño.
> 
> La regla de máximo uno aplica al **recurso visual curado vigente por elemento global**, no a la historia versionada ni a explicaciones técnicas no visuales.
> 
> **`REG-06-136` — Frontera técnica y de gobierno de recursos.**
> 
> B-07 modela únicamente relación, ámbito, procedencia, autoría, licencia y versionado conceptual. Quedan fuera:
> 
> - límites de almacenamiento, cuotas, retención y políticas de acceso → Documento 08;
> - formato, resolución y tratamiento técnico → Documentos 07/09;
> - representación y composición visual → Documento 10.
> 
> B-07 no presume tecnología de almacenamiento ni proveedor.
> 
> ---

## R062 — Recurso didáctico de catálogo → Elemento de catálogo

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 0..N : 1

Se corrige destino a Elemento de catálogo. Cada versión de recurso declara ese elemento y su versión; admite historia 0..N. Máximo un visual curado vigente por elemento global es otra restricción, no máximo histórico.

**Fuente:** 06 §10.24.2, L4806–L4820; 06 §10.25, L4821–L4844

> #### 10.24.2. Recurso didáctico de catálogo
> 
> **`REG-06-134` — Recurso didáctico opcional, versionado y con licencia obligatoria.**
> 
> Los elementos de catálogo de ambas verticales pueden asociar cero o más versiones históricas de un **Recurso didáctico de catálogo**. Cada versión declarada conserva:
> 
> - procedencia;
> - autoría;
> - licencia **obligatoria**;
> - referencia al elemento de catálogo y a la versión a la que resulta aplicable.
> 
> El recurso puede representar material visual o explicación técnica. B-07 no fija su contenido profesional, formato, resolución ni mecanismo de transporte. B-08 **instancia esta misma regla por referencia** para el catálogo de ejercicios en lugar de crear una definición paralela.
> 
> ---
> 
> ### 10.25. Política de ámbito de recursos visuales
> 
> **`REG-06-135` — Ámbito y acumulación de recursos visuales.**
> 
> La pertenencia conceptual se separa de este modo:
> 
> 1. **Catálogo global de BE:** cada elemento admite **a lo sumo un recurso visual curado vigente**; las versiones históricas se conservan conforme a B-06.
> 2. **Preparaciones propias del profesional:** pueden asociar recursos visuales propios únicamente dentro del ámbito de ese profesional; esta facultad no convierte el catálogo global en un repositorio libre.
> 3. **Atlas de referencia de porciones:** pertenece al catálogo global como conjunto curado y acotado de referencias visuales de tamaño.
> 
> La regla de máximo uno aplica al **recurso visual curado vigente por elemento global**, no a la historia versionada ni a explicaciones técnicas no visuales.
> 
> **`REG-06-136` — Frontera técnica y de gobierno de recursos.**
> 
> B-07 modela únicamente relación, ámbito, procedencia, autoría, licencia y versionado conceptual. Quedan fuera:
> 
> - límites de almacenamiento, cuotas, retención y políticas de acceso → Documento 08;
> - formato, resolución y tratamiento técnico → Documentos 07/09;
> - representación y composición visual → Documento 10.
> 
> B-07 no presume tecnología de almacenamiento ni proveedor.
> 
> ---

## R063 — Identidad BE → Perfil profesional

**Estado:** ACTIVA · **Evidencia:** EXPRESA · **Cardinalidades:** 1 : 0..1

Relación expresa omitida en vista profesional v4. No habilita operaciones por completar el perfil.

**Fuente:** 06 §6.4, L2764–L2769

> ### 6.4. Perfil profesional
> 
> Una `Identidad BE` posee `0..1 Perfil profesional`. Puede estar incompleto y no concede Especialidad, Verificación, Habilitación ni acceso.
> 
> **`REG-06-31` — Perfil profesional versionado.** Los cambios confirmados que deban conservar antecedente emiten nueva `Versión` conforme a B-06. La anterior permanece inmutable.

## R064 — Identidad BE → Alcance profesional

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : 0..N

Alcance contextual bajo una identidad profesional: especialidad o capacidad antropométrica, exactamente una de ambas clases. N resume declaraciones, no catálogo irrestricto.

**Fuente:** 06 §6.5, L2770–L2779; 06 §6.6, L2780–L2805

> ### 6.5. Especialidad, capacidad y Alcance
> 
> Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.
> 
> La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.
> 
> **`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.
> 
> Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.
> 
> ### 6.6. Habilitación
> 
> `Habilitación` es una dimensión independiente por Identidad + Alcance cuando aplique.
> 
> ```text
> VERIFICADO
> ≠ Habilitación efectiva
> ≠ Autorización sobre datos
> ```
> 
> #### 6.6.1. Modelo separado de Verificación profesional — `7.13-01`
> 
> La unidad `7.13-01` queda resuelta explícitamente mediante una relación estructural separada:
> 
> ```text
> Identidad BE
>   ├─ Verificación profesional por Alcance
>   └─ Habilitación por Alcance, cuando aplique
> ```
> 
> Ambas pueden coexistir con resultados distintos. La existencia, cambio o resolución favorable de una no muta la otra por implicación.
> 
> **`REG-06-33` — Verificación no crea Habilitación.** La resolución `VERIFICADO` nunca habilita por inferencia.
> 
> B-02 conserva la referencia estructural a Habilitación; la regla que la determina, su condición académica/comercial y la capacidad configurada se coordinan con M-05 y las políticas propietarias posteriores. B-02 no convierte Habilitación en estado de la máquina de Verificación ni en autorización de datos.

## R065 — Bloque → Sesión

**Estado:** ACTIVA · **Evidencia:** DERIVACION_JUSTIFICADA · **Cardinalidades:** 1 : sin fijar

Alternativa expresa cuando el plan omite Microciclo. Mínimo de sesiones no fijado por la regla; no se dibuja una obligatoriedad inventada.

**Fuente:** 06 §11.17.1, L5379–L5396

> #### 11.17.1. Jerarquía extendida
> 
> **`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**
> 
> La estructura de `REG-06-111` se extiende compatiblemente a:
> 
> ```text
> Versión de plan
> → Bloque
> → Microciclo [0..N]
> → Sesión
> → Prescripción de ejercicio
> ```
> 
> Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.
> 
> El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

