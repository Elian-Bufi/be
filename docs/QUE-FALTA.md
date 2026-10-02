# Qué falta desarrollar en BE

**Corte:** 2026-10-01, con DL-112, DL-113 y DL-114 integradas en `main` (`0c02326`, #128).

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
2. **Ninguna APK desde la 0.12.0 se probó en un teléfono.** Quedan los recorridos de 0.12.0, 0.12.1, 0.12.2 y 0.13.0 (`EVIDENCIA/PUBLICACION-*/LEEME.md`).
3. **TalkBack y la letra del sistema al máximo** nunca se probaron en un Android físico (RNF-ACC-001). Faltan las capturas 16, 17, 19, 20, 21 y 22 de la guía de capturas.

## 2. Funcionalidades P0 que faltan

Faltan 22 de las 122 operaciones P0 del contrato 09.

| Qué | Requisitos | Estado |
|---|---|---|
| **Alta y verificación de profesionales, y rol administrador** (WP-09). Hoy un profesional se habilita con un servicio interno y cuentas demo | RF-008 a RF-014 · UC-P01 a P03 · API-PRO-01 a 13 · DL-036 | Fuera del tramo; sin ficha `WP-09.md` |
| **Seguimiento profesional** (lo que queda de WP-10): cola de revisiones, línea temporal, notas de coordinación, proyecciones y TVCC-30 | RF-052 a 055, 057 y 058 · API-DSH-01, 02, 04 y 05 · API-PRJ-01 a 03 · API-CRD-01 | Hecho en parte: «Pendientes» (DL-107) y los resúmenes por dominio (DL-031) |
| **Perfil del asesorado** con nombre visible. Hoy el profesional ve «Asesorado · c36743» | RF-017 · UC-P25 · API-ACC-06 · DL-009 · DL-040 | Sin implementar |
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

**UX** (`docs/ux/GUIA-UX-UI.md` §11)
- En la figura del teléfono, con muchos pliegues, los halos del tronco se tocan.
- Recargar el website cierra la sesión (DL-012).

## 4. Decisiones que esperan a Dirección

- **Ahora:**
  - ratificar DL-111, DL-112 (la lista de 21 métodos) y DL-113 (la UX; incluye las coordenadas del bíceps y la cresta ilíaca, y en qué zona abre la APK);
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
- **Concurrencia:** hay un 503 intermitente bajo carga de concurrencia, sin explicar (`DEFENSA/WP-06.md` §5.5).
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
