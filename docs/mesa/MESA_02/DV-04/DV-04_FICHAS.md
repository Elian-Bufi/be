# DV-04 — Casos de uso · documentación

> **Produce:** Claude, por delegación de Dirección · 2026-09-11
> **Fuente única:** `BE-LEG-05 v0.15` — `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf`
> **Complementa:** `DV-04 v0.3` (ocho diagramas) · **Norma:** estándar de calidad §2 · DV-04 nivel tesis
> **Cambio semántico:** ninguno. Las fichas transcriben el 05; no lo reinterpretan.

## Cómo leer este documento

`Entregables.pdf` §4 pide **diagrama y documentación**. Los diagramas están en `DV-04 v0.3`; acá están las fichas.

Cada caso principal lleva **ficha completa** con los dieciséis campos que el Documento 05 declara en `§10.6`. Los casos incluidos, de extensión y de soporte llevan **ficha compacta**: los invoca otro caso y su conducta se distribuye en sus invocantes.

La columna **Canal** deriva de `DV-03` a través de los RF que cada caso materializa. Es clasificación derivada, no canónica.

---

## Índice de los 56 casos

| Código | Tipo | Nombre | Canal | Actor principal | RF que materializa |
|---|---|---|---|---|---|
| `UC-P01` | Principal | Gestionar alta profesional escalonada | Website | Profesional | RF-008 RF-009 RF-010 RF-067 |
| `UC-P02` | Principal | Revisar solicitud y resolver la verificación profesional | Website | Administrador | RF-011 RF-012 |
| `UC-P03` | Principal | Suspender o rehabilitar capacidad profesional | Website | Administrador | RF-012 RF-014 |
| `UC-P04` | Principal | Solicitar o invitar a un vínculo | Website | Profesional o asesorado | RF-015 RF-018 RF-051 |
| `UC-P05` | Principal | Aceptar o rechazar un vínculo | Website · APK | Asesorado | RF-015 RF-019 RF-023 RF-051 |
| `UC-P06` | Principal | Consultar, pausar o finalizar un vínculo | Transversal | Profesional o asesorado | RF-023 RF-024 |
| `UC-P07` | Principal | Otorgar y consultar consentimiento específico | APK | Asesorado | RF-020 RF-023 |
| `UC-P08` | Principal | Revocar consentimiento | APK | Asesorado | RF-022 |
| `UC-P09` | Principal | Registrar evaluación y objetivo nutricional | Website | Profesional de Nutrición | RF-026 RF-029 RF-070 |
| `UC-P10` | Principal | Diseñar plan nutricional | Website | Profesional de Nutrición | RF-027 RF-028 RF-030 RF-059 RF-060 |
| `UC-P11` | Principal | Validar y activar plan nutricional | Website | Profesional de Nutrición | RF-031 RF-066 |
| `UC-P12` | Principal | Consultar y registrar ejecución nutricional en APK | APK | Asesorado | RF-032 RF-033 |
| `UC-P13` | Principal | Revisar evidencia y decidir continuidad nutricional | Website | Profesional de Nutrición | RF-034 RF-035 RF-056 RF-058 |
| `UC-P14` | Principal | Registrar evaluación y objetivo de entrenamiento | Website | Profesional de Entrenamiento | RF-036 RF-064 RF-070 |
| `UC-P15` | Principal | Diseñar plan de entrenamiento | Website | Profesional de Entrenamiento | RF-037 RF-038 RF-039 RF-040 RF-059 RF-060 |
| `UC-P16` | Principal | Validar y activar plan de entrenamiento | Website | Profesional de Entrenamiento | RF-041 RF-066 |
| `UC-P17` | Principal | Consultar y registrar ejecución de entrenamiento en APK | APK | Asesorado | RF-042 RF-043 |
| `UC-P18` | Principal | Revisar evidencia y decidir continuidad de entrenamiento | Website | Profesional de Entrenamiento | RF-045 RF-046 RF-056 RF-058 |
| `UC-P19` | Principal | Registrar evaluación antropométrica | Website | Profesional con capacidad antropom | RF-047 RF-048 RF-066 |
| `UC-P20` | Principal | Consultar evolución antropométrica | Transversal | Asesorado o profesional autorizado | RF-049 |
| `UC-P21` | Principal | Publicar servicio antropométrico limitado | Website | Profesional con capacidad antropom | RF-051 RF-066 |
| `UC-P22` | Principal | Descubrir servicio antropométrico | Website | Asesorado | RF-051 RF-059 |
| `UC-P23` | Principal | Consultar cartera y revisiones pendientes | Website | Profesional | RF-052 RF-055 |
| `UC-P24` | Principal | Consultar dashboard y línea temporal interdisciplinaria | Website | Profesional autorizado | RF-053 RF-054 |
| `UC-P25` | Principal | Registrar identidad BE y perfil propio | APK | Profesional o asesorado | RF-001 RF-006 RF-017 |
| `UC-P26` | Principal | Autenticar y finalizar una sesión local | Transversal | Profesional, asesorado o administr | RF-002 RF-005 RF-006 |
| `UC-P27` | Principal | Solicitar cierre de cuenta | Transversal | Profesional o asesorado | RF-069 |
| `UC-P28` | Principal | Registrar y gestionar incidencia administrativa | Transversal | Profesional, asesorado o administr | RF-068 |
| `UC-P29` | Principal | Configurar habilitaciones y capacidad académica | Website | Administrador | RF-066 |
| `UC-P30` | Principal | Consultar novedades internas | Transversal | Profesional o asesorado | RF-061 |
| `UC-P31` | Principal | Consultar progreso longitudinal en APK | APK | Asesorado | RF-054 RF-065 |
| `UC-P32` | Principal | Solicitar información estructurada pertinente al asesorado | Transversal | Profesional autorizado | RF-071 |
| `UC-P33` | Principal | Completar información solicitada | Transversal | Asesorado | RF-071 |
| `UC-I01` | Incluido | Presentar evidencia versionada | Website | — | RF-009 RF-067 |
| `UC-I02` | Incluido | Evaluar autorización contextual | Website · APK | Sistema BE | RF-021 RF-052 RF-053 RF-057 RF-065 RF-071 |
| `UC-I03` | Incluido | Registrar auditoría y preservar historia | Website | — | RF-025 RF-044 RF-050 RF-054 RF-057 RF-071 |
| `UC-I04` | Incluido | Validar y versionar un plan | Website | — | RF-031 RF-041 |
| `UC-I05` | Incluido | Registrar revisión profesional válida | Website | — | RF-055 RF-056 RF-058 |
| `UC-I06` | Incluido | Aplicar continuidad o cierre | Website | — | RF-035 RF-046 RF-058 |
| `UC-I07` | Incluido | Importar elemento externo con revisión controlada | Website | — | RF-028 RF-038 |
| `UC-I08` | Incluido | Aplicar fallback manual y conservar procedencia | Transversal | — | RF-059 RF-060 |
| `UC-I09` | Incluido | Emitir cálculos antropométricos reproducibles | Website | — | RF-048 RF-050 RF-070 |
| `UC-I10` | Incluido | Verificar habilitación y capacidad antes de iniciar proceso | Website | — | RF-031 RF-041 RF-066 |
| `UC-I11` | Incluido | Encauzar al actor por la superficie prevista | Transversal | — | RF-007 |
| `UC-I12` | Incluido | Registrar corrección trazable | Website | — | RF-044 RF-050 |
| `UC-I13` | Incluido | Ejecutar y adoptar cálculo profesional reproducible | Website | — | RF-070 |
| `UC-E01` | Extensión | Subsanar y volver a presentar evidencia | Website | Profesional | RF-013 |
| `UC-E02` | Extensión | Corregir ejecución de entrenamiento | Transversal | Asesorado o profesional autorizado | RF-044 |
| `UC-E03` | Extensión | Corregir evaluación antropométrica | Website | Profesional autor o profesional au | RF-048 RF-050 |
| `UC-E04` | Extensión | Solicitar vínculo desde descubrimiento antropométrico | Website | Asesorado | RF-051 |
| `UC-E05` | Extensión | Acceder mediante Google | Transversal | — | RF-003 |
| `UC-E06` | Extensión | Administrar métodos de acceso | Transversal | — | RF-004 |
| `UC-E07` | Extensión | Registrar nota de coordinación autorizada | Website | Profesional autor | RF-057 |
| `UC-E08` | Extensión | Recibir notificación push no sensible | Transversal | — | RF-062 |
| `UC-E09` | Extensión | Recuperar el acceso local | Transversal | — | RF-005 |
| `UC-S01` | Soporte | Obtener TVCC-30 de manera reproducible | Transversal | Sistema BE o responsable de valida | RF-058 |

**56 casos** — 33 principales · 13 incluidos · 9 de extensión · 1 de soporte.

---

## Fichas de casos principales

### `UC-P01` — Gestionar alta profesional escalonada

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `4.5` · **Bloque:** Bloque 01 — Alta profesional

**Objetivo.** Permitir que una persona con identidad BE complete su perfil profesional, declare una o ambas especialidades y/o la capacidad antropométrica transversal, aporte evidencia independiente y presente cada alcance a revisión administrativa sin obtener facultades prematuras.

**Alcance.** - **Superficie:** profesional.
- **Canal previsto:** Website.
- **Inicio:** perfil profesional no presentado o con un nuevo alcance pendiente de presentación.
- **Fin:** uno o más alcances quedan presentados de forma independiente para revisión administrativa, o el trabajo queda guardado sin presentar.

**Actor principal.** Profesional.

**Actores secundarios.** - Sistema BE.
- Administrador, como receptor posterior de la solicitud presentada.

**Disparador.** El profesional decide iniciar o continuar su alta para operar en Nutrición, Entrenamiento y/o Antropometría.

**Precondiciones.** 1. Existe una identidad BE autenticada y habilitada para operar su propia cuenta.
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

**Postcondiciones de éxito.** 1. El perfil profesional queda guardado.
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

**Garantías mínimas.** - Guardar un perfil incompleto no concede facultades profesionales.
- Declarar una especialidad no verifica la otra.
- Declarar Antropometría no la convierte en especialidad.
- Cargar evidencia no equivale a aprobación.
- Un fallo de validación o persistencia no produce una solicitud aparentemente exitosa.
- Una versión ya presentada no se sobrescribe silenciosamente.
- No se crean vínculos, consentimientos ni autorizaciones sobre asesorados.
- Los datos solicitados deberán ser pertinentes al proceso de revisión. La selección definitiva de campos y documentos corresponde a `DERIVAR 08/10`.

**Flujo principal.** 1. El profesional accede a su situación de alta desde la superficie profesional.
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

**Variantes.** **V01 — Guardar perfil incompleto**

En el paso 4, el profesional guarda la información disponible y finaliza la interacción.

**Resultado:** el perfil queda incompleto y no se crea una solicitud presentada.

**V02 — Solicitar una sola especialidad**

El profesional presenta únicamente Nutrición o Entrenamiento.

**Resultado:** la otra especialidad no se declara, no se revisa y no cambia.

**V03 — Solicitar ambas especialidades**

El profesional solicita Nutrición y Entrenamiento.

**Resultado:** BE genera solicitudes independientes, aunque se completen dentro de una misma sesión de trabajo.

**V04 — Declarar capacidad antropométrica**

El profesional declara Antropometría de forma separada de Nutrición y Entrenamiento.

**Resultado:** la capacidad queda sometida al mismo patrón administrativo, con evidencia y resolución independientes.

**V05 — Agregar un alcance a un perfil con otro alcance ya aprobado**

El profesional inicia una nueva solicitud sin afectar el alcance previamente aprobado.

**Resultado:** la nueva solicitud permanece pendiente mientras el alcance anterior conserva su situación, salvo resolución administrativa expresa diferente.

**V06 — Actualizar información no presentada**

Mientras la información o evidencia aún no haya sido presentada, el profesional puede modificarla.

**Resultado:** BE conserva el borrador vigente conforme al modelo que defina `DERIVAR 06`.

**V07 — Reingreso después de una observación**

Si existe una solicitud observada y la resolución admite subsanación, el recorrido continúa mediante `UC-E01`.

**Excepciones.** **E01 — Perfil insuficiente para presentar**

BE detecta que falta información mínima.

**Resultado:**

- no presenta la solicitud;
- identifica qué condición falta;
- permite conservar el trabajo disponible;
- no muestra éxito falso.

**E02 — Evidencia faltante, inutilizable o no asociable al alcance**

BE no puede utilizar la evidencia para la presentación.

**Resultado:**

- no presenta el alcance afectado;
- informa el problema de forma comprensible;
- no modifica otros alcances.

Los formatos, tamaños, vigencias y controles concretos pertenecen a `DERIVAR 08/09/10`.

**E03 — Solicitud equivalente ya presentada**

Existe una solicitud vigente equivalente para el mismo alcance y versión.

**Resultado:**

- BE evita una duplicación contradictoria;
- presenta la situación existente;
- no registra una segunda presentación como éxito.

La regla técnica de equivalencia pertenece a `DERIVAR 06`.

**E04 — Cuenta no habilitada**

La identidad no puede operar su propia cuenta.

**Resultado:** BE bloquea la presentación sin alterar solicitudes previas.

Los motivos y efectos de cuenta pertenecen a `DERIVAR 06/08`.

**E05 — Falla al preservar la versión o registrar la presentación**

BE no puede confirmar persistencia o auditoría.

**Resultado:**

- la solicitud no se declara presentada;
- el profesional recibe un resultado recuperable;
- no se concede ninguna facultad.

**E06 — Intento de presentar un alcance ya aprobado como si fuera inicial**

BE detecta que el alcance ya posee una aprobación administrativa vigente.

**Resultado:** no duplica la aprobación y orienta al recorrido aplicable para cambios posteriores, suspensión o nueva evidencia, según las reglas que defina `DERIVAR 06/08`.

**Reglas aplicables.** 1. Cada alcance se evalúa independientemente.
2. Nutrición y Entrenamiento son las especialidades iniciales.
3. Antropometría es una capacidad transversal.
4. El envío de evidencia no produce aprobación.
5. La aprobación administrativa no produce autorización sobre asesorados.
6. La habilitación comercial o académica es una dimensión separada.
7. La versión presentada debe poder identificarse y no sobrescribirse silenciosamente.
8. El profesional debe comprender los límites de “verificado”.
9. El administrador no participa en la edición del perfil del profesional.
10. La interacción específica y sus componentes pertenecen a `DERIVAR 10`.

**Información utilizada o generada.** **Utilizada**

- identidad BE;
- situación de cuenta;
- perfil profesional;
- alcance solicitado;
- evidencia aportada;
- declaraciones requeridas;
- historial previo del mismo alcance.

**Generada**

- perfil guardado;
- borrador de solicitud;
- versión presentada;
- fecha de presentación;
- procedencia declarada;
- relación entre alcance y evidencia;
- resultado de presentación;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-008`
- `RF-009`
- `RF-010`
- `RF-015`
- `RF-067`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I01 — Presentar evidencia versionada`
- `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

**Casos extendidos.** - `UC-E01 — Subsanar y volver a presentar evidencia`

**Puntos de auditoría.** - creación y modificación relevante del perfil;
- declaración de cada alcance;
- asociación de evidencia;
- versión presentada;
- fecha y actor de presentación;
- resultado de presentación;
- intento fallido que no produjo solicitud;
- relación entre solicitud nueva y antecedentes, cuando corresponda.

Los eventos, datos mínimos y retención pertenecen a `DERIVAR 08`.

**Decisiones o preguntas abiertas.** 1. Taxonomía técnica de estados: `DERIVAR 06`.
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

**Criterio de cierre.** El caso termina cuando:

- una solicitud independiente queda presentada y disponible para revisión; o
- el profesional guarda su trabajo sin presentar; o
- BE informa una excepción sin conceder facultades ni declarar un éxito inexistente.

---

---

### `UC-P02` — Revisar solicitud y resolver la verificación profesional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `4.6` · **Bloque:** Bloque 01 — Alta profesional

**Objetivo.** Permitir que un administrador revise una versión presentada y resuelva la verificación profesional de un alcance específico mediante observación, verificación favorable o rechazo fundamentado, sin afectar otras especialidades o capacidades.

**Alcance.** - **Superficie:** administrativa.
- **Canal previsto:** Website.
- **Inicio:** existe una solicitud presentada y pendiente de resolución administrativa.
- **Fin:** la solicitud queda observada, aprobada o rechazada con fundamento, autoría, fecha y trazabilidad.

**Actor principal.** Administrador.

**Actores secundarios.** - Profesional.
- Sistema BE.

**Disparador.** El administrador selecciona una solicitud presentada para revisión.

**Precondiciones.** 1. El administrador posee una sesión válida y facultad administrativa aplicable.
2. La solicitud:
   - identifica al profesional;
   - identifica un único alcance;
   - conserva una versión presentada;
   - posee evidencia disponible para revisión.
3. La identidad, especialidad, capacidad transversal, habilitación y autorización permanecen separadas.
4. El administrador accede únicamente a la información necesaria para resolver la solicitud.
5. Los criterios y políticas detalladas de evidencia pertenecen a `DERIVAR 08`.

**Postcondiciones de éxito.** 1. La resolución queda asociada a:
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

**Garantías mínimas.** - El administrador no puede resolver sin identificar la versión revisada.
- La resolución no modifica silenciosamente la evidencia.
- Una aprobación no se presenta como certificación oficial.
- Una observación no se presenta como rechazo definitivo.
- Un rechazo no elimina el expediente.
- Resolver Nutrición no modifica Entrenamiento ni Antropometría.
- Resolver Antropometría no modifica las especialidades.
- Un error de persistencia no muestra una resolución exitosa.
- La suspensión de un alcance ya aprobado se gestiona mediante `UC-P03`, no como resolución inicial.

**Flujo principal.** 1. El administrador accede a las solicitudes que está autorizado a revisar.
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

**Variantes.** **V01 — Observación con subsanación**

El administrador determina que la solicitud requiere correcciones o evidencia adicional y permite una nueva presentación.

**Resultado:** la versión revisada permanece preservada y se habilita `UC-E01`.

**V02 — Verificación favorable**

El administrador considera suficiente la revisión administrativa del alcance.

**Resultado:** el alcance alcanza la semántica funcional `VERIFICADO`. La expresión “aprobación administrativa” puede utilizarse únicamente como explicación natural de este resultado, con las limitaciones declaradas en este caso.

**V03 — Verificación rechazada**

El administrador determina que la solicitud no puede verificarse favorablemente.

**Resultado:** el alcance alcanza la semántica funcional `RECHAZADO`, no queda habilitado y conserva fundamento e historia.

La posibilidad futura de iniciar otra solicitud debe ser definida sin borrar este expediente mediante `DERIVAR 06/08`.

**V04 — Resolución independiente de varias solicitudes del mismo profesional**

El administrador revisa más de un alcance del mismo profesional.

**Resultado:** cada solicitud recibe una resolución separada. No se aplica una resolución masiva implícita.

**V05 — Revisión de capacidad antropométrica**

La solicitud corresponde a la capacidad antropométrica transversal.

**Resultado:** se utiliza la misma semántica administrativa, pero el resultado no crea una tercera especialidad.

**V06 — Solicitud con antecedentes de subsanación**

El administrador consulta la versión anterior, las observaciones y la nueva versión.

**Resultado:** la resolución identifica expresamente cuál versión fue revisada.

**Excepciones.** **E01 — Administrador sin facultad aplicable**

BE detecta que el actor no puede revisar la solicitud.

**Resultado:** bloquea el acceso o la resolución y registra el intento según política.

**E02 — Evidencia no disponible o incompleta por falla operativa**

La evidencia que debía estar preservada no puede consultarse.

**Resultado:**

- no se permite aprobar o rechazar como si se hubiera revisado;
- la solicitud permanece sin resolución;
- BE informa la incidencia recuperable.

**E03 — Solicitud modificada después de presentarse**

BE detecta una diferencia no versionada entre el contenido presentado y el mostrado.

**Resultado:**

- no permite resolver esa versión;
- conserva la solicitud;
- deriva la inconsistencia para tratamiento;
- no reemplaza evidencia silenciosamente.

**E04 — Resolución concurrente**

Otro administrador resolvió o modificó la situación antes de la confirmación.

**Resultado:**

- BE no declara éxito;
- presenta la situación vigente;
- exige revisar nuevamente antes de otra decisión.

**E05 — Fundamento insuficiente**

El administrador intenta confirmar sin un fundamento requerido.

**Resultado:** BE no registra la resolución y señala la condición faltante.

El contenido mínimo definitivo pertenece a `DERIVAR 06/08`.

**E06 — Falla al registrar la resolución**

BE no puede confirmar persistencia o auditoría.

**Resultado:**

- no presenta la solicitud como resuelta;
- no cambia facultades;
- informa un resultado recuperable.

**Reglas aplicables.** 1. La revisión es administrativa y trazable.
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

**Información utilizada o generada.** **Utilizada**

- identidad y perfil profesional;
- alcance solicitado;
- versión presentada;
- evidencia;
- procedencia declarada;
- antecedentes y observaciones;
- facultad administrativa del revisor.

**Generada**

- resultado administrativo;
- fundamento;
- autoría;
- fecha;
- relación con la versión;
- eventual permiso de subsanación;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-011 — Revisar una solicitud profesional`
- `RF-012 — Resolver la verificación por especialidad o capacidad transversal`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Declarar la capacidad antropométrica transversal y aportar evidencia`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos extendidos.** - `UC-E01 — Subsanar y volver a presentar evidencia`

**Puntos de auditoría.** - acceso a la solicitud;
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

**Decisiones o preguntas abiertas.** 1. Taxonomía técnica y transiciones: `DERIVAR 06`.
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

**Criterio de cierre.** El caso termina cuando:

- la solicitud queda observada, aprobada o rechazada con trazabilidad; o
- una excepción impide la resolución sin alterar facultades ni presentar éxito falso.

---

---

### `UC-P03` — Suspender o rehabilitar capacidad profesional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `4.8` · **Bloque:** Bloque 01 — Alta profesional

**Objetivo.** Permitir que un administrador restrinja o restituya expresamente la operación de una especialidad o capacidad transversal, con motivo, alcance, autoría y trazabilidad, sin borrar historial ni afectar otros alcances de forma implícita.

**Alcance.** - **Superficie:** administrativa.
- **Canal previsto:** Website.
- **Inicio:** existe un alcance previamente aprobado o suspendido.
- **Fin:** el alcance seleccionado queda suspendido o rehabilitado mediante resolución explícita.

*del vínculo*

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

**Actor principal.** Administrador.

**Actores secundarios.** - Profesional.
- Sistema BE.
- Actores afectados por operaciones futuras del alcance, sin participación directa.

**Disparador.** El administrador recibe o identifica una causa administrativa que requiere suspender o reconsiderar un alcance profesional.

**Precondiciones.** **Para suspender**

1. El alcance seleccionado se encuentra administrativamente aprobado o habilitado para operar.
2. El administrador posee facultad para resolver sobre ese alcance.
3. La suspensión identifica profesional, alcance y motivo.

**Para rehabilitar**

1. El alcance seleccionado se encuentra suspendido.
2. Existe fundamento para reconsiderar la suspensión.
3. El administrador posee facultad para rehabilitar.
4. Las condiciones adicionales que correspondan se definen en `DERIVAR 06/08`.

**Postcondiciones de éxito.** **Suspensión**

1. El alcance alcanza la semántica funcional mínima `SUSPENDIDO`.
2. Las nuevas operaciones del alcance quedan bloqueadas.
3. El historial previo no se elimina.
4. Las demás especialidades y capacidades no cambian implícitamente.
5. El profesional puede conocer el alcance, fecha y motivo de la suspensión, según la política aplicable.
6. El evento queda trazable.

**Rehabilitación**

1. El alcance deja de estar suspendido mediante resolución explícita.
2. Cuando las demás condiciones independientes se cumplen, recupera la semántica funcional `VERIFICADO`.
3. La rehabilitación no se produce automáticamente por tiempo o silencio.
4. Las condiciones de habilitación, vínculo, consentimiento y autorización continúan evaluándose de forma independiente.
5. El evento queda trazable.
6. La transición técnica definitiva se deriva a `06/08`.

**Garantías mínimas.** - Una suspensión no borra planes, decisiones, evaluaciones o auditoría.
- La suspensión de Nutrición no suspende Entrenamiento ni Antropometría salvo resolución expresa separada.
- La suspensión de Antropometría no altera las especialidades.
- La rehabilitación no concede vínculos, consentimientos o autorizaciones.
- La rehabilitación no sustituye una habilitación académica o comercial faltante.
- Una falla de persistencia no muestra el alcance como suspendido o rehabilitado.
- Los efectos detallados sobre procesos activos y lectura histórica permanecen en `DERIVAR 06/08`.

**Flujo principal.** *Suspensión*

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

*Rehabilitación*

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

**Variantes.** **V01 — Suspensión de una sola especialidad**

Se suspende Nutrición o Entrenamiento.

**Resultado:** el otro alcance permanece sin cambios.

**V02 — Suspensión de capacidad antropométrica**

Se suspende únicamente Antropometría.

**Resultado:** no pueden iniciarse nuevas evaluaciones ni publicaciones de ese alcance; las especialidades permanecen separadas.

**V03 — Suspensión de varios alcances**

Existen motivos para más de un alcance.

**Resultado:** el administrador debe emitir decisiones explícitas por cada alcance. No se aplica una suspensión masiva implícita.

**V04 — Rehabilitación condicionada a nueva evidencia**

La política aplicable exige evidencia actualizada.

**Resultado:** el administrador no rehabilita hasta que se complete el recorrido requerido. El mecanismo se define en `DERIVAR 06/08`; puede reutilizar el patrón de presentación de evidencia sin borrar antecedentes.

**V05 — Habilitación comercial o académica insuficiente**

El alcance deja de estar suspendido, pero carece de otra condición independiente.

**Resultado:** la rehabilitación administrativa no se presenta como operación plenamente habilitada.

**Excepciones.** **E01 — Alcance no suspendible desde este caso**

La situación seleccionada no corresponde a una especialidad o capacidad profesional administrable mediante `UC-P03`.

**Resultado:** BE no aplica la acción y orienta al caso correcto.

**E02 — Alcance ya suspendido**

El administrador intenta suspender nuevamente el mismo alcance sin una nueva resolución aplicable.

**Resultado:** BE presenta la situación vigente y evita un éxito falso o un evento duplicado contradictorio.

**E03 — Alcance no suspendido al intentar rehabilitar**

BE detecta que el alcance no requiere rehabilitación.

**Resultado:** no registra la acción como exitosa.

**E04 — Operación concurrente**

La situación cambió antes de la confirmación.

**Resultado:** BE no aplica la decisión y exige revisar nuevamente.

**E05 — Motivo o fundamento insuficiente**

Falta información mínima para confirmar.

**Resultado:** BE no ejecuta la medida.

**E06 — Falla de persistencia o auditoría**

BE no puede confirmar la operación.

**Resultado:** no declara el alcance suspendido o rehabilitado y no produce cambios parciales visibles como éxito.

**Reglas aplicables.** 1. Suspensión y rehabilitación son decisiones administrativas expresas.
2. Toda decisión se aplica por alcance.
3. No existe rehabilitación automática.
4. El historial se conserva.
5. La suspensión corta nuevas operaciones del alcance.
6. Los efectos sobre procesos activos, acceso histórico, vínculos y planes pertenecen a `DERIVAR 06/08`.
7. La suspensión de cuenta completa no se resuelve en este caso.
8. La habilitación académica o comercial continúa separada.
9. El profesional debe poder distinguir la medida administrativa de una certificación o sanción oficial.
10. Los estados técnicos pertenecen a `DERIVAR 06`.

**Información utilizada o generada.** **Utilizada**

- identidad profesional;
- alcance seleccionado;
- situación administrativa;
- antecedentes;
- motivo o fundamento;
- facultad del administrador;
- condiciones independientes conocidas.

**Generada**

- decisión de suspensión o rehabilitación;
- alcance;
- motivo o fundamento;
- actor;
- fecha;
- situación resultante;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-012 — Resolver la verificación por especialidad o capacidad transversal`
- `RF-014 — Suspender y rehabilitar una capacidad profesional`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Declarar la capacidad antropométrica transversal y aportar evidencia`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos extendidos.** Ninguno obligatorio en esta versión.

**Puntos de auditoría.** - consulta de situación;
- alcance seleccionado;
- motivo;
- decisión;
- actor;
- fecha;
- confirmación;
- situación anterior y posterior;
- operación concurrente o fallida;
- comunicación de la decisión.

**Decisiones o preguntas abiertas.** 1. Efectos sobre planes, evaluaciones o procesos activos: `DERIVAR 06`.
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

**Criterio de cierre.** El caso termina cuando el alcance queda suspendido o rehabilitado mediante decisión explícita y trazable, o cuando una excepción impide el cambio sin producir un estado falso ni alterar otros alcances.

---

---

### `UC-P04` — Solicitar o invitar a un vínculo

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `5.5` · **Bloque:** Bloque 02 — Vínculo profesional–asesorado

**Objetivo.** Permitir que un profesional elegible invite a un asesorado, o que un asesorado solicite vincularse con un profesional elegible, identificando alcance y finalidad sin generar acceso o autorización antes de la aceptación expresa.

**Alcance.** - **Superficies:** profesional y APK del asesorado.
- **Inicio:** una de las partes decide proponer una relación profesional.
- **Fin:** la solicitud queda pendiente de decisión del asesorado o la operación se rechaza de forma controlada.

**Actor principal.** Profesional o asesorado.

**Actores secundarios.** - Asesorado, cuando inicia el profesional.
- Profesional, cuando inicia el asesorado.
- Sistema BE.

**Disparador.** Uno de los actores decide proponer un vínculo para Nutrición, Entrenamiento o capacidad antropométrica transversal.

**Precondiciones.** 1. El actor principal posee identidad BE y sesión válida.
2. El asesorado es una persona adulta dentro del alcance del MVP.
3. El profesional puede ser identificado inequívocamente.
4. El alcance solicitado corresponde a:
   - una especialidad verificada; o
   - una capacidad transversal verificada.
5. La habilitación aplicable se evalúa de forma independiente.
6. Si la solicitud nace desde descubrimiento antropométrico, se aplica `UC-E04`.
7. BE evalúa mediante `UC-I02` que el actor pueda proponer el vínculo.
8. La regla técnica de elegibilidad y los estados definitivos se derivan a `06/08`.

**Postcondiciones de éxito.** 1. Existe una solicitud identificable.
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

**Garantías mínimas.** - El profesional no puede autoaceptar en nombre del asesorado.
- Una invitación no concede acceso.
- Una solicitud iniciada por el asesorado tampoco concede acceso.
- La finalidad no se amplía implícitamente.
- Nutrición, Entrenamiento y Antropometría se identifican de forma separada.
- Un vínculo no se utiliza como sustituto del consentimiento.
- No se transfiere información histórica al profesional antes de la autorización aplicable.
- Un fallo de persistencia no muestra una invitación o solicitud exitosa.
- El actor solo puede consultar relaciones propias.

**Flujo principal.** 1. El actor principal accede a la función de vinculación desde la superficie prevista.
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

**Variantes.** **V01 — Invitación iniciada por profesional**

El profesional identifica al asesorado y propone una relación.

**Resultado:** el asesorado es el único actor que puede aceptar o rechazar.

**V02 — Solicitud iniciada por asesorado**

El asesorado selecciona un profesional y propone la relación.

**Resultado:** la solicitud queda pendiente de la decisión explícita del asesorado respecto del vínculo propuesto y de la elegibilidad del profesional. Si la UX simplifica la confirmación en un solo recorrido, no puede omitir la aceptación expresa.

**V03 — Solicitud desde descubrimiento antropométrico**

El asesorado consulta un servicio antropométrico y decide solicitar vínculo.

**Resultado:** se invoca `UC-E04`; no se incorporan reservas, pagos o contratación automática.

**V04 — Contraparte aún sin identidad BE activa**

El profesional invita a una persona que todavía debe crear o recuperar su identidad BE.

**Resultado:** la invitación puede conservarse como antecedente pendiente sin habilitar acceso. El mecanismo de identificación, entrega y vinculación posterior pertenece a `DERIVAR 06/08/09/10`.

**V05 — Varios alcances con el mismo profesional**

Las partes desean relacionarse para más de un alcance.

**Resultado:** cada alcance queda identificable y no se amplía automáticamente. El modelo exacto —una relación con varios alcances o relaciones relacionadas— se deriva a `06`.

**V06 — Nuevo vínculo después de finalizar otro**

El asesorado propone o recibe una solicitud de otro profesional.

**Resultado:** la nueva solicitud no transfiere acceso, autoría ni procedencia histórica del vínculo anterior.

**Excepciones.** **E01 — Profesional no elegible para el alcance**

El profesional no posee verificación o condición aplicable.

**Resultado:** BE no crea la solicitud como válida y explica la condición faltante sin revelar información administrativa innecesaria.

**E02 — Solicitud equivalente vigente**

Ya existe una solicitud pendiente equivalente.

**Resultado:** BE presenta la situación existente y evita duplicados.

La equivalencia técnica pertenece a `DERIVAR 06`.

**E03 — Vínculo incompatible existente**

Ya existe una relación cuya situación impide crear otra equivalente.

**Resultado:** BE no declara éxito y orienta a consultar o gestionar el vínculo existente mediante `UC-P06`.

**E04 — Contraparte inexistente o no resoluble**

BE no puede identificar al profesional o asesorado.

**Resultado:** no crea una relación incompleta ni expone datos de búsqueda no autorizados.

**E05 — Alcance o finalidad no admisibles**

La solicitud pretende un dominio, finalidad o servicio fuera del MVP.

**Resultado:** BE rechaza la operación sin transformar el producto en marketplace, atención clínica o contratación automática.

**E06 — Falla de persistencia o auditoría**

BE no puede confirmar el registro.

**Resultado:** no presenta la solicitud como creada y no genera acceso parcial.

**E07 — Cambio concurrente de elegibilidad**

La elegibilidad del profesional cambia antes de confirmar.

**Resultado:** BE no crea la solicitud hasta recalcular la situación.

**Reglas aplicables.** 1. El asesorado acepta siempre de forma explícita.
2. La solicitud identifica profesional, asesorado, alcance y finalidad.
3. Una solicitud pendiente no habilita acceso.
4. Aceptar vínculo no equivale a otorgar consentimiento.
5. No se crean duplicados equivalentes vigentes.
6. Una invitación pendiente no ocupa capacidad profesional.
7. La elegibilidad del profesional se evalúa en el alcance solicitado.
8. El descubrimiento antropométrico solo conduce a solicitud de vínculo.
9. La navegación y búsqueda concreta se derivan a `10`.
10. La resolución técnica de identidades no registradas se deriva a `06/08/09`.

**Información utilizada o generada.** **Utilizada**

- identidad del actor;
- identidad o referencia de la contraparte;
- alcance solicitado;
- finalidad;
- verificación y habilitación aplicables;
- relaciones previas relevantes.

**Generada**

- solicitud o invitación;
- actor iniciador;
- profesional;
- asesorado;
- alcance;
- finalidad;
- fecha;
- situación pendiente;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-018 — Solicitar o invitar a un vínculo`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-025 — Preservar identidad e historia al cambiar de profesional`
- `RF-051 — Publicar y descubrir un servicio antropométrico limitado`, cuando se invoca desde `UC-E04`.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-001`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

