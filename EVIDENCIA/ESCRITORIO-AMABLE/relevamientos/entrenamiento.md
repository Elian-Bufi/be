# Inventario del área ENTRENAMIENTO (website del profesional)

Relevado leyendo código, sin ejecutar nada del proyecto.

- **Worktree:** `C:\Users\bufim\BE-Best-entrenamiento` · rama `wp-dashboard-comprension` · HEAD `ab90860`.
- **Qué es el área:** la pestaña «Entrenamiento» de un asesorado, en `/pro/advisees/training`.
- **Fecha del relevamiento:** 2026-10-10.

## Lo más importante, en una página

- **Cuatro pestañas**, en este orden: `Resumen` (por defecto), `Plan`, `Ejecuciones`, `Revisiones`. Se eligen con `vista=` en la URL. No hay sub-pestañas: cada una es una pila vertical de tarjetas en una sola columna.
- **El área no dice de quién es.** El título es `Entrenamiento` y las migas dicen `Ficha del asesorado`; el nombre de la persona no aparece.
- **El editor del plan es lo más denso.** Todos los niveles están abiertos a la vez (bloque, sesión, ejercicio, serie). Un ejercicio de 3 series tiene entre 29 y 36 controles. Una sesión de 3 ejercicios suma 116 controles y, en la captura del repositorio, mide 9677 px de alto. No se puede reordenar, duplicar ni plegar nada.
- **En Ejecuciones, una sesión desplegada repite el mismo dato.** Lo planificado de una serie se lee en cinco lugares y lo registrado en cuatro, repartidos entre dos tablas, un gráfico y dos listas.
- **Hay tres pasos separados:** registrar una revisión, aplicarla y activar el plan. Cada uno tiene su botón y su aviso.
- **El plan no tiene días ni fechas.** Es bloque → (microciclo) → sesión → ejercicio → serie. Las sesiones no se asignan a un día.
- **Lo que registra el asesorado, por serie:** carga con unidad, repeticiones, RIR y esfuerzo percibido (este último, la APK de este worktree ya no lo carga). Sin nota ni hora por serie. Los descansos y las duraciones llegan aparte, como «tiempos», con su calidad (`medido`, `estimado`, `incompleto`…).
- **El website solo muestra lo registrado.** No tiene ningún control para corregir una sesión.
- **Web y APK nombran distinto:** `ejecución` y `prescripción` son solo de la web; `rutina` es solo de la APK; `Activo` (web) es `Vigente` (APK).

## 0. Convenciones de este informe

- Los textos que ve la persona van `así`, literales, con sus acentos. Lo variable va entre llaves: `{fecha}`. Dentro de las llaves, una barra separa alternativas: `{Por serie|Por ejercicio o sesión}`.
- Las rutas de las citas son relativas al worktree, con estas abreviaturas:
  - `T/` = `apps/web/src/app/pro/advisees/training/`
  - `A/` = `apps/web/src/app/pro/advisees/`
  - `C/` = `apps/web/src/components/`
  - `D/` = `packages/domain/src/`
  - `M/` = `apps/mobile/src/`
  - `API/` = `apps/api/src/`
- «Condicional» quiere decir que el bloque aparece solo en el caso que se indica. Lo demás está siempre.
- Cuando algo no sale del código, dice **no se puede determinar**.
- **Formato de fechas y números** (vale para toda el área):
  - Un instante se muestra con `fecha()`: fecha media y hora corta en es-AR, en la zona del navegador (`apps/web/src/lib/formato.ts:2-5`). En las capturas del repositorio se ve `6 oct 2026, 3:38 p. m.` (hora de 12 h con «p. m.»).
  - Un día civil se muestra con `dia()`: `6 oct 2026` (`formato.ts:3,6`).
  - El eje de los gráficos usa día y mes: en la captura `EVIDENCIA/PF-03/comparacion/02-evolucion-carga-kg.png` se ve `18/8` y `1/9`, sin ceros. El comentario del código dice «08/09» (`formato.ts:8`), que no coincide con la captura. Cómo lo dibuja cada navegador: no se puede determinar desde el código.
  - Los números llevan coma decimal y punto de miles: `77,5 kg`, `1.850` (`D/formato-numeros.ts:24-37,53-55`). El signo menos es `−` (U+2212).
  - Las duraciones se muestran `mm:ss` o `h:mm:ss`: `01:30`, `1:05:00` (`D/tiempos-de-entrenamiento.ts:249-257`).
- **Capturas reales del área que ya están en el repositorio** (sirven para contrastar este inventario):
  - `EVIDENCIA/ENTRENAMIENTO-SERIES/capturas-web/04-editor-piernas-a.png` (editor, 1280 × 9677 px).
  - `…/06-plan-activo.png` (plan activo, 1280 × 2774 px).
  - `…/07-ejecucion-piernas-a-por-serie-y-tiempos.png` y `…/08-ejecucion-recuperacion-estimada-e-incompleta.png` (Ejecuciones con sesiones abiertas).
  - `EVIDENCIA/PF-03/comparacion/*.png` (evolución de un ejercicio; son anteriores: las explicaciones todavía no estaban plegadas).
  - Las de `ENTRENAMIENTO-SERIES` son del 2026-10-06 (commit `5a16fa0`). Después de esa fecha, `editor.tsx`, `comparacion.tsx`, `series-y-tiempos.tsx` y `objetivos-por-serie.tsx` no cambiaron; `plan.tsx` y `ejecuciones.tsx` solo sumaron un `export`. Sí cambiaron las migas (antes «Asesorado», hoy «Ficha del asesorado»), el enlace de retorno y la pestaña Revisiones.

---

## 1. Navegación del área

### 1.1 Página y marco

- Ruta: `/pro/advisees/training?id={asesorado}&vista={clave}` (`T/page.tsx:10-11`). El asesorado va por query, no en la ruta.
- Título del documento: `Entrenamiento · BE` (`T/page.tsx:7`). Es igual para todos los asesorados.
- Estructura: encabezado global + `<main class="contenido contenido--ancho">` + componente `Entrenamiento` (`T/page.tsx:13-23`). El contenido es **una sola columna** de hasta 76 rem (≈1216 px), centrada (`apps/web/src/app/globals.css:323-333`). No hay panel lateral.
- Encabezado global, siempre visible (`C/encabezado.tsx:11-27`):
  - enlace `Saltar al contenido`;
  - marca `BE` (enlace al inicio);
  - navegación (`C/navegacion.tsx:19-25`): `Espacio profesional`, `Plantillas y habituales`, `Mis recetas`, `Mis ejercicios`, `Cuenta`. En esta página queda marcado `Espacio profesional` (`C/navegacion.tsx:38-49`);
  - selector `Apariencia` con `Azul noche` (predeterminado) y `Claro` (`C/apariencia.tsx:27-43`; `apps/web/src/lib/apariencia.ts:10-15`);
  - texto fijo `Ambiente de prueba · solo datos sintéticos`.

### 1.2 Componente de entrada: `Entrenamiento` (`T/entrenamiento.tsx:73-105`)

En orden de aparición:

1. **Migas** (`C/migas.tsx:24-26`): `Espacio profesional` (enlace a `/pro`) › `Ficha del asesorado` (enlace a la ficha, o al punto exacto de la ficha si se llegó con `volver`) › `Entrenamiento` (actual).
2. **Título** `<h1>`: `Entrenamiento` (`T/entrenamiento.tsx:100`).
3. **Enlace de retorno**, condicional (solo si la URL trae un `volver` válido): `Volver a la ficha, donde estabas` (`A/retorno-y-preparacion.tsx:35-42`).
4. **Pestañas** (`T/entrenamiento.tsx:107-116`; `C/pestanas.tsx:15-41`): enlaces en una línea, con `aria-current` en la actual. Etiqueta accesible: `Secciones de Entrenamiento`.
5. **La vista elegida.** Solo se monta la vista activa (`T/entrenamiento.tsx:111-114`): al cambiar de pestaña se pierde lo que la otra tenía en pantalla (filtros, formularios abiertos, sesiones desplegadas).

### 1.3 Las cuatro pestañas

| Orden | Etiqueta | Clave en la URL | Componente | Cita |
|---|---|---|---|---|
| 1 | `Resumen` | `vista=resumen` | `VistaDeResumen` | `T/entrenamiento.tsx:30` |
| 2 | `Plan` | `vista=plan` | `VistaDePlan` | `T/entrenamiento.tsx:31` |
| 3 | `Ejecuciones` | `vista=ejecuciones` | `VistaDeEjecuciones` | `T/entrenamiento.tsx:32` |
| 4 | `Revisiones` | `vista=revisiones` | `VistaDeRevisiones` | `T/entrenamiento.tsx:33` |

- **Por defecto:** `Resumen`, cuando `vista` falta o no es una de las cuatro (`T/entrenamiento.tsx:76-77`).
- **Cómo se elige:** por la URL. Las pestañas son enlaces con `replace` (no suman historial). Los saltos internos (`Ver plan`, `Abrir el borrador en Plan`…) usan `router.replace` (`T/entrenamiento.tsx:83`).
- **Otros parámetros de la URL:**
  - `volver=…`: de dónde se vino en la ficha. Se conserva al cambiar de pestaña (`A/retorno-y-preparacion.tsx:25-33`).
  - `preparar=1`: en Revisiones, abre el formulario con el período ya propuesto (`A/retorno-y-preparacion.tsx:44`).
- **No hay sub-pestañas** dentro de ninguna vista. Dentro de cada vista todo es una pila vertical de tarjetas (`.seccion`).

### 1.4 Desde dónde se llega (fuera del área, solo como contexto)

- Ficha → Resumen, fila del área: `Ver la planificación`, `Ir al borrador` (`A/seguimiento/resumen.tsx:298,307`); `Abrir las revisiones`, `Ir a la planificación` (`…:409,411`); `Preparar la revisión de Entrenamiento` (`…:528-530`).
- Ficha → Información: `Preparar la revisión de Entrenamiento` (`A/seguimiento/informacion.tsx:133-135`).
- Ficha → registro original de un dato: `Ver en Entrenamiento · Ejecuciones`, `Ver en Entrenamiento · Plan`, `Ver en Entrenamiento`, `Ver en Entrenamiento · Revisiones` (`A/seguimiento/registro-original.tsx:41-44`).
- Formularios → al pedir contexto desde Entrenamiento se vuelve acá (`A/forms/pedir.tsx:50-53`).
- `A/tarjetas-de-dominio.tsx` tiene un enlace `Abrir Entrenamiento`, pero ese componente no se usa en ningún lado (ver §9).

---

## 2. Cada sección, en orden de aparición

### 2.1 Pestaña `Resumen` (`T/resumen.tsx`)

Lee cinco cosas a la vez: evaluaciones, objetivo vigente, historial del objetivo, versiones del plan y contexto de revisión **sin período** (`T/resumen.tsx:66-72`). Sin período, la API usa los últimos 7 días, hoy incluido (`API/entrenamiento/revisiones.service.ts:36-37,110-111`). Si una de las cinco falla, falla toda la vista (`T/resumen.tsx:73-76`).

#### Bloque A · `Estado del seguimiento` (siempre) — `T/resumen.tsx:196-247`

Tarjeta con título `<h2>` `Estado del seguimiento` y una lista de cuatro pares rótulo/valor:

| Rótulo | Valor posible | Control |
|---|---|---|
| `Seguimiento` | `Abierto` · `Cerrado` · `Empieza al activar el primer plan` | — |
| `Plan activo` | `Activado el {fecha y hora}` · `Todavía no hay un plan activo.` | botón con forma de enlace `Ver plan` → pestaña Plan |
| `Última sesión registrada ({día} a {día})` | `{nombre de la sesión} · {día} · {condición}` · `Todavía no hay sesiones registradas en este período.` | `Ver ejecuciones` → pestaña Ejecuciones |
| `Última revisión` | `{resultado} · {fecha y hora} · Próxima acción: {texto}` · `Todavía no hay revisiones.` | `Ver revisiones` → pestaña Revisiones |

- Los tres botones están siempre, aunque el valor falte.
- `{condición}`: `Realizada`, `Realizada con desvío`, `No realizada` (`D/copy-entrenamiento.ts:33-37`).
- `{resultado}`: `Mantener`, `Ajustar`, `Sustituir`, `Reprogramar revisión`, `Cambiar objetivo`, `Finalizar` (`D/copy-nutricion.ts:26-33`).
- El período del tercer rótulo es el que devolvió la lectura: siempre los últimos 7 días, sin control para cambiarlo.
- Aviso informativo, condicional (hay una revisión pendiente): `Revisión pendiente desde el {día}.` (`T/resumen.tsx:240-244`).

#### Bloque B · `Objetivo vigente` (siempre) — `T/resumen.tsx:94-136`

- Con objetivo: el enunciado en un párrafo, y debajo `Fundamento: {fundamento} · vigente desde el {fecha y hora}`.
- Sin objetivo: `Todavía no hay un objetivo de entrenamiento.`
- Desplegable, condicional (más de una versión): `Historial del objetivo ({N} versiones)`. Cada renglón: `{fecha y hora de creación} · {enunciado}`, y la insignia `vigente` en la vigente.
- Botón secundario `Nueva versión de objetivo`. Está deshabilitado si no hay evaluaciones, y entonces aparece la nota `El objetivo se funda en una evaluación: registrá una primero.`
- Se llama `Nueva versión de objetivo` también cuando todavía no hay ningún objetivo.

**Formulario `Nueva versión de objetivo`** (reemplaza al botón; `T/resumen.tsx:581-619`):

| Control | Tipo | Detalle |
|---|---|---|
| `Evaluación de referencia` | select | opciones `Evaluación del {fecha y hora}`; viene elegida la más reciente |
| `Objetivo` | área de texto | hasta 2000 caracteres |
| `Fundamento` | área de texto | hasta 4000 |
| `Vigente desde` | fecha y hora | viene con el momento actual |
| nota | texto | `La versión anterior no se edita: queda en el historial.` |
| `Emitir nueva versión` | botón primario | mientras envía: `Emitiendo…` |
| `Cancelar` | botón secundario | cierra sin guardar |

Aviso al terminar: `Nueva versión del objetivo emitida. La anterior se conserva en el historial.`

#### Bloque C · `Evaluaciones` (siempre) — `T/resumen.tsx:138-188`

- Vacío: `Todavía no hay una evaluación de entrenamiento.`
- Lista, una tarjeta por evaluación (la más reciente primero; a lo sumo 20, ver §9):
  - título `Evaluación del {fecha y hora}`;
  - por cada dato: rótulo = concepto; valor = `{valor} {unidad} · {fuente}` y, si es calculado, ` · Método: {método}`;
  - `{fuente}`: `Informado por el asesorado`, `Observado por el profesional`, `Calculado (con método declarado)` (`D/copy-nutricion.ts:19-23`);
  - condicional `Contexto citado`: por cada respuesta citada, `{pregunta del formulario}` → `{valor} · Declarado por la persona el {fecha y hora}`. Si la persona la cambió después: `La persona actualizó esta respuesta después de la evaluación; acá se muestra lo que se citó.` (`T/resumen.tsx:250-270`);
  - condicional `Contexto: {texto}`;
  - condicional: las notas del profesional, sin rótulo.
