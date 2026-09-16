# ESTÁNDAR DE CALIDAD PARA LOS ENTREGABLES DE MESA — BE · Tesis Analista de Sistemas

> **Autor:** Claude (Fable 5.1), por delegación de Dirección · **Fecha:** 2026-09-11
> **Naturaleza:** norma de producción para `DV-01…DV-10`. No modifica el legajo. No modifica entregables existentes.
> **Motivo:** los tres entregables producidos hasta ahora (`DV-04 v0.3`, `DV-06`, `DV-07`) **verifican correctamente y comunican por debajo del nivel de tesis**. Este documento fija el nivel que corresponde y cómo alcanzarlo.

---

## 0. Diagnóstico: por qué «parecen hechos en cinco minutos»

No es una impresión: es un defecto de método. Los tres entregables comparten cuatro fallas que un tribunal de sistemas detecta en la primera página.

**Condensé el contenido como si la legibilidad fuera el objetivo.** No lo es. La legibilidad es una restricción; el objetivo es **representar fielmente el modelo**. Cuando el DER muestra `Consentimiento vigente` con «versión · alcance / finalidad / vigencia funcional», eso no son atributos: es prosa resumida en una caja. El 06 le dedica a esa entidad cinco reglas y cuatro invariantes con atributos nombrados. Un tribunal espera `consentimientoId`, `vinculoId`, `alcance`, `finalidad`, `versionNumero`, `otorgadoEn`, `revocadoEn`, `estado`, con clave conceptual marcada. Lo eliminé para que «quedara limpio». Quedó vacío.

**Dibujé cardinalidades sin rastrear su fuente.** Escribí `1 → 0..N` entre Identidad y Método de acceso sin citar qué `REG-06` lo sostiene. La nota dice «cardinalidades según REG-06 del área» — genérico, incomprobable. Es exactamente lo que este proyecto prohibió durante dos meses: afirmar sin artefacto a la vista.

**Omití sin declarar.** El DER cubre 47 de 79 términos `T-06`. Los 32 faltantes no aparecen en ninguna lista con motivo. La plantilla de derivación del kit exige esa tabla; no la produje.

**Entregué diagramas sin documentación, sin índice de conjunto y sin verificación cruzada.** Cincuenta y seis casos de uso sin sus fichas; nueve vistas de DER sin una que muestre cómo se conectan; tres entregables que nombran las mismas cosas y nunca comprobé que las nombraran igual.

El motor determinista fue la decisión correcta. **Usarlo para ir rápido en vez de para ir bien fue el error.**

---

## 1. Principios transversales — obligatorios para los diez entregables

### P1 · Completitud sobre limpieza

Un artefacto de tesis representa **todo** lo que la fuente declara para su alcance, o lista explícitamente lo que omite y por qué. La condensación es legítima solo en la **representación gráfica** —y aun así con la regla de densidad del kit—; nunca en el **contenido documental** que acompaña al gráfico. Si un DER tiene 79 entidades posibles, el entregable tiene 79 filas en su índice, aunque dibuje 47 y justifique 32.

### P2 · Cada elemento con su fuente exacta

Cada entidad, atributo, relación, cardinalidad, estado, transición, operación, componente y dependencia lleva **una referencia verificable** al legajo: `T-06-xx`, `REG-06-xxx`, `INV-06-xxx`, `UC-Pxx §10.6.8`, `07 §32`. No «según el 06» sino «`REG-06-153`». La referencia va en el CSV de trazabilidad del entregable, y un revisor puede abrir la fuente y encontrar la línea.

### P3 · El diagrama nunca viaja solo

Todo diagrama se entrega con **tres piezas documentales**: la ficha textual de cada elemento (tabla o sección), el diccionario de la vista (qué muestra, qué no, por qué), y las decisiones de representación (qué se condensó, qué se omitió, qué se agrupó). Un diagrama sin documentación es la mitad de un entregable escolar; `Entregables.pdf` pide «diagrama **y** documentación».

### P4 · Vista de conjunto obligatoria

Cuando un entregable se particiona en vistas, existe una **figura índice** que muestra las partes y sus conexiones. En el DER, las relaciones inter-área —`Vínculo → Identidad`, `Proceso → Vínculo`, `Revisión → Proceso`— deben aparecer en esa figura, porque un lector no puede reconstruir el modelo desde las partes si nadie le muestra cómo se unen.

### P5 · Consistencia cruzada verificada

