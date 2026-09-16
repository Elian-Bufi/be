# DV-03 — Requisitos funcionales de Website y APK

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fase:** MESA-02  
> **Entregable Da Vinci:** `DV-03 — Requisitos funcionales`  
> **Estado:** `BASELINE DE PRESENTACIÓN — VISTA DERIVADA`  
> **Evidencia de ejecución utilizada:** `NINGUNA`  
> **Cambio canónico:** `NINGUNO`

## 1. Objeto

DV-03 es una vista académica derivada del catálogo vigente.
Presenta los requisitos especificados y los clasifica por superficie sin alterar su semántica.
La clasificación WEBSITE/APK/TRANSVERSAL es derivada, no canónica.
No se usa evidencia de ejecución en esta fase.
BE-LEG-02 v0.2.1 no está evidenciado como objeto primario y no se reconstruye.


Este entregable presenta para lectura académica los **69 RF activos** y los **38 RNF** de `BE-LEG-04 v0.4.2.1`.

La vista agrega únicamente:

1. clasificación de superficie `WEBSITE / APK / TRANSVERSAL`;
2. vínculo de lectura al caso de uso del Documento 05;
3. vínculo de lectura a la familia contractual del Documento 09;
4. maquetado para tribunal.

Los IDs, títulos, prioridades y obligaciones del Documento 04 no cambian.

**Decisión conservadora:** la columna `Obligación en una línea` reproduce literalmente la línea `Obligación` del Documento 04. No se parafrasea.

## 2. Exigencia Da Vinci

`Entregables.pdf` v2025.05, punto 3:

```text
Requisitos funcionales
• Website
• APK
```

MESA-01 lo controla mediante:

```text
DV-03.1 — Website
DV-03.2 — APK
```

## 3. Criterio derivado de asignación de canal

Esta clasificación es **derivada y no canónica**.

- `WEBSITE`: actor principal Profesional o Administrador y conducta ejercida desde superficie web.
- `APK`: actor principal Asesorado y conducta ejercida desde superficie móvil.
- `TRANSVERSAL`: conducta de Sistema BE, garantía transversal o comportamiento que cruza más de una superficie/actor.

Fuentes verificadas para la clasificación:

- `BE-LEG-04`: actor y obligación de cada RF; `RF-006` y `RF-007` sirven como anclas de encauzamiento por superficie.
- `BE-LEG-10 B10-01`: `Asesorado → APK / Mobile`, `Profesional → Website profesional`, `Administrador → Website administrativa`; además ubica el descubrimiento antropométrico P1 en Website pública limitada.
- `BE-LEG-02 v0.2.1 §11`: **NO EVIDENCIADO como objeto primario accesible**. No se reconstruyó ni se usó para citar contenido interno.

### 3.1 Casos de clasificación que requieren explicación

- `RF-025` → `TRANSVERSAL`: preserva continuidad de identidad/historia; no es una acción exclusiva de interfaz.
- `RF-044` → `TRANSVERSAL`: la conducta puede involucrar Asesorado o Profesional autorizado.
- `RF-048` → `TRANSVERSAL`: combina Sistema BE y Profesional responsable.
- `RF-049` y `RF-054` → `TRANSVERSAL`: contemplan lectura longitudinal por Profesional autorizado o Asesorado.
- `RF-051` → `WEBSITE`: publicación profesional y descubrimiento limitado P1 ubicado por B10-01 en superficie web pública.
- `RF-066` → `WEBSITE`: su caso hogar es administrativo (`UC-P29`) y Administrador se encauza a Website.
- `RF-071` → `TRANSVERSAL`: solicitud profesional y respuesta del Asesorado cruzan superficies.

## 4. Síntesis

| Canal | P0 | P1 | P2 | Total |
|---|---:|---:|---:|---:|
| WEBSITE | 33 | 2 | 0 | 35 |
| APK | 9 | 0 | 0 | 9 |
| TRANSVERSAL | 17 | 6 | 2 | 25 |
| **TOTAL** | **59** | **8** | **2** | **69** |

```text
RF activos: 69
P0: 59
P1: 8
P2: 2

RF-016: RETIRADO — AUSENTE
RF-063: RETIRADO — AUSENTE
```

## 5. RF P1/P2

