#import "../plantilla.typ": *

// Datos: el 04 (actor, prioridad, obligación y aceptación, literales), DV-03 (canal y caso de uso), estado y redacción
// propias de la tesis (necesidad y reglas), y la evidencia de prueba extraída del repositorio.
#let ev = json("../../datos/evidencia-rf.json").requisitos
#let est = json("../../datos/estado.json")
#let red = json("../../datos/requisitos-redaccion.json")
#let rnf = csv("../../../MESA_02/DV-03/DV-03_RNF_POR_CATEGORIA.csv").slice(1)

#let nombre-plataforma = (W: "Website", A: "APK", S: "API (sin pantalla propia)")
#let plataformas(p) = if p == "" { "—" } else { p.clusters().map(c => nombre-plataforma.at(c)).join(" · ") }
#let corto(ruta) = ruta.split("/").last().replace(regex("\.(int-spec|spec|test)\.(ts|tsx|mjs|cjs)$"), "").replace(regex("\.mjs$"), "")
#let pruebas-de(r) = {
  let todas = (r.pruebasQueLoCitan + r.pruebasPorOperacion + r.pruebasPorUC).dedup()
  todas.map(corto).dedup()
}
#let cuenta(lista, clave) = lista.filter(r => est.requisitos.at(r.id).estado == clave).len()

