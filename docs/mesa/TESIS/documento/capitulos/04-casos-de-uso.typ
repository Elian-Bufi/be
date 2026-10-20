#import "../plantilla.typ": *

// Las fichas salen del documento canónico 05 v0.15 (datos/casos-de-uso.json, extraído sin reescribir) y el estado de
// datos/estado.json. Donde el 05 no declara un campo, la ficha lo dice y muestra de dónde sale lo que se presenta.
#let casos = json("../../datos/casos-de-uso.json").casos
#let est = json("../../datos/estado.json")
#let caso(id-caso) = casos.find(c => c.id == id-caso)

#let PAQUETES = (
  (titulo: "Acceso y cuenta", vista: "CU-01", casos: ("UC-P25", "UC-P26", "UC-P27", "UC-E05", "UC-E06", "UC-E09", "UC-I11"),
    texto: [El registro de la identidad, la sesión y el cierre de la cuenta son comunes a profesionales y asesorados. El acceso con Google, la administración de métodos y la recuperación son extensiones de la sesión; la recuperación quedó fuera del alcance de esta entrega.]),
  (titulo: "Alta profesional y administración", vista: "CU-02", casos: ("UC-P01", "UC-P02", "UC-E01", "UC-P03", "UC-P28", "UC-P29", "UC-I01"),
    texto: [El legajo prevé que un profesional pida verificación y que un administrador la resuelva. Esa parte quedó fuera de esta entrega: los profesionales sintéticos se habilitan con un servicio interno (DL-036). La vista se incluye para mostrar con precisión la frontera de lo implementado.]),
  (titulo: "Vínculo y consentimiento", vista: "CU-03", casos: ("UC-P04", "UC-P05", "UC-P06", "UC-P07", "UC-P08"),
    texto: [Cómo empieza, se autoriza, cambia y termina la relación. Aceptar un vínculo no es consentir: el permiso de datos de salud es un paso propio, que la persona puede revocar con efecto hacia adelante.]),
  (titulo: "Nutrición", vista: "CU-04", casos: ("UC-P09", "UC-P10", "UC-P11", "UC-P12", "UC-P13"),
    texto: [El circuito completo: evaluación y objetivo, diseño del plan en borrador, validación y activación como versión, registro de la persona en la APK y revisión con decisión de continuidad.]),
  (titulo: "Entrenamiento", vista: "CU-05", casos: ("UC-P14", "UC-P15", "UC-P16", "UC-P17", "UC-P18", "UC-E02"),
    texto: [El mismo circuito para el entrenamiento, con la prescripción por serie y la corrección trazable de lo registrado.]),
  (titulo: "Antropometría", vista: "CU-06", casos: ("UC-P19", "UC-P20", "UC-E03", "UC-I09", "UC-P21", "UC-P22", "UC-E04"),
    texto: [La toma de mediciones con cálculos reproducibles, su corrección o anulación sin borrar y la evolución en el tiempo. Publicar y descubrir servicios antropométricos (P1) sigue pendiente.]),
  (titulo: "Seguimiento y coordinación", vista: "CU-07", casos: ("UC-P23", "UC-P24", "UC-E07", "UC-P31", "UC-S01"),
    texto: [La cartera con sus pendientes, la ficha de cada persona con la línea de tiempo y las notas entre profesionales, el progreso que ve la persona y la métrica TVCC-30.]),
  (titulo: "Información, novedades y avisos", vista: "CU-08", casos: ("UC-P32", "UC-P33", "UC-P30", "UC-E08"),
    texto: [El pedido de información pertinente con una plantilla versionada, el centro de novedades y los avisos al teléfono, que nunca llevan datos sensibles.]),
  (titulo: "Incluidos compartidos", vista: none, casos: ("UC-I02", "UC-I03", "UC-I04", "UC-I05", "UC-I06", "UC-I07", "UC-I08", "UC-I10", "UC-I12", "UC-I13"),
    texto: [Casos incluidos que invocan varios circuitos. UC-I02 (autorización) y UC-I03 (auditoría e historia) los incluye todo caso protegido; por eso no se dibujan en cada vista y se declaran en su nota.]),
)