Los entregables que nombran los mismos conceptos —`DV-04` casos, `DV-06` entidades, `DV-07` clases, `DV-09` componentes— comparten vocabulario **verificado con tabla de correspondencia**, no supuesto. Si un caso de uso dice «plan nutricional», el DER dice «Plan nutricional», la clase dice `PlanNutricional`, y el componente dice `Nutrición`. La tabla `UC ↔ entidad ↔ clase ↔ familia API ↔ RF` se produce una vez y todos la citan.

### P6 · Composición intencional, no generada

El generador produce coordenadas; el criterio de diseño las decide. Cada vista tiene: una **entidad raíz enfatizada** (tamaño, peso de borde, posición), **jerarquía visual** que refleje la jerarquía semántica, **cero espacio muerto** (el lienzo se ajusta al contenido), y **tamaño de caja proporcional a su contenido**, no uniforme. Si todas las cajas miden lo mismo, el lector no sabe qué importa.

### P7 · Dos verificaciones, ambas obligatorias

**Falsable:** recuentos contra la fuente, barridos léxicos, hashes. **De tribunal:** para cada figura, tres preguntas respondidas por escrito: *¿qué pregunta del tribunal responde esta figura?* · *¿qué pregunta obvia deja sin responder, y dónde está la respuesta?* · *¿un analista que no conoce BE puede explicar el modelo desde esta figura en dos minutos?* Un «no» en la tercera invalida la figura.

---

## 2. Estándar por entregable

Para cada `DV` se fija: qué espera un tribunal, contenido obligatorio en tres niveles (**mínimo aceptable · nivel tesis · nivel distinción**), fuente y método de derivación, errores que ya cometí o que son típicos, y criterios de aceptación medibles.

---

### DV-01 · Presentación

**Lo que espera el tribunal:** la primera página le dice de qué se trata, quién lo hizo y cómo está organizado el documento. Nada más, nada menos.

**Mínimo aceptable:** portada con los seis campos de `Entregables.pdf`; índice de 14 puntos en orden literal.

**Nivel tesis:** portada + **resumen ejecutivo de una página** (problema, solución, alcance, método, estado) + índice con número de página y estado por punto + **página de convenciones** (cómo leer los diagramas: colores, notación, rótulos de reconciliación) + **glosario de siglas** de dos columnas (`RF`, `UC`, `T-06`, `PDP`, `A3`, `B2`, `TVCC-30`, `SIN_DATO`…). La página de convenciones es lo que evita explicar la leyenda diez veces.

**Nivel distinción:** lo anterior + **un párrafo de posicionamiento metodológico** —por qué este proyecto especificó por completo antes de construir, y qué obtuvo a cambio— porque es la pregunta que el tribunal va a hacer y conviene responderla antes.

**Fuente:** `BE-LEG-01 v1.0-I` para el resumen; `Entregables.pdf` para la estructura; `MESA-01` para el estado por punto.

**Errores típicos:** llenar la portada con una imagen decorativa; escribir «el sistema permite» en el resumen; olvidar el estado por punto.

**Aceptación:** 14 ítems en orden exacto · cero verbo runtime · `TO VERIFY` en integrante, correo, mes · glosario con ≥ 25 siglas · convenciones en una página.

---

### DV-02 · Acta del proyecto

**Lo que espera el tribunal:** entender el negocio antes de la técnica. Público, problema, alcance, límites, mercado, competencia, tecnología, equipo. Es el documento que más lee un tribunal no técnico.

**Mínimo aceptable:** los nueve subcriterios en 5–8 páginas, derivados de 01/02/03.

**Nivel tesis:** cada afirmación de alcance **trazada a RF o sección** (nota al pie o columna). Límites enunciados como **lo que BE no hace y por qué** —no diagnostica (`DEC-014`), no es marketplace (`02 §12`), no produce score, no comparte sin consentimiento por finalidad— con la decisión canónica que lo fundamenta. **Mercado y competencia rehechos con fecha 2026**, con al menos cinco productos verificados, matriz comparativa en cinco ejes (control del titular por finalidad, multiprofesional sin mezcla, no diagnóstico, trazabilidad versionada, canales) y fuentes con URL y fecha de consulta. Tecnologías con rótulo `OBJETIVO SEGÚN 07 — A RECONCILIAR`. Roles del equipo: **proyecto individual, con el esquema de doble agente y contrarrevisión cruzada declarado como método de control** —es defendible y es lo que pasó.

**Nivel distinción:** una sección de **riesgos del proyecto y cómo se mitigaron** —el 07 tiene la matriz `RSK-*`— y una de **decisiones que un tribunal cuestionaría**, respondidas: por qué Render-first, por qué monolito, por qué sin stores, por qué especificación completa antes de código.