- `RF-003` — Acceder mediante Google sin duplicar identidad — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-004` — Administrar métodos de acceso de una misma identidad — **P2** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-005` — Recuperar el acceso local — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-051` — Publicar y descubrir servicios antropométricos de forma limitada — **P1** — `WEBSITE` — especificado, priorizado, implementación diferida.
- `RF-058` — Obtener TVCC-30 de manera reproducible — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-061` — Consultar novedades internas — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-062` — Recibir notificaciones push — **P2** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-066` — Representar habilitaciones y capacidad sin cobro real — **P1** — `WEBSITE` — especificado, priorizado, implementación diferida.
- `RF-068` — Registrar y gestionar incidencias administrativas mínimas — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.
- `RF-069` — Solicitar el cierre de la propia cuenta — **P1** — `TRANSVERSAL` — especificado, priorizado, implementación diferida.

## 6. Requisitos funcionales

| ID | Título | Canal | Prioridad (04) | Obligación en una línea | UC que lo materializa (05) | Familia API (09) |
|---|---|---|---|---|---|---|
| RF-001 | Registrar una identidad BE | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir crear una cuenta propia mediante autenticación local, asociada a una identidad única e independiente del profesional, especialidad o paquete comercial. | UC-P25 | ACC |
| RF-002 | Autenticar y finalizar una sesión local | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir iniciar y finalizar una sesión mediante credenciales locales y bloquear el acceso cuando la cuenta no esté habilitada. | UC-P26 | ACC |
| RF-003 | Acceder mediante Google sin duplicar identidad | TRANSVERSAL | P1 — Alta prioridad | BE deberá admitir Google como método federado adicional, manteniendo a BE como fuente de identidad, roles, especialidades y habilitaciones. | UC-E05 | ACC-P1 |
| RF-004 | Administrar métodos de acceso de una misma identidad | TRANSVERSAL | P2 — Condicionado / recortable | BE podrá permitir asociar o retirar métodos de acceso sin fragmentar la identidad longitudinal. | UC-E06 | ACC-P2 |
| RF-005 | Recuperar el acceso local | TRANSVERSAL | P1 — Alta prioridad | BE deberá ofrecer un recorrido de recuperación de credencial local que preserve la identidad y no revele indebidamente la existencia de cuentas. | UC-E09 → extiende UC-P26 | ACC-P1 |
| RF-006 | Consultar el estado de la cuenta y del perfil | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá informar el estado operativo de la cuenta y los pasos pendientes para poder utilizar cada capacidad. | UC-P25 / UC-P26 | ACC |
| RF-007 | Acceder a las capacidades por la superficie prevista | TRANSVERSAL | P0 — Núcleo no recortable | Cada actor deberá poder llegar a las funciones que le corresponden desde el Website o la APK sin conocer rutas internas. | UC-I11 | ACC/SYS |
| RF-008 | Crear y mantener un perfil profesional | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir completar un perfil profesional sin confundirlo con una especialidad verificada ni con autorización sobre asesorados. | UC-P01 | PRO |
| RF-009 | Declarar especialidades y aportar evidencia | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir solicitar Nutrición, Entrenamiento o ambas, aportando evidencia separada para cada especialidad; la antropometría se tratará como capacidad transversal sujeta a política específica. | UC-P01 / UC-I01 | PRO |
| RF-010 | Presentar una solicitud de verificación | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir enviar a revisión administrativa la evidencia de una especialidad o de la capacidad antropométrica cuando el conjunto mínimo requerido esté completo. | UC-P01 | PRO |
| RF-011 | Revisar una solicitud profesional | WEBSITE | P0 — Núcleo no recortable | El administrador deberá consultar la evidencia presentada, verificar completitud y registrar observaciones o una resolución trazable por especialidad o capacidad transversal. | UC-P02 | PRO-ADM |
| RF-012 | Resolver la verificación por especialidad o capacidad transversal | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir aprobar, rechazar o suspender la operación de una especialidad o capacidad transversal con motivo y trazabilidad, respetando como mínimo los estados aprobados por DEC-005. | UC-P02 / UC-P03 | PRO-ADM |
| RF-013 | Responder observaciones y volver a presentar evidencia | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir corregir una solicitud no aprobada cuando la resolución admita subsanación, sin sobrescribir la evidencia revisada. | UC-E01 | PRO |
| RF-014 | Suspender y rehabilitar una capacidad profesional | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir suspender y, cuando corresponda, rehabilitar la operación profesional con motivo, alcance y autoría. | UC-P03 | PRO-ADM |
| RF-015 | Mantener separadas verificación, habilitación y autorización | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá evaluar de forma independiente identidad, especialidad verificada, habilitación comercial o académica, vínculo, consentimiento y autorización de datos. | TR-01 / UC-P04 / UC-P05 | REL/CON/SYS |
| RF-017 | Crear y mantener un perfil de asesorado | APK | P0 — Núcleo no recortable | BE deberá permitir a una persona adulta crear y mantener un perfil propio, gratuito y persistente, aun sin vínculo activo. | UC-P25 | ACC |
| RF-018 | Solicitar o invitar a un vínculo | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir iniciar una solicitud de vínculo que identifique profesional, asesorado, especialidad y finalidad. | UC-P04 | REL |
| RF-019 | Aceptar o rechazar un vínculo | APK | P0 — Núcleo no recortable | El asesorado deberá aceptar o rechazar expresamente la solicitud antes de que el vínculo pueda habilitar operación profesional. | UC-P05 | REL |
| RF-020 | Otorgar consentimiento específico y versionado | APK | P0 — Núcleo no recortable | BE deberá permitir otorgar consentimiento informado, específico, versionado y revocable para los datos, dominios y finalidades aplicables. | UC-P07 | CON |
| RF-021 | Evaluar la autorización contextual en cada operación protegida | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir o denegar cada operación considerando rol, especialidad, estado, vínculo, consentimiento, finalidad y alcance vigentes. | UC-I02 / TR-02 | SYS/PDP |
| RF-022 | Revocar consentimiento y cortar accesos futuros | APK | P0 — Núcleo no recortable | BE deberá permitir revocar un consentimiento y hacer efectiva la pérdida de autorización para operaciones futuras del alcance revocado. | UC-P08 / TR-05 | CON |
| RF-023 | Consultar vínculos y consentimientos propios | TRANSVERSAL | P0 — Núcleo no recortable | Cada actor deberá consultar sus relaciones, especialidades, finalidades, estados y consentimientos relevantes. | UC-P06 / UC-P07 / UC-P05 | REL/CON |
| RF-024 | Pausar o finalizar un vínculo | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir pausar o finalizar un vínculo sin borrar la identidad ni la historia del proceso. | UC-P06 | REL |
| RF-025 | Preservar identidad e historia al cambiar de profesional | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá conservar la identidad longitudinal y la procedencia de los registros cuando un vínculo cambie o finalice, sin transferir acceso automáticamente a otro profesional. | UC-I03 / TR-03 | SYS/DSH |
| RF-026 | Registrar una evaluación nutricional | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir registrar una evaluación nutricional pertinente al proceso, con autoría, fecha, fuente y contexto. | UC-P09 | NUT |
| RF-027 | Gestionar un catálogo nutricional propio | WEBSITE | P0 — Núcleo no recortable | BE deberá disponer de un catálogo propio de alimentos y permitir carga manual para operar sin proveedores externos. | UC-P10 | NUT/INT |
| RF-028 | Importar alimentos desde Open Food Facts | WEBSITE | P0 — Compromiso académico de integración | BE deberá consultar e importar de forma controlada alimentos desde Open Food Facts, validando los datos antes de incorporarlos al catálogo BE. | UC-I07 / UC-P10 | INT-NUT |
| RF-029 | Definir un objetivo nutricional vigente | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir acordar y registrar un objetivo nutricional con vigencia, responsable y relación con la evaluación. | UC-P09 | NUT |
| RF-030 | Crear y editar un plan nutricional en borrador | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir construir un plan nutricional con estructura suficiente para indicar comidas, alternativas, cantidades, objetivos y observaciones antes de activarlo. | UC-P10 | NUT |
| RF-031 | Validar, versionar y activar un plan nutricional | WEBSITE | P0 — Núcleo no recortable | BE deberá impedir la activación de un plan inválido y, al activarlo, conservar una versión reproducible y claramente vigente. | UC-P11 / UC-I04 / UC-I10 | NUT |
| RF-032 | Consultar el plan nutricional del día en la APK | APK | P0 — Núcleo no recortable | El asesorado deberá consultar desde Hoy qué corresponde realizar según su plan nutricional activo. | UC-P12 | NUT |
| RF-033 | Registrar adherencia o ejecución nutricional | APK | P0 — Núcleo no recortable | BE deberá permitir registrar evidencia simple de cumplimiento o ejecución del plan nutricional con fecha y observación opcional. | UC-P12 | NUT |
| RF-034 | Analizar evidencia nutricional para una revisión | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir examinar en conjunto evaluación, objetivo, plan, ejecución y evolución nutricional antes de decidir continuidad. | UC-P13 | NUT |
| RF-035 | Dar continuidad o cerrar el proceso nutricional | WEBSITE | P0 — Núcleo no recortable | Después de una revisión, BE deberá permitir mantener, ajustar, sustituir o cerrar correctamente el plan o proceso nutricional. | UC-P13 / UC-I06 | NUT |
| RF-036 | Registrar una evaluación de entrenamiento | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir registrar la evaluación necesaria para planificar entrenamiento, con autoría, fecha, contexto y fuentes. | UC-P14 | TRN |
| RF-037 | Gestionar un catálogo propio de ejercicios | WEBSITE | P0 — Núcleo no recortable | BE deberá mantener un catálogo propio de ejercicios y permitir carga manual para operar sin wger. | UC-P15 | TRN/INT |
| RF-038 | Importar ejercicios desde wger | WEBSITE | P0 — Compromiso académico de integración | BE deberá consultar e importar ejercicios desde wger mediante un proceso controlado y trazable. | UC-I07 / UC-P15 | INT-TRN |
| RF-039 | Crear un plan de entrenamiento por bloques y sesiones | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir estructurar una planificación por períodos, bloques y sesiones antes de activarla. | UC-P15 | TRN |
| RF-040 | Prescribir ejercicios, series y parámetros | WEBSITE | P0 — Núcleo no recortable | Dentro del plan, BE deberá permitir prescribir ejercicios y parámetros necesarios para que el asesorado sepa qué ejecutar. | UC-P15 | TRN |
| RF-041 | Validar, versionar y activar un plan de entrenamiento | WEBSITE | P0 — Núcleo no recortable | BE deberá impedir activar una planificación incompleta y conservar una versión vigente y reproducible al activarla. | UC-P16 / UC-I04 / UC-I10 | TRN |
| RF-042 | Consultar el entrenamiento del día en la APK | APK | P0 — Núcleo no recortable | El asesorado deberá consultar desde Hoy la sesión planificada vigente y sus indicaciones. | UC-P17 | TRN |
| RF-043 | Registrar sesión y series ejecutadas | APK | P0 — Núcleo no recortable | BE deberá permitir registrar la ejecución real de una sesión, diferenciándola de la planificación. | UC-P17 | TRN |
| RF-044 | Corregir una ejecución de forma trazable | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir corregir un registro de ejecución sin ocultar el valor original ni su autoría. | UC-E02 / UC-I12 / UC-I03 | TRN |
| RF-045 | Analizar evidencia de entrenamiento para una revisión | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir comparar evaluación, objetivo, planificación, ejecución y evolución antes de decidir progresión o continuidad. | UC-P18 | TRN |
| RF-046 | Progresar, sustituir o cerrar el plan de entrenamiento | WEBSITE | P0 — Núcleo no recortable | Después de una revisión, BE deberá permitir mantener, progresar, reprogramar, sustituir o cerrar correctamente el plan o bloque. | UC-P18 / UC-I06 | TRN |
| RF-047 | Registrar una evaluación antropométrica autorizada | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir registrar mediciones antropométricas directas con protocolo, unidades, fecha, autor y contexto. | UC-P19 | ANT |
| RF-048 | Emitir cálculos antropométricos reproducibles | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá calcular resultados derivados sin confundirlos con mediciones directas y conservando método, entradas y versión. | UC-I09 / UC-P19 / UC-E03 | ANT |
| RF-049 | Consultar evolución antropométrica | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir comparar evaluaciones antropométricas en el tiempo con período, unidad y procedencia visibles. | UC-P20 | ANT/PRJ |
| RF-050 | Corregir una medición antropométrica con trazabilidad | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir corregir o anular una medición preservando el registro original y el motivo. | UC-E03 / UC-I12 / UC-I03 / UC-I09 | ANT |
| RF-051 | Publicar y descubrir servicios antropométricos de forma limitada | WEBSITE | P1 — Alta prioridad | BE deberá permitir publicar un servicio antropométrico y descubrirlo en lista y, cuando esté disponible, mapa, para consultar perfil y solicitar vínculo. | UC-P21 / UC-P22 / UC-E04 / UC-P04 / UC-P05 | ANT-P1 |
| RF-052 | Consultar la cartera operativa profesional | WEBSITE | P0 — Núcleo no recortable | BE deberá mostrar los asesorados y procesos propios con estado operativo suficiente para identificar qué requiere acción. | UC-P23 / UC-I02 | DSH |
| RF-053 | Consultar un dashboard interdisciplinario autorizado | WEBSITE | P0 — Núcleo no recortable | BE deberá ofrecer una síntesis del proceso del asesorado que combine estado de Nutrición, Entrenamiento, Antropometría, vínculos, consentimientos, revisiones, decisiones y próxima acción. | UC-P24 / UC-I02 | DSH |
| RF-054 | Consultar una línea temporal integrada | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá reconstruir cronológicamente evaluaciones, planes, ejecuciones, revisiones, decisiones, cambios de vínculo y consentimientos según permisos. | UC-P24 / UC-P31 / UC-I03 | DSH |
| RF-055 | Identificar revisiones pendientes | WEBSITE | P0 — Núcleo no recortable | BE deberá señalar procesos que requieren revisión por evidencia nueva, fecha acordada, ausencia de continuidad o condición definida. | UC-P23 / UC-I05 | DSH |
| RF-056 | Registrar revisión, decisión y próxima acción | WEBSITE | P0 — Núcleo no recortable | BE deberá registrar de forma trazable una revisión válida y su próxima acción dentro del dominio correspondiente. | UC-I05; invocado por UC-P13 y UC-P18 | NUT/TRN |
| RF-057 | Registrar notas de coordinación autorizadas | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir documentar contexto de coordinación sin transferir responsabilidad ni facultades entre especialidades. | UC-E07 / UC-I02 / UC-I03 | CRD |
| RF-058 | Obtener TVCC-30 de manera reproducible | TRANSVERSAL | P1 — Alta prioridad | BE deberá producir los datos necesarios para calcular TVCC-30 con vínculos elegibles, ciclo cerrado y siguiente acción válida en el período. | UC-S01; productores UC-P13 / UC-P18 mediante UC-I05 / UC-I06 | ANA-P1 |
| RF-059 | Continuar el núcleo ante fallas de terceros | TRANSVERSAL | P0 — Núcleo no recortable | Las funciones núcleo deberán continuar mediante fuente propia o carga manual cuando un proveedor externo no esté disponible. | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 | INT/SYS |
| RF-060 | Consultar la procedencia de datos externos | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir identificar proveedor, fecha y referencia suficiente de un dato externo en los contextos donde se utiliza. | UC-I08 / TR-04 / UC-P10 / UC-P15 | INT/SYS |
| RF-061 | Consultar novedades internas | TRANSVERSAL | P1 — Alta prioridad | BE deberá disponer de un centro interno donde mostrar novedades operativas relevantes para el actor. | UC-P30 | COM-P1 |
| RF-062 | Recibir notificaciones push | TRANSVERSAL | P2 — Condicionado / recortable | BE podrá enviar notificaciones push para novedades seleccionadas, sin convertirlas en única vía de información. | UC-E08 | COM-P2 |
| RF-064 | Definir un objetivo de entrenamiento vigente | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir registrar un objetivo de entrenamiento vigente y relacionarlo con la evaluación y la planificación. | UC-P14 | TRN |
| RF-065 | Consultar progreso longitudinal en la APK | APK | P0 — Núcleo no recortable | La APK deberá permitir al asesorado consultar una síntesis comprensible de su evolución autorizada en Nutrición, Entrenamiento y Antropometría. | UC-P31 / UC-I02 | DSH |
| RF-066 | Representar habilitaciones y capacidad sin cobro real | WEBSITE | P1 — Alta prioridad | El MVP académico deberá poder configurar o simular habilitaciones y banda de capacidad profesional sin implementar cobros, facturación ni renovación. | UC-P29 / UC-I10 / UC-P11 / UC-P16 / UC-P19 / UC-P21 | ADM-P1 + SYS |
| RF-067 | Declarar la capacidad antropométrica transversal y aportar evidencia | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir declarar una capacidad antropométrica transversal y aportar evidencia propia, independiente de las especialidades de Nutrición y Entrenamiento. | UC-P01 / UC-I01 | PRO |
| RF-068 | Registrar y gestionar incidencias administrativas mínimas | TRANSVERSAL | P1 — Alta prioridad | BE deberá permitir reportar y gestionar incidencias operativas vinculadas con acceso, perfiles, vínculos, integridad de información o funcionamiento de los recorridos, sin convertir el MVP en una plataforma general de soporte. | UC-P28 | ADM-P1 |
| RF-069 | Solicitar el cierre de la propia cuenta | TRANSVERSAL | P1 — Alta prioridad | BE deberá permitir al titular solicitar el cierre de su propia cuenta mediante una acción autenticada y trazable, sin eliminar silenciosamente vínculos, decisiones ni evidencia histórica. | UC-P27 | ACC-P1 |
| RF-070 | Utilizar métodos profesionales de cálculo reproducible | WEBSITE | P0 — Núcleo no recortable | BE deberá permitir al profesional autorizado consultar y ejecutar métodos de cálculo habilitados y versionados para una finalidad pertinente, conservando requisitos de entrada, versión del método, inputs efectivos, procedencia y resultado, sin convertir el cálculo ni una eventual sugerencia en una decisión profesional automática. | UC-I13; invocado por UC-P09, UC-P14 y especializado por UC-I09 | MTH/CAL |
| RF-071 | Solicitar y completar información profesional pertinente | TRANSVERSAL | P0 — Núcleo no recortable | BE deberá permitir que un profesional autorizado solicite al asesorado información estructurada pertinente para una finalidad y alcance determinados, y que el asesorado la complete conservando solicitante, finalidad, versión de la estructura, estado y procedencia de la respuesta. | UC-P32 / UC-P33 / UC-I02 / UC-I03 | FRM |

