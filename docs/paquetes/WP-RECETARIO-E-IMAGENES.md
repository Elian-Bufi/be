# WP-RECETARIO-E-IMAGENES · El Recetario de BE e imágenes livianas

> **La decisión de Dirección (22/11):** Elián, licenciado en nutrición, aprobó las recomendaciones del continuador: «tus
> recomendaciones me parecieron perfectas, aplicalas así». Son tres cosas: que las imágenes pesen menos (dos medidas en
> WebP, pedidas según dónde se muestran), que la imagen de una receta se cargue donde se crea o se agrega, y un **Recetario
> de BE**: recetas curadas por Administración, a la vista de todos los profesionales de Nutrición, con el camino para que un
> profesional proponga una suya y ceda su foto.
>
> Rama `wp-recetario-e-imagenes`, desde `main` (eadc32fb). Registro: **DL-191** en `docs/DEUDA_LEGAJO.md`. Las decisiones
> de continuador (**REC-D01 a REC-D17**) están **a ratificar**. No se integra sola. La APK no se toca: lo suyo va en
> DL-194 (APK 0.32), §4.

## 0. En criollo

Cada foto de una receta se guarda ahora en dos medidas, en WebP: una grande de 1200 px para el detalle (unos 150 kB) y una
miniatura de 400 px para listas, tarjetas y el carrusel (unos 25 kB). Antes había una sola, un JPEG de 1600 px de unos
300 kB, que se bajaba entera aunque se mostrara en un cuadradito. El website, además, achica la foto antes de subirla: una
foto de 4000 px del teléfono sube como una de 1600 px. Las fotos que ya estaban siguen andando tal cual, también en la APK
publicada; su miniatura y su grande se arman la primera vez que alguien las pide. Si un profesional sube dos veces la
misma foto, BE guarda una sola.

El **Recetario de BE** es una segunda pestaña en «Recetas»: las 66 recetas de cocina familiar del repertorio, para todos los
profesionales de Nutrición, de solo lectura. Se usan tal cual como opción del plan o se copian a «Mis recetas» para
adaptarlas; la copia usa la misma foto, sin duplicarla. Un profesional puede **proponer** una receta suya: si tiene foto,
lee y acepta la cesión de la foto, y BE registra qué texto aceptó y cuándo. Administración la ve en /admin, con quién la
propuso y las recetas parecidas que ya hay, y la suma o no (con un motivo, si quiere).

La foto de una receta también se carga desde el cajón de recetas del editor del plan: cada receta muestra su miniatura y
«Cargar la imagen» abre ahí mismo el recuadro de siempre. La imagen es de la receta: cambiarla en un lugar la cambia en
todos. Las fotos de una comida que manda la persona no cambian: siguen privadas, en JPEG, y cada acceso queda auditado.

## 1. Alcance

