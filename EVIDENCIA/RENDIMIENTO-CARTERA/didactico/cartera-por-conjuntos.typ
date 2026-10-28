// La cartera, leída por conjuntos: explicación visual para Dirección (WP-CARTERA-LECTURA-POR-CONJUNTOS, 2026-10-28).
// Fuente editable; se compila con `node construir.mjs` desde EVIDENCIA/RENDIMIENTO-CARTERA/didactico, con la plantilla
// común de las guías (docs/guias/ENTENDER-BE/comun/plantilla.typ) y el motor de láminas. Los números salen de
// datos.json (node datos.mjs <carpeta-de-resultados>).
#import "../../../docs/guias/ENTENDER-BE/comun/plantilla.typ": *

#let D = json("datos.json")
#let medido = D.estado == "medido"

// La misma plantilla de las guías, con otro pie: acá el commit de referencia es el del código medido y el cambio vive en un PR.
#let documento-cartera(titulo-corto: "", cuerpo) = {
  set document(author: "BE · Elián Bufi (Dirección)", title: titulo-corto)
  set page(
    paper: "a4",
    flipped: true,
    margin: (x: 15mm, top: 17mm, bottom: 13mm),
    fill: white,
    header: context {
      if counter(page).get().first() > 1 {
        set text(size: 9pt, fill: tinta-suave)
        grid(columns: (1fr, auto), align: (left, right), [Explicación visual · WP-CARTERA-LECTURA-POR-CONJUNTOS], titulo-corto)
        v(-4pt)
        line(length: 100%, stroke: 0.6pt + borde)
      }
    },
    footer: context {
      set text(size: 9pt, fill: tinta-suave)
      grid(
        columns: (1fr, auto),
        align: (left, right),
        [Código medido: #raw(version.commitCorto) (`main`) · propuesta en el PR \#222 (rama `wp-cartera-lectura-por-conjuntos`) · medición #if medido { raw(str(D.corrida)) } else { [sin correr] } · solo datos sintéticos],
        counter(page).display("1"),
      )
    },
  )
  set text(font: "Inter", size: 10.5pt, fill: tinta, lang: "es", region: "AR", hyphenate: false)
  set par(leading: 0.62em, spacing: 0.9em, justify: false)
  show raw: set text(font: "JetBrains Mono", size: 9pt, ligatures: false, features: (calt: 0))
  show raw.where(block: true): it => block(fill: fondo, stroke: 0.6pt + borde, inset: 7pt, radius: 3pt, width: 100%, it)
  show heading.where(level: 1): it => none
  show heading.where(level: 2): it => text(size: 18pt, weight: 700, fill: tinta, it.body)
  show heading.where(level: 3): set text(size: 13pt, weight: 650)
  show strong: set text(weight: 650)
  set table(stroke: 0.6pt + borde, inset: (x: 6pt, y: 4.5pt))
  show table.cell.where(y: 0): set text(weight: 650, fill: tinta)
  set list(indent: 2pt, body-indent: 6pt, spacing: 0.55em)
  set enum(indent: 2pt, body-indent: 6pt, spacing: 0.55em)
  cuerpo
}

