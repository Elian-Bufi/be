# WP-CATALOGO-VISUAL — zonas musculares e imagen del catálogo

> **En dos frases.** El servidor ya sabe qué zonas trabaja cada ejercicio (las 17 del set de capas de Dirección, con su rol
> principal o secundario) y un ejercicio del catálogo de todos ya puede tener foto, que la APK instalada muestra sin cambios.
> Falta que el website lo muestre (etapa 2), cargar los datos de la demostración y desplegar.

**Encargo.** Dirección, 2026-11-02 (frente C): «zonas musculares en el escritorio del profesional esta semana, con sus
imágenes» y las fotos de los ejercicios del catálogo para la demostración del 2026-11-06.

**Identificadores declarados.** DL-081 (se cierra), DL-162 (nueva). Operaciones nuevas: API-ZON-01, API-EJE-04 y API-EJE-05.
Migración `20261102120000_catalogo_visual`. Nada de lo que leen las APK instaladas cambia de forma (DL-152).

## Etapa 1 · el servidor (rama `wp-catalogo-visual`)

| Pieza | Dónde | Qué hace |
|---|---|---|
| Las 17 zonas | `packages/domain/src/zonas-musculares.ts`, tabla `zona_muscular` | Identificador, nombre visible, vistas y versión (`zonas-be-2026-11-02`). DL-081 tiene la tabla. |
| API-ZON-01 | `GET /training/muscle-zones` | La operación de descubrimiento que faltaba. Cualquier sesión. |
| Zonas de un ejercicio propio | API-INT-TRN-01 (al cargarlo) y API-EJE-04 (`PUT /training/exercises/{exerciseId}/muscle-zones`) | Lista completa con su rol, sin repetidas ni porcentajes; `expectedZonesVersion`; historia de solo agregar. |
| Zonas e imagen en el catálogo | API-TRN-13 y API-TRN-13-BUSQUEDA | `muscleZones` y `didacticResources` con la forma congelada de siempre. |
| Ficha visual | API-EJE-05 (`POST /training/exercises/visual-sheets`) | De 1 a 50 ejercicios por identidad: zonas e imagen completa (procedencia, licencia, texto alternativo). |
| Imagen del catálogo de todos | `asociacion_de_imagen_de_ejercicio` (DL-123), trigger nuevo, regla de API-MED-03 | La cura BE; la ven los profesionales de Entrenamiento y el asesorado cuyo plan la cita (DL-162). |
| Curaduría de BE | `apps/api/src/entrenamiento/curaduria.ts` y `curaduria-comando.ts` | Zonas e imágenes de lo sembrado y lo importado, por el operador. Sin `--confirmo-escritura` solo dice lo que haría. |
| Herramientas de carga | `EVIDENCIA/CATALOGO-VISUAL/` | `zonas.mjs` y `fotos.mjs`, con la propuesta de zonas para revisar y el manifiesto de las fotos. |

**Lo que no hace.** No infiere ni copia zonas de wger ni del nombre (B10-06 §22); no calcula volumen ni nada por zona
(REG-06-139; B10-06 §59); no cambia la APK.

## Etapa 2 · el website (frente C2, en el mismo árbol)

**Cómo leer las zonas.**
- La lista: `ZONAS_MUSCULARES` de `@be/domain` (la misma de API-ZON-01, sin red), con `nombreDeZona(id)` y el orden de la
  cabeza a los pies. Si hace falta por la red: `cliente.zonasMusculares(token)`.
- Las de cada ejercicio: en cada fila de `cliente.buscarEjercicios(token, texto)` (API-TRN-13-BUSQUEDA),
  `muscleZones: [{ zoneId, role: 'PRIMARY' | 'SECONDARY' }]`, ya ordenadas (principales primero). En la ficha completa,
  `cliente.fichasVisualesDeEjercicios(token, exerciseIds)` (API-EJE-05): `{ data: [{ exerciseId, versionId, name,
  provenance, muscleZones, zonesVersion, zonesExerciseVersionId, imageVersion, image }] }`, en el orden pedido; lo que el
  profesional no ve no viene.
- Cambiarlas (solo un ejercicio propio, `provenance: 'PROFESSIONAL_MANUAL'`): `cliente.cambiarZonasDeEjercicio(token,
  exerciseId, { exerciseVersionId, expectedZonesVersion: ficha.zonesVersion, muscleZones }, clave)`. 409 VERSION_CONFLICT:
  releer la ficha; 422 VALIDATION_FAILED con `MUSCLE_ZONE_UNKNOWN` o `MUSCLE_ZONE_DUPLICATED` y su ruta. Lo del catálogo de
  todos es de solo lectura para el profesional (responde 404).
- Al cargar uno nuevo, `muscleZones` va en API-INT-TRN-01.

**Cómo leer las imágenes.**
- De un ejercicio: `ficha.image` de API-EJE-05 (`mediaId`, `provenance` AI_GENERATED o PERSON_PROVIDED, `authorship`,
  `license`, `technicalReview`, `altText`), o `prescripcion.image` del plan (API-SER-01), que ya trae también las del
  catálogo. Los bytes, con `useImagenDeMedio(token, mediaId, sesionPerdida)` de `apps/web/src/lib/medios.ts` (API-MED-03).
- En la búsqueda, `didacticResources[0].resourceId` es el mismo `mediaId`; para decir «generada con IA», usar la ficha.

**La figura.** Las máscaras son del set de Dirección (no están en el repo): cuerpo `be-body-m-front.png` y
`be-body-m-back.png`, y por zona `be-mask-m-{front|back}-{zoneId}.png` (ANTERIOR → `front`, POSTERIOR → `back`), PNG de
1024 × 1536 en la misma grilla, magenta con alfa: se tiñen con `mask-image` y un color del tema. Una zona se dibuja solo en
las vistas que declara; deltoides y antebrazo, en las dos. Principal y secundaria se distinguen por color (B10-06 §21: el
color no es un peso). Romboides y erectores llevan la nota «capa profunda». La lista de zonas en texto acompaña siempre a
la figura (accesibilidad). El set femenino usa los mismos identificadores cuando llegue.

## Lo que necesita Dirección

1. Revisar la propuesta de zonas (`EVIDENCIA/CATALOGO-VISUAL/PROPUESTA-DE-ZONAS.md`) y marcarla REVISADA.
2. Generar las imágenes E04 a E23 y completar los textos alternativos de E04 a E15 (`imagenes.json`).
3. Ratificar DL-162 (D-1 a D-5) y autorizar integrar, desplegar test y correr las dos cargas contra test.
