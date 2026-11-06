// Selección del material visual en PDF: las tres imágenes reales en grande, con sus recortes en BE; la maqueta del
// encuadre, marcada como maqueta; y las fichas sin imagen (las 66 recetas, por familia, remiten a la hoja de contacto y
// al recetario de EVIDENCIA/RECETAS-AMPLIACION). Los datos y los conteos salen de ../inventario.json. Se compila desde
// la raíz del repositorio (ver ../LEEME.md).
#import "../../../docs/guias/ENTENDER-BE/comun/plantilla.typ": *

#show: documento.with(titulo-corto: "BE · Material visual")

#let inv = json("../inventario.json")
#let reales = inv.contenidos.filter(x => x.archivoReal != none)
#let sin-imagen = inv.contenidos.filter(x => x.archivoReal == none)
#let de-tipo(t) = inv.contenidos.filter(x => x.tipo == t)
#let con-imagen(t) = de-tipo(t).filter(x => x.archivoReal != none).len()
#let R = inv.resumen
#let ETIQUETA-ESTADO = (RAW: "Crudo", COOKED: "Cocido", AS_PURCHASED: "Tal como se adquiere")
#let navy = rgb("#011325")
#let chip(texto, tinta, fondo-chip) = box(fill: fondo-chip, inset: (x: 6pt, y: 3pt), radius: 8pt, baseline: 2pt, text(size: 9pt, weight: 650, fill: tinta, texto))
#let chip-real = chip("Imagen real", rgb("#0f7a5c"), rgb("#e3f5ee"))
#let chip-ficha = chip("Sin imagen: ficha y prompt", rgb("#8a5a00"), rgb("#fdf3dd"))
#let chip-maqueta = chip("Maqueta · no es una foto", rgb("#6b3fc4"), rgb("#f1ebfd"))

// Un recorte como lo muestra BE: la imagen entera (contain) sobre blanco, dentro de una caja del tamaño real.
#let recorte(ruta, ancho, alto, rotulo, sobre: white) = box(width: ancho + 12pt)[
  #block(fill: sobre, stroke: 0.6pt + borde, inset: 6pt, radius: 4pt, width: ancho + 12pt)[
    #block(fill: white, radius: 3pt, width: ancho, height: alto, clip: true, align(center + horizon, image(ruta, width: ancho, height: alto, fit: "contain")))
  ]
  #text(size: 9pt, fill: tinta-suave, rotulo)
]