| ID | Qué | Dónde |
|---|---|---|
| REC-01 | Dos variantes WebP de la imagen de una receta: la grande de 1200 px (lo guardado, en `contenido_de_medio`) y la miniatura de 400 px (`variante_de_medio`), calidad 78 y esfuerzo 6 (REC-D01) | `procesamiento-de-imagen.ts`, `almacen-de-medios.ts`, `medios.service.ts`, `LIMITES_DE_MEDIO`, migración `20261122120000_recetario_e_imagenes` |
| REC-02 | Leer por variante: API-MED-03 acepta `?variant=thumbnail\|large` y la firma en la ruta; API-MED-04 responde JPEG o WebP con su `Content-Type`. Las listas y tarjetas del website piden la miniatura; el detalle, la grande | `rutas-firmadas.ts`, `medios.service.ts`, `medios.controller.ts`, `cliente-http.ts`, `lib/medios.ts`, `imagen-de-receta.tsx` |
| REC-03 | Achicar en el cliente antes de subir (website): a 1600 px en el lado mayor, en WebP o JPEG, con `createImageBitmap` y un canvas; también un archivo de más de 1,5 MB. La función de dominio `medidasAlAchicar` queda para la APK (DL-194) | `contratos-medios.ts`, `lib/medios.ts` |
| REC-04 | Una sola copia por huella: el mismo dueño, el mismo SHA-256 de lo recibido, la misma procedencia y la misma autoría responden el medio que ya está; nunca entre dueños distintos | `medios.service.ts` (API-MED-02) |
| REC-05 | El Recetario de BE: recetas sin profesional, de solo lectura, que lee cualquier profesional de Nutrición (API-RCT-01 y API-REC-03), con las rutas de su imagen ya firmadas (REC-D10); se usan tal cual como opción del plan | `recetas.service.ts`, `lectura-recetas.ts`, `opciones-de-receta.ts`, `recetario-de-be.tsx`, `mis-recetas.tsx` |
| REC-06 | «Copiar a Mis recetas» (API-RCT-02): una receta propia con el mismo contenido, recalculada, que dice de cuál salió, con el mismo medio de la imagen | `recetas.service.ts`, `recetario-de-be.tsx`, `receta-en-el-cajon.tsx` |
| REC-07 | Proponer al recetario (API-RCT-03), con la cesión de la foto versionada y registrada (REC-D08) | `contratos-recetario.ts`, `recetas.service.ts`, `proponer-al-recetario.tsx` |
| REC-08 | Administración: las propuestas con su autor, la receta, la cesión y las parecidas (API-RCT-04), y sumarlas o no (API-RCT-05) | `propuestas-al-recetario.service.ts`, `administracion.controller.ts`, `cliente-administrativo.ts`, `/admin/recipes` |
| REC-09 | La semilla: las 66 recetas del repertorio del 2026-10-28, con un comando idempotente, sin foto | `semilla-del-recetario.ts`, `comando-del-recetario.ts` |
| REC-10 | Cargar la imagen donde se agrega una receta: el cajón «Agregar receta como opción» del editor del plan (la receta nueva desde el plan ya la tenía, NUA-06) | `receta-en-el-cajon.tsx`, `editor.tsx` |
| REC-11 | Compatibilidad: los medios de antes y la APK publicada | §4 |

## 2. Contratos

Familia propia **RCT** (DL-191; `scripts/trazabilidad-de-operaciones.test.cjs`). El OpenAPI se regeneró
(`docs/api/openapi.json`).

| ID | Ruta | Qué |
|---|---|---|
| API-RCT-01 | `GET /nutrition/recipe-book` | Las recetas del recetario, en orden alfabético, con `q` sin tildes; `image.paths` trae la miniatura y la grande ya firmadas |
| API-RCT-02 | `POST /nutrition/recipe-book/{recipeId}/copies` | Copiar a Mis recetas (cuerpo vacío, con Idempotency-Key) |
| API-RCT-03 | `POST /nutrition/recipes/{recipeId}/proposals` | Proponer la versión vigente de una receta propia, con `photoAssignment` si tiene foto |
| API-RCT-04 | `POST /admin/recipe-proposals/query` | Administración (SESSION_MFA): las propuestas, las que esperan primero |
| API-RCT-05 | `POST /admin/recipe-proposals/{proposalId}/decisions` | Administración (SESSION_MFA): `ADD` o `REJECT` con `reason` opcional, una sola vez |

Cambian, sin romper a nadie:

- **API-MED-02:** la imagen de una receta se guarda en WebP (`contentType: image/webp`); `MedioSchema.contentType` admite
  `image/jpeg` e `image/webp`. La foto de una comida sigue en JPEG: la APK publicada valida `image/jpeg` al subirla.
- **API-MED-03:** `?variant=thumbnail|large` (opcional). La respuesta no cambia de forma.
- **API-MED-04:** `Content-Type` real; `Cache-Control: private, max-age=…, immutable` solo para la imagen de una receta del
  recetario (la ruta lo dice, firmado); lo demás sigue en `no-store`.
