# DV-05 — Casos de prueba

> **Versión:** v5 · producción documental por ChatGPT/Codex a pedido de Dirección · 2026-09-13
> **Identidad de casos:** `BE-LEG-11A v1.0-H`; oráculos complementados por sus fuentes propietarias 06/08/09
> **Estado de todos los casos:** `NOT_EXECUTED` · **Evidencia:** `— (11B)`
> **Norma:** estándar de calidad §2 · DV-05 nivel tesis + distinción

## Advertencia que gobierna todo este documento

Estos casos están **diseñados, no ejecutados**. No hay código verificado, ni despliegue, ni ejecución. El estado de los cincuenta y nueve es `NOT_EXECUTED`, y la columna de evidencia remite a `BE-LEG-11B`, que **no existe** hasta que haya implementación autorizada.

No se declara ningún resultado de ejecución. La verificación documental de esta versión no equivale a un resultado del software.

---

## Estrategia de niveles

| Nivel | Qué verifica | Cómo | Cuándo se automatiza |
|---|---|---|---|
| **Unitario** | invariantes de dominio y reglas puras: `SIN_DATO ≠ 0`, taxonomías cerradas, cálculo determinista | sin base de datos, sobre funciones puras | primero: son baratas y protegen el núcleo semántico |
| **Integración** | contratos contra PostgreSQL real: unicidades condicionales, idempotencia, transacciones | base efímera en CI, migraciones aplicadas | segundo: `ASR-02` y `ASR-03` solo se verifican con la base real |
| **E2E HTTP** | recorridos completos por la API: anti-enumeración, PDP, corte post-revocación | cliente HTTP contra API desplegada en test | tercero: exige el ambiente de `WP-002` |
| **E2E UI** | recorridos de usuario en Website y APK | automatizado donde el recorrido sea estable | cuarto |
| **Manual guiado** | accesibilidad, copy, estados vacíos y parciales | checklist con evidencia por captura | no se automatiza: costo/beneficio |

**Prioridad de automatización.** Primero todo lo que es garantía de seguridad y privacidad —`TEST-AUTH-*` completo—, porque es lo que el legajo promete y lo que un tribunal puede intentar romper en vivo. Después los invariantes de dominio. Después el recorrido crítico de cada vertical. La UI y la accesibilidad quedan en manual guiado.

---

## Criterio de selección

`BE-LEG-11A` define 69 `TEST-RF` + 38 `TEST-RNF` + 56 `TEST-UC` + 122 `TEST-CT` + 12 `TEST-TVCC` más las familias temáticas. Este documento **no los reproduce todos**: selecciona cincuenta y nueve con este criterio explícito.

1. **Los trece `TEST-AUTH` completos** — anti-enumeración, A3 ≠ B2, corte post-revocación, PDP no sustituible. Son las garantías centrales del Documento 08.
2. **Los nueve `TEST-DOM`** — invariantes de dominio visibles: `SIN_DATO ≠ 0`, corrección sin sobrescritura, planificado ≠ registrado.
3. **Los `TEST-RF` de seguridad y del núcleo demostrable** — identidad, verificación, vínculo, consentimiento, autorización contextual, el circuito de cada vertical, antropometría con corrección y anulación.
4. **Cuatro de cada familia del parche transversal** — `CAL`, `FRM`, `ANT` — para cubrir métodos, formularios y borrador/anulación.
5. **Al menos un caso por canal** según `DV-03`.

El inventario completo permanece en `BE-LEG-11A`; este documento lo referencia, no lo sustituye.

---

## Datos de prueba

La [ficha de fixtures](FICHA_FIXTURES.md) fija actores, reloj, valores, plantillas y doble técnico de cálculo. Son datos sintéticos diseñados; el seed no está implementado. Las credenciales no se guardan en esta documentación. No se admiten datos reales de salud ni datos personales anonimizados como sustituto.

Las variantes de cada caso parten de fixtures independientes. Los nombres de fixture son alias, no nuevos tokens del contrato. El ejecutor debe documentar su mapeo a IDs, campos y rutas de 09 al producir el seed, sin rediseñar el escenario ni relajar su oráculo.

## Casos seleccionados

Los 59 IDs se conservan; los 34 escenarios temáticos transcriben 11A sin reutilizar identificadores. Los 25 TEST-RF incorporan precondiciones, datos y acciones concretas. TEST-FRM-001 distingue request inválido rechazado de otro request válido. Los oráculos TEST-RF permanecen como baseline de 11A; ante la remisión histórica de TEST-RF-024 a Q-005, rigen además las restricciones de 08 y TEST-AUTH-007/008, no un acceso residual supuesto.

### `TEST-RF-001`

| Campo | Contenido |
|---|---|
| RF | RF-001 |
| UC | UC-P25 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Base sintética sin identidad para alta.demo@example.invalid; usuario no autenticado; registro local disponible. No se simula aceptación de A3 ni verificación profesional. |
| Pasos | 1. Contar identidades asociadas al email: 0. 2. Completar el alta A y observar identificador propio y estado de cuenta. 3. Repetir el alta B con el mismo email. 4. Consultar el conteo: permanece 1, sin segunda identidad. 5. Comprobar que ninguna alta verificó especialidades, otorgó A3/B2 ni habilitó datos de terceros. Registrar respuesta neutra según 09, sin fijar un mensaje de duplicado que enumere cuentas. |
| Datos de prueba (sintéticos) | Alta A: alias DEMO-A01, adulto sintético, email alta.demo@example.invalid y credencial generada solo para test conforme al validador vigente. Alta B: mismo email normalizado y otro alias DEMO-A02. Sin identidades de terceros vinculadas. |
| Resultado esperado (oráculo) | Con datos válidos se crea una sola identidad; un correo ya asociado no produce una segunda cuenta; el alta no verifica especialidades ni concede acceso a datos de terceros. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-006`

| Campo | Contenido |
|---|---|
| RF | RF-006 |
| UC | UC-P25 UC-P26 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Tres identidades demo existentes, autenticables y con estados distintos. No usar como precondición la ausencia de identidad del registro inicial. |
| Pasos | 1. Entrar por separado con P0, P1 y P2. 2. Consultar estado de cuenta y perfil. 3. Registrar por dimensión perfil, verificación, habilitación y vínculo. 4. Verificar que P0 muestra pendientes, P1 no se muestra habilitado y P2 no muestra autorización sobre A01. 5. Intentar abrir el recurso protegido de A01 con cada identidad: no hay acceso por el solo estado del perfil. |
| Datos de prueba (sintéticos) | DEMO-P0: perfil profesional incompleto, sin alcance verificado ni habilitación. DEMO-P1: Nutrición verificada, sin concesión de habilitación. DEMO-P2: Nutrición verificada/habilitada, sin vínculo con DEMO-A01. Mantener iguales las demás condiciones de acceso propio. |
| Resultado esperado (oráculo) | El usuario distingue cuenta, perfil, especialidad verificada, habilitación y vínculo; un estado incompleto no se presenta como habilitado. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-007`