**Fuente:** 02 §6/§11/§12; 03 §4; 01 v1.0-I; 07 `RSK-*` y `Q-008`; búsqueda web fechada para mercado.

**Errores típicos:** reutilizar el análisis de mercado histórico del 03 (arrastra alcance viejo); cifras sin fuente; escribir «tecnologías utilizadas» sin rótulo; inventar nombres de integrantes.

**Aceptación:** 5–8 páginas A4 a 11 pt · cero afirmación de alcance sin trazado · ≥ 5 competidores con fuente fechada 2026 · cero dato de mercado sin fuente · rótulo en tecnologías · `TO VERIFY` en datos personales · cero runtime.

---

### DV-03 · Requisitos funcionales por canal

**Lo que espera el tribunal:** los requisitos completos, legibles, con prioridad, y separados por dónde se ejercen. Es el punto donde verifica que el alcance declarado en el acta se corresponde con obligaciones concretas.

**Estado actual:** `DV-03` fue producido por ChatGPT y **está conforme** (contrarrevisión 2026-09-10: 69 RF byte-idénticos, criterio de canal escrito, 35/9/25). No requiere rehacerse. Este apartado fija el estándar por completitud y para su integración.

**Nivel tesis (ya cumplido):** 69 RF con ID, título, canal, prioridad, obligación literal, UC y familia API; 38 RNF por categoría; criterio de canal escrito y declarado derivado; conteos por canal y prioridad; RF retirados declarados.

**Nivel distinción (a agregar en integración):** **matriz RF × canal × prioridad como figura** —una grilla visual de 69 celdas coloreada por prioridad— que permite ver de un vistazo que el núcleo P0 está en ambos canales; y **una página de lectura guiada**: los diez RF que definen el producto, explicados en una línea cada uno, para el tribunal no técnico.

**Aceptación:** la ya verificada, más la figura y la lectura guiada.

---

### DV-04 · Casos de uso — diagrama y documentación

**Lo que espera el tribunal:** entender quién hace qué en el sistema, con qué precondiciones y qué resultado, y poder seguir un caso de punta a punta. Diagrama **y** documentación, según `Entregables.pdf`.

**Estado actual:** `DV-04 v0.3` tiene diagramas de nivel tesis en lo gráfico y **cero documentación**. Incompleto.

**Mínimo aceptable:** las ocho vistas + índice + tabla de 56 fichas resumidas (ID, actor, objetivo, RF).

**Nivel tesis:** lo anterior + **ficha completa por caso principal** en formato académico estándar —código, nombre, actor principal, actores secundarios, disparador, precondiciones, flujo principal numerado, variantes, excepciones, postcondiciones, RF relacionados— **derivada del 05 sin reescribir**, que ya tiene exactamente esos dieciséis campos en `§10.6.1…16`. Son 33 fichas principales de una página cada una. Los 13 incluidos, 9 de extensión y 1 de soporte con ficha compacta de media página. **Diagrama índice con conexiones entre vistas**: qué casos de una vista invocan casos de otra. **Tabla de relaciones completa** (`DV-04_RELACIONES_UML.csv`, ya existe) referenciada desde cada ficha.

**Nivel distinción:** **tres recorridos narrados de punta a punta** —onboarding con A3, circuito nutricional completo, corrección antropométrica con anulación— cada uno con secuencia de casos, actores, y qué garantía del legajo se cumple en cada paso. Es lo que un tribunal pide cuando dice «mostrame cómo funciona»; con esto la respuesta está escrita.

**Fuente:** `BE-LEG-05 v0.15` fichas `§10.x`, `DV-03` para el canal, `DV-04_RELACIONES_UML.csv`.

**Errores típicos (cometidos):** entregar solo diagramas; abreviar nombres canónicos en la ficha además de en la elipse; omitir precondiciones «porque son obvias».

**Aceptación:** 56 fichas · 33 completas con los 16 campos · nombres byte-idénticos al 05 en la ficha · diagrama índice con ≥ 8 conexiones inter-vista · 3 recorridos narrados · cero runtime.

---

### DV-05 · Casos de prueba

**Lo que espera el tribunal:** que exista un plan de verificación serio, con casos concretos, y que no se le mienta sobre qué se ejecutó.

**Mínimo aceptable:** 40–60 casos de 11A en formato clásico con estado `NOT_EXECUTED`.

