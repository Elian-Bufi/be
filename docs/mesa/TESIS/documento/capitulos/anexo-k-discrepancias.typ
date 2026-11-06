#import "../plantilla.typ": *

= Discrepancias y defectos pendientes

Lo que se encontró al preparar este documento y no se corrigió en el producto, porque el encargo pide documentar y no
cambiar el producto para que coincida con un gráfico. Cada punto dice dónde está, por qué importa y qué se propone.
La severidad es la del efecto sobre la persona o sobre la evaluación: *alta* (afecta un circuito o un dato), *media*
(confunde o deja una prueba sin hacer), *baja* (documental). Los números siguen el orden en que se encontró cada punto,
por eso K18 aparece entre los documentos.

== En el producto

#table(
  columns: (8mm, 1fr, 16mm, 1fr),
  table.header([], [Qué], [Sever.], [Qué se propone]),
  [K1], [*Regresión de la sustitución de ejercicios (RF-043).* La APK 0.13.2 permitía sustituir un ejercicio durante la sesión; la candidata 0.17.0 no lo ofrece (DL-151).], [alta], [Integrar el PR \#195 (en borrador) y probarlo en el teléfono antes de promover una candidata a estable.],
  [K2], [*Esqueleto común con un alcance nominal.* `EjecutorDeDominio` exige un alcance; cinco de sus ocho subclases son transversales y pasan uno que no usan (apartado 7).], [baja], [Alcance opcional en el esqueleto, o un esqueleto sin alcance para lo transversal.],
  [K3], [*Autoría de la versión de consentimiento sin clave foránea.* `actorId` y `autoriaId` de `VersionDeConsentimiento` no tienen clave foránea.], [baja], [Confirmar si es intencional, como en los registros de auditoría, y documentarlo; si no, agregar la clave.],
  [K4], [*Operaciones P0 del legajo sin implementar.* Están implementadas 104 de las 122 operaciones P0 del 09. Faltan las 13 de verificación profesional (PRO, fuera de alcance), DSH-01, 02 y 05 y PRJ-02 y 03. DSH-01 y DSH-02 se cubren en parte con CAR-01 y DSH-04; DSH-05 (el progreso propio), con las operaciones propias de «Mi evolución» (RF-065).], [media], [Declararlo en la presentación como alcance; registrar la equivalencia de DSH en una DL.],
  [K19], [*Un comentario del esquema desactualizado.* El de `ReferenciaDeNota` dice que el recurso citado «puede ser de cuatro tablas»; `TipoDeReferenciaDeNota` tiene cinco valores, uno por tabla (anexo G).], [baja], [Corregir el comentario en el próximo cambio del esquema.],
)

== En los documentos

#table(
  columns: (8mm, 1fr, 16mm, 1fr),
  table.header([], [Qué], [Sever.], [Qué se propone]),
  [K5], [`docs/DEUDA_LEGAJO.md`: DL-115 figura «sin integrar» en la tabla y «ABIERTA» en su encabezado, pero está decidida e integrada desde la APK 0.13.2.], [media], [Actualizar la fila y el encabezado.],
  [K6], [`docs/DEUDA_LEGAJO.md`: DL-041 («el profesional sin cartera») sigue abierta, pero la cartera existe (CAR-01).], [media], [Cerrarla con la referencia a CAR-01.],
  [K7], [El mapeo de DV-05 del 2026-10-16 dice que no hay línea temporal entre dominios y que los avisos push están fuera de alcance; las dos cosas ya existían ese día (apartado 5).], [media], [Nota de actualización en DV-05 (este documento ya la incorpora).],
  [K8], [La conciliación del DER (DV-06, 2026-10-02) compara 83 modelos; hoy son 113 y cinco entidades que faltaban se implementaron (apartado 6).], [baja], [Rehacer la conciliación sobre la versión de cierre.],
  [K9], [`EVIDENCIA/ENTREGA/GUIA-DEMO.md` (16/10) dice que la sesión del website no sobrevive a una recarga; desde DL-147 sí sobrevive.], [media], [Reemplazarla por el guion del apartado 11.],
  [K10], [`docs/DESPLIEGUE.md` dice que los recordatorios corren a las 15 y a las 22; `render.yaml` los programa tres veces (01, 13 y 18 UTC: 22, 10 y 15 h).], [baja], [Actualizar el texto.],
  [K11], [El 05 no declara algunos campos: el disparador de UC-P25 a UC-P33 y el actor y las postcondiciones de varios incluidos. El apartado 4 lo indica en cada ficha.], [baja], [Completar el 05 en su próxima versión (lo decide Dirección).],
  [K12], [Una fuente de la competencia cambió de dirección (Hexfit) entre la primera consulta y la del 2026-10-20.], [baja], [Ninguna: se cita la dirección vigente.],
  [K18], [La tabla de `docs/DEUDA_LEGAJO.md` quedó atrás de lo integrado en DL-012, DL-120, DL-136, DL-138, DL-140, DL-141, DL-147, DL-148 y DL-150 (dice, por ejemplo, «falta web y APK», «sin integrar» o «once recorridos»; anexo H). DL-115 es el punto K5.], [media], [Actualizar los estados al integrar cada PR.],
  [K20], [*El índice de relaciones del 05 no coincide con sus flujos.* UC-E02 invoca UC-I12 (paso 9) y UC-I09 invoca UC-I13 sin declararlo; UC-E04 invoca UC-P04; UC-P30 nombra su extensión UC-E08 (V03) sin registrarla; y UC-P14 incluye UC-I12 sin un paso que lo invoque. El disparador de UC-I12 llama a UC-E03 «Corregir evaluación antropométrica», que el 05 nombra «Corregir o anular medición antropométrica». Las fichas muestran el índice y anotan lo que dicen los flujos; las láminas dibujan los flujos (apartado 4).], [baja], [Corregir el índice del 05 en su próxima versión (lo decide Dirección).],
)

== En la evidencia y las pruebas

#table(
  columns: (8mm, 1fr, 16mm, 1fr),
  table.header([], [Qué], [Sever.], [Qué se propone]),
  [K13], [Las pruebas en el teléfono del 2026-10-17 (acceso con Google e invitaciones) no tienen acta escrita ni capturas.], [media], [Registrar el resultado con fecha, versión y teléfono.],
  [K14], [La candidata 0.17.0-candidata.3 no se probó entera en el teléfono; ningún aviso push llegó todavía a un teléfono real.], [alta], [Prueba en el teléfono antes de la defensa; no promover a estable hasta entonces.],
  [K15], [Sin pruebas con lector de pantalla (TalkBack) ni con Safari y Firefox.], [media], [Una pasada manual con cada uno; para Safari, comprobar la cookie particionada (CHIPS).],
  [K16], [La verificación de borradores del 2026-10-20 dejó a la persona sintética «Verificación QA» con un vínculo finalizado en la cartera de la profesional de Nutrición de la demostración. La cartera la muestra como «Asesorado · bea2eb», con Nutrición finalizada.], [baja], [Saberlo antes de la demo: es historia y no se borra.],
  [K17], [No hay capturas nativas de la APK de la versión candidata: las del repositorio son vistas del cliente real dibujadas en el navegador, rotuladas como tales.], [media], [Tomar capturas en el teléfono para la portada y el plan B de la demo.],
)
