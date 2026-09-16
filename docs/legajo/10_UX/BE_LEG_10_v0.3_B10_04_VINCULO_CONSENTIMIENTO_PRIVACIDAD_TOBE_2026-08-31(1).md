# BE-LEG-10 v0.3 — B10-04 Vínculo, Consentimiento y Privacidad TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-10 — Diseño UI/UX y Prototipos`  
> **Bloque:** `B10-04 — Vínculo, consentimiento y privacidad`  
> **Versión:** `v0.3`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR UX — NO CANÓNICO`  
> **Dependencias:** BE-LEG-05 · BE-LEG-06 · BE-LEG-08 · BE-LEG-09 v0.15 **NO CANÓNICO / CONGELADO COMO INSUMO** · BE-LEG-10 v0.2  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Objetivo del bloque

Diseñar la experiencia TO-BE para el circuito:

```text
solicitud de vínculo
→ decisión del asesorado
→ vínculo
→ consentimiento B2
→ acceso contextual
→ consulta del vínculo
→ pausa
→ reanudación
→ revocación de consentimiento
→ finalización
```

sin mezclar conceptos que el dominio y la seguridad mantienen separados.

Este bloque debe lograr que el usuario comprenda, sin necesidad de conocer el modelo técnico, que:

```text
aceptar trabajar con un profesional
≠ darle acceso automático a todos sus datos

revocar consentimiento
≠ borrar historia

pausar vínculo
≠ eliminarlo

reanudar vínculo
≠ restaurar permisos antiguos

finalizar vínculo
≠ borrar datos
```

---

# 1. Principio UX rector

> **Cada decisión sensible debe explicar su consecuencia concreta antes de ejecutarse.**

No se usan formularios o botones genéricos como:

```text
Aceptar
Cancelar
Confirmar
```

sin contexto.

Preferencia:

```text
Aceptar vínculo
Revocar acceso
Pausar vínculo
Reanudar vínculo
Finalizar vínculo
```

---

# 2. Separación conceptual obligatoria

## 2.1 Solicitud

Significa:

> una parte propone iniciar una relación profesional bajo un alcance/finalidad.

No concede acceso.

## 2.2 Aceptación del vínculo

Significa:

> el asesorado acepta establecer el vínculo.

No concede B2 automáticamente.

## 2.3 Consentimiento B2

Significa:

> el asesorado autoriza el tratamiento/acceso correspondiente a una versión exacta, profesional, alcance, finalidad y categorías pertinentes.

## 2.4 Acceso

No es un “estado de UI” reusable.

La UI puede informar un resumen:

```text
Acceso habilitado
Acceso pendiente
Acceso bloqueado
```

pero la autorización real se decide server-side en cada operación.

---

# 3. Arquitectura de pantallas del asesorado

```text
Vínculos
├─ Solicitudes
│  └─ Detalle de solicitud
│     ├─ Aceptar
│     └─ Rechazar
│
├─ Activos
│  └─ Detalle de vínculo
│     ├─ Estado
│     ├─ Profesional
│     ├─ Alcance
│     ├─ Finalidad
│     ├─ Consentimiento
│     ├─ Pausar
│     ├─ Reanudar
│     └─ Finalizar
│
└─ Consentimientos
   ├─ Activos
   ├─ Revocados
   └─ Históricos
```

La home de Vínculos no debe mezclar solicitudes pendientes con relaciones activas como si fueran equivalentes.

---

# 4. Arquitectura de pantallas del profesional

```text
Cartera / contexto del asesorado
├─ Solicitar vínculo
├─ Estado de solicitud
├─ Estado de vínculo
└─ Estado mínimo de consentimiento
```

El profesional puede saber:

```text
consentimiento pendiente
consentimiento activo
consentimiento revocado
```

cuando esa información sea legítima para el flujo.

No necesita ver:

- texto legal completo del B2 como si fuera el titular;
- evidencia técnica sensible del consentimiento;
- IP/UA;
- metadata de seguridad;
- razones internas del PDP.

---

# 5. `CAND-10-REL-A` — Solicitud de vínculo separada por actor

Se propone conservar una misma semántica de producto con dos entry points.

## Profesional

```text
Cartera / Buscar asesorado permitido
→ Solicitar vínculo
```

## Asesorado

P1 descubrimiento:

```text
Servicio antropométrico
→ Solicitar vínculo
```

P0:

```text
Vínculos
→ solicitud/invitación recibida
```

La UI no crea dos conceptos diferentes de vínculo por quién inició.

**Recomendación:** RATIFICAR.

---

# 6. Pantalla — Solicitudes de vínculo

## `CAND-10-REL-01`

Secciones:

```text
Solicitudes recibidas
Solicitudes enviadas
```

si el actor puede iniciar ambas.

Cada item muestra únicamente:

- contraparte;
- alcance;
- finalidad resumida;
- estado;
- fecha relevante.

No muestra datos de salud.

---

# 7. Pantalla — Detalle de solicitud

## `CAND-10-REL-02`

Para el asesorado:

```text
[Profesional]
[Alcance]
[Finalidad]

