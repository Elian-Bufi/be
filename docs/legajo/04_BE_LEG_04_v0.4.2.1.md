# 04 — Requerimientos funcionales y no funcionales

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Código documental:** `BE-LEG-04`  
> **Versión:** `0.4.2.1`  
> **Estado:** `BORRADOR DE PARCHE TRANSVERSAL — CORRECCIÓN POST-CONTRARREVISIÓN · NO APROBADO`  
> **Fecha:** `2026-09-06`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Propietario documental:** Dirección de producto BE / Ingeniería de requerimientos  
> **Baseline de fuentes:** rama `docs/canonical-legajo-to-be`, SHA `13224caa93b9c6cc8cc748f1035b385d7c5bab32`  
> **Dependencias canónicas:** `BE-LEG-00 v0.2.1`, `BE-LEG-02 v0.2.1`, `BE-LEG-03 v0.2.1`  
> **Revisión:** base `REV-005` cerrada/conforme; parche transversal autorizado por `ACTA-DIR-021`; contrarrevisión v0.4.2 `CONFORME CON AJUSTES MENORES` — M1/M2 incorporados  
> **Gate propietario:** `G2 — cerrado en la baseline; reapertura documental controlada por impacto transversal, sin reabrir el gate global`  
> **Canon previsto:** `docs/legajo/04_Requerimientos_RF_RNF.md`  
> **Base canónica:** `BE-LEG-04 v0.4.1` aprobada y canonizada; **esta v0.4.2.1 no está canonizada**
> **Canonización de esta versión:** `NO AUTORIZADA`

---

> **Control de cambio v0.4.2:** `ACTA-DIR-021` ratifica la Auditoría de Impacto Transversal v0.2.1 (`454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`) y autoriza exclusivamente la redacción del parche. La baseline v0.4.1 permanece intacta como antecedente aprobado/canónico hasta que esta versión complete revisión y decisión de Dirección.

## 1. Propósito

Este documento convierte la visión y el modelo de negocio aprobados en **obligaciones verificables del producto y de calidad**. Define qué resultado debe producir BE y bajo qué condiciones se considerará aceptable, sin apropiarse de los modelos, mecanismos o diseños de los documentos posteriores.

No define entidades ni estados definitivos, retención, controles técnicos, topología, endpoints, componentes visuales ni estrategia de pruebas. Los referencia como derivaciones obligatorias.

## 2. Precedencia y límites de propiedad

| Materia | Propietario | Uso desde 04 |
|---|---|---|
| Visión, alcance, prioridades, fecha y North Star | 02 | fuente vinculante |
| Negocio, actores, oferta, habilitaciones y validación | 03 | fuente vinculante |
| Flujos, variantes y pre/postcondiciones detalladas | 05 | derivación |
| Entidades, estados, invariantes, fórmulas y retención estructural | 06 | derivación |
| Consentimiento, autorización, auditoría y gobierno de datos | 08 | derivación |
| Arquitectura, ambientes, rendimiento técnico y despliegue | 07 | derivación |
| Endpoints, payloads, códigos y compatibilidad | 09 | derivación |
| Pantallas, navegación, contenido y accesibilidad aplicada | 10 | derivación |
| Diseño de pruebas, datos y criterios de ejecución | 11A | derivación |
| Trazabilidad y evidencia | 12/11B | derivación |

Ante contradicción prevalecen las decisiones TO-BE aprobadas. Un detalle existente en código o en un documento de sprint no se convierte por sí solo en requisito canónico.

## 3. Alcance y prioridades

### 3.1 Núcleo no recortable

Identidad, administración mínima, vínculos, consentimientos, Nutrición, Entrenamiento, Antropometría, soporte metodológico profesional reproducible, solicitudes estructuradas de información pertinente, dashboard interdisciplinario, Website, APK Android, seguridad, trazabilidad y pruebas.

### 3.2 Integraciones

| Prioridad | Capacidades | Efecto sobre aceptación |
|---|---|---|
| P0 — Compromiso académico | Open Food Facts y wger | deben demostrarse con procedencia y fallback |
| P1 — Alta prioridad | Google Identity y Google Maps | se intentan después del núcleo; pueden diferirse con contingencia documentada |
| P2 — Condicionado | Expo Push y funciones avanzadas de cuenta híbrida | no bloquean el MVP si desplazan el núcleo |

### 3.3 Capacidades condicionadas sin obligación activa

Medicamentos reportados, exportaciones, Resend, WhatsApp, calendario, pagos y wearables permanecen condicionados en el Documento 02. Esta versión no crea requisitos activos para esas capacidades; activarlas exige control de cambio y no puede desplazar el núcleo. Expo Push conserva un RF P2 porque ya posee fallback explícito aprobado.

### 3.4 Fecha y regla de recorte

Dirección adopta el **27 de agosto de 2026** como fecha objetivo de entrega del proyecto. Se conserva una contingencia operativa del **28 al 31 de agosto** para correcciones de cierre, sin ampliar silenciosamente el alcance. Si la capacidad resulta insuficiente, se recortan primero P2, mejoras visuales no funcionales y P1 no esenciales; no se elimina silenciosamente un requisito P0 aprobado.

## 4. Calidad de un requisito

Cada requisito de esta versión identifica actor o componente, prioridad, obligación, criterio observable, fuente y documentos de derivación. Los escenarios completos, entradas, errores y secuencias se desarrollarán en 05, 09 y 11A para evitar duplicación.

Todos los requisitos constituyen la **baseline funcional aprobada por dirección** para continuar el legajo. La aprobación documental no autoriza por sí sola cambios de datos, arquitectura o implementación antes de los gates definidos por 00.

Los nombres de estados utilizados en este documento expresan una **semántica funcional mínima** y no congelan la denominación técnica definitiva, que pertenece al Documento 06. Del mismo modo, las acciones específicas de Nutrición o Entrenamiento deberán mapearse al resultado semántico común aprobado por DEC-043; las especializaciones de dominio no crean categorías incompatibles.

Los identificadores retirados en versiones anteriores no se reutilizan. La continuidad numérica preserva la historia documental, aunque existan huecos como `RF-016` y `RF-063`.

## 5. Decisiones provisionales necesarias para G2

| Decisión | Recomendación | Estado |
|---|---|---|
| DEC-042 — Alta profesional | autoservicio escalonado con revisión administrativa independiente por especialidad | APROBADA; vigencia provisional para G2 y validación antes de G4 |
| DEC-043 — Revisión profesional válida | evento explícito vinculado a evidencia, con resultado, fundamento y próxima acción | APROBADA; vigencia provisional para G2 y validación antes de G4 |

Las mini-ADR completas acompañan esta versión. Dirección aprobó ambas recomendaciones con vigencia provisional para G2. El Documento 04 no fija los estados ni enums definitivos: esos elementos pertenecen a 06. Q-002 y Q-006 quedan resueltas provisionalmente y deberán confirmarse o revisarse mediante validación con usuarios antes de G4.

## 6. Requisitos funcionales (69 en candidato v0.4.2)

### Identidad, perfiles y acceso

#### RF-001 — Registrar una identidad BE

- **Actor:** Profesional o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir crear una cuenta propia mediante autenticación local, asociada a una identidad única e independiente del profesional, especialidad o paquete comercial.
- **Verificación de aceptación:** Con datos válidos se crea una sola identidad; un correo ya asociado no produce una segunda cuenta; el alta no verifica especialidades ni concede acceso a datos de terceros.
- **Derivación propietaria:** 05 define variantes y errores; 08 controles de identidad; 09 contrato; 10 formularios; 11A pruebas.
- **Fuente:** BE-LEG-02 §§6, 10–11; BE-LEG-03 §§2, 4 y 10.

#### RF-002 — Autenticar y finalizar una sesión local

- **Actor:** Profesional, asesorado o administrador
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir iniciar y finalizar una sesión mediante credenciales locales y bloquear el acceso cuando la cuenta no esté habilitada.
- **Verificación de aceptación:** Las credenciales válidas habilitan la superficie correspondiente; las inválidas o una cuenta suspendida no crean sesión; el cierre impide continuar usando la sesión finalizada.
- **Derivación propietaria:** 08 define controles y revocación; 09 contratos; 10 experiencia; 07 mecanismo de sesión.
- **Fuente:** BE-LEG-02 §11; BE-LEG-03 §2.

#### RF-003 — Acceder mediante Google sin duplicar identidad

- **Actor:** Profesional o asesorado
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá admitir Google como método federado adicional, manteniendo a BE como fuente de identidad, roles, especialidades y habilitaciones.
- **Verificación de aceptación:** Una cuenta vinculada accede al mismo historial por ambos métodos; Google no concede roles ni verificaciones; la indisponibilidad del proveedor no impide el acceso local.
- **Derivación propietaria:** 08 política de vinculación; 07 adaptador; 09 contrato; 10 experiencia.
- **Fuente:** BE-LEG-02 §§10–13; REV-002 RES-15.

#### RF-004 — Administrar métodos de acceso de una misma identidad

- **Actor:** Profesional o asesorado
- **Prioridad:** P2 — Condicionado / recortable
- **Obligación:** BE podrá permitir asociar o retirar métodos de acceso sin fragmentar la identidad longitudinal.
- **Verificación de aceptación:** Agregar o retirar un método no altera vínculos ni historial; no se permite dejar la cuenta sin un método utilizable; los cambios sensibles quedan trazables.
- **Derivación propietaria:** 08 y 09 fijan seguridad y contrato; 10 define la interacción. Es una de las funciones recortables antes que el núcleo.
- **Fuente:** BE-LEG-02 §§11 y 20.

#### RF-005 — Recuperar el acceso local

- **Actor:** Profesional, asesorado o administrador
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá ofrecer un recorrido de recuperación de credencial local que preserve la identidad y no revele indebidamente la existencia de cuentas.
- **Verificación de aceptación:** Una recuperación válida permite establecer una nueva credencial sin crear otra identidad; solicitudes inválidas o vencidas no modifican el acceso; la respuesta inicial es neutra.
- **Derivación propietaria:** 08 fija controles y vigencias; 09 el contrato; 10 el recorrido.
- **Fuente:** Derivado de identidad persistente y operación segura de BE-LEG-02 §§6, 11 y 15.

#### RF-006 — Consultar el estado de la cuenta y del perfil

- **Actor:** Profesional o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá informar el estado operativo de la cuenta y los pasos pendientes para poder utilizar cada capacidad.
- **Verificación de aceptación:** El usuario distingue cuenta, perfil, especialidad verificada, habilitación y vínculo; un estado incompleto no se presenta como habilitado.
- **Derivación propietaria:** 06 define estados; 08 efectos de seguridad; 10 presentación.
- **Fuente:** BE-LEG-03 §4; REV-003 desacoplamiento comercial.

#### RF-007 — Acceder a las capacidades por la superficie prevista

