// Cuaderno de datos de BE: la base de datos de lo macro a lo micro. Se lee después de la guía central. Fuente editable;
// se compila con `node construir.mjs cuaderno` desde docs/guias/ENTENDER-BE. Commit de referencia: datos/version.json.
#import "../comun/plantilla.typ": *

#show: documento.with(titulo-corto: "BE · Cuaderno de datos")

#let clases = json("../datos/clases-de-tablas.json")

// ─── Portada ─────────────────────────────────────────────────────────────────────────────────────────────────
#page(header: none)[
  #v(8mm)
  #grid(
    columns: (auto, 1fr),
    column-gutter: 14pt,
    align: horizon,
    image("../../../../apps/mobile/assets/isotipo.png", width: 22mm),
    {
      text(size: 32pt, weight: 700, "Cuaderno de datos")
      linebreak()
      text(size: 15pt, weight: 600, fill: tinta-suave, "La base de BE, de lo macro a lo micro")
      v(2pt)
      line(length: 56pt, stroke: 3pt + acento)
    },
  )
  #v(6mm)
  #grid(
    columns: (1.25fr, 1fr),
    column-gutter: 12mm,
    [
      #set text(size: 11pt)
      Se lee después de la guía central. Empieza por lo que es una base de datos y dónde está la de BE, sigue por
      cada área del modelo y termina en lo micro: claves, disparadores, transacciones, índices, historia, migraciones
      y unas consultas de lectura.

      *Conceptual y físico.* Los diagramas por área muestran solo las tablas centrales, con sus nombres y relaciones
      reales: lo que se omite se nombra en el texto. El esquema completo son 118 tablas en las 15 vistas del DER de la
      tesis, puestas al día en esta rama (DER-01 a DER-15).
    ],
    block(fill: fondo, inset: 10pt, radius: 3pt, width: 100%)[
      #set text(size: 10pt)
      *Commit de referencia:* #raw(version.commitCorto) (`main`, #version.fecha).

      *De dónde sale cada dato:* `prisma/schema.prisma` y `prisma/migrations`, leídos por herramientas
      (`herramientas/leer-esquema.mjs`, `clasificar-tablas.mjs`, `restricciones-de-la-base.mjs`). Nada se copió a
      mano.

      *Datos de los ejemplos:* sintéticos, los de las cuentas «Prueba» de la prueba breve.
    ],
  )
  #v(5mm)
  #block(width: 100%, stroke: (top: 0.8pt + borde), inset: (top: 6pt))[
    #text(size: 10pt, weight: 650, fill: tinta-suave, "CONTENIDO")
    #v(-2pt)
    #set text(size: 9.5pt)
    #show outline.entry.where(level: 1): it => block(above: 7pt, below: 2pt, text(weight: 700, fill: azul, it.body()))
    #show outline.entry.where(level: 2): it => block(above: 4pt, below: 2pt, grid(columns: (1fr, auto), column-gutter: 6pt, link(it.element.location(), it.body()), it.page()))
    #columns(3, gutter: 8mm, outline(title: none, depth: 2))
  ]
  #v(1fr)
]

// ═══ PARTE 1 · LO MACRO ═════════════════════════════════════════════════════════════════════════════════════

#lamina(
  nivel: "Parte 1 · Lo macro: qué es la base y dónde está",
  pregunta: "¿Qué es una base de datos, y cómo se anidan sus piezas?",
  bajada: [Un motor guarda bases; una base tiene esquemas; un esquema, tablas; una tabla, columnas y filas.],
  lateral: [
    #concepto(
      "Sistema gestor de bases de datos (SGBD)",
      criollo: [El programa que guarda los datos y hace cumplir sus reglas, aunque el programa que los usa se equivoque.],
      en-be: [PostgreSQL 16. En test, el servicio `be-db-test` de Render; en la CI, un contenedor que se descarta.],
      pregunta: [Si la API tuviera un error y quisiera borrar una comida registrada, ¿quién la frena?],
    )
    #concepto(
      "Esquema",
      criollo: [Una carpeta con nombre dentro de la base, que agrupa tablas.],
      en-be: [BE usa uno solo, `public`, con sus 118 tablas. Las áreas (Nutrición, Entrenamiento…) son agrupaciones
        lógicas del código, no esquemas aparte.],
      pregunta: [¿Qué ganaría y qué perdería BE si cada área tuviera su esquema?],
    )
  ],
)[
  #diagrama("D-01")
]

