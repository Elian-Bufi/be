# Inventario · Antropometría de un asesorado (website del profesional)

**Fuente:** worktree `C:\Users\bufim\BE-Best-entrenamiento`, rama `wp-dashboard-comprension`, commit `ab90860`. Solo lectura de código: no se ejecutó nada (ni build, ni pruebas, ni navegador).

**Cómo leer las citas.** Todas las rutas son relativas a la raíz del worktree. Abrevio cuatro carpetas:

| Abreviatura | Carpeta |
|---|---|
| `web/` | `apps/web/src/app/pro/advisees/anthropometry/` |
| `dom/` | `packages/domain/src/` |
| `api/` | `apps/api/src/antropometria/` |
| `apk/` | `apps/mobile/src/` |

Los textos entre «comillas angulares» son literales del código, con sus acentos. Lo que va entre `{llaves}` es un dato que se interpola. Cuando algo no se puede saber leyendo el código, dice **no se puede determinar** (el resumen está en el §10).

---

## 1. Navegación del área

### 1.1 Entrada y marco

- **Ruta:** `/pro/advisees/anthropometry?id={asesoradoId}&vista={clave}` (`web/page.tsx:9-12`). El `<title>` es «Antropometría · BE» (`web/page.tsx:7`).
- **Componente de entrada:** `Antropometria` (`web/antropometria.tsx:75-111`), dentro de `<main id="contenido" class="contenido contenido--ancho">` (`web/page.tsx:17`). El ancho máximo de ese contenedor es 76rem (`apps/web/src/app/globals.css:331-333`). La página **no** dibuja pie de sitio: `page.tsx` solo pone el encabezado y el `<main>` (`web/page.tsx:15-22`).
- **Cómo se llega** (enlaces que encontré en `apps/web/src`):
  - desde el Resumen de la ficha, una acción con el texto «Abrir Antropometría», que va a `vista=evaluaciones` (`apps/web/src/app/pro/advisees/seguimiento/resumen.tsx:414-415`);
  - desde el panel de un registro en la ficha, «Ver en Antropometría · Evaluaciones» (`apps/web/src/app/pro/advisees/seguimiento/registro-original.tsx:45-46, 97-102`). Ese enlace lleva `id` y `vista`, **no** el identificador de la evaluación: abre la toma más reciente, no la que se estaba mirando;
  - `tarjetas-de-dominio.tsx` tiene una tarjeta «Antropometría» con «Abrir Antropometría» (`apps/web/src/app/pro/advisees/tarjetas-de-dominio.tsx:83-98`), pero **nadie la importa** en `apps/web/src` (búsqueda de `tarjetas-de-dominio` y de `TarjetaDe…`: solo aparecen su propia definición y una clase de CSS). Es código sin uso.

### 1.2 Sub-pestañas

Definidas en `VISTAS` (`web/antropometria.tsx:30-35`) y dibujadas por `Pestanas` con `aria-label` «Secciones de Antropometría» (`web/antropometria.tsx:116`; `apps/web/src/components/pestanas.tsx:28-40`). En este orden:

| # | Etiqueta exacta | `vista=` | Componente |
|---|---|---|---|
| 1 | «Evaluaciones» | `evaluaciones` | `VistaDeEvaluaciones` (`web/evaluaciones.tsx`) |
| 2 | «En preparación» | `preparacion` | `VistaDePreparacion` (`web/preparacion.tsx`) |
| 3 | «Evolución» | `evolucion` | `VistaDeEvolucion` (`web/evolucion.tsx`) |
| 4 | «Lámina» | `lamina` | `VistaDeLamina` (`web/lamina.tsx`), cargada recién al abrirla (`web/antropometria.tsx:27-28`) |

- **Por defecto:** «Evaluaciones». Si `vista` falta o no es una de las cuatro claves, se usa `evaluaciones` (`web/antropometria.tsx:78-79`).
- **Cómo se elige:** las pestañas son enlaces (`<Link … replace>`) con `aria-current="page"` en la actual (`apps/web/src/components/pestanas.tsx:33`). El estado vive en la URL.
- **Parámetros de la URL:**
  - `id`: el asesorado (`web/antropometria.tsx:77`).
  - `vista`: la sub-pestaña.
  - `evaluacion`: una evaluación preseleccionada. Lo escribe `irA(vista, evaluacionId)` (`web/antropometria.tsx:85-89`). Lo usan Evaluaciones (`web/evaluaciones.tsx:68-72`) y Lámina (`web/lamina.tsx:99, 227-228`). **Se pierde al cambiar de pestaña con la barra**: el enlace de cada pestaña se arma sin él (`web/antropometria.tsx:116`).
  - `volver`: el estado de la ficha de la que se vino. Si es válido aparece el enlace de retorno y se conserva entre pestañas (`apps/web/src/app/pro/advisees/retorno-y-preparacion.tsx:25-33`; `web/antropometria.tsx:84, 116`).
- **Lo que NO está en la URL:** la toma abierta al hacer clic en la lista de Evaluaciones (estado local, `web/evaluaciones.tsx:69, 160`), la métrica y el período de Evolución (`web/evolucion.tsx:37-39`), y todos los ajustes de la Lámina salvo la toma (`web/lamina.tsx:212-219`).
- **Dentro de cada sub-pestaña no hay otro nivel de pestañas.** Evaluaciones es lista + detalle; Lámina tiene grupos de botones de opción.
- **No hay «Plan» ni «Revisiones»** en esta área: el dominio lo dice explícitamente («Antropometría no adquiere ciclo de plan ni revisión de especialidad», `dom/antropometria.ts:14-15`).

---

## 2. Cada sección, en orden de aparición

### 2.0 Marco común (arriba de las cuatro pestañas)

| Bloque | Texto / control | Visible | Cita |
|---|---|---|---|
| Encabezado del sitio | Enlace «Saltar al contenido»; marca «BE» (nombre accesible «BE, ir al inicio»); texto «Ambiente de prueba · solo datos sintéticos» | siempre | `apps/web/src/components/encabezado.tsx:14-25` |
| Navegación profesional (`aria-label` «Espacio profesional») | 5 enlaces: «Espacio profesional», «Plantillas y habituales», «Mis recetas», «Mis ejercicios», «Cuenta» | siempre | `apps/web/src/components/navegacion.tsx:19-25` |
| Selector «Apariencia» | `<select>` con «Azul noche» (predeterminado) y «Claro» | siempre | `apps/web/src/components/apariencia.tsx:27-43`; `apps/web/src/lib/apariencia.ts:10-15` |
| Migas (`aria-label` «Ubicación») | «Espacio profesional» (enlace a `/pro`) › «Ficha del asesorado» (enlace a la ficha o al retorno) › «Antropometría» (actual, sin enlace) | siempre | `apps/web/src/components/migas.tsx:24-26`; `web/antropometria.tsx:105` |
| Título | `<h1>` «Antropometría» | siempre | `web/antropometria.tsx:106` |
| Retorno | Enlace «Volver a la ficha, donde estabas» | condicional: solo si la URL trae un `volver` válido | `apps/web/src/app/pro/advisees/retorno-y-preparacion.tsx:35-42` |
| Pestañas | Las cuatro del §1.2 | siempre, salvo acceso retirado (ver §3) | `web/antropometria.tsx:108, 116` |

**El nombre del asesorado no aparece en la página.** El `<h1>` es «Antropometría» y la miga dice «Ficha del asesorado», genérico. El nombre solo se lee para ponerlo adentro de la imagen de la Lámina (`web/lamina.tsx:104-109`).

---

### 2.1 Pestaña «Evaluaciones» (`web/evaluaciones.tsx`)

Disposición: en pantallas de 69rem o más, dos columnas: la lista de tomas a la izquierda (16 a 19rem, fija al hacer scroll) y la toma abierta a la derecha (`apps/web/src/app/globals.css:2257-2273`). Más angosto, una debajo de la otra.

Al entrar se abre **la toma más reciente por fecha de la toma** (`web/evaluaciones.tsx:54, 80-81`).

#### 2.1.1 Avisos (arriba de todo, condicionales)

| Cuándo | Qué se ve | Cita |
|---|---|---|
| Después de una acción con éxito | Aviso flotante, fijo abajo de la pantalla, con el texto de éxito y un botón «×» (nombre accesible «Cerrar aviso»). Se va solo a los 6 s como mínimo | `web/evaluaciones.tsx:106-110`; `apps/web/src/components/ayuda.tsx:33-66` |
| Después de una acción con error | Aviso de error arriba, con el foco | `web/evaluaciones.tsx:111-115` |
| La evaluación pedida por URL responde 404 | «La evaluación solicitada no está disponible. La lista de evaluaciones sigue completa.» + botón-enlace «Volver a la lista de evaluaciones» | `web/evaluaciones.tsx:116-125`; `dom/evolucion-antropometrica.ts:295, 297` |
| La evaluación pedida falla por otro motivo | «No pudimos abrir la evaluación solicitada.» + botón-enlace «Reintentar» · botón-enlace «Volver a la lista de evaluaciones» | `web/evaluaciones.tsx:126-139`; `dom/evolucion-antropometrica.ts:296`; `dom/copy.ts:38` |

Textos de éxito posibles en esta pestaña: «Corrección registrada. El valor original se conserva.», «Medición anulada. Su historia se conserva.», «Esta medición ya estaba anulada.», «Cálculo registrado. Queda con su método, su versión y sus entradas a la vista.», «Referencia registrada. Los demás cálculos se conservan.» y, si reemplazó a otra, «Referencia registrada. Los demás cálculos se conservan. Reemplaza a la referencia anterior, que se conserva.» (`dom/copy-antropometria.ts:117, 128, 129, 89, 101, 105`; `web/calculos.tsx:132`).

#### 2.1.2 Lista «Tomas registradas» (siempre visible)

- `<h2>` «Tomas registradas» (`web/evaluaciones.tsx:144`).
- Lista ordenada (`<ol class="tomas">`), **un botón por toma**, de la más reciente a la más vieja por fecha de la toma; a igual fecha, la registrada después va primero (`web/evaluaciones.tsx:54, 157-169`).
- Cada botón muestra dos líneas (`web/evaluaciones.tsx:161-166`):
  1. en negrita, la fecha y hora de la toma (`fecha(e.occurredAt)`);
  2. en gris: «{n} mediciones» + « · {k} anulada» (solo si k > 0) + « · registrada el {día}» (solo si tiene fecha de registro).
- La toma abierta lleva `aria-current="true"`: borde azul y una franja a la izquierda (`apps/web/src/app/globals.css:2242-2245`).
- **Acción:** clic en un botón abre esa toma a la derecha (`web/evaluaciones.tsx:160`).
- **No hay filtros, buscador, orden elegible ni «Ver más».** La lista pide una sola página a la API (`web/evaluaciones.tsx:77`), y la página por defecto es de 20 (`apps/api/src/http/paginacion.ts:9`). Ver rareza R-6.

#### 2.1.3 Detalle de la toma (condicional: cuando hay una toma abierta)

`<section>` con (`web/evaluaciones.tsx:210-248`):

| Bloque | Qué muestra | Visible |
|---|---|---|
| `<h2>` | Insignia «Solo lectura» + « Toma del {fecha y hora de la toma}» (`:212-214`) | siempre |
| Línea de metadatos | Partes unidas con « · » (`:205-209, 216`): «Protocolo: {nombre}» · «{n} mediciones» + « ({k} anulada)» si k > 0 · «registrada el {fecha y hora} por {nombre del profesional}» | siempre (la parte del protocolo, solo si hay mediciones) |
| Contexto | Un párrafo con el texto libre de la toma, **sin rótulo** (`:217`) | condicional: si la toma tiene contexto |
| Botón «Ver lámina» | Secundario. Va a la pestaña Lámina con esta toma elegida (`:219-223`) | siempre |
| Bloque «Cálculos» | ver §2.1.4 | siempre |
| Bloque «Mediciones» | ver §2.1.5 | siempre |

El «Protocolo» de la línea de metadatos es el **más frecuente** entre las mediciones de la toma (`web/evaluaciones.tsx:254-259`).

#### 2.1.4 Bloque «Cálculos» (`web/calculos.tsx`)

Va **antes** que las mediciones (`web/evaluaciones.tsx:225`; decisión DL-113 citada en `:15`).

**Cabecera del bloque**

| Elemento | Texto | Visible | Cita |
|---|---|---|---|
| `<h3>` | «Cálculos» | siempre | `web/calculos.tsx:60` |
| Botón primario | «Calcular con un método». Abre el panel de cálculo. Deshabilitado si el catálogo no trae métodos | condicional: cuando la carga terminó y el panel está cerrado | `web/calculos.tsx:61-65` |
| Desplegable (`<details>`) | Título «Cómo conviven los cálculos». Adentro: «Los cálculos conviven: BE no los promedia, no los ordena por mejor y no elige uno. Si querés dejar uno como referencia, lo elegís vos y queda registrado.» | siempre (plegado) | `web/calculos.tsx:67-69`; `dom/copy-antropometria.ts:93-94` |
| Nota | «No hay métodos seleccionables en el catálogo.» | condicional: catálogo vacío | `web/calculos.tsx:88` |
| Párrafo | «Todavía no hay cálculos para esta evaluación.» | condicional: sin corridas | `web/calculos.tsx:89` |

