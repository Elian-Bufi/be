# DV-08 — Decisiones arquitectónicas (ADR)

> **Produce:** Claude, por delegación de Dirección · 2026-09-11
> **Fuente única:** `BE-LEG-07 v0.1.11` — `ef4a4b08…` · **Estado:** arquitectura objetivo, despliegue no verificado
> **Complementa:** `DV-08.1` contexto · `DV-08.2` contenedores · `DV-08.3` ambientes

Cada decisión está registrada en formato ADR: contexto que la fuerza, decisión tomada, alternativas y consecuencias. Son las preguntas que un tribunal técnico hace primero.

**Sobre las alternativas.** El Documento 07 sostiene las decisiones adoptadas, pero no siempre registra qué opciones se descartaron. Por eso cada alternativa lleva una de tres marcas:

- *Documentada en 07* — el 07 la nombra y la descarta expresamente.
- *Parcialmente documentada* — el 07 descarta el patrón sin nombrar la opción.
- *Contrafactual analítico incorporado por MESA-02* — análisis técnico razonable que **no** está en la fuente; se incluye como apoyo a la defensa, no como derivación del legajo.

La distinción evita presentar análisis propio como si fuera decisión canónica.

---

## ADR-01 · Monolito modular en lugar de microservicios

**Contexto.** `ASR-01` exige atomicidad de operaciones de dominio: «completa o sin efectos parciales» (`RNF-DAT-001`). La activación de un plan es todo-o-nada con orden instantánea→vigencia (`REG-06-104`); la revisión con continuidad y auditoría no admite cierre parcial (`UC-P13 E10`).

**Decisión.** Monolito modular sobre una única base PostgreSQL, con transacciones ACID locales y frontera transaccional estricta. Sin distribución de escrituras.

**Alternativas.** *Documentada en 07 (`CAND-07-A`, §AS-IS: «se conserva el monolito modular»):* microservicios por dominio —nutrición, entrenamiento, antropometría—: exigiría saga o commit en dos fases para sostener la atomicidad que el legajo promete, con complejidad desproporcionada para un equipo individual y un MVP.

**Consecuencias.** La modularidad es interna, no de despliegue: las fronteras son de código, no de red. Un cambio en un módulo no obliga a coordinar despliegues. El costo es que el escalado horizontal es del monolito entero, aceptable para el alcance previsto.

---

## ADR-02 · Punto de decisión de autorización único (PDP)

**Contexto.** `RF-021` exige evaluar siete dimensiones en **cada** operación protegida, sin decisiones obsoletas tras una revocación (`UC-I02 E03`, `TR-02`). `RNF-SEC-001`: ocultar un botón no es control de acceso.

**Decisión.** `ASR-06`: un único punto de decisión en el backend —guard más servicio de permisos—, evaluado por request sin caché o con invalidación inmediata, **idéntico para Website y APK**.

**Alternativas.** *Contrafactual analítico incorporado por MESA-02 — no declarado en 07:* autorización distribuida por módulo: multiplicaría los lugares donde una revocación podría quedar sin efecto. Caché de permisos: contradice «sin decisiones obsoletas tras revocación».

**Consecuencias.** Todo lo que el Documento 08 promete tiene un lugar concreto donde se cumple. El costo es una consulta de contexto por operación protegida, mitigable con índices pero no eliminable por diseño.

---

## ADR-03 · Historia por adición, sin mutación destructiva

**Contexto.** `ASR-05`: versiones emitidas, instantáneas y registros originales jamás se mutan; la vista efectiva se determina por relación, nunca por timestamp (`INV-06-11…17`, `REG-06-16`).

**Decisión.** Almacenamiento append-only para hechos emitidos. Sin `UPDATE` destructivo sobre lo emitido. Las correcciones y anulaciones son registros nuevos que referencian el original.

**Alternativas.** *Contrafactual analítico incorporado por MESA-02 — no declarado en 07:* actualización en sitio con tabla de auditoría paralela: la auditoría podría divergir del dato, y reconstruir el estado histórico dependería de la integridad de dos estructuras.

**Consecuencias.** El volumen crece de forma monótona. A cambio, cualquier estado pasado es reconstruible y ninguna corrección puede destruir evidencia — que es exactamente lo que `RF-050` y el patrón `M-06` exigen.

---

## ADR-04 · Auditoría bloqueante dentro de la transacción

**Contexto.** `ASR-07`: cuando el control es obligatorio, sin auditoría no hay operación (`UC-I02 E06`, `UC-I03`). La retención de logs de una PaaS es de 7 a 30 días: insuficiente.

**Decisión.** La escritura de auditoría ocurre **en la misma transacción** que la operación sensible, con persistencia en base propia. Deja de ser fire-and-forget.

