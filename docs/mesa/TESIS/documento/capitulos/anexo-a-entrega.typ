#import "../plantilla.typ": *

= Entrega: criterios y procedimiento

La referencia es el documento de la escuela «Entregables del proyecto», carrera Analista de Sistemas, versión 2025.05
(tres páginas). Su huella SHA-256 está registrada en `docs/MANIFEST.sha256` (`cd77a245…800a8`). El archivo no se
versiona, porque el repositorio es público; Dirección lo conserva.

== Criterios de forma y cómo los cumple este documento

#table(
  columns: (1fr, 1.2fr, 30mm),
  table.header([Criterio de la escuela], [Cómo se cumple], [Estado]),
  [Un solo PDF con los catorce entregables, en el orden indicado], [Apartados 1 a 14 en ese orden; los anexos van después del 14.], estado("implementado"),
  [Un rótulo con el nombre del proyecto], [Encabezado de cada página: «BE · Plataforma integrada de inteligencia en salud» y el apartado en curso.], estado("implementado"),
  [Índice], [Índice al comienzo, con los apartados, sus secciones y los anexos; en el PDF, cada entrada es un enlace.], estado("implementado"),
  [Numeración de páginas], [Pie de cada página: «Página N de M».], estado("implementado"),
  [Portada con logotipo, nombre, imagen, integrantes con correo institucional, mes y año], [Logotipo y correos en la versión de evaluación; el mes y el año, a completar por Dirección (no se deducen).], [#estado("parcial") campos a completar],
  [Entregables digitales con nombres claros y sus enlaces], [Apartados 11, 12 y 13: los campos de los enlaces quedan para el cierre, por decisión de Dirección.], estado("diferido"),
  [Buena calidad], [Figuras vectoriales generadas de fuentes editables, con texto de 10 pt como mínimo y revisión automática y visual (anexo L).], estado("implementado"),
)

== Procedimiento de entrega

+ Un integrante envía el PDF desde su correo institucional (`@davinci.edu.ar`), con copia al resto de los integrantes,
  a `coordinacion.as@davinci.edu.ar`.
+ El tutor o la tutora revisa el trabajo y pide las correcciones necesarias.
+ Con las correcciones hechas, el trabajo se presenta ante el tribunal.

Este documento no envía nada. Antes del envío, Dirección completa: el mes y el año de presentación, los correos
institucionales, el Gantt (apartado 10) y los enlaces (apartados 11, 12 y 13). Después compila la versión de evaluación
con `node construir-documento.mjs --evaluacion`, que suma el logotipo y las credenciales desde una carpeta fuera del
repositorio.

== Lista de control antes de enviar

#table(
  columns: (8mm, 1fr),
  table.header([], [Control]),
  [☐], [Completar en `privado.json` los correos institucionales y el mes y año de presentación.],
  [☐], [Incorporar el Gantt en el apartado 10.],
  [☐], [Completar los enlaces de la demo, la APK, el website y el código fuente (apartados 11 a 13).],
  [☐], [Compilar la versión de evaluación y revisar la portada, el apartado 14 y los enlaces.],
  [☐], [Confirmar que el PDF de evaluación no se suba al repositorio (contiene credenciales).],
  [☐], [Enviar desde el correo institucional, con copia al resto, a `coordinacion.as@davinci.edu.ar`.],
)