- **API-REC-02 y 03:** cada receta suma `origin` (`OWN` o `BE_RECIPE_BOOK`), `copiedFrom` y `proposal`; API-REC-03 lee
  también una receta del recetario. Editar o cambiar la imagen de una del recetario es el mismo 404 de siempre.
- **API-NUT-07 y 10:** una opción puede citar una versión de una receta del recetario.

## 3. Decisiones del continuador (a ratificar)

- **REC-D01 · WebP de calidad 78 y esfuerzo 6, medido.** Con las tres fotos del paquete de Nutrición (1254 × 1254, PNG de
  2,5 MB) y sharp 0.35: la grande pesa de 146 a 178 kB y la miniatura de 24 a 29 kB, contra 263 a 302 kB del JPEG de antes.
  La calidad 78 es la más alta del rango pedido que deja la grande cerca de 150 kB (a 80, 169-206 kB). El esfuerzo 6 baja
  otro 5 % por unos 0,4 s de CPU por subida, que pasa una vez. Las dos medidas salen del original, no una de la otra.
- **REC-D02 · Los medios de antes, perezosos e idempotentes, no con una migración de datos.** Las migraciones de BE son SQL
  y corren en el despliegue, donde no hay sharp; una migración de datos en Node correría sobre todas las fotos aunque nadie
  las pida. La primera lectura con variante de un JPEG de antes genera las dos variantes desde lo guardado, fuera de la
  transacción, y las guarda con `ON CONFLICT DO NOTHING` (dos lecturas a la vez generan lo mismo; la segunda no escribe).
  Si no se pudiera generar, se sirve lo guardado. Lo de antes no se reescribe nunca.
- **REC-D03 · Sin variante, lo guardado.** La APK publicada pide sin variante: recibe la grande WebP de una subida nueva
  (Android la decodifica) o el JPEG de antes, por la misma ruta y con la misma respuesta de API-MED-03. Las variantes son
  solo de la imagen de una receta: la foto de una comida sigue en JPEG (la APK valida el tipo al subirla) y la imagen de un
  ejercicio, también (es otro frente; puede sumarse igual después).
- **REC-D04 · Una sola copia por huella, del mismo dueño.** Si el dueño ya tiene una imagen de receta disponible con el
  mismo SHA-256 de lo recibido, la misma procedencia y la misma autoría, API-MED-02 responde ese medio (con su `mediaId`, no
  el de la intención) y la intención queda pendiente, sin bytes. La búsqueda va siempre con el dueño: nunca se mira, se
  reusa ni se revela un medio de otro. El website ya asocia el `mediaId` de la respuesta.
- **REC-D05 · Una receta del recetario es una receta sin profesional**, con su fila en `receta_del_recetario` (la base lo
  exige al confirmar), como un alimento de BE (DL-180). Se lee con las mismas piezas que una propia.
- **REC-D06 · La copia reusa el mismo medio.** La regla de la base de la imagen de una receta (DL-119) suma dos casos: la
  receta es del recetario, o el medio ya es la imagen de una receta del recetario. No se duplican bytes ni hay un medio sin
  dueño: el medio sigue siendo de quien lo subió.
- **REC-D07 · Quién lee la imagen del recetario:** cualquier profesional de Nutrición verificado y habilitado, y la persona
  con un plan activado que ofrece esa receta (o una copia), con el PDP del profesional del plan. Mientras la propuesta
  espera, la foto sigue siendo solo de quien la propuso.
- **REC-D08 · La cesión de la foto, versionada y registrada.** El texto vive en el dominio (`CESION_DE_LA_FOTO`, versión
  `REC-CESION-FOTO-1`), se muestra entero al proponer y se acepta con una casilla. La propuesta guarda la versión, el
  SHA-256 del texto y el momento; una versión vieja no vale (422). Sin foto no hay cesión. **El texto es del continuador y
  lo tiene que validar el abogado** (§6).
- **REC-D09 · Lo cargado a mano no se propone.** Lo propio no se comparte (NUA-D14), y una receta del recetario la tiene que
  poder citar cualquiera. La propuesta lo dice con la ruta del ingrediente, y Administración lo vuelve a mirar al sumarla.