- **Actor:** Profesional, asesorado o administrador
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Cada actor deberá poder llegar a las funciones que le corresponden desde el Website o la APK sin conocer rutas internas.
- **Verificación de aceptación:** El administrador y el profesional operan en Website; el asesorado accede a Hoy y sus funciones desde la APK; la visibilidad no reemplaza la autorización.
- **Derivación propietaria:** 10 define navegación y shells después de G4; 08 autoriza; 05 define recorridos.
- **Fuente:** BE-LEG-02 §§5, 11 y 15; Q-000.

#### RF-069 — Solicitar el cierre de la propia cuenta

- **Actor:** Profesional o asesorado
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá permitir al titular solicitar el cierre de su propia cuenta mediante una acción autenticada y trazable, sin eliminar silenciosamente vínculos, decisiones ni evidencia histórica.
- **Verificación de aceptación:** La solicitud identifica actor y fecha; una cuenta cerrada no inicia nuevas sesiones; los efectos sobre vínculos, procesos, conservación y eventual reversibilidad se aplican según las políticas aprobadas; el cierre no se presenta como borrado inmediato de toda la información.
- **Derivación propietaria:** 05 define el recorrido; 06 estados y efectos operativos; 08 retención, derechos y verificación de identidad; 10 interacción.
- **Fuente:** BE-LEG-02 §§6 y 11; BE-LEG-03 §§4 y 10; ciclo de vida de identidad y separación entre cuenta e historia longitudinal.

### Alta profesional y administración mínima

#### RF-008 — Crear y mantener un perfil profesional

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir completar un perfil profesional sin confundirlo con una especialidad verificada ni con autorización sobre asesorados.
- **Verificación de aceptación:** El perfil puede guardarse incompleto; su existencia no habilita planes ni acceso a datos; los cambios relevantes conservan autoría y fecha.
- **Derivación propietaria:** 06 define estructura y estados; 08 visibilidad; 10 formulario.
- **Fuente:** BE-LEG-02 §§6 y 11; BE-LEG-03 §§4 y 10.

#### RF-009 — Declarar especialidades y aportar evidencia

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir solicitar Nutrición, Entrenamiento o ambas, aportando evidencia separada para cada especialidad; la antropometría se tratará como capacidad transversal sujeta a política específica.
- **Verificación de aceptación:** Cada especialidad se evalúa de forma independiente; declarar una no verifica la otra; la carga de evidencia no equivale a aprobación.
- **Derivación propietaria:** 06 modela especialidades y estados; 08 gobierna evidencia; 10 carga.
- **Fuente:** BE-LEG-02 §§6 y 11; DEC-013; BE-LEG-03 §10.

#### RF-010 — Presentar una solicitud de verificación

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir enviar a revisión administrativa la evidencia de una especialidad o de la capacidad antropométrica cuando el conjunto mínimo requerido esté completo.
- **Verificación de aceptación:** La versión presentada queda identificada; el profesional conoce fecha y estado; no puede operar esa especialidad o capacidad mientras no alcance el estado habilitante definido.
- **Derivación propietaria:** DEC-042 aprobada provisionalmente define el recorrido; 05 define flujo; 06 estados; 08 controles.
- **Fuente:** Q-002; DEC-004, DEC-005 y DEC-041.

#### RF-011 — Revisar una solicitud profesional

- **Actor:** Administrador
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** El administrador deberá consultar la evidencia presentada, verificar completitud y registrar observaciones o una resolución trazable por especialidad o capacidad transversal.
- **Verificación de aceptación:** La revisión identifica administrador, fecha, versión y fundamento; no modifica otra especialidad ni capacidad; no se presenta como certificación oficial.
- **Derivación propietaria:** 06 define resultados y estados; 08 acceso/auditoría; 10 consola.
- **Fuente:** BE-LEG-02 §§6 y 11; BE-LEG-03 §10; REV-003 verificación profesional.

#### RF-012 — Resolver la verificación por especialidad o capacidad transversal

- **Actor:** Administrador
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir aprobar, rechazar o suspender la operación de una especialidad o capacidad transversal con motivo y trazabilidad, respetando como mínimo los estados aprobados por DEC-005.
- **Verificación de aceptación:** La resolución afecta solo la especialidad o capacidad seleccionada; una suspensión corta nuevas operaciones del alcance; el historial permanece consultable según política.
- **Derivación propietaria:** 06 fija la máquina de estados; 08 efectos y auditoría; 05 escenarios.
- **Fuente:** DEC-004, DEC-005 y DEC-041.

#### RF-013 — Responder observaciones y volver a presentar evidencia

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir corregir una solicitud no aprobada cuando la resolución admita subsanación, sin sobrescribir la evidencia revisada.
- **Verificación de aceptación:** La nueva presentación conserva relación con la anterior; el profesional conoce qué debe corregir; el reenvío no se interpreta como aprobación.
- **Derivación propietaria:** 05 define variantes; 06 versionado; 08 evidencia.
- **Fuente:** Q-002; DEC-042 aprobada con vigencia provisional para G2.

#### RF-014 — Suspender y rehabilitar una capacidad profesional

- **Actor:** Administrador
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir suspender y, cuando corresponda, rehabilitar la operación profesional con motivo, alcance y autoría.
- **Verificación de aceptación:** La suspensión impide nuevas acciones del dominio sin eliminar registros; la rehabilitación requiere una resolución explícita; los efectos sobre vínculos activos se especifican en 06 y 08.
- **Derivación propietaria:** 06 estados; 08 autorización y auditoría; 05 escenarios de incidencia.
- **Fuente:** BE-LEG-02 §11; DEC-004 y DEC-005.

#### RF-015 — Mantener separadas verificación, habilitación y autorización

- **Actor:** Sistema BE
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá evaluar de forma independiente identidad, especialidad verificada, habilitación comercial o académica, vínculo, consentimiento y autorización de datos.
- **Verificación de aceptación:** Cambiar paquete o capacidad no concede especialidad ni acceso a datos; una especialidad verificada no autoriza por sí sola a consultar un asesorado; cada denegación puede atribuirse a la condición faltante.
- **Derivación propietaria:** 06 modela conceptos; 08 calcula autorización; 03 conserva la separación económica.
- **Fuente:** BE-LEG-03 §4 y REV-003 desacoplamiento comercial.

#### RF-067 — Declarar la capacidad antropométrica transversal y aportar evidencia

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir declarar una capacidad antropométrica transversal y aportar evidencia propia, independiente de las especialidades de Nutrición y Entrenamiento.
- **Verificación de aceptación:** La declaración y su evidencia quedan identificadas por separado; cargar evidencia no equivale a aprobación; sin resolución habilitante no se registran evaluaciones ni se publica el servicio; declarar esta capacidad no modifica automáticamente las especialidades.
- **Derivación propietaria:** DEC-042 v0.4 aporta el pipeline administrativo; 05 define el flujo; 06 estados y relaciones; 08 evidencia, acceso y efectos; 10 superficies.
- **Fuente:** BE-LEG-02 §§6, 11–12; BE-LEG-03 §11; RF-047 y RF-051.

#### RF-068 — Registrar y gestionar incidencias administrativas mínimas

- **Actor:** Profesional, asesorado o administrador
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá permitir reportar y gestionar incidencias operativas vinculadas con acceso, perfiles, vínculos, integridad de información o funcionamiento de los recorridos, sin convertir el MVP en una plataforma general de soporte.
- **Verificación de aceptación:** La incidencia conserva reportante, categoría, fecha, estado, responsable y resolución; el administrador consulta y actualiza únicamente las incidencias autorizadas; el historial no se sobrescribe y el reportante puede conocer el estado de su caso.
- **Derivación propietaria:** 05 define escenarios; 06 ciclo de vida mínimo; 08 acceso y auditoría; 10 consulta y comunicación.
- **Fuente:** BE-LEG-02 §§6 y 11; responsabilidad administrativa de gestionar incidencias.

### Capacidades transversales de soporte profesional

#### RF-070 — Utilizar métodos profesionales de cálculo reproducible

- **Actor:** Profesional autorizado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir al profesional autorizado consultar y ejecutar métodos de cálculo habilitados y versionados para una finalidad pertinente, conservando requisitos de entrada, versión del método, inputs efectivos, procedencia y resultado, sin convertir el cálculo ni una eventual sugerencia en una decisión profesional automática.
- **Verificación de aceptación:** El profesional puede identificar qué método y versión ejecuta y qué datos requiere; un método no se ejecuta si faltan inputs obligatorios o si su procedencia no es admisible; varias ejecuciones pueden coexistir sin promediarse ni sobrescribirse; una sugerencia, selección, ejecución o referencia adoptada permanece distinguible de la decisión profesional final; el resultado no modifica automáticamente requerimiento, objetivo, evaluación, prescripción ni plan; BE no impone una fórmula propia ni genera autónomamente el requerimiento/objetivo, preservando `DEC-046 §4.4/§4.9` e `INV-06-133`.
- **Derivación propietaria:** 05 define el patrón observable transversal y sus especializaciones; 06 parte de `T-06-N12` y define método/versionado, admisibilidad, ejecuciones y referencia profesional; 08 autorización, pertinencia y reutilización cross-domain; 09 contratos; 10 interacción; 11A pruebas; 12 trazabilidad.
- **Fuente:** `ACTA-DIR-021` (`TX-01`, `TX-03`, `TX-05`); `DEC-046 §4.4/§4.9`; Auditoría de Impacto Transversal v0.2.1.
- **Fundamento de prioridad P0:** `DEC-046 §4.4` ya condiciona el objetivo profesional a una decisión fundada y B10-05/B10-06/B10-07 materializan el soporte metodológico dentro de recorridos P0; diferir CAP-MET a P1 dejaría esos recorridos apoyados en una capacidad funcional no exigible en el núcleo y obligaría a reabrir UX ya estabilizada. P0 no significa cálculo autónomo: continúa rigiendo `DEC-046 §4.4/§4.9` + `INV-06-133`.

#### RF-071 — Solicitar y completar información profesional pertinente

- **Actor:** Profesional autorizado y asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir que un profesional autorizado solicite al asesorado información estructurada pertinente para una finalidad y alcance determinados, y que el asesorado la complete conservando solicitante, finalidad, versión de la estructura, estado y procedencia de la respuesta.
- **Verificación de aceptación:** La solicitud identifica quién pide la información, para qué y dentro de qué alcance; solo utiliza categorías/campos permitidos y distingue datos requeridos de opcionales cuando corresponda; la respuesta queda identificada como `self-reported` y no se convierte en medición profesional, diagnóstico ni autorización; una solicitud no amplía vínculo, consentimiento o acceso; una corrección/actualización posterior preserva historia; un dato preexistente del perfil puede reutilizarse o confirmarse sin perder su procedencia ni duplicarse silenciosamente como un origen indistinguible.
- **Derivación propietaria:** 05 define solicitar/completar y relación con perfil propio; 06 plantillas versionadas, solicitud, respuesta e historia; 08 minimización, categorías, B2/PDP, acceso y gobierno; 09 contratos; 10 formularios y copy; 11A pruebas; 12 trazabilidad.
- **Fuente:** `ACTA-DIR-021` (`TX-02`, `TX-04`); Auditoría de Impacto Transversal v0.2.1.

