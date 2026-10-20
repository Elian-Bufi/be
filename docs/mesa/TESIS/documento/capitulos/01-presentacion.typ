#import "../plantilla.typ": *

// ─── Apartado 1 · Presentación (portada) ─────────────────────────────────────────────────────────────────────
// Entregables 2025.05, punto 1: logotipo de la Escuela Da Vinci, nombre del proyecto, imagen representativa,
// integrantes (nombres, apellidos y correos @davinci.edu.ar) y mes y año de presentación.

#let integrantes = if es-evaluacion and "integrantes" in privado { privado.integrantes } else {
  ((nombre: "Elián Bufi", correo: none),)
}
#let mes-de-presentacion = if es-evaluacion and privado.at("mesDePresentacion", default: none) != none { privado.mesDePresentacion } else { none }

#page(margin: (top: 18mm, bottom: 16mm, x: 20mm), header: none, footer: none)[
  #set par(justify: false)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 14pt,
    align: horizon,
    if es-evaluacion {
      image(sys.inputs.at("logo"), width: 58mm)
    } else {
      box(width: 58mm, height: 19.3mm, stroke: (paint: rgb(C.pendiente.trazo), thickness: 0.8pt, dash: "dashed"), radius: 2pt, inset: 6pt,
        align(center + horizon, text(size: 10pt, fill: rgb(C.pendiente.texto), [Logotipo oficial de la Escuela Da Vinci \ (se incorpora en la versión de evaluación)])))
    },
    align(right, text(size: 11pt, fill: tinta-suave)[Escuela Da Vinci \ Carrera Analista de Sistemas \ *Trabajo final de carrera*]),
  )
  #v(1fr)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 16pt,
    align: horizon,
    image("../../../../../apps/mobile/assets/isotipo.png", width: 30mm),
    {
      text(size: 46pt, weight: 700, fill: tinta, "BE")
      linebreak()
      text(size: 19pt, weight: 600, fill: tinta, "Plataforma integrada de inteligencia en salud")
      v(2pt)
      line(length: 56pt, stroke: 3pt + acento)
    },
  )
  #v(10pt)
  #text(size: 12pt, fill: tinta-suave)[Profesionales de nutrición, entrenamiento y antropometría trabajan con la misma persona sin mezclar sus áreas: la persona decide quién accede, cada plan activado queda como versión y nada de lo registrado se borra.]
  #v(14pt)
  #include "portada-imagen.typ"
  #v(1fr)
  #block(width: 100%, inset: (y: 8pt), stroke: (top: 0.8pt + borde, bottom: 0.8pt + borde), {
    grid(
      columns: (1fr, 1fr),
      column-gutter: 18pt,
      row-gutter: 6pt,
      text(size: 10pt, weight: 600, fill: tinta-suave, "INTEGRANTES"), text(size: 10pt, weight: 600, fill: tinta-suave, "CORREO INSTITUCIONAL"),
      ..integrantes.map(i => (text(weight: 600, i.nombre), if i.correo != none { i.correo } else { pendiente("correo @davinci.edu.ar — a completar") })).flatten(),
    )
  })
  #v(6pt)
  #grid(
    columns: (auto, auto),
    column-gutter: 1fr,
    [Presentación: #if mes-de-presentacion != none { strong(mes-de-presentacion) } else { pendiente("mes y año de presentación — a completar") }],
    text(size: 10pt, fill: tinta-suave, hyphenate: false)[Documento versión #version.documento.version.split(" ").first() · corte #version.fecha · commit #version.commitCorto],
  )
]