**Lista de corridas** (`<ul class="corridas">`, una fila por cálculo de esta toma; `web/calculos.tsx:90-102`). Se listan **todas**, vigentes y sin efecto, sin filtro ni agrupación (`web/calculos.tsx:48`). El orden es el que da la API: por momento de registro, la más nueva primero (`api/calculos.service.ts:180`; `apps/api/src/http/paginacion.ts:83`).

Cada corrida (`web/calculos.tsx:136-205`):

| Parte | Contenido | Visible |
|---|---|---|
| Título (`<h4>`) | «{nombre de la métrica}:» + valor con **exactamente** los decimales que declara el método + unidad (sin unidad si es `adimensional`) (`:139-143`) | siempre |
| Insignias | «Calculado» (siempre); «De una evaluación en preparación» (si `evaluationContext` es `IN_PREPARATION`); «Sin efecto» (si `effective` es falso); «Referencia» (si es la referencia adoptada) (`:144-147`) | ver cada una |
| Desplegable «Por qué está sin efecto» | «Este cálculo dejó de tener efecto: alguna de sus entradas se anuló, o lo reemplazó un cálculo posterior. Se conserva porque es parte de la historia.» (`:149-153`) | condicional: corrida sin efecto |
| Nota | «Método: {nombre del método} · {fecha y hora del cálculo}» + « · Reemplaza a un cálculo anterior, que se conserva.» si nació de un recálculo (`:154-157`) | siempre |
| Desplegable «Con qué se calculó» | Línea «Versión {v} · Regla aplicada: {id de regla} · Precisión declarada: {n} decimal(es)» y una lista con una fila por entrada: «{métrica}: {valor y unidad}» (o «Valor no disponible para vos») « · {Medido o Reportado} · {Vigente o Anulada} · {fecha y hora de la medición}» (`:159-172`) | siempre (plegado) |
| Botón «Dejar como referencia» | Secundario, compacto. Abre el formulario de referencia (`:174-180`) | condicional: la corrida no es la referencia, es de una evaluación registrada y está vigente |

**Formulario «Dejar como referencia»** (en la misma fila, al apretar el botón; `web/calculos.tsx:182-203`):
- Aviso informativo: «Dejar un cálculo como referencia no cambia el cálculo ni borra los otros, y no crea un objetivo ni una prescripción. La decisión sigue siendo tuya y queda registrada con su fecha.»
- Campo de texto «Por qué esta» (opcional, hasta 1000 caracteres).
- Botones «Cancelar» (secundario) y «Dejar como referencia» (primario).

**Panel «Calcular con un método»** (`NuevoCalculo`, `web/calculos.tsx:280-407`; aparece al apretar el botón de la cabecera):

1. **Select «Método»** (`:282-288`). Opciones en dos grupos (`<optgroup>`): «Se pueden calcular con esta toma» y «Les faltan datos de esta toma». Cada opción: «{Categoría} · {nombre del método} · Versión {v}» (`:209, 273-278`). Categorías posibles: «Índices», «Sumas de pliegues», «Grasa corporal», «Masas corporales», «Somatotipo» (`dom/copy-antropometria.ts:88`); un método sin categoría va sin prefijo. Orden dentro de cada grupo: por el código de la categoría y después por nombre, «nunca por mejor» (`dom/seleccion-de-metodo.ts:48-54`). Viene preseleccionado el primero que la toma cubre (`web/calculos.tsx:231-232`).
2. **Ficha del método** (`:291-363`):
   - nombre completo en una línea: «{Categoría} · {nombre} · Versión {v}»;
   - descripción (si el método la trae);
   - «**Da:** {métrica de salida} ({unidad})». Para un índice se lee literalmente «(adimensional)» (`:298-300`);
   - «**Pide:**» y una lista, una fila por dato. Con medición asignada: «{métrica}: {valor y unidad}». Sin medición: «{métrica} ({unidades admitidas}): » y, en negrita, uno de: «Falta en esta toma», «Está en otra unidad en esta toma ({unidad})», «No tiene un valor vigente en esta toma», «Sin valor vigente», «Sin elegir» (`:304-335`);
   - nota «**Población en que se validó:** {texto}» (si el método la trae);
   - aviso informativo (condicional: la toma ya tiene esa misma métrica calculada con otro método): «Esta toma ya tiene «{métrica}» calculada con «{método}». Si calculás también este método, los dos resultados conviven: en la evolución se ven los dos, cada uno con su método, y en la APK la persona ve el último que se registró.» (`:341-349`). Ver rareza R-1: ese texto no coincide con lo que hace la API;
   - desplegable «Fuente y regla del método»: «**Fuente:** {cita}» (o la nota de procedencia) y «Para qué se calcula: {Soporte antropométrico | Soporte de un objetivo nutricional} · Precisión declarada: {n} decimal(es) · Regla aplicada: {id}» (`:350-362`).
3. **Desplegable «Cambiar de qué medición sale cada dato»** (`:369-396`, plegado). Nota: «Cada dato se toma de la medición de esta toma con la misma clave. Podés cambiarlo. Que una medición exista no alcanza: cada versión del método declara qué necesita, en qué unidad y obtenida de qué manera. Si algo no corresponde, el cálculo no se hace.» Después, **un select por cada dato que pide el método**, con rótulo «{métrica} ({unidades admitidas})». Primera opción: «Con qué medición». Las demás: **todas** las mediciones vigentes de la toma, «{métrica}: {valor y unidad}» (o «Sin valor vigente») « · {Medido o Reportado}» + « · Corregida».
4. **Botones** «Cancelar» (secundario) y «Calcular» (primario, deshabilitado hasta que todos los datos tengan medición) (`:398-405`).

#### 2.1.5 Bloque «Mediciones» (`web/evaluaciones.tsx:227-246, 261-434`)

- `<h3>` «Mediciones» (siempre).
- Desplegable «Medido, reportado o calculado» (siempre, plegado): «Medido lo tomó el profesional; Reportado lo informó la persona; Calculado lo derivó BE con un método declarado.» (`:229-231`; `dom/copy-antropometria.ts:54`).
- **Grupos por familia**, en este orden, cada uno con su `<h4>` y solo si tiene mediciones (`:232-245, 252`; `dom/figura-antropometrica.ts:20-26`):
  1. «Masa y estatura»
  2. «Perímetros»
  3. «Pliegues cutáneos»
  4. «Diámetros»
  5. «Otras mediciones del protocolo»

  Ojo: acá los perímetros van **antes** que los pliegues; en «En preparación» es al revés (ver R-14).
- **Una fila por medición** (no es una tabla: es una lista con grilla de 3 columnas, `apps/web/src/app/globals.css:2294-2299`):

| Columna | Contenido | Formato |
|---|---|---|
| Nombre | Nombre de la métrica (`nombreDeMetrica`) en seminegrita | p. ej. «Pliegue tricipital» |
| Valor | El valor **que rige** (el corregido si hay corrección; si no, el original), alineado a la derecha, en negrita (`:331`) | `cantidad()`: coma decimal, punto de miles, todos los decimales, un espacio y la unidad: «72,5 kg» |
| Estado + acciones | Texto gris: «{Medido o Reportado} · {Vigente}» o «… · **Anulada**» (en negrita), más « · Corregida» o « · Sin valor vigente» si tiene correcciones (`:333-336`). A la derecha, dos botones compactos: «Corregir» y «Anular» (`:337-346`) | los botones no aparecen si la medición está anulada o si ya hay un formulario abierto en esa fila |

- **Debajo de la fila, condicionales:**
  - Nota «Protocolo: {nombre} · {fecha y hora}»: solo si esa medición tiene otro protocolo u otro momento que el de la toma (`:349-353`).
  - Desplegable «Correcciones ({n})»: nota «Valor original: {valor}»; lista ordenada con una fila por corrección «{valor} · {motivo} · {autor} · {fecha y hora}»; y al final «**Valor vigente:** {valor}» o el aviso «La historia de correcciones de esta medición no se puede resolver. No se muestra un valor vigente hasta que se revise.» (`:355-381`).
  - Si está anulada: aviso informativo «Medición anulada. Su historia se conserva. Por qué se anula: «{motivo}» · {autor} · {fecha y hora}» y nota «Una medición anulada no se reactiva. Si hay una observación nueva, se registra como una medición nueva.» (`:383-391`). La fila anulada se ve en gris, **sin tachar** (`apps/web/src/app/globals.css:2331-2335`).
- **Formulario «Corregir»** (en la fila; `:393-414`): campo «Valor ({unidad})» (teclado decimal, 12 caracteres, **empieza vacío**), campo «Por qué se corrige» (1000 caracteres), botones «Cancelar» y «Corregir medición» (primario; deshabilitado hasta que haya valor y motivo).
- **Formulario «Anular»** (en la fila; `:416-431`): aviso «Anular no borra nada: la medición y su historia se conservan, con el motivo y quién la anuló. Deja de contar para la evolución y para los cálculos.»; campo «Por qué se anula» (1000 caracteres); botones «Cancelar» y «Anular esta medición» (secundario, **no** rojo; deshabilitado hasta que haya motivo). No hay diálogo modal: son dos pasos en la fila.

---

### 2.2 Pestaña «En preparación» (`web/preparacion.tsx`)

Es el **único lugar donde se cargan mediciones**. Es una sola sección con un formulario largo y una barra de acciones fija al pie.

#### Avisos (condicionales, arriba)

- Éxito: aviso flotante con «Guardado» (`:328, 384-388`; `dom/copy-antropometria.ts:37`).
- Error o info: aviso arriba con el foco. Si es por validación: «Antes de guardar, revisá estas mediciones. Cada una lleva a su campo:» y una lista de enlaces, uno por problema: «{nombre de la medición}: {problema}» o «Fuera del protocolo, fila {n} ({qué se midió | valor | unidad}): {problema}». Cada enlace lleva al campo (`:262-279, 389-410`).

#### Cabecera de la sección

| Elemento | Texto | Visible | Cita |
|---|---|---|---|
| `<h2>` | «Evaluación en preparación» si ya hay una guardada; «Nueva evaluación» si no | siempre | `:413` |
| Desplegable «Qué es una evaluación en preparación» | «Una evaluación en preparación no forma parte de la historia: no aparece en la evolución ni como última evaluación registrada.» | siempre (plegado) | `:414-416` |

#### Datos de la toma (grilla de campos, `:419-443`)

| Campo | Tipo | Valores / detalle |
|---|---|---|
| «Cuándo se tomó» | fecha y hora (`datetime-local`) | Por defecto, ahora (`:179`). Con un borrador con mediciones, el momento de la primera (`:198-201`) |
| «Protocolo» | `<select>` (ocupa dos columnas en escritorio) | Una opción por protocolo vigente del catálogo, con su nombre. Por defecto, el primero que devuelve la API (`:170, 191`). Cambiarlo reacomoda lo cargado sin perder nada (`:215-235`) |
| «Cómo se obtuvo» | `<select>` | «Medición del profesional» · «Lo informó la persona» (`:435-436`; `dom/copy-antropometria.ts:277-281`). Debajo, texto de ayuda: «Medido lo tomó el profesional; Reportado lo informó la persona; Calculado lo derivó BE con un método declarado.» |
| «Contexto (opcional)» | texto de una línea, hasta 2000 caracteres | `:442` |

**Estos cuatro datos son de la toma entera**, no de cada medición (`:174-178, 281-285`).

#### «Mediciones» (`<h3>`, `:445`)

Con un protocolo que declara métricas, la zona es de dos columnas en pantallas de 56rem o más: la figura a la izquierda (fija al hacer scroll) y la lista a la derecha (`apps/web/src/app/globals.css:1408-1429`).

**La figura** (`web/figura.tsx`; condicional: solo si alguna métrica del protocolo tiene sitio en ella, `web/preparacion.tsx:447-453`):
- Dos siluetas dibujadas para BE (no son las imágenes de la Lámina): «De frente» y «De espalda», una al lado de la otra, cada una con su rótulo abajo (`web/figura.tsx:57-60, 90-92`). Es **una sola silueta**, sin variante por sexo.
- Sobre la silueta, un **punto** por pliegue (círculo) y un **anillo** por perímetro (elipse) (`web/figura.tsx:76-86`).
- Qué significa cada estado, por **forma**, nunca por color (`apps/web/src/app/globals.css:1464-1499`): punto vacío = sin dato; punto lleno = con dato; anillo punteado = sin dato; anillo de trazo continuo y más grueso = con dato; halo = el campo que se está cargando (o el puntero encima). Todos del mismo color.
- **Interactivo:** clic en un punto o anillo lleva al campo de esa medición en la lista y le da el foco (`web/preparacion.tsx:364-376`). El `title` del punto dice «{nombre}: cargado» o «{nombre}: sin cargar» (`web/figura.tsx:75`). No se cargan valores sobre la figura.
- La figura **no recibe los valores**, solo si hay dato (`dom/figura-antropometrica.ts:136-155`).
- Leyenda debajo (`web/figura.tsx:97-112`): muestra de punto + «Pliegue»; muestra de anillo + «Perímetro»; «Lleno: ya tiene dato. Vacío: todavía no.»; «La figura ubica el sitio de toma; no califica el valor.»
- Nota debajo de la figura: «Tocá un punto para ir a su campo. La lista tiene las mismas mediciones, en el orden del protocolo.» (`web/preparacion.tsx:451`).
- **Qué sitios conoce** (14, `dom/figura-antropometrica.ts:119-134`): de frente, 6 pliegues (bíceps, cresta ilíaca, supraespinal, abdominal, muslo frontal, pantorrilla) y 6 perímetros (brazo relajado, brazo flexionado, cintura, cadera, muslo, pantorrilla); de espalda, 2 pliegues (tríceps, subescapular). Ver R-3: el protocolo completo tiene 24 pliegues y perímetros.

