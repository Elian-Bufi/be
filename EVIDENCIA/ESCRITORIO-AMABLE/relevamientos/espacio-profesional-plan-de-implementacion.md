# Espacio profesional · plan de implementación (solo lectura: no compilé ni ejecuté nada)

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `WEB` = `REPO\apps\web\src` · `PRO` = `WEB\app\pro` · `PAG` = `PRO\page.tsx` (19 líneas) · `EP` = `PRO\espacio-profesional.tsx` (300) · `PEN` = `PRO\pendientes.tsx` (154) · `ADV` = `PRO\advisees` · `SEG` = `ADV\seguimiento` · `CSS` = `WEB\app\globals.css`
- `DOM` = `REPO\packages\domain\src` · `CAR` = `DOM\cartera.ts` · `CC` = `DOM\contratos-cartera.ts` · `CV` = `DOM\contratos-vinculo.ts` · `COPV` = `DOM\copy-vinculo.ts` · `CLI` = `DOM\cliente-http.ts`
- `API` = `REPO\apps\api\src` · `LC` = `API\cartera\lectura-cartera.ts` · `CTRL` = `API\cartera\cartera.controller.ts`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` · `M13` = `MQ\partes\13-cuerpo.html`
- `H` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas` · `R` = `H\recorrido.mjs` · `RC` = `H\recorrido-comprension.mjs`
- `EA` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE` · `CRIT` = `EA\diseno\CRITERIO-Y-AUDITORIA.md` · `CAT` = `EA\diseno\iconos\CATALOGO.md` · `ACE` = `EA\ACEPTACION.md`
- `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md` · `GUIA` = `REPO\docs\ux\GUIA-UX-UI.md` · `DL` = `REPO\docs\DEUDA_LEGAJO.md` · `PF07` = `REPO\docs\propuestas\PF-07_vista-de-cartera.md` · `CARL` = `REPO\EVIDENCIA\CARTERA\LEEME.md`

**Con qué leí**
- **La maqueta:** las dos imágenes (`maquetas-v4\claro\13-cartera.png` y `azul-noche\13-cartera.png`) y `MQ\13-cartera.html`. Su cuerpo es, byte a byte, `M13`, y también es igual en los tres resguardos (`partes.antes-paso3`, `antes-paso8`, `antes-de-la-apk`). **No hay ningún `.md` de la 13:** los de `MQ\partes` son de la 01, la 02 y la 03, y `reglas.md` es el pedido a ChatGPT. Usé el HTML.
- **La barra de la maqueta no vale** (`MQ\13-cartera.html:9-13`: «Cuenta» en la navegación, «Apariencia: Claro» y el aviso de ambiente). Es anterior a E-17 y E-19 (`WP:136, 138`).
- **El árbol cambió mientras leía.** Empecé con la parte 4 sin commit y terminé con `837d0e1` (2026-10-11 00:35). Queda sin commit `GUIA`, con 59 líneas nuevas de la parte 4. Los números de línea de `R`, `RC`, `CSS`, `SEG` y `ADV\workspace.tsx` son los de `837d0e1`; los de `GUIA`, los del archivo en edición (1.058 líneas). `PAG`, `EP` y `PEN` no cambian desde el 3/10 (`63a9e90`), antes del paquete. `WP` y `ACE` todavía no tienen la parte 4: las decisiones de la parte 5 se numeran después de las suyas.
- **Vi `/pro` de hoy en capturas, no en un navegador:** `H\trabajo-escritorio\parte-0\claro\06-espacio-profesional.png` (1440 × 2634; esa carpeta la ignora git) y las cuatro de `REPO\EVIDENCIA\CARTERA\`.

Todo lo que afirmo del código lo leí, con su línea. Lo que deduzco o calculo sin haberlo medido va con **[supongo]** o **[estimo]**.

## 1. Lo que condiciona el plan

1. **Las cantidades de las vistas no llegan de la API: hay que leer toda la cartera y contar.**
   - La respuesta trae `items` y `page`, con `limit`, `nextCursor` y `hasMore` (`CC:47-57`; `CV:32`). No hay total ni cuenta por tipo.
   - El filtro `kind` admite un solo tipo (`CTRL:69`); «Revisiones» junta tres y «Planes», dos (`CAR:19`). No sirve para pedir una vista.
   - Una página trae 20 por omisión y 50 como máximo (`API\http\paginacion.ts:9-10`; `CTRL:57-62`). `limit` ya se puede pasar sin tocar nada: está en `FiltroDeCartera` (`CC:66`) y el cliente manda toda clave con valor (`CLI:651-653, 1254-1258`). Hoy `PEN:62` no lo pasa.
   - **Con lo que hay:** leer con `limit=50`, seguir `nextCursor`, y contar y filtrar en el navegador. La cuenta es exacta solo con `hasMore = false`; si no, se dice «N+».
   - **Cada página cuesta:** es una lectura protegida (`CTRL:34`), vuelve a calcular toda la cartera antes de cortar (`LC:94-120`) y registra una decisión de acceso por alcance y por asesorado (`LC:84-91`; `API\autorizacion\pdp.service.ts:139-151`).
   - **A favor:** hoy cada cambio de «Dominio», de «Tipo» o de período es una lectura protegida (`PEN:59-69`). Con las vistas resueltas en el navegador, elegir una no pide nada.
   - **Se cuentan filas, no formularios ni evaluaciones.** De dos solicitudes sin responder de una persona en un área llega una, la más antigua (`LC:185-188`; `CARL:63`). Lo mismo con las evaluaciones en preparación (`LC:171`). El número tiene que decir «pendientes» para el lector de pantalla, como la línea de tiempo dice «hechos» (`SEG\linea-de-tiempo.tsx:522-526`).
   - **Un cursor vence si la lista cambió** (400 `INVALID_CURSOR`: `LC:198-201, 210`). Quien lea varias páginas tiene que volver a empezar. Hoy «Ver más» reintenta con el mismo cursor, sin salida (`WEB\lib\lista.ts:43-49`; `WEB\components\estados.tsx:91-94`).

2. **Ningún recorrido mira `/pro`. No hay nada que adaptar: hay que escribirlo.**
   - `R` y `RC` entran siempre por la ficha (`R:608, 1150, 1188, 3338, 3368, 3567, 3643, 3701`; `RC:397, 488, 619, 1589, 1594, 1670`) y navegan a ella. Lo único que nombran del Espacio profesional es el texto de la navegación, leído desde la ficha (`R:3370, 3400`).
   - El recorrido propio de la cartera (12 controles a 1280 y 390 px, `CARL:36-55`) **no está en el repositorio:** en `REPO\EVIDENCIA\CARTERA\` hay un `LEEME.md` y cinco imágenes.
   - `scripts\copy-pantallas.test.cjs:34-68` no recorre `PRO\*.tsx`. `H\datos\verificar.mjs` no lee `/me/portfolio`. `H\tiempos.mjs:70-81` no lo mide.
   - Lo que sí toca `/pro` está en §7.1: una captura sin comprobación, una auditoría de accesibilidad que por lectura ya se corta, y la prueba del retorno del inicio de sesión.
   - **Sin otra sesión:** `funcional` ya inicia cuatro veces con el profesional (`R:608, 1150, 3338, 3368`) y el límite es cinco cada quince minutos (`R:6, 3325-3327`); `todo` suma la de `capturas` (`R:3567`). Lo nuevo va dentro de una sesión que ya existe (§7.4).

3. **El asesorado no tiene nombre: la maqueta dibuja un alias que BE no tiene.** DL-040 sigue abierta (`DL:1018-1035`) y C-01 está fuera del paquete (`WP:219`). El nombre visible es «Asesorado · » más los últimos seis caracteres del identificador (`API\vinculo\lectura.ts:37-39`). Cambia cuatro cosas de la 13:
   - los dos renglones de cada persona («Ana Ruiz» y «Asesorado · 5db647», `M13:71`) son uno;
   - «Buscar por nombre o referencia» (`M13:69`) busca sobre una sola cosa;
   - el orden alfabético de la maqueta no ordena nada reconocible;
   - la columna «Asesorado» (32 %, `M13:52`) está pensada para «María de los Ángeles Fernández». Con 18 caracteres fijos puede ser más angosta y darle lugar a «Pendiente» **[estimo]**.

4. **El directorio de la maqueta calla lo que hoy se dice de cada área, y `/pro` es el único lugar del profesional donde está.**
   - Hoy, por cada alcance: el área y la finalidad, el estado con su detalle y «Desde el…» (`EP:115-126`).
   - El estado sale de `estadoParaMostrar` (`COPV:218-228`), con seis salidas: «Finalizado», «Pausado · sin acceso», «Vínculo activo» + «Acceso pendiente de autorización del asesorado», «Consentimiento revocado» + «Acceso no disponible», «Activo · acceso contextual» y «Vínculo activo» + «Acceso no disponible». Son textos del legajo (10-B04, H10-04-04: `COPV:116-128`).
   - La maqueta deja dos: el área nombrada y «Entrenamiento: acceso no disponible» (`M13:75`). No distingue «esperá a que la persona autorice» de «está pausado» ni de «terminó».
   - La finalidad y «Desde el…» no se ven en ningún otro lugar del profesional: la ficha dice solo el estado (`ADV\workspace.tsx:262-283`) y `/account/relationships` lista solo lo que la cuenta tiene como asesorado (`WEB\app\account\relationships\vinculos.tsx:10`).
   - Hoy las áreas de una persona salen en el orden de la lista (el vínculo más nuevo primero), no en el de BE. En la captura: «Antropometría, Entrenamiento, Nutrición». La ficha sí las ordena (`ADV\workspace.tsx:54-59, 263`).

5. **«Sin registros en el período» se dice sin que haya un período (defecto de antes).**
   - `PEN:56` arranca sin filtro, y `FiltroDePeriodo` no aplica nada hasta que se envía (`ADV\periodo.tsx:25-36`). Sin período, la API mira toda la historia (`LC:160, 193-196`).
   - Igual se escribe «Sin registros en el período» (`PEN:133`; `CAR:100`). Se ve en `REPO\EVIDENCIA\CARTERA\01-pendientes.png`, con los dos campos de fecha vacíos.
   - `PF07:48` proponía 30 días por omisión. No se implementó.
   - En el diseño nuevo se nota más: el período queda dentro de «Más filtros» y la frase va debajo de cada pendiente.
   - Además, la pantalla no dice qué acota el período. Solo lo dice un comentario (`PEN:99`): cambia el último registro, no los pendientes (`LC:160-166, 176-181`). DEC-5.

6. **En `/pro`, una falla no dice su motivo.** `useListaPaginada` guarda `{ tipo: 'error' }` y tira el resultado (`WEB\lib\lista.ts:34`); la pantalla dice «No pudimos cargar esta vista.» (`PEN:102`; `EP:81, 94, 148`; `DOM\copy.ts:37`).
   - `GUIA` I.4 (`:115-116`) pide el motivo. II.7 (`:483-485`, de la parte 4) pide el bloque de estado.
   - La cartera es la única lectura de `/pro` que puede dar 429: comparte el cupo de 120 por minuto con la ficha (`CTRL:34`; `API\config\entorno.ts:133-139`). Quien vuelve de explorar una ficha puede encontrarlo.
   - Las piezas ya existen: `motivoDeFalla` y `razonDeFalla` (`SEG\contexto.tsx:109-133`), `ICONO_DE_FALLA` (`SEG\iconos-de-metrica.ts:40`) y `BloqueDeEstado` (`WEB\components\estados.tsx:40-72`), usadas como en `SEG\linea-de-tiempo.tsx:421-423`.

7. **Contar, agrupar y buscar sobre listas que se leen de a 20.**
   - Los vínculos y las solicitudes llegan de a 20, y el cliente no deja pasar `limit` (`CLI:464, 486`). Se sigue el cursor.
   - La lista de vínculos trae un renglón por alcance, de todos los estados y de los dos roles de la cuenta (`API\vinculo\vinculos.service.ts:67-86`). Por eso la pantalla filtra con `esMio` (`EP:84`).
   - Hoy se agrupa por persona lo leído (`EP:97-101`) y «Ver más» va después (`EP:137`): una persona partida entre dos páginas muestra parte de sus áreas sin avisar. Y «Todavía no tenés asesorados…» o «Todavía no hay solicitudes.» pueden aparecer con páginas sin leer (`EP:98, 152`), en una cuenta que además es asesorada de otro.
   - «Tus asesorados 5», el buscador y «Solicitudes enviadas (2)» necesitan todo leído, o decir «+».
   - **Fuera de esta parte, mismo origen:** la ficha lee solo la primera página de vínculos (`ADV\workspace.tsx:91, 107`). Con más de 20 alcances en total, un asesorado antiguo abre su ficha sin «Acceso actual». Con los datos de prueba (9 alcances) no se ve.

8. **«Solicitar vínculo» y «Solicitudes enviadas» pasan a un clic: tres cosas que hoy dependen de que estén a la vista.**
   - «Ya hay una solicitud pendiente igual. Te mostramos esa.» (`COPV:156`; `EP:221`) hoy es cierto porque la tabla está en la página y se vuelve a leer (`EP:185`). Con la lista plegada deja de serlo, salvo que se abra.
   - El aviso de éxito es un `AvisoFlotante` dentro del formulario (`EP:243-247`). En un diálogo que se cierra tiene que vivir en la página.
   - La maqueta no dice qué cuenta «(2)». Hoy la tabla muestra todas las enviadas, con su estado (`EP:151-176`); en los datos de prueba son 9, todas «Aceptada» (la captura). DEC-11.

9. **El título, «Hoy…» y el botón obligan a mover el encabezado de la página.** Hoy el `h1` lo escribe la página (`PAG:14`), fuera del componente. La fecha llega con la cartera (`today`, `CC:49`), que hoy vive dentro de `Pendientes` (`PEN:58-66`), y el botón abre un formulario. El `h1` tiene que seguir estando en todos los estados (sin sesión, cargando, con falla, sin espacio: `EP:79-82`).

10. **Medidas de hoy y de la maqueta.**
    - **Antes:** 2.634 px a 1440 × 900 (`EA\parte-0\alturas-antes.json:41-47`; `WP:63`). En la captura **[estimo]**: «Pendientes», 522 px; «Tus asesorados», 1.115 (cuatro personas, un renglón por alcance); «Solicitudes enviadas», 728 (nueve filas).
    - **El ancho:** hoy el contenido topa en 76 rem (`CSS:476-478`): 1.152 px útiles a 1440, con «Pendientes» en 705 **[estimo]**. La maqueta usa todo el ancho (`MQ\plano.css:113`) y parte en `1fr 432px` (`M13:6`): 928 px para «Pendientes». `.contenido--ancho` la usan otras siete páginas (`ADV\nutrition\page.tsx:17` y seis más): no se toca (E-02). La ficha topa en 100 rem (`CSS:4347-4353`).
    - **El título:** hoy, hasta 34 px (`CSS:39-42`); en la maqueta, 26 (`MQ\plano.css:74`); en el marco de la ficha, 25,6 (`CSS:4380-4384`).
    - **El corte de dos columnas:** hoy en 64 rem (`CSS:959-968`), o sea que a 1024 ya son dos. `CRIT:253` pide una sola a 1024 y dos a 1280. El lateral de hoy se pega arriba (`CSS:964-967`); con un directorio más alto que la ventana, pegado no se llega a su final **[supongo]**.
    - **La maqueta es de 1440 × 960** y, con siete filas, termina cerca de los 782 px **[estimo, sobre la imagen]**. En el producto la barra mide 65 px, no 56 (`WP:271`; `MQ\plano.css:89`). Con las medidas de `M13:7-21`, el bloque de pendientes mide unos 223 px más 63 por fila: a 1440 × 900 entran ocho filas enteras, si ninguna parte su texto **[estimo]**.

11. **Con los datos de prueba se ven dos pendientes y varias vistas en cero.**
    - En la captura del 10/10: «Pendientes: 2», los dos del asesorado A («Nutrición · Revisión en 2 días», «Entrenamiento · Plan en borrador desde el 9 oct 2026»), cuatro personas y nueve solicitudes.
    - La revisión se genera a tres días (`H\datos\comprension.mjs:48`): recién generada dirá «Revisión en 3 días».
    - Quedaría «Todo 2 · Revisiones 1 · Planes 1 · Formularios 0 · Evaluaciones 0» **[estimo]**. La maqueta no dibuja una vista en cero. DEC-3.
    - El aviso de vista parcial no aparece: B no tiene vínculo de Entrenamiento (`H\datos\generar.mjs:244-245`), y solo cuenta un alcance aceptado que el PDP niega (`LC:86-90`) **[supongo]**. El caso de la maqueta (candado y aviso) se da en el escenario descartable, después de revocar (`R:3707-3729`). Ahí el asesorado tiene Nutrición y Antropometría y ningún plan (`H\datos\generar.mjs:644`): su portada diría «Sin plan activo» **[supongo]**.
    - `RC funcional` registra una revisión al final (`ACE:423-427`): lo esperado se calcula desde la API en el momento y las medidas se toman sobre datos recién generados.

12. **Lo que ya existe para reusar.**

    | Pieza | Dónde | Para qué |
    |---|---|---|
    | La vista con nombre y cantidad | `.vista-de-la-linea` y `BotonDeVista` (`CSS:2853-2916`; `SEG\linea-de-tiempo.tsx:362-399, 516-530`) | Las cinco vistas. `GUIA` II.8 (`:491, 521`) la lista y pide usar lo que hay. El componente es local a la línea de tiempo: DEC-18 |
    | «Más filtros» como botón | `SEG\linea-de-tiempo.tsx:394-402` | `aria-expanded`, `aria-controls` y la cantidad de filtros puestos |
    | El buscador con lupa | `.buscador-de-la-linea` (`SEG\linea-de-tiempo.tsx:377-393`) | Rótulo oculto, `type="search"`, lupa con nombre |
    | El bloque de estado y el motivo | Punto 6 | Cargando, falla, sin datos |
    | El ícono de cada área | `ICONO_DEL_AREA` (`SEG\iconos-de-metrica.ts:35`) | Por `scope.code`. La cartera trae `nutrition`, `training` y `anthropometry` (`CC:18`): hace falta el cruce |
    | La hora de la consulta | `horaDelDia` (`WEB\lib\formato.ts:14`), como en `ADV\workspace.tsx:95, 183` | «Consultado a las 10:32» |
    | Una fecha sin el año | `diaDelAnioEnCurso` (`WEB\lib\formato.ts:35`) y `fechaCivil` (`DOM\fechas-civiles.ts:32`) | «27 sept», en la zona de la respuesta |
    | El día de la semana | Formateadores locales (`SEG\linea-de-tiempo.tsx:141, 147`) | «lunes». No hay uno en `WEB\lib\formato.ts` |
    | Los botones | `.boton--quieto` (`CSS:4470`), `.boton--compacto` (`CSS:2308`) | «Más filtros», «Actualizar», «Abrir» |
    | Los 18 íconos de la 13 | `DOM\iconos.ts:71-74, 98-102, 132-135, 146, 162, 164, 169-171` | Están todos (`EA\diseno\iconos\INVENTARIO.md:28`) |

13. **Los textos: dónde viven y qué los cuida.**
    - `COPY_CARTERA` lo usa solo `PEN`; la APK, no. `CAR:99` (`ultimoRegistro`, «Último registro: …») existe, tiene prueba y hoy nadie lo usa: es la frase de la maqueta. Quedó suelta el 30/9, cuando el dato pasó a una columna con ese título (`2bcf11a`, «la celda de actividad sin redundancia») **[supongo, por el título del commit]**.
    - `DOM\cartera.test.ts:39-54` revisa las cadenas del primer nivel, `dominio`, `tipo` y las frases de pendiente. Un objeto nuevo adentro (los nombres de las vistas) queda afuera si no se suma a esa lista.
    - Un texto escrito en la pantalla no pasa por ninguna lista de palabras (punto 2).
    - **Dos nombres que se confunden:** `solicitud` es la persona con el signo más y va en «Solicitar vínculo»; `solicitar` es el avión de papel y va en «Solicitudes enviadas» (`CAT:161, 219`; `M13:37, 77`).
    - «Abrir» del directorio se llama «Abrir el workspace de …» para el lector de pantalla (`EP:110`). Es la única vez que el website le dice «workspace» a alguien: hoy es «la ficha».
    - Los textos de la 13 que no son de BE o no existen están en §4.3.

14. **La portada y la ficha no llaman «pendiente» a lo mismo.** En la ficha, una revisión registrada y sin aplicar es un pendiente de prioridad 1 (`DOM\sintesis-del-resumen.ts:165-169`). La cartera tiene siete tipos y ese no está (`CAR:19`). En los datos de prueba, Entrenamiento de A tiene una revisión sin aplicar (`H\datos\generar.mjs:710-711`): la ficha la dice como pendiente y `/pro`, no (en la captura, de esa área está solo el borrador). Sumarlo es un tipo nuevo en un enumerado del contrato: fuera de esta parte. Lo había pedido la crítica de #154 (`REPO\EVIDENCIA\DASHBOARD-COMPRENSION\CRITICA.md:24-34`).

15. **Menores, de antes.**
    - `PEN:26` formatea una fecha civil con la zona del navegador; el comentario de arriba dice lo contrario. En zonas de UTC+12 en adelante mostraría el día siguiente **[supongo]**. `WEB\lib\formato.ts:22` lo hace bien.
    - `PEN:133` da el último registro con día y hora en la zona del navegador; «hoy» y las fechas de cada pendiente son civiles en la zona de BE (`LC:67, 190`).
    - `PAG:8` dice «lista mínima… sin Cartera (DL-041 A)». Ya no es así desde DL-107.
    - Por encima de 200 asesorados la cartera corta sin avisar (`LC:42, 77`). Está anotado en `REPO\docs\QUE-FALTA.md:119`.
    - «Revisión próxima» son 7 días en la cartera (`CAR:23`) y 7 en la ficha (`DOM\sintesis-del-resumen.ts:138`), en dos constantes distintas. Hoy coinciden; si una cambia, la portada y la ficha dejan de decir lo mismo.

## 2. Región por región de la maqueta 13

### 2.0 Esqueleto

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Página | Encabezado; debajo, dos tarjetas: `1fr 432px`, 16 px entre ellas (`M13:6`) | `.espacio`: principal (tres secciones) y lateral pegado con el formulario (`EP:87-88, 184-186`; `CSS:953-968`) | Clases nuevas (E-02). `.espacio`, `.asesorado*` y `.alcances*` las usa solo `/pro` (`EP:87-119`): al terminar quedan sin uso y se borran |
| Orden del documento | Encabezado, pendientes, directorio | Pendientes, asesorados, solicitudes, formulario | DL-107: «Pendientes» va antes que «Tus asesorados» (`DL:2315`). Se cumple |
| Semántica | `section` y `aside` (`M13:41, 67`) | Cuatro `section` con `aria-labelledby` (`PEN:72`; `EP:91, 145, 240`) | El directorio no es contenido complementario: mejor `section` |
| Títulos | `h1`; `h2` «Pendientes» y «Tus asesorados» | `h1` (`PAG:14`); cuatro `h2` (`PEN:73`; `EP:92, 146, 241`) | «Solicitudes enviadas» y «Solicitar vínculo» conservan un título donde se abran |

### 2.1 Encabezado de la página

| Región | Maqueta (texto exacto) | Hoy | Qué cuidar |
|---|---|---|---|
| Título | «Espacio profesional» (`M13:36`) | `PAG:14` | Puntos 1.9 y 1.10 |
| Fecha | «Hoy, lunes 28 sept» | «· hoy 10 oct 2026», en el título de la tabla (`PEN:114-117`) | Es la fecha con que la API clasificó las revisiones (`CC:49`; `LC:67`). No reemplazarla por la del navegador. Sin cartera leída, no se dice. El año: DEC-12 |
| Botón | «Solicitar vínculo», con `solicitud` (`M13:37`) | El formulario entero, siempre abierto (`EP:193-300`) | §2.7 |

### 2.2 Pendientes: cabecera y vistas

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Título | `pendientes` (24 px) + «Pendientes» (`M13:42`) | `CAR:85`; `PEN:73` | Igual |
| Bajada | «Lo que BE puede saber con lo registrado. No es una evaluación de nadie.» | `CAR:86`; `PEN:74` | Es el texto de BE: no se toca |
| Vistas | «Todo 7» · «Revisiones 3» (`revision`) · «Planes 2» (`plan`) · «Formularios 1» (`informacion`) · «Evaluaciones 1» (`antropometria`) (`M13:44-48`) | Dos listas: «Dominio» y «Tipo de pendiente», con siete tipos (`PEN:75-98`; `CAR:102-113`) | Qué tipos junta cada una: §3. La maqueta no lo escribe: sale de sus siete filas (3, 2, 1 y 1). Punto 1.1. «Todo» no existe: hay «Todos» (`CAR:104`). DEC-3 y DEC-4 |
| «Más filtros» | Botón con `filtros` (`M13:49`) | No existe | Adentro: el área, el tipo exacto y el período (`ADV\periodo.tsx:24-47`). DEC-4 |
| Período | No dibujado | «Desde», «Hasta» y «Ver período»; hasta 92 días, validado antes de pedir (`PEN:100`; `ADV\periodo.tsx:20, 29-36`) | Lo comparten otras cinco pantallas (`ADV\nutrition\registros.tsx:44` y cuatro más): se usa como está. Punto 1.5 |

### 2.3 Pendientes: la tabla

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Columnas | «Asesorado» (32 %), «Área» (21 %), «Pendiente», y una sin nombre (10 %) (`M13:52`) | «Asesorado», «Dominio», «Pendiente», «Último registro», «Acciones» (`PEN:118-126`) | «Área» por «Dominio»: `CAR:102`. La cuarta necesita nombre para el lector de pantalla. Punto 1.3 |
| Título de la tabla | No dibujado | «Pendientes: N+ · hoy…» (`PEN:114-117`) | Una tabla sin título pierde su nombre: va oculto a la vista |
| Persona | «Bruno Sosa», en negrita | `th scope="row"` (`PEN:130`) | Punto 1.3 |
| Área | Ícono del área + nombre | Solo el nombre (`PEN:131`) | Ícono de 20 px, decorativo |
| Pendiente | Ícono + texto: «Revisión vencida hace 3 días», «Revisión en 2 días», «Revisión pendiente desde el 12 sept» (`reloj`); «Plan en borrador desde el 21 sept» (`borrador`); «Sin plan activo» (`plan`); «Formulario sin responder desde el 22 sept» (`informacion`); «Evaluación en preparación desde el 25 sept» (`borrador`) (`M13:53-59`) | Las mismas frases (`CAR:90-98`; `PEN:28-46`), con el año: «…desde el 9 oct 2026» | Las frases son las de BE. Falta en la maqueta «Revisión hoy» (`CAR:92`) |
| Último registro | Debajo: «Último registro: 27 sept» o «Sin registros en el período» | Una columna, con hora: «9 oct 2026, 12:31» (`PEN:133`) | `CAR:99`. Puntos 1.5 y 1.15. Va asociado al pendiente también para el lector de pantalla |
| Abrir | «Abrir» + `derecha` (`M13:53`) | Enlace, con nombre «Abrir: persona, área, pendiente» (`PEN:135-137`) | El destino no cambia (`PEN:49-53`). `next/link`, no un `a` suelto: recargar cierra la sesión. El nombre accesible sigue empezando con «Abrir» |
| Orden | El de la urgencia | El de la API (`LC:119`; `CAR:69-79`) | No reordenar en el navegador |
| Más filas | No dibujado | «Ver más» (`PEN:144`) | Punto 1.1 |

### 2.4 Pendientes: el pie

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Vista parcial | `oculto` + «Hay datos de algún asesorado que no podés ver desde tu alcance: no se cuentan acá.» (`M13:62`) | El mismo texto, arriba de la tabla (`CAR:88`; `PEN:105-109`) | Es el de BE. Dice cómo leer las cantidades y queda al final: con muchas filas cae fuera de la primera pantalla. DEC-13 |
| Hora | «Consultado a las 10:32» | No existe | No llega de la API: es el reloj del navegador al recibir la respuesta |
| «Actualizar» | Uno, en este bloque | Dos, y cada uno lee lo suyo (`PEN:145-149`; `EP:138-142`). Las solicitudes no tienen | DEC-9 |

### 2.5 Tus asesorados

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Título | `asesorados` (24 px) + «Tus asesorados» + «5» (`M13:68`) | `h2`, sin cuenta (`EP:92`) | Cuenta personas, no vínculos. Punto 1.7 |
| Buscador | «Buscar por nombre o referencia», con `buscar` (`M13:69`) | No existe | Local: no pide nada. Rótulo oculto, no solo el texto de ejemplo (`WEB\components\formulario.tsx:4`). DEC-6 |
| Persona | Nombre; «Asesorado · 5db647»; «Nutrición · Entrenamiento · Antropometría» (`M13:71`) | Nombre visible y, por alcance: área y finalidad, estado y detalle, «Desde el…» (`EP:105-129`) | Puntos 1.3 y 1.4. DEC-7 |
| Sin acceso | `candado` (15 px) + «Entrenamiento: acceso no disponible» (`M13:75`) | La insignia y el detalle de BE (`EP:122-124`) | Con las palabras de `COPV:218-228` |
| «Abrir» | Botón quieto y compacto | Botón secundario, a `/pro/advisees?id=…` (`EP:110-112`) | Punto 1.13 |
| Orden | Alfabético por alias | El de la API | DEC-8 |
| Vacío | No dibujado | «Todavía no tenés asesorados activos en este contexto.» (`COPV:142`; `EP:98`) | Es del legajo (10-B08) |

### 2.6 Solicitudes enviadas

| Región | Maqueta | Hoy | Qué cuidar |
|---|---|---|---|
| Entrada | Enlace `solicitar` + «Solicitudes enviadas (2)», al pie del directorio (`M13:77`) | Una sección con su tabla (`EP:145-181`) | Punto 1.8. DEC-11 |
| Contenido | No dibujado | «Asesorado», «Alcance» (área y finalidad), «Estado», «Enviada», con hora (`EP:154-176`); los estados, de `COPV:119` | Se muestran las que envió esta cuenta (`EP:151`). `expiresAt` llega y no se muestra (`CV:66`) |
| Vacío | No dibujado | «Todavía no hay solicitudes.» (`COPV:143`) | Igual |

### 2.7 Solicitar vínculo

No está dibujado abierto. Todo lo de hoy se conserva (`EP:193-300`):

| Qué | Dónde |
|---|---|
| «Identificador BE del asesorado», con su ayuda; «Alcance» («Elegí un alcance»); «Finalidad: —», que sale del alcance | `EP:253-288`; `COPV:149-154` |
| La ayuda «Qué decide el asesorado» | `EP:289-291` |
| Dos errores de campo; el conflicto («Ya tenés un vínculo vigente…»); el mensaje neutro para 404 y 422, que no dice si el identificador existe; el resultado incierto, con «Reintentar» | `EP:211-212, 227-233, 294` |
| Una clave de idempotencia por intento; cambiar un dato es otro intento | `EP:194, 201-205`; `WEB\lib\intento.ts:18-38` |
| Éxito: «Solicitud enviada…» o «Ya hay una solicitud pendiente igual. Te mostramos esa.»; se vuelven a leer las enviadas | `EP:219-224, 185` |

Qué cuidar: no hay un diálogo genérico con formulario. `DialogoDeConfirmacion` es de dos botones (`WEB\components\dialogo.tsx:27-84`), y la ayuda y el panel arman el suyo (`SEG\como-se-lee.tsx:237-262`; `SEG\registro-original.tsx:50-79`). `GUIA` I.3 (`:104, 107-108`): modal, con el foco adentro, y nunca un `dialog` abierto en el flujo. DEC-10.

### 2.8 Estados (pantalla 19 y `CRIT:222-235`)

| Estado | Hoy | Con el bloque de estado |
|---|---|---|
| Sin sesión | «Redirigiendo a Iniciar sesión…» (`EP:79`) | Igual |
| La cuenta: cargando, falla, sin espacio | `EP:80-82`; sin espacio: «No encontramos un recurso disponible para esta acción.» y «Ir a tu cuenta» (`EP:56-65`) | Igual. El texto es del legajo (`COPV:134`) |
| Pendientes: cargando | «Cargando…» (`PEN:101`) | Que diga qué se carga |
| Pendientes: falla | Sin motivo (`PEN:102`) | Punto 1.6. El directorio sigue a la vista |
| Sin ningún pendiente | «Nada pendiente con lo que BE puede saber. Lo que no está registrado, no está acá.» (`CAR:87`; `PEN:110-111`) | Es el de BE |
| Una vista o un filtro sin filas | **El mismo texto** (`REPO\EVIDENCIA\CARTERA\02-vacio.png`: con «Entrenamiento» elegido dice «Nada pendiente…») | «Sin coincidencias» (`CRIT:232`): que con eso elegido no hay, cuántos hay en total y cómo volver. Texto nuevo |
| Directorio y solicitudes: cargando, falla, vacío | `EP:93-98, 147-152` | Lo mismo, con motivo |
| Búsqueda sin coincidencias | No existe | Texto nuevo, con «Quitar la búsqueda» |

La maqueta 19 dice «Esperá unos segundos» (`MQ\partes\19-cuerpo.html:34`). No es cierto: el cupo es por minuto. Queda «Esperá un minuto y reintentá.» (`SEG\contexto.tsx:121`).

### 2.9 En 1280 y en 1024 (`CRIT:253`); 768 y 390

| Ancho | Regla | Qué cuidar |
|---|---|---|
| 1280 | «El directorio se angosta» | La columna «Pendiente» queda en unos 300 px con los porcentajes de la maqueta: «Evaluación en preparación desde el 25 sept» se parte y la fila crece **[estimo]**. Angostar «Asesorado» |
| 1024 | «Tus asesorados» va debajo | El corte de hoy es 64 rem: hay que subirlo. La línea de tiempo usa 75 rem (`SEG\linea-de-tiempo.tsx:84`). Debajo y a todo el ancho, las personas pueden ir de a dos |
| 768 y 390 | No se rompe | `.tabla` pasa a tarjetas con `data-etiqueta` por debajo de 40 rem (`CSS:1295-1321`): una clase nueva trae su propia regla. `GUIA:1053` anota que los filtros de «Pendientes» ocupan una pantalla en el teléfono: con «Más filtros» se va, y se saca de esa lista |

## 3. Qué dato llega y qué no

| Lo que muestra el diseño | ¿Llega? | Operación y campo | Con lo que hay |
|---|---|---|---|
| «Hoy, lunes 28 sept» | La fecha, sí | API-CAR-01 `data.today`, `data.timeZone` (`CC:49-50`; `LC:67, 122`) | El día de la semana se calcula de la fecha civil |
| «Todo 7» | **No** | — | Contar los ítems de todas las páginas. Punto 1.1 |
| «Revisiones 3» | **No** | `items[].kind` | `REVIEW_OVERDUE`, `REVIEW_DUE_SOON` y `REVIEW_UNDATED` (`CAR:19`) |
| «Planes 2» | **No** | `items[].kind` | `PLAN_DRAFT_PENDING` y `NO_ACTIVE_PLAN` |
| «Formularios 1» | **No** | `items[].kind` | `FORM_REQUEST_OPEN`. Una fila por persona y área |
| «Evaluaciones 1» | **No** | `items[].kind` | `ANTHRO_DRAFT_PENDING`. Solo la antropométrica en preparación de este profesional (`LC:171-172`) |
| La persona del pendiente | La referencia | `items[].advisee.displayName`, `identityId` (`CC:30`) | Sin alias |
| El área | Sí | `items[].domain` (`CC:32`) → `CAR:89` | — |
| Qué está pendiente | Sí | `kind`, `since`, `daysOverdue`, `daysUntil` (`CC:33-39`) → `CAR:90-98` | La fecha la formatea la pantalla (`CAR:83`) |
| El ícono del pendiente | Se deduce | `kind` | El de la maqueta, por tipo (§2.3) |
| «Último registro: 27 sept» | Sí | `items[].lastActivityAt` (`CC:41`) | Es cuándo ocurrió, no cuándo se cargó. Nutrición: la última comida no anulada contra un plan de este profesional (`LC:160-164`). Entrenamiento: la última sesión registrada, de cualquier condición (`LC:165`). Antropometría: la última toma registrada por este profesional (`LC:176-181`). Dentro del período si se pidió; si no, de toda la historia |
| «Sin registros en el período» | Sí: `null` | El mismo | Punto 1.5 |
| Cuántos registros | Llega y no se muestra | `items[].activityCount` (`CC:42`) | La maqueta tampoco lo muestra |
| A dónde lleva «Abrir» | Sí | `open.view`, `domain`, `advisee.identityId` (`CC:43`; `LC:44-52`) | `PEN:49-53` |
| El aviso de vista parcial | Sí | `data.partialView` (`CC:53`; `LC:82-91`) | No aparece por un vínculo pausado ni finalizado: solo mira los aceptados (`LC:70-72`) |
| «Consultado a las 10:32» | **No** | — | El reloj del navegador. `PF07:100` proponía `generatedAt`; el contrato no lo tiene |
| El período pedido | Sí | `data.period` (`CC:52`) | El eco de lo pedido |
| «Tus asesorados 5» | **No** como número | API-REL-05 (`CV:125`) | Personas distintas entre lo leído, donde el profesional es la cuenta |
| El nombre («Ana Ruiz») | **No existe** | — | DL-040 |
| «Asesorado · 5db647» | Sí | `data[].advisee.displayName` (`CV:113`) | — |
| Las áreas de cada uno | Sí | `data[].scope.code`, `scope.label` (`CV:114`) | Un ítem por alcance; se agrupa por `advisee.identityId` |
| «…: acceso no disponible» | Sí, con más detalle | `relationshipState`, `consentState`, `accessMode`, `pausedBy` (`CV:116-120`) | `COPV:218-228`. El acceso lo calcula el PDP sin registrar (`API\vinculo\lectura.ts:90-91`) |
| Finalidad y «Desde el…» | Llegan; la maqueta no los muestra | `purpose`, `acceptedAt` (`CV:115, 121`) | §4.1 |
| «Abrir» (la ficha) | Sí | `advisee.identityId` | — |
| «Solicitudes enviadas (2)» | **No** como número | API-REL-02 (`CV:82`) | Contar las propias (`EP:151`). El filtro `state` existe (`CLI:464`) |
| Las solicitudes | Sí | `advisee`, `scope`, `purpose`, `state`, `createdAt`, `expiresAt` (`CV:54-67`) | `expiresAt` hoy no se muestra |
| Si la cuenta tiene espacio profesional | Sí | API-ACC-05 `actorCapabilities` (`EP:48`) | — |
| Pedir un vínculo | Sí | API-REL-01 (`CLI:451-462`) | — |

## 4. Lo que hoy existe y la maqueta no muestra, y al revés

### 4.1 Hoy existe y la maqueta no lo muestra (dónde quedaría)

| # | Qué | Dónde está | Dónde quedaría |
|---|---|---|---|
| 1 | El filtro por área | `PEN:76-86` | En «Más filtros» |
| 2 | El filtro por tipo exacto (siete) | `PEN:87-97` | En «Más filtros». Las vistas agrupan, no lo reemplazan: «Revisión vencida» sola sigue pudiéndose pedir (DL-107, D-4: `DL:2313`) |
| 3 | El período del último registro | `PEN:100` | En «Más filtros», con un rótulo que diga qué acota |
| 4 | «Pendientes: N · hoy…» | `PEN:114-117` | La cantidad, en «Todo»; «hoy», en el encabezado; el título de la tabla, oculto a la vista |
| 5 | La columna «Último registro» | `PEN:123, 133` | Debajo de cada pendiente |
| 6 | La hora del último registro | `PEN:133` | Se pierde: la maqueta da el día. Decisión de diseño: anotarla |
| 7 | «Ver más» | `PEN:144`; `EP:137, 180` | Se lee todo hasta un tope; por encima, «N+» y «Ver más» |
| 8 | «Actualizar» de «Tus asesorados» | `EP:138-142` | Uno solo, que lee todo (DEC-9) |
| 9 | La finalidad de cada alcance | `EP:120` | Va una a una con el alcance (`DOM\alcance.ts:39-43`). Sigue en las solicitudes y en el formulario. En el directorio, en el detalle de la persona (DEC-7) |
| 10 | El estado y el detalle de cada alcance | `EP:116-124` | Con acceso activo, el área nombrada; cualquier otro estado, con el candado y las palabras de BE |
| 11 | «Desde el…» | `EP:125` | En el detalle de la persona (DEC-7) |
| 12 | La tabla de solicitudes | `EP:154-176` | A un clic |
| 13 | El formulario, abierto | `EP:240-298` | A un clic, entero |
| 14 | El lateral pegado | `CSS:964-967` | No hace falta |

### 4.2 La maqueta lo muestra y BE no lo tiene

- **No existe el dato:** el alias.
- **Hay que calcularlo en el navegador:** las cinco cantidades, la cuenta de asesorados, la de solicitudes, el día de la semana y la hora de la consulta.
- **Es pantalla nueva sobre datos que llegan:** las vistas; el último registro debajo; el buscador; el directorio compacto; el botón que abre el formulario; el enlace a las solicitudes; los íconos.

### 4.3 La maqueta dice algo que en BE no es así, o no dice lo que BE dice

| La maqueta | En BE | Qué hacer |
|---|---|---|
| «Ana Ruiz» sobre «Asesorado · 5db647» | Solo la referencia | Un renglón |
| «Buscar por nombre o referencia» | No hay nombre | DEC-6 |
| «Entrenamiento: acceso no disponible» para todo lo que no se ve | Seis estados con sus palabras | Las de BE |
| «Sin registros en el período», sin período a la vista | Sin período, es toda la historia | DEC-5 |
| «Solicitudes enviadas (2)» | No dice qué cuenta; hoy se listan todas | DEC-11 |
| «Todo» | BE tiene «Todos» (`CAR:104`), para una lista | Texto nuevo |
| «Evaluaciones» | El tipo es «Evaluación en preparación» (`CAR:97, 112`). Nutrición y Entrenamiento también tienen evaluaciones, que acá no cuentan | Queda, con el ícono de Antropometría. Cuando llegue C-58 («Tomas», segundo paquete) cambian juntos el chip y las dos frases del dominio |
| «Sin plan activo», con el ícono de «el plan vigente» (`CAT:107`) | — | Queda: el ícono acompaña a la palabra |
| No dibuja «Revisión hoy» | Existe (`CAR:92`) | Lleva `reloj` |
| No dibuja una vista en cero | Es lo común en los datos de prueba | DEC-3 |
| La barra | Punto «Con qué leí» | No se toca |

## 5. Pasos, en un orden que deja la pantalla funcionando

Cada compilación del website tarda de 2 a 5 minutos y reconstruye el dominio antes (`H\entorno.sh:31-37`); va con la API apagada (`H\entorno.sh:6`). La pasada completa, 25 minutos. `npm run typecheck` va antes de cada compilación.

| # | Paso | Archivos | Riesgo | Cómo comprobarlo |
|---|---|---|---|---|
| 0 | **Sin compilar: el «antes».** `/pro` a 1440, 1280, 1024, 768 y 390 con la compilación de hoy. De 1440 hay un número de antes de la parte 0, y de los otros anchos, nada | — | Ninguno | `ver.mjs … "espacio=pro"` (la ruta, sin la barra inicial: `H\ver.mjs:5-7`) |
| 1 | **Sin compilar: lo que no es pantalla.** En el dominio: las vistas (qué tipos junta cada una, su nombre y su ícono), una función que cuenta y otra que filtra, los textos nuevos y el arreglo de «sin registros». En el website, una función pura que arma el directorio: agrupa por persona, ordena las áreas, separa las que tienen acceso y dice el estado de las otras con las palabras de BE; y otra que busca | `CAR` y su prueba; un `.ts` puro en `PRO`, con su prueba en `REPO\scripts` (como `scripts\hecho-en-un-renglon.test.mjs`); `scripts\copy-pantallas.test.cjs` | Bajo | `npm test`. La prueba de la partición: cada uno de los siete tipos está en una vista y en una sola, y las cuentas suman el total |
| 2 | **Compilación 1: la pantalla entera con datos reales.** En este orden, para que cada paso deje algo que anda: (a) las lecturas (la cartera completa con su motivo de falla, su hora y el reinicio ante un cursor vencido; vínculos y solicitudes completos); (b) el encabezado, con el `h1` adentro; (c) «Pendientes»; (d) el directorio; (e) las solicitudes y el formulario a un clic; (f) el esqueleto de dos columnas y los cortes. Y en el mismo commit, las comprobaciones nuevas (§7.3), con un modo propio | `PAG`, `EP`, `PEN` (o archivos nuevos al lado), `CSS`, `R` | **Medio:** el formulario cambia de lugar con todo su comportamiento; la paginación | `typecheck`; compilar; `recorrido.mjs espacio`; `ver.mjs` a 1440 en los dos temas |
| 3 | **Mirar y medir, sin compilar.** 1440, 1280, 1024, 768 y 390; los dos temas; «Más filtros» abierto; cada vista; el formulario; las solicitudes; la búsqueda; una falla de cada lectura | — | — | `ver.mjs` con `#clic:Más filtros`, `#clic:Solicitar vínculo`, `#buscar:…`, `#falla:me/portfolio`, `#falla:me/relationships` (`H\ver.mjs:8-12`). `ver.mjs` no cuenta sus lecturas (`ACE:439-443`): acá es una protegida por captura |
| 4 | **Compilación 2: lo que salga de mirar,** y la medición de la primera pantalla con su prueba de la prueba. Borrar lo que quedó sin uso | `CSS`, `R` | Bajo | `recorrido.mjs espacio`; `paginas.mjs` para el «después» |
| 5 | **Una vez, al final:** los siete recorridos sobre datos recién generados, y la CI | — | — | `ACE:366` como modelo |
| 6 | **Documentos.** `GUIA`: II.8 (las piezas nuevas), V.3 (las filas de la parte 5), sacar `:1053`. `WP`: §4, §8 y la fila de §1. `ACE`. `PAG:8`. Las dos guías de demostración que pasan por `/pro` (`REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\GUIA-DE-DEMOSTRACION.md:22-24`; `…\DASHBOARD-COMPRENSION\GUIA-DE-DEMOSTRACION.md:12-13`, que dice «el primero de la cartera») | Documentos | Bajo | — |

