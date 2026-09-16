# DV-02 — Acta del proyecto

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud
> **Autor:** Elián Bufi · Carrera de Analista de Sistemas, Escuela Da Vinci
> **Correo institucional:** `[TO VERIFY — @davinci.edu.ar]` · **Fecha de entrega:** `[TO VERIFY]`
> **Fuentes:** `BE-LEG-01 v1.0-I` · `BE-LEG-02 v0.2.1` · `BE-LEG-03 v0.2.1` · `BE-LEG-04 v0.4.2.1` · `BE-LEG-07 v0.1.11`
> **Investigación de mercado:** realizada en septiembre de 2026; fuentes citadas con fecha de consulta

---

## 1. Público objetivo

BE se dirige a **dos poblaciones vinculadas y a un tercero que administra**, no a un usuario único.

**Profesionales de la salud y el movimiento que trabajan con seguimiento longitudinal**: nutricionistas y entrenadores en consultorio propio o en equipo, más profesionales con capacidad antropométrica que puede acompañar a cualquiera de las dos especialidades o existir sola. La hipótesis de problema de BE es la fragmentación del seguimiento y de la trazabilidad de decisiones. Debe contrastarse con usuarios; no se presenta como resultado de entrevistas realizadas.

**Personas bajo seguimiento profesional** —el asesorado en el vocabulario del proyecto— para quienes BE propone reunir consulta del proceso, registro y control de acceso. El uso de documentos y aplicaciones separadas es un escenario de diseño, no una caracterización estadística de toda esa población.

**Administración de la plataforma**: el rol que resuelve verificaciones profesionales e incidencias, sin convertirse nunca en actor clínico.

## 2. Uso previsto

Un profesional verificado establece un vínculo con un asesorado para un alcance concreto —nutrición, entrenamiento o antropometría—. El asesorado otorga consentimiento por finalidad. A partir de ahí el profesional evalúa, fija un objetivo fundado, diseña un plan versionado, lo activa, y revisa periódicamente lo que efectivamente ocurrió contra lo que había indicado. El asesorado consulta su plan desde el móvil, registra su ejecución y ve su propio progreso.

Cuando el asesorado trabaja con más de un profesional, cada uno opera en su alcance sin ver los dominios que no le fueron autorizados, y existe un tablero de coordinación que muestra el estado conjunto sin mezclar las materias.

## 3. Objetivo

Construir una plataforma donde el trabajo profesional longitudinal sea **trazable, versionado y gobernado por el consentimiento del titular**, manteniendo separadas la planificación y la ejecución real, y sin que el sistema sustituya el criterio profesional en ningún punto.

El objetivo académico asociado es demostrar un ciclo completo de análisis de sistemas: desde requisitos hasta contratos de interfaz y plan de verificación, con trazabilidad verificable en cada eslabón.

## 4. Alcance

El MVP especificado cubre siete capacidades, cada una trazada a requisitos concretos del Documento 04:

| Capacidad | Requisitos | Superficie |
|---|---|---|
| Identidad, cuenta y consentimiento de datos de salud | `RF-001` a `RF-007`, `RF-069` | ambas |
| Perfil profesional, verificación por alcance y habilitación | `RF-008` a `RF-014`, `RF-066` | Website |
| Vínculo, consentimiento por finalidad y autorización contextual | `RF-015` a `RF-025` | ambas |
| Circuito nutricional: evaluación, objetivo, plan, ejecución, revisión | `RF-026` a `RF-035` | Website + APK |
| Circuito de entrenamiento: periodización, prescripción, ejecución real | `RF-036` a `RF-046`, `RF-064` | Website + APK |
| Antropometría transversal con corrección y anulación trazables | `RF-047` a `RF-051` | ambas |
| Cartera, tablero, línea temporal y progreso propio | `RF-052` a `RF-058`, `RF-065` | ambas |

Más dos capacidades transversales incorporadas durante el desarrollo: **métodos profesionales de cálculo reproducible** (`RF-070`) y **solicitudes estructuradas de información al asesorado** (`RF-071`).

**Total del alcance especificado:** 69 requisitos funcionales activos —59 de prioridad P0— y 38 no funcionales.

## 5. Límites — lo que BE deliberadamente no es

Cada límite es una decisión registrada, no una omisión.

**No diagnostica ni califica.** El sistema no produce puntaje de adherencia, score de salud ni evaluación agregada del asesorado. Muestra hechos —esto se indicó, esto se registró, esta es la diferencia— y la interpretación es del profesional (`DEC-014`).

**No calcula el requerimiento por fórmula propia.** Ofrece métodos versionados que el profesional elige ejecutar; el resultado es apoyo y no modifica automáticamente objetivo, prescripción ni plan (`INV-06-133`).

**No es un marketplace.** El descubrimiento de servicios antropométricos es limitado y su única consecuencia posible es una solicitud de vínculo (`BE-LEG-02 §12`).

**No comparte datos sin consentimiento por finalidad.** Ningún profesional accede a un dominio que no le fue autorizado, y la revocación corta hacia adelante de inmediato (`BE-LEG-08 §13`, `§56`).

