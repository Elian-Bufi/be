# WP-NUTRICION-ALIMENTOS · Los alimentos del catálogo y la imagen de la receta (segundo tramo de la planificación)

> **El pedido de Dirección (16/11, alcance aprobado):** corregir y retirar los alimentos cargados a mano, con versiones;
> el origen a la vista en el buscador; que Administración certifique; un ícono por grupo de alimentos; la imagen de la
> receta desde el principio; los campos del paso 4 del asistente con el estilo de BE; y, si alcanza, medidas caseras,
> micronutrientes y platos argentinos.
>
> **Cambio de dirección de Dirección (Elián, 19/11):** «si carga algo, que sea propio; Administración debe poder ver quién
> lo cargó y tener control; si hay x profesionales pidiendo eso, lo puede meter al canon; es un problema si cargan todos y
> son compartidos». **Los alimentos cargados a mano no se comparten entre profesionales.** Deja sin efecto NUA-D05 y
> NUA-D13 y reemplaza el «compartir con control» que se había pedido para el segundo tramo esa misma mañana (§10).
>
> Primer tramo: rama `wp-nutricion-alimentos` (#293), sobre `wp-nutricion-planificacion` (#290). Segundo tramo: rama
> `wp-nutricion-alimentos-2`, sobre la primera. **No se integran solas:** Dirección integra la planificación entera junta.
> DEUDA_LEGAJO **DL-180**. Las decisiones de continuador (**NUA-D01 a NUA-D23**) están **a ratificar**. El segundo tramo
> llega hasta NUA-08 (las medidas caseras, en el website); **NUA-09 y NUA-10 quedan declarados como el tramo siguiente**,
> sin nada a medias en el código.

## 0. En criollo

Un alimento cargado a mano es de quien lo cargó: lo ve y lo usa solo él. Si tiene un error, se corrige como una receta:
nace una versión nueva, y lo que ya lo citaba (un plan activado, una receta, un registro) conserva la versión que citaba.
Si ya no sirve, se retira: deja de aparecer en el buscador, pero no se borra, y donde ya está citado se ve con una marca
discreta de «retirado». En el buscador cada alimento dice de dónde sale: «Verificado» (la tabla oficial, lo que
Administración sumó al canon o lo que certificó con una fuente) o «Tuyo». Administración ve todo lo cargado a mano, con el
nombre del profesional que lo cargó (nunca a quién se lo indicó), agrupado por nombre parecido y con cuántos profesionales
cargaron algo así; lo que conviene a todos lo **suma al canon**, con su fuente, y a cada autor el buscador le sugiere el
verificado antes del suyo. Cada alimento lleva el ícono de su grupo y puede tener **medidas caseras** («1 taza = 240 g»):
en el plan se elige la cantidad con ellas, la cuenta va en gramos y la persona ve los gramos. La imagen de una receta se
elige al crearla y se carga sola al guardarla.

## 1. Alcance (NUA-01 a NUA-10)

| ID | Qué | Estado | Dónde |
|---|---|---|---|
| NUA-01 | Corregir un alimento cargado a mano: una versión nueva; lo activado, las recetas y los registros conservan la suya | Hecho | API-ALI-01 y 02, `alimentos.service.ts`, «Mis alimentos» (`/pro/foods`) |
| NUA-02 | Retirar: sale del buscador, no se borra; lo que lo cita lo muestra con la marca «retirado» | Hecho (y, en el segundo tramo, las bajas de §9) | API-ALI-03 y 04, `planes.service.ts`, `totales-del-plan.ts`, `comida-del-editor.tsx` |
| NUA-03 | El origen a la vista: «Verificado» o «Tuyo» (desde el segundo tramo, sin «De otro profesional»: NUA-D14) | Hecho | `catalogo.service.ts`, `cuadro-de-la-opcion.tsx` |
| NUA-04 | Administración certifica con una fuente o marca un equivalente verificado, que el buscador de su autor sugiere; desde el segundo tramo, ve quién lo cargó, agrupa los parecidos y suma al canon (NUA-D15 y D16) | Hecho | API-ALI-05 a 09, `revision-de-alimentos.service.ts`, `/admin/foods` |
| NUA-05 | Un ícono por grupo de alimentos, de la familia de BE, en el buscador y en las opciones | Hecho | `iconos.ts`, `alimentos-del-catalogo.ts`, la siembra de la migración |
| NUA-06 | La imagen de la receta desde el principio: se elige al crearla y se carga sola al guardar; también en «Receta nueva» del plan; si la sesión vence en medio, se avisa al volver (NUA-D19) | Hecho | `recipes/*`, `editor.tsx` |
| NUA-07 | Los nombres del paso 4 (y del paso 3) del asistente con los campos comunes | Hecho | `pasos-del-asistente.tsx`, `globals.css` |
| NUA-08 | Medidas caseras con su equivalencia en gramos (aprobadas el 16/11) | **Hecho en el website** (la persona ve los gramos; NUA-D21) | `medidas_caseras_de_alimento`, `formulario-del-alimento.tsx`, `comida-del-editor.tsx` |
| NUA-09 | Micronutrientes clave: sodio, fibra, hierro y calcio (aprobados el 16/11) | **Tramo siguiente** | §5 |
| NUA-10 | Platos argentinos como recetas de ejemplo con ingredientes de la tabla oficial | **Tramo siguiente** | §5 |

## 2. Las operaciones (familia ALI, DL-180)

| ID | Método y ruta | Qué |
|---|---|---|
| API-ALI-01 | `GET /nutrition/catalog-items/mine` | Los propios cargados a mano (también los retirados), con su token, su grupo, sus medidas caseras y lo decidido |
| API-ALI-02 | `PATCH /nutrition/catalog-items/{id}` | Corregir: versión nueva si cambian el nombre o la composición; `group` y `householdMeasures` cambian sin versión |
| API-ALI-03 | `POST /nutrition/catalog-items/{id}/retirement` | Retirar: una versión RETIRADO; retirarlo otra vez no cambia nada |
| API-ALI-04 | `POST /nutrition/catalog-items/lookup` | Los que se ven, por identidad (hasta 200), también los retirados: el editor del plan |
| API-ALI-05 | `POST /admin/foods/query` | Administración: todas las cargas a mano, con quién la cargó (`loadedBy`, su nombre de profesional), filtro de estado y texto |
| API-ALI-06 | `POST /admin/foods/{id}/decisions` | Administración: certificar con fuente, equivalente de uno verificado (la tabla oficial o el canon) o quitar lo decidido |
| API-ALI-07 | `POST /admin/foods/verified/query` | Administración: los verificados (la tabla oficial y el canon), para elegir el equivalente |
| API-ALI-08 | `POST /admin/foods/similar/query` | Administración (segundo tramo): las cargas agrupadas por nombre parecido, con cuántos profesionales distintos cargaron algo así |
| API-ALI-09 | `POST /admin/foods/canon` | Administración (segundo tramo): sumar al canon, con la fuente obligatoria y, si se quiere, las cargas del grupo como equivalentes |

Las de Administración van con la sesión administrativa y el segundo factor de WP-ADMINISTRACION en cada ruta, y quedan en
la auditoría sin los textos.

Los cambios en lo que ya existía, todos aditivos (un campo ausente vale lo de siempre):
- **API-NUT-13-BUSQUEDA** (solo el website): cada fila suma `foodGroup`, `originLevel` («VERIFIED», «YOURS» o ninguno),
  `certification` (también la fuente del canon), `verifiedEquivalent` y `householdMeasures`, opcionales.
- **API-INT-NUT-01**: `group` y `householdMeasures`, opcionales. No hay un campo para compartir (NUA-D14).
- **API-NUT-07 y 10** (la estructura del plan): cada ítem puede llevar `householdMeasure` (la medida elegida y su
  equivalencia); la cantidad tiene que ser la de la medida (HOUSEHOLD_MEASURE_INCONSISTENT). **API-NUT-09** la devuelve
  solo al profesional.
- **API-PLN-01** (solo el website): cada ítem suma `foodGroup` y `retired`, opcionales.
- **API-NUT-10**: un borrador que ya cita un alimento retirado (o que ya no se ve) se guarda (NUA-D03); uno que se suma
  ahora, no (NUA-D17).
- **La APK instalada recibe exactamente lo de antes:** ninguna de las respuestas que lee (las congeladas en
  `packages/domain/fixtures/respuestas-que-lee-la-apk-instalada.json`) cambia. La medida casera no está en la instantánea.

## 3. El modelo de datos y las migraciones

Cinco migraciones nuevas, que solo agregan (la tabla de cada una, escrita con `prisma migrate diff`; las guardias, a mano):
- `20261119120000_tipos_de_alimentos_del_catalogo`: los hechos `ElementoDeCatalogoVersionado` y
  `ElementoDeCatalogoRetirado` (aparte: PostgreSQL no usa un valor de enum en la transacción que lo agrega).
- `20261119120100_alimentos_del_catalogo`: `grupo_de_alimento` (NUA-05, con la siembra de los 393 de la tabla oficial y
  los 40 de demostración), `alimento_compartido` (primer tramo; hoy, historia) y `revision_administrativa_de_alimento`
  (NUA-04). Las tres, de solo agregar.
- `20261119120200_revision_de_lo_compartido` (primer tramo, de la revisión adversaria): la guardia de la revisión pedía lo
  compartido. La reemplaza la del segundo tramo.
- **`20261120120000_lo_propio_es_propio`** (segundo tramo, NUA-D14 a D16):
  - `alimento_del_canon`: lo que Administración sumó al catálogo verificado, con la fuente (de 1 a 500, obligatoria), el
    origen (la carga de cuyos valores partió) y quién lo sumó. Un administrador con su rol vigente, y solo un alimento de
    BE (importado por BE, sin profesional que lo cargue y sin un producto de Open Food Facts detrás). De solo agregar.
  - `alimento_compartido` se cierra: no admite filas nuevas. Ninguna se borra.
  - La guardia de la revisión ya no pide lo compartido, y acepta como equivalente uno de la tabla oficial o del canon.
- **`20261120130000_medidas_caseras`** (segundo tramo, NUA-08): `medidas_caseras_de_alimento`, las medidas de un alimento
  como un hecho aparte de sus versiones (la vigente es la de mayor número): un arreglo de a lo sumo cuatro, cada una con
  su tipo y una equivalencia mayor que cero y de hasta 5000 (CHECK con `jsonb_path_exists`). Las define quien cargó el
  alimento; sin autor, las sembraría BE desde una fuente. De solo agregar.
- **Corregir y retirar no necesitan tablas:** usan la cadena de versiones de siempre (REG-06-99 a 101).
- **El canon** son alimentos `CONTROLLED_IMPORT` sin profesional que los cargue (de todos, como la tabla oficial), con su
  versión, su grupo sembrado sin autor y su fila de `alimento_del_canon`. Ningún enum nuevo.

Las pruebas de integración corren en la CI (Testcontainers con PostgreSQL 16), con la deriva de `schema.prisma` contra
las migraciones (`schema.int-spec.ts`).

## 4. Decisiones de continuador (a ratificar)

Primer tramo:
- **NUA-D01 · Corregir es una versión nueva, como en las recetas (DL-120).** Mismo bloqueo y mismo conflicto (409
  VERSION_CONFLICT contra la versión vista). Con el mismo nombre y los mismos valores no nace una versión. Lo ajeno, lo
  sembrado, lo importado y lo inexistente son el mismo 404.
- **NUA-D02 · Retirar es terminal.** La versión RETIRADO conserva el nombre y la composición. Uno retirado no se corrige
  (422).
- **NUA-D03 · Un borrador que ya cita uno retirado se sigue guardando**; validar y activar lo señalan. Un plan nuevo, una
  plantilla o una comida habitual no lo aceptan (y, desde NUA-D17, tampoco un borrador que lo suma ahora).
- **NUA-D04 · Lo citado se lee por su identidad** (API-ALI-04), no buscando su nombre.
- ~~**NUA-D05 · Qué se comparte.**~~ **Sin efecto (Dirección, 19/11):** lo cargado a mano no se comparte (NUA-D14).
- **NUA-D06 · Los niveles.** «Verificado»: la tabla oficial, el canon o lo certificado; «Tuyo». Lo importado de Open Food
  Facts y lo de demostración conservan su origen, sin un nivel más. (El nivel «De otro profesional» y «mirar antes de
  sumar» se quitaron con NUA-D14.)
- **NUA-D07 · La certificación es de una versión; el equivalente, del alimento.** Si su autor lo corrige, la versión nueva
  vuelve a «sin revisar». Los planes viejos no cambian.
- **NUA-D08 · El grupo es un hecho aparte, no una versión.** Trece grupos; los doce íconos son una **propuesta a validar**.
- **NUA-D09 · Una familia propia, ALI.**
- **NUA-D10 · «Mis alimentos»** es un lugar propio (`/pro/foods`), no va en la barra.
- **NUA-D11 · La imagen de la receta** se elige al crearla y se carga al guardar; si falla, el reintento nunca vuelve a
  crear la receta.
- **NUA-D12 · El paso 3 del asistente** tenía el mismo campo suelto que el 4: se arregló igual.
- ~~**NUA-D13 · Corregir comparte.**~~ **Sin efecto (Dirección, 19/11).**

Segundo tramo (`wp-nutricion-alimentos-2`):
- **NUA-D14 · Lo propio es propio (decisión de Dirección del 19/11).** Lo cargado a mano lo ve y lo cita solo quien lo
  cargó: para cualquier otro profesional es el mismo 404 que lo inexistente por todos los caminos (el buscador, la
  consulta por identidad, una receta, un plan, una plantilla, una comida habitual). Lo que se compartió en el primer
  tramo vuelve a ser propio sin borrar nada: la API ya no lee `alimento_compartido` y la base la cierra. Los planes
  activados, las recetas y los registros que ya lo citaban conservan su copia (la instantánea y la versión de la receta).
  Un borrador de otro profesional que lo citaba lo muestra como «Elemento no disponible» (nunca un nombre que su autor
  corrigió para él solo), y validar lo señala.
- **NUA-D15 · Administración ve quién lo cargó y agrupa los parecidos.** La consola lista todas las cargas a mano con el
  nombre de profesional de quien la cargó (`perfil_profesional.nombre_visible`): un dato de un profesional, no de salud;
  nunca sus personas ni sus planes. La vista «Parecidos» (la primera) agrupa por un nombre normalizado
  (`claveDeNombreParecido`: sin tildes, en minúsculas, sin espacios de más y sin plurales simples —la «s» después de una
  vocal, la «es» después de l, n, r, d, j o z, en palabras de más de tres letras—) y dice cuántos profesionales
  distintos cargaron algo así («7 profesionales cargaron "milanesa de soja"»); lo más cargado va primero. Agrupa sobre las
  últimas 2000 cargas disponibles: es para decidir, no un inventario.
- **NUA-D16 · Sumar al canon.** Crea un alimento verificado de BE (de todos, «Verificado» en el buscador con la fuente a la
  vista) con la fuente obligatoria, partiendo de los valores de una de las cargas (que se pueden corregir). Puede marcar las
  cargas del grupo como equivalentes (viene marcado): a cada autor, su buscador le sugiere el verificado justo antes del
  suyo, con su composición, y lo suyo nunca se reemplaza solo en planes ni en registros. Al crear un alimento con el nombre
  de uno verificado («Avena arrollada»), se avisa antes de guardar («Ya existe "Avena arrollada" verificado: ¿usarlo?»), con
  «Usar el verificado» y «Crear el mío igual». Todo en una transacción, con su clave de idempotencia, y auditado (también
  cada equivalente marcado, como una decisión).
- **NUA-D17 · Un borrador acepta solo lo retirado que ya citaba** (de §9). Uno retirado (o que ya no se ve) que se suma
  ahora —una comida habitual, «Copiar desde otra comida», una receta o un pedido armado a mano— es
  CATALOG_REFERENCE_INVALID, como en un plan nuevo.
- **NUA-D18 · Una receta no cita ninguna versión de un alimento retirado**, tampoco una vieja disponible: una receta nueva o
  una versión nueva no lo suman (el cálculo previo tampoco: el editor de la receta dice que hay un ingrediente que ya no
  está disponible). Las versiones de receta que ya lo citaban lo conservan; si una llega a un borrador, validar y activar lo
  señalan en el ítem de la receta (ya lo hacían: ahora lo sostiene una prueba de integración).
- **NUA-D19 · La imagen de una receta recién creada, con la sesión vencida.** Lo elegido queda en la memoria de la pestaña
  (como la sesión: sobrevive a la entrada y la vuelta, se pierde al recargar; no va en la dirección ni en el navegador
  porque tiene el archivo). Al volver, «Mis recetas» y el plan lo dicen («… quedó guardada, pero la sesión venció mientras
  se cargaba su imagen…») con «Reintentar la imagen», que abre esa receta con lo elegido, y «Ahora no».
- **NUA-D20 · Las medidas caseras son un hecho aparte, como el grupo.** Cuatro tipos (unidad, cucharada, taza, porción),
  cada uno con su equivalencia en la unidad de la composición; las define quien carga el alimento (en el formulario de
  cargar y de corregir); cambiarlas no emite una versión. El ítem del plan guarda la medida elegida y su equivalencia de ese
  momento (`householdMeasure`: tipo, cuántas, equivalencia), y su cantidad sigue en gramos (`count × amountPerUnit`,
  redondeada a 0,1): es la que cuenta. Si su autor cambia la taza después, el plan conserva la suya. **La tabla oficial no
  trae medidas en este tramo:** no se inventan; las de USDA (`food_portion` de SR Legacy) se pueden sembrar después con su
  fuente, como la composición.
- **NUA-D21 · La medida no llega a la persona en este tramo.** La instantánea no la guarda: la persona (y la APK) ven la
  cantidad en gramos, como siempre. Dirección dijo el 19/11 que no hace falta compatibilidad con APK viejas, así que
  mostrarla en la APK no necesita una capacidad de cliente: queda para su próxima versión (§8).
- **NUA-D22 · «Revisar» lleva el foco al formulario** de la consola, por su título (de §9).
- **NUA-D23 · El vocabulario del tramo.** Ubica, no califica: «Verificado», «Tuyo», «Hay una versión verificada de este
  alimento», «Sin revisar». Ni «cumplimiento», «adherencia», «racha», «puntaje», «asesorado» ni «estación»; sin «%».

## 5. El tramo siguiente (declarado, sin nada a medias)

- **NUA-09 · Micronutrientes clave** (sodio, fibra, hierro y calcio; aprobados el 16/11). La composición suma `sodiumMg`,
  `ironMg` y `calciumMg` opcionales (la fibra ya está); sin dato es «sin dato», nunca cero, y si falta un ingrediente el
  total lo dice («sin dato de 1 alimento»). La siembra de DL-141 trae solo energía, proteínas, carbohidratos, grasas y fibra
  (`prisma/datos/catalogo-base/LEEME.md`): los demás salen del mismo CSV oficial de USDA SR Legacy (nutrientes 1093, 1089
  y 1087), con `scripts/catalogo-base/completar-con-las-fuentes.mjs` y una migración de correcciones como la de los cortes
  (`20261019210000`), con una versión nueva de cada alimento. Se ven en la composición cada 100 g, en el aporte de cada
  alimento y en los totales de la opción y del día del profesional; la persona no los ve. Necesita bajar el CSV (no está en
  esta PC) y revisar la coherencia de unidades; no entró en este tramo para no dejar la siembra a medias.
- **NUA-10 · Platos argentinos como recetas de ejemplo** (milanesa, empanada, tarta, guiso…), con ingredientes de la tabla
  oficial y sus gramos, en el formato del manifiesto de las 50 recetas de ejemplo
  (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/`, probado por `scripts/recetas-de-ejemplo.test.mjs`): cada
  ingrediente es el alimento de USDA que dice ser, con su estado, y el cálculo lo hace BE. Si un plato necesita un
  ingrediente que no está en la tabla oficial (por ejemplo, la tapa de empanada o el queso cremoso, que SR Legacy no trae;
  `docs/catalogo/FUENTES-ARGENTINAS.md`), no se carga y se anota. Ahora, además, cada plato que convenga a todos lo puede
  sumar Administración al canon (NUA-D16).
- **La medida casera en la APK** (NUA-D21): mostrar «1,5 tazas (360 g)» en el plan de la persona.

## 6. Retirar «Proteína en polvo» en el entorno de test (después de integrar y desplegar)

El alimento que Elián cargó mal se retira con la operación nueva, **no a mano en la base**. Lo hacen Dirección y el
continuador juntos:

1. Integrar la planificación entera y desplegar test (la API aplica las migraciones de DL-180 al arrancar).
2. Entrar al website de test como profesional de Nutrición, con la cuenta con la que se cargó.
3. Ir a «Mis alimentos»: desde «Plantillas y habituales» o desde el cuadro de una opción del plan («¿Uno tuyo tiene un
   error?»). Buscar «Proteína en polvo»; mirar su versión, su fecha y sus valores para confirmar que es el cargado mal.
4. «Retirar» → leer qué pasa → «Retirar». Queda «Retirado», con una versión más.
5. Comprobar: en el cuadro de una opción, buscar «proteína en polvo»: ya no aparece; en los planes que lo citaban, la fila
   sigue y dice «retirado»; los activados no cambian y la persona sigue viendo lo mismo; en un borrador que lo cite,
   cambiarlo por otro antes de activar (validar lo señala).
6. Si hiciera falta por la API: `GET /api/v1/nutrition/catalog-items/mine` (su `catalogItemId` y su `version`) y
   `POST /api/v1/nutrition/catalog-items/{catalogItemId}/retirement` con `{ "expectedVersion": "v…" }` y una
   `Idempotency-Key`. Nada por SQL.

Lo cargado a mano es solo de quien lo cargó (NUA-D14): retirarlo no cambia nada para otros profesionales.

## 7. Pruebas

- **Integración** (`test/integration/alimentos-del-catalogo.int-spec.ts`, en la CI con PostgreSQL 16): corregir (con el
  plan activado, la versión vista, dos correcciones a la vez ordenadas por el bloqueo con la barrera de
  `pg_stat_activity`, el mismo 404 para lo ajeno); retirar; **lo propio es propio** (el buscador, la consulta por identidad,
  una receta y un plan de otro profesional: el mismo 404 o CATALOG_REFERENCE_INVALID que lo inexistente; no hay un campo
  para compartir); **Administración** (el nombre de quien lo cargó y nunca su identidad, certificar, el equivalente,
  quitar, el 404 y el 403 en cada ruta, **los parecidos** con cuántos profesionales distintos, **el canon** con la fuente
  obligatoria, las cargas marcadas, el verificado para todos y en las recetas); **lo retirado** (el borrador que lo suma
  ahora, la receta que cita una versión vieja, validar y activar); **las medidas caseras** (cargarlas, leerlas,
  corregirlas sin versión, la cantidad inconsistente, el plan que conserva la medida y la persona que recibe solo los
  gramos); y las guardias de la base (el grupo, las medidas, el canon, lo compartido cerrado, las revisiones).
- **Contrato** (`contrato.int-spec.ts`): ALI-01 a 09 con sus éxitos y errores declarados.
- **Dominio** (`alimentos-del-catalogo.test.ts`): los niveles sin «De otro profesional», los nombres parecidos, las medidas
  y la cantidad en el plan (HOUSEHOLD_MEASURE_INCONSISTENT), el canon con su fuente, los contratos sin un campo para
  compartir.
- **Website** (`alimentos-del-catalogo.test.mjs`, `imagen-de-la-receta.test.mjs`): el aviso de lo propio en el formulario,
  las medidas en el formulario y en la fila del plan, el nombre igual a uno verificado, la consola con el autor, los
  parecidos y «Sumar al canon», la imagen con la sesión vencida y el foco de «Revisar».
- Cada punto con al menos una mutación verificada (con el defecto, la prueba falla): la lista está en el PR.
- **Capturas** en la CI (`capturas-de-la-planificacion`), en Claro y en Azul noche, a 1280, 1536 y 1920.

## 8. Lo que queda abierto

- NUA-09 y NUA-10 (§5); la medida casera en la APK (NUA-D21); sembrar las medidas de la tabla oficial desde USDA.
- Ratificar NUA-D01 a NUA-D23 (NUA-D05 y D13, sin efecto); validar los doce íconos de los grupos.
- El paso 2 del asistente de Entrenamiento tiene el mismo campo suelto que tenían los pasos 3 y 4 de Nutrición: no se tocó
  (otra rama trabaja ahí).
- Una receta que cita un ingrediente retirado lo conserva, pero el editor de recetas todavía no lo marca «retirado».
- Administración no revisa lo importado de Open Food Facts (solo cargas a mano).
- Volver a ofrecer un alimento retirado; un alimento del canon todavía no se corrige ni se retira desde la consola.
- Incidencias y derechos (`/admin/incidents`, `/admin/rights`) siguen con la lista con viñetas que tenía esta consola.
- En otras áreas (seguimiento y gráficos) quedan textos «Sin objetivo»: Dirección pidió «Sin indicar» (19/11); no se
  tocaron porque son de otros paquetes.

## 9. La revisión adversaria (2026-11-19)

Revisó la privacidad y la autorización, la consola de Administración, las versiones y sus carreras, las migraciones, la
imagen de la receta y lo de siempre. No encontró nada de severidad alta. Lo de severidad media se corrigió en el primer
tramo (guardar sin cambios compartía; Administración veía lo no compartido; la consola desentonaba con `/admin`).

**Las bajas, en el segundo tramo:**
- ~~Un borrador acepta al guardarse cualquier alimento retirado.~~ Resuelta (NUA-D17).
- ~~Una receta puede citar una versión vieja de un alimento retirado y llegar a un plan.~~ Resuelta (NUA-D18): la receta
  no lo suma, y validar y activar lo señalan (ya lo hacían; ahora con su prueba).
- ~~Las versiones de antes de compartir siguen siendo citables por su identificador.~~ Sin objeto: nada se comparte
  (NUA-D14); ninguna versión de lo ajeno se cita.
- Administración puede decidir sobre uno retirado si manda su versión vigente: la lista no lo ofrece y no cambia nada para
  nadie. Sigue abierta (baja).
- ~~Si la sesión vence mientras se carga la imagen de una receta recién creada, nadie lo dice.~~ Resuelta (NUA-D19).
- ~~En la consola, «Revisar» no lleva el foco.~~ Resuelta (NUA-D22).

**El riesgo para la privacidad** (lo compartido no se podía dejar de compartir) desapareció con NUA-D14.

## 10. El cambio de dirección del 19/11

La mañana del 19/11 el encargo del segundo tramo pedía «compartir con control»: un interruptor al cargar, compartir como
elección aparte al corregir y un hecho «dejar de compartir». Se llegó a programar en esta rama (los commits «En curso» y
«compartir con control» del historial) y, antes de terminarlo, Dirección cambió la dirección: lo cargado a mano es propio,
y Administración ve quién lo cargó y suma al canon lo que conviene a todos. **Todo lo de compartir se sacó** (la API, el
website, las pruebas y la migración de este tramo, que nunca se integró ni se aplicó en una base que dure): lo que queda
es lo de §4, NUA-D14 a D16.
