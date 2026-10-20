#import "../plantilla.typ": *

// Los casos diseñados salen de DV-05 (59 casos del plan 11A), unidos a la conciliación de octubre y al mapeo del 16/10
// por herramientas/casos-de-prueba.mjs, que además comprueba que cada prueba citada exista en la versión de referencia
// (datos/casos-de-prueba.json). Los casos ejecutados fuera de la CI están en datos/casos-ejecutados.json.
#let dp = json("../../datos/casos-de-prueba.json")
#let casos = dp.casos
#let ej = json("../../datos/casos-ejecutados.json")
#let est = json("../../datos/estado.json")
#let rfs = json("../../datos/evidencia-rf.json").requisitos

#let contar(lista, clase) = lista.filter(c => c.clase == clase).len()
#let FAMILIAS = (
  (clave: "RF", titulo: "Requisitos (TEST-RF)", texto: [Un caso por requisito del plan 11A: el oráculo es el criterio de aceptación del requisito.]),
  (clave: "AUTH", titulo: "Autorización, consentimiento y cierre (TEST-AUTH)", texto: [Los escenarios adversariales de acceso: lo que el sistema tiene que negar aunque la interfaz lo ofrezca.]),
  (clave: "DOM", titulo: "Reglas del dominio (TEST-DOM)", texto: [Las invariantes que sostienen la historia clínica: «sin dato» no es cero, corregir no borra, una versión nueva no reescribe la anterior.]),
  (clave: "CAL", titulo: "Cálculos reproducibles (TEST-CAL)", texto: [Cada corrida cita la versión exacta del método y no se sobrescribe.]),
  (clave: "FRM", titulo: "Información pertinente (TEST-FRM)", texto: [Plantillas, permisos y procedencia de lo que responde la persona.]),
  (clave: "ANT", titulo: "Antropometría (TEST-ANT)", texto: [Toma, borrador, registro y corrección de las mediciones.]),
)
#let de-familia(clave) = casos.filter(c => c.id.split("-").at(1) == clave)

#let ejecucion-ci = [CI de #id("0fb1bff") · corrida 39374515693 · 2026-10-20 · GitHub Actions (Ubuntu 24.04, PostgreSQL 16)]

#let cita(e) = {
  [#id(e.archivo)#if e.titulo != none [ › «#{ if e.titulo.clusters().len() > 110 { e.titulo.clusters().slice(0, 108).join() + "…" } else { e.titulo } }»]#if e.situacion == "titulo-actualizado" [ #text(fill: tinta-suave)[(título actualizado en el repositorio)]]]
}

