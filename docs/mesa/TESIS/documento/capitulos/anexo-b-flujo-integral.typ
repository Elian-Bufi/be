#import "../plantilla.typ": *
#import "_operaciones.typ": tabla-de-acciones

= Flujo integral profesional–asesorado

Este anexo muestra en un solo diagrama el circuito completo entre un profesional y un asesorado: cómo empieza la
relación, cómo se habilita el acceso a los datos, cómo se planifica y se registra, y cómo la revisión decide si el
seguimiento continúa o se cierra. Es la vista de conjunto: el anexo C baja al detalle de cada área y el anexo E muestra
los estados por los que pasa cada pieza.

== Notación

Diagrama de actividad de UML 2.5.1 con particiones, que acá se llaman carriles. Cada carril dice quién actúa y por
dónde: el profesional desde el website, BE (la API y su base de datos) y el asesorado desde la APK. Las acciones de una
persona y las de BE tienen colores distintos, pero además están en carriles distintos, así el significado no depende del
color. El rombo es una decisión (una entrada, varias salidas) o una fusión (varias entradas, una salida), y cada salida
de una decisión lleva su guarda entre corchetes. El círculo lleno es el inicio; el círculo con un punto, el fin.

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El profesional invita a una persona y BE crea una invitación de un solo uso, con su enlace y su código; el website
  dibuja además el QR. El asesorado abre la invitación, acepta el vínculo y autoriza el acceso: recién entonces el
  profesional puede evaluarlo, fijar el objetivo y activar un plan. Al activarlo, BE decide si se puede, congela la
  versión, abre el proceso y le avisa al asesorado. El asesorado sigue el plan y registra, y BE guarda cada registro sin
  borrar nada. El profesional revisa y decide: FINALIZAR cierra el proceso; AJUSTAR o SUSTITUIR crean un borrador
  sucesor; cualquier otro resultado sigue con el mismo plan.
]

#pagina-apaisada[
  #lamina("B-01", "Flujo integral profesional–asesorado", alcance: "Del primer contacto a la revisión que continúa o cierra el seguimiento", fuente: "apps/api/src y packages/domain/src/revision.ts", etiqueta: "fig-b-integral")
]

== Cada acción, en el contrato

Cada acción de la lámina corresponde a operaciones reales de la API. La tabla da el identificador del contrato, el
método y la ruta, y el caso de uso que la operación deja registrado en su procedencia, que es el que queda en la
auditoría. Cuando una acción tiene dos versiones, la primera es la de nutrición y la segunda la de entrenamiento. Ver
una invitación antes de aceptarla es una lectura sin caso de uso propio en el código.

#tabla-de-acciones((
  ([Invita a una persona · Crea la invitación], ("API-INV-01",)),
  ([Abre la invitación y acepta · Vínculo aceptado], ("API-INV-04", "API-INV-05", "API-REL-03")),
  ([Autoriza el acceso · Acceso habilitado], ("API-CON-02", "API-CON-06")),
  ([Evalúa y fija el objetivo], ("API-NUT-01", "API-NUT-04", "API-TRN-01", "API-TRN-04")),
  ([Arma y activa el plan · Decide y activa], ("API-NUT-07", "API-NUT-10", "API-NUT-12", "API-TRN-07", "API-TRN-10", "API-TRN-12")),
  ([Sigue el plan y registra · Guarda cada registro], ("API-ING-02", "API-TRN-17", "API-TRN-18")),
  ([Revisa y decide], ("API-NUT-17", "API-NUT-18", "API-TRN-21", "API-TRN-22")),
  ([Aplica la revisión], ("API-NUT-20", "API-TRN-24")),
))

== Lo que el diagrama deja afuera

- *El camino de error.* El diagrama sigue el camino en el que todo se permite. Si el vínculo está pausado o finalizado,
  o el consentimiento revocado, la operación siguiente se deniega con el mismo 404 que si el recurso no existiera, y la
  decisión queda registrada (apartado 7 y anexo E).
- *Pausar, reanudar y finalizar el vínculo, y revocar el consentimiento.* Cambian lo que el profesional puede hacer,
  no el camino; sus estados están en el anexo E.
- *La antropometría.* No tiene plan ni proceso: su flujo está en el anexo C.
- *Los formularios de información, las notas de coordinación y los recordatorios.* Aparecen en los diagramas de flujo
  de datos del anexo D.
