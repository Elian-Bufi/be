# WP-NUTRICION-ALIMENTOS · Los alimentos del catálogo y la imagen de la receta (segundo tramo de la planificación)

> **El pedido de Dirección (16/11, alcance aprobado):** corregir y retirar los alimentos cargados a mano, con versiones;
> el origen en tres niveles a la vista en el buscador; que Administración certifique; un ícono por grupo de alimentos;
> la imagen de la receta desde el principio; los campos del paso 4 del asistente con el estilo de BE; y, si alcanza,
> medidas caseras, micronutrientes y platos argentinos.
>
> Rama `wp-nutricion-alimentos`, sobre `wp-nutricion-planificacion` (#290). **No se integra sola:** Dirección integra la
> planificación entera junta. DEUDA_LEGAJO **DL-180**. Las decisiones de continuador (**NUA-D01 a NUA-D13**) están **a
> ratificar**. Este tramo llega hasta NUA-07; **NUA-08 a NUA-10 quedan declarados como el tramo siguiente**, sin nada a
> medias en el código.

## 0. En criollo

Un alimento cargado a mano se corrige como una receta: nace una versión nueva, y lo que ya lo citaba (un plan activado,
una receta, un registro) conserva la versión que citaba. Si ya no sirve, se retira: deja de aparecer en el buscador, pero
no se borra, y donde ya está citado se ve con una marca discreta de «retirado». En el buscador cada alimento dice de dónde
sale con tres niveles: «Verificado» (la tabla oficial o lo que Administración certificó con una fuente), «Tuyo» y «De otro
profesional», que va después y se mira antes de sumarlo. Administración revisa lo cargado a mano viendo solo el nombre y
los valores, y puede marcarlo como equivalente de uno de la tabla oficial, que el buscador sugiere. Cada alimento lleva el
ícono de su grupo. La imagen de una receta se elige al crearla y se carga sola al guardarla. Los nombres del asistente usan
los campos de BE.

## 1. Alcance (NUA-01 a NUA-10)

| ID | Qué | Estado | Dónde |
|---|---|---|---|
| NUA-01 | Corregir un alimento cargado a mano: una versión nueva; lo activado, las recetas y los registros conservan la suya | Hecho | API-ALI-01 y 02, `alimentos.service.ts`, «Mis alimentos» (`/pro/foods`) |
| NUA-02 | Retirar: sale del buscador, no se borra; lo que lo cita lo muestra con la marca «retirado» | Hecho | API-ALI-03 y 04, `planes.service.ts`, `totales-del-plan.ts`, `comida-del-editor.tsx` |
| NUA-03 | Los tres niveles de origen a la vista; lo de otro profesional va después, con aviso y su composición antes de sumarlo | Hecho | `catalogo.service.ts`, `http/busqueda.ts`, `cuadro-de-la-opcion.tsx` |
| NUA-04 | Administración certifica con una fuente o marca un equivalente de la tabla oficial, que el buscador sugiere | Hecho | API-ALI-05 a 07, `revision-de-alimentos.service.ts`, `/admin/foods` |
| NUA-05 | Un ícono por grupo de alimentos, de la familia de BE, en el buscador y en las opciones | Hecho | `iconos.ts`, `alimentos-del-catalogo.ts`, la siembra de la migración |
| NUA-06 | La imagen de la receta desde el principio: se elige al crearla y se carga sola al guardar; también en «Receta nueva» del plan | Hecho | `recipes/*`, `editor.tsx` (el cuadro de la receta nueva) |
| NUA-07 | Los nombres del paso 4 (y del paso 3) del asistente con los campos comunes | Hecho | `pasos-del-asistente.tsx`, `globals.css` |
| NUA-08 | Medidas caseras con su equivalencia en gramos | **Tramo siguiente** | §5 |
| NUA-09 | Micronutrientes clave: sodio, fibra, hierro y calcio | **Tramo siguiente** | §5 |
| NUA-10 | Platos argentinos comunes, solo con una fuente citable | **Tramo siguiente** | §5 |

## 2. Las operaciones (familia ALI, DL-180)

| ID | Método y ruta | Qué |
|---|---|---|
| API-ALI-01 | `GET /nutrition/catalog-items/mine` | Los propios cargados a mano (también los retirados), con su token, su grupo, si se comparten y lo decidido |
| API-ALI-02 | `PATCH /nutrition/catalog-items/{id}` | Corregir: versión nueva si cambian el nombre o la composición; `group` cambia el grupo sin versión |
| API-ALI-03 | `POST /nutrition/catalog-items/{id}/retirement` | Retirar: una versión RETIRADO; retirarlo otra vez no cambia nada |
| API-ALI-04 | `POST /nutrition/catalog-items/lookup` | Los que se ven, por identidad (hasta 200), también los retirados: el editor del plan |
| API-ALI-05 | `POST /admin/foods/query` | Administración: lo cargado a mano para revisar, con filtro de estado y texto |
| API-ALI-06 | `POST /admin/foods/{id}/decisions` | Administración: certificar con fuente, equivalente de uno oficial o quitar lo decidido |
| API-ALI-07 | `POST /admin/foods/verified/query` | Administración: los de la tabla oficial, para elegir el equivalente |

Los cambios en lo que ya existía, todos aditivos (un campo ausente vale lo de siempre):
- **API-NUT-13-BUSQUEDA** (solo el website): cada fila suma `foodGroup`, `originLevel`, `certification` y
  `verifiedEquivalent`, opcionales. Dentro de cada grupo de coincidencia, lo de otro profesional va después; el cursor
  suma el nivel (uno de antes se sigue leyendo).
- **API-INT-NUT-01**: `group`, opcional.
- **API-PLN-01** (solo el website): cada ítem suma `foodGroup` y `retired`, opcionales.
- **API-NUT-10**: un borrador que ya cita un alimento retirado se guarda (NUA-D03).
- **La APK instalada recibe exactamente lo de antes:** ninguna de las respuestas que lee (las congeladas en
  `packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json`) cambia. No hace falta una capacidad de cliente.

## 3. El modelo de datos y las migraciones

Dos migraciones nuevas, que solo agregan:
- `20261119120000_tipos_de_alimentos_del_catalogo`: los hechos `ElementoDeCatalogoVersionado` y
  `ElementoDeCatalogoRetirado` (aparte: PostgreSQL no usa un valor de enum en la transacción que lo agrega).
- `20261119120100_alimentos_del_catalogo`:
  - `grupo_de_alimento` (NUA-05): el grupo de cada alimento, un hecho aparte de sus versiones; el vigente es el de mayor
    número. Lo elige solo quien lo cargó (trigger) o lo siembra BE. Siembra: los 393 de la tabla oficial (los 385 de DL-141
    con el grupo de su curaduría y los 8 de DL-119) y los 40 de demostración de WP-04.
  - `alimento_compartido` (NUA-03, NUA-D05): desde cuándo un alimento cargado a mano lo ven los demás profesionales. Solo
    cargas a mano (trigger).
  - `revision_administrativa_de_alimento` (NUA-04): cada decisión de Administración es una fila; la vigente es la de mayor
    número. Certificar exige la fuente; un equivalente nombra a otro alimento de la tabla oficial disponible; la escribe
    solo un administrador con su rol vigente (triggers y CHECK).
  - Las tres son de solo agregar (`be_solo_agregar`, sin UPDATE, DELETE ni TRUNCATE).
- **Corregir y retirar no necesitan tablas:** usan la cadena de versiones de siempre (`version_de_elemento_nutricional`,
  REG-06-99 a 101). El token es «v» y el número de versiones del alimento: las tablas del catálogo son de solo agregar y
  no admiten una columna de versión que cambie.

Las pruebas de integración corren en la CI (Testcontainers con PostgreSQL 16), con la deriva de `schema.prisma` contra
las migraciones (`schema.int-spec.ts`).

## 4. Decisiones de continuador (a ratificar)

- **NUA-D01 · Corregir es una versión nueva, como en las recetas (DL-120).** Mismo bloqueo (el alimento con
  `FOR NO KEY UPDATE` y el dueño en el mismo `WHERE`) y mismo conflicto (409 VERSION_CONFLICT contra la versión vista). Con
  el mismo nombre y los mismos valores no nace una versión. Lo ajeno, lo sembrado, lo importado y lo inexistente son el
  mismo 404.
- **NUA-D02 · Retirar es terminal en este tramo.** La versión RETIRADO conserva el nombre y la composición (así lo que la
  cita la sigue mostrando). Uno retirado no se corrige (422); volver a ofrecerlo queda para cuando haga falta.
- **NUA-D03 · Un borrador que ya cita uno retirado se sigue guardando.** Antes, guardar daba CATALOG_REFERENCE_INVALID y
  bloqueaba cualquier otro cambio del borrador. Ahora la fila lo marca «retirado», la estimación lo calcula con su última
  composición, y validar y activar lo señalan: no se planifica nada nuevo con él (REG-06-99). Un plan nuevo, una plantilla
  o una comida habitual no lo aceptan.
- **NUA-D04 · Lo citado se lee por su identidad** (API-ALI-04), no buscando su nombre: así vuelve también lo retirado, y
  con su grupo.
- **NUA-D05 · Qué se comparte.** Lo cargado a mano desde DL-180 lo ven los demás profesionales de Nutrición, como «De otro
  profesional», con su nombre y sus valores; el formulario lo dice a la vista y pide no escribir datos de personas en el
  nombre. **Lo cargado antes no se comparte solo:** su autor lo cargó creyendo que era solo suyo, y un nombre puede tener
  el de una persona. Se comparte cuando su autor lo corrige (con el mismo aviso). Nunca se ve quién lo cargó, ni planes,
  ni personas.
- **NUA-D06 · Los tres niveles y el orden.** «Verificado»: la tabla oficial (USDA FoodData Central · SR Legacy) o lo
  certificado; «Tuyo»; «De otro profesional». Lo importado de Open Food Facts y lo de demostración conservan su origen, sin
  un nivel más. Lo de otro profesional va después **dentro de cada grupo de coincidencia** (igual, empieza con, contiene):
  un nombre igual de otro profesional sigue antes que uno tuyo que solo contiene la palabra. Elegirlo abre «mirarlo antes
  de sumarlo»: el aviso y su composición cada 100 g, con «Sumarlo» y «Volver a buscar».
- **NUA-D07 · La certificación es de una versión; el equivalente, del alimento.** Si su autor lo corrige, la versión nueva
  vuelve a «sin revisar» (el formulario se lo avisa). El equivalente solo puede ser de la tabla oficial y estar disponible;
  no toca los planes viejos. Administración revisa solo cargas a mano (no Open Food Facts) y ve el nombre, los valores, el
  grupo y la versión: nunca quién lo cargó ni a quién se le indicó. La auditoría guarda la operación sin los textos.
- **NUA-D08 · El grupo es un hecho aparte, no una versión.** Trece grupos: doce con su ícono y «Otros», con el genérico
  (`alimento`). Sin grupo (lo cargado antes, lo importado), el genérico. Los doce íconos nuevos siguen las reglas de la
  familia (`iconos.test.ts`) y son una **propuesta a validar por Dirección**: el taller de diseño (fuera del repositorio) los
  suma a su catálogo con la próxima tanda. El catálogo decía «un ícono en cada renglón sería el mismo dibujo repetido»: con
  un dibujo por grupo ya no lo es.
- **NUA-D09 · Una familia propia, ALI.** No es NUT ni ADM: no choca con otras ramas que sumen operaciones a esas familias.
  Las de Administración van bajo `/admin/foods`, con la sesión administrativa y el segundo factor de WP-ADMINISTRACION.
- **NUA-D10 · «Mis alimentos»** es un lugar propio del espacio profesional (`/pro/foods`), junto a «Mis recetas», con
  corregir y retirar; los alimentos se siguen cargando desde la opción del plan («Crearlo a mano»), que ahora pide también
  el grupo y la fibra (opcional: vacía es «sin dato»).
- **NUA-D11 · La imagen de la receta.** Se elige en el formulario de la receta nueva y se carga al guardar, con la versión
  que devolvió la creación. Si la receta quedó guardada y la imagen no, la receta guardada retoma lo elegido con
  «Reintentar la imagen», que nunca vuelve a crear la receta. En «Receta nueva» del plan: con la imagen cargada, el cuadro
  se cierra y el plan lo dice; si falló, el paso de la foto la muestra con el reintento; sin imagen, la ofrece como antes.
- **NUA-D12 · El paso 3 tenía el mismo campo suelto que el 4:** se arregló igual.
- **NUA-D13 · Corregir comparte.** Corregir un alimento de antes de DL-180 lo comparte (el formulario lo dice). Si Dirección
  prefiere que compartir sea una elección aparte, es un interruptor más en el mismo formulario.

## 5. El tramo siguiente (declarado, sin nada a medias)

- **NUA-08 · Medidas caseras.** Por alimento, unidades con su equivalencia («1 taza = 240 g», «1 unidad = 50 g»), a la
  vista donde se elige la cantidad. El plan las usa y, si alcanza, el registro de la persona; la cuenta siempre en gramos.
  Necesita: una tabla de medidas por alimento (aditiva), la cantidad del ítem con su medida (campo opcional en la
  estructura del plan) y, para la APK, una capacidad de cliente y un interceptor como `training-set-kinds-1` (DL-152,
  DL-178): la APK instalada no conoce la medida y tiene que seguir recibiendo gramos.
- **NUA-09 · Micronutrientes clave** (sodio, fibra, hierro y calcio). La composición suma `sodiumMg`, `ironMg` y
  `calciumMg` opcionales (la fibra ya está); sin dato es «sin dato», nunca cero. Los de la tabla oficial salen de USDA SR
  Legacy (nutrientes 1093, 1089 y 1087), con una migración de correcciones como la de DL-141. Se ven en la composición
  cada 100 g y en los totales de la opción y del día del profesional. La composición viaja en la instantánea: la APK
  instalada la lee con un esquema estricto, así que también va con una capacidad de cliente.
- **NUA-10 · Platos argentinos** (milanesa, empanada, tarta, guiso…). **No se inventan valores.** USDA SR Legacy no tiene
  esos platos con un registro razonable, y las tablas argentinas (ARGENFOODS de la UNLu, la de la SARA) no declaran una
  licencia que permita copiarlas a BE: hay que pedir permiso o usar una fuente abierta. El camino propuesto, sin permiso de
  nadie: **recetas de ejemplo** armadas con ingredientes de la tabla oficial (por ejemplo, la milanesa: carne vacuna, huevo,
  pan rallado y aceite), con la cuenta de siempre (`SUM_SOURCE_PER_100G_V1`), la fuente de cada ingrediente y la nota de que
  la composición es la de la receta, no la de un plato medido. Queda para que Dirección elija el camino.

## 6. Retirar «Proteína en polvo» en el entorno de test (después de integrar y desplegar)

El alimento que Elián cargó mal se retira con la operación nueva, **no a mano en la base**. Lo hacen Dirección y el
continuador juntos:

1. Integrar la planificación entera y desplegar test (la API aplica las dos migraciones de DL-180 al arrancar).
2. Entrar al website de test como profesional de Nutrición, con la cuenta con la que se cargó.
3. Ir a «Mis alimentos» (barra del espacio profesional). Buscar «Proteína en polvo» en la lista; mirar su versión, su
   fecha y sus valores para confirmar que es el cargado mal (si hubiera dos con el mismo nombre, el de los valores
   equivocados).
4. «Retirar» → leer qué pasa → «Retirar». Queda «Retirado», con una versión más.
5. Comprobar:
   - en el cuadro de una opción, buscar «proteína en polvo»: ya no aparece;
   - en los planes que lo citaban, la fila sigue y dice «retirado»; los activados no cambian y la persona sigue viendo lo
     mismo;
   - en un borrador que lo cite, cambiarlo por otro antes de activar (validar lo señala).
6. Si hiciera falta por la API: `GET /api/v1/nutrition/catalog-items/mine` (su `catalogItemId` y su `version`) y
   `POST /api/v1/nutrition/catalog-items/{catalogItemId}/retirement` con `{ "expectedVersion": "v…" }` y una
   `Idempotency-Key`. Nada por SQL.

Como se cargó antes de DL-180, no se compartió con nadie: retirarlo no lo muestra a otros profesionales.

## 7. Pruebas

- **Integración** (`test/integration/alimentos-del-catalogo.int-spec.ts`, en la CI con PostgreSQL 16): corregir con el plan
  activado y un borrador nuevo; la versión vista (409); dos correcciones a la vez, ordenadas por el bloqueo con la barrera
  de `pg_stat_activity`; el mismo 404 para lo ajeno, lo sembrado y lo inexistente; retirar (el buscador, la consulta por
  identidad, el borrador que se guarda, validar, activar y un plan nuevo); los tres niveles y el orden; lo de antes de
  DL-180 sin compartir hasta corregirlo; Administración (sin fuente, certificar, la versión nueva sin certificar, el
  equivalente, quitar, el 404 y el 403); el grupo (al cargarlo, al corregirlo, la siembra); las guardias de la base.
- **Unidad de la API** (`http/busqueda.spec.ts`): el cursor con el nivel y sin él; el orden con nivel; ninguna constante en
  el ORDER BY sin nivel.
- **Dominio** (`alimentos-del-catalogo.test.ts`): el nivel, los grupos y sus íconos, y los contratos opcionales.
- **Website** (`alimentos-del-catalogo.test.mjs`, `imagen-de-la-receta.test.mjs`): la marca de retirado, el ícono, mirar
  antes de sumar, las sugerencias, el formulario (la fibra sin dato), «Mis alimentos» y la consola.
- **La siembra** (`scripts/grupos-de-alimentos.test.mjs`): cada alimento de la curaduría, una vez y con su grupo.
- Cada punto con al menos una mutación verificada (con el defecto, la prueba falla): la lista está en el PR.
- **Capturas** en la CI (`capturas-de-la-planificacion`), en Claro y en Azul noche, a 1280, 1536 y 1920.

## 8. Lo que queda abierto

- NUA-08 a NUA-10 (§5).
- Ratificar NUA-D01 a NUA-D13; validar los doce íconos de los grupos y sumarlos al taller de diseño.
- El paso 2 del asistente de Entrenamiento tiene el mismo campo suelto que tenían los pasos 3 y 4 de Nutrición: no se tocó
  (otra rama trabaja ahí).
- Una receta que cita un ingrediente retirado lo conserva, pero el editor de recetas todavía no lo marca «retirado».
- Administración no revisa lo importado de Open Food Facts (solo cargas a mano).
- Volver a ofrecer un alimento retirado.