- Controles (con el formulario cerrado):
  - botón secundario `Nueva evaluación`;
  - enlace con forma de botón `Solicitar contexto` → lleva a Formularios con la plantilla de entrenamiento precargada (`T/resumen.tsx:179`);
  - ayuda plegada `Qué se le pide a la persona` → `Le pide a la persona «Antecedentes para entrenamiento»: qué busca, su experiencia, cuánto tiempo tiene, dónde entrena y qué prefiere. Pedir no da acceso a nada nuevo hasta que responda.`

**Formulario `Nueva evaluación`** (`T/resumen.tsx:426-541`). Solo puede estar abierto uno de los dos formularios del Resumen (`T/resumen.tsx:61`).

1. `Fecha y hora de la evaluación` (fecha y hora; viene con el momento actual).
2. Grupo `Datos de la evaluación`, con la ayuda `Cada dato indica de dónde sale: lo informado por el asesorado no es un diagnóstico.` Por cada dato, en una fila:
   - `Concepto` (120), `Valor` (500), `Unidad (opcional)` (30);
   - select `Fuente` (las tres fuentes; viene `Informado por el asesorado`);
   - `Método declarado` (500), solo si la fuente es calculado;
   - `Quitar dato {n}`, solo si hay más de un dato.
   - Al pie: botón `Agregar dato`.
3. Grupo `Contexto declarado por la persona`:
   - ayuda `Marcá las respuestas que usás para fundar esta evaluación. Quedan citadas tal como están ahora, con su fecha; no se copian como datos observados por vos.`
   - contador `Podés citar hasta 20 respuestas. Marcaste {n} de 20.`
   - una casilla por respuesta: `{pregunta}: {valor} · Declarado por la persona el {fecha y hora}`;
   - botón `Cargar más`, si quedan páginas;
   - estados propios del grupo: ver §3.
4. `Contexto (opcional)` (1000), con la ayuda `En qué situación se hizo la evaluación: consulta inicial, cambio de bloque, vuelta de una lesión.`
5. `Notas del profesional (opcional)` (4000).
6. Botones `Registrar evaluación` (primario; `Registrando…`) y `Cancelar`.

Aviso al terminar: `Evaluación registrada.`

---

### 2.2 Pestaña `Plan` (`T/plan.tsx`, `T/editor.tsx`)

Lee la lista de versiones y el objetivo vigente; si hay una versión vigente, la lee completa con los objetivos de cada serie (`T/plan.tsx:55-70`).

Orden de la pantalla (`T/plan.tsx:108-200`):

1. Aviso del resultado de la última acción (condicional).
2. Aviso informativo, condicional (no hay objetivo): `Para planificar, primero definí el objetivo en Resumen: el plan se relaciona con el objetivo vigente.`
3. **Una de tres cosas:**
   - si hay un borrador → el **editor** (§2.2.2);
   - si no hay borrador y hay objetivo → los controles para crear uno (§2.2.1);
   - si no hay objetivo → nada.
4. Tarjeta `Plan activo` (§2.2.3).
5. Tarjeta `Historial` (§2.2.4).

Es decir: cuando hay un borrador, la página muestra el editor entero y, debajo, el plan activo entero.

#### 2.2.1 Crear un borrador (condicional: sin borrador y con objetivo) — `T/plan.tsx:142-151`

- Botón primario. Su texto depende de si hay plan activo:
  - sin plan activo: `Crear plan` (crea un borrador con un `Bloque 1` vacío, `T/plan.tsx:83`);
  - con plan activo: `Crear nueva versión a partir de esta` (copia la estructura de la versión activa).
- Bloque `Empezar desde una plantilla` (`T/plantillas.tsx:125-156`):
  - si el profesional no tiene plantillas activas: nota `No tenés plantillas activas para aplicar.`
  - si tiene: select con `—` y una opción por plantilla, `{nombre} · {N sesión|sesiones} · {Con cargas de referencia|Sin cargas}`; y el botón secundario `Crear el borrador desde esta plantilla` (deshabilitado hasta elegir).
- Avisos de resultado: `Borrador creado. No es visible para el asesorado hasta que lo actives.` · `Borrador creado desde la plantilla. Adaptalo a la persona antes de activarlo: no es visible para el asesorado hasta que lo actives.` · error `Esa plantilla está archivada: reactivala para usarla.`

#### 2.2.2 El editor: `Versión en preparación` (condicional: hay un borrador) — `T/editor.tsx:296-486`

Cabecera:

- `<h2>` `Versión en preparación` + insignia `Borrador`.
- Ayuda plegada `Qué es una versión en preparación` → `El borrador no es visible para el asesorado. Guardar no activa.` y, si viene de la versión activa, `Nueva versión a partir de la versión activa. La versión activa no cambia hasta que actives esta.`
- Nota, condicional (salió de una plantilla): `Creada desde la plantilla «{nombre}», versión {n}. El plan es de esta persona: la plantilla no cambia si lo editás.` · o `Creada desde una plantilla que ya no está disponible.` (`D/copy-plantillas.ts:33-34`).
- Aviso, condicional (no se puede activar por la app del asesorado; `D/compatibilidad-de-clientes.ts:82-89`):
  - `Todavía no podés activar este plan`
  - `Este plan tiene objetivos distintos en algunas series, y tu asesorado todavía no usó una versión de BE que los muestre. Con la versión que tiene vería los valores generales de cada ejercicio, que no son los de esas series.`
  - `Podés activarlo cuando tu asesorado abra Entrenamiento con BE actualizada, o dejar los mismos objetivos en todas las series de cada ejercicio para activarlo ahora.`
- Aviso, condicional (hay objetivos por serie y la app ya los muestra): `Tu asesorado ya usa una versión de BE que muestra los objetivos de cada serie.`
- Aviso, condicional: `Hay una versión de objetivo más nueva. Al guardar, el borrador pasa a usarla.`

**Jerarquía.** Cada nivel es una caja anidada (un `<fieldset>`), **todas abiertas a la vez**. No hay niveles que se plieguen, ni reordenar, ni duplicar.

```
Bloque N
├─ (opcional) Microciclo N
│   └─ Sesión
│       └─ Ejercicio (prescripción)
│           └─ Serie N
└─ (sin microciclos) Sesión → Ejercicio → Serie N
```

**Bloque** (`T/editor.tsx:326-382`) — título de la caja: `Bloque {n}`

| Control | Detalle |
|---|---|
| `Nombre del bloque` | texto, 120 |
| `Propósito profesional (opcional)` | texto, 1000; ayuda `Texto libre: BE no fija tipos de bloque.` |
| `Agregar sesión` | botón; solo si el bloque no tiene microciclos (si los tiene, el botón está dentro de cada microciclo). La nueva se llama `Sesión A`, `Sesión B`… (`T/editor.tsx:118`) |
| `Organizar por microciclos` | botón-enlace; solo si el bloque no tiene sesiones; crea `Semana 1` |
| `Agregar microciclo` | botón; solo si el bloque ya tiene microciclos; crea `Semana {n}` |
| `Quitar bloque` | botón-enlace; solo si hay más de un bloque |
| `Agregar una sesión habitual` | select + botón `Agregar esta sesión habitual`; solo si el profesional tiene sesiones habituales (`T/habituales.tsx:242-271`). Cada opción: `{nombre} · {N} ejercicios · Con cargas de referencia` o `{nombre} · 1 ejercicio · Sin cargas` |

**Microciclo** (condicional) — título `Microciclo {n}`: `Nombre del microciclo`, `Propósito profesional (opcional)`, sus sesiones, `Agregar sesión`, `Quitar microciclo`, y el selector de sesión habitual.

**Sesión** (`T/editor.tsx:252-294`) — título: el nombre de la sesión

| Control | Detalle |
|---|---|
| `Nombre de la sesión` | texto, 120 |
| `Indicaciones (opcional)` | área de texto, 2000 |
| (los ejercicios) | uno debajo del otro |
| `Agregar ejercicio` | abre el buscador (más abajo) |
| `Guardar como habitual` | abre un diálogo |
| `Quitar sesión` | botón-enlace |

**Ejercicio (prescripción)** (`T/editor.tsx:538-830`). Encabezado: imagen chica (solo si el ejercicio tiene imagen) y el nombre. Después, cinco grupos y dos controles sueltos:

1. Grupo `Criterio de intensidad`
   - select `Criterio`: `Sin criterio de intensidad`, `% RM`, `RIR`;
   - con `RIR`: ayuda `RIR = repeticiones en reserva Cada serie puede tener el suyo.`;
   - con un criterio elegido: campo `Objetivo (% RM)` u `Objetivo (RIR)`;
   - con `% RM`: campo `Referencia de la repetición máxima (opcional)` (500), ayuda `Por ejemplo: 1RM estimado por el método que usaste. BE no estima la repetición máxima.`
2. Grupo `Carga sugerida (opcional)` — ayuda `La carga sugerida es un complemento: no es el criterio de intensidad. Es la que heredan las series que no tienen una propia.`
   - `Carga` (número);
   - select `Unidad`: `kg`, `lb`;
   - select `Cómo se cuenta la carga`: `Sin indicar`, `una sola mancuerna o implemento`, `por mancuerna o implemento`, `carga externa total`.
3. Grupo `Descanso recomendado (opcional)` — ayuda `En segundos, entre una serie y la siguiente. Es el que heredan las series que no tienen uno propio. 0 es sin pausa.`
   - campo `Descanso recomendado (segundos)`.
4. Grupo `Series y repeticiones`
   - select `Qué cuentan las repeticiones`: `Sin indicar`, `por serie`, `por lado; no se duplican`;
   - por cada serie, una caja `Serie {n}` con:
     - `Serie {n}: repeticiones (un número o un rango, 8-12)`;
     - `Serie {n}: carga sugerida ({kg|lb})` + casilla `Sin objetivo en esta serie`;
     - `Serie {n}: RIR objetivo (0 a 10)` + casilla `Sin objetivo en esta serie` (solo con criterio RIR);
     - `Serie {n}: descanso (segundos)` + casilla `Sin objetivo en esta serie`;
     - `Serie {n}: nota (opcional)` (200);
   - cada campo con casilla lleva una línea de ayuda (`T/objetivos-por-serie.tsx:61`): `Vacío: hereda {valor} de la prescripción.` · `Vacío: sin objetivo, porque la prescripción no lo tiene.` · `Esta serie no tiene este objetivo.`
   - botones-enlace `Agregar serie` y `Quitar la última serie`;
   - tabla de vista previa `Así lo ve tu asesorado` (no editable; columnas en §2.2.3).
5. Grupo `Descanso / parámetros (opcional)` — ayuda `Si indicás un tempo, explicalo con palabras: por ejemplo, bajar en 3 segundos y subir en 1. Un código como 3010 solo no alcanza.`
   - por cada parámetro: `Parámetro` (60), `Valor` (120), `Unidad (si es un número)` (20), `Quitar parámetro`;
   - `Agregar parámetro`.
6. `Notas (opcional)` (área de texto, 1000).
7. `Quitar {nombre del ejercicio}` (botón-enlace).

**Buscador de ejercicios** (se abre con `Agregar ejercicio`; `T/editor.tsx:833-972`):

- campo `Buscar en el catálogo BE` + botón `Buscar`. Busca por nombre que contenga el texto y trae hasta 20 resultados; la pantalla no tiene «ver más» (`D/cliente-http.ts:1059-1061`; `API/entrenamiento/catalogo.service.ts:44-60`);
- nota `Catálogo de demostración: no es una recomendación.`;
- bloque `Mis habituales`: un botón por ejercicio habitual (su nombre), o `Todavía no marcaste ejercicios habituales. Se marcan desde el buscador, con «Marcar como habitual».`;
- resultados: `{nombre}`, con ` · cargado por vos` o ` · Importado de wger · {día}` si corresponde; por resultado, `Marcar como habitual` / `Quitar de habituales` y `Elegir {nombre}`;
- `Crear manualmente` → grupo con `Nombre del ejercicio` (120), ayuda plegada `Por qué solo se pide el nombre` (`Las zonas musculares y el material didáctico se suman más adelante.`) y botón `Crear y agregar`;
- `Importar desde wger` → grupo de importación (`T/importacion.tsx:134-234`): `Número del ejercicio en wger`, `Consultar`, y después el `Candidato para revisar` con `Nombre del ejercicio`, tres datos del proveedor, `Fundamento de la decisión (opcional)`, `Importar a BE` y `Rechazar`;
- `Cerrar búsqueda`.

Un ejercicio nuevo entra con una sola serie sin repeticiones y sin criterio (`T/editor.tsx:280`).

**Pie del editor** (`T/editor.tsx:383-442`):

| Elemento | Detalle |
|---|---|
| `Agregar bloque` | botón; crea `Bloque {n}` |
| `Próxima revisión (opcional)` | fecha; ayuda `Si la fijás, al activar queda como revisión pendiente del seguimiento a partir de esa fecha.` |
| estado del guardado | `Guardando…` · `Hay cambios sin guardar.` · `Guardado.` |
| nota fija | `Validar revisa la forma del plan, no su calidad: no juzga el programa, la frecuencia ni la selección de ejercicios.` |
| `Guardar borrador` | botón **primario**; deshabilitado sin cambios |
| `Validar plan` | botón secundario; si hay cambios, guarda antes |
| `Activar plan` | botón secundario; deshabilitado con cambios sin guardar o con el aviso de la app |
| `Guardar como plantilla` | botón secundario; abre un diálogo |
| nota condicional | `Guardá los cambios antes de activar.` |
| nota condicional | `Todavía no podés activar este plan: {qué hacer}` |

**Diálogos del editor:**

- `Activar plan` (`T/editor.tsx:468-484`): texto `Esta versión pasará a ser la planificación vigente del asesorado y la anterior se conservará.` Botones `Volver` y `Activar esta versión` (`Activando…`).
- `Guardar como plantilla` (`T/plantillas.tsx:76-121`): `Nombre`, `Descripción`, casilla `Conservar las cargas sugeridas como referencia de la plantilla` (apagada), título `Notas que se van a copiar` con cada nota y su `Vaciar`, ayuda plegada `Qué se copia y quién lo ve`. Botones `Cancelar` y `Guardar la plantilla`.
- `Guardar como habitual` (`T/habituales.tsx:189-238`): `Nombre` (viene el de la sesión), casilla `Conservar las cargas sugeridas como referencia`, `Notas que se van a copiar`, ayuda `Qué se copia y quién lo ve`. Botones `Cancelar` y `Guardar la sesión habitual`, o `Reemplazar` si el nombre ya existe (con el aviso `Ya tenés una sesión habitual «{nombre}»: se reemplaza por esta.`).

#### 2.2.3 Tarjeta `Plan activo` (siempre) — `T/plan.tsx:154-180,229-296`

- Título `Plan activo` + insignia `Activo` (si hay).
- Sin plan: `Todavía no hay un plan activo.`
- Con plan, **todo en solo lectura**:
  - `Versión {n} · activada el {fecha y hora}`;
  - nota `Huella de la instantánea: {16 caracteres}…`;
  - por bloque: `{nombre}` y, si tiene, ` · {propósito}`;
  - por microciclo: `Microciclo: {nombre} · {propósito}`;
  - por sesión: `{nombre}` y sus indicaciones;
  - por ejercicio: imagen chica (si tiene), nombre en negrita, y una lista con «lo general»:
    - la intensidad: `{n} % RM ({referencia})` · `RIR {n}` · `Sin criterio de intensidad`;
    - cada parámetro: `{rótulo}: {valor} {unidad}`;
    - `Notas: {nota}`;
  - y una tabla por ejercicio (`T/objetivos-por-serie.tsx:112-166`):