**La lista** (`web/preparacion.tsx:454-506`): un `<fieldset>` por familia con su `<legend>`, en este orden (`dom/figura-antropometrica.ts:16, 95-99`): «Masa y estatura», «Pliegues cutáneos», «Perímetros», «Diámetros», «Otras mediciones del protocolo». Adentro, una fila por métrica del protocolo, en el orden del protocolo:

| Parte de la fila | Contenido |
|---|---|
| Rótulo | El nombre que declara el protocolo (si no declara nombre, la clave tal cual) |
| Campo | Texto con teclado decimal, 12 caracteres |
| Unidad | Texto fijo si el protocolo admite una sola (p. ej. «mm»); `<select>` (nombre accesible «Unidad de {nombre}») si admite varias |
| Estado | Texto «Cargado» o «Sin cargar» (`:493`) |
| Error | «⚠ {mensaje}» debajo, si el valor no se entiende como número |

**Fuera del protocolo** (`:510-563`):
- `<h4>` «Fuera del protocolo» + nota «Lo que el protocolo elegido no declara se carga acá, con qué se midió y su unidad.» (condicional: si el protocolo declara métricas).
- Por cada fila libre: tres campos, «Qué se midió» (60 caracteres), «Valor» (12) y «Unidad» (24), y un botón-enlace «Quitar medición».
- Botón secundario compacto «Agregar otra medición» (o «Agregar medición» si el protocolo no declara métricas). Deshabilitado si no hay protocolo.
- Nota «Una evaluación sin mediciones no se puede registrar.» (condicional: hay borrador guardado y no tiene mediciones, `:564`).

#### Barra fija al pie (`:569-579`; `apps/web/src/app/globals.css:2367-2376`)

| Elemento | Texto | Visible |
|---|---|---|
| Estado del guardado | «Guardado por última vez: {fecha y hora}» · o «Abierta el: {fecha y hora}» (borrador sin mediciones) · o «Todavía no se guardó.» (`:71-74, 570`) | siempre |
| Botón «Guardar» | Primario si no hay borrador; secundario si ya lo hay | siempre |
| Botón «Registrar evaluación» | Primario. Deshabilitado si el borrador guardado no tiene mediciones | condicional: solo si ya hay un borrador guardado |

#### Diálogo de confirmación de registro (`:582-593`; `apps/web/src/components/dialogo.tsx`)

`<dialog>` modal. Título «Registrar evaluación». Texto: «Al registrarla pasa a formar parte de la historia del asesorado y de su evolución. Después no se edita: si hace falta cambiar un valor, se corrige o se anula la medición, y queda constancia.» Botones: «Volver» (secundario, recibe el foco inicial) y «Registrar esta evaluación» (primario; mientras envía dice «Registrando…»). `Esc` equivale a «Volver».

«Registrar» **guarda primero** lo que hay en pantalla y después registra (`:296-357`). Al terminar, lleva a la pestaña Evaluaciones (`:143-146`).

---

### 2.3 Pestaña «Evolución» (`web/evolucion.tsx`, `web/grafico-de-evolucion.tsx`)

#### Sección «Período» (siempre visible, también mientras carga o falla)

- `<h2>` «Período» (`web/evolucion.tsx:55`).
- Formulario en una línea (`apps/web/src/app/pro/advisees/periodo.tsx:38-46`): campo de fecha «Desde», campo de fecha «Hasta», botón secundario «Ver período».
- Los dos campos empiezan **vacíos**. Sin fechas, la API usa los últimos 90 días hasta hoy (`api/evolucion.service.ts:101-110`).
- Es el **único filtro** de la pestaña, junto con el select de métrica y, si aparece, el de grupo.

#### Sección de datos del período (cuando la lectura responde bien)

| Elemento | Texto | Visible | Cita |
|---|---|---|---|
| Nota | «Período: {fecha} a {fecha}» | siempre | `web/evolucion.tsx:77-79` |
| Aviso informativo | «Esta evolución se armó con lo que vos podés consultar. El asesorado tiene evaluaciones de otro profesional en este período: existen, y no se muestran acá.» | condicional: `partialView` | `:80-84` |
| Párrafo | «Todavía no hay mediciones registradas en este período.» | condicional: ninguna métrica con datos | `:85-86` |
| Select «Métrica» | Una opción por métrica con datos en el período: «{nombre} ({cantidad de puntos})», en el orden del catálogo (primero mediciones, después resultados) | condicional: hay métricas | `:88-99` |
| Nota | «La métrica que estabas viendo no tiene observaciones en este período: se muestra la primera disponible.» | condicional: al cambiar el período, la métrica elegida ya no está | `:101` |

Por defecto se elige la **primera métrica de la respuesta** (`dom/evolucion-antropometrica.ts:182-185`), y la API ordena la respuesta **alfabéticamente por código** (`api/evolucion.service.ts:149`). No es «Peso»: ver R-31.

#### Sección de la métrica (`EvolucionDeMetrica`, `web/grafico-de-evolucion.tsx:95-141`)

| Elemento | Contenido | Visible |
|---|---|---|
| `<h2>` | El nombre de la métrica (`:97`) | siempre |
| Desplegable «Cómo se lee» | Tres párrafos: «Los días sin medición aparecen como «Sin dato». No se completan con cero ni se unen con una línea.» / «Dos mediciones se comparan solo si comparten protocolo, método y unidad. Cuando no, se muestran igual, señaladas.» / «La tabla tiene las mismas observaciones y los mismos huecos que el gráfico.» (`:99-103`) | siempre (plegado) |
| Aviso + select «Grupo de comparabilidad» | Aviso: «Las observaciones de esta métrica no son todas comparables entre sí: se muestran por grupo, cada uno en su propio eje. Elegí cuál ver.» Select con una opción por grupo: «{protocolo} · {método, si lo hay} · {unidad} ({cantidad})» (`:105-123`; nombre del grupo en `dom/evolucion-antropometrica.ts:216-229`) | condicional: la métrica tiene observaciones de más de un grupo |
| Nota | «Hay una sola observación en el período: todavía no hay evolución que mirar. Podés ampliar el período.» (`:124`) | condicional: una sola observación en el grupo visible |
| Gráfico | ver abajo | condicional: hay observaciones |
| Panel de la observación elegida | ver abajo. Si no hay ninguna elegida: nota «Elegí una observación con un clic, un toque o las flechas para ver su valor exacto y su origen.» (`:128-138`) | condicional |
| Tabla | ver abajo | siempre |

Por defecto se ve el grupo de la **observación más reciente** (`dom/evolucion-antropometrica.ts:175-179`).

**Gráfico** (`Grafico`, `web/grafico-de-evolucion.tsx:150-262`; Recharts, 300 px de alto):
- Leyenda de figura arriba (`figcaption`): «Evolución: {métrica} · {grupo}. Eje horizontal: fecha de la observación, a escala; eje vertical: valor en su unidad. Solo puntos: los días sin observación quedan vacíos, no se unen ni se completan. Fechas y horas en la zona del período ({zona}).» (`:186-188`).
- **Eje horizontal:** el tiempo, a escala, de punta a punta del período pedido. Entre 1 y 7 marcas, cada una con una fecha (`:205-223`; `dom/evolucion-antropometrica.ts:95-110`).
- **Eje vertical:** el valor, en la unidad del grupo (el rótulo del eje es la unidad, en vertical). No arranca en cero: tiene margen arriba y abajo de los valores (`:171-177, 224`; `dom/evolucion-antropometrica.ts:75-93`).
- **Marcas:** un punto por observación. **No hay líneas** entre puntos, ni tendencia, ni promedio (`:8-10`). Todas las marcas del mismo color (`var(--grafico-registrado)`):
  - círculo = observación comparable con la anterior;
  - **rombo** = no comparable con la anterior;
  - punto con el **centro claro** = valor corregido;
  - aro alrededor = la observación elegida (`:229-246`).
- **Leyenda** debajo (`:251-259`), tres ítems: «Observación comparable con la anterior» · «No comparable con el punto anterior (el motivo, en la tabla)» · «Un punto con centro claro: valor corregido».
- **Interacción:** clic o toque en un punto lo elige; con el foco en el gráfico, flechas, Inicio y Fin recorren los puntos (`:189-200`; `apps/web/src/lib/graficos.ts:27-35`). Con mouse, un recuadro flotante al pasar: fecha y hora en negrita, «{valor} · {clase}» + « · Corregida», y la nota «Clic o toque para ver el detalle» (`:264-276`).

**Panel «Observación elegida»** (`Detalle`, `:278-314`):
- `<h4>` «Observación elegida: {fecha y hora}» + « · {n} de {m} del día» si hay más de una ese día.
- Lista de pares rótulo-valor:

| Rótulo | Valor |
|---|---|
| «Valor» | valor y unidad |
| «Tomada el» | fecha y hora de la toma |
| «Registrada el» | fecha y hora del registro |
| «Clase» | «Medido», «Reportado» o «Calculado» |
| «Protocolo» | nombre del protocolo (con « (versión {ref})» si hay dos versiones del mismo nombre), o «—» |
| «Método» (solo si el grupo tiene método) | «Calculado con el método «{nombre}»» o «Calculado con el método declarado en la evaluación (referencia {id})» (`dom/evolucion-antropometrica.ts:247-250`) |
| «Corrección» | «El valor vigente viene de una corrección: el original se conserva en la evaluación.» o «Valor original, sin correcciones.» |
| «Comparabilidad» | «Comparable con el punto anterior» o «No comparable con el punto anterior: {motivos}» |

  Motivos posibles: «Se tomó con otro protocolo», «Se calculó con otro método», «Está en otra unidad» (`dom/copy-antropometria.ts:150-154`).
- Botón secundario «Abrir la evaluación de origen»: va a la pestaña Evaluaciones con esa toma abierta (`:308-310`; `web/evolucion.tsx:64`).
- **Comparación** (condicional: hay más de una observación en el grupo; `:316-338`): select «Comparar con», con «No comparar» y una opción por cada otra observación («{fecha y hora} · {valor} · {clase}»). Al elegir una: «**Diferencia:** {±valor y unidad}, {el mismo día | con {n} día(s) de calendario entre las fechas}» y la nota «Es una resta entre dos valores del mismo grupo. No es una valoración de progreso ni un resultado clínico.» El signo es «+» o «−»; ejemplo de la prueba: «−1,5 kg» (`dom/evolucion-antropometrica.test.ts:152`).

**Tabla** (`Tabla`, `:340-408`):
- Título (`caption`): «Tabla de observaciones: {n} con dato · {d} sin dato».
- **Encabezados de columna, exactos:** «Fecha» · «Valor» · «Cómo se obtuvo» · «Comparabilidad» · «Acciones» (`:350-354`).
- Filas, en orden de tiempo, de dos tipos:
  - **hueco:** fecha (o «{desde} — {hasta}»), insignia «Sin dato» o «{n} días sin dato», y «—» en las otras tres columnas;
  - **observación:** fecha y hora (+ « · {n} de {m} del día»); valor y unidad (+ insignia «Corregida»); «{clase} · {protocolo}»; «Comparable con el punto anterior» o «No comparable con el punto anterior: {motivos}» (+ « · en otro grupo, no está en el gráfico actual»); botón-enlace «Ver en el gráfico» (o «—» si es de otro grupo).
- La tabla trae las observaciones de **todos** los grupos y **todos** los huecos del período; el gráfico, solo el grupo elegido.

---

### 2.4 Pestaña «Lámina» (`web/lamina.tsx`, `web/lamina-dibujo.tsx`, `web/lamina-descarga.tsx`)

Arma una imagen vertical (1080 × 1920) con los datos **registrados** y la deja descargar como PNG. Disposición en pantallas de 69rem o más: una columna izquierda (20 a 26rem) con lo que se elige, los ajustes y las notas, y a la derecha la imagen, fija al hacer scroll (`apps/web/src/app/globals.css:1947-1965`).

`<h2>` «Lámina» (`web/lamina.tsx:432`).

#### Qué se muestra (columna izquierda, arriba)

| Control | Detalle | Visible |
|---|---|---|
| Aviso | «La evaluación pedida no está entre las registradas: se muestra la más reciente.» (`:433-437`) | condicional: la URL pide una evaluación que no está |
| Select «Toma» | Una opción por evaluación registrada, la más reciente primero: «{día} · {n} mediciones». Al cambiar, actualiza la URL (`:451-461`) | condicional: modo Medición |
| Grupo «Tomas de la serie» | Nota «Hasta ocho tomas registradas. En la lámina van por fecha: T1 es la más antigua.» y **una casilla por evaluación registrada**, la más reciente primero, con «{día}» + « · T{n}» si está marcada. Con 8 marcadas, las demás quedan deshabilitadas. Por defecto, las 4 más recientes (`:463-480`; `dom/lamina.ts:76, 1032`) | condicional: modo Serie |
| Grupo de botones «Lámina» | Tres botones de opción, uno apretado a la vez: «Circunferencias» · «Pliegues» · «Conclusiones». En modo Serie, el tercero se llama «Evolución» (`:259, 482-488`) | siempre |

#### La imagen y su descarga (columna derecha)