**Nivel tesis:** **criterio de selección escrito y aplicado**: todos los P0 de seguridad y privacidad, el recorrido crítico de cada dominio, los invariantes visibles, al menos un caso por canal. Formato con precondiciones, pasos numerados, datos de prueba **sintéticos descriptos**, resultado esperado con **su fuente propietaria citada** (`RF-021` o `REG-06-153` o `08 §27`), prioridad, estado. **Matriz de cobertura** RF → casos seleccionados, que muestre qué RF quedaron con test en esta selección y cuáles solo en 11A. **Estrategia de niveles** en una página: unit, integración con PostgreSQL real, e2e, manual guiado, con qué se automatiza primero y por qué.

**Nivel distinción:** **diez casos adversariales redactados para que el tribunal los ejecute en vivo** cuando haya demo: enumerar ID ajeno → 404; leer tras revocar; registrarse y ver que A3 no se presume; alterar `professionalId` en cliente; ocultar botón y llamar la API. Cada uno con el resultado que el legajo garantiza. Es la forma más contundente de mostrar que la seguridad no es papel.

**Fuente:** `BE-LEG-11A v1.0-H`, `DV-03` para canal.

**Errores típicos:** escribir PASS; inventar tests que no están en 11A; datos de prueba con nombres realistas; oráculo sin fuente.

**Aceptación:** cada ID existe en 11A · 0 PASS/FAIL · cada oráculo con fuente · matriz RF → casos · 10 adversariales · cero dato personal.

---

### DV-06 · Diagrama entidad–relación

**Lo que espera el tribunal:** el modelo de datos completo, con entidades, atributos, claves, relaciones y cardinalidades justificadas. Es el diagrama más escrutado en una tesis de sistemas: el tribunal lo usa para verificar que el analista entiende la estructura de la información.

**Estado actual:** `DV-06` **no cumple el nivel tesis**. Atributos resumidos en prosa, cardinalidades sin fuente, 32 entidades omitidas sin declarar, sin índice inter-área. Debe rehacerse.

**Mínimo aceptable:** entidades con atributos nombrados, clave conceptual marcada, relaciones con cardinalidad.

**Nivel tesis:**

*Atributos reales.* Cada entidad lista los atributos conceptuales que el 06 declara para ella, con nombre en `camelCase` o `snake_case` consistente, y **tipo conceptual** entre paréntesis —identificador, texto, fecha-hora, token de enumeración, referencia a entidad, cantidad con unidad—. No tipos físicos. La entidad `Consentimiento` no dice «versión · alcance»; dice `consentimientoId (identificador) · vinculoId (ref Vínculo) · alcance (ref Alcance) · finalidad (token) · versionNumero (entero) · otorgadoEn (fecha-hora ocurrencia) · registradoEn (fecha-hora registro) · estado (token: VIGENTE|REVOCADO) · revocadoEn (fecha-hora, opcional) · autoría (ref Identidad)`.

*Claves.* Clave conceptual subrayada o marcada `PK`; referencias a otras entidades marcadas `FK` con la entidad destino. Conceptual, no físico: sin nombre de columna real, sin tipo SQL. Pero marcadas, porque un DER sin claves no es un DER.

*Cardinalidades con fuente.* Cada relación en `DV-06_RELACIONES.csv` con columnas `origen · destino · cardinalidad origen · cardinalidad destino · tipo (composición/asociación/dependencia) · REG-06 o INV-06 que la sostiene · texto literal de la regla`. Si una cardinalidad no tiene regla que la sostenga, **no se dibuja**: se marca `NO EVIDENCIADA` en el CSV y se eleva.

*Cobertura declarada.* Tabla de los 79 `T-06` con columna `representado en vista X` / `omitido — motivo`. Motivos legítimos: es constructo de metamodelo (`T-06-N*`), es proyección sin persistencia propia (`T-06-42`), es atributo de otra entidad, es taxonomía y no entidad. Motivo ilegítimo: «no cabía».

*Índice inter-área.* Figura `DV-06.0` con las trece áreas como cajas y **las relaciones que cruzan áreas** dibujadas: `Vínculo (M-03) → Identidad (M-01)`, `Proceso (M-04) → Vínculo (M-03)`, `Plan (M-07/08) → Proceso (M-04)`, `Revisión (M-10) → Proceso`, `Evaluación (M-09) → Identidad`, `Cálculo (M-09) → Método (M-11)`. Es la figura que un tribunal pide primero.

*Entidades versionadas.* El patrón `M-06` se dibuja **una vez** en su vista con todos sus atributos, y en las demás vistas la entidad versionada lleva estereotipo `«versionada»` y una nota «atributos de versión: ver DV-06.4». No se redibuja ni se omite.