**Casos extendidos.** - `UC-E04 — Solicitar vínculo desde descubrimiento antropométrico`

**Puntos de auditoría.** - actor iniciador;
- contraparte;
- alcance;
- finalidad;
- fecha;
- elegibilidad evaluada;
- resultado;
- duplicado o incompatibilidad detectada;
- creación fallida;
- origen desde descubrimiento antropométrico, cuando corresponda.

**Decisiones o preguntas abiertas.** 1. Representación técnica de solicitudes y vínculos: `DERIVAR 06`.
2. Identificación de personas aún no registradas: `DERIVAR 06/08/09`.
3. Datos visibles antes de aceptar: `DERIVAR 08`.
4. Caducidad o reiteración de solicitudes: `DERIVAR 06/08`.
5. Canales y notificaciones: `DERIVAR 10` y capacidad condicionada.
6. Forma de representar varios alcances: `DERIVAR 06`.
7. Operación exclusivamente antropométrica: aprobada por `DEC-044`; el vínculo puede tener como alcance una capacidad transversal.
8. Criterios completos de capacidad profesional: `DERIVAR 06`, respetando que una solicitud pendiente no ocupa capacidad.

**Criterio de cierre.** El caso termina cuando la solicitud queda pendiente de aceptación explícita y sin acceso profesional, o cuando una excepción impide crearla sin producir un resultado falso.

---

---

### `UC-P05` — Aceptar o rechazar un vínculo

> **Tipo:** Principal · **Canal:** Website · APK · **Sección del 05:** `5.6` · **Bloque:** Bloque 02 — Vínculo profesional–asesorado

**Objetivo.** Permitir que el asesorado decida expresamente sobre una solicitud de vínculo, comprendiendo quién propone la relación, para qué alcance y finalidad, sin confundir aceptación con consentimiento o autorización.

**Alcance.** - **Superficie:** APK del asesorado.
- **Inicio:** existe una solicitud pendiente dirigida al asesorado.
- **Fin:** la solicitud queda aceptada o rechazada con trazabilidad.

**Actor principal.** Asesorado.

**Actores secundarios.** - Profesional relacionado.
- Sistema BE.

**Disparador.** El asesorado consulta una solicitud pendiente y decide responderla.

**Precondiciones.** 1. El asesorado posee identidad BE y sesión válida.
2. La solicitud:
   - le pertenece;
   - identifica al profesional;
   - identifica alcance y finalidad;
   - permanece disponible para decisión.
3. El profesional continúa siendo elegible para el alcance.
4. BE evalúa mediante `UC-I02` que el asesorado pueda decidir sobre su propia solicitud.
5. La solicitud todavía no concede acceso profesional.

**Postcondiciones de éxito.** **Aceptación**

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

**Rechazo**

1. Queda registrado el rechazo expreso.
2. No existe acceso profesional.
3. No se crea consentimiento.
4. El rechazo conserva actor, fecha, alcance y relación con la solicitud.
5. El profesional conoce el resultado según la política de visibilidad.
6. El evento queda trazable.

**Garantías mínimas.** - Solo el asesorado acepta o rechaza.
- No existe aceptación implícita por silencio, apertura o uso de la aplicación.
- Aceptar no equivale a consentir datos.
- Rechazar no elimina la cuenta del asesorado.
- Rechazar no borra la solicitud ni su trazabilidad.
- Un fallo no muestra una aceptación o rechazo exitosos.
- Una decisión sobre Nutrición no se extiende automáticamente a Entrenamiento o Antropometría.
- El contenido aceptado debe ser identificable.

**Flujo principal.** *Aceptación*

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

*Rechazo*

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

**Variantes.** **V01 — Aceptación después de crear o recuperar la identidad BE**

El asesorado accede a una invitación previa después de completar su identidad.

**Resultado:** BE vincula la decisión con la invitación correcta sin crear una segunda relación.

**V02 — Varios alcances pendientes**

El asesorado recibe más de una solicitud del mismo profesional.

**Resultado:** decide cada alcance de manera identificable; no existe aceptación masiva implícita.

**V03 — Solicitud iniciada por el propio asesorado**

Aunque el asesorado haya iniciado el pedido, BE requiere una confirmación expresa del vínculo resultante.

**Resultado:** la intención inicial no reemplaza la aceptación trazable.

**V04 — Profesional con doble especialidad**

La solicitud identifica uno o ambos alcances.

**Resultado:** el asesorado puede aceptar el alcance presentado; la representación técnica se deriva a `06`, sin ampliar finalidades.

**V05 — Alcance antropométrico**

El vínculo propuesto se limita a Antropometría.

**Resultado:** aceptar no habilita Nutrición ni Entrenamiento y continúa requiriendo consentimiento específico.

**Excepciones.** **E01 — Solicitud ya resuelta**

La solicitud fue aceptada, rechazada, retirada o quedó incompatible.

**Resultado:** BE presenta la situación vigente y no registra una segunda decisión.

**E02 — Profesional ya no elegible**

La verificación, habilitación o capacidad aplicable cambió.

**Resultado:** BE no permite aceptar como si la relación pudiera operar y explica que la solicitud ya no está disponible.

**E03 — Contenido modificado después de ser presentado**

Cambió alcance, finalidad o profesional.

**Resultado:** BE invalida la decisión sobre el contenido anterior y exige una nueva solicitud identificable.

**E04 — Decisión concurrente**

Otra sesión resolvió la solicitud.

**Resultado:** BE no declara éxito y presenta el resultado vigente.

**E05 — Falla de persistencia o auditoría**

BE no puede confirmar la decisión.

**Resultado:** la solicitud no aparece aceptada ni rechazada.

**E06 — Intento de aceptación por otro actor**

Un profesional o tercero intenta aceptar en nombre del asesorado.

**Resultado:** BE deniega la operación y registra el intento según la política aplicable.

**Reglas aplicables.** 1. El asesorado decide expresamente.
2. No existe aceptación implícita.
3. Aceptación y consentimiento son eventos separados.
4. La aceptación se vincula al contenido presentado.
5. Rechazar no elimina la identidad ni el historial.
6. La aceptación no ocupa capacidad por sí sola si aún no existe proceso operativo abierto, conforme al modelo de negocio.
7. La elegibilidad se reevalúa al aceptar.
8. La visibilidad posterior se deriva a `08`.
9. Las notificaciones no sustituyen la decisión dentro de BE.

**Información utilizada o generada.** **Utilizada**

- solicitud pendiente;
- profesional;
- alcance;
- finalidad;
- elegibilidad vigente;
- identidad del asesorado.

**Generada**

- aceptación o rechazo;
- fecha;
- actor;
- contenido decidido;
- vínculo aceptado o solicitud rechazada;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-019 — Aceptar o rechazar un vínculo`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-023 — Consultar vínculos y consentimientos propios`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Continuación relacionada.** - `UC-P07 — Otorgar y consultar consentimiento específico`

**Puntos de auditoría.** - consulta de solicitud;
- contenido mostrado;
- elegibilidad reevaluada;
- decisión;
- confirmación;
- actor;
- fecha;
- resultado;
- fallo o concurrencia;
- intento de decisión por actor no autorizado.

**Decisiones o preguntas abiertas.** 1. Estados técnicos y transiciones: `DERIVAR 06`.
2. Contenido mínimo visible antes de aceptar: `DERIVAR 08`.
3. Confirmación y experiencia: `DERIVAR 10`.
4. Expiración de solicitudes: `DERIVAR 06/08`.
5. Aceptación de varios alcances: `DERIVAR 06/10`.
6. Efectos exactos si la elegibilidad cambia entre solicitud y aceptación: `DERIVAR 06/08`.

**Criterio de cierre.** El caso termina cuando el asesorado acepta o rechaza expresamente, con historia preservada y sin producir consentimiento o acceso implícitos, o cuando una excepción impide decidir sin mostrar éxito falso.

---

---

### `UC-P06` — Consultar, pausar o finalizar un vínculo

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `5.7` · **Bloque:** Bloque 02 — Vínculo profesional–asesorado

**Objetivo.** Permitir que profesional y asesorado comprendan sus relaciones propias y que un actor habilitado pause o finalice un vínculo sin borrar identidad, autoría, procedencia o historia ni transferir acceso automáticamente.

**Alcance.** - **Superficies:** profesional y APK del asesorado.
- **Inicio:** existe al menos una solicitud o vínculo propio.
- **Fin:** el actor consulta la situación o registra una pausa/finalización trazable.

**Actor principal.** Profesional o asesorado.

**Actores secundarios.** - Sistema BE.
- Contraparte del vínculo, como actor informado dentro de la visibilidad aplicable.

**Disparador.** El actor decide consultar sus relaciones o gestionar una relación existente.

**Precondiciones.** **Consulta**

1. El actor posee identidad BE y sesión válida.
2. El actor solo consulta relaciones propias.
3. BE evalúa mediante `UC-I02` el acceso a la información relacional.

**Pausa o finalización**

1. Existe un vínculo aceptado.
2. El actor está habilitado por la política aplicable para ejecutar la acción.
3. La acción identifica vínculo, alcance y motivo.
4. La situación vigente admite la transición semántica.
5. Los efectos finos sobre procesos activos se derivan a `06/08`.

**Postcondiciones de éxito.** **Consulta**

1. El asesorado puede identificar:
   - profesionales relacionados;
   - alcance y finalidad;
   - situación del vínculo;
   - condición funcional de consentimientos relevantes;
   - qué relación puede o no habilitar acceso.
2. El profesional solo consulta relaciones propias.
3. La información coincide con la autorización efectiva disponible.
4. No se revelan relaciones ajenas.

**Pausa**

1. El vínculo alcanza el resultado semántico **pausado**.
2. Se impiden nuevas operaciones incompatibles con la pausa.
3. Se conservan identidad, historia, autoría y procedencia.
4. La contraparte puede conocer la situación según la política aplicable.
5. El evento registra actor, fecha y motivo.
6. La lectura residual y la reanudación se derivan a `06/08`.

**Finalización**

1. El vínculo alcanza el resultado semántico **finalizado**.
2. Se impiden nuevas operaciones profesionales del alcance.
3. La cuenta del asesorado continúa existiendo.
4. La historia no se elimina.
5. La autoría histórica no cambia.
6. Un nuevo vínculo no recibe acceso automático a la historia.
7. El evento conserva actor, fecha y motivo.
8. La lectura posterior queda pendiente de `Q-005` y del Documento 08.

**Garantías mínimas.** - Cada actor consulta solo relaciones propias.
- Pausar o finalizar no borra cuenta ni historial.
- Finalizar un vínculo no finaliza otros vínculos.
- Finalizar Nutrición no finaliza Entrenamiento o Antropometría de forma implícita.
- Un nuevo profesional no hereda acceso del anterior.
- La autoría histórica no se reasigna.
- La procedencia no se elimina.
- Un fallo de persistencia no presenta la relación como pausada o finalizada.
- La interfaz no decide autorización.
- La consulta no se convierte en acceso a datos clínicos o profesionales no autorizados.

**Flujo principal.** *Consulta*

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

*Pausa*

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

*Finalización*

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

**Variantes.** **V01 — Consulta de solicitud pendiente**

El actor consulta una invitación o solicitud no resuelta.

**Resultado:** BE muestra que no habilita acceso y quién debe decidir.

**V02 — Consulta de vínculo aceptado sin consentimiento vigente**

El vínculo fue aceptado, pero no existe consentimiento aplicable.

**Resultado:** BE muestra que la relación existe, pero las operaciones protegidas permanecen denegadas.

**V03 — Consulta con consentimiento revocado**

El vínculo puede conservarse como relación histórica o funcional según la política, pero el consentimiento aplicable fue revocado.

**Resultado:** BE muestra que el acceso protegido no está autorizado. Los efectos exactos se desarrollan en el Bloque 03 y `08`.

**V04 — Finalización por cambio de profesional**

El asesorado finaliza una relación e inicia otra.

**Resultado:**

- conserva su identidad y evolución;
- el profesional anterior conserva autoría histórica;
- el nuevo profesional no recibe acceso automático;
- cualquier acceso nuevo depende de vínculo, consentimiento y autorización propios.

**V05 — Finalización de un solo alcance**

Existe una relación con más de un alcance.

**Resultado:** solo se finaliza el alcance seleccionado cuando el modelo aprobado lo permita. Representación técnica: `DERIVAR 06`.

**V06 — Pausa iniciada por profesional**

El profesional solicita pausar según la política aplicable.

**Resultado:** no se borran registros ni se extiende la medida a relaciones ajenas.

**V07 — Finalización iniciada por asesorado**

El asesorado finaliza su vínculo.

**Resultado:** se bloquean operaciones futuras del profesional y se preserva la cuenta.

**V08 — Relación antropométrica independiente**

El vínculo solo cubre Antropometría.

**Resultado:** la pausa o finalización afecta esa capacidad y no altera Nutrición o Entrenamiento.

**Excepciones.** **E01 — Acceso a vínculo ajeno**

El actor intenta consultar o modificar una relación que no le pertenece.

**Resultado:** BE deniega y registra el intento según política.

**E02 — Transición no admitida**

La situación vigente no admite pausa o finalización solicitada.

**Resultado:** BE no declara éxito y presenta la situación vigente.

**E03 — Actor sin facultad para pausar o finalizar**

La política no permite que ese actor ejecute la acción.

**Resultado:** BE deniega sin modificar el vínculo.

**E04 — Dependencias activas no resueltas**

Existen procesos cuya transición requiere tratamiento definido en `06/08`.

**Resultado:** BE no aplica una finalización inconsistente; presenta la condición pendiente o el recorrido necesario.

**E05 — Operación concurrente**

La relación cambió antes de confirmar.

**Resultado:** BE exige revisar de nuevo y no aplica una segunda transición contradictoria.

**E06 — Falla de persistencia o auditoría**

BE no puede confirmar la acción.

**Resultado:** la relación no aparece pausada o finalizada.

**E07 — Inconsistencia entre vínculo y autorización efectiva**

La situación presentada no coincide con la decisión de autorización.

**Resultado:** BE no permite una operación protegida basándose solo en la vista; registra la inconsistencia para tratamiento.

**E08 — Falta de motivo cuando la política lo exige**

El actor intenta confirmar sin información mínima.

**Resultado:** BE no ejecuta la acción.

**Reglas aplicables.** 1. Cada actor consulta únicamente relaciones propias.
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

**Información utilizada o generada.** **Utilizada**

- identidad del actor;
- relaciones propias;
- profesional y asesorado;
- alcance y finalidad;
- situación del vínculo;
- condición de consentimientos relevantes;
- autorización efectiva;
- dependencias funcionales;
- política aplicable.

**Generada**

