// Plantilla del documento de tesis. Estilo y datos de versión salen de archivos separados del contenido:
//   ../estilo/tokens.json  (colores, tipografías, tamaños; los mismos que usan las láminas)
//   ../datos/version.json  (commit, fecha y ambiente de referencia)
// La variante (pública o de evaluación) llega por `sys.inputs.variante`; los datos privados (logotipo de la escuela,
// integrantes y correos, credenciales) solo existen en la compilación de evaluación, fuera del repositorio.

#let tokens = json("../estilo/tokens.json")
#let version = json("../datos/version.json")
#let revision-laminas = json("../laminas/revision.json")
#let C = tokens.color
#let tinta = rgb(C.tinta)
#let tinta-suave = rgb(C.tinta_suave)
#let azul = rgb(C.sistema.trazo)
#let azul-claro = rgb(C.sistema.relleno)
#let cabecera-tabla = rgb(C.sistema.cabecera)
#let borde = rgb(C.borde_suave)
#let fondo-suave = rgb(C.fondo_suave)
#let acento = rgb(C.acento)
#let acento-oscuro = rgb(C.acento_oscuro)

#let variante = sys.inputs.at("variante", default: "publica")
#let es-evaluacion = variante == "evaluacion"
#let privado = if es-evaluacion { json(sys.inputs.at("privado")) } else { none }

// ─── Piezas reutilizables ────────────────────────────────────────────────────────────────────────────────────
/// Campo que todavía no tiene dato: se ve como pendiente, nunca como un valor plausible.
#let pendiente(texto) = box(
  inset: (x: 4pt, y: 1.5pt),
  radius: 2pt,
  fill: rgb(C.estado.pendiente.fondo),
  text(fill: rgb(C.estado.pendiente.texto), weight: 500, size: 1em, "[" + texto + "]"),
)

/// Marca de estado (el significado está en el texto, no solo en el color).
#let estado(clave) = {
  let nombres = (
    verificado: "Verificado en test",
    implementado: "Implementado",
    parcial: "Parcial",
    pendiente: "Pendiente",
    fuera: "Fuera de alcance",
    defecto: "Defecto abierto",
    propuesta: "Propuesta",
    diferido: "Diferido al cierre",
  )
  let paleta = C.estado.at(if clave in C.estado { clave } else if clave == "propuesta" { "pendiente" } else { "fuera" })
  box(
    inset: (x: 4.5pt, y: 2pt),
    radius: 7pt,
    fill: rgb(paleta.fondo),
    text(fill: rgb(paleta.texto), weight: 600, size: 10pt, nombres.at(clave, default: clave)),
  )
}

/// Identificador canónico (RF-021, UC-P09, API-NUT-13…).
#let id(t) = text(font: "JetBrains Mono", size: 1em, weight: 500, fill: tinta, t)

/// Resultado de un caso de prueba (como `estado`: el texto dice el resultado y el color acompaña).
#let resultado(clave) = {
  let nombres = (
    cubierto: "Pasa en la CI",
    pasa: "Pasa",
    parcial: "Pasa en parte",
    en-parte: "Pasa en parte",
    no-ejecutable: "No ejecutable",
    sin-ejecutar: "Sin ejecutar",
  )
  let tono = if clave in ("cubierto", "pasa") { "verificado" } else if clave in ("parcial", "en-parte") { "parcial" } else if clave == "sin-ejecutar" { "pendiente" } else { "fuera" }
  let paleta = C.estado.at(tono)
  box(
    inset: (x: 4.5pt, y: 2pt),
    radius: 7pt,
    fill: rgb(paleta.fondo),
    text(fill: rgb(paleta.texto), weight: 600, size: 10pt, nombres.at(clave, default: clave)),
  )
}

/// Recuadro de lectura: aclaraciones, decisiones o advertencias.
#let recuadro(titulo: none, tipo: "nota", cuerpo) = {
  let colores = (
    nota: (fondo: fondo-suave, borde: borde, titulo: tinta),
    pendiente: (fondo: rgb(C.pendiente.relleno), borde: rgb(C.pendiente.trazo), titulo: rgb(C.pendiente.texto)),
    decision: (fondo: azul-claro, borde: azul, titulo: tinta),
  )
  let c = colores.at(tipo)
  block(
    width: 100%,
    inset: (x: 10pt, y: 8pt),
    radius: 3pt,
    fill: c.fondo,
    stroke: (left: 2.5pt + c.borde),
    breakable: true,
    {
      if titulo != none { text(weight: 600, fill: c.titulo, titulo); linebreak() }
      cuerpo
    },
  )
}

/// Lámina del motor (laminas/generado/<id>.svg) como figura numerada, a su tamaño de diseño (1 unidad = 1 pt).
#let lamina(id-lamina, titulo, alcance: none, fuente: none, etiqueta: none) = {
  let r = revision-laminas.at(id-lamina)
  let f = figure(
    image("../laminas/generado/" + id-lamina + ".svg", width: r.ancho * 1pt),
    kind: image,
    caption: figure.caption(position: bottom, {
      text(weight: 600, titulo)
      if alcance != none { [. ] + alcance }
      linebreak()
      text(fill: tinta-suave, size: 10pt, "Lámina " + id-lamina + (if fuente != none { " · Fuente: " + fuente } else { "" }) + " · Versión " + version.commitCorto)
    }),
  )
  if etiqueta != none [#f #label(etiqueta)] else { f }
}