| Elemento de la tabla | Texto |
|---|---|
| Título | `Lo que recibe tu asesorado` + ` · carga: {base}` + ` · repeticiones: {base}` |
| Columnas | `Serie` · `Carga` · `Rep.` · `RIR` (solo si el ejercicio usa RIR) · `Descanso recomendado` |
| Celdas | `16 kg` · `12–16 rep.` · `RIR 3` · `01:30` |
| Valor heredado | se le agrega ` · de la prescripción` |
| Sin valor | `Sin objetivo` |

- Botón secundario `Guardar como plantilla` (el mismo diálogo de arriba).
- La nota de cada serie no se muestra en esta tarjeta (ver §9).

#### 2.2.4 Tarjeta `Historial` (siempre) — `T/plan.tsx:182-196`

- Sin versiones activadas: `Todavía no se activó ninguna versión.`
- Lista numerada, la versión más nueva primero: `Versión {n} · activada el {fecha y hora}` + insignia `Activo` o `Anterior`.
- La lista trae su propia numeración (1., 2., 3.…), que va al revés que el número de versión: con dos versiones se lee `1. Versión 2` y `2. Versión 1` (ver §9).
- No tiene controles: una versión anterior no se puede abrir desde acá.

---

### 2.3 Pestaña `Ejecuciones` (`T/ejecuciones.tsx`, `T/comparacion.tsx`, `T/series-y-tiempos.tsx`)

Lee el contexto de revisión del período elegido y, por cada versión del plan que aparece, su detalle con objetivos por serie (`T/ejecuciones.tsx:64-103`).

Orden de la pantalla (`T/ejecuciones.tsx:111-201`):

#### Bloque A · Filtros (siempre)

| Control | Detalle | Cita |
|---|---|---|
| `Desde` | fecha | `A/periodo.tsx:40` |
| `Hasta` | fecha | `A/periodo.tsx:41` |
| `Ver período` | botón; vacío = últimos 7 días | `A/periodo.tsx:42-44` |
| `Versión del plan` | select: `Todas` + `Activada el {fecha y hora}` por versión del período | `T/ejecuciones.tsx:118-128` |
| `Ejercicio` | select: `Todos` + un ejercicio por opción. Con nombres repetidos: `{nombre} ({i} de {n} con este nombre)` | `T/ejecuciones.tsx:129-139,257-261` |
| nota | `Período: {día} a {día}` | `T/ejecuciones.tsx:141-143` |

Los dos selects filtran la lista de sesiones. El de `Ejercicio`, además, enciende el bloque B.

#### Bloque B · `Planificado y registrado` (siempre; el gráfico es condicional)

- Ayuda plegada `Qué entra en la comparación` → `Solo sesiones registradas: los borradores y las sesiones que todavía no ocurrieron no aparecen.`
- Sin ejercicio elegido: `Elegí un ejercicio para ver cómo se compara lo planificado con lo registrado en el período.`
- Con ejercicio elegido: `<h3>` `Evolución de un ejercicio: {nombre}` y, en este orden (`T/comparacion.tsx:743-808`):

| Elemento | Texto y valores |
|---|---|
| select `Variable` | `Repeticiones` · `Carga (kg)` · `Carga (lb)` · `RIR` (solo las que tienen datos) |
| select `Serie` | `Serie 1`, `Serie 2`… |
| grupo `Capas` | casillas `Planificado (línea discontinua, cuadrados; franja si es un rango)` y `Registrado (línea continua, círculos)` |
| ayuda plegada | `Cómo se lee` |
| leyenda | `Franja gris rayada: sesión sin valor registrado de esta serie (el motivo está en la tabla)` · `Línea vertical discontinua: empieza otra versión del plan` |
| pie del gráfico | `Evolución de un ejercicio: {nombre}, serie {n}. Eje vertical: {variable}. Eje horizontal: sesiones registradas, en orden.` |
| gráfico | un punto por sesión; alto 300 px; se desplaza de costado si no entra |
| elegir un punto | con clic o toque en el punto o en su marca del eje; con teclado, flechas (y Enter abre la ejecución) |
| recuadro al pasar el mouse | solo con mouse: `{día} · {sesión}`, `Planificado: …`, `Registrado: …`, la diferencia y `Clic o toque para ver el detalle` |
| panel del punto elegido | ver «Panel de valores» más abajo; trae el botón `Abrir la ejecución` |
| tabla | título `Tabla de valores: {nombre} · serie {n} · {variable}` |

Columnas de la tabla de evolución (`T/comparacion.tsx:1016-1023`): `Sesión` · `Planificado` · `Registrado` · `Diferencia` · `Registro` · `Acciones`.

- `Sesión`: `{día} · {nombre de la sesión}` y, si hubo varias ese día, ` · {i} de {n} del día`.
- `Registrado`: el valor, y la insignia `Corregida` si una corrección lo cambió.
- `Registro`: `Registro original` · `Corrección vigente` · `Sin dato`.
- `Acciones`: `Ver valores` y `Abrir la ejecución` (despliega esa sesión en el bloque C y lleva el foco ahí).

Debajo de cada marca del eje va un estado corto (`D/comparacion-de-entrenamiento.ts:791-813`): `igual` · `igual sug.` · `+2,5 kg sug.` · `−1` · `en rango` · `−1 mín.` · `+2 máx.` · `sin dato` · `no realizada` · `adicional` · `en lb` · `otro ejercicio` · `sin identificar` · `por sustitución` · `sin serie`.

#### Bloque C · `Sesiones registradas` (siempre)

- Una tarjeta por sesión registrada, **de la más vieja a la más nueva** (el orden lo da la API: `API/entrenamiento/revisiones.service.ts:145`).
- Título de cada tarjeta: `{nombre de la sesión} · {día} · {condición}`.
- Desplegable `Ver detalle`, cerrado al entrar. Abierto muestra, en este orden (`T/ejecuciones.tsx:301-353`):

**C1 · `Planificado frente a registrado`** (`T/series-y-tiempos.tsx:92-136`) — una tabla por ejercicio, con el nombre del ejercicio como título.

| Columna | Qué muestra | Valores posibles |
|---|---|---|
| `Serie` | número de la serie | `1`, `2`… |
| `Plan de la serie` | objetivo de esa serie en la versión que rigió | `16 kg · 12–16 rep. · RIR 3` · `Sin objetivo` · `—` · `No planificada` |
| `Registrado` | lo que cargó el asesorado | `16 kg · 14 rep. · RIR 3` · `carga no registrada · 11 rep.` · `Registro resumido` · `Sin registrar` |
| `Frente al plan` | relación, en palabras | `Rep.: dentro del rango · RIR: igual · Carga: igual` · `—` |
| `Descanso` | descanso marcado tras esa serie | `01:30 registrado · 01:30 recomendado · ±00:00` · `02:15 registrado · 02:00 recomendado · +00:15` · `Incompleto · 01:30 recomendado` · `… · sin recomendado` · `—` |
| `Duración` | si la serie se cronometró | `Duración medida 00:40` · `00:40 · estimado` · `Incompleto` · `Duración desconocida` · `—` |

Palabras de `Frente al plan` (`D/copy-entrenamiento-por-serie.ts:220-229`): `dentro del rango`, `por debajo`, `por encima`, `igual`, `sin dato`, `otra unidad: no se compara`, `no se compara`.

**C2 · `Tiempos de la sesión`** (`T/series-y-tiempos.tsx:137-178`)

- Ayuda plegada `Qué dice cada tiempo` → `Son tiempos marcados en la app: incluyen descansos y carga de datos. No son minutos de esfuerzo ni una evaluación.` y las cinco calidades.
- Lista rótulo/valor: `Tiempo transcurrido`, `Pausas`, `Sin pausas`, una fila por ejercicio (su nombre) y `Sin ejercicio asignado`.
- Cada valor: `15:00 · medido`. Calidades: `medido`, `estimado`, `incompleto`, `no informado`, `inconsistente`. Sin duración: `Incompleto`, `Inconsistente`, `No informado`.

**C3 · `Planificado y registrado, serie por serie`** (`T/comparacion.tsx:383-468`)

| Elemento | Texto y valores |
|---|---|
| select `Ejercicio` | solo si la sesión tiene más de un ejercicio |
| select `Variable` | igual que en el bloque B |
| grupo `Capas` | `Planificado (rayado; franja si es un rango)` · `Registrado (lleno)` |
| avisos condicionales | sustitución, resumen, registro no determinable (ver §3) |
| ayuda plegada | `Cómo se lee` |
| pie del gráfico | `Planificado y registrado, serie por serie: {ejercicio}, {día}. Eje vertical: {variable}. Eje horizontal: número real de la serie.` |
| gráfico de barras | dos barras por serie: planificado (rayado) y registrado (lleno) |
| botones redondeados | `Serie 1`, `Serie 2`… (eligen una serie; se pueden desmarcar) |
| panel de valores | de la serie elegida |
| tabla | título `Tabla de valores: {ejercicio} · {variable}` |

Columnas (`T/comparacion.tsx:648-652`): `Serie` · `Planificado` · `Registrado` · `Diferencia` · `Valores de la serie`.

**C4 · `Planificado`** — nota `Lo general de cada prescripción. El objetivo de cada serie, heredado o propio, está en «Planificado frente a registrado».` Si hay, `Indicaciones de la sesión: {texto}`. Por ejercicio, el nombre y una lista (`D/presentacion-de-prescripcion.ts:29-59`):

- series: `3 × 10` si son iguales y sin notas; si no, una línea por serie: `Serie 2: 8 · {nota}`, `Serie 1: 12-16`; sin fijar: `sin repeticiones fijadas`;
- intensidad, o `Sin criterio de intensidad`;
- `Carga sugerida: 16 kg`;
- cada parámetro;
- `Notas: {nota}`.

**C5 · `Corrección vigente`** (condicional: la sesión fue corregida) — nota `{Corregido por el profesional|Corregido por el asesorado} · {fecha y hora} · Motivo: {motivo}` y el registro corregido, con la misma forma que C6.

**C6 · `Registro original`** (`T/ejecuciones.tsx:209-249,338-340`)

- `Registrado el {fecha y hora}`.
- `Condición de la sesión: {condición} · {Por serie|Por ejercicio o sesión} · Motivo: {motivo}`.
- Por ejercicio: el nombre; o, con sustitución, `Planificado: {uno} · Ejecutado: {otro}` + insignia `Sustituido`.
- Por serie: `Serie 1: 16 kg × 14 reps · RIR 3 · esfuerzo percibido 7 · planificadas 12-16`. Sin carga: `carga no registrada`. Sin repeticiones: `—`.
- Si el registro es resumido: el texto del resumen, sin series.

**C7 · `Historial de correcciones`** (condicional: más de una corrección) — `{fecha y hora} · {autor} · {motivo}`.

**Panel de valores** (bloques B y C3; `T/comparacion.tsx:269-353`). Título: `Serie {n}` o `{día} · {sesión}`. Filas:

| Rótulo | Cuándo |
|---|---|
| `Planificado · {variable}` | siempre |
| `Plan de la serie {n}` | si se leyó el objetivo de la serie |
| `Registrado · {variable}` | siempre |
| `Diferencia` | siempre; sin comparación: `No hay dos valores comparables` |
| `Valores de la serie` | siempre; `60 kg × 10 reps · RIR 2 · esfuerzo percibido 7` o `—` |
| `Prescripción` | siempre |
| `Resumen del ejercicio` | si el registro es resumido |
| `Ejercicio registrado` | si se registró otra versión u otro ejercicio |
| `Registro` | siempre; `Registro original, registrado el {fecha}` o `Corrección vigente: {quién} ({autor}), el {fecha}. Motivo: {motivo}` |
| `En el registro original` | si una corrección cambió esa serie |

- La fila `Prescripción` junta lo general del ejercicio: `{intensidad o Sin criterio de intensidad} · Carga sugerida: {carga} · Notas: {nota}`.
- En la evolución, el panel suma la nota `Ocurrió el {fecha y hora} · Versión del plan activada el {fecha y hora}` y el botón `Abrir la ejecución`.
- Los textos de las notas condicionales del panel están en el anexo de textos.

La diferencia se dice en palabras (`D/comparacion-de-entrenamiento.ts:816-826`): `igual a lo planificado`, `igual a la carga sugerida`, `dentro del rango`, `1 repetición menos que lo planificado`, `2,5 kg más que la carga sugerida`, `1 repetición menos que el mínimo del rango`.

#### Bloque D · `Días sin registro` (siempre) — `T/ejecuciones.tsx:192-196`

- Nota `Días del período sin ninguna sesión registrada. Sin registro no quiere decir que no haya entrenado: no hay dato.`
- Los días, en una línea separados por ` · `; o `Ninguno.`

---

### 2.4 Pestaña `Revisiones` (`T/revisiones.tsx`)

Orden de la pantalla (`T/revisiones.tsx:69-135`):

1. Filtro de período: `Desde`, `Hasta`, `Ver período` (el mismo de Ejecuciones).
2. Nota fija `Ver el contexto no registra una revisión.`
3. Aviso del resultado de la última acción (condicional).
4. Aviso, condicional: `Revisión pendiente desde el {día}.`
5. Según el seguimiento:
   - abierto → botón primario `Registrar revisión` (o el formulario abierto);
   - cerrado → `El seguimiento de entrenamiento está cerrado. La historia se conserva.`
   - nunca empezó → `El seguimiento empieza al activar el primer plan.`
6. Tarjeta `Revisiones registradas`.

#### Formulario `Registrar revisión` (`T/revisiones.tsx:240-316`)

1. Aviso, condicional (se llegó con «Preparar la revisión»; `A/retorno-y-preparacion.tsx:60-72`):
   - `Preparado por BE para esta revisión: el período va del {día} (la última revisión fue el {día}) a hoy. La evidencia, la interpretación y el resultado los elegís vos. Nada se registra hasta que elijas «Registrar revisión».`
   - o `Preparado por BE para esta revisión: todavía no hay revisiones registradas: el período es el que propone BE, y lo podés cambiar. La evidencia, la interpretación y el resultado los elegís vos. Nada se registra hasta que elijas «Registrar revisión».`
2. `Período: {día} a {día}` (texto; se cambia con el filtro de arriba, fuera del formulario).
3. Grupo `Evidencia que examinaste` (`A/evidencia-de-revision.tsx:94-165`):
   - ayuda `Marcá lo que examinaste: nada viene marcado. Marcar un día marca cada uno de sus registros; dejá marcados solo los que miraste.`
   - resumen `Todavía no marcaste nada.` o `Marcaste {n} de {total}: {n} sesiones de {d} días, {n} versión del plan y el objetivo.`
   - subtítulo `Planificación y objetivo`: casillas `Plan activado el {fecha y hora}` (una por versión del período) y `Objetivo vigente`;
   - subtítulo `Sesiones del período, por día`:
     - casilla general (si hay más de un día) `Marcar las {n} sesiones del período ({d} días)`;
     - por día, casilla `{día} · marcar la sesión` o `{día} · marcar las {n} sesiones`, con su estado ` · sin marcar`, ` · todas marcadas` o ` · {m} de {n} marcadas`;
     - por día, botón-enlace `Ver la sesión` / `Ver las {n}` (y `Ocultar …`), que despliega una casilla por sesión: `{sesión} · {condición}`;
     - sin sesiones: `No hay sesiones registradas en el período.`
   - desplegable, condicional: `Lo que marcaste ({n})`, con `Quitar` por renglón y `Desmarcar todo`.