- consulta registrada, cuando corresponda;
- pausa o finalización;
- actor;
- fecha;
- motivo;
- situación anterior y posterior;
- recálculo funcional;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-024 — Pausar o finalizar un vínculo`
- `RF-025 — Preservar identidad e historia al cambiar de profesional`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-022 — Revocar consentimiento y cortar accesos futuros`, como condición relacionada desarrollada en el Bloque 03. Su implementación debe preservar la asimetría: revocar consentimiento no finaliza automáticamente el vínculo.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos relacionados.** - `UC-P07 — Otorgar y consultar consentimiento específico`
- `UC-P08 — Revocar consentimiento`

**Puntos de auditoría.** - actor y relación consultada;
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

**Decisiones o preguntas abiertas.** 1. Estados y transiciones definitivas: `DERIVAR 06`.
2. Quién puede pausar o finalizar en cada situación: `DERIVAR 08`.
3. Lectura residual después de finalizar: `Q-005 / DERIVAR 08`.
4. Retención: `Q-004 / DERIVAR 08`.
5. Tratamiento de procesos activos: `Q-007 / DERIVAR 06/08`.
6. Reanudación después de pausa: `DERIVAR 06/08`.
7. Relación entre vínculo y varios alcances: `DERIVAR 06`.
8. Información exacta visible a cada actor: `DERIVAR 08/10`.
9. Auditoría de consultas: `DERIVAR 08`.
10. Tiempo efectivo de recálculo: `DERIVAR 08/11A`.

**Criterio de cierre.** El caso termina cuando el actor consulta una relación coherente con la autorización efectiva, o cuando una pausa/finalización queda registrada sin pérdida de identidad o historia, o cuando una excepción bloquea la operación sin producir una situación falsa.

---

---

### `UC-P07` — Otorgar y consultar consentimiento específico

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `6.5` · **Bloque:** Bloque 03 — Consentimiento y autorización

**Objetivo.** Permitir que el asesorado otorgue y consulte un consentimiento específico para un profesional, alcance y finalidad identificados, mediante una versión comprensible y trazable, sin convertirlo en autorización global.

**Alcance.** - **Superficie:** APK del asesorado.
- **Inicio:** existe un vínculo aceptado y un consentimiento aplicable disponible para decisión o consulta.
- **Fin:** el asesorado consulta la situación o registra un consentimiento específico sobre una versión identificable.

**Actor principal.** Asesorado.

**Actores secundarios.** - Profesional relacionado.
- Sistema BE.

**Disparador.** El asesorado decide habilitar un alcance y finalidad, o consultar sus consentimientos propios.

**Precondiciones.** 1. El asesorado posee identidad BE y sesión válida.
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

**Postcondiciones de éxito.** **Otorgamiento**

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

**Consulta**

1. El asesorado puede identificar:
   - profesional;
   - alcance;
   - finalidad;
   - situación funcional;
   - versión vigente;
   - antecedentes relevantes.
2. La información presentada coincide con la autorización efectiva.
3. No se revelan consentimientos ajenos.

**Garantías mínimas.** - Solo el asesorado otorga su consentimiento.
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

**Flujo principal.** *Otorgamiento*

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

*Consulta*

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

**Variantes.** **V01 — Consentimiento nutricional**

El alcance corresponde a Nutrición.

**Resultado:** no habilita Entrenamiento ni Antropometría.

**V02 — Consentimiento de entrenamiento**

El alcance corresponde a Entrenamiento.

**Resultado:** no habilita Nutrición ni Antropometría.

**V03 — Consentimiento antropométrico independiente**

El profesional posee únicamente capacidad antropométrica verificada.

**Resultado:** el consentimiento puede limitarse a esa capacidad y finalidad sin exigir especialidad previa.

**V04 — Mismo profesional con varios alcances**

Existe más de un alcance elegible.

**Resultado:** cada alcance y finalidad permanecen identificables; no existe consentimiento combinado implícito.

**V05 — Nueva versión aplicable**

Existe una versión posterior a la aceptada.

**Resultado:** la decisión anterior permanece asociada a la versión original. La conducta necesaria para la nueva versión se deriva a `08`, sin atribuir aceptación silenciosa.

**V06 — Consulta sin modificación**

El asesorado solo consulta su situación.

**Resultado:** no se registra una nueva aceptación.

**V07 — Consentimiento previo revocado**

Existe un antecedente revocado.

**Resultado:** el asesorado puede reconocer la revocación y, si corresponde, decidir sobre una versión disponible sin borrar el antecedente.

**Excepciones.** **E01 — Vínculo no aceptado**

No existe vínculo aceptado con el profesional.

**Resultado:** BE no permite otorgar consentimiento profesional dentro de ese recorrido.

**E02 — Versión modificada antes de confirmar**

El contenido aplicable cambió.

**Resultado:** BE no registra la decisión sobre una versión distinta y exige revisar nuevamente.

**E03 — Actor distinto del asesorado**

Un profesional, administrador o tercero intenta otorgar consentimiento.

**Resultado:** BE deniega y registra el intento según política.

**E04 — Alcance o finalidad no identificables**

La solicitud no permite saber para qué se otorga el consentimiento.

**Resultado:** BE no registra un consentimiento general o ambiguo.

**E05 — Consentimiento equivalente vigente**

Ya existe una decisión vigente equivalente.

**Resultado:** BE presenta la situación existente y evita duplicados contradictorios.

**E06 — Cambio concurrente**

Otra sesión revocó, reemplazó o modificó la situación.

**Resultado:** BE no declara éxito y exige consultar el resultado vigente.

**E07 — Falla de persistencia o auditoría**

BE no puede confirmar la decisión.

**Resultado:** no muestra consentimiento vigente ni habilita operaciones.

**E08 — Profesional no elegible al confirmar**

La situación profesional cambió.

**Resultado:** BE no presenta la decisión como autorización efectiva; conserva o rechaza el registro según la política que defina `08`.

**Reglas aplicables.** 1. El consentimiento pertenece al asesorado.
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

**Información utilizada o generada.** **Utilizada**

- identidad del asesorado;
- profesional;
- vínculo aceptado;
- alcance;
- finalidad;
- versión;
- situación de decisiones anteriores;
- elegibilidad aplicable.

**Generada**

- decisión de consentimiento;
- situación funcional;
- versión aceptada;
- fecha;
- actor;
- relación con vínculo, alcance y finalidad;
- evento de auditoría;
- recálculo de autorización.

**Requisitos relacionados.** **RF**

- `RF-020 — Otorgar consentimiento específico y versionado`
- `RF-021 — Evaluar la autorización contextual en cada operación protegida`
- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-067 — Capacidad antropométrica transversal`, cuando el alcance sea Antropometría.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos relacionados.** - `UC-P05 — Aceptar o rechazar un vínculo`
- `UC-P08 — Revocar consentimiento`

**Puntos de auditoría.** - asesorado;
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

**Decisiones o preguntas abiertas.** 1. Categorías y granularidad definitiva: `Q-003 / DERIVAR 08`.
2. Textos y evidencia informativa: `DERIVAR 08/10`.
3. Vigencia y renovación: `DERIVAR 08`.
4. Retención: `Q-004 / DERIVAR 08`.
5. Lectura residual: `Q-005 / DERIVAR 08`.
6. Contratos de versión: `DERIVAR 09`.
7. Representación técnica: `DERIVAR 06`.
8. Operaciones en curso durante cambios: `DERIVAR 08`.
9. No se fija SLA de propagación en 05.

**Criterio de cierre.** El caso termina cuando el asesorado consulta una situación coherente o registra una decisión específica, versionada y trazable, sin generar autorización global ni invadir las políticas del Documento 08.

---

---

### `UC-P08` — Revocar consentimiento

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `6.6` · **Bloque:** Bloque 03 — Consentimiento y autorización

**Objetivo.** Permitir que el asesorado revoque un consentimiento específico y produzca el corte verificable de operaciones futuras dentro de su alcance, preservando vínculo, versiones, autoría e historia.

**Alcance.** - **Superficie:** APK del asesorado.
- **Inicio:** existe un consentimiento propio vigente o consultable.
- **Fin:** la revocación queda registrada y las operaciones futuras del alcance resultan denegadas.

**Actor principal.** Asesorado.

**Actores secundarios.** - Profesional relacionado.
- Sistema BE.

**Disparador.** El asesorado decide retirar un consentimiento.

**Precondiciones.** 1. El asesorado posee identidad BE y sesión válida.
2. El consentimiento pertenece al asesorado.
3. El consentimiento identifica profesional, alcance, finalidad y versión.
4. BE evalúa mediante `UC-I02` que el actor pueda decidir sobre su propio consentimiento.
5. La situación vigente admite revocación o permite reconocer que ya fue revocada.

**Postcondiciones de éxito.** 1. Existe una decisión expresa de revocación.
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

**Garantías mínimas.** - Solo el asesorado revoca su consentimiento.
- Revocar consentimiento no finaliza automáticamente el vínculo.
- Revocar un alcance no revoca otros alcances.
- La revocación no borra la versión aceptada ni su evidencia.
- La revocación no borra la cuenta del asesorado.
- El sistema debe cortar operaciones futuras del alcance revocado.
- Un error de persistencia no muestra una revocación exitosa.
- Una vista o caché no puede conceder acceso contra la autorización vigente.
- La denegación posterior no revela información del recurso protegido.
- Los efectos sobre retención, lectura histórica y operaciones en curso pertenecen a `08`.

**Flujo principal.** 1. El asesorado consulta sus consentimientos.
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

**Variantes.** **V01 — Revocación de un alcance dentro de varios**

El asesorado posee consentimientos para más de un alcance con el mismo profesional.

**Resultado:** solo el alcance seleccionado pierde vigencia; los demás no cambian.

**V02 — Revocación antropométrica**

El consentimiento cubre capacidad antropométrica transversal.

**Resultado:** se cortan operaciones antropométricas futuras sin afectar Nutrición o Entrenamiento.

**V03 — Vínculo sin consentimientos vigentes después de revocar**

La revocación deja al vínculo sin consentimiento aplicable.

**Resultado:** el vínculo continúa existiendo, pero no habilita operaciones protegidas.

**V04 — Revocación y decisión posterior sobre el vínculo**

El asesorado desea además pausar o finalizar la relación.

**Resultado:** primero se registra la revocación; la pausa o finalización requiere una decisión separada mediante `UC-P06`.

**V05 — Consulta de revocación previa**

El asesorado consulta un antecedente ya revocado.

**Resultado:** BE muestra que no existe vigencia y no registra una segunda revocación como éxito.

**Excepciones.** **E01 — Consentimiento ya revocado**

La decisión ya existe.

**Resultado:** BE presenta la situación vigente y no duplica el evento.

**E02 — Actor no autorizado**

Un profesional, administrador o tercero intenta revocar en nombre del asesorado.

**Resultado:** BE deniega y registra el intento según política.

**E03 — Versión o alcance inconsistente**

La decisión no puede vincularse de forma inequívoca.

**Resultado:** BE no aplica una revocación general o ambigua.

**E04 — Operación concurrente**

Otra sesión modificó la situación.

**Resultado:** BE no declara éxito y presenta el resultado vigente.

**E05 — Falla de persistencia o auditoría**

BE no puede confirmar la revocación.

**Resultado:** no muestra el consentimiento como revocado y no produce una transición parcial.

**E06 — Corte futuro no verificable**

BE registra la revocación, pero la autorización efectiva no refleja el cambio.

**Resultado:** la operación protegida debe denegarse de forma conservadora y la inconsistencia se registra para tratamiento.

**E07 — Intento de usar revocación para finalizar vínculo**

Un recorrido intenta aplicar la revocación como cierre automático.

**Resultado:** BE preserva el vínculo y exige una decisión separada para pausa o finalización.

**E08 — Solicitud de borrado asociada**

El asesorado solicita además cierre de cuenta o eliminación.

**Resultado:** la revocación se registra de forma independiente; cierre, retención y supresión se derivan a sus recorridos y al Documento 08.

**Reglas aplicables.** 1. La revocación pertenece al asesorado.
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

**Información utilizada o generada.** **Utilizada**

- identidad del asesorado;
- profesional;
- vínculo;
- consentimiento vigente;
- alcance;
- finalidad;
- versión;
- situación de autorización.

**Generada**

- decisión de revocación;
- fecha;
- actor;
- versión afectada;
- situación posterior;
- recálculo de autorización;
- denegaciones posteriores;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-022 — Revocar consentimiento y cortar accesos futuros`
- `RF-020 — Consentimiento específico y versionado`
- `RF-021 — Autorización contextual`
- `RF-023 — Consultar vínculos y consentimientos propios`
- `RF-024 — Pausar o finalizar vínculo`, como decisión separada.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos relacionados.** - `UC-P06 — Consultar, pausar o finalizar un vínculo`
- `UC-P07 — Otorgar y consultar consentimiento específico`

**Puntos de auditoría.** - asesorado;
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

**Decisiones o preguntas abiertas.** 1. Retención: `Q-004 / DERIVAR 08`.
2. Lectura posterior: `Q-005 / DERIVAR 08`.
3. Granularidad y categorías: `Q-003 / DERIVAR 08`.
4. Operaciones en curso: `DERIVAR 08`.
5. Tiempo y mecanismo de propagación: `DERIVAR 08/09/11A`.
6. Información visible al profesional: `DERIVAR 08/10`.
7. Efectos sobre procesos abiertos: `DERIVAR 06/08`.
8. Cierre o eliminación de cuenta: `UC-P27 / DERIVAR 08`.
9. No se fija SLA en 05.

**Criterio de cierre.** El caso termina cuando la revocación queda registrada, las operaciones futuras resultan denegadas y el vínculo y la historia permanecen preservados, o cuando una excepción impide la decisión sin mostrar un estado falso.

---

---

### `UC-P09` — Registrar evaluación y objetivo nutricional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `7.5` · **Bloque:** Bloque 04 — Circuito nutricional hasta ejecución

**Objetivo.** Permitir que un profesional de Nutrición autorizado registre una evaluación pertinente y un objetivo vigente, identificables y relacionados, como base del diseño del plan nutricional.

**Alcance.** - **Superficie:** profesional.
- **Canal previsto:** Website.
- **Inicio:** existe vínculo aceptado, consentimiento aplicable y autorización favorable.
- **Fin:** evaluación y objetivo quedan registrados o actualizados sin sobrescribir antecedentes.

**Actor principal.** Profesional de Nutrición.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional inicia o actualiza la base de planificación nutricional.

**Precondiciones.** 1. El profesional posee Nutrición `VERIFICADA`.
2. Existe habilitación aplicable.
3. Existe vínculo aceptado con el asesorado.
4. Existe consentimiento vigente para el alcance y finalidad.
5. `UC-I02` autoriza la operación.
6. El profesional puede identificar el contexto y las fuentes utilizadas.
7. La estructura de datos pertenece a `DERIVAR 06`.

**Postcondiciones de éxito.** 1. La evaluación queda asociada a:
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

**Garantías mínimas.** - Registrar una evaluación no activa un plan.
- La evaluación no se presenta como diagnóstico.
- El objetivo no se genera automáticamente.
- El objetivo no fija valores o fórmulas desde 05.
- Un dato calculado no se presenta como observado.
- Las fuentes permanecen identificables.
- Un fallo no muestra una evaluación u objetivo exitosos.
- Otro profesional o vínculo no obtiene acceso implícito.
- Cambiar el objetivo no altera retrospectivamente planes emitidos.

**Flujo principal.** 1. El profesional selecciona al asesorado dentro de una relación autorizada.
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

**Variantes.** **V01 — Primera evaluación**

No existe evaluación anterior.

**Resultado:** se crea la base inicial del proceso nutricional.

**V02 — Evaluación de seguimiento**

Existe una evaluación previa.

**Resultado:** se agrega un nuevo antecedente relacionado sin reemplazar silenciosamente el anterior.

**V03 — Actualización del objetivo**

La evaluación continúa siendo pertinente, pero el objetivo cambia.

**Resultado:** se registra un objetivo nuevo o actualizado con relación trazable al anterior.

**V04 — Información de fuentes diferentes**

La evaluación utiliza información declarada por el asesorado, observación profesional y cálculos.

**Resultado:** BE conserva su tipo y procedencia sin fusionarlos como si fueran equivalentes.

**V05 — Consulta del objetivo por el asesorado**

El asesorado consulta la formulación autorizada.

**Resultado:** ve el objetivo vigente y no información administrativa ajena.

**V06 — Ejecutar método profesional de apoyo**

El profesional decide utilizar uno o más métodos pertinentes como apoyo para interpretar la evaluación o fundamentar el objetivo.

**Resultado:** BE ejecuta `UC-I13`; cada resultado conserva método, versión, inputs y procedencia, y ninguno se convierte automáticamente en objetivo nutricional, requerimiento, prescripción o plan.

**Excepciones.** **E01 — Autorización desfavorable**

Falta una dimensión de `UC-I02`.

**Resultado:** BE no permite registrar ni consultar información protegida.

**E02 — Contexto o fuente no identificables**

La evaluación no permite reconocer procedencia suficiente.

**Resultado:** BE no registra el elemento como completo y solicita corrección sin inventar la fuente.

**E03 — Objetivo sin relación con evaluación**

No se identifica la evaluación base.

**Resultado:** BE no presenta el objetivo como vigente.

**E04 — Actualización que sobrescribiría antecedentes**

La operación intenta reemplazar silenciosamente una evaluación u objetivo anteriores.

**Resultado:** BE exige una nueva versión o antecedente.

**E05 — Falla de persistencia o auditoría**

BE no puede confirmar el registro.

**Resultado:** no muestra éxito y no habilita el diseño como si existiera una base válida.

**E06 — Intento de contenido automático**

Un recorrido intenta generar el objetivo sin decisión profesional.

**Resultado:** BE no lo registra como objetivo profesional válido.

**Reglas aplicables.** 1. La evaluación es pertinente al proceso y no historia clínica completa.
2. El objetivo se relaciona con una evaluación.
3. Objetivo y evaluación conservan autoría y fecha.
4. La procedencia se conserva.
5. Los cambios no reescriben antecedentes.
6. No se fija contenido nutricional en 05.
7. La evaluación no equivale a plan.
8. El objetivo no equivale a plan activado.
9. El asesorado consulta únicamente la formulación autorizada.
10. La estructura técnica pertenece a `06`.

**Información utilizada o generada.** **Utilizada**

- identidad y especialidad del profesional;
- vínculo;
- consentimiento;
- contexto autorizado;
- antecedentes disponibles;
- fuentes pertinentes.

**Generada**

- evaluación;
- objetivo vigente;
- autoría;
- fecha;
- fundamento;
- relaciones con antecedentes;
- eventos de auditoría.

**Requisitos relacionados.** **RF**

- `RF-026 — Registrar una evaluación nutricional`
- `RF-029 — Definir un objetivo nutricional vigente`
- `RF-021 — Evaluar autorización contextual`
- `RF-025 — Preservar identidad e historia`
- `RF-070 — Utilizar métodos profesionales de cálculo reproducible`, cuando corresponda.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I13 — Ejecutar y adoptar cálculo profesional reproducible`, cuando corresponda.

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Campos y estructura: `DERIVAR 06`.
2. Categorías de datos y minimización: `DERIVAR 08`.
3. Presentación: `DERIVAR 10`.
4. Contratos: `DERIVAR 09`.
5. Vigencia técnica: `DERIVAR 06`.
6. No se fijan fórmulas o contenido prescriptivo.

**Criterio de cierre.** El caso termina cuando evaluación y objetivo quedan relacionados, autorizados y trazables, o cuando una excepción impide el registro sin producir una base de planificación falsa.

---

---

### `UC-P10` — Diseñar plan nutricional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `7.6` · **Bloque:** Bloque 04 — Circuito nutricional hasta ejecución

**Objetivo.** Permitir que el profesional construya y retome un plan nutricional en borrador usando catálogo propio, carga manual e importación controlada, sin depender de Open Food Facts ni hacer visible el borrador como plan vigente.

**Alcance.** - **Superficie:** profesional.
- **Inicio:** existe evaluación y objetivo utilizables.
- **Fin:** existe un borrador guardado y apto para validación posterior, o la operación se conserva incompleta sin activación.

**Actor principal.** Profesional de Nutrición.

**Actores secundarios.** - Administrador autorizado para catálogo propio.
- Open Food Facts como proveedor externo.
- Sistema BE.

**Disparador.** El profesional inicia o continúa el diseño de un plan nutricional.

**Precondiciones.** 1. Se cumplen vínculo, consentimiento y autorización.
2. El profesional posee Nutrición verificada y habilitación aplicable.
3. Existe evaluación y objetivo relacionados.
4. BE dispone de catálogo propio y carga manual.
5. Open Food Facts es opcional para cada operación y no fuente única.
6. La estructura de plan y catálogo pertenece a `DERIVAR 06`.

**Postcondiciones de éxito.** 1. Existe un borrador identificable.
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

**Garantías mínimas.** - El borrador no es una versión activada.
- El catálogo propio continúa disponible durante una caída externa.
- La carga manual continúa disponible.
- La integración no incorpora datos automáticamente sin revisión.
- La procedencia no se pierde al incorporar un elemento.
- Un elemento rechazado no aparece como incorporado.
- Una caída externa no produce datos inventados.
- Guardar un borrador no ocupa una nueva vigencia.
- Un fallo no muestra el borrador como activado.
- La estructura concreta se deriva a 06.

**Flujo principal.** 1. El profesional accede al proceso autorizado.
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

**Variantes.** **V01 — Solo catálogo propio**

El profesional no consulta Open Food Facts.

**Resultado:** diseña y guarda normalmente.

**V02 — Carga manual**

El elemento requerido no existe.

**Resultado:** el profesional puede incorporarlo manualmente con procedencia propia identificable.

**V03 — Importación controlada**

Open Food Facts responde y el dato es utilizable.

**Resultado:** el profesional revisa y decide antes de incorporarlo.

**V04 — Dato externo insuficiente**

La respuesta externa no cumple los mínimos aplicables.

**Resultado:** se corrige manualmente o se rechaza; no se incorpora ciegamente.

**V05 — Open Food Facts indisponible**

El proveedor falla o no responde.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia, registra el fallback y permite continuar con catálogo propio o carga manual.

**V06 — Retomar borrador**

Existe un borrador previo.

**Resultado:** el profesional continúa sin crear una vigencia nueva ni alterar versiones activadas.

**V07 — Edición posterior a una activación**

Existe una versión activa y el profesional necesita cambiar el plan.

**Resultado:** trabaja sobre un nuevo borrador o continuidad; la instantánea activada permanece intacta.

**Excepciones.** **E01 — Falta de autorización**

BE deniega sin exponer información protegida.

**E02 — Evaluación u objetivo no disponibles**

Falta la base requerida.

**Resultado:** no se presenta el borrador como apto para activar.

**E03 — Procedencia externa perdida**

BE no puede identificar proveedor o fecha.

**Resultado:** no incorpora el elemento como importado.

**E04 — Importación duplicada o contradictoria**

Existe un elemento equivalente incompatible.

**Resultado:** BE evita un duplicado silencioso y solicita decisión profesional.

**E05 — Proveedor externo falla después de mostrar datos**

BE no puede completar la importación.

**Resultado:** no declara incorporación exitosa y conserva el borrador.

**E06 — Falla de persistencia o auditoría**

BE no confirma el guardado.

**Resultado:** no presenta una versión inexistente.

**E07 — Intento de alterar retrospectivamente un plan emitido**

Un cambio de catálogo afectaría una versión activada.

**Resultado:** BE preserva la instantánea histórica y aplica el cambio solo hacia adelante.

**Reglas aplicables.** 1. BE mantiene catálogo propio.
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

**Información utilizada o generada.** **Utilizada**

- evaluación;
- objetivo;
- catálogo propio;
- carga manual;
- respuesta externa;
- procedencia;
- antecedentes del borrador.

**Generada**

- borrador;
- elementos incorporados;
- decisión de importación;
- proveedor;
- fecha;
- registro de fallback;
- autoría;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-027 — Gestionar catálogo nutricional propio`
- `RF-028 — Importar alimentos desde Open Food Facts`
- `RF-030 — Crear y editar un plan nutricional en borrador`
- `RF-059 — Continuar el núcleo ante fallas de terceros`
- `RF-060 — Consultar la procedencia de datos externos`
- `RF-021 — Evaluar autorización contextual`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I07 — Importar elemento externo con revisión controlada`, cuando se usa el proveedor.
- `UC-I08 — Aplicar fallback manual y conservar procedencia`, ante contingencia.

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Estructura del catálogo y plan: `DERIVAR 06`.
2. Normalización: `DERIVAR 06`.
3. Licencia y gobierno de procedencia: `DERIVAR 08`.
4. Adaptador: `DERIVAR 07`.
5. Contrato: `DERIVAR 09`.
6. Editor: `DERIVAR 10`.
7. No se fijan categorías alimentarias o contenido nutricional.

**Criterio de cierre.** El caso termina cuando existe un borrador guardado con procedencia preservada y continuidad operativa ante fallas externas, o cuando una excepción impide avanzar sin activar ni inventar datos.

---

---

### `UC-P11` — Validar y activar plan nutricional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `7.7` · **Bloque:** Bloque 04 — Circuito nutricional hasta ejecución

**Objetivo.** Permitir que el profesional valide y active una versión reproducible del plan nutricional, preservando una instantánea consultable e inmutable hacia atrás y aplicando autorización y capacidad sin interrumpir procesos vigentes.

**Alcance.** - **Superficie:** profesional.
- **Inicio:** existe un borrador asociado a evaluación y objetivo.
- **Fin:** una versión queda activada y consultable, o la activación se rechaza sin alterar la vigencia existente.

**Actor principal.** Profesional de Nutrición.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional considera que el borrador está listo para emitirse.

**Precondiciones.** 1. El profesional posee Nutrición verificada.
2. Existe habilitación aplicable.
3. Vínculo y consentimiento están vigentes.
4. `UC-I02` autoriza la activación.
5. Existe borrador identificable.
6. Existen evaluación y objetivo relacionados.
7. `UC-I10` puede evaluar capacidad configurada.
8. La estructura de validación y snapshot pertenece a `DERIVAR 06`.

**Postcondiciones de éxito.** 1. El borrador supera la validación aplicable.
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

**Garantías mínimas.** - Un plan inválido no se activa.
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

**Flujo principal.** 1. El profesional abre el borrador.
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

**Variantes.** **V01 — Primera activación**

No existe plan activo.

**Resultado:** se crea la primera versión vigente.

**V02 — Sustitución trazable posterior**

Existe una versión activa y un nuevo borrador validado.

**Resultado:** la nueva activación conserva la versión anterior y establece continuidad sin reescribirla.

**V03 — Capacidad alcanzada con proceso vigente**

El profesional ya alcanzó la banda, pero revisa o continúa procesos existentes.

**Resultado:** BE no interrumpe procesos vigentes; solo rechaza la activación de un proceso nuevo que exceda la capacidad configurada.

**V04 — Borrador corregido después de validación fallida**

El profesional corrige inconsistencias.

**Resultado:** vuelve a validar sin crear una versión activa prematura.

**V05 — Activación después de importar elementos**

El borrador utiliza datos importados.

**Resultado:** la instantánea conserva lo emitido y su procedencia, aunque el catálogo cambie después.

**Excepciones.** **E01 — Plan inválido**

La validación detecta inconsistencias.

**Resultado:** no se activa y se informan condiciones corregibles sin fijar contenido nutricional.

**E02 — Autorización desfavorable**

Falla vínculo, consentimiento, especialidad, finalidad o alcance.

**Resultado:** no se activa.

**E03 — Capacidad configurada excedida**

La activación abriría un proceso nuevo por encima de la banda.

**Resultado:** BE rechaza la nueva activación y conserva todos los procesos vigentes.

**E04 — Vigencia contradictoria**

La operación produciría dos versiones vigentes incompatibles.

**Resultado:** BE no activa hasta resolver la transición según `06`.

**E05 — Borrador modificado concurrentemente**

La versión validada no coincide con la confirmada.

**Resultado:** BE exige revisar y validar nuevamente.

**E06 — Falla al preservar la instantánea**

BE no puede reconstruir exactamente lo que quedaría emitido.

**Resultado:** no activa.

**E07 — Falla de persistencia o auditoría**

BE no confirma la operación completa.

**Resultado:** no muestra una versión activa parcial.

**E08 — Intento de editar la versión activada**

El profesional intenta cambiar directamente el histórico.

**Resultado:** BE exige un nuevo borrador o continuidad trazable.

**Reglas aplicables.** 1. Activación requiere validación favorable.
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

**Información utilizada o generada.** **Utilizada**

- borrador;
- evaluación;
- objetivo;
- procedencia;
- autorización;
- habilitación;
- capacidad configurada;
- versión activa previa.

**Generada**

- resultado de validación;
- versión activada;
- instantánea reproducible;
- fecha;
- autor;
- continuidad con versión anterior;
- evento de capacidad;
- auditoría.

**Requisitos relacionados.** **RF**

- `RF-031 — Validar, versionar y activar un plan nutricional`
- `RF-066 — Representar habilitaciones y capacidad sin cobro real`
- `RF-021 — Evaluar autorización contextual`
- `RF-027` y `RF-060`, por preservación de procedencia.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I04 — Validar y versionar un plan`
- `UC-I10 — Verificar habilitación y capacidad`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Invariantes de validación: `DERIVAR 06`.
2. Estados y transiciones: `DERIVAR 06`.
3. Estructura de instantánea: `DERIVAR 06`.
4. Comportamiento sin banda configurada: `DERIVAR 06`.
5. Autorización: `DERIVAR 08`.
6. Contratos: `DERIVAR 09`.
7. Confirmación y presentación: `DERIVAR 10`.
8. Concurrencia: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando una versión válida, reproducible y coherente queda activada, o cuando la operación se rechaza sin modificar la vigencia ni interrumpir procesos existentes.

