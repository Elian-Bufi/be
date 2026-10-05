# Qué falta desarrollar en BE

> **Nota del 2026-10-05.** La entrega es el 2026-10-20, por instrucción de Dirección. La base de `test` vence antes (punto 1 de §1). Dirección probó en el teléfono la APK 0.14.0-candidata.1 el 2026-10-05: el informe está en DL-117. El resto de este documento es del corte del 2026-10-02.

**Corte:** 2026-10-02. En `main` (`6213ec8`) están integrados:
- DL-112, DL-113 y DL-114 (#128);
- la auditoría de dependencias corregida (#130);
- el pulido de UX/UI de DL-113 (#131).

La APK vigente es la 0.13.1.

**Fuentes:**
- `docs/DEUDA_LEGAJO.md`, que tiene la tabla y cada DL;
- las fichas de `docs/paquetes` y `docs/propuestas`;
- las evidencias (`EVIDENCIA/*/LEEME.md`);
- el contrato 09 (§27 y §37), comparado con `packages/domain/src/openapi.ts`.

Cada punto lleva su ID. El detalle está en el documento que se cita.

## 1. Urgente

1. **La base de `test` vence cerca del 16 o 18/10** (plan gratuito de Render). Recrearla obliga a:
   - registrar de nuevo las cuentas demo;
   - un PR de configuración (`BE_DEMO_PROFESIONALES`);
   - rehacer los vínculos y los datos del escenario.

   Ver «Límites del plan gratuito» en `docs/DESPLIEGUE.md`.
2. **Ninguna APK desde la 0.12.0 se probó en un teléfono.** Quedan los recorridos de la 0.12.0 a la 0.13.1 (`EVIDENCIA/PUBLICACION-*/LEEME.md`). El de la 0.13.1 incluye «Mi evolución» y la figura con los puntos en su altura anatómica.
3. **TalkBack y la letra del sistema al máximo** nunca se probaron en un Android físico (RNF-ACC-001). Faltan las capturas 16, 17, 19, 20, 21 y 22 de la guía de capturas.
4. **DL-115, de severidad alta.** Revocado el A3, el titular sigue leyendo su evolución antropométrica y el detalle de sus formularios; nutrición y entrenamiento sí lo cortan (08:406). Espera la decisión de Dirección. La recomendación es la opción A, de tamaño S, que necesita una APK nueva.

## 2. Funcionalidades P0 que faltan

Faltan 22 de las 122 operaciones P0 del contrato 09.

| Qué | Requisitos | Estado |
|---|---|---|
| **Alta y verificación de profesionales, y rol administrador** (WP-09). Hoy un profesional se habilita con un servicio interno y cuentas demo. El administrador es actor en RF-011, RF-012 y RF-014, y exige MFA siempre (08 §25) | RF-007 a RF-014 · RF-067 · UC-P01 a P03 · UC-E01 · API-PRO-01 a 13 · DL-036 | Fuera del tramo. Ficha del 2/10 en `docs/propuestas/PERFIL-DEL-ASESORADO-Y-ADMINISTRACION_fichas.md`. **La mesa pide distintos roles, no un administrador** |
| **Seguimiento profesional** (lo que queda de WP-10): cola de revisiones, línea temporal, notas de coordinación, proyecciones y TVCC-30 | RF-052 a 055, 057 y 058 · API-DSH-01, 02, 04 y 05 · API-PRJ-01 a 03 · API-CRD-01 | Hecho en parte: «Pendientes» (DL-107) y los resúmenes por dominio (DL-031) |
| **Perfil del asesorado** con nombre visible. Hoy el profesional ve «Asesorado · c36743». El perfil propio existe sin contenido (RF-017 parcial desde WP-02); el nombre visible sale del 09v8 §3.2 y del B10-08 §5.4 | RF-017 · UC-P25 · API-ACC-06 · DL-009 · DL-040 | El nombre y API-ACC-06, sin implementar. Ficha del 2/10 en el mismo documento |
| **Exportar los datos del titular** y los pasos 2 y 3 de la revocación de A3 | DL-021 · REV-A-D4 | Sin implementar |
| **Alta por invitación** con declaración de mayoría de edad. Hoy el asesorado pasa su identificador por fuera de BE | DL-023 · DL-035 | Sin implementar |
| **Suspender y restablecer una cuenta** desde la interfaz | DL-020 | Solo servicio interno |
| **Configurar la capacidad** del profesional | RF-066 · DL-051 · DL-087 | `SIN_LIMITE` por defecto |

## 3. Mejoras por dominio, ya identificadas

**Antropometría**
- Al crear una toma se acepta cualquier versión como protocolo, incluso una de método o una reemplazada (DL-110 y DL-111).
- Métodos que no se sembraron: Heymsfield, Martin, Kerr, la densidad visible y los índices de VanItallie y Kouri (DL-111, ficha §13 y §15.2).
- La importación de bioimpedancia por archivo está pedida «para más adelante», pero sin equipos ni formato definidos (DL-110).
- Pedir datos al asesorado desde antropometría no tiene ficha (PF-06, F-ANT-01).

**Entrenamiento**
- Las 17 zonas musculares y el material didáctico (DL-081).
- La búsqueda por texto en wger y Open Food Facts (DL-098).
- La procedencia externa en el ítem del plan (DL-099).
- Lo que queda de PF-03: descanso con semántica, tempo por fases y alternativas preaprobadas (PF03-D-2 a D-7).
- Declarar una serie como no realizada (DL-106).
- «Tu historial» con período elegible y más de 90 días (DL-096).

**Nutrición**
- PF-04, contexto y objetivos nutricionales: hoy un objetivo solo conductual no se puede registrar sin inventar calorías.
- PF-05: plan práctico y revisión.
- Corregir una ingesta prescripta (DL-050).
- Con B2 revocado, el asesorado ve la lista de ingestas pero no su detalle ni su plan (hallazgo H-1 de PF-04).

**Formularios y asesorado**
- Campos de selección y de fecha (DEC-04, DL-103).
- Perfil reutilizable (DL-095).
- El asesorado no lee sus propias revisiones (REV-A).
- El piloto de inteligencia supervisada (PF-08).

**UX** (`docs/ux/GUIA-UX-UI.md` §12)
- En la figura del teléfono, con todos los pliegues, la guía del subescapular cruza la del antebrazo dentro de su tarjeta y pasa por detrás de su punto (`EVIDENCIA/UX-PULIDO-DL113/LEEME.md`).
- La barra inferior de la APK a 320 dp entra achicando las etiquetas. Hay que verla en un teléfono chico.
- Recargar el website cierra la sesión (DL-012).

## 4. Decisiones que esperan a Dirección

- **Ahora:**
  - ratificar DL-111 y DL-112 (la lista de 21 métodos);
  - ratificar DL-113, la UX y su pulido del 2/10. Incluye:
    - la ubicación de los sitios de la figura: el bíceps y la cresta ilíaca ya están a su altura anatómica, y hay una observación sobre el supraespinal;
    - en qué zona abre la APK;
  - ratificar DL-114, la excepción de node-forge, que vence el 31/10;
  - decidir DL-115, el A3 del titular en antropometría y formularios;
  - las decisiones D-1 a D-7 de la matriz de DV-05 y las dudas de las reconciliaciones de DV-02 y DV-06;
  - las preguntas abiertas de la ficha de métodos (§15.2).
- **Abiertas con provisorio en el código:** DL-106, DL-108 (D-4, D-6 y D-7), DL-063 (plazo del borrador antropométrico), REV-A (D1 a D4), PF-03 (D-2 a D-9), PF-04 (D-1 a D-11), DEC-01 a DEC-13 del Plan Funcional y el logo con alas. Además, unas cincuenta DL de plataforma, cuenta, vínculos, nutrición y entrenamiento: la lista completa está en la tabla de `docs/DEUDA_LEGAJO.md`.
- **Decididas, pero esperan la reemisión del legajo** (el manifiesto impide editarlo desde el repo):
  - DL-007, DL-030 y DL-032 a 034;
  - DL-044, DL-045 y DL-058 a 061;
  - DL-065, DL-074, DL-075, DL-092 y DL-094.

## 5. Infraestructura y deuda técnica

- **API en plan gratuito:** se duerme a los 15 minutos y el arranque en frío tarda entre 25 y 60 segundos.
- **Despliegue:**
  - no hay pre-deploy (DL-006);
  - el Blueprint despliega sin esperar la CI (DL-008).
- **APK:**
  - sin cuota de EAS, se construye localmente en 20 a 26 minutos;
  - `apk.yml` no tiene `EXPO_TOKEN`.
- **Concurrencia:** hay un 503 intermitente con lecturas concurrentes (`DEFENSA/WP-06.md` §5.5).
  - El 2026-10-02 se vio que es `P2028` de Prisma: la transacción no pudo empezar a tiempo. Pasó en la máquina local, con poca memoria (`EVIDENCIA/UX-PULIDO-DL113/LEEME.md`).
  - Severidad media. Sin corregir.
- **Antes de datos reales**, hay que cumplir el gate de 24 condiciones del 08 §42. Incluye:
  - MFA;
  - textos legales;
  - mayoría de edad;
  - backups con restauración probada;
  - producción separada;
  - DPA;
  - canal de derechos.
- **Escala:**
  - el límite de intentos vive en la memoria de una instancia (DL-015);
  - no se purgan la idempotencia ni las sesiones (DL-019 y DL-026);
  - la cartera tiene un tope de 200 asesorados.

## 6. Documentos con estado viejo

Son de orden, no de funcionalidad:
- **WP-08 figura «sin integrar»** en `WP-08.md`, `DEFENSA/WP-08.md`, DL-086 y `EVIDENCIA/ENTREGA/LEEME.md`, pero está integrado desde #72.
- **`DEUDA_LEGAJO.md`:** DL-072, DL-042, DL-084, DL-065, DL-108 y DL-093 tienen el estado desactualizado.
- **LEEME «sin integrar»:** CARTERA, PLANTILLAS, HABITUALES, APARIENCIA-APK y ANTROPOMETRIA-EVOLUCION ya están integrados.

## 7. Fuera de alcance declarado

No es pendiente, salvo que Dirección lo pida:
- pagos, chat, turnos, wearables y prescripción;
- acceso con Google y recuperación de acceso;
- notificaciones push, modo sin conexión y temporizador de descanso;
- editor libre de plantillas;
- protocolos y fórmulas del profesional;
- cardio y circuitos.

El detalle está en los §8 de cada paquete y en el Plan Funcional §1.3.