*Rótulo de reconciliación* en todas las figuras y **una sección de la nota** que explique la brecha `B-11`: 45 modelos Prisma AS-IS con vocabulario anterior, decisión `H-07-DOM-01` pendiente, qué pasa con este DER cuando se resuelva.

**Nivel distinción:** **tabla de convergencia preliminar** `entidad 06 → modelo Prisma AS-IS más cercano → grado de coincidencia (exacta / parcial / ausente)`, aunque sea `NOT VERIFIED` hasta el intake. Muestra que el analista ya identificó dónde va a doler la reconciliación. Y **un ejemplo de instancia**: para tres entidades clave, una fila de datos sintéticos que muestre cómo se ve un registro real —un vínculo concreto, un consentimiento concreto, una medición concreta—. Los tribunales entienden instancias mejor que esquemas.

**Fuente:** `BE-LEG-06 v0.1.1` — §4.1 cuadro de términos, cada bloque `M-xx` con sus `REG` y estructuras; `07 B-11` para la brecha.

**Errores cometidos:** prosa en lugar de atributos; cardinalidad sin `REG`; 32 omisiones sin tabla; sin índice inter-área; cajas uniformes sin énfasis en la raíz; espacio muerto.

**Aceptación:** 79 `T-06` en tabla de cobertura · cada entidad dibujada con ≥ 4 atributos tipados y clave marcada · cada relación con `REG`/`INV` en CSV · cero cardinalidad `NO EVIDENCIADA` sin elevar · figura índice con ≥ 6 relaciones inter-área · rótulo 100 % · cero léxico físico · densidad ≤ 25 · sin espacio muerto (relación contenido/lienzo ≥ 60 %).

---

### DV-07 · Diagrama de clases

**Lo que espera el tribunal:** la estructura orientada a objetos del dominio, con comportamiento. Es donde verifica que el analista distingue estructura de conducta y que las máquinas de estado están bien pensadas.

**Estado actual:** `DV-07` **no cumple el nivel tesis**. Dos o tres atributos por clase, operaciones sin guardas, máquinas reducidas a enumeraciones, sin diagramas de estado. Debe rehacerse.

**Nivel tesis:**

*Clases completas.* Mismos atributos que el DER (una sola fuente de verdad: `DV-06_ENTIDADES.csv` alimenta a ambos), con visibilidad UML (`-` privado por defecto en dominio), tipo conceptual, y multiplicidad de atributo cuando aplique.

*Operaciones = transiciones, con guardas.* Cada operación es una transición de la lista blanca del 06, en infinitivo, y lleva **su guarda entre corchetes**: `cerrarCuenta() [sesión válida ∧ confirmación explícita]`, `anular() [medición VIGENTE ∧ actor autorizado ∧ motivo]`. La guarda es la condición de la tabla de lista blanca del 06. Sin guarda, la operación miente por omisión.

*Diagramas de estado explícitos.* **Una figura de máquina de estados por cada máquina principal del 06** — como mínimo: estado de cuenta, verificación por alcance, solicitud de vínculo, vínculo por alcance, consentimiento, proceso operativo, versión de plan, evaluación antropométrica, medición (vigente/anulada). Cada una con estado inicial, estados, transiciones nombradas, guardas, eventos emitidos y estado terminal, **exactamente como la tabla de lista blanca del 06** (el 06 ya tiene ese formato: transición · origen→destino · actor · condiciones · efectos · evento). Es el contenido de mayor valor del entregable y hoy no existe.

*Invariantes como restricciones OCL-like.* No una cinta con tres palabras: `{inv: estado = CERRADA implies ∄ transición de salida}`, con el `INV-06-xxx` de origen. Máximo tres por clase, los de mayor valor explicativo.

*Metamodelo con relaciones.* `DV-07.0` no es una grilla de diecinueve cajas: es un diagrama que muestra **cómo se relacionan los constructos** — una Máquina de estados *tiene* Estados técnicos y Transiciones; una Transición *emite* un Evento de dominio; una Entidad *tiene* Atributos e Identificador y *está sujeta a* Invariantes; una Regla de cálculo *produce* un resultado que una Proyección *consume*; una Proyección *deriva de* una Fuente de verdad y *nunca la reemplaza*. Con esas relaciones, la vista explica el 06; sin ellas, es un glosario dibujado.

*Composición vs asociación con criterio escrito.* Rombo lleno solo donde el 06 declara que la parte no existe sin el todo (versión dentro de plan, ítem dentro de opción); asociación en los demás. El criterio va en la nota.