"Esta solicitud propone iniciar un vínculo profesional.
Aceptar el vínculo no autoriza todavía el acceso a tus datos."
```

Acciones:

```text
Aceptar vínculo
Rechazar solicitud
```

### Copy recomendado

**Aceptar vínculo**

> “Vas a iniciar un vínculo con [Profesional] para [Alcance]. Después podrás revisar qué datos necesita y decidir si autorizás ese acceso.”

### Prohibido

```text
"Aceptar y compartir datos"
```

porque fusiona vínculo + B2.

---

# 8. Confirmación de aceptación

## `CAND-10-REL-03`

No requiere modal dramático si la pantalla anterior ya explica claramente el efecto.

Patrón:

```text
botón explícito
→ acción
→ success state
→ siguiente paso: revisar consentimiento
```

Success:

```text
Vínculo aceptado

Ahora revisá qué información solicita el profesional antes de autorizar el acceso.
```

CTA:

```text
Revisar consentimiento
```

---

# 9. Rechazo

## `CAND-10-REL-04`

Acción:

```text
Rechazar solicitud
```

No exigir motivo obligatorio salvo que 06/09 lo requieran.

Success:

```text
Solicitud rechazada
```

No usar:

```text
Bloquear profesional
```

como sinónimo.

---

# 10. Consentimiento — pantalla previa al acto

## `CAND-10-CON-01`

Debe mostrar de forma comprensible:

```text
Quién
→ profesional

Para qué
→ finalidad

En qué ámbito
→ alcance

Qué información
→ categorías pertinentes

Qué versión se acepta
→ texto/versionado aplicable
```

---

# 11. Jerarquía de contenido B2

Orden recomendado:

## 11.1 Resumen humano

```text
[Profesional]
quiere acceder a información necesaria para:
[Finalidad]