Si el plazo corta después del paso 2, la pantalla queda completa y probada. No conviene compilar con «Pendientes» nuevo y el directorio viejo: las dos columnas dependen una de la otra.

## 6. Comportamiento que hay que conservar

**Sesión y permisos**
- Sin sesión, a «Iniciar sesión» con retorno a `/pro` (`EP:68`; `WEB\lib\sesion-requerida.ts:41-43`). Una sesión vencida, con su aviso (`:30-39`).
- `useEspacioProfesional` y `SinEspacioProfesional` los importan otras ocho pantallas (`ADV\workspace.tsx:40` y siete más): su firma no cambia.
- La capacidad muestra el espacio y no autoriza nada (`EP:10-11`). Lo que se lista se filtra por la cuenta (`EP:84, 151`).
- Un área que el profesional no puede ver no aparece ni se explica; el aviso es uno solo (`LC:16-18`; DL-107).
- El pedido de vínculo no dice si el identificador existe (`EP:231-233`).

**Enlaces y parámetros**
- Los destinos: la ficha (`EP:110`) y, según el tipo, el plan o las revisiones de Nutrición o de Entrenamiento, la preparación de Antropometría y las solicitudes de Información (`PEN:49-53`; `LC:44-52`).
- **`/pro` no lleva parámetros.** El retorno del inicio de sesión admite `/pro` a secas (`WEB\lib\copy.ts:22, 34-43`): con cualquier parámetro vuelve a Cuenta. La vista, los filtros y la búsqueda son estado de la visita, como hoy (`PEN:56`). DEC-15.
- Navegar con `next/link`.

