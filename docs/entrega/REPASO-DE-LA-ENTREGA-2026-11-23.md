# Repaso de la entrega · lo integrado del 21 al 22/11

> **Para Dirección.** Qué cambia en cada documento de la tesis después de DL-188 a DL-194, con el texto listo para
> pegar, las tablas y clases nuevas, las capturas que hay que rehacer y las líneas futuras.
>
> Rama `wp-repaso-entrega-23-11`, desde `main` (06221f5c). Solo documentación: no toca el código, el legajo
> (`docs/legajo/**`) ni `docs/MANIFEST.sha256`.

## 0. Dónde estamos

Del 21 al 22/11 entraron a la rama principal siete paquetes que cambian lo que la persona, el profesional y
Administración ven en pantalla. Ningún documento de la entrega los refleja todavía, y además siguen sin aplicar los
cambios del repaso del 20/11 y de la auditoría del 19/11.

**Dónde viven los documentos de la entrega.** No están en este repositorio. Los PDF están en
`BE-para-ChatGPT/entrega-tutor-final` (00, 03, 09 a 24, «Cómo probar BE» y los documentos de trabajo), con el HTML
intermedio en `_trabajo/`. Las fuentes en Markdown de 09 a 17 y de «Cómo probar BE», que estaban en la carpeta temporal
del generador, **ya no existen**: quedaron solo «11 Casos de prueba.md» y los documentos de trabajo (auditoría, repaso
del 20/11, consentimiento, empresa legal). Por eso este repaso deja **el texto de reemplazo de cada sección**, para
volcarlo cuando se rearmen las fuentes, en lugar de editar los PDF. El DER tiene su fuente en
`entrega-tutor-final/14 DER - fuente.dbml`, generada desde el esquema el 15/11 (146 tablas); no se edita a mano.

Lo que no cambió: los paquetes de este tramo no agregan casos de uso nuevos. Todo es **refinamiento** de requisitos que
ya estaban, salvo el Recetario de BE, que se puede leer como refinamiento o como un requisito propio (§1.3).

**Los paquetes.** WP-RECORRIDO-PLAN-PULIDO (DL-188: RP-01 a RP-24), WP-EVALUACION-INICIAL-2 (DL-189),
WP-ANTROPOMETRIA-METODO-Y-KERR (DL-190), WP-RECETARIO-E-IMAGENES (DL-191), WP-RPE-Y-MAXIMO-ESTIMADO (DL-192),
WP-SIN-ASISTENTE-DE-NUTRICION (DL-193) y WP-APP-0-32 (DL-194), todos en `docs/paquetes/`.

## 1. Requisitos refinados

> Con la regla del 19/11: un objetivo nuevo del actor es un caso de uso; una capacidad que ningún RF pedía es un
> requisito; el resto, refinamiento. Cada fila trae el texto para la columna «Cómo lo resuelve BE» del 12 (website) o
> del 13 (app), en presente y sin versiones. Donde dice «se suma», va al final del texto que ya tiene el RF.

### 1.1 Documento 12 · RF y RNF Web

| RF | DL | Requisitos refinados · texto para «Cómo lo resuelve BE» |
|---|---|---|
| **RF-026** Registrar la evaluación nutricional | DL-189 | Se reemplaza el texto: «Al empezar el plan, la evaluación se arma en tres bloques: "Lo que contó" la persona (los formularios que respondió, que quedan vinculados a la evaluación sin copiar ninguna respuesta), "Lo medido" (la última toma de Antropometría que el profesional puede usar) y "Lo que necesita el cálculo" (edad, sexo, peso, talla y nivel de actividad, cada uno con su origen y su fecha). La fecha es la del momento en que se registra y se puede cambiar para una evaluación hecha antes. "Anotaciones" es un espacio libre y privado del profesional: la persona no lo ve. Distingue lo que informa la persona, lo que observa el profesional y lo que se calcula. Funciona en: website.» |
| **RF-036** Registrar la evaluación de entrenamiento | DL-189 | Se suma: «La misma fecha automática y las mismas "Anotaciones" privadas que en Nutrición.» |
| **RF-071** Pedir y completar información | DL-189 | Se suma: «Desde la evaluación, "Completarlo ahora con" la persona crea el pedido y abre la carga en el mismo lugar, con lo necesario para planificar primero y el resto a pedido; al terminar, vuelve a la evaluación con lo cargado, que la persona confirma desde la app. Si la persona corrige algo, la evaluación lo dice.» |
| **RF-029** Definir el objetivo nutricional (y RF-073 si se ratifica el calculador del 20/11) | DL-188 | Se suma: «"Calcular" propone el objetivo con un método publicado: usa la toma de Antropometría con un toque o los datos cargados a mano, muestra la fórmula y la cuenta, y deja lo largo y la fuente detrás de "?" y "Fuente". El ajuste se elige como "Mantener", "Déficit" o "Superávit", sin signos; proteína y grasa van en g/kg con su mínimo, su máximo y su paso. Entre los métodos están las dos ecuaciones de ten Haaf y Weijs (2014) para personas que entrenan. "Usar estos valores en el objetivo" los lleva al formulario; el profesional decide.» |
| **RF-030** Armar el plan nutricional en borrador | DL-188 · DL-193 | Se reemplaza el texto: «El plan se empieza en la vista del plan: "Crear nuevo plan", "Nueva versión del plan" (copia la activa), "Empezar en blanco" o "Empezar desde una plantilla", y se arma en un solo editor. Cada día tipo muestra su "Reparto por comida": la parte del día de cada comida (en % de las kcal del día, que suman 100) y el rango que resulta en kcal, proteínas, carbohidratos y grasas. Cada comida muestra una franja por macro con el rango indicado y el promedio de sus opciones, y las opciones que se tildan, cada una en su color, se mueven en tiempo real al cambiar un alimento; la franja ubica y no califica. "Rangos y totales" resume el día y cada comida. El objetivo del día dice su versión y desde cuándo rige; si hay uno más nuevo, "Usarla ahora" lo toma. Una opción que es una receta muestra su imagen y la deja cargar o cambiar ahí mismo. El borrador se guarda solo y dice si el cambio ya está en el servidor; la persona no lo ve. Un borrador se puede descartar. Funciona en: website.» |
| **RF-027** Tener un catálogo propio de alimentos | DL-191 | Se suma: «En "Recetas", dos pestañas: "Mis recetas" y el "Recetario de BE", recetas de cocina familiar para todos los profesionales de Nutrición, de solo lectura, que se usan tal cual como opción del plan o se copian a "Mis recetas" para adaptarlas.» (Ver §1.3 sobre el Recetario.) |
| **RF-072** Lo propio y el canon (propuesto el 19/11) | DL-191 | Se suma: «Un profesional puede "Proponer al Recetario de BE" una receta suya; si tiene foto, acepta antes la cesión de la foto, y BE guarda qué texto aceptó y cuándo. Administración ve cada propuesta con su autor y las recetas parecidas, y la suma o no, con un motivo opcional que ve quien la propuso.» |
| **RF-040** Indicar ejercicios, series y parámetros | DL-192 · DL-188 | Se suma: «El profesional elige "Cómo se escribe el esfuerzo": RIR (repeticiones en reserva) o RPE (de 6 a 10, la escala basada en RIR: RPE = 10 − RIR, de a medio punto, con "6 o menos" como la opción más baja). Es la misma medida escrita de dos formas: BE guarda siempre el RIR, y el historial, los gráficos y lo que ven otros profesionales no cambian. Las repeticiones, el descanso y la carga tienen su mínimo, su máximo y su paso, y lo que no se entiende se marca en su celda sin correr la tabla.» |
| **RF-045** Analizar lo registrado antes de revisar | DL-192 | Se suma: «Con el plan en RPE, lo indicado, lo registrado y la fuerza estimada se leen en RPE. Cada estimación dice con qué serie salió ("estimado con 5 reps a RPE 8 · 100 kg"); BE estima solo con series de RPE 8 a 10 (RIR 0 a 2), y la estimación nunca se presenta como un máximo probado.» |
| **RF-047** Registrar una toma antropométrica | DL-190 | Se suma: «Antes de medir, "Qué vas a calcular": uno o varios métodos, o un conjunto de un toque ("Kerr (1988), cinco componentes", "Somatotipo de Heath y Carter"). La figura y la lista piden solo lo que necesitan esos métodos, más peso, talla y edad; vienen elegidos los de la última toma del profesional, "+ Otra medición" suma un punto suelto y lo que ya tiene dato nunca se esconde. Al elegir Jackson y Pollock, BE dice dónde toma el suprailíaco.» |
| **RF-048** Calcular resultados reproducibles | DL-190 | Se suma: «El catálogo incluye el fraccionamiento de Kerr (1988) en cinco masas (piel, adiposa, muscular, ósea y residual), cada una con su fuente y su población. La toma muestra el peso de la balanza, las cinco masas, su suma (el "Peso estructurado") y la diferencia con el peso medido, en kg y en % del peso medido, que es como Kerr valida el modelo.» |
| **RF-070** Usar métodos de cálculo reproducibles | DL-190 · DL-188 | Se suma: «Los métodos se eligen antes de medir; el catálogo suma Kerr (1988) y las ecuaciones de ten Haaf y Weijs (2014), cada uno con su fuente, su población y para quién sirve.» |