**Nivel distinción:** **diagrama de secuencia para dos escenarios críticos** —`UC-P08` revocar consentimiento (con el corte prospectivo vía PDP y sin borrado) y `UC-E03` anular medición (con reevaluación de dependencias y `SIN_DATO`)—. No están pedidos por la escuela, pero son los que demuestran que el comportamiento está realmente diseñado y no solo enumerado.

**Fuente:** `BE-LEG-06 v0.1.1` — cada `§x.y Máquina de …` con su lista blanca; `INV-06-*` con «se viola cuando»; `T-06-N01…N19` con sus definiciones para el metamodelo.

**Errores cometidos:** operaciones sin guardas; máquinas como enumeraciones; metamodelo como grilla sin relaciones; invariantes de tres palabras.

**Aceptación:** ≥ 9 diagramas de estado con estado inicial, transiciones nombradas, guardas y eventos · cada operación con guarda y transición de origen citada · metamodelo con ≥ 12 relaciones entre constructos · invariantes en forma de restricción con `INV` citado · atributos idénticos a `DV-06` · 2 diagramas de secuencia · cero léxico técnico.

---

### DV-08 · Diagrama de arquitectura

**Lo que espera el tribunal:** entender cómo está construido el sistema y **por qué así**. Las decisiones arquitectónicas son lo que más pregunta un tribunal técnico.

**Nivel tesis:**

*C4 nivel 1 y 2 estrictos*, con la notación oficial: persona, sistema, contenedor, relación con protocolo. Contexto con los actores y los sistemas externos del 07 —OFF, wger, Render/AWS, identidad federada—; contenedores con Website Next.js, API NestJS monolito modular, PostgreSQL vía Prisma, APK Expo, y los adaptadores **dentro** del monolito.

*El PDP como elemento arquitectónico visible.* `ASR-06` del 07: punto único de decisión de autorización dentro de la API, consultado por cada operación sensible, idéntico para web y APK. Si el diagrama no lo muestra, el 08 entero queda sin sustento arquitectónico.

*Tabla de decisiones arquitectónicas en formato ADR* —una por decisión, con contexto, decisión, alternativas consideradas, consecuencias—: monolito modular vs microservicios; Render-first/AWS-ready (`Q-008`); PDP único; APK sin stores; Prisma como capa de persistencia; REST versionado `/api/v1`. El 07 ya tiene el fundamento; el ADR lo hace defendible en dos minutos.

*Tabla `contenedor → tecnología → responsabilidad → RNF que lo justifica`*, con el `RNF-xxx` del 04.

*Rótulo* `ARQUITECTURA OBJETIVO — DESPLIEGUE NO VERIFICADO` y sección de **estado AS-IS vs TO-BE**: qué existe hoy (backend, web, 45 modelos, sin Dockerfile, sin APK) según la auditoría del 07, y qué falta (`B-1…B-11`).

**Nivel distinción:** **diagrama de despliegue** (UML deployment o C4 deployment) con los ambientes del 07 —dev, test/demo, producción/RfRD— y qué gates separan cada uno (`§26-bis`, `VJR-*`). Muestra que el analista entiende que demo con sintéticos y producción con datos reales son cosas distintas.

**Fuente:** `BE-LEG-07 v0.1.11` — `§32` topología, `§AS-IS`, `B-1…B-11`, `ASR-*`, `Q-008`, `RSK-*`; `04` para RNF.

**Errores típicos:** dibujar microservicios que el 07 no tiene; omitir el PDP; afirmar despliegue; tecnología fuera del 07.

**Aceptación:** C4 L1 y L2 con notación estricta · PDP visible · ≥ 6 ADR · tabla contenedor→RNF · rótulo · sección AS-IS/TO-BE con `B-1…B-11` · diagrama de despliegue con 3 ambientes y sus gates · cero tecnología fuera del 07.

---

### DV-09 · Diagrama de componentes

**Lo que espera el tribunal:** la descomposición interna y las dependencias. Es donde verifica que la modularidad declarada es real.

**Nivel tesis:**

*C4 nivel 3 del backend*, componentes exactamente como el 07 los descompone, cada uno con **las familias API del 09 que expone** (las 15, cada una asignada a un solo componente, ninguna huérfana), **el área `M-xx` del 06 que gobierna**, y **los RF principales que materializa**. Dependencias solo las que el 07 declara, con dirección y motivo.

*Interfaces explícitas.* Cada componente con sus puertos: qué expone (familias API), qué consume (otros componentes, PDP, persistencia, adaptadores externos). Un componente sin interfaces declaradas no es un componente.

*Matriz de dependencias* como tabla cuadrada componente × componente, marcando permitidas y prohibidas. Es lo que demuestra modularidad: si `Nutrición` depende de `Entrenamiento`, algo está mal, y la matriz lo hace visible.