**Lecturas y límites**
- Al abrir, hoy: cuatro pedidos, uno protegido (la cartera). Los vínculos, las solicitudes y la cuenta no consumen el cupo (`API\vinculo\vinculos.service.ts:67-86, 90`; `DOM\openapi.ts:2633-2638`).
- **120 lecturas protegidas por minuto por profesional,** en ventana fija (`API\plataforma\limitador.service.ts:26-38`), compartidas con la ficha.
- Con lo propuesto: una al abrir (más una por cada 50 pendientes), ninguna al elegir una vista o un filtro, una al cambiar el período y una en «Actualizar».
- Listar las solicitudes vence antes las caducadas (`API\vinculo\solicitudes.service.ts:200`): es una lectura que puede escribir. No pedirla de más.
- Una respuesta vieja no pisa a una nueva (`WEB\lib\lista.ts:25-33`): hay que conservarlo al leer varias páginas.

**Reglas de BE**
- El orden es el de la urgencia que fijó BE con fechas, no una valoración (`CAR:25`). Ningún color por tipo: una revisión vencida no va en rojo ni se llama «urgente».
- El último registro es un dato de la fila: nunca una fila, nunca «inactivo» (`CAR:10-11`; DL-107, D-3). No se ordena ni se resalta por él.
- Un hueco no es un cero: «Formularios 0» sale de una lista leída entera; con una falla o una lista a medias, no hay número.
- Los textos de `CAR:85-100` y `COPV` no se reescriben.