- **REC-D10 · La lectura del recetario, guardable.** La imagen de una receta del recetario no es un dato de nadie: su ruta
  vale de 6 a 7 horas (vence en la hora redonda siguiente a las 6 horas, así la misma imagen tiene la misma ruta durante una
  hora) y su respuesta es `private, max-age, immutable`: el navegador la reusa. La lista del recetario trae las rutas ya
  firmadas: no hace falta un acceso (ni una fila de auditoría) por cada miniatura. El acceso uno por uno (API-MED-03) sigue
  auditado como siempre, y lo privado sigue igual: 15 minutos, sin caché y una fila por acceso (08 §21).
- **REC-D11 · La semilla es un comando, no una migración.** `node apps/api/dist/nutricion/comando-del-recetario.js
  sembrar --confirmo-escritura --operador "<quién>"`, idempotente por el código editorial (R001 a R066). Escribe sin más
  solo en una base local; contra otra pide `--base-remota-autorizada`. **No se corrió contra test:** lo decide Dirección.
  La CI la corre en sus bases efímeras (la prueba de integración y los recorridos).
- **REC-D12 · Sin procedencia nueva.** «Aportada por una persona» (`PERSON_PROVIDED`) ya dice que no la generó una IA, y
  la APK publicada valida la procedencia con una lista cerrada: un valor nuevo le rompería la lectura del plan. Quién la
  aportó queda en la autoría declarada y en la propuesta.
- **REC-D13 · Sumar una propuesta crea otra receta**, del recetario, con el contenido de la versión propuesta recalculado:
  la versión la firma quien la propuso y la suma el administrador (su fila y la procedencia). La receta del profesional
  sigue siendo suya y dice que está en el recetario.
- **REC-D14 · Una propuesta por vez.** Mientras una espera no se propone otra; una rechazada se puede volver a proponer, y
  una versión nueva de una sumada también (Administración la ve con la sumada entre sus parecidas).
- **REC-D15 · Las plantillas de Nutrición no llevan recetas** (DL-119: la porción se arma en el plan de cada persona), así
  que no se les sumó el recuadro. El asistente de 7 pasos no se tocó (sale en DL-193).
- **REC-D16 · Fuera de este paquete:** retirar una receta del recetario y que Administración cambie su foto.
- **REC-D17 · La página pasa a llamarse «Recetas»**, con las pestañas «Mis recetas» y «Recetario de BE»; la barra sigue
  diciendo «Mis recetas», que es adonde lleva.

## 4. La APK publicada (0.31) y lo que le falta (DL-194, APK 0.32)

La APK no se toca. Lo que ya lee sigue igual:

- «Hoy» y el carrusel dan `image: { mediaId }` y la APK pide API-MED-03 **sin variante**: recibe la misma forma de
  respuesta y, en una subida nueva, la grande WebP de 1200 px; en una de antes, el JPEG de 1600 px. Una receta del
  recetario en el plan de la persona se le muestra igual.
- La foto de una comida sigue en JPEG y la respuesta de API-MED-02 dice `image/jpeg`, como valida su dominio.
- La procedencia no suma valores (REC-D12).

Lo que le falta, exactamente, para DL-194:

1. **Pedir la miniatura** (`accederAMedio(token, mediaId, 'thumbnail')`) en el carrusel de opciones, las tarjetas de «Hoy»
   y el historial, y **la grande** (`'large'`) en el detalle de la receta. `cargador-de-imagen.ts` tiene que llevar la
   variante en su clave de memoria, como `lib/medios.ts` del website.
2. **Achicar antes de subir** la foto de una comida con `medidasAlAchicar` (1600 px) y `expo-image-manipulator`, en JPEG
   (la foto de una comida se sigue guardando en JPEG), una sola vez al elegirla, para que el reintento suba lo mismo.