| Campo | Contenido |
|---|---|
| RF | RF-007 |
| UC | UC-I11 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Website y APK de test disponibles tras gate; identidades demo de administrador, profesional y asesorado. Solo recursos sintéticos. |
| Pasos | 1. Desde la entrada pública del Website iniciar sesión como ADM y como PN y navegar mediante menús a sus funciones. 2. En APK iniciar sesión como A01 y llegar a Hoy sin escribir rutas. 3. Intentar desde A01 el request administrativo directo identificado por 09, aunque no exista botón. 4. Verificar navegación prevista para cada actor y denegación server-side al rol indebido. No equiparar ocultar un menú con autorizar una operación. |
| Datos de prueba (sintéticos) | DEMO-ADM con facultad administrativa; DEMO-PN con alcance Nutrición; DEMO-A01 con cuenta propia y A3. Sesiones independientes y una ruta administrativa del contrato disponible únicamente al rol pertinente. |
| Resultado esperado (oráculo) | El administrador y el profesional operan en Website; el asesorado accede a Hoy y sus funciones desde la APK; la visibilidad no reemplaza la autorización. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-010`

| Campo | Contenido |
|---|---|
| RF | RF-010 |
| UC | UC-P01 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | DEMO-PN autenticado, perfil existente, Nutrición declarada y sin verificación. Evidencia sintética claramente marcada como no válida para acreditación real. |
| Pasos | 1. Intentar presentar N0: no genera una presentación completa ni habilita el alcance. 2. Completar el requisito faltante y presentar N1. 3. Consultar identificador, versión de evidencia, fecha y estado PENDIENTE de esa presentación. 4. Intentar una operación profesional del alcance antes de resolución: denegada. 5. Comprobar que Entrenamiento no recibió verificación ni se alteró por presentar Nutrición. |
| Datos de prueba (sintéticos) | Presentación N1: alcance Nutrición con conjunto mínimo de evidencia exigido por su política completo, ordinal 1; presentación N0: copia sin un requisito obligatorio. Entrenamiento no declarado. Documento sintético EVID-DEMO-N1 y reloj controlado T0. |
| Resultado esperado (oráculo) | La versión presentada queda identificada; el profesional conoce fecha y estado; no puede operar esa especialidad o capacidad mientras no alcance el estado habilitante definido. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-012`

| Campo | Contenido |
|---|---|
| RF | RF-012 |
| UC | UC-P02 UC-P03 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | DEMO-ADM tiene sesión con facultad administrativa y autenticación reforzada aplicable; DEMO-PN tiene dos expedientes independientes. |
| Pasos | 1. En rama A aprobar N1 y verificar VERIFICADO solo en Nutrición, con administrador/fecha/versión/fundamento. 2. En rama B rechazar N1 y verificar RECHAZADO con expediente preservado. 3. En rama C aprobar y después suspender explícitamente Nutrición con motivo; verificar SUSPENDIDO y denegación de nuevas operaciones del alcance. 4. En las tres ramas comprobar T1 sin cambios y que no se presenta la resolución BE como certificación oficial. |
| Datos de prueba (sintéticos) | N1: Nutrición PENDIENTE, evidencia v1; T1: Entrenamiento PENDIENTE, evidencia v1. Tres ramas aisladas del fixture N1 para aprobar, rechazar y aprobar luego suspender. Motivos DEMO-RESOLUCION y DEMO-SUSPENSION; fecha T0; historial sintético previo consultable bajo autorización propia. |
| Resultado esperado (oráculo) | La resolución afecta solo la especialidad o capacidad seleccionada; una suspensión corta nuevas operaciones del alcance; el historial permanece consultable según política. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-070`

| Campo | Contenido |
|---|---|
| RF | RF-070 |
| UC | UC-I09 UC-I13 UC-P09 UC-P14 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | DEMO-PN autorizado para finalidad de cálculo y fuentes de DEMO-A01. Método técnico MET-DEMO v1 disponible exclusivamente en test según FICHA_FIXTURES.md; no es una fórmula clínica ni un catálogo productivo. |
| Pasos | 1. Inspeccionar versión y entradas exigidas. 2. Ejecutar v1 con M1 y luego M2; conservar ambos identificadores y snapshots, sin promedio. 3. Omitir BODY_WEIGHT: rechazar por inputs insuficientes. 4. Enviar MX: denegar sin revelar su contenido. 5. Adoptar explícitamente una corrida como referencia. 6. Comparar objetivo, evaluación, prescripción y plan antes/después: siguen sin cambio automático; sugerencia, ejecución, referencia y decisión profesional son objetos/actos distinguibles. |
| Datos de prueba (sintéticos) | MET-DEMO v1 requiere BODY_WEIGHT con origen directo admisible; M1=72.5 kg revelable, M2=73.0 kg revelable y MX perteneciente a DEMO-A02 no revelable. Dos Idempotency-Key distintas para dos corridas; objetivo/plan iniciales capturados para comparación. |
| Resultado esperado (oráculo) | El profesional puede identificar qué método y versión ejecuta y qué datos requiere; un método no se ejecuta si faltan inputs obligatorios o si su procedencia no es admisible; varias ejecuciones pueden coexistir sin promediarse ni sobrescribirse; una sugerencia, selección, ejecución o referencia adoptada permanece distinguible de la decisión profesional final; el resultado no modifica automáticamente requerimiento, objetivo, evaluación, prescripción ni plan; BE no impone una fórmula propia ni genera autónomamente el requerimiento/objetivo, preservando `DEC-046 §4.4/§4.9` e `INV-06-133`. |
| Fuente propietaria | `UC-I13` · `INV-06-133` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-071`

| Campo | Contenido |
|---|---|
| RF | RF-071 |
| UC | UC-I02 UC-I03 UC-P32 UC-P33 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | DEMO-PN con vínculo y B2 vigente para NUTRITION_EVALUATION; DEMO-A01 con A3. Plantilla BE controlada FT-DEMO v1, no builder libre. |
| Pasos | 1. Enviar request válido por API-FRM-03 e inspeccionar solicitante, finalidad, alcance, versión y campos obligatorios/opcionales. 2. Enviar request mixto: rechazar con FORM_REQUEST_NOT_ALLOWED, sin crear solicitud recortada. 3. A01 responde al request válido confirmando el valor previo y su procedencia. 4. Rectificar la respuesta. 5. Verificar SELF_REPORTED y vínculo request/template exactos, original preservado y sin nueva medición profesional, consentimiento, vínculo ni acceso ampliado. |
| Datos de prueba (sintéticos) | Plantilla con FIELD_N autorizado y FIELD_X no autorizado para este contexto. Request válido solicita solo FIELD_N. Request inválido solicita ambos con clave distinta. A01 tiene un valor previo autoinformado de FIELD_N; posterior corrección cambia su texto de DEMO-VALOR-1 a DEMO-VALOR-2. |
| Resultado esperado (oráculo) | La solicitud identifica quién pide la información, para qué y dentro de qué alcance; solo utiliza categorías/campos permitidos y distingue datos requeridos de opcionales cuando corresponda; la respuesta queda identificada como `self-reported` y no se convierte en medición profesional, diagnóstico ni autorización; una solicitud no amplía vínculo, consentimiento o acceso; una corrección/actualización posterior preserva historia; un dato preexistente del perfil puede reutilizarse o confirmarse sin perder su procedencia ni duplicarse silenciosamente como un origen indistinguible. |
| Fuente propietaria | `UC-P32/P33` · `REG-06-213` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-020`

| Campo | Contenido |
|---|---|
| RF | RF-020 |
| UC | UC-P07 |
| Canal | Apk |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | DEMO-A01 con A3 vigente; DEMO-PN verificado y habilitado; solicitud aceptada para Nutrición. No existe B2 para ese contexto ni alcance de Entrenamiento. |
| Pasos | 1. Antes del otorgamiento, intentar lectura protegida con PN: denegada. 2. A01 lee y otorga expresamente C1 para REL-N1 y finalidad nutricional. 3. Verificar actor, fecha, texto/versión, alcance y contexto conservados. 4. Repetir lectura nutricional con todos los demás gates válidos. 5. Intentar lectura de Entrenamiento: denegada. 6. Publicar C2 como fixture y verificar que no aparece automáticamente aceptada. |
| Datos de prueba (sintéticos) | Relación REL-N1; texto B2 versión C1 seleccionable; finalidad nutricional aplicable; instante T0. C2 es una versión posterior que todavía no fue aceptada por A01. |
| Resultado esperado (oráculo) | No se habilita acceso protegido sin consentimiento vigente; el sistema conserva evidencia de versión, actor y fecha; el alcance no se amplía de forma implícita; un vínculo aceptado solo se considera operativo para un propósito cuando concurren los consentimientos aplicables. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-021`