**RNF del 12, refinados:**

| RNF | DL | Requisitos refinados |
|---|---|---|
| **RNF-ACC-003** Adaptado a cada pantalla | DL-188 (RP-19, RP-24) | Se suma: «Con un error, nada cambia de lugar: cada aviso tiene su renglón reservado. Las acciones son botones discretos y el subrayado queda para lo que lleva a otro lado. La ayuda de cada sección va en un "?" en su esquina superior derecha y lo que explica flota, sin correr lo que se está editando; se cierra con Escape.» |
| **RNF-ACC-001** Accesibilidad en los recorridos núcleo | DL-188 · DL-189 | Se suma: «Cada cantidad lleva su ícono, su número y su abreviatura ("2.500 kcal", "112 g P"), y el lector de pantalla oye el nombre completo; las franjas por comida se leen como texto, opción por opción.» Mantener lo que se probó: la prueba con lector de pantalla de estas pantallas sigue pendiente (§8). |
| **RNF-PERF** (en el 12 solo está RNF-PERF-003; va como texto de rendimiento del website) | DL-191 | Se suma donde corresponda: «La imagen de una receta se guarda en dos medidas livianas (una grande para el detalle y una miniatura para listas y tarjetas) y cada lugar pide la que necesita; el website achica la foto antes de subirla y una misma foto del mismo profesional se guarda una sola vez.» |
| **RNF-PRI-001** Pedir y guardar solo lo pertinente | DL-189 | Se suma: «Las "Anotaciones" de la evaluación son del profesional: ninguna lectura de la persona las trae.» |
| **RNF-SEC-005** Auditoría de lo sensible | DL-191 | Se suma: «La cesión de la foto de una receta propuesta queda registrada con el texto aceptado, su huella y el momento; las decisiones de Administración, con su autor.» |

**La cabecera de las áreas (RP-01).** No es un requisito: es cómo se ve. Va en la descripción del website del 12
(§1.1): «Cada área se abre con una franja: la vuelta como botón ("Espacio profesional" o la ficha de la persona), el
área, la persona y su acceso. Al volver a la pestaña, BE se fija solo si hay algo nuevo y lo dice con "Hay datos
nuevos · Ver".» Hay que **sacar** «Actualizar» y «Consultado a las» de la ficha y de las áreas en todos los documentos
(ver §4).

### 1.2 Documento 13 · RF y RNF Mobile

| RF | DL | Requisitos refinados · texto para «En la app» |
|---|---|---|
| **RF-032** Ver qué toca comer hoy | DL-194 | Se reemplaza la frase del carrusel: «…cada una con sus opciones y sus recetas, que se pasan como un carrusel: deslizando, se detienen de a una y enteras, o con las flechas de arriba, que dicen "Opción n de m" y tienen los puntitos debajo. Cada opción muestra su foto grande a todo el ancho o, sin foto, la miniatura del plato al lado del nombre, y los macros con su ícono, su número y su abreviatura, como en el website. El nombre de la pantalla queda en la cabecera, para que la foto, los macros y "Comí algo diferente" entren sin desplazar.» |
| **RF-033** Registrar lo que comió | DL-194 · DL-191 | Se suma: «La foto se achica en el teléfono antes de subirla.» |
| **RF-042** Ver qué toca entrenar hoy | DL-194 | Se suma: «"Entrenamiento" queda en la cabecera.» |
| **RF-043** Registrar la sesión y sus series | DL-192 · DL-194 | Se suma: «Si el profesional indicó el plan en RPE, la app pregunta el esfuerzo en RPE, eligiendo de una lista (de 10 a 6,5 y "6 o menos"), y muestra lo indicado y lo registrado así; lo que guarda sigue siendo el RIR.» |
| **RF-048** y **RF-049** (Antropometría) | DL-190 | Se suma: «En "Mi evolución", las mediciones de Kerr y sus cinco masas se ven con su nombre y su método.» |

