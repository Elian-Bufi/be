# WP-FORMULARIOS-RONDA-2 — los formularios de inicio, después de la prueba de Dirección

> **Estado:** PROPUESTA, sin ratificar. Solo FR-01 y FR-02 se programan ya, porque corrigen lo que WP-FORMULARIOS-DE-INICIO
> ya pedía (FI-04 y PF-02). El resto espera las decisiones de abajo.
>
> **Origen:** la prueba de Dirección del 2026-11-05 en la APK 0.20.0-candidata.1 y en el escritorio
> (`EVIDENCIA/FORMULARIOS-DE-INICIO/LEEME.md`, «Resultados»). Dirección: «es lo mismo pero cambia la experiencia de la
> persona».
>
> **Datos:** solo sintéticos, en local y en `test`.

## 1. Las dos fallas (se corrigen sin decisión nueva)

| ID | Qué | Toca la API | Se acepta cuando |
|---|---|---|---|
| FR-01 | El borrador del formulario no se pierde al cerrar la app (FI-04) | No | Lo escrito se guarda cifrado en el teléfono, por cuenta y por solicitud, con el mismo almacén que el entrenamiento en curso (`almacen-cifrado.ts`: AES-256-GCM, la clave en el almacenamiento seguro, fuera del respaldo). Se borra al enviar, al descartar, al cerrar la sesión y cuando la solicitud deja de estar pendiente. Una prueba fija cada caso. En el teléfono: cerrar la app desde Recientes y volver, y lo escrito sigue |
| FR-02 | Nutrición pide información desde su área, como Entrenamiento (PF-02) | No | El Resumen de Nutrición tiene «Pedir información», con «Cómo comés hoy» elegido y un «para qué» sugerido que se puede cambiar. Al enviar, vuelve a Nutrición |

## 2. Lo que decide Dirección

1. **¿El formulario va en pantallas cortas, una por parte? (D-1)**
   - **Recomendación:** sí, en la app y en «Cargar con la persona». Cada parte que ya tiene el formulario (en «Cómo comés
     hoy» son seis) va en su pantalla, con «Parte 2 de 6», «Anterior» y «Siguiente». Al final, un repaso de lo
     respondido antes de enviar. Si falta una obligatoria, se avisa al pasar de parte, pero se puede seguir y volver.
   - **Por qué:** las mismas preguntas en tandas cortas agobian menos, y la persona sabe cuánto le falta.
   - **Si decís que no:** queda un solo desplazamiento, con un índice de las partes arriba.
2. **¿Las ayudas van plegadas? (D-2)**
   - **Recomendación:** sí. El «para qué se usa» de cada pregunta pasa a un botón «¿Para qué?» al lado de la pregunta.
     «Lo que respondas queda como declarado por vos» se dice una sola vez, al empezar. «Tocá de nuevo la opción elegida
     para dejarla sin responder» se reemplaza por un «Quitar respuesta» que aparece solo cuando hay algo elegido en una
     pregunta opcional. Los ejemplos quedan como texto de muestra en las respuestas de texto. TalkBack sigue leyendo
     todo cuando se lo pide.
   - **Por qué:** el texto está, pero no tapa las preguntas.
   - **Si decís que no:** quedan a la vista, como hoy.
3. **¿Se saca «Te lleva unos N minutos»? (D-3)**
   - **Recomendación:** sí. Con las pantallas cortas, «Parte 1 de 6» ya dice cuánto falta.
   - **Por qué:** un tiempo estimado se lee como una promesa, y cada persona tarda distinto.
   - **Si decís que no:** se mantiene.
4. **¿La pregunta del embarazo viene sin elegir? (D-4)**
   - **Recomendación:** sí, en los dos formularios: el profesional la agrega cuando corresponde y deja de ser
     obligatoria. En Entrenamiento es una pregunta de seguridad antes de hacer ejercicio, así que la pregunta de las
     indicaciones médicas suma «un embarazo o un parto reciente» como ejemplo.
   - **Por qué:** hoy se le pide a todas las personas, y su importancia es muy particular.
   - **Si decís que no:** se saca de los dos formularios, y queda solo el ejemplo en la pregunta médica.
5. **¿Los días y el horario van en una tabla, día por día? (D-5)**
   - **Recomendación:** sí. «¿Qué días y en qué momento podés?» se responde con una fila por día y una opción por fila:
     Temprano, Mañana, Mediodía, Tarde, Noche, Varía o No puedo. «¿Cuántos días por semana podrías reservar?» no puede
     pasar de los días marcados, y la app lo dice antes de enviar.
   - **Por qué:** hay días de mañana y días de tarde. Con la tabla, el entrenador ubica cada sesión. Con «Mixto» y un
     texto, tendría que leerlo y traducirlo a mano.
   - **Si decís que no:** se suma la opción «Mixto», con un texto que la persona completa si la elige (tu propuesta).