| Control | Detalle | Visible |
|---|---|---|
| Vista previa | El SVG de la lámina, escalado al ancho. No es interactivo: es una imagen con una descripción en texto | siempre que haya algo que dibujar |
| Botón «Ver en tamaño real» / «Ver entera» | Alterna. Ampliada, agrega la nota «La lámina está a su tamaño real: desplazala con el dedo para recorrerla. La imagen que se descarga es la misma, al doble.» (`:501-508`) | siempre que haya imagen |
| Botón primario «Descargar imagen» | Mientras prepara dice «Preparando la imagen…». Después, estado «La imagen se descargó.» o «No se pudo preparar la imagen. Probá de nuevo.» (`:509-516`). Baja un PNG de 2160 × 3840 (`web/lamina-descarga.tsx:1-3`) llamado `lamina-AAAA-MM-DD-{hoja}-{encuadre}.png` o `lamina-serie-…-a-…-{hoja}-{encuadre}.png` (`dom/lamina.ts:1041-1053`) | siempre; deshabilitado si no hay imagen o faltan cálculos por cargar |

#### «Cómo se ve» (ajustes; `<h3>` «Cómo se ve», `:519-549`)

Cuatro grupos de botones de opción (uno apretado a la vez por grupo):

| Grupo | Opciones | Por defecto | Visible |
|---|---|---|---|
| «Modo» | «Medición» · «Serie» | Medición | siempre |
| «Encuadre» | «Entero» · «Tren superior» · «Tren inferior». En Serie solo los dos últimos | Entero (en Serie pasa a Tren superior) | condicional: la hoja no es Conclusiones/Evolución |
| «Figura» | «Hombre» · «Mujer» | Hombre | condicional: la hoja no es Conclusiones/Evolución |
| «Tema de la lámina» | «Claro» · «Oscuro» · «Azul» | Claro, o el último usado en este navegador (`:76-86`) | siempre |

Y, solo en **Serie + «Evolución»**: grupo «Qué va en la lámina», con la nota «Hasta ocho. Cada resultado calculado es una serie por método y versión: dos métodos no se comparan entre sí.» y **una casilla por serie disponible**: «Peso», «Perímetro de cintura» y una por cada resultado calculado («{nombre} · {método} · v{versión}»). Por defecto las 6 primeras; máximo 8 (`:388-399, 568-594`; `dom/lamina.ts:971-1012`).

#### Pie (notas y explicación; `:551-561`)

Notas condicionales, en gris, con la forma «**{título}:** a · b · c»:
- «Con valor, en otro encuadre: …» (medidas que la toma tiene y este encuadre no muestra)
- «Sin sitio en la figura: …» (peso, talla, edad, diámetros y lo que la lámina no conoce, cada uno con su valor)
- «Con más de una medición vigente en la toma (la lámina muestra la más reciente): …»
- «No entran en la lámina (están en el detalle de la evaluación): …»
- «Los cálculos sin efecto (reemplazados o con una entrada anulada) no van en la lámina; se conservan en el detalle de la evaluación. ({n})»
- «La lista de cálculos llegó incompleta: puede faltar alguno.»
- «La evaluación solicitada no está disponible. La lista de evaluaciones sigue completa.» (Serie, si una toma responde 404)

Desplegable «Cómo se lee» (siempre, plegado), con hasta cinco párrafos según el modo:
- «La lámina arma con los datos registrados la del compositor de Dirección: ubica cada medida sobre la figura y no califica ningún valor. Los datos completos siguen en el detalle de cada evaluación.»
- «La figura ubica dónde se tomó cada medida. Elegí la que prefieras ver: no cambia ningún dato.» (si hay figura)
- «La diferencia es una resta entre la primera y la última toma con dato, y se hace solo si comparten protocolo, método y unidad; si no, la tarjeta dice «No comparables». No califica el cambio, y una toma sin dato corta la línea.» (Serie)
- «En Serie la figura va en tren superior o inferior, como en el compositor.» (Serie con figura)
- «El tema es solo de la lámina: no cambia la apariencia del website.»

#### Qué dibuja la imagen (lectura rápida de `web/lamina-dibujo.tsx`)

Común a todas las hojas: fondo con degradé del tema; encabezado con el **título en mayúsculas** («CIRCUNFERENCIAS», «PLIEGUES», «CONCLUSIONES» o «EVOLUCIÓN») y una línea «{NOMBRE} · ANTROPOMETRÍA · {FECHA}» (en Serie: «{NOMBRE} · EVOLUCIÓN ANTROPOMÉTRICA · {fecha → fecha}») (`web/lamina.tsx:283, 371`; `web/lamina-dibujo.tsx:260-295`); arriba a la derecha, una píldora con el encuadre: «CUERPO ENTERO», «TREN SUPERIOR» o «TREN INFERIOR» (en Serie, «SERIE · TREN SUPERIOR»; en Evolución, «SERIE») (`dom/figura-de-lamina.ts:41-45`); al pie, el isotipo de BE y «BETTER EVERYDAY» (`web/lamina-dibujo.tsx:322-331`).

| Hoja | Qué dibuja | Textos que imprime |
|---|---|---|
| **Circunferencias** (Medición) | La figura (PNG de hombre o mujer) a la derecha, con un **anillo** por perímetro que tiene valor. A la izquierda, tarjetas apiladas (hasta 4: cuello-hombros-pecho; brazos; cintura-abdomen-cadera; piernas), una fila por sitio **con valor**: rótulo, valor grande, unidad. Una línea guía une cada fila con su sitio. Al pie, si la toma tiene algún diámetro, el bloque de tres tarjetas | Rótulos de fila: «Cuello», «Hombros», «Pecho», «Brazo relajado», «Brazo contraído», «Antebrazo», «Muñeca», «Cintura», «Abdomen bajo», «Cadera», «Muslo», «Pantorrilla», «Tobillo». Bloque «DIÁMETROS ÓSEOS»: «Codo», «Muñeca», «Rodilla» (el que falta dice «—»). Sin datos: «Sin medidas para mostrar» / «Esta toma no tiene medidas para este encuadre.» |
| **Pliegues** (Medición) | Igual, con un **punto** por pliegue. Tríceps y subescapular llevan la marca «posterior» (y, según el comentario de `dom/lamina.ts:175-176`, su guía punteada). Al pie, una tarjeta con tres columnas | Rótulos: «Pectoral», «Axilar media», «Tríceps», «Bíceps», «Subescapular», «Antebrazo», «Supraespinal», «Cresta ilíaca», «Abdominal», «Muslo anterior», «Pantorrilla». Pie: «PLIEGUES EN LA FIGURA» (un número), «SUMA 6 PLIEGUES (ISAK)» y «SUMA 7 PLIEGUES (JP)» (valor calculado o «Sin calcular») |
| **Conclusiones** (Medición) | Sin figura. Rótulo arriba y una tarjeta por categoría, cada fila con el método, un detalle opcional, el valor y la unidad | «RESULTADOS CALCULADOS, CADA UNO CON SU MÉTODO». Títulos de tarjeta: «Datos de la toma» (Peso, Talla, Edad, con «Medido» o «Reportado» debajo), «Índices», «Sumas de pliegues», «Grasa corporal», «Masas corporales», «Somatotipo», «Otros cálculos». Sin resultados: «Sin resultados calculados» / «Todavía no hay resultados calculados para esta toma. Se calculan desde el detalle de la evaluación, en «Cálculos».» |
| **Circunferencias / Pliegues** (Serie) | Arriba, una ficha por toma («T1», «T2»… con su fecha; la última resaltada) y una franja de resumen. La figura al centro; a los lados, una tarjeta por sitio con: nombre, último valor, la diferencia entre la primera y la última toma, un gráfico chico **con línea** (ejes: T1…Tn y el valor) y los valores de cada toma | Franja: «PESO (kg)», «TALLA (cm)» con «a → b → c» (en Pliegues, solo el peso). Diferencia: una resta con signo, con el formato de «−1,5 kg» (`dom/evolucion-antropometrica.test.ts:152`), o «No comparables». Sin datos: «Las tomas elegidas no tienen medidas para este encuadre.» / «Serie sin tomas» / «Elegí al menos una toma para armar la serie.» |
| **Evolución** (Serie) | Sin figura. Hasta 8 tarjetas en dos columnas: ícono, nombre en mayúsculas, método, último valor, una píldora con la diferencia (o «—») y un gráfico con línea y el valor sobre cada punto. Al pie, una línea de resumen | «{N} TOMAS · T1 {fecha} → T{n} {fecha}». Sin series: «Las tomas elegidas no tienen peso, cintura ni resultados calculados.» |

En la Lámina la diferencia es **siempre de un solo color**: el dominio documenta que el compositor original la pintaba verde o naranja y que BE no lo hace (`dom/lamina.ts:12-18`).

---

## 3. Estados

### 3.1 De toda el área (`web/antropometria.tsx:98-108`)

| Estado | Texto literal | Cita |
|---|---|---|
| Sin sesión | «Redirigiendo a Iniciar sesión…» | `:98` |
| Cargando la cuenta o una lectura | «Cargando…» | `apps/web/src/components/estados.tsx:14-20` |
| Error al cargar | «No pudimos cargar esta vista.» + botón-enlace «Reintentar» | `apps/web/src/components/estados.tsx:33-44`; `dom/copy.ts:37-38` |
| La cuenta no tiene espacio profesional | «No encontramos un recurso disponible para esta acción.» + enlace «Ir a tu cuenta» | `apps/web/src/app/pro/espacio-profesional.tsx:56-65` |
| **No disponible** (404: no existe, es ajeno, o el acceso se retiró; no se distingue) | «No encontramos un recurso disponible para esta acción.» + enlace «Volver» (a `/pro`) | `web/antropometria.tsx:57-66`; `dom/copy-vinculo.ts:134, 56` |
| **Acceso retirado en medio de una escritura** | Una escritura que recibe 404 reemplaza **toda la pestaña** (pestañas incluidas) por el aviso «No disponible» | `web/antropometria.tsx:90-95, 108` |

### 3.2 Por sección

| Sección | Estado | Texto literal |
|---|---|---|
| Evaluaciones | Vacío | Título «Todavía no hay evaluaciones registradas.»; nota «Una toma se carga en «En preparación» y pasa a esta lista cuando se registra.»; botón primario «Preparar una toma» (lleva a En preparación) (`web/evaluaciones.tsx:145-156`) |
| Evaluaciones | Solo lectura | Insignia «Solo lectura» en el título de la toma |
| Evaluaciones | Evaluación pedida no disponible / falló | ver §2.1.1 |
| Cálculos | Cargando / error | «Cargando…» / «No pudimos cargar esta vista. Reintentar» (`web/calculos.tsx:70-71`) |
| Cálculos | Vacío | «Todavía no hay cálculos para esta evaluación.» |
| Cálculos | Sin catálogo | «No hay métodos seleccionables en el catálogo.» |
| Cálculos | Sin dato de una entrada | «Valor no disponible para vos» |
| Cálculos | Sin efecto | Insignia «Sin efecto» + desplegable «Por qué está sin efecto» |
| Mediciones | Anulada | «Anulada» en negrita + aviso de la anulación + «Una medición anulada no se reactiva. …» |
| Mediciones | Cadena de correcciones rota | «Sin valor vigente» y «La historia de correcciones de esta medición no se puede resolver. No se muestra un valor vigente hasta que se revise.» |
| En preparación | Sin borrador | Título «Nueva evaluación» y el formulario vacío. Barra: «Todavía no se guardó.» |
| En preparación | Borrador sin mediciones | «Una evaluación sin mediciones no se puede registrar.» y «Registrar evaluación» deshabilitado |
| En preparación | El protocolo elegido no declara métricas (o no hay protocolo), no hay filas libres y no hay mediciones guardadas | «No hay ninguna evaluación en preparación.» (`web/preparacion.tsx:516`). Sin protocolo, además, «Agregar medición» queda deshabilitado (`:560`) |
| En preparación | Sin dato de un campo | «Sin cargar» |
| Evolución | Vacío | «Todavía no hay mediciones registradas en este período.» |
| Evolución | Vista parcial | «Esta evolución se armó con lo que vos podés consultar. El asesorado tiene evaluaciones de otro profesional en este período: existen, y no se muestran acá.» |
| Evolución | Una sola observación | «Hay una sola observación en el período: todavía no hay evolución que mirar. Podés ampliar el período.» |
| Evolución | Sin dato | Insignia «Sin dato» o «{n} días sin dato» en la tabla; nada en el gráfico |
| Evolución | Período inválido | «⚠ «Desde» no puede ser posterior a «Hasta».» / «⚠ El período puede abarcar hasta 92 días.» (junto al campo «Desde»; `apps/web/src/app/pro/advisees/periodo.tsx:32-33`) |
| Lámina | Vacío | `<h2>` «Lámina» + «Todavía no hay evaluaciones registradas.» (sin botón) (`web/lamina.tsx:119-123`) |
| Lámina | Cargando / error de una toma | «Cargando…». Error en Medición: «No pudimos cargar esta vista.» + «Reintentar» (`web/lamina.tsx:275-276`). Error en Serie: «No se pudo cargar una de las tomas.» + «Reintentar» (`:378-379`) |
| Lámina | Sin dato | Adentro de la imagen: «Sin medidas para mostrar», «Sin resultados calculados», «Serie sin tomas», «Sin calcular», «—» (ver §2.4) |

**Vista parcial:** solo Evolución la dice. Evaluaciones y Lámina listan únicamente las tomas del profesional que mira (`api/evaluaciones.service.ts:259-260`) y no avisan que puede haber otras.

---

## 4. Datos que llegan a la pantalla

