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

/// Verdadero desde el comienzo de los anexos: cambia «Apartado» por «Anexo» y la numeración de las figuras.
#let en-anexos = state("en-anexos", false)

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
    text(fill: rgb(paleta.texto), weight: 600, size: 10pt, hyphenate: false, nombres.at(clave, default: clave)),
  )
}

/// Identificador canónico (RF-021, UC-P09, API-NUT-13…).
// En una caja: un identificador no se corta en su guion (nada de «TEST-» al final de un renglón y «AUTH-010» al otro).
// Los muy largos (API-ANT-06-PROPIA) pueden cortarse en un guion propio, sin repetirlo, antes que salirse de la columna.
#let id(t) = {
  let cuerpo = text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 1em, weight: 500, fill: tinta, t)
  if type(t) == str and t.len() > 15 { cuerpo } else { box(cuerpo) }
}

/// Un nombre largo (Entidad.clave, una ruta, una tabla) con cortes permitidos después de «.», «/» y «_» y antes de cada
/// mayúscula interna, sin guiones de partición: no invade la columna vecina.
#let partible(t) = text(hyphenate: false, lang: "en", t
  .replace(regex("[./_]"), m => m.text + "\u{200b}")
  .replace(regex("([a-z])([A-Z])"), m => m.captures.at(0) + "\u{200b}" + m.captures.at(1)))

/// Código (una tabla, un servicio, una ruta) en monoespaciada y con los mismos cortes permitidos que `partible`.
#let cp(t) = text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 10pt, partible(t))

/// Un texto que viene de una fuente con marcas de Markdown (DV-05, los comentarios del esquema, las notas del
/// registro): los tramos entre acentos graves salen en monoespaciada, con cortes en «_» y «.» y sin partición; los
/// tramos entre dobles asteriscos, en negrita. Con una marca suelta, el texto sale sin esas marcas.
#let con-codigo(s) = {
  if type(s) != str { return s }
  let negritas(t) = {
    // Un identificador con guiones bajos (TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO) puede cortarse después de cada uno.
    let t = t.replace("_", "_\u{200b}")
    let partes = t.split("**")
    if calc.even(partes.len()) { return t.replace("**", "") }
    for (i, p) in partes.enumerate() { if calc.odd(i) { strong(p) } else { p } }
  }
  let partes = s.split("`")
  if calc.even(partes.len()) { return negritas(s.replace("`", "")) }
  for (i, p) in partes.enumerate() {
    if calc.odd(i) { cp(p) } else { negritas(p) }
  }
}

/// Regla para un bloque: los hashes de commit (siete caracteres hexadecimales con letras y números) van en
/// monoespaciada, como en el resto del documento.
#let hashes-en-codigo(cuerpo) = {
  show regex("\b[0-9a-f]{7}\b"): it => if it.text.contains(regex("[0-9]")) and it.text.contains(regex("[a-f]")) { text(font: "JetBrains Mono", hyphenate: false, lang: "en", it.text) } else { it }
  cuerpo
}

/// Una oración citada que termina sin punto (como varios resultados esperados de DV-05) lo recibe.
#let con-punto(s) = {
  if type(s) != str or s.trim() == "" { return s }
  let t = s.trim()
  if t.last().match(regex("[\p{L}\p{N})»”`]")) != none { t + "." } else { t }
}

/// Un título citado, recortado en el límite de una palabra y con las comillas internas como “…”.
#let titulo-citado(t, maximo: 110) = {
  let t = t.replace("«", "“").replace("»", "”")
  if t.clusters().len() <= maximo { return t }
  let palabras = t.clusters().slice(0, maximo - 1).join().split(" ")
  palabras.slice(0, calc.max(1, palabras.len() - 1)).join(" ").trim(regex("[\s,;:.·–-]+"), at: end) + "…"
}

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
    text(fill: rgb(paleta.texto), weight: 600, size: 10pt, hyphenate: false, nombres.at(clave, default: clave)),
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

/// El texto plano de un contenido (para comparar títulos).
#let a-texto(c) = {
  if type(c) == str { c } else if c.has("text") { c.text } else if c.has("children") { c.children.map(a-texto).join("") } else if c.has("body") { a-texto(c.body) } else if c.func() == [ ].func() { " " } else { "" }
}

/// Títulos abreviados para el encabezado de página (el título completo queda en el índice y en la página).
#let CORTOS = (
  "URL a una demo de la APK y del website": "Demo de la APK y del website",
  "URL para descargar la APK y URL de su código fuente": "Descarga y código de la APK",
  "URL del website hosteado y URL de su código fuente": "Website y su código",
  "Usuarios para acceder a la APK y al website con diferentes roles": "Usuarios y roles",
  "Convenciones gráficas y procedimiento de las figuras": "Convenciones gráficas",
)

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
        // Los títulos largos de la escuela (apartados 11 a 14) van abreviados en el encabezado, para que entre en un renglón.
        let titulo = if actual != none { CORTOS.at(a-texto(actual.body), default: actual.body) } else { none }
        grid(
          columns: (auto, 1fr),
          text(weight: 600, fill: tinta, "BE") + text(hyphenate: false, " · Plataforma integrada de inteligencia en salud"),
          if actual != none {
            align(right, text(hyphenate: false, (if actual.numbering != none { numbering(actual.numbering, ..counter(heading).at(actual.location())) + " " } else { "" }) + titulo))
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
  // Una fila de tabla o de ficha no se parte entre dos páginas.
  set table.cell(breakable: false)
  set grid.cell(breakable: false)
  set heading(numbering: "1.1")
  show heading: set text(fill: tinta, hyphenate: false)
  show heading.where(level: 1): it => context {
    pagebreak(weak: true)
    counter(figure.where(kind: image)).update(0)
    counter(figure.where(kind: table)).update(0)
    v(6pt)
    block(below: 14pt, {
      if it.numbering != none {
        text(size: 11pt, weight: 600, fill: acento-oscuro, (if en-anexos.get() { "Anexo " } else { "Apartado " }) + numbering(it.numbering, ..counter(heading).get()))
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
  set figure(numbering: (..n) => context numbering(if en-anexos.get() { "A.1" } else { "1.1" }, counter(heading).get().first(), ..n))
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
  show raw: set text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 10pt)
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