**Accesibilidad**
- «Saltar al contenido» y `main#contenido` (`WEB\components\encabezado.tsx:18-20`; `PAG:13`). Un `h1`.
- La tabla, con título y `th scope` (`PEN:114-130`).
- El formulario: rótulos, error con texto y foco, `aria-invalid`, `aria-describedby`, `aria-busy` (`EP:248-295`); el éxito, sin mover el foco (`WEB\components\ayuda.tsx:33-67`).
- 44 px en cada objetivo; foco visible; el orden del documento es el que se ve.
- La vista elegida, con `aria-pressed`; lo que se despliega, con `aria-expanded`, y se cierra con Escape y al salir con Tab (E-21, `WP:140`).
- Cada ícono con su palabra; el candado no va solo.
- Dos «Abrir» con dos destinos: el nombre accesible los distingue.

## 7. Las comprobaciones de los recorridos que tocan `/pro`

### 7.1 Lo que hoy toca `/pro`, línea por línea

| # | Dónde | Qué mira | Qué protege | Con el DOM nuevo | Cómo adaptarla |
|---|---|---|---|---|---|
| 1 | `R:3370, 3400` | Los textos de la navegación, leídos en la ficha | E-17: los cuatro lugares; el primero, «Espacio profesional» | Pasa. No abre `/pro` | Nada |
| 2 | `H\paginas.mjs:35, 95, 119-124` | Abre `/pro`, captura en los dos temas y mide el alto | Nada: es el «antes y después» | Pasa. Ve solo el estado cerrado | Usarla para el «después» |
| 3 | `H\ver.mjs:76, 110-156` | La ruta que se le pida; `#clic:` toca botones, resúmenes, enlaces y rótulos de `main`; `#buscar:` escribe en `main input[type="search"]` | Nada | Sirve si lo nuevo son botones dentro de `main` y el buscador es `type="search"` | Nada |
| 4 | `REPO\scripts\auditoria-accesibilidad.mjs:110-111` | Llega por «Ir al espacio profesional» y corre axe | RNF-ACC-001, la parte automática | Corre sobre el estado cerrado. No está en la CI ni en `npm test` | Sumar los estados abiertos, o cubrirlos en `R` |
| 5 | `…auditoria-accesibilidad.mjs:113` (`:55-58`) | Toca el primer botón o enlace que dice exactamente «Abrir» y espera `/pro/advisees?id=` | Entrar a la ficha como una persona | **Se corta, y ya se cortaba:** desde que existe «Pendientes», si hay alguno, el primer «Abrir» es el suyo, lleva a `/pro/advisees/nutrition?…` y la espera vence **[supongo: no la ejecuté]** | Elegir el «Abrir» del directorio por su nombre accesible. Las líneas `:116-127` también están viejas (`EA\relevamientos\pruebas-y-evidencia.md:139`) |
| 6 | `REPO\scripts\retorno-seguro.test.mjs:14` | `destinoSeguro('/pro')` devuelve `/pro` | El retorno del inicio de sesión | Pasa, si `/pro` sigue sin parámetros | Nada. Si la vista fuera a la URL, cambian `WEB\lib\copy.ts:22-43` y esta prueba |
| 7 | `REPO\EVIDENCIA\NUTRICION-RECETAS\herramientas\recorrido\recorrido-web-registros.mjs:36-40` | Entra con retorno a `/pro` y espera esa ruta | Que el profesional entre a su espacio | Pasa: no lee la pantalla | Nada |
| 8 | `REPO\scripts\copy-pantallas.test.cjs:34-68` | No incluye `PRO\*.tsx` | — | Un texto nuevo en la pantalla no pasa por ninguna lista | Un bloque para `/pro` con `terminosProhibidosDeCarteraEn` (`CAR:117-120`). Marca también un «%» en un atributo (`:71-78`) |
| 9 | `DOM\cartera.test.ts:37-59` | Los textos de la cartera: sin palabras que califiquen; dos frases exactas | TEST-PRJ-009 | Pasa. Un objeto nuevo adentro no se mira (`:40-42`) | Sumar los textos nuevos a `:39-54` |
| 10 | `REPO\test\integration\cartera.int-spec.ts` | La API | Reglas, acceso, orden, filtros, paginación | No cambia | Nada |
| 11 | `R:135-146` (`quieto`) | Espera que no queden pedidos en vuelo ni un `.cargando` | Que no se mida a medio cargar | Si el estado de carga nuevo no lleva esa clase, espera solo por los pedidos | Que el bloque de carga lleve `.cargando`, o esperar por selector |