**RNF del 13:** en **RNF-PERF-002** (respuesta percibida) se suma «cada imagen pide la medida que necesita su marco:
la miniatura donde es chica y la grande a todo el ancho». En **RNF-ACC** (accesibilidad de la app) se suma «TalkBack
anuncia "Opción n de m" una vez al cambiar y lee el título de la cabecera como encabezado; los macros se leen con su
nombre completo».

### 1.3 El Recetario de BE: refinamiento o requisito propio

- **Elegí refinamiento** (RF-027 para el recetario y RF-072 para proponer y decidir), porque sigue el mismo patrón del
  canon de alimentos del 19/11: lo propio es de cada profesional y Administración suma lo curado.
- **Alternativa:** un **RF-074 «Compartir recetas curadas»** con su caso de uso de Administración. Vende más (es una
  biblioteca común que crece con los profesionales), pero suma un ID y su ficha en el 10, que hay que escribir.
- **A qué prestar atención:** la cesión de la foto está pendiente de revisión legal (lo anota DL-191). En la tesis se
  dice qué hace el sistema (registra la aceptación) sin afirmar su validez legal.

### 1.4 Documento 10 · Casos de uso

| UC | DL | Qué cambia |
|---|---|---|
| **UC-P10** Diseñar el plan nutricional | DL-193 · DL-188 | En el recorrido, «Crea el borrador en blanco, desde una plantilla o con el asistente» pasa a «Crea el borrador desde la vista del plan: en blanco, copiando la versión activa o desde una plantilla». Se suma un paso: «Mira el reparto por comida y la franja de cada comida, con el promedio de sus opciones». En el último paso, «la pestaña "Patrones" de la estación muestra lo registrado con el objetivo de cada temporada de fondo» pasa a «la pestaña "Patrones" del editor muestra lo registrado con el objetivo de cada período de fondo». |
| **UC-P09** y **UC-P14** Registrar la evaluación y el objetivo | DL-189 · DL-188 | El recorrido arranca por la franja de los pasos («Evaluación › Objetivo › Plan»); la evaluación con sus tres bloques y «Anotaciones»; la extensión «Completarlo ahora con» la persona, que incluye UC-P32 y UC-P33 en el mismo lugar; en UC-P09, «Calcular» (UC-E10 si se ratifica el 20/11). |
| **UC-P15** Diseñar el plan de entrenamiento | DL-192 | Se suma: «Elige cómo se escribe el esfuerzo (RIR o RPE)». El asistente de Entrenamiento se queda. |
| **UC-P17** Ver y registrar la sesión | DL-192 · DL-194 | Se suma: «Responde el esfuerzo en la notación del plan». |
| **UC-P19** Registrar una toma | DL-190 | El primer paso es «Elige qué va a calcular»; la toma pide solo lo que necesitan esos métodos. |
| **UC-P36** (alimentos y canon, propuesto el 19/11) | DL-191 | Si se elige refinamiento (§1.3), se le suma la propuesta de una receta al Recetario de BE y la decisión de Administración. |

### 1.5 Documento 11 · Casos de prueba

Para numerar después de CP-91 (o CP-92 con DL-185), cada uno con su prueba ya en la rama principal:

| CP | Qué prueba | Pruebas |
|---|---|---|
| CP-93 | La evaluación inicial: los tres bloques, la fecha automática y las «Anotaciones», que la persona no ve en ninguna lectura suya | TEST-EVI-010 (contra PostgreSQL) y las pruebas del dominio de `evaluacion-inicial` |
| CP-94 | Kerr (1988): las cinco masas reproducen la fuente, y la suma se compara con el peso medido | Las pruebas de `fraccionamiento-de-kerr` |
| CP-95 | Elegir los métodos antes de medir: la unión de lo que piden, el método habitual y lo que ya tiene dato | Las pruebas de `metodos-de-la-toma` y de API-MHA-01 |
| CP-96 | El RPE: la conversión ida y vuelta, «6 o menos», la estimación solo de RPE 8 a 10 y la app publicada que sigue registrando en RIR | TEST-RPE-001 a 012, 020 a 025, 030 y 040 a 045 |
| CP-97 | El Recetario de BE: copiar, proponer con la cesión, la decisión única de Administración y lo que la base no deja escribir | Las pruebas de integración del recetario y de las propuestas |
| CP-98 | Las imágenes livianas: las dos medidas, la copia única por huella y los medios de antes | Las pruebas de `procesamiento-de-imagen` y de medios |
| CP-99 | El plan de Nutrición sin el asistente: los cuatro puntos de partida y la dirección vieja que abre la vista del plan | Las pruebas del website de DL-193 |
| CP-100 | Las franjas por comida y el reparto: la escala, el promedio, las opciones tildadas y la suma de las partes | Las pruebas de `franjas-por-comida` y `propuesta-de-rangos` |

**A qué prestar atención:** los nombres exactos de los archivos de prueba se confirman al congelar, con la corrida
final de la CI; acá van por módulo.

## 2. DER (documento 14)

### 2.1 Lo que agregan las migraciones del 21 y el 22/11

| Migración | Qué agrega a la base |
|---|---|
| `20261121150000_kerr_cinco_componentes` | **Ninguna tabla.** Seis métodos del catálogo (filas en `especificacion_antropometrica` y su versión 1 en `version_de_especificacion_antropometrica`): la piel de Kerr para hombres y para mujeres, y las masas adiposa, muscular, ósea y residual. Las siete mediciones nuevas viven en el catálogo de mediciones del dominio, no en una versión nueva del protocolo, para no cortar la comparabilidad de las tomas anteriores. |
| `20261122120000_recetario_e_imagenes` | **Cinco tablas, dos conjuntos de valores**, dos columnas que admiten vacío, un índice y las garantías en la base (ver §2.2). |

