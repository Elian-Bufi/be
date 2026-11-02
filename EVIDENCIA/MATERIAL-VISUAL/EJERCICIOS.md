# Ejercicios · 15 (3 con imagen real y 12 con ficha y prompt)

**Tres tienen imagen real:** las del paquete de Dirección del 2026-10-06, generadas por IA para BE, ya cargadas por el flujo
real en la evidencia de Entrenamiento por serie. Las tres siguen **pendientes de revisión humana** (técnica y anatomía).
**Doce son fichas con su prompt, sin imagen:** esta sesión no tenía una herramienta que genere imágenes.

## Dónde se muestran y por qué el fondo es blanco

- **Website:** vertical 5:6, entera (object-fit: contain), hasta 18rem; en la grilla de «Mis ejercicios», cuadrada (apps/web/src/app/globals.css:2424-2429 y :2497-2500; apps/web/src/app/pro/exercises/imagen-de-ejercicio.tsx:48).
- **APK:** entera (resizeMode contain) sobre blanco #FFFFFF en los dos temas: cuadrado de 112 dp en la sesión enfocada, 64 dp en el plan y 1:1 en «Ver técnica» (apps/mobile/src/imagen-de-medio.tsx:13-15, :97 y :128-129; pantallas/sesion-enfocada.tsx:69, :155-165 y :782; pantallas/plan-por-serie.tsx:68; tema.ts:73 y :125).
- **Servidor:** se recodifica en JPEG de calidad 82, hasta 1600 px en el lado mayor y sin agrandar; la transparencia se aplana sobre blanco (apps/api/src/medios/procesamiento-de-imagen.ts:54-58; packages/domain/src/contratos-medios.ts:32-43).
- **Qué ejercicio puede tenerla:** solo un ejercicio PROPIO de un profesional (cargado a mano) puede tener imagen: lo exige la base (prisma/migrations/20261006100100_imagen_y_tiempos_de_entrenamiento/migration.sql:98-120) y el servicio (apps/api/src/entrenamiento/imagenes.service.ts:23 y :85). Un ejercicio del catálogo sembrado no tiene dónde mostrarla.

Como BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, **conviene generarlas
sobre blanco**: la transparencia no aporta nada y deja un contorno (el de las tres del paquete se mide en `LEEME.md`).

## Cómo se eligieron

- **Los usados en los planes y recorridos de demostración:** los tres del paquete (la demostración de Entrenamiento por
  serie) y los doce del catálogo sintético de WP-06, que usan los planes de la cohorte de test y la prueba breve.
- **El implemento, cuando el nombre no lo dice,** sale de cómo los cargan los planes de la cohorte: «Zancadas», «Curl de
  bíceps» y «Extensión de tríceps» van por mancuerna; «Sentadilla», «Peso muerto», «Press militar» y «Hip thrust», con
  carga total (barra); «Dominadas», con el peso del cuerpo.
- **Que se distingan a la vista:** la sentadilla con barra y la goblet, el peso muerto con barra y el rumano con
  mancuernas, el press de banca con barra y el press con mancuernas, y las zancadas con mancuernas y la zancada estática
  con las manos en la cintura.

**Imágenes externas: descartadas para esta tanda** (se sondeó la API pública de wger; no se bajó ninguna imagen):

- Las 383 imágenes de ejercicios de wger son CC BY-SA (88 en 3.0, 295 en 4.0): obligan a atribuir y a compartir igual lo que se derive. 104 no tienen autor cargado.
- Son de otro estilo (dibujos de dos tiempos o fotos variadas): mezcladas con las tres del paquete, la serie deja de ser consistente.
- Para varios de los doce no está la variante exacta: press militar de pie con barra, remo con barra con agarre prono, extensión de tríceps con mancuerna; y no se encontraron por nombre de archivo sentadilla trasera, peso muerto convencional, dominadas, plancha ni hip thrust.

## El estilo de los doce nuevos (el de las tres del paquete, sobre blanco)

- Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
- El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
- Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
- Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
- Formato vertical 5:6, al menos 1000 × 1200 px.
- Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
- Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.