**Ninguna negativa cambia de texto:** no hay ninguna sobre `/pro`.

### 7.2 Los doce controles del recorrido de la cartera, que no está en el repositorio (`CARL:42-55`)

Son lo que la pantalla ya cumplía. Con el DOM nuevo:

| Control | Qué cambia al reescribirlo |
|---|---|
| «Pendientes» es la primera sección, con su subtítulo | Nada |
| Las filas, en orden de urgencia | Se compara con el orden de la API, no con tres tipos fijos |
| La vencida dice hace cuántos días y su último registro; las otras, «Sin registros en el período» | El último registro se lee debajo del pendiente. La frase depende de DEC-5 |
| «Abrir» apunta a la vista que resuelve | Igual, por tipo |
| Sin «inactivo», «riesgo», «cumplimiento» ni «adherencia» | Es una negativa: va con su positiva (el bloque tiene filas, con el mismo selector) |
| Filtrar por tipo «Plan en borrador» deja una fila | La vista «Planes» y, en «Más filtros», el tipo exacto |
| Filtrar por «Entrenamiento» muestra el vacío | En «Más filtros»; el texto pasa a «sin coincidencias» (§2.8) |
| Un período pasado: la vencida sigue y su actividad pasa a «Sin registros en el período» | En «Más filtros». Además: la cantidad de filas no cambia y el pedido lleva `periodStart` y `periodEnd` |
| «Abrir» lleva a Nutrición → Revisiones | Igual |
| Sin desplazamiento de costado | A cinco anchos |
| Entrenamiento: «Revisión en 3 días» y «Formulario sin responder» | Los datos de prueba no tienen un formulario sin responder (§7.4) |
| Sin errores de consola ni de página | Igual |