## 7. Requisitos no funcionales

Los 38 RNF se agrupan por su categoría canónica. Se preservan prioridad y obligación del Documento 04.

| ID | Categoría | Título | Componente (04) | Prioridad (04) | Obligación (04) |
|---|---|---|---|---|---|
| RNF-SEC-001 | SEC | Autorización consistente para recursos protegidos | Backend y superficies cliente | P0 — Núcleo no recortable | Toda lectura o escritura protegida deberá someterse a la política contextual vigente y producir el mismo resultado con independencia del canal usado. |
| RNF-SEC-002 | SEC | Protección de credenciales, sesiones y secretos | Identidad, backend e infraestructura | P0 — Núcleo no recortable | Credenciales, sesiones y secretos deberán tratarse de forma que una filtración de repositorio, logs o cliente no exponga valores reutilizables. |
| RNF-SEC-003 | SEC | Resistencia a abuso de autenticación y recuperación | Identidad | P0 — Núcleo no recortable | Los recorridos de acceso y recuperación deberán limitar abuso automatizado, enumeración y reutilización de pruebas temporales. |
| RNF-SEC-004 | SEC | Separación de ambientes | Infraestructura y datos | P0 — Núcleo no recortable | Development, test y production deberán estar separados, con configuración y datos acordes a cada propósito. |
| RNF-SEC-005 | SEC | Auditoría de operaciones sensibles | Identidad, autorización y dominios | P0 — Núcleo no recortable | Accesos y cambios sensibles deberán dejar evidencia suficiente para atribuir actor, momento, operación, sujeto y resultado. |
| RNF-SEC-006 | SEC | Mínimo privilegio y segregación por dominio | Autorización | P0 — Núcleo no recortable | Cada actor deberá recibir solo capacidades y contexto necesarios para su especialidad, vínculo, finalidad y estado. |
| RNF-PRI-001 | PRI | Minimización y pertinencia | Producto, datos e interfaces | P0 — Núcleo no recortable | BE solo deberá solicitar, mostrar y conservar datos que apoyen una decisión, obligación o experiencia aprobada. |
| RNF-PRI-002 | PRI | Revocación efectiva y verificable | Autorización y auditoría | P0 — Núcleo no recortable | Una revocación deberá cortar accesos futuros del alcance y ser verificable sin borrar silenciosamente evidencia histórica. |
| RNF-PRI-003 | PRI | Visibilidad adecuada a cada superficie | Website, APK y comunicaciones | P0 — Núcleo no recortable | Cada superficie deberá exponer solo la información necesaria para el actor y contexto, evitando datos administrativos o sensibles no requeridos. |
| RNF-PERF-001 | PERF | Rendimiento de operaciones núcleo | Backend y base de datos | P0 — Núcleo no recortable | Las operaciones núcleo deberán responder dentro de un presupuesto medible bajo un perfil de carga piloto documentado. |
| RNF-PERF-002 | PERF | Respuesta percibida de Website y APK | Website y APK | P1 — Alta prioridad | Las superficies deberán mostrar estado visible sin bloqueo prolongado y completar el contenido principal del recorrido núcleo dentro de un presupuesto definido. |
| RNF-PERF-003 | PERF | Tiempo acotado y fallback de integraciones | Integraciones externas | P0 — Compromiso académico de integración | Una llamada externa no deberá bloquear indefinidamente una operación interactiva y deberá terminar en respuesta útil o fallback. |
| RNF-AVA-001 | AVA | Disponibilidad durante validación y defensa | Solución desplegada | P0 — Núcleo no recortable | Los recorridos núcleo deberán estar operativos durante las ventanas programadas de validación y defensa sin depender de terceros no esenciales. |
| RNF-AVA-002 | AVA | Persistencia después de reinicio | Backend y datos | P0 — Núcleo no recortable | Un reinicio de servicios no deberá perder operaciones confirmadas ni exigir reconstrucción manual del estado ordinario. |
| RNF-REC-001 | REC | Copia y restauración verificable | Datos e infraestructura | P1 — Alta prioridad condicionada al uso de datos autorizados | Antes de utilizar datos autorizados en piloto o defensa deberá existir un mecanismo de copia y una restauración probada en ambiente seguro. Este requisito solo podrá diferirse si también se difiere el uso de datos autorizados y se trabaja exclusivamente con datos sintéticos o anonimizados conforme a 08 y 11A. |
| RNF-REC-002 | REC | Idempotencia de operaciones sensibles | Backend y datos | P0 — Núcleo no recortable | Reintentos o concurrencia no deberán duplicar invitaciones, consentimientos, activaciones, ejecuciones, adherencias o decisiones. |
| RNF-REL-001 | REL | Ausencia de éxito falso y recuperación comprensible | Todas las superficies | P0 — Núcleo no recortable | BE no deberá presentar una operación como exitosa sin confirmación del estado persistido y deberá ofrecer una salida comprensible ante fallas recuperables. |
| RNF-ACC-001 | ACC | Accesibilidad en recorridos núcleo | Website y APK | P0 — Núcleo no recortable | Los recorridos núcleo deberán satisfacer un conjunto declarado de criterios aplicables de accesibilidad, tomando WCAG 2.2 AA como marco de referencia, sin afirmar certificación integral del producto. |
| RNF-ACC-002 | ACC | Lenguaje claro, no diagnóstico y no causal | Contenido y UI | P0 — Núcleo no recortable | Los textos deberán ser comprensibles, coherentes con el glosario y evitar diagnóstico, causalidad no sustentada o urgencia clínica. |
| RNF-ACC-003 | ACC | Adaptación a las superficies objetivo | Website y APK | P0 — Núcleo no recortable | El Website profesional y administrativo y la APK Android deberán ser operables en la matriz de dispositivos definida sin pérdida de acciones esenciales. |
| RNF-PORT-001 | PORT | APK instalable y demostrable en Android físico | Aplicación móvil | P0 — Núcleo no recortable | La aplicación del asesorado deberá generar un artefacto instalable y operar los recorridos núcleo en al menos un dispositivo Android físico objetivo. |
| RNF-MAN-001 | MAN | Separación de responsabilidades y fuente única de reglas | Código y solución | P0 — Núcleo no recortable | Las reglas críticas deberán tener un propietario identificable y comportarse igual para Website, APK e integraciones. |
| RNF-MAN-002 | MAN | Contratos compatibles y verificables | API, Website y APK | P0 — Núcleo no recortable | Las interfaces entre componentes deberán permitir detectar cambios incompatibles antes de la demostración o despliegue. |
| RNF-MAN-003 | MAN | Evolución reproducible del esquema y los datos | Datos e infraestructura | P0 — Núcleo no recortable | Los cambios autorizados sobre persistencia deberán poder reproducirse y transicionar datos sin pérdidas no declaradas. |
| RNF-MAN-004 | MAN | Testabilidad proporcional al riesgo | Producto, código y pruebas | P0 — Núcleo no recortable | Los comportamientos P0 y sus invariantes deberán poder verificarse de forma independiente y repetible, incluyendo fallas relevantes y autorizaciones negativas. |
| RNF-OBS-001 | OBS | Diagnóstico sin exposición de datos sensibles | Backend e infraestructura | P1 — Alta prioridad | La solución deberá permitir rastrear fallas e incidentes sin registrar secretos o contenido de salud innecesario. |
| RNF-OBS-002 | OBS | Salud técnica mínima del despliegue | Infraestructura | P1 — Alta prioridad | El despliegue deberá exponer evidencia suficiente para distinguir servicio operativo de dependencia no disponible. |
| RNF-OBS-003 | OBS | Trazabilidad bidireccional | Documentación, código y pruebas | P0 — Núcleo no recortable | Cada requisito aprobado deberá vincularse con decisiones, casos de uso, diseño y pruebas; cada evidencia deberá indicar qué obligación demuestra. |
| RNF-INT-001 | INT | Sustituibilidad de proveedores externos | Arquitectura e integraciones | P1 — Alta prioridad | Las capacidades externas deberán poder reemplazarse o desactivarse sin reescribir los circuitos de producto. |
| RNF-INT-002 | INT | Consistencia de fechas, períodos, unidades y zona horaria | Todos los dominios | P0 — Núcleo no recortable | BE deberá interpretar fechas, ventanas y unidades de forma consistente y mostrar el período usado en cálculos y comparaciones. |
| RNF-INT-003 | INT | Validación y normalización de importaciones | Catálogos e integraciones | P0 — Compromiso académico de integración | Los datos externos deberán validarse y normalizarse antes de incorporarse a catálogos BE. |
| RNF-SCA-001 | SCA | Escala suficiente para validación y segmento inicial | Solución completa | P1 — Alta prioridad | La solución deberá soportar el perfil de uso definido para piloto y demostración sin rediseño inmediato ni degradación inaceptable. |
| RNF-SCA-002 | SCA | Configuración desacoplada de habilitaciones y capacidad | Producto y backend | P1 — Alta prioridad | Habilitaciones y bandas deberán poder configurarse sin convertirse en roles, especialidades o permisos de datos. |
| RNF-DAT-001 | DAT | Integridad de estados críticos | Dominio y persistencia | P0 — Núcleo no recortable | BE deberá impedir combinaciones que contradigan las reglas aprobadas de identidad, vínculo, consentimiento, plan, ejecución, revisión y continuidad. |
| RNF-DAT-002 | DAT | Procedencia obligatoria | Todos los dominios | P0 — Núcleo no recortable | Los datos relevantes deberán conservar quién o qué los originó, cuándo, bajo qué contexto y con qué método cuando corresponda. |
| RNF-DAT-003 | DAT | Versionado y ausencia de sobrescritura silenciosa | Planes, mediciones, revisiones y decisiones | P0 — Núcleo no recortable | Los registros emitidos o utilizados para decidir no deberán cambiar retroactivamente sin relación explícita con una corrección o nueva versión. |
| RNF-DAT-004 | DAT | Validación de datos y errores accionables | Backend y superficies | P0 — Núcleo no recortable | Entradas inválidas deberán rechazarse antes de producir estados inconsistentes y comunicar al actor qué puede corregir sin revelar información sensible. |
| RNF-DAT-005 | DAT | Reproducibilidad temporal y analítica | Analítica y reportes | P0 — Núcleo no recortable | Todo cálculo longitudinal deberá declarar período, zona, datos de entrada y regla suficiente para reproducir el resultado. |