**Lo que no es tabla:**
- **`effortNotation`** (DL-192) vive dentro del contenido de la versión del plan de entrenamiento (JSONB), solo cuando es
  RPE, y se congela con la instantánea al activar. Va en el diccionario de datos, en la nota de
  `version_de_plan_de_entrenamiento`: «El contenido puede declarar la notación del esfuerzo (RPE); lo guardado en cada
  serie es siempre el RIR».
- **El método habitual** (API-MHA-01, DL-190) se lee de las corridas de cálculo de la última toma del profesional: no
  guarda nada.
- **DL-188, DL-189, DL-193 y DL-194** no tienen migraciones. Las «Anotaciones» de la evaluación son el campo
  `professionalNotes` de la evaluación que ya existía (hasta 4000 caracteres; EI-D06): en el diccionario, sumar a su nota
  que ninguna lectura de la persona lo devuelve.

### 2.2 Las tablas nuevas, para el módulo «06 · Recetas, fotos y registro de comidas»

En el estilo de la fuente DBML de la entrega (mismo color del módulo). Se vuelcan cuando se regenere la fuente desde
`prisma/schema.prisma`; mientras tanto, sirven para la lámina del módulo 06 y el diccionario.

```dbml
Table variante_de_medio [headercolor: #8A6A12] {
  medio_id uuid [not null, note: 'El medio del que es variante.']
  variante VarianteDeMedio [not null, note: 'Miniatura o grande.']
  tipo text [not null, note: 'Siempre image/webp.']
  bytes integer [not null, note: 'El tamaño, que coincide con el contenido.']
  ancho integer [not null]
  alto integer [not null]
  sha256 text [not null, note: 'La huella del contenido.']
  contenido bytea [not null]
  momento_de_registro timestamptz(3) [not null, default: `now()`, note: 'Cuándo BE guardó la fila.']

  indexes {
    (medio_id, variante) [pk]
  }

  Note: 'Las medidas livianas de la imagen de una receta, armadas la primera vez que se piden. No se reescriben; se borran solo al suprimir el medio.'
}

Table receta_del_recetario [headercolor: #8A6A12] {
  receta_id uuid [pk, note: 'La receta, sin profesional.']
  propuesta_id uuid [unique, note: 'La propuesta de la que salió, si la sumó Administración.']
  administrador_id uuid [note: 'Quién la sumó, con su rol vigente.']
  clave_de_semilla text [unique, note: 'La clave editorial, si la sembró BE.']
  procedencia jsonb [not null, note: 'De dónde vino la fila.']
  momento_de_registro timestamptz(3) [not null, default: `now()`, note: 'Cuándo BE guardó la fila.']

  Note: 'Una receta del Recetario de BE: la suma un administrador desde una propuesta o la siembra BE. Solo se agrega.'
}

Table copia_de_receta_del_recetario [headercolor: #8A6A12] {
  receta_id uuid [pk, note: 'La receta propia que salió de la copia.']
  origen_id uuid [not null, note: 'La receta del recetario que se copió.']
  procedencia jsonb [not null, note: 'De dónde vino la fila.']
  momento_de_registro timestamptz(3) [not null, default: `now()`, note: 'Cuándo BE guardó la fila.']

  indexes {
    origen_id
  }

  Note: 'De qué receta del recetario sale una receta propia. La copia reusa la misma imagen, sin duplicarla. Solo se agrega.'
}

Table propuesta_al_recetario [headercolor: #8A6A12] {
  id uuid [pk, default: `gen_random_uuid()`, note: 'Identificador único de la fila.']
  receta_id uuid [not null, note: 'La receta propia que se propone.']
  version_de_receta_id uuid [not null, note: 'La versión que se propone.']
  profesional_id uuid [not null, note: 'Quien la propone, dueño de la receta.']
  medio_id uuid [note: 'La imagen, si la tiene.']
  version_de_la_cesion text [note: 'La versión del texto de la cesión aceptado.']
  huella_de_la_cesion text [note: 'El SHA-256 del texto aceptado.']
  momento_de_la_cesion timestamptz(3) [note: 'Cuándo se aceptó.']
  procedencia jsonb [not null, note: 'De dónde vino la fila.']
  momento_de_registro timestamptz(3) [not null, default: `now()`, note: 'Cuándo BE guardó la fila.']

  indexes {
    (receta_id, momento_de_registro)
  }

  Note: 'Un profesional ofrece una versión de una receta suya. Con imagen, la cesión está completa; sin imagen, no hay cesión. Solo se agrega.'
}

Table decision_sobre_propuesta_al_recetario [headercolor: #8A6A12] {
  propuesta_id uuid [pk, note: 'La propuesta decidida, una sola vez.']
  resultado ResultadoDePropuestaAlRecetario [not null, note: 'Sumada o rechazada.']
  motivo text [note: 'Opcional, de 1 a 300 caracteres; lo ve quien la propuso.']
  administrador_id uuid [not null, note: 'Quién decidió, con su rol vigente.']
  procedencia jsonb [not null, note: 'De dónde vino la fila.']
  momento_de_registro timestamptz(3) [not null, default: `now()`, note: 'Cuándo BE guardó la fila.']

  Note: 'Lo que decide Administración. Sumada, con la receta ya en el recetario; rechazada, sin ella. Solo se agrega.'
}

Ref: variante_de_medio.medio_id > medio.id
Ref: receta_del_recetario.receta_id - receta.id
Ref: receta_del_recetario.propuesta_id - propuesta_al_recetario.id
Ref: receta_del_recetario.administrador_id > identidad.id
Ref: copia_de_receta_del_recetario.receta_id - receta.id
Ref: copia_de_receta_del_recetario.origen_id > receta.id
Ref: propuesta_al_recetario.receta_id > receta.id
Ref: propuesta_al_recetario.version_de_receta_id > version_de_receta.id
Ref: propuesta_al_recetario.profesional_id > identidad.id
Ref: propuesta_al_recetario.medio_id > medio.id
Ref: decision_sobre_propuesta_al_recetario.propuesta_id - propuesta_al_recetario.id
Ref: decision_sobre_propuesta_al_recetario.administrador_id > identidad.id

Enum VarianteDeMedio {
  MINIATURA
  GRANDE
}

Enum ResultadoDePropuestaAlRecetario {
  SUMADA
  RECHAZADA
}
```

