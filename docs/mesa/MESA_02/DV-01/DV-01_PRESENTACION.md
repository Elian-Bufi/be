# DV-01 — Presentación

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud
> **Autor:** `[NOMBRE Y APELLIDO — TO VERIFY]` · `[correo@davinci.edu.ar — TO VERIFY]`
> **Carrera:** Analista de Sistemas, Escuela Da Vinci · **Entrega:** `[MES AÑO — TO VERIFY]`

---

## Resumen ejecutivo

**El problema.** Un nutricionista arma un plan en Word, lo manda por WhatsApp y anota el seguimiento en una planilla. Un entrenador hace lo mismo por su lado. El asesorado usa una app de consumo para registrar lo que come. Nadie ve el proceso completo, nadie puede reconstruir por qué se decidió lo que se decidió, y el titular de los datos no controla quién accede a qué.

**La solución especificada.** BE es una plataforma donde profesionales de nutrición, entrenamiento y antropometría trabajan sobre el mismo asesorado **sin mezclar dominios**, con acceso gobernado por consentimiento con finalidad declarada, planificación versionada donde lo emitido es inmutable, y registro de ejecución que se contrasta con lo indicado sin producir puntajes ni calificaciones.

**El alcance.** Siete capacidades funcionales: identidad y consentimiento de datos de salud; perfil profesional con verificación por alcance; vínculo y autorización contextual; circuito nutricional completo; circuito de entrenamiento con periodización; antropometría transversal con corrección y anulación trazables; y cartera, tablero y progreso propio. Más dos capacidades transversales incorporadas durante el desarrollo: métodos de cálculo reproducible y solicitudes estructuradas de información.

**El método.** El sistema fue **especificado en su totalidad antes de escribir código de producto**: doce documentos canónicos, cada uno aprobado por acta de dirección tras contrarrevisión independiente contra las fuentes. Requisitos, casos de uso, modelo de dominio, arquitectura, seguridad, contratos de API, diseño de interacción, plan de pruebas y matriz de trazabilidad, en ese orden y con ese gobierno.

**El estado.** La especificación está completa y baselineada. **La implementación no está iniciada**: no hay código verificado, ni despliegue, ni prueba ejecutada. Este documento describe un sistema especificado, y lo declara en cada entregable donde podría confundirse.

---

## Índice — los catorce puntos

| # | Entregable | Estado | Dónde está |
|---|---|---|---|
| 1 | Presentación | **disponible** | este documento + `DV-01_PORTADA` |
| 2 | Acta del proyecto | **disponible** | `DV-02_ACTA.md` |
| 3 | Requisitos funcionales Website y APK | **disponible** | `DV-03_RF_POR_CANAL` |
| 4 | Casos de uso: diagrama y documentación | **disponible** | `DV-04` — 8 diagramas + 56 fichas |
| 5 | Casos de prueba | **disponible** | `DV-05` — 59 casos diseñados |
| 6 | Diagrama entidad–relación | **disponible, a reconciliar** | `DV-06` — 12 vistas |
| 7 | Diagrama de clases | **disponible, a reconciliar** | `DV-07` — 20 figuras |
| 8 | Diagrama de arquitectura | **disponible** | `DV-08` — 3 figuras + 7 ADR |
| 9 | Diagrama de componentes | **disponible** | `DV-09` — 19 componentes + matriz |
| 10 | Diagrama de Gantt | **al cierre del proyecto** | pendiente |
| 11 | URL de demo (APK y Website) | **requiere implementación** | pendiente |
| 12 | URL de descarga de APK + repositorio | **requiere implementación** | pendiente |
| 13 | URL de Website + repositorio | **requiere implementación** | pendiente |
| 14 | Usuarios con distintos roles | **requiere implementación** | pendiente |

El estado de cada punto es el real, no el deseado. Los puntos 11 a 14 dependen de que exista software desplegado; los artefactos que los soportan —arquitectura de despliegue, ambientes, seed de usuarios por rol— están especificados en `DV-08` y `DV-05`.

---

## Convenciones de lectura

Todos los diagramas de este trabajo comparten notación. Esta página evita repetir la leyenda catorce veces.

**Colores.** Azul: elementos del sistema. Verde: actores humanos y secuencia de proceso. Ámbar: elementos externos, diferidos o pendientes de reconciliación. Gris: notas y metadatos.

**Formas.** Rectángulo con tres compartimentos: clase UML con atributos y operaciones. Rectángulo con encabezado: entidad del modelo de datos. Elipse: caso de uso. Rectángulo redondeado: estado. Cilindro: base de datos. Figura de palo: actor.

