// Plantilla común de la guía central y del cuaderno de datos: A4 apaisado, una pregunta por lámina, tarjetas de
// concepto y el pie con el commit de referencia. Los colores y la tipografía salen de estilo/tokens.json (los mismos de
// las láminas de la tesis); un color se cambia ahí y en ningún otro lado.

#let T = json("../estilo/tokens.json")
#let C = T.color
#let version = json("../datos/version.json")

#let tinta = rgb(C.tinta)
#let tinta-suave = rgb(C.tinta_suave)
#let linea = rgb(C.linea)
#let borde = rgb(C.borde_suave)
#let fondo = rgb(C.fondo_suave)
#let azul = rgb(C.sistema.trazo)
#let azul-claro = rgb(C.sistema.relleno)
#let azul-cabecera = rgb(C.sistema.cabecera)
#let acento = rgb(C.acento)
#let acento-oscuro = rgb(C.acento_oscuro)
#let pendiente-trazo = rgb(C.pendiente.trazo)
#let pendiente-fondo = rgb(C.pendiente.relleno)
#let pendiente-texto = rgb(C.pendiente.texto)

// Los colores de los módulos: los mismos en todas las láminas y tablas de los dos documentos.
#let MODULOS = (
  identidad: (nombre: "Identidad, sesiones y Administración", color: rgb("#1453C9"), fondo: rgb("#EAF1FD")),
  vinculo: (nombre: "Vínculos y consentimientos", color: rgb("#0E7490"), fondo: rgb("#E7F9FD")),
  nutricion: (nombre: "Nutrición", color: rgb("#15803D"), fondo: rgb("#E8F5EC")),
  entrenamiento: (nombre: "Entrenamiento", color: rgb("#B45309"), fondo: rgb("#FFF7ED")),
  antropometria: (nombre: "Antropometría", color: rgb("#7C3AED"), fondo: rgb("#F3EEFE")),
  seguimiento: (nombre: "Objetivos, procesos y revisiones", color: rgb("#BE185D"), fondo: rgb("#FDEEF5")),
  plataforma: (nombre: "Auditoría, medios y plataforma", color: rgb("#475569"), fondo: rgb("#F1F5F9")),
)

// Los estados de una afirmación: siempre los mismos nombres y colores.
#let ESTADOS = (
  implementado: (texto: "Implementado", tinta: rgb(C.estado.implementado.texto), fondo: rgb(C.estado.implementado.fondo)),
  integrado: (texto: "Integrado", tinta: rgb("#0E7490"), fondo: rgb("#E7F9FD")),
  desplegado: (texto: "Desplegado", tinta: rgb("#1D4ED8"), fondo: rgb("#DBEAFE")),
  verificado: (texto: "Verificado", tinta: rgb(C.estado.verificado.texto), fondo: rgb(C.estado.verificado.fondo)),
  validado: (texto: "Validado por personas", tinta: rgb("#065F46"), fondo: rgb("#D1FAE5")),
  pendiente: (texto: "Pendiente", tinta: rgb(C.estado.pendiente.texto), fondo: rgb(C.estado.pendiente.fondo)),
  propuesto: (texto: "Propuesto", tinta: rgb(C.estado.parcial.texto), fondo: rgb(C.estado.parcial.fondo)),
  fuera: (texto: "Fuera de alcance", tinta: rgb(C.estado.fuera.texto), fondo: rgb(C.estado.fuera.fondo)),
)

#let estado(clave, texto: none) = {
  let e = ESTADOS.at(clave)
  box(fill: e.fondo, inset: (x: 5pt, y: 2.5pt), radius: 7pt, baseline: 2pt, text(size: 9pt, weight: 600, fill: e.tinta, if texto == none { e.texto } else { texto }))
}

#let modulo(clave) = {
  let m = MODULOS.at(clave)
  box(fill: m.fondo, stroke: 0.6pt + m.color, inset: (x: 5pt, y: 2.5pt), radius: 2pt, baseline: 2pt, text(size: 9pt, weight: 600, fill: m.color, m.nombre))
}

// El nivel de la lámina actual: lo usa el encabezado. NIVEL-ANTERIOR evita repetir el título de nivel en el índice.
#let nivel-actual = state("nivel", none)
#let NIVEL-ANTERIOR = state("nivel-anterior", none)
#let CONCEPTOS = counter("conceptos")

