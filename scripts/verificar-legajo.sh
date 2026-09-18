#!/usr/bin/env bash
# Verifica el legajo publicado contra docs/MANIFEST.sha256 (entrega de Dirección).
# - Toda entrada del manifiesto debe verificar byte a byte, salvo las listadas en docs/MANIFEST_NO_PUBLICADOS.txt.
# - Las rutas no publicadas no pueden estar en el repositorio.
# Uso: bash scripts/verificar-legajo.sh   (desde la raíz del repositorio)
set -euo pipefail

cd "$(dirname "$0")/../docs"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# tr quita CR: la lista puede haberse editado en Windows.
tr -d '\r' < MANIFEST_NO_PUBLICADOS.txt | grep -v -E '^[[:space:]]*(#|$)' > "$tmp/excluidas.txt" || true

while IFS= read -r ruta; do
  if [ -e "$ruta" ]; then
    echo "ERROR: $ruta figura como no publicada pero está en el repositorio" >&2
    exit 1
  fi
  if ! awk -v r="$ruta" '$2 == r { hallada = 1 } END { exit !hallada }' MANIFEST.sha256; then
    echo "ERROR: $ruta está en MANIFEST_NO_PUBLICADOS.txt pero no en el manifiesto" >&2
    exit 1
  fi
done < "$tmp/excluidas.txt"

awk 'NR == FNR { ex[$0] = 1; next } !($2 in ex)' "$tmp/excluidas.txt" MANIFEST.sha256 > "$tmp/publicadas.sha256"
sha256sum -c --quiet "$tmp/publicadas.sha256"

echo "legajo íntegro - $(wc -l < "$tmp/publicadas.sha256") de $(wc -l < MANIFEST.sha256) entradas verificadas byte a byte; $(wc -l < "$tmp/excluidas.txt") no publicada(s) por decisión de Dirección"