### Asesorado, vínculos, consentimiento y autorización

#### RF-017 — Crear y mantener un perfil de asesorado

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir a una persona adulta crear y mantener un perfil propio, gratuito y persistente, aun sin vínculo activo.
- **Verificación de aceptación:** El perfil no pertenece a un profesional; completar datos no concede acceso a terceros; menores quedan fuera del MVP.
- **Derivación propietaria:** 06 define datos; 08 minimización; 10 experiencia.
- **Fuente:** BE-LEG-02 §6; BE-LEG-03 §§2 y 10.

#### RF-018 — Solicitar o invitar a un vínculo

- **Actor:** Profesional o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir iniciar una solicitud de vínculo que identifique profesional, asesorado, especialidad y finalidad.
- **Verificación de aceptación:** La solicitud queda pendiente y no habilita acceso; el destinatario conoce quién solicita y para qué; no se crean duplicados equivalentes vigentes.
- **Derivación propietaria:** 05 flujo; 06 estados; 08 datos visibles; 09 contrato.
- **Fuente:** BE-LEG-02 §11; DEC-003; Q-000.

#### RF-019 — Aceptar o rechazar un vínculo

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** El asesorado deberá aceptar o rechazar expresamente la solicitud antes de que el vínculo pueda habilitar operación profesional.
- **Verificación de aceptación:** Antes de la aceptación no existe acceso profesional; el rechazo queda trazable; aceptar no equivale a consentir todos los dominios.
- **Derivación propietaria:** 05 variantes; 06 estados; 08 consentimiento y autorización.
- **Fuente:** DEC-003; BE-LEG-02 §§6 y 11; Q-000.

#### RF-020 — Otorgar consentimiento específico y versionado

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir otorgar consentimiento informado, específico, versionado y revocable para los datos, dominios y finalidades aplicables.
- **Verificación de aceptación:** No se habilita acceso protegido sin consentimiento vigente; el sistema conserva evidencia de versión, actor y fecha; el alcance no se amplía de forma implícita; un vínculo aceptado solo se considera operativo para un propósito cuando concurren los consentimientos aplicables.
- **Derivación propietaria:** 08 es propietario de taxonomía, texto, vigencia y retención; 06 referencia el consentimiento; 05 flujo.
- **Fuente:** BE-LEG-02 §§9, 11 y 15; DEC-006; Q-003.

#### RF-021 — Evaluar la autorización contextual en cada operación protegida

- **Actor:** Sistema BE
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir o denegar cada operación considerando rol, especialidad, estado, vínculo, consentimiento, finalidad y alcance vigentes.
- **Verificación de aceptación:** Una condición faltante impide la operación; la decisión se aplica en todas las superficies; la interfaz no puede otorgar permisos por sí misma.
- **Derivación propietaria:** 08 define la política; 06 aporta estados; 09 traduce resultados; 11A prueba casos positivos y negativos.
- **Fuente:** BE-LEG-02 §§11 y 15; DEC-006.

#### RF-022 — Revocar consentimiento y cortar accesos futuros

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir revocar un consentimiento y hacer efectiva la pérdida de autorización para operaciones futuras del alcance revocado.
- **Verificación de aceptación:** Tras la revocación, un profesional ya no realiza nuevas lecturas o escrituras protegidas del alcance; la evidencia histórica no se elimina silenciosamente; el efecto queda auditado.
- **Derivación propietaria:** 08 define retención y plazo efectivo; 06 estados; 05 escenarios.
- **Fuente:** BE-LEG-02 §§11 y 15; Q-003 y Q-004; DEC-006.

#### RF-023 — Consultar vínculos y consentimientos propios

- **Actor:** Profesional o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Cada actor deberá consultar sus relaciones, especialidades, finalidades, estados y consentimientos relevantes.
- **Verificación de aceptación:** El asesorado identifica quién tiene acceso y con qué alcance; el profesional solo ve relaciones propias; la información coincide con la autorización efectiva.
- **Derivación propietaria:** 08 define visibilidad; 10 presentación; 06 estados.
- **Fuente:** BE-LEG-02 §§6, 9 y 11.

#### RF-024 — Pausar o finalizar un vínculo

- **Actor:** Profesional o asesorado según política
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir pausar o finalizar un vínculo sin borrar la identidad ni la historia del proceso.
- **Verificación de aceptación:** La acción impide nuevas operaciones incompatibles con el estado; conserva autoría, fecha y motivo; la lectura posterior queda pendiente de Q-005 y Documento 08.
- **Derivación propietaria:** 06 define estados y transiciones; 08 lectura residual y retención; 05 casos.
- **Fuente:** BE-LEG-02 §11; Q-005 y Q-007.

#### RF-025 — Preservar identidad e historia al cambiar de profesional

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá conservar la identidad longitudinal y la procedencia de los registros cuando un vínculo cambie o finalice, sin transferir acceso automáticamente a otro profesional.
- **Verificación de aceptación:** El nuevo vínculo no altera autoría histórica; cada profesional solo consulta lo autorizado; el asesorado mantiene su cuenta y evolución.
- **Derivación propietaria:** 06 modelo longitudinal; 08 acceso histórico; 10 consulta.
- **Fuente:** BE-LEG-02 §§3, 5, 9 y 11; BE-LEG-03 §§4 y 10.

### Circuito nutricional

#### RF-026 — Registrar una evaluación nutricional

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar una evaluación nutricional pertinente al proceso, con autoría, fecha, fuente y contexto.
- **Verificación de aceptación:** La evaluación queda asociada al asesorado y al vínculo autorizado; distingue datos informados, observados y calculados; puede consultarse en la historia.
- **Derivación propietaria:** 06 define datos; 08 acceso; 05 flujo; 10 formulario.
- **Fuente:** BE-LEG-02 §§5, 11 y 15; DEC-012.

#### RF-027 — Gestionar un catálogo nutricional propio

- **Actor:** Profesional de Nutrición o administrador autorizado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá disponer de un catálogo propio de alimentos y permitir carga manual para operar sin proveedores externos.
- **Verificación de aceptación:** Los elementos indican procedencia y estado; el catálogo permite construir planes aun cuando Open Food Facts no esté disponible; cambios posteriores no alteran retrospectivamente planes emitidos.
- **Derivación propietaria:** 06 estructura/versionado; 08 licencia/procedencia cuando aplique; 10 gestión.
- **Fuente:** BE-LEG-02 §13 y fallbacks §20.

#### RF-028 — Importar alimentos desde Open Food Facts

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Compromiso académico de integración
- **Obligación:** BE deberá consultar e importar de forma controlada alimentos desde Open Food Facts, validando los datos antes de incorporarlos al catálogo BE.
- **Verificación de aceptación:** La importación identifica proveedor y fecha; datos insuficientes se corrigen o rechazan; una caída del proveedor permite continuar con catálogo propio y carga manual.
- **Derivación propietaria:** 07 adaptador; 09 contrato; 06 normalización; 08 licencia/procedencia.
- **Fuente:** BE-LEG-02 §§10, 13 y 20; REV-002 RES-02.

#### RF-029 — Definir un objetivo nutricional vigente

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir acordar y registrar un objetivo nutricional con vigencia, responsable y relación con la evaluación.
- **Verificación de aceptación:** Existe un objetivo identificable para el plan; los cambios no reescriben silenciosamente el anterior; el asesorado puede consultar la formulación autorizada.
- **Derivación propietaria:** 06 define ciclo de vida; 05 flujo; 10 presentación.
- **Fuente:** BE-LEG-02 §§7–9 y 11.

#### RF-030 — Crear y editar un plan nutricional en borrador

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir construir un plan nutricional con estructura suficiente para indicar comidas, alternativas, cantidades, objetivos y observaciones antes de activarlo.
- **Verificación de aceptación:** El borrador puede guardarse y retomarse; no es visible como plan vigente del asesorado; las inconsistencias relevantes se informan antes de activar.
- **Derivación propietaria:** 06 define agregado e invariantes; 09 contratos; 10 editor; 05 flujo.
- **Fuente:** BE-LEG-02 §11; DEC-012.

#### RF-031 — Validar, versionar y activar un plan nutricional

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá impedir la activación de un plan inválido y, al activarlo, conservar una versión reproducible y claramente vigente.
- **Verificación de aceptación:** El asesorado consulta exactamente la versión activada; una modificación posterior produce continuidad trazable y no altera el histórico emitido; no existen vigencias contradictorias; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes.
- **Derivación propietaria:** 06 estados, versiones e invariantes; 08 autorización; 09 contrato.
- **Fuente:** BE-LEG-02 §§11 y 15; Q-000.

#### RF-032 — Consultar el plan nutricional del día en la APK

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** El asesorado deberá consultar desde Hoy qué corresponde realizar según su plan nutricional activo.
- **Verificación de aceptación:** La vista muestra la versión vigente y un estado claro cuando no existe plan; es accesible sin conocer rutas internas; no expone datos administrativos.
- **Derivación propietaria:** 10 diseña Hoy; 09 read model; 08 acceso; 05 escenarios.
- **Fuente:** BE-LEG-02 §§11 y 15; Q-000.

#### RF-033 — Registrar adherencia o ejecución nutricional

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar evidencia simple de cumplimiento o ejecución del plan nutricional con fecha y observación opcional.
- **Verificación de aceptación:** El registro queda asociado al plan vigente y al asesorado; un reintento no genera hechos duplicados; el profesional autorizado puede consultarlo.
- **Derivación propietaria:** 06 define dato y unicidad; 09 contrato; 10 interacción; 11A concurrencia.
- **Fuente:** BE-LEG-02 §§11 y 15; Q-000.

#### RF-034 — Analizar evidencia nutricional para una revisión

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir examinar en conjunto evaluación, objetivo, plan, ejecución y evolución nutricional antes de decidir continuidad.
- **Verificación de aceptación:** El profesional puede identificar el período y la evidencia relevante, comparar lo planificado con lo ejecutado y pasar al registro común de revisión de RF-056; abrir la pantalla no cuenta como revisión.
- **Derivación propietaria:** DEC-043 aprobada provisionalmente; 05 flujo; 06 read model; 08 acceso; 10 experiencia.
- **Fuente:** BE-LEG-02 §§15–16; BE-LEG-03 §§2 y 13; Q-006.

#### RF-035 — Dar continuidad o cerrar el proceso nutricional

- **Actor:** Profesional de Nutrición
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Después de una revisión, BE deberá permitir mantener, ajustar, sustituir o cerrar correctamente el plan o proceso nutricional.
- **Verificación de aceptación:** La acción queda vinculada con la revisión; el asesorado recibe la situación vigente; la historia anterior se conserva; el cierre cumple la definición que resuelva Q-007.
- **Derivación propietaria:** 06 define transiciones; 05 escenarios; 08 efectos de acceso.
- **Fuente:** BE-LEG-02 §§15–16; Q-000 y Q-007.