---

---

### `UC-P12` — Consultar y registrar ejecución nutricional en APK

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `7.8` · **Bloque:** Bloque 04 — Circuito nutricional hasta ejecución

**Objetivo.** Permitir que el asesorado consulte desde la APK qué corresponde realizar según la versión nutricional activa y registre evidencia simple de adherencia o ejecución asociada a esa versión.

**Alcance.** - **Superficie:** APK del asesorado.
- **Inicio:** el asesorado accede a Hoy o a la función prevista.
- **Fin:** consulta la versión vigente y, cuando corresponde, registra evidencia sin duplicados observables.

**Actor principal.** Asesorado.

**Actores secundarios.** - Profesional de Nutrición autorizado.
- Sistema BE.

**Disparador.** El asesorado necesita consultar o registrar lo realizado.

**Precondiciones.** 1. El asesorado posee sesión válida.
2. La operación se alcanza desde la navegación prevista.
3. `UC-I02` autoriza la consulta o escritura.
4. Para consultar contenido existe una versión activada o un estado claro de ausencia.
5. Para registrar evidencia existe una referencia válida al plan y al asesorado.

**Postcondiciones de éxito.** **Consulta**

1. El asesorado ve exactamente la versión activada.
2. Puede reconocer qué versión está vigente.
3. Si no existe plan activo, recibe un estado claro.
4. No ve borradores ni información administrativa.
5. No necesita conocer rutas internas.

**Registro**

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

**Garantías mínimas.** - La APK no muestra un borrador como vigente.
- La consulta reproduce la instantánea activada.
- Un cambio posterior no modifica lo que el asesorado ejecutó.
- No se fija un score de adherencia en 05.
- No se infiere resultado corporal.
- Registrar evidencia no modifica el plan.
- Un reintento no duplica el hecho observable.
- La interfaz no concede autorización.
- Un consentimiento revocado deniega operaciones futuras.
- Un fallo no muestra el registro como exitoso.

**Flujo principal.** *Consulta*

1. El asesorado inicia sesión en la APK.
2. Accede a Hoy desde la navegación prevista.
3. BE ejecuta `UC-I02`.
4. BE identifica la versión nutricional activa.
5. BE presenta exactamente la instantánea reproducible vigente.
6. BE evita mostrar borradores o información administrativa.
7. El asesorado consulta qué corresponde realizar.
8. El caso puede finalizar sin registrar evidencia.

*Registro*

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

**Variantes.** **V01 — Consulta sin plan activo**

No existe versión vigente.

**Resultado:** BE muestra un estado claro y no inventa contenido.

**V02 — Consulta después de sustitución**

Existe una versión nueva activada.

**Resultado:** BE muestra la nueva versión; la ejecución anterior permanece asociada a la versión anterior.

**V03 — Registro con observación**

El asesorado agrega una observación opcional.

**Resultado:** queda asociada al mismo hecho y versión.

**V04 — Reintento después de pérdida de conectividad**

El asesorado repite una acción cuyo resultado no pudo confirmar.

**Resultado:** BE evita un duplicado observable y devuelve el resultado vigente.

**V05 — Solo consulta**

El asesorado no registra evidencia.

**Resultado:** no se crea un hecho de ejecución por abrir la pantalla.

**Excepciones.** **E01 — Autorización desfavorable**

BE deniega consulta o registro sin filtrar contenido.

**E02 — Versión activa no reproducible**

BE no puede presentar exactamente lo emitido.

**Resultado:** no reconstruye usando datos actuales; informa una incidencia segura.

**E03 — Referencia de plan obsoleta**

El asesorado intenta registrar contra una versión que ya no corresponde.

**Resultado:** BE no reasigna silenciosamente el registro y solicita actualizar el contexto.

**E04 — Reintento duplicado**

Existe evidencia equivalente.

**Resultado:** BE devuelve el resultado existente sin crear otro hecho.

**E05 — Falla de persistencia o auditoría**

BE no confirma el registro.

**Resultado:** no muestra éxito.

**E06 — Consentimiento revocado**

El vínculo continúa, pero el consentimiento ya no está vigente.

**Resultado:** `UC-I02` deniega la operación futura.

**E07 — Acceso a información administrativa**

La respuesta intentaría exponer datos no destinados al asesorado.

**Resultado:** BE limita la información a la superficie autorizada.

**Reglas aplicables.** 1. La APK muestra la versión activada.
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

**Información utilizada o generada.** **Utilizada**

- identidad del asesorado;
- vínculo;
- consentimiento;
- autorización;
- versión activada;
- instantánea reproducible;
- fecha;
- antecedente de reintento.

**Generada**

- consulta de versión;
- evidencia de adherencia o ejecución;
- observación opcional;
- relación con plan y versión;
- fecha;
- autor;
- resultado de idempotencia;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-032 — Consultar el plan nutricional del día en la APK`
- `RF-033 — Registrar adherencia o ejecución nutricional`
- `RF-021 — Evaluar autorización contextual`
- `RF-031 — Consultar exactamente la versión activada`
- `RF-007 — Acceder por la superficie prevista`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-002`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

**Casos relacionados.** - `UC-P11 — Validar y activar plan nutricional`
- `UC-P13 — Revisar evidencia y decidir continuidad nutricional`

**Puntos de auditoría.** - asesorado;
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

**Decisiones o preguntas abiertas.** 1. Read model y contrato: `DERIVAR 09`.
2. Diseño de Hoy: `DERIVAR 10`.
3. Dato y unicidad: `DERIVAR 06`.
4. Concurrencia e idempotencia: `DERIVAR 11A`.
5. Auditoría de consultas: `DERIVAR 08`.
6. No se fija score o fórmula de adherencia.

**Criterio de cierre.** El caso termina cuando el asesorado consulta la versión correcta y, si decide registrar, la evidencia queda asociada sin duplicados observables, o cuando una excepción bloquea la operación sin mostrar contenido o éxito falsos.

---

---

### `UC-P13` — Revisar evidencia y decidir continuidad nutricional

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `8.6` · **Bloque:** Bloque 05 — Revisión y continuidad nutricional

**Objetivo.** Permitir que un profesional de Nutrición cierre un período o ciclo revisable mediante una revisión profesional válida vinculada a evidencia y determine una próxima acción o cierre sin editar silenciosamente la historia.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe evidencia nutricional disponible para un período o ciclo identificable.
- **Fin:** existe una revisión profesional válida y una continuidad o cierre trazable, o una excepción impide registrar la revisión sin producir un cierre falso.

**Actor principal.** Profesional de Nutrición.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional consulta una revisión pendiente o decide revisar un período nutricional con evidencia disponible.

**Precondiciones.** 1. El profesional posee Nutrición `VERIFICADA` y habilitación aplicable.
2. Existe vínculo aceptado y consentimiento vigente para el alcance y finalidad.
3. `UC-I02` autoriza la operación.
4. Existe un plan activo o un ciclo nutricional revisable.
5. El dominio y período pueden identificarse.
6. Existe evidencia relevante y accesible.
7. La evidencia conserva relación con asesorado, fecha, autor y versión del plan.
8. La revisión no se presume por el solo acceso a la información.

**Postcondiciones de éxito.** 1. Existe una revisión profesional válida conforme a `DEC-043`.
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

**Garantías mínimas.** - Sin evidencia identificable no existe revisión válida.
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

**Flujo principal.** 1. El profesional accede a sus ciclos nutricionales pendientes de revisión.
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

**Variantes.** **V01 — Mantener la estrategia vigente**

El profesional selecciona `MANTENER`.

**Resultado:** se conserva la estrategia vigente y se registra una próxima revisión u otra acción válida, sin crear una edición silenciosa.

**V02 — Ajustar planificación**

El profesional selecciona `AJUSTAR`.

**Resultado:** la continuidad identifica qué acción de ajuste debe realizarse. Si el ajuste exige nueva versión, la gestión de versiones aplica el patrón aprobado; la transición técnica pertenece a `06`.

**V03 — Sustituir planificación**

El profesional selecciona `SUSTITUIR`.

**Resultado:** la planificación anterior se conserva y la próxima acción identifica la creación o activación de una versión sucesora.

**V04 — Reprogramar revisión**

El profesional selecciona `REPROGRAMAR_REVISION`.

**Resultado:** se registra la próxima revisión como acción trazable; la representación temporal definitiva pertenece a `06`.

**V05 — Cambiar objetivo**

El profesional selecciona `CAMBIAR_OBJETIVO`.

**Resultado:** la próxima acción conduce a una nueva versión del objetivo sin sobrescribir el objetivo histórico.

**V06 — Finalizar correctamente**

El profesional selecciona `FINALIZAR`.

**Resultado:** el plan o ciclo deja de admitir nueva ejecución conforme a la transición que defina `06`; evidencia y revisión permanecen consultables según `08`.

**V07 — Iniciar un nuevo bloque o período**

La decisión de dominio se expresa mediante `AJUSTAR` o `SUSTITUIR`, según conserve o genere una nueva versión.

**Resultado:** no se crea un séptimo resultado semántico.

**V08 — Programar una revisión sin cambiar el plan**

La acción se expresa mediante `REPROGRAMAR_REVISION`.

**Resultado:** el plan no se modifica y queda una próxima acción trazable.

**V09 — Evidencia de varias fechas**

El profesional selecciona evidencia dentro del período revisado.

**Resultado:** cada referencia permanece identificable; el sistema no resume silenciosamente evidencia no seleccionada como si hubiera sido examinada.

**Excepciones.** **E01 — Evidencia insuficiente o no identificable**

No existe evidencia suficiente o no puede reconstruirse su relación con el período.

**Resultado:** BE no guarda una revisión válida ni cierra el ciclo.

**E02 — Abrir dashboard o visualizar información**

El profesional abre o consulta la información, pero no registra los componentes obligatorios.

**Resultado:** BE puede registrar la consulta según política, pero no crea una revisión profesional válida.

**E03 — Nota libre aislada**

El profesional guarda una nota sin resultado, fundamento y próxima acción.

**Resultado:** la nota no se clasifica como revisión y no resuelve el pendiente.

**E04 — Modificación silenciosa del plan**

El profesional intenta cambiar una versión activa o histórica sin registrar revisión y continuidad.

**Resultado:** BE impide la modificación silenciosa; el cambio debe seguir los casos de revisión y versionado aplicables.

**E05 — Resultado ausente o fuera de taxonomía**

No se selecciona uno de los seis resultados semánticos.

**Resultado:** BE no guarda la revisión como válida.

**E06 — Fundamento o próxima acción ausentes**

La revisión no contiene fundamento o no determina próxima acción/cierre.

**Resultado:** BE no cierra el ciclo.

**E07 — Interpretación diagnóstica**

El contenido se presenta como diagnóstico o afirmación clínica no admitida.

**Resultado:** BE no confirma la revisión dentro del alcance del MVP y orienta a corregir el registro según la política posterior.

**E08 — Profesional no autorizado o dominio incompatible**

El actor no posee autorización nutricional aplicable.

**Resultado:** BE deniega sin revelar información protegida.

**E09 — Conflicto de versión o evidencia**

El plan, la evidencia o el ciclo cambiaron antes de confirmar.

**Resultado:** BE no registra una revisión sobre un contexto obsoleto y exige revisar nuevamente.

**E10 — Falla de persistencia o auditoría**

BE no puede preservar revisión, continuidad y auditoría de forma coherente.

**Resultado:** no marca el ciclo como cerrado ni modifica la situación vigente.

**E11 — Continuidad incompatible**

El resultado y la próxima acción se contradicen o no pueden aplicarse.

**Resultado:** BE no registra un cierre parcial y solicita una combinación válida.

**E12 — Revocación o finalización concurrente del vínculo**

El acceso deja de ser válido antes de confirmar.

**Resultado:** BE deniega la operación y conserva cualquier borrador conforme a la política que definan `08/10`.

**Reglas aplicables.** 1. `DEC-043` gobierna la definición de revisión válida.
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

**Información utilizada o generada.** **Utilizada**

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

**Generada**

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

**Requisitos relacionados.** **RF principales**

- `RF-034 — Revisar y decidir sobre evidencia nutricional`
- `RF-035 — Mantener, sustituir o cerrar plan nutricional`
- `RF-056 — Registrar revisión profesional válida y próxima acción`

**RF transversales o relacionados**

- `RF-021 — Evaluar autorización contextual`
- `RF-054 — Construir línea temporal longitudinal`
- `RF-055 — Identificar revisiones pendientes`
- `RF-058 — Calcular TVCC-30 de manera reproducible`, como consumidor analítico posterior.
- `RF-066 — Capacidad académica`, cuando la próxima acción abre un proceso nuevo.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-INT-002`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`

**Casos relacionados.** - `UC-P09 — Registrar evaluación y objetivo nutricional`
- `UC-P10 — Diseñar plan nutricional`
- `UC-P11 — Validar y activar plan nutricional`
- `UC-P12 — Consultar y registrar ejecución nutricional en APK`
- `UC-S01 — Obtener TVCC-30 de manera reproducible`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Taxonomía técnica y estados: `DERIVAR 06`.
2. Evento exacto que cierra seguimiento: `Q-007 / DERIVAR 06`.
3. Lectura histórica después de cierre: `DERIVAR 08`.
4. Corrección de una revisión: `DERIVAR 06/08`.
5. Contenido mínimo y validaciones: `DERIVAR 11A`.
6. Formulario y carga profesional: `DERIVAR 10`.
7. Concurrencia y contratos: `DERIVAR 09`.
8. Fórmula y elegibilidad de TVCC-30: `DERIVAR 06/12`.
9. Validación de DEC-043: obligatoria antes de G4.

**Criterio de cierre.** El caso termina cuando existe una revisión profesional válida y una continuidad o cierre explícitos, preservados y trazables; o cuando una excepción impide registrarlos sin marcar falsamente el ciclo como cerrado.

---

---

### `UC-P14` — Registrar evaluación y objetivo de entrenamiento

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `9.6` · **Bloque:** Bloque 06 — Circuito de entrenamiento

**Objetivo.** Permitir que un profesional de Entrenamiento registre una evaluación identificable y determine un objetivo de entrenamiento versionado y fundamentado que sirva de base para la planificación.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe un asesorado autorizado para evaluación de Entrenamiento.
- **Fin:** existe una evaluación preservada y un objetivo vigente o un borrador guardado sin declaración falsa de completitud.

**Actor principal.** Profesional de Entrenamiento.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional inicia o continúa una evaluación de Entrenamiento.

**Precondiciones.** 1. El profesional posee Entrenamiento `VERIFICADO`.
2. Existe habilitación aplicable.
3. Existe vínculo aceptado.
4. Existe consentimiento vigente para Entrenamiento.
5. `UC-I02` autoriza la operación.
6. El asesorado y el período de evaluación son identificables.
7. La evaluación no se confunde con diagnóstico.
8. El objetivo no se presume por la existencia de un plan previo.

**Postcondiciones de éxito.** 1. La evaluación queda asociada a:
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

**Garantías mínimas.** - RF-064 queda cubierto explícitamente.
- Evaluación y objetivo son conceptos diferentes.
- El objetivo pertenece al dominio de Entrenamiento.
- No se fijan series, repeticiones, cargas o fórmulas.
- La evaluación no diagnostica.
- La procedencia se conserva.
- Un dato ausente no se inventa.
- Un borrador no se presenta como evaluación completa.
- Un error de persistencia no muestra éxito.
- Otro dominio no cambia implícitamente.

**Flujo principal.** 1. El profesional selecciona al asesorado.
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

**Variantes.** **V01 — Guardar evaluación incompleta**

El profesional guarda información disponible sin declarar cierre.

**Resultado:** existe un borrador retomable y no un objetivo vigente nuevo.

**V02 — Actualizar objetivo**

El profesional registra un objetivo sucesor.

**Resultado:** el objetivo anterior permanece reconstruible.

**V03 — Reutilizar información autorizada**

El profesional consulta contexto previo pertinente.

**Resultado:** la información conserva procedencia y no se convierte en dato propio del dominio sin decisión explícita.

**V04 — Sin objetivo nuevo**

La evaluación confirma que el objetivo vigente continúa siendo aplicable.

**Resultado:** la continuidad se registra de manera explícita; no se duplica una versión equivalente.

**V05 — Ejecutar método profesional de apoyo**

El profesional decide utilizar uno o más métodos pertinentes como apoyo para la evaluación o fundamentación del objetivo.

**Resultado:** BE ejecuta `UC-I13`; cada resultado conserva método, versión, inputs y procedencia y no determina automáticamente el objetivo, la prescripción ni el plan de entrenamiento.

**Excepciones.** **E01 — Profesional no autorizado**

**Resultado:** BE deniega sin revelar información protegida.

**E02 — Evaluación sin período o autoría**

**Resultado:** no se guarda como evaluación completa.

**E03 — Objetivo sin fundamento**

**Resultado:** no se declara vigente.

**E04 — Intento de sobrescritura**

**Resultado:** BE conserva el objetivo anterior y exige una nueva versión.

**E05 — Interpretación diagnóstica**

**Resultado:** no se confirma dentro del alcance del MVP.

**E06 — Conflicto concurrente**

**Resultado:** BE no aplica cambios sobre contexto obsoleto.

**E07 — Falla de persistencia o auditoría**

**Resultado:** no se declara evaluación u objetivo guardados.

**Reglas aplicables.** 1. `RF-036` y `RF-064` pertenecen a UC-P14.
2. Evaluación y objetivo se versionan.
3. El objetivo requiere fundamento.
4. La evaluación es no diagnóstica.
5. El contenido profesional no se fija en 05.
6. La procedencia se conserva.
7. Una actualización no sobrescribe historia.
8. La planificación requiere una base evaluativa identificable.
9. UI y estructura pertenecen a 10 y 06.

**Información utilizada o generada.** **Utilizada**

- identidad del profesional;
- asesorado;
- vínculo y consentimiento;
- contexto autorizado;
- evaluaciones anteriores;
- objetivo anterior;
- período.

**Generada**