**No reemplaza la historia clínica institucional** ni se presenta como certificación oficial de una credencial profesional.

## 6. Tecnologías

> **ESTADO: OBJETIVO SEGÚN BE-LEG-07 — A RECONCILIAR CON REPOSITORIO EN INTAKE**

| Capa | Tecnología objetivo | Fundamento |
|---|---|---|
| API | NestJS · monolito modular · REST `/api/v1` | atomicidad de operaciones de dominio (`ASR-01`) |
| Persistencia | PostgreSQL vía Prisma | unicidades condicionales e índices parciales (`ASR-02`) |
| Website | Next.js | superficie profesional y administrativa |
| APK | Expo / React Native | build reproducible, distribución directa (`RNF-PORT-001`) |
| Despliegue | Render Frankfurt, con arquitectura AWS-ready | `Q-008` resuelta; portabilidad sin rediseño |
| Integraciones | Open Food Facts, wger, identidad federada, push | con fallback observable (`RF-059`) |

El rótulo no es una formalidad: el repositorio actual tiene un esquema anterior al modelo de dominio canónico, y esa brecha se reconcilia en el intake técnico (`B-11`, decisión `H-07-DOM-01`).

## 7. Análisis de mercado

### 7.1. Oferta observada

La oferta consultada cubre nutrición profesional, seguimiento de actividad física y gestión de prácticas de salud/bienestar. Nutrium documenta planes, diarios y mediciones en su aplicación para clientes. Hexfit presenta creación de programas, seguimiento, nutrición y aplicación móvil. NutriAdmin documenta planes, cuestionarios y diarios mediante un portal web. Estas fuentes permiten afirmar que existe oferta de software con funciones que se superponen con BE; no permiten medir su tamaño de mercado, adopción en Argentina ni participación relativa. [S1, S2, S3]

La colaboración entre varios profesionales tampoco es una función exclusiva de BE: Healthie documenta equipos de atención, varios prestadores asociados a un cliente y permisos configurables. Esto impide sostener, como ocurría en una versión anterior, que los productos existentes necesariamente mezclan todos los datos o carecen de restricciones entre profesionales. [S4]

Practice Better presenta gestión de la práctica, registros, protocolos e integración de planificación nutricional. Su presencia amplía la comparación hacia suites de gestión, no solo aplicaciones de planes. Sus declaraciones comerciales se consideran funciones publicitadas, no evidencia independiente de calidad, resultados clínicos o desempeño. [S5]

### 7.2. Hipótesis de posicionamiento de BE

Según BE-LEG-02 v0.2.1 y BE-LEG-03 v0.2.1, BE se orienta al trabajo profesional longitudinal con asesorados. En su especificación, combina Nutrición, Entrenamiento y Antropometría con consentimiento contextual, versionado histórico y separación entre prescripción, ejecución y revisión. Las reglas concretas residen en 04/05/06/08/09; no nacen de este análisis de competencia.

La oportunidad que se propone validar es si ese recorrido integrado y explicable reduce la dispersión de información y facilita que el profesional reconstruya el fundamento de cada decisión. Es una hipótesis de producto. No se presenta como demanda comprobada, liderazgo competitivo ni conformidad legal certificada.

### 7.3. Qué falta para validar comercialmente

No hay en esta revisión una estimación defendible de TAM/SAM/SOM, ingresos, disposición a pagar o retención. Para obtenerla se propone, fuera del cierre estático de MESA-02, entrevistar profesionales del segmento definido en 02/03 y observar tareas con un prototipo autorizado. Registrar tarea, tiempo, errores de interpretación, pasos de reconstrucción y valoración cualitativa. Cualquier tamaño de muestra y resultado se informará cuando exista; no se inventan encuestas realizadas.

Para la tesis, el resultado demostrable será el sistema analizado, diseñado y verificado contra requisitos. El éxito académico no exige probar una superioridad comercial todavía no medida. El modelo SaaS B2B2C de BE-LEG-03 sigue siendo el encuadre de negocio; no se fijan aquí precios ni cobros reales.

### 7.4. Depuración respecto de v4

Se retiran las afirmaciones no respaldadas sobre saturación del mercado, imposibilidad de competir contra software gratuito, lanzamiento institucional fechado, obligatoriedad de digitalización y sincronización total sin control del titular. Tampoco se afirma que los competidores incumplan normativa o que no puedan incorporar versionado. No se sustituyen por nuevos hechos supuestos. Las conclusiones jurídicas permanecen bajo sus fuentes/políticas propietarias y revisión profesional correspondiente; esta comparación no audita cumplimiento.

## 8. Comparación con la competencia

### 8.1. Regla de lectura

Los cinco ejes se mantienen: control del titular por finalidad, multiprofesionalidad sin mezcla indebida, ausencia de diagnóstico automático, trazabilidad versionada y canales. **NE** significa «no establecido por las páginas oficiales consultadas para el criterio exacto»; no significa «el producto no lo tiene». Registrar seguimiento no demuestra inmutabilidad histórica; ofrecer permisos de equipo no demuestra ni refuta el modelo A3/B2 de BE. No se deducen capacidades negativas por silencio de una web comercial.

