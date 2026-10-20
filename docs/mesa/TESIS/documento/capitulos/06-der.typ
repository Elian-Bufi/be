#import "../plantilla.typ": *

// Datos: el esquema leído de prisma/schema.prisma (datos/esquema.json), las reglas contadas en el catálogo de una base
// real con las migraciones aplicadas (datos/restricciones-en-base.json), los índices únicos parciales leídos del SQL
// (datos/indices-parciales.json) y las claves que cruzan de una vista a otra (datos/claves-entre-vistas.json).
#let esq = json("../../datos/esquema.json")
#let rb = json("../../datos/restricciones-en-base.json")
#let parciales = json("../../datos/indices-parciales.json").indices
#let cev = json("../../datos/claves-entre-vistas.json").claves
#let cai = json("../../datos/claves-a-identidad.json").vistas
#let vistas = json("../../datos/vistas-der.json").vistas
#let vista(id-v) = vistas.find(v => v.id == id-v)

#let LECTURA = (
  "DER-01": [Identidad es la entidad de la que dependen todas las demás. Separa el perfil propio (versionado), los métodos de acceso (local o Google) con su credencial aparte, las sesiones con su reanudación encadenada y la solicitud de cierre de la cuenta.],
  "DER-02": [El perfil profesional, la verificación y la habilitación por área, y la capacidad versionada. El proceso operativo agrupa el trabajo de un profesional con una persona en un área; sus eventos y la cadena de próximas revisiones cuelgan de él.],
  "DER-03": [Cómo nace y cambia la relación: la invitación (por enlace, QR o código) y su resolución, la solicitud con sus antecedentes, el vínculo único por par y el alcance por área, que es el que tiene estado.],
  "DER-04": [Los actos de la persona (términos, privacidad, datos de salud) con la versión exacta del texto; el consentimiento por vínculo y finalidad con sus versiones; los eventos del vínculo y cada decisión del PDP. Aceptar un vínculo no es consentir.],
  "DER-05": [El catálogo nutricional: el elemento y sus versiones, lo importado de Open Food Facts (un ítem por proveedor e identificador, visible para todos), los nombres alternativos, las recetas con sus versiones e imágenes y los habituales del profesional.],
  "DER-06": [Evaluación, objetivo y plan nutricional, cada uno con su cadena de versiones. La versión del plan apunta a la versión del objetivo que la sostiene; la instantánea guarda lo emitido al activar.],
  "DER-07": [Lo que registra la persona: la ingesta y, sin sobrescribirla, su corrección, la rectificación de cantidades, la anulación y la foto. La revisión del profesional y su aplicación cierran el circuito.],
  "DER-08": [El catálogo de ejercicios con sus versiones, nombres alternativos e imágenes, los habituales del profesional y sus plantillas de plan.],
  "DER-09": [El mismo circuito que en nutrición para el entrenamiento; la evaluación puede citar respuestas que la persona dio en información pertinente.],
  "DER-10": [La sesión en curso como borrador (uno por ocurrencia), la ejecución registrada (una por ocurrencia), los tiempos de la sesión, la corrección encadenada y la revisión.],
  "DER-11": [Protocolos y métodos versionados; la toma con sus mediciones; la corrida de cálculo con sus entradas, que no se sobrescribe; la referencia profesional; la corrección y la anulación sin borrar.],
  "DER-12": [La plantilla versionada, la solicitud que el profesional hace dentro de un vínculo, la respuesta autodeclarada de la persona (una por solicitud) y sus rectificaciones.],
  "DER-13": [Las notas entre profesionales con sus destinatarios y referencias, las vistas de análisis guardadas, cada corrida de la TVCC-30, las novedades con su lectura y los avisos al teléfono con su suscripción.],
  "DER-14": [Los registros transversales: eventos de dominio, auditoría probatoria, idempotencia, medios privados con sus bytes aparte y las capacidades que declara cada cliente.],
)

= Diagrama entidad–relación

El modelo de datos se presenta en el nivel lógico, derivado del esquema físico: cada entidad es un modelo de
`prisma/schema.prisma` y cada línea es una clave foránea real de la base. No es el DER conceptual del legajo (DV-06),
que se diseñó antes de construir; la última sección compara uno con otro. Las cifras se tomaron del catálogo de una
base PostgreSQL #rb.version.split(" ").at(1) con las #rb.migraciones migraciones de #id("0fb1bff") aplicadas en orden.

