#import "../plantilla.typ": *

// Referencias: datos/referencias.json, extraído de fuentes/COMPETENCIA-2026-10-20.md y
// fuentes/REFERENCIAS-DE-NOTACION-2026-10-20.md sin reescribir el texto; las fechas se pasaron a aaaa-mm-dd.
#let r = json("../../datos/referencias.json")
#let corte(s) = text(hyphenate: false, lang: "en", s.replace(regex("([/._?=&-])"), m => m.captures.at(0) + "\u{200b}"))
// Una entrada escrita como texto (con *cursiva* y una URL): la cursiva se compone y la URL se corta sin silabeo.
#let entrada-libre(t) = {
  for (i, p) in t.split("*").enumerate() {
    if calc.odd(i) { emph(p) } else {
      let m = p.match(regex("https?://[^\s]+"))
      if m == none { p } else {
        p.slice(0, m.start)
        text(fill: tinta-suave, corte(m.text))
        p.slice(m.end)
      }
    }
  }
}

= Referencias

== El legajo del proyecto

Los documentos canónicos están en `docs/legajo` y mandan sobre cualquier otro documento, incluido este. Las versiones
vigentes en la versión de referencia son:

#table(
  columns: (12mm, 1fr, 26mm),
  table.header([N.º], [Documento], [Versión]),
  [00], [Gobierno del legajo], [—],
  [01], [Sumario ejecutivo], [1.0-I],
  [02], [Visión, alcance y plan estratégico], [0.2.1],
  [03], [Modelo de negocio], [0.2.1],
  [04], [Requisitos: 69 RF activos y 38 RNF], [0.4.2.1],
  [05], [Casos de uso: 56], [0.15],
  [06], [Modelo de dominio], [0.1.1],
  [07], [Arquitectura y despliegue], [0.1.11],
  [08], [Seguridad, privacidad y gobernanza], [0.1.5],
  [09], [Contratos de API: 122 operaciones P0], [0.16.1],
  [10], [Experiencia de usuario y prototipos], [—],
  [11A], [Plan y estrategia de pruebas], [1.0-H],
  [12], [Trazabilidad y especificación de la TVCC-30], [1.0-H],
)

Además se citan: `docs/DEUDA_LEGAJO.md` (decisiones), `docs/DESPLIEGUE.md` (despliegue), `docs/mesa/MESA_02` (los
entregables derivados del legajo: DV-03 a DV-11) y los paquetes de trabajo de `docs/paquetes`.

== Notación y estándares

Lo que aportó cada referencia a las figuras. «Abierta» indica si la página se pudo leer; lo que no se pudo abrir no se
da por consultado.

#{
  set text(size: 10pt)
  table(
    columns: (40mm, 16mm, 1fr),
    table.header([Fuente], [Abierta], [Qué se tomó]),
    ..r.notacion.map(x => ([#x.fuente #if x.url != none [#linebreak() #text(fill: tinta-suave, size: 10pt, corte(x.url))]], x.abierta, x.tomado.replace("`", ""))).flatten(),
  )
}

== Competencia y mercado

Las fuentes del análisis de mercado y de la comparación con la competencia (apartado 2), todas consultadas el
2026-10-20. Entre paréntesis, la fecha de la página cuando la tiene. Las entradas marcadas con (†) son artículos de
centros de ayuda que respondieron 403 a la página web: se leyeron por la API pública del mismo centro de ayuda, ese
mismo día. En el apartado 2 se citan como [C1] a [C#r.competencia.len()].

#{
  set text(size: 10pt)
  set par(justify: false)
  for x in r.competencia {
    block(below: 4pt, grid(
      columns: (12mm, 1fr),
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", fill: azul, "[C" + str(x.n) + "]"),
      if "texto" in x {
        entrada-libre(x.texto)
      } else {
        [#x.autor. _#x.titulo;_ #text(fill: tinta-suave, corte(x.url))#if x.fecha != none [ (#x.fecha)]]
      },
    ))
  }
}

=== Páginas que no se pudieron abrir

#list(..r.noSePudieronAbrir.map(x => x.replace("`", "")))

== Herramientas

#table(
  columns: (40mm, 42mm, 1fr),
  table.header([Herramienta], [Versión], [Para qué]),
  [Typst], [0.15.1], [Composición del documento y exportación de las figuras.],
  [Inter y JetBrains Mono], [4.1 y 2.304], [Tipografías (licencia OFL), copiadas en `docs/mesa/TESIS/tipografias`.],
  [Node.js], [22], [Motor de figuras, herramientas de datos y verificaciones.],
  [PostgreSQL], [16.14], [Conteo de las reglas de la base en una base temporal (apartado 6).],
  [Chrome, Edge y Puppeteer], [Chrome 155.0.8059.80; Edge 155.0.4283.62; puppeteer-core 25.12.0], [Verificaciones remotas y capturas del website en test.],
)
