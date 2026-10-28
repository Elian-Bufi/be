// Guía central de BE: entender y defender el sistema, de lo macro a lo micro. Fuente editable; se compila con
// `node construir.mjs` desde docs/guias/ENTENDER-BE (ver LEEME.md). Commit de referencia: el de datos/version.json.
#import "../comun/plantilla.typ": *

#show: documento.with(titulo-corto: "BE · Guía central")

// ─── Portada ─────────────────────────────────────────────────────────────────────────────────────────────────
#page(header: none)[
  #v(8mm)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 14pt,
    align: horizon,
    image("../../../../apps/mobile/assets/isotipo.png", width: 24mm),
    {
      text(size: 34pt, weight: 700, "Cómo funciona BE")
      linebreak()
      text(size: 16pt, weight: 600, fill: tinta-suave, "Guía central para entenderlo, dirigirlo y defenderlo")
      v(2pt)
      line(length: 56pt, stroke: 3pt + acento)
    },
  )
  #v(8mm)
  #grid(
    columns: (1.25fr, 1fr),
    column-gutter: 12mm,
    [
      #set text(size: 11.5pt)
      Esta guía explica BE como sistema: qué problema intenta resolver, con qué piezas, con qué reglas, cómo viaja un
      dato y cómo se cambia sin perder el control. Va de lo macro a lo micro, en cinco niveles, con los nombres reales
      del código.

      Es para dos lectores. Para Dirección, que dirige el proyecto y tiene que poder explicarlo sin depender de una IA.
      Y para un profesor o un profesional que quiera entender cómo funciona.

      *No reemplaza* los entregables académicos ni el legajo: el legajo (`docs/legajo`) sigue siendo la fuente de
      verdad de lo que BE debe hacer. Esta guía describe lo que el código hace en el commit de referencia.
    ],
    block(fill: fondo, inset: 10pt, radius: 3pt, width: 100%)[
      #set text(size: 10pt)
      *Commit de referencia:* #raw(version.commitCorto) (`main`, #version.fecha), con la tanda del 2026-10-25 y la
      candidata `0.18.0-candidata.1` integradas.

      *Qué se revisó:* el código de `apps/`, `packages/domain`, `prisma/` y `test/`, la configuración de `render.yaml`,
      la CI y la evidencia de `EVIDENCIA/`.

      *Cómo se arma:* fuente Typst y láminas generadas desde código (`docs/guias/ENTENDER-BE`). Los diagramas son
      vectoriales y exactos: ninguno es una imagen generativa.

      *Versión del documento:* #version.documento.version.
    ],
  )
  #v(6mm)
  #block(width: 100%, stroke: (top: 0.8pt + borde), inset: (top: 6pt))[
    #text(size: 10pt, weight: 650, fill: tinta-suave, "CONTENIDO")
    #v(-2pt)
    #set text(size: 9.5pt)
    #show outline.entry.where(level: 1): it => block(above: 7pt, below: 2pt, text(weight: 700, fill: azul, it.body()))
    #show outline.entry.where(level: 2): it => block(above: 4pt, below: 2pt, grid(columns: (1fr, auto), column-gutter: 6pt, link(it.element.location(), it.body()), it.page()))
    #columns(3, gutter: 8mm, outline(title: none, depth: 2))
  ]
  #v(1fr)
  #text(size: 9.5pt, fill: tinta-suave)[BE · Plataforma integrada de inteligencia en salud · trabajo final de Analista de Sistemas · Elián Bufi. Solo datos sintéticos.]
]

// ─── Cómo leerla ─────────────────────────────────────────────────────────────────────────────────────────────
#lamina(
  pregunta: "¿Qué hay en esta guía y cómo se lee?",
  bajada: [Cinco niveles, de lo macro a lo micro. Cada lámina responde una sola pregunta; la columna de la derecha, cuando la hay, trae los conceptos.],
)[
  #diagrama("G-01")
  #v(4pt)
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 8mm,
    [
      *Los estados de una afirmación.* Cada vez que la guía dice que algo existe, dice también en qué estado está.
      Son estados distintos y se prueban de forma distinta (nivel 5):

      #estado("implementado") #estado("verificado") #estado("integrado") #estado("desplegado") #estado("validado") #estado("propuesto") #estado("fuera")
    ],
    [
      *Los colores de los módulos.* Los mismos en las dos guías y en todos los diagramas por área:

      #modulo("identidad") #modulo("vinculo") #modulo("nutricion") #modulo("entrenamiento") #modulo("antropometria") #modulo("seguimiento") #modulo("plataforma")
    ],
  )
]

// ═══ NIVEL 1 · EL SENTIDO ════════════════════════════════════════════════════════════════════════════════════