### 4.1 La evaluación (una «toma») — `dom/contratos-antropometria.ts:158-173`

| Campo | Significado | Tipo / unidad | Opcional |
|---|---|---|---|
| `evaluationId` | identificador | texto | no |
| `adviseeId` | el asesorado | texto | no |
| `author` | el profesional que la cargó: `identityId` y `displayName` | objeto | no |
| `state` | `IN_PREPARATION` o `REGISTERED` | enumerado | no |
| `context` | texto libre («Contexto (opcional)») | texto, hasta 2000 | sí (nulo) |
| `version` | token para no pisar un guardado ajeno | texto | no |
| `measurements` | las mediciones | lista | no (puede estar vacía en un borrador) |
| `derivedResults` | resultados calculados embebidos | lista | no. **La pantalla no lo usa**: los cálculos se piden aparte (`web/calculos.tsx:39-49`) |
| `occurredAt` | cuándo se tomó | instante | no |
| `recordedAt` | cuándo se creó el registro | instante | no |
| `registeredAt` | cuándo se registró | instante | sí (nulo mientras está en preparación) |

**Quién midió:** hay un solo autor, el de la evaluación. Las correcciones y la anulación tienen cada una su propio autor.

El **resumen** que alimenta la lista (`dom/contratos-antropometria.ts:176-190`): `measurementCount`, `annulledCount`, `metrics` (claves), `derivedResultCount` (la API lo manda siempre en 0, `api/evaluaciones.service.ts:274`), `occurredAt`, `registeredAt`, `author`.

### 4.2 La medición — `dom/contratos-antropometria.ts:111-130`

| Campo | Significado | Opcional |
|---|---|---|
| `metric` | qué se midió (clave, p. ej. `pliegue-triceps`) | no |
| `magnitude` `{value, unit}` | el valor **como se tomó**, con su unidad de origen | no |
| `effectiveMagnitude` `{value, unit}` | el valor **que rige** (con correcciones) | sí: nulo si la cadena de correcciones no se puede resolver |
| `origin` | `DIRECT_CAPTURE`, `SELF_REPORTED` o `CONTROLLED_IMPORT` | no |
| `dataClass` | `MEASURED` («Medido»), `REPORTED` («Reportado») o `DERIVED` («Calculado») | no |
| `protocol` | ficha de comparabilidad: `protocolId`, `protocolVersionId`, `protocolName`, `methodId` y `methodVersionId` (nulos en una medición), `unit` | no |
| `condition` | `EFFECTIVE` («Vigente») o `ANNULLED` («Anulada») | no |
| `annulment` | motivo, autor, momentos | sí (nulo si está vigente) |
| `corrections[]` | cada una: valor, motivo, autor, momento, corrección previa | lista (puede estar vacía) |
| `preparationReference` | referencia opaca de una importación | sí. La pantalla no lo muestra |
| `occurredAt`, `recordedAt` | cuándo se tomó, cuándo se registró | no |

### 4.3 Medido, reportado, calculado

La **clase se deriva del origen**, no se elige (`dom/antropometria.ts:129-133`):

| Origen (lo elige el profesional, para toda la toma) | Etiqueta del origen | Clase resultante |
|---|---|---|
| `DIRECT_CAPTURE` | «Medición del profesional» | «Medido» |
| `SELF_REPORTED` | «Lo informó la persona» | «Reportado» |
| `CONTROLLED_IMPORT` | «Importado con procedencia» | «Medido». **El formulario no ofrece este origen** (`web/preparacion.tsx:181, 435-436`) |
| (un método aplicado sobre mediciones) | — | «Calculado» |

«Reportado» **no** significa que lo cargó el asesorado: lo carga el profesional y declara que el dato se lo dijo la persona.

### 4.4 Qué se mide: protocolos del catálogo

La lista de mediciones la declara el **protocolo** elegido (`dom/figura-antropometrica.ts:47-62`). Según las migraciones del repositorio hay tres protocolos vigentes; el select los ofrece del más nuevo al más viejo (`api/especificaciones.service.ts:52`; `apps/api/src/http/paginacion.ts:83`):

1. **«Perfil antropométrico completo»** (`prisma/migrations/20261001000000_perfil_antropometrico_completo/migration.sql:10-15`; fuente en `scripts/catalogo-antropometrico/catalogo-perfil-completo.cjs:5-36`). 30 mediciones, cada una con una sola unidad:

| Familia | Mediciones (nombre exacto) | Unidad |
|---|---|---|
| Masa y estatura (2) | Peso · Talla | kg · cm |
| Pliegues cutáneos (11) | Pliegue pectoral · Pliegue axilar medio · Pliegue tricipital · Pliegue subescapular · Pliegue bicipital · Pliegue de la cresta ilíaca · Pliegue supraespinal · Pliegue abdominal · Pliegue del muslo frontal · Pliegue de la pantorrilla · Pliegue del antebrazo | mm |
| Perímetros (13) | Perímetro del cuello · Perímetro de hombros · Perímetro del pecho · Perímetro del brazo relajado · Perímetro del brazo flexionado y contraído · Perímetro del antebrazo · Perímetro de la muñeca · Perímetro de cintura · Perímetro del abdomen · Perímetro de cadera · Perímetro del muslo · Perímetro de la pantorrilla · Perímetro del tobillo | cm |
| Diámetros (3) | Diámetro biepicondíleo del húmero (codo) · Diámetro biestiloideo (muñeca) · Diámetro bicondíleo del fémur (rodilla) | cm |
| Otras mediciones del protocolo (1) | Edad al momento de la toma | años |

2. **«Pliegues y perímetros (demostración)»** (`prisma/migrations/20260924130000_protocolo_de_pliegues_y_perimetros/migration.sql:13-35`). 16 mediciones: Peso (kg), Talla (**m o cm**, con select de unidad), 8 pliegues y 6 perímetros: exactamente los 14 sitios que conoce la figura de la toma.
3. **«Protocolo de laboratorio (demostración)»** (`prisma/migrations/20260920220000_metodos_y_calculos/migration.sql:126-131`). 2 mediciones: `peso` (kg) y `talla` (m o cm), **sin nombre ni familia declarados** (ver R-15).

**No se puede determinar** qué protocolos tiene hoy la base desplegada: solo leí las migraciones.

**No hay campo de sexo ni de fecha de nacimiento.** La edad es una medición más, que se tipea en cada toma. El sexo no es un dato: las ecuaciones que cambian por sexo son **métodos distintos** y el profesional elige cuál (`dom/formulas-antropometricas.ts:11-12`). La figura «Hombre / Mujer» de la Lámina es una preferencia de vista, que no se guarda ni se deduce (`web/lamina.tsx:15-16`).

### 4.5 Cálculos e índices

Un **método** (`dom/contratos-calculo.ts:37-60`) declara: nombre, versión, categoría, qué entradas pide (métrica, unidades admitidas, procedencias admitidas), qué da (métrica y unidad), precisión (decimales y redondeo), regla aplicada, descripción, fuente y población.

Una **corrida** (`dom/contratos-calculo.ts:97-134`) guarda: de qué evaluación es, método y versión, regla, resultado (métrica, valor, unidad), precisión, la procedencia de cada entrada, si reemplaza a otra, si está vigente (`effective`) y si es la referencia (`referenceForPurpose`).

**Métodos seleccionables: 21 del catálogo de BE**, confirmados por la prueba de integración (`test/integration/catalogo-antropometrico.int-spec.ts:102-104`), más el sintético «Método de demostración v2» que sigue vigente en las migraciones (`prisma/migrations/20260920220000_metodos_y_calculos/migration.sql:146-155`). El select mostraría 22. Los 21 (`scripts/catalogo-antropometrico/catalogo-metodos.cjs:96-189`, menos los 23 retirados de `:205-229`):

| Categoría | Método (nombre exacto) | Pide | Da · unidad · decimales |
|---|---|---|---|
| Índices | Índice de masa corporal (IMC) | Peso, Talla | Índice de masa corporal · kg/m² · 1 |
| Índices | Índice cintura/cadera | Perímetro de cintura, Perímetro de cadera | Índice cintura/cadera · sin unidad · 2 |
| Índices | Índice cintura/talla | Perímetro de cintura, Talla | Índice cintura/talla · sin unidad · 2 |
| Sumas de pliegues | Suma de 6 pliegues (ISAK) | tríceps, subescapular, supraespinal, abdominal, muslo frontal, pantorrilla | Suma de 6 pliegues (ISAK) · mm · 1 |
| Sumas de pliegues | Suma de 7 pliegues (Jackson y Pollock) | pectoral, axilar medio, tríceps, subescapular, abdominal, cresta ilíaca, muslo frontal | Suma de 7 pliegues (Jackson y Pollock) · mm · 1 |
| Grasa corporal | Durnin y Womersley, hombres · Siri | bíceps, tríceps, subescapular, cresta ilíaca, edad | Grasa corporal (Durnin y Womersley, Siri) · % · 1 |
| Grasa corporal | Durnin y Womersley, mujeres · Siri | ídem | ídem |
| Grasa corporal | Jackson y Pollock, 7 pliegues, hombres · Siri | los 7 pliegues de JP, edad | Grasa corporal (Jackson y Pollock, 7 pliegues, Siri) · % · 1 |
| Grasa corporal | Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri | ídem | ídem |
| Grasa corporal | Masa grasa relativa (RFM), hombres | Talla, Perímetro de cintura | Grasa corporal (RFM) · % · 1 |
| Grasa corporal | Masa grasa relativa (RFM), mujeres | ídem | ídem |
| Masas corporales | Masa ósea (Von Döbeln modificada por Rocha) | Talla, Diámetro biestiloideo, Diámetro bicondíleo del fémur | Masa ósea (Rocha) · kg · 1 |
| Masas corporales | Masa muscular esquelética (Lee, perímetros), hombres | Talla, edad, perímetros de brazo relajado, muslo y pantorrilla, y sus pliegues (tríceps, muslo frontal, pantorrilla) | Masa muscular esquelética (Lee, perímetros) · kg · 1 |
| Masas corporales | Masa muscular esquelética (Lee, perímetros), mujeres | ídem | ídem |
| Masas corporales | Masa grasa (Durnin y Womersley), hombres | Peso, los 4 pliegues de DW, edad | Masa grasa (Durnin y Womersley) · kg · 1 |
| Masas corporales | Masa grasa (Durnin y Womersley), mujeres | ídem | ídem |
| Masas corporales | Masa libre de grasa (Durnin y Womersley), hombres | ídem | Masa libre de grasa (Durnin y Womersley) · kg · 1 |
| Masas corporales | Masa libre de grasa (Durnin y Womersley), mujeres | ídem | ídem |
| Somatotipo | Endomorfia (Heath y Carter) | tríceps, subescapular, supraespinal, Talla | Endomorfia · sin unidad · 1 |
| Somatotipo | Mesomorfia (Heath y Carter) | diámetros de húmero y fémur, perímetros de brazo flexionado y pantorrilla, pliegues de tríceps y pantorrilla, Talla | Mesomorfia · sin unidad · 1 |
| Somatotipo | Ectomorfia (Heath y Carter) | Talla, Peso | Ectomorfia · sin unidad · 1 |

Son 21 métodos pero **15 resultados distintos**: las variantes por sexo dan la misma métrica (`test/integration/catalogo-antropometrico.int-spec.ts:140-141`). Las fórmulas están en `dom/formulas-antropometricas.ts:251-302`. Todos son de finalidad «Soporte antropométrico». **No se puede determinar** qué métodos tiene hoy la base desplegada.

### 4.6 La evolución — `dom/contratos-antropometria.ts:306-373`

Por cada métrica con datos en el período: una lista de **puntos** (`occurredAt`, `recordedAt`, `value`, `unit`, `sourceEvaluationId`, `sourceId`, `dataClass`, `comparabilityGroup`, `correctionState`, `incomparableWithPrevious[]`), una lista de **huecos** (`from`, `to`, `days`) y los **grupos de comparabilidad** (`protocolName`, `protocolVersionId`, `methodVersionId`, `unit`). Además `period` (inicio, fin y zona horaria), `partialView` y un bloque `honesty` que declara que nada se interpoló, imputó ni arrastró.

Entran las mediciones vigentes de evaluaciones registradas **y** los resultados calculados vigentes, como una métrica más de clase «Calculado» (`api/evolucion.service.ts:291-320`). La API publica **un punto por día y por métrica** (`dom/antropometria.ts:328-347`; `api/evolucion.service.ts:133-134, 147`).

### 4.7 Formato de números y fechas

- Números: coma decimal y punto de miles; sin máximo se muestran **todos** los decimales, sin redondear (`dom/formato-numeros.ts:24-37`). Un resultado calculado se muestra con exactamente los decimales que declara su método, aunque termine en cero (`:40-44`). Unidad con un espacio delante; `adimensional` no se escribe (`:53-55`).
- Fechas: `Intl` en `es-AR`, «medium» para el día y «short» para la hora (`apps/web/src/lib/formato.ts:2-6`). El comentario del código da «8 sept 2026» como ejemplo (`:12`). El texto exacto de fecha **y hora** depende del navegador: **no se puede determinar** leyendo el código.

---

## 5. Reglas visibles

### 5.1 Quién puede cargar