4. Nota, condicional: `Días sin registro en el período: {n}. No hay dato de esos días.`
5. `Interpretación` (área de texto, 4000).
6. Grupo `Resultado` — ayuda `Una progresión que conserva la estructura se registra como «Ajustar»; una que requiere una planificación sucesora, como «Sustituir».` Seis opciones excluyentes, cada una con su efecto escrito debajo (`D/copy-entrenamiento.ts:57-64`):

| Opción | Texto del efecto |
|---|---|
| `Mantener` | `El plan sigue igual. Se registra la próxima acción.` |
| `Ajustar` | `Se prepara una nueva versión del plan en borrador, con la misma estructura, para ajustarla. La versión activa no cambia hasta que actives la nueva.` |
| `Sustituir` | `Se prepara una versión sucesora en borrador. La versión actual se conserva en el historial.` |
| `Reprogramar revisión` | `Se fija una nueva fecha de revisión. El plan no cambia.` |
| `Cambiar objetivo` | `Se emite una nueva versión del objetivo. El plan se ajusta aparte, con un borrador nuevo.` |
| `Finalizar` | `Se cierra el seguimiento de entrenamiento. La historia se conserva; no es «Eliminar plan».` |

7. `Fundamento` (área de texto, 4000).
8. `Próxima acción` (área de texto, 2000). Con `Finalizar` el rótulo pasa a `Cierre`.
9. Fecha `Próxima revisión (opcional)`. Con `Reprogramar revisión` pasa a `Fecha de la próxima revisión`. Con `Finalizar` no aparece.
10. Grupo `Nuevo objetivo`, solo con `Cambiar objetivo`: `Objetivo` (2000) y `Fundamento del objetivo` (4000).
11. Botones `Registrar revisión` (primario; `Registrando…`) y `Cancelar`.

#### Tarjeta `Revisiones registradas` (`T/revisiones.tsx:115-130,348-375`)

- Vacía: `Todavía no hay revisiones registradas.`
- Una tarjeta por revisión, la más reciente primero:
  - título `{resultado} · {fecha y hora}`;
  - la interpretación;
  - nota `Fundamento: {fundamento} · Próxima acción: {texto}` (con `Finalizar`: `· Cierre: {texto}`);
  - si ya se aplicó: insignia `Aplicada` + `{fecha y hora}`;
  - si no: el texto del efecto (tabla de arriba) y el botón primario `Aplicar próxima acción` (`Aplicando…`).
- No muestra el período revisado, la evidencia marcada, el autor ni la fecha de la próxima revisión.

---

## 3. Estados

### 3.1 Comunes a las cuatro pestañas

| Estado | Texto | Cita |
|---|---|---|
| Sin sesión iniciada | `Redirigiendo a Iniciar sesión…` | `T/entrenamiento.tsx:92` |
| Cargando | `Cargando…` | `C/estados.tsx:14-20` |
| Error de lectura | `No pudimos cargar esta vista.` + `Reintentar` | `C/estados.tsx:33-44`; `D/copy.ts:37-38` |
| La cuenta no tiene espacio profesional | `No encontramos un recurso disponible para esta acción.` + enlace `Ir a tu cuenta` | `apps/web/src/app/pro/espacio-profesional.tsx:56-65` |
| Sin acceso (inexistente, ajeno o revocado: no se distingue) | `No encontramos un recurso disponible para esta acción.` + enlace `Volver` (a `/pro`) | `T/entrenamiento.tsx:54-63` |
| Una escritura fue denegada | el mismo texto reemplaza las pestañas y todo el contenido | `T/entrenamiento.tsx:84-89,102` |
| Aviso de éxito | flotante, abajo; botón `×` (`Cerrar aviso`); se va solo a los 6 s o más. Si trae un enlace o un botón adentro, se queda hasta cerrarlo | `C/ayuda.tsx:33-67`; `T/revisiones.tsx:78` |

- **Acceso parcial:** en esta área no existe. Es todo o nada. El aviso `Vista parcial según tu acceso actual.` es de la ficha, no de acá.
- **Solo lectura:** el plan activo es siempre de solo lectura. Las ejecuciones también: el website no tiene ningún control para corregirlas.

Errores de escritura (cualquier formulario; `apps/web/src/lib/intento.ts:44-63`):

| Caso | Texto |
|---|---|
| No se sabe si se guardó | `No pudimos confirmar el resultado. Reintentá.` |
| Cambió mientras se editaba | `Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.` |
| Recurso no disponible (poco frecuente: casi siempre una escritura denegada retira toda la pestaña) | `No pudimos abrir este contenido.` |
| Cualquier otro | `El servicio no está disponible en este momento. Probá de nuevo más tarde.` |

### 3.2 Resumen

| Estado | Texto |
|---|---|
| Sin objetivo | `Todavía no hay un objetivo de entrenamiento.` |
| Sin evaluaciones | `Todavía no hay una evaluación de entrenamiento.` |
| Sin plan activo | `Todavía no hay un plan activo.` |
| Sin sesiones en los últimos 7 días | `Todavía no hay sesiones registradas en este período.` |
| Sin revisiones | `Todavía no hay revisiones.` |
| Seguimiento sin empezar | `Empieza al activar el primer plan` |

Formulario de evaluación — validaciones (título `Revisá estos datos:`; `T/resumen.tsx:377-385`):
`Falta la fecha y hora de la evaluación.` · `Dato {n}: falta el concepto.` · `Dato {n}: falta el valor.` · `Dato {n}: un dato calculado declara su método.` · `Podés citar hasta 20 respuestas: desmarcá las que sobran antes de registrar.` · `Actualizá el contexto antes de volver a registrar: una respuesta que marcaste cambió.`

Formulario de evaluación — grupo de contexto declarado (`T/resumen.tsx:467-516`):

| Estado | Texto |
|---|---|
| Cargando | `Cargando…` |
| Error | `No se pudo cargar el contexto declarado. Reintentar` (es un botón) |
| Vacío | `Todavía no hay respuestas de contexto de entrenamiento para citar.` |
| Vacío con más páginas | `Todavía no aparecen respuestas de entrenamiento, pero hay más solicitudes para revisar.` |
| Tope alcanzado | `Llegaste al máximo de 20 respuestas citadas. Desmarcá una para elegir otra.` |
| Una respuesta marcada cambió | `Una respuesta que marcaste cambió desde que cargaste el contexto: la persona la actualizó. La evaluación no se registró y lo que escribiste se conserva. Actualizá el contexto y revisá tu selección antes de volver a registrar.` + botón `Actualizar el contexto` |
| Después de actualizar | `Contexto actualizado. Las respuestas que cambiaron quedaron desmarcadas y señaladas: revisalas y volvé a marcarlas si corresponde.` |
| Respuesta que cambió | `Cambió desde que la elegiste: revisala y volvé a marcarla si corresponde.` |
| Respuesta que ya no está | `Una respuesta que habías elegido ya no está disponible para citar.` |

Formulario de objetivo — validaciones (título `Para emitir el objetivo falta:`): `Falta el objetivo.` · `Falta el fundamento.` · `Falta desde cuándo rige el objetivo.`

### 3.3 Plan y editor

| Estado | Texto |
|---|---|
| Sin objetivo | `Para planificar, primero definí el objetivo en Resumen: el plan se relaciona con el objetivo vigente.` |
| Sin plan activo | `Todavía no hay un plan activo.` |
| Sin versiones activadas | `Todavía no se activó ninguna versión.` |
| Sin plantillas | `No tenés plantillas activas para aplicar.` |
| Editor: cargando / error / sin acceso | los comunes (`T/editor.tsx:242-244`) |
| Guardado | `Guardando…` · `Hay cambios sin guardar.` · `Guardado.` |
| Validación correcta | `El borrador no tiene problemas de estructura.` |
| No se puede guardar | `Hay elementos del plan que no se pueden guardar.` + lista |
| Falta algo para activar | `Hay elementos por corregir antes de activar.` + lista |
| Plan activado | `Plan activado. El asesorado ya ve esta planificación como vigente.` |
| Plantilla guardada | `Plantilla guardada. La encontrás en «Mis plantillas».` |
| Sesión habitual guardada | `Sesión habitual guardada. La encontrás en «Agregar una sesión habitual» y en «Plantillas y habituales».` |
| Sesión habitual agregada | `Sesión habitual agregada al borrador. Es de este plan: revisá las cargas y las notas.` |

Cada problema se lista como `{ubicación} → {problema}`. La ubicación se arma con los nombres: `Bloque 1 → Semana 1 → Sesión A → Ejercicio 2 → Serie 1` (`T/editor.tsx:77-92`). Los problemas (`T/editor.tsx:94-116`):

- `falta al menos un bloque` · `falta al menos una sesión` · `falta al menos un ejercicio`
- `si el bloque tiene microciclos, las sesiones van dentro de ellos` · `hay un elemento repetido`
- `el criterio de intensidad no es % RM ni RIR` · `se eligen % RM o RIR, no los dos`
- `el esfuerzo percibido se registra en la sesión: no es un criterio de prescripción`
- `el objetivo de intensidad no tiene sentido para ese criterio`
- `un RIR por serie necesita que el ejercicio use el criterio RIR` · `el RIR objetivo de una serie va de 0 a 10`
- `el ejercicio no está en el catálogo` · `el ejercicio ya no está disponible`
- `el borrador usa un objetivo que ya no es el vigente` · `no se pudo preservar la versión para el asesorado`
- `falta un número o no se entiende lo escrito` · `falta un dato, o el número es demasiado chico` · `el número es demasiado grande` · `el número no es entero`
- cualquier otro: `revisá este elemento`

Errores dentro del diálogo de activar (`T/editor.tsx:230-236`): `No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.` · `El asesorado ya tiene un plan de entrenamiento vigente con otro profesional.` · el texto del aviso de la app · `No pudimos confirmar el resultado. Reintentá.` · `No pudimos activar el plan. Probá de nuevo.`

Buscador e importación:

| Estado | Texto |
|---|---|
| Búsqueda sin resultados | `No encontramos ejercicios con ese nombre.` |
| Búsqueda con error | `No pudimos buscar en el catálogo. Probá de nuevo.` |
| Crear sin nombre | `Escribí el nombre del ejercicio.` |
| Número de wger mal escrito | `Escribí el número del ejercicio, sin letras ni espacios.` |
| wger caído | `No pudimos consultar wger. Podés seguir usando el catálogo BE o cargar el ejercicio manualmente.` + `Cargar el ejercicio manualmente` |
| wger no lo tiene | `wger no tiene un ejercicio con ese número.` |
| Rechazado | `Rechazado. No se agregó nada al catálogo BE.` |
| Resultado incierto | `No pudimos confirmar si se resolvió. No lo cambies ni lo vuelvas a consultar: reintentá la misma decisión, o buscalo en el catálogo BE antes de importarlo de nuevo.` + `Reintentar la misma decisión` |
| Dato que no vino | `no vino del proveedor` |
| Nombre de plantilla repetido | `Ya tenés una plantilla con ese nombre.` |
| Nombre de habitual repetido | `Ya tenés un habitual con ese nombre.` |

### 3.4 Ejecuciones

| Estado | Texto |
|---|---|
| Período mal armado | `«Desde» no puede ser posterior a «Hasta».` |
| Período largo | `El período puede abarcar hasta 92 días.` |
| Sin sesiones | `Todavía no hay sesiones registradas en este período.` |
| El filtro no deja ninguna | `Ninguna sesión registrada del período coincide con el filtro.` |
| Sin días sin registro | `Ninguno.` |
| Ejercicio sin sesiones | `Este ejercicio no aparece en las sesiones registradas del período.` |
| Ejercicio en otra versión | `Este ejercicio no aparece en las sesiones registradas de la versión del plan elegida: está en otra versión del período.` |
| Una sola sesión | `Hay una sola sesión con este ejercicio en el período: todavía no hay evolución que mirar. Podés ampliar el período (hasta 92 días).` |
| Sin valores de la variable | `No hay valores de {variable} para esta serie en el período. La tabla dice por qué en cada sesión.` |
| Las dos capas apagadas | `Las dos capas están ocultas. Activá al menos una para ver el gráfico; la tabla sigue abajo.` |
| Gráfico más ancho que el marco | `{n} sesiones quedan fuera de la vista: desplazá el gráfico o recorrelo con las flechas. La tabla tiene todas.` |
| Ejercicio sin series | `Esta prescripción no tiene series planificadas ni registradas.` |
| Sesión sin ejercicios | `Esta sesión no tiene ejercicios prescriptos.` |
| No se leyó el plan por serie | `No se pudo leer el plan de cada serie de esa versión: se muestra lo general de la prescripción más abajo.` |
| Tiempos: error | `No pudimos leer los tiempos de esta sesión.` + `Reintentar` |
| Tiempos: no se marcaron | `Esta sesión no tiene tiempos marcados en la app.` |
| Tiempos: sesión dejada incompleta | `La sesión se cerró sin afirmar cuándo terminó: su total queda incompleto.` |
| Registro no determinable | `El registro vigente de esta sesión no se puede determinar: lo registrado no se grafica.` |

Textos de «sin dato» en celdas (`D/comparacion-de-entrenamiento.ts:662-669,697-710`):

- Planificado: `Sin fijar` · `Adicional: sin prescripción para esta serie` · `La prescripción no tiene esta serie` · `Se planificó otro ejercicio: {nombre}` · `75 % RM ({referencia})` · `60 kg (sugerida)` · `60 kg (sugerida, otra unidad)`.
- Registrado: `Sin dato: la serie no está en el registro` · `Sin dato: el ejercicio no está en el registro` · `Sin dato por serie: se registró un resumen` · `Sin dato: el registro vigente no se puede determinar` · `Se registró otro ejercicio` · `Se registró una versión que no se puede identificar: no se sabe si es este ejercicio` · `Sin dato: repeticiones no registradas` · `Sin dato: carga no registrada` · `Sin dato: RIR no registrado` · `No realizada: la sesión se registró así` · `140 lb (otra unidad)`.

Avisos de sustitución en la vista por serie (`T/comparacion.tsx:478-503`). Empiezan con `Planificado: {uno} · Ejecutado: {otro}.` y siguen con uno de tres:

- `El registro indica una sustitución de versión, pero las dos versiones son del mismo ejercicio del catálogo: se compara como el mismo ejercicio.`
- `Se registró otro ejercicio en lugar del planificado: se muestran los dos, pero no se calcula la diferencia entre ejercicios distintos.`
- `El registro indica una sustitución, y con las sesiones del período no se puede saber si lo registrado es el mismo ejercicio o uno distinto: se muestran los dos, sin calcular la diferencia.`

### 3.5 Revisiones

| Estado | Texto |
|---|---|
| Sin revisiones | `Todavía no hay revisiones registradas.` |
| Seguimiento cerrado | `El seguimiento de entrenamiento está cerrado. La historia se conserva.` |
| Seguimiento sin empezar | `El seguimiento empieza al activar el primer plan.` |
| Sin sesiones para marcar | `No hay sesiones registradas en el período.` |
| Nada marcado | `Todavía no marcaste nada.` |
| Revisión registrada | `Revisión registrada. Todavía no se aplicó: aplicala desde la lista.` (+ `Volver a la ficha, donde estabas` si se vino de la ficha) |
| Aplicada, creó un borrador | `Próxima acción aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.` + `Abrir el borrador en Plan` |
| Aplicada, cambió el objetivo | `Próxima acción aplicada: se emitió una nueva versión del objetivo.` |
| Aplicada, sin más efecto | `Próxima acción aplicada.` |
| Aplicada, cerró | `Seguimiento cerrado. La historia se conserva.` |
| No se puede aplicar | `No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.` |