#lamina(
  nivel: "Nivel 1 · El sentido del producto",
  pregunta: "¿Qué problema intenta resolver BE?",
  bajada: [La información de una persona que hace seguimiento con varios profesionales suele estar repartida, y nadie decide con la historia completa.],
  lateral: [
    #concepto(
      "Actor y rol",
      criollo: [Quién usa el sistema y para qué. Un actor es un tipo de usuario; su rol define qué puede hacer.],
      en-be: [Tres actores: la persona asesorada (APK), el profesional (website, `/pro`) y Administración (website,
        `/admin`, con segundo factor). Una cuenta administrativa no puede ser profesional ni parte de un vínculo: lo
        impide la base.],
      pregunta: [¿Por qué conviene que la cuenta que suspende profesionales no pueda leer datos de salud?],

    )
    #concepto(
      "Dato sensible",
      criollo: [Un dato cuya exposición puede dañar a la persona. Los datos de salud lo son, y por eso se protegen más.],
      en-be: [Lo que se registra de comidas, entrenamiento y medidas. La persona da un permiso general (A3) y, después,
        uno por cada profesional y área.],
      pregunta: [¿Qué cambia para el diseño si un dato es sensible?],

    )
  ],
)[
  *El problema.* Una persona puede trabajar a la vez con una nutricionista, un entrenador y alguien que le toma
  medidas. Hoy, esa información suele vivir en planillas, PDF, fotos y chats. Cada profesional ve una parte, la persona
  no sabe bien quién mira qué, y cuando algo se corrige se pierde lo que había antes.

  *Lo que BE propone* es un lugar común con tres reglas que el sistema hace cumplir, no solo promete:

  + *Cada profesional trabaja en su área sin mezclarse.* Nutrición, entrenamiento y antropometría son áreas separadas:
    un profesional opera solo las áreas en las que está verificado y habilitado.
  + *La persona decide quién accede, área por área.* Un vínculo por área, y una autorización que la persona da y
    puede revocar. Sin las dos cosas, el profesional no ve nada de esa persona.
  + *Lo registrado no se pisa.* Corregir agrega un registro nuevo; anular deja la historia. Un plan activado queda
    congelado como versión: para cambiarlo, se activa otra.

  *Quién usa qué:*
  #table(
    columns: (auto, auto, 1fr),
    table.header([Actor], [Superficie], [Para qué]),
    [Persona asesorada], [APK de Android], [Ver el plan del día, registrar comidas y entrenamientos, autorizar y revocar accesos.],
    [Profesional], [Website, `/pro`], [Evaluar, fijar objetivos, armar y activar planes, analizar lo registrado y revisar.],
    [Administración], [Website, `/admin`], [Verificar y habilitar profesionales por área, suspender y rehabilitar. Nunca ve datos de salud.],
  )

  *Lo que BE no hace,* a propósito, y conviene decirlo antes de que lo pregunten:
  - *No diagnostica ni califica.* Muestra lo registrado al lado de lo indicado; no dice «cumplió», «adhirió» ni da
    porcentajes (regla B05 del legajo, también en negación).
  - *No inventa datos.* Lo que falta queda como faltante: un día sin registros no es un cero.
  - *No certifica matrículas.* Habilitar para operar en BE no es certificar a un profesional.
  - *No comparte nada sin autorización.* Ni siquiera Administración lee datos de salud.
]

#lamina(
  nivel: "Nivel 1 · El sentido del producto",
  pregunta: "¿Qué trabajo facilita, y qué necesita el profesional para decidir?",
  bajada: [BE ordena un ciclo: evaluar, fijar un objetivo, indicar un plan, registrar, analizar y revisar. La persona habilita el ciclo.],
)[
  #diagrama("G-02")
  #v(2pt)
  #grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 5mm,
    concepto(
      "Objetivo, indicado y registrado",
      criollo: [Tres cosas distintas: lo que fijó el profesional para el día, lo que el plan decía y lo que la persona
        anotó. Ninguna califica a las otras.],
      en-be: [Prueba Dos: objetivo 1.800 kcal, indicado 1.572 kcal, y lo registrado de cada día.],
      pregunta: [¿Por qué un plan con alternativas no tiene «indicado del día»?],

    ),
    concepto(
      "Versión",
      criollo: [Una foto fija de algo que cambia con el tiempo. Cambiar es crear otra versión, no pisar la anterior.],
      en-be: [Al activar un plan, BE guarda una instantánea con la composición de cada alimento. Si mañana se corrige el
        catálogo, el plan de ayer sigue diciendo lo mismo.],
      pregunta: [¿Qué se pierde si un plan activado se pudiera editar?],

    ),
    concepto(
      "Ausencia declarada",
      criollo: [Si falta un dato, se dice que falta. No se inventa ni se cuenta como cero.],
      en-be: [Un día sin registros se ve en gris, no como 0 kcal. Un almuerzo sin cantidades hace del día un
        «subtotal de lo registrado».],
      pregunta: [¿Qué conclusión equivocada sacaría un profesional si un día sin registros se dibujara como cero?],

    ),
  )
]

