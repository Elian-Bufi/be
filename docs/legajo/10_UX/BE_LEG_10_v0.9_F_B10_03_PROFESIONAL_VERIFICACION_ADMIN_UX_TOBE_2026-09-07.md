# BE-LEG-10 v0.9-F — B10-03 · Profesional, verificación y administración UX P0 TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** BE-LEG-10  
> **Entrega:** `F`  
> **Bloque:** `B10-03 — Profesional, verificación y administración`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR DE ENTREGA F — NO APROBADO · NO CANÓNICO`  
> **Autorización:** `ACTA-DIR-029`  
> **Implementación:** `NO AUTORIZADA`

---

# 0. Objetivo

Diseñar el alta profesional escalonada y la operación administrativa mínima sin colapsar:

```text
identidad
perfil profesional
especialidad
capacidad antropométrica transversal
Alcance
verificación
habilitación
vínculo
consentimiento
autorización
```

---

# 1. Fuentes

| Fuente | SHA-256 |
|---|---|
| 05 v0.15 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` |
| 06 v0.1.1 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |
| 08 v0.1.5 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` |
| 09 v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |
| 09 auxiliar acceso/gobierno | `f775e3cc8cb55a7d3de69dd1262cb535e05b9d9e588d7a46f0fcd2d0c9c89662` |
| 10 v0.2 shells/routing | `6946701f1aa9e1be0274d367c421b60f15055f9baf27bf2f311d92d9bcc68e35` |
| 10 v0.8 Cartera | `e4271c7f912fa932a728ad5daccb087ed1d4b855dfd6dbd8f540a7d679426a1c` |

---

# 2. Invariantes

```text
perfil profesional ≠ verificación
declarar scope ≠ verificarlo
VERIFICADO ≠ habilitación
VERIFICADO ≠ vínculo
VERIFICADO ≠ autorización

verificación:
por Alcance/capacidad
≠ global

PENDIENTE
VERIFICADO
RECHAZADO
SUSPENDIDO
= cuatro estados mínimos

observación/subsanación
≠ quinto estado

Antropometría
= capacidad transversal
≠ tercera especialidad

ADMIN
≠ profesional

break-glass
≠ actor profesional

suspensión de un Alcance
≠ suspensión automática de todos

rehabilitación
≠ restauración de sesiones/vínculos/consentimientos
```

---

# 3. Arquitectura de superficies

## Profesional

```text
SHELL-PRO
├─ Configuración profesional
│  ├─ Perfil
│  ├─ Alcances
│  └─ Verificación
└─ Cartera
```

`Cartera` es home solo cuando el contexto profesional operativo está legítimamente disponible.

## Administrador

```text
SHELL-ADM
└─ Verificaciones
   ├─ Cola
   └─ Detalle de presentación
```

No `/dashboard` universal.

No admin health console.

---

# 4. Alta profesional escalonada

```text
Identidad / sesión
→ perfil profesional
→ declarar Alcances/capacidades
→ cargar evidencia
→ crear presentación versionada
→ presentar a revisión
→ resolución por Alcance

PENDIENTE
├─ OBSERVE
│  → PENDIENTE
│  → subsanar
├─ VERIFY
│  → VERIFICADO
└─ REJECT
   → RECHAZADO
   → nueva presentación permitida
   → PENDIENTE

