# BE-LEG-11A v1.0-H — Plan y Estrategia de Pruebas · Candidato a Baseline

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Entrega:** `H`  
> **Fecha:** `2026-09-09`  
> **Estado:** `CANDIDATO A BASELINE · NO APROBADO · SIN RESULTADOS`  
> **Autorización:** `ACTA-DIR-032`  
> **Implementación:** `NO AUTORIZADA`  
> **11B:** `NO PRODUCIDO`

# 0. Propósito

Definir **antes de implementación** qué debe demostrar BE, cómo se verifica y qué evidencia será válida.

```text
11A:
plan verificable

11B:
resultados reales posteriores
```

Este documento contiene:

```text
PASS reales:
0

FAIL reales:
0

commits de evidencia:
0

runs CI reales:
0

evidencia runtime:
0
```

# 1. Universo de cobertura

```text
RF activos:
69
  P0 59
  P1 8
  P2 2

RF retirados:
RF-016
RF-063

RNF:
38
  P0 31
  P1 7

UC:
56
  P 33
  I 13
  E 9
  S 1

TR:
5

API P0:
122

API P1 explícitas de acceso/cuenta:
4

UX:
36 PROTO + 5 FLOW
= 41 aliases
→ 14 GPROTO
```

# 2. Fuentes

| Documento | SHA-256 |
|---|---|
| 04 | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` |
| 05 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` |
| 06 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |
| 08 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` |
| 09 v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |
| 09 auxiliar P1 | `8a3db34e8c4991d427f089c6424da13daa35d883c7f06171e78daac02441f8c5` |
| B10-11 corregido | `205a31709a470156f18952a6d59197ed6ceb757961a70ad1a33e7d9614b6ce6c` |
| Addendum RF-069 | `aa57339c1f7b658c3897a8d94415ef80a70616b19f7d78ded1a34a3929865e79` |

# 3. Estados de 11A y 11B

## Definición 11A

```text
READY_FOR_BASELINE
BLOCKED_BY_SOURCE
NOT_APPLICABLE
```

## Ejecución 11B futura

```text
PASS
FAIL
BLOCKED
NOT_RUN
```

Nunca usar `PASS` para expresar que una prueba está bien redactada.

# 4. Datos de prueba

Hasta gate de implementación:

```text
SYNTHETIC ONLY
```

Fixtures futuros deben:

- distinguir actores;
- contener múltiples scopes;
- permitir A3/B2 grant/revoke;
- incluir casos sin dato;
- incluir conflictos de versión;
- incluir idempotency replay;
- incluir ciclos TVCC elegibles/no elegibles/no resolubles;
- no utilizar datos reales de salud.

# 5. Niveles

```text
UNIT/DOMAIN
CONTRACT
INTEGRATION
SECURITY/PDP
PRIVACY
UX
ACCESSIBILITY
E2E
RUNTIME
APK
ANALYTICS
```

# 6. Plantilla obligatoria

Cada caso materializado para ejecución debe portar:

```text
TEST_ID
TITLE
LEVEL
PRIORITY
SOURCES
PRECONDITIONS
SYNTHETIC_FIXTURE
STEPS
EXPECTED
NEGATIVE_ASSERTIONS
AUTOMATION
ENVIRONMENT
EVIDENCE_EXPECTED
```

# 7. Índice exhaustivo RF → prueba

| RF | Prioridad | Obligación | Test | Oráculo de aceptación | Estado 11A |
|---|---:|---|---|---|---|
| `RF-001` | P0 | Registrar una identidad BE | `TEST-RF-001` | Con datos válidos se crea una sola identidad; un correo ya asociado no produce una segunda cuenta; el alta no verifica especialidades ni concede acceso a datos de terceros. | `READY_FOR_BASELINE` |
| `RF-002` | P0 | Autenticar y finalizar una sesión local | `TEST-RF-002` | Las credenciales válidas habilitan la superficie correspondiente; las inválidas o una cuenta suspendida no crean sesión; el cierre impide continuar usando la sesión finalizada. | `READY_FOR_BASELINE` |
| `RF-003` | P1 | Acceder mediante Google sin duplicar identidad | `TEST-RF-003` | Una cuenta vinculada accede al mismo historial por ambos métodos; Google no concede roles ni verificaciones; la indisponibilidad del proveedor no impide el acceso local. | `READY_FOR_BASELINE` |
| `RF-004` | P2 | Administrar métodos de acceso de una misma identidad | `TEST-RF-004` | Agregar o retirar un método no altera vínculos ni historial; no se permite dejar la cuenta sin un método utilizable; los cambios sensibles quedan trazables. | `READY_FOR_BASELINE` |
| `RF-005` | P1 | Recuperar el acceso local | `TEST-RF-005` | Una recuperación válida permite establecer una nueva credencial sin crear otra identidad; solicitudes inválidas o vencidas no modifican el acceso; la respuesta inicial es neutra. | `READY_FOR_BASELINE` |
| `RF-006` | P0 | Consultar el estado de la cuenta y del perfil | `TEST-RF-006` | El usuario distingue cuenta, perfil, especialidad verificada, habilitación y vínculo; un estado incompleto no se presenta como habilitado. | `READY_FOR_BASELINE` |
| `RF-007` | P0 | Acceder a las capacidades por la superficie prevista | `TEST-RF-007` | El administrador y el profesional operan en Website; el asesorado accede a Hoy y sus funciones desde la APK; la visibilidad no reemplaza la autorización. | `READY_FOR_BASELINE` |
| `RF-069` | P1 | Solicitar el cierre de la propia cuenta | `TEST-RF-069` | La solicitud identifica actor y fecha; una cuenta cerrada no inicia nuevas sesiones; los efectos sobre vínculos, procesos, conservación y eventual reversibilidad se aplican según las políticas aprobadas; el cierre no se presenta como borrado inmediato de toda la información. | `READY_FOR_BASELINE` |
| `RF-008` | P0 | Crear y mantener un perfil profesional | `TEST-RF-008` | El perfil puede guardarse incompleto; su existencia no habilita planes ni acceso a datos; los cambios relevantes conservan autoría y fecha. | `READY_FOR_BASELINE` |
| `RF-009` | P0 | Declarar especialidades y aportar evidencia | `TEST-RF-009` | Cada especialidad se evalúa de forma independiente; declarar una no verifica la otra; la carga de evidencia no equivale a aprobación. | `READY_FOR_BASELINE` |
| `RF-010` | P0 | Presentar una solicitud de verificación | `TEST-RF-010` | La versión presentada queda identificada; el profesional conoce fecha y estado; no puede operar esa especialidad o capacidad mientras no alcance el estado habilitante definido. | `READY_FOR_BASELINE` |
| `RF-011` | P0 | Revisar una solicitud profesional | `TEST-RF-011` | La revisión identifica administrador, fecha, versión y fundamento; no modifica otra especialidad ni capacidad; no se presenta como certificación oficial. | `READY_FOR_BASELINE` |
| `RF-012` | P0 | Resolver la verificación por especialidad o capacidad transversal | `TEST-RF-012` | La resolución afecta solo la especialidad o capacidad seleccionada; una suspensión corta nuevas operaciones del alcance; el historial permanece consultable según política. | `READY_FOR_BASELINE` |
| `RF-013` | P0 | Responder observaciones y volver a presentar evidencia | `TEST-RF-013` | La nueva presentación conserva relación con la anterior; el profesional conoce qué debe corregir; el reenvío no se interpreta como aprobación. | `READY_FOR_BASELINE` |
| `RF-014` | P0 | Suspender y rehabilitar una capacidad profesional | `TEST-RF-014` | La suspensión impide nuevas acciones del dominio sin eliminar registros; la rehabilitación requiere una resolución explícita; los efectos sobre vínculos activos se especifican en 06 y 08. | `READY_FOR_BASELINE` |
| `RF-015` | P0 | Mantener separadas verificación, habilitación y autorización | `TEST-RF-015` | Cambiar paquete o capacidad no concede especialidad ni acceso a datos; una especialidad verificada no autoriza por sí sola a consultar un asesorado; cada denegación puede atribuirse a la condición faltante. | `READY_FOR_BASELINE` |
| `RF-067` | P0 | Declarar la capacidad antropométrica transversal y aportar evidencia | `TEST-RF-067` | La declaración y su evidencia quedan identificadas por separado; cargar evidencia no equivale a aprobación; sin resolución habilitante no se registran evaluaciones ni se publica el servicio; declarar esta capacidad no modifica automáticamente las especialidades. | `READY_FOR_BASELINE` |
| `RF-068` | P1 | Registrar y gestionar incidencias administrativas mínimas | `TEST-RF-068` | La incidencia conserva reportante, categoría, fecha, estado, responsable y resolución; el administrador consulta y actualiza únicamente las incidencias autorizadas; el historial no se sobrescribe y el reportante puede conocer el estado de su caso. | `READY_FOR_BASELINE` |
| `RF-070` | P0 | Utilizar métodos profesionales de cálculo reproducible | `TEST-RF-070` | El profesional puede identificar qué método y versión ejecuta y qué datos requiere; un método no se ejecuta si faltan inputs obligatorios o si su procedencia no es admisible; varias ejecuciones pueden coexistir sin promediarse ni sobrescribirse; una sugerencia, selección, ejecución o referencia adoptada permanece distinguible de la decisión profesional final; el resultado no modifica automáticamente requerimiento, objetivo, evaluación, prescripción ni plan; BE no impone una fórmula propia ni genera autónomamente el requerimiento/objetivo, preservando `DEC-046 §4.4/§4.9` e `INV-06-133`. | `READY_FOR_BASELINE` |
| `RF-071` | P0 | Solicitar y completar información profesional pertinente | `TEST-RF-071` | La solicitud identifica quién pide la información, para qué y dentro de qué alcance; solo utiliza categorías/campos permitidos y distingue datos requeridos de opcionales cuando corresponda; la respuesta queda identificada como `self-reported` y no se convierte en medición profesional, diagnóstico ni autorización; una solicitud no amplía vínculo, consentimiento o acceso; una corrección/actualización posterior preserva historia; un dato preexistente del perfil puede reutilizarse o confirmarse sin perder su procedencia ni duplicarse silenciosamente como un origen indistinguible. | `READY_FOR_BASELINE` |
| `RF-017` | P0 | Crear y mantener un perfil de asesorado | `TEST-RF-017` | El perfil no pertenece a un profesional; completar datos no concede acceso a terceros; menores quedan fuera del MVP. | `READY_FOR_BASELINE` |
| `RF-018` | P0 | Solicitar o invitar a un vínculo | `TEST-RF-018` | La solicitud queda pendiente y no habilita acceso; el destinatario conoce quién solicita y para qué; no se crean duplicados equivalentes vigentes. | `READY_FOR_BASELINE` |
| `RF-019` | P0 | Aceptar o rechazar un vínculo | `TEST-RF-019` | Antes de la aceptación no existe acceso profesional; el rechazo queda trazable; aceptar no equivale a consentir todos los dominios. | `READY_FOR_BASELINE` |
| `RF-020` | P0 | Otorgar consentimiento específico y versionado | `TEST-RF-020` | No se habilita acceso protegido sin consentimiento vigente; el sistema conserva evidencia de versión, actor y fecha; el alcance no se amplía de forma implícita; un vínculo aceptado solo se considera operativo para un propósito cuando concurren los consentimientos aplicables. | `READY_FOR_BASELINE` |
| `RF-021` | P0 | Evaluar la autorización contextual en cada operación protegida | `TEST-RF-021` | Una condición faltante impide la operación; la decisión se aplica en todas las superficies; la interfaz no puede otorgar permisos por sí misma. | `READY_FOR_BASELINE` |
| `RF-022` | P0 | Revocar consentimiento y cortar accesos futuros | `TEST-RF-022` | Tras la revocación, un profesional ya no realiza nuevas lecturas o escrituras protegidas del alcance; la evidencia histórica no se elimina silenciosamente; el efecto queda auditado. | `READY_FOR_BASELINE` |
| `RF-023` | P0 | Consultar vínculos y consentimientos propios | `TEST-RF-023` | El asesorado identifica quién tiene acceso y con qué alcance; el profesional solo ve relaciones propias; la información coincide con la autorización efectiva. | `READY_FOR_BASELINE` |
| `RF-024` | P0 | Pausar o finalizar un vínculo | `TEST-RF-024` | La acción impide nuevas operaciones incompatibles con el estado; conserva autoría, fecha y motivo; la lectura posterior queda pendiente de Q-005 y Documento 08. | `READY_FOR_BASELINE` |
| `RF-025` | P0 | Preservar identidad e historia al cambiar de profesional | `TEST-RF-025` | El nuevo vínculo no altera autoría histórica; cada profesional solo consulta lo autorizado; el asesorado mantiene su cuenta y evolución. | `READY_FOR_BASELINE` |
| `RF-026` | P0 | Registrar una evaluación nutricional | `TEST-RF-026` | La evaluación queda asociada al asesorado y al vínculo autorizado; distingue datos informados, observados y calculados; puede consultarse en la historia. | `READY_FOR_BASELINE` |
| `RF-027` | P0 | Gestionar un catálogo nutricional propio | `TEST-RF-027` | Los elementos indican procedencia y estado; el catálogo permite construir planes aun cuando Open Food Facts no esté disponible; cambios posteriores no alteran retrospectivamente planes emitidos. | `READY_FOR_BASELINE` |
| `RF-028` | P0 | Importar alimentos desde Open Food Facts | `TEST-RF-028` | La importación identifica proveedor y fecha; datos insuficientes se corrigen o rechazan; una caída del proveedor permite continuar con catálogo propio y carga manual. | `READY_FOR_BASELINE` |
| `RF-029` | P0 | Definir un objetivo nutricional vigente | `TEST-RF-029` | Existe un objetivo identificable para el plan; los cambios no reescriben silenciosamente el anterior; el asesorado puede consultar la formulación autorizada. | `READY_FOR_BASELINE` |
| `RF-030` | P0 | Crear y editar un plan nutricional en borrador | `TEST-RF-030` | El borrador puede guardarse y retomarse; no es visible como plan vigente del asesorado; las inconsistencias relevantes se informan antes de activar. | `READY_FOR_BASELINE` |
| `RF-031` | P0 | Validar, versionar y activar un plan nutricional | `TEST-RF-031` | El asesorado consulta exactamente la versión activada; una modificación posterior produce continuidad trazable y no altera el histórico emitido; no existen vigencias contradictorias; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes. | `READY_FOR_BASELINE` |
| `RF-032` | P0 | Consultar el plan nutricional del día en la APK | `TEST-RF-032` | La vista muestra la versión vigente y un estado claro cuando no existe plan; es accesible sin conocer rutas internas; no expone datos administrativos. | `READY_FOR_BASELINE` |
| `RF-033` | P0 | Registrar adherencia o ejecución nutricional | `TEST-RF-033` | El registro queda asociado al plan vigente y al asesorado; un reintento no genera hechos duplicados; el profesional autorizado puede consultarlo. | `READY_FOR_BASELINE` |
| `RF-034` | P0 | Analizar evidencia nutricional para una revisión | `TEST-RF-034` | El profesional puede identificar el período y la evidencia relevante, comparar lo planificado con lo ejecutado y pasar al registro común de revisión de RF-056; abrir la pantalla no cuenta como revisión. | `READY_FOR_BASELINE` |
| `RF-035` | P0 | Dar continuidad o cerrar el proceso nutricional | `TEST-RF-035` | La acción queda vinculada con la revisión; el asesorado recibe la situación vigente; la historia anterior se conserva; el cierre cumple la definición que resuelva Q-007. | `READY_FOR_BASELINE` |
| `RF-036` | P0 | Registrar una evaluación de entrenamiento | `TEST-RF-036` | La evaluación es consultable en la historia y se distingue de la ejecución posterior; solo acceden actores autorizados. | `READY_FOR_BASELINE` |
| `RF-064` | P0 | Definir un objetivo de entrenamiento vigente | `TEST-RF-064` | El objetivo identifica período y responsable; los cambios conservan historial; el asesorado consulta el objetivo autorizado. | `READY_FOR_BASELINE` |
| `RF-037` | P0 | Gestionar un catálogo propio de ejercicios | `TEST-RF-037` | Los ejercicios tienen procedencia y datos mínimos; el profesional puede planificar durante una caída externa; cambios del catálogo no reescriben sesiones ya prescriptas. | `READY_FOR_BASELINE` |
| `RF-038` | P0 | Importar ejercicios desde wger | `TEST-RF-038` | Los datos se validan antes de incorporarse; la fuente queda identificada; la caída del proveedor habilita catálogo BE y carga manual. | `READY_FOR_BASELINE` |
| `RF-039` | P0 | Crear un plan de entrenamiento por bloques y sesiones | `TEST-RF-039` | El borrador conserva orden, vigencia y objetivo; no se presenta como plan activo; puede retomarse y validarse. | `READY_FOR_BASELINE` |
| `RF-040` | P0 | Prescribir ejercicios, series y parámetros | `TEST-RF-040` | Cada sesión activa contiene información suficiente y ordenada; unidades y parámetros son interpretables; los cambios posteriores conservan la versión emitida. | `READY_FOR_BASELINE` |
| `RF-041` | P0 | Validar, versionar y activar un plan de entrenamiento | `TEST-RF-041` | El asesorado consulta la versión activada; no existen vigencias contradictorias; una sustitución queda relacionada con la anterior; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes. | `READY_FOR_BASELINE` |
| `RF-042` | P0 | Consultar el entrenamiento del día en la APK | `TEST-RF-042` | La pantalla distingue ausencia de sesión, sesión pendiente y ejecución registrada; no requiere rutas internas; solo muestra datos autorizados. | `READY_FOR_BASELINE` |
| `RF-043` | P0 | Registrar sesión y series ejecutadas | `TEST-RF-043` | La ejecución conserva fecha, relación con la sesión planificada y datos ingresados; un reintento no duplica la sesión; el profesional autorizado la consulta. | `READY_FOR_BASELINE` |
| `RF-044` | P0 | Corregir una ejecución de forma trazable | `TEST-RF-044` | La corrección identifica motivo, actor y relación con el registro previo; los análisis usan la versión vigente sin perder el histórico. | `READY_FOR_BASELINE` |
| `RF-045` | P0 | Analizar evidencia de entrenamiento para una revisión | `TEST-RF-045` | El profesional identifica período y evidencia relevante, compara lo planificado con lo ejecutado y pasa al registro común de revisión de RF-056; una visualización aislada no cuenta como revisión. | `READY_FOR_BASELINE` |
| `RF-046` | P0 | Progresar, sustituir o cerrar el plan de entrenamiento | `TEST-RF-046` | La acción se vincula con la revisión y la siguiente planificación; el asesorado ve la situación vigente; la historia anterior permanece; “progresar” e “iniciar un nuevo bloque” se registran como especializaciones de ajustar o sustituir según su efecto sobre la versión, sin crear una taxonomía paralela a DEC-043. | `READY_FOR_BASELINE` |
| `RF-047` | P0 | Registrar una evaluación antropométrica autorizada | `TEST-RF-047` | Las mediciones quedan diferenciadas de cálculos; se valida la capacidad, vínculo y consentimiento; la evaluación integra la historia autorizada. | `READY_FOR_BASELINE` |
| `RF-048` | P0 | Emitir cálculos antropométricos reproducibles | `TEST-RF-048` | Un resultado histórico puede reproducirse; el método y responsable son identificables; no se presenta como diagnóstico ni causalidad. | `READY_FOR_BASELINE` |
| `RF-049` | P0 | Consultar evolución antropométrica | `TEST-RF-049` | La comparación usa mediciones compatibles o explicita diferencias; el acceso respeta alcance; no produce un score global de salud. | `READY_FOR_BASELINE` |
| `RF-050` | P0 | Corregir una medición antropométrica con trazabilidad | `TEST-RF-050` | La corrección identifica actor y fecha; los cálculos afectados quedan relacionados o recalculados según política; no existe sobrescritura silenciosa. | `READY_FOR_BASELINE` |
| `RF-051` | P1 | Publicar y descubrir servicios antropométricos de forma limitada | `TEST-RF-051` | La fuente de elegibilidad es BE; Google Maps solo representa ubicación; ante caída se mantiene lista y ubicación textual; no hay reservas, pagos, ranking ni reputación. | `READY_FOR_BASELINE` |
| `RF-052` | P0 | Consultar la cartera operativa profesional | `TEST-RF-052` | La cartera excluye relaciones ajenas; distingue pendientes, activos y cerrados según política; permite llegar al perfil autorizado. | `READY_FOR_BASELINE` |
| `RF-053` | P0 | Consultar un dashboard interdisciplinario autorizado | `TEST-RF-053` | Cada dato conserva dominio y procedencia; el profesional solo ve contexto autorizado; no existe score global de salud; los faltantes se muestran como tales. | `READY_FOR_BASELINE` |
| `RF-054` | P0 | Consultar una línea temporal integrada | `TEST-RF-054` | Cada evento identifica fecha, dominio, autor y procedencia; la línea temporal no mezcla planificado con ejecutado; el acceso depende del actor. | `READY_FOR_BASELINE` |
| `RF-055` | P0 | Identificar revisiones pendientes | `TEST-RF-055` | La señal explica por qué requiere atención y no se presenta como alerta clínica; puede abrir la evidencia correspondiente. | `READY_FOR_BASELINE` |
| `RF-056` | P0 | Registrar revisión, decisión y próxima acción | `TEST-RF-056` | El registro cumple DEC-043 durante su vigencia provisional; identifica evidencia, dominio, período, autor, fundamento y resultado; alimenta continuidad y TVCC-30. | `READY_FOR_BASELINE` |
| `RF-057` | P0 | Registrar notas de coordinación autorizadas | `TEST-RF-057` | La nota conserva autor, destinatarios/alcance y dominio; no modifica planes ajenos; solo la consultan actores autorizados. | `READY_FOR_BASELINE` |
| `RF-058` | P1 | Obtener TVCC-30 de manera reproducible | `TEST-RF-058` | El numerador y denominador pueden auditarse; un ciclo cerrado requiere una revisión válida de RF-056 y una próxima acción semánticamente admitida por DEC-043; se excluyen cuentas demo y vínculos no elegibles; la ventana usa la zona aprobada; continuidad no se confunde con retención, adherencia o resultado corporal. | `READY_FOR_BASELINE` |
| `RF-065` | P0 | Consultar progreso longitudinal en la APK | `TEST-RF-065` | La síntesis distingue dominios, períodos y límites; no atribuye causalidad ni emite diagnóstico; permite acceder a datos de origen relevantes. | `READY_FOR_BASELINE` |
| `RF-066` | P1 | Representar habilitaciones y capacidad sin cobro real | `TEST-RF-066` | Un asesorado cuenta una vez por profesional; alcanzar el límite no elimina datos ni interrumpe procesos vigentes, pero impide activar nuevos procesos según la regla aprobada; cambiar paquete no altera permisos de datos. | `READY_FOR_BASELINE` |
| `RF-059` | P0 | Continuar el núcleo ante fallas de terceros | `TEST-RF-059` | La caída de Google, Open Food Facts, wger, Maps o Push no impide crear, consultar, ejecutar o revisar un plan; el usuario conoce el estado y la alternativa. | `READY_FOR_BASELINE` |
| `RF-060` | P0 | Consultar la procedencia de datos externos | `TEST-RF-060` | La procedencia es visible en operaciones relevantes; una importación no se presenta como dato verificado por BE; el histórico no pierde su fuente. | `READY_FOR_BASELINE` |
| `RF-061` | P1 | Consultar novedades internas | `TEST-RF-061` | Las novedades pueden consultarse aunque Push no esté disponible; respetan el alcance del actor; no se presentan como alertas clínicas. | `READY_FOR_BASELINE` |
| `RF-062` | P2 | Recibir notificaciones push | `TEST-RF-062` | El contenido sensible se minimiza; el usuario conserva acceso desde el centro interno; una falla de Expo Push no bloquea ninguna operación núcleo. | `READY_FOR_BASELINE` |

Control:

```text
69/69 RF activos
0 RF activos sin TEST-RF
RF-016/RF-063 excluidos por retiro
```

# 8. Índice exhaustivo RNF → prueba

| RNF | Prioridad | Obligación | Test | Oráculo | Estado |
|---|---:|---|---|---|---|
| `RNF-SEC-001` | P0 | Autorización consistente para recursos protegidos | `TEST-RNF-SEC-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SEC-002` | P0 | Protección de credenciales, sesiones y secretos | `TEST-RNF-SEC-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SEC-003` | P0 | Resistencia a abuso de autenticación y recuperación | `TEST-RNF-SEC-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SEC-004` | P0 | Separación de ambientes | `TEST-RNF-SEC-004` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SEC-005` | P0 | Auditoría de operaciones sensibles | `TEST-RNF-SEC-005` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SEC-006` | P0 | Mínimo privilegio y segregación por dominio | `TEST-RNF-SEC-006` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PRI-001` | P0 | Minimización y pertinencia | `TEST-RNF-PRI-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PRI-002` | P0 | Revocación efectiva y verificable | `TEST-RNF-PRI-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PRI-003` | P0 | Visibilidad adecuada a cada superficie | `TEST-RNF-PRI-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PERF-001` | P0 | Rendimiento de operaciones núcleo | `TEST-RNF-PERF-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PERF-002` | P1 | Respuesta percibida de Website y APK | `TEST-RNF-PERF-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PERF-003` | P0 | Tiempo acotado y fallback de integraciones | `TEST-RNF-PERF-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-AVA-001` | P0 | Disponibilidad durante validación y defensa | `TEST-RNF-AVA-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-AVA-002` | P0 | Persistencia después de reinicio | `TEST-RNF-AVA-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-REC-001` | P1 | Copia y restauración verificable | `TEST-RNF-REC-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-REC-002` | P0 | Idempotencia de operaciones sensibles | `TEST-RNF-REC-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-REL-001` | P0 | Ausencia de éxito falso y recuperación comprensible | `TEST-RNF-REL-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-ACC-001` | P0 | Accesibilidad en recorridos núcleo | `TEST-RNF-ACC-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-ACC-002` | P0 | Lenguaje claro, no diagnóstico y no causal | `TEST-RNF-ACC-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-ACC-003` | P0 | Adaptación a las superficies objetivo | `TEST-RNF-ACC-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-PORT-001` | P0 | APK instalable y demostrable en Android físico | `TEST-RNF-PORT-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-MAN-001` | P0 | Separación de responsabilidades y fuente única de reglas | `TEST-RNF-MAN-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-MAN-002` | P0 | Contratos compatibles y verificables | `TEST-RNF-MAN-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-MAN-003` | P0 | Evolución reproducible del esquema y los datos | `TEST-RNF-MAN-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-MAN-004` | P0 | Testabilidad proporcional al riesgo | `TEST-RNF-MAN-004` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-OBS-001` | P1 | Diagnóstico sin exposición de datos sensibles | `TEST-RNF-OBS-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-OBS-002` | P1 | Salud técnica mínima del despliegue | `TEST-RNF-OBS-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-OBS-003` | P0 | Trazabilidad bidireccional | `TEST-RNF-OBS-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-INT-001` | P1 | Sustituibilidad de proveedores externos | `TEST-RNF-INT-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-INT-002` | P0 | Consistencia de fechas, períodos, unidades y zona horaria | `TEST-RNF-INT-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-INT-003` | P0 | Validación y normalización de importaciones | `TEST-RNF-INT-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SCA-001` | P1 | Escala suficiente para validación y segmento inicial | `TEST-RNF-SCA-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-SCA-002` | P1 | Configuración desacoplada de habilitaciones y capacidad | `TEST-RNF-SCA-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-DAT-001` | P0 | Integridad de estados críticos | `TEST-RNF-DAT-001` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-DAT-002` | P0 | Procedencia obligatoria | `TEST-RNF-DAT-002` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-DAT-003` | P0 | Versionado y ausencia de sobrescritura silenciosa | `TEST-RNF-DAT-003` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-DAT-004` | P0 | Validación de datos y errores accionables | `TEST-RNF-DAT-004` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |
| `RNF-DAT-005` | P0 | Reproducibilidad temporal y analítica | `TEST-RNF-DAT-005` | NOT VERIFIED — texto no extraído | `READY_FOR_BASELINE` |

