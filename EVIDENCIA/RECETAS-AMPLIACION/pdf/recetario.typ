// El recetario de las 50 recetas nuevas, con la vista de las 66 (encargo nocturno de Dirección del 2026-10-28, §12).
// Lee datos/recetario.json, que arma herramientas/armar-entrega.mjs. Se compila con herramientas/pdf.mjs.

#let d = json("../datos/recetario.json")

#let tinta = rgb("#0A1F44")
#let suave = rgb("#52627A")
#let linea = rgb("#D6DEE8")
#let fondo = rgb("#F4F7FB")
#let verde = rgb("#15803D")
#let verde-claro = rgb("#E8F5EC")
#let ambar = rgb("#9A3412")
#let ambar-claro = rgb("#FFF4E5")

#set document(title: "Recetario de BE · 50 recetas nuevas", author: "BE")
#set text(font: "Inter", size: 9.5pt, lang: "es", region: "AR", fill: tinta)
#set par(leading: 0.62em, spacing: 0.9em)
#set page(
  paper: "a4",
  margin: (x: 16mm, top: 15mm, bottom: 17mm),
  footer: context {
    set text(size: 7.5pt, fill: suave)
    grid(
      columns: (1fr, auto),
      [Recetario de BE · ampliación del 2026-10-28 · la composición es una estimación del catálogo, no una prescripción],
      [#counter(page).display() de #counter(page).final().first()],
    )
  },
)

#let chip(texto, tinta: verde, fondo: verde-claro) = box(fill: fondo, inset: (x: 5pt, y: 2.5pt), radius: 6pt, baseline: 2pt, text(size: 8pt, weight: 600, fill: tinta, texto))
#let caja(titulo, cuerpo, fill: fondo) = block(width: 100%, fill: fill, inset: 9pt, radius: 4pt, stroke: 0.5pt + linea)[
  #text(weight: 700, size: 9.5pt, titulo)
  #v(2pt)
  #cuerpo
]

// ─── Portada ─────────────────────────────────────────────────────────────────────────────────────

#v(8mm)
#text(size: 24pt, weight: 700)[Recetario de BE]
#v(-4pt)
#text(size: 14pt, weight: 500, fill: suave)[50 recetas nuevas de cocina familiar argentina, y la vista de las 66]
#v(6mm)

#grid(
  columns: (1fr, 1fr),
  gutter: 10pt,
  caja([Qué es])[
    Una *selección editorial* de comida reconocible para personas que entrenan: platos con una proteína identificable, verduras y legumbres, y las cantidades de aceite, queso, salsas y azúcar dichas. Se suman a las 16 recetas originales: *66 en total*. No es un ranking de lo más consumido.
  ],
  caja([Cómo se calculó])[
    Cada ingrediente es un alimento del catálogo de BE (USDA FoodData Central · SR Legacy), pesado en gramos en su estado: crudo, cocido o como se compra. La composición suma gramos por el valor cada 100 g. Por porción, es el total dividido por las porciones.
  ],
)
#v(8pt)
#caja([Los cuatro estados de la composición, por separado])[
  #table(
    columns: (44mm, 1fr),
    stroke: none,
    column-gutter: 6pt,
    inset: (x: 0pt, y: 3pt),
    [*Calculado por el sistema*], [Lo comprueba la prueba de integración: API-REC-07 (el cálculo de BE) da lo mismo que este recetario.],
    [*Revisado por el agente*], [Sí, el 2026-10-28: formulación, estados, cantidades, decisiones y composición.],
    [*Cocinado y pesado*], [#text(weight: 700, fill: ambar)[No.] Ninguna receta se cocinó ni se pesó.],
    [*Validado por una persona*], [#text(weight: 700, fill: ambar)[No.] Falta la revisión de Dirección o de un profesional.],
  )
]
#v(8pt)
#caja(fill: ambar-claro)[Fotos: #d.conFoto de 66][
  La sesión que preparó este recetario no tenía con qué generar imágenes. Cada receta tiene su prompt y su nombre de archivo en el paquete de generación (`PAQUETE-DE-GENERACION.md`). Un prompt no es una foto: hasta que haya un archivo, la receta dice «Falta la foto».
]
#v(8pt)
#for r in d.reemplazos [
  #caja([Un reemplazo de la lista del encargo])[
    *#r.codigo:* «#r.propuesta» → «#r.reemplazo». #r.motivo
  ]
]

// ─── La vista de las 66 ──────────────────────────────────────────────────────────────────────────

