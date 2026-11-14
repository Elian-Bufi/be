#import "../plantilla.typ": *

// Diccionario de datos generado de datos/esquema.json (lectura de prisma/schema.prisma en la versión de referencia).
// Ordenado por las vistas del DER; dentro de cada vista, en el orden de la lista de modelos de la vista.
#let esq = json("../../datos/esquema.json")
#let vistas = json("../../datos/vistas-der.json").vistas
#let nombres-enum = esq.enums.map(e => e.nombre)
#let modelo(n) = esq.modelos.find(m => m.nombre == n)
#let serpiente(s) = lower(s.replace(regex("([a-z0-9])([A-Z])"), m => m.captures.at(0) + "_" + m.captures.at(1)))
// Puntos de corte invisibles para que los identificadores largos se partan dentro de su celda: entre palabras de un
// nombre en camelCase, después de un guion bajo y después de paréntesis o comas.
#let corte(s) = text(hyphenate: false, lang: "en", s.replace(regex("([a-z0-9])([A-Z])"), m => m.captures.at(0) + "\u{200b}" + m.captures.at(1)).replace(regex("([_(,.])"), m => m.captures.at(0) + "\u{200b}"))
#let predeterminado(p) = if p == "now()" { raw(p) } else if p.starts-with("dbgenerated(\"gen_random_uuid()\")") { [UUID aleatorio (#raw("gen_random_uuid()"))] } else { text(font: "JetBrains Mono", hyphenate: false, lang: "en", corte(p)) }
#let columnas(m) = m.campos.filter(c => not c.lista and (c.escalar or c.tipo in nombres-enum))

#let clave(m, c) = {
  let partes = ()
  let compuesta = m.at("clavePrimariaCompuesta", default: none)
  if compuesta == none { compuesta = () }
  if c.at("clavePrimaria", default: false) == true or c.nombre in compuesta { partes.push("PK") }
  let fk = c.at("claveForanea", default: none)
  if fk != none { partes.push("FK → " + corte(fk.modelo)) }
  if c.at("unico", default: false) and not c.at("clavePrimaria", default: false) { partes.push("UK") }
  partes.join(" · ")
}

#let tipo(c) = {
  let t = c.tipo
  let f = c.at("tipoFisico", default: none)
  if c.tipo in nombres-enum { [#text(font: "JetBrains Mono", hyphenate: false, lang: "en", corte(t)) #text(fill: tinta-suave)[(enum.)]] } else if f != none and f != t {
    [#text(font: "JetBrains Mono", hyphenate: false, lang: "en", t) #text(fill: tinta-suave)[(#corte(f))]]
  } else { text(font: "JetBrains Mono", hyphenate: false, lang: "en", t) }
}

#let descripcion(c) = {
  let d = c.at("doc", default: none)
  let p = c.at("predeterminado", default: none)
  let fisica = c.at("columna", default: none)
  let partes = ()
  if d != none { partes.push(con-codigo(d)) }
  if p != none { partes.push([predeterminado: #predeterminado(p)]) }
  if fisica != none and fisica != serpiente(c.nombre) { partes.push([columna física: #text(font: "JetBrains Mono", hyphenate: false, lang: "en", corte(fisica))]) }
  if partes.len() == 0 { text(fill: tinta-suave, "—") } else { partes.join([ · ]) }
}

#let ficha-modelo(m) = {
  // La cabecera y la descripción quedan pegadas a la tabla (sticky): ninguna queda sola al pie de una página.
  block(breakable: false, sticky: true, above: 12pt, below: 4pt, {
    text(font: "JetBrains Mono", hyphenate: false, lang: "en", weight: 600, fill: azul, m.nombre)
    h(6pt)
    text(fill: tinta-suave)[tabla #raw(m.tabla)]
  })
  block(sticky: true, below: 4pt, text(size: 10pt, fill: tinta-suave, if m.at("doc", default: none) != none { con-codigo(m.doc) } else [Sin comentario en el esquema.]))
  set text(size: 10pt, hyphenate: false)
  table(
    columns: (30%, 19%, 9%, 17%, 25%),
    table.header([Columna], [Tipo], [Nulo], [Clave], [Descripción]),
    ..columnas(m).map(c => (text(font: "JetBrains Mono", hyphenate: false, lang: "en", corte(c.nombre)), tipo(c), if c.opcional { "sí" } else { "no" }, clave(m, c), descripcion(c))).flatten(),
  )
}

= Diccionario de datos

El diccionario reproduce el esquema de la versión de referencia (#id("0fb1bff")): #esq.modelos.len() modelos con
#esq.modelos.map(m => columnas(m).len()).sum() columnas y #esq.enums.len() enumeraciones. Se genera de
`prisma/schema.prisma` (`herramientas/leer-esquema.mjs` → `datos/esquema.json`), así no puede diferir del código.

- *Nombres.* El nombre lógico es el del modelo; el físico, el mismo en minúsculas separado por guiones bajos
  (`momentoDeRegistro` → `momento_de_registro`). Se indica cuando difiere.
- *Tipo.* El tipo lógico de Prisma y, entre paréntesis, el físico de PostgreSQL cuando se fija (por ejemplo,
  `Uuid` o `Timestamptz(3)`).
- *Nulo.* «sí» si la columna admite nulo.
- *Clave.* PK clave primaria; FK, con la entidad a la que apunta; UK única. Las unicidades compuestas se marcan en las
  láminas del apartado 6.4 (U1, U2…), y las parciales están en el apartado 6.6.
- *Descripción.* El comentario del esquema, cuando lo hay, con la referencia al legajo (06, 08, 09) o a la decisión
  que la fija. Los comentarios se citan como están en el código; algunos usan términos en inglés: «append-only» (solo
  se agrega), «allowlist» (lista blanca), «timeline» (línea de tiempo), «domain-agnostic» (independiente del dominio).
  Donde el esquema no tiene comentario, el diccionario lo dice.

#for v in vistas {
  heading(level: 2, [#v.id · #v.titulo])
  for n in v.modelos { ficha-modelo(modelo(n)) }
}

== Enumeraciones

#{
  set text(size: 10pt, hyphenate: false)
  table(
    columns: (30%, 35%, 35%),
    table.header([Enumeración], [Valores], [Descripción]),
    ..esq.enums.map(e => (
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", corte(e.nombre)),
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", e.valores.map(x => corte(x.valor)).join(", ")),
      if e.at("doc", default: none) != none { con-codigo(e.doc) } else { text(fill: tinta-suave, "—") },
    )).flatten(),
  )
}