- **Solo el profesional, y solo desde el website.** Las tres transiciones de la evaluación tienen como único actor al profesional (`dom/antropometria.ts:42-46`). La API exige la capacidad antropométrica verificada y habilitada (`api/capacidad.ts:13-20`) y el permiso sobre el asesorado en el alcance Antropometría.
- **El asesorado no carga ni corrige nada.** La APK solo lee su evolución (`api/antropometria.controller.ts:178-182`) y no llama a ninguna operación de escritura de antropometría (búsqueda en `apps/mobile`). Su pantalla lo dice: «Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.» (`apk/pantallas/antropometria.tsx:159`).
- **Cada profesional ve solo sus propias tomas.** La lista, el detalle, la corrección, la anulación y los cálculos se filtran por el profesional que mira (`api/evaluaciones.service.ts:259-260, 316-318`; `api/mediciones.service.ts:316-318`; `api/calculos.service.ts:175`).

### 5.2 Qué significa «preparación» acá

«En preparación» es el **estado de borrador de una evaluación**: `EN_PREPARACION → REGISTRADA`, sin vuelta atrás (`dom/antropometria.ts:22-46`).

- Lo que está en preparación **no es historia**: no aparece en Evaluaciones, ni en Evolución, ni en la Lámina, ni en la APK.
- **Guardar y registrar son dos actos distintos.** Registrar pide confirmación y es definitivo.
- Cada «Guardar» **reemplaza** el contenido del borrador (`api/evaluaciones.service.ts:159-163`).
- No existe «descartar borrador»: el dominio dice que ese estado no está incorporado (`dom/antropometria.ts:36-40`).
- **No confundir** con «preparar la revisión» de Nutrición y Entrenamiento, que vive en el mismo archivo compartido (`apps/web/src/app/pro/advisees/retorno-y-preparacion.tsx:44-72`): Antropometría importa de ahí solo el retorno a la ficha (`web/antropometria.tsx:22`).

### 5.3 Lo que no se puede hacer

| Regla | Dónde se ve |
|---|---|
| Una evaluación registrada **no se edita**: solo se corrige o se anula medición por medición | Insignia «Solo lectura»; texto del diálogo de registro |
| **No se puede agregar** una medición a una toma registrada (no hay control para eso) | `web/evaluaciones.tsx` no tiene ninguna acción de alta |
| **No se puede borrar** nada: ni una toma, ni una medición, ni un cálculo | No hay ningún control de borrado. Las palabras «eliminar medición» y «borrar medición» están prohibidas en el copy (`dom/copy-antropometria.ts:298-317`) |
| Una medición anulada **no se reactiva ni se corrige** | Sin botones en la fila; «Una medición anulada no se reactiva. …»; la API lo rechaza (`api/mediciones.service.ts:65-68`) |
| Una corrección **conserva la unidad** | El campo dice «Valor ({unidad})» sin selector; la API rechaza otra unidad (`api/mediciones.service.ts:70-80`) |
| Una evaluación **sin mediciones no se registra** | Botón deshabilitado y nota; la API lo repite (`api/evaluaciones.service.ts:200-209`) |
| La fecha de la toma **no puede ser futura** (tolerancia de 5 minutos) | Solo lo valida la API (`api/evaluaciones.service.ts:32, 468-475`). Ver R-8: el mensaje que se ve es genérico |
| El período de Evolución abarca **hasta 92 días** | Validación en el formulario y en la API (`api/evolucion.service.ts:32, 112-114`) |
| Un método **histórico o retirado** no se usa para un cálculo nuevo | No aparece en el select (`api/metodos.service.ts:38-39`) |
| Un cálculo usa solo mediciones **vigentes** y **de una misma evaluación** | `web/calculos.tsx:238-239`; `api/calculos.service.ts:344` |
| La Serie de la Lámina admite **hasta 8 tomas** y la hoja «Evolución» **hasta 8 series** | Casillas deshabilitadas al llegar al tope |
| **No hay validación de rango** de los valores: se acepta cualquier número | `web/preparacion.tsx:245-260`; `dom/contratos-antropometria.ts:197-201` |

### 5.4 Validaciones del formulario (textos exactos)

- Número ilegible: «Escribí un número: «150» o «72,5».» (`dom/formato-numeros.ts:81-85`).
- Número ambiguo (punto de miles): «Escribilo sin punto de miles («1850») o, si es decimal, con coma («1,85»).». Se acepta coma o punto como decimal; «1.850» se rechaza por ambiguo (`dom/formato-numeros.ts:57-78`).
- Fila fuera del protocolo incompleta: «Falta la métrica.», «Falta el valor.», «Falta la unidad.» (`web/preparacion.tsx:252-257`).
- Resumen arriba: «Antes de guardar, revisá estas mediciones. Cada una lleva a su campo:».
- Un campo del protocolo vacío **no es un error**: simplemente no se guarda (`web/preparacion.tsx:286-288`).

### 5.5 Confirmaciones (textos exactos)

| Acción | Forma | Texto |
|---|---|---|
| Registrar | Diálogo modal | «Al registrarla pasa a formar parte de la historia del asesorado y de su evolución. Después no se edita: si hace falta cambiar un valor, se corrige o se anula la medición, y queda constancia.» → «Volver» / «Registrar esta evaluación» |
| Anular | En la fila, con motivo obligatorio | «Anular no borra nada: la medición y su historia se conservan, con el motivo y quién la anuló. Deja de contar para la evolución y para los cálculos.» → «Cancelar» / «Anular esta medición» |
| Corregir | En la fila, con valor y motivo obligatorios | Sin texto de advertencia → «Cancelar» / «Corregir medición» |
| Dejar como referencia | En la fila, motivo opcional | «Dejar un cálculo como referencia no cambia el cálculo ni borra los otros, y no crea un objetivo ni una prescripción. La decisión sigue siendo tuya y queda registrada con su fecha.» → «Cancelar» / «Dejar como referencia» |
| Guardar, Calcular | Sin confirmación | — |

### 5.6 Comparabilidad y cambio de protocolo

- Dos valores se comparan **solo si comparten protocolo (versión), método (versión) y unidad** (`dom/antropometria.ts:273-279`). Eso es un «grupo de comparabilidad» (`api/evolucion.service.ts:152-153`).
- **Nunca se convierte una unidad** ni se «normaliza» un valor.
- Lo no comparable **se muestra igual, señalado**: rombo en el gráfico, motivo en la tabla y en el panel.
- Si una métrica tiene más de un grupo, se elige cuál ver; cada grupo tiene su propio eje. Los puntos de otros grupos siguen en la tabla, marcados.
- La diferencia entre dos observaciones es una **resta con signo**, solo dentro del mismo grupo.
- En «En preparación», **cambiar de protocolo no pierde nada**: lo que el protocolo nuevo no declara (o declara en otra unidad) pasa a «Fuera del protocolo» (`web/preparacion.tsx:215-235`; `dom/figura-antropometrica.ts:71-92`).
- Un día sin medición es «Sin dato»: nunca cero, nunca una línea que cruce el hueco.

### 5.7 «Ubicar, nunca calificar»

Es una regla explícita y verificada por pruebas:

- **Sin color por valor.** En la figura de la toma, todos los puntos del mismo color; el estado se dice por forma (`web/figura.tsx:8-9`; `apps/web/src/app/globals.css:1464`). En el gráfico, todas las marcas del mismo color y la diferencia se dice por forma y texto (`web/grafico-de-evolucion.tsx:15-17`). En la Lámina, la diferencia va en un solo color (`dom/lamina.ts:12-18`).
- **Sin rangos, umbrales, semáforos, «normal / alto / bajo», puntajes ni «mejor / peor».** Palabras prohibidas en todo el texto de antropometría (`dom/copy-antropometria.ts:298-317`): «diagnóstico», «estimado automáticamente», «valor estimado en cero», «interpolado», «imputado», «se completó», «tendencia automática», «peso ideal», «sobrepeso», «obesidad», «bajo peso», «normal», «anormal», «score», «puntaje», «eliminar medición», «borrar medición».
- **Sin promedios, tendencias ni interpolación.**
- **BE no elige un cálculo.** Los cálculos conviven; el orden nunca es «por mejor»; la referencia es un acto del profesional.
- Las diferencias se describen: «No es una valoración de progreso ni un resultado clínico.»

---

## 6. Cuánto hay en pantalla

**Cómo conté.** Cuento *elementos accionables*: botones, enlaces, campos, selects, casillas y desplegables (`<details>`). No cuento las opciones de adentro de un select (las digo aparte). Cuento lo que se ve sin abrir ningún panel. Todo sale del código con un supuesto de datos explícito: no medí una pantalla real.

**Marco común:** enlace de marca + 5 de navegación + select «Apariencia» + 2 migas + 4 pestañas = **13** (14 con el retorno a la ficha).

| Sección | Supuesto | Cuenta | Total |
|---|---|---|---|
| **Evaluaciones** | 6 tomas; la abierta con el perfil completo (30 mediciones, ninguna anulada ni corregida) y 8 cálculos vigentes | Lista: 6 · «Ver lámina»: 1 · Cálculos: 1 botón + 1 desplegable + 8 × (1 desplegable + 1 botón) = 18 · Mediciones: 1 desplegable + 30 × 2 botones = 61 | **86** |
| **En preparación** | Perfil completo, sin filas libres, con borrador | 4 campos de la toma + 1 desplegable + 30 campos de valor + 14 puntos de la figura + «Agregar otra medición» + 2 botones fijos | **52** (38 sin los puntos de la figura) |
| **Evolución** | Una métrica con 6 observaciones de un solo grupo y una elegida | 2 fechas + «Ver período» + select Métrica + 1 desplegable + el gráfico (1 zona con foco + 6 puntos) + «Abrir la evaluación de origen» + select «Comparar con» + 6 «Ver en el gráfico» | **20** |
| **Lámina** · Medición | cualquier toma | select Toma + 3 hojas + ampliar + descargar + Modo 2 + Encuadre 3 + Figura 2 + Tema 3 + 1 desplegable | **17** |
| **Lámina** · Serie · Evolución | 6 tomas registradas, 8 series disponibles | 6 casillas de tomas + 3 hojas + 2 botones + Modo 2 + Tema 3 + 8 casillas de series + 1 desplegable | **25** |

**Opciones dentro de los selects** (con el perfil completo y todos los métodos):
- «Método»: **22** opciones en 2 grupos.
- «Métrica» de Evolución: hasta **45** (30 mediciones + 15 resultados).
- «Cambiar de qué medición sale cada dato»: un select por dato (hasta **8** en Jackson y Pollock o en Lee), cada uno con las **30** mediciones de la toma.

**Los bloques más densos, en orden:**

1. **«Mediciones» de una toma registrada**: 30 filas, cada una con nombre, valor, «Medido · Vigente» y **dos botones**. Son 60 botones iguales, casi nunca usados.
2. **El formulario de «En preparación»**: 30 campos en 5 grupos, con «Sin cargar» repetido 30 veces al empezar, más la figura con 14 puntos.
3. **«Cálculos»**: cada resultado muestra hasta 4 insignias, una línea de método y dos desplegables. Y la lista **crece sola**: corregir o anular una medición recalcula lo que dependía de ella, crea corridas nuevas y deja las viejas con «Sin efecto», todas a la vista (`api/mediciones.service.ts:270-289`; `web/calculos.tsx:48`). Corregir el peso con 6 cálculos que lo usan deja 12 filas.
4. **El panel «Calcular con un método»** abierto: select de 22, ficha con 5 a 8 líneas, 2 desplegables y 2 botones.
5. **«Cómo se ve» de la Lámina**: 4 grupos y 10 botones de opción, más el grupo de hojas (3) y, en Serie, dos listas de casillas.
6. **Evolución**: pocos controles, pero **la misma serie se ve tres veces** (gráfico, panel de 8 pares rótulo-valor y tabla de 5 columnas).

Explicaciones plegadas («Cómo se lee» y similares): **4 a 6 por pestaña**. Ya fueron un intento de bajar texto visible (DL-113, `apps/web/src/components/ayuda.tsx:4-11`).

---

## 7. Cómo lo nombra la APK

Archivos consultados (pasada liviana, solo rótulos): `apk/pantallas/antropometria.tsx`, `apk/pantallas/inicio-mediciones.tsx`, `apk/pantallas/indicadores.tsx`, `apk/pantallas/progreso.tsx`, `apk/pantallas/progreso-de-una-medida.tsx`, `apk/pantallas/figura-de-la-toma.tsx`, `apk/navegacion.ts`, `apk/progreso-por-zonas.ts`, y el copy compartido `dom/copy-antropometria.ts`.

### 7.1 Rótulos de la APK

