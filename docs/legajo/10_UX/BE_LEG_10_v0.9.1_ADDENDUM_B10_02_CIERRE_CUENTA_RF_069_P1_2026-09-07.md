# BE-LEG-10 v0.9.1 — Addendum B10-02 · Cierre de cuenta P1 (RF-069)

> **Proyecto:** BE  
> **Documento:** 10  
> **Bloque afectado:** B10-02  
> **Fecha:** `2026-09-07`  
> **Estado:** `CORRECCIÓN MENOR POST-ENTREGA F · NO APROBADA`  
> **Hallazgo:** `H-10-G-RF069-01`  
> **Base B10-02:** `8ee0d7ce2358916ebd061a8f0fc5faca4b2a0b3f1f4ab667caf8670c4a751091`  
> **Implementación:** `NO AUTORIZADA`

# 0. Motivo

B10-02 dejó el cierre completo de cuenta como deuda al no identificar el contrato P1 ya existente.

La fuente correcta es:

```text
RF-069
→ UC-P27
→ API-ACC-P1-03
→ API-ACC-P1-04
```

No se altera el inventario de 122 P0.

# 1. Binding P1

```text
API-ACC-P1-03
POST /api/v1/me/account-closure-requests
Auth: SESSION_STEP_UP
Idempotency-Key: required

API-ACC-P1-04
GET /api/v1/me/account-closure-requests/current
```

# 2. Superficie UX

```text
Cuenta
→ Seguridad / Cuenta
→ Cerrar mi cuenta
```

No usar:

```text
DELETE /me
Eliminar todos mis datos
Borrar historia
```

# 3. Flujo

```text
Cuenta
→ Cerrar mi cuenta
→ explicación
→ confirmación

Cancelar
→ no se crea solicitud

Confirmar
→ step-up cuando corresponda
→ ACC-P1-03
→ solicitud registrada
→ ACC-P1-04 para estado actual
```

La variante `UC-P27 V03` se resuelve cancelando **antes** de confirmar; no se inventa endpoint de cancelación posterior.

# 4. Copy de confirmación

> **Cerrar mi cuenta**  
> El cierre impide nuevas sesiones y nuevas operaciones cuando se hace efectivo. Los vínculos activos se finalizan mediante eventos y la historia no se borra silenciosamente. La conservación o supresión posterior se aplica según la política de privacidad.

CTA:

> **Confirmar cierre**

Secundaria:

> **Cancelar**

# 5. Estado posterior

Después de registrar la solicitud:

> **Solicitud de cierre registrada.**

La UI puede consultar `API-ACC-P1-04`.

No inventar enum/etapas adicionales desde 10; representar únicamente la proyección que el contrato exponga.

# 6. Efectos UX obligatorios

Cuando el cierre es efectivo según 06/08:

```text
nuevas sesiones:
NO

sesiones actuales:
INVALIDADAS

vínculos/procesos:
finalizados según máquina canónica

historia:
NO borrada silenciosamente

retención/supresión:
08
```

# 7. Derechos

Solicitud de cierre de cuenta:

```text
≠ solicitud de supresión total inmediata
```

Si el titular pide supresión, se deriva al régimen de derechos/retención aplicable; no se promete delete total.

# 8. Prototipo histórico agregado

```text
PROTO-10-ACC-06 — Cierre de cuenta P1
```

Debe probar:

- step-up;
- confirmación;
- cancelación pre-submit;
- request idempotente;
- estado actual;
- copy sin delete;
- sesión posterior denegada cuando el cierre es efectivo.

# 9. Adversariales

`ADV-10-ACC-11` — cierre presentado como delete.  
`ADV-10-ACC-12` — cierre no invalida sesión efectiva.  
`ADV-10-ACC-13` — vínculos desaparecen sin eventos.  
`ADV-10-ACC-14` — UI inventa cancelación post-submit.  
`ADV-10-ACC-15` — ACC-P1-03/04 contabilizados como P0.

# 10. Estado de la deuda

```text
RF-069:
VERIFIED EN UX P1

DEUDA “SIN CONTRATO”:
ELIMINADA

122 P0:
SIN CAMBIO
```