**Marcas.** `ᴾᴷ` clave conceptual. `ᶠᵏ` referencia a otra entidad. `«enumeration»` conjunto cerrado de valores. `{inv: …}` invariante que la clase debe cumplir. `[guarda]` condición que habilita una transición. `/ evento` lo que se emite al ejecutarla.

**Identificadores.** Cada elemento lleva el identificador canónico de su documento de origen: `RF-xxx` requisitos, `UC-xxx` casos de uso, `T-06-xx` términos de dominio, `REG-06-xxx` reglas, `INV-06-xxx` invariantes, `API-XXX-nn` operaciones. Cualquier elemento de cualquier figura puede rastrearse a su fuente.

**Rótulos de estado.** Las veinte figuras de `DV-06` y `DV-07` que representan entidades o clases llevan `A RECONCILIAR CON REPOSITORIO`: muestran el dominio especificado, y el repositorio actual tiene un esquema anterior. Las cinco figuras de `DV-08` y `DV-09` llevan `DESPLIEGUE NO VERIFICADO` o `CÓDIGO NO VERIFICADO`. No son advertencias formales: marcan exactamente dónde la especificación todavía no fue contrastada con software real.

---

## Glosario

| Sigla | Significado |
|---|---|
| **RF / RNF** | requisito funcional / no funcional |
| **UC** | caso de uso. `UC-P` principal · `UC-I` incluido · `UC-E` extensión · `UC-S` soporte |
| **P0 / P1 / P2** | prioridad: núcleo no recortable · diferible · opcional |
| **T-06-xx** | término del modelo de dominio. `T-06-Nxx` constructo del metamodelo |
| **REG-06-xxx** | regla de dominio · **INV-06-xxx** invariante con condición de violación |
| **M-01 … M-12** | áreas del modelo de dominio |
| **A1 / A2** | aceptación de términos / información de privacidad |
| **A3** | consentimiento de tratamiento de datos de salud, otorgado por el titular |
| **B2** | consentimiento profesional por alcance y finalidad |
| **PDP** | punto de decisión de autorización: evalúa siete dimensiones por operación |
| **Alcance** | dimensión que delimita qué puede hacer un profesional: especialidad o capacidad |
| **Asesorado** | persona bajo seguimiento profesional, titular de sus datos |
| **Instantánea** | representación congelada de lo indicado al momento de activar un plan |
| **Corrección trazable** | registro aditivo que rectifica sin destruir el original |
| **Anulación** | condición que declara una medición no efectiva sin borrarla |
| **SIN_DATO** | ausencia declarada de dato. Nunca es cero ni se interpola |
| **Ocurrencia / Registro** | cuándo pasó el hecho / cuándo el sistema lo registró. Nunca se sustituyen |
| **TVCC-30** | tasa trazable de ciclos cerrados en una ventana de treinta días |
| **API-XXX-nn** | operación de interfaz. 15 familias, 122 operaciones P0 |
| **ADR** | registro de decisión arquitectónica con alternativas y consecuencias |
| **C4** | notación de arquitectura en niveles: contexto, contenedores, componentes |
| **AS-IS / TO-BE** | estado actual del código / estado especificado como objetivo |
| **NOT_EXECUTED** | caso de prueba diseñado y no ejecutado |
| **GPROTO** | grupo de prototipos UX que comparten una decisión de interacción |
| **DEC-nnn** | decisión de producto registrada por acta de Dirección |
| **ACTA-DIR-nnn** | acta de Dirección: aprueba, corrige o autoriza una etapa |
| **Gate** | compuerta formal entre etapas; no se cruza sin acta |

---

## Nota metodológica

Un tribunal razonablemente preguntará por qué este proyecto dedicó su tiempo a especificar en lugar de construir.

La respuesta es que **corregir una especificación cuesta una fracción de lo que cuesta corregir código desplegado**, y que un proyecto individual asistido por agentes de IA necesita, más que uno con equipo, que las decisiones estén escritas y sean verificables antes de que alguien empiece a programar contra ellas.

Ese método produjo resultados medibles. La trazabilidad va de 69 requisitos a 56 casos de uso, a 79 términos de dominio con 221 reglas y 226 invariantes, a 122 operaciones de API, a las pantallas y al plan de pruebas — y cada eslabón fue auditado contra su fuente antes de aprobarse. El régimen de contrarrevisión detectó al menos dos defectos que ningún control automático habría encontrado: una cobertura declarada de 25 unidades sobre 31 reales, y una inversión de identificadores propagada a tres actas.

El costo fue el tiempo. El beneficio es que la fase de construcción arranca sin ambigüedad sobre qué se construye, y con un plan de pruebas que ya sabe qué tiene que demostrar.
