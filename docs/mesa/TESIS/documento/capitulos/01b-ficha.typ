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
  columns: (8mm, 1fr, 40mm),
  table.header([N.º], [Entregable], [En esta versión]),
  [1], [Presentación], [portada con campos a completar],
  [2], [Acta del proyecto], estado("completo"),
  [3], [Requisitos funcionales], estado("completo"),
  [4], [Casos de uso: diagramas y documentación], estado("completo"),
  [5], [Casos de prueba], estado("completo"),
  [6], [Diagrama entidad–relación], estado("completo"),
  [7], [Diagrama de clases], estado("completo"),
  [8], [Diagrama de arquitectura], estado("completo"),
  [9], [Diagrama de componentes], estado("completo"),
  [10], [Diagrama de Gantt], estado("diferido"),
  [11], [URL a una demo de la APK y del website], [#estado("diferido") (guion listo)],
  [12], [URL para descargar la APK y URL de su código fuente], estado("diferido"),
  [13], [URL del website hosteado y URL de su código fuente], estado("diferido"),
  [14], [Usuarios para acceder a la APK y al website con diferentes roles], [#estado("verificado") (credenciales: versión de evaluación)],
)

== Cómo leer este documento

#set par(justify: false)

- *Estado de un entregable.* #estado("completo"): el apartado está terminado en esta versión.
  #estado("diferido"): lo completa Dirección al final (el Gantt y los enlaces).
- *Estado de cada elemento.* #estado("verificado"): comprobado en el despliegue de test o en el teléfono, con fecha.
  #estado("implementado"): construido y probado en la CI de la versión de referencia. #estado("parcial"): una parte
  funciona y otra no. #estado("pendiente"): aprobado y todavía no construido. #estado("fuera"): fuera del alcance de
  esta entrega por decisión de Dirección.
- *Identificadores.* RF (requisito funcional), UC (caso de uso), TEST (caso de prueba), API (operación del contrato),
  DL (decisión registrada en `docs/DEUDA_LEGAJO.md`), ADR (decisión de arquitectura del legajo); DEC, ASR, REG e INV
  (decisiones, requisitos de arquitectura, reglas e invariantes del legajo), WP (paquete de trabajo), Q (pregunta
  abierta del legajo), A1 a A3 y B2 (actos y consentimientos, anexo I). «06:2774» es el documento 06, línea 2774; W, A y
  S son website, APK y servidor. El legajo es el
  conjunto de documentos canónicos del proyecto (`docs/legajo`); este documento lo cita y no lo reescribe.
- *Figuras y tablas.* Cada lámina lleva su identificador, su fuente y la versión, y sale de una fuente editable
  (anexo L). Llevan número las figuras y las cinco tablas que resumen una comparación o una medición (2.1, 3.1, 5.1,
  5.2 y 6.1); las demás se leen junto al párrafo que las presenta.
- *Dos versiones del PDF.* La pública, en el repositorio, deja como campos a completar el logotipo de la escuela, los
  correos institucionales y las credenciales. La de evaluación los incorpora y se compila fuera del repositorio.
- *Dirección.* El rol que dirige el proyecto (apartado 2.10); «lo decidió Dirección» remite a una decisión registrada.
- *Lo que no se hizo.* Cuando algo no se pudo comprobar, el documento lo dice y dice por qué.

== Procedimiento de entrega

Según «Entregables», un integrante envía este PDF desde su correo institucional, con copia al resto de los
integrantes, a `coordinacion.as@davinci.edu.ar`. Después, el tutor o la tutora lo revisa y pide las correcciones
necesarias, antes de la presentación ante el tribunal. Este documento no envía nada.
