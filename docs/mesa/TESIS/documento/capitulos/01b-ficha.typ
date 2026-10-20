#import "../plantilla.typ": *

// Ficha del trabajo: la presentación del apartado 1 que sigue a la portada. Las cifras salen de los datos (estado,
// esquema, casos de prueba, contrato), así no se desactualizan respecto del resto del documento.
#let ver = json("../../datos/version.json")
#let est = json("../../datos/estado.json")
#let esq = json("../../datos/esquema.json")
#let dp = json("../../datos/casos-de-prueba.json").casos
#let fam = json("../../datos/familias-api.json")
#let cuenta(o, clave) = o.values().filter(v => v.estado == clave).len()

= Presentación

== Resumen

BE es una plataforma para que profesionales de nutrición, de entrenamiento y de antropometría acompañen a una misma
persona sin mezclar sus áreas. La persona es la titular de sus datos: acepta cada vínculo, da o revoca el
consentimiento de cada finalidad y ve su propia evolución. El profesional trabaja desde un espacio web con su cartera,
la ficha de cada persona, los planes versionados y las revisiones; la persona sigue su plan y registra desde una APK
para Android.

La versión de referencia de este documento es #id(ver.commitCorto) (#ver.fecha), desplegada en el ambiente
#ver.ambiente.nombre. Tiene #fam.operaciones operaciones de API, #esq.modelos.len() tablas y
#est.requisitos.len() requisitos funcionales: #cuenta(est.requisitos, "verificado") verificados en el despliegue o en el
teléfono, #cuenta(est.requisitos, "implementado") implementados y probados en la CI, #cuenta(est.requisitos, "parcial")
parciales, #cuenta(est.requisitos, "pendiente") pendientes y #cuenta(est.requisitos, "fuera") fuera de alcance por
decisión de Dirección. De los #dp.len() casos de prueba diseñados, #dp.filter(c => c.clase == "cubierto").len() pasan
en la CI, #dp.filter(c => c.clase == "parcial").len() pasan en parte y #dp.filter(c => c.clase == "no-ejecutable").len()
no son ejecutables con lo que se entrega.

== Datos del trabajo

#table(
  columns: (44mm, 1fr),
  table.header([Dato], [Valor]),
  [Proyecto], [BE — Plataforma integrada de inteligencia en salud],
  [Carrera y escuela], [Analista de Sistemas · Escuela Da Vinci],
  [Integrantes], if es-evaluacion and "integrantes" in privado { privado.integrantes.map(i => i.nombre).join(", ") } else { [Elián Bufi] },
  [Mes y año de presentación], if es-evaluacion and privado.at("mesDePresentacion", default: none) != none { privado.mesDePresentacion } else { pendiente("a completar") },
  [Tutor o tutora], pendiente("a completar"),
  [Versión del documento], [#ver.documento.version · corte #ver.documento.fechaDeCorte],
  [Versión del producto], [#id(ver.commitCorto) del #ver.commitFecha.slice(0, 10) · APK estable #ver.apk.estable.version · candidata #ver.apk.candidata.version],
  [Ambiente], [#ver.ambiente.nombre (#ver.ambiente.proveedor), solo datos sintéticos],
)

== Los catorce entregables

El documento sigue el orden de «Entregables» (versión 2025.05). Los anexos van después del apartado 14.

#table(
  columns: (8mm, 1fr, 34mm),
  table.header([N.º], [Entregable], [En esta versión]),
  [1], [Presentación], [portada con campos #linebreak() a completar],
  [2], [Acta del proyecto], estado("implementado"),
  [3], [Requisitos funcionales], estado("implementado"),
  [4], [Casos de uso: diagramas y documentación], estado("implementado"),
  [5], [Casos de prueba], estado("implementado"),
  [6], [Diagrama entidad–relación], estado("implementado"),
  [7], [Diagrama de clases], estado("implementado"),
  [8], [Diagrama de arquitectura], estado("implementado"),
  [9], [Diagrama de componentes], estado("implementado"),
  [10], [Diagrama de Gantt], estado("diferido"),
  [11], [URL a una demo de la APK y del website], [#estado("diferido") (guion listo)],
  [12], [URL para descargar la APK y URL de su código fuente], estado("diferido"),
  [13], [URL del website hosteado y URL de su código fuente], estado("diferido"),
  [14], [Usuarios para acceder a la APK y al website con diferentes roles], [#estado("verificado") (credenciales en la versión de evaluación)],
)

En la tabla, «Implementado» indica que el apartado está completo en esta versión. «Diferido al cierre» corresponde a
lo que Dirección completará al final: el Gantt y los enlaces.

== Cómo leer este documento

- *Estado de cada elemento.* #estado("verificado"): comprobado en el despliegue de test o en el teléfono, con fecha.
  #estado("implementado"): construido y probado en la CI de la versión de referencia. #estado("parcial"): una parte
  funciona y otra no. #estado("pendiente"): aprobado y todavía no construido. #estado("fuera"): fuera del alcance de
  esta entrega por decisión de Dirección.
- *Identificadores.* RF (requisito funcional), UC (caso de uso), TEST (caso de prueba), API (operación del contrato),
  DL (decisión registrada en `docs/DEUDA_LEGAJO.md`), ADR (decisión de arquitectura del legajo). El legajo es el
  conjunto de documentos canónicos del proyecto (`docs/legajo`); este documento lo cita y no lo reescribe.
- *Figuras.* Cada lámina lleva su identificador, su fuente y la versión. Se generan de una fuente editable por
  figura (anexo L).
- *Dos versiones del PDF.* La pública, en el repositorio, deja como campos a completar el logotipo de la escuela, los
  correos institucionales y las credenciales. La de evaluación los incorpora y se compila fuera del repositorio.
- *Dirección.* El rol que dirige el proyecto y decide su alcance (apartado 2.10). «Lo decidió Dirección» remite
  siempre a una decisión registrada.
- *Tablas.* Las figuras llevan número y leyenda. Las tablas se leen junto al párrafo que las presenta; solo las cinco
  que resumen una comparación o una medición (2.1, 3.1, 5.1, 5.2 y 6.1) llevan número.
- *Lo que no se hizo.* Cuando algo no se pudo comprobar, el documento lo dice y dice por qué.

== Procedimiento de entrega

Según «Entregables», un integrante envía este PDF desde su correo institucional, con copia al resto de los
integrantes, a `coordinacion.as@davinci.edu.ar`. Después, el tutor o la tutora lo revisa y pide las correcciones
necesarias, antes de la presentación ante el tribunal. Este documento no envía nada: el envío lo hace un integrante del grupo, como indica la escuela.