Validaciones del formulario (título `Para registrar la revisión falta:`; `T/revisiones.tsx:182-190`): `Elegí la evidencia que examinaste.` · `Falta la interpretación.` · `Elegí un resultado.` · `Falta el fundamento.` · `Falta la próxima acción.` (con Finalizar: `Describí el cierre.`) · `Para reprogramar, indicá la fecha de la próxima revisión.` · `Para cambiar el objetivo, escribí el nuevo y su fundamento (hace falta una evaluación).`

---

## 4. Datos que llegan a la pantalla

Los nombres son los del contrato (`D/contratos-entrenamiento.ts`, `D/contratos-entrenamiento-por-serie.ts`).

### 4.1 Plan: versión → bloques → microciclos → sesiones → ejercicios → series

**Versión del plan** (`PlanConObjetivos`; `D/contratos-entrenamiento.ts:352-375`, `D/contratos-entrenamiento-por-serie.ts:196-200`)

| Campo | Qué es | Opcional | ¿Se ve? |
|---|---|---|---|
| `planId` | identificador de esta versión | no | no |
| `trainingPlanId` | el plan que agrupa las versiones | no | no |
| `version` | token técnico de concurrencia (no es el número visible) | no | no |
| `state` | `DRAFT` o `ACTIVATED` | no | insignias `Borrador` / `Activo` / `Anterior` |
| `isEffective` | es la versión que rige hoy | no | insignia `Activo` |
| `activatedAt` | cuándo se activó | nulo en borrador | sí |
| `createdAt` | cuándo se creó | no | no |
| `snapshotDigest` | huella de la instantánea activada | nulo en borrador | 16 caracteres |
| `professional` | quién la hizo (`displayName`) | no | no |
| `objectiveVersionId` | objetivo con el que se relaciona | no | solo el aviso de «objetivo más nuevo» |
| `predecessorPlanId` | versión de la que viene | sí | cambia un texto de ayuda |
| `nextReviewAt` | próxima revisión (día) | sí | campo del editor |
| `templateOrigin` | plantilla de origen | sí | nota en el editor |
| `setTargetsDelivery` | si la app del asesorado puede recibir objetivos por serie | no | avisos del editor |

El número `Versión {n}` no viene de la API: la pantalla lo calcula por orden de activación (`T/plan.tsx:38-42`).

**Bloque:** `blockId`, `label` (nombre), `order`, `purpose` (opcional), `microcycles[]`, `sessions[]`. Un bloque tiene sesiones directas o microciclos, no las dos cosas.

**Microciclo** (opcional): `microcycleId`, `label`, `order`, `purpose` (opcional), `sessions[]`.

**Sesión:** `sessionId`, `label`, `order`, `instructions` (opcional), `prescriptions[]`.

**Ejercicio de la sesión = «prescripción»** (`D/contratos-entrenamiento-por-serie.ts:135-153`)

| Campo | Qué es | Unidad / valores | Opcional |
|---|---|---|---|
| `exerciseName` | nombre del ejercicio (congelado al activar) | texto | no |
| `exerciseId`, `exerciseVersionId` | identidad en el catálogo | — | no |
| `image` | imagen del ejercicio (con texto alternativo, autoría, licencia, revisión) | — | sí |
| `intensity.criterion` | criterio de intensidad | `PERCENT_RM` o `RIR` | sí (todo `intensity`) |
| `intensity.target.value` | objetivo de intensidad | % (más de 0 y hasta 100) o RIR (0 a 10) | con el criterio |
| `intensity.target.reference.description` | referencia del % RM | texto | sí |
| `suggestedLoad` | carga sugerida general | número ≥ 0 + `kg` o `lb` | sí |
| `restSeconds` | descanso recomendado general | segundos enteros, 0 a 3600 | sí |
| `loadBasis` | cómo se cuenta la carga | una mancuerna / por mancuerna / total | sí |
| `repetitionBasis` | qué cuentan las repeticiones | por serie / por lado | sí |
| `professionalParameters[]` | parámetros libres: `label`, `value`, `unit` | texto o número | sí |
| `note` | nota del ejercicio | texto, 1000 | sí |
| `sets[]` | las series | — | puede estar vacío |

**Serie planificada** (`D/contratos-entrenamiento-por-serie.ts:121-133`)

| Campo | Qué es | Opcional |
|---|---|---|
| `setIndex` | número de la serie (1, 2, 3…) | no |
| `note` | nota de la serie (200) | sí |
| `rir`, `suggestedLoad`, `restSeconds` | lo que **declara** la serie. Tres estados: ausente = hereda del ejercicio; nulo = sin objetivo; valor = propio | sí |
| `target.repetitions` | repeticiones: un número (`{value}`) o un rango (`{min,max}`); enteros de 1 a 1000 | sí |
| `target.rir` | RIR objetivo ya resuelto | sí |
| `target.suggestedLoad` | carga sugerida ya resuelta | sí |
| `target.restSeconds` | descanso ya resuelto | sí |
| `targetOrigin.*` | de dónde salió cada valor: `SET`, `PRESCRIPTION`, `NONE` | no |

`target` es lo que recibe el teléfono. Las repeticiones son siempre de la serie: no se heredan.

**Topes del contrato** (`D/contratos-entrenamiento.ts:252,257,269,277,287-290`): 12 bloques; 26 microciclos por bloque; 30 sesiones por bloque (14 por microciclo); 40 ejercicios por sesión; 20 series por ejercicio; 12 parámetros por ejercicio. La pantalla no los muestra ni los cuenta.

**Lo que el plan no tiene:** días de la semana, fechas o calendario; frecuencia; duración estimada; grupos musculares (el catálogo los trae vacíos); tipo de serie (entrada en calor, etc.); totales.

### 4.2 Sesión registrada («ejecución»)

**Ejecución** (`D/contratos-entrenamiento.ts:662-678`)

| Campo | Qué es | ¿Se ve? |
|---|---|---|
| `executionId` | identificador | no |
| `date` | día civil de la sesión | sí |
| `occurredAt` | instante en que ocurrió | solo en el panel de valores |
| `recordedAt` | instante en que se registró | sí (`Registrado el …`) |
| `planId` | versión del plan que regía | solo en el panel de valores de la evolución (`Versión del plan activada el …`); la tarjeta de la sesión no lo dice |
| `plannedSession` | la sesión planificada **tal como estaba ese día** (instantánea), con `blockLabel` y `microcycleLabel` | el nombre de la sesión y sus ejercicios; el bloque y el microciclo no |
| `original` | el registro tal como lo hizo el asesorado | sí |
| `corrections[]` | correcciones, cada una con el registro completo, `reason`, `author`, `authorRole`, `recordedAt` | sí |
| `effectiveView` | qué rige: el original, una corrección, o no se puede determinar | decide qué se compara |

**Registro** (`RegistroDeEjecucion`; `D/contratos-entrenamiento.ts:631-638`)

| Campo | Valores | Opcional |
|---|---|---|
| `sessionCondition` | `COMPLETED` / `COMPLETED_WITH_DEVIATION` / `NOT_COMPLETED` → `Realizada` / `Realizada con desvío` / `No realizada` | no |
| `granularity` | `SET` / `EXERCISE_OR_SESSION` → `Por serie` / `Por ejercicio o sesión`. Nulo si no se realizó | sí |
| `reason` | motivo, texto libre (1000) | sí |
| `exercises[]` | lo registrado por ejercicio | puede estar vacío |
| `sessionSummary.description` | resumen de la sesión (solo en registro resumido) | sí |

**Ejercicio registrado** (`D/contratos-entrenamiento.ts:588-599`): `prescriptionId`, `prescribedExerciseName` (lo planificado), `performedExerciseName` (lo hecho), `substituted` (verdadero si no coinciden), y **una de dos**: `sets[]` (registro por serie) o `executionSummary.description` (registro resumido).

**Serie registrada** (`D/contratos-entrenamiento.ts:533-539`)

| Campo | Qué es | Unidad / rango | Opcional |
|---|---|---|---|
| `setIndex` | número de la serie | 1 a 50 | no |
| `load` | carga usada | número ≥ 0 + `kg` o `lb` | sí |
| `completedRepetitions` | repeticiones hechas | entero, 0 a 1000 | sí |
| `rir` | RIR informado | 0 a 20, con decimales | sí |
| `perceivedExertion` | esfuerzo percibido | 0 a 10 | sí |

- Una serie registrada **no tiene nota ni hora propia**.
- El descanso y la duración no están en el registro: llegan por otra lectura, los **tiempos**.

**Tiempos de la sesión** (`TiemposDeSesion`; `D/contratos-entrenamiento-por-serie.ts:357-387`). Una lectura por sesión, que se hace al desplegarla.

| Campo | Qué es | ¿Se ve? |
|---|---|---|
| `state` | `NOT_STARTED`, `IN_PROGRESS`, `PAUSED`, `FINISHED`, `LEFT_INCOMPLETE` | decide los textos |
| `session.elapsed` / `pauses` / `withoutPauses` | total, pausas y total sin pausas | sí |
| `exercises[]` | tiempo asociado a cada ejercicio | sí |
| `unassigned` | tiempo sin ejercicio activo | sí |
| `rests[]` | descansos: `prescriptionId`, `setIndex`, `duration`, `recommendedSeconds`, `differenceMs`, `startedAt`, `finishedAt` | duración, recomendado y diferencia; las horas no |
| `timedSets[]` | series cronometradas: `prescriptionId`, `setIndex`, `duration`, `startedAt`, `finishedAt` | la duración; las horas no |
| `events[]`, `startedAt`, `finishedAt` | eventos crudos e inicio y fin | no |

Toda duración es `{ms, quality}`. Calidades: `MEASURED`, `ESTIMATED`, `INCOMPLETE`, `NO_DATA`, `INVALID`.

### 4.3 Revisión

**Revisión** (`D/contratos-entrenamiento.ts:728-742`)

| Campo | Qué es | ¿Se ve en la lista? |
|---|---|---|
| `result` | uno de los seis resultados | sí |
| `recordedAt` | cuándo se registró | sí |
| `interpretation` | interpretación | sí |
| `rationale` | fundamento | sí |
| `nextAction.description` | próxima acción o cierre | sí |
| `nextAction.nextReviewAt` | fecha de la próxima revisión | no |
| `nextAction.objective` | objetivo nuevo (solo «Cambiar objetivo») | no |
| `period` | período revisado (`start`, `end`, `timeZone`) | no |
| `evidenceReferences[]` | evidencia marcada: tipo + identificador | no |
| `author` | quién la registró | no |
| `application` | si se aplicó: `appliedAt`, `processStateAfter`, `createdPlanId`, `createdObjectiveVersionId` | `Aplicada` + fecha |

**Contexto de revisión** (lo que alimenta Ejecuciones, Revisiones y parte del Resumen; `D/contratos-entrenamiento.ts:751-765`): `period`, `objective`, `activePlanVersions[]`, `registeredExecutions[]`, `corrections[]`, `missingData[]` (días sin registro), `previousReviews[]`, `process` (`ABIERTO`/`CERRADO`) y `pendingReview` (`pending`, `since`).

- `previousReviews[]` trae todas las revisiones, no solo las del período (`API/entrenamiento/revisiones.service.ts:162-166`).
- `corrections[]` llega pero la pantalla no lo usa.

**Evaluación** (`D/contratos-entrenamiento.ts:131-144`): `occurredAt`, `recordedAt`, `assessment.entries[]` (`concept`, `value`, `unit`, `source`, `methodStatement`), `formResponseReferences[]` (respuestas citadas: `label`, `value`, `unit`, `answeredAt`, `laterVersionExists`), `professionalNotes`, `context`, `professional`.

**Objetivo** (`D/contratos-entrenamiento.ts:169-183`): `objective.statement` (un texto libre), `rationale`, `effectiveFrom`, `effectiveUntil`, `evaluationId`, `createdAt`, `isEffective`, `authoredBy`. El objetivo de entrenamiento es solo un enunciado: no tiene metas numéricas.

### 4.4 Qué distingue «planificado» de «registrado»

| | Planificado (indicado) | Registrado |
|---|---|---|
| De dónde sale | la versión del plan que regía ese día (su instantánea) | `original` y `corrections[]` de la ejecución |
| Quién lo escribe | el profesional | el asesorado, en la app. Una corrección puede ser del profesional, pero el website no tiene cómo hacerla |
| Palabras en pantalla | `Planificado`, `Plan de la serie`, `Carga sugerida`, `Descanso recomendado`, `Lo que recibe tu asesorado` | `Registrado`, `Registro original`, `Corrección vigente`, `Ejecutado` (solo en una sustitución) |
| En los gráficos | barra rayada; línea discontinua con cuadrados; franja si es un rango | barra llena; línea continua con círculos |
| Forma del dato | puede ser un rango (`12–16`) o no estar fijado | siempre un número, o falta |
| Si falta | `Sin objetivo`, `Sin fijar`, `No planificada` | `Sin registrar`, `Sin dato: …`, `carga no registrada` |

- La comparación es siempre contra la versión que regía ese día, nunca contra el plan de hoy (`T/series-y-tiempos.tsx:5-6`).
- Una serie registrada con un número que el plan no tiene es `Adicional` / `No planificada`.
- La diferencia es un dato en palabras. No hay porcentajes, colores de bien o mal, ni puntajes.

---

## 5. Reglas visibles

### 5.1 Orden obligado de las cosas

1. **Evaluación → objetivo.** Sin evaluación no se puede emitir un objetivo (`T/resumen.tsx:130,135`).
2. **Objetivo → plan.** Sin objetivo vigente no se puede crear un borrador (`T/plan.tsx:122-126,142`).
3. **Plan activado → seguimiento.** El seguimiento empieza al activar el primer plan. Sin seguimiento abierto no se puede registrar una revisión; las ya registradas se siguen viendo (`T/revisiones.tsx:99-114`).

### 5.2 Borrador, activo y anterior

- Hay **un solo borrador** a la vez. Si existe, la pantalla muestra el editor y no ofrece crear otro (`T/plan.tsx:128-141`).
- **El borrador no lo ve el asesorado.** `Guardar` no activa.
- **Activar es un acto aparte**, con confirmación. Pide tener todo guardado.
- **La versión activa no se edita.** Para cambiarla se crea un borrador a partir de ella.
- Al activar, la anterior queda como `Anterior` en el historial.
- No hay control para **descartar un borrador**: una vez creado, sigue ahí hasta activarlo.
- Después de `Finalizar` (seguimiento cerrado), ninguna versión figura como activa: la API solo marca una versión como vigente con el seguimiento abierto (`API/entrenamiento/lectura-entrenamiento.ts:230`).

### 5.3 Registrar ≠ aplicar ≠ activar

Son tres pasos separados, cada uno con su botón:

| Paso | Botón | Qué pasa | Texto que lo dice |
|---|---|---|---|
| 1 | `Registrar revisión` | queda escrita la revisión; nada más cambia | `Revisión registrada. Todavía no se aplicó: aplicala desde la lista.` |
| 2 | `Aplicar próxima acción` | se produce el efecto del resultado: un borrador, un objetivo nuevo, una fecha o el cierre | `…se preparó una nueva versión del plan en borrador. La versión activa no cambió.` |
| 3 | `Activar plan` → `Activar esta versión` | el borrador pasa a regir | `Plan activado. El asesorado ya ve esta planificación como vigente.` |

Además: `Ver el contexto no registra una revisión.` Mirar no es revisar.

### 5.4 Intensidad, carga y series

- El criterio de intensidad es **uno o ninguno**: `% RM` o `RIR`. Nunca los dos.
- El esfuerzo percibido no es un criterio: lo informa el asesorado al registrar.
- El RIR de una serie solo existe si el ejercicio usa el criterio RIR. Al cambiar de criterio, los RIR de las series se borran (`T/editor.tsx:598-601`).
- RIR objetivo: de 0 a 10. % RM: más de 0 y hasta 100 (`D/plan-de-entrenamiento.ts:142-144`).
- La carga sugerida es un complemento, no el criterio. BE no convierte % RM a kilos ni kilos a libras.
- Una sola unidad por ejercicio. Cambiarla cambia la de todas sus series, sin convertir los números (`T/editor.tsx:653-663`).
- Cada objetivo de una serie tiene tres estados: vacío (hereda), un número (propio), `Sin objetivo en esta serie`.
- Repeticiones: un entero o un rango `8-12`. Vacío es «sin fijar».
- Descanso en segundos enteros. `0` es sin pausa.
- Una serie nueva copia las repeticiones de la anterior; sus objetivos propios no.

### 5.5 Lo que no se puede hacer desde esta área

- Reordenar bloques, sesiones, ejercicios o series.
- Duplicar un ejercicio o una sesión (salvo guardarla como habitual y volver a insertarla).
- Quitar una serie del medio: solo `Quitar la última serie`.
- Asignar una sesión a un día o a una fecha.
- Abrir una versión anterior del plan.
- Corregir o editar lo que registró el asesorado.
- Editar o borrar una evaluación, un objetivo o una revisión ya registrados.
- Deshacer la aplicación de una revisión.

### 5.6 Activación bloqueada por la app del asesorado

Si alguna serie tiene un RIR o una carga distintos de los generales del ejercicio, y el asesorado todavía no usó una app que muestre objetivos por serie, `Activar plan` queda deshabilitado y se dice por qué (`T/editor.tsx:246-250`; `D/compatibilidad-de-clientes.ts:57-79`). El descanso y las bases no cuentan para esto.

### 5.7 Lo que las pantallas no dicen nunca

- `No realizada` solo aparece si el asesorado lo registró así. Un día sin nada es `Sin registro` o `Días sin registro`.
- Una serie que falta es `Sin dato`, no cero.
- No hay puntajes, porcentajes de cumplimiento ni recomendaciones.
- Términos que ninguna pantalla de entrenamiento puede mostrar (`D/copy-entrenamiento.ts:237-257`): `score`, `puntaje`, `cumplimiento`, `incumplimiento`, `adherencia`, `fallaste`, `incumplidor`, `disciplinado`, `mal rendimiento`, `riesgo alto`, `fatiga`, `programa óptimo`, `mejor ejercicio`, `recomendación be`, `progresar`, `rpe prescripto`, `volumen`, `marca personal`, `efectividad`. Y `%` fuera de `% RM`.
- Lo mismo vale para las maquetas.

### 5.8 Otras reglas

- El período va de 1 a 92 días. Vacío: los últimos 7.
- Seis resultados de revisión, ninguno más. «Progresar» no existe: se registra como `Ajustar` o `Sustituir`.
- Las plantillas y las sesiones habituales copian la estructura, no a la persona. Las cargas no se copian salvo que se marque la casilla.
- Hasta 20 respuestas citadas por evaluación.

---

## 6. Cuánto hay en pantalla

### 6.1 Cómo conté

- **Control** = cada elemento que se puede enfocar y accionar: enlace, botón, campo, select, casilla, opción excluyente y cada desplegable.
- Un campo con su casilla `Sin objetivo en esta serie` cuenta 2.
- No cuento el marco de la página (encabezado: 8; migas: 2; pestañas: 4), que está siempre.
- Conté sobre el código, no sobre una pantalla viva.
- **Caso de referencia:** la sesión «Piernas A» de las capturas del repositorio: 1 bloque, 1 sesión, 3 ejercicios de 3 series; dos con criterio RIR y uno sin criterio.

### 6.2 Resultado

| Pantalla y estado | Controles | Observación |
|---|---|---|
| Resumen, sin formularios | 7 u 8 | 3 enlaces del estado + 1 o 2 del objetivo + 3 de evaluaciones |
| Resumen, con `Nueva evaluación` (1 dato, 6 respuestas para citar) | ≈ 20 | 10 fijos + 6 casillas + lo que queda del resto |
| Resumen, con `Nueva versión de objetivo` | ≈ 12 | 6 del formulario |
| Plan, sin borrador, con plan activo | 2 a 4 | casi todo es lectura |
| **Plan, con borrador («Piernas A»)** | **116** | más 2 si hay sesiones habituales; más el plan activo debajo |
| Plan, con borrador de 2 sesiones de 3 ejercicios | ≈ 222 | el mismo cálculo con dos sesiones |
| Ejecuciones, al entrar (2 sesiones cerradas) | 8 | 3 del período + 2 filtros + 1 ayuda + 2 `Ver detalle` |
| Ejecuciones, con un ejercicio elegido (2 sesiones) | ≈ 18 | suma 2 selects, 2 casillas, 1 ayuda, el gráfico y 4 enlaces de la tabla |
| Ejecuciones, además con una sesión desplegada | ≈ 28 | suma 2 selects, 2 casillas, 2 ayudas, el gráfico y 3 botones de serie |
| Revisiones, formulario cerrado | 4 a 6 | 3 del período + 1 + un `Aplicar` por revisión sin aplicar |
| Revisiones, formulario abierto (2 días con sesión) | ≈ 23 | 7 de evidencia + 6 resultados + 4 campos + 2 botones + lo de afuera |

### 6.3 El desglose del editor

Por ejercicio, con 3 series:

| Ejercicio | Selects | Campos | Casillas | Botones-enlace | Total |
|---|---|---|---|---|---|
| Con criterio RIR | 4 | 19 | 9 | 4 | **36** |
| Con criterio % RM | 4 | 17 | 6 | 4 | **31** |
| Sin criterio | 4 | 15 | 6 | 4 | **29** |

- Cada serie suma 8 controles con RIR y 6 sin RIR.
- Cada ejercicio con RIR y 3 series trae, además, 13 líneas de ayuda escritas.
- Para «Piernas A»: 1 (ayuda) + 3 (bloque) + 5 (sesión) + 36 + 36 + 29 (ejercicios) + 6 (pie) = 116.

### 6.4 Medidas tomadas de las capturas del repositorio (ancho 1280 px)

| Captura | Qué muestra | Alto |
|---|---|---|
| `04-editor-piernas-a.png` | el editor con «Piernas A» (1 sesión, 3 ejercicios, 9 series) | 9677 px |
| `06-plan-activo.png` | plan activo con 3 sesiones, 5 ejercicios y 11 series | 2774 px |
| `07-ejecucion-…png` | Ejecuciones con una sesión desplegada | 3337 px |
| `08-ejecucion-…png` | Ejecuciones con dos sesiones desplegadas | 5659 px |

El editor de una sola sesión de tres ejercicios ocupa unas nueve pantallas de 1080 px. `Guardar borrador` y `Activar plan` están al final de todo.

### 6.5 Los bloques más densos

1. **El ejercicio dentro del editor.** 29 a 36 controles por ejercicio, todos abiertos, sin plegar. Es lo más denso del área.
2. **Una sesión desplegada en Ejecuciones.** El mismo dato aparece varias veces. Para una serie:
   - lo planificado se lee en cinco lugares: la tabla `Planificado frente a registrado`, el gráfico de barras, la `Tabla de valores`, la lista `Planificado` y el `· planificadas 12-16` del `Registro original`;
   - lo registrado, en cuatro: la primera tabla, el gráfico, la `Tabla de valores` y el `Registro original` (cinco si hay corrección).
3. **El formulario de revisión.** La evidencia por día más seis resultados, cada uno con su párrafo.
4. **El formulario de nueva evaluación.** Datos con fuente más las respuestas para citar.

Otros datos de densidad:

- Ejecuciones tiene **tres títulos casi iguales** en la misma pantalla: `Planificado y registrado`, `Planificado frente a registrado` y `Planificado y registrado, serie por serie`; y un cuarto, `Planificado`.
- Ejecuciones tiene dos juegos de filtros apilados (período; versión y ejercicio) y, más abajo, hasta dos juegos más de `Variable` y `Capas` (evolución y por serie).

---

## 7. Cómo lo nombra la APK

Archivos consultados: `M/pantallas/entrenamiento.tsx`, `M/pantallas/sesion-enfocada.tsx`, `M/pantallas/plan-por-serie.tsx`, `M/pantallas/historial.tsx`, `M/pantallas/tiempos-de-la-sesion.tsx`, `M/pantallas/inicio-entrenamiento.tsx`, `M/series-de-la-sesion.ts`, `M/textos-del-guardado.ts`, `M/navegacion.ts`, `M/menu-auxiliar.tsx`, y el copy compartido `D/copy-entrenamiento.ts` y `D/copy-entrenamiento-por-serie.ts`. (`M/pantallas/serie-en-lista.tsx` es de antropometría, no de entrenamiento.)

### 7.1 Estructura de la APK

- Zona de la barra: `Entrenamiento` (`M/navegacion.ts:103`).
- Tres pestañas: `Hoy`, `Plan`, `Historial` (`M/pantallas/entrenamiento.tsx:167-171`).
- Pantallas que se abren desde ahí: la sesión enfocada, `Antes de finalizar`, el registro de una sesión, `Tu historial` y `Plan de entrenamiento`.

### 7.2 Etiquetas por pantalla

**`Hoy`** (`M/pantallas/entrenamiento.tsx:280-328,516-542`)

- Tarjeta por sesión: el nombre; `3 ejercicios · 9 series`; una línea por ejercicio `{ejercicio} · 3 series`.
- Estado: `No iniciada` · `En curso` · `Registrada · Realizada` · `Registrada · Realizada con desvío` · `Registrada · No realizada` · `Sin registro`.
- Acción: `Iniciar entrenamiento` · `Continuar entrenamiento` · `Ver registro`. Para otro día: `Comenzar sesión` · `Continuar sesión`.
- `Tu plan tiene varias sesiones. Elegí la que hiciste o vas a hacer.`
- `Registrar otro día` → `Fecha (AAAA-MM-DD)`, `Ver sesiones de ese día`.
- `Tenés un entrenamiento sin finalizar` → `Continuar entrenamiento`, `Dejarlo incompleto`.
- Sin plan: `Todavía no tenés un plan de entrenamiento activo.` Sin acceso: `Tu plan de entrenamiento no está disponible en este momento.`

**Sesión enfocada** (`M/pantallas/entrenamiento.tsx:1057-1146`; `M/pantallas/sesion-enfocada.tsx`)

- Arriba: `Ver rutina`, el nombre de la sesión y `Sesión 04:12` (o `Sesión en pausa · 04:12`).
- Ejercicio: nombre, `Ejercicio 1 de 3`, `Carga: {base}`, `Repeticiones: {base}`, `Ver técnica`.
- Título de la serie: `Serie 1 de 3` · `Serie 1 guardada` · `Serie 4 · sin planificar`.
- Tabla: columnas `Serie`, `kg` (o `lb`), `Rep.`, `RIR`. Fila activa `Serie actual`. Fila guardada `Guardada`. Nota `En gris: lo planificado`. Celda sin objetivo `Sin objetivo`.
- Banda: `Plan de la serie 1` → `16 kg · 12–16 rep. · RIR 3` → `Descanso recomendado 01:30`.
- RIR: `RIR (opcional)` · `Cuántas repeticiones más creés que podrías haber hecho manteniendo la técnica` · `RIR 2: creés que te quedaban 2 repeticiones`.
- Acciones: `Registrar serie 1` · `Cambiar a lb` · `Agregar una serie` · `Pasar a la serie 2` · `Cronometrar serie` · `Finalizar serie` · `Siguiente ejercicio` · `Pausar sesión` · `Reanudar sesión` · `Finalizar entrenamiento`.
- Descanso: `Descanso` · `Recomendado tras la serie 1: 01:30` · `Descanso sin duración indicada` · `Iniciar descanso` · `Descanso · Serie 1` · `Recomendado: 01:30` · `Finalizar descanso` · `Al terminar, seguís con la serie 2`.
- Rutina (diálogo): `1. {ejercicio}` · `2 de 3 series registradas` · `Ejercicio activo` · `Pasar a este ejercicio` · `Volver a la sesión`.
- Técnica (diálogo): `Descripción de la imagen`, `Procedencia`, `Autoría`, `Licencia`, `Revisión técnica`, `Indicaciones del profesional`.

**`Antes de finalizar`** (`M/pantallas/entrenamiento.tsx:963-1008`): secciones `Series`, `Tiempos de la sesión`, `Condición de la sesión`; `Motivo (opcional)`; botones `Realizada`, `Realizada con desvío`; `Finalizar entrenamiento`; `Volver a la sesión`; sección `¿No pudiste entrenar?` con `No pude realizarla`.

**Registro de una sesión** (`M/pantallas/entrenamiento.tsx:1209-1254`): `Corrección vigente` (`Corregido por el profesional` / `Corregido por vos`), `Registro original`, `Condición de la sesión`, `Motivo`, `Serie 1: 60 kg × 8 reps · RIR 2 · esfuerzo 7`, `Tiempos de la sesión`, `Historial de correcciones`, `Corregir registro`.

**`Plan`** (`M/pantallas/plan-por-serie.tsx`): `Las sesiones de tu plan, en su orden. Es para consultar: los objetivos de cada serie son los que planificó tu profesional.` Por sesión, un desplegable con su nombre y `3 ejercicios · 9 series`. Por serie: `Serie 1: 16 kg · 12–16 rep. · RIR 3 · Descanso recomendado 01:30 · {nota}`.

**`Historial` / `Tu historial`** (`M/pantallas/historial.tsx`): `Sesiones registradas` (con `Ver la sesión`, insignia `Corregida`) y `Tus planes` (con `Ver el plan`, insignia `Vigente`).

### 7.3 El mismo concepto, en la web y en la APK