| Producto / fuente | Control del titular por finalidad, equivalente al criterio BE | Multiprofesionalidad y separación | Ausencia de diagnóstico automático como garantía | Versionado histórico inmutable y corrección aditiva | Canal documentado |
|---|---|---|---|---|---|
| Nutrium [S1] | NE | NE en esta página | NE | NE; consulta de mediciones no prueba versionado | App de cliente; interacción con el software profesional |
| Hexfit [S2] | NE | Seguimiento profesional anunciado; separación por finalidad NE | NE | NE; gráficos de progreso no prueban inmutabilidad | Plataforma profesional y app móvil anunciadas |
| NutriAdmin [S3] | NE | NE en el alcance de la guía | NE | NE | Portal de cliente accesible por navegador, también en smartphone |
| Healthie [S4] | NE para consentimiento revocable por finalidad bajo criterio BE | Care Teams y permisos por miembro documentados; equivalencia completa con BE NE | NE | NE en esta página | Gestión en plataforma y reservas con Care Teams en app móvil documentadas |
| Practice Better [S5] | NE | NE para el criterio exacto | NE | NE | Plataforma de gestión; el sitio presenta portal y app como funciones, sin prueba ejecutada aquí |
| BE — especificación 06/08/09 | A3 y B2 separados; autorización actual por operación | Alcances independientes y vista parcial autorizada | No diagnóstico ni score global según límites canónicos | Versiones emitidas inmutables y correcciones trazables | Website profesional/administrador y APK asesorado, objetivos de 07 |

### 8.2. Conclusión comparativa defendible

La documentación pública muestra solapamiento funcional, y al menos una alternativa describe colaboración con permisos. Por ello, BE no se presenta como «el único que integra» ni como el único que protege datos. Su aporte de tesis es hacer explícita y trazable una solución: cada permiso, estado, transición, versión, contrato y prueba debe poder justificarse desde un requisito. La diferencia será demostrada contra sus propios criterios de aceptación y tareas de uso, no inferida de celdas NE.

BE permanece especificado y en preparación de implementación. No se atribuyen a la plataforma usuarios, despliegue, métricas de éxito, APK operativa ni controles ya ensayados. Una comparación empírica futura requerirá cuentas de prueba autorizadas, configuración registrada y un protocolo igual para cada producto.

## 9. Roles del equipo

| Responsabilidad | Titular / condición |
|---|---|
| Dirección del proyecto y autoría académica | Elián Bufi; decisiones y aprobación final humanas |
| Análisis, integración y defensa de la tesis | Elián Bufi, con asistencia de IA declarada; validar toda afirmación del entregable |
| Producción de esta corrección MESA | ChatGPT/Codex, 13-09-2026; no actúa como revisor independiente de su propia v5 |
| Ejecución técnica prevista | Codex con Astra, según la solicitud de Dirección; pendiente de gate, ambiente y paquete autorizado |
| Reverificación independiente | Otro revisor que no haya producido v5; aún no realizada |

No se agregan integrantes ni correos no confirmados. Antes de portada y envío final: confirmar correo institucional, fecha de entrega y nómina definitiva.

## Fuentes primarias y correspondencia de afirmaciones

| ID | Fuente y URL directa | Consulta | Pasaje/localizador verificable | Afirmación que sostiene y límite |
|---|---|---|---|---|
| S1 | [Nutrium — funciones de la app del cliente](https://help.nutrium.com/en/articles/3372169-what-are-the-features-of-the-nutrium-mobile-app-for-nutrition-clients) | 2026-09-13 | Lista de funciones después de “Once they log in”; configuración individual de funciones | Plan, mediciones y diarios de cliente; no acredita consentimiento BE ni inmutabilidad |
| S2 | [Hexfit — sitio oficial](https://www.myhexfit.com/en/) | 2026-09-13 | Program creation, Files management, Mobile app, Nutritional tracking | Oferta de programas, seguimiento, nutrición y móvil; no se utilizan cifras promocionales como resultados verificados |
| S3 | [NutriAdmin — introducción al portal del cliente](https://nutriadmin.com/docs/introduction-to-the-client-portal-in-nutriadmin/) | 2026-09-13 | Primeros dos párrafos; acceso mediante navegador en smartphone | Compartir planes/reportes/cuestionarios y completar diarios; no demuestra app nativa ni criterio BE de permisos |
| S4 | [Healthie — Care Teams](https://help.gethealthie.com/article/480-care-teams) | 2026-09-13 | Introducción; Care Team Member Settings; soporte de reservas en app | Varios proveedores por cliente y permisos por miembro; no valida todos los criterios del modelo BE |
| S5 | [Practice Better — sitio oficial](https://practicebetter.io/) | 2026-09-13 | Tools to scale your practice; integración That Clean Life; catálogo de funciones | Suite de práctica y planificación integrada declaradas; no se usan testimonios ni cifras de usuarios como evidencia de eficacia |

Fuentes de terceros o URL no verificadas de v4 no sustentan esta versión. Los cinco productos seleccionados no constituyen un ranking ni una recomendación de compra. No se mantuvieron citas HTML con índices de una conversación anterior.
