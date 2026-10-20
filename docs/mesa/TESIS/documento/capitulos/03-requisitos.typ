#import "../plantilla.typ": *

// Datos: el 04 (actor, prioridad, obligación y aceptación, literales), DV-03 (canal y caso de uso), estado y redacción
// propias de la tesis (necesidad y reglas), y la evidencia de prueba extraída del repositorio.
#let ev = json("../../datos/evidencia-rf.json").requisitos
#let est = json("../../datos/estado.json")
#let red = json("../../datos/requisitos-redaccion.json")
#let rnf = csv("../../../MESA_02/DV-03/DV-03_RNF_POR_CATEGORIA.csv").slice(1)

#let nombre-plataforma = (W: "website", A: "APK", S: "API (sin pantalla propia)")
#let canal-previsto = (WEBSITE: "website", APK: "APK", TRANSVERSAL: "compartida")
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
    set par(justify: false)
    grid(
      columns: (auto, 1fr, auto),
      column-gutter: 8pt,
      align: (left + top, left + top, right + top),
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", weight: 600, size: 10.5pt, fill: azul, r.id),
      text(weight: 600, size: 10.5pt, hyphenate: false, r.titulo),
      estado(e.estado),
    )
    v(3pt)
    set text(size: 10pt, hyphenate: false)
    set par(justify: false)
    grid(
      columns: (31mm, 1fr),
      column-gutter: 8pt,
      row-gutter: 7pt,
      text(fill: tinta-suave, "Actor"), [#r.actor · prioridad #r.prioridad.slice(0, 2)],
      text(fill: tinta-suave, "Necesidad"), d.necesidad,
      text(fill: tinta-suave, "Comportamiento"), con-codigo(r.obligacion),
      text(fill: tinta-suave, "Reglas"), list(..d.reglas, tight: true, marker: [–]),
      text(fill: tinta-suave, "Aceptación"), con-codigo(r.aceptacion),
      text(fill: tinta-suave, "Plataforma"), [Prevista: #canal-previsto.at(r.canal) (DV-03) · implementada: #plataformas(e.plataformas)],
      text(fill: tinta-suave, "Caso de uso"), if r.ucs.len() > 0 { r.ucs.map(id).join(", ") } else { "—" },
      text(fill: tinta-suave, "Prueba"), {
        [Plan: #id(r.prueba11A)]
        if pruebas.len() > 0 { [ · CI: #pruebas.slice(0, calc.min(4, pruebas.len())).map(p => raw(p)).join(", ")#if pruebas.len() > 4 [ y #(pruebas.len() - 4)~más]] }
        if verif.len() > 0 { [ · #verif.join(" · ")] }
      },
      text(fill: tinta-suave, "Estado"), if e.nota != "" { con-codigo(e.nota) } else { text(fill: tinta-suave, "Sin observaciones.") },
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

Cada ficha tiene los campos que pide la escuela. Algunos no están en el documento 04 o se completan de una manera
particular:

- *Necesidad* y *reglas*: el 04 no tiene esos campos. Se redactaron para esta tesis a partir de la obligación, del
  modelo de dominio (06), de la política de seguridad (08) y de las decisiones registradas; cuando una regla sale de
  un identificador (#id("REG-06"), #id("INV-06"), #id("DL")), se lo cita.
- *Plataforma*: la prevista en DV-03 y la implementada, que puede ser más amplia (sección 3.6).
- *Prueba*: el caso del plan de pruebas del legajo (11A), los archivos de prueba que lo ejercitan en la CI y, si la
  hay, la verificación remota o en el teléfono, con fecha. Una prueba que pasa en la CI no se presenta como
  comprobación en el ambiente remoto.

Los estados son cinco: #estado("verificado") (implementado y comprobado contra el ambiente test o en el teléfono, con
fecha), #estado("implementado") (implementado y cubierto por pruebas que pasan en la CI de la versión de referencia),
#estado("parcial") (una parte implementada y otra no), #estado("pendiente") (aprobado y no implementado) y
#estado("fuera") (fuera de alcance declarado por Dirección para esta entrega). Una verificación cuenta para el estado
solo si ejercita el criterio de aceptación con una versión que ya tenía esa implementación; por eso T-015, hecha con
la 0.15.0-candidata.1, figura como antecedente y no cambia el estado. El registro de verificaciones está al final de
este apartado. Comportamiento y aceptación se citan del 04 tal como están, con sus términos en inglés.

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
los profesionales de la demostración se habilitan con un servicio interno (DL-036). Otros dos están implementados en
parte: #id("RF-017") (el perfil propio tiene un solo campo aprobado) y #id("RF-043") (la sustitución de ejercicios,
un defecto abierto de la candidata, DL-151). La sección 3.7 detalla cada brecha.

#{
  let letra = (verificado: "V", implementado: "I", parcial: "P", pendiente: "N", fuera: "F")
  let fila(canal) = ev.filter(r => r.canal == canal).map(r => box(inset: (right: 3pt, bottom: 3pt), {
    let e = est.requisitos.at(r.id).estado
    let paleta = C.estado.at(if e in C.estado { e } else { "fuera" })
    box(fill: rgb(paleta.fondo), radius: 2pt, inset: (x: 3pt, y: 2pt), text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 10pt, fill: rgb(paleta.texto), weight: 600, r.id.slice(3) + " " + letra.at(e)))
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
su cuenta y sus permisos tanto en la APK como en el website (tabla). Uno quedó en una superficie menor que la prevista:
#id("RF-066"), la capacidad del profesional, que existe en la API sin pantalla propia y por eso está parcial. Entre las
funciones compartidas, varias se ejercen en una sola superficie además del servidor, por lo que son: la línea de
tiempo (#id("RF-054")) es del profesional, en el website; los avisos al teléfono (#id("RF-062")), de la APK; los cálculos
y las integraciones (#id("RF-048"), #id("RF-059") y #id("RF-060")), del website.

#{
  let mapa = (WEBSITE: "W", APK: "A", TRANSVERSAL: "WA")
  let distintos = ev.filter(r => {
    let p = est.requisitos.at(r.id).plataformas.replace("S", "")
    p != "" and r.canal != "TRANSVERSAL" and p != mapa.at(r.canal)
  })
  table(
    columns: (auto, 1fr, auto, auto),
    table.header([Requisito], [Título], [Prevista], [Implementada]),
    ..distintos.map(r => (id(r.id), r.titulo, canal-previsto.at(r.canal), plataformas(est.requisitos.at(r.id).plataformas))).flatten(),
  )
}

== Brechas

#table(
  columns: (auto, 1fr, auto, 1.3fr),
  table.header([Requisito], [Título], [Estado], [Motivo y referencia]),
  ..ev.filter(r => est.requisitos.at(r.id).estado in ("parcial", "pendiente", "fuera")).sorted(key: r => (("parcial", "pendiente", "fuera").position(x => x == est.requisitos.at(r.id).estado), r.id)).map(r => {
    let e = est.requisitos.at(r.id)
    (id(r.id), r.titulo, estado(e.estado), con-codigo(e.nota))
  }).flatten(),
)

== Requisitos no funcionales (complemento)

El documento de la escuela pide requisitos funcionales. Como complemento, la tabla resume los 38 requisitos no
funcionales del documento 04 (tal como los transcribe DV-03) con la evidencia que hoy los respalda en la implementación.
No se presentan como exigencia de la escuela.

#table(
  columns: (auto, 1fr, 1.45fr),
  table.header([ID], [Requisito no funcional (04)], [Evidencia en la versión de referencia]),
  ..rnf.map(f => (id(f.at(0)), f.at(2), con-codigo(red.rnf.at(f.at(0), default: "—")))).flatten(),
)

== Registro de verificaciones citadas

Las verificaciones en test se hicieron sobre despliegues del 2026-10-20 que, en lo verificado, se comportan como
#id("0fb1bff") (el apartado 5.5 da la versión de cada una). Las del teléfono se hicieron con la 0.17.0-candidata.2; la .3
agrega a la APK el recorrido de DL-143 y el aviso «Falta un paso», que faltan probar en un teléfono.

#table(
  columns: (auto, auto, 1fr),
  table.header([Clave], [Fecha], [Qué se verificó, dónde y con qué]),
  ..est.verificaciones.pairs().map(((k, v)) => (raw(k), v.fecha, v.detalle)).flatten(),
)