| Lugar | Rótulo exacto | Cita |
|---|---|---|
| Barra inferior | «Evolución» | `apk/navegacion.ts:104` |
| Título de la pantalla | «Mi evolución» | `apk/pantallas/antropometria.tsx:117` |
| Tarjeta de Inicio | «Mediciones»; adentro «Tu última toma: {fecha}», «{n} medida(s) · {n} resultado(s) de fórmula(s)»; botones «Ver la toma» y «Ver su evolución» | `apk/pantallas/inicio-mediciones.tsx:44-60, 74` |
| Pestañas (etiqueta «Qué ver») | «Mapa corporal» · «Progreso» · «Indicadores» | `apk/pantallas/antropometria.tsx:86, 184` |
| Nombre de la toma | «Última toma» o «Toma T{n}»; selector con fichas «T{n} · {fecha corta}» | `:179, 271` |
| Explicación de las tomas | «Las tomas T1, T2, T3… son las evaluaciones del período, de la más vieja a la más nueva.» | `:281` |
| Mapa corporal | Segmentos «Medidas en la figura»: «Perímetros» · «Pliegues». Segmentos «Figura»: «Hombre» · «Mujer». Enlace «Ver su progreso». Desplegable «La figura, en lista». «Cada número de la figura, con su valor» | `apk/pantallas/figura-de-la-toma.tsx:182-185, 239-242, 263, 447`; `apk/pantallas/antropometria.tsx:318` |
| Progreso | «Zona del cuerpo»: «Torso» · «Piernas»; «Parte del torso»; «Sin dato en esta toma»; «Una sola medición comparable en el período.» | `apk/pantallas/progreso.tsx:95, 105, 159, 178`; `apk/progreso-por-zonas.ts:82` |
| Indicadores | Bloques «Mediciones», «Resultados de las fórmulas», «Datos de la toma», «Más datos de esta toma». Marca de cada resultado: «Estimación» | `apk/pantallas/indicadores.tsx:67, 73, 75, 80, 90` |
| Detalle de una medida | «‹ Anterior» / «Siguiente ›»; «Protocolo y método»; «La evolución, en lista»; «Antes: {valor}, el {fecha}»; «Método: {nombre}»; «Cómo se obtuvo: {clase}»; el cambio, con una flecha «↑» o «↓» delante y el formato del ejemplo del código «−0,5 cm respecto del 25 jul» | `apk/pantallas/progreso-de-una-medida.tsx:56-63, 126, 131, 240-249, 262, 389` |
| Vacío | «Todavía no hay mediciones registradas en este período.» + «Las mediciones las registra el profesional con el que tenés un vínculo activo en Antropometría.» | `apk/pantallas/antropometria.tsx:158-159` |
| Sin consentimiento | «Para ver tu evolución necesitás tener activo el consentimiento de datos de salud. Tus mediciones no se borraron: vuelven a verse cuando lo actives de nuevo.» + «Ir a Privacidad y consentimientos» | `:122-123` |
| Toma incompleta | «Esta toma puede estar incompleta» + «Por qué» / «Menos detalle» | `:296-303` |

### 7.2 El mismo concepto, con otro nombre

| Concepto | Website del profesional | APK del asesorado |
|---|---|---|
| El área | «Antropometría» | «Evolución» (barra), «Mi evolución» (título), «Mediciones» (tarjeta de Inicio) |
| La evaluación | «Evaluación» y «Toma», mezclados (ver R-10) | «Toma» («Última toma», «Toma T2»); «evaluación» solo en textos de ayuda |
| Un valor | «Medición» (Evaluaciones), «Observación» y «punto» (Evolución), «medida» (Lámina) | «Medida» (el concepto), «medición» (una ocurrencia) |
| Lo que se mide | «Métrica» (select de Evolución), «Qué se midió» (fila libre) | «Medida» |
| Resultados de fórmulas | «Cálculos», «Calculado», «Conclusiones» (Lámina) | «Resultados de las fórmulas», marca **«Estimación»** |
| Grupo de comparabilidad | «Grupo de comparabilidad» | «Protocolo y método» |
| Perímetros | «Perímetros» (familia) pero **«Circunferencias»** (hoja de la Lámina) | «Perímetros» |
| Pliegues | «Pliegues cutáneos» (familia), «Pliegues» (hoja), «Pliegue» (leyenda) | «Pliegues» |
| Peso y talla | Familia «Masa y estatura»; en la Lámina, «Datos de la toma» | «Mediciones» |
| La edad | Familia «Otras mediciones del protocolo» | «Datos de la toma» |
| Diámetros | Familia «Diámetros»; en la Lámina, «DIÁMETROS ÓSEOS» | dentro de «Más datos de esta toma» |
| La clase del dato | «Clase» (panel), «Cómo se obtuvo» (columna de la tabla y campo del formulario) | «Cómo se obtuvo» |
| El cambio entre dos valores | «Diferencia», sin flecha | flecha «↑» o «↓» + «respecto del {fecha}» |
| La figura | Silueta propia de frente y de espalda (carga); PNG de hombre o mujer (Lámina) | La de la Lámina, hombre o mujer |
| Vistas de lo mismo | «Evaluaciones», «Evolución», «Lámina» | «Mapa corporal», «Progreso», «Indicadores» |

Tres diferencias de fondo, no solo de nombre:

1. **«Estimación» contra «Calculado».** La APK marca **todos** los resultados de fórmulas como «Estimación» (`apk/pantallas/indicadores.tsx:75`). El website dice «Calculado». Y el dominio dice que un índice o una suma de pliegues **no** es una estimación (`dom/antropometria-del-analisis.ts:47-54`).
2. **Línea o no línea.** El gráfico de Evolución del website es de puntos sueltos. La APK y la Lámina en Serie unen con una línea las tomas seguidas comparables («La línea une solo dos tomas seguidas que tienen la medida…», `dom/copy-antropometria.ts:202`; `dom/lamina.ts:767-779`).
3. **La APK avisa algo que el website no:** «BE muestra una medición por día y por medida. Si ese día hubo dos evaluaciones, o el mismo resultado se calculó con dos métodos, se ve una sola.» (`apk/pantallas/antropometria.tsx:82-83`). Ver R-1.

---

## 8. Datos de ejemplo (sintéticos, del repositorio)

### 8.1 Una toma completa con el perfil — adulto de 25 años

`test/integration/catalogo-antropometrico.int-spec.ts:32-64`. Protocolo «Perfil antropométrico completo», origen «Medición del profesional», contexto «Toma sintética completa.» (`:94`).

| Medición | Valor | Medición | Valor |
|---|---|---|---|
| Peso | 80 kg | Perímetro del cuello | 38 cm |
| Talla | 175 cm | Perímetro de hombros | 116 cm |
| Edad al momento de la toma | 25 años | Perímetro del pecho | 98 cm |
| Pliegue pectoral | 9 mm | Perímetro del brazo relajado | 32 cm |
| Pliegue axilar medio | 11 mm | Perímetro del brazo flexionado y contraído | 34 cm |
| Pliegue tricipital | 10 mm | Perímetro del antebrazo | 28 cm |
| Pliegue subescapular | 12 mm | Perímetro de la muñeca | 17 cm |
| Pliegue bicipital | 4 mm | Perímetro de cintura | 84 cm |
| Pliegue de la cresta ilíaca | 14 mm | Perímetro del abdomen | 86 cm |
| Pliegue supraespinal | 8 mm | Perímetro de cadera | 98 cm |
| Pliegue abdominal | 15 mm | Perímetro del muslo | 56 cm |
| Pliegue del muslo frontal | 14 mm | Perímetro de la pantorrilla | 37 cm |
| Pliegue de la pantorrilla | 7 mm | Perímetro del tobillo | 22 cm |
| Pliegue del antebrazo | 5 mm | Diámetro biepicondíleo del húmero (codo) | 7 cm |
| | | Diámetro biestiloideo (muñeca) | 5,8 cm |
| | | Diámetro bicondíleo del fémur (rodilla) | 9,8 cm |

El fixture no trae los resultados calculados de esta toma como números escritos (la prueba los compara contra la regla).

### 8.2 Una historia de cinco tomas, con corrección, anulación y cambio de protocolo

`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/escenario.mjs:280-331`. Sirve para dibujar Evolución y Serie. «Hoy − N» son días antes de hoy.

| Cuándo | Protocolo | Mediciones | Qué pasa |
|---|---|---|---|
| Hoy − 82, 08:00 | Perfil antropométrico completo | Peso 82,4 kg · Talla 178 cm · Cintura 92,0 cm · Cadera 101,0 cm · tríceps 14,0 · subescapular 16,5 · supraespinal 13,0 · abdominal 24,0 · muslo frontal 18,0 · pantorrilla 9,5 mm | toma normal |
| Hoy − 61, 08:00 | Perfil antropométrico completo | Peso 81,6 kg · Cintura **95,0 cm** · Cadera 100,2 cm · pliegues 13,2 / 15,8 / 12,0 / 22,5 / 17,2 / 9,0 mm | la cintura **se corrige a 90,5 cm** al día siguiente, motivo «Valor tipeado mal: era 90,5» |
| Hoy − 40, 08:00 | Protocolo de laboratorio (demostración) | Peso 79,4 kg | **otro protocolo**: abre otro grupo comparable |
| Hoy − 19, 08:00 | Perfil antropométrico completo | Peso 80,2 kg · Cintura 89,0 cm · Cadera 99,5 cm · pliegues 12,4 / 15,0 / 11,2 / 21,0 / 16,5 / 8,8 mm · Pliegue bicipital 6,0 mm | el bicipital **se anula**, motivo «Sitio mal marcado» |
| Hoy − 19, 19:30 | Perfil antropométrico completo | Peso 80,9 kg | segunda toma el mismo día |
| Hoy − 1, 08:00 | Perfil antropométrico completo | Peso 79,8 kg · Cintura 88,2 cm | cargada hoy |

### 8.3 Seis personas de prueba con resultados esperados

`dom/formulas-antropometricas.test.ts:17-44` (entradas) y `:75-165` (resultados, ya con la precisión del método). H = hombre, M = mujer.

| | H1 | H2 | H3 | M1 | M2 | M3 |
|---|---|---|---|---|---|---|
| Edad (años) | 22 | 35 | 55 | 19 | 34 | 47 |
| Peso (kg) | 72 | 88 | 92 | 55 | 64 | 78 |
| Talla (cm) | 176 | 178 | 172 | 162 | 166 | 160 |
| Perímetro de cintura (cm) | 78 | 92 | 102 | 66 | 74 | 88 |
| Perímetro de cadera (cm) | 94 | 102 | 106 | 92 | 100 | 110 |
| Pliegue tricipital (mm) | 8 | 12 | 16 | 15 | 19 | 26 |
| Pliegue abdominal (mm) | 14,5 | 26 | 34 | 15 | 22 | 32 |

Resultados que figuran en la prueba para métodos **vigentes** (útiles para la lista de Cálculos o la hoja Conclusiones):

| Resultado | Valores de la prueba |
|---|---|
| Índice de masa corporal | H1 23,2 · M2 23,2 · H3 31,1 kg/m² |
| Índice cintura/cadera | H2 0,9 · M1 0,72 · M3 0,8 |
| Índice cintura/talla | H1 0,44 · M2 0,45 · H3 0,59 |
| Suma de 6 pliegues (ISAK) | H1 57 · M2 113 · H3 124 mm |
| Suma de 7 pliegues (Jackson y Pollock) | H1 69 · M2 124 · H3 166 mm |
| Grasa corporal (Jackson y Pollock, 7 pliegues, Siri) | H1 9,1 · H2 17,9 · H3 26,4 % · M1 18,5 · M2 24,6 · M3 33,1 % |
| Grasa corporal (Durnin y Womersley, Siri) | H1 14,2 · H2 22,7 · H3 33,6 % · M1 24,7 · M2 30,8 · M3 38,5 % |
| Grasa corporal (RFM) | H1 18,9 · H2 25,3 · H3 30,3 % · M1 26,9 · M2 31,1 · M3 39,6 % |
| Masa grasa (Durnin y Womersley) | H1 10,2 · H3 30,9 kg · M2 19,7 kg |
| Masa libre de grasa (Durnin y Womersley) | H1 61,8 · H3 61,1 kg · M2 44,3 kg |
| Masa ósea (Rocha) | H1 11,8 · M2 9,4 · H3 12,2 kg |
| Endomorfia / Mesomorfia / Ectomorfia | H1 2,4 / 5,2 / 2,4 |

Atención: la pantalla muestra un resultado con los decimales del método aunque terminen en cero. El «0,9» de la prueba se vería «0,90» y «57» se vería «57,0» (`dom/formato-numeros.ts:40-44`).

### 8.4 Otros textos reales para rellenar

- Nombres de protocolo: «Perfil antropométrico completo», «Pliegues y perímetros (demostración)», «Protocolo de laboratorio (demostración)».
- Motivo de corrección: «Valor tipeado mal: era 90,5». Motivo de anulación: «Sitio mal marcado» (`escenario.mjs:316, 324`).
- Diferencia con formato: «−1,5 kg», con «10» días entre fechas (`dom/evolucion-antropometrica.test.ts:146-152`).
- Zona horaria del período: `America/Argentina/Buenos_Aires` (`apps/api/src/nutricion/zona.ts:5`).
- Descripción, fuente y población de cada método: `scripts/catalogo-antropometrico/catalogo-metodos.cjs:59-189`. Ejemplo (IMC): descripción «Peso dividido por la talla al cuadrado. Usa solo peso y talla: no distingue la masa grasa de la magra ni dice dónde está la grasa.»; población «Adultos. Es un índice, no una ecuación de predicción.»
- Nombre de un profesional o de un asesorado: **no encontré** uno en los fixtures de antropometría que revisé. Si falta el nombre del profesional, la API devuelve «Profesional» (`api/lectura-antropometria.ts:78-80`).

---

## 9. Rarezas

Ordenadas por cuánto le cambian el dibujo a un diseñador. Las que dependen de ejecutar para confirmarse lo dicen.