### 7.3 Comprobaciones nuevas que conviene escribir

Lo esperado, a mano desde la API con la sesión de la página (`leerApi`, `R:168-173`), sin el dominio: `/me/portfolio?limit=50` siguiendo el cursor, `/me/relationships`, `/me/relationship-requests` y `/me`.

- **Las cinco cantidades.** Por tipo, a mano: las tres revisiones, los dos de plan, el formulario y la evaluación. Las cuatro suman «Todo» y «Todo» es el largo de la lista. Con los datos de prueba, 2, 1, 1, 0 y 0 **[estimo]**: se compara contra la API, no contra esos números.
- **Elegir cada vista:** `aria-pressed`, las filas son las de esos tipos en el orden de la API, y **no sale ningún pedido** a `/me/portfolio` (`v.urls`, `R:94`).
- **Una vista en cero:** dice que con eso elegido no hay y cuántos hay en total. No dice «Nada pendiente con lo que BE puede saber».
- **Cada fila,** con la frase escrita a mano por tipo (para `REVIEW_DUE_SOON` con 3 días, «Revisión en 3 días»; con 0, «Revisión hoy»; con 1, «en 1 día»), el área, la persona, el último registro (el día de `lastActivityAt` en `timeZone`, o la frase de «sin registros») y el destino de «Abrir».
- **«Hoy»** es `data.today`, con su día de la semana calculado a mano.
- **El aviso de vista parcial** está si y solo si `partialView`. Con los datos de prueba no está **[supongo]**: la positiva, en el escenario descartable.
- **El directorio:** tantas personas como `advisee.identityId` distintos entre los vínculos del profesional; la cuenta del título; por persona, las áreas en el orden de BE; las que no dan acceso, con las palabras del estado, escritas a mano en una tabla de seis casos.
- **El buscador:** con los tres últimos caracteres de la referencia de A queda una persona y la cuenta lo dice; vacío, vuelven todas; algo que no coincide dice que no hay coincidencias, no que no hay asesorados. Ningún pedido a la API.
- **Las solicitudes:** el número del enlace es el de la API con la misma regla; abiertas, tantas filas como ese número, con el estado de cada una.
- **El formulario:** se abre con el foco adentro; Escape lo cierra y devuelve el foco al botón; enviado vacío, los dos errores de campo y ningún `POST`. Con un identificador que no existe, el mensaje neutro (un `POST` que no crea nada **[supongo]**).
- **«Actualizar»:** después del clic salen las lecturas de todo lo que la pantalla muestra y la hora cambia (como E-58, `ACE:358`).
- **Fallas, simuladas en el navegador** (`v.reglas`, `R:1094-1123`):
  - 429 en `/me/portfolio`: dice «muchas consultas seguidas» y «Esperá un minuto»; no dice «Nada pendiente»; las vistas no muestran números; el directorio sigue; «Reintentar» lo trae.
  - 503: «BE no está disponible». Sin red: «no hay conexión».
  - 503 en `/me/relationships`: el directorio lo dice y los pendientes siguen.
  - `INVALID_CURSOR` en la segunda página, con `limit` chico: la lista vuelve a empezar y no queda trabada **[supongo: hay que forzar el `limit` con una regla]**.
