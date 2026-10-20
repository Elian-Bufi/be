#import "../plantilla.typ": *

// Las tablas de transición salen del código (herramientas/maquinas-de-estado.mjs → datos/maquinas-de-estado.json).
#let maquinas = json("../../datos/maquinas-de-estado.json").maquinas
#let actor-legible = (PROFESIONAL: "profesional", ASESORADO: "asesorado", SISTEMA: "sistema")
#let tabla-de-transiciones(ids) = {
  set text(size: 10pt, hyphenate: false)
  set par(justify: false)
  table(
    columns: (30mm, 62mm, 1fr, 1fr),
    table.header([Máquina], [Transición], [De → a], [Quién la dispara]),
    ..maquinas
      .filter(m => m.id in ids)
      .map(m => m.transiciones.enumerate().map(((i, t)) => {
        let celdas = ()
        if i == 0 { celdas.push(table.cell(rowspan: m.transiciones.len(), m.nombre)) }
        celdas.push(id(t.transicion))
        celdas.push([#if t.origen == none [(inicio)] else [#t.origen] → #t.destino])
        celdas.push(t.actores.map(a => actor-legible.at(a, default: a)).join(", ", last: " o "))
        celdas
      }).flatten())
      .flatten(),
  )
}

= Secuencias y estados

Este anexo baja a dos mecanismos del código que sostienen lo que el resto del documento afirma, y a las máquinas de
estados que gobiernan las piezas principales. Las secuencias usan los nombres reales de las clases y los métodos; las
máquinas de estados se copian de las tablas de transición del dominio, que el servicio consulta antes de escribir y que
la base refuerza.

== Notación

*Secuencia (UML 2.5).* Cada participante tiene su cabecera y su línea de vida discontinua; el tiempo corre hacia abajo.
La flecha continua con punta llena es una llamada; la discontinua con punta abierta, una respuesta; la continua con
punta abierta, un mensaje asíncrono. La barra angosta sobre una línea de vida es el tramo en que ese participante está
trabajando. Un marco «alt» separa alternativas, cada una con su guarda entre corchetes.

*Estados (UML 2.5).* El círculo lleno es el estado inicial; la caja redondeada, un estado; la flecha, una transición
con su nombre y quién puede dispararla; el círculo con un punto, el fin. Una transición que sale y vuelve al mismo
estado no lo cambia, pero queda registrada como evento.

== Activar un plan

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El website pide activar una versión de plan con una clave de idempotencia. La API valida el pedido y abre UNA
  transacción, bloqueando esa clave. Si es la primera vez, el servicio pide la decisión al PDP dentro de la
  transacción, y solo si la decisión es «permitida» escribe: la instantánea, la versión ACTIVADA, el proceso y la novedad
  para el asesorado. Después el esqueleto común registra la auditoría y la idempotencia guarda la respuesta; todo se
  confirma junto. Si la clave ya tenía resultado, el PDP vuelve a decidir antes de devolver lo guardado. El aviso push
  sale después, fuera de la transacción.
]

#pagina-apaisada[
  #lamina("E-01", "Secuencia · activar un plan (API-NUT-12)", alcance: "Idempotencia, decisión del PDP y auditoría en una transacción; el aviso, después", fuente: "apps/api/src (nutricion, plataforma, autorizacion, novedades)", etiqueta: "fig-e-activar")
]

Lo que la secuencia demuestra, cada punto con su fuente en el código:

- *Todo o nada.* La decisión del PDP, la instantánea, la versión activada, el proceso, la novedad y la auditoría se
  escriben en la misma transacción (`IdempotenciaService.ejecutar` abre `$transaction`; `PublicadorDeNovedades.publicar`
  recibe esa transacción). Si algo falla, no cambia nada (ADR-01 y ADR-04).
- *Sin decisiones viejas.* El PDP decide dentro de la transacción, con los hechos del par profesional–asesorado
  bloqueados. Una revocación que llega antes se ve; una que llega después espera (ADR-02).
- *Un reintento no duplica.* La clave de idempotencia se bloquea al empezar; un reintento con la misma clave vuelve a
  pasar por el PDP y, si sigue permitido, recibe la respuesta guardada sin escribir de nuevo.
