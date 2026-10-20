#import "../plantilla.typ": *
#import "_operaciones.typ": tabla-de-acciones

= Flujos por área

El flujo integral del anexo B vale para nutrición y entrenamiento. Lo que cambia de un área a otra es qué se
planifica, qué registra cada persona y qué queda de cada registro. Este anexo dibuja esas diferencias con la misma
notación (diagrama de actividad de UML 2.5.1 con carriles, anexo B). Nutrición y entrenamiento tienen plan, proceso
operativo y revisión con resultado; antropometría no tiene plan ni proceso operativo: la toma y sus cálculos son la
información misma.

== Nutrición

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El profesional arma el plan con días tipo, comidas y opciones (que pueden salir de una receta), lo valida y lo
  activa. BE congela una instantánea, abre el proceso y le avisa al asesorado. Cada día, el asesorado ve el plan y, para
  cada comida, registra una opción del plan con su cantidad o algo diferente, con texto, foto o los dos. BE guarda el
  registro; corregir una cantidad o deshacer un registro agrega otro, nunca borra. El profesional revisa y el resultado
  decide si sigue el mismo plan, si se ajusta o si el seguimiento termina.
]

#pagina-apaisada[
  #lamina("C-01", "Flujo de nutrición", alcance: "Del plan a la revisión, con el registro de cada comida", fuente: "apps/api/src/nutricion y apps/mobile/src/pantallas", etiqueta: "fig-c-nutricion")
]

#tabla-de-acciones((
  ([Arma el plan], ("API-NUT-07", "API-NUT-10")),
  ([Valida y activa · Activa el plan], ("API-NUT-11", "API-NUT-12")),
  ([Ve el plan del día], ("API-NUT-14", "API-ING-01")),
  ([Registra una opción · Registra otra comida · Guarda el registro], ("API-ING-02", "API-MED-01", "API-MED-02")),
  ([Corregir o deshacer (detalle de «Guarda el registro»)], ("API-ING-05", "API-ING-06")),
  ([Revisa y decide], ("API-NUT-17", "API-NUT-18")),
  ([Aplica la revisión], ("API-NUT-20",)),
))

La foto de una comida diferente se sube en dos pasos que no son del dominio de nutrición: primero se declara la
intención de subida y después se suben los bytes a una ruta firmada (DL-120); por eso esas dos operaciones no tienen
caso de uso propio en el código. Lo que se come diferente no se convierte en cantidades ni en macros: queda «sin
calcular» hasta que el profesional lo estructure como estimación (API-NUT-21, fuera de la lámina).

== Entrenamiento

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El profesional arma el plan con sesiones, ejercicios y series, lo valida y lo activa. BE no guarda una agenda: la
  calcula desde el plan activado cada vez que el asesorado la mira. Al iniciar una sesión, BE abre un borrador en el
  servidor, uno por sesión y fecha, que se retoma si la sesión se corta. El asesorado registra cada serie (carga,
  repeticiones, RIR y esfuerzo, todos opcionales y nunca inferidos) y confirma la sesión como realizada, con desvío o no
  realizada. Desde ahí la ejecución es inmutable y el profesional la revisa.
]

#pagina-apaisada[
  #lamina("C-02", "Flujo de entrenamiento", alcance: "Del plan a la revisión, con la sesión registrada serie por serie", fuente: "apps/api/src/entrenamiento y packages/domain/src", etiqueta: "fig-c-entrenamiento")
]

#tabla-de-acciones((
  ([Arma el plan], ("API-TRN-07", "API-TRN-10")),
  ([Valida y activa · Activa el plan], ("API-TRN-11", "API-TRN-12")),
  ([Ve su agenda], ("API-AGE-01", "API-TRN-14")),
  ([Inicia la sesión · Abre el borrador], ("API-TRN-15", "API-TIE-04")),
  ([Registra cada serie], ("API-SER-02", "API-TRN-17", "API-TIE-01")),
  ([Confirma la sesión · Registra la ejecución], ("API-TRN-18",)),
  ([Corregir agrega otra (detalle de «Registra la ejecución»)], ("API-TRN-20",)),
  ([Revisa y decide], ("API-TRN-21", "API-TRN-22")),
  ([Aplica la revisión], ("API-TRN-24",)),
))

La nota de la lámina marca un pendiente: sustituir un ejercicio durante la sesión. La API lo admite (un ejercicio
realizado distinto del prescripto es una sustitución legítima, que conserva la prescripción original) y la APK 0.13.2
lo ofrecía; la candidata 0.17.0 todavía no, y el PR \#195 que lo recupera está en borrador (DL-151, anexo K).

== Antropometría

#recuadro(titulo: [En 30 segundos], tipo: "decision")[
  El profesional prepara una toma: elige el protocolo y carga las mediciones sobre la figura. Lo que guarda queda en un
  borrador, que todavía no es historia: no entra en la evolución. Registrar es un acto aparte, con su confirmación, y
  después la toma no se edita: una corrección o una anulación agregan un registro. Con la toma registrada, el
  profesional corre un método del catálogo con su versión; los resultados conviven y BE no elige el mejor. El asesorado
  ve su evolución con lo registrado, sin interpolar.
]

#pagina-apaisada[
  #lamina("C-03", "Flujo de antropometría", alcance: "De la toma en preparación a la evolución", fuente: "apps/api/src/antropometria y apps/web/src/app/pro/advisees/anthropometry", etiqueta: "fig-c-antropometria")
]

#tabla-de-acciones((
  ([Prepara una toma · Guarda el borrador], ("API-ANT-07", "API-ANT-10")),
  ([Registra la toma], ("API-ANT-11",)),
  ([Corregir o anular (nota «Corregir sin borrar»)], ("API-ANT-05", "API-ANT-12")),
  ([Calcula con un método · Guarda la corrida], ("API-MTH-01", "API-CAL-01")),
  ([Marcar una referencia (nota «Los cálculos conviven»)], ("API-CAL-04",)),
  ([Ve su evolución], ("API-ANT-06-PROPIA", "API-ANT-06")),
))