| Campo | Contenido |
|---|---|
| RF | RF-021 |
| UC | UC-I02 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Contexto positivo PN/A01 que satisface los siete insumos de RF-021. Cada variante negativa parte de una restauración independiente de esa base. |
| Pasos | 1. Ejecutar la operación protegida válida y registrar evidencia. 2. Ejecutar V1 a V7 por API directa, una alteración por corrida. 3. Confirmar que cada variante impide la operación y no produce mutación protegida. 4. Repetir por Website y APK donde el caso lo permita. 5. Alterar capabilities almacenadas en cliente: no cambia la decisión del servidor. No revelar datos internos del PDP en el error al usuario. |
| Datos de prueba (sintéticos) | REL-N1 y recurso nutricional RN1; variantes V1 rol inadecuado, V2 alcance profesional no verificado, V3 situación/habilitación no operativa, V4 vínculo PAUSADO, V5 B2 REVOCADO, V6 finalidad ajena y V7 alcance solicitado Entrenamiento. Conservar los otros seis insumos válidos en cada variante. |
| Resultado esperado (oráculo) | Una condición faltante impide la operación; la decisión se aplica en todas las superficies; la interfaz no puede otorgar permisos por sí misma. |
| Fuente propietaria | `UC-I02` · `08 §27` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-022`

| Campo | Contenido |
|---|---|
| RF | RF-022 |
| UC | UC-P08 |
| Canal | Apk |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PN/A01 autorizado en Nutrición; segunda relación PT/A01 autorizada en Entrenamiento; sesiones profesionales activas y recursos históricos sintéticos. |
| Pasos | 1. PN consulta RN1 antes de T1. 2. A01 revoca B2-N1 y espera la confirmación del acto. 3. PN con su sesión previa intenta nuevas lecturas y escrituras de RN1: ambas denegadas. 4. Verificar que vínculo e historia no fueron borrados y que el acto quedó auditado. 5. Comprobar que B2-T1 no fue revocado por cascada y que PT conserva únicamente su acceso autorizado. |
| Datos de prueba (sintéticos) | B2-N1 vigente, B2-T1 vigente, recurso RN1 y RT1. T0 anterior a revocación; T1 confirmación de revocación por A01. Dos requests nuevos de lectura/escritura iniciados después de confirmarse T1. |
| Resultado esperado (oráculo) | Tras la revocación, un profesional ya no realiza nuevas lecturas o escrituras protegidas del alcance; la evidencia histórica no se elimina silenciosamente; el efecto queda auditado. |
| Fuente propietaria | `UC-P08` · `08 §13` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-023`

| Campo | Contenido |
|---|---|
| RF | RF-023 |
| UC | UC-P05 UC-P06 UC-P07 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | A01, A02, PN y PT con relaciones sintéticas distintas; consulta propia de vínculos disponible. |
| Pasos | 1. Consultar desde A01 la lista y detalle: PN/Nutrición autorizado, PT/Entrenamiento revocado, sin relación de A02. 2. Consultar desde PN: solo relaciones propias N1/N2, no T1. 3. Contrastar cada estado con una lectura protegida correspondiente. 4. Verificar que la pantalla no informa acceso vigente cuando el servidor lo deniega por el consentimiento revocado. |
| Datos de prueba (sintéticos) | REL-N1 PN/A01 Nutrición con B2 vigente; REL-T1 PT/A01 Entrenamiento con B2 revocado; REL-N2 PN/A02 Nutrición vigente. Fechas y versiones de consentimiento identificables. |
| Resultado esperado (oráculo) | El asesorado identifica quién tiene acceso y con qué alcance; el profesional solo ve relaciones propias; la información coincide con la autorización efectiva. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-024`

| Campo | Contenido |
|---|---|
| RF | RF-024 |
| UC | UC-P06 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Dos copias aisladas de REL-N1 ACEPTADO, con B2 vigente y PN habilitado. Recurso histórico RN1 revelable antes de la transición. |
| Pasos | 1. Pausar el alcance en A y finalizarlo en B mediante actor autorizado. 2. Verificar PAUSADO/FINALIZADO y actor, fecha y motivo. 3. Intentar nuevas operaciones incompatibles: denegadas. 4. Intentar lectura profesional residual: no concederla por autoría, según 08 y TEST-AUTH-007/008. 5. Verificar historia conservada y ausencia de revocación implícita de B2. El titular mantiene solo la consulta propia admitida por su política. |
| Datos de prueba (sintéticos) | Rama A: pausa con motivo DEMO-PAUSA en T1. Rama B: finalización explícita con motivo DEMO-FIN en T1. El estado histórico de RN1 y el consentimiento se capturan antes. |
| Resultado esperado (oráculo) | La acción impide nuevas operaciones incompatibles con el estado; conserva autoría, fecha y motivo; la lectura posterior queda pendiente de Q-005 y Documento 08. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-026`

| Campo | Contenido |
|---|---|
| RF | RF-026 |
| UC | UC-P09 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PN autorizado para evaluación nutricional de A01; A3/B2, vínculo y finalidad vigentes. A02 no tiene relación con PN. |
| Pasos | 1. Registrar EN1 con fuentes y clases de dato identificadas. 2. Consultar la evaluación en la historia autorizada de A01. 3. Verificar A01/REL-N1, autoría y distinción entre informado, observado y calculado. 4. Ejecutar variante A02: denegación sin crear evaluación para el tercero. 5. Confirmar que el cálculo referenciado no se rotuló como medición profesional. |
| Datos de prueba (sintéticos) | Evaluación EN1 de A01: dato autoinformado texto DEMO-HABITO, observación profesional DEMO-OBS y referencia a corrida CAL1 técnica sintética claramente diferenciada. Fecha T0; relación REL-N1. Variante cambia adviseeId por A02. |
| Resultado esperado (oráculo) | La evaluación queda asociada al asesorado y al vínculo autorizado; distingue datos informados, observados y calculados; puede consultarse en la historia. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-031`

| Campo | Contenido |
|---|---|
| RF | RF-031 |
| UC | UC-I04 UC-I10 UC-P11 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PN/A01 autorizado; evaluación EN1 y objetivo ON1 identificables; plan nutricional PN1 con borrador válido modalidad A. Capacidad profesional configurada sintéticamente. |
| Pasos | 1. Validar y activar v1; consultar desde A01 la misma versión y contenido. 2. Preparar v2, activarla según continuidad autorizada y comprobar relación de sucesión, única vigencia y v1 inmutable. 3. En rama de capacidad agotada intentar activar un proceso nuevo para A01: rechazo; los procesos ya vigentes permanecen. 4. Capturar respuestas y comparación del snapshot antes/después, sin atribuir ejecución a esta ficha documental. |
| Datos de prueba (sintéticos) | PN1-v1 contiene Día tipo D1, Comida C1, Opción O1 e Ítem I1 del catálogo demo con cantidad 100 g. Borrador v2 cambia cantidad a 120 g. Rama positiva con capacidad disponible; rama negativa con límite 1 ya ocupado por otro asesorado y nuevo proceso para A01. |
| Resultado esperado (oráculo) | El asesorado consulta exactamente la versión activada; una modificación posterior produce continuidad trazable y no altera el histórico emitido; no existen vigencias contradictorias; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes. |
| Fuente propietaria | `UC-P11` · `INV-06-04` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-032`