#lamina(
  nivel: "Nivel 1 · El sentido del producto",
  pregunta: "¿Qué valor está demostrado, y qué sigue siendo una hipótesis?",
  bajada: [Que el sistema funcione no prueba que sirva. Son preguntas distintas, con evidencias distintas.],
  lateral: [
    #concepto(
      "Verificación y validación",
      criollo: [Verificar es comprobar que el sistema hace lo que se especificó («¿lo construimos bien?»). Validar es
        comprobar que eso le sirve a quien lo usa («¿construimos lo correcto?»).],
      en-be: [Las 909 pruebas de integración verifican. La prueba breve con Dirección y la prueba con profesionales
        validan, y todavía no están completas.],
      pregunta: [Una prueba automática pasa en verde. ¿Qué sabés y qué no sabés todavía?],

    )
    #concepto(
      "Hipótesis de valor",
      criollo: [Lo que creemos que el producto le aporta a alguien, antes de haberlo medido.],
      en-be: [«Ver objetivo, indicado y registrado lado a lado ayuda a revisar mejor» es una hipótesis: nadie la midió
        con profesionales reales.],
      pregunta: [¿Cómo la pondrías a prueba con tres profesionales en una semana?],

    )
  ],
)[
  #table(
    columns: (1.5fr, auto, 2fr),
    table.header([Afirmación], [Estado], [Evidencia o lo que falta]),
    [BE hace cumplir sus reglas de acceso, historia y autorización], estado("verificado"), [909 pruebas de integración contra PostgreSQL real, recorridos en el navegador y la verificación de los escenarios de prueba (6 de 6, el 2026-10-26).],
    [BE corre en un ambiente que se puede usar], estado("desplegado"), [Test sirve `e4512cb` en la API y el website. La APK `0.18.0-candidata.1` está publicada como prerelease; la estable sigue siendo la 0.13.2.],
    [Administración se entiende sin ayuda], estado("validado", texto: "Validado en parte"), [Parte A de la prueba breve, hecha por Dirección el 2026-10-27: las siete filas coincidieron, con cuatro observaciones de comprensión.],
    [Un profesional lee bien «Analizar» (tres capas)], estado("pendiente"), [Parte B de la prueba breve y la prueba con profesionales (DL-153, DL-154 y DL-158).],
    [Una persona registra sin ayuda en el teléfono], estado("pendiente"), [Parte C y el guion completo del teléfono, con TalkBack.],
    [BE ahorra tiempo o mejora decisiones], estado("propuesto", texto: "Hipótesis"), [No se midió. La auditoría del 2026-10-21 lo marca (VAL-01): los objetivos de la tesis son propiedades del sistema, no beneficios medidos (ACA-01).],
    [BE soporta muchas personas por profesional], estado("propuesto", texto: "Sin medir"), [La medición de la cartera está preparada, en un entorno aislado; no dice nada de Render.],
  )
  #v(4pt)
  #ojo("Para defenderlo frente a un profesor")[Separar las dos cosas da fuerza, no la quita: «el sistema garantiza estas
    reglas, y lo demuestran estas pruebas; que le sirva a un profesional es la hipótesis que sigue, y así la vamos a
    validar».]
]

// ═══ NIVEL 2 · LAS PIEZAS ════════════════════════════════════════════════════════════════════════════════════
// (en preparación)

// ═══ NIVEL 5 · EL CAMBIO ═════════════════════════════════════════════════════════════════════════════════════

#lamina(
  nivel: "Nivel 5 · Cambiar el sistema sin perder el control",
  pregunta: "¿Por qué «integrado», «desplegado» y «validado» no son lo mismo?",
  bajada: [Un cambio pasa por cinco estados. Cada uno responde una pregunta distinta y tiene su propia prueba.],
)[
  #diagrama("G-15")
  #v(2pt)
  #grid(
    columns: (1fr, 1fr),
    column-gutter: 6mm,
    concepto(
      "Integración (merge)",
      criollo: [Llevar el trabajo de una rama a la rama principal. Desde ahí, es parte del producto.],
      en-be: [Cada PR se integra con un merge desde GitHub, solo con la CI en verde y la rama al día con `main`.],
      pregunta: [Si un PR está integrado pero la CI de `main` falló, ¿se despliega? ¿Por qué?],

    ),
    concepto(
      "Validación humana",
      criollo: [Que una persona real use el sistema en una tarea real y se observe si entiende sin ayuda.],
      en-be: [La prueba breve: las respuestas esperadas están en `OBSERVADOR.md`, y lo que pasó se anota sin corregir a
        quien prueba.],
      pregunta: [¿Por qué una prueba automática nunca reemplaza a una validación humana?],

    ),
  )
]