3. **Congelar sus lecturas nuevas** (DL-152) al publicar: API-MED-03 con `variant`.
4. Si se quiere, mostrar «Del Recetario de BE» en el detalle de una receta del plan: hoy la APK no recibe el origen (la
   instantánea del plan no lo lleva).

## 5. Pruebas

- **Dominio** (`packages/domain/src/recetario.test.ts`, TEST-REC-030 a 036): las parecidas, cuándo se puede proponer, la
  cesión, `medidasAlAchicar`, los límites, los contratos y el vocabulario del copy. Ajustadas: el conteo de las operaciones
  de nutrición del OpenAPI (69) y los tipos de API-MED-04.
- **API, unitarias** (`procesamiento-de-imagen.spec.ts`, `rutas-firmadas.spec.ts`, `semilla-del-recetario.spec.ts`;
  TEST-REC-001 a 007): las variantes en WebP y sus medidas, la foto de una comida en JPEG, las variantes desde lo guardado,
  la variante y la caché firmadas, el vencimiento redondeado, las 66 recetas con la forma de API-REC-01 y la base local.
- **API, integración en la CI** (`test/integration/recetario-e-imagenes.int-spec.ts`, TEST-REC-010 a 019): variantes y
  WebP; los medios de antes sin variante (como la APK) y con variante (generadas una vez); la foto de una comida sin
  cambios; la huella sin filtrar entre dueños; la semilla dos veces; el recetario para Nutrición y no para la persona ni
  para otra área; copiar con la misma imagen y sin bytes nuevos; proponer con la cesión registrada; lo cargado a mano;
  Administración con autor y parecidas, rechazar con motivo y sumar; la imagen guardable después de sumar; una receta del
  recetario como opción del plan, que la persona lee; y la base sosteniendo las reglas. Además, `contrato.int-spec.ts`
  ejercita RCT-01 a 05 y MED-03 con la variante, y `medios.int-spec.ts` espera WebP en la imagen de una receta.
- **Website** (`apps/web/test/recetario-e-imagenes.test.mjs`, TEST-REC-020 a 027) y `scripts/retorno-seguro.test.mjs`
  (volver al recetario después de entrar).
- **Recorrido de navegador** (`test/navegador/recorridos.mjs`, `recetario`; TEST-REC-040): el recetario → copiar → cargar
  la imagen desde el cajón del editor del plan, con la subida achicada en el navegador.

## 6. Lo que queda

- Ratificar REC-D01 a REC-D17.
- **Pendiente legal: la cesión de la foto.** Para el legajo legal (D-8 de DL-164, fuera del repositorio público; en el
  repositorio no hay un archivo de preguntas para el abogado), la pregunta: «Un profesional propone una receta suya al
  Recetario de BE y acepta este texto (`CESION_DE_LA_FOTO`, versión `REC-CESION-FOTO-1`): ¿alcanza para que BE muestre la
  foto a todos los profesionales de Nutrición y a sus personas mientras la receta esté en el recetario? ¿Hace falta que
  pueda retirarla, y con qué efecto sobre los planes que ya la citan? ¿Qué pasa si la foto resulta de un tercero (Ley
  11.723), y si muestra a una persona (Ley 25.326)?». BE registra la versión del texto, su SHA-256, el momento y quién lo
  aceptó.
- **Cargar el recetario en test:** lo decide Dirección (REC-D11). Las 66 entran sin foto; las fotos del paquete de
  generación (`EVIDENCIA/RECETAS-AMPLIACION/`) todavía no existen.
- La APK (§4, DL-194).
- Las miniaturas de «Mis recetas» y del cajón piden un acceso cada una (privadas, auditadas, con la memoria de la pestaña):
  con muchas recetas con foto, firmarlas en la lista como el recetario.
- Retirar una receta del recetario y cambiar su foto desde Administración (REC-D16); las variantes de la imagen de un
  ejercicio.
- Mirarlo en pantalla (1920 × 1080, Windows al 125 %, navegador al 75 %) y con un lector de pantalla: por la memoria del
  equipo no se corrió `next build` ni el typecheck del website en local; los corre la CI.