| Campo | Contenido |
|---|---|
| RF | RF-032 |
| UC | UC-P12 |
| Canal | Apk |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | APK de test; A01 con A3 y plan nutricional activado, A02 con A3 y sin plan; sesiones propias independientes. |
| Pasos | 1. Entrar a Hoy desde el menú con A01 y abrir Nutrición. 2. Verificar que muestra PN1-v1, no el borrador v2. 3. Entrar con A02: estado explícito sin plan, no error ambiguo ni plan ajeno. 4. Inspeccionar respuesta/captura: sin evidencia de verificación profesional, gestión de capacidad u otros datos administrativos no autorizados. |
| Datos de prueba (sintéticos) | PN1-v1 activada con D1/C1/O1/I1; PN1-v2 BORRADOR con cantidad distinta; día de test T0. A02 no tiene plan activo ni relación con PN1. |
| Resultado esperado (oráculo) | La vista muestra la versión vigente y un estado claro cuando no existe plan; es accesible sin conocer rutas internas; no expone datos administrativos. |
| Fuente propietaria | `UC-P12` · `DEC-014` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-034`

| Campo | Contenido |
|---|---|
| RF | RF-034 |
| UC | UC-P13 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PN autorizado para revisar Nutrición de A01; plan y ejecuciones sintéticos para período T0 a T0+2 días. |
| Pasos | 1. Abrir y filtrar evidencia del período. 2. Contrastar prescrito y registrado, manteniendo día 3 como SIN_DATO y día 2 como descriptivo. 3. Consultar el conteo de revisiones: sigue 0 después de solo visualizar. 4. Navegar al registro común de revisión conservando período y referencias de evidencia; no confirmar en esta variante. 5. Verificar ausencia de score o evaluación automática de adherencia. |
| Datos de prueba (sintéticos) | Día 1: prescripción I1 100 g y registro 80 g; día 2: registro descriptivo DEMO-INGESTA; día 3: ningún registro. Cero revisiones válidas iniciales para el período. |
| Resultado esperado (oráculo) | El profesional puede identificar el período y la evidencia relevante, comparar lo planificado con lo ejecutado y pasar al registro común de revisión de RF-056; abrir la pantalla no cuenta como revisión. |
| Fuente propietaria | `UC-P13` · `REG-06-75` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-036`

| Campo | Contenido |
|---|---|
| RF | RF-036 |
| UC | UC-P14 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PT autorizado para evaluación de Entrenamiento de A01; PN sin ese alcance. Todos los datos son fixtures. |
| Pasos | 1. PT registra ET1 con contexto, autoría y procedencias. 2. Consultar ET1 en la historia autorizada y verificar que sigue siendo evaluación, no ejecución. 3. Confirmar conteo de ejecuciones sin incremento. 4. PN intenta consultar ET1 sin alcance Entrenamiento: denegado sin exposición de contenido. |
| Datos de prueba (sintéticos) | ET1 con antecedente autoinformado DEMO-EXPERIENCIA y observación DEMO-OBS-T, fecha T0. No hay sesiones ejecutadas. PT y PN usan sesiones separadas. |
| Resultado esperado (oráculo) | La evaluación es consultable en la historia y se distingue de la ejecución posterior; solo acceden actores autorizados. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-041`

| Campo | Contenido |
|---|---|
| RF | RF-041 |
| UC | UC-I04 UC-I10 UC-P16 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PT/A01 autorizado; ET1 y objetivo OT1; borrador de plan válido. Capacidad configurada en rama separada para el caso de rechazo. |
| Pasos | 1. Activar v1 y verificar la versión consultada por A01. 2. Sustituir mediante el recorrido permitido por v2 y comprobar sucesión explícita, única vigencia y snapshot v1 preservado. 3. En rama con capacidad agotada activar un proceso nuevo: rechazo sin interrumpir el de A02. 4. Inspeccionar relaciones versión/objetivo/evaluación y evidencia de rechazo sin persistencia parcial. |
| Datos de prueba (sintéticos) | PT1-v1: Bloque B1, Sesión S1, Ejercicio EX1, 3 series de 8 repeticiones, criterio RIR=2. PT1-v2 cambia repeticiones a 10; no añade criterio de intensidad. Rama negativa: límite 1 ocupado por A02, nuevo proceso A01. |
| Resultado esperado (oráculo) | El asesorado consulta la versión activada; no existen vigencias contradictorias; una sustitución queda relacionada con la anterior; la activación de un proceso nuevo se rechaza cuando excede la capacidad configurada en RF-066, sin interrumpir procesos vigentes. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-042`

| Campo | Contenido |
|---|---|
| RF | RF-042 |
| UC | UC-P17 |
| Canal | Apk |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | APK de test y A01 con plan de Entrenamiento vigente; reloj de test controlado. |
| Pasos | 1. Desde Hoy consultar D0: ausencia explícita de sesión. 2. Consultar D1: sesión pendiente de registro, no NO_REALIZADA inferida. 3. Consultar D2: ejecución registrada distinguible de lo planificado. 4. Verificar que no se muestra v2 como activa ni se requiere escribir una ruta interna. |
| Datos de prueba (sintéticos) | Día D0 sin sesión; D1 con S1 planificada sin registro; D2 con S2 y ejecución REGISTRADA, condición REALIZADA. Borrador futuro v2 con contenido distinto al activo. |
| Resultado esperado (oráculo) | La pantalla distingue ausencia de sesión, sesión pendiente y ejecución registrada; no requiere rutas internas; solo muestra datos autorizados. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-047`

| Campo | Contenido |
|---|---|
| RF | RF-047 |
| UC | UC-P19 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PA con capacidad antropométrica verificada y habilitada; A01 con A3, vínculo y B2 antropométrico; protocolo técnico de fixture identificado. |
| Pasos | 1. Registrar EA1 por el recorrido canónico y consultarla en la historia. 2. Verificar que M1/M2 son directas y CD1 es derivado, con unidad y procedencia. 3. En cada rama negativa intentar registrar una evaluación nueva: rechazo sin incorporar evaluación efectiva parcial. 4. Confirmar que la operación no abre un plan nutricional o de entrenamiento. |
| Datos de prueba (sintéticos) | Evaluación EA1 con masa M1=72.5 kg, talla M2=175 cm y cálculo derivado CD1 separado, fecha T0, procedencia DIRECT_MEASUREMENT para M1/M2. Ramas negativas: capacidad suspendida y B2 revocado por separado. |
| Resultado esperado (oráculo) | Las mediciones quedan diferenciadas de cálculos; se valida la capacidad, vínculo y consentimiento; la evaluación integra la historia autorizada. |
| Fuente propietaria | BE-LEG-11A §7 |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-048`

