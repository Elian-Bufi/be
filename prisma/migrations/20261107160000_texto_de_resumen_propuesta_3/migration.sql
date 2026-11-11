-- WP-TABLERO-ALTA-GAMA · TB-55 (DEUDA_LEGAJO DL-163 D-13, ampliada): la propuesta 3 del texto de «resumen». Migración de
-- solo agregar: siembra una versión de texto y no toca ninguna fila.
-- La propuesta 2 decía que la autorización del plan «se acepta aparte»; la implementación hace otra cosa: la de «resumen y
-- plan» incluye este resumen y alcanza para un permiso de «resumen» (TA-111). Un texto no promete lo que no existe: la 3
-- cambia solo ese párrafo («… que incluye también este resumen.») y sucede a la 2 con `reemplaza_a_id`. La 2 queda como
-- historia y no hereda aceptaciones (09 §31.2.6). Una propuesta, pendiente de validación jurídica (PENDING_APPROVAL).
-- Generada desde @be/domain: `node scripts/generar-sql-catalogo-de-textos.cjs --ids resumenes-compartidos-2026-11-propuesta-3`.
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde", "reemplaza_a_id") VALUES ('resumenes-compartidos-2026-11-propuesta-3', 'RESUMENES_COMPARTIDOS', $be_texto$Compartir el resumen de otras áreas con mis profesionales$be_texto$, 'COMPARTIR_RESUMEN_DE_OTRAS_AREAS_CON_PROFESIONALES', $be_texto$Compartir el resumen de otras áreas con mis profesionales — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que un profesional que te acompaña en un área vea el resumen de otra área tuya, la que lleva otro profesional. La das por profesional y por área.

Qué ve: el resumen de esa área que BE arma para el área de quien lo recibe, con una tabla fija. Por ejemplo, de Entrenamiento, los días por semana del plan y las sesiones que registraste; de Antropometría, el peso y la composición en kilos, con su método; de Nutrición, solo desde cuándo rige tu plan y las fechas de tus revisiones, sin números. Nunca incluye las molestias de «Antes de entrenar», lo de salud de tus formularios, las notas internas de tus profesionales ni sus evaluaciones.

Qué no ve: tu plan completo. Para eso hay otra autorización, «Compartir el plan de otras áreas con mis profesionales», que incluye también este resumen.

Quiénes lo ven: solo los profesionales que elijas, mientras su vínculo con vos esté vigente y su acceso esté autorizado. Si un vínculo se pausa o termina, ese profesional deja de verlo. Lo que compartís es lo del profesional que lleva esa área hoy: si empezás con otro profesional en esa área, no se le comparte a nadie hasta que vuelvas a elegir. Un profesional que empiece a acompañarte después no ve nada de otras áreas hasta que lo elijas.

Cada vez que un profesional lo abre, queda registrado, y lo ves vos. Quien lleva esa área sabe con quién lo compartís.

Podés sacar a alguien o retirar esta autorización cuando quieras, y corta desde ese momento. No se borra nada, y retirarla no deshace lo que un profesional ya vio. Cerrar tu cuenta también la retira.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '95095b6067f74e5fb514fd0177397de394257025364162ce030eac0fe07eb45e', '2026-11-07T18:00:00.000Z', 'resumenes-compartidos-2026-11-propuesta-2');