#let diagrama-ca(id, ancho: 100%, epigrafe: none) = figure(
  image("laminas/generado/" + id + ".svg", width: ancho),
  caption: if epigrafe == none { none } else { text(size: 9pt, fill: tinta-suave)[*#id.* #epigrafe] },
  supplement: none,
  numbering: none,
  gap: 5pt,
)

#let num(n) = if n == none { "—" } else { str(calc.round(n)) }
#let pc(n) = if n == none { "—" } else if n > 0 { "+" + str(n) + " %" } else { str(n) + " %" }
#let fila-de(e) = D.filas.find(f => f.escenario == e)

#show: documento-cartera.with(titulo-corto: "BE · La cartera, leída por conjuntos")

// ─── Portada ─────────────────────────────────────────────────────────────────────────────────────────────────
#page(header: none)[
  #v(3mm)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 14pt,
    align: horizon,
    image("../../../apps/mobile/assets/isotipo.png", width: 22mm),
    {
      text(size: 30pt, weight: 700, "La cartera, leída por conjuntos")
      linebreak()
      text(size: 15pt, weight: 600, fill: tinta-suave, "Qué se cambió en la lectura de pendientes, qué se conserva y qué demostró la medición")
      v(2pt)
      line(length: 56pt, stroke: 3pt + acento)
    },
  )
  #v(4mm)
  #grid(
    columns: (1.2fr, 1fr),
    column-gutter: 12mm,
    [
      #set text(size: 11pt)
      *En una frase.* La cartera del profesional (la lista de pendientes, API-CAR-01) hacía, en cada página, cinco a siete
      consultas a la base por cada persona y área. Ahora hace una consulta por tipo de hecho para toda la cartera, acotada a
      lo que el PDP permitió. Los permisos, la auditoría, el contenido y el orden no cambian: lo comprueba una prueba que
      compara, byte a byte, la respuesta nueva con una copia congelada de la anterior.

      #if medido {
        let s = fila-de("S-B200")
        let h = fila-de("S-H200")
        [*Lo que midió* (misma máquina, mismo proceso, las dos versiones alternadas): con 200 personas, la mediana de una
        página pasó de #num(s.p50.base) a #num(s.p50.propuesta) ms (#pc(s.p50.delta)); con historia, de #num(h.p50.base) a
        #num(h.p50.propuesta) ms (#pc(h.p50.delta)). #if D.erroresTotales == 0 [Cero errores.] else [*#D.erroresTotales pedidos con error.*]
        El detalle, con sus condiciones y límites, en la lámina 6.]
      } else {
        [*La medición todavía no corrió:* la lámina 6 se completa con sus resultados.]
      }

      *Para quién.* Para Dirección: entender el mecanismo y aprender a pedir y evaluar este tipo de trabajo. Cada lámina
      responde una pregunta; la columna de la derecha trae los conceptos, con su nombre técnico y su traducción.
    ],
    block(fill: fondo, inset: 10pt, radius: 3pt, width: 100%)[
      #set text(size: 10pt)
      *Qué es.* Una explicación visual de un cambio de rendimiento acotado, no una guía nueva ni parte de la tesis.

      *De dónde sale.* El código de `main` #raw(version.commitCorto) (la versión anterior) y el PR \#222 (la propuesta);
      la segunda medición de la cartera (`EVIDENCIA/RENDIMIENTO-CARTERA/CONCURRENCIA.md`) y la medición antes/después de
      esta tanda (`LECTURA-POR-CONJUNTOS.md`).

      *Cómo se arma.* Fuente Typst y láminas generadas desde código con el motor de las guías: ningún diagrama es una
      imagen generativa. Solo datos sintéticos.

      *Para comprobar.* Tres preguntas en la última lámina; las respuestas, aparte, en `RESPUESTAS.md`.
    ],
  )
  #v(4mm)
  #block(width: 100%, stroke: (top: 0.8pt + borde), inset: (top: 5pt))[
    #text(size: 10pt, weight: 650, fill: tinta-suave, "LÁMINAS")
    #v(-2pt)
    #set text(size: 9.5pt)
    #show outline.entry.where(level: 2): it => block(above: 3pt, below: 1pt, grid(columns: (1fr, auto), column-gutter: 6pt, link(it.element.location(), it.body()), it.page()))
    #columns(2, gutter: 8mm, outline(title: none, depth: 2))
  ]
]