### Circuito de entrenamiento

#### RF-036 — Registrar una evaluación de entrenamiento

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar la evaluación necesaria para planificar entrenamiento, con autoría, fecha, contexto y fuentes.
- **Verificación de aceptación:** La evaluación es consultable en la historia y se distingue de la ejecución posterior; solo acceden actores autorizados.
- **Derivación propietaria:** 06 define datos; 08 acceso; 05 flujo; 10 captura.
- **Fuente:** BE-LEG-02 §§5, 11 y 15; DEC-013.

#### RF-064 — Definir un objetivo de entrenamiento vigente

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar un objetivo de entrenamiento vigente y relacionarlo con la evaluación y la planificación.
- **Verificación de aceptación:** El objetivo identifica período y responsable; los cambios conservan historial; el asesorado consulta el objetivo autorizado.
- **Derivación propietaria:** 06 define vigencia; 05 flujo; 10 presentación.
- **Fuente:** BE-LEG-02 §§7–9 y circuito de entrenamiento §11. Omisión detectada en v0.1.

#### RF-037 — Gestionar un catálogo propio de ejercicios

- **Actor:** Profesional de Entrenamiento o administrador autorizado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá mantener un catálogo propio de ejercicios y permitir carga manual para operar sin wger.
- **Verificación de aceptación:** Los ejercicios tienen procedencia y datos mínimos; el profesional puede planificar durante una caída externa; cambios del catálogo no reescriben sesiones ya prescriptas.
- **Derivación propietaria:** 06 estructura/versionado; 10 gestión; 07 almacenamiento.
- **Fuente:** BE-LEG-02 §13 y fallbacks §20.

#### RF-038 — Importar ejercicios desde wger

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Compromiso académico de integración
- **Obligación:** BE deberá consultar e importar ejercicios desde wger mediante un proceso controlado y trazable.
- **Verificación de aceptación:** Los datos se validan antes de incorporarse; la fuente queda identificada; la caída del proveedor habilita catálogo BE y carga manual.
- **Derivación propietaria:** 07 adaptador; 09 contrato; 06 normalización.
- **Fuente:** BE-LEG-02 §§10, 13 y 20; REV-002 RES-02.

#### RF-039 — Crear un plan de entrenamiento por bloques y sesiones

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir estructurar una planificación por períodos, bloques y sesiones antes de activarla.
- **Verificación de aceptación:** El borrador conserva orden, vigencia y objetivo; no se presenta como plan activo; puede retomarse y validarse.
- **Derivación propietaria:** 06 agregado y estados; 09 contratos; 10 editor; 05 flujo.
- **Fuente:** BE-LEG-02 §11.

#### RF-040 — Prescribir ejercicios, series y parámetros

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Dentro del plan, BE deberá permitir prescribir ejercicios y parámetros necesarios para que el asesorado sepa qué ejecutar.
- **Verificación de aceptación:** Cada sesión activa contiene información suficiente y ordenada; unidades y parámetros son interpretables; los cambios posteriores conservan la versión emitida.
- **Derivación propietaria:** 06 estructura/unidades; 09 contrato; 10 editor y Hoy.
- **Fuente:** BE-LEG-02 §11.

#### RF-041 — Validar, versionar y activar un plan de entrenamiento

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá impedir activar una planificación incompleta y conservar una versión vigente y reproducible al activarla.
- **Verificación de aceptación:** El asesorado consulta la versión activada; no existen vigencias contradictorias; una sustitución queda relacionada con la anterior; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes.
- **Derivación propietaria:** 06 estados/invariantes; 08 autorización; 09 contrato.
- **Fuente:** BE-LEG-02 §§11 y 15.

#### RF-042 — Consultar el entrenamiento del día en la APK

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** El asesorado deberá consultar desde Hoy la sesión planificada vigente y sus indicaciones.
- **Verificación de aceptación:** La pantalla distingue ausencia de sesión, sesión pendiente y ejecución registrada; no requiere rutas internas; solo muestra datos autorizados.
- **Derivación propietaria:** 10 Hoy; 09 read model; 08 acceso; 05 escenarios.
- **Fuente:** BE-LEG-02 §§11 y 15.

#### RF-043 — Registrar sesión y series ejecutadas

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar la ejecución real de una sesión, diferenciándola de la planificación.
- **Verificación de aceptación:** La ejecución conserva fecha, relación con la sesión planificada y datos ingresados; un reintento no duplica la sesión; el profesional autorizado la consulta.
- **Derivación propietaria:** 06 modelo de ejecución; 09 contrato; 10 captura; 11A concurrencia.
- **Fuente:** BE-LEG-02 §§9, 11 y 15.

#### RF-044 — Corregir una ejecución de forma trazable

- **Actor:** Asesorado o profesional autorizado según política
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir corregir un registro de ejecución sin ocultar el valor original ni su autoría.
- **Verificación de aceptación:** La corrección identifica motivo, actor y relación con el registro previo; los análisis usan la versión vigente sin perder el histórico.
- **Derivación propietaria:** 06 define corrección/versionado; 08 permisos; 05 escenarios.
- **Fuente:** Principios de trazabilidad de BE-LEG-02 §§9 y 15.

#### RF-045 — Analizar evidencia de entrenamiento para una revisión

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir comparar evaluación, objetivo, planificación, ejecución y evolución antes de decidir progresión o continuidad.
- **Verificación de aceptación:** El profesional identifica período y evidencia relevante, compara lo planificado con lo ejecutado y pasa al registro común de revisión de RF-056; una visualización aislada no cuenta como revisión.
- **Derivación propietaria:** DEC-043 aprobada provisionalmente; 05 flujo; 06 read model; 08 acceso; 10 experiencia.
- **Fuente:** BE-LEG-02 §§15–16; BE-LEG-03 §§2 y 13; Q-006.

#### RF-046 — Progresar, sustituir o cerrar el plan de entrenamiento

- **Actor:** Profesional de Entrenamiento
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Después de una revisión, BE deberá permitir mantener, progresar, reprogramar, sustituir o cerrar correctamente el plan o bloque.
- **Verificación de aceptación:** La acción se vincula con la revisión y la siguiente planificación; el asesorado ve la situación vigente; la historia anterior permanece; “progresar” e “iniciar un nuevo bloque” se registran como especializaciones de ajustar o sustituir según su efecto sobre la versión, sin crear una taxonomía paralela a DEC-043.
- **Derivación propietaria:** DEC-043 v0.4 fija la semántica común; 06 define taxonomía y transiciones; 05 escenarios; 08 efectos.
- **Fuente:** BE-LEG-02 §§15–16; Q-007.

### Antropometría transversal

#### RF-047 — Registrar una evaluación antropométrica autorizada

- **Actor:** Profesional con capacidad antropométrica
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir registrar mediciones antropométricas directas con protocolo, unidades, fecha, autor y contexto.
- **Verificación de aceptación:** Las mediciones quedan diferenciadas de cálculos; se valida la capacidad, vínculo y consentimiento; la evaluación integra la historia autorizada.
- **Derivación propietaria:** 06 modelo y unidades; 08 capacidad/acceso; 10 captura.
- **Fuente:** BE-LEG-02 §§6, 11 y 15; BE-LEG-03 §11.

#### RF-048 — Emitir cálculos antropométricos reproducibles

- **Actor:** Sistema BE y profesional responsable
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá calcular resultados derivados sin confundirlos con mediciones directas y conservando método, entradas y versión.
- **Verificación de aceptación:** Un resultado histórico puede reproducirse; el método y responsable son identificables; no se presenta como diagnóstico ni causalidad.
- **Derivación propietaria:** 06 fórmulas/datos; 08 límites; 10 visualización; 11A pruebas.
- **Fuente:** BE-LEG-02 §§9, 11 y 14.

#### RF-049 — Consultar evolución antropométrica

- **Actor:** Profesional autorizado o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir comparar evaluaciones antropométricas en el tiempo con período, unidad y procedencia visibles.
- **Verificación de aceptación:** La comparación usa mediciones compatibles o explicita diferencias; el acceso respeta alcance; no produce un score global de salud.
- **Derivación propietaria:** 06 compatibilidad; 08 acceso; 10 gráficos.
- **Fuente:** BE-LEG-02 §§11 y 15.

#### RF-050 — Corregir una medición antropométrica con trazabilidad

- **Actor:** Profesional autorizado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir corregir o anular una medición preservando el registro original y el motivo.
- **Verificación de aceptación:** La corrección identifica actor y fecha; los cálculos afectados quedan relacionados o recalculados según política; no existe sobrescritura silenciosa.
- **Derivación propietaria:** 06 correcciones y derivados; 08 autorización; 05 escenarios.
- **Fuente:** BE-LEG-02 §11.

#### RF-051 — Publicar y descubrir servicios antropométricos de forma limitada

- **Actor:** Profesional autorizado y asesorado
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá permitir publicar un servicio antropométrico y descubrirlo en lista y, cuando esté disponible, mapa, para consultar perfil y solicitar vínculo.
- **Verificación de aceptación:** La fuente de elegibilidad es BE; Google Maps solo representa ubicación; ante caída se mantiene lista y ubicación textual; no hay reservas, pagos, ranking ni reputación.
- **Derivación propietaria:** 06 datos de servicio; 08 visibilidad; 07 Maps; 09 contrato; 10 lista/mapa.
- **Fuente:** BE-LEG-02 §§10, 12–14 y 20; BE-LEG-03 §11.

### Dashboard, evolución, coordinación y negocio académico

#### RF-052 — Consultar la cartera operativa profesional

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá mostrar los asesorados y procesos propios con estado operativo suficiente para identificar qué requiere acción.
- **Verificación de aceptación:** La cartera excluye relaciones ajenas; distingue pendientes, activos y cerrados según política; permite llegar al perfil autorizado.
- **Derivación propietaria:** 06 define estado; 08 filtra acceso; 10 vista; 09 read model.
- **Fuente:** BE-LEG-02 §§9, 11 y 15.

#### RF-053 — Consultar un dashboard interdisciplinario autorizado

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá ofrecer una síntesis del proceso del asesorado que combine estado de Nutrición, Entrenamiento, Antropometría, vínculos, consentimientos, revisiones, decisiones y próxima acción.
- **Verificación de aceptación:** Cada dato conserva dominio y procedencia; el profesional solo ve contexto autorizado; no existe score global de salud; los faltantes se muestran como tales.
- **Derivación propietaria:** 06 read models; 08 visibilidad; 09 contrato; 10 jerarquía.
- **Fuente:** BE-LEG-02 §§9, 11 y 15; DEC-014.

#### RF-054 — Consultar una línea temporal integrada

