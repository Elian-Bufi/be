#import "../plantilla.typ": *

// Imagen representativa de la portada: una captura real del website en el ambiente de test, en la versión documentada
// (herramientas/capturar-website.mjs, 2026-10-20). La APK no tiene todavía una captura nativa de esta versión: cuando
// la haya (imagenes/portada-apk.png), se compila con --input apk=si y se suma al lado.
#let ver = json("../../datos/version.json")
#let con-apk = sys.inputs.at("apk", default: "no") == "si"

#let web = box(stroke: 0.8pt + borde, radius: 4pt, clip: true, image("../imagenes/portada-website.png", width: 100%))
#if con-apk {
  grid(
    columns: (1fr, 0.36fr),
    column-gutter: 10pt,
    align: bottom,
    web,
    box(stroke: 0.8pt + borde, radius: 10pt, clip: true, image("../imagenes/portada-apk.png", width: 100%)),
  )
} else { web }
#v(3pt)
#text(size: 10pt, fill: tinta-suave)[La ficha de una persona en el espacio profesional: objetivo y plan vigentes, la revisión acordada, las tomas y los indicadores del período. Ambiente de test, versión #ver.commitCorto, #ver.fecha. Persona y datos sintéticos.]