dentro de:
[Alcance]
```

## 11.2 Categorías

Mostrar categorías en lenguaje claro.

Ejemplo conceptual:

```text
✓ datos de entrenamiento
✓ información de salud pertinente para ejercicio
```

No:

```text
C4
scopeId
purposeCode
```

## 11.3 Aclaración

```text
"Solo podrá acceder a la información autorizada mientras el vínculo y este consentimiento sigan vigentes."
```

## 11.4 Texto completo

Disponible mediante:

```text
Ver detalle completo
```

pero el resumen no reemplaza la versión legal/informativa exacta.

---

# 12. `CAND-10-CON-A` — Consentimiento sin checkbox preseleccionado

El acto B2 debe ser explícito.

No:

```text
[✓] Autorizo...
```

preseleccionado.

No:

```text
Continuar = aceptar
```

si el botón no expresa la acción.

Botón:

```text
Autorizar acceso
```

**Recomendación:** RATIFICAR.

---

# 13. A1 / A2 / A3 — onboarding

Aunque el foco de este bloque sea B2, la privacidad debe mantener la separación aprobada:

```text
A1
A2
A3
```

No diseñar:

```text
[ ] Acepto términos, privacidad, fotos, marketing y todo lo demás
```

como checkbox único.

Cada acto que requiera decisión separada debe presentarse como tal.

---

# 14. Success de consentimiento

## `CAND-10-CON-02`

Después de aceptar:

```text
Acceso autorizado
```

Mostrar:

- profesional;
- alcance;
- finalidad;
- fecha;
- estado.

CTA:

```text
Ver vínculo
```

No presentar:

```text
"Ahora [Profesional] puede ver todos tus datos"
```

---

# 15. Consentimientos propios

## `CAND-10-CON-03`

Ubicación:

```text
Vínculos
→ Consentimientos
```

y también:

```text
Cuenta
→ Privacidad
→ Consentimientos
```

Mismo contenido, dos entry points.

No duplicar lógica.

---

# 16. Listado de consentimientos

Cada item:

```text
Profesional
Alcance
Finalidad
Estado
Fecha de aceptación
Fecha de revocación si existe
Estado actual del vínculo
```

Estados UX:

```text
Activo
Revocado
No efectivo
```

### `No efectivo`

Puede utilizarse cuando:

```text
consentimiento históricamente activo
pero vínculo pausado/finalizado
```

sin sugerir que fue revocado.

---

# 17. `CAND-10-CON-B` — Revocar tan localizable como otorgar

La acción Revocar debe estar disponible desde el detalle del consentimiento activo.

No esconderla en:

```text
Configuración avanzada
Más opciones
Centro legal
```

**Recomendación:** RATIFICAR.

---

# 18. Pantalla — Revocación

## `CAND-10-CON-04`

Antes:

```text
Revocar acceso de [Profesional]
```

Explicar:

> “Este consentimiento dejará de habilitar el acceso futuro asociado a este alcance y finalidad. Tu historial no se borra y el vínculo no se finaliza automáticamente.”

Acciones:

```text
Volver
Revocar acceso
```

No:

```text
Eliminar datos
```

---

# 19. Success — Revocación

```text
Acceso revocado
```

Detalle:

```text
El profesional ya no debe poder acceder mediante este consentimiento.
El vínculo continúa en su estado actual.
```

CTA:

```text
Ver vínculo
```

---

# 20. Pantalla — Detalle de vínculo

## `CAND-10-REL-05`

Bloques:

```text
Profesional
Alcance
Finalidad
Estado del vínculo
Consentimiento
Acceso actual resumido
Historial mínimo de estado
Acciones
```

No mostrar:

- razones internas de autorización;
- gates técnicos;
- claims;
- metadata de sesión.

---

# 21. Estados de vínculo — lenguaje UX

Mapeo preliminar:

```text
PENDING_ACCEPTANCE
→ Pendiente

ACTIVE / operativo canónico
→ Activo

PAUSED
→ Pausado

FINALIZED
→ Finalizado

REJECTED
→ Rechazado
```

El término técnico exacto del estado operativo seguirá al 06/09.

---

# 22. Pausar vínculo

## `CAND-10-REL-06`

Acción disponible según actor/regla canónica.

Confirmación:

```text
Pausar vínculo
```

Copy:

> “Mientras el vínculo esté pausado, el profesional no tendrá acceso al contenido del asesorado mediante este vínculo. La historia se conserva.”

No:

```text
"Desactivar temporalmente notificaciones"
```

porque minimiza el efecto real.

---

# 23. Estado pausado

Mostrar:

```text
Vínculo pausado
Acceso profesional bloqueado
```

Acciones:

```text
Reanudar vínculo
Finalizar vínculo
```

si corresponden.

No mostrar contenido sensible del asesorado al profesional en modo “solo lectura”.

---

# 24. Reanudar vínculo

## `CAND-10-REL-07`

Confirmación:

> “Reanudar el vínculo no restaura automáticamente permisos anteriores. BE volverá a comprobar el consentimiento y las condiciones vigentes cuando se intente acceder.”

En lenguaje más simple para el usuario:

```text
"Al reanudar, el acceso dependerá de que las autorizaciones necesarias sigan vigentes."
```

No:

```text
"Restaurar acceso"
```

---

# 25. Finalizar vínculo

## `CAND-10-REL-08`

Es una acción crítica.

Antes de confirmar:

```text
Finalizar vínculo con [Profesional]
```

Consecuencia explícita:

> “El profesional perderá el acceso futuro asociado a este vínculo. Tu historial se conserva según las reglas de BE.”

Si hay procesos activos:

- la UI puede indicar que finalizar tendrá efectos sobre esos procesos;
- no inventa consecuencias no definidas en 06.

---

# 26. `CAND-10-REL-B` — No pedir texto destructivo

No se recomienda:

```text
Escribí FINALIZAR para continuar
```

salvo una acción excepcional de mucho mayor riesgo.

Para vínculo:

```text
confirmación contextual + CTA explícito
```

es suficiente.

**Recomendación:** RATIFICAR.

---

# 27. Success — Finalización

```text
Vínculo finalizado
```

Copy:

```text
[Profesional] ya no tiene acceso futuro mediante este vínculo.
Tu historial continúa disponible para vos según corresponda.
```

No CTA para:

```text
"Ver datos compartidos con el profesional"
```

si eso implicara acceso profesional residual.

---

# 28. Vista profesional de vínculo

Dentro del workspace:

```text
Header
→ estado de vínculo
→ estado mínimo de autorización
```

Ejemplos:

```text
Activo · acceso contextual
Pausado · sin acceso
Consentimiento pendiente
Consentimiento revocado
Finalizado
```

No:

```text
B2=true
PDP=DENY
```

---

# 29. Estado profesional cuando falta B2

Si el vínculo está aceptado pero B2 no:

```text
Vínculo activo
Acceso pendiente de autorización del asesorado
```

Acciones del profesional:

```text
NO:
Aceptar por el asesorado
Forzar acceso
Reenviar consentimiento automáticamente de forma manipulativa
```

Sí puede existir:

```text
información del estado
```

sin presión UX indebida.

---

# 30. Dark patterns prohibidos

## 30.1 Consentimiento

No:

- preselección;
- doble negativo;
- botón aceptar prominente + revocar oculto;
- countdown;
- “recomendado” para consentir;
- culpa.

## 30.2 Revocación

No:

```text
¿Seguro? Vas a perder todos tus avances
```

si no es verdad.

## 30.3 Finalización

No:

```text
Tu profesional se decepcionará
```

## 30.4 Fotos/media

No hacer que aceptar fotos sea condición visual implícita si son opcionales.

---

# 31. Privacidad — arquitectura de información

Dentro de Cuenta:

```text
Privacidad
├─ Consentimientos
├─ Vínculos
├─ Datos y uso
├─ P1: Derechos del titular
├─ P1: Exportar mis datos
└─ P1: Cierre de cuenta
```

La privacidad no se reduce a:

```text
"Política de privacidad"
```

Debe incluir acciones reales de autogobierno.

---

# 32. P1 — Derechos del titular

Arquitectura preliminar:

```text
Privacidad
→ Mis datos
   ├─ Solicitar acceso
   ├─ Solicitar rectificación
   └─ Solicitar supresión
