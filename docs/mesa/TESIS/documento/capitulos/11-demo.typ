#import "../plantilla.typ": *

#let ver = json("../../datos/version.json")

= URL a una demo de la APK y del website

#table(
  columns: (40mm, 1fr),
  table.header([Campo], [Valor]),
  [URL de la demo], pendiente("Pendiente de incorporación en el cierre"),
  [Formato], pendiente("A definir en el cierre: demostración en vivo, video o ambas"),
)

Los enlaces se completan al cierre. Este apartado deja preparado el guion de la demostración sobre la versión de
referencia (#id(ver.commitCorto)) y las cuentas del apartado 14. Las capturas de su plan B se tomaron en test el
2026-10-20, contra esa misma versión.

== Antes de empezar

- *La API responde.* `GET /health/ready` devuelve 200 y el commit que se va a mostrar. Desde el 2026-10-16 los
  servicios de test son pagos y no se duermen.
- *La APK.* La estable es la #ver.apk.estable.version\; la candidata #ver.apk.candidata.version trae lo último (acceso
  con Google, invitaciones por QR, agenda, novedades), pero todavía no se probó entera en el teléfono (apartado 5.9).
  #pendiente("Dirección elige la versión de la demo")
- *Las cuentas.* Las nueve cuentas de la demostración (tres profesionales y las seis personas de la cohorte), con sus
  credenciales en la versión de evaluación.
- *El plan B.* Doce capturas del website tomadas en test el 2026-10-20 y, para la APK, las capturas nativas de la
  0.9.1 y vistas del cliente real en el navegador, rotuladas como tales (`defensa/DEMO.md`).
- *Un ensayo completo antes*, con el teléfono de la demo.

== Guion (unos 20 minutos)

#table(
  columns: (9mm, 34mm, 1fr, 1fr),
  table.header([], [Quién y dónde], [Qué se muestra], [Qué demuestra]),
  [1], [La cara pública del website], [Qué es BE y lo que no hace: no diagnostica, no puntúa personas, no arma planes solo.], [El alcance y los límites (apartado 2).],
  [2], [Sofía Paz, website, espacio profesional], [Pendientes como hechos con fecha y la cartera de personas con nombre. Recargar la página: la sesión sigue.], [RF-052 y la sesión que sobrevive a la recarga (DL-147).],
  [3], [La ficha de Diego Sosa], [Resumen por área, línea de tiempo con planes, revisiones y tomas, y «Analizar»: el peso del último año (el período llega hasta 366 días) con las versiones del plan como bandas.], [La historia por adición y la línea de tiempo entre dominios.],
  [4], [Sofía Paz, plan nutricional de Federico], [Editar un borrador: «Pendiente de guardar» y «Guardado a las…». Validar y activar una versión.], [El borrador dice si está guardado (DL-148); activar es versionar (UC-P11).],
  [5], [Martín Acosta, ficha de Federico], [La revisión preparada con la evidencia del período; registrar una revisión con la decisión y su porqué.], [El ciclo de seguimiento cerrado (UC-P18).],
  [6], [APK con Federico], [La novedad de la revisión; tocarla abre la revisión con lo que cambia en su plan.], [Avisos sin datos sensibles (DL-133).],
  [7], [APK con Diego, solo mirar], [Inicio, el plan del día, la sesión por serie, Mi evolución y Novedades.], [El circuito del asesorado (UC-P12, UC-P17).],
  [8], [APK con Federico, registro y privacidad], [Registrar una comida. Revocar el consentimiento de un área y ver que el profesional pierde el acceso; volver a autorizar.], [Aceptar no es consentir; la revocación corta hacia adelante (UC-P12, UC-P08).],
  [9], [La métrica de la tesis], [El resultado de la TVCC-30 del 2026-10-16 sobre la cohorte sintética local: 5 de 7 ciclos (71,4 %), calculado con el comando interno.], [La métrica principal del legajo, reproducible (RF-058). Demuestra el cálculo; no mide el servicio.],
  [10], [Para cerrar], [La CI de la versión, las pruebas por caso y el registro de decisiones.], [Cómo se sabe que es cierto (apartado 5).],
)

== Cuidados durante la demostración

- *Registrar deja historia.* Una revisión o una comida registrada no se borra. Todo lo que se escribe en vivo se hace
  con Federico o con Norma, que tienen revisiones pendientes, y nunca con Diego, que es el ejemplo de los gráficos.
- *Después del paso 8*, volver a autorizar el área revocada, para que la demo siguiente la encuentre igual.
- *Los pendientes cambian con el calendario:* se fijaron al cargar la cohorte (2026-10-16); otro día los números son
  otros, y está bien.
- *La TVCC-30 no se corre en la mesa:* necesita la consola del servidor. Se muestra el resultado del 2026-10-16
  (`EVIDENCIA/TVCC-30/LEEME.md`).
- *Si el inicio de sesión dice «demasiados intentos»*, esperar: el límite es por red y por cuenta.
- *Si la red falla*, seguir con las capturas del plan B, en el mismo orden.