#lamina(
  nivel: "Parte 1 · Lo macro: qué es la base y dónde está",
  pregunta: "¿Qué hace Prisma, y qué no hace?",
  bajada: [Prisma traduce el modelo escrito en el código a tablas, genera el cliente con el que la API consulta y aplica las migraciones. Las reglas duras las pone la base.],
  lateral: [
    #concepto(
      "ORM (mapeo objeto-relacional)",
      criollo: [La capa que deja trabajar con objetos del lenguaje en lugar de escribir SQL a mano.],
      en-be: [El cliente de Prisma: la API escribe `tx.ingestaNutricional.create(…)` y Prisma lo convierte en un
        `INSERT INTO ingesta_nutricional …`.],
      pregunta: [Si Prisma arma el SQL, ¿por qué BE igual tiene SQL escrito a mano en las migraciones?],
    )
    #concepto(
      "Mapeo de nombres",
      criollo: [El código usa un nombre; la base, otro. Una línea dice cuál corresponde a cuál.],
      en-be: [`fechaLocal` en el código es `fecha_local` en la tabla (`@map`); el modelo `IngestaNutricional` es la
        tabla `ingesta_nutricional` (`@@map`).],
      pregunta: [¿Dónde mirarías para saber cómo se llama en la base el campo `versionDePlanId`?],
    )
  ],
)[
  Un fragmento real de `prisma/schema.prisma`, recortado:

  ```prisma
  /// T-06-54 — Ingesta registrada: hecho confirmado contra una versión ACTIVADA; nunca
  /// modifica la prescripción (REG-06-106). … Append-only.
  model IngestaNutricional {
    id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    versionDePlanId String   @map("version_de_plan_id") @db.Uuid
    asesoradoId     String   @map("asesorado_id") @db.Uuid
    origen          OrigenDeIngesta
    fechaLocal      DateTime @map("fecha_local") @db.Date
    cantidadesConsumidas Json? @map("cantidades_consumidas")

    versionDePlan VersionDePlanNutricional @relation(fields: [versionDePlanId],
                    references: [id], onDelete: Restrict, onUpdate: Restrict)

    @@index([asesoradoId, fechaLocal])
    @@map("ingesta_nutricional")
  }
  ```

  #table(
    columns: (auto, 1fr),
    table.header([Lo que Prisma hace], [Lo que no hace]),
    [Convierte cada `model` en una tabla y cada campo en una columna con su tipo.], [No hace cumplir «append-only» ni las transiciones de estado: eso lo hacen *disparadores* escritos en SQL dentro de las migraciones.],
    [Genera el cliente tipado: la API no puede pedir una columna que no existe.], [No decide quién puede leer qué: eso es el PDP, en la API (guía central, nivel 3).],
    [Guarda la historia de migraciones aplicadas en la tabla `_prisma_migrations`.], [No inventa los datos que faltan: un campo opcional (`?`) queda en `NULL`.],
  )
]

#lamina(
  nivel: "Parte 1 · Lo macro: qué es la base y dónde está",
  pregunta: "¿Por qué hay tantas tablas?",
  bajada: [118 tablas no son 118 cosas distintas: la mitad existe para que nada se pise y todo tenga historia.],
  lateral: [
    #concepto(
      "Complejidad necesaria y deuda",
      criollo: [Necesaria es la que exige el problema. Deuda es la que agregamos sin que el problema la pida, y se paga
        después.],
      en-be: [Que corregir no borre exige tablas de corrección: es necesaria. Tener dos estructuras casi iguales para
        los planes de Nutrición y de Entrenamiento es una decisión discutible.],
      pregunta: [Nombrá una tabla que juntarías con otra, y qué regla del legajo tendrías que romper para hacerlo.],
    )
    #ojo("No se fusionan para bajar el número")[Unir tablas para que «sean menos» suele mezclar hechos con estados y
      obliga a actualizar filas que hoy no se tocan. La pregunta útil no es «¿cuántas?», sino «¿cuál de estas no
      responde a una regla?».]
  ],
)[
  #let filas = (
    ("entidad", "Cosas del negocio que existen y cambian de estado", "Identidad, Plan nutricional, Ingesta, Proceso operativo"),
    ("evento", "Hechos: lo que pasó, en orden, sin cambiar nunca", "Evento de nutrición, Decisión de acceso, Registro de auditoría"),
    ("version", "Versiones e instantáneas: cambiar sin pisar", "Versión del plan, Instantánea del plan, Versión de consentimiento"),
    ("tecnica", "Operación técnica: sesiones, seguridad, idempotencia", "Sesión, Factor TOTP, Registro de idempotencia, Medio"),
    ("catalogo", "Catálogos y textos de referencia", "Elemento del catálogo nutricional, Ejercicio, Receta"),
    ("correccion", "Correcciones, anulaciones y retiros", "Rectificación de cantidades, Anulación de ingesta, Corrección de medición"),
    ("relacion", "Relaciones y asociaciones", "Vínculo, Alcance del vínculo, Destinatario de una nota"),
  )
  #table(
    columns: (auto, 1.4fr, 1.6fr),
    table.header([Tablas], [Para qué existen], [Ejemplos]),
    ..filas.map(((k, para, ej)) => (text(weight: 700, str(clases.clases.at(k).modelos.len())), para, ej)).flatten(),
    text(weight: 700, str(clases.total)), [*Total*, en un solo esquema], [La lista completa por clase: `datos/clases-de-tablas.json`],
  )
  #v(2pt)
  *Lo necesario.* Hechos, versiones y correcciones (#(clases.clases.evento.modelos.len() + clases.clases.version.modelos.len() + clases.clases.correccion.modelos.len()) tablas) salen de tres reglas del legajo: la historia
  no se borra, un plan activado no se edita y corregir es agregar. Sacarlas sería sacar esas garantías.

  *Lo discutible.* Nutrición y Entrenamiento repiten la misma forma (objetivo, versión, plan, versión, instantánea,
  registro, corrección, revisión, eventos): es más código para mantener, a cambio de áreas que no se mezclan. Cada área
  tiene además su propia tabla de eventos. Son decisiones conscientes, pero son la primera candidata a «deuda» si
  BE sumara una cuarta área.
]

