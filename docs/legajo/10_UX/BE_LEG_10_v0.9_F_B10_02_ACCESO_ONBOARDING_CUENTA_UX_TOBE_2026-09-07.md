# BE-LEG-10 v0.9-F — B10-02 · Acceso, onboarding y cuenta UX P0/P1 TO-BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** BE-LEG-10 — Diseño UI/UX y Prototipos  
> **Entrega:** `F`  
> **Bloque:** `B10-02 — Acceso, onboarding y cuenta`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR DE ENTREGA F — NO APROBADO · NO CANÓNICO`  
> **Autorización:** `ACTA-DIR-029`  
> **Inventario P0:** `122 operaciones de BE-LEG-09 v0.16.1`  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`

---

# 0. Objetivo

Diseñar el acceso TO-BE desde una identidad no autenticada hasta una cuenta utilizable, manteniendo separados:

```text
identidad
sesión
A1 — términos
A2 — información de privacidad
A3 — DATOS_SALUD_BE
B2 — acceso profesional
```

La UX debe hacer simple el recorrido sin perder la separación jurídica, funcional ni auditiva.

---

# 1. Fuentes propietarias

| Fuente | SHA-256 | Propiedad consumida |
|---|---|---|
| 05 v0.15 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` | UC-P25/P26, UC-E09, conducta de acceso |
| 06 v0.1.1 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` | identidad, método de acceso, separación conceptual |
| 08 v0.1.5 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` | A1/A2/A3, revocación, anti-dark-patterns |
| 09 v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` | ACC-01…06, CON-05…08 |
| 09 auxiliar acceso | `f775e3cc8cb55a7d3de69dd1262cb535e05b9d9e588d7a46f0fcd2d0c9c89662` | contratos ACC/PRO/CON originales |
| 09 auxiliar P1 | `8a3db34e8c4991d427f089c6424da13daa35d883c7f06171e78daac02441f8c5` | recuperación P1 |
| 10 v0.2 | `6946701f1aa9e1be0274d367c421b60f15055f9baf27bf2f311d92d9bcc68e35` | shells/contextos/routing |
| 10 v0.3 | `caa46c8be577995ca60440c3bd983e066defb9406b8f74dc77c6f74d5b1e94d1` | separación vínculo/B2/acceso |

---

# 2. Invariantes UX

```text
registro ≠ sesión
registro ≠ A3
A1 ≠ A2 ≠ A3 ≠ B2

aceptar A3
≠ autorizar profesional

revocar A3
≠ borrar historia inmediatamente
≠ finalizar vínculo
≠ revocar B2 por mutación

A3 ausente/revocado
→ cuenta puede existir
→ contenido/operaciones sensibles quedan bloqueados por PDP

login
≠ autorización de dominio

actorCapabilities
≠ PDP
```

---

# 3. Arquitectura de la jornada de onboarding

```text
PUBLIC
→ Crear cuenta
→ A1 + A2
→ ACC-01
→ Cuenta creada

[frontera técnica: ACC-01 no crea sesión]

→ Iniciar sesión
→ ACC-02

→ Revisar tratamiento de datos de salud
→ CON-05

├─ Aceptar A3
│  → CON-06
│  → resolver contexto
│  → shell legítimo
│
└─ No autorizar ahora
   → cuenta sin contenido sensible
   → acceso a configuración no sensible
   → CTA localizable para revisar A3 después
```

La experiencia puede sentirse como **un solo onboarding**, pero no falsifica una transacción única.

---

# 4. Registro — A1 y A2

## 4.1. Pantalla de creación de cuenta

Contenido:

- identificador local;
- credencial;
- perfil mínimo;
- intención de registro cuando corresponda;
- aceptación A1;
- constancia A2.

Binding:

```text
API-ACC-01
POST /api/v1/registrations
```

A1 y A2 pueden presentarse en una misma pantalla o dos pasos consecutivos, pero:

```text
cada uno tiene:
- etiqueta propia
- vínculo a versión propia
- acto/evidencia propia
```

No usar:

> “Acepto términos, privacidad y tratamiento de salud”.

A3 no forma parte de ACC-01.

## 4.2. Copy crítico

A1:

> **Términos de uso**  
> Confirmo que leí y acepto la versión indicada de los términos de BE.

A2:

> **Información de privacidad**  
> Confirmo que recibí la información de privacidad correspondiente a esta versión.

No describir A2 como consentimiento sensible.

## 4.3. Error neutral

`REGISTRATION_NOT_AVAILABLE`:

> **No pudimos completar el registro con esos datos.**  
> Podés intentar iniciar sesión o recuperar el acceso.

No:

> “Ese correo ya tiene una cuenta”.

---

# 5. Frontera registro → sesión

Después de `ACC-01`:

```text
NO existe sesión contractual
```

La UI no inventa auto-login.

Pantalla/estado:

> **Cuenta creada. Iniciá sesión para continuar con la configuración.**

CTA:

> **Iniciar sesión**

Binding:

```text
API-ACC-02
```

Esto conserva una jornada visual continua sin colapsar contratos.

---

# 6. Login y resolución de contexto