**Alternativas.** *Parcialmente documentada en 07 (`ASR-07` descarta el patrón fire-and-forget):* auditoría asíncrona por cola: más rápida, pero admite operaciones sin rastro si la cola falla. Logs de plataforma: retención insuficiente y no consultable como dato.

**Consecuencias.** Una operación sensible que no puede auditarse, no ocurre. Es una restricción deliberada de disponibilidad a favor de la trazabilidad.

---

## ADR-05 · Render-first con AWS-ready

**Contexto.** `Q-008` requería decidir proveedor sin atar el diseño. El proyecto es individual y el MVP necesita despliegue reproducible temprano.

**Decisión.** Render en Frankfurt como plataforma inicial, con arquitectura deliberadamente portable —contenedores, PostgreSQL estándar, sin servicios propietarios— de modo que migrar a AWS no exija rediseño.

**Alternativas.** *Documentada en 07 (`Q-008`: Render-first / AWS-ready):* AWS desde el inicio: más control y más costo operativo y de aprendizaje. *Contrafactual analítico incorporado por MESA-02 — no declarado en 07:* auto-hospedaje, descartado por carga operativa.

**Consecuencias.** La región europea tiene implicancias de transferencia internacional que el Documento 08 trata como gate de datos reales, no de demo. Ninguna dependencia de Render entra en el dominio.

---

## ADR-06 · APK por distribución directa, sin tiendas

**Contexto.** `RNF-PORT-001` exige build reproducible. El MVP necesita que un tribunal instale y pruebe la aplicación sin fricción de revisión externa.

**Decisión.** Build con EAS y distribución directa del artefacto `.apk`, con URL de descarga. Sin publicación en tiendas para el alcance de defensa.

**Alternativas.** *Contrafactual analítico incorporado por MESA-02 — no declarado en 07:* Google Play: agrega revisión, tiempos y requisitos de cuenta que no aportan a la validación académica.

**Consecuencias.** Instalación manual con origen desconocido habilitado. Sin actualización automática. Aceptable para demo; la publicación es decisión posterior.

---

## ADR-07 · Concurrencia optimista con un mecanismo único

**Contexto.** `ASR-04`: el patrón «detectar estado concurrente → no declarar éxito → exigir reconsulta» aparece en más de ocho casos de uso. `ASR-02`: unas trece unicidades lógicas con ámbito, estado y ventana.

**Decisión.** Un solo mecanismo: versión de fila con actualización condicional y respuesta `409`, más índices únicos parciales en PostgreSQL como defensa final.

**Alternativas.** *Contrafactual analítico incorporado por MESA-02 — no declarado en 07:* bloqueo pesimista: reduce concurrencia y no resuelve las unicidades condicionales. Mecanismos distintos por módulo: multiplicaría formas de fallar.

**Consecuencias.** El cliente debe manejar `409` y reconsultar. La base garantiza la unicidad aunque la aplicación falle.

---

## Correspondencia ADR ↔ ASR ↔ figura

| ADR | ASR del 07 | RNF que lo justifica | Figura |
|---|---|---|---|
| ADR-01 monolito modular | `ASR-01` | `RNF-DAT-001` | DV-08.2 |
| ADR-02 PDP único | `ASR-06` | `RNF-SEC-001` | DV-08.2 · DV-09.1 |
| ADR-03 historia por adición | `ASR-05` | — (`INV-06-11…17`) | DV-08.2 |
| ADR-04 auditoría bloqueante | `ASR-07` | `RNF-SEC-005` | DV-09.1 |
| ADR-05 Render-first | `ASR-09` · `Q-008` | `RNF-MAN-003` | DV-08.3 |
| ADR-06 APK sin tiendas | `ASR-09` | `RNF-PORT-001` | DV-08.1 · DV-08.2 |
| ADR-07 concurrencia optimista | `ASR-02` · `ASR-03` · `ASR-04` | `RNF-REC-002` | DV-09.1 |

---

## Estado AS-IS vs TO-BE

El Documento 07 auditó el código existente. **Lo que existe hoy:** backend NestJS con Prisma y PostgreSQL, Website Next.js, 45 modelos en el schema. **Lo que falta**, según las brechas `B-1` a `B-11` del 07: artefactos de despliegue —sin Dockerfile, sin pipeline, sin migraciones en deploy—, APK ausente por completo, PDP declarado pero no evaluado como gate real (`B-6`), idempotencia sin constraint en base (`B-4`), y divergencia entre el schema implementado y el dominio del 06 (`B-11`, decisión `H-07-DOM-01` pendiente).

Las figuras de este entregable representan el **TO-BE**. La correspondencia con el código real se verifica en el intake técnico.