// ─── Portada y resumen ──────────────────────────────────────────────────────────────────────────────────────
#lamina(
  nivel: "Material visual",
  pregunta: "¿Qué material visual hay, y qué falta?",
  bajada: [#inv.contenidos.len() contenidos para Nutrición y Entrenamiento: #reales.len() con imagen real y #sin-imagen.len() con su ficha y su prompt, sin imagen.],
  lateral: [
    #ojo("No hay imágenes nuevas")[Las sesiones del 27/10 y del 28/10 no tenían una herramienta para generar imágenes, y
      los encargos no autorizan contratar una. Las tres imágenes reales son las del paquete de Dirección del 2026-10-06.
      Todo lo demás es una ficha con su prompt: no es una imagen.]
    #v(4pt)
    #set text(size: 9.5pt)
    *Lo que hace falta decidir*
    + Generar las #R.recetas fotos de recetas con el paquete de generación (EVIDENCIA/RECETAS-AMPLIACION), y las de alimentos y ejercicios con sus fichas.
    + El tamaño de las fotos de recetas: si la herramienta entrega 1536 × 1024, la herramienta de fotos recorta a 4:3, reescala a 1600 × 1200 y lo dice.
    + Los doce ejercicios del catálogo de WP-06 no pueden tener imagen hoy: solo los propios de un profesional.
    + Tres implementos inferidos: la «Sentadilla» con barra, el «Press con mancuernas» en banco plano y la «Extensión
      de tríceps» con una mancuerna sobre la cabeza.
    + Los alimentos no tienen dónde mostrarse en BE.
    + Las imágenes de wger son CC BY-SA: obligan a atribuir y a compartir igual.
  ],
)[
  #table(
    columns: (1fr, auto, auto, auto),
    table.header([Contenido], [Total], [Con imagen real], [Ficha y prompt]),
    [Recetas (#R.recetasOriginales originales y #R.recetasNuevas nuevas)], [#R.recetas], [#con-imagen("receta")], [#(R.recetas - con-imagen("receta"))],
    [Alimentos del catálogo base], [#R.alimentos], [#con-imagen("alimento")], [#(R.alimentos - con-imagen("alimento"))],
    [Ejercicios], [#R.ejercicios], [#con-imagen("ejercicio")], [#(R.ejercicios - con-imagen("ejercicio"))],
    [*Total*], [*#inv.contenidos.len()*], [*#reales.len()*], [*#sin-imagen.len()*],
  )
  #v(6pt)
  *Cómo se ve cada tipo en BE,* leído en el código:
  #set text(size: 9.5pt)
  #table(
    columns: (auto, 1fr, 1fr),
    table.header([Tipo], [Website], [APK]),
    [Receta], [4:3, recortada al centro, hasta 28rem.], [16:10, recortada al centro.],
    [Ejercicio], [5:6, entera; cuadrada en «Mis ejercicios».], [Entera sobre blanco: 112 dp en la sesión, 64 dp en el plan, 1:1 en «Ver técnica».],
    [Alimento], [No se muestra.], [No se muestra.],
  )
  #v(4pt)
  El servidor guarda todo en JPEG de calidad 82, hasta 1600 px en el lado mayor, sin agrandar, y aplana la
  transparencia sobre blanco. Por eso las fichas nuevas piden fondo blanco.
]

// ─── Las tres imágenes reales ───────────────────────────────────────────────────────────────────────────────
#for x in reales [
  #lamina(
    nivel: "Material visual",
    pregunta: x.nombre,
    bajada: [Imagen real del paquete del 2026-10-06, generada con IA. La revisión profesional de la técnica está pendiente.],
  )[
    #let ruta = "../../../" + x.archivoReal.ruta
    #grid(
      columns: (auto, 1fr),
      column-gutter: 8mm,
      block(fill: white, stroke: 0.6pt + borde, radius: 4pt, inset: 6pt, image(ruta, height: 104mm)),
      [
        #chip-real
        #v(4pt)
        #set text(size: 9.5pt)
        #table(
          columns: (auto, 1fr),
          [Archivo], raw(x.archivo),
          [Original], [PNG #x.archivoReal.ancho × #x.archivoReal.alto, #calc.round(x.archivoReal.bytes / 1024) KB],
          [SHA-256], text(size: 8pt, raw(x.archivoReal.sha256)),
          [Procedencia], [Generada con IA para el paquete de Dirección. Sin licencia de terceros; no muestra a una persona real.],
          [Revisión], [#x.estadoDeRevision.replace("_", " ")],
        )
        #v(4pt)
        *Los recortes reales,* con la imagen entera sobre blanco, como en BE:
        #v(2pt)
        #recorte(ruta, 31mm, 31mm, "APK · sesión · 112 dp", sobre: navy)
        #h(3mm)
        #recorte(ruta, 18mm, 18mm, "APK · plan · 64 dp", sobre: navy)
        #h(3mm)
        #recorte(ruta, 30mm, 36mm, "Website · 5:6")
        #v(4pt)
        #for o in x.observaciones [- #o]
      ],
    )
  ]
]

// ─── La maqueta ─────────────────────────────────────────────────────────────────────────────────────────────
#lamina(
  nivel: "Material visual",
  pregunta: "¿Dónde tiene que quedar el plato en una foto de receta?",
  bajada: [Una maqueta del encuadre, para generar o sacar las #R.recetas fotos de recetas. No es una foto.],
)[
  #chip-maqueta
  #v(4pt)
  #align(center, image("../encuadre-de-recetas.svg", height: 146mm))
]

// ─── Las fichas sin imagen ──────────────────────────────────────────────────────────────────────────────────
// Un código corto por contenido (R01, A01, E04), el nombre y, en los alimentos, el estado exacto. El formato pedido es
// el mismo para todos los de un tipo, así que se dice una vez.
#let codigo(x) = if x.tipo == "receta" { x.codigo } else { x.archivo.slice(0, 3) }
#let tabla-de(tipo) = {
  let items = sin-imagen.filter(x => x.tipo == tipo)
  set text(size: 9.5pt)
  table(
    columns: (auto, 1fr),
    table.header([Código], [Contenido]),
    ..items.map(x => (raw(codigo(x)), [#x.nombre#if x.at("estado", default: none) != none [ · _#ETIQUETA-ESTADO.at(x.estado, default: x.estado)_]])).flatten(),
  )
}

#lamina(
  nivel: "Material visual",
  pregunta: "¿Qué contenidos tienen ficha, pero no imagen?",
  bajada: [Los #sin-imagen.len(). Cada ficha tiene su prompt completo en EJERCICIOS.md, RECETAS.md y ALIMENTOS.md, y su recorte leído en el código.],
)[
  #chip-ficha
  #v(4pt)
  #grid(
    columns: (1fr, 1.25fr, 1.25fr),
    column-gutter: 5mm,
    [
      *Ejercicios (12)*
      #text(size: 9pt, fill: tinta-suave)[Vertical 5:6, al menos 1000 × 1200 px, sobre blanco. Hoy solo un ejercicio propio de
        un profesional puede llevar imagen.]
      #tabla-de("ejercicio")
    ],
    [
      *Recetas (#(R.recetas - con-imagen("receta")) sin foto, de #R.recetas)*
      #text(size: 9pt, fill: tinta-suave)[Horizontal 4:3, 1600 × 1200 px, hasta 10 MB; el plato dentro de la franja central de
        16:10. Una por una, con su estado, en la hoja de contacto y el recetario (EVIDENCIA/RECETAS-AMPLIACION/salida).]
      #{
        set text(size: 9.5pt)
        let familias = ()
        for x in de-tipo("receta") { if x.familiaNombre not in familias { familias.push(x.familiaNombre) } }
        table(
          columns: (1fr, auto, auto),
          table.header([Familia], [Orig.], [Nuevas]),
          ..familias.map(f => (f, str(de-tipo("receta").filter(x => x.familiaNombre == f and x.origen == "ORIGINAL").len()), str(de-tipo("receta").filter(x => x.familiaNombre == f and x.origen == "NUEVA").len()))).flatten(),
        )
      }
    ],
    [
      *Alimentos (16)*
      #text(size: 9pt, fill: tinta-suave)[Cuadrado 1:1, 1200 × 1200 px, propuesto: hoy BE no muestra imágenes de alimentos.]
      #tabla-de("alimento")
    ],
  )
]