- evaluación;
- objetivo;
- fundamento;
- versión;
- autoría;
- fecha;
- procedencia;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-036 — Registrar evaluación de entrenamiento`
- `RF-064 — Registrar objetivo de entrenamiento`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`
- `RF-070 — Utilizar métodos profesionales de cálculo reproducible`, cuando corresponda.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I13 — Ejecutar y adoptar cálculo profesional reproducible`, cuando corresponda.
- `UC-I12 — Registrar corrección trazable`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Campos definitivos: `DERIVAR 06`.
2. Vigencia técnica: `DERIVAR 06`.
3. Política de corrección: `DERIVAR 08`.
4. Formulario: `DERIVAR 10`.
5. Contenido mínimo: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando evaluación y objetivo quedan preservados y disponibles para planificación, o cuando una excepción impide guardarlos sin producir una base falsa.

---

---

### `UC-P15` — Diseñar plan de entrenamiento

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `9.7` · **Bloque:** Bloque 06 — Circuito de entrenamiento

**Objetivo.** Permitir que el profesional construya y retome un plan de entrenamiento en borrador mediante catálogo propio, carga manual e importación controlada desde wger, conservando procedencia y sin fijar contenido profesional en Documento 05.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe evaluación y objetivo aplicables.
- **Fin:** existe una versión de plan en borrador guardada y reconstruible.

**Actor principal.** Profesional de Entrenamiento.

**Actores secundarios.** - Sistema BE.
- wger como proveedor externo.

**Disparador.** El profesional inicia o continúa la planificación.

**Precondiciones.** 1. El profesional está autorizado.
2. Existe evaluación y objetivo aplicables.
3. El plan pertenece al asesorado y al dominio de Entrenamiento.
4. Existe catálogo propio utilizable.
5. La carga manual permanece disponible.
6. wger puede utilizarse, pero no es fuente única.
7. Todo elemento externo debe pasar por `UC-I07`.
8. La indisponibilidad externa activa `UC-I08`.

**Postcondiciones de éxito.** 1. Existe un borrador versionado.
2. El borrador se relaciona con evaluación y objetivo.
3. La planificación puede organizarse mediante bloques y sesiones.
4. La prescripción de entrenamiento permanece diferenciada de la ejecución real.
5. Cada elemento conserva procedencia.
6. Los elementos externos importados identifican proveedor, fecha y decisión de incorporación.
7. El borrador no es visible como plan vigente.
8. La caída de wger no bloquea el diseño.
9. El plan puede retomarse.
10. El evento queda trazable.

**Garantías mínimas.** - wger no es fuente operativa única.
- El catálogo BE permite continuidad.
- La carga manual es válida.
- La importación no es automática ni ciega.
- La procedencia no se pierde.
- Un dato externo no utilizable puede corregirse o rechazarse.
- No se fijan ejercicios, series, repeticiones, cargas o progresiones.
- El borrador no se ejecuta en APK.
- Un cambio no sobrescribe otra versión.
- Una falla externa no se presenta como éxito de integración.

**Flujo principal.** 1. El profesional abre la planificación del asesorado.
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

**Variantes.** **V01 — Catálogo propio**

El profesional planifica sin consultar wger.

**Resultado:** el circuito continúa normalmente.

**V02 — Carga manual**

El elemento necesario no existe.

**Resultado:** se incorpora manualmente con procedencia propia.

**V03 — Importación desde wger**

wger responde con información utilizable.

**Resultado:** el profesional revisa y decide incorporar; no existe copia automática.

**V04 — Dato externo incompleto**

El dato requiere corrección o complemento.

**Resultado:** se conserva que la fuente original fue wger y que hubo intervención profesional.

**V05 — wger indisponible**

El proveedor no responde o falla.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia, registra fallback y permite seguir con catálogo propio o carga manual.

**V06 — Guardar y retomar**

El profesional interrumpe el diseño.

**Resultado:** el borrador permanece identificado y no se activa.

**V07 — Nueva versión de planificación**

El profesional parte de una versión anterior.

**Resultado:** crea un borrador sucesor sin modificar la versión activada o histórica.

**Excepciones.** **E01 — Evaluación u objetivo no aplicables**

**Resultado:** no se inicia una planificación válida.

**E02 — Elemento externo no revisado**

**Resultado:** BE no permite incorporarlo como parte del catálogo operativo.

**E03 — Procedencia insuficiente**

**Resultado:** el elemento no se incorpora como importación válida.

**E04 — Duplicado contradictorio**

**Resultado:** BE exige elegir, relacionar o descartar sin duplicar silenciosamente.

**E05 — Falla de wger**

**Resultado:** se informa la contingencia y se aplica fallback; no se bloquea el núcleo.

**E06 — Falla de persistencia**

**Resultado:** no se declara el borrador guardado.

**E07 — Acceso revocado durante el diseño**

**Resultado:** BE detiene la operación y no expone información protegida.

**Reglas aplicables.** 1. `RF-037`, `RF-038`, `RF-039` y `RF-040` pertenecen al diseño.
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

**Información utilizada o generada.** **Utilizada**

- evaluación;
- objetivo;
- catálogo propio;
- elementos manuales;
- respuesta de wger;
- versiones anteriores.

**Generada**

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

**Requisitos relacionados.** **RF**

- `RF-037 — Administrar catálogo propio de ejercicios`
- `RF-038 — Integrar wger mediante importación controlada`
- `RF-039 — Diseñar plan de entrenamiento`
- `RF-040 — Organizar bloques, sesiones y prescripción`
- `RF-059 — Mantener continuidad ante indisponibilidad externa`
- `RF-060 — Conservar procedencia`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-INT-001`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I07 — Importar un elemento externo de forma controlada`
- `UC-I08 — Aplicar fallback manual y conservar procedencia`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Estructura del plan: `DERIVAR 06`.
2. Catálogo y campos: `DERIVAR 06`.
3. Adaptador wger: `DERIVAR 07`.
4. Licencia y tratamiento de procedencia: `DERIVAR 08`.
5. Contratos: `DERIVAR 09`.
6. Experiencia de importación: `DERIVAR 10`.
7. Pruebas de caída y datos incompletos: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando existe un borrador reconstruible con procedencia preservada y fallback disponible, o cuando una excepción impide guardarlo sin activar ni inventar datos.

---

---

### `UC-P16` — Validar y activar plan de entrenamiento

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `9.8` · **Bloque:** Bloque 06 — Circuito de entrenamiento

**Objetivo.** Permitir que el profesional valide y active una versión reproducible del plan de entrenamiento, preservando exactamente lo emitido y aplicando habilitación y capacidad sin interrumpir procesos vigentes.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe un borrador candidato.
- **Fin:** una versión queda activada con instantánea reproducible o la activación se rechaza sin alterar procesos vigentes.

**Actor principal.** Profesional de Entrenamiento.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional decide emitir un plan.

**Precondiciones.** 1. Existe evaluación y objetivo aplicables.
2. Existe un borrador versionado.
3. El profesional continúa autorizado.
4. El vínculo y consentimiento están vigentes.
5. `UC-I04` puede validar la versión.
6. `UC-I10` puede verificar habilitación y capacidad.
7. La versión activada puede preservarse como instantánea reproducible.

**Postcondiciones de éxito.** 1. Existe una única versión vigente compatible con la política.
2. La versión activada queda identificada.
3. Se preserva una instantánea reproducible.
4. El asesorado puede consultar exactamente lo emitido.
5. El borrador posterior no altera la versión activada.
6. La activación conserva autoría, fecha y procedencia.
7. Si abre un proceso nuevo, la capacidad fue evaluada.
8. Los procesos vigentes no se interrumpen por alcanzar el límite.
9. La versión queda disponible para `UC-P17`.
10. El evento queda trazable.

**Garantías mínimas.** - Si no puede preservarse la instantánea, el plan no se activa.
- La instantánea no se reconstruye con el catálogo actual.
- La activación no modifica versiones anteriores.
- Solo una versión aplicable se presenta como vigente.
- Rechazar por capacidad no finaliza procesos vigentes.
- Un proceso nuevo que excede capacidad no se activa.
- No se revocan vínculos por capacidad.
- No se borran datos.
- Un fallo no presenta activación exitosa.

**Flujo principal.** 1. El profesional selecciona el borrador.
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

**Variantes.** **V01 — Sustitución de versión activa**

Existe una versión vigente.

**Resultado:** la anterior permanece histórica y la sucesora se activa de forma trazable.

**V02 — Capacidad disponible**

La activación abre un proceso nuevo dentro de la banda.

**Resultado:** continúa la activación.

**V03 — Capacidad excedida**

La activación abriría un proceso nuevo por encima de la banda.

**Resultado:** se rechaza la activación nueva; los procesos vigentes continúan y pueden revisarse o cerrarse.

**V04 — Cambio posterior del catálogo**

El catálogo cambia después de activar.

**Resultado:** la instantánea conserva exactamente lo emitido.

**V05 — Corrección del borrador antes de activar**

La validación detecta una condición incompleta.

**Resultado:** se vuelve al borrador; no existe activación parcial.

**Excepciones.** **E01 — Profesional no autorizado**

**Resultado:** se deniega la activación.

**E02 — Versión inválida**

**Resultado:** no se activa.

**E03 — Instantánea no preservable**

**Resultado:** no se activa.

**E04 — Habilitación insuficiente**

**Resultado:** no se activa.

**E05 — Capacidad excedida para proceso nuevo**

**Resultado:** se rechaza solo el proceso nuevo.

**E06 — Conflicto concurrente**

**Resultado:** no se activan versiones contradictorias.

**E07 — Falla de persistencia o auditoría**

**Resultado:** no se declara activación exitosa.

**Reglas aplicables.** 1. `RF-041` gobierna la activación.
2. La activación preserva instantánea reproducible.
3. El asesorado consulta lo emitido, no la última edición.
4. Habilitación y capacidad son gates separados.
5. La capacidad se controla al abrir procesos nuevos.
6. Procesos vigentes continúan.
7. Versiones anteriores se conservan.
8. La activación es trazable.
9. Estados técnicos pertenecen a 06.
10. UI y confirmaciones pertenecen a 10.

**Información utilizada o generada.** **Utilizada**

- borrador;
- evaluación;
- objetivo;
- habilitación;
- capacidad;
- vínculo;
- consentimiento;
- procedencia.

**Generada**

- versión activada;
- instantánea reproducible;
- fecha;
- autoría;
- situación anterior y posterior;
- resultado de capacidad;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-041 — Validar y activar plan de entrenamiento`
- `RF-066 — Representar habilitaciones y capacidad`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I04 — Validar y versionar un plan`
- `UC-I10 — Verificar habilitación y capacidad`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Estados y transición: `DERIVAR 06`.
2. Cálculo exacto de capacidad: `DERIVAR 06`.
3. Política de acceso histórico: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Confirmación: `DERIVAR 10`.
6. Pruebas de snapshot y concurrencia: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando una versión reproducible queda activa y consultable, o cuando la activación se rechaza sin afectar procesos vigentes ni producir un estado falso.

---

---

### `UC-P17` — Consultar y registrar ejecución de entrenamiento en APK

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `9.9` · **Bloque:** Bloque 06 — Circuito de entrenamiento

**Objetivo.** Permitir que el asesorado consulte la versión activada y registre lo que efectivamente realizó, manteniendo separadas la prescripción y la ejecución real.

**Alcance.** - **Superficie:** APK del asesorado.
- **Inicio:** existe una versión activada autorizada.
- **Fin:** el asesorado consulta la prescripción o registra una ejecución real vinculada a la versión.

**Actor principal.** Asesorado.

**Actores secundarios.** - Profesional de Entrenamiento.
- Sistema BE.

**Disparador.** El asesorado abre una sesión o registra lo realizado.

**Precondiciones.** 1. El asesorado posee sesión válida.
2. Existe vínculo y consentimiento vigentes.
3. `UC-I02` autoriza la operación.
4. Existe una versión activada e instantánea reproducible.
5. La sesión o unidad planificada puede identificarse.
6. La ejecución real no se confunde con la prescripción.

**Postcondiciones de éxito.** **Consulta**

1. El asesorado consulta exactamente la versión activada.
2. La prescripción permanece identificable.
3. No se muestra un borrador posterior como vigente.

**Registro**

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

**Garantías mínimas.** - Abrir una sesión no equivale a ejecutarla.
- La prescripción no se sobrescribe.
- La ejecución real no se infiere automáticamente.
- El asesorado registra lo que efectivamente hizo.
- No se fijan campos concretos de series, repeticiones o cargas en 05.
- Una ejecución parcial puede registrarse sin inventar completitud.
- Un error no muestra el registro como guardado.
- Una corrección no borra el original.
- La vista no concede autorización.

**Flujo principal.** *Consulta*

1. El asesorado abre Entrenamiento.
2. BE ejecuta `UC-I02`.
3. BE identifica la versión activada.
4. BE presenta la instantánea reproducible.
5. El asesorado selecciona una sesión o unidad.
6. BE muestra la prescripción aplicable.
7. El caso puede finalizar sin registrar ejecución.

*Registro*

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

**Variantes.** **V01 — Ejecución conforme a lo planificado**

El asesorado registra que realizó la actividad correspondiente.

**Resultado:** se conserva como evidencia real, no como copia de la prescripción.

**V02 — Ejecución parcial o diferente**

Lo realizado difiere de lo planificado.

**Resultado:** se registra la diferencia sin modificar la versión activada.

**V03 — Consulta sin ejecución**

El asesorado solo consulta.

**Resultado:** no se crea evidencia de ejecución.

**V04 — Registro retomado**

El asesorado interrumpe antes de confirmar.

**Resultado:** la política de borrador se deriva a 06/10; no se declara ejecución completa.

**V05 — Corrección posterior**

El asesorado detecta un error después de guardar.

**Resultado:** continúa mediante `UC-E02`.

**Excepciones.** **E01 — Sin versión activa autorizada**

**Resultado:** BE no muestra contenido protegido.

**E02 — Sesión no identificable**

**Resultado:** no se registra una ejecución ambigua.

**E03 — Autorización revocada**

**Resultado:** BE deniega nuevas operaciones.

**E04 — Duplicado contradictorio**

**Resultado:** BE no crea dos registros incompatibles sin relación.

**E05 — Conflicto de versión**

**Resultado:** se exige consultar nuevamente.

**E06 — Falla de persistencia o auditoría**

**Resultado:** no se declara la ejecución guardada.

**Reglas aplicables.** 1. `RF-042` gobierna consulta.
2. `RF-043` gobierna ejecución real.
3. Prescripción y ejecución son conceptos separados.
4. La ejecución se vincula a una versión activada.
5. Consultar no equivale a ejecutar.
6. El asesorado registra lo realizado.
7. El profesional no reemplaza silenciosamente la evidencia.
8. Correcciones se realizan mediante `UC-E02`.
9. Campos técnicos pertenecen a 06.
10. UI y experiencia pertenecen a 10.

**Información utilizada o generada.** **Utilizada**

- identidad del asesorado;
- versión activada;
- instantánea;
- sesión o unidad;
- autorización.

**Generada**

- ejecución real;
- relación con la prescripción;
- fecha;
- autoría;
- estado de registro;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-042 — Consultar plan de entrenamiento en APK`
- `RF-043 — Registrar ejecución real`
- `RF-044 — Corregir ejecución con trazabilidad`, mediante `UC-E02`
- `RF-021 — Evaluar autorización contextual`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos extendidos.** - `UC-E02 — Corregir ejecución de entrenamiento`

**Puntos de auditoría.** - asesorado;
- profesional relacionado;
- versión;
- sesión o unidad;
- consulta;
- ejecución;
- fecha;
- autoría;
- diferencia con prescripción;
- falla o conflicto.

**Decisiones o preguntas abiertas.** 1. Campos de ejecución: `DERIVAR 06`.
2. Borrador de registro: `DERIVAR 06/10`.
3. Corrección y visibilidad: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Experiencia APK: `DERIVAR 10`.
6. Pruebas de duplicados y offline parcial: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el asesorado consulta la versión correcta o registra una ejecución real separada de la prescripción, o cuando una excepción impide hacerlo sin inventar evidencia.

---

---

### `UC-P18` — Revisar evidencia y decidir continuidad de entrenamiento

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `9.11` · **Bloque:** Bloque 06 — Circuito de entrenamiento

**Objetivo.** Permitir que un profesional de Entrenamiento cierre un período o ciclo mediante los patrones comunes `UC-I05` y `UC-I06`, vinculando ejecución real y correcciones a una decisión de continuidad o cierre.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe evidencia de ejecución correspondiente a un período o ciclo.
- **Fin:** existe revisión profesional válida y próxima acción o cierre, o una excepción impide producir un cierre falso.

**Actor principal.** Profesional de Entrenamiento.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional consulta una revisión pendiente o decide revisar la ejecución de entrenamiento.

**Precondiciones.** 1. El profesional posee Entrenamiento `VERIFICADO`.
2. Existe habilitación aplicable.
3. Existe vínculo y consentimiento vigentes.
4. `UC-I02` autoriza la operación.
5. Existe versión activada.
6. Existe un período o ciclo identificable.
7. Existe evidencia de ejecución real.
8. Correcciones aplicables pueden reconstruirse.
9. `UC-I05` y `UC-I06` están disponibles como patrones comunes.

**Postcondiciones de éxito.** 1. `UC-I05` registra una revisión profesional válida conforme a `DEC-043`.
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

**Garantías mínimas.** - UC-P18 no redefine `DEC-043`.
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

**Flujo principal.** 1. El profesional accede a revisiones pendientes de Entrenamiento.
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

**Variantes.** **V01 — Mantener**

Se utiliza `MANTENER`.

**Resultado:** se conserva la versión vigente y se registra próxima acción.

**V02 — Progresar conservando estructura**

La próxima acción modifica la planificación sin sustituirla completamente.

**Resultado:** se utiliza `AJUSTAR`.

**V03 — Progresar mediante versión sucesora**

La próxima acción requiere una nueva planificación.

**Resultado:** se utiliza `SUSTITUIR`.

**V04 — Reprogramar revisión**

Se utiliza `REPROGRAMAR_REVISION`.

**Resultado:** no se modifica silenciosamente el plan.

**V05 — Cambiar objetivo**

Se utiliza `CAMBIAR_OBJETIVO`.

**Resultado:** se inicia una nueva versión de objetivo mediante `UC-P14`.

**V06 — Finalizar**

Se utiliza `FINALIZAR`.

**Resultado:** se preservan evidencia, versiones y revisión.

**V07 — Iniciar nuevo bloque**

Se utiliza `AJUSTAR` o `SUSTITUIR` según el efecto sobre la versión.

**Resultado:** no se crea un nuevo enum.

**V08 — Evidencia corregida**

Existe `UC-E02`.

**Resultado:** la revisión puede considerar original y corrección sin perder la historia.

**Excepciones.** **E01 — Evidencia insuficiente**

**Resultado:** no se registra revisión válida.

**E02 — Solo visualización**

**Resultado:** no se resuelve el pendiente.

**E03 — Nota aislada**

**Resultado:** no se registra como revisión.

**E04 — Modificación silenciosa**

**Resultado:** BE impide el cambio fuera de los casos de continuidad.

**E05 — Resultado fuera de taxonomía**

**Resultado:** se rechaza.

**E06 — Progresión automática**

Una regla intenta modificar el plan sin decisión profesional.

**Resultado:** BE no aplica la progresión.

**E07 — Conflicto entre ejecución original y corrección**

**Resultado:** BE exige una cadena reconstruible antes de revisar.

**E08 — Profesional no autorizado**

**Resultado:** BE deniega.

**E09 — Revocación concurrente**

**Resultado:** BE deniega antes de confirmar.

**E10 — Falla de persistencia o auditoría**

**Resultado:** no se cierra el ciclo.

**Reglas aplicables.** 1. `RF-045`, `RF-046` y `RF-056` gobiernan UC-P18.
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

**Información utilizada o generada.** **Utilizada**

- profesional;
- asesorado;
- versión activada;
- prescripción;
- ejecución real;
- correcciones;
- período;
- objetivo;
- revisiones anteriores.

**Generada**

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

**Requisitos relacionados.** **RF principales**

- `RF-045 — Revisar evidencia de entrenamiento`
- `RF-046 — Aplicar progresión, ajuste o cierre`
- `RF-056 — Registrar revisión profesional válida y próxima acción`

**RF relacionados**

- `RF-044 — Corrección trazable`
- `RF-054 — Línea temporal`
- `RF-055 — Revisiones pendientes`
- `RF-058 — TVCC-30`, como consumidor analítico posterior.

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`

**Casos relacionados.** - `UC-P14`
- `UC-P15`
- `UC-P16`
- `UC-P17`
- `UC-E02`
- `UC-S01`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Estados y transiciones: `DERIVAR 06`.
2. Estructura de progresión: `DERIVAR 06`.
3. Lectura histórica: `DERIVAR 08`.
4. Corrección de revisión: `DERIVAR 08`.
5. Contratos: `DERIVAR 09`.
6. Formulario: `DERIVAR 10`.
7. Contenido mínimo y pruebas: `DERIVAR 11A`.
8. Fórmula TVCC-30: `DERIVAR 06/12`.
9. Validación de DEC-043 antes de G4.

**Criterio de cierre.** El caso termina cuando UC-I05 y UC-I06 registran una revisión válida y una continuidad o cierre trazables, o cuando una excepción impide cerrar falsamente el ciclo.

---

---

### `UC-P19` — Registrar evaluación antropométrica

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `10.6` · **Bloque:** Bloque 07 — Antropometría transversal y descubrimiento limitado

**Objetivo.** Permitir que un profesional con capacidad antropométrica registre una evaluación autorizada, diferenciando mediciones directas y cálculos derivados y preservando protocolo, autoría, fecha, unidades y procedencia.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** existe un asesorado y un propósito antropométrico autorizados.
- **Fin:** existe una evaluación reconstruible o una excepción impide registrarla sin producir datos falsos.

**Actor principal.** Profesional con capacidad antropométrica.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Disparador.** El profesional inicia o continúa una evaluación antropométrica.

**Precondiciones.** 1. La identidad profesional está activa.
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

**Postcondiciones de éxito.** 1. Existe una evaluación antropométrica identificable.
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

**Garantías mínimas.** - Antropometría no se presenta como especialidad.
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

**Flujo principal.** 1. El profesional selecciona al asesorado.
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

**Variantes.** **V01 — Solo mediciones directas**

No corresponde emitir cálculos.

**Resultado:** la evaluación puede guardarse con mediciones identificables sin inventar resultados derivados.

**V02 — Mediciones y cálculos**

Existen entradas suficientes y método aplicable.

**Resultado:** `UC-I09` emite resultados derivados reproducibles.

**V03 — Profesional exclusivamente antropométrico**

El actor no posee Nutrición ni Entrenamiento verificadas.

**Resultado:** la evaluación puede registrarse conforme a `DEC-044`.

**V04 — Evaluación retomada**

La política permite guardar un borrador.

**Resultado:** no se presenta como evaluación completa; estructura y visibilidad se derivan a `06/10`.

**V05 — Método no disponible o no identificable**

Las mediciones pueden registrarse, pero el cálculo no puede emitirse.

**Resultado:** BE conserva las mediciones y explica la ausencia de resultado derivado.

**V06 — Información previa autorizada**

El profesional consulta antecedentes pertinentes.

**Resultado:** la procedencia se conserva y no se reasigna autoría.

**Excepciones.** **E01 — Capacidad no verificada**

**Resultado:** BE deniega la operación.

**E02 — Vínculo, consentimiento o autorización insuficientes**

**Resultado:** BE deniega sin revelar información protegida.

**E03 — Protocolo no identificable**

**Resultado:** la evaluación no se confirma como completa.

**E04 — Autoría o fecha ausentes**

**Resultado:** no se confirma.

**E05 — Unidad no identificable**

**Resultado:** la medición no se confirma como utilizable.

**E06 — Cálculo sin método o versión**

**Resultado:** no se emite el resultado derivado.

**E07 — Entradas insuficientes**

**Resultado:** se conservan las mediciones válidas y no se inventa el cálculo.

**E08 — Conflicto concurrente**

**Resultado:** BE exige revisar nuevamente.

**E09 — Revocación concurrente**

**Resultado:** BE detiene la operación.

**E10 — Falla de persistencia o auditoría**

**Resultado:** no se presenta la evaluación como guardada.

**Reglas aplicables.** 1. `RF-047` gobierna el registro.
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

**Información utilizada o generada.** **Utilizada**

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

**Generada**

- evaluación;
- mediciones directas;
- cálculos derivados;
- referencias de método y versión;
- autoría;
- fecha;
- procedencia;
- evento de auditoría.

**Requisitos relacionados.** **RF**

- `RF-047 — Registrar evaluación antropométrica autorizada`
- `RF-048 — Emitir cálculos antropométricos reproducibles`
- `RF-021 — Evaluar autorización contextual`
- `RF-060 — Conservar procedencia`
- `RF-066 — Verificar habilitación y capacidad`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`
- `RNF-MAN-004`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I09 — Emitir cálculos antropométricos reproducibles`
- `UC-I10 — Verificar habilitación y capacidad`

**Casos extendidos.** - `UC-E03 — Corregir evaluación antropométrica`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Protocolos: `DERIVAR 06`.
2. Fórmulas y versiones: `DERIVAR 06`.
3. Unidades y conversiones: `DERIVAR 06`.
4. Precisión y redondeo: `DERIVAR 06`.
5. Corrección y visibilidad: `DERIVAR 08`.
6. Contratos: `DERIVAR 09`.
7. Formulario: `DERIVAR 10`.
8. Pruebas reproducibles: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando existe una evaluación reconstruible con mediciones y cálculos claramente diferenciados, o cuando una excepción impide registrarla sin inventar información.

---

---

### `UC-P20` — Consultar evolución antropométrica

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `10.10` · **Bloque:** Bloque 07 — Antropometría transversal y descubrimiento limitado

**Objetivo.** Permitir que el asesorado o un profesional autorizado compare evaluaciones antropométricas longitudinales, diferenciando mediciones directas, cálculos derivados, métodos, unidades, correcciones y limitaciones.

**Alcance.** - **Superficies:** Website profesional y APK del asesorado.
- **Inicio:** existen evaluaciones autorizadas.
- **Fin:** el actor consulta una comparación coherente o una excepción impide presentarla sin inducir a error.

**Actor principal.** Asesorado o profesional autorizado.

**Actores secundarios.** - Sistema BE.

**Disparador.** El actor consulta la evolución antropométrica.

**Precondiciones.** 1. El actor posee identidad y sesión válidas.
2. Existen evaluaciones propias o autorizadas.
3. `UC-I02` autoriza la consulta.
4. Los períodos pueden identificarse.
5. Mediciones y cálculos pueden diferenciarse.
6. Correcciones aplicables pueden reconstruirse.

**Postcondiciones de éxito.** 1. El actor consulta evaluaciones ordenadas por período.
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

**Garantías mínimas.** - Evolución no equivale a diagnóstico.
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

**Flujo principal.** 1. El actor accede a evolución antropométrica.
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

**Variantes.** **V01 — Comparación de mediciones directas**

**Resultado:** se muestran períodos y unidades identificables.

**V02 — Comparación de cálculos derivados**

**Resultado:** se muestran método y versión asociados.

**V03 — Evaluaciones con métodos distintos**

**Resultado:** BE presenta la diferencia y evita una comparación engañosa.

**V04 — Evaluación corregida**

**Resultado:** la vista efectiva muestra la corrección e identifica que existe historia.

**V05 — Consulta por asesorado**

**Resultado:** solo accede a su información y a la explicación permitida.

**V06 — Consulta por profesional**

**Resultado:** solo accede dentro de capacidad, vínculo, consentimiento, finalidad y alcance.

**Excepciones.** **E01 — Sin autorización**

**Resultado:** BE deniega.

**E02 — Períodos no identificables**

**Resultado:** no presenta una evolución falsa.

**E03 — Unidad o método ausentes**

**Resultado:** BE presenta el dato con limitación o lo excluye de comparación según 06/10.

**E04 — Corrección inconsistente**

**Resultado:** no presenta una vista efectiva falsa.

**E05 — Datos insuficientes**

**Resultado:** informa ausencia de comparación suficiente sin inferir tendencia.

**E06 — Falla de persistencia**

**Resultado:** no presenta información parcial como completa.

**Reglas aplicables.** 1. `RF-049` gobierna evolución.
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

**Información utilizada o generada.** **Utilizada**

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

**Generada**

- comparación;
- limitaciones;
- vista efectiva;
- evento de consulta.

**Requisitos relacionados.** - `RF-049`
- `RF-050`
- `RF-021`
- `RF-054`, como entrada de línea temporal cuando corresponda.

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos extendidos.** - `UC-E03 — Corregir evaluación antropométrica`

**Puntos de auditoría.** - actor;
- evaluaciones consultadas;
- períodos;
- métodos;
- versiones;
- unidades;
- correcciones;
- limitaciones;
- resultado;
- denegación o falla.

**Decisiones o preguntas abiertas.** 1. Compatibilidad y conversión: `DERIVAR 06`.
2. Visibilidad por actor: `DERIVAR 08`.
3. Contratos: `DERIVAR 09`.
4. Gráficos y copy: `DERIVAR 10`.
5. Pruebas de comparabilidad: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el actor consulta una evolución autorizada con límites visibles, o cuando una excepción impide mostrar una comparación engañosa.

---

---

### `UC-P21` — Publicar servicio antropométrico limitado

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `10.11` · **Bloque:** Bloque 07 — Antropometría transversal y descubrimiento limitado

**Objetivo.** Permitir que un profesional elegible publique un servicio antropométrico para descubrimiento limitado, incluyendo perfil, credenciales y ubicación utilizable, sin incorporar funciones de marketplace.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** el profesional decide publicar o actualizar su servicio.
- **Fin:** el servicio queda publicado de forma limitada o la publicación se rechaza sin exposición indebida.

**Actor principal.** Profesional con capacidad antropométrica.

**Actores secundarios.** - Sistema BE.
- Administrador, cuando la política aplicable requiera intervención.

**Disparador.** El profesional decide hacer descubrible su servicio antropométrico.

**Precondiciones.** 1. La identidad profesional está activa.
2. La capacidad antropométrica fue declarada y `VERIFICADA`.
3. El servicio se encuentra habilitado.
4. Existe una ubicación utilizable.
5. Existe autorización para publicar.
6. El estado profesional es válido.
7. `UC-I02` autoriza la operación.
8. `UC-I10` confirma habilitación y condiciones aplicables.
9. No se exige Nutrición o Entrenamiento verificadas.

**Postcondiciones de éxito.** 1. Existe una publicación limitada.
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

**Garantías mínimas.** - DEC-044 se aplica.
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

**Flujo principal.** 1. El profesional accede a publicación.
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

**Variantes.** **V01 — Profesional exclusivamente antropométrico**

**Resultado:** puede publicar si cumple todas las condiciones.

**V02 — Profesional con especialidad adicional**

**Resultado:** la publicación sigue identificando Antropometría como capacidad transversal.

**V03 — Actualizar ubicación**

**Resultado:** se conserva historia según la política; no se altera elegibilidad por el proveedor cartográfico.

**V04 — Pausar publicación**

La política permite dejar de mostrar el servicio.

**Resultado:** no se finalizan vínculos ni se borran antecedentes.

**V05 — Proveedor cartográfico no disponible**

**Resultado:** la publicación puede conservar ubicación textual utilizable; representación técnica se deriva a 07/10.

**Excepciones.** **E01 — Identidad inactiva**

**Resultado:** no se publica.

**E02 — Capacidad no verificada**

**Resultado:** no se publica.

**E03 — Servicio no habilitado**

**Resultado:** no se publica.

**E04 — Ubicación no utilizable**

**Resultado:** no se publica en mapa o lista como si fuera localizable.

**E05 — Sin autorización de publicación**

**Resultado:** no se publica.

**E06 — Estado profesional no válido**

**Resultado:** no se publica.

**E07 — Intento de función de marketplace**

**Resultado:** BE rechaza reservas, pagos, reseñas, ranking, contratación u otra expansión no aprobada.

**E08 — Falla de persistencia o auditoría**

**Resultado:** no se presenta como publicado.

**Reglas aplicables.** 1. `RF-051` gobierna publicación y descubrimiento.
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

**Información utilizada o generada.** **Utilizada**

- identidad;
- capacidad verificada;
- habilitación;
- servicio;
- ubicación;
- autorización de publicación;
- estado profesional;
- perfil;
- credenciales.

**Generada**

- publicación;
- situación;
- datos visibles;
- ubicación utilizable;
- fecha;
- autoría;
- evento de auditoría.

**Requisitos relacionados.** - `RF-051`
- `RF-066`
- `RF-021`
- `DEC-044`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I10 — Verificar habilitación y capacidad`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Datos públicos: `DERIVAR 08`.
2. Precisión y visibilidad de ubicación: `DERIVAR 08`.
3. Estados de publicación: `DERIVAR 06`.
4. Proveedor y adaptador: `DERIVAR 07`.
5. Contratos: `DERIVAR 09`.
6. Formulario: `DERIVAR 10`.
7. Pruebas de elegibilidad: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando un servicio limitado queda publicado por un profesional elegible o cuando una excepción impide publicarlo sin ampliar el producto.