| Código | Ejercicio | Imagen | Identidad en el catálogo |
|---|---|---|---|
| E01 | Sentadilla goblet | real (1222 × 1287, 966 KB) | propio, por ambiente |
| E02 | Peso muerto rumano con mancuernas | real (1145 × 1374, 750 KB) | propio, por ambiente |
| E03 | Zancada estática | real (1145 × 1374, 875 KB) | propio, por ambiente |
| E04 | Sentadilla | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01` |
| E05 | Press de banca | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02` |
| E06 | Press con mancuernas | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e03` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03` |
| E07 | Peso muerto | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e04` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e04` |
| E08 | Remo con barra | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e05` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e05` |
| E09 | Dominadas | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e06` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06` |
| E10 | Press militar | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e07` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e07` |
| E11 | Zancadas | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e08` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e08` |
| E12 | Curl de bíceps | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e09` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e09` |
| E13 | Extensión de tríceps | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e10` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e10` |
| E14 | Plancha | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e11` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e11` |
| E15 | Hip thrust | ficha y prompt | `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e12` · versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e12` |

## E01 · Sentadilla goblet

- **Imagen real:** `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/sentadilla_goblet.png` (1222 × 1287 px, 966 KB, SHA-256 `33fd02f76b26…`). **Estado:** pendiente de revisión humana.
- **Catálogo:** Ejercicio PROPIO: lo crea el profesional por el flujo real en cada ambiente (sin identificador fijo en el repositorio). En el catálogo base (DL-141) existe «Sentadilla goblet con mancuerna» (ejercicio e675532c-b308-5c88-b606-7c3dd22ecd81, versión 64251f7e-6c22-5ff9-9655-3819e3b7d187), que no puede llevar imagen hoy.
- **Implemento:** Una mancuerna, sostenida vertical frente al pecho. **Uso:** la demostración de Entrenamiento por serie (paquete del 2026-10-06).
- Revisión técnica del paquete: PENDIENTE_REVISION_PROFESIONAL. Ilustra para reconocer el ejercicio; no certifica la técnica.
- Revisado a ojo el 2026-10-28 (no es la revisión profesional): equipo y agarre correctos, dos brazos, dos manos y dos piernas, apoyos plausibles, cuerpo entero con margen.
- Contorno: un halo rojizo en los píxeles semitransparentes. Sobre blanco (como la guarda y la muestra BE) queda en un 0,1 % de la imagen, con un tinte máximo de 35 a 41 niveles: no se nota a 112 dp; se notaría solo con transparencia sobre un fondo oscuro, que BE no usa.
- El prompt original está en inglés: es el del paquete de Dirección, tal cual.

<details><summary>Prompt</summary>

```text
Use case: stylized-concept. One standalone premium realistic 3D exercise catalog illustration for BE fitness application, no interface, no text, no labels, no brand. A single adult male with average athletic physique, short dark hair, wearing fitted matte midnight-navy T-shirt, slate training shorts and neutral gray sports shoes with thin cyan accents. Full body head to shoes, generous 10% safety margin, isolated on genuinely transparent background. Three-quarter side view shows recognizable goblet squat at middle-to-low position: hips lowered, knees track toward toes, both heels flat, neutral trunk, one compact dark dumbbell held vertically securely by BOTH hands at upper chest, elbows pointing downward between knees. Show exactly two arms, two hands correctly gripping the upper dumbbell head, two legs, balanced natural anatomy. Normal proportions no exaggerated muscles, no cutaway muscles. Soft studio lighting, crisp premium 3D materials, highly readable as a small thumbnail in either light or dark UI. The body and equipment should occupy approximately 78% of image. No ground plane, no glow, no arrows, no ghosted limbs, no extra weights, no watermark. Recognition image, one pose only.
```

</details>

## E02 · Peso muerto rumano con mancuernas

- **Imagen real:** `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/peso_muerto_rumano_mancuernas.png` (1145 × 1374 px, 750 KB, SHA-256 `fb071e2bf648…`). **Estado:** pendiente de revisión humana.
- **Catálogo:** Ejercicio PROPIO, creado por el flujo real en cada ambiente. En el catálogo base (DL-141) hay uno con el mismo nombre (ejercicio 3f625674-cabf-5f13-8507-5ac18998944c, versión 2b862b5d-1dbc-584a-a6de-210abfa3472f), que no puede llevar imagen hoy.
- **Implemento:** Una mancuerna en cada mano. **Uso:** la demostración de Entrenamiento por serie.
- Revisión técnica del paquete: PENDIENTE_REVISION_PROFESIONAL. Ilustra para reconocer el ejercicio; no certifica la técnica.
- Revisado a ojo el 2026-10-28 (no es la revisión profesional): equipo y agarre correctos, dos brazos, dos manos y dos piernas, apoyos plausibles, cuerpo entero con margen.
- Contorno: un halo rojizo en los píxeles semitransparentes. Sobre blanco (como la guarda y la muestra BE) queda en un 0,1 % de la imagen, con un tinte máximo de 35 a 41 niveles: no se nota a 112 dp; se notaría solo con transparencia sobre un fondo oscuro, que BE no usa.
- El prompt original está en inglés: es el del paquete de Dirección, tal cual.

<details><summary>Prompt</summary>

```text
Use case: stylized-concept. One standalone premium realistic 3D exercise catalog illustration for BE fitness application, no interface, no text, no labels, no brand. A single adult male with average athletic physique, short dark hair, wearing fitted matte midnight-navy T-shirt, slate training shorts and neutral gray sports shoes with thin cyan accents. Full body head to shoes, generous 10% safety margin, isolated on genuinely transparent background. Clear SIDE three-quarter view of a dumbbell Romanian deadlift at the bottom of a comfortable hip hinge: hips pushed back, knees slightly flexed, neutral straight spine from head to pelvis, torso inclined forward, both feet flat, arms straight vertically beneath shoulders. ONE dark dumbbell in EACH hand, both dumbbells close to the outer shins below knees, not touching floor. Exactly two arms two hands two legs two dumbbells, correct grip, naturally balanced anatomy. Not a squat, not rounded back, not straight locked knees. Normal proportions no exaggerated muscles. Soft studio lighting, crisp premium 3D materials, highly readable as small thumbnail in either light or dark UI. Subject approx78% of image. No ground plane, no glow, no arrows, no ghosted limbs, no watermark. Recognition image, one pose only.
```

</details>

## E03 · Zancada estática

- **Imagen real:** `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/zancada_estatica.png` (1145 × 1374 px, 875 KB, SHA-256 `cb638a9ae82d…`). **Estado:** pendiente de revisión humana.
- **Catálogo:** Ejercicio PROPIO, creado por el flujo real en cada ambiente. El catálogo base (DL-141) no tiene una zancada estática.
- **Implemento:** Sin carga externa, manos en la cintura. **Uso:** la demostración de Entrenamiento por serie.
- Revisión técnica del paquete: PENDIENTE_REVISION_PROFESIONAL. Ilustra para reconocer el ejercicio; no certifica la técnica.
- Revisado a ojo el 2026-10-28 (no es la revisión profesional): equipo y agarre correctos, dos brazos, dos manos y dos piernas, apoyos plausibles, cuerpo entero con margen.
- Contorno: un halo rojizo en los píxeles semitransparentes. Sobre blanco (como la guarda y la muestra BE) queda en un 0,1 % de la imagen, con un tinte máximo de 35 a 41 niveles: no se nota a 112 dp; se notaría solo con transparencia sobre un fondo oscuro, que BE no usa.
- El prompt original está en inglés: es el del paquete de Dirección, tal cual.

<details><summary>Prompt</summary>

```text
Use case: stylized-concept. One standalone premium realistic 3D exercise catalog illustration for BE fitness application, no interface, no text, no labels, no brand. A single adult male with average athletic physique, short dark hair, wearing fitted matte midnight-navy T-shirt, slate training shorts and neutral gray sports shoes with thin cyan accents. Full body head to shoes, generous 10% safety margin, isolated on genuinely transparent background. Three-quarter SIDE view of a stationary split squat / static lunge, bodyweight with both hands resting naturally on hips. Feet on two parallel hip-width tracks, one leg forward with foot fully flat and knee roughly90degrees, other leg back with heel raised and knee lowered near but not touching floor. Torso upright, hips lowered between feet, neutral head and spine. Exactly two arms two hands two legs, natural balanced anatomy and no extra equipment. Normal proportions no exaggerated muscles. Soft studio lighting, crisp premium 3D materials, highly readable as small thumbnail in either light or dark UI. Subject approx78% of image. No ground plane, no glow, no arrows, no ghosted limbs, no watermark. Recognition image, one pose only.
```

</details>

## E04 · Sentadilla

- **Archivo:** `E04-sentadilla.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos sobre la parte alta de la espalda (de dónde sale: carga total en la cohorte (personas.mjs) y 50 kg en la prueba breve). **Uso:** 22 veces en la cohorte; prueba breve («Sesión de prueba»).
- **No debe aparecer:** mancuerna al pecho, máquina Smith, rack.
- **Postura:** Sentadilla trasera con barra a media altura: la barra apoyada sobre los trapecios, las manos tomando la barra por fuera de los hombros, cadera atrás y abajo hasta muslos casi paralelos al piso, talones apoyados, rodillas en la dirección de los pies, tronco firme y espalda neutra.
- **Que se distinga:** De la sentadilla goblet (E01): barra en la espalda, no mancuerna al pecho.
- **A decidir:** El nombre no dice el implemento: se propone barra por la carga de la cohorte.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Sentadilla». Implemento: Una barra con discos sobre la parte alta de la espalda.
Postura: Sentadilla trasera con barra a media altura: la barra apoyada sobre los trapecios, las manos tomando la barra por fuera de los hombros, cadera atrás y abajo hasta muslos casi paralelos al piso, talones apoyados, rodillas en la dirección de los pies, tronco firme y espalda neutra.
No debe aparecer: mancuerna al pecho, máquina Smith, rack.
```

</details>

## E05 · Press de banca

- **Archivo:** `E05-press-de-banca.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos y un banco plano (de dónde sale: el nombre; 40 kg en la prueba breve). **Uso:** 13 veces en la cohorte; prueba breve («Sesión de prueba»).
- **No debe aparecer:** mancuernas, banco inclinado, compañero que asiste.
- **Postura:** Acostado boca arriba en un banco plano, pies apoyados en el piso, la barra arriba del pecho con los brazos extendidos, agarre algo más ancho que los hombros.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Press de banca». Implemento: Una barra con discos y un banco plano.
Postura: Acostado boca arriba en un banco plano, pies apoyados en el piso, la barra arriba del pecho con los brazos extendidos, agarre algo más ancho que los hombros.
No debe aparecer: mancuernas, banco inclinado, compañero que asiste.
```

</details>

## E06 · Press con mancuernas

- **Archivo:** `E06-press-con-mancuernas.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e03`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una mancuerna en cada mano y un banco plano (de dónde sale: el nombre; por mancuerna en la cohorte (MANC)). **Uso:** 14 veces en la cohorte.
- **No debe aparecer:** barra, press sobre la cabeza de pie.
- **Postura:** Acostado boca arriba en un banco plano, pies apoyados, una mancuerna en cada mano arriba del pecho, brazos extendidos y palmas hacia los pies.
- **Que se distinga:** Del press de banca (E05): dos mancuernas, no barra.
- **A decidir:** El nombre no dice el banco: se propone banco plano (el press militar ya cubre el empuje sobre la cabeza).

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Press con mancuernas». Implemento: Una mancuerna en cada mano y un banco plano.
Postura: Acostado boca arriba en un banco plano, pies apoyados, una mancuerna en cada mano arriba del pecho, brazos extendidos y palmas hacia los pies.
No debe aparecer: barra, press sobre la cabeza de pie.
```