- **Una respuesta lenta:** demorar la cartera, tocar «Actualizar» y cambiar el período: queda lo último pedido.
- **La primera pantalla,** con datos recién generados, a 1440 × 900: se exige que el bloque de pendientes y el directorio terminen antes de los 900 px; se informa a 1280 × 900, a 1920 × 950 y a 1366 × 768. Con su prueba de la prueba (un relleno que los saca, como `R:1263`).
- **La composición:** a 1440 y 1280 el directorio está a la derecha; a 1024, debajo; a 768 y 390, sin desborde.
- **Axe, en los dos temas:** cerrado; con «Más filtros» abierto; con el formulario; con las solicitudes.
- **El teclado:** con Tab se llega, en este orden, al botón del encabezado, las vistas, «Más filtros», un «Abrir» de fila, «Actualizar», el buscador, un «Abrir» de persona y las solicitudes, con el foco visible.
- **Sin `%`** ni palabras que califican en todo `main`, con todo abierto; con su positiva.
- **Las lecturas:** al abrir, una sola a `/me/portfolio`.
- **Otra cuenta sin asesorados:** en la sesión del tercero, después de PRO-20 (`R:1188-1194`): los tres vacíos, con sus textos y todo en cero.
- **Después de revocar** (al final de `descartable`, `R:3769-3785`): el aviso de vista parcial, Antropometría con el candado y «Consentimiento revocado» **[supongo: es lo que da `COPV:223`]**, y ninguna fila de esa área. La de Nutrición sigue.

