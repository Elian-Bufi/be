# BE-LEG-05 — Casos de uso e historias

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Versión maestra:** `v0.15`  
> **Estado:** `BORRADOR DE PARCHE TRANSVERSAL — NO APROBADO`  
> **Fecha del parche:** `2026-09-07`  
> **Fuente de requisitos:** `BE-LEG-04 v0.4.2.1 APROBADO DOCUMENTALMENTE — NO CANONIZADO POR ACTA-DIR-022`  
> **Arquitectura aplicada:** `BE-LEG-05 v0.2.9`  
> **Glosario aplicado:** `BE-LEG-05 v0.1.8`  
> **Casos de uso:** `56`  
> **Requisitos funcionales:** `69`  
> **Reglas transversales:** `5`  
> **Baseline previa:** `v0.14 APROBADA Y CANONIZADA`  
> **Canonización Git de v0.15:** `NO AUTORIZADA`  
> **Numeración contra esquema canónico externo:** `NO EVIDENCIADA`

---

> **Control de cambio v0.15:** `ACTA-DIR-022` aprueba documentalmente BE-LEG-04 v0.4.2.1 y autoriza este parche sobre la baseline canónica BE-LEG-05 v0.14 (`1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d`). La modificación queda limitada a CAP-MET, CAP-DAT, ANT-VOID y reconciliaciones cuantitativas/trazables necesarias. `UC-P19 V04` debe preservarse.

## 1. Control documental

### 1.1. Propósito del maestro

Consolidar en un único artefacto el vocabulario, la arquitectura, los casos de uso, las historias prioritarias, las reglas transversales y los índices de trazabilidad del Documento 05.

### 1.2. Criterio de ensamblado

- un único encabezado H1;
- cada artefacto fuente desciende un nivel completo;
- máximo H6;
- numeración jerárquica continua;
- changelogs retirados del cuerpo;
- historial consolidado en un único apéndice;
- auditoría repetida sobre el archivo maestro, no sobre las partes.

### 1.3. Estado de custodia

- Los hashes de este registro se calcularon sobre los archivos locales utilizados para el ensamblado.
- Las referencias de `BE-LEG-02` y `BE-LEG-03` mantienen la custodia declarada en el glosario.
- La numeración contra el esquema canónico externo permanece **NO EVIDENCIADA** porque ese artefacto no está disponible localmente.
- Ninguna afirmación de verificación contra repositorio o commit se incorpora sin el artefacto correspondiente.

### 1.4. Decisiones rectoras

| Decisión | Aplicación |
|---|---|
| `DEC-042` | Alta profesional por etapas y validación antes de G4 |
| `DEC-043` | Única definición de revisión profesional válida |
| `DEC-044` | Operación antropométrica independiente |
| `DEC-045` | Reclasificación `UC-T → TR` |
| `ACTA-DIR-021 / TX-01…TX-09` | Ratificación del mapa transversal; métodos profesionales, formularios, ANT-DRAFT y ANT-VOID |
| `ACTA-DIR-022` | Aprobación de 04 v0.4.2.1 y autorización acotada de este parche |

### 1.5. Registro de fuentes

| Orden | Artefacto | Archivo fuente | SHA-256 |
|---:|---|---|---|
| 1 | Glosario y control terminológico | `BE_LEG_05_v0.1.8_GLOSARIO_CIERRE_COMPLEMENTARIO.md` | `b320de7d4d0ef90435ec8096584b150d03db657fbdc86d1f5fd70d70e39e47c6` |
| 2 | Arquitectura de casos de uso | `BE_LEG_05_v0.2.9_ARQUITECTURA_CIERRE_COMPLEMENTARIO.md` | `2dd619935b48b81c510a334f5f156565e3d2b58812e09425a0ae924a69ca4eb3` |
| 3 | Bloque 01 — Alta profesional | `BE_LEG_05_v0.3.4_BLOQUE_01_JERARQUIA_NORMALIZADA.md` | `5dda2ada795509aa9ce2d8e31aef9df0dae40d4db99e8ec73266ca611d0fb35c` |
| 4 | Bloque 02 — Vínculo profesional–asesorado | `BE_LEG_05_v0.4.4_BLOQUE_02_REGLAS_TR.md` | `889c50a7d9b3ce8801b89b0d3b0cef103971f5757532aa1e3bce294676b550d0` |
| 5 | Bloque 03 — Consentimiento y autorización | `BE_LEG_05_v0.5.2_BLOQUE_03_REGLAS_TR.md` | `adde0a8aeb9dda7c50ee58b38ffacadd0f60277bc2a690234276e74880e10c3d` |
| 6 | Bloque 04 — Circuito nutricional hasta ejecución | `BE_LEG_05_v0.6_BLOQUE_04_CIRCUITO_NUTRICIONAL_HASTA_EJECUCION.md` | `83afb9d4d33d4cb3d2a647df0dcb457d767d25919544195be7cdbc3955d042e9` |
| 7 | Bloque 05 — Revisión y continuidad nutricional | `BE_LEG_05_v0.7_BLOQUE_05_REVISION_Y_CONTINUIDAD_NUTRICIONAL.md` | `0ccc4103ce5986b7cebbe901b0f6e79329f69e162bde581c744f5e0fc8f6fd58` |
| 8 | Bloque 06 — Circuito de entrenamiento | `BE_LEG_05_v0.8.1_BLOQUE_06_REFACTOR_CORRECCION_COMUN.md` | `7392f0c547e8df2dd85500a4e6f2c72fef046223294e7554f092ce4d2fce6d84` |
| 9 | Bloque 07 — Antropometría transversal y descubrimiento limitado | `BE_LEG_05_v0.9_BLOQUE_07_ANTROPOMETRIA_Y_DESCUBRIMIENTO_LIMITADO.md` | `1d2f4a34da32e8680b17f632543b7602bf3a5106fb5078cbe81f3758f957682c` |
| 10 | Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal | `BE_LEG_05_v0.10_BLOQUE_08_CARTERA_DASHBOARD_Y_PROGRESO.md` | `07b1cd51e878766fe26da02b40a98d6ae843c82f7917090df4fabde6dc40c01a` |
| 11 | Cierre complementario A — Identidad, acceso y ciclo de cuenta | `BE_LEG_05_v0.11_CIERRE_A_IDENTIDAD_ACCESO_CUENTA.md` | `58ef1c801d83c80a57d98ab01d5cbb730ce6e16208c698da64954b088ffb63e7` |
| 12 | Cierre complementario B — Administración, capacidad y comunicaciones | `BE_LEG_05_v0.12_CIERRE_B_ADMIN_CAPACIDAD_COMUNICACIONES.md` | `12185570518592bfb4eaf797db08078a5bbf11dfaa9129eb002c21b9e8492ecb` |
| 13 | Casos incluidos compactos y soporte analítico | `BE_LEG_05_v0.13_CASOS_INCLUIDOS_Y_UC_S01.md` | `970cf4dcfa46d3bc1bc2829cfabe86c5d521a5a103b48ceedfb95b158aac198f` |

### 1.6. Estructura del documento

1. Glosario.
2. Arquitectura.
3. Bloques funcionales 01–08.
4. Cierres complementarios A y B.
5. Casos incluidos y soporte.
6. Reglas transversales.
7. Índice de trazabilidad.
8. Historial consolidado.
9. Parche transversal v0.15 integrado en los bloques propietarios e índices del maestro.

---

### 1.7. Control de cambio v0.14 → v0.15

Baseline:

```text
BE-LEG-05 v0.14
SHA-256 1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d
APROBADA + CANONIZADA
53 UC
67 RF
5 TR
```

Parche candidato:

```text
BE-LEG-05 v0.15
56 UC
69 RF
5 TR
NO APROBADO
NO CANONIZADO
```

Impacto normativo permitido:

```text
CAP-MET:
UC-I13
+ invocación desde UC-P09 / UC-P14
+ UC-I09 especializa UC-I13

CAP-DAT:
UC-P32
UC-P33

ANT-DRAFT:
UC-P19 V04 — SIN CAMBIO NORMATIVO

ANT-VOID:
UC-E03 amplía “corregir” → “corregir o anular”
SIN NUEVO UC
```

Toda afirmación cuantitativa vigente de este maestro se consolida en §16.4. Los estados históricos embebidos en artefactos fuente se conservan como antecedentes cuando corresponda.

## 2. Glosario y control terminológico

*Fuente ensamblada: `BE_LEG_05_v0.1.8_GLOSARIO_CIERRE_COMPLEMENTARIO.md`.*

### 2.1. Propósito

Este instrumento evita que cada bloque del Documento 05 introduzca sinónimos incompatibles para conceptos ya aprobados.

No crea entidades, estados técnicos ni reglas de persistencia. Su función es:

- conservar el vocabulario aprobado;
- declarar equivalencias editoriales;
- separar conceptos próximos;
- detectar términos ambiguos o prohibidos;
- facilitar la trazabilidad `RF ↔ UC ↔ 06 ↔ 08 ↔ 12`.

Ante contradicción prevalece el documento propietario correspondiente.

---

### 2.2. Reglas generales

1. El término de la columna **Término canónico** debe utilizarse en:
   - nombres de casos;
   - postcondiciones;
   - reglas;
   - trazabilidad;
   - criterios de aceptación.
2. Un sinónimo permitido puede utilizarse en lenguaje natural solo cuando no crea una categoría paralela.
3. Los términos prohibidos no deben aparecer como equivalentes funcionales.
4. Los estados escritos en mayúsculas representan semántica funcional mínima aprobada; la denominación técnica definitiva pertenece a `06`.
5. “Revisión administrativa” y “revisión profesional válida” siempre deben escribirse calificadas.
6. “Activación” siempre debe indicar qué se activa.
7. “Alcance” debe especificar dominio, capacidad o finalidad cuando exista riesgo de ambigüedad.
8. “Autoría” y “procedencia” no son sinónimos.
9. “Cuenta”, “identidad” y “perfil” no deben intercambiarse.
10. Cada nuevo término recurrente debe incorporarse aquí antes de propagarse a varios bloques.

---

### 2.3. Tabla de términos controlados

| Término canónico | Definición operativa para 05 | Fuente propietaria o vinculante | Sinónimos permitidos o uso explicativo | Términos prohibidos o ambiguos |
|---|---|---|---|---|
| **Asesorado** | Persona adulta titular de su cuenta e información, destinataria del proceso y usuaria de la APK. | 02 §6 “Público objetivo y actores”; 03 §4 “Actores económicos y tratamiento de datos”; 03 §15 “Cuenta del asesorado”; 04 RF-017 | persona asesorada, titular, participante — solo cuando el contexto sea inequívoco | paciente, cliente como sinónimo funcional, usuario final |
| **Identidad BE** | Identidad única y persistente, independiente de profesional, especialidad o paquete comercial, a la que pueden asociarse métodos de acceso. | 03 §4 “Actores económicos y tratamiento de datos”; 03 §15 “Cuenta del asesorado”; 04 RF-001 a RF-006 | identidad longitudinal, identidad — cuando BE ya esté implícito | cuenta profesional como propietario de la identidad, perfil, método de acceso |
| **Especialidad** | Dominio profesional inicial de Nutrición o Entrenamiento, declarado y verificado de forma independiente. | 02 §6 “Público objetivo y actores”; 04 RF-009, RF-012, RF-015 | dominio profesional — solo en explicaciones generales | rol, paquete, habilitación, Antropometría como tercera especialidad |
| **Capacidad antropométrica transversal** | Capacidad profesional separada de Nutrición y Entrenamiento, sujeta a evidencia, verificación, habilitación y autorización aplicables. | 02 §6 “Público objetivo y actores”, §11 “Alcance funcional del MVP” y §12 “Descubrimiento limitado de servicios antropométricos”; 03 §17 “Antropometría”; 04 RF-047, RF-051, RF-067 | capacidad antropométrica, Antropometría — cuando se refiera inequívocamente a la capacidad | tercera especialidad, rol antropometrista como categoría técnica no aprobada |
| **Verificación profesional** | Procedimiento administrativo trazable que revisa evidencia por especialidad o capacidad. Una resolución favorable materializa la semántica `VERIFICADO`. No es certificación oficial ni garantía de competencia. | 03 §16 “Verificación profesional”; 04 RF-010 a RF-015; DEC-005; DEC-042 | verificación; aprobación administrativa únicamente como explicación natural de una verificación favorable | validación clínica, certificación oficial, aval institucional, “aprobado” como estado técnico paralelo |
| **Revisión administrativa** | Actividad del administrador que examina una versión presentada y resuelve la verificación de un alcance. | 04 RF-011 y RF-012; DEC-042 | revisión de solicitud, revisión de evidencia administrativa | revisión sin calificar; revisión profesional |
| **Habilitación** | Condición académica o comercial separada de identidad, verificación, vínculo, consentimiento y autorización. | 03 §4 “Actores económicos y tratamiento de datos”; 03 §14 “Capacidad y asesorado activo”; 04 RF-015 y RF-066 | habilitación académica, habilitación comercial, condición de capacidad | verificación, especialidad, rol, permiso de datos |
| **Vínculo** | Relación explícitamente solicitada e individualmente aceptada entre profesional y asesorado para especialidad/capacidad y finalidad determinadas. | 02 §11 “Alcance funcional del MVP”; 04 RF-018 a RF-025; DEC-003 | relación profesional–asesorado — en explicación | asignación automática, asociación implícita, consentimiento |
| **Consentimiento vigente** | Manifestación informada, específica, versionada y revocable del asesorado para datos, dominios y finalidades aplicables. | 02 §11 “Alcance funcional del MVP”; 04 RF-020, RF-022 y RF-023; DEC-006 | consentimiento específico, consentimiento aplicable | permiso general, aceptación del vínculo, autorización automática |
| **Autorización contextual** | Decisión aplicada a cada operación protegida considerando rol, especialidad/capacidad, estado, vínculo, consentimiento, finalidad y alcance vigentes. | 02 §11 “Alcance funcional del MVP” y §15 “Criterios de éxito”; 04 RF-015 y RF-021; DEC-006 | decisión de autorización, operación autorizada/denegada | visibilidad de pantalla, rol aislado, login como autorización suficiente |
| **Alcance** | Especialidad, capacidad, conjunto de datos o finalidad concretos sobre los que se presenta, concede, restringe o revoca una facultad. | 04 RF-012, RF-015, RF-018 a RF-023 | alcance solicitado, alcance autorizado, alcance revocado | rol, acceso total, “todo” sin finalidad |
| **Revisión profesional válida** | Evento explícito registrado por un profesional autorizado, vinculado a dominio, período y evidencia, con interpretación no diagnóstica, resultado, fundamento, próxima acción o cierre, autoría y fecha. | DEC-043; 04 RF-034, RF-045 y RF-056 | revisión profesional, revisión válida — cuando el actor y el contexto sean inequívocos | abrir dashboard, visualizar información, nota libre aislada, modificación silenciosa de plan |
| **Activación de plan** | Operación que convierte una versión validada de un plan en la versión vigente consultable y ejecutable por el asesorado. | 02 §11 “Alcance funcional del MVP”; 04 RF-031 y RF-041 | activar plan nutricional, activar plan de entrenamiento | activación de cuenta, publicación, guardar borrador |
| **Versión** | Representación identificable de información presentada o emitida en un momento concreto, preservada frente a modificaciones posteriores. | 04 §4; RF-010, RF-013, RF-031, RF-041; RNF-DAT-003 | versión presentada, versión activada, versión anterior | estado, copia informal, sobrescritura |
| **Procedencia** | Origen reconstruible de un dato o elemento: actor, fuente propia o externa, proveedor, fecha y contexto aplicable. | 02 §9 “Propuesta de valor” — regla de pertinencia de datos; 04 RF-026 a RF-028, RF-037, RF-038, RF-048, RF-060 | fuente de origen, origen del dato | autoría como sinónimo completo, “dato del sistema” sin fuente |
| **Finalidad** | Motivo funcional específico para el que se propone un vínculo, se solicita consentimiento o se evalúa una operación. Debe ser comprensible y no ampliarse implícitamente. | 02 regla de pertinencia; 04 RF-018 a RF-022 | propósito — cuando no se confunda con objetivo general | acceso general, uso futuro indeterminado, “para seguimiento” sin alcance |
| **Revocación de consentimiento** | Decisión del asesorado que deja sin vigencia un consentimiento y debe cortar operaciones futuras dentro de su alcance, preservando evidencia e historia. | 04 RF-022; DEC-006; glosario §4.4 | revocar, retirar consentimiento | borrar datos, finalizar vínculo automáticamente, cerrar cuenta |
| **Objetivo vigente** | Formulación profesional identificable, relacionada con una evaluación, con responsable, período o vigencia y fundamento, sin fijar en 05 su contenido de dominio. | 04 RF-029 y RF-064 | objetivo nutricional vigente, objetivo de entrenamiento vigente | meta genérica sin responsable, fórmula, contenido prescriptivo fijado por 05 |
| **Plan profesional** | Instrumento versionado que organiza una intervención de Nutrición o Entrenamiento y que solo se vuelve consultable como vigente mediante activación. | 02 §11 “Alcance funcional del MVP”; 04 RF-030, RF-031, RF-039 a RF-041 | plan, planificación — cuando la vertical sea inequívoca | archivo mutable sin versión, recomendación automática |
| **Plan nutricional** | Especialización del plan profesional para Nutrición, vinculada a evaluación y objetivo, cuyo contenido concreto pertenece al dominio y al criterio profesional. | 04 RF-029 a RF-035 | planificación nutricional | dieta automática, fórmula nutricional fijada por 05 |
| **Borrador de plan** | Versión editable que puede guardarse y retomarse, pero no se presenta al asesorado como plan vigente. | 04 RF-030 y RF-039 | borrador, plan en preparación | plan activo, versión emitida |
| **Versión activada** | Versión validada que se declara vigente y que el asesorado consulta y ejecuta hasta una continuidad trazable posterior. | 04 RF-031 y RF-041 | versión vigente, versión emitida | borrador, última edición mutable |
| **Instantánea reproducible** | Representación preservada de la versión activada que permite reconstruir exactamente qué se indicó al asesorado en ese momento. | 04 RF-031 y RF-041; RNF-DAT-003 | snapshot — permitido entre paréntesis después del término canónico | copia mutable, catálogo actual como reconstrucción retrospectiva |
| **Adherencia o ejecución registrada** | Evidencia simple aportada por el asesorado sobre lo realizado respecto de un plan vigente, asociada a fecha, versión y autor, sin fijar fórmulas de puntuación. | 04 RF-033 y RF-043 | registro de cumplimiento, evidencia de ejecución | score global, resultado corporal, adherencia inferida automáticamente |
| **Catálogo propio** | Fuente operativa administrada por BE que permite planificar sin depender de un proveedor externo y conserva procedencia y estado. | 02 §13 “Estrategia de integraciones externas”; 04 RF-027 y RF-037 | catálogo BE, fuente propia | espejo sin procedencia, proveedor externo como fuente única |
| **Importación controlada** | Incorporación revisada de un elemento externo al catálogo BE, con proveedor y fecha identificables, validación previa y posibilidad de corrección o rechazo. | 04 RF-028, RF-038 y RF-060 | importar con revisión | copiar automáticamente, sincronización ciega |
| **Fallback manual** | Continuidad operativa mediante catálogo propio o carga manual cuando un tercero no está disponible, sin declarar la integración exitosa ni bloquear el núcleo. | 02 §13 “Estrategia de integraciones externas” y §21 “Riesgos prioritarios”; 04 RF-027, RF-028, RF-037, RF-038, RF-059 | contingencia manual, carga manual | ocultar la falla, inventar datos externos |
| **Resultado semántico de revisión** | Decisión común de `DEC-043` expresada mediante `MANTENER`, `AJUSTAR`, `SUSTITUIR`, `REPROGRAMAR_REVISION`, `CAMBIAR_OBJETIVO` o `FINALIZAR`, sin crear taxonomías paralelas por dominio. | DEC-043 v0.4; 04 RF-034, RF-035, RF-045, RF-046, RF-056 | decisión de revisión — cuando se identifique el valor canónico | progresar como valor paralelo, iniciar bloque como enum adicional, texto libre sin resultado |
| **Próxima acción** | Consecuencia explícita y trazable posterior a una revisión profesional válida: continuidad, cambio planificado, nueva revisión o cierre, vinculada al resultado, fundamento, autoría y fecha. | DEC-043 v0.4; 04 RF-034, RF-035, RF-056 | siguiente acción | pendiente informal, recordatorio aislado, edición silenciosa |
| **Ciclo cerrado trazable** | Condición observable en la que existe una revisión profesional válida y una próxima acción o cierre registrados; permite alimentar TVCC-30 sin fijar en 05 su fórmula, elegibilidad o ventana. | 04 RF-056 y RF-058; DEC-043 v0.4 | cierre de ciclo — cuando se explicite que es trazable | sesión vista, plan editado, nota aislada, adherencia como sinónimo de cierre |
| **Bloque de entrenamiento** | Agrupación versionable de planificación dentro de un plan de entrenamiento, organizada para un propósito profesional y relacionada con sesiones, sin fijar en 05 duración, volumen o contenido concreto. | 04 RF-039 y RF-040 | bloque planificado, bloque — cuando Entrenamiento sea inequívoco | ciclo automático, mesociclo como estructura obligatoria, período fijo |
| **Prescripción de entrenamiento** | Indicación profesional planificada dentro de una versión del plan, diferenciada de la ejecución real y cuyo contenido concreto pertenece al dominio y al criterio profesional. | 04 RF-039 a RF-041 | indicación planificada, planificación prescrita | prescripción médica, resultado ejecutado, fórmula automática |
| **Ejecución real** | Evidencia registrada de lo que el asesorado efectivamente realizó respecto de una versión activada, diferenciada de lo planificado y asociada a autoría, fecha y contexto. | 04 RF-042 y RF-043 | ejecución registrada, realizado | planificación, cumplimiento inferido, ejecución ideal |
| **Corrección trazable** | Rectificación posterior que conserva el registro original, identifica actor, fecha y motivo y permite reconstruir qué cambió sin sobrescritura silenciosa. | 04 RF-044; RNF-DAT-003 | rectificación, dato corregido con historia | editar original, reemplazar sin historial, borrar error |
| **Progresión de entrenamiento** | Próxima acción profesional posterior a una revisión válida que se expresa mediante `AJUSTAR` o `SUSTITUIR`, según conserve o genere una nueva versión; no constituye un resultado semántico adicional. | 04 RF-045 y RF-046; DEC-043 v0.4 | progresión — solo como acción de continuidad | `PROGRESAR` como enum, aumento automático, fórmula de carga |
| **Medición antropométrica directa** | Dato observado y registrado por un profesional autorizado mediante un protocolo identificado, asociado a autoría, fecha y unidad identificable; no es un cálculo ni una interpretación. | 04 RF-047 | medición directa, valor medido | resultado calculado, diagnóstico, estimación presentada como medición |
| **Cálculo antropométrico derivado** | Resultado producido a partir de mediciones directas mediante un método y versión identificables, reproducible y claramente diferenciado de sus entradas. | 04 RF-048 | cálculo derivado, resultado calculado | medición directa, fórmula sin versión, resultado clínico |
| **Protocolo identificado** | Referencia reconstruible al procedimiento utilizado para obtener mediciones; Documento 05 exige identificación, pero no fija el protocolo concreto. | 04 RF-047 | protocolo aplicado, referencia de protocolo | procedimiento implícito, protocolo universal no aprobado |
| **Evolución antropométrica** | Comparación longitudinal autorizada de mediciones directas y cálculos derivados, con períodos, métodos, unidades y limitaciones identificables, sin diagnóstico ni inferencia causal. | 04 RF-049 | comparación longitudinal antropométrica | score global, diagnóstico, causalidad, revisión profesional de especialidad |
| **Método profesional de cálculo reproducible** | Método versionado disponible para una finalidad profesional que BE puede ejecutar de forma reproducible cuando el profesional lo elige explícitamente y existen inputs obligatorios/admisibles; su resultado es apoyo, no decisión. | RF-070; ACTA-DIR-021; DEC-046 §4.4/§4.9 | método profesional, método versionado | fórmula propia de BE, objetivo automático, método impuesto |
| **Sugerencia metodológica transparente** | Orientación no vinculante sobre métodos aplicables o comparables que expone fundamento suficiente y nunca sustituye selección ni decisión profesional. | RF-070; ACTA-DIR-021 TX-01 | sugerencia de método | recomendación automática obligatoria, ganador automático |
| **Referencia profesional adoptada** | Resultado de cálculo que un profesional selecciona explícitamente como referencia de apoyo; la adopción no sobrescribe otras ejecuciones ni modifica por sí sola evaluación, objetivo, prescripción o plan. | RF-070; ACTA-DIR-021 TX-01 | referencia adoptada | decisión automática, objetivo calculado por BE |
| **Información autoinformada (`SELF_REPORTED`)** | Dato aportado por el asesorado sobre sí mismo, con procedencia preservada; no equivale a medición profesional, observación profesional ni diagnóstico. | RF-071; ACTA-DIR-021 TX-02/TX-05 | dato autoinformado, respuesta del asesorado | dato medido, diagnóstico, dato profesional |
| **Solicitud estructurada de información profesional** | Pedido versionado y trazable de un profesional autorizado al asesorado para una finalidad y alcance pertinentes, usando estructura BE controlada; solicitar no equivale a consentir ni amplía acceso. | RF-071; ACTA-DIR-021 TX-02/TX-04 | solicitud de información, formulario solicitado | builder libre P0, consentimiento, permiso general |
| **Servicio antropométrico limitado** | Publicación habilitada de una prestación antropométrica con perfil, credenciales y ubicación utilizable, destinada únicamente al descubrimiento y a solicitar vínculo. | 02 §12 “Descubrimiento limitado de servicios antropométricos”; 04 RF-051; DEC-044 | servicio antropométrico publicado | turno, reserva, contratación, marketplace, oferta clínica |
| **Ubicación utilizable** | Información suficiente para representar o localizar el servicio según la política aplicable, sin fijar en 05 precisión, visibilidad pública ni proveedor técnico. | 02 §12 “Descubrimiento limitado de servicios antropométricos”; 04 RF-051 | ubicación del servicio | dirección protegida publicada sin política, ranking geográfico, elegibilidad derivada del mapa |
| **Cartera profesional** | Vista operativa de asesorados, vínculos y acciones propias que permite identificar trabajo pendiente sin emitir una calificación agregada ni utilizar lenguaje diagnóstico. | 04 RF-052 y RF-055 | cartera, portafolio profesional — cuando el contexto sea inequívoco | lista clínica, pacientes en riesgo, ranking de asesorados |
| **Revisión pendiente** | Necesidad operativa identificable de que un profesional autorizado examine evidencia y registre una revisión válida; su motivo debe expresarse sin diagnóstico ni inferir gravedad clínica. | 04 RF-055; DEC-043 v0.4 | pendiente de revisión, acción de revisión pendiente | alerta clínica, diagnóstico pendiente, riesgo del asesorado |
| **Dashboard interdisciplinario** | Síntesis profesional de información autorizada por dominio, finalidad y alcance, sin convertir autorizaciones parciales en acceso global ni producir una calificación agregada del asesorado. | 04 RF-053; DEC-014 | tablero interdisciplinario, panel interdisciplinario | evaluación clínica integral, calificación general, acceso total por rol |
| **Línea temporal longitudinal** | Secuencia reconstruible de eventos autorizados que distingue cuándo ocurrió un hecho de cuándo fue registrado y conserva dominio, autoría y procedencia. | 04 RF-054 | timeline longitudinal, historial temporal | listado sin fechas diferenciadas, historia clínica completa |
| **Momento de ocurrencia** | Fecha y hora —o referencia temporal aplicable— en que el hecho representado sucedió en el dominio correspondiente. | 04 RF-054 | fecha del hecho, ocurrido en | fecha de carga como sustituto silencioso |
| **Momento de registro** | Fecha y hora en que BE recibió o persistió el evento, independiente del momento de ocurrencia. | 04 RF-054 | registrado en, fecha de carga | momento del hecho cuando solo se conoce la carga |
| **Nota de coordinación autorizada** | Comunicación trazable entre profesionales autorizados para aportar contexto pertinente sin prescribir, modificar, decidir ni asumir responsabilidad sobre el dominio ajeno. | 04 RF-057 | nota de coordinación, comunicación interdisciplinaria autorizada | indicación cruzada, prescripción ajena, transferencia de responsabilidad, chat general |
| **Progreso longitudinal propio** | Vista del asesorado sobre su propia información autorizada por dominio y período, con procedencia y límites visibles, sin autodiagnóstico ni comparación con terceros. | 04 RF-065 | progreso propio, evolución propia | comparación social, percentil frente a otros, diagnóstico automático |
| **Estado operativo de cuenta** | Condición funcional observable que determina si la identidad puede iniciar nuevas sesiones u operaciones, sin fijar en 05 el enum técnico. | 04 RF-006 y RF-069 | cuenta operativa, acceso habilitado — cuando sea funcionalmente exacto | rol, autorización global, estado clínico |
| **Método de acceso** | Mecanismo asociado a una identidad BE para demostrar acceso, local o federado, sin crear una identidad paralela. | 04 RF-002 a RF-004 | credencial de acceso, proveedor de acceso | cuenta nueva por proveedor, rol, permiso profesional |
| **Recuperación de acceso** | Recorrido neutral de proveedor para restablecer un método utilizable sin presuponer correo ni crear una sesión antes de completar la verificación aplicable. | 04 RF-005 | recuperación local, restablecimiento de acceso | envío de correo como requisito fijo, alta de identidad nueva |
| **Recuperación asistida documentada** | Contingencia operativa cuando la recuperación automática se difiere: soporte autorizado verifica la identidad mediante política posterior y registra el resultado sin restablecimiento silencioso. | 04 §3.2 y RF-005 | contingencia asistida | contraseña manual entregada por administrador, acceso sin auditoría |
| **Cierre de cuenta** | Decisión trazable del titular que impide nuevas sesiones y operaciones, finaliza vínculos activos mediante eventos y conserva información según políticas posteriores; no equivale a borrado inmediato. | 04 RF-069 | cierre, desactivación solicitada — cuando no implique borrado | eliminar todo, borrar historia, revocar autoría |
| **Incidencia administrativa** | Registro trazable de una situación de soporte o gobierno con actor, fecha, alcance, seguimiento y resolución, limitado a información autorizada. | 04 RF-068 | caso de soporte, incidencia | chat de soporte sin historia, diagnóstico, denuncia pública |
| **Capacidad configurada** | Banda o límite administrativo aplicable a procesos nuevos, separado de identidad, verificación y autorización; no interrumpe procesos vigentes. | 04 RF-066 | límite de capacidad, banda configurada | cupo que cancela procesos activos, facturación automática |
| **Novedad interna** | Comunicación no clínica publicada dentro de BE para actores autorizados, consultable en un centro propio y separada de mensajes sensibles o coordinación profesional. | 04 RF-061 | anuncio interno, novedad | alerta clínica, nota de coordinación, publicidad externa |
| **Notificación push no sensible** | Aviso opcional y mínimo que informa la existencia de una novedad sin incluir datos de salud, contenido profesional protegido o información suficiente para inferirlos. | 04 RF-062 | push, aviso de novedad | diagnóstico en push, dato antropométrico, plan o nombre de asesorado |
| **TVCC-30** | Métrica académica reproducible calculada a partir de ciclos elegibles con revisión profesional válida y próxima acción o cierre; produce numerador, denominador, exclusiones y versión de regla auditables. No es retención, adherencia ni resultado de salud. | 04 RF-058 | tasa de ciclos cerrados trazables — cuando se identifique la versión | score de salud, éxito clínico, retención, adherencia |

---

### 2.4. Equivalencias críticas

#### 2.4.1. Verificación profesional

```text
solicitud presentada
→ PENDIENTE

resolución favorable
→ VERIFICADO
→ puede explicarse como “aprobación administrativa”
→ no constituye un estado adicional

resolución desfavorable definitiva
→ RECHAZADO

restricción posterior
→ SUSPENDIDO

observación corregible
→ resultado de workflow de DEC-042
→ representación técnica DERIVAR 06
```

#### 2.4.2. Revisiones

```text
revisión administrativa
= administrador revisa evidencia de alta
= resuelve verificación profesional

revisión profesional válida
= profesional revisa evidencia de seguimiento
= registra interpretación, decisión y próxima acción
```

Nunca deben abreviarse ambas como “revisión” dentro de una misma sección.

#### 2.4.3. Verificación, habilitación y autorización

```text
VERIFICADO
≠ HABILITADO
≠ AUTORIZADO
```

Un alcance profesional puede estar verificado y, aun así, no poder operar porque falte:

- habilitación aplicable;
- vínculo aceptado;
- consentimiento vigente;
- autorización contextual;
- capacidad configurada, cuando corresponda.

#### 2.4.4. Vínculo y consentimiento: asimetría obligatoria

```text
vínculo aceptado
≠ consentimiento vigente
≠ autorización contextual
```

El vínculo aceptado identifica una relación. El consentimiento habilita finalidades y alcances específicos. La autorización se evalúa en cada operación protegida.

```text
revocar consentimiento
≠ finalizar vínculo
```

La revocación corta accesos y operaciones futuras del alcance revocado, pero no finaliza automáticamente el vínculo.

```text
finalizar vínculo
≠ borrar consentimiento histórico
```

La finalización corta nuevas operaciones de la relación, pero conserva aceptación, consentimientos, revocaciones y evidencia histórica.

Los efectos exactos sobre estados, lectura residual y retención pertenecen a `06/08`.

##### 2.4.4.1. Aplicación obligatoria en UC-P08

La asimetría debe aparecer y poder verificarse en:

1. garantías mínimas;
2. variantes o excepciones;
3. reglas aplicables;
4. criterios de aceptación;
5. puntos de auditoría.

Un bloque particular puede aplicar esta regla, pero no redefinirla.

---

### 2.5. Lista de control por bloque

Antes de declarar un bloque como redactado:

- [ ] Los nombres de casos utilizan términos canónicos.
- [ ] Toda aparición de “revisión” está calificada.
- [ ] Toda aparición de “activación” identifica el objeto activado.
- [ ] “Aprobación administrativa” está declarada como explicación de `VERIFICADO`.
- [ ] No se intercambian identidad, cuenta y perfil.
- [ ] No se intercambian verificación, habilitación y autorización.
- [ ] Antropometría no aparece como tercera especialidad.
- [ ] Vínculo aceptado no aparece como consentimiento.
- [ ] Revocar consentimiento no aparece como finalización automática del vínculo.
- [ ] Finalizar vínculo no aparece como borrado del consentimiento histórico.
- [ ] Consentimiento no aparece como autorización global.
- [ ] Autoría y procedencia permanecen diferenciadas.
- [ ] Los resultados semánticos no se presentan como enums técnicos definitivos.
- [ ] Los RF relacionados usan la misma terminología que los UC.
- [ ] La matriz registra caso hogar e invocantes relevantes.
- [ ] Las derivaciones a 06/08/09/10 permanecen explícitas.
- [ ] Los términos nuevos recurrentes se incorporaron a este control.

---

### 2.6. Aplicación inmediata

#### 2.6.1. Bloque 01

- `UC-P02` utiliza “resolver la verificación profesional”.
- Una resolución favorable produce la semántica `VERIFICADO`.
- `UC-P03` materializa `SUSPENDIDO` y la rehabilitación restituye `VERIFICADO`, sujeta a otras condiciones.
- `RF-012` se vincula con `UC-P02` y `UC-P03`.
- “Aprobación administrativa” se conserva solo como explicación natural.

#### 2.6.2. Bloques 02 y 03

- solicitud de vínculo, vínculo aceptado, consentimiento y autorización permanecen separados;
- la revocación no finaliza automáticamente el vínculo;
- UC-P08 cumple la asimetría en garantías, variantes/excepciones, reglas, aceptación y auditoría.

#### 2.6.3. Bloque 04

- plan nutricional, borrador, versión activada, instantánea reproducible, ejecución registrada, catálogo propio, importación controlada y fallback manual utilizan términos comunes reutilizables por Entrenamiento;
- no se fijan fórmulas ni contenido prescriptivo.

#### 2.6.4. Bloque 05

- `UC-P13` debe reutilizar `DEC-043` sin reformular sus siete componentes obligatorios;
- solo se admiten los seis resultados semánticos canónicos;
- “próxima acción” y “ciclo cerrado trazable” no fijan la fórmula de TVCC-30;
- abrir dashboard, visualizar información, guardar una nota libre aislada o modificar silenciosamente un plan no constituyen revisión profesional válida.

#### 2.6.5. Bloque 06

- `UC-P14` cubre evaluación y objetivo de entrenamiento, incluidos `RF-036` y `RF-064`;
- `UC-P15` usa catálogo propio, importación controlada desde wger y fallback manual sin convertir al proveedor en fuente única;
- `UC-P17` separa prescripción de entrenamiento y ejecución real;
- `UC-E02` conserva el registro original y agrega una corrección trazable;
- `UC-P18` invoca `UC-I05` y `UC-I06` sin redefinir la revisión válida;
- progresión se expresa mediante `AJUSTAR` o `SUSTITUIR`;
- ningún caso fija series, repeticiones, cargas, tiempos, ejercicios o fórmulas de progresión.

#### 2.6.6. Bloque 07

- Antropometría permanece como capacidad transversal y no como tercera especialidad;
- `UC-P19` diferencia mediciones directas y cálculos derivados;
- `UC-I09` exige método, versión, entradas y resultado reproducibles sin fijar fórmulas;
- `UC-E02` y `UC-E03` reutilizan `UC-I12 — Registrar corrección trazable`;
- `UC-E03` agrega el comportamiento propio de recalcular derivados cuando cambia una medición;
- `UC-P20` compara evolución con métodos, unidades y limitaciones visibles;
- `UC-P21` admite profesionales exclusivamente antropométricos conforme a `DEC-044`;
- `UC-P21` y `UC-P22` excluyen reservas, turnos, pagos, comisiones, rankings, reputación, reseñas, popularidad, contratación y marketplace;
- `UC-P22` solo puede continuar hacia `UC-P04` mediante `UC-E04`;
- ningún caso fija protocolos, fórmulas o unidades concretas.

#### 2.6.7. Bloque 08

- `UC-P23` presenta pendientes con motivos operativos y lenguaje no clínico;
- `UC-P24` evalúa autorización por dato o conjunto pertinente, y una autorización parcial no se amplía al dashboard completo;
- la línea temporal diferencia momento de ocurrencia y momento de registro;
- el dashboard no produce una calificación agregada ni una señal visual única de condición general;
- `UC-E07` permite coordinación sin prescribir, modificar o decidir sobre el dominio ajeno y sin transferir responsabilidad profesional;
- `UC-P31` muestra progreso propio por dominio y período sin autodiagnóstico ni comparación con terceros;
- todos los casos actorales incluyen `UC-I02`.

#### 2.6.8. Cierre complementario A

- identidad BE, método de acceso y estado operativo permanecen separados de rol y autorización;
- Google extiende el acceso local y nunca lo reemplaza como única alternativa;
- recuperación no presupone correo y declara recuperación asistida documentada si se difiere;
- cerrar cuenta no borra silenciosamente la historia.

#### 2.6.9. Cierre complementario B

- capacidad configurada solo limita procesos nuevos;
- una identidad exclusivamente antropométrica es válida conforme a DEC-044;
- novedades internas no contienen lenguaje clínico;
- push es opcional, mínimo y no sensible.

#### 2.6.10. Casos incluidos y soporte

- las fichas compactas no redefinen las conductas ya especificadas por los invocantes;
- `UC-S01` consume ciclos cerrados trazables y no interpreta TVCC-30 como resultado de salud;
- `TR-01–TR-05` son reglas, no casos de uso.

---

### 2.7. Propiedad futura

Este glosario gobierna editorialmente el Documento 05.

El Documento 06 podrá:

- confirmar términos;
- precisar definiciones;
- fijar entidades;
- establecer estados y transiciones;
- reemplazar denominaciones técnicas provisionales.

Cualquier cambio de significado deberá propagarse de forma trazable a 05, 08, 09, 10, 11A y 12. No se realizará una reconciliación silenciosa.

---

### 2.8. Estado

```text
GLOSARIO Y CONTROL TERMINOLÓGICO:
v0.1.8
BORRADOR CORREGIDO PARA APROBACIÓN DE DIRECCIÓN

TÉRMINOS CONTROLADOS:
64

APLICADO A:
ARQUITECTURA v0.2.9
BLOQUES FUNCIONALES 01–08
CIERRE COMPLEMENTARIO A v0.11
CIERRE COMPLEMENTARIO B v0.12
CASOS INCLUIDOS Y SOPORTE v0.13

REGLAS TRANSVERSALES:
TR-01 A TR-05

REFERENCIAS DE BE-LEG-02 Y BE-LEG-03:
APLICADAS SEGÚN CONTRARREVISIONES EXTERNAS

ARTEFACTOS DEL BUNDLE G1:
NO DISPONIBLES LOCALMENTE PARA REVERIFICACIÓN EN ESTA SESIÓN

ESQUEMA CANÓNICO EXTERNO DE NUMERACIÓN:
NO EVIDENCIADO

PROPIEDAD DEFINITIVA DE DOMINIO Y ESTADOS:
DERIVAR 06

GIT:
SIN CAMBIOS
```
---

---

## 3. Arquitectura de casos de uso

*Fuente ensamblada: `BE_LEG_05_v0.2.9_ARQUITECTURA_CIERRE_COMPLEMENTARIO.md`.*

### 3.1. Resultado de validación de fuentes

#### 3.1.1. Paquete aprobado y cadena de custodia

La revisión externa recibida informó la verificación del paquete `BE_LEG_04_v0.4.1_APROBADO_SIN_GIT.zip` con el siguiente resultado:

- manifiesto: `18/18 OK`;
- archivo de `staging_sin_git/`: byte-idéntico al documento aprobado;
- diferencia `v0.4 → v0.4.1`: exactamente tres cambios de cierre —encabezado de estado, cláusula de `RNF-REC-001` y registro de `REV-005` cerrada—;
- catálogo funcional y no funcional: sin cambios silenciosos, con `67 RF` y `38 RNF`.

Esta sesión no dispone del ZIP montado para repetir la comprobación binaria. Por lo tanto, el resultado anterior se incorpora como **evidencia de revisión externa**, mientras que el contenido aprobado y los registros de cierre sí fueron contrastados en la biblioteca.

Artefactos relevantes confirmados:

- `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md`;
- `REV-005_CERRADA.md`;
- `DELTA_CONSOLIDADO_BE_LEG_04_v0.1_a_v0.4.1.md`;
- `PLAN_CANONIZACION_BE_LEG_04_v0.4.1_SIN_EJECUTAR.md`;
- evidencias de contrarrevisión y resolución relacionadas.

#### 3.1.2. Objeto vigente

Para este trabajo se adopta como fuente vigente:

```text
BE-LEG-04 v0.4.2.1
APROBADO DOCUMENTALMENTE POR ACTA-DIR-022
69 RF ACTIVOS PARA ESTE PARCHE
38 RNF ACTIVOS
NO CANONIZADO POR ACTA-DIR-022
```

Las versiones v0.1, v0.3, v0.4 y candidatos se consideran antecedentes, no autoridad.

#### 3.1.3. Canon G1 consultado

Se leyeron desde GitHub, en modo lectura, repositorio `Elian-Bufi/Elian-Bufi-be-health`, referencia exacta:

```text
13224caa93b9c6cc8cc748f1035b385d7c5bab32
```

Archivos:

- `docs/legajo/00_Gobierno_del_Legajo.md`;
- `docs/legajo/02_Vision_Alcance_y_Plan_Estrategico.md`;
- `docs/legajo/03_Modelo_de_Negocio.md`.

---

### 3.2. Propiedad documental verificada

El Documento 05 es propietario de:

- actores y objetivos de interacción;
- disparadores;
- precondiciones funcionales;
- flujos principales;
- variantes;
- excepciones;
- postcondiciones;
- resultados observables;
- relaciones `include` y `extend`;
- historias de usuario selectivas.

Debe escribir `DERIVAR` cuando la decisión pertenezca a:

- 06: entidades, estados, taxonomías técnicas, persistencia e invariantes;
- 08: consentimiento, autorización, retención, privacidad y auditoría;
- 07: arquitectura, ambientes y despliegue;
- 09: endpoints, DTO, códigos y contratos;
- 10: pantallas, navegación y componentes;
- 11A: estrategia y escenarios completos de prueba;
- 12: matriz canónica completa de trazabilidad.

---

### 3.3. Agrupación de los 69 RF

| Grupo | RF activos |
|---|---:|
| Identidad, cuenta y acceso | 8 |
| Alta profesional, administración, habilitaciones y capacidad | 11 |
| Vínculos, consentimiento y autorización | 9 |
| Circuito nutricional | 10 |
| Circuito de entrenamiento | 12 |
| Antropometría | 5 |
| Dashboard, revisión y analítica | 7 |
| Integraciones y comunicaciones | 4 |
| Progreso longitudinal en APK | 1 |
| Capacidades transversales profesionales (CAP-MET / CAP-DAT) | 2 |
| **Total** | **69** |

---

### 3.4. Decisión de arquitectura

#### 3.4.1. Criterio

No se propone un caso por RF ni un caso por operación CRUD. La unidad de diseño es:

> **objetivo observable de un actor dentro de un recorrido de valor.**

Los requisitos de autorización, auditoría, versionado, procedencia y fallback se modelan como subflujos o garantías transversales.

#### 3.4.2. Resultado cuantitativo y profundidad documental

| Tipo | Cantidad propuesta | Profundidad |
|---|---:|---|
| Casos principales | 33 | especificación completa según plantilla de 05 |
| Casos incluidos | 13 | especificación compacta reutilizable |
| Casos de extensión | 9 | condición de extensión, flujo diferencial y cierre |
| Patrones transversales | 5 | reglas de aplicación y puntos de control; no flujo duplicado |
| Caso de soporte analítico | 1 | especificación compacta orientada a reproducibilidad |

La arquitectura candidata contiene `61` elementos de modelado: `56` casos de uso + `5` reglas transversales. Solo los 33 casos principales reciben la plantilla íntegra. La baseline v0.14 contenía 12 incluidos reales; el valor histórico `11` de esta tabla se reconcilia a `13` por `12 + UC-I13`, sin alterar conducta previa. Los incluidos, extensiones, patrones y soporte se documentan proporcionalmente a su función.

La cifra puede reducirse durante la redacción si dos casos resultan inseparables sin perder actor, objetivo, validabilidad o trazabilidad. No se reducirá únicamente para cumplir una fecha.

---

### 3.5. Control terminológico transversal

La arquitectura adopta un glosario controlado para evitar vocabularios paralelos entre bloques.

Reglas iniciales:

- `verificación profesional` es el concepto canónico;
- una resolución favorable materializa la semántica `VERIFICADO`;
- `aprobación administrativa` es solo una explicación natural de esa resolución, no un estado adicional;
- `revisión administrativa` y `revisión profesional válida` son actividades diferentes;
- los estados técnicos definitivos permanecen en `DERIVAR 06`;
- cada RF puede registrar un caso hogar y todos sus invocantes relevantes.

El instrumento de control se mantiene en `BE-LEG-05 — Glosario y control terminológico`.

---

### 3.6. Casos principales propuestos

| Código de trabajo | Nombre | Actor principal | RF base | Límite |
|---|---|---|---|---|
| UC-P01 | Gestionar alta profesional escalonada | Profesional | RF-008, RF-009, RF-010, RF-067 | Perfil → alcance → evidencia → presentación. |
| UC-P02 | Revisar solicitud y resolver la verificación profesional | Administrador | RF-011, RF-012 | Observación, verificación favorable o rechazo con fundamento. |
| UC-P03 | Suspender o rehabilitar capacidad profesional | Administrador | RF-012, RF-014 | Ciclo posterior de la verificación, trazable y acotado. |
| UC-P04 | Solicitar o invitar a un vínculo | Profesional o asesorado | RF-018 | La solicitud no habilita acceso. |
| UC-P05 | Aceptar o rechazar un vínculo | Asesorado | RF-019 | Aceptación explícita; no equivale a consentimiento. |
| UC-P06 | Consultar, pausar o finalizar un vínculo | Profesional o asesorado | RF-023, RF-024, RF-025 | Conserva identidad e historia. |
| UC-P07 | Otorgar y consultar consentimiento específico | Asesorado | RF-020, RF-023 | Específico, versionado y revocable. |
| UC-P08 | Revocar consentimiento | Asesorado | RF-022 | Corta operaciones futuras del alcance. |
| UC-P09 | Registrar evaluación y objetivo nutricional | Profesional de Nutrición | RF-026, RF-029 | Base verificable para planificar. |
| UC-P10 | Diseñar plan nutricional | Profesional de Nutrición | RF-027, RF-028, RF-030 | Catálogo propio, importación controlada y borrador. |
| UC-P11 | Validar y activar plan nutricional | Profesional de Nutrición | RF-031, RF-066 | Versión reproducible y vigente. |
| UC-P12 | Consultar y registrar ejecución nutricional en APK | Asesorado | RF-032, RF-033 | Recorrido diario observable. |
| UC-P13 | Revisar evidencia y decidir continuidad nutricional | Profesional de Nutrición | RF-034, RF-035, RF-056, RF-058 relacionado | Materializa DEC-043 mediante UC-I05/UC-I06 y produce el evento observable de ciclo cerrado trazable que UC-S01 consume; no calcula TVCC-30. |
| UC-P14 | Registrar evaluación y objetivo de entrenamiento | Profesional de Entrenamiento | RF-036, RF-064 | Espejo funcional de evaluación/objetivo sin copiar contenido nutricional. |
| UC-P15 | Diseñar plan de entrenamiento | Profesional de Entrenamiento | RF-037–RF-040, RF-059, RF-060 | Catálogo propio, wger con importación controlada, fallback y procedencia; bloques, sesiones y prescripción sin contenido fijo. |
| UC-P16 | Validar y activar plan de entrenamiento | Profesional de Entrenamiento | RF-041, RF-066 | Instantánea reproducible y control de capacidad: rechaza proceso nuevo sin interrumpir vigentes. |
| UC-P17 | Consultar y registrar ejecución de entrenamiento en APK | Asesorado | RF-042, RF-043 | Prescripción ≠ ejecución real; puede ser extendido por UC-E02. |
| UC-P18 | Revisar evidencia y decidir continuidad de entrenamiento | Profesional de Entrenamiento | RF-045, RF-046, RF-056, RF-058 relacionado | Invoca UC-I05 y UC-I06; progresión se mapea a AJUSTAR/SUSTITUIR y produce evento para UC-S01. |
| UC-P19 | Registrar evaluación antropométrica | Profesional con capacidad antropométrica | RF-047, RF-048 | Protocolo, autor, fecha y unidades identificables; medición directa diferenciada de cálculo; invoca UC-I09 y UC-I10. |
| UC-P20 | Consultar evolución antropométrica | Profesional autorizado o asesorado | RF-049 | Comparación longitudinal autorizada con directos/derivados, métodos, unidades y limitaciones visibles; no es revisión de especialidad. |
| UC-P21 | Publicar servicio antropométrico limitado | Profesional elegible | RF-051, RF-066 | Admite identidad exclusivamente antropométrica; exige identidad activa, capacidad verificada, servicio habilitado, ubicación utilizable, autorización de publicación y estado profesional válido. |
| UC-P22 | Descubrir servicio antropométrico | Asesorado | RF-051, RF-059 | Lista/mapa con fallback; perfil y credenciales; ninguna reserva, pago, ranking o contratación; solo continúa mediante UC-E04 hacia UC-P04. |
| UC-P23 | Consultar cartera y revisiones pendientes | Profesional | RF-052, RF-055 | Vista operativa propia con motivos no clínicos; no genera calificación agregada ni orden clínico. |
| UC-P24 | Consultar dashboard y línea temporal interdisciplinaria | Profesional autorizado | RF-053, RF-054 | Autoriza cada dato o conjunto por consentimiento, finalidad y alcance; diferencia ocurrencia y registro; una autorización parcial no concede acceso global. |
| UC-P25 | Registrar identidad BE y perfil propio | Profesional o asesorado | RF-001, RF-006, RF-017 | Identidad persistente; estado operativo observable; no concede roles, especialidades, vínculos ni acceso a terceros. |
| UC-P26 | Autenticar y finalizar una sesión local | Todos los actores | RF-002, RF-006, RF-007 | Ciclo P0 de acceso; encauza por superficie mediante UC-I11; Google y recuperación son extensiones. |
| UC-P27 | Solicitar cierre de cuenta | Profesional o asesorado | RF-069 | Cierre trazable; impide nuevas sesiones y finaliza vínculos activos mediante eventos; retención y reversibilidad: DERIVAR 06/08. |
| UC-P28 | Registrar y gestionar incidencia administrativa | Profesional, asesorado o administrador | RF-068 | Incidencias propias o administrativas autorizadas, con autoría, fecha, seguimiento y resolución trazables. |
| UC-P29 | Configurar habilitaciones y capacidad académica | Administrador | RF-066 | Admite identidades con Nutrición, Entrenamiento, ambas o solo capacidad antropométrica verificada; simulación sin cobro real. |
| UC-P30 | Consultar novedades internas | Profesional o asesorado | RF-061 | Centro interno no clínico; UC-E08 agrega push no sensible como canal opcional. |
| UC-P31 | Consultar progreso longitudinal en APK | Asesorado | RF-054, RF-065 | Información propia por dominio y período, con procedencia y límites; sin autodiagnóstico ni comparación con terceros. |
| UC-P32 | Solicitar información estructurada pertinente al asesorado | Profesional autorizado | RF-071 | Solicitud request-driven con finalidad/alcance explícitos; usa plantilla BE versionada y no amplía consentimiento ni acceso. |
| UC-P33 | Completar información solicitada | Asesorado | RF-071 | Respuesta SELF_REPORTED vinculada a solicitud/plantilla/versión; distingue reutilización de perfil propio y preserva historia. |

---

### 3.7. Casos incluidos

| Código | Nombre | Tipo | Invocado por | RF base |
|---|---|---|---|---|
| UC-I01 | Presentar evidencia versionada | Incluido compacto | UC-P01, UC-E01 | RF-009, RF-010, RF-013, RF-067 | Conserva versión, autoría, fecha, alcance y relación con evidencia anterior. |
| UC-I02 | Evaluar autorización contextual | Incluido transversal | Todo caso protegido | RF-015, RF-021 |
| UC-I03 | Registrar auditoría y preservar historia | Incluido compacto transversal | Operaciones sensibles, versiones, correcciones y cierres | RF-025, RF-044, RF-050, RF-054, RF-069 + RNF | Registra actor, ocurrencia, registro, resultado y relaciones sin sobrescritura silenciosa. |
| UC-I04 | Validar y versionar un plan | Incluido compacto | UC-P11, UC-P16 | RF-031, RF-041 | Valida una versión candidata y preserva la instantánea reproducible antes de activar. |
| UC-I05 | Registrar revisión profesional válida | Incluido | UC-P13, UC-P18 | RF-056; DEC-043 |
| UC-I06 | Aplicar continuidad o cierre | Incluido | UC-P13, UC-P18 | RF-035, RF-046 |
| UC-I07 | Importar elemento externo con revisión controlada | Incluido compacto opcional | UC-P10, UC-P15 | RF-028, RF-038, RF-060 | Revisión humana, procedencia, corrección o rechazo antes de incorporar. |
| UC-I08 | Aplicar fallback manual y conservar procedencia | Incluido compacto transversal | Integraciones, catálogos y mapa | RF-059, RF-060 | Mantiene el núcleo mediante fuente propia, carga manual o lista textual y registra la contingencia. |
| UC-I09 | Emitir cálculos antropométricos reproducibles | Incluido | UC-P19, UC-E03 | RF-048 | Método, versión, entradas y resultado identificables; no fija fórmulas ni unidades. |
| UC-I10 | Verificar habilitación y capacidad antes de iniciar proceso | Incluido compacto transversal | UC-P11, UC-P16, UC-P19, UC-P21, UC-P29 | RF-066 | Admite perfil exclusivamente antropométrico; rechaza proceso nuevo excedido sin interrumpir procesos vigentes. |
| UC-I11 | Encauzar al actor por la superficie prevista | Incluido compacto transversal | UC-P25, UC-P26 y recorridos Website/APK | RF-007 | Determina la superficie funcional prevista sin fijar navegación ni conceder autorización. |
| UC-I12 | Registrar corrección trazable | Incluido transversal | UC-E02, UC-E03 | RF-044, RF-050, RNF-DAT-003 | Conserva original, actor, fecha, motivo y cadena; las extensiones agregan conducta de dominio. |
| UC-I13 | Ejecutar y adoptar cálculo profesional reproducible | Incluido transversal | UC-P09, UC-P14, UC-I09 | RF-070 | Patrón único: método/versión/inputs/procedencia/resultado; cálculo/sugerencia/referencia ≠ decisión profesional. |

---

### 3.8. Casos de extensión

| Código | Nombre | Relación | RF base |
|---|---|---|---|
| UC-E01 | Subsanar y volver a presentar evidencia | Extiende UC-P01/UC-P02 | RF-013 |
| UC-E02 | Corregir ejecución de entrenamiento | Extiende UC-P17 e incluye UC-I12 | RF-044 | Aplica el patrón común sin modificar prescripción. |
| UC-E03 | Corregir o anular medición antropométrica | Extiende UC-P19/UC-P20; incluye UC-I03 y, según rama, UC-I12/UC-I09 | RF-050 | Corrección o anulación trazables; anular ≠ borrar; semántica efectiva: DERIVAR 06/M-09. |
| UC-E04 | Solicitar vínculo desde descubrimiento antropométrico | Extiende UC-P22 e invoca UC-P04 | RF-018, RF-051 | Solo crea solicitud pendiente; no acepta, no consiente y no concede acceso. |
| UC-E05 | Acceder mediante Google | Extiende UC-P26 | RF-003 | Método federado opcional con fallback local; no crea identidad duplicada ni dependencia exclusiva del proveedor. |
| UC-E06 | Administrar métodos de acceso | Extiende UC-P26 | RF-004 | Vincula o retira métodos sin perder la identidad persistente ni dejar la cuenta sin ruta utilizable. |
| UC-E07 | Registrar nota de coordinación autorizada | Extiende UC-P24 e incluye UC-I02/UC-I03 | RF-057 | Comunica contexto pertinente sin prescribir, modificar o decidir sobre dominio ajeno y sin transferir responsabilidad. |
| UC-E08 | Recibir notificación push no sensible | Extiende UC-P30 | RF-062 | Push opcional sin datos sensibles; el centro interno conserva la información completa y el fallback. |
| UC-E09 | Recuperar el acceso local | Extiende UC-P26 | RF-005 | Neutral de proveedor y sin presuponer correo; si se difiere, aplica recuperación asistida documentada y trazable. |


---

### 3.9. Caso de soporte analítico

| Código | Nombre | Actor | RF base | Tratamiento |
|---|---|---|---|---|
| UC-S01 | Obtener TVCC-30 de manera reproducible | Sistema BE o responsable de validación | RF-058 | Ficha completa: consume eventos de ciclo cerrado trazable, aplica una especificación versionada, produce numerador, denominador, exclusiones y resultado auditables; no es score de salud. |

`UC-S01` no es un recorrido operativo prioritario ni un dashboard de salud. Es un caso de soporte para cálculo y validación de la North Star.

---

### 3.10. Reglas transversales

| Código | Regla transversal | RF base | Aplicación |
|---|---|---|---|
| TR-01 | Separación identidad–especialidad–habilitación–vínculo–consentimiento–autorización | RF-015 | Regla de interpretación en todo el documento. |
| TR-02 | Autorización contextual en cada operación protegida | RF-021 | Se materializa como UC-I02; política: DERIVAR 08. |
| TR-03 | Auditoría, autoría, versionado y preservación histórica | RF-025, RF-044, RF-050 | No crear un caso CRUD por cada evento. |
| TR-04 | Procedencia y resiliencia frente a terceros | RF-028, RF-038, RF-059, RF-060 | Fuente propia → proveedor → importación → persistencia → fallback. |
| TR-05 | Revocación efectiva | RF-022 | Caso explícito UC-P08 y garantía en todos los accesos posteriores. |

---

### 3.11. RF que no requieren caso principal independiente

| RF | Materia | Tratamiento |
|---|---|---|
| RF-006, RF-007 | Estado operativo y superficie prevista | Son resultados/subflujos de identidad y acceso. |
| RF-015, RF-021 | Separación y autorización | Son reglas transversales; convertirlas en pantallas sería un error. |
| RF-025 | Preservación de identidad e historia | No requiere caso principal propio: condiciona UC-P06 y se materializa mediante UC-I03/TR-03. |
| RF-027, RF-037 | Catálogos propios | Participan en diseño de planes; no requieren un CRUD narrado como caso principal. |
| RF-028, RF-038 | Importaciones externas | Son subflujos incluidos y opcionales dentro de catálogos. |
| RF-048 | Cálculos antropométricos | Subflujo del registro/revisión antropométrica. |
| RF-054, RF-055 | Timeline y pendientes | Forman parte de dashboard/cartera; no necesitan recorridos gigantes separados. |
| RF-057 | Nota de coordinación | Extensión del dashboard; no transfiere responsabilidad. |
| RF-059, RF-060 | Fallback y procedencia | Garantías transversales de integración. |
| RF-062 | Push | Extensión P2 del centro interno de novedades. |
| RF-070 | Métodos profesionales reproducibles | Se materializa mediante UC-I13 transversal; no requiere caso principal por fórmula/método. |

---

### 3.12. Matriz preliminar RF → capacidad → caso de uso

| RF | Capacidad | Caso hogar e invocantes relevantes | Actor | Prioridad | Observación |
|---|---|---|---|---|---|
| RF-001 | Identidad BE | UC-P25 | Profesional o asesorado | P0 | Caso principal de identidad; no concede especialidad, vínculo ni acceso a terceros. |
| RF-002 | Acceso local | UC-P26 | Profesional, asesorado o administrador | P0 | Caso principal; los controles técnicos se derivan a 08/09. |
| RF-003 | Identidad federada | UC-E05 | Profesional o asesorado | P1 | Extensión de acceso; fallback obligatorio a autenticación local. |
| RF-004 | Cuenta híbrida | UC-E06 | Profesional o asesorado | P2 | Extensión recortable; no requiere caso principal independiente. |
| RF-005 | Recuperación de cuenta | UC-E09 → extiende UC-P26 | Profesional, asesorado o administrador | P1 | Extensión diferible con contingencia documentada; mecanismo y vigencias: DERIVAR 08/09. |
| RF-006 | Estado operativo | UC-P25 / UC-P26 | Profesional o asesorado | P0 | Resultado observable incluido; no amerita caso aislado. |
| RF-007 | Canales y navegación | UC-I11 | Profesional, asesorado o administrador | P0 | Subflujo incluido y transversal; navegación concreta: DERIVAR 10. |
| RF-008 | Alta profesional | UC-P01 | Profesional | P0 | Parte del alta escalonada; perfil no equivale a verificación. |
| RF-009 | Alta profesional | UC-P01 / UC-I01 | Profesional | P0 | Especialidades independientes; antropometría no es tercera especialidad. |
| RF-010 | Alta profesional | UC-P01 | Profesional | P0 | Cierra la preparación y dispara revisión administrativa. |
| RF-011 | Administración | UC-P02 | Administrador | P0 | Caso principal administrativo y trazable. |
| RF-012 | Verificación profesional | UC-P02 / UC-P03 | Administrador | P0 | UC-P02 resuelve la verificación; UC-P03 aplica suspensión o rehabilitación. Semántica mínima DEC-005; estados técnicos: DERIVAR 06. |
| RF-013 | Alta profesional | UC-E01 | Profesional | P0 | Extensión por observación; preserva versión previa. |
| RF-014 | Administración | UC-P03 | Administrador | P0 | Caso principal de ciclo posterior; efectos: DERIVAR 06/08. |
| RF-015 | Gobierno de acceso | TR-01 / UC-P04 / UC-P05 | Sistema BE, profesional y asesorado | P0 | TR-01 es el hogar transversal; UC-P04 y UC-P05 ejercitan la separación entre verificación, habilitación, vínculo y autorización. |
| RF-017 | Identidad del asesorado | UC-P25 | Asesorado | P0 | Variante de perfil propio; cuenta persistente e independiente. |
| RF-018 | Vínculo | UC-P04 | Profesional o asesorado | P0 | Caso principal; también se invoca desde descubrimiento antropométrico. |
| RF-019 | Vínculo | UC-P05 | Asesorado | P0 | Caso principal; aceptación no equivale a consentimiento. |
| RF-020 | Consentimiento | UC-P07 | Asesorado | P0 | Caso principal; taxonomía y textos: DERIVAR 08. |
| RF-021 | Autorización contextual | UC-I02 / TR-02 | Sistema BE | P0 | Incluido en todo caso protegido; no es una pantalla ni un paso decorativo. |
| RF-022 | Revocación | UC-P08 / TR-05 | Asesorado | P0 | Caso principal y efecto transversal; retención: DERIVAR 08. |
| RF-023 | Autogobierno | UC-P06 / UC-P07 / UC-P05 | Profesional o asesorado | P0 | UC-P06 y UC-P07 son hogares de consulta; UC-P05 invoca la consulta de la solicitud y del estado propio antes de decidir. |
| RF-024 | Vínculo | UC-P06 | Profesional o asesorado según política | P0 | Caso principal de gestión; estados y lectura residual: DERIVAR 06/08. |
| RF-025 | Continuidad longitudinal | UC-I03 / TR-03 | Asesorado | P0 | Garantía transversal; no requiere caso CRUD independiente. |
| RF-026 | Nutrición | UC-P09 | Profesional de Nutrición | P0 | Inicio del circuito nutricional. |
| RF-027 | Catálogo nutricional | UC-P10 | Profesional de Nutrición o administrador autorizado | P0 | Subcapacidad de diseño; carga manual sostiene el fallback. |
| RF-028 | Integración nutricional | UC-I07 / UC-P10 | Profesional de Nutrición | P0 API | UC-I07 es el hogar; UC-P10 ejercita importación controlada, procedencia y fallback. |
| RF-029 | Nutrición | UC-P09 | Profesional de Nutrición | P0 | Se agrupa con evaluación por objetivo de usuario, con variante de actualización. |
| RF-030 | Plan nutricional | UC-P10 | Profesional de Nutrición | P0 | Caso principal de diseño; no visible como vigente. |
| RF-031 | Activación nutricional | UC-P11 / UC-I04 / UC-I10 | Profesional de Nutrición | P0 | Caso principal; incluye validación, versionado, autorización y capacidad. |
| RF-032 | APK nutricional | UC-P12 | Asesorado | P0 | Se agrupa con registro de ejecución en un recorrido diario observable. |
| RF-033 | APK nutricional | UC-P12 | Asesorado | P0 | Mismo recorrido diario; idempotencia técnica: DERIVAR 09/11A. |
| RF-034 | Revisión nutricional | UC-P13 | Profesional de Nutrición | P0 | Prepara la revisión común; abrir información no constituye revisión. |
| RF-035 | Continuidad nutricional | UC-P13 / UC-I06 | Profesional de Nutrición | P0 | Resultado posterior a revisión; transiciones definitivas: DERIVAR 06. |
| RF-036 | Entrenamiento | UC-P14 | Profesional de Entrenamiento | P0 | Inicio del circuito de entrenamiento. |
| RF-037 | Catálogo de ejercicios | UC-P15 | Profesional de Entrenamiento o administrador autorizado | P0 | Subcapacidad del diseño; preserva operación sin wger. |
| RF-038 | Integración de entrenamiento | UC-I07 / UC-P15 | Profesional de Entrenamiento | P0 API | UC-P15 ejercita wger mediante importación controlada; catálogo BE y carga manual sostienen la operación. |
| RF-039 | Plan de entrenamiento | UC-P15 | Profesional de Entrenamiento | P0 | Caso principal de diseño por bloques y sesiones. |
| RF-040 | Plan de entrenamiento | UC-P15 | Profesional de Entrenamiento | P0 | Parte obligatoria del diseño; estructura exacta: DERIVAR 06. |
| RF-041 | Activación de entrenamiento | UC-P16 / UC-I04 / UC-I10 | Profesional de Entrenamiento | P0 | Reutiliza patrón de activación común sin copiar Nutrición. |
| RF-042 | APK de entrenamiento | UC-P17 | Asesorado | P0 | Recorrido diario de consulta y ejecución. |
| RF-043 | APK de entrenamiento | UC-P17 | Asesorado | P0 | Distingue planificación de ejecución real. |
| RF-044 | Corrección | UC-E02 / UC-I12 / UC-I03 | Asesorado o profesional autorizado según política | P0 | UC-I12 conserva original, actor, fecha, motivo y cadena; UC-E02 agrega reglas propias de ejecución. |
| RF-045 | Revisión de entrenamiento | UC-P18 | Profesional de Entrenamiento | P0 | Prepara la revisión común; no duplica la definición DEC-043. |
| RF-046 | Continuidad de entrenamiento | UC-P18 / UC-I06 | Profesional de Entrenamiento | P0 | Variantes de dominio mapeadas a semántica común. |
| RF-047 | Antropometría | UC-P19 | Profesional con capacidad antropométrica | P0 | Caso principal; exige capacidad, vínculo y consentimiento. |
| RF-048 | Antropometría | UC-I09 / UC-P19 / UC-E03 | Sistema BE y profesional responsable | P0 | Cálculos reproducibles con método y versión; fórmulas, precisión y estructura: DERIVAR 06. |
| RF-049 | Evolución antropométrica | UC-P20 | Profesional autorizado o asesorado | P0 | Caso principal de comparación longitudinal. |
| RF-050 | Corrección antropométrica | UC-E03 / UC-I12 / UC-I03 / UC-I09 | Profesional autor o autorizado | P0 | UC-I12 conserva original; UC-I09 recalcula derivados; estructura y cadena: DERIVAR 06. |
| RF-051 | Descubrimiento antropométrico | UC-P21 / UC-P22 / UC-E04 / UC-P04 / UC-P05 | Profesional elegible y asesorado | P1 | Publicación y descubrimiento limitados; UC-E04 conduce a solicitud pendiente; sin reservas, pagos, ranking, reputación, reseñas, popularidad, contratación ni marketplace. |
| RF-052 | Dashboard profesional | UC-P23 / UC-I02 | Profesional | P0 | Cartera propia orientada a acción y autorizada por relación; sin calificación agregada o priorización clínica. |
| RF-053 | Dashboard interdisciplinario | UC-P24 / UC-I02 | Profesional y sistema BE | P0 | UC-P24 es el hogar; UC-I02 autoriza cada dato o conjunto. Una autorización parcial no se amplía; no existe calificación agregada del asesorado. |
| RF-054 | Historial longitudinal | UC-P24 / UC-P31 / UC-I03 | Profesional autorizado o asesorado | P0 | Distingue momento de ocurrencia y momento de registro; conserva dominio, autoría y procedencia. |
| RF-055 | Revisión y continuidad | UC-P23 / UC-I05 | Profesional | P0 | Motivo operativo no diagnóstico; solo una revisión válida resuelve el pendiente. |
| RF-056 | Revisión profesional común | UC-I05; invocado por UC-P13 y UC-P18 | Profesional autorizado | P0 | Caso incluido por Nutrición y Entrenamiento; aplica DEC-043 y alimenta UC-S01. |
| RF-057 | Coordinación | UC-E07 / UC-I02 / UC-I03 | Profesional autorizado | P0 | Nota autorizada, trazable y no prescriptiva; no modifica planes, no decide sobre dominio ajeno y no transfiere responsabilidad. |
| RF-058 | Analítica de validación | UC-S01; productores UC-P13 / UC-P18 mediante UC-I05 / UC-I06 | Sistema BE o responsable de validación | P1 | UC-P13 y UC-P18 producen revisión válida y próxima acción/cierre; UC-S01 calcula la métrica. Fórmula, elegibilidad y versionado: DERIVAR 06/12. |
| RF-059 | Resiliencia funcional | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 | Sistema BE y profesional | P0 | Nutrición y Entrenamiento usan carga manual; descubrimiento antropométrico usa lista y ubicación textual cuando el mapa no está disponible. |
| RF-060 | Procedencia | UC-I08 / TR-04 / UC-P10 / UC-P15 | Profesional, asesorado o administrador según autorización | P0 | UC-P10 y UC-P15 conservan proveedor, fecha y decisión de incorporación en toda importación externa. |
| RF-061 | Comunicaciones | UC-P30 | Profesional o asesorado | P1 | Caso principal de soporte; fallback de Push. |
| RF-062 | Comunicaciones | UC-E08 | Profesional o asesorado | P2 | Extensión condicionada; nunca contiene información sensible. |
| RF-064 | Entrenamiento | UC-P14 | Profesional de Entrenamiento | P0 | Se agrupa con evaluación por objetivo de usuario. |
| RF-065 | APK longitudinal | UC-P31 / UC-I02 | Asesorado | P0 | Progreso propio por dominio y período; sin autodiagnóstico, comparación con terceros o acceso a notas no autorizadas. |
| RF-066 | Administración académica | UC-P29 / UC-I10 / UC-P11 / UC-P16 / UC-P19 / UC-P21 | Administrador y sistema BE | P1 | UC-P11 y UC-P16 rechazan un proceso nuevo que exceda la capacidad configurada sin interrumpir procesos vigentes; admite identidad exclusivamente antropométrica donde corresponda. |
| RF-067 | Alta profesional | UC-P01 / UC-I01 | Profesional | P0 | Mismo pipeline de evidencia; resolución independiente de especialidades. |
| RF-068 | Administración | UC-P28 | Profesional, asesorado o administrador | P1 | Caso principal de soporte; acceso restringido a incidencias propias/administrativas. |
| RF-069 | Ciclo de vida de cuenta | UC-P27 | Profesional o asesorado | P1 | Caso principal; cierre no equivale a borrado inmediato. |
| RF-070 | Métodos profesionales reproducibles | UC-I13; invocado por UC-P09, UC-P14 y especializado por UC-I09 | Profesional autorizado | P0 | BE ejecuta métodos versionados elegidos por el profesional; resultado de apoyo ≠ objetivo/requerimiento/prescripción automática; DEC-046/INV-06-133 preservados. |
| RF-071 | Solicitudes estructuradas de información | UC-P32 / UC-P33 / UC-I02 / UC-I03 | Profesional autorizado y asesorado | P0 | Request-driven; plantilla BE versionada; SELF_REPORTED; solicitud ≠ consentimiento/acceso; relación con UC-P25 explícita. |


---

### 3.13. Anclaje conductual de RNF y trazabilidad

El Documento 05 no convertirá los 38 RNF en casos de uso. Sí anclará aquellos RNF que modifican el comportamiento observable de recorridos, variantes, excepciones, garantías o postcondiciones.

| RNF | Manifestación en 05 | Aplicación principal |
|---|---|---|
| RNF-REL-001 | Ningún flujo declara éxito sin confirmación; toda falla recuperable ofrece reconsulta o salida comprensible. | Todos los casos de escritura; especialmente alta, vínculo, consentimiento, activación, ejecución, revisión y corrección. |
| RNF-DAT-003 | Los cambios relevantes generan versión, corrección o continuidad; no sobrescriben silenciosamente evidencia histórica. | UC-P10/11, UC-P15/16, UC-E02, UC-E03, UC-I03, UC-I04, UC-I12. |
| RNF-PRI-002 | La revocación debe impedir operaciones futuras del alcance y dejar evidencia verificable. | UC-P08, TR-05 y toda autorización posterior mediante UC-I02. |
| RNF-INT-002 | Todo caso temporal identifica fecha, período, unidades y referencia `America/Argentina/Buenos_Aires`. | Ejecuciones, revisiones, comparaciones antropométricas, timeline y UC-S01. |
| RNF-MAN-004 | Cada P0 debe aportar resultados y fallas observables que puedan trazarse a pruebas. | Plantilla completa de casos principales; estrategia detallada: DERIVAR 11A. |
| RNF-OBS-003 | La matriz registra caso hogar e invocantes relevantes; 12 consolidará relaciones bidireccionales con diseño, pruebas y evidencia. | Matriz RF → UC y futura trazabilidad canónica. |

No se duplicarán aquí métricas técnicas, mecanismos de persistencia, códigos, herramientas ni escenarios completos de prueba.

#### 3.13.1. Historias de usuario previstas

Se redactarán **12 historias de usuario prioritarias**, no una por caso:

1. alta profesional;
2. revisión administrativa;
3. solicitud y aceptación de vínculo;
4. consentimiento y revocación;
5. evaluación y diseño nutricional;
6. activación y consulta nutricional;
7. ejecución nutricional;
8. revisión y continuidad profesional;
9. planificación y ejecución de entrenamiento;
10. antropometría transversal;
11. dashboard interdisciplinario;
12. progreso longitudinal en APK.

Cada historia tendrá criterios `Dado / Cuando / Entonces`. Los escenarios exhaustivos permanecerán en 11A.

#### 3.13.2. Objetivos de validación antes de G4

| Decisión provisional | Casos objetivo | Qué debe validarse con usuarios |
|---|---|---|
| DEC-042 — alta profesional | UC-P01, UC-P02, UC-E01 y, como ciclo posterior, UC-P03 | comprensión del recorrido, suficiencia de evidencia, utilidad de observaciones, claridad de resolución y límites de la verificación administrativa |
| DEC-043 — revisión profesional válida | UC-I05 ejercitado desde UC-P13 y UC-P18 | suficiencia de evidencia, carga documental razonable, comprensión de resultados semánticos, próxima acción y cierre |

Estos casos recibirán detalle adicional y preguntas explícitas de validación. La validación puede confirmar, ajustar o reemplazar la decisión antes de G4.

---

### 3.14. Contraste AS-IS preliminar

Este bloque no reabre la auditoría integral. Usa el contraste anclado ya aprobado en BE-LEG-04 y lo traduce a impacto sobre casos de uso.

| Capacidad | Estado AS-IS preliminar | Clasificación | Consecuencia para 05 |
|---|---|---|---|
| Identidad local | existe parcialmente | PRESERVAR + REFACTORIZAR | conservar autenticación conforme; completar recuperación, estados y superficies |
| Google Identity | no evidenciado | NO EVIDENCIADO | modelar como extensión P1 con fallback local |
| Alta/verificación/ADMIN | parcial e insuficiente | REFACTORIZAR / NO EVIDENCIADO | diseñar recorrido completo DEC-042 |
| Vínculo y consentimiento | contradice el TO-BE en puntos centrales | REEMPLAZAR | aceptación explícita y consentimiento gobernante |
| Nutrición | parcial avanzado | PRESERVAR + REFACTORIZAR | conservar borrador/activación/snapshot/Hoy/adherencia conformes; cerrar revisión y continuidad |
| Entrenamiento | parcial desconectado | REFACTORIZAR | reutilizar patrón común y completar APK/revisión |
| Antropometría | parcial | REFACTORIZAR | incorporar capacidad transversal, procedencia y corrección |
| Dashboard interdisciplinario | parcial o ausente | REFACTORIZAR / NO EVIDENCIADO | diseñar síntesis autorizada, timeline y pendientes |
| APK Android | no evidenciada | NO EVIDENCIADO | riesgo temprano; no duplicar casos por canal |
| Open Food Facts y wger | no demostrados E2E | NO EVIDENCIADO | modelar importación controlada con fallback |

**Nota:** `RETIRAR` solo se asignará después de identificar una implementación concreta sin función válida en TO-BE. No se retirará código por inferencia documental.

---

### 3.15. Revisión crítica de la arquitectura

#### 3.15.1. Fortalezas

1. Demuestra primero la cadena prioritaria de G2.
2. Nutrición funciona como vertical trazadora.
3. Entrenamiento reutiliza patrones sin copiar el documento.
4. DEC-043 queda centralizada en `UC-I05`.
5. Autorización y auditoría no se reducen a pasos visuales.
6. APK se trata como superficie de ejecución, no como producto funcional paralelo.
7. Integraciones no pueden bloquear el núcleo.

#### 3.15.2. Riesgos a controlar

1. `UC-P01` puede crecer demasiado; debe cerrarse en la habilitación administrativa, no incluir vínculos ni planes.
2. `UC-P13` y `UC-P18` deben compartir estructura, pero conservar evidencia y decisiones propias del dominio.
3. `UC-P24` no debe absorber cartera, revisión, coordinación, analítica y cuenta en un “supercaso”.
4. Q-003, Q-004, Q-005 y Q-007 impiden fijar estados o retención definitivos.
5. Los IDs son provisorios hasta verificar el esquema canónico.
6. El caso antropométrico de descubrimiento debe permanecer limitado; cualquier reserva o pago sería expansión de alcance.
7. RF-058 no debe convertir TVCC-30 en score de salud ni en métrica causal.

#### 3.15.3. Veredicto preliminar

```text
ARQUITECTURA: APTA PARA REVISIÓN DE DIRECCIÓN
CONTRADICCIONES CRÍTICAS CON 00/02/03/04: 0 CONOCIDAS
CAMBIOS SILENCIOSOS DE REQUISITOS: 0
DECISIONES DE 06/08/09/10 CONGELADAS PREMATURAMENTE: 0
```


---

### 3.16. Resolución de la revisión externa de arquitectura

| Hallazgo | Resolución aplicada | Estado |
|---|---|---|
| UC-S01 referenciado pero inexistente | definido como caso de soporte analítico para RF-058 | RESUELTO |
| RF-005 P1 mezclado dentro del caso P0 UC-P26 | separado como UC-E09, extensión de recuperación local | RESUELTO |
| contradicción editorial de RF-025 y RF-066 | RF-025 quedó transversal con impacto explícito sobre UC-P06; RF-066 se retiró de la lista de requisitos sin caso y conserva UC-P29/UC-I10 | RESUELTO |
| matriz sin invocantes completos | encabezado y filas críticas actualizados; se registran UC-P13/P18 para RF-056 y UC-P24/P31 para RF-054 | RESUELTO |
| RNF conductuales no anclados | incorporada matriz RNF → manifestación conductual | RESUELTO |
| historias de usuario sin alcance cuantitativo | fijadas 12 historias prioritarias | RESUELTO |
| DEC-042/043 sin casos objetivo de validación | casos y preguntas de validación pre-G4 identificados | RESUELTO |

**Resultado:** la arquitectura v0.2 queda `APTA PARA DECISIÓN DE DIRECCIÓN`.

---

### 3.17. Índice propuesto para `05_Casos_de_Uso_e_Historias.md`

1. Control documental  
2. Propósito, alcance y exclusiones  
3. Fuentes, precedencia y propiedad documental  
4. Método de modelado, convenciones y profundidad  
5. Actores y responsabilidades  
6. Relaciones entre casos de uso  
7. Arquitectura general de recorridos  
8. Alta profesional  
9. Vínculo profesional–asesorado  
10. Consentimiento y autorización  
11. Circuito nutricional  
12. Revisión profesional y continuidad  
13. Circuito de entrenamiento  
14. Antropometría transversal  
15. Dashboard interdisciplinario  
16. Identidad, cuenta y administración complementaria  
17. Integraciones, procedencia y fallbacks  
18. APK del asesorado  
19. Auditoría, revocación y garantías transversales  
20. Caso de soporte analítico TVCC-30  
21. Historias de usuario prioritarias y criterios de aceptación  
22. Matriz RF/RNF → UC e invocantes  
23. Contraste AS-IS/TO-BE  
24. Validación pre-G4 de DEC-042 y DEC-043  
25. Decisiones provisionales, preguntas abiertas y derivaciones  
26. Revisión crítica consolidada  
27. Criterio de aprobación y cierre de G2  
28. Changelog

---

### 3.18. Decisión de calendario y profundidad

Dirección indicó que se prioriza un legajo completo y defendible, incluso si requiere superar la fecha objetivo del `27 de agosto de 2026`.

Aplicación en 05:

- no se recortarán casos, variantes o excepciones necesarias únicamente para sostener esa fecha;
- no se sobredocumentarán subflujos reutilizables como si fueran casos principales;
- el control de alcance continúa vigente: retrasar no autoriza incorporar funciones fuera del MVP;
- la fecha exacta replanificada permanece pendiente.

La fecha del Documento 02 no se modifica silenciosamente. El cambio de calendario deberá formalizarse mediante el control de cambios correspondiente y propagarse a 00/02/04/05 y al plan maestro cuando dirección fije una nueva fecha.

---

### 3.19. Estado del bloque

#### 3.19.1. Estado actual

```text
FUENTES G1: LEÍDAS
BE-LEG-04 v0.4.2.1 APROBADO: ADOPTADO COMO AUTORIDAD DEL PARCHE
69 RF: EXTRAÍDOS Y AGRUPADOS
ARQUITECTURA UC: RECONCILIADA PARA v0.15 — 56 UC CANDIDATOS
MATRIZ RF → UC: COMPLETA CON HOGAR E INVOCANTES CRÍTICOS
REDACCIÓN BASELINE: COMPLETA · PARCHE v0.15: EN REDACCIÓN
GIT: SIN CAMBIOS
```

#### 3.19.2. Decisiones aprobadas aplicadas

- precedencia TO-BE;
- nutrición como primera vertical demostrable;
- aceptación explícita del vínculo;
- consentimiento como gate;
- Website profesional/administrativo y APK del asesorado;
- Open Food Facts y wger con fallback;
- exclusiones del MVP;
- separación entre identidad, especialidad, habilitación, vínculo, consentimiento y autorización.

#### 3.19.3. Decisiones provisionales aplicadas

- DEC-042 — alta profesional;
- DEC-043 — revisión profesional válida.

#### 3.19.4. Pendientes

- aprobación de esta arquitectura v0.2;
- validación de los códigos UC contra el esquema canónico;
- resolución futura de Q-003, Q-004, Q-005 y Q-007 en 06/08;
- contraste AS-IS detallado por caso durante redacción;
- revisión crítica consolidada después del primer bloque de casos;
- formalización del cambio de calendario y definición de nueva fecha objetivo.

#### 3.19.5. Siguiente acción recomendada

Aprobar la arquitectura v0.2 como base de redacción y comenzar únicamente con el primer bloque:

```text
UC-P01 — Gestionar alta profesional escalonada
UC-P02 — Revisar y resolver solicitud profesional
UC-E01 — Subsanar y volver a presentar evidencia
UC-P03 — Suspender o rehabilitar capacidad profesional
```

Este bloque debe incorporar desde su primera versión las preguntas de validación pre-G4 de `DEC-042`.


---

---

## 4. Bloque 01 — Alta profesional

*Fuente ensamblada: `BE_LEG_05_v0.3.4_BLOQUE_01_JERARQUIA_NORMALIZADA.md`.*

### 4.1. Propósito del bloque

Este bloque transforma los requisitos de alta profesional en recorridos verificables sin redefinir el producto ni fijar prematuramente estados técnicos, entidades, contratos o pantallas.

Cubre:

- creación y mantenimiento del perfil profesional;
- declaración independiente de Nutrición y Entrenamiento;
- declaración de la capacidad antropométrica transversal;
- presentación versionada de evidencia;
- revisión administrativa;
- observación, aprobación o rechazo;
- subsanación;
- suspensión y rehabilitación.

No cubre:

- creación de la identidad BE;
- autenticación;
- configuración comercial o académica de capacidad;
- vínculo con asesorados;
- consentimiento;
- autorización sobre datos;
- diseño de planes;
- políticas jurídicas de evidencia;
- almacenamiento técnico;
- pantallas o navegación.

---

### 4.2. Decisión funcional aplicada

Se aplica provisionalmente el siguiente recorrido:

```text
identidad BE habilitada
→ perfil profesional
→ declaración de especialidad o capacidad transversal
→ presentación de evidencia
→ revisión administrativa independiente
→ observación, aprobación o rechazo
→ eventual subsanación
→ eventual habilitación separada
→ operación condicionada además por vínculo, consentimiento y autorización
```

#### 4.2.1. Separaciones obligatorias

```text
identidad
≠ perfil profesional
≠ especialidad
≠ capacidad antropométrica
≠ revisión administrativa
≠ habilitación académica o comercial
≠ vínculo
≠ consentimiento
≠ autorización
```

La aprobación administrativa:

- no constituye certificación oficial;
- no garantiza competencia;
- no implica aval institucional;
- no confirma matrícula vigente;
- no garantiza ausencia de sanciones;
- no concede acceso a datos de asesorados;
- no habilita automáticamente otra especialidad;
- no transforma Antropometría en una tercera especialidad.

#### 4.2.2. Equivalencia terminológica vinculante para este bloque

El término canónico es **verificación profesional**.

En este bloque, la expresión natural **aprobación administrativa** no define un concepto ni un estado paralelo: describe la resolución favorable del procedimiento de verificación profesional definido por `BE-LEG-03 §10`, `RF-012` y `DEC-005`.

La correspondencia funcional mínima es:

| Momento o resolución en 05 | Semántica canónica mínima | Regla |
|---|---|---|
| Solicitud presentada sin resolución | `PENDIENTE` | Estado mínimo aprobado por `DEC-005`; denominación técnica definitiva: `DERIVAR 06`. |
| Resolución favorable, también explicada como aprobación administrativa | `VERIFICADO` | Materializa la verificación profesional del alcance revisado; no certifica competencia ni concede autorización sobre asesorados. |
| Resolución desfavorable definitiva | `RECHAZADO` | Afecta únicamente el alcance revisado y conserva historia. |
| Restricción posterior de un alcance verificado | `SUSPENDIDO` | Corta nuevas operaciones del alcance sin borrar antecedentes. |
| Observación corregible | Resultado de workflow que admite subsanación | `DEC-042` la permite; su representación técnica y relación con los estados mínimos se derivan a `06`. |
| Rehabilitación expresa | Restitución de la condición funcional `VERIFICADO`, sujeta a las demás condiciones independientes | La transición técnica definitiva pertenece a `06/08`. |

Reglas editoriales:

1. `verificación profesional` y `VERIFICADO` se utilizan en postcondiciones, trazabilidad y referencias normativas;
2. `aprobación administrativa` solo puede utilizarse como explicación en lenguaje natural de una verificación favorable;
3. `revisión administrativa` nombra la actividad del administrador;
4. `revisión profesional válida` queda reservada al evento de seguimiento definido por `DEC-043`;
5. ningún término de este bloque congela enums o transiciones técnicas antes del Documento 06.

Este bloque aplica además el control terminológico transversal definido en `BE-LEG-05 — Glosario y control terminológico`.

---

### 4.3. Actores del bloque

| Actor | Responsabilidad en este bloque |
|---|---|
| **Profesional** | Completa su perfil, declara los alcances que solicita, aporta evidencia, presenta solicitudes y subsana observaciones cuando corresponde. |
| **Administrador** | Consulta solicitudes autorizadas, revisa la versión presentada, registra observaciones o resoluciones y gestiona suspensión o rehabilitación. |
| **Sistema BE** | Mantiene separadas las dimensiones del alta, conserva versiones y autoría, impide habilitaciones prematuras y presenta resultados observables. |

---

### 4.4. Relaciones internas

```text
UC-P01 — Gestionar alta profesional escalonada
  incluye → UC-I01 — Presentar evidencia versionada
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  incluye → UC-I11 — Encauzar al actor por la superficie prevista
  puede ser extendido por → UC-E01 — Subsanar y volver a presentar evidencia

UC-P02 — Revisar solicitud y resolver la verificación profesional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  puede originar → UC-E01 — Subsanar y volver a presentar evidencia

UC-P03 — Suspender o rehabilitar capacidad profesional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
```

La eventual habilitación académica o comercial se trata en `UC-P29`. No forma parte de la aprobación administrativa de este bloque.

---

### 4.5. UC-P01 — Gestionar alta profesional escalonada

#### 4.5.1. Código

`UC-P01`

#### 4.5.2. Nombre

**Gestionar alta profesional escalonada**

#### 4.5.3. Objetivo

Permitir que una persona con identidad BE complete su perfil profesional, declare una o ambas especialidades y/o la capacidad antropométrica transversal, aporte evidencia independiente y presente cada alcance a revisión administrativa sin obtener facultades prematuras.

#### 4.5.4. Alcance

- **Superficie:** profesional.
- **Canal previsto:** Website.
- **Inicio:** perfil profesional no presentado o con un nuevo alcance pendiente de presentación.
- **Fin:** uno o más alcances quedan presentados de forma independiente para revisión administrativa, o el trabajo queda guardado sin presentar.

#### 4.5.5. Actor principal

Profesional.

#### 4.5.6. Actores secundarios

- Sistema BE.
- Administrador, como receptor posterior de la solicitud presentada.

#### 4.5.7. Disparador

El profesional decide iniciar o continuar su alta para operar en Nutrición, Entrenamiento y/o Antropometría.

#### 4.5.8. Precondiciones

1. Existe una identidad BE autenticada y habilitada para operar su propia cuenta.
2. La identidad no obtiene automáticamente facultades profesionales por registrarse o autenticarse.
3. El profesional puede consultar su situación actual y distinguir:
   - perfil;
   - alcances declarados;
   - solicitudes presentadas;
   - observaciones;
   - resoluciones;
   - pasos pendientes.
4. La taxonomía técnica de estados y la estructura persistente se encuentran pendientes de `DERIVAR 06`.
5. BE evalúa mediante `UC-I02` que el actor pueda ejecutar la operación de alta sobre su propia identidad y que la situación de cuenta no la impida. Esta evaluación no constituye autorización sobre datos de asesorados.

#### 4.5.9. Postcondiciones de éxito

1. El perfil profesional queda guardado.
2. Cada especialidad o capacidad transversal solicitada queda identificada de forma independiente.
3. La evidencia presentada queda asociada al alcance correspondiente y a una versión identificable.
4. La solicitud presentada registra, como mínimo:
   - profesional;
   - alcance solicitado;
   - versión;
   - fecha;
   - procedencia declarada;
   - resultado inicial de presentación.
5. El profesional puede reconocer que la solicitud espera revisión administrativa.
6. Ningún alcance se presenta como aprobado o habilitado por el solo envío.
7. Otra especialidad o capacidad no cambia como efecto colateral.

#### 4.5.10. Garantías mínimas

- Guardar un perfil incompleto no concede facultades profesionales.
- Declarar una especialidad no verifica la otra.
- Declarar Antropometría no la convierte en especialidad.
- Cargar evidencia no equivale a aprobación.
- Un fallo de validación o persistencia no produce una solicitud aparentemente exitosa.
- Una versión ya presentada no se sobrescribe silenciosamente.
- No se crean vínculos, consentimientos ni autorizaciones sobre asesorados.
- Los datos solicitados deberán ser pertinentes al proceso de revisión. La selección definitiva de campos y documentos corresponde a `DERIVAR 08/10`.

#### 4.5.11. Flujo principal

1. El profesional accede a su situación de alta desde la superficie profesional.
2. BE presenta de forma diferenciada:
   - información de perfil;
   - Nutrición;
   - Entrenamiento;
   - capacidad antropométrica transversal;
   - situación de cada solicitud.
3. El profesional completa o actualiza la información de perfil requerida para iniciar el proceso.
4. BE permite guardar el perfil aun cuando no esté listo para presentación.
5. El profesional selecciona un alcance que desea solicitar:
   - Nutrición;
   - Entrenamiento;
   - capacidad antropométrica transversal.
6. BE informa que cada alcance:
   - se revisa independientemente;
   - requiere evidencia propia;
   - no concede acceso por el solo envío;
   - no equivale a certificación oficial.
7. El profesional aporta la evidencia correspondiente al alcance seleccionado.
8. BE ejecuta `UC-I01 — Presentar evidencia versionada` y verifica únicamente que el conjunto mínimo requerido para presentar esté completo y utilizable.
9. El profesional revisa el resumen del alcance, la evidencia asociada y la declaración de límites.
10. El profesional confirma la presentación.
11. BE identifica y preserva la versión presentada.
12. BE registra fecha, actor, alcance y resultado mediante `UC-I03`.
13. BE informa que la solicitud fue presentada para revisión administrativa.
14. La solicitud queda disponible para `UC-P02`, sin habilitar operaciones del alcance.
15. El profesional puede repetir los pasos 5 a 14 para otro alcance. Cada solicitud conserva evaluación y resultado independientes.

#### 4.5.12. Variantes

##### 4.5.12.1. V01 — Guardar perfil incompleto

En el paso 4, el profesional guarda la información disponible y finaliza la interacción.

**Resultado:** el perfil queda incompleto y no se crea una solicitud presentada.

##### 4.5.12.2. V02 — Solicitar una sola especialidad

El profesional presenta únicamente Nutrición o Entrenamiento.

**Resultado:** la otra especialidad no se declara, no se revisa y no cambia.

##### 4.5.12.3. V03 — Solicitar ambas especialidades

El profesional solicita Nutrición y Entrenamiento.

**Resultado:** BE genera solicitudes independientes, aunque se completen dentro de una misma sesión de trabajo.

##### 4.5.12.4. V04 — Declarar capacidad antropométrica

El profesional declara Antropometría de forma separada de Nutrición y Entrenamiento.

**Resultado:** la capacidad queda sometida al mismo patrón administrativo, con evidencia y resolución independientes.

##### 4.5.12.5. V05 — Agregar un alcance a un perfil con otro alcance ya aprobado

El profesional inicia una nueva solicitud sin afectar el alcance previamente aprobado.

**Resultado:** la nueva solicitud permanece pendiente mientras el alcance anterior conserva su situación, salvo resolución administrativa expresa diferente.

##### 4.5.12.6. V06 — Actualizar información no presentada

Mientras la información o evidencia aún no haya sido presentada, el profesional puede modificarla.

**Resultado:** BE conserva el borrador vigente conforme al modelo que defina `DERIVAR 06`.

##### 4.5.12.7. V07 — Reingreso después de una observación

Si existe una solicitud observada y la resolución admite subsanación, el recorrido continúa mediante `UC-E01`.

#### 4.5.13. Excepciones

##### 4.5.13.1. E01 — Perfil insuficiente para presentar

BE detecta que falta información mínima.

**Resultado:**

- no presenta la solicitud;
- identifica qué condición falta;
- permite conservar el trabajo disponible;
- no muestra éxito falso.

##### 4.5.13.2. E02 — Evidencia faltante, inutilizable o no asociable al alcance

BE no puede utilizar la evidencia para la presentación.

**Resultado:**

- no presenta el alcance afectado;
- informa el problema de forma comprensible;
- no modifica otros alcances.

Los formatos, tamaños, vigencias y controles concretos pertenecen a `DERIVAR 08/09/10`.

##### 4.5.13.3. E03 — Solicitud equivalente ya presentada

Existe una solicitud vigente equivalente para el mismo alcance y versión.

**Resultado:**

- BE evita una duplicación contradictoria;
- presenta la situación existente;
- no registra una segunda presentación como éxito.

La regla técnica de equivalencia pertenece a `DERIVAR 06`.

##### 4.5.13.4. E04 — Cuenta no habilitada

La identidad no puede operar su propia cuenta.

**Resultado:** BE bloquea la presentación sin alterar solicitudes previas.

Los motivos y efectos de cuenta pertenecen a `DERIVAR 06/08`.

##### 4.5.13.5. E05 — Falla al preservar la versión o registrar la presentación

BE no puede confirmar persistencia o auditoría.

**Resultado:**

- la solicitud no se declara presentada;
- el profesional recibe un resultado recuperable;
- no se concede ninguna facultad.

##### 4.5.13.6. E06 — Intento de presentar un alcance ya aprobado como si fuera inicial

BE detecta que el alcance ya posee una aprobación administrativa vigente.

**Resultado:** no duplica la aprobación y orienta al recorrido aplicable para cambios posteriores, suspensión o nueva evidencia, según las reglas que defina `DERIVAR 06/08`.

#### 4.5.14. Reglas aplicables

1. Cada alcance se evalúa independientemente.
2. Nutrición y Entrenamiento son las especialidades iniciales.
3. Antropometría es una capacidad transversal.
4. El envío de evidencia no produce aprobación.
5. La aprobación administrativa no produce autorización sobre asesorados.
6. La habilitación comercial o académica es una dimensión separada.
7. La versión presentada debe poder identificarse y no sobrescribirse silenciosamente.
8. El profesional debe comprender los límites de “verificado”.
9. El administrador no participa en la edición del perfil del profesional.
10. La interacción específica y sus componentes pertenecen a `DERIVAR 10`.

#### 4.5.15. Información utilizada o generada

##### 4.5.15.1. Utilizada

- identidad BE;
- situación de cuenta;
- perfil profesional;
- alcance solicitado;
- evidencia aportada;
- declaraciones requeridas;
- historial previo del mismo alcance.

##### 4.5.15.2. Generada

- perfil guardado;
- borrador de solicitud;
- versión presentada;
- fecha de presentación;
- procedencia declarada;
- relación entre alcance y evidencia;
- resultado de presentación;
- evento de auditoría.

#### 4.5.16. Requisitos relacionados

##### 4.5.16.1. RF

- `RF-008`
- `RF-009`
- `RF-010`
- `RF-015`
- `RF-067`

##### 4.5.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 4.5.17. Casos incluidos

- `UC-I01 — Presentar evidencia versionada`
- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

#### 4.5.18. Casos extendidos

- `UC-E01 — Subsanar y volver a presentar evidencia`

#### 4.5.19. Puntos de auditoría

- creación y modificación relevante del perfil;
- declaración de cada alcance;
- asociación de evidencia;
- versión presentada;
- fecha y actor de presentación;
- resultado de presentación;
- intento fallido que no produjo solicitud;
- relación entre solicitud nueva y antecedentes, cuando corresponda.

Los eventos, datos mínimos y retención pertenecen a `DERIVAR 08`.

#### 4.5.20. Decisiones o preguntas abiertas

1. Taxonomía técnica de estados: `DERIVAR 06`.
2. Documentos admitidos, vigencias, legitimidad y tratamiento de evidencia: `DERIVAR 08`.
3. Estructura, campos, archivos y almacenamiento: `DERIVAR 06/07/08`.
4. Contratos de presentación: `DERIVAR 09`.
5. Secuencia de formularios, navegación y copy: `DERIVAR 10`.
6. La validación pre-G4 debe confirmar:
   - comprensión de las etapas;
   - documentación que el profesional puede aportar;
   - fricción del recorrido;
   - comprensión de que Antropometría se revisa separadamente;
   - comprensión de que “verificado” tiene alcance administrativo limitado.

#### 4.5.21. Criterio de cierre

El caso termina cuando:

- una solicitud independiente queda presentada y disponible para revisión; o
- el profesional guarda su trabajo sin presentar; o
- BE informa una excepción sin conceder facultades ni declarar un éxito inexistente.

---

### 4.6. UC-P02 — Revisar solicitud y resolver la verificación profesional

#### 4.6.1. Código

`UC-P02`

#### 4.6.2. Nombre

**Revisar solicitud y resolver la verificación profesional**

#### 4.6.3. Objetivo

Permitir que un administrador revise una versión presentada y resuelva la verificación profesional de un alcance específico mediante observación, verificación favorable o rechazo fundamentado, sin afectar otras especialidades o capacidades.

#### 4.6.4. Alcance

- **Superficie:** administrativa.
- **Canal previsto:** Website.
- **Inicio:** existe una solicitud presentada y pendiente de resolución administrativa.
- **Fin:** la solicitud queda observada, aprobada o rechazada con fundamento, autoría, fecha y trazabilidad.

#### 4.6.5. Actor principal

Administrador.

#### 4.6.6. Actores secundarios

- Profesional.
- Sistema BE.

#### 4.6.7. Disparador

El administrador selecciona una solicitud presentada para revisión.

#### 4.6.8. Precondiciones

1. El administrador posee una sesión válida y facultad administrativa aplicable.
2. La solicitud:
   - identifica al profesional;
   - identifica un único alcance;
   - conserva una versión presentada;
   - posee evidencia disponible para revisión.
3. La identidad, especialidad, capacidad transversal, habilitación y autorización permanecen separadas.
4. El administrador accede únicamente a la información necesaria para resolver la solicitud.
5. Los criterios y políticas detalladas de evidencia pertenecen a `DERIVAR 08`.

#### 4.6.9. Postcondiciones de éxito

1. La resolución queda asociada a:
   - solicitud;
   - alcance;
   - versión revisada;
   - administrador;
   - fecha;
   - fundamento.
2. El resultado afecta únicamente el alcance evaluado.
3. El profesional puede consultar el resultado y su fundamento.
4. Si el resultado es observación y admite subsanación, se habilita `UC-E01`.
5. Si la verificación se resuelve favorablemente:
   - el alcance alcanza el resultado semántico mínimo `VERIFICADO`;
   - esta resolución puede explicarse en lenguaje natural como aprobación administrativa;
   - no se verifica otra especialidad o capacidad;
   - no se concede acceso a asesorados;
   - la habilitación académica o comercial permanece separada.
6. Si la verificación se resuelve desfavorablemente:
   - el alcance alcanza el resultado semántico mínimo `RECHAZADO`;
   - no queda habilitado para operar.
7. La resolución de verificación queda trazable.
8. La denominación técnica definitiva de estados y transiciones permanece en `DERIVAR 06`.

#### 4.6.10. Garantías mínimas

- El administrador no puede resolver sin identificar la versión revisada.
- La resolución no modifica silenciosamente la evidencia.
- Una aprobación no se presenta como certificación oficial.
- Una observación no se presenta como rechazo definitivo.
- Un rechazo no elimina el expediente.
- Resolver Nutrición no modifica Entrenamiento ni Antropometría.
- Resolver Antropometría no modifica las especialidades.
- Un error de persistencia no muestra una resolución exitosa.
- La suspensión de un alcance ya aprobado se gestiona mediante `UC-P03`, no como resolución inicial.

#### 4.6.11. Flujo principal

1. El administrador accede a las solicitudes que está autorizado a revisar.
2. BE identifica para cada solicitud:
   - profesional;
   - alcance;
   - fecha;
   - versión;
   - situación administrativa.
3. El administrador selecciona una solicitud.
4. BE presenta la versión enviada, la evidencia relacionada y los antecedentes necesarios.
5. El administrador verifica:
   - completitud administrativa;
   - correspondencia entre alcance y evidencia;
   - procedencia declarada;
   - observaciones previas, si existen.
6. El administrador selecciona un resultado:
   - observar;
   - aprobar;
   - rechazar.
7. El administrador registra un fundamento comprensible y suficiente para el resultado.
8. BE solicita confirmación del alcance y de la versión que serán afectados.
9. El administrador confirma la resolución.
10. BE valida que la solicitud continúe disponible para resolución y que no exista una decisión concurrente incompatible.
11. BE registra actor, fecha, alcance, versión, resultado y fundamento mediante `UC-I03`.
12. BE aplica el resultado únicamente al alcance seleccionado.
13. BE hace visible el resultado al profesional.
14. Si el resultado fue observación con subsanación permitida, el profesional puede continuar mediante `UC-E01`.
15. Si el resultado fue aprobación, cualquier habilitación adicional se procesa separadamente.
16. El caso finaliza sin conceder vínculos, consentimientos ni autorización sobre datos.

#### 4.6.12. Variantes

##### 4.6.12.1. V01 — Observación con subsanación

El administrador determina que la solicitud requiere correcciones o evidencia adicional y permite una nueva presentación.

**Resultado:** la versión revisada permanece preservada y se habilita `UC-E01`.

##### 4.6.12.2. V02 — Verificación favorable

El administrador considera suficiente la revisión administrativa del alcance.

**Resultado:** el alcance alcanza la semántica funcional `VERIFICADO`. La expresión “aprobación administrativa” puede utilizarse únicamente como explicación natural de este resultado, con las limitaciones declaradas en este caso.

##### 4.6.12.3. V03 — Verificación rechazada

El administrador determina que la solicitud no puede verificarse favorablemente.

**Resultado:** el alcance alcanza la semántica funcional `RECHAZADO`, no queda habilitado y conserva fundamento e historia.

La posibilidad futura de iniciar otra solicitud debe ser definida sin borrar este expediente mediante `DERIVAR 06/08`.

##### 4.6.12.4. V04 — Resolución independiente de varias solicitudes del mismo profesional

El administrador revisa más de un alcance del mismo profesional.

**Resultado:** cada solicitud recibe una resolución separada. No se aplica una resolución masiva implícita.

##### 4.6.12.5. V05 — Revisión de capacidad antropométrica

La solicitud corresponde a la capacidad antropométrica transversal.

**Resultado:** se utiliza la misma semántica administrativa, pero el resultado no crea una tercera especialidad.

##### 4.6.12.6. V06 — Solicitud con antecedentes de subsanación

El administrador consulta la versión anterior, las observaciones y la nueva versión.

**Resultado:** la resolución identifica expresamente cuál versión fue revisada.

#### 4.6.13. Excepciones

##### 4.6.13.1. E01 — Administrador sin facultad aplicable

BE detecta que el actor no puede revisar la solicitud.

**Resultado:** bloquea el acceso o la resolución y registra el intento según política.

##### 4.6.13.2. E02 — Evidencia no disponible o incompleta por falla operativa

La evidencia que debía estar preservada no puede consultarse.

**Resultado:**

- no se permite aprobar o rechazar como si se hubiera revisado;
- la solicitud permanece sin resolución;
- BE informa la incidencia recuperable.

##### 4.6.13.3. E03 — Solicitud modificada después de presentarse

BE detecta una diferencia no versionada entre el contenido presentado y el mostrado.

**Resultado:**

- no permite resolver esa versión;
- conserva la solicitud;
- deriva la inconsistencia para tratamiento;
- no reemplaza evidencia silenciosamente.

##### 4.6.13.4. E04 — Resolución concurrente

Otro administrador resolvió o modificó la situación antes de la confirmación.

**Resultado:**

- BE no declara éxito;
- presenta la situación vigente;
- exige revisar nuevamente antes de otra decisión.

##### 4.6.13.5. E05 — Fundamento insuficiente

El administrador intenta confirmar sin un fundamento requerido.

**Resultado:** BE no registra la resolución y señala la condición faltante.

El contenido mínimo definitivo pertenece a `DERIVAR 06/08`.

##### 4.6.13.6. E06 — Falla al registrar la resolución

BE no puede confirmar persistencia o auditoría.

**Resultado:**

- no presenta la solicitud como resuelta;
- no cambia facultades;
- informa un resultado recuperable.

#### 4.6.14. Reglas aplicables

1. La revisión es administrativa y trazable.
2. La revisión se realiza por alcance.
3. No existe aprobación implícita por silencio, demora o carga documental.
4. El resultado `VERIFICADO` no garantiza competencia.
5. El resultado `VERIFICADO` no concede acceso a datos.
6. Una resolución debe identificar la versión revisada.
7. La observación debe explicar qué impide aprobar y si admite subsanación.
8. El rechazo debe conservar fundamento e historia.
9. El administrador no modifica evidencia del profesional.
10. La suspensión posterior pertenece a `UC-P03`.
11. Los estados técnicos y sus transiciones definitivas pertenecen a `DERIVAR 06`.

#### 4.6.15. Información utilizada o generada

##### 4.6.15.1. Utilizada

- identidad y perfil profesional;
- alcance solicitado;
- versión presentada;
- evidencia;
- procedencia declarada;
- antecedentes y observaciones;
- facultad administrativa del revisor.

##### 4.6.15.2. Generada

- resultado administrativo;
- fundamento;
- autoría;
- fecha;
- relación con la versión;
- eventual permiso de subsanación;
- evento de auditoría.

#### 4.6.16. Requisitos relacionados

##### 4.6.16.1. RF

- `RF-011 — Revisar una solicitud profesional`
- `RF-012 — Resolver la verificación por especialidad o capacidad transversal`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Declarar la capacidad antropométrica transversal y aportar evidencia`

##### 4.6.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 4.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 4.6.18. Casos extendidos

- `UC-E01 — Subsanar y volver a presentar evidencia`

#### 4.6.19. Puntos de auditoría

- acceso a la solicitud;
- versión consultada;
- actor revisor;
- resultado seleccionado;
- fundamento;
- fecha;
- alcance afectado;
- confirmación;
- resolución fallida;
- concurrencia detectada;
- consulta posterior por el profesional.

#### 4.6.20. Decisiones o preguntas abiertas

1. Taxonomía técnica y transiciones: `DERIVAR 06`.
2. Criterios documentales, vigencias y tratamiento de evidencia: `DERIVAR 08`.
3. Alcance de acceso del administrador a datos del expediente: `DERIVAR 08`.
4. Contratos y respuesta ante concurrencia: `DERIVAR 09`.
5. Consola, filtros, comparaciones y copy: `DERIVAR 10`.
6. La validación pre-G4 debe confirmar:
   - claridad de cada resultado;
   - utilidad de las observaciones;
   - suficiencia del fundamento;
   - comprensión de que la aprobación es administrativa;
   - comprensión de que otra especialidad no queda aprobada;
   - carga razonable para el administrador.

#### 4.6.21. Criterio de cierre

El caso termina cuando:

- la solicitud queda observada, aprobada o rechazada con trazabilidad; o
- una excepción impide la resolución sin alterar facultades ni presentar éxito falso.

---

### 4.7. UC-E01 — Subsanar y volver a presentar evidencia

#### 4.7.1. Código

`UC-E01`

#### 4.7.2. Nombre

**Subsanar y volver a presentar evidencia**

#### 4.7.3. Tipo

Extensión de:

- `UC-P01`;
- `UC-P02`.

#### 4.7.4. Objetivo

Permitir que el profesional responda una observación corregible y presente una nueva versión sin borrar la solicitud, evidencia, observaciones o resolución anterior.

#### 4.7.5. Condición de extensión

Existe una solicitud no aprobada cuya resolución:

- identifica qué debe corregirse;
- permite subsanación;
- conserva la versión previa.

#### 4.7.6. Actor principal

Profesional.

#### 4.7.7. Actores secundarios

- Administrador.
- Sistema BE.

#### 4.7.8. Precondiciones

1. La identidad del profesional se encuentra habilitada para operar su cuenta.
2. Existe una observación consultable.
3. La observación corresponde a un alcance específico.
4. La subsanación está permitida.
5. La versión anterior no puede sobrescribirse.

#### 4.7.9. Flujo diferencial

1. El profesional consulta la observación y su fundamento.
2. BE identifica el alcance y la versión observada.
3. El profesional completa o sustituye la información permitida.
4. El profesional aporta evidencia adicional o corregida.
5. BE relaciona el nuevo contenido con la versión anterior.
6. El profesional revisa el resumen de subsanación.
7. El profesional confirma la nueva presentación.
8. BE genera una versión nueva identificable.
9. BE conserva:
   - versión anterior;
   - observación;
   - nueva versión;
   - relación entre ambas.
10. BE registra actor, fecha y resultado mediante `UC-I03`.
11. La nueva versión queda disponible para `UC-P02`.
12. La subsanación no se presenta como aprobación.

#### 4.7.10. Variantes

##### 4.7.10.1. V01 — Corrección parcial

El profesional responde únicamente los puntos observados y conserva el resto del contenido como antecedente relacionado.

##### 4.7.10.2. V02 — Nueva evidencia

El profesional incorpora evidencia adicional sin eliminar la previamente revisada.

##### 4.7.10.3. V03 — Subsanación de uno entre varios alcances

Solo se modifica el alcance observado. Los demás permanecen sin cambios.

#### 4.7.11. Excepciones

##### 4.7.11.1. E01 — Observación sin subsanación permitida

BE no habilita el reenvío dentro del mismo expediente.

**Resultado:** conserva la resolución y orienta al tratamiento que definan `DERIVAR 06/08`.

##### 4.7.11.2. E02 — Cambios fuera del alcance observado

El profesional intenta alterar otro alcance desde la subsanación.

**Resultado:** BE separa o rechaza la operación; no modifica la otra solicitud.

##### 4.7.11.3. E03 — Nueva versión incompleta

BE detecta que la subsanación no reúne las condiciones mínimas.

**Resultado:** no presenta la nueva versión y muestra qué falta.

##### 4.7.11.4. E04 — Falla de versionado o auditoría

BE no puede preservar correctamente la relación entre versiones.

**Resultado:** no declara la subsanación presentada.

#### 4.7.12. Postcondiciones

1. Existe una nueva versión presentada.
2. La versión anterior y la observación permanecen preservadas.
3. El nuevo envío no produce aprobación automática.
4. El administrador puede comparar antecedentes relevantes.
5. Solo el alcance observado resulta afectado.

#### 4.7.13. Requisitos relacionados

- `RF-013`
- `RF-009`
- `RF-010`
- `RF-011`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`

#### 4.7.14. Puntos de auditoría

- consulta de observación;
- versión de origen;
- cambios declarados;
- nueva evidencia;
- nueva versión;
- fecha y actor;
- relación entre versiones;
- resultado del reenvío.

#### 4.7.15. Decisiones abiertas y derivaciones

- cantidad de ciclos permitidos: `DERIVAR 06/08`;
- plazos de subsanación: `DERIVAR 08`;
- comparación visual de versiones: `DERIVAR 10`;
- contratos de evidencia: `DERIVAR 09`.

#### 4.7.16. Criterio de cierre

La extensión termina cuando una nueva versión queda presentada y relacionada con el antecedente, o cuando BE informa una excepción sin borrar historia ni producir aprobación.

---

### 4.8. UC-P03 — Suspender o rehabilitar capacidad profesional

#### 4.8.1. Código

`UC-P03`

#### 4.8.2. Nombre

**Suspender o rehabilitar capacidad profesional**

#### 4.8.3. Objetivo

Permitir que un administrador restrinja o restituya expresamente la operación de una especialidad o capacidad transversal, con motivo, alcance, autoría y trazabilidad, sin borrar historial ni afectar otros alcances de forma implícita.

#### 4.8.4. Alcance

- **Superficie:** administrativa.
- **Canal previsto:** Website.
- **Inicio:** existe un alcance previamente aprobado o suspendido.
- **Fin:** el alcance seleccionado queda suspendido o rehabilitado mediante resolución explícita.

#### 4.8.5. Actor principal

Administrador.

#### 4.8.6. Actores secundarios

- Profesional.
- Sistema BE.
- Actores afectados por operaciones futuras del alcance, sin participación directa.

#### 4.8.7. Disparador

El administrador recibe o identifica una causa administrativa que requiere suspender o reconsiderar un alcance profesional.

#### 4.8.8. Precondiciones

##### 4.8.8.1. Para suspender

1. El alcance seleccionado se encuentra administrativamente aprobado o habilitado para operar.
2. El administrador posee facultad para resolver sobre ese alcance.
3. La suspensión identifica profesional, alcance y motivo.

##### 4.8.8.2. Para rehabilitar

1. El alcance seleccionado se encuentra suspendido.
2. Existe fundamento para reconsiderar la suspensión.
3. El administrador posee facultad para rehabilitar.
4. Las condiciones adicionales que correspondan se definen en `DERIVAR 06/08`.

#### 4.8.9. Postcondiciones de éxito

##### 4.8.9.1. Suspensión

1. El alcance alcanza la semántica funcional mínima `SUSPENDIDO`.
2. Las nuevas operaciones del alcance quedan bloqueadas.
3. El historial previo no se elimina.
4. Las demás especialidades y capacidades no cambian implícitamente.
5. El profesional puede conocer el alcance, fecha y motivo de la suspensión, según la política aplicable.
6. El evento queda trazable.

##### 4.8.9.2. Rehabilitación

1. El alcance deja de estar suspendido mediante resolución explícita.
2. Cuando las demás condiciones independientes se cumplen, recupera la semántica funcional `VERIFICADO`.
3. La rehabilitación no se produce automáticamente por tiempo o silencio.
4. Las condiciones de habilitación, vínculo, consentimiento y autorización continúan evaluándose de forma independiente.
5. El evento queda trazable.
6. La transición técnica definitiva se deriva a `06/08`.

#### 4.8.10. Garantías mínimas

- Una suspensión no borra planes, decisiones, evaluaciones o auditoría.
- La suspensión de Nutrición no suspende Entrenamiento ni Antropometría salvo resolución expresa separada.
- La suspensión de Antropometría no altera las especialidades.
- La rehabilitación no concede vínculos, consentimientos o autorizaciones.
- La rehabilitación no sustituye una habilitación académica o comercial faltante.
- Una falla de persistencia no muestra el alcance como suspendido o rehabilitado.
- Los efectos detallados sobre procesos activos y lectura histórica permanecen en `DERIVAR 06/08`.

#### 4.8.11. Flujo principal — Suspensión

1. El administrador busca al profesional y consulta sus alcances.
2. BE presenta de forma separada:
   - Nutrición;
   - Entrenamiento;
   - capacidad antropométrica;
   - habilitación académica o comercial, cuando corresponda.
3. El administrador selecciona un alcance operativo.
4. BE presenta su situación, antecedentes administrativos y efectos funcionales conocidos.
5. El administrador selecciona la acción de suspensión.
6. El administrador registra un motivo y el alcance de la medida.
7. BE solicita confirmación explícita.
8. BE verifica que el administrador continúe autorizado y que el alcance conserve una situación compatible.
9. El administrador confirma.
10. BE registra actor, fecha, profesional, alcance, motivo y resultado mediante `UC-I03`.
11. BE bloquea nuevas operaciones del alcance.
12. BE conserva el historial.
13. BE hace visible la nueva situación a los actores autorizados.
14. El caso finaliza.

#### 4.8.12. Flujo principal — Rehabilitación

1. El administrador selecciona un alcance suspendido.
2. BE presenta:
   - motivo de suspensión;
   - fecha;
   - autor;
   - antecedentes disponibles;
   - condiciones pendientes conocidas.
3. El administrador verifica si corresponde rehabilitar.
4. El administrador registra el fundamento de la rehabilitación.
5. BE solicita confirmación explícita.
6. BE verifica que la situación continúe siendo compatible.
7. El administrador confirma.
8. BE registra actor, fecha, alcance, fundamento y resultado.
9. BE restituye la posibilidad de operar el alcance, sujeta a las demás condiciones independientes.
10. BE conserva la suspensión como antecedente.
11. BE informa la nueva situación a los actores autorizados.
12. El caso finaliza.

#### 4.8.13. Variantes

##### 4.8.13.1. V01 — Suspensión de una sola especialidad

Se suspende Nutrición o Entrenamiento.

**Resultado:** el otro alcance permanece sin cambios.

##### 4.8.13.2. V02 — Suspensión de capacidad antropométrica

Se suspende únicamente Antropometría.

**Resultado:** no pueden iniciarse nuevas evaluaciones ni publicaciones de ese alcance; las especialidades permanecen separadas.

##### 4.8.13.3. V03 — Suspensión de varios alcances

Existen motivos para más de un alcance.

**Resultado:** el administrador debe emitir decisiones explícitas por cada alcance. No se aplica una suspensión masiva implícita.

##### 4.8.13.4. V04 — Rehabilitación condicionada a nueva evidencia

La política aplicable exige evidencia actualizada.

**Resultado:** el administrador no rehabilita hasta que se complete el recorrido requerido. El mecanismo se define en `DERIVAR 06/08`; puede reutilizar el patrón de presentación de evidencia sin borrar antecedentes.

##### 4.8.13.5. V05 — Habilitación comercial o académica insuficiente

El alcance deja de estar suspendido, pero carece de otra condición independiente.

**Resultado:** la rehabilitación administrativa no se presenta como operación plenamente habilitada.

#### 4.8.14. Excepciones

##### 4.8.14.1. E01 — Alcance no suspendible desde este caso

La situación seleccionada no corresponde a una especialidad o capacidad profesional administrable mediante `UC-P03`.

**Resultado:** BE no aplica la acción y orienta al caso correcto.

##### 4.8.14.2. E02 — Alcance ya suspendido

El administrador intenta suspender nuevamente el mismo alcance sin una nueva resolución aplicable.

**Resultado:** BE presenta la situación vigente y evita un éxito falso o un evento duplicado contradictorio.

##### 4.8.14.3. E03 — Alcance no suspendido al intentar rehabilitar

BE detecta que el alcance no requiere rehabilitación.

**Resultado:** no registra la acción como exitosa.

##### 4.8.14.4. E04 — Operación concurrente

La situación cambió antes de la confirmación.

**Resultado:** BE no aplica la decisión y exige revisar nuevamente.

##### 4.8.14.5. E05 — Motivo o fundamento insuficiente

Falta información mínima para confirmar.

**Resultado:** BE no ejecuta la medida.

##### 4.8.14.6. E06 — Falla de persistencia o auditoría

BE no puede confirmar la operación.

**Resultado:** no declara el alcance suspendido o rehabilitado y no produce cambios parciales visibles como éxito.

#### 4.8.15. Reglas aplicables

1. Suspensión y rehabilitación son decisiones administrativas expresas.
2. Toda decisión se aplica por alcance.
3. No existe rehabilitación automática.
4. El historial se conserva.
5. La suspensión corta nuevas operaciones del alcance.
6. Los efectos sobre procesos activos, acceso histórico, vínculos y planes pertenecen a `DERIVAR 06/08`.
7. La suspensión de cuenta completa no se resuelve en este caso.
8. La habilitación académica o comercial continúa separada.
9. El profesional debe poder distinguir la medida administrativa de una certificación o sanción oficial.
10. Los estados técnicos pertenecen a `DERIVAR 06`.

#### 4.8.16. Información utilizada o generada

##### 4.8.16.1. Utilizada

- identidad profesional;
- alcance seleccionado;
- situación administrativa;
- antecedentes;
- motivo o fundamento;
- facultad del administrador;
- condiciones independientes conocidas.

##### 4.8.16.2. Generada

- decisión de suspensión o rehabilitación;
- alcance;
- motivo o fundamento;
- actor;
- fecha;
- situación resultante;
- evento de auditoría.

#### 4.8.17. Requisitos relacionados

##### 4.8.17.1. RF

- `RF-012 — Resolver la verificación por especialidad o capacidad transversal`
- `RF-014 — Suspender y rehabilitar una capacidad profesional`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Declarar la capacidad antropométrica transversal y aportar evidencia`

##### 4.8.17.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 4.8.18. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 4.8.19. Casos extendidos

Ninguno obligatorio en esta versión.

#### 4.8.20. Puntos de auditoría

- consulta de situación;
- alcance seleccionado;
- motivo;
- decisión;
- actor;
- fecha;
- confirmación;
- situación anterior y posterior;
- operación concurrente o fallida;
- comunicación de la decisión.

#### 4.8.21. Decisiones o preguntas abiertas

1. Efectos sobre planes, evaluaciones o procesos activos: `DERIVAR 06`.
2. Lectura histórica durante suspensión: `DERIVAR 08`.
3. Tratamiento de vínculos activos: `DERIVAR 06/08`.
4. Criterios para rehabilitación y evidencia actualizada: `DERIVAR 08`.
5. Comunicación y contenido visible: `DERIVAR 08/10`.
6. Contratos y concurrencia: `DERIVAR 09`.
7. La validación pre-G4 debe confirmar:
   - comprensión de suspensión y rehabilitación;
   - diferencia entre suspensión de un alcance y cierre de cuenta;
   - comprensión de que otros alcances no cambian;
   - claridad sobre las operaciones bloqueadas;
   - carga administrativa razonable.

#### 4.8.22. Criterio de cierre

El caso termina cuando el alcance queda suspendido o rehabilitado mediante decisión explícita y trazable, o cuando una excepción impide el cambio sin producir un estado falso ni alterar otros alcances.

---

### 4.9. Historias de usuario prioritarias del bloque

#### 4.9.1. HU-01 — Alta profesional

**Como** profesional  
**quiero** completar mi perfil, declarar cada alcance y presentar evidencia de forma independiente  
**para** solicitar una revisión administrativa sin que el sistema confunda mi identidad, mis especialidades o mi capacidad antropométrica.

##### 4.9.1.1. Criterios de aceptación

###### 4.9.1.1.1. Escenario 1 — Presentación independiente

**Dado** que tengo una identidad BE habilitada y un perfil suficiente  
**y** aporté evidencia para Nutrición  
**cuando** confirmo la presentación  
**entonces** BE registra una versión identificable para Nutrición  
**y** la deja pendiente de revisión  
**y** no aprueba Entrenamiento ni Antropometría  
**y** no me concede acceso a datos de asesorados.

###### 4.9.1.1.2. Escenario 2 — Perfil incompleto

**Dado** que mi perfil todavía no reúne las condiciones mínimas  
**cuando** intento presentar un alcance  
**entonces** BE no crea una solicitud presentada  
**y** informa qué condición falta  
**y** no muestra un resultado exitoso.

###### 4.9.1.1.3. Escenario 3 — Antropometría separada

**Dado** que deseo declarar capacidad antropométrica  
**cuando** aporto su evidencia y presento la solicitud  
**entonces** BE la registra como capacidad transversal independiente  
**y** no la presenta como tercera especialidad  
**y** no altera Nutrición o Entrenamiento.

###### 4.9.1.1.4. Escenario 4 — Subsanación

**Dado** que una solicitud fue observada y admite corrección  
**cuando** presento nueva evidencia  
**entonces** BE genera una nueva versión  
**y** conserva la versión anterior y la observación  
**y** el reenvío no se presenta como aprobación.

---

#### 4.9.2. HU-02 — Revisión administrativa

**Como** administrador  
**quiero** revisar cada solicitud y resolver la verificación de cada alcance con fundamento y trazabilidad  
**para** controlar el acceso profesional sin certificar competencias ni conceder autorizaciones ajenas al proceso.

##### 4.9.2.1. Criterios de aceptación

###### 4.9.2.1.1. Escenario 1 — Aprobación acotada

**Dado** que reviso una versión presentada de Nutrición  
**cuando** registro una aprobación fundamentada  
**entonces** BE afecta únicamente Nutrición  
**y** conserva versión, autor, fecha y fundamento  
**y** no aprueba Entrenamiento ni Antropometría  
**y** no crea vínculos o consentimientos.

###### 4.9.2.1.2. Escenario 2 — Observación

**Dado** que la evidencia requiere corrección  
**cuando** registro una observación que admite subsanación  
**entonces** el profesional puede conocer qué debe corregir  
**y** la versión revisada permanece preservada  
**y** la solicitud no aparece como aprobada.

###### 4.9.2.1.3. Escenario 3 — Rechazo

**Dado** que la solicitud no puede aprobarse  
**cuando** registro un rechazo con fundamento  
**entonces** el alcance no queda habilitado  
**y** el expediente permanece trazable  
**y** los demás alcances no cambian.

###### 4.9.2.1.4. Escenario 4 — Suspensión posterior

**Dado** que un alcance previamente aprobado requiere restricción  
**cuando** confirmo una suspensión con motivo  
**entonces** BE bloquea nuevas operaciones de ese alcance  
**y** conserva el historial  
**y** no suspende otros alcances sin decisiones separadas.

---

### 4.10. Contraste AS-IS específico del bloque

El contraste se mantiene preliminar y no reemplaza la auditoría anclada del Documento 04.

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Perfil profesional separado de verificación | Parcial | `REFACTORIZAR` | Preservar datos útiles; impedir que el perfil conceda facultades. |
| Solicitud independiente por especialidad | Parcial o no evidenciada de extremo a extremo | `REFACTORIZAR / NO EVIDENCIADO` | Introducir expediente y resolución por alcance. |
| Capacidad antropométrica transversal | No evidenciada como recorrido completo | `NO EVIDENCIADO` | Incorporar declaración, evidencia y resolución independiente. |
| Presentación versionada | No evidenciada de forma suficiente | `NO EVIDENCIADO` | Evitar sobrescritura y registrar versión presentada. |
| Observación y subsanación | No evidenciada | `NO EVIDENCIADO` | Incorporar bucle trazable sin aprobación automática. |
| Aprobación/rechazo fundamentado | Parcial | `REFACTORIZAR` | Separar resultado, alcance, fundamento y autoría. |
| Suspensión y rehabilitación por alcance | Parcial o no evidenciada | `REFACTORIZAR / NO EVIDENCIADO` | Bloqueo de nuevas operaciones sin pérdida histórica. |
| Verificación booleana única | Contradice el TO-BE aprobado | `REEMPLAZAR` | Sustituir por semántica capaz de representar solicitud, resolución y suspensión. |

No se asigna `RETIRAR` sin identificar una implementación concreta cuya función carezca de validez TO-BE.

---

### 4.11. Revisión crítica del bloque

#### 4.11.1. Controles superados

1. Los cuatro casos permanecen dentro de Alta profesional.
2. No se incorporan vínculos, consentimientos o planificación.
3. La verificación favorable, explicada como aprobación administrativa, no se convierte en certificación.
4. Nutrición, Entrenamiento y Antropometría se resuelven independientemente.
5. La evidencia presentada queda versionada y no se sobrescribe silenciosamente.
6. Observación, rechazo y suspensión conservan historia.
7. Los estados técnicos, seguridad, contratos y pantallas permanecen derivados.
8. `DEC-042` tiene casos y preguntas concretas de validación pre-G4.

#### 4.11.2. Riesgos abiertos

##### 4.11.2.1. R-05-ALTA-01 — Ambigüedad entre aprobación y habilitación

**Riesgo:** que implementación o UI interpreten una aprobación administrativa como permiso suficiente para operar.

**Control en 05:** todos los casos declaran que la habilitación y la autorización son dimensiones separadas.

**Propietarios posteriores:** 06, 08, 10 y 12.

##### 4.11.2.2. R-05-ALTA-02 — Expediente administrativo sobredimensionado

**Riesgo:** convertir el MVP en un sistema documental regulatorio.

**Control en 05:** se exige evidencia mínima y pertinente, sin definir un expediente exhaustivo.

**Propietarios posteriores:** 08 y 10.

##### 4.11.2.3. R-05-ALTA-03 — Estado técnico congelado prematuramente

**Riesgo:** interpretar “observada”, “aprobada” o “suspendida” como enums definitivos.

**Control en 05:** son resultados semánticos. La taxonomía definitiva se deriva a 06.

##### 4.11.2.4. R-05-ALTA-04 — Efectos indeterminados de suspensión

**Riesgo:** bloquear incorrectamente procesos activos o permitir nuevas operaciones residuales.

**Control en 05:** se fija que la suspensión impide nuevas operaciones y conserva historia; los efectos finos quedan en 06/08.

##### 4.11.2.5. R-05-ALTA-05 — Fricción excesiva

**Riesgo:** abandono del profesional antes de presentar o subsanar.

**Control en 05:** guardado incompleto, pasos diferenciados y validación obligatoria pre-G4.

##### 4.11.2.6. R-05-ALTA-06 — Capacidad antropométrica interpretada como especialidad

**Riesgo:** duplicar roles y producir autorizaciones incorrectas.

**Control en 05:** se declara transversal y con resolución separada, sin crear una tercera especialidad.

#### 4.11.3. DEC-044 — Operación antropométrica independiente aprobada

Dirección aprobó el 5 de agosto de 2026 que una identidad profesional pueda operar **solo Antropometría** sin poseer Nutrición o Entrenamiento verificadas.

La decisión confirma el canon aprobado:

- el descubrimiento antropométrico limitado contempla publicación, perfil, credenciales y solicitud de vínculo sin exigir especialidad previa;
- el modelo de negocio define Antropometría como capacidad transversal y exige credencial o habilitación, permiso, vínculo y consentimiento;
- `RF-067` permite declarar y verificar la capacidad de forma independiente.

##### 4.11.3.1. Condiciones aplicables

1. identidad BE habilitada;
2. perfil profesional;
3. capacidad antropométrica `VERIFICADA`;
4. habilitación académica o comercial aplicable;
5. vínculo explícitamente aceptado;
6. consentimiento específico cuyo alcance sea la capacidad antropométrica;
7. autorización contextual por capacidad, finalidad y alcance;
8. trazabilidad de mediciones, cálculos, correcciones y accesos.

##### 4.11.3.2. Límites

La capacidad antropométrica independiente:

- no crea una tercera especialidad;
- no habilita Nutrición ni Entrenamiento;
- no permite diseñar o modificar planes de esas especialidades;
- no concede acceso interdisciplinario fuera del consentimiento;
- no incorpora reservas, pagos, rankings, reputación ni marketplace general;
- no implica diagnóstico ni interpretación clínica.

##### 4.11.3.3. Impacto documental

- **Documento 04:** no requiere modificación; `DEC-044` confirma el alcance ya aprobado.
- **Documento 05:** los bloques de vínculo y consentimiento admiten alcance antropométrico independiente.
- **Documento 06:** debe representar la capacidad transversal sin convertirla en especialidad.
- **Documento 08:** debe definir consentimiento y autorización por capacidad.
- **Documento 10:** debe evitar presentar Antropometría como especialidad.
- **UC-P29:** debe admitir una identidad con solo capacidad antropométrica verificada.
- **Estado:** `APROBADA — DEC-044`.

#### 4.11.4. Veredicto

```text
BLOQUE 01 — ALTA PROFESIONAL v0.3.1:
APTO PARA REVISIÓN DE DIRECCIÓN

CONTRADICCIONES CON RF-008 A RF-015 Y RF-067:
0 CONOCIDAS

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

DECISIONES NUEVAS DE PRODUCTO:
0

DEC-042:
APLICADA CON VIGENCIA PROVISIONAL
VALIDACIÓN PRE-G4 PENDIENTE
```

---

### 4.12. Decisiones del bloque

#### 4.12.1. Aprobadas y aplicadas

- alta profesional escalonada;
- revisión administrativa;
- especialidades independientes;
- capacidad antropométrica transversal;
- evidencia no equivalente a aprobación;
- habilitación y autorización separadas;
- trazabilidad por versión, actor, fecha, alcance y resultado;
- preservación histórica;
- no certificación oficial.

#### 4.12.2. Provisionales

- `DEC-042`;
- códigos `UC-P01`, `UC-P02`, `UC-E01` y `UC-P03`;
- resultados semánticos usados en los flujos;
- contenido mínimo del fundamento;
- ciclo de subsanación;
- condiciones de rehabilitación.

#### 4.12.3. Pendientes derivados

- modelo de estados y entidades: `06`;
- evidencia, privacidad, retención y acceso administrativo: `08`;
- arquitectura y almacenamiento: `07`;
- contratos y concurrencia: `09`;
- navegación, formularios y copy: `10`;
- escenarios exhaustivos y datos de prueba: `11A`;
- trazabilidad canónica: `12`.

---

### 4.13. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. `UC-P01` representa correctamente el autoservicio escalonado;
2. las especialidades y Antropometría deben seguir resolviéndose independientemente;
3. `UC-P02` diferencia observación, aprobación y rechazo;
4. `UC-E01` preserva versiones y permite subsanación sin aprobación automática;
5. `UC-P03` debe suspender nuevas operaciones sin eliminar historial;
6. el resultado `VERIFICADO` permanece separado de habilitación, vínculo, consentimiento y autorización;
7. los puntos abiertos fueron derivados al documento propietario correcto;
8. `DEC-044` queda correctamente aplicada como confirmación del canon aprobado.

---

### 4.14. Estado del bloque

```text
ARQUITECTURA GENERAL:
v0.1 PRELIMINAR → v0.2 CORREGIDA Y APLICADA

BLOQUE 01 — ALTA PROFESIONAL:
REDACTADO EN v0.3
CORREGIDO EDITORIALMENTE EN v0.3.1
CONTROL TERMINOLÓGICO APLICADO EN v0.3.2
PENDIENTE DE REVISIÓN Y APROBACIÓN DE DIRECCIÓN

CASOS PRINCIPALES:
UC-P01, UC-P02, UC-P03

EXTENSIÓN:
UC-E01

HISTORIAS:
HU-01, HU-02

RF CUBIERTOS:
RF-008, RF-009, RF-010, RF-011, RF-012,
RF-013, RF-014, RF-015, RF-067

GIT:
SIN CAMBIOS
```

#### 4.14.1. Siguiente acción recomendada

Revisar y aprobar este bloque antes de redactar:

```text
UC-P04 — Solicitar o invitar a un vínculo
UC-P05 — Aceptar o rechazar un vínculo
UC-P06 — Consultar, pausar o finalizar un vínculo
```
---
---

---

## 5. Bloque 02 — Vínculo profesional–asesorado

*Fuente ensamblada: `BE_LEG_05_v0.4.4_BLOQUE_02_REGLAS_TR.md`.*

### 5.1. Propósito del bloque

Este bloque transforma los requisitos de vínculo profesional–asesorado en comportamientos observables y trazables.

Cubre:

- solicitud o invitación iniciada por profesional o asesorado;
- identificación de profesional, asesorado, especialidad o capacidad y finalidad;
- aceptación o rechazo explícitos por parte del asesorado;
- consulta de vínculos propios;
- consulta del estado funcional asociado a los consentimientos relevantes;
- pausa o finalización de un vínculo;
- conservación de identidad, autoría, procedencia e historia;
- cambio de profesional sin transferencia automática de acceso.

No cubre:

- otorgamiento, modificación o revocación del consentimiento;
- política detallada de autorización;
- lectura residual después de finalizar;
- retención;
- estados técnicos definitivos;
- contratos de invitación;
- notificaciones externas;
- pantallas o componentes.

Estos temas se desarrollan o derivan a los documentos propietarios correspondientes.

---

### 5.2. Decisiones funcionales aplicadas

#### 5.2.1. Aceptación explícita

Se aplica `DEC-003`:

```text
solicitud o invitación
→ pendiente de decisión del asesorado
→ aceptación o rechazo explícito
```

Antes de la aceptación:

- no existe acceso profesional derivado del vínculo;
- no existe consentimiento implícito;
- no se inicia un proceso profesional;
- la solicitud no ocupa capacidad profesional;
- no se transfieren datos longitudinales.

#### 5.2.2. Separación vínculo–consentimiento–autorización

```text
vínculo aceptado
≠ consentimiento vigente
≠ autorización contextual
```

Aceptar identifica que el asesorado consiente establecer la relación propuesta con ese profesional y para ese alcance relacional. No autoriza por sí solo el acceso a datos protegidos ni el inicio de operaciones profesionales.

El acceso posterior requiere las condiciones independientes definidas en `RF-021` y `DEC-006`.

##### 5.2.2.1. Regla sustantiva de asimetría

```text
revocar consentimiento
≠ finalizar vínculo
```

La revocación debe cortar accesos y operaciones futuras dentro del alcance revocado, pero no debe eliminar ni finalizar automáticamente la relación, salvo que una política aprobada lo establezca expresamente.

```text
finalizar vínculo
≠ borrar consentimiento histórico
```

Finalizar el vínculo no elimina evidencia de aceptación, consentimiento o revocación.

La obligación transversal de repetir y verificar esta asimetría pertenece al glosario controlado. Los efectos definitivos sobre estado, lectura residual y retención pertenecen a `DERIVAR 06/08`.

#### 5.2.3. Alcance del vínculo

Cada solicitud debe identificar:

- profesional;
- asesorado;
- especialidad o capacidad;
- finalidad.

Los alcances iniciales posibles son:

- Nutrición;
- Entrenamiento;
- capacidad antropométrica transversal.

La operación exclusivamente antropométrica se encuentra aprobada mediante `DEC-044`. Confirma el canon y no exige Nutrición o Entrenamiento verificadas.

#### 5.2.4. Semántica funcional

Este bloque utiliza descripciones semánticas, no enums definitivos:

| Resultado observable | Significado funcional |
|---|---|
| **pendiente de aceptación** | La solicitud existe, pero no habilita acceso ni operación. |
| **aceptado** | El asesorado aceptó expresamente la relación propuesta; todavía deben evaluarse consentimiento y autorización. |
| **rechazado** | El asesorado no acepta la relación propuesta; no se habilita acceso. |
| **pausado** | Se bloquean nuevas operaciones incompatibles con la pausa; efectos finos: `DERIVAR 06/08`. |
| **finalizado** | La relación deja de admitir nuevas operaciones; la identidad y la historia se conservan. |

La denominación técnica, transiciones y compatibilidades pertenecen a `DERIVAR 06`.

---

### 5.3. Actores

| Actor | Responsabilidad en este bloque |
|---|---|
| **Profesional** | Inicia invitaciones dentro de un alcance elegible, consulta vínculos propios y ejecuta acciones de pausa o finalización cuando la política lo permite. |
| **Asesorado** | Inicia solicitudes, acepta o rechaza expresamente, consulta relaciones propias y ejecuta pausa o finalización cuando la política lo permite. |
| **Sistema BE** | Verifica elegibilidad contextual, evita duplicados equivalentes, preserva historia, impide acceso prematuro y recalcula condiciones funcionales después de cambios. |

---

### 5.4. Relaciones internas

```text
UC-P04 — Solicitar o invitar a un vínculo
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  incluye → UC-I11 — Encauzar al actor por la superficie prevista
  puede ser invocado por → UC-E04 — Solicitar vínculo desde descubrimiento antropométrico

UC-P05 — Aceptar o rechazar un vínculo
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  habilita la continuación hacia → UC-P07 — Otorgar y consultar consentimiento específico

UC-P06 — Consultar, pausar o finalizar un vínculo
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  aplica → TR-03 — Auditoría, autoría, versionado y preservación histórica
  condiciona → UC-P07 y UC-P08
```

La relación “habilita la continuación hacia” no significa `include` ni `extend`: el consentimiento es un objetivo separado del asesorado y se desarrolla en el Bloque 03.

---

### 5.5. UC-P04 — Solicitar o invitar a un vínculo

#### 5.5.1. Código

`UC-P04`

#### 5.5.2. Nombre

**Solicitar o invitar a un vínculo**

#### 5.5.3. Objetivo

Permitir que un profesional elegible invite a un asesorado, o que un asesorado solicite vincularse con un profesional elegible, identificando alcance y finalidad sin generar acceso o autorización antes de la aceptación expresa.

#### 5.5.4. Alcance

- **Superficies:** profesional y APK del asesorado.
- **Inicio:** una de las partes decide proponer una relación profesional.
- **Fin:** la solicitud queda pendiente de decisión del asesorado o la operación se rechaza de forma controlada.

#### 5.5.5. Actor principal

Profesional o asesorado.

#### 5.5.6. Actores secundarios

- Asesorado, cuando inicia el profesional.
- Profesional, cuando inicia el asesorado.
- Sistema BE.

#### 5.5.7. Disparador

Uno de los actores decide proponer un vínculo para Nutrición, Entrenamiento o capacidad antropométrica transversal.

#### 5.5.8. Precondiciones

1. El actor principal posee identidad BE y sesión válida.
2. El asesorado es una persona adulta dentro del alcance del MVP.
3. El profesional puede ser identificado inequívocamente.
4. El alcance solicitado corresponde a:
   - una especialidad verificada; o
   - una capacidad transversal verificada.
5. La habilitación aplicable se evalúa de forma independiente.
6. Si la solicitud nace desde descubrimiento antropométrico, se aplica `UC-E04`.
7. BE evalúa mediante `UC-I02` que el actor pueda proponer el vínculo.
8. La regla técnica de elegibilidad y los estados definitivos se derivan a `06/08`.

#### 5.5.9. Postcondiciones de éxito

1. Existe una solicitud identificable.
2. La solicitud relaciona:
   - profesional;
   - asesorado;
   - especialidad o capacidad;
   - finalidad;
   - actor iniciador;
   - fecha.
3. La solicitud queda pendiente de aceptación explícita del asesorado.
4. El destinatario puede conocer quién propone la relación y para qué.
5. No existe acceso profesional derivado de la solicitud.
6. No se crea consentimiento.
7. No se ocupa capacidad profesional por la sola solicitud.
8. La solicitud queda trazable.
9. No se crea un duplicado equivalente vigente.

#### 5.5.10. Garantías mínimas

- El profesional no puede autoaceptar en nombre del asesorado.
- Una invitación no concede acceso.
- Una solicitud iniciada por el asesorado tampoco concede acceso.
- La finalidad no se amplía implícitamente.
- Nutrición, Entrenamiento y Antropometría se identifican de forma separada.
- Un vínculo no se utiliza como sustituto del consentimiento.
- No se transfiere información histórica al profesional antes de la autorización aplicable.
- Un fallo de persistencia no muestra una invitación o solicitud exitosa.
- El actor solo puede consultar relaciones propias.

#### 5.5.11. Flujo principal

1. El actor principal accede a la función de vinculación desde la superficie prevista.
2. BE identifica si el actor inicia:
   - una invitación como profesional; o
   - una solicitud como asesorado.
3. El actor selecciona o identifica a la contraparte.
4. BE verifica que la contraparte corresponda a una identidad o destino admisible.
5. El actor selecciona el alcance:
   - Nutrición;
   - Entrenamiento;
   - capacidad antropométrica transversal.
6. BE verifica que el profesional sea elegible para el alcance seleccionado.
7. El actor informa o confirma la finalidad del vínculo.
8. BE presenta un resumen que identifica:
   - quién solicita;
   - quién es la contraparte;
   - alcance;
   - finalidad;
   - ausencia de acceso antes de la aceptación;
   - separación entre vínculo y consentimiento.
9. El actor confirma la solicitud o invitación.
10. BE verifica que no exista una solicitud equivalente vigente ni un vínculo incompatible.
11. BE registra actor, fecha, profesional, asesorado, alcance y finalidad mediante `UC-I03`.
12. BE deja la solicitud pendiente de decisión del asesorado.
13. BE hace disponible la solicitud al asesorado por la superficie prevista.
14. El caso finaliza sin conceder acceso profesional.

#### 5.5.12. Variantes

##### 5.5.12.1. V01 — Invitación iniciada por profesional

El profesional identifica al asesorado y propone una relación.

**Resultado:** el asesorado es el único actor que puede aceptar o rechazar.

##### 5.5.12.2. V02 — Solicitud iniciada por asesorado

El asesorado selecciona un profesional y propone la relación.

**Resultado:** la solicitud queda pendiente de la decisión explícita del asesorado respecto del vínculo propuesto y de la elegibilidad del profesional. Si la UX simplifica la confirmación en un solo recorrido, no puede omitir la aceptación expresa.

##### 5.5.12.3. V03 — Solicitud desde descubrimiento antropométrico

El asesorado consulta un servicio antropométrico y decide solicitar vínculo.

**Resultado:** se invoca `UC-E04`; no se incorporan reservas, pagos o contratación automática.

##### 5.5.12.4. V04 — Contraparte aún sin identidad BE activa

El profesional invita a una persona que todavía debe crear o recuperar su identidad BE.

**Resultado:** la invitación puede conservarse como antecedente pendiente sin habilitar acceso. El mecanismo de identificación, entrega y vinculación posterior pertenece a `DERIVAR 06/08/09/10`.

##### 5.5.12.5. V05 — Varios alcances con el mismo profesional

Las partes desean relacionarse para más de un alcance.

**Resultado:** cada alcance queda identificable y no se amplía automáticamente. El modelo exacto —una relación con varios alcances o relaciones relacionadas— se deriva a `06`.

##### 5.5.12.6. V06 — Nuevo vínculo después de finalizar otro

El asesorado propone o recibe una solicitud de otro profesional.

**Resultado:** la nueva solicitud no transfiere acceso, autoría ni procedencia histórica del vínculo anterior.

#### 5.5.13. Excepciones

##### 5.5.13.1. E01 — Profesional no elegible para el alcance

El profesional no posee verificación o condición aplicable.

**Resultado:** BE no crea la solicitud como válida y explica la condición faltante sin revelar información administrativa innecesaria.

##### 5.5.13.2. E02 — Solicitud equivalente vigente

Ya existe una solicitud pendiente equivalente.

**Resultado:** BE presenta la situación existente y evita duplicados.

La equivalencia técnica pertenece a `DERIVAR 06`.

##### 5.5.13.3. E03 — Vínculo incompatible existente

Ya existe una relación cuya situación impide crear otra equivalente.

**Resultado:** BE no declara éxito y orienta a consultar o gestionar el vínculo existente mediante `UC-P06`.

##### 5.5.13.4. E04 — Contraparte inexistente o no resoluble

BE no puede identificar al profesional o asesorado.

**Resultado:** no crea una relación incompleta ni expone datos de búsqueda no autorizados.

##### 5.5.13.5. E05 — Alcance o finalidad no admisibles

La solicitud pretende un dominio, finalidad o servicio fuera del MVP.

**Resultado:** BE rechaza la operación sin transformar el producto en marketplace, atención clínica o contratación automática.

##### 5.5.13.6. E06 — Falla de persistencia o auditoría

BE no puede confirmar el registro.

**Resultado:** no presenta la solicitud como creada y no genera acceso parcial.

##### 5.5.13.7. E07 — Cambio concurrente de elegibilidad

La elegibilidad del profesional cambia antes de confirmar.

**Resultado:** BE no crea la solicitud hasta recalcular la situación.

#### 5.5.14. Reglas aplicables

1. El asesorado acepta siempre de forma explícita.
2. La solicitud identifica profesional, asesorado, alcance y finalidad.
3. Una solicitud pendiente no habilita acceso.
4. Aceptar vínculo no equivale a otorgar consentimiento.
5. No se crean duplicados equivalentes vigentes.
6. Una invitación pendiente no ocupa capacidad profesional.
7. La elegibilidad del profesional se evalúa en el alcance solicitado.
8. El descubrimiento antropométrico solo conduce a solicitud de vínculo.
9. La navegación y búsqueda concreta se derivan a `10`.
10. La resolución técnica de identidades no registradas se deriva a `06/08/09`.

#### 5.5.15. Información utilizada o generada

##### 5.5.15.1. Utilizada

- identidad del actor;
- identidad o referencia de la contraparte;
- alcance solicitado;
- finalidad;
- verificación y habilitación aplicables;
- relaciones previas relevantes.

##### 5.5.15.2. Generada

- solicitud o invitación;
- actor iniciador;
- profesional;
- asesorado;
- alcance;
- finalidad;
- fecha;
- situación pendiente;
- evento de auditoría.

#### 5.5.16. Requisitos relacionados

##### 5.5.16.1. RF

- `RF-018 — Solicitar o invitar a un vínculo`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-025 — Preservar identidad e historia al cambiar de profesional`
- `RF-051 — Publicar y descubrir un servicio antropométrico limitado`, cuando se invoca desde `UC-E04`.

##### 5.5.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 5.5.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

#### 5.5.18. Casos extendidos

- `UC-E04 — Solicitar vínculo desde descubrimiento antropométrico`

#### 5.5.19. Puntos de auditoría

- actor iniciador;
- contraparte;
- alcance;
- finalidad;
- fecha;
- elegibilidad evaluada;
- resultado;
- duplicado o incompatibilidad detectada;
- creación fallida;
- origen desde descubrimiento antropométrico, cuando corresponda.

#### 5.5.20. Decisiones o preguntas abiertas

1. Representación técnica de solicitudes y vínculos: `DERIVAR 06`.
2. Identificación de personas aún no registradas: `DERIVAR 06/08/09`.
3. Datos visibles antes de aceptar: `DERIVAR 08`.
4. Caducidad o reiteración de solicitudes: `DERIVAR 06/08`.
5. Canales y notificaciones: `DERIVAR 10` y capacidad condicionada.
6. Forma de representar varios alcances: `DERIVAR 06`.
7. Operación exclusivamente antropométrica: aprobada por `DEC-044`; el vínculo puede tener como alcance una capacidad transversal.
8. Criterios completos de capacidad profesional: `DERIVAR 06`, respetando que una solicitud pendiente no ocupa capacidad.

#### 5.5.21. Criterio de cierre

El caso termina cuando la solicitud queda pendiente de aceptación explícita y sin acceso profesional, o cuando una excepción impide crearla sin producir un resultado falso.

---

### 5.6. UC-P05 — Aceptar o rechazar un vínculo

#### 5.6.1. Código

`UC-P05`

#### 5.6.2. Nombre

**Aceptar o rechazar un vínculo**

#### 5.6.3. Objetivo

Permitir que el asesorado decida expresamente sobre una solicitud de vínculo, comprendiendo quién propone la relación, para qué alcance y finalidad, sin confundir aceptación con consentimiento o autorización.

#### 5.6.4. Alcance

- **Superficie:** APK del asesorado.
- **Inicio:** existe una solicitud pendiente dirigida al asesorado.
- **Fin:** la solicitud queda aceptada o rechazada con trazabilidad.

#### 5.6.5. Actor principal

Asesorado.

#### 5.6.6. Actores secundarios

- Profesional relacionado.
- Sistema BE.

#### 5.6.7. Disparador

El asesorado consulta una solicitud pendiente y decide responderla.

#### 5.6.8. Precondiciones

1. El asesorado posee identidad BE y sesión válida.
2. La solicitud:
   - le pertenece;
   - identifica al profesional;
   - identifica alcance y finalidad;
   - permanece disponible para decisión.
3. El profesional continúa siendo elegible para el alcance.
4. BE evalúa mediante `UC-I02` que el asesorado pueda decidir sobre su propia solicitud.
5. La solicitud todavía no concede acceso profesional.

#### 5.6.9. Postcondiciones de éxito

##### 5.6.9.1. Aceptación

1. Queda registrada la aceptación expresa del asesorado.
2. El vínculo alcanza el resultado semántico **aceptado**.
3. La aceptación conserva:
   - asesorado;
   - profesional;
   - alcance;
   - finalidad;
   - fecha;
   - versión o contenido aceptado.
4. No se otorga consentimiento automáticamente.
5. No se habilitan operaciones protegidas hasta cumplir `UC-P07` y la autorización contextual.
6. El profesional puede conocer que el vínculo fue aceptado dentro de la visibilidad autorizada.
7. El evento queda trazable.

##### 5.6.9.2. Rechazo

1. Queda registrado el rechazo expreso.
2. No existe acceso profesional.
3. No se crea consentimiento.
4. El rechazo conserva actor, fecha, alcance y relación con la solicitud.
5. El profesional conoce el resultado según la política de visibilidad.
6. El evento queda trazable.

#### 5.6.10. Garantías mínimas

- Solo el asesorado acepta o rechaza.
- No existe aceptación implícita por silencio, apertura o uso de la aplicación.
- Aceptar no equivale a consentir datos.
- Rechazar no elimina la cuenta del asesorado.
- Rechazar no borra la solicitud ni su trazabilidad.
- Un fallo no muestra una aceptación o rechazo exitosos.
- Una decisión sobre Nutrición no se extiende automáticamente a Entrenamiento o Antropometría.
- El contenido aceptado debe ser identificable.

#### 5.6.11. Flujo principal — Aceptación

1. El asesorado consulta sus solicitudes pendientes.
2. BE presenta una solicitud que identifica:
   - profesional;
   - verificación relevante;
   - alcance;
   - finalidad;
   - actor iniciador;
   - fecha.
3. BE informa que aceptar:
   - establece el vínculo propuesto;
   - no otorga consentimiento automático;
   - no concede acceso protegido por sí solo.
4. El asesorado selecciona aceptar.
5. BE solicita confirmación explícita del alcance y la finalidad.
6. El asesorado confirma.
7. BE verifica que:
   - la solicitud siga pendiente;
   - el profesional continúe elegible;
   - no exista una decisión concurrente;
   - el contenido no haya cambiado.
8. BE registra la aceptación mediante `UC-I03`.
9. BE deja el vínculo aceptado.
10. BE mantiene denegadas las operaciones protegidas mientras falten consentimiento o autorización.
11. BE habilita la continuación separada hacia `UC-P07`.
12. El caso finaliza.

#### 5.6.12. Flujo principal — Rechazo

1. El asesorado consulta la solicitud.
2. BE presenta profesional, alcance y finalidad.
3. El asesorado selecciona rechazar.
4. BE solicita confirmación.
5. El asesorado confirma.
6. BE verifica que la solicitud continúe disponible.
7. BE registra el rechazo mediante `UC-I03`.
8. BE impide que esa solicitud habilite acceso.
9. BE conserva el antecedente.
10. El caso finaliza.

#### 5.6.13. Variantes

##### 5.6.13.1. V01 — Aceptación después de crear o recuperar la identidad BE

El asesorado accede a una invitación previa después de completar su identidad.

**Resultado:** BE vincula la decisión con la invitación correcta sin crear una segunda relación.

##### 5.6.13.2. V02 — Varios alcances pendientes

El asesorado recibe más de una solicitud del mismo profesional.

**Resultado:** decide cada alcance de manera identificable; no existe aceptación masiva implícita.

##### 5.6.13.3. V03 — Solicitud iniciada por el propio asesorado

Aunque el asesorado haya iniciado el pedido, BE requiere una confirmación expresa del vínculo resultante.

**Resultado:** la intención inicial no reemplaza la aceptación trazable.

##### 5.6.13.4. V04 — Profesional con doble especialidad

La solicitud identifica uno o ambos alcances.

**Resultado:** el asesorado puede aceptar el alcance presentado; la representación técnica se deriva a `06`, sin ampliar finalidades.

##### 5.6.13.5. V05 — Alcance antropométrico

El vínculo propuesto se limita a Antropometría.

**Resultado:** aceptar no habilita Nutrición ni Entrenamiento y continúa requiriendo consentimiento específico.

#### 5.6.14. Excepciones

##### 5.6.14.1. E01 — Solicitud ya resuelta

La solicitud fue aceptada, rechazada, retirada o quedó incompatible.

**Resultado:** BE presenta la situación vigente y no registra una segunda decisión.

##### 5.6.14.2. E02 — Profesional ya no elegible

La verificación, habilitación o capacidad aplicable cambió.

**Resultado:** BE no permite aceptar como si la relación pudiera operar y explica que la solicitud ya no está disponible.

##### 5.6.14.3. E03 — Contenido modificado después de ser presentado

Cambió alcance, finalidad o profesional.

**Resultado:** BE invalida la decisión sobre el contenido anterior y exige una nueva solicitud identificable.

##### 5.6.14.4. E04 — Decisión concurrente

Otra sesión resolvió la solicitud.

**Resultado:** BE no declara éxito y presenta el resultado vigente.

##### 5.6.14.5. E05 — Falla de persistencia o auditoría

BE no puede confirmar la decisión.

**Resultado:** la solicitud no aparece aceptada ni rechazada.

##### 5.6.14.6. E06 — Intento de aceptación por otro actor

Un profesional o tercero intenta aceptar en nombre del asesorado.

**Resultado:** BE deniega la operación y registra el intento según la política aplicable.

#### 5.6.15. Reglas aplicables

1. El asesorado decide expresamente.
2. No existe aceptación implícita.
3. Aceptación y consentimiento son eventos separados.
4. La aceptación se vincula al contenido presentado.
5. Rechazar no elimina la identidad ni el historial.
6. La aceptación no ocupa capacidad por sí sola si aún no existe proceso operativo abierto, conforme al modelo de negocio.
7. La elegibilidad se reevalúa al aceptar.
8. La visibilidad posterior se deriva a `08`.
9. Las notificaciones no sustituyen la decisión dentro de BE.

#### 5.6.16. Información utilizada o generada

##### 5.6.16.1. Utilizada

- solicitud pendiente;
- profesional;
- alcance;
- finalidad;
- elegibilidad vigente;
- identidad del asesorado.

##### 5.6.16.2. Generada

- aceptación o rechazo;
- fecha;
- actor;
- contenido decidido;
- vínculo aceptado o solicitud rechazada;
- evento de auditoría.

#### 5.6.17. Requisitos relacionados

##### 5.6.17.1. RF

- `RF-019 — Aceptar o rechazar un vínculo`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-023 — Consultar vínculos y consentimientos propios`

##### 5.6.17.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 5.6.18. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 5.6.19. Continuación relacionada

- `UC-P07 — Otorgar y consultar consentimiento específico`

#### 5.6.20. Puntos de auditoría

- consulta de solicitud;
- contenido mostrado;
- elegibilidad reevaluada;
- decisión;
- confirmación;
- actor;
- fecha;
- resultado;
- fallo o concurrencia;
- intento de decisión por actor no autorizado.

#### 5.6.21. Decisiones o preguntas abiertas

1. Estados técnicos y transiciones: `DERIVAR 06`.
2. Contenido mínimo visible antes de aceptar: `DERIVAR 08`.
3. Confirmación y experiencia: `DERIVAR 10`.
4. Expiración de solicitudes: `DERIVAR 06/08`.
5. Aceptación de varios alcances: `DERIVAR 06/10`.
6. Efectos exactos si la elegibilidad cambia entre solicitud y aceptación: `DERIVAR 06/08`.

#### 5.6.22. Criterio de cierre

El caso termina cuando el asesorado acepta o rechaza expresamente, con historia preservada y sin producir consentimiento o acceso implícitos, o cuando una excepción impide decidir sin mostrar éxito falso.

---

### 5.7. UC-P06 — Consultar, pausar o finalizar un vínculo

#### 5.7.1. Código

`UC-P06`

#### 5.7.2. Nombre

**Consultar, pausar o finalizar un vínculo**

#### 5.7.3. Objetivo

Permitir que profesional y asesorado comprendan sus relaciones propias y que un actor habilitado pause o finalice un vínculo sin borrar identidad, autoría, procedencia o historia ni transferir acceso automáticamente.

#### 5.7.4. Alcance

- **Superficies:** profesional y APK del asesorado.
- **Inicio:** existe al menos una solicitud o vínculo propio.
- **Fin:** el actor consulta la situación o registra una pausa/finalización trazable.

#### 5.7.5. Actor principal

Profesional o asesorado.

#### 5.7.6. Actores secundarios

- Sistema BE.
- Contraparte del vínculo, como actor informado dentro de la visibilidad aplicable.

#### 5.7.7. Disparador

El actor decide consultar sus relaciones o gestionar una relación existente.

#### 5.7.8. Precondiciones

##### 5.7.8.1. Consulta

1. El actor posee identidad BE y sesión válida.
2. El actor solo consulta relaciones propias.
3. BE evalúa mediante `UC-I02` el acceso a la información relacional.

##### 5.7.8.2. Pausa o finalización

1. Existe un vínculo aceptado.
2. El actor está habilitado por la política aplicable para ejecutar la acción.
3. La acción identifica vínculo, alcance y motivo.
4. La situación vigente admite la transición semántica.
5. Los efectos finos sobre procesos activos se derivan a `06/08`.

#### 5.7.9. Postcondiciones de éxito

##### 5.7.9.1. Consulta

1. El asesorado puede identificar:
   - profesionales relacionados;
   - alcance y finalidad;
   - situación del vínculo;
   - condición funcional de consentimientos relevantes;
   - qué relación puede o no habilitar acceso.
2. El profesional solo consulta relaciones propias.
3. La información coincide con la autorización efectiva disponible.
4. No se revelan relaciones ajenas.

##### 5.7.9.2. Pausa

1. El vínculo alcanza el resultado semántico **pausado**.
2. Se impiden nuevas operaciones incompatibles con la pausa.
3. Se conservan identidad, historia, autoría y procedencia.
4. La contraparte puede conocer la situación según la política aplicable.
5. El evento registra actor, fecha y motivo.
6. La lectura residual y la reanudación se derivan a `06/08`.

##### 5.7.9.3. Finalización

1. El vínculo alcanza el resultado semántico **finalizado**.
2. Se impiden nuevas operaciones profesionales del alcance.
3. La cuenta del asesorado continúa existiendo.
4. La historia no se elimina.
5. La autoría histórica no cambia.
6. Un nuevo vínculo no recibe acceso automático a la historia.
7. El evento conserva actor, fecha y motivo.
8. La lectura posterior queda pendiente de `Q-005` y del Documento 08.

#### 5.7.10. Garantías mínimas

- Cada actor consulta solo relaciones propias.
- Pausar o finalizar no borra cuenta ni historial.
- Finalizar un vínculo no finaliza otros vínculos.
- Finalizar Nutrición no finaliza Entrenamiento o Antropometría de forma implícita.
- Un nuevo profesional no hereda acceso del anterior.
- La autoría histórica no se reasigna.
- La procedencia no se elimina.
- Un fallo de persistencia no presenta la relación como pausada o finalizada.
- La interfaz no decide autorización.
- La consulta no se convierte en acceso a datos clínicos o profesionales no autorizados.

#### 5.7.11. Flujo principal — Consulta

1. El actor accede a sus vínculos.
2. BE identifica su rol en cada relación.
3. BE presenta únicamente relaciones propias.
4. Para cada relación, BE muestra de forma comprensible:
   - contraparte;
   - alcance;
   - finalidad;
   - situación del vínculo;
   - condición de consentimiento aplicable;
   - disponibilidad funcional resultante.
5. BE diferencia vínculo aceptado de autorización efectiva.
6. El actor consulta el detalle de una relación.
7. BE registra la consulta cuando corresponda según la política de auditoría.
8. El caso finaliza sin modificar la relación.

#### 5.7.12. Flujo principal — Pausa

1. El actor consulta un vínculo aceptado.
2. BE presenta la situación y los efectos funcionales conocidos.
3. El actor selecciona pausar.
4. BE informa que:
   - se bloquearán nuevas operaciones incompatibles;
   - no se borrará historia;
   - los efectos de lectura se rigen por la política posterior.
5. El actor registra o confirma un motivo.
6. BE solicita confirmación explícita.
7. BE verifica autorización, situación vigente y ausencia de conflicto concurrente.
8. El actor confirma.
9. BE registra actor, fecha, motivo y situación anterior mediante `UC-I03`.
10. BE aplica la pausa semántica.
11. BE recalcula las operaciones permitidas.
12. BE informa el resultado a los actores autorizados.
13. El caso finaliza.

#### 5.7.13. Flujo principal — Finalización

1. El actor consulta un vínculo existente.
2. BE presenta:
   - alcance;
   - finalidad;
   - situación;
   - consecuencias funcionales conocidas.
3. El actor selecciona finalizar.
4. BE informa que:
   - se bloquearán nuevas operaciones;
   - la identidad y la historia se conservarán;
   - no se transferirá acceso a otro profesional;
   - la lectura residual depende de la política del Documento 08.
5. El actor registra o confirma un motivo.
6. BE solicita confirmación explícita.
7. BE verifica autorización, situación y dependencias funcionales conocidas.
8. El actor confirma.
9. BE registra actor, fecha, motivo y situación anterior.
10. BE aplica la finalización semántica.
11. BE recalcula la autorización para operaciones futuras.
12. BE preserva autoría, procedencia e historia.
13. BE informa el resultado a los actores autorizados.
14. El caso finaliza.

#### 5.7.14. Variantes

##### 5.7.14.1. V01 — Consulta de solicitud pendiente

El actor consulta una invitación o solicitud no resuelta.

**Resultado:** BE muestra que no habilita acceso y quién debe decidir.

##### 5.7.14.2. V02 — Consulta de vínculo aceptado sin consentimiento vigente

El vínculo fue aceptado, pero no existe consentimiento aplicable.

**Resultado:** BE muestra que la relación existe, pero las operaciones protegidas permanecen denegadas.

##### 5.7.14.3. V03 — Consulta con consentimiento revocado

El vínculo puede conservarse como relación histórica o funcional según la política, pero el consentimiento aplicable fue revocado.

**Resultado:** BE muestra que el acceso protegido no está autorizado. Los efectos exactos se desarrollan en el Bloque 03 y `08`.

##### 5.7.14.4. V04 — Finalización por cambio de profesional

El asesorado finaliza una relación e inicia otra.

**Resultado:**

- conserva su identidad y evolución;
- el profesional anterior conserva autoría histórica;
- el nuevo profesional no recibe acceso automático;
- cualquier acceso nuevo depende de vínculo, consentimiento y autorización propios.

##### 5.7.14.5. V05 — Finalización de un solo alcance

Existe una relación con más de un alcance.

**Resultado:** solo se finaliza el alcance seleccionado cuando el modelo aprobado lo permita. Representación técnica: `DERIVAR 06`.

##### 5.7.14.6. V06 — Pausa iniciada por profesional

El profesional solicita pausar según la política aplicable.

**Resultado:** no se borran registros ni se extiende la medida a relaciones ajenas.

##### 5.7.14.7. V07 — Finalización iniciada por asesorado

El asesorado finaliza su vínculo.

**Resultado:** se bloquean operaciones futuras del profesional y se preserva la cuenta.

##### 5.7.14.8. V08 — Relación antropométrica independiente

El vínculo solo cubre Antropometría.

**Resultado:** la pausa o finalización afecta esa capacidad y no altera Nutrición o Entrenamiento.

#### 5.7.15. Excepciones

##### 5.7.15.1. E01 — Acceso a vínculo ajeno

El actor intenta consultar o modificar una relación que no le pertenece.

**Resultado:** BE deniega y registra el intento según política.

##### 5.7.15.2. E02 — Transición no admitida

La situación vigente no admite pausa o finalización solicitada.

**Resultado:** BE no declara éxito y presenta la situación vigente.

##### 5.7.15.3. E03 — Actor sin facultad para pausar o finalizar

La política no permite que ese actor ejecute la acción.

**Resultado:** BE deniega sin modificar el vínculo.

##### 5.7.15.4. E04 — Dependencias activas no resueltas

Existen procesos cuya transición requiere tratamiento definido en `06/08`.

**Resultado:** BE no aplica una finalización inconsistente; presenta la condición pendiente o el recorrido necesario.

##### 5.7.15.5. E05 — Operación concurrente

La relación cambió antes de confirmar.

**Resultado:** BE exige revisar de nuevo y no aplica una segunda transición contradictoria.

##### 5.7.15.6. E06 — Falla de persistencia o auditoría

BE no puede confirmar la acción.

**Resultado:** la relación no aparece pausada o finalizada.

##### 5.7.15.7. E07 — Inconsistencia entre vínculo y autorización efectiva

La situación presentada no coincide con la decisión de autorización.

**Resultado:** BE no permite una operación protegida basándose solo en la vista; registra la inconsistencia para tratamiento.

##### 5.7.15.8. E08 — Falta de motivo cuando la política lo exige

El actor intenta confirmar sin información mínima.

**Resultado:** BE no ejecuta la acción.

#### 5.7.16. Reglas aplicables

1. Cada actor consulta únicamente relaciones propias.
2. El asesorado debe poder identificar quién tiene acceso y con qué alcance.
3. La información presentada debe coincidir con la autorización efectiva.
4. Pausa y finalización conservan autoría, fecha, motivo e historia.
5. Finalizar no borra cuenta ni datos silenciosamente.
6. Un nuevo vínculo no transfiere acceso automáticamente.
7. La lectura residual después de finalizar pertenece a `08`.
8. Los estados y transiciones pertenecen a `06`.
9. La pausa no equivale a revocar consentimiento.
10. Revocar consentimiento no equivale necesariamente a finalizar el vínculo.
11. Cada cambio obliga a recalcular operaciones futuras.
12. La finalidad y el alcance no se amplían por cambio de profesional.

#### 5.7.17. Información utilizada o generada

##### 5.7.17.1. Utilizada

- identidad del actor;
- relaciones propias;
- profesional y asesorado;
- alcance y finalidad;
- situación del vínculo;
- condición de consentimientos relevantes;
- autorización efectiva;
- dependencias funcionales;
- política aplicable.

##### 5.7.17.2. Generada

- consulta registrada, cuando corresponda;
- pausa o finalización;
- actor;
- fecha;
- motivo;
- situación anterior y posterior;
- recálculo funcional;
- evento de auditoría.

#### 5.7.18. Requisitos relacionados

##### 5.7.18.1. RF

- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-024 — Pausar o finalizar un vínculo`
- `RF-025 — Preservar identidad e historia al cambiar de profesional`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-022 — Revocar consentimiento y cortar accesos futuros`, como condición relacionada desarrollada en el Bloque 03. Su implementación debe preservar la asimetría: revocar consentimiento no finaliza automáticamente el vínculo.

##### 5.7.18.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 5.7.19. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 5.7.20. Casos relacionados

- `UC-P07 — Otorgar y consultar consentimiento específico`
- `UC-P08 — Revocar consentimiento`

#### 5.7.21. Puntos de auditoría

- actor y relación consultada;
- acceso denegado a relación ajena;
- situación presentada;
- acción solicitada;
- situación anterior;
- motivo;
- fecha;
- situación resultante;
- recálculo funcional;
- concurrencia o inconsistencia;
- relación con vínculos nuevos, cuando exista cambio de profesional.

#### 5.7.22. Decisiones o preguntas abiertas

1. Estados y transiciones definitivas: `DERIVAR 06`.
2. Quién puede pausar o finalizar en cada situación: `DERIVAR 08`.
3. Lectura residual después de finalizar: `Q-005 / DERIVAR 08`.
4. Retención: `Q-004 / DERIVAR 08`.
5. Tratamiento de procesos activos: `Q-007 / DERIVAR 06/08`.
6. Reanudación después de pausa: `DERIVAR 06/08`.
7. Relación entre vínculo y varios alcances: `DERIVAR 06`.
8. Información exacta visible a cada actor: `DERIVAR 08/10`.
9. Auditoría de consultas: `DERIVAR 08`.
10. Tiempo efectivo de recálculo: `DERIVAR 08/11A`.

#### 5.7.23. Criterio de cierre

El caso termina cuando el actor consulta una relación coherente con la autorización efectiva, o cuando una pausa/finalización queda registrada sin pérdida de identidad o historia, o cuando una excepción bloquea la operación sin producir una situación falsa.

---

### 5.8. Historias de usuario prioritarias

#### 5.8.1. HU-03 — Establecer un vínculo explícito

**Como** asesorado  
**quiero** conocer quién solicita vincularse conmigo, para qué alcance y con qué finalidad, y decidirlo expresamente  
**para** impedir que un profesional acceda a mi información por una asignación unilateral.

##### 5.8.1.1. Criterios de aceptación

###### 5.8.1.1.1. Escenario 1 — Solicitud pendiente sin acceso

**Dado** que un profesional me invitó para Nutrición  
**cuando** la invitación queda registrada  
**entonces** puedo conocer quién la inició y para qué  
**y** el profesional no accede a mis datos  
**y** la invitación no se interpreta como consentimiento.

###### 5.8.1.1.2. Escenario 2 — Aceptación explícita

**Dado** que tengo una solicitud pendiente y el profesional continúa siendo elegible  
**cuando** confirmo expresamente la aceptación  
**entonces** el vínculo queda aceptado  
**y** BE conserva alcance, finalidad, actor y fecha  
**y** las operaciones protegidas continúan denegadas hasta otorgar consentimiento.

###### 5.8.1.1.3. Escenario 3 — Rechazo

**Dado** que no deseo establecer la relación  
**cuando** confirmo el rechazo  
**entonces** el profesional no obtiene acceso  
**y** BE conserva el resultado con trazabilidad  
**y** mi cuenta permanece operativa.

###### 5.8.1.1.4. Escenario 4 — Solicitud duplicada

**Dado** que ya existe una solicitud equivalente pendiente  
**cuando** una parte intenta crear otra  
**entonces** BE no genera un duplicado vigente  
**y** muestra la situación existente.

---

#### 5.8.2. HU-04 — Administrar relaciones propias

**Como** asesorado o profesional  
**quiero** consultar mis vínculos y gestionar su continuidad dentro de mis facultades  
**para** comprender qué relación existe y detener operaciones futuras sin perder la historia del proceso.

##### 5.8.2.1. Criterios de aceptación

###### 5.8.2.1.1. Escenario 1 — Consulta coherente

**Dado** que poseo relaciones propias  
**cuando** las consulto  
**entonces** BE muestra contraparte, alcance, finalidad y situación  
**y** la condición mostrada coincide con la autorización efectiva  
**y** no veo relaciones ajenas.

###### 5.8.2.1.2. Escenario 2 — Finalización por asesorado

**Dado** que existe un vínculo aceptado  
**cuando** el asesorado lo finaliza conforme a la política  
**entonces** se bloquean nuevas operaciones profesionales  
**y** la cuenta y la historia permanecen  
**y** un nuevo profesional no hereda acceso.

###### 5.8.2.1.3. Escenario 3 — Pausa

**Dado** que un actor está habilitado para pausar  
**cuando** confirma la acción  
**entonces** BE bloquea las nuevas operaciones incompatibles  
**y** conserva actor, fecha y motivo  
**y** no borra registros.

###### 5.8.2.1.4. Escenario 4 — Cambio de profesional

**Dado** que el asesorado finalizó un vínculo e inició otro  
**cuando** el nuevo vínculo queda aceptado  
**entonces** la autoría histórica permanece asociada al profesional original  
**y** el nuevo profesional solo accede a lo autorizado específicamente.

---

### 5.9. Contraste AS-IS específico

El Documento 04 y la auditoría aprobada identifican que el vínculo existente nace activo de forma unilateral y que existen riesgos de lectura posterior al finalizar.

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Solicitud pendiente sin acceso | El vínculo actual puede nacer activo unilateralmente | `REEMPLAZAR` | Incorporar solicitud separada y aceptación expresa. |
| Aceptación por asesorado | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Crear decisión explícita, trazable y exclusiva del asesorado. |
| Separación vínculo–consentimiento | Parcial o contradictoria | `REEMPLAZAR / REFACTORIZAR` | El vínculo aceptado no concede autorización. |
| Duplicados equivalentes | No evidenciado como regla completa | `NO EVIDENCIADO` | Incorporar control antes de crear solicitud. |
| Consulta de relaciones propias | Parcial | `REFACTORIZAR` | Alinear lo mostrado con autorización efectiva. |
| Pausa y finalización | Parcial | `REFACTORIZAR` | Preservar historia y recalcular operaciones futuras. |
| Lectura después de finalizar | Existe riesgo AS-IS de sobreotorgamiento | `REEMPLAZAR / DERIVAR` | No fijar acceso residual hasta resolver Q-005 en 08. |
| Cambio de profesional | No evidenciado de extremo a extremo | `NO EVIDENCIADO` | Preservar identidad y autoría sin transferir acceso. |

No se asigna `RETIRAR` sin identificar una implementación concreta sin valor TO-BE.

---

### 5.10. Revisión crítica consolidada

#### 5.10.1. Controles superados

1. El asesorado acepta o rechaza siempre de forma expresa.
2. Ninguna solicitud o invitación concede acceso.
3. El bloque distingue vínculo, consentimiento y autorización.
4. El profesional debe ser elegible para el alcance.
5. Nutrición, Entrenamiento y Antropometría no se amplían implícitamente.
6. Las relaciones duplicadas se controlan.
7. Pausa y finalización preservan identidad, autoría, procedencia e historia.
8. El cambio de profesional no transfiere acceso.
9. Q-004, Q-005 y Q-007 permanecen derivados.
10. No se fijan enums, endpoints o pantallas.
11. El glosario controlado se aplica en nombres, reglas y postcondiciones.

#### 5.10.2. Riesgos abiertos

##### 5.10.2.1. R-05-VIN-01 — Aceptación confundida con consentimiento

**Riesgo:** que UI o implementación concedan acceso al aceptar.

**Control en 05:** toda aceptación finaliza con operaciones protegidas aún denegadas.

##### 5.10.2.2. R-05-VIN-02 — Solicitud iniciada por asesorado sin confirmación suficiente

**Riesgo:** interpretar que iniciar la solicitud equivale a aceptar cualquier condición posterior.

**Control en 05:** el contenido final debe confirmarse expresamente.

##### 5.10.2.3. R-05-VIN-03 — Duplicados o relaciones incompatibles

**Riesgo:** múltiples relaciones contradictorias para el mismo alcance.

**Control en 05:** no crear solicitudes equivalentes vigentes; modelado definitivo en 06.

##### 5.10.2.4. R-05-VIN-04 — Lectura residual después de finalizar

**Riesgo:** sobreotorgar o bloquear indebidamente la historia.

**Control en 05:** bloqueo de nuevas operaciones; lectura residual sin resolver hasta 08.

##### 5.10.2.5. R-05-VIN-05 — Transferencia automática al cambiar profesional

**Riesgo:** pérdida de control y de autoría.

**Control en 05:** cada nuevo profesional requiere vínculo, consentimiento y autorización propios.

#### 5.10.3. Decisión resuelta — Antropometría independiente

`DEC-044` confirma que una identidad profesional puede operar únicamente Antropometría cuando la capacidad esté verificada y concurran habilitación, vínculo, consentimiento, autorización y trazabilidad.

La decisión:

- no crea una tercera especialidad;
- no amplía Nutrición o Entrenamiento;
- permite solicitud, aceptación, pausa y finalización con alcance antropométrico;
- obliga a que el Bloque 03 admita consentimiento por capacidad transversal;
- obliga a que `UC-P29` admita una identidad con solo capacidad antropométrica verificada.

**Estado del riesgo anterior:** `RESUELTO`.

##### 5.10.3.1. R-05-VIN-07 — Consulta divergente de autorización real

**Riesgo:** mostrar “activo” mientras una operación está denegada, o viceversa.

**Control en 05:** la consulta debe representar vínculo y autorización como dimensiones distintas y coherentes.

#### 5.10.4. Hallazgo de diseño a vigilar

`RF-023` exige consultar tanto vínculos como consentimientos propios. Para conservar el orden documental:

- este bloque muestra la **condición funcional** del consentimiento asociada a cada vínculo;
- el Bloque 03 define cómo se otorga, versiona, consulta en detalle y revoca;
- la interfaz no debe ocultar que un vínculo aceptado puede no estar autorizado.

Esta división evita duplicar el caso de consentimiento sin dejar a `UC-P06` ciego respecto de la autorización efectiva.

#### 5.10.5. Veredicto

```text
BLOQUE 02 — VÍNCULO:
APTO PARA REVISIÓN DE DIRECCIÓN

RF PRINCIPALES CUBIERTOS:
RF-018, RF-019, RF-023, RF-024, RF-025

RF TRANSVERSALES APLICADOS:
RF-015, RF-021

CONTRADICCIONES CON DEC-003 Y DEC-006:
0 CONOCIDAS

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

PREGUNTAS ABIERTAS RESPETADAS:
Q-004, Q-005, Q-007

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 5.11. Decisiones del bloque

#### 5.11.1. Aprobadas y aplicadas

- aceptación explícita del asesorado;
- solicitud pendiente sin acceso;
- rechazo trazable;
- separación entre vínculo, consentimiento y autorización;
- consulta limitada a relaciones propias;
- conservación de identidad e historia;
- prohibición de transferencia automática al cambiar profesional;
- bloqueo de nuevas operaciones al finalizar;
- no ocupación de capacidad por solicitud pendiente.

#### 5.11.2. Provisionales

- códigos `UC-P04`, `UC-P05`, `UC-P06`;
- semántica de pendiente, aceptado, rechazado, pausado y finalizado;
- representación de varios alcances;
- actores facultados para pausar o finalizar;
- tratamiento de invitaciones a personas aún no registradas;
- efectos del consentimiento revocado sobre un vínculo que continúa existiendo, a resolver en `06/08` sin romper la asimetría establecida.

#### 5.11.3. Pendientes derivados

- estados y transiciones: `06`;
- granularidad del consentimiento: `08`;
- lectura residual y retención: `08`;
- contratos de invitación y aceptación: `09`;
- búsqueda, presentación y confirmaciones: `10`;
- escenarios exhaustivos y concurrencia: `11A`;
- matriz canónica completa: `12`.

---

### 5.12. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. profesional y asesorado pueden iniciar una propuesta de vínculo;
2. el asesorado siempre decide expresamente;
3. antes de aceptar no existe acceso profesional;
4. aceptar no equivale a consentir;
5. la consulta debe distinguir vínculo y autorización efectiva;
6. pausa y finalización no borran identidad o historia;
7. un nuevo profesional no hereda acceso;
8. `DEC-044` se aplica y el alcance antropométrico permanece separado de las especialidades;
9. Q-004, Q-005 y Q-007 quedan correctamente derivados;
10. los términos cumplen el glosario controlado.

---

### 5.13. Estado

```text
ARQUITECTURA:
v0.2.1 APLICADA

GLOSARIO:
v0.1 APLICADO

BLOQUE 01 — ALTA PROFESIONAL:
v0.3.2
PENDIENTE DE APROBACIÓN FORMAL

BLOQUE 02 — VÍNCULO:
REDACTADO EN v0.4
CORREGIDO EN v0.4.1
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P04, UC-P05, UC-P06

HISTORIAS:
HU-03, HU-04

RF PRINCIPALES CUBIERTOS:
RF-018, RF-019, RF-023, RF-024, RF-025

GIT:
SIN CAMBIOS
```

#### 5.13.1. Siguiente acción recomendada

Revisar y aprobar el Bloque 02. Después redactar:

```text
BLOQUE 03 — CONSENTIMIENTO Y AUTORIZACIÓN

UC-P07 — Otorgar y consultar consentimiento específico
UC-P08 — Revocar consentimiento
UC-I02 — Evaluar autorización contextual
```
---
---

---

## 6. Bloque 03 — Consentimiento y autorización

*Fuente ensamblada: `BE_LEG_05_v0.5.2_BLOQUE_03_REGLAS_TR.md`.*

### 6.1. Propósito del bloque

Este bloque define qué debe poder hacer el asesorado para otorgar, consultar y revocar consentimientos específicos, y cómo BE debe evaluar una operación protegida.

Cubre:

- consentimiento otorgado por el asesorado;
- identificación de profesional, alcance y finalidad;
- alcance por especialidad o capacidad transversal;
- presentación de una versión identificable;
- confirmación expresa;
- consulta del consentimiento vigente y sus antecedentes;
- revocación;
- corte observable de operaciones futuras;
- autorización positiva o negativa por operación;
- denegación que no filtre información protegida;
- autoría, fecha, versión y trazabilidad.

No cubre:

- categorías definitivas de datos;
- textos jurídicos definitivos;
- plazos de vigencia;
- períodos de gracia;
- retención;
- lectura residual;
- estados técnicos;
- estructura persistente;
- endpoints;
- componentes de UI;
- SLA de propagación.

Esas decisiones pertenecen a `06`, `08`, `09`, `10` y `11A`.

---

### 6.2. Decisiones funcionales aplicadas

#### 6.2.1. Secuencia de confianza

```text
vínculo aceptado
→ consentimiento específico vigente
→ autorización contextual favorable
→ operación protegida permitida
```

Ninguna etapa reemplaza a la siguiente.

#### 6.2.2. Consentimiento específico

Un consentimiento debe identificar, como mínimo:

- asesorado;
- profesional;
- alcance;
- finalidad;
- versión presentada;
- fecha y autor de la decisión.

El alcance puede corresponder a:

- Nutrición;
- Entrenamiento;
- capacidad antropométrica transversal.

`DEC-044` confirma que no todo consentimiento profesional presupone una especialidad.

#### 6.2.3. Versionado observable

Cuando el contenido aplicable cambia:

- la versión anterior no se sobrescribe;
- el asesorado puede reconocer que existe una nueva versión;
- una decisión anterior no se atribuye silenciosamente a contenido nuevo;
- la nueva vigencia requiere una decisión trazable cuando corresponda.

La estructura técnica y las reglas de equivalencia pertenecen a `DERIVAR 06/08`.

#### 6.2.4. Revocación y vínculo

```text
revocar consentimiento
≠ finalizar vínculo
```

La revocación corta accesos y operaciones futuras del alcance revocado, pero no finaliza automáticamente el vínculo.

```text
finalizar vínculo
≠ borrar consentimiento histórico
```

La finalización del vínculo conserva la evidencia de consentimientos y revocaciones.

#### 6.2.5. Frontera con el Documento 08

Este bloque define **conductas observables**:

- qué puede decidir el asesorado;
- qué debe identificar la decisión;
- qué acceso debe quedar permitido o denegado;
- qué historia debe conservarse;
- qué resultado debe poder auditarse.

`DERIVAR 08` define:

- categorías de datos;
- granularidad jurídica definitiva;
- textos;
- fundamento normativo;
- retención;
- lectura residual;
- vigencias;
- efectos sobre operaciones en curso;
- políticas de información al actor.

---

### 6.3. Actores

| Actor | Responsabilidad |
|---|---|
| **Asesorado** | Otorga, consulta y revoca sus consentimientos. |
| **Profesional** | Solicita operar dentro de un alcance y finalidad, sin decidir por el asesorado. |
| **Administrador** | Interviene únicamente cuando una función administrativa explícita lo requiera; no otorga consentimiento en nombre del asesorado. |
| **Sistema BE** | Presenta el contexto, preserva versiones, registra decisiones y evalúa autorización en cada operación protegida. |

---

### 6.4. Relaciones internas

```text
UC-P07 — Otorgar y consultar consentimiento específico
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  requiere → UC-P05 — Vínculo aceptado

UC-P08 — Revocar consentimiento
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  aplica → TR-05 — Revocación efectiva

UC-I02 — Evaluar autorización contextual
  es incluido por → todos los casos protegidos
  consulta → vínculo, consentimiento, alcance, finalidad y situación aplicables
```

---

### 6.5. UC-P07 — Otorgar y consultar consentimiento específico

#### 6.5.1. Código

`UC-P07`

#### 6.5.2. Nombre

**Otorgar y consultar consentimiento específico**

#### 6.5.3. Objetivo

Permitir que el asesorado otorgue y consulte un consentimiento específico para un profesional, alcance y finalidad identificados, mediante una versión comprensible y trazable, sin convertirlo en autorización global.

#### 6.5.4. Alcance

- **Superficie:** APK del asesorado.
- **Inicio:** existe un vínculo aceptado y un consentimiento aplicable disponible para decisión o consulta.
- **Fin:** el asesorado consulta la situación o registra un consentimiento específico sobre una versión identificable.

#### 6.5.5. Actor principal

Asesorado.

#### 6.5.6. Actores secundarios

- Profesional relacionado.
- Sistema BE.

#### 6.5.7. Disparador

El asesorado decide habilitar un alcance y finalidad, o consultar sus consentimientos propios.

#### 6.5.8. Precondiciones

1. El asesorado posee identidad BE y sesión válida.
2. Existe un vínculo explícitamente aceptado con el profesional.
3. El profesional y el alcance se encuentran identificados.
4. El alcance corresponde a:
   - Nutrición;
   - Entrenamiento; o
   - capacidad antropométrica transversal.
5. La finalidad se presenta de manera comprensible.
6. Existe una versión identificable del consentimiento.
7. BE evalúa mediante `UC-I02` que el asesorado pueda decidir sobre su propia información.
8. La elegibilidad profesional no convierte el consentimiento en acceso automático.

#### 6.5.9. Postcondiciones de éxito

##### 6.5.9.1. Otorgamiento

1. Existe una decisión expresa del asesorado.
2. La decisión identifica:
   - asesorado;
   - profesional;
   - alcance;
   - finalidad;
   - versión;
   - fecha.
3. El consentimiento alcanza la semántica funcional **vigente** para esa combinación.
4. La versión aceptada queda preservada.
5. Versiones anteriores y decisiones previas no se sobrescriben.
6. Otros profesionales, alcances o finalidades no cambian implícitamente.
7. Las operaciones protegidas continúan sujetas a `UC-I02`.
8. El evento queda trazable.

##### 6.5.9.2. Consulta

1. El asesorado puede identificar:
   - profesional;
   - alcance;
   - finalidad;
   - situación funcional;
   - versión vigente;
   - antecedentes relevantes.
2. La información presentada coincide con la autorización efectiva.
3. No se revelan consentimientos ajenos.

#### 6.5.10. Garantías mínimas

- Solo el asesorado otorga su consentimiento.
- Un profesional o administrador no puede otorgarlo en su nombre.
- El vínculo aceptado no se presenta como consentimiento.
- El consentimiento no es global.
- El alcance no se amplía silenciosamente.
- La finalidad no se reemplaza por una fórmula indeterminada.
- Aceptar una versión no implica aceptar versiones futuras.
- Un fallo de persistencia no muestra consentimiento vigente.
- Otorgar consentimiento no garantiza una autorización favorable si otra dimensión falla.
- Antropometría puede ser el único alcance del consentimiento conforme a `DEC-044`.
- No se fijan categorías de datos, plazos o retención en este documento.

#### 6.5.11. Flujo principal — Otorgamiento

1. El asesorado accede a sus vínculos aceptados.
2. Selecciona el profesional y el alcance correspondiente.
3. BE presenta:
   - identidad del profesional;
   - alcance;
   - finalidad;
   - versión;
   - explicación de que el consentimiento es específico y revocable.
4. BE diferencia el consentimiento de:
   - aceptación del vínculo;
   - verificación profesional;
   - habilitación;
   - autorización contextual.
5. El asesorado consulta el contenido aplicable.
6. El asesorado selecciona otorgar consentimiento.
7. BE solicita confirmación expresa sobre profesional, alcance, finalidad y versión.
8. El asesorado confirma.
9. BE verifica:
   - que el vínculo continúe aceptado;
   - que la versión no haya cambiado;
   - que el actor sea el asesorado;
   - que no exista una decisión concurrente incompatible.
10. BE registra la decisión mediante `UC-I03`.
11. BE deja el consentimiento vigente para esa combinación.
12. BE recalcula la autorización de operaciones futuras mediante `UC-I02`.
13. BE informa el resultado sin afirmar acceso global.
14. El caso finaliza.

#### 6.5.12. Flujo principal — Consulta

1. El asesorado accede a sus consentimientos propios.
2. BE agrupa o relaciona cada consentimiento con:
   - profesional;
   - vínculo;
   - alcance;
   - finalidad.
3. BE presenta la situación funcional actual.
4. El asesorado consulta la versión vigente y los antecedentes disponibles.
5. BE diferencia vigente, revocado o reemplazado mediante semántica comprensible.
6. BE muestra la disponibilidad funcional resultante sin sustituir la decisión de autorización.
7. El caso finaliza sin modificar el consentimiento.

#### 6.5.13. Variantes

##### 6.5.13.1. V01 — Consentimiento nutricional

El alcance corresponde a Nutrición.

**Resultado:** no habilita Entrenamiento ni Antropometría.

##### 6.5.13.2. V02 — Consentimiento de entrenamiento

El alcance corresponde a Entrenamiento.

**Resultado:** no habilita Nutrición ni Antropometría.

##### 6.5.13.3. V03 — Consentimiento antropométrico independiente

El profesional posee únicamente capacidad antropométrica verificada.

**Resultado:** el consentimiento puede limitarse a esa capacidad y finalidad sin exigir especialidad previa.

##### 6.5.13.4. V04 — Mismo profesional con varios alcances

Existe más de un alcance elegible.

**Resultado:** cada alcance y finalidad permanecen identificables; no existe consentimiento combinado implícito.

##### 6.5.13.5. V05 — Nueva versión aplicable

Existe una versión posterior a la aceptada.

**Resultado:** la decisión anterior permanece asociada a la versión original. La conducta necesaria para la nueva versión se deriva a `08`, sin atribuir aceptación silenciosa.

##### 6.5.13.6. V06 — Consulta sin modificación

El asesorado solo consulta su situación.

**Resultado:** no se registra una nueva aceptación.

##### 6.5.13.7. V07 — Consentimiento previo revocado

Existe un antecedente revocado.

**Resultado:** el asesorado puede reconocer la revocación y, si corresponde, decidir sobre una versión disponible sin borrar el antecedente.

#### 6.5.14. Excepciones

##### 6.5.14.1. E01 — Vínculo no aceptado

No existe vínculo aceptado con el profesional.

**Resultado:** BE no permite otorgar consentimiento profesional dentro de ese recorrido.

##### 6.5.14.2. E02 — Versión modificada antes de confirmar

El contenido aplicable cambió.

**Resultado:** BE no registra la decisión sobre una versión distinta y exige revisar nuevamente.

##### 6.5.14.3. E03 — Actor distinto del asesorado

Un profesional, administrador o tercero intenta otorgar consentimiento.

**Resultado:** BE deniega y registra el intento según política.

##### 6.5.14.4. E04 — Alcance o finalidad no identificables

La solicitud no permite saber para qué se otorga el consentimiento.

**Resultado:** BE no registra un consentimiento general o ambiguo.

##### 6.5.14.5. E05 — Consentimiento equivalente vigente

Ya existe una decisión vigente equivalente.

**Resultado:** BE presenta la situación existente y evita duplicados contradictorios.

##### 6.5.14.6. E06 — Cambio concurrente

Otra sesión revocó, reemplazó o modificó la situación.

**Resultado:** BE no declara éxito y exige consultar el resultado vigente.

##### 6.5.14.7. E07 — Falla de persistencia o auditoría

BE no puede confirmar la decisión.

**Resultado:** no muestra consentimiento vigente ni habilita operaciones.

##### 6.5.14.8. E08 — Profesional no elegible al confirmar

La situación profesional cambió.

**Resultado:** BE no presenta la decisión como autorización efectiva; conserva o rechaza el registro según la política que defina `08`.

#### 6.5.15. Reglas aplicables

1. El consentimiento pertenece al asesorado.
2. Debe ser específico por profesional, alcance y finalidad.
3. Debe asociarse a una versión identificable.
4. Debe ser revocable.
5. No equivale a vínculo.
6. No equivale a autorización global.
7. No se extiende a otros profesionales.
8. No se extiende a otros alcances.
9. Una versión nueva no hereda aceptación silenciosa.
10. El alcance puede ser una especialidad o la capacidad antropométrica transversal.
11. La granularidad definitiva y las categorías de datos pertenecen a `08`.
12. La consulta debe coincidir con la autorización efectiva.
13. Los contratos y pantallas pertenecen a `09/10`.

#### 6.5.16. Información utilizada o generada

##### 6.5.16.1. Utilizada

- identidad del asesorado;
- profesional;
- vínculo aceptado;
- alcance;
- finalidad;
- versión;
- situación de decisiones anteriores;
- elegibilidad aplicable.

##### 6.5.16.2. Generada

- decisión de consentimiento;
- situación funcional;
- versión aceptada;
- fecha;
- actor;
- relación con vínculo, alcance y finalidad;
- evento de auditoría;
- recálculo de autorización.

#### 6.5.17. Requisitos relacionados

##### 6.5.17.1. RF

- `RF-020 — Otorgar consentimiento específico y versionado`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Capacidad antropométrica transversal`, cuando el alcance sea Antropometría.

##### 6.5.17.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 6.5.18. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 6.5.19. Casos relacionados

- `UC-P05 — Aceptar o rechazar un vínculo`
- `UC-P08 — Revocar consentimiento`

#### 6.5.20. Puntos de auditoría

- asesorado;
- profesional;
- vínculo;
- alcance;
- finalidad;
- versión mostrada;
- versión aceptada;
- fecha;
- resultado;
- antecedentes relacionados;
- falla, duplicado o concurrencia;
- recálculo de autorización.

#### 6.5.21. Decisiones o preguntas abiertas

1. Categorías y granularidad definitiva: `Q-003 / DERIVAR 08`.
2. Textos y evidencia informativa: `DERIVAR 08/10`.
3. Vigencia y renovación: `DERIVAR 08`.
4. Retención: `Q-004 / DERIVAR 08`.
5. Lectura residual: `Q-005 / DERIVAR 08`.
6. Contratos de versión: `DERIVAR 09`.
7. Representación técnica: `DERIVAR 06`.
8. Operaciones en curso durante cambios: `DERIVAR 08`.
9. No se fija SLA de propagación en 05.

#### 6.5.22. Criterio de cierre

El caso termina cuando el asesorado consulta una situación coherente o registra una decisión específica, versionada y trazable, sin generar autorización global ni invadir las políticas del Documento 08.

---

### 6.6. UC-P08 — Revocar consentimiento

#### 6.6.1. Código

`UC-P08`

#### 6.6.2. Nombre

**Revocar consentimiento**

#### 6.6.3. Objetivo

Permitir que el asesorado revoque un consentimiento específico y produzca el corte verificable de operaciones futuras dentro de su alcance, preservando vínculo, versiones, autoría e historia.

#### 6.6.4. Alcance

- **Superficie:** APK del asesorado.
- **Inicio:** existe un consentimiento propio vigente o consultable.
- **Fin:** la revocación queda registrada y las operaciones futuras del alcance resultan denegadas.

#### 6.6.5. Actor principal

Asesorado.

#### 6.6.6. Actores secundarios

- Profesional relacionado.
- Sistema BE.

#### 6.6.7. Disparador

El asesorado decide retirar un consentimiento.

#### 6.6.8. Precondiciones

1. El asesorado posee identidad BE y sesión válida.
2. El consentimiento pertenece al asesorado.
3. El consentimiento identifica profesional, alcance, finalidad y versión.
4. BE evalúa mediante `UC-I02` que el actor pueda decidir sobre su propio consentimiento.
5. La situación vigente admite revocación o permite reconocer que ya fue revocada.

#### 6.6.9. Postcondiciones de éxito

1. Existe una decisión expresa de revocación.
2. La revocación identifica:
   - asesorado;
   - profesional;
   - alcance;
   - finalidad;
   - versión afectada;
   - fecha.
3. El consentimiento deja de estar vigente.
4. `UC-I02` deniega las operaciones futuras cubiertas por ese alcance.
5. El vínculo no finaliza automáticamente.
6. Otros consentimientos no cambian implícitamente.
7. Versiones, otorgamientos y revocaciones anteriores se conservan.
8. No se ejecuta borrado silencioso de información.
9. El profesional puede conocer la pérdida de autorización dentro de la política aplicable.
10. El evento queda trazable.

#### 6.6.10. Garantías mínimas

- Solo el asesorado revoca su consentimiento.
- Revocar consentimiento no finaliza automáticamente el vínculo.
- Revocar un alcance no revoca otros alcances.
- La revocación no borra la versión aceptada ni su evidencia.
- La revocación no borra la cuenta del asesorado.
- El sistema debe cortar operaciones futuras del alcance revocado.
- Un error de persistencia no muestra una revocación exitosa.
- Una vista o caché no puede conceder acceso contra la autorización vigente.
- La denegación posterior no revela información del recurso protegido.
- Los efectos sobre retención, lectura histórica y operaciones en curso pertenecen a `08`.

#### 6.6.11. Flujo principal

1. El asesorado consulta sus consentimientos.
2. Selecciona un consentimiento vigente.
3. BE presenta:
   - profesional;
   - alcance;
   - finalidad;
   - versión;
   - consecuencia observable de la revocación.
4. BE informa que:
   - se cortarán operaciones futuras del alcance;
   - el vínculo no finalizará automáticamente;
   - la historia no se eliminará;
   - los efectos de lectura y retención dependen de la política aplicable.
5. El asesorado selecciona revocar.
6. BE solicita confirmación explícita.
7. El asesorado confirma.
8. BE verifica:
   - actor;
   - situación vigente;
   - versión;
   - ausencia de decisión concurrente.
9. BE registra la revocación mediante `UC-I03`.
10. BE deja el consentimiento sin vigencia.
11. BE recalcula la autorización mediante `UC-I02`.
12. BE deniega las operaciones futuras comprendidas.
13. BE conserva el vínculo y la historia.
14. BE informa el resultado.
15. El caso finaliza.

#### 6.6.12. Variantes

##### 6.6.12.1. V01 — Revocación de un alcance dentro de varios

El asesorado posee consentimientos para más de un alcance con el mismo profesional.

**Resultado:** solo el alcance seleccionado pierde vigencia; los demás no cambian.

##### 6.6.12.2. V02 — Revocación antropométrica

El consentimiento cubre capacidad antropométrica transversal.

**Resultado:** se cortan operaciones antropométricas futuras sin afectar Nutrición o Entrenamiento.

##### 6.6.12.3. V03 — Vínculo sin consentimientos vigentes después de revocar

La revocación deja al vínculo sin consentimiento aplicable.

**Resultado:** el vínculo continúa existiendo, pero no habilita operaciones protegidas.

##### 6.6.12.4. V04 — Revocación y decisión posterior sobre el vínculo

El asesorado desea además pausar o finalizar la relación.

**Resultado:** primero se registra la revocación; la pausa o finalización requiere una decisión separada mediante `UC-P06`.

##### 6.6.12.5. V05 — Consulta de revocación previa

El asesorado consulta un antecedente ya revocado.

**Resultado:** BE muestra que no existe vigencia y no registra una segunda revocación como éxito.

#### 6.6.13. Excepciones

##### 6.6.13.1. E01 — Consentimiento ya revocado

La decisión ya existe.

**Resultado:** BE presenta la situación vigente y no duplica el evento.

##### 6.6.13.2. E02 — Actor no autorizado

Un profesional, administrador o tercero intenta revocar en nombre del asesorado.

**Resultado:** BE deniega y registra el intento según política.

##### 6.6.13.3. E03 — Versión o alcance inconsistente

La decisión no puede vincularse de forma inequívoca.

**Resultado:** BE no aplica una revocación general o ambigua.

##### 6.6.13.4. E04 — Operación concurrente

Otra sesión modificó la situación.

**Resultado:** BE no declara éxito y presenta el resultado vigente.

##### 6.6.13.5. E05 — Falla de persistencia o auditoría

BE no puede confirmar la revocación.

**Resultado:** no muestra el consentimiento como revocado y no produce una transición parcial.

##### 6.6.13.6. E06 — Corte futuro no verificable

BE registra la revocación, pero la autorización efectiva no refleja el cambio.

**Resultado:** la operación protegida debe denegarse de forma conservadora y la inconsistencia se registra para tratamiento.

##### 6.6.13.7. E07 — Intento de usar revocación para finalizar vínculo

Un recorrido intenta aplicar la revocación como cierre automático.

**Resultado:** BE preserva el vínculo y exige una decisión separada para pausa o finalización.

##### 6.6.13.8. E08 — Solicitud de borrado asociada

El asesorado solicita además cierre de cuenta o eliminación.

**Resultado:** la revocación se registra de forma independiente; cierre, retención y supresión se derivan a sus recorridos y al Documento 08.

#### 6.6.14. Reglas aplicables

1. La revocación pertenece al asesorado.
2. Debe identificar profesional, alcance, finalidad y versión.
3. Debe cortar operaciones futuras del alcance.
4. No finaliza automáticamente el vínculo.
5. Finalizar vínculo no borra el consentimiento histórico.
6. No se extiende a otros profesionales.
7. No se extiende a otros alcances.
8. Conserva evidencia y trazabilidad.
9. No equivale a borrado de datos.
10. La lectura residual y la retención pertenecen a `08`.
11. Las operaciones en curso y el tiempo técnico de propagación pertenecen a `08/09/11A`.
12. La autorización posterior debe denegar sin filtrar información protegida.

#### 6.6.15. Información utilizada o generada

##### 6.6.15.1. Utilizada

- identidad del asesorado;
- profesional;
- vínculo;
- consentimiento vigente;
- alcance;
- finalidad;
- versión;
- situación de autorización.

##### 6.6.15.2. Generada

- decisión de revocación;
- fecha;
- actor;
- versión afectada;
- situación posterior;
- recálculo de autorización;
- denegaciones posteriores;
- evento de auditoría.

#### 6.6.16. Requisitos relacionados

##### 6.6.16.1. RF

- `RF-022 — Revocar consentimiento y cortar accesos futuros`
- `RF-020 — Consentimiento específico y versionado`
- `RF-021 — Autorización contextual`
- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-024 — Pausar o finalizar vínculo`, como decisión separada.

##### 6.6.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 6.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 6.6.18. Casos relacionados

- `UC-P06 — Consultar, pausar o finalizar un vínculo`
- `UC-P07 — Otorgar y consultar consentimiento específico`

#### 6.6.19. Puntos de auditoría

- asesorado;
- profesional;
- vínculo;
- alcance;
- finalidad;
- versión;
- situación anterior;
- decisión y fecha;
- situación posterior;
- recálculo de autorización;
- primera denegación posterior verificable;
- intento de finalizar vínculo automáticamente;
- falla, concurrencia o inconsistencia.

#### 6.6.20. Decisiones o preguntas abiertas

1. Retención: `Q-004 / DERIVAR 08`.
2. Lectura posterior: `Q-005 / DERIVAR 08`.
3. Granularidad y categorías: `Q-003 / DERIVAR 08`.
4. Operaciones en curso: `DERIVAR 08`.
5. Tiempo y mecanismo de propagación: `DERIVAR 08/09/11A`.
6. Información visible al profesional: `DERIVAR 08/10`.
7. Efectos sobre procesos abiertos: `DERIVAR 06/08`.
8. Cierre o eliminación de cuenta: `UC-P27 / DERIVAR 08`.
9. No se fija SLA en 05.

#### 6.6.21. Criterio de cierre

El caso termina cuando la revocación queda registrada, las operaciones futuras resultan denegadas y el vínculo y la historia permanecen preservados, o cuando una excepción impide la decisión sin mostrar un estado falso.

---

### 6.7. UC-I02 — Evaluar autorización contextual

#### 6.7.1. Código

`UC-I02`

#### 6.7.2. Nombre

**Evaluar autorización contextual**

#### 6.7.3. Tipo

Caso incluido transversal.

#### 6.7.4. Objetivo

Determinar si una operación protegida puede ejecutarse considerando conjuntamente las dimensiones aprobadas, y denegar de forma segura cuando alguna no se cumple.

#### 6.7.5. Actor principal

Sistema BE.

#### 6.7.6. Actores secundarios

- Profesional.
- Asesorado.
- Administrador, cuando una operación administrativa protegida lo requiera.

#### 6.7.7. Disparador

Un actor intenta ejecutar una operación protegida.

#### 6.7.8. Precondiciones

1. La identidad del actor puede evaluarse.
2. La operación y el contexto solicitado pueden identificarse.
3. Existe información suficiente para evaluar las dimensiones aplicables.
4. Si la evaluación no puede completarse, la operación no se presume autorizada.

#### 6.7.9. Dimensiones obligatorias

`RF-021` exige evaluar conjuntamente:

1. rol;
2. especialidad o capacidad;
3. situación aplicable;
4. vínculo;
5. consentimiento;
6. finalidad;
7. alcance.

Ninguna dimensión aislada concede acceso.

#### 6.7.10. Postcondiciones de éxito

##### 6.7.10.1. Autorización favorable

1. Todas las dimensiones aplicables cumplen la regla vigente.
2. La operación puede continuar únicamente dentro del alcance autorizado.
3. La decisión no amplía permisos posteriores.
4. El resultado queda disponible para auditoría según la política.

##### 6.7.10.2. Denegación

1. Al menos una dimensión no cumple o no puede comprobarse.
2. La operación no se ejecuta.
3. La respuesta no revela:
   - existencia del recurso;
   - contenido;
   - identidad de terceros;
   - motivo sensible;
   - información no autorizada.
4. El intento queda registrado cuando la política lo exige.
5. La denegación no modifica el recurso protegido.

#### 6.7.11. Garantías mínimas

- Autenticación no equivale a autorización.
- Rol aislado no equivale a autorización.
- Vínculo aceptado no equivale a consentimiento.
- Consentimiento vigente no equivale a autorización si falla otra dimensión.
- `VERIFICADO` no equivale a habilitado ni autorizado.
- Antropometría se evalúa como capacidad transversal.
- Una revocación debe reflejarse en operaciones futuras.
- La falta de información o una inconsistencia producen denegación conservadora.
- La denegación no filtra información protegida.
- Una pantalla visible no determina autorización.

#### 6.7.12. Flujo principal — Autorización favorable

1. Una operación protegida solicita evaluación.
2. BE identifica:
   - actor;
   - operación;
   - contexto;
   - alcance pretendido;
   - finalidad.
3. BE evalúa rol.
4. BE evalúa especialidad o capacidad.
5. BE evalúa situación profesional o de cuenta aplicable.
6. BE evalúa vínculo.
7. BE evalúa consentimiento vigente.
8. BE evalúa coincidencia de finalidad.
9. BE evalúa alcance.
10. Todas las dimensiones resultan favorables.
11. BE registra la decisión según política.
12. BE permite continuar únicamente la operación solicitada.
13. El caso incluido finaliza.

#### 6.7.13. Flujo alternativo — Denegación

1. Una operación protegida solicita evaluación.
2. BE identifica actor y contexto sin exponer el recurso.
3. Una dimensión resulta desfavorable, ausente o inconsistente.
4. BE detiene la evaluación o completa únicamente lo necesario según política.
5. BE deniega la operación.
6. BE devuelve un resultado que no revela información protegida.
7. BE registra el intento cuando corresponde.
8. El caso incluido finaliza sin modificar el recurso.

#### 6.7.14. Variantes

##### 6.7.14.1. V01 — Profesional de Nutrición

La operación pertenece a Nutrición.

**Resultado:** la capacidad antropométrica o Entrenamiento no sustituyen la especialidad requerida.

##### 6.7.14.2. V02 — Profesional de Entrenamiento

La operación pertenece a Entrenamiento.

**Resultado:** Nutrición o Antropometría no sustituyen la especialidad requerida.

##### 6.7.14.3. V03 — Profesional exclusivamente antropométrico

La operación pertenece a Antropometría.

**Resultado:** se evalúa capacidad antropométrica verificada sin exigir Nutrición o Entrenamiento.

##### 6.7.14.4. V04 — Dashboard interdisciplinario

La operación consulta contexto de más de un dominio.

**Resultado:** cada dato o conjunto pertinente se limita por consentimiento, finalidad y alcance; una autorización parcial no se transforma en acceso global.

##### 6.7.14.5. V05 — Consentimiento revocado

La operación estaba previamente permitida, pero el consentimiento fue revocado.

**Resultado:** la operación futura se deniega aunque el vínculo continúe aceptado.

##### 6.7.14.6. V06 — Vínculo finalizado con historia preservada

La operación intenta continuar un proceso finalizado.

**Resultado:** se deniegan nuevas operaciones; la lectura residual se decide según `08`.

#### 6.7.15. Excepciones

##### 6.7.15.1. E01 — Servicio de autorización no puede evaluar

No se puede determinar una o más dimensiones.

**Resultado:** la operación se deniega de forma conservadora.

##### 6.7.15.2. E02 — Datos contextuales inconsistentes

Las fuentes de vínculo, consentimiento o situación no coinciden.

**Resultado:** la operación se deniega y se registra la inconsistencia.

##### 6.7.15.3. E03 — Resultado obsoleto

Existe una decisión previa que no refleja una revocación o cambio reciente.

**Resultado:** no se reutiliza como autorización vigente; se reevalúa o se deniega.

##### 6.7.15.4. E04 — Operación fuera de alcance

El actor intenta ampliar finalidad o alcance.

**Resultado:** BE deniega sin revelar contenido adicional.

##### 6.7.15.5. E05 — Recurso inexistente o no autorizado

BE no debe distinguir ante el actor entre inexistencia y falta de autorización cuando esa diferencia revele información.

**Resultado:** respuesta segura y uniforme conforme a `08/09`.

##### 6.7.15.6. E06 — Auditoría requerida no disponible

La política exige registrar el evento y BE no puede hacerlo.

**Resultado:** la operación no continúa cuando la ausencia de auditoría impide cumplir el control aprobado.

#### 6.7.16. Reglas aplicables

1. La evaluación ocurre en cada operación protegida.
2. Las siete dimensiones se consideran conjuntamente.
3. El principio funcional es denegar cuando no puede comprobarse autorización.
4. La autorización se limita a operación, finalidad y alcance.
5. La decisión no se deduce de la UI.
6. La revocación afecta operaciones futuras.
7. La denegación no filtra información protegida.
8. La política técnica detallada pertenece a `08`.
9. Contratos y respuestas pertenecen a `09`.
10. Escenarios exhaustivos y tiempos pertenecen a `11A`.

#### 6.7.17. Información utilizada o generada

##### 6.7.17.1. Utilizada

- identidad;
- rol;
- especialidad o capacidad;
- situación aplicable;
- vínculo;
- consentimiento;
- finalidad;
- alcance;
- operación solicitada;
- contexto.

##### 6.7.17.2. Generada

- resultado favorable o denegado;
- alcance autorizado;
- motivo interno conforme a política;
- evento de auditoría;
- inconsistencia detectada.

#### 6.7.18. Requisitos relacionados

##### 6.7.18.1. RF

- `RF-021 — Evaluar autorización contextual en cada operación protegida`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-020 — Consentimiento específico y versionado`
- `RF-022 — Revocación efectiva`
- `RF-023 — Consulta coherente de vínculos y consentimientos`
- `RF-047 — Registro antropométrico autorizado`
- `RF-053 — Dashboard interdisciplinario autorizado`

##### 6.7.18.2. RNF conductuales

- `RNF-REL-001`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 6.7.19. Invocado por

Todo caso que intente:

- consultar información protegida;
- crear o modificar un proceso profesional;
- activar un plan;
- registrar una evaluación;
- revisar evidencia;
- acceder al dashboard;
- corregir información;
- publicar u operar un servicio sujeto a habilitación;
- ejecutar una acción administrativa protegida.

La matriz consolidada registra los invocantes relevantes; 12 completará la trazabilidad canónica.

#### 6.7.20. Puntos de auditoría

- actor;
- operación;
- contexto;
- resultado;
- alcance permitido;
- dimensión desfavorable, según política interna;
- fecha;
- denegación posterior a revocación;
- intento de ampliación de finalidad;
- inconsistencia o imposibilidad de evaluación.

#### 6.7.21. Decisiones o preguntas abiertas

1. Política exacta de autorización: `DERIVAR 08`.
2. Información del motivo visible al actor: `DERIVAR 08/09`.
3. Auditoría de accesos y denegaciones: `DERIVAR 08`.
4. Propagación y consistencia: `DERIVAR 07/08/09`.
5. Respuestas y códigos: `DERIVAR 09`.
6. Estados técnicos: `DERIVAR 06`.
7. Rendimiento y disponibilidad: `DERIVAR 07/11A`.
8. No se fija mecanismo de caché ni SLA en 05.

#### 6.7.22. Criterio de cierre

El caso incluido termina cuando la operación queda permitida dentro de un alcance explícito o denegada sin filtrar información protegida, con la trazabilidad exigida por la política aplicable.

---

### 6.8. Historias de usuario prioritarias

#### 6.8.1. HU-05 — Controlar consentimientos propios

**Como** asesorado  
**quiero** decidir qué profesional puede operar, para qué alcance y finalidad, y consultar la versión aceptada  
**para** participar de forma informada sin conceder acceso general.

##### 6.8.1.1. Criterios de aceptación

###### 6.8.1.1.1. Escenario 1 — Consentimiento específico

**Dado** que tengo un vínculo aceptado con un profesional  
**y** BE presenta profesional, alcance, finalidad y versión  
**cuando** confirmo el consentimiento  
**entonces** la decisión queda asociada a esa combinación  
**y** otros profesionales o alcances no cambian  
**y** la operación continúa sujeta a autorización contextual.

###### 6.8.1.1.2. Escenario 2 — Antropometría independiente

**Dado** que el profesional posee solo capacidad antropométrica verificada  
**cuando** otorgo consentimiento para ese alcance y finalidad  
**entonces** BE registra un consentimiento antropométrico válido  
**y** no exige Nutrición o Entrenamiento  
**y** no habilita esas especialidades.

###### 6.8.1.1.3. Escenario 3 — Nueva versión

**Dado** que existe una versión posterior  
**cuando** consulto mi situación  
**entonces** BE no atribuye mi decisión anterior al nuevo contenido  
**y** conserva la versión previamente aceptada.

###### 6.8.1.1.4. Escenario 4 — Consulta

**Dado** que poseo consentimientos y antecedentes  
**cuando** los consulto  
**entonces** identifico profesional, alcance, finalidad, situación y versión  
**y** la información coincide con la autorización efectiva.

---

#### 6.8.2. HU-06 — Revocar y cortar accesos futuros

**Como** asesorado  
**quiero** revocar un consentimiento específico  
**para** impedir nuevas operaciones dentro de ese alcance sin perder mi vínculo ni la historia.

##### 6.8.2.1. Criterios de aceptación

###### 6.8.2.1.1. Escenario 1 — Corte futuro

**Dado** que existe un consentimiento vigente  
**cuando** confirmo su revocación  
**entonces** BE registra actor, alcance, finalidad, versión y fecha  
**y** las operaciones futuras cubiertas resultan denegadas.

###### 6.8.2.1.2. Escenario 2 — Vínculo preservado

**Dado** que revoqué el único consentimiento vigente de un vínculo  
**cuando** consulto la relación  
**entonces** el vínculo continúa existiendo  
**y** no habilita operaciones protegidas  
**y** no fue finalizado automáticamente.

###### 6.8.2.1.3. Escenario 3 — Otros alcances preservados

**Dado** que tengo consentimientos separados para Nutrición y Entrenamiento  
**cuando** revoco Nutrición  
**entonces** Entrenamiento no cambia implícitamente  
**y** la revocación queda trazable.

###### 6.8.2.1.4. Escenario 4 — Denegación segura

**Dado** que un profesional intenta una operación después de la revocación  
**cuando** BE evalúa la autorización  
**entonces** la operación se deniega  
**y** la respuesta no revela información protegida.

###### 6.8.2.1.5. Escenario 5 — Finalización separada

**Dado** que además deseo terminar la relación  
**cuando** finalizo el vínculo mediante su caso correspondiente  
**entonces** la finalización queda registrada como decisión separada  
**y** los consentimientos y revocaciones históricos permanecen.

---

### 6.9. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Consentimiento como gate real | Existe registro parcial, pero no gobierna consistentemente el acceso | `REEMPLAZAR / REFACTORIZAR` | Toda operación protegida invoca UC-I02. |
| Especificidad por profesional, alcance y finalidad | Parcial o no evidenciada | `NO EVIDENCIADO` | Registrar combinación y versión sin fijar categorías de 08. |
| Versionado | No evidenciado de extremo a extremo | `NO EVIDENCIADO` | Preservar decisiones anteriores y evitar aceptación silenciosa. |
| Consulta coherente | Parcial | `REFACTORIZAR` | Lo mostrado debe coincidir con autorización efectiva. |
| Revocación con corte futuro | No demostrada de extremo a extremo | `REEMPLAZAR / NO EVIDENCIADO` | Denegar operaciones futuras y conservar evidencia. |
| Revocación separada de vínculo | No evidenciada | `NO EVIDENCIADO` | Mantener relación salvo decisión separada. |
| Denegación sin filtración | No evidenciada | `NO EVIDENCIADO` | Resultado seguro y uniforme. |
| Autorización por siete dimensiones | Parcial o inexistente | `REEMPLAZAR / REFACTORIZAR` | Evaluar conjuntamente RF-021. |

---

### 6.10. Revisión crítica consolidada

#### 6.10.1. Controles superados

1. No se enumeran categorías definitivas de datos.
2. No se fijan plazos, vigencias, SLA o retención.
3. Q-003, Q-004 y Q-005 permanecen en 08.
4. El consentimiento puede recaer sobre especialidad o capacidad transversal.
5. `DEC-044` se aplica sin crear tercera especialidad.
6. UC-I02 evalúa siete dimensiones.
7. La denegación no filtra información protegida.
8. Versionado y corte futuro se expresan como conductas observables.
9. La revocación no finaliza automáticamente el vínculo.
10. La asimetría aparece en garantías, variantes/excepciones, reglas, aceptación y auditoría.
11. Los términos nuevos fueron incorporados al glosario antes de propagarse.
12. No se fijan endpoints, entidades o pantallas.

#### 6.10.2. Control de la asimetría en UC-P08

| Ubicación exigida | Evidencia |
|---|---|
| Garantías mínimas | “Revocar consentimiento no finaliza automáticamente el vínculo” |
| Variantes o excepciones | V03, V04 y E07 |
| Reglas aplicables | Reglas 4 y 5 |
| Criterios de aceptación | HU-06, escenarios 2 y 5 |
| Puntos de auditoría | intento de finalización automática |

**Resultado:** `CUMPLE 5/5`.

#### 6.10.3. Riesgos abiertos

##### 6.10.3.1. R-05-CON-01 — Invasión del Documento 08

**Riesgo:** fijar categorías, plazos o políticas jurídicas en 05.

**Control:** el bloque especifica decisiones y efectos observables; todo detalle normativo se deriva.

##### 6.10.3.2. R-05-CON-02 — Consentimiento global

**Riesgo:** usar una aceptación única para cualquier profesional o finalidad.

**Control:** profesional, alcance, finalidad y versión son obligatorios.

##### 6.10.3.3. R-05-CON-03 — Revocación registrada pero no aplicada

**Riesgo:** persistir el evento sin cortar acceso.

**Control:** UC-P08 exige recálculo y primera denegación futura verificable.

##### 6.10.3.4. R-05-CON-04 — Filtración mediante denegación

**Riesgo:** revelar la existencia o contenido de recursos.

**Control:** UC-I02 exige denegación segura.

##### 6.10.3.5. R-05-CON-05 — Antropometría modelada como especialidad

**Riesgo:** autorización incorrecta.

**Control:** DEC-044 y glosario; alcance por capacidad transversal.

##### 6.10.3.6. R-05-CON-06 — Vista divergente de autorización

**Riesgo:** mostrar vigente mientras el acceso está denegado o viceversa.

**Control:** consultas deben coincidir con autorización efectiva.

##### 6.10.3.7. R-05-CON-07 — Finalización automática del vínculo

**Riesgo:** romper la asimetría y perder continuidad relacional.

**Control:** regla transversal, cinco ubicaciones verificables y decisión separada UC-P06.

#### 6.10.4. Veredicto

```text
BLOQUE 03 — CONSENTIMIENTO Y AUTORIZACIÓN:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS:
UC-P07, UC-P08, UC-I02

RF PRINCIPALES:
RF-020, RF-021, RF-022, RF-023

DECISIONES APLICADAS:
DEC-006, DEC-044

PREGUNTAS RESPETADAS:
Q-003, Q-004, Q-005

ASIMETRÍA UC-P08:
CUMPLE 5/5

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 6.11. Decisiones del bloque

#### 6.11.1. Aprobadas y aplicadas

- consentimiento específico;
- versionado;
- revocabilidad;
- consentimiento como gate;
- autorización por operación;
- siete dimensiones de RF-021;
- denegación sin filtración;
- corte futuro;
- asimetría vínculo–consentimiento;
- alcance por capacidad antropométrica transversal;
- preservación histórica.

#### 6.11.2. Provisionales

- códigos `UC-P07`, `UC-P08`, `UC-I02`;
- semántica de vigente, revocado y reemplazado;
- representación de varios alcances;
- contenido mínimo visible;
- comportamiento ante operaciones en curso.

#### 6.11.3. Pendientes derivados

- categorías y granularidad: `08`;
- retención: `08`;
- lectura residual: `08`;
- estados y persistencia: `06`;
- contratos y respuestas: `09`;
- componentes y copy: `10`;
- escenarios exhaustivos y tiempos: `11A`;
- trazabilidad canónica: `12`.

---

### 6.12. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. el consentimiento pertenece exclusivamente al asesorado;
2. profesional, alcance, finalidad y versión son obligatorios;
3. el alcance puede ser especialidad o capacidad transversal;
4. vínculo, consentimiento y autorización permanecen separados;
5. la revocación corta operaciones futuras;
6. la revocación no finaliza automáticamente el vínculo;
7. UC-I02 evalúa las siete dimensiones;
8. la denegación no filtra información protegida;
9. Q-003, Q-004 y Q-005 permanecen en 08;
10. no se fijaron categorías, plazos, SLA, endpoints o pantallas.

---

### 6.13. Estado

```text
ARQUITECTURA:
v0.2.3 — DEC-044 APLICADA

GLOSARIO:
v0.1.2 — PREPARADO PARA CONSENTIMIENTO

BLOQUE 01:
v0.3.3 — DEC-044 APLICADA

BLOQUE 02:
v0.4.2 — ESTRUCTURA Y DEC-044 CORREGIDAS

BLOQUE 03:
REDACTADO EN v0.5
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P07, UC-P08, UC-I02

HISTORIAS:
HU-05, HU-06

GIT:
SIN CAMBIOS
```

#### 6.13.1. Siguiente acción recomendada

Revisar el Bloque 03. Después desarrollar el primer circuito demostrable:

```text
BLOQUE 04 — CIRCUITO NUTRICIONAL

UC-P09 — Registrar evaluación y objetivo nutricional
UC-P10 — Diseñar plan nutricional
UC-P11 — Validar y activar plan nutricional
UC-P12 — Consultar y registrar ejecución nutricional en APK
```


---

---

## 7. Bloque 04 — Circuito nutricional hasta ejecución

*Fuente ensamblada: `BE_LEG_05_v0.6_BLOQUE_04_CIRCUITO_NUTRICIONAL_HASTA_EJECUCION.md`.*

### 7.1. Propósito y límite del bloque

Este bloque desarrolla la primera parte del circuito nutricional:

```text
evaluación
→ objetivo vigente
→ plan en borrador
→ validación
→ versión activada e instantánea reproducible
→ consulta en APK
→ adherencia o ejecución registrada
```

No declara todavía que el circuito nutricional se encuentre cerrado.

El cierre demostrable requiere además el Bloque 05:

```text
evidencia de ejecución
→ análisis del período
→ revisión profesional válida
→ decisión
→ continuidad o cierre
```

Distribución aprobada:

| Materia | Bloque propietario en 05 |
|---|---|
| `RF-026` y `RF-029` — evaluación y objetivo | Bloque 04 — `UC-P09` |
| `RF-027`, `RF-028` y `RF-030` — catálogo, importación y borrador | Bloque 04 — `UC-P10` |
| `RF-031` y control de `RF-066` — activación | Bloque 04 — `UC-P11` |
| `RF-032` y `RF-033` — consulta y registro en APK | Bloque 04 — `UC-P12` |
| `RF-034`, `RF-035` y `RF-056` — revisión, decisión y continuidad | Bloque 05 — `UC-P13` |

Por tanto:

> **Bloque 04 produce evidencia ejecutable; Bloque 05 transforma esa evidencia en una revisión y una decisión trazables.**

---

### 7.2. Fronteras documentales

Este bloque define conductas observables y no fija:

- fórmulas nutricionales;
- calorías;
- macronutrientes;
- porciones;
- categorías definitivas de alimentos;
- contenido prescriptivo;
- estructuras persistentes;
- estados técnicos;
- endpoints;
- DTO;
- componentes visuales;
- estrategia exhaustiva de pruebas.

Derivaciones:

| Materia | Propietario |
|---|---|
| estructura de evaluación, objetivo, plan, catálogo y snapshot | `06` |
| autorización, procedencia y gobierno de datos | `08` |
| adaptador de Open Food Facts | `07` |
| contratos e idempotencia técnica | `09` |
| formulario, editor y pantalla Hoy | `10` |
| concurrencia y pruebas E2E | `11A` |
| matriz completa | `12` |

---

### 7.3. Reglas comunes del circuito

1. Toda operación protegida incluye `UC-I02`.
2. Evaluación, objetivo, borrador, versión activada y ejecución son hechos diferenciados.
3. El contenido nutricional pertenece al criterio profesional y al modelo de dominio; 05 no prescribe valores.
4. Un borrador no es visible como plan vigente.
5. Activar preserva una instantánea reproducible de la versión emitida.
6. Editar después de activar no modifica la versión ya consultada por el asesorado.
7. No existen dos vigencias contradictorias para el mismo proceso.
8. La capacidad configurada se controla al iniciar un proceso nuevo sin interrumpir procesos vigentes.
9. Open Food Facts no es fuente operativa única.
10. Toda importación externa conserva procedencia.
11. La caída de un tercero no impide evaluar, diseñar, activar, consultar o revisar mediante fuentes propias y carga manual.
12. El registro del asesorado se asocia a la versión activa y evita duplicados observables por reintento.
13. Abrir información de ejecución no constituye revisión profesional válida.
14. El circuito solo se declara cerrado después de `UC-P13`.

---

### 7.4. Relaciones internas

```text
UC-P09 — Registrar evaluación y objetivo nutricional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia

UC-P10 — Diseñar plan nutricional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  puede incluir → UC-I07 — Importar elemento externo con revisión controlada
  incluye ante contingencia → UC-I08 — Aplicar fallback manual y conservar procedencia

UC-P11 — Validar y activar plan nutricional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  incluye → UC-I04 — Validar y versionar un plan
  incluye → UC-I10 — Verificar habilitación y capacidad

UC-P12 — Consultar y registrar ejecución nutricional en APK
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  genera evidencia para → UC-P13 — Revisar evidencia y decidir continuidad nutricional
```

---

### 7.5. UC-P09 — Registrar evaluación y objetivo nutricional

#### 7.5.1. Código

`UC-P09`

#### 7.5.2. Nombre

**Registrar evaluación y objetivo nutricional**

#### 7.5.3. Objetivo

Permitir que un profesional de Nutrición autorizado registre una evaluación pertinente y un objetivo vigente, identificables y relacionados, como base del diseño del plan nutricional.

#### 7.5.4. Alcance

- **Superficie:** profesional.
- **Canal previsto:** Website.
- **Inicio:** existe vínculo aceptado, consentimiento aplicable y autorización favorable.
- **Fin:** evaluación y objetivo quedan registrados o actualizados sin sobrescribir antecedentes.

#### 7.5.5. Actor principal

Profesional de Nutrición.

#### 7.5.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 7.5.7. Disparador

El profesional inicia o actualiza la base de planificación nutricional.

#### 7.5.8. Precondiciones

1. El profesional posee Nutrición `VERIFICADA`.
2. Existe habilitación aplicable.
3. Existe vínculo aceptado con el asesorado.
4. Existe consentimiento vigente para el alcance y finalidad.
5. `UC-I02` autoriza la operación.
6. El profesional puede identificar el contexto y las fuentes utilizadas.
7. La estructura de datos pertenece a `DERIVAR 06`.

#### 7.5.9. Postcondiciones de éxito

1. La evaluación queda asociada a:
   - asesorado;
   - profesional;
   - vínculo;
   - fecha;
   - contexto;
   - fuentes;
   - autoría.
2. La evaluación distingue información informada, observada y calculada sin confundir procedencia.
3. Existe un objetivo nutricional identificable.
4. El objetivo conserva:
   - responsable;
   - relación con la evaluación;
   - período o vigencia semántica;
   - fundamento profesional.
5. El asesorado puede consultar la formulación autorizada según la superficie prevista.
6. Una actualización no reescribe silenciosamente la evaluación u objetivo anteriores.
7. La historia queda trazable.
8. No se fija contenido nutricional concreto en este caso de uso.

#### 7.5.10. Garantías mínimas

- Registrar una evaluación no activa un plan.
- La evaluación no se presenta como diagnóstico.
- El objetivo no se genera automáticamente.
- El objetivo no fija valores o fórmulas desde 05.
- Un dato calculado no se presenta como observado.
- Las fuentes permanecen identificables.
- Un fallo no muestra una evaluación u objetivo exitosos.
- Otro profesional o vínculo no obtiene acceso implícito.
- Cambiar el objetivo no altera retrospectivamente planes emitidos.

#### 7.5.11. Flujo principal

1. El profesional selecciona al asesorado dentro de una relación autorizada.
2. BE ejecuta `UC-I02`.
3. El profesional inicia una evaluación nutricional.
4. BE presenta el contexto disponible y autorizado.
5. El profesional registra la información pertinente al proceso.
6. El profesional identifica o confirma la fuente y el contexto de los elementos relevantes.
7. BE verifica que la evaluación pueda distinguir información informada, observada y calculada.
8. El profesional guarda la evaluación.
9. BE preserva autoría, fecha y relación con el asesorado mediante `UC-I03`.
10. El profesional define o actualiza el objetivo nutricional.
11. BE solicita relación con la evaluación, responsable y vigencia semántica.
12. El profesional registra el fundamento.
13. BE verifica que el objetivo sea identificable y no reescriba uno anterior.
14. BE registra la nueva versión o antecedente según `DERIVAR 06`.
15. BE deja evaluación y objetivo disponibles para `UC-P10`.
16. El caso finaliza sin activar un plan.

#### 7.5.12. Variantes

##### 7.5.12.1. V01 — Primera evaluación

No existe evaluación anterior.

**Resultado:** se crea la base inicial del proceso nutricional.

##### 7.5.12.2. V02 — Evaluación de seguimiento

Existe una evaluación previa.

**Resultado:** se agrega un nuevo antecedente relacionado sin reemplazar silenciosamente el anterior.

##### 7.5.12.3. V03 — Actualización del objetivo

La evaluación continúa siendo pertinente, pero el objetivo cambia.

**Resultado:** se registra un objetivo nuevo o actualizado con relación trazable al anterior.

##### 7.5.12.4. V04 — Información de fuentes diferentes

La evaluación utiliza información declarada por el asesorado, observación profesional y cálculos.

**Resultado:** BE conserva su tipo y procedencia sin fusionarlos como si fueran equivalentes.

##### 7.5.12.5. V05 — Consulta del objetivo por el asesorado

El asesorado consulta la formulación autorizada.

**Resultado:** ve el objetivo vigente y no información administrativa ajena.

##### 7.5.12.6. V06 — Ejecutar método profesional de apoyo

El profesional decide utilizar uno o más métodos pertinentes como apoyo para interpretar la evaluación o fundamentar el objetivo.

**Resultado:** BE ejecuta `UC-I13`; cada resultado conserva método, versión, inputs y procedencia, y ninguno se convierte automáticamente en objetivo nutricional, requerimiento, prescripción o plan.

#### 7.5.13. Excepciones

##### 7.5.13.1. E01 — Autorización desfavorable

Falta una dimensión de `UC-I02`.

**Resultado:** BE no permite registrar ni consultar información protegida.

##### 7.5.13.2. E02 — Contexto o fuente no identificables

La evaluación no permite reconocer procedencia suficiente.

**Resultado:** BE no registra el elemento como completo y solicita corrección sin inventar la fuente.

##### 7.5.13.3. E03 — Objetivo sin relación con evaluación

No se identifica la evaluación base.

**Resultado:** BE no presenta el objetivo como vigente.

##### 7.5.13.4. E04 — Actualización que sobrescribiría antecedentes

La operación intenta reemplazar silenciosamente una evaluación u objetivo anteriores.

**Resultado:** BE exige una nueva versión o antecedente.

##### 7.5.13.5. E05 — Falla de persistencia o auditoría

BE no puede confirmar el registro.

**Resultado:** no muestra éxito y no habilita el diseño como si existiera una base válida.

##### 7.5.13.6. E06 — Intento de contenido automático

Un recorrido intenta generar el objetivo sin decisión profesional.

**Resultado:** BE no lo registra como objetivo profesional válido.

#### 7.5.14. Reglas aplicables

1. La evaluación es pertinente al proceso y no historia clínica completa.
2. El objetivo se relaciona con una evaluación.
3. Objetivo y evaluación conservan autoría y fecha.
4. La procedencia se conserva.
5. Los cambios no reescriben antecedentes.
6. No se fija contenido nutricional en 05.
7. La evaluación no equivale a plan.
8. El objetivo no equivale a plan activado.
9. El asesorado consulta únicamente la formulación autorizada.
10. La estructura técnica pertenece a `06`.

#### 7.5.15. Información utilizada o generada

##### 7.5.15.1. Utilizada

- identidad y especialidad del profesional;
- vínculo;
- consentimiento;
- contexto autorizado;
- antecedentes disponibles;
- fuentes pertinentes.

##### 7.5.15.2. Generada

- evaluación;
- objetivo vigente;
- autoría;
- fecha;
- fundamento;
- relaciones con antecedentes;
- eventos de auditoría.

#### 7.5.16. Requisitos relacionados

##### 7.5.16.1. RF

- `RF-026 — Registrar una evaluación nutricional`
- `RF-029 — Definir un objetivo nutricional vigente`
- `RF-021 — Evaluar autorización contextual`
- `RF-025 — Preservar identidad e historia`
- `RF-070 — Utilizar métodos profesionales de cálculo reproducible`, cuando corresponda.

##### 7.5.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 7.5.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I13 — Ejecutar y adoptar cálculo profesional reproducible`, cuando corresponda.

#### 7.5.18. Puntos de auditoría

- profesional;
- asesorado;
- vínculo;
- fuentes;
- contexto;
- evaluación;
- objetivo;
- fundamento;
- versión o antecedente;
- fecha;
- autorización;
- falla o intento de sobrescritura.

#### 7.5.19. Decisiones o preguntas abiertas

1. Campos y estructura: `DERIVAR 06`.
2. Categorías de datos y minimización: `DERIVAR 08`.
3. Presentación: `DERIVAR 10`.
4. Contratos: `DERIVAR 09`.
5. Vigencia técnica: `DERIVAR 06`.
6. No se fijan fórmulas o contenido prescriptivo.

#### 7.5.20. Criterio de cierre

El caso termina cuando evaluación y objetivo quedan relacionados, autorizados y trazables, o cuando una excepción impide el registro sin producir una base de planificación falsa.

---

### 7.6. UC-P10 — Diseñar plan nutricional

#### 7.6.1. Código

`UC-P10`

#### 7.6.2. Nombre

**Diseñar plan nutricional**

#### 7.6.3. Objetivo

Permitir que el profesional construya y retome un plan nutricional en borrador usando catálogo propio, carga manual e importación controlada, sin depender de Open Food Facts ni hacer visible el borrador como plan vigente.

#### 7.6.4. Alcance

- **Superficie:** profesional.
- **Inicio:** existe evaluación y objetivo utilizables.
- **Fin:** existe un borrador guardado y apto para validación posterior, o la operación se conserva incompleta sin activación.

#### 7.6.5. Actor principal

Profesional de Nutrición.

#### 7.6.6. Actores secundarios

- Administrador autorizado para catálogo propio.
- Open Food Facts como proveedor externo.
- Sistema BE.

#### 7.6.7. Disparador

El profesional inicia o continúa el diseño de un plan nutricional.

#### 7.6.8. Precondiciones

1. Se cumplen vínculo, consentimiento y autorización.
2. El profesional posee Nutrición verificada y habilitación aplicable.
3. Existe evaluación y objetivo relacionados.
4. BE dispone de catálogo propio y carga manual.
5. Open Food Facts es opcional para cada operación y no fuente única.
6. La estructura de plan y catálogo pertenece a `DERIVAR 06`.

#### 7.6.9. Postcondiciones de éxito

1. Existe un borrador identificable.
2. El borrador se relaciona con:
   - asesorado;
   - evaluación;
   - objetivo;
   - profesional;
   - fecha.
3. Puede guardarse y retomarse.
4. No se presenta al asesorado como plan vigente.
5. Cada elemento utilizado conserva procedencia suficiente.
6. Una importación externa identifica proveedor y fecha.
7. Datos externos insuficientes se corrigen o rechazan antes de incorporarse.
8. La indisponibilidad de Open Food Facts no bloquea el diseño.
9. Cambios posteriores del catálogo no reescriben planes activados.
10. El caso no fija contenido nutricional, fórmulas o valores.

#### 7.6.10. Garantías mínimas

- El borrador no es una versión activada.
- El catálogo propio continúa disponible durante una caída externa.
- La carga manual continúa disponible.
- La integración no incorpora datos automáticamente sin revisión.
- La procedencia no se pierde al incorporar un elemento.
- Un elemento rechazado no aparece como incorporado.
- Una caída externa no produce datos inventados.
- Guardar un borrador no ocupa una nueva vigencia.
- Un fallo no muestra el borrador como activado.
- La estructura concreta se deriva a 06.

#### 7.6.11. Flujo principal

1. El profesional accede al proceso autorizado.
2. BE ejecuta `UC-I02`.
3. El profesional inicia o abre un borrador.
4. BE relaciona el borrador con evaluación y objetivo.
5. El profesional utiliza elementos del catálogo propio o carga manual.
6. Cuando necesita un elemento externo, invoca `UC-I07`.
7. BE consulta Open Food Facts mediante el adaptador correspondiente.
8. BE presenta proveedor y datos disponibles para revisión.
9. El profesional valida, corrige o rechaza la incorporación.
10. Si acepta, BE incorpora el elemento al catálogo BE con proveedor y fecha.
11. El profesional continúa estructurando el borrador.
12. BE informa inconsistencias relevantes sin fijar contenido profesional.
13. El profesional guarda.
14. BE preserva fecha, autoría, procedencia y relación con la base mediante `UC-I03`.
15. El borrador queda disponible para `UC-P11`.
16. El asesorado no lo consulta como plan vigente.
17. El caso finaliza.

#### 7.6.12. Variantes

##### 7.6.12.1. V01 — Solo catálogo propio

El profesional no consulta Open Food Facts.

**Resultado:** diseña y guarda normalmente.

##### 7.6.12.2. V02 — Carga manual

El elemento requerido no existe.

**Resultado:** el profesional puede incorporarlo manualmente con procedencia propia identificable.

##### 7.6.12.3. V03 — Importación controlada

Open Food Facts responde y el dato es utilizable.

**Resultado:** el profesional revisa y decide antes de incorporarlo.

##### 7.6.12.4. V04 — Dato externo insuficiente

La respuesta externa no cumple los mínimos aplicables.

**Resultado:** se corrige manualmente o se rechaza; no se incorpora ciegamente.

##### 7.6.12.5. V05 — Open Food Facts indisponible

El proveedor falla o no responde.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia, registra el fallback y permite continuar con catálogo propio o carga manual.

##### 7.6.12.6. V06 — Retomar borrador

Existe un borrador previo.

**Resultado:** el profesional continúa sin crear una vigencia nueva ni alterar versiones activadas.

##### 7.6.12.7. V07 — Edición posterior a una activación

Existe una versión activa y el profesional necesita cambiar el plan.

**Resultado:** trabaja sobre un nuevo borrador o continuidad; la instantánea activada permanece intacta.

#### 7.6.13. Excepciones

##### 7.6.13.1. E01 — Falta de autorización

BE deniega sin exponer información protegida.

##### 7.6.13.2. E02 — Evaluación u objetivo no disponibles

Falta la base requerida.

**Resultado:** no se presenta el borrador como apto para activar.

##### 7.6.13.3. E03 — Procedencia externa perdida

BE no puede identificar proveedor o fecha.

**Resultado:** no incorpora el elemento como importado.

##### 7.6.13.4. E04 — Importación duplicada o contradictoria

Existe un elemento equivalente incompatible.

**Resultado:** BE evita un duplicado silencioso y solicita decisión profesional.

##### 7.6.13.5. E05 — Proveedor externo falla después de mostrar datos

BE no puede completar la importación.

**Resultado:** no declara incorporación exitosa y conserva el borrador.

##### 7.6.13.6. E06 — Falla de persistencia o auditoría

BE no confirma el guardado.

**Resultado:** no presenta una versión inexistente.

##### 7.6.13.7. E07 — Intento de alterar retrospectivamente un plan emitido

Un cambio de catálogo afectaría una versión activada.

**Resultado:** BE preserva la instantánea histórica y aplica el cambio solo hacia adelante.

#### 7.6.14. Reglas aplicables

1. BE mantiene catálogo propio.
2. La carga manual es fallback válido.
3. Open Food Facts es compromiso académico, no dependencia exclusiva.
4. Toda importación es controlada.
5. Toda importación conserva procedencia.
6. El profesional decide incorporar, corregir o rechazar.
7. Una caída externa no bloquea el núcleo.
8. Los cambios del catálogo no reescriben planes emitidos.
9. El borrador no es visible como vigente.
10. No se fija contenido nutricional o fórmulas.
11. El adaptador pertenece a `07`.
12. El contrato pertenece a `09`.

#### 7.6.15. Información utilizada o generada

##### 7.6.15.1. Utilizada

- evaluación;
- objetivo;
- catálogo propio;
- carga manual;
- respuesta externa;
- procedencia;
- antecedentes del borrador.

##### 7.6.15.2. Generada

- borrador;
- elementos incorporados;
- decisión de importación;
- proveedor;
- fecha;
- registro de fallback;
- autoría;
- evento de auditoría.

#### 7.6.16. Requisitos relacionados

##### 7.6.16.1. RF

- `RF-027 — Gestionar catálogo nutricional propio`
- `RF-028 — Importar alimentos desde Open Food Facts`
- `RF-030 — Crear y editar un plan nutricional en borrador`
- `RF-059 — Continuar el núcleo ante fallas de terceros`
- `RF-060 — Consultar la procedencia de datos externos`
- `RF-021 — Evaluar autorización contextual`

##### 7.6.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 7.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I07 — Importar elemento externo con revisión controlada`, cuando se usa el proveedor.
- `UC-I08 — Aplicar fallback manual y conservar procedencia`, ante contingencia.

#### 7.6.18. Puntos de auditoría

- profesional;
- asesorado;
- borrador;
- evaluación y objetivo relacionados;
- elemento;
- procedencia;
- proveedor y fecha;
- decisión de incorporar, corregir o rechazar;
- caída externa;
- fallback aplicado;
- intento de alterar una versión emitida;
- guardado y falla.

#### 7.6.19. Decisiones o preguntas abiertas

1. Estructura del catálogo y plan: `DERIVAR 06`.
2. Normalización: `DERIVAR 06`.
3. Licencia y gobierno de procedencia: `DERIVAR 08`.
4. Adaptador: `DERIVAR 07`.
5. Contrato: `DERIVAR 09`.
6. Editor: `DERIVAR 10`.
7. No se fijan categorías alimentarias o contenido nutricional.

#### 7.6.20. Criterio de cierre

El caso termina cuando existe un borrador guardado con procedencia preservada y continuidad operativa ante fallas externas, o cuando una excepción impide avanzar sin activar ni inventar datos.

---

### 7.7. UC-P11 — Validar y activar plan nutricional

#### 7.7.1. Código

`UC-P11`

#### 7.7.2. Nombre

**Validar y activar plan nutricional**

#### 7.7.3. Objetivo

Permitir que el profesional valide y active una versión reproducible del plan nutricional, preservando una instantánea consultable e inmutable hacia atrás y aplicando autorización y capacidad sin interrumpir procesos vigentes.

#### 7.7.4. Alcance

- **Superficie:** profesional.
- **Inicio:** existe un borrador asociado a evaluación y objetivo.
- **Fin:** una versión queda activada y consultable, o la activación se rechaza sin alterar la vigencia existente.

#### 7.7.5. Actor principal

Profesional de Nutrición.

#### 7.7.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 7.7.7. Disparador

El profesional considera que el borrador está listo para emitirse.

#### 7.7.8. Precondiciones

1. El profesional posee Nutrición verificada.
2. Existe habilitación aplicable.
3. Vínculo y consentimiento están vigentes.
4. `UC-I02` autoriza la activación.
5. Existe borrador identificable.
6. Existen evaluación y objetivo relacionados.
7. `UC-I10` puede evaluar capacidad configurada.
8. La estructura de validación y snapshot pertenece a `DERIVAR 06`.

#### 7.7.9. Postcondiciones de éxito

1. El borrador supera la validación aplicable.
2. Existe una versión activada identificable.
3. Se preserva una instantánea reproducible de lo emitido.
4. El asesorado consulta exactamente esa versión.
5. La versión activada no cambia por ediciones posteriores.
6. Una modificación posterior genera un nuevo borrador o continuidad trazable.
7. No existen vigencias contradictorias.
8. La activación registra autor, fecha y relación con evaluación y objetivo.
9. La capacidad se consume solo conforme al modelo aprobado.
10. Los procesos vigentes no se interrumpen por alcanzar el límite de capacidad.
11. El evento queda trazable.

#### 7.7.10. Garantías mínimas

- Un plan inválido no se activa.
- Un borrador no se muestra como activo.
- La instantánea reproducible no se reconstruye usando el catálogo actual.
- Editar después no altera el histórico emitido.
- No se activan dos versiones contradictorias.
- Si un proceso nuevo excede la capacidad configurada, se rechaza la activación.
- Rechazar por capacidad no finaliza ni interrumpe procesos vigentes.
- La ausencia de una regla de capacidad configurada no se resuelve silenciosamente en 05; se deriva a 06.
- Una falla no muestra activación exitosa.
- Activar no constituye revisión profesional válida.
- El asesorado no necesita conocer rutas internas para consultar.

#### 7.7.11. Flujo principal

1. El profesional abre el borrador.
2. BE ejecuta `UC-I02`.
3. BE verifica evaluación, objetivo y relaciones necesarias.
4. El profesional solicita validar.
5. BE ejecuta `UC-I04`.
6. BE informa inconsistencias relevantes.
7. El profesional corrige si corresponde y vuelve a validar.
8. La validación resulta favorable.
9. BE ejecuta `UC-I10`.
10. Si la activación inicia un proceso nuevo, BE verifica que no exceda la capacidad configurada.
11. El profesional confirma la activación.
12. BE verifica que el borrador no haya cambiado de forma concurrente.
13. BE identifica la versión emitida.
14. BE preserva la instantánea reproducible.
15. BE establece esa versión como vigente sin mantener una vigencia contradictoria.
16. BE registra autor, fecha, evaluación, objetivo y resultado mediante `UC-I03`.
17. BE habilita su consulta desde `UC-P12`.
18. El caso finaliza.

#### 7.7.12. Variantes

##### 7.7.12.1. V01 — Primera activación

No existe plan activo.

**Resultado:** se crea la primera versión vigente.

##### 7.7.12.2. V02 — Sustitución trazable posterior

Existe una versión activa y un nuevo borrador validado.

**Resultado:** la nueva activación conserva la versión anterior y establece continuidad sin reescribirla.

##### 7.7.12.3. V03 — Capacidad alcanzada con proceso vigente

El profesional ya alcanzó la banda, pero revisa o continúa procesos existentes.

**Resultado:** BE no interrumpe procesos vigentes; solo rechaza la activación de un proceso nuevo que exceda la capacidad configurada.

##### 7.7.12.4. V04 — Borrador corregido después de validación fallida

El profesional corrige inconsistencias.

**Resultado:** vuelve a validar sin crear una versión activa prematura.

##### 7.7.12.5. V05 — Activación después de importar elementos

El borrador utiliza datos importados.

**Resultado:** la instantánea conserva lo emitido y su procedencia, aunque el catálogo cambie después.

#### 7.7.13. Excepciones

##### 7.7.13.1. E01 — Plan inválido

La validación detecta inconsistencias.

**Resultado:** no se activa y se informan condiciones corregibles sin fijar contenido nutricional.

##### 7.7.13.2. E02 — Autorización desfavorable

Falla vínculo, consentimiento, especialidad, finalidad o alcance.

**Resultado:** no se activa.

##### 7.7.13.3. E03 — Capacidad configurada excedida

La activación abriría un proceso nuevo por encima de la banda.

**Resultado:** BE rechaza la nueva activación y conserva todos los procesos vigentes.

##### 7.7.13.4. E04 — Vigencia contradictoria

La operación produciría dos versiones vigentes incompatibles.

**Resultado:** BE no activa hasta resolver la transición según `06`.

##### 7.7.13.5. E05 — Borrador modificado concurrentemente

La versión validada no coincide con la confirmada.

**Resultado:** BE exige revisar y validar nuevamente.

##### 7.7.13.6. E06 — Falla al preservar la instantánea

BE no puede reconstruir exactamente lo que quedaría emitido.

**Resultado:** no activa.

##### 7.7.13.7. E07 — Falla de persistencia o auditoría

BE no confirma la operación completa.

**Resultado:** no muestra una versión activa parcial.

##### 7.7.13.8. E08 — Intento de editar la versión activada

El profesional intenta cambiar directamente el histórico.

**Resultado:** BE exige un nuevo borrador o continuidad trazable.

#### 7.7.14. Reglas aplicables

1. Activación requiere validación favorable.
2. La versión activada es reproducible.
3. La instantánea histórica es inmutable hacia atrás.
4. Las ediciones posteriores producen nueva continuidad.
5. Solo existe una vigencia coherente.
6. La capacidad se controla al iniciar procesos nuevos.
7. Procesos vigentes continúan al alcanzar el límite.
8. La autorización se evalúa al activar.
9. La estructura del snapshot pertenece a `06`.
10. La activación no es revisión profesional válida.
11. El contenido nutricional no se fija en 05.

#### 7.7.15. Información utilizada o generada

##### 7.7.15.1. Utilizada

- borrador;
- evaluación;
- objetivo;
- procedencia;
- autorización;
- habilitación;
- capacidad configurada;
- versión activa previa.

##### 7.7.15.2. Generada

- resultado de validación;
- versión activada;
- instantánea reproducible;
- fecha;
- autor;
- continuidad con versión anterior;
- evento de capacidad;
- auditoría.

#### 7.7.16. Requisitos relacionados

##### 7.7.16.1. RF

- `RF-031 — Validar, versionar y activar un plan nutricional`
- `RF-066 — Representar habilitaciones y capacidad sin cobro real`
- `RF-021 — Evaluar autorización contextual`
- `RF-027` y `RF-060`, por preservación de procedencia.

##### 7.7.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 7.7.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I04 — Validar y versionar un plan`
- `UC-I10 — Verificar habilitación y capacidad`

#### 7.7.18. Puntos de auditoría

- profesional;
- asesorado;
- borrador;
- validación;
- inconsistencias;
- capacidad evaluada;
- resultado de capacidad;
- versión previa;
- versión activada;
- instantánea;
- fecha;
- autorización;
- concurrencia;
- falla o rechazo.

#### 7.7.19. Decisiones o preguntas abiertas

1. Invariantes de validación: `DERIVAR 06`.
2. Estados y transiciones: `DERIVAR 06`.
3. Estructura de instantánea: `DERIVAR 06`.
4. Comportamiento sin banda configurada: `DERIVAR 06`.
5. Autorización: `DERIVAR 08`.
6. Contratos: `DERIVAR 09`.
7. Confirmación y presentación: `DERIVAR 10`.
8. Concurrencia: `DERIVAR 11A`.

#### 7.7.20. Criterio de cierre

El caso termina cuando una versión válida, reproducible y coherente queda activada, o cuando la operación se rechaza sin modificar la vigencia ni interrumpir procesos existentes.

---

### 7.8. UC-P12 — Consultar y registrar ejecución nutricional en APK

#### 7.8.1. Código

`UC-P12`

#### 7.8.2. Nombre

**Consultar y registrar ejecución nutricional en APK**

#### 7.8.3. Objetivo

Permitir que el asesorado consulte desde la APK qué corresponde realizar según la versión nutricional activa y registre evidencia simple de adherencia o ejecución asociada a esa versión.

#### 7.8.4. Alcance

- **Superficie:** APK del asesorado.
- **Inicio:** el asesorado accede a Hoy o a la función prevista.
- **Fin:** consulta la versión vigente y, cuando corresponde, registra evidencia sin duplicados observables.

#### 7.8.5. Actor principal

Asesorado.

#### 7.8.6. Actores secundarios

- Profesional de Nutrición autorizado.
- Sistema BE.

#### 7.8.7. Disparador

El asesorado necesita consultar o registrar lo realizado.

#### 7.8.8. Precondiciones

1. El asesorado posee sesión válida.
2. La operación se alcanza desde la navegación prevista.
3. `UC-I02` autoriza la consulta o escritura.
4. Para consultar contenido existe una versión activada o un estado claro de ausencia.
5. Para registrar evidencia existe una referencia válida al plan y al asesorado.

#### 7.8.9. Postcondiciones de éxito

##### 7.8.9.1. Consulta

1. El asesorado ve exactamente la versión activada.
2. Puede reconocer qué versión está vigente.
3. Si no existe plan activo, recibe un estado claro.
4. No ve borradores ni información administrativa.
5. No necesita conocer rutas internas.

##### 7.8.9.2. Registro

1. La evidencia queda asociada a:
   - asesorado;
   - versión activada;
   - fecha;
   - autor;
   - observación opcional, cuando corresponda.
2. Un reintento equivalente no produce hechos duplicados observables.
3. El profesional autorizado puede consultar posteriormente la evidencia.
4. El registro no se presenta como revisión o decisión.
5. El evento queda trazable.

#### 7.8.10. Garantías mínimas

- La APK no muestra un borrador como vigente.
- La consulta reproduce la instantánea activada.
- Un cambio posterior no modifica lo que el asesorado ejecutó.
- No se fija un score de adherencia en 05.
- No se infiere resultado corporal.
- Registrar evidencia no modifica el plan.
- Un reintento no duplica el hecho observable.
- La interfaz no concede autorización.
- Un consentimiento revocado deniega operaciones futuras.
- Un fallo no muestra el registro como exitoso.

#### 7.8.11. Flujo principal — Consulta

1. El asesorado inicia sesión en la APK.
2. Accede a Hoy desde la navegación prevista.
3. BE ejecuta `UC-I02`.
4. BE identifica la versión nutricional activa.
5. BE presenta exactamente la instantánea reproducible vigente.
6. BE evita mostrar borradores o información administrativa.
7. El asesorado consulta qué corresponde realizar.
8. El caso puede finalizar sin registrar evidencia.

#### 7.8.12. Flujo principal — Registro

1. Después de consultar, el asesorado selecciona registrar lo realizado.
2. BE identifica asesorado, versión y fecha aplicable.
3. El asesorado registra evidencia simple y, opcionalmente, una observación.
4. BE solicita confirmación cuando corresponda.
5. BE verifica autorización y que la versión siga siendo la referencia correcta.
6. BE verifica que el reintento no cree un duplicado observable.
7. BE registra mediante `UC-I03`.
8. BE confirma el resultado.
9. La evidencia queda disponible para el análisis de `UC-P13`.
10. El caso finaliza.

#### 7.8.13. Variantes

##### 7.8.13.1. V01 — Consulta sin plan activo

No existe versión vigente.

**Resultado:** BE muestra un estado claro y no inventa contenido.

##### 7.8.13.2. V02 — Consulta después de sustitución

Existe una versión nueva activada.

**Resultado:** BE muestra la nueva versión; la ejecución anterior permanece asociada a la versión anterior.

##### 7.8.13.3. V03 — Registro con observación

El asesorado agrega una observación opcional.

**Resultado:** queda asociada al mismo hecho y versión.

##### 7.8.13.4. V04 — Reintento después de pérdida de conectividad

El asesorado repite una acción cuyo resultado no pudo confirmar.

**Resultado:** BE evita un duplicado observable y devuelve el resultado vigente.

##### 7.8.13.5. V05 — Solo consulta

El asesorado no registra evidencia.

**Resultado:** no se crea un hecho de ejecución por abrir la pantalla.

#### 7.8.14. Excepciones

##### 7.8.14.1. E01 — Autorización desfavorable

BE deniega consulta o registro sin filtrar contenido.

##### 7.8.14.2. E02 — Versión activa no reproducible

BE no puede presentar exactamente lo emitido.

**Resultado:** no reconstruye usando datos actuales; informa una incidencia segura.

##### 7.8.14.3. E03 — Referencia de plan obsoleta

El asesorado intenta registrar contra una versión que ya no corresponde.

**Resultado:** BE no reasigna silenciosamente el registro y solicita actualizar el contexto.

##### 7.8.14.4. E04 — Reintento duplicado

Existe evidencia equivalente.

**Resultado:** BE devuelve el resultado existente sin crear otro hecho.

##### 7.8.14.5. E05 — Falla de persistencia o auditoría

BE no confirma el registro.

**Resultado:** no muestra éxito.

##### 7.8.14.6. E06 — Consentimiento revocado

El vínculo continúa, pero el consentimiento ya no está vigente.

**Resultado:** `UC-I02` deniega la operación futura.

##### 7.8.14.7. E07 — Acceso a información administrativa

La respuesta intentaría exponer datos no destinados al asesorado.

**Resultado:** BE limita la información a la superficie autorizada.

#### 7.8.15. Reglas aplicables

1. La APK muestra la versión activada.
2. La pantalla Hoy es accesible sin rutas internas.
3. No se muestran borradores.
4. La ausencia de plan tiene un estado claro.
5. La evidencia se asocia a plan, versión y asesorado.
6. El reintento no produce duplicados observables.
7. El profesional autorizado puede consultar la evidencia.
8. Abrir la pantalla no registra ejecución.
9. Registrar ejecución no constituye revisión profesional.
10. No se fija fórmula de adherencia.
11. La idempotencia técnica pertenece a `09/11A`.
12. El diseño de Hoy pertenece a `10`.

#### 7.8.16. Información utilizada o generada

##### 7.8.16.1. Utilizada

- identidad del asesorado;
- vínculo;
- consentimiento;
- autorización;
- versión activada;
- instantánea reproducible;
- fecha;
- antecedente de reintento.

##### 7.8.16.2. Generada

- consulta de versión;
- evidencia de adherencia o ejecución;
- observación opcional;
- relación con plan y versión;
- fecha;
- autor;
- resultado de idempotencia;
- evento de auditoría.

#### 7.8.17. Requisitos relacionados

##### 7.8.17.1. RF

- `RF-032 — Consultar el plan nutricional del día en la APK`
- `RF-033 — Registrar adherencia o ejecución nutricional`
- `RF-021 — Evaluar autorización contextual`
- `RF-031 — Consultar exactamente la versión activada`
- `RF-007 — Acceder por la superficie prevista`

##### 7.8.17.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-002`
- `RNF-MAN-004`

#### 7.8.18. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

#### 7.8.19. Casos relacionados

- `UC-P11 — Validar y activar plan nutricional`
- `UC-P13 — Revisar evidencia y decidir continuidad nutricional`

#### 7.8.20. Puntos de auditoría

- asesorado;
- versión presentada;
- ausencia de plan;
- autorización;
- registro;
- fecha;
- observación;
- reintento;
- duplicado evitado;
- revocación;
- falla;
- disponibilidad posterior para revisión.

#### 7.8.21. Decisiones o preguntas abiertas

1. Read model y contrato: `DERIVAR 09`.
2. Diseño de Hoy: `DERIVAR 10`.
3. Dato y unicidad: `DERIVAR 06`.
4. Concurrencia e idempotencia: `DERIVAR 11A`.
5. Auditoría de consultas: `DERIVAR 08`.
6. No se fija score o fórmula de adherencia.

#### 7.8.22. Criterio de cierre

El caso termina cuando el asesorado consulta la versión correcta y, si decide registrar, la evidencia queda asociada sin duplicados observables, o cuando una excepción bloquea la operación sin mostrar contenido o éxito falsos.

---

### 7.9. Historias de usuario prioritarias

#### 7.9.1. HU-07 — Emitir un plan reproducible

**Como** profesional de Nutrición  
**quiero** evaluar, definir un objetivo, diseñar un borrador y activar una versión reproducible  
**para** que el asesorado consulte exactamente lo que indiqué y los cambios posteriores no reescriban la historia.

##### 7.9.1.1. Criterios de aceptación

###### 7.9.1.1.1. Escenario 1 — Borrador no visible

**Dado** que estoy diseñando un plan  
**cuando** guardo el borrador  
**entonces** puedo retomarlo  
**y** el asesorado no lo ve como vigente.

###### 7.9.1.1.2. Escenario 2 — Activación con instantánea

**Dado** que el borrador es válido  
**cuando** confirmo la activación  
**entonces** BE conserva una instantánea reproducible  
**y** el asesorado consulta exactamente esa versión  
**y** una edición posterior no modifica lo emitido.

###### 7.9.1.1.3. Escenario 3 — Capacidad excedida

**Dado** que la activación abriría un proceso nuevo por encima de la capacidad configurada  
**cuando** intento activar  
**entonces** BE rechaza el proceso nuevo  
**y** no interrumpe procesos vigentes.

###### 7.9.1.1.4. Escenario 4 — Open Food Facts no disponible

**Dado** que el proveedor externo no responde  
**cuando** continúo diseñando  
**entonces** BE informa la contingencia  
**y** permite catálogo propio o carga manual  
**y** registra el fallback  
**y** no inventa datos.

---

#### 7.9.2. HU-08 — Consultar y registrar lo realizado

**Como** asesorado  
**quiero** consultar desde Hoy la versión nutricional vigente y registrar evidencia simple de lo realizado  
**para** saber qué corresponde hacer y aportar contexto para la próxima revisión profesional.

##### 7.9.2.1. Criterios de aceptación

###### 7.9.2.1.1. Escenario 1 — Consulta vigente

**Dado** que existe una versión activa  
**cuando** accedo a Hoy  
**entonces** veo exactamente esa versión  
**y** no veo borradores ni datos administrativos.

###### 7.9.2.1.2. Escenario 2 — Sin plan activo

**Dado** que no existe una versión activa  
**cuando** accedo a Hoy  
**entonces** BE muestra un estado claro  
**y** no inventa contenido.

###### 7.9.2.1.3. Escenario 3 — Registro asociado

**Dado** que consulté la versión vigente  
**cuando** registro evidencia  
**entonces** queda asociada a mi identidad, fecha y versión  
**y** puede consultarla el profesional autorizado.

###### 7.9.2.1.4. Escenario 4 — Reintento

**Dado** que repito un registro por una confirmación incierta  
**cuando** BE procesa el reintento  
**entonces** no crea un hecho duplicado observable.

---

### 7.10. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Evaluación nutricional | Parcialmente existente | `PRESERVAR + REFACTORIZAR` | Conservar datos útiles y alinear autoría, fuente, contexto y autorización. |
| Objetivo nutricional persistente | Cálculo parcial sin persistencia o propagación suficiente | `REFACTORIZAR / NO EVIDENCIADO` | Registrar objetivo vigente relacionado con evaluación. |
| Catálogo propio | Existe parcialmente | `PRESERVAR + REFACTORIZAR` | Mantener fuente propia, procedencia y carga manual. |
| Open Food Facts E2E | No demostrado | `NO EVIDENCIADO` | Implementar importación controlada, procedencia y fallback. |
| Borrador nutricional | Parcial avanzado | `PRESERVAR + REFACTORIZAR` | Conservar lo conforme y separar borrador de vigencia. |
| Snapshot de activación | Evidencia parcial avanzada | `PRESERVAR + REFACTORIZAR` | Garantizar instantánea reproducible y continuidad posterior. |
| Consulta Hoy | Existe, pero sin navegación entrante suficiente | `REFACTORIZAR` | Acceso desde APK sin conocer rutas internas. |
| Registro de adherencia | Existe parcialmente | `PRESERVAR + REFACTORIZAR` | Asociar a versión y hacer visible al profesional autorizado. |
| Revisión y continuidad | No cierran el circuito AS-IS | `NO EVIDENCIADO / REEMPLAZAR` | Desarrollar en Bloque 05 mediante UC-P13. |

---

### 7.11. Revisión crítica consolidada

#### 7.11.1. Controles superados

1. El bloque declara que no cierra el circuito sin UC-P13.
2. RF-034, RF-035 y RF-056 quedan asignados explícitamente al Bloque 05.
3. No se fijan calorías, macros, porciones, fórmulas o categorías.
4. Activar preserva una instantánea reproducible.
5. Editar después no altera lo emitido.
6. La capacidad usa la formulación aprobada: rechazar proceso nuevo sin interrumpir vigentes.
7. Open Food Facts conserva procedencia y fallback.
8. La caída externa no bloquea el núcleo.
9. Toda operación protegida invoca UC-I02.
10. La APK muestra exactamente la versión activada.
11. El reintento no produce duplicados observables.
12. El glosario fue ampliado antes de propagar términos.
13. La jerarquía cumple H1/H2/H3/H4/H5.

#### 7.11.2. Autoverificación exigida

| Control | Resultado |
|---|---|
| Ningún caso fija contenido nutricional o fórmulas | `CUMPLE` |
| Activación preserva versión consultable e instantánea | `CUMPLE` |
| Capacidad usa la formulación aprobada | `CUMPLE` |
| Procedencia se conserva en importaciones | `CUMPLE` |
| Fallback es conducta observable | `CUMPLE` |
| Toda operación protegida invoca UC-I02 | `CUMPLE` |
| Glosario controlado aplicado | `CUMPLE` |
| Jerarquía normalizada | `CUMPLE` |
| Límite con Bloque 05 declarado | `CUMPLE` |

#### 7.11.3. Riesgos abiertos

##### 7.11.3.1. R-05-NUT-01 — Circuito declarado cerrado prematuramente

**Control:** el cierre requiere UC-P13 y se declara explícitamente.

##### 7.11.3.2. R-05-NUT-02 — Snapshot reconstruido desde datos actuales

**Control:** la activación exige instantánea reproducible preservada.

##### 7.11.3.3. R-05-NUT-03 — Contenido nutricional congelado en 05

**Control:** se prohíben fórmulas, valores y categorías; se deriva a 06 y al criterio profesional.

##### 7.11.3.4. R-05-NUT-04 — Open Food Facts como dependencia crítica

**Control:** catálogo propio y carga manual son obligatorios.

##### 7.11.3.5. R-05-NUT-05 — Procedencia perdida

**Control:** proveedor, fecha y decisión de incorporación son auditables.

##### 7.11.3.6. R-05-NUT-06 — Capacidad que interrumpe procesos vigentes

**Control:** solo se rechaza un proceso nuevo excedido.

##### 7.11.3.7. R-05-NUT-07 — Adherencia convertida en score

**Control:** solo se registra evidencia simple; no se fija fórmula.

##### 7.11.3.8. R-05-NUT-08 — Registro duplicado por reintento

**Control:** conducta observable de no duplicación; mecanismo a 09/11A.

#### 7.11.4. Veredicto

```text
BLOQUE 04 — CIRCUITO NUTRICIONAL HASTA EJECUCIÓN:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS:
UC-P09, UC-P10, UC-P11, UC-P12

RF PRINCIPALES:
RF-026, RF-027, RF-028, RF-029,
RF-030, RF-031, RF-032, RF-033

RF TRANSVERSALES:
RF-021, RF-059, RF-060, RF-066

CIRCUITO CERRADO:
NO — REQUIERE BLOQUE 05 / UC-P13

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

CONTENIDO NUTRICIONAL FIJADO:
0

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 7.12. Decisiones del bloque

#### 7.12.1. Aprobadas y aplicadas

- Nutrición como primera vertical demostrable;
- evaluación y objetivo como base;
- catálogo propio;
- Open Food Facts con importación controlada;
- fallback manual;
- borrador separado de vigencia;
- activación con instantánea reproducible;
- capacidad sin interrupción de procesos vigentes;
- consulta en APK;
- evidencia asociada a versión;
- autorización en toda operación;
- preservación de procedencia e historia.

#### 7.12.2. Provisionales

- códigos `UC-P09` a `UC-P12`;
- semántica de objetivo vigente, borrador y versión activada;
- contenido mínimo de la evaluación;
- validaciones concretas del plan;
- conducta exacta cuando no existe banda configurada.

#### 7.12.3. Pendientes derivados

- dominio e invariantes: `06`;
- autorización y procedencia: `08`;
- adaptador externo: `07`;
- contratos e idempotencia: `09`;
- Website y Hoy: `10`;
- concurrencia y E2E: `11A`;
- trazabilidad canónica: `12`;
- revisión y continuidad: Bloque 05.

---

### 7.13. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. la cadena hasta ejecución queda completa;
2. el circuito todavía no se declara cerrado;
3. evaluación y objetivo no fijan contenido nutricional;
4. el borrador no es visible como vigente;
5. activación preserva instantánea reproducible;
6. capacidad no interrumpe procesos vigentes;
7. Open Food Facts posee procedencia y fallback;
8. la APK consulta exactamente la versión activada;
9. el registro evita duplicados observables;
10. Bloque 05 es obligatorio para revisión, decisión y continuidad.

---

### 7.14. Estado

```text
ARQUITECTURA:
v0.2.4

GLOSARIO:
v0.1.3

BLOQUE 01:
v0.3.4 — JERARQUÍA NORMALIZADA

BLOQUE 02:
v0.4.3 — JERARQUÍA NORMALIZADA

BLOQUE 03:
v0.5.1 — JERARQUÍA NORMALIZADA

BLOQUE 04:
REDACTADO EN v0.6
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P09, UC-P10, UC-P11, UC-P12

HISTORIAS:
HU-07, HU-08

GIT:
SIN CAMBIOS
```

#### 7.14.1. Siguiente acción recomendada

Revisar el Bloque 04 y después redactar:

```text
BLOQUE 05 — REVISIÓN PROFESIONAL Y CONTINUIDAD

UC-P13 — Revisar evidencia y decidir continuidad nutricional
UC-I05 — Registrar revisión profesional válida
UC-I06 — Aplicar continuidad o cierre
```

---

## 8. Bloque 05 — Revisión y continuidad nutricional

*Fuente ensamblada: `BE_LEG_05_v0.7_BLOQUE_05_REVISION_Y_CONTINUIDAD_NUTRICIONAL.md`.*

### 8.1. Propósito del bloque

Este bloque completa el primer circuito nutricional demostrable de BE.

La cadena queda:

```text
evaluación
→ objetivo
→ borrador
→ activación con instantánea reproducible
→ consulta en APK
→ adherencia o ejecución registrada
→ revisión profesional válida
→ resultado semántico
→ próxima acción o cierre
→ continuidad trazable
```

El Bloque 04 cubrió hasta la ejecución. Este bloque cubre:

- selección de un período o ciclo revisable;
- evidencia vinculada;
- interpretación profesional breve y no diagnóstica;
- resultado semántico de revisión;
- fundamento;
- próxima acción o cierre;
- autoría y fecha;
- mantenimiento, ajuste, sustitución, reprogramación, cambio de objetivo o finalización;
- preservación de versiones;
- actualización de timeline y pendientes;
- producción del evento observable necesario para un ciclo cerrado trazable.

No cubre:

- fórmula de TVCC-30;
- definición fina de vínculo elegible;
- ventana temporal de la métrica;
- estados o transiciones técnicas;
- estructura persistente;
- formulario;
- longitud mínima de textos;
- reglas de corrección;
- inferencia diagnóstica;
- automatización de decisiones.

Estos puntos pertenecen a `06`, `08`, `09`, `10`, `11A` y `12`.

---

### 8.2. Decisiones funcionales aplicadas

#### 8.2.1. Definición vinculante de DEC-043

Una revisión es válida cuando un profesional autorizado registra como mínimo:

1. dominio y período revisado;
2. evidencia relevante examinada;
3. interpretación profesional breve, no diagnóstica;
4. resultado de la revisión;
5. fundamento;
6. próxima acción o cierre;
7. autoría y fecha verificables.

Esta definición se reutiliza sin reformulación.

#### 8.2.2. Resultados semánticos permitidos

```text
MANTENER
AJUSTAR
SUSTITUIR
REPROGRAMAR_REVISION
CAMBIAR_OBJETIVO
FINALIZAR
```

No se admite una taxonomía paralela de Nutrición.

La correspondencia con las acciones válidas ya resueltas en el Documento 04 se conserva:

| Acción observable del circuito | Resultado semántico común |
|---|---|
| mantener estrategia | `MANTENER` |
| ajustar planificación | `AJUSTAR` |
| sustituir planificación | `SUSTITUIR` |
| iniciar un nuevo bloque o período | `AJUSTAR` o `SUSTITUIR`, según conserve o genere una nueva versión |
| reprogramar | `REPROGRAMAR_REVISION` |
| cambiar objetivo | `CAMBIAR_OBJETIVO` |
| programar una revisión | `REPROGRAMAR_REVISION` |
| finalizar | `FINALIZAR` |

La taxonomía técnica y el efecto exacto sobre estados pertenecen a `DERIVAR 06`.

#### 8.2.3. Acciones que no constituyen revisión profesional válida

No cuentan como revisión:

- abrir el dashboard;
- visualizar información;
- guardar una nota libre aislada;
- modificar silenciosamente un plan.

Estas acciones pueden existir como eventos separados, pero no cierran el ciclo ni alimentan por sí mismas TVCC-30.

#### 8.2.4. Relación con RF-058

```text
UC-P13
→ produce revisión válida
→ produce próxima acción o cierre
→ deja observable un ciclo cerrado trazable

UC-S01
→ consume los eventos
→ calcula TVCC-30
```

UC-P13 no fija ni calcula:

- fórmula;
- numerador;
- denominador;
- elegibilidad;
- ventana;
- exclusiones;
- versionado analítico.

Eso pertenece a `06/12` y al caso `UC-S01`.

---

### 8.3. Actores

| Actor | Responsabilidad |
|---|---|
| **Profesional de Nutrición** | Examina evidencia autorizada, registra interpretación, selecciona un resultado semántico y determina próxima acción o cierre. |
| **Asesorado** | Aporta evidencia y consulta los resultados que la política permita; no registra la revisión profesional. |
| **Sistema BE** | Evalúa autorización, preserva evidencia y versiones, valida la completitud observable, aplica continuidad o cierre y registra auditoría. |

---

### 8.4. Relaciones internas

```text
UC-P13 — Revisar evidencia y decidir continuidad nutricional
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  incluye → UC-I05 — Registrar revisión profesional válida
  incluye → UC-I06 — Aplicar continuidad o cierre
  produce evidencia para → UC-S01 — Obtener TVCC-30 de manera reproducible
  continúa desde → UC-P12 — Consultar y registrar ejecución nutricional en APK
```

---

### 8.5. Frontera de responsabilidad

| Tema | Propietario |
|---|---|
| Momento funcional en que se revisa y alternativas observables | Documento 05 |
| Entidades, estados, transiciones y relaciones entre versiones | Documento 06 |
| Acceso, privacidad, visibilidad, corrección y retención | Documento 08 |
| Contratos, concurrencia e idempotencia | Documento 09 |
| Formulario y reducción de fricción | Documento 10 |
| Escenarios negativos, contenido mínimo y E2E | Documento 11A |
| Fórmula, elegibilidad y trazabilidad completa de TVCC-30 | Documento 12, con soporte de 06 |

---

### 8.6. UC-P13 — Revisar evidencia y decidir continuidad nutricional

#### 8.6.1. Código

`UC-P13`

#### 8.6.2. Nombre

**Revisar evidencia y decidir continuidad nutricional**

#### 8.6.3. Objetivo

Permitir que un profesional de Nutrición cierre un período o ciclo revisable mediante una revisión profesional válida vinculada a evidencia y determine una próxima acción o cierre sin editar silenciosamente la historia.

#### 8.6.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe evidencia nutricional disponible para un período o ciclo identificable.
- **Fin:** existe una revisión profesional válida y una continuidad o cierre trazable, o una excepción impide registrar la revisión sin producir un cierre falso.

#### 8.6.5. Actor principal

Profesional de Nutrición.

#### 8.6.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 8.6.7. Disparador

El profesional consulta una revisión pendiente o decide revisar un período nutricional con evidencia disponible.

#### 8.6.8. Precondiciones

1. El profesional posee Nutrición `VERIFICADA` y habilitación aplicable.
2. Existe vínculo aceptado y consentimiento vigente para el alcance y finalidad.
3. `UC-I02` autoriza la operación.
4. Existe un plan activo o un ciclo nutricional revisable.
5. El dominio y período pueden identificarse.
6. Existe evidencia relevante y accesible.
7. La evidencia conserva relación con asesorado, fecha, autor y versión del plan.
8. La revisión no se presume por el solo acceso a la información.

#### 8.6.9. Postcondiciones de éxito

1. Existe una revisión profesional válida conforme a `DEC-043`.
2. La revisión identifica:
   - dominio;
   - período o ciclo;
   - evidencia examinada;
   - interpretación no diagnóstica;
   - resultado semántico;
   - fundamento;
   - próxima acción o cierre;
   - autoría;
   - fecha.
3. La evidencia queda vinculada de forma reconstruible.
4. El resultado utiliza uno de los seis valores semánticos permitidos.
5. `UC-I06` aplica una continuidad o cierre coherente con el resultado.
6. Ninguna versión histórica se modifica silenciosamente.
7. La revisión aparece en la línea temporal autorizada.
8. La revisión pendiente correspondiente deja de presentarse como pendiente.
9. La próxima acción queda visible para los actores autorizados.
10. El evento puede ser consumido por `UC-S01`.
11. No se calcula TVCC-30 dentro de este caso.

#### 8.6.10. Garantías mínimas

- Sin evidencia identificable no existe revisión válida.
- Sin interpretación profesional no existe revisión válida.
- Sin resultado semántico no existe revisión válida.
- Sin fundamento no existe revisión válida.
- Sin próxima acción o cierre no existe revisión válida.
- Autoría y fecha deben ser verificables.
- La interpretación no emite diagnóstico.
- Abrir el dashboard no constituye revisión.
- Visualizar información no constituye revisión.
- Guardar una nota libre aislada no constituye revisión.
- Modificar silenciosamente un plan no constituye revisión.
- Una recomendación automática no sustituye la decisión profesional.
- El profesional no puede modificar otro dominio.
- Un fallo no debe marcar el ciclo como cerrado.
- La continuidad preserva versiones y evidencia.
- Un ciclo cerrado trazable no equivale a adherencia, retención o resultado corporal.

#### 8.6.11. Flujo principal

1. El profesional accede a sus ciclos nutricionales pendientes de revisión.
2. BE presenta el motivo por el que el ciclo requiere revisión sin utilizar lenguaje clínico.
3. El profesional selecciona un asesorado y un período o ciclo.
4. BE ejecuta `UC-I02`.
5. BE presenta únicamente evidencia autorizada, identificando:
   - fecha;
   - autor;
   - procedencia;
   - versión del plan;
   - período.
6. El profesional selecciona la evidencia relevante que examinó.
7. BE mantiene el vínculo explícito entre revisión y evidencia seleccionada.
8. El profesional registra una interpretación breve y no diagnóstica.
9. El profesional selecciona un resultado semántico:
   - `MANTENER`;
   - `AJUSTAR`;
   - `SUSTITUIR`;
   - `REPROGRAMAR_REVISION`;
   - `CAMBIAR_OBJETIVO`;
   - `FINALIZAR`.
10. El profesional registra el fundamento.
11. El profesional define la próxima acción o confirma el cierre.
12. BE presenta un resumen de:
   - período;
   - evidencia;
   - resultado;
   - fundamento;
   - próxima acción o cierre.
13. El profesional confirma.
14. BE verifica que la evidencia, el contexto y la versión no hayan cambiado de forma incompatible.
15. BE ejecuta `UC-I05`.
16. BE ejecuta `UC-I06`.
17. BE registra autoría, fecha, referencias y resultado mediante `UC-I03`.
18. BE actualiza timeline y revisiones pendientes.
19. BE deja disponible el evento para `UC-S01`.
20. El caso finaliza.

#### 8.6.12. Variantes

##### 8.6.12.1. V01 — Mantener la estrategia vigente

El profesional selecciona `MANTENER`.

**Resultado:** se conserva la estrategia vigente y se registra una próxima revisión u otra acción válida, sin crear una edición silenciosa.

##### 8.6.12.2. V02 — Ajustar planificación

El profesional selecciona `AJUSTAR`.

**Resultado:** la continuidad identifica qué acción de ajuste debe realizarse. Si el ajuste exige nueva versión, la gestión de versiones aplica el patrón aprobado; la transición técnica pertenece a `06`.

##### 8.6.12.3. V03 — Sustituir planificación

El profesional selecciona `SUSTITUIR`.

**Resultado:** la planificación anterior se conserva y la próxima acción identifica la creación o activación de una versión sucesora.

##### 8.6.12.4. V04 — Reprogramar revisión

El profesional selecciona `REPROGRAMAR_REVISION`.

**Resultado:** se registra la próxima revisión como acción trazable; la representación temporal definitiva pertenece a `06`.

##### 8.6.12.5. V05 — Cambiar objetivo

El profesional selecciona `CAMBIAR_OBJETIVO`.

**Resultado:** la próxima acción conduce a una nueva versión del objetivo sin sobrescribir el objetivo histórico.

##### 8.6.12.6. V06 — Finalizar correctamente

El profesional selecciona `FINALIZAR`.

**Resultado:** el plan o ciclo deja de admitir nueva ejecución conforme a la transición que defina `06`; evidencia y revisión permanecen consultables según `08`.

##### 8.6.12.7. V07 — Iniciar un nuevo bloque o período

La decisión de dominio se expresa mediante `AJUSTAR` o `SUSTITUIR`, según conserve o genere una nueva versión.

**Resultado:** no se crea un séptimo resultado semántico.

##### 8.6.12.8. V08 — Programar una revisión sin cambiar el plan

La acción se expresa mediante `REPROGRAMAR_REVISION`.

**Resultado:** el plan no se modifica y queda una próxima acción trazable.

##### 8.6.12.9. V09 — Evidencia de varias fechas

El profesional selecciona evidencia dentro del período revisado.

**Resultado:** cada referencia permanece identificable; el sistema no resume silenciosamente evidencia no seleccionada como si hubiera sido examinada.

#### 8.6.13. Excepciones

##### 8.6.13.1. E01 — Evidencia insuficiente o no identificable

No existe evidencia suficiente o no puede reconstruirse su relación con el período.

**Resultado:** BE no guarda una revisión válida ni cierra el ciclo.

##### 8.6.13.2. E02 — Abrir dashboard o visualizar información

El profesional abre o consulta la información, pero no registra los componentes obligatorios.

**Resultado:** BE puede registrar la consulta según política, pero no crea una revisión profesional válida.

##### 8.6.13.3. E03 — Nota libre aislada

El profesional guarda una nota sin resultado, fundamento y próxima acción.

**Resultado:** la nota no se clasifica como revisión y no resuelve el pendiente.

##### 8.6.13.4. E04 — Modificación silenciosa del plan

El profesional intenta cambiar una versión activa o histórica sin registrar revisión y continuidad.

**Resultado:** BE impide la modificación silenciosa; el cambio debe seguir los casos de revisión y versionado aplicables.

##### 8.6.13.5. E05 — Resultado ausente o fuera de taxonomía

No se selecciona uno de los seis resultados semánticos.

**Resultado:** BE no guarda la revisión como válida.

##### 8.6.13.6. E06 — Fundamento o próxima acción ausentes

La revisión no contiene fundamento o no determina próxima acción/cierre.

**Resultado:** BE no cierra el ciclo.

##### 8.6.13.7. E07 — Interpretación diagnóstica

El contenido se presenta como diagnóstico o afirmación clínica no admitida.

**Resultado:** BE no confirma la revisión dentro del alcance del MVP y orienta a corregir el registro según la política posterior.

##### 8.6.13.8. E08 — Profesional no autorizado o dominio incompatible

El actor no posee autorización nutricional aplicable.

**Resultado:** BE deniega sin revelar información protegida.

##### 8.6.13.9. E09 — Conflicto de versión o evidencia

El plan, la evidencia o el ciclo cambiaron antes de confirmar.

**Resultado:** BE no registra una revisión sobre un contexto obsoleto y exige revisar nuevamente.

##### 8.6.13.10. E10 — Falla de persistencia o auditoría

BE no puede preservar revisión, continuidad y auditoría de forma coherente.

**Resultado:** no marca el ciclo como cerrado ni modifica la situación vigente.

##### 8.6.13.11. E11 — Continuidad incompatible

El resultado y la próxima acción se contradicen o no pueden aplicarse.

**Resultado:** BE no registra un cierre parcial y solicita una combinación válida.

##### 8.6.13.12. E12 — Revocación o finalización concurrente del vínculo

El acceso deja de ser válido antes de confirmar.

**Resultado:** BE deniega la operación y conserva cualquier borrador conforme a la política que definan `08/10`.

#### 8.6.14. Reglas aplicables

1. `DEC-043` gobierna la definición de revisión válida.
2. La revisión pertenece al dominio de Nutrición.
3. El período y la evidencia deben ser identificables.
4. La interpretación es profesional y no diagnóstica.
5. Solo se utilizan seis resultados semánticos.
6. No se crean verbos paralelos de dominio.
7. Toda revisión exige fundamento.
8. Toda revisión exige próxima acción o cierre.
9. Abrir, visualizar, anotar o editar silenciosamente no constituyen revisión.
10. Mantener también requiere una decisión explícita.
11. Sustituir conserva la versión anterior.
12. Cambiar objetivo conserva historia.
13. Finalizar conserva evidencia.
14. Timeline y pendientes derivan del evento registrado; no lo sustituyen.
15. UC-P13 produce insumos para RF-058, pero no calcula la métrica.
16. Fórmula y elegibilidad de TVCC-30 pertenecen a `06/12`.
17. Estados y transiciones pertenecen a `06`.
18. La UI pertenece a `10`.
19. Contenido mínimo verificable y escenarios negativos pertenecen a `11A`.

#### 8.6.15. Información utilizada o generada

##### 8.6.15.1. Utilizada

- identidad profesional;
- especialidad y habilitación;
- vínculo y consentimiento;
- asesorado;
- plan o ciclo;
- período;
- versión activada;
- evidencia autorizada;
- revisiones anteriores;
- objetivo vigente;
- situación de capacidad cuando la continuidad abre un proceso nuevo.

##### 8.6.15.2. Generada

- revisión profesional válida;
- referencias a evidencia;
- interpretación no diagnóstica;
- resultado semántico;
- fundamento;
- próxima acción o cierre;
- autoría;
- fecha;
- evento de timeline;
- resolución de pendiente;
- evento base para ciclo cerrado trazable.

#### 8.6.16. Requisitos relacionados

##### 8.6.16.1. RF principales

- `RF-034 — Revisar y decidir sobre evidencia nutricional`
- `RF-035 — Mantener, sustituir o cerrar plan nutricional`
- `RF-056 — Registrar revisión profesional válida y próxima acción`

##### 8.6.16.2. RF transversales o relacionados

- `RF-021 — Evaluar autorización contextual`
- `RF-054 — Construir línea temporal longitudinal`
- `RF-055 — Identificar revisiones pendientes`
- `RF-058 — Calcular TVCC-30 de manera reproducible`, como consumidor analítico posterior.
- `RF-066 — Capacidad académica`, cuando la próxima acción abre un proceso nuevo.

##### 8.6.16.3. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-INT-002`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 8.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`

#### 8.6.18. Casos relacionados

- `UC-P09 — Registrar evaluación y objetivo nutricional`
- `UC-P10 — Diseñar plan nutricional`
- `UC-P11 — Validar y activar plan nutricional`
- `UC-P12 — Consultar y registrar ejecución nutricional en APK`
- `UC-S01 — Obtener TVCC-30 de manera reproducible`

#### 8.6.19. Puntos de auditoría

- profesional;
- asesorado;
- dominio;
- período o ciclo;
- versión del plan;
- evidencia examinada;
- interpretación;
- resultado semántico;
- fundamento;
- próxima acción o cierre;
- autoría;
- fecha;
- situación anterior y posterior;
- referencias de versión;
- resolución del pendiente;
- intento de contar apertura o visualización como revisión;
- nota aislada rechazada como revisión;
- intento de modificación silenciosa;
- conflicto, concurrencia o falla;
- disponibilidad del evento para UC-S01.

#### 8.6.20. Decisiones o preguntas abiertas

1. Taxonomía técnica y estados: `DERIVAR 06`.
2. Evento exacto que cierra seguimiento: `Q-007 / DERIVAR 06`.
3. Lectura histórica después de cierre: `DERIVAR 08`.
4. Corrección de una revisión: `DERIVAR 06/08`.
5. Contenido mínimo y validaciones: `DERIVAR 11A`.
6. Formulario y carga profesional: `DERIVAR 10`.
7. Concurrencia y contratos: `DERIVAR 09`.
8. Fórmula y elegibilidad de TVCC-30: `DERIVAR 06/12`.
9. Validación de DEC-043: obligatoria antes de G4.

#### 8.6.21. Criterio de cierre

El caso termina cuando existe una revisión profesional válida y una continuidad o cierre explícitos, preservados y trazables; o cuando una excepción impide registrarlos sin marcar falsamente el ciclo como cerrado.

---

### 8.7. UC-I05 — Registrar revisión profesional válida

#### 8.7.1. Código

`UC-I05`

#### 8.7.2. Tipo

Caso incluido común a Nutrición y Entrenamiento.

#### 8.7.3. Objetivo

Registrar el evento explícito definido por `DEC-043` sin duplicar ni alterar su semántica.

#### 8.7.4. Precondiciones

1. Actor profesional autorizado.
2. Dominio y período identificados.
3. Evidencia accesible e identificable.
4. Resultado semántico permitido.
5. Fundamento.
6. Próxima acción o cierre.

#### 8.7.5. Flujo incluido

1. Recibe dominio y período.
2. Recibe las referencias de evidencia examinada.
3. Recibe la interpretación breve y no diagnóstica.
4. Recibe uno de los seis resultados semánticos.
5. Recibe fundamento.
6. Recibe próxima acción o cierre.
7. Obtiene autoría y fecha verificables.
8. Verifica que ningún componente obligatorio falte.
9. Preserva la relación entre evidencia, decisión y actor.
10. Registra el evento de revisión.
11. Lo hace disponible para timeline, pendientes y continuidad.

#### 8.7.6. Excepciones

##### 8.7.6.1. E01 — Falta un componente obligatorio

**Resultado:** no se registra como revisión profesional válida.

##### 8.7.6.2. E02 — Evidencia no reconstruible

**Resultado:** no se registra como revisión válida.

##### 8.7.6.3. E03 — Resultado fuera de taxonomía

**Resultado:** se rechaza el valor sin crear una taxonomía paralela.

##### 8.7.6.4. E04 — Acción no constitutiva de revisión

Abrir, visualizar, guardar una nota aislada o editar silenciosamente no invocan con éxito este caso.

#### 8.7.7. Garantías mínimas

- Aplica literalmente los siete componentes de `DEC-043`.
- No define entidad, enum, endpoint o formulario.
- No infiere revisión desde actividad de interfaz.
- No acepta decisión automática sin registro profesional.
- Conserva autoría y evidencia.
- Funciona como patrón común para UC-P13 y UC-P18.

#### 8.7.8. Requisitos relacionados

- `RF-056`
- `RF-034`
- `RF-045`
- `DEC-043`

#### 8.7.9. Puntos de auditoría

- invocante;
- dominio;
- período;
- evidencia;
- resultado;
- fundamento;
- próxima acción/cierre;
- autor;
- fecha;
- validación completa o rechazo.

#### 8.7.10. Criterio de cierre

El caso incluido termina cuando el evento completo queda registrado o cuando se rechaza sin producir una revisión falsa.

---

### 8.8. UC-I06 — Aplicar continuidad o cierre

#### 8.8.1. Código

`UC-I06`

#### 8.8.2. Tipo

Caso incluido común a Nutrición y Entrenamiento.

#### 8.8.3. Objetivo

Aplicar la consecuencia funcional de una revisión válida mediante continuidad explícita o cierre, preservando versiones e historia.

#### 8.8.4. Precondiciones

1. Existe una revisión profesional válida.
2. Existe un resultado semántico.
3. Existe una próxima acción o cierre.
4. El actor continúa autorizado.
5. La situación no cambió de forma incompatible.

#### 8.8.5. Flujo incluido

1. Recibe el resultado semántico y la próxima acción.
2. Evalúa la compatibilidad con la situación vigente.
3. Aplica la consecuencia observable:
   - mantener;
   - preparar ajuste;
   - preparar sustitución;
   - reprogramar revisión;
   - iniciar cambio de objetivo;
   - finalizar.
4. Conserva la versión anterior cuando existe cambio.
5. Evita ediciones silenciosas.
6. Actualiza la situación funcional.
7. Registra la relación con la revisión.
8. Actualiza próxima acción, timeline y pendiente.
9. Deja disponible el evento para analítica posterior.

#### 8.8.6. Variantes

##### 8.8.6.1. V01 — Mantener

Conserva el plan vigente y registra próxima acción.

##### 8.8.6.2. V02 — Ajustar o sustituir

Inicia el recorrido de nueva versión sin alterar lo ya emitido.

##### 8.8.6.3. V03 — Reprogramar revisión

Registra una nueva revisión prevista sin modificar silenciosamente el plan.

##### 8.8.6.4. V04 — Cambiar objetivo

Inicia una nueva versión de objetivo relacionada con el anterior.

##### 8.8.6.5. V05 — Finalizar

Bloquea nueva ejecución conforme a `06` y conserva evidencia.

#### 8.8.7. Excepciones

##### 8.8.7.1. E01 — Revisión inválida

**Resultado:** no se aplica continuidad ni cierre.

##### 8.8.7.2. E02 — Combinación incompatible

**Resultado:** no se produce una transición parcial.

##### 8.8.7.3. E03 — Conflicto concurrente

**Resultado:** se exige reevaluar la situación.

##### 8.8.7.4. E04 — Falla de persistencia

**Resultado:** no se declara continuidad o cierre exitosos.

#### 8.8.8. Garantías mínimas

- No existe continuidad sin revisión válida.
- No existe cierre silencioso.
- Mantener es una decisión registrada.
- Sustituir conserva la versión anterior.
- Finalizar conserva evidencia.
- No fija transiciones técnicas definitivas.
- No calcula TVCC-30.

#### 8.8.9. Requisitos relacionados

- `RF-035`
- `RF-046`
- `RF-056`
- `RF-058`, como productor de eventos consumibles.

#### 8.8.10. Puntos de auditoría

- revisión origen;
- resultado;
- acción;
- situación anterior;
- situación posterior;
- versión anterior y sucesora;
- cierre;
- autor;
- fecha;
- falla o conflicto.

#### 8.8.11. Criterio de cierre

El caso incluido termina cuando la próxima acción o cierre queda aplicada de forma trazable, o cuando una excepción impide producir una continuidad falsa.

---

### 8.9. Historias de usuario prioritarias

#### 8.9.1. HU-09 — Revisar evidencia y decidir

**Como** profesional de Nutrición  
**quiero** registrar una revisión vinculada a evidencia, con interpretación, resultado, fundamento y próxima acción  
**para** cerrar el ciclo sin reducir la revisión a una visualización o nota aislada.

##### 8.9.1.1. Criterios de aceptación

###### 8.9.1.1.1. Escenario 1 — Revisión válida

**Dado** que tengo autorización y evidencia identificable  
**cuando** registro los siete componentes de DEC-043  
**entonces** BE guarda una revisión profesional válida  
**y** preserva autoría, fecha y referencias.

###### 8.9.1.1.2. Escenario 2 — Apertura sin decisión

**Dado** que solo abrí el dashboard  
**cuando** cierro la vista sin registrar resultado y próxima acción  
**entonces** BE no crea una revisión válida  
**y** el pendiente continúa abierto.

###### 8.9.1.1.3. Escenario 3 — Nota aislada

**Dado** que guardé una nota sin resultado controlado  
**cuando** BE evalúa el evento  
**entonces** no lo clasifica como revisión  
**y** no lo utiliza para cerrar el ciclo.

###### 8.9.1.1.4. Escenario 4 — Denegación

**Dado** que no estoy autorizado  
**cuando** intento revisar  
**entonces** BE deniega la operación  
**y** no revela evidencia protegida.

---

#### 8.9.2. HU-10 — Dar continuidad trazable

**Como** profesional de Nutrición  
**quiero** que mi resultado produzca una próxima acción o cierre explícitos  
**para** preservar la historia y hacer demostrable la continuidad del proceso.

##### 8.9.2.1. Criterios de aceptación

###### 8.9.2.1.1. Escenario 1 — Mantener

**Dado** que la estrategia continúa  
**cuando** selecciono `MANTENER`  
**entonces** BE registra la decisión y la próxima acción  
**y** no crea una edición silenciosa.

###### 8.9.2.1.2. Escenario 2 — Sustituir

**Dado** que corresponde una planificación nueva  
**cuando** selecciono `SUSTITUIR`  
**entonces** la versión anterior permanece  
**y** la nueva acción queda relacionada con la revisión.

###### 8.9.2.1.3. Escenario 3 — Finalizar

**Dado** que corresponde cerrar el ciclo  
**cuando** selecciono `FINALIZAR` y fundamento el cierre  
**entonces** BE impide nueva ejecución conforme a las reglas posteriores  
**y** conserva evidencia e historia.

###### 8.9.2.1.4. Escenario 4 — TVCC-30

**Dado** que existe revisión válida y próxima acción o cierre  
**cuando** el ciclo queda registrado  
**entonces** el evento queda disponible para UC-S01  
**y** UC-P13 no calcula la métrica.

---

### 8.10. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Evidencia disponible para revisión | Parcial | `PRESERVAR + REFACTORIZAR` | Vincular período, plan, actor, fecha y versión. |
| Revisión explícita | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Incorporar evento DEC-043 completo. |
| Interpretación no diagnóstica | No evidenciada como componente estructurado | `NO EVIDENCIADO` | Registrar síntesis sin crear diagnóstico. |
| Resultado controlado | Parcial o ausente | `REEMPLAZAR / NO EVIDENCIADO` | Usar seis resultados comunes. |
| Fundamento y próxima acción | No evidenciados de extremo a extremo | `NO EVIDENCIADO` | Hacerlos obligatorios para revisión válida. |
| Continuidad versionada | Incompleta | `REFACTORIZAR` | Preservar versión anterior y relación sucesora. |
| Cierre trazable | No evidenciado | `NO EVIDENCIADO` | Finalizar sin borrar evidencia. |
| Pendiente resuelto por revisión válida | No evidenciado | `NO EVIDENCIADO` | No resolver por mera visualización. |
| Evento base de TVCC-30 | No evidenciado | `NO EVIDENCIADO` | Producir evento; cálculo permanece en UC-S01. |

---

### 8.11. Revisión crítica consolidada

#### 8.11.1. Controles superados

1. DEC-043 se reutiliza sin reformular sus componentes.
2. Solo se utilizan seis resultados semánticos.
3. Las ocho acciones se mapean sin crear vocabulario paralelo.
4. Abrir dashboard no cuenta como revisión.
5. Visualizar no cuenta como revisión.
6. Nota aislada no cuenta como revisión.
7. Modificación silenciosa no cuenta como revisión.
8. Toda revisión exige evidencia.
9. Toda revisión exige interpretación no diagnóstica.
10. Toda revisión exige fundamento.
11. Toda revisión exige próxima acción o cierre.
12. Autoría y fecha son verificables.
13. Continuidad preserva versiones.
14. RF-058 recibe un evento observable, pero la fórmula no se fija.
15. UC-I02 protege toda la operación.
16. La jerarquía cumple H1/H2/H3/H4/H5.
17. No se fijan entidades, endpoints, formularios o estados técnicos.

#### 8.11.2. Autoverificación exigida

| Control | Resultado |
|---|---|
| Siete componentes de DEC-043 presentes | `CUMPLE` |
| Solo seis resultados semánticos | `CUMPLE` |
| Ocho acciones mapeadas sin taxonomía paralela | `CUMPLE` |
| Cuatro no-revisiones explicitadas | `CUMPLE` |
| Evidencia vinculada y reconstruible | `CUMPLE` |
| Interpretación no diagnóstica | `CUMPLE` |
| Próxima acción o cierre obligatorios | `CUMPLE` |
| Autoría y fecha verificables | `CUMPLE` |
| RF-058 observable sin fórmula | `CUMPLE` |
| UC-I02 incluido | `CUMPLE` |
| Jerarquía normalizada | `CUMPLE` |

#### 8.11.3. Riesgos abiertos

##### 8.11.3.1. R-05-REV-01 — Revisión mecánica para cerrar pendientes

**Control:** evidencia, interpretación, fundamento y próxima acción obligatorios; contenido mínimo a 11A.

##### 8.11.3.2. R-05-REV-02 — Visualización contada como revisión

**Control:** garantía, excepción, criterio de aceptación y auditoría explícitos.

##### 8.11.3.3. R-05-REV-03 — Taxonomía paralela de Nutrición

**Control:** solo seis resultados comunes.

##### 8.11.3.4. R-05-REV-04 — Edición silenciosa

**Control:** continuidad únicamente después de revisión válida; versiones preservadas.

##### 8.11.3.5. R-05-REV-05 — Diagnóstico fuera de alcance

**Control:** interpretación breve no diagnóstica.

##### 8.11.3.6. R-05-REV-06 — Ciclo cerrado sin próxima acción

**Control:** sin próxima acción o cierre no existe revisión válida.

##### 8.11.3.7. R-05-REV-07 — TVCC-30 contaminada por actividad de interfaz

**Control:** solo revisión válida y próxima acción/cierre producen evento base.

##### 8.11.3.8. R-05-REV-08 — Cierre que borra historia

**Control:** evidencia, revisión y versiones se preservan.

#### 8.11.4. Veredicto

```text
BLOQUE 05 — REVISIÓN Y CONTINUIDAD NUTRICIONAL:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS:
UC-P13, UC-I05, UC-I06

RF PRINCIPALES:
RF-034, RF-035, RF-056

RF RELACIONADO:
RF-058

DECISIÓN:
DEC-043 v0.4

CIRCUITO NUTRICIONAL:
CERRADO FUNCIONALMENTE EN 05
ESTADOS Y EVENTO TÉCNICO DEFINITIVO: DERIVAR 06

TVCC-30:
EVENTO BASE OBSERVABLE
FÓRMULA NO FIJADA

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 8.12. Decisiones del bloque

#### 8.12.1. Aprobadas y aplicadas

- revisión explícita vinculada a evidencia;
- interpretación no diagnóstica;
- resultado semántico común;
- fundamento;
- próxima acción o cierre;
- autoría y fecha;
- acciones que no constituyen revisión;
- continuidad explícita;
- preservación de versiones;
- evento base para TVCC-30.

#### 8.12.2. Provisionales

- códigos `UC-P13`, `UC-I05`, `UC-I06`;
- momento exacto de resolución del pendiente;
- contenido mínimo verificable;
- conducta ante corrección de una revisión;
- representación de próxima acción.

#### 8.12.3. Pendientes derivados

- estados, transiciones y cierre de seguimiento: `06`;
- política de lectura y corrección: `08`;
- contratos y concurrencia: `09`;
- formulario y fricción: `10`;
- pruebas de contenido mínimo y gaming: `11A`;
- fórmula y trazabilidad TVCC-30: `12`.

---

### 8.13. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. DEC-043 se materializa completa;
2. no se crean resultados semánticos nuevos;
3. abrir, visualizar, anotar o editar silenciosamente no cuentan como revisión;
4. toda revisión exige evidencia, interpretación, resultado, fundamento y próxima acción/cierre;
5. la continuidad preserva versiones;
6. el cierre no borra evidencia;
7. el evento alimenta RF-058 sin fijar TVCC-30;
8. el circuito nutricional queda funcionalmente cerrado en 05;
9. estados y fórmula permanecen en 06/12.

---

### 8.14. Estado

```text
ARQUITECTURA:
v0.2.5

GLOSARIO:
v0.1.4

BLOQUE 04:
v0.6 — APTO

BLOQUE 05:
REDACTADO EN v0.7
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P13, UC-I05, UC-I06

HISTORIAS:
HU-09, HU-10

DEC-043:
APLICADA SIN REFORMULACIÓN

CIRCUITO NUTRICIONAL:
CERRADO FUNCIONALMENTE

GIT:
SIN CAMBIOS
```

#### 8.14.1. Siguiente acción recomendada

Revisar el Bloque 05. Después iniciar el circuito de Entrenamiento:

```text
UC-P14 — Registrar evaluación y objetivo de entrenamiento
UC-P15 — Diseñar plan de entrenamiento
UC-P16 — Validar y activar plan de entrenamiento
UC-P17 — Consultar y registrar ejecución en APK
```

---

## 9. Bloque 06 — Circuito de entrenamiento

*Fuente ensamblada: `BE_LEG_05_v0.8.1_BLOQUE_06_REFACTOR_CORRECCION_COMUN.md`.*

### 9.1. Propósito del bloque

Este bloque define el circuito de Entrenamiento de extremo a extremo:

```text
evaluación
→ objetivo de entrenamiento
→ plan en borrador
→ bloques, sesiones y prescripción
→ validación
→ activación con instantánea reproducible
→ consulta en APK
→ ejecución real
→ corrección trazable cuando corresponda
→ revisión profesional válida
→ resultado semántico
→ progresión, continuidad o cierre
```

Cubre:

- evaluación y objetivo de entrenamiento;
- catálogo propio;
- carga manual;
- importación controlada desde wger;
- diseño por bloques y sesiones;
- versión en borrador;
- validación y activación;
- instantánea reproducible;
- control de capacidad;
- consulta desde la APK;
- registro de ejecución real;
- corrección posterior sin sobrescritura;
- revisión profesional válida;
- progresión, continuidad o cierre;
- producción de eventos para timeline, pendientes y TVCC-30.

No fija:

- ejercicios concretos;
- series;
- repeticiones;
- cargas;
- tiempos;
- descansos;
- frecuencias;
- velocidades;
- intensidades;
- porcentajes;
- fórmulas de progresión;
- categorías definitivas;
- estados técnicos;
- contratos;
- pantallas.

El contenido profesional pertenece al criterio de Entrenamiento y al modelo de dominio del Documento 06.

---

### 9.2. Decisiones funcionales aplicadas

#### 9.2.1. Reutilización obligatoria de patrones comunes

El circuito reutiliza:

- `UC-I02 — Evaluar autorización contextual`;
- `UC-I03 — Registrar auditoría y preservar historia`;
- `UC-I04 — Validar y versionar un plan`;
- `UC-I05 — Registrar revisión profesional válida`;
- `UC-I06 — Aplicar continuidad o cierre`;
- `UC-I07 — Importar un elemento externo de forma controlada`;
- `UC-I08 — Aplicar fallback manual y conservar procedencia`;
- `UC-I10 — Verificar habilitación y capacidad`.

No redefine estos patrones por dominio.

#### 9.2.2. Evaluación y objetivo

`UC-P14` cubre conjuntamente:

- `RF-036 — Registrar evaluación de entrenamiento`;
- `RF-064 — Registrar objetivo de entrenamiento`.

El objetivo:

- pertenece a Entrenamiento;
- se asocia a la evaluación y al profesional;
- posee vigencia y fundamento observables;
- conserva versiones;
- no contiene fórmulas fijadas por Documento 05.

#### 9.2.3. Planificado y ejecutado

```text
prescripción de entrenamiento
≠ ejecución real
```

La versión activada representa lo planificado. La ejecución real registra lo que el asesorado declara haber realizado.

La ejecución:

- no reescribe la prescripción;
- no adapta automáticamente el plan;
- no se infiere por abrir una sesión;
- conserva autoría, fecha y relación con la versión activada.

#### 9.2.4. Corrección trazable

```text
registro original
→ corrección relacionada
→ vista efectiva reconstruible
```

Corregir no significa sobrescribir ni borrar el registro inicial.

#### 9.2.5. wger y resiliencia

```text
catálogo propio
→ carga manual
→ wger cuando aporta valor
→ importación controlada
→ procedencia conservada
→ fallback manual ante indisponibilidad
```

wger es compromiso académico P0, pero no fuente operativa única.

#### 9.2.6. Capacidad

Se reutiliza sin reformulación:

```text
proceso nuevo excede capacidad configurada
→ se rechaza la activación nueva
→ continúan procesos vigentes
→ pueden revisarse y cerrarse
→ no se borran datos
→ no se revocan vínculos
```

#### 9.2.7. Revisión y progresión

`UC-P18` invoca `UC-I05` y `UC-I06`.

Progresión no es un séptimo resultado:

```text
progresión que conserva la planificación
→ AJUSTAR

progresión que genera una versión sucesora
→ SUSTITUIR
```

Los seis resultados semánticos permanecen:

```text
MANTENER
AJUSTAR
SUSTITUIR
REPROGRAMAR_REVISION
CAMBIAR_OBJETIVO
FINALIZAR
```

---

### 9.3. Actores

| Actor | Responsabilidad |
|---|---|
| **Profesional de Entrenamiento** | Evalúa, fija objetivos, diseña, activa, revisa evidencia y decide continuidad o cierre. |
| **Asesorado** | Consulta la versión activada, registra ejecución real y solicita o realiza correcciones permitidas. |
| **Sistema BE** | Evalúa autorización, preserva versiones, controla capacidad, mantiene procedencia, registra auditoría y evita sobrescrituras silenciosas. |

---

### 9.4. Relaciones internas

```text
UC-P14 — Registrar evaluación y objetivo de entrenamiento
  incluye → UC-I02
  incluye → UC-I03

UC-P15 — Diseñar plan de entrenamiento
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I07
  incluye ante contingencia → UC-I08

UC-P16 — Validar y activar plan de entrenamiento
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I04
  incluye → UC-I10

UC-P17 — Consultar y registrar ejecución de entrenamiento en APK
  incluye → UC-I02
  incluye → UC-I03
  puede ser extendido por → UC-E02

UC-E02 — Corregir ejecución de entrenamiento
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I12 — Registrar corrección trazable

UC-P18 — Revisar evidencia y decidir continuidad de entrenamiento
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I05
  incluye → UC-I06
  produce evidencia para → UC-S01
```

---

### 9.5. Frontera de responsabilidad

| Tema | Propietario |
|---|---|
| Comportamientos de evaluación, planificación, ejecución, revisión y continuidad | Documento 05 |
| Estructura de bloques, sesiones, prescripciones, series y registros | Documento 06 |
| Arquitectura de adaptadores y disponibilidad de wger | Documento 07 |
| Autorización, corrección, visibilidad y retención | Documento 08 |
| Contratos de integración, idempotencia y concurrencia | Documento 09 |
| Formularios, navegación y experiencia APK | Documento 10 |
| Datos de prueba, escenarios negativos y pruebas E2E | Documento 11A |
| Trazabilidad completa y TVCC-30 | Documento 12 |

---

### 9.6. UC-P14 — Registrar evaluación y objetivo de entrenamiento

#### 9.6.1. Código

`UC-P14`

#### 9.6.2. Nombre

**Registrar evaluación y objetivo de entrenamiento**

#### 9.6.3. Objetivo

Permitir que un profesional de Entrenamiento registre una evaluación identificable y determine un objetivo de entrenamiento versionado y fundamentado que sirva de base para la planificación.

#### 9.6.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe un asesorado autorizado para evaluación de Entrenamiento.
- **Fin:** existe una evaluación preservada y un objetivo vigente o un borrador guardado sin declaración falsa de completitud.

#### 9.6.5. Actor principal

Profesional de Entrenamiento.

#### 9.6.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 9.6.7. Disparador

El profesional inicia o continúa una evaluación de Entrenamiento.

#### 9.6.8. Precondiciones

1. El profesional posee Entrenamiento `VERIFICADO`.
2. Existe habilitación aplicable.
3. Existe vínculo aceptado.
4. Existe consentimiento vigente para Entrenamiento.
5. `UC-I02` autoriza la operación.
6. El asesorado y el período de evaluación son identificables.
7. La evaluación no se confunde con diagnóstico.
8. El objetivo no se presume por la existencia de un plan previo.

#### 9.6.9. Postcondiciones de éxito

1. La evaluación queda asociada a:
   - asesorado;
   - profesional;
   - dominio;
   - fecha o período;
   - autoría;
   - procedencia.
2. El objetivo queda asociado a la evaluación.
3. El objetivo posee:
   - versión;
   - vigencia funcional;
   - fundamento;
   - autoría;
   - fecha.
4. Un objetivo nuevo no sobrescribe silenciosamente el anterior.
5. La evaluación queda disponible para `UC-P15`.
6. No se activa un plan.
7. No se generan decisiones automáticas.
8. El evento queda trazable.

#### 9.6.10. Garantías mínimas

- RF-064 queda cubierto explícitamente.
- Evaluación y objetivo son conceptos diferentes.
- El objetivo pertenece al dominio de Entrenamiento.
- No se fijan series, repeticiones, cargas o fórmulas.
- La evaluación no diagnostica.
- La procedencia se conserva.
- Un dato ausente no se inventa.
- Un borrador no se presenta como evaluación completa.
- Un error de persistencia no muestra éxito.
- Otro dominio no cambia implícitamente.

#### 9.6.11. Flujo principal

1. El profesional selecciona al asesorado.
2. BE ejecuta `UC-I02`.
3. BE presenta antecedentes autorizados pertinentes.
4. El profesional inicia una evaluación de Entrenamiento.
5. BE identifica dominio, período y autor.
6. El profesional registra la información relevante.
7. BE conserva procedencia y fecha.
8. El profesional formula un objetivo de entrenamiento.
9. El profesional registra el fundamento.
10. BE presenta evaluación, objetivo, versión y vigencia funcional.
11. El profesional confirma.
12. BE verifica que el contexto no haya cambiado.
13. BE preserva evaluación y objetivo.
14. BE registra autoría y fecha mediante `UC-I03`.
15. La evaluación queda disponible para planificación.
16. El caso finaliza.

#### 9.6.12. Variantes

##### 9.6.12.1. V01 — Guardar evaluación incompleta

El profesional guarda información disponible sin declarar cierre.

**Resultado:** existe un borrador retomable y no un objetivo vigente nuevo.

##### 9.6.12.2. V02 — Actualizar objetivo

El profesional registra un objetivo sucesor.

**Resultado:** el objetivo anterior permanece reconstruible.

##### 9.6.12.3. V03 — Reutilizar información autorizada

El profesional consulta contexto previo pertinente.

**Resultado:** la información conserva procedencia y no se convierte en dato propio del dominio sin decisión explícita.

##### 9.6.12.4. V04 — Sin objetivo nuevo

La evaluación confirma que el objetivo vigente continúa siendo aplicable.

**Resultado:** la continuidad se registra de manera explícita; no se duplica una versión equivalente.

##### 9.6.12.5. V05 — Ejecutar método profesional de apoyo

El profesional decide utilizar uno o más métodos pertinentes como apoyo para la evaluación o fundamentación del objetivo.

**Resultado:** BE ejecuta `UC-I13`; cada resultado conserva método, versión, inputs y procedencia y no determina automáticamente el objetivo, la prescripción ni el plan de entrenamiento.

#### 9.6.13. Excepciones

##### 9.6.13.1. E01 — Profesional no autorizado

**Resultado:** BE deniega sin revelar información protegida.

##### 9.6.13.2. E02 — Evaluación sin período o autoría

**Resultado:** no se guarda como evaluación completa.

##### 9.6.13.3. E03 — Objetivo sin fundamento

**Resultado:** no se declara vigente.

##### 9.6.13.4. E04 — Intento de sobrescritura

**Resultado:** BE conserva el objetivo anterior y exige una nueva versión.

##### 9.6.13.5. E05 — Interpretación diagnóstica

**Resultado:** no se confirma dentro del alcance del MVP.

##### 9.6.13.6. E06 — Conflicto concurrente

**Resultado:** BE no aplica cambios sobre contexto obsoleto.

##### 9.6.13.7. E07 — Falla de persistencia o auditoría

**Resultado:** no se declara evaluación u objetivo guardados.

#### 9.6.14. Reglas aplicables

1. `RF-036` y `RF-064` pertenecen a UC-P14.
2. Evaluación y objetivo se versionan.
3. El objetivo requiere fundamento.
4. La evaluación es no diagnóstica.
5. El contenido profesional no se fija en 05.
6. La procedencia se conserva.
7. Una actualización no sobrescribe historia.
8. La planificación requiere una base evaluativa identificable.
9. UI y estructura pertenecen a 10 y 06.

#### 9.6.15. Información utilizada o generada

##### 9.6.15.1. Utilizada

- identidad del profesional;
- asesorado;
- vínculo y consentimiento;
- contexto autorizado;
- evaluaciones anteriores;
- objetivo anterior;
- período.

##### 9.6.15.2. Generada

- evaluación;
- objetivo;
- fundamento;
- versión;
- autoría;
- fecha;
- procedencia;
- evento de auditoría.

#### 9.6.16. Requisitos relacionados

##### 9.6.16.1. RF

- `RF-036 — Registrar evaluación de entrenamiento`
- `RF-064 — Registrar objetivo de entrenamiento`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`
- `RF-070 — Utilizar métodos profesionales de cálculo reproducible`, cuando corresponda.

##### 9.6.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 9.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I13 — Ejecutar y adoptar cálculo profesional reproducible`, cuando corresponda.
- `UC-I12 — Registrar corrección trazable`

#### 9.6.18. Puntos de auditoría

- profesional;
- asesorado;
- dominio;
- período;
- evaluación;
- objetivo;
- fundamento;
- versión;
- autoría;
- fecha;
- procedencia;
- conflicto o falla.

#### 9.6.19. Decisiones o preguntas abiertas

1. Campos definitivos: `DERIVAR 06`.
2. Vigencia técnica: `DERIVAR 06`.
3. Política de corrección: `DERIVAR 08`.
4. Formulario: `DERIVAR 10`.
5. Contenido mínimo: `DERIVAR 11A`.

#### 9.6.20. Criterio de cierre

El caso termina cuando evaluación y objetivo quedan preservados y disponibles para planificación, o cuando una excepción impide guardarlos sin producir una base falsa.

---

### 9.7. UC-P15 — Diseñar plan de entrenamiento

#### 9.7.1. Código

`UC-P15`

#### 9.7.2. Nombre

**Diseñar plan de entrenamiento**

#### 9.7.3. Objetivo

Permitir que el profesional construya y retome un plan de entrenamiento en borrador mediante catálogo propio, carga manual e importación controlada desde wger, conservando procedencia y sin fijar contenido profesional en Documento 05.

#### 9.7.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe evaluación y objetivo aplicables.
- **Fin:** existe una versión de plan en borrador guardada y reconstruible.

#### 9.7.5. Actor principal

Profesional de Entrenamiento.

#### 9.7.6. Actores secundarios

- Sistema BE.
- wger como proveedor externo.

#### 9.7.7. Disparador

El profesional inicia o continúa la planificación.

#### 9.7.8. Precondiciones

1. El profesional está autorizado.
2. Existe evaluación y objetivo aplicables.
3. El plan pertenece al asesorado y al dominio de Entrenamiento.
4. Existe catálogo propio utilizable.
5. La carga manual permanece disponible.
6. wger puede utilizarse, pero no es fuente única.
7. Todo elemento externo debe pasar por `UC-I07`.
8. La indisponibilidad externa activa `UC-I08`.

#### 9.7.9. Postcondiciones de éxito

1. Existe un borrador versionado.
2. El borrador se relaciona con evaluación y objetivo.
3. La planificación puede organizarse mediante bloques y sesiones.
4. La prescripción de entrenamiento permanece diferenciada de la ejecución real.
5. Cada elemento conserva procedencia.
6. Los elementos externos importados identifican proveedor, fecha y decisión de incorporación.
7. El borrador no es visible como plan vigente.
8. La caída de wger no bloquea el diseño.
9. El plan puede retomarse.
10. El evento queda trazable.

#### 9.7.10. Garantías mínimas

- wger no es fuente operativa única.
- El catálogo BE permite continuidad.
- La carga manual es válida.
- La importación no es automática ni ciega.
- La procedencia no se pierde.
- Un dato externo no utilizable puede corregirse o rechazarse.
- No se fijan ejercicios, series, repeticiones, cargas o progresiones.
- El borrador no se ejecuta en APK.
- Un cambio no sobrescribe otra versión.
- Una falla externa no se presenta como éxito de integración.

#### 9.7.11. Flujo principal

1. El profesional abre la planificación del asesorado.
2. BE ejecuta `UC-I02`.
3. BE presenta evaluación y objetivo vigentes.
4. El profesional crea o retoma un borrador.
5. Organiza la planificación mediante bloques y sesiones.
6. Agrega prescripciones desde el catálogo propio o carga manual.
7. Cuando consulta wger, BE utiliza el adaptador correspondiente.
8. El profesional selecciona un elemento externo.
9. BE ejecuta `UC-I07`.
10. El profesional revisa el contenido importable.
11. Corrige, completa, rechaza o incorpora el elemento.
12. BE conserva proveedor, fecha y decisión.
13. El profesional continúa el diseño.
14. BE guarda una nueva versión del borrador.
15. BE registra autoría, fecha y procedencia mediante `UC-I03`.
16. El caso finaliza sin activar.

#### 9.7.12. Variantes

##### 9.7.12.1. V01 — Catálogo propio

El profesional planifica sin consultar wger.

**Resultado:** el circuito continúa normalmente.

##### 9.7.12.2. V02 — Carga manual

El elemento necesario no existe.

**Resultado:** se incorpora manualmente con procedencia propia.

##### 9.7.12.3. V03 — Importación desde wger

wger responde con información utilizable.

**Resultado:** el profesional revisa y decide incorporar; no existe copia automática.

##### 9.7.12.4. V04 — Dato externo incompleto

El dato requiere corrección o complemento.

**Resultado:** se conserva que la fuente original fue wger y que hubo intervención profesional.

##### 9.7.12.5. V05 — wger indisponible

El proveedor no responde o falla.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia, registra fallback y permite seguir con catálogo propio o carga manual.

##### 9.7.12.6. V06 — Guardar y retomar

El profesional interrumpe el diseño.

**Resultado:** el borrador permanece identificado y no se activa.

##### 9.7.12.7. V07 — Nueva versión de planificación

El profesional parte de una versión anterior.

**Resultado:** crea un borrador sucesor sin modificar la versión activada o histórica.

#### 9.7.13. Excepciones

##### 9.7.13.1. E01 — Evaluación u objetivo no aplicables

**Resultado:** no se inicia una planificación válida.

##### 9.7.13.2. E02 — Elemento externo no revisado

**Resultado:** BE no permite incorporarlo como parte del catálogo operativo.

##### 9.7.13.3. E03 — Procedencia insuficiente

**Resultado:** el elemento no se incorpora como importación válida.

##### 9.7.13.4. E04 — Duplicado contradictorio

**Resultado:** BE exige elegir, relacionar o descartar sin duplicar silenciosamente.

##### 9.7.13.5. E05 — Falla de wger

**Resultado:** se informa la contingencia y se aplica fallback; no se bloquea el núcleo.

##### 9.7.13.6. E06 — Falla de persistencia

**Resultado:** no se declara el borrador guardado.

##### 9.7.13.7. E07 — Acceso revocado durante el diseño

**Resultado:** BE detiene la operación y no expone información protegida.

#### 9.7.14. Reglas aplicables

1. `RF-037`, `RF-038`, `RF-039` y `RF-040` pertenecen al diseño.
2. El catálogo propio es la base operativa.
3. wger es compromiso académico P0.
4. Toda importación es controlada.
5. Toda importación conserva procedencia.
6. El fallback es observable.
7. Prescripción y ejecución real permanecen separadas.
8. El contenido concreto pertenece a dominio y criterio profesional.
9. El borrador no es plan vigente.
10. El plan se versiona.
11. Contratos y adaptadores pertenecen a 07/09.
12. Componentes y navegación pertenecen a 10.

#### 9.7.15. Información utilizada o generada

##### 9.7.15.1. Utilizada

- evaluación;
- objetivo;
- catálogo propio;
- elementos manuales;
- respuesta de wger;
- versiones anteriores.

##### 9.7.15.2. Generada

- borrador;
- bloques;
- sesiones;
- prescripciones;
- procedencia;
- proveedor;
- fecha;
- decisión de incorporación;
- fallback;
- evento de auditoría.

#### 9.7.16. Requisitos relacionados

##### 9.7.16.1. RF

- `RF-037 — Administrar catálogo propio de ejercicios`
- `RF-038 — Integrar wger mediante importación controlada`
- `RF-039 — Diseñar plan de entrenamiento`
- `RF-040 — Organizar bloques, sesiones y prescripción`
- `RF-059 — Mantener continuidad ante indisponibilidad externa`
- `RF-060 — Conservar procedencia`

##### 9.7.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-INT-001`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 9.7.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I07 — Importar un elemento externo de forma controlada`
- `UC-I08 — Aplicar fallback manual y conservar procedencia`

#### 9.7.18. Puntos de auditoría

- profesional;
- asesorado;
- evaluación y objetivo;
- versión del borrador;
- fuente;
- proveedor;
- fecha;
- decisión de incorporación;
- corrección;
- rechazo;
- fallback;
- autoría;
- falla.

#### 9.7.19. Decisiones o preguntas abiertas

1. Estructura del plan: `DERIVAR 06`.
2. Catálogo y campos: `DERIVAR 06`.
3. Adaptador wger: `DERIVAR 07`.
4. Licencia y tratamiento de procedencia: `DERIVAR 08`.
5. Contratos: `DERIVAR 09`.
6. Experiencia de importación: `DERIVAR 10`.
7. Pruebas de caída y datos incompletos: `DERIVAR 11A`.

#### 9.7.20. Criterio de cierre

El caso termina cuando existe un borrador reconstruible con procedencia preservada y fallback disponible, o cuando una excepción impide guardarlo sin activar ni inventar datos.

---

### 9.8. UC-P16 — Validar y activar plan de entrenamiento

#### 9.8.1. Código

`UC-P16`

#### 9.8.2. Nombre

**Validar y activar plan de entrenamiento**

#### 9.8.3. Objetivo

Permitir que el profesional valide y active una versión reproducible del plan de entrenamiento, preservando exactamente lo emitido y aplicando habilitación y capacidad sin interrumpir procesos vigentes.

#### 9.8.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe un borrador candidato.
- **Fin:** una versión queda activada con instantánea reproducible o la activación se rechaza sin alterar procesos vigentes.

#### 9.8.5. Actor principal

Profesional de Entrenamiento.

#### 9.8.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 9.8.7. Disparador

El profesional decide emitir un plan.

#### 9.8.8. Precondiciones

1. Existe evaluación y objetivo aplicables.
2. Existe un borrador versionado.
3. El profesional continúa autorizado.
4. El vínculo y consentimiento están vigentes.
5. `UC-I04` puede validar la versión.
6. `UC-I10` puede verificar habilitación y capacidad.
7. La versión activada puede preservarse como instantánea reproducible.

#### 9.8.9. Postcondiciones de éxito

1. Existe una única versión vigente compatible con la política.
2. La versión activada queda identificada.
3. Se preserva una instantánea reproducible.
4. El asesorado puede consultar exactamente lo emitido.
5. El borrador posterior no altera la versión activada.
6. La activación conserva autoría, fecha y procedencia.
7. Si abre un proceso nuevo, la capacidad fue evaluada.
8. Los procesos vigentes no se interrumpen por alcanzar el límite.
9. La versión queda disponible para `UC-P17`.
10. El evento queda trazable.

#### 9.8.10. Garantías mínimas

- Si no puede preservarse la instantánea, el plan no se activa.
- La instantánea no se reconstruye con el catálogo actual.
- La activación no modifica versiones anteriores.
- Solo una versión aplicable se presenta como vigente.
- Rechazar por capacidad no finaliza procesos vigentes.
- Un proceso nuevo que excede capacidad no se activa.
- No se revocan vínculos por capacidad.
- No se borran datos.
- Un fallo no presenta activación exitosa.

#### 9.8.11. Flujo principal

1. El profesional selecciona el borrador.
2. BE ejecuta `UC-I02`.
3. BE presenta evaluación, objetivo y versión.
4. El profesional solicita validación.
5. BE ejecuta `UC-I04`.
6. BE verifica completitud funcional sin fijar contenido profesional en 05.
7. BE ejecuta `UC-I10`.
8. Si la activación abre un proceso nuevo, evalúa capacidad.
9. BE presenta el resumen de la versión que será emitida.
10. El profesional confirma.
11. BE verifica concurrencia y vigencia del contexto.
12. BE activa la versión.
13. BE preserva la instantánea reproducible.
14. BE conserva autoría, fecha y procedencia.
15. BE registra mediante `UC-I03`.
16. La versión queda disponible en la APK.
17. El caso finaliza.

#### 9.8.12. Variantes

##### 9.8.12.1. V01 — Sustitución de versión activa

Existe una versión vigente.

**Resultado:** la anterior permanece histórica y la sucesora se activa de forma trazable.

##### 9.8.12.2. V02 — Capacidad disponible

La activación abre un proceso nuevo dentro de la banda.

**Resultado:** continúa la activación.

##### 9.8.12.3. V03 — Capacidad excedida

La activación abriría un proceso nuevo por encima de la banda.

**Resultado:** se rechaza la activación nueva; los procesos vigentes continúan y pueden revisarse o cerrarse.

##### 9.8.12.4. V04 — Cambio posterior del catálogo

El catálogo cambia después de activar.

**Resultado:** la instantánea conserva exactamente lo emitido.

##### 9.8.12.5. V05 — Corrección del borrador antes de activar

La validación detecta una condición incompleta.

**Resultado:** se vuelve al borrador; no existe activación parcial.

#### 9.8.13. Excepciones

##### 9.8.13.1. E01 — Profesional no autorizado

**Resultado:** se deniega la activación.

##### 9.8.13.2. E02 — Versión inválida

**Resultado:** no se activa.

##### 9.8.13.3. E03 — Instantánea no preservable

**Resultado:** no se activa.

##### 9.8.13.4. E04 — Habilitación insuficiente

**Resultado:** no se activa.

##### 9.8.13.5. E05 — Capacidad excedida para proceso nuevo

**Resultado:** se rechaza solo el proceso nuevo.

##### 9.8.13.6. E06 — Conflicto concurrente

**Resultado:** no se activan versiones contradictorias.

##### 9.8.13.7. E07 — Falla de persistencia o auditoría

**Resultado:** no se declara activación exitosa.

#### 9.8.14. Reglas aplicables

1. `RF-041` gobierna la activación.
2. La activación preserva instantánea reproducible.
3. El asesorado consulta lo emitido, no la última edición.
4. Habilitación y capacidad son gates separados.
5. La capacidad se controla al abrir procesos nuevos.
6. Procesos vigentes continúan.
7. Versiones anteriores se conservan.
8. La activación es trazable.
9. Estados técnicos pertenecen a 06.
10. UI y confirmaciones pertenecen a 10.

#### 9.8.15. Información utilizada o generada

##### 9.8.15.1. Utilizada

- borrador;
- evaluación;
- objetivo;
- habilitación;
- capacidad;
- vínculo;
- consentimiento;
- procedencia.

##### 9.8.15.2. Generada

- versión activada;
- instantánea reproducible;
- fecha;
- autoría;
- situación anterior y posterior;
- resultado de capacidad;
- evento de auditoría.

#### 9.8.16. Requisitos relacionados

##### 9.8.16.1. RF

- `RF-041 — Validar y activar plan de entrenamiento`
- `RF-066 — Representar habilitaciones y capacidad`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`

##### 9.8.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 9.8.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I04 — Validar y versionar un plan`
- `UC-I10 — Verificar habilitación y capacidad`

#### 9.8.18. Puntos de auditoría

- profesional;
- asesorado;
- versión;
- validación;
- habilitación;
- capacidad;
- resultado;
- instantánea;
- autoría;
- fecha;
- conflicto o falla.

#### 9.8.19. Decisiones o preguntas abiertas

1. Estados y transición: `DERIVAR 06`.
2. Cálculo exacto de capacidad: `DERIVAR 06`.
3. Política de acceso histórico: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Confirmación: `DERIVAR 10`.
6. Pruebas de snapshot y concurrencia: `DERIVAR 11A`.

#### 9.8.20. Criterio de cierre

El caso termina cuando una versión reproducible queda activa y consultable, o cuando la activación se rechaza sin afectar procesos vigentes ni producir un estado falso.

---

### 9.9. UC-P17 — Consultar y registrar ejecución de entrenamiento en APK

#### 9.9.1. Código

`UC-P17`

#### 9.9.2. Nombre

**Consultar y registrar ejecución de entrenamiento en APK**

#### 9.9.3. Objetivo

Permitir que el asesorado consulte la versión activada y registre lo que efectivamente realizó, manteniendo separadas la prescripción y la ejecución real.

#### 9.9.4. Alcance

- **Superficie:** APK del asesorado.
- **Inicio:** existe una versión activada autorizada.
- **Fin:** el asesorado consulta la prescripción o registra una ejecución real vinculada a la versión.

#### 9.9.5. Actor principal

Asesorado.

#### 9.9.6. Actores secundarios

- Profesional de Entrenamiento.
- Sistema BE.

#### 9.9.7. Disparador

El asesorado abre una sesión o registra lo realizado.

#### 9.9.8. Precondiciones

1. El asesorado posee sesión válida.
2. Existe vínculo y consentimiento vigentes.
3. `UC-I02` autoriza la operación.
4. Existe una versión activada e instantánea reproducible.
5. La sesión o unidad planificada puede identificarse.
6. La ejecución real no se confunde con la prescripción.

#### 9.9.9. Postcondiciones de éxito

##### 9.9.9.1. Consulta

1. El asesorado consulta exactamente la versión activada.
2. La prescripción permanece identificable.
3. No se muestra un borrador posterior como vigente.

##### 9.9.9.2. Registro

1. Existe una ejecución real.
2. La ejecución se vincula a:
   - asesorado;
   - versión;
   - sesión o unidad aplicable;
   - fecha;
   - autoría.
3. Lo registrado no modifica la prescripción.
4. El profesional autorizado puede consultar la evidencia.
5. La ejecución queda disponible para `UC-P18`.
6. Una corrección posterior utiliza `UC-E02`.
7. El evento queda trazable.

#### 9.9.10. Garantías mínimas

- Abrir una sesión no equivale a ejecutarla.
- La prescripción no se sobrescribe.
- La ejecución real no se infiere automáticamente.
- El asesorado registra lo que efectivamente hizo.
- No se fijan campos concretos de series, repeticiones o cargas en 05.
- Una ejecución parcial puede registrarse sin inventar completitud.
- Un error no muestra el registro como guardado.
- Una corrección no borra el original.
- La vista no concede autorización.

#### 9.9.11. Flujo principal — Consulta

1. El asesorado abre Entrenamiento.
2. BE ejecuta `UC-I02`.
3. BE identifica la versión activada.
4. BE presenta la instantánea reproducible.
5. El asesorado selecciona una sesión o unidad.
6. BE muestra la prescripción aplicable.
7. El caso puede finalizar sin registrar ejecución.

#### 9.9.12. Flujo principal — Registro

1. El asesorado consulta la prescripción.
2. Selecciona registrar ejecución.
3. BE identifica versión, sesión y fecha.
4. El asesorado registra lo efectivamente realizado.
5. BE presenta un resumen.
6. El asesorado confirma.
7. BE verifica que la versión y la autorización continúen vigentes.
8. BE preserva la ejecución como evidencia separada.
9. BE registra autoría y fecha mediante `UC-I03`.
10. La evidencia queda disponible para revisión.
11. El caso finaliza.

#### 9.9.13. Variantes

##### 9.9.13.1. V01 — Ejecución conforme a lo planificado

El asesorado registra que realizó la actividad correspondiente.

**Resultado:** se conserva como evidencia real, no como copia de la prescripción.

##### 9.9.13.2. V02 — Ejecución parcial o diferente

Lo realizado difiere de lo planificado.

**Resultado:** se registra la diferencia sin modificar la versión activada.

##### 9.9.13.3. V03 — Consulta sin ejecución

El asesorado solo consulta.

**Resultado:** no se crea evidencia de ejecución.

##### 9.9.13.4. V04 — Registro retomado

El asesorado interrumpe antes de confirmar.

**Resultado:** la política de borrador se deriva a 06/10; no se declara ejecución completa.

##### 9.9.13.5. V05 — Corrección posterior

El asesorado detecta un error después de guardar.

**Resultado:** continúa mediante `UC-E02`.

#### 9.9.14. Excepciones

##### 9.9.14.1. E01 — Sin versión activa autorizada

**Resultado:** BE no muestra contenido protegido.

##### 9.9.14.2. E02 — Sesión no identificable

**Resultado:** no se registra una ejecución ambigua.

##### 9.9.14.3. E03 — Autorización revocada

**Resultado:** BE deniega nuevas operaciones.

##### 9.9.14.4. E04 — Duplicado contradictorio

**Resultado:** BE no crea dos registros incompatibles sin relación.

##### 9.9.14.5. E05 — Conflicto de versión

**Resultado:** se exige consultar nuevamente.

##### 9.9.14.6. E06 — Falla de persistencia o auditoría

**Resultado:** no se declara la ejecución guardada.

#### 9.9.15. Reglas aplicables

1. `RF-042` gobierna consulta.
2. `RF-043` gobierna ejecución real.
3. Prescripción y ejecución son conceptos separados.
4. La ejecución se vincula a una versión activada.
5. Consultar no equivale a ejecutar.
6. El asesorado registra lo realizado.
7. El profesional no reemplaza silenciosamente la evidencia.
8. Correcciones se realizan mediante `UC-E02`.
9. Campos técnicos pertenecen a 06.
10. UI y experiencia pertenecen a 10.

#### 9.9.16. Información utilizada o generada

##### 9.9.16.1. Utilizada

- identidad del asesorado;
- versión activada;
- instantánea;
- sesión o unidad;
- autorización.

##### 9.9.16.2. Generada

- ejecución real;
- relación con la prescripción;
- fecha;
- autoría;
- estado de registro;
- evento de auditoría.

#### 9.9.17. Requisitos relacionados

##### 9.9.17.1. RF

- `RF-042 — Consultar plan de entrenamiento en APK`
- `RF-043 — Registrar ejecución real`
- `RF-044 — Corregir ejecución con trazabilidad`, mediante `UC-E02`
- `RF-021 — Evaluar autorización contextual`

##### 9.9.17.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 9.9.18. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 9.9.19. Casos extendidos

- `UC-E02 — Corregir ejecución de entrenamiento`

#### 9.9.20. Puntos de auditoría

- asesorado;
- profesional relacionado;
- versión;
- sesión o unidad;
- consulta;
- ejecución;
- fecha;
- autoría;
- diferencia con prescripción;
- falla o conflicto.

#### 9.9.21. Decisiones o preguntas abiertas

1. Campos de ejecución: `DERIVAR 06`.
2. Borrador de registro: `DERIVAR 06/10`.
3. Corrección y visibilidad: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Experiencia APK: `DERIVAR 10`.
6. Pruebas de duplicados y offline parcial: `DERIVAR 11A`.

#### 9.9.22. Criterio de cierre

El caso termina cuando el asesorado consulta la versión correcta o registra una ejecución real separada de la prescripción, o cuando una excepción impide hacerlo sin inventar evidencia.

---

### 9.10. UC-E02 — Corregir ejecución de entrenamiento

#### 9.10.1. Código

`UC-E02`

#### 9.10.2. Tipo

Extensión de `UC-P17`.

#### 9.10.3. Nombre

**Corregir ejecución de entrenamiento**

#### 9.10.4. Objetivo

Permitir una rectificación posterior preservando el registro original y haciendo reconstruible qué cambió, quién lo cambió, cuándo y por qué.

#### 9.10.5. Condición de extensión

Existe una ejecución registrada y el actor autorizado identifica un error que admite corrección.

#### 9.10.6. Actor principal

Asesorado o profesional autorizado, según la política que defina el Documento 08.

#### 9.10.7. Precondiciones

1. Existe un registro original identificable.
2. El actor está autorizado.
3. La corrección puede relacionarse con el original.
4. El registro original no será sobrescrito.
5. El motivo puede registrarse.

#### 9.10.8. Flujo diferencial

1. El actor consulta la ejecución.
2. BE ejecuta `UC-I02`.
3. El actor selecciona corregir.
4. BE presenta el registro original.
5. El actor registra el dato corregido y el motivo.
6. BE muestra original y cambio propuesto.
7. El actor confirma.
8. BE verifica autorización y ausencia de conflicto.
9. BE ejecuta `UC-I12 — Registrar corrección trazable`.
10. `UC-I12` conserva el original y registra relación, actor, fecha y motivo.
11. BE registra el evento mediante `UC-I03`.
12. La vista efectiva identifica que existe corrección.
13. `UC-P18` puede consultar original y corrección según autorización.
14. La extensión finaliza.

#### 9.10.9. Variantes

##### 9.10.9.1. V01 — Corrección iniciada por asesorado

El asesorado corrige su propio registro.

**Resultado:** se conserva actor y motivo.

##### 9.10.9.2. V02 — Corrección por profesional autorizado

La política permite al profesional corregir o validar una rectificación.

**Resultado:** no se atribuye el dato corregido al asesorado; se conserva la autoría real.

##### 9.10.9.3. V03 — Nueva corrección sobre una corrección previa

Existe más de una rectificación.

**Resultado:** la cadena completa permanece reconstruible.

#### 9.10.10. Excepciones

##### 9.10.10.1. E01 — Registro original inexistente

**Resultado:** no se crea una corrección huérfana.

##### 9.10.10.2. E02 — Actor no autorizado

**Resultado:** BE deniega.

##### 9.10.10.3. E03 — Motivo ausente cuando es requerido

**Resultado:** no se confirma la corrección.

##### 9.10.10.4. E04 — Conflicto concurrente

**Resultado:** BE exige revisar la cadena vigente.

##### 9.10.10.5. E05 — Intento de sobrescritura o borrado

**Resultado:** BE impide la operación.

##### 9.10.10.6. E06 — Falla de persistencia o auditoría

**Resultado:** no se presenta la corrección como aplicada.

#### 9.10.11. Postcondiciones

1. El registro original existe.
2. Existe una corrección relacionada.
3. Se identifican actor, fecha y motivo.
4. La vista efectiva puede determinar el valor vigente.
5. La historia permanece reconstruible.
6. La revisión profesional puede considerar original y corrección.
7. El evento queda trazable.

#### 9.10.12. Garantías mínimas

- Corregir no sobrescribe.
- Corregir no borra.
- La autoría real se conserva.
- El motivo queda identificado cuando la política lo exige.
- Una corrección no modifica la prescripción.
- La corrección no se presenta como nueva ejecución independiente.
- Un fallo no produce una vista efectiva falsa.

#### 9.10.13. Reglas aplicables

1. `RF-044` gobierna la corrección.
2. El original es inmutable hacia atrás.
3. La corrección es una relación trazable.
4. Actor y fecha son obligatorios.
5. La política de quién puede corregir pertenece a 08.
6. La estructura pertenece a 06.
7. Contratos pertenecen a 09.
8. UI pertenece a 10.

#### 9.10.14. Información utilizada o generada

##### 9.10.14.1. Utilizada

- ejecución original;
- actor;
- autorización;
- cadena de correcciones;
- versión relacionada.

##### 9.10.14.2. Generada

- dato corregido;
- relación con original;
- motivo;
- actor;
- fecha;
- vista efectiva;
- evento de auditoría.

#### 9.10.15. Requisitos relacionados

- `RF-044`
- `RF-021`
- `RNF-DAT-003`
- `RNF-OBS-003`

#### 9.10.16. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 9.10.17. Puntos de auditoría

- original;
- corrección;
- actor;
- fecha;
- motivo;
- situación anterior;
- situación efectiva;
- conflicto;
- intento de sobrescritura;
- falla.

#### 9.10.18. Decisiones o preguntas abiertas

1. Actores habilitados: `DERIVAR 08`.
2. Ventana o política de corrección: `DERIVAR 08`.
3. Estructura de cadena: `DERIVAR 06`.
4. Contratos: `DERIVAR 09`.
5. Presentación de original/corrección: `DERIVAR 10`.
6. Escenarios exhaustivos: `DERIVAR 11A`.

#### 9.10.19. Criterio de cierre

La extensión termina cuando existe una corrección trazable sin pérdida del original, o cuando una excepción impide modificar la historia.

---

### 9.11. UC-P18 — Revisar evidencia y decidir continuidad de entrenamiento

#### 9.11.1. Código

`UC-P18`

#### 9.11.2. Nombre

**Revisar evidencia y decidir continuidad de entrenamiento**

#### 9.11.3. Objetivo

Permitir que un profesional de Entrenamiento cierre un período o ciclo mediante los patrones comunes `UC-I05` y `UC-I06`, vinculando ejecución real y correcciones a una decisión de continuidad o cierre.

#### 9.11.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe evidencia de ejecución correspondiente a un período o ciclo.
- **Fin:** existe revisión profesional válida y próxima acción o cierre, o una excepción impide producir un cierre falso.

#### 9.11.5. Actor principal

Profesional de Entrenamiento.

#### 9.11.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 9.11.7. Disparador

El profesional consulta una revisión pendiente o decide revisar la ejecución de entrenamiento.

#### 9.11.8. Precondiciones

1. El profesional posee Entrenamiento `VERIFICADO`.
2. Existe habilitación aplicable.
3. Existe vínculo y consentimiento vigentes.
4. `UC-I02` autoriza la operación.
5. Existe versión activada.
6. Existe un período o ciclo identificable.
7. Existe evidencia de ejecución real.
8. Correcciones aplicables pueden reconstruirse.
9. `UC-I05` y `UC-I06` están disponibles como patrones comunes.

#### 9.11.9. Postcondiciones de éxito

1. `UC-I05` registra una revisión profesional válida conforme a `DEC-043`.
2. La revisión referencia:
   - versión activada;
   - ejecución real;
   - correcciones relevantes;
   - período;
   - profesional.
3. Se utiliza uno de los seis resultados semánticos.
4. `UC-I06` aplica continuidad o cierre.
5. La progresión se expresa como `AJUSTAR` o `SUSTITUIR`.
6. No se sobrescribe la prescripción ni la ejecución.
7. Timeline y pendientes se actualizan.
8. El evento queda disponible para `UC-S01`.
9. UC-P18 no calcula TVCC-30.
10. El evento queda trazable.

#### 9.11.10. Garantías mínimas

- UC-P18 no redefine `DEC-043`.
- UC-P18 no duplica UC-I05 o UC-I06.
- Sin evidencia identificable no existe revisión válida.
- Abrir dashboard no constituye revisión.
- Visualizar ejecución no constituye revisión.
- Una nota aislada no constituye revisión.
- Modificar silenciosamente un plan no constituye revisión.
- Progresión no es un séptimo resultado.
- Una corrección no borra el original.
- La interpretación es no diagnóstica.
- Un fallo no cierra el ciclo.
- La continuidad preserva versiones.
- El profesional no modifica Nutrición.

#### 9.11.11. Flujo principal

1. El profesional accede a revisiones pendientes de Entrenamiento.
2. Selecciona asesorado y período.
3. BE ejecuta `UC-I02`.
4. BE presenta:
   - versión activada;
   - prescripción;
   - ejecución real;
   - correcciones trazables;
   - procedencia;
   - período.
5. El profesional selecciona la evidencia examinada.
6. Registra una interpretación breve no diagnóstica.
7. Selecciona uno de los seis resultados semánticos.
8. Registra fundamento.
9. Define próxima acción o cierre.
10. BE presenta un resumen.
11. El profesional confirma.
12. BE verifica contexto, versión y autorización.
13. BE invoca `UC-I05`.
14. BE invoca `UC-I06`.
15. BE registra mediante `UC-I03`.
16. BE actualiza timeline y pendientes.
17. BE deja disponible el evento para `UC-S01`.
18. El caso finaliza.

#### 9.11.12. Variantes

##### 9.11.12.1. V01 — Mantener

Se utiliza `MANTENER`.

**Resultado:** se conserva la versión vigente y se registra próxima acción.

##### 9.11.12.2. V02 — Progresar conservando estructura

La próxima acción modifica la planificación sin sustituirla completamente.

**Resultado:** se utiliza `AJUSTAR`.

##### 9.11.12.3. V03 — Progresar mediante versión sucesora

La próxima acción requiere una nueva planificación.

**Resultado:** se utiliza `SUSTITUIR`.

##### 9.11.12.4. V04 — Reprogramar revisión

Se utiliza `REPROGRAMAR_REVISION`.

**Resultado:** no se modifica silenciosamente el plan.

##### 9.11.12.5. V05 — Cambiar objetivo

Se utiliza `CAMBIAR_OBJETIVO`.

**Resultado:** se inicia una nueva versión de objetivo mediante `UC-P14`.

##### 9.11.12.6. V06 — Finalizar

Se utiliza `FINALIZAR`.

**Resultado:** se preservan evidencia, versiones y revisión.

##### 9.11.12.7. V07 — Iniciar nuevo bloque

Se utiliza `AJUSTAR` o `SUSTITUIR` según el efecto sobre la versión.

**Resultado:** no se crea un nuevo enum.

##### 9.11.12.8. V08 — Evidencia corregida

Existe `UC-E02`.

**Resultado:** la revisión puede considerar original y corrección sin perder la historia.

#### 9.11.13. Excepciones

##### 9.11.13.1. E01 — Evidencia insuficiente

**Resultado:** no se registra revisión válida.

##### 9.11.13.2. E02 — Solo visualización

**Resultado:** no se resuelve el pendiente.

##### 9.11.13.3. E03 — Nota aislada

**Resultado:** no se registra como revisión.

##### 9.11.13.4. E04 — Modificación silenciosa

**Resultado:** BE impide el cambio fuera de los casos de continuidad.

##### 9.11.13.5. E05 — Resultado fuera de taxonomía

**Resultado:** se rechaza.

##### 9.11.13.6. E06 — Progresión automática

Una regla intenta modificar el plan sin decisión profesional.

**Resultado:** BE no aplica la progresión.

##### 9.11.13.7. E07 — Conflicto entre ejecución original y corrección

**Resultado:** BE exige una cadena reconstruible antes de revisar.

##### 9.11.13.8. E08 — Profesional no autorizado

**Resultado:** BE deniega.

##### 9.11.13.9. E09 — Revocación concurrente

**Resultado:** BE deniega antes de confirmar.

##### 9.11.13.10. E10 — Falla de persistencia o auditoría

**Resultado:** no se cierra el ciclo.

#### 9.11.14. Reglas aplicables

1. `RF-045`, `RF-046` y `RF-056` gobiernan UC-P18.
2. UC-I05 define la revisión válida.
3. UC-I06 aplica continuidad o cierre.
4. Progresión se mapea a `AJUSTAR` o `SUSTITUIR`.
5. Solo existen seis resultados semánticos.
6. Evidencia real y correcciones permanecen reconstruibles.
7. La prescripción no se modifica silenciosamente.
8. La revisión es no diagnóstica.
9. UC-P18 produce eventos para RF-058, pero no calcula.
10. Estados y transiciones pertenecen a 06.
11. UI pertenece a 10.
12. Escenarios negativos pertenecen a 11A.

#### 9.11.15. Información utilizada o generada

##### 9.11.15.1. Utilizada

- profesional;
- asesorado;
- versión activada;
- prescripción;
- ejecución real;
- correcciones;
- período;
- objetivo;
- revisiones anteriores.

##### 9.11.15.2. Generada

- revisión válida mediante UC-I05;
- resultado;
- fundamento;
- próxima acción o cierre;
- continuidad mediante UC-I06;
- autoría;
- fecha;
- timeline;
- resolución de pendiente;
- evento para UC-S01.

#### 9.11.16. Requisitos relacionados

##### 9.11.16.1. RF principales

- `RF-045 — Revisar evidencia de entrenamiento`
- `RF-046 — Aplicar progresión, ajuste o cierre`
- `RF-056 — Registrar revisión profesional válida y próxima acción`

##### 9.11.16.2. RF relacionados

- `RF-044 — Corrección trazable`
- `RF-054 — Línea temporal`
- `RF-055 — Revisiones pendientes`
- `RF-058 — TVCC-30`, como consumidor analítico posterior.

##### 9.11.16.3. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 9.11.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`

#### 9.11.18. Casos relacionados

- `UC-P14`
- `UC-P15`
- `UC-P16`
- `UC-P17`
- `UC-E02`
- `UC-S01`

#### 9.11.19. Puntos de auditoría

- profesional;
- asesorado;
- período;
- versión;
- prescripción;
- ejecución;
- correcciones;
- evidencia seleccionada;
- resultado;
- fundamento;
- próxima acción o cierre;
- autoría;
- fecha;
- intento de progresión automática;
- intento de crear resultado paralelo;
- falla o concurrencia;
- disponibilidad para UC-S01.

#### 9.11.20. Decisiones o preguntas abiertas

1. Estados y transiciones: `DERIVAR 06`.
2. Estructura de progresión: `DERIVAR 06`.
3. Lectura histórica: `DERIVAR 08`.
4. Corrección de revisión: `DERIVAR 08`.
5. Contratos: `DERIVAR 09`.
6. Formulario: `DERIVAR 10`.
7. Contenido mínimo y pruebas: `DERIVAR 11A`.
8. Fórmula TVCC-30: `DERIVAR 06/12`.
9. Validación de DEC-043 antes de G4.

#### 9.11.21. Criterio de cierre

El caso termina cuando UC-I05 y UC-I06 registran una revisión válida y una continuidad o cierre trazables, o cuando una excepción impide cerrar falsamente el ciclo.

---

### 9.12. Historias de usuario prioritarias

#### 9.12.1. HU-11 — Planificar y activar entrenamiento

**Como** profesional de Entrenamiento  
**quiero** diseñar y activar una versión reproducible usando catálogo propio, carga manual o importación controlada  
**para** emitir una planificación trazable sin depender de wger.

##### 9.12.1.1. Criterios de aceptación

###### 9.12.1.1.1. Escenario 1 — Objetivo cubierto

**Dado** que registré una evaluación  
**cuando** establezco el objetivo de entrenamiento  
**entonces** BE conserva versión, fundamento, autoría y fecha  
**y** RF-064 queda cubierto.

###### 9.12.1.1.2. Escenario 2 — wger indisponible

**Dado** que wger no responde  
**cuando** continúo diseñando  
**entonces** BE informa la contingencia  
**y** permite catálogo propio o carga manual  
**y** registra el fallback.

###### 9.12.1.1.3. Escenario 3 — Activación reproducible

**Dado** que el plan es válido  
**cuando** lo activo  
**entonces** BE preserva una instantánea reproducible  
**y** el asesorado consulta exactamente esa versión.

###### 9.12.1.1.4. Escenario 4 — Capacidad excedida

**Dado** que la activación abriría un proceso nuevo por encima de la capacidad  
**cuando** intento confirmar  
**entonces** BE rechaza el proceso nuevo  
**y** no interrumpe procesos vigentes.

---

#### 9.12.2. HU-12 — Registrar y corregir ejecución real

**Como** asesorado  
**quiero** registrar lo que efectivamente hice y corregir errores sin borrar el original  
**para** aportar evidencia confiable al profesional.

##### 9.12.2.1. Criterios de aceptación

###### 9.12.2.1.1. Escenario 1 — Prescripción y ejecución separadas

**Dado** que consulto una sesión planificada  
**cuando** registro mi ejecución  
**entonces** BE conserva lo planificado y lo realizado como evidencias diferentes.

###### 9.12.2.1.2. Escenario 2 — Consulta sin ejecución

**Dado** que solo abrí la sesión  
**cuando** no confirmo un registro  
**entonces** BE no infiere que la ejecuté.

###### 9.12.2.1.3. Escenario 3 — Corrección trazable

**Dado** que guardé un dato incorrecto  
**cuando** lo corrijo  
**entonces** BE conserva el original  
**y** registra corrección, actor, fecha y motivo.

###### 9.12.2.1.4. Escenario 4 — Sobrescritura prohibida

**Dado** que existe una ejecución guardada  
**cuando** un actor intenta reemplazarla silenciosamente  
**entonces** BE impide la operación.

---

#### 9.12.3. HU-13 — Revisar y progresar con trazabilidad

**Como** profesional de Entrenamiento  
**quiero** revisar ejecución real mediante la definición común de DEC-043  
**para** determinar progresión, continuidad o cierre sin crear una taxonomía paralela.

##### 9.12.3.1. Criterios de aceptación

###### 9.12.3.1.1. Escenario 1 — Reutilización común

**Dado** que existe evidencia identificable  
**cuando** registro la revisión  
**entonces** UC-P18 invoca UC-I05 y UC-I06  
**y** no redefine sus reglas.

###### 9.12.3.1.2. Escenario 2 — Progresión como ajuste

**Dado** que la estructura se conserva  
**cuando** decido progresar  
**entonces** el resultado es `AJUSTAR`.

###### 9.12.3.1.3. Escenario 3 — Progresión como sustitución

**Dado** que se requiere una versión sucesora  
**cuando** decido progresar  
**entonces** el resultado es `SUSTITUIR`.

###### 9.12.3.1.4. Escenario 4 — Evento para TVCC-30

**Dado** que existe revisión válida y próxima acción o cierre  
**cuando** el ciclo queda registrado  
**entonces** el evento queda disponible para UC-S01  
**y** UC-P18 no calcula la métrica.

---

### 9.13. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Evaluación de entrenamiento | Parcial | `PRESERVAR + REFACTORIZAR` | Vincular profesional, período, procedencia y objetivo. |
| Objetivo de entrenamiento RF-064 | No evidenciado de extremo a extremo | `NO EVIDENCIADO` | Incorporar versión, fundamento, autoría y fecha. |
| Catálogo propio | Parcial | `PRESERVAR + REFACTORIZAR` | Mantener como base operativa. |
| wger E2E | No demostrado | `NO EVIDENCIADO` | Importación controlada, procedencia y fallback. |
| Plan por bloques y sesiones | Parcial | `REFACTORIZAR` | Versionar y separar contenido de estados técnicos. |
| Snapshot de activación | Parcial | `PRESERVAR + REFACTORIZAR` | Garantizar instantánea reproducible. |
| Ejecución real | Parcial | `REFACTORIZAR` | Separarla de la prescripción. |
| Corrección trazable | No evidenciada | `NO EVIDENCIADO` | Conservar original y cadena de correcciones. |
| Revisión DEC-043 | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Reutilizar UC-I05 y UC-I06. |
| Progresión trazable | Parcial o no evidenciada | `REFACTORIZAR / NO EVIDENCIADO` | Mapear a AJUSTAR/SUSTITUIR sin automatización. |

---

### 9.14. Revisión crítica consolidada

#### 9.14.1. Controles superados

1. UC-P18 invoca UC-I05 y UC-I06.
2. UC-P18 no redefine la revisión válida.
3. RF-064 está cubierto por UC-P14.
4. Prescripción y ejecución real están separadas.
5. UC-E02 conserva el original.
6. Ningún caso fija series, repeticiones, cargas o progresiones concretas.
7. wger usa importación controlada.
8. Toda importación conserva procedencia.
9. La caída de wger activa fallback observable.
10. UC-P14, UC-P15, UC-P16, UC-P17 y UC-P18 invocan UC-I02.
11. UC-E02 también invoca UC-I02.
12. La activación preserva instantánea reproducible.
13. Capacidad reutiliza la formulación aprobada.
14. Progresión se mapea a AJUSTAR o SUSTITUIR.
15. El glosario incorpora términos antes de propagarlos.
16. Jerarquía H1–H5 conforme.
17. Bloques de código balanceados.
18. No se fijan entidades, endpoints o pantallas.

#### 9.14.2. Autoverificación exigida

| Control | Resultado |
|---|---|
| UC-P18 invoca UC-I05 y UC-I06 | `CUMPLE` |
| RF-064 cubierto | `CUMPLE` |
| Sin series/repeticiones/cargas concretas | `CUMPLE` |
| wger con procedencia | `CUMPLE` |
| wger con fallback observable | `CUMPLE` |
| Cinco casos principales invocan UC-I02 | `CUMPLE` |
| UC-E02 invoca UC-I02 | `CUMPLE` |
| Corrección conserva original | `CUMPLE` |
| Instantánea reproducible | `CUMPLE` |
| Capacidad sin interrumpir vigentes | `CUMPLE` |
| Glosario completo | `CUMPLE` |
| Jerarquía normalizada | `CUMPLE` |

#### 9.14.3. Riesgos abiertos

##### 9.14.3.1. R-05-ENT-01 — Prescripción confundida con ejecución

**Control:** separación explícita en glosario, UC-P17 y pruebas.

##### 9.14.3.2. R-05-ENT-02 — Corrección como sobrescritura

**Control:** UC-E02 conserva original y cadena.

##### 9.14.3.3. R-05-ENT-03 — wger como dependencia crítica

**Control:** catálogo propio, carga manual y UC-I08.

##### 9.14.3.4. R-05-ENT-04 — Progresión automática

**Control:** UC-P18 exige decisión profesional y taxonomía común.

##### 9.14.3.5. R-05-ENT-05 — RF-064 omitido

**Control:** UC-P14 lo declara en objetivo, reglas y trazabilidad.

##### 9.14.3.6. R-05-ENT-06 — Snapshot reconstruido retrospectivamente

**Control:** UC-P16 no activa si no puede preservar instantánea.

##### 9.14.3.7. R-05-ENT-07 — Capacidad interrumpe procesos vigentes

**Control:** solo se rechaza proceso nuevo.

##### 9.14.3.8. R-05-ENT-08 — Ejecución inferida por uso de UI

**Control:** abrir o consultar no crea ejecución real.

#### 9.14.4. Veredicto

```text
BLOQUE 06 — CIRCUITO DE ENTRENAMIENTO:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS PRINCIPALES:
UC-P14, UC-P15, UC-P16, UC-P17, UC-P18

EXTENSIÓN:
UC-E02

RF PRINCIPALES:
RF-036 A RF-046, RF-064

RF TRANSVERSALES:
RF-021, RF-056, RF-058, RF-059, RF-060, RF-066

INTEGRACIÓN:
WGER P0 CON PROCEDENCIA Y FALLBACK

CIRCUITO:
CERRADO FUNCIONALMENTE

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 9.15. Decisiones del bloque

#### 9.15.1. Aprobadas y aplicadas

- evaluación y objetivo de entrenamiento;
- catálogo propio;
- wger con importación controlada;
- fallback manual;
- procedencia;
- planificación por bloques y sesiones;
- activación con instantánea reproducible;
- capacidad sin interrupción;
- ejecución real separada;
- corrección trazable;
- revisión mediante UC-I05;
- continuidad mediante UC-I06;
- progresión como AJUSTAR/SUSTITUIR.

#### 9.15.2. Provisionales

- códigos de casos;
- campos mínimos de evaluación;
- estructura de bloques, sesiones y ejecución;
- actores autorizados para corregir;
- representación de progresión;
- estados y transiciones.

#### 9.15.3. Pendientes derivados

- dominio y persistencia: `06`;
- adaptadores: `07`;
- autorización, corrección y retención: `08`;
- contratos: `09`;
- UI/UX: `10`;
- pruebas y datos: `11A`;
- trazabilidad y TVCC-30: `12`.

---

### 9.16. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. RF-064 está cubierto;
2. wger no es fuente única;
3. procedencia y fallback son obligatorios;
4. instantánea reproducible se preserva;
5. capacidad no interrumpe procesos vigentes;
6. prescripción y ejecución real están separadas;
7. corrección conserva original;
8. UC-P18 reutiliza UC-I05 y UC-I06;
9. progresión no crea un resultado semántico nuevo;
10. no se fijó contenido de entrenamiento.

---

### 9.17. Estado

```text
ARQUITECTURA:
v0.2.6

GLOSARIO:
v0.1.5

BLOQUE 05:
v0.7 — APTO

BLOQUE 06:
REDACTADO EN v0.8
REFACTORIZADO EN v0.8.1 CON UC-I12
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P14, UC-P15, UC-P16, UC-P17, UC-P18, UC-E02

INTEGRACIÓN:
WGER CON PROCEDENCIA Y FALLBACK

CIRCUITO DE ENTRENAMIENTO:
CERRADO FUNCIONALMENTE

GIT:
SIN CAMBIOS
```

#### 9.17.1. Siguiente acción recomendada

Revisar el Bloque 06. Después desarrollar Antropometría:

```text
UC-P19 — Registrar evaluación antropométrica
UC-E03 — Corregir evaluación antropométrica
UC-P20 — Consultar evolución antropométrica
UC-P21 — Publicar servicio antropométrico limitado
UC-P22 — Descubrir servicio y solicitar vínculo
```


---

---

## 10. Bloque 07 — Antropometría transversal y descubrimiento limitado

*Fuente ensamblada: `BE_LEG_05_v0.9_BLOQUE_07_ANTROPOMETRIA_Y_DESCUBRIMIENTO_LIMITADO.md`.*

### 10.1. Propósito del bloque

Este bloque define Antropometría como una capacidad transversal autorizada.

Cubre:

- registro de una evaluación antropométrica;
- identificación de protocolo, autor, fecha y unidades;
- separación entre mediciones directas y cálculos derivados;
- cálculos reproducibles;
- corrección trazable con recálculo de derivados;
- consulta de evolución longitudinal;
- publicación limitada de servicios;
- ubicación utilizable;
- lista y mapa con fallback;
- consulta de perfil y credenciales;
- solicitud de vínculo desde descubrimiento.

No crea:

- una tercera especialidad;
- un circuito de plan activado;
- una revisión profesional equivalente a `UC-P13` o `UC-P18`;
- un marketplace;
- una agenda;
- una contratación;
- una lógica clínica o diagnóstica.

---

### 10.2. Decisiones funcionales aplicadas

#### 10.2.1. Capacidad transversal

```text
Antropometría
= capacidad transversal
≠ especialidad de Nutrición
≠ especialidad de Entrenamiento
≠ tercera especialidad
```

`DEC-044` permite una identidad profesional con únicamente capacidad antropométrica `VERIFICADA`.

Esa identidad puede:

- publicar un servicio limitado;
- solicitar o recibir vínculo;
- registrar mediciones autorizadas;
- emitir cálculos reproducibles;
- consultar evolución autorizada.

No puede operar Nutrición o Entrenamiento por esa capacidad.

#### 10.2.2. Registro antropométrico

```text
medición antropométrica directa
≠ cálculo antropométrico derivado
≠ interpretación clínica
```

Toda evaluación debe hacer identificables:

- protocolo;
- autor;
- fecha;
- unidades;
- mediciones directas;
- método y versión de cada cálculo derivado;
- procedencia;
- correcciones.

Documento 05 exige que estos elementos sean observables, pero no fija protocolos, fórmulas ni unidades concretas.

#### 10.2.3. Cálculo reproducible

```text
entradas identificadas
+
método identificado
+
versión identificada
→ resultado derivado reproducible
```

Un cálculo:

- no reemplaza la medición directa;
- no se presenta como dato observado;
- no produce diagnóstico;
- conserva relación con sus entradas;
- genera una nueva versión cuando cambia el método o una entrada.

#### 10.2.4. Corrección común y conducta antropométrica

```text
UC-I12
→ conserva original
→ registra actor, fecha y motivo
→ mantiene cadena reconstruible

UC-E03
→ aplica UC-I12
→ identifica mediciones afectadas
→ invoca UC-I09
→ recalcula derivados dependientes
→ conserva resultados anteriores
```

El patrón común se comparte con `UC-E02`. El recálculo es específico de Antropometría.

#### 10.2.5. Evolución sin revisión de especialidad

La evolución antropométrica:

- compara períodos;
- diferencia mediciones y cálculos;
- informa métodos, unidades y limitaciones;
- puede ser consultada por actores autorizados;
- no crea un plan;
- no exige activación;
- no constituye por sí sola una revisión profesional válida;
- no produce continuidad o cierre de especialidad;
- no infiere causalidad.

#### 10.2.6. Publicación limitada

La publicación exige:

1. identidad activa;
2. credencial o capacidad antropométrica declarada y validada;
3. servicio habilitado;
4. ubicación utilizable;
5. autorización para publicar;
6. estado profesional válido.

Estas condiciones permiten una identidad exclusivamente antropométrica.

#### 10.2.7. Exclusiones taxativas de marketplace

`UC-P21` y `UC-P22` no incorporan:

- reservas;
- turnos;
- pagos;
- comisiones;
- rankings;
- reputación;
- reseñas;
- ordenamiento por popularidad;
- contratación automática;
- contratación dentro de BE;
- patrocinio;
- marketplace general.

#### 10.2.8. Descubrimiento y vínculo

```text
descubrir servicio
→ consultar perfil y credenciales públicas
→ solicitar vínculo mediante UC-E04
→ UC-P04 crea solicitud pendiente
→ UC-P05 exige aceptación expresa
→ UC-P07 exige consentimiento
→ UC-I02 evalúa autorización
```

Descubrir no concede acceso.

---

### 10.3. Actores

| Actor | Responsabilidad |
|---|---|
| **Profesional con capacidad antropométrica** | Registra evaluaciones, publica servicio cuando es elegible, corrige registros dentro de la política y consulta evolución autorizada. |
| **Asesorado** | Consulta su evolución autorizada, descubre servicios publicados y puede iniciar una solicitud de vínculo. |
| **Sistema BE** | Evalúa autorización, verifica condiciones de publicación, ejecuta cálculos reproducibles, conserva historia, aplica fallback y evita funciones de marketplace. |
| **Proveedor cartográfico** | Representa ubicación cuando está disponible; no determina elegibilidad profesional. |

---

### 10.4. Relaciones internas

```text
UC-P19 — Registrar evaluación antropométrica
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  incluye → UC-I09 — Emitir cálculos antropométricos reproducibles
  incluye → UC-I10 — Verificar habilitación y capacidad
  puede ser extendido por → UC-E03 — Corregir evaluación antropométrica

UC-E03 — Corregir evaluación antropométrica
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I12 — Registrar corrección trazable
  incluye cuando corresponde → UC-I09

UC-P20 — Consultar evolución antropométrica
  incluye → UC-I02
  incluye → UC-I03
  puede originar → UC-E03

UC-P21 — Publicar servicio antropométrico limitado
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I10

UC-P22 — Descubrir servicio antropométrico
  incluye → UC-I02
  incluye → UC-I08 — Aplicar fallback manual
  puede ser extendido por → UC-E04

UC-E04 — Solicitar vínculo desde descubrimiento antropométrico
  incluye → UC-I02
  incluye → UC-I03
  invoca → UC-P04 — Solicitar o invitar a un vínculo

UC-I12 — Registrar corrección trazable
  es incluido por → UC-E02 y UC-E03
```

---

### 10.5. Frontera de responsabilidad

| Tema | Propietario |
|---|---|
| Conducta observable de registro, cálculo, comparación, publicación y descubrimiento | Documento 05 |
| Protocolos, fórmulas, unidades, precisión, dependencias y persistencia | Documento 06 |
| Proveedor cartográfico, adaptadores y despliegue | Documento 07 |
| Acceso, visibilidad, corrección, publicación y ubicación | Documento 08 |
| Contratos, errores, concurrencia e idempotencia | Documento 09 |
| Formularios, visualizaciones, lista, mapa y copy | Documento 10 |
| Escenarios negativos, reproducibilidad y pruebas E2E | Documento 11A |
| Trazabilidad RF–UC–datos–pruebas | Documento 12 |

---

### 10.6. UC-P19 — Registrar evaluación antropométrica

#### 10.6.1. Código

`UC-P19`

#### 10.6.2. Nombre

**Registrar evaluación antropométrica**

#### 10.6.3. Objetivo

Permitir que un profesional con capacidad antropométrica registre una evaluación autorizada, diferenciando mediciones directas y cálculos derivados y preservando protocolo, autoría, fecha, unidades y procedencia.

#### 10.6.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** existe un asesorado y un propósito antropométrico autorizados.
- **Fin:** existe una evaluación reconstruible o una excepción impide registrarla sin producir datos falsos.

#### 10.6.5. Actor principal

Profesional con capacidad antropométrica.

#### 10.6.6. Actores secundarios

- Asesorado.
- Sistema BE.

#### 10.6.7. Disparador

El profesional inicia o continúa una evaluación antropométrica.

#### 10.6.8. Precondiciones

1. La identidad profesional está activa.
2. La capacidad antropométrica se encuentra `VERIFICADA`.
3. Existe habilitación aplicable.
4. Existe vínculo aceptado para el alcance.
5. Existe consentimiento antropométrico vigente.
6. `UC-I02` autoriza la operación.
7. `UC-I10` confirma condiciones de habilitación y capacidad aplicables.
8. El asesorado puede identificarse.
9. El protocolo utilizado puede identificarse.
10. La fecha y la autoría pueden identificarse.
11. Las unidades utilizadas pueden identificarse.
12. La operación no presupone Nutrición o Entrenamiento.

#### 10.6.9. Postcondiciones de éxito

1. Existe una evaluación antropométrica identificable.
2. La evaluación relaciona:
   - asesorado;
   - profesional;
   - capacidad;
   - protocolo;
   - fecha;
   - autoría;
   - procedencia.
3. Cada medición directa:
   - está identificada;
   - conserva su unidad;
   - se diferencia de un cálculo.
4. Cada cálculo derivado:
   - identifica entradas;
   - identifica método;
   - identifica versión;
   - conserva el resultado;
   - se diferencia de una medición.
5. `UC-I09` preserva reproducibilidad.
6. La evaluación queda disponible para `UC-P20`.
7. No se crea un diagnóstico.
8. No se activa un plan.
9. No se crea una revisión profesional de especialidad.
10. El evento queda trazable.

#### 10.6.10. Garantías mínimas

- Antropometría no se presenta como especialidad.
- Un profesional exclusivamente antropométrico puede registrar si cumple las condiciones.
- No existe medición sin autoría y fecha.
- No existe medición interpretable sin unidad identificable.
- No existe cálculo sin entradas, método y versión.
- Un cálculo no sobrescribe la medición.
- Una medición no se presenta como cálculo.
- No se fijan protocolos concretos.
- No se fijan fórmulas.
- No se fijan unidades concretas.
- No se infiere diagnóstico.
- No se infiere causalidad.
- Un dato ausente no se inventa.
- Un fallo no presenta evaluación exitosa.
- Una corrección posterior utiliza `UC-E03`.

#### 10.6.11. Flujo principal

1. El profesional selecciona al asesorado.
2. BE ejecuta `UC-I02`.
3. BE ejecuta `UC-I10`.
4. El profesional inicia una evaluación.
5. BE identifica profesional, asesorado, capacidad, fecha y propósito.
6. El profesional identifica el protocolo utilizado.
7. El profesional registra mediciones directas.
8. Para cada medición, BE exige una unidad identificable.
9. BE conserva autoría y procedencia.
10. El profesional selecciona o confirma los cálculos derivados aplicables.
11. BE ejecuta `UC-I09`.
12. BE presenta una separación visible entre:
    - mediciones directas;
    - cálculos derivados.
13. El profesional revisa el resumen.
14. El profesional confirma.
15. BE verifica que el contexto y la autorización continúen vigentes.
16. BE preserva la evaluación.
17. BE registra auditoría mediante `UC-I03`.
18. La evaluación queda disponible para evolución.
19. El caso finaliza.

#### 10.6.12. Variantes

##### 10.6.12.1. V01 — Solo mediciones directas

No corresponde emitir cálculos.

**Resultado:** la evaluación puede guardarse con mediciones identificables sin inventar resultados derivados.

##### 10.6.12.2. V02 — Mediciones y cálculos

Existen entradas suficientes y método aplicable.

**Resultado:** `UC-I09` emite resultados derivados reproducibles.

##### 10.6.12.3. V03 — Profesional exclusivamente antropométrico

El actor no posee Nutrición ni Entrenamiento verificadas.

**Resultado:** la evaluación puede registrarse conforme a `DEC-044`.

##### 10.6.12.4. V04 — Evaluación retomada

La política permite guardar un borrador.

**Resultado:** no se presenta como evaluación completa; estructura y visibilidad se derivan a `06/10`.

##### 10.6.12.5. V05 — Método no disponible o no identificable

Las mediciones pueden registrarse, pero el cálculo no puede emitirse.

**Resultado:** BE conserva las mediciones y explica la ausencia de resultado derivado.

##### 10.6.12.6. V06 — Información previa autorizada

El profesional consulta antecedentes pertinentes.

**Resultado:** la procedencia se conserva y no se reasigna autoría.

#### 10.6.13. Excepciones

##### 10.6.13.1. E01 — Capacidad no verificada

**Resultado:** BE deniega la operación.

##### 10.6.13.2. E02 — Vínculo, consentimiento o autorización insuficientes

**Resultado:** BE deniega sin revelar información protegida.

##### 10.6.13.3. E03 — Protocolo no identificable

**Resultado:** la evaluación no se confirma como completa.

##### 10.6.13.4. E04 — Autoría o fecha ausentes

**Resultado:** no se confirma.

##### 10.6.13.5. E05 — Unidad no identificable

**Resultado:** la medición no se confirma como utilizable.

##### 10.6.13.6. E06 — Cálculo sin método o versión

**Resultado:** no se emite el resultado derivado.

##### 10.6.13.7. E07 — Entradas insuficientes

**Resultado:** se conservan las mediciones válidas y no se inventa el cálculo.

##### 10.6.13.8. E08 — Conflicto concurrente

**Resultado:** BE exige revisar nuevamente.

##### 10.6.13.9. E09 — Revocación concurrente

**Resultado:** BE detiene la operación.

##### 10.6.13.10. E10 — Falla de persistencia o auditoría

**Resultado:** no se presenta la evaluación como guardada.

#### 10.6.14. Reglas aplicables

1. `RF-047` gobierna el registro.
2. `RF-048` gobierna los cálculos.
3. Medición directa y cálculo derivado permanecen separados.
4. Protocolo, autor, fecha y unidades deben ser identificables.
5. UC-I09 gobierna reproducibilidad.
6. Antropometría es capacidad transversal.
7. DEC-044 admite operación independiente.
8. No se crea un ciclo de plan.
9. No se crea una revisión profesional paralela.
10. Protocolos, fórmulas y unidades concretas pertenecen a 06.
11. UI pertenece a 10.
12. Pruebas de reproducibilidad pertenecen a 11A.

#### 10.6.15. Información utilizada o generada

##### 10.6.15.1. Utilizada

- identidad profesional;
- capacidad y habilitación;
- vínculo;
- consentimiento;
- asesorado;
- protocolo;
- fecha;
- unidades;
- antecedentes autorizados;
- método de cálculo identificable.

##### 10.6.15.2. Generada

- evaluación;
- mediciones directas;
- cálculos derivados;
- referencias de método y versión;
- autoría;
- fecha;
- procedencia;
- evento de auditoría.

#### 10.6.16. Requisitos relacionados

##### 10.6.16.1. RF

- `RF-047 — Registrar evaluación antropométrica autorizada`
- `RF-048 — Emitir cálculos antropométricos reproducibles`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`
- `RF-066 — Verificar habilitación y capacidad`

##### 10.6.16.2. RNF conductuales

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 10.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I09 — Emitir cálculos antropométricos reproducibles`
- `UC-I10 — Verificar habilitación y capacidad`

#### 10.6.18. Casos extendidos

- `UC-E03 — Corregir evaluación antropométrica`

#### 10.6.19. Puntos de auditoría

- profesional;
- asesorado;
- capacidad;
- protocolo;
- fecha;
- unidades identificadas;
- mediciones;
- cálculos;
- método;
- versión;
- entradas;
- procedencia;
- autorización;
- falla o conflicto.

#### 10.6.20. Decisiones o preguntas abiertas

1. Protocolos: `DERIVAR 06`.
2. Fórmulas y versiones: `DERIVAR 06`.
3. Unidades y conversiones: `DERIVAR 06`.
4. Precisión y redondeo: `DERIVAR 06`.
5. Corrección y visibilidad: `DERIVAR 08`.
6. Contratos: `DERIVAR 09`.
7. Formulario: `DERIVAR 10`.
8. Pruebas reproducibles: `DERIVAR 11A`.

#### 10.6.21. Criterio de cierre

El caso termina cuando existe una evaluación reconstruible con mediciones y cálculos claramente diferenciados, o cuando una excepción impide registrarla sin inventar información.

---

### 10.7. UC-I09 — Emitir cálculos antropométricos reproducibles

#### 10.7.1. Código

`UC-I09`

#### 10.7.2. Tipo

Caso incluido específico de Antropometría que **especializa e invoca `UC-I13`**.

#### 10.7.3. Objetivo

Aplicar el patrón transversal `UC-I13` a cálculos derivados antropométricos a partir de mediciones directas identificables, conservando las garantías específicas de protocolo, unidad, dependencias y separación `medición directa ≠ resultado derivado`, sin fijar fórmulas concretas en Documento 05.

#### 10.7.4. Precondiciones

1. El contexto invocante fue autorizado mediante `UC-I02`.
2. Existen mediciones directas identificables.
3. Cada entrada conserva unidad y procedencia.
4. El protocolo de medición puede identificarse.
5. Existe un método/version aplicable para la finalidad antropométrica.
6. Las entradas requeridas por ese método son admisibles.
7. El resultado puede diferenciarse de una medición directa.

#### 10.7.5. Flujo incluido

1. Recibe las mediciones directas, sus unidades, protocolo y procedencia.
2. Identifica la finalidad antropométrica aplicable.
3. Invoca `UC-I13` con:
   - método y versión;
   - inputs antropométricos;
   - procedencia;
   - finalidad.
4. `UC-I13` verifica requisitos/admisibilidad y ejecuta el cálculo reproducible.
5. UC-I09 recibe el resultado y lo etiqueta inequívocamente como **derivado antropométrico**.
6. Relaciona el resultado con las mediciones directas y protocolo que correspondan.
7. Conserva resultados anteriores ante cambios de entrada, método o versión.
8. Devuelve el resultado especializado al caso invocante.

#### 10.7.6. Variantes

##### 10.7.6.1. V01 — Varias salidas derivadas

Un conjunto de mediciones admite más de un resultado antropométrico.

**Resultado:** cada salida conserva método, versión, inputs y dependencias sin promedio silencioso.

##### 10.7.6.2. V02 — Método sucesor

Existe una nueva versión metodológica.

**Resultado:** se ejecuta como nueva corrida mediante `UC-I13`; no sobrescribe resultados anteriores.

##### 10.7.6.3. V03 — Recálculo por corrección

`UC-E03` corrige una medición directa.

**Resultado:** se ejecuta una nueva corrida afectada y se preserva la anterior.

##### 10.7.6.4. V04 — Medición anulada

`UC-E03` anula una medición directa conforme a la semántica futura de `06 / M-09`.

**Resultado:** UC-I09 no reutiliza silenciosamente la medición anulada como input efectivo; los resultados dependientes se reevaluarán conforme a dependencias y suficiencia definidas en 06.

#### 10.7.7. Excepciones

##### 10.7.7.1. E01 — Entrada ausente

**Resultado:** no se emite un cálculo inventado.

##### 10.7.7.2. E02 — Unidad o protocolo no identificables

**Resultado:** no se emite un resultado antropométrico utilizable.

##### 10.7.7.3. E03 — Método o versión ausentes

**Resultado:** no se emite.

##### 10.7.7.4. E04 — Procedencia no admisible

**Resultado:** `UC-I13` rechaza la ejecución; disponibilidad del dato no equivale a admisibilidad.

##### 10.7.7.5. E05 — Resultado no reproducible

**Resultado:** el cálculo se considera fallido y no se presenta como válido.

##### 10.7.7.6. E06 — Dependencia no reconstruible

**Resultado:** no se presenta una evolución recalculada como completa.

##### 10.7.7.7. E07 — Falla de persistencia o auditoría

**Resultado:** no se registra una salida sin relaciones reconstruibles.

#### 10.7.8. Garantías mínimas

- `UC-I13` es la única definición transversal de ejecución reproducible.
- UC-I09 agrega únicamente garantías antropométricas.
- El cálculo no modifica mediciones directas.
- El resultado se etiqueta como derivado.
- Método y versión son obligatorios.
- Inputs, unidades, protocolo y procedencia son reconstruibles.
- Cambios generan un nuevo resultado.
- Resultados anteriores se conservan.
- Un dato disponible no se convierte automáticamente en input admisible.
- No se fija una fórmula.
- No se fija una unidad concreta.
- No se produce diagnóstico.
- No se interpreta causalidad.
- Un cálculo/sugerencia/referencia no decide un objetivo profesional.

#### 10.7.9. Requisitos relacionados

- `RF-048`
- `RF-050`, cuando se invoca desde `UC-E03`
- `RF-070`, por especialización del patrón común
- `RNF-DAT-003`
- `RNF-OBS-003`

#### 10.7.10. Invocado por

- `UC-P19`;
- `UC-E03`.

#### 10.7.11. Caso incluido

- `UC-I13 — Ejecutar y adoptar cálculo profesional reproducible`.

#### 10.7.12. Puntos de auditoría

- invocante;
- mediciones directas;
- protocolo;
- unidades;
- procedencia;
- método;
- versión;
- inputs efectivos;
- resultado;
- fecha;
- recálculo;
- relación con resultados anteriores;
- error.

#### 10.7.13. Decisiones o preguntas abiertas

1. Fórmulas y especificaciones: `DERIVAR 06`.
2. Dependencias entre inputs y resultados: `DERIVAR 06`.
3. Precisión/redondeo: `DERIVAR 06`.
4. Semántica de anulación: `DERIVAR 06 / M-09`.
5. Contratos: `DERIVAR 09`.
6. Pruebas: `DERIVAR 11A`.

#### 10.7.14. Criterio de cierre

El caso termina cuando `UC-I13` produce un resultado reproducible que UC-I09 puede identificar correctamente como derivado antropométrico y relacionar con sus mediciones/protocolo, o cuando se rechaza sin producir un cálculo falso.

---

### 10.8. UC-E03 — Corregir o anular medición antropométrica

#### 10.8.1. Código

`UC-E03`

#### 10.8.2. Tipo

Extensión de `UC-P19` y `UC-P20`.

#### 10.8.3. Nombre

**Corregir o anular medición antropométrica**

#### 10.8.4. Objetivo

Permitir que un profesional autorizado **corrija o anule** una medición antropométrica conforme a `RF-050`, preservando siempre el original, actor, fecha, motivo e historia y evitando que una anulación se materialice como borrado.

#### 10.8.5. Condición de extensión

Existe una evaluación antropométrica registrada y el profesional identifica:

- un error o metadato que admite **corrección**; o
- una medición que debe declararse **anulada/no efectiva** conforme a la semántica que definirá `06 / M-09`.

#### 10.8.6. Actor principal

Profesional autor o profesional autorizado según la política aplicable.

#### 10.8.7. Actores secundarios

- Asesorado.
- Sistema BE.

#### 10.8.8. Precondiciones

1. Existe una evaluación original identificable.
2. El actor posee capacidad antropométrica.
3. `UC-I02` autoriza la operación.
4. La medición o metadato original puede identificarse.
5. El motivo puede registrarse.
6. La historia puede preservarse mediante `UC-I03`.
7. Para la rama de corrección, `UC-I12` puede preservar la cadena.
8. Si la operación afecta una entrada de cálculo, pueden identificarse los derivados dependientes o declararse la imposibilidad de reconstruirlos.

#### 10.8.9. Postcondiciones de éxito

1. El original permanece preservado.
2. La acción queda tipificada funcionalmente como:
   - corrección; o
   - anulación.
3. Se identifican:
   - actor;
   - fecha;
   - motivo;
   - elemento afectado.
4. La vista efectiva puede reconstruirse sin borrar historia.
5. En corrección:
   - existe una corrección relacionada;
   - `UC-I12` preserva la cadena;
   - si cambia una entrada, `UC-I09` emite nuevas salidas afectadas.
6. En anulación:
   - la medición original permanece;
   - deja de presentarse como entrada efectiva vigente para usos que `06 / M-09` determine;
   - `anulada ≠ borrada`;
   - los derivados dependientes no permanecen silenciosamente como vigentes si la anulación afecta su suficiencia.
7. Ninguna rama cambia otra evaluación implícitamente.
8. La autoría original no se reasigna.
9. El evento queda trazable mediante `UC-I03`.

#### 10.8.10. Garantías mínimas

- Corregir no sobrescribe.
- Anular no borra.
- El original permanece reconstruible según autorización.
- Actor, fecha y motivo son identificables.
- La cadena histórica es reconstruible.
- Una corrección de input genera recálculo derivado cuando corresponde.
- Una anulación obliga a reevaluar el efecto sobre dependencias; no conserva por inercia un derivado inválido.
- Un recálculo no elimina resultados anteriores.
- La acción no crea una nueva especialidad.
- Una corrección no se presenta como nueva toma independiente.
- Una anulación no se presenta como si la medición nunca hubiera existido.
- Un fallo no produce una vista efectiva falsa.

#### 10.8.11. Flujo diferencial

1. El actor consulta una evaluación o evolución.
2. Selecciona la medición/metadato afectado.
3. BE ejecuta `UC-I02`.
4. BE presenta el original.
5. El actor elige explícitamente:
   - `CORREGIR`; o
   - `ANULAR`.
6. El actor registra el motivo.
7. BE presenta efectos conocidos sobre cálculos/evolución.
8. El actor confirma.
9. BE verifica autorización y ausencia de conflicto.
10. **Si corrige:**
    - registra valor/metadato corregido;
    - ejecuta `UC-I12`;
    - si cambia un input, ejecuta `UC-I09`.
11. **Si anula:**
    - conserva el original;
    - registra el evento de anulación y su motivo mediante `UC-I03`;
    - no borra ni sobrescribe;
    - deriva a `06 / M-09 / REG-06-16.4` el estado/condición efectiva y el tratamiento exacto de dependencias.
12. BE conserva resultados anteriores y agrega/reclasifica únicamente lo que corresponda conforme a dominio.
13. BE actualiza la vista efectiva sin falsificar historia.
14. La extensión finaliza.

#### 10.8.12. Variantes

##### 10.8.12.1. V01 — Corrección de medición directa

**Resultado:** se conserva la medición original y se recalculan derivados dependientes.

##### 10.8.12.2. V02 — Corrección de metadato

Cambia información identificadora sin alterar una entrada de cálculo.

**Resultado:** se aplica `UC-I12`; no se recalculan resultados no afectados.

##### 10.8.12.3. V03 — Corrección de unidad identificada

La política permite corregir la unidad asociada.

**Resultado:** se preserva el original y se recalculan derivados conforme a 06.

##### 10.8.12.4. V04 — Cadena de correcciones

Existe una corrección previa.

**Resultado:** la nueva corrección se agrega sin perder ninguna versión.

##### 10.8.12.5. V05 — Anular medición directa

El profesional autorizado determina que una medición registrada no debe continuar operando como entrada efectiva.

**Resultado:** la medición se conserva históricamente, queda declarada anulada/no efectiva según semántica de `06 / M-09`, se registra actor/fecha/motivo y se reevaluan sus dependencias sin borrado.

#### 10.8.13. Excepciones

##### 10.8.13.1. E01 — Original inexistente

**Resultado:** no se crea una corrección o anulación huérfana.

##### 10.8.13.2. E02 — Actor no autorizado

**Resultado:** BE deniega.

##### 10.8.13.3. E03 — Motivo ausente cuando es obligatorio

**Resultado:** no se confirma.

##### 10.8.13.4. E04 — Dependencia de cálculo no identificable

**Resultado:** la acción puede quedar trazada si la política lo permite, pero BE no presenta evolución/derivados afectados como completamente recalculados.

##### 10.8.13.5. E05 — Método no reproducible

**Resultado:** la corrección/anulación se preserva según corresponda, pero un nuevo cálculo no se declara válido.

##### 10.8.13.6. E06 — Conflicto concurrente

**Resultado:** BE exige revisar la cadena vigente.

##### 10.8.13.7. E07 — Intento de sobrescritura o borrado

**Resultado:** BE impide la operación.

##### 10.8.13.8. E08 — Anulación repetida o estado incompatible

**Resultado:** BE no produce un segundo efecto silencioso; semántica exacta y transición: `DERIVAR 06 / M-09`.

##### 10.8.13.9. E09 — Falla de persistencia o auditoría

**Resultado:** no se presenta la acción como aplicada.

#### 10.8.14. Reglas aplicables

1. `RF-050` gobierna **corregir o anular** una medición.
2. `UC-I12` gobierna únicamente la rama de corrección común.
3. `UC-I03` preserva historia/auditoría en ambas ramas.
4. `UC-I09` gobierna recálculo cuando corresponde.
5. El original se preserva.
6. La autoría real se conserva.
7. Los resultados previos se preservan como historia.
8. `anulación ≠ borrado`.
9. El estado/condición efectiva de anulación pertenece a `06 / M-09`, utilizando el mecanismo permitido por `REG-06-16.4`.
10. `B-06` no se reabre.
11. Actores/política pertenecen a 08.
12. Contratos pertenecen a 09.
13. UI pertenece a 10.

#### 10.8.15. Información utilizada o generada

##### 10.8.15.1. Utilizada

- evaluación original;
- medición o metadato;
- cálculos dependientes;
- método y versión;
- actor;
- autorización;
- cadena previa.

##### 10.8.15.2. Generada

- tipo de acción: corrección/anulación;
- corrección, cuando corresponda;
- evento de anulación, cuando corresponda;
- motivo;
- actor;
- fecha;
- relación con original;
- resultados recalculados/reclasificados cuando corresponda;
- relación con resultados anteriores;
- vista efectiva;
- evento de auditoría.

#### 10.8.16. Requisitos relacionados

- `RF-050`
- `RF-048`
- `RF-021`
- `RNF-DAT-003`
- `RNF-OBS-003`

#### 10.8.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I12 — Registrar corrección trazable`, solo en la rama de corrección.
- `UC-I09 — Emitir cálculos antropométricos reproducibles`, cuando corresponda.

#### 10.8.18. Puntos de auditoría

- evaluación original;
- elemento original;
- acción elegida;
- corrección o anulación;
- actor;
- fecha;
- motivo;
- cálculos afectados;
- método;
- versión;
- resultados anteriores;
- resultados nuevos/reclasificados;
- vista efectiva;
- conflicto o falla.

#### 10.8.19. Decisiones o preguntas abiertas

1. Actores autorizados y política de anulación: `DERIVAR 08`.
2. Estado/condición efectiva y dependencias: `DERIVAR 06 / M-09 / REG-06-16.4`.
3. Conversión de unidades: `DERIVAR 06`.
4. Contratos: `DERIVAR 09`.
5. UI/copy de anulación: `DERIVAR 10`.
6. Pruebas: `DERIVAR 11A`.

#### 10.8.20. Criterio de cierre

La extensión termina cuando la corrección o anulación queda trazada sin pérdida del original y sus efectos conocidos no falsean resultados/evolución, o cuando una excepción impide modificar la vista efectiva de forma segura.

---

### 10.9. UC-I12 — Registrar corrección trazable

#### 10.9.1. Código

`UC-I12`

#### 10.9.2. Tipo

Caso incluido común a Entrenamiento y Antropometría.

#### 10.9.3. Objetivo

Registrar una corrección posterior preservando el dato original y haciendo reconstruible qué cambió, quién lo cambió, cuándo y por qué.

#### 10.9.4. Precondiciones

1. El caso invocante ejecutó `UC-I02`.
2. Existe un original identificable.
3. Existe una corrección propuesta.
4. El actor puede identificarse.
5. La fecha puede identificarse.
6. El motivo se registra cuando la política lo exige.
7. La corrección puede relacionarse con el original.

#### 10.9.5. Flujo incluido

1. Recibe el original.
2. Recibe la corrección.
3. Recibe actor, fecha y motivo.
4. Verifica que el original permanezca preservado.
5. Crea una relación de corrección.
6. Vincula la corrección con la cadena anterior.
7. Determina una vista efectiva reconstruible.
8. Registra auditoría.
9. Devuelve la relación al caso invocante.

#### 10.9.6. Variantes

##### 10.9.6.1. V01 — Primera corrección

**Resultado:** se crea la primera relación con el original.

##### 10.9.6.2. V02 — Corrección sucesiva

**Resultado:** la cadena completa permanece reconstruible.

##### 10.9.6.3. V03 — Corrección por actor diferente

La política permite que otro actor autorizado corrija.

**Resultado:** se conserva la autoría real de cada evento.

#### 10.9.7. Excepciones

##### 10.9.7.1. E01 — Original ausente

**Resultado:** no se crea una corrección huérfana.

##### 10.9.7.2. E02 — Relación no reconstruible

**Resultado:** no se confirma.

##### 10.9.7.3. E03 — Actor o fecha ausentes

**Resultado:** no se confirma como corrección trazable.

##### 10.9.7.4. E04 — Intento de sobrescritura

**Resultado:** se impide.

##### 10.9.7.5. E05 — Falla de auditoría

**Resultado:** el caso invocante no declara la corrección exitosa.

#### 10.9.8. Garantías mínimas

- El original se conserva.
- La corrección no borra.
- La autoría no se reasigna.
- La cadena se reconstruye.
- La vista efectiva puede determinarse.
- No decide quién puede corregir.
- No ejecuta cálculos de dominio.
- No modifica prescripciones o protocolos.
- No fija estructura persistente.

#### 10.9.9. Requisitos relacionados

- `RF-044`
- `RF-050`
- `RNF-DAT-003`
- `RNF-OBS-003`

#### 10.9.10. Invocado por

- `UC-E02 — Corregir ejecución de entrenamiento`;
- `UC-E03 — Corregir evaluación antropométrica`.

#### 10.9.11. Puntos de auditoría

- invocante;
- original;
- corrección;
- actor;
- fecha;
- motivo;
- cadena;
- vista efectiva;
- rechazo;
- falla.

#### 10.9.12. Decisiones o preguntas abiertas

1. Estructura de relación: `DERIVAR 06`.
2. Política de actores y motivo: `DERIVAR 08`.
3. Contratos: `DERIVAR 09`.
4. Presentación: `DERIVAR 10`.
5. Pruebas: `DERIVAR 11A`.

#### 10.9.13. Criterio de cierre

El caso incluido termina cuando la corrección queda relacionada y reconstruible o cuando se rechaza sin alterar el original.

---

### 10.10. UC-P20 — Consultar evolución antropométrica

#### 10.10.1. Código

`UC-P20`

#### 10.10.2. Nombre

**Consultar evolución antropométrica**

#### 10.10.3. Objetivo

Permitir que el asesorado o un profesional autorizado compare evaluaciones antropométricas longitudinales, diferenciando mediciones directas, cálculos derivados, métodos, unidades, correcciones y limitaciones.

#### 10.10.4. Alcance

- **Superficies:** Website profesional y APK del asesorado.
- **Inicio:** existen evaluaciones autorizadas.
- **Fin:** el actor consulta una comparación coherente o una excepción impide presentarla sin inducir a error.

#### 10.10.5. Actor principal

Asesorado o profesional autorizado.

#### 10.10.6. Actores secundarios

- Sistema BE.

#### 10.10.7. Disparador

El actor consulta la evolución antropométrica.

#### 10.10.8. Precondiciones

1. El actor posee identidad y sesión válidas.
2. Existen evaluaciones propias o autorizadas.
3. `UC-I02` autoriza la consulta.
4. Los períodos pueden identificarse.
5. Mediciones y cálculos pueden diferenciarse.
6. Correcciones aplicables pueden reconstruirse.

#### 10.10.9. Postcondiciones de éxito

1. El actor consulta evaluaciones ordenadas por período.
2. La vista diferencia:
   - mediciones directas;
   - cálculos derivados.
3. Cada elemento conserva:
   - fecha;
   - autor;
   - unidad identificable;
   - protocolo o método;
   - versión;
   - correcciones aplicables.
4. Si dos elementos no son plenamente comparables, BE informa la limitación.
5. La vista no produce diagnóstico.
6. La vista no atribuye causalidad.
7. La consulta no crea revisión profesional válida.
8. La consulta no activa continuidad o cierre.
9. El evento se audita según política.

#### 10.10.10. Garantías mínimas

- Evolución no equivale a diagnóstico.
- Comparación no equivale a causalidad.
- Directos y derivados permanecen separados.
- Métodos y versiones permanecen visibles.
- Unidades permanecen identificables.
- Correcciones no borran originales.
- Datos incompatibles no se fuerzan a una equivalencia silenciosa.
- No se genera un score global.
- No se fija un protocolo.
- No se fija una fórmula.
- No se fija una unidad concreta.
- Visualizar no constituye revisión profesional.

#### 10.10.11. Flujo principal

1. El actor accede a evolución antropométrica.
2. BE ejecuta `UC-I02`.
3. BE obtiene evaluaciones autorizadas.
4. BE aplica la vista efectiva de correcciones.
5. BE organiza por período.
6. BE presenta mediciones directas y cálculos derivados por separado.
7. BE identifica protocolo, método, versión y unidad.
8. BE evalúa compatibilidad de comparación conforme a la política posterior.
9. BE muestra diferencias y limitaciones.
10. El actor consulta el detalle.
11. BE registra la consulta cuando corresponde.
12. El caso finaliza sin modificar datos.

#### 10.10.12. Variantes

##### 10.10.12.1. V01 — Comparación de mediciones directas

**Resultado:** se muestran períodos y unidades identificables.

##### 10.10.12.2. V02 — Comparación de cálculos derivados

**Resultado:** se muestran método y versión asociados.

##### 10.10.12.3. V03 — Evaluaciones con métodos distintos

**Resultado:** BE presenta la diferencia y evita una comparación engañosa.

##### 10.10.12.4. V04 — Evaluación corregida

**Resultado:** la vista efectiva muestra la corrección e identifica que existe historia.

##### 10.10.12.5. V05 — Consulta por asesorado

**Resultado:** solo accede a su información y a la explicación permitida.

##### 10.10.12.6. V06 — Consulta por profesional

**Resultado:** solo accede dentro de capacidad, vínculo, consentimiento, finalidad y alcance.

#### 10.10.13. Excepciones

##### 10.10.13.1. E01 — Sin autorización

**Resultado:** BE deniega.

##### 10.10.13.2. E02 — Períodos no identificables

**Resultado:** no presenta una evolución falsa.

##### 10.10.13.3. E03 — Unidad o método ausentes

**Resultado:** BE presenta el dato con limitación o lo excluye de comparación según 06/10.

##### 10.10.13.4. E04 — Corrección inconsistente

**Resultado:** no presenta una vista efectiva falsa.

##### 10.10.13.5. E05 — Datos insuficientes

**Resultado:** informa ausencia de comparación suficiente sin inferir tendencia.

##### 10.10.13.6. E06 — Falla de persistencia

**Resultado:** no presenta información parcial como completa.

#### 10.10.14. Reglas aplicables

1. `RF-049` gobierna evolución.
2. Evolución es comparación autorizada.
3. No constituye revisión de especialidad.
4. No crea un circuito de plan.
5. Directos y derivados se separan.
6. Métodos, versiones y unidades se identifican.
7. Limitaciones se hacen visibles.
8. No existe score global.
9. No existe causalidad automática.
10. Visualización pertenece a 10.
11. Compatibilidad técnica pertenece a 06.

#### 10.10.15. Información utilizada o generada

##### 10.10.15.1. Utilizada

- evaluaciones;
- mediciones;
- cálculos;
- protocolos;
- métodos;
- versiones;
- unidades;
- correcciones;
- períodos;
- autorización.

##### 10.10.15.2. Generada

- comparación;
- limitaciones;
- vista efectiva;
- evento de consulta.

#### 10.10.16. Requisitos relacionados

- `RF-049`
- `RF-050`
- `RF-021`
- `RF-054`, como entrada de línea temporal cuando corresponda.

#### 10.10.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 10.10.18. Casos extendidos

- `UC-E03 — Corregir evaluación antropométrica`

#### 10.10.19. Puntos de auditoría

- actor;
- evaluaciones consultadas;
- períodos;
- métodos;
- versiones;
- unidades;
- correcciones;
- limitaciones;
- resultado;
- denegación o falla.

#### 10.10.20. Decisiones o preguntas abiertas

1. Compatibilidad y conversión: `DERIVAR 06`.
2. Visibilidad por actor: `DERIVAR 08`.
3. Contratos: `DERIVAR 09`.
4. Gráficos y copy: `DERIVAR 10`.
5. Pruebas de comparabilidad: `DERIVAR 11A`.

#### 10.10.21. Criterio de cierre

El caso termina cuando el actor consulta una evolución autorizada con límites visibles, o cuando una excepción impide mostrar una comparación engañosa.

---

### 10.11. UC-P21 — Publicar servicio antropométrico limitado

#### 10.11.1. Código

`UC-P21`

#### 10.11.2. Nombre

**Publicar servicio antropométrico limitado**

#### 10.11.3. Objetivo

Permitir que un profesional elegible publique un servicio antropométrico para descubrimiento limitado, incluyendo perfil, credenciales y ubicación utilizable, sin incorporar funciones de marketplace.

#### 10.11.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** el profesional decide publicar o actualizar su servicio.
- **Fin:** el servicio queda publicado de forma limitada o la publicación se rechaza sin exposición indebida.

#### 10.11.5. Actor principal

Profesional con capacidad antropométrica.

#### 10.11.6. Actores secundarios

- Sistema BE.
- Administrador, cuando la política aplicable requiera intervención.

#### 10.11.7. Disparador

El profesional decide hacer descubrible su servicio antropométrico.

#### 10.11.8. Precondiciones

1. La identidad profesional está activa.
2. La capacidad antropométrica fue declarada y `VERIFICADA`.
3. El servicio se encuentra habilitado.
4. Existe una ubicación utilizable.
5. Existe autorización para publicar.
6. El estado profesional es válido.
7. `UC-I02` autoriza la operación.
8. `UC-I10` confirma habilitación y condiciones aplicables.
9. No se exige Nutrición o Entrenamiento verificadas.

#### 10.11.9. Postcondiciones de éxito

1. Existe una publicación limitada.
2. La publicación identifica:
   - profesional;
   - capacidad antropométrica;
   - servicio;
   - ubicación utilizable;
   - perfil y credenciales visibles según política;
   - situación de publicación.
3. El servicio puede aparecer en `UC-P22`.
4. El proveedor cartográfico no determina elegibilidad.
5. La publicación no crea vínculo.
6. La publicación no concede acceso.
7. La publicación no crea reserva, turno, pago o contratación.
8. El evento queda trazable.

#### 10.11.10. Garantías mínimas

- DEC-044 se aplica.
- Puede publicar un profesional exclusivamente antropométrico.
- Antropometría no se presenta como tercera especialidad.
- Solo se publica información autorizada.
- La ubicación no se expone más allá de la política aplicable.
- Google Maps o proveedor equivalente no determina elegibilidad.
- No se crean reservas.
- No se crean turnos.
- No se integran pagos.
- No se cobran comisiones.
- No se generan rankings.
- No se calcula reputación.
- No se admiten reseñas.
- No se ordena por popularidad.
- No se contrata dentro de BE.
- No existe patrocinio.
- No existe marketplace general.
- Un fallo no presenta el servicio como publicado.

#### 10.11.11. Flujo principal

1. El profesional accede a publicación.
2. BE ejecuta `UC-I02`.
3. BE ejecuta `UC-I10`.
4. BE verifica las seis condiciones canónicas.
5. El profesional identifica el servicio.
6. El profesional registra o confirma ubicación utilizable.
7. BE presenta los datos públicos permitidos.
8. BE presenta las exclusiones funcionales:
   - sin reserva;
   - sin turno;
   - sin pago;
   - sin contratación.
9. El profesional confirma.
10. BE verifica que identidad, capacidad, servicio, autorización y estado continúen válidos.
11. BE publica el servicio.
12. BE registra mediante `UC-I03`.
13. El servicio queda disponible para descubrimiento.
14. El caso finaliza.

#### 10.11.12. Variantes

##### 10.11.12.1. V01 — Profesional exclusivamente antropométrico

**Resultado:** puede publicar si cumple todas las condiciones.

##### 10.11.12.2. V02 — Profesional con especialidad adicional

**Resultado:** la publicación sigue identificando Antropometría como capacidad transversal.

##### 10.11.12.3. V03 — Actualizar ubicación

**Resultado:** se conserva historia según la política; no se altera elegibilidad por el proveedor cartográfico.

##### 10.11.12.4. V04 — Pausar publicación

La política permite dejar de mostrar el servicio.

**Resultado:** no se finalizan vínculos ni se borran antecedentes.

##### 10.11.12.5. V05 — Proveedor cartográfico no disponible

**Resultado:** la publicación puede conservar ubicación textual utilizable; representación técnica se deriva a 07/10.

#### 10.11.13. Excepciones

##### 10.11.13.1. E01 — Identidad inactiva

**Resultado:** no se publica.

##### 10.11.13.2. E02 — Capacidad no verificada

**Resultado:** no se publica.

##### 10.11.13.3. E03 — Servicio no habilitado

**Resultado:** no se publica.

##### 10.11.13.4. E04 — Ubicación no utilizable

**Resultado:** no se publica en mapa o lista como si fuera localizable.

##### 10.11.13.5. E05 — Sin autorización de publicación

**Resultado:** no se publica.

##### 10.11.13.6. E06 — Estado profesional no válido

**Resultado:** no se publica.

##### 10.11.13.7. E07 — Intento de función de marketplace

**Resultado:** BE rechaza reservas, pagos, reseñas, ranking, contratación u otra expansión no aprobada.

##### 10.11.13.8. E08 — Falla de persistencia o auditoría

**Resultado:** no se presenta como publicado.

#### 10.11.14. Reglas aplicables

1. `RF-051` gobierna publicación y descubrimiento.
2. `DEC-044` permite perfil exclusivamente antropométrico.
3. Se evalúan las seis condiciones canónicas.
4. La publicación es limitada.
5. No crea vínculo.
6. No concede acceso.
7. No crea marketplace.
8. La ubicación es utilizable, no necesariamente pública en detalle.
9. Elegibilidad pertenece a BE, no al mapa.
10. Estados técnicos pertenecen a 06.
11. Política de publicación pertenece a 08.
12. UI pertenece a 10.

#### 10.11.15. Información utilizada o generada

##### 10.11.15.1. Utilizada

- identidad;
- capacidad verificada;
- habilitación;
- servicio;
- ubicación;
- autorización de publicación;
- estado profesional;
- perfil;
- credenciales.

##### 10.11.15.2. Generada

- publicación;
- situación;
- datos visibles;
- ubicación utilizable;
- fecha;
- autoría;
- evento de auditoría.

#### 10.11.16. Requisitos relacionados

- `RF-051`
- `RF-066`
- `RF-021`
- `DEC-044`

#### 10.11.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I10 — Verificar habilitación y capacidad`

#### 10.11.18. Puntos de auditoría

- profesional;
- identidad;
- capacidad;
- servicio;
- habilitación;
- ubicación;
- autorización de publicación;
- estado profesional;
- resultado;
- intento de expansión;
- falla.

#### 10.11.19. Decisiones o preguntas abiertas

1. Datos públicos: `DERIVAR 08`.
2. Precisión y visibilidad de ubicación: `DERIVAR 08`.
3. Estados de publicación: `DERIVAR 06`.
4. Proveedor y adaptador: `DERIVAR 07`.
5. Contratos: `DERIVAR 09`.
6. Formulario: `DERIVAR 10`.
7. Pruebas de elegibilidad: `DERIVAR 11A`.

#### 10.11.20. Criterio de cierre

El caso termina cuando un servicio limitado queda publicado por un profesional elegible o cuando una excepción impide publicarlo sin ampliar el producto.

---

### 10.12. UC-P22 — Descubrir servicio antropométrico

#### 10.12.1. Código

`UC-P22`

#### 10.12.2. Nombre

**Descubrir servicio antropométrico**

#### 10.12.3. Objetivo

Permitir que un asesorado visualice servicios antropométricos publicados en lista o mapa, consulte perfil y credenciales y, si decide continuar, inicie una solicitud de vínculo mediante `UC-E04`.

#### 10.12.4. Alcance

- **Superficie:** APK o Website según diseño posterior.
- **Inicio:** existen servicios publicados.
- **Fin:** el asesorado consulta información pública o inicia `UC-E04`; nunca obtiene acceso profesional directo.

#### 10.12.5. Actor principal

Asesorado.

#### 10.12.6. Actores secundarios

- Sistema BE.
- Proveedor cartográfico.
- Profesional publicado como contraparte eventual.

#### 10.12.7. Disparador

El asesorado decide consultar servicios antropométricos.

#### 10.12.8. Precondiciones

1. El asesorado posee identidad BE y sesión válida.
2. `UC-I02` autoriza la consulta del catálogo público aplicable.
3. Existen publicaciones visibles.
4. La elegibilidad proviene de BE.
5. El proveedor cartográfico solo representa ubicación.

#### 10.12.9. Postcondiciones de éxito

1. El asesorado consulta servicios visibles.
2. Puede visualizar:
   - profesional;
   - capacidad antropométrica;
   - perfil;
   - credenciales visibles;
   - ubicación utilizable.
3. La lista o mapa no constituye ranking.
4. No se expone información protegida.
5. No se crea reserva.
6. No se crea turno.
7. No se crea pago.
8. No se crea contratación.
9. No se crea vínculo.
10. Si continúa, se invoca `UC-E04`.
11. El evento se audita según política.

#### 10.12.10. Garantías mínimas

- Descubrir no equivale a contratar.
- Descubrir no equivale a vincularse.
- Descubrir no concede acceso.
- Perfil y credenciales visibles no incluyen información protegida.
- No se crean reservas.
- No se crean turnos.
- No se integran pagos.
- No se cobran comisiones.
- No se generan rankings.
- No se muestra reputación.
- No se admiten reseñas.
- No se ordena por popularidad.
- No se contrata dentro de BE.
- No existe patrocinio.
- No existe marketplace general.
- El mapa no determina elegibilidad.
- La caída del mapa no bloquea la lista.

#### 10.12.11. Flujo principal

1. El asesorado abre descubrimiento antropométrico.
2. BE ejecuta `UC-I02`.
3. BE obtiene publicaciones elegibles desde su propia base.
4. BE presenta una lista.
5. Cuando el mapa está disponible, representa ubicaciones autorizadas.
6. El asesorado consulta un servicio.
7. BE presenta perfil, credenciales y ubicación permitidos.
8. BE informa que la siguiente acción posible es solicitar vínculo.
9. El asesorado puede finalizar la consulta.
10. Si selecciona solicitar vínculo, se invoca `UC-E04`.
11. El caso finaliza sin conceder acceso.

#### 10.12.12. Variantes

##### 10.12.12.1. V01 — Lista

El asesorado consulta servicios sin mapa.

**Resultado:** el recorrido permanece completo.

##### 10.12.12.2. V02 — Mapa disponible

El proveedor representa ubicaciones.

**Resultado:** la elegibilidad sigue determinada por BE.

##### 10.12.12.3. V03 — Mapa indisponible

El proveedor falla.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia y mantiene lista y ubicación textual.

##### 10.12.12.4. V04 — Perfil exclusivamente antropométrico

El profesional no posee especialidades verificadas.

**Resultado:** el perfil puede mostrarse conforme a `DEC-044`.

##### 10.12.12.5. V05 — Sin servicios disponibles

**Resultado:** BE informa ausencia sin inventar resultados o ampliar el radio silenciosamente.

##### 10.12.12.6. V06 — Ordenamiento neutral

La interfaz necesita ordenar resultados.

**Resultado:** el criterio debe ser documentado y no reputacional; diseño definitivo: `DERIVAR 10`.

#### 10.12.13. Excepciones

##### 10.12.13.1. E01 — Publicación ya no elegible

**Resultado:** BE no la muestra como disponible.

##### 10.12.13.2. E02 — Información pública inconsistente

**Resultado:** BE no presenta el perfil como completo.

##### 10.12.13.3. E03 — Mapa indisponible

**Resultado:** fallback a lista y ubicación textual.

##### 10.12.13.4. E04 — Intento de reserva, pago o contratación

**Resultado:** BE rechaza la operación porque está fuera del MVP.

##### 10.12.13.5. E05 — Intento de acceso a datos del profesional o asesorados

**Resultado:** BE deniega sin filtrar información.

##### 10.12.13.6. E06 — Falla de persistencia o consulta

**Resultado:** no presenta resultados parciales como completos.

#### 10.12.14. Reglas aplicables

1. `RF-051` gobierna descubrimiento.
2. La fuente de elegibilidad es BE.
3. El mapa solo representa ubicación.
4. Lista y mapa son medios de descubrimiento.
5. El único siguiente paso relacional es `UC-E04`.
6. `UC-E04` invoca `UC-P04`.
7. No existe aceptación implícita.
8. No existe acceso previo.
9. No existe marketplace.
10. Fallback pertenece a `UC-I08`.
11. Política de datos públicos pertenece a 08.
12. Orden y visualización pertenecen a 10.

#### 10.12.15. Información utilizada o generada

##### 10.12.15.1. Utilizada

- publicaciones;
- perfil;
- credenciales visibles;
- ubicación utilizable;
- elegibilidad BE;
- disponibilidad del mapa.

##### 10.12.15.2. Generada

- consulta;
- resultado de lista o mapa;
- contingencia;
- selección de servicio;
- evento de auditoría.

#### 10.12.16. Requisitos relacionados

- `RF-051`
- `RF-059`
- `RF-018`, cuando se invoca `UC-E04`
- `DEC-044`

#### 10.12.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I08 — Aplicar fallback manual y conservar procedencia`

#### 10.12.18. Casos extendidos

- `UC-E04 — Solicitar vínculo desde descubrimiento antropométrico`

#### 10.12.19. Puntos de auditoría

- asesorado;
- publicaciones consultadas;
- servicio seleccionado;
- lista o mapa;
- contingencia;
- perfil consultado;
- intento de función no permitida;
- invocación de UC-E04;
- falla.

#### 10.12.20. Decisiones o preguntas abiertas

1. Superficie definitiva: `DERIVAR 10`.
2. Datos públicos: `DERIVAR 08`.
3. Precisión de ubicación: `DERIVAR 08`.
4. Proveedor y fallback: `DERIVAR 07/09`.
5. Ordenamiento neutral: `DERIVAR 10`.
6. Pruebas de expansión indebida: `DERIVAR 11A`.

#### 10.12.21. Criterio de cierre

El caso termina cuando el asesorado consulta servicios sin acceso protegido o cuando decide continuar mediante una solicitud de vínculo explícita.

---

### 10.13. UC-E04 — Solicitar vínculo desde descubrimiento antropométrico

#### 10.13.1. Código

`UC-E04`

#### 10.13.2. Tipo

Extensión de `UC-P22` que invoca `UC-P04`.

#### 10.13.3. Nombre

**Solicitar vínculo desde descubrimiento antropométrico**

#### 10.13.4. Objetivo

Convertir la selección de un servicio publicado en una solicitud de vínculo pendiente, preservando profesional, capacidad y finalidad sin crear aceptación, consentimiento o acceso.

#### 10.13.5. Condición de extensión

El asesorado consulta un servicio antropométrico y selecciona solicitar vínculo.

#### 10.13.6. Actor principal

Asesorado.

#### 10.13.7. Actores secundarios

- Profesional publicado.
- Sistema BE.

#### 10.13.8. Precondiciones

1. El asesorado posee identidad y sesión válidas.
2. El servicio continúa publicado y elegible.
3. El profesional puede identificarse.
4. La capacidad antropométrica puede identificarse.
5. La finalidad puede identificarse.
6. `UC-I02` autoriza iniciar la solicitud.

#### 10.13.9. Postcondiciones de éxito

1. `UC-P04` recibe:
   - profesional;
   - asesorado;
   - capacidad antropométrica;
   - finalidad;
   - origen desde descubrimiento.
2. Se crea una solicitud pendiente conforme a UC-P04.
3. No existe vínculo aceptado.
4. No existe consentimiento.
5. No existe acceso.
6. No existe reserva.
7. No existe turno.
8. No existe pago.
9. No existe contratación.
10. El evento queda trazable.

#### 10.13.10. Garantías mínimas

- UC-E04 no implementa nuevamente el vínculo.
- UC-E04 invoca UC-P04.
- La solicitud queda pendiente.
- El asesorado debe aceptar conforme a UC-P05.
- El consentimiento permanece separado.
- La autorización permanece separada.
- No se transfieren datos.
- No se crea una reserva.
- No se crea una contratación.
- No se concede acceso.

#### 10.13.11. Flujo diferencial

1. El asesorado selecciona solicitar vínculo.
2. BE ejecuta `UC-I02`.
3. BE presenta:
   - profesional;
   - capacidad;
   - finalidad;
   - ausencia de acceso automático.
4. El asesorado confirma iniciar la solicitud.
5. BE verifica que el servicio continúe elegible.
6. BE invoca `UC-P04`.
7. UC-P04 controla duplicados, elegibilidad y solicitud pendiente.
8. BE registra el origen mediante `UC-I03`.
9. La extensión finaliza.

#### 10.13.12. Variantes

##### 10.13.12.1. V01 — Solicitud para Antropometría exclusivamente

**Resultado:** el alcance es la capacidad transversal y no una especialidad.

##### 10.13.12.2. V02 — Solicitud duplicada

**Resultado:** UC-P04 presenta la solicitud existente y evita duplicados.

##### 10.13.12.3. V03 — Servicio deja de estar publicado

**Resultado:** no se crea una solicitud basada en una publicación inválida.

#### 10.13.13. Excepciones

##### 10.13.13.1. E01 — Profesional no elegible

**Resultado:** no se invoca con éxito UC-P04.

##### 10.13.13.2. E02 — Finalidad ausente

**Resultado:** no se crea una solicitud ambigua.

##### 10.13.13.3. E03 — Actor no autorizado

**Resultado:** BE deniega.

##### 10.13.13.4. E04 — Intento de reserva o contratación

**Resultado:** BE rechaza y mantiene el alcance de solicitud de vínculo.

##### 10.13.13.5. E05 — Falla de persistencia

**Resultado:** no se declara solicitud creada.

#### 10.13.14. Reglas aplicables

1. `RF-018` gobierna solicitud de vínculo.
2. `RF-051` gobierna el origen desde descubrimiento.
3. UC-P04 es el propietario de la solicitud.
4. UC-P05 es el propietario de aceptación o rechazo.
5. UC-P07 es el propietario de consentimiento.
6. UC-I02 es el propietario de autorización.
7. No existe acceso antes de completar todos los gates.
8. No existe reserva o contratación.

#### 10.13.15. Información utilizada o generada

##### 10.13.15.1. Utilizada

- asesorado;
- profesional;
- publicación;
- capacidad;
- finalidad;
- elegibilidad.

##### 10.13.15.2. Generada

- invocación de UC-P04;
- origen de solicitud;
- solicitud pendiente;
- evento de auditoría.

#### 10.13.16. Requisitos relacionados

- `RF-018`
- `RF-051`
- `RF-019`
- `RF-020`
- `RF-021`

#### 10.13.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 10.13.18. Caso invocado

- `UC-P04 — Solicitar o invitar a un vínculo`

#### 10.13.19. Puntos de auditoría

- asesorado;
- profesional;
- servicio;
- capacidad;
- finalidad;
- origen;
- resultado;
- duplicado;
- intento de contratación;
- falla.

#### 10.13.20. Decisiones o preguntas abiertas

1. Copy de transición: `DERIVAR 10`.
2. Contrato de invocación: `DERIVAR 09`.
3. Caducidad: `DERIVAR 06/08`.
4. Datos visibles: `DERIVAR 08`.
5. Pruebas E2E: `DERIVAR 11A`.

#### 10.13.21. Criterio de cierre

La extensión termina cuando UC-P04 crea o reconoce una solicitud pendiente sin acceso, o cuando una excepción impide ampliar el descubrimiento a contratación.

---

### 10.14. Historias de usuario prioritarias

#### 10.14.1. HU-14 — Registrar antropometría reproducible

**Como** profesional con capacidad antropométrica  
**quiero** registrar mediciones y cálculos claramente diferenciados  
**para** conservar una evaluación reconstruible sin convertir los resultados en diagnóstico.

##### 10.14.1.1. Criterios de aceptación

###### 10.14.1.1.1. Escenario 1 — Evaluación identificable

**Dado** que estoy autorizado  
**cuando** registro protocolo, autor, fecha, unidades y mediciones  
**entonces** BE conserva la evaluación  
**y** diferencia mediciones directas y cálculos derivados.

###### 10.14.1.1.2. Escenario 2 — Cálculo reproducible

**Dado** que existen entradas suficientes  
**cuando** se emite un cálculo  
**entonces** BE conserva método, versión y relación con entradas  
**y** no lo presenta como medición directa.

###### 10.14.1.1.3. Escenario 3 — Profesional exclusivamente antropométrico

**Dado** que poseo solo capacidad antropométrica verificada  
**cuando** cumplo vínculo, consentimiento y autorización  
**entonces** puedo registrar la evaluación  
**y** no obtengo funciones de Nutrición o Entrenamiento.

###### 10.14.1.1.4. Escenario 4 — Método ausente

**Dado** que no puede identificarse el método  
**cuando** intento emitir un cálculo  
**entonces** BE conserva las mediciones válidas  
**y** no inventa un resultado derivado.

---

#### 10.14.2. HU-15 — Corregir y consultar evolución

**Como** asesorado o profesional autorizado  
**quiero** consultar evolución y reconocer correcciones  
**para** comparar períodos sin perder la historia ni recibir conclusiones engañosas.

##### 10.14.2.1. Criterios de aceptación

###### 10.14.2.1.1. Escenario 1 — Corrección trazable

**Dado** que una medición contiene un error  
**cuando** el profesional autorizado la corrige  
**entonces** BE conserva el original  
**y** registra actor, fecha y motivo  
**y** recalcula los derivados afectados.

###### 10.14.2.1.2. Escenario 2 — Métodos diferentes

**Dado** que dos evaluaciones usan métodos o versiones diferentes  
**cuando** consulto la evolución  
**entonces** BE informa la limitación  
**y** no fuerza una comparación silenciosa.

###### 10.14.2.1.3. Escenario 3 — Consulta no diagnóstica

**Dado** que consulto mi evolución  
**cuando** observo diferencias entre períodos  
**entonces** BE no atribuye causalidad  
**y** no emite diagnóstico.

###### 10.14.2.1.4. Escenario 4 — Visualización sin revisión

**Dado** que un profesional consulta la evolución  
**cuando** no registra DEC-043  
**entonces** BE no crea una revisión profesional válida.

---

#### 10.14.3. HU-16 — Publicar y descubrir sin marketplace

**Como** profesional antropométrico o asesorado  
**quiero** publicar o descubrir un servicio limitado  
**para** iniciar una solicitud de vínculo sin reservas, pagos o contratación.

##### 10.14.3.1. Criterios de aceptación

###### 10.14.3.1.1. Escenario 1 — Publicación elegible

**Dado** que el profesional cumple las seis condiciones canónicas  
**cuando** confirma la publicación  
**entonces** el servicio aparece en descubrimiento  
**y** no se crea una función de marketplace.

###### 10.14.3.1.2. Escenario 2 — Perfil exclusivamente antropométrico

**Dado** que el profesional no posee Nutrición ni Entrenamiento  
**cuando** su capacidad antropométrica está verificada  
**entonces** puede publicar conforme a DEC-044.

###### 10.14.3.1.3. Escenario 3 — Mapa indisponible

**Dado** que el proveedor cartográfico falla  
**cuando** el asesorado consulta servicios  
**entonces** BE mantiene lista y ubicación textual  
**y** no bloquea el descubrimiento.

###### 10.14.3.1.4. Escenario 4 — Solicitud, no acceso

**Dado** que selecciono un servicio  
**cuando** solicito vínculo  
**entonces** UC-E04 invoca UC-P04  
**y** la solicitud queda pendiente  
**y** no obtengo acceso.

###### 10.14.3.1.5. Escenario 5 — Función no permitida

**Dado** que intento reservar, pagar, reseñar o contratar  
**cuando** uso el descubrimiento  
**entonces** BE rechaza la operación  
**y** mantiene el alcance limitado.

---

### 10.15. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Capacidad antropométrica independiente | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Aplicar DEC-044 sin crear especialidad. |
| Evaluación con protocolo, autor, fecha y unidades | Parcial | `PRESERVAR + REFACTORIZAR` | Hacer todos los elementos identificables. |
| Separación directos/derivados | Parcial o ambigua | `REFACTORIZAR` | Etiquetar y relacionar explícitamente. |
| Cálculos reproducibles | Parcial | `REFACTORIZAR` | Método, versión, entradas y resultados preservados. |
| Corrección con recálculo | No evidenciada | `NO EVIDENCIADO` | UC-I12 + UC-I09. |
| Evolución longitudinal autorizada | Parcial | `REFACTORIZAR` | Comparación con limitaciones visibles. |
| Publicación limitada | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Aplicar seis condiciones canónicas. |
| Lista/mapa con fallback | Parcial o no evidenciado | `REFACTORIZAR / NO EVIDENCIADO` | Fuente BE; mapa solo representa; fallback textual. |
| Solicitud desde descubrimiento | No evidenciada | `NO EVIDENCIADO` | UC-E04 → UC-P04. |
| Marketplace | Fuera del TO-BE | `RETIRAR / NO INCORPORAR` | Excluir reservas, pagos, ranking, reseñas y contratación. |

---

### 10.16. Revisión crítica consolidada

#### 10.16.1. Controles superados

1. Antropometría se mantiene transversal.
2. No se crea una tercera especialidad.
3. DEC-044 se aplica.
4. UC-P21 admite perfil exclusivamente antropométrico.
5. Se aplican las seis condiciones canónicas de publicación.
6. UC-P22 conduce a UC-E04 y UC-P04.
7. Descubrimiento no concede acceso.
8. Las exclusiones de marketplace están explícitas en propósito, decisiones, garantías, flujos, excepciones e historias.
9. No se fijan protocolos concretos.
10. No se fijan fórmulas.
11. No se fijan unidades concretas.
12. UC-I09 exige reproducibilidad.
13. UC-E03 conserva el original.
14. UC-E03 recalcula derivados afectados.
15. UC-I12 centraliza la corrección común.
16. UC-P19, UC-E03, UC-P20, UC-P21, UC-P22 y UC-E04 invocan UC-I02.
17. UC-I09 y UC-I12 solo operan dentro de un invocante autorizado.
18. Evolución no constituye revisión profesional.
19. No se crea un ciclo de plan antropométrico.
20. Jerarquía H1–H5 conforme.
21. Bloques de código balanceados.

#### 10.16.2. Autoverificación exigida

| Control | Resultado |
|---|---|
| Exclusiones de marketplace declaradas | `CUMPLE` |
| UC-P21 admite perfil exclusivamente antropométrico | `CUMPLE` |
| UC-P22 conduce a solicitud y no acceso | `CUMPLE` |
| Sin protocolos concretos | `CUMPLE` |
| Sin fórmulas concretas | `CUMPLE` |
| Sin unidades concretas | `CUMPLE` |
| Antropometría no aparece como tercera especialidad | `CUMPLE` |
| UC-E03 conserva original | `CUMPLE` |
| UC-E03 recalcula derivados | `CUMPLE` |
| Casos actorales invocan UC-I02 | `CUMPLE` |
| Glosario actualizado antes de propagar | `CUMPLE` |
| Jerarquía normalizada | `CUMPLE` |

#### 10.16.3. Riesgos abiertos

##### 10.16.3.1. R-05-ANT-01 — Deriva hacia marketplace

**Control:** exclusiones taxativas y E07/E04 de publicación/descubrimiento.

##### 10.16.3.2. R-05-ANT-02 — Antropometría como tercera especialidad

**Control:** DEC-044, glosario y autorización por capacidad.

##### 10.16.3.3. R-05-ANT-03 — Cálculo presentado como medición

**Control:** UC-P19 y UC-I09 separan entradas y derivados.

##### 10.16.3.4. R-05-ANT-04 — Fórmula o protocolo fijados prematuramente

**Control:** conducta observable en 05; contenido y estructura a 06.

##### 10.16.3.5. R-05-ANT-05 — Corrección que rompe reproducibilidad

**Control:** UC-I12 conserva original y UC-I09 recalcula.

##### 10.16.3.6. R-05-ANT-06 — Evolución interpretada como diagnóstico

**Control:** garantías y reglas no diagnósticas y no causales.

##### 10.16.3.7. R-05-ANT-07 — Solicitud convertida en acceso

**Control:** UC-E04 invoca UC-P04 y mantiene gates posteriores.

##### 10.16.3.8. R-05-ANT-08 — Mapa convertido en fuente de elegibilidad

**Control:** la elegibilidad proviene de BE.

##### 10.16.3.9. R-05-ANT-09 — Ranking encubierto por ordenamiento

**Control:** no popularidad; criterio neutral y documentado a 10.

#### 10.16.4. Veredicto

```text
BLOQUE 07 — ANTROPOMETRÍA:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS PRINCIPALES:
UC-P19, UC-P20, UC-P21, UC-P22

EXTENSIONES:
UC-E03, UC-E04

CASOS INCLUIDOS:
UC-I09, UC-I12

RF PRINCIPALES:
RF-047, RF-048, RF-049, RF-050, RF-051

DECISIÓN:
DEC-044

MARKETPLACE:
EXCLUIDO EXPLÍCITAMENTE

CIRCUITO DE PLAN ANTROPOMÉTRICO:
NO CREADO

INVASIONES DE 06/08/09/10:
0 CONOCIDAS

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 10.17. Decisiones del bloque

#### 10.17.1. Aprobadas y aplicadas

- Antropometría como capacidad transversal;
- operación antropométrica independiente;
- protocolo, autor, fecha y unidades identificables;
- separación directos/derivados;
- cálculo reproducible;
- corrección trazable;
- recálculo con historia;
- evolución longitudinal autorizada;
- publicación limitada;
- lista/mapa con fallback;
- perfil y credenciales;
- solicitud de vínculo;
- exclusión de marketplace.

#### 10.17.2. Provisionales

- códigos de casos;
- forma de identificar protocolos;
- compatibilidad de comparaciones;
- precisión de ubicación;
- ordenamiento neutral;
- actores autorizados para corregir;
- estados de publicación.

#### 10.17.3. Pendientes derivados

- protocolos, fórmulas, unidades y persistencia: `06`;
- proveedor cartográfico: `07`;
- visibilidad, ubicación y corrección: `08`;
- contratos: `09`;
- UI y gráficos: `10`;
- pruebas: `11A`;
- trazabilidad canónica: `12`.

---

### 10.18. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. Antropometría permanece como capacidad transversal;
2. DEC-044 se aplica;
3. UC-P21 admite perfil exclusivamente antropométrico;
4. las seis condiciones de publicación son correctas;
5. publicación y descubrimiento no incorporan marketplace;
6. UC-P22 solo conduce a solicitud mediante UC-E04/UC-P04;
7. mediciones y cálculos permanecen separados;
8. UC-I09 exige reproducibilidad;
9. UC-E03 conserva original y recalcula derivados;
10. UC-I12 es el patrón común correcto;
11. evolución no crea revisión o plan;
12. protocolos, fórmulas y unidades permanecen en 06.

---

### 10.19. Estado

```text
ARQUITECTURA:
v0.2.7

GLOSARIO:
v0.1.6

BLOQUE 06:
v0.8.1 — CORRECCIÓN COMÚN REFACTORIZADA

BLOQUE 07:
REDACTADO EN v0.9
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P19, UC-P20, UC-P21, UC-P22
UC-E03, UC-E04
UC-I09, UC-I12

ANTROPOMETRÍA:
CAPACIDAD TRANSVERSAL
SIN CICLO DE PLAN PROPIO

MARKETPLACE:
EXCLUIDO

GIT:
SIN CAMBIOS
```

#### 10.19.1. Siguiente acción recomendada

Revisar el Bloque 07. Después desarrollar:

```text
BLOQUE 08 — CARTERA, DASHBOARD Y COORDINACIÓN

UC-P23 — Consultar cartera y revisiones pendientes
UC-P24 — Consultar dashboard interdisciplinario
UC-E07 — Registrar nota de coordinación autorizada
UC-P31 — Consultar progreso longitudinal en APK
```

---

## 11. Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal

*Fuente ensamblada: `BE_LEG_05_v0.10_BLOQUE_08_CARTERA_DASHBOARD_Y_PROGRESO.md`.*

### 11.1. Propósito del bloque

Este bloque define las vistas longitudinales y de coordinación de BE.

Cubre:

- cartera profesional;
- ciclos y revisiones pendientes;
- motivos operativos no clínicos;
- dashboard interdisciplinario;
- autorización por dato o conjunto pertinente;
- línea temporal longitudinal;
- separación entre momento de ocurrencia y momento de registro;
- procedencia y autoría;
- nota de coordinación autorizada;
- progreso longitudinal propio en APK.

No crea:

- una calificación agregada del asesorado;
- una señal visual única de condición general;
- una clasificación clínica;
- diagnóstico;
- priorización por gravedad clínica;
- prescripción cruzada;
- modificación de un dominio por otro profesional;
- transferencia de responsabilidad;
- comparación del asesorado con terceros;
- historia clínica completa;
- chat general.

---

### 11.2. Decisiones funcionales aplicadas

#### 11.2.1. Síntesis sin calificación agregada

El dashboard presenta información autorizada por dominio.

```text
Nutrición autorizada
→ información nutricional permitida

Entrenamiento autorizado
→ información de entrenamiento permitida

Antropometría autorizada
→ información antropométrica permitida
```

BE no reduce los dominios a:

- una nota única;
- una condición general;
- una clasificación cromática agregada;
- una conclusión clínica global.

La interfaz debe permitir comprender hechos y pendientes sin calificar a la persona.

#### 11.2.2. Cartera y pendientes no clínicos

La cartera puede mostrar:

- asesorados propios;
- vínculos y alcances;
- ciclos en curso;
- revisiones pendientes;
- próximas acciones;
- continuidad o cierre pendientes.

El motivo de un pendiente debe expresar una necesidad operativa, por ejemplo:

- período disponible para revisión;
- evidencia registrada desde la última revisión;
- próxima acción no registrada;
- ciclo sin cierre trazable.

No debe afirmar:

- diagnóstico;
- deterioro clínico;
- gravedad;
- urgencia médica;
- riesgo de salud.

El ordenamiento definitivo se deriva a `06/10` y no puede convertir la cartera en una clasificación clínica.

#### 11.2.3. Autorización interdisciplinaria

```text
autorización sobre un dominio
≠ autorización sobre todos los dominios

autorización sobre un conjunto
≠ acceso global al dashboard
```

`UC-P24` invoca `UC-I02` para cada dato o conjunto pertinente considerando:

1. rol;
2. especialidad o capacidad;
3. situación aplicable;
4. vínculo;
5. consentimiento;
6. finalidad;
7. alcance.

Cuando existe autorización parcial:

- se muestran únicamente los elementos permitidos;
- no se infieren datos ocultos;
- no se revela que existe un recurso protegido;
- no se completa una síntesis con información no autorizada.

#### 11.2.4. Longitudinalidad defendible

```text
momento de ocurrencia
≠ momento de registro
```

La línea temporal debe conservar ambos cuando sean conocidos.

Ejemplos funcionales:

- una ejecución puede ocurrir antes de ser registrada;
- una corrección ocurre y se registra después del dato original;
- una revisión registra una decisión sobre un período anterior;
- una importación conserva fecha de origen y fecha de incorporación.

Cuando solo se conoce uno de los momentos, BE no inventa el otro.

#### 11.2.5. Coordinación sin transferencia de responsabilidad

La nota de coordinación:

- comunica contexto pertinente;
- identifica autor, destinatario o visibilidad autorizada, fecha, dominio y finalidad;
- puede referenciar evidencia autorizada;
- no prescribe en el dominio ajeno;
- no modifica un plan ajeno;
- no cambia objetivos ajenos;
- no registra una revisión en nombre de otro profesional;
- no transfiere responsabilidad profesional;
- no sustituye la próxima acción del profesional responsable.

#### 11.2.6. Progreso propio en APK

El asesorado puede consultar su propia información longitudinal por dominio y período.

La vista:

- conserva procedencia;
- distingue planificación y ejecución;
- distingue mediciones y cálculos;
- muestra decisiones profesionales cuando sean visibles;
- informa límites de comparación;
- no diagnostica;
- no compara con otras personas;
- no produce una clasificación personal agregada;
- no expone notas profesionales no autorizadas.

---

### 11.3. Actores

| Actor | Responsabilidad |
|---|---|
| **Profesional autorizado** | Consulta su cartera, revisiones pendientes y dashboard dentro de su dominio, finalidad y alcance; puede registrar una nota de coordinación autorizada. |
| **Asesorado** | Consulta su progreso longitudinal propio en APK. |
| **Sistema BE** | Evalúa autorización por dato o conjunto, preserva ocurrencia y registro, mantiene procedencia, evita inferencias clínicas y registra auditoría. |
| **Profesional destinatario** | Recibe una nota de coordinación únicamente dentro de la autorización vigente y conserva responsabilidad sobre su propio dominio. |

---

### 11.4. Relaciones internas

```text
UC-P23 — Consultar cartera y revisiones pendientes
  incluye → UC-I02 — Evaluar autorización contextual
  incluye → UC-I03 — Registrar auditoría y preservar historia
  consume → UC-I05 — Revisiones profesionales válidas
  consume → UC-I06 — Continuidad o cierre

UC-P24 — Consultar dashboard y línea temporal interdisciplinaria
  incluye → UC-I02
  incluye → UC-I03
  puede ser extendido por → UC-E07

UC-E07 — Registrar nota de coordinación autorizada
  incluye → UC-I02
  incluye → UC-I03
  extiende → UC-P24

UC-P31 — Consultar progreso longitudinal en APK
  incluye → UC-I02
  incluye → UC-I03

UC-P24 y UC-P31
  consumen eventos producidos por → Nutrición, Entrenamiento y Antropometría
```

---

### 11.5. Frontera de responsabilidad

| Tema | Propietario |
|---|---|
| Comportamiento observable de cartera, dashboard, timeline, coordinación y progreso | Documento 05 |
| Proyección, entidades de lectura, agregados y ordenamiento técnico | Documento 06 |
| Arquitectura de consulta, rendimiento y actualización | Documento 07 |
| Reglas finas de visibilidad, notas, datos públicos y auditoría | Documento 08 |
| Contratos, filtros, paginación y errores | Documento 09 |
| Composición visual, navegación, copy y accesibilidad | Documento 10 |
| Pruebas de filtración, autorización parcial y longitudinalidad | Documento 11A |
| Matriz RF–UC–datos–pruebas | Documento 12 |

---

### 11.6. UC-P23 — Consultar cartera y revisiones pendientes

#### 11.6.1. Código

`UC-P23`

#### 11.6.2. Nombre

**Consultar cartera y revisiones pendientes**

#### 11.6.3. Objetivo

Permitir que un profesional consulte asesorados y ciclos propios, identifique revisiones o próximas acciones pendientes y priorice trabajo operativo sin lenguaje diagnóstico ni calificación agregada.

#### 11.6.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** el profesional accede a su cartera.
- **Fin:** consulta información propia y acciones pendientes autorizadas sin modificar los procesos.

#### 11.6.5. Actor principal

Profesional.

#### 11.6.6. Actores secundarios

- Sistema BE.

#### 11.6.7. Disparador

El profesional decide organizar su trabajo.

#### 11.6.8. Precondiciones

1. El profesional posee identidad y sesión válidas.
2. `UC-I02` autoriza la consulta.
3. Solo se consideran vínculos y procesos propios.
4. Cada elemento puede relacionarse con un dominio, finalidad y alcance.
5. Las revisiones válidas provienen de `UC-I05`.
6. La continuidad o cierre provienen de `UC-I06`.
7. Los motivos de pendiente pueden expresarse sin diagnóstico.

#### 11.6.9. Postcondiciones de éxito

1. El profesional consulta una cartera propia.
2. Para cada elemento visible puede identificar:
   - asesorado;
   - dominio o capacidad;
   - vínculo aplicable;
   - ciclo o proceso;
   - situación funcional;
   - revisión pendiente, cuando corresponda;
   - próxima acción registrada, cuando corresponda.
3. El motivo del pendiente utiliza lenguaje operativo.
4. La consulta no crea una revisión.
5. La consulta no resuelve un pendiente.
6. No se muestra una calificación agregada.
7. No se muestran vínculos o asesorados ajenos.
8. El evento se audita según política.

#### 11.6.10. Garantías mínimas

- La cartera no es una lista clínica.
- El asesorado no recibe una clasificación general.
- Un pendiente no afirma diagnóstico.
- Un pendiente no afirma gravedad clínica.
- Abrir la cartera no constituye revisión.
- Visualizar evidencia no constituye revisión.
- Solo `UC-I05` registra una revisión válida.
- Solo una próxima acción o cierre válidos resuelven el ciclo correspondiente.
- El profesional consulta únicamente relaciones propias.
- Un filtro visual no concede autorización.
- Una ausencia de autorización no revela el recurso protegido.
- Un fallo no presenta información parcial como completa.

#### 11.6.11. Flujo principal

1. El profesional abre su cartera.
2. BE ejecuta `UC-I02`.
3. BE identifica vínculos, dominios y procesos propios.
4. BE obtiene revisiones y próximas acciones autorizadas.
5. BE determina motivos operativos de pendiente conforme a reglas posteriores.
6. BE presenta la cartera sin calificación agregada.
7. El profesional filtra o consulta un elemento.
8. BE reevalúa autorización para el detalle.
9. BE presenta:
   - situación funcional;
   - evidencia disponible;
   - última revisión válida;
   - próxima acción o cierre;
   - motivo operativo del pendiente.
10. El profesional puede continuar al caso de revisión correspondiente.
11. BE registra la consulta según política.
12. El caso finaliza sin modificar el proceso.

#### 11.6.12. Variantes

##### 11.6.12.1. V01 — Ciclo con revisión pendiente

Existe evidencia posterior a la última revisión o el ciclo se encuentra disponible para revisión.

**Resultado:** BE informa el motivo en lenguaje operativo.

##### 11.6.12.2. V02 — Próxima acción pendiente

Existe revisión válida, pero falta materializar una acción definida.

**Resultado:** se muestra la acción pendiente sin interpretar clínicamente al asesorado.

##### 11.6.12.3. V03 — Ciclo cerrado

Existe revisión válida y cierre o continuidad aplicados.

**Resultado:** no se muestra como pendiente equivalente a un ciclo abierto.

##### 11.6.12.4. V04 — Varios dominios propios

El profesional posee autorización sobre más de un dominio.

**Resultado:** cada elemento conserva dominio, finalidad y alcance; no se fusionan en una conclusión general.

##### 11.6.12.5. V05 — Sin pendientes

No existen acciones pendientes autorizadas.

**Resultado:** BE informa la ausencia sin inventar trabajo o alterar criterios.

#### 11.6.13. Excepciones

##### 11.6.13.1. E01 — Vínculo ajeno

**Resultado:** BE deniega sin revelar existencia o contenido.

##### 11.6.13.2. E02 — Motivo no reconstruible

BE no puede explicar por qué un elemento aparece pendiente.

**Resultado:** no presenta el pendiente como confiable; registra la inconsistencia.

##### 11.6.13.3. E03 — Actividad confundida con revisión

Existe una consulta, nota o modificación silenciosa sin DEC-043.

**Resultado:** el ciclo continúa pendiente.

##### 11.6.13.4. E04 — Autorización revocada

**Resultado:** BE corta la consulta futura.

##### 11.6.13.5. E05 — Datos longitudinales inconsistentes

**Resultado:** BE no presenta una situación falsa.

##### 11.6.13.6. E06 — Falla de consulta o auditoría

**Resultado:** no muestra información parcial como cartera completa.

#### 11.6.14. Reglas aplicables

1. `RF-052` gobierna la cartera.
2. `RF-055` gobierna revisiones pendientes.
3. El lenguaje de pendiente es no clínico.
4. Una revisión válida proviene de UC-I05.
5. Continuidad o cierre provienen de UC-I06.
6. Visualizar no equivale a revisar.
7. La cartera no produce calificación agregada.
8. El ordenamiento no se basa en gravedad clínica.
9. Cada elemento conserva dominio y autorización.
10. Ordenamiento técnico y proyecciones pertenecen a 06/10.
11. Auditoría de consulta pertenece a 08.

#### 11.6.15. Información utilizada o generada

##### 11.6.15.1. Utilizada

- profesional;
- vínculos propios;
- dominios;
- procesos;
- revisiones;
- próximas acciones;
- cierres;
- evidencias;
- autorización.

##### 11.6.15.2. Generada

- vista de cartera;
- motivos operativos;
- filtros;
- resultado de consulta;
- inconsistencia detectada;
- evento de auditoría.

#### 11.6.16. Requisitos relacionados

- `RF-052 — Consultar cartera profesional`
- `RF-055 — Identificar revisiones pendientes`
- `RF-021 — Evaluar autorización contextual`
- `RF-056 — Revisión profesional válida`

#### 11.6.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 11.6.18. Casos relacionados

- `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`
- `UC-P13 — Revisión nutricional`
- `UC-P18 — Revisión de entrenamiento`

#### 11.6.19. Puntos de auditoría

- profesional;
- asesorado o vínculo consultado;
- dominio;
- motivo de pendiente;
- revisión válida relacionada;
- próxima acción;
- filtros;
- denegación;
- inconsistencia;
- fecha de consulta.

#### 11.6.20. Decisiones o preguntas abiertas

1. Reglas exactas de pendiente: `DERIVAR 06`.
2. Ordenamiento y filtros: `DERIVAR 06/10`.
3. Datos visibles: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Pruebas de falsos pendientes: `DERIVAR 11A`.

#### 11.6.21. Criterio de cierre

El caso termina cuando el profesional consulta su cartera y pendientes con motivos no clínicos y autorización efectiva, o cuando una excepción impide presentar información confiable.

---

### 11.7. UC-P24 — Consultar dashboard y línea temporal interdisciplinaria

#### 11.7.1. Código

`UC-P24`

#### 11.7.2. Nombre

**Consultar dashboard y línea temporal interdisciplinaria**

#### 11.7.3. Objetivo

Permitir que un profesional autorizado consulte una síntesis interdisciplinaria limitada por consentimiento, finalidad y alcance, y una línea temporal que diferencie ocurrencia y registro sin producir una calificación agregada.

#### 11.7.4. Alcance

- **Superficie:** Website profesional.
- **Inicio:** el profesional selecciona un asesorado relacionado.
- **Fin:** consulta únicamente información autorizada y longitudinalmente reconstruible.

#### 11.7.5. Actor principal

Profesional autorizado.

#### 11.7.6. Actores secundarios

- Asesorado, como titular de la información.
- Sistema BE.

#### 11.7.7. Disparador

El profesional consulta el dashboard de un asesorado.

#### 11.7.8. Precondiciones

1. El profesional posee identidad y sesión válidas.
2. Existe vínculo aplicable.
3. Existe consentimiento vigente para al menos un dominio o conjunto.
4. `UC-I02` puede evaluar cada dato o conjunto.
5. La finalidad y el alcance están identificados.
6. Los eventos pueden asociarse a dominio y procedencia.
7. El dashboard no presume acceso a dominios no autorizados.

#### 11.7.9. Postcondiciones de éxito

1. El profesional consulta únicamente información autorizada.
2. Cada dato o conjunto conserva:
   - dominio;
   - finalidad;
   - alcance;
   - procedencia;
   - autoría;
   - momento de ocurrencia, cuando se conoce;
   - momento de registro.
3. Una autorización parcial produce una vista parcial explícita, no acceso global.
4. La línea temporal ordena eventos sin confundir ocurrencia y registro.
5. Los datos no autorizados no se muestran ni se infieren.
6. No se produce una calificación agregada.
7. No se produce una conclusión diagnóstica.
8. La consulta no modifica planes, revisiones o datos.
9. Puede invocarse `UC-E07` si existe coordinación autorizada.
10. El evento se audita según política.

#### 11.7.10. Garantías mínimas

- El rol profesional aislado no concede acceso completo.
- Un dominio autorizado no habilita otro.
- Un conjunto autorizado no habilita todo el dashboard.
- La falta de acceso no revela la existencia del recurso.
- La vista no completa huecos mediante inferencia.
- No existe una nota única sobre la persona.
- No existe una señal visual agregada de condición general.
- No existe diagnóstico automático.
- El dashboard no sustituye la revisión profesional.
- Abrir o visualizar no constituye revisión.
- Ocurrencia y registro permanecen separados.
- La procedencia se conserva.
- Una nota de coordinación no modifica dominios.
- Un fallo no presenta datos parciales como síntesis completa.

#### 11.7.11. Flujo principal

1. El profesional selecciona un asesorado relacionado.
2. BE identifica vínculo, consentimientos, finalidad y alcance.
3. BE solicita los conjuntos relevantes por dominio.
4. Para cada dato o conjunto, BE ejecuta `UC-I02`.
5. BE excluye los elementos no autorizados sin revelar detalles.
6. BE construye la síntesis autorizada.
7. BE obtiene eventos longitudinales permitidos.
8. Para cada evento conserva:
   - dominio;
   - tipo;
   - autor;
   - procedencia;
   - ocurrencia;
   - registro.
9. BE presenta dashboard y línea temporal.
10. El profesional consulta un detalle.
11. BE reevalúa autorización.
12. El profesional puede finalizar la consulta o invocar `UC-E07`.
13. BE registra la consulta según política.
14. El caso finaliza sin modificar información.

#### 11.7.12. Variantes

##### 11.7.12.1. V01 — Un solo dominio autorizado

**Resultado:** el dashboard muestra únicamente ese dominio y no presenta la ausencia de otros como dato clínico.

##### 11.7.12.2. V02 — Varios dominios autorizados

**Resultado:** cada conjunto conserva su dominio, finalidad y alcance.

##### 11.7.12.3. V03 — Autorización parcial dentro de un dominio

**Resultado:** se limita el conjunto visible; no se amplía al dominio completo.

##### 11.7.12.4. V04 — Información interdisciplinaria parcialmente autorizada

Una parte del contexto es visible y otra no.

**Resultado:** la vista permanece parcial y no se transforma en acceso global.

##### 11.7.12.5. V05 — Ocurrencia anterior al registro

Un evento se registra después de suceder.

**Resultado:** la línea temporal conserva ambos momentos.

##### 11.7.12.6. V06 — Solo momento de registro conocido

No puede determinarse cuándo ocurrió el hecho.

**Resultado:** BE no inventa ocurrencia y presenta la limitación.

##### 11.7.12.7. V07 — Evento corregido

Existe una corrección trazable.

**Resultado:** la línea temporal conserva original, corrección y momentos aplicables.

##### 11.7.12.8. V08 — Sin nota de coordinación

El profesional solo consulta.

**Resultado:** no se crea comunicación interdisciplinaria.

#### 11.7.13. Excepciones

##### 11.7.13.1. E01 — Sin consentimiento aplicable

**Resultado:** BE deniega sin revelar información protegida.

##### 11.7.13.2. E02 — Alcance ambiguo

**Resultado:** no construye una vista global por defecto.

##### 11.7.13.3. E03 — Procedencia ausente

**Resultado:** no presenta el dato como plenamente confiable; aplica política posterior.

##### 11.7.13.4. E04 — Ocurrencia y registro confundidos

**Resultado:** BE no ordena el evento como si ambos fueran equivalentes.

##### 11.7.13.5. E05 — Autorización inconsistente

**Resultado:** BE deniega conservadoramente y registra la inconsistencia.

##### 11.7.13.6. E06 — Intento de inferir dominio oculto

**Resultado:** BE no completa la síntesis con información no autorizada.

##### 11.7.13.7. E07 — Intento de modificar un dominio desde dashboard

**Resultado:** BE exige el caso propietario y autorización correspondiente.

##### 11.7.13.8. E08 — Falla de consulta o auditoría

**Resultado:** no presenta información parcial como completa.

#### 11.7.14. Reglas aplicables

1. `RF-053` gobierna el dashboard.
2. `RF-054` gobierna longitudinalidad.
3. Cada dato o conjunto invoca UC-I02.
4. Autorización parcial no equivale a acceso global.
5. Consentimiento, finalidad y alcance limitan la vista.
6. Ocurrencia y registro son momentos diferentes.
7. Autoría y procedencia permanecen visibles.
8. No existe calificación agregada.
9. No existe conclusión diagnóstica.
10. El dashboard no modifica dominios.
11. Consultar no constituye revisión.
12. Las proyecciones pertenecen a 06.
13. La política de visibilidad pertenece a 08.
14. La composición visual pertenece a 10.

#### 11.7.15. Información utilizada o generada

##### 11.7.15.1. Utilizada

- profesional;
- asesorado;
- vínculo;
- consentimientos;
- finalidad;
- alcance;
- datos por dominio;
- revisiones;
- ejecuciones;
- evaluaciones;
- correcciones;
- procedencia;
- autoría;
- momentos temporales.

##### 11.7.15.2. Generada

- síntesis autorizada;
- línea temporal;
- vista parcial;
- limitaciones;
- resultado de autorización;
- evento de consulta.

#### 11.7.16. Requisitos relacionados

- `RF-053 — Consultar dashboard interdisciplinario`
- `RF-054 — Construir historial longitudinal`
- `RF-021 — Evaluar autorización contextual`
- `RF-057 — Registrar nota de coordinación`, mediante `UC-E07`.

#### 11.7.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 11.7.18. Casos extendidos

- `UC-E07 — Registrar nota de coordinación autorizada`

#### 11.7.19. Puntos de auditoría

- profesional;
- asesorado;
- dominios solicitados;
- datos o conjuntos evaluados;
- finalidad;
- alcance;
- autorizaciones favorables y denegadas;
- procedencia;
- ocurrencia;
- registro;
- vista parcial;
- intento de inferencia;
- intento de modificación;
- fecha de consulta.

#### 11.7.20. Decisiones o preguntas abiertas

1. Proyecciones y agregados técnicos: `DERIVAR 06`.
2. Reglas finas de visibilidad: `DERIVAR 08`.
3. Auditoría de consultas: `DERIVAR 08`.
4. Contratos y filtros: `DERIVAR 09`.
5. Diseño del dashboard y timeline: `DERIVAR 10`.
6. Pruebas de autorización parcial: `DERIVAR 11A`.

#### 11.7.21. Criterio de cierre

El caso termina cuando el profesional consulta una síntesis y línea temporal limitadas por autorización, o cuando una excepción impide construirlas sin filtrar o inferir información protegida.

---

### 11.8. UC-E07 — Registrar nota de coordinación autorizada

#### 11.8.1. Código

`UC-E07`

#### 11.8.2. Tipo

Extensión de `UC-P24`.

#### 11.8.3. Nombre

**Registrar nota de coordinación autorizada**

#### 11.8.4. Objetivo

Permitir que un profesional autorizado comunique contexto pertinente a otro profesional autorizado sin prescribir, modificar o decidir sobre el dominio ajeno ni transferir responsabilidad profesional.

#### 11.8.5. Condición de extensión

El profesional consulta el dashboard y existe una necesidad de coordinación relacionada con información autorizada.

#### 11.8.6. Actor principal

Profesional autor.

#### 11.8.7. Actores secundarios

- Profesional destinatario o conjunto autorizado de profesionales.
- Asesorado, como titular de la información.
- Sistema BE.

#### 11.8.8. Precondiciones

1. El autor posee identidad y sesión válidas.
2. Existe vínculo y consentimiento aplicables.
3. La finalidad de coordinación está identificada.
4. `UC-I02` autoriza al autor.
5. `UC-I02` permite la visibilidad del destinatario.
6. La nota puede asociarse a dominio y contexto.
7. La nota no pretende modificar un plan ajeno.

#### 11.8.9. Postcondiciones de éxito

1. Existe una nota de coordinación identificable.
2. La nota conserva:
   - autor;
   - fecha;
   - dominio de origen;
   - finalidad;
   - destinatario o visibilidad autorizada;
   - referencias permitidas.
3. La nota no modifica un plan.
4. La nota no cambia un objetivo.
5. La nota no registra una revisión en nombre del destinatario.
6. La nota no prescribe sobre el dominio ajeno.
7. La responsabilidad profesional permanece en cada dominio.
8. El destinatario solo accede dentro de su autorización.
9. La nota aparece en la línea temporal según política.
10. El evento queda trazable.

#### 11.8.10. Garantías mínimas

- Coordinar no equivale a prescribir.
- Coordinar no equivale a modificar.
- Coordinar no equivale a decidir sobre otro dominio.
- Coordinar no transfiere responsabilidad profesional.
- La nota no sustituye una revisión válida.
- La nota no cierra un ciclo.
- La nota no cambia la próxima acción de otro profesional.
- El autor no puede ampliar la visibilidad por texto libre.
- Una referencia protegida no se vuelve visible por incluirla en la nota.
- No existe chat general.
- No existe comunicación fuera de la finalidad autorizada.
- Un fallo no presenta la nota como enviada o registrada.

#### 11.8.11. Flujo diferencial

1. El profesional selecciona coordinar desde `UC-P24`.
2. BE identifica autor, asesorado, dominios y finalidad.
3. BE ejecuta `UC-I02` para el autor.
4. El profesional selecciona destinatario o alcance de visibilidad permitido.
5. BE ejecuta `UC-I02` para la visibilidad resultante.
6. BE presenta los límites:
   - no prescribir;
   - no modificar;
   - no decidir sobre dominio ajeno;
   - no transferir responsabilidad.
7. El profesional registra la nota.
8. Puede referenciar información ya autorizada.
9. BE presenta autor, destinatario, dominio y finalidad.
10. El profesional confirma.
11. BE verifica que el contexto no haya cambiado.
12. BE registra mediante `UC-I03`.
13. BE incorpora la nota a la línea temporal conforme a política.
14. La extensión finaliza.

#### 11.8.12. Variantes

##### 11.8.12.1. V01 — Nota desde Nutrición hacia Entrenamiento

**Resultado:** aporta contexto permitido sin modificar la planificación de Entrenamiento.

##### 11.8.12.2. V02 — Nota desde Entrenamiento hacia Nutrición

**Resultado:** aporta contexto permitido sin modificar el plan nutricional.

##### 11.8.12.3. V03 — Nota relacionada con Antropometría

**Resultado:** referencia una evaluación autorizada sin convertir Antropometría en especialidad o decisión clínica.

##### 11.8.12.4. V04 — Destinatario sin acceso al dato referenciado

**Resultado:** la nota no amplía el acceso; BE omite o bloquea la referencia según política.

##### 11.8.12.5. V05 — Nota visible solo al autor

La política permite guardar un borrador o registro propio.

**Resultado:** no se presenta como coordinación enviada.

#### 11.8.13. Excepciones

##### 11.8.13.1. E01 — Destinatario no autorizado

**Resultado:** BE no registra la nota con esa visibilidad.

##### 11.8.13.2. E02 — Intento de prescripción cruzada

**Resultado:** BE rechaza la nota como coordinación válida.

##### 11.8.13.3. E03 — Intento de modificar plan ajeno

**Resultado:** BE exige el caso propietario y no aplica cambios.

##### 11.8.13.4. E04 — Intento de registrar revisión por otro profesional

**Resultado:** BE rechaza; cada profesional registra su propia revisión.

##### 11.8.13.5. E05 — Referencia protegida

**Resultado:** la nota no revela el recurso al destinatario.

##### 11.8.13.6. E06 — Transferencia explícita de responsabilidad

**Resultado:** BE no interpreta la nota como cambio de responsable; cualquier cambio formal requiere el caso y política propietarios.

##### 11.8.13.7. E07 — Falla de persistencia o auditoría

**Resultado:** no se presenta como registrada.

#### 11.8.14. Reglas aplicables

1. `RF-057` gobierna coordinación.
2. La nota requiere autorización del autor y visibilidad resultante.
3. La nota conserva autoría, fecha, dominio y finalidad.
4. No prescribe sobre dominio ajeno.
5. No modifica planes u objetivos ajenos.
6. No registra revisión por otro profesional.
7. No transfiere responsabilidad.
8. No cierra ciclos.
9. No amplía consentimiento.
10. Visibilidad pertenece a 08.
11. Contratos pertenecen a 09.
12. UI pertenece a 10.

#### 11.8.15. Información utilizada o generada

##### 11.8.15.1. Utilizada

- autor;
- asesorado;
- vínculo;
- consentimientos;
- dominio;
- finalidad;
- destinatario;
- referencias autorizadas.

##### 11.8.15.2. Generada

- nota;
- autoría;
- fecha;
- visibilidad;
- referencias;
- evento temporal;
- evento de auditoría.

#### 11.8.16. Requisitos relacionados

- `RF-057 — Registrar nota de coordinación autorizada`
- `RF-021 — Evaluar autorización contextual`
- `RF-054 — Línea temporal longitudinal`
- `RNF-DAT-003`
- `RNF-OBS-003`

#### 11.8.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 11.8.18. Puntos de auditoría

- autor;
- asesorado;
- dominio;
- finalidad;
- destinatario o visibilidad;
- referencias;
- fecha;
- intento de prescripción;
- intento de modificación;
- intento de transferencia;
- denegación;
- falla.

#### 11.8.19. Decisiones o preguntas abiertas

1. Visibilidad exacta: `DERIVAR 08`.
2. Política de borradores: `DERIVAR 08/10`.
3. Contratos: `DERIVAR 09`.
4. Presentación en timeline: `DERIVAR 10`.
5. Pruebas de filtración: `DERIVAR 11A`.

#### 11.8.20. Criterio de cierre

La extensión termina cuando una nota autorizada queda registrada sin alterar responsabilidades o dominios, o cuando una excepción impide convertir coordinación en prescripción cruzada.

---

### 11.9. UC-P31 — Consultar progreso longitudinal en APK

#### 11.9.1. Código

`UC-P31`

#### 11.9.2. Nombre

**Consultar progreso longitudinal en APK**

#### 11.9.3. Objetivo

Permitir que el asesorado consulte su propia información longitudinal por dominio y período, con procedencia y límites visibles, sin autodiagnóstico ni comparación con terceros.

#### 11.9.4. Alcance

- **Superficie:** APK Android.
- **Inicio:** el asesorado accede a su progreso.
- **Fin:** consulta información propia autorizada sin modificarla.

#### 11.9.5. Actor principal

Asesorado.

#### 11.9.6. Actores secundarios

- Sistema BE.
- Profesionales vinculados como autores de información visible.

#### 11.9.7. Disparador

El asesorado decide consultar su evolución.

#### 11.9.8. Precondiciones

1. El asesorado posee identidad y sesión válidas.
2. `UC-I02` autoriza el acceso a información propia.
3. Existen eventos o períodos visibles.
4. Cada elemento puede asociarse a dominio y procedencia.
5. Las notas profesionales se filtran conforme a política.
6. La vista no requiere información de terceros.

#### 11.9.9. Postcondiciones de éxito

1. El asesorado consulta únicamente su información.
2. La vista puede organizar por:
   - dominio;
   - período;
   - evento;
   - planificación y ejecución;
   - mediciones y cálculos;
   - revisiones y próximas acciones visibles.
3. Cada elemento conserva:
   - autoría;
   - procedencia;
   - momento de ocurrencia, cuando se conoce;
   - momento de registro.
4. Los límites de comparación son visibles.
5. No se presenta diagnóstico.
6. No se compara al asesorado con terceros.
7. No se produce una calificación agregada.
8. No se exponen notas no autorizadas.
9. La consulta no modifica datos.
10. El evento se audita según política.

#### 11.9.10. Garantías mínimas

- El asesorado solo consulta información propia.
- No existe comparación con otras personas.
- No existe clasificación relativa frente a una población.
- No existe diagnóstico automático.
- No existe conclusión causal.
- No existe una nota única de condición personal.
- No existe una señal visual agregada de condición general.
- Planificación y ejecución permanecen separadas.
- Mediciones y cálculos permanecen separados.
- Ocurrencia y registro permanecen separados.
- Autoría y procedencia se conservan.
- Las notas no autorizadas no se muestran ni se infieren.
- Consultar no modifica el proceso.
- Un fallo no presenta información parcial como progreso completo.

#### 11.9.11. Flujo principal

1. El asesorado abre progreso.
2. BE ejecuta `UC-I02`.
3. BE obtiene información propia visible.
4. BE organiza por dominio y período.
5. BE diferencia:
   - planificación;
   - ejecución;
   - mediciones;
   - cálculos;
   - revisiones;
   - próximas acciones.
6. BE conserva autoría y procedencia.
7. BE presenta ocurrencia y registro cuando corresponden.
8. BE muestra límites de comparación.
9. El asesorado consulta un detalle.
10. BE reevalúa autorización.
11. BE registra la consulta según política.
12. El caso finaliza sin modificar datos.

#### 11.9.12. Variantes

##### 11.9.12.1. V01 — Progreso nutricional

**Resultado:** muestra planificación, ejecución o adherencia y revisiones visibles sin diagnóstico.

##### 11.9.12.2. V02 — Progreso de entrenamiento

**Resultado:** diferencia prescripción y ejecución real.

##### 11.9.12.3. V03 — Evolución antropométrica

**Resultado:** diferencia mediciones directas y cálculos derivados e informa limitaciones.

##### 11.9.12.4. V04 — Varios dominios

**Resultado:** cada dominio permanece separado; no se produce una conclusión agregada.

##### 11.9.12.5. V05 — Período sin información suficiente

**Resultado:** BE informa limitación sin inventar tendencia.

##### 11.9.12.6. V06 — Evento registrado después de ocurrir

**Resultado:** se muestran ambos momentos cuando están disponibles.

#### 11.9.13. Excepciones

##### 11.9.13.1. E01 — Información de otro asesorado

**Resultado:** BE deniega sin revelar existencia.

##### 11.9.13.2. E02 — Nota profesional no visible

**Resultado:** BE no la muestra ni indica contenido.

##### 11.9.13.3. E03 — Procedencia ausente

**Resultado:** el elemento se presenta con limitación o se excluye conforme a política.

##### 11.9.13.4. E04 — Comparación con terceros solicitada

**Resultado:** BE no genera la comparación.

##### 11.9.13.5. E05 — Interpretación diagnóstica solicitada

**Resultado:** BE no la produce.

##### 11.9.13.6. E06 — Datos incompatibles

**Resultado:** BE no fuerza una tendencia o equivalencia silenciosa.

##### 11.9.13.7. E07 — Falla de consulta

**Resultado:** no presenta información parcial como completa.

#### 11.9.14. Reglas aplicables

1. `RF-065` gobierna progreso longitudinal en APK.
2. `RF-054` gobierna temporalidad.
3. El asesorado consulta información propia.
4. No existe autodiagnóstico.
5. No existe comparación con terceros.
6. No existe calificación agregada.
7. Dominios permanecen diferenciados.
8. Ocurrencia y registro permanecen separados.
9. Procedencia y autoría se conservan.
10. Visibilidad pertenece a 08.
11. Contratos pertenecen a 09.
12. Diseño y gráficos pertenecen a 10.

#### 11.9.15. Información utilizada o generada

##### 11.9.15.1. Utilizada

- identidad del asesorado;
- información propia;
- dominios;
- períodos;
- planes;
- ejecuciones;
- evaluaciones;
- cálculos;
- revisiones;
- próximas acciones;
- autoría;
- procedencia;
- momentos temporales.

##### 11.9.15.2. Generada

- vista de progreso;
- filtros;
- límites;
- resultado de consulta;
- evento de auditoría.

#### 11.9.16. Requisitos relacionados

- `RF-065 — Consultar progreso longitudinal en APK`
- `RF-054 — Construir historial longitudinal`
- `RF-021 — Evaluar autorización contextual`

#### 11.9.17. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 11.9.18. Casos relacionados

- `UC-P12 — Ejecución nutricional`
- `UC-P17 — Ejecución de entrenamiento`
- `UC-P20 — Evolución antropométrica`
- `UC-P24 — Dashboard y línea temporal`

#### 11.9.19. Puntos de auditoría

- asesorado;
- dominio;
- período;
- elementos consultados;
- procedencia;
- autoría;
- ocurrencia;
- registro;
- nota filtrada;
- intento de comparación;
- intento de diagnóstico;
- denegación;
- falla.

#### 11.9.20. Decisiones o preguntas abiertas

1. Datos visibles: `DERIVAR 08`.
2. Filtros y períodos: `DERIVAR 06/10`.
3. Contratos: `DERIVAR 09`.
4. Gráficos y copy: `DERIVAR 10`.
5. Pruebas de filtración: `DERIVAR 11A`.

#### 11.9.21. Criterio de cierre

El caso termina cuando el asesorado consulta su progreso longitudinal propio con límites y procedencia visibles, o cuando una excepción impide producir una vista invasiva o engañosa.

---

### 11.10. Historias de usuario prioritarias

#### 11.10.1. HU-17 — Organizar trabajo pendiente

**Como** profesional  
**quiero** consultar mi cartera y reconocer qué ciclos necesitan revisión o próxima acción  
**para** organizar trabajo sin clasificar clínicamente a los asesorados.

##### 11.10.1.1. Criterios de aceptación

###### 11.10.1.1.1. Escenario 1 — Motivo operativo

**Dado** que un ciclo requiere revisión  
**cuando** consulto la cartera  
**entonces** BE explica el motivo en lenguaje operativo  
**y** no emite diagnóstico o gravedad.

###### 11.10.1.1.2. Escenario 2 — Apertura sin revisión

**Dado** que solo consulté la cartera  
**cuando** cierro la vista  
**entonces** el pendiente no se resuelve  
**y** no se crea una revisión válida.

###### 11.10.1.1.3. Escenario 3 — Relación ajena

**Dado** que un vínculo no me pertenece  
**cuando** intento consultarlo  
**entonces** BE deniega  
**y** no revela su existencia.

---

#### 11.10.2. HU-18 — Consultar contexto interdisciplinario autorizado

**Como** profesional autorizado  
**quiero** consultar información pertinente por dominio y una línea temporal reconstruible  
**para** comprender el proceso sin convertir una autorización parcial en acceso global.

##### 11.10.2.1. Criterios de aceptación

###### 11.10.2.1.1. Escenario 1 — Autorización parcial

**Dado** que solo estoy autorizado sobre parte del contexto  
**cuando** consulto el dashboard  
**entonces** BE muestra únicamente los conjuntos permitidos  
**y** no infiere los ocultos.

###### 11.10.2.1.2. Escenario 2 — Ocurrencia y registro

**Dado** que un evento ocurrió antes de registrarse  
**cuando** consulto la línea temporal  
**entonces** BE conserva ambos momentos  
**y** no los presenta como equivalentes.

###### 11.10.2.1.3. Escenario 3 — Sin calificación agregada

**Dado** que existen varios dominios visibles  
**cuando** consulto la síntesis  
**entonces** BE mantiene cada dominio identificado  
**y** no produce una conclusión única sobre la persona.

---

#### 11.10.3. HU-19 — Coordinar sin invadir otro dominio

**Como** profesional  
**quiero** registrar una nota autorizada para otro profesional  
**para** compartir contexto sin prescribir ni transferir responsabilidad.

##### 11.10.3.1. Criterios de aceptación

###### 11.10.3.1.1. Escenario 1 — Nota válida

**Dado** que autor y destinatario están autorizados  
**cuando** registro una nota con dominio y finalidad  
**entonces** BE conserva autoría, fecha y visibilidad  
**y** no modifica planes.

###### 11.10.3.1.2. Escenario 2 — Prescripción cruzada

**Dado** que intento decidir sobre el dominio ajeno  
**cuando** confirmo la nota  
**entonces** BE rechaza la operación como coordinación válida.

###### 11.10.3.1.3. Escenario 3 — Recurso no visible

**Dado** que el destinatario no puede ver una referencia  
**cuando** intento incluirla  
**entonces** la nota no amplía su acceso.

###### 11.10.3.1.4. Escenario 4 — Responsabilidad

**Dado** que envío una nota  
**cuando** el destinatario la consulta  
**entonces** cada profesional conserva responsabilidad sobre su dominio.

---

#### 11.10.4. HU-20 — Consultar progreso propio

**Como** asesorado  
**quiero** consultar mi progreso por dominio y período  
**para** comprender mi proceso sin autodiagnóstico ni comparación con otras personas.

##### 11.10.4.1. Criterios de aceptación

###### 11.10.4.1.1. Escenario 1 — Información propia

**Dado** que existen eventos visibles  
**cuando** consulto progreso  
**entonces** BE muestra únicamente mi información  
**y** conserva autoría y procedencia.

###### 11.10.4.1.2. Escenario 2 — Dominios separados

**Dado** que tengo información nutricional, de entrenamiento y antropométrica  
**cuando** consulto progreso  
**entonces** BE mantiene los dominios diferenciados  
**y** no produce una calificación agregada.

###### 11.10.4.1.3. Escenario 3 — Sin comparación social

**Dado** que solicito comparación con otras personas  
**cuando** uso la APK  
**entonces** BE no genera esa comparación.

###### 11.10.4.1.4. Escenario 4 — Datos insuficientes

**Dado** que un período no tiene información suficiente  
**cuando** consulto la vista  
**entonces** BE informa la limitación  
**y** no inventa una tendencia.

---

### 11.11. Contraste AS-IS específico

| Elemento TO-BE | Evidencia AS-IS conocida | Clasificación preliminar | Tratamiento |
|---|---|---|---|
| Cartera profesional | Parcial | `PRESERVAR + REFACTORIZAR` | Limitar a relaciones propias y motivos operativos. |
| Revisiones pendientes | No evidenciadas de extremo a extremo | `NO EVIDENCIADO` | Derivar de ciclos y DEC-043, no de actividad de interfaz. |
| Dashboard interdisciplinario autorizado | Parcial | `REFACTORIZAR` | Autorizar cada dato o conjunto. |
| Calificación agregada | Fuera del TO-BE | `RETIRAR / NO INCORPORAR` | Mantener dominios y hechos separados. |
| Línea temporal ocurrencia/registro | No evidenciada | `NO EVIDENCIADO` | Preservar ambos momentos. |
| Nota de coordinación | No evidenciada de extremo a extremo | `NO EVIDENCIADO` | Comunicación autorizada sin responsabilidad cruzada. |
| Progreso longitudinal en APK | Parcial | `REFACTORIZAR` | Información propia, procedencia y límites. |
| Comparación con terceros | Fuera del TO-BE | `RETIRAR / NO INCORPORAR` | No incorporar comparación social. |

---

### 11.12. Revisión crítica consolidada

#### 11.12.1. Controles superados

1. No se implementa una calificación agregada.
2. No se implementa una señal visual única de condición general.
3. La cartera usa lenguaje no clínico.
4. Los pendientes no se resuelven por visualización.
5. UC-P24 autoriza cada dato o conjunto.
6. Una autorización parcial no produce acceso global.
7. Ocurrencia y registro permanecen separados.
8. Procedencia y autoría se conservan.
9. UC-E07 no prescribe sobre otro dominio.
10. UC-E07 no modifica planes u objetivos ajenos.
11. UC-E07 no registra revisión por otro profesional.
12. UC-E07 no transfiere responsabilidad.
13. UC-P31 muestra información propia.
14. UC-P31 no diagnostica.
15. UC-P31 no compara con terceros.
16. Todos los casos actorales invocan UC-I02.
17. El glosario fue actualizado antes de propagar.
18. Jerarquía H1–H5 conforme.
19. Bloques de código balanceados.
20. No se fijan entidades, contratos o pantallas.

#### 11.12.2. Autoverificación exigida

| Control | Resultado |
|---|---|
| Sin calificación agregada implementada | `CUMPLE` |
| Sin señal visual única de condición general | `CUMPLE` |
| Lenguaje no clínico en pendientes | `CUMPLE` |
| UC-E07 sin transferencia de responsabilidad | `CUMPLE` |
| UC-E07 sin prescripción cruzada | `CUMPLE` |
| RF-054 distingue ocurrencia y registro | `CUMPLE` |
| UC-P24 limita por consentimiento, finalidad y alcance | `CUMPLE` |
| Autorización parcial no se vuelve global | `CUMPLE` |
| UC-P31 sin autodiagnóstico | `CUMPLE` |
| UC-P31 sin comparación con terceros | `CUMPLE` |
| Todos los casos invocan UC-I02 | `CUMPLE` |
| Glosario actualizado | `CUMPLE` |
| Jerarquía normalizada | `CUMPLE` |

#### 11.12.3. Riesgos abiertos

##### 11.12.3.1. R-05-DAS-01 — Síntesis convertida en calificación

**Control:** dominios separados y prohibición de conclusión única.

##### 11.12.3.2. R-05-DAS-02 — Pendiente con lenguaje clínico

**Control:** motivos operativos y pruebas de copy en 10/11A.

##### 11.12.3.3. R-05-DAS-03 — Autorización parcial ampliada

**Control:** UC-I02 por dato o conjunto y denegación conservadora.

##### 11.12.3.4. R-05-DAS-04 — Timeline temporalmente ambiguo

**Control:** ocurrencia y registro diferenciados.

##### 11.12.3.5. R-05-DAS-05 — Nota que invade otro dominio

**Control:** garantías, excepciones y auditoría de UC-E07.

##### 11.12.3.6. R-05-DAS-06 — Nota que transfiere responsabilidad

**Control:** responsabilidad permanece por dominio; cambio formal requiere caso propietario.

##### 11.12.3.7. R-05-DAS-07 — Progreso convertido en autodiagnóstico

**Control:** datos propios, límites visibles y ausencia de conclusión clínica.

##### 11.12.3.8. R-05-DAS-08 — Comparación social invasiva

**Control:** UC-P31 rechaza comparación con terceros.

##### 11.12.3.9. R-05-DAS-09 — Datos ocultos inferidos

**Control:** el dashboard no completa huecos ni revela existencia.

#### 11.12.4. Veredicto del bloque

```text
BLOQUE 08 — CARTERA, DASHBOARD Y PROGRESO:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS PRINCIPALES:
UC-P23, UC-P24, UC-P31

EXTENSIÓN:
UC-E07

RF PRINCIPALES:
RF-052, RF-053, RF-054, RF-055, RF-057, RF-065

AUTORIZACIÓN:
POR DATO O CONJUNTO
SIN ACCESO GLOBAL

COORDINACIÓN:
SIN PRESCRIPCIÓN CRUZADA
SIN TRANSFERENCIA DE RESPONSABILIDAD

PROGRESO APK:
PROPIO
NO DIAGNÓSTICO
SIN COMPARACIÓN CON TERCEROS

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

### 11.13. Decisiones del bloque

#### 11.13.1. Aprobadas y aplicadas

- cartera profesional propia;
- pendientes con lenguaje no clínico;
- dashboard por autorización;
- autorización parcial no global;
- separación ocurrencia/registro;
- procedencia y autoría;
- coordinación autorizada;
- responsabilidad separada por dominio;
- progreso longitudinal propio;
- ausencia de comparación con terceros.

#### 11.13.2. Provisionales

- códigos de casos;
- reglas exactas de pendiente;
- ordenamiento y filtros;
- proyecciones de lectura;
- visibilidad de notas;
- presentación temporal;
- períodos del progreso.

#### 11.13.3. Pendientes derivados

- proyecciones y estados: `06`;
- arquitectura de lectura: `07`;
- visibilidad, notas y auditoría: `08`;
- contratos: `09`;
- UI y copy: `10`;
- pruebas de filtración: `11A`;
- trazabilidad: `12`.

---

### 11.14. Criterio de aprobación del bloque

Dirección puede aprobar este bloque si confirma que:

1. la cartera usa lenguaje no clínico;
2. el dashboard no produce una calificación agregada;
3. UC-I02 se aplica por dato o conjunto;
4. una autorización parcial no se amplía;
5. la línea temporal distingue ocurrencia y registro;
6. UC-E07 no prescribe ni modifica otro dominio;
7. UC-E07 no transfiere responsabilidad;
8. UC-P31 muestra información propia;
9. UC-P31 no diagnostica ni compara con terceros;
10. el glosario y la jerarquía son coherentes.

---

### 11.15. Estado

```text
ARQUITECTURA:
v0.2.8

GLOSARIO:
v0.1.7

BLOQUE 07:
v0.9 — APTO

BLOQUE 08:
REDACTADO EN v0.10
PENDIENTE DE REVISIÓN DE DIRECCIÓN

CASOS:
UC-P23, UC-P24, UC-P31, UC-E07

BLOQUES FUNCIONALES PRINCIPALES:
8/8 REDACTADOS

CIERRE TOTAL DEL DOCUMENTO 05:
SUJETO A AUDITORÍA GLOBAL DE CASOS COMPLEMENTARIOS

GIT:
SIN CAMBIOS
```

---

## 12. Cierre complementario A — Identidad, acceso y ciclo de cuenta

*Fuente ensamblada: `BE_LEG_05_v0.11_CIERRE_A_IDENTIDAD_ACCESO_CUENTA.md`.*

### 12.1. Propósito

Este cierre complementario formaliza los recorridos P0/P1 de identidad y acceso que sostienen todo el sistema:

```text
identidad BE
→ perfil propio
→ método de acceso local
→ sesión
→ encauzamiento por superficie
→ operación protegida mediante UC-I02
```

También cubre:

- acceso federado opcional con Google;
- administración de métodos de acceso;
- recuperación neutral de proveedor;
- contingencia de recuperación asistida documentada;
- cierre trazable de cuenta.

No fija:

- algoritmo de credenciales;
- proveedor de correo;
- canal obligatorio de recuperación;
- duración de sesión;
- navegación;
- retención;
- reversibilidad;
- borrado físico.

---

### 12.2. Reglas funcionales

#### 12.2.1. Identidad no equivale a rol

```text
identidad BE
≠ especialidad
≠ capacidad
≠ habilitación
≠ vínculo
≠ consentimiento
≠ autorización
```

#### 12.2.2. Autenticación no concede acceso protegido

Una sesión válida identifica al actor. Toda operación protegida sigue invocando `UC-I02`.

#### 12.2.3. Google extiende, no reemplaza

`UC-E05` parte de `UC-P26`. La indisponibilidad del proveedor no elimina el acceso local ni crea una identidad paralela.

#### 12.2.4. Recuperación neutral de proveedor

`UC-E09` no presupone correo, SMS ni un proveedor determinado. Los mecanismos pertenecen a `08/09`.

Si la recuperación automática se difiere, la contingencia documentada es:

> **Recuperación asistida por soporte administrativo autorizado, con verificación de identidad conforme a política posterior, registro trazable y sin crear una nueva sesión hasta completar el proceso.**

#### 12.2.5. Cierre no equivale a borrado

El cierre:

- impide nuevas sesiones;
- impide nuevas operaciones;
- finaliza vínculos activos mediante eventos;
- conserva autoría e historia;
- deriva retención y reversibilidad a `06/08`.

---

### 12.3. Relaciones

```text
UC-P25 — Registrar identidad BE y perfil propio
  incluye → UC-I03
  incluye → UC-I11

UC-P26 — Autenticar y finalizar una sesión local
  incluye → UC-I03
  incluye → UC-I11
  puede ser extendido por → UC-E05, UC-E06, UC-E09

UC-P27 — Solicitar cierre de cuenta
  incluye → UC-I02
  incluye → UC-I03
  relaciona → UC-P06 para finalizar vínculos activos
```

---

### 12.4. UC-P25 — Registrar identidad BE y perfil propio

#### 12.4.1. Código

`UC-P25`

#### 12.4.2. Objetivo

Crear una identidad BE persistente y permitir que su titular gestione el perfil propio sin obtener por ello roles, capacidades o acceso a terceros.

#### 12.4.3. Actor principal

Profesional o asesorado.

#### 12.4.4. Precondiciones

1. El actor no posee una identidad equivalente ya confirmada, o se encuentra en un recorrido controlado de asociación.
2. La superficie de registro puede determinarse mediante `UC-I11`.
3. Los datos mínimos funcionales pueden registrarse sin fijar aquí su estructura.

#### 12.4.5. Postcondiciones de éxito

1. Existe una identidad BE única y persistente.
2. El perfil propio queda asociado a esa identidad.
3. El estado operativo es observable.
4. No se conceden especialidades, capacidades, vínculos, consentimientos ni autorizaciones.
5. La creación queda trazable.

#### 12.4.6. Garantías mínimas

- Un proveedor de acceso no crea una identidad distinta.
- Profesional y asesorado utilizan la misma noción de identidad.
- El perfil propio no es un perfil clínico.
- El registro no concede acceso a información de terceros.
- Un fallo no presenta la identidad como creada.
- Las modificaciones posteriores quedan auditadas.

#### 12.4.7. Flujo principal

1. El actor inicia el registro.
2. BE ejecuta `UC-I11` para encauzar la superficie prevista.
3. BE solicita la información mínima funcional.
4. El actor revisa y confirma.
5. BE verifica duplicidad e integridad conforme a políticas posteriores.
6. BE crea la identidad persistente.
7. BE crea el perfil propio.
8. BE registra autoría, ocurrencia y registro mediante `UC-I03`.
9. BE informa el estado operativo resultante.
10. El caso finaliza sin conceder permisos profesionales.

#### 12.4.8. Variantes

##### 12.4.8.1. V01 — Registro como asesorado

**Resultado:** se crea la identidad y el perfil propio del asesorado conforme a `RF-017`.

##### 12.4.8.2. V02 — Registro con intención profesional

**Resultado:** se crea la identidad; el alta profesional continúa por `UC-P01`.

##### 12.4.8.3. V03 — Perfil existente

**Resultado:** BE evita duplicar la identidad y encauza al acceso o recuperación correspondiente.

#### 12.4.9. Excepciones

##### 12.4.9.1. E01 — Identidad equivalente detectada

**Resultado:** no crea una segunda identidad.

##### 12.4.9.2. E02 — Información mínima insuficiente

**Resultado:** no declara el registro completo.

##### 12.4.9.3. E03 — Falla de persistencia o auditoría

**Resultado:** no presenta éxito.

#### 12.4.10. Reglas aplicables

1. `RF-001`, `RF-006` y `RF-017` gobiernan el caso.
2. Identidad y perfil son independientes de especialidad.
3. El estado operativo es un resultado observable, no un enum definido en 05.
4. Navegación pertenece a 10.
5. Persistencia pertenece a 06.

#### 12.4.11. Casos incluidos

- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

#### 12.4.12. Puntos de auditoría

- actor;
- intención de perfil;
- duplicidad;
- creación;
- estado operativo;
- fecha de ocurrencia;
- fecha de registro;
- falla.

#### 12.4.13. Criterio de cierre

Existe una identidad persistente y un perfil propio, o una excepción impide crear duplicados o estados falsos.

---

### 12.5. UC-P26 — Autenticar y finalizar una sesión local

#### 12.5.1. Código

`UC-P26`

#### 12.5.2. Objetivo

Permitir acceso local y finalización de sesión, dejando claro que la autenticación identifica al actor pero no concede autorización global.

#### 12.5.3. Actor principal

Profesional, asesorado o administrador.

#### 12.5.4. Precondiciones

1. Existe una identidad BE.
2. Existe un método local utilizable.
3. El estado operativo permite intentar acceso.
4. `UC-I11` puede determinar la superficie funcional posterior.

#### 12.5.5. Postcondiciones de éxito

##### 12.5.5.1. Acceso

1. Existe una sesión asociada a la identidad.
2. El actor queda encauzado por la superficie prevista.
3. Toda operación protegida posterior exige `UC-I02`.
4. El evento queda trazable.

##### 12.5.5.2. Finalización

1. La sesión deja de ser utilizable.
2. No se modifican identidad, vínculos o información.
3. El evento queda trazable.

#### 12.5.6. Garantías mínimas

- Autenticación no equivale a autorización.
- La sesión no concede acceso a todos los dominios.
- Finalizar sesión no cierra la cuenta.
- Un error no crea una sesión parcial.
- Google no es obligatorio.
- Recuperación no crea sesión antes de completarse.
- Navegación concreta no se fija en 05.

#### 12.5.7. Flujo principal — Acceso local

1. El actor selecciona acceso local.
2. Presenta el método aplicable.
3. BE verifica el método conforme a `08/09`.
4. BE verifica el estado operativo.
5. BE crea la sesión.
6. BE ejecuta `UC-I11`.
7. BE registra mediante `UC-I03`.
8. El caso finaliza.

#### 12.5.8. Flujo principal — Finalizar sesión

1. El actor solicita salir.
2. BE identifica la sesión.
3. BE la vuelve inutilizable.
4. BE registra el evento.
5. El caso finaliza sin modificar la cuenta.

#### 12.5.9. Variantes

##### 12.5.9.1. V01 — Acceso mediante Google

**Resultado:** continúa mediante `UC-E05`.

##### 12.5.9.2. V02 — Administración de métodos

**Resultado:** continúa mediante `UC-E06`.

##### 12.5.9.3. V03 — Acceso local no recuperable

**Resultado:** continúa mediante `UC-E09`.

#### 12.5.10. Excepciones

##### 12.5.10.1. E01 — Método inválido

**Resultado:** no crea sesión y no filtra datos de la identidad.

##### 12.5.10.2. E02 — Cuenta cerrada o no operativa

**Resultado:** no crea nuevas sesiones.

##### 12.5.10.3. E03 — Falla de creación o cierre

**Resultado:** no presenta un estado falso.

#### 12.5.11. Reglas aplicables

1. `RF-002`, `RF-006` y `RF-007` gobiernan el caso.
2. Google y recuperación son extensiones.
3. Autorización pertenece a `UC-I02`.
4. Seguridad técnica pertenece a `08/09`.
5. Navegación pertenece a 10.

#### 12.5.12. Casos incluidos

- `UC-I03`
- `UC-I11`

#### 12.5.13. Puntos de auditoría

- identidad;
- método;
- resultado;
- estado operativo;
- superficie;
- creación o cierre de sesión;
- fecha;
- falla.

#### 12.5.14. Criterio de cierre

Existe una sesión válida o una sesión finalizada de forma trazable, sin conceder permisos implícitos.

---

### 12.6. UC-E05 — Acceder mediante Google

#### 12.6.1. Código

`UC-E05`

#### 12.6.2. Tipo

Extensión de `UC-P26`.

#### 12.6.3. Objetivo

Permitir un método federado opcional sin crear identidades duplicadas ni dependencia exclusiva del proveedor.

#### 12.6.4. Condición de extensión

El actor selecciona Google como método de acceso.

#### 12.6.5. Flujo diferencial

1. UC-P26 inicia la autenticación.
2. El actor selecciona Google.
3. BE deriva la verificación al proveedor mediante contrato posterior.
4. BE recibe un resultado verificable.
5. BE relaciona el método con una identidad existente o inicia una asociación controlada.
6. BE evita crear una identidad paralela.
7. Si el método es válido, UC-P26 continúa la sesión.
8. BE registra proveedor y resultado mediante UC-I03.

#### 12.6.6. Garantías mínimas

- Google es P1 y opcional.
- El acceso local permanece disponible.
- La indisponibilidad de Google no bloquea el acceso local.
- Una cuenta federada no concede roles o permisos.
- No se fusionan identidades silenciosamente.
- Contratos pertenecen a 09.

#### 12.6.7. Excepciones

##### 12.6.7.1. E01 — Proveedor indisponible

**Resultado:** se informa la contingencia y se ofrece acceso local.

##### 12.6.7.2. E02 — Identidad ambigua

**Resultado:** no se vincula ni crea sesión hasta resolver la asociación.

##### 12.6.7.3. E03 — Resultado no verificable

**Resultado:** no se crea sesión.

#### 12.6.8. Requisitos relacionados

- `RF-003`
- `RF-002`
- `RF-006`

#### 12.6.9. Criterio de cierre

UC-P26 continúa con una identidad inequívoca o se mantiene disponible el fallback local.

---

### 12.7. UC-E06 — Administrar métodos de acceso

#### 12.7.1. Código

`UC-E06`

#### 12.7.2. Tipo

Extensión de `UC-P26`.

#### 12.7.3. Objetivo

Vincular o retirar métodos de acceso sin modificar la identidad BE ni dejar la cuenta sin una ruta utilizable.

#### 12.7.4. Precondiciones

1. El actor posee una sesión y autorización aplicables.
2. Existe al menos un método actual.
3. El método nuevo o a retirar puede identificarse.

#### 12.7.5. Flujo diferencial

1. El actor consulta sus métodos.
2. BE ejecuta `UC-I02`.
3. El actor agrega o solicita retirar un método.
4. BE verifica que la operación no cree una identidad paralela.
5. BE verifica que quede una ruta utilizable o una recuperación aprobada.
6. El actor confirma.
7. BE registra el cambio y la historia mediante `UC-I03`.

#### 12.7.6. Garantías mínimas

- La identidad persiste.
- No se retira el último método utilizable sin alternativa confirmada.
- Un método no equivale a rol.
- El cambio no modifica vínculos o consentimientos.
- La verificación técnica pertenece a 08/09.

#### 12.7.7. Excepciones

##### 12.7.7.1. E01 — Último método sin alternativa

**Resultado:** no se retira.

##### 12.7.7.2. E02 — Método asociado a otra identidad

**Resultado:** no se vincula silenciosamente.

##### 12.7.7.3. E03 — Falla de persistencia

**Resultado:** no presenta el cambio como aplicado.

#### 12.7.8. Requisitos relacionados

- `RF-004`
- `RF-002`
- `RF-005`

#### 12.7.9. Criterio de cierre

Los métodos quedan actualizados sin perder la identidad ni la capacidad de recuperación.

---

### 12.8. UC-E09 — Recuperar el acceso local

#### 12.8.1. Código

`UC-E09`

#### 12.8.2. Tipo

Extensión de `UC-P26`.

#### 12.8.3. Objetivo

Restablecer una ruta local utilizable mediante un recorrido neutral de proveedor, sin presuponer correo y sin crear una sesión antes de completar la verificación aplicable.

#### 12.8.4. Precondiciones

1. Existe una identidad BE.
2. El actor no dispone de un método local utilizable.
3. Puede iniciar una verificación conforme a política posterior.

#### 12.8.5. Flujo diferencial

1. El actor solicita recuperación.
2. BE identifica el proceso sin revelar información sensible.
3. BE aplica el mecanismo aprobado en `08/09`.
4. El actor completa la verificación.
5. BE habilita la definición de un método local nuevo.
6. BE registra actor, resultado y fecha.
7. El actor vuelve a UC-P26 para iniciar sesión.

#### 12.8.6. Variante — Función diferida

Si la recuperación automática no integra la entrega académica:

1. BE informa la contingencia documentada.
2. Se inicia recuperación asistida por soporte administrativo autorizado.
3. El soporte verifica identidad conforme a política posterior.
4. No crea ni entrega una sesión manual.
5. Registra el resultado.
6. El actor define un método utilizable y vuelve a UC-P26.

#### 12.8.7. Garantías mínimas

- No presupone correo.
- No presupone un proveedor.
- No crea una identidad nueva.
- No entrega acceso antes de completar la verificación.
- La contingencia queda documentada y trazable.
- Mecanismos y vigencias pertenecen a 08/09.

#### 12.8.8. Excepciones

##### 12.8.8.1. E01 — Identidad no verificable

**Resultado:** no se restablece el acceso.

##### 12.8.8.2. E02 — Proceso vencido o inválido

**Resultado:** se inicia uno nuevo conforme a política.

##### 12.8.8.3. E03 — Falla de auditoría

**Resultado:** no se presenta recuperación exitosa.

#### 12.8.9. Requisitos relacionados

- `RF-005`
- `RF-002`
- `RF-006`

#### 12.8.10. Criterio de cierre

Existe un método local utilizable o una contingencia asistida correctamente registrada, sin crear acceso silencioso.

---

### 12.9. UC-P27 — Solicitar cierre de cuenta

#### 12.9.1. Código

`UC-P27`

#### 12.9.2. Objetivo

Permitir que el titular solicite un cierre trazable que impida nuevas sesiones y operaciones, finalice vínculos activos mediante eventos y preserve información conforme a políticas posteriores.

#### 12.9.3. Actor principal

Profesional o asesorado.

#### 12.9.4. Precondiciones

1. El titular posee identidad y sesión válidas.
2. `UC-I02` autoriza decidir sobre la cuenta propia.
3. BE puede identificar sesiones y vínculos activos.
4. La solicitud puede confirmarse de forma explícita.

#### 12.9.5. Postcondiciones de éxito

1. El estado operativo impide nuevas sesiones.
2. Las sesiones activas dejan de ser utilizables conforme a política.
3. Los vínculos activos se finalizan mediante eventos trazables.
4. No se aceptan nuevas operaciones profesionales.
5. La identidad, autoría e historia permanecen.
6. No se ejecuta borrado silencioso.
7. Retención, supresión y reversibilidad quedan derivadas a `06/08`.
8. El cierre queda trazable.

#### 12.9.6. Garantías mínimas

- Cerrar no equivale a borrar inmediatamente.
- Cerrar no reasigna autoría.
- No se eliminan versiones o revisiones.
- Los vínculos no desaparecen sin evento.
- No se crean nuevas sesiones.
- Una falla no deja un cierre parcial presentado como completo.
- Reapertura o reversibilidad no se decide en 05.

#### 12.9.7. Flujo principal

1. El titular solicita cerrar la cuenta.
2. BE ejecuta `UC-I02`.
3. BE presenta consecuencias observables y pendientes derivados.
4. El titular confirma.
5. BE verifica el contexto.
6. BE impide nuevas sesiones.
7. BE invalida sesiones activas conforme a política.
8. BE finaliza vínculos activos mediante el comportamiento de `UC-P06`.
9. BE registra cada evento mediante `UC-I03`.
10. BE informa el resultado.
11. El caso finaliza.

#### 12.9.8. Variantes

##### 12.9.8.1. V01 — Cuenta sin vínculos activos

**Resultado:** se cierra sin inventar eventos relacionales.

##### 12.9.8.2. V02 — Cuenta profesional con procesos vigentes

**Resultado:** se impiden nuevas operaciones; retención y continuidad documental pertenecen a 06/08.

##### 12.9.8.3. V03 — Solicitud cancelada antes de confirmar

**Resultado:** no cambia el estado operativo.

#### 12.9.9. Excepciones

##### 12.9.9.1. E01 — Actor no autorizado

**Resultado:** BE deniega.

##### 12.9.9.2. E02 — Cierre concurrente

**Resultado:** presenta la situación vigente sin duplicar eventos.

##### 12.9.9.3. E03 — Falla al finalizar vínculos

**Resultado:** no presenta cierre completo; registra inconsistencia.

##### 12.9.9.4. E04 — Solicitud de borrado total inmediato

**Resultado:** se deriva a política de retención y supresión; no borra silenciosamente.

#### 12.9.10. Reglas aplicables

1. `RF-069` gobierna el cierre.
2. El cierre impide nuevas sesiones.
3. Los vínculos finalizan mediante eventos.
4. La historia se conserva.
5. Retención y reversibilidad pertenecen a 06/08.
6. Contratos pertenecen a 09.
7. Copy y confirmaciones pertenecen a 10.

#### 12.9.11. Casos incluidos

- `UC-I02`
- `UC-I03`

#### 12.9.12. Casos relacionados

- `UC-P06`
- `UC-P26`

#### 12.9.13. Puntos de auditoría

- titular;
- confirmación;
- estado anterior y posterior;
- sesiones;
- vínculos finalizados;
- fecha;
- fallas;
- solicitud de borrado.

#### 12.9.14. Criterio de cierre

La cuenta queda cerrada de forma trazable y sin nuevas sesiones, o una excepción impide declarar un cierre parcial como completo.

---

### 12.10. Historias prioritarias

#### 12.10.1. HU-21 — Crear identidad y acceder localmente

**Como** persona usuaria de BE  
**quiero** contar con una identidad persistente y acceso local  
**para** utilizar la superficie correspondiente sin depender de un proveedor externo.

##### 12.10.1.1. Criterios de aceptación

###### 12.10.1.1.1. Escenario 1 — Identidad sin permisos implícitos

**Dado** que completo el registro  
**cuando** se crea mi identidad  
**entonces** no recibo especialidades, vínculos o autorizaciones automáticas.

###### 12.10.1.1.2. Escenario 2 — Acceso local

**Dado** que mi método es válido  
**cuando** inicio sesión  
**entonces** BE identifica mi cuenta  
**y** las operaciones protegidas siguen evaluando UC-I02.

###### 12.10.1.1.3. Escenario 3 — Google caído

**Dado** que Google no responde  
**cuando** intento acceder  
**entonces** el acceso local continúa disponible.

#### 12.10.2. HU-22 — Recuperar sin depender del correo

**Como** titular  
**quiero** recuperar una ruta local utilizable mediante un proceso neutral  
**para** no depender de un canal o proveedor fijo.

##### 12.10.2.1. Criterios de aceptación

###### 12.10.2.1.1. Escenario 1 — Recuperación completa

**Dado** que verifico mi identidad conforme a política  
**cuando** completo el recorrido  
**entonces** puedo definir un método local  
**y** no recibo una sesión antes de terminar.

###### 12.10.2.1.2. Escenario 2 — Función diferida

**Dado** que la recuperación automática no está integrada  
**cuando** solicito ayuda  
**entonces** se inicia una contingencia asistida documentada  
**y** no se entrega acceso manual sin auditoría.

#### 12.10.3. HU-23 — Cerrar sin borrar historia

**Como** titular  
**quiero** cerrar mi cuenta  
**para** impedir nuevas sesiones y operaciones sin borrar silenciosamente mi historia.

##### 12.10.3.1. Criterios de aceptación

###### 12.10.3.1.1. Escenario 1 — Vínculos activos

**Dado** que tengo vínculos activos  
**cuando** confirmo el cierre  
**entonces** se finalizan mediante eventos  
**y** se conserva la historia.

###### 12.10.3.1.2. Escenario 2 — Nueva sesión

**Dado** que la cuenta está cerrada  
**cuando** intento iniciar una sesión  
**entonces** BE no la crea.

---

### 12.11. Veredicto

```text
CIERRE COMPLEMENTARIO A:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS:
UC-P25, UC-P26, UC-P27
UC-E05, UC-E06, UC-E09

RF:
RF-001 A RF-007
RF-017
RF-069

GOOGLE:
EXTENSIÓN P1
FALLBACK LOCAL OBLIGATORIO

RECUPERACIÓN:
NEUTRAL DE PROVEEDOR
CONTINGENCIA ASISTIDA DOCUMENTADA

CIERRE:
SIN BORRADO SILENCIOSO
```

---

## 13. Cierre complementario B — Administración, capacidad, comunicaciones y solicitudes estructuradas

*Fuente base ensamblada: `BE_LEG_05_v0.12_CIERRE_B_ADMIN_CAPACIDAD_COMUNICACIONES.md`; CAP-DAT incorporado por parche v0.15.*

### 13.1. Propósito

Formalizar:

- incidencias administrativas trazables;
- configuración de habilitaciones y capacidad;
- identidad exclusivamente antropométrica;
- centro interno de novedades;
- push opcional no sensible;
- solicitudes estructuradas de información pertinente y respuestas SELF_REPORTED.

No incorpora:

- facturación real;
- cobro por capacidad;
- tickets externos;
- chat general;
- datos de salud en notificaciones;
- diagnóstico;
- publicidad.

---

### 13.2. Relaciones

```text
UC-P28 — Registrar y gestionar incidencia administrativa
  incluye → UC-I02
  incluye → UC-I03

UC-P29 — Configurar habilitaciones y capacidad académica
  incluye → UC-I02
  incluye → UC-I03
  incluye → UC-I10

UC-P30 — Consultar novedades internas
  incluye → UC-I02
  incluye → UC-I03
  puede ser extendido por → UC-E08

UC-P32 — Solicitar información estructurada pertinente al asesorado
  incluye → UC-I02
  incluye → UC-I03
  se completa mediante → UC-P33

UC-P33 — Completar información solicitada
  incluye → UC-I02
  incluye → UC-I03
  se relaciona con → UC-P25 — Registrar identidad BE y perfil propio

UC-E08 — Recibir notificación push no sensible
  incluye → UC-I02
  invoca → UC-P30 para el contenido completo
```

---

### 13.3. UC-P28 — Registrar y gestionar incidencia administrativa

#### 13.3.1. Código

`UC-P28`

#### 13.3.2. Objetivo

Permitir que un actor registre una incidencia y que un administrador autorizado gestione su seguimiento y resolución sin acceder a información ajena fuera del alcance.

#### 13.3.3. Actor principal

Profesional, asesorado o administrador.

#### 13.3.4. Precondiciones

1. El actor posee identidad y sesión válidas.
2. `UC-I02` autoriza registrar o consultar la incidencia.
3. La materia puede describirse sin incluir información innecesaria.
4. La incidencia puede asociarse a autor y fecha.

#### 13.3.5. Postcondiciones de éxito

1. Existe una incidencia trazable.
2. Conserva actor, fecha, alcance, seguimiento y resultado.
3. El actor consulta únicamente incidencias propias o permitidas.
4. El administrador accede conforme a su función.
5. No se modifica automáticamente ningún dato de dominio.
6. La resolución queda registrada.

#### 13.3.6. Garantías mínimas

- Una incidencia no es un chat general.
- No concede acceso a información protegida.
- No sustituye casos propietarios de corrección o cierre.
- No se presenta como diagnóstico.
- No se elimina la historia de seguimiento.
- Un fallo no presenta la incidencia como resuelta.

#### 13.3.7. Flujo principal

1. El actor inicia una incidencia.
2. BE ejecuta `UC-I02`.
3. El actor describe el problema y su contexto mínimo.
4. BE presenta el resumen.
5. El actor confirma.
6. BE registra mediante `UC-I03`.
7. Un administrador autorizado consulta la incidencia.
8. Registra seguimiento o resolución.
9. BE preserva la secuencia.
10. El caso finaliza.

#### 13.3.8. Variantes

##### 13.3.8.1. V01 — Incidencia propia

**Resultado:** el actor consulta su seguimiento.

##### 13.3.8.2. V02 — Incidencia administrativa interna

**Resultado:** solo administradores autorizados acceden.

##### 13.3.8.3. V03 — Incidencia que requiere un caso propietario

**Resultado:** se deriva al caso correspondiente sin modificar datos desde soporte.

#### 13.3.9. Excepciones

##### 13.3.9.1. E01 — Información ajena

**Resultado:** BE deniega.

##### 13.3.9.2. E02 — Descripción con datos innecesarios

**Resultado:** la política de minimización se deriva a 08/10.

##### 13.3.9.3. E03 — Resolución sin evidencia

**Resultado:** no se declara resuelta.

#### 13.3.10. Requisitos relacionados

- `RF-068`
- `RF-021`
- `RNF-OBS-003`

#### 13.3.11. Casos incluidos

- `UC-I02`
- `UC-I03`

#### 13.3.12. Criterio de cierre

La incidencia y su resultado quedan trazables o una excepción impide mostrar un seguimiento falso.

---

### 13.4. UC-P29 — Configurar habilitaciones y capacidad académica

#### 13.4.1. Código

`UC-P29`

#### 13.4.2. Objetivo

Permitir que un administrador configure habilitaciones y capacidad aplicables a procesos nuevos, incluyendo identidades exclusivamente antropométricas, sin interrumpir procesos vigentes ni incorporar cobro real.

#### 13.4.3. Actor principal

Administrador.

#### 13.4.4. Precondiciones

1. El administrador posee autorización.
2. La configuración puede asociarse a una identidad, alcance o regla aplicable.
3. `UC-I10` puede evaluar el efecto funcional.
4. La operación no ejecuta pagos.

#### 13.4.5. Postcondiciones de éxito

1. Existe una configuración versionada.
2. Puede representar:
   - Nutrición;
   - Entrenamiento;
   - ambas especialidades;
   - solo capacidad antropométrica verificada.
3. Los procesos nuevos se evalúan contra la configuración.
4. Los procesos vigentes continúan.
5. Revisiones y cierres siguen disponibles.
6. No se revocan vínculos.
7. No se borran datos.
8. El cambio queda trazable.

#### 13.4.6. Garantías mínimas

- `DEC-044` se aplica.
- Antropometría no se convierte en especialidad.
- Capacidad no equivale a autorización.
- Un exceso rechaza procesos nuevos.
- Los procesos vigentes no se interrumpen.
- No existe cobro real.
- No se modifica una especialidad verificada desde este caso.
- La configuración anterior se conserva.

#### 13.4.7. Flujo principal

1. El administrador accede a configuración.
2. BE ejecuta `UC-I02`.
3. Selecciona alcance o identidad.
4. BE presenta habilitaciones y capacidad vigentes.
5. El administrador propone una nueva configuración.
6. BE ejecuta `UC-I10` en modo de evaluación.
7. BE presenta el impacto sobre procesos nuevos.
8. El administrador confirma.
9. BE guarda una nueva versión.
10. BE registra mediante `UC-I03`.
11. El caso finaliza sin interrumpir procesos vigentes.

#### 13.4.8. Variantes

##### 13.4.8.1. V01 — Solo Antropometría

**Resultado:** la configuración es válida sin Nutrición o Entrenamiento.

##### 13.4.8.2. V02 — Capacidad excedida

**Resultado:** futuros procesos nuevos se rechazan; los vigentes continúan.

##### 13.4.8.3. V03 — Simulación académica

**Resultado:** se demuestra la regla sin integrar facturación real.

#### 13.4.9. Excepciones

##### 13.4.9.1. E01 — Configuración incompatible

**Resultado:** no se aplica.

##### 13.4.9.2. E02 — Intento de cerrar procesos vigentes

**Resultado:** BE rechaza la consecuencia.

##### 13.4.9.3. E03 — Intento de cobrar

**Resultado:** se rechaza por estar fuera del alcance.

#### 13.4.10. Requisitos relacionados

- `RF-066`
- `RF-021`
- `DEC-044`

#### 13.4.11. Casos incluidos

- `UC-I02`
- `UC-I03`
- `UC-I10`

#### 13.4.12. Criterio de cierre

La configuración queda versionada y aplicable a procesos nuevos sin interrumpir procesos vigentes.

---

### 13.5. UC-P30 — Consultar novedades internas

#### 13.5.1. Código

`UC-P30`

#### 13.5.2. Objetivo

Permitir que profesionales y asesorados consulten novedades internas no clínicas desde un centro propio de BE.

#### 13.5.3. Actor principal

Profesional o asesorado.

#### 13.5.4. Precondiciones

1. El actor posee identidad y sesión válidas.
2. `UC-I02` autoriza la novedad según audiencia.
3. La novedad puede mostrarse sin información sensible.

#### 13.5.5. Postcondiciones de éxito

1. El actor consulta novedades autorizadas.
2. Cada novedad conserva autoría o fuente, fecha y audiencia.
3. No contiene diagnóstico o datos de salud.
4. La consulta no modifica dominios.
5. El centro interno funciona aunque push no esté disponible.

#### 13.5.6. Garantías mínimas

- Es un canal interno no clínico.
- No es nota de coordinación.
- No es chat.
- No incluye información sensible.
- Push es opcional.
- Una falla de push no elimina la novedad.
- La audiencia no se amplía silenciosamente.

#### 13.5.7. Flujo principal

1. El actor abre novedades.
2. BE ejecuta `UC-I02`.
3. BE obtiene novedades de su audiencia.
4. Presenta fecha, fuente y contenido autorizado.
5. El actor consulta el detalle.
6. BE registra la consulta según política.
7. El caso finaliza.

#### 13.5.8. Variantes

##### 13.5.8.1. V01 — Novedad general

**Resultado:** se muestra a la audiencia autorizada.

##### 13.5.8.2. V02 — Novedad por tipo de actor

**Resultado:** se limita a profesional o asesorado.

##### 13.5.8.3. V03 — Push disponible

**Resultado:** puede invocarse `UC-E08`.

#### 13.5.9. Excepciones

##### 13.5.9.1. E01 — Contenido sensible

**Resultado:** no se publica como novedad.

##### 13.5.9.2. E02 — Audiencia no autorizada

**Resultado:** BE no muestra el contenido.

##### 13.5.9.3. E03 — Falla de consulta

**Resultado:** no presenta información parcial como completa.

#### 13.5.10. Requisitos relacionados

- `RF-061`
- `RF-021`

#### 13.5.11. Casos incluidos

- `UC-I02`
- `UC-I03`

#### 13.5.12. Criterio de cierre

El actor consulta novedades no clínicas autorizadas desde el centro interno.

---

### 13.6. UC-P32 — Solicitar información estructurada pertinente al asesorado

#### 13.6.1. Código

`UC-P32`

#### 13.6.2. Objetivo

Permitir que un profesional autorizado solicite al asesorado información estructurada pertinente para una finalidad y alcance determinados, usando una plantilla BE versionada y sin convertir la solicitud en consentimiento, vínculo o acceso adicional.

#### 13.6.3. Actor principal

Profesional autorizado.

#### 13.6.4. Actores secundarios

- Asesorado.
- Sistema BE.

#### 13.6.5. Precondiciones

1. La identidad profesional está activa.
2. La especialidad/capacidad aplicable está verificada y habilitada.
3. Existe vínculo aceptado.
4. Existe consentimiento/autorización vigente suficiente para la finalidad y categorías solicitadas.
5. `UC-I02` autoriza la operación.
6. La finalidad y el alcance son identificables.
7. Existe una plantilla BE versionada compatible con esa finalidad.
8. Los campos/categorías solicitados son pertinentes.
9. La estructura concreta se deriva a 06/10.

#### 13.6.6. Postcondiciones de éxito

1. Existe una solicitud identificable y trazable.
2. Conserva:
   - profesional solicitante;
   - asesorado;
   - finalidad;
   - alcance;
   - referencia a plantilla/versión;
   - campos/secciones solicitados;
   - requerido/opcional cuando corresponda;
   - fecha;
   - estado funcional.
3. La solicitud no crea una respuesta ficticia.
4. La solicitud no amplía vínculo, consentimiento ni autorización.
5. El asesorado puede conocer quién solicita, qué se solicita y para qué.
6. El evento queda auditado mediante `UC-I03`.

#### 13.6.7. Garantías mínimas

- Solicitar ≠ consentir.
- Solicitar ≠ obtener acceso.
- Plantilla P0 = BE versionada; no builder libre.
- No se solicitan categorías fuera de finalidad/alcance.
- Un campo requerido debe ser legítimo y visible como tal.
- No se convierte una respuesta futura en diagnóstico o medición.
- La existencia de una plantilla no concede autorización.
- Un fallo no presenta la solicitud como enviada.

#### 13.6.8. Flujo principal

1. El profesional selecciona al asesorado dentro de una relación pertinente.
2. BE ejecuta `UC-I02`.
3. El profesional identifica finalidad y alcance.
4. BE ofrece plantillas BE versionadas compatibles.
5. El profesional selecciona la plantilla aplicable.
6. BE presenta campos/secciones permitidos y su carácter requerido/opcional.
7. El profesional confirma la solicitud.
8. BE reevalúa autorización y pertinencia.
9. BE registra la solicitud.
10. BE registra auditoría mediante `UC-I03`.
11. La solicitud queda disponible al asesorado para `UC-P33`.
12. El caso finaliza.

#### 13.6.9. Variantes

##### 13.6.9.1. V01 — Solicitar subconjunto permitido

La plantilla admite secciones opcionales.

**Resultado:** el profesional solicita solo el subconjunto pertinente, preservando la versión de plantilla.

##### 13.6.9.2. V02 — Dato ya existente en perfil propio

BE identifica que un dato equivalente existe en `UC-P25`.

**Resultado:** la solicitud puede pedir confirmación/reutilización sin alterar silenciosamente el dato de perfil ni perder procedencia.

##### 13.6.9.3. V03 — Solicitud sucesora

Existe una solicitud anterior para finalidad compatible.

**Resultado:** la nueva solicitud queda relacionada y no sobrescribe la anterior.

#### 13.6.10. Excepciones

##### 13.6.10.1. E01 — Profesional no autorizado

**Resultado:** BE deniega sin revelar información protegida.

##### 13.6.10.2. E02 — Finalidad o alcance ausentes

**Resultado:** no se crea la solicitud.

##### 13.6.10.3. E03 — Campo/categoría no pertinente

**Resultado:** BE no permite solicitarlo dentro de esa finalidad.

##### 13.6.10.4. E04 — Plantilla incompatible o no seleccionable

**Resultado:** no se envía como si fuera válida; detalle técnico: DERIVAR 06/09.

##### 13.6.10.5. E05 — Consentimiento/autorización insuficientes

**Resultado:** BE no usa la solicitud para ampliar acceso.

##### 13.6.10.6. E06 — Falla de persistencia o auditoría

**Resultado:** no se presenta la solicitud como creada.

#### 13.6.11. Requisitos relacionados

- `RF-071`
- `RF-021`
- `RF-025`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`

#### 13.6.12. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 13.6.13. Decisiones o preguntas abiertas

1. Plantillas/versiones/campos: `DERIVAR 06`.
2. Categorías, pertinencia, B2/PDP y acceso: `DERIVAR 08`.
3. Contratos/estados/idempotencia: `DERIVAR 09`.
4. Formulario/copy: `DERIVAR 10`.
5. Pruebas: `DERIVAR 11A`.

#### 13.6.14. Criterio de cierre

El caso termina cuando existe una solicitud autorizada, versionada y comprensible para el asesorado o cuando una excepción impide pedir información fuera del alcance.

---

### 13.7. UC-P33 — Completar información solicitada

#### 13.7.1. Código

`UC-P33`

#### 13.7.2. Objetivo

Permitir que el asesorado complete una solicitud propia de información profesional preservando `SELF_REPORTED`, relación con la solicitud y plantilla/version, historia y separación respecto de perfil propio, medición profesional, diagnóstico y consentimiento.

#### 13.7.3. Actor principal

Asesorado.

#### 13.7.4. Actores secundarios

- Sistema BE.
- Profesional solicitante, como destinatario únicamente dentro de autorización vigente.

#### 13.7.5. Precondiciones

1. El asesorado posee identidad y sesión válidas.
2. La solicitud pertenece al asesorado.
3. La solicitud y su finalidad pueden revelarse al actor.
4. `UC-I02` autoriza la operación protegida correspondiente.
5. La plantilla/version de la solicitud es identificable.
6. Los campos requeridos/opcionales pueden distinguirse.

#### 13.7.6. Postcondiciones de éxito

1. Existe una respuesta relacionada con la solicitud exacta.
2. Conserva:
   - asesorado;
   - request;
   - plantilla/versión;
   - respuestas;
   - fecha;
   - procedencia `SELF_REPORTED`.
3. Una respuesta no se presenta como:
   - medición profesional;
   - observación profesional;
   - diagnóstico;
   - consentimiento.
4. La respuesta no amplía autorización del profesional.
5. Si se reutiliza un dato de `UC-P25`, la procedencia y relación original permanecen distinguibles.
6. Una corrección posterior preserva la respuesta anterior.
7. El evento queda auditado mediante `UC-I03`.

#### 13.7.7. Garantías mínimas

- Responder ≠ consentir.
- SELF_REPORTED ≠ medido.
- SELF_REPORTED ≠ diagnosticado.
- Actualizar perfil ≠ responder solicitud.
- Mismo valor ≠ mismo origen.
- No existe sobrescritura silenciosa de una respuesta enviada.
- Un campo opcional omitido no se inventa como cero/negativo.
- Un fallo no presenta la respuesta como enviada.
- Si el profesional deja de estar autorizado, la respuesta no se expone por la mera existencia de la solicitud.

#### 13.7.8. Flujo principal

1. El asesorado consulta sus solicitudes.
2. Selecciona una solicitud propia.
3. BE muestra profesional solicitante, finalidad, alcance y campos.
4. BE distingue requerido de opcional.
5. El asesorado completa la información.
6. Cuando existe un dato compatible en `UC-P25`, puede:
   - reutilizarlo;
   - confirmarlo;
   - ingresar otro valor para esta respuesta,
   sin fusionar procedencias.
7. BE etiqueta cada respuesta como `SELF_REPORTED`.
8. El asesorado revisa.
9. Confirma el envío.
10. BE reevalúa autorización/contexto aplicable.
11. BE registra la respuesta y su relación con solicitud/plantilla/versión.
12. BE registra mediante `UC-I03`.
13. El profesional solo puede consultarla conforme a 08/09.
14. El caso finaliza.

#### 13.7.9. Variantes

##### 13.7.9.1. V01 — Reutilizar dato de perfil

**Resultado:** se conserva referencia/procedencia del dato de `UC-P25`; la respuesta sigue siendo un acto distinto.

##### 13.7.9.2. V02 — Omitir campo opcional

**Resultado:** el campo queda sin respuesta; no se completa artificialmente.

##### 13.7.9.3. V03 — Corregir respuesta enviada

La política permite rectificar una respuesta.

**Resultado:** se crea una versión/rectificación sucesora sin sobrescribir la respuesta original; estructura: DERIVAR 06/09.

#### 13.7.10. Excepciones

##### 13.7.10.1. E01 — Solicitud ajena

**Resultado:** BE no revela contenido ni permite responder.

##### 13.7.10.2. E02 — Campo requerido faltante

**Resultado:** no se declara la respuesta como completa.

##### 13.7.10.3. E03 — Solicitud no vigente o contexto cambiado

**Resultado:** BE no expone la respuesta al profesional como si la autorización continuara; estado técnico/política: DERIVAR 06/08.

##### 13.7.10.4. E04 — Dato de perfil incompatible

**Resultado:** BE no lo reutiliza automáticamente como respuesta equivalente.

##### 13.7.10.5. E05 — Intento de convertir respuesta en diagnóstico/medición

**Resultado:** BE mantiene la clasificación `SELF_REPORTED`.

##### 13.7.10.6. E06 — Falla de persistencia o auditoría

**Resultado:** no se presenta la respuesta como enviada.

#### 13.7.11. Requisitos relacionados

- `RF-071`
- `RF-021`
- `RF-025`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`

#### 13.7.12. Casos incluidos

- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

#### 13.7.13. Relación explícita con perfil propio

`UC-P33` no reemplaza `UC-P25`.

```text
UC-P25
→ administra perfil propio

UC-P33
→ responde una solicitud profesional concreta

mismo valor
≠ mismo acto
≠ misma procedencia
```

#### 13.7.14. Decisiones o preguntas abiertas

1. Estructura/versionado de respuestas: `DERIVAR 06`.
2. Visibilidad, categorías, retención y acceso: `DERIVAR 08`.
3. Contratos/concurrencia/idempotencia: `DERIVAR 09`.
4. UI/copy: `DERIVAR 10`.
5. Pruebas: `DERIVAR 11A`.

#### 13.7.15. Criterio de cierre

El caso termina cuando una respuesta SELF_REPORTED queda vinculada y trazable sin ampliar acceso ni perder procedencia, o cuando una excepción impide presentarla como completa.

---

### 13.8. UC-E08 — Recibir notificación push no sensible

#### 13.8.1. Código

`UC-E08`

#### 13.8.2. Tipo

Extensión de `UC-P30`.

#### 13.8.3. Objetivo

Avisar que existe una novedad sin incluir información sensible; el contenido completo permanece en el centro interno.

#### 13.8.4. Condición de extensión

Existe una novedad autorizada y un canal push disponible conforme a política.

#### 13.8.5. Flujo diferencial

1. BE identifica la audiencia.
2. Verifica que el mensaje mínimo no incluya datos sensibles.
3. Emite un aviso genérico.
4. El actor abre el aviso.
5. BE encauza al centro interno.
6. UC-P30 evalúa autorización y muestra el contenido completo.

#### 13.8.6. Garantías mínimas

- El push no contiene datos de salud.
- No contiene nombres de asesorados.
- No contiene mediciones, planes, diagnósticos o notas profesionales.
- No permite inferir contenido protegido.
- El push no concede acceso.
- La novedad permanece en el centro interno.
- La caída del canal no afecta la información.
- Push es P2 y recortable.

#### 13.8.7. Excepciones

##### 13.8.7.1. E01 — Contenido no reducible sin sensibilidad

**Resultado:** no se envía push.

##### 13.8.7.2. E02 — Canal indisponible

**Resultado:** la novedad sigue disponible internamente.

##### 13.8.7.3. E03 — Actor sin sesión válida al abrir

**Resultado:** debe autenticarse; no se muestra contenido desde la notificación.

#### 13.8.8. Requisitos relacionados

- `RF-062`
- `RF-061`
- `RF-021`

#### 13.8.9. Criterio de cierre

Se emite un aviso mínimo no sensible o se conserva únicamente la novedad interna.

---

### 13.9. Historias prioritarias

#### 13.9.1. HU-24 — Gestionar soporte trazable

**Como** usuario o administrador  
**quiero** registrar y seguir una incidencia  
**para** resolver problemas sin perder historia ni acceder a datos ajenos.

##### 13.9.1.1. Criterios de aceptación

###### 13.9.1.1.1. Escenario 1 — Incidencia propia

**Dado** que registro un problema  
**cuando** confirmo  
**entonces** BE conserva actor, fecha y seguimiento.

###### 13.9.1.1.2. Escenario 2 — Caso propietario

**Dado** que la solución requiere modificar un plan  
**cuando** el administrador revisa la incidencia  
**entonces** deriva al caso propietario  
**y** no cambia el plan desde soporte.

#### 13.9.2. HU-25 — Configurar capacidad sin interrumpir

**Como** administrador  
**quiero** configurar capacidad para procesos nuevos  
**para** aplicar límites sin cancelar procesos vigentes.

##### 13.9.2.1. Criterios de aceptación

###### 13.9.2.1.1. Escenario 1 — Antropometría independiente

**Dado** que una identidad posee solo capacidad antropométrica verificada  
**cuando** configuro su habilitación  
**entonces** BE admite esa combinación conforme a DEC-044.

###### 13.9.2.1.2. Escenario 2 — Límite excedido

**Dado** que un nuevo proceso excede la banda  
**cuando** se intenta iniciar  
**entonces** se rechaza el proceso nuevo  
**y** los vigentes continúan.

#### 13.9.3. HU-26 — Recibir un aviso no sensible

**Como** usuario  
**quiero** recibir un aviso mínimo  
**para** saber que existe una novedad sin exponer información protegida.

##### 13.9.3.1. Criterios de aceptación

###### 13.9.3.1.1. Escenario 1 — Push seguro

**Dado** que existe una novedad  
**cuando** BE envía un push  
**entonces** el aviso no contiene datos sensibles  
**y** el detalle requiere ingresar al centro interno.

###### 13.9.3.1.2. Escenario 2 — Canal caído

**Dado** que push no está disponible  
**cuando** consulto BE  
**entonces** la novedad continúa en el centro interno.

---

### 13.10. Veredicto

```text
CIERRE COMPLEMENTARIO B:
APTO PARA REVISIÓN DE DIRECCIÓN

CASOS:
UC-P28, UC-P29, UC-P30, UC-E08

RF:
RF-061, RF-062, RF-066, RF-068

ANTROPOMETRÍA INDEPENDIENTE:
MATERIALIZADA EN UC-P29

PUSH:
OPCIONAL
NO SENSIBLE
FALLBACK AL CENTRO INTERNO
```

---

## 14. Casos incluidos compactos, cálculo transversal y soporte analítico

*Fuente ensamblada: `BE_LEG_05_v0.13_CASOS_INCLUIDOS_Y_UC_S01.md`.*

### 14.1. Decisión de formato

Los siguientes casos ya poseen conducta distribuida en sus invocantes. Se formalizan mediante fichas compactas:

- `UC-I01`;
- `UC-I03`;
- `UC-I04`;
- `UC-I07`;
- `UC-I08`;
- `UC-I10`;
- `UC-I11`.

La ficha compacta contiene:

- objetivo;
- precondiciones;
- flujo incluido;
- garantías;
- invocantes;
- derivaciones.

`UC-S01` recibe ficha completa por concentrar la semántica de cálculo de TVCC-30.

Los casos `UC-I02`, `UC-I05`, `UC-I06`, `UC-I09` y `UC-I12` ya poseen desarrollo narrativo completo en bloques anteriores.

---

### 14.2. UC-I01 — Presentar evidencia versionada

#### 14.2.1. Código

`UC-I01`

#### 14.2.2. Tipo

Incluido compacto.

#### 14.2.3. Objetivo

Presentar evidencia profesional asociada a una especialidad o capacidad, preservando versión, autoría, fecha, alcance y relación con presentaciones anteriores.

#### 14.2.4. Precondiciones

1. Existe una identidad profesional.
2. El alcance puede identificarse.
3. El actor puede aportar evidencia.
4. El formato puede validarse conforme a políticas posteriores.

#### 14.2.5. Flujo incluido

1. Recibe evidencia y alcance.
2. Identifica autor y fecha.
3. Crea una versión.
4. Relaciona la versión con cualquier evidencia anterior.
5. Preserva la procedencia.
6. Devuelve la referencia a `UC-P01` o `UC-E01`.

#### 14.2.6. Garantías mínimas

- Una nueva presentación no sobrescribe la anterior.
- Evidencia de una especialidad no se aplica a otra.
- La capacidad antropométrica puede presentarse de forma independiente.
- Presentar no equivale a verificar.
- La validación técnica pertenece a 09/11A.

#### 14.2.7. Invocado por

- `UC-P01`;
- `UC-E01`.

#### 14.2.8. Requisitos relacionados

- `RF-009`;
- `RF-010`;
- `RF-013`;
- `RF-067`.

#### 14.2.9. Criterio de cierre

La evidencia queda versionada y relacionada o se rechaza sin perder la historia.

---

### 14.3. UC-I03 — Registrar auditoría y preservar historia

#### 14.3.1. Código

`UC-I03`

#### 14.3.2. Tipo

Incluido compacto transversal.

#### 14.3.3. Objetivo

Registrar eventos sensibles y preservar una historia reconstruible sin sobrescritura silenciosa.

#### 14.3.4. Precondiciones

1. El caso invocante identifica actor y operación.
2. Puede determinarse el resultado.
3. Ocurrencia y registro se distinguen cuando corresponda.
4. Las relaciones con versiones o eventos anteriores pueden conservarse.

#### 14.3.5. Flujo incluido

1. Recibe actor, operación y contexto.
2. Recibe resultado.
3. Registra momento de ocurrencia cuando se conoce.
4. Registra momento de registro.
5. Conserva autoría y procedencia.
6. Relaciona versiones, correcciones, revisiones, cierres o contingencias.
7. Devuelve una referencia auditable.

#### 14.3.6. Garantías mínimas

- No borra evidencia histórica.
- No reasigna autoría.
- No confunde ocurrencia con registro.
- Una falla de auditoría puede impedir la operación cuando el control sea obligatorio.
- No define persistencia técnica.

#### 14.3.7. Invocado por

Operaciones sensibles, altas, vínculos, consentimientos, planes, ejecuciones, correcciones, revisiones, cierres, soporte, comunicaciones y métricas.

#### 14.3.8. Requisitos relacionados

- `RF-025`;
- `RF-044`;
- `RF-050`;
- `RF-054`;
- `RF-069`;
- RNF de observabilidad y datos.

#### 14.3.9. Criterio de cierre

Existe un evento reconstruible o el invocante recibe un rechazo sin registrar una historia falsa.

---

### 14.4. UC-I04 — Validar y versionar un plan

#### 14.4.1. Código

`UC-I04`

#### 14.4.2. Tipo

Incluido compacto.

#### 14.4.3. Objetivo

Validar una versión candidata de plan y preservar una instantánea reproducible antes de activarla.

#### 14.4.4. Precondiciones

1. Existe un borrador identificado.
2. Existe evaluación y objetivo aplicables.
3. El profesional está autorizado.
4. La instantánea puede preservarse.

#### 14.4.5. Flujo incluido

1. Recibe la versión candidata.
2. Verifica completitud funcional.
3. Verifica relaciones con evaluación, objetivo y procedencia.
4. Prepara la instantánea reproducible.
5. Rechaza la activación si no puede preservarla.
6. Devuelve el resultado a UC-P11 o UC-P16.

#### 14.4.6. Garantías mínimas

- No fija contenido profesional.
- Una versión activa no se reconstruye desde el catálogo actual.
- No sobrescribe versiones anteriores.
- Validar no equivale a activar.
- La estructura pertenece a 06.

#### 14.4.7. Invocado por

- `UC-P11`;
- `UC-P16`.

#### 14.4.8. Requisitos relacionados

- `RF-031`;
- `RF-041`.

#### 14.4.9. Criterio de cierre

La versión queda validada y reproducible o se rechaza sin activación parcial.

---

### 14.5. UC-I07 — Importar elemento externo con revisión controlada

#### 14.5.1. Código

`UC-I07`

#### 14.5.2. Tipo

Incluido compacto opcional.

#### 14.5.3. Objetivo

Incorporar un elemento de un proveedor externo solo después de revisión profesional, conservando procedencia y decisión de incorporación.

#### 14.5.4. Precondiciones

1. Existe una respuesta externa.
2. El proveedor y la fecha pueden identificarse.
3. El profesional puede revisar el elemento.
4. El catálogo propio permanece disponible.

#### 14.5.5. Flujo incluido

1. Recibe el elemento externo.
2. Identifica proveedor y fecha.
3. Presenta el contenido al profesional.
4. Permite corregir, completar, rechazar o incorporar.
5. Registra la decisión.
6. Conserva procedencia.
7. Devuelve el elemento incorporado o el rechazo.

#### 14.5.6. Garantías mínimas

- No existe importación ciega.
- El proveedor no es fuente única.
- Un dato incompleto puede rechazarse.
- Una corrección no oculta la fuente original.
- Contratos pertenecen a 09.

#### 14.5.7. Invocado por

- `UC-P10` para Open Food Facts;
- `UC-P15` para wger.

#### 14.5.8. Requisitos relacionados

- `RF-028`;
- `RF-038`;
- `RF-060`.

#### 14.5.9. Criterio de cierre

El elemento queda revisado e incorporado con procedencia o se rechaza sin contaminar el catálogo propio.

---

### 14.6. UC-I08 — Aplicar fallback manual y conservar procedencia

#### 14.6.1. Código

`UC-I08`

#### 14.6.2. Tipo

Incluido compacto transversal.

#### 14.6.3. Objetivo

Mantener el núcleo operativo cuando un tercero no está disponible, informando la contingencia y conservando la procedencia de cualquier dato alternativo.

#### 14.6.4. Precondiciones

1. Existe una dependencia externa o una representación opcional.
2. La indisponibilidad puede detectarse.
3. Existe una alternativa funcional propia o manual.

#### 14.6.5. Flujo incluido

1. Detecta la indisponibilidad.
2. Informa la contingencia.
3. Selecciona la alternativa aprobada:
   - catálogo propio;
   - carga manual;
   - lista;
   - ubicación textual.
4. Registra la fuente y el fallback.
5. Permite continuar el núcleo.
6. No declara éxito de la integración externa.

#### 14.6.6. Garantías mínimas

- El tercero no bloquea el núcleo.
- No se inventan datos.
- La procedencia se conserva.
- El fallback es observable.
- La recuperación del tercero no sobrescribe datos manuales.
- Arquitectura y contratos pertenecen a 07/09.

#### 14.6.7. Invocado por

- `UC-P10`;
- `UC-P15`;
- `UC-P22`;
- otros recorridos con dependencia externa aprobada.

#### 14.6.8. Requisitos relacionados

- `RF-059`;
- `RF-060`;
- `TR-04`.

#### 14.6.9. Criterio de cierre

El núcleo continúa mediante una alternativa trazable o se informa una indisponibilidad sin resultado falso.

---

### 14.7. UC-I10 — Verificar habilitación y capacidad antes de iniciar proceso

#### 14.7.1. Código

`UC-I10`

#### 14.7.2. Tipo

Incluido compacto transversal.

#### 14.7.3. Objetivo

Comprobar habilitación y capacidad aplicables antes de iniciar un proceso nuevo o publicar un servicio, sin interrumpir procesos vigentes.

#### 14.7.4. Precondiciones

1. Existe una identidad profesional.
2. El alcance puede identificarse.
3. Existe una configuración aplicable.
4. La operación puede clasificarse como proceso nuevo, vigente o publicación.

#### 14.7.5. Flujo incluido

1. Identifica especialidad o capacidad.
2. Verifica habilitación.
3. Verifica configuración de capacidad.
4. Admite el perfil exclusivamente antropométrico cuando corresponda.
5. Si un proceso nuevo excede la banda, lo rechaza.
6. Conserva procesos vigentes, revisiones y cierres.
7. Devuelve el resultado al invocante.

#### 14.7.6. Garantías mínimas

- Verificado no equivale a habilitado.
- Habilitado no equivale a autorizado.
- Capacidad no revoca vínculos.
- No borra datos.
- No interrumpe procesos vigentes.
- No incorpora pagos reales.

#### 14.7.7. Invocado por

- `UC-P11`;
- `UC-P16`;
- `UC-P19`;
- `UC-P21`;
- `UC-P29`.

#### 14.7.8. Requisitos relacionados

- `RF-066`;
- `DEC-044`.

#### 14.7.9. Criterio de cierre

El proceso o publicación queda admitido o rechazado de forma trazable sin alterar procesos vigentes.

---

### 14.8. UC-I11 — Encauzar al actor por la superficie prevista

#### 14.8.1. Código

`UC-I11`

#### 14.8.2. Tipo

Incluido compacto transversal.

#### 14.8.3. Objetivo

Determinar la superficie funcional prevista para el actor y el recorrido, sin fijar navegación concreta ni conceder autorización.

#### 14.8.4. Precondiciones

1. El actor o intención puede identificarse.
2. El recorrido posee una superficie prevista.
3. La identidad y el estado operativo pueden evaluarse cuando corresponda.

#### 14.8.5. Flujo incluido

1. Recibe actor e intención.
2. Identifica Website, APK u otra superficie aprobada.
3. Devuelve el punto funcional de continuación.
4. No concede permisos.
5. Registra inconsistencias cuando el actor intenta una superficie no prevista.

#### 14.8.6. Garantías mínimas

- Encauzar no equivale a autorizar.
- No define menús, rutas o componentes.
- No expone información protegida.
- Un actor puede usar varias superficies solo cuando el producto lo prevé.
- Navegación pertenece a 10.

#### 14.8.7. Invocado por

- `UC-P25`;
- `UC-P26`;
- recorridos Website/APK.

#### 14.8.8. Requisitos relacionados

- `RF-007`.

#### 14.8.9. Criterio de cierre

El actor recibe una superficie funcional prevista o un rechazo sin filtrar información.

---

### 14.9. UC-I13 — Ejecutar y adoptar cálculo profesional reproducible

#### 14.9.1. Código

`UC-I13`

#### 14.9.2. Tipo

Caso incluido transversal.

#### 14.9.3. Objetivo

Permitir que un profesional autorizado ejecute uno o más métodos de cálculo versionados y pertinentes como **apoyo profesional**, conservando método, versión, requisitos, inputs efectivos, procedencia y resultado y manteniendo la separación:

```text
cálculo
≠ sugerencia
≠ selección
≠ referencia adoptada
≠ decisión profesional
```

#### 14.9.4. Precondiciones

1. El caso invocante fue autorizado mediante `UC-I02`.
2. Existe una finalidad profesional identificable.
3. Existe un método/versión disponible y seleccionable para esa finalidad.
4. Sus inputs obligatorios son identificables.
5. Cada input conserva procedencia.
6. La procedencia/tipo de cada input es admisible para ese método.
7. El profesional decide explícitamente ejecutar el método.
8. `DEC-046 §4.4/§4.9` e `INV-06-133` permanecen vigentes.

#### 14.9.5. Flujo incluido

1. Recibe finalidad y contexto autorizado.
2. Presenta/recibe el método y versión elegidos por el profesional.
3. Identifica inputs requeridos.
4. Verifica disponibilidad y admisibilidad.
5. Conserva snapshot/referencias de inputs y procedencia.
6. Ejecuta el método de forma reproducible.
7. Produce un resultado relacionado con:
   - método;
   - versión;
   - inputs;
   - procedencia;
   - fecha/contexto.
8. Si se ejecutan varios métodos, conserva cada resultado por separado.
9. Si existe sugerencia metodológica, la mantiene distinguible de la selección profesional.
10. El profesional puede adoptar explícitamente un resultado como referencia.
11. La adopción no sobrescribe otras ejecuciones.
12. El resultado/reference vuelve al caso invocante.
13. El caso invocante conserva la responsabilidad de la decisión profesional final.

#### 14.9.6. Variantes

##### 14.9.6.1. V01 — Ejecutar varios métodos

**Resultado:** cada corrida conserva identidad metodológica y resultado independiente; BE no promedia ni declara ganador automático.

##### 14.9.6.2. V02 — Sugerencia transparente

BE muestra una sugerencia de método con fundamento suficiente.

**Resultado:** sugerencia ≠ selección; el profesional puede ignorarla.

##### 14.9.6.3. V03 — Adoptar referencia

El profesional selecciona un resultado como referencia de apoyo.

**Resultado:** queda trazada la adopción; no modifica automáticamente objetivo, evaluación, requerimiento, prescripción o plan.

##### 14.9.6.4. V04 — No adoptar referencia

**Resultado:** las ejecuciones permanecen consultables/trazables sin inferir una decisión.

#### 14.9.7. Excepciones

##### 14.9.7.1. E01 — Input obligatorio ausente

**Resultado:** el método no se ejecuta.

##### 14.9.7.2. E02 — Procedencia no admisible

**Resultado:** BE rechaza la ejecución; `dato disponible ≠ input válido`.

##### 14.9.7.3. E03 — Método/versión no seleccionables

**Resultado:** no se ejecuta como si estuviera vigente.

##### 14.9.7.4. E04 — Ejecución no reproducible

**Resultado:** no se presenta un resultado válido.

##### 14.9.7.5. E05 — Intento de decisión automática

Un flujo intenta convertir resultado/sugerencia en objetivo, requerimiento, prescripción o plan sin acto profesional.

**Resultado:** BE no materializa esa decisión como válida.

##### 14.9.7.6. E06 — Falla de persistencia/auditoría

**Resultado:** no se presenta la corrida/adopción como registrada.

#### 14.9.8. Garantías mínimas

- BE no fija una fórmula propia como requerimiento autónomo.
- El profesional decide qué método ejecutar.
- Método y versión son identificables.
- Inputs efectivos y procedencia son reconstruibles.
- Disponibilidad ≠ admisibilidad.
- Varias corridas pueden coexistir.
- No hay promedio silencioso.
- No hay ganador automático.
- Sugerencia ≠ selección.
- Resultado ≠ referencia adoptada.
- Referencia adoptada ≠ decisión.
- El resultado no actualiza automáticamente objetivo, evaluación, requerimiento, prescripción o plan.
- Cambios no sobrescriben ejecuciones históricas.
- Fórmulas, especificaciones, precisión y estructura pertenecen a 06.

#### 14.9.9. Invocado por

- `UC-P09 — Registrar evaluación y objetivo nutricional`, cuando corresponda;
- `UC-P14 — Registrar evaluación y objetivo de entrenamiento`, cuando corresponda;
- `UC-I09 — Emitir cálculos antropométricos reproducibles`, como especialización.

#### 14.9.10. Requisitos relacionados

- `RF-070`
- `RF-048`, únicamente mediante la especialización antropométrica `UC-I09`
- `RNF-DAT-003`
- `RNF-OBS-003`
- `RNF-MAN-004`

#### 14.9.11. Puntos de auditoría

- invocante;
- profesional;
- finalidad;
- método;
- versión;
- requisitos de inputs;
- inputs efectivos;
- procedencia;
- resultado;
- sugerencia, si existe;
- referencia adoptada, si existe;
- fecha;
- error.

#### 14.9.12. Decisiones o preguntas abiertas

1. Catálogo/especificación/versiones: `DERIVAR 06`.
2. Fórmulas/unidades/precisión: `DERIVAR 06`.
3. Admisibilidad por procedencia: `DERIVAR 06/08`.
4. Autorización cross-domain: `DERIVAR 08`.
5. Contratos: `DERIVAR 09`.
6. UX de comparación/sugerencia/referencia: `DERIVAR 10`.
7. Pruebas: `DERIVAR 11A`.

#### 14.9.13. Criterio de cierre

El caso incluido termina cuando una corrida reproducible —y, opcionalmente, una referencia adoptada— queda relacionada con método/versión/inputs/procedencia sin convertirse en decisión automática, o cuando una excepción impide ejecutar sin producir un resultado falso.

---

### 14.10. UC-S01 — Obtener TVCC-30 de manera reproducible

#### 14.10.1. Código

`UC-S01`

#### 14.10.2. Tipo

Caso de soporte analítico completo.

#### 14.10.3. Nombre

**Obtener TVCC-30 de manera reproducible**

#### 14.10.4. Objetivo

Calcular y exponer una métrica académica reproducible a partir de ciclos elegibles que poseen revisión profesional válida y próxima acción o cierre, produciendo numerador, denominador, exclusiones y versión de regla auditables.

#### 14.10.5. Actor principal

Sistema BE o responsable de validación autorizado.

#### 14.10.6. Actores secundarios

- Responsable académico o de validación.
- Sistema de consulta o exportación autorizado.

#### 14.10.7. Disparador

Se solicita calcular, validar o reproducir TVCC-30 para una zona y una versión de regla identificadas.

#### 14.10.8. Precondiciones

1. Existe una especificación de cálculo versionada.
2. Existe una zona temporal o analítica aprobada.
3. Existen reglas de elegibilidad identificables.
4. Los ciclos candidatos pueden reconstruirse.
5. Las revisiones válidas provienen de `UC-I05`.
6. Las próximas acciones o cierres provienen de `UC-I06`.
7. Las demos y vínculos no elegibles pueden excluirse.
8. El actor está autorizado para consultar el resultado.

#### 14.10.9. Postcondiciones de éxito

1. Existe un resultado TVCC-30.
2. Se preservan:
   - versión de especificación;
   - zona aplicada;
   - fecha de cálculo;
   - numerador;
   - denominador;
   - exclusiones y motivos;
   - ciclos incluidos;
   - evidencia de revisión y próxima acción/cierre;
   - actor o proceso ejecutor.
3. El resultado puede reproducirse con la misma especificación y datos.
4. El resultado no se presenta como:
   - retención;
   - adherencia;
   - resultado corporal;
   - resultado de salud;
   - score clínico.
5. La consulta queda trazable.

#### 14.10.10. Garantías mínimas

- Abrir dashboard no crea un ciclo cerrado.
- Visualizar información no crea una revisión.
- Una nota aislada no alimenta la métrica.
- Una modificación silenciosa no alimenta la métrica.
- Solo una revisión válida y próxima acción o cierre producen el evento base.
- Demos y vínculos no elegibles se excluyen.
- El numerador nunca se presenta sin denominador.
- La versión de regla es obligatoria.
- La fórmula exacta, elegibilidad fina y versionado pertenecen a 06/12.
- Consulta y exportación pertenecen a 09.
- Validación exhaustiva pertenece a 11A.

#### 14.10.11. Flujo principal

1. El actor solicita TVCC-30.
2. BE ejecuta `UC-I02`.
3. Identifica especificación, versión y zona.
4. Obtiene ciclos candidatos.
5. Evalúa elegibilidad conforme a la especificación.
6. Excluye demos y vínculos no elegibles con motivo.
7. Verifica para cada ciclo incluido:
   - revisión profesional válida;
   - próxima acción o cierre.
8. Construye numerador y denominador según la especificación.
9. Calcula el resultado.
10. Preserva los componentes auditables.
11. Registra mediante `UC-I03`.
12. Devuelve el resultado y sus metadatos.

#### 14.10.12. Variantes

##### 14.10.12.1. V01 — Reproducción histórica

**Resultado:** utiliza la versión de regla y zona correspondientes al cálculo histórico.

##### 14.10.12.2. V02 — Nueva versión de especificación

**Resultado:** produce un cálculo nuevo sin sobrescribir el anterior.

##### 14.10.12.3. V03 — Sin ciclos elegibles

**Resultado:** devuelve numerador y denominador auditables sin inventar una interpretación.

##### 14.10.12.4. V04 — Comparación entre versiones

**Resultado:** muestra resultados separados y no los combina como si fueran equivalentes.

#### 14.10.13. Excepciones

##### 14.10.13.1. E01 — Especificación no identificable

**Resultado:** no calcula.

##### 14.10.13.2. E02 — Ciclo sin revisión válida

**Resultado:** se excluye con motivo.

##### 14.10.13.3. E03 — Ciclo sin próxima acción o cierre

**Resultado:** no se cuenta como cerrado trazable.

##### 14.10.13.4. E04 — Evidencia no reconstruible

**Resultado:** se excluye o se rechaza el cálculo conforme a política.

##### 14.10.13.5. E05 — Zona no identificable

**Resultado:** no calcula.

##### 14.10.13.6. E06 — Falla de persistencia o auditoría

**Resultado:** no presenta el resultado como reproducible.

#### 14.10.14. Reglas aplicables

1. `RF-058` gobierna UC-S01.
2. `UC-P13` y `UC-P18` producen eventos base.
3. `UC-I05` e `UC-I06` validan cierre funcional.
4. El cálculo utiliza una especificación versionada.
5. El resultado conserva numerador y denominador.
6. Exclusiones son auditables.
7. No es métrica clínica.
8. No es retención o adherencia.
9. Fórmula y elegibilidad fina pertenecen a 06/12.
10. Exportación pertenece a 09.

#### 14.10.15. Información utilizada o generada

##### 14.10.15.1. Utilizada

- ciclos candidatos;
- vínculo y elegibilidad;
- dominio;
- revisión válida;
- próxima acción o cierre;
- fechas;
- zona;
- versión de especificación;
- exclusiones.

##### 14.10.15.2. Generada

- numerador;
- denominador;
- resultado;
- versión;
- zona;
- fecha;
- incluidos;
- excluidos;
- motivos;
- evento de auditoría.

#### 14.10.16. Requisitos relacionados

- `RF-058`;
- `RF-056`;
- `RF-054`;
- `DEC-043`.

#### 14.10.17. Casos incluidos

- `UC-I02`;
- `UC-I03`.

#### 14.10.18. Casos productores

- `UC-P13`;
- `UC-P18`;
- `UC-I05`;
- `UC-I06`.

#### 14.10.19. Puntos de auditoría

- actor;
- especificación;
- versión;
- zona;
- ciclos candidatos;
- incluidos;
- excluidos;
- motivos;
- numerador;
- denominador;
- resultado;
- fecha;
- falla.

#### 14.10.20. Decisiones o preguntas abiertas

1. Fórmula exacta: `DERIVAR 06/12`.
2. Elegibilidad fina: `DERIVAR 06/12`.
3. Zona y versión: `DERIVAR 06/12`.
4. Contrato y exportación: `DERIVAR 09`.
5. Pruebas reproducibles: `DERIVAR 11A`.

#### 14.10.21. Criterio de cierre

Existe un resultado reproducible con componentes auditables o una excepción impide calcular sin fabricar una métrica.

---

### 14.11. Veredicto

```text
CASOS INCLUIDOS COMPACTOS:
7/7 REDACTADOS

CASO DE SOPORTE:
UC-S01 REDACTADO EN FICHA COMPLETA

CASOS INCLUIDOS YA EXISTENTES:
UC-I02, UC-I05, UC-I06, UC-I09, UC-I12

REGLAS:
TR-01 A TR-05
NO COMPUTAN COMO UC

DECISIONES NUEVAS DE PRODUCTO:
0
```

---

## 15. Reglas transversales

*Fuente de gobierno: `DEC-045 — Reclasificación de patrones transversales como reglas TR`.*

Las reglas de esta sección no son recorridos actorales. Se materializan mediante casos principales, incluidos, extensiones, garantías y pruebas.

### 15.1. TR-01 — Separación de conceptos

Identidad, especialidad, habilitación, vínculo, consentimiento y autorización permanecen diferenciados.

### 15.2. TR-02 — Autorización contextual

Cada operación protegida evalúa rol, especialidad o capacidad, situación, vínculo, consentimiento, finalidad y alcance.

### 15.3. TR-03 — Auditoría, autoría, versionado e historia

Las operaciones relevantes preservan actor, ocurrencia, registro, versiones y relaciones históricas.

### 15.4. TR-04 — Procedencia y resiliencia

Toda importación o fallback conserva fuente, fecha, intervención y contingencia.

### 15.5. TR-05 — Revocación efectiva

La revocación corta operaciones futuras del alcance revocado sin borrar silenciosamente la evidencia histórica.

### 15.6. Aplicación y trazabilidad

- Las cinco reglas conservan sus RF relacionados.
- No computan dentro de los 56 casos de uso.
- Documento 12 debe mantener la relación `RF ↔ TR ↔ UC ↔ prueba`.
- Las denominaciones históricas previas solo se conservan en el apéndice.

---

## 16. Índice de trazabilidad

### 16.1. Inventario de casos de uso

| Código | Tipo | Nombre | Sección del maestro | Artefacto de origen |
|---|---|---|---:|---|
| `UC-P01` | Principal | Gestionar alta profesional escalonada | `4.5` | Bloque 01 — Alta profesional |
| `UC-P02` | Principal | Revisar solicitud y resolver la verificación profesional | `4.6` | Bloque 01 — Alta profesional |
| `UC-P03` | Principal | Suspender o rehabilitar capacidad profesional | `4.8` | Bloque 01 — Alta profesional |
| `UC-P04` | Principal | Solicitar o invitar a un vínculo | `5.5` | Bloque 02 — Vínculo profesional–asesorado |
| `UC-P05` | Principal | Aceptar o rechazar un vínculo | `5.6` | Bloque 02 — Vínculo profesional–asesorado |
| `UC-P06` | Principal | Consultar, pausar o finalizar un vínculo | `5.7` | Bloque 02 — Vínculo profesional–asesorado |
| `UC-P07` | Principal | Otorgar y consultar consentimiento específico | `6.5` | Bloque 03 — Consentimiento y autorización |
| `UC-P08` | Principal | Revocar consentimiento | `6.6` | Bloque 03 — Consentimiento y autorización |
| `UC-P09` | Principal | Registrar evaluación y objetivo nutricional | `7.5` | Bloque 04 — Circuito nutricional hasta ejecución |
| `UC-P10` | Principal | Diseñar plan nutricional | `7.6` | Bloque 04 — Circuito nutricional hasta ejecución |
| `UC-P11` | Principal | Validar y activar plan nutricional | `7.7` | Bloque 04 — Circuito nutricional hasta ejecución |
| `UC-P12` | Principal | Consultar y registrar ejecución nutricional en APK | `7.8` | Bloque 04 — Circuito nutricional hasta ejecución |
| `UC-P13` | Principal | Revisar evidencia y decidir continuidad nutricional | `8.6` | Bloque 05 — Revisión y continuidad nutricional |
| `UC-P14` | Principal | Registrar evaluación y objetivo de entrenamiento | `9.6` | Bloque 06 — Circuito de entrenamiento |
| `UC-P15` | Principal | Diseñar plan de entrenamiento | `9.7` | Bloque 06 — Circuito de entrenamiento |
| `UC-P16` | Principal | Validar y activar plan de entrenamiento | `9.8` | Bloque 06 — Circuito de entrenamiento |
| `UC-P17` | Principal | Consultar y registrar ejecución de entrenamiento en APK | `9.9` | Bloque 06 — Circuito de entrenamiento |
| `UC-P18` | Principal | Revisar evidencia y decidir continuidad de entrenamiento | `9.11` | Bloque 06 — Circuito de entrenamiento |
| `UC-P19` | Principal | Registrar evaluación antropométrica | `10.6` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-P20` | Principal | Consultar evolución antropométrica | `10.10` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-P21` | Principal | Publicar servicio antropométrico limitado | `10.11` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-P22` | Principal | Descubrir servicio antropométrico | `10.12` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-P23` | Principal | Consultar cartera y revisiones pendientes | `11.6` | Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal |
| `UC-P24` | Principal | Consultar dashboard y línea temporal interdisciplinaria | `11.7` | Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal |
| `UC-P25` | Principal | Registrar identidad BE y perfil propio | `12.4` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-P26` | Principal | Autenticar y finalizar una sesión local | `12.5` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-P27` | Principal | Solicitar cierre de cuenta | `12.9` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-P28` | Principal | Registrar y gestionar incidencia administrativa | `13.3` | Cierre complementario B — Administración, capacidad y comunicaciones |
| `UC-P29` | Principal | Configurar habilitaciones y capacidad académica | `13.4` | Cierre complementario B — Administración, capacidad y comunicaciones |
| `UC-P30` | Principal | Consultar novedades internas | `13.5` | Cierre complementario B — Administración, capacidad y comunicaciones |
| `UC-P31` | Principal | Consultar progreso longitudinal en APK | `11.9` | Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal |
| `UC-P32` | Principal | Solicitar información estructurada pertinente al asesorado | `13.6` | Cierre complementario B — parche CAP-DAT v0.15 |
| `UC-P33` | Principal | Completar información solicitada | `13.7` | Cierre complementario B — parche CAP-DAT v0.15 |
| `UC-I01` | Incluido | Presentar evidencia versionada | `14.2` | Casos incluidos compactos y soporte analítico |
| `UC-I02` | Incluido | Evaluar autorización contextual | `6.7` | Bloque 03 — Consentimiento y autorización |
| `UC-I03` | Incluido | Registrar auditoría y preservar historia | `14.3` | Casos incluidos compactos y soporte analítico |
| `UC-I04` | Incluido | Validar y versionar un plan | `14.4` | Casos incluidos compactos y soporte analítico |
| `UC-I05` | Incluido | Registrar revisión profesional válida | `8.7` | Bloque 05 — Revisión y continuidad nutricional |
| `UC-I06` | Incluido | Aplicar continuidad o cierre | `8.8` | Bloque 05 — Revisión y continuidad nutricional |
| `UC-I07` | Incluido | Importar elemento externo con revisión controlada | `14.5` | Casos incluidos compactos y soporte analítico |
| `UC-I08` | Incluido | Aplicar fallback manual y conservar procedencia | `14.6` | Casos incluidos compactos y soporte analítico |
| `UC-I09` | Incluido | Emitir cálculos antropométricos reproducibles | `10.7` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-I10` | Incluido | Verificar habilitación y capacidad antes de iniciar proceso | `14.7` | Casos incluidos compactos y soporte analítico |
| `UC-I11` | Incluido | Encauzar al actor por la superficie prevista | `14.8` | Casos incluidos compactos y soporte analítico |
| `UC-I12` | Incluido | Registrar corrección trazable | `10.9` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-I13` | Incluido | Ejecutar y adoptar cálculo profesional reproducible | `14.9` | Parche transversal v0.15 — CAP-MET |
| `UC-E01` | Extensión | Subsanar y volver a presentar evidencia | `4.7` | Bloque 01 — Alta profesional |
| `UC-E02` | Extensión | Corregir ejecución de entrenamiento | `9.10` | Bloque 06 — Circuito de entrenamiento |
| `UC-E03` | Extensión | Corregir evaluación antropométrica | `10.8` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-E04` | Extensión | Solicitar vínculo desde descubrimiento antropométrico | `10.13` | Bloque 07 — Antropometría transversal y descubrimiento limitado |
| `UC-E05` | Extensión | Acceder mediante Google | `12.6` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-E06` | Extensión | Administrar métodos de acceso | `12.7` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-E07` | Extensión | Registrar nota de coordinación autorizada | `11.8` | Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal |
| `UC-E08` | Extensión | Recibir notificación push no sensible | `13.8` | Cierre complementario B — Administración, capacidad y comunicaciones |
| `UC-E09` | Extensión | Recuperar el acceso local | `12.8` | Cierre complementario A — Identidad, acceso y ciclo de cuenta |
| `UC-S01` | Soporte | Obtener TVCC-30 de manera reproducible | `14.10` | Casos incluidos compactos y soporte analítico |

### 16.2. Cobertura de requisitos funcionales

| RF | Capacidad | Caso(s) o regla(s) |
|---|---|---|
| `RF-001` | Identidad BE | UC-P25 |
| `RF-002` | Acceso local | UC-P26 |
| `RF-003` | Identidad federada | UC-E05 |
| `RF-004` | Cuenta híbrida | UC-E06 |
| `RF-005` | Recuperación de cuenta | UC-E09 → extiende UC-P26 |
| `RF-006` | Estado operativo | UC-P25 / UC-P26 |
| `RF-007` | Canales y navegación | UC-I11 |
| `RF-008` | Alta profesional | UC-P01 |
| `RF-009` | Alta profesional | UC-P01 / UC-I01 |
| `RF-010` | Alta profesional | UC-P01 |
| `RF-011` | Administración | UC-P02 |
| `RF-012` | Verificación profesional | UC-P02 / UC-P03 |
| `RF-013` | Alta profesional | UC-E01 |
| `RF-014` | Administración | UC-P03 |
| `RF-015` | Gobierno de acceso | TR-01 / UC-P04 / UC-P05 |
| `RF-017` | Identidad del asesorado | UC-P25 |
| `RF-018` | Vínculo | UC-P04 |
| `RF-019` | Vínculo | UC-P05 |
| `RF-020` | Consentimiento | UC-P07 |
| `RF-021` | Autorización contextual | UC-I02 / TR-02 |
| `RF-022` | Revocación | UC-P08 / TR-05 |
| `RF-023` | Autogobierno | UC-P06 / UC-P07 / UC-P05 |
| `RF-024` | Vínculo | UC-P06 |
| `RF-025` | Continuidad longitudinal | UC-I03 / TR-03 |
| `RF-026` | Nutrición | UC-P09 |
| `RF-027` | Catálogo nutricional | UC-P10 |
| `RF-028` | Integración nutricional | UC-I07 / UC-P10 |
| `RF-029` | Nutrición | UC-P09 |
| `RF-030` | Plan nutricional | UC-P10 |
| `RF-031` | Activación nutricional | UC-P11 / UC-I04 / UC-I10 |
| `RF-032` | APK nutricional | UC-P12 |
| `RF-033` | APK nutricional | UC-P12 |
| `RF-034` | Revisión nutricional | UC-P13 |
| `RF-035` | Continuidad nutricional | UC-P13 / UC-I06 |
| `RF-036` | Entrenamiento | UC-P14 |
| `RF-037` | Catálogo de ejercicios | UC-P15 |
| `RF-038` | Integración de entrenamiento | UC-I07 / UC-P15 |
| `RF-039` | Plan de entrenamiento | UC-P15 |
| `RF-040` | Plan de entrenamiento | UC-P15 |
| `RF-041` | Activación de entrenamiento | UC-P16 / UC-I04 / UC-I10 |
| `RF-042` | APK de entrenamiento | UC-P17 |
| `RF-043` | APK de entrenamiento | UC-P17 |
| `RF-044` | Corrección | UC-E02 / UC-I12 / UC-I03 |
| `RF-045` | Revisión de entrenamiento | UC-P18 |
| `RF-046` | Continuidad de entrenamiento | UC-P18 / UC-I06 |
| `RF-047` | Antropometría | UC-P19 |
| `RF-048` | Antropometría | UC-I09 / UC-P19 / UC-E03 |
| `RF-049` | Evolución antropométrica | UC-P20 |
| `RF-050` | Corrección antropométrica | UC-E03 / UC-I12 / UC-I03 / UC-I09 |
| `RF-051` | Descubrimiento antropométrico | UC-P21 / UC-P22 / UC-E04 / UC-P04 / UC-P05 |
| `RF-052` | Dashboard profesional | UC-P23 / UC-I02 |
| `RF-053` | Dashboard interdisciplinario | UC-P24 / UC-I02 |
| `RF-054` | Historial longitudinal | UC-P24 / UC-P31 / UC-I03 |
| `RF-055` | Revisión y continuidad | UC-P23 / UC-I05 |
| `RF-056` | Revisión profesional común | UC-I05; invocado por UC-P13 y UC-P18 |
| `RF-057` | Coordinación | UC-E07 / UC-I02 / UC-I03 |
| `RF-058` | Analítica de validación | UC-S01; productores UC-P13 / UC-P18 mediante UC-I05 / UC-I06 |
| `RF-059` | Resiliencia funcional | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 |
| `RF-060` | Procedencia | UC-I08 / TR-04 / UC-P10 / UC-P15 |
| `RF-061` | Comunicaciones | UC-P30 |
| `RF-062` | Comunicaciones | UC-E08 |
| `RF-064` | Entrenamiento | UC-P14 |
| `RF-065` | APK longitudinal | UC-P31 / UC-I02 |
| `RF-066` | Administración académica | UC-P29 / UC-I10 / UC-P11 / UC-P16 / UC-P19 / UC-P21 |
| `RF-067` | Alta profesional | UC-P01 / UC-I01 |
| `RF-068` | Administración | UC-P28 |
| `RF-069` | Ciclo de vida de cuenta | UC-P27 |
| `RF-070` | Métodos profesionales reproducibles | UC-I13; especializado por UC-I09; invocado por UC-P09 / UC-P14 |
| `RF-071` | Solicitudes estructuradas de información | UC-P32 / UC-P33 / UC-I02 / UC-I03 |

### 16.3. Reglas transversales

| Regla | Nombre | Naturaleza |
|---|---|---|
| `TR-01` | Separación de conceptos | Regla transversal no actoral |
| `TR-02` | Autorización contextual | Regla transversal no actoral |
| `TR-03` | Auditoría, autoría, versionado e historia | Regla transversal no actoral |
| `TR-04` | Procedencia y resiliencia | Regla transversal no actoral |
| `TR-05` | Revocación efectiva | Regla transversal no actoral |

### 16.4. Control cuantitativo

```text
RF:
69 ÚNICOS
0 DUPLICADOS
0 SIN MAPPING

CASOS:
56 EN ARQUITECTURA CANDIDATA
56 EN EL MAESTRO
33 PRINCIPALES
13 INCLUIDOS
9 EXTENSIONES
1 SOPORTE
0 FALTANTES
0 EXTRA
0 DUPLICADOS

DELTA v0.14 → v0.15:
+ UC-P32
+ UC-P33
+ UC-I13
0 UC NUEVOS PARA ANT-DRAFT
0 UC NUEVOS PARA ANT-VOID

REGLAS:
TR-01 A TR-05
0 REFERENCIAS UC-T ACTIVAS

RF NUEVOS:
RF-070
RF-071

NUMERACIÓN EXTERNA:
NO EVIDENCIADA
```

---

## 17. Apéndice — Historial consolidado de cambios

Este apéndice reúne los changelogs retirados del cuerpo del maestro. Las referencias a identificadores históricos se conservan únicamente con valor documental.

### 17.1. Glosario y control terminológico

*Fuente histórica: `BE_LEG_05_v0.1.8_GLOSARIO_CIERRE_COMPLEMENTARIO.md`.*

#### 17.1.1. Changelog `v0.1 → v0.1.1`

| Cambio | Motivo |
|---|---|
| Se incorpora la asimetría vínculo–consentimiento | Evitar revocación = finalización automática |
| Se incorpora la conservación histórica al finalizar | Evitar borrado de consentimientos y revocaciones |
| Se amplía la lista de control por bloque | Hacer verificable la separación en Bloque 03 y posteriores |
---

#### 17.1.2. Changelog `v0.1.1 → v0.1.2`

| Cambio | Motivo |
|---|---|
| La prosa normativa se retiró de bloques `text` | Reservarlos para esquemas |
| Se trasladó al glosario la obligación de aplicación en UC-P08 | Propiedad transversal correcta |
| Se incorporaron `Finalidad` y `Revocación de consentimiento` | Preparar el Bloque 03 antes de propagar términos |
| Se registró la asimetría en cinco ubicaciones verificables | Control previo a declarar redactado UC-P08 |
| Se aplicó `DEC-044` al concepto de alcance | Consentimiento puede recaer sobre capacidad transversal |
---

#### 17.1.3. Changelog `v0.1.2 → v0.1.3`

| Cambio | Motivo |
|---|---|
| Referencias de 02 y 03 acompañadas por títulos de sección | Hacerlas resolubles y resistentes a cambios de numeración |
| Las referencias de 03 §10/§11 quedaron sujetas a contrarrevisión posterior | No se conserva una afirmación de verificación no sustentada |
| Estado, fecha y artefactos aplicados actualizados | Eliminar metadatos obsoletos |
| Se incorporan diez términos reutilizables para Nutrición y Entrenamiento | Evitar vocabularios paralelos |
| Se prohíbe fijar fórmulas, contenido nutricional o scores en 05 | Preservar la frontera con 06 y el criterio profesional |


---

#### 17.1.4. Changelog `v0.1.3 → v0.1.4`

| Cambio | Motivo |
|---|---|
| Verificación profesional corregida a `03 §16 — Verificación profesional` | Aplicar la contrarrevisión sobre el bundle G1 |
| Capacidad antropométrica corregida a `03 §17 — Antropometría` | Aplicar la contrarrevisión sobre el bundle G1 |
| Asesorado e Identidad BE remiten a `03 §4` y `03 §15` | Alinear actores, identidad y cuenta |
| Habilitación remite a `03 §4` y `03 §14` | Alinear separación y capacidad |
| Riesgos de 02 corregidos a `§21` | Eliminar referencia desplazada |
| Se elimina toda afirmación de auditoría contra repositorio o commit no disponible | Aplicar la regla de gobernanza de evidencia |
| Se incorporan Resultado semántico de revisión, Próxima acción y Ciclo cerrado trazable | Preparar UC-P13 sin vocabulario paralelo |
| Estado y artefactos aplicados actualizados | Custodia documental |


---

#### 17.1.5. Changelog `v0.1.4 → v0.1.5`

| Cambio | Motivo |
|---|---|
| `02 §12` adopta “Descubrimiento limitado de servicios antropométricos” | Copiar el título confirmado por la contrarrevisión |
| `02 §13` adopta “Estrategia de integraciones externas” | Eliminar título aproximado |
| `02 §21` adopta “Riesgos prioritarios” | Eliminar título reconstruido |
| Se incorporan Bloque de entrenamiento, Prescripción de entrenamiento, Ejecución real, Corrección trazable y Progresión de entrenamiento | Preparar el circuito antes de propagar vocabulario |
| Progresión se vincula a `AJUSTAR` o `SUSTITUIR` | Evitar una taxonomía paralela |
| Estado y artefactos aplicados actualizados | Custodia documental |


---

#### 17.1.6. Changelog `v0.1.5 → v0.1.6`

| Cambio | Motivo |
|---|---|
| Se incorporan Medición antropométrica directa y Cálculo antropométrico derivado | Separar RF-047 y RF-048 |
| Se incorpora Protocolo identificado | Exigir trazabilidad sin fijar un protocolo |
| Se incorpora Evolución antropométrica | Preparar comparación longitudinal no diagnóstica |
| Se incorporan Servicio antropométrico limitado y Ubicación utilizable | Controlar publicación y descubrimiento sin marketplace |
| `UC-I12` se adopta como patrón común de corrección | Evitar duplicar RF-044 y RF-050 |
| Se registra que E03 añade recálculo derivado al patrón común | Conservar la especificidad antropométrica |
| Estado y artefactos aplicados actualizados | Custodia documental |


---

#### 17.1.7. Changelog `v0.1.6 → v0.1.7`

| Cambio | Motivo |
|---|---|
| Se incorporan Cartera profesional y Revisión pendiente | Controlar lenguaje operativo no clínico |
| Se incorpora Dashboard interdisciplinario | Limitar síntesis por autorización sin calificación agregada |
| Se incorporan Línea temporal longitudinal, Momento de ocurrencia y Momento de registro | Materializar RF-054 |
| Se incorpora Nota de coordinación autorizada | Evitar prescripción cruzada y transferencia de responsabilidad |
| Se incorpora Progreso longitudinal propio | Preparar RF-065 sin autodiagnóstico o comparación social |
| Estado y artefactos aplicados actualizados | Custodia documental |


---

#### 17.1.8. Changelog `v0.1.7 → v0.1.8`

| Cambio | Motivo |
|---|---|
| Se incorporan términos de identidad, acceso, recuperación y cierre | Preparar cierre complementario A |
| Se incorporan incidencia, capacidad, novedad y push | Preparar cierre complementario B |
| Se incorpora TVCC-30 como término controlado | Evitar interpretarlo como score de salud |
| `UC-T` pasa a `TR` | Alinear nomenclatura con la naturaleza no actoral |
| Estado y alcance de aplicación actualizados | Preparar auditoría final |

### 17.2. Arquitectura de casos de uso

*Fuente histórica: `BE_LEG_05_v0.2.9_ARQUITECTURA_CIERRE_COMPLEMENTARIO.md`.*

#### 17.2.1. Changelog v0.1 → v0.2

- incorporada evidencia externa sobre integridad del paquete aprobado;
- definido UC-S01 para RF-058;
- separado RF-005 como extensión UC-E09;
- corregidas contradicciones editoriales de RF-025 y RF-066;
- ampliada la matriz con invocantes relevantes;
- anclados RNF conductuales;
- fijadas 12 historias de usuario prioritarias;
- identificados casos de validación de DEC-042 y DEC-043;
- definida profundidad proporcional de especificación;
- registrada decisión de dirección de priorizar completitud sobre la fecha objetivo, pendiente de rebaseline formal.
---

#### 17.2.2. Changelog v0.2 → v0.2.1

| Cambio | Motivo |
|---|---|
| `UC-P02` adopta “resolver la verificación profesional” | Alinear el nombre del caso con RF-012 |
| `RF-012` incorpora `UC-P03` como invocante relevante | Registrar suspensión/rehabilitación en la trazabilidad bidireccional |
| `UC-P03` incorpora RF-012 como requisito base | El caso materializa parte del resultado exigido por RF-012 |
| Se declara control terminológico transversal | Evitar deriva entre bloques y preparar 06/12 |
---

#### 17.2.3. Changelog v0.2.1 → v0.2.2

| Cambio | Motivo |
|---|---|
| `RF-015` incorpora `UC-P04` y `UC-P05` como invocantes | Registrar dónde se ejercita la separación entre verificación, habilitación, vínculo y autorización |
| `RF-023` incorpora `UC-P05` como invocante | Trazar la consulta propia necesaria antes de aceptar o rechazar |
| `RF-051` incorpora `UC-P04` y `UC-P05` como invocantes | Trazar el paso desde descubrimiento antropométrico hacia solicitud y decisión de vínculo |
| Se mantiene un único caso hogar por capacidad y se registran los invocantes relevantes | Cumplir la trazabilidad bidireccional y el control terminológico |
---

#### 17.2.4. Changelog v0.2.2 → v0.2.3

| Cambio | Motivo |
|---|---|
| Se registra `DEC-044` como decisión aprobada | La operación antropométrica independiente confirma el canon |
| `UC-P29` admite identidad con solo capacidad antropométrica verificada | Evitar exigir una especialidad inexistente como precondición |
| `UC-I10` incorpora `UC-P19` como invocante | Verificar habilitación antes de una evaluación antropométrica |
| `RF-066` incorpora `UC-P19` y `UC-P21` como invocantes | Trazar evaluación y publicación antropométricas |
| Se elimina la interpretación de Antropometría independiente como expansión | La decisión no modifica el alcance aprobado |
---

#### 17.2.5. Changelog v0.2.3 → v0.2.4

| Cambio | Motivo |
|---|---|
| RF-028 incorpora UC-P10 como invocante | Trazar la importación controlada en el diseño nutricional |
| RF-059 y RF-060 incorporan UC-P10 | Trazar fallback y procedencia en Open Food Facts |
| RF-066 incorpora UC-P11 | Trazar el control de capacidad al activar un proceso nuevo |
| RF-053 incorpora UC-I02 | Preparar la autorización del dashboard interdisciplinario |
| Se declara que el circuito nutricional se completa entre Bloques 04 y 05 | Evitar afirmar cierre antes de revisión y continuidad |


---

#### 17.2.6. Changelog v0.2.4 → v0.2.5

| Cambio | Motivo |
|---|---|
| UC-P13 explicita UC-I05, UC-I06 y la producción de ciclo cerrado trazable | Cerrar el circuito nutricional sin apropiarse de TVCC-30 |
| RF-058 registra UC-P13 y UC-P18 como productores del evento base | Completar trazabilidad bidireccional |
| UC-S01 conserva la propiedad del cálculo reproducible | Separar operación profesional de analítica |
| La arquitectura adopta el glosario v0.1.4 | Aplicar correcciones de custodia y términos de revisión |


---

#### 17.2.7. Changelog v0.2.5 → v0.2.6

| Cambio | Motivo |
|---|---|
| UC-P14 explicita RF-064 | Evitar omitir el objetivo de entrenamiento |
| UC-P15 incorpora RF-059 y RF-060 | Registrar fallback y procedencia de wger |
| RF-038 incorpora UC-P15 como invocante | Trazar la importación controlada |
| RF-059 y RF-060 incorporan UC-P15 | Trazar resiliencia y procedencia en Entrenamiento |
| RF-066 incorpora UC-P16 | Reutilizar el control de capacidad al activar |
| UC-E02 explicita preservación del original | Materializar RF-044 sin sobrescritura |
| UC-P18 invoca UC-I05/UC-I06 y produce evento para UC-S01 | Reutilizar revisión común y cerrar el circuito |


---

#### 17.2.8. Changelog v0.2.6 → v0.2.7

| Cambio | Motivo |
|---|---|
| Se incorpora `UC-I12 — Registrar corrección trazable` | Extraer la conducta común de RF-044 y RF-050 |
| UC-E02 pasa a incluir UC-I12 | Evitar redefinir preservación del original |
| UC-E03 incluye UC-I12 y UC-I09 | Agregar recálculo antropométrico al patrón común |
| UC-P19 explicita UC-I09 y UC-I10 | Trazar cálculo reproducible y elegibilidad |
| UC-P21 registra las seis condiciones canónicas de publicación | Aplicar DEC-044 y 02 §12 |
| UC-P22 incorpora RF-059 | Registrar fallback de mapa a lista/ubicación textual |
| RF-051 incorpora UC-E04 y exclusiones de marketplace | Asegurar que descubrimiento solo conduce a solicitud |
| RNF-DAT-003 incorpora UC-I12 | Centralizar correcciones trazables |


---

#### 17.2.9. Changelog v0.2.7 → v0.2.8

| Cambio | Motivo |
|---|---|
| UC-P23 adopta lenguaje operativo no clínico | Aplicar RF-055 sin convertir pendientes en alertas clínicas |
| UC-P24 explicita autorización por dato o conjunto | Evitar acceso interdisciplinario global |
| RF-054 incorpora UC-I03 y separación ocurrencia/registro | Hacer defendible la longitudinalidad |
| UC-E07 incorpora UC-I02/UC-I03 y límites de responsabilidad | Evitar prescripción cruzada |
| UC-P31 excluye autodiagnóstico y comparación con terceros | Aplicar RF-065 en la superficie del asesorado |
| RF-052, RF-053, RF-055, RF-057 y RF-065 amplían invocantes relevantes | Completar trazabilidad bidireccional |
| RF-044 incorpora UC-I12 | Alinear la matriz con el refactor común de correcciones |


---

#### 17.2.10. Changelog v0.2.8 → v0.2.9

| Cambio | Motivo |
|---|---|
| `UC-T01–UC-T05` pasan a `TR-01–TR-05` | Aplicar `DEC-045`: son reglas transversales y no recorridos actorales |
| UC-P25–UC-P27 reciben límites y resultados observables | Formalizar identidad, acceso y ciclo de cuenta |
| UC-P28–UC-P30 reciben límites de soporte, capacidad y comunicaciones | Preparar cierre complementario B |
| UC-E05, UC-E06, UC-E08 y UC-E09 reciben conducta explícita | Completar las extensiones pendientes |
| UC-I01, UC-I03, UC-I04, UC-I07, UC-I08, UC-I10 y UC-I11 se declaran incluidos compactos | Mantener el criterio “todos los UC redactados” sin duplicación extensa |
| UC-S01 se declara ficha completa | Concentrar el cálculo reproducible de TVCC-30 |
| La matriz conserva 67 RF únicos y 0 RF sin caso | Mantener cobertura canónica |

### 17.3. Bloque 01 — Alta profesional

*Fuente histórica: `BE_LEG_05_v0.3.4_BLOQUE_01_JERARQUIA_NORMALIZADA.md`.*

#### 17.3.1. Historial de versión del artefacto

| Versión | Alcance | Estado |
|---|---|---|
| `v0.1` | Arquitectura preliminar de casos de uso | Superada por correcciones de revisión |
| `v0.2` | Arquitectura corregida: UC-S01, recuperación como extensión, trazabilidad e inclusión de RNF conductuales | Base de trabajo aplicada |
| `v0.3` | Primera redacción completa del Bloque 01 | Revisada por Claude |
| `v0.3.1` | Correcciones editoriales del Bloque 01 y propuesta de resolución antropométrica | Superada por control terminológico |
| `v0.3.2` | Unificación `verificación profesional` / `VERIFICADO`, trazabilidad ampliada de RF-012 y enlace al glosario controlado | Versión vigente para revisión de dirección |

##### 17.3.1.1. Changelog `v0.3 → v0.3.1`

| Cambio | Motivo |
|---|---|
| Unificación de `UC-I02` como **Evaluar autorización contextual** | Eliminar doble denominación |
| Incorporación de `UC-I11` al mapa de relaciones internas | Completar la relación ya declarada en UC-P01 |
| Incorporación de `UC-I02` en UC-P01 | Aplicar el patrón transversal también al autoservicio de alta |
| Explicación del alcance de UC-I02 en UC-P01 | Evitar confundir habilitación de cuenta con autorización sobre asesorados |
| Registro explícito de la secuencia v0.1 → v0.2 → v0.3 → v0.3.1 | Evitar saltos de versión no documentados |
| Propuesta de operación antropométrica independiente | Resolver la pregunta que condiciona el Bloque 02 sin alterar silenciosamente RF-067 |

---

##### 17.3.1.2. Changelog `v0.3.1 → v0.3.2`

| Cambio | Motivo |
|---|---|
| Declaración de equivalencia entre aprobación administrativa y verificación favorable | Evitar dos vocabularios para una misma resolución |
| Incorporación explícita de `PENDIENTE`, `VERIFICADO`, `RECHAZADO` y `SUSPENDIDO` como semántica mínima | Alinear 05 con `DEC-005` y `RF-012` sin congelar enums técnicos |
| Renombre de `UC-P02` a “Revisar solicitud y resolver la verificación profesional” | Hacer resoluble la trazabilidad literal `RF-012 → UC-P02` |
| Inclusión de `RF-012` como base de `UC-P03` en la arquitectura | Registrar suspensión como parte del recorrido de verificación |
| Distinción editorial entre revisión administrativa y revisión profesional válida | Evitar colisión con `DEC-043` |
| Referencia al glosario y control terminológico transversal | Prevenir deriva entre bloques |

---

##### 17.3.1.3. Changelog `v0.3.2 → v0.3.3`

| Cambio | Motivo |
|---|---|
| `DEC-044` pasa de propuesta a decisión aprobada | Resolución expresa de dirección del 5 de agosto de 2026 |
| Se retira la provisionalidad de Antropometría independiente | La decisión confirma los documentos 02, 03 y 04 |
| Se reemplaza “aprobada administrativamente” por capacidad `VERIFICADA` | Alinear con el glosario canónico |
| Se incorpora la dependencia de `UC-P29` | Admitir una identidad con solo capacidad antropométrica verificada |
| Se registra que el Documento 04 no requiere cambio | No existe ampliación de alcance |

#### 17.3.2. Changelog `v0.3 → v0.3.1`

| Cambio | Motivo |
|---|---|
| Unificación de `UC-I02` como **Evaluar autorización contextual** | Eliminar doble denominación |
| Incorporación de `UC-I11` al mapa de relaciones internas | Completar la relación ya declarada en UC-P01 |
| Incorporación de `UC-I02` en UC-P01 | Aplicar el patrón transversal también al autoservicio de alta |
| Explicación del alcance de UC-I02 en UC-P01 | Evitar confundir habilitación de cuenta con autorización sobre asesorados |
| Registro explícito de la secuencia v0.1 → v0.2 → v0.3 → v0.3.1 | Evitar saltos de versión no documentados |
| Propuesta de operación antropométrica independiente | Resolver la pregunta que condiciona el Bloque 02 sin alterar silenciosamente RF-067 |

---

#### 17.3.3. Changelog `v0.3.1 → v0.3.2`

| Cambio | Motivo |
|---|---|
| Declaración de equivalencia entre aprobación administrativa y verificación favorable | Evitar dos vocabularios para una misma resolución |
| Incorporación explícita de `PENDIENTE`, `VERIFICADO`, `RECHAZADO` y `SUSPENDIDO` como semántica mínima | Alinear 05 con `DEC-005` y `RF-012` sin congelar enums técnicos |
| Renombre de `UC-P02` a “Revisar solicitud y resolver la verificación profesional” | Hacer resoluble la trazabilidad literal `RF-012 → UC-P02` |
| Inclusión de `RF-012` como base de `UC-P03` en la arquitectura | Registrar suspensión como parte del recorrido de verificación |
| Distinción editorial entre revisión administrativa y revisión profesional válida | Evitar colisión con `DEC-043` |
| Referencia al glosario y control terminológico transversal | Prevenir deriva entre bloques |

---

#### 17.3.4. Changelog `v0.3.2 → v0.3.3`

| Cambio | Motivo |
|---|---|
| `DEC-044` pasa de propuesta a decisión aprobada | Resolución expresa de dirección del 5 de agosto de 2026 |
| Se retira la provisionalidad de Antropometría independiente | La decisión confirma los documentos 02, 03 y 04 |
| Se reemplaza “aprobada administrativamente” por capacidad `VERIFICADA` | Alinear con el glosario canónico |
| Se incorpora la dependencia de `UC-P29` | Admitir una identidad con solo capacidad antropométrica verificada |
| Se registra que el Documento 04 no requiere cambio | No existe ampliación de alcance |

#### 17.3.5. Changelog `v0.3.3 → v0.3.4`

| Cambio | Motivo |
|---|---|
| Casos UC normalizados a H2 | Ensamble consistente del Documento 05 maestro |
| Subsecciones internas normalizadas a H3 | Evitar que Código, Nombre y Objetivo aparezcan como secciones principales |
| Variantes y excepciones normalizadas a H4 | Jerarquía semántica uniforme |
| Escenarios de historias normalizados a H5 | Tabla de contenidos resoluble |
| Changelog 14.3 reubicado antes del estado | Orden documental coherente |

### 17.4. Bloque 02 — Vínculo profesional–asesorado

*Fuente histórica: `BE_LEG_05_v0.4.4_BLOQUE_02_REGLAS_TR.md`.*

#### 17.4.1. Historial de versión

##### 17.4.1.1. Changelog `v0.4 → v0.4.1`

| Cambio | Motivo |
|---|---|
| Se refuerza la relación de `RF-022` con `UC-P06` | Evitar que la revocación se implemente como finalización automática |
| Se incorpora una regla obligatoria de asimetría para el Bloque 03 | Preservar la independencia entre vínculo y consentimiento |
| Se exige repetir la asimetría en garantías, reglas, aceptación y auditoría de `UC-P08` | Convertir la advertencia en control verificable |
| Se registran los efectos del consentimiento revocado como pendiente de `06/08` | Evitar invadir estados, retención y lectura residual |

---

##### 17.4.1.2. Changelog `v0.4.1 → v0.4.2`

| Cambio | Motivo |
|---|---|
| Se verificaron y preservaron `### 2.3`, `# Changelog` y `# Estado` | Custodia estructural |
| Se mantuvieron balanceados todos los bloques de código | Evitar Markdown mal formado |
| La prosa normativa se retiró de los bloques `text` | Reservarlos para relaciones y esquemas |
| La obligación de repetición transversal se trasladó al glosario | El Bloque 02 no gobierna otros bloques |
| Se aplicó `DEC-044` | Retirar provisionalidad de Antropometría independiente |
| `R-05-VIN-06` pasa a resuelto | Existe decisión expresa de dirección |
| UC-P04, UC-P05 y UC-P06 admiten alcance por capacidad transversal | Confirmar el canon aprobado |

#### 17.4.2. Changelog `v0.4 → v0.4.1`

| Cambio | Motivo |
|---|---|
| Se refuerza la relación de `RF-022` con `UC-P06` | Evitar que la revocación se implemente como finalización automática |
| Se incorpora una regla obligatoria de asimetría para el Bloque 03 | Preservar la independencia entre vínculo y consentimiento |
| Se exige repetir la asimetría en garantías, reglas, aceptación y auditoría de `UC-P08` | Convertir la advertencia en control verificable |
| Se registran los efectos del consentimiento revocado como pendiente de `06/08` | Evitar invadir estados, retención y lectura residual |

---

#### 17.4.3. Changelog `v0.4.1 → v0.4.2`

| Cambio | Motivo |
|---|---|
| Se verificaron y preservaron `### 2.3`, `# Changelog` y `# Estado` | Custodia estructural |
| Se mantuvieron balanceados todos los bloques de código | Evitar Markdown mal formado |
| La prosa normativa se retiró de los bloques `text` | Reservarlos para relaciones y esquemas |
| La obligación de repetición transversal se trasladó al glosario | El Bloque 02 no gobierna otros bloques |
| Se aplicó `DEC-044` | Retirar provisionalidad de Antropometría independiente |
| `R-05-VIN-06` pasa a resuelto | Existe decisión expresa de dirección |
| UC-P04, UC-P05 y UC-P06 admiten alcance por capacidad transversal | Confirmar el canon aprobado |

#### 17.4.4. Changelog `v0.4.2 → v0.4.3`

| Cambio | Motivo |
|---|---|
| Casos UC normalizados a H2 | Ensamble consistente del Documento 05 maestro |
| Subsecciones internas normalizadas a H3 | Evitar títulos genéricos en el nivel principal |
| Variantes y excepciones normalizadas a H4 | Jerarquía semántica uniforme |
| Historias y escenarios normalizados a H3/H5 | Tabla de contenidos resoluble |
| Changelogs previos agrupados antes del estado | Orden documental coherente |


---

#### 17.4.5. Changelog `v0.4.3 → v0.4.4`

| Cambio | Motivo |
|---|---|
| `UC-T03` pasa a `TR-03` | Reclasificar reglas transversales que no son casos actorales |
| No se modifica conducta normativa | Cambio exclusivo de nomenclatura |

### 17.5. Bloque 03 — Consentimiento y autorización

*Fuente histórica: `BE_LEG_05_v0.5.2_BLOQUE_03_REGLAS_TR.md`.*

#### 17.5.1. Historial de versión

##### 17.5.1.1. Changelog `v0.5 → v0.5.1`

| Cambio | Motivo |
|---|---|
| Casos UC normalizados a H2 | Ensamble consistente del Documento 05 maestro |
| Subsecciones internas normalizadas a H3 | Evitar Código, Nombre y Objetivo en el nivel principal |
| Variantes y excepciones normalizadas a H4 | Jerarquía semántica uniforme |
| Historias y criterios normalizados a H3/H4/H5 | Tabla de contenidos resoluble |
| Validación jerárquica incorporada | Detectar saltos y títulos genéricos mal ubicados |

---

#### 17.5.2. Changelog `v0.5 → v0.5.1`

| Cambio | Motivo |
|---|---|
| Casos UC normalizados a H2 | Ensamble consistente del Documento 05 maestro |
| Subsecciones internas normalizadas a H3 | Evitar Código, Nombre y Objetivo en el nivel principal |
| Variantes y excepciones normalizadas a H4 | Jerarquía semántica uniforme |
| Historias y criterios normalizados a H3/H4/H5 | Tabla de contenidos resoluble |
| Validación jerárquica incorporada | Detectar saltos y títulos genéricos mal ubicados |

---

#### 17.5.3. Changelog `v0.5.1 → v0.5.2`

| Cambio | Motivo |
|---|---|
| `UC-T05` pasa a `TR-05` | Reclasificar revocación efectiva como regla transversal |
| No se modifica conducta normativa | Cambio exclusivo de nomenclatura |

### 17.6. Bloque 06 — Circuito de entrenamiento

*Fuente histórica: `BE_LEG_05_v0.8.1_BLOQUE_06_REFACTOR_CORRECCION_COMUN.md`.*

#### 17.6.1. Changelog `v0.8 → v0.8.1`

| Cambio | Motivo |
|---|---|
| UC-E02 incorpora `UC-I12 — Registrar corrección trazable` | Extraer la conducta común reutilizable por Antropometría |
| El flujo delega preservación del original, actor, fecha, motivo y cadena en UC-I12 | Evitar definiciones paralelas |
| UC-E02 conserva sus reglas propias sobre prescripción y ejecución | Mantener la especificidad del dominio |
| No se modifica ningún RF, resultado o conducta aprobada | Refactor documental sin cambio normativo |

### 17.7. Decisión de reclasificación TR

La transición histórica `UC-T01–UC-T05 → TR-01–TR-05` se formalizó mediante `DEC-045`. Estas menciones no representan referencias activas a casos de uso.


### 17.8. Parche transversal `v0.14 → v0.15`

> **Autorización:** `ACTA-DIR-022`  
> **Fuente RF:** BE-LEG-04 v0.4.2.1 SHA-256 `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b`  
> **Auditoría de impacto:** `454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`

| Cambio | Motivo |
|---|---|
| + `UC-I13` | Materializar `RF-070` con un único patrón transversal de cálculo reproducible. |
| `UC-I09` especializa `UC-I13` | Evitar dos definiciones de cálculo reproducible y conservar semántica antropométrica específica. |
| `UC-P09` / `UC-P14` pueden invocar `UC-I13` | Dar hogar observable a CAP-MET en Nutrición y Entrenamiento sin casos por fórmula. |
| + `UC-P32` / `UC-P33` | Materializar `RF-071` como dos objetivos actorales distintos. |
| `UC-P33 ↔ UC-P25` explícito | Evitar que perfil propio y respuesta solicitada pierdan procedencia o se dupliquen silenciosamente. |
| `UC-E03` amplía corrección → corrección o anulación | Reparar la deuda downstream de `RF-050` sin crear UC nuevo. |
| `UC-P19 V04` preservado | ANT-DRAFT ya estaba aprobado; no se crea RF/UC nuevo. |
| Conteo 53 → 56 UC; 67 → 69 RF | Reflejar exclusivamente el parche autorizado. |
| Tabla arquitectónica de incluidos 11 → 13 | Reconciliar el valor histórico desactualizado: baseline real 12 + `UC-I13` = 13. |
| 07 sin cambios | La auditoría no detectó impacto arquitectónico material. |
| Sin Git / sin canonización | Esta versión permanece borrador hasta contrarrevisión y decisión. |