</details>

## E07 · Peso muerto

- **Archivo:** `E07-peso-muerto.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e04`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e04` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos (de dónde sale: carga total en la cohorte). **Uso:** 19 veces en la cohorte.
- **No debe aparecer:** mancuernas, espalda redondeada, piernas totalmente rectas.
- **Postura:** Peso muerto convencional a mitad del recorrido: la barra con discos apenas debajo de las rodillas y pegada a las piernas, cadera flexionada, espalda neutra, brazos extendidos, agarre prono a la altura de los hombros, pies apoyados.
- **Que se distinga:** Del peso muerto rumano con mancuernas (E02): barra con discos.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Peso muerto». Implemento: Una barra con discos.
Postura: Peso muerto convencional a mitad del recorrido: la barra con discos apenas debajo de las rodillas y pegada a las piernas, cadera flexionada, espalda neutra, brazos extendidos, agarre prono a la altura de los hombros, pies apoyados.
No debe aparecer: mancuernas, espalda redondeada, piernas totalmente rectas.
```

</details>

## E08 · Remo con barra

- **Archivo:** `E08-remo-con-barra.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e05`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e05` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos (de dónde sale: el nombre). **Uso:** 21 veces en la cohorte.
- **No debe aparecer:** mancuernas, polea, banco.
- **Postura:** De pie, tronco inclinado unos 45 grados con la espalda neutra, rodillas apenas flexionadas, la barra llevada hacia el abdomen con agarre prono y los codos hacia atrás.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Remo con barra». Implemento: Una barra con discos.
Postura: De pie, tronco inclinado unos 45 grados con la espalda neutra, rodillas apenas flexionadas, la barra llevada hacia el abdomen con agarre prono y los codos hacia atrás.
No debe aparecer: mancuernas, polea, banco.
```