#let evidencias(lista, maximo: 3) = {
  if lista.len() == 0 { return text(fill: tinta-suave, "Sin prueba que la ejercite.") }
  // Primero las que tienen título: son las que dicen qué se afirma.
  let orden = lista.filter(e => e.titulo != none) + lista.filter(e => e.titulo == none)
  let vistos = ()
  let unicas = ()
  for e in orden {
    let clave = e.archivo + "|" + (if e.titulo == none { "" } else { e.titulo })
    if clave not in vistos { vistos.push(clave); unicas.push(e) }
  }
  list(tight: true, marker: [–], ..unicas.slice(0, calc.min(maximo, unicas.len())).map(cita))
  if unicas.len() > maximo { text(fill: tinta-suave)[y #(unicas.len() - maximo) más en `datos/casos-de-prueba.json`.] }
}

/// Ficha de un caso diseñado (DV-05) con su ejecución en la versión de referencia.
#let ficha(c) = {
  let fila(etiqueta, contenido) = (text(fill: tinta-suave, etiqueta), contenido)
  block(width: 100%, above: 14pt, below: 6pt, breakable: true, {
    block(breakable: false, below: 4pt, stroke: (top: 1pt + azul), inset: (top: 6pt), grid(
      columns: (auto, 1fr, auto),
      column-gutter: 8pt,
      align: (left + horizon, left + horizon, right + horizon),
      text(font: "JetBrains Mono", weight: 600, size: 10.5pt, fill: azul, c.id),
      [#text(size: 10pt, fill: tinta-suave)[#c.prioridad · #c.nivel · #c.canal]],
      resultado(c.clase),
    ))
    set text(size: 10pt, hyphenate: false)
    set par(justify: false)
    grid(
      columns: (31mm, 1fr),
      column-gutter: 8pt,
      row-gutter: 5pt,
      ..fila("Requisito y caso", [
        #c.rfs.map(id).join(", ") · #c.ucs.map(id).join(", ")
        #if c.relacionDerivada { text(fill: tinta-suave)[ (derivado por esta tesis de la fuente del caso: #c.fuente.replace("`", ""))] }
      ]),
      ..fila("Objetivo", c.objetivo),
      ..fila("Precondiciones", c.precondiciones),
      ..fila("Datos sintéticos", c.datos),
      ..fila("Pasos", enum(tight: true, ..c.pasosLista)),
      ..fila("Esperado", c.esperado),
      ..fila("Observado", {
        if c.observado != "" { c.observado } else { text(fill: tinta-suave, "—") }
        if c.actualizacion != none { [ #text(weight: 600, fill: azul)[Actualización 2026-10-20:] #c.actualizacion] }
      }),
      ..if c.clase != "cubierto" and c.pendiente != "" and c.pendiente != "—" {
        fila("Pendiente", [#c.pendiente#if c.pendienteOriginal != none [ #text(fill: tinta-suave)[(actualizado el 2026-10-20)]]])
      } else { () },
      ..fila("Ejecución", if c.clase == "no-ejecutable" {
        [Sin ejecución en esta entrega: depende de funcionalidad no implementada o fuera de alcance.]
      } else if c.clase == "parcial" {
        [#ejecucion-ci. Lo citado pasa; lo pendiente no tiene prueba.]
      } else { ejecucion-ci }),
      ..fila("Evidencia", evidencias(c.evidencia)),
    )
  })
}

/// Ficha de un caso ejecutado fuera de la CI (test o teléfono).
#let ficha-ejecutada(c) = {
  let fila(etiqueta, contenido) = (text(fill: tinta-suave, etiqueta), contenido)
  block(width: 100%, above: 14pt, below: 6pt, breakable: true, {
    block(breakable: false, below: 4pt, stroke: (top: 1pt + azul), inset: (top: 6pt), grid(
      columns: (auto, 1fr, auto),
      column-gutter: 8pt,
      align: (left + horizon, left + horizon, right + horizon),
      text(font: "JetBrains Mono", weight: 600, size: 10.5pt, fill: azul, c.id),
      text(weight: 600, size: 10.5pt, c.nombre),
      resultado(c.estado),
    ))
    set text(size: 10pt, hyphenate: false)
    set par(justify: false)
    grid(
      columns: (31mm, 1fr),
      column-gutter: 8pt,
      row-gutter: 5pt,
      ..fila("Requisito y caso", [#c.rf.map(id).join(", ") · #c.uc.map(id).join(", ") · decisiones #c.decisiones.map(id).join(", ")]),
      ..fila("Objetivo", c.objetivo),
      ..fila("Precondiciones", c.precondiciones),
      ..fila("Datos sintéticos", c.datos),
      ..fila("Pasos", enum(tight: true, ..c.pasos)),
      ..fila("Esperado", c.esperado),
      ..fila("Observado", c.observado),
      ..fila("Entorno", c.entorno),
      ..fila("Versión y fecha", [#c.version · #c.fecha · #c.ejecutor]),
      ..fila("Evidencia", if c.evidencia.len() > 0 { list(tight: true, marker: [–], ..c.evidencia.map(e => raw(e))) } else { text(fill: tinta-suave, "Sin evidencia escrita en el repositorio.") }),
      ..fila("Límites", c.limites),
    )
  })
}

= Casos de prueba

Este apartado separa dos cosas que suelen mezclarse. Un *caso diseñado* dice qué hay que comprobar, con qué datos, en
qué pasos y con qué resultado esperado. Un *caso ejecutado* dice qué se comprobó, en qué versión, en qué entorno, cuándo
y con qué evidencia. Los 59 casos diseñados son los de DV-05, derivados del plan de pruebas 11A del legajo. La
ejecución sale de la integración continua (CI) de la versión de referencia, de verificaciones contra el despliegue de
test y de pruebas en el teléfono. Un contador de pruebas verdes no reemplaza a estos casos: las fichas dicen qué afirma
cada prueba y qué queda sin afirmar.

#let n-cub = contar(casos, "cubierto")
#let n-par = contar(casos, "parcial")
#let n-noe = contar(casos, "no-ejecutable")
#recuadro(titulo: [En la versión de referencia (#id("0fb1bff"), 2026-10-20)], tipo: "decision")[
  De los #casos.len() casos diseñados, *#n-cub pasan en la CI*, *#n-par pasan en parte* (lo que se probó pasa; una parte
  del oráculo no tiene prueba) y *#n-noe no son ejecutables* con lo que se entrega, porque dependen de funciones fuera
  de alcance o no implementadas. Ningún caso falla. Fuera de la CI se ejecutaron #ej.casos.len() casos más: tres contra
  test con navegadores reales y cuatro en el teléfono.
]

== Estrategia y niveles de prueba

#figure(
  table(
    columns: (30mm, 1fr, 36mm, 25mm),
    table.header([Nivel], [Qué demuestra], [Herramienta y entorno], [En #id("0fb1bff")]),
    [Dominio], [Las reglas puras: autorización (PDP), cálculos, invariantes, contratos de datos.], [`node:test` · CI], [832 de 832],
    [API, unitarias], [Piezas de la API sin base de datos: validaciones, límites, formatos de error.], [Jest · CI], [135 de 135],
    [Pantallas sin navegador], [Textos, navegación, contraste, geometría de gráficos y reglas de las pantallas del website y la APK.], [`node:test` · CI], [435 de 435],
    [Integración], [La API real contra PostgreSQL 16 con las migraciones, los disparadores y las restricciones de la base.], [Jest y Testcontainers · CI], [61 suites, 823 de 823],
    [Recorridos de navegador], [El trabajo diario del profesional en el website, con Chrome, la API y una base real.], [Puppeteer · CI], [12 de 12],
    [Verificación remota], [Lo que solo se ve en el despliegue: cookies entre sitios, HTTPS, red real.], [Puppeteer y Chrome o Edge · test], [3 casos],
    [Teléfono], [La APK instalada, con Google, QR y la cámara reales.], [Manual, Dirección · teléfono contra test], [4 casos],
  ),
  caption: [Niveles de prueba y su resultado en la versión de referencia],
)

La CI corre los cinco primeros niveles en cada cambio a `main` y bloquea la integración si algo falla. Los totales son
de la corrida 39374515693 (2026-10-20, 05:22 a 05:32 UTC), que además validó el legajo y construyó la imagen de la API
con sus migraciones.

== Entornos y versiones

#table(
  columns: (20mm, 1fr, 40mm),
  table.header([Entorno], [Configuración], [Versión]),
  [CI], [GitHub Actions, Ubuntu 24.04, PostgreSQL 16 en contenedor, Chrome de la imagen para los recorridos. Datos creados por cada prueba.], [#id("0fb1bff")],
  [Test], [Render, región Frankfurt: website estático, API en Docker, PostgreSQL 16 privado, tarea programada de recordatorios. Solo datos sintéticos.], [website #id("0fb1bff"), API #id("20f1bb7")],
  [Teléfono], [Android de Dirección, con la APK instalada desde los prereleases de GitHub, contra la API de test.], [estable 0.13.2; probadas 0.14.0-candidata.1, 0.15.0-candidata.1 y 0.17.0-candidata.2],
)

La API de test está en #id("20f1bb7") porque el último cambio integrado (#id("0fb1bff"), PR \#192) no toca la API.
Las verificaciones remotas de sesión y de borradores se hicieron sobre despliegues intermedios del mismo día, con el
mismo comportamiento en esas partes; cada ficha dice exactamente sobre qué versión.

== Cómo se obtuvo cada resultado

- *Pasa en la CI.* Las pruebas que ejercitan el oráculo del caso existen en #id("0fb1bff") y su suite pasó en la
  corrida de esa versión. La herramienta `herramientas/casos-de-prueba.mjs` buscó cada una de las #dp.casos.map(c => c.evidencia.len()).sum() pruebas citadas
  por título en el repositorio: todas existen (#dp.casos.map(c => c.evidencia.filter(e => e.situacion == "titulo-actualizado").len()).sum() con el título actualizado después de la cita).
- *Pasa en parte.* Lo citado pasa, pero una parte del oráculo no tiene una prueba que la afirme. La ficha dice cuál.
- *No ejecutable.* El caso necesita algo que esta entrega no tiene, como el rol de administrador o la verificación de
  especialidades (fuera de alcance por decisión de Dirección). No es una falla: es una frontera declarada.
- *Actualización.* La conciliación es del 2026-10-02 y el mapeo, del 2026-10-16. Seis casos cambiaron después, por
  pruebas nuevas o por funciones integradas; se comprobaron en el código y la ficha lo dice con su fuente. Esos dos
  documentos no se reescriben: quedan como registro de su fecha.
- *Referencias PE-nn.* Son las pruebas propuestas por la conciliación para completar cada caso
  (`docs/mesa/MESA_02/DV-05/MATRIZ_DE_RECONCILIACION_DV-05_2026-10.md`, §5).

#figure(
  table(
    columns: (30mm, 1fr, 44mm),
    table.header([Fecha y versión], [Medida], [Resultado]),
    [2026-09-24 · #id("796a5fe")], [Casos nombrados por una prueba de la CI (conteo automático)], [33 de 59],
    [2026-10-02 · #id("33784f1")], [Conciliación caso por caso (qué afirma cada prueba)], [35 completos, 15 en parte, 9 no ejecutables],
    [2026-10-16 · #id("dc68309")], [Mapeo de los 26 casos sin prueba nombrada; nueve pruebas nuevas], [44 de 59 nombrados (esperado)],
    [2026-10-20 · #id("0fb1bff")], [Esta tesis: conciliación más mapeo, actualizados y comprobados contra el repositorio], [#n-cub completos, #n-par en parte, #n-noe no ejecutables],
  ),
  caption: [Evolución de la cobertura de los casos diseñados (son medidas distintas: se indica cuál es cada una)],
)

== Resumen por familia

#table(
  columns: (1fr, 15mm, 19mm, 16mm, 17mm, 24mm),
  align: (left, center, center, center, center, center),
  table.header([Familia], [Casos], [Prioridad], [Pasan], [En parte], [No ejecutables]),
  ..FAMILIAS.map(f => {
    let l = de-familia(f.clave)
    let p0 = l.filter(c => c.prioridad == "P0").len()
    (f.titulo, str(l.len()), if p0 == l.len() { "P0" } else if p0 == 0 { "P1" } else { "P0 y P1" }, str(contar(l, "cubierto")), str(contar(l, "parcial")), str(contar(l, "no-ejecutable")))
  }).flatten(),
  [*Total*], [*#casos.len()*], [], [*#n-cub*], [*#n-par*], [*#n-noe*],
)

== Casos ejecutados fuera de la CI

Estos casos comprueban lo que la CI no puede ver: el comportamiento en el despliegue real (cookies entre sitios, HTTPS,
latencia) y en un teléfono. Los tres primeros los ejecutó un guion contra test, con cuentas sintéticas nuevas o de la
cohorte sintética. Sus informes y guiones están en `docs/mesa/TESIS/evidencia/remota/2026-10-20/`. Los cuatro
siguientes los probó Dirección en su teléfono.

#for c in ej.casos { ficha-ejecutada(c) }

== Casos diseñados (DV-05) y su ejecución

Cada ficha reproduce el diseño de DV-05 (precondiciones, datos, pasos y resultado esperado) y le agrega el resultado
observado en la versión de referencia y su evidencia. El objetivo sale del escenario del plan 11A o, en los casos
TEST-RF, del requisito, porque DV-05 no tiene una columna propia para el objetivo. En los casos de escenario, DV-05
tampoco declara requisito ni caso de uso: esta tesis los deriva de la fuente que cita el caso y lo indica.

#for f in FAMILIAS {
  heading(level: 3, f.titulo)
  f.texto
  for c in de-familia(f.clave) { ficha(c) }
}

== Recorridos de navegador en la CI

Doce recorridos protegen el trabajo diario del profesional en el website. Cada uno crea sus propias cuentas sintéticas
(`@example.invalid`), carga los datos por la API (como lo harían el profesional desde el website y la persona desde la
APK) y comprueba resultados: la dirección, lo que dice la pantalla, lo que guardó el servidor, la cookie y el árbol de
accesibilidad. Están en `test/navegador/` y pasaron 12 de 12 en #id("0fb1bff").

#table(
  columns: (32mm, 1fr, 18mm),
  table.header([Recorrido], [Qué comprueba], [Protege]),
  [`sesion`], [Entrar, recargar en /pro y en la ficha (con vista y período), otra pestaña sin volver a entrar; la cookie de reanudación con sus atributos y ningún token en el almacenamiento del navegador.], [DL-147],
  [`pistas`], [Las pistas con el mouse y con el teclado: aparecen, se pueden recorrer y Escape las cierra sin mover el foco.], [DL-146],
  [`borrador`], [«Guardado a las…» solo con la respuesta del servidor; sin conexión lo escrito queda y se guarda al volver.], [DL-148],
  [`conflicto`], [Dos pestañas sobre el mismo borrador: la segunda no pisa; «Cargar la versión guardada» trae lo de la primera.], [DL-148],
  [`primerPlan`], [Ficha nueva, evaluación, objetivo y plan; de vuelta, la acción es «Seguir el borrador».], [DL-145],
  [`retorno`], [Desde la línea de tiempo a preparar la revisión y de vuelta a la misma vista y período.], [bloque 5],
  [`grafico`], [El gráfico de evolución dibuja cada valor a su altura, con el tiempo a escala, y la tabla dice lo mismo.], [bloque 5],
  [`primeraInvitacion`], [Sin vínculos no se elige un área; un área no habilitada se rechaza en el servidor y el error queda junto al campo.], [bloque 5],
  [`areaSugerida`], [Con vínculos en una sola área, esa viene sugerida y se puede cambiar.], [bloque 5],
  [`sesionRevocada`], [Cerrar todas las sesiones desde otro lado: la pestaña va a entrar y la cookie no la revive.], [bloque 3],
  [`accesoRevocado`], [La persona retira el consentimiento: la ficha dice «Acceso no disponible» y no ofrece acciones.], [bloque 3],
  [`faltaUnaParte`], [Si falla una sola lectura, la vista muestra lo que llegó y dice qué falta, sin ofrecer acciones engañosas.], [bloque 5],
)

== Cobertura por requisito

La tabla cruza cada requisito con su estado (apartado 3), los casos diseñados que lo comprueban, los ejecutados fuera de
la CI y la cantidad de archivos de prueba que lo citan. Un requisito sin caso diseñado puede tener pruebas: el plan 11A
eligió un subconjunto, y las pruebas crecieron con cada paquete.

#{
  set text(size: 10pt)
  table(
    columns: (16mm, 1fr, 38mm, 30mm, 18mm, 17mm),
    align: (left, left, left, left, left, center),
    table.header([RF], [Requisito], [Estado], [Casos DV-05], [Fuera de la CI], [Archivos]),
    ..rfs.map(r => {
      let dis = casos.filter(c => r.id in c.rfs)
      let fue = ej.casos.filter(c => r.id in c.rf)
      (
        id(r.id),
        r.titulo,
        estado(est.requisitos.at(r.id).estado),
        if dis.len() > 0 { dis.map(c => c.id.replace("TEST-", "")).join(", ") } else { text(fill: tinta-suave, "—") },
        if fue.len() > 0 { fue.map(c => c.id).join(", ") } else { text(fill: tinta-suave, "—") },
        str((r.pruebasQueLoCitan + r.pruebasPorOperacion + r.pruebasPorUC).dedup().len()),
      )
    }).flatten(),
  )
}

== Lo que queda por probar

=== Casos no ejecutables en esta entrega

#table(
  columns: (30mm, 1fr),
  table.header([Caso], [Por qué no se puede ejecutar]),
  ..casos.filter(c => c.clase == "no-ejecutable").map(c => (id(c.id), if c.pendiente != "" { c.pendiente } else { c.observado })).flatten(),
)

=== Casos que pasan en parte

#table(
  columns: (30mm, 1fr),
  table.header([Caso], [Lo que falta probar]),
  ..casos.filter(c => c.clase == "parcial").map(c => (id(c.id), [#c.pendiente#if c.pendienteOriginal != none [ #text(fill: tinta-suave)[(actualizado el 2026-10-20)]]])).flatten(),
)

=== Pruebas pendientes en el teléfono

#table(
  columns: (1fr, 1.3fr, 34mm),
  table.header([Qué], [Por qué falta], [Fuente]),
  ..ej.pendientesDelTelefono.map(p => (p.que, p.por_que, p.fuente)).flatten(),
)

=== Navegadores y revisiones humanas

- *Safari y Firefox* no se probaron contra test. La reanudación de sesión usa una cookie particionada (CHIPS); su
  comportamiento en Safari 26.2 queda para una revisión humana en un equipo de Apple.
- *Lector de pantalla:* el website se revisó con el árbol de accesibilidad en los recorridos; la APK con TalkBack, no.
- *Prueba con profesionales:* el protocolo existe (#id("DL-150"), PR \#191); la sesión con profesionales reales no se
  hizo.