*Componentes de los clientes* si el 07 los descompone; si no, declaración explícita y referencia a los shells de `BE-LEG-10`.

*Rótulo* `COMPONENTES OBJETIVO — CÓDIGO NO VERIFICADO` y tabla `componente → módulo AS-IS más cercano` con grado de coincidencia `NOT VERIFIED`.

**Nivel distinción:** **diagrama de secuencia arquitectónico** para una operación sensible —por ejemplo `POST /nutrition/executions`—: cliente → API gateway → PDP → componente de dominio → persistencia → auditoría, mostrando dónde se evalúa autorización, dónde se registra procedencia y dónde se emite evento. Conecta 07, 08 y 09 en una sola figura.

**Fuente:** `BE-LEG-07` C4 Component del backend; `BE-LEG-09 v0.16.1` inventario de 122 en 15 familias; `06` áreas.

**Aceptación:** 15/15 familias asignadas sin duplicado · cada componente con puertos · matriz de dependencias · ≥ 1 secuencia arquitectónica · rótulo · cero componente fuera del 07.

---

### DV-10 · Gantt

**Lo que espera el tribunal:** que el proyecto tuvo planificación y que el analista sabe explicar cómo usó el tiempo. Y va a preguntar por los dos meses de documentación.

**Nivel tesis:**

*Dos tramos diferenciados visualmente:* historia verificable, con cada barra citando el acta que la sostiene, y plan declarado con rótulo `PLAN — SUJETO A GATE`. Hitos G0–G3 y M0–M9. Tabla anexa `fase → fechas → acta o estimación → estado`.

*Nota metodológica de una página*, escrita para el tribunal: por qué especificación completa antes de construcción; qué se obtuvo (trazabilidad de 69 RF → 56 UC → 209 unidades de dominio → 122 contratos, con dos errores detectados que ningún control automático habría encontrado); qué costó (tiempo); y por qué el autor considera que fue la decisión correcta para un proyecto individual con agentes. Esa nota es la defensa del Gantt.

*Dependencias visibles* entre fases: qué no podía empezar hasta que qué terminara. Un Gantt sin dependencias es una lista de fechas.

**Nivel distinción:** **comparación con la planificación original** del `02 §19.3` (hitos M0–M4 previstos): qué se cumplió, qué se desvió y por qué. Mostrar la desviación con honestidad vale más que ocultarla.

**Fuente:** actas `ACTA-DIR-006…034` para fechas; `02 §19.3` para lo planificado; plan refinado para lo futuro.

**Aceptación:** cero fecha histórica sin acta · tramo plan rotulado · dependencias dibujadas · nota metodológica · comparación con 02 §19.3 · `TO VERIFY` en fechas de mesa.

---

## 3. Estándar de composición visual — para todos los diagramas

Estas reglas se suman al kit y al addendum, y corrigen los defectos de composición de lo entregado.

**Énfasis.** La entidad o elemento raíz de cada vista se distingue por **tres canales a la vez**: mayor tamaño (≥ 1,3×), borde más grueso (2,2 px vs 1,5), y posición dominante (izquierda o centro-arriba según el flujo). Los elementos secundarios, un solo canal. Los referenciados de otra área, atenuados (opacidad 0,75).

**Tamaño proporcional.** La altura de una caja crece con su contenido real. Una entidad con diez atributos es más alta que una con tres. Cajas uniformes son señal de contenido inventado o recortado.

**Lienzo ajustado.** El lienzo termina 40 px después del último elemento. El espacio muerto se mide: si la relación entre el área ocupada por elementos y el área total del lienzo es menor a 60 %, la vista se recompone.

**Agrupación con contenedores solo cuando agregan semántica.** Un rectángulo «Sistema BE» que rodea todo no dice nada. Un contenedor `M-06 Versionado` que agrupa Versión, Instantánea y Corrección sí. Contenedores con título y borde suave, no marco pesado.

**Anotaciones donde el tribunal va a preguntar.** Cada vista lleva **una o dos anotaciones** —no más— sobre el punto que más se cuestiona: en vínculo, «revocar ≠ finalizar»; en antropometría, «anulada ≠ borrada»; en versionado, «emitida = inmutable». Son la respuesta anticipada.

**Tipografía en tres niveles exactos.** Título de elemento 12 pt semibold; contenido 10,5 pt regular; metadatos (IDs, cardinalidades, estereotipos) 9,5 pt medium en gris. Nunca cuatro tamaños.

**Leyenda con muestras reales**, no descripción textual del trazo. Ya resuelto en el motor; se mantiene.