// ─── 1. El recorrido ─────────────────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "1 · ¿Cómo se construye la cartera, de la pantalla a la base?",
  bajada: [Un pedido de una página recorre el website, el controlador y cuatro pasos de la lectura. El website pide hasta cuatro páginas al abrir el espacio profesional, y cada una repite los cuatro pasos.],
  lateral: [
    #concepto("Pendiente", criollo: [Algo que el profesional tiene que atender: una revisión vencida, un plan en borrador, una persona sin plan, un formulario sin responder, una evaluación en preparación.], en-be: [Siete tipos (`TipoDePendiente`). No se guardan: se calculan en cada lectura a partir de hechos que ya existen.])
    #concepto("PDP (punto de decisión)", criollo: [El único lugar que decide si este profesional puede ver a esta persona en esta área. Decide de nuevo en cada pedido y deja escrita cada decisión.], en-be: [`PdpService.decidirPorAlcance`: una transacción por persona, con bloqueos compartidos, los hechos de las siete dimensiones y tres filas en `decision_de_acceso`.])
    #concepto("Cursor de paginación", criollo: [Un marcador opaco que dice «seguí después de este ítem».], en-be: [La clave del último ítem servido (tipo, dominio, persona), en base64url. Si la lista cambió y la clave ya no está, 400 `INVALID_CURSOR`.])
  ],
)[
  #diagrama-ca("CA-01", epigrafe: [El recorrido de una página. Los pasos 1 y 2 no cambian con la propuesta; el 3 es el que se lee por conjuntos; el 4 es en memoria.])
  #v(2pt)
  #set text(size: 9.5pt)
  - *Personas y pendientes no son lo mismo.* Una persona con Nutrición y Entrenamiento puede aportar cuatro pendientes; otra, ninguno. Por eso la paginación corta la lista de pendientes ya ordenada, no la lista de personas: paginar personas antes de calcular cambiaría el orden por urgencia y la cobertura de cada página.
  - *Cada página repite todo.* La segunda página, pedida con el cursor, vuelve a decidir con el PDP por cada persona y a leer todos los hechos: cuesta lo mismo que la primera y deja las mismas filas de decisión. No lo cambia esta propuesta (ver lámina 7).
  #referencias("apps/web/src/app/pro/espacio-profesional.tsx", "apps/api/src/cartera/cartera.controller.ts", "apps/api/src/cartera/lectura-cartera.ts")
]

// ─── 2. Dónde se repetía trabajo ─────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "2 · ¿Dónde se repetía trabajo?",
  bajada: [En el paso 3. La base ejecutaba cada consulta en microsegundos; lo caro era la cantidad de viajes de ida y vuelta, uno detrás del otro.],
  lateral: [
    #concepto("Ida y vuelta (round trip)", criollo: [Mandar una consulta y esperar su respuesta. Aunque la consulta sea trivial, el viaje tiene un costo fijo; mil viajes chicos tardan más que uno grande.], en-be: [Con 200 personas, el paso 3 hacía 1.320 viajes que sumaban 21 ms de ejecución en PostgreSQL y 880 ms de reloj (CONCURRENCIA.md).])
    #concepto("N+1", criollo: [El patrón de «una consulta para la lista y después una por cada elemento». El costo crece con la cantidad de elementos aunque cada consulta sea rápida.], en-be: [Una consulta de vínculos y, por cada par (persona, área), cinco a siete consultas más: el plan y su versión efectiva, el borrador, el Proceso, la expectativa, la solicitud y la actividad.])
    #concepto("Transacción abierta esperando", criollo: [La conexión a la base queda ocupada mientras la API piensa qué pedir después; nadie más la usa en ese rato.], en-be: [`idle_in_transaction_time`: cerca de la mitad del tiempo de una página con 200 personas era la conexión esperando a la API.])
  ],
)[
  #diagrama-ca("CA-02", epigrafe: [Un ejemplo chico: tres personas y cuatro pares. Con 200 personas, el mismo dibujo tiene unos 300 pares.])
  #v(2pt)
  #set text(size: 9.5pt)
  #table(
    columns: (auto, auto, auto, auto),
    align: (left, right, right, right),
    [Cartera], [Pares (persona, área)], [Consultas del paso 3, antes], [Consultas del paso 3, después],
    [3 personas del ejemplo], [4], [21 (6 ó 7 por par)], [≈ 11],
    [50 personas, perfil base], [75], [≈ 500], [≈ 11],
    [200 personas, perfil base], [300], [≈ 1.320 (medido)], [≈ 11],
    [200 personas con historia], [350], [≈ 2.000 (medido)], [≈ 11],
  )
  #referencias("test/integration/soporte-cartera-anterior.ts (la copia congelada de la lectura anterior)")
]