- **Actor:** Profesional autorizado o asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá reconstruir cronológicamente evaluaciones, planes, ejecuciones, revisiones, decisiones, cambios de vínculo y consentimientos según permisos.
- **Verificación de aceptación:** Cada evento identifica fecha, dominio, autor y procedencia; la línea temporal no mezcla planificado con ejecutado; el acceso depende del actor.
- **Derivación propietaria:** 06 índice longitudinal; 08 visibilidad; 09/10 consulta.
- **Fuente:** BE-LEG-02 §§3, 9, 11 y 15.

#### RF-055 — Identificar revisiones pendientes

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá señalar procesos que requieren revisión por evidencia nueva, fecha acordada, ausencia de continuidad o condición definida.
- **Verificación de aceptación:** La señal explica por qué requiere atención y no se presenta como alerta clínica; puede abrir la evidencia correspondiente.
- **Derivación propietaria:** 06 reglas de pendiente; 10 lenguaje; 09 read model.
- **Fuente:** BE-LEG-02 §§9, 11 y 15.

#### RF-056 — Registrar revisión, decisión y próxima acción

- **Actor:** Profesional autorizado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá registrar de forma trazable una revisión válida y su próxima acción dentro del dominio correspondiente.
- **Verificación de aceptación:** El registro cumple DEC-043 durante su vigencia provisional; identifica evidencia, dominio, período, autor, fundamento y resultado; alimenta continuidad y TVCC-30.
- **Derivación propietaria:** 06 define entidad/estados; 05 flujo; 08 autoría; 10 captura.
- **Fuente:** BE-LEG-02 §§15–16; BE-LEG-03 §§2 y 13; Q-006.

#### RF-057 — Registrar notas de coordinación autorizadas

- **Actor:** Profesional
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir documentar contexto de coordinación sin transferir responsabilidad ni facultades entre especialidades.
- **Verificación de aceptación:** La nota conserva autor, destinatarios/alcance y dominio; no modifica planes ajenos; solo la consultan actores autorizados.
- **Derivación propietaria:** 06 modelo; 08 visibilidad; 05 escenarios; 10 experiencia.
- **Fuente:** BE-LEG-02 §§3, 5, 9 y 11.

#### RF-058 — Obtener TVCC-30 de manera reproducible

- **Actor:** Sistema BE o responsable de validación
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá producir los datos necesarios para calcular TVCC-30 con vínculos elegibles, ciclo cerrado y siguiente acción válida en el período.
- **Verificación de aceptación:** El numerador y denominador pueden auditarse; un ciclo cerrado requiere una revisión válida de RF-056 y una próxima acción semánticamente admitida por DEC-043; se excluyen cuentas demo y vínculos no elegibles; la ventana usa la zona aprobada; continuidad no se confunde con retención, adherencia o resultado corporal.
- **Derivación propietaria:** 04 fija estos elementos mínimos; 06 define eventos, elegibilidad fina y versionado; 09 consulta/exportación si aplica; 11A valida cálculo; 12 evidencia.
- **Fuente:** BE-LEG-02 §16; DEC-016.

#### RF-065 — Consultar progreso longitudinal en la APK

- **Actor:** Asesorado
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** La APK deberá permitir al asesorado consultar una síntesis comprensible de su evolución autorizada en Nutrición, Entrenamiento y Antropometría.
- **Verificación de aceptación:** La síntesis distingue dominios, períodos y límites; no atribuye causalidad ni emite diagnóstico; permite acceder a datos de origen relevantes.
- **Derivación propietaria:** 06 datos; 08 visibilidad; 09 read models; 10 diseño.
- **Fuente:** BE-LEG-02 §§6, 9, 11 y 15. Omisión detectada en v0.1.

#### RF-066 — Representar habilitaciones y capacidad sin cobro real

- **Actor:** Administrador y sistema BE
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** El MVP académico deberá poder configurar o simular habilitaciones y banda de capacidad profesional sin implementar cobros, facturación ni renovación.
- **Verificación de aceptación:** Un asesorado cuenta una vez por profesional; alcanzar el límite no elimina datos ni interrumpe procesos vigentes, pero impide activar nuevos procesos según la regla aprobada; cambiar paquete no altera permisos de datos.
- **Derivación propietaria:** 06 modela la configuración; 08 separa autorización; 10 consola mínima; pagos quedan fuera.
- **Fuente:** BE-LEG-03 §§3, 8–10; REV-003 capacidad y plano académico.

### Integraciones y comunicaciones condicionadas

#### RF-059 — Continuar el núcleo ante fallas de terceros

- **Actor:** Sistema BE
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Las funciones núcleo deberán continuar mediante fuente propia o carga manual cuando un proveedor externo no esté disponible.
- **Verificación de aceptación:** La caída de Google, Open Food Facts, wger, Maps o Push no impide crear, consultar, ejecutar o revisar un plan; el usuario conoce el estado y la alternativa.
- **Derivación propietaria:** 07 estrategia de resiliencia; 09 errores; 10 mensajes; 11A pruebas de caída.
- **Fuente:** BE-LEG-02 §§13 y 20.

#### RF-060 — Consultar la procedencia de datos externos

- **Actor:** Profesional, asesorado o administrador según autorización
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá permitir identificar proveedor, fecha y referencia suficiente de un dato externo en los contextos donde se utiliza.
- **Verificación de aceptación:** La procedencia es visible en operaciones relevantes; una importación no se presenta como dato verificado por BE; el histórico no pierde su fuente.
- **Derivación propietaria:** 06 modelo; 08 licencias/privacidad; 09 contratos.
- **Fuente:** BE-LEG-02 §§9, 13 y 15.

#### RF-061 — Consultar novedades internas

- **Actor:** Profesional o asesorado
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** BE deberá disponer de un centro interno donde mostrar novedades operativas relevantes para el actor.
- **Verificación de aceptación:** Las novedades pueden consultarse aunque Push no esté disponible; respetan el alcance del actor; no se presentan como alertas clínicas.
- **Derivación propietaria:** 06 modelo; 08 visibilidad; 09 contrato; 10 experiencia.
- **Fuente:** BE-LEG-02 §§11, 13 y 20.

#### RF-062 — Recibir notificaciones push

- **Actor:** Asesorado o profesional
- **Prioridad:** P2 — Condicionado / recortable
- **Obligación:** BE podrá enviar notificaciones push para novedades seleccionadas, sin convertirlas en única vía de información.
- **Verificación de aceptación:** El contenido sensible se minimiza; el usuario conserva acceso desde el centro interno; una falla de Expo Push no bloquea ninguna operación núcleo.
- **Derivación propietaria:** 08 privacidad; 07 proveedor; 09 contrato; 10 preferencias.
- **Fuente:** BE-LEG-02 §§10, 13 y 20.

## 7. Requisitos no funcionales (38)

### Seguridad

#### RNF-SEC-001 — Autorización consistente para recursos protegidos

- **Componente:** Backend y superficies cliente
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Toda lectura o escritura protegida deberá someterse a la política contextual vigente y producir el mismo resultado con independencia del canal usado.
- **Medición o evidencia:** Pruebas positivas, ajenas, revocadas, suspendidas y con alcance insuficiente; cero acceso permitido por ocultamiento de UI solamente.
- **Derivación propietaria:** 08 define controles; 06 estados; 09 respuestas; 11A amenazas/pruebas.
- **Fuente:** BE-LEG-02 §15; DEC-006.

#### RNF-SEC-002 — Protección de credenciales, sesiones y secretos

- **Componente:** Identidad, backend e infraestructura
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Credenciales, sesiones y secretos deberán tratarse de forma que una filtración de repositorio, logs o cliente no exponga valores reutilizables.
- **Medición o evidencia:** Revisión de configuración y logs; secretos fuera de Git; credenciales no almacenadas en claro; sesiones revocables.
- **Derivación propietaria:** 08 fija controles; 07 almacenamiento/configuración; 11A verificación.
- **Fuente:** BE-LEG-02 §15; DEC-008 y DEC-009.

#### RNF-SEC-003 — Resistencia a abuso de autenticación y recuperación

- **Componente:** Identidad
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los recorridos de acceso y recuperación deberán limitar abuso automatizado, enumeración y reutilización de pruebas temporales.
- **Medición o evidencia:** Casos de intentos repetidos, respuestas neutras y reutilización fallida; umbrales y mecanismos se definen en 08/07.
- **Derivación propietaria:** 08 política; 07 soporte técnico; 11A pruebas.
- **Fuente:** Derivado de operación segura del MVP y marco OWASP adoptado en BE-LEG-00 §14.

#### RNF-SEC-004 — Separación de ambientes

- **Componente:** Infraestructura y datos
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Development, test y production deberán estar separados, con configuración y datos acordes a cada propósito.
- **Medición o evidencia:** Evidencia de variables y bases diferenciadas; pruebas no apuntan a producción; despliegue identifica el ambiente.
- **Derivación propietaria:** 07 diseña ambientes; 08 datos; 11A ejecución.
- **Fuente:** DEC-008.

#### RNF-SEC-005 — Auditoría de operaciones sensibles

- **Componente:** Identidad, autorización y dominios
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Accesos y cambios sensibles deberán dejar evidencia suficiente para atribuir actor, momento, operación, sujeto y resultado.
- **Medición o evidencia:** Muestreo de verificación, suspensión, consentimiento, revocación, acceso, activación, revisión y corrección; datos sensibles minimizados.
- **Derivación propietaria:** 08 define eventos/retención; 06 vínculos; 07 almacenamiento/observabilidad.
- **Fuente:** BE-LEG-02 §15; DEC-004, DEC-006 y DEC-011.

#### RNF-SEC-006 — Mínimo privilegio y segregación por dominio

- **Componente:** Autorización
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Cada actor deberá recibir solo capacidades y contexto necesarios para su especialidad, vínculo, finalidad y estado.
- **Medición o evidencia:** Matrices y pruebas demuestran que Nutrición no obtiene facultades de Entrenamiento ni viceversa salvo autorización explícita; administrador no posee acceso general a contenido de salud por defecto.
- **Derivación propietaria:** 08 matriz; 06 dominio; 11A pruebas negativas.
- **Fuente:** BE-LEG-02 §§3, 6, 9 y 15.

### Privacidad y gobernanza de datos

#### RNF-PRI-001 — Minimización y pertinencia

- **Componente:** Producto, datos e interfaces
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE solo deberá solicitar, mostrar y conservar datos que apoyen una decisión, obligación o experiencia aprobada.
- **Medición o evidencia:** Cada campo relevante puede responder a la regla de pertinencia del Documento 02; formularios y respuestas evitan datos innecesarios.
- **Derivación propietaria:** 08 política; 06 catálogo; 10 formularios; 12 trazabilidad.
- **Fuente:** BE-LEG-02 §9; DEC-011.

#### RNF-PRI-002 — Revocación efectiva y verificable