| Concepto | Website del profesional | APK del asesorado | ¿Difiere? |
|---|---|---|---|
| Área | `Entrenamiento` | `Entrenamiento` | no |
| Secciones | `Resumen` · `Plan` · `Ejecuciones` · `Revisiones` | `Hoy` · `Plan` · `Historial` | sí |
| Versión que rige | `Plan activo`, insignia `Activo` | `plan de entrenamiento activo`, insignia `Vigente` | **sí** |
| Bloque y microciclo | `Bloque`, `Microciclo`, a la vista | no aparecen en Entrenamiento (solo en una tarjeta de Inicio) | **sí** |
| Sesión planificada | `Sesión` | `sesión`, `entrenamiento` y `rutina` | **sí** |
| Sesión ya registrada | `Ejecuciones`, `Sesiones registradas`, `Abrir la ejecución` | `Sesiones registradas`, `Ver registro`, `Ver la sesión` | **sí** |
| Ejercicio en la sesión | `prescripción` en los textos; `Ejercicio` en filtros | `ejercicio` | **sí** |
| Objetivos de la serie | `Lo que recibe tu asesorado`, `Así lo ve tu asesorado`, `Plan de la serie` | `Plan de la serie 1`, `En gris: lo planificado` | parcial |
| Sin objetivo | `Sin objetivo` | `Sin objetivo` | no |
| Carga | `Carga sugerida`, `Carga` | la columna se llama `kg` o `lb`; `Carga (kg)` en tarjetas | parcial |
| Repeticiones | `Repeticiones`, `Rep.`, `reps` | `Rep.`, `reps`, `Repeticiones` | no |
| RIR | `RIR`, `RIR = repeticiones en reserva` | `RIR (opcional)` y su explicación larga | no |
| Descanso | `Descanso recomendado`; columna `Descanso` | `Descanso`, `Recomendado tras la serie 1`, `Descanso recomendado 01:30` | no |
| Condición | `Realizada` · `Realizada con desvío` · `No realizada` | botones `Realizada` · `Realizada con desvío` · `No pude realizarla` | **sí** (la tercera) |
| Estado de una sesión | no existe (solo se listan las registradas) | `No iniciada` · `En curso` · `Registrada · …` · `Sin registro` | — |
| Día sin nada | `Días sin registro` | `Sin registro` | no |
| Serie sin registrar | `Sin registrar` | `Sin registrar` | no |
| Corrección | `Corregido por el asesorado` | `Corregido por vos` | sí (por la persona) |
| Esfuerzo percibido | `esfuerzo percibido 7` | `esfuerzo 7` | **sí** |
| Tiempos | `Tiempos de la sesión`, `Tiempo transcurrido`, `Pausas`, `Sin pausas`, `Sin ejercicio asignado` | los mismos | no |
| Notas | `Notas`, `nota (opcional)`, `Indicaciones` | `Notas`, `Indicaciones de la sesión`, `Indicaciones del profesional` | parcial |

Lo más útil para diseñar:

- La palabra **`rutina`** existe solo en la APK. El website no la usa nunca.
- La palabra **`ejecución`** existe solo en el website. La APK dice `registro` o `sesión`.
- La palabra **`prescripción`** existe solo en el website. La APK dice `ejercicio` y `plan`.
- **`Activo`** (web) y **`Vigente`** (APK) nombran lo mismo.

---

## 8. Datos de ejemplo

Todos son sintéticos y están en el repositorio.

### 8.1 «Piernas A» — la sesión de demostración de Dirección

Fuente: `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/datos/sesion_demo.json`. Es la que se ve en las capturas de `EVIDENCIA/ENTRENAMIENTO-SERIES/capturas-web/`.

**Plan (objetivo de cada serie)**

| Ejercicio | Serie | Repeticiones | Carga sugerida | RIR | Descanso |
|---|---|---|---|---|---|
| Sentadilla goblet | 1 | 12–16 | 16 kg | 3 | 90 s (`01:30`) |
| | 2 | 10–12 | 18 kg | 2 | 120 s (`02:00`) |
| | 3 | 8–10 | 20 kg | 1 | 150 s (`02:30`) |
| Peso muerto rumano con mancuernas | 1 | 10–12 | 10 kg | 3 | 90 s |
| | 2 | 10–12 | 12 kg | 2 | 120 s |
| | 3 | 8–10 | 12 kg | 2 | 120 s |
| Zancada estática | 1 | 10–12 | 0 kg | sin RIR | 90 s |
| | 2 | 10–12 | 0 kg | sin RIR | 90 s |
| | 3 | 8–10 | 0 kg | sin RIR | sin descanso |

- Bases: sentadilla, `una sola mancuerna o implemento`, `por serie`; peso muerto, `por mancuerna o implemento`, `por serie`; zancada, `carga externa total`, `por lado; no se duplican`.
- Nombre del bloque en la captura: `Bloque 1`.

**Registro de ejemplo** (del mismo archivo, `sampleRecordedSets`)

| Ejercicio | Serie | Carga | Repeticiones | RIR |
|---|---|---|---|---|
| Sentadilla goblet | 1 | 16 kg | 14 | 3 |
| | 2 | 18 kg | 11 | 2 |
| | 3 | 20 kg | 9 | no informado |

**Valores que se leen en las capturas `06-plan-activo.png` y `07-ejecucion-…png`**

- Condición `Realizada con desvío`; motivo `Recorrido de demostración: se registraron la sentadilla y una serie del peso muerto.`
- Peso muerto, serie 1: `10 kg × 12 reps · RIR 3`. Series 2 y 3: `Sin registrar`. Zancada: las tres `Sin registrar`.
- Tiempos: `Tiempo transcurrido 15:00 · medido`, `Pausas 02:00 · medido`, `Sin pausas 13:00 · medido`, `Sentadilla goblet 07:30 · medido`, `Peso muerto rumano con mancuernas 05:30 · medido`, `Sin ejercicio asignado 00:00 · medido`.
- Descansos: `01:30 registrado · 01:30 recomendado · ±00:00` y `02:15 registrado · 02:00 recomendado · +00:15`.
- Duración: `Duración medida 00:40` (series 1 y 2) y `Duración desconocida` (serie 3).
- Activación: `Versión 1 · activada el 6 oct 2026, 3:38 p. m.`

**Imágenes de los tres ejercicios:** `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/` (`sentadilla_goblet.png`, `peso_muerto_rumano_mancuernas.png`, `zancada_estatica.png`), con sus textos alternativos en `CATALOGO.json`.

### 8.2 El escenario de 12 semanas del tablero

Fuente: `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/escenario.mjs:146-276`.

**Plan, etapa 1** — bloque `Fuerza base`, propósito `Técnica y volumen moderado`

| Sesión | Ejercicio | Series × repeticiones | Intensidad | Carga sugerida |
|---|---|---|---|---|
| `A · Tren inferior` | Sentadilla | 3 × 8 | RIR 2 | 60 kg |
| | Peso muerto | 3 × 6 | RIR 2 | 70 kg |
| | Zancadas | 3 × 10 | sin criterio | — |
| `B · Tren superior` | Press de banca | 3 × 8 | RIR 2 | 50 kg |
| | Remo con barra | 3 × 10 | RIR 2 | 40 kg |
| | Dominadas | 3 × 6 | sin criterio | — |

**Plan, etapa 2** — bloque `Fuerza progresión`, propósito `Más carga, menos repeticiones`

| Sesión | Ejercicio | Series × repeticiones | Intensidad | Carga sugerida |
|---|---|---|---|---|
| `A · Tren inferior` | Sentadilla | 4 × 6 | RIR 1 | 77,5 kg |
| | Peso muerto | 3 × 5 | RIR 2 | 85 kg |
| | Zancadas | 3 × 10 | RIR 2 | 10 kg |
| `B · Tren superior` | Press de banca | 4 × 6 | RIR 1 | 60 kg |
| | Remo con barra | 4 × 8 | RIR 2 | 47,5 kg |
| | Dominadas | 4 × 6 | sin criterio | — |

**Sesiones registradas** — A los lunes, B los jueves, a las 18:30, registradas 19:45.

- Sentadilla, etapa 1: `60 kg × 8 · RIR 2`, `60 kg × 8 · RIR 2` y una tercera de 7 repeticiones; sube 2,5 kg por semana. La tercera lleva RIR 1 en las semanas pares y queda sin RIR en las impares.
- Peso muerto: `70 kg × 6 · RIR 2`, las tres; sube 2,5 kg por semana.
- Zancadas: sin carga, `× 10`, sin RIR.
- Press de banca: `50 kg`, 8 / 8 / 7, RIR 2 / 2 / 1; sube 1,25 kg por semana.
- Dominadas: sin carga, 6 / 5 / 5.
- Sentadilla, etapa 2: `77,5 kg`, 6 / 6 / 6 / 5, RIR 2 / 1 / 1 / 0.

**Casos especiales del escenario** (útiles para dibujar estados):

| Caso | Dato |
|---|---|
| Corrección del profesional | la carga se tipeó `650` en vez de `65`; motivo `Error de tipeo en la carga: 650 en lugar de 65` |
| Realizada con desvío y sustitución | Zancadas → Hip thrust; motivo `Zancadas reemplazadas por hip thrust: el banco de zancadas estaba ocupado` |
| Otra unidad | press de banca en libras: 115, 115 y 120 lb |
| No realizada | motivo `Viaje laboral` |
| Registro resumido | `Hecho completo, sin anotar las series` |
| Carga tardía | una sesión registrada al día siguiente, 10:30 |
| Hueco | una semana sin sesiones (vacaciones) |

**Evaluación, objetivo y revisión** (`…/datos/generar.mjs:254-276`; `…/datos/comprension.mjs:174-187`):

- Evaluación: concepto `Experiencia en entrenamiento de fuerza`, valor `Un año, con interrupciones`, fuente «informado por el asesorado».
- Objetivo: `Ganar fuerza en los básicos con técnica estable (objetivo sintético).`
- Revisión: resultado `Ajustar`, registrada y sin aplicar; interpretación `Interpretación sintética: la carga de la sentadilla subió de forma estable. No es un diagnóstico.`; próxima acción `Ajustar el volumen del bloque siguiente.`

Atención: el propósito `Técnica y volumen moderado` y la próxima acción `Ajustar el volumen…` usan la palabra `volumen`. Son textos del profesional, pero esa palabra está en la lista de las que las pantallas de BE no dicen (§5.7). En una maqueta conviene otro ejemplo.

### 8.3 Catálogo sembrado

Fuente: `prisma/migrations/20260921100000_circuito_de_entrenamiento/migration.sql:703-715`. Doce ejercicios: Sentadilla, Press de banca, Press con mancuernas, Peso muerto, Remo con barra, Dominadas, Press militar, Zancadas, Curl de bíceps, Extensión de tríceps, Plancha, Hip thrust.

### 8.4 Otros valores sueltos

| Valor | De dónde sale |
|---|---|
| `Bloque 1`, `Sesión A`, `Sesión B`, `Semana 1` | nombres por defecto del editor (`T/editor.tsx:118,358,367,383`) |
| `75 % RM (1RM estimado por el profesional)` | `D/comparacion-de-entrenamiento.test.ts:221` |
| Pirámide `10 / 8 / 6`; `Serie 2: 8 · pausa de 2 s abajo` | comentario de `D/presentacion-de-prescripcion.ts:4-7` |
| `bajar en 3 segundos y subir en 1`; código `3010` | ayuda del tempo (`D/copy-entrenamiento.ts:113`) |
| `consulta inicial, cambio de bloque, vuelta de una lesión` | ayuda del contexto de la evaluación (`T/resumen.tsx:520`) |
| `Prof. Sintética`; sesiones `Sesión A`, `Día A`, `Día B` | pruebas del dominio y captura de PF-03 |
| `/exercise/56/` | ayuda de wger (`D/copy-integraciones.ts:18`) |

**Formulario «Antecedentes para entrenamiento»** (lo que se puede citar en una evaluación; `prisma/migrations/20260928000000_plantilla_de_entrenamiento/migration.sql:19`):

1. `Qué te gustaría poder hacer o mejorar con el entrenamiento`
2. `Qué actividad venís haciendo y desde hace cuánto`
3. `Cuántos días por semana podrías reservar de manera realista` (unidad `días por semana`)
4. `Cuánto tiempo podrías dedicar a cada sesión` (unidad `min`)
5. `Dónde entrenarías y con qué equipamiento contás`
6. `Qué actividades disfrutás y cuáles preferís evitar`

**Nombres de personas:** no se puede determinar. Las cuentas de la evidencia son correos `…@example.invalid` y las pruebas usan `Prof. Sintética`. No hay nombres de asesorados sembrados.

---

## 9. Rarezas

### 9.1 Lo que falta en pantalla

1. **El área no dice de quién es.** Ni el título, ni las migas, ni el título del documento muestran el nombre del asesorado (`T/entrenamiento.tsx:99-100`). Solo puede aparecer como autor de una corrección.
2. **El `Historial` del plan no se puede abrir.** Lista las versiones, sin enlaces (`T/plan.tsx:186-195`).
3. **La nota de cada serie no se ve en `Plan activo`.** Se escribe en el editor y se ve en Ejecuciones y en la APK, pero la tabla del plan activo no la trae (`T/plan.tsx:247-252`; `T/objetivos-por-serie.tsx:104-106`).
4. **La lista de revisiones no muestra el período, la evidencia, el autor ni la próxima fecha.**
5. **No hay reordenar, duplicar ni descartar borrador** (§5.5).
6. **Las listas traen solo la primera página.** Evaluaciones, historial del objetivo y versiones del plan se piden sin paginar; la API devuelve 20 (`T/resumen.tsx:66-72`; `API/http/paginacion.ts:9`). No hay «ver más».

### 9.2 Lo mismo, nombrado de dos maneras

7. **`Ejecuciones` / `Sesiones registradas` / `Abrir la ejecución` / `Registro original`.** Cuatro palabras para la sesión que registró el asesorado.
8. **`Lo que recibe tu asesorado` (plan activo) y `Así lo ve tu asesorado` (editor).** Es la misma tabla (`T/plan.tsx:248`; `T/objetivos-por-serie.tsx:116`).
9. **Una versión del plan se identifica de dos formas.** En Plan es `Versión 2`. En Ejecuciones y en la evidencia es `Activada el {fecha}` o `Plan activado el {fecha}`. No hay forma de cruzarlas salvo por la fecha.
10. **`Objetivo` significa tres cosas:** el objetivo del asesorado (Resumen), el objetivo de intensidad (`Objetivo (RIR)`) y el objetivo de una serie (`Sin objetivo en esta serie`).
11. **Tres títulos casi iguales en Ejecuciones** (§6.5).
12. **El rango se escribe de dos maneras en la misma pantalla.** `12–16 rep.` (raya, en `Plan de la serie`) y `12-16` (guion, en `Planificado` y en la `Tabla de valores`). Sale de dos funciones distintas (`D/copy-entrenamiento-por-serie.ts:180-183`; `D/presentacion-de-prescripcion.ts:20-23`). Se ve en la captura `08-…png`.
13. **`rep.` y `reps` conviven:** `14 rep.` en una tabla y `× 14 reps` en el registro original.
14. **El descanso se carga en segundos y se muestra en minutos:** se escribe `90`, se lee `01:30`. El editor lo aclara una sola vez: `Vacío: hereda 01:30 (90 s) de la prescripción.`
15. **`Nueva versión de objetivo` se llama así aunque no haya ninguno.**
16. **En el Resumen, la última revisión dice `Próxima acción:` aunque el resultado sea `Finalizar`.** En Revisiones dice `Cierre:` (`T/resumen.tsx:233`; `T/revisiones.tsx:355`).
17. **`Plantilla guardada. La encontrás en «Mis plantillas».`** No hay nada que se llame «Mis plantillas»: la página es `Plantillas y habituales` y la sección `Plantillas de entrenamiento` (`apps/web/src/app/pro/templates/page.tsx:17`; `…/mis-plantillas.tsx:69`).

### 9.3 Comportamientos que sorprenden