| Campo | Contenido |
|---|---|
| RF | RF-048 |
| UC | UC-E03 UC-I09 UC-P19 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PA autorizado; EA1 y medición directa M1 revelable; MET-DEMO v1 disponible solo como método técnico de test. |
| Pasos | 1. Ejecutar v1 sobre M1 y guardar identificador, entradas, método y resultado. 2. Hacer seleccionable v2 en el fixture sin alterar v1. 3. Reproducir la corrida histórica usando exactamente v1 y sus entradas: mismo resultado. 4. Verificar que no se recalculó el pasado con v2 y que salida/UI identifican método y profesional, sin diagnóstico ni atribución causal. |
| Datos de prueba (sintéticos) | M1=72.5 kg y MET-DEMO v1 con resultado esperado técnico 72.5 kg. V2 del mismo método de fixture produce un resultado deliberadamente distinto; V1 no cambia. Snapshots con autor, entrada, precisión y versión. |
| Resultado esperado (oráculo) | Un resultado histórico puede reproducirse; el método y responsable son identificables; no se presenta como diagnóstico ni causalidad. |
| Fuente propietaria | `UC-I09` · `T-06-34` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-049`

| Campo | Contenido |
|---|---|
| RF | RF-049 |
| UC | UC-P20 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PA/A01 autorizado; tres evaluaciones registradas y una métrica de masa compatible por protocolo/unidad. |
| Pasos | 1. Consultar evolución para EA1 y EA2: identificar diferencia descriptiva 0.5 kg y fuentes. 2. Incluir EA3: explicitar incompatibilidad o separar series, nunca fabricar una equivalencia. 3. Incluir fecha sin registro: SIN_DATO, no 0 kg. 4. Intentar el mismo request con actor no autorizado: denegar. 5. Verificar que la vista no produce score global de salud. |
| Datos de prueba (sintéticos) | EA1/T0: masa 72.5 kg; EA2/T0+7d: masa 73.0 kg mismo protocolo; EA3/T0+14d: resultado de otra métrica o método sin compatibilidad demostrada. Una cuarta fecha carece de medición. |
| Resultado esperado (oráculo) | La comparación usa mediciones compatibles o explicita diferencias; el acceso respeta alcance; no produce un score global de salud. |
| Fuente propietaria | `UC-P20` · `INV-06-176` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-050`

| Campo | Contenido |
|---|---|
| RF | RF-050 |
| UC | UC-E03 UC-I03 UC-I09 UC-I12 |
| Canal | Website |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | PA autorizado para corregir EA1; M1 registrada y CD1 dependiente identificable. Cadena histórica inicialmente sin correcciones. |
| Pasos | 1. Capturar M1/CD1 originales. 2. Confirmar corrección por UC-I12 con actor, fecha y motivo. 3. Verificar nuevo eslabón relacionado con original, sin overwrite. 4. Inspeccionar los derivados afectados según 06/09: referencia al input efectivo y conservación de CD1 histórico; no asumir recálculo invisible. 5. En variante obsoleta verificar conflicto/denegación conforme al contrato y que no se pisa la corrección válida. |
| Datos de prueba (sintéticos) | M1 original=72.5 kg en T0; corrección a 73.0 kg en T1 con motivo DEMO-ERROR-CARGA; CD1 fue calculado con M1. Segunda variante intenta corregir usando una versión de referencia obsoleta. |
| Resultado esperado (oráculo) | La corrección identifica actor y fecha; los cálculos afectados quedan relacionados o recalculados según política; no existe sobrescritura silenciosa. |
| Fuente propietaria | `UC-E03` · `REG-06-16.4` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-054`

| Campo | Contenido |
|---|---|
| RF | RF-054 |
| UC | UC-I03 UC-P24 UC-P31 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | A01 tiene eventos sintéticos en tres dominios; PN autorizado solo en Nutrición; titular habilitado para su propia consulta. |
| Pasos | 1. A01 consulta la línea temporal y abre origen de cada evento autorizado. 2. Distinguir N1 planificado/activado de N2 registrado, conservando dominio, autor, fecha y procedencia. 3. PN consulta la misma ventana: no recibe T1/A1 fuera de su autorización. 4. Verificar que el orden temporal usa la regla declarada y que recordedAt no reemplaza silenciosamente occurredAt. |
| Datos de prueba (sintéticos) | Evento N1 de activación nutricional, N2 de ingesta posterior, T1 de sesión ejecutada y A1 de medición antropométrica. N2 occurredAt=T0 y recordedAt=T0+1h para distinguir temporalidades; cada evento conserva autor y fuente. |
| Resultado esperado (oráculo) | Cada evento identifica fecha, dominio, autor y procedencia; la línea temporal no mezcla planificado con ejecutado; el acceso depende del actor. |
| Fuente propietaria | `UC-P24` · `T-06-24` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-RF-059`