---

---

### `UC-P22` — Descubrir servicio antropométrico

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `10.12` · **Bloque:** Bloque 07 — Antropometría transversal y descubrimiento limitado

**Objetivo.** Permitir que un asesorado visualice servicios antropométricos publicados en lista o mapa, consulte perfil y credenciales y, si decide continuar, inicie una solicitud de vínculo mediante `UC-E04`.

**Alcance.** - **Superficie:** APK o Website según diseño posterior.
- **Inicio:** existen servicios publicados.
- **Fin:** el asesorado consulta información pública o inicia `UC-E04`; nunca obtiene acceso profesional directo.

**Actor principal.** Asesorado.

**Actores secundarios.** - Sistema BE.
- Proveedor cartográfico.
- Profesional publicado como contraparte eventual.

**Disparador.** El asesorado decide consultar servicios antropométricos.

**Precondiciones.** 1. El asesorado posee identidad BE y sesión válida.
2. `UC-I02` autoriza la consulta del catálogo público aplicable.
3. Existen publicaciones visibles.
4. La elegibilidad proviene de BE.
5. El proveedor cartográfico solo representa ubicación.

**Postcondiciones de éxito.** 1. El asesorado consulta servicios visibles.
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

**Garantías mínimas.** - Descubrir no equivale a contratar.
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

**Flujo principal.** 1. El asesorado abre descubrimiento antropométrico.
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

**Variantes.** **V01 — Lista**

El asesorado consulta servicios sin mapa.

**Resultado:** el recorrido permanece completo.

**V02 — Mapa disponible**

El proveedor representa ubicaciones.

**Resultado:** la elegibilidad sigue determinada por BE.

**V03 — Mapa indisponible**

El proveedor falla.

**Resultado:** se ejecuta `UC-I08`; BE informa la contingencia y mantiene lista y ubicación textual.

**V04 — Perfil exclusivamente antropométrico**

El profesional no posee especialidades verificadas.

**Resultado:** el perfil puede mostrarse conforme a `DEC-044`.

**V05 — Sin servicios disponibles**

**Resultado:** BE informa ausencia sin inventar resultados o ampliar el radio silenciosamente.

**V06 — Ordenamiento neutral**

La interfaz necesita ordenar resultados.

**Resultado:** el criterio debe ser documentado y no reputacional; diseño definitivo: `DERIVAR 10`.

**Excepciones.** **E01 — Publicación ya no elegible**

**Resultado:** BE no la muestra como disponible.

**E02 — Información pública inconsistente**

**Resultado:** BE no presenta el perfil como completo.

**E03 — Mapa indisponible**

**Resultado:** fallback a lista y ubicación textual.

**E04 — Intento de reserva, pago o contratación**

**Resultado:** BE rechaza la operación porque está fuera del MVP.

**E05 — Intento de acceso a datos del profesional o asesorados**

**Resultado:** BE deniega sin filtrar información.

**E06 — Falla de persistencia o consulta**

**Resultado:** no presenta resultados parciales como completos.

**Reglas aplicables.** 1. `RF-051` gobierna descubrimiento.
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

**Información utilizada o generada.** **Utilizada**

- publicaciones;
- perfil;
- credenciales visibles;
- ubicación utilizable;
- elegibilidad BE;
- disponibilidad del mapa.

**Generada**

- consulta;
- resultado de lista o mapa;
- contingencia;
- selección de servicio;
- evento de auditoría.