</details>

## E09 · Dominadas

- **Archivo:** `E09-dominadas.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e06`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra fija, con el peso del cuerpo (de dónde sale: peso corporal en la cohorte (CORPORAL)). **Uso:** 14 veces en la cohorte.
- **No debe aparecer:** banda elástica, máquina asistida, cinturón con peso.
- **Postura:** Colgado de una barra fija con agarre prono algo más ancho que los hombros, en la parte alta: el mentón a la altura de la barra, piernas extendidas y juntas.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Dominadas». Implemento: Una barra fija, con el peso del cuerpo.
Postura: Colgado de una barra fija con agarre prono algo más ancho que los hombros, en la parte alta: el mentón a la altura de la barra, piernas extendidas y juntas.
No debe aparecer: banda elástica, máquina asistida, cinturón con peso.
```

</details>

## E10 · Press militar

- **Archivo:** `E10-press-militar.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e07`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e07` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos, de pie (de dónde sale: el nombre; carga total en la cohorte). **Uso:** 12 veces en la cohorte.
- **No debe aparecer:** sentado, mancuernas, máquina.
- **Postura:** De pie, pies al ancho de la cadera, la barra arriba de la cabeza con los brazos extendidos, tronco firme y sin arquear la espalda.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Press militar». Implemento: Una barra con discos, de pie.
Postura: De pie, pies al ancho de la cadera, la barra arriba de la cabeza con los brazos extendidos, tronco firme y sin arquear la espalda.
No debe aparecer: sentado, mancuernas, máquina.
```

</details>

## E11 · Zancadas

- **Archivo:** `E11-zancadas.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e08`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e08` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una mancuerna en cada mano (de dónde sale: por mancuerna y por lado en la cohorte (MANC, personas.mjs:68)). **Uso:** 17 veces en la cohorte.
- **No debe aparecer:** manos en la cintura sin peso, barra, flechas de movimiento.
- **Postura:** Zancada con una mancuerna colgando a cada lado del cuerpo: pierna adelante con el pie apoyado y la rodilla a unos 90 grados, rodilla de atrás cerca del piso y talón de atrás levantado, tronco erguido.
- **Que se distinga:** De la zancada estática (E03): con dos mancuernas, no manos en la cintura. Una sola postura no muestra si avanza: no se inventa el movimiento.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Zancadas». Implemento: Una mancuerna en cada mano.
Postura: Zancada con una mancuerna colgando a cada lado del cuerpo: pierna adelante con el pie apoyado y la rodilla a unos 90 grados, rodilla de atrás cerca del piso y talón de atrás levantado, tronco erguido.
No debe aparecer: manos en la cintura sin peso, barra, flechas de movimiento.
```

</details>

## E12 · Curl de bíceps

- **Archivo:** `E12-curl-de-biceps.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e09`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e09` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una mancuerna en cada mano (de dónde sale: por mancuerna en la cohorte (MANC, personas.mjs:71)). **Uso:** 8 veces en la cohorte.
- **No debe aparecer:** barra, polea, banco Scott.
- **Postura:** De pie, codos pegados al cuerpo, una mancuerna en cada mano con las palmas hacia arriba, antebrazos flexionados a unos 90 grados.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Curl de bíceps». Implemento: Una mancuerna en cada mano.
Postura: De pie, codos pegados al cuerpo, una mancuerna en cada mano con las palmas hacia arriba, antebrazos flexionados a unos 90 grados.
No debe aparecer: barra, polea, banco Scott.
```

</details>

## E13 · Extensión de tríceps

- **Archivo:** `E13-extension-de-triceps.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e10`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e10` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una mancuerna sostenida con las dos manos y un banco con respaldo (de dónde sale: por mancuerna en la cohorte (MANC, personas.mjs:71)). **Uso:** 2 veces en la cohorte.
- **No debe aparecer:** polea, barra, acostado.
- **Postura:** Sentado en un banco con respaldo, una mancuerna sostenida con las dos manos detrás de la cabeza, codos apuntando hacia arriba y cerca de la cabeza, antebrazos bajados.
- **A decidir:** El nombre no dice la postura ni el implemento exacto: se propone sobre la cabeza con una mancuerna.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Extensión de tríceps». Implemento: Una mancuerna sostenida con las dos manos y un banco con respaldo.
Postura: Sentado en un banco con respaldo, una mancuerna sostenida con las dos manos detrás de la cabeza, codos apuntando hacia arriba y cerca de la cabeza, antebrazos bajados.
No debe aparecer: polea, barra, acostado.
```

</details>

## E14 · Plancha

- **Archivo:** `E14-plancha.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e11`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e11` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Sin material (de dónde sale: en la cohorte se mide en segundos). **Uso:** 9 veces en la cohorte.
- **No debe aparecer:** plancha con brazos extendidos, plancha lateral, colchoneta con marca.
- **Postura:** Plancha sobre antebrazos, vista de lado: codos debajo de los hombros, cuerpo recto de la cabeza a los talones, apoyado en las puntas de los pies, sin colchoneta.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Plancha». Implemento: Sin material.
Postura: Plancha sobre antebrazos, vista de lado: codos debajo de los hombros, cuerpo recto de la cabeza a los talones, apoyado en las puntas de los pies, sin colchoneta.
No debe aparecer: plancha con brazos extendidos, plancha lateral, colchoneta con marca.
```

</details>

## E15 · Hip thrust

- **Archivo:** `E15-hip-thrust.jpg`. **Estado:** ficha lista, sin imagen.
- **Catálogo:** ejercicio `4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e12`, versión `4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e12` · Catálogo sintético de WP-06 (prisma/migrations/20260921100000_circuito_de_entrenamiento).
- **Implemento:** Una barra con discos sobre la cadera y un banco plano (de dónde sale: carga total en la cohorte). **Uso:** 17 veces en la cohorte.
- **No debe aparecer:** puente en el piso sin banco, máquina, mancuernas.
- **Postura:** La parte alta de la espalda apoyada en el borde de un banco, la barra con discos sobre la cadera, pies apoyados, rodillas a unos 90 grados y cadera extendida arriba, tronco paralelo al piso.

<details><summary>Prompt</summary>

```text
Ilustración 3D realista de catálogo de ejercicios para la app BE, sin interfaz, sin texto y sin marcas.
El mismo modelo de las tres imágenes del paquete: un hombre adulto de físico atlético promedio, pelo corto oscuro, remera azul marino mate entallada, short gris pizarra y zapatillas grises con detalles cian.
Cuerpo entero, de la cabeza a los pies, con un margen del 10 % alrededor. Vista lateral de tres cuartos. El cuerpo y el material ocupan cerca del 78 % de la imagen.
Fondo blanco puro (#FFFFFF), sin transparencia: BE aplana la transparencia sobre blanco y muestra la ilustración sobre blanco en los dos temas, así que generarla sobre blanco evita halos en el contorno.
Formato vertical 5:6, al menos 1000 × 1200 px.
Exactamente dos brazos, dos manos y dos piernas, con anatomía natural y agarre correcto. Proporciones normales, sin músculos exagerados ni cortes anatómicos. Luz de estudio suave. Legible como miniatura de 112 dp.
Sin piso marcado, sin brillos, sin flechas, sin miembros fantasma, sin marca de agua. Una sola postura: es una imagen de reconocimiento, no una secuencia.
Ejercicio: «Hip thrust». Implemento: Una barra con discos sobre la cadera y un banco plano.
Postura: La parte alta de la espalda apoyada en el borde de un banco, la barra con discos sobre la cadera, pies apoyados, rodillas a unos 90 grados y cadera extendida arriba, tronco paralelo al piso.
No debe aparecer: puente en el piso sin banco, máquina, mancuernas.
```

</details>


---
Generado por `herramientas/generar.mjs` desde el manifiesto congelado y `herramientas/seleccion.mjs` (commit de referencia `e4512cb`). No editar a mano: cambiar la selección y volver a generar.