- *Lo que se deniega no deja rastro de datos.* Si el PDP deniega, lanza `DenegacionDelPdp`: la transacción se revierte
  entera, la decisión denegada se registra aparte y la respuesta es el mismo 404 que para un recurso inexistente.
- *El aviso no frena a nadie.* `DespachadorDeAvisos.programar()` agenda dos pasadas, a los 2 y a los 20 segundos, fuera
  de la transacción. Si Expo Push no responde, la novedad ya está guardada y el aviso se reintenta en otra pasada.

== Recuperar la sesión del website

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  Al recargar, el website no tiene token: lo pide a la API con una cookie que solo la API puede leer. La API verifica
  que el pedido venga del website, busca la sesión por la huella del secreto y la bloquea. Si el secreto es el vigente,
  lo rota y devuelve un token nuevo de la misma sesión. Si otra pestaña acaba de rotarlo, vale sin rotar de nuevo. Si
  es una copia vieja, revoca la sesión. En cualquier rechazo, borra la cookie y responde 401. El token vive solo en la
  memoria de la pestaña.
]

#pagina-apaisada[
  #lamina("E-02", "Secuencia · recuperar la sesión del website (DL-147)", alcance: "La cookie de reanudación, la rotación del secreto y las respuestas posibles", fuente: "apps/api/src/sesion y apps/web/src/lib/sesion.tsx", etiqueta: "fig-e-sesion")
]

La cookie es de la API, no del website: los dos están en dominios distintos de `onrender.com`, que es un sufijo público,
así que la cookie va con `SameSite=None`, `Secure` y `Partitioned` (CHIPS), y es `HttpOnly`. Su ruta es
`/api/v1/auth/sessions`: no viaja con ningún pedido de datos, que siguen autenticados con el token en memoria. Por eso
no hay superficie de falsificación de pedidos en las operaciones de datos, y nada queda en `localStorage` ni en
`sessionStorage`. El margen para dos pestañas que recargan a la vez es de dos minutos. Las pruebas de esta secuencia en
test (Chrome 15 de 15 y Edge 13 de 13, el 2026-10-20) están en el apartado 5; Safari y Firefox no se probaron (anexo K).

== Estados del vínculo

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  Una solicitud de vínculo nace PENDIENTE y se resuelve una sola vez: el asesorado la acepta o la rechaza, o el sistema
  la da por caducada o inválida. Aceptarla crea el alcance del vínculo para esa área, que empieza ACEPTADO; el
  asesorado o el profesional pueden pausarlo y reanudarlo, y cualquiera de los dos o el sistema puede finalizarlo.
  FINALIZADO no tiene salida.
]

#pagina-apaisada[
  #lamina("E-03", "Estados · solicitud y alcance del vínculo", alcance: "La solicitud que se resuelve una vez y el alcance que se pausa, se reanuda y se finaliza", fuente: "packages/domain/src/vinculo.ts", etiqueta: "fig-e-vinculo")
]

#tabla-de-transiciones(("solicitud", "alcance"))

== Estados del consentimiento, del plan y del proceso

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El consentimiento lo decide siempre el asesorado: lo otorga, acepta una versión nueva del texto, lo revoca y lo puede
  volver a otorgar. Una versión de plan nace BORRADOR, se guarda las veces que haga falta y, al activarse, queda
  ACTIVADA para siempre: un ajuste crea otra versión. El proceso operativo se abre al activar un plan sin proceso
  abierto, sigue ABIERTO con cada revisión que no finaliza y se cierra por una revisión que finaliza, por el fin del
  vínculo o por el cierre de la cuenta. CERRADO no se reabre.
]

#pagina-apaisada[
  #lamina("E-04", "Estados · consentimiento, versión de plan y proceso", alcance: "Tres máquinas reales del dominio", fuente: "packages/domain/src (consentimiento-profesional.ts, nutricion.ts, proceso.ts)", etiqueta: "fig-e-consentimiento-plan-proceso")
]

#tabla-de-transiciones(("consentimiento", "version-de-plan", "proceso"))

La versión de plan de entrenamiento usa el mismo tipo de estado (`EstadoDeVersionDePlan`, con BORRADOR y ACTIVADA) que
la de nutrición. Validar no es un estado: es una condición de `ActivarVersion`. Como máximo hay un proceso ABIERTO por
profesional, asesorado y área (REG-06-78), y lo garantiza un índice único parcial de la base (apartado 6).