== Notación

- *Entidades.* La cabecera es el nombre del modelo; las filas, sus columnas. A la izquierda, la clave: #id("PK") clave
  primaria, #id("FK") clave foránea, #id("UK") única, #id("U1") parte de una unicidad compuesta. Después, la
  obligatoriedad (notación de Barker): `*` obligatorio, `o` opcional.
- *Atributos omitidos.* Para que cada figura entre en una página, se omiten los atributos de patrón comunes
  (momento de ocurrencia, momento de registro y procedencia) y, si hace falta, los de menor valor explicativo. La caja
  dice cuántos omite; todos están en el diccionario (anexo G).
- *Relaciones.* Pata de gallo (notación de ingeniería de la información): en cada extremo, el mínimo y el máximo de
  filas relacionadas. Las cardinalidades salen del esquema: una clave foránea única es «cero o uno»; si no, «cero o
  muchos».
- *Otras vistas.* Una #id("FK") marcada con ↗ apunta a una entidad de otra vista (sección 6.5).

== Cifras de la base

#figure(
  table(
    columns: (1fr, auto),
    table.header([Elemento], [Cantidad]),
    [Tablas (una por modelo)], str(rb.tablas),
    [Enumeraciones (tipos con valores cerrados)], str(rb.enums),
    [Claves foráneas (todas con borrado restringido: ninguna fila se borra en cascada)], [#rb.clavesForaneas (#rb.foraneasRestrict RESTRICT)],
    [Índices únicos además de las claves primarias], str(rb.indicesUnicos),
    [… de ellos, parciales («uno solo mientras…»)], str(rb.indicesUnicosParciales),
    [Restricciones CHECK (listas blancas, rangos, coherencia entre columnas)], str(rb.checks),
    [Disparadores (#rb.disparadoresDeRestriccion de ellos diferidos, de restricción)], str(rb.disparadores),
    [Funciones de disparador], str(rb.funcionesDeDisparador),
  ),
  caption: [Reglas que la base aplica por sí misma (catálogo de PostgreSQL, #rb.fecha.slice(0, 10))],
)

Que las reglas vivan en la base y no solo en la API es una decisión de diseño: una escritura que esquive la API (una
migración, un script, un error de programación) tampoco puede romper la historia. La CI lo prueba: las pruebas de
integración intentan esas escrituras directo contra PostgreSQL y esperan el rechazo.

== Vista general

La figura 6.1 agrupa los modelos en catorce vistas por dominio y une las que tienen claves foráneas entre sí. Las
vistas por dominio la detallan en la sección siguiente.

#pagina-apaisada[
  #lamina("DER-00", "Vista general por dominios", alcance: "Los 113 modelos en catorce vistas y las claves que unen una vista con otra", fuente: "prisma/schema.prisma · datos/esquema.json", etiqueta: "fig-der-general")
]

== Vistas por dominio

#table(
  columns: (16mm, 1fr, 21mm),
  table.header([Vista], [Qué muestra], [Entidades]),
  ..vistas.map(v => (id(v.id), [*#v.titulo.* #LECTURA.at(v.id)], str(v.modelos.len()))).flatten(),
)

#for v in vistas {
  pagina-apaisada(lamina(v.id, v.titulo, fuente: "prisma/schema.prisma · datos/esquema.json"))
}

== Claves entre vistas

Las claves foráneas que cruzan de una vista a otra, sin contar las que apuntan a Identidad (que se resumen después).
Son las uniones que la vista general dibuja como líneas.

#{
  set text(size: 10pt)
  table(
    columns: (16mm, 1.25fr, 1fr, 16mm),
    table.header([Desde], [Entidad y clave], [Apunta a], [Vista]),
    ..cev.map(c => (id(c.de), partible(c.desde + "." + c.campos.join(", ")), partible(c.hacia), id(c.a))).flatten(),
  )
}

// Solo las claves que llegan desde otras vistas: las internas de DER-01 (perfil, métodos, sesiones) no se cuentan.
#let total-identidad = esq.relaciones.filter(r => r.hacia == "Identidad" and r.desde not in vista("DER-01").modelos).map(r => r.clavesForaneas.len()).sum()
Hacia Identidad (DER-01) apuntan #total-identidad claves foráneas desde las otras trece vistas. Sus nombres dicen qué
papel cumple la persona en cada registro:

#table(
  columns: (16mm, 1fr),
  table.header([Vista], [Claves hacia Identidad]),
  ..vistas.filter(v => v.id != "DER-01").map(v => (id(v.id), cai.at(v.id, default: ()).map(raw).join(", "))).flatten(),
)

== Lo que garantiza la base

Cuatro familias de reglas sostienen la historia del seguimiento. Todas están en las migraciones y se prueban en la CI.

- *Nada se borra en cascada.* Las #rb.clavesForaneas claves foráneas son RESTRICT. Corregir, anular o rectificar agrega
  filas encadenadas; el original queda.
- *Estados que solo avanzan.* Disparadores con listas blancas de transiciones: una solicitud nace PENDIENTE y termina
  ACEPTADA, RECHAZADA, CADUCADA o INVALIDADA; un acto solo pasa de VIGENTE a REVOCADO; un borrador confirmado queda
  congelado.
- *Solo se agregan filas.* Auditoría, idempotencia, eventos y decisiones de acceso no admiten actualización ni borrado.
- *Unicidades que dependen del estado.* Los #rb.indicesUnicosParciales índices únicos parciales de la tabla siguiente
  dicen «uno solo mientras…». La definición es la de la migración.

#{
  set text(size: 10pt)
  table(
    columns: (1fr, 1.2fr, 22mm),
    table.header([Índice (tabla)], [Definición: columnas y condición], [Migración]),
    ..parciales.map(p => ([#text(font: "JetBrains Mono", hyphenate: false, lang: "en", p.indice.replace("_", "_\u{200b}")) #linebreak() #text(fill: tinta-suave)[(#p.tabla.replace("_", "_\u{200b}"))]], text(font: "JetBrains Mono", hyphenate: false, lang: "en", p.definicion.replace("_", "_\u{200b}")), [#p.migracion.slice(0, 4)-#p.migracion.slice(4, 6)-#p.migracion.slice(6, 8)])).flatten(),
  )
}

== Del DER del legajo a la base implementada

El DER del legajo (DV-06, versión 5) se dibujó desde el documento 06 antes de construir. El 2026-10-02 se lo comparó con
el esquema y las migraciones de entonces (`docs/mesa/MESA_02/DV-06/RECONCILIACION_DER_IMPLEMENTACION_2026-10.md`, sobre
#id("33784f1"), con 83 modelos).

#table(
  columns: (1fr, auto, auto, auto, auto, auto),
  align: (left, center, center, center, center, center),
  table.header([Al 2026-10-02], [Coincide], [Difiere en la forma], [Difiere en la estructura], [Falta], [Total]),
  [Entidades del DER], [26], [16], [19], [14], [75],
  [Relaciones del DER], [41], [4], [8], [11], [64],
)

- *Lo que coincidía:* el núcleo construido (identidad, vínculo y consentimiento, proceso, planes con versiones e
  instantáneas, ingesta, mediciones, cálculos, revisión y formularios).
- *Diferencias de forma:* el 06 no fija cómo se almacena nada (06 §4.5.1); la implementación guardó, por ejemplo, la
  jerarquía del plan como JSON validado dentro de la versión y las especialidades como pares (identidad, área).
- *Donde la implementación sigue al 06 y el DER no:* el objetivo referencia la evaluación (REG-06-98), la ejecución es
  una por ocurrencia (REG-06-115) y las evaluaciones de las verticales existen.

*Lo que cambió después de la conciliación.* El esquema pasó de 83 a #esq.modelos.len() modelos. De las 14 entidades
que faltaban, cinco se implementaron: la novedad interna y la notificación push (DL-133), la TVCC-30 (DL-135), la
evidencia visual de la ingesta (DL-119 y DL-120) y la nota de coordinación (DL-140). El ciclo cerrado trazable no
tiene tabla: la TVCC-30 lo reconstruye de los hechos en cada corrida. Siguen sin implementar la
incidencia administrativa (RF-068) y el servicio antropométrico publicado (RF-051), los dos aprobados y pendientes
(apartado 3.7), y además la zona muscular y su relación con el ejercicio (DL-081), el grupo de intercambio y el
nutriente crítico (modalidad B), el atlas de porciones y el recurso didáctico de catálogo. La conciliación no se rehízo entera: este apartado actualiza solo lo
que cambió y lo marca en el anexo K.

El diccionario de datos completo (cada columna con su tipo lógico y físico, su obligatoriedad, su clave y su
descripción, y cada enumeración con sus valores) está en el anexo G.
