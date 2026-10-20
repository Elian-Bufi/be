#import "../plantilla.typ": *

#let ver = json("../../datos/version.json")

= URL a una demo de la APK y del website

#table(
  columns: (40mm, 1fr),
  table.header([Campo], [Valor]),
  [URL de la demo], pendiente("Pendiente de incorporación en el cierre"),
  [Formato], pendiente("A definir en el cierre: demostración en vivo, video o ambas"),
)

Los enlaces se completan al cierre. Este apartado deja preparado el guion de la demostración, verificado contra la
versión de referencia (#id(ver.commitCorto)) y con las cuentas del apartado 14.

== Antes de empezar

- *La API responde.* `GET /health/ready` devuelve 200 y el commit que se va a mostrar. Desde el 2026-10-16 los
  servicios de test son pagos y no se duermen.
- *La APK.* La estable es la #ver.apk.estable.version; la candidata #ver.apk.candidata.version trae lo último (acceso
  con Google, invitaciones por QR, agenda, novedades), pero todavía no se probó entera en el teléfono (apartado 5.9).
  #pendiente("Dirección elige la versión de la demo")
- *Las cuentas.* Las nueve de la cohorte, con sus credenciales de la versión de evaluación.
- *El plan B.* Las capturas verificadas de cada paso, en el orden del guion, por si falla la red o el teléfono (base de
  la defensa).
- *Un ensayo completo antes*, con el teléfono de la demo.

== Guion (unos 20 minutos)

#table(
  columns: (9mm, 34mm, 1fr, 1fr),
  table.header([], [Quién y dónde], [Qué se muestra], [Qué demuestra]),
  [1], [La cara pública del website], [Qué es BE y lo que no hace: no diagnostica, no puntúa personas, no arma planes solo.], [El alcance y los límites (apartado 2).],
  [2], [Sofía Paz, website, espacio profesional], [Pendientes como hechos con fecha y la cartera de personas con nombre. Recargar la página: la sesión sigue.], [RF-052 y la sesión que sobrevive a la recarga (DL-147).],
  [3], [La ficha de Diego Sosa], [Resumen por área, línea de tiempo con planes, revisiones y tomas, y «Analizar»: el peso del último año (el período llega hasta 366 días) con las versiones del plan como bandas.], [La historia por adición y la línea de tiempo entre dominios.],
  [4], [Sofía Paz, plan nutricional], [Editar un borrador: «Pendiente de guardar» y «Guardado a las…». Validar y activar una versión.], [Activar es versionar (DL-148, UC-P11).],
  [5], [Martín Acosta, ficha de Federico], [La revisión preparada con la evidencia del período; registrar una revisión con la decisión y su porqué.], [El ciclo de seguimiento cerrado (UC-P18).],
  [6], [APK con Federico], [La novedad de la revisión; tocarla abre la revisión con lo que cambia en su plan.], [Avisos sin datos sensibles (DL-133).],
  [7], [APK con Diego], [Inicio, el plan del día, la sesión por serie, Mi evolución y Novedades. Registrar una comida.], [El circuito del asesorado (UC-P12, UC-P17).],
  [8], [APK con Diego, privacidad], [Revocar el consentimiento de un área y ver que el profesional pierde el acceso; volver a autorizar.], [Consentir no es aceptar; la revocación corta hacia adelante (UC-P08).],
  [9], [La métrica de la tesis], [La TVCC-30, calculada con el comando interno sobre la cohorte: N, D y la tasa del corte del día.], [La North Star medida y reproducible (RF-058).],
  [10], [Para cerrar], [La CI de la versión, las pruebas por caso y el registro de decisiones.], [Cómo se sabe que es cierto (apartado 5).],
)

== Cuidados durante la demostración

- *Registrar deja historia.* Una revisión o una comida registrada no se borra. Para ensayar, usar a Federico o a
  Norma, que tienen revisiones pendientes, y no a Diego, que es el ejemplo de los gráficos.
- *Después del paso 8*, volver a autorizar el área revocada, para que la demo siguiente la encuentre igual.
- *Los pendientes cambian con el calendario:* se fijaron al cargar la cohorte (2026-10-16); otro día los números son
  otros, y está bien.
- *La TVCC-30 depende de la fecha del corte:* se muestra el resultado del día, no un número fijo.
- *Si el inicio de sesión dice «demasiados intentos»*, esperar: el límite es por red y por cuenta.
- *Si la red falla*, seguir con las capturas del plan B, en el mismo orden.
