# WP-NUTRICION-RECETAS — Recetas con foto, opciones con macros verificables y registro con fotos privadas · definición del paquete

> **Estado:** DEFINIDO el 2026-10-05, antes del primer commit de código.
> - Rama: `wp-nutricion-recetas`. El prefijo `wp-` hace que la CI corra en cada push.
> - PR en borrador contra `apk/navegacion` (#146).
>
> **Encargo:** «BE · Implementación de Nutrición con recetas, fotos y macros verificables», de Dirección, del 2026-10-05.
> - Viene con el paquete `BE_Nutricion_Demo_2026-10-05`. Su manifiesto verifica y `verificar_calculos.py` da OK: 8 alimentos, 3 recetas y 11 casos numéricos.
> - Se copia íntegro en `docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/`.
> - Entrega prevista: 2026-10-20.
>
> **Autorización:** el encargo autoriza el desarrollo y sus pruebas reversibles. Quedan fuera:
> - publicar una APK;
> - el merge;
> - el despliegue;
> - cualquier gasto externo.
>
> **Base:** `9021c47`, el head de #146. La APK usa sus cinco destinos, su cabecera y su navegación con origen. Lo que
> cambie después en #146 se integra en esta rama.
>
> **Dirección visual:** las cuatro referencias aprobadas son el carrusel, el detalle, el registro confirmado y la comida
> diferente. Se aplican con las aclaraciones del encargo:
> - el botón dice «Comí esta opción»;
> - las cantidades consumidas son opcionales y explícitas;
> - los macros previos son una estimación de las porciones del plan.
>
> Los números de las capturas son ficticios: no se usan. Se conservan los cinco destinos reales, el logo actual y los
> componentes de navegación de BE.

**Fuentes leídas:**
- **06:**
  - REG-06-133 a 136 y T-06-65 (06:4174, 4795-4843);
  - B-07: catálogo, anclaje, unicidad, jerarquía y factores de conversión (06:4228-4394, 4554-4621);
  - corrección y vista efectiva (06:1422-1462).
- **08:**
  - §21: la foto del asesorado es un dato C4 reforzado (08:519-531);
  - el acto `EVIDENCIA_VISUAL` (08:395);
  - la supresión individual a pedido (08:451).
- **07:** §25, almacenamiento de objetos (07:939-965), y 07:256 (Render no tiene almacenamiento de objetos disponible en general).
- **09 consolidado v0.16.1:**
  - precedencia del 404, idempotencia y v2 (09:200-268);
  - modalidad C (09:576-630);
  - API-NUT-21 (09:632-687);
  - medios privados, condicionados a su activación (09:516, 754).
- **09 auxiliares:**
  - 09v9 §28 y §29 (09v9:965-1003);
  - 09v12 §24 (09v12:975-1000);
  - 09v8 API-PRO-04 (09v8:696-750);
  - 09v7 T19 y T20 (09v7:687-735).
- **DEUDA_LEGAJO:** DL-049, DL-050 y DL-109. **WP-04:** sus exclusiones (WP-04:132, 155, 238, 244).

---

## 1. Objetivo y demostrables

El recorrido completo es: profesional → receta con foto → plan → carrusel y detalle en la APK → registro → consulta del
resultado. Todo con cuentas y datos sintéticos.

| # | Demostrable | Cómo se prueba |
|---|---|---|
| D1 | **El profesional crea y edita una receta en la web.** Es una preparación propia (REG-06-135, inciso 2), con: <ul><li>ingredientes del catálogo por identidad y versión;</li><li>gramos del estado indicado;</li><li>porciones;</li><li>preparación;</li><li>imagen de referencia.</li></ul> | Integración de la API y recorrido en la web |
| D2 | **La foto entra por el flujo real:** intención, subida, validación, recodificación y asociación. Se recupera después de recargar la página y de reiniciar la API. Se puede reemplazar o retirar sin tocar los ingredientes ni la historia | Integración, recorrido en la web y reinicio |
| D3 | **El cálculo sale del servidor** con el método `SUM_SOURCE_PER_100G_V1` y reproduce, sin redondeo intermedio, los 11 casos del paquete. Un dato ausente es desconocido, no cero, y el total lo dice | Pruebas del dominio y de integración |
| D4 | **La receta se ofrece como opción de una comida del plan.** El plan activado conserva la versión de la receta, y cambiar la receta después no reescribe planes ni registros | Integración |
| D5 | **En la APK, la comida muestra sus opciones en un carrusel manual:** foto o ícono, nombre y macros de las porciones del plan. El detalle se abre desde la tarjeta, y al volver queda la misma opción | Pruebas puras y render |
| D6 | **«Comí esta opción» registra de tres maneras:** <ul><li>con las cantidades sin confirmar;</li><li>con las porciones del plan, confirmadas de forma explícita;</li><li>con las cantidades que la persona informa.</li></ul>Nunca convierte lo previsto en consumido, y un doble toque o un reintento no duplica | Integración y pruebas puras |
| D7 | **«Deshacer registro» anula de forma auditable**, sin borrar, y deja volver a registrar. «Completar cantidades» rectifica sin reescribir el original | Integración |
| D8 | **«Comí algo diferente» admite texto, foto o los dos, y exige al menos uno.** La foto es privada, sin EXIF y con una URL de 15 minutos como máximo, y no agrega macros | Integración y render |
| D9 | **Permisos:** <ul><li>otro profesional no carga una foto en una receta ajena;</li><li>ni otro profesional ni otro asesorado leen una foto privada ajena.</li></ul>La denegación es el mismo 404 que lo inexistente | Integración |
| D10 | **Compatibilidad:** las APK instaladas (la 0.13.2 y las candidatas) siguen funcionando, porque ninguna respuesta que leen cambia de forma | Pruebas de contrato |

## 2. Delta frente a lo que existe

| Hoy (`9021c47`) | Después del paquete |
|---|---|
| No hay recetas: una opción es `{label, items}` | **Receta** (preparación propia), versionada: nombre, descripción, porciones, ingredientes con versión de catálogo, gramos y estado, pasos e imagen. Una opción se puede **generar desde una versión de receta**: sus ítems son los ingredientes de esa versión |
| La composición del catálogo exige kcal, proteínas, carbohidratos y grasas, sin fibra ni fuente identificada | Ocho alimentos de **USDA FoodData Central · SR Legacy**, sembrados por migración con FDC, NDB, descripción original, fecha y licencia CC0. La fibra es opcional, y ausente significa desconocida, no cero |
| No se calculan totales | **El cálculo lo hace la API**, con `SUM_SOURCE_PER_100G_V1`: aritmética exacta, redondeo solo para mostrar y faltantes declarados |
| No hay archivos | **Medios privados**, según 09v12 §24: intención de subida, subida firmada, acceso con URL temporal, EXIF depurado y supresión a pedido. El almacenamiento es PostgreSQL, detrás de una interfaz |
| `visualEvidenceUploadIds` se rechaza, y la comida libre exige descripción | **Registro v2:** la comida diferente lleva texto, fotos o los dos (REG-06-133) |
| Una cantidad ausente es «no informada», sin estado | **Estado de las cantidades:** sin confirmar, porciones del plan confirmadas o informadas. Un ingrediente que no se comió se marca así, no con cero |
| El asesorado no puede corregir ni deshacer (DL-050), y la clave única impide volver a registrar | **Anulación auditable** y **rectificación de cantidades**, de solo agregar. La clave natural suma una secuencia: una sola ingesta efectiva por comida y día |
| La APK muestra las opciones como una lista de radio | **Carrusel** con foto, macros previstos y «Comí esta opción», **detalle** con «Porciones del plan» y «¿Cuánto comiste?», **éxito confirmado** y **comida diferente** con cámara y galería |

## 3. Modelo (migración aditiva)

- **`receta` y `version_de_receta`:**
  - la receta pertenece a un profesional; las versiones son inmutables y la vigente es la terminal de la cadena, como en
    el catálogo;
  - cada versión guarda nombre, descripción, porciones (entero de 1 o más), pasos, ingredientes (elemento, versión de
    catálogo, cantidad, unidad `g` y estado de preparación), el método de cálculo y el resultado calculado;
  - **editar emite una versión nueva**;
  - la imagen va en la receta, no en la versión: reemplazarla o retirarla no toca ingredientes, versiones ni registros.
- **`medio` y `contenido_de_medio`:**
  - **`medio` guarda los metadatos:**
    - propietario y finalidad (`RECETA_REFERENCIA` o `EVIDENCIA_DE_INGESTA`);
    - estado (`PENDIENTE`, `DISPONIBLE` o `SUPRIMIDO`);
    - lo procesado: tipo, bytes, dimensiones y SHA-256;
    - lo original: tipo, bytes y dimensiones;
    - procedencia (`GENERADA_POR_IA` o `APORTADA_POR_LA_PERSONA`) y autoría.
  - **`contenido_de_medio` guarda los bytes procesados** en `bytea`.
  - Suprimir borra los bytes y deja el registro, con su motivo y su momento.
- **`asociacion_de_imagen_de_receta`:** cada cambio de imagen de una receta (asociar, reemplazar o retirar) es una fila
  de solo agregar, y la vigente es la última. Así queda la historia.
- **`evidencia_visual_de_ingesta`:** cada fila une una ingesta con un medio, con autoría, momento y procedencia
  (REG-06-133). Es de solo agregar.
- **`ingesta_nutricional`:**
  - suma `secuencia` (entero, por defecto 0) y `cantidades_consumidas` (Json, nulo en lo anterior);
  - el índice único pasa a ser (versión, fecha, comida, secuencia);
  - lo existente queda con secuencia 0, sin cambios.
- **`anulacion_de_ingesta`:** anula una ingesta, una sola vez, con autor, motivo y momento. Es de solo agregar.
- **`rectificacion_de_cantidades`:** la cadena de cantidades consumidas de una ingesta prescripta, de solo agregar. La
  vista efectiva es la terminal.
- **Plan:** una opción puede llevar `recipeVersionId` dentro del `contenido` del borrador. La instantánea de la
  activación guarda la referencia y los datos de la versión.
- **Enums:**
  - `TipoDeActoRegistrable` suma `EVIDENCIA_VISUAL` (08:395);
  - la procedencia externa del catálogo suma el proveedor `USDA_FDC_SR_LEGACY`.

Nada de lo anterior se reescribe: ni planes, ni instantáneas, ni ingestas, ni correcciones.

## 4. Operaciones

Son tres familias propias de BE, declaradas en DL-119, DL-120 y DL-121, más un cambio en API-NUT-10 y API-NUT-09. Todas
pasan por el ejecutor y el PDP, con alcance `NUTRICION` y finalidad `ACOMPANAMIENTO_NUTRICIONAL`. Toda escritura lleva
`Idempotency-Key`, y la edición, `expectedVersion`. Lo ajeno o inexistente responde el mismo 404.

| Operación | Método y ruta | Actor | Para qué |
|---|---|---|---|
| API-REC-01 | `POST /api/v1/nutrition/recipes` | profesional de Nutrición | Crear una receta (versión 1) |
| API-REC-02 | `GET /api/v1/nutrition/recipes` | profesional | Listar las propias, con su versión vigente y su imagen |
| API-REC-03 | `GET /api/v1/nutrition/recipes/{recipeId}` | profesional dueño | Ver una receta y su historial de versiones |
| API-REC-04 | `PATCH /api/v1/nutrition/recipes/{recipeId}` | profesional dueño | Editar: emite una versión nueva |
| API-REC-05 | `PUT /api/v1/nutrition/recipes/{recipeId}/image` | profesional dueño | Asociar o reemplazar la imagen con un medio propio `DISPONIBLE` |
| API-REC-06 | `DELETE /api/v1/nutrition/recipes/{recipeId}/image` | profesional dueño | Retirar la imagen: queda la historia, y el medio no se borra |
| API-REC-07 | `POST /api/v1/nutrition/recipe-calculations` | profesional de Nutrición | Calcular sin guardar, para ver el cálculo mientras se edita. El servidor vuelve a calcular al guardar |
| API-MED-01 | `POST /api/v1/me/media/upload-intents` | profesional o asesorado | Intención de subida (09v12 §24): finalidad, tipo y bytes declarados. Devuelve el medio, la URL firmada de subida y su vencimiento |
| API-MED-02 | `PUT /api/v1/media/uploads/{token}` | quien tiene la URL firmada | Subir los bytes. Se validan, se recodifican sin metadatos y se guardan |
| API-MED-03 | `GET /api/v1/media/{mediaId}/access` | según la finalidad (§6) | URL temporal de lectura, de 15 minutos como máximo (09v12 §24; 08 §21) |
| API-MED-04 | `GET /api/v1/media/content/{token}` | quien tiene la URL firmada | Los bytes, sin caché |
| API-MED-05 | `DELETE /api/v1/me/media/{mediaId}` | asesorado titular | Supresión a pedido de una foto de ingesta propia (08:451): se borran los bytes y queda el registro |
| API-ING-01 | `GET /api/v1/me/nutrition/today/options` | asesorado | «Hoy» con opciones: imagen, macros previstos de las porciones del plan, ingredientes con estado, pasos y registro del día |
| API-ING-02 | `POST /api/v1/me/nutrition/meal-records` | asesorado | Registrar una opción (con su estado de cantidades) o una comida diferente (texto o fotos) |
| API-ING-03 | `GET /api/v1/nutrition/meal-records/{recordId}` | titular y profesional del plan | Un registro, con estado, anulación, rectificaciones, fotos y macros consumidos cuando se pueden calcular |
| API-ING-04 | `GET /api/v1/me/nutrition/meal-records` | asesorado | Sus registros por período, en la forma v2 |
| API-ING-05 | `POST /api/v1/nutrition/meal-records/{recordId}/consumed-quantities` | asesorado titular | Completar o corregir las cantidades: una rectificación |
| API-ING-06 | `POST /api/v1/nutrition/meal-records/{recordId}/annulment` | asesorado titular | Deshacer: anulación auditable |

**Cambios en lo existente, solo para el profesional:** API-NUT-10 acepta en una opción `{label, recipeVersionId}`, y sus
ítems salen de la receta en el servidor. API-NUT-09 devuelve esa referencia. La web se despliega con la API.
- La versión de plan usa `DiaTipoDelProfesionalSchema`, cuya opción suma `recipe`. «Hoy» (API-NUT-14) sigue con
  `DiaTipoSchema`, sin `recipe`.
- La procedencia de un alimento usa `FuenteExternaDeAlimentoSchema`, que suma el proveedor `USDA_FDC_SR_LEGACY` y la
  referencia del registro de USDA. La de un ejercicio no cambia: la búsqueda de ejercicios la lee la APK instalada.

**Errores nuevos.** Los dos primeros son los del 09 para una subida (09v8 API-PRO-04):
- `FILE_TYPE_NOT_ALLOWED` (422): el tipo declarado o el real no es JPEG, PNG ni WebP;
- `FILE_SIZE_NOT_ALLOWED` (422): más de 10 MB;
- `FILE_CONTENT_INVALID` (422): los bytes no se decodifican como el tipo declarado, o la imagen sale de las dimensiones
  admitidas;
- `MEDIA_REFERENCE_INVALID` (422): un medio citado en el cuerpo no es propio, no está disponible o no es de esa finalidad.

Lo demás reusa códigos que ya existen:
- `CATALOG_REFERENCE_INVALID` para un ingrediente;
- `VERSION_CONFLICT` para `expectedVersion`;
- `INVALID_STATE_TRANSITION` para anular dos veces, rectificar algo anulado o volver a subir otros bytes;
- `EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY`, `ACTIVE_PLAN_REQUIRED` y `NUTRITION_EXECUTION_INVALID` para el registro.

**Autenticación de la ruta firmada.** API-MED-02 y API-MED-04 se declaran `SIGNED_URL`: no llevan sesión, porque las
autoriza la ruta firmada que emitió otra operación con sesión. Una ruta vencida, alterada o de un medio suprimido responde
404.

**Lo que no cambia:** API-NUT-14, 15, 16 y 16-LISTA, que lee la APK instalada. Su forma es la misma. Además, una ingesta
anulada no se lista ni se devuelve por esas rutas, y nada que la APK vieja no conozca entra en sus respuestas.

## 5. Cálculo: `SUM_SOURCE_PER_100G_V1`

- **Fórmula:** para cada nutriente, la suma de (gramos ÷ 100 × valor cada 100 g del alimento).
  - Las kcal salen de la energía de la fuente, sin reemplazarla por 4/4/9.
  - Los carbohidratos son «by difference», no netos.
- **Aritmética exacta, con racionales de `BigInt`.**
  - Cada valor del catálogo se toma por su representación decimal más corta. En un número JSON, «28.17» es exactamente
    28,17.
  - Los resultados internos son decimales exactos, por ejemplo `529.220`.
  - Se redondea solo al mostrar, HALF_UP: kcal a entero y gramos a un decimal.
- **Lo que falta es desconocido.**
  - Si un ingrediente no tiene el dato, ese nutriente queda `incompleto`, con la lista de los ingredientes que lo deben.
    No se presenta un total completo.
  - Una cantidad sin confirmar no aporta nada al consumo: no es cero ni lo previsto.
- **Por porción:** el total dividido por las porciones de la receta.
  - La opción del plan lleva las cantidades de **una porción**: cada ingrediente dividido por las porciones de la
    versión.
  - Los macros del carrusel son los de esas cantidades: «Estimación para las porciones del plan».
- **Consumo:**
  - con las porciones del plan confirmadas, se calcula con las cantidades del plan;
  - con cantidades informadas, con esas cantidades;
  - un ingrediente sin cantidad lo deja incompleto;
  - uno marcado «no lo comí» aporta cero de verdad, porque así se declaró.
- **El método va versionado:** cada versión de receta y cada cálculo guardan `SUM_SOURCE_PER_100G_V1`. BE no tenía un
  método canónico de totales, así que no se cambia ningún resultado anterior.
- **El cliente no manda totales.** La API recalcula cada vez que se guarda y no acepta un total recibido.

## 6. Medios y almacenamiento

- **El almacenamiento** es una interfaz, `AlmacenDeMedios`, con la operación de guardar, leer y suprimir.
  - La implementación es `postgres`, sobre la base existente, la única persistencia que hay. Sobrevive a un reinicio de
    la API y no usa el disco del contenedor (07 §25).
  - Se elige con `BE_MEDIOS_ALMACEN`; `postgres` es el valor por defecto.
  - El 07 §25 pide un almacenamiento compatible con S3. Para usarlo hace falta un bucket privado y sus credenciales, un
    servicio que no está contratado. La interfaz queda lista para esa implementación (DL-120).
- **Subida:**
  - API-MED-01 crea el medio `PENDIENTE` y una URL firmada de subida, que vence a los 10 minutos.
  - API-MED-02 recibe el cuerpo crudo, con un parser propio solo en esa ruta. El resto de la API sigue con el límite de
    16 kB.
- **Validación en el servidor:**
  - tipo declarado y real: JPEG, PNG o WebP;
  - hasta 10 MB;
  - una decodificación completa;
  - dimensiones de 64 a 8000 px por lado, y hasta 40 megapíxeles.
- **Recodificación:**
  - se orienta y se guarda en JPEG de calidad 82, con 1600 px como máximo en el lado mayor;
  - **sin metadatos**: EXIF, GPS e ICC no van;
  - el cliente aplica los mismos límites antes de subir.
- **Lectura:**
  - API-MED-03 decide con el PDP y devuelve una URL temporal (`/media/content/{token}`), firmada con HMAC y una clave
    derivada del secreto del servidor, que vence en 15 minutos como máximo;
  - la identidad del medio no es la URL;
  - ninguna clave ni credencial viaja en la APK, el repositorio ni la evidencia.
- **Quién lee qué:**
  - **imagen de receta:** el profesional dueño y el asesorado cuyo plan vigente o histórico tiene una opción de esa
    receta;
  - **foto de ingesta:** el titular y el profesional del plan de esa ingesta, con vínculo, B2 y A3 vigentes;
  - **un medio sin asociar:** solo quien lo subió.
- **Auditoría:** cada acceso emitido queda en el registro de actos, con `EVIDENCIA_VISUAL` para las fotos de ingesta.
- **Las fotos de ingesta son del titular.** No se reusan como imagen de receta: la finalidad del medio lo impide.

## 7. Registro: estados, anulación y rectificación (resuelve DL-050)

- **API-ING-02 con una opción.** La finalidad de las cantidades es una de tres:
  - `SIN_CONFIRMAR`: el registro rápido;
  - `PORCIONES_DEL_PLAN`: la persona lo confirmó; el control empieza desmarcado;
  - `INFORMADAS`: por ingrediente, una cantidad, «no lo comí» o vacío. Vacío no es cero.

  Además:
  - el carrusel y el detalle invocan el mismo comando, con la misma clave de idempotencia por intento;
  - el registro guarda la versión del plan, la opción y la versión de la receta;
  - si ya hay una ingesta efectiva de esa comida ese día, uno equivalente devuelve la existente y uno distinto da 409.
- **API-ING-02 con una comida diferente:**
  - descripción opcional (hasta 500 caracteres), cantidad aproximada opcional en texto y hasta 3 fotos propias
    `DISPONIBLE` de finalidad `EVIDENCIA_DE_INGESTA`;
  - exige al menos texto o foto;
  - nada se convierte en cantidades de catálogo, y los macros quedan «sin calcular».
- **API-ING-06, deshacer:**
  - anula con un registro auditable, sin borrar;
  - la ingesta deja de contar en el día, el contraste, la revisión, la cartera y el tablero;
  - libera la comida: el próximo registro usa la secuencia siguiente.
- **API-ING-05, completar o corregir:**
  - cada envío es una rectificación nueva, con el estado y las cantidades;
  - la vista efectiva es la última;
  - el original no se modifica.
- **Si la receta o el plan cambian después,** el registro conserva su significado: apunta a la versión del plan, que es
  inmutable, y a la versión de la receta.

## 8. Compatibilidad

- **Las APK instaladas validan con esquemas estrictos.** Por eso nada nuevo va en las respuestas que ya leen:
  - API-NUT-14 sigue igual: las opciones nacidas de una receta salen como `{label, items}`, con sus ítems;
  - API-NUT-15 sigue igual y rechaza lo nuevo;
  - API-NUT-16 y 16-LISTA siguen igual y omiten lo anulado;
  - lo nuevo va en endpoints nuevos, que el 09v7 T19 declara compatibles. No hace falta un v2.
- **La web profesional y la API se despliegan juntas.** Los cambios en API-NUT-09, API-NUT-10 y el catálogo son solo de
  la web.
- **La APK nueva usa API-ING y API-MED, y suma `expo-image-picker`.** Necesita una APK nueva, que no se publica en este
  paquete.
- **Las validaciones estrictas no se aflojan en ninguna parte.** Cada endpoint nuevo tiene su esquema estricto.
- **La forma de lo que lee la APK instalada queda congelada.** Está en
  `packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json`:
  - son los esquemas de pedido y de respuesta de API-NUT-14, 15, 16 y 16-LISTA;
  - se generaron desde `9021c47`, y esos contratos no cambiaron desde la 0.13.2;
  - una prueba del dominio exige que sigan iguales.

  La comparación operación por operación contra la base da que solo cambian lecturas del profesional:
  - la estructura del plan, en API-NUT-07, 09, 10 y 13;
  - la composición y la procedencia de un alimento, en API-INT-NUT-01, TPN y HAN.

## 9. UX

**Web profesional:**
- **«Mis recetas»:** lista con foto, nombre, porciones y kcal por porción.
- **Editor:**
  - nombre, descripción y porciones;
  - ingredientes elegidos del catálogo por identidad, con su estado visible (crudo, cocido o tal como se compra) y
    gramos;
  - pasos;
  - imagen: elegir un archivo, ver la vista previa, cargarla, reemplazarla o retirarla, con el rótulo «Imagen de
    referencia» y su procedencia («Generada por IA»).
- **Cálculo:**
  - total y por porción, con lo que falta;
  - se recalcula al cambiar ingredientes, cantidades o porciones.
- **Plan:** «Agregar receta como opción» en una comida. La guía no presenta las opciones como equivalentes.

**APK (Nutrición):**
- **Pestañas:** Hoy, Plan y Registros.
- **Hoy:**
  - la fecha civil de la API;
  - las comidas del plan como categorías, con lo registrado marcado;
  - por comida, un carrusel manual: se ve una parte de la tarjeta siguiente, con el contador «Opción n de m» y flechas
    accesibles, sin avance automático; con una sola opción, sin controles.
- **Tarjeta de opción:**
  - foto o ícono de respaldo;
  - «Imagen de referencia»;
  - nombre;
  - la franja Calorías, Carbohidratos, Grasas y Proteínas, en dos por dos con letra grande;
  - «Estimación para las porciones del plan»;
  - «Ver detalle» y «Comí esta opción»;
  - deslizar no registra.
- **«Comí algo diferente»** va debajo del carrusel, con la fecha y la comida.
- **Detalle:**
  - foto, nombre y macros previstos;
  - «Porciones del plan», en lectura;
  - pasos;
  - «¿Cuánto comiste?»: «Comí las porciones del plan» (casilla desmarcada) o una cantidad por ingrediente, con «no lo
    comí».
  - Al volver, quedan la misma opción, la fecha y la posición.
- **Éxito:**
  - «Almuerzo registrado», con la opción elegida y su foto;
  - «Cantidades sin confirmar» cuando corresponde;
  - «Completar cantidades», «Ver o corregir registro» y «Deshacer registro».
- **Comida diferente:**
  - foto con «Cámara» y «Galería», con el permiso pedido al usarla; se puede quitar o reemplazar;
  - «¿Qué comiste?» y «Cantidad aproximada (opcional)»;
  - «Macros sin calcular»;
  - los estados subiendo, guardando, error recuperable y guardado confirmado;
  - si la foto falla, el texto se conserva.
- **Si la imagen falla,** queda el ícono y el contenido sigue a la vista.

## 10. Pruebas y evidencia

1. **El paquete:** `verificar_calculos.py` OK, con un Python embebible oficial fuera del repositorio. Acredita el
   conjunto, no BE.
2. **Dominio:**
   - los 11 casos numéricos, exactos;
   - el redondeo de presentación;
   - un nutriente desconocido;
   - una cantidad ausente;
   - el rechazo de cantidades negativas, de texto y de `ml` sin densidad;
   - la porción de la opción.
3. **Integración (PostgreSQL real):**
   - recetas: crear, editar, versionar y permisos;
   - medios: tipos, tamaño, dimensiones y decodificación; EXIF eliminado; URL vencida o alterada; permisos con cuentas
     distintas; persistencia después de reiniciar la app;
   - opción desde receta y activación;
   - API-ING-01, con macros de las porciones del plan;
   - API-ING-02 en las tres formas, con doble envío, la comida diferente con texto, con foto, con ambos o vacía, y una
     foto ajena;
   - anulación y vuelta a registrar;
   - rectificación;
   - receta modificada después del registro;
   - regresión de las rutas que lee la APK vieja.
4. **APK:**
   - pruebas puras: carrusel, comando de registro, borrador de la comida diferente y textos;
   - render de los componentes en el navegador, en 360, 390 y 412 dp, con los dos temas y letra ×1, ×1,3 y ×2;
   - el recorrido contra la API local real, para leer las mismas fotos cargadas desde la web.
5. **Web:** el recorrido con puppeteer contra la web y la API locales: crear, editar, subir cada PNG, recargar, plan y
   activar.
6. **Android: pendiente explícito.** No hay dispositivo en este paquete para gestos, teclado, cámara y galería, la barra
   y el último contenido.

**Evidencia:** `EVIDENCIA/NUTRICION-RECETAS/`, con cuentas sintéticas y sin credenciales ni fotos privadas reales. Separa
lo probado localmente, lo probado contra `test`, que no se hace porque no hay despliegue, y lo pendiente en Android.

## 11. Fuera de alcance

- Publicar la APK, integrar, desplegar y contratar un almacenamiento S3.
- **Inferir** ingredientes, cantidades o macros desde una foto o un texto, con o sin IA externa (09v9 §28; 08 §21).
- El recurso didáctico del catálogo global (REG-06-134) y el atlas de porciones (T-06-66).
- Objetivos conductuales y medidas caseras (PF-04 y PF-05).
- Equivalencias nutricionales entre opciones.
- Conversiones entre crudo y cocido, o entre `ml` y `g`.
- Una cola de envíos sin conexión. El borrador se conserva y el reintento usa la misma clave.

## 12. Deudas (DEUDA_LEGAJO)

- **DL-119 · Recetas como preparaciones propias, catálogo USDA y método de cálculo.**
  - Declara la familia REC.
  - La receta instancia REG-06-135, inciso 2.
  - El método `SUM_SOURCE_PER_100G_V1` es nuevo y está versionado.
  - La procedencia `USDA_FDC_SR_LEGACY` es CC0.
- **DL-120 · Medios privados activados.**
  - Declara la familia MED.
  - Dirección activa en este paquete lo que el 08 §21 y el 09 §24 condicionaban.
  - El almacenamiento es PostgreSQL, detrás de una interfaz, en lugar de S3 (07 §25), porque no hay un servicio
    contratado. Cumple las mismas garantías: privado, URL firmadas de 15 minutos como máximo, EXIF depurado, acceso
    auditado y supresión.
- **DL-121 · Registro v2 y deshacer.**
  - Declara la familia ING.
  - Define los estados de las cantidades.
  - Resuelve DL-050 con la anulación y la rectificación de solo agregar, que el 06:1422-1462 admite en el inciso 4.
  - Cambia la clave natural (DL-049), que pasa a llevar una secuencia.
