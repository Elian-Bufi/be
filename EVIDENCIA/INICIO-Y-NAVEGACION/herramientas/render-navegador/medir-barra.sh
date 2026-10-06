#!/usr/bin/env bash
# Mide la barra en el render: filas, alto de la cápsula y tamaño efectivo de cada etiqueta, por ancho y escala de letra.
# Cada etiqueta sale como «texto=tamaño en px/proporción» (1,00: sin achicar). Antes: node construir.mjs.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
U="file:///$AQUI/salida/telefono.html"
SALIDA="${1:-$AQUI/salida}"
export EXPRESION='(() => {
  const docs = [document, ...[...document.querySelectorAll("iframe")].map((f) => f.contentDocument).filter(Boolean)];
  const d = docs.find((x) => x.querySelector("[role=tablist]")) || document;
  const barra = d.querySelector("[role=tablist]");
  const etiquetas = [...barra.querySelectorAll("[data-ajuste]")].map((e) => e.textContent + "=" + parseFloat(getComputedStyle(e).fontSize).toFixed(1) + "px/" + e.dataset.ajuste + (e.dataset.cortado === "si" ? "/CORTADA" : ""));
  return JSON.stringify({ filas: barra.children.length, alto: Math.round(barra.getBoundingClientRect().height), etiquetas });
})()'
for ancho in 320 360 390 412; do
  for escala in 1 1.15 1.3 1.5 1.8 2; do
    r=$(node "$AQUI/cdp.mjs" "$SALIDA/barra-$ancho-$escala.png" "$ancho" 760 "$U?escena=inicio&tema=azul-noche&ancho=$ancho&alto=760&escala=$escala" 5000 | sed 's/^[^·]*· //')
    echo "$ancho $escala $r"
  done
done
