#import "../plantilla.typ": *

// Decisiones: los ADR del legajo (docs/mesa/MESA_02/DV-08_09/DV-08_ADR.md), las filas del registro de decisiones
// (datos/decisiones.json, de docs/DEUDA_LEGAJO.md, sin reescribir) y las versiones de la APK (datos/versiones-apk.json).
#let dec = json("../../datos/decisiones.json").decisiones
#let apk = json("../../datos/versiones-apk.json").versiones

#let EN-0FB1BFF = (
  "DL-012": [En el website la reemplaza DL-147 (la sesión sobrevive a la recarga); en la APK, el token sigue en el almacenamiento seguro.],
  "DL-030": [Implementada y verificada en test.],
  "DL-036": [Sigue abierta: un servicio interno habilita a los profesionales sintéticos al arrancar la API.],
  "DL-039": [Simplificación vigente: cada alcance tiene una sola finalidad.],
  "DL-115": [Integrada con la APK 0.13.2; el registro no lo refleja (anexo K, K5).],
  "DL-120": [Integrada (fotos de comidas y de recetas).],
  "DL-133": [Integrada; falta un aviso recibido en un teléfono real.],
  "DL-135": [Integrada; las decisiones D-1 a D-9, a ratificar.],
  "DL-136": [Integrada en la API, el website y la APK; probada en el teléfono el 2026-10-17.],
  "DL-138": [Integrada; probada en el teléfono el 2026-10-17.],
  "DL-140": [Integrada (familia CRD).],
  "DL-141": [Integrada, con el catálogo confiable (#189).],
  "DL-147": [Integrada y verificada en test el 2026-10-20 (Chrome y Edge).],
  "DL-148": [Integrada y verificada en test el 2026-10-20 (Chrome).],
  "DL-150": [Integrada: doce recorridos en la CI.],
)

= Decisiones de arquitectura y evolución

== Las decisiones de arquitectura del legajo

Las siete decisiones de `DV-08_ADR.md`, derivadas del documento 07. Cada alternativa lleva su procedencia: si la
descarta el 07 o si es un análisis agregado por la mesa de trabajo. La última columna dice cómo quedó en el código.

#{
  set text(size: 10pt)
  table(
    columns: (13mm, 1fr, 1fr, 1fr),
    table.header([ADR], [Decisión y motivo], [Alternativa descartada], [Cómo quedó en #id("0fb1bff")]),
    [01], [Monolito modular sobre una sola base, porque una operación de dominio tiene que ser completa o no ocurrir (RNF-DAT-001).], [Microservicios por dominio: exigirían sagas o commit en dos fases (documentada en 07).], [API NestJS con 22 módulos y una base PostgreSQL; transacciones locales (apartados 8 y 9).],
    [02], [Un único punto de decisión de autorización, igual para el website y la APK, sin decisiones obsoletas tras una revocación (RF-021).], [Autorización por módulo o con caché (análisis de la mesa).], [`PdpService` con la regla pura `evaluarAutorizacion`; guarda para lecturas y decisión dentro de la transacción para escrituras (CL-02).],
    [03], [Historia por adición: lo emitido no se modifica; corregir y anular agregan registros.], [Actualizar en el lugar con una tabla de auditoría paralela (análisis de la mesa).], [212 claves foráneas RESTRICT, disparadores que solo agregan y cadenas de corrección (apartado 6).],
    [04], [Auditoría en la misma transacción: sin auditoría no hay operación (ASR-07).], [Auditoría asíncrona o logs de la plataforma (parcialmente documentada en 07).], [El esqueleto común `EjecutorDeDominio` audita en la transacción (CL-02).],
    [05], [Render primero, con una arquitectura portable (contenedores y PostgreSQL estándar).], [AWS desde el inicio (documentada en 07); hospedaje propio (análisis de la mesa).], [Render en Frankfurt, imagen Docker; las fotos también en PostgreSQL (DL-120), sin almacenamiento propietario.],
    [06], [La APK se distribuye directamente, sin tiendas, con su dirección de descarga.], [Google Play (análisis de la mesa).], [#apk.len() versiones publicadas como releases de GitHub, con su SHA-256.],
    [07], [Concurrencia optimista con un solo mecanismo: versión esperada y respuesta 409, con índices únicos parciales como defensa final.], [Bloqueo pesimista o un mecanismo por módulo (análisis de la mesa).], [`expectedVersion` y 409 en la API; 34 índices únicos parciales en la base (apartado 6).],
  )
}

== Decisiones tomadas al construir

Durante la construcción, cada diferencia entre el legajo y lo que se podía o convenía hacer se registró como una
decisión en `docs/DEUDA_LEGAJO.md`: qué dice el legajo, qué se encontró, las opciones y lo que decidió Dirección. Estas
son las que dan forma al producto que se presenta. La columna «Registro» copia el estado de la tabla del registro; la
última dice cómo está en la versión de referencia, comprobado al preparar este documento.

#{
  set text(size: 10pt)
  table(
    columns: (15mm, 1fr, 1fr, 1fr),
    table.header([DL], [Qué se decidió], [Registro], [En #id("0fb1bff")]),
    ..dec.map(d => {
      let e = d.estado.replace("`", "")
      let corto = if e.clusters().len() > 150 { e.clusters().slice(0, 148).join() + "…" } else { e }
      (
        raw(d.id),
        if d.titulo != none { d.titulo } else { d.problema },
        text(fill: tinta-suave, corto),
        EN-0FB1BFF.at(d.id, default: text(fill: tinta-suave, "—")),
      )
    }).flatten(),
  )
}

En varias filas el registro quedó atrás de lo integrado (DL-115, DL-136, DL-138, DL-147, DL-148 y DL-150): el anexo K
lo registra para que se actualice.

== Evolución

BE se construyó por paquetes de trabajo, cada uno integrado con su CI en verde y, cuando cambiaba la APK, con una
versión publicada. Las versiones de la APK cuentan esa historia.

#{
  set text(size: 10pt)
  table(
    columns: (34mm, 20mm, 1fr),
    table.header([Versión], [Publicada], [Qué trajo (nombre del release)]),
    ..apk.map(v => (raw(v.version), v.publicada, v.nombre.replace(regex("^(APK BE |APK |BE APK |BE )"), "").replace(regex("^[0-9.]+(-candidata\.[0-9]+)?( \(test\))?[: —-]*"), ""))).flatten(),
  )
}

La estable es la 0.13.2 (2026-10-03). Las candidatas posteriores esperan las pruebas en el teléfono antes de pasar a
estables (apartado 5.9).