#let documento(titulo-corto: "", cuerpo) = {
  set document(author: "BE · Elián Bufi (Dirección)", title: titulo-corto)
  set page(
    paper: "a4",
    flipped: true,
    margin: (x: 15mm, top: 17mm, bottom: 13mm),
    fill: white,
    header: context {
      let n = nivel-actual.get()
      if counter(page).get().first() > 1 {
        set text(size: 9pt, fill: tinta-suave)
        grid(
          columns: (1fr, auto),
          align: (left, right),
          if n != none { n } else { titulo-corto },
          titulo-corto,
        )
        v(-4pt)
        line(length: 100%, stroke: 0.6pt + borde)
      }
    },
    footer: context {
      set text(size: 9pt, fill: tinta-suave)
      grid(
        columns: (1fr, auto),
        align: (left, right),
        [Commit de referencia #raw(version.commitCorto) (`main`, #version.fecha) · versión del documento #version.documento.version],
        counter(page).display("1"),
      )
    },
  )
  set text(font: "Inter", size: 10.5pt, fill: tinta, lang: "es", region: "AR", hyphenate: false)
  set par(leading: 0.62em, spacing: 0.9em, justify: false)
  show raw: set text(font: "JetBrains Mono", size: 9pt, ligatures: false, features: (calt: 0))
  show raw.where(block: true): it => block(fill: fondo, stroke: 0.6pt + borde, inset: 7pt, radius: 3pt, width: 100%, it)
  show heading.where(level: 1): it => none
  show heading.where(level: 2): it => text(size: 18pt, weight: 700, fill: tinta, it.body)
  show heading.where(level: 3): set text(size: 13pt, weight: 650)
  show strong: set text(weight: 650)
  set table(stroke: 0.6pt + borde, inset: (x: 6pt, y: 4.5pt))
  show table.cell.where(y: 0): set text(weight: 650, fill: tinta)
  set list(indent: 2pt, body-indent: 6pt, spacing: 0.55em)
  set enum(indent: 2pt, body-indent: 6pt, spacing: 0.55em)
  cuerpo
}

/// Una lámina: una pregunta principal arriba, el contenido y, si hay, la columna lateral de conceptos.
#let lamina(nivel: none, pregunta: "", bajada: none, lateral: none, ancho-lateral: 82mm, cuerpo) = {
  // El nivel se actualiza antes del salto: así el encabezado de la página nueva ya lo muestra.
  if nivel != none { nivel-actual.update(nivel) }
  pagebreak(weak: true)
  // El primer nivel de cada bloque entra al índice como título de nivel 1 (sin dibujarse); la pregunta, como nivel 2.
  if nivel != none {
    context if nivel != NIVEL-ANTERIOR.get() { heading(level: 1, outlined: true, bookmarked: true, nivel) }
    NIVEL-ANTERIOR.update(nivel)
  }
  block(below: 7pt, heading(level: 2, pregunta))
  if bajada != none { block(below: 10pt, text(size: 11pt, fill: tinta-suave, bajada)) } else { v(6pt) }
  if lateral == none {
    cuerpo
  } else {
    grid(columns: (1fr, ancho-lateral), column-gutter: 7mm, cuerpo, lateral)
  }
}

/// La tarjeta de un concepto: el término técnico, la explicación en criollo, un ejemplo dentro de BE y una pregunta para
/// comprobar si se entendió (las respuestas están en el cuaderno de respuestas, aparte).
#let concepto(termino, criollo: none, en-be: none, pregunta: none) = block(
  width: 100%,
  fill: fondo,
  stroke: (left: 3pt + acento-oscuro),
  inset: (left: 9pt, right: 8pt, y: 7pt),
  radius: (right: 3pt),
  below: 7pt,
  breakable: false,
  {
    set par(leading: 0.55em, spacing: 0.5em)
    set text(size: 9.5pt)
    CONCEPTOS.step()
    text(size: 9pt, weight: 650, fill: acento-oscuro, context upper("Concepto " + str(CONCEPTOS.get().first())))
    linebreak()
    text(size: 11.5pt, weight: 700, termino)
    if criollo != none { par[*En criollo.* #criollo] }
    if en-be != none { par[*En BE.* #en-be] }
    if pregunta != none { par(text(fill: tinta-suave)[*Para comprobar.* #pregunta]) }
  },
)

/// Un recuadro de advertencia o de «ojo con esto».
#let ojo(titulo, cuerpo) = block(
  width: 100%,
  fill: pendiente-fondo,
  stroke: (left: 3pt + pendiente-trazo),
  inset: (left: 9pt, right: 8pt, y: 6pt),
  radius: (right: 3pt),
  below: 7pt,
  breakable: false,
  {
    set text(size: 9.5pt)
    text(weight: 700, fill: pendiente-texto, titulo)
    linebreak()
    cuerpo
  },
)

/// Una lámina generada por el motor (laminas/generado/<id>.svg), con su epígrafe: qué muestra y de dónde sale.
#let diagrama(id, ancho: 100%, epigrafe: none, fuente: none) = {
  figure(
    image("../laminas/generado/" + id + ".svg", width: ancho),
    caption: if epigrafe == none { none } else { text(size: 9pt, fill: tinta-suave)[*#id.* #epigrafe #if fuente != none [Fuente: #fuente.]] },
    supplement: none,
    numbering: none,
    gap: 5pt,
  )
}

/// Las referencias al código de una lámina, al pie de su contenido.
#let referencias(..rutas) = block(above: 6pt, text(size: 9pt, fill: tinta-suave)[Para leer en el código: #rutas.pos().map(r => raw(r)).join(" · ")])
