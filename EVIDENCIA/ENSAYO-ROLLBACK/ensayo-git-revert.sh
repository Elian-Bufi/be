#!/usr/bin/env bash
# Ensayo de rollback por git (ACTA-DIR-034 §12): merge inocuo → deploy → git revert -m 1 → deploy.
# Registra cada paso con hora UTC y la respuesta de /health/ready.
set -euo pipefail
LOG="/c/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/2fb34a82-d933-4ad8-b1d9-97699fac5019/scratchpad/ensayo-revert.log"
WT=/c/Users/bufim/be-wt-main
API=https://be-api-hndp.onrender.com/health/ready
: > "$LOG"
log() { echo "$(date -u +%FT%TZ) $*" | tee -a "$LOG"; }
salud() { curl -s -m 30 "$API"; }
esperar_deploy() { # $1 = sha esperado
  for i in $(seq 1 90); do
    c=$(salud | sed -n 's/.*"commit":"\([0-9a-f]*\)".*/\1/p')
    if [ "$c" = "$1" ]; then log "deploy observado: $(salud)"; return 0; fi
    sleep 20
  done
  log "TIMEOUT esperando deploy de $1"; return 1
}
esperar_ci_main() { # $1 = sha
  sleep 15
  rid=$(gh run list --branch main --limit 5 --json databaseId,headSha --jq "[.[] | select(.headSha==\"$1\")][0].databaseId")
  gh run watch "$rid" --exit-status --interval 20 > /dev/null 2>&1 && log "CI main $rid verde para ${1:0:7}" || { log "CI main $rid FALLÓ"; return 1; }
  gh run view "$rid" --json jobs --jq '.jobs[] | "  \(.name): \(.conclusion) \(.completedAt)"' >> "$LOG"
}

log "ESTADO INICIAL: $(salud)"
ANTES=$(git -C "$WT" rev-parse origin/main)
log "main antes del ensayo: $ANTES"

# 1. Merge inocuo (PR #9)
gh pr checks 9 --watch --interval 20 > /dev/null 2>&1 && log "PR #9 checks verdes"
cd "$WT" && git fetch -q origin && git checkout -q --detach origin/main
git merge -q --no-ff origin/ensayo-rollback-cambio -m "Ensayo de rollback — cambio inocuo a revertir (#9)

Merge local (no web) para que el commit se firme con el email noreply del repositorio.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
MERGE=$(git rev-parse HEAD)
git push -q origin HEAD:main
log "merge inocuo publicado en main: $MERGE ($(git diff --name-only HEAD~1 HEAD | tr '\n' ' '))"
esperar_ci_main "$MERGE"
esperar_deploy "$MERGE"

# 2. Revert del merge en una rama nueva → PR → CI → merge
git switch -q -c ensayo-rollback-revert
git revert --no-edit -m 1 "$MERGE" > /dev/null
git commit -q --amend -m "revert(ensayo-rollback): git revert -m 1 del merge ${MERGE:0:7}

Segundo paso del ensayo de rollback (ACTA-DIR-034 §12; docs/DESPLIEGUE.md «Merge defectuoso»):
revertir un merge publicado con git revert -m 1, en una rama nueva, con PR y CI. Sin push --force,
reset --hard ni commit --amend sobre historia publicada.

This reverts commit $MERGE.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
REVERT=$(git rev-parse HEAD)
git push -q -u origin ensayo-rollback-revert
log "revert creado: $REVERT (git revert -m 1 $MERGE)"
PR=$(gh pr create --base main --head ensayo-rollback-revert --title "Ensayo de rollback — git revert -m 1 del merge inocuo" --body "Segundo paso del ensayo (ACTA-DIR-034 §12): \`git revert -m 1 ${MERGE:0:7}\` en una rama nueva, con PR y CI. Evidencia en \`EVIDENCIA/ENSAYO-ROLLBACK/\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)" | tail -1)
log "PR del revert: $PR"
sleep 20
gh pr checks "${PR##*/}" --watch --interval 20 > /dev/null 2>&1 && log "PR del revert: checks verdes"
git checkout -q --detach origin/main && git fetch -q origin && git checkout -q --detach origin/main
git merge -q --no-ff origin/ensayo-rollback-revert -m "Ensayo de rollback — git revert -m 1 del merge inocuo (#${PR##*/})

Merge local (no web) para que el commit se firme con el email noreply del repositorio.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
FINAL=$(git rev-parse HEAD)
git push -q origin HEAD:main
log "merge del revert publicado en main: $FINAL"
esperar_ci_main "$FINAL"
esperar_deploy "$FINAL"

# 3. Verificación: el código vuelve exactamente al estado previo al ensayo
DIFF=$(git diff --stat "$ANTES" "$FINAL" -- apps packages prisma | wc -l)
log "diferencia de código entre $ANTES (antes) y $FINAL (después): $DIFF líneas de diff"
log "ESTADO FINAL: $(salud)"
log "ENSAYO GIT COMPLETO"