**R-1 · El aviso de «dos métodos» promete algo que la API no hace.** Al calcular una métrica que la toma ya tiene con otro método, el website dice: «…en la evolución se ven los dos, cada uno con su método, y en la APK la persona ve el último que se registró.» (`web/calculos.tsx:344-346`). Pero la API de evolución publica **un punto por día y por métrica** (`dom/antropometria.ts:328-333`; `api/evolucion.service.ts:147`), la prueba de integración lo fija («la API publica uno por día», `test/integration/catalogo-antropometrico.int-spec.ts:144-146`) y la APK lo avisa en su ayuda (`apk/pantallas/antropometria.tsx:82-83`). Además, por cómo se arma la lista, el que queda es el **primero** registrado ese día, no el último (`api/evolucion.service.ts:249, 296-320`; `dom/dominio-wp05.test.ts:201`). Leído en el código, no ejecutado.

**R-2 · «{n} de {m} del día» casi no puede aparecer en Evolución.** Gráfico, panel y tabla manejan dos observaciones el mismo día (`web/grafico-de-evolucion.tsx:13-14, 284, 373`), pero la API que los alimenta manda una sola por día y métrica (R-1).

**R-3 · Dos figuras distintas para lo mismo.** La carga usa una silueta propia, de frente y de espalda, sin sexo, con **14 sitios** (`dom/figura-antropometrica.ts:119-134`). La Lámina y la APK usan los PNG de Dirección, de hombre o mujer, en tres encuadres, con **24 sitios** (`dom/figura-de-lamina.ts:50-77`). Con el «Perfil antropométrico completo», en la carga quedan **10 pliegues y perímetros sin punto** (pectoral, axilar medio, antebrazo; cuello, hombros, pecho, antebrazo, muñeca, abdomen, tobillo), que solo están en la lista.

**R-4 · La referencia es una sola por asesorado, no una por métrica ni por toma.** «Dejar como referencia» aparece en cada corrida, pero la referencia vigente es única por asesorado, profesional y finalidad (`api/calculos.service.ts:257-259`), y los 21 métodos del catálogo tienen la misma finalidad. Marcar un IMC como referencia le saca la insignia al % de grasa que la tenía, aunque sea de otra toma.

**R-5 · «Solo lectura» arriba y 60 botones abajo.** El título de la toma lleva la insignia «Solo lectura» y cada medición tiene «Corregir» y «Anular» (`web/evaluaciones.tsx:213, 337-346`).

**R-6 · La lista de Evaluaciones muestra como mucho 20 tomas, sin «Ver más».** Pide una sola página (`web/evaluaciones.tsx:77`; `apps/api/src/http/paginacion.ts:9`), y esa página es por fecha de **creación del registro**, no por fecha de la toma (`api/evaluaciones.service.ts:262`). La Lámina sí trae todas (`web/lamina.tsx:104`).

**R-7 · Anular o corregir no dice qué pasó con los cálculos.** La API devuelve qué corridas se recalcularon y cuáles quedaron sin sucesora (`dom/contratos-antropometria.ts:281-297`), y la pantalla lo ignora: solo dice «Medición anulada. Su historia se conserva.» (`web/evaluaciones.tsx:306-315`). Existe el texto «No se pudo recalcular: falta una medición vigente. No se reemplaza por cero.» (`dom/copy-antropometria.ts:63`) y no se usa en ningún lado.

**R-8 · Los rechazos de la API se ven como «servicio no disponible».** `mensajeDeFallo` solo distingue el resultado incierto, los conflictos de versión o de estado y el 404; cualquier otro código cae en «El servicio no está disponible en este momento. Probá de nuevo más tarde.» (`apps/web/src/lib/intento.ts:44-63`; `dom/copy.ts:44`). Eso incluye una fecha de toma futura, un método al que le faltan entradas o una ecuación fuera de su dominio (p. ej. Durnin y Womersley con menos de 17 años). El comentario de `web/calculos.tsx:7-9` dice que el rechazo «se muestra con su motivo», y el código no lo hace. Leído en el código, no ejecutado.

**R-9 · No se ve de quién son los datos.** Ninguna de las cuatro pestañas muestra el nombre del asesorado (§2.0).

**R-10 · «Evaluación» y «toma» son lo mismo, mezclados.** Pestaña «Evaluaciones» → título «Tomas registradas» → vacío «Todavía no hay evaluaciones registradas.» → botón «Preparar una toma» → «Toma del {fecha}». En preparación: «Nueva evaluación», «Registrar evaluación», y la fecha se llama «Cuándo se tomó». Evolución: «Abrir la evaluación de origen». Lámina: select «Toma» y aviso «La evaluación pedida no está…».

**R-11 · Cuatro palabras para un valor:** «medición» (Evaluaciones, En preparación), «observación» y «punto» (Evolución), «medida» (Lámina). Y dos para lo que se mide: «Métrica» (Evolución) y «Qué se midió» (fila libre).

**R-12 · «Circunferencias» contra «Perímetros», y los rótulos de la Lámina no son los del catálogo.** «Brazo contraído» es «Perímetro del brazo flexionado y contraído»; «Abdomen bajo» es «Perímetro del abdomen»; «Muslo anterior» es «Pliegue del muslo frontal»; «Axilar media» es «Pliegue axilar medio»; «Codo», «Muñeca» y «Rodilla» son los tres diámetros (`dom/figura-de-lamina.ts:152-180` contra `dom/nombres-de-metricas.ts:9-39`). «Muñeca» y «Antebrazo» aparecen dos veces con significados distintos (perímetro y diámetro; perímetro y pliegue).

**R-13 · Plurales rotos.** «{k} anulada» no concuerda («2 anulada») y «{n} mediciones» tampoco («1 mediciones») (`web/evaluaciones.tsx:163-164, 207`; `web/lamina.tsx:457`).

**R-14 · El orden de las familias cambia entre pantallas.** Evaluaciones: masa y estatura, perímetros, pliegues, diámetros, otras (`web/evaluaciones.tsx:252`). En preparación: masa y estatura, pliegues, perímetros, diámetros, otras (`dom/figura-antropometrica.ts:16`). El comentario de `web/evaluaciones.tsx:251` dice «el mismo de la toma», y no lo es.

**R-15 · El protocolo de laboratorio se ve crudo.** No declara nombre ni familia, así que en «En preparación» sus campos se rotulan «peso» y «talla», en minúscula, bajo «Otras mediciones del protocolo», y no hay figura (`dom/figura-antropometrica.ts:59`; `prisma/migrations/20260920220000_metodos_y_calculos/migration.sql:129`).

**R-16 · Hay un solo borrador a la vista y no se puede descartar.** «En preparación» toma el primero de la lista (`web/preparacion.tsx:121`). No hay forma de empezar otra toma mientras exista uno, ni de elegir entre varios, ni de descartarlo.

**R-17 · No hay indicador de «cambios sin guardar».** La barra fija solo dice cuándo se guardó por última vez. El texto «Cambios sin guardar» existe (`dom/copy-antropometria.ts:38`) y no se usa.

**R-18 · El aviso de «registrada» puede no verse.** Al registrar se guarda el aviso «Evaluación registrada. Ya forma parte de la evolución.» en el estado de «En preparación» y, en la misma función, se navega a Evaluaciones (`web/preparacion.tsx:143-146`). La vista que tiene el aviso se desmonta. **No se puede determinar** sin ejecutar si llega a verse.

**R-19 · Elegir otra toma vuelve a cargar todo.** Un clic en la lista vuelve a pedir la lista y el detalle, y mientras tanto la vista entera (lista incluida) se reemplaza por «Cargando…» (`web/evaluaciones.tsx:75-94, 102`). Pasa lo mismo después de corregir, anular o calcular.

**R-20 · Insignia que el recorrido actual no puede producir.** «De una evaluación en preparación» (`web/calculos.tsx:145`): los cálculos solo se ven en una toma registrada, y ahí el contexto es siempre «registrada» (`api/lectura-calculo.ts:87`). «En preparación» no tiene cálculos.

**R-21 · «Calculado» en una ayuda donde no puede haber calculados.** El desplegable «Medido, reportado o calculado» está sobre la lista de mediciones, que solo pueden ser medidas o reportadas (§4.3). El mismo texto aparece como ayuda del select «Cómo se obtuvo», que tiene dos opciones.

**R-22 · «Cómo se obtuvo» nombra tres cosas:** el select de origen en En preparación (dos opciones), una columna de la tabla de Evolución (que muestra clase y protocolo) y, en el panel de la misma pantalla, ese dato se llama «Clase».

**R-23 · «Lámina» es tres cosas:** la pestaña, el `<h2>` y el título del grupo de botones que elige la hoja (`web/lamina.tsx:432, 484`).

**R-24 · Estado a medias en la URL.** La toma abierta con un clic no queda en la URL; la que llega por enlace sí. Recargar la página puede abrir otra toma (§1.2).

**R-25 · «(adimensional)» se lee tal cual** en la ficha del método: «Da: Índice cintura/cadera (adimensional)» (`web/calculos.tsx:298-300`). En el resto de la pantalla esa unidad se oculta.

**R-26 · El orden de categorías del select no es el de la Lámina.** El select ordena por el código interno (Grasa corporal, Índices, Masas corporales, Somatotipo, Sumas de pliegues; `dom/seleccion-de-metodo.ts:50`); la Lámina, por el orden del catálogo (Índices, Sumas de pliegues, Grasa corporal, Masas corporales, Somatotipo; `dom/calculo.ts:76`).

**R-27 · Detalles del formulario de corrección.** El campo «Valor» empieza vacío, no con el valor actual (`web/evaluaciones.tsx:278`). El motivo se comparte entre «Corregir» y «Anular»: lo escrito en uno aparece en el otro (`:277`). Y el aviso de una medición ya anulada rotula su motivo en presente: «Por qué se anula: «…»» (`:386`).

**R-28 · Diámetros en dos lugares.** En la hoja Circunferencias están dibujados al pie de la imagen («DIÁMETROS ÓSEOS») y también listados abajo en la nota «Sin sitio en la figura» (`web/lamina.tsx:355-359`).

**R-29 · Textos definidos que ninguna pantalla usa.** Busqué `COPY_ANTROPOMETRIA.<clave>` y `C.<clave>` en `apps/` y `packages/` y no hay ninguna referencia a: `retomarBorrador` («Retomar la evaluación en preparación»), `cambiosSinGuardar`, `evaluacionRegistrada`, `yaRegistrada`, `resultadosDerivados`, `metodoYVersion`, `noEsDiagnostico` («Un resultado calculado no es un diagnóstico ni una causa: es una derivación con su método a la vista.»), `sinSucesor`, `entradasDelMetodo`, `metodoHistorico`, `entradaNoAdmisible`, `yaEsReferencia`, `catalogoSintetico`, `laminaSeriesQueNoVan`, `laminaSumaDeSietePliegues`, ni a `ETIQUETA_DE_REDONDEO`. Tampoco se usa la opción de origen «Importado con procedencia».

**R-30 · Un borrador sin mediciones pierde su fecha en pantalla.** La fecha, el protocolo y el origen se reconstruyen desde la primera medición del borrador; si no tiene ninguna, «Cuándo se tomó» vuelve a «ahora» en cada carga (`web/preparacion.tsx:179, 198-204`).

**R-31 · Evolución no abre en «Peso».** El select «Métrica» lista las opciones en el orden del catálogo (Peso primero, `web/evolucion.tsx:91-92`), pero la que viene elegida es la primera de la respuesta de la API, que está ordenada alfabéticamente por código (`dom/evolucion-antropometrica.ts:182-185`; `api/evolucion.service.ts:149`). Con una toma del perfil completo, el primer código es `diametro-biestiloideo`: la pestaña abriría en «Diámetro biestiloideo (muñeca)». Con los datos del §8.2 abriría en «Perímetro de cadera». Leído en el código, no ejecutado.

**R-32 · Una métrica con todas sus mediciones anuladas sigue en el select, con «(0)».** La API arma la lista de métricas con todas las mediciones del período, anuladas incluidas, y después descarta las anuladas al armar los puntos (`api/evolucion.service.ts:149, 268-286`; `dom/antropometria.ts:329`). El resultado sería una opción como «Pliegue bicipital (0)» que, al elegirla, muestra «Todavía no hay mediciones registradas en este período.» y una tabla con un solo hueco. Leído en el código, no ejecutado.

**R-33 · Los datos del §8.2 no se ven igual en esta pestaña que en la ficha.** Ese escenario tiene dos tomas el mismo día («Hoy − 19»). En Evolución de Antropometría saldría un solo punto de peso ese día (R-1); en «Analizar», en la ficha, salen los dos (`api/evolucion.service.ts:131-134`).

---

## 10. Lo que no se pudo determinar

1. **Qué protocolos y métodos tiene la base desplegada.** Leí las migraciones y los generadores del catálogo; no consulté ninguna base.
2. **El texto exacto de fecha y hora** que arma `Intl` en `es-AR` (depende del navegador).
3. **Si el aviso «Evaluación registrada. Ya forma parte de la evolución.» llega a verse** (R-18).
4. **El aspecto real** (colores, tamaños, saltos de línea, cómo se ven los 30 campos a 1440 / 1280 / 1024): leí la estructura y parte del CSS, no rendericé nada.
5. **Cuántos elementos ve un profesional real:** las cuentas del §6 son sobre supuestos de datos declarados.
6. **R-1, R-4, R-8, R-31 y R-32 en ejecución:** salen de leer el código (y, en R-1, de una prueba de integración que lo fija); no reproduje ninguno de los casos en pantalla.
7. **Un nombre de profesional o de asesorado de ejemplo** para antropometría: no lo encontré en los fixtures revisados.
8. **`web/lamina-dibujo.tsx`** lo leí por encima, como se pidió: qué dibuja y qué textos imprime. No verifiqué posiciones, tamaños ni colores de la imagen.
