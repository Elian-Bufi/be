#import "../plantilla.typ": *

#let ver = json("../../datos/version.json")

= Diagrama de arquitectura

La arquitectura se presenta con el modelo C4 en tres niveles: el contexto (quién usa BE y con qué sistemas se
comunica), los contenedores (las piezas que se despliegan por separado) y el despliegue (dónde corre cada una). Todo
describe el ambiente #ver.ambiente.nombre, el único desplegado: #ver.ambiente.proveedor, con website en
#id(ver.ambiente.website.commit) y API en #id(ver.ambiente.api.commit), y datos solo sintéticos.

== Contexto

BE es un solo sistema para tres tipos de persona. El asesorado lo usa desde la APK y desde el navegador; el
profesional, desde el navegador; el responsable de validación mide la TVCC-30 con un comando interno, sin HTTP. BE
depende de tres servicios externos: Google para entrar con una cuenta de Google, Expo Push y Firebase para que los
avisos lleguen al teléfono, y Open Food Facts y wger para importar alimentos y ejercicios. El administrador que prevé
el legajo no existe en esta entrega (apartado 2.6).

#pagina-apaisada[
  #lamina("ARQ-01", "Contexto de BE (C4, nivel 1)", alcance: "Personas y sistemas externos con los que se comunica BE", fuente: "docs/DESPLIEGUE.md, apps/api/src y RF-058", etiqueta: "fig-arq-contexto")
]

== Contenedores

Adentro, BE son cinco contenedores: la APK, el website, la API, la base de datos y la tarea programada de
recordatorios. La API es un monolito modular: un solo proceso con módulos por dominio que comparten una base, para que
una operación de salud sea completa o no ocurra (ADR-01). Las aplicaciones no hablan con la base: todo pasa por la API,
que autoriza cada operación con el PDP (ADR-02) y la audita en la misma transacción (ADR-04).

#pagina-apaisada[
  #lamina("ARQ-02", "Contenedores de BE (C4, nivel 2)", alcance: "Aplicaciones, API, base de datos, tarea programada y servicios externos que la API invoca", fuente: "render.yaml, docs/DESPLIEGUE.md, apps/api/src", etiqueta: "fig-arq-contenedores")
]

== Despliegue

Render aloja los cuatro servicios del ambiente en Frankfurt: el sitio estático (`be-web`, con CSP y HSTS), la API en
un contenedor Docker (`be-api`, plan Starter), la base PostgreSQL 16 en red privada (`be-db-test`, plan Basic) y la
tarea programada (`be-recordatorios`, a las 01, 13 y 18 UTC: 22, 10 y 15 h de Argentina). Un cambio llega así:

+ Se integra en `main` por un PR, con la CI en verde (legajo, pruebas, recorridos e imagen de la API).
+ Render despliega solo cuando la CI pasa (`autoDeployTrigger: checksPass`).
+ La API aplica las migraciones al arrancar y recibe tráfico recién cuando `/health/ready` responde.

La APK no pasa por una tienda (ADR-06): se construye con EAS o con Gradle y se publica como release de GitHub, con su
huella SHA-256; la persona la instala desde ahí. Un aviso viaja de la API a Expo Push, de Expo a Firebase y de Firebase
al teléfono, sin datos de salud: solo «Tenés una novedad». Para entrar con Google, el cliente obtiene el token de
Google y la API lo verifica con las claves públicas de Google (DL-138), sin guardar secretos.

#pagina-apaisada[
  #lamina("ARQ-03", "Despliegue del ambiente test (C4)", alcance: "Dónde corre cada contenedor, cómo llega un cambio y por dónde viaja un aviso", fuente: "render.yaml, docs/DESPLIEGUE.md y .github/workflows/ci.yml", etiqueta: "fig-arq-despliegue")
]

== Decisiones que dan forma a la arquitectura

Las siete decisiones de arquitectura del legajo (`docs/mesa/MESA_02/DV-08_09/DV-08_ADR.md`) siguen vigentes. Durante la
construcción se tomaron otras, registradas como deudas del legajo resueltas (`docs/DEUDA_LEGAJO.md`). El anexo H las
detalla con su contexto, sus alternativas y sus consecuencias.

#table(
  columns: (22mm, 1fr, 30mm),
  table.header([Decisión], [Qué se decidió], [Estado]),
  [ADR-01], [Monolito modular sobre una sola base PostgreSQL, con transacciones locales.], estado("implementado"),
  [ADR-02], [Un único punto de decisión de autorización (PDP) para toda operación protegida.], estado("implementado"),
  [ADR-03], [Historia por adición: corregir o anular agrega filas; nada se borra.], estado("implementado"),
  [ADR-04], [Auditoría dentro de la misma transacción: si no se puede auditar, no hay éxito.], estado("implementado"),
  [ADR-05], [Render primero, con una arquitectura portable a otro proveedor.], estado("implementado"),
  [ADR-06], [La APK se distribuye directamente, sin tiendas.], estado("implementado"),
  [ADR-07], [Concurrencia optimista con un único mecanismo (versión esperada).], estado("implementado"),
  [DL-030], [El website llama a la API directamente, con CORS, en lugar de un reenvío desde el sitio.], estado("implementado"),
  [DL-036], [Mientras no exista la verificación profesional, un servicio interno habilita a los profesionales sintéticos.], estado("implementado"),
  [DL-120], [Las fotos se guardan en PostgreSQL, con sus bytes aparte de sus datos, en lugar de un almacenamiento de objetos.], estado("implementado"),
  [DL-133], [Novedades internas y avisos al teléfono por Expo y Firebase, sin datos sensibles.], estado("implementado"),
  [DL-138], [Acceso con Google verificado en la API con las claves públicas de Google.], estado("verificado"),
  [DL-147], [La sesión del website sobrevive a una recarga con una cookie HttpOnly rotativa, sin tokens en el almacenamiento del navegador.], estado("verificado"),
  [DL-148], [Borradores con estado de escritura inequívoco, autoguardado y conflicto explícito entre pestañas.], estado("verificado"),
)

«Verificado en test» indica una comprobación en el despliegue o en el teléfono, con fecha (apartado 5). DL-133 está
probada en la API y en la CI; falta un aviso recibido en un teléfono real (apartado 5.9).