#let lista-o(items, vacio) = if items == none or items.len() == 0 { text(fill: tinta-suave, vacio) } else { enum(..items, tight: true, numbering: "1.") }
#let viñetas-o(items, vacio) = if items == none or items.len() == 0 { text(fill: tinta-suave, vacio) } else { list(..items, tight: true, marker: [–]) }
#let alternativas(items, vacio) = if items == none or items.len() == 0 { text(fill: tinta-suave, vacio) } else {
  list(tight: true, marker: [–], ..items.map(a => [#text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 10pt, weight: 600, a.id) #a.titulo#if a.at("resultado", default: none) != none [: #a.resultado]]))
}

/// Ficha de un caso de uso con los campos que pide la escuela.
#let ficha(c) = {
  let e = est.casos.at(c.id)
  let fila(etiqueta, contenido) = (text(fill: tinta-suave, etiqueta), contenido)
  let actor = c.at("actorPrincipal", default: none)
  let secundarios = c.at("actoresSecundarios", default: ())
  let disparador = c.at("disparador", default: none)
  let origen = c.at("origenDelDisparador", default: none)
  let flujo = c.at("flujo", default: ())
  let post = c.at("postcondiciones", default: ())
  let cierre = c.at("cierre", default: none)
  block(width: 100%, above: 14pt, below: 6pt, breakable: true, {
    block(breakable: false, below: 4pt, stroke: (top: 1pt + azul), inset: (top: 6pt), grid(
      columns: (auto, 1fr, auto),
      column-gutter: 8pt,
      align: (left + horizon, left + horizon, right + horizon),
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", weight: 600, size: 10.5pt, fill: azul, c.id),
      [#text(weight: 600, size: 10.5pt, c.nombre) #text(size: 10pt, fill: tinta-suave)[· #lower(c.at("tipo", default: "")) · #c.at("canal", default: "") · 05 §#c.seccion05]],
      estado(e.estado),
    ))
    set text(size: 10pt, hyphenate: false)
    set par(justify: false)
    grid(
      columns: (31mm, 1fr),
      column-gutter: 8pt,
      row-gutter: 5pt,
      ..fila("Objetivo", c.objetivo),
      ..fila("Actores", [
        *Principal:* #if actor != none { actor } else { text(fill: tinta-suave)[el 05 no lo declara: lo ejecuta el caso que lo invoca (Sistema BE)] }
        #if secundarios != none and secundarios.len() > 0 [ · *secundarios:* #secundarios.join(" ")]
      ]),
      ..fila("Disparador", if disparador != none {
        [#disparador #if origen == "invocado" { text(fill: tinta-suave, size: 10pt)[(«invocado por», en el 05)] } else if origen == "extension" { text(fill: tinta-suave, size: 10pt)[(«condición de extensión», en el 05)] }]
      } else if flujo.len() > 0 {
        [#text(fill: tinta-suave)[El 05 no declara un disparador; el flujo empieza así:] «#flujo.first()»]
      } else { text(fill: tinta-suave, "No declarado en el 05.") }),
      ..fila("Precondiciones", lista-o(c.at("precondiciones", default: ()), "El 05 no declara precondiciones para este caso.")),
      ..fila("Flujo principal", lista-o(flujo, "—")),
      ..fila("Alternativas", alternativas(c.at("variantes", default: ()), "El 05 no define variantes para este caso.")),
      ..fila("Excepciones", alternativas(c.at("excepciones", default: ()), "El 05 no define excepciones para este caso.")),
      ..fila("Postcondiciones", if post != none and post.len() > 0 { viñetas-o(post, "") } else if cierre != none {
        [#text(fill: tinta-suave)[El 05 no declara postcondiciones; su criterio de cierre dice:] «#cierre»]
      } else { text(fill: tinta-suave, "No declaradas en el 05.") }),
      ..fila("Requisitos", c.rf.map(id).join(", ")),
      ..fila("Relaciones", {
        let partes = ()
        let inc = c.at("incluidos", default: ())
        let ext = c.at("extendidos", default: ())
        if inc != none and inc.len() > 0 { partes.push([incluye #inc.map(id).join(", ")]) }
        if ext != none and ext.len() > 0 { partes.push([lo extiende #ext.map(id).join(", ")]) }
        if partes.len() > 0 { partes.join(" · ") } else { text(fill: tinta-suave, "—") }
      }),
      ..fila("Implementación", [#estado(e.estado)#if e.nota != "" [ #e.nota] · #c.evidencia.pruebas.len() archivo#if c.evidencia.pruebas.len() != 1 [s] de prueba #if c.evidencia.pruebas.len() == 1 [lo cita] else [lo citan]]),
    )
  })
}

= Casos de uso

Los casos de uso son los 56 del documento canónico 05 (versión 0.15): 33 principales, 13 incluidos, 9 de extensión y 1
de soporte. Las fichas reproducen el 05 sin reescribirlo; esta tesis agrega a cada una su estado en la implementación.
Los diagramas siguen UML 2.5.1: el rectángulo es el límite del sistema; las líneas continuas, asociaciones entre un actor
y un caso; las discontinuas con flecha, relaciones «include» (el caso base incluye siempre al otro) o «extend» (el caso
que extiende agrega conducta al caso base bajo una condición, y la flecha apunta al base). Cada elipse lleva el
identificador y un rótulo corto; el nombre completo está en su ficha.

== Actores

#table(
  columns: (auto, 1fr, auto, auto),
  table.header([Actor], [Quién es y qué hace en BE], [Superficie], [Estado]),
  [Asesorado], [Persona con seguimiento profesional, titular de sus datos: consulta su plan, registra, ve su evolución y decide sus vínculos y permisos.], [APK y website], estado("implementado"),
  [Profesional], [De Nutrición, de Entrenamiento o con capacidad antropométrica (transversal). Evalúa, planifica, revisa y coordina dentro de su alcance.], [Website], estado("implementado"),
  [Administrador], [Verificaría profesionales y resolvería incidencias, sin intervenir en lo clínico.], [Website], estado("fuera"),
  [Sistema BE], [Ejecuta los casos incluidos (autorización, auditoría, cálculos) y la métrica TVCC-30.], [API], estado("implementado"),
  [Responsable de validación], [Corre la TVCC-30, que en BE es un comando interno sin HTTP.], [—], estado("implementado"),
  [Servicios externos], [Google (identidad), Open Food Facts y wger (catálogos), Expo Push (avisos al teléfono por Firebase).], [—], estado("implementado"),
)

== Vista general

La figura muestra los 56 casos agrupados en ocho paquetes y una franja de incluidos compartidos. Profesional y asesorado
participan en los ocho paquetes, por eso no se trazan sus líneas en esta vista; los sistemas externos y el administrador
se asocian a su paquete. Cada paquete indica en su solapa la vista de detalle.

#pagina-apaisada[
  #lamina("CU-00", "Vista general de los casos de uso", alcance: "56 casos en ocho paquetes y los incluidos compartidos, con su estado", fuente: "05 v0.15 y datos/estado.json", etiqueta: "fig-cu-general")
]

== Vistas por módulo y fichas

Cada módulo se presenta con su diagrama y, a continuación, las fichas de sus casos. En cada diagrama se dibuja el actor
principal de cada caso; los actores secundarios figuran en las fichas.

#for p in PAQUETES {
  heading(level: 3, p.titulo)
  p.texto
  if p.vista != none {
    let n = json("../../laminas/revision.json").at(p.vista)
    if n.ancho > 600 {
      pagina-apaisada(lamina(p.vista, "Casos de uso · " + p.titulo, fuente: "05 v0.15 y datos/estado.json"))
    } else {
      lamina(p.vista, "Casos de uso · " + p.titulo, alcance: "Página vertical: sus nueve casos incluidos y de extensión no entran a 10 pt en una apaisada", fuente: "05 v0.15 y datos/estado.json")
    }
  }
  for id-caso in p.casos { ficha(caso(id-caso)) }
}

== Correspondencia entre diagramas, fichas y producto

#table(
  columns: (auto, 1fr, auto, auto, auto),
  table.header([Caso], [Nombre (05)], [Vista], [Estado], [Pruebas que lo citan]),
  ..PAQUETES.map(p => p.casos.map(idc => {
    let c = caso(idc)
    (id(idc), c.nombre, if p.vista != none { p.vista } else { "compartido" }, estado(est.casos.at(idc).estado), str(c.evidencia.pruebas.len()))
  })).flatten(),
)