// ─── 3. La propuesta ─────────────────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "3 · ¿Cómo funciona la propuesta y qué conserva?",
  bajada: [Pedir de una vez, para toda la cartera, cada tipo de hecho; después, armar en memoria los hechos de cada par, en el mismo orden de siempre.],
  lateral: [
    #concepto("Consulta por conjuntos", criollo: [Pedir de una vez los datos necesarios de varias personas autorizadas, en lugar de pedirlos de a una.], en-be: [`leerHechosPorConjuntos`: cada consulta recibe la lista de asesorados que el PDP permitió *en ese alcance* (`ids[alcance]`). Lo no permitido no se lee: no se trae de más para filtrar después.])
    #concepto("DISTINCT ON", criollo: [«De cada grupo, dame solo la primera fila según este orden». Devuelve una fila por par aunque haya muchos borradores.], en-be: [El borrador pendiente de cada plan: el más antiguo posterior a la activación vigente, una consulta por alcance de plan.])
    #concepto("GROUP BY", criollo: [Agrupar filas por una clave y resumir cada grupo: cuántas hay y cuál es la última.], en-be: [La actividad del período por asesorado: comidas sin anular, sesiones y tomas registradas, con `_count` y `_max`.])
  ],
)[
  #diagrama-ca("CA-03", epigrafe: [La lectura por conjuntos. Las cinco consultas de la izquierda son, en total, unas once sentencias; la lista final es la misma.])
  #v(2pt)
  #set text(size: 9.5pt)
  *Qué conserva, y cómo se sabe.* El contrato (`CarteraResponse`), el contenido, el orden (`ordenarPendientes`, el mismo, sobre la misma lista de entrada), los filtros, el límite y el cursor; los permisos (el paso 2 no cambia); la auditoría (las mismas tres filas por persona y pedido); y una sola transacción de lectura, más corta. Una prueba de integración compara, en cada consulta posible, la respuesta nueva con la de la copia congelada de la lectura anterior: tienen que ser iguales byte a byte, también después de revocar un consentimiento, pausar, reanudar o finalizar un vínculo. Otra cuenta las sentencias de un pedido con 6 y con 12 personas: la diferencia tiene que ser exactamente la del PDP.
  #referencias("apps/api/src/cartera/lectura-cartera.ts", "apps/api/src/proceso/proceso.service.ts", "test/integration/cartera-por-conjuntos.int-spec.ts")
]

// ─── 4. Permisos y transacciones ─────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "4 · ¿Qué pasa con los permisos y las transacciones?",
  bajada: [Nada cambia en cómo se decide ni en cuándo. La decisión sigue siendo por persona, en su propia transacción, antes de leer; la lectura nunca decidió nada.],
  lateral: [
    #concepto("Transacción", criollo: [Un paquete de operaciones que vale entero o no vale: o se confirma todo (COMMIT) o se deshace todo.], en-be: [Cada decisión del PDP es una transacción: si no se puede registrar la decisión, no hay acceso (UC-I02 E06). La lectura de hechos es otra transacción, solo de lectura.])
    #concepto("Bloqueo compartido y exclusivo", criollo: [Compartido: «estoy mirando esto, no me lo cambies». Exclusivo: «lo voy a cambiar, esperen». Varios compartidos conviven; un exclusivo espera a todos.], en-be: [`be_bloquear_lo_que_corta` toma en modo compartido las filas que pueden cortar el acceso; revocar, pausar, finalizar o suspender las toman en modo exclusivo. Una decisión queda antes o después de cada corte, nunca en el medio.])
    #concepto("READ COMMITTED", criollo: [El nivel de aislamiento por omisión de PostgreSQL: cada sentencia ve lo confirmado hasta ese instante.], en-be: [La transacción de lectura siempre fue READ COMMITTED: con menos sentencias adentro, la foto es más corta en el tiempo, no una garantía distinta.])
  ],
)[
  #diagrama-ca("CA-04", epigrafe: [Las dos versiones, una arriba de la otra: el paso 2 es idéntico; solo la lectura se acorta.])
  #v(2pt)
  #set text(size: 9.5pt)
  #ojo("Lo que sí cambiaría una garantía, y por eso queda como propuesta")[
    Decidir las 200 personas en *una sola* transacción (la alternativa 2 de CONCURRENCIA.md) ahorraría 199 confirmaciones al disco, pero retendría los bloqueos compartidos de toda la cartera durante toda la decisión: un corte que llegue en el medio esperaría más, y las 200 decisiones tendrían el mismo instante. Es una decisión de Dirección sobre la pieza de autorización (08 §27), no una optimización.
  ]
  #referencias("apps/api/src/autorizacion/pdp.service.ts", "prisma/concurrencia.ts", "prisma/migrations/20261003000000_pdp_bloqueos_en_una_llamada")
]