# 9. Índice exhaustivo UC → prueba de conformidad

Regla de `TEST-UC-*`:

> Ejecutar happy path + variantes + excepciones relevantes y verificar postcondiciones/garantías del caso vigente, sin reinterpretar el UC desde código.

| UC | Nombre | RF trazados por 09 | Test | Oráculo | Estado |
|---|---|---|---|---|---|
| `UC-P01` | Gestionar alta profesional escalonada | `RF-008`, `RF-009`, `RF-010`, `RF-067` | `TEST-UC-P01` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P02` | Revisar solicitud y resolver la verificación profesional | `RF-011`, `RF-012` | `TEST-UC-P02` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E01` | Subsanar y volver a presentar evidencia | `RF-013` | `TEST-UC-E01` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P03` | Suspender o rehabilitar capacidad profesional | `RF-012`, `RF-014` | `TEST-UC-P03` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P04` | Solicitar o invitar a un vínculo | `RF-015`, `RF-018`, `RF-051` | `TEST-UC-P04` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P05` | Aceptar o rechazar un vínculo | `RF-015`, `RF-019`, `RF-023`, `RF-051` | `TEST-UC-P05` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P06` | Consultar, pausar o finalizar un vínculo | `RF-023`, `RF-024` | `TEST-UC-P06` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P07` | Otorgar y consultar consentimiento específico | `RF-020`, `RF-023` | `TEST-UC-P07` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P08` | Revocar consentimiento | `RF-022` | `TEST-UC-P08` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I02` | Evaluar autorización contextual | `RF-021`, `RF-052`, `RF-053`, `RF-057`, `RF-065` | `TEST-UC-I02` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P09` | Registrar evaluación y objetivo nutricional | `RF-026`, `RF-029`, `RF-070` | `TEST-UC-P09` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P10` | Diseñar plan nutricional | `RF-027`, `RF-028`, `RF-030`, `RF-059`, `RF-060` | `TEST-UC-P10` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P11` | Validar y activar plan nutricional | `RF-031`, `RF-066` | `TEST-UC-P11` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P12` | Consultar y registrar ejecución nutricional en APK | `RF-032`, `RF-033` | `TEST-UC-P12` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P13` | Revisar evidencia y decidir continuidad nutricional | `RF-034`, `RF-035`, `RF-056`, `RF-058` | `TEST-UC-P13` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I05` | Registrar revisión profesional válida | `RF-055`, `RF-056`, `RF-058` | `TEST-UC-I05` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I06` | Aplicar continuidad o cierre | `RF-035`, `RF-046`, `RF-058` | `TEST-UC-I06` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P14` | Registrar evaluación y objetivo de entrenamiento | `RF-036`, `RF-064`, `RF-070` | `TEST-UC-P14` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P15` | Diseñar plan de entrenamiento | `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-059`, `RF-060` | `TEST-UC-P15` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P16` | Validar y activar plan de entrenamiento | `RF-041`, `RF-066` | `TEST-UC-P16` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P17` | Consultar y registrar ejecución de entrenamiento en APK | `RF-042`, `RF-043` | `TEST-UC-P17` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E02` | Corregir ejecución de entrenamiento | `RF-044` | `TEST-UC-E02` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P18` | Revisar evidencia y decidir continuidad de entrenamiento | `RF-045`, `RF-046`, `RF-056`, `RF-058` | `TEST-UC-P18` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P19` | Registrar evaluación antropométrica | `RF-047`, `RF-048`, `RF-066` | `TEST-UC-P19` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I09` | Emitir cálculos antropométricos reproducibles | `RF-048`, `RF-050`, `RF-070` | `TEST-UC-I09` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E03` | Corregir o anular medición antropométrica | `RF-048`, `RF-050` | `TEST-UC-E03` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I12` | Registrar corrección trazable | `RF-044`, `RF-050` | `TEST-UC-I12` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P20` | Consultar evolución antropométrica | `RF-049` | `TEST-UC-P20` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P21` | Publicar servicio antropométrico limitado | `RF-051`, `RF-066` | `TEST-UC-P21` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P22` | Descubrir servicio antropométrico | `RF-051`, `RF-059` | `TEST-UC-P22` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E04` | Solicitar vínculo desde descubrimiento antropométrico | `RF-051` | `TEST-UC-E04` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P23` | Consultar cartera y revisiones pendientes | `RF-052`, `RF-055` | `TEST-UC-P23` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P24` | Consultar dashboard y línea temporal interdisciplinaria | `RF-053`, `RF-054` | `TEST-UC-P24` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E07` | Registrar nota de coordinación autorizada | `RF-057` | `TEST-UC-E07` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P31` | Consultar progreso longitudinal en APK | `RF-054`, `RF-065` | `TEST-UC-P31` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P25` | Registrar identidad BE y perfil propio | `RF-001`, `RF-006`, `RF-017` | `TEST-UC-P25` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P26` | Autenticar y finalizar una sesión local | `RF-002`, `RF-005`, `RF-006` | `TEST-UC-P26` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E05` | Acceder mediante Google | `RF-003` | `TEST-UC-E05` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E06` | Administrar métodos de acceso | `RF-004` | `TEST-UC-E06` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E09` | Recuperar el acceso local | `RF-005` | `TEST-UC-E09` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P27` | Solicitar cierre de cuenta | `RF-069` | `TEST-UC-P27` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P28` | Registrar y gestionar incidencia administrativa | `RF-068` | `TEST-UC-P28` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P29` | Configurar habilitaciones y capacidad académica | `RF-066` | `TEST-UC-P29` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P30` | Consultar novedades internas | `RF-061` | `TEST-UC-P30` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P32` | Solicitar información estructurada pertinente al asesorado | `RF-071` | `TEST-UC-P32` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-P33` | Completar información solicitada | `RF-071` | `TEST-UC-P33` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-E08` | Recibir notificación push no sensible | `RF-062` | `TEST-UC-E08` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I01` | Presentar evidencia versionada | `RF-009`, `RF-067` | `TEST-UC-I01` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I03` | Registrar auditoría y preservar historia | `RF-025`, `RF-044`, `RF-050`, `RF-054`, `RF-057` | `TEST-UC-I03` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I04` | Validar y versionar un plan | `RF-031`, `RF-041` | `TEST-UC-I04` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I07` | Importar elemento externo con revisión controlada | `RF-028`, `RF-038` | `TEST-UC-I07` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I08` | Aplicar fallback manual y conservar procedencia | `RF-059`, `RF-060` | `TEST-UC-I08` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I10` | Verificar habilitación y capacidad antes de iniciar proceso | `RF-031`, `RF-041`, `RF-066` | `TEST-UC-I10` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I11` | Encauzar al actor por la superficie prevista | `RF-007` | `TEST-UC-I11` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-I13` | Ejecutar y adoptar cálculo profesional reproducible | `RF-070` | `TEST-UC-I13` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |
| `UC-S01` | Obtener TVCC-30 de manera reproducible | `RF-058` | `TEST-UC-S01` | flujo + variantes + excepciones + postcondiciones del UC vigente | `READY_FOR_BASELINE` |

