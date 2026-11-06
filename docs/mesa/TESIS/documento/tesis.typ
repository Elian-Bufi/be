// BE — documento de tesis (Escuela Da Vinci, Analista de Sistemas). Estructura obligatoria de «Entregables» v2025.05:
// los 14 apartados en orden, después los anexos. Cada apartado vive en su archivo de capitulos/; el estilo, en
// plantilla.typ y ../estilo/tokens.json; los datos de versión, en ../datos/version.json.
// Compilar: node ../construir-documento.mjs (ver ../LEEME.md).
#import "plantilla.typ": *
#show: tesis

#include "capitulos/01-presentacion.typ"

#page(header: none)[
  #set par(justify: false)
  #text(size: 20pt, weight: 600, "Índice")
  #v(4pt)
  #line(length: 40pt, stroke: 2.5pt + acento)
  #v(8pt)
  #outline(title: none, depth: 2)
]

#include "capitulos/01b-ficha.typ"
#include "capitulos/02-acta.typ"
#include "capitulos/03-requisitos.typ"
#include "capitulos/04-casos-de-uso.typ"
#include "capitulos/05-casos-de-prueba.typ"
#include "capitulos/06-der.typ"
#include "capitulos/07-clases.typ"
#include "capitulos/08-arquitectura.typ"
#include "capitulos/09-componentes.typ"
#include "capitulos/10-gantt.typ"
#include "capitulos/11-demo.typ"
#include "capitulos/12-apk.typ"
#include "capitulos/13-website.typ"
#include "capitulos/14-usuarios.typ"
#include "capitulos/anexos.typ"
