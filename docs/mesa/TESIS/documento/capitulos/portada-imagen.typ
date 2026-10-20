#import "../plantilla.typ": *

// Imagen representativa de la portada: capturas reales del website y de la APK de la versión documentada.
// Mientras no estén tomadas, se muestra el recuadro identificado (no se usa una imagen genérica ni generada).
#let capturas = (web: "../../imagenes/portada-website.png", apk: "../../imagenes/portada-apk.png")
#let hay-capturas = sys.inputs.at("capturas", default: "no") == "si"

#if hay-capturas {
  grid(
    columns: (1fr, 0.36fr),
    column-gutter: 10pt,
    align: bottom,
    box(stroke: 0.8pt + borde, radius: 4pt, clip: true, image(capturas.web, width: 100%)),
    box(stroke: 0.8pt + borde, radius: 10pt, clip: true, image(capturas.apk, width: 100%)),
  )
} else {
  box(width: 100%, height: 78mm, stroke: (paint: rgb(C.pendiente.trazo), thickness: 0.8pt, dash: "dashed"), radius: 3pt,
    align(center + horizon, text(size: 10pt, fill: rgb(C.pendiente.texto))[Imagen representativa: capturas del website y de la APK \ de la versión documentada (pendiente de captura)]))
}