# 10. Índice exhaustivo API P0 → contract test

Cada `TEST-CT-*` debe comprobar contra la ficha contractual exacta:

1. método/ruta;
2. AuthN y contexto;
3. request;
4. success;
5. errores;
6. precedencia de revelabilidad;
7. idempotencia cuando aplica;
8. concurrencia/versionado cuando aplica;
9. ausencia de campos autoritativos cliente cuando están prohibidos.

| API P0 | Familia | Test | Cobertura mínima | Estado |
|---|---|---|---|---|
| `API-ACC-01` | `ACC` | `TEST-CT-ACC-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ACC-02` | `ACC` | `TEST-CT-ACC-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ACC-03` | `ACC` | `TEST-CT-ACC-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ACC-04` | `ACC` | `TEST-CT-ACC-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ACC-05` | `ACC` | `TEST-CT-ACC-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ACC-06` | `ACC` | `TEST-CT-ACC-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-01` | `PRO` | `TEST-CT-PRO-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-02` | `PRO` | `TEST-CT-PRO-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-03` | `PRO` | `TEST-CT-PRO-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-04` | `PRO` | `TEST-CT-PRO-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-05` | `PRO` | `TEST-CT-PRO-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-06` | `PRO` | `TEST-CT-PRO-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-07` | `PRO` | `TEST-CT-PRO-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-08` | `PRO` | `TEST-CT-PRO-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-09` | `PRO` | `TEST-CT-PRO-09` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-10` | `PRO` | `TEST-CT-PRO-10` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-11` | `PRO` | `TEST-CT-PRO-11` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-12` | `PRO` | `TEST-CT-PRO-12` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRO-13` | `PRO` | `TEST-CT-PRO-13` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-01` | `REL` | `TEST-CT-REL-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-02` | `REL` | `TEST-CT-REL-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-03` | `REL` | `TEST-CT-REL-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-04` | `REL` | `TEST-CT-REL-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-05` | `REL` | `TEST-CT-REL-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-06` | `REL` | `TEST-CT-REL-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-07` | `REL` | `TEST-CT-REL-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-08` | `REL` | `TEST-CT-REL-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-REL-09` | `REL` | `TEST-CT-REL-09` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-01` | `CON` | `TEST-CT-CON-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-02` | `CON` | `TEST-CT-CON-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-03` | `CON` | `TEST-CT-CON-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-04` | `CON` | `TEST-CT-CON-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-05` | `CON` | `TEST-CT-CON-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-06` | `CON` | `TEST-CT-CON-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-07` | `CON` | `TEST-CT-CON-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CON-08` | `CON` | `TEST-CT-CON-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-01` | `NUT` | `TEST-CT-NUT-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-02` | `NUT` | `TEST-CT-NUT-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-03` | `NUT` | `TEST-CT-NUT-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-04` | `NUT` | `TEST-CT-NUT-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-05` | `NUT` | `TEST-CT-NUT-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-06` | `NUT` | `TEST-CT-NUT-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-07` | `NUT` | `TEST-CT-NUT-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-08` | `NUT` | `TEST-CT-NUT-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-09` | `NUT` | `TEST-CT-NUT-09` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-10` | `NUT` | `TEST-CT-NUT-10` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-11` | `NUT` | `TEST-CT-NUT-11` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-12` | `NUT` | `TEST-CT-NUT-12` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-13` | `NUT` | `TEST-CT-NUT-13` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-14` | `NUT` | `TEST-CT-NUT-14` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-15` | `NUT` | `TEST-CT-NUT-15` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-16` | `NUT` | `TEST-CT-NUT-16` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-17` | `NUT` | `TEST-CT-NUT-17` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-18` | `NUT` | `TEST-CT-NUT-18` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-19` | `NUT` | `TEST-CT-NUT-19` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-20` | `NUT` | `TEST-CT-NUT-20` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-NUT-21` | `NUT` | `TEST-CT-NUT-21` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-01` | `TRN` | `TEST-CT-TRN-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-02` | `TRN` | `TEST-CT-TRN-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-03` | `TRN` | `TEST-CT-TRN-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-04` | `TRN` | `TEST-CT-TRN-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-05` | `TRN` | `TEST-CT-TRN-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-06` | `TRN` | `TEST-CT-TRN-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-07` | `TRN` | `TEST-CT-TRN-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-08` | `TRN` | `TEST-CT-TRN-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-09` | `TRN` | `TEST-CT-TRN-09` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-10` | `TRN` | `TEST-CT-TRN-10` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-11` | `TRN` | `TEST-CT-TRN-11` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-12` | `TRN` | `TEST-CT-TRN-12` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-13` | `TRN` | `TEST-CT-TRN-13` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-14` | `TRN` | `TEST-CT-TRN-14` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-15` | `TRN` | `TEST-CT-TRN-15` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-16` | `TRN` | `TEST-CT-TRN-16` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-17` | `TRN` | `TEST-CT-TRN-17` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-18` | `TRN` | `TEST-CT-TRN-18` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-19` | `TRN` | `TEST-CT-TRN-19` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-20` | `TRN` | `TEST-CT-TRN-20` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-21` | `TRN` | `TEST-CT-TRN-21` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-22` | `TRN` | `TEST-CT-TRN-22` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-23` | `TRN` | `TEST-CT-TRN-23` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-TRN-24` | `TRN` | `TEST-CT-TRN-24` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-01` | `ANT` | `TEST-CT-ANT-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-02` | `ANT` | `TEST-CT-ANT-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-03` | `ANT` | `TEST-CT-ANT-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-04` | `ANT` | `TEST-CT-ANT-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-05` | `ANT` | `TEST-CT-ANT-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-06` | `ANT` | `TEST-CT-ANT-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-07` | `ANT` | `TEST-CT-ANT-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-08` | `ANT` | `TEST-CT-ANT-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-09` | `ANT` | `TEST-CT-ANT-09` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-10` | `ANT` | `TEST-CT-ANT-10` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-11` | `ANT` | `TEST-CT-ANT-11` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-ANT-12` | `ANT` | `TEST-CT-ANT-12` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-DSH-01` | `DSH` | `TEST-CT-DSH-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-DSH-02` | `DSH` | `TEST-CT-DSH-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-DSH-03` | `DSH` | `TEST-CT-DSH-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-DSH-04` | `DSH` | `TEST-CT-DSH-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-DSH-05` | `DSH` | `TEST-CT-DSH-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRJ-01` | `PRJ` | `TEST-CT-PRJ-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRJ-02` | `PRJ` | `TEST-CT-PRJ-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-PRJ-03` | `PRJ` | `TEST-CT-PRJ-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-NUT-01` | `INT-NUT` | `TEST-CT-INT-NUT-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-NUT-02` | `INT-NUT` | `TEST-CT-INT-NUT-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-NUT-03` | `INT-NUT` | `TEST-CT-INT-NUT-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-TRN-01` | `INT-TRN` | `TEST-CT-INT-TRN-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-TRN-02` | `INT-TRN` | `TEST-CT-INT-TRN-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-INT-TRN-03` | `INT-TRN` | `TEST-CT-INT-TRN-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CRD-01` | `CRD` | `TEST-CT-CRD-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-MTH-01` | `MTH` | `TEST-CT-MTH-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-MTH-02` | `MTH` | `TEST-CT-MTH-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CAL-01` | `CAL` | `TEST-CT-CAL-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CAL-02` | `CAL` | `TEST-CT-CAL-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CAL-03` | `CAL` | `TEST-CT-CAL-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-CAL-04` | `CAL` | `TEST-CT-CAL-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-01` | `FRM` | `TEST-CT-FRM-01` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-02` | `FRM` | `TEST-CT-FRM-02` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-03` | `FRM` | `TEST-CT-FRM-03` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-04` | `FRM` | `TEST-CT-FRM-04` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-05` | `FRM` | `TEST-CT-FRM-05` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-06` | `FRM` | `TEST-CT-FRM-06` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-07` | `FRM` | `TEST-CT-FRM-07` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |
| `API-FRM-08` | `FRM` | `TEST-CT-FRM-08` | método/ruta/auth/schema/success/errors/revealability + idempotencia/concurrencia si la operación lo define | `READY_FOR_BASELINE` |

Control:

```text
122/122 API P0
0 duplicados
0 huérfanas
```

# 11. Contratos P1 explícitos de acceso/cuenta

No se mezclan con 122 P0.

| API P1 | Test | Oráculo | Estado |
|---|---|---|---|
| `API-ACC-P1-01` | `TEST-CT-P1-ACC-P1-01` | contrato P1 exacto del auxiliar v0.12; no se suma a 122 P0 | `READY_FOR_BASELINE` |
| `API-ACC-P1-02` | `TEST-CT-P1-ACC-P1-02` | contrato P1 exacto del auxiliar v0.12; no se suma a 122 P0 | `READY_FOR_BASELINE` |
| `API-ACC-P1-03` | `TEST-CT-P1-ACC-P1-03` | contrato P1 exacto del auxiliar v0.12; no se suma a 122 P0 | `READY_FOR_BASELINE` |
| `API-ACC-P1-04` | `TEST-CT-P1-ACC-P1-04` | contrato P1 exacto del auxiliar v0.12; no se suma a 122 P0 | `READY_FOR_BASELINE` |

# 12. Suite crítica AuthN/AuthZ/PDP

```text
TEST-AUTH-001 login inválido neutral
TEST-AUTH-002 registro no concede A3
TEST-AUTH-003 A3 ausente bloquea sensible
TEST-AUTH-004 revoke A3 corta prospectivamente
TEST-AUTH-005 B2 sin A3 no produce acceso
TEST-AUTH-006 vínculo sin B2 no produce acceso
TEST-AUTH-007 PAUSADO corta acceso profesional
TEST-AUTH-008 FINALIZADO no deja lectura residual
TEST-AUTH-009 actorCapabilities/context no reemplaza PDP
TEST-AUTH-010 break-glass no da actoría profesional
TEST-AUTH-011 cierre efectivo no permite nueva sesión
TEST-AUTH-012 cierre efectivo invalida sesiones actuales
TEST-AUTH-013 cierre finaliza vínculos por eventos, no delete silencioso
```

# 13. Suite crítica dominio e historia

```text
TEST-DOM-001 SIN_DATO ≠ 0
TEST-DOM-002 corrección no sobrescribe original
TEST-DOM-003 anulación no elimina original
TEST-DOM-004 EN_PREPARACION ≠ REGISTRADA
TEST-DOM-005 nueva CalculationRun no sobrescribe corrida
TEST-DOM-006 referencia profesional no muta corrida
TEST-DOM-007 PRIMARY/SECONDARY no pondera
TEST-DOM-008 occurredAt ≠ recordedAt
TEST-DOM-009 nueva versión no reescribe historia
```

# 14. Nutrición

```text
TEST-NUT-001 validate ≠ activate
TEST-NUT-002 prescribed ≠ recorded
TEST-NUT-003 off-plan conserva descripción original
TEST-NUT-004 múltiples off-plan/día
TEST-NUT-005 sin registro ≠ incumplimiento
TEST-NUT-006 revisión válida exige evidencia + interpretación + resultado + fundamento + next/close
```

# 15. Entrenamiento

```text
TEST-TRN-001 planned ≠ executed
TEST-TRN-002 execution draft ≠ registro definitivo
TEST-TRN-003 sustitución preserva prescripto + realizado
TEST-TRN-004 sin registro ≠ no realizado
TEST-TRN-005 corrección trazable
TEST-TRN-006 RIR/%RM conserva semántica declarada
```

# 16. Antropometría

```text
TEST-ANT-001 directo ≠ derivado
TEST-ANT-002 draft no aparece como registrada
TEST-ANT-003 register de draft es atómico
TEST-ANT-004 correction preserva original
TEST-ANT-005 annulment preserva original + condición ANULADA
TEST-ANT-006 doble anulación no duplica efecto lógico
TEST-ANT-007 no existe reversión implícita
TEST-ANT-008 input anulado reevalúa dependencias
TEST-ANT-009 SIN_DATO no se transforma en cero
TEST-ANT-010 no comparable no forma línea continua
TEST-ANT-011 controlled import conserva procedencia
```

# 17. Métodos / CAL

```text
TEST-CAL-001 versión exacta de método
TEST-CAL-002 disponible ≠ admisible
TEST-CAL-003 sourceRef oculto no funciona como oráculo
TEST-CAL-004 múltiples runs coexisten
TEST-CAL-005 sin promedio/ganador automático
TEST-CAL-006 reference ≠ decision
TEST-CAL-007 cálculo no crea objetivo/prescripción
```

# 18. Formularios

```text
TEST-FRM-001 template ≠ permiso
TEST-FRM-002 request valida B2/propósito/pertinencia
TEST-FRM-003 respuesta SELF_REPORTED
TEST-FRM-004 reutilización de perfil conserva procedencia
TEST-FRM-005 optional missing ≠ zero/default
TEST-FRM-006 rectification crea sucesora
TEST-FRM-007 profesional sin autorización actual no conserva lectura
```

# 19. Dashboard / Timeline / Proyecciones

```text
TEST-DSH-001 cartera no usa score/riesgo
TEST-DSH-002 partialView no enumera ocultos
TEST-TIM-001 occurredAt ≠ recordedAt
TEST-TIM-002 timeline no inventa causalidad