// ─── 5. Las mediciones ───────────────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "5 · ¿Qué demostraron las mediciones y qué sigue sin saberse?",
  bajada: if medido [Las dos versiones corrieron alternadas en la misma máquina de GitHub (#D.maquina), el mismo proceso y las mismas carteras, en la corrida #raw(str(D.corrida)). #if D.versionesOk [Cada lote comprobó qué versión tenía puesta.] else [*Algún lote no tenía la versión esperada.*]] else [La medición todavía no corrió.],
  lateral: [
    #concepto("p50 y p95", criollo: [La mediana (la mitad de los pedidos tardó menos) y el percentil 95 (el 95 % tardó menos): el caso típico y la cola.], en-be: [La cola sale del PDP, que no cambia: por eso el p95 baja menos que el p50.])
    #concepto("Bucle cerrado", criollo: [Cada cliente pide la página siguiente apenas recibe la anterior, sin pausa. Mide cómo se reparte la máquina, no cuántas personas reales aguanta.], en-be: [C1, C3 y C5: uno, tres y cinco profesionales, cada uno con su cartera de 200.])
    #concepto("Variación entre repeticiones", criollo: [Cuánto difiere la misma versión consigo misma en dos corridas: el piso de ruido. Una mejora menor que ese piso no es una mejora.], en-be: [Cada escenario corrió dos veces por versión; la columna «ruido» es la diferencia de la base entre sus dos repeticiones.])
  ],
)[
  #set text(size: 9.5pt)
  #if medido [
    #table(
      columns: (auto, auto, auto, auto, auto, auto, auto, auto, auto),
      align: (left, right, right, right, right, right, right, right, right),
      [Escenario (200 personas salvo aclaración)], [Pedidos por versión], [p50 base (ms)], [p50 propuesta (ms)], [Δ p50], [Δ p50 r1 · r2], [Ruido de la base], [p95 base → propuesta], [Páginas/s base → propuesta],
      ..for f in D.filas {
        (
          [#f.que],
          [#f.pedidos.base],
          [#num(f.p50.base)],
          [#num(f.p50.propuesta)],
          [*#pc(f.p50.delta)*],
          [#pc(f.p50.r1) · #pc(f.p50.r2)],
          [#pc(f.variacionDeLaBase)],
          [#num(f.p95.base) → #num(f.p95.propuesta) (#pc(f.p95.delta))],
          if f.paginasPorSegundo.base == none [—] else [#str(f.paginasPorSegundo.base) → #str(f.paginasPorSegundo.propuesta)],
        )
      }
    )
    #v(3pt)
    #let s = fila-de("S-B200")
    #let h = fila-de("S-H200")
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 8mm,
      [
        *Dónde cambió el tiempo (200 personas, medianas por pedido).* Bloque de lectura: #num(s.lectura.base.at(0)) → #num(s.lectura.propuesta.at(0)) ms (perfil base), #num(h.lectura.base.at(0)) → #num(h.lectura.propuesta.at(0)) ms (con historia). Bloque del PDP: #num(s.pdp.base.at(0)) → #num(s.pdp.propuesta.at(0)) ms (no cambia por diseño). Sentencias por pedido: #num(s.sentencias.base) → #num(s.sentencias.propuesta) (base), #num(h.sentencias.base) → #num(h.sentencias.propuesta) (historia). COMMIT por pedido: #num(s.commits.base) → #num(s.commits.propuesta). Filas de decisión por pedido: #if s.filasDeDecision.base != none [#s.filasDeDecision.base.min a #s.filasDeDecision.base.max → #s.filasDeDecision.propuesta.min a #s.filasDeDecision.propuesta.max] else [—].
        #if D.aperturas.len() > 0 {
          let a = D.aperturas.at(0)
          [*Lo que lee el website al abrir* (las primeras cuatro páginas, #a.escenario): #num(a.base.primerasCuatroP50) → #num(a.propuesta.primerasCuatroP50) ms (#pc(a.deltaPrimerasCuatro)). No es el tiempo de pantalla: el navegador no se midió.]
        }
        Errores en toda la corrida: #D.erroresTotales. Inventario de pendientes de las #D.carteras carteras, con las dos versiones: #if D.coinciden [idéntico] else [*distinto*].
      ],
      [
        *Lo que sigue sin saberse.* Nada de Render (otra CPU, la base en otra máquina y la red en el medio). Cuántos profesionales reales aguanta: los clientes de C3 y C5 piden sin pausa. Qué pasa con más de cinco a la vez, con escrituras simultáneas o con meses de historia. El tiempo en el navegador. Y el paso 2 sigue costando lo mismo: con 200 personas, cada página sigue dejando 600 filas de decisión y 200 confirmaciones al disco.
      ],
    )
  ] else [
    La lámina se completa con la corrida de `test/rendimiento/cartera-ab.rendimiento.ts` (flujo de la rama descartable `medicion/cartera-ab-2026-10-28`): `node datos.mjs <carpeta>` y `node construir.mjs`.
  ]
  #referencias("EVIDENCIA/RENDIMIENTO-CARTERA/LECTURA-POR-CONJUNTOS.md", "test/rendimiento/cartera-ab.rendimiento.ts", "test/rendimiento/analizar-ab.mjs")
]

// ─── 6. Para comprobar y lo que queda ─────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "6 · Para comprobar, y lo que queda como propuesta",
  bajada: [Tres preguntas para saber si se entendió el mecanismo (las respuestas, aparte, en `RESPUESTAS.md`), y las dos alternativas que no se implementaron porque tocan una garantía o un contrato.],
)[
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 10mm,
    [
      === Tres preguntas
      #set text(size: 10pt)
      + Un profesional tiene 120 personas en Nutrición, 40 de ellas también en Entrenamiento. ¿Cuántas transacciones del PDP hace una página antes y después del cambio? ¿Y cuántas sentencias, aproximadamente, hace el paso 3 antes y después?
      + Una persona permitida en Nutrición y denegada en Entrenamiento (por ejemplo, con el consentimiento de Entrenamiento revocado). ¿En qué consultas del paso 3 aparece su identificador, y en cuáles no? ¿Por qué eso importa más que «filtrar después»?
      + Si alguien propusiera «calcular la cartera una vez y servir las páginas siguientes de lo calculado», ¿qué regla del legajo chocaría y qué pasaría con una revocación entre la página 1 y la página 2?
    ],
    [
      === Lo que queda como propuesta (decisión de Dirección)
      #set text(size: 10pt)
      - *Las 200 decisiones en una transacción.* Ahorraría 199 COMMIT y la mayor parte del paso 2, pero cambia la ventana de los bloqueos y el instante de cada decisión. Antes de decidirlo: una prueba de carrera con PostgreSQL real (revocación durante la decisión) y la lectura de 08 §27.
      - *No repetir la cartera en cada página.* Cuatro opciones, todas con un cambio de contrato, de pantalla o de regla: que el website pida solo lo que necesita y cuente con otra lectura liviana; subir el `limit` máximo (hoy 50); servir las páginas siguientes de lo calculado (choca con decidir en cada pedido sin caché, 08 §27.3); paginar por personas antes de calcular (cambia el orden por urgencia).
      - *Qué se registra por lectura.* Tres filas por persona y por página, también en áreas sin vínculo. No se recomienda tocarlo para ganar velocidad: el legajo exige registrar cada decisión (08:634).
    ],
  )
  #v(4pt)
  #ojo("Cómo pedir y evaluar un trabajo así")[
    Pedir: la hipótesis y el criterio de «suficiente» escritos *antes* de medir; la versión anterior como oráculo; las dos versiones en la misma máquina y alternadas; las muestras completas, no las mejores corridas. Evaluar: ¿la respuesta es idéntica?, ¿las filas de auditoría son las mismas?, ¿la mejora supera el ruido entre repeticiones?, ¿se movió el cuello de botella a otro lado?, ¿qué queda sin medir?
  ]
]