/// Ficha de un requisito funcional.
#let ficha(r) = {
  let e = est.requisitos.at(r.id)
  let d = red.requisitos.at(r.id)
  let pruebas = pruebas-de(r)
  let verif = e.verificacion.filter(v => v != "CI").map(v => {
    let x = est.verificaciones.at(v)
    (if x.tipo == "telefono" { "Teléfono " } else { "Test " }) + x.fecha + " (" + v + ")"
  })
  block(breakable: false, width: 100%, above: 10pt, below: 4pt, stroke: (top: 0.8pt + borde), inset: (top: 6pt), {
    grid(
      columns: (auto, 1fr, auto),
      column-gutter: 8pt,
      align: (left + horizon, left + horizon, right + horizon),
      text(font: "JetBrains Mono", weight: 600, size: 10.5pt, fill: azul, r.id),
      text(weight: 600, size: 10.5pt, r.titulo),
      estado(e.estado),
    )
    v(3pt)
    set text(size: 10pt, hyphenate: false)
    set par(justify: false)
    grid(
      columns: (31mm, 1fr),
      column-gutter: 8pt,
      row-gutter: 4.5pt,
      text(fill: tinta-suave, "Actor"), [#r.actor · prioridad #r.prioridad.slice(0, 2)],
      text(fill: tinta-suave, "Necesidad"), d.necesidad,
      text(fill: tinta-suave, "Comportamiento"), r.obligacion,
      text(fill: tinta-suave, "Reglas"), list(..d.reglas, tight: true, marker: [–]),
      text(fill: tinta-suave, "Aceptación"), r.aceptacion,
      text(fill: tinta-suave, "Plataforma"), [Prevista: #lower(r.canal) (DV-03) · implementada: #plataformas(e.plataformas)],
      text(fill: tinta-suave, "Caso de uso"), if r.ucs.len() > 0 { r.ucs.map(id).join(", ") } else { "—" },
      text(fill: tinta-suave, "Prueba"), {
        [Plan: #id(r.prueba11A)]
        if pruebas.len() > 0 { [ · CI: #pruebas.slice(0, calc.min(4, pruebas.len())).map(p => raw(p)).join(", ")#if pruebas.len() > 4 [ y #(pruebas.len() - 4) más]] }
        if verif.len() > 0 { [ · #verif.join(" · ")] }
      },
      ..if e.nota != "" { (text(fill: tinta-suave, "Estado"), e.nota) } else { () },
    )
  })
}

= Requisitos funcionales

Los requisitos funcionales son los del documento canónico 04 (versión 0.4.2.1): 69 activos, de los cuales 59 tienen
prioridad P0 (núcleo no recortable), 8 P1 y 2 P2. Se conservan sus identificadores y su texto: actor, comportamiento
esperado (la «obligación» del 04) y criterio de aceptación se citan literalmente. La separación entre Website y APK es
la del entregable DV-03, que asignó cada requisito a la superficie donde se ejerce; los que se ejercen en las dos, o en
el servidor sin pantalla propia, forman las *funciones compartidas*.

== Cómo leer cada requisito

Cada ficha tiene los campos que pide la escuela y dos que agrega esta tesis para que la lectura sea honesta:

- *Necesidad* y *reglas*: el 04 no tiene esos campos. Se redactaron para esta tesis a partir de la obligación, del
  modelo de dominio (06), de la política de seguridad (08) y de las decisiones registradas; cuando una regla sale de
  un identificador (#id("REG-06"), #id("INV-06"), #id("DL")), se lo cita.
- *Plataforma*: la prevista en DV-03 y la implementada, que puede ser más amplia (sección 3.6).
- *Prueba*: el caso del plan de pruebas del legajo (11A), los archivos de prueba que lo ejercitan en la CI y, si la
  hay, la verificación remota o en el teléfono, con fecha. Una prueba que pasa en la CI no se presenta como
  comprobación en el ambiente remoto.

Los estados son cinco: #estado("verificado") (implementado y comprobado contra el ambiente test o en el teléfono, con
fecha), #estado("implementado") (implementado y cubierto por pruebas que pasan en la CI de la versión de referencia),
#estado("parcial"), #estado("pendiente") (aprobado y no implementado) y #estado("fuera") (fuera de alcance declarado
por Dirección para esta entrega). El registro de verificaciones está al final de este apartado.

== Resumen

#{
  let grupos = (("Website", "WEBSITE"), ("APK", "APK"), ("Compartidas", "TRANSVERSAL"))
  let claves = ("verificado", "implementado", "parcial", "pendiente", "fuera")
  figure(
    kind: table,
    caption: [Estado de los 69 requisitos funcionales en la versión de referencia, por superficie prevista.],
    table(
      columns: (1.2fr, auto, auto, auto, auto, auto, auto),
      align: (left, center, center, center, center, center, center),
      table.header([Superficie prevista], [Verificado], [Implementado], [Parcial], [Pendiente], [Fuera de alcance], [Total]),
      ..grupos.map(((nombre, canal)) => {
        let l = ev.filter(r => r.canal == canal)
        (nombre, ..claves.map(k => str(cuenta(l, k))), str(l.len()))
      }).flatten(),
      table.cell(fill: fondo-suave)[*Total*],
      ..claves.map(k => table.cell(fill: fondo-suave, strong(str(cuenta(ev, k))))),
      table.cell(fill: fondo-suave, strong(str(ev.len()))),
    ),
  )
}

Del núcleo P0 (59 requisitos), los únicos sin implementar son los ocho del alta y la verificación de profesionales y de
la capacidad antropométrica (#id("RF-008") a #id("RF-014") y #id("RF-067")), que Dirección dejó fuera de esta entrega:
los profesionales de la demostración se habilitan con un servicio interno (DL-036). La sección 3.7 detalla cada brecha.

#{
  let letra = (verificado: "V", implementado: "I", parcial: "P", pendiente: "N", fuera: "F")
  let fila(canal) = ev.filter(r => r.canal == canal).map(r => box(inset: (right: 3pt, bottom: 3pt), {
    let e = est.requisitos.at(r.id).estado
    let paleta = C.estado.at(if e in C.estado { e } else { "fuera" })
    box(fill: rgb(paleta.fondo), radius: 2pt, inset: (x: 3pt, y: 2pt), text(font: "JetBrains Mono", size: 9.5pt, fill: rgb(paleta.texto), weight: 600, r.id.slice(3) + " " + letra.at(e)))
  }))
  figure(
    kind: image,
    caption: [Mapa de estados por requisito (V verificado · I implementado · P parcial · N pendiente · F fuera de alcance). La letra repite el significado del color.],
    block(width: 100%, inset: 6pt, stroke: 0.6pt + borde, radius: 3pt, align(left, {
      text(weight: 600, size: 10pt, "Website  ")
      fila("WEBSITE").join()
      linebreak()
      text(weight: 600, size: 10pt, "APK  ")
      fila("APK").join()
      linebreak()
      text(weight: 600, size: 10pt, "Compartidas  ")
      fila("TRANSVERSAL").join()
    })),
  )
}

== Website

Requisitos que DV-03 asigna al website: el espacio del profesional (evaluar, planificar, revisar y coordinar) y la
administración prevista.

#for r in ev.filter(r => r.canal == "WEBSITE") { ficha(r) }

== APK

Requisitos que DV-03 asigna a la APK: lo que la persona hace en su teléfono (su día, sus registros y su evolución) y
las decisiones sobre sus vínculos y sus permisos.

#for r in ev.filter(r => r.canal == "APK") { ficha(r) }

== Funciones compartidas

Requisitos que se ejercen en las dos superficies o en el servidor, sin pantalla propia: identidad y sesión, vínculo,
autorización, historia, integraciones, novedades y la métrica TVCC-30. En todos ellos la decisión es de la API, así el
website y la APK se comportan igual.

#for r in ev.filter(r => r.canal == "TRANSVERSAL") { ficha(r) }

== Superficie implementada distinta de la prevista

Algunos requisitos que DV-03 asignó a una superficie se implementaron también en la otra, porque la persona administra
su cuenta y sus permisos tanto en la APK como en el website. Ninguno se implementó en una superficie menor que la
prevista.

#{
  let mapa = (WEBSITE: "W", APK: "A", TRANSVERSAL: "WA")
  let distintos = ev.filter(r => {
    let p = est.requisitos.at(r.id).plataformas.replace("S", "")
    p != "" and r.canal != "TRANSVERSAL" and p != mapa.at(r.canal)
  })
  table(
    columns: (auto, 1fr, auto, auto),
    table.header([Requisito], [Título], [Prevista], [Implementada]),
    ..distintos.map(r => (id(r.id), r.titulo, lower(r.canal), plataformas(est.requisitos.at(r.id).plataformas))).flatten(),
  )
}

== Brechas

#table(
  columns: (auto, 1fr, auto, 1.3fr),
  table.header([Requisito], [Título], [Estado], [Motivo y referencia]),
  ..ev.filter(r => est.requisitos.at(r.id).estado in ("parcial", "pendiente", "fuera")).map(r => {
    let e = est.requisitos.at(r.id)
    (id(r.id), r.titulo, estado(e.estado), e.nota)
  }).flatten(),
)

== Requisitos no funcionales (complemento)

El documento de la escuela pide requisitos funcionales. Como complemento, la tabla resume los 38 requisitos no
funcionales del documento 04 (tal como los transcribe DV-03) con la evidencia que hoy los respalda en la implementación.
No se presentan como exigencia de la escuela.

#table(
  columns: (auto, 1fr, 1.45fr),
  table.header([ID], [Requisito no funcional (04)], [Evidencia en la versión de referencia]),
  ..rnf.map(f => (id(f.at(0)), f.at(2), red.rnf.at(f.at(0), default: "—"))).flatten(),
)

== Registro de verificaciones citadas

#table(
  columns: (auto, auto, 1fr),
  table.header([Clave], [Fecha], [Qué se verificó, dónde y con qué]),
  ..est.verificaciones.pairs().map(((k, v)) => (raw(k), v.fecha, v.detalle)).flatten(),
)
