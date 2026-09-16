# Delta — MENOR-01 Entrega I

## Base

| Artefacto | SHA-256 |
|---|---|
| Gate v0.1 | `f2890840444cedf1afeb50e82963b5553efa9e199715d3f6fe2e1c847f81680b` |
| Checklist original | `bf930bc3de2ee6fa3dc60476e061198c9b76edf0c55a3da0793633449a64d18d` |

## Corrección

### Gate v0.1.1

SHA-256 `2cbf60700fbfd767390f7e42e769de12f189ed084830796638b803f2cc52ea0f`

Agrega:

```text
SECRETS / CONFIG:
TO VERIFY

ROLLBACK STRATEGY:
TO DECIDE / VERIFY

DEPLOY RECOVERY:
TO DECIDE / VERIFY

MIGRATION FAILURE PROCEDURE:
TO DECIDE / VERIFY

ROLLBACK REHEARSAL:
TO PLAN
```

y reglas explícitas contra reescritura destructiva de historia compartida.

### Checklist v0.1.1

SHA-256 `2acfbcbc44b0df7765c4d9f27575d21a154357bae157494dcfa573b97303c225`

Agrega sección completa de rollback/recovery y refuerza secrets/config.

## Sin cambios

```text
BE-LEG-01:
SIN CAMBIO

11A:
SIN CAMBIO

12:
SIN CAMBIO

implementación:
NO

Git:
NO
```
