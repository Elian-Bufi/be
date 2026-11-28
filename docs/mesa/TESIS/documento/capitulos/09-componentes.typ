#import "../plantilla.typ": *

// Datos: datos/modulos-api.json (los módulos, controladores y servicios leídos de apps/api/src) y
// datos/familias-api.json (las operaciones del contrato publicado, packages/domain/src/openapi.ts).
#let mods = json("../../datos/modulos-api.json").carpetas.filter(m => m.modulo != none)
#let fam = json("../../datos/familias-api.json")

#let QUE = (
  ACC: [registro, sesión y cuenta], GOO: [acceso con Google], CON: [consentimientos y actos de la persona],
  REL: [solicitudes y vínculos], INV: [invitaciones por enlace, QR o código], EVI: [permiso para las fotos de comidas],
  NUT: [nutrición: evaluación, objetivo, plan, registro y revisión], INT: [catálogo propio e importación],
  REC: [recetas], ING: [«Hoy» y registro de comidas], TPN: [plantillas de plan nutricional], HAN: [alimentos habituales],
  TRN: [entrenamiento: evaluación, objetivo, plan, ejecución y revisión], SER: [objetivos por serie],
  TIE: [tiempos de la sesión en curso], AGE: [agenda del día], EJE: [ejercicios propios],
  TPL: [plantillas de plan de entrenamiento], HAB: [ejercicios habituales], ANT: [antropometría: tomas y mediciones],
  MTH: [métodos profesionales versionados], CAL: [cálculos reproducibles], FRM: [información pertinente],
  DSH: [ficha y línea de tiempo], PRJ: [proyecciones], CAR: [cartera y pendientes], VAN: [vistas de análisis guardadas],
  CRD: [notas de coordinación], NOV: [novedades y avisos], MED: [medios (fotos)],
)

= Diagrama de componentes

Los diagramas de componentes (UML 2.5.1) muestran cómo se arma el software: qué piezas hay, qué interfaz provee cada una
y quién la requiere. Están en dos niveles: el sistema completo y la API por dentro. Cada componente nombra su lugar en
el repositorio, para que se pueda ir del dibujo al código.

== El sistema

Hay tres aplicaciones (website, APK y API), una tarea programada y un paquete compartido. La API provee la interfaz
REST (`/api/v1`) que requieren el website y la APK, y una interfaz de tareas internas, protegida con un secreto, que
requiere la tarea programada. La API, a su vez, requiere la base de datos y tres servicios externos. El paquete
`@be/domain` es una biblioteca: no se despliega solo, lo importan las tres aplicaciones.

#pagina-apaisada[
  #lamina("COMP-01", "El sistema y sus interfaces", alcance: "Las piezas de software, la interfaz que provee cada una y quién la requiere", fuente: "apps/, packages/domain, prisma/ y render.yaml", etiqueta: "fig-comp-sistema")
]

#table(
  columns: (26mm, 1fr, 1fr, 1fr),
  table.header([Componente], [Dónde está], [Provee], [Requiere]),
  [Website], [`apps/web` (Next.js, sitio estático)], [las pantallas del profesional y de la cuenta], [REST `/api/v1`, `@be/domain`],
  [APK], [`apps/mobile` (Expo, React Native)], [las pantallas de la persona], [REST `/api/v1`, `@be/domain`, avisos de FCM],
  [API], [`apps/api` (NestJS)], [REST `/api/v1` (#fam.operaciones operaciones) y tareas internas], [SQL, Expo Push, claves de Google, catálogos, `@be/domain`],
  [Recordatorios], [`render.yaml` (`be-recordatorios`)], [—], [tareas internas de la API],
  [`@be/domain`], [`packages/domain`], [reglas, contratos y textos], [—],
  [Base de datos], [`prisma/` (esquema y migraciones)], [SQL], [—],
)

== Los módulos de la API

La API tiene #mods.len() módulos de NestJS. Cinco son globales (base de datos, plataforma, autorización, proceso y
novedades): los usan todos sin importarlos. La figura los agrupa como «Comunes» junto con el de salud del servicio
(`/health/ready`), que no es global. El resto se agrupa por responsabilidad: acceso, vínculo, seguimiento y los
dominios de salud. Las flechas son las importaciones declaradas en cada `*.module.ts`; casi todos importan además el
módulo de sesión, que no se dibuja.

#pagina-apaisada[
  #lamina("COMP-02", "Los módulos de la API", alcance: "Los 22 módulos agrupados, las familias de operaciones que expone cada uno y sus dependencias", fuente: "apps/api/src/*/*.module.ts", etiqueta: "fig-comp-api")
]

#{
  set text(size: 10pt)
  table(
    columns: (36mm, 33mm, 1fr, 13mm, 13mm, 1fr),
    align: (left, left, left, center, center, left),
    table.header([Módulo], [Carpeta], [Familias que expone], [Contr.], [Serv.], [Importa]),
    ..mods.map(m => {
      let fs = m.controladores.map(c => c.operaciones.map(o => o.replace(regex("^API-"), "").replace(regex("-.*$"), ""))).flatten().dedup()
      (
        text(font: "JetBrains Mono", hyphenate: false, lang: "en", partible(m.modulo.replace("Module", ""))) + if m.global { text(fill: tinta-suave, hyphenate: false)[ (global)] },
        cp(m.carpeta),
        if fs.len() > 0 { fs.join(" · ") } else { text(fill: tinta-suave, "—") },
        str(m.controladores.len()),
        str(m.servicios.len()),
        if m.importaModulos.len() > 0 { m.importaModulos.map(x => x.replace("Module", "")).join(", ") } else { text(fill: tinta-suave, "—") },
      )
    }).flatten(),
  )
}

== Las interfaces: familias de operaciones

Cada operación del contrato tiene un identificador `API-FAMILIA-NN` y pertenece a una familia. Las familias son las
interfaces que provee la API: #fam.operaciones operaciones en #fam.familias.keys().len() familias. Trece vienen del legajo
(09): ACC, REL, CON, NUT, INT, TRN, ANT, DSH, PRJ, CRD, MTH, CAL y FRM; la familia PRO (verificación profesional)
quedó fuera de la entrega. Las otras diecisiete son extensiones registradas como decisiones en `docs/DEUDA_LEGAJO.md` (el anexo H resume
las principales). El contrato
publicado se genera de `packages/domain/src/openapi.ts` y la CI verifica que coincida con el código
(`scripts/generar-openapi.cjs --verificar`).

#{
  set text(size: 10pt)
  table(
    columns: (14mm, 1fr, 13mm, 1.1fr),
    align: (left, left, center, left),
    table.header([Sigla], [Qué agrupa], [Oper.], [Primera operación]),
    ..fam.familias.pairs().sorted(key: p => p.at(0)).map(((f, v)) => (
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", f),
      QUE.at(f, default: text(fill: tinta-suave, "—")),
      str(v.n),
      text(font: "JetBrains Mono", hyphenate: false, lang: "en", size: 10pt, v.ejemplo.replace("/", "/\u{200b}")),
    )).flatten(),
  )
}