### 7.4 Dónde escribirlas

- Una función `espacioProfesional(page, v)` dentro de `fichaRecompuesta` (`R:3330-3357`), que llega con `ir(page, '/pro')`, y un modo `espacio` junto a los de `R:3799-3801`. No suma un inicio de sesión.
- Cada lectura de `leerApi` a `/me/portfolio` es protegida: `cupo` ya las cuenta (`R:149-156, 171`).
- **Formularios y evaluaciones en preparación no están en los datos principales.** Sumarlos ahí cambia lo que esperan los otros recorridos (el Resumen de A o de B). Mejor en el escenario descartable, que tiene sus propias cuentas (`H\datos\generar.mjs:622-675`), o dejarlos a la prueba del dominio. DEC-17.
- Sumar `/me/portfolio` a `H\tiempos.mjs:70-81`: hoy no hay ningún tiempo medido de la cartera.

## 8. Decisiones que quedan para quien implementa

| # | Qué hay que decidir | Recomiendo | La otra opción |
|---|---|---|---|
| DEC-1 | Cómo se llega a las cantidades | Leer toda la cartera con `limit=50`, hasta cuatro páginas (200 pendientes); con más, «200+» y «Ver más». Ante un cursor vencido, volver a empezar una vez | Una lectura por tipo (siete, y tampoco dan un número si pasan de 50), o vistas sin cantidad (contra C-34) |
| DEC-2 | Dónde se filtra | En el navegador: vista, área y tipo. A la API va solo el período | Seguir mandando `domain` y `kind`: una lectura y un registro de acceso por cada clic, y las cantidades de las otras vistas no salen |
| DEC-3 | Una vista en cero | A la vista, con su «0», elegible: muestra «sin coincidencias» | Apagarla (hay que decir por qué), u ocultarla (las vistas cambiarían de lugar) |
| DEC-4 | «Más filtros» y la vista elegida | Área, tipo exacto y período. Las cantidades respetan el área: el número es lo que se va a ver. Un tipo exacto es una combinación a medida: se lista como filtro puesto, con «Quitar», como en `GUIA` II.6 | Que elegir una vista borre lo de «Más filtros» (más simple, y sorprende) |
| DEC-5 | «Sin registros en el período» sin período | Sin período por omisión, como hoy: el último registro de toda la historia dice más. Sin período, «Sin datos registrados todavía.», que ya existe (`COPV:138`); con período, la frase de hoy. Y en «Más filtros», un rótulo: «Período del último registro» y que no cambia los pendientes | 30 días por omisión, como proponía `PF07:48`, dicho a la vista: la frase pasa a ser cierta, pero quien registró hace 40 días se lee igual que quien nunca registró |
| DEC-6 | El buscador | «Buscar por referencia», sobre el nombre visible, mientras se escribe. Con DL-040 cerrada vuelve «nombre o referencia» | El texto de la maqueta, que promete un nombre |
| DEC-7 | Qué dice cada persona | Un renglón con la referencia; debajo, las áreas con acceso activo, en el orden de BE; cada una de las otras, con el candado y las palabras de BE («Entrenamiento: Pausado · sin acceso»). A un clic, por persona, el detalle de hoy: área y finalidad, estado, «Desde el…» | Solo «acceso no disponible», como la maqueta: se pierde la diferencia entre esperar, pausado y terminado, y la finalidad y la fecha no quedan en ningún lado |
| DEC-8 | El orden del directorio | El de la API (el vínculo más nuevo primero), como hoy | Por referencia: estable, y no significa nada |
| DEC-9 | «Actualizar» | Uno, donde lo pone la maqueta, que vuelve a leer la cartera, los vínculos y las solicitudes (como E-58); la hora es la de la cartera | Arriba, junto a «Hoy», como en la ficha (E-11): dice mejor que es de toda la página y se aparta de la maqueta |
| DEC-10 | Dónde se abre «Solicitar vínculo» | Un diálogo modal: foco en el primer campo; Escape cierra salvo mientras se envía. Al terminar se cierra, el aviso flota en la página y se abren las solicitudes con la nueva (así «Te mostramos esa» sigue siendo cierto) | Un panel al costado, o desplegado sobre el directorio (lo empuja) |
| DEC-11 | «Solicitudes enviadas (N)» | N son las que se ven al abrir (todas las enviadas, con «+» si faltan páginas); si alguna espera respuesta, se dice aparte con la palabra de BE («1 pendiente»). Se abren en un diálogo, con la tabla de hoy | N como las que esperan respuesta (parece lo que dibuja la maqueta): con los datos de prueba diría «(0)» sobre nueve filas. O desplegadas en el lugar: en 432 px la tabla de cuatro columnas no entra |
| DEC-12 | Las fechas | Sin el año si es del año en curso (E-57), en la zona de la respuesta; el año va una vez, en «Hoy, domingo 11 oct 2026» | «Hoy» sin año, como la maqueta |
| DEC-13 | El aviso de vista parcial | Al pie, como la maqueta: con hasta ocho filas entra en la primera pantalla **[estimo]** | Arriba de la tabla, como hoy (`PEN:105`): se lee antes que las cantidades aunque la lista sea larga |
| DEC-14 | El ancho y los cortes | Un contenedor propio, con el tope de la ficha (100 rem); dos columnas desde 75 rem; sin lateral pegado | 80 rem: 1280 queda justo en el borde del corte, y una ventana apenas más angosta pasa a una columna |
| DEC-15 | La vista elegida y la URL | No va: estado de la visita, como hoy | En la URL: hay que ampliar `destinoSeguro` y su prueba, y §2 de `WP` pide no cambiar parámetros |
| DEC-16 | Dónde viven los nombres de las vistas | En `CAR`, con su partición y su prueba (como `DOM\dia-de-la-linea.ts`); «Dominio» pasa a «Área» en `CAR:102` | En la pantalla: quedan fuera de toda lista de palabras |
| DEC-17 | Datos para ver «Formularios» y «Evaluaciones» con filas | Una solicitud de formulario y una toma en preparación en el escenario descartable | Dejarlo a la prueba del dominio y decir en el acta que esas vistas se vieron en cero |
| DEC-18 | La pieza de las vistas | Sacar `BotonDeVista` a `WEB\components` con sus clases y sus ganchos como están: `R` no cambia | Copiarla (`GUIA:491` pide no crear otra), o renombrar la clase (toca la parte 4 y sus selectores) |
| DEC-19 | La fila | Tabla, con «Abrir» como enlace que ocupa el alto de su celda (44 px o más) | La fila entera como enlace, como en el Resumen: se aparta de la maqueta |
| DEC-20 | Las personas con todo finalizado | Siguen en la lista, como hoy, con «Finalizado», y cuentan | Aparte, plegadas: es otra pantalla |

## 9. Lo que no pude determinar leyendo

- **Cuánto mide lo nuevo.** Los altos de 1.10 y 2.9 salen de las medidas de la maqueta; los de «antes», de una captura reducida.
- **Si una fila se parte a 1280** con los textos reales, y cuánto ocupa una persona con dos áreas sin acceso.
- **Cómo escribe `Intl` el día de la semana** con la fecha corta en es-AR (si pone coma o «de»).
- **Por qué B, C y E no tienen pendientes.** Lo deduzco de la captura: ninguno dice «Sin plan activo», así que tienen un proceso abierto y ninguna revisión dentro de los siete días **[supongo]**. No leí `procesos.proximaRevisionVigente`.
- **Si la cartera de los datos de prueba da `partialView` en falso.** Lo deduzco de `LC:86-90` y de que B no tiene vínculo de Entrenamiento.
- **Si `auditoria-accesibilidad.mjs` falla hoy** en `:113`. Lo seguí en el código.
- **Cuánto tarda `/me/portfolio`.** `PF07:128` pedía menos de un segundo con 50 asesorados y no encontré la medición (`CARL:29-38` no la trae).
- **Si la compilación que está servida es la de `837d0e1`.** `H\trabajo-escritorio\build-web.log` es de las 00:32 y el commit, de las 00:35.
- **Qué va a decir la parte 4 en `WP` y en `ACE`:** no estaban escritas. Si alguna de sus decisiones fija algo de las vistas con nombre, manda sobre DEC-3, DEC-4 y DEC-18.
- **Qué quiere Dirección** con «Solicitudes enviadas (2)», con el orden del directorio y con cuánto de cada vínculo tiene que verse sin un clic. La maqueta está validada por confianza, no pantalla por pantalla (`WP:9-10`).
- **Cómo se ve cada cosa en Azul noche** con los tokens reales: el chip elegido, el candado a 15 px y el aviso del pie.
- **El lector de pantalla:** nada de esto se puede saber leyendo.
