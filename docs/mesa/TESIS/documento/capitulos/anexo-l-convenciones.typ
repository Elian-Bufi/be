#import "../plantilla.typ": *

// Convenciones gráficas: salen de estilo/tokens.json (la guía de estilo) y de laminas/revision.json (el registro de
// cada lámina con su revisión automática).
#let tk = json("../../estilo/tokens.json")
#let rev = json("../../laminas/revision.json")
// Los tamaños con coma decimal, como se escriben en castellano (10,5 pt).
#let num(x) = str(x).replace(".", ",")
#let muestra(hex, borde: none) = box(width: 14pt, height: 9pt, radius: 2pt, fill: rgb(hex), stroke: if borde != none { 0.8pt + rgb(borde) } else { 0.6pt + borde })

= Convenciones gráficas y procedimiento de las figuras

== La guía de estilo

La identidad de BE (azul profundo y cian) sobre fondo claro. Los colores, los trazos, las tipografías y los tamaños
están en un solo archivo, `docs/mesa/TESIS/estilo/tokens.json`, que leen tanto las figuras como el documento. El
significado nunca depende solo del color: cada estado tiene además un texto, un borde o un trazo propio, para que se
entienda impreso en blanco y negro o con daltonismo.

#table(
  columns: (34mm, 18mm, 1fr),
  table.header([Uso], [Color], [Qué distingue además del color]),
  [Texto principal], [#muestra(tk.color.tinta) #raw(tk.color.tinta)], [—],
  [Sistema y contenedores], [#muestra(tk.color.sistema.relleno, borde: tk.color.sistema.trazo) #raw(tk.color.sistema.trazo)], [borde continuo],
  [Elemento destacado], [#muestra(tk.color.enfasis.relleno, borde: tk.color.enfasis.trazo) #raw(tk.color.enfasis.trazo)], [borde más grueso],
  [Persona], [#muestra(tk.color.persona.relleno, borde: tk.color.persona.trazo) #raw(tk.color.persona.trazo)], [forma de persona (cabeza y cuerpo)],
  [Sistema externo], [#muestra(tk.color.externo.relleno, borde: tk.color.externo.trazo) #raw(tk.color.externo.trazo)], [borde discontinuo],
  [Previsto, fuera de la entrega], [#muestra(tk.color.pendiente.relleno, borde: tk.color.pendiente.trazo) #raw(tk.color.pendiente.trazo)], [borde punteado y la palabra «previsto» o «pendiente»],
  [Acento de la identidad], [#muestra(tk.color.acento) #raw(tk.color.acento)], [solo decorativo: subrayados y títulos],
)

#table(
  columns: (40mm, 1fr),
  table.header([Tipografía], [Uso y tamaños]),
  [#tk.tipografia.texto], [Texto y títulos. En el documento: cuerpo #num(tk.tipografia.documento.cuerpo) pt, tablas #num(tk.tipografia.documento.tabla) pt; ningún rótulo baja de 10 pt.],
  [#tk.tipografia.codigo], [Identificadores (RF-021, UC-P11, API-NUT-12), nombres de tablas y rutas.],
  [En las láminas], [Mínimo #num(tk.tipografia.lamina.minimo) pt, al tamaño final de impresión (la lámina se dibuja en puntos: 1 unidad = 1 pt).],
  [En la proyección], [Mínimo #num(tk.tipografia.proyeccion.minimo) pt; títulos de #num(tk.tipografia.proyeccion.titulo) pt.],
)

== Notaciones por tipo de figura

#table(
  columns: (34mm, 1fr),
  table.header([Figura], [Notación]),
  [Casos de uso (CU)], [UML 2.5.1: el rectángulo es el límite del sistema; actor a los costados; asociación continua; «include» y «extend» discontinuas con flecha (la de extend apunta al caso base). Rótulo corto con identificador; los incluidos transversales se declaran en la nota.],
  [DER], [Nivel lógico derivado del esquema; pata de gallo con obligatoriedad de Barker (`*` y `o`); claves PK, FK, UK y U1; ↗ para una clave que apunta a otra vista.],
  [Clases (CL)], [UML 2.5.1 con tres compartimentos; el nombre en cursiva y «abstract» para lo abstracto; generalización con triángulo vacío; realización discontinua; dependencia discontinua con flecha; composición con rombo lleno del lado del todo; multiplicidad en cada extremo.],
  [Arquitectura (ARQ)], [Modelo C4: contexto, contenedores y despliegue; cada relación con un verbo y, si corresponde, la tecnología entre corchetes.],
  [Componentes (COMP)], [UML 2.5.1: componente con su ícono; interfaz provista como chupetín; quien la requiere, con una dependencia discontinua.],
  [Flujos, DFD y secuencias], [Las del anexo correspondiente (B a E), declaradas en cada uno.],
)

== Procedimiento

Cada figura tiene una sola fuente editable, en código, en `docs/mesa/TESIS/laminas/fuentes`. El motor
(`laminas/motor`) la dibuja con las métricas reales de las tipografías y la revisa sola: tamaño mínimo de letra,
densidad, textos que se pisan, rótulos sobre nodos o bordes, conectores que atraviesan cajas, cruces y caracteres que
faltan en la tipografía. Después, la revisión visual se hace sobre la figura exportada y sobre la página del PDF.

#table(
  columns: (68mm, 1fr),
  table.header([Comando], [Qué hace]),
  [`node laminas/construir.mjs [ID]`], [Dibuja una o todas las láminas: SVG en `laminas/generado`, y PDF, PNG y SVG con encabezado y pie en `laminas/exportaciones`.],
  [`node construir-documento.mjs`], [Compila el documento público en `salida/BE-tesis-v1.pdf`.],
  [`… --png <carpeta>`], [Además, una imagen por página para revisarlas.],
  [`… --evaluacion`], [Compila la versión de evaluación con los datos privados, fuera del repositorio.],
  [`node herramientas/<herramienta>.mjs`], [Regenera los datos del documento desde el código (esquema, requisitos, casos, pruebas, módulos, familias).],
)

== Láminas de esta versión

#{
  set text(size: 10pt)
  table(
    columns: (20mm, 1fr, 22mm, 16mm, 14mm),
    align: (left, left, center, center, center),
    table.header([Lámina], [Título], [Tamaño (pt)], [Nodos], [Cruces]),
    ..rev.pairs().sorted(key: p => p.at(0)).map(((k, v)) => (raw(k), v.titulo, str(v.ancho) + " × " + str(v.alto), str(v.nodos), str(v.cruces))).flatten(),
  )
}

Los cruces que quedan, dos en DER-04 y dos en DER-11, son inevitables con las relaciones de esas vistas (dos relaciones
en sentidos opuestos sobre el mismo tramo) y se revisaron a mano.