**Requisitos relacionados.** - `RF-051`
- `RF-059`
- `RF-018`, cuando se invoca `UC-E04`
- `DEC-044`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I08 — Aplicar fallback manual y conservar procedencia`

**Casos extendidos.** - `UC-E04 — Solicitar vínculo desde descubrimiento antropométrico`

**Puntos de auditoría.** - asesorado;
- publicaciones consultadas;
- servicio seleccionado;
- lista o mapa;
- contingencia;
- perfil consultado;
- intento de función no permitida;
- invocación de UC-E04;
- falla.

**Decisiones o preguntas abiertas.** 1. Superficie definitiva: `DERIVAR 10`.
2. Datos públicos: `DERIVAR 08`.
3. Precisión de ubicación: `DERIVAR 08`.
4. Proveedor y fallback: `DERIVAR 07/09`.
5. Ordenamiento neutral: `DERIVAR 10`.
6. Pruebas de expansión indebida: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el asesorado consulta servicios sin acceso protegido o cuando decide continuar mediante una solicitud de vínculo explícita.

---

---

### `UC-P23` — Consultar cartera y revisiones pendientes

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `11.6` · **Bloque:** Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal

**Objetivo.** Permitir que un profesional consulte asesorados y ciclos propios, identifique revisiones o próximas acciones pendientes y priorice trabajo operativo sin lenguaje diagnóstico ni calificación agregada.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** el profesional accede a su cartera.
- **Fin:** consulta información propia y acciones pendientes autorizadas sin modificar los procesos.

**Actor principal.** Profesional.

**Actores secundarios.** - Sistema BE.

**Disparador.** El profesional decide organizar su trabajo.

**Precondiciones.** 1. El profesional posee identidad y sesión válidas.
2. `UC-I02` autoriza la consulta.
3. Solo se consideran vínculos y procesos propios.
4. Cada elemento puede relacionarse con un dominio, finalidad y alcance.
5. Las revisiones válidas provienen de `UC-I05`.
6. La continuidad o cierre provienen de `UC-I06`.
7. Los motivos de pendiente pueden expresarse sin diagnóstico.

**Postcondiciones de éxito.** 1. El profesional consulta una cartera propia.
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

**Garantías mínimas.** - La cartera no es una lista clínica.
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

**Flujo principal.** 1. El profesional abre su cartera.
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

**Variantes.** **V01 — Ciclo con revisión pendiente**

Existe evidencia posterior a la última revisión o el ciclo se encuentra disponible para revisión.

**Resultado:** BE informa el motivo en lenguaje operativo.

**V02 — Próxima acción pendiente**

Existe revisión válida, pero falta materializar una acción definida.

**Resultado:** se muestra la acción pendiente sin interpretar clínicamente al asesorado.

**V03 — Ciclo cerrado**

Existe revisión válida y cierre o continuidad aplicados.

**Resultado:** no se muestra como pendiente equivalente a un ciclo abierto.

**V04 — Varios dominios propios**

El profesional posee autorización sobre más de un dominio.

**Resultado:** cada elemento conserva dominio, finalidad y alcance; no se fusionan en una conclusión general.

**V05 — Sin pendientes**

No existen acciones pendientes autorizadas.

**Resultado:** BE informa la ausencia sin inventar trabajo o alterar criterios.

**Excepciones.** **E01 — Vínculo ajeno**

**Resultado:** BE deniega sin revelar existencia o contenido.

**E02 — Motivo no reconstruible**

BE no puede explicar por qué un elemento aparece pendiente.

**Resultado:** no presenta el pendiente como confiable; registra la inconsistencia.

**E03 — Actividad confundida con revisión**

Existe una consulta, nota o modificación silenciosa sin DEC-043.

**Resultado:** el ciclo continúa pendiente.

**E04 — Autorización revocada**

**Resultado:** BE corta la consulta futura.

**E05 — Datos longitudinales inconsistentes**

**Resultado:** BE no presenta una situación falsa.

**E06 — Falla de consulta o auditoría**

**Resultado:** no muestra información parcial como cartera completa.

**Reglas aplicables.** 1. `RF-052` gobierna la cartera.
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

**Información utilizada o generada.** **Utilizada**

- profesional;
- vínculos propios;
- dominios;
- procesos;
- revisiones;
- próximas acciones;
- cierres;
- evidencias;
- autorización.

**Generada**

- vista de cartera;
- motivos operativos;
- filtros;
- resultado de consulta;
- inconsistencia detectada;
- evento de auditoría.

**Requisitos relacionados.** - `RF-052 — Consultar cartera profesional`
- `RF-055 — Identificar revisiones pendientes`
- `RF-021 — Evaluar autorización contextual`
- `RF-056 — Revisión profesional válida`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos relacionados.** - `UC-I05 — Registrar revisión profesional válida`
- `UC-I06 — Aplicar continuidad o cierre`
- `UC-P13 — Revisión nutricional`
- `UC-P18 — Revisión de entrenamiento`

**Puntos de auditoría.** - profesional;
- asesorado o vínculo consultado;
- dominio;
- motivo de pendiente;
- revisión válida relacionada;
- próxima acción;
- filtros;
- denegación;
- inconsistencia;
- fecha de consulta.

**Decisiones o preguntas abiertas.** 1. Reglas exactas de pendiente: `DERIVAR 06`.
2. Ordenamiento y filtros: `DERIVAR 06/10`.
3. Datos visibles: `DERIVAR 08`.
4. Contratos: `DERIVAR 09`.
5. Pruebas de falsos pendientes: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el profesional consulta su cartera y pendientes con motivos no clínicos y autorización efectiva, o cuando una excepción impide presentar información confiable.

---

---

### `UC-P24` — Consultar dashboard y línea temporal interdisciplinaria

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `11.7` · **Bloque:** Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal

**Objetivo.** Permitir que un profesional autorizado consulte una síntesis interdisciplinaria limitada por consentimiento, finalidad y alcance, y una línea temporal que diferencie ocurrencia y registro sin producir una calificación agregada.

**Alcance.** - **Superficie:** Website profesional.
- **Inicio:** el profesional selecciona un asesorado relacionado.
- **Fin:** consulta únicamente información autorizada y longitudinalmente reconstruible.

**Actor principal.** Profesional autorizado.

**Actores secundarios.** - Asesorado, como titular de la información.
- Sistema BE.

**Disparador.** El profesional consulta el dashboard de un asesorado.

**Precondiciones.** 1. El profesional posee identidad y sesión válidas.
2. Existe vínculo aplicable.
3. Existe consentimiento vigente para al menos un dominio o conjunto.
4. `UC-I02` puede evaluar cada dato o conjunto.
5. La finalidad y el alcance están identificados.
6. Los eventos pueden asociarse a dominio y procedencia.
7. El dashboard no presume acceso a dominios no autorizados.

**Postcondiciones de éxito.** 1. El profesional consulta únicamente información autorizada.
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

**Garantías mínimas.** - El rol profesional aislado no concede acceso completo.
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

**Flujo principal.** 1. El profesional selecciona un asesorado relacionado.
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

**Variantes.** **V01 — Un solo dominio autorizado**

**Resultado:** el dashboard muestra únicamente ese dominio y no presenta la ausencia de otros como dato clínico.

**V02 — Varios dominios autorizados**

**Resultado:** cada conjunto conserva su dominio, finalidad y alcance.

**V03 — Autorización parcial dentro de un dominio**

**Resultado:** se limita el conjunto visible; no se amplía al dominio completo.

**V04 — Información interdisciplinaria parcialmente autorizada**

Una parte del contexto es visible y otra no.

**Resultado:** la vista permanece parcial y no se transforma en acceso global.

**V05 — Ocurrencia anterior al registro**

Un evento se registra después de suceder.

**Resultado:** la línea temporal conserva ambos momentos.

**V06 — Solo momento de registro conocido**

No puede determinarse cuándo ocurrió el hecho.

**Resultado:** BE no inventa ocurrencia y presenta la limitación.

**V07 — Evento corregido**

Existe una corrección trazable.

**Resultado:** la línea temporal conserva original, corrección y momentos aplicables.

**V08 — Sin nota de coordinación**

El profesional solo consulta.

**Resultado:** no se crea comunicación interdisciplinaria.

**Excepciones.** **E01 — Sin consentimiento aplicable**

**Resultado:** BE deniega sin revelar información protegida.

**E02 — Alcance ambiguo**

**Resultado:** no construye una vista global por defecto.

**E03 — Procedencia ausente**

**Resultado:** no presenta el dato como plenamente confiable; aplica política posterior.

**E04 — Ocurrencia y registro confundidos**

**Resultado:** BE no ordena el evento como si ambos fueran equivalentes.

**E05 — Autorización inconsistente**

**Resultado:** BE deniega conservadoramente y registra la inconsistencia.

**E06 — Intento de inferir dominio oculto**

**Resultado:** BE no completa la síntesis con información no autorizada.

**E07 — Intento de modificar un dominio desde dashboard**

**Resultado:** BE exige el caso propietario y autorización correspondiente.

**E08 — Falla de consulta o auditoría**

**Resultado:** no presenta información parcial como completa.

**Reglas aplicables.** 1. `RF-053` gobierna el dashboard.
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

**Información utilizada o generada.** **Utilizada**

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

**Generada**

- síntesis autorizada;
- línea temporal;
- vista parcial;
- limitaciones;
- resultado de autorización;
- evento de consulta.

**Requisitos relacionados.** - `RF-053 — Consultar dashboard interdisciplinario`
- `RF-054 — Construir historial longitudinal`
- `RF-021 — Evaluar autorización contextual`
- `RF-057 — Registrar nota de coordinación`, mediante `UC-E07`.

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos extendidos.** - `UC-E07 — Registrar nota de coordinación autorizada`

**Puntos de auditoría.** - profesional;
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

**Decisiones o preguntas abiertas.** 1. Proyecciones y agregados técnicos: `DERIVAR 06`.
2. Reglas finas de visibilidad: `DERIVAR 08`.
3. Auditoría de consultas: `DERIVAR 08`.
4. Contratos y filtros: `DERIVAR 09`.
5. Diseño del dashboard y timeline: `DERIVAR 10`.
6. Pruebas de autorización parcial: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el profesional consulta una síntesis y línea temporal limitadas por autorización, o cuando una excepción impide construirlas sin filtrar o inferir información protegida.

---

---

### `UC-P25` — Registrar identidad BE y perfil propio

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `12.4` · **Bloque:** Cierre complementario A — Identidad, acceso y ciclo de cuenta

**Objetivo.** Crear una identidad BE persistente y permitir que su titular gestione el perfil propio sin obtener por ello roles, capacidades o acceso a terceros.

**Actor principal.** Profesional o asesorado.

**Precondiciones.** 1. El actor no posee una identidad equivalente ya confirmada, o se encuentra en un recorrido controlado de asociación.
2. La superficie de registro puede determinarse mediante `UC-I11`.
3. Los datos mínimos funcionales pueden registrarse sin fijar aquí su estructura.

**Postcondiciones de éxito.** 1. Existe una identidad BE única y persistente.
2. El perfil propio queda asociado a esa identidad.
3. El estado operativo es observable.
4. No se conceden especialidades, capacidades, vínculos, consentimientos ni autorizaciones.
5. La creación queda trazable.

**Garantías mínimas.** - Un proveedor de acceso no crea una identidad distinta.
- Profesional y asesorado utilizan la misma noción de identidad.
- El perfil propio no es un perfil clínico.
- El registro no concede acceso a información de terceros.
- Un fallo no presenta la identidad como creada.
- Las modificaciones posteriores quedan auditadas.

**Flujo principal.** 1. El actor inicia el registro.
2. BE ejecuta `UC-I11` para encauzar la superficie prevista.
3. BE solicita la información mínima funcional.
4. El actor revisa y confirma.
5. BE verifica duplicidad e integridad conforme a políticas posteriores.
6. BE crea la identidad persistente.
7. BE crea el perfil propio.
8. BE registra autoría, ocurrencia y registro mediante `UC-I03`.
9. BE informa el estado operativo resultante.
10. El caso finaliza sin conceder permisos profesionales.

**Variantes.** **V01 — Registro como asesorado**

**Resultado:** se crea la identidad y el perfil propio del asesorado conforme a `RF-017`.

**V02 — Registro con intención profesional**

**Resultado:** se crea la identidad; el alta profesional continúa por `UC-P01`.

**V03 — Perfil existente**

**Resultado:** BE evita duplicar la identidad y encauza al acceso o recuperación correspondiente.

**Excepciones.** **E01 — Identidad equivalente detectada**

**Resultado:** no crea una segunda identidad.

**E02 — Información mínima insuficiente**

**Resultado:** no declara el registro completo.

**E03 — Falla de persistencia o auditoría**

**Resultado:** no presenta éxito.

**Reglas aplicables.** 1. `RF-001`, `RF-006` y `RF-017` gobiernan el caso.
2. Identidad y perfil son independientes de especialidad.
3. El estado operativo es un resultado observable, no un enum definido en 05.
4. Navegación pertenece a 10.
5. Persistencia pertenece a 06.

**Casos incluidos.** - `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I11 — Encauzar al actor por la superficie prevista`

**Puntos de auditoría.** - actor;
- intención de perfil;
- duplicidad;
- creación;
- estado operativo;
- fecha de ocurrencia;
- fecha de registro;
- falla.

**Criterio de cierre.** Existe una identidad persistente y un perfil propio, o una excepción impide crear duplicados o estados falsos.

---

---

### `UC-P26` — Autenticar y finalizar una sesión local

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `12.5` · **Bloque:** Cierre complementario A — Identidad, acceso y ciclo de cuenta

**Objetivo.** Permitir acceso local y finalización de sesión, dejando claro que la autenticación identifica al actor pero no concede autorización global.

**Actor principal.** Profesional, asesorado o administrador.

**Precondiciones.** 1. Existe una identidad BE.
2. Existe un método local utilizable.
3. El estado operativo permite intentar acceso.
4. `UC-I11` puede determinar la superficie funcional posterior.

**Postcondiciones de éxito.** **Acceso**

1. Existe una sesión asociada a la identidad.
2. El actor queda encauzado por la superficie prevista.
3. Toda operación protegida posterior exige `UC-I02`.
4. El evento queda trazable.

**Finalización**

1. La sesión deja de ser utilizable.
2. No se modifican identidad, vínculos o información.
3. El evento queda trazable.

**Garantías mínimas.** - Autenticación no equivale a autorización.
- La sesión no concede acceso a todos los dominios.
- Finalizar sesión no cierra la cuenta.
- Un error no crea una sesión parcial.
- Google no es obligatorio.
- Recuperación no crea sesión antes de completarse.
- Navegación concreta no se fija en 05.

**Flujo principal.** *Acceso local*

1. El actor selecciona acceso local.
2. Presenta el método aplicable.
3. BE verifica el método conforme a `08/09`.
4. BE verifica el estado operativo.
5. BE crea la sesión.
6. BE ejecuta `UC-I11`.
7. BE registra mediante `UC-I03`.
8. El caso finaliza.

*Finalizar sesión*

1. El actor solicita salir.
2. BE identifica la sesión.
3. BE la vuelve inutilizable.
4. BE registra el evento.
5. El caso finaliza sin modificar la cuenta.

**Variantes.** **V01 — Acceso mediante Google**

**Resultado:** continúa mediante `UC-E05`.

**V02 — Administración de métodos**

**Resultado:** continúa mediante `UC-E06`.

**V03 — Acceso local no recuperable**

**Resultado:** continúa mediante `UC-E09`.

**Excepciones.** **E01 — Método inválido**

**Resultado:** no crea sesión y no filtra datos de la identidad.

**E02 — Cuenta cerrada o no operativa**

**Resultado:** no crea nuevas sesiones.

**E03 — Falla de creación o cierre**

**Resultado:** no presenta un estado falso.

**Reglas aplicables.** 1. `RF-002`, `RF-006` y `RF-007` gobiernan el caso.
2. Google y recuperación son extensiones.
3. Autorización pertenece a `UC-I02`.
4. Seguridad técnica pertenece a `08/09`.
5. Navegación pertenece a 10.

**Casos incluidos.** - `UC-I03`
- `UC-I11`

**Puntos de auditoría.** - identidad;
- método;
- resultado;
- estado operativo;
- superficie;
- creación o cierre de sesión;
- fecha;
- falla.

**Criterio de cierre.** Existe una sesión válida o una sesión finalizada de forma trazable, sin conceder permisos implícitos.

---

---

### `UC-P27` — Solicitar cierre de cuenta

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `12.9` · **Bloque:** Cierre complementario A — Identidad, acceso y ciclo de cuenta

**Objetivo.** Permitir que el titular solicite un cierre trazable que impida nuevas sesiones y operaciones, finalice vínculos activos mediante eventos y preserve información conforme a políticas posteriores.

**Actor principal.** Profesional o asesorado.

**Precondiciones.** 1. El titular posee identidad y sesión válidas.
2. `UC-I02` autoriza decidir sobre la cuenta propia.
3. BE puede identificar sesiones y vínculos activos.
4. La solicitud puede confirmarse de forma explícita.

**Postcondiciones de éxito.** 1. El estado operativo impide nuevas sesiones.
2. Las sesiones activas dejan de ser utilizables conforme a política.
3. Los vínculos activos se finalizan mediante eventos trazables.
4. No se aceptan nuevas operaciones profesionales.
5. La identidad, autoría e historia permanecen.
6. No se ejecuta borrado silencioso.
7. Retención, supresión y reversibilidad quedan derivadas a `06/08`.
8. El cierre queda trazable.

**Garantías mínimas.** - Cerrar no equivale a borrar inmediatamente.
- Cerrar no reasigna autoría.
- No se eliminan versiones o revisiones.
- Los vínculos no desaparecen sin evento.
- No se crean nuevas sesiones.
- Una falla no deja un cierre parcial presentado como completo.
- Reapertura o reversibilidad no se decide en 05.

**Flujo principal.** 1. El titular solicita cerrar la cuenta.
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

**Variantes.** **V01 — Cuenta sin vínculos activos**

**Resultado:** se cierra sin inventar eventos relacionales.

**V02 — Cuenta profesional con procesos vigentes**

**Resultado:** se impiden nuevas operaciones; retención y continuidad documental pertenecen a 06/08.

**V03 — Solicitud cancelada antes de confirmar**

**Resultado:** no cambia el estado operativo.

**Excepciones.** **E01 — Actor no autorizado**

**Resultado:** BE deniega.

**E02 — Cierre concurrente**

**Resultado:** presenta la situación vigente sin duplicar eventos.

**E03 — Falla al finalizar vínculos**

**Resultado:** no presenta cierre completo; registra inconsistencia.

**E04 — Solicitud de borrado total inmediato**

**Resultado:** se deriva a política de retención y supresión; no borra silenciosamente.

**Reglas aplicables.** 1. `RF-069` gobierna el cierre.
2. El cierre impide nuevas sesiones.
3. Los vínculos finalizan mediante eventos.
4. La historia se conserva.
5. Retención y reversibilidad pertenecen a 06/08.
6. Contratos pertenecen a 09.
7. Copy y confirmaciones pertenecen a 10.

**Casos incluidos.** - `UC-I02`
- `UC-I03`

**Casos relacionados.** - `UC-P06`
- `UC-P26`

**Puntos de auditoría.** - titular;
- confirmación;
- estado anterior y posterior;
- sesiones;
- vínculos finalizados;
- fecha;
- fallas;
- solicitud de borrado.

**Criterio de cierre.** La cuenta queda cerrada de forma trazable y sin nuevas sesiones, o una excepción impide declarar un cierre parcial como completo.

---

---

### `UC-P28` — Registrar y gestionar incidencia administrativa

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `13.3` · **Bloque:** Cierre complementario B — Administración, capacidad y comunicaciones

**Objetivo.** Permitir que un actor registre una incidencia y que un administrador autorizado gestione su seguimiento y resolución sin acceder a información ajena fuera del alcance.

**Actor principal.** Profesional, asesorado o administrador.

**Precondiciones.** 1. El actor posee identidad y sesión válidas.
2. `UC-I02` autoriza registrar o consultar la incidencia.
3. La materia puede describirse sin incluir información innecesaria.
4. La incidencia puede asociarse a autor y fecha.

**Postcondiciones de éxito.** 1. Existe una incidencia trazable.
2. Conserva actor, fecha, alcance, seguimiento y resultado.
3. El actor consulta únicamente incidencias propias o permitidas.
4. El administrador accede conforme a su función.
5. No se modifica automáticamente ningún dato de dominio.
6. La resolución queda registrada.

**Garantías mínimas.** - Una incidencia no es un chat general.
- No concede acceso a información protegida.
- No sustituye casos propietarios de corrección o cierre.
- No se presenta como diagnóstico.
- No se elimina la historia de seguimiento.
- Un fallo no presenta la incidencia como resuelta.

**Flujo principal.** 1. El actor inicia una incidencia.
2. BE ejecuta `UC-I02`.
3. El actor describe el problema y su contexto mínimo.
4. BE presenta el resumen.
5. El actor confirma.
6. BE registra mediante `UC-I03`.
7. Un administrador autorizado consulta la incidencia.
8. Registra seguimiento o resolución.
9. BE preserva la secuencia.
10. El caso finaliza.

**Variantes.** **V01 — Incidencia propia**

**Resultado:** el actor consulta su seguimiento.

**V02 — Incidencia administrativa interna**

**Resultado:** solo administradores autorizados acceden.

**V03 — Incidencia que requiere un caso propietario**

**Resultado:** se deriva al caso correspondiente sin modificar datos desde soporte.

**Excepciones.** **E01 — Información ajena**

**Resultado:** BE deniega.

**E02 — Descripción con datos innecesarios**

**Resultado:** la política de minimización se deriva a 08/10.

**E03 — Resolución sin evidencia**

**Resultado:** no se declara resuelta.

**Requisitos relacionados.** - `RF-068`
- `RF-021`
- `RNF-OBS-003`

**Casos incluidos.** - `UC-I02`
- `UC-I03`

**Criterio de cierre.** La incidencia y su resultado quedan trazables o una excepción impide mostrar un seguimiento falso.

---

---

### `UC-P29` — Configurar habilitaciones y capacidad académica

> **Tipo:** Principal · **Canal:** Website · **Sección del 05:** `13.4` · **Bloque:** Cierre complementario B — Administración, capacidad y comunicaciones

**Objetivo.** Permitir que un administrador configure habilitaciones y capacidad aplicables a procesos nuevos, incluyendo identidades exclusivamente antropométricas, sin interrumpir procesos vigentes ni incorporar cobro real.

**Actor principal.** Administrador.

**Precondiciones.** 1. El administrador posee autorización.
2. La configuración puede asociarse a una identidad, alcance o regla aplicable.
3. `UC-I10` puede evaluar el efecto funcional.
4. La operación no ejecuta pagos.

**Postcondiciones de éxito.** 1. Existe una configuración versionada.
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

**Garantías mínimas.** - `DEC-044` se aplica.
- Antropometría no se convierte en especialidad.
- Capacidad no equivale a autorización.
- Un exceso rechaza procesos nuevos.
- Los procesos vigentes no se interrumpen.
- No existe cobro real.
- No se modifica una especialidad verificada desde este caso.
- La configuración anterior se conserva.

**Flujo principal.** 1. El administrador accede a configuración.
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

**Variantes.** **V01 — Solo Antropometría**

**Resultado:** la configuración es válida sin Nutrición o Entrenamiento.

**V02 — Capacidad excedida**

**Resultado:** futuros procesos nuevos se rechazan; los vigentes continúan.

**V03 — Simulación académica**

**Resultado:** se demuestra la regla sin integrar facturación real.

**Excepciones.** **E01 — Configuración incompatible**

**Resultado:** no se aplica.

**E02 — Intento de cerrar procesos vigentes**

**Resultado:** BE rechaza la consecuencia.

**E03 — Intento de cobrar**

**Resultado:** se rechaza por estar fuera del alcance.

**Requisitos relacionados.** - `RF-066`
- `RF-021`
- `DEC-044`

**Casos incluidos.** - `UC-I02`
- `UC-I03`
- `UC-I10`

**Criterio de cierre.** La configuración queda versionada y aplicable a procesos nuevos sin interrumpir procesos vigentes.

---

---

### `UC-P30` — Consultar novedades internas

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `13.5` · **Bloque:** Cierre complementario B — Administración, capacidad y comunicaciones

**Objetivo.** Permitir que profesionales y asesorados consulten novedades internas no clínicas desde un centro propio de BE.

**Actor principal.** Profesional o asesorado.

**Precondiciones.** 1. El actor posee identidad y sesión válidas.
2. `UC-I02` autoriza la novedad según audiencia.
3. La novedad puede mostrarse sin información sensible.

**Postcondiciones de éxito.** 1. El actor consulta novedades autorizadas.
2. Cada novedad conserva autoría o fuente, fecha y audiencia.
3. No contiene diagnóstico o datos de salud.
4. La consulta no modifica dominios.
5. El centro interno funciona aunque push no esté disponible.

**Garantías mínimas.** - Es un canal interno no clínico.
- No es nota de coordinación.
- No es chat.
- No incluye información sensible.
- Push es opcional.
- Una falla de push no elimina la novedad.
- La audiencia no se amplía silenciosamente.

**Flujo principal.** 1. El actor abre novedades.
2. BE ejecuta `UC-I02`.
3. BE obtiene novedades de su audiencia.
4. Presenta fecha, fuente y contenido autorizado.
5. El actor consulta el detalle.
6. BE registra la consulta según política.
7. El caso finaliza.

**Variantes.** **V01 — Novedad general**

**Resultado:** se muestra a la audiencia autorizada.

**V02 — Novedad por tipo de actor**

**Resultado:** se limita a profesional o asesorado.

**V03 — Push disponible**

**Resultado:** puede invocarse `UC-E08`.

**Excepciones.** **E01 — Contenido sensible**

**Resultado:** no se publica como novedad.

**E02 — Audiencia no autorizada**

**Resultado:** BE no muestra el contenido.

**E03 — Falla de consulta**

**Resultado:** no presenta información parcial como completa.

**Requisitos relacionados.** - `RF-061`
- `RF-021`

**Casos incluidos.** - `UC-I02`
- `UC-I03`

**Criterio de cierre.** El actor consulta novedades no clínicas autorizadas desde el centro interno.

---

---

### `UC-P31` — Consultar progreso longitudinal en APK

> **Tipo:** Principal · **Canal:** APK · **Sección del 05:** `11.9` · **Bloque:** Bloque 08 — Cartera, dashboard, coordinación y progreso longitudinal

**Objetivo.** Permitir que el asesorado consulte su propia información longitudinal por dominio y período, con procedencia y límites visibles, sin autodiagnóstico ni comparación con terceros.

**Alcance.** - **Superficie:** APK Android.
- **Inicio:** el asesorado accede a su progreso.
- **Fin:** consulta información propia autorizada sin modificarla.

**Actor principal.** Asesorado.

**Actores secundarios.** - Sistema BE.
- Profesionales vinculados como autores de información visible.

**Disparador.** El asesorado decide consultar su evolución.

**Precondiciones.** 1. El asesorado posee identidad y sesión válidas.
2. `UC-I02` autoriza el acceso a información propia.
3. Existen eventos o períodos visibles.
4. Cada elemento puede asociarse a dominio y procedencia.
5. Las notas profesionales se filtran conforme a política.
6. La vista no requiere información de terceros.

**Postcondiciones de éxito.** 1. El asesorado consulta únicamente su información.
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

**Garantías mínimas.** - El asesorado solo consulta información propia.
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

**Flujo principal.** 1. El asesorado abre progreso.
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

**Variantes.** **V01 — Progreso nutricional**

**Resultado:** muestra planificación, ejecución o adherencia y revisiones visibles sin diagnóstico.

**V02 — Progreso de entrenamiento**

**Resultado:** diferencia prescripción y ejecución real.

**V03 — Evolución antropométrica**

**Resultado:** diferencia mediciones directas y cálculos derivados e informa limitaciones.

**V04 — Varios dominios**

**Resultado:** cada dominio permanece separado; no se produce una conclusión agregada.

**V05 — Período sin información suficiente**

**Resultado:** BE informa limitación sin inventar tendencia.

**V06 — Evento registrado después de ocurrir**

**Resultado:** se muestran ambos momentos cuando están disponibles.

**Excepciones.** **E01 — Información de otro asesorado**

**Resultado:** BE deniega sin revelar existencia.

**E02 — Nota profesional no visible**

**Resultado:** BE no la muestra ni indica contenido.

**E03 — Procedencia ausente**

**Resultado:** el elemento se presenta con limitación o se excluye conforme a política.

**E04 — Comparación con terceros solicitada**

**Resultado:** BE no genera la comparación.

**E05 — Interpretación diagnóstica solicitada**

**Resultado:** BE no la produce.

**E06 — Datos incompatibles**

**Resultado:** BE no fuerza una tendencia o equivalencia silenciosa.

**E07 — Falla de consulta**

**Resultado:** no presenta información parcial como completa.

**Reglas aplicables.** 1. `RF-065` gobierna progreso longitudinal en APK.
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

**Información utilizada o generada.** **Utilizada**

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

**Generada**

- vista de progreso;
- filtros;
- límites;
- resultado de consulta;
- evento de auditoría.

**Requisitos relacionados.** - `RF-065 — Consultar progreso longitudinal en APK`
- `RF-054 — Construir historial longitudinal`
- `RF-021 — Evaluar autorización contextual`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Casos relacionados.** - `UC-P12 — Ejecución nutricional`
- `UC-P17 — Ejecución de entrenamiento`
- `UC-P20 — Evolución antropométrica`
- `UC-P24 — Dashboard y línea temporal`

**Puntos de auditoría.** - asesorado;
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

**Decisiones o preguntas abiertas.** 1. Datos visibles: `DERIVAR 08`.
2. Filtros y períodos: `DERIVAR 06/10`.
3. Contratos: `DERIVAR 09`.
4. Gráficos y copy: `DERIVAR 10`.
5. Pruebas de filtración: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando el asesorado consulta su progreso longitudinal propio con límites y procedencia visibles, o cuando una excepción impide producir una vista invasiva o engañosa.

---

---

### `UC-P32` — Solicitar información estructurada pertinente al asesorado

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `13.6` · **Bloque:** Cierre complementario B — parche CAP-DAT v0.15

**Objetivo.** Permitir que un profesional autorizado solicite al asesorado información estructurada pertinente para una finalidad y alcance determinados, usando una plantilla BE versionada y sin convertir la solicitud en consentimiento, vínculo o acceso adicional.

**Actor principal.** Profesional autorizado.

**Actores secundarios.** - Asesorado.
- Sistema BE.

**Precondiciones.** 1. La identidad profesional está activa.
2. La especialidad/capacidad aplicable está verificada y habilitada.
3. Existe vínculo aceptado.
4. Existe consentimiento/autorización vigente suficiente para la finalidad y categorías solicitadas.
5. `UC-I02` autoriza la operación.
6. La finalidad y el alcance son identificables.
7. Existe una plantilla BE versionada compatible con esa finalidad.
8. Los campos/categorías solicitados son pertinentes.
9. La estructura concreta se deriva a 06/10.

**Postcondiciones de éxito.** 1. Existe una solicitud identificable y trazable.
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

**Garantías mínimas.** - Solicitar ≠ consentir.
- Solicitar ≠ obtener acceso.
- Plantilla P0 = BE versionada; no builder libre.
- No se solicitan categorías fuera de finalidad/alcance.
- Un campo requerido debe ser legítimo y visible como tal.
- No se convierte una respuesta futura en diagnóstico o medición.
- La existencia de una plantilla no concede autorización.
- Un fallo no presenta la solicitud como enviada.

**Flujo principal.** 1. El profesional selecciona al asesorado dentro de una relación pertinente.
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

**Variantes.** **V01 — Solicitar subconjunto permitido**

La plantilla admite secciones opcionales.

**Resultado:** el profesional solicita solo el subconjunto pertinente, preservando la versión de plantilla.

**V02 — Dato ya existente en perfil propio**

BE identifica que un dato equivalente existe en `UC-P25`.

**Resultado:** la solicitud puede pedir confirmación/reutilización sin alterar silenciosamente el dato de perfil ni perder procedencia.

**V03 — Solicitud sucesora**

Existe una solicitud anterior para finalidad compatible.

**Resultado:** la nueva solicitud queda relacionada y no sobrescribe la anterior.

**Excepciones.** **E01 — Profesional no autorizado**

**Resultado:** BE deniega sin revelar información protegida.

**E02 — Finalidad o alcance ausentes**

**Resultado:** no se crea la solicitud.

**E03 — Campo/categoría no pertinente**

**Resultado:** BE no permite solicitarlo dentro de esa finalidad.

**E04 — Plantilla incompatible o no seleccionable**

**Resultado:** no se envía como si fuera válida; detalle técnico: DERIVAR 06/09.

**E05 — Consentimiento/autorización insuficientes**

**Resultado:** BE no usa la solicitud para ampliar acceso.

**E06 — Falla de persistencia o auditoría**

**Resultado:** no se presenta la solicitud como creada.

**Requisitos relacionados.** - `RF-071`
- `RF-021`
- `RF-025`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Decisiones o preguntas abiertas.** 1. Plantillas/versiones/campos: `DERIVAR 06`.
2. Categorías, pertinencia, B2/PDP y acceso: `DERIVAR 08`.
3. Contratos/estados/idempotencia: `DERIVAR 09`.
4. Formulario/copy: `DERIVAR 10`.
5. Pruebas: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando existe una solicitud autorizada, versionada y comprensible para el asesorado o cuando una excepción impide pedir información fuera del alcance.

---

---

### `UC-P33` — Completar información solicitada

> **Tipo:** Principal · **Canal:** Transversal · **Sección del 05:** `13.7` · **Bloque:** Cierre complementario B — parche CAP-DAT v0.15

**Objetivo.** Permitir que el asesorado complete una solicitud propia de información profesional preservando `SELF_REPORTED`, relación con la solicitud y plantilla/version, historia y separación respecto de perfil propio, medición profesional, diagnóstico y consentimiento.

**Actor principal.** Asesorado.

**Actores secundarios.** - Sistema BE.
- Profesional solicitante, como destinatario únicamente dentro de autorización vigente.

**Precondiciones.** 1. El asesorado posee identidad y sesión válidas.
2. La solicitud pertenece al asesorado.
3. La solicitud y su finalidad pueden revelarse al actor.
4. `UC-I02` autoriza la operación protegida correspondiente.
5. La plantilla/version de la solicitud es identificable.
6. Los campos requeridos/opcionales pueden distinguirse.

**Postcondiciones de éxito.** 1. Existe una respuesta relacionada con la solicitud exacta.
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

**Garantías mínimas.** - Responder ≠ consentir.
- SELF_REPORTED ≠ medido.
- SELF_REPORTED ≠ diagnosticado.
- Actualizar perfil ≠ responder solicitud.
- Mismo valor ≠ mismo origen.
- No existe sobrescritura silenciosa de una respuesta enviada.
- Un campo opcional omitido no se inventa como cero/negativo.
- Un fallo no presenta la respuesta como enviada.
- Si el profesional deja de estar autorizado, la respuesta no se expone por la mera existencia de la solicitud.

**Flujo principal.** 1. El asesorado consulta sus solicitudes.
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

**Variantes.** **V01 — Reutilizar dato de perfil**

**Resultado:** se conserva referencia/procedencia del dato de `UC-P25`; la respuesta sigue siendo un acto distinto.

**V02 — Omitir campo opcional**

**Resultado:** el campo queda sin respuesta; no se completa artificialmente.

**V03 — Corregir respuesta enviada**

La política permite rectificar una respuesta.

**Resultado:** se crea una versión/rectificación sucesora sin sobrescribir la respuesta original; estructura: DERIVAR 06/09.

**Excepciones.** **E01 — Solicitud ajena**

**Resultado:** BE no revela contenido ni permite responder.

**E02 — Campo requerido faltante**

**Resultado:** no se declara la respuesta como completa.

**E03 — Solicitud no vigente o contexto cambiado**

**Resultado:** BE no expone la respuesta al profesional como si la autorización continuara; estado técnico/política: DERIVAR 06/08.

**E04 — Dato de perfil incompatible**

**Resultado:** BE no lo reutiliza automáticamente como respuesta equivalente.

**E05 — Intento de convertir respuesta en diagnóstico/medición**

**Resultado:** BE mantiene la clasificación `SELF_REPORTED`.

**E06 — Falla de persistencia o auditoría**

**Resultado:** no se presenta la respuesta como enviada.

**Requisitos relacionados.** - `RF-071`
- `RF-021`
- `RF-025`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-OBS-003`

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Decisiones o preguntas abiertas.** 1. Estructura/versionado de respuestas: `DERIVAR 06`.
2. Visibilidad, categorías, retención y acceso: `DERIVAR 08`.
3. Contratos/concurrencia/idempotencia: `DERIVAR 09`.
4. UI/copy: `DERIVAR 10`.
5. Pruebas: `DERIVAR 11A`.

**Criterio de cierre.** El caso termina cuando una respuesta SELF_REPORTED queda vinculada y trazable sin ampliar acceso ni perder procedencia, o cuando una excepción impide presentarla como completa.

---

**Relación explícita con perfil propio.** `UC-P33` no reemplaza `UC-P25`.

```text
UC-P25
→ administra perfil propio

UC-P33
→ responde una solicitud profesional concreta

mismo valor
≠ mismo acto
≠ misma procedencia
```

---

## Fichas compactas — casos incluidos, de extensión y de soporte

### `UC-I01` — Presentar evidencia versionada

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.2`

**Objetivo.** Presentar evidencia profesional asociada a una especialidad o capacidad, preservando versión, autoría, fecha, alcance y relación con presentaciones anteriores.

**Precondiciones.** 1. Existe una identidad profesional.
2. El alcance puede identificarse.
3. El actor puede aportar evidencia.
4. El formato puede validarse conforme a políticas posteriores.

**Garantías mínimas.** - Una nueva presentación no sobrescribe la anterior.
- Evidencia de una especialidad no se aplica a otra.
- La capacidad antropométrica puede presentarse de forma independiente.
- Presentar no equivale a verificar.
- La validación técnica pertenece a 09/11A.

**Requisitos relacionados.** - `RF-009`;
- `RF-010`;
- `RF-013`;
- `RF-067`.


### `UC-I02` — Evaluar autorización contextual

> **Tipo:** Incluido · **Canal:** Website · APK · **Sección del 05:** `6.7`

**Objetivo.** Determinar si una operación protegida puede ejecutarse considerando conjuntamente las dimensiones aprobadas, y denegar de forma segura cuando alguna no se cumple.

**Actor principal.** Sistema BE.

**Precondiciones.** 1. La identidad del actor puede evaluarse.
2. La operación y el contexto solicitado pueden identificarse.
3. Existe información suficiente para evaluar las dimensiones aplicables.
4. Si la evaluación no puede completarse, la operación no se presume autorizada.

**Garantías mínimas.** - Autenticación no equivale a autorización.
- Rol aislado no equivale a autorización.
- Vínculo aceptado no equivale a consentimiento.
- Consentimiento vigente no equivale a autorización si falla otra dimensión.
- `VERIFICADO` no equivale a habilitado ni autorizado.
- Antropometría se evalúa como capacidad transversal.
- Una revocación debe reflejarse en operaciones futuras.
- La falta de información o una inconsistencia producen denegación conservadora.
- La denegación no filtra información protegida.
- Una pantalla visible no determina autorización.

**Requisitos relacionados.** **RF**

- `RF-021 — Evaluar autorización contextual en cada operación protegida`
- `RF-015 — Mantener separadas verificación, habilitación y autorización`
- `RF-020 — Consentimiento específico y versionado`
- `RF-022 — Revocación efectiva`
- `RF-023 — Consulta coherente de vínculos y consentimientos`
- `RF-047 — Registro antropométrico autorizado`
- `RF-053 — Dashboard interdisciplinario autorizado`

**RNF conductuales**

- `RNF-REL-001`
- `RNF-SEC-001`
- `RNF-SEC-005`
- `RNF-SEC-006`
- `RNF-PRI-002`
- `RNF-OBS-003`
- `RNF-MAN-004`


### `UC-I03` — Registrar auditoría y preservar historia

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.3`

**Objetivo.** Registrar eventos sensibles y preservar una historia reconstruible sin sobrescritura silenciosa.

**Precondiciones.** 1. El caso invocante identifica actor y operación.
2. Puede determinarse el resultado.
3. Ocurrencia y registro se distinguen cuando corresponda.
4. Las relaciones con versiones o eventos anteriores pueden conservarse.

**Garantías mínimas.** - No borra evidencia histórica.
- No reasigna autoría.
- No confunde ocurrencia con registro.
- Una falla de auditoría puede impedir la operación cuando el control sea obligatorio.
- No define persistencia técnica.