- **Componente:** Autorización y auditoría
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Una revocación deberá cortar accesos futuros del alcance y ser verificable sin borrar silenciosamente evidencia histórica.
- **Medición o evidencia:** Prueba antes/después de revocar; registro de actor y fecha; retención y lectura residual quedan definidos en 08.
- **Derivación propietaria:** 08 resuelve Q-003/Q-004/Q-005; 06 estados; 11A pruebas.
- **Fuente:** BE-LEG-02 §§11 y 15; DEC-006.

#### RNF-PRI-003 — Visibilidad adecuada a cada superficie

- **Componente:** Website, APK y comunicaciones
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Cada superficie deberá exponer solo la información necesaria para el actor y contexto, evitando datos administrativos o sensibles no requeridos.
- **Medición o evidencia:** Comparación de respuestas y pantallas por rol; notificaciones sin detalle sensible innecesario; recursos ajenos no visibles.
- **Derivación propietaria:** 08 reglas; 09 read models; 10 diseño.
- **Fuente:** BE-LEG-02 §§6, 9 y 15.

### Rendimiento y resiliencia

#### RNF-PERF-001 — Rendimiento de operaciones núcleo

- **Componente:** Backend y base de datos
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Las operaciones núcleo deberán responder dentro de un presupuesto medible bajo un perfil de carga piloto documentado.
- **Medición o evidencia:** Objetivo candidato: p95 ≤ 1 s en lecturas internas y p95 ≤ 1,5 s en escrituras núcleo, excluyendo latencia externa identificada; 07/11A deberán confirmar o justificar el ajuste antes de baseline.
- **Derivación propietaria:** 07 define perfil y técnica; 11A prueba; 09 identifica operaciones.
- **Fuente:** BE-LEG-02 §15 y riesgos §20.

#### RNF-PERF-002 — Respuesta percibida de Website y APK

- **Componente:** Website y APK
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** Las superficies deberán mostrar estado visible sin bloqueo prolongado y completar el contenido principal del recorrido núcleo dentro de un presupuesto definido.
- **Medición o evidencia:** Objetivo candidato: estado inicial ≤ 1 s y contenido principal ≤ 3 s en dispositivo/red de prueba documentados; errores y vacíos visibles.
- **Derivación propietaria:** 10 define patrones; 07 optimización; 11A medición.
- **Fuente:** BE-LEG-02 §§11 y 15.

#### RNF-PERF-003 — Tiempo acotado y fallback de integraciones

- **Componente:** Integraciones externas
- **Prioridad:** P0 — Compromiso académico de integración
- **Obligación:** Una llamada externa no deberá bloquear indefinidamente una operación interactiva y deberá terminar en respuesta útil o fallback.
- **Medición o evidencia:** Pruebas de demora, cuota y caída; presupuesto y reintentos definidos en 07; la operación núcleo concluye sin éxito falso.
- **Derivación propietaria:** 07 selecciona mecanismo; 09 contrato; 11A prueba.
- **Fuente:** BE-LEG-02 §13.

#### RNF-AVA-001 — Disponibilidad durante validación y defensa

- **Componente:** Solución desplegada
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los recorridos núcleo deberán estar operativos durante las ventanas programadas de validación y defensa sin depender de terceros no esenciales.
- **Medición o evidencia:** Checklist previo, monitoreo básico, versión congelada y contingencia demostrada durante las ventanas programadas.
- **Derivación propietaria:** 07 despliegue/contingencia; 11A plan; 11B evidencia.
- **Fuente:** BE-LEG-02 §§15 y 20; DEC-009.

#### RNF-AVA-002 — Persistencia después de reinicio

- **Componente:** Backend y datos
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Un reinicio de servicios no deberá perder operaciones confirmadas ni exigir reconstrucción manual del estado ordinario.
- **Medición o evidencia:** Prueba de reinicio y reconsulta de plan, ejecución y revisión; sin duplicados ni pérdida de datos confirmados.
- **Derivación propietaria:** 06 persistencia; 07 despliegue; 11A prueba.
- **Fuente:** BE-LEG-02 §15.

#### RNF-REC-001 — Copia y restauración verificable

- **Componente:** Datos e infraestructura
- **Prioridad:** P1 — Alta prioridad condicionada al uso de datos autorizados
- **Obligación:** Antes de utilizar datos autorizados en piloto o defensa deberá existir un mecanismo de copia y una restauración probada en ambiente seguro. Este requisito solo podrá diferirse si también se difiere el uso de datos autorizados y se trabaja exclusivamente con datos sintéticos o anonimizados conforme a 08 y 11A.
- **Medición o evidencia:** Evidencia de restauración de entidades núcleo antes del primer uso de datos autorizados; RPO/RTO y herramienta quedan definidos en 07/11A, no en 04.
- **Derivación propietaria:** 07 política técnica; 08 alcance de datos; 11A procedimiento.
- **Fuente:** DEC-009; riesgos de BE-LEG-02 §20.

#### RNF-REC-002 — Idempotencia de operaciones sensibles

- **Componente:** Backend y datos
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Reintentos o concurrencia no deberán duplicar invitaciones, consentimientos, activaciones, ejecuciones, adherencias o decisiones.
- **Medición o evidencia:** Pruebas de repetición y concurrencia muestran una sola operación efectiva o conflicto recuperable; mecanismo exacto en 06/09.
- **Derivación propietaria:** 06 invariantes; 09 contratos; 11A prueba.
- **Fuente:** Q-000; BE-LEG-02 §15.

#### RNF-REL-001 — Ausencia de éxito falso y recuperación comprensible

- **Componente:** Todas las superficies
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE no deberá presentar una operación como exitosa sin confirmación del estado persistido y deberá ofrecer una salida comprensible ante fallas recuperables.
- **Medición o evidencia:** Pruebas de timeout posterior a escritura, conflicto, caída externa y validación; el actor puede reconsultar el estado real; mensajes no exponen detalles sensibles.
- **Derivación propietaria:** 09 semántica de errores; 10 mensajes; 11A prueba.
- **Fuente:** Criterios de éxito de BE-LEG-02 §15; reemplaza RF-063 v0.1.

### Accesibilidad, lenguaje y portabilidad

#### RNF-ACC-001 — Accesibilidad en recorridos núcleo

- **Componente:** Website y APK
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los recorridos núcleo deberán satisfacer un conjunto declarado de criterios aplicables de accesibilidad, tomando WCAG 2.2 AA como marco de referencia, sin afirmar certificación integral del producto.
- **Medición o evidencia:** Auditoría automática y revisión manual de acceso, vínculo, Hoy, registro y revisión; navegación por teclado cuando aplique, foco visible, etiquetas, contraste suficiente, estados no dependientes solo del color, objetivos táctiles adecuados y cero defectos críticos de accesibilidad abiertos.
- **Derivación propietaria:** 10 especifica componentes; 11A matriz de revisión.
- **Fuente:** BE-LEG-00 §14; BE-LEG-02 §15.

#### RNF-ACC-002 — Lenguaje claro, no diagnóstico y no causal

- **Componente:** Contenido y UI
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los textos deberán ser comprensibles, coherentes con el glosario y evitar diagnóstico, causalidad no sustentada o urgencia clínica.
- **Medición o evidencia:** Revisión de contenido de recorridos núcleo; mensajes indican acción y límites; se usa asesorado, revisión y cambio relevante.
- **Derivación propietaria:** 10 guía de contenido; 08 límites regulatorios; 06 glosario.
- **Fuente:** BE-LEG-02 §§3, 14 y 15.

#### RNF-ACC-003 — Adaptación a las superficies objetivo

- **Componente:** Website y APK
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** El Website profesional y administrativo y la APK Android deberán ser operables en la matriz de dispositivos definida sin pérdida de acciones esenciales.
- **Medición o evidencia:** Pruebas en viewports/dispositivos de 10/11A; sin contenido crítico cortado; la APK no replica sin adaptación el expediente profesional.
- **Derivación propietaria:** 10 define matriz y diseño; 11A verifica.
- **Fuente:** BE-LEG-02 §§5, 11 y 15.

#### RNF-PORT-001 — APK instalable y demostrable en Android físico

- **Componente:** Aplicación móvil
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** La aplicación del asesorado deberá generar un artefacto instalable y operar los recorridos núcleo en al menos un dispositivo Android físico objetivo.
- **Medición o evidencia:** Build reproducible, instalación, autenticación, lectura y escritura real demostradas; versión de defensa identificada.
- **Derivación propietaria:** 07 pipeline/build; 10 experiencia; 11A/11B evidencia.
- **Fuente:** BE-LEG-02 §§5, 15 y 19.

### Mantenibilidad, observabilidad e interoperabilidad

#### RNF-MAN-001 — Separación de responsabilidades y fuente única de reglas

- **Componente:** Código y solución
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Las reglas críticas deberán tener un propietario identificable y comportarse igual para Website, APK e integraciones.
- **Medición o evidencia:** Revisión arquitectónica no encuentra autorización o ciclo de vida decidido solo en UI; duplicaciones justificadas; pruebas ejercitan la regla central.
- **Derivación propietaria:** 07 define módulos; 06 dominio; 08 políticas.
- **Fuente:** BE-LEG-00 cadena de trazabilidad; política de transición de BE-LEG-02 §19.

#### RNF-MAN-002 — Contratos compatibles y verificables

- **Componente:** API, Website y APK
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Las interfaces entre componentes deberán permitir detectar cambios incompatibles antes de la demostración o despliegue.
- **Medición o evidencia:** Clientes compilan contra contratos; pruebas de contrato detectan ruptura; estrategia de compatibilidad y formato exacto se definen en 09.
- **Derivación propietaria:** 09 propietario; 07 integración; 11A pruebas.
- **Fuente:** BE-LEG-02 §15.

#### RNF-MAN-003 — Evolución reproducible del esquema y los datos

- **Componente:** Datos e infraestructura
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los cambios autorizados sobre persistencia deberán poder reproducirse y transicionar datos sin pérdidas no declaradas.
- **Medición o evidencia:** Prueba desde ambiente limpio y sobre copia representativa; estrategia concreta y migraciones pertenecen a 06/07/11A; no se implementa antes de G3.
- **Derivación propietaria:** 06 modelo; 07 despliegue; 11A validación.
- **Fuente:** BE-LEG-00 §§8–9 y 18; DEC-008 y DEC-009.

#### RNF-MAN-004 — Testabilidad proporcional al riesgo

- **Componente:** Producto, código y pruebas
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los comportamientos P0 y sus invariantes deberán poder verificarse de forma independiente y repetible, incluyendo fallas relevantes y autorizaciones negativas.
- **Medición o evidencia:** Cada P0 aporta criterios observables y trazará a un diseño de prueba; los niveles, datos, herramientas y cobertura exacta pertenecen a 11A; un mock no se presenta como evidencia de integración.
- **Derivación propietaria:** 11A diseña la estrategia; 12 enlaza; 11B registra resultados.
- **Fuente:** BE-LEG-02 §§10 y 15; núcleo no recortable de pruebas.

#### RNF-OBS-001 — Diagnóstico sin exposición de datos sensibles

