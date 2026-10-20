#import "../plantilla.typ": *

#let vistas = json("../../datos/vistas-der.json").vistas
#let modelos-de(ids) = vistas.filter(v => v.id in ids).map(v => v.modelos.len()).sum()

= Diagramas de flujo de datos

Los diagramas de flujo de datos (DFD) muestran por dónde viajan los datos: qué entra a BE, qué procesos lo transforman,
dónde se guarda y qué sale. No muestran el orden ni las decisiones: eso está en los anexos B y C. Hay dos niveles: el
de contexto, con BE como un solo proceso, y el nivel 1, que lo abre en ocho procesos.

== Notación

Se usa la notación de Yourdon y DeMarco:

- *Proceso:* un círculo con su número y un nombre que empieza con un verbo. El de contexto es el 0; los del nivel 1, del
  1 al 8. Un proceso del nivel 2 sería 4.1, 4.2…; esta versión no llega a ese nivel.
- *Almacén de datos:* un rectángulo abierto con su código (D1 a D8) y su nombre. Cada almacén es un grupo de vistas del
  DER del apartado 6, así el DFD y el DER cuentan la misma base.
- *Entidad externa:* un rectángulo con quien está afuera de BE: una persona o un sistema, con el mismo color y el mismo
  borde que en los diagramas de arquitectura.
- *Flujo de datos:* una flecha con el nombre del dato que viaja, nunca un verbo. Una flecha con dos puntas es un almacén
  que el proceso lee y escribe. Un flujo sin nombre entre un proceso y un almacén lleva registros completos del almacén
  (convención de Yourdon).

Dos cosas no se dibujan para no repetirlas en cada proceso, y se declaran acá: todo proceso que escribe deja su
historia y su auditoría en D8 (Historia y auditoría) en la misma transacción que su efecto, y todo acceso a datos de
salud lo decide el punto único de autorización (PDP), que lee el vínculo y el consentimiento en D3 y registra ahí su
decisión.

== Contexto

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  BE recibe del profesional sus credenciales y sus indicaciones (invitaciones, planes, tomas, revisiones), y le devuelve
  la sesión, la invitación lista para compartir, la ficha de cada asesorado y las novedades. Del asesorado recibe
  credenciales, decisiones (aceptar, consentir), registros y preferencias, y le devuelve el plan, la agenda, su
  evolución y las novedades. Con los sistemas externos intercambia lo mínimo: las claves públicas de Google para
  verificar una identidad, un aviso sin datos de salud para Expo Push y una consulta por código a los catálogos abiertos.
  El responsable de validación pide la medición de la TVCC-30 y recibe su resultado.
]

#pagina-apaisada[
  #lamina("D-00", "DFD de contexto (nivel 0)", alcance: "BE como un único proceso y los datos que intercambia", fuente: "ARQ-01 y apps/api/src", etiqueta: "fig-d-contexto")
]

== Nivel 1

El nivel 1 abre el proceso 0 en ocho procesos. Para que cada flujo se lea a tamaño real, se dibuja en tres láminas
con una sola numeración: D-01 lo que pone en marcha el seguimiento (procesos 1 a 3), D-02 el ciclo de seguimiento
(4 a 6) y D-03 los avisos y la medición (7 y 8). Un almacén que aparece en más de una lámina es el mismo almacén.

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  Primero hay que entrar (1), vincularse y consentir (2), y tener de dónde elegir alimentos, recetas y ejercicios (3).
  Con eso, el profesional planifica (4): el plan queda en D5 y el proceso abierto en D2. Lo que registran el asesorado y
  el profesional va a D6 (5). La revisión lee D6, escribe su resultado y mueve el proceso (6). Cada hecho que alguien
  tiene que ver deja una novedad en D7, que el proceso 7 entrega y avisa por push. El 8 mide la TVCC-30 leyendo procesos,
  vínculos y revisiones.
]

#pagina-apaisada[
  #lamina("D-01", "DFD de nivel 1 · acceso, vínculo y catálogos", alcance: "Procesos 1 a 3", fuente: "apps/api/src", etiqueta: "fig-d-nivel-1-alta")
]
#pagina-apaisada[
  #lamina("D-02", "DFD de nivel 1 · planificar, registrar y revisar", alcance: "Procesos 4 a 6", fuente: "apps/api/src", etiqueta: "fig-d-nivel-1-seguimiento")
]
#pagina-apaisada[
  #lamina("D-03", "DFD de nivel 1 · avisos y medición", alcance: "Procesos 7 y 8", fuente: "apps/api/src", etiqueta: "fig-d-nivel-1-avisos")
]

=== Los procesos