VERIFICADO
→ SUSPENDIDO
→ VERIFICADO
```

No crear “EN_OBSERVACIÓN” como estado.

---

# 5. Perfil profesional

Bindings:

```text
API-PRO-01
API-PRO-02
```

Pantalla:

```text
Mi perfil profesional
```

Debe separar:

- datos del perfil;
- Alcances declarados;
- estado de verificación por Alcance;
- capacidad antropométrica, si corresponde.

Editar perfil no muestra promesas del tipo:

> “Guardar cambios actualizará tu verificación”.

---

# 6. Declaración de Alcances

Binding:

```text
API-PRO-03
```

UX:

```text
Ámbitos profesionales
```

Para especialidades:

- Nutrición;
- Entrenamiento.

Para Antropometría:

```text
Capacidad antropométrica
```

en sección visual propia o claramente diferenciada.

No:

```text
Especialidad: Antropometría
```

Aunque el contrato técnico use un código/scope, la semántica de producto conserva DEC-044.

---

# 7. Estado de verificación por Alcance

Representación:

```text
Nutrición          PENDIENTE
Entrenamiento      VERIFICADO
Antropometría      [capacidad / estado aplicable]
```

Nunca:

```text
Profesional verificado: Sí/No
```

como resumen que oculte estados disjuntos.

Puede existir un resumen:

> **Tenés 1 ámbito verificado y 1 pendiente**

sin convertirlo en estado global.

---

# 8. Evidencia y presentación

Bindings:

```text
PRO-04 — upload intent
PRO-05 — nueva presentación versionada
PRO-06 — listar propias
PRO-07 — detalle propio
PRO-08 — submit
```

Flujo:

```text
Elegir Alcance
→ cargar evidencia
→ verificar archivos cargados
→ crear presentación
→ revisar versión
→ enviar a revisión
```

Reglas UX:

- upload ≠ presentación;
- presentación ≠ submit;
- submit ≠ verificación;
- versión presentada queda inmutable;
- nueva evidencia posterior = nueva versión.

---

# 9. Observación y subsanación

Admin puede resolver:

```text
OBSERVE
```

El profesional ve:

> **Se requiere subsanación**

como resultado/tarea ligada a la presentación.

El badge de verificación permanece:

```text
PENDIENTE
```

Acción:

> **Preparar nueva versión**

No:

```text
Estado: OBSERVADO
```

como quinto estado.

La nueva versión preserva historia.

---

# 10. Rechazo y nueva presentación

`RECHAZADO` conserva:

- presentación;
- evidencia;
- resolución;
- fundamento visible según política.

Nueva presentación:

```text
RECHAZADO
→ nueva versión/ciclo
→ PENDIENTE
```

No botón “Reabrir verificación” que muta historia.

---

# 11. Verificado vs habilitado

La UX no infiere:

```text
VERIFICADO
→ automáticamente HABILITADO
```

Si el contexto operativo aún no está disponible, mostrar una proyección neutral derivada del servidor:

> **Tu verificación está completa. La disponibilidad para operar depende de las condiciones vigentes de tu cuenta y ámbito profesional.**

No crear estado técnico `HABILITACION_PENDIENTE` desde 10.

El shell y las acciones operativas se muestran según routing/capabilities server-owned y PDP.

---

# 12. Suspensión

Binding:

```text
API-PRO-12
```

Admin:

> **Suspender ámbito profesional**

Confirmación:

> La suspensión bloquea nuevas operaciones de este ámbito. No elimina la historia ni modifica automáticamente otros ámbitos.

Profesional:

```text
SUSPENDIDO
```

con copy:

> **Este ámbito está suspendido para nuevas operaciones.**

No implicar sanción clínica ni borrar historial.

---

# 13. Rehabilitación

Binding:

```text
API-PRO-13
```

Admin:

> **Rehabilitar ámbito**

Efecto UX:

```text
SUSPENDIDO → VERIFICADO
```

No prometer:

- reabrir sesiones;
- reactivar vínculos;
- restaurar B2;
- reanudar procesos automáticamente.

---

# 14. Administración — cola de verificaciones

Binding:

```text
API-PRO-09
```

Home:

```text
Verificaciones
```

Filtros contractuales:

- scope;
- state.

Item:

- profesional;
- ámbito/capacidad;
- versión;
- fecha de submit;
- estado.

No mostrar datos de salud de asesorados.

---

# 15. Detalle administrativo

Binding:

```text
API-PRO-10
```

Debe mostrar solo lo necesario para resolver:

- perfil relevante;
- scope/capacidad;
- versión de presentación;
- evidencia;
- historia de resoluciones aplicable.

Acciones:

```text
Observar
Verificar
Rechazar
```

Binding de resolución:

```text
API-PRO-11
```

No existe “aprobar profesional completo”.

---

# 16. Separación ADMIN / profesional

ADMIN no puede:

- entrar a Cartera como el profesional;
- anular mediciones;
- editar planes;
- ejecutar revisión profesional;
- usar break-glass como “modo profesional”.

B10-03 no crea CTA:

```text
Ver como profesional
Actuar como profesional
```

Break-glass pertenece al régimen excepcional de 08 y no redefine actoría.

---

# 17. Antropometría transversal

La identidad puede tener:

```text
solo capacidad antropométrica
```

sin Nutrición/Entrenamiento.

UX de configuración:

```text
Especialidades
- Nutrición
- Entrenamiento

