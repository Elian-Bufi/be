# BE-LEG-06 — Modelo de dominio

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Versión maestra:** `v0.1.1`  
> **Estado:** `BORRADOR DE PARCHE TRANSVERSAL POST-BASELINE — NO APROBADO`  
> **Fecha de baseline:** `2026-08-16`
> **Fecha del parche:** `2026-09-07`  
> **Documento destino:** `06_Modelo_de_Dominio.md`  
> **Arquitectura aplicada:** `BE-LEG-06 v0.1.1`  
> **Bloques cerrados:** `14/14`  
> **Cobertura DERIVAR 06:** `209/209`  
> **Áreas:** `M-00…M-12`  
> **Baseline previa:** `BE-LEG-06 v0.1 APROBADA/CANÓNICA`  
> **Canonización Git de v0.1.1:** `NO AUTORIZADA`  
> **Autorización Git:** `NINGUNA`
>
> **Estado de custodia:** `VERIFICADA`  
> - Fuentes de cuerpo: `15/15 MATERIALIZADAS Y VERIFICADAS POR SHA-256`.  
> - Auditoría integral, manifiesto maestro y preensamblado de custodia: `MATERIALIZADOS`.  
> - Regla de custodia: ninguna afirmación de verificación contra repositorio, commit o hash se presume sin el artefacto correspondiente; ante ausencia de evidencia, `NO EVIDENCIADO`.

---

> **Control de cambio v0.1.1:** `ACTA-DIR-023` aprueba documentalmente BE-LEG-05 v0.15 (`d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf`) y autoriza este parche sobre la baseline BE-LEG-06 v0.1 (`2200dba6313a11a8dfcfd3f62fa12d00f27bbf99985e9a61ef62eebf3228b727`). Los 14 bloques históricos y el inventario original `209/209` se conservan como baseline. La sección 20 añade únicamente la semántica transversal posterior autorizada.

## 1. Control documental

### 1.1. Propósito del maestro

Consolidar en un único artefacto el modelo de dominio aprobado por bloques para `BE-LEG-06`, preservando vocabulario, arquitectura, estructuras, reglas, invariantes, fronteras, trazabilidad y cierre global sin introducir producto nuevo ni convertir decisiones de implementación en decisiones de dominio.

### 1.2. Estado y gate

El desarrollo por bloques fue declarado completo por `ACTA-DIR-017`. Este archivo es el **maestro ensamblado candidato a contrarrevisión integral**. No constituye baseline ni canon; la canonización requiere acta separada posterior a la revisión integral y aprobación de Dirección.

### 1.3. Criterio de ensamblado

- un único encabezado H1;
- cada artefacto fuente desciende un nivel completo;
- máximo H6;
- numeración jerárquica única y continua en el maestro;
- changelogs retirados del cuerpo y consolidados en el apéndice;
- reglas `TR-01…TR-05` incorporadas después de B-13;
- índice de trazabilidad construido sobre las 209 unidades canónicas;
- auditoría repetida sobre este archivo maestro, no sobre las partes;
- cero operaciones Git.

### 1.4. Regla de referencias internas heredadas

La numeración de **encabezados** se normaliza al esquema global del maestro. Las referencias textuales heredadas que nombran explícitamente un artefacto o bloque —por ejemplo, `B-00 §10.1`, `ACTA-DIR-015 §5` o `DEC-047 §4`— conservan su referencia fuente y no se reescriben. Las referencias locales sin calificador permanecen como referencias históricas al bloque fuente; su modificación hubiera constituido una edición semántica distinta del ensamblado mecánico autorizado.

### 1.5. Custodia y verificación de fuentes

El ZIP de reposición `BE_LEG_06_FUENTES_FALTANTES_ENSAMBLADO.zip` fue recalculado antes del ensamblado y coincidió con `0c7e319dd42b08c3716e2681722f05a8cdcab30ebc3ea19611b3322e17eb8117`. Sus ocho archivos verificaron `8/8` contra el manifiesto interno. Los siete bloques ya materializados fueron recalculados nuevamente. **Las quince fuentes de cuerpo coinciden con sus SHA-256 aprobados.**

| Orden | Artefacto | Archivo fuente | SHA-256 | Estado |
|---:|---|---|---|---|
| 1 | B-00 | `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | `RECALCULADO — COINCIDE` |
| 2 | ARQ | `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | `RECALCULADO — COINCIDE` |
| 3 | B-06 | `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | `RECALCULADO — COINCIDE` |
| 4 | B-01 | `BE_LEG_06_B01_v0_1_IDENTIDAD_PERFIL_Y_CICLO_DE_CUENTA.md` | `a9eff9d8da6c29ecbb2d50bd8ac59c47bfa2d805bbbad2e0789adf34584947dd` | `RECALCULADO — COINCIDE` |
| 5 | B-02 | `BE_LEG_06_B02_v0_1_1_PERFIL_PROFESIONAL_VERIFICACION_Y_HABILITACION.md` | `03f220bd428d5abe429e41714981ba49adefa6870e24358e03856ba8b12d058e` | `RECALCULADO — COINCIDE` |
| 6 | B-03 | `BE_LEG_06_B03_v0_1_1_VINCULO_CONSENTIMIENTO_Y_AUTORIZACION.md` | `75e477561a99c98e04a0fa0dd3cd101c42584f3a65ed233667f155337635b815` | `RECALCULADO — COINCIDE` |
| 7 | B-04 | `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` | `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5` | `RECALCULADO — COINCIDE` |
| 8 | B-05 | `BE_LEG_06_B05_v0_1_CAPACIDAD_Y_HABILITACION_CONFIGURADA.md` | `40951084cf874adad23b4fb7dec994e521cecaeeea35e1a815e33981d4003ebe` | `RECALCULADO — COINCIDE` |
| 9 | B-07 | `BE_LEG_06_B07_v0_1_2_CIRCUITO_NUTRICIONAL.md` | `ae7e874891652ffce5ebc3c7655f0505f579cbb5cd0c6214b6bce11977e0aeb2` | `RECALCULADO — COINCIDE` |
| 10 | B-08 | `BE_LEG_06_B08_v0_1_2_CIRCUITO_ENTRENAMIENTO.md` | `dfe2257cec4bdc97264f12266f41dfaed8ef0067af73fcce48fa880ad02e2dbb` | `RECALCULADO — COINCIDE` |
| 11 | B-09 | `BE_LEG_06_B09_v0_1_REVISION_Y_CONTINUIDAD.md` | `370b29932c015eb1f76f58ba7adbc5a97750a9758e8046a15514f934e86517b8` | `RECALCULADO — COINCIDE` |
| 12 | B-10 | `BE_LEG_06_B10_v0_1_ANTROPOMETRIA.md` | `25524467f493af795f9766d9c855b063219979cf62c4479e161f6ed660610727` | `RECALCULADO — COINCIDE` |
| 13 | B-11 | `BE_LEG_06_B11_v0_1_PROYECCIONES_Y_CARTERA.md` | `e343c74126a066d5e583f888347d45cea708b49df9e188d53d8ec7d1c893f05f` | `RECALCULADO — COINCIDE` |
| 14 | B-12 | `BE_LEG_06_B12_v0_1_ANALITICA_Y_TVCC30.md` | `19883ade5098293a73caf52bffdc9aab5aace35d62b5ffcc5c25638f975095f5` | `RECALCULADO — COINCIDE` |
| 15 | B-13 | `BE_LEG_06_B13_v0_1_CIERRE_GLOBAL.md` | `200c9e11a424fa35bb703561b0afdf4677740d7177ad550d514849e7f5afc8d1` | `RECALCULADO — COINCIDE` |

### 1.6. Fuentes de gobierno no ensambladas como bloque

| Fuente | Aplicación | SHA-256 / custodia |
|---|---|---|
| `DEC_045_RECLASIFICACION_REGLAS_TR.md` | definición y nomenclatura de `TR-01…TR-05` | `04e693103cde0e2f6b804d04fa4088b87ad4207920af896b95f4acd4bca21396` — hash canónico G2; contenido inspeccionado, no recalculado desde bytes locales en esta ronda |
| `DEC_046_ESTANDAR_PROFESIONAL_DE_LAS_VERTICALES.md` | estándar profesional materializado en B-07/B-08 | `e68c1baf5a9abf4238a1f645dfb7187e5a0cac04c4b06517903bfd7736c76f4b` — recalculado localmente |
| `DEC_047_CAPTURA_PARA_PROYECCIONES.md` | captura suficiente para proyecciones | `42e1932312970d3410257ad7cf11f4a21b4848fd4ea9a24d42077fe90ad0d01a` — recalculado localmente |
| `ACTA_DIR_017_APROBACION_ENTREGA_E_Y_ENSAMBLADO_MAESTRO.md` | autorización y condiciones de ensamblado | `b575d93b48405dd8865a1cd683787e49301fb04729fa5e26dfb39d48cd636514` — recalculado localmente |

### 1.7. Estructura del documento

1. B-00 — control terminológico y reglas raíz.
2. Arquitectura del modelo de dominio.
3. B-06 — patrón común de versionado/historia.
4. B-01 a B-05.
5. B-07 a B-13 en el orden aprobado.
6. Reglas transversales `TR-01…TR-05`.
7. Índice de trazabilidad.
8. Apéndice de historial consolidado.

### 1.8. Control de aplanamiento previo

Las quince fuentes fueron inspeccionadas antes de ensamblar. Ninguna contiene encabezados H6. El máximo fuente es H4 y aparece únicamente en B-07; tras el descenso completo, el máximo teórico del maestro es H5. Por tanto, ningún encabezado requiere H7 y no existe un nivel estructural que deba aplanarse.

---


## 2. B-00 — Control terminológico y reglas raíz

*Fuente ensamblada: `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` · SHA-256 `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2`.*


### 2.1. Propósito y alcance del bloque

#### 2.1.1. Qué es B-00

B-00 es el bloque raíz del Documento 06. Establece **cómo se modela**, no **qué** se modela. Fija el régimen terminológico heredado de 05; los constructos de modelado y sus convenciones; los invariantes raíz; las reglas comunes de equivalencia, comparabilidad y unicidad; las prohibiciones raíz; y el protocolo de apertura/cierre que deberán cumplir B-01…B-13.

Salda las siete unidades de deuda que la arquitectura vigente asigna a `M-00` como área primaria: `7.1-01`, `7.1-02`, `7.1-03`, `7.1-04`, `7.1-05`, `7.1-07` y `7.1-11`. La sección 10 traza cada unidad a su resolución dentro de este bloque.

#### 2.1.2. Qué no es B-00

Este bloque **no** enumera entidades concretas del dominio, **no** define máquinas de estados concretas, **no** fija atributos exhaustivos y **no** anticipa contenido sustantivo de `M-01…M-12`. No fija fórmulas de TVCC-30, políticas de seguridad/privacidad, contratos, interfaces, despliegue, pantallas, instrumentos de medición ni persistencia física.

Cuando un ejemplo resulta imprescindible, usa exclusivamente vocabulario ya aprobado y se marca como ilustrativo: el ejemplo no crea, modifica ni congela el elemento mencionado.

#### 2.1.3. Fuerza normativa

Las convenciones (`CONV-06-*`), invariantes (`INV-06-*`), reglas (`REG-06-*`) y prohibiciones (`PROH-06-*`) son vinculantes para B-01…B-13. Un bloque posterior no puede derogarlas o reinterpretarlas silenciosamente; una tensión exige hallazgo y decisión de Dirección conforme a `INV-06-10`.

### 2.2. Estado de gobierno, custodia y procedencia

#### 2.2.1. Estado vigente

- `BE-LEG-06 v0.1.1` continúa como arquitectura aprobada; su SHA-256 reverificado es `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8`.
- `ACTA-DIR-007` habilita la redacción por bloques y **no autoriza Git**; SHA-256 reverificado `2460c2ba48318ad71350424da40d3f601bf3a00b177a6d22b695bcc45dbf16a7`.
- G2 fue cerrado mediante el commit `2e12bbe95aa6237eec0a31297f23f2a94fe2c9f2`, con parent `13224caa93b9c6cc8cc748f1035b385d7c5bab32`, en `docs/canonical-legajo-to-be`. La custodia de esta afirmación se aporta al contrarrevisor mediante `INFORME_EVIDENCIA_CANONIZACION_G2_PARA_B00_2026-08-12.md` (SHA-256 `1a839a9defdfafe4df1d5d6b13890842e0a32f5ab8588b0e24f214cdc7ba73fe`) y `ACTA_DIR_008_CORRECCION_CUSTODIA_G1_Y_REAUTORIZACION_G2.md` (SHA-256 `b26fe34a1b4f0cb2cdce9d8650b1f49f60a55db5720a75f0cd51b20ad2a79301`).
- `BE-LEG-04 v0.4.1` y `BE-LEG-05 v0.14` están aprobados y canonizados. 05 permanece congelado como fuente comportamental vinculante.
- `03_Modelo_de_Negocio.md` está disponible como copia exacta del bundle G1 y fue reverificado con SHA-256 `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6`. Su numeración literal puede citarse en esta versión.
- Esta ronda produce únicamente artefactos locales de B-00 v0.2.1 y evidencia de revisión; **no ejecuta Git** y no consume autorización Git alguna.

#### 2.2.2. Insumos de la fusión

| Insumo | SHA-256 | Uso |
|---|---|---|
| `BE_LEG_06_B00_v0_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | e20b71cca6d78dcff3b1df919a7d4c7999e9634583ab1b9833e937f3b92de8dd | desarrollo principal; anexo verbatim y aportes D7/D8/D9 |
| `BE_LEG_06_B00_v0_1_C_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | 4cf218f0873615ec4b8db24a4483a38e61980a4554ece864282ee41d6dd909bf | base estructural de v0.2 |
| `BE_LEG_06_B00_ANALISIS_DE_DIVERGENCIAS_2026-08-10.md` | 10b0918b1ff43e4dcfe62fdbe11c8af248ab88a63f7cefa46e990d6595a640f1 | mapa D1–D12 |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8 | mapa y deuda `M-00` |
| `03_Modelo_de_Negocio.md` | f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6 | referencias canónicas reverificadas |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da | requisitos aprobados |
| `BE-LEG-05 v0.14 — Maestro` | 1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d | conducta observable aprobada |
| `ACTA_DIR_008_CORRECCION_CUSTODIA_G1_Y_REAUTORIZACION_G2.md` | b26fe34a1b4f0cb2cdce9d8650b1f49f60a55db5720a75f0cd51b20ad2a79301 | custodia/cierre atómico de G2 |
| `INFORME_EVIDENCIA_CANONIZACION_G2_PARA_B00_2026-08-12.md` | 1a839a9defdfafe4df1d5d6b13890842e0a32f5ab8588b0e24f214cdc7ba73fe | evidencia de commit, parent, rama, 18 SHA-256 y contraverificación remota |

#### 2.2.3. Referencias de 03 reverificadas

Sobre el archivo SHA-256 `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` se verificaron literalmente, entre otras, estas referencias relevantes para el 06:

- `03 §4 — Actores económicos y tratamiento de datos`;
- `03 §14 — Capacidad y asesorado activo`;
- `03 §15 — Cuenta del asesorado`;
- `03 §17 — Antropometría`;
- `03 §22 — Ingresos`;
- `03 §23 — Costos y sostenibilidad`.

La referencia histórica/pre-corrección `03 §9 = Capacidad` **no** se reintroduce: en el canon vigente, `§9 = Posicionamiento`.

### 2.3. Posición normativa y precedencia

Orden de precedencia aplicable al Documento 06, de mayor a menor autoridad:

1. Gobierno y canon G0/G1: `BE-LEG-00`, `BE-LEG-02`, `BE-LEG-03` aprobados.
2. `BE-LEG-04 v0.4.1` — requisitos aprobados.
3. `BE-LEG-05 v0.14` — conducta observable aprobada y fuente comportamental vinculante.
4. Decisiones de Dirección vigentes (`DEC-042`, `DEC-043`, `DEC-044`, `DEC-045` y posteriores aplicables).
5. Arquitectura `BE-LEG-06 v0.1.1` aprobada por `ACTA-DIR-007`.
6. B-00 una vez aprobado y, bajo sus reglas, B-01…B-13.

Ante conflicto entre niveles prevalece el superior y el conflicto se registra como hallazgo (`INV-06-10`). Ante conflicto dentro del mismo nivel, B-00 no elige silenciosamente una interpretación: registra el hallazgo y lo eleva a Dirección.

### 2.4. Régimen de herencia terminológica

El Documento 06 distingue tres regímenes normativos:

| Régimen | Significado | Facultad del 06 | Límite |
|---|---|---|---|
| `PROPIETARIO-06` | 04/05 difirieron al 06 una estructura, nombre técnico, máquina, relación, cálculo o taxonomía. | Fijar la estructura conceptual necesaria respetando la semántica funcional aprobada. | No alterar conducta aprobada ni invadir políticas de otro documento. |
| `REFERENCIADO` | La semántica funcional ya quedó suficientemente definida fuera del 06. | Usar el término tal cual y relacionarlo cuando sea necesario. | No redefinir, renombrar ni precisar de paso. |
| `DERIVADO` | Una dimensión específica tiene propietario posterior (07, 08, 09, 10, 11A/11B o 12). | Modelar solo la referencia estructural imprescindible. | No fijar política, mecanismo, valor, interfaz o evidencia reservada al propietario. |

Un término puede ser `PROPIETARIO-06` en su estructura y mantener dimensiones `DERIVADO`; del mismo modo, una conducta puede ser `REFERENCIADO` mientras la estructura resultante sea propietaria del 06. Por eso la verificación exigida es **cobertura completa 59/59 y ausencia de dimensiones huérfanas**, no una falsa exclusividad cuando el canon ya separa responsabilidades.

**Regla de alta:** todo término técnico recurrente nuevo —usado en dos o más bloques o en cualquier elemento normativo— debe incorporarse a §5.4 antes de propagarse. Un término usado una sola vez, en prosa explicativa y sin carga normativa, no requiere alta.

### 2.5. Glosario operativo del Documento 06

#### 2.5.1. Términos con estructura a fijar en 06 — `PROPIETARIO-06`

El campo «El 06 fija» expresa un **mandato de modelado** y no reemplaza la definición funcional de 05.

| ID | Término | El 06 fija | Área | Fuera del 06 |
|---|---|---|---|---|
| `T-06-01` | Identidad BE | Entidad persistente y sus relaciones con perfil y métodos de acceso, sin duplicación de identidad. | `M-01` | Credenciales y controles → 08/09. |
| `T-06-02` | Estado operativo de cuenta | Enum técnico y transiciones (el 05 lo dejó expresamente sin fijar). | `M-01` | Presentación → 10. |
| `T-06-03` | Método de acceso | Relación estructural método↔identidad; multiplicidad; no-paralelismo de identidades. | `M-01` | Mecanismos y verificación → 08/09. |
| `T-06-04` | Perfil (propio / profesional) | Estructura conceptual y su historia; relación con identidad. Uso consolidado en 04/05 sin fila propia en el glosario 05; se da de alta aquí sin alterar semántica. | `M-01` / `M-02` | — |
| `T-06-05` | Cierre de cuenta | Transición a cuenta cerrada/no operativa y efectos estructurales sobre sesiones, procesos y vínculos. La continuidad de la cuenta se mantiene coherente con 03 §15 — Cuenta del asesorado. | `M-01` / `M-04` | Retención y reversibilidad → 08. |
| `T-06-06` | Incidencia administrativa | Ciclo de vida técnico (el 05 lo derivó expresamente al 06); vínculo término↔unidad de matriz se completa al abrir el bloque del área conforme a §10.2. | `M-01` | Acceso y auditoría → 08. |
| `T-06-07` | Novedad interna | Estructura mínima de la entidad y su consulta. | `M-01` | Canal, entrega y presentación → 07/09/10. |
| `T-06-08` | Notificación push no sensible | Referencia estructural a la novedad que anuncia; contenido mínimo no sensible como invariante. | `M-01` | Proveedor y transporte → 07/09. |
| `T-06-09` | Especialidad | Relación identidad↔especialidad↔alcance y su máquina de verificación por alcance. | `M-02` | — |
| `T-06-10` | Capacidad antropométrica transversal | Relación independiente de las especialidades conforme a `DEC-044`; nunca tercera especialidad. | `M-02` / `M-09` | — |
| `T-06-11` | Verificación profesional | Máquina de estados por alcance cuyo conjunto de estados técnicos **incluye como mínimo** `PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `SUSPENDIDO` (`DEC-005` vía `DEC-042`). | `M-02` | Política de evidencia y su acceso → 08. |
| `T-06-12` | Observación / subsanación | Representación técnica (resultado, tarea o estado según defina M-02) y ciclo de nuevas presentaciones; equivalencia anti-duplicado de solicitudes. | `M-02` | — |
| `T-06-13` | Habilitación | Modelo separado de verificación y autorización; relación con capacidad. La separación comercial se conserva coherente con 03 §§11–14. | `M-02` / `M-05` | Política comercial real → plano comercial (03), fuera del MVP académico. |
| `T-06-14` | Capacidad configurada | Estructura de banda/límite, cómputo determinista, definición de proceso vigente/nuevo, comportamiento sin banda, pausas y períodos de gracia, versionado de cambios administrativos. El criterio de ocupación y límite debe preservar 03 §14 — Capacidad y asesorado activo. | `M-05` | — |
| `T-06-15` | Vínculo | Máquina de estados del vínculo (nombres técnicos definitivos) y relaciones con alcance y finalidad. | `M-03` | Lectura residual posterior → 08 (`Q-005`). |
| `T-06-16` | Solicitud de vínculo | Estructura, equivalencia anti-duplicado y caducidad técnica coordinada. | `M-03` | — |
| `T-06-17` | Consentimiento vigente | Estructura de versión, alcance y vigencia funcional; relación con vínculo y operaciones. | `M-03` | Granularidad/taxonomía (`Q-003`), retención (`Q-004`), textos y vigencias jurídicas → 08. |
| `T-06-18` | Revocación de consentimiento | Efectos estructurales: corte de operaciones futuras del alcance, preservación de evidencia e historia. | `M-03` | Plazo de propagación (SLA) → 08. |
| `T-06-19` | Autorización contextual | Insumos estructurales que la evaluación consulta (las siete dimensiones de `RF-021`) y las proyecciones autorizables. | `M-03` / `M-11` | Política de evaluación y registro de acceso → 08. |
| `T-06-20` | Versión | Patrón común: emisión, inmutabilidad posterior, sucesión e identificación de una versión concreta. | `M-06` | — |
| `T-06-21` | Instantánea reproducible (snapshot) | Estructura que permite reconstruir exactamente lo indicado al asesorado al activar. | `M-06` | — |
| `T-06-22` | Corrección trazable | Entidad/evento de corrección, cadena reconstruible, referencia a original y valor efectivo. | `M-06` | Política de auditoría → 08. |
| `T-06-23` | Procedencia | Estructura común (actor, fuente propia/externa, proveedor, fecha, contexto) reutilizable por todas las áreas. | `M-06` | — |
| `T-06-24` | Momento de ocurrencia / Momento de registro | Par obligatorio del patrón de eventos; ninguno sustituye al otro. | `M-06` / `M-11` | — |
| `T-06-25` | Proceso (operativo abierto / vigente / nuevo) | Semántica técnica común de proceso, coexistencia, continuidad y cierre; tratamiento de `Q-007`. | `M-04` | — |
| `T-06-26` | Activación de plan | Transición técnica borrador→versión activada y sus efectos (snapshot, consulta del asesorado, control de capacidad). | `M-04` / `M-07` / `M-08` | — |
| `T-06-27` | Objetivo vigente | Estructura versionada con responsable, vigencia y fundamento. | `M-07` / `M-08` | Contenido profesional concreto → criterio profesional (no se modela). |
| `T-06-28` | Plan profesional / Plan nutricional | Estructura versionada del plan y sus estados técnicos (nombres definitivos, p. ej. la semántica que el 05 llamó borrador y versión activada). | `M-07` (`M-08` para su homólogo) | Contenido prescriptivo → criterio profesional. |
| `T-06-29` | Borrador de plan · Versión activada | Estados técnicos del plan dentro de la máquina que fije el área, compatibles con la semántica 05. | `M-07` / `M-08` | — |
| `T-06-30` | Adherencia o ejecución registrada | Estructura del registro (fecha, versión, autor) sin fórmulas de puntuación. | `M-07` / `M-08` | Instrumentos de medición → 11A. |
| `T-06-31` | Catálogo propio · Importación controlada | Estructura de elementos, estado y procedencia; relación con proveedor externo. | `M-07` / `M-08` | Contratos y transporte → 09. |
| `T-06-32` | Bloque de entrenamiento · Prescripción de entrenamiento · Ejecución real | Estructuras y relaciones plan↔bloque↔sesión↔prescripción↔ejecución, con planificación y ejecución separadas. | `M-08` | Contenido concreto → criterio profesional. |
| `T-06-33` | Medición antropométrica directa · Protocolo identificado | Estructura del dato observado (protocolo identificado, autoría, fecha, unidad). | `M-09` | Protocolo concreto → criterio profesional. |
| `T-06-34` | Cálculo antropométrico derivado | Regla de cálculo con especificación versionada, dependencias de entrada por versión, recálculo sin sobrescritura. | `M-09` | — |
| `T-06-35` | Evolución antropométrica | Proyección longitudinal comparable con períodos, métodos y unidades identificables. | `M-09` / `M-11` | Presentación → 10. |
| `T-06-36` | Servicio antropométrico limitado · Ubicación utilizable | Estructura mínima de publicación y localización conforme al descubrimiento limitado. | `M-09` | Precisión/visibilidad → 08; proveedor cartográfico → 07; presentación → 10. |
| `T-06-37` | Revisión profesional válida | Estructura del evento (evidencia, dominio, período, interpretación no diagnóstica, resultado, fundamento, próxima acción o cierre, autoría, fecha). | `M-10` | — |
| `T-06-38` | Resultado semántico de revisión | Adopción de la taxonomía cerrada de seis tokens (§7.2 de este bloque) y su regla de especialización; ningún dominio crea valores paralelos. | `M-10` | — |
| `T-06-39` | Próxima acción | Estructura y vínculo obligatorio con resultado, fundamento, autoría y fecha. | `M-10` | — |
| `T-06-40` | Ciclo cerrado trazable | Evento/condición observable que alimenta la analítica; elegibilidad fina en frontera con 12. | `M-10` / `M-12` | Definición analítica canónica → 12. |
| `T-06-41` | Revisión pendiente | Derivación estructural desde M-10 proyectada como necesidad operativa, sin semántica clínica. | `M-11` | Presentación → 10. |
| `T-06-42` | Cartera profesional · Dashboard interdisciplinario · Línea temporal longitudinal · Progreso longitudinal propio | Proyecciones de dominio: fuentes declaradas, vista parcial autorizada, sin autoridad de escritura ni calificación agregada. | `M-11` | Presentación y filtros visuales → 10; política de acceso → 08. |
| `T-06-43` | Nota de coordinación autorizada | Entidad trazable (autor, destinatario, alcance, pertinencia) sin transferencia de responsabilidad. | `M-11` | — |
| `T-06-44` | TVCC-30 | Componentes computables: eventos consumidos, candidatos a numerador/denominador, exclusiones con motivo, estructura de resultados históricos y de versión de especificación. | `M-12` | Definición analítica canónica, fórmula y su versionado final → 12. |
| `T-06-45` | Alcance | Dimensiones estructurales necesarias para distinguir especialidad/capacidad y relacionar el alcance con solicitudes, resoluciones, vínculos, consentimientos, autorizaciones y procesos, sin cerrar la granularidad de datos o finalidad. | `M-02` / `M-03` | Granularidad/taxonomía de datos y finalidad, y política de consentimiento/autorización → 08. |
| `T-06-46` | Progresión de entrenamiento | Especialización técnica de la próxima acción posterior a una revisión válida dentro de Entrenamiento, mapeada a `AJUSTAR` o `SUSTITUIR` según conserve o genere una nueva versión; nunca constituye un resultado semántico adicional. | `M-08` / `M-10` | Decisión profesional concreta → criterio profesional; interacción/presentación → 10. |

**Nota de estabilidad de IDs:** `T-06-45 — Alcance` y `T-06-46 — Progresión de entrenamiento` se agregan al final durante la fusión sin renumerar `T-06-01…44` de v0.1-C. `T-06-46` no introduce semántica nueva: hace explícito un término heredado ya presente en las 59 definiciones y en la taxonomía aprobada.

#### 2.5.2. Términos/dimensiones de uso directo — `REFERENCIADO`

| Término o dimensión | Tratamiento |
|---|---|
| Asesorado | Actor; el 06 modela entidades y relaciones que lo involucran sin redefinir el término. |
| Finalidad | Atributo estructural; su política de ampliación pertenece a 08. |
| Revisión administrativa | Actividad cuyo resultado estructural modela `M-02`; siempre calificada. |
| Fallback manual | Conducta operativa del 05; el 06 solo modela el estado y la procedencia de los elementos del catálogo involucrados. |
| Recuperación de acceso · Recuperación asistida documentada | Conductas del 05; el 06 no les agrega estructura salvo referencias desde `M-01` si un bloque lo justifica. |
| Importación controlada (conducta) | La conducta es del 05; la estructura resultante está en `T-06-31`. |
| Verificado / semántica funcional de estados en mayúsculas del 05 | Semántica mínima aprobada; los nombres técnicos definitivos los fijan las máquinas de cada área respetándola (`CONV-06-02`, `INV-06-03`). |

#### 2.5.3. Dimensiones de propiedad ajena — `DERIVADO`

| Materia | Propietario | Lo único que 06 puede modelar |
|---|---|---|
| Granularidad/taxonomía del consentimiento (`Q-003`), retención (`Q-004`), lectura residual (`Q-005`), SLA de revocación, textos y vigencias jurídicas, política de auditoría y acceso a historiales | `08` | Referencias estructurales y efectos (p. ej., que exista versión y corte futuro), nunca la política ni sus valores. |
| Despliegue, proveedores, ambientes, canales de entrega, proveedor cartográfico | `07` | Nada: el 06 permanece agnóstico de infraestructura. |
| Contratos, codificación de errores, endpoints, formatos de transporte | `09` | Semántica de dominio que el contrato transportará. |
| Pantallas, navegación, copy, filtros visuales, denominación visual de estados | `10` | Proyecciones de dominio que la superficie consumirá. |
| Instrumentos de medición, evidencia operativa, datasets y corridas de prueba | `11A` / `11B` | Estructuras cuya verificabilidad esos documentos instrumentarán. |
| Definición analítica canónica de TVCC-30, su fórmula, versionado de especificación y evidencia reproducible | `12` | Componentes computables y eventos (`T-06-44`), sin cierre unilateral (`INV-06-09` y frontera `7.17-21`). |

#### 2.5.4. Constructos nuevos del 06

Son vocabulario de modelado, no entidades del negocio.

| ID | Constructo | Definición | Prohibidos como equivalentes |
|---|---|---|---|
| `T-06-N01` | Entidad de dominio | Concepto del negocio con identidad propia y ciclo de vida, modelado con nombre, relaciones e invariantes. | objeto de implementación, registro físico |
| `T-06-N02` | Relación | Asociación con nombre entre entidades, con multiplicidad y condiciones declaradas. | referencia de implementación |
| `T-06-N03` | Atributo conceptual | Propiedad de una entidad o relación relevante para el dominio, sin tipo físico. | campo, dato técnico de almacenamiento |
| `T-06-N04` | Identificador de dominio | Referencia estable y única —dentro de un ámbito declarado— que designa una entidad o versión; nunca se reutiliza tras retiro. | identificador físico, autonumérico |
| `T-06-N05` | Estado técnico | Token del conjunto cerrado de una máquina, escrito según `CONV-06-02`, que representa una situación estable del ciclo de vida. | estado visual, etiqueta de pantalla |
| `T-06-N06` | Transición | Cambio declarado entre dos estados técnicos, con actor habilitante, condiciones y efectos. | edición libre de estado |
| `T-06-N07` | Máquina de estados | Conjunto cerrado de estados técnicos más la lista blanca de transiciones de una entidad, declarada según `CONV-06-03`. | flujo de pantalla, diagrama informal |
| `T-06-N08` | Evento de dominio | Hecho ocurrido y registrado, inmutable, con ocurrencia, registro, autoría y procedencia. | notificación, log técnico |
| `T-06-N09` | Invariante de dominio | Regla que debe cumplirse siempre, expresada con condición de violación falsable. | recomendación, buena práctica |
| `T-06-N10` | Taxonomía cerrada | Conjunto finito y versionable de tokens con regla de especialización explícita; se extiende solo por decisión de dirección. | lista abierta, texto libre categorizado |
| `T-06-N11` | Especialización | Interpretación de dominio de un token existente que **no** crea un token nuevo (patrón `DEC-043`: progresar dentro de `AJUSTAR`/`SUSTITUIR`). | subcategoría paralela, token derivado |
| `T-06-N12` | Regla de cálculo | Función reproducible: entradas identificadas por versión + especificación versionada → resultado; recálculo produce resultado nuevo sin sobrescribir. | fórmula implícita, cálculo no versionado |
| `T-06-N13` | Proyección de dominio (read model) | Vista derivada de fuentes declaradas, sin autoridad de escritura y jamás fuente de verdad. | vista editable, resumen con efectos |
| `T-06-N14` | Criterio de unicidad | Declaración por entidad de qué la hace única, en qué ámbito y —si aplica— en qué ventana temporal. | unicidad presunta |
| `T-06-N15` | Criterio de equivalencia | Regla declarada que determina cuándo dos referencias designan lo mismo o cuándo dos valores son comparables. | igualdad por parecido, sinonimia |
| `T-06-N16` | Ámbito | Contexto declarado dentro del cual rige una unicidad, una equivalencia o una comparación (global, por identidad, por vínculo, por versión, por período). | contexto implícito |
| `T-06-N17` | Persistencia conceptual | Necesidad de conservar, identificar y reconstruir información del dominio a lo largo del tiempo sin comprometer una tecnología o diseño físico específico. | persistencia física, esquema de almacenamiento |
| `T-06-N18` | Autoría | Atribución del actor responsable de crear, registrar o decidir un hecho del dominio. Es distinta de Procedencia, que describe de dónde proviene el dato o elemento. | procedencia, origen técnico |
| `T-06-N19` | Fuente de verdad del dominio | Información o representación con autoridad semántica para reconstruir un hecho del dominio; las Proyecciones de dominio se derivan de ella y no la reemplazan. | proyección de dominio, tecnología concreta |

#### 2.5.5. Mapa de cobertura heredada 59/59

Este mapa hace auditable la cobertura del glosario heredado sin duplicar aquí sus definiciones. Las definiciones literales se conservan únicamente como **Anexo A de consulta no normativa**.

| # | Término heredado | Tratamiento en 06 | Referencia |
|---|---|---|---|
| 1 | Asesorado | REFERENCIADO | — |
| 2 | Identidad BE | PROPIETARIO-06 | T-06-01 |
| 3 | Especialidad | PROPIETARIO-06 | T-06-09 |
| 4 | Capacidad antropométrica transversal | PROPIETARIO-06 | T-06-10 |
| 5 | Verificación profesional | PROPIETARIO-06 | T-06-11 |
| 6 | Revisión administrativa | REFERENCIADO | — |
| 7 | Habilitación | PROPIETARIO-06 | T-06-13 |
| 8 | Vínculo | PROPIETARIO-06 | T-06-15 |
| 9 | Consentimiento vigente | PROPIETARIO-06 | T-06-17 |
| 10 | Autorización contextual | PROPIETARIO-06 | T-06-19 |
| 11 | Alcance | PROPIETARIO-06 | T-06-45 |
| 12 | Revisión profesional válida | PROPIETARIO-06 | T-06-37 |
| 13 | Activación de plan | PROPIETARIO-06 | T-06-26 |
| 14 | Versión | PROPIETARIO-06 | T-06-20 |
| 15 | Procedencia | PROPIETARIO-06 | T-06-23 |
| 16 | Finalidad | REFERENCIADO | — |
| 17 | Revocación de consentimiento | PROPIETARIO-06 | T-06-18 |
| 18 | Objetivo vigente | PROPIETARIO-06 | T-06-27 |
| 19 | Plan profesional | PROPIETARIO-06 | T-06-28 |
| 20 | Plan nutricional | PROPIETARIO-06 | T-06-28 |
| 21 | Borrador de plan | PROPIETARIO-06 | T-06-29 |
| 22 | Versión activada | PROPIETARIO-06 | T-06-29 |
| 23 | Instantánea reproducible | PROPIETARIO-06 | T-06-21 |
| 24 | Adherencia o ejecución registrada | PROPIETARIO-06 | T-06-30 |
| 25 | Catálogo propio | PROPIETARIO-06 | T-06-31 |
| 26 | Importación controlada | MIXTO: PROPIETARIO-06 (estructura) / REFERENCIADO (conducta) | T-06-31 |
| 27 | Fallback manual | REFERENCIADO | — |
| 28 | Resultado semántico de revisión | PROPIETARIO-06 | T-06-38 |
| 29 | Próxima acción | PROPIETARIO-06 | T-06-39 |
| 30 | Ciclo cerrado trazable | PROPIETARIO-06 | T-06-40 |
| 31 | Bloque de entrenamiento | PROPIETARIO-06 | T-06-32 |
| 32 | Prescripción de entrenamiento | PROPIETARIO-06 | T-06-32 |
| 33 | Ejecución real | PROPIETARIO-06 | T-06-32 |
| 34 | Corrección trazable | PROPIETARIO-06 | T-06-22 |
| 35 | Progresión de entrenamiento | PROPIETARIO-06 | T-06-46 |
| 36 | Medición antropométrica directa | PROPIETARIO-06 | T-06-33 |
| 37 | Cálculo antropométrico derivado | PROPIETARIO-06 | T-06-34 |
| 38 | Protocolo identificado | PROPIETARIO-06 | T-06-33 |
| 39 | Evolución antropométrica | PROPIETARIO-06 | T-06-35 |
| 40 | Servicio antropométrico limitado | PROPIETARIO-06 | T-06-36 |
| 41 | Ubicación utilizable | PROPIETARIO-06 | T-06-36 |
| 42 | Cartera profesional | PROPIETARIO-06 | T-06-42 |
| 43 | Revisión pendiente | PROPIETARIO-06 | T-06-41 |
| 44 | Dashboard interdisciplinario | PROPIETARIO-06 | T-06-42 |
| 45 | Línea temporal longitudinal | PROPIETARIO-06 | T-06-42 |
| 46 | Momento de ocurrencia | PROPIETARIO-06 | T-06-24 |
| 47 | Momento de registro | PROPIETARIO-06 | T-06-24 |
| 48 | Nota de coordinación autorizada | PROPIETARIO-06 | T-06-43 |
| 49 | Progreso longitudinal propio | PROPIETARIO-06 | T-06-42 |
| 50 | Estado operativo de cuenta | PROPIETARIO-06 | T-06-02 |
| 51 | Método de acceso | PROPIETARIO-06 | T-06-03 |
| 52 | Recuperación de acceso | REFERENCIADO | — |
| 53 | Recuperación asistida documentada | REFERENCIADO | — |
| 54 | Cierre de cuenta | PROPIETARIO-06 | T-06-05 |
| 55 | Incidencia administrativa | PROPIETARIO-06 | T-06-06 |
| 56 | Capacidad configurada | PROPIETARIO-06 | T-06-14 |
| 57 | Novedad interna | PROPIETARIO-06 | T-06-07 |
| 58 | Notificación push no sensible | PROPIETARIO-06 | T-06-08 |
| 59 | TVCC-30 | PROPIETARIO-06 | T-06-44 |

### 2.6. Convenciones de modelado

**`CONV-06-01` — Entidades y relaciones.** Toda entidad de dominio se nombra con sustantivo en singular, mayúscula inicial y sin prefijos/sufijos de implementación; toda relación declara nombre, participantes, multiplicidad y condiciones. *Verificación:* no existe entidad sin nombre conforme ni relación sin multiplicidad declarada.

**`CONV-06-02` — Estados técnicos.** Todo estado es un token en `MAYÚSCULAS_CON_GUION_BAJO`, único dentro de su máquina, sustantivo o participio. Los mínimos aprobados se adoptan textualmente cuando correspondan. Un estado técnico nunca duplica con otro nombre una semántica ya aprobada. *Verificación:* cada máquina lista su conjunto cerrado y no introduce sinónimos técnicos.

**`CONV-06-03` — Máquinas de estados.** Toda máquina declara: entidad propietaria; conjunto cerrado de estados; estado inicial; estados terminales; **lista blanca de transiciones** con actor habilitante, condiciones y efectos; eventos de dominio emitidos; e invariantes locales. **Toda transición no declarada está prohibida.** B-00 no instancia máquinas concretas.

**`CONV-06-04` — Transiciones.** Se nombran con verbo en infinitivo, declaran origen→destino y no pueden reescribir una versión emitida (`INV-06-04`) ni conceder facultades de otra dimensión separada (`INV-06-01`).

**`CONV-06-05` — Eventos de dominio.** Se nombran como hechos consumados y registran siempre momento de ocurrencia, momento de registro, autoría y procedencia. Si uno de los momentos es desconocido, **no se inventa ni se sustituye por el otro**. *Verificación:* ningún evento usa un único campo temporal como si fueran ambos conceptos.

**`CONV-06-06` — Invariantes.** Todo invariante se publica en par: enunciado afirmativo + condición de violación falsable («se viola cuando…»). Una aspiración sin detector de fallo no es un invariante.

**`CONV-06-07` — Taxonomías cerradas.** Toda taxonomía declara conjunto de tokens, regla de especialización, prohibición de valores paralelos y mecanismo de extensión. Una extensión exige decisión de Dirección y reconciliación documental.

**`CONV-06-08` — Versionado.** Toda entidad versionada declara qué acto emite una versión, qué queda inmutable tras emitirla, cómo se referencia una versión concreta y cómo se relacionan versiones sucesivas. El patrón común se instancia en `M-06` y las demás áreas lo reutilizan sin redefinirlo.

**`CONV-06-09` — Proyecciones.** Toda proyección declara sus fuentes de dominio, condición derivada, compatibilidad con vista parcial autorizada y ausencia de autoridad de escritura. Una proyección no introduce datos inexistentes en sus fuentes y no sustituye la Fuente de verdad del dominio.

**`CONV-06-10` — Identificadores documentales.** Elementos normativos del 06 usan esquemas estables: `T-06-*`, `CONV-06-*`, `INV-06-*`, `REG-06-*`, `PROH-06-*`. Un identificador retirado no se reutiliza.

### 2.7. Invariantes raíz

| ID | Invariante | Se viola cuando | Fuente |
|---|---|---|---|
| `INV-06-01` | Identidad ≠ perfil ≠ especialidad ≠ capacidad antropométrica ≠ verificación ≠ habilitación ≠ vínculo ≠ consentimiento ≠ autorización contextual. | Un elemento concede, implica o colapsa dos de estas dimensiones como si fueran una sola. | 03 §4; 04 RF-015; DEC-042; glosario 05. |
| `INV-06-02` | Antropometría es capacidad transversal, nunca tercera especialidad. | Una estructura la modela como especialidad o le concede ciclo de plan/revisión propio de especialidad. | 02 §6.5; 03 §17; DEC-044. |
| `INV-06-03` | Una resolución favorable de verificación no concede vínculo, consentimiento ni autorización. | Una transición de verificación crea o habilita por sí sola cualquiera de esos tres elementos. | 04 RF-015/RF-021; DEC-042; glosario 05. |
| `INV-06-04` | Ninguna activación o versionado reescribe silenciosamente una versión emitida. | Una operación modifica contenido emitido sin producir versión o corrección trazable. | 04 RNF-DAT-003, RF-031, RF-041. |
| `INV-06-05` | Medición antropométrica directa y cálculo derivado permanecen separados. | Un cálculo se registra como medición directa o una medición se hace depender semánticamente de un cálculo. | 04 RF-047, RF-048; 02 §11.6. |
| `INV-06-06` | Ninguna proyección es Fuente de verdad del dominio ni produce score global de salud. | Una proyección acepta autoridad de escritura sobre el hecho de origen o genera una calificación agregada del asesorado. | 04 RF-053; 02 §23/DEC-014. |
| `INV-06-07` | `Q-003`, `Q-004` y `Q-005` no se resuelven dentro de 06. | Un bloque fija granularidad de consentimiento, retención o lectura residual definitiva. | Nota de traspaso 05; propietario 08. |
| `INV-06-08` | `Q-007` recibe tratamiento explícito dentro de 06. | El Documento 06 cierra sin resolución trazable o estacionamiento fundado en las áreas asignadas. | Nota de traspaso 05; arquitectura §9.1.5. |
| `INV-06-09` | La taxonomía de revisión representa seis resultados consolidados sin categoría paralela para progresar o iniciar un nuevo bloque. | Aparece un séptimo token o una vertical utiliza un conjunto incompatible. | DEC-043; 04 RF-046; 05 v0.14. |
| `INV-06-10` | Toda tensión con 04/05 se registra como hallazgo; no se corrige por reinterpretación. | Un bloque adapta silenciosamente conducta aprobada para que cierre el modelo. | ACTA-DIR-007 §5.1.6; gobierno de traspaso 05. |

#### 2.7.1. Correspondencia con la numeración del desarrollo principal v0.1

La fusión conserva una equivalencia 1:1 de contenido entre los antiguos `I-00-01…10` y los identificadores estables `INV-06-01…10`. `I-00-*` queda como **alias histórico de procedencia**, no como segunda serie normativa.

| Alias histórico | ID vigente |
|---|---|
| `I-00-01` | `INV-06-01` |
| `I-00-02` | `INV-06-02` |
| `I-00-03` | `INV-06-03` |
| `I-00-04` | `INV-06-04` |
| `I-00-05` | `INV-06-05` |
| `I-00-06` | `INV-06-06` |
| `I-00-07` | `INV-06-07` |
| `I-00-08` | `INV-06-08` |
| `I-00-09` | `INV-06-09` |
| `I-00-10` | `INV-06-10` |

### 2.8. Reglas raíz de equivalencia, comparabilidad, unicidad y taxonomía

#### 2.8.1. Equivalencia, comparabilidad y unicidad (`7.1-11`)

**`REG-06-01` — Identidad a través del tiempo.** Dos referencias designan la misma entidad únicamente por identificador de dominio. Coincidencia de atributos no establece identidad.

**`REG-06-02` — Igualdad semántica de tokens.** Dos valores de taxonomía son iguales solo si son el mismo token del mismo conjunto. La sinonimia natural no crea igualdad técnica y una especialización no crea un token nuevo.

**`REG-06-03` — Comparabilidad por compatibilidad demostrable.** Dos mediciones o resultados son comparables cuando el área propietaria puede demostrar compatibilidad de las dimensiones relevantes para esa comparación —como significado, protocolo/método y versión, unidad, período y procedencia cuando correspondan— mediante una regla explícita y versionada. Compartir una especificación puede ser suficiente en un caso concreto, pero **no es la única vía posible**. Si la compatibilidad no puede justificarse, la comparación se declara limitada o no comparable; nunca se presume homogeneidad.

**`REG-06-04` — Comparabilidad temporal.** La comparación longitudinal utiliza el momento de ocurrencia. El momento de registro no lo sustituye. Una ocurrencia desconocida se conserva como desconocida y las proyecciones deben tratarla explícitamente.

**`REG-06-05` — Unicidad declarada.** Toda entidad que necesite unicidad declara criterio, ámbito y, si aplica, ventana temporal. La unicidad no exigida por el dominio no se inventa.

**`REG-06-06` — No reutilización de identificadores.** Un identificador de dominio o documental retirado permanece retirado; los huecos se documentan.

**`REG-06-07` — Homólogos entre verticales.** Conceptos homólogos de Nutrición y Entrenamiento comparten patrón estructural y taxonomías comunes cuando la semántica aprobada es común, sin fusionar dominios ni crear vocabularios paralelos.

**`REG-06-08` — Puente de separación (`EQ-02`).** Una equivalencia jamás fusiona Identidad BE, Especialidad, Capacidad antropométrica transversal, Verificación profesional, Habilitación, Vínculo, Consentimiento vigente ni Autorización contextual.

**`REG-06-09` — Puente de conversión (`CMP-02`).** Cuando una comparación cuantitativa requiera conversión, la conversión debe ser explícita y reproducible y **nunca puede ocultar la unidad de origen**.

**`REG-06-10` — Diferencia metodológica no equivale a incomparabilidad automática (D13).** Un cambio de protocolo, método, versión o unidad es una señal que obliga a evaluar compatibilidad; **no** determina por sí solo que dos observaciones sean incomparables. La regla concreta de compatibilidad, conversión, comparación limitada o no comparabilidad pertenece al área propietaria —especialmente `M-09` para `7.11-16/17`— y debe ser explícita, justificable y versionada. B-00 no inventa esa regla específica ni permite normalización silenciosa.

#### 2.8.2. Taxonomía canónica de resultados de revisión (`7.1-07`)

Conjunto cerrado, único para Nutrición y Entrenamiento:

`MANTENER` · `AJUSTAR` · `SUSTITUIR` · `REPROGRAMAR_REVISION` · `CAMBIAR_OBJETIVO` · `FINALIZAR`

Reglas: (a) «progresar» o «iniciar un nuevo bloque» se especializan dentro de `AJUSTAR` o `SUSTITUIR` según conserve o genere una nueva versión; no crean token; (b) la extensión del conjunto exige decisión de Dirección y reconciliación con 04/05; (c) los efectos técnicos finos de cada resultado pertenecen a `M-10`.

### 2.9. Prohibiciones raíz

**`PROH-06-01` — Persistencia física.** 06 no fija ORM, motor, tablas, columnas, claves, índices, esquemas físicos ni migraciones. «Persistencia» se usa exclusivamente como Persistencia conceptual.

**`PROH-06-02` — Semánticas vetadas heredadas.** Ningún bloque introduce score global de salud; semántica diagnóstica o de gravedad clínica; comparación del asesorado con terceros; antropometría como tercera especialidad; `PROGRESAR` como token; taxonomías paralelas por vertical; ni capacidades de marketplace excluidas por el alcance aprobado.

**`PROH-06-03` — Términos prohibidos del glosario 05.** Las prohibiciones terminológicas heredadas continúan vigentes en los elementos normativos del 06.

**`PROH-06-04` — Redefinición e invasión.** Ningún término/dimensión `REFERENCIADO` se redefine; ningún `PROPIETARIO-06` altera la semántica funcional aprobada; ninguna dimensión `DERIVADO` se resuelve localmente.

### 2.10. Resolución de las unidades de deuda `M-00`

| Unidad | Deuda de arquitectura | Resuelta en | Estado |
|---|---|---|---|
| `7.1-01` | entidades y relaciones de dominio | §5.4 (`T-06-N01…N03`) + `CONV-06-01` | `RESUELTA` como convención; instanciación posterior |
| `7.1-02` | estructura persistente conceptual | `T-06-N17`, `PROH-06-01`, `CONV-06-08`; patrón en `M-06` | `RESUELTA` como régimen; patrón común en B-06 |
| `7.1-03` | nombres técnicos definitivos de estados | `CONV-06-02` | `RESUELTA` como convención; estados concretos por área |
| `7.1-04` | máquinas de estados y transiciones | `CONV-06-03`, `CONV-06-04`, `T-06-N05…N07` | `RESUELTA` como declaración obligatoria; máquinas por área |
| `7.1-05` | invariantes | `CONV-06-06` + `INV-06-01…10` | `RESUELTA` |
| `7.1-07` | taxonomías técnicas | `CONV-06-07` + §8.2 | `RESUELTA` |
| `7.1-11` | equivalencia, comparabilidad y unicidad | §8.1 (`REG-06-01…10`) | `RESUELTA` como regla común; especialización por área |

Las unidades donde `M-00` figura solo como coordinación no se resuelven sustantivamente aquí. B-00 aporta la convención; la resolución pertenece al área primaria de la matriz.

### 2.11. Interfaz con B-01…B-13

#### 2.11.1. Obligaciones de apertura

Cada bloque declara antes de desarrollar contenido: (a) unidades de deuda que salda; (b) términos `PROPIETARIO-06` cuyo mandato ejecuta; (c) términos recurrentes nuevos, dados de alta previamente en §5.4; (d) máquinas que instancia con declaración completa `CONV-06-03`; y (e) fronteras `DERIVADO` que toca.

#### 2.11.2. Vínculo término ↔ unidad

Cuando un término `PROPIETARIO-06` no tenga aquí una unidad exacta asignada, el bloque de su área debe vincularlo al abrir. B-13 verifica que ningún término quede sin unidad cuando corresponda y ninguna unidad quede sin tratamiento.

#### 2.11.3. Obligaciones de cierre

Cada bloque demuestra: cero términos recurrentes fuera del glosario del 06; cero estados fuera de la convención; cero transiciones fuera de lista blanca; invariantes locales falsables; cero resolución de dimensiones `DERIVADO`; y autoverificaciones publicadas sobre el archivo real.

### 2.12. Anexo A — Definiciones heredadas de BE-LEG-05 (consulta no normativa)

**Carácter del anexo:** este cuadro **no crea una segunda fuente normativa**. Se conserva para lectura autosuficiente y trazabilidad D1. Las 59 definiciones fueron extraídas literalmente del cuadro heredado del desarrollo principal v0.1; la contrarrevisión independiente de divergencias confirmó allí `59/59 byte-idénticas` respecto del glosario 05 v0.1.8. El archivo fuente suelto de ese glosario no está montado en esta ronda, por lo que v0.2 no presenta un nuevo recálculo de su SHA-256; la autoridad semántica permanece en 05.

| # | Término canónico | Definición vigente heredada |
|---|---|---|
| 1 | **Asesorado** | Persona adulta titular de su cuenta e información, destinataria del proceso y usuaria de la APK. |
| 2 | **Identidad BE** | Identidad única y persistente, independiente de profesional, especialidad o paquete comercial, a la que pueden asociarse métodos de acceso. |
| 3 | **Especialidad** | Dominio profesional inicial de Nutrición o Entrenamiento, declarado y verificado de forma independiente. |
| 4 | **Capacidad antropométrica transversal** | Capacidad profesional separada de Nutrición y Entrenamiento, sujeta a evidencia, verificación, habilitación y autorización aplicables. |
| 5 | **Verificación profesional** | Procedimiento administrativo trazable que revisa evidencia por especialidad o capacidad. Una resolución favorable materializa la semántica `VERIFICADO`. No es certificación oficial ni garantía de competencia. |
| 6 | **Revisión administrativa** | Actividad del administrador que examina una versión presentada y resuelve la verificación de un alcance. |
| 7 | **Habilitación** | Condición académica o comercial separada de identidad, verificación, vínculo, consentimiento y autorización. |
| 8 | **Vínculo** | Relación explícitamente solicitada e individualmente aceptada entre profesional y asesorado para especialidad/capacidad y finalidad determinadas. |
| 9 | **Consentimiento vigente** | Manifestación informada, específica, versionada y revocable del asesorado para datos, dominios y finalidades aplicables. |
| 10 | **Autorización contextual** | Decisión aplicada a cada operación protegida considerando rol, especialidad/capacidad, estado, vínculo, consentimiento, finalidad y alcance vigentes. |
| 11 | **Alcance** | Especialidad, capacidad, conjunto de datos o finalidad concretos sobre los que se presenta, concede, restringe o revoca una facultad. |
| 12 | **Revisión profesional válida** | Evento explícito registrado por un profesional autorizado, vinculado a dominio, período y evidencia, con interpretación no diagnóstica, resultado, fundamento, próxima acción o cierre, autoría y fecha. |
| 13 | **Activación de plan** | Operación que convierte una versión validada de un plan en la versión vigente consultable y ejecutable por el asesorado. |
| 14 | **Versión** | Representación identificable de información presentada o emitida en un momento concreto, preservada frente a modificaciones posteriores. |
| 15 | **Procedencia** | Origen reconstruible de un dato o elemento: actor, fuente propia o externa, proveedor, fecha y contexto aplicable. |
| 16 | **Finalidad** | Motivo funcional específico para el que se propone un vínculo, se solicita consentimiento o se evalúa una operación. Debe ser comprensible y no ampliarse implícitamente. |
| 17 | **Revocación de consentimiento** | Decisión del asesorado que deja sin vigencia un consentimiento y debe cortar operaciones futuras dentro de su alcance, preservando evidencia e historia. |
| 18 | **Objetivo vigente** | Formulación profesional identificable, relacionada con una evaluación, con responsable, período o vigencia y fundamento, sin fijar en 05 su contenido de dominio. |
| 19 | **Plan profesional** | Instrumento versionado que organiza una intervención de Nutrición o Entrenamiento y que solo se vuelve consultable como vigente mediante activación. |
| 20 | **Plan nutricional** | Especialización del plan profesional para Nutrición, vinculada a evaluación y objetivo, cuyo contenido concreto pertenece al dominio y al criterio profesional. |
| 21 | **Borrador de plan** | Versión editable que puede guardarse y retomarse, pero no se presenta al asesorado como plan vigente. |
| 22 | **Versión activada** | Versión validada que se declara vigente y que el asesorado consulta y ejecuta hasta una continuidad trazable posterior. |
| 23 | **Instantánea reproducible** | Representación preservada de la versión activada que permite reconstruir exactamente qué se indicó al asesorado en ese momento. |
| 24 | **Adherencia o ejecución registrada** | Evidencia simple aportada por el asesorado sobre lo realizado respecto de un plan vigente, asociada a fecha, versión y autor, sin fijar fórmulas de puntuación. |
| 25 | **Catálogo propio** | Fuente operativa administrada por BE que permite planificar sin depender de un proveedor externo y conserva procedencia y estado. |
| 26 | **Importación controlada** | Incorporación revisada de un elemento externo al catálogo BE, con proveedor y fecha identificables, validación previa y posibilidad de corrección o rechazo. |
| 27 | **Fallback manual** | Continuidad operativa mediante catálogo propio o carga manual cuando un tercero no está disponible, sin declarar la integración exitosa ni bloquear el núcleo. |
| 28 | **Resultado semántico de revisión** | Decisión común de `DEC-043` expresada mediante `MANTENER`, `AJUSTAR`, `SUSTITUIR`, `REPROGRAMAR_REVISION`, `CAMBIAR_OBJETIVO` o `FINALIZAR`, sin crear taxonomías paralelas por dominio. |
| 29 | **Próxima acción** | Consecuencia explícita y trazable posterior a una revisión profesional válida: continuidad, cambio planificado, nueva revisión o cierre, vinculada al resultado, fundamento, autoría y fecha. |
| 30 | **Ciclo cerrado trazable** | Condición observable en la que existe una revisión profesional válida y una próxima acción o cierre registrados; permite alimentar TVCC-30 sin fijar en 05 su fórmula, elegibilidad o ventana. |
| 31 | **Bloque de entrenamiento** | Agrupación versionable de planificación dentro de un plan de entrenamiento, organizada para un propósito profesional y relacionada con sesiones, sin fijar en 05 duración, volumen o contenido concreto. |
| 32 | **Prescripción de entrenamiento** | Indicación profesional planificada dentro de una versión del plan, diferenciada de la ejecución real y cuyo contenido concreto pertenece al dominio y al criterio profesional. |
| 33 | **Ejecución real** | Evidencia registrada de lo que el asesorado efectivamente realizó respecto de una versión activada, diferenciada de lo planificado y asociada a autoría, fecha y contexto. |
| 34 | **Corrección trazable** | Rectificación posterior que conserva el registro original, identifica actor, fecha y motivo y permite reconstruir qué cambió sin sobrescritura silenciosa. |
| 35 | **Progresión de entrenamiento** | Próxima acción profesional posterior a una revisión válida que se expresa mediante `AJUSTAR` o `SUSTITUIR`, según conserve o genere una nueva versión; no constituye un resultado semántico adicional. |
| 36 | **Medición antropométrica directa** | Dato observado y registrado por un profesional autorizado mediante un protocolo identificado, asociado a autoría, fecha y unidad identificable; no es un cálculo ni una interpretación. |
| 37 | **Cálculo antropométrico derivado** | Resultado producido a partir de mediciones directas mediante un método y versión identificables, reproducible y claramente diferenciado de sus entradas. |
| 38 | **Protocolo identificado** | Referencia reconstruible al procedimiento utilizado para obtener mediciones; Documento 05 exige identificación, pero no fija el protocolo concreto. |
| 39 | **Evolución antropométrica** | Comparación longitudinal autorizada de mediciones directas y cálculos derivados, con períodos, métodos, unidades y limitaciones identificables, sin diagnóstico ni inferencia causal. |
| 40 | **Servicio antropométrico limitado** | Publicación habilitada de una prestación antropométrica con perfil, credenciales y ubicación utilizable, destinada únicamente al descubrimiento y a solicitar vínculo. |
| 41 | **Ubicación utilizable** | Información suficiente para representar o localizar el servicio según la política aplicable, sin fijar en 05 precisión, visibilidad pública ni proveedor técnico. |
| 42 | **Cartera profesional** | Vista operativa de asesorados, vínculos y acciones propias que permite identificar trabajo pendiente sin emitir una calificación agregada ni utilizar lenguaje diagnóstico. |
| 43 | **Revisión pendiente** | Necesidad operativa identificable de que un profesional autorizado examine evidencia y registre una revisión válida; su motivo debe expresarse sin diagnóstico ni inferir gravedad clínica. |
| 44 | **Dashboard interdisciplinario** | Síntesis profesional de información autorizada por dominio, finalidad y alcance, sin convertir autorizaciones parciales en acceso global ni producir una calificación agregada del asesorado. |
| 45 | **Línea temporal longitudinal** | Secuencia reconstruible de eventos autorizados que distingue cuándo ocurrió un hecho de cuándo fue registrado y conserva dominio, autoría y procedencia. |
| 46 | **Momento de ocurrencia** | Fecha y hora —o referencia temporal aplicable— en que el hecho representado sucedió en el dominio correspondiente. |
| 47 | **Momento de registro** | Fecha y hora en que BE recibió o persistió el evento, independiente del momento de ocurrencia. |
| 48 | **Nota de coordinación autorizada** | Comunicación trazable entre profesionales autorizados para aportar contexto pertinente sin prescribir, modificar, decidir ni asumir responsabilidad sobre el dominio ajeno. |
| 49 | **Progreso longitudinal propio** | Vista del asesorado sobre su propia información autorizada por dominio y período, con procedencia y límites visibles, sin autodiagnóstico ni comparación con terceros. |
| 50 | **Estado operativo de cuenta** | Condición funcional observable que determina si la identidad puede iniciar nuevas sesiones u operaciones, sin fijar en 05 el enum técnico. |
| 51 | **Método de acceso** | Mecanismo asociado a una identidad BE para demostrar acceso, local o federado, sin crear una identidad paralela. |
| 52 | **Recuperación de acceso** | Recorrido neutral de proveedor para restablecer un método utilizable sin presuponer correo ni crear una sesión antes de completar la verificación aplicable. |
| 53 | **Recuperación asistida documentada** | Contingencia operativa cuando la recuperación automática se difiere: soporte autorizado verifica la identidad mediante política posterior y registra el resultado sin restablecimiento silencioso. |
| 54 | **Cierre de cuenta** | Decisión trazable del titular que impide nuevas sesiones y operaciones, finaliza vínculos activos mediante eventos y conserva información según políticas posteriores; no equivale a borrado inmediato. |
| 55 | **Incidencia administrativa** | Registro trazable de una situación de soporte o gobierno con actor, fecha, alcance, seguimiento y resolución, limitado a información autorizada. |
| 56 | **Capacidad configurada** | Banda o límite administrativo aplicable a procesos nuevos, separado de identidad, verificación y autorización; no interrumpe procesos vigentes. |
| 57 | **Novedad interna** | Comunicación no clínica publicada dentro de BE para actores autorizados, consultable en un centro propio y separada de mensajes sensibles o coordinación profesional. |
| 58 | **Notificación push no sensible** | Aviso opcional y mínimo que informa la existencia de una novedad sin incluir datos de salud, contenido profesional protegido o información suficiente para inferirlos. |
| 59 | **TVCC-30** | Métrica académica reproducible calculada a partir de ciclos elegibles con revisión profesional válida y próxima acción o cierre; produce numerador, denominador, exclusiones y versión de regla auditables. No es retención, adherencia ni resultado de salud. |

### 2.13. Trazabilidad de la fusión D1–D13

| ID | Materia | Decisión vigente | Materialización |
|---|---|---|---|
| D1 | Herencia | Adoptado | Régimen formal en cuerpo + Anexo A no normativo con 59 definiciones literales. |
| D2 | Área por término | Adoptado | `PROPIETARIO-06` conserva mapeo `M-xx`; `Alcance` se agrega como `T-06-45`; la cobertura detecta y explicita `Progresión de entrenamiento` como `T-06-46` sin crear semántica nueva. |
| D3 | Matriz `M-00` | Adoptado | §10 traza 7/7 unidades `7.1-xx` de `M-00`. |
| D4 | Tokens de estado | Adoptado | `CONV-06-02`: mayúsculas + guion bajo + unicidad por máquina. |
| D5 | Máquinas / lista blanca | Adoptado | `CONV-06-03`: toda transición no declarada queda prohibida. |
| D6 | Ocurrencia ≠ registro | Adoptado | `CONV-06-05`: ambos momentos; el desconocido no se inventa. |
| D7 | Tres constructos | Adoptado | `T-06-N17` Persistencia conceptual; `N18` Autoría; `N19` Fuente de verdad del dominio. |
| D8 | Reglas puente | Adoptado | `EQ-02` → `REG-06-08`; `CMP-02` → `REG-06-09`. |
| D9 | Alcance | Adoptado | Estructura en 06 (`T-06-45`); granularidad/política permanece derivada a 08. |
| D10 | Protocolo entre bloques | Adoptado | §11 fija obligaciones de apertura, vínculo término↔unidad y cierre. |
| D11 | Precedencia normativa | Adoptado | §3 declara orden y regla de conflicto. |
| D12 | Citas al 03 | Adoptado y reverificado | 03 SHA-256 `f727de67…`; §§4, 14, 15, 17, 22 y 23 reverificados por título literal. |
| D13 | Comparabilidad | Adoptado | `REG-06-03` + `REG-06-10`: método/versión/unidad diferentes no implican incomparabilidad automática; exige compatibilidad demostrable del área propietaria. |

Además de D1–D13, v0.2 actualiza únicamente el **estado de custodia** posterior a la contrarrevisión: G2 ya está cerrado y 03 está materializado/reverificado. Esto no modifica semántica de producto ni reabre 04/05.

### 2.14. Autoverificación falsable de B-00 v0.2.1

Los controles siguientes se ejecutan sobre el archivo generado y sus fuentes reales. Un detector que falle bloquea la entrega y obliga a corregir el artefacto o la especificación del detector, registrando cuál de los dos era incorrecto.

**Registro de falsabilidad de la fusión:** la primera corrida del detector de cobertura 59/59 **falló** al identificar que `Progresión de entrenamiento` estaba en el anexo heredado pero no tenía fila explícita propia en la clasificación de v0.1-C. Se corrigió el artefacto agregando `T-06-46`; el detector no se relajó. La semántica se tomó literalmente del desarrollo principal v0.1 y del mapeo aprobado `AJUSTAR`/`SUSTITUIR`.

| # | Control | Método | Resultado | Evidencia |
|---|---|---|---|---|
| 1 | Fuentes con SHA esperado | script/inspección determinista | `OK` | 9/9 |
| 2 | Anexo A: 59 definiciones y 0 duplicados | script/inspección determinista | `OK` | 59/59 |
| 3 | Anexo A: definición literal respecto de v0.1 fuente | script/inspección determinista | `OK` | 59/59 |
| 4 | Cobertura heredada 59/59 | script/inspección determinista | `OK` | 59/59 |
| 5 | D9 Alcance propietario estructural | script/inspección determinista | `OK` | T-06-45 presente; removido de REFERENCIADO |
| 6 | CONV IDs secuenciales | script/inspección determinista | `OK` | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] |
| 7 | INV IDs secuenciales | script/inspección determinista | `OK` | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] |
| 8 | REG IDs secuenciales | script/inspección determinista | `OK` | [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] |
| 9 | PROH IDs secuenciales | script/inspección determinista | `OK` | [1, 2, 3, 4] |
| 10 | Constructos T-06-N01…N19 | script/inspección determinista | `OK` | 19/19 |
| 11 | Invariantes 10/10 con condición de violación | script/inspección determinista | `OK` | 10/10 |
| 12 | M-00 7/7 unidades | script/inspección determinista | `OK` | 7.1-01, 7.1-02, 7.1-03, 7.1-04, 7.1-05, 7.1-07, 7.1-11 |
| 13 | Fusión D1–D13 | script/inspección determinista | `OK` | 13/13 |
| 14 | Taxonomía de revisión exacta | script/inspección determinista | `OK` | 6 tokens |
| 15 | D13: diferencia metodológica no automática | script/inspección determinista | `OK` | REG-06-03 + REG-06-10 |
| 16 | 03: secciones citadas reverificadas | script/inspección determinista | `OK` | §§4,14,15,17,22,23 |
| 17 | Estado G2 y Git de ronda | script/inspección determinista | `OK` | OK |
| 18 | Jerarquía Markdown | script/inspección determinista | `OK` | H1=1, max=H3 |
| 19 | Fences balanceados | script/inspección determinista | `OK` | 2 delimitadores |
| 20 | Léxico documental accidental en §5 (`columna` / `índice`) | búsqueda determinista limitada a §5 | `OK` | 0 ocurrencias |

### 2.15. Estado de salida

```text
B-00 — CONTROL TERMINOLÓGICO Y REGLAS RAÍZ
VERSIÓN: v0.2.1
ESTADO: BORRADOR CORREGIDO POST-CONTRARREVISIÓN — PARA APROBACIÓN DE DIRECCIÓN

G2: CERRADO — EVIDENCIA DE CUSTODIA APORTADA AL CONTRARREVISOR
COMMIT DE CIERRE: 2e12bbe95aa6237eec0a31297f23f2a94fe2c9f2
PARENT: 13224caa93b9c6cc8cc748f1035b385d7c5bab32
ACTA-DIR-008 SHA-256: b26fe34a1b4f0cb2cdce9d8650b1f49f60a55db5720a75f0cd51b20ad2a79301
INFORME DE EVIDENCIA SHA-256: 1a839a9defdfafe4df1d5d6b13890842e0a32f5ab8588b0e24f214cdc7ba73fe
03_MODELO_DE_NEGOCIO: MATERIALIZADO Y REVERIFICADO

HERENCIA: 59/59 CUBIERTA
ANEXO LITERAL: 59/59
CONSTRUCTOS DEL 06: 19
INVARIANTES RAÍZ: 10/10
UNIDADES M-00: 7/7
DIVERGENCIAS D1–D13: 13/13 MATERIALIZADAS

Q-003 / Q-004 / Q-005: NO RESUELTAS — PROPIETARIO 08
Q-007: PENDIENTE DE TRATAMIENTO POSTERIOR EN 06
TVCC-30: FRONTERA 06/12 PRESERVADA

GIT DE ESTA RONDA: SIN CAMBIOS
SIGUIENTE ACCIÓN: VERIFICAR DOSSIER DE CUSTODIA → APROBACIÓN DE DIRECCIÓN DE B-00
```


---


## 3. Arquitectura del modelo de dominio

*Fuente ensamblada: `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` · SHA-256 `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8`.*


### 3.1. Control de estado y autorización de esta ronda

Esta arquitectura se produce como **trabajo preparatorio expresamente autorizado por dirección** mientras permanecen pendientes los dos actos de cierre de G2:

- `P-01`: aprobación formal de `BE-LEG-05 v0.14`;
- `P-02`: canonización conjunta de `BE-LEG-04 v0.4.1` y `BE-LEG-05 v0.14` en un mismo commit, con autorización Git separada.

La existencia de este archivo **no ejecuta, presume ni sustituye** P-01 o P-02. `BE-LEG-05 v0.14` se toma como fuente comportamental congelada; cualquier cambio posterior sobre 05 requeriría versión nueva, changelog y contrarrevisión.

La acción de custodia §2.3 de la nota de traspaso se considera cumplida por su complemento de hashes. Esta condición documental habilita el uso verificable de los valores allí registrados, pero no equivale a canonización de G2.

### 3.2. Objeto de la arquitectura

El objetivo de `v0.1.1` sigue siendo **impedir que el Documento 06 nazca como una lista improvisada de entidades**. Primero se fija el mapa de propiedad: qué área del modelo debe resolver cada deuda derivada por 05, en qué orden se redactará y cómo se sabrá que cada bloque está cerrado.

Esta versión no decide todavía la forma interna definitiva de entidades, agregados, atributos, enums ni transiciones. Los códigos `M-00…M-12` son **identificadores locales de arquitectura**, no nombres canónicos de entidades ni términos de dominio.

### 3.3. Fuentes leídas y cadena de custodia aplicable

| Artefacto | Uso en esta arquitectura | Custodia / verificación aplicable |
|---|---|---|
| `BE_LEG_05_NOTA_DE_TRASPASO_2026-08-06.md` | Nota de traspaso; §7 es inventario primario de DERIVAR 06. | SHA-256 declarado y corroborado por el complemento: 247e37af0c5207b7b913f123e071da2638b6ae823b303990382f97df5f4a7e24 |
| `BE_LEG_05_NOTA_TRASPASO_COMPLEMENTO_HASHES_2026-08-06.md` | Complemento de custodia; cierra la acción §2.3. | SHA-256 calculado sobre el archivo montado en esta sesión: cc68e2667861762ce63db30ea905e9d9c07abac03d7fe3d6dc605be77fa8fb21 |
| `BE_G1_Canonizacion_Local_v1_0.zip` | Bundle canónico G1 que contiene el canon de 00/02/03. | SHA-256 documentado por el complemento: cb374ab27e2b2c636455653aef1d2e06b3c85acdbd6465d6ad968c231ae3d08f |
| `00_Gobierno_del_Legajo.md / 02_Vision_Alcance_y_Plan_Estrategico.md` | Canon G1; fuente de gobierno, visión, alcance y límites. | Sin nueva declaración de hash individual ni verificación de HEAD en esta corrección. |
| `03_Modelo_de_Negocio.md` | Fuente canónica de negocio para referencias sobre capacidad, cuenta, posicionamiento, ingresos y costos. | **Prueba falsable v0.1.1:** no se encontró una copia suelta legible en los archivos del proyecto recuperables ni en `/mnt/data`; por tanto, el canon no está montado en forma legible para recalcular localmente su SHA-256. Dirección debe reponerlo si se requiere reverificación local. La numeración vigente usada en H-06-ARQ-01 procede de la contrarrevisión externa de v0.1 aportada por dirección, que informa SHA-256 individual `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` dentro del bundle G1 conforme a su `MANIFEST.sha256`. |
| `Contrarrevisión externa de BE-LEG-06 v0.1 — 2026-08-09` | Fuente de las dos correcciones obligatorias de esta versión y de la numeración canónica de `03_Modelo_de_Negocio.md` usada en H-06-ARQ-01. | Procedencia aportada por dirección en esta sesión: bundle G1 SHA-256 `cb374ab27e2b2c636455653aef1d2e06b3c85acdbd6465d6ad968c231ae3d08f`; `03_Modelo_de_Negocio.md` SHA-256 `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6`. Estos valores **no fueron recalculados localmente** en esta corrección. |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | Fuente aprobada de requisitos. | SHA-256 documentado por el complemento: c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | Fuente comportamental congelada; contrarrevisión conforme; aprobación formal P-01 pendiente. | SHA-256: 1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d |
| `DEC_042_Alta_Profesional_APROBADA_PROVISIONALMENTE_v0.4.md` | Alta profesional escalonada; estados mínimos y capacidad antropométrica transversal. | SHA-256 documentado por el complemento: 44a42e8113c478551971ad411d8f9dd6cd3ca755d92df2e07d23cc06d2a949b6 |
| `DEC_043_Revision_Profesional_VALIDA_APROBADA_PROVISIONALMENTE_v0.4.md` | Revisión profesional válida y semántica común. | SHA-256 documentado por el complemento: ea54a1e1ae98c6f6c4516fb79521e65699484067c63134ee22b6749b9f99d842 |
| `DEC_044_OPERACION_ANTROPOMETRICA_INDEPENDIENTE.md` | Antropometría como capacidad transversal operable de forma independiente. | SHA-256 según nota/manifiesto de sesión: 3ac9a38a912c6dddfa2be97ec0ea6821097457dfff157ea57b11fb5453e13caf |
| `DEC_045_RECLASIFICACION_REGLAS_TR.md` | TR-01…TR-05 son reglas transversales, no casos de uso. | SHA-256 según nota/manifiesto maestro: 04e693103cde0e2f6b804d04fa4088b87ad4207920af896b95f4acd4bca21396 |

**Regla aplicada:** cuando esta sesión no recalculó un hash individual o no verificó un HEAD, el archivo no lo presenta como nueva verificación. Se conserva la procedencia exacta documentada por los artefactos de custodia.

### 3.4. Límites de propiedad del Documento 06

#### 3.4.1. Incluido en 06

- entidades, relaciones y atributos conceptuales suficientes para el dominio;
- nombres técnicos, estados, transiciones e invariantes donde 06 sea propietario;
- estructuras de versiones, snapshots y correcciones;
- coexistencia, continuidad y cierre de procesos;
- capacidad configurada, cómputo, pausas, gracia y regla sin banda;
- fórmulas y dependencias antropométricas reproducibles;
- proyecciones/read models de dominio;
- taxonomía técnica común de DEC-043 y sus especializaciones;
- componentes computables, elegibilidad y eventos de TVCC-30 en frontera coordinada con 12;
- resolución o estacionamiento fundado de `Q-007`.

#### 3.4.2. Derivado fuera de 06

| Materia | Propietario | Regla de frontera |
|---|---|---|
| Retención, granularidad de consentimiento, vigencias jurídicas, lectura residual y SLA asociados a `Q-003`, `Q-004`, `Q-005` | `08` | 06 solo conserva referencias y efectos estructurales necesarios; no fija política. |
| Despliegue, proveedores, ambientes, infraestructura | `07` | 06 permanece agnóstico de tecnología. |
| Contratos, códigos, endpoints y formatos de transporte | `09` | 06 define semántica, no transporte. |
| Pantallas, navegación, copy e interacción | `10` | 06 no convierte read models en UI. |
| Instrumentos de medición, evidencia operativa y pruebas | `11A/11B` | 06 define estructura y reproducibilidad; 11 valida/operacionaliza. |
| Matriz de trazabilidad final y definición analítica canónica/versionada de TVCC-30 | `12` | 06 expone componentes y eventos; 12 cierra la especificación analítica y su evidencia. |

**Prohibición explícita:** este documento no fija ORM, motor de base de datos, tablas, columnas, claves, índices ni esquema físico. “Persistencia” se usa solo en el sentido **conceptual de conservación y reconstrucción del dominio**.

### 3.5. Invariantes de coherencia que gobiernan toda la redacción futura

1. `Identidad BE ≠ perfil ≠ especialidad ≠ capacidad antropométrica transversal ≠ verificación ≠ habilitación ≠ vínculo ≠ consentimiento ≠ autorización contextual`.
2. Antropometría permanece como **capacidad transversal**, nunca como tercera especialidad.
3. Una resolución favorable de verificación no concede por sí sola vínculo, consentimiento ni autorización.
4. La activación/versionado no puede reescribir silenciosamente una versión ya emitida.
5. Medición antropométrica directa y cálculo derivado permanecen separados.
6. Una vista/read model no se convierte en fuente de verdad del dominio ni en un score global de salud.
7. `Q-003`, `Q-004` y `Q-005` no se resolverán dentro de 06.
8. `Q-007` sí debe recibir tratamiento explícito dentro de 06.
9. La taxonomía técnica de revisión debe representar los seis resultados comunes ya consolidados por 05 sin crear una categoría paralela para “progresar” o “iniciar un nuevo bloque”.
10. Toda tensión con 04/05 se registra como hallazgo para dirección; no se corrige mediante reinterpretación silenciosa.

### 3.6. Inventario de áreas del modelo

| Área | Nombre de trabajo | Responsabilidad |
|---|---|---|
| `M-00` | **Gobierno semántico y patrones comunes del dominio** | Custodia del vocabulario de 05, separación conceptual, convenciones de estados/transiciones/invariantes y reglas comunes de equivalencia sin fijar persistencia física. |
| `M-01` | **Identidad, perfil y ciclo de cuenta** | Identidad BE persistente, perfil propio, métodos de acceso como referencias separadas y efectos estructurales del ciclo de cuenta. |
| `M-02` | **Perfil profesional, especialidades, capacidad antropométrica transversal, verificación y habilitación** | Alta profesional y gobierno estructural de especialidades/capacidad transversal, solicitudes, evidencia versionada, resoluciones y habilitación sin colapsar conceptos. |
| `M-03` | **Vínculo profesional–asesorado, alcances y referencias estructurales de consentimiento/autorización** | Solicitud, aceptación, pausa/finalización, alcances, invitaciones y referencias de consentimiento/autorización necesarias para sostener la conducta aprobada. |
| `M-04` | **Ciclo funcional, coexistencia de procesos, continuidad y cierre** | Estado funcional común de procesos, coexistencia, efectos por cambios de vínculo/consentimiento/habilitación y tratamiento formal de Q-007. |
| `M-05` | **Capacidad configurada y admisión de procesos nuevos** | Configuración versionada de capacidad, bandas/límites, cómputo, clasificación de proceso nuevo/vigente, pausas/períodos de gracia y comportamiento sin banda configurada. |
| `M-06` | **Versionado, snapshots, correcciones e historia común** | Patrones comunes de versiones, instantáneas reproducibles, cadena de correcciones, original/efectivo, sucesión e invariantes contra sobrescritura silenciosa. |
| `M-07` | **Nutrición** | Evaluación, objetivo, catálogo, plan, activación, ejecución/adherencia y continuidad específica de Nutrición, reutilizando patrones comunes. |
| `M-08` | **Entrenamiento** | Evaluación, objetivo, catálogo, plan, bloques, sesiones, prescripción, ejecución real, progresión y corrección de Entrenamiento. |
| `M-09` | **Antropometría transversal y publicación limitada** | Evaluación antropométrica, mediciones, cálculos derivados, métodos/protocolos/unidades, dependencias, comparabilidad, corrección, evolución y publicación/descubrimiento limitado. |
| `M-10` | **Revisión profesional válida, taxonomía común y pendientes** | Representación técnica de DEC-043, seis resultados semánticos, próxima acción/cierre, efectos de continuidad y reglas de pendientes operativos no clínicos. |
| `M-11` | **Cartera, timeline y proyecciones longitudinales** | Read models por dominio, cartera, dashboard interdisciplinario, timeline, vista parcial autorizada y progreso longitudinal sin score global. |
| `M-12` | **TVCC-30 — componentes computables e interfaz con Documento 12** | Modelo de ciclos candidatos, elegibilidad técnica, eventos productores, componentes computables, resultados históricos y frontera explícita con la definición analítica canónica del Documento 12. |

Los límites entre áreas son deliberados: una misma conducta puede requerir coordinación, pero cada deuda del inventario tiene **un propietario primario único** en la matriz de cobertura.

### 3.7. Dependencias entre áreas

| Área dependiente | Depende de | Motivo |
|---|---|---|
| `M-01` | `M-00` | usa separaciones y convenciones comunes |
| `M-02` | `M-00, M-06` | estados/verificación y evidencia versionada |
| `M-03` | `M-01, M-02, M-00` | vínculo requiere identidades y alcances profesionales diferenciados |
| `M-04` | `M-03, M-02` | coexistencia y cierre responden a cambios de vínculo/habilitación |
| `M-05` | `M-04, M-02` | capacidad clasifica procesos nuevos/vigentes y habilitaciones aplicables |
| `M-06` | `M-00` | provee patrón común de historia/versionado/corrección |
| `M-07` | `M-03, M-04, M-05, M-06` | Nutrición reutiliza autorización estructural, ciclo, capacidad y versiones |
| `M-08` | `M-03, M-04, M-05, M-06` | Entrenamiento reutiliza los mismos patrones |
| `M-10` | `M-04, M-06, M-07, M-08` | la revisión actúa sobre evidencia y continuidad de ambas verticales |
| `M-09` | `M-02, M-03, M-06` | Antropometría depende de capacidad transversal, autorización estructural e historia, pero no de un plan |
| `M-11` | `M-06, M-07, M-08, M-09, M-10` | las proyecciones se derivan de fuentes ya definidas |
| `M-12` | `M-04, M-10, M-11` | TVCC-30 consume ciclos/revisiones/eventos y publica componentes reproducibles para 12 |

### 3.8. Orden propuesto de bloques de BE-LEG-06

| Orden | Bloque | Área(s) | Justificación |
|---:|---|---|---|
| 1 | `B-00` — **Control terminológico y reglas raíz** | `M-00` | Primero: ningún término técnico recurrente nuevo se propaga antes de entrar al glosario del 06; fija convenciones de modelado y separaciones conceptuales sin listar entidades exhaustivas. |
| 2 | `B-06` — **Versionado, snapshots, correcciones e historia común** | `M-06` | Se adelanta inmediatamente después de B-00 porque depende solo de M-00 y provee el patrón común de evidencia versionada, snapshots, correcciones e historia que reutilizan las demás áreas. |
| 3 | `B-01` — **Identidad, perfil y ciclo de cuenta** | `M-01` | Base longitudinal común; evita que perfiles, métodos de acceso o estados operativos dupliquen la identidad. |
| 4 | `B-02` — **Perfil profesional, especialidades, capacidad transversal, verificación y habilitación** | `M-02` | Se redacta después de B-06 para que la evidencia versionada reutilice el patrón común ya definido; precede a vínculo y operación porque determina alcances profesionales válidos y la máquina de verificación mínima exigida por DEC-005/DEC-042. |
| 5 | `B-03` — **Vínculo, alcances y referencias estructurales de consentimiento/autorización** | `M-03` | Preserva aceptación explícita y la separación vínculo ≠ consentimiento ≠ autorización antes de modelar procesos profesionales. |
| 6 | `B-04` — **Ciclo funcional, coexistencia, continuidad y Q-007** | `M-04` | Fija el marco de procesos abiertos/vigentes y el significado técnico del cierre antes de especializar Nutrición/Entrenamiento. |
| 7 | `B-05` — **Capacidad configurada y admisión de procesos nuevos** | `M-05` | Debe resolverse antes de activaciones: cómputo, proceso nuevo/vigente, no-banda, pausas y gracia condicionan activación pero no interrumpen procesos existentes. |
| 8 | `B-07` — **Nutrición** | `M-07` | Primera vertical trazadora; aplica los patrones comunes a evaluación → objetivo → plan → activación → ejecución. |
| 9 | `B-08` — **Entrenamiento** | `M-08` | Reutiliza patrón común y agrega bloques/sesiones/prescripción/ejecución sin taxonomía paralela. |
| 10 | `B-09` — **Revisión profesional válida, taxonomía común y pendientes** | `M-10` | Con las dos verticales ya modeladas, fija la taxonomía técnica de DEC-043, sus especializaciones y la próxima acción/cierre sin crear un séptimo resultado. |
| 11 | `B-10` — **Antropometría transversal y publicación limitada** | `M-09` | Se modela como capacidad transversal independiente, sin ciclo de plan ni tercera especialidad; incorpora cálculo reproducible, corrección y comparabilidad. |
| 12 | `B-11` — **Cartera, timeline y proyecciones longitudinales** | `M-11` | Se construye sobre fuentes de dominio ya definidas; evita que un read model se convierta en fuente de verdad o score clínico. |
| 13 | `B-12` — **TVCC-30 — componentes de dominio e interfaz con Documento 12** | `M-12` | Último bloque sustantivo: consume eventos/ciclos ya definidos y deja formalizada la frontera con la definición analítica canónica de 12. |
| 14 | `B-13` — **Cierre global del Documento 06** | `M-00…M-12` | Audita cobertura DERIVAR 06, coherencia con 04/05, términos, Q-007, fronteras 07/08/09/10/11A/11B/12 y hallazgos; no introduce producto nuevo. |

**Gate de redacción:** la contrarrevisión externa de `v0.1` ya fue recibida y sus dos correcciones obligatorias se incorporan en esta `v0.1.1`. `B-00` y todo bloque sustantivo permanecen bloqueados hasta la **aprobación explícita de dirección de esta arquitectura corregida**. Esa aprobación tampoco ejecuta P-01/P-02 ni autoriza Git.

### 3.9. Criterios de cierre por área

| Área | Criterio de cierre mínimo |
|---|---|
| `M-00` | Separaciones conceptuales y convenciones de estado/transición/invariante quedan declaradas; cualquier término recurrente nuevo está incorporado antes al glosario; cero tecnología física de persistencia. |
| `M-01` | Identidad, perfil, métodos de acceso y ciclo de cuenta quedan diferenciados; cierre de cuenta conserva historia y coordina efectos con 08 sin decidir retención. |
| `M-02` | Especialidad, capacidad antropométrica, verificación, habilitación y autorización permanecen separadas; se cubre el mínimo PENDIENTE/VERIFICADO/RECHAZADO/SUSPENDIDO y la independencia por alcance. |
| `M-03` | Solicitud/vínculo, alcances, invitación y referencias de consentimiento/autorización quedan modelables sin acceso implícito; lectura residual sigue en 08. |
| `M-04` | Existe una semántica técnica coherente para proceso vigente, continuidad y cierre; cambios de vínculo/consentimiento/habilitación no producen efectos silenciosos; Q-007 queda resuelta o estacionada formalmente. |
| `M-05` | Cómputo y admisión de procesos nuevos son deterministas; se define no-banda, pausas y gracia; exceder capacidad no interrumpe vigentes, no revoca vínculos ni borra datos. |
| `M-06` | Toda versión/corrección/snapshot es reconstruible; original e histórico no se sobrescriben; las verticales pueden reutilizar un patrón común sin acoplarlo a tablas físicas. |
| `M-07` | Nutrición cubre evaluación, objetivo, catálogo, plan, activación, ejecución y continuidad sin fijar contenido profesional prescriptivo no aprobado. |
| `M-08` | Entrenamiento cubre evaluación, objetivo, bloques/sesiones/prescripción/ejecución/progresión y corrección; planificación y ejecución real permanecen separadas. |
| `M-09` | Antropometría separa medición directa/cálculo derivado; métodos, versiones, unidades, dependencias y recálculos son reconstruibles; comparabilidad se explicita; publicación sigue limitada y transversal. |
| `M-10` | DEC-043 queda expresado por una taxonomía técnica común de seis resultados con efectos trazables; revisión válida y próxima acción/cierre sostienen pendientes sin semántica clínica. |
| `M-11` | Read models derivan de fuentes de dominio, conservan ocurrencia/registro/autoría/procedencia, soportan vistas parciales y no producen score global ni autoridad de escritura. |
| `M-12` | Se pueden identificar ciclos candidatos, inclusión/exclusión, numerador/denominador y resultados históricos sin redefinir unilateralmente la fórmula; la frontera y versionado compartido con 12 quedan documentados. |

#### 3.9.1. Criterio de cierre global del Documento 06

El Documento 06 solo podrá considerarse apto para aprobación cuando, como mínimo:

1. todas las unidades de deuda de la matriz `DERIVAR 06 → área` estén resueltas o explícitamente estacionadas con propietario/gate;
2. no exista ningún concepto recurrente nuevo propagado fuera del glosario;
3. las máquinas de estados definitivas respeten la conducta aprobada en 04/05 y los mínimos de DEC-005;
4. la taxonomía de DEC-043 sea única y compatible entre Nutrición y Entrenamiento;
5. `Q-007` esté resuelta mediante decisión trazable o estacionada formalmente con fundamento suficiente;
6. las reglas de capacidad sean deterministas incluso sin banda configurada y contemplen pausas/períodos de gracia;
7. las dependencias antropométricas permitan reconstrucción, recálculo y comparación sin sobrescritura histórica;
8. las proyecciones longitudinales no alteren la fuente de verdad ni creen score clínico/global;
9. TVCC-30 tenga una frontera 06/12 explícita y reproducible, sin cierre unilateral de la definición analítica;
10. no se haya invadido 07/08/09/10/11A/11B/12;
11. una contrarrevisión adversarial externa sobre los archivos reales resulte conforme o sus hallazgos sean tratados;
12. dirección apruebe el documento según el gobierno vigente.

### 3.10. Matriz completa `DERIVAR 06 → área de BE-LEG-06`

Convención: el ID de la primera columna es **local a esta arquitectura** y referencia la posición de la deuda en la §7 de la nota. No crea un nuevo identificador canónico de dominio.

| ID fuente | Deuda a saldar en 06 | Área primaria | Coordinación / frontera | Nota de control |
|---|---|---|---|---|
| `7.1-01` | entidades y relaciones de dominio | `M-00` | M-01…M-12 | — |
| `7.1-02` | estructura persistente conceptual | `M-00` | M-01…M-12 | — |
| `7.1-03` | nombres técnicos definitivos de estados | `M-00` | área propietaria de cada máquina | — |
| `7.1-04` | máquinas de estados y transiciones | `M-00` | M-01…M-10 según objeto | — |
| `7.1-05` | invariantes | `M-00` | todas las áreas | — |
| `7.1-06` | versionado estructural | `M-06` | áreas verticales | — |
| `7.1-07` | taxonomías técnicas | `M-00` | M-02 / M-10 | — |
| `7.1-08` | fórmulas de dominio | `M-09` | M-12 cuando corresponda a TVCC-30 | — |
| `7.1-09` | dependencias entre cálculos | `M-09` | M-06 | — |
| `7.1-10` | proyecciones/read models de dominio | `M-11` | M-07 / M-08 / M-09 / M-10 | — |
| `7.1-11` | reglas técnicas de equivalencia, comparabilidad y unicidad | `M-00` | M-03 / M-07 / M-08 / M-09 | — |
| `7.2-01` | estructura persistente de Identidad BE y perfil propio | `M-01` | M-06 | — |
| `7.2-02` | estado operativo técnico de la cuenta y sus transiciones | `M-01` | M-00 | — |
| `7.2-03` | relación entre identidad persistente y métodos de acceso, sin duplicar identidad | `M-01` | 08/09 para controles y credenciales | — |
| `7.2-04` | persistencia conceptual del perfil y de su historia | `M-01` | M-06 | — |
| `7.2-05` | efectos estructurales del cierre de cuenta | `M-01` | M-04 / 08 | — |
| `7.2-06` | transición hacia cuenta cerrada/no operativa | `M-01` | M-04 | — |
| `7.2-07` | efectos sobre sesiones, procesos y vínculos | `M-04` | M-01 / M-03 / 08 | — |
| `7.2-08` | representación de conservación histórica después del cierre | `M-06` | M-01 / 08 | — |
| `7.2-09` | reversibilidad y retención compartidas con 08, sin decisión unilateral de 06 | `M-01` | 08 | 06 solo modela referencias/efectos estructurales; la política se reserva a 08. |
| `7.3-01` | entidades y relaciones de perfil profesional, especialidad y capacidad transversal | `M-02` | M-00 | — |
| `7.3-02` | estructura de solicitud de verificación | `M-02` | M-06 | — |
| `7.3-03` | estructura de evidencia versionada y relación entre versiones | `M-02` | M-06 | — |
| `7.3-04` | taxonomía técnica de estados de solicitud/verificación | `M-02` | M-00 | — |
| `7.3-05` | máquina de estados compatible como mínimo con PENDIENTE / VERIFICADO / RECHAZADO / SUSPENDIDO | `M-02` | M-00 | La arquitectura solo fija el requisito mínimo; la máquina se redactará en el bloque propietario. |
| `7.3-06` | representación técnica de observación/subsanación | `M-02` | M-06 | — |
| `7.3-07` | transición de rehabilitación | `M-02` | M-04 | — |
| `7.3-08` | equivalencia técnica de solicitudes para evitar duplicados | `M-02` | M-00 | — |
| `7.3-09` | número/ciclo de nuevas presentaciones cuando corresponda | `M-02` | M-06 | — |
| `7.3-10` | relación entre resoluciones administrativas y alcance afectado | `M-02` | M-03 | — |
| `7.3-11` | invariante: resolver una especialidad no modifica otra | `M-02` | M-00 | — |
| `7.3-12` | relación independiente de la capacidad antropométrica conforme a DEC-044 | `M-02` | M-09 | — |
| `7.3-13` | efectos estructurales de suspensión sobre procesos activos | `M-04` | M-02 / 08 | — |
| `7.3-14` | representación de habilitación y capacidad sin confundirlas con verificación o autorización | `M-02` | M-00 / M-05 / M-03 | — |
| `7.4-01` | solicitud de vínculo y vínculo como objetos/área de dominio | `M-03` | M-00 | — |
| `7.4-02` | estados técnicos y transiciones de solicitud, aceptación, rechazo, pausa y finalización | `M-03` | M-00 / M-04 | — |
| `7.4-03` | equivalencia de solicitudes y prevención de duplicados | `M-03` | M-00 | — |
| `7.4-04` | caducidad y reiteración de solicitudes | `M-03` | 08 para política fina | — |
| `7.4-05` | invitaciones para identidades aún no registradas | `M-03` | M-01 / 09 para contrato | — |
| `7.4-06` | relación posterior entre invitación e identidad creada | `M-03` | M-01 | — |
| `7.4-07` | uno o varios alcances dentro del vínculo | `M-03` | M-00 | — |
| `7.4-08` | compatibilidad entre pausa/finalización total y por alcance | `M-03` | M-04 | — |
| `7.4-09` | reanudación después de pausa | `M-03` | M-04 / 08 | — |
| `7.4-10` | efecto de cambios de elegibilidad entre solicitud y aceptación | `M-03` | M-02 / M-05 / 08 | — |
| `7.4-11` | relación longitudinal entre cambio de profesional, identidad e historia | `M-03` | M-06 / M-11 | — |
| `7.4-12` | regla de capacidad: una solicitud pendiente no ocupa capacidad | `M-05` | M-03 | — |
| `7.4-13` | tratamiento técnico de procesos activos cuando cambia el estado del vínculo | `M-04` | M-03 / 08 | — |
| `7.4-14` | Q-007: transición/evento técnico de continuidad o cierre que afecta el ciclo funcional | `M-04` | M-10 | Q-007 debe resolverse o quedar estacionada con fundamento antes del cierre del bloque M-04/M-10. |
| `7.4-15` | lectura residual después de finalización permanece en 08 | `M-03` | 08 | 06 solo conserva la estructura necesaria para aplicar la política posterior. |
| `7.5-01` | relación entre vínculo, consentimiento aplicable, finalidad y alcance | `M-03` | 08 | — |
| `7.5-02` | referencia/versionado para reconstruir qué consentimiento gobernaba una operación | `M-03` | M-06 / 08 | — |
| `7.5-03` | efectos estructurales de revocación sobre estados o procesos existentes | `M-04` | M-03 / 08 | — |
| `7.5-04` | preservación de evidencia histórica sin equiparar revocación con borrado | `M-06` | 08 | — |
| `7.5-05` | asimetría: revocar consentimiento no finaliza necesariamente el vínculo; finalizar vínculo no elimina evidencia histórica de consentimiento | `M-03` | M-04 / M-06 / 08 | — |
| `7.5-06` | interacción entre estados de vínculo y estado funcional de procesos abiertos | `M-04` | M-03 / 08 | — |
| `7.6-01` | estructura de evaluación nutricional | `M-07` | M-06 | — |
| `7.6-02` | campos conceptuales definitivos y relaciones con asesorado, profesional, período y fuentes | `M-07` | M-01 / M-02 / M-06 | — |
| `7.6-03` | estructura del objetivo nutricional | `M-07` | M-06 | — |
| `7.6-04` | relación evaluación → objetivo | `M-07` | M-04 | — |
| `7.6-05` | versionado del objetivo y conservación de antecedentes | `M-07` | M-06 | — |
| `7.6-06` | vigencia técnica | `M-07` | M-04 | — |
| `7.6-07` | distinción estructural entre dato informado, observado y calculado cuando corresponda | `M-07` | M-00 | — |
| `7.6-08` | invariante de no sobrescritura histórica | `M-06` | M-07 | — |
| `7.7-01` | estructura del catálogo propio | `M-07` | M-06 | — |
| `7.7-02` | estructura del plan nutricional | `M-07` | M-06 | — |
| `7.7-03` | normalización de elementos del catálogo | `M-07` | M-00 | — |
| `7.7-04` | estructura de borrador y cadena de versiones | `M-07` | M-06 | — |
| `7.7-05` | relaciones plan ↔ evaluación ↔ objetivo | `M-07` | M-04 | — |
| `7.7-06` | estados y transiciones de plan | `M-07` | M-00 / M-04 | — |
| `7.7-07` | invariantes de validación antes de activar | `M-07` | M-04 / M-05 | — |
| `7.7-08` | estructura de la versión activada | `M-07` | M-06 | — |
| `7.7-09` | estructura de snapshot/instantánea reproducible | `M-06` | M-07 | — |
| `7.7-10` | relación entre versión activa y versiones históricas | `M-06` | M-07 | — |
| `7.7-11` | regla de sustitución sin sobrescribir | `M-06` | M-07 / M-10 | — |
| `7.7-12` | comportamiento técnico cuando no existe banda de capacidad configurada | `M-05` | M-07 | La regla deberá ser determinista y alinearse con el hallazgo o-4 de la contrarrevisión de 04. |
| `7.7-13` | estructura de ejecución/adherencia necesaria para el circuito | `M-07` | M-04 / M-11 | — |
| `7.7-14` | reglas de unicidad de registros del período cuando corresponda | `M-07` | M-00 | — |
| `7.7-15` | continuidad versionada después de revisión | `M-07` | M-10 / M-06 | — |
| `7.7-16` | representación temporal de próxima revisión | `M-10` | M-07 / M-11 | — |
| `7.7-17` | invariante: editar catálogo o borrador después de activar no modifica la instantánea emitida | `M-06` | M-07 | — |
| `7.8-01` | entidad/evento técnico de revisión profesional válida | `M-10` | M-06 | — |
| `7.8-02` | vínculos revisión ↔ evidencia ↔ período ↔ resultado ↔ fundamento ↔ próxima acción/cierre | `M-10` | M-04 / M-06 | — |
| `7.8-03` | taxonomía técnica definitiva que represente MANTENER, AJUSTAR, SUSTITUIR, REPROGRAMAR_REVISION, CAMBIAR_OBJETIVO y FINALIZAR | `M-10` | M-00 | — |
| `7.8-04` | efecto exacto de cada resultado sobre estados | `M-10` | M-04 / M-07 / M-08 | — |
| `7.8-05` | transiciones de continuidad | `M-04` | M-10 | — |
| `7.8-06` | gestión de nueva versión cuando AJUSTAR o SUSTITUIR lo requieran | `M-06` | M-10 / M-07 / M-08 | — |
| `7.8-07` | representación temporal de REPROGRAMAR_REVISION | `M-10` | M-11 | — |
| `7.8-08` | evento técnico exacto que cierra un seguimiento — Q-007 | `M-04` | M-10 | — |
| `7.8-09` | estructura de corrección de una revisión | `M-06` | M-10 / 08 para política | — |
| `7.8-10` | preservación de revisión anterior e historia | `M-06` | M-10 | — |
| `7.8-11` | invariante: progresar o iniciar un nuevo bloque no crean un séptimo resultado técnico incompatible | `M-10` | M-08 / M-00 | — |
| `7.9-01` | campos conceptuales definitivos de evaluación de entrenamiento | `M-08` | M-06 | — |
| `7.9-02` | estructura y vigencia técnica del objetivo de entrenamiento | `M-08` | M-04 / M-06 | — |
| `7.9-03` | estructura del catálogo propio de ejercicios | `M-08` | M-06 | — |
| `7.9-04` | estructura del plan de entrenamiento | `M-08` | M-06 | — |
| `7.9-05` | estructura de bloque de entrenamiento, sesión planificada, prescripción, ejercicio planificado y parámetros/unidades necesarios | `M-08` | M-00 | — |
| `7.9-06` | relaciones plan ↔ bloque ↔ sesión ↔ prescripción | `M-08` | M-04 | — |
| `7.9-07` | versionado de la planificación | `M-08` | M-06 | — |
| `7.9-08` | estados y transiciones de plan | `M-08` | M-00 / M-04 | — |
| `7.9-09` | snapshot de activación reutilizando el patrón común | `M-06` | M-08 | — |
| `7.9-10` | cálculo/regla técnica exacta de capacidad aplicable a la activación | `M-05` | M-08 | — |
| `7.9-11` | estructura de progresión | `M-08` | M-10 | — |
| `7.9-12` | transición técnica para AJUSTAR y SUSTITUIR | `M-10` | M-08 / M-06 | — |
| `7.10-01` | estructura de ejecución real separada de la prescripción | `M-08` | M-00 | — |
| `7.10-02` | campos conceptuales/técnicos de ejecución | `M-08` | M-06 | — |
| `7.10-03` | relación ejecución ↔ versión activada ↔ sesión | `M-08` | M-06 | — |
| `7.10-04` | política estructural de borrador de registro, compartida con 10 | `M-08` | 10 | — |
| `7.10-05` | unicidad/identificación del registro ejecutado | `M-08` | M-00 | — |
| `7.10-06` | estructura de cadena de correcciones | `M-06` | M-08 | — |
| `7.10-07` | relación original → corrección → corrección sucesiva | `M-06` | M-08 | — |
| `7.10-08` | mecanismo para determinar la vista efectiva sin borrar originales | `M-06` | M-11 | — |
| `7.10-09` | relación actor/fecha/motivo de cada corrección | `M-06` | M-08 / 08 para autorización | — |
| `7.10-10` | invariantes de no sobrescritura | `M-06` | M-08 | — |
| `7.10-11` | estructura común de UC-I12 reutilizable por Entrenamiento y Antropometría | `M-06` | M-08 / M-09 | — |
| `7.11-01` | estructura de evaluación antropométrica | `M-09` | M-06 | — |
| `7.11-02` | representación de mediciones directas | `M-09` | M-00 | — |
| `7.11-03` | representación de cálculos derivados | `M-09` | M-00 | — |
| `7.11-04` | referencia a protocolo identificado | `M-09` | 11A/11B para instrumentos/evidencia | — |
| `7.11-05` | estructura/versionado de métodos de cálculo | `M-09` | M-06 | — |
| `7.11-06` | fórmulas antropométricas | `M-09` | 11A para prueba | — |
| `7.11-07` | unidades y catálogo de unidades | `M-09` | M-00 | — |
| `7.11-08` | conversiones | `M-09` | M-00 | — |
| `7.11-09` | precisión y redondeo | `M-09` | 11A para verificación | — |
| `7.11-10` | dependencias entre entradas y resultados derivados | `M-09` | M-06 | — |
| `7.11-11` | grafo/relación para identificar qué resultados dependen de una medición | `M-09` | M-06 | — |
| `7.11-12` | reglas de recálculo cuando una entrada es corregida | `M-09` | M-06 | — |
| `7.11-13` | conservación/versionado de resultados anteriores | `M-06` | M-09 | — |
| `7.11-14` | estructura de la corrección antropométrica | `M-09` | M-06 | — |
| `7.11-15` | relación original → corrección | `M-06` | M-09 | — |
| `7.11-16` | compatibilidad técnica entre evaluaciones | `M-09` | M-00 | — |
| `7.11-17` | reglas de comparabilidad cuando cambian método, versión o unidad | `M-09` | M-00 | — |
| `7.11-18` | tratamiento técnico de datos no comparables | `M-09` | M-11 | — |
| `7.11-19` | estructura necesaria para evolución longitudinal | `M-09` | M-11 | — |
| `7.11-20` | invariante: medición directa ≠ cálculo derivado | `M-09` | M-00 | — |
| `7.11-21` | invariante: un recálculo no elimina el resultado anterior | `M-06` | M-09 | — |
| `7.11-22` | invariante: un método nuevo no reescribe cálculos históricos | `M-06` | M-09 | — |
| `7.11-23` | invariante: protocolo, método, versión, unidad y entradas deben poder reconstruirse | `M-09` | M-06 | — |
| `7.12-01` | estados técnicos de publicación del servicio | `M-09` | M-00 | — |
| `7.12-02` | transiciones publicar/pausar/dejar de ser elegible | `M-09` | M-02 / M-05 | — |
| `7.12-03` | relación publicación ↔ identidad profesional ↔ capacidad antropométrica ↔ habilitación ↔ ubicación utilizable | `M-09` | M-02 | — |
| `7.12-04` | conservación histórica ante cambios de publicación | `M-06` | M-09 | — |
| `7.12-05` | representación del origen de solicitud de vínculo desde descubrimiento | `M-03` | M-09 | — |
| `7.12-06` | caducidad técnica de esa solicitud en coordinación con vínculo y 08 | `M-03` | M-09 / 08 | — |
| `7.12-07` | límite: no introducir reservas, turnos, pagos, ranking, reputación, reseñas o contratación | `M-09` | M-00 | Restricción negativa de alcance; no genera objetos de dominio nuevos. |
| `7.13-01` | modelo de habilitación separado de verificación | `M-02` | M-00 / M-05 | — |
| `7.13-02` | estructura de capacidad configurada | `M-05` | M-06 | — |
| `7.13-03` | bandas/límites aplicables a procesos nuevos | `M-05` | M-04 | — |
| `7.13-04` | cálculo exacto de capacidad | `M-05` | M-04 | — |
| `7.13-05` | definición de qué procesos computan como vigentes/nuevos | `M-05` | M-04 | — |
| `7.13-06` | comportamiento cuando no hay banda configurada | `M-05` | M-07 / M-08 | — |
| `7.13-07` | versionado de cambios administrativos de capacidad | `M-05` | M-06 | — |
| `7.13-08` | invariante: exceder capacidad rechaza un proceso nuevo | `M-05` | M-04 | — |
| `7.13-09` | invariante: exceder capacidad no interrumpe procesos vigentes | `M-05` | M-04 | — |
| `7.13-10` | invariante: exceder capacidad no revoca vínculos | `M-05` | M-03 | — |
| `7.13-11` | invariante: exceder capacidad no borra datos | `M-05` | M-06 | — |
| `7.13-12` | compatibilidad con identidad que posea únicamente capacidad antropométrica verificada conforme a DEC-044 | `M-05` | M-02 / M-09 | — |
| `7.14-01` | proyección/read model de cartera profesional | `M-11` | M-10 | — |
| `7.14-02` | reglas técnicas exactas que determinan un pendiente | `M-10` | M-11 | — |
| `7.14-03` | relación con última revisión válida | `M-10` | M-11 | — |
| `7.14-04` | relación con próxima acción o cierre | `M-10` | M-04 / M-11 | — |
| `7.14-05` | regla: un pendiente no se resuelve por mera visualización | `M-10` | M-11 | — |
| `7.14-06` | filtros y ordenamiento como responsabilidad compartida 06/10 | `M-11` | 10 | — |
| `7.14-07` | criterios de ordenamiento que no se conviertan en gravedad clínica | `M-11` | M-00 / 10 | — |
| `7.14-08` | agregados necesarios para cartera sin producir un score global | `M-11` | M-00 | — |
| `7.15-01` | proyecciones/read models por dominio | `M-11` | M-07 / M-08 / M-09 | — |
| `7.15-02` | agregados técnicos requeridos para construir la síntesis | `M-11` | M-00 | — |
| `7.15-03` | modelo longitudinal común de eventos | `M-11` | M-06 | — |
| `7.15-04` | distinción estructural entre momento de ocurrencia y momento de registro | `M-11` | M-06 | — |
| `7.15-05` | conservación de autoría y procedencia | `M-06` | M-11 | — |
| `7.15-06` | relaciones entre planes, ejecuciones, evaluaciones, cálculos, correcciones, revisiones y próximas acciones | `M-11` | M-06 / M-10 | — |
| `7.15-07` | proyección del timeline | `M-11` | 10 | — |
| `7.15-08` | representación de vista parcial cuando solo parte del contexto está autorizada | `M-11` | M-03 / 08 | — |
| `7.15-09` | filtros/períodos del progreso propio compartidos con 10 | `M-11` | 10 | — |
| `7.15-10` | proyección longitudinal para APK del asesorado | `M-11` | 10 | — |
| `7.15-11` | mecanismo estructural para no mezclar dominios en una calificación agregada | `M-11` | M-00 | — |
| `7.16-01` | relaciones entre versiones | `M-06` | M-07 / M-08 / M-09 / M-10 | — |
| `7.16-02` | entidades/eventos de corrección | `M-06` | M-08 / M-09 / M-10 | — |
| `7.16-03` | cadena reconstruible de correcciones | `M-06` | M-08 / M-09 | — |
| `7.16-04` | referencias a original y valor efectivo | `M-06` | M-11 | — |
| `7.16-05` | eventos de cierre y continuidad | `M-04` | M-10 | — |
| `7.16-06` | historial longitudinal | `M-11` | M-06 | — |
| `7.16-07` | estructura para preservar actor, autoría, ocurrencia, registro, procedencia, versión y relación sucesora | `M-06` | M-11 | — |
| `7.16-08` | invariante contra sobrescritura silenciosa | `M-06` | M-00 | — |
| `7.16-09` | límite: política de auditoría y acceso al historial pertenece principalmente a 08 | `M-06` | 08 | 06 modela la estructura; 08 gobierna política de acceso/auditoría. |
| `7.17-01` | fórmula exacta de TVCC-30 | `M-12` | 12 | 06 no la cierra unilateralmente: modela componentes computables; 12 conserva definición analítica canónica y versionado de especificación. |
| `7.17-02` | elegibilidad fina de ciclos | `M-12` | M-04 / M-10 / 12 | — |
| `7.17-03` | definición técnica del numerador | `M-12` | 12 | — |
| `7.17-04` | definición técnica del denominador | `M-12` | 12 | — |
| `7.17-05` | exclusiones y motivos | `M-12` | 12 | — |
| `7.17-06` | versión de la especificación | `M-12` | 12 | — |
| `7.17-07` | zona temporal/analítica aplicable | `M-12` | 12 / 09 | Debe respetar la zona horaria MVP vigente salvo cambio formal. |
| `7.17-08` | reglas de reproducción histórica | `M-12` | M-06 / 12 | — |
| `7.17-09` | relación con eventos producidos por UC-P13, UC-P18, UC-I05 y UC-I06 | `M-12` | M-10 | — |
| `7.17-10` | tratamiento de nueva versión de especificación sin sobrescribir cálculos previos | `M-12` | M-06 / 12 | — |
| `7.17-11` | estructura de resultados históricos | `M-12` | M-06 | — |
| `7.17-12` | trazabilidad de ciclos incluidos y excluidos | `M-12` | 12 | — |
| `7.17-13` | invariante: una visualización no cuenta como revisión | `M-12` | M-10 | — |
| `7.17-14` | invariante: una nota aislada no cuenta como revisión | `M-12` | M-10 | — |
| `7.17-15` | invariante: una modificación silenciosa no cuenta como revisión | `M-12` | M-10 / M-06 | — |
| `7.17-16` | invariante: un ciclo requiere revisión profesional válida y próxima acción o cierre | `M-12` | M-10 / M-04 | — |
| `7.17-17` | invariante: el numerador nunca se presenta sin denominador | `M-12` | 12 | — |
| `7.17-18` | invariante: TVCC-30 no es retención, adherencia, score clínico ni resultado de salud | `M-12` | M-00 / 12 | — |
| `7.17-19` | propiedad 06: modelo, estados, entidades, relaciones y componentes computables | `M-12` | M-00 / M-04 / M-10 | — |
| `7.17-20` | propiedad 12: definición analítica canónica, trazabilidad, versión de especificación y evidencia reproducible | `M-12` | 12 | — |
| `7.17-21` | regla: no cerrar unilateralmente la fórmula en 06 sin reconciliarla con 12 | `M-12` | 12 | — |
| `DIR-06-01` | pausas y períodos de gracia de capacidad | `M-05` | M-04 / 08 | Propiedad de 06 confirmada por instrucción de dirección y contrarrevisión de 04; no se fija todavía la regla concreta. |
| `DIR-06-02` | comportamiento por defecto de capacidad cuando no existe banda configurada | `M-05` | M-07 / M-08 | Debe quedar determinista; la contrarrevisión de 04 recomienda 'sin límite' como comportamiento coherente a resolver en 06. |
| `DIR-06-03` | resolución o estacionamiento fundado de Q-007 | `M-04` | M-10 | No puede quedar huérfana: si no se resuelve, debe registrarse estado, fundamento, impacto, propietario y gate. |
| `DIR-06-04` | elegibilidad fina y eventos de TVCC-30; versionado de fórmula/especificación coordinado con 12 | `M-12` | 12 | La frontera 06/12 debe quedar explícita antes del cierre de este bloque. |

### 3.11. Cobertura del inventario

La matriz anterior fue construida con una unidad de cobertura por viñeta principal de §7 y unidades adicionales para invariantes/límites explícitos cuando su omisión podría permitir una reinterpretación.

| Control | Resultado |
|---|---:|
| Secciones fuente `7.1…7.17` representadas | `17/17` |
| Unidades de deuda mapeadas desde §7 + directivas explícitas de esta sesión | `209` |
| Unidades sin área primaria | `0` |
| IDs de cobertura duplicados | `0` |
| Áreas de modelo definidas | `13` |

#### 3.11.1. Distribución por área primaria

| Área | Unidades asignadas |
|---|---:|
| `M-00` | 7 |
| `M-01` | 7 |
| `M-02` | 14 |
| `M-03` | 17 |
| `M-04` | 10 |
| `M-05` | 16 |
| `M-06` | 31 |
| `M-07` | 18 |
| `M-08` | 14 |
| `M-09` | 25 |
| `M-10` | 12 |
| `M-11` | 16 |
| `M-12` | 22 |

### 3.12. Tratamiento de preguntas abiertas

| Pregunta | Tratamiento en 06 | Estado en esta arquitectura |
|---|---|---|
| `Q-003` — granularidad/taxonomía de consentimiento | No resolver; solo referencias estructurales necesarias. Propietario: 08. | `ESTACIONADA FUERA DE 06` |
| `Q-004` — retención tras revocación | No resolver; modelar conservación histórica sin fijar política. Propietario: 08. | `ESTACIONADA FUERA DE 06` |
| `Q-005` — lectura residual tras finalizar vínculo | No resolver; conservar estructura para que 08 aplique la política. | `ESTACIONADA FUERA DE 06` |
| `Q-007` — evento que cierra un seguimiento | Resolver en `M-04/M-10` o estacionar formalmente con fundamento, impacto, propietario y gate. | `PENDIENTE — DENTRO DE 06` |

### 3.13. Hallazgos para dirección

#### 3.13.1. H-06-ARQ-01 — Referencia histórica de BE-LEG-03 ya corregida: no reintroducir

La contrarrevisión externa de `BE-LEG-06 v0.1` determinó que la referencia histórica `03 §9 = Capacidad` era un valor **pre-corrección** proveniente del glosario v0.1.3 y que no debe reintroducirse. La referencia `03 §14` utilizada por la contrarrevisión de 04 era correcta.

La numeración canónica vigente informada por esa contrarrevisión, sobre `03_Modelo_de_Negocio.md` extraído del bundle G1 y conforme a su `MANIFEST.sha256`, es:

- `03 §9` — **Posicionamiento**;
- `03 §14` — **Capacidad y asesorado activo**;
- `03 §15` — **Cuenta del asesorado**;
- `03 §22` — **Ingresos**;
- `03 §23` — **Costos y sostenibilidad**.

**Procedencia:** contrarrevisión externa de `BE-LEG-06 v0.1` aportada por dirección en esta sesión; SHA-256 informado para `03_Modelo_de_Negocio.md`: `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6`; bundle G1: `cb374ab27e2b2c636455653aef1d2e06b3c85acdbd6465d6ad968c231ae3d08f`.

**Prueba falsable ejecutada antes de esta reescritura:** no se encontró una copia suelta legible de `03_Modelo_de_Negocio.md` en los archivos del proyecto recuperables ni en `/mnt/data`. Por tanto, **el canon no está montado en forma legible en esta sesión y dirección debe reponerlo** si se pretende repetir localmente el contraste de hash y encabezados. Los hashes y la numeración anteriores se registran por su procedencia de contrarrevisión; **no se presentan como recalculados o reverificados localmente**.

**Tratamiento:** usar `03 §14 — Capacidad y asesorado activo` como referencia vigente cuando el artefacto canónico esté a la vista; no reutilizar `03 §9` para capacidad. La propiedad de pausas/períodos de gracia permanece en 06 y no cambia por esta corrección.

#### 3.13.2. H-06-ARQ-02 — P-01 y P-02 permanecen pendientes

La autorización actual permite la **arquitectura preparatoria** del 06, no altera el estado formal de G2. Por tanto, cualquier revisión posterior debe evitar frases que presenten `BE-LEG-05 v0.14` como aprobado por dirección o 04/05 como ya canonizados hasta que esos actos se evidencien explícitamente.

### 3.14. Riesgos de arquitectura a vigilar en la redacción

| Riesgo | Descripción | Daño | Control |
|---|---|---|---|
| `R-06-01` | Modelo físico infiltrado | Convertir el dominio en tablas/ORM antes de 07/09/datos físicos. | Revisión por sección: cero referencias obligatorias a motor, tabla, columna, índice u ORM. |
| `R-06-02` | Colapso de conceptos de confianza | Fusionar verificación, habilitación, vínculo, consentimiento o autorización. | Invariante de separación en M-00 y pruebas de términos por bloque. |
| `R-06-03` | Antropometría como tercera especialidad | Reaparece por conveniencia de modelado. | DEC-044 + M-02/M-09; profesional exclusivamente antropométrico debe ser representable. |
| `R-06-04` | Taxonomías paralelas de revisión | Nutrición/Entrenamiento crean resultados incompatibles. | M-10 único; especializaciones mapeadas a los seis resultados. |
| `R-06-05` | Sobrescritura histórica | Activación/corrección reemplaza evidencia anterior. | M-06 común; originales y versiones previas reconstruibles. |
| `R-06-06` | Read model como fuente de verdad | Dashboard/cartera empieza a decidir estados. | M-11 solo deriva; escrituras regresan al área propietaria. |
| `R-06-07` | Capacidad indeterminada | Ausencia de banda produce resultados ambiguos. | M-05 debe fijar comportamiento por defecto, pausas y gracia antes de cerrar. |
| `R-06-08` | Q-007 huérfana | Se modelan planes/revisiones sin cierre formal. | Gate de M-04/M-10 y auditoría final. |
| `R-06-09` | TVCC-30 invadida | 06 congela una fórmula/versión analítica que pertenece conjuntamente a 12. | M-12 separa componentes de dominio de definición analítica canónica. |

### 3.15. Autoverificaciones falsables de esta arquitectura

Los siguientes controles son condiciones de fallo reales; no son declaraciones decorativas:

1. **Cobertura:** falla si alguna unidad de `DERIVAR 06` carece de área primaria.
2. **Unicidad:** falla si dos filas usan el mismo ID de cobertura.
3. **Fronteras:** falla si Q-003/Q-004/Q-005 aparecen como decisión de 06, o si 06 fija despliegue, endpoint, pantalla, instrumento o matriz final de trazabilidad.
4. **Antropometría:** falla si aparece como tercera especialidad o depende obligatoriamente de Nutrición/Entrenamiento.
5. **DEC-005:** falla si la futura máquina de verificación no puede representar al menos `PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `SUSPENDIDO`.
6. **DEC-043:** falla si la futura taxonomía técnica agrega `PROGRESAR` o `INICIAR_NUEVO_BLOQUE` como séptimo resultado común incompatible.
7. **Historia:** falla si una corrección, recálculo, sustitución o nueva versión requiere borrar/sobrescribir el original.
8. **Capacidad:** falla si exceder la banda interrumpe procesos vigentes, revoca vínculos o borra datos; también falla si no-band queda indeterminado al cerrar M-05.
9. **Q-007:** falla el cierre global si Q-007 no está resuelta ni estacionada formalmente.
10. **TVCC-30:** falla si 06 declara cerrada unilateralmente la definición analítica/versionado que debe coordinar con 12.
11. **Gobierno:** falla si el artefacto afirma P-01/P-02 cumplidos sin nueva evidencia o si registra una operación Git no autorizada.

**Resultado de ejecución sobre esta `v0.1.1`:** cobertura `CONFORME`; unicidad `CONFORME`; fronteras `CONFORME`; Git `SIN CAMBIOS`. Las demás verificaciones son gates de los bloques futuros y todavía no pueden declararse superadas porque las máquinas, entidades y reglas detalladas no existen en esta ronda.

### 3.16. Estado de salida

```text
BE-LEG-06 v0.1.1 — ARQUITECTURA PRELIMINAR CORREGIDA
ESTADO DOCUMENTAL: BORRADOR
INSTANCIA: CONTRARREVISIÓN EXTERNA DE v0.1 TRATADA — PENDIENTE DE APROBACIÓN DE DIRECCIÓN
MAPA DE ÁREAS: DEFINIDO
UNIDADES DERIVAR 06 / DIRECTIVAS MAPEADAS: 209
HUÉRFANOS: 0
DIAGRAMAS: NO INICIADOS
ATRIBUTOS EXHAUSTIVOS: NO INICIADOS
MÁQUINAS DE ESTADOS: NO INICIADAS
P-01: PENDIENTE
P-02: PENDIENTE
GIT: SIN CAMBIOS
SIGUIENTE PASO: APROBACIÓN EXPLÍCITA DE DIRECCIÓN DE v0.1.1
PRIMER BLOQUE SUSTANTIVO: B-00 — BLOQUEADO HASTA ESA APROBACIÓN
```


---


## 4. B-06 — Versionado, instantáneas, correcciones e historia común

*Fuente ensamblada: `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` · SHA-256 `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77`.*


### 4.1. Objeto

B-06 instancia una sola vez el patrón común de `M-06` para:

- `Versión`;
- `Instantánea reproducible (snapshot)`;
- `Corrección trazable`;
- sucesión entre versiones;
- preservación del original;
- cadena reconstruible de correcciones;
- determinación de una vista efectiva sin borrar historia;
- conservación de actor, autoría, procedencia, momento de ocurrencia y momento de registro;
- persistencia conceptual de historia;
- invariantes contra sobrescritura silenciosa.

El bloque **no** define contenido profesional, política de autorización, retención, acceso a historial, auditoría, contratos, pantallas, almacenamiento físico ni fórmulas de dominio.

Su función es proveer un patrón reutilizable. `M-07`, `M-08`, `M-09` y `M-10` lo instanciarán sin redefinirlo.

---

### 4.2. Gobierno, fuentes y custodia

#### 4.2.1. Fuentes verificadas en esta ronda

| Fuente | SHA-256 | Uso |
|---|---|---|
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | reglas raíz, términos, invariantes y convenciones vinculantes |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | propietario `M-06`, 31 unidades primarias y fronteras |
| `ACTA_DIR_007_APROBACION_ARQUITECTURA_BE_LEG_06.md` | `2460c2ba48318ad71350424da40d3f601bf3a00b177a6d22b695bcc45dbf16a7` | aprobación de arquitectura y condiciones generales de redacción |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-031, RF-041, RF-044, RF-050, RF-054 y RNF-DAT-003 |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | conducta vinculante: UC-I01, UC-I03, UC-I04, UC-I12 y extensiones |

#### 4.2.2. ACTA-DIR-009

Dirección comunicó en esta ronda:

- aprobación y cierre de `B-00 v0.2.1`;
- carácter vinculante de B-00 para B-01…B-13;
- habilitación expresa de B-06;
- ausencia de autorización Git.

El archivo material de `ACTA-DIR-009` no está montado en este entorno. Por la regla de custodia vigente, **no se inventa ni se registra un SHA-256 del acta** y no se reproducen como literales apartados que no están a la vista. La habilitación para redactar se apoya en la instrucción expresa de Dirección de esta conversación. Si la copia material posterior difiriera de lo comunicado, la tensión deberá registrarse y no reinterpretarse silenciosamente.

#### 4.2.3. Fuentes comportamentales vinculantes

B-06 conserva, entre otras, estas obligaciones ya aprobadas:

1. una activación de plan conserva una versión reproducible y no altera el histórico emitido;
2. una sustitución se relaciona con la versión anterior;
3. una corrección conserva original, actor, fecha/momentos aplicables y relación con el registro previo;
4. una corrección sucesiva mantiene reconstruible la cadena;
5. la vista efectiva puede determinarse sin borrar el original;
6. un recálculo no elimina el resultado histórico;
7. la línea temporal conserva dominio, autoría y procedencia;
8. una modificación posterior de catálogo o borrador no reconstruye retrospectivamente una instantánea emitida.

---

### 4.3. Apertura del bloque conforme a B-00

#### 4.3.1. Unidades de deuda

La arquitectura asigna **31 unidades con propietario primario `M-06`**. B-06 las trata en §11.

El núcleo explícito de patrón común incluye además:

- `7.1-02` — estructura persistente conceptual, cuyo régimen fue fijado por B-00 y cuya instancia común se concreta aquí;
- `7.1-06` — versionado estructural;
- `7.15-05` — conservación de autoría y procedencia;
- `7.16-01…04`;
- `7.16-07…09`.

`7.16-05` y `7.16-06` se incluyen en la coordinación de §11.2, pero **no** se resuelven sustantivamente aquí porque sus propietarios primarios son `M-04` y `M-11`.

#### 4.3.2. Términos `PROPIETARIO-06` ejecutados

B-06 ejecuta directamente los mandatos de:

- `T-06-20` — Versión;
- `T-06-21` — Instantánea reproducible;
- `T-06-22` — Corrección trazable;
- `T-06-23` — Procedencia;
- `T-06-24` — Momento de ocurrencia / Momento de registro.

También utiliza sin redefinir:

- `T-06-N04` — Identificador de dominio;
- `T-06-N08` — Evento de dominio;
- `T-06-N17` — Persistencia conceptual;
- `T-06-N18` — Autoría;
- `T-06-N19` — Fuente de verdad del dominio.

#### 4.3.3. Términos recurrentes nuevos

`NINGUNO`.

B-06 utiliza el vocabulario ya aprobado. Expresiones como «original», «sucesora» o «vista efectiva» funcionan como roles o resultados de relaciones ya exigidas por 04/05 y la arquitectura; no se elevan a nuevos términos canónicos.

#### 4.3.4. Máquinas de estados instanciadas

`NINGUNA MÁQUINA GLOBAL NUEVA`.

La decisión es deliberada: `Versión`, `Instantánea reproducible` y `Corrección trazable` son hechos/representaciones históricas que, una vez emitidos o registrados, son inmutables. Imponer una máquina universal `BORRADOR → EMITIDA → ...` sobre estos tres conceptos introduciría estados no aprobados y mezclaría ciclos que pertenecen a las áreas verticales.

Las áreas propietarias que sí posean ciclo de vida —por ejemplo plan, solicitud de verificación o vínculo— deberán declarar sus máquinas completas conforme a `CONV-06-03` y colocar los actos de emisión, activación, sustitución o corrección dentro de su lista blanca.

B-06 fija en §9 **efectos obligatorios de transición**, no una máquina ficticia común.

#### 4.3.5. Fronteras `DERIVADO`

B-06 toca, pero no resuelve:

- quién puede corregir, consultar historia o auditar → `08`;
- retención, lectura residual y borrado permitido por política → `08`;
- contratos y exposición externa → `09`;
- representación visual del histórico → `10`;
- pruebas de concurrencia/consistencia → `11A`;
- fórmula y versionado analítico final de TVCC-30 → `12`;
- eventos de cierre/continuidad → `M-04`;
- proyección longitudinal/timeline → `M-11`.

---

### 4.4. Principios normativos de M-06

#### 4.4.1. Historia por adición, no por mutación retrospectiva

Cuando un hecho ya fue emitido, utilizado para decidir o incorporado al histórico, un cambio posterior se representa mediante:

- una **nueva Versión**, cuando cambia una representación versionada; o
- una **Corrección trazable**, cuando se rectifica un registro histórico correctable.

La elección entre ambos mecanismos depende de la semántica del área propietaria; nunca se resuelve mediante sobrescritura silenciosa.

#### 4.4.2. Identidad histórica estable

Cada Versión, Instantánea reproducible y Corrección trazable posee un `Identificador de dominio` estable. Coincidencia de contenido no implica identidad (`REG-06-01`).

#### 4.4.3. Vigencia no equivale a recencia

La versión «más nueva por fecha» **no se presume vigente**.

La vigencia es una condición de dominio definida por el área propietaria. En Nutrición y Entrenamiento, por ejemplo, el bloque vertical deberá asegurar que no existan vigencias contradictorias conforme a RF-031/RF-041.

#### 4.4.4. Historia común no equivale a timeline

M-06 preserva fuentes y relaciones reconstruibles. La `Línea temporal longitudinal` es una proyección de `M-11`, no la Fuente de verdad del dominio.

#### 4.4.5. Cierre, revocación o despublicación no implican borrado estructural

Un cambio operativo puede cortar acciones futuras o visibilidad, pero **no elimina por sí mismo** versiones, correcciones, snapshots o evidencia histórica. La política de retención y acceso sigue reservada a 08.

---

### 4.5. Patrón común de Versión (`T-06-20`)

#### 4.5.1. Estructura conceptual mínima

Una `Versión` conserva como mínimo:

| Elemento conceptual | Regla |
|---|---|
| Identificador | designa de forma estable esa versión concreta |
| Referencia al objeto versionado | identifica qué entidad o representación de dominio versiona |
| Ámbito | evita relacionar como sucesoras versiones de objetos o alcances diferentes |
| Referencia a predecesora | opcional; cero para la primera versión, como máximo una predecesora directa |
| Autoría | actor responsable del contenido o decisión versionada |
| Actor de la operación | actor que ejecutó/registró la emisión cuando sea distinto de la autoría |
| Momento de ocurrencia | cuándo ocurrió el hecho de emisión o presentación |
| Momento de registro | cuándo BE lo registró |
| Procedencia | de dónde proviene el contenido o evidencia |
| Contenido emitido | representación semántica que queda inmutable tras la emisión |
| Referencias de contexto | relaciones necesarias para reconstruir el sentido de esa versión |

No se fija cómo se almacena ninguno de estos elementos.

#### 4.5.2. Emisión

**`REG-06-11` — Emisión de versión.** Una Versión nace mediante un acto explícito definido por el área propietaria. Antes de la emisión puede existir un borrador u objeto mutable si esa área lo contempla; **ese estado previo no autoriza a mutar una Versión ya emitida**.

Efectos obligatorios de emitir una versión:

1. asignar identidad propia;
2. fijar su contenido emitido;
3. preservar autoría, actor, ocurrencia, registro y procedencia;
4. relacionarla con la predecesora cuando exista;
5. emitir el hecho de dominio correspondiente;
6. impedir mutación retrospectiva de esa representación.

#### 4.5.3. Sucesión

**`REG-06-12` — Relación sucesora.** Una versión sucesora:

- pertenece al mismo objeto versionado y ámbito;
- puede identificar como máximo una predecesora directa;
- no modifica a su predecesora;
- conserva reconstruible la secuencia histórica;
- no adquiere vigencia por la mera relación sucesora.

Una versión puede tener más de una sucesora estructural solo cuando el área propietaria admita explícitamente ramas. En ausencia de esa regla, una bifurcación queda **no resoluble automáticamente**: no puede resolverse por fecha ni por orden de registro, y ningún consumidor puede elegir silenciosamente una sucesora como efectiva.

#### 4.5.4. Sustitución

Una sustitución profesional no modifica la versión sustituida. El bloque vertical debe:

1. emitir la sucesora;
2. relacionarla con su predecesora;
3. cambiar la vigencia mediante una transición declarada en su propia máquina;
4. conservar la versión histórica.

Esto instancia el comportamiento aprobado de RF-031 y RF-041 sin definir aquí la máquina de Plan.

---

### 4.6. Patrón de Instantánea reproducible (`T-06-21`)

#### 4.6.1. Propósito

Una `Instantánea reproducible` preserva exactamente la representación que se hizo vigente/consultable en un acto que exige reproducibilidad, especialmente la activación de planes.

#### 4.6.2. Estructura conceptual mínima

Conserva:

- identificador propio;
- referencia exacta a la Versión;
- representación preservada de lo emitido;
- contexto necesario para interpretarla;
- autoría del contenido;
- actor del acto de activación/emisión cuando corresponda;
- momento de ocurrencia;
- momento de registro;
- procedencia.

#### 4.6.3. Regla de reproducción

**`REG-06-13` — Reproducción histórica.** La instantánea se reconstruye desde **la representación preservada de la versión emitida**, nunca desde catálogos, métodos, configuraciones o elementos actuales que hayan cambiado después.

Consecuencias:

- editar un catálogo no altera una instantánea anterior;
- editar un borrador sucesor no altera la versión activada;
- sustituir una versión no modifica la instantánea de la anterior;
- si el área exige snapshot y este no puede preservarse, el acto que depende de él no se declara exitoso.

#### 4.6.4. Cardinalidad común

Una Instantánea reproducible referencia **exactamente una Versión**.

Una Versión puede no requerir instantánea. Cuando el área propietaria la exige para un acto de emisión/activación, debe declarar su regla de unicidad y contexto. B-06 no inventa snapshots para toda entidad versionada.

---

### 4.7. Patrón de Corrección trazable (`T-06-22`)

#### 4.7.1. Estructura conceptual mínima

Una `Corrección trazable` conserva:

| Elemento conceptual | Regla |
|---|---|
| Identificador | identidad propia de la corrección |
| Original | referencia obligatoria al registro histórico raíz |
| Corrección previa | referencia opcional a la corrección inmediatamente anterior |
| Contenido corregido | nueva afirmación/valor/condición según el área propietaria |
| Actor | quién ejecuta o registra la corrección |
| Autoría | responsabilidad atribuible a la corrección; no reasigna la del original |
| Momento de ocurrencia | cuándo ocurrió la rectificación |
| Momento de registro | cuándo BE la registró |
| Motivo | se conserva cuando la política aplicable lo exige |
| Procedencia | fuente/contexto de la rectificación |

#### 4.7.2. Creación de una corrección

**`REG-06-14` — Corrección no destructiva.** Confirmar una corrección exige:

1. original identificable;
2. actor identificable;
3. ambos momentos conforme a la información disponible, sin sustituir uno por otro;
4. relación directa con el original;
5. relación con la corrección previa cuando exista;
6. preservación de autoría y procedencia;
7. preservación inmutable del registro anterior.

Si el original falta, la relación no es reconstruible o se intenta sobrescribir, la corrección no se confirma como `Corrección trazable`.

#### 4.7.3. Cadena de correcciones

**`REG-06-15` — Cadena lineal efectiva.** Para un mismo original:

- la primera corrección referencia al original y no tiene corrección previa;
- una corrección sucesiva referencia al mismo original raíz y a la corrección efectiva inmediatamente anterior;
- la cadena no admite ciclos;
- una corrección confirmada no se reescribe;
- cada nodo conserva su propia autoría, actor, ocurrencia, registro y procedencia.

La historia completa debe poder recorrerse desde el original hasta la corrección terminal.

#### 4.7.4. Vista efectiva

**`REG-06-16` — Determinación efectiva.** La vista efectiva se obtiene por relación, no por «última fecha»:

1. si no existe corrección confirmada, el original es efectivo;
2. si existe una cadena válida con una única corrección terminal, esa terminal determina la vista efectiva;
3. si existen ramas incompatibles, ciclo o relación incompleta, la vista efectiva queda **no resoluble automáticamente** y ningún consumidor puede elegir silenciosamente por tiempo de registro;
4. el área propietaria puede declarar condiciones efectivas adicionales dentro de su propia semántica y máquina de estados, siempre sin borrar el original ni convertir esa condición en una categoría global de M-06.

La vista efectiva es derivada. No sustituye la historia como Fuente de verdad del dominio.

#### 4.7.5. Corrección sucesiva por actor diferente

Un actor autorizado distinto puede originar una corrección cuando 08 y el caso invocante lo permitan. La corrección nueva conserva su autoría real y **no reasigna** la del original ni la de correcciones previas.

#### 4.7.6. Corrección y recálculo

Una corrección de una entrada que afecte resultados derivados:

- no modifica resultados históricos ya emitidos;
- permite que el área propietaria produzca resultados derivados nuevos;
- relaciona cada resultado nuevo con las entradas efectivas y la especificación/método versionado que utilizó;
- conserva los resultados anteriores.

B-06 fija la preservación histórica. Las reglas de dependencia y recálculo concreto pertenecen a `M-09`.

---

### 4.8. Actor, autoría, procedencia y tiempo

#### 4.8.1. Actor ≠ autoría ≠ procedencia

**`REG-06-17` — Separación de atribuciones.** Los tres conceptos no se colapsan:

- **actor:** identidad que ejecuta o registra una operación;
- **autoría:** responsabilidad por crear, registrar o decidir el contenido/hecho;
- **procedencia:** origen del dato, evidencia o elemento.

Pueden coincidir en un caso concreto, pero la estructura no presume equivalencia.

Ejemplo estructural admisible: un sistema registra una Instantánea reproducible de un plan cuya autoría profesional pertenece a otra identidad. La automatización del registro no transfiere la autoría del plan al sistema.

#### 4.8.2. Momento de ocurrencia ≠ momento de registro

**`REG-06-18` — Doble temporalidad.** Todo Evento de dominio producido por el patrón conserva ambos momentos.

- Si la ocurrencia es conocida, se registra.
- Si es desconocida, permanece desconocida.
- El momento de registro nunca se copia para fingir una ocurrencia inexistente.
- La ordenación longitudinal semántica de `M-11` utilizará la ocurrencia conforme a `REG-06-04`.

#### 4.8.3. Procedencia mínima

La procedencia debe permitir reconstruir, cuando corresponda:

- actor/fuente propia;
- proveedor externo;
- versión de origen;
- método o especificación;
- contexto de incorporación;
- intervención profesional posterior.

B-06 no fija una taxonomía física ni de proveedores.

---

### 4.9. Efectos comunes que las máquinas verticales deben instanciar

B-06 no crea una máquina universal. Define obligaciones que cada transición vertical debe incorporar a su lista blanca.

#### 4.9.1. Emitir versión

Cuando una transición vertical **emite una versión**:

- crea una Versión nueva;
- fija contenido y referencias;
- preserva actor, autoría, ocurrencia, registro y procedencia;
- relaciona predecesora si existe;
- deja la versión emitida inmutable.

#### 4.9.2. Activar versión con snapshot

Cuando una transición vertical **activa** una versión para un caso que exige reproducibilidad:

- la versión ya debe ser válida según el área;
- preserva la Instantánea reproducible;
- no altera versiones anteriores;
- solo después aplica el cambio de vigencia de la máquina vertical;
- si no puede preservar la instantánea, no declara activación exitosa.

#### 4.9.3. Sustituir

Cuando `SUSTITUIR` o una acción equivalente exige nueva versión:

- crea sucesora;
- conserva predecesora;
- vincula ambas;
- la máquina vertical decide vigencia;
- el histórico permanece.

`AJUSTAR` puede o no generar nueva versión según el efecto concreto definido por M-10 y la vertical; B-06 no crea una regla paralela a la taxonomía aprobada.

#### 4.9.4. Registrar corrección

Cuando una operación vertical **registra corrección**:

- no modifica el original;
- crea Corrección trazable;
- mantiene la cadena;
- determina una vista efectiva solo si la cadena es válida;
- produce un evento reconstruible;
- cualquier recálculo posterior crea evidencia nueva.

---

### 4.10. Invariantes locales de B-06

Se incorporan al espacio normativo `INV-06-*` conforme a `CONV-06-06`.

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-11` | Una Versión emitida es inmutable. | Se modifica su contenido emitido sin nueva Versión o Corrección trazable permitida por el área. |
| `INV-06-12` | Toda sucesión conserva la predecesora. | Crear una sucesora reemplaza, borra o hace indistinguible a la predecesora. |
| `INV-06-13` | Una Instantánea reproducible referencia una Versión exacta y preserva lo emitido. | Se reconstruye retrospectivamente con datos actuales o cambia al modificarse una fuente posterior. |
| `INV-06-14` | Toda Corrección trazable posee original identificable. | Existe una corrección huérfana o el original deja de ser reconstruible. |
| `INV-06-15` | Una cadena confirmada de correcciones es acíclica y reconstruible. | Existe ciclo, salto no explicable o vínculo roto entre nodos. |
| `INV-06-16` | La vista efectiva nunca elimina ni sustituye la historia. | Obtener el valor/condición efectiva requiere borrar o mutar original/correcciones previas. |
| `INV-06-17` | Autoría histórica no se reasigna. | Una corrección, recálculo, importación o registro posterior cambia el autor atribuido al hecho previo. |
| `INV-06-18` | Ocurrencia y registro permanecen diferenciados. | Un único momento se utiliza como ambos sin evidencia de igualdad. |
| `INV-06-19` | Un recálculo o cambio de método produce evidencia nueva, no reescritura histórica. | Un resultado anterior cambia retroactivamente por corregir una entrada o cambiar método/especificación. |
| `INV-06-20` | Cierre, revocación, despublicación o sustitución no borran historia por efecto estructural propio. | Cualquiera de esos actos elimina por sí solo versiones, snapshots, correcciones o evidencia histórica. |

`INV-06-20` no decide retención. Si 08 define posteriormente una política legítima de conservación/eliminación, esa política deberá coordinarse expresamente sin convertir el evento operativo en borrado implícito.

---

### 4.11. Cobertura de deuda

#### 4.11.1. Las 31 unidades con propietario primario M-06

| Unidad | Deuda | Resolución en B-06 | Coordinación | Estado |
|---|---|---|---|---|
| `7.1-06` | versionado estructural | §5 | `áreas verticales` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.2-08` | representación de conservación histórica después del cierre | §9 / §10 | `M-01 / 08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.5-04` | preservación de evidencia histórica sin equiparar revocación con borrado | §9 / §10 | `08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.6-08` | invariante de no sobrescritura histórica | §9 / §10 | `M-07` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.7-09` | estructura de snapshot/instantánea reproducible | §6 | `M-07` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.7-10` | relación entre versión activa y versiones históricas | §9 / §10 | `M-07` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.7-11` | regla de sustitución sin sobrescribir | §9 / §10 | `M-07 / M-10` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.7-17` | editar catálogo o borrador después de activar no modifica la instantánea emitida | §9 / §10 | `M-07` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.8-06` | gestión de nueva versión cuando AJUSTAR o SUSTITUIR lo requieran | §5 | `M-10 / M-07 / M-08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.8-09` | estructura de corrección de una revisión | §7 | `M-10 / 08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.8-10` | preservación de revisión anterior e historia | §9 / §10 | `M-10` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.9-09` | snapshot de activación reutilizando el patrón común | §6 | `M-08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-06` | estructura de cadena de correcciones | §7 | `M-08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-07` | relación original → corrección → corrección sucesiva | §7 | `M-08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-08` | mecanismo para determinar la vista efectiva sin borrar originales | §7 | `M-11` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-09` | relación actor/fecha/motivo de cada corrección | §7 | `M-08 / 08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-10` | invariantes de no sobrescritura | §7 | `M-08` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.10-11` | estructura común de UC-I12 reutilizable por Entrenamiento y Antropometría | §7 | `M-08 / M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.11-13` | conservación/versionado de resultados anteriores | §9 / §10 | `M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.11-15` | relación original → corrección | §7 | `M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.11-21` | un recálculo no elimina el resultado anterior | §9 / §10 | `M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.11-22` | un método nuevo no reescribe cálculos históricos | §9 / §10 | `M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.12-04` | conservación histórica ante cambios de publicación | §9 / §10 | `M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.15-05` | conservación de autoría y procedencia | §8 | `M-11` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-01` | relaciones entre versiones | §5 | `M-07 / M-08 / M-09 / M-10` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-02` | entidades/eventos de corrección | §7 | `M-08 / M-09 / M-10` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-03` | cadena reconstruible de correcciones | §7 | `M-08 / M-09` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-04` | referencias a original y valor efectivo | §7 | `M-11` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-07` | preservar actor, autoría, ocurrencia, registro, procedencia, versión y relación sucesora | §8 | `M-11` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-08` | invariante contra sobrescritura silenciosa | §9 / §10 | `M-00` | `RESUELTA POR PATRÓN COMÚN`; instanciación específica queda en el área coordinada |
| `7.16-09` | política de auditoría y acceso al historial pertenece principalmente a 08 | §9 / §10 | `08` | `RESUELTA COMO FRONTERA`; M-06 fija preservación estructural y 08 conserva la política de auditoría/acceso |

**Resultado de cobertura primaria:** `31/31`.

La frase «instanciación específica queda en el área coordinada» significa que M-06 ya fija el patrón. El bloque vertical solo declara qué objeto concreto lo usa, qué acto lo dispara y qué restricciones adicionales de su dominio aplican; no puede redefinir inmutabilidad, cadena, autoría, procedencia ni resolución efectiva.

#### 4.11.2. Coordinación completa de `7.16-01…09`

| Unidad | Propietario primario | Tratamiento de B-06 |
|---|---|---|
| `7.16-01` | `M-06` | `RESUELTA` — §5.3 |
| `7.16-02` | `M-06` | `RESUELTA` — §7.1–7.2 |
| `7.16-03` | `M-06` | `RESUELTA` — §7.3 |
| `7.16-04` | `M-06` | `RESUELTA` — §7.4 |
| `7.16-05` | `M-04` | `COORDINADA` — B-06 conserva historia de los eventos; M-04 define cierre/continuidad |
| `7.16-06` | `M-11` | `COORDINADA` — B-06 preserva fuentes; M-11 construye historial longitudinal/proyección |
| `7.16-07` | `M-06` | `RESUELTA` — §5, §7 y §8 |
| `7.16-08` | `M-06` | `RESUELTA` — §4, §10 |
| `7.16-09` | `M-06` con frontera 08 | `RESUELTA COMO FRONTERA` — estructura aquí; política en 08 |

#### 4.11.3. `7.1-02`

`7.1-02 — estructura persistente conceptual` queda instanciada para M-06 mediante:

- identificadores estables;
- referencias explícitas entre original, versión, predecesora, snapshot y correcciones;
- conservación de actor, autoría, ocurrencia, registro y procedencia;
- inmutabilidad de hechos emitidos;
- reconstrucción determinista de historia y vista efectiva;
- ausencia de decisión sobre tecnología física.

#### 4.11.4. `7.1-06`

`7.1-06 — versionado estructural` queda `RESUELTA` mediante §5, §6, §9 y `INV-06-11…13`.

---

### 4.12. Matriz de reutilización por áreas posteriores

| Área | Reutiliza de B-06 | Debe agregar localmente |
|---|---|---|
| `M-01` | conservación histórica tras cierre | máquina de cuenta y efectos propios |
| `M-02` | Versiones para evidencia presentada | máquina de verificación, alcance y resoluciones |
| `M-03` | historia de consentimiento/vínculo referenciado | estructura de vínculo/alcance; política permanece en 08 |
| `M-05` | versionado de cambios de capacidad | cálculo y reglas de admisión |
| `M-07` | versión, sucesión, snapshot, no sobrescritura | evaluación/objetivo/plan nutricional y su máquina |
| `M-08` | versión, snapshot, Corrección trazable | planificación, ejecución y progresión |
| `M-09` | Corrección trazable, historia de resultados | medición, cálculo, dependencias, recálculo y comparabilidad |
| `M-10` | corrección de revisión y nueva versión posterior | revisión válida, taxonomía y próxima acción |
| `M-11` | fuentes históricas, vista efectiva, doble temporalidad | timeline y demás Proyecciones |
| `M-12` | preservación de resultados/especificaciones históricas | componentes TVCC-30 y frontera con Documento 12 |

---

### 4.13. Decisión técnica: nueva Versión vs Corrección trazable

| Situación | Mecanismo común | Razón |
|---|---|---|
| Cambio de contenido profesional después de una versión emitida | nueva `Versión` | representa continuidad/sustitución sin alterar lo emitido |
| Rectificación de un hecho histórico registrado | `Corrección trazable` | preserva original y explica qué cambió |
| Cambio de borrador antes de emitir, si el área lo permite | objeto mutable del área | todavía no existe una Versión emitida que proteger |
| Cambio de catálogo después de activar un plan | ninguno sobre la versión histórica | la Instantánea reproducible no se reconstruye |
| Corrección de medición con resultados derivados | Corrección trazable + resultados derivados nuevos | original y resultados previos permanecen |
| Cambio de método de cálculo | nueva especificación/resultado según M-09/M-12 | un método nuevo no reescribe cálculos históricos |
| Revocación o cierre | transición del área propietaria | no se representa como corrección y no borra historia |
| Error en una revisión profesional registrada | Corrección trazable si el caso/política lo admite | conserva revisión original y autorías |

---

### 4.14. Hallazgos y riesgos de B-06

#### 4.14.1. H-06-B06-01 — Alcance mínimo comunicado vs matriz primaria

La preparación inmediata de B-06 mencionó como núcleo `7.16-01…09`, `7.15-05` y `7.1-02`. La arquitectura aprobada, sin embargo, asigna **31 unidades primarias a M-06**, incluida `7.1-06`.

**Tratamiento:** no se altera el producto ni la arquitectura. B-06 fija el patrón una sola vez y traza las 31 unidades primarias. Las verticales posteriores instancian el patrón. Esto evita dejar deuda primaria M-06 sin propietario efectivo.

**Estado:** `TRATADO EN ESTE BORRADOR`.

#### 4.14.2. H-06-B06-02 — Archivo material de ACTA-DIR-009 no montado

La aprobación/habilitación está expresamente comunicada por Dirección, pero la copia material del acta no está disponible en esta ronda.

**Tratamiento:** no se atribuye hash ni literal de secciones no visibles. Antes de aprobación final de B-06 conviene adjuntar la copia material de ACTA-DIR-009 al handoff de contrarrevisión.

**Estado:** `NO BLOQUEA REDACCIÓN`; `PENDIENTE DE CUSTODIA PARA CIERRE`.

#### 4.14.3. R-06-B06-01 — Confundir «último registrado» con «efectivo»

**Mitigación:** `REG-06-16`; la relación de corrección gobierna la vista efectiva.

#### 4.14.4. R-06-B06-02 — Crear una máquina universal de versión

**Mitigación:** §3.4; los estados pertenecen al objeto vertical. M-06 aporta efectos comunes.

#### 4.14.5. R-06-B06-03 — Convertir preservación histórica en política de retención

**Mitigación:** §4.5 y `INV-06-20`; B-06 impide borrado implícito por eventos operativos, pero no decide retención.

---

### 4.15. Autoverificación falsable

| # | Control | Método | Resultado esperado |
|---|---|---|---|
| 1 | Fuentes reales con huella | recalcular SHA-256 | 5/5 coinciden |
| 2 | B-00 usado | verificar hash | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` |
| 3 | Arquitectura usada | verificar hash | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` |
| 4 | Cobertura M-06 primaria | extraer IDs de §11.1 | 31 IDs únicos / 31 esperados |
| 5 | `7.16-01…09` | extraer §11.2 | 9/9 |
| 6 | `7.1-02` y `7.1-06` | búsqueda determinista | ambos presentes y tratados |
| 7 | Términos ejecutados | búsqueda | T-06-20…24 presentes |
| 8 | Nuevos términos recurrentes | inspección | ninguno |
| 9 | Invariantes locales | extraer `INV-06-11…20` | 10/10 sin huecos |
| 10 | Condición de violación | inspección de §10 | 10/10 |
| 11 | Reglas locales | extraer `REG-06-11…18` | 8/8 sin huecos |
| 12 | Máquina universal inventada | búsqueda/inspección | ninguna |
| 13 | Frontera 08 | inspección | retención/acceso/auditoría no resueltos |
| 14 | M-11 | inspección | timeline tratado solo como proyección |
| 15 | No sobrescritura | búsqueda/inspección | versión, snapshot y corrección preservan historia |
| 16 | Doble temporalidad | búsqueda/inspección | ocurrencia ≠ registro |
| 17 | Autoría/procedencia | búsqueda/inspección | separación explícita |
| 18 | Git | evidencia de esta ronda | ninguna operación Git |

---

### 4.16. Criterio de cierre de B-06

B-06 será apto para aprobación cuando una contrarrevisión externa sobre **este archivo real** confirme como mínimo:

1. fidelidad a 04/05;
2. coherencia con B-00 v0.2.1;
3. cobertura 31/31 de deuda primaria M-06;
4. ausencia de redefinición en bloques verticales;
5. invariantes falsables;
6. separación de Versión / Instantánea reproducible / Corrección trazable;
7. determinación efectiva sin sobrescritura;
8. frontera intacta con 08 y M-11;
9. ausencia de modelo físico;
10. custodia suficiente de la habilitación de Dirección.

No se inicia B-01 hasta cerrar esta contrarrevisión y obtener aprobación de Dirección del bloque, conforme al régimen de un bloque por ronda.

---

### 4.17. Estado de salida

```text
BE-LEG-06 / B-06
ÁREA: M-06
VERSIÓN: v0.1.1

ESTADO:
BORRADOR CORREGIDO PARA CONTRARREVISIÓN CORTA

B-00 v0.2.1:
APROBADO Y VINCULANTE
SHA-256:
1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2

COBERTURA M-06 PRIMARIA:
31/31 TRATADA POR PATRÓN COMÚN

7.16-01…09:
9/9 TRAZADAS
7.16-05 / 7.16-06:
COORDINADAS, NO INVADIDAS

TÉRMINOS NUEVOS:
0

MÁQUINA UNIVERSAL NUEVA:
0

GIT:
SIN OPERACIONES

SIGUIENTE ACCIÓN:
CONTRARREVISIÓN CORTA DE B-06 v0.1.1 LIMITADA A LAS CORRECCIONES
```

---


---


## 5. B-01 — Identidad, perfil y ciclo de cuenta

*Fuente ensamblada: `BE_LEG_06_B01_v0_1_IDENTIDAD_PERFIL_Y_CICLO_DE_CUENTA.md` · SHA-256 `a9eff9d8da6c29ecbb2d50bd8ac59c47bfa2d805bbbad2e0789adf34584947dd`.*


### 5.1. Objeto

B-01 define la estructura conceptual de `M-01 — Identidad, perfil y ciclo de cuenta` para que BE conserve una identidad longitudinal única y separada de:

- perfil propio;
- perfil profesional;
- método de acceso;
- estado operativo de cuenta;
- especialidad;
- capacidad antropométrica transversal;
- verificación profesional;
- habilitación;
- vínculo;
- consentimiento;
- autorización.

B-01 fija:

1. `Identidad BE` como entidad persistente de dominio;
2. `Perfil propio` y su historia;
3. relación entre una identidad y uno o varios `Método de acceso`, sin identidad paralela;
4. máquina completa de `Estado operativo de cuenta`;
5. efectos estructurales de `Cierre de cuenta`;
6. estructura y máquina mínima de `Incidencia administrativa`;
7. estructura mínima de `Novedad interna`;
8. relación estructural de `Notificación push no sensible` con una novedad;
9. interfaz neutral de proveedor para `Recuperación de acceso`;
10. puntos de coordinación con `M-03`, `M-04`, `M-06`, 07, 08, 09 y 10.

B-01 **no** define credenciales, algoritmos de autenticación, verificación de identidad, sesión física, políticas de autorización, retención, auditoría, proveedores, contratos, navegación ni persistencia física.

---

### 5.2. Gobierno y fuentes

#### 5.2.1. Fuentes materiales verificadas

| Fuente | SHA-256 | Uso en B-01 |
|---|---|---|
| `ACTA_DIR_010_APROBACION_B06_Y_HABILITACION_B01.md` | `8b7dbb870d825dfd7fbb94bcbd87db0a84da55eb8284d85c917a584b3f878e5f` | habilitación y nueve condiciones de §6.2 |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | términos, convenciones, reglas raíz e invariantes vinculantes |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | Versión, historia, corrección, doble temporalidad y no sobrescritura |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | propietario `M-01`, siete unidades primarias y fronteras |
| `03_Modelo_de_Negocio.md` | `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` | §15 — cuenta del asesorado propia, persistente e independiente de un profesional |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-001…006, RF-017, RF-061/062, RF-068/069 y fronteras |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-P25/P26/P27/P28/P30, UC-E05/E06/E08/E09 y semántica aprobada |

#### 5.2.2. Estado de los bloques previos

- `B-00 v0.2.1`: **APROBADO Y CERRADO**.
- `B-06 v0.1.1`: **APROBADO Y CERRADO**.
- El patrón de M-06 se instancia y **no se redefine**.
- `B-01` no autoriza Git.
- No se abre `B-02` antes de contrarrevisión y aprobación de B-01.

---

### 5.3. Apertura conforme al protocolo de B-00

#### 5.3.1. Unidades primarias que salda

La arquitectura aprobada asigna a `M-01` exactamente estas siete unidades:

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.2-01` | estructura persistente de Identidad BE y perfil propio | `M-06` | — |
| `7.2-02` | estado operativo técnico de la cuenta y sus transiciones | `M-00` | — |
| `7.2-03` | relación entre identidad persistente y métodos de acceso, sin duplicar identidad | `08/09 para controles y credenciales` | — |
| `7.2-04` | persistencia conceptual del perfil y de su historia | `M-06` | — |
| `7.2-05` | efectos estructurales del cierre de cuenta | `M-04 / 08` | — |
| `7.2-06` | transición hacia cuenta cerrada/no operativa | `M-04` | — |
| `7.2-09` | reversibilidad y retención compartidas con 08, sin decisión unilateral de 06 | `08` | 06 solo modela referencias/efectos estructurales; la política se reserva a 08. |

**Cobertura objetivo primaria:** `7/7`.

`7.2-07` pertenece a `M-04` y `7.2-08` a `M-06`; B-01 los coordina en el cierre de cuenta, pero no los reclama como deuda primaria.

#### 5.3.2. Términos `PROPIETARIO-06` ejecutados

| Término | Mandato de B-00 | Tratamiento B-01 |
|---|---|---|
| `T-06-01 — Identidad BE` | entidad persistente, perfil y métodos sin duplicación | §4 |
| `T-06-02 — Estado operativo de cuenta` | enum y transiciones | §7 |
| `T-06-03 — Método de acceso` | relación método↔identidad, multiplicidad y no paralelismo | §6 |
| `T-06-04 — Perfil (propio / profesional)` | estructura e historia; relación con identidad | §5; B-02 conserva perfil profesional |
| `T-06-05 — Cierre de cuenta` | transición a cuenta cerrada/no operativa y efectos estructurales | §8 |
| `T-06-06 — Incidencia administrativa` | ciclo de vida técnico | §10 |
| `T-06-07 — Novedad interna` | estructura mínima y consulta | §11 |
| `T-06-08 — Notificación push no sensible` | referencia a novedad y contenido mínimo no sensible | §11.4 |

#### 5.3.3. Mandatos terminológicos sin fila `7.2-*` exacta

La arquitectura posee siete unidades primarias `M-01`, pero `T-06-06`, `T-06-07` y `T-06-08` no tienen una fila `7.2-*` propia.

B-00 §11.2 obliga a hacer visible esta relación cuando un término `PROPIETARIO-06` no tenga unidad exacta. ACTA-DIR-010 ordena ejecutar esos términos en B-01.

**Decisión de trazabilidad:**

- se modelan en B-01 porque su propietario es `M-01`;
- **no** se inventan identificadores `7.2-*` adicionales;
- **no** se aumenta artificialmente el conteo `7/7`;
- se auditan como **mandatos terminológicos complementarios**;
- B-13 deberá comprobar tanto las siete unidades primarias como estos tres mandatos.

Esto es una reconciliación de trazabilidad, no un cambio de producto.

#### 5.3.4. Términos recurrentes nuevos

`NINGUNO`.

B-01 utiliza únicamente vocabulario aprobado por B-00/04/05. Los nombres de eventos locales describen hechos consumados y no crean términos canónicos nuevos.

#### 5.3.5. Máquinas instanciadas

B-01 instancia dos máquinas conforme a `CONV-06-03`:

1. `Estado operativo de cuenta` — §7.
2. `Incidencia administrativa` — §10.3.

No se crea máquina para:

- `Identidad BE`, porque su identidad longitudinal no es un ciclo de estados;
- `Versión de Perfil propio`, porque reutiliza B-06;
- `Método de acceso`, porque su mecanismo/validez técnica pertenece a 08/09;
- `Novedad interna`, porque 04/05 no aprobaron un ciclo de publicación/edición;
- `Notificación push no sensible`, porque proveedor/transporte pertenecen a 07/09.

#### 5.3.6. Fronteras `DERIVADO`

| Materia | Propietario fuera de B-01 |
|---|---|
| credenciales, verificación de identidad, política de acceso, revocación, retención, auditoría | `08` |
| sesión y mecanismos/proveedores/canales técnicos | `07` y `08` según responsabilidad |
| contratos de autenticación/federación/recuperación | `09` |
| formularios, navegación, visualización de estados y mensajes | `10` |
| perfil profesional, especialidad, capacidad transversal, verificación y habilitación | `B-02 / M-02` |
| vínculos | `B-03 / M-03` |
| efectos sobre procesos y cierre funcional | `B-04 / M-04` |
| historia/versiones/correcciones comunes | `B-06 / M-06` |

---

### 5.4. Identidad BE (`T-06-01`)

#### 5.4.1. Naturaleza

`Identidad BE` es la entidad longitudinal estable que designa a una persona/actor dentro del dominio BE.

Su existencia:

- no depende de un profesional concreto;
- no depende de una especialidad;
- no depende de un paquete comercial;
- no se reemplaza al cambiar un método de acceso;
- no se duplica por usar acceso local y federado;
- no concede por sí sola capacidades ni acceso a terceros.

La identidad se reconoce a través del tiempo por su `Identificador de dominio`, conforme a `REG-06-01`.

#### 5.4.2. Estructura conceptual mínima

La identidad conserva como mínimo:

| Elemento conceptual | Regla |
|---|---|
| identificador de dominio | estable, único y no reutilizable |
| referencia a perfil propio | exactamente una después de un registro exitoso |
| referencias a métodos de acceso | cero o más relaciones históricas; una o más rutas utilizables según el contexto operativo |
| estado operativo de cuenta | exactamente uno de la máquina de §7 |
| autoría de creación | quién confirmó/produjo el alta |
| momento de ocurrencia | cuándo se confirmó el alta |
| momento de registro | cuándo BE registró el alta |
| procedencia | origen funcional del alta o asociación controlada |

No se fija tipo físico, formato de identificador ni mecanismo de credenciales.

#### 5.4.3. Criterio de unicidad

**`REG-06-19` — Alta sin identidad paralela.** Antes de crear una nueva Identidad BE, el recorrido de alta debe evaluar, mediante las reglas de identidad y acceso propietarias de 08/09, si el método o referencia presentada ya corresponde a una identidad existente.

- si la correspondencia es inequívoca, se conserva la identidad existente;
- si existe ambigüedad, no se fusiona ni crea silenciosamente una identidad paralela;
- coincidencia de atributos humanos por sí sola no establece identidad;
- después de creada, solo el identificador de dominio determina que dos referencias designan la misma entidad.

Esto preserva simultáneamente RF-001 y `REG-06-01`.

#### 5.4.4. Identidad ≠ dimensiones funcionales

B-01 reafirma `INV-06-01`:

```text
Identidad BE
≠ Perfil profesional
≠ Especialidad
≠ Capacidad antropométrica transversal
≠ Verificación profesional
≠ Habilitación
≠ Vínculo
≠ Consentimiento vigente
≠ Autorización contextual
```

Registrar una identidad nunca concede ninguna de esas dimensiones.

---

### 5.5. Perfil propio (`T-06-04`)

#### 5.5.1. Relación con Identidad BE

Para toda Identidad BE creada exitosamente por UC-P25 existe **exactamente un Perfil propio** asociado.

El perfil:

- pertenece a su titular, no a un profesional;
- puede existir sin vínculo activo;
- no es perfil clínico;
- no es perfil profesional;
- no concede acceso a terceros;
- conserva historia.

El `Perfil profesional` es una dimensión posterior de `M-02`; nunca crea una segunda Identidad BE ni sustituye el Perfil propio.

#### 5.5.2. Estructura conceptual

B-01 fija únicamente la estructura necesaria y **no inventa datos personales que 04/05 no aprobaron**:

| Elemento conceptual | Regla |
|---|---|
| identificador del Perfil propio | estable |
| referencia a Identidad BE | exactamente una |
| referencia a Versión efectiva de perfil | exactamente una cuando existe contenido confirmado |
| historia de versiones | cero o más versiones previas conservadas |
| autoría/procedencia | preservadas por cada versión |

El contenido personal concreto, su minimización y la interacción de captura no se fijan en este bloque cuando 04/05 no determinan el dato.

#### 5.5.3. Instanciación de B-06

**`REG-06-20` — Historia del Perfil propio.** Cada modificación confirmada del contenido de Perfil propio emite una nueva `Versión` conforme a B-06.

- la versión previa permanece inmutable;
- la nueva versión referencia a su predecesora;
- las ramas no están admitidas en M-01;
- ante una bifurcación, la versión efectiva queda no resoluble automáticamente;
- Perfil propio no requiere `Instantánea reproducible` adicional;
- cerrar la cuenta no borra las versiones.

B-01 **instancia** B-06; no redefine Versión, autoría, procedencia ni doble temporalidad.

---

### 5.6. Método de acceso (`T-06-03`)

#### 5.6.1. Relación estructural

`Método de acceso` es un mecanismo asociado a una Identidad BE para demostrar acceso. B-01 solo modela la relación; credenciales, secretos, verificadores, vigencias y proveedores pertenecen a 08/09/07.

Multiplicidad estructural:

```text
Identidad BE 1 ───── 0..N Método de acceso
Método de acceso vigente ───── como máximo 1 Identidad BE
```

Una identidad puede utilizar más de un método. Local y federado son modalidades funcionales ya aprobadas; B-01 no fija proveedor obligatorio.

#### 5.6.2. Asociación y retiro

**`REG-06-21` — Asociación de método sin duplicar identidad.**

Asociar un método:

1. referencia una Identidad BE ya existente o un alta controlada que terminará en una única identidad;
2. no crea roles, especialidades, vínculos ni autorizaciones;
3. no fusiona identidades ambiguas;
4. registra el hecho `MétodoDeAccesoAsociado` con actor, ocurrencia, registro y procedencia.

Retirar un método:

1. no elimina la identidad;
2. no modifica el Perfil propio;
3. no modifica vínculos/consentimientos;
4. preserva la historia de la relación;
5. registra `MétodoDeAccesoRetirado`.

#### 5.6.3. Última ruta utilizable

**`REG-06-22` — No provocar pérdida silenciosa de acceso.** Una operación voluntaria de retiro no puede dejar una cuenta no cerrada sin:

- al menos un método utilizable; **o**
- una alternativa de recuperación previamente habilitada conforme a 08/09.

B-01 no define cómo se demuestra que una ruta es utilizable.

---

### 5.7. Máquina de Estado operativo de cuenta (`T-06-02`)

#### 5.7.1. Entidad propietaria

La máquina pertenece a:

`Identidad BE — dimensión Estado operativo de cuenta`.

No se crea una entidad paralela “Cuenta” únicamente para guardar estado.

#### 5.7.2. Conjunto cerrado

```text
OPERATIVA
SUSPENDIDA
CERRADA
```

- **Estado inicial tras un registro exitoso:** `OPERATIVA`.
- **Estado terminal bajo el modelo vigente de M-01:** `CERRADA`.

La eventual reversibilidad de `CERRADA` **no se decide en B-01**. Mientras 08 no establezca una política aprobada y no exista reconciliación documental, ninguna transición de salida de `CERRADA` forma parte de la lista blanca.

#### 5.7.3. Semántica

| Estado | Semántica estructural |
|---|---|
| `OPERATIVA` | el estado de cuenta no bloquea por sí mismo el intento de nueva sesión/operación; la autorización sigue evaluándose por separado |
| `SUSPENDIDA` | bloquea nuevas sesiones y operaciones mientras persista la condición aplicable; identidad e historia permanecen |
| `CERRADA` | bloquea nuevas sesiones y operaciones por cierre confirmado; identidad, autoría e historia permanecen |

`OPERATIVA` no significa “profesional verificado”, “habilitado” ni “autorizado”.

#### 5.7.4. Lista blanca de transiciones

| Transición | Origen → destino | Actor habilitante | Condiciones | Efectos | Evento |
|---|---|---|---|---|---|
| `SuspenderCuenta` | `OPERATIVA → SUSPENDIDA` | actor/servicio habilitado por la política de 08 | existe fundamento válido según política posterior | bloquea nuevos accesos/operaciones sin borrar identidad o historia | `CuentaSuspendida` |
| `RestablecerCuenta` | `SUSPENDIDA → OPERATIVA` | actor/servicio habilitado por 08 | cesó o fue resuelta la condición de suspensión según política | retira el bloqueo propio del estado; no concede otras capacidades | `CuentaRestablecida` |
| `CerrarCuenta` | `OPERATIVA → CERRADA` | titular autorizado | sesión/autorización aplicables, consecuencias presentadas y confirmación explícita | aplica §8 y emite el cierre | `CuentaCerrada` |

**Toda transición no declarada está prohibida.**

No se declara `SUSPENDIDA → CERRADA` porque UC-P27 exige un titular con sesión válida y 04/05 no aprobaron un recorrido alternativo de cierre desde suspensión.

#### 5.7.5. Eventos

Los tres eventos de la máquina son hechos inmutables y conservan:

- actor;
- autoría;
- momento de ocurrencia;
- momento de registro;
- procedencia;
- estado anterior;
- estado resultante.

Esto reutiliza `CONV-06-05` y B-06.

#### 5.7.6. Regla de acceso

**`REG-06-23` — Estado operativo no equivale a autorización.**

- `OPERATIVA` solo elimina el bloqueo propio de cuenta;
- una sesión válida identifica al actor;
- toda operación protegida sigue dependiendo de `UC-I02`/08;
- `SUSPENDIDA` o `CERRADA` impiden crear nuevas sesiones;
- la interfaz nunca convierte visibilidad en autorización.

---

### 5.8. Cierre de cuenta (`T-06-05`)

#### 5.8.1. Acto estructural

**`REG-06-24` — Cierre no destructivo.** `CerrarCuenta` produce un cambio operativo y eventos derivados, no un borrado histórico.

El cierre debe:

1. dejar `Estado operativo de cuenta = CERRADA`;
2. impedir nuevas sesiones;
3. impedir nuevas operaciones;
4. hacer que las sesiones activas dejen de ser utilizables conforme a 07/08;
5. solicitar la finalización trazable de vínculos activos mediante las máquinas que definan `M-03/M-04`;
6. preservar Identidad BE;
7. preservar Perfil propio y sus versiones;
8. preservar autorías e historia;
9. no borrar revisiones, planes, mediciones ni decisiones;
10. registrar `CuentaCerrada`.

B-01 no define el mecanismo de invalidación de sesión ni las transiciones de vínculo/proceso: declara el **efecto requerido de coordinación** para sus bloques propietarios.

#### 5.8.2. Cierre y B-06

El cierre instancia `INV-06-20`:

> cerrar una cuenta no borra historia por efecto estructural propio.

La historia anterior continúa siendo reconstruible desde sus fuentes de dominio.

#### 5.8.3. Retención y reversibilidad (`7.2-09`)

**`REG-06-25` — Frontera de cierre.**

B-01 no decide:

- cuánto se conserva;
- qué puede suprimirse legal/operativamente;
- qué lectura residual permanece;
- si una cuenta cerrada puede reabrirse;
- quién puede autorizar una eventual reversión.

Estas decisiones pertenecen a 08.

Hasta que exista política aprobada y reconciliación con esta máquina, `CERRADA` no posee transición de salida ejecutable en M-01.

---

### 5.9. Recuperación de acceso — término `REFERENCIADO`

B-01 no redefine `Recuperación de acceso` ni `Recuperación asistida documentada`; aplica su conducta aprobada.

#### 5.9.1. Neutralidad de proveedor

**`REG-06-26` — Recuperación neutral.**

Toda recuperación:

- referencia una Identidad BE existente;
- no presume correo;
- no presume SMS;
- no presume Google ni otro proveedor;
- no crea una identidad nueva;
- no crea ni entrega una sesión antes de completar la verificación exigida por 08/09;
- si es exitosa, permite establecer/asociar un método local utilizable;
- si la automatización se difiere, puede continuar como recuperación asistida documentada sin sesión manual.

La estructura no contiene un canal obligatorio.

#### 5.9.2. Frontera

B-01 no fija:

- token de recuperación;
- duración;
- número de intentos;
- factor de verificación;
- canal;
- proveedor;
- procedimiento probatorio del soporte.

---

### 5.10. Incidencia administrativa (`T-06-06`)

#### 5.10.1. Naturaleza

`Incidencia administrativa` es un registro trazable de soporte/gobierno limitado, no:

- chat general;
- nota de coordinación profesional;
- caso propietario de corrección de un dato de dominio;
- diagnóstico;
- autorización para acceder a información ajena.

#### 5.10.2. Estructura conceptual mínima

| Elemento conceptual | Regla |
|---|---|
| identificador | estable |
| reportante | exactamente una Identidad BE |
| categoría | descriptor del motivo; B-01 no inventa taxonomía cerrada |
| estado | exactamente uno de §10.3 |
| responsable administrativo | cero o una referencia vigente; acceso según 08 |
| contexto mínimo | solo lo necesario para comprender el problema |
| resolución | ausente hasta que exista evidencia de resolución |
| historia de seguimiento | inmutable y ordenable por ocurrencia/registro |
| autoría/procedencia | preservadas por cada hecho |

#### 5.10.3. Máquina de estados

Entidad propietaria: `Incidencia administrativa`.

Conjunto cerrado:

```text
ABIERTA
EN_SEGUIMIENTO
RESUELTA
```

- Estado inicial: `ABIERTA`.
- Estado terminal: `RESUELTA`.

Lista blanca:

| Transición | Origen → destino | Actor habilitante | Condiciones | Efectos | Evento |
|---|---|---|---|---|---|
| `IniciarSeguimiento` | `ABIERTA → EN_SEGUIMIENTO` | administrador autorizado | incidencia visible/autorizada; existe acción de seguimiento | preserva original y registra primer seguimiento | `IncidenciaEnSeguimiento` |
| `ResolverIncidencia` | `ABIERTA → RESUELTA` | administrador autorizado | existe evidencia suficiente de resolución | fija resolución sin alterar datos de dominio | `IncidenciaResuelta` |
| `ResolverIncidencia` | `EN_SEGUIMIENTO → RESUELTA` | administrador autorizado | existe evidencia suficiente de resolución | conserva todo seguimiento previo y fija resolución | `IncidenciaResuelta` |

Mientras está `EN_SEGUIMIENTO`, pueden agregarse hechos `SeguimientoDeIncidenciaRegistrado` sin crear un estado nuevo.

No existe reapertura en esta versión porque 04/05 no aprobaron esa conducta.

#### 5.10.4. Reglas

**`REG-06-27` — Soporte no modifica el dominio propietario.** Resolver una incidencia no cambia por sí mismo una identidad, perfil, vínculo, consentimiento, plan, medición, revisión u otro dato propietario. Si el problema requiere una operación de dominio, la incidencia referencia/deriva al caso correspondiente.

**`REG-06-28` — Historia de incidencia por adición.** Seguimientos y resolución se agregan como hechos; ningún seguimiento anterior se sobrescribe.

El acceso del reportante y administrador se decide en 08.

---

### 5.11. Novedad interna y Notificación push no sensible

#### 5.11.1. Novedad interna (`T-06-07`)

`Novedad interna` representa contenido operativo **no clínico** consultable desde el centro interno de BE.

Estructura conceptual mínima:

| Elemento conceptual | Regla |
|---|---|
| identificador | estable |
| contenido autorizado | no clínico y no sensible según política |
| fuente o autoría | identificable |
| momento de publicación/ocurrencia | conservado |
| momento de registro | conservado cuando difiera |
| audiencia | referencia estructural para que 08 evalúe visibilidad |
| procedencia | conservada |

B-01 no define un ciclo de edición/publicación porque 04/05 no lo aprobaron como máquina.

#### 5.11.2. Consulta

**`REG-06-29` — Centro interno como fuente funcional de consulta.**

- una novedad autorizada es consultable aunque Push no esté disponible;
- consultar no modifica otros dominios;
- la audiencia no se amplía silenciosamente;
- el acceso final se evalúa por 08;
- cualquier registro de consulta requerido por política conserva doble temporalidad.

#### 5.11.3. Contenido

Una Novedad interna:

- no es alerta clínica;
- no es diagnóstico;
- no es Nota de coordinación autorizada;
- no contiene información de salud protegida de terceros;
- no concede acceso adicional.

#### 5.11.4. Notificación push no sensible (`T-06-08`)

La Notificación push no sensible se modela **solo como referencia estructural** a una Novedad interna.

Multiplicidad:

```text
Novedad interna 1 ───── 0..N referencias de Notificación push no sensible
cada Notificación push no sensible ───── exactamente 1 Novedad interna
```

**`REG-06-30` — Push mínimo y no autoritativo.**

El aviso:

- informa únicamente que existe una novedad o equivalente mínimo;
- no contiene datos de salud;
- no contiene nombres de asesorados;
- no contiene mediciones, planes, diagnósticos ni notas profesionales;
- no permite inferir contenido protegido;
- no concede acceso;
- no reemplaza el centro interno;
- si el canal falla, la Novedad interna permanece disponible.

Proveedor, transporte, preferencia de canal y contrato quedan en 07/09/10/08 según corresponda.

---

### 5.12. Relaciones y multiplicidades de M-01

| Relación | Multiplicidad | Condición |
|---|---|---|
| Identidad BE — Perfil propio | `1 : 1` tras registro exitoso | Perfil propio no crea identidad paralela |
| Identidad BE — Versión de Perfil propio | `1 : 1..N` a través del Perfil propio | una efectiva; previas preservadas |
| Identidad BE — Método de acceso | `1 : 0..N` | cada método vigente se asocia como máximo a una identidad |
| Identidad BE — Estado operativo de cuenta | `1 : 1` | token de la máquina de §7 |
| Identidad BE — Incidencia administrativa como reportante | `1 : 0..N` | acceso/visibilidad en 08 |
| Incidencia administrativa — responsable administrativo | `1 : 0..1` vigente | asignación/política en 08 |
| Novedad interna — referencia push | `1 : 0..N` | cada aviso referencia una sola novedad |

No se modela Perfil profesional como hijo de Perfil propio. Ambos se relacionan con la misma Identidad BE desde áreas distintas.

---

### 5.13. Eventos locales de M-01

Los eventos locales reutilizan el envelope de B-06/`CONV-06-05`: actor, autoría, ocurrencia, registro y procedencia.

| Evento | Hecho representado |
|---|---|
| `IdentidadCreada` | alta confirmada de una identidad única |
| `PerfilPropioVersionado` | nueva versión confirmada del Perfil propio |
| `MétodoDeAccesoAsociado` | relación de acceso agregada a una identidad |
| `MétodoDeAccesoRetirado` | relación retirada sin eliminar identidad |
| `CuentaSuspendida` | transición a `SUSPENDIDA` |
| `CuentaRestablecida` | transición a `OPERATIVA` desde suspensión |
| `CuentaCerrada` | cierre confirmado |
| `IncidenciaRegistrada` | creación en `ABIERTA` |
| `IncidenciaEnSeguimiento` | inicio formal de seguimiento |
| `SeguimientoDeIncidenciaRegistrado` | seguimiento adicional |
| `IncidenciaResuelta` | resolución con evidencia |

La consulta de una Novedad interna se registra solo si la política aplicable lo exige; B-01 no crea una obligación de auditoría que pertenece a 08.

---

### 5.14. Invariantes locales

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-21` | Un método de acceso no crea una Identidad BE paralela. | asociar local/federado produce una segunda identidad para el mismo vínculo inequívoco de acceso. |
| `INV-06-22` | Una Identidad BE registrada exitosamente posee un único Perfil propio. | existen cero o más de un Perfil propio tras un alta exitosa. |
| `INV-06-23` | La historia del Perfil propio se preserva mediante B-06. | editar el perfil sobrescribe una versión confirmada o elimina una predecesora. |
| `INV-06-24` | Un método de acceso vigente referencia como máximo una Identidad BE. | el mismo método vigente queda asociado simultáneamente a identidades diferentes sin resolución controlada. |
| `INV-06-25` | Cambiar un método de acceso no altera dimensiones funcionales ajenas. | agregar/retirar método cambia especialidad, vínculo, consentimiento, habilitación o autorización. |
| `INV-06-26` | Un retiro voluntario no deja silenciosamente una cuenta no cerrada sin ruta utilizable o recuperación aprobada. | el propio cambio de métodos produce una cuenta inaccesible sin alternativa confirmada. |
| `INV-06-27` | `OPERATIVA` no concede facultades de otra dimensión. | el estado de cuenta se usa como sustituto de rol, especialidad, vínculo, consentimiento o autorización. |
| `INV-06-28` | `SUSPENDIDA` y `CERRADA` bloquean nuevas sesiones. | se crea una nueva sesión mientras la identidad está en uno de esos estados. |
| `INV-06-29` | Cerrar una cuenta preserva identidad, autoría e historia. | `CerrarCuenta` borra o reasigna identidad, versiones, revisiones o evidencia histórica por efecto propio. |
| `INV-06-30` | La resolución de una incidencia preserva toda su secuencia. | resolver sobrescribe el registro original o seguimientos anteriores. |
| `INV-06-31` | Una incidencia administrativa no modifica directamente un dato de dominio propietario. | soporte cambia identidad, vínculo, plan, medición u otro dominio como efecto implícito de “resolver”. |
| `INV-06-32` | Una Novedad interna es no clínica y respeta audiencia. | se publica/consulta como novedad contenido clínico, sensible o fuera de la audiencia autorizada. |
| `INV-06-33` | Una Notificación push no sensible referencia una Novedad interna y no concede acceso. | el push contiene contenido protegido, funciona como fuente completa o permite acceso sin autorización. |
| `INV-06-34` | La recuperación de acceso es neutral de proveedor. | la estructura exige correo, SMS, Google u otro proveedor como única ruta. |

Estos invariantes complementan y no sustituyen `INV-06-01…20`.

---

### 5.15. Reglas locales consolidadas

B-01 incorpora al espacio `REG-06-*` las reglas:

- `REG-06-19` — Alta sin identidad paralela.
- `REG-06-20` — Historia del Perfil propio.
- `REG-06-21` — Asociación de método sin duplicar identidad.
- `REG-06-22` — No provocar pérdida silenciosa de acceso.
- `REG-06-23` — Estado operativo no equivale a autorización.
- `REG-06-24` — Cierre no destructivo.
- `REG-06-25` — Frontera de cierre.
- `REG-06-26` — Recuperación neutral.
- `REG-06-27` — Soporte no modifica el dominio propietario.
- `REG-06-28` — Historia de incidencia por adición.
- `REG-06-29` — Centro interno como fuente funcional de consulta.
- `REG-06-30` — Push mínimo y no autoritativo.

No se redefine `REG-06-01…18`.

---

### 5.16. Cobertura de las siete unidades primarias

| Unidad | Resolución en B-01 | Estado |
|---|---|---|
| `7.2-01` | §4 Identidad BE + §5 Perfil propio + §12 relaciones | `RESUELTA` |
| `7.2-02` | §7 enum técnico y máquina completa | `RESUELTA` |
| `7.2-03` | §6 relación método↔identidad y multiplicidades | `RESUELTA` |
| `7.2-04` | §5.3 instancia B-06 para historia de Perfil propio | `RESUELTA` |
| `7.2-05` | §8 efectos estructurales del cierre | `RESUELTA` |
| `7.2-06` | §7.4 transición `CerrarCuenta` y lista blanca | `RESUELTA` |
| `7.2-09` | §8.3 frontera explícita con 08 | `RESUELTA COMO FRONTERA` |

**Resultado:** `7/7`.

#### 5.16.1. Coordinaciones no apropiadas

| Unidad | Propietario | Tratamiento |
|---|---|---|
| `7.2-07` | `M-04` | B-01 emite/declara efectos de cierre; M-04 define efectos exactos sobre procesos y coordinación funcional |
| `7.2-08` | `M-06` | B-01 reutiliza `INV-06-20` y preservación histórica; no redefine el patrón |

#### 5.16.2. Mandatos terminológicos complementarios

| Término | Fuente funcional | Resolución |
|---|---|---|
| `T-06-06 — Incidencia administrativa` | RF-068 / UC-P28 | §10 |
| `T-06-07 — Novedad interna` | RF-061 / UC-P30 | §11.1–11.3 |
| `T-06-08 — Notificación push no sensible` | RF-062 / UC-E08 | §11.4 |

No se contabilizan como nuevas unidades `7.2-*`.

---

### 5.17. Interfaz con bloques posteriores

#### 5.17.1. B-02 / M-02

B-02 recibe:

- una Identidad BE estable;
- un Perfil propio ya separado;
- no recibe roles implícitos por el alta;
- debe adjuntar Perfil profesional, especialidad, capacidad transversal, verificación y habilitación a la misma identidad sin fusionarlas.

#### 5.17.2. B-03 / M-03

Los vínculos referencian Identidades BE. Cerrar una cuenta obliga a producir coordinación de finalización, pero la máquina exacta del vínculo pertenece a B-03/B-04.

#### 5.17.3. B-04 / M-04

M-04 debe consumir `CuentaCerrada` para resolver efectos sobre procesos y continuidad sin borrar historia.

#### 5.17.4. B-06 / M-06

B-01 reutiliza:

- Versionado para Perfil propio;
- inmutabilidad de eventos;
- doble temporalidad;
- autoría/procedencia;
- `INV-06-20`.

No redefine nada de ese patrón.

#### 5.17.5. Documento 08

08 conserva autoridad sobre:

- seguridad de credenciales;
- verificación de identidad;
- política de suspensión/restablecimiento;
- autorización contextual;
- acceso a incidencias/novedades;
- retención;
- auditoría;
- eventual reversibilidad de cuenta cerrada.

#### 5.17.6. Documentos 07, 09 y 10

- 07: proveedores/canales/mecanismos de sesión e integración técnica.
- 09: contratos de acceso federado, recuperación y otras interfaces.
- 10: formularios, navegación, centro de novedades y presentación.

---

### 5.18. Hallazgos y riesgos

#### 5.18.1. H-06-B01-01 — Mandatos M-01 sin unidad exacta en la arquitectura

`T-06-06`, `T-06-07` y `T-06-08` son `PROPIETARIO-06` de M-01 en B-00, pero la matriz de arquitectura no les asigna una fila de deuda `7.2-*`.

**Tratamiento:** §3.3 y §16.2. Se ejecutan sin inventar deuda nueva. B-13 deberá auditarlos como cobertura terminológica separada.

**Estado:** `TRATADO — NO BLOQUEANTE POR ACTA-DIR-010`.

#### 5.18.2. R-06-B01-01 — Convertir cuenta operativa en autorización global

**Mitigación:** `REG-06-23` + `INV-06-27`.

#### 5.18.3. R-06-B01-02 — Duplicar identidad al asociar acceso federado

**Mitigación:** `REG-06-19`, `REG-06-21`, `INV-06-21/24`.

#### 5.18.4. R-06-B01-03 — Cierre destructivo

**Mitigación:** `REG-06-24/25`, `INV-06-29`, B-06 `INV-06-20`.

#### 5.18.5. R-06-B01-04 — Decidir reversibilidad antes de 08

**Mitigación:** `7.2-09` queda `RESUELTA COMO FRONTERA`; no hay transición de salida ejecutable desde `CERRADA` sin reconciliación posterior.

#### 5.18.6. R-06-B01-05 — Soporte como backdoor de escritura

**Mitigación:** `REG-06-27`, `INV-06-31`.

---

### 5.19. Verificación de las nueve condiciones de ACTA-DIR-010 §6.2

| # | Condición | Evidencia B-01 |
|---:|---|---|
| 1 | Instanciar B-06, no redefinir | §5.3, §8.2, §17.4 |
| 2 | máquina completa con lista blanca | §7 y §10.3 |
| 3 | preservar `INV-06-01` | §4.4 |
| 4 | preservar `INV-06-20` | §8.2 |
| 5 | no apropiarse de seguridad/acceso/retención/auditoría; proveedores/canales fuera | §3.6, §8.3, §9.2, §17.5–17.6 |
| 6 | no persistencia física | todo el bloque; §20 detector |
| 7 | recuperación neutral de proveedor | §9 |
| 8 | protocolo B-00 + autoverificación falsable | §3, §20 |
| 9 | un bloque por ronda | §21 |

**Resultado documental esperado:** `9/9`.

---

### 5.20. Autoverificación falsable

| # | Control | Método | Resultado esperado |
|---:|---|---|---|
| 1 | fuentes materiales | recalcular SHA-256 | `7/7` |
| 2 | unidades primarias M-01 | extraer arquitectura y §16 | `7/7`, mismos IDs |
| 3 | términos M-01 | buscar `T-06-01…08` | `8/8` tratados |
| 4 | términos nuevos | inspección | `0` |
| 5 | máquina de cuenta | extraer estados | exactamente `OPERATIVA/SUSPENDIDA/CERRADA` |
| 6 | lista blanca de cuenta | extraer transiciones | exactamente 3 filas |
| 7 | salida desde `CERRADA` | inspección | `0` transiciones ejecutables |
| 8 | máquina de incidencia | extraer estados | `ABIERTA/EN_SEGUIMIENTO/RESUELTA` |
| 9 | transiciones de incidencia | extraer | 3 filas; `RESUELTA` terminal |
| 10 | continuidad de REG | extraer `REG-06-19…30` | `12/12`, sin huecos |
| 11 | continuidad de INV | extraer `INV-06-21…34` | `14/14`, sin huecos |
| 12 | condiciones de violación | inspección §14 | `14/14` no vacías |
| 13 | B-06 | comprobar no redefinición de Versión/Corrección | instancia, no redefine |
| 14 | `7.2-09` | inspección | frontera con 08 |
| 15 | recuperación | detector | ninguna ruta obligatoria por correo/SMS/proveedor |
| 16 | persistencia física | detector de léxico físico | `0` decisiones físicas |
| 17 | soporte | inspección | incidencia no modifica dominio |
| 18 | novedades/push | inspección | centro interno independiente de push; push no concede acceso |
| 19 | ACTA-DIR-010 §6.2 | tabla §19 | `9/9` |
| 20 | Git | evidencia de la ronda | `SIN OPERACIONES` |

Todo fallo real de estos controles debe publicarse en la auditoría; no se elimina del registro de ejecución.

---

### 5.21. Criterio de cierre de B-01

B-01 será apto para aprobación cuando una contrarrevisión externa sobre el archivo real confirme:

1. siete unidades primarias `M-01` cubiertas sin extras;
2. ejecución explícita de `T-06-01…08`;
3. manejo transparente de los tres mandatos sin fila exacta;
4. máquina de cuenta completa y sin facultades implícitas;
5. cierre no destructivo;
6. separación identidad/perfil/método/dimensiones profesionales;
7. recuperación neutral;
8. ciclo de incidencia mínimo y no invasivo;
9. novedad/push no sensible y no autoritativo;
10. instanciación correcta de B-06;
11. fronteras con 07/08/09/10 intactas;
12. ausencia de persistencia física;
13. autoverificación reproducible;
14. cero operación Git.

No se inicia B-02 antes de esa contrarrevisión y aprobación de Dirección.

---

### 5.22. Estado de salida

```text
BE-LEG-06 / B-01
ÁREA: M-01
VERSIÓN: v0.1

ESTADO:
BORRADOR TÉCNICO PARA CONTRARREVISIÓN EXTERNA

B-00 v0.2.1:
APROBADO Y VINCULANTE

B-06 v0.1.1:
APROBADO Y VINCULANTE — INSTANCIADO SIN REDEFINIR

COBERTURA PRIMARIA M-01:
7/7

MANDATOS TERMINOLÓGICOS COMPLEMENTARIOS:
T-06-06 / T-06-07 / T-06-08 — TRATADOS

MÁQUINAS:
ESTADO OPERATIVO DE CUENTA — DECLARADA
INCIDENCIA ADMINISTRATIVA — DECLARADA

TÉRMINOS NUEVOS:
0

GIT:
SIN OPERACIONES

SIGUIENTE ACCIÓN:
CONTRARREVISIÓN EXTERNA DE B-01 v0.1
```

---


---


## 6. B-02 — Perfil profesional, verificación y habilitación

*Fuente ensamblada: `BE_LEG_06_B02_v0_1_1_PERFIL_PROFESIONAL_VERIFICACION_Y_HABILITACION.md` · SHA-256 `03f220bd428d5abe429e41714981ba49adefa6870e24358e03856ba8b12d058e`.*


### 6.1. Objeto

B-02 modela `Perfil profesional`, `Especialidad`, `Capacidad antropométrica transversal`, `Alcance`, `Solicitud de verificación`, evidencia versionada, `Verificación profesional`, `Observación / subsanación`, suspensión/rehabilitación y `Habilitación`.

Preserva `INV-06-01`: identidad, perfil, especialidad, capacidad, verificación, habilitación, vínculo, consentimiento y autorización son dimensiones distintas. B-02 no define criterios probatorios, política de acceso, retención, auditoría, contratos, UI ni persistencia física.

### 6.2. Gobierno y fuentes

| Fuente | SHA-256 |
|---|---|
| B-00 v0.2.1 | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` |
| B-06 v0.1.1 | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` |
| B-01 v0.1 | `a9eff9d8da6c29ecbb2d50bd8ac59c47bfa2d805bbbad2e0789adf34584947dd` |
| Arquitectura 06 v0.1.1 | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` |
| 03 Modelo de Negocio | `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` |
| 04 Requerimientos | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` |
| 05 Casos de Uso | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` |
| DEC-042 | `44a42e8113c478551971ad411d8f9dd6cd3ca755d92df2e07d23cc06d2a949b6` |

Dirección comunicó aprobación de B-01 y el régimen de entregas agrupadas. La copia material de esa acta no está montada; no se inventan número, título ni SHA.

### 6.3. Apertura

#### 6.3.1. Deuda primaria M-02

La cobertura se obtiene **filtrando por la columna Área primaria de toda la matriz arquitectónica**, no por el prefijo de la sección fuente.

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.3-01` | entidades y relaciones de perfil profesional, especialidad y capacidad transversal | `M-00` | — |
| `7.3-02` | estructura de solicitud de verificación | `M-06` | — |
| `7.3-03` | estructura de evidencia versionada y relación entre versiones | `M-06` | — |
| `7.3-04` | taxonomía técnica de estados de solicitud/verificación | `M-00` | — |
| `7.3-05` | máquina de estados compatible como mínimo con PENDIENTE / VERIFICADO / RECHAZADO / SUSPENDIDO | `M-00` | La arquitectura solo fija el requisito mínimo; la máquina se redactará en el bloque propietario. |
| `7.3-06` | representación técnica de observación/subsanación | `M-06` | — |
| `7.3-07` | transición de rehabilitación | `M-04` | — |
| `7.3-08` | equivalencia técnica de solicitudes para evitar duplicados | `M-00` | — |
| `7.3-09` | número/ciclo de nuevas presentaciones cuando corresponda | `M-06` | — |
| `7.3-10` | relación entre resoluciones administrativas y alcance afectado | `M-03` | — |
| `7.3-11` | invariante: resolver una especialidad no modifica otra | `M-00` | — |
| `7.3-12` | relación independiente de la capacidad antropométrica conforme a DEC-044 | `M-09` | — |
| `7.3-14` | representación de habilitación y capacidad sin confundirlas con verificación o autorización | `M-00 / M-05 / M-03` | — |
| `7.13-01` | modelo de habilitación separado de verificación | `M-00 / M-05` | — |

**Objetivo corregido:** `14/14`.

**Corrección A-BLOQ-01:** `7.13-01` pertenece primariamente a `M-02` aunque esté alojada fuera de §7.3. La versión v0.1 no la nombró por un error del extractor basado en prefijo.

#### 6.3.2. Términos ejecutados

`T-06-04`, `T-06-09`, `T-06-10`, `T-06-11`, `T-06-12`, `T-06-13`, `T-06-45`.

#### 6.3.3. Términos recurrentes nuevos

`NINGUNO`.

### 6.4. Perfil profesional

Una `Identidad BE` posee `0..1 Perfil profesional`. Puede estar incompleto y no concede Especialidad, Verificación, Habilitación ni acceso.

**`REG-06-31` — Perfil profesional versionado.** Los cambios confirmados que deban conservar antecedente emiten nueva `Versión` conforme a B-06. La anterior permanece inmutable.

### 6.5. Especialidad, capacidad y Alcance

Las Especialidades iniciales son exclusivamente Nutrición y Entrenamiento. Una Identidad puede declarar cero, una o ambas.

La `Capacidad antropométrica transversal` es independiente, puede existir con cero Especialidades y nunca se representa como tercera Especialidad.

**`REG-06-32` — Alcance disjunto.** Un `Alcance` referencia exactamente una Especialidad **o** la Capacidad antropométrica transversal, nunca ambas.

Cada Alcance se administra, evidencia, verifica, suspende y rehabilita por separado.

### 6.6. Habilitación

`Habilitación` es una dimensión independiente por Identidad + Alcance cuando aplique.

```text
VERIFICADO
≠ Habilitación efectiva
≠ Autorización sobre datos
```

#### 6.6.1. Modelo separado de Verificación profesional — `7.13-01`

La unidad `7.13-01` queda resuelta explícitamente mediante una relación estructural separada:

```text
Identidad BE
  ├─ Verificación profesional por Alcance
  └─ Habilitación por Alcance, cuando aplique
```

Ambas pueden coexistir con resultados distintos. La existencia, cambio o resolución favorable de una no muta la otra por implicación.

**`REG-06-33` — Verificación no crea Habilitación.** La resolución `VERIFICADO` nunca habilita por inferencia.

B-02 conserva la referencia estructural a Habilitación; la regla que la determina, su condición académica/comercial y la capacidad configurada se coordinan con M-05 y las políticas propietarias posteriores. B-02 no convierte Habilitación en estado de la máquina de Verificación ni en autorización de datos.

### 6.7. Solicitud y evidencia

Una `Solicitud de verificación` conserva identificador, Identidad profesional, exactamente un Alcance, ordinal de presentación, Versión de evidencia, actor/autoría, ocurrencia/registro, procedencia y antecedente cuando exista.

**`REG-06-34` — Evidencia presentada como Versión.** Cada presentación confirmada usa B-06; presentar no equivale a aprobar y nunca sobrescribe evidencia revisada.

**`REG-06-35` — Una trayectoria pendiente equivalente.** Para una misma Identidad BE + Alcance solo existe una trayectoria `PENDIENTE`; una subsanación continúa esa trayectoria. Tras un rechazo, una nueva presentación permitida crea un ciclo relacionado, no borra el anterior.

**`REG-06-36` — Ciclo numerado sin límite fijado por 06.** B-02 conserva ordinal monotónico. No fija máximo ni plazo; 08 puede limitar la admisibilidad.

### 6.8. Máquina de Verificación profesional por Alcance

#### 6.8.1. Estados cerrados

```text
PENDIENTE
VERIFICADO
RECHAZADO
SUSPENDIDO
```

#### 6.8.2. Lista blanca

| Transición | Origen → destino | Actor | Condición | Efecto |
|---|---|---|---|---|
| `PresentarAlcance` | inicio → `PENDIENTE` | profesional | Alcance identificable + presentación válida | crea trayectoria y Versión |
| `RegistrarObservacion` | `PENDIENTE → PENDIENTE` | administrador | versión exacta revisada + fundamento | registra observación |
| `PresentarSubsanacion` | `PENDIENTE → PENDIENTE` | profesional | subsanación admitida | nueva Versión relacionada |
| `VerificarAlcance` | `PENDIENTE → VERIFICADO` | administrador | resolución favorable | afecta solo ese Alcance |
| `RechazarAlcance` | `PENDIENTE → RECHAZADO` | administrador | resolución desfavorable | conserva expediente |
| `VolverAPresentar` | `RECHAZADO → PENDIENTE` | profesional | nueva presentación admitida | nuevo ciclo relacionado |
| `SuspenderAlcance` | `VERIFICADO → SUSPENDIDO` | administrador | resolución explícita + motivo | corta nuevas operaciones |
| `RehabilitarAlcance` | `SUSPENDIDO → VERIFICADO` | administrador | resolución explícita | restaura solo verificación |

Toda transición no listada está prohibida.

**`REG-06-37` — Observación no es quinto estado.** Es un hecho/tarea trazable ligado a solicitud, Alcance, Versión revisada, fundamento y posibilidad de subsanación.

**`REG-06-38` — Resolución específica de Versión y Alcance.** Toda resolución identifica una única Versión efectivamente revisada y un único Alcance.

### 6.9. Suspensión y rehabilitación

**`REG-06-39` — Suspensión por Alcance.** `VERIFICADO → SUSPENDIDO` bloquea nuevas operaciones del Alcance, no borra historia y no afecta otros Alcances. Efectos sobre procesos activos pertenecen a M-04/08.

**`REG-06-40` — Rehabilitación expresa.** Nunca ocurre por tiempo o silencio; no concede Habilitación, Vínculo, Consentimiento ni Autorización.

### 6.10. Antropometría independiente

**`REG-06-41` — Capacidad antropométrica sin Especialidad previa.** Es válida la combinación:

```text
Especialidades verificadas: 0
Capacidad antropométrica transversal: VERIFICADA
```

La operación posterior sigue exigiendo las demás condiciones independientes aplicables.

### 6.11. Relaciones

| Relación | Multiplicidad |
|---|---|
| Identidad BE — Perfil profesional | `1 : 0..1` |
| Perfil profesional — Especialidad | `1 : 0..2` |
| Perfil profesional — Capacidad antropométrica | `1 : 0..1` |
| Identidad BE + Alcance — Verificación profesional | una situación efectiva |
| Solicitud — Alcance | `1 : 1` |
| Solicitud/trayectoria — Versiones de evidencia | `1 : 1..N` |
| Resolución — Versión revisada | `1 : 1` |
| Resolución — Alcance | `1 : 1` |

### 6.12. Reglas consolidadas

- **`REG-06-42` — Resolución independiente.** Resolver un Alcance no modifica otro.
- **`REG-06-43` — Verificación no autoritativa.** `VERIFICADO` nunca sustituye Vínculo, Consentimiento vigente ni Autorización contextual.

### 6.13. Invariantes

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-35` | Máximo un Perfil profesional por Identidad BE. | existen perfiles paralelos. |
| `INV-06-36` | Perfil profesional no concede gates. | guardar perfil activa especialidad/verificación/habilitación/acceso. |
| `INV-06-37` | Antropometría no es Especialidad. | se agrega como tercer miembro. |
| `INV-06-38` | Alcance = Especialidad XOR Capacidad transversal. | mezcla ambas o ninguna. |
| `INV-06-39` | Verificación independiente por Alcance. | resolver uno cambia otro. |
| `INV-06-40` | Presentar evidencia ≠ `VERIFICADO`. | cargar evidencia habilita operación. |
| `INV-06-41` | Evidencia revisada permanece versionada. | subsanar sobrescribe la anterior. |
| `INV-06-42` | Observación ≠ `RECHAZADO`. | observar produce rechazo implícito. |
| `INV-06-43` | Resolución referencia la Versión revisada. | apunta a otra versión/mutable. |
| `INV-06-44` | Máximo una trayectoria equivalente `PENDIENTE`. | existen duplicados simultáneos. |
| `INV-06-45` | `VERIFICADO` ≠ Habilitación. | aprobación crea habilitación. |
| `INV-06-46` | `VERIFICADO` ≠ Autorización contextual. | se usa como permiso de datos. |
| `INV-06-47` | `SUSPENDIDO` corta nuevas operaciones sin borrar historia. | permite nuevas acciones o borra antecedentes. |
| `INV-06-48` | Rehabilitación no es automática. | tiempo/silencio devuelve `VERIFICADO`. |
| `INV-06-49` | Puede existir profesional exclusivamente antropométrico. | se exige Nutrición/Entrenamiento. |

### 6.14. Cobertura M-02

| Unidad | Resolución | Estado |
|---|---|---|
| `7.3-01` | §§4–5, 11 | `RESUELTA` |
| `7.3-02` | §7 | `RESUELTA` |
| `7.3-03` | §7 + B-06 | `RESUELTA` |
| `7.3-04` | §8.1 | `RESUELTA` |
| `7.3-05` | §8.2 | `RESUELTA` |
| `7.3-06` | `REG-06-37` | `RESUELTA` |
| `7.3-07` | `REG-06-40` | `RESUELTA` |
| `7.3-08` | `REG-06-35` | `RESUELTA` |
| `7.3-09` | `REG-06-36` | `RESUELTA` |
| `7.3-10` | `REG-06-38` | `RESUELTA` |
| `7.3-11` | `INV-06-39` | `RESUELTA` |
| `7.3-12` | §10 | `RESUELTA` |
| `7.3-14` | §6 | `RESUELTA` |
| `7.13-01` | §6.1 + `REG-06-33` + `INV-06-45` | `RESUELTA` |

**Resultado corregido:** `14/14`.

La unidad `7.13-01` no agrega una segunda Habilitación ni una nueva máquina: hace trazable que el modelo de Habilitación ya definido es **separado** de Verificación profesional.

### 6.15. Fronteras

- evidencia/acceso/auditoría/criterios de rehabilitación → 08;
- capacidad configurada → M-05;
- efectos sobre procesos activos → M-04;
- contratos → 09;
- UI → 10;
- persistencia física → prohibida.

### 6.16. Estado

```text
B-02 v0.1
M-02
COBERTURA: 14/14
REG-06-31…43
INV-06-35…49
B-06: INSTANCIADO
GIT: SIN OPERACIONES
```


---


## 7. B-03 — Vínculo, consentimiento y autorización contextual

*Fuente ensamblada: `BE_LEG_06_B03_v0_1_1_VINCULO_CONSENTIMIENTO_Y_AUTORIZACION.md` · SHA-256 `75e477561a99c98e04a0fa0dd3cd101c42584f3a65ed233667f155337635b815`.*


### 7.1. Objeto

B-03 preserva la cadena:

```text
Identidad
→ Alcance profesional válido
→ Solicitud de vínculo
→ aceptación explícita
→ Vínculo por Alcance
→ Consentimiento específico
→ evaluación de Autorización contextual
```

Ningún paso concede implícitamente el siguiente.

Modela Solicitud de vínculo, invitación previa a Identidad BE, aceptación/rechazo, Vínculo multialcance con estado por Alcance, pausa/reanudación/finalización, Consentimiento versionado, Revocación y los siete insumos estructurales de RF-021. Política fina, taxonomía, SLA, retención, lectura residual y auditoría pertenecen a 08.

### 7.2. Apertura

#### 7.2.1. Deuda primaria M-03

La cobertura se obtiene **filtrando por la columna Área primaria de toda la matriz arquitectónica**, no por prefijo de sección fuente.

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.4-01` | solicitud de vínculo y vínculo como objetos/área de dominio | `M-00` | — |
| `7.4-02` | estados técnicos y transiciones de solicitud, aceptación, rechazo, pausa y finalización | `M-00 / M-04` | — |
| `7.4-03` | equivalencia de solicitudes y prevención de duplicados | `M-00` | — |
| `7.4-04` | caducidad y reiteración de solicitudes | `08 para política fina` | — |
| `7.4-05` | invitaciones para identidades aún no registradas | `M-01 / 09 para contrato` | — |
| `7.4-06` | relación posterior entre invitación e identidad creada | `M-01` | — |
| `7.4-07` | uno o varios alcances dentro del vínculo | `M-00` | — |
| `7.4-08` | compatibilidad entre pausa/finalización total y por alcance | `M-04` | — |
| `7.4-09` | reanudación después de pausa | `M-04 / 08` | — |
| `7.4-10` | efecto de cambios de elegibilidad entre solicitud y aceptación | `M-02 / M-05 / 08` | — |
| `7.4-11` | relación longitudinal entre cambio de profesional, identidad e historia | `M-06 / M-11` | — |
| `7.4-15` | lectura residual después de finalización permanece en 08 | `08` | 06 solo conserva la estructura necesaria para aplicar la política posterior. |
| `7.5-01` | relación entre vínculo, consentimiento aplicable, finalidad y alcance | `08` | — |
| `7.5-02` | referencia/versionado para reconstruir qué consentimiento gobernaba una operación | `M-06 / 08` | — |
| `7.5-05` | asimetría: revocar consentimiento no finaliza necesariamente el vínculo; finalizar vínculo no elimina evidencia histórica de consentimiento | `M-04 / M-06 / 08` | — |
| `7.12-05` | representación del origen de solicitud de vínculo desde descubrimiento | `M-09` | — |
| `7.12-06` | caducidad técnica de esa solicitud en coordinación con vínculo y 08 | `M-09 / 08` | — |

**Objetivo corregido:** `17/17`.

**Corrección A-BLOQ-01:** la v0.1 omitió `7.5-01`, `7.5-02`, `7.5-05`, `7.12-05` y `7.12-06` porque el extractor solo observó §7.4. Las primeras tres ya tenían comportamiento sustantivo modelado; las dos últimas requieren y reciben desarrollo explícito en §4.1–4.3.

#### 7.2.2. Términos ejecutados

`T-06-15`, `T-06-16`, `T-06-17`, `T-06-18`, `T-06-19`, `T-06-45`.

#### 7.2.3. Términos recurrentes nuevos

`NINGUNO`.

### 7.3. Solicitud de vínculo

Una Solicitud conserva identificador, profesional, asesorado o referencia de invitación pendiente, exactamente un Alcance, finalidad, actor iniciador, doble temporalidad, procedencia, estado y antecedente si se reitera.

La solicitud es atómica por Alcance; un Vínculo puede agrupar varios Alcances, manteniendo decisiones independientes.

#### 7.3.1. Estados

```text
PENDIENTE
ACEPTADA
RECHAZADA
CADUCADA
INVALIDADA
```

Los cuatro últimos son terminales para esa Solicitud concreta.

#### 7.3.2. Lista blanca

| Transición | Origen → destino | Actor | Condición | Efecto |
|---|---|---|---|---|
| `CrearSolicitud` | inicio → `PENDIENTE` | profesional o asesorado | Alcance/finalidad + elegibilidad estructural | no acceso; no capacidad |
| `AceptarSolicitud` | `PENDIENTE → ACEPTADA` | asesorado | confirmación explícita + reevaluación | crea/incorpora Alcance de Vínculo |
| `RechazarSolicitud` | `PENDIENTE → RECHAZADA` | asesorado | confirmación explícita | conserva antecedente |
| `CaducarSolicitud` | `PENDIENTE → CADUCADA` | sistema bajo política 08 | condición temporal | plazo no fijado aquí |
| `InvalidarSolicitud` | `PENDIENTE → INVALIDADA` | sistema/actor propietario | elegibilidad o contenido ya incompatibles | requiere nueva Solicitud |

**`REG-06-44` — Solicitud equivalente pendiente única.** Coinciden profesional, destinatario resoluble, Alcance y finalidad; solo una puede estar `PENDIENTE`.

**`REG-06-45` — Caducidad sin plazo en M-03.** B-03 define la transición, no la duración. Reiterar crea nueva Solicitud relacionada.

### 7.4. Invitación previa a Identidad BE

Una invitación puede existir con referencia pendiente producida por 08/09, sin presuponer correo, teléfono ni proveedor.

#### 7.4.1. Referencia de origen desde descubrimiento antropométrico — `7.12-05`

Cuando `UC-E04` invoca la creación de Solicitud desde descubrimiento antropométrico, la Solicitud conserva una **referencia estructural de origen** hacia el elemento identificable de M-09 que fue seleccionado en el descubrimiento.

La referencia conserva, como mínimo conceptual:

- dominio de origen `M-09`;
- identificador del servicio/publicación seleccionada que M-09 exponga para relación;
- profesional;
- Capacidad antropométrica transversal;
- finalidad trasladada a la Solicitud;
- actor que inició desde descubrimiento;
- momento de ocurrencia y de registro;
- procedencia.

B-03 **no copia ni redefine** la publicación antropométrica, su elegibilidad, ubicación, precio, estado ni contenido: M-09 sigue siendo su Fuente de verdad.

**`REG-06-62` — Origen de descubrimiento trazable.** Una Solicitud creada por `UC-E04` debe conservar una referencia reconstruible a su origen en descubrimiento. Esa referencia explica **cómo nació** la Solicitud, pero no modifica la máquina de Solicitud, no crea aceptación, no crea Consentimiento, no concede acceso y no convierte a M-03 en propietario de la publicación.

#### 7.4.2. Caducidad de solicitud originada en descubrimiento — `7.12-06`

Una Solicitud nacida desde descubrimiento utiliza **la misma máquina de §3**. No existe un estado ni una máquina especial para descubrimiento.

**`REG-06-63` — Caducidad coordinada del origen de descubrimiento.**

Mientras la Solicitud permanezca `PENDIENTE`:

1. la caducidad técnica se materializa mediante la transición ya aprobada `PENDIENTE → CADUCADA`;
2. la **política que determina plazo o condición temporal** pertenece a 08, conforme a `REG-06-45`;
3. si antes de aceptar M-09 informa que el servicio/publicación de origen dejó de ser elegible, la reevaluación de `REG-06-49` puede llevar a `INVALIDADA`; no se fuerza `CADUCADA` para ocultar una pérdida de elegibilidad;
4. una Solicitud `ACEPTADA` ya es terminal: una caducidad posterior de la publicación de origen no retrocede la Solicitud ni finaliza el Vínculo;
5. la referencia histórica de origen permanece aunque la publicación se despublique o cambie posteriormente.

Así, M-03 conserva la semántica de Solicitud/Vínculo; M-09 conserva la verdad sobre la publicación; 08 conserva la política fina de caducidad.

#### 7.4.3. Garantías de origen

**`INV-06-69` — El origen desde descubrimiento no altera los gates.** Se viola si registrar origen crea aceptación, Consentimiento, Autorización, reserva, pago, contratación o acceso.

**`INV-06-70` — Caducidad del origen no modifica retrospectivamente un Vínculo aceptado.** Se viola si un cambio/caducidad posterior de la publicación revierte una Solicitud `ACEPTADA` o finaliza su Vínculo por implicación.

**`REG-06-46` — Asociar invitación no equivale a aceptar.** Al vincularla posteriormente con una Identidad BE inequívoca, la Solicitud continúa `PENDIENTE`; no crea Vínculo, Consentimiento ni acceso.

### 7.5. Vínculo por Alcance

`Vínculo` agrupa `1..N` componentes de Alcance. Cada componente conserva Alcance, finalidad, Solicitud de origen, estado, actor/autoría, ocurrencia/registro, procedencia y motivo cuando aplique.

La máquina de T-06-15 opera por Alcance, evitando que un estado global oculte divergencias.

#### 7.5.1. Estados

```text
ACEPTADO
PAUSADO
FINALIZADO
```

#### 7.5.2. Lista blanca

| Transición | Origen → destino | Actor | Condición | Efecto |
|---|---|---|---|---|
| `AceptarAlcanceDeVinculo` | inicio → `ACEPTADO` | asesorado | Solicitud `ACEPTADA` | no concede Consentimiento |
| `PausarAlcance` | `ACEPTADO → PAUSADO` | actor habilitado por 08 | decisión + motivo | bloquea operaciones incompatibles |
| `ReanudarAlcance` | `PAUSADO → ACEPTADO` | actor habilitado por 08 | decisión explícita | no restaura otros gates |
| `FinalizarAlcance` | `ACEPTADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva historia |
| `FinalizarAlcance` | `PAUSADO → FINALIZADO` | actor habilitado por 08 | decisión explícita | preserva pausa previa |

`FINALIZADO` no tiene salida.

**`REG-06-47` — Operación total explícita.** Pausa/finalización total aplica transiciones por cada Alcance elegible; nunca hay cascada implícita.

**`REG-06-48` — Reanudación no restaura gates externos.** Solo cambia el Vínculo por Alcance.

### 7.6. Reevaluación al aceptar

**`REG-06-49` — Revalidar elegibilidad sin convertir capacidad en aceptación.** Antes de aceptar se reevalúan identidades, Verificación, Habilitación y contenido del Alcance/finalidad. Si dejan de ser compatibles, la Solicitud se `INVALIDADA`.

Capacidad configurada no se ocupa por solicitud o aceptación solas; el gate de proceso pertenece a B-04/B-05.

### 7.7. Consentimiento vigente

Se identifica longitudinalmente por asesorado + profesional + Alcance de Vínculo + finalidad.

#### 7.7.1. Relación Vínculo / Consentimiento / finalidad / Alcance — `7.5-01`

El consentimiento aplicable referencia exactamente:

- asesorado titular;
- profesional;
- componente de Vínculo por Alcance;
- finalidad concreta;
- Versión de consentimiento.

La relación no convierte Vínculo en Consentimiento ni permite ampliar finalidad o Alcance por inferencia.

#### 7.7.2. Reconstrucción de qué consentimiento gobernaba una operación — `7.5-02`

`REG-06-50` se aplica además como regla de reconstrucción: la estructura permite que una operación protegida/auditada conserve o resuelva una referencia a la **Versión de Consentimiento que era aplicable** en su contexto.

B-03 define la relación versionada; 08 define qué operaciones deben registrar esa referencia, la política de autorización y la auditoría. Una versión posterior nunca reescribe cuál gobernaba una operación histórica.

#### 7.7.3. Asimetría entre revocación y finalización — `7.5-05`

La unidad queda saldada por la combinación de:

- `REG-06-51`: revocar corta operaciones futuras del Alcance, preserva historia y no finaliza el Vínculo;
- `REG-06-52`: pausar/finalizar Vínculo no crea Revocación implícita;
- `INV-06-63`: Revocación no finaliza automáticamente el Vínculo;
- `INV-06-64`: finalizar Vínculo no borra evidencia histórica de Consentimiento;
- B-06: historia por adición y no sobrescritura.

Esta asimetría es normativa y no se reduce a una coincidencia de implementación.

**`REG-06-50` — Consentimiento siempre versionado.** Cada decisión expresa emite nueva `Versión` de B-06, conserva versión/texto referenciado de 08, actor, Alcance, finalidad, ocurrencia/registro y procedencia. Aceptar una versión nunca acepta futuras.

#### 7.7.4. Situaciones

```text
VIGENTE
REVOCADO
```

#### 7.7.5. Transiciones

| Transición | Origen → destino | Actor | Efecto |
|---|---|---|---|
| `OtorgarConsentimiento` | inicio → `VIGENTE` | asesorado | primera Versión |
| `AceptarNuevaVersion` | `VIGENTE → VIGENTE` | asesorado | Versión sucesora explícita |
| `RevocarConsentimiento` | `VIGENTE → REVOCADO` | asesorado | Versión + evento de revocación |
| `OtorgarNuevamente` | `REVOCADO → VIGENTE` | asesorado | nueva decisión explícita cuando 08 lo permita |

**`REG-06-51` — Revocación corta futuras operaciones sin borrar historia.** No finaliza Vínculo ni otros Alcances; SLA/retención/lectura histórica son de 08.

**`REG-06-52` — Estado de Vínculo no muta consentimiento implícitamente.** Pausar/finalizar no crea Revocación automática.

### 7.8. Autorización contextual

B-03 fija exactamente los siete insumos de RF-021:

1. rol;
2. Especialidad o Capacidad aplicable;
3. situación aplicable;
4. Vínculo;
5. Consentimiento vigente;
6. finalidad;
7. Alcance.

**`REG-06-53` — Ninguna dimensión aislada autoriza.**

**`REG-06-54` — Ausencia estructural nunca se interpreta como permiso.** Si falta o es inconsistente una dimensión, B-03 no presume autorización. La política permitir/denegar y auditoría pertenecen a 08.

### 7.9. Cambio de profesional

**`REG-06-55` — Nuevo profesional, nuevo Vínculo sin herencia de acceso.** La Identidad BE del asesorado permanece; autoría/procedencia históricas no cambian; el nuevo profesional requiere Solicitud, aceptación, Consentimiento y Autorización propias.

### 7.10. Lectura residual

**`REG-06-56` — Finalización no decide lectura residual.** B-03 conserva estados, actor, motivo e historia; `Q-005`, retención y consulta posterior permanecen en 08.

### 7.11. Capacidad

**`REG-06-57` — Solicitud/aceptación no ocupan capacidad por sí mismas.** La ocupación se determina cuando exista proceso operativo según 03 §14, B-04 y M-05.

### 7.12. Reglas consolidadas adicionales

- **`REG-06-58` — Aceptación pertenece al asesorado.**
- **`REG-06-59` — Aceptación no es Consentimiento vigente.**
- **`REG-06-60` — Alcances del Vínculo son independientes.**
- **`REG-06-61` — La finalidad no se amplía implícitamente.**
- **`REG-06-62` — Origen de descubrimiento trazable.**
- **`REG-06-63` — Caducidad coordinada del origen de descubrimiento.**

### 7.13. Invariantes

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-50` | Solicitud `PENDIENTE` no concede acceso. | se accede por solicitar. |
| `INV-06-51` | Máximo una Solicitud equivalente `PENDIENTE`. | existen duplicados. |
| `INV-06-52` | Solo asesorado acepta/rechaza. | tercero decide por él. |
| `INV-06-53` | Aceptación ≠ Consentimiento ≠ Autorización. | se sustituyen eventos. |
| `INV-06-54` | Solicitudes terminales preservan historia. | rechazo/caducidad/invalidez borran antecedente. |
| `INV-06-55` | Invitación sin Identidad no crea Vínculo. | existe relación operativa prematura. |
| `INV-06-56` | Asociar invitación no autoacepta. | identidad resuelta cambia a `ACEPTADA`. |
| `INV-06-57` | Cada Alcance del Vínculo es independiente. | cambiar uno cambia otro implícitamente. |
| `INV-06-58` | `FINALIZADO` es terminal. | se reabre el mismo componente. |
| `INV-06-59` | Pausa/reanudación preservan historia. | sobrescriben eventos previos. |
| `INV-06-60` | Consentimiento `VIGENTE` referencia Versión identificable. | falta versión/actor/Alcance/finalidad. |
| `INV-06-61` | Aceptar una versión no acepta futuras. | nueva versión amplía sin decisión. |
| `INV-06-62` | Solo asesorado otorga/revoca. | otro actor decide por él. |
| `INV-06-63` | Revocación no finaliza Vínculo automáticamente. | produce `FINALIZADO`. |
| `INV-06-64` | Finalizar Vínculo no borra consentimientos. | se elimina historia. |
| `INV-06-65` | Ninguna dimensión aislada autoriza. | una sola concede operación. |
| `INV-06-66` | Solicitud o aceptación sin proceso no ocupan capacidad. | M-05 las cuenta por sí solas. |
| `INV-06-67` | Cambio de profesional no transfiere acceso/autoría. | nuevo profesional hereda. |
| `INV-06-68` | Lectura residual no se decide en M-03. | B-03 concede/deniega historia post-finalización. |
| `INV-06-69` | El origen desde descubrimiento no altera los gates. | registrar origen crea aceptación, Consentimiento, Autorización, reserva, pago, contratación o acceso. |
| `INV-06-70` | Caducidad del origen no modifica retrospectivamente un Vínculo aceptado. | cambio/caducidad posterior de la publicación revierte una Solicitud `ACEPTADA` o finaliza el Vínculo por implicación. |

### 7.14. Cobertura M-03

| Unidad | Resolución | Estado |
|---|---|---|
| `7.4-01` | §§3, 5 | `RESUELTA` |
| `7.4-02` | §§3.1–3.2, 5.1–5.2 | `RESUELTA` |
| `7.4-03` | `REG-06-44` | `RESUELTA` |
| `7.4-04` | `REG-06-45` | `RESUELTA COMO ESTRUCTURA + FRONTERA 08` |
| `7.4-05` | §4 | `RESUELTA` |
| `7.4-06` | `REG-06-46` | `RESUELTA` |
| `7.4-07` | §5 | `RESUELTA` |
| `7.4-08` | `REG-06-47` | `RESUELTA` |
| `7.4-09` | `REG-06-48` | `RESUELTA` |
| `7.4-10` | `REG-06-49` | `RESUELTA` |
| `7.4-11` | §9 | `RESUELTA` |
| `7.4-15` | §10 | `RESUELTA COMO FRONTERA 08` |
| `7.5-01` | §7.0.1 | `RESUELTA` |
| `7.5-02` | §7.0.2 + `REG-06-50` + B-06 | `RESUELTA` |
| `7.5-05` | §7.0.3 + `REG-06-51/52` + `INV-06-63/64` | `RESUELTA` |
| `7.12-05` | §4.1 + `REG-06-62` | `RESUELTA` |
| `7.12-06` | §4.2 + `REG-06-45/49/63` | `RESUELTA COMO ESTRUCTURA + FRONTERA M-09/08` |

**Resultado corregido:** `17/17`.

Coordinaciones no reclamadas: `7.4-12 → M-05`, `7.4-13/14 → M-04`; `Q-007` no se resuelve aquí.

### 7.15. Fronteras

- consentimiento/autorización fina, taxonomía, texto, SLA, retención, lectura residual, actores habilitados → 08;
- capacidad → M-05;
- ciclo funcional y Q-007 → B-04/M-10;
- contratos → 09;
- UI → 10;
- persistencia física → prohibida.

### 7.16. Estado

```text
B-03 v0.1
M-03
COBERTURA: 17/17
REG-06-44…63
INV-06-50…70
Q-005: 08
Q-007: B-04/M-10
B-06: INSTANCIADO
GIT: SIN OPERACIONES
```


---


## 8. B-04 — Ciclo funcional del proceso

*Fuente ensamblada: `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` · SHA-256 `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5`.*


### 8.1. Objeto

B-04 define `M-04 — Ciclo funcional del proceso` y fija la semántica técnica común de `T-06-25 — Proceso (operativo abierto / vigente / nuevo)`.

El bloque determina identidad, apertura, vigencia derivada, continuidad y cierre del Proceso operativo; los efectos de cierre de cuenta, suspensión profesional, pausa/finalización de Vínculo y Revocación; y el evento técnico exacto que resuelve `Q-007`.

No define estructura de planes, Revisión profesional válida, política de autorización, retención, capacidad numérica, fórmula TVCC-30 ni persistencia física.

### 8.2. Gobierno y fuentes

| Fuente | SHA-256 | Uso |
|---|---|---|
| `ACTA_DIR_012_APROBACION_ENTREGA_A_Y_HABILITACION_ENTREGA_B.md` | `f3a99015d44e0960e58766bccf15134e79e77d9c54fcd8369db29262ffdef580` | habilitación y 12 condiciones |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | `T-06-25`, `T-06-26`, `INV-06-08` |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | eventos, historia, doble temporalidad |
| `BE_LEG_06_B01_v0_1_IDENTIDAD_PERFIL_Y_CICLO_DE_CUENTA.md` | `a9eff9d8da6c29ecbb2d50bd8ac59c47bfa2d805bbbad2e0789adf34584947dd` | cuenta operativa/suspendida/cerrada |
| `BE_LEG_06_B02_v0_1_1_PERFIL_PROFESIONAL_VERIFICACION_Y_HABILITACION.md` | `03f220bd428d5abe429e41714981ba49adefa6870e24358e03856ba8b12d058e` | Verificación por Alcance |
| `BE_LEG_06_B03_v0_1_1_VINCULO_CONSENTIMIENTO_Y_AUTORIZACION.md` | `75e477561a99c98e04a0fa0dd3cd101c42584f3a65ed233667f155337635b815` | Vínculo y Consentimiento |
| `03_Modelo_de_Negocio.md` | `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` | §14 — capacidad y asesorado activo |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-031/035/041/046/058/066 |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-I06 |

### 8.3. Apertura del bloque

#### 8.3.1. Deuda primaria M-04

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.2-07` | efectos sobre sesiones, procesos y vínculos | `M-01 / M-03 / 08` | — |
| `7.3-13` | efectos estructurales de suspensión sobre procesos activos | `M-02 / 08` | — |
| `7.4-13` | tratamiento técnico de procesos activos cuando cambia el estado del vínculo | `M-03 / 08` | — |
| `7.4-14` | Q-007: transición/evento técnico de continuidad o cierre que afecta el ciclo funcional | `M-10` | Q-007 debe resolverse o quedar estacionada con fundamento antes del cierre del bloque M-04/M-10. |
| `7.5-03` | efectos estructurales de revocación sobre estados o procesos existentes | `M-03 / 08` | — |
| `7.5-06` | interacción entre estados de vínculo y estado funcional de procesos abiertos | `M-03 / 08` | — |
| `7.8-05` | transiciones de continuidad | `M-10` | — |
| `7.8-08` | evento técnico exacto que cierra un seguimiento — Q-007 | `M-10` | — |
| `7.16-05` | eventos de cierre y continuidad | `M-10` | — |
| `DIR-06-03` | resolución o estacionamiento fundado de Q-007 | `M-10` | No puede quedar huérfana: si no se resuelve, debe registrarse estado, fundamento, impacto, propietario y gate. |

**Cobertura objetivo:** `10/10`.

#### 8.3.2. Términos ejecutados

- `T-06-05 — Cierre de cuenta` en efectos sobre procesos.
- `T-06-25 — Proceso (operativo abierto / vigente / nuevo)`.
- `T-06-26 — Activación de plan`, solo como acto que puede abrir un Proceso.
- referencias a `T-06-37…40` de M-10 sin redefinirlos.

#### 8.3.3. Términos recurrentes nuevos

`NINGUNO`.

Los nombres de eventos locales no se elevan a términos globales.

#### 8.3.4. Máquina

La máquina de ciclo del Proceso usa dos estados. `NUEVO` y `VIGENTE` son predicados, no estados.

### 8.4. Proceso operativo

#### 8.4.1. Identidad

Un Proceso operativo conserva profesional, asesorado, Alcance funcional, acto de apertura, versión/plan de apertura cuando aplique, actor/autoría, ocurrencia, registro, procedencia y estado.

Una operación antropométrica aislada no crea por sí sola un Proceso de seguimiento de Nutrición/Entrenamiento.

#### 8.4.2. Proceso nuevo

**`REG-06-64` — Proceso nuevo como candidato.**

Una operación es `NUEVO` cuando pretende crear un identificador de Proceso para profesional + asesorado + Alcance y no existe un Proceso `ABIERTO` equivalente.

`NUEVO` no es estado persistido. Exige evaluación B-05 antes de crear el Proceso.

Una nueva versión de plan dentro de un Proceso abierto es continuidad.

#### 8.4.3. Proceso abierto

**`REG-06-65` — Apertura posterior a admisión.**

Un Proceso nuevo abre solo si:

1. profesional, asesorado y Alcance son identificables;
2. la vertical puede emitir/activar la versión inicial;
3. B-05 admite la apertura por capacidad;
4. los demás gates estructurales son compatibles;
5. apertura y activación no se declaran exitosas parcialmente.

B-07/B-08 definirán la máquina concreta del Plan.

#### 8.4.4. Proceso vigente

**`REG-06-66` — Vigencia estructural sin estado paralelo.**

Un Proceso `ABIERTO` es estructuralmente `VIGENTE` cuando:

- la cuenta no introduce bloqueo operativo;
- Verificación profesional = `VERIFICADO`;
- existe Habilitación efectiva;
- Vínculo por Alcance = `ACEPTADO`;
- Consentimiento = `VIGENTE`;
- el Proceso no está cerrado.

`VIGENTE` no equivale a Autorización contextual; 08 sigue evaluando cada operación.

#### 8.4.5. Proceso cerrado

`CERRADO` es terminal. Impide nueva ejecución/continuidad de ese identificador y conserva evidencia, versiones, revisiones y eventos. Una relación futura equivalente crea un Proceso nuevo.

### 8.5. Máquina del Proceso operativo

#### 8.5.1. Estados cerrados

```text
ABIERTO
CERRADO
```

#### 8.5.2. Lista blanca

| Transición | Origen → destino | Disparador | Condiciones | Evento principal |
|---|---|---|---|---|
| `AbrirProceso` | inicio → `ABIERTO` | activación vertical confirmada | `REG-06-64/65` + admisión B-05 | `ProcesoOperativoAbierto` |
| `AplicarContinuidad` | `ABIERTO → ABIERTO` | UC-I06 con resultado distinto de `FINALIZAR` | revisión M-10 válida + consecuencia aplicable | `ContinuidadOCierreAplicado` (`CONTINUIDAD`) |
| `CerrarPorRevision` | `ABIERTO → CERRADO` | UC-I06 con `FINALIZAR` | revisión M-10 válida + cierre explícito | `ContinuidadOCierreAplicado` (`CIERRE_PROCESO`) + `ProcesoOperativoCerrado` |
| `CerrarPorFinalizacionVinculo` | `ABIERTO → CERRADO` | Vínculo pasa a `FINALIZADO` | mismo profesional/asesorado/Alcance | `ProcesoOperativoCerrado` |
| `CerrarPorCierreCuenta` | `ABIERTO → CERRADO` | cuenta pasa a `CERRADA` | identidad correspondiente | `ProcesoOperativoCerrado` |

Toda transición no listada está prohibida.

Pausa, suspensión, revocación o pérdida de Habilitación no son estados del Proceso.

### 8.6. Efectos de gates externos

#### 8.6.1. Cuenta

**`REG-06-67` — Suspensión de cuenta no cierra el Proceso.**

`SUSPENDIDA` mantiene el Proceso `ABIERTO` pero no vigente. `CERRADA` dispara `CerrarPorCierreCuenta`.

#### 8.6.2. Suspensión profesional

**`REG-06-68` — Suspensión profesional no cierra automáticamente procesos.**

`SUSPENDIDO` bloquea nuevas operaciones del Alcance, preserva Proceso e historia y vuelve no vigente el Proceso hasta rehabilitación.

#### 8.6.3. Vínculo pausado

**`REG-06-69` — Pausa de Vínculo conserva el Proceso abierto.**

`PAUSADO` vuelve no vigente el Proceso y entrega a B-05 la condición para evaluar gracia de capacidad.

#### 8.6.4. Vínculo finalizado

**`REG-06-70` — Finalización de Vínculo cierra procesos del Alcance.**

`FINALIZADO` dispara `CerrarPorFinalizacionVinculo` para los Procesos abiertos del mismo profesional + asesorado + Alcance.

#### 8.6.5. Consentimiento revocado

**`REG-06-71` — Revocación no cierra el Proceso.**

`REVOCADO` vuelve no vigente el Proceso, no lo cierra, no finaliza el Vínculo y deja de aportar ocupación normal en B-05 si no existe otro Alcance elegible.

#### 8.6.6. Habilitación retirada

**`REG-06-72` — Pérdida de Habilitación no destruye continuidad histórica.**

Retirar Habilitación impide nuevas operaciones que la requieran, pero no cierra ni borra el Proceso. La ocupación se calcula por 03 §14/B-05.

### 8.7. Continuidad, cierre y Q-007

#### 8.7.1. Entrada desde M-10

M-10 provee Revisión profesional válida, resultado semántico, fundamento, Próxima acción o cierre, autoría y temporalidad. B-04 aplica UC-I06.

#### 8.7.2. Resultados de continuidad

**`REG-06-73` — Continuidad no cierra el Proceso.**

Mantienen `ABIERTO`:

```text
MANTENER
AJUSTAR
SUSTITUIR
REPROGRAMAR_REVISION
CAMBIAR_OBJETIVO
```

Pueden exigir cambios verticales, pero no crean Proceso nuevo mientras el actual esté abierto.

#### 8.7.3. Resultado de cierre

**`REG-06-74` — `FINALIZAR` cierra el Proceso.**

Una revisión válida con `FINALIZAR` y cierre aplicado exitosamente ejecuta `ABIERTO → CERRADO`.

#### 8.7.4. Resolución de Q-007

**`REG-06-75` — Evento técnico exacto de continuidad o cierre.**

`Q-007` queda **RESUELTA EN M-04**, coordinada con M-10, mediante:

```text
ContinuidadOCierreAplicado
```

Se emite solo después de aplicar exitosamente UC-I06 y conserva:

- Proceso;
- Revisión válida origen;
- Resultado semántico;
- Próxima acción o cierre;
- `CONTINUIDAD` o `CIERRE_PROCESO`;
- estado antes/después;
- referencias de versiones cuando correspondan;
- actor/autoría;
- ocurrencia;
- registro;
- procedencia.

#### 8.7.5. Frontera con Ciclo cerrado trazable

**`REG-06-76` — Q-007 no redefine T-06-40.**

`ContinuidadOCierreAplicado` demuestra que la consecuencia funcional fue aplicada. M-10 conserva `T-06-40 — Ciclo cerrado trazable`.

```text
Revisión válida (M-10)
+ ContinuidadOCierreAplicado (M-04)
→ insumos para Ciclo cerrado trazable (M-10)
→ elegibilidad analítica posterior (M-12)
```

B-04 no calcula TVCC-30.

#### 8.7.6. Sin éxito parcial

**`REG-06-77` — Sin continuidad parcial declarada como éxito.**

Si la consecuencia no puede aplicarse coherentemente, no se emite `ContinuidadOCierreAplicado` y no se declara continuidad/cierre exitosos.

### 8.8. Unicidad

**`REG-06-78` — Un solo Proceso abierto por profesional + asesorado + Alcance.**

Si existe abierto, una activación posterior es continuidad. Si el anterior está cerrado, puede crearse otro con identidad propia y referencia histórica.

### 8.9. Antropometría y capacidad

Una consulta/medición antropométrica aislada no abre por sí sola este Proceso ni ocupa capacidad. Puede ser evidencia de otro seguimiento y sigue siendo propiedad de M-09.

### 8.10. Archivo y proyecciones

03 §14 excluye asesorados archivados. B-04 no inventa `ARCHIVADO` como tercer estado.

Una proyección de archivo no puede ocultar un Proceso `ABIERTO`. Para capacidad se usan fuentes de dominio. Si una vista aparece archivada mientras existe un Proceso elegible, existe inconsistencia y no liberación automática.

### 8.11. Eventos locales

| Evento | Emisión |
|---|---|
| `ProcesoOperativoAbierto` | apertura |
| `ContinuidadOCierreAplicado` | UC-I06 aplicado |
| `ProcesoOperativoCerrado` | cierre por revisión, Vínculo o cuenta |
| `VigenciaEstructuralReevaluada` | proyección opcional; no cambia ciclo |

Los hechos persistentes instancian B-06.

### 8.12. Invariantes locales

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-71` | `NUEVO` no es estado persistido. | se guarda como tercer estado. |
| `INV-06-72` | Ciclo usa solo `ABIERTO/CERRADO`. | aparece otro estado de ciclo. |
| `INV-06-73` | `VIGENTE` es predicado, no autorización. | se usa como permiso o estado paralelo. |
| `INV-06-74` | Máximo un Proceso abierto por profesional + asesorado + Alcance. | existen dos abiertos equivalentes. |
| `INV-06-75` | Abrir Proceso nuevo requiere admisión B-05. | se crea antes del control. |
| `INV-06-76` | Continuidad de plan no crea Proceso nuevo. | ajustar/sustituir duplica seguimiento. |
| `INV-06-77` | Pausa de Vínculo no cierra Proceso. | `PAUSADO` produce `CERRADO`. |
| `INV-06-78` | Revocación no cierra Proceso. | `REVOCADO` produce cierre. |
| `INV-06-79` | Suspensión profesional no cierra/borrar procesos. | suspensión destruye seguimiento. |
| `INV-06-80` | Finalización de Vínculo cierra Proceso del Alcance. | vínculo finaliza y proceso sigue abierto. |
| `INV-06-81` | Cuenta cerrada cierra Procesos. | quedan abiertos tras cierre confirmado. |
| `INV-06-82` | `FINALIZAR` aplicado cierra Proceso. | cierre exitoso deja abierto. |
| `INV-06-83` | Los otros cinco resultados no cierran Proceso. | continuidad produce cierre. |
| `INV-06-84` | Q-007 exige consecuencia aplicada. | vista/nota/revisión no aplicada cierra seguimiento. |
| `INV-06-85` | `ContinuidadOCierreAplicado` referencia Revisión válida. | falta origen válido. |
| `INV-06-86` | Proceso cerrado no se reabre. | mismo ID vuelve a abierto. |

### 8.13. Cobertura M-04

| Unidad | Resolución | Estado |
|---|---|---|
| `7.2-07` | §§6.1, 6.6 y `CerrarPorCierreCuenta` | `RESUELTA` |
| `7.3-13` | §6.2 | `RESUELTA` |
| `7.4-13` | §§6.3–6.4 | `RESUELTA` |
| `7.4-14` | §§7.4–7.5 | `RESUELTA — Q-007` |
| `7.5-03` | §6.5 | `RESUELTA` |
| `7.5-06` | §§6.3–6.5 | `RESUELTA` |
| `7.8-05` | §§5.2, 7.2–7.3 | `RESUELTA` |
| `7.8-08` | `REG-06-75/76` | `RESUELTA — EVENTO EXACTO` |
| `7.16-05` | §§5, 7, 11 | `RESUELTA` |
| `DIR-06-03` | §7.4 | `RESUELTA — Q-007 NO ESTACIONADA` |

**Resultado:** `10/10`.

### 8.14. Estado de Q-007

```text
Q-007: RESUELTA
PROPIETARIO DEL EFECTO: M-04
COORDINACIÓN: M-10
EVENTO: ContinuidadOCierreAplicado
T-06-40: M-10 / M-12
TVCC-30: NO CALCULADA EN B-04
```

### 8.15. Fronteras

Revisión/resultado/Próxima acción → M-10; Planes → M-07/M-08; Capacidad → M-05; autorización/retención → 08; contratos/concurrencia → 09; TVCC-30 → M-12/12; persistencia física no se fija.

### 8.16. Estado de salida

```text
B-04 / M-04
VERSIÓN: v0.1
COBERTURA: 10/10
Q-007: RESUELTA
REG-06-64…78
INV-06-71…86
MÁQUINA: ABIERTO / CERRADO
NUEVO Y VIGENTE: PREDICADOS
B-06: INSTANCIADO
GIT: SIN OPERACIONES
```


---


## 9. B-05 — Capacidad y habilitación configurada

*Fuente ensamblada: `BE_LEG_06_B05_v0_1_CAPACIDAD_Y_HABILITACION_CONFIGURADA.md` · SHA-256 `40951084cf874adad23b4fb7dec994e521cecaeeea35e1a815e33981d4003ebe`.*


### 9.1. Objeto

B-05 define Habilitación configurada y Capacidad configurada para el MVP académico sin cobro real.

Fija Habilitación efectiva, banda/límite, comportamiento sin banda, versionado administrativo, cálculo exacto de asesores, deduplicación Nutrición/Entrenamiento, admisión de Proceso nuevo, exceso de capacidad, pausas y gracia, y compatibilidad antropométrica.

### 9.2. Gobierno y fuentes

| Fuente | SHA-256 | Uso |
|---|---|---|
| `ACTA_DIR_012_APROBACION_ENTREGA_A_Y_HABILITACION_ENTREGA_B.md` | `f3a99015d44e0960e58766bccf15134e79e77d9c54fcd8369db29262ffdef580` | 12 condiciones |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | T-06-13/14 |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | versionado |
| `BE_LEG_06_B02_v0_1_1_PERFIL_PROFESIONAL_VERIFICACION_Y_HABILITACION.md` | `03f220bd428d5abe429e41714981ba49adefa6870e24358e03856ba8b12d058e` | Habilitación separada |
| `BE_LEG_06_B03_v0_1_1_VINCULO_CONSENTIMIENTO_Y_AUTORIZACION.md` | `75e477561a99c98e04a0fa0dd3cd101c42584f3a65ed233667f155337635b815` | Vínculo/Consentimiento |
| `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` | `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5` | Proceso nuevo/abierto/vigente/cerrado |
| `03_Modelo_de_Negocio.md` | `f727de676433fdf6f500ba1daa6d15dd37175fa7bb3c5540142bd06aadbe25e6` | §14 |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-031/041/066 |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-I10 |

### 9.3. Apertura del bloque

#### 9.3.1. Deuda primaria M-05

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.4-12` | regla de capacidad: una solicitud pendiente no ocupa capacidad | `M-03` | — |
| `7.7-12` | comportamiento técnico cuando no existe banda de capacidad configurada | `M-07` | La regla deberá ser determinista y alinearse con el hallazgo o-4 de la contrarrevisión de 04. |
| `7.9-10` | cálculo/regla técnica exacta de capacidad aplicable a la activación | `M-08` | — |
| `7.13-02` | estructura de capacidad configurada | `M-06` | — |
| `7.13-03` | bandas/límites aplicables a procesos nuevos | `M-04` | — |
| `7.13-04` | cálculo exacto de capacidad | `M-04` | — |
| `7.13-05` | definición de qué procesos computan como vigentes/nuevos | `M-04` | — |
| `7.13-06` | comportamiento cuando no hay banda configurada | `M-07 / M-08` | — |
| `7.13-07` | versionado de cambios administrativos de capacidad | `M-06` | — |
| `7.13-08` | invariante: exceder capacidad rechaza un proceso nuevo | `M-04` | — |
| `7.13-09` | invariante: exceder capacidad no interrumpe procesos vigentes | `M-04` | — |
| `7.13-10` | invariante: exceder capacidad no revoca vínculos | `M-03` | — |
| `7.13-11` | invariante: exceder capacidad no borra datos | `M-06` | — |
| `7.13-12` | compatibilidad con identidad que posea únicamente capacidad antropométrica verificada conforme a DEC-044 | `M-02 / M-09` | — |
| `DIR-06-01` | pausas y períodos de gracia de capacidad | `M-04 / 08` | Propiedad de 06 confirmada por instrucción de dirección y contrarrevisión de 04; no se fija todavía la regla concreta. |
| `DIR-06-02` | comportamiento por defecto de capacidad cuando no existe banda configurada | `M-07 / M-08` | Debe quedar determinista; la contrarrevisión de 04 recomienda 'sin límite' como comportamiento coherente a resolver en 06. |

**Cobertura objetivo:** `16/16`.

#### 9.3.2. Términos ejecutados

- `T-06-13 — Habilitación`, configuración académica.
- `T-06-14 — Capacidad configurada`.

#### 9.3.3. Términos recurrentes nuevos

`NINGUNO`.

`HABILITADA`, `NO_HABILITADA`, `LIMITADA` y `SIN_LIMITE` son tokens locales de configuración.

### 9.4. Habilitación configurada

#### 9.4.1. Estado efectivo

Para profesional + Alcance:

```text
HABILITADA
NO_HABILITADA
```

**`REG-06-79` — Habilitación requiere concesión explícita.**

Ausencia de concesión efectiva no se interpreta como Habilitación. Esto no equivale a Verificación ni Autorización.

#### 9.4.2. Versionado

**`REG-06-80` — Habilitación administrativa versionada.**

Cada cambio confirmado emite nueva Versión B-06, conserva la anterior, profesional, Alcance, actor, motivo/procedencia y doble temporalidad.

No existe cambio por pago real en el MVP académico.

#### 9.4.3. Efecto sobre procesos

Retirar Habilitación vuelve no vigente el Proceso según B-04, pero no lo cierra, borra ni libera capacidad por inferencia.

### 9.5. Capacidad configurada

#### 9.5.1. Propiedad

**`REG-06-81` — La capacidad pertenece a la identidad profesional.**

Existe una única capacidad efectiva por identidad profesional para el cómputo. Nutrición y Entrenamiento no poseen bandas separadas que dupliquen al asesorado.

#### 9.5.2. Modos

```text
LIMITADA
SIN_LIMITE
```

`LIMITADA` conserva un límite entero no negativo de asesores únicos.

#### 9.5.3. Sin banda configurada

**`REG-06-82` — Sin banda configurada = SIN_LIMITE para capacidad.**

Cuando no existe Versión efectiva de Capacidad:

```text
modo efectivo = SIN_LIMITE
```

No implica Habilitación.

#### 9.5.4. Versionado

**`REG-06-83` — Capacidad configurada versionada.**

Cambiar modo, límite o parámetro de gracia crea nueva Versión, conserva anterior, actor, motivo/procedencia y doble temporalidad. No reescribe admisiones históricas.

#### 9.5.5. Parámetro de gracia

La Versión puede incluir duración opcional de gracia para pausas. B-05 no fija un valor universal. Ausencia o valor funcional cero = sin gracia.

### 9.6. Cómputo de asesorado activo

#### 9.6.1. Regla normal

Para profesional `P`, asesorado `A` ocupa capacidad normalmente cuando existe al menos un Alcance con:

1. Proceso `ABIERTO` bajo P;
2. Vínculo `ACEPTADO`;
3. Consentimiento `VIGENTE`;
4. cuenta no `CERRADA`.

Verificación, Habilitación y autorización no liberan silenciosamente la ocupación de un Proceso ya abierto.

#### 9.6.2. Unidad de conteo

**`REG-06-84` — Un asesorado cuenta una vez por profesional.**

```text
AsesoresNormales(P)
=
{ A |
  existe Proceso ABIERTO
  + Vínculo ACEPTADO
  + Consentimiento VIGENTE
  bajo P
}
```

Nutrición + Entrenamiento con el mismo profesional siguen siendo una unidad.

#### 9.6.3. Exclusiones directas

No ocupan por sí mismos:

- Solicitud `PENDIENTE`;
- solicitud rechazada/caducada/invalidada;
- Vínculo aceptado sin Proceso abierto;
- todos los Procesos cerrados;
- Consentimiento revocado si no queda otro Alcance elegible;
- consulta antropométrica aislada.

#### 9.6.4. Archivo

**`REG-06-85` — Archivo no libera un Proceso abierto por etiqueta.**

Una proyección archivada no sustituye las fuentes de dominio. Si hay Proceso abierto elegible, la situación es inconsistente y no libera capacidad.

### 9.7. Pausas y períodos de gracia

#### 9.7.1. Disparador

Si A deja de pertenecer a `AsesoresNormales(P)` exclusivamente porque todos sus Vínculos relevantes pasan de `ACEPTADO` a `PAUSADO`, B-05 evalúa gracia.

#### 9.7.2. Sin gracia

**`REG-06-86` — Pausa sin gracia libera ocupación normal.**

Sin duración configurada, A deja de ocupar al perder elegibilidad normal. El Proceso sigue abierto.

#### 9.7.3. Con gracia

**`REG-06-87` — Gracia de capacidad por asesorado único.**

Con gracia:

- se registra intervalo profesional + asesorado;
- inicio = ocurrencia de la pausa que produjo la salida;
- fin = inicio + duración configurada;
- durante el intervalo A sigue ocupando una unidad;
- varios Alcances pausados no duplican.

#### 9.7.4. Corte anticipado

**`REG-06-88` — La gracia no prevalece sobre exclusiones terminales.**

Termina antes si se cierra la cuenta, finaliza el Vínculo, se revoca Consentimiento sin otro Alcance elegible o se cierran todos los Procesos.

#### 9.7.5. Reanudación

Antes del fin, vuelve al conjunto normal sin duplicar.

Después del fin, si el Proceso sigue abierto, reanudar es continuidad; puede llevar la ocupación por encima del límite, pero no reabre ni crea Proceso nuevo.

### 9.8. Conteo efectivo

**`REG-06-89` — Unión deduplicada normal + gracia.**

```text
AsesoresEfectivos(P)
=
AsesoresNormales(P)
∪ AsesoresEnGracia(P)

ocupacion(P)
=
|AsesoresEfectivos(P)|
```

No se suman procesos, especialidades ni Alcances.

### 9.9. Evaluación de Proceso nuevo

#### 9.9.1. Proyección

B-04 entrega candidato `NUEVO`. B-05 calcula la ocupación que resultaría si la apertura fuera exitosa.

**`REG-06-90` — Admisión por conteo proyectado.**

#### 9.9.2. Regla exacta

**`REG-06-91` — Regla determinista de admisión.**

```text
si modo = SIN_LIMITE
→ capacidad no rechaza

si modo = LIMITADA y ocupacion_actual > L
→ rechazar todo Proceso NUEVO

si modo = LIMITADA y ocupacion_actual <= L
→ admitir si ocupacion_proyectada <= L
→ rechazar si ocupacion_proyectada > L
```

Si `ocupacion_actual = L` y el asesorado ya cuenta por otro Proceso con el mismo profesional, otro Proceso suyo no excede la unidad de conteo y no se rechaza por capacidad.

#### 9.9.3. Continuidad

**`REG-06-92` — Capacidad no bloquea continuidad de Proceso existente.**

Una versión sucesora dentro de Proceso `ABIERTO` no es Proceso nuevo. A límite o sobre límite pueden mantenerse, revisarse y cerrarse los Procesos existentes.

### 9.10. Límite alcanzado o superado

#### 9.10.1. Rechazo

**`REG-06-93` — Rechazo de apertura sin interrupción.**

Si un Proceso nuevo excede capacidad:

- no se crea;
- no se declara exitosa la activación que pretendía abrirlo;
- no se interrumpen Procesos existentes;
- no se revocan Vínculos/Consentimientos;
- no se borran datos.

#### 9.10.2. Reducción de banda

**`REG-06-94` — Reducir banda puede producir sobreocupación sin cierre.**

Si nuevo límite < ocupación actual:

- la configuración puede quedar efectiva;
- los Procesos continúan;
- nadie es expulsado;
- todo Proceso nuevo queda bloqueado mientras ocupación > límite;
- revisar/cerrar sigue disponible.

#### 9.10.3. Reanudación después de gracia

**`REG-06-95` — Reanudación de Proceso existente no se convierte en apertura nueva.**

Una reanudación tardía puede generar sobreocupación. No se interrumpe el Proceso existente; mientras persista la sobreocupación no se admiten Procesos nuevos.

### 9.11. Antropometría y capacidad

#### 9.11.1. Perfil exclusivamente antropométrico

**`REG-06-96` — Compatibilidad con DEC-044.**

Es válida una identidad con cero Especialidades, Capacidad antropométrica verificada y Habilitación antropométrica efectiva.

#### 9.11.2. Consulta aislada

No crea Proceso de B-04, no ocupa capacidad, no crea banda paralela y sí respeta los gates aplicables.

### 9.12. Sin cobro real

Queda fuera del modelo:

- importe;
- moneda;
- factura;
- transacción;
- medio de pago;
- renovación cobrada;
- deuda;
- comisión;
- pasarela.

Capacidad/Habilitación se configuran académicamente sin operación económica real.

### 9.13. Reglas locales consolidadas

- **`REG-06-79` — Habilitación requiere concesión explícita.**
- **`REG-06-80` — Habilitación administrativa versionada.**
- **`REG-06-81` — La capacidad pertenece a la identidad profesional.**
- **`REG-06-82` — Sin banda configurada = SIN_LIMITE para capacidad.**
- **`REG-06-83` — Capacidad configurada versionada.**
- **`REG-06-84` — Un asesorado cuenta una vez por profesional.**
- **`REG-06-85` — Archivo no libera un Proceso abierto por etiqueta.**
- **`REG-06-86` — Pausa sin gracia libera ocupación normal.**
- **`REG-06-87` — Gracia de capacidad por asesorado único.**
- **`REG-06-88` — La gracia no prevalece sobre exclusiones terminales.**
- **`REG-06-89` — Unión deduplicada normal + gracia.**
- **`REG-06-90` — Admisión por conteo proyectado.**
- **`REG-06-91` — Regla determinista de admisión.**
- **`REG-06-92` — Capacidad no bloquea continuidad de Proceso existente.**
- **`REG-06-93` — Rechazo de apertura sin interrupción.**
- **`REG-06-94` — Reducir banda puede producir sobreocupación sin cierre.**
- **`REG-06-95` — Reanudación de Proceso existente no se convierte en apertura nueva.**
- **`REG-06-96` — Compatibilidad con DEC-044.**

### 9.14. Invariantes locales

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-87` | Habilitación no se presume. | un Alcance queda habilitado sin concesión. |
| `INV-06-88` | Habilitación, Verificación, Capacidad y Autorización están separadas. | una sustituye otra. |
| `INV-06-89` | Capacidad pertenece a identidad profesional. | bandas por especialidad duplican conteo. |
| `INV-06-90` | Sin banda = `SIN_LIMITE`. | ausencia bloquea o varía por recorrido. |
| `INV-06-91` | Nueva configuración no reescribe la anterior. | cambiar límite/habilitación muta historia. |
| `INV-06-92` | Asesorado cuenta máximo una vez por profesional. | varios Procesos/Alcances suman varias unidades. |
| `INV-06-93` | Solicitud/aceptación sin Proceso abierto no ocupan. | se cuenta por relación aislada. |
| `INV-06-94` | Consentimiento revocado deja de aportar ocupación normal. | se cuenta solo por Alcance revocado. |
| `INV-06-95` | Consulta antropométrica aislada no ocupa. | agrega unidad. |
| `INV-06-96` | Gracia solo compensa salida causada por pausa. | ignora cierre/revocación/finalización. |
| `INV-06-97` | Gracia cuenta por asesorado, no Alcance. | dos pausas suman dos. |
| `INV-06-98` | Conteo efectivo es unión deduplicada. | normal + gracia duplica. |
| `INV-06-99` | Proceso nuevo respeta `REG-06-91`. | se abre contra proyección. |
| `INV-06-100` | Exceso no interrumpe Procesos existentes. | banda cierra/pausa. |
| `INV-06-101` | Exceso no revoca Vínculos/Consentimientos. | control de capacidad altera relaciones. |
| `INV-06-102` | Exceso no borra datos. | denegación elimina historia. |
| `INV-06-103` | Reducir banda no expulsa asesores. | aplicar configuración cierra procesos. |
| `INV-06-104` | Continuidad no se reclasifica como Proceso nuevo. | versión sucesora consume admisión. |
| `INV-06-105` | M-05 no incorpora cobro real. | capacidad/habilitación depende de pago implementado. |

### 9.15. Cobertura M-05

| Unidad | Resolución | Estado |
|---|---|---|
| `7.4-12` | §6.3 + `INV-06-93` | `RESUELTA` |
| `7.7-12` | §5.3 + `REG-06-82` | `RESUELTA` |
| `7.9-10` | §§8–9 | `RESUELTA` |
| `7.13-02` | §§5.1–5.4 | `RESUELTA` |
| `7.13-03` | §5.2 | `RESUELTA` |
| `7.13-04` | §§6–9 | `RESUELTA` |
| `7.13-05` | B-04 §§4–5 + B-05 §§6, 9 | `RESUELTA` |
| `7.13-06` | `REG-06-82` | `RESUELTA` |
| `7.13-07` | `REG-06-80/83` + B-06 | `RESUELTA` |
| `7.13-08` | `REG-06-91/93` | `RESUELTA` |
| `7.13-09` | `REG-06-92/94/95` | `RESUELTA` |
| `7.13-10` | `REG-06-93` + `INV-06-101` | `RESUELTA` |
| `7.13-11` | `REG-06-93` + `INV-06-102` | `RESUELTA` |
| `7.13-12` | §11 | `RESUELTA` |
| `DIR-06-01` | §7 | `RESUELTA` |
| `DIR-06-02` | §5.3 | `RESUELTA` |

**Resultado:** `16/16`.

### 9.16. Fronteras

Proceso → B-04; Habilitación como dimensión → B-02; Vínculo/Consentimiento → B-03; Planes → B-07/B-08; acceso/auditoría/retención → 08; despliegue → 07; contratos/concurrencia → 09; UI → 10; cobro real fuera.

### 9.17. Estado de salida

```text
B-05 / M-05
VERSIÓN: v0.1
COBERTURA: 16/16
UNIDAD: ASESORADO ÚNICO POR PROFESIONAL
SIN BANDA: SIN_LIMITE
PAUSA: GRACIA ESTRUCTURAL OPCIONAL
EXCESO: RECHAZA NUEVO / NO INTERRUMPE EXISTENTES
COBRO REAL: NO
REG-06-79…96
INV-06-87…105
B-06: INSTANCIADO
GIT: SIN OPERACIONES
```


---


## 10. B-07 — Circuito nutricional

*Fuente ensamblada: `BE_LEG_06_B07_v0_1_2_CIRCUITO_NUTRICIONAL.md` · SHA-256 `ae7e874891652ffce5ebc3c7655f0505f579cbb5cd0c6214b6bce11977e0aeb2`.*


### 10.1. Objeto

B-07 define `M-07 — Circuito nutricional` y, conforme a ACTA-DIR-013 §7.1, fija **una sola vez** la estructura común que B-08 reutiliza para su vertical espejo:

```text
Evaluación
→ Objetivo vigente
→ Plan profesional
→ Borrador de versión
→ Validación
→ Activación
→ Instantánea reproducible
→ Ejecución/adherencia registrada
→ Revisión M-10
→ Continuidad/cierre M-04
```

La estructura común se expresa mediante `REG-06-97…108`. B-08 debe instanciarla, no copiarla con otros nombres.

B-07 agrega únicamente la especialización nutricional necesaria: evaluación nutricional, distinción de fuentes de dato, catálogo nutricional y registro simple de adherencia/ejecución.

No fija alimentos, macros, calorías, cantidades, porciones, fórmulas nutricionales ni contenido profesional concreto.

**Alcance de v0.1.1.** Por `ACTA-DIR-014 §5`, esta revisión es exclusivamente aditiva: conserva las reglas aprobadas `REG-06-97…110`, incorpora la profundidad estructural ordenada por `DEC-046`, no reabre `B-00…B-06`, no altera 04/05 y no modifica la matriz de cobertura.

**Alcance de v0.1.2.** Por `ACTA-DIR-015 §6`, esta revisión es **aditiva y mínima** sobre la baseline aprobada v0.1.1: incorpora exclusivamente evidencia visual opcional de ingesta, recursos didácticos licenciados y la política de ámbito de recursos de `DEC-047`; no reabre `B-00…B-06`, no modifica `REG-06-97…125`, no altera la matriz de cobertura, no modela proyecciones/cálculos de `B-11` y no fija formatos, resoluciones, cuotas o almacenamiento.

### 10.2. Gobierno y fuentes

| Fuente | SHA-256 | Uso |
|---|---|---|
| `ACTA_DIR_014_APROBACION_ENTREGA_C_DEC046_Y_REVISION_ACOTADA.md` | `FUENTE ADJUNTA DE ESTA RONDA` | aprobación de v0.1 y alcance vinculante de v0.1.1 |
| `BE_LEG_06_B07_v0_1_CIRCUITO_NUTRICIONAL.md` | `16184a3ea1c080f90de79495d8f1f1fd91977b04d84a13c2461f66f52aa66ccf` | baseline aprobada que no se rediseña |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | REG-06-07, T-06-26…31 y mecanismo de alta terminológica |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | Versión, snapshot, Corrección trazable, historia, procedencia |
| `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` | `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5` | Proceso nuevo/abierto/vigente/cerrado y continuidad |
| `BE_LEG_06_B05_v0_1_CAPACIDAD_Y_HABILITACION_CONFIGURADA.md` | `40951084cf874adad23b4fb7dec994e521cecaeeea35e1a815e33981d4003ebe` | admisión de Proceso nuevo |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-026…035; sin modificación |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-P09…P13, UC-I04/I06/I08; sin modificación |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | 18 unidades primarias M-07 |
| `BE_PROCESO_PROFESIONAL_VERTICAL_NUTRICION.md` | `60c139c6b34e3c10e85738d30608cf2ab5a7c0a725226c3b8ff5d45b6e2b1756` | fundamento de dominio no normativo citado por DEC-046 |

**Fuentes adicionales de v0.1.2:** `ACTA-DIR-015` (SHA-256 `53e6243476fb8c2720bb7ca6e3abad5aa0b262c05cd9427aab1d0fcd4a8d74b5`) y `DEC-047` (SHA-256 `42e1932312970d3410257ad7cf11f4a21b4848fd4ea9a24d42077fe90ad0d01a`). Ambas se usan solo para el delta aditivo autorizado.

### 10.3. Apertura

#### 10.3.1. Deuda primaria M-07

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.6-01` | estructura de evaluación nutricional | `M-06` | — |
| `7.6-02` | campos conceptuales definitivos y relaciones con asesorado, profesional, período y fuentes | `M-01 / M-02 / M-06` | — |
| `7.6-03` | estructura del objetivo nutricional | `M-06` | — |
| `7.6-04` | relación evaluación → objetivo | `M-04` | — |
| `7.6-05` | versionado del objetivo y conservación de antecedentes | `M-06` | — |
| `7.6-06` | vigencia técnica | `M-04` | — |
| `7.6-07` | distinción estructural entre dato informado, observado y calculado cuando corresponda | `M-00` | — |
| `7.7-01` | estructura del catálogo propio | `M-06` | — |
| `7.7-02` | estructura del plan nutricional | `M-06` | — |
| `7.7-03` | normalización de elementos del catálogo | `M-00` | — |
| `7.7-04` | estructura de borrador y cadena de versiones | `M-06` | — |
| `7.7-05` | relaciones plan ↔ evaluación ↔ objetivo | `M-04` | — |
| `7.7-06` | estados y transiciones de plan | `M-00 / M-04` | — |
| `7.7-07` | invariantes de validación antes de activar | `M-04 / M-05` | — |
| `7.7-08` | estructura de la versión activada | `M-06` | — |
| `7.7-13` | estructura de ejecución/adherencia necesaria para el circuito | `M-04 / M-11` | — |
| `7.7-14` | reglas de unicidad de registros del período cuando corresponda | `M-00` | — |
| `7.7-15` | continuidad versionada después de revisión | `M-10 / M-06` | — |

**Cobertura objetivo:** `18/18`. **v0.1.1 no agrega, elimina ni reasigna unidades.**

#### 10.3.2. Términos ejecutados

- `T-06-26 — Activación de plan`.
- `T-06-27 — Objetivo vigente`.
- `T-06-28 — Plan profesional / Plan nutricional`.
- `T-06-29 — Borrador de plan · Versión activada`.
- `T-06-30 — Adherencia o ejecución registrada`.
- `T-06-31 — Catálogo propio · Importación controlada`.

#### 10.3.3. Altas terminológicas de v0.1.1

Por orden expresa de `ACTA-DIR-014 §5.1`, y mediante el mecanismo de alta referido allí como `B-00 §10.1`, se registran en la apertura del bloque **sin reabrir B-00**:

| ID | Término | Propiedad / uso en esta revisión |
|---|---|---|
| `T-06-47` | Día tipo | `M-07`; unidad temporal interna de una Versión de plan nutricional |
| `T-06-48` | Comida | `M-07`; nivel de la jerarquía nutricional |
| `T-06-49` | Opción de comida | `M-07`; alternativa `1..N` dentro de una Comida |
| `T-06-50` | Ítem prescripto | `M-07`; unidad prescripta dentro de una Opción de comida |
| `T-06-51` | Grupo de intercambio | `M-07`; agrupación declarada y versionada para modalidad B |
| `T-06-52` | Nutriente crítico | `M-07`; referencia declarada por Grupo de intercambio |
| `T-06-53` | Estado de preparación | `M-07`; condición obligatoria de todo Ítem prescripto con cantidad |
| `T-06-54` | Ingesta registrada | `M-07`; evidencia de consumo registrada, incluida la descripción libre |
| `T-06-55` | Atributo nutricional extendido | `M-07`; atributo opcional de catálogo con procedencia y versión |
| `T-06-56` | Modalidad de prescripción y registro nutricional | `M-07`; discriminador estructural entre las tres modalidades de DEC-046 |

Estas altas no cambian definiciones heredadas ni crean una taxonomía profesional cerrada fuera de lo decidido por `DEC-046`.

#### 10.3.4. Decisión de patrón espejo

B-07 continúa siendo la definición primaria de las reglas comunes `REG-06-97…108`. B-08 las reutiliza por referencia.

Las adiciones de `DEC-046` en §§17–19 son **especialización nutricional** y no se elevan artificialmente a patrón común con Entrenamiento.


#### 10.3.5. Altas terminológicas de v0.1.2

Por `ACTA-DIR-015 §6` y el mecanismo de `B-00 §10.1`, se registran en la apertura **sin reabrir B-00**:

| ID | Término | Propiedad / uso |
|---|---|---|
| `T-06-64` | Recurso didáctico de catálogo | Estructura opcional y versionada asociable a elementos de catálogo; conserva procedencia, autoría y licencia obligatoria. B-08 la reutiliza sin duplicación semántica. |
| `T-06-65` | Evidencia visual de ingesta | Adjunto visual opcional de una Ingesta registrada; conserva autoría, momento y procedencia y no altera la naturaleza estimada de una cuantificación profesional posterior. |
| `T-06-66` | Atlas de referencia de porciones | Conjunto global, curado y acotado de referencias visuales de tamaño; no constituye medición ni catálogo libre por profesional. |

No se da de alta ninguna proyección, métrica derivada, formato de archivo, cuota, política de retención ni mecanismo de almacenamiento.

---

### 10.4. Evaluación vertical — patrón reutilizable

**`REG-06-97` — Evaluación vertical identificable.**

Toda evaluación de una vertical conserva, como mínimo conceptual:

- identificador de dominio;
- asesorado;
- profesional responsable;
- Alcance;
- período o contexto temporal identificable;
- fuentes utilizadas;
- actor y autoría;
- momento de ocurrencia;
- momento de registro;
- procedencia;
- conjunto de datos pertinentes del dominio.

La evaluación es un hecho distinto de objetivo, plan y ejecución.

Una evaluación posterior no sobrescribe silenciosamente una evaluación anterior.

---

### 10.5. Objetivo vigente — patrón reutilizable

**`REG-06-98` — Objetivo versionado y vigencia explícita.**

Un Objetivo:

- referencia una Evaluación aplicable;
- conserva responsable;
- período o vigencia;
- fundamento;
- autoría y procedencia;
- se representa mediante Versiones de B-06.

La vigencia no se determina por “última fecha”. La vertical conserva una relación explícita hacia la Versión de objetivo efectiva.

Modificar el objetivo genera una nueva Versión y preserva antecedentes.

---

### 10.6. Catálogo propio e importación controlada — patrón reutilizable

#### 10.6.1. Catálogo

**`REG-06-99` — Elemento de catálogo normalizado y con procedencia.**

Cada elemento operativo del catálogo BE conserva:

- identificador BE estable;
- representación normalizada suficiente para que el dominio pueda referenciarlo;
- procedencia;
- condición de disponibilidad para nuevas planificaciones;
- referencia externa cuando provenga de proveedor.

La normalización no sustituye el dato de origen ni borra procedencia.

#### 10.6.2. Importación

**`REG-06-100` — Importación controlada con fallback observable.**

Una importación externa:

1. identifica proveedor y momento aplicable;
2. valida antes de incorporar;
3. permite corregir o rechazar datos insuficientes;
4. solo declara incorporación exitosa cuando existe un elemento BE válido;
5. conserva procedencia;
6. ante indisponibilidad externa permite continuar con catálogo propio/carga manual;
7. nunca declara éxito del proveedor durante el fallback.

Contratos/transporte pertenecen a 07/09. `Q-008` permanece abierta en 07.

#### 10.6.3. Inmutabilidad hacia planes emitidos

**`REG-06-101` — Cambio de catálogo no reescribe lo emitido.**

Cambiar, retirar o corregir posteriormente un elemento del catálogo:

- puede afectar nuevas planificaciones;
- no modifica una Versión activada;
- no reconstruye una Instantánea reproducible histórica.

---

### 10.7. Plan profesional y máquina común de Versión de plan

#### 10.7.1. Relación estructural

**`REG-06-102` — Plan relacionado con evaluación y objetivo.**

El Plan profesional conserva:

- asesorado;
- profesional;
- Alcance;
- Evaluación de referencia;
- Versión de Objetivo aplicable;
- conjunto de Versiones de plan;
- relación explícita a la Versión activada efectiva cuando exista.

El contenido prescriptivo concreto queda fuera del modelo conceptual de 06.

#### 10.7.2. Entidad de la máquina

La máquina pertenece a cada **Versión de plan**, no al Proceso operativo de B-04.

#### 10.7.3. Estados cerrados

```text
BORRADOR
ACTIVADA
```

`ACTIVADA` es un hecho histórico inmutable. `ACTIVADA` no equivale automáticamente a “vigente”: la vigencia actual depende de la relación efectiva del Plan y del estado del Proceso.

#### 10.7.4. Lista blanca

| Transición | Origen → destino | Condiciones | Efectos |
|---|---|---|---|
| `CrearBorrador` | inicio → `BORRADOR` | evaluación/objetivo identificables cuando corresponda | crea versión editable no visible como vigente |
| `GuardarBorrador` | `BORRADOR → BORRADOR` | cambios válidos como borrador | conserva condición no activa |
| `ActivarVersion` | `BORRADOR → ACTIVADA` | §§8–9 | vuelve inmutable esa Versión y actualiza relación efectiva |

No existe transición que edite o devuelva una Versión `ACTIVADA` a `BORRADOR`.

Una continuidad posterior crea otra Versión.

#### 10.7.5. Borrador vs histórico emitido

**`REG-06-103` — Borrador nunca altera una Versión activada.**

Guardar, retomar o corregir un Borrador:

- no cambia la relación de vigencia;
- no altera una Instantánea reproducible;
- no ocupa capacidad por sí mismo;
- no se presenta como plan vigente.

---

### 10.8. Activación con B-06, B-05 y B-04

**`REG-06-104` — Activación vertical atómica.**

`ActivarVersion` reutiliza, sin redefinir:

1. validación funcional de la vertical;
2. B-06 para Versionar y preservar Instantánea reproducible;
3. B-05 cuando B-04 clasifica la operación como Proceso `NUEVO`;
4. B-04 `AbrirProceso` cuando la activación efectivamente inicia un Proceso nuevo.

La activación solo se declara exitosa cuando:

- la Versión validada coincide con la confirmada;
- puede preservarse la Instantánea reproducible;
- la admisión por capacidad fue favorable cuando corresponde;
- la nueva Versión puede quedar como única Versión efectiva sin contradicción;
- el evento completo es trazable.

Si cualquiera falla, la vigencia previa permanece.

#### 10.8.1. Snapshot

**`REG-06-105` — La consulta y ejecución se anclan a lo emitido.**

La Instantánea reproducible de la Versión activada permite reconstruir exactamente lo indicado al asesorado en ese momento.

La consulta del asesorado y la ejecución posterior referencian la Versión activada/Instantánea correspondiente, no el catálogo ni borrador actuales.

#### 10.8.2. Sustitución

Activar una sucesora:

- conserva la Versión activada anterior;
- conserva su snapshot;
- actualiza de forma explícita la relación de Versión efectiva;
- no crea un Proceso nuevo si B-04 determina continuidad del Proceso ya abierto.

---

### 10.9. Ejecución/adherencia — patrón reutilizable

**`REG-06-106` — Ejecución registrada vinculada a lo planificado.**

Todo registro confirmado de ejecución/adherencia conserva:

- asesorado;
- dominio;
- Versión activada de referencia;
- parte, sesión u ocurrencia planificada a la que aplica, cuando corresponda;
- momento de ocurrencia;
- momento de registro;
- autor;
- contexto/observación permitida;
- procedencia.

La ejecución nunca modifica la prescripción de la Versión activada.

#### 10.9.1. Unicidad

**`REG-06-107` — Reintento no duplica una ejecución equivalente.**

La vertical declara una clave lógica de unicidad por:

- asesorado;
- Versión activada;
- período/ocurrencia planificada aplicable.

Un reintento de la misma confirmación no crea un segundo hecho equivalente.

La concurrencia técnica y la idempotencia contractual se prueban en 11A/09.

---

### 10.10. Continuidad posterior a revisión — patrón reutilizable

**`REG-06-108` — Continuidad vertical consume M-10/M-04 sin taxonomía paralela.**

Después de una Revisión profesional válida:

- `MANTENER`: conserva la Versión efectiva y registra próxima acción;
- `AJUSTAR`: prepara continuidad de planificación sin modificar la Versión activada histórica;
- `SUSTITUIR`: prepara una planificación sucesora/reemplazo trazable;
- `REPROGRAMAR_REVISION`: no cambia silenciosamente la planificación;
- `CAMBIAR_OBJETIVO`: emite nueva Versión de objetivo antes de la planificación que corresponda;
- `FINALIZAR`: M-04 aplica cierre del Proceso.

Toda modificación de contenido ya emitido que deba llegar al asesorado pasa por Borrador + nueva Activación.

B-07/B-08 no redefinen `ContinuidadOCierreAplicado` ni la Revisión válida.

---

### 10.11. Especialización nutricional — baseline aprobada

#### 10.11.1. Evaluación nutricional

**`REG-06-109` — Fuente de cada dato nutricional preservada.**

La evaluación nutricional instancia `REG-06-97` y, para cada dato pertinente, conserva si fue:

- informado por el asesorado/fuente;
- observado/registrado directamente;
- calculado a partir de entradas identificables cuando corresponda.

B-07 no fija fórmulas ni convierte un cálculo en observación.

#### 10.11.2. Plan nutricional

El Plan nutricional instancia §§7–8.

Su estructura puede contener elementos profesionales suficientes para ejecutar el plan, pero B-07 no fija alimentos concretos, comidas, macros, calorías, porciones, cantidades ni reglas prescriptivas.

**`REG-06-110` — Estructura nutricional sin contenido profesional normado.**

Los elementos del Plan pueden referenciar Catálogo propio y contenido profesional, pero el Documento 06 solo conserva relaciones, Versiones, orden/contexto necesario y procedencia.

En v0.1.1, la frase anterior conserva su alcance original respecto del **contenido profesional concreto**; `DEC-046` agrega en §§17–19 únicamente estructura de dominio y no valores prescriptivos.

#### 10.11.3. Adherencia o ejecución nutricional

El registro nutricional instancia `REG-06-106/107`.

Conserva como mínimo fecha/ocurrencia, Versión activada, autor y observación opcional.

B-07 no define fórmula de adherencia, puntuación o interpretación automática.

---

### 10.12. Máquinas declaradas

#### 10.12.1. Versión de plan

Máquina: `BORRADOR → ACTIVADA`, definida en §7.

#### 10.12.2. Evaluación, Objetivo, Catálogo y ejecución nutricional

No se crean máquinas adicionales:

- Evaluación = hecho de dominio;
- Objetivo = estructura versionada con relación efectiva;
- Catálogo = estructura operativa con procedencia;
- ejecución nutricional = hecho confirmado.

La incorporación de `Ingesta registrada` y su eventual estructuración profesional posterior en v0.1.1 **no agrega una máquina paralela**: cuando existe corrección posterior, instancia `Corrección trazable` de B-06.

---

### 10.13. Invariantes locales — baseline aprobada

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-106` | Evaluación, Objetivo, Plan y ejecución son hechos/estructuras distintos. | una modificación de uno sobrescribe otro. |
| `INV-06-107` | Objetivo efectivo se resuelve por relación/versionado, no por última fecha. | el más reciente por timestamp se vuelve vigente sin relación explícita. |
| `INV-06-108` | Borrador no es Versión activada. | se presenta o ejecuta un borrador como vigente. |
| `INV-06-109` | Versión activada es inmutable. | se edita directamente después de activar. |
| `INV-06-110` | Existe como máximo una Versión efectiva compatible por Plan. | el asesorado recibe dos vigencias contradictorias. |
| `INV-06-111` | Activación exitosa exige snapshot reproducible. | se declara activa sin poder reconstruir lo emitido. |
| `INV-06-112` | Capacidad se consulta solo al abrir Proceso nuevo. | continuidad se rechaza como nueva admisión. |
| `INV-06-113` | Ejecución referencia una Versión activada. | se registra contra un borrador o versión indeterminada. |
| `INV-06-114` | Reintento no duplica ejecución equivalente. | misma ocurrencia confirmada genera dos hechos. |
| `INV-06-115` | Cambios de Catálogo no alteran snapshots históricos. | una versión emitida cambia por modificar catálogo. |
| `INV-06-116` | Fallback externo no se declara importación exitosa. | caída de proveedor se registra como éxito externo. |
| `INV-06-117` | Continuidad posterior a revisión preserva Versiones previas. | AJUSTAR/SUSTITUIR modifica lo activado hacia atrás. |

---

### 10.14. Cobertura M-07 — sin alteración

| Unidad | Resolución | Estado |
|---|---|---|
| `7.6-01` | §11.1 + REG-06-97/109 | `RESUELTA` |
| `7.6-02` | §4 + §11.1 | `RESUELTA` |
| `7.6-03` | §5 | `RESUELTA` |
| `7.6-04` | REG-06-98/102 | `RESUELTA` |
| `7.6-05` | REG-06-98 + B-06 | `RESUELTA` |
| `7.6-06` | REG-06-98 | `RESUELTA` |
| `7.6-07` | REG-06-109 | `RESUELTA` |
| `7.7-01` | §6 | `RESUELTA` |
| `7.7-02` | §§7, 11.2 | `RESUELTA` |
| `7.7-03` | REG-06-99 | `RESUELTA` |
| `7.7-04` | §§7.3–7.5 + B-06 | `RESUELTA` |
| `7.7-05` | REG-06-102 | `RESUELTA` |
| `7.7-06` | §7.3–7.4 | `RESUELTA` |
| `7.7-07` | REG-06-104 + INV-06-111/112 | `RESUELTA` |
| `7.7-08` | REG-06-104/105 + B-06 | `RESUELTA` |
| `7.7-13` | §§9, 11.3 | `RESUELTA` |
| `7.7-14` | REG-06-107 | `RESUELTA` |
| `7.7-15` | §10 | `RESUELTA` |

**Resultado:** `18/18`.

---

### 10.15. Fronteras

- B-06: Versiones, snapshot, correcciones e historia.
- B-04: Proceso y continuidad/cierre.
- B-05: capacidad.
- M-10: Revisión profesional válida, resultados y Próxima acción.
- 07/09: proveedores, contratos y transporte.
- 08: acceso, retención, auditoría.
- 10: formularios, editores y Hoy.
- 11A: concurrencia/instrumentos de prueba.
- contenido nutricional profesional: fuera del modelo.
- `Q-008`: permanece en 07.
- cálculo de carga glucémica: diferido por `DEC-046`; no se implementa ni formula en este bloque.

---

### 10.16. Estado de baseline preservada

La baseline `v0.1` permanece aprobada con:

```text
COBERTURA: 18/18
PATRÓN ESPEJO COMÚN: REG-06-97…108
ESPECIALIZACIÓN NUTRICIONAL APROBADA: REG-06-109…110
INV APROBADAS: INV-06-106…117
MÁQUINA DE VERSIÓN DE PLAN: BORRADOR / ACTIVADA
```

Ninguno de esos identificadores se renumera, sustituye o elimina en `v0.1.1`.

---

### 10.17. Revisión aditiva DEC-046 — jerarquía y modalidades nutricionales

#### 10.17.1. Jerarquía interna del plan

**`REG-06-118` — Jerarquía nutricional de la Versión de plan.**

Una Versión de Plan nutricional conserva una jerarquía identificable:

```text
Versión de plan
→ Día tipo [1..N]
→ Comida [1..N]
→ Opción de comida [1..N]
→ Ítem prescripto [1..N]
```

El `Día tipo` es la unidad temporal interna de la vertical y **no se agenda en fechas**. Una misma Versión puede contener uno o varios Días tipo. La Instantánea reproducible conserva la jerarquía, el orden/contexto y las relaciones exactamente como fueron emitidos.

#### 10.17.2. Tres modalidades estructurales

**`REG-06-119` — Tres modalidades de prescripción y registro nutricional.**

La estructura admite, sin convertir una metodología profesional en regla universal:

1. **opción de plato armado (modalidad A);**
2. **porciones de intercambio (modalidad B);**
3. **registro descriptivo libre (modalidad C).**

La modalidad utilizada queda identificable en el contexto al que aplica. La coexistencia de modalidades no crea otra máquina de Plan ni altera `REG-06-97…110`.

##### 10.17.2.1. Modalidad A — opción de plato armado

Una Comida puede ofrecer alternativas cerradas de Opción de comida. Cada Ítem prescripto de una alternativa conserva referencia a alimento o preparación y, cuando existe cantidad, cantidad, unidad y Estado de preparación.

Esta modalidad es la base del MVP conforme a `DEC-046`; B-07 no fija qué alimentos, preparaciones, cantidades ni combinaciones debe prescribir el profesional.

##### 10.17.2.2. Modalidad B — porciones de intercambio

**`REG-06-120` — Grupo de intercambio declarado y versionado.**

Una prescripción por intercambio conserva:

- Grupo de intercambio identificable;
- cantidad de porciones prescriptas;
- Nutriente crítico declarado por el grupo;
- aporte de referencia versionado;
- relación declarada y versionada entre alimento y Grupo de intercambio;
- desvío real entre el alimento elegido y la referencia del grupo, cuando exista elección registrada.

La pertenencia de un alimento a un Grupo de intercambio **no es un atributo intrínseco** del alimento. La estructura queda modelada en v0.1.1; su implementación operativa puede diferirse hasta disponer del catálogo de grupos cargado. El desvío no se oculta.

##### 10.17.2.3. Modalidad C — registro descriptivo libre

**`REG-06-121` — Ingesta descriptiva preservada y estructuración profesional posterior trazable.**

La Ingesta registrada puede consistir en texto del asesorado que describe qué comió y en qué porciones. Este registro:

- no se clasifica como fallback de segunda categoría;
- conserva el texto original;
- puede ser estructurado posteriormente por un profesional asignando alimentos y cantidades estimadas;
- cuando se estructura posteriormente, instancia `Corrección trazable` de B-06 sin modificar el original;
- deja constancia de que la cuantificación resultante es **estimación profesional sobre descripción, no medición**.

No se crea una máquina de corrección propia de Nutrición.

#### 10.17.3. Estado de preparación

**`REG-06-122` — Estado de preparación obligatorio cuando existe cantidad.**

Todo Ítem prescripto con cantidad conserva, además de cantidad y unidad, Estado de preparación entre las condiciones contempladas por `DEC-046`: crudo, cocido o tal como se adquiere.

Los factores de conversión entre estados pertenecen a la tabla de composición del Catálogo; no se incorporan al Plan y B-07 no fija sus valores ni fórmulas.

---

### 10.18. Revisión aditiva DEC-046 — objetivo, catálogo y contraste

#### 10.18.1. Objetivo nutricional estructurado

**`REG-06-123` — Objetivo nutricional como decisión profesional versionada.**

La especialización nutricional de `REG-06-98` permite estructurar la Versión de Objetivo con:

- requerimiento energético estimado;
- distribución de macronutrientes;
- distribución por Comida, opcional;
- fundamento de la decisión profesional;
- autoría, procedencia y Versionado B-06.

BE **no calcula el requerimiento mediante fórmula propia**. Los valores concretos y el método profesional utilizado no se canonizan en B-07.

#### 10.18.2. Atributos nutricionales extendidos

**`REG-06-124` — Atributos nutricionales extendidos opcionales con procedencia y versión.**

El Catálogo puede conservar Atributos nutricionales extendidos opcionales con procedencia y versión, incluido el índice glucémico del alimento.

El cálculo de carga glucémica por Comida queda **diferido**. B-07 no define fórmula, algoritmo ni regla de cálculo. Si una versión futura lo incorpora, deberá presentarlo como estimación con método declarado.

#### 10.18.3. Contraste prescripto/consumido

**`REG-06-125` — Contraste nutricional descriptivo, nunca evaluativo.**

El contraste entre lo prescripto y la Ingesta registrada:

- describe diferencias observables sobre datos efectivamente registrados;
- no produce puntaje de adherencia;
- no produce calificación;
- no infiere ingesta no registrada;
- no transforma ausencia de registro en incumplimiento.

Un período sin registro es un período **sin dato**.

---

### 10.19. Instanciación de B-06 sin redefinición

Las adiciones de v0.1.1 instancian B-06 exclusivamente de estas formas:

| Adición | Instanciación B-06 | No redefinición |
|---|---|---|
| jerarquía Día tipo → Comida → Opción → Ítem | la Versión y su Instantánea preservan estructura emitida | no crea nueva noción de Versión ni snapshot |
| Grupo de intercambio / aporte de referencia / pertenencia | relaciones y referencias se versionan y preservan históricamente | no crea otro régimen de vigencia |
| registro descriptivo estructurado posteriormente | usa `Corrección trazable` preservando original y cadena | no crea máquina de corrección nutricional |
| Objetivo estructurado | usa Versiones de Objetivo ya exigidas por `REG-06-98` | no redefine Versionado |
| Atributos nutricionales extendidos | conserva procedencia y versión del dato | no reescribe snapshots históricos |

No se modifica ninguna regla de B-06 ni se incorpora persistencia física.

---

### 10.20. Invariantes aditivos v0.1.1

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-128` | La Instantánea de una Versión nutricional preserva Día tipo → Comida → Opción → Ítem y admite varios Días tipo. | se pierde un nivel, una multiplicidad u orden emitido al reconstruir. |
| `INV-06-129` | Modalidad A preserva alimento/preparación y, si hay cantidad, cantidad + unidad + Estado de preparación. | un Ítem cuantificado queda semánticamente ambiguo. |
| `INV-06-130` | Grupo de intercambio, Nutriente crítico, aporte de referencia y pertenencia son declarados/versionados; el desvío real no se oculta. | se trata pertenencia como atributo intrínseco o se sustituye el valor real por la referencia. |
| `INV-06-131` | Registro descriptivo libre conserva original; toda cuantificación posterior queda marcada como estimación profesional y usa Corrección trazable. | se sobrescribe el texto original o una estimación se presenta como medición. |
| `INV-06-132` | Todo Ítem con cantidad posee Estado de preparación. | existe cantidad/unidad sin estado aplicable. |
| `INV-06-133` | El Objetivo estructurado es decisión profesional versionada con fundamento; BE no calcula requerimiento por fórmula propia. | el sistema genera autónomamente el requerimiento o pierde fundamento/versionado. |
| `INV-06-134` | Atributos nutricionales extendidos son opcionales, con procedencia/versión; carga glucémica no se calcula en v0.1.1. | un atributo pierde origen/historia o aparece cálculo de carga glucémica actual. |
| `INV-06-135` | El contraste prescripto/consumido es descriptivo y la ausencia de registro es ausencia de dato. | se produce score/calificación o se infiere consumo/incumplimiento no registrado. |

---

### 10.21. B13-OBL-03 y cobertura acumulada

La revisión conserva la distribución canónica por Área primaria:

| Área | Unidades |
|---|---:|
| `M-00` | `7` |
| `M-01` | `7` |
| `M-02` | `14` |
| `M-03` | `17` |
| `M-04` | `10` |
| `M-05` | `16` |
| `M-06` | `31` |
| `M-07` | `18` |
| `M-08` | `14` |
| `M-09` | `25` |
| `M-10` | `12` |
| `M-11` | `16` |
| `M-12` | `22` |

**B13-OBL-03:** `209/209`; IDs de arquitectura esperados: `209/209` únicos.  
**M-07:** `18/18`.  
**Cobertura acumulada tras Entrega C:** `134/209`.  
**La matriz de cobertura no se modifica en v0.1.1.**

---

### 10.22. Autoverificación falsable de v0.1.1

#### 10.22.1. Controles

| # | Control falsable | Condición de fallo |
|---:|---|---|
| 1 | `baseline_REG_97_110_presentes_una_vez` | falta o se duplica cualquier `REG-06-97…110` |
| 2 | `baseline_INV_106_117_presentes_una_vez` | falta o se duplica cualquier `INV-06-106…117` |
| 3 | `altas_T_47_56_presentes` | falta cualquiera de las diez altas terminológicas |
| 4 | `jerarquia_nutricional_completa` | falta Día tipo, Comida, Opción 1..N o Ítem prescripto |
| 5 | `modalidades_A_B_C_presentes` | falta alguna modalidad o su naturaleza ordenada por DEC-046 |
| 6 | `estado_preparacion_obligatorio` | el modelo permite Ítem con cantidad sin Estado de preparación |
| 7 | `objetivo_profesional_sin_formula_propia` | falta requerimiento/macros/fundamento o BE se atribuye cálculo propio |
| 8 | `indice_glucemico_admitido_carga_diferida` | falta atributo opcional/procedencia/versión o se calcula carga actual |
| 9 | `contraste_descriptivo_no_evaluativo` | aparece score/calificación/inferencia de no registrado |
| 10 | `B06_instanciado_no_redefinido` | aparece máquina/versionado/corrección paralelos |
| 11 | `cobertura_M07_18_18` | cambia la lista o el total de 18 unidades |
| 12 | `B13_OBL_03_209` | la suma de áreas deja de ser 209 |
| 13 | `git_none` | el documento declara autorización u operación Git |

#### 10.22.2. Historial real de ejecución

```text
EJECUCIÓN 1 — archivo v0.1.1 final
CONTROLES: 13
FALLOS REALES: 0
RESULTADO: OK
DETECTORES RELAJADOS PARA HACER PASAR EL ARTEFACTO: 0
```

Si una contrarrevisión externa obtiene un fallo, el hallazgo debe publicarse y corregirse sin relajar el control.

---

### 10.23. Estado de salida

```text
B-07 / M-07
VERSIÓN: v0.1.1
NATURALEZA: REVISIÓN ADITIVA Y ACOTADA — ACTA-DIR-014 §5
COBERTURA: 18/18 — SIN ALTERACIÓN
COBERTURA ACUMULADA: 134/209 — SIN ALTERACIÓN

PATRÓN ESPEJO COMÚN APROBADO:
REG-06-97…108 — INTACTO

ESPECIALIZACIÓN NUTRICIONAL APROBADA:
REG-06-109…110 — INTACTA

ADICIONES DEC-046:
REG-06-118…125
INV-06-128…135
T-06-47…56

MÁQUINAS NUEVAS:
0

B-06:
INSTANCIADO SIN REDEFINIR

04 / 05:
SIN CAMBIO NORMATIVO

GIT:
SIN OPERACIONES
```

---
### 10.24. Captura visual y recursos didácticos — adición v0.1.2

#### 10.24.1. Evidencia visual opcional de la ingesta

**`REG-06-133` — Evidencia visual adjunta sin promoción a medición.**

Una Ingesta registrada puede asociar **Evidencia visual de ingesta opcional**. Cuando existe, conserva como mínimo conceptual:

- referencia a la Ingesta registrada a la que acompaña;
- autoría;
- momento de la evidencia;
- procedencia.

La evidencia puede acompañar cualquiera de las modalidades compatibles de registro y resulta especialmente utilizable con la descripción libre. Su existencia **no convierte una estimación en medición**, no autoriza inferencia automática de cantidades y no modifica `REG-06-122`: toda estructuración profesional posterior sobre una descripción conserva el texto original, usa Corrección trazable y mantiene explícito su carácter de estimación profesional.

#### 10.24.2. Recurso didáctico de catálogo

**`REG-06-134` — Recurso didáctico opcional, versionado y con licencia obligatoria.**

Los elementos de catálogo de ambas verticales pueden asociar cero o más versiones históricas de un **Recurso didáctico de catálogo**. Cada versión declarada conserva:

- procedencia;
- autoría;
- licencia **obligatoria**;
- referencia al elemento de catálogo y a la versión a la que resulta aplicable.

El recurso puede representar material visual o explicación técnica. B-07 no fija su contenido profesional, formato, resolución ni mecanismo de transporte. B-08 **instancia esta misma regla por referencia** para el catálogo de ejercicios en lugar de crear una definición paralela.

---

### 10.25. Política de ámbito de recursos visuales

**`REG-06-135` — Ámbito y acumulación de recursos visuales.**

La pertenencia conceptual se separa de este modo:

1. **Catálogo global de BE:** cada elemento admite **a lo sumo un recurso visual curado vigente**; las versiones históricas se conservan conforme a B-06.
2. **Preparaciones propias del profesional:** pueden asociar recursos visuales propios únicamente dentro del ámbito de ese profesional; esta facultad no convierte el catálogo global en un repositorio libre.
3. **Atlas de referencia de porciones:** pertenece al catálogo global como conjunto curado y acotado de referencias visuales de tamaño.

La regla de máximo uno aplica al **recurso visual curado vigente por elemento global**, no a la historia versionada ni a explicaciones técnicas no visuales.

**`REG-06-136` — Frontera técnica y de gobierno de recursos.**

B-07 modela únicamente relación, ámbito, procedencia, autoría, licencia y versionado conceptual. Quedan fuera:

- límites de almacenamiento, cuotas, retención y políticas de acceso → Documento 08;
- formato, resolución y tratamiento técnico → Documentos 07/09;
- representación y composición visual → Documento 10.

B-07 no presume tecnología de almacenamiento ni proveedor.

---

### 10.26. Instanciación de B-06 y frontera con B-11

Las adiciones v0.1.2 instancian B-06 sin redefinirlo:

| Adición | Instanciación | Guarda |
|---|---|---|
| Evidencia visual de ingesta | conserva autoría, procedencia, doble temporalidad e historia | el adjunto no reescribe la Ingesta registrada ni una Corrección trazable |
| Recurso didáctico | relación y contenido referenciado son versionables | una versión nueva no reescribe la utilizada por una versión histórica |
| Política de ámbito | distingue pertenencia global/profesional | no define retención, acceso o almacenamiento |

`ACTA-DIR-015 §5` fija para `B-11` el contraste prescripto/consumido como proyección posterior. B-07 **solo garantiza captura suficiente** mediante prescripción e Ingesta registrada; no calcula, agrega, puntúa ni representa esa proyección en v0.1.2.

---

### 10.27. Invariantes aditivos v0.1.2

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-144` | Evidencia visual de ingesta es opcional y, si existe, conserva autoría, momento y procedencia. | un adjunto queda sin alguno de esos datos o se vuelve obligatorio para registrar ingesta. |
| `INV-06-145` | Evidencia visual no convierte estimación en medición ni habilita inferencia de cantidad no registrada. | una cuantificación derivada de imagen se presenta como medida observada o se inventa cantidad. |
| `INV-06-146` | Todo Recurso didáctico declarado conserva procedencia, autoría, versión y licencia; la licencia es obligatoria. | se incorpora un recurso sin licencia o se pierde su origen/historia. |
| `INV-06-147` | El ámbito visual respeta: máximo un recurso visual curado vigente por elemento global; recursos propios solo en preparaciones del profesional; atlas global curado y acotado. | se habilita acumulación global libre, se mezclan ámbitos o el atlas se vuelve repositorio irrestricto. |

---

### 10.28. B13-OBL-03 y cobertura — control v0.1.2

La revisión **no agrega ni reasigna unidades primarias**. Se conserva:

```text
M-07: 18/18
M-08: 14/14
COBERTURA ACUMULADA: 134/209
B13-OBL-03: 209/209
```

La suma de áreas sigue siendo `7+7+14+17+10+16+31+18+14+25+12+16+22 = 209`.

---

### 10.29. Autoverificación falsable de v0.1.2

| # | Control falsable | Condición de fallo |
|---:|---|---|
| 1 | `baseline_v011_hash` | la fuente de partida no coincide con `a39ae285...f7790b` |
| 2 | `reglas_aprobadas_97_125_intactas` | falta, se duplica o cambia texto sustantivo de cualquier `REG-06-97…125` |
| 3 | `altas_T64_66` | falta cualquiera de `T-06-64…66` o aparece alta fuera de apertura |
| 4 | `evidencia_visual_opcional_trazable` | el adjunto es obligatorio o carece de autoría/momento/procedencia |
| 5 | `estimacion_no_medicion` | la evidencia visual convierte o presenta estimación como medición |
| 6 | `recurso_licencia_obligatoria` | se admite Recurso didáctico sin licencia declarada |
| 7 | `ambitos_recursos` | el global admite más de un visual curado vigente por elemento o los recursos profesionales salen de su ámbito |
| 8 | `sin_M11` | B-07 calcula/modela una proyección de ACTA-DIR-015 §5 |
| 9 | `fronteras_08_07_09_10` | B-07 fija cuota, retención, almacenamiento, formato, resolución o representación visual |
| 10 | `B06_instanciado` | aparece versionado/corrección/historia paralelos |
| 11 | `cobertura_M07_18_18` | cambia cobertura primaria de M-07 |
| 12 | `B13_OBL_03_209` | la suma de áreas deja de ser 209 |
| 13 | `git_none` | se declara o ejecuta operación Git |

#### 10.29.1. Historial real de ejecución

```text
EJECUCIÓN 1 — v0.1.2
CONTROLES: 13
FALLOS REALES: 0
RESULTADO: OK
DETECTORES RELAJADOS PARA HACER PASAR EL ARTEFACTO: 0
```

---

### 10.30. Estado de salida v0.1.2

```text
B-07 / M-07
VERSIÓN: v0.1.2
BASELINE APROBADA: v0.1.1 — a39ae285f706568f5dee542ca629cb3065ae6e6d4a739a395d7de33844f7790b
NATURALEZA: ADITIVA Y MÍNIMA — ACTA-DIR-015 §6
COBERTURA: 18/18 — SIN ALTERACIÓN
COBERTURA ACUMULADA: 134/209 — SIN ALTERACIÓN

REGLAS APROBADAS PREVIAS:
REG-06-97…125 — INTACTAS

ADICIONES DEC-047:
T-06-64…66
REG-06-133…136
INV-06-144…147

PROYECCIONES B-11:
NO MODELADAS

B-00…B-06:
SIN REAPERTURA

GIT:
SIN OPERACIONES
```


---


## 11. B-08 — Circuito de entrenamiento

*Fuente ensamblada: `BE_LEG_06_B08_v0_1_2_CIRCUITO_ENTRENAMIENTO.md` · SHA-256 `dfe2257cec4bdc97264f12266f41dfaed8ef0067af73fcce48fa880ad02e2dbb`.*


### 11.1. Objeto

B-08 define `M-08 — Circuito de entrenamiento` como **instancia del patrón estructural definido una sola vez en B-07 §§4–10**.

No repite las definiciones comunes. Las adopta sin renombrarlas:

- Evaluación → `REG-06-97`;
- Objetivo versionado → `REG-06-98`;
- Catálogo/importación → `REG-06-99…101`;
- Plan/versiones → `REG-06-102/103`;
- máquina `BORRADOR/ACTIVADA` → B-07 §7;
- Activación/snapshot/capacidad/Proceso → `REG-06-104/105`;
- ejecución vinculada a lo planificado → `REG-06-106/107`;
- continuidad posterior a revisión → `REG-06-108`.

B-08 desarrolla únicamente diferencias legítimas de Entrenamiento:

1. bloques, sesiones planificadas y prescripciones;
2. separación explícita Prescripción ↔ Ejecución real;
3. borrador propio del registro de ejecución;
4. Corrección trazable mediante UC-I12/B-06;
5. Progresión de entrenamiento mapeada a `AJUSTAR`/`SUSTITUIR`.

No fija ejercicios, series, repeticiones, cargas, tiempos ni fórmulas de progresión.

**Alcance de v0.1.1.** Por `ACTA-DIR-014 §5`, esta revisión es exclusivamente aditiva: conserva las reglas aprobadas `REG-06-111…117`, mantiene la reutilización de `REG-06-97…108`, incorpora solo las estructuras de entrenamiento ordenadas por `DEC-046`, no reabre `B-00…B-06`, no altera 04/05 y no modifica la matriz de cobertura.

**Alcance de v0.1.2.** Por `ACTA-DIR-015 §6`, esta revisión es **aditiva y mínima**: conserva `REG-06-97…132`, incorpora únicamente Catálogo de Zonas musculares, relación ejercicio–zona, campos estructurados de Serie ejecutada y recursos didácticos licenciados; no reabre `B-00…B-06`, no modela proyecciones/cálculos de `B-11`, no fija contenido concreto de catálogo ni define formatos, resoluciones, cuotas o almacenamiento.

### 11.2. Gobierno y fuentes

| Fuente | SHA-256 | Uso |
|---|---|---|
| `ACTA_DIR_014_APROBACION_ENTREGA_C_DEC046_Y_REVISION_ACOTADA.md` | `FUENTE ADJUNTA DE ESTA RONDA` | aprobación de v0.1 y alcance vinculante de v0.1.1 |
| `BE_LEG_06_B08_v0_1_CIRCUITO_ENTRENAMIENTO.md` | `46bea0a62752d53e6c5b761fea00065f18587901094b3ac908f86afcd40cbaa5` | baseline aprobada que no se rediseña |
| `BE_LEG_06_B07_v0_1_CIRCUITO_NUTRICIONAL.md` | `16184a3ea1c080f90de79495d8f1f1fd91977b04d84a13c2461f66f52aa66ccf` | patrón espejo común aprobado |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | REG-06-07, T-06-26…32, T-06-46 y mecanismo de alta terminológica |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | Versiones, snapshot, Corrección trazable |
| `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` | `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5` | Proceso y continuidad |
| `BE_LEG_06_B05_v0_1_CAPACIDAD_Y_HABILITACION_CONFIGURADA.md` | `40951084cf874adad23b4fb7dec994e521cecaeeea35e1a815e33981d4003ebe` | capacidad |
| `04_Requerimientos_RF_RNF_v0.4.1_APROBADO.md` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | RF-036…046 y RF-064; sin modificación |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-P14…P18, UC-E02, UC-I12; sin modificación |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | 14 unidades primarias M-08 |
| `BE_PROCESO_PROFESIONAL_VERTICAL_ENTRENAMIENTO.md` | `80df4d2a4df2ce3ba0273d2d4ed753598ff172fedeefb45a61dd5bb4db80da46` | fundamento de dominio no normativo citado por DEC-046 |

**Fuentes adicionales de v0.1.2:** `ACTA-DIR-015` (SHA-256 `53e6243476fb8c2720bb7ca6e3abad5aa0b262c05cd9427aab1d0fcd4a8d74b5`) y `DEC-047` (SHA-256 `42e1932312970d3410257ad7cf11f4a21b4848fd4ea9a24d42077fe90ad0d01a`).

### 11.3. Apertura

#### 11.3.1. Deuda primaria M-08

| Unidad | Deuda | Coordinación | Observación |
|---|---|---|---|
| `7.9-01` | campos conceptuales definitivos de evaluación de entrenamiento | `M-06` | — |
| `7.9-02` | estructura y vigencia técnica del objetivo de entrenamiento | `M-04 / M-06` | — |
| `7.9-03` | estructura del catálogo propio de ejercicios | `M-06` | — |
| `7.9-04` | estructura del plan de entrenamiento | `M-06` | — |
| `7.9-05` | estructura de bloque de entrenamiento, sesión planificada, prescripción, ejercicio planificado y parámetros/unidades necesarios | `M-00` | — |
| `7.9-06` | relaciones plan ↔ bloque ↔ sesión ↔ prescripción | `M-04` | — |
| `7.9-07` | versionado de la planificación | `M-06` | — |
| `7.9-08` | estados y transiciones de plan | `M-00 / M-04` | — |
| `7.9-11` | estructura de progresión | `M-10` | — |
| `7.10-01` | estructura de ejecución real separada de la prescripción | `M-00` | — |
| `7.10-02` | campos conceptuales/técnicos de ejecución | `M-06` | — |
| `7.10-03` | relación ejecución ↔ versión activada ↔ sesión | `M-06` | — |
| `7.10-04` | política estructural de borrador de registro, compartida con 10 | `10` | — |
| `7.10-05` | unicidad/identificación del registro ejecutado | `M-00` | — |

**Cobertura objetivo:** `14/14`. **v0.1.1 no agrega, elimina ni reasigna unidades.**

#### 11.3.2. Términos ejecutados

B-08 instancia `T-06-26…31` y especializa:

- `T-06-32 — Bloque de entrenamiento · Prescripción de entrenamiento · Ejecución real`.
- `T-06-46 — Progresión de entrenamiento`.

#### 11.3.3. Altas terminológicas de v0.1.1

Por orden expresa de `ACTA-DIR-014 §5.1`, y mediante el mecanismo de alta referido allí como `B-00 §10.1`, se registran en la apertura del bloque **sin reabrir B-00**:

| ID | Término | Propiedad / uso en esta revisión |
|---|---|---|
| `T-06-57` | Microciclo | `M-08`; nivel opcional entre Bloque y Sesión |
| `T-06-58` | Propósito de bloque o microciclo | `M-08`; texto libre declarado por el profesional |
| `T-06-59` | Criterio de intensidad | `M-08`; discriminador de prescripción con exactamente dos valores |
| `T-06-60` | Sustitución de ejercicio | `M-08`; hecho de ejecución que conserva prescripto y realizado |
| `T-06-61` | Condición de sesión | `M-08`; clasificación explícita de la sesión registrada |
| `T-06-62` | Granularidad de registro de entrenamiento | `M-08`; nivel utilizado al registrar ejecución |
| `T-06-63` | Esfuerzo percibido | `M-08`; dato opcional de ejecución, nunca criterio de prescripción |

Estas altas no crean taxonomía de periodización ni fijan metodología profesional.


#### 11.3.4. Altas terminológicas de v0.1.2

Por `ACTA-DIR-015 §6` y el mecanismo de `B-00 §10.1`, continuando desde `T-06-64`, B-08 **reutiliza `T-06-64 — Recurso didáctico de catálogo` definido en B-07 v0.1.2** y da de alta, sin reabrir B-00:

| ID | Término | Propiedad / uso |
|---|---|---|
| `T-06-67` | Zona muscular | `M-08`; entidad de dominio del catálogo versionado con identificador estable, independiente de assets y del sexo de la figura. |
| `T-06-68` | Vista anatómica de Zona | `M-08`; declaración de representabilidad anterior, posterior o ambas. |
| `T-06-69` | Relación Ejercicio–Zona muscular | `M-08`; asociación versionada entre elemento del catálogo de ejercicios y Zona muscular. |
| `T-06-70` | Rol de implicación muscular | `M-08`; rol declarado `PRINCIPAL` o `SECUNDARIO` dentro de una relación Ejercicio–Zona. |
| `T-06-71` | Serie ejecutada estructurada | `M-08`; granularidad de ejecución por serie con carga/unidad, repeticiones y dato opcional de esfuerzo percibido o RIR. |

No se da de alta ninguna proyección de volumen, marca personal, mapa de intensidad, umbral de efectividad, archivo gráfico ni variante de Zona por sexo.

---

### 11.4. Mapeo exacto al patrón B-07

| Estructura Entrenamiento | Regla común reutilizada | Diferencia |
|---|---|---|
| Evaluación de entrenamiento | `REG-06-97` | contenido de dominio distinto; no se fija |
| Objetivo de entrenamiento | `REG-06-98` | RF-064; contenido profesional distinto |
| Catálogo de ejercicios | `REG-06-99…101` | proveedor wger en importación |
| Plan de entrenamiento | `REG-06-102/103` | contiene bloques/sesiones/prescripciones y, desde v0.1.1, Microciclo opcional |
| Versión de plan | máquina B-07 §7 | mismos estados y transiciones |
| Activación | `REG-06-104/105` | snapshot de planificación de entrenamiento |
| Ejecución | `REG-06-106/107` | ejecución real tiene borrador y corrección |
| Continuidad | `REG-06-108` | progresión especializa AJUSTAR/SUSTITUIR |

B-08 no crea sinónimos ni estados paralelos. Las adiciones v0.1.1 especializan la estructura interna de Entrenamiento sin duplicar reglas comunes.

---

### 11.5. Evaluación, objetivo y catálogo

#### 11.5.1. Evaluación

La Evaluación de entrenamiento instancia `REG-06-97`.

Conserva asesorado, profesional, Alcance, período/contexto, fuentes, autoría, doble temporalidad, procedencia y datos profesionales pertinentes.

No se confunde con Ejecución real.

#### 11.5.2. Objetivo

El Objetivo de entrenamiento instancia `REG-06-98` y RF-064.

Los cambios emiten nueva Versión y la relación efectiva es explícita. B-08 no fija contenido del objetivo.

#### 11.5.3. Catálogo e importación desde wger

El Catálogo propio de ejercicios instancia `REG-06-99…101`.

wger es una fuente externa posible:

- los datos se validan antes de incorporar;
- se conserva proveedor/procedencia;
- fallback = Catálogo BE/carga manual;
- caída externa no se declara éxito;
- cambios de catálogo no alteran snapshots activados.

Contratos/transporte → 07/09. `Q-008` permanece en 07.

---

### 11.6. Estructura de planificación de entrenamiento — baseline aprobada

**`REG-06-111` — Jerarquía estructural de planificación.**

Una Versión de Plan de entrenamiento puede organizar, en orden identificable:

```text
Plan
→ Bloques
→ Sesiones planificadas
→ Prescripciones
```

Una Prescripción:

- referencia un elemento del Catálogo propio;
- pertenece a una Sesión planificada;
- conserva los parámetros/unidades profesionales necesarios para interpretar lo indicado;
- no define en 06 qué parámetros concretos deben utilizarse.

Si un parámetro es cuantitativo, su unidad y significado deben ser identificables conforme a B-00.

#### 11.6.1. Relaciones

**`REG-06-112` — Relaciones internas preservadas por Versión.**

La Versión activada/snapshot reconstruye el orden y las relaciones Plan ↔ Bloque ↔ Sesión ↔ Prescripción exactamente como fueron emitidas.

Cambios posteriores del borrador o catálogo no alteran esa estructura histórica.

La incorporación opcional de Microciclo en v0.1.1 es una **extensión compatible** de esta jerarquía; no sustituye ni invalida las relaciones aprobadas.

---

### 11.7. Máquina de Versión de Plan — instanciación sin redefinición

B-08 instancia exactamente la máquina de B-07 §7:

```text
BORRADOR
ACTIVADA
```

Transiciones exactas:

```text
CrearBorrador
GuardarBorrador
ActivarVersion
```

No se agregan estados de Entrenamiento.

`ActivarVersion` reutiliza B-07 `REG-06-104/105`, B-05 y B-04.

---

### 11.8. Prescripción y Ejecución real — baseline aprobada

**`REG-06-113` — Prescripción y Ejecución real son estructuras distintas.**

La Prescripción representa lo planificado dentro de la Versión activada.

La Ejecución real representa lo efectivamente registrado por el asesorado respecto de esa planificación.

Registrar Ejecución real:

- no modifica Prescripción;
- no modifica snapshot;
- puede diferir de lo planificado sin reescribirlo.

#### 11.8.1. Estructura de Ejecución real

**`REG-06-114` — Ejecución real referenciada.**

Una ejecución conserva:

- asesorado;
- Versión activada;
- Sesión planificada/ocurrencia de referencia;
- momento real de ocurrencia;
- momento de registro;
- autor;
- contexto;
- valores efectivamente registrados con significado/unidad identificables cuando corresponda;
- procedencia.

B-08 no fija qué valores concretos se capturan.

---

### 11.9. Máquina del registro de Ejecución real — baseline aprobada

La arquitectura exige una política estructural de borrador compartida con 10.

#### 11.9.1. Estados cerrados

```text
BORRADOR
REGISTRADA
```

#### 11.9.2. Lista blanca

| Transición | Origen → destino | Condiciones | Efectos |
|---|---|---|---|
| `CrearBorradorEjecucion` | inicio → `BORRADOR` | sesión/versión identificables | permite captura incompleta sin convertirla en evidencia confirmada |
| `GuardarBorradorEjecucion` | `BORRADOR → BORRADOR` | registro todavía editable | no aparece como Ejecución real confirmada |
| `ConfirmarEjecucion` | `BORRADOR → REGISTRADA` | referencia y contenido mínimo coherentes | vuelve inmutable el original y lo hace elegible como evidencia |

No existe transición de `REGISTRADA` a `BORRADOR`.

#### 11.9.3. Unicidad

**`REG-06-115` — Una ejecución registrada por ocurrencia planificada.**

Existe como máximo una Ejecución real `REGISTRADA` para:

- asesorado;
- Versión activada;
- Sesión planificada/ocurrencia identificable.

Un reintento no duplica la sesión.

Un nuevo intento deliberadamente distinto requiere una ocurrencia identificable distinta; B-08 no la inventa por timestamp.

---

### 11.10. Corrección trazable de Ejecución real — baseline aprobada

**`REG-06-116` — Corrección mediante B-06/UC-I12.**

Una Ejecución `REGISTRADA` no se edita.

Toda rectificación:

- instancia `Corrección trazable` de B-06;
- referencia el registro original;
- conserva actor;
- motivo;
- momentos aplicables;
- relación con corrección previa si existe;
- permite obtener el valor efectivo sin borrar el original.

La política de quién puede corregir pertenece a 08.

M-10 puede considerar original y corrección autorizada al revisar.

B-08 no crea una máquina paralela de correcciones.

---

### 11.11. Progresión de entrenamiento — baseline aprobada

**`REG-06-117` — Progresión no es séptimo resultado.**

`Progresión de entrenamiento` solo especializa la Próxima acción de M-10:

- progresar conservando la estructura profesional → `AJUSTAR`;
- requerir planificación sucesora/reemplazo → `SUSTITUIR`;
- iniciar un nuevo bloque → `AJUSTAR` o `SUSTITUIR` según efecto sobre la planificación/versionado.

No se introduce token `PROGRESAR`.

#### 11.11.1. Efecto sobre versiones

Cualquier cambio que deba modificar lo emitido:

1. no edita la Versión activada;
2. produce/actualiza Borrador;
3. valida;
4. activa una nueva Versión si debe llegar al asesorado;
5. conserva continuidad con la revisión y `ContinuidadOCierreAplicado`.

`MANTENER`, `REPROGRAMAR_REVISION`, `CAMBIAR_OBJETIVO` y `FINALIZAR` conservan la semántica común de `REG-06-108`.

---

### 11.12. Diferencias legítimas respecto de Nutrición

| Materia | B-07 Nutrición | B-08 Entrenamiento |
|---|---|---|
| patrón evaluación/objetivo/plan/activación | común | reutilizado |
| Catálogo/importación | Open Food Facts | wger |
| estructura interna del plan | Día tipo → Comida → Opción → Ítem en v0.1.1 | Bloque → Microciclo opcional → Sesión → Prescripción en v0.1.1 |
| registro de ejecución | Ingesta/ejecución nutricional; registro descriptivo permitido | Ejecución real con borrador |
| corrección trazable | estructuración posterior de descripción mediante B-06 cuando aplica | exigida por RF-044; B-06/UC-I12 |
| progresión | continuidad común | especialización AJUSTAR/SUSTITUIR |

Estas diferencias no crean otra semántica para Versión, snapshot, Plan, Activación o Revisión.

---

### 11.13. Invariantes locales — baseline aprobada

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-118` | B-08 reutiliza el patrón de B-07 sin taxonomía paralela. | crea otros estados/nombres para la misma semántica común. |
| `INV-06-119` | Plan, Bloque, Sesión y Prescripción conservan relaciones de la Versión. | una activación pierde orden o referencia estructural. |
| `INV-06-120` | Prescripción ≠ Ejecución real. | registrar ejecución modifica lo planificado. |
| `INV-06-121` | Ejecución real referencia Versión activada y Sesión planificada. | queda huérfana o ligada a borrador. |
| `INV-06-122` | Borrador de ejecución no es evidencia confirmada. | M-10 analiza o muestra como ejecutado un borrador. |
| `INV-06-123` | Máximo una Ejecución registrada por ocurrencia planificada. | un reintento duplica sesión. |
| `INV-06-124` | Ejecución registrada original es inmutable. | se modifica directamente tras confirmar. |
| `INV-06-125` | Corrección preserva original y cadena. | se sobrescribe o pierde motivo/actor. |
| `INV-06-126` | Progresión no crea un séptimo resultado semántico. | aparece token paralelo a DEC-043. |
| `INV-06-127` | Cambiar planificación emitida exige nueva continuidad/versionado. | se altera snapshot o Versión activada. |

---

### 11.14. Cobertura M-08 — sin alteración

| Unidad | Resolución | Estado |
|---|---|---|
| `7.9-01` | §5.1 + REG-06-97 | `RESUELTA POR PATRÓN REUTILIZADO` |
| `7.9-02` | §5.2 + REG-06-98 | `RESUELTA POR PATRÓN REUTILIZADO` |
| `7.9-03` | §5.3 + REG-06-99…101 | `RESUELTA POR PATRÓN REUTILIZADO` |
| `7.9-04` | §§4, 6–7 + REG-06-102…105 | `RESUELTA POR PATRÓN + ESPECIALIZACIÓN` |
| `7.9-05` | REG-06-111 | `RESUELTA` |
| `7.9-06` | REG-06-112 | `RESUELTA` |
| `7.9-07` | §7 + B-06 | `RESUELTA POR PATRÓN REUTILIZADO` |
| `7.9-08` | §7 | `RESUELTA POR MISMA MÁQUINA` |
| `7.9-11` | §11 + REG-06-117 | `RESUELTA` |
| `7.10-01` | §8 + REG-06-113 | `RESUELTA` |
| `7.10-02` | REG-06-114 | `RESUELTA` |
| `7.10-03` | REG-06-114 | `RESUELTA` |
| `7.10-04` | §9 | `RESUELTA` |
| `7.10-05` | REG-06-115 | `RESUELTA` |

**Resultado:** `14/14`.

---

### 11.15. Fronteras

- patrón común vertical → B-07.
- B-06 → Versiones, snapshot, Corrección trazable.
- B-04 → Proceso y continuidad/cierre.
- B-05 → capacidad.
- M-10 → Revisión/Resultado/Próxima acción.
- 07/09 → wger, contratos/transporte.
- 08 → acceso, permisos de corrección, retención/auditoría.
- 10 → captura y borradores de UI.
- 11A → instrumentos de medición/pruebas.
- contenido profesional, fórmulas de repetición máxima y modelos/fórmulas de periodización/progresión → fuera del modelo.
- `Q-008` → 07.

---

### 11.16. Estado de baseline preservada

La baseline `v0.1` permanece aprobada con:

```text
COBERTURA: 14/14
PATRÓN COMÚN B-07: REG-06-97…108 — REUTILIZADO
REGLAS ESPECÍFICAS B-08: REG-06-111…117
INV APROBADAS: INV-06-118…127
MÁQUINA DE PLAN: MISMA B-07 — BORRADOR/ACTIVADA
MÁQUINA DE EJECUCIÓN: BORRADOR/REGISTRADA
```

Ninguno de esos identificadores se renumera, sustituye o elimina en `v0.1.1`.

---

### 11.17. Revisión aditiva DEC-046 — Microciclo y propósito

#### 11.17.1. Jerarquía extendida

**`REG-06-126` — Microciclo opcional como extensión de la jerarquía aprobada.**

La estructura de `REG-06-111` se extiende compatiblemente a:

```text
Versión de plan
→ Bloque
→ Microciclo [0..N]
→ Sesión
→ Prescripción de ejercicio
```

Cuando un Plan simple omite Microciclo, la relación Bloque → Sesión aprobada en v0.1 permanece válida. Cuando existe, la Instantánea reproducible conserva la relación Bloque → Microciclo → Sesión → Prescripción exactamente como fue emitida.

El Microciclo representa la unidad de repetición semanal indicada por `DEC-046`; B-08 no fija contenido ni duración concreta.

#### 11.17.2. Propósito declarado

**`REG-06-127` — Propósito de Bloque/Microciclo como texto libre profesional.**

Bloque y Microciclo pueden conservar un propósito declarado por el profesional en texto libre. B-08 **no define taxonomía de propósitos**.

Una descarga es un Microciclo con propósito declarado, no una pausa del Proceso. Por ese hecho el Proceso permanece `ABIERTO` y ocupa capacidad con normalidad según B-04/B-05.

---

### 11.18. Revisión aditiva DEC-046 — criterio de intensidad

#### 11.18.1. Criterio cerrado de prescripción

**`REG-06-128` — Criterio de intensidad con exactamente dos valores.**

Cada Prescripción de ejercicio que declare criterio de intensidad identifica **exactamente uno** de estos valores:

```text
PORCENTAJE_RM
RIR
```

El profesional elige el criterio por Prescripción. B-08 no agrega un tercer valor ni fija el valor cuantitativo concreto prescripto.

#### 11.18.2. Esfuerzo percibido y carga absoluta

**`REG-06-129` — Esfuerzo percibido y carga absoluta no crean criterio adicional.**

- el Esfuerzo percibido puede registrarse únicamente como dato opcional de Ejecución real;
- nunca constituye un tercer Criterio de intensidad de Prescripción;
- la carga absoluta utilizada es dato de Ejecución real;
- puede acompañar la Prescripción como complemento informativo sin constituir Criterio de intensidad.

B-08 no fija fórmula de repetición máxima ni conversión automática entre criterios.

---

### 11.19. Revisión aditiva DEC-046 — sustitución, condición y granularidad de ejecución

#### 11.19.1. Sustitución de ejercicio

**`REG-06-130` — Sustitución conserva ejercicio prescripto y ejercicio realizado.**

La Ejecución real puede declarar que el ejercicio efectivamente realizado difiere del prescripto. Cuando existe Sustitución de ejercicio:

- se conserva la Prescripción original;
- se conserva el ejercicio efectivamente realizado;
- se mantiene la referencia entre ambos;
- el hecho no se clasifica por sí mismo como error ni modifica snapshot/Prescripción.

#### 11.19.2. Condición de sesión

**`REG-06-131` — Condición de sesión registrada.**

Una sesión registrada conserva una Condición de sesión entre exactamente:

```text
REALIZADA
REALIZADA_CON_DESVIO
NO_REALIZADA
```

Puede conservar motivo opcional. `NO_REALIZADA` con motivo es evidencia registrada distinta de **sesión sin registro**; B-08 no infiere condición cuando no existe registro.

#### 11.19.3. Granularidad

**`REG-06-132` — Granularidad de registro preservada.**

La Ejecución real admite registro:

- por serie; o
- por ejercicio/sesión.

El registro conserva cuál granularidad fue utilizada. B-08 no obliga a descomponer retrospectivamente un registro de granularidad mayor ni inventa datos ausentes.

---

### 11.20. Instanciación de B-06 sin redefinición

Las adiciones de v0.1.1 instancian B-06 exclusivamente de estas formas:

| Adición | Instanciación B-06 | No redefinición |
|---|---|---|
| Microciclo y propósito | la Versión/Instantánea preservan niveles, relaciones y texto emitidos | no crea otra noción de Versión/snapshot |
| criterio de intensidad | el criterio elegido queda contenido en la Prescripción versionada | no crea máquina de criterio ni fórmula común |
| Sustitución de ejercicio | queda como dato de Ejecución real referenciado a Prescripción | no modifica la Versión activada |
| Condición de sesión y motivo | quedan como evidencia de ejecución con historia | no redefine Proceso de B-04 |
| Granularidad de registro | queda preservada en el hecho de ejecución | no altera Corrección trazable ni historia |
| corrección posterior de ejecución | continúa utilizando `REG-06-116` + B-06/UC-I12 | no crea máquina paralela de corrección |

No se modifica ninguna regla de B-06 ni se incorpora persistencia física.

---

### 11.21. Invariantes aditivos v0.1.1

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-136` | Microciclo es opcional: un Plan simple puede conservar Bloque → Sesión; si existe Microciclo, el snapshot preserva su relación. | se vuelve obligatorio para todo Plan o se pierde al reconstruir una Versión que lo contenía. |
| `INV-06-137` | Propósito de Bloque/Microciclo es texto libre profesional; descarga no pausa/cierra el Proceso ni libera capacidad por ese hecho. | el sistema impone taxonomía de propósito o trata descarga como pausa. |
| `INV-06-138` | Criterio de intensidad admite exactamente `PORCENTAJE_RM` o `RIR`, uno elegido por Prescripción. | aparece un tercer criterio, ninguno cuando se declaró criterio, o dos simultáneos. |
| `INV-06-139` | Esfuerzo percibido es solo dato opcional de ejecución y carga absoluta no constituye criterio de intensidad. | cualquiera se usa como tercer criterio prescriptivo. |
| `INV-06-140` | Sustitución de ejercicio conserva Prescripción y ejercicio realizado sin reescritura. | sustituir borra/cambia lo prescripto o pierde lo realizado. |
| `INV-06-141` | Condición de sesión usa exactamente tres valores y `NO_REALIZADA` registrada es distinta de ausencia de registro. | se infiere condición sin registro o aparece token adicional. |
| `INV-06-142` | La Ejecución conserva la Granularidad de registro utilizada. | se pierde si fue por serie o por ejercicio/sesión, o se inventa detalle no registrado. |
| `INV-06-143` | B-08 no fija ejercicios, series, cargas, fórmulas de RM ni modelos de periodización; las nuevas estructuras admiten modelos profesionales diversos. | la estructura obliga una metodología profesional concreta. |

---

### 11.22. B13-OBL-03 y cobertura acumulada

La revisión conserva la distribución canónica por Área primaria:

| Área | Unidades |
|---|---:|
| `M-00` | `7` |
| `M-01` | `7` |
| `M-02` | `14` |
| `M-03` | `17` |
| `M-04` | `10` |
| `M-05` | `16` |
| `M-06` | `31` |
| `M-07` | `18` |
| `M-08` | `14` |
| `M-09` | `25` |
| `M-10` | `12` |
| `M-11` | `16` |
| `M-12` | `22` |

**B13-OBL-03:** `209/209`; IDs de arquitectura esperados: `209/209` únicos.  
**M-08:** `14/14`.  
**Cobertura acumulada tras Entrega C:** `134/209`.  
**La matriz de cobertura no se modifica en v0.1.1.**

---

### 11.23. Autoverificación falsable de v0.1.1

#### 11.23.1. Controles

| # | Control falsable | Condición de fallo |
|---:|---|---|
| 1 | `baseline_REG_111_117_presentes_una_vez` | falta o se duplica cualquier `REG-06-111…117` |
| 2 | `baseline_INV_118_127_presentes_una_vez` | falta o se duplica cualquier `INV-06-118…127` |
| 3 | `patron_comun_97_108_referenciado_no_duplicado` | B-08 vuelve a definir una regla común o deja de referenciarla |
| 4 | `altas_T_57_63_presentes` | falta cualquiera de las siete altas terminológicas |
| 5 | `microciclo_opcional` | Microciclo se vuelve obligatorio o falta la ruta Bloque→Microciclo→Sesión |
| 6 | `proposito_libre_descarga_abierto` | se crea taxonomía de propósito o descarga pausa/cierra Proceso |
| 7 | `intensidad_exactamente_dos` | falta `PORCENTAJE_RM`/`RIR` o aparece tercer criterio |
| 8 | `esfuerzo_percibido_solo_ejecucion` | esfuerzo percibido se convierte en criterio de prescripción |
| 9 | `sustitucion_preserva_ambos` | se pierde ejercicio prescripto o realizado |
| 10 | `condicion_sesion_exacta_y_sin_inferencia` | faltan los tres valores, aparece otro o ausencia se infiere |
| 11 | `granularidad_preservada` | no queda registrado el nivel usado |
| 12 | `B06_instanciado_no_redefinido` | aparece versión/snapshot/corrección paralelos |
| 13 | `cobertura_M08_14_14` | cambia la lista o el total de 14 unidades |
| 14 | `B13_OBL_03_209` | la suma de áreas deja de ser 209 |
| 15 | `git_none` | el documento declara autorización u operación Git |

#### 11.23.2. Historial real de ejecución

```text
EJECUCIÓN 1 — archivo v0.1.1 final
CONTROLES: 15
FALLOS REALES: 0
RESULTADO: OK
DETECTORES RELAJADOS PARA HACER PASAR EL ARTEFACTO: 0
```

Si una contrarrevisión externa obtiene un fallo, el hallazgo debe publicarse y corregirse sin relajar el control.

---

### 11.24. Estado de salida

```text
B-08 / M-08
VERSIÓN: v0.1.1
NATURALEZA: REVISIÓN ADITIVA Y ACOTADA — ACTA-DIR-014 §5
COBERTURA: 14/14 — SIN ALTERACIÓN
COBERTURA ACUMULADA: 134/209 — SIN ALTERACIÓN

PATRÓN COMÚN B-07:
REG-06-97…108 — REUTILIZADO, NO DUPLICADO

REGLAS ESPECÍFICAS APROBADAS B-08:
REG-06-111…117 — INTACTAS

ADICIONES DEC-046:
REG-06-126…132
INV-06-136…143
T-06-57…63

MÁQUINA DE PLAN:
MISMA B-07 — BORRADOR/ACTIVADA

MÁQUINA DE EJECUCIÓN:
BORRADOR/REGISTRADA — SIN ALTERACIÓN

MÁQUINAS NUEVAS:
0

B-06:
INSTANCIADO SIN REDEFINIR

04 / 05:
SIN CAMBIO NORMATIVO

GIT:
SIN OPERACIONES
```

---
### 11.25. Catálogo versionado de Zonas musculares — adición v0.1.2

#### 11.25.1. Estructura y cardinalidad inicial

**`REG-06-137` — Catálogo de Zonas musculares con identificadores estables.**

`M-08` incorpora un Catálogo versionado de Zonas musculares. Cada Zona muscular declara:

- identificador estable;
- denominación;
- una o más Vistas anatómicas de Zona en las que resulta representable: anterior, posterior o ambas;
- versión/procedencia del catálogo conforme al patrón B-06 aplicable.

El conjunto inicial posee **17 Zonas musculares únicas**. Su cobertura de vistas cumple simultáneamente:

```text
VISTA ANTERIOR: 9
VISTA POSTERIOR: 10
PRESENTES EN AMBAS: 2 — antebrazo y deltoides
ZONAS ÚNICAS: 9 + 10 - 2 = 17
```

La cifra y la pertenencia a vistas provienen de `DEC-047`; B-08 no fija en esta revisión la lista concreta de las otras quince denominaciones ni relaciones profesionales con ejercicios.

#### 11.25.2. Entidad de dominio, no asset

**`REG-06-138` — Zona muscular independiente de representación gráfica y sexo de figura.**

Una Zona muscular es **entidad de dominio, no archivo gráfico**. Máscaras, siluetas, ilustraciones y cualquier otra representación son assets del Documento 10 que referencian el identificador estable de Zona.

El conjunto femenino utiliza **las mismas 17 Zonas y los mismos identificadores**. Incorporar una silueta o máscara femenina:

- no crea una Zona nueva;
- no altera la relación Ejercicio–Zona;
- no crea un catálogo paralelo por sexo;
- no requiere migración del modelo de dominio por ese solo hecho.

---

### 11.26. Relación Ejercicio–Zona muscular con rol

**`REG-06-139` — Asociación versionada con rol declarado.**

Cada elemento del Catálogo de ejercicios admite **cero o más** Relaciones Ejercicio–Zona muscular. Cada relación conserva:

- referencia al ejercicio/catalog item y a su versión aplicable;
- referencia al identificador estable de Zona;
- Rol de implicación muscular declarado: `PRINCIPAL` o `SECUNDARIO`;
- versión/procedencia de la asignación.

La asignación concreta de Zonas a un ejercicio es contenido profesional de catálogo y **no se fija en B-08**. El modelo tampoco introduce porcentajes, ponderaciones ni reglas automáticas para convertir el rol en volumen o intensidad; esas derivaciones pertenecen a `B-11` bajo el contrato de `ACTA-DIR-015 §5`.

---

### 11.27. Serie ejecutada estructurada

**`REG-06-140` — Campos estructurados a nivel de Serie ejecutada.**

Cuando la Granularidad de registro elegida es **por serie**, cada Serie ejecutada puede conservar de forma estructurada:

- carga utilizada;
- unidad de la carga;
- repeticiones completadas;
- esfuerzo percibido o RIR como dato **opcional a nivel de serie**.

Esta regla **preserva `REG-06-129`**: Esfuerzo percibido continúa siendo dato de ejecución y nunca un tercer criterio de prescripción. También **preserva `REG-06-132`**: si la ejecución se registró por ejercicio o sesión, B-08 no fabrica series retrospectivas, no completa esfuerzo/RIR ausentes y no infiere carga o repeticiones no registradas.

La existencia de estos campos no calcula volumen, volumen efectivo, progresiones o marcas personales; únicamente habilita captura suficiente para la derivación posterior de `B-11`.

---

### 11.28. Recursos didácticos del catálogo

El Catálogo de ejercicios **instancia `REG-06-134` y `T-06-64` definidos una sola vez en B-07 v0.1.2**. Por tanto puede asociar recursos didácticos opcionales y versionados —material visual o explicación técnica— conservando procedencia, autoría y **licencia obligatoria**.

B-08 no duplica la regla común, no fija contenido didáctico concreto y no define formato, resolución, almacenamiento, cuota, retención o política de acceso.

---

### 11.29. Frontera con B-11 y Documento 10

Las capturas añadidas satisfacen las **fuentes** necesarias para las proyecciones futuras de `ACTA-DIR-015 §5`:

- Serie ejecutada estructurada → volumen/progresión/marcas;
- Serie + Relación Ejercicio–Zona → agregaciones por Zona;
- esfuerzo percibido/RIR por serie → insumo potencial de volumen efectivo;
- Catálogo de Zonas → identificación estable para una futura distribución de trabajo.

B-08 **no implementa ni define** ninguno de esos cálculos, no fija umbral de efectividad y no produce representación visual. `B-11` será propietario de la derivación y Documento 10 de las superficies/assets.

---

### 11.30. Invariantes aditivos v0.1.2

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-148` | Catálogo de Zonas mantiene identificadores estables y 17 Zonas únicas, con 9 anteriores, 10 posteriores y 2 compartidas. | una vista se modela como catálogo distinto o la cardinalidad deja de satisfacer `9+10-2=17`. |
| `INV-06-149` | Antebrazo y deltoides son las dos Zonas declaradas en ambas vistas por DEC-047. | se duplican como zonas anterior/posterior diferentes o se pierde una de sus vistas. |
| `INV-06-150` | Zona muscular es entidad de dominio independiente de asset y sexo de figura; el conjunto femenino reutiliza IDs. | una máscara crea Zona nueva, cambia ID o altera relaciones ejercicio–zona. |
| `INV-06-151` | Toda Relación Ejercicio–Zona declarada es versionada y posee rol `PRINCIPAL` o `SECUNDARIO`; la asignación concreta no se canoniza aquí. | falta rol/versión o B-08 fija musculatura concreta por ejercicio. |
| `INV-06-152` | Serie ejecutada por serie conserva carga+unidad y repeticiones; esfuerzo percibido/RIR son opcionales y no se infieren. | falta unidad para una carga registrada o se inventa detalle no capturado. |
| `INV-06-153` | Las adiciones solo capturan; no calculan proyecciones de B-11 ni convierten assets del Documento 10 en entidades del dominio. | B-08 calcula volumen/marcas/mapas o almacena semántica de Zona en un archivo gráfico. |

---

### 11.31. B13-OBL-03 y autoverificación v0.1.2

```text
M-08: 14/14
COBERTURA ACUMULADA: 134/209
B13-OBL-03: 209/209
```

| # | Control falsable | Condición de fallo |
|---:|---|---|
| 1 | `baseline_v011_hash` | la fuente no coincide con `8416d809...af6a` |
| 2 | `reglas_aprobadas_111_132_intactas` | falta, se duplica o cambia cualquier `REG-06-111…132` |
| 3 | `patron_97_108_solo_referenciado` | se duplica una regla común de B-07 |
| 4 | `altas_T67_71` | falta una alta o se crea Zona por sexo/asset |
| 5 | `zonas_17_9_10_2` | no se verifica 17 únicas / 9 anterior / 10 posterior / 2 ambas |
| 6 | `antebrazo_deltoides_ambas` | una de las dos deja de declarar ambas vistas |
| 7 | `zona_no_asset` | Zona se define por filename/máscara/silueta |
| 8 | `relacion_rol_versionada` | relación ejercicio–zona carece de rol o versión |
| 9 | `serie_estructurada` | carga registrada carece de unidad o faltan repeticiones estructuradas |
| 10 | `preserva_REG129_REG132` | esfuerzo se vuelve criterio o se infiere detalle desde granularidad mayor |
| 11 | `recurso_didactico_licenciado` | B-08 admite recurso sin licencia o duplica definición común |
| 12 | `sin_M11` | aparece cálculo de volumen, efectividad, progresión, marca o mapa |
| 13 | `sin_Doc10` | se modela asset gráfico como Zona |
| 14 | `B13_209` | suma de áreas distinta de 209 |
| 15 | `git_none` | se declara/ejecuta Git |

#### 11.31.1. Historial real

```text
EJECUCIÓN 1 — v0.1.2
CONTROLES: 15
FALLOS REALES: 0
RESULTADO: OK
DETECTORES RELAJADOS: 0
```

---

### 11.32. Estado de salida v0.1.2

```text
B-08 / M-08
VERSIÓN: v0.1.2
BASELINE APROBADA: v0.1.1 — 8416d80948fa736f1cd18329243abb383779ff9d59d046d46d63cdafcb7baf6a
NATURALEZA: ADITIVA Y MÍNIMA — ACTA-DIR-015 §6
COBERTURA: 14/14 — SIN ALTERACIÓN
COBERTURA ACUMULADA: 134/209 — SIN ALTERACIÓN

REGLAS APROBADAS PREVIAS:
REG-06-111…132 — INTACTAS
PATRÓN B-07 REG-06-97…108 — REUTILIZADO

ADICIONES DEC-047:
T-06-67…71 (+ reutiliza T-06-64)
REG-06-137…140
INV-06-148…153

ZONAS:
17 ÚNICAS · 9 ANTERIOR · 10 POSTERIOR · 2 AMBAS
SEXO DE FIGURA:
NO ALTERA ZONAS NI IDS

PROYECCIONES B-11:
NO MODELADAS

GIT:
SIN OPERACIONES
```


---


## 12. B-09 — Revisión y continuidad

*Fuente ensamblada: `BE_LEG_06_B09_v0_1_REVISION_Y_CONTINUIDAD.md` · SHA-256 `370b29932c015eb1f76f58ba7adbc5a97750a9758e8046a15514f934e86517b8`.*


### 12.1. Objeto

B-09 fija el modelo de **Revisión profesional válida, continuidad y Revisión pendiente** que la arquitectura aprobada asigna a `M-10`. No crea una tercera semántica por vertical: Nutrición y Entrenamiento reutilizan la taxonomía común de B-00/DEC-043 y aplican sus efectos mediante `UC-I05` y `UC-I06`.

B-09 no calcula TVCC-30, no define UI, no fija política de acceso/retención y no redefine estados del Proceso de B-04 ni Versionado/Corrección de B-06.

---

### 12.2. Hallazgo documental de apertura — `H-D-01`

`ACTA-DIR-015 §7` rotula literalmente `B-09 — Revisión y continuidad` como `M-09, 25` y `B-10 — Antropometría` como `M-10, 12`. La **arquitectura aprobada y B-00** establecen lo contrario en cuanto a propiedad sustantiva:

- `M-09` posee fórmulas/dependencias antropométricas y `T-06-33…36` → **25 unidades**;
- `M-10` posee Revisión profesional válida, Resultado semántico, Próxima acción y Ciclo cerrado trazable (`T-06-37…40`) → **12 unidades**;
- la propia `ACTA-DIR-015 §7.1.5` dispone que **B-09 consume M-04**, emite `REG-06-75` mediante `UC-I06` y no redefine Q-007, conducta inequívoca de Revisión.

**Tratamiento:** se preserva el nombre de bloque ordenado por el acta (`B-09 — Revisión y continuidad`) y se resuelven las **12 unidades canónicas de M-10**. No se renumera la arquitectura ni se atribuyen las 25 unidades antropométricas a Revisión. El conflicto queda publicado para rectificación de custodia antes del cierre definitivo de Entrega D.

**Estado:** `NO BLOQUEA REDACCIÓN`; `REQUIERE RATIFICACIÓN/RECTIFICACIÓN DOCUMENTAL EN EL ACTA DE APROBACIÓN DE ENTREGA D`.

---

### 12.3. Gobierno y fuentes

| Fuente | SHA-256 / estado | Uso |
|---|---|---|
| `ACTA_DIR_015_APROBACION_v011_DEC047_Y_ENTREGA_D.md` | `53e6243476fb8c2720bb7ca6e3abad5aa0b262c05cd9427aab1d0fcd4a8d74b5` | habilitación y siete condiciones de Entrega D |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | propiedad M-10 y 12 unidades primarias |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | T-06-37…41, taxonomía cerrada, REG-06-10 |
| `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md` | `206ad172ab17ca4842e12941ed09d82fef3fa1584e2eff6ed309c8e8335abfc5` | REG-06-73…76; `ContinuidadOCierreAplicado`; Q-007 resuelta |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | versiones/correcciones/historia |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-I05/UC-I06; componentes de revisión válida |
| `DEC_043_Revision_Profesional_VALIDA_APROBADA_PROVISIONALMENTE_v0.4.md` | `ea54a1e1ae98c6f6c4516fb79521e65699484067c63134ee22b6749b9f99d842` | semántica común de revisión |

---

### 12.4. Apertura B-00

#### 12.4.1. Deuda primaria canónica M-10 — 12/12

| Unidad | Deuda | Resolución en B-09 |
|---|---|---|
| `7.7-16` | representación temporal de próxima revisión | §6 |
| `7.8-01` | entidad/evento técnico de revisión profesional válida | §5.1 |
| `7.8-02` | vínculos revisión ↔ evidencia ↔ período ↔ resultado ↔ fundamento ↔ próxima acción/cierre | §5.1–5.2 |
| `7.8-03` | taxonomía técnica definitiva de seis resultados | §5.3 |
| `7.8-04` | efecto exacto de cada resultado sobre estados | §7 |
| `7.8-07` | representación temporal de `REPROGRAMAR_REVISION` | §6.2 |
| `7.8-11` | progresar/nuevo bloque no crean séptimo resultado | §5.3 y §7.3 |
| `7.9-12` | transición técnica para `AJUSTAR` y `SUSTITUIR` | §7.2 |
| `7.14-02` | reglas técnicas exactas que determinan un pendiente | §8.1 |
| `7.14-03` | relación con última revisión válida | §8.2 |
| `7.14-04` | relación con próxima acción o cierre | §8.1–8.3 |
| `7.14-05` | pendiente no se resuelve por mera visualización | §8.3 |

#### 12.4.2. Términos ejecutados y altas

B-09 ejecuta sin renombrar:

- `T-06-37 — Revisión profesional válida`;
- `T-06-38 — Resultado semántico de revisión`;
- `T-06-39 — Próxima acción`;
- `T-06-40 — Ciclo cerrado trazable`;
- `T-06-41 — Revisión pendiente`.

**Altas terminológicas nuevas: `0`.** La semántica requerida ya está dada de alta en B-00. B-09 no infla el glosario con sinónimos.

---

### 12.5. Revisión profesional válida

#### 12.5.1. Estructura

**`REG-06-141` — Revisión profesional válida como evento explícito.**

Una Revisión profesional válida existe solo como acto explícito registrado mediante `UC-I05` y conserva:

- dominio;
- Proceso/período o ciclo identificable;
- evidencia examinada y referencias reconstruibles a ella;
- interpretación profesional **no diagnóstica**;
- Resultado semántico de revisión;
- fundamento;
- Próxima acción o cierre;
- autoría;
- momento de ocurrencia y momento de registro;
- procedencia.

Abrir, visualizar, filtrar, anotar aisladamente o modificar silenciosamente un plan **no** crea una Revisión profesional válida.

**`REG-06-142` — Evidencia vinculada y reconstruible.**

La evidencia utilizada queda relacionada explícitamente con la Revisión y con el contexto/versiones efectivas que el profesional examinó. Una corrección posterior de evidencia o revisión no borra el original: B-09 instancia la Corrección trazable de B-06 y la vista efectiva se determina por su cadena, no por “último registro” arbitrario.

#### 12.5.2. Validez mínima

**`REG-06-143` — Completitud obligatoria de la revisión.**

Sin evidencia identificable, interpretación, Resultado semántico, fundamento, Próxima acción o cierre, autoría y momento registrable **no existe revisión válida**. Un guardado parcial puede existir como borrador de interacción posterior, pero no produce los efectos de `UC-I05`/`UC-I06` ni resuelve un pendiente.

#### 12.5.3. Taxonomía única

**`REG-06-144` — Resultado semántico cerrado y compartido.**

B-09 adopta, sin extender, el conjunto:

```text
MANTENER
AJUSTAR
SUSTITUIR
REPROGRAMAR_REVISION
CAMBIAR_OBJETIVO
FINALIZAR
```

“Progresar” e “iniciar un nuevo bloque” se especializan dentro de `AJUSTAR` o `SUSTITUIR` conforme a B-00; **no crean un séptimo resultado** y ninguna vertical define tokens paralelos.

---

### 12.6. Próxima revisión y temporalidad

#### 12.6.1. Representación temporal

**`REG-06-145` — Próxima revisión explícita y reconstruible.**

Cuando un Plan/Proceso o una Revisión válida declara una próxima revisión, la estructura conserva:

- referencia al Proceso y dominio;
- fuente que la estableció (plan/versión o Revisión válida);
- momento o período objetivo explícito;
- autoría;
- ocurrencia, registro y procedencia conforme a B-06.

Una nueva decisión profesional puede suceder a la anterior sin reescribirla. B-09 no fija cadencia clínica ni periodicidad por defecto.

#### 12.6.2. `REPROGRAMAR_REVISION`

**`REG-06-146` — Reprogramación sin resultado paralelo.**

`REPROGRAMAR_REVISION` genera una nueva representación temporal de próxima revisión vinculada a la Revisión que la decide. La fecha/periodo anterior queda histórica. El Proceso permanece `ABIERTO` conforme a B-04; B-09 no crea un estado “reprogramado”.

---

### 12.7. Efectos de los seis resultados y continuidad

**`REG-06-147` — Aplicación de resultado mediante UC-I06/B-04.**

B-09 **no modifica directamente** la máquina `ABIERTO/CERRADO`. Tras una Revisión válida, `UC-I06` aplica la continuidad/cierre y emite el evento exacto `ContinuidadOCierreAplicado` de `REG-06-75`.

| Resultado | Efecto estructural de B-09 | Efecto de Proceso |
|---|---|---|
| `MANTENER` | conserva continuidad explícita; no fuerza una versión nueva por sí solo | `ABIERTO` |
| `AJUSTAR` | cuando la decisión modifica un objeto versionado, crea/sucede versión mediante la vertical + B-06; conserva antecedente | `ABIERTO` |
| `SUSTITUIR` | relaciona una versión sucesora cuando el objeto aplicable es sustituido; conserva la sustituida | `ABIERTO` |
| `REPROGRAMAR_REVISION` | fija nueva próxima revisión sin alterar historia | `ABIERTO` |
| `CAMBIAR_OBJETIVO` | emite/sucede la versión del Objetivo correspondiente; cualquier ajuste de Plan sigue reglas de su vertical | `ABIERTO` |
| `FINALIZAR` | solicita cierre explícito mediante UC-I06 | `CERRADO` |

**`REG-06-148` — `AJUSTAR` y `SUSTITUIR` reutilizan versionado vertical.**

B-09 no crea una máquina universal de Plan ni Objetivo. Nutrición usa B-07 y Entrenamiento B-08; toda versión sucesora instancia B-06. En Entrenamiento, una progresión o nuevo Bloque sigue especializándose en `AJUSTAR`/`SUSTITUIR` según conserve o genere versión.

**`REG-06-149` — Sin éxito parcial de continuidad.**

Una Revisión registrada sin aplicación válida de `UC-I06` no se presenta como continuidad/cierre consumado. Un fallo al aplicar el efecto no emite `ContinuidadOCierreAplicado` y no resuelve por sí solo un pendiente.

---

### 12.8. Revisión pendiente

#### 12.8.1. Predicado exacto

**`REG-06-150` — Revisión pendiente deriva solo de una expectativa explícita de revisión no satisfecha.**

Para un instante de referencia `t`, un Proceso se proyecta como **Revisión pendiente** únicamente cuando:

1. el Proceso está `ABIERTO`;
2. existe una expectativa **explícita y efectiva** de que ese Proceso sea revisado, procedente de una próxima revisión declarada por una versión de plan o de una Próxima acción registrada por una Revisión válida;
3. si esa expectativa posee momento/período objetivo futuro, dicho objetivo ya alcanzó `t`; si no posee un momento futuro, la necesidad queda pendiente desde su registro efectivo;
4. no existe una Revisión profesional válida efectiva, posterior y vinculada a esa expectativa, con su continuidad/cierre aplicada mediante `UC-I06`.

El motivo se conserva como dato operativo y no diagnóstico. El predicado no usa peso, adherencia, rendimiento, antropometría, inferencias clínicas ni scores para fabricar un pendiente. Si no existe expectativa explícita de revisión, B-09 no inventa una.

#### 12.8.2. Última revisión válida

La “última revisión válida” para reconstrucción es la **revisión efectiva según B-06 y su cadena de correcciones**, no simplemente la de mayor fecha de registro. Se preservan ocurrencia y registro por separado.

#### 12.8.3. Resolución del pendiente

Visualizar cartera/dashboard, abrir la Revisión, filtrar datos o guardar una nota aislada **no resuelve** el pendiente. Conforme a RF-055/UC-P23, el pendiente se resuelve únicamente cuando una Revisión profesional válida pertinente queda registrada y su continuidad/cierre se aplica mediante `UC-I06`. Una edición, nota, visualización o simple cambio de fecha fuera de ese circuito no cuenta como resolución.

---

### 12.9. Q-007, `REG-06-75` y TVCC-30

B-09 **consume, no redefine**, la resolución de Q-007 de B-04:

```text
Q-007: RESUELTA
EVENTO: ContinuidadOCierreAplicado
EMISIÓN: UC-I06 / REG-06-75
```

La combinación de Revisión válida + `ContinuidadOCierreAplicado` aporta hechos que `M-10/M-12` pueden utilizar para Ciclo cerrado trazable, pero B-09 **no calcula ni canoniza TVCC-30**. La definición analítica/versionada final pertenece al Documento 12.

---

### 12.10. Instanciación de B-06

B-09 instancia B-06 para:

- sucesión de Objetivo/Plan cuando un resultado lo requiere;
- corrección de una Revisión o de sus referencias sin eliminar el original;
- preservación de autoría, procedencia, ocurrencia y registro;
- determinación de la revisión/fecha efectiva mediante cadena de correcciones.

No redefine Versión, Instantánea reproducible ni Corrección trazable.

---

### 12.11. Fronteras

- acceso, retención, lectura residual y auditoría → Documento 08;
- despliegue/adaptadores → Documento 07;
- contratos/concurrencia → Documento 09;
- formularios, cartera y representación visual → Documento 10;
- pruebas de contenido mínimo/gaming → 11A;
- TVCC-30 canónica/versionada → Documento 12;
- proyecciones analíticas de ACTA-DIR-015 §5 → B-11 cuando correspondan.

---

### 12.12. Invariantes

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-154` | Una Revisión válida posee todos los componentes de REG-06-141/143. | se concede validez con un componente obligatorio ausente. |
| `INV-06-155` | Solo existen seis Resultados semánticos comunes. | una vertical agrega token o “progresar” se vuelve séptimo resultado. |
| `INV-06-156` | Visualizar/anotar no crea Revisión ni resuelve pendiente. | una acción de lectura produce efectos de revisión. |
| `INV-06-157` | `FINALIZAR` cierra mediante UC-I06/B-04; los otros cinco mantienen Proceso abierto. | B-09 crea transición paralela o cierra con otro resultado. |
| `INV-06-158` | `AJUSTAR`/`SUSTITUIR` conservan historia y usan versionado de vertical+B-06. | se sobrescribe versión anterior. |
| `INV-06-159` | `REPROGRAMAR_REVISION` conserva fecha anterior y no crea estado nuevo. | se borra historia o aparece máquina paralela. |
| `INV-06-160` | Próxima revisión no tiene cadencia por defecto inventada por BE. | el sistema fija periodicidad profesional no registrada. |
| `INV-06-161` | Revisión pendiente exige expectativa explícita de revisión actualmente exigible y ausencia de revisión efectiva que la satisfaga. | se infiere pendiente por score, rendimiento o falta genérica de datos. |
| `INV-06-162` | La última revisión válida se determina por vista efectiva B-06, no por mayor timestamp de registro. | una corrección queda ignorada por orden temporal simple. |
| `INV-06-163` | `ContinuidadOCierreAplicado` se reutiliza sin redefinir. | B-09 cambia contenido/condiciones de REG-06-75. |
| `INV-06-164` | B-09 no calcula TVCC-30. | aparece fórmula/elegibilidad analítica final de TVCC-30. |
| `INV-06-165` | B-09 no invade políticas/contratos/UI/retención. | fija materia reservada a 07/08/09/10/12. |

---

### 12.13. Cobertura M-10 — 12/12

| Unidad | Estado |
|---|---|
| `7.7-16` | `RESUELTA` |
| `7.8-01` | `RESUELTA` |
| `7.8-02` | `RESUELTA` |
| `7.8-03` | `RESUELTA` |
| `7.8-04` | `RESUELTA` |
| `7.8-07` | `RESUELTA` |
| `7.8-11` | `RESUELTA` |
| `7.9-12` | `RESUELTA` |
| `7.14-02` | `RESUELTA` |
| `7.14-03` | `RESUELTA` |
| `7.14-04` | `RESUELTA` |
| `7.14-05` | `RESUELTA` |

**Resultado:** `12/12`, por columna de Área primaria de la arquitectura.

---

### 12.14. B13-OBL-03 y cobertura acumulada

Distribución canónica: `7+7+14+17+10+16+31+18+14+25+12+16+22 = 209`.

Antes de Entrega D: `134/209`. B-09 agrega `12` unidades canónicas de M-10; B-10 agrega `25` de M-09. La cobertura conjunta esperada al aprobar Entrega D será `171/209`.

---

### 12.15. Autoverificación falsable

| # | Control | Condición de fallo |
|---:|---|---|
| 1 | `arquitectura_M10_12` | la lista primaria no contiene exactamente las 12 unidades declaradas |
| 2 | `seis_resultados` | falta un token o aparece séptimo |
| 3 | `revision_componentes` | se admite revisión sin evidencia/interpretación/resultado/fundamento/próxima acción o cierre/autoría/tiempo |
| 4 | `UC_I06_REG75` | se redefine Q-007 o `ContinuidadOCierreAplicado` |
| 5 | `efectos_resultado` | FINALIZAR no cierra o otro resultado cierra |
| 6 | `versionado_B06` | AJUSTAR/SUSTITUIR sobrescriben historia |
| 7 | `pendiente_explicito` | se infiere pendiente sin expectativa explícita de revisión exigible |
| 8 | `visualizacion_no_resuelve` | lectura/nota resuelve pendiente |
| 9 | `sin_TVCC` | B-09 calcula TVCC-30 |
| 10 | `fronteras` | invade 07/08/09/10/12 |
| 11 | `B13_209` | suma global distinta de 209 |
| 12 | `H_D_01_publicado` | se oculta la asimetría M-09/M-10 de ACTA-DIR-015 |
| 13 | `git_none` | se declara/ejecuta Git |

#### 12.15.1. Historial real

```text
EJECUCIÓN 1
CONTROLES: 13
FALLOS REALES: 0
RESULTADO: OK
H-D-01: PUBLICADO — NO OCULTO
```

---

### 12.16. Estado de salida

```text
B-09 — REVISIÓN Y CONTINUIDAD
ÁREA CANÓNICA: M-10
COBERTURA: 12/12
REG-06-141…150
INV-06-154…165
ALTAS T: 0 — REUTILIZA T-06-37…41

Q-007:
REUTILIZADA, NO REDEFINIDA

H-D-01:
ASIMETRÍA NOMINAL DE ACTA-DIR-015 PUBLICADA

GIT:
SIN OPERACIONES
```


---


## 13. B-10 — Antropometría

*Fuente ensamblada: `BE_LEG_06_B10_v0_1_ANTROPOMETRIA.md` · SHA-256 `25524467f493af795f9766d9c855b063219979cf62c4479e161f6ed660610727`.*


### 13.1. Objeto

B-10 define la estructura conceptual de `M-09 — Antropometría`: Evaluación antropométrica, Mediciones directas, Cálculos derivados reproducibles, protocolo/método/unidades, dependencias, corrección, comparabilidad, honestidad longitudinal y publicación limitada del servicio.

Antropometría permanece como **capacidad transversal**, no tercera especialidad. B-10 no fija un protocolo o fórmula profesional concreto, no define UI/asset visual, no presume proveedor/formato de importación, no fija retención/acceso ni calcula las proyecciones de B-11.

---

### 13.2. Hallazgo documental de apertura — `H-D-01`

Se adopta el mismo tratamiento publicado por B-09: `ACTA-DIR-015 §7` invierte los rótulos de área/cantidad respecto de la arquitectura aprobada. B-10 conserva el nombre ordenado **Antropometría**, pero resuelve las **25 unidades canónicas de M-09**. La asimetría queda pendiente de ratificación/rectificación documental en el acta de aprobación de Entrega D y no se usa para renumerar silenciosamente la arquitectura.

---

### 13.3. Gobierno y fuentes

| Fuente | SHA-256 / estado | Uso |
|---|---|---|
| `ACTA_DIR_015_APROBACION_v011_DEC047_Y_ENTREGA_D.md` | `53e6243476fb8c2720bb7ca6e3abad5aa0b262c05cd9427aab1d0fcd4a8d74b5` | habilitación y condiciones §7.1; contrato §5 como frontera |
| `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md` | `abdc420fec5d336c2e7cc81e6b36b7590ca81c7ea4d361d3064320319ec315e8` | 25 unidades primarias M-09 |
| `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md` | `1bbc1b549d14e788815a909a1aa1645f73318185fada3cf0285a7f732f3377f2` | T-06-33…36; REG-06-09/10; separación semántica |
| `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md` | `4bc7b4606c56a80702d92da727dcec332998ea14ed1af53e85265cb46b8f9e77` | método/versiones/correcciones/historia |
| `BE_LEG_05_v0.14_MAESTRO_CASOS_DE_USO_E_HISTORIAS.md` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | UC-P19/P20/P21/P22, UC-I09/UC-I12 |
| `DEC_044_OPERACION_ANTROPOMETRICA_INDEPENDIENTE.md` | `3ac9a38a912c6dddfa2be97ec0ea6821097457dfff157ea57b11fb5453e13caf` | capacidad antropométrica transversal independiente |

---

### 13.4. Apertura B-00

#### 13.4.1. Deuda primaria canónica M-09 — 25/25

| Unidad | Deuda | Resolución |
|---|---|---|
| `7.1-08` | fórmulas de dominio | §8 |
| `7.1-09` | dependencias entre cálculos | §9 |
| `7.11-01` | estructura de evaluación antropométrica | §5 |
| `7.11-02` | representación de mediciones directas | §6 |
| `7.11-03` | representación de cálculos derivados | §8 |
| `7.11-04` | referencia a protocolo identificado | §5–6 |
| `7.11-05` | estructura/versionado de métodos de cálculo | §8 |
| `7.11-06` | fórmulas antropométricas | §8.2 |
| `7.11-07` | unidades y catálogo de unidades | §7 |
| `7.11-08` | conversiones | §7.2 |
| `7.11-09` | precisión y redondeo | §8.3 |
| `7.11-10` | dependencias entrada/resultado | §9.1 |
| `7.11-11` | grafo para identificar dependencias | §9.1 |
| `7.11-12` | recálculo al corregir entrada | §10 |
| `7.11-14` | estructura de corrección antropométrica | §10 |
| `7.11-16` | compatibilidad técnica entre evaluaciones | §11 |
| `7.11-17` | comparabilidad ante cambios de método/versión/unidad | §11 |
| `7.11-18` | tratamiento técnico de no comparables | §11.3 |
| `7.11-19` | estructura para evolución longitudinal | §12 |
| `7.11-20` | invariante medición directa ≠ cálculo derivado | §6/8/15 |
| `7.11-23` | reconstrucción de protocolo/método/versión/unidad/entradas | §13 |
| `7.12-01` | estados técnicos de publicación | §14.1 |
| `7.12-02` | transiciones publicar/pausar/dejar de ser elegible | §14.2 |
| `7.12-03` | publicación ↔ identidad/capacidad/habilitación/ubicación | §14.3 |
| `7.12-07` | límite: sin reservas/turnos/pagos/ranking/reputación/reseñas/contratación | §14.4 |

#### 13.4.2. Términos ejecutados y altas

B-10 ejecuta:

- `T-06-33 — Medición antropométrica directa · Protocolo identificado`;
- `T-06-34 — Cálculo antropométrico derivado`;
- `T-06-35 — Evolución antropométrica`;
- `T-06-36 — Servicio antropométrico limitado · Ubicación utilizable`;
- `T-06-31 — Importación controlada`, como patrón de origen externo;
- patrones B-06 de Versión y Corrección trazable.

**Altas terminológicas nuevas: `0`.** “Ausencia de dato”, “compatibilidad” y “origen” se usan como propiedades/reglas del objeto ya dado de alta, sin crear sinónimos recurrentes de dominio.

---

### 13.5. Evaluación antropométrica

**`REG-06-151` — Evaluación antropométrica reconstruible.**

Toda Evaluación antropométrica conserva, como mínimo conceptual:

- asesorado;
- profesional/actor responsable;
- fecha o momento de evaluación;
- Protocolo identificado y su referencia/versionado aplicable;
- conjunto de Mediciones antropométricas directas y Cálculos antropométricos derivados, discriminados;
- unidades de origen;
- autoría, ocurrencia, registro y procedencia conforme a B-06;
- referencias a correcciones cuando existan.

Una Evaluación no se convierte en Plan ni Revisión profesional de especialidad y Antropometría no adquiere ciclo de plan propio.

---

### 13.6. Medición directa y origen de captura

**`REG-06-152` — Medición directa separada de cálculo.**

Una Medición antropométrica directa representa un dato observado/registrado bajo un Protocolo identificado y conserva:

- métrica/sitio o magnitud identificable;
- valor cuando existe;
- unidad de origen;
- protocolo y contexto aplicable;
- autoría y procedencia;
- origen de captura verificable.

Nunca se etiqueta un Cálculo derivado como Medición directa por el solo hecho de haber sido importado.

**`REG-06-153` — Importación controlada desde preparación externa, agnóstica de formato/proveedor.**

El origen de una Medición/Evaluación puede ser una **Importación controlada desde datos de preparación externa**. El patrón exige:

1. conservar procedencia de la preparación externa y actor/importador;
2. validar que cada dato pueda clasificarse como medición directa, cálculo derivado u otro dato no incorporable antes de ingresar al modelo efectivo;
3. conservar protocolo/método/unidad/versión disponibles y registrar cualquier insuficiencia sin inventarlos;
4. mantener referencia reconstruible al origen importado;
5. no presuponer proveedor, exportador, archivo, columnas, serialización ni formato de transporte.

Formato y proveedor pertenecen a Documentos 07/09. La herramienta de preparación externa usada por Dirección es un **origen admitido**, no una dependencia canónica ni proveedor obligatorio.

---

### 13.7. Unidades y conversiones

**`REG-06-154` — Unidad de origen siempre visible en el dominio.**

Toda medición o resultado cuantitativo conserva su unidad de origen. El Catálogo conceptual de unidades permite identificar la unidad sin fijar almacenamiento físico.

**`REG-06-155` — Conversión explícita y reproducible.**

Cuando una comparación o cálculo requiera conversión, se conserva:

- valor y unidad de origen;
- regla/especificación de conversión identificable y versionada;
- valor/unidad convertidos cuando se materialicen;
- procedencia del acto de conversión.

Se aplica `REG-06-09`: ninguna normalización puede ocultar la unidad original.

---

### 13.8. Cálculo antropométrico derivado

#### 13.8.1. Estructura

**`REG-06-156` — Resultado derivado reproducible.**

Un Cálculo antropométrico derivado conserva:

- métrica/resultado identificado;
- Método de cálculo identificado y su versión;
- Fórmula/regla de dominio aplicable identificada y versionada;
- conjunto exacto de entradas efectivas y sus unidades;
- resultado y unidad;
- precisión y regla de redondeo aplicadas;
- momento de cálculo, autoría/procedencia del método y procedencia del resultado;
- relación de sucesión cuando un recálculo produce una versión posterior.

`UC-I09` puede reconstruir qué método, versión y entradas produjeron el resultado. B-10 no fija aquí una fórmula profesional concreta.

#### 13.8.2. Fórmulas de dominio

**`REG-06-157` — Fórmula antropométrica como especificación versionada, no contenido fijo de esta ronda.**

El modelo admite Fórmulas/reglas antropométricas con identificador estable y versión. La especificación declara, al menos conceptualmente:

- entradas requeridas y unidades/condiciones esperadas;
- definición reproducible de la operación;
- resultado producido y unidad;
- regla de precisión/redondeo;
- procedencia/versionado.

Las fórmulas concretas se cargan como contenido técnico/profesional probado; este bloque define **la estructura para representarlas y reconstruirlas**, no selecciona una como universal.

#### 13.8.3. Precisión y redondeo

**`REG-06-158` — Precisión y redondeo declarados.**

No existe redondeo silencioso “por defecto” que impida reproducir un resultado. La especificación aplicable declara precisión y regla de redondeo; la salida conserva suficiente referencia para reconstruir qué regla se aplicó.

---

### 13.9. Dependencias y grafo de cálculo

**`REG-06-159` — Dependencias explícitas entre entradas y derivados.**

Cada resultado derivado referencia las entradas efectivas de las que depende. El conjunto de referencias forma un grafo dirigido reconstruible que permite identificar, para una Medición corregida, qué resultados quedan afectados de forma directa o transitiva.

B-10 no infiere dependencias por nombre de campo ni por posición en una exportación.

---

### 13.10. Corrección y recálculo

**`REG-06-160` — Corrección antropométrica mediante UC-I12/B-06.**

Corregir una Medición o dato estructural antropométrico:

- conserva el original;
- registra actor, fecha/momento, motivo y procedencia;
- crea relación de Corrección trazable conforme a B-06;
- determina la vista efectiva sin borrar historia.

**`REG-06-161` — Recálculo dependiente sin sobrescritura.**

Cuando una Corrección cambia una entrada de un Cálculo derivado, el grafo de dependencias determina qué resultados deben reemitirse. El recálculo:

- usa el Método/Fórmula/versiones aplicables según la decisión profesional/técnica registrada;
- produce un nuevo resultado relacionado con el anterior;
- conserva el resultado histórico y sus entradas originales;
- nunca reescribe retroactivamente cálculos históricos por existir un método nuevo.

---

### 13.11. Compatibilidad y comparabilidad

#### 13.11.1. Evaluación de compatibilidad

**`REG-06-162` — Comparabilidad solo con compatibilidad demostrable.**

Dos observaciones/evaluaciones solo pueden tratarse como comparables cuando existe una **evaluación explícita y justificable de compatibilidad** que demuestre adecuación de:

- Protocolo;
- Método y versión aplicables;
- unidad o conversión explícita reproducible;
- identidad semántica de la métrica comparada.

La evaluación conserva especificación/versionado y fundamento. Aplica `REG-06-10`: que haya cambiado protocolo/método/versión/unidad es una señal de revisión, **no incomparabilidad automática**; tampoco autoriza normalización silenciosa.

#### 13.11.2. Comparación con conversión

**`REG-06-163` — Conversión no equivale a ocultar diferencia metodológica.**

Una conversión de unidad puede habilitar equivalencia cuantitativa cuando la especificación de comparabilidad la admite, pero no resuelve por sí sola cambios de protocolo o método. La comparación conserva qué conversión se realizó y qué limitaciones permanecen.

#### 13.11.3. Datos no comparables

**`REG-06-164` — No comparable se conserva, no se fuerza.**

Cuando no puede demostrarse compatibilidad suficiente, los datos permanecen disponibles como hechos históricos identificados, pero no se agregan en una comparación longitudinal como si fueran homogéneos. B-10 conserva la razón/limitación; B-11/Documento 10 decidirán después cómo proyectar o presentar esa condición sin falsearla.

---

### 13.12. Honestidad longitudinal: ausencia de dato ≠ cero

**`REG-06-165` — Disponibilidad explícita por métrica y checkpoint.**

Para cada métrica en un punto longitudinal, el modelo distingue explícitamente:

```text
REGISTRADO  → existe valor observado/derivado; el valor puede ser 0
SIN_DATO    → no existe valor para esa métrica/checkpoint; no se almacena un 0 sustituto
```

`0` es un valor cuantitativo posible y **nunca funciona como sentinel de ausencia**.

**`REG-06-166` — Cero interpolación, imputación o completado de huecos.**

La Serie longitudinal antropométrica solo usa valores efectivamente registrados/derivados y comparables bajo §11. Un hueco permanece `SIN_DATO`. B-10 prohíbe:

- interpolar entre dos checkpoints;
- arrastrar el último valor conocido;
- completar con cero;
- imputar promedio/estimación;
- inventar un checkpoint para “suavizar” la serie.

Una proyección posterior puede **mostrar** la ausencia, pero no convertirla en dato. Esta es condición de aceptación de Entrega D.

**`REG-06-167` — Evolución longitudinal conserva fuente y clase del dato.**

Cada punto disponible conserva si proviene de Medición directa o Cálculo derivado, su Evaluación de origen, método/protocolo/unidad y cualquier limitación de comparabilidad. La Evolución antropométrica es lectura longitudinal; no crea una nueva medición ni modifica fuentes.

---

### 13.13. Reconstruibilidad integral

**`REG-06-168` — Reconstrucción de protocolo, método, versión, unidad y entradas.**

Para toda Medición/Cálculo efectivo debe ser posible reconstruir, según corresponda:

- Protocolo identificado;
- Método/Fórmula y versión;
- unidad de origen y conversiones;
- entradas efectivas;
- correcciones y resultados sucedidos;
- autoría, ocurrencia, registro y procedencia.

Una importación incompleta no autoriza completar silenciosamente metadata ausente: la insuficiencia se conserva como limitación observable.

---

### 13.14. Servicio antropométrico limitado

#### 13.14.1. Estado técnico de publicación

**`REG-06-169` — Publicación limitada con estado independiente de elegibilidad.**

Una vez creada, la Publicación de servicio antropométrico utiliza dos estados técnicos:

```text
PUBLICADA
PAUSADA
```

La inexistencia de Publicación previa **no se modela como un tercer estado**: simplemente aún no existe el objeto de publicación. `PUBLICADA` significa descubrible conforme a autorización/política; `PAUSADA` conserva historia pero no es descubrible.

#### 13.14.2. Transiciones

**`REG-06-170` — Publicar, pausar y perder elegibilidad sin borrar historia.**

- **Publicar:** crea una Publicación `PUBLICADA` o reactiva una `PAUSADA` solo después de verificar elegibilidad vigente.
- **Pausar:** `PUBLICADA → PAUSADA`, conservando historia.
- **Dejar de ser elegible:** una Publicación que estuviera `PUBLICADA` pasa a `PAUSADA` con causa observable; no se borra ni sigue siendo descubrible.

Una reactivación exige volver a demostrar elegibilidad. El mecanismo de autorización, lectura residual y política fina pertenece a Documento 08.

#### 13.14.3. Elegibilidad y relaciones

**`REG-06-171` — Seis condiciones de publicación sin exigir especialidad.**

Para estar `PUBLICADA` deben coexistir las condiciones funcionales aprobadas:

1. identidad profesional activa;
2. capacidad antropométrica declarada y `VERIFICADA`;
3. servicio habilitado;
4. Ubicación utilizable;
5. autorización para publicar;
6. estado profesional válido.

No se exige Nutrición o Entrenamiento verificadas. La Publicación referencia identidad, capacidad antropométrica, habilitación y ubicación sin fusionarlas.

#### 13.14.4. Límite de alcance

**`REG-06-172` — Publicación limitada no es marketplace.**

La estructura no introduce reservas, turnos, pagos, comisiones, ranking, reputación, reseñas, popularidad, patrocinio o contratación. Publicar/descubrir no crea Vínculo ni concede acceso profesional; cualquier solicitud posterior sigue el circuito de vínculo ya aprobado.

---

### 13.15. Instanciación de B-06 y UC-I09/UC-I12

- `UC-I09` consume Método/Fórmula versionados, entradas y unidades para emitir Cálculos derivados reproducibles.
- `UC-I12` aplica Corrección trazable a la Evaluación/Medición y dispara recálculo de dependientes cuando corresponde.
- B-06 conserva versiones, originales, correcciones, autoría, procedencia y doble temporalidad.
- B-10 no redefine ninguno de esos patrones.

La separación **Medición directa ≠ Cálculo derivado** permanece invariante antes, durante y después de importación/corrección.

---

### 13.16. Contrato de proyecciones §5 — captura suficiente, cero modelado B-11

`ACTA-DIR-015 §5` obliga a B-11 a producir, entre otras, **Evolución antropométrica longitudinal**. B-10 deja disponibles sus fuentes: Mediciones directas, Cálculos derivados, especificaciones/versiones, dependencias, comparabilidad y Serie longitudinal honesta.

B-10 **no calcula ni define la proyección de B-11**, no decide gráficos, tendencias, deltas, colores, interpolaciones ni representación visual. La captura es suficiente precisamente porque conserva los huecos en vez de inventarlos.

---

### 13.17. Fronteras documentales

- retención, política de acceso, auditoría y visibilidad → Documento 08;
- adaptadores/proveedores/despliegue/formato técnico de importación → Documento 07;
- contratos, serialización, códigos y formatos de transporte → Documento 09;
- gráficos, máscaras, siluetas y superficies → Documento 10;
- instrumentos/evidencia/pruebas de fórmula/comparabilidad → 11A/11B;
- TVCC-30 analítica → Documento 12;
- proyecciones longitudinales/analíticas → B-11.

---

### 13.18. Invariantes M-09

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-166` | Medición directa y Cálculo derivado son tipos semánticos distintos. | importación/recálculo convierte uno en otro sin acto/modelo explícito. |
| `INV-06-167` | Importación externa conserva procedencia y es agnóstica de proveedor/formato. | se exige un exportador/CSV/columnas específicos en M-09. |
| `INV-06-168` | Valor cuantitativo conserva unidad de origen; conversión explícita no la oculta. | se normaliza y pierde unidad original. |
| `INV-06-169` | Todo cálculo derivado reconstruye método/fórmula/versión/entradas/unidad/precisión. | un resultado no puede reproducirse. |
| `INV-06-170` | Dependencias son explícitas y no se infieren por nombre/posición. | un recálculo depende de heurística no declarada. |
| `INV-06-171` | Corregir no borra original y reemite dependientes afectados sin sobrescribir históricos. | se modifica en sitio un dato o resultado histórico. |
| `INV-06-172` | Método nuevo no reescribe cálculos históricos. | una actualización recalcula pasado sin acto/versionado explícito. |
| `INV-06-173` | Comparabilidad requiere compatibilidad demostrable de protocolo, método y unidad/especificación. | se comparan series por coincidencia de nombre solamente. |
| `INV-06-174` | Diferencia metodológica no implica incomparabilidad automática ni conversión automática. | se fuerza uno de esos extremos sin especificación. |
| `INV-06-175` | Dato no comparable se conserva como hecho con limitación. | se elimina o fuerza dentro de una serie homogénea. |
| `INV-06-176` | `SIN_DATO` y `REGISTRADO(0)` son estados distintos. | se usa cero como sentinel o se pierde un cero real. |
| `INV-06-177` | Serie longitudinal no interpola, imputa, arrastra ni completa huecos. | aparece valor no registrado/derivado para un checkpoint. |
| `INV-06-178` | Evolución conserva fuente directa/derivada y procedencia. | un punto longitudinal pierde su origen. |
| `INV-06-179` | Protocolo, método, versión, unidad y entradas pueden reconstruirse. | metadata crítica se completa silenciosamente o desaparece. |
| `INV-06-180` | Publicación solo está `PUBLICADA` si mantiene las seis condiciones; perder elegibilidad la vuelve no descubrible sin borrar historia. | un servicio inelegible sigue visible o se elimina historial. |
| `INV-06-181` | Publicación limitada no crea marketplace, vínculo o acceso. | aparecen reservas/pagos/ranking/reseñas/contratación o acceso implícito. |
| `INV-06-182` | B-10 no invade B-11/10/08/07/09/12. | modela proyección, UI, política de acceso/retención, proveedor/formato o TVCC. |

---

### 13.19. Cobertura M-09 — 25/25

| Unidad | Estado |
|---|---|
| `7.1-08` | `RESUELTA` |
| `7.1-09` | `RESUELTA` |
| `7.11-01` | `RESUELTA` |
| `7.11-02` | `RESUELTA` |
| `7.11-03` | `RESUELTA` |
| `7.11-04` | `RESUELTA` |
| `7.11-05` | `RESUELTA` |
| `7.11-06` | `RESUELTA` |
| `7.11-07` | `RESUELTA` |
| `7.11-08` | `RESUELTA` |
| `7.11-09` | `RESUELTA` |
| `7.11-10` | `RESUELTA` |
| `7.11-11` | `RESUELTA` |
| `7.11-12` | `RESUELTA` |
| `7.11-14` | `RESUELTA` |
| `7.11-16` | `RESUELTA` |
| `7.11-17` | `RESUELTA` |
| `7.11-18` | `RESUELTA` |
| `7.11-19` | `RESUELTA` |
| `7.11-20` | `RESUELTA` |
| `7.11-23` | `RESUELTA` |
| `7.12-01` | `RESUELTA` |
| `7.12-02` | `RESUELTA` |
| `7.12-03` | `RESUELTA` |
| `7.12-07` | `RESUELTA` |

**Resultado:** `25/25`, extraído por columna de Área primaria, no por prefijo de sección.

---

### 13.20. B13-OBL-03 y cobertura acumulada

```text
TOTAL ARQUITECTURA: 209/209
M-09: 25/25
M-10: 12/12 (B-09)
ENTREGA D: 37/37
COBERTURA ACUMULADA ESPERADA AL APROBAR D: 171/209
RESTAN: M-11 16 + M-12 22 = 38
```

---

### 13.21. Autoverificación falsable

| # | Control | Condición de fallo |
|---:|---|---|
| 1 | `M09_25_por_area_primaria` | la lista no contiene exactamente las 25 unidades canónicas |
| 2 | `importacion_controlada` | no admite origen externo o presupone formato/proveedor |
| 3 | `procedencia_importacion` | origen importado pierde procedencia/actor/referencia |
| 4 | `directa_vs_derivada` | un cálculo se etiqueta directo o viceversa sin semántica explícita |
| 5 | `reproducibilidad` | falta método/versión/entradas/unidades/precisión en derivado |
| 6 | `dependencias` | no puede determinarse qué recalcular ante corrección |
| 7 | `no_sobrescritura` | corrección/recálculo elimina original |
| 8 | `comparabilidad` | comparación no exige compatibilidad demostrable protocolo/método/unidad |
| 9 | `ausencia_vs_cero` | `SIN_DATO` puede convertirse en 0 o un 0 real se trata como ausencia |
| 10 | `sin_interpolacion` | existe interpolación/imputación/arrastre/completado |
| 11 | `publicacion_condiciones` | servicio PUBLICADA sin las seis condiciones o sigue visible al perder elegibilidad |
| 12 | `sin_marketplace` | aparecen reserva/turno/pago/ranking/reputación/reseña/contratación |
| 13 | `B06_UCI09_UCI12` | se redefinen patrones en vez de instanciarlos |
| 14 | `sin_B11` | B-10 calcula/proyecta evolución en lugar de capturar fuentes |
| 15 | `fronteras` | fija retención/acceso/proveedor/formato/UI/TVCC |
| 16 | `B13_209` | suma global distinta de 209 |
| 17 | `H_D_01_publicado` | se oculta la asimetría del ACTA |
| 18 | `git_none` | se declara/ejecuta Git |

#### 13.21.1. Historial real

```text
EJECUCIÓN 1
CONTROLES: 18
FALLOS REALES: 0
RESULTADO: OK
CRÍTICOS ACTA §7.1.1 / §7.1.2: OK
H-D-01: PUBLICADO — NO OCULTO
```

---

### 13.22. Estado de salida

```text
B-10 — ANTROPOMETRÍA
ÁREA CANÓNICA: M-09
COBERTURA: 25/25
REG-06-151…172
INV-06-166…182
ALTAS T: 0 — REUTILIZA T-06-31, T-06-33…36

IMPORTACIÓN CONTROLADA EXTERNA:
SOPORTADA · PROCEDENCIA CONSERVADA · AGNÓSTICA DE FORMATO/PROVEEDOR

LONGITUDINAL:
SIN_DATO ≠ 0 · CERO INTERPOLACIÓN/IMPUTACIÓN/COMPLETADO

B-11:
FUENTES SUFICIENTES · PROYECCIÓN NO MODELADA

H-D-01:
ASIMETRÍA NOMINAL DE ACTA-DIR-015 PUBLICADA

GIT:
SIN OPERACIONES
```


---


## 14. B-11 — Proyecciones y cartera

*Fuente ensamblada: `BE_LEG_06_B11_v0_1_PROYECCIONES_Y_CARTERA.md` · SHA-256 `e343c74126a066d5e583f888347d45cea708b49df9e188d53d8ec7d1c893f05f`.*


### 14.1. Objeto

B-11 materializa el área `M-11` como capa de **proyecciones de dominio y cartera**, construida exclusivamente a partir de fuentes ya propietarias de sus datos. Su función es organizar información derivada para cartera profesional, síntesis interdisciplinaria, timeline y progreso longitudinal sin adquirir autoridad de escritura sobre Nutrición, Entrenamiento, Antropometría, Revisión, Vínculo, Consentimiento o cualquier otro dominio fuente.

Además, B-11 implementa el contrato vinculante de ocho proyecciones fijado por `ACTA-DIR-015 §5` y reiterado por `ACTA-DIR-016 §6.1`.

B-11 **no** define pantallas, gráficos, colores, mapas musculares ni orden visual; esa representación pertenece al Documento 10. Tampoco fija políticas de acceso o visibilidad —Documento 08—, contratos —Documento 09—, persistencia física —prohibida por `PROH-06-01`— ni fórmulas profesionales que no hayan sido aprobadas.

---

### 14.2. Fuentes y precedencia

B-11 se apoya en:

1. `BE_LEG_06 v0.1.1` como inventario canónico de deuda y propiedad de áreas.
2. `B-00 v0.2.1`, especialmente `CONV-06-05`, `CONV-06-08`, `CONV-06-09`, `PROH-06-01…04`, `T-06-42` y la separación de dominios.
3. `B-06 v0.1.1` para versión, referencia a original/valor efectivo, corrección, autoría, procedencia y doble temporalidad.
4. `B-07 v0.1.2`, `B-08 v0.1.2`, `B-09 v0.1` y `B-10 v0.1` como fuentes verticales ya aprobadas.
5. `DEC-047` y `ACTA-DIR-015 §5` para las fuentes de captura que habilitan las ocho proyecciones.
6. `ACTA-DIR-016`, que hace vinculantes dichas proyecciones y exige que la honestidad longitudinal de B-10 rija también aquí.

Una tensión entre estas fuentes no se resuelve por interpretación local: aplica `INV-06-10` y se eleva a Dirección.

---

### 14.3. Apertura conforme a B-00 §11.1

#### 14.3.1. Unidades primarias `M-11`

B-11 salda exactamente estas 16 unidades de la arquitectura:

| Unidad | Deuda primaria |
|---|---|
| `7.1-10` | proyecciones/read models de dominio |
| `7.14-01` | proyección/read model de cartera profesional |
| `7.14-06` | filtros y ordenamiento como responsabilidad compartida 06/10 |
| `7.14-07` | criterios de ordenamiento que no se conviertan en gravedad clínica |
| `7.14-08` | agregados necesarios para cartera sin producir score global |
| `7.15-01` | proyecciones/read models por dominio |
| `7.15-02` | agregados técnicos para síntesis |
| `7.15-03` | modelo longitudinal común de eventos |
| `7.15-04` | distinción ocurrencia / registro |
| `7.15-06` | relaciones entre planes, ejecuciones, evaluaciones, cálculos, correcciones, revisiones y próximas acciones |
| `7.15-07` | proyección del timeline |
| `7.15-08` | vista parcial cuando solo parte del contexto está autorizada |
| `7.15-09` | filtros/períodos del progreso propio compartidos con 10 |
| `7.15-10` | proyección longitudinal para APK del asesorado |
| `7.15-11` | mecanismo para no mezclar dominios en calificación agregada |
| `7.16-06` | historial longitudinal |

**Resultado esperado:** `16/16`.

#### 14.3.2. Términos

B-11 **no da de alta términos nuevos**. Reutiliza `T-06-42` —que ya agrupa Cartera profesional, Dashboard interdisciplinario, Línea temporal longitudinal y Progreso longitudinal propio— y los términos de los dominios fuente. El léxico específico de las ocho proyecciones se usa como nombre de read model/resultado derivado, no como ampliación del glosario propietario.

#### 14.3.3. Máquinas

B-11 **no crea máquinas de estados**. Las proyecciones son read models derivados; sus fuentes conservan sus máquinas propietarias.

#### 14.3.4. Fronteras `DERIVADO`

- visibilidad y política de acceso → Documento 08;
- filtros de interfaz, jerarquía visual, gráficos y mapas → Documento 10;
- contratos de consulta → Documento 09;
- instrumentos y estrategia de pruebas → 11A/11B;
- TVCC-30 → B-12 + Documento 12;
- persistencia física → no se fija.

---

### 14.4. Contrato común de proyección

**`REG-06-173` — Proyección derivada sin autoridad de escritura.**  
Toda proyección de B-11 conserva como mínimo: tipo de proyección; período o corte consultado; dominio o dominios fuente; referencias a registros/versiones efectivamente utilizados; condición de derivación; alcance parcial cuando corresponda; momento de generación; y procedencia de la derivación. La proyección no modifica sus fuentes ni se convierte en Fuente de verdad del dominio.

Una proyección que no puede derivarse con las fuentes disponibles **no fabrica el dato faltante**: expone ausencia, insuficiencia o no comparabilidad según la semántica ya definida por el dominio propietario.

#### 14.4.1. Vista parcial

La existencia de una proyección global no implica derecho de acceso global. Cuando la autorización contextual permita solo parte de las fuentes, la proyección se construye exclusivamente con ese subconjunto y queda identificada como **vista parcial**. B-11 no decide qué subconjunto es visible; recibe esa decisión de 08/M-03.

---

### 14.5. Cartera profesional

**`REG-06-174` — Read model de cartera profesional.**  
La Cartera profesional proyecta, para cada relación profesional–asesorado autorizada a ser consultada, referencias estructurales a: identidad necesaria para distinguir el caso; Alcance; estado del Proceso cuando aplique; última Revisión profesional válida disponible; próxima acción o cierre; condición de Revisión pendiente definida por B-09; y marcadores descriptivos derivados que permitan filtrar u ordenar sin alterar las fuentes.

B-11 no redefine qué constituye pendiente: consume B-09. Visualizar, abrir o consultar la cartera nunca resuelve uno.

**`REG-06-175` — Filtros y ordenamiento no clínicos.**  
B-11 admite dimensiones técnicas de filtro/ordenamiento sustentadas en datos reales —por ejemplo dominio, existencia de pendiente, fechas reales registradas, estado operativo o disponibilidad de información—, pero **no crea prioridad clínica, gravedad, riesgo médico ni score global**. El Documento 10 decide cómo se presentan y combinan esas dimensiones en interfaz.

Los agregados de cartera son conteos, agrupaciones o estados descriptivos; no califican al asesorado.

---

### 14.6. Modelo longitudinal común

**`REG-06-176` — Evento longitudinal referenciado, no duplicado.**  
El timeline común no copia ni reescribe eventos de origen. Cada entrada longitudinal referencia el hecho propietario y conserva, cuando la fuente lo dispone: dominio, tipo de hecho, objeto relacionado, actor, autoría, procedencia, momento de ocurrencia, momento de registro, versión y relaciones de sucesión/corrección de B-06.

El orden por ocurrencia y el orden por registro son dimensiones distintas. Si un momento es desconocido, no se sustituye por el otro.

**`REG-06-177` — Relación longitudinal entre hechos de dominio.**  
La proyección puede relacionar de manera explícita planes, ejecuciones, evaluaciones, cálculos derivados, correcciones, revisiones y próximas acciones cuando las fuentes ya contienen referencias que permiten reconstruir esa relación. No inventa causalidad ni parentesco documental por proximidad temporal.

El progreso propio admite filtros/períodos y una proyección longitudinal para el asesorado; el Documento 10 resuelve la interacción visual.

---

### 14.7. Contrato vinculante de ocho proyecciones

Las ocho proyecciones siguientes son obligatorias. Todas heredan `REG-06-173` y los invariantes de §10.

#### 14.7.1. Volumen por ejercicio y período

**`REG-06-178` — Volumen observado por ejercicio y período.**  
La proyección consume Series ejecutadas estructuradas de B-08 y produce, por ejercicio y período, una magnitud derivada **solo cuando existe una especificación de derivación aplicable y trazable**. Conserva las series fuente, unidades y criterio usado. B-11 no congela aquí una fórmula universal ni transforma una ausencia de carga/repeticiones en cero.

#### 14.7.2. Volumen por Zona muscular y período

**`REG-06-179` — Volumen por Zona con rol explícito.**  
La proyección combina la serie ejecutada con la relación versionada Ejercicio–Zona muscular de B-08. Cada contribución conserva el rol `principal` o `secundario` declarado en catálogo y la versión de esa relación.

El rol **no implica por sí mismo un coeficiente de ponderación**. Si una derivación profesional posterior usa ponderaciones, estas deben llegar como especificación explícita; B-11 no las inventa. En ausencia de ponderación autorizada, los componentes por rol permanecen discriminados.

#### 14.7.3. Volumen efectivo frente a volumen total

**`REG-06-180` — Efectividad según umbral profesional, nunca del sistema.**  
La proyección recibe un umbral de efectividad configurado por el profesional y conserva, para reproducibilidad, el criterio observado (`RIR` o esfuerzo percibido), el valor/condición del umbral, su autoría profesional y la referencia temporal o versionada que permita reconstruir qué configuración se aplicó. Clasifica únicamente las Series ejecutadas que poseen el dato estructurado requerido. El esfuerzo percibido continúa siendo **dato opcional de ejecución**, nunca criterio de prescripción, preservando `REG-06-129`; la existencia de granularidad por ejercicio/sesión no se descompone retrospectivamente para fabricar granularidad por serie, preservando `REG-06-132`. Informa por separado:

- conjunto total observado;
- conjunto evaluable respecto del umbral;
- conjunto que satisface el umbral;
- conjunto no clasificable por ausencia del dato necesario.

Una serie sin RIR/esfuerzo no se presume efectiva ni inefectiva. B-11 no fija el umbral ni una definición profesional universal de “serie efectiva”.

#### 14.7.4. Progresión de carga, repeticiones y RIR

**`REG-06-181` — Serie de progresión sin interpolación.**  
Por ejercicio, la proyección ordena puntos realmente registrados de carga, repeticiones y RIR, preservando unidad, fecha de ocurrencia, correcciones y granularidad de registro. No interpola valores entre sesiones, no completa huecos y no reconstruye retroactivamente una serie por ejercicio a partir de un registro agregado de sesión.

#### 14.7.5. Marcas personales

**`REG-06-182` — Marca personal observada y criterio explícito.**  
Una Marca personal deriva de ejecuciones efectivamente registradas de un ejercicio bajo un **criterio explícito de comparación** sustentado por campos disponibles. Conserva el registro fuente y el criterio utilizado. B-11 no estima una repetición máxima, no proyecta una marca futura y no introduce fórmulas de rendimiento no aprobadas.

#### 14.7.6. Distribución de trabajo por Zona muscular

**`REG-06-183` — Distribución de trabajo por Zona.**  
La proyección agrupa las contribuciones observadas de trabajo por identificador estable de Zona muscular y período, preservando rol y versión de la relación ejercicio–zona. El resultado es una estructura de datos; el mapa corporal, intensidad cromática, máscara o silueta pertenecen exclusivamente al Documento 10.

#### 14.7.7. Evolución antropométrica longitudinal

**`REG-06-184` — Evolución antropométrica honesta.**  
La proyección consume la Serie longitudinal antropométrica de B-10. Solo compara puntos cuya compatibilidad haya sido demostrada por `REG-06-162…164`. Conserva protocolo, método/versión, unidad y clase del dato cuando corresponda. `SIN_DATO` permanece ausencia: no se transforma en cero, no se interpola, no se imputa y no se arrastra el último valor.

Los segmentos no comparables permanecen visibles como registros históricos, pero no se convierten en una tendencia cuantitativa homogénea.

#### 14.7.8. Contraste prescrito frente a consumido

**`REG-06-185` — Contraste nutricional descriptivo.**  
La proyección relaciona prescripción activa/versionada de B-07 con ingesta efectivamente registrada para el período consultado, conservando modalidad, cantidades/unidades cuando existan, estado de preparación, procedencia y carácter estimado cuando corresponda.

El contraste es descriptivo: no produce puntaje de adherencia, calificación, sanción ni inferencia sobre ingesta no registrada. Un período sin registro es un período sin dato.

---

### 14.8. Síntesis interdisciplinaria

La síntesis interdisciplinaria se construye como **composición de read models por dominio**, no como fusión semántica. Puede presentar en un mismo contexto información nutricional, de entrenamiento, antropométrica y de revisión, pero cada componente conserva:

- dominio propietario;
- fuente/versiones;
- unidad y método cuando aplican;
- condición de dato derivado o directo;
- autoría/procedencia;
- alcance autorizado.

No existe un “estado general de salud” calculado por B-11.

---

### 14.9. Instanciación de B-06

B-11 instancia B-06 del siguiente modo:

1. las proyecciones referencian versiones y correcciones vigentes sin reescribir históricos;
2. una corrección de una fuente cambia la vista derivable posterior, pero no borra la proyección histórica previamente materializada cuando deba conservarse para reconstrucción;
3. la línea temporal referencia original y valor efectivo conforme a la cadena de corrección;
4. autoría, procedencia y doble temporalidad se preservan desde las fuentes;
5. una bifurcación no resoluble del patrón común no se resuelve escogiendo “lo último”.

B-11 no redefine ninguna regla de B-06.

---

### 14.10. Invariantes locales

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-183` | Una proyección no tiene autoridad de escritura sobre su fuente. | una consulta derivada modifica plan, ejecución, medición, revisión, vínculo o cualquier fuente. |
| `INV-06-184` | Dato ausente permanece ausente. | se sustituye por cero, se imputa, interpola o arrastra un valor. |
| `INV-06-185` | Vista parcial no se completa por inferencia. | faltan dominios autorizados y B-11 rellena o deduce el contexto ausente. |
| `INV-06-186` | Ocurrencia y registro son dimensiones distintas. | un único timestamp se usa indistintamente para ambos cuando la fuente los distingue. |
| `INV-06-187` | La cartera no expresa gravedad clínica. | un orden técnico se etiqueta o usa como severidad/riesgo médico. |
| `INV-06-188` | No existe score agregado interdisciplinario. | dominios heterogéneos se reducen a una calificación global del asesorado. |
| `INV-06-189` | El rol de Zona no implica ponderación. | principal/secundario activa un coeficiente no declarado. |
| `INV-06-190` | Una serie sin dato de esfuerzo no se clasifica por efectividad. | ausencia de RIR/esfuerzo se interpreta como efectiva o no efectiva. |
| `INV-06-191` | La progresión usa puntos observados. | se interpolan sesiones, cargas, repeticiones o RIR ausentes. |
| `INV-06-192` | Una marca personal es observada bajo criterio explícito. | se presenta una estimación no declarada o un 1RM inferido como marca medida. |
| `INV-06-193` | Evolución antropométrica respeta comparabilidad. | se conecta cuantitativamente un tramo declarado no comparable. |
| `INV-06-194` | Contraste nutricional es descriptivo. | genera puntaje, calificación o presume consumo no registrado. |
| `INV-06-195` | Los assets visuales no pertenecen a M-11. | B-11 define máscara, color, gráfico, layout, resolución o archivo gráfico. |

---

### 14.11. Cobertura `M-11`

| Unidad | Resolución | Estado |
|---|---|---|
| `7.1-10` | §4 + `REG-06-173` | `RESUELTA` |
| `7.14-01` | §5 + `REG-06-174` | `RESUELTA` |
| `7.14-06` | `REG-06-175` + frontera Doc10 | `RESUELTA COMO ESTRUCTURA + FRONTERA 10` |
| `7.14-07` | `REG-06-175` + `INV-06-187` | `RESUELTA` |
| `7.14-08` | §5 + `INV-06-188` | `RESUELTA` |
| `7.15-01` | §§4,7–8 | `RESUELTA` |
| `7.15-02` | §§5,7–8 | `RESUELTA` |
| `7.15-03` | `REG-06-176/177` | `RESUELTA` |
| `7.15-04` | `REG-06-176` + `INV-06-186` | `RESUELTA` |
| `7.15-06` | `REG-06-177` + §9 | `RESUELTA` |
| `7.15-07` | §6 + frontera Doc10 | `RESUELTA COMO ESTRUCTURA + FRONTERA 10` |
| `7.15-08` | §4.1 + `INV-06-185` | `RESUELTA COMO ESTRUCTURA + FRONTERA 08` |
| `7.15-09` | §6 + frontera Doc10 | `RESUELTA COMO ESTRUCTURA + FRONTERA 10` |
| `7.15-10` | §6 + `REG-06-173` | `RESUELTA` |
| `7.15-11` | §8 + `INV-06-188` | `RESUELTA` |
| `7.16-06` | §§6,9 | `RESUELTA — INSTANCIA B-06` |

**Resultado:** `16/16`.

---

### 14.12. Verificación del contrato de ACTA-DIR-015 §5

| # | Proyección obligatoria | Regla propietaria B-11 | Estado |
|---:|---|---|---|
| 1 | Volumen por ejercicio y período | `REG-06-178` | `PRESENTE` |
| 2 | Volumen por Zona muscular y período | `REG-06-179` | `PRESENTE` |
| 3 | Volumen efectivo frente a total | `REG-06-180` | `PRESENTE` |
| 4 | Progresión carga/repeticiones/RIR | `REG-06-181` | `PRESENTE` |
| 5 | Marcas personales | `REG-06-182` | `PRESENTE` |
| 6 | Distribución de trabajo por Zona | `REG-06-183` | `PRESENTE` |
| 7 | Evolución antropométrica longitudinal | `REG-06-184` | `PRESENTE` |
| 8 | Contraste prescrito/consumido | `REG-06-185` | `PRESENTE` |

---

### 14.13. Autoverificación falsable

| # | Control | Condición de fallo |
|---:|---|---|
| 1 | `M11_16_16` | la lista primaria no contiene exactamente 16 unidades de M-11 |
| 2 | `contrato_8_8` | falta cualquiera de las ocho proyecciones vinculantes |
| 3 | `sin_write_authority` | una proyección modifica una fuente |
| 4 | `sin_score_global` | aparece calificación agregada del asesorado |
| 5 | `sin_inferencia_ausentes` | se imputa/interpola/rellena dato ausente |
| 6 | `umbral_profesional` | el sistema fija el umbral de efectividad |
| 7 | `esfuerzo_faltante_no_clasificado` | ausencia de RIR/esfuerzo se clasifica |
| 8 | `zona_sin_peso_implicito` | principal/secundario genera coeficiente automático |
| 9 | `anthro_comparabilidad` | se proyecta tendencia entre puntos no comparables |
| 10 | `nutricion_descriptiva` | contraste genera adherencia/puntaje o infiere ingesta |
| 11 | `marca_observada` | se estima marca/1RM sin fuente explícita |
| 12 | `timeline_doble_tiempo` | ocurrencia y registro se colapsan |
| 13 | `vista_parcial_honesta` | se completa contexto no autorizado |
| 14 | `B06_instanciado` | B-11 redefine versión/corrección/vista efectiva |
| 15 | `sin_UI_Doc10` | se fija asset/layout/color/mapa/resolución |
| 16 | `sin_persistencia_fisica` | aparece ORM/tabla/columna/índice/esquema físico |
| 17 | `REG_continuidad` | las reglas nuevas no son exactamente `REG-06-173…185` |
| 18 | `INV_continuidad` | los invariantes nuevos no son exactamente `INV-06-183…195` |
| 19 | `B13_OBL_03_209` | la distribución canónica deja de sumar 209 |
| 20 | `git_none` | se declara o ejecuta operación Git |

#### 14.13.1. Historial real de esta redacción

```text
EJECUCIÓN 1
CONTROLES DOCUMENTALES: 20
FALLOS REALES DETECTADOS DURANTE REDACCIÓN: 0
DETECTORES RELAJADOS PARA HACER PASAR EL ARTEFACTO: 0
RESULTADO: OK — SUJETO A CONTRARREVISIÓN EXTERNA
```

---

### 14.14. Estado de salida

```text
B-11 — PROYECCIONES Y CARTERA
ÁREA: M-11
COBERTURA: 16/16
CONTRATO ACTA-DIR-015 §5: 8/8
ALTAS T: 0
REG-06-173…185
INV-06-183…195
MÁQUINAS NUEVAS: 0
B-06: INSTANCIADO, NO REDEFINIDO
DATOS AUSENTES: NO INFERIDOS
SCORE GLOBAL: PROHIBIDO
REPRESENTACIÓN VISUAL: DOCUMENTO 10
GIT: SIN OPERACIONES
```


---


## 15. B-12 — Analítica y TVCC-30

*Fuente ensamblada: `BE_LEG_06_B12_v0_1_ANALITICA_Y_TVCC30.md` · SHA-256 `19883ade5098293a73caf52bffdc9aab5aace35d62b5ffcc5c25638f975095f5`.*


### 15.1. Objeto

B-12 fija los **componentes computables de TVCC-30** que pertenecen al Documento 06: estructura de ciclos candidatos, referencias a eventos, evaluación trazable de inclusión/exclusión, candidatos a numerador y denominador, motivos de exclusión, referencia a la especificación analítica, zona temporal/analítica, resultados históricos y relación entre versiones.

B-12 **no fija la definición analítica canónica, la fórmula, los valores de ventana, la elegibilidad fina normativa ni el versionado final de la especificación**. Esas decisiones pertenecen al Documento 12. Esta frontera no es una omisión: es la resolución explícita ordenada por `ACTA-DIR-016 §6.2` y por la arquitectura para evitar que 06 cierre unilateralmente la métrica.

TVCC-30 permanece separada de retención, adherencia, score clínico, resultado de salud y cualquier calificación del asesorado.

---

### 15.2. Apertura conforme a B-00

#### 15.2.1. Unidades primarias `M-12`

B-12 salda exactamente:

`7.17-01…7.17-21` + `DIR-06-04` = **22 unidades**.

| Unidad | Deuda primaria |
|---|---|
| `7.17-01` | fórmula exacta de TVCC-30 — frontera 06/12 |
| `7.17-02` | elegibilidad fina de ciclos |
| `7.17-03` | definición técnica del numerador |
| `7.17-04` | definición técnica del denominador |
| `7.17-05` | exclusiones y motivos |
| `7.17-06` | versión de especificación |
| `7.17-07` | zona temporal/analítica aplicable |
| `7.17-08` | reglas de reproducción histórica |
| `7.17-09` | relación con eventos UC-P13, UC-P18, UC-I05 y UC-I06 |
| `7.17-10` | nueva versión de especificación sin sobrescribir cálculos previos |
| `7.17-11` | estructura de resultados históricos |
| `7.17-12` | trazabilidad de incluidos/excluidos |
| `7.17-13` | visualización no cuenta como revisión |
| `7.17-14` | nota aislada no cuenta como revisión |
| `7.17-15` | modificación silenciosa no cuenta como revisión |
| `7.17-16` | ciclo requiere revisión válida y próxima acción/cierre |
| `7.17-17` | numerador nunca sin denominador |
| `7.17-18` | TVCC-30 no es retención/adherencia/score/resultado de salud |
| `7.17-19` | propiedad 06 sobre componentes computables |
| `7.17-20` | propiedad 12 sobre definición analítica canónica |
| `7.17-21` | prohibición de cerrar fórmula unilateralmente en 06 |
| `DIR-06-04` | elegibilidad/eventos y versionado coordinados con 12 |

#### 15.2.2. Términos

B-12 **no crea términos nuevos**. Reutiliza `T-06-44 — TVCC-30`, `T-06-37…40` para revisión/ciclo y `T-06-24` para doble temporalidad.

#### 15.2.3. Máquinas

B-12 no crea una máquina de estados para TVCC-30. Los resultados analíticos son hechos derivados/versionados; B-06 gobierna historia y sucesión. El ciclo operativo sigue siendo propiedad de B-04/B-09.

---

### 15.3. Frontera 06 ↔ Documento 12

**`REG-06-186` — Especificación analítica externa al modelo de dominio.**  
B-12 exige una referencia inequívoca a la especificación analítica aplicable para toda evaluación computable de TVCC-30. Esa referencia puede identificar versión y demás metadatos necesarios para reproducibilidad, pero B-12 **no define el contenido matemático ni la semántica final de esa especificación**.

Si no existe una especificación aplicable y trazable, B-12 no fabrica un resultado ni adopta una fórmula implícita.

**`REG-06-187` — Propiedad separada.**  
06 posee entidades, relaciones, referencias, componentes computables e historia. Documento 12 posee la definición analítica canónica, la fórmula, criterios finos, versión normativa de la especificación y evidencia reproducible de calidad. Cualquier cambio de esa división exige reconciliación documental previa.

---

### 15.4. Ciclo candidato y eventos consumidos

#### 15.4.1. Candidato

Un **ciclo candidato** es una referencia a un ciclo de seguimiento potencialmente evaluable, no una afirmación de que integre numerador o denominador. Conserva referencias suficientes para vincular:

- Proceso y dominio;
- Vínculo/Alcance cuando corresponda;
- Revisión profesional válida;
- próxima acción o cierre;
- evento técnico de continuidad/cierre aplicado;
- momentos relevantes;
- procedencia;
- especificación analítica usada para evaluar inclusión.

**`REG-06-188` — Consumo de hechos, no recreación.**  
B-12 consume hechos producidos por los recorridos de `UC-P13`, `UC-P18`, `UC-I05` y `UC-I06`, y en particular referencia `ContinuidadOCierreAplicado` de `REG-06-75`. No redefine su esquema, condiciones de emisión ni efectos.

**`REG-06-189` — Revisión válida como requisito estructural.**  
Un ciclo no puede satisfacer la condición estructural de completitud analítica sin una Revisión profesional válida de B-09 y una próxima acción o cierre efectivamente materializados conforme a B-04/B-09. Visualizaciones, notas o ediciones silenciosas no sustituyen esos hechos.

---

### 15.5. Evaluación de elegibilidad

**`REG-06-190` — Elegibilidad evaluada contra especificación referenciada.**  
Para cada ciclo candidato, B-12 conserva un registro de evaluación que identifica:

- ciclo candidato;
- especificación y versión aplicadas;
- resultado de inclusión/exclusión producido por la aplicación de esa especificación;
- regla o criterio de la especificación que sustentó el resultado;
- motivo explícito cuando queda excluido;
- momento y procedencia de la evaluación.

B-12 no codifica aquí cuáles son los criterios finos: los recibe del Documento 12.

**`REG-06-191` — Exclusión explicable.**  
Todo ciclo excluido conserva motivo y referencia al criterio aplicable. “No contado” sin explicación no es suficiente para reproducibilidad.

La ausencia de evidencia necesaria no se corrige por inferencia: puede impedir la inclusión o el cálculo según la especificación, pero nunca se reemplaza con un hecho ficticio.

---

### 15.6. Componentes de numerador y denominador

**`REG-06-192` — Candidato a denominador trazable.**  
El componente candidato a denominador se construye a partir de ciclos cuya evaluación los identifica como integrantes bajo la especificación referenciada. Conserva el conjunto de ciclos fuente; B-12 no define la regla analítica que los vuelve elegibles.

**`REG-06-193` — Candidato a numerador trazable.**  
El componente candidato a numerador se construye como subconjunto trazable de ciclos evaluados conforme a la especificación y con los hechos requeridos por ella. Conserva cada ciclo fuente y el criterio aplicado.

**`REG-06-194` — Par inseparable para presentación analítica.**  
Cuando B-12 materializa componentes TVCC-30, numerador y denominador se conservan y consultan como par bajo la misma especificación, período y zona. B-12 no autoriza presentar un numerador aislado como si fuera la métrica.

Esta regla no define la operación matemática que Documento 12 aplique sobre el par.

---

### 15.7. Zona temporal y período analítico

**`REG-06-195` — Contexto temporal explícito.**  
Toda evaluación/resultante histórica conserva el período analítico y la zona temporal efectiva usados por la especificación. Mientras no exista cambio formal, la referencia temporal debe ser compatible con la zona MVP vigente `America/Argentina/Buenos_Aires`.

B-12 no resuelve contratos de fecha/hora ni serialización: Documento 09.

---

### 15.8. Resultado histórico reproducible

**`REG-06-196` — Estructura de resultado histórico.**  
Un resultado histórico de TVCC-30 conserva, como mínimo:

- período/corte;
- zona temporal/analítica;
- referencia a especificación y versión;
- ciclos candidatos examinados;
- ciclos incluidos y excluidos;
- motivos de exclusión;
- componentes de numerador y denominador con sus ciclos fuente;
- referencia al resultado analítico producido por aplicación de la especificación, cuando exista;
- momento de generación y procedencia;
- relación con resultados sucesores cuando una nueva especificación vuelva a evaluar el mismo período.

**`REG-06-197` — Reproducción desde fuentes, no desde el valor mostrado.**  
La reconstrucción histórica parte de la especificación referenciada y de los ciclos/eventos conservados, no de copiar retrospectivamente un valor agregado sin sus componentes.

**`REG-06-198` — Nueva especificación produce historia nueva.**  
Aplicar una especificación posterior a un período ya calculado genera un resultado sucesor o paralelo conforme a B-06. No sobrescribe el resultado histórico anterior ni cambia silenciosamente su lista de incluidos/excluidos.

---

### 15.9. Trazabilidad de ciclos

**`REG-06-199` — Trazabilidad exhaustiva del universo evaluado.**  
Todo ciclo candidato examinado queda identificable como incluido, excluido con motivo, o no resoluble por falta de evidencia según lo que permita la especificación. B-12 no pierde silenciosamente candidatos entre entrada y resultado.

**`REG-06-200` — Separación de dato ausente y cero.**  
Cuando un componente requerido no existe, la ausencia permanece ausencia. Un cero válido producido por la especificación es un valor; no se usa como sentinel de dato faltante. B-12 hereda el principio de honestidad longitudinal aplicado en B-10/B-11.

---

### 15.10. Condición de no fabricación

**`REG-06-201` — Cálculo no forzado.**  
Si falta una especificación válida, no puede reconstruirse el conjunto de fuentes exigido o la evidencia no alcanza para aplicar las reglas declaradas, el sistema no fabrica TVCC-30. La incapacidad de producir un resultado queda observable y trazable sin sustituirse por cero, promedio, estimación silenciosa ni valor de otra versión.

---

### 15.11. Invariantes locales

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-196` | B-12 no fija la fórmula canónica de TVCC-30. | aparece una operación matemática normativa propia de 06. |
| `INV-06-197` | Elegibilidad fina depende de especificación referenciada. | B-12 hardcodea criterios finales sin Documento 12. |
| `INV-06-198` | `REG-06-75` se consume sin redefinición. | B-12 cambia campos, precondiciones o emisión de `ContinuidadOCierreAplicado`. |
| `INV-06-199` | Visualización no constituye revisión. | abrir dashboard/cartera hace elegible un ciclo. |
| `INV-06-200` | Nota aislada no constituye revisión. | una nota reemplaza evidencia+interpretación+resultado+fundamento+acción/cierre. |
| `INV-06-201` | Modificación silenciosa no constituye revisión. | un cambio sin revisión válida alimenta el ciclo como revisión. |
| `INV-06-202` | Un ciclo requiere revisión válida y próxima acción o cierre. | un ciclo incompleto se trata como cierre válido. |
| `INV-06-203` | Numerador y denominador forman par bajo misma especificación/período/zona. | se publica numerador aislado o con contexto distinto. |
| `INV-06-204` | TVCC-30 no es retención, adherencia, score clínico ni resultado de salud. | se etiqueta o interpreta como cualquiera de esas métricas. |
| `INV-06-205` | Nueva especificación no sobrescribe resultados previos. | recalcular elimina o muta el histórico anterior. |
| `INV-06-206` | Incluidos y excluidos son trazables. | un ciclo desaparece del universo evaluado sin clasificación/motivo. |
| `INV-06-207` | Ausencia de dato no se convierte en cero. | falta evidencia y se rellena con 0 u otro valor. |
| `INV-06-208` | Zona/período/especificación son parte de la reproducibilidad. | el resultado no permite saber bajo qué contexto fue derivado. |
| `INV-06-209` | 06 posee estructura; Documento 12 posee definición analítica canónica. | B-12 invade 12 o 12 se modela como mero comentario opcional. |
| `INV-06-210` | TVCC-30 no adquiere autoridad de escritura. | un resultado modifica revisión, proceso, vínculo o fuente operativa. |

---

### 15.12. Instanciación de B-04 y B-06

#### 15.12.1. B-04 / Q-007

B-12 consume `ContinuidadOCierreAplicado` como hecho posterior a `UC-I06`. No redefine `Q-007`, no emite el evento por su cuenta y no altera la máquina `ABIERTO/CERRADO` del Proceso.

#### 15.12.2. B-06

- especificaciones y resultados se referencian por versión;
- una re-evaluación no sobrescribe historia;
- referencias a fuentes/correcciones usan vista efectiva sin borrar originales;
- autoría, procedencia, ocurrencia y registro se preservan;
- ninguna bifurcación se resuelve por “última fecha” sin relación válida.

---

### 15.13. Cobertura `M-12`

| Unidad | Resolución | Estado |
|---|---|---|
| `7.17-01` | §§1,3 + `INV-06-196/209` | `RESUELTA COMO FRONTERA VINCULANTE CON 12` |
| `7.17-02` | §5 + `REG-06-190` | `RESUELTA COMO COMPONENTE + ESPECIFICACIÓN 12` |
| `7.17-03` | §6 + `REG-06-193` | `RESUELTA COMO COMPONENTE` |
| `7.17-04` | §6 + `REG-06-192` | `RESUELTA COMO COMPONENTE` |
| `7.17-05` | `REG-06-191/199` | `RESUELTA` |
| `7.17-06` | `REG-06-186/196` | `RESUELTA COMO REFERENCIA VERSIONADA` |
| `7.17-07` | `REG-06-195` | `RESUELTA COMO ESTRUCTURA + FRONTERA 12/09` |
| `7.17-08` | `REG-06-196…198` | `RESUELTA` |
| `7.17-09` | §4 + `REG-06-188` | `RESUELTA` |
| `7.17-10` | `REG-06-198` + B-06 | `RESUELTA` |
| `7.17-11` | `REG-06-196` | `RESUELTA` |
| `7.17-12` | `REG-06-199` | `RESUELTA` |
| `7.17-13` | `INV-06-199` | `RESUELTA` |
| `7.17-14` | `INV-06-200` | `RESUELTA` |
| `7.17-15` | `INV-06-201` | `RESUELTA` |
| `7.17-16` | `REG-06-189` + `INV-06-202` | `RESUELTA` |
| `7.17-17` | `REG-06-194` + `INV-06-203` | `RESUELTA` |
| `7.17-18` | `INV-06-204` | `RESUELTA` |
| `7.17-19` | §§3–10 | `RESUELTA — PROPIEDAD 06` |
| `7.17-20` | §3 + `INV-06-209` | `RESUELTA COMO FRONTERA — PROPIEDAD 12` |
| `7.17-21` | `INV-06-196/209` | `RESUELTA` |
| `DIR-06-04` | §§3–9 + B-06 | `RESUELTA COMO COORDINACIÓN VINCULANTE CON 12` |

**Resultado:** `22/22`.

---

### 15.14. Autoverificación falsable

| # | Control | Condición de fallo |
|---:|---|---|
| 1 | `M12_22_22` | no aparecen exactamente 22 unidades primarias M-12 |
| 2 | `sin_formula_06` | B-12 fija fórmula matemática canónica |
| 3 | `spec_requerida` | se calcula sin referencia de especificación |
| 4 | `REG75_consumido` | se redefine `ContinuidadOCierreAplicado` |
| 5 | `revision_valida` | visualización/nota/edición silenciosa cuenta como revisión |
| 6 | `accion_o_cierre` | ciclo se considera completo sin próxima acción/cierre |
| 7 | `num_den_par` | numerador aparece sin denominador/contexto común |
| 8 | `exclusiones_motivo` | existe excluido sin motivo/criterio |
| 9 | `todos_candidatos_trazados` | un candidato desaparece del universo evaluado |
| 10 | `historia_no_sobrescrita` | nueva spec muta resultado previo |
| 11 | `timezone_context` | resultado carece de zona/período |
| 12 | `sin_fabricar_ausentes` | ausencia se reemplaza por cero/estimación |
| 13 | `no_retencion_adherencia_score` | TVCC se etiqueta como retención/adherencia/score/resultado de salud |
| 14 | `frontera_Doc12` | B-12 define semántica final reservada a 12 |
| 15 | `B06_instanciado` | se redefine versionado/corrección/historia |
| 16 | `B04_no_redefinido` | se redefine máquina del Proceso/Q-007 |
| 17 | `sin_persistencia_fisica` | aparecen tablas/columnas/ORM/índices |
| 18 | `REG_continuidad` | reglas nuevas no son exactamente `REG-06-186…201` |
| 19 | `INV_continuidad` | invariantes nuevos no son exactamente `INV-06-196…210` |
| 20 | `B13_OBL_03_209` | distribución canónica deja de sumar 209 |
| 21 | `DIR0604` | frontera de elegibilidad/eventos/versionado no queda explícita |
| 22 | `git_none` | se declara o ejecuta Git |

#### 15.14.1. Historial real

```text
EJECUCIÓN 1
CONTROLES DOCUMENTALES: 22
FALLOS REALES DETECTADOS DURANTE REDACCIÓN: 0
DETECTORES RELAJADOS PARA HACER PASAR EL ARTEFACTO: 0
RESULTADO: OK — SUJETO A CONTRARREVISIÓN EXTERNA
```

---

### 15.15. Estado de salida

```text
B-12 — ANALÍTICA Y TVCC-30
ÁREA: M-12
COBERTURA: 22/22
ALTAS T: 0
REG-06-186…201
INV-06-196…210
REG-06-75: CONSUMIDA, NO REDEFINIDA
FÓRMULA CANÓNICA: NO FIJADA — DOCUMENTO 12
ELEGIBILIDAD FINA NORMATIVA: DOCUMENTO 12
HISTORIA/COMPONENTES COMPUTABLES: MODELADOS
GIT: SIN OPERACIONES
```


---


## 16. B-13 — Cierre global

*Fuente ensamblada: `BE_LEG_06_B13_v0_1_CIERRE_GLOBAL.md` · SHA-256 `200c9e11a424fa35bb703561b0afdf4677740d7177ad550d514849e7f5afc8d1`.*


### 16.1. Objeto

B-13 no introduce un nuevo dominio funcional. Ejecuta el **cierre global falsable** de BE-LEG-06 antes de su futuro ensamblado maestro.

Verifica:

1. `B13-OBL-01` — grado real de resolución y ausencia de instanciaciones pendientes;
2. `B13-OBL-02` — mandatos terminológicos M-01 sin unidad propia;
3. `B13-OBL-03` — suma exacta `209/209` por columna de área primaria;
4. `B13-OBL-04` — correspondencia bloque↔área por denominación;
5. continuidad y ausencia de colisión de identificadores;
6. cero unidades sin área o cubiertas por dos áreas primarias;
7. preservación de fronteras documentales;
8. estado de preguntas y hallazgos antes del ensamblado.

B-13 **no ensambla el Documento 06 maestro, no lo canoniza y no ejecuta Git**. ACTA-DIR-016 exige actos posteriores separados para ensamblado y canonización.

---

### 16.2. Baseline de cierre

La arquitectura canónica asigna 209 unidades a trece áreas primarias. Antes de Entrega E existían 171/209 aprobadas. B-11 incorpora 16/16 de M-11 y B-12 incorpora 22/22 de M-12, completando las 38 restantes.

La corrección `H-D-01` de ACTA-DIR-016 se aplica como lectura normativa sobre actas anteriores:

```text
B-09 — Revisión y continuidad → M-10 → 12
B-10 — Antropometría          → M-09 → 25
```

`H-D-01` está **CERRADO** y no requiere cambios técnicos en B-09/B-10.

---

### 16.3. B13-OBL-01 — Resolución sustantiva vs régimen/invariante

#### 16.3.1. Criterio

Se usan dos clases de cierre:

- `SUSTANTIVA_EN_PROPIETARIO`: el bloque del área modeló directamente la deuda asignada.
- `RÉGIMEN_O_PATRÓN_CON_INSTANCIACIÓN_VERIFICADA`: B-00/B-06 resolvieron una convención, invariante o patrón común y la instancia concreta requerida quedó materializada por el área coordinada.

La clase prohibida al cierre es:

- `RÉGIMEN_O_INVARIANTE_CON_INSTANCIACIÓN_PENDIENTE`.

#### 16.3.2. Resultado por área

| Área | Bloque propietario | Unidades | Clase de cierre | Instanciación pendiente al cierre |
|---|---|---:|---|---:|
| `M-00` | B-00 | 7 | régimen/convenciones raíz con instanciación verificada por bloques posteriores cuando aplica | 0 |
| `M-01` | B-01 | 7 | sustantiva | 0 |
| `M-02` | B-02 | 14 | sustantiva | 0 |
| `M-03` | B-03 | 17 | sustantiva | 0 |
| `M-04` | B-04 | 10 | sustantiva | 0 |
| `M-05` | B-05 | 16 | sustantiva | 0 |
| `M-06` | B-06 | 31 | patrón común; instanciaciones coordinadas verificadas en áreas propietarias | 0 |
| `M-07` | B-07 | 18 | sustantiva + instanciación B-06 | 0 |
| `M-08` | B-08 | 14 | sustantiva + instanciación B-06 | 0 |
| `M-09` | B-10 | 25 | sustantiva + instanciación B-06 | 0 |
| `M-10` | B-09 | 12 | sustantiva + coordinación B-04/B-06 | 0 |
| `M-11` | B-11 | 16 | sustantiva + instanciación B-06 | 0 |
| `M-12` | B-12 | 22 | componentes sustantivos de 06 + fronteras vinculantes con Documento 12 | 0 |

#### 16.3.3. Verificación específica de B-06

La obligación nació porque B-06 distinguía insuficientemente entre patrón común ya resuelto e instancia específica pendiente. Al cierre:

- `7.16-05` → M-04: eventos de continuidad/cierre materializados en B-04 y consumidos por B-09/B-12;
- `7.16-06` → M-11: historial longitudinal materializado en B-11;
- referencias a original/valor efectivo y cadena de corrección → instanciadas por las verticales y Antropometría;
- autoría/procedencia/doble temporalidad → preservadas por B-01…B-12 cuando aplican;
- las fronteras con 08 permanecen frontera, no “pendiente interno de 06”.

#### 16.3.4. Inventario unitario de cierre — 209/209

Para cumplir literalmente `B13-OBL-01`, la verificación no se detiene en el agregado por área: **cada unidad del inventario canónico queda clasificada individualmente**. `Pendiente interno = 0` significa que dentro del Documento 06 no queda una instanciación exigida sin materializar. Las fronteras expresamente reservadas a documentos posteriores se clasifican como fronteras resueltas, no como deuda interna pendiente.

| Unidad | Área primaria | Bloque | Clase de cierre | Evidencia de instanciación / frontera | Pendiente interno |
|---|---|---|---|---|---:|
| `7.1-01` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-01…B-12 materializan entidades/relaciones bajo CONV-06-01. | `0` |
| `7.1-02` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-06 materializa Persistencia conceptual sin persistencia física. | `0` |
| `7.1-03` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-01…B-10 declaran estados concretos solo donde existe ciclo. | `0` |
| `7.1-04` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-01…B-10 instancian máquinas/listas blancas cuando aplican; B-11/B-12 declaran ninguna. | `0` |
| `7.1-05` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | INV locales B-01…B-12 instancian el régimen falsable de invariantes. | `0` |
| `7.1-07` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-02/B-09 reutilizan taxonomías técnicas canónicas; no hay taxonomía paralela. | `0` |
| `7.1-11` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | B-02/B-03/B-07/B-08/B-10 especializan equivalencia/comparabilidad/unicidad sin normalización silenciosa. | `0` |
| `7.2-01` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-02` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-03` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-04` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-05` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-06` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-09` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | B-01 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-01` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-02` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-03` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-04` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-05` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-06` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-07` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-08` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-09` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-10` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-11` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-12` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-14` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-01` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | B-02 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-01` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-02` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-03` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-04` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-06` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-07` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-08` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-09` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-10` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-11` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-15` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.5-01` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.5-02` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.5-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-06` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | B-03 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.2-07` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.3-13` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-13` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-14` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.5-03` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.5-06` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-05` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-08` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.16-05` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `DIR-06-03` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | B-04 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.4-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-10` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-02` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-03` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-04` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-05` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-06` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-07` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-08` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-09` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-10` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-11` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.13-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `DIR-06-01` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `DIR-06-02` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | B-05 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.1-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-02/B-07/B-08/B-09/B-10/B-12 instancian versionado donde corresponde. | `0` |
| `7.2-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-01 aplica conservación histórica tras cierre; política sigue en 08. | `0` |
| `7.5-04` | `M-06` | B-06 | `PATRÓN/FRONTERA RESUELTA — SIN PENDIENTE INTERNO` | B-06 resuelve preservación estructural; política posterior permanece en 08. | `0` |
| `7.6-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07 instancia no sobrescritura histórica. | `0` |
| `7.7-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07 instancia Instantánea reproducible. | `0` |
| `7.7-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07 conserva versión activa e históricas. | `0` |
| `7.7-11` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07 aplica sustitución sin sobrescritura. | `0` |
| `7.7-17` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07 preserva snapshot frente a cambios posteriores de catálogo/borrador. | `0` |
| `7.8-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-09 coordina nueva versión con B-07/B-08 según resultado de revisión. | `0` |
| `7.8-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-09 reutiliza Corrección trazable para revisión. | `0` |
| `7.8-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-09 conserva revisión anterior e historia. | `0` |
| `7.9-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 instancia snapshot de activación. | `0` |
| `7.10-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 instancia cadena de correcciones. | `0` |
| `7.10-07` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 conserva original → corrección → sucesiva. | `0` |
| `7.10-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 conserva cadena; B-11 consume vista efectiva derivada sin borrar originales. | `0` |
| `7.10-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 conserva actor/momentos/motivo/procedencia de correcciones. | `0` |
| `7.10-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08 instancia no sobrescritura. | `0` |
| `7.10-11` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08/B-10 reutilizan el patrón común UC-I12. | `0` |
| `7.11-13` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-10 conserva/versiona resultados anteriores. | `0` |
| `7.11-15` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-10 instancia original → corrección. | `0` |
| `7.11-21` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-10 recálcula creando resultado nuevo, no reemplazo. | `0` |
| `7.11-22` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-10 impide que método nuevo reescriba cálculos históricos. | `0` |
| `7.12-04` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-10 conserva historia ante cambios de publicación. | `0` |
| `7.15-05` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-11 preserva autoría/procedencia en proyecciones longitudinales. | `0` |
| `7.16-01` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-07/B-08/B-09/B-10 instancian relaciones entre versiones. | `0` |
| `7.16-02` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08/B-09/B-10 instancian eventos/entidades de corrección. | `0` |
| `7.16-03` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-08/B-10 instancian cadena reconstruible. | `0` |
| `7.16-04` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-11 consume original/efectivo como proyección derivada. | `0` |
| `7.16-07` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-11 conserva actor, autoría, ocurrencia, registro, procedencia y versión. | `0` |
| `7.16-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | B-06 materializa no sobrescritura y B-00 la gobierna como invariante raíz. | `0` |
| `7.16-09` | `M-06` | B-06 | `PATRÓN/FRONTERA RESUELTA — SIN PENDIENTE INTERNO` | Frontera resuelta: 06 preserva estructura; auditoría/acceso al historial permanecen en Documento 08. | `0` |
| `7.6-01` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-02` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-03` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-04` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-05` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-06` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.6-07` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-01` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-02` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-03` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-04` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-05` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-06` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-07` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-08` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-13` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-14` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-15` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | B-07 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-01` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-02` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-03` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-04` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-05` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-06` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-07` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-08` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-11` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.10-01` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.10-02` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.10-03` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.10-04` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.10-05` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | B-08 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.1-08` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.1-09` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-01` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-02` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-03` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-04` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-05` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-06` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-07` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-08` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-09` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-10` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-11` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-12` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-14` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-16` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-17` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-18` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-19` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-20` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.11-23` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-01` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-02` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-03` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.12-07` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | B-10 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.7-16` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-01` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-02` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-03` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-04` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-07` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.8-11` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.9-12` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-02` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-03` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-04` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-05` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | B-09 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.1-10` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-01` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-07` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.14-08` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-01` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-02` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-03` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-04` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-07` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-08` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-09` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-10` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.15-11` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.16-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | B-11 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-01` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | Frontera 06→12: B-12 modela referencia/componentes; fórmula exacta canónica queda en Documento 12. | `0` |
| `7.17-02` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-03` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-04` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-05` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-06` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | B-12 conserva referencia/version de especificación consumida; versionado analítico final queda en Documento 12. | `0` |
| `7.17-07` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-08` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-09` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-10` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-11` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-12` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-13` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-14` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-15` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-16` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-17` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-18` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-19` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | B-12 declara la unidad en su cobertura primaria y la materializa sin reasignación. | `0` |
| `7.17-20` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | Frontera explícita: definición analítica canónica, trazabilidad final, versión y evidencia reproducible pertenecen a Documento 12. | `0` |
| `7.17-21` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | B-12 prohíbe cierre unilateral; requiere reconciliación con Documento 12. | `0` |
| `DIR-06-04` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | B-12 modela elegibilidad/eventos como componentes y conserva la coordinación obligatoria con Documento 12. | `0` |

**Control unitario:** `209` filas · `209` IDs únicos · `0` duplicados · `0` sin área · `0` con pendiente interno.

**Resultado `B13-OBL-01`: CONFORME — 209/209 unidades clasificadas; 0 instanciaciones internas pendientes.**

---

### 16.4. B13-OBL-02 — Mandatos `T-06-06`, `T-06-07`, `T-06-08`

Estos tres términos son `PROPIETARIO-06` de M-01 pero no poseen una fila `7.2-*` propia. B-01 los ejecutó como mandatos terminológicos complementarios sin inventar deuda adicional.

| Término | Mandato verificado | Materialización propietaria | Resultado |
|---|---|---|---|
| `T-06-06 — Incidencia administrativa` | historia por adición; soporte no como backdoor de escritura | B-01 `REG-06-27/28` + invariantes locales | `CONFORME` |
| `T-06-07 — Novedad interna` | fuente funcional interna de consulta | B-01 `REG-06-29` | `CONFORME` |
| `T-06-08 — Notificación push no sensible` | referencia a Novedad; contenido mínimo; no concede acceso | B-01 `REG-06-30` + `INV-06-33` | `CONFORME` |

No se suman tres unidades ficticias al inventario: siguen siendo mandatos terminológicos fuera de las 209 filas.

**Resultado `B13-OBL-02`: CONFORME — 3/3.**

---

### 16.5. B13-OBL-03 — Cobertura global por área primaria

La verificación se realiza por **columna `Área primaria`** del inventario de arquitectura, no por prefijo de sección ni por heurística textual.

| Área | Denominación resumida | Bloque | Arquitectura | Cubierto |
|---|---|---|---:|---:|
| `M-00` | reglas raíz / control terminológico | B-00 | 7 | 7 |
| `M-01` | identidad, perfil y cuenta | B-01 | 7 | 7 |
| `M-02` | perfil profesional, verificación y habilitación | B-02 | 14 | 14 |
| `M-03` | vínculo, consentimiento y autorización | B-03 | 17 | 17 |
| `M-04` | ciclo funcional del proceso | B-04 | 10 | 10 |
| `M-05` | capacidad y habilitación configurada | B-05 | 16 | 16 |
| `M-06` | versionado, snapshots, correcciones e historia común | B-06 | 31 | 31 |
| `M-07` | circuito nutricional | B-07 | 18 | 18 |
| `M-08` | circuito de entrenamiento | B-08 | 14 | 14 |
| `M-09` | antropometría transversal/publicación limitada | B-10 | 25 | 25 |
| `M-10` | revisión profesional/continuidad/pendientes | B-09 | 12 | 12 |
| `M-11` | proyecciones, cartera y longitudinalidad | B-11 | 16 | 16 |
| `M-12` | analítica y TVCC-30 | B-12 | 22 | 22 |
| **TOTAL** |  |  | **209** | **209** |

**Resultado `B13-OBL-03`: `209/209` — CONFORME.**

---

### 16.6. B13-OBL-04 — Correspondencia bloque↔área por denominación

El control no acepta coincidencia aritmética como prueba. Compara el **nombre/semántica del área** contra el bloque que la cubre.

| Bloque | Área exigida por canon | Denominación compatible | Resultado |
|---|---|---|---|
| B-00 | M-00 | control terminológico y reglas raíz | `OK` |
| B-01 | M-01 | identidad, perfil, cuenta/acceso | `OK` |
| B-02 | M-02 | perfil profesional, verificación, habilitación | `OK` |
| B-03 | M-03 | vínculo, consentimiento, autorización | `OK` |
| B-04 | M-04 | ciclo funcional del proceso | `OK` |
| B-05 | M-05 | capacidad/configuración | `OK` |
| B-06 | M-06 | versionado/correcciones/historia común | `OK` |
| B-07 | M-07 | nutrición | `OK` |
| B-08 | M-08 | entrenamiento | `OK` |
| B-09 | **M-10** | revisión y continuidad | `OK — H-D-01 APLICADO` |
| B-10 | **M-09** | antropometría | `OK — H-D-01 APLICADO` |
| B-11 | M-11 | proyecciones y cartera | `OK` |
| B-12 | M-12 | analítica / TVCC-30 | `OK` |

**Resultado `B13-OBL-04`: 13/13 — CONFORME.**

---

### 16.7. Continuidad y ausencia de colisión de identificadores

#### 16.7.1. Series normativas

La Entrega E no crea `T-06-*` nuevos. B-11 inicia después del máximo aprobado `REG-06-172 / INV-06-182`; B-12 continúa inmediatamente después de B-11.

| Familia | Rango/estado al cierre | Resultado |
|---|---|---|
| `T-06-01…71` | serie numérica vigente; Entrega E agrega 0 | `SIN COLISIÓN` |
| `T-06-N01…N19` | constructos raíz separados | `19/19` |
| `CONV-06-01…10` | convenciones raíz | `10/10` |
| `PROH-06-01…04` | prohibiciones raíz | `4/4` |
| `REG-06-01…201` | continuo; B-11=`173…185`, B-12=`186…201` | `201/201` |
| `INV-06-01…210` | continuo; B-11=`183…195`, B-12=`196…210` | `210/210` |

#### 16.7.2. Rango por bloque — control de colisión

| Bloque | REG definidos | INV definidos |
|---|---|---|
| B-00 | `01…10` | `01…10` |
| B-06 | `11…18` | `11…20` |
| B-01 | `19…30` | `21…34` |
| B-02 | `31…43` | `35…49` |
| B-03 | `44…63` | `50…70` |
| B-04 | `64…78` | `71…86` |
| B-05 | `79…96` | `87…105` |
| B-07/B-08 | `97…140` | `106…153` |
| B-09 | `141…150` | `154…165` |
| B-10 | `151…172` | `166…182` |
| B-11 | `173…185` | `183…195` |
| B-12 | `186…201` | `196…210` |

No existe solapamiento entre rangos definitorios y no aparece hueco interno en `REG` o `INV`.

**Resultado:** continuidad y colisión `CONFORME`.

---

### 16.8. Unicidad del inventario de deuda

La arquitectura contiene 209 IDs de deuda únicos y una única columna de área primaria por fila. El cierre exige simultáneamente:

1. 209 IDs únicos en arquitectura;
2. suma por áreas = 209;
3. cada bloque reclama exclusivamente las unidades de su área canónica;
4. B-09/B-10 usan la corrección nominal de ACTA-DIR-016;
5. M-11 y M-12 cubren exactamente 16 y 22 unidades respectivamente.

Dado ese conjunto de controles, una unidad no puede quedar simultáneamente sin área primaria ni cubierta por dos áreas primarias sin romper al menos uno de los detectores.

**Resultado:** `UNIDADES SIN ÁREA = 0` · `DUPLICACIÓN DE ÁREA PRIMARIA = 0`.

---

### 16.9. Fronteras globales preservadas

| Territorio | Propietario fuera de 06 | Estado de cierre |
|---|---|---|
| política de acceso, privacidad, retención, auditoría | 08 | `NO APROPIADO` |
| despliegue, proveedores/canales técnicos | 07 | `NO APROPIADO` |
| contratos/interfaces/API y serialización | 09 | `NO APROPIADO` |
| UI, layouts, gráficos, mapas, assets visuales | 10 | `NO APROPIADO` |
| instrumentos/estrategia y evidencia de pruebas | 11A/11B | `NO APROPIADO` |
| definición analítica canónica y fórmula TVCC-30 | 12 | `NO APROPIADO` |
| persistencia física | prohibida en 06 | `NO FIJADA` |

La presencia de una frontera resuelta explícitamente no se clasifica como deuda pendiente del 06.

---

### 16.10. Preguntas y hallazgos al cierre

```text
Q-003 → ESTACIONADA — PROPIETARIO 08
Q-004 → ESTACIONADA — PROPIETARIO 08
Q-005 → ESTACIONADA — PROPIETARIO 08
Q-008 → ESTACIONADA — PROPIETARIO 07
Q-007 → RESUELTA EN M-04, COORDINADA CON M-10
H-D-01 → CERRADO POR ACTA-DIR-016
```

No queda pregunta interna de 06 que impida completar su modelo de dominio. Las preguntas estacionadas pertenecen expresamente a documentos posteriores.

---

### 16.11. Verificación del protocolo de B-00

#### 16.11.1. Apertura/cierre por bloques

Los bloques B-01…B-12 declararon unidades, términos, máquinas cuando aplicaban y fronteras. B-11/B-12 mantienen ese protocolo y agregan cero términos recurrentes nuevos.

#### 16.11.2. Máquinas

No se detecta una máquina global paralela a las máquinas aprobadas. B-11 y B-12 no crean máquinas nuevas.

#### 16.11.3. Persistencia

Los bloques de Entrega E no fijan ORM, motor, tablas, columnas, claves, índices, esquemas físicos ni migraciones.

---

### 16.12. Autoverificación global falsable

| # | Control | Resultado | Condición de fallo |
|---:|---|---|---|
| 1 | `B13_OBL_01` | `OK 209/209` | falta clasificación unitaria, existe ID duplicado/sin área o una instanciación interna queda pendiente |
| 2 | `B13_OBL_02` | `OK 3/3` | T-06-06/07/08 carece de materialización M-01 |
| 3 | `B13_OBL_03` | `OK 209/209` | suma de áreas != 209 |
| 4 | `B13_OBL_04` | `OK 13/13` | bloque y área coinciden solo por cantidad pero no por denominación |
| 5 | `M11_16` | `OK` | M-11 != 16/16 |
| 6 | `M12_22` | `OK` | M-12 != 22/22 |
| 7 | `deuda_ids_unicos` | `OK 209` | arquitectura contiene ID de deuda duplicado |
| 8 | `sin_area` | `OK 0` | existe deuda sin área primaria |
| 9 | `doble_area` | `OK 0` | una deuda es reclamada por dos áreas primarias |
| 10 | `REG_continuos` | `OK 1…201` | hueco o colisión definitoria |
| 11 | `INV_continuos` | `OK 1…210` | hueco o colisión definitoria |
| 12 | `T_numeric` | `OK 1…71` | colisión o alta no controlada |
| 13 | `T_constructos` | `OK N01…N19` | falta/duplicado |
| 14 | `CONV` | `OK 01…10` | falta/duplicado |
| 15 | `PROH` | `OK 01…04` | falta/duplicado |
| 16 | `H_D_01` | `OK CERRADO` | B-09/M-10 o B-10/M-09 vuelve a invertirse |
| 17 | `Q007` | `OK RESUELTA` | B-12/B-13 redefine o reabre Q-007 |
| 18 | `TVCC_frontera` | `OK` | 06 fija fórmula canónica o versionado final de 12 |
| 19 | `ausentes_honestos` | `OK` | B-11/B-12 infieren o rellenan ausencias |
| 20 | `sin_score_global` | `OK` | B-11/B-12 califican globalmente al asesorado |
| 21 | `sin_UI` | `OK` | 06 fija representación visual concreta |
| 22 | `sin_08` | `OK` | 06 fija política de acceso/retención/auditoría |
| 23 | `sin_09` | `OK` | 06 fija contratos/serialización |
| 24 | `sin_persistencia` | `OK` | 06 fija modelo físico |
| 25 | `git_none` | `OK` | se ejecuta/autoriza Git |
| 26 | `ensamblado_no_anticipado` | `OK` | B-13 declara creado/canonizado el maestro sin acta separada |

#### 16.12.1. Historial real de cierre

```text
EJECUCIÓN 1
CONTROLES: 26
FALLOS REALES PUBLICADOS: 0
DETECTORES RELAJADOS: 0
RESULTADO: OK — DOCUMENTO 06 COMPLETO POR BLOQUES; PENDIENTE DE CONTRARREVISIÓN Y ACTA
```

---

### 16.13. Estado final propuesto de Entrega E

```text
ENTREGA E — CANDIDATA A APROBACIÓN

B-11 / M-11: 16/16
B-12 / M-12: 22/22
ENTREGA E: 38/38

COBERTURA GLOBAL: 209/209
ÁREAS: 13/13
BLOQUES DE MODELO: B-00…B-12 COMPLETOS
B-13: CIERRE GLOBAL EJECUTADO

B13-OBL-01: CONFORME 209/209 — PENDIENTE INTERNO 0
B13-OBL-02: CONFORME 3/3
B13-OBL-03: CONFORME 209/209
B13-OBL-04: CONFORME 13/13

REG: 01…201 — CONTINUOS
INV: 01…210 — CONTINUOS
T NUMÉRICOS: 01…71 — SIN ALTAS EN ENTREGA E
PROH: 01…04
CONV: 01…10

H-D-01: CERRADO
Q-007: RESUELTA
Q-003/Q-004/Q-005: 08
Q-008: 07

GIT: SIN OPERACIONES

SIGUIENTE PASO, SOLO TRAS ACTA:
1. CONTRARREVISIÓN DE ENTREGA E
2. APROBACIÓN DE DIRECCIÓN
3. ACTA SEPARADA PARA ENSAMBLADO MAESTRO
4. CONTRARREVISIÓN INTEGRAL DEL MAESTRO
5. ACTA SEPARADA PARA CANONIZACIÓN
```


---


## 17. Reglas transversales

*Fuente de gobierno: `DEC-045 — Reclasificación de patrones transversales como reglas TR`.*

Las reglas de esta sección no son recorridos actorales. Se materializan mediante estructuras, reglas e invariantes de los bloques propietarios y permanecen trazables hacia requisitos, casos de uso y pruebas.

### 17.1. TR-01 — Separación identidad–especialidad–habilitación–vínculo–consentimiento–autorización

Identidad, especialidad, capacidad, verificación, habilitación, vínculo, consentimiento y autorización permanecen diferenciados; una dimensión no sustituye ni concede automáticamente otra.

### 17.2. TR-02 — Autorización contextual en cada operación protegida

Cada operación protegida debe evaluarse en su contexto aplicable, considerando actor, especialidad o capacidad, situación, vínculo, consentimiento, finalidad y alcance vigentes.

### 17.3. TR-03 — Auditoría, autoría, versionado y preservación histórica

Las operaciones y estructuras relevantes preservan autoría, procedencia, doble temporalidad, versiones, correcciones y relaciones históricas sin sobrescritura silenciosa.

### 17.4. TR-04 — Procedencia y resiliencia frente a terceros

Toda incorporación externa o contingencia conserva fuente, proveedor cuando exista, fecha, intervención y procedencia; la indisponibilidad de un tercero no autoriza fabricar datos ni ocultar la contingencia.

### 17.5. TR-05 — Revocación efectiva

La revocación corta operaciones futuras dentro del alcance revocado sin borrar silenciosamente evidencia, versiones, autoría ni historia.

### 17.6. Aplicación y trazabilidad

- `TR-01…TR-05` no computan como casos de uso.
- No requieren máquina propia ni ficha actoral.
- Su materialización se verifica en los bloques propietarios y en la trazabilidad posterior.
- Documento 12 conserva la relación `RF ↔ TR ↔ UC ↔ prueba`.

---

## 18. Índice de trazabilidad

### 18.1. Cobertura por área y bloque

| Área | Denominación | Bloque propietario | Unidades | Sección maestra |
|---|---|---|---:|---:|
| `M-00` | control terminológico y reglas raíz | B-00 | 7 | `2` |
| `M-01` | identidad, perfil y cuenta | B-01 | 7 | `5` |
| `M-02` | perfil profesional, verificación y habilitación | B-02 | 14 | `6` |
| `M-03` | vínculo, consentimiento y autorización | B-03 | 17 | `7` |
| `M-04` | ciclo funcional del proceso | B-04 | 10 | `8` |
| `M-05` | capacidad y habilitación configurada | B-05 | 16 | `9` |
| `M-06` | versionado, snapshots, correcciones e historia común | B-06 | 31 | `4` |
| `M-07` | circuito nutricional | B-07 | 18 | `10` |
| `M-08` | circuito de entrenamiento | B-08 | 14 | `11` |
| `M-09` | antropometría transversal y publicación limitada | B-10 | 25 | `13` |
| `M-10` | revisión profesional válida, continuidad y pendientes | B-09 | 12 | `12` |
| `M-11` | proyecciones, cartera y longitudinalidad | B-11 | 16 | `14` |
| `M-12` | analítica y TVCC-30 | B-12 | 22 | `15` |

**Total:** `209/209` unidades.

### 18.2. Inventario unitario `DERIVAR 06` — 209/209

Este índice reproduce en forma compacta el inventario unitario ejecutado por B-13 y agrega la sección maestra del bloque propietario. La auditoría final vuelve a contar estas filas directamente sobre el maestro.

| Unidad | Área primaria | Bloque | Clase de cierre | Pendiente interno | Sección maestra |
|---|---|---|---|---:|---:|
| `7.1-01` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-02` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-03` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-04` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-05` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-07` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.1-11` | `M-00` | B-00 | `RÉGIMEN/CONVENCIÓN + INSTANCIACIÓN VERIFICADA` | `0` | `2` |
| `7.2-01` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-02` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-03` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-04` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-05` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-06` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.2-09` | `M-01` | B-01 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `5` |
| `7.3-01` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-02` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-03` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-04` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-05` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-06` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-07` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-08` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-09` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-10` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-11` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-12` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.3-14` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.13-01` | `M-02` | B-02 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `6` |
| `7.4-01` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-02` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-03` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-04` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-06` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-07` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-08` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-09` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-10` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-11` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.4-15` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.5-01` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.5-02` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.5-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.12-05` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.12-06` | `M-03` | B-03 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `7` |
| `7.2-07` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.3-13` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.4-13` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.4-14` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.5-03` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.5-06` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.8-05` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.8-08` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.16-05` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `DIR-06-03` | `M-04` | B-04 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `8` |
| `7.4-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.7-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.9-10` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-02` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-03` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-04` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-05` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-06` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-07` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-08` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-09` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-10` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-11` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.13-12` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `DIR-06-01` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `DIR-06-02` | `M-05` | B-05 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `9` |
| `7.1-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.2-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.5-04` | `M-06` | B-06 | `PATRÓN/FRONTERA RESUELTA — SIN PENDIENTE INTERNO` | `0` | `4` |
| `7.6-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.7-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.7-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.7-11` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.7-17` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.8-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.8-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.8-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.9-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-06` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-07` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-09` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-10` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.10-11` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.11-13` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.11-15` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.11-21` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.11-22` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.12-04` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.15-05` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-01` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-02` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-03` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-04` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-07` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-08` | `M-06` | B-06 | `PATRÓN COMÚN + INSTANCIACIÓN VERIFICADA` | `0` | `4` |
| `7.16-09` | `M-06` | B-06 | `PATRÓN/FRONTERA RESUELTA — SIN PENDIENTE INTERNO` | `0` | `4` |
| `7.6-01` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-02` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-03` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-04` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-05` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-06` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.6-07` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-01` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-02` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-03` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-04` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-05` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-06` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-07` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-08` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-13` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-14` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.7-15` | `M-07` | B-07 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `10` |
| `7.9-01` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-02` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-03` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-04` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-05` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-06` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-07` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-08` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.9-11` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.10-01` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.10-02` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.10-03` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.10-04` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.10-05` | `M-08` | B-08 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `11` |
| `7.1-08` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.1-09` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-01` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-02` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-03` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-04` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-05` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-06` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-07` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-08` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-09` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-10` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-11` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-12` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-14` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-16` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-17` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-18` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-19` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-20` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.11-23` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.12-01` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.12-02` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.12-03` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.12-07` | `M-09` | B-10 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `13` |
| `7.7-16` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-01` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-02` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-03` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-04` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-07` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.8-11` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.9-12` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.14-02` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.14-03` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.14-04` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.14-05` | `M-10` | B-09 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `12` |
| `7.1-10` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.14-01` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.14-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.14-07` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.14-08` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-01` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-02` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-03` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-04` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-07` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-08` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-09` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-10` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.15-11` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.16-06` | `M-11` | B-11 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `14` |
| `7.17-01` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | `0` | `15` |
| `7.17-02` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-03` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-04` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-05` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-06` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | `0` | `15` |
| `7.17-07` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-08` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-09` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-10` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-11` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-12` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-13` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-14` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-15` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-16` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-17` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-18` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-19` | `M-12` | B-12 | `SUSTANTIVA_EN_PROPIETARIO` | `0` | `15` |
| `7.17-20` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | `0` | `15` |
| `7.17-21` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | `0` | `15` |
| `DIR-06-04` | `M-12` | B-12 | `COMPONENTE 06 + FRONTERA VINCULANTE CON DOCUMENTO 12` | `0` | `15` |

### 18.3. Obligaciones de cierre B-13

| Obligación | Verificación en el maestro | Resultado |
|---|---|---|
| `B13-OBL-01` | 209 unidades clasificadas individualmente; pendiente interno = 0 | `CONFORME` |
| `B13-OBL-02` | `T-06-06`, `T-06-07`, `T-06-08` tratados sin inventar deuda adicional | `CONFORME 3/3` |
| `B13-OBL-03` | suma por columna de área primaria | `CONFORME 209/209` |
| `B13-OBL-04` | correspondencia bloque↔área por denominación | `CONFORME 13/13` |

### 18.4. Continuidad de familias de identificadores

| Familia | Rango vigente al cierre | Estado esperado |
|---|---|---|
| `REG` | `REG-06-01…201` | continuo, sin huecos |
| `INV` | `INV-06-01…210` | continuo, sin huecos |
| `T` numérico | `T-06-01…71` | continuo |
| `T` constructos | `T-06-N01…N19` | completo |
| `CONV` | `CONV-06-01…10` | completo |
| `PROH` | `PROH-06-01…04` | completo |

### 18.5. Contrato vinculante de proyecciones — ACTA-DIR-015 §5

Las denominaciones de esta tabla reproducen literalmente el contrato vinculante. La columna de sección remite a la materialización aprobada en B-11; no se reescribe el bloque fuente.

| # | Denominación contractual exacta | Sección B-11 en el maestro |
|---:|---|---:|
| 1 | Volumen por ejercicio y período | `14.7.1` |
| 2 | Volumen por Zona muscular y período | `14.7.2` |
| 3 | Volumen efectivo frente a volumen total | `14.7.3` |
| 4 | Progresión de carga, de repeticiones y de RIR por ejercicio | `14.7.4` |
| 5 | Marcas personales por ejercicio | `14.7.5` |
| 6 | Distribución de trabajo por Zona en un período (mapa de intensidad) | `14.7.6` |
| 7 | Evolución antropométrica longitudinal | `14.7.7` |
| 8 | Contraste prescrito frente a consumido | `14.7.8` |

---

## 19. Apéndice — Historial consolidado de cambios

Este apéndice reúne los changelogs retirados del cuerpo normativo durante el ensamblado. Las referencias históricas conservan valor documental y no reabren versiones superadas.

### 19.1. B-00 — Control terminológico y reglas raíz

*Fuente histórica: `BE_LEG_06_B00_v0_2_1_CONTROL_TERMINOLOGICO_Y_REGLAS_RAIZ.md`.*

**Changelog v0.2:** fusión controlada de v0.1 principal y v0.1-C conforme a D1–D12; incorporación de D13; actualización de custodia tras cierre de G2; reintroducción segura de citas del 03 desde archivo exacto; sin cambio de producto aprobado y sin operación Git.

**Changelog v0.2.1:** corrección post-contrarrevisión sin cambio semántico de producto: se aporta evidencia verificable de custodia G2 mediante ACTA-DIR-008 + informe de canonización; se reemplazan en §5 las tres apariciones accidentales de vocabulario documental (`columna`, `índice`, `índice`) por formulaciones neutras; D1–D13, T-06-46 y REG-06-03/REG-06-10 permanecen sin alteración.

---

### 19.2. Arquitectura del modelo de dominio

*Fuente histórica: `BE_LEG_06_v0_1_1_ARQUITECTURA_CORREGIDA.md`.*

#### 19.2.1. Changelog v0.1 → v0.1.1

| Cambio | Motivo | Resultado |
|---|---|---|
| `CH-06-ARQ-01` — Reescritura de `H-06-ARQ-01` y ajuste de procedencia en §3 | La v0.1 afirmó una numeración de `03_Modelo_de_Negocio.md` que no estaba localmente verificada y resultó falsa. | Se elimina `03 §9 = Capacidad`; se registra la numeración canónica informada por la contrarrevisión (`§9 Posicionamiento`, `§14 Capacidad y asesorado activo`, `§15 Cuenta del asesorado`, `§22 Ingresos`, `§23 Costos y sostenibilidad`), sus hashes de procedencia y la imposibilidad de reverificación local por ausencia de copia canónica legible. |
| `CH-06-ARQ-02` — Reordenamiento de bloques | §7 declara `M-02 → M-06`, pero en v0.1 `B-02` precedía a `B-06`. | Se elige la opción de **mover B-06 a la posición 2**, inmediatamente después de B-00. B-06 depende solo de M-00 y queda definido antes de B-02, de modo que la evidencia versionada de M-02 reutiliza el patrón común ya establecido. B-01 pasa a posición 3; B-02 a 4; B-03/B-04/B-05 a 5/6/7. |
| `CH-06-ARQ-03` — Actualización de gate/estado de salida | La contrarrevisión externa de v0.1 ya ocurrió y fue tratada. | v0.1.1 queda `BORRADOR`, pendiente únicamente de aprobación explícita de dirección para habilitar B-00. P-01 y P-02 permanecen pendientes y no se realizó Git. |

**Sin cambios de alcance:** se preservan `M-00…M-12`, las 209 unidades de cobertura, los 209 IDs únicos, la distribución por área, los criterios de cierre, el tratamiento de Q-003/Q-004/Q-005 y Q-007, los riesgos R-06-01…R-06-09, las autoverificaciones 1–11 y H-06-ARQ-02. No se incorporan diagramas, atributos exhaustivos ni máquinas de estados.

---

### 19.3. B-06 — Versionado, instantáneas, correcciones e historia común

*Fuente histórica: `BE_LEG_06_B06_v0_1_1_VERSIONADO_SNAPSHOTS_CORRECCIONES_E_HISTORIA_COMUN.md`.*

**Changelog v0.1:** primera instanciación del patrón común M-06 posterior al cierre de B-00; define Versión, Instantánea reproducible, Corrección trazable, sucesión, cadena, vista efectiva, doble temporalidad, autoría/procedencia e invariantes históricas; traza las 31 unidades primarias de M-06 y coordina `7.16-05/06` sin invadir sus propietarios.

**Changelog v0.1.1:** corrección menor posterior a contrarrevisión externa, sin cambio de alcance ni del patrón arquitectónico:
1. normaliza `REG-06-11…18` al formato canónico de identificadores de B-00;
2. elimina una categoría efectiva no definida y remite cualquier condición efectiva adicional al área propietaria;
3. declara las bifurcaciones de versiones no admitidas como `no resolubles automáticamente`, prohibiendo selección silenciosa por fecha/orden de registro;
4. unifica `7.16-09` como `RESUELTA COMO FRONTERA` en §11.1 y §11.2.
La diferenciación opcional de grados de cobertura en las restantes filas de §11.1 se difiere deliberadamente para B-13 o una revisión posterior, a fin de no ampliar esta corrección menor.

---

### 19.4. B-01 — Identidad, perfil y ciclo de cuenta

*Fuente histórica: `BE_LEG_06_B01_v0_1_IDENTIDAD_PERFIL_Y_CICLO_DE_CUENTA.md`.*

**Changelog v0.1:** primera instanciación de `M-01` posterior a la aprobación de B-06; define Identidad BE, Perfil propio versionado, relación con métodos de acceso, máquina del Estado operativo de cuenta, cierre no destructivo, recuperación neutral, ciclo mínimo de Incidencia administrativa, estructura de Novedad interna y referencia de Notificación push no sensible; cubre `7.2-01…06` y `7.2-09`, coordina `7.2-07/08`, y registra sin ocultamiento la ausencia de unidades exactas para `T-06-06/07/08`.

---

### 19.5. B-02 — Perfil profesional, verificación y habilitación

*Fuente histórica: `BE_LEG_06_B02_v0_1_1_PERFIL_PROFESIONAL_VERIFICACION_Y_HABILITACION.md`.*

**Changelog v0.1:** primera definición de M-02; cobertura originalmente declarada `13/13`.

**Changelog v0.1.1:** corrige `A-BLOQ-01`. La cobertura primaria se recalcula por columna `Área primaria` sobre las 209 unidades de arquitectura; incorpora `7.13-01` y deja M-02 en `14/14`. No rediseña Habilitación: hace explícita su separación de Verificación mediante §6.1, `REG-06-33` e `INV-06-45`.

---

### 19.6. B-03 — Vínculo, consentimiento y autorización contextual

*Fuente histórica: `BE_LEG_06_B03_v0_1_1_VINCULO_CONSENTIMIENTO_Y_AUTORIZACION.md`.*

**Changelog v0.1:** primera definición de M-03; cobertura originalmente declarada `12/12`.

**Changelog v0.1.1:** corrige `A-BLOQ-01`. La cobertura primaria se recalcula por columna `Área primaria` sobre las 209 unidades de arquitectura; incorpora `7.5-01`, `7.5-02`, `7.5-05`, `7.12-05` y `7.12-06`, dejando M-03 en `17/17`. Las tres unidades 7.5 hacen trazable comportamiento ya existente. `7.12-05/06` agregan la referencia estructural al origen de descubrimiento antropométrico y su caducidad coordinada sin apropiarse de la publicación M-09 ni de la política de 08.

---

### 19.7. B-04 — Ciclo funcional del proceso

*Fuente histórica: `BE_LEG_06_B04_v0_1_CICLO_FUNCIONAL_DEL_PROCESO.md`.*

**Changelog v0.1:** primera definición de M-04; fija Proceso nuevo/abierto/vigente/cerrado, máquina y Q-007 mediante `ContinuidadOCierreAplicado`.

---

### 19.8. B-05 — Capacidad y habilitación configurada

*Fuente histórica: `BE_LEG_06_B05_v0_1_CAPACIDAD_Y_HABILITACION_CONFIGURADA.md`.*

**Changelog v0.1:** primera definición de M-05; Habilitación configurada, capacidad global, no banda = sin límite, conteo deduplicado, gracia, admisión proyectada y exceso no destructivo.

---

### 19.9. B-07 — Circuito nutricional

*Fuente histórica: `BE_LEG_06_B07_v0_1_2_CIRCUITO_NUTRICIONAL.md`.*

**Changelog v0.1:** define M-07 y la estructura espejo reutilizable por M-08; cubre evaluación, objetivo, catálogo/importación, plan versionado, activación/snapshot, ejecución/adherencia y continuidad.  
**Changelog v0.1.1:** por `ACTA-DIR-014`/`DEC-046`, agrega jerarquía interna nutricional, tres modalidades de prescripción/registro, Estado de preparación obligatorio, Objetivo estructurado como decisión profesional, Atributos nutricionales extendidos con índice glucémico, carga glucémica diferida y contraste descriptivo; registra altas terminológicas; instancia B-06 sin redefinirlo; conserva `18/18`, reglas aprobadas y cero Git.

**Changelog v0.1.2:** incorpora exclusivamente Evidencia visual opcional de ingesta, Recurso didáctico licenciado y versionado, y política de ámbito/accumulación de recursos visuales conforme a `ACTA-DIR-015 §4`; no altera reglas aprobadas, cobertura ni fronteras documentales y no modela proyecciones de B-11.

---

### 19.10. B-08 — Circuito de entrenamiento

*Fuente histórica: `BE_LEG_06_B08_v0_1_2_CIRCUITO_ENTRENAMIENTO.md`.*

**Changelog v0.1:** instancia sin duplicación el patrón de B-07 y desarrolla únicamente las diferencias legítimas del circuito de entrenamiento.  
**Changelog v0.1.1:** por `ACTA-DIR-014`/`DEC-046`, agrega Microciclo opcional, propósito libre de Bloque/Microciclo, criterio de intensidad `PORCENTAJE_RM|RIR`, Esfuerzo percibido solo como dato de ejecución, Sustitución de ejercicio, Condición de sesión y Granularidad de registro; registra altas terminológicas; instancia B-06 sin redefinirlo; conserva `14/14`, condición espejo y cero Git.

**Changelog v0.1.2:** incorpora Catálogo versionado de Zonas musculares, relación Ejercicio–Zona con rol, Serie ejecutada estructurada y recursos didácticos licenciados; mantiene la condición espejo, preserva `REG-06-129/132`, no modela proyecciones y no altera cobertura ni reglas aprobadas.

---

---

## 20. Parche transversal v0.1.1 — CAP-MET, CAP-DAT, ANT-DRAFT y ANT-VOID

> **Naturaleza:** `ADICIÓN NORMATIVA POST-BASELINE`  
> **Autorización:** `ACTA-DIR-023`  
> **Fuente RF:** BE-LEG-04 v0.4.2.1 · SHA-256 `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b`  
> **Fuente UC:** BE-LEG-05 v0.15 · SHA-256 `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf`  
> **Auditoría de impacto:** v0.2.1 · SHA-256 `454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`  
> **Regla de precedencia interna:** esta sección amplía o especializa únicamente los puntos que identifica de forma expresa. Todo el resto de BE-LEG-06 v0.1 permanece vigente como baseline.

### 20.1. Control de alcance

Este parche resuelve exclusivamente:

```text
CAP-MET
→ soporte metodológico profesional reproducible

CAP-DAT
→ solicitud/respuesta estructurada pertinente

ANT-DRAFT
→ evaluación antropométrica en preparación

ANT-VOID
→ anulación antropométrica trazable
```

No modifica:

- áreas `M-00…M-12`;
- la matriz original `209/209`;
- B-06;
- arquitectura 07;
- políticas de 08;
- contratos de 09;
- UI de 10.

Los nuevos elementos son **deuda posterior a la baseline**, originada por `RF-070`, `RF-071` y la reparación downstream de `RF-050`.

---

### 20.2. Altas terminológicas del parche

| ID | Término | Definición de dominio | Instanciación / frontera |
|---|---|---|---|
| `T-06-72` | Método profesional versionado | Especificación de cálculo seleccionable para una finalidad profesional; posee identidad estable y versiones inmutables, declara inputs requeridos/admisibles y salida reproducible. | Instancia `T-06-N12`; fórmulas concretas son contenido técnico/profesional, no metodología universal fijada por BE. |
| `T-06-73` | Ejecución de cálculo reproducible | Hecho de ejecutar una versión exacta de método con un conjunto exacto de inputs/procedencias, produciendo un resultado reconstruible. | Transversal; especialización antropométrica conserva `T-06-34`. |
| `T-06-74` | Referencia profesional adoptada | Relación explícita por la que un profesional adopta una Ejecución como referencia de apoyo dentro de un contexto; no altera la Ejecución ni equivale a decisión profesional. | Nutrición/Entrenamiento/Antropometría cuando corresponda. |
| `T-06-75` | Plantilla BE versionada de solicitud | Estructura controlada y versionada de secciones/campos, tipos/unidades y categorías admitidas para una finalidad. | CAP-DAT; builder libre P0 queda fuera. |
| `T-06-76` | Solicitud estructurada de información | Pedido de un profesional a un asesorado que referencia finalidad, alcance y versión exacta de plantilla. | Autorización/política fina → 08. |
| `T-06-77` | Respuesta estructurada autoinformada | Respuesta del asesorado relacionada con una solicitud y plantilla/version; su procedencia es `SELF_REPORTED`. | `SELF_REPORTED ≠ medición ≠ diagnóstico`. |
| `T-06-78` | Evaluación antropométrica en preparación | Evaluación M-09 aún no registrada como evaluación final; puede contener trabajo parcial sin adquirir autoridad histórica/longitudinal. | Materializa `UC-P19 V04`. |
| `T-06-79` | Anulación antropométrica | Evento/condición local M-09 que declara una Medición directa como no efectiva para usos posteriores sin borrar el original. | Instancia `REG-06-16`, inciso 4; no es categoría global M-06. |

Ninguno de estos términos renumera o reinterpreta `T-06-01…71`.

---

### 20.3. CAP-MET — extensión transversal de `T-06-N12`

#### 20.3.1. Regla raíz preservada

`T-06-N12 — Regla de cálculo` continúa siendo el constructo raíz:

```text
entradas identificadas por versión
+ especificación versionada
→ resultado reproducible
```

CAP-MET **no crea una segunda definición**. `T-06-72…74` son estructuras que materializan ese mismo patrón para uso profesional transversal.

**`REG-06-202` — `T-06-N12` es el único patrón transversal de cálculo reproducible.**

Toda vertical que ofrezca cálculo profesional de apoyo debe instanciar `T-06-N12`. Una especialización puede agregar semántica propia, pero no redefinir:

- versionado;
- reconstruibilidad;
- preservación histórica;
- separación resultado/decisión.

`T-06-34` permanece como especialización antropométrica.

#### 20.3.2. Método y versión

**`REG-06-203` — Método profesional con identidad estable y versión inmutable.**

Un `T-06-72` conserva, como mínimo conceptual:

```text
methodId
versionId
finalidad/dominio compatible
estado de seleccionabilidad
inputs requeridos
tipos/procedencias admisibles
tipo/unidad de salida
regla de precisión/redondeo cuando corresponda
procedencia/referencia técnica
```

Una versión publicada no se muta retrospectivamente. Un cambio metodológico crea una versión sucesora.

`estado de seleccionabilidad` permite distinguir al menos:

```text
SELECCIONABLE
HISTÓRICO_NO_SELECCIONABLE
```

sin eliminar versiones históricas.

BE no fija una fórmula profesional universal por el hecho de soportar una especificación.

#### 20.3.3. Admisibilidad de inputs

**`REG-06-204` — Disponibilidad no equivale a admisibilidad.**

Cada versión de Método declara qué tipos de input y qué procedencias son admisibles.

```text
dato disponible
+ tipo compatible
+ procedencia admisible
= input utilizable
```

Si falta un input obligatorio o su procedencia no es admisible, no existe una Ejecución válida.

Un dato `SELF_REPORTED` puede ser admisible para un método y no para otro. Un dato importado puede ser admisible sin convertirse en medición directa.

#### 20.3.4. Ejecución reproducible

**`REG-06-205` — Ejecución de cálculo como hecho histórico independiente.**

Cada `T-06-73` conserva:

- versión exacta del Método;
- finalidad/contexto;
- actor profesional;
- conjunto exacto de inputs efectivos;
- procedencia/referencia de cada input;
- resultado;
- unidad;
- precisión/redondeo aplicados;
- ocurrencia/registro;
- estado de éxito/error cuando corresponda.

Varias Ejecuciones pueden coexistir para la misma finalidad.

No se permite:

- sobrescribir una corrida previa;
- promediar resultados silenciosamente;
- declarar un ganador automático;
- reconstruir pasado con una versión metodológica nueva.

#### 20.3.5. Sugerencia metodológica

**`REG-06-206` — Sugerencia metodológica no posee autoridad decisoria.**

Si BE produce una sugerencia sobre métodos aplicables:

- debe ser distinguible de la lista completa de métodos seleccionables;
- debe conservar fundamento suficiente para su trazabilidad cuando se persista;
- no ejecuta un método por sí sola;
- no adopta una referencia;
- no modifica objetivo, evaluación, requerimiento, prescripción o plan.

No se exige una entidad persistente `Sugerencia` en P0. Si 09/10 requieren persistirla, la persistencia deberá conservar esta separación.

#### 20.3.6. Referencia profesional adoptada

**`REG-06-207` — Adoptar una referencia es una relación, no una mutación del resultado.**

`T-06-74` conserva:

```text
profesional
Ejecución referenciada
finalidad/contexto
momento de adopción
fundamento opcional/relación con decisión posterior
```

La adopción:

- no modifica la Ejecución;
- no borra otras Ejecuciones;
- no convierte el resultado en verdad universal;
- no crea objetivo/prescripción;
- puede ser sucedida por otra referencia mediante historia, sin overwrite.

#### 20.3.7. Reconciliación con `DEC-046` / `INV-06-133`

**`REG-06-208` — Método soportado por BE no equivale a fórmula propia impuesta por BE.**

Para Nutrición y Entrenamiento:

```text
profesional
→ elige método
→ BE ejecuta
→ profesional puede adoptar referencia
→ profesional decide objetivo/prescripción
```

Nunca:

```text
BE elige autónomamente fórmula
→ calcula requerimiento/objetivo
→ actualiza plan sin acto profesional
```

`INV-06-133` permanece íntegro y gobierna CAP-MET.

Una Versión de Objetivo de M-07/M-08 puede **referenciar** cero o más Ejecuciones y, opcionalmente, una Referencia profesional adoptada como fundamento. Esa relación no convierte la Ejecución en autoridad de escritura.

---

### 20.4. CAP-DAT — plantilla, solicitud y respuesta

#### 20.4.1. Modelo mínimo

CAP-DAT parte de tres agregados/estructuras principales:

```text
Plantilla BE versionada
Solicitud estructurada
Respuesta estructurada autoinformada
```

Las definiciones de campo y las respuestas por campo son inicialmente **partes internas** de la plantilla/respuesta. Solo se elevan a entidad si aparece identidad o ciclo de vida independiente demostrado.

#### 20.4.2. Plantilla BE versionada

**`REG-06-209` — Plantilla de solicitud con versión inmutable.**

`T-06-75` conserva:

- identidad estable de plantilla;
- versión;
- finalidad/es compatibles;
- secciones/campos;
- tipo de dato;
- unidad cuando corresponda;
- categoría de dato;
- requerido/opcional permitido;
- reglas de validación estructural;
- estado de seleccionabilidad.

Una solicitud referencia una versión exacta. Editar una plantilla crea una versión sucesora y no reinterpreta solicitudes/respuestas históricas.

P0 no modela un builder libre arbitrario. Las plantillas son estructuras BE controladas/versionadas.

#### 20.4.3. Solicitud estructurada

**`REG-06-210` — Solicitud request-driven y trazable.**

`T-06-76` conserva:

```text
requestId
profesional solicitante
asesorado
contexto/vínculo de referencia
finalidad
alcance
templateVersion
subconjunto de secciones/campos cuando sea permitido
requerido/opcional efectivo
fecha de solicitud
estado funcional
```

Estados mínimos:

```text
PENDIENTE
RESPONDIDA
```

La existencia o estado de la Solicitud **no concede acceso**. La consultabilidad efectiva se deriva de autorización vigente conforme a 08.

La Solicitud no es consentimiento y no modifica por sí sola vínculo/alcance.

#### 20.4.4. Respuesta autoinformada

**`REG-06-211` — Respuesta vinculada a request/template exactos.**

`T-06-77` conserva:

- requestId;
- templateVersion;
- asesorado;
- respuestas estructuradas;
- unidad cuando corresponda;
- procedencia `SELF_REPORTED`;
- momento de envío;
- autoría/ocurrencia/registro;
- referencia a versión/respuesta anterior cuando existe rectificación.

Una Respuesta enviada no se sobrescribe silenciosamente.

La rectificación produce una versión/respuesta sucesora y preserva la anterior conforme al patrón histórico de B-06, sin crear una máquina de corrección paralela.

#### 20.4.5. Perfil propio y procedencia

**`REG-06-212` — Reutilizar un dato de perfil no fusiona actos ni procedencias.**

Cuando `UC-P33` reutiliza o confirma un dato de `UC-P25`:

- la Respuesta conserva referencia a la versión/origen del dato reutilizado cuando corresponda;
- la Respuesta sigue siendo un acto `SELF_REPORTED` dentro de una Solicitud;
- actualizar Perfil propio y responder Solicitud permanecen actos distintos;
- un valor igual no autoriza deduplicar historia como si ambos orígenes fueran el mismo hecho.

#### 20.4.6. Frontera de autorización

**`REG-06-213` — Estado de formulario ≠ autorización efectiva.**

Una Solicitud `PENDIENTE` o una Respuesta histórica pueden seguir existiendo aunque el profesional ya no tenga acceso.

06 conserva estructura e historia. 08 decide:

- categorías/pertinencia;
- consentimiento B2/PDP;
- visibilidad;
- acceso tras pausa/finalización;
- retención.

Ningún consumidor puede usar el estado del formulario como sustituto del PDP.

---

### 20.5. ANT-DRAFT — Evaluación antropométrica en preparación

#### 20.5.1. Máquina local de evaluación

**`REG-06-214` — Evaluación antropométrica distingue preparación y registro.**

La Evaluación antropométrica de `REG-06-151` incorpora estados técnicos locales:

```text
EN_PREPARACION
REGISTRADA
```

Reglas:

1. `EN_PREPARACION` puede conservar contenido parcial.
2. `EN_PREPARACION` no es una Evaluación registrada.
3. Solo `REGISTRADA` participa como Evaluación confirmada en historial/evolución.
4. La transición:
   ```text
   EN_PREPARACION → REGISTRADA
   ```
   requiere acto explícito de registro y validaciones aplicables.
5. Una Evaluación `REGISTRADA` no vuelve a `EN_PREPARACION`; cambios posteriores usan corrección/anulación.
6. La autorización para retomar se reevalúa conforme a 08/09.

Este estado local no crea un Plan antropométrico.

#### 20.5.2. Contenido provisional

**`REG-06-215` — Datos/cálculos de preparación no adquieren autoridad histórica por persistirse.**

Una Evaluación `EN_PREPARACION` puede conservar:

- mediciones parciales;
- procedencia;
- protocolo en preparación;
- cálculos de apoyo ejecutados en contexto de preparación;
- metadatos de concurrencia/versionado de trabajo.

Pero:

- no alimenta Serie longitudinal;
- no aparece como última Evaluación registrada;
- no crea resultado antropométrico confirmado para el asesorado;
- una Ejecución realizada en preparación conserva `contexto = PREPARACION` y no se vuelve histórica/efectiva por sí sola.

Al registrar la Evaluación, 06 exige que los datos/resultados confirmados queden relacionados explícitamente con la Evaluación `REGISTRADA`; 09 definirá la operación/contrato exactos.

#### 20.5.3. Concurrencia y pérdida de autorización

**`REG-06-216` — Retomar borrador exige versión de trabajo vigente y autorización actual.**

Una Evaluación en preparación debe permitir detectar que el contenido cambió desde la última lectura. El mecanismo físico pertenece a 09/persistencia, pero el dominio exige una versión/revisión conceptual de trabajo.

Si la autorización deja de ser válida:

- el borrador no puede retomarse como si la autorización continuara;
- su existencia no concede lectura;
- 08 gobierna visibilidad/retención;
- no se transforma automáticamente en `REGISTRADA`.

No se incorpora un estado `EXPIRADA` o `DESCARTADA` sin comportamiento aprobado adicional.

---

### 20.6. ANT-VOID — Anulación antropométrica local M-09

#### 20.6.1. Condición efectiva local

**`REG-06-217` — Medición antropométrica posee condición efectiva local.**

Después de resolver su cadena de Corrección trazable conforme a B-06, una Medición antropométrica directa puede poseer en M-09:

```text
VIGENTE
ANULADA
```

Esta condición instancia **`REG-06-16`, inciso 4**:

- pertenece exclusivamente a M-09;
- no es estado global de Corrección;
- no redefine B-06;
- no borra original/correcciones.

Una Medición sin evento de anulación está `VIGENTE`.

#### 20.6.2. Evento de anulación

**`REG-06-218` — Anulación como evento aditivo.**

`T-06-79` conserva:

```text
medición objetivo
actor
momento
motivo
procedencia
referencia a condición efectiva anterior
```

Al confirmarse:

```text
VIGENTE → ANULADA
```

El valor original y toda la cadena previa permanecen reconstruibles.

En v0.1.1 la anulación es **terminal como condición efectiva**:

- no existe transición `ANULADA → VIGENTE`;
- una reversión requeriría comportamiento/RF/UC explícito futuro;
- una nueva toma se modela como nueva Medición, no como reactivación de la anulada.

Esto evita inventar una “desanulación” no aprobada.

#### 20.6.3. Corrección y anulación no se confunden

**`REG-06-219` — Corrección cambia vista de valor; anulación cambia condición de efectividad.**

```text
CORRECCION
→ B-06 / UC-I12
→ conserva cadena
→ puede producir nuevo valor efectivo

ANULACION
→ M-09 / UC-E03
→ conserva cadena completa
→ condición efectiva = ANULADA
```

Una Medición `ANULADA` no admite una nueva Corrección destinada a volverla efectiva. Si existe una nueva observación válida, debe registrarse como nueva Medición.

#### 20.6.4. Dependencias y cálculos derivados

**`REG-06-220` — Input anulado obliga a reevaluar dependencias.**

Cuando una Medición pasa a `ANULADA`:

1. el grafo de `REG-06-159` identifica Cálculos dependientes;
2. los resultados históricos previos permanecen preservados;
3. esos resultados no pueden seguir presentándose silenciosamente como derivados efectivos de inputs vigentes;
4. si existen inputs válidos suficientes y la regla de dominio permite nueva Ejecución, se emite una nueva corrida;
5. si faltan inputs obligatorios, no se inventa resultado sucesor;
6. la ausencia efectiva resultante se representa como ausencia, nunca como cero.

No se reescribe un Cálculo histórico.

#### 20.6.5. Evolución y comparabilidad

**`REG-06-221` — Anulación preserva hecho histórico pero excluye valor no efectivo de la serie válida.**

Una Medición anulada:

- permanece visible como hecho histórico según autorización;
- conserva su evento/motivo;
- no aporta un punto `REGISTRADO` efectivo a la Serie longitudinal;
- si no existe un reemplazo válido, el checkpoint/métrica efectivo queda `SIN_DATO`;
- no se interpola ni se conserva por arrastre un valor derivado inválido;
- los históricos calculados a partir de ella pueden consultarse como históricos limitados, pero no como continuidad homogénea vigente.

`REG-06-165…168` continúan aplicando.

---

### 20.7. Integración por vertical

#### 20.7.1. Nutrición — M-07

El Objetivo nutricional de `REG-06-123` puede relacionarse con:

```text
0..N Ejecuciones de cálculo
0..1 Referencia profesional adoptada
```

como fundamento de apoyo.

**La relación no altera `INV-06-133`.**

El requerimiento/objetivo sigue siendo decisión profesional versionada.

#### 20.7.2. Entrenamiento — M-08

Una Evaluación/Objetivo de entrenamiento puede relacionarse con:

```text
0..N Ejecuciones de cálculo
0..1 Referencia profesional adoptada
```

cuando el profesional utilice métodos de apoyo.

La referencia no impone criterio de intensidad, objetivo ni plan.

#### 20.7.3. Antropometría — M-09

`REG-06-156…158` continúan siendo la especialización antropométrica de CAP-MET:

```text
T-06-N12
→ T-06-72 / T-06-73
→ T-06-34 / REG-06-156…158
```

Una Ejecución antropométrica agrega:

- mediciones directas;
- protocolo;
- dependencias;
- unidades;
- comparabilidad propia.

No se crea otro motor conceptual.

---

### 20.8. Invariantes nuevos del parche

| ID | Invariante | Se viola cuando |
|---|---|---|
| `INV-06-211` | `T-06-N12` es la única definición transversal de cálculo reproducible. | una vertical crea otro patrón incompatible de método/inputs/resultado. |
| `INV-06-212` | Método soportado por BE no equivale a fórmula propia impuesta ni a objetivo automático. | BE genera autónomamente requerimiento/objetivo/prescripción. |
| `INV-06-213` | Una Ejecución conserva método/versión/inputs/procedencia/resultado y no sobrescribe otra. | una corrida no puede reconstruirse o reemplaza historia. |
| `INV-06-214` | Disponibilidad de dato no equivale a admisibilidad metodológica. | un método consume input solo porque existe. |
| `INV-06-215` | Sugerencia, selección, Ejecución, Referencia adoptada y decisión son actos distinguibles. | cualquiera se convierte silenciosamente en el siguiente. |
| `INV-06-216` | Plantilla histórica se interpreta con su versión exacta. | editar plantilla reinterpreta requests/respuestas previas. |
| `INV-06-217` | Solicitud no es consentimiento ni autorización. | request/status amplía acceso o B2. |
| `INV-06-218` | Respuesta de asesorado conserva `SELF_REPORTED`. | se etiqueta como medición/diagnóstico/observación profesional. |
| `INV-06-219` | Perfil propio y respuesta solicitada pueden compartir valor sin compartir acto/procedencia. | se fusionan silenciosamente como un único origen. |
| `INV-06-220` | `EN_PREPARACION ≠ REGISTRADA`. | un borrador alimenta historia/evolución confirmada. |
| `INV-06-221` | Solo una Evaluación `REGISTRADA` aporta resultados antropométricos confirmados. | un cálculo provisional aparece como histórico confirmado. |
| `INV-06-222` | `ANULADA ≠ BORRADA`. | anular elimina original, cadena o evento. |
| `INV-06-223` | La anulación antropométrica es condición local M-09 y no redefine B-06. | se crea un estado global de corrección/anulación. |
| `INV-06-224` | Input anulado no mantiene derivados como vigentes por inercia. | un cálculo dependiente sigue efectivo sin reevaluación. |
| `INV-06-225` | Anulación no convierte ausencia efectiva en cero ni inventa reemplazo. | se rellena un checkpoint por cero/interpolación/carry-forward. |
| `INV-06-226` | En v0.1.1 no existe reversión implícita de una anulación. | `ANULADA → VIGENTE` ocurre sin comportamiento futuro aprobado. |

---

### 20.9. Correspondencia con RF y UC del parche

| Frente | RF | UC 05 | Resolución 06 |
|---|---|---|---|
| CAP-MET | `RF-070` | `UC-I13`, `UC-P09`, `UC-P14`, `UC-I09` | `REG-06-202…208`, `T-06-72…74` |
| CAP-DAT | `RF-071` | `UC-P32`, `UC-P33` | `REG-06-209…213`, `T-06-75…77` |
| ANT-DRAFT | `RF-047` | `UC-P19 V04` | `REG-06-214…216`, `T-06-78` |
| ANT-VOID | `RF-050` | `UC-E03` | `REG-06-217…221`, `T-06-79` |

No se crean RF/UC nuevos desde 06.

---

### 20.10. Fronteras y deudas downstream

#### 20.10.1. Documento 08

Debe resolver:

- pertinencia/categorías para CAP-DAT;
- autorización cross-domain de inputs CAP-MET;
- visibilidad/acceso de solicitudes/respuestas;
- acceso a borradores antropométricos;
- quién puede anular y auditoría/retención/visibilidad asociadas.

#### 20.10.2. Documento 09

Debe materializar contratos para:

- métodos/versiones/ejecuciones/referencia;
- solicitudes/respuestas;
- guardar/retomar/finalizar evaluación en preparación;
- anulación antropométrica;
- concurrencia e idempotencia.

#### 20.10.3. Documento 10

Debe reconciliar:

- métodos/sugerencias/referencia;
- formularios;
- estado de preparación;
- CTA/copy/efectos de anulación.

#### 20.10.4. 11A / 12

11A deberá probar estados, historia, autorización, dependencias y no automatización.

12 deberá agregar trazas:

```text
RF-070 ↔ UC-I13 ↔ REG-06-202…208
RF-071 ↔ UC-P32/P33 ↔ REG-06-209…213
RF-047 ↔ UC-P19 V04 ↔ REG-06-214…216
RF-050 ↔ UC-E03 ↔ REG-06-217…221
```

---

### 20.11. Control de no impacto arquitectónico

Este parche no agrega:

- área `M-*`;
- módulo de despliegue;
- servicio independiente;
- proveedor;
- base de datos adicional;
- canal;
- plataforma;
- topología.

Por tanto:

```text
BE-LEG-07:
SIN CAMBIO MATERIAL
```

La presencia de nuevas estructuras de dominio no equivale a nueva arquitectura de despliegue.

---

### 20.12. Autoverificación falsable del parche

| # | Control | Falla si |
|---:|---|---|
| 1 | `T06N12_unico` | aparece una segunda definición transversal de cálculo |
| 2 | `DEC046` | CAP-MET genera objetivo/requerimiento autónomo |
| 3 | `input_admisible` | dato disponible se consume sin regla de admisibilidad |
| 4 | `run_inmutable` | una Ejecución sobrescribe otra |
| 5 | `sin_promedio` | resultados se promedian/ganan automáticamente |
| 6 | `referencia_no_decide` | adoptar referencia modifica objetivo/plan |
| 7 | `template_version` | editar plantilla reinterpreta historia |
| 8 | `request_no_auth` | solicitud concede consentimiento/acceso |
| 9 | `self_reported` | respuesta pasa a medición/diagnóstico |
| 10 | `perfil_vs_respuesta` | mismo valor fusiona procedencias |
| 11 | `draft_no_registered` | EN_PREPARACION alimenta evolución confirmada |
| 12 | `auth_retoma` | borrador se retoma sin autorización vigente |
| 13 | `void_no_delete` | anulación borra original |
| 14 | `void_local` | B-06 adquiere estado global ANULADA |
| 15 | `void_dependencias` | derivados quedan vigentes por inercia |
| 16 | `void_sindato` | anulación produce cero/interpolación/reemplazo inventado |
| 17 | `void_no_reverse` | anulación se revierte sin comportamiento aprobado |
| 18 | `no_07` | se introduce cambio de arquitectura/despliegue |
| 19 | `sin_endpoint` | 06 fija rutas/DTO/códigos |
| 20 | `sin_ui` | 06 fija pantalla/componente/copy |
| 21 | `git_none` | se ejecuta o declara Git/canonización de v0.1.1 |

---

### 20.13. Estado de salida del parche

```text
BE-LEG-06 v0.1.1
BORRADOR DE PARCHE TRANSVERSAL — NO APROBADO

BASELINE:
v0.1 APROBADA/CANÓNICA
209/209 DEUDA ORIGINAL — SIN REAPERTURA

CAP-MET:
MODELADO
T-06-N12 PRESERVADO
REG-06-202…208

CAP-DAT:
MODELADO
REG-06-209…213

ANT-DRAFT:
MODELADO EN M-09
REG-06-214…216

ANT-VOID:
MODELADO EN M-09
REG-06-217…221
REG-06-16 INCISO 4 CONSUMIDO
B-06 NO REABIERTO

INV NUEVOS:
INV-06-211…226

07:
SIN CAMBIO

08/09/10/11A/12:
PENDIENTES DE PROPAGACIÓN

IMPLEMENTACIÓN:
NO AUTORIZADA

CANONIZACIÓN v0.1.1:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE
```

---

*Fin del parche transversal BE-LEG-06 v0.1.1.*

