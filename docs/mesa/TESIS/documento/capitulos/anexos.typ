#import "../plantilla.typ": *

// Los anexos siguen al apartado 14, como pide «Entregables». Llevan letras (A a L) y su propia numeración de figuras.
#set heading(numbering: none)
= Anexos

#table(
  columns: (12mm, 1fr),
  table.header([Anexo], [Contenido]),
  [A], [Entrega: criterios de la escuela y procedimiento de envío],
  [B], [Flujo integral profesional–asesorado],
  [C], [Flujos por área, con carriles],
  [D], [Diagramas de flujo de datos: contexto y nivel 1],
  [E], [Diagramas de secuencia y de estados de mecanismos reales],
  [F], [Matriz de trazabilidad],
  [G], [Diccionario de datos],
  [H], [Decisiones de arquitectura y evolución],
  [I], [Glosario],
  [J], [Referencias],
  [K], [Discrepancias y defectos pendientes],
  [L], [Convenciones gráficas y procedimiento de las figuras],
)

#en-anexos.update(true)
#set heading(numbering: "A.1")
#counter(heading).update(0)

#include "anexo-a-entrega.typ"
#include "anexo-b-flujo-integral.typ"
#include "anexo-c-flujos-por-area.typ"
#include "anexo-d-dfd.typ"
#include "anexo-e-secuencias-y-estados.typ"
#include "anexo-f-trazabilidad.typ"
#include "anexo-g-diccionario.typ"
#include "anexo-h-decisiones.typ"
#include "anexo-i-glosario.typ"
#include "anexo-j-referencias.typ"
#include "anexo-k-discrepancias.typ"
#include "anexo-l-convenciones.typ"