```

Cada solicitud:

- muestra estado;
- muestra fecha;
- muestra plazo aplicable en lenguaje humano;
- no promete eliminación cuando existe excepción/retención.

No se desarrolla en alta fidelidad para G4 P0.

---

# 33. P1 — Exportar mis datos

```text
Privacidad
→ Exportar mis datos
```

Flujo:

```text
elegir alcance
→ solicitar
→ preparando
→ listo
→ descargar
```

No usar:

```text
"Descargar base completa"
```

si el alcance está limitado.

---

# 34. P1 — Cierre de cuenta

```text
Cuenta
→ Cerrar cuenta
```

Debe ser claramente distinto de:

```text
Cerrar sesión
Eliminar un dato
Revocar consentimiento
Finalizar vínculo
```

No se desarrolla alta fidelidad todavía.

---

# 35. Seguridad — sesiones

En Cuenta:

```text
Seguridad
├─ sesión actual
├─ otras sesiones
└─ cerrar todas las sesiones
```

El usuario entiende:

```text
cerrar sesiones
≠ cerrar cuenta
```

---

# 36. Admin — verificación y privacidad

El administrador no recibe una UX de exploración general.

En admin:

```text
Verificaciones
→ solicitud
→ evidencia necesaria
→ resolver
```

No:

```text
Usuarios
→ abrir
→ ver todo
```

---

# 37. Break-glass

No forma parte de navegación normal.

Si se materializa:

```text
seguridad excepcional
→ motivo
→ alcance
→ duración
→ confirmación
```

Requiere step-up/MFA.

Visualmente debe advertir que es una operación excepcional y auditada.

No puede transformarse en:

```text
modo administrador
```

persistente.

---

# 38. Estados UX por operación sensible

## Solicitud

```text
loading
pending
accepted
rejected
error
```

## Consentimiento

```text
required
active
revoked
not-effective
error
```

## Vínculo

```text
pending
active
paused
finalized
rejected
```

## Acción

```text
idle
submitting
success
retryable-error
non-retryable-error
```

No permitir doble submit si una acción ya está en tránsito.

---

# 39. Idempotencia visible en UX

El usuario no ve `Idempotency-Key`.

Sí ve:

```text
Guardando...
```

Si se pierde la red:

```text
"No pudimos confirmar el resultado. Reintentá."
```

El mismo submit se reintenta de forma segura.

No:

```text
"Error. Volvé a aceptar el consentimiento."
```

si BE puede recuperar el resultado lógico original.

---

# 40. Error neutral

Cuando un recurso no puede revelarse:

```text
No pudimos abrir este contenido.
```

CTA:

```text
Volver
```

No:

```text
"El vínculo existe pero no tenés autorización"
```

si eso filtra información.

---

# 41. `partialView` en privacidad y vínculo

Si una vista legítima solo puede mostrar parte de la información:

```text
Vista parcial según tu acceso actual
```

No listar:

```text
Datos ocultos:
- antropometría
- salud
```

porque eso revela precisamente lo que la política puede estar ocultando.

---

# 42. Notificaciones internas del flujo

Si se activan novedades:

Eventos candidatos:

```text
Nueva solicitud de vínculo
Solicitud aceptada
Solicitud rechazada
Consentimiento pendiente
Consentimiento revocado
Vínculo pausado
Vínculo finalizado
```

Push P2:

```text
señal mínima
→ abrir app
→ autenticar
→ consultar BE
```

Nunca incluir C4.

---

# 43. Accesibilidad específica

Flujos críticos deben cumplir:

- labels claros;
- no depender de color para estado;
- botón destructivo distinguible por texto y jerarquía, no solo rojo;
- foco inicial correcto en modal;
- foco devuelto al disparador;
- lector de pantalla anuncia consecuencia y estado;
- no se usa texto pequeño para condiciones críticas;
- texto legal expandible sin perder navegabilidad;
- botones con nombre completo:
  - “Revocar acceso”
  - “Finalizar vínculo”
  - no “Sí”.

---

# 44. Copy — términos preferidos

| Evitar | Preferir |
|---|---|
| Compartir todos tus datos | Autorizar acceso a información específica |
| Dar permiso al profesional | Autorizar acceso |
| Desvincular | Pausar / Finalizar vínculo según acción |
| Eliminar consentimiento | Revocar consentimiento |
| Paciente | Asesorado |
| Acceso histórico | Historial propio / vínculo finalizado |
| Error de permisos | Contenido no disponible |
| Cumplimiento | Registro / contraste descriptivo cuando corresponda |

---

# 45. Flujo P0 completo — asesorado

```text
Vínculos
↓
Nueva solicitud
↓
Detalle
↓
Aceptar vínculo
↓
Success
↓
Revisar consentimiento
↓
Resumen B2
↓
Ver detalle si desea
↓
Autorizar acceso
↓
Success
↓
Vínculo activo
```

Este flow debe ser uno de los prototipos obligatorios.

---

# 46. Flujo P0 — revocación

```text
Cuenta / Privacidad
o
Vínculo