## 8. Fuentes

| Fuente | Versión / objeto | SHA-256 | Uso |
|---|---|---|---|
| BE-LEG-04 | v0.4.2.1 | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` | IDs, títulos, actores, prioridades, obligaciones y RNF |
| BE-LEG-05 | v0.15 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` | `RF → UC` |
| BE-LEG-09 | v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` | `RF → Familia 09` |
| BE-LEG-10 B10-01 | v0.2 | `6946701f1aa9e1be0274d367c421b60f15055f9baf27bf2f311d92d9bcc68e35` | actor → superficie |
| BE-LEG-10 B10-11 | v0.10.1-G | `205a31709a470156f18952a6d59197ed6ceb757961a70ad1a33e7d9614b6ce6c` | continuidad UX |
| MESA-01 | 14×14 | `135152a755b849d34c6dbd161f62183bd1ef8e9b9eba5f425c214d7387a641e5` | control `DV-03.1 / DV-03.2` |
| Entregables.pdf | v2025.05 | `cd77a245c683b00a7eceab03bfccc64943e5741905613fa92b903183b49800a8` | exigencia académica |
| BE-LEG-02 | v0.2.1 | `NO EVIDENCIADO` | no usado para contenido interno |

### 8.1 Familia 09

Para `RF-001…RF-069` se conserva literalmente el campo `Familia 09` de la matriz del Documento 09, incluso cuando utiliza rótulos transversales o de prioridad.

Para los dos RF agregados por el parche:

```text
RF-070 → MTH-01/02 + CAL-01…04 → MTH/CAL
RF-071 → FRM-01…08 → FRM
```

La asociación se deriva de la matriz de propagación actualizada del propio `BE-LEG-09 v0.16.1`.

## 9. Declaración de estado

```text
CAMBIO CANÓNICO: NINGUNO
RF NUEVOS: 0
RNF NUEVOS: 0
PRIORIDADES MODIFICADAS: 0
OBLIGACIONES MODIFICADAS: 0
AFIRMACIONES FACTUALES DE RUNTIME PRODUCIDAS POR MESA: 0
```
