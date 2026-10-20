#import "../plantilla.typ": *

// Datos: datos/usuarios-verificados.json (verificación de solo lectura en test: entrar, /me, /me/relationships y cerrar
// la sesión, sin correos ni claves). Las credenciales viven fuera del repositorio y solo entran en la versión de
// evaluación (privado.json, compilado localmente).
#let uv = json("../../datos/usuarios-verificados.json")
#let fila(nombre) = uv.resultados.find(r => r.cuenta == nombre)

#let AREAS = (NUTRICION: "Nutrición", ENTRENAMIENTO: "Entrenamiento", ANTROPOMETRIA: "Antropometría")
#let vinculos-activos(r) = {
  let activos = r.alcances.pairs().filter(((k, v)) => k.contains("ACEPTADO"))
  if activos.len() == 0 { return text(fill: tinta-suave, "sin vínculos") }
  activos.map(((k, v)) => AREAS.at(k.split(" ").first()) + " (" + str(v) + ")").join(", ")
}

#let COHORTE = (
  (nombre: "Lic. Sofía Paz", plataforma: [website (/pro)], permisos: [Nutrición y Antropometría con quien la aceptó y dio el consentimiento], escenario: [cartera de cinco personas de la cohorte, más una sexta de la verificación del 2026-10-20 (anexo K, K16); planes, revisiones y tomas; ficha de Diego Sosa con tres años de historia]),
  (nombre: "Prof. Martín Acosta", plataforma: [website (/pro)], permisos: [Entrenamiento, con las mismas condiciones], escenario: [planes por serie, ejecución y revisión; la revisión del día de Federico Álvarez]),
  (nombre: "Prof. Lucía Benítez", plataforma: [website (/pro)], permisos: [solo Antropometría (capacidad transversal)], escenario: [tomas y cálculos de Camila Ortiz (recomposición)]),
  (nombre: "Diego Sosa", plataforma: [APK y website (cuenta)], permisos: [lo propio: plan del día, registro, evolución, vínculos y consentimientos], escenario: [tres años en tres áreas: de 104,5 a 80,8 kg]),
  (nombre: "Camila Ortiz", plataforma: [APK y website (cuenta)], permisos: [lo propio], escenario: [año y medio: recomposición con el peso estable]),
  (nombre: "Federico Álvarez", plataforma: [APK y website (cuenta)], permisos: [lo propio], escenario: [rugby: temporadas y dos días tipo en el plan]),
  (nombre: "Norma Castro", plataforma: [APK y website (cuenta)], permisos: [lo propio], escenario: [fuerza a los 71 años]),
  (nombre: "Héctor Funes", plataforma: [APK y website (cuenta)], permisos: [lo propio], escenario: [derivado por glucemia; objetivo de mantenimiento reciente]),
  (nombre: "Agustina Ledesma", plataforma: [APK y website (cuenta)], permisos: [lo propio], escenario: [seis meses; plan nuevo activado hace diez días]),
)

= Usuarios para acceder a la APK y al website con diferentes roles

Todas las cuentas son sintéticas: ninguna persona es real y los datos son de demostración, cargados con la procedencia
`DATOS-SINTETICOS` (cómo se cargaron: `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/LEEME.md`). Las
credenciales no están en el repositorio, que es público: se entregan en la versión de evaluación de este documento,
que se compila fuera del repositorio.

== Roles y permisos

#table(
  columns: (28mm, 1fr, 1fr),
  table.header([Rol], [Qué puede hacer], [Dónde]),
  [Profesional], [Evaluar, planificar, registrar tomas y revisar, solo en sus áreas habilitadas y solo con las personas que aceptaron el vínculo y dieron el consentimiento de esa finalidad. El PDP decide en cada operación (apartado 7).], [website, espacio profesional (`/pro`)],
  [Asesorado], [Ver su plan del día, registrar comidas y sesiones, ver su evolución, aceptar o pausar vínculos y dar o revocar consentimientos. Ve solo lo propio.], [APK; website para la cuenta],
  [Administrador], [Previsto en el legajo; no existe en esta entrega. Los profesionales sintéticos se habilitan con un servicio interno (DL-036).], [—],
)

== Cuentas de la demostración

La verificación entró con cada cuenta en test, leyó su perfil y sus vínculos, y cerró la sesión, sin escribir nada
(#uv.fecha.slice(0, 10), API #id(uv.api.commit)). La columna «Vínculos» cuenta los vínculos vigentes por área.

#{
  set text(size: 10pt)
  table(
    columns: (28mm, 22mm, 1fr, 1fr, 26mm, 26mm),
    table.header([Cuenta], [Plataforma], [Permisos], [Escenario demostrable], [Vínculos], [Acceso]),
    ..COHORTE.map(c => {
      let r = fila(c.nombre)
      (
        [*#c.nombre*],
        c.plataforma,
        c.permisos,
        c.escenario,
        vinculos-activos(r),
        if r.entra { estado("verificado") } else { estado("defecto") },
      )
    }).flatten(),
  )
}

Además existen cinco cuentas de las pruebas de cada paquete (DEMO-PN, DEMO-PT, DEMO-PA, DEMO-A01 y DEMO-A02), que
también entran (verificado el #uv.fecha.slice(0, 10)). Tienen la historia de esas pruebas, con vínculos finalizados y
consentimientos revocados, y no se proponen para la demostración. DEMO-A02 no tiene vínculos: sirve para mostrar una
cuenta recién creada.

== Credenciales

#if es-evaluacion and "credenciales" in privado {
  recuadro(titulo: [Solo para la evaluación], tipo: "decision")[
    Estas credenciales son de cuentas sintéticas del ambiente de test. No dan acceso a datos de personas reales.
  ]
  table(
    columns: (40mm, 24mm, 1fr, 40mm),
    table.header([Cuenta], [Rol], [Correo], [Contraseña]),
    ..privado.credenciales.map(c => (c.cuenta, c.rol, raw(c.correo), raw(c.clave))).flatten(),
  )
} else {
  [Las credenciales de las cuentas de la tabla anterior figuran en la versión de evaluación de este documento.
  #pendiente("Credenciales: versión de evaluación")]
}

== Cómo entrar

- *Website:* la dirección del apartado 13; «Iniciar sesión» con el correo y la contraseña. El profesional entra
  directo a su espacio (`/pro`).
- *APK:* instalar la versión del apartado 12 en un teléfono Android y entrar con la cuenta de una persona.
- *Con Google:* el acceso con Google funciona con cuentas de Google habilitadas como usuarios de prueba del proyecto
  (modo de prueba de OAuth); las cuentas sintéticas no lo usan.