- **Componente:** Backend e infraestructura
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** La solución deberá permitir rastrear fallas e incidentes sin registrar secretos o contenido de salud innecesario.
- **Medición o evidencia:** Una solicitud fallida puede correlacionarse; revisión de logs no encuentra credenciales ni cuerpos sensibles; formato/retención en 07/08.
- **Derivación propietaria:** 07 observabilidad; 08 minimización; 11A revisión.
- **Fuente:** DEC-009 y DEC-011.

#### RNF-OBS-002 — Salud técnica mínima del despliegue

- **Componente:** Infraestructura
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** El despliegue deberá exponer evidencia suficiente para distinguir servicio operativo de dependencia no disponible.
- **Medición o evidencia:** Una caída de base o servicio esencial es detectable; la señal no expone secretos; mecanismo exacto en 07.
- **Derivación propietaria:** 07 diseño; 11A/11B evidencia.
- **Fuente:** BE-LEG-02 §15; DEC-009.

#### RNF-OBS-003 — Trazabilidad bidireccional

- **Componente:** Documentación, código y pruebas
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Cada requisito aprobado deberá vincularse con decisiones, casos de uso, diseño y pruebas; cada evidencia deberá indicar qué obligación demuestra.
- **Medición o evidencia:** IDs únicos y referencias válidas; una muestra P0 se recorre en ambos sentidos; cambios sustantivos actualizan la trazabilidad.
- **Derivación propietaria:** 12 es propietario; 11A/11B aportan pruebas; tooling según 00.
- **Fuente:** BE-LEG-00 §16.

#### RNF-INT-001 — Sustituibilidad de proveedores externos

- **Componente:** Arquitectura e integraciones
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** Las capacidades externas deberán poder reemplazarse o desactivarse sin reescribir los circuitos de producto.
- **Medición o evidencia:** Prueba con proveedor simulado o fallback; el dominio no depende de decisiones del proveedor; patrón concreto en 07.
- **Derivación propietaria:** 07 arquitectura; 09 contratos; 11A prueba.
- **Fuente:** BE-LEG-02 §13.

#### RNF-INT-002 — Consistencia de fechas, períodos, unidades y zona horaria

- **Componente:** Todos los dominios
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá interpretar fechas, ventanas y unidades de forma consistente y mostrar el período usado en cálculos y comparaciones.
- **Medición o evidencia:** Pruebas de límites de día y período; zona del MVP `America/Argentina/Buenos_Aires`; unidades y conversiones conservan fuente.
- **Derivación propietaria:** 06 datos; 09 serialización; 10 presentación; 11A prueba.
- **Fuente:** DEC-007; BE-LEG-02 §§15–16.

#### RNF-INT-003 — Validación y normalización de importaciones

- **Componente:** Catálogos e integraciones
- **Prioridad:** P0 — Compromiso académico de integración
- **Obligación:** Los datos externos deberán validarse y normalizarse antes de incorporarse a catálogos BE.
- **Medición o evidencia:** Campos insuficientes se rechazan o completan explícitamente; se conserva procedencia; no se copian campos desconocidos como hechos propios.
- **Derivación propietaria:** 06 modelo; 08 licencias/procedencia; 09 contrato.
- **Fuente:** BE-LEG-02 §§9 y 13.

### Escalabilidad e integridad de datos

#### RNF-SCA-001 — Escala suficiente para validación y segmento inicial

- **Componente:** Solución completa
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** La solución deberá soportar el perfil de uso definido para piloto y demostración sin rediseño inmediato ni degradación inaceptable.
- **Medición o evidencia:** Dataset y concurrencia se documentan en 07/11A; las operaciones núcleo mantienen RNF-PERF-001; mecanismos como índices o paginación pertenecen a 07/06.
- **Derivación propietaria:** 07 dimensionamiento; 11A carga.
- **Fuente:** BE-LEG-02 §§6, 15 y 20; BE-LEG-03 §5.

#### RNF-SCA-002 — Configuración desacoplada de habilitaciones y capacidad

- **Componente:** Producto y backend
- **Prioridad:** P1 — Alta prioridad
- **Obligación:** Habilitaciones y bandas deberán poder configurarse sin convertirse en roles, especialidades o permisos de datos.
- **Medición o evidencia:** Cambiar banda no cambia especialidad ni consentimiento; el conteo sigue la regla de 03; el MVP puede simular estados sin cobro real.
- **Derivación propietaria:** 06 modela; 08 autoriza; 07 configura.
- **Fuente:** BE-LEG-03 §§3, 4, 8 y 9; REV-003.

#### RNF-DAT-001 — Integridad de estados críticos

- **Componente:** Dominio y persistencia
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** BE deberá impedir combinaciones que contradigan las reglas aprobadas de identidad, vínculo, consentimiento, plan, ejecución, revisión y continuidad.
- **Medición o evidencia:** Pruebas de invariantes y fallas parciales; la operación queda completa o sin efectos parciales; mecanismos se definen en 06.
- **Derivación propietaria:** 06 propietario; 11A prueba.
- **Fuente:** BE-LEG-02 §15; Q-000.

#### RNF-DAT-002 — Procedencia obligatoria

- **Componente:** Todos los dominios
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los datos relevantes deberán conservar quién o qué los originó, cuándo, bajo qué contexto y con qué método cuando corresponda.
- **Medición o evidencia:** Muestreo de evaluaciones, importaciones, cálculos, ejecuciones y decisiones; un valor sin procedencia se trata como incompleto.
- **Derivación propietaria:** 06 modelo; 08 auditoría; 10 exposición.
- **Fuente:** BE-LEG-02 §§3 y 9.

#### RNF-DAT-003 — Versionado y ausencia de sobrescritura silenciosa

- **Componente:** Planes, mediciones, revisiones y decisiones
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Los registros emitidos o utilizados para decidir no deberán cambiar retroactivamente sin relación explícita con una corrección o nueva versión.
- **Medición o evidencia:** Pruebas de edición posterior; historia reconstruible; la versión vigente y la anterior son distinguibles.
- **Derivación propietaria:** 06 versionado; 08 autoría; 09 contratos.
- **Fuente:** BE-LEG-02 §§9, 11 y 15.

#### RNF-DAT-004 — Validación de datos y errores accionables

- **Componente:** Backend y superficies
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Entradas inválidas deberán rechazarse antes de producir estados inconsistentes y comunicar al actor qué puede corregir sin revelar información sensible.
- **Medición o evidencia:** Casos límite por dominio; persistencia sin combinaciones prohibidas; formato exacto de error pertenece a 09 y presentación a 10.
- **Derivación propietaria:** 06 reglas; 09 errores; 10 mensajes; 11A pruebas.
- **Fuente:** BE-LEG-02 §15.

#### RNF-DAT-005 — Reproducibilidad temporal y analítica

- **Componente:** Analítica y reportes
- **Prioridad:** P0 — Núcleo no recortable
- **Obligación:** Todo cálculo longitudinal deberá declarar período, zona, datos de entrada y regla suficiente para reproducir el resultado.
- **Medición o evidencia:** Pruebas de medianoche y límites; mismo conjunto produce mismo resultado; no se infiere causalidad; TVCC-30 auditable.
- **Derivación propietaria:** 06 definición; 09 salida; 11A prueba.
- **Fuente:** BE-LEG-02 §§3, 15 y 16; DEC-007 y DEC-016.

## 8. Reglas transversales de aceptación

1. Un requisito P0 no se considera cumplido por existir solo en backend, solo en UI o solo en documentación.
2. Cada escritura P0 deberá demostrar autorización, persistencia, resultado observable, manejo de reintentos y trazabilidad.
3. Cada lectura protegida deberá incluir al menos un caso autorizado y casos de actor ajeno, revocado o suspendido.
4. Los circuitos de Nutrición y Entrenamiento deberán demostrarse de extremo a extremo entre Website, APK, backend y PostgreSQL persistente.
5. La Antropometría deberá distinguir mediciones directas, resultados derivados y correcciones.
6. Open Food Facts y wger deberán demostrar importación, procedencia, caída y fallback.
7. Ninguna métrica o visualización se presentará como causal, diagnóstica o clínica.
8. Una función del asesorado no se considera completa si no es accesible desde la APK mediante el recorrido previsto.
9. La presentación final requiere cero defectos críticos y cero defectos altos abiertos en los recorridos principales.
10. La estrategia y cobertura de pruebas se fijarán en 11A; 04 exige que cada requisito sea verificable, no define la suite.
11. Un cálculo profesional P0 no se considera completo si no conserva método/versión, inputs/procedencia y separación entre cálculo de apoyo y decisión profesional; ningún resultado puede actualizar autónomamente requerimiento, objetivo, prescripción o plan.
12. Una solicitud profesional de información P0 no se considera completa si no explicita finalidad/alcance, conserva procedencia `self-reported`, respeta autorización vigente y evita convertir la solicitud en consentimiento o acceso adicional.

### 8.1 Condiciones técnicas de aceptación final

- Website profesional y administrativo desplegado;
- backend desplegado con PostgreSQL persistente;
- APK instalable en un dispositivo Android físico;
- configuración separada por ambiente;
- integraciones externas encapsuladas y con fallback;
- datos sintéticos, anonimizados o autorizados en bases utilizadas para validación;
- ausencia de datos codificados como fuente funcional principal.

### 8.2 Condiciones de validación

La demostración funcional deberá cubrir Nutrición y Entrenamiento con un nutricionista y un entrenador, o una persona de doble especialidad, y al menos un asesorado adulto. La validación exploratoria de negocio conserva el objetivo de 8 profesionales y 4 asesorados y el mínimo defendible de 5 profesionales, 2 asesorados y un caso interdisciplinario o de doble especialidad. Los resultados se reportarán como exploratorios, con conteos y limitaciones, sin generalización estadística.

Dirección confirma disponibilidad de acceso a participantes potenciales. El reclutamiento comenzará por clientes, conocidos, asesorados y profesionales accesibles en AMBA. La disponibilidad declarada no equivale a participación confirmada: cada sesión deberá registrar convocatoria, aceptación y consentimiento aplicable conforme a 08 y 11A.

## 9. Contraste AS-IS anclado

El contraste se ancla al HEAD documental `13224caa93b9c6cc8cc748f1035b385d7c5bab32`. No sustituye una auditoría integral ni autoriza cambios.

