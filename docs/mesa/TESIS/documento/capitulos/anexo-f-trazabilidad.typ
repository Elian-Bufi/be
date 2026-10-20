#import "../plantilla.typ": *

// Matriz de trazabilidad: datos/evidencia-rf.json (04, DV-03, 12 y las pruebas que citan cada requisito),
// datos/estado.json (estado en la versión de referencia) y datos/casos-de-prueba.json (resultado de los casos de DV-05).
#let rfs = json("../../datos/evidencia-rf.json").requisitos
#let est = json("../../datos/estado.json")
#let casos = json("../../datos/casos-de-prueba.json").casos
#let corte(s) = s.replace(regex("([/._·])"), m => m.captures.at(0) + "\u{200b}")
#let res = (cubierto: "✓", parcial: "◐", "no-ejecutable": "✗")

= Matriz de trazabilidad

La matriz une, para cada requisito funcional, su estado en la versión de referencia, los casos de uso que lo realizan,
el contrato que lo sostiene según el documento 12 del legajo, el caso de prueba del plan 11A y su resultado, la
cantidad de archivos de prueba que lo ejercitan en la CI y las decisiones registradas que lo afectan.

En la columna de casos: ✓ pasa en la CI, ◐ pasa en parte, ✗ no es ejecutable con lo que se entrega (apartado 5).

#{
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (15mm, 27mm, 24mm, 1fr, 28mm, 12mm, 24mm),
    table.header([RF], [Estado], [Casos de uso], [Contrato (documento 12)], [Casos de prueba], [Arch.], [Decisiones]),
    ..rfs.map(r => {
      let cs = casos.filter(c => r.id in c.rfs)
      let pruebas = (r.pruebasQueLoCitan + r.pruebasPorOperacion + r.pruebasPorUC).dedup()
      (
        id(r.id),
        estado(est.requisitos.at(r.id).estado),
        if r.ucs.len() > 0 { r.ucs.map(u => u.replace("UC-", "")).join(", ") } else { text(fill: tinta-suave, "—") },
        if r.contrato12 != none and r.contrato12 != "" { corte(r.contrato12.replace("`", "")) } else { text(fill: tinta-suave, "—") },
        if cs.len() > 0 { cs.map(c => c.id.replace("TEST-", "") + " " + res.at(c.clase)).join(", ") } else { text(fill: tinta-suave, "—") },
        str(pruebas.len()),
        if r.dl.len() > 0 { r.dl.map(d => d.id).slice(0, calc.min(3, r.dl.len())).join(", ") + if r.dl.len() > 3 [ y #(r.dl.len() - 3) más] } else { text(fill: tinta-suave, "—") },
      )
    }).flatten(),
  )
}

Las 191 operaciones del contrato publicado, agrupadas en 30 familias, están en el apartado 9; los 56 casos de uso con
sus requisitos, en el apartado 4; y cada caso de prueba con su evidencia, en el apartado 5.