↓
Consentimiento activo
↓
Detalle
↓
Revocar acceso
↓
Consecuencia
↓
Confirmar
↓
Revocado
```

No más pasos que otorgar salvo necesidad real.

---

# 47. Flujo P0 — pausa/reanudación

```text
Vínculo activo
↓
Pausar
↓
Confirmar consecuencia
↓
Pausado
↓
Reanudar
↓
Aclaración:
autorizaciones se reevalúan
↓
Activo / acceso condicionado
```

---

# 48. Flujo P0 — finalización

```text
Vínculo
↓
Finalizar
↓
Consecuencia:
corte de acceso profesional futuro
↓
Confirmar
↓
Finalizado
```

No borrar historia.

---

# 49. Escenarios adversariales que el prototipo debe soportar

## S10-04-01

El vínculo se acepta y el usuario abandona antes de B2.

Resultado:

```text
vínculo existente
+
acceso pendiente
```

No auto-consentimiento.

## S10-04-02

B2 se revoca mientras el profesional está en workspace.

Siguiente lectura/acción:

```text
servidor niega
→ UI limpia contenido sensible
→ estado actualizado
```

## S10-04-03

Se pausa el vínculo en otro dispositivo.

La UI profesional no conserva contenido interactuable como “cache autorizado”.

## S10-04-04

Se reanuda pero el consentimiento ya no es válido.

```text
vínculo activo
+
acceso todavía bloqueado
```

## S10-04-05

Deep link a vínculo finalizado.

No mostrar datos sensibles residuales al profesional.

## S10-04-06

Doble tap en “Autorizar acceso”.

No crea dos consentimientos.

## S10-04-07

Falla de red después de aceptar.

La UI debe poder reconciliar estado sin pedir al usuario repetir ciegamente.

---

# 50. Pruebas futuras 11A

1. aceptar vínculo no crea B2;
2. B2 no puede otorgarlo el profesional;
3. consentimiento muestra versión exacta;
4. revocar corta acceso en la primera operación posterior;
5. revocación no borra historia;
6. revocación no finaliza vínculo;
7. pausa corta lectura/escritura profesional;
8. reanudación no restaura permiso stale;
9. finalización elimina acceso profesional residual;
10. revocación tan accesible como otorgamiento;
11. no dark patterns;
12. deep links no revelables son neutrales;
13. estado profesional se actualiza ante revocación;
14. doble submit no duplica;
15. lector de pantalla entiende acción y consecuencia;
16. modal destructivo devuelve foco correctamente.

---

# 51. Decisiones candidatas de B10-04

| ID | Propuesta | Recomendación |
|---|---|---|
| `CAND-10-REL-A` | misma semántica de solicitud sin importar iniciador | RATIFICAR |
| `CAND-10-CON-A` | B2 explícito, sin checkbox preseleccionado/aceptación implícita | RATIFICAR |
| `CAND-10-CON-B` | revocar tan localizable como otorgar | RATIFICAR |
| `CAND-10-REL-B` | finalización con confirmación contextual, sin escribir palabra destructiva | RATIFICAR |
| `CAND-10-CON-C` | Consentimientos accesibles desde Vínculos y Cuenta/Privacidad con una sola fuente | RATIFICAR |
| `CAND-10-REL-C` | vínculo aceptado + B2 pendiente se muestra como “acceso pendiente”, no error | RATIFICAR |
| `CAND-10-REL-D` | pausa muestra explícitamente “acceso profesional bloqueado” | RATIFICAR |
| `CAND-10-REL-E` | reanudación aclara que las autorizaciones se reevaluarán | RATIFICAR |

---

# 52. Hallazgos

## H10-04-01 — Consentimiento no debe parecer un “segundo aceptar”

Si el flujo visual usa dos pantallas prácticamente iguales:

```text
Aceptar
↓
Aceptar otra vez
```

el usuario no entenderá que una decide vínculo y la otra datos.

Se requiere diferencia clara de:

- título;
- consecuencia;
- contenido;
- CTA.

## H10-04-02 — Pausa y revocación no son sustitutos

Pausa gobierna vínculo.

Revocación gobierna B2.

La UX debe permitir explicar ambos sin fusionarlos.

## H10-04-03 — Finalización no debe parecer eliminación

Debe evitar cualquier iconografía/copy que sugiera:

```text
borrar historial
```

## H10-04-04 — El profesional necesita saber “por qué no puede avanzar” sin recibir detalles de seguridad

Estado recomendado:

```text
Acceso pendiente de autorización
Acceso no disponible
Vínculo pausado
```

No:

```text
B2_INVALID
SCOPE_MISMATCH
PDP_DENIED
```

---

# 53. Artefactos/prototipos requeridos

Al cerrar B10-04 deberán existir como mínimo:

```text
FLOW-10-REL-01
Solicitud → aceptación