TEST-PRJ-001 catálogo = 8/8, 0 extra
TEST-PRJ-002 NO_DATA ≠ 0
TEST-PRJ-003 PRIMARY/SECONDARY sin weighting
TEST-PRJ-004 sin RIR → notClassifiable
TEST-PRJ-005 cero interpolación
TEST-PRJ-006 PR observada ≠ estimada
TEST-PRJ-007 mapa ≠ gravedad clínica
TEST-PRJ-008 antropometría rompe grupos no comparables
TEST-PRJ-009 nutrición no genera adherence score
TEST-PRJ-010 threshold pertenece al profesional
```

# 20. UX / accesibilidad

```text
TEST-UX-001 teclado/foco
TEST-UX-002 labels persistentes
TEST-UX-003 error anunciado
TEST-UX-004 no color-only
TEST-UX-005 gráfico con equivalente textual/tabular
TEST-UX-006 responsive preserva semántica
TEST-UX-007 partialView neutral
TEST-UX-008 A3 sin dark pattern
TEST-UX-009 annulment copy ≠ delete
TEST-UX-010 tooltip no es única fuente esencial
TEST-UX-011 cierre de cuenta no se presenta como borrado
```

La evidencia real WCAG/manual/automatizada pertenece a 11B.

# 21. TVCC-30 — pruebas analíticas obligatorias

| Test | Aspecto | Expected |
|---|---|---|

| `TEST-TVCC-001` | ventana exacta | corte local produce exactamente 30 fechas calendario |
| `TEST-TVCC-002` | universo | demo y vínculo no elegible quedan excluidos con motivo |
| `TEST-TVCC-003` | denominador | todo ciclo elegible/resoluble del período integra D una sola vez |
| `TEST-TVCC-004` | numerador | N ⊆ D y exige revisión válida + próxima acción/cierre aplicado |
| `TEST-TVCC-005` | actividad UI | dashboard/visualización/nota/edición silenciosa no cuentan |
| `TEST-TVCC-006` | fórmula | valor analítico = N/D; numerador nunca aislado |
| `TEST-TVCC-007` | D=0 | no se publica 0%; se publica ausencia de valor + N=0/D=0 |
| `TEST-TVCC-008` | evidencia incompleta | candidato potencialmente elegible no resoluble impide fabricar valor |
| `TEST-TVCC-009` | reproducción | mismas fuentes + misma versión + mismo corte → mismo N/D |
| `TEST-TVCC-010` | versionado | nueva especificación produce nuevo resultado, no overwrite |
| `TEST-TVCC-011` | zona horaria | límites se resuelven en America/Argentina/Buenos_Aires |
| `TEST-TVCC-012` | interpretación | no se etiqueta como retención/adherencia/salud/score |


Oráculo:

```text
SPEC-TVCC30-v1
→ Documento 12 de esta Entrega H
```

# 22. E2E candidatos baseline

```text
E2E-01 registro → login → A3 → shell
E2E-02 profesional → verificación por alcance → Cartera
E2E-03 vínculo → B2 → acceso → pause/resume/finalize
E2E-04 nutrición plan → registro → revisión
E2E-05 entrenamiento plan → ejecución APK → revisión
E2E-06 antropometría draft → register → correction/annulment → evolución
E2E-07 dashboard/timeline/projection con partialView autorizado
E2E-08 account closure P1 → sesión inválida + eventos de cierre
```

Estos casos **no autorizan su implementación**.

# 23. Runtime / Deploy

Plan, no evidencia:

```text
TEST-RUN-001 health
TEST-RUN-002 readiness
TEST-RUN-003 migration deploy
TEST-RUN-004 env validation
TEST-RUN-005 restart/persistence
TEST-RUN-006 backup/restore rehearsal
TEST-RUN-007 synthetic seed
TEST-RUN-008 TLS
TEST-RUN-009 logs sin C4
```

Estado de ejecución:

```text
NOT_RUN — 11B FUTURO
```

# 24. APK

Plan, no evidencia:

```text
TEST-APK-001 artefacto instalable
TEST-APK-002 launch en dispositivo físico
TEST-APK-003 auth
TEST-APK-004 conectividad /api/v1
TEST-APK-005 workflow núcleo asesorado
TEST-APK-006 network failure/retry
TEST-APK-007 state restoration
TEST-APK-008 build/version identificable
```

Matriz de dispositivos concreta se completa antes de ejecución con los dispositivos disponibles; no se inventa hardware en 11A.

# 25. Evidencia esperada en 11B

Tipos admitidos:

```text
assertion automatizada
HTTP transcript
DB assertion
audit event
captura
video
accessibility report
CI artifact
APK hash
deployment log
migration log
backup/restore log
```

Toda evidencia debe identificar versión/commit/ambiente cuando exista implementación.

# 26. Política de severidad

```text
BLOCKER
→ seguridad/privacidad, pérdida de historia, falso éxito, bypass PDP, migración destructiva, imposibilidad de demo núcleo