Binding:

```text
API-ACC-02
API-ACC-05
```

Error público neutral:

```text
401 INVALID_CREDENTIALS
```

Copy:

> **No pudimos verificar los datos de acceso.**

No:

```text
usuario inexistente
contraseña incorrecta
cuenta suspendida
```

cuando esa distinción funcione como enumeración.

Después del login:

```text
ACC-05
→ identidad/sesión
→ contextos/capacidades first-party
→ shell legítimo
```

Regla de B10-01:

```text
un contexto
→ entrada directa

más de un contexto legítimo
→ último contexto válido + selector explícito
```

Cambiar contexto no cambia autorización.

---

# 7. A3 — consentimiento de tratamiento de salud

## 7.1. Requirement

Binding:

```text
API-CON-05
GET /api/v1/me/health-data-consent-requirement
```

La pantalla debe mostrar:

- que se trata de datos de salud;
- que construyen la historia longitudinal del titular;
- que partes pertinentes pueden ser consultadas por profesionales autorizados;
- que el titular controla/revoca el permiso;
- versión aplicable;
- información necesaria del texto vigente.

No mezclar B2.

## 7.2. Acción

CTA principal:

> **Autorizar tratamiento de mis datos de salud**

CTA secundaria:

> **Ahora no**

Binding de aceptación:

```text
API-CON-06
POST /api/v1/me/health-data-consents
```

A3 no se preselecciona.

## 7.3. Reducción de fatiga sin dark pattern

Permitido:

- explicación breve inicial;
- resumen + “ver detalle”;
- lenguaje claro;
- continuidad visual con onboarding.

Prohibido:

- checkbox premarcado;
- CTA de rechazo escondido;
- colores que castiguen rechazo;
- fusionar A3 con términos;
- decir “aceptar para terminar registro” cuando la cuenta ya existe.

---

# 8. Cuenta sin A3

Si no existe A3 vigente:

```text
cuenta:
EXISTE

sesión:
PUEDE EXISTIR

operaciones sensibles:
BLOQUEADAS POR PDP

historia de salud operativa:
NO DISPONIBLE
```

UX segura:

```text
Cuenta
├─ Perfil no sensible
├─ Seguridad / sesiones
├─ Privacidad
│  └─ Tratamiento de datos de salud
└─ Contextos no sensibles legítimos
```

No hardcodear una whitelist de backend desde UI.

La superficie principal del asesorado puede mostrar un estado de configuración:

> **Para usar funciones que procesan datos de salud, revisá y autorizá el tratamiento correspondiente.**

No:

> “Tu cuenta está incompleta”.

---

# 9. Historial A3

Binding:

```text
API-CON-07
```

Superficie:

```text
Privacidad
→ Tratamiento de datos de salud
→ Historial
```

Mostrar:

- versión;
- fecha de aceptación;
- estado;
- fecha de revocación, si aplica.

No mostrar por defecto:

- IP;
- user-agent;
- evidencia técnica interna.

---

# 10. Revocación A3

Binding:

```text
API-CON-08
```

Antes:

> **Revocar autorización de datos de salud**

Explicación:

> Al revocar, BE deja de permitir nuevas operaciones sensibles asociadas a este consentimiento. La revocación no borra inmediatamente tu historial ni finaliza tus vínculos. El tratamiento posterior de los datos sigue la política de privacidad aplicable.

CTA:

> **Confirmar revocación**

Después:

> **Autorización revocada.**  
> Las funciones que requieren tratamiento de datos de salud quedaron bloqueadas. Podés revisar tus opciones de privacidad y, cuando corresponda, volver a autorizar mediante un nuevo acto.

No prometer:

```text
“Todos tus datos fueron eliminados”
```

---

# 11. Reotorgamiento

Reotorgar:

```text
CON-05
→ versión aplicable
→ CON-06
→ nuevo acto
```

No “reactivar” el consentimiento revocado en UI.

Copy:

> **Autorizar nuevamente**

La historia anterior permanece.

---

# 12. Sesiones

Bindings:

```text
ACC-03 — cerrar sesión actual
ACC-04 — revocar todas las sesiones
ACC-05 — sesión actual
```

Superficie:

```text
Cuenta
→ Seguridad
```

Acciones:

- Cerrar sesión.
- Cerrar todas mis sesiones.

No confundir con cerrar cuenta.

---

# 13. Perfil propio

Binding:

```text
ACC-05
ACC-06
```

Editar perfil no puede ofrecer controles de:

- rol;
- verificación;
- vínculo;
- consentimiento;
- autorización.

Si un valor luego se reutiliza en FRM, la procedencia se conserva según v0.7.2.

---

# 14. Recuperación de acceso — P1 existente

Conducta:

```text
UC-E09
→ neutral de proveedor
→ no presupone correo
```

Contratos existentes P1:

```text
API-ACC-P1-01
POST /api/v1/auth/recovery-requests

API-ACC-P1-02
POST /api/v1/auth/recovery-requests/{recoveryId}/complete
```

**No forman parte del inventario 122 P0.**

Inicio:

> **Recuperar acceso**