Capacidades transversales
- Antropometría
```

No se crea:

```text
tercera especialidad
```

La verificación/operación conserva el régimen por capacidad/Alcance aplicable.

---

# 18. Matriz de estados

| Estado 06 | Profesional ve | Admin puede | No significa |
|---|---|---|---|
| `PENDIENTE` | En revisión / requiere acción si hay observación | observar/verificar/rechazar | habilitado |
| `VERIFICADO` | Verificado para ese ámbito | suspender si procede | acceso a asesorados |
| `RECHAZADO` | Rechazado + historia | revisar nueva presentación futura | borrado |
| `SUSPENDIDO` | Suspendido para nuevas operaciones | rehabilitar | cierre de identidad |

Observación:

```text
hecho/tarea
→ no fila adicional de estados
```

---

# 19. Empty/error states

## Sin ámbitos declarados

> **Todavía no declaraste ámbitos profesionales.**

## Sin presentaciones

> **No hay presentaciones de verificación para este ámbito.**

## Admin sin pendientes

> **No hay presentaciones para los filtros actuales.**

## Recurso no revelable

Consumir `404 RESOURCE_NOT_FOUND`.

No:

> “La presentación existe pero no tenés permiso”.

---

# 20. Copy crítico

Usar:

```text
Ámbito
Verificación
Presentación
Evidencia
Observación
Subsanación
Suspensión
Rehabilitación
Capacidad antropométrica
```

Evitar:

```text
certificado por BE
profesional aprobado globalmente
especialidad antropometría
cuenta castigada
admin médico
```

BE verifica evidencia conforme a su proceso; no certifica competencia universal.

---

# 21. Binding contractual B10-03

```text
PRO-01
PRO-02
PRO-03
PRO-04
PRO-05
PRO-06
PRO-07
PRO-08
PRO-09
PRO-10
PRO-11
PRO-12
PRO-13

ACC-05
→ routing/capabilities first-party
```

No se inventa listado administrativo global de profesionales si el contrato no lo expone.

Acciones de suspensión/rehabilitación se presentan solo desde recursos/contextos que ya resolvieron el `professionalScopeId`.

---

# 22. Candidatas

| ID | Tema | Estado |
|---|---|---|
| `CAND-10-PRO-01` | onboarding profesional escalonado | RATIFICABLE |
| `CAND-10-PRO-02` | estado por Alcance, no global | OBLIGADO |
| `CAND-10-PRO-03` | observación como tarea/badge secundario | RATIFICABLE |
| `CAND-10-PRO-04` | separar Especialidades y Capacidades | RATIFICABLE |
| `CAND-10-ADM-01` | Home Verificaciones | RATIFICADA POR B10-01 |
| `CAND-10-ADM-02` | detalle + tres resoluciones | RATIFICABLE |
| `CAND-10-ADM-03` | suspensión/rehabilitación contextual | RATIFICABLE |

---

# 23. Escenarios adversariales

## `ADV-10-PRO-01 — Verificación global`
Falla si un ámbito verificado convierte todos en verificados.

## `ADV-10-PRO-02 — Observación quinto estado`
Falla si aparece token/estado `OBSERVADO`.

## `ADV-10-PRO-03 — Verificado = habilitado`
Falla si Cartera se concede solo por badge.

## `ADV-10-PRO-04 — Antropometría especialidad`
Falla si se presenta como tercera especialidad.

## `ADV-10-PRO-05 — Upload = submit`
Falla si cargar archivo envía automáticamente.

## `ADV-10-PRO-06 — Submit = verify`
Falla si enviar evidencia habilita.

## `ADV-10-PRO-07 — Admin global approval`
Falla si PRO-11 “aprueba profesional” sin Alcance.

## `ADV-10-PRO-08 — Suspensión contagiosa`
Falla si suspender un ámbito afecta otros sin canon.

## `ADV-10-PRO-09 — Rehabilitación revive permisos`
Falla si restaura sesiones/vínculos/consentimientos.

## `ADV-10-PRO-10 — Break-glass como modo profesional`
Falla si admin puede actuar como profesional.

## `ADV-10-PRO-11 — Listado inventado`
Falla si UX requiere GET administrativo inexistente.

---

# 24. Prototipos requeridos

## `PROTO-10-PRO-01`
Alta profesional: perfil → ámbitos → evidencia → submit.

## `PROTO-10-PRO-02`
Estados por ámbito + observación/subsanación.

## `PROTO-10-ADM-01`
Cola de verificaciones + detalle + resolve.

## `PROTO-10-ADM-02`
Suspensión/rehabilitación por ámbito.

## `PROTO-10-PRO-03`
Identidad exclusivamente antropométrica sin tercera especialidad.

---

# 25. Deudas downstream

- copy/accessibility final → B10-10;
- visual exacto de badges → prototipo;
- disponibilidad/habilitación no se inventa como estado;
- break-glass no recibe nueva UI profesional;
- pruebas de state machine → 11A.

---

# 26. DoD

No cerrar si:

- falta alguno de los cuatro estados mínimos;
- observación es quinto estado;
- verificación es global;
- verificado implica habilitación/acceso;
- antropometría es especialidad;
- admin se vuelve profesional;
- se inventa GET/listado;
- se modifica dominio/estado desde 10.