6. **¿Cada otra actividad dice qué días y en qué momento? (D-6)**
   - **Recomendación:** sí. Cada renglón de «Contame cuáles» suma «Qué días» (varios) y «En qué momento». Hace falta un
     tipo nuevo dentro del renglón, con varias opciones. Las APK instaladas no lo ven, como pasó con los tipos de FI-01.
   - **Por qué:** el plan pone las sesiones lejos de los días más exigentes.
   - **Si decís que no:** queda «Días por semana», sin decir cuáles.
7. **¿Menos preguntas obligatorias por defecto? (D-7)**
   - **Recomendación:** sí. En «Cómo comés hoy» hoy son 20. Quedarían 8: alergias, intolerancias y condiciones, por
     seguridad, y lo esencial para planificar (las comidas del día, las que se repiten, los alimentos que sí, los
     horarios y la actividad). El profesional sigue pudiendo marcar las que quiera.
   - **Por qué:** veinte obligatorias se sienten como un examen. En la prueba, además, no se notó que venían marcadas.
   - **Si decís que no:** quedan las 20, y la web las muestra más claras al pedir.
8. **¿Las solicitudes quedan a la vista en el escritorio? (D-8)**
   - **Recomendación:** sí, en tres lugares:
     - en la solicitud, «Cargar con la persona» va arriba, junto al estado, y no debajo de todas las preguntas;
     - «Pedir información» va en el Resumen de cada área, y no solo en «Más»;
     - la Línea de tiempo suma los formularios: pedido, respondido, cargado, confirmado o rechazado.

     La tarjeta en el Resumen («Lo que contó al empezar») va con el tablero, en WP-TABLERO-ALTA-GAMA, sin ratificar.
   - **Por qué:** hoy las respuestas solo se ven entrando por «Más» → «Pedir información» → «Solicitudes».
   - **Si decís que no:** quedan donde están.
9. **¿Qué hacemos con las preguntas que se repiten? (D-9)**
   - **Recomendación:** en esta ronda, cuando la persona ya respondió algo parecido en otro formulario, su app se lo
     muestra para que confirme o cambie («Ya lo respondiste el 5/11: ¿sigue igual?»). Las que se repiten son el sueño, la
     actividad, la medicación y el embarazo. Es solo en su teléfono y con sus propias respuestas. Al enviar, la respuesta
     es nueva y del área que la pidió, como hoy. La sección común de hábitos, que ven todos los profesionales de la
     persona, cambia quién ve qué: va al legajo legal (autorización por área) y al tablero, no a esta ronda.
   - **Por qué:** la persona no responde dos veces lo mismo, y nadie ve algo que la persona no le dio.
   - **Si decís que no:** cada formulario pregunta lo suyo, como hoy.

## 3. Las partes, si se ratifica

| ID | Qué | Toca la API | Decisión |
|---|---|---|---|
| FR-03 | Pantallas cortas en la app, con el repaso final | No | D-1 |
| FR-04 | Pantallas cortas en «Cargar con la persona», con el botón arriba | No | D-1, D-8 |
| FR-05 | Ayudas plegadas, «Quitar respuesta» y sin los minutos | No | D-2, D-3 |
| FR-06 | Versiones nuevas de las dos plantillas: embarazo sin elegir, menos obligatorias, la tabla de días y otra actividad con días. Por migración que solo agrega: la APK 0.20 sigue leyendo las suyas | Sí | D-4 a D-7 |
| FR-07 | La regla «no más días que los marcados», en el dominio y en la API | Sí | D-5 |
| FR-08 | El tipo de varias opciones dentro de un renglón, que las APK instaladas no ven | Sí | D-6 |
| FR-09 | «Pedir información» en cada área, y los formularios en la Línea de tiempo | Sí | D-8 |
| FR-10 | «Ya lo respondiste»: la persona lee sus propias respuestas de otro formulario | Sí | D-9 |
| FR-11 | La candidata 0.21.0-candidata.1, sus lecturas congeladas y la evidencia, con TalkBack | No | — |

## 4. Fuera de esta ronda

- La sección común de hábitos para todos los profesionales (D-9): legajo legal y tablero.
- La tarjeta de las respuestas en el Resumen de la ficha: WP-TABLERO-ALTA-GAMA.