**Figura índice como primera figura de cada entregable**, siempre, con conexiones entre vistas.

---

## 4. Verificación cruzada entre entregables

Se produce **una tabla maestra** `MESA_02_CORRESPONDENCIA.csv`, antes de rehacer cualquier entregable, con estas columnas:

```text
concepto canónico · T-06 · UC(s) que lo usan (05) · RF (04) · familia API (09) ·
nombre en DV-04 · nombre en DV-06 · nombre en DV-07 · componente en DV-09 · estado
```

Cada entregable la cita y se verifica contra ella: **cero nombre distinto para el mismo concepto**. Cuando la representación exige abreviar (rótulo corto en figura), la tabla registra ambos: canónico y corto.

Verificaciones adicionales obligatorias antes de cerrar cada entregable:

- `DV-04` × `DV-06`: cada UC que crea o modifica una entidad → esa entidad existe en el DER.
- `DV-06` × `DV-07`: mismos atributos, mismas relaciones; el DER no tiene una cardinalidad que la clase contradiga.
- `DV-07` × `06`: cada operación con su transición en la lista blanca; cada estado en su enumeración.
- `DV-09` × `09`: 15 familias, 122 operaciones, asignación única.
- `DV-08` × `DV-09`: cada componente del nivel 3 vive en un contenedor del nivel 2.

---

## 5. Qué se conserva y qué se rehace

| Pieza | Decisión | Motivo |
|---|---|---|
| Kit `MESA-02-00` + addendum `LEG-01…06` | **Se conserva** | correcto; le faltaba este estándar de contenido, no reglas de forma |
| Motor SVG determinista | **Se conserva y se extiende** | herramienta correcta; se agrega énfasis, tamaño proporcional, lienzo ajustado, diagramas de estado y secuencia |
| `DV-03` (ChatGPT) | **Se conserva** + figura y lectura guiada | conforme en contrarrevisión |
| `DV-04 v0.3` diagramas | **Se conservan** | nivel tesis en lo gráfico |
| `DV-04` documentación | **Se produce** | ausente: 56 fichas, índice inter-vista, 3 recorridos |
| `DV-06` | **Se rehace** | atributos, claves, cardinalidades con fuente, cobertura 79, índice inter-área |
| `DV-07` | **Se rehace** | guardas, 9+ diagramas de estado, metamodelo con relaciones, 2 secuencias |
| `DV-08`, `DV-09`, `DV-10`, `DV-05`, `DV-02`, `DV-01` | **Se producen bajo este estándar** | no iniciados |

**Orden:** tabla de correspondencia → `DV-06` → `DV-07` → documentación `DV-04` → `DV-08` → `DV-09` → `DV-05` → `DV-02` → `DV-10` → `DV-01`.

**Esfuerzo real estimado por entregable a nivel tesis** (no cinco minutos): `DV-06` y `DV-07`, medio día cada uno; documentación `DV-04`, medio día; `DV-08`/`DV-09`, un cuarto de día cada uno; `DV-02` con investigación de mercado, medio día; el resto, un cuarto de día. Es el esfuerzo que corresponde y no vale la pena disfrazarlo.

---

## 6. Checklist de «listo para mesa» — por entregable

Ningún entregable se declara listo sin las nueve casillas:

```text
[ ] Contenido completo o tabla de omisiones con motivo
[ ] Cada elemento con fuente exacta en CSV de trazabilidad
[ ] Documentación textual que acompaña al diagrama
[ ] Figura índice con conexiones entre vistas
[ ] Verificado contra MESA_02_CORRESPONDENCIA.csv
[ ] Composición: énfasis en raíz, tamaño proporcional, lienzo ajustado, ≥ 60 % ocupación
[ ] Anotaciones en los puntos que el tribunal cuestionaría
[ ] Verificación falsable ejecutada y publicada con resultados reales
[ ] Prueba de tribunal: las tres preguntas respondidas por escrito, con «sí» en la tercera
```

---

## 7. Cierre

El nivel de una tesis no lo da la cantidad de diagramas sino la **densidad de decisiones justificadas por figura**. Un DER de siete entidades con cuarenta atributos tipados, doce relaciones con su regla de origen y una anotación que anticipa la pregunta del tribunal vale más que nueve vistas limpias con tres atributos cada una.

Lo que produje hasta ahora es el andamio correcto —motor, kit, verificación— con el contenido equivocado. Este documento fija el contenido. Cuando Dirección lo apruebe, se rehace `DV-06` y `DV-07` bajo este estándar antes de producir nada nuevo.