18. **`Última sesión registrada` mira solo los últimos 7 días.** Con sesiones de hace 10 días dice `Todavía no hay sesiones registradas en este período.` No hay control para cambiarlo.
19. **Cambiar el período con el formulario de revisión abierto borra lo escrito.** El filtro está fuera del formulario; al aplicar, la vista vuelve a cargar y el formulario se desmonta (`T/revisiones.tsx:49-50,71-72`; `T/entrenamiento.tsx:66-67`).
20. **`Ajustar` y `Sustituir` hacen lo mismo al aplicarse:** crean un borrador a partir de la versión activa (`D/revision.ts:69-70`; `API/entrenamiento/revisiones.service.ts:320-337`). Solo cambia el nombre.
21. **Con `Cambiar objetivo`, el formulario usa la evaluación más reciente sin preguntar** (`T/revisiones.tsx:188,208-211`). En el Resumen, en cambio, se elige.
22. **Las sesiones de Ejecuciones van de la más vieja a la más nueva.** Las revisiones, al revés.
23. **Cambiar de pestaña pierde lo que estaba abierto** (§1.2).
24. **`Guardar borrador` es el botón primario; `Activar plan` es secundario**, uno entre cuatro, al final de una página muy larga.
25. **La columna `RIR` aparece o no según el ejercicio.** Tablas contiguas tienen 4 o 5 columnas (se ve en `06-plan-activo.png`).
26. **Los tres enlaces del Resumen (`Ver plan`, `Ver ejecuciones`, `Ver revisiones`) repiten las pestañas** que están justo arriba.
27. **`Sin ejercicio asignado` se muestra siempre en la web, aunque sea `00:00`.** La APK lo oculta en ese caso (`M/pantallas/tiempos-de-la-sesion.tsx:79`).
28. **El grupo se llama `Descanso / parámetros (opcional)`, pero el descanso ya tiene su campo propio** más arriba. Es un nombre viejo (`D/copy-entrenamiento.ts:101`; `T/editor.tsx:813-814`).
29. **La imagen del ejercicio aparece solo si tiene una.** Los doce ejercicios sembrados no tienen; sin imagen no hay marcador en su lugar (`T/plan.tsx:239`; `T/editor.tsx:583`).
30. **A la ayuda del RIR le falta un punto.** Se lee `RIR = repeticiones en reserva Cada serie puede tener el suyo.`: son dos frases pegadas (`T/editor.tsx:611`).
31. **El `Historial` del plan tiene dos numeraciones que se cruzan.** Es una lista numerada automática (`<ol>`) y la API la trae de la más nueva a la más vieja (`API/http/paginacion.ts:83`). El renglón 1 es la versión más alta. En `06-plan-activo.png` se ve `1. Versión 1` porque hay una sola. Con varias, no se levantó la pantalla para verlo: sale del código (`T/plan.tsx:186-195`; `globals.css:912-915`).

### 9.4 Estados que se pueden dibujar pero casi no ocurren

32. **`Corregido por el profesional`.** La API lo permite, pero el website no tiene ningún control para corregir una ejecución (no hay ningún uso de `corregirEjecucion` en `apps/web`).
33. **`Sustituido`.** La APK de este worktree no tiene un control para sustituir un ejercicio: registra siempre con el planificado (`M/pantallas/entrenamiento.tsx:725-726`).
34. **`esfuerzo percibido`.** La APK de este worktree lo guarda siempre vacío (`M/series-de-la-sesion.ts:199`).
35. **`Registro resumido` / `Por ejercicio o sesión`.** La APK de este worktree registra solo por serie. El resumen aparece únicamente al corregir un «No pude realizarla» (`M/pantallas/entrenamiento.tsx:1336-1338`).
   - Para 33, 34 y 35: si hay datos así cargados con una APK anterior, no se puede determinar desde este worktree.

### 9.5 Código y textos sin uso

36. `A/tarjetas-de-dominio.tsx` (con `TarjetaDeEntrenamiento` y el enlace `Abrir Entrenamiento`) no lo importa nadie.
37. Textos definidos en `D/copy-entrenamiento.ts` que ninguna pantalla usa: `Agregar descanso`, `Registrada en borrador`, `Sustituir ejercicio`, `Confirmar sustitución`, `Revisar sesión`, `Confirmar sesión`, `Esfuerzo percibido (opcional)`, `+ Registrar serie`, `Pendiente`, `Cómo querés registrar`, `Últimos 90 días`, `No pudimos mostrar tu historial ahora. Volvé a intentar.` No conviene tomarlos como etiquetas vigentes.
38. `D/copy-plantillas.ts`: `Mis plantillas` y `Empezar en blanco` tampoco se usan.
39. El campo `corrections[]` del contexto de revisión llega y no se muestra.

### 9.6 Dos datos de contexto

40. **El editor y el plan usan las mismas cajas que Nutrición.** Las clases son `nodo--dia` (bloque), `nodo--opcion` (microciclo), `nodo--comida` (sesión) y `tarjeta-de-receta` (cabecera del ejercicio). El aspecto es el del editor de comidas.
41. **Dos piezas de esta área se usan también en la ficha:** el registro de una sesión y el plan en solo lectura (`A/seguimiento/registro-original.tsx:31-32`). Cambiar su diseño cambia las dos pantallas.

---

## Anexo · Textos plegados y de diálogos, completos

Están cerrados o fuera de la vista al entrar, pero son parte de la pantalla.

**Ejecuciones → `Qué entra en la comparación`** (`T/ejecuciones.tsx:148-151`)

- `Solo sesiones registradas: los borradores y las sesiones que todavía no ocurrieron no aparecen.`
- Condicional (hay ejercicios con el mismo nombre): `Hay ejercicios con el mismo nombre que no se pueden identificar como el mismo (otro ejercicio del catálogo, o una versión registrada por sustitución que no está prescripta en el período): se listan por separado.`

**Ejecuciones → evolución → `Cómo se lee`** (`T/comparacion.tsx:767-774`)

- `Cada punto es una sesión registrada en la que aparece el ejercicio, en el orden en que ocurrió; la distancia entre puntos no es proporcional al tiempo. Se compara la serie del número elegido: las series no se promedian ni se suman.`
- `Cada sesión se compara con la prescripción de la versión del plan que rigió ese día, no con la vigente hoy.`
- `Las líneas se cortan donde no hay dato. Lo planificado, además, se corta cuando cambia la prescripción: otra versión del plan u otra sesión.`
- Con la variable carga: `La carga sugerida es un complemento de la prescripción, no una obligación.` y `Un % RM no se convierte a kg: no hay una base registrada para hacerlo.`
- Con la variable RIR: `El RIR planificado es el objetivo de la prescripción y rige para todas sus series.`
- `La tabla muestra siempre las dos capas, con los mismos valores del gráfico.`

**Ejecuciones → por serie → `Cómo se lee`** (`T/comparacion.tsx:510-515`)

- `Sin dato no es cero ni «no realizada»: no hay registro de esa serie.`
- `Una serie que falta no se puede declarar como no realizada: se muestra sin dato.`
- Las mismas frases de carga y de RIR de arriba, según la variable.
- `La tabla muestra siempre las dos capas, con los mismos valores del gráfico.`

**Ejecuciones → `Qué dice cada tiempo`** (`T/series-y-tiempos.tsx:139-148`; `D/copy-entrenamiento-por-serie.ts:96-111`)

- `Son tiempos marcados en la app: incluyen descansos y carga de datos. No son minutos de esfuerzo ni una evaluación.`
- `medido`: `Inicio y fin marcados en la app, en el mismo uso, con su reloj interno.`
- `estimado`: `Reconstruido con el reloj del teléfono, por ejemplo después de cerrar y abrir la app, o declarado al resolver una medición abierta.`
- `incompleto`: `Tiene inicio pero no un fin confiable. No se completa con la hora de reapertura.`
- `no informado`: `No se marcó.`
- `inconsistente`: `Los instantes no son coherentes entre sí (el fin queda antes del inicio).`

**Ejecuciones → panel de valores, notas condicionales** (`T/comparacion.tsx:251-263`)

- `Se registró otro ejercicio en lugar de este: lo registrado no es de este ejercicio.`
- `Este ejercicio se registró en lugar de otro: lo planificado era de otro ejercicio.`
- `Se registró una versión del catálogo que las sesiones del período no permiten identificar: no se sabe si es este ejercicio, y no se compara.`
- `Esta versión se registró en lugar de lo planificado, y las sesiones del período no permiten saber si es el mismo ejercicio: no se compara.`
- Fila `Ejercicio registrado`: `{nombre}: otra versión del mismo ejercicio del catálogo` · `{nombre}: otro ejercicio` · `{nombre}: otra versión del catálogo; no se puede saber si es el mismo ejercicio`.
- Fila `En el registro original`: los valores de la serie, o `No estaba en el registro original`.

**Plan → diálogo `Guardar como plantilla`** (`T/plantillas.tsx:89-119`; `D/copy-plantillas.ts`)

- Casilla `Conservar las cargas sugeridas como referencia de la plantilla` y su nota `Apagado, las cargas no se copian: son de cada persona. Encendido, quedan en la plantilla como referencia y las revisás al aplicarla.`
- Título `Notas que se van a copiar`. Con notas: `Revisá que ninguna nombre a una persona ni describa su situación. Podés vaciarlas una por una.` y, por nota, `{dónde está}: «{texto}»` + `Vaciar`. Sin notas: `Esta versión no tiene notas de texto libre.`
- Ayuda `Qué se copia y quién lo ve`: `La plantilla copia la estructura (bloques, sesiones, ejercicios, series, intensidad y parámetros), no a la persona: no lleva objetivo ni próxima revisión.` y `Solo vos ves y aplicás tus plantillas. Si dejás BE, quedan inactivas; los planes ya creados no dependen de ellas.`

**Plan → diálogo `Guardar como habitual`** (`T/habituales.tsx:202-236`; `D/copy-habituales.ts`)

- Casilla `Conservar las cargas sugeridas como referencia` y su nota `Apagado, las cargas no se copian: son de cada persona. Encendido, quedan en la sesión habitual como referencia y las revisás al agregarla.`
- Título `Notas que se van a copiar`. Con notas: `Revisá que ninguna nombre a una persona ni describa su situación. Podés vaciarlas una por una.` Sin notas: `No tiene notas de texto libre.`
- Ayuda `Qué se copia y quién lo ve`: `La sesión habitual copia los ejercicios, las series, la intensidad y los parámetros, no a la persona. Al agregarla a un borrador pasa a ser de ese plan.` y `Solo vos ves tus habituales. Lo que agregás a un borrador queda en ese plan y no cambia si después editás el habitual.`

**Plan → buscador → `Importar desde wger`** (`T/importacion.tsx:134-232`; `D/copy-integraciones.ts`)

- Campo `Número del ejercicio en wger`, ayuda `Figura en la dirección de cada ejercicio en wger.de, por ejemplo «/exercise/56/».` Botón `Consultar` (`Consultando…`).
- Título `Candidato para revisar`. Ayuda `Qué es un candidato`: `Esto es lo que respondió el proveedor. Todavía no está en el catálogo BE: revisalo, corregí o completá lo que haga falta, y decidí si lo incorporás.`
- Nota de procedencia: `Fuente: wger · ejercicio {número} · Recibido el {día} · Licencia: {licencia} ({autoría}) · Si no lo resolvés, vence el {día}`.
- Condicional: `wger no tiene este ejercicio en español: el nombre está en inglés, y podés corregirlo antes de incorporarlo.`
- Campo `Nombre del ejercicio` (pasa a `Nombre del ejercicio · Corregido` si se cambia), ayuda `Dato del proveedor: {nombre original}`.
- Datos del proveedor: `Categoría según wger`, `Músculos según wger (dato del proveedor; no se copian como zonas BE)`, `Material según wger`.
- Campo `Fundamento de la decisión (opcional)`. Botones `Importar a BE` y `Rechazar`.
- Nota `Dato de un proveedor externo, revisado por un profesional: no es un dato verificado por BE.`
- Otros avisos: `Faltan datos para incorporarlo. Completá los campos marcados o rechazalo.` · `Falta el nombre del ejercicio.` · `El nombre puede tener hasta 120 caracteres: acortalo antes de incorporarlo.` · `Este candidato ya no se puede resolver: ya se resolvió o venció. Si lo incorporaste, buscalo en el catálogo BE; si no, consultá el proveedor de nuevo.`

## Anexo · Lo que no se pudo determinar

- Qué datos tiene hoy la base de prueba (qué plan está activo, cuántas sesiones hay).
- Nombres visibles de asesorados y profesionales.
- Cómo dibuja cada navegador las fechas; lo citado sale de las capturas del repositorio.
- Si existen sesiones con sustitución, esfuerzo percibido o registro resumido cargadas con APK anteriores.
- Qué mensaje ve el profesional si pasa los topes del contrato (20 series, 40 ejercicios…): la pantalla no los controla antes de guardar.
- Cómo se ve el área en vivo en este commit: no se levantó la aplicación. Las capturas citadas son del 2026-10-06.

## Anexo · Archivos leídos

- **Área (completos):** `T/page.tsx`, `entrenamiento.tsx`, `resumen.tsx`, `plan.tsx`, `ejecuciones.tsx`, `comparacion.tsx`, `revisiones.tsx`, `objetivos-por-serie.tsx`, `series-y-tiempos.tsx`, `plantillas.tsx`, `habituales.tsx`, `importacion.tsx`, `editor.tsx`, `contexto-citable.ts`.
- **Compartidos de la web:** `A/workspace.tsx`, `A/retorno-y-preparacion.tsx`, `A/periodo.tsx`, `A/evidencia-de-revision.tsx`, `A/evidencia.ts`, `A/tarjetas-de-dominio.tsx`; `C/estados.tsx`, `pestanas.tsx`, `migas.tsx`, `ayuda.tsx`, `formulario.tsx`, `dialogo.tsx`, `encabezado.tsx`, `navegacion.tsx`, `apariencia.tsx`; `apps/web/src/lib/formato.ts`, `intento.ts`, `graficos.ts`; `apps/web/src/app/pro/espacio-profesional.tsx`; `apps/web/src/app/pro/exercises/imagen-de-ejercicio.tsx`; partes de `globals.css` y de `A/seguimiento/`.
- **Dominio:** `copy-entrenamiento.ts`, `copy-entrenamiento-por-serie.ts`, `copy-plantillas.ts`, `copy-habituales.ts`, `copy.ts`, `copy-integraciones.ts`, partes de `copy-nutricion.ts`, `copy-vinculo.ts` y `copy-formularios.ts`; `contratos-entrenamiento.ts`, `contratos-entrenamiento-por-serie.ts`, partes de `contratos-nutricion.ts`, `contratos-procedencia-externa.ts`; `comparacion-de-entrenamiento.ts`, `plan-de-entrenamiento.ts`, `objetivos-por-serie.ts`, `presentacion-de-prescripcion.ts`, `relacion-con-el-objetivo.ts`, `tiempos-de-entrenamiento.ts`, `entrenamiento.ts`, `compatibilidad-de-clientes.ts`, `formato-numeros.ts`, `revision.ts` (parte), `formularios.ts` (parte), `cliente-http.ts` (parte).
- **API (solo para aclarar comportamientos):** `entrenamiento/revisiones.service.ts`, `entrenamiento/catalogo.service.ts`, `http/paginacion.ts`, partes de `entrenamiento/planes.service.ts`, `ejecuciones.service.ts` y `lectura-entrenamiento.ts`.
- **APK:** los listados en §7.
- **Datos de ejemplo:** los listados en §8.
