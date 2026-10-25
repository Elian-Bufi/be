# Qué falta desarrollar en BE

> **Nota del 2026-10-24, a la noche.** Desde la nota del 23/10, se integró y se desplegó en `test`, con la autorización de
> Dirección:
> - las dependencias con avisos nuevos (#201);
> - la excepción del zod de la CLI de Expo, con su procedencia comprobada (#202, DL-114);
> - la validación acotada de cuerpos (#206);
> - la corrección del recorrido intermitente `faltaUnaParte` (#207);
> - la compatibilidad de las APK publicadas (#198, DL-152).
>
> `test` sirve la API y el website en `2811991`. Siguen sin integrar #195, #200 y #203, y sin hacer las pruebas humanas.
> Las excepciones de DL-114 vencen el 2026-10-31. El estado vigente está en
> `EVIDENCIA/CONSOLIDACION-2026-10-23/LEEME.md`, en «Estado actual». La nota del 23/10 queda como estaba.
>
> **Nota del 2026-10-23 (encargo de consolidación).** El estado reconciliado, con lo integrado, lo preparado en PR y lo
> que falta comprobar, está en `EVIDENCIA/CONSOLIDACION-2026-10-23/MATRIZ-DE-ESTADO.md`. Desde el corte de abajo:
> - **En `main` (`0fb1bff`, desplegado en `test`):** lo integrado hasta el 20/10. Incluye:
>   - la sesión que sobrevive a una recarga (DL-147, #186);
>   - los borradores (DL-148, #188);
>   - el flujo profesional pulido (DL-149, #190);
>   - los recorridos de navegador en la CI (DL-150, #191);
>   - el catálogo base (#184, #185, #189);
>   - la herramienta de las recetas de ejemplo (#192). Las recetas no están cargadas.
> - **Preparado en PR, sin integrar:**
>   - #200, el número de Nutrición dice qué falta (DL-153);
>   - #203, la evidencia de una revisión (DL-154);
>   - #195, la sustitución de ejercicios en la APK (DL-151);
>   - #198, la compatibilidad de las APK publicadas (DL-152);
>   - #201, las dependencias con avisos nuevos;
>   - #202, la propuesta de excepción, que espera la decisión de Dirección.
> - **La combinación se probó junta** en #204, que no se integra.
> - **Las marcas de abajo** se corrigieron el 2026-10-23 donde estaban viejas, con la fecha. Lo histórico queda.
>
> **Nota del 2026-10-16.** Desde el corte se integró y se desplegó en `test`:
> - el escritorio profesional por áreas (#153 a #159), con Pendientes, Resumen, Línea de tiempo, Analizar y Preparar revisión;
> - la cohorte de seis personas con historia (#161);
> - las novedades, los avisos y los recordatorios (#163);
> - REV-A (#164);
> - el buscador sin tildes, el retiro de los teléfonos al revocar sesiones y la guía de demo con la cohorte (#165);
> - la APK con solo los permisos que usa, para la próxima construcción (#166).
>
> Además quedó implementada la TVCC-30, la métrica de validación de la tesis (RF-058 · UC-S01, DL-135). Se corre con un comando interno, sin HTTP, y su integración sigue en su PR.
>
> **Nota del 2026-10-17.** Quedaron hechas las notas de coordinación entre los profesionales de una persona (RF-057, P0 · UC-E07 · API-CRD-01; DL-140), con las ocho opciones recomendadas que aprobó Dirección, en `wp-notas-de-coordinacion`, sin integrar.
>
> La APK 0.16.0-candidata.1 lleva todo eso y los arreglos de la 0.15.0-candidata.1. Las marcas de este documento están al día en lo que se tocó ese día; el resto sigue siendo del 2/10.
>
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

1. ~~**La base de `test` vence cerca del 16 o 18/10.**~~ **Resuelto el 2026-10-16:** Dirección pasó la base a
   Basic-256mb y la API a Starter (#160). La base ya no vence y la API no se duerme. Ver «Planes de Render» en
   `docs/DESPLIEGUE.md`.
2. **El teléfono:** Dirección probó la 0.14.0-candidata.1 (5/10) y la 0.15.0-candidata.1 (7 y 8/10); los dos defectos que encontró están corregidos en la 0.16.0-candidata.1 (#151 y #152), que falta probar. Antes: **ninguna APK desde la 0.12.0 se probó en un teléfono.** Quedan los recorridos de la 0.12.0 a la 0.13.1 (`EVIDENCIA/PUBLICACION-*/LEEME.md`). El de la 0.13.1 incluye «Mi evolución» y la figura con los puntos en su altura anatómica. **Al 2026-10-23:** la candidata vigente es la 0.17.0-candidata.3 (19/10); Dirección probó con la .2 el acceso con Google y la invitación (17/10), y la .3 entera **no se probó**. Además, las candidatas 0.15 a 0.17 perdieron la sustitución de ejercicios (DL-151): vuelve con #195, en una candidata nueva. La estable sigue siendo la 0.13.2, y no se promueve una candidata sin la sustitución ni la prueba completa (DL-152).
3. **TalkBack y la letra del sistema al máximo** nunca se probaron en un Android físico (RNF-ACC-001). Faltan las capturas 16, 17, 19, 20, 21 y 22 de la guía de capturas.
4. ~~**DL-115, de severidad alta.**~~ **Resuelto:** decidida con la opción A el 2/10 e integrada en la 0.13.2 (#133, #140). Antes: Revocado el A3, el titular sigue leyendo su evolución antropométrica y el detalle de sus formularios; nutrición y entrenamiento sí lo cortan (08:406). Espera la decisión de Dirección. La recomendación es la opción A, de tamaño S, que necesita una APK nueva.
5. ~~**La auditoría de dependencias frena la CI de toda rama (2026-10-23).**~~ **Resuelto el 2026-10-24:**
   #201 y #202 integrados (`361e8d1`). Renovar o no las excepciones de DL-114 antes del 2026-10-31 es decisión de
   Dirección; el aviso de braces se retiró el 23/10. Antes: Después del 20/10 se publicaron avisos altos y
   críticos de Next, zod, multer y body-parser. Una corrida nueva de `main` también fallaría: #198, que no toca
   dependencias, falla con los mismos avisos. #201 corrige los que tienen corrección. Queda el zod 3 que exige la CLI de
   Expo, sin versión corregida, y exceptuarlo es decisión de Dirección (#202), porque DL-114 no autoriza ampliar las
   excepciones. Las excepciones vigentes vencen el **2026-10-31**: node-forge sigue sin corrección y braces ya no aparece.

## 2. Funcionalidades P0 que faltan

Faltan 22 de las 122 operaciones P0 del contrato 09. **Al 2026-10-23, contadas por ID contra el inventario, faltan 18:** las 13 de verificación y administración (API-PRO-01 a 13), API-DSH-01, 02 y 05, y API-PRJ-02 y 03.

| Qué | Requisitos | Estado |
|---|---|---|
| **Alta y verificación de profesionales, y rol administrador** (WP-09). Hoy un profesional se habilita con un servicio interno y cuentas demo. El administrador es actor en RF-011, RF-012 y RF-014, y exige MFA siempre (08 §25) | RF-007 a RF-014 · RF-067 · UC-P01 a P03 · UC-E01 · API-PRO-01 a 13 · DL-036 | Fuera del tramo. Ficha del 2/10 en `docs/propuestas/PERFIL-DEL-ASESORADO-Y-ADMINISTRACION_fichas.md`. **La mesa pide distintos roles, no un administrador**. **Desde el 2026-10-23, el próximo paquete funcional a definir** (pedido de Dirección: habilitar por área, observar, suspender y restablecer, con auditoría y una autenticación acorde, que para el administrador el 08 §25 fija en MFA): `docs/paquetes/WP-ADMINISTRACION.md`. La exclusión del 22/9 no anula esta intención |
| **Seguimiento profesional** (lo que queda de WP-10): cola de revisiones, línea temporal, notas de coordinación, proyecciones y TVCC-30 | RF-052 a 055, 057 y 058 · API-DSH-01, 02, 04 y 05 · API-PRJ-01 a 03 · API-CRD-01 | Hecho en parte: «Pendientes» (DL-107), los resúmenes por dominio (DL-031) y la línea de tiempo del escritorio. **La TVCC-30 (RF-058 · UC-S01) quedó hecha el 2026-10-16** (DL-135): cálculo interno y conservado, sin HTTP, como dice el 09. **Las notas de coordinación (RF-057, P0) quedaron hechas el 2026-10-17** (DL-140; Dirección aprobó las ocho recomendadas): API-CRD-01, la lectura en la línea de tiempo y el Resumen del website, y «Notas entre tus profesionales» en la APK; **integradas el 2026-10-17 (#178)**. La TVCC-30 se integró el 16/10 (#167). Faltan las proyecciones (PRJ-02 y PRJ-03) y DSH-01, 02 y 05 |
| **Perfil del asesorado** con nombre visible. El perfil propio existía sin contenido (RF-017 parcial desde WP-02); el nombre visible sale del 09v8 §3.2 y del B10-08 §5.4 | RF-017 · UC-P25 · API-ACC-06 · DL-009 · DL-040 | **Hecho el 2026-10-15** (decisión de Dirección; **integrado el 2026-10-16, #159**): el nombre visible con versiones, API-ACC-06 y su lectura, «Tu nombre» en «Cuenta», y el profesional lo ve con un vínculo vigente. En la APK desde la 0.16.0-candidata.1; otros campos del perfil siguen en DL-023 y DL-095 |
| **Novedades y avisos push**: el centro de novedades, los avisos por Expo y los recordatorios diarios de registro | RF-061 · RF-062 · UC-P30 · UC-E08 · API-NOV-01 a 06 · DL-133 | **Hecho el 2026-10-16** (pedido de Dirección; PR #163): website y APK. Para que un teléfono reciba avisos falta el proyecto de Firebase de Dirección (`docs/DESPLIEGUE.md`, «Avisos push») |
| **Exportar los datos del titular** y los pasos 2 y 3 de la revocación de A3 | DL-021 · REV-A-D4 | Sin implementar. Al 2026-10-23 hay una definición del paquete (DL-142) **solo en la rama local** `wp-exportar-mis-datos` (`aae3584`, 16/10), sin publicar |
| **Alta por invitación** con declaración de mayoría de edad. Hoy el asesorado pasa su identificador por fuera de BE | DL-023 · DL-035 | ~~Sin implementar~~ **Hecho el 2026-10-16** (al día el 23/10): la invitación por enlace, QR o código (DL-136, #171 a #173) y la declaración de mayoría de edad en toda alta (DL-138, #176) |
| **Suspender y restablecer una cuenta** desde la interfaz | DL-020 | Solo servicio interno. Entra en `docs/paquetes/WP-ADMINISTRACION.md` (D-4) |
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
- La sustitución de ejercicios se perdió en las candidatas 0.15 a 0.17 (DL-151): **preparada en #195** (al día con `main` el 2026-10-23), falta la APK nueva y el teléfono.
- «Tu historial» con período elegible y más de 90 días (DL-096).

**Nutrición**
- PF-04, contexto y objetivos nutricionales: hoy un objetivo solo conductual no se puede registrar sin inventar calorías.
- PF-05: plan práctico y revisión.
- Corregir una ingesta prescripta (DL-050).
- Con B2 revocado, el asesorado ve la lista de ingestas pero no su detalle ni su plan (hallazgo H-1 de PF-04).
- Un día con una comida del plan sin registrar salía «sin faltantes» (UX-01 de la auditoría): **preparado en #200** (DL-153, 2026-10-23).
- Una revisión registrada no mostraba su evidencia, su período ni su autor (UX-02): **preparado en #203** (DL-154, 2026-10-23), también en Entrenamiento.

**Formularios y asesorado**
- Campos de selección y de fecha (DEC-04, DL-103).
- Perfil reutilizable (DL-095).
- ~~El asesorado no lee sus propias revisiones (REV-A).~~ **Hecho el 2026-10-16** con las opciones A (DL-134): lista y detalle en la APK, y la novedad de una revisión la abre.
- El piloto de inteligencia supervisada (PF-08).

**UX** (`docs/ux/GUIA-UX-UI.md` §12)
- En la figura del teléfono, con todos los pliegues, la guía del subescapular cruza la del antebrazo dentro de su tarjeta y pasa por detrás de su punto (`EVIDENCIA/UX-PULIDO-DL113/LEEME.md`).
- La barra inferior de la APK a 320 dp entra achicando las etiquetas. Hay que verla en un teléfono chico.
- ~~Recargar el website cierra la sesión (DL-012).~~ **Hecho el 2026-10-20** (DL-147, #186). Falta probarlo contra `test` en Chrome, Edge y Firefox; Safari, sin CHIPS, pide volver a entrar.

## 4. Decisiones que esperan a Dirección

- **Ahora:**
  - ratificar DL-111 y DL-112 (la lista de 21 métodos);
  - ratificar DL-113, la UX y su pulido del 2/10. Incluye:
    - la ubicación de los sitios de la figura: el bíceps y la cresta ilíaca ya están a su altura anatómica, y hay una observación sobre el supraespinal;
    - en qué zona abre la APK;
  - ratificar DL-114, la excepción de node-forge, que vence el 31/10 (revisada el 2026-10-23: sigue sin corrección; braces ya no aparece; la propuesta del zod de la CLI de Expo, en #202);
  - las del encargo del 2026-10-23: DL-151 (R-1 a R-6), DL-153 (D-1 a D-4) y DL-154 (D-1 a D-3), y la definición de WP-ADMINISTRACION (D-1 a D-7);
  - decidir DL-115, el A3 del titular en antropometría y formularios;
  - las decisiones D-1 a D-7 de la matriz de DV-05 y las dudas de las reconciliaciones de DV-02 y DV-06;
  - las preguntas abiertas de la ficha de métodos (§15.2).
- **Abiertas con provisorio en el código:** DL-106, DL-108 (D-4, D-6 y D-7), DL-063 (plazo del borrador antropométrico), REV-A (D1 a D3-bis implementadas con las opciones A el 2026-10-16, a ratificar, DL-134; D4 va con la exportación), PF-03 (D-2 a D-9), PF-04 (D-1 a D-11), DEC-01 a DEC-13 del Plan Funcional y el logo con alas. Además, unas cincuenta DL de plataforma, cuenta, vínculos, nutrición y entrenamiento: la lista completa está en la tabla de `docs/DEUDA_LEGAJO.md`.
- **Decididas, pero esperan la reemisión del legajo** (el manifiesto impide editarlo desde el repo):
  - DL-007, DL-030 y DL-032 a 034;
  - DL-044, DL-045 y DL-058 a 061;
  - DL-065, DL-074, DL-075, DL-092 y DL-094.

## 5. Infraestructura y deuda técnica

- **API en Starter desde el 2026-10-16:** ya no se duerme. Con el plan pago, Render ofrece el pre-deploy: DL-006 se
  puede cerrar, pero todavía no se cambió el despliegue.
- **Despliegue:**
  - no hay pre-deploy (DL-006);
  - el Blueprint despliega sin esperar la CI (DL-008).
- **APK:**
  - sin cuota de EAS, se construye localmente en 20 a 26 minutos;
  - `apk.yml` no tiene `EXPO_TOKEN`.
- **Concurrencia:** hay un 503 intermitente con lecturas concurrentes (`DEFENSA/WP-06.md` §5.5).
  - El 2026-10-02 se vio que es `P2028` de Prisma: la transacción no pudo empezar a tiempo. Pasó en la máquina local, con poca memoria (`EVIDENCIA/UX-PULIDO-DL113/LEEME.md`).
  - Severidad media. Sin corregir.
- **La auditoría de dependencias falla** con avisos publicados después del 20/10 (ver §1, punto 5): #201 y #202.
- **El recorrido de navegador `faltaUnaParte` es intermitente** (2026-10-23): falló en una de las dos corridas de #195, que no toca el website, de #200 y de #205, que en código es igual a `main`, con pedidos que no llegan a la API. Ver la recomendación 2 de `EVIDENCIA/CONSOLIDACION-2026-10-23/LEEME.md`.
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
- ~~**WP-08 figura «sin integrar»** en `WP-08.md`, `DEFENSA/WP-08.md`, DL-086 y `EVIDENCIA/ENTREGA/LEEME.md`, pero está integrado desde #72.~~ **Resuelto el 2026-10-16:** los cuatro dicen que WP-08 se integró el 2026-09-25 (`e83245d`) y salió en la APK 0.10.0. DL-086 quedó CERRADA.
- ~~**`DEUDA_LEGAJO.md`:** DL-072, DL-042, DL-084, DL-065, DL-108 y DL-093 tienen el estado desactualizado.~~ **Resuelto el 2026-10-16:** la tabla y cada entrada dicen el estado real, con su PR:
  - DL-042, cerrada;
  - DL-072 y DL-093, implementadas;
  - DL-084, resuelta con el provisorio;
  - DL-065, con los oráculos escritos, a la espera del 11A;
  - DL-108, integrada.
- ~~**LEEME «sin integrar»:** CARTERA, PLANTILLAS, HABITUALES, APARIENCIA-APK y ANTROPOMETRIA-EVOLUCION ya están integrados.~~ **Resuelto el 2026-10-16:** los cinco dicen con qué PR se integraron el 2026-09-30 y dónde quedaron desplegados o publicados.

## 7. Fuera de alcance declarado

No es pendiente, salvo que Dirección lo pida:
- pagos, chat, turnos, wearables y prescripción;
- ~~acceso con Google~~ (hecho el 17/10, DL-138) y recuperación de acceso;
- ~~notificaciones push~~ (hechas el 16/10, DL-133), modo sin conexión y temporizador de descanso;
- editor libre de plantillas;
- protocolos y fórmulas del profesional;
- cardio y circuitos.

El detalle está en los §8 de cada paquete y en el Plan Funcional §1.3.