| Capacidad | Evidencia disponible en el SHA | Evaluación TO-BE | Acción documental |
|---|---|---|---|
| Identidad local | existen autenticación, roles y contexto de actor | PARCIAL | preservar lo conforme; contrastar recuperación, sesiones y aislamiento |
| Google Identity | no existe evidencia de integración canónica | AUSENTE | diseñar como P1 con fallback local |
| Alta/verificación/ADMIN | el modelo actual no demuestra el recorrido administrativo completo | PARCIAL / INSUFICIENTE | aplicar DEC-042 provisional y diseñar el recorrido en 05/06/08/10 |
| Vínculo y consentimiento | evidencia previa muestra vínculo activo y consentimiento no plenamente gobernante | CONTRADICE TO-BE | migrar a aceptación explícita y gate de autorización después de G3/G4 |
| Nutrición | borrador, activación, snapshot, Hoy y adherencia poseen avance real | PARCIAL AVANZADO | preservar lo conforme; completar evaluación/objetivo/revisión/continuidad/revocación/E2E |
| Entrenamiento | backend y planificación parcial sin circuito demostrado en APK | PARCIAL DESCONECTADO | diseñar y cerrar el circuito sin desplazar la recuperación nutricional |
| Antropometría | capacidades parciales, sin contraste canónico completo de procedencia, habilitación y corrección | PARCIAL | alinear con RF-067 y RF-047 a RF-051 |
| Dashboard interdisciplinario | no existe evidencia de circuito completo autorizado | PARCIAL / AUSENTE | derivar read models a 06/08/09 antes de UI |
| APK Android | el repositorio contiene Website Next.js; no se evidenció artefacto mobile en `mobile/package.json` | AUSENTE | tratar RNF-PORT-001 como riesgo temprano |
| Integraciones académicas | Open Food Facts y wger no están demostradas de extremo a extremo | PENDIENTE | implementar luego de diseño con catálogo propio y fallback |

## 10. Preguntas y dependencias abiertas

| ID o tema | Estado | Documento/gate límite | Efecto |
|---|---|---|---|
| Q-002 — alta profesional | RESUELTA PROVISIONALMENTE mediante DEC-042 | G4 validación | confirmar o revisar con usuarios antes de G4 |
| Q-003 — alcance del consentimiento | ABIERTA | 08 / G3 | condiciona RF-020 a RF-022 |
| Q-004 — retención tras revocación | ABIERTA | 08 / G3 | condiciona privacidad y acceso histórico |
| Q-005 — lectura tras finalizar vínculo | ABIERTA | 06/08 / G3 | condiciona RF-024 y consultas históricas |
| Q-006 — revisión profesional | RESUELTA PROVISIONALMENTE mediante DEC-043 | G4 validación | confirmar o revisar con usuarios antes de G4 |
| Q-007 — cierre del seguimiento | ABIERTA | 06 / G3 | condiciona RF-035 y RF-046 |
| Q-008 — plataforma de despliegue | ABIERTA | 07 / G4 | condiciona mecanismos de RNF |
| Q-FECHA-001 | RESUELTA PARA PLANIFICACIÓN | seguimiento hasta entrega | fecha objetivo adoptada: 27 de agosto de 2026 |
| Q-API-001 | RESUELTA PROVISIONALMENTE POR DIRECCIÓN | revisar si el tutor comunica otro mínimo | mínimo adoptado: 2 APIs externas; Open Food Facts y wger satisfacen el compromiso |
| Q-VALID-001 | RESUELTA PARA PLANIFICACIÓN | ejecución desde G2 y validación antes de G4 | dirección confirma acceso a clientes, conocidos, profesionales y asesorados adultos |
| Plan de reclutamiento | DISPONIBLE — `PLAN_RECLUTAMIENTO_G2_v0.1.md` | G2 | estrategia inicial aprobada para red directa y profesionales accesibles en AMBA |
| Documento 05 | SIGUIENTE ARTEFACTO | G2 | orden aprobado: alta → vínculo → consentimiento → nutrición → revisión → entrenamiento → antropometría → dashboard |

## 11. Trazabilidad inicial

La trazabilidad detallada se incorporará en YAML durante la preparación de la baseline y su propagación hacia 05, 11A y 12. Esta versión evita referencias a IDs no verificables en el canon y utiliza rutas/secciones canónicas como fuente. No se reutiliza `DEC-028`, `OBJ-###` ni `RSK-###` del v0.1 hasta que existan en los esquemas y registros oficiales.

La revisión independiente `IRA-04-2` examinó por error el borrador v0.1. Sus hallazgos se conservaron como insumo y se resolvieron en `MATRIZ_RESOLUCION_IRA-04-2_v0.1.md`, diferenciando hallazgos ya resueltos, aceptados, aceptados parcialmente y rechazados por no aplicar al candidato vigente. La contrarrevisión delta `IRA-04-3` examinó efectivamente la v0.4 y concluyó `APTO CON CORRECCIONES MENORES`. El registro `DELTA_CONSOLIDADO_BE_LEG_04_v0.1_a_v0.4.1.md` documenta la evolución completa y evita depender de una versión intermedia no publicada.

### 11.1 Control de cambio transversal — 2026-09-06

Posteriormente a la aprobación/canonización de v0.4.1, Dirección ratificó mediante `ACTA-DIR-021` la Auditoría de Impacto Transversal v0.2.1 (`454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`) y autorizó una reapertura **acotada** de 04.

Impacto aprobado para redacción:

```text
CAP-MET
→ nuevo RF transversal

CAP-DAT
→ nuevo RF transversal

ANT-DRAFT
→ SIN CAMBIO EN 04

ANT-VOID / RF-050
→ SIN CAMBIO EN 04
→ la obligación “corregir o anular” ya existe
```

La reapertura no modifica RNF, prioridades anteriores, RF existentes ni el significado de `RF-050`. Los IDs `RF-070` y `RF-071` se incorporan como candidatos de esta versión y quedan sujetos a contrarrevisión y aprobación de Dirección.

## 12. Resultado de REV-005 — cerrada por dirección

REV-005 verificó la evolución del candidato hasta v0.4 y el tratamiento de la segunda voz externa; el delta consolidado v0.1 → v0.4.1 completa el registro histórico. La contrarrevisión delta independiente `IRA-04-3` examinó efectivamente la v0.4, validó los ocho cambios de REV-005 y concluyó:

```text
BE-LEG-04 v0.4: APTO CON CORRECCIONES MENORES
HALLAZGOS CRÍTICOS NUEVOS: 0
HALLAZGOS MAYORES NUEVOS: 0
```

Las tres correcciones menores quedaron tratadas en esta versión 0.4.1:

1. **m-10 — delta consolidado:** incorporado mediante `DELTA_CONSOLIDADO_BE_LEG_04_v0.1_a_v0.4.1.md`;
2. **m-11 — prioridad de recuperación:** RNF-REC-001 conserva P1, pero solo puede diferirse si también se difiere el uso de datos autorizados;
3. **m-12 — antecedentes v0.3/REV-004:** ambos artefactos se archivan con hashes en el paquete de aprobación y se identifican como antecedentes no canónicos.

El control consolidado concluye que:

- no quedan contradicciones conocidas con 00, 02 o 03;
- no quedan hallazgos críticos o mayores abiertos;
- DEC-042 y DEC-043 conservan su vigencia provisional sin cambio de decisión;
- datos, seguridad, arquitectura, API, UI y pruebas permanecen derivados a sus propietarios;
- el Documento 04 está técnicamente apto para aprobación de dirección.

Elian Gastón Bufi aprobó expresamente `BE-LEG-04 v0.4.1` el 28 de julio de 2026. En consecuencia, `REV-005` queda **CERRADA — CONFORME** y el Documento 04 cambia a estado `APROBADO`. La canonización, el baseline en repositorio y cualquier operación Git requieren una autorización posterior y separada.

### 12.1 Parche transversal posterior a REV-005

REV-005 y la aprobación de v0.4.1 permanecen como hechos históricos cerrados.

Esta v0.4.2 no reabre REV-005. Registra un control de cambio posterior autorizado por Dirección.

Cambios de esta versión:

1. `RF-070` — soporte metodológico profesional reproducible;
2. `RF-071` — solicitud/completado de información profesional pertinente;
3. actualización del conteo funcional de candidato;
4. incorporación de reglas transversales de aceptación asociadas;
5. actualización de custodia/estado para distinguir la baseline canónica v0.4.1 de este borrador.

Distribución del candidato v0.4.2.1:

```text
RF:
59 P0 / 8 P1 / 2 P2 = 69

RNF:
31 P0 / 7 P1 = 38

TOTAL RF + RNF:
90 P0 / 15 P1 / 2 P2 = 107
```

La baseline v0.4.1 tenía 88 P0 / 15 P1 / 2 P2 sobre 105 requisitos totales; el único cambio de prioridad agregado por este parche son `RF-070` y `RF-071`, ambos P0.

No cambian:

- los 38 RNF;
- ningún RF-001…RF-069;
- prioridades históricas;
- DEC-042/DEC-043;
- RF-050, cuya rama de anulación se resolverá downstream sin cambiar su obligación en 04;
- la arquitectura 07;
- implementación o repositorio.

### 12.2 Corrección post-contrarrevisión v0.4.2 → v0.4.2.1

La contrarrevisión independiente de v0.4.2 concluyó:

```text
CONFORME CON AJUSTES MENORES
```

Se aceptaron únicamente:

```text
M1
→ explicitar el fundamento de prioridad P0 de RF-070

M2
→ registrar la distribución resultante de prioridades
```

No se modificó:

- la obligación de `RF-070`;
- la obligación de `RF-071`;
- ningún RF-001…RF-069;
- ningún RNF;
- la prioridad de ningún requisito preexistente;
- `RF-050`;
- ninguna frontera propietaria.

Esta v0.4.2.1 requiere únicamente contraste corto independiente de M1/M2 antes de decisión de Dirección.

## 13. Estado

```text
BE-LEG-04 v0.4.2.1
BORRADOR DE PARCHE TRANSVERSAL — CORRECCIÓN POST-CONTRARREVISIÓN · NO APROBADO

BASELINE PREVIA:
v0.4.1 APROBADA Y CANONIZADA
67 RF APROBADOS
38 RNF APROBADOS

CANDIDATO v0.4.2.1:
69 RF = 67 PREEXISTENTES + RF-070 + RF-071
38 RNF = SIN CAMBIO

DISTRIBUCIÓN RF:
59 P0 / 8 P1 / 2 P2

DISTRIBUCIÓN RNF:
31 P0 / 7 P1

DISTRIBUCIÓN TOTAL:
90 P0 / 15 P1 / 2 P2

RF-070:
CAP-MET — CANDIDATO

RF-071:
CAP-DAT — CANDIDATO

DEC-046 / INV-06-133:
PRESERVADOS COMO RESTRICCIÓN DE CAP-MET

RF-050:
SIN CAMBIO EN 04
“CORREGIR O ANULAR” PERMANECE OBLIGACIÓN CANÓNICA

ACTA-DIR-021:
RATIFICA MAPA DE IMPACTO
AUTORIZA REDACCIÓN DEL PARCHE
NO APRUEBA ESTA VERSIÓN

REV-005:
HISTÓRICA · CERRADA — CONFORME · NO REABIERTA

SIGUIENTE:
CONTRASTE CORTO INDEPENDIENTE DE M1/M2

IMPLEMENTACIÓN:
NO AUTORIZADA

CANONIZACIÓN v0.4.2.1:
NO AUTORIZADA

GIT:
SIN COMMIT / SIN PUSH / SIN PR / SIN MERGE
```