#{
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (9mm, 34mm, 1fr, 48mm),
    table.header([N.º], [Proceso], [Qué hace], [Carpetas de la API]),
    [1], [Gestionar el acceso], [Registra cuentas, abre y cierra sesiones, reanuda la del website (DL-147) y verifica la identidad de Google (DL-138).], [`identidad`, `sesion`, `acceso-google`],
    [2], [Vincular y consentir], [Invitaciones, solicitudes, vínculos por área y los dos consentimientos: el del profesional (B2) y el de datos de salud (A3).], [`vinculo`, `consentimiento`],
    [3], [Mantener los catálogos], [Alimentos, recetas y ejercicios propios, y la importación controlada desde Open Food Facts y wger.], [`nutricion`, `entrenamiento`, `integraciones`],
    [4], [Planificar], [Evaluaciones, objetivos y planes, y su activación, que abre o continúa el proceso.], [`nutricion`, `entrenamiento`, `proceso`],
    [5], [Registrar], [Comidas, sesiones de entrenamiento, tomas antropométricas, fotos y respuestas a formularios.], [`nutricion`, `entrenamiento`, `antropometria`, `medios`, `formularios`],
    [6], [Revisar y analizar], [Ficha, cartera y análisis; revisiones y su aplicación; notas de coordinación entre profesionales.], [`dashboard`, `cartera`, `analisis`, `coordinacion`, `proceso`],
    [7], [Informar y avisar], [Publica novedades en la transacción del hecho, las entrega y manda los avisos push después de confirmar; también corre por tiempo, con los recordatorios.], [`novedades`],
    [8], [Medir la TVCC-30], [Calcula el indicador de un corte con los hechos registrados y conserva el resultado (DL-135).], [`analitica`],
  )
}

Lo transversal no es un proceso del DFD: la autorización (`autorizacion`), la auditoría, la idempotencia y los eventos
(`plataforma`), el acceso a la base (`prisma`) y la habilitación de los profesionales sintéticos al arrancar
(`profesional`, DL-036).

=== Los almacenes y el DER

#{
  let filas = (
    ("D1", "Identidades y sesiones", ("DER-01",)),
    ("D2", "Profesionales y procesos", ("DER-02",)),
    ("D3", "Vínculos y consentimientos", ("DER-03", "DER-04")),
    ("D4", "Catálogos", ("DER-05", "DER-08")),
    ("D5", "Planes y objetivos", ("DER-06", "DER-09")),
    ("D6", "Registros y revisiones", ("DER-07", "DER-10", "DER-11", "DER-12")),
    ("D7", "Seguimiento y novedades", ("DER-13",)),
    ("D8", "Historia y auditoría", ("DER-14",)),
  )
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (16mm, 44mm, 1fr, 18mm),
    align: (left, left, left, right),
    table.header([Código], [Almacén], [Vistas del DER (apartado 6)], [Modelos]),
    ..filas.map(((c, n, ids)) => (id(c), n, vistas.filter(v => v.id in ids).map(v => [#id(v.id) #v.titulo]).join([; ]), str(modelos-de(ids)))).flatten(),
    table.cell(colspan: 3, align: right)[*Total*], [*#filas.map(f => modelos-de(f.at(2))).sum()*],
  )
}

=== Balanceo entre el contexto y el nivel 1

Un DFD está balanceado cuando lo que entra y sale de un proceso en un nivel es lo mismo que entra y sale de sus procesos
en el nivel siguiente. Los flujos del contexto son compuestos: la tabla los descompone con la notación del diccionario
de datos (= se compone de, + y) y dice qué procesos del nivel 1 los reciben o los emiten. Ningún flujo del nivel 1 con
una entidad externa queda fuera de esta tabla, y ninguno del contexto queda sin su proceso.

#{
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (52mm, 1fr, 20mm),
    table.header([Flujo del contexto (D-00)], [Composición en el nivel 1], [Procesos]),
    [Profesional → BE: credenciales e indicaciones], [credenciales + invitación + alimento, receta o ejercicio propio + evaluación, objetivo y plan + tomas y pedidos de información + revisión y notas de coordinación], [1, 2, 3, 4, 5, 6],
    [BE → Profesional: sesión, invitación, ficha y novedades], [sesión + enlace y código + ficha y cartera + novedades], [1, 2, 6, 7],
    [Asesorado → BE: credenciales, decisiones, registros y preferencias], [credenciales + aceptación y consentimientos + comidas, sesiones y respuestas + suscripción y preferencias], [1, 2, 5, 7],
    [BE → Asesorado: sesión, plan, agenda, evolución y novedades], [sesión + plan y agenda + evolución + novedades], [1, 4, 6, 7],
    [Google → BE: claves públicas], [claves públicas], [1],
    [BE → Expo Push y FCM: aviso sin datos de salud], [aviso sin datos de salud], [7],
    [Expo Push y FCM → BE: resultado del envío], [resultado del envío], [7],
    [BE → Open Food Facts y wger: código de barras o número], [código de barras o número], [3],
    [Open Food Facts y wger → BE: datos del producto o del ejercicio], [datos del producto o del ejercicio], [3],
    [Responsable de validación → BE: pedido de medición], [pedido de medición], [8],
    [BE → Responsable de validación: resultado de la TVCC-30], [resultado de la TVCC-30], [8],
  )
}

El enlace de invitación viaja como dato; el QR que muestra el website es ese mismo enlace dibujado en la pantalla, y
por eso no es un flujo propio.