MAJOR
→ RF P0 no satisfecho, API P0 incompatible, flujo núcleo roto, accesibilidad crítica

MINOR
→ defecto no bloqueante con workaround sin alterar semántica
```

La clasificación exacta de incidencias se registra en 11B.

# 27. Gate de ejecución

11A baselineado:

```text
≠ tests ejecutados
≠ sistema conforme
```

Solo habilita implementar de forma verificable después del gate de Dirección correspondiente.

# 28. DoD del baseline 11A

No aprobar si:

- RF activos != 69;
- aparece RF-016 o RF-063 como activo;
- RNF != 38;
- UC != 56;
- API P0 != 122;
- alguna API P0 no tiene `TEST-CT`;
- algún RF activo no tiene `TEST-RF`;
- algún RNF no tiene `TEST-RNF`;
- algún UC no tiene `TEST-UC`;
- P1 se suma a 122;
- hay PASS/FAIL reales;
- runtime/APK se presentan como existentes;
- TVCC carece de pruebas de fórmula, elegibilidad, versionado y ausencia de fabricación.

# 29. Estado de salida

```text
BE-LEG-11A v1.0-H

ESTADO:
CANDIDATO A BASELINE

RF:
69/69

RNF:
38/38

UC:
56/56

API P0:
122/122

P1 ACC explícitas:
4

RESULTADOS REALES:
0

11B:
NO PRODUCIDO

IMPLEMENTACIÓN:
NO AUTORIZADA
```