| Campo | Contenido |
|---|---|
| RF | RF-059 |
| UC | UC-I08 UC-P10 UC-P15 UC-P22 |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E |
| Escenario 11A | — (TEST-RF: escenario definido por el RF) |
| Precondiciones | Ambiente de test aislado con adaptadores controlables y catálogo propio mínimo. Credenciales locales disponibles; no cortar proveedores reales ni infraestructura compartida. |
| Pasos | 1. En variante Google verificar acceso local. 2. En OFF preparar plan nutricional con catálogo propio/carga manual y continuar consulta, registro y revisión del núcleo. 3. En wger repetir continuidad del núcleo de Entrenamiento con EX-DEMO. 4. En Maps, para el recorrido de descubrimiento cuando esté incluido, conservar lista/ubicación textual sin inventar mapa operativo. 5. En Push verificar centro de novedades y núcleo operativos. 6. En cada variante mostrar degradación/fallback y registrar evidencia diferenciada del éxito del proveedor. |
| Datos de prueba (sintéticos) | Cinco variantes independientes: timeout de Google, Open Food Facts, wger, Maps y Push. Catálogo BE: alimento AL-DEMO y ejercicio EX-DEMO. Usuario con acceso local y novedad interna NOV-DEMO. Ningún proveedor devuelve un éxito ficticio. |
| Resultado esperado (oráculo) | La caída de Google, Open Food Facts, wger, Maps o Push no impide crear, consultar, ejecutar o revisar un plan; el usuario conoce el estado y la alternativa. |
| Fuente propietaria | `UC-I08` · `ASR-10` |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-001`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | login inválido neutral |
| Precondiciones | Cuenta demo `asesorado.demo` existente; identificador `noexiste@demo.test` que no corresponde a ninguna cuenta. |
| Pasos | 1. Verificar las precondiciones. 2. Intentar login con usuario inexistente y, por separado, con contraseña incorrecta sobre una cuenta existente. 3. Observar la respuesta del sistema. 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | `asesorado.demo@be.test` con contraseña válida e inválida; `noexiste@be.test` sin cuenta asociada. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Ambas respuestas son indistinguibles en código y cuerpo: el login no revela cuál factor falló. La comparación de tiempo no se exige: no está especificada en la fuente |
| Fuente propietaria | 08 §27 (anti-enumeración) · 09 §20.2.1 (precedencia de revelabilidad) — la igualdad de respuesta ante usuario inexistente y contraseña incorrecta es DERIVACIÓN MESA de esas reglas, no texto literal — escenario 11A: «login inválido neutral» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-002`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | registro no concede A3 |
| Precondiciones | Ninguna cuenta previa para el correo de prueba. |
| Pasos | 1. Verificar las precondiciones. 2. Completar el registro (A1 + A2) y consultar el estado de consentimiento de datos de salud. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Registro nuevo con correo `nuevo.demo@be.test`; A1 y A2 aceptados en el flujo. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | A3 figura como no otorgado: registrarse no lo concede |
| Fuente propietaria | 08 §12.2 · 09 CON-05 — escenario 11A: «registro no concede A3» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-003`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | A3 ausente bloquea sensible |
| Precondiciones | Cuenta creada con A1+A2; A3 sin otorgar; sesión iniciada. |
| Pasos | 1. Verificar las precondiciones. 2. Con A3 ausente, intentar leer un recurso de datos sensibles. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Cuenta `sinA3.demo@be.test`; un identificador de recurso sensible propio. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Denegado por PDP; la respuesta no revela si el recurso existe |
| Fuente propietaria | 08 §13 · RF-021 — escenario 11A: «A3 ausente bloquea sensible» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-004`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | revoke A3 corta prospectivamente |
| Precondiciones | Cuenta con A3 vigente y sesión activa; un recurso sensible accesible antes de revocar. |
| Pasos | 1. Verificar las precondiciones. 2. Revocar A3 y reintentar la lectura sensible en la misma sesión. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Cuenta `conA3.demo@be.test` con A3 vigente; token de sesión activo antes y después de revocar. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Denegada de inmediato: el corte es prospectivo y no depende de expirar la sesión |
| Fuente propietaria | 09 CON-08 · 08 §56 — escenario 11A: «revoke A3 corta prospectivamente» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-005`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | B2 sin A3 no produce acceso |
| Precondiciones | Profesional con B2 vigente sobre el asesorado; el asesorado revoca su A3 durante la prueba. |
| Pasos | 1. Verificar las precondiciones. 2. Profesional con B2 vigente accede a un asesorado cuyo A3 fue revocado. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Par profesional/asesorado demo con B2 vigente sobre nutrición; A3 del asesorado revocado durante la prueba. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Sin acceso: el B2 queda sin capacidad efectiva mientras A3 no satisfaga el PDP |
| Fuente propietaria | 08 §56 — escenario 11A: «B2 sin A3 no produce acceso» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-006`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | vínculo sin B2 no produce acceso |
| Precondiciones | Vínculo en estado ACEPTADO para el alcance, sin consentimiento B2 otorgado. |
| Pasos | 1. Verificar las precondiciones. 2. Vínculo aceptado sin consentimiento B2 otorgado para ese alcance. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Vínculo demo en ACEPTADO para alcance nutrición, sin registro de consentimiento B2. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Sin acceso al dominio: el vínculo no concede lo que corresponde al consentimiento |
| Fuente propietaria | 06 §7.5-01 · INV-06-01 — escenario 11A: «vínculo sin B2 no produce acceso» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-007`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | PAUSADO corta acceso profesional |
| Precondiciones | Vínculo ACEPTADO con B2 vigente; se pausa el alcance durante la prueba. |
| Pasos | 1. Verificar las precondiciones. 2. Pausar un alcance del vínculo y reintentar una operación de ese alcance. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Vínculo demo con B2 vigente; alcance entrenamiento pausado durante la prueba. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Operación incompatible cortada; el vínculo y su historia se conservan |
| Fuente propietaria | 06 §7.5 · UC-P06 — escenario 11A: «PAUSADO corta acceso profesional» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-008`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | FINALIZADO no deja lectura residual |
| Precondiciones | Vínculo con historia de operaciones; se finaliza durante la prueba. |
| Pasos | 1. Verificar las precondiciones. 2. Finalizar el vínculo y reintentar lectura del profesional. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Vínculo demo con dos operaciones registradas antes de finalizarlo. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Sin lectura residual: el acceso cesa; la evidencia histórica del titular permanece |
| Fuente propietaria | 7.5-05 · UC-P06 — escenario 11A: «FINALIZADO no deja lectura residual» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-009`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | actorCapabilities/context no reemplaza PDP |
| Precondiciones | Profesional autenticado; payload con campo de contexto de actor añadido manualmente. |
| Pasos | 1. Verificar las precondiciones. 2. Enviar actorCapabilities o contexto de actor en el payload del cliente. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Payload JSON de una operación protegida con `actorCapabilities:["PRO"]` agregado a mano. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El campo no reemplaza al PDP: la autorización se evalúa igual, y el contexto se rechaza o se ignora según lo que el schema de la operación defina |
| Fuente propietaria | 09 §20.2.2 contexto server-owned — escenario 11A: «actorCapabilities/context no reemplaza PDP» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-010`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | break-glass no da actoría profesional |
| Precondiciones | Cuenta administrativa con break-glass habilitado según 08 §28; asesorado demo con dominio nutricional. |
| Pasos | 1. Verificar las precondiciones. 2. Ejecutar una operación bajo break-glass administrativo sobre un dominio profesional. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Cuenta administrativa demo con break-glass habilitado; asesorado demo con dominio nutricional activo. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El break-glass no otorga actoría profesional: la operación de dominio sigue denegada |
| Fuente propietaria | 08 §28 · §56.6.1 — escenario 11A: «break-glass no da actoría profesional» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-011`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | cierre efectivo no permite nueva sesión |
| Precondiciones | Cuenta con cierre solicitado y efectivo; credenciales conocidas. |
| Pasos | 1. Verificar las precondiciones. 2. Tras cierre efectivo de cuenta, intentar iniciar una sesión nueva. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Cuenta `cerrada.demo@be.test` con cierre efectivo; sus credenciales conocidas. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Rechazado: el cierre efectivo impide nuevas sesiones |
| Fuente propietaria | ACC-P1-03 · 06 §5.8 — escenario 11A: «cierre efectivo no permite nueva sesión» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-012`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | cierre efectivo invalida sesiones actuales |
| Precondiciones | Cuenta con sesión activa iniciada antes de solicitar el cierre. |
| Pasos | 1. Verificar las precondiciones. 2. Tras cierre efectivo, usar una sesión que estaba activa antes del cierre. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Token de sesión emitido antes de solicitar el cierre de `cerrada.demo@be.test`. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Invalidada: el cierre invalida las sesiones actuales |
| Fuente propietaria | ACC-P1-03 · 06 §5.8 — escenario 11A: «cierre efectivo invalida sesiones actuales» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-AUTH-013`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | E2E HTTP |
| Escenario 11A | cierre finaliza vínculos por eventos, no delete silencioso |
| Precondiciones | Cuenta con al menos dos vínculos activos antes del cierre. |
| Pasos | 1. Verificar las precondiciones. 2. Tras cierre efectivo, consultar los vínculos del titular. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Cuenta con dos vínculos demo activos (nutrición y entrenamiento) antes del cierre. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Los vínculos se finalizan por eventos trazables; no hay borrado silencioso |
| Fuente propietaria | 06 §5.8 · REG-06-24 — escenario 11A: «cierre finaliza vínculos por eventos, no delete silencioso» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-001`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | SIN_DATO ≠ 0 |
| Precondiciones | Serie longitudinal sintética con un período intermedio sin medición. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar una serie longitudinal con un período sin dato. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Serie de tres puntos: mediciones en t0 y t2, sin medición en t1. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El hueco se expone como SIN_DATO; nunca como cero |
| Fuente propietaria | INV-06-176 — escenario 11A: «SIN_DATO ≠ 0» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-002`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | corrección no sobrescribe original |
| Precondiciones | Registro emitido con valor conocido; actor autorizado para corregir. |
| Pasos | 1. Verificar las precondiciones. 2. Registrar una corrección sobre un dato ya emitido. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Registro emitido con valor 72,5 kg; corrección propuesta a 71,8 kg. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El original permanece accesible; la corrección es aditiva y referencia la raíz |
| Fuente propietaria | REG-06-16 · T-06-22 — escenario 11A: «corrección no sobrescribe original» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-003`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | anulación no elimina original |
| Precondiciones | Medición VIGENTE con valor y autoría conocidos. |
| Pasos | 1. Verificar las precondiciones. 2. Anular un registro y consultar el original. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Medición VIGENTE de perímetro, 92 cm, con autoría y momento conocidos. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El original no se elimina: conserva valor, autoría y momento, con condición ANULADA |
| Fuente propietaria | RF-050 · REG-06-16.4 — escenario 11A: «anulación no elimina original» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-004`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | EN_PREPARACION ≠ REGISTRADA |
| Precondiciones | Evaluación en EN_PREPARACION posterior a una REGISTRADA del mismo asesorado. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar la última evaluación registrada existiendo un borrador posterior. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Evaluación REGISTRADA del 01-03 y borrador EN_PREPARACION del 15-03 del mismo asesorado. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El borrador no aparece: EN_PREPARACION no equivale a REGISTRADA |
| Fuente propietaria | REG-06-215 · T-06-78 — escenario 11A: «EN_PREPARACION ≠ REGISTRADA» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-005`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | nueva CalculationRun no sobrescribe corrida |
| Precondiciones | Cálculo ya ejecutado sobre inputs conocidos; método con versión VIGENTE. |
| Pasos | 1. Verificar las precondiciones. 2. Ejecutar un cálculo nuevo sobre los mismos inputs. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Método `MET-DEMO` v1 y dos corridas sobre los mismos tres inputs. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Se crea una corrida nueva; la anterior permanece sin sobrescribirse |
| Fuente propietaria | REG-06-205 — escenario 11A: «nueva CalculationRun no sobrescribe corrida» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-006`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | referencia profesional no muta corrida |
| Precondiciones | Corrida de cálculo existente, no adoptada aún como referencia. |
| Pasos | 1. Verificar las precondiciones. 2. Adoptar una corrida como referencia profesional. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Corrida existente de `MET-DEMO` v1 con resultado conocido, no adoptada aún. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | La corrida no se modifica ni se borra: la referencia es una relación |
| Fuente propietaria | REG-06-207 — escenario 11A: «referencia profesional no muta corrida» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-007`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | PRIMARY/SECONDARY no pondera |
| Precondiciones | Ejercicio con una zona PRINCIPAL y una SECUNDARIA declaradas. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar el volumen por zona muscular con roles PRINCIPAL y SECUNDARIO. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Ejercicio `EJ-DEMO` con zona PRINCIPAL = pectoral y SECUNDARIA = tríceps. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Los roles se muestran diferenciados y no se ponderan entre sí |
| Fuente propietaria | T-06-70 · DEC-047 — escenario 11A: «PRIMARY/SECONDARY no pondera» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-008`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | occurredAt ≠ recordedAt |
| Precondiciones | Hecho con fecha de ocurrencia anterior al momento de registro. |
| Pasos | 1. Verificar las precondiciones. 2. Registrar un hecho cuya ocurrencia es anterior al registro. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Ingesta con ocurrencia 10-03 13:00 y registro 11-03 09:00. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Ambos momentos se conservan por separado; ninguno sustituye al otro |
| Fuente propietaria | T-06-24 — escenario 11A: «occurredAt ≠ recordedAt» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-DOM-009`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P0 |
| Nivel | Integración |
| Escenario 11A | nueva versión no reescribe historia |
| Precondiciones | Plan con versión ACTIVADA y contenido conocido. |
| Pasos | 1. Verificar las precondiciones. 2. Emitir una versión sucesora de un plan activado. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Plan nutricional con versión v1 ACTIVADA y contenido conocido; v2 a emitir. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | La historia previa permanece íntegra: la nueva versión sucede, no reescribe |
| Fuente propietaria | INV-06-04 · §4.5.1 — escenario 11A: «nueva versión no reescribe historia» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-CAL-001`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | versión exacta de método |
| Precondiciones | Método con dos versiones: una usada en la corrida, otra vigente al consultar. |
| Pasos | 1. Verificar las precondiciones. 2. Ejecutar un método y consultar qué versión quedó registrada en la corrida. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Método `MET-DEMO` con v1 (usada en la corrida) y v2 (vigente al consultar). Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | La corrida conserva la versión exacta del método utilizada, no la vigente al consultar |
| Fuente propietaria | REG-06-205 — escenario 11A: «versión exacta de método» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-CAL-002`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | disponible ≠ admisible |
| Precondiciones | Input existente cuya procedencia no figura entre las admisibles del método. |
| Pasos | 1. Verificar las precondiciones. 2. Ejecutar un método con un input existente pero de procedencia no admisible. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Input de peso con procedencia SELF_REPORTED, siendo el método admisible solo para medición directa. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Rechazado: disponibilidad no equivale a admisibilidad |
| Fuente propietaria | REG-06-204 — escenario 11A: «disponible ≠ admisible» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-CAL-003`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | sourceRef oculto no funciona como oráculo |
| Precondiciones | Identificador de un recurso real perteneciente a otro asesorado. |
| Pasos | 1. Verificar las precondiciones. 2. Usar un sourceRef de un recurso no revelable para el actor. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Identificador de una medición real perteneciente a otro asesorado del seed. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | 404 idéntico al de un identificador inexistente: el campo no funciona como oráculo de existencia |
| Fuente propietaria | 09 §20.2.1 · CAL-01 — escenario 11A: «sourceRef oculto no funciona como oráculo» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-CAL-004`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | múltiples runs coexisten |
| Precondiciones | Método vigente; dos conjuntos de inputs distintos y válidos. |
| Pasos | 1. Verificar las precondiciones. 2. Ejecutar el mismo método dos veces con distintos inputs. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Método `MET-DEMO` v1; conjunto A y conjunto B de inputs, ambos válidos. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Ambas corridas coexisten y son consultables por separado |
| Fuente propietaria | REG-06-205 — escenario 11A: «múltiples runs coexisten» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-FRM-001`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | E2E HTTP |
| Escenario 11A | template ≠ permiso |
| Precondiciones | DEMO-PN con sesión y refuerzo exigido por API-FRM-03, vínculo ACTIVO con DEMO-A01 y B2 para NUTRITION_EVALUATION en NUTRITION. FT-DEMO v1 seleccionable; FIELD_N autorizado y FIELD_X fuera de autorización. Fixture definido en FICHA_FIXTURES.md. |
| Pasos | 1. Capturar número de solicitudes de A01. 2. Enviar A a POST /api/v1/advisees/{adviseeId}/form-requests. 3. Afirmar HTTP 422 y FORM_REQUEST_NOT_ALLOWED, sin solicitud creada ni campos ocultos revelados. 4. Verificar conteo sin cambios: no aceptar un 201 con FIELD_X eliminado. 5. Enviar B con clave distinta y todos los gates válidos. 6. Afirmar 201 y solicitud que contiene únicamente FIELD_N. B es otro request preparado previamente por el cliente, no una corrección automática de A. |
| Datos de prueba (sintéticos) | Request A: templateVersionId=FT-DEMO-v1, purpose=NUTRITION_EVALUATION, scope=NUTRITION, requestedFieldCodes=[FIELD_N,FIELD_X], requiredFieldCodes=[FIELD_N]; Idempotency-Key A. Request B independiente: requestedFieldCodes=[FIELD_N], requiredFieldCodes=[FIELD_N]; Idempotency-Key B. Alias remapeados por seed futuro a códigos/IDs admitidos, sin cambiar la partición autorizado/no autorizado. |
| Resultado esperado (oráculo) | La plantilla no concede permiso. A se rechaza íntegramente con HTTP 422 / FORM_REQUEST_NOT_ALLOWED y no crea una solicitud parcial ni revela campos ocultos. B, que solicita solo campos autorizados y satisface las demás precondiciones, crea la solicitud con HTTP 201. Selección previa del cliente y validación del servidor son actos distintos. |
| Fuente propietaria | BE-LEG-11A: escenario TEST-FRM-001; BE-LEG-09 v0.16.1 §22.3 / API-FRM-03; BE-LEG-08: autorización contextual. |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-FRM-002`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | E2E HTTP |
| Escenario 11A | request valida B2/propósito/pertinencia |
| Precondiciones | Profesional sin B2 vigente, o con B2 sin finalidad declarada para ese uso. |
| Pasos | 1. Verificar las precondiciones. 2. Crear una solicitud sin B2, sin finalidad o sin pertinencia declarada. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Profesional demo sin B2 vigente sobre el asesorado; misma plantilla de cinco campos. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Rechazada: la creación valida las tres condiciones |
| Fuente propietaria | 08 §56.4 · REG-06-211 — escenario 11A: «request valida B2/propósito/pertinencia» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-FRM-003`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | E2E HTTP |
| Escenario 11A | respuesta SELF_REPORTED |
| Precondiciones | Solicitud respondida por el asesorado. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar la procedencia de una respuesta del asesorado. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Solicitud respondida por el asesorado con tres campos completados. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Figura como SELF_REPORTED: no es medición profesional ni diagnóstico |
| Fuente propietaria | REG-06-212 — escenario 11A: «respuesta SELF_REPORTED» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-FRM-004`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | E2E HTTP |
| Escenario 11A | reutilización de perfil conserva procedencia |
| Precondiciones | Dato presente en el perfil propio del asesorado y solicitado además por formulario. |
| Pasos | 1. Verificar las precondiciones. 2. Reutilizar un dato de perfil propio dentro de una respuesta. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Dato de altura presente en el perfil propio y solicitado además por formulario. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | La procedencia de cada origen se conserva: no se fusionan ni se duplican indistinguibles |
| Fuente propietaria | REG-06-212 · UC-P25 — escenario 11A: «reutilización de perfil conserva procedencia» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-ANT-001`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | directo ≠ derivado |
| Precondiciones | Evaluación con al menos una medición directa y un cálculo derivado de ella. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar una evaluación con mediciones directas y cálculos derivados. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Evaluación con perímetro de cintura medido y porcentaje de grasa derivado de él. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | Se distinguen: el derivado declara método, versión e inputs; el directo, protocolo y unidad |
| Fuente propietaria | T-06-33 · T-06-34 — escenario 11A: «directo ≠ derivado» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-ANT-002`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | draft no aparece como registrada |
| Precondiciones | Evaluación REGISTRADA y, con fecha posterior, otra EN_PREPARACION. |
| Pasos | 1. Verificar las precondiciones. 2. Consultar la última evaluación registrada existiendo un borrador. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Evaluación REGISTRADA del 01-03 y borrador del 15-03. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El borrador no aparece como registrada ni alimenta la evolución confirmada |
| Fuente propietaria | REG-06-215 — escenario 11A: «draft no aparece como registrada» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-ANT-003`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | register de draft es atómico |
| Precondiciones | Evaluación en borrador con mediciones completas y autorización vigente. |
| Pasos | 1. Verificar las precondiciones. 2. Registrar una evaluación que estaba en borrador. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Borrador con tres mediciones completas y autorización vigente del profesional. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | La transición a REGISTRADA es atómica: o queda registrada completa, o no cambia de estado |
| Fuente propietaria | 06 §13 · 09 §23.6 API-ANT-11 (registrar/finalizar borrador) — escenario 11A: «register de draft es atómico» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

### `TEST-ANT-004`

| Campo | Contenido |
|---|---|
| RF | — |
| UC | — |
| Canal | Transversal |
| Prioridad | P1 |
| Nivel | Integración |
| Escenario 11A | correction preserva original |
| Precondiciones | Medición registrada con valor conocido; actor con UC-I12 disponible. |
| Pasos | 1. Verificar las precondiciones. 2. Corregir una medición de una evaluación registrada. 3. Observar la respuesta del sistema (código, cuerpo y estado resultante). 4. Contrastar con el resultado esperado. 5. Registrar evidencia en 11B. |
| Datos de prueba (sintéticos) | Medición registrada de 92 cm; corrección a 91 cm con motivo. Todo generado por seed; ningún dato personal real. |
| Resultado esperado (oráculo) | El valor original permanece; la corrección es aditiva y trazable |
| Fuente propietaria | UC-I12 · T-06-22 — escenario 11A: «correction preserva original» |
| Estado | NOT_EXECUTED |
| Evidencia | — (11B) |

## Diez casos adversariales para ejecución en vivo

Cuando exista demo, estos diez pueden ejecutarse **delante del tribunal**. Cada uno intenta romper una garantía que el legajo promete, y el resultado esperado es lo que el sistema debe responder.

| # | Intento | Resultado que el legajo garantiza | Fuente |
|---|---|---|---|
| 1 | Pedir un recurso con un ID ajeno adivinado | `404`, idéntico a un ID inexistente: no revela que existe | `09 §20.2.1` anti-enumeración |
| 2 | Leer datos de un asesorado tras revocar su consentimiento | Corte prospectivo inmediato: `404` o denegación, sin depender de expirar la sesión | `08 §56` · `CON-08` |
| 3 | Registrarse y consultar contenido sensible sin otorgar A3 | Bloqueado por PDP: registrarse no presume consentimiento de datos de salud | `TEST-AUTH-002/003` |
| 4 | Enviar `professionalId` alterado desde el cliente | Ignorado: el actor se resuelve en el servidor, nunca del payload | `TEST-AUTH-009` |
| 5 | Ocultar un botón en el navegador y llamar la API igual | Denegado por PDP: la visibilidad no es control de acceso | `RNF-SEC-001` |
| 6 | Anular dos veces la misma medición | La segunda no produce un segundo efecto ni un error nuevo | `TEST-ANT-*` idempotencia |
| 7 | Consultar una evolución con un hueco de datos | Muestra `SIN_DATO` explícito, nunca cero ni interpolación | `INV-06-176` |
| 8 | Buscar un plan ya activado y editarlo | Denegado: lo emitido es inmutable; corregir exige nueva versión | `INV-06-04` |
| 9 | Acceder a un vínculo `PAUSADO` | Corta las operaciones incompatibles sin borrar la relación | `TEST-AUTH-007` |
| 10 | Consultar un borrador de evaluación de otro profesional | No aparece: ni como bloqueado, ni como existente | `TEST-ANT-*` · `08 §56.5` |

Esta tabla es la forma más contundente de mostrar que la seguridad del proyecto no es declarativa. **Ninguno de los diez está ejecutado**: son casos diseñados, como todos los de este documento.

---

## Matriz de cobertura

| Alcance | Casos en este documento | Casos en `BE-LEG-11A` |
|---|---|---|
| Seguridad y autorización | 13 (`TEST-AUTH` completo) | 13 |
| Invariantes de dominio | 9 (`TEST-DOM` completo) | 9 |
| Requisitos funcionales | 25 de los P0 críticos | 69 |
| Métodos de cálculo | 4 | 7 |
| Formularios | 4 | 7 |
| Antropometría | 4 | 11 |
| Contratos API | referenciados | 122 |
| UX y accesibilidad | manual guiado | 11 |
| Runtime y APK | fuera de alcance sin implementación | 17 |

Los requisitos no incluidos en la selección **tienen test asignado en `BE-LEG-11A`**: quedan fuera de esta muestra, no de la cobertura.