#pagebreak()
#text(size: 15pt, weight: 700)[La vista de las 66]
#v(2pt)
#text(size: 8.5pt, fill: suave)[Las 16 originales (R001 a R016, del manifiesto congelado) y las 50 nuevas (R017 a R066). La familia de las originales es editorial: su manifiesto no la tiene. kcal y proteínas, por porción.]
#v(4pt)
#set text(size: 8pt)
#table(
  columns: (auto, 1fr, auto, auto, auto, auto, auto),
  stroke: (x, y) => if y == 0 { (bottom: 0.8pt + tinta) } else { (bottom: 0.4pt + linea) },
  inset: (x: 4pt, y: 3.2pt),
  align: (x, y) => if x >= 4 and x <= 5 { right } else { left },
  table.header([*Código*], [*Receta*], [*Familia*], [*Origen*], [*Porc.*], [*kcal · prot.*], [*Foto*]),
  ..d.vista.map(r => (
    text(font: "JetBrains Mono", size: 7.5pt, r.codigo),
    r.nombre,
    text(size: 7.2pt, fill: suave, r.familia),
    if r.origen == "ORIGINAL" [original] else [nueva],
    str(r.porciones),
    [#r.kcal · #r.proteinas g],
    text(size: 7.2pt, fill: if r.foto == "Falta la foto" { ambar } else { verde }, r.foto),
  )).flatten(),
)
#set text(size: 9.5pt)

// ─── Las 50 recetas ──────────────────────────────────────────────────────────────────────────────

#for r in d.recetas [
  #pagebreak()
  #grid(
    columns: (auto, 1fr),
    gutter: 8pt,
    align: horizon,
    box(fill: verde, inset: (x: 6pt, y: 4pt), radius: 3pt, text(font: "JetBrains Mono", weight: 700, size: 10pt, fill: white, r.codigo)),
    text(size: 16pt, weight: 700, r.nombre),
  )
  #v(1pt)
  #text(size: 8.5pt, fill: suave)[#r.familia · #r.momento · #r.rendimiento *Porción:* #lower(r.porcion.first())#r.porcion.slice(r.porcion.first().len())]
  #v(1pt)
  #text(style: "italic")[#r.motivo]
  #if r.distingue != none [ #v(-2pt) #text(size: 8.5pt, fill: suave)[#r.distingue] ]
  #if r.nota != none [ #v(-2pt) #text(size: 8.5pt, weight: 600, fill: ambar)[Ojo: #r.nota] ]
  #v(3pt)
  #grid(
    columns: (1.55fr, 1fr),
    gutter: 10pt,
    {
      set text(size: 8.3pt)
      let filas = ()
      let parte-anterior = none
      for i in r.ingredientes {
        if i.parte != parte-anterior {
          filas.push(table.cell(colspan: 3, inset: (top: 5pt, bottom: 2pt, x: 3pt), text(weight: 700, fill: verde, size: 8pt, upper(i.parte))))
          parte-anterior = i.parte
        }
        filas.push(align(right, i.cantidad))
        filas.push(i.nombre)
        filas.push(text(size: 7.5pt, fill: suave, i.estado))
      }
      table(
        columns: (auto, 1fr, auto),
        stroke: (x, y) => (bottom: 0.3pt + linea),
        inset: (x: 3pt, y: 2.4pt),
        ..filas,
      )
    },
    {
      block(width: 100%, fill: verde-claro, inset: 8pt, radius: 4pt)[
        #text(weight: 700)[Por porción] #h(1fr) #text(size: 8pt, fill: suave)[1 de #r.porciones]
        #v(2pt)
        #set text(size: 8.6pt)
        #table(
          columns: (1fr, auto),
          stroke: none,
          inset: (x: 0pt, y: 1.8pt),
          [Energía], [*#r.porPorcion.kcal kcal*],
          [Proteínas], [*#r.porPorcion.proteinas g*],
          [Carbohidratos], [#r.porPorcion.carbohidratos g],
          [Grasas], [#r.porPorcion.grasas g],
          [Fibra], [#r.porPorcion.fibra g],
        )
        #v(2pt)
        #text(size: 7.5pt, fill: suave)[La receta entera: #r.total.kcal kcal, #r.total.proteinas g de proteínas, #r.total.carbohidratos g de carbohidratos, #r.total.grasas g de grasas y #r.total.fibra g de fibra.]
      ]
      v(4pt)
      set text(size: 8pt)
      [*Equipo:* #r.equipo.]
      v(2pt)
      [*Tiempos orientativos:* #r.tiempos.]
      v(2pt)
      [*Foto:* #text(font: "JetBrains Mono", size: 7.5pt, r.foto.archivo) · #text(fill: if r.foto.estado == "Falta la foto" { ambar } else { verde }, weight: 600, r.foto.estado).]
    },
  )
  #v(4pt)
  #text(weight: 700, size: 10pt)[Preparación]
  #v(-2pt)
  #set text(size: 9pt)
  #enum(..r.pasos.map(p => [#p]))
  #set text(size: 9.5pt)
  #if r.practicas.len() > 0 [
    #text(size: 8.5pt)[*Para tener en cuenta:* #r.practicas.join(" ")]
  ]
  #if r.notas.len() > 0 [
    #v(-2pt)
    #set text(size: 7.8pt, fill: suave)
    #for n in r.notas [- #n]
  ]
]