/// Página apaisada para una lámina ancha (728 pt). El texto que la explica va en la página anterior o siguiente.
#let pagina-apaisada(cuerpo) = page(flipped: true, margin: (top: 20mm, bottom: 16mm, x: 16mm), cuerpo)

// ─── Plantilla ───────────────────────────────────────────────────────────────────────────────────────────────
#let tesis(cuerpo) = {
  set document(
    title: version.documento.titulo + " — " + version.documento.subtitulo,
    author: if es-evaluacion { privado.integrantes.map(i => i.nombre) } else { "Elián Bufi" },
    keywords: ("BE", "tesis", "Analista de Sistemas", "Escuela Da Vinci"),
  )
  set text(font: "Inter", size: tokens.tipografia.documento.cuerpo * 1pt, fill: tinta, lang: "es", region: "AR", hyphenate: true)
  set par(justify: true, leading: 0.68em, spacing: 1.05em, first-line-indent: 0pt)
  set page(
    paper: "a4",
    margin: (top: 26mm, bottom: 22mm, left: 22mm, right: 18mm),
    header: context {
      if counter(page).get().first() > 1 {
        set text(size: 10pt, fill: tinta-suave)
        let pagina = here().page()
        let capitulos = query(heading.where(level: 1)).filter(h => h.location().page() <= pagina)
        let actual = if capitulos.len() > 0 { capitulos.last() } else { none }
        grid(
          columns: (1fr, auto),
          text(weight: 600, fill: tinta, "BE") + text(" · Plataforma integrada de inteligencia en salud"),
          if actual != none {
            (if actual.numbering != none { numbering(actual.numbering, ..counter(heading).at(actual.location())) + " " } else { "" }) + actual.body
          },
        )
        v(-4pt)
        line(length: 100%, stroke: 0.6pt + borde)
      }
    },
    footer: context {
      if counter(page).get().first() > 1 {
        set text(size: 10pt, fill: tinta-suave)
        line(length: 100%, stroke: 0.6pt + borde)
        v(-4pt)
        grid(
          columns: (1fr, auto),
          [Trabajo final · Analista de Sistemas · Escuela Da Vinci · versión #version.documento.version.split(" ").first()#if not es-evaluacion [ · copia pública]],
          [Página #counter(page).display() de #counter(page).final().first()],
        )
      }
    },
  )
  set heading(numbering: "1.1")
  show heading: set text(fill: tinta)
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)
    v(6pt)
    block(below: 14pt, {
      if it.numbering != none {
        text(size: 11pt, weight: 600, fill: acento-oscuro, "Apartado " + numbering(it.numbering, ..counter(heading).get()))
        linebreak()
      }
      text(size: tokens.tipografia.documento.h1 * 1pt, weight: 600, it.body)
      v(-2pt)
      line(length: 40pt, stroke: 2.5pt + acento)
    })
  }
  show heading.where(level: 2): it => block(above: 18pt, below: 9pt, text(size: tokens.tipografia.documento.h2 * 1pt, weight: 600, {
    if it.numbering != none { text(fill: azul, numbering(it.numbering, ..counter(heading).get()) + "  ") }
    it.body
  }))
  show heading.where(level: 3): it => block(above: 14pt, below: 7pt, text(size: tokens.tipografia.documento.h3 * 1pt, weight: 600, it.body))
  set figure(numbering: (..n) => numbering("1.1", counter(heading).get().first(), ..n))
  set figure.caption(separator: [ — ])
  show figure.caption: set text(size: 10pt)
  show figure.caption: set par(justify: false)
  show figure.where(kind: table): set figure.caption(position: top)
  set table(
    stroke: (x, y) => (top: if y == 0 { none } else { 0.5pt + borde }, bottom: 0.5pt + borde),
    inset: (x: 5pt, y: 4.5pt),
    fill: (x, y) => if y == 0 { cabecera-tabla },
    // Dentro de una figura, el texto de las celdas heredaría el centrado: va a la izquierda y arriba.
    align: left + top,
  )
  // Una tabla larga dentro de una figura puede seguir en la página siguiente.
  show figure.where(kind: table): set block(breakable: true)
  show table: set text(size: tokens.tipografia.documento.tabla * 1pt)
  show table: set par(justify: false)
  show table.cell.where(y: 0): set text(weight: 600, hyphenate: false)
  show raw: set text(font: "JetBrains Mono", size: 10pt)
  show link: set text(fill: azul)
  set list(indent: 4pt, body-indent: 6pt)
  set enum(indent: 4pt, body-indent: 6pt)
  set outline(indent: auto)
  show outline.entry.where(level: 1): it => {
    v(6pt, weak: true)
    strong(it)
  }
  cuerpo
}