**Cambios en tablas que ya estaban:**
- `receta.profesional_id` admite vacío: una receta sin profesional es del Recetario de BE (lo garantiza la base al
  confirmar). La nota de la tabla pasa a «Una receta propia del profesional o, sin profesional, del Recetario de BE».
- `version_de_receta.autor_id` admite vacío solo en una receta del recetario sembrada por BE.
- `medio`: un índice nuevo por `(propietario_id, sha256_original)`, para guardar una sola copia por huella.
- La imagen de una receta puede ser, además de un medio propio, la imagen de una receta del recetario (la copia la
  reusa). Va en la regla del módulo 06.

**Para «Dónde se cumplen las reglas» (§3 del 14):** las cinco tablas nuevas solo agregan (no admiten cambios, borrados
ni TRUNCATE); la variante solo se borra al suprimir su medio; lo que suma o decide Administración exige el rol vigente.

### 2.3 Lo que sigue pendiente del 20/11

Las tablas de las migraciones del 20/11 tampoco están en el DER de la entrega: `alimento_del_canon`,
`medidas_caseras_de_alimento`, `conjunto_de_graficos`, `eleccion_de_conjunto_de_graficos`,
`calculo_del_objetivo_nutricional` y `vinculo_de_formulario_en_evaluacion`. Lo más limpio es **regenerar la fuente
DBML entera** desde el esquema, y no sumar tablas a mano.

### 2.4 Las cifras, contadas de nuevo

Rama principal del 23/11 (06221f5c), con el mismo método del repaso del 20/11:

| Cifra | Cómo se cuenta | 20/11 (89091c8f) | **23/11** |
|---|---|--:|--:|
| Tablas | `model` de `prisma/schema.prisma` | 157 | **163** |
| Claves foráneas | Relaciones con `fields:` | 310 | **326** |
| Conjuntos de valores | `enum` | 106 | **108** |
| Migraciones | Carpetas de `prisma/migrations` | 99 | **102** |
| Operaciones del contrato | Operaciones de `docs/api/openapi.json` | 325 | **335** |
| Módulos de la API | `*.module.ts`, sin el raíz | 33 | **34** |
| Controladores | Archivos con `@Controller` | 46 | **46** (47 decoradores) |
| Clases inyectables | `@Injectable()` | 115 | **119** |
| Páginas del website | `page.tsx` de `apps/web` | 37 | **38** |
| Archivos de prueba | `.test`, `.spec` e `.int-spec` | 390 | **414** |

Los casos automáticos se toman de la corrida final de la CI, al congelar. El DER de la entrega todavía dice 146 tablas,
280 claves foráneas y 102 conjuntos de valores (los del 15/11).

## 3. Diagrama de clases (documento 15)

Para el Anexo A (persistencia) y el Anexo B (clases de la API, módulo por módulo):

| Dónde | Qué se suma | DL |
|---|---|---|
| API · Nutrición | `PropuestasAlRecetarioService` (proponer, leer las propuestas con su autor y sus parecidas, y decidir); `RecetasService` suma el Recetario de BE (listar con las rutas firmadas, copiar a Mis recetas). El comando de la semilla del recetario (`comando-del-recetario`, `semilla-del-recetario`) es una herramienta, no una clase del servicio. | DL-191 |
| API · Medios | `procesamiento-de-imagen` (las dos medidas WebP) y la lectura por variante en el servicio de medios; la copia única por huella. | DL-191 |
| API · Antropometría | El servicio de métodos suma `habituales` (API-MHA-01) y el controlador de Antropometría, su ruta. | DL-190 |
| API · Administración | El controlador suma API-RCT-04 y API-RCT-05, con la sesión con segundo factor. | DL-191 |
| Dominio (`packages/domain`) | `evaluacion-inicial` (los tres bloques, el origen de cada dato y lo crítico primero), `fraccionamiento-de-kerr`, `metodos-de-la-toma`, `notacion-del-esfuerzo` (RIR y RPE), `recetario` y `contratos-recetario`. Son funciones puras: el website, la app y el servidor usan la misma. | DL-189 · DL-190 · DL-191 · DL-192 |
| Persistencia | Las cinco entidades de §2.2: `VarianteGuardadaDeMedio`, `RecetaDelRecetario`, `CopiaDeRecetaDelRecetario`, `PropuestaAlRecetario` y `DecisionSobrePropuestaAlRecetario`. | DL-191 |

**Documento 17 · Componentes:** en el website, el Recetario de BE (`/pro/recipes`, segunda pestaña) y las propuestas
de Administración (`/admin/recipes`, página nueva: 38 páginas); en el editor de Nutrición, las franjas por comida y el
reparto; en la app, el carrusel de opciones, el título fijo en la cabecera, el selector de RPE y el achicado de la foto.
Sale el asistente de Nutrición; el armazón común de los asistentes queda para Entrenamiento.

**Documento 16 · Arquitectura:** una línea que suma al argumento de diseño de la «misma función en todos lados»: la
conversión RIR ↔ RPE y las cuentas de Kerr son del dominio, y lo guardado es siempre una sola medida (el RIR), así que
cambiar la notación nunca reescribe historia.

## 4. Manuales y guía

### 4.1 Documento 09 · Manual del profesional

