# Ensayo de rollback y recovery — ambiente `test`

> Condición de ACTA-DIR-034 v1.0 §12: «ejecutar el ensayo de rollback después del primer merge de WP-02 y antes de cerrarlo». Procedimiento en `docs/DESPLIEGUE.md` §Rollback (07 §39). Solo datos sintéticos.

## Parte 1 — Merge defectuoso: `git revert -m 1` (ejecutada 2026-09-19)

Simula un merge que hay que deshacer. Se usó un cambio inocuo en `apps/api/src/main.ts` (un comentario), así que el merge pasa por el `buildFilter` de `be-api` y produce un deploy real y observable en `/health`.

| Paso | Commit en `main` | CI de `main` | Deploy observado en `/health/ready` |
|---|---|---|---|
| Estado inicial | `c09bfa0` (WP-02 + DL-030) | — | `c09bfa0` · construido 01:27:40 |
| Merge del cambio inocuo (PR #9) | `4776fc5` (01:29:12) | verde 01:30:59 | `4776fc5` · construido 01:31:29 · base y migraciones OK |
| `git revert -m 1 4776fc5` en la rama `ensayo-rollback-revert` → PR #10 → CI verde → merge | `23c9997` (01:34:21) | verde 01:36:09 | `23c9997` · construido 01:36:32 · base y migraciones OK |
| Verificación | `git diff c09bfa0 23c9997 -- apps packages prisma` = **vacío** | — | el código desplegado vuelve exactamente al estado previo |

- Sin `push --force`, `reset --hard` ni `commit --amend` sobre historia publicada. El revert es un commit nuevo con PR y CI (`historia-main.txt`).
- Cada deploy ocurrió **después** de que la CI de ese commit estuvo en verde (`autoDeployTrigger: checksPass`). Ninguno de estos merges tocó `render.yaml` (DL-008).
- Registro completo, con hora UTC y respuesta de `/health/ready` en cada paso: `ensayo-git-revert.log`. Script: `ensayo-git-revert.sh`.

## Parte 2 — Rollback de aplicación en Render (pendiente de Dirección)

Render no expone el rollback desde el repositorio: se hace en el dashboard. Pasos:

1. Render → `be-api` → **Events** → el deploy anterior al actual (el de `4776fc5`) → **Rollback**.
2. Verificar: `curl -s https://be-api-hndp.onrender.com/health/ready` responde 200, con `version.commit` = `4776fc5…` y `migraciones: OK`. El artefacto anterior acepta la base tal como está (expand→contract, 07 §39).
3. Volver: Render → `be-api` → **Manual Deploy → Deploy latest commit**. Si Render desactivó el auto-deploy al hacer el rollback, reactivarlo en **Settings → Auto-Deploy → After CI Checks Pass**.
4. Verificar: `/health/ready` vuelve a `23c9997…` (o al último commit de `main`).

Resultado: *(se completa con las horas y respuestas observadas)*.
