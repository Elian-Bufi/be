// La hoja de contacto de las fotos de las 66 recetas (encargo nocturno de Dirección del 2026-10-28, §12): seis por página,
// con el código y el nombre. Una receta sin foto muestra «Falta la foto»: su lugar no se llena con otra imagen.
// Lee datos/contacto.json, que arma herramientas/armar-entrega.mjs; las miniaturas las copia herramientas/pdf.mjs a img/.

#let d = json("../datos/contacto.json")

#let tinta = rgb("#0A1F44")
#let suave = rgb("#52627A")
#let linea = rgb("#C9D3DF")
#let fondo = rgb("#F4F7FB")
#let ambar = rgb("#9A3412")
#let verde = rgb("#15803D")

#set document(title: "Fotos de las recetas de BE · hoja de contacto", author: "BE")
#set text(font: "Inter", size: 9pt, lang: "es", region: "AR", fill: tinta)
#set page(
  paper: "a4",
  flipped: true,
  margin: (x: 14mm, top: 22mm, bottom: 14mm),
  header: context {
    set text(size: 9pt)
    grid(
      columns: (1fr, auto),
      [*Fotos de las recetas de BE* · hoja de contacto · #d.conFoto de #d.recetas.len() con foto],
      text(fill: suave)[página #counter(page).display() de #counter(page).final().first()],
    )
    v(-4pt)
    line(length: 100%, stroke: 0.6pt + linea)
  },
)

#let celda(r) = block(width: 100%, breakable: false)[
  #let marco = 100%
  #if r.imagen != none {
    block(width: 100%, height: 64mm, clip: true, radius: 3pt, stroke: 0.5pt + linea, image(r.imagen, width: 100%, height: 64mm, fit: "cover"))
  } else {
    block(width: 100%, height: 64mm, radius: 3pt, fill: fondo, stroke: (paint: linea, thickness: 1pt, dash: "dashed"))[
      #align(center + horizon)[
        #text(size: 13pt, weight: 700, fill: ambar)[Falta la foto]
        #v(-2pt)
        #text(size: 8pt, fill: suave)[Su prompt está en el paquete de generación]
      ]
    ]
  }
  #v(3pt)
  #text(font: "JetBrains Mono", weight: 700, size: 9pt)[#r.codigo] #h(4pt) #text(weight: 600, size: 9.5pt)[#r.nombre]
  #v(-3pt)
  #text(size: 7.8pt, fill: suave)[#r.origen · #r.familia · #text(fill: if r.imagen == none { ambar } else { verde })[#r.estado]]
]

#grid(
  columns: (1fr, 1fr, 1fr),
  column-gutter: 8mm,
  row-gutter: 7mm,
  ..d.recetas.map(celda),
)
