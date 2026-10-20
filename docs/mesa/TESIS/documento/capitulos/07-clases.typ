#import "../plantilla.typ": *

#let mods = json("../../datos/modulos-api.json").carpetas.filter(m => m.modulo != none)

= Diagrama de clases

BE no es orientado a objetos de punta a punta, y este apartado no lo disimula. Conviven dos estilos:

- *El dominio es funcional.* El paquete `@be/domain` reúne tipos, contratos validados con zod y funciones puras: la
  regla de autorización, el versionado, los cálculos, la TVCC-30, las fechas civiles. Lo usan la API, el website y la
  APK, así una regla vale igual en las tres superficies.
- *La API usa clases.* NestJS organiza la API en #mods.len() módulos con
  #mods.map(m => m.controladores.len()).sum() controladores y #mods.map(m => m.servicios.len()).sum() servicios, que
  se conectan por inyección de dependencias. Ahí sí hay jerarquías reales.

Por eso hay tres figuras, cada una con su nivel declarado. La primera es de análisis: el dominio tal como lo entiende
el negocio. Las otras dos son de implementación: las clases que existen en el código, con sus nombres reales.

== Modelo de dominio (nivel de análisis)

Cada clase es una entidad que se guarda en la base (una tabla del apartado 6). Los atributos son los del esquema; las
operaciones son las que la API expone sobre esa entidad, y cada una es una ruta real (por ejemplo, `activar()` es
`POST /nutrition/plans/{id}/activate`, API-NUT-12). Las multiplicidades salen de las claves foráneas. Las composiciones
marcan lo que no existe fuera de su todo: un alcance sin su vínculo, una versión sin su plan, una próxima revisión sin
su proceso.

#pagina-apaisada[
  #lamina("CL-01", "Modelo de dominio del circuito nutricional", alcance: "Entidades del dominio con atributos, operaciones expuestas y asociaciones", fuente: "prisma/schema.prisma y rutas de la API", etiqueta: "fig-cl-dominio")
]

