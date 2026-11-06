#import "../plantilla.typ": *

// Operaciones del contrato publicado con su caso de uso, leídos del código por herramientas/operaciones-y-casos.mjs y
// herramientas/operaciones-detalle.mjs (datos/operaciones-detalle.json).
#let ops = json("../../datos/operaciones-detalle.json").operaciones
#let corte-ruta(s) = text(hyphenate: false, lang: "en", s.replace(regex("([/{])"), m => "\u{200b}" + m.captures.at(0)))

/// Tabla «acción de la lámina → operaciones»: identificador, método y ruta, y el caso de uso que la operación deja en
/// su procedencia (el que se audita). filas: ((acción, (op, op, …)), …).
#let tabla-de-acciones(filas) = {
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (36mm, 40mm, 1fr, 19mm),
    table.header([Acción en la lámina], [Operación], [Método y ruta], [Caso de uso]),
    ..filas
      .map(((accion, lista)) => lista
        .enumerate()
        .map(((i, o)) => {
          let d = ops.at(o, default: none)
          let celdas = ()
          if i == 0 { celdas.push(table.cell(rowspan: lista.len(), accion)) }
          celdas.push(id(o))
          celdas.push(if d == none { text(fill: tinta-suave, "—") } else { text(font: "JetBrains Mono", weight: 500, fill: tinta, corte-ruta(d.metodo + " " + d.ruta)) })
          celdas.push(if d == none or d.casos.len() == 0 { text(fill: tinta-suave, "—") } else { d.casos.map(c => box(c)).join(", ") })
          celdas
        })
        .flatten())
      .flatten(),
  )
}