| Sección | Qué cambiar | Texto de reemplazo o a sumar |
|---|---|---|
| **2.2 La evaluación y el objetivo** | «Son tres pasos, en orden» y «"Registrar la evaluación": la "Fecha y hora de la evaluación" y los "Datos de la evaluación", cada uno con su valor, su unidad, su fuente y su método» | «Con el área vacía, en la ficha, "Empezar el plan". Arriba, una franja con los tres pasos: "Evaluación", "Objetivo" y "Plan", cada uno con su estado ("Ahora", "Después" o la fecha en que quedó listo); debajo, solo el paso actual. La evaluación lleva la fecha y la hora de ahora ("Hoy, 12:12 · cambiar"); "cambiar" es para una evaluación hecha antes. En Nutrición se arma en tres bloques: "Lo que contó" la persona, con sus formularios respondidos; "Lo medido", con la última toma de Antropometría que podés usar y "Ver toma"; y "Lo que necesita el cálculo", con edad, sexo, peso, talla y nivel de actividad, cada uno con su origen y su fecha. Si falta lo que contó, "Completarlo ahora con" la persona abre la carga en el mismo lugar, con "Primero lo necesario para planificar" y "Cargar también el resto"; al terminar, vuelve a la evaluación. "Enviárselo" lo pide a la app, como "Pedir información". "Anotaciones" es tuyo: la persona no lo ve.» |
| **2.2** · el objetivo de Nutrición | Sumar el calculador | «"Calcular": "Usar la toma del" día de la toma o "Cargar a mano"; elegir el método (cada uno dice para quién sirve; "De dónde sale" y "Fuente" muestran la fórmula y la cita), el ajuste ("Mantener", "Déficit" o "Superávit") y los g/kg de proteína y grasa. "Usar estos valores en el objetivo" los lleva al formulario: BE propone, vos decidís.» |
| **2.3 Armar el plan de nutrición** | **Sacar el asistente:** «También se puede "Armar con el asistente", en siete pasos: …» | «En "Plan", empezar la versión: "Crear nuevo plan" (sin plan activo), "Nueva versión del plan" (copia la activa), "Empezar en blanco" (con una activa, sin copiarla) o "Empezar desde una plantilla". Todo se arma en el mismo editor.» |
| **2.3** · el armado | Sumar el reparto, las franjas y la imagen | «En cada día tipo, el "Reparto por comida": la "Parte del día" de cada comida (en % de las kcal del día, que suman 100) y el rango que resulta en kcal, proteínas, carbohidratos y grasas; solo llena lo vacío o pide confirmar. Cada comida muestra, aunque esté plegada, una franja por macro: la banda es el rango indicado y la raya, el promedio de sus opciones. Al abrir la comida, cada opción tiene una casilla y un punto de color: tildada, su punto aparece en las cuatro franjas, lleno si queda adentro del rango y hueco si queda afuera. Todo se mueve al cambiar una cantidad. Una opción que es una receta muestra su miniatura y, abierta, "Cargar la imagen" o "Cambiar la imagen": la imagen es de la receta y cambia en todos los lugares que la usan. Al costado, "Rangos y totales": el día arriba y cada comida debajo, con sus íconos. El objetivo del día dice su versión y desde cuándo rige; si hay uno más nuevo, "Usarla ahora".» |
| **2.3** · figura 7 | Rehacer (ver §5) | Pie nuevo: «El editor del plan de Nutrición: la versión en preparación, el reparto por comida del día tipo, las franjas de cada comida y "Rangos y totales". Captura del website.» |
| **2.4 Armar las sesiones de entrenamiento** | El asistente de Entrenamiento **se queda**. Sumar la notación y los límites | «Al pie de las sesiones, "Cómo se escribe el esfuerzo": "RIR (repeticiones en reserva)" o "RPE (esfuerzo de 6 a 10)". Es la misma medida escrita de dos formas (RPE = 10 − RIR); la persona responde y ve todo así, y BE guarda siempre el RIR. Las repeticiones, el descanso y la carga tienen su mínimo, su máximo y su paso: con ↑ y ↓ suman o restan una repetición, 15 segundos o 2,5 kg. Lo que no se entiende se marca en su celda y un renglón debajo de la tabla dice qué corregir. Cómo se lee la tabla va detrás del "?".» La prescripción de ejemplo («4×8-12 RIR 2 · 60 kg · 90 s») se queda: la escritura rápida entiende el RIR. |
| **2.4** · «Lo que se ve» | «BE estima solo con series de RIR 0 a 2» (está en 4.1) | «BE estima solo con series de RIR 0 a 2 (RPE 8 a 10). Cada estimación dice con qué serie salió: "estimado con 5 reps a RPE 8 · 100 kg".» |
| **3.2** «Si pasa esto» y **7 · Si algo falla** | «"Actualizar" en la ficha» y «"Actualizar", arriba de la ficha: al lado dice "Consultado a las"» | «Al volver a la pestaña, BE se fija solo si hay algo nuevo: "Hay datos nuevos · Ver".» Revisar en pantalla el «Actualizar» al pie de «Te toca a vos» (1.2): el código de la ficha y de las áreas ya no lo tiene. |
| **3.4 Cargar una toma de antropometría** | Elegir el método antes de medir y Kerr | Después de «Datos de la toma»: «En "Qué vas a calcular", "Elegir métodos": uno o varios, o un conjunto de un toque ("Kerr (1988), cinco componentes" o "Somatotipo de Heath y Carter"). La figura y la lista marcan solo lo que piden, más peso, talla y edad; vienen elegidos los de tu última toma, "+ Otra medición" suma un punto suelto y lo que ya tiene dato nunca se esconde.» Y en «Lo que se ve»: «Con Kerr, un cuadro con el peso de la balanza, las cinco masas, el "Peso estructurado" (su suma) y la diferencia con el peso medido, en kg y en % del peso medido.» |
| **6.1 Plantillas, recetas y ejercicios propios** | La fila «"Mis recetas"» | «"Recetas": "Mis recetas" ("Nueva receta", con su imagen) y el "Recetario de BE", recetas para todos los profesionales de Nutrición que se usan tal cual como opción o se copian con "Copiar a Mis recetas". Una receta propia se puede "Proponer al Recetario de BE": si tiene foto, "Leí y acepto la cesión de la foto"; Administración la suma o no.» Y en «Si pasa esto»: «"Tiene un alimento que cargaste a mano: para proponerla, cambialo por uno del catálogo verificado."». |
| **Todo el manual** | La ayuda de cada sección | Donde se nombre un «?», decir que está en la esquina superior derecha de la sección y que se cierra con Escape. |

### 4.2 Manual de la persona (no existe todavía)

El repaso del 20/11 lo marcó como imprescindible. Con lo de este tramo, estas secciones tienen que entrar:

- **Nutrición · Hoy:** el carrusel de opciones, con el gesto y con las flechas («Opción n de m» y los puntitos); la
  foto grande o la miniatura; los macros con ícono, número y abreviatura; «Ver detalle», «Comí esta opción» y «Comí
  algo diferente», con la foto que se achica sola.
- **El título en la cabecera:** «Nutrición» y «Entrenamiento» quedan arriba, entre el logo y la campana.
- **Entrenamiento:** si el plan está en RPE, el esfuerzo se elige de una lista (de 10 a 6,5 y «6 o menos») y todo se
  lee en RPE. Una línea que lo explique en criollo: «RPE 8: creés que te quedaban 2 repeticiones».