#table(
  columns: (1fr, 1fr, 1fr, 1.1fr),
  table.header([Clase], [Tabla (vista del DER)], [Servicio de la API], [Operaciones]),
  [#partible("AlcanceDeVinculo")], [#cp("alcance_de_vinculo") (DER-03)], [#cp("VinculosService")], [pausar, reanudar y finalizar (#cp("/relationships/{id}/pause"), #cp("resume"), #cp("finalize"))],
  [Consentimiento], [#cp("consentimiento") (DER-04)], [#cp("ConsentimientoProfesionalService")], [otorgar y revocar (#cp("/me/consents/{id}/revoke"), API-CON-04)],
  [#partible("EvaluacionNutricional")], [#cp("evaluacion_nutricional") (DER-06)], [#cp("EvaluacionesService")], [registrar y consultar],
  [#partible("VersionDeObjetivo") «nutricional»], [#cp("version_de_objetivo_nutricional") (DER-06)], [#cp("EvaluacionesService")], [definir el objetivo (#cp("crearObjetivo"))],
  [#partible("VersionDePlan") «nutricional»], [#cp("version_de_plan_nutricional") (DER-06)], [#cp("PlanesService")], [validar y activar (API-NUT-11 y 12)],
  [#partible("IngestaNutricional")], [#cp("ingesta_nutricional") (DER-07)], [#cp("IngestasService"), #cp("RegistroDeComidasService")], [registrar, corregir y anular],
  [#partible("RevisionNutricional")], [#cp("revision_nutricional") (DER-07)], [#cp("RevisionesService")], [registrar y aplicar (#cp("/nutrition/reviews/{id}/apply"))],
  [#partible("ProcesoOperativo") y #partible("ProximaRevision")], [#cp("proceso_operativo"), #cp("proxima_revision") (DER-02)], [#cp("ProcesoService")], [se abren y avanzan como efecto de activar y aplicar],
)

== Implementación de una escritura protegida

La figura siguiente sigue una operación real, activar un plan, por las clases que la ejecutan. El controlador declara
el guarda de sesión (`@UseGuards(SesionGuard)`); el servicio arma el efecto y lo entrega al ejecutor de su dominio,
que hereda el esqueleto común: valida el cuerpo, exige la clave de idempotencia, abre una transacción, pide la
decisión al PDP dentro de ella, escribe, audita y registra la respuesta. Si el PDP deniega, la transacción se revierte
y la denegación queda auditada. La decisión la toma una función pura del dominio (`evaluarAutorizacion`), la misma que
prueban las pruebas de dominio sin base de datos.

#pagina-apaisada[
  #lamina("CL-02", "Implementación de una escritura protegida", alcance: "Las clases de la API que intervienen al activar un plan, con sus dependencias", fuente: "apps/api/src y packages/domain/src", etiqueta: "fig-cl-escritura")
]

== Jerarquías del código

Las generalizaciones y realizaciones que existen en la API: el esqueleto común de los dominios y sus ocho subclases,
los guardas que implementan la interfaz de NestJS, el servicio de base de datos sobre el cliente de Prisma y los
errores propios sobre `Error`.

#pagina-apaisada[
  #lamina("CL-03", "Jerarquías de la API", alcance: "Generalizaciones y realizaciones que existen en el código", fuente: "apps/api/src", etiqueta: "fig-cl-jerarquias")
]

#recuadro(titulo: [Observación de diseño], tipo: "nota")[
  `EjecutorDeDominio` recibe un `Alcance` en su constructor porque lo introdujo nutrición y lo generalizó antropometría
  (`docs/paquetes/WP-05.md` §9.2). Cinco de sus ocho subclases son transversales (formularios, coordinación, vistas de
  análisis, medios y perfil propio) y pasan un alcance nominal que no usan o que reemplazan en cada llamada; el código
  lo documenta en cada una. Funciona y está probado, pero un alcance opcional en el esqueleto haría explícita esa
  diferencia. Queda como mejora en el anexo K; no se cambió el producto para este documento.
]

== El paquete de dominio

#table(
  columns: (auto, 1fr),
  table.header([Grupo de módulos], [Qué contiene y quién lo usa]),
  [Reglas puras], [`autorizacion.ts` (la decisión del PDP en siete dimensiones), `versionado.ts` (cadenas de versiones y correcciones), `calculo.ts` y `formulas-antropometricas.ts`, `tvcc30.ts`, `fechas-civiles.ts`, `maquina.ts` (transiciones de estado). Las usan los servicios de la API; las pruebas de dominio las ejercitan sin base de datos.],
  [Contratos (23 módulos `contratos*.ts`)], [Los esquemas zod de cada familia de operaciones: la API valida con ellos lo que recibe y lo que responde, y las pantallas los usan para leer. `openapi.ts` genera el contrato publicado a partir de ellos.],
  [Textos (20 módulos `copy*.ts`)], [Los textos de las pantallas del website y de la APK, en un solo lugar, con pruebas de redacción.],
  [Lógica de pantallas compartida], [Editores de plan, línea de tiempo, síntesis del resumen, presentación de la prescripción, estado de guardado: decisiones de presentación que el website y la APK comparten.],
)

== Correspondencia con el DER

Las clases de dominio (CL-01) son un subconjunto de las entidades del DER, con sus nombres y sus multiplicidades. Dos
nombres van abreviados con el estereotipo «nutricional»: VersionDeObjetivo y VersionDePlan son, en el DER,
VersionDeObjetivoNutricional y VersionDePlanNutricional. Las clases de implementación (CL-02 y CL-03) no tienen tabla: son servicios, guardas y ejecutores
que leen y escriben esas tablas a través de `PrismaService`. Las tablas que no aparecen en CL-01 se manejan igual,
cada una desde el servicio de su módulo; el apartado 9 muestra los módulos y sus dependencias.