FLOW-10-CON-01
Consentimiento → autorización

FLOW-10-CON-02
Revocación

FLOW-10-REL-02
Pausa → reanudación

FLOW-10-REL-03
Finalización
```

Y states:

```text
request pending
relationship active
consent pending
consent active
consent revoked
relationship paused
relationship finalized
```

---

# 54. Estado de salida

```text
BE-LEG-10:
v0.3

B10-01:
DESARROLLADO EN BORRADOR

B10-04:
VÍNCULO / CONSENTIMIENTO / PRIVACIDAD
DESARROLLADO EN BORRADOR

SEPARACIÓN:
VÍNCULO ≠ B2 ≠ ACCESO
PRESERVADA

REVOCACIÓN:
LOCALIZABLE Y EXPLÍCITA

PAUSA:
ACCESO PROFESIONAL BLOQUEADO

REANUDACIÓN:
REEVALUACIÓN DE AUTORIZACIONES

FINALIZACIÓN:
SIN ACCESO PROFESIONAL RESIDUAL
SIN BORRADO DE HISTORIA

DARK PATTERNS:
PROHIBIDOS

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
B10-05 — NUTRICIÓN UX P0
```

---

*Fin de BE-LEG-10 v0.3 — B10-04 Vínculo, Consentimiento y Privacidad TO-BE.*