**Requisitos relacionados.** - `RF-025`;
- `RF-044`;
- `RF-050`;
- `RF-054`;
- `RF-069`;
- RNF de observabilidad y datos.


### `UC-I04` — Validar y versionar un plan

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.4`

**Objetivo.** Validar una versión candidata de plan y preservar una instantánea reproducible antes de activarla.

**Precondiciones.** 1. Existe un borrador identificado.
2. Existe evaluación y objetivo aplicables.
3. El profesional está autorizado.
4. La instantánea puede preservarse.

**Garantías mínimas.** - No fija contenido profesional.
- Una versión activa no se reconstruye desde el catálogo actual.
- No sobrescribe versiones anteriores.
- Validar no equivale a activar.
- La estructura pertenece a 06.

**Requisitos relacionados.** - `RF-031`;
- `RF-041`.


### `UC-I05` — Registrar revisión profesional válida

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `8.7`

**Objetivo.** Registrar el evento explícito definido por `DEC-043` sin duplicar ni alterar su semántica.

**Precondiciones.** 1. Actor profesional autorizado.
2. Dominio y período identificados.
3. Evidencia accesible e identificable.
4. Resultado semántico permitido.
5. Fundamento.
6. Próxima acción o cierre.

**Garantías mínimas.** - Aplica literalmente los siete componentes de `DEC-043`.
- No define entidad, enum, endpoint o formulario.
- No infiere revisión desde actividad de interfaz.
- No acepta decisión automática sin registro profesional.
- Conserva autoría y evidencia.
- Funciona como patrón común para UC-P13 y UC-P18.

**Requisitos relacionados.** - `RF-056`
- `RF-034`
- `RF-045`
- `DEC-043`


### `UC-I06` — Aplicar continuidad o cierre

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `8.8`

**Objetivo.** Aplicar la consecuencia funcional de una revisión válida mediante continuidad explícita o cierre, preservando versiones e historia.

**Precondiciones.** 1. Existe una revisión profesional válida.
2. Existe un resultado semántico.
3. Existe una próxima acción o cierre.
4. El actor continúa autorizado.
5. La situación no cambió de forma incompatible.

**Garantías mínimas.** - No existe continuidad sin revisión válida.
- No existe cierre silencioso.
- Mantener es una decisión registrada.
- Sustituir conserva la versión anterior.
- Finalizar conserva evidencia.
- No fija transiciones técnicas definitivas.
- No calcula TVCC-30.

**Requisitos relacionados.** - `RF-035`
- `RF-046`
- `RF-056`
- `RF-058`, como productor de eventos consumibles.


### `UC-I07` — Importar elemento externo con revisión controlada

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.5`

**Objetivo.** Incorporar un elemento de un proveedor externo solo después de revisión profesional, conservando procedencia y decisión de incorporación.

**Precondiciones.** 1. Existe una respuesta externa.
2. El proveedor y la fecha pueden identificarse.
3. El profesional puede revisar el elemento.
4. El catálogo propio permanece disponible.

**Garantías mínimas.** - No existe importación ciega.
- El proveedor no es fuente única.
- Un dato incompleto puede rechazarse.
- Una corrección no oculta la fuente original.
- Contratos pertenecen a 09.

**Requisitos relacionados.** - `RF-028`;
- `RF-038`;
- `RF-060`.


### `UC-I08` — Aplicar fallback manual y conservar procedencia

> **Tipo:** Incluido · **Canal:** Transversal · **Sección del 05:** `14.6`

**Objetivo.** Mantener el núcleo operativo cuando un tercero no está disponible, informando la contingencia y conservando la procedencia de cualquier dato alternativo.

**Precondiciones.** 1. Existe una dependencia externa o una representación opcional.
2. La indisponibilidad puede detectarse.
3. Existe una alternativa funcional propia o manual.

**Garantías mínimas.** - El tercero no bloquea el núcleo.
- No se inventan datos.
- La procedencia se conserva.
- El fallback es observable.
- La recuperación del tercero no sobrescribe datos manuales.
- Arquitectura y contratos pertenecen a 07/09.

**Requisitos relacionados.** - `RF-059`;
- `RF-060`;
- `TR-04`.


### `UC-I09` — Emitir cálculos antropométricos reproducibles

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `10.7`

**Objetivo.** Aplicar el patrón transversal `UC-I13` a cálculos derivados antropométricos a partir de mediciones directas identificables, conservando las garantías específicas de protocolo, unidad, dependencias y separación `medición directa ≠ resultado derivado`, sin fijar fórmulas concretas en Documento 05.

**Precondiciones.** 1. El contexto invocante fue autorizado mediante `UC-I02`.
2. Existen mediciones directas identificables.
3. Cada entrada conserva unidad y procedencia.
4. El protocolo de medición puede identificarse.
5. Existe un método/version aplicable para la finalidad antropométrica.
6. Las entradas requeridas por ese método son admisibles.
7. El resultado puede diferenciarse de una medición directa.

**Garantías mínimas.** - `UC-I13` es la única definición transversal de ejecución reproducible.
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

**Requisitos relacionados.** - `RF-048`
- `RF-050`, cuando se invoca desde `UC-E03`
- `RF-070`, por especialización del patrón común
- `RNF-DAT-003`
- `RNF-OBS-003`


### `UC-I10` — Verificar habilitación y capacidad antes de iniciar proceso

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.7`

**Objetivo.** Comprobar habilitación y capacidad aplicables antes de iniciar un proceso nuevo o publicar un servicio, sin interrumpir procesos vigentes.

**Precondiciones.** 1. Existe una identidad profesional.
2. El alcance puede identificarse.
3. Existe una configuración aplicable.
4. La operación puede clasificarse como proceso nuevo, vigente o publicación.

**Garantías mínimas.** - Verificado no equivale a habilitado.
- Habilitado no equivale a autorizado.
- Capacidad no revoca vínculos.
- No borra datos.
- No interrumpe procesos vigentes.
- No incorpora pagos reales.

**Requisitos relacionados.** - `RF-066`;
- `DEC-044`.


### `UC-I11` — Encauzar al actor por la superficie prevista

> **Tipo:** Incluido · **Canal:** Transversal · **Sección del 05:** `14.8`

**Objetivo.** Determinar la superficie funcional prevista para el actor y el recorrido, sin fijar navegación concreta ni conceder autorización.

**Precondiciones.** 1. El actor o intención puede identificarse.
2. El recorrido posee una superficie prevista.
3. La identidad y el estado operativo pueden evaluarse cuando corresponda.

**Garantías mínimas.** - Encauzar no equivale a autorizar.
- No define menús, rutas o componentes.
- No expone información protegida.
- Un actor puede usar varias superficies solo cuando el producto lo prevé.
- Navegación pertenece a 10.

**Requisitos relacionados.** - `RF-007`.


### `UC-I12` — Registrar corrección trazable

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `10.9`

**Objetivo.** Registrar una corrección posterior preservando el dato original y haciendo reconstruible qué cambió, quién lo cambió, cuándo y por qué.

**Precondiciones.** 1. El caso invocante ejecutó `UC-I02`.
2. Existe un original identificable.
3. Existe una corrección propuesta.
4. El actor puede identificarse.
5. La fecha puede identificarse.
6. El motivo se registra cuando la política lo exige.
7. La corrección puede relacionarse con el original.

**Garantías mínimas.** - El original se conserva.
- La corrección no borra.
- La autoría no se reasigna.
- La cadena se reconstruye.
- La vista efectiva puede determinarse.
- No decide quién puede corregir.
- No ejecuta cálculos de dominio.
- No modifica prescripciones o protocolos.
- No fija estructura persistente.

**Requisitos relacionados.** - `RF-044`
- `RF-050`
- `RNF-DAT-003`
- `RNF-OBS-003`


### `UC-I13` — Ejecutar y adoptar cálculo profesional reproducible

> **Tipo:** Incluido · **Canal:** Website · **Sección del 05:** `14.9`

**Objetivo.** Permitir que un profesional autorizado ejecute uno o más métodos de cálculo versionados y pertinentes como **apoyo profesional**, conservando método, versión, requisitos, inputs efectivos, procedencia y resultado y manteniendo la separación:

```text
cálculo
≠ sugerencia
≠ selección
≠ referencia adoptada
≠ decisión profesional
```

**Precondiciones.** 1. El caso invocante fue autorizado mediante `UC-I02`.
2. Existe una finalidad profesional identificable.
3. Existe un método/versión disponible y seleccionable para esa finalidad.
4. Sus inputs obligatorios son identificables.
5. Cada input conserva procedencia.
6. La procedencia/tipo de cada input es admisible para ese método.
7. El profesional decide explícitamente ejecutar el método.
8. `DEC-046 §4.4/§4.9` e `INV-06-133` permanecen vigentes.

**Garantías mínimas.** - BE no fija una fórmula propia como requerimiento autónomo.
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

**Requisitos relacionados.** - `RF-070`
- `RF-048`, únicamente mediante la especialización antropométrica `UC-I09`
- `RNF-DAT-003`
- `RNF-OBS-003`
- `RNF-MAN-004`


### `UC-E01` — Subsanar y volver a presentar evidencia

> **Tipo:** Extensión · **Canal:** Website · **Sección del 05:** `4.7`

**Objetivo.** Permitir que el profesional responda una observación corregible y presente una nueva versión sin borrar la solicitud, evidencia, observaciones o resolución anterior.

**Actor principal.** Profesional.

**Precondiciones.** 1. La identidad del profesional se encuentra habilitada para operar su cuenta.
2. Existe una observación consultable.
3. La observación corresponde a un alcance específico.
4. La subsanación está permitida.
5. La versión anterior no puede sobrescribirse.

**Requisitos relacionados.** - `RF-013`
- `RF-009`
- `RF-010`
- `RF-011`
- `RNF-DAT-003`
- `RNF-SEC-005`
- `RNF-OBS-003`


### `UC-E02` — Corregir ejecución de entrenamiento

> **Tipo:** Extensión · **Canal:** Transversal · **Sección del 05:** `9.10`

**Objetivo.** Permitir una rectificación posterior preservando el registro original y haciendo reconstruible qué cambió, quién lo cambió, cuándo y por qué.

**Actor principal.** Asesorado o profesional autorizado, según la política que defina el Documento 08.

**Precondiciones.** 1. Existe un registro original identificable.
2. El actor está autorizado.
3. La corrección puede relacionarse con el original.
4. El registro original no será sobrescrito.
5. El motivo puede registrarse.

**Garantías mínimas.** - Corregir no sobrescribe.
- Corregir no borra.
- La autoría real se conserva.
- El motivo queda identificado cuando la política lo exige.
- Una corrección no modifica la prescripción.
- La corrección no se presenta como nueva ejecución independiente.
- Un fallo no produce una vista efectiva falsa.

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Requisitos relacionados.** - `RF-044`
- `RF-021`
- `RNF-DAT-003`
- `RNF-OBS-003`


### `UC-E03` — Corregir evaluación antropométrica

> **Tipo:** Extensión · **Canal:** Website · **Sección del 05:** `10.8`

**Objetivo.** Permitir que un profesional autorizado **corrija o anule** una medición antropométrica conforme a `RF-050`, preservando siempre el original, actor, fecha, motivo e historia y evitando que una anulación se materialice como borrado.

**Actor principal.** Profesional autor o profesional autorizado según la política aplicable.

**Precondiciones.** 1. Existe una evaluación original identificable.
2. El actor posee capacidad antropométrica.
3. `UC-I02` autoriza la operación.
4. La medición o metadato original puede identificarse.
5. El motivo puede registrarse.
6. La historia puede preservarse mediante `UC-I03`.
7. Para la rama de corrección, `UC-I12` puede preservar la cadena.
8. Si la operación afecta una entrada de cálculo, pueden identificarse los derivados dependientes o declararse la imposibilidad de reconstruirlos.

**Garantías mínimas.** - Corregir no sobrescribe.
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

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`
- `UC-I12 — Registrar corrección trazable`, solo en la rama de corrección.
- `UC-I09 — Emitir cálculos antropométricos reproducibles`, cuando corresponda.

**Requisitos relacionados.** - `RF-050`
- `RF-048`
- `RF-021`
- `RNF-DAT-003`
- `RNF-OBS-003`


### `UC-E04` — Solicitar vínculo desde descubrimiento antropométrico

> **Tipo:** Extensión · **Canal:** Website · **Sección del 05:** `10.13`

**Objetivo.** Convertir la selección de un servicio publicado en una solicitud de vínculo pendiente, preservando profesional, capacidad y finalidad sin crear aceptación, consentimiento o acceso.

**Actor principal.** Asesorado.

**Precondiciones.** 1. El asesorado posee identidad y sesión válidas.
2. El servicio continúa publicado y elegible.
3. El profesional puede identificarse.
4. La capacidad antropométrica puede identificarse.
5. La finalidad puede identificarse.
6. `UC-I02` autoriza iniciar la solicitud.

**Garantías mínimas.** - UC-E04 no implementa nuevamente el vínculo.
- UC-E04 invoca UC-P04.
- La solicitud queda pendiente.
- El asesorado debe aceptar conforme a UC-P05.
- El consentimiento permanece separado.
- La autorización permanece separada.
- No se transfieren datos.
- No se crea una reserva.
- No se crea una contratación.
- No se concede acceso.

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Requisitos relacionados.** - `RF-018`
- `RF-051`
- `RF-019`
- `RF-020`
- `RF-021`


### `UC-E05` — Acceder mediante Google

> **Tipo:** Extensión · **Canal:** Transversal · **Sección del 05:** `12.6`

**Objetivo.** Permitir un método federado opcional sin crear identidades duplicadas ni dependencia exclusiva del proveedor.

**Garantías mínimas.** - Google es P1 y opcional.
- El acceso local permanece disponible.
- La indisponibilidad de Google no bloquea el acceso local.
- Una cuenta federada no concede roles o permisos.
- No se fusionan identidades silenciosamente.
- Contratos pertenecen a 09.

**Requisitos relacionados.** - `RF-003`
- `RF-002`
- `RF-006`


### `UC-E06` — Administrar métodos de acceso

> **Tipo:** Extensión · **Canal:** Transversal · **Sección del 05:** `12.7`

**Objetivo.** Vincular o retirar métodos de acceso sin modificar la identidad BE ni dejar la cuenta sin una ruta utilizable.

**Precondiciones.** 1. El actor posee una sesión y autorización aplicables.
2. Existe al menos un método actual.
3. El método nuevo o a retirar puede identificarse.

**Garantías mínimas.** - La identidad persiste.
- No se retira el último método utilizable sin alternativa confirmada.
- Un método no equivale a rol.
- El cambio no modifica vínculos o consentimientos.
- La verificación técnica pertenece a 08/09.

**Requisitos relacionados.** - `RF-004`
- `RF-002`
- `RF-005`


### `UC-E07` — Registrar nota de coordinación autorizada

> **Tipo:** Extensión · **Canal:** Website · **Sección del 05:** `11.8`

**Objetivo.** Permitir que un profesional autorizado comunique contexto pertinente a otro profesional autorizado sin prescribir, modificar o decidir sobre el dominio ajeno ni transferir responsabilidad profesional.

**Actor principal.** Profesional autor.

**Precondiciones.** 1. El autor posee identidad y sesión válidas.
2. Existe vínculo y consentimiento aplicables.
3. La finalidad de coordinación está identificada.
4. `UC-I02` autoriza al autor.
5. `UC-I02` permite la visibilidad del destinatario.
6. La nota puede asociarse a dominio y contexto.
7. La nota no pretende modificar un plan ajeno.

**Garantías mínimas.** - Coordinar no equivale a prescribir.
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

**Casos incluidos.** - `UC-I02 — Evaluar autorización contextual`
- `UC-I03 — Registrar auditoría y preservar historia`

**Requisitos relacionados.** - `RF-057 — Registrar nota de coordinación autorizada`
- `RF-021 — Evaluar autorización contextual`
- `RF-054 — Línea temporal longitudinal`
- `RNF-DAT-003`
- `RNF-OBS-003`


### `UC-E08` — Recibir notificación push no sensible

> **Tipo:** Extensión · **Canal:** Transversal · **Sección del 05:** `13.8`

**Objetivo.** Avisar que existe una novedad sin incluir información sensible; el contenido completo permanece en el centro interno.

**Garantías mínimas.** - El push no contiene datos de salud.
- No contiene nombres de asesorados.
- No contiene mediciones, planes, diagnósticos o notas profesionales.
- No permite inferir contenido protegido.
- El push no concede acceso.
- La novedad permanece en el centro interno.
- La caída del canal no afecta la información.
- Push es P2 y recortable.

**Requisitos relacionados.** - `RF-062`
- `RF-061`
- `RF-021`


### `UC-E09` — Recuperar el acceso local

> **Tipo:** Extensión · **Canal:** Transversal · **Sección del 05:** `12.8`

**Objetivo.** Restablecer una ruta local utilizable mediante un recorrido neutral de proveedor, sin presuponer correo y sin crear una sesión antes de completar la verificación aplicable.

**Precondiciones.** 1. Existe una identidad BE.
2. El actor no dispone de un método local utilizable.
3. Puede iniciar una verificación conforme a política posterior.

**Garantías mínimas.** - No presupone correo.
- No presupone un proveedor.
- No crea una identidad nueva.
- No entrega acceso antes de completar la verificación.
- La contingencia queda documentada y trazable.
- Mecanismos y vigencias pertenecen a 08/09.

**Requisitos relacionados.** - `RF-005`
- `RF-002`
- `RF-006`


### `UC-S01` — Obtener TVCC-30 de manera reproducible

> **Tipo:** Soporte · **Canal:** Transversal · **Sección del 05:** `14.10`

**Objetivo.** Calcular y exponer una métrica académica reproducible a partir de ciclos elegibles que poseen revisión profesional válida y próxima acción o cierre, produciendo numerador, denominador, exclusiones y versión de regla auditables.

**Actor principal.** Sistema BE o responsable de validación autorizado.

**Precondiciones.** 1. Existe una especificación de cálculo versionada.
2. Existe una zona temporal o analítica aprobada.
3. Existen reglas de elegibilidad identificables.
4. Los ciclos candidatos pueden reconstruirse.
5. Las revisiones válidas provienen de `UC-I05`.
6. Las próximas acciones o cierres provienen de `UC-I06`.
7. Las demos y vínculos no elegibles pueden excluirse.
8. El actor está autorizado para consultar el resultado.

**Garantías mínimas.** - Abrir dashboard no crea un ciclo cerrado.
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

**Casos incluidos.** - `UC-I02`;
- `UC-I03`.

**Requisitos relacionados.** - `RF-058`;
- `RF-056`;
- `RF-054`;
- `DEC-043`.


---

# Recorridos de punta a punta

Tres trayectos completos que atraviesan varios casos de uso. No agregan casos ni relaciones: recorren los existentes mostrando, en cada paso, qué garantía del legajo se cumple. Son la respuesta escrita a «mostrame cómo funciona».

## Recorrido 1 — Alta del asesorado y primer vínculo

| # | Caso | Actor | Qué ocurre | Garantía verificable |
|---|---|---|---|---|
| 1 | `UC-P25` | Asesorado | Crea su identidad aceptando términos (A1) e información de privacidad (A2) | `REG-06-19`: no se crea identidad paralela si el método ya corresponde a una existente |
| 2 | `UC-P26` | Asesorado | Inicia sesión | `INV-06-01`: login ≠ autorización de dominio |
| 3 | — | Asesorado | Revisa y otorga el consentimiento de datos de salud (A3) | `08 §12.2`: A1, A2 y A3 son tres actos separados con evidencia propia |
| 4 | `UC-P04` | Profesional | Solicita el vínculo para un alcance concreto | `REG-06-44`: una sola solicitud equivalente puede estar `PENDIENTE` |
| 5 | `UC-P05` | Asesorado | Acepta | La aceptación crea el componente de alcance del vínculo; **no concede consentimiento** |
| 6 | `UC-P07` | Asesorado | Otorga consentimiento para esa finalidad | `7.5-01`: vínculo, consentimiento, finalidad y alcance son dimensiones distintas |
| 7 | `UC-I02` | Sistema BE | Evalúa autorización en cada operación posterior | `RF-021`: siete dimensiones, evaluadas por operación, nunca presumidas |

**Lo que este recorrido demuestra:** que registrarse, vincularse y autorizar acceso son tres cosas separadas, y que ninguna concede lo que corresponde a otra.

## Recorrido 2 — Circuito nutricional completo

| # | Caso | Actor | Qué ocurre | Garantía verificable |
|---|---|---|---|---|
| 1 | `UC-P09` | Profesional de Nutrición | Registra evaluación y fija objetivo | `INV-06-133`: BE no calcula el requerimiento por fórmula propia; el objetivo es decisión profesional fundada |
| 2 | `UC-I13` | Sistema BE | Ejecuta el método de cálculo que el profesional eligió | `REG-06-208`: el resultado es apoyo; no modifica objetivo, prescripción ni plan |
| 3 | `UC-P10` | Profesional | Diseña el plan: día tipo → comida → opción → ítem | `DEC-046 §4.1`: jerarquía fija; estado de preparación obligatorio en cada ítem |
| 4 | `UC-I07` / `UC-I08` | Sistema BE | Importa del catálogo o aplica fallback manual conservando procedencia | `RF-059`: la caída de una fuente externa es observable, no silenciosa |
| 5 | `UC-P11` | Profesional | Valida y activa la versión | `INV-06-04`: activar vuelve inmutable esa versión y emite su instantánea |
| 6 | `UC-P12` | Asesorado (APK) | Consulta el plan y registra lo que consumió | `DEC-014`: el registro no produce puntaje de adherencia |
| 7 | `UC-P13` | Profesional | Revisa evidencia y decide continuidad | `REG-06-75`: el ciclo se cierra al **aplicar** la consecuencia, no al decidirla |
| 8 | `UC-I05` / `UC-I06` | Sistema BE | Registra la revisión válida y aplica continuidad o cierre | Se emite `ContinuidadOCierreAplicado`; si no puede aplicarse, no se emite ni se declara éxito |

**Lo que demuestra:** que el circuito profesional completo es trazable de punta a punta y que planificado y registrado nunca se mezclan.

## Recorrido 3 — Corrección y anulación antropométrica

| # | Caso | Actor | Qué ocurre | Garantía verificable |
|---|---|---|---|---|
| 1 | `UC-P19` | Profesional con capacidad antropométrica | Registra una evaluación con sus mediciones directas | `DEC-044`: la antropometría es capacidad transversal, no una tercera especialidad |
| 2 | `UC-P19 V04` | Profesional | Guarda la evaluación como borrador y la retoma después | La evaluación en preparación **no** alimenta la evolución confirmada ni aparece como última registrada |
| 3 | `UC-I09` | Sistema BE | Calcula los derivados a partir de mediciones directas | `T-06-33`/`T-06-34`: medición directa y cálculo derivado nunca se confunden |
| 4 | `UC-E03` | Profesional autorizado | Detecta un error y **corrige** la medición | `UC-I12`: la corrección preserva el original y recalcula derivados |
| 5 | `UC-E03` | Profesional autorizado | O bien **anula** la medición con motivo | `RF-050` exige ambas ramas; `REG-06-16.4`: anulada ≠ borrada |
| 6 | `UC-I03` | Sistema BE | Registra el hecho en la historia con actor, momento y motivo | La autoría original no se reasigna |
| 7 | `UC-P20` | Profesional / Asesorado | Consulta la evolución | `INV-06-176`: el hueco se muestra como `SIN_DATO`, nunca como cero ni interpolado |

**Lo que demuestra:** que el sistema admite el error humano sin destruir evidencia, y que la ausencia de dato se declara en vez de rellenarse.

---

# Correspondencia diagrama ↔ ficha

| Vista de `DV-04 v0.3` | Casos hogar | Fichas en este documento |
|---|---|---|
| DV-04.1 Identidad y cuenta | `UC-P25` `UC-P26` `UC-P27` `UC-E05` `UC-E06` `UC-E09` | 3 completas · 3 compactas |
| DV-04.2 Verificación y administración | `UC-P01` `UC-P02` `UC-P03` `UC-P28` `UC-P29` `UC-E01` | 5 completas · 1 compacta |
| DV-04.3 Vínculo y consentimiento | `UC-P04` … `UC-P08` | 5 completas |
| DV-04.4 Nutrición | `UC-P09` … `UC-P13` | 5 completas |
| DV-04.5 Entrenamiento | `UC-P14` … `UC-P18` `UC-E02` | 5 completas · 1 compacta |
| DV-04.6 Antropometría | `UC-P19` `UC-P20` `UC-P21` `UC-P22` `UC-E03` `UC-E04` | 4 completas · 2 compactas |
| DV-04.7 Cartera y coordinación | `UC-P23` `UC-P24` `UC-P30` … `UC-P33` `UC-E07` `UC-E08` | 6 completas · 2 compactas |
| DV-04.8 Incluidos y soporte | `UC-I01` … `UC-I13` `UC-S01` | 14 compactas |

Las relaciones `include` y `extend` completas están en `DV-04_RELACIONES_UML.csv`.