- **Mi evolución:** las mediciones de Kerr y sus cinco masas, con su nombre y su método, siempre como estimación.
- **Para responder:** lo que el profesional cargó con vos en la consulta («Completarlo ahora») llega para confirmarlo
  o corregirlo.

### 4.3 Manual de Administración (no existe todavía)

Sumar una sección **«Propuestas al Recetario de BE»**: en el menú, «Propuestas al Recetario de BE» («Sumar al
recetario las recetas que propusieron los profesionales»); cada propuesta con su autor, la receta, la cesión de la foto
y las «Parecidas»; «Sumar al Recetario de BE» o «No sumarla», con un «Motivo (opcional, lo ve quien la propuso)». Si
otro administrador ya la decidió: «Esta propuesta ya se decidió (quizás desde otra pestaña)…».

### 4.4 Manual del tutor · «Cómo probar BE»

- **§3 El profesional, en el website** y **§5.3 Activar un plan:** sumar un paso corto por el Recetario de BE y por el
  editor de Nutrición (reparto por comida, franjas, «Usarla ahora»), y en Entrenamiento elegir RPE y ver que la app
  pregunta así.
- **§2.2 El recorrido corto (la app):** «abrir una comida del plan de hoy, elegir una de sus opciones» pasa a
  «abrir una comida del plan de hoy, pasar sus opciones con las flechas o deslizando y tocar "Comí esta opción"».
- **«Si algo falla»:** sacar «En el website, "Actualizar"»; va «En el website, al volver a la pestaña aparece "Hay datos
  nuevos · Ver"».
- Lo del 20/11 sigue: reescribirlo sobre la muestra del tutor y sin el autenticador del profesional.

### 4.5 Documentos 00 y 03

- **00 · Resumen y guía y 03 · Acta, «Alcance»:** en la fila del plan de nutrición, el reparto por comida y las franjas;
  en la de Antropometría, «elegir el método antes de medir» y Kerr (1988); en la de Entrenamiento, el RPE como segunda
  notación; y una fila corta para el Recetario de BE. Las cifras, de §2.4.
- **Líneas futuras:** ver §6.

## 5. Capturas a rehacer

No se rehicieron. Las de la app necesitan la APK con DL-194 armada y publicada; las del website, la muestra del tutor
cargada en test (o la herramienta de capturas de la CI).

| # | Documento y figura | Qué tiene que mostrar ahora | Por qué |
|--:|---|---|---|
| 1 | 09 · Figura 6 (el «Resumen» de Nutrición) | La cabecera en una franja, sin «Actualizar» ni «Consultado a las» | DL-188 (RP-01) |
| 2 | 09 · nueva, en 2.2 | La franja de los pasos y la evaluación en tres bloques, con «Anotaciones» y «Completarlo ahora con» | DL-189 |
| 3 | 09 · nueva, en 2.2 | «Calcular» con la toma, el método, el ajuste sin signo y «Usar estos valores en el objetivo» | DL-188 (RP-05, RP-09) |
| 4 | 09 · Figura 7 (el editor del plan de Nutrición) | Sin el asistente; el reparto por comida, las franjas con una opción tildada y «Rangos y totales» con íconos | DL-188 · DL-193 |
| 5 | 09 · Figura 8 y 9 (agregar ejercicio, «La vez pasada») | El catálogo más ancho y, si el plan está en RPE, «La vez pasada» en RPE | DL-188 (RP-22) · DL-192 |
| 6 | 09 · nueva, en 2.4 | «Cómo se escribe el esfuerzo» con RPE elegido y la tabla de series sin saltos | DL-192 · DL-188 |
| 7 | 09 · Figura 10 («Antes de activar» de Entrenamiento) | El cambio de notación («Cómo se escribe el esfuerzo: RIR → RPE») si aplica | DL-192 |
| 8 | 09 · Figura 15 y nueva en 3.4 | «Qué vas a calcular» y el cuadro de Kerr con el «Peso estructurado» | DL-190 |
| 9 | 09 · Figura 16 (1RM estimado) | El renglón «estimado con N reps a RPE X» | DL-192 |
| 10 | 09 · nueva, en 6.1 | «Recetas» con «Mis recetas» y «Recetario de BE», y el cuadro de «Proponer al Recetario de BE» | DL-191 |
| 11 | 12 · Figura 3 (el editor de Entrenamiento) | La tabla con los límites, el renglón de los avisos y el selector de la notación | DL-188 · DL-192 |
| 12 | 12 · Figura 5 (historial en «Analizar») | La estimación con su serie en la notación del plan | DL-192 |
| 13 | 12 · Figura 6 y «Cómo probar BE» · Figura 5 (la toma) | Sin cambios de cálculo; rehacer solo si se suma Kerr a la lámina | DL-190 |
| 14 | «Cómo probar BE» · Figura 8 y 9 | El editor de Entrenamiento con la tabla nueva | DL-188 (RP-22) |
| 15 | Manual de la persona (nuevas) | Nutrición · Hoy con el carrusel, las flechas, la foto grande y los macros con íconos; el título en la cabecera de Nutrición y de Entrenamiento; el selector de RPE; Kerr en «Mi evolución» | DL-194 |
| 16 | Manual de Administración (nueva) | «Propuestas al Recetario de BE», con las parecidas y la decisión | DL-191 |
| 17 | Las capturas de la evidencia que usan los manuales: EDITORES-PROFESIONAL y NUTRICION-PLANIFICACION, las 01, 02, 13 y 14 | Ya no muestran el asistente de Nutrición | DL-193 (§8 del paquete) |

## 6. Líneas futuras de la tesis

**Dónde van.** En el **00 · Resumen y guía**, la sección «05 · Hacia dónde va»; y en el **03 · Acta**, la sección
«12 · Proyección». Las dos existen. Propongo sumar, entre el párrafo de las áreas nuevas y el de leer más datos, este
bloque, con un título corto, para que se lea claramente como línea futura y no como función de BE:

> **Lo que viene en la planificación.** Sobre la misma base de planes con versiones y registros aparte, estas son las
> próximas líneas de trabajo:
>
> - **El carrito de compras familiar.** Un centro familiar donde, si varios integrantes comparten comidas, BE calcula
>   la porción de cada uno con los mismos alimentos de la receta, según el plan de cada persona, y arma el carrito con
>   lo que hace falta. Permite trabajar con familias, desde una pareja hasta familias con varios planes distintos, sin
>   que nadie vea lo que no le corresponde.
> - **La lista de compras semanal.** La suma de lo que el plan indica para la semana, por alimento y en cantidades de
>   compra.
> - **Planificar por porciones o por intercambios.** Además de los gramos, el profesional podrá indicar el plan en
>   porciones o con listas de intercambio, siempre con la opción de seguir trabajando como hoy.
> - **«Ver como la persona».** Desde el editor, ver el plan en preparación tal como lo va a ver la persona en su
>   teléfono, antes de activarlo.
> - **El RPE de la sesión para otros deportes.** Registrar una actividad que no está en el plan (correr, nadar, un
>   partido) con su duración y el esfuerzo percibido de la sesión, para sumarla a la historia del entrenamiento.

**A qué prestar atención:**
- Ninguna de las cinco está programada: en la tesis van solo en «Hacia dónde va» y «Proyección», nunca en el alcance,
  los requisitos ni los manuales.
- El carrito familiar toca permisos entre personas (cada integrante tiene su consentimiento): conviene decirlo en una
  frase, como arriba, para que no parezca que se comparten planes sin permiso.
- **SCAMPER (23)** ya tiene una columna «Proyección» con «Turnos y cobros» y «registrar otro deporte»: el RPE de la
  sesión entra junto a «registrar otro deporte», y el carrito familiar puede sumarse como «Combinar» (planes de varias
  personas en una compra). Es opcional.

## 7. Coherencia

Revisé los textos de la entrega (00, 03, 09 a 24 y «Cómo probar BE», sacados del HTML de `_trabajo/`) y lo que este
repaso propone:

| Regla | Qué encontré | Qué hacer |
|---|---|---|
| Nada dice «asistente de Nutrición» | El 09 (2.3) ofrece «Armar con el asistente» en Nutrición; el 10 (UC-P10) dice «o con el asistente» | Los reemplazos de §4.1 y §1.4. El asistente del 09 (2.4) es el de Entrenamiento, que sigue. El 03 nombra «asistentes de inteligencia artificial»: no es la pantalla, se queda |
| «estación» | El 10 (UC-P10): «la pestaña "Patrones" de la estación… de cada temporada de fondo» | El reemplazo de §1.4: «del editor… de cada período de fondo». «temporada» también aparece en UC-P13 (la figura 2 y su ficha) y en otra fila de Nutrición del 10: cambiarla por «período», que es como lo dice el 12 |
| «cumplimiento», «adherencia», «racha», «puntaje», «volumen» en Entrenamiento | No aparecen | — |
| «asesorado» | Solo en el DER, como nombre de columna (`asesorado_id`) y en los valores `ASESORADO`, con la aclaración de que en los documentos se dice «persona» | Se queda: es el nombre técnico, y el DER ya lo explica |
| Todo «%» con su base | Las cifras del censo del 03 y del 19 la tienen. Lo nuevo de este repaso la lleva: «% de las kcal del día», «% del peso medido» | En la pantalla de Kerr, la población dice «quedó dentro del 4 %» sin base (está en la base de datos del catálogo; RP-24 lo anotó). En la tesis escribir «por debajo del 4 % del peso medido, salvo en fisicoculturistas (8 % del peso medido)» |
| Nombres de pantalla iguales a la app y al website | Verifiqué contra el código cada nombre entre comillas de §1 y §4 («Reparto por comida», «Rangos y totales», «Empezar en blanco», «Usarla ahora», «Completarlo ahora con», «Anotaciones», «Lo que contó», «Lo medido», «Lo que necesita el cálculo», «Qué vas a calcular», «Elegir métodos», «+ Otra medición», «Peso estructurado», «Cómo se escribe el esfuerzo», «6 o menos», «Recetario de BE», «Copiar a Mis recetas», «Proponer al Recetario de BE», «Propuestas al Recetario de BE», «Sumar al Recetario de BE», «No sumarla», «Opción siguiente», «Comí esta opción», «Comí algo diferente», «Hay datos nuevos») | Los viejos que hay que sacar: «Actualizar» y «Consultado a las» de la ficha y las áreas, «Armar con el asistente» y «Seguir con el asistente» en Nutrición |
| Lo de antes, todavía sin aplicar | El 09 sigue con «Entrar con el segundo factor» (1.1), «Bloque» en 2.4 y el autenticador en «Cómo probar BE» | Son de la auditoría del 19/11 y del repaso del 20/11; los dejo anotados, no los repito |

## 8. Lo que queda

- **Rearmar las fuentes.** Las de 09 a 17 y «Cómo probar BE» se perdieron con la carpeta temporal. Hay dos caminos:
  reconstruirlas desde el HTML de `_trabajo/` (mecánico, pero hay que revisar los bloques especiales del generador) o
  reescribirlas con este repaso y los del 19 y el 20/11 juntos. Recomiendo lo segundo, porque los tres repasos tocan las
  mismas secciones.
- **Los PDF y el PDF único no se regeneraron:** el generador usa Edge y Word, y con la memoria de hoy no se corre.
- **El DER:** regenerar la fuente DBML entera desde el esquema (§2.3), no a mano.
- **Los IDs:** RF-072, RF-073, UC-E10, UC-E11 y los CP-86 a CP-92 siguen esperando tu sí del 20/11; los CP-93 a CP-100
  de este repaso van después. El Recetario, como refinamiento o como RF-074 (§1.3).
- **Las capturas:** las 17 de §5, con la APK de DL-194 publicada y la muestra del tutor en test.
- **Lo que no se puede afirmar todavía:** la prueba con lector de pantalla y con TalkBack de estas pantallas está
  pendiente en los siete paquetes; el RNF-ACC-001 dice lo que se probó, no más. La cesión de la foto espera la revisión
  legal.

## Fuentes

`docs/DEUDA_LEGAJO.md` (DL-188 a DL-194) y los paquetes de §0; `prisma/schema.prisma` y las migraciones
`20261121150000_kerr_cinco_componentes` y `20261122120000_recetario_e_imagenes`; `docs/api/openapi.json`; los textos
de las pantallas en `packages/domain/src` (`evaluacion-inicial`, `recetario`, `notacion-del-esfuerzo`) y en
`apps/web/src`; el repaso del 20/11 y la auditoría del 19/11; el HTML de `entrega-tutor-final/_trabajo`.