Respuesta inicial:

> **Si los datos permiten iniciar una recuperación, te indicaremos cómo continuar.**

No confirmar existencia de cuenta.

El canal/proveedor no se fija desde 10.

---

# 15. Matriz UX de condiciones

| Condición observable | Superficie | Acción principal | Prohibido inferir |
|---|---|---|---|
| Público | Login/Registro | registrarse / ingresar | existencia de cuenta |
| Cuenta creada, sin sesión | Continuación onboarding | iniciar sesión | auto-login |
| Sesión + A3 no otorgado | Configuración segura | revisar A3 | que no exista cuenta válida |
| Sesión + A3 vigente | Shell/contexto legítimo | continuar | acceso profesional automático |
| A3 revocado | Cuenta/Privacidad | opciones / reotorgar | borrado inmediato |
| Credencial inválida | Login | reintentar/recuperar | causa exacta |
| Recovery solicitada | Recovery | continuar según mecanismo | existencia de identidad |

Estas son **proyecciones UX**, no nuevos estados de dominio.

---

# 16. Empty / error / partialView

## Empty A3 history

> **Todavía no hay actos registrados de autorización de datos de salud.**

## Error requirement

> **No pudimos cargar la información de privacidad necesaria.**

No permitir otorgar A3 sin versión aplicable cargada.

## partialView

No aplica como sustituto genérico de A3.

Una cuenta sin A3 no recibe un “dashboard parcial” que revele contenido sensible oculto.

---

# 17. Binding contractual B10-02

### P0 consumido

```text
ACC-01
ACC-02
ACC-03
ACC-04
ACC-05
ACC-06

CON-05
CON-06
CON-07
CON-08
```

### P1 existente consumido

```text
ACC-P1-01
ACC-P1-02
```

No se crea ninguna operación desde UX.

---

# 18. Candidatas B10-02

| ID | Tema | Estado |
|---|---|---|
| `CAND-10-ACC-01` | onboarding visual continuo con frontera registro→login→A3 | RATIFICABLE |
| `CAND-10-ACC-02` | A1/A2 juntos visualmente pero actos diferenciados | RATIFICABLE |
| `CAND-10-ACC-03` | A3 como paso post-auth separado | OBLIGADO POR CONTRATO |
| `CAND-10-ACC-04` | cuenta sin A3 con superficie no sensible | RATIFICABLE |
| `CAND-10-ACC-05` | Privacidad como ubicación de historial/revocación A3 | PROTOTIPO |
| `CAND-10-ACC-06` | recovery neutral P1 | RATIFICABLE |

---

# 19. Escenarios adversariales

## `ADV-10-ACC-01 — Checkbox global`
Falla si A1/A2/A3 son un único acto.

## `ADV-10-ACC-02 — Auto-login inventado`
Falla si ACC-01 se interpreta como sesión.

## `ADV-10-ACC-03 — A3 implícito`
Falla si registrarse activa A3.

## `ADV-10-ACC-04 — Rechazar A3 bloquea identidad`
Falla si no aceptar A3 elimina/impide la cuenta no sensible.

## `ADV-10-ACC-05 — Revocación promete delete`
Falla si copy afirma borrado inmediato.

## `ADV-10-ACC-06 — Revocación finaliza vínculo`
Falla si UX presenta ese efecto.

## `ADV-10-ACC-07 — Login enumera`
Falla si diferencia usuario inexistente/credencial incorrecta.

## `ADV-10-ACC-08 — Recovery enumera`
Falla si confirma que existe cuenta.

## `ADV-10-ACC-09 — Selector eleva permisos`
Falla si cambiar contexto modifica autorización.

## `ADV-10-ACC-10 — Versión A3 futura autoaceptada`
Falla si una nueva versión se considera vigente sin acto.

---

# 20. Prototipos requeridos

## `PROTO-10-ACC-01 — Registro + A1/A2`
Debe probar separación de actos.

## `PROTO-10-ACC-02 — Continuidad post-registro`
Debe probar que “Cuenta creada” lleva a login, sin auto-login.

## `PROTO-10-ACC-03 — A3 aceptar / ahora no`
Debe probar fatiga vs claridad.

## `PROTO-10-ACC-04 — Privacidad A3`
Historial + revocación + reotorgamiento.

## `PROTO-10-ACC-05 — Login/recovery neutral`
Debe probar anti-enumeración.

---

# 21. Deudas downstream

- responsive fino → B10-10;
- accesibilidad del wizard → B10-10;
- evidencia ejecutable → 11A/11B;
- parámetros jurídicos de 08 permanecen fuera de 10;
- cierre de cuenta completo no se inventa si no está en alcance contractual P0.

---

# 22. DoD

No cerrar si:

- A1/A2/A3 colapsados;
- ACC-01 crea sesión en UX;
- A3 se otorga antes de SESSION;
- rechazo A3 se presenta como fallo de registro;
- revocación promete delete/finalización;
- login/recovery enumera;
- aparece endpoint nuevo;
- P1 recovery se contabiliza dentro de 122 P0;
- shell/contexto reemplaza PDP.