// ═══ PARTE 2 · LAS ÁREAS ════════════════════════════════════════════════════════════════════════════════════

#let pagina-de-area(nivel: "Parte 2 · Las áreas, una por una", pregunta, bajada, id, columnas-de-texto) = lamina(nivel: nivel, pregunta: pregunta, bajada: bajada)[
  #diagrama(id)
  #v(-2pt)
  #set text(size: 9.8pt)
  #grid(columns: (1fr, 1fr, 1fr), column-gutter: 6mm, ..columnas-de-texto)
]

#pagina-de-area(
  "Vínculos y consentimientos: ¿cómo decide la persona quién accede?",
  [#modulo("vinculo") Un vínculo por pareja; un alcance por área; una autorización por alcance; una decisión guardada por cada pedido.],
  "D-11",
  (
    [*Qué representa cada tabla.* `vinculo`: la pareja profesional–persona (única: U1). `alcance_de_vinculo`: ese
      vínculo en un área, con su estado (ACEPTADO, PAUSADO, FINALIZADO). `consentimiento`: la autorización de ese
      alcance (VIGENTE o REVOCADO). `version_de_consentimiento`: cada otorgamiento o revocación.],
    [*Guardado o calculado.* Se guardan los estados y cada decisión del PDP (`decision_de_acceso`, con su resultado y
      las dimensiones que fallaron). El «modo de acceso» que muestran las listas (con acceso o bloqueado) se calcula
      en el momento: no se guarda.],
    [*Qué cambia y qué se conserva.* Revocar cambia la situación del consentimiento y agrega una versión; finalizar
      cambia el estado del alcance. Nada se borra. Fuera del diagrama: `invitacion_de_vinculo` y `evento_de_vinculo`
      (los hechos de cada cambio).],
  ),
)

#pagina-de-area(
  "Nutrición: ¿cómo se guarda un plan sin que cambie después?",
  [#modulo("nutricion") El plan cambia por versiones; al activar, una instantánea congela la composición; cada comida cita la versión que regía.],
  "D-12",
  (
    [*Qué representa cada tabla.* `plan_nutricional`: el plan de un profesional para una persona (único: U1) y su
      versión efectiva. `version_de_plan_nutricional`: un BORRADOR o una versión ACTIVADA, con el contenido (días tipo,
      comidas, opciones) en JSON. `instantanea_de_plan_nutricional`: la copia congelada al activar, con la composición
      de cada alimento y su huella.],
    [*Guardado o calculado.* `ingesta_nutricional` guarda qué opción se registró y con qué cantidades; las kcal y los
      macros *no* se guardan: se calculan cada vez con la composición de la instantánea. Lo indicado del día (DL-158)
      también se calcula.],
    [*Qué cambia y qué se conserva.* Un borrador se edita; una versión activada no. Entre el plan y el catálogo no
      hay clave foránea: el contenido cita alimentos por su id y la instantánea copia su composición. Por eso
      corregir el catálogo no reescribe un plan activado.],
  ),
)
