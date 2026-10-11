# Inventario de la interfaz actual: «Información» (formularios), ficha del asesorado y Nutrición (Resumen, Revisiones y piezas del Plan)

Inventario de lo que hoy dibuja el website profesional para un asesorado, leído del código. No se ejecutó ni se modificó nada.

- **Fuente:** `C:\Users\bufim\BE-Best-entrenamiento` · rama `wp-dashboard-comprension` · commit `ab90860` · árbol limpio.
- **Citas:** rutas relativas a esa carpeta, con `archivo:línea`. Abreviaturas:
  - `W/` = `apps/web/src/app/pro/advisees/`
  - `C/` = `apps/web/src/components/`
  - `D/` = `packages/domain/src/`
  - `M/` = `apps/mobile/src/`
  - `API/` = `apps/api/src/`
- **Textos:** lo que va entre «» es literal del código, con sus tildes. `{…}` es un dato variable.
- **Capturas:** donde dice «captura» es una imagen que ya está en el repo (`EVIDENCIA/…`). Las de `DASHBOARD-COMPRENSION/despues/` son de la compilación `269d930` de esta misma rama (`EVIDENCIA/DASHBOARD-COMPRENSION/LEEME.md`, «Cómo se produjo»). Las de `WP-07`, `HABITUALES` y `PLANTILLAS` son anteriores (22/9 y 30/9): sirven para el contenido, no para el marco de la página.
- **Lo deducido** (comportamiento que sale de leer el código, sin verlo andar) está marcado como «deducido». **Lo que no se pudo determinar** está marcado en el lugar y reunido en la parte D.

## Índice

- 0. Lo que comparten las tres partes
- A. «Información»: los formularios
- B. La ficha del asesorado y cómo se pasa de un área a otra
- C. Nutrición: Resumen, Revisiones y las piezas del Plan (crear alimento, importar, habituales, plantillas)
- D. Lo que no se pudo determinar
- E. Diez hechos que conviene tener presentes al dibujar

---

## 0. Lo que comparten las tres partes

### 0.1 Marco de la página

De arriba hacia abajo, en toda página bajo `/pro/advisees…`:

1. **Encabezado del sitio** (`C/encabezado.tsx:11-28`). Siempre visible.
   - «Saltar al contenido»: enlace invisible hasta que recibe el foco del teclado (`apps/web/src/app/globals.css:86-102`).
   - Marca: isotipo y «BE», enlace a `/` (nombre accesible «BE, ir al inicio»).
   - Navegación profesional, 5 enlaces (`C/navegacion.tsx:19-25`): «Espacio profesional» (`/pro`), «Plantillas y habituales» (`/pro/templates`), «Mis recetas» (`/pro/recipes`), «Mis ejercicios» (`/pro/exercises`), «Cuenta» (`/account`). En todas las páginas del asesorado queda resaltado «Espacio profesional» (`C/navegacion.tsx:38-40,49`).
   - «Apariencia»: select con «Azul noche» (predeterminado) y «Claro» (`C/apariencia.tsx:27-43`; `apps/web/src/lib/apariencia.ts:10-15`).
   - Texto fijo a la derecha: «Ambiente de prueba · solo datos sintéticos».
2. **Contenido.** Ancho máximo 76rem en las páginas de área y 100rem en la ficha (`globals.css:331-339`).
3. **No hay pie de página** en `/pro` (el `Pie` solo se usa en las páginas públicas: `apps/web/src/app/page.tsx:120`, `login`, `register`, `legal`).

### 0.2 Piezas que se repiten

| Pieza | Qué es | Fuente |
|---|---|---|
| Migas | «Espacio profesional» › «Ficha del asesorado» › {área}. El último paso es la página actual, sin enlace. Separador «›» | `C/migas.tsx:8-26`; `globals.css:802-806` |
| Pestañas | Enlaces en una línea, la actual con `aria-current="page"`. Cambiar de pestaña **reemplaza** la entrada del historial: «Atrás» del navegador vuelve a la página anterior, no a la pestaña anterior | `C/pestanas.tsx:15-41` (`replace` en la línea 33) |
| Aviso | Caja de tipo `info`, `error` o `exito` | `C/formulario.tsx:74-84` |
| Aviso flotante | El éxito de una acción, fijo abajo de la pantalla, con botón «×» (nombre accesible «Cerrar aviso»). Se va solo a los 6 segundos o más, salvo que traiga un enlace o un botón (entonces se queda hasta cerrarlo) | `C/ayuda.tsx:23-67` |
| Ayuda | Explicación plegada (`<details>`); título por defecto «Cómo se lee» | `C/ayuda.tsx:14-21` |
| Diálogo de confirmación | `<dialog>` modal con título, contenido, y dos botones: volver (secundario) y confirmar (primario) | `C/dialogo.tsx:27-84` |
| Filtro de período | «Desde» y «Hasta» (fechas) y botón «Ver período» | `W/periodo.tsx:24-47` |

### 0.3 Estados comunes (textos literales)

| Situación | Texto | Fuente |
|---|---|---|
| Sin sesión | «Redirigiendo a Iniciar sesión…» | `W/forms/formularios.tsx:89`; `W/workspace.tsx:133`; `W/nutrition/nutricion.tsx:94` |
| Cargando | «Cargando…» | `C/estados.tsx:14-20` |
| Error de lectura | «No pudimos cargar esta vista.» y el botón-enlace «Reintentar» | `C/estados.tsx:33-44`; `D/copy.ts:37-38` |
| 404 del profesional (inexistente, ajeno, sin acceso, revocado: todo igual) | «No encontramos un recurso disponible para esta acción.» y el enlace «Volver» (lleva a `/pro`) | `D/copy-vinculo.ts:134,56`; `W/nutrition/nutricion.tsx:56-65`; `W/forms/formularios.tsx:57-66` |
| La cuenta no tiene espacio profesional | «No encontramos un recurso disponible para esta acción.» y el enlace «Ir a tu cuenta» | `apps/web/src/app/pro/espacio-profesional.tsx:56-65` |

**Fallos al guardar** (`apps/web/src/lib/intento.ts:44-63`), el mismo criterio en todos los formularios de este inventario:

| Caso | Texto |
|---|---|
| No se sabe si se guardó (sin respuesta) | «No pudimos confirmar el resultado. Reintentá.» |
| Conflicto de versión o de estado | «Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.» |
| 404 | «No pudimos abrir este contenido.» |
| Cualquier otro rechazo, **incluidas las validaciones de la API que la pantalla no traduce** | «El servicio no está disponible en este momento. Probá de nuevo más tarde.» |

### 0.4 Formato de fechas y números

- Fecha con hora: «19 sept 2026, 11:00 a. m.». Solo fecha: «12 jul 2026». Hora de la consulta: «10:32:57 a. m.». (Formateadores en `apps/web/src/lib/formato.ts:2-14` y `W/workspace.tsx:44`; el resultado exacto está tomado de las capturas `EVIDENCIA/DASHBOARD-COMPRENSION/despues/resumen-1440-claro.png` y `revision-nutricion-1440-claro.png`.)
- Números mostrados: coma decimal y punto de miles («1.950 kcal», «72,5 kg») (`D/formato-numeros.ts:1-55`).
- Números escritos en un campo: se aceptan con coma o con punto. «1.850» se rechaza por ambiguo. Avisos: «Escribilo sin punto de miles («1850») o, si es decimal, con coma («1,85»).» y «Escribí un número: «150» o «72,5».» (`D/formato-numeros.ts:67-85`).

### 0.5 Cómo se llaman las personas en pantalla

- **El asesorado no tiene nombre para el profesional.** Se muestra un seudónimo armado con los últimos seis caracteres de su identificador: «Asesorado · 84c841» (`API/vinculo/lectura.ts:36-39`; es lo que devuelve la ficha: `API/dashboard/dashboard.controller.ts:60`).
- El profesional se muestra con su nombre visible («Lic. Sofía Paz (sintética)» en los datos de demostración) o, si no lo tiene, «Profesional» (`API/vinculo/lectura.ts:32-34`).

---

## A. «Información»: los formularios

Archivos: `W/forms/page.tsx`, `W/forms/formularios.tsx`, `W/forms/pedir.tsx`, `D/copy-formularios.ts`, `D/contratos-formularios.ts`, `D/formularios.ts`. El catálogo de formularios no está en el código de la web: lo siembran dos migraciones (`prisma/migrations/20260921220000_formularios_de_informacion_profesional/migration.sql:276-296` y `prisma/migrations/20260928000000_plantilla_de_entrenamiento/migration.sql:10-21`).

### A.1 Navegación

- **Ruta:** `/pro/advisees/forms?id={id del asesorado}&vista={solicitudes|pedir}` (`W/forms/page.tsx:10`). Título de la pestaña del navegador: «Información · BE» (`W/forms/page.tsx:7`).
- **Componente de entrada:** `PaginaDeFormularios` → `Formularios` (`W/forms/page.tsx:13-24`; `W/forms/formularios.tsx:75`).
- **Sub-pestañas, en orden** (`W/forms/formularios.tsx:30-33,99`; el grupo se llama «Secciones de Información» para el lector de pantalla):
  1. «Solicitudes» (`vista=solicitudes`). **Es la que abre por defecto**: cualquier valor desconocido o ausente de `vista` cae acá (`W/forms/formularios.tsx:79`).
  2. «Pedir información» (`vista=pedir`).
- **Otros parámetros de la URL:** `volver` (de dónde se vino; ver A.9) y `plantilla=FRM-ENTRENAMIENTO` (precarga; `W/forms/pedir.tsx:50-51`).
- **Cómo se llega.** Son los únicos cuatro enlaces a esta página en todo el website:

| Desde | Control | Abre | Fuente |
|---|---|---|---|
| Ficha · Resumen · bloque «Acciones» | «Solicitar contexto» | «Pedir información», sin nada elegido | `W/seguimiento/resumen.tsx:540-545` |
| Ficha · Analizar · bloque «La información disponible del … al …» | «Solicitar contexto» | Lo mismo | `W/seguimiento/informacion.tsx:166-170` |
| Entrenamiento · Resumen | «Solicitar contexto» | «Pedir información» con el formulario «Antecedentes para entrenamiento» ya armado | `W/training/resumen.tsx:179-181` |
| Espacio profesional · «Pendientes», fila «Formulario sin responder desde el {día}» | «Abrir» | «Solicitudes» | `apps/web/src/app/pro/pendientes.tsx:49-53`; `D/cartera.ts:96` |

- **No hay enlace a «Información»** en el encabezado de la ficha, ni en Nutrición, ni en Antropometría. El comentario del código la llama «pestaña Información del workspace» (`W/forms/page.tsx:10`), pero no existe una barra que la muestre al lado de las otras áreas.

### A.2 Cada bloque, en orden de aparición

#### Cabecera de la página (`W/forms/formularios.tsx:94-113`)

| # | Elemento | Texto | Visible |
|---|---|---|---|
| 1 | Migas | «Espacio profesional» › «Ficha del asesorado» › «Información» | Siempre |
| 2 | Título | «Información» | Siempre |
| 3 | Enlace de retorno | «Volver a la ficha, donde estabas» | Condicional: solo si la URL trae `volver` (`W/retorno-y-preparacion.tsx:25-42`) |
| 4 | Pestañas | «Solicitudes» · «Pedir información» | Siempre |
| 5 | Aviso flotante | «Solicitud enviada.» y, si hay retorno, el enlace «Volver a la ficha, donde estabas» | Condicional: después de enviar una solicitud |

#### Vista «Solicitudes» (`W/forms/formularios.tsx:118-250`)

1. **Título:** «Solicitudes» (repite el nombre de la pestaña). Siempre.
2. **Lista** de las solicitudes que este profesional le hizo a esta persona, la más reciente primero (`API/formularios/solicitudes.service.ts:162-172`; `API/http/paginacion.ts:83`). Cada fila muestra:
   - **Nombre del formulario** en negrita, y al lado una insignia con el estado: «Respondida» o «Sin responder». Son los dos únicos estados (`D/contratos-formularios.ts:110`).
   - Una línea chica: «Pedido el {fecha con hora} · {para qué lo pidió}».
   - Botón «Ver detalle», que pasa a decir «Cerrar» cuando el detalle está abierto. Solo una fila puede estar abierta a la vez (`W/forms/formularios.tsx:121,150-153`).
3. **Detalle** dentro de la fila. Condicional: fila abierta.
   - Línea chica: «Campos: {campo 1} · {campo 2} · …» (los campos que se pidieron, con su nombre legible).
   - Si no hay respuesta: «Todavía sin responder. No responder también es una opción.»
   - Si hay respuesta:
     - Aviso: «Esta información la declaró el asesorado. No es una medición ni un diagnóstico.»
     - Bloque «Respuesta original», con la insignia «Vigente» si no hay una corrección vigente. Debajo: «Respondido el {fecha con hora}». Después, una fila por campo: nombre del campo, el valor, y la insignia «Declarado por la persona» (una por cada campo).
     - Un bloque «Corrección» por cada corrección que hizo el asesorado, con «Vigente» en la que rige. Debajo: «{fecha con hora} · {motivo que escribió el asesorado}» y las mismas filas por campo.
   - Cómo se escribe un valor: un Sí/No se muestra «Sí» o «No»; todo lo demás, tal cual llegó (`W/forms/formularios.tsx:243-244`).

Corroborado en la captura `EVIDENCIA/WP-07/web/web-09-original-y-correccion.png` (contenido igual; el marco de esa captura es anterior).

#### Vista «Pedir información» (`W/forms/pedir.tsx:133-247`)

En este orden:

1. **Aviso de error.** Condicional: después de un envío rechazado. Textos en A.3.
2. **Aviso de llegada desde Entrenamiento.** Condicional: URL con `volver=entrenamiento`. Texto: «Viniste desde Entrenamiento: el formulario, los campos y el alcance ya están elegidos. Podés cambiarlos antes de enviar.» y el enlace «Volver a Entrenamiento».
3. **Aviso fijo.** Siempre: «Pedir información no amplía tu acceso ni el consentimiento: hasta que el asesorado responda, no hay dato nuevo.»
4. **Sección «Formularios disponibles».** Siempre.
   - Línea chica: «Catálogo de demostración: no es un catálogo clínico.»
   - Una fila por formulario: nombre en negrita, una línea chica con su descripción, y el botón «Elegir». El del formulario elegido dice «Elegido».
5. **Sección con el nombre del formulario elegido.** Condicional: hay un formulario elegido.
   - «Elegí qué campos pedir»
   - Línea chica: «Un campo requerido igual puede quedar sin responder: el asesorado decide.»
   - Un recuadro por sección del formulario, con el título de la sección. Adentro, por cada pregunta:
     - Casilla con el texto de la pregunta. **Ninguna viene marcada.**
     - Si la pregunta tiene ayuda, una línea chica con esa ayuda.
     - Si la casilla está marcada, aparece una segunda casilla: «Requerido: {texto de la pregunta}» (repite la pregunta entera).
   - Campo de texto «Para qué lo necesitás», con la ayuda «Queda registrado y el asesorado lo ve. Explicá para qué vas a usar esta información.». Hasta 300 caracteres.
   - Select «Alcance». Con un formulario de un solo área trae una única opción y la ayuda «Esta plantilla es de un solo Alcance: la solicitud va con ese.». Con un formulario transversal trae «Nutrición», «Entrenamiento» y «Antropometría», y **viene elegido «Entrenamiento»** (`W/forms/pedir.tsx:44,225-235`).
   - Botón «Enviar solicitud». Deshabilitado mientras «Para qué lo necesitás» esté vacío.

Corroborado en la captura `EVIDENCIA/WP-07/web/web-05-pedido-armado.png`.

#### El catálogo: qué formularios existen

Tres formularios. Los textos son los que se muestran, tal cual.

**1. «Antecedentes para entrenamiento»** (clave `FRM-ENTRENAMIENTO`; solo del área Entrenamiento)
- Descripción que se ve en la lista: «Contexto que la persona declara para planificar su entrenamiento: qué busca, su experiencia, cuánto tiempo tiene, dónde entrena y qué prefiere (CAND-10-TRN-A)»
- Una sección, «Antecedentes para entrenamiento», con seis preguntas:

| Pregunta | Tipo | Unidad | Ayuda |
|---|---|---|---|
| «Qué te gustaría poder hacer o mejorar con el entrenamiento» | Texto | — | «Contalo con tus palabras: es lo que buscás, no un objetivo fijado por tu profesional» |
| «Qué actividad venís haciendo y desde hace cuánto» | Texto | — | «Por ejemplo: gimnasio 2 veces por semana desde hace un año, o nada en los últimos meses» |
| «Cuántos días por semana podrías reservar de manera realista» | Número (entero de 1 a 7) | «días por semana» | «Un número entero entre 1 y 7» |
| «Cuánto tiempo podrías dedicar a cada sesión» | Número (entero de 1 a 600) | «min» | «En minutos: un número entero entre 1 y 600» |
| «Dónde entrenarías y con qué equipamiento contás» | Texto | — | «Por ejemplo: en casa con mancuernas y una banda elástica, o en un gimnasio completo. No hace falta la dirección» |
| «Qué actividades disfrutás y cuáles preferís evitar» | Texto | — | (sin ayuda) |

**2. «Hábitos y contexto»** (clave `FRM-HABITOS`; transversal a las tres áreas)
- Descripción: «Hábitos, rutina y contexto personal relevante para acompañar el proceso»
- Una sección, «Rutina y hábitos», con tres preguntas: «Horas de sueño habituales» (número, unidad «h»), «Nivel de actividad física habitual» (texto), «Fuma actualmente» (Sí/No). Ninguna tiene ayuda.

**3. «Antecedentes de salud declarados»** (clave `FRM-SALUD`; transversal)
- Descripción: «Antecedentes de salud, dolor/lesiones y medicación con relevancia directa para la práctica (08:201-204)»
- Una sección, «Condiciones y antecedentes», con tres preguntas de texto: «Condiciones de salud declaradas» (ayuda: «Diabetes, hipertensión, asma u otra condición relevante para la práctica»), «Dolor o lesiones actuales», «Medicación con relevancia para la práctica».

Orden en pantalla: el de la lista de arriba (deducido: la API ordena por fecha de alta descendente y, a igualdad, por identificador; `API/formularios/plantillas.service.ts:36-41`). La captura del 22/9, con dos formularios, muestra «Hábitos y contexto» antes que «Antecedentes de salud declarados», que coincide.

Tipos de pregunta posibles: texto, número y Sí/No. No hay opción múltiple (`D/contratos-formularios.ts:29-30`).

#### Qué se precarga al llegar desde Entrenamiento

Con `plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento` (`W/forms/pedir.tsx:80-97`; `D/formularios.ts:95-99`):
- Queda elegido «Antecedentes para entrenamiento», con las seis preguntas marcadas.
- Cinco quedan marcadas como requeridas: todas menos «Qué actividades disfrutás y cuáles preferís evitar».
- «Para qué lo necesitás» viene escrito: «Planificar tu entrenamiento».
- Alcance: «Entrenamiento».
- Al enviar, vuelve solo a Entrenamiento (`W/forms/pedir.tsx:129`).

### A.3 Estados

| Dónde | Situación | Texto |
|---|---|---|
| Página | Sin sesión, cargando, error, 404, sin espacio profesional | Los de 0.3 |
| Solicitudes | Sin solicitudes | «Todavía no le pediste información a esta persona.» |
| Detalle | Sin respuesta | «Todavía sin responder. No responder también es una opción.» |
| Detalle | La solicitud dejó de ser visible (perdió el acceso a esa área) | El 404 de 0.3, dentro de la fila |
| Pedir | Catálogo vacío | «Todavía no hay formularios disponibles.» |
| Pedir | Se envía sin marcar ningún campo | «Elegí al menos un campo para pedir.» |
| Pedir | La API dice que el formulario no se puede pedir así | «Esta plantilla no se puede pedir así: es de otro Alcance o hay una versión más nueva. Volvé a elegirla y revisá el Alcance.» |
| Pedir | Campo no pertinente para el alcance | «Alguno de los campos pedidos no es pertinente para este Alcance. Revisá los campos o el Alcance.» |
| Pedir | Requeridos fuera de los pedidos | «Revisá los campos pedidos: los requeridos tienen que estar entre los pedidos.» |
| Pedir | El profesional no tiene acceso a esa persona en el alcance elegido | «No pudimos abrir este contenido.» |
| Pedir | Otro rechazo | «El servicio no está disponible en este momento. Probá de nuevo más tarde.» |
| Cabecera | Envío correcto | «Solicitud enviada.» (aviso flotante) |

Fuentes: `W/forms/formularios.tsx:68-73,140,194`; `W/forms/pedir.tsx:31-35,105,123,159`; `D/copy-formularios.ts:25,31,39-44,47,54`.

No hay estado de solo lectura ni de acceso parcial propios de esta pantalla (ver A.5).

### A.4 Datos que llegan a la pantalla

**Solicitud** (`D/contratos-formularios.ts:140-155`):

| Campo | Qué es | ¿Se muestra? |
|---|---|---|
| `templateName` | Nombre del formulario | Sí |
| `status` | `PENDING` o `RESPONDED` | Sí, como «Sin responder» o «Respondida» |
| `createdAt` | Cuándo se pidió | Sí |
| `purpose` | Para qué (texto libre, hasta 300) | Sí |
| `requestedFieldCodes` | Campos pedidos | Sí, en el detalle, con su nombre legible |
| `requiredFieldCodes` | Campos marcados como requeridos | **No** |
| `scope` | Área (Nutrición, Entrenamiento o Antropometría) | **No** |
| `professional`, `advisee` | Nombres visibles | **No** |
| `templateId`, `templateVersionId`, `relationshipId`, `formRequestId` | Identificadores | No |

**Respuesta** (`D/contratos-formularios.ts:170-179,263-293`): `submittedAt` (se muestra); por cada campo, `value` (texto, número o Sí/No) y `unit` (opcional); por cada corrección, `recordedAt`, `reason` (motivo, obligatorio para el asesorado) y sus valores; `effectiveView` (cuál rige: la original o una corrección).

**Formulario del catálogo** (`D/contratos-formularios.ts:50-102`): `name` y `purpose` (se muestran); `domain` (área, o vacío si es transversal: solo se nota en el select de Alcance); secciones con `title`; preguntas con `label` y `helpText` (se muestran), y `dataType`, `unit`, `category` (**no se muestran al armar el pedido**: el profesional no ve si una pregunta es de texto, número o Sí/No, ni su unidad).

### A.5 Reglas visibles

**Lo que hace el profesional:** ve el catálogo, arma un pedido eligiendo preguntas una por una, lo envía, y ve sus propios pedidos y lo que respondió la persona.

**Lo que el profesional no puede hacer** (no hay control ni operación):
- Cancelar, editar, reenviar o recordar una solicitud. Una solicitud solo pasa de «Sin responder» a «Respondida», sin vuelta (`D/formularios.ts:5-7,36-44`).
- Crear o editar formularios: el catálogo es fijo (`D/contratos-formularios.ts:8`).
- Responder o corregir por el asesorado.
- Filtrar la lista por estado o buscar en ella. No hay ningún filtro.

**Lo que hace el asesorado** (desde la APK): responde una vez, puede corregir después agregando una corrección con su motivo (la original se conserva), o puede no responder nunca.

**Reglas que conviene conocer:**
- «Requerido» no obliga a responder la solicitud, pero **sí impide enviarla incompleta**: si el asesorado decide responder, tiene que completar los requeridos. La APK avisa «Falta responder un campo marcado como requerido por el profesional.» y la API lo rechaza (`M/pantallas/formularios.tsx:233-234`; `API/formularios/respuestas.service.ts:204-206`). El texto de la web («Un campo requerido igual puede quedar sin responder: el asesorado decide.») solo es cierto para la solicitud entera.
- Un formulario de un solo área se pide solo en esa área (`API/formularios/solicitudes.service.ts:81-86`).
- No hay confirmación antes de enviar. «Enviar solicitud» envía directamente.
- **Acceso por área.** La lista de «Solicitudes» trae solo las de áreas a las que el profesional tiene acceso hoy; las otras desaparecen sin aviso (`API/formularios/solicitudes.service.ts:173-177`). En «Pedir información» el catálogo y las tres áreas del select se ofrecen siempre, aunque el profesional no tenga esa área con la persona: recién al enviar aparece «No pudimos abrir este contenido.» (`W/forms/pedir.tsx:13-15`).

### A.6 Cuánto hay en pantalla

Cómo conté: elementos con los que se puede interactuar (enlaces, botones, casillas, campos, selects) dibujados a la vez, leyendo el JSX. El marco suma siempre 9: 7 del encabezado (marca, 5 de navegación, select de apariencia) y 2 enlaces de las migas.

| Estado | Controles de la vista | Con el marco |
|---|---|---|
| «Solicitudes» con 4 solicitudes, un detalle abierto | 2 pestañas + 4 botones = 6 (7 con el enlace de retorno) | 15-16 |
| «Pedir información», sin elegir | 2 pestañas + 3 «Elegir» = 5 | 14 |
| «Pedir información», «Antecedentes de salud declarados» con 2 de 3 preguntas marcadas | 2 + 3 + 3 casillas + 2 «Requerido» + texto + select + botón = 13 | 22 |
| «Pedir información», «Antecedentes para entrenamiento» con las 6 marcadas (el caso que llega desde Entrenamiento) | 2 + 3 + 6 casillas + 6 «Requerido» + texto + select + botón = 20 | 29 |

**Bloque más denso:** «Elegí qué campos pedir». Cada pregunta marcada ocupa hasta cuatro renglones: la casilla con la pregunta, su ayuda, y la casilla «Requerido: …» que repite la pregunta completa. Con «Antecedentes para entrenamiento» son 12 casillas y el texto de cada pregunta aparece dos veces.

En cuanto a texto fijo, «Pedir información» muestra antes del primer control: un aviso (dos si se llega desde Entrenamiento), la nota del catálogo y tres descripciones de formulario, dos de ellas con una referencia interna entre paréntesis (ver A.9).

### A.7 Cómo lo nombra la APK

Archivos consultados: `M/navegacion.ts`, `M/pantallas/formularios.tsx`, `M/pantallas/inicio-informacion.tsx`, `M/lecturas-de-inicio.ts`, `D/copy-formularios.ts`.

**Nombres en la APK:**
- Zona de la barra inferior: «Información» (`M/navegacion.ts:105`). Título de la pantalla: «Información» (`M/pantallas/formularios.tsx:73`). Volver: «Volver a Información» (`M/navegacion.ts:348-349`).
- Tarjeta en Inicio: título «Para responder»; «{n} solicitud sin responder.» o «{n} solicitudes sin responder.»; con más de tres: «Tenés más de 3 solicitudes sin responder. Acá ves las 3 más recientes.»; enlace «Ir a Información» (`M/pantallas/inicio-informacion.tsx:33-37,51,54`; `M/lecturas-de-inicio.ts:153`).
- Lista: frase de entrada «Podés no responder. No pasa nada si dejás esta solicitud sin completar.»; vacío: «No tenés información pendiente de completar.»; por tarjeta: nombre del formulario, insignia «Respondida» o «Sin responder», «Pedido por {profesional} · {fecha}», el para qué, y el botón «Completar» o «Ver mi respuesta», o el texto «Esta solicitud ya no se puede responder.» (`M/pantallas/formularios.tsx:75-99`).
- Pantalla de una solicitud: título = nombre del formulario; «Pedido por {profesional} · {para qué}»; sección «Responder» o «Corregir mi respuesta»; «Lo que respondas queda registrado como declarado por vos.»; cada pregunta no requerida lleva « (Opcional)»; ayuda por defecto «Podés dejarlo en blanco.»; Sí/No con «Sí» y «No», «Elegí una opción. Podés dejarlo sin responder.» y «Tocá de nuevo la opción elegida para dejar el campo sin responder.»; motivo de la corrección «Por qué lo corregís»; botón «Enviar respuesta» o «Corregir mi respuesta» (`M/pantallas/formularios.tsx:270-367`).

**Diferencias con la web:**

| Concepto | Web (profesional) | APK (asesorado) |
|---|---|---|
| El área | «Información» | «Información» (coinciden) |
| La lista | «Solicitudes» | Sin título propio; en Inicio, «Para responder» |
| El formulario | «Formularios disponibles», «Catálogo» | La palabra «formulario» no aparece; se usa «solicitud» |
| Marca de requerido | «Requerido: {pregunta}» | Al revés: marca lo no requerido con « (Opcional)» |
| Quién y cuándo | «Pedido el {fecha}» | «Pedido por {profesional} · {fecha}» |
| Procedencia | Insignia «Declarado por la persona» en cada dato | «Lo que respondas queda registrado como declarado por vos.», una vez |
| Corregir | Bloque «Corrección» | Botón «Corregir mi respuesta» |
| Números | Tal cual llegan (con punto decimal) | Con coma decimal (`M/pantallas/formularios.tsx:53-54`) |
| Estados | «Respondida» / «Sin responder» | Los mismos |

### A.8 Datos de ejemplo

Todos sintéticos, del repo.

- **Personas:** profesional «Lic. Sofía Paz (sintética)»; asesorado «Asesorado · 84c841» (capturas de `EVIDENCIA/DASHBOARD-COMPRENSION/despues/`; nombre en `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/generar.mjs:209`).
- **Solicitud respondida y corregida** (captura `EVIDENCIA/WP-07/web/web-09-original-y-correccion.png`):
  - Formulario «Antecedentes de salud declarados», «Respondida», «Pedido el 22 sept 2026, 6:43 p. m. · Necesito saber si hay lesiones o condiciones que cambien la carga del plan.»
  - Campos: «Condiciones de salud declaradas · Dolor o lesiones actuales»
  - Respuesta original, «Respondido el 22 sept 2026, 6:43 p. m.»: Condiciones de salud declaradas → «Asma leve, diagnosticada hace años.»
  - Corrección (vigente), «22 sept 2026, 6:44 p. m. · Me olvidé de aclarar que uso inhalador antes de entrenar.»: «Asma leve. Uso inhalador antes de entrenar.» y Dolor o lesiones actuales → «Molestia en el hombro derecho desde hace dos semanas.»
- **Respuestas a «Antecedentes para entrenamiento»** (`test/integration/contexto-entrenamiento.int-spec.ts:43-52,62`): para qué «Planificar tu entrenamiento»; «Ganar fuerza para subir escaleras sin cansarme»; «Caminatas; nada de fuerza en el último año»; 3 días; 45 minutos; «En casa, con mancuernas livianas»; preferencias «Me gusta caminar; evito correr» (línea 266). Motivo de corrección: «Actualizo un dato.» (línea 73).
- **Otros «para qué»:** «Seguridad del entrenamiento» (`test/integration/cartera.int-spec.ts:81`); «Acompañamiento nutricional», con «Horas de sueño habituales» = 7 (`test/integration/contexto-entrenamiento.int-spec.ts:132-135`).
- Los datos de demostración del tablero (asesorados A, B, C y E) **no tienen solicitudes de formulario**: el generador no crea ninguna (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/generar.mjs`, `comprension.mjs`).

### A.9 Rarezas

1. **Referencias internas a la vista del profesional.** Dos descripciones del catálogo terminan con una cita del legajo: «… (08:201-204)» y «… (CAND-10-TRN-A)». La web las muestra tal cual (`W/forms/pedir.tsx:166`; `API/formularios/lectura-formularios.ts:88`). Se ve en la captura `web-05`.
2. **Las unidades no llegan.** La web muestra la unidad de un número solo si viene en la respuesta (`W/forms/formularios.tsx:244`), y la APK de este worktree no la manda (`M/pantallas/formularios.tsx:218-232`; `API/formularios/respuestas.service.ts:233-235`). Resultado deducido: el profesional lee «Cuántos días por semana podrías reservar de manera realista: 3» y «Horas de sueño habituales: 7», sin «días por semana» ni «h».
3. **«Elegido» borra lo marcado.** El botón del formulario ya elegido sigue activo; volver a tocarlo desmarca todas las casillas (`W/forms/pedir.tsx:66-79,167-169`).
4. **Tope silencioso de 20.** La lista de solicitudes pide una sola página (20 por defecto) y no tiene «Ver más» (`W/forms/formularios.tsx:125-127`; `API/http/paginacion.ts:9`).
5. **El área de la solicitud no se ve.** Se elige al pedir y después no aparece en la lista ni en el detalle. Tampoco se ve qué campos eran requeridos.
6. **`volver` significa dos cosas.** Desde la ficha lleva el estado de la ficha; desde Entrenamiento lleva la palabra `entrenamiento`. Consecuencias deducidas:
   - Llegando desde Entrenamiento, la página muestra a la vez «Volver a la ficha, donde estabas» (que lleva al Resumen de la ficha, donde la persona no estaba) y «Volver a Entrenamiento» (`W/seguimiento/estado.ts:313-331`; `W/forms/pedir.tsx:50`).
   - Si se había entrado a Entrenamiento desde la ficha, al pedir contexto se pierde el camino de vuelta a la ficha: el regreso es a Entrenamiento sin `volver` (`W/training/resumen.tsx:179`; `W/forms/pedir.tsx:53,129`).
7. **«Vuelve acá al enviarlo» no es automático.** La nota del Resumen dice «Un formulario para que la persona complete; vuelve acá al enviarlo.», pero al enviar se pasa a «Solicitudes» y queda un aviso con el enlace «Volver a la ficha, donde estabas» (`W/forms/pedir.tsx:127-130`; `W/forms/formularios.tsx:100-109`).
8. **Sin confirmación visible al volver a Entrenamiento.** El aviso «Solicitud enviada.» vive en la página de Información, que se abandona en ese mismo momento (deducido de `W/forms/pedir.tsx:127-129`).
9. **«Información» nombra tres cosas distintas:** esta área de formularios; el bloque «La información disponible del … al …» de Analizar (`W/seguimiento/informacion.tsx`, que no tiene que ver con formularios); y la zona de la APK.
10. **Texto sin uso:** «Volver al workspace del asesorado» (`D/copy-formularios.ts:21`) ya no se usa en ninguna pantalla. Las capturas viejas lo muestran arriba del título; hoy ese lugar lo ocupan las migas.
11. **«Podés cambiarlos antes de enviar»** no vale para el alcance cuando el formulario es de un solo área: el select tiene una sola opción.
12. **Los formularios no aparecen en la línea de tiempo.** Ninguno de los once tipos de hecho es de formularios (`D/linea-de-tiempo.ts:220-232`).

---

## B. La ficha del asesorado y cómo se pasa de un área a otra

Archivos: `W/page.tsx`, `W/workspace.tsx`, `W/tarjetas-de-dominio.tsx`, `W/retorno-y-preparacion.tsx`, `W/periodo.tsx`, `W/seguimiento/barra.tsx`, `W/seguimiento/contexto.tsx`, `W/seguimiento/informacion.tsx`, `W/seguimiento/estado.ts`, `W/seguimiento/resumen.tsx`, `W/seguimiento/registro-original.tsx`, `D/copy-vinculo.ts`.

### B.1 Navegación

- **Ruta:** `/pro/advisees?id={id}`. Título del navegador: «Ficha del asesorado · BE» (`W/page.tsx:8`).
- **Componente de entrada:** `PaginaDelAsesorado` → `Workspace` (`W/page.tsx:14-26`; `W/workspace.tsx:54`).
- **Tres vistas** (`W/seguimiento/estado.ts:21-25`; grupo «Vistas del seguimiento»):
  1. «Resumen» (por defecto; sin parámetro `vista`)
  2. «Línea de tiempo» (`vista=linea`)
  3. «Analizar» (`vista=analizar`)
- **Todo el estado va en la URL:** vista, período (`p=7|30|90|365`, o `desde` y `hasta`), filtros de la línea de tiempo, métricas y pregunta de Analizar (`W/seguimiento/estado.ts`). Período por defecto: 90 días (`W/seguimiento/estado.ts:39`).
- **No existe una barra de áreas.** No hay pestañas «Nutrición | Entrenamiento | Antropometría | Información». Cada área es otra página, a la que se entra por enlaces sueltos dentro de las vistas (B.3).

### B.2 El encabezado de la ficha, elemento por elemento

Orden de arriba hacia abajo (`W/page.tsx:19`; `W/workspace.tsx:140-190`). Corroborado en la captura `EVIDENCIA/DASHBOARD-COMPRENSION/despues/resumen-1440-claro.png`.

| # | Elemento | Texto | Qué hace | Visible |
|---|---|---|---|---|
| 1 | Migas | «Espacio profesional» › «Ficha del asesorado» | El primero lleva a `/pro` | Siempre |
| 2 | Título | El seudónimo: «Asesorado · 84c841». Mientras no se sabe: «Asesorado» | — | Siempre |
| 3 | Rótulo | «Acceso actual» | — | Siempre |
| 4 | Acceso por área | Ver abajo | — | Condicional: si hay al menos un vínculo con esta persona |
| 5 | Botón | «Actualizar» | Vuelve a consultar el acceso y el resumen | Siempre (deshabilitado mientras carga) |
| 6 | Texto | «Consultado a las {hora con segundos}» | — | Después de la primera consulta |
| 7 | Nota | «Vista parcial según tu acceso actual.» | — | Condicional: ver B.5 |
| 8 | Pestañas | «Resumen» · «Línea de tiempo» · «Analizar» | Cambia de vista | Siempre que la ficha esté disponible |
| 9 | Período | «Período: {desde} al {hasta}» y, si incluye hoy, « · incluye hoy, que todavía está en curso» | — | Ídem |
| 10 | Botones de período | «7 días» · «30 días» · «90 días» · «1 año» · «Otro rango» | Eligen el período; el elegido queda resaltado | Ídem |
| 11 | Rango propio | «Desde», «Hasta» (fechas) y «Aplicar» | Fija un período a mano | Condicional: «Otro rango» abierto |

En escritorio (desde 64rem de ancho), 8, 9 y 10 comparten una sola fila: pestañas a la izquierda, período a la derecha (`globals.css:2643-2669`).

**Acceso por área (elemento 4)** (`W/workspace.tsx:200-231`; `D/copy-vinculo.ts:218-228`):
- El vínculo es por área: puede haber uno, dos o tres con la misma persona. Un área sin vínculo no figura.
- Si hay más de un área y todas están en el mismo estado, se dice una vez: «**Antropometría, Entrenamiento y Nutrición**: [Activo · acceso contextual]».
- Si difieren, una lista en línea: «**{Área}**: [insignia] {detalle}».
- Valores posibles por área:

| Situación | Insignia | Texto al lado |
|---|---|---|
| Con acceso | «Activo · acceso contextual» | — |
| Vínculo pausado | «Pausado · sin acceso» | — |
| Vínculo finalizado | «Finalizado» | — |
| El asesorado todavía no autorizó | «Vínculo activo» | «Acceso pendiente de autorización del asesorado» |
| El asesorado revocó | «Consentimiento revocado» | «Acceso no disponible» |
| Vínculo activo y autorizado, pero el acceso está bloqueado | «Vínculo activo» | «Acceso no disponible» |
| Decía «Activo · acceso contextual» pero el resumen ya no deja leer el área | «Acceso no disponible» | — |

**Validaciones del rango propio** (`W/seguimiento/barra.tsx:35-41`): «Elegí las dos fechas.», «La fecha de inicio tiene que ser anterior a la de fin.», «El período puede tener hasta 366 días.»

### B.3 Cómo se va de las vistas a un área

Todas las salidas que existen. Salvo que se indique, el enlace lleva `volver` (el estado de la ficha), que es lo que después permite regresar al mismo lugar.

#### Desde «Resumen» (`W/seguimiento/resumen.tsx`)

**Tabla «Objetivo y planificación»** (líneas 168-329). Columnas: «Área» · «Objetivo vigente hoy» · «Plan vigente hoy» · «Revisiones». Una fila por área con acceso.

| Fila | Enlace | Adónde | Cuándo aparece |
|---|---|---|---|
| Nutrición, Entrenamiento | «Ver la planificación» | Área · Plan | Si hay plan vigente |
| Nutrición, Entrenamiento | «Ir al borrador» | Área · Plan | Si hay un borrador |
| Nutrición, Entrenamiento | «Ver revisiones» | Área · Revisiones | Si hay al menos una revisión |
| Antropometría | «Ver la toma» | Abre un panel sobre la ficha (no navega) | Si hay una toma |
| Antropometría | «Abrir Antropometría» | Antropometría · Evaluaciones | Siempre |

**Bloque «Para tu próxima revisión»** (líneas 333-505). Cada observación puede traer un enlace:

| Enlace | Adónde |
|---|---|
| «Abrir las revisiones» | Área · Revisiones |
| «Ir a la planificación» | Área · Plan |
| «Abrir Antropometría» | Antropometría · Evaluaciones |
| «Ver en la línea de tiempo» | Se queda en la ficha: Línea de tiempo filtrada |
| «Ver la información disponible», «Comparar etapas» | Se queda en la ficha: Analizar |
| «Ver la toma» | Panel sobre la ficha |

**Bloque «Acciones»** (líneas 509-563):

| Control | Adónde | Cuándo aparece |
|---|---|---|
| «Preparar la revisión de Nutrición» | Nutrición · Revisiones, con el formulario abierto y el período ya puesto | Área con acceso **y con plan vigente** |
| «Preparar la revisión de Entrenamiento» | Entrenamiento · Revisiones, ídem | Ídem |
| «Analizar un cambio» | Ficha · Analizar | Siempre |
| «Solicitar contexto» | Información · Pedir información | Siempre |
| Tres preguntas y «Más preguntas o análisis personalizado» | Ficha · Analizar | Siempre |

#### Desde «Línea de tiempo» y «Analizar»

- **No hay enlaces directos a las áreas.** El único camino es «Abrir registro» (en cada hecho de la línea de tiempo, `W/seguimiento/linea-de-tiempo.tsx:355-357`) o abrir un punto o una etapa en Analizar. Eso abre un **panel sobre la ficha** con el registro, y al pie del panel hay un enlace al área (`W/seguimiento/registro-original.tsx:36-48,97-103`):

| Tipo de registro | Enlace al pie del panel |
|---|---|
| Comida registrada | «Ver en Nutrición · Registros» |
| Versión del plan de nutrición | «Ver en Nutrición · Plan» |
| Objetivo de nutrición | «Ver en Nutrición» (abre Nutrición · Resumen) |
| Revisión de nutrición | «Ver en Nutrición · Revisiones» |
| Sesión registrada | «Ver en Entrenamiento · Ejecuciones» |
| Versión del plan de entrenamiento | «Ver en Entrenamiento · Plan» |
| Objetivo de entrenamiento | «Ver en Entrenamiento» |
| Revisión de entrenamiento | «Ver en Entrenamiento · Revisiones» |
| Toma o medición | «Ver en Antropometría · Evaluaciones» |
| Apertura o cierre del seguimiento | «Ver el resumen» (vuelve a la ficha, sin `volver`) |

- **En Analizar hay además un bloque con salidas:** «La información disponible del {desde} al {hasta}» (`W/seguimiento/informacion.tsx`). Aparece al elegir la pregunta «¿Con qué información cuento para revisar el objetivo?». Trae «Preparar la revisión de Nutrición», «Preparar la revisión de Entrenamiento» (cada uno si el área tiene acceso, **sin exigir plan vigente**), «Ver lo nuevo desde esa revisión» (queda en la ficha) y «Solicitar contexto». Detalle en B.6.

#### Desde el Espacio profesional, sin pasar por la ficha

En `/pro`, la tabla «Pendientes» tiene en cada fila un enlace «Abrir» que entra directo a un área, **sin `volver`** (`apps/web/src/app/pro/pendientes.tsx:49-53`; `API/cartera/lectura-cartera.ts:44-52`; `D/cartera.ts:90-98`):

| Texto de la fila | Adónde lleva «Abrir» |
|---|---|
| «Revisión vencida hace {n} días» | Área · Revisiones |
| «Revisión hoy» o «Revisión en {n} días» | Área · Revisiones |
| «Revisión pendiente desde el {día}» | Área · Revisiones |
| «Plan en borrador desde el {día}» | Área · Plan |
| «Sin plan activo» | Área · Plan |
| «Formulario sin responder desde el {día}» | Información · Solicitudes |
| «Evaluación en preparación desde el {día}» | Antropometría · En preparación |

«Sin plan activo» aparece para Nutrición o Entrenamiento cuando hay acceso, no hay seguimiento abierto y no hay borrador (`API/cartera/lectura-cartera.ts:144,155-156`). En la misma página, la lista «Tus asesorados» tiene un botón «Abrir» por persona, que lleva a la ficha (`apps/web/src/app/pro/espacio-profesional.tsx:110-112`).

#### Las pestañas de cada área (adónde se llega)

| Área | Ruta | Pestañas | Por defecto |
|---|---|---|---|
| Nutrición | `/pro/advisees/nutrition` | «Resumen» · «Plan» · «Registros» · «Revisiones» | «Resumen» |
| Entrenamiento | `/pro/advisees/training` | «Resumen» · «Plan» · «Ejecuciones» · «Revisiones» | «Resumen» |
| Antropometría | `/pro/advisees/anthropometry` | «Evaluaciones» · «En preparación» · «Evolución» · «Lámina» | «Evaluaciones» |
| Información | `/pro/advisees/forms` | «Solicitudes» · «Pedir información» | «Solicitudes» |

Fuentes: `W/nutrition/nutricion.tsx:29-34,79`; `W/training/entrenamiento.tsx:29-34,77`; `W/anthropometry/antropometria.tsx:30-35,79`; `W/forms/formularios.tsx:30-33,79`.

### B.4 Cómo se vuelve

Las cuatro páginas de área arman igual su cabecera: migas, título con el nombre del área, enlace de retorno, pestañas (`W/nutrition/nutricion.tsx:99-106`; `W/training/entrenamiento.tsx:97-104`; `W/anthropometry/antropometria.tsx:103-110`; `W/forms/formularios.tsx:94-99`). Corroborado en la captura `revision-nutricion-1440-claro.png`.

| Forma de volver | Texto | Adónde lleva | Cuándo existe |
|---|---|---|---|
| Enlace bajo el título | «Volver a la ficha, donde estabas» | A la ficha con la misma vista, período, filtros, pregunta y métricas | Solo si se llegó con `volver` |
| Migas | «Ficha del asesorado» | Lo mismo si hay `volver`; si no, a la ficha en su estado inicial (Resumen, 90 días) | Siempre |
| Aviso flotante tras guardar | «Volver a la ficha, donde estabas» | Ídem | Tras «Solicitud enviada.» y tras registrar una revisión, si hay `volver` |
| «Atrás» del navegador | — | A la página anterior (las pestañas no dejan rastro en el historial) | Siempre |

Detalles:
- `volver` se conserva al cambiar de pestaña dentro del área (`W/retorno-y-preparacion.tsx:33`).
- El destino se valida: nunca sale de la ficha del mismo asesorado, y lo que no reconoce se descarta (`W/seguimiento/estado.ts:313-331`).
- **Lo que no vuelve:** el texto buscado en la línea de tiempo (no viaja en la URL, a propósito: `W/seguimiento/estado.ts:1-5`), el acercamiento del gráfico de Analizar y los paneles abiertos.
- Desde «Pendientes» de `/pro` se entra a un área **sin** `volver`: ahí no hay enlace de retorno, solo las migas.
- **No hay paso directo de un área a otra.** Para ir de Nutrición a Entrenamiento hay que volver a la ficha. La única excepción es «Solicitar contexto» en Entrenamiento · Resumen.

### B.5 Qué depende de las áreas a las que el profesional tiene acceso

| Dónde | Efecto | Fuente |
|---|---|---|
| Encabezado | Una entrada por área con vínculo, con su estado | `W/workspace.tsx:200-221` |
| Encabezado | «Vista parcial según tu acceso actual.» cuando alguna de las tres áreas no se puede leer. **Incluye el caso normal de un profesional que trabaja una sola área con la persona** (captura `escenario-e-resumen-1440-azul-noche.png`; `EVIDENCIA/DASHBOARD-PROFESIONAL/DATOS-SINTETICOS.md`, §2: asesorado B) | `W/workspace.tsx:161`; `API/dashboard/dashboard.controller.ts:62` |
| Toda la ficha | Sin ninguna área con acceso: «No encontramos un recurso disponible para esta acción.» y «Volver». No se ven pestañas ni período | `W/workspace.tsx:164-170`; `API/dashboard/dashboard.controller.ts:16` |
| Resumen · tabla | Solo las filas de las áreas con acceso. Sin ninguna: «Ninguna área disponible con tu acceso actual» y «El acceso de cada área se ve en el encabezado de la ficha.» | `W/seguimiento/resumen.tsx:175,184,198-244` |
| Resumen · «Para tu próxima revisión» | Solo hechos de áreas con acceso. Sin nada: «Nada para preparar con tu acceso actual» y «No hay áreas disponibles o todavía no hay datos ni planificación.» | `W/seguimiento/resumen.tsx:361-399,445-447` |
| Resumen · «Acciones» | «Preparar la revisión de …» solo con acceso y plan vigente. «Solicitar contexto» se ofrece siempre | `W/seguimiento/resumen.tsx:515-516,540-545` |
| Resumen · «Indicadores» | Por indicador: «No disponible con tu acceso actual.» | `W/seguimiento/resumen.tsx:639` |
| Línea de tiempo | Botones de «Áreas» y opciones de «Tipo de hecho» solo de las áreas con acceso; nota «Vista parcial según tu acceso actual.» | `W/seguimiento/linea-de-tiempo.tsx:197-226,265` |
| Analizar | Áreas elegibles solo las que tienen acceso; si ninguna: «No hay áreas con planificación disponibles con tu acceso actual.». En un gráfico: «Vista parcial: hay datos de esta área que no ves (los de otro profesional).» | `W/seguimiento/analizar.tsx:111-115,300`; `W/seguimiento/preguntas.tsx:197` |
| Panel de registro | «Este registro no está disponible con tu acceso actual.», «Esta toma no está disponible con tu acceso actual.», «Esta planificación no está disponible con tu acceso actual.» | `W/seguimiento/registro-original.tsx:132,158,205` |
| Página de un área sin acceso | Toda la página pasa a «No encontramos un recurso disponible para esta acción.» y «Volver». Lo mismo si un guardado es rechazado por falta de acceso: se retira todo el contenido, no solo la acción | `W/nutrition/nutricion.tsx:9-10,86-91,104` |
| Información | Ver A.5: la lista se filtra sola; el pedido ofrece las tres áreas siempre | — |

**El acceso se vuelve a preguntar solo** (`W/workspace.tsx:16-23,50-52,105-131`): si una lectura responde «no disponible» para un área que el encabezado mostraba activa (como mucho cada 5 segundos), y al volver a la pestaña del navegador después de más de un minuto. Nunca se dice quién retiró el acceso ni por qué.

### B.6 Los bloques que el encargo pide en detalle

#### Las «tarjetas de área»: ya no se dibujan

`W/tarjetas-de-dominio.tsx` define tres tarjetas («Nutrición», «Entrenamiento», «Antropometría»), **pero ningún archivo las usa**: no hay ninguna importación en todo el repo; solo quedan sus estilos en `globals.css:1189-1218`. En esta rama no aparecen en ninguna pantalla. Las reemplazó la tabla «Objetivo y planificación» del Resumen.

Por si hay capturas viejas dando vueltas, esto es lo que mostraban (`W/tarjetas-de-dominio.tsx:33-98`):

| Tarjeta | Filas | Enlace |
|---|---|---|
| Nutrición | «Plan vigente» · «Requerimiento energético estimado» · «Registros del asesorado en el período» · «Última revisión» · «Próxima revisión acordada» | «Abrir Nutrición» |
| Entrenamiento | «Plan vigente» · «Objetivo vigente» · «Sesiones registradas en el período» · «Última revisión» · «Próxima revisión acordada» | «Abrir Entrenamiento» |
| Antropometría | «Última evaluación registrada» · «Evaluaciones registradas en el período» | «Abrir Antropometría» |

#### Lo que hoy cumple ese papel: la tabla «Objetivo y planificación»

Cada celda dice varias cosas (`W/seguimiento/resumen.tsx:253-329`):

| Columna | Contenido, con ejemplo de la captura |
|---|---|
| «Objetivo vigente hoy» | Nutrición: «1.950 kcal por día (requerimiento energético estimado)». Entrenamiento: el enunciado, o «Objetivo sin enunciado». Debajo, más chico: «Desde el 4 sept 2026 · Lic. Sofía Paz (sintética)» |
| «Plan vigente hoy» | «Versión 2, desde el 4 sept 2026 · Ver la planificación», o «Sin plan vigente hoy». Debajo: «Antes, en el período: v1 (del 18 jul 2026 al 3 sept 2026)» (o «En el período: …», o «Ninguna versión activada toca el período.»). Si hay borrador: «Borrador del 9 oct 2026: todavía no rige · Ir al borrador» |
| «Revisiones» | «Última: 19 sept 2026 · Lic. Sofía Paz (sintética) · aplicada · Ver revisiones». Variantes: «aplicada el {día}» o, en negrita, «registrada, sin aplicar». Sin revisiones: «Sin revisiones registradas: lo nuevo se mira en el período elegido.». Debajo: «Próxima acordada: 12 oct 2026» o «Próxima acordada: sin fecha acordada» |

- Fila de Antropometría: ocupa las dos columnas del medio con «Última toma: 8 oct 2026, 8:00 a. m. · Lic. Sofía Paz (sintética) · Ver la toma · 8 tomas en el período · Abrir Antropometría», y en «Revisiones» dice «No tiene revisiones en BE».
- Área con acceso pero sin ningún dato: la fila dice solo «Sin datos registrados todavía.», **sin ningún enlace** (líneas 270-277).

#### Qué hace «Solicitar contexto»

- Es un enlace a `/pro/advisees/forms?id={id}&vista=pedir&volver={estado de la ficha}`.
- Abre «Información» en la pestaña «Pedir información», **sin nada elegido**: el profesional tiene que elegir formulario, preguntas, para qué y alcance (todo A.2).
- No envía nada por sí solo ni abre un diálogo.
- Está en dos lugares de la ficha, siempre visible, sin depender del acceso: Resumen · «Acciones», con la nota «Un formulario para que la persona complete; vuelve acá al enviarlo.» (`W/seguimiento/resumen.tsx:540-545`), y al pie del bloque «La información disponible …» de Analizar (`W/seguimiento/informacion.tsx:166-170`).
- Con el mismo texto existe en Entrenamiento · Resumen, pero ahí precarga el formulario de entrenamiento (A.2). La ayuda plegada «Qué se le pide a la persona» dice: «Le pide a la persona «Antecedentes para entrenamiento»: qué busca, su experiencia, cuánto tiempo tiene, dónde entrena y qué prefiere. Pedir no da acceso a nada nuevo hasta que responda.» (`W/training/resumen.tsx:179-185`; `D/copy-entrenamiento.ts:195-197`).

#### El bloque «La información disponible del {desde} al {hasta}» (`W/seguimiento/informacion.tsx`)

- Dónde: Ficha · Analizar, con la pregunta «¿Con qué información cuento para revisar el objetivo?» (`W/seguimiento/analizar.tsx:269`). Captura: `informacion-1440-claro.png`.
- Bajada: «Describe lo que hay, de qué fechas y qué es comparable. No dice si alcanza: eso lo decidís vos.»
- Una columna por área con acceso:

| Área | Filas | Acción |
|---|---|---|
| Nutrición | «Registros de comida» · «Último registro» · «Objetivo vigente» · «Corte para lo nuevo» | «Preparar la revisión de Nutrición» |
| Entrenamiento | «Sesiones registradas» · «Ejercicios con sesiones» (hasta 6 y « · y {n} más») · «Objetivo vigente» · «Corte para lo nuevo» | «Preparar la revisión de Entrenamiento» |
| Antropometría | «Tomas en el período» · «Medidas con tomas» · «Comparabilidad» | — |

- Ejemplos de valores (captura): «283 registros en 80 días de 90: 275 con cantidades y 8 sin cantidades (4 comidas diferentes)»; «1.950 kcal por día (requerimiento energético estimado) · rige desde el 4 sept 2026, 9:00 a. m. · Lic. Sofía Paz (sintética)»; «La revisión del 19 sept 2026, 11:00 a. m. · Ver lo nuevo desde esa revisión»; «Cambió el protocolo, el método o la unidad en: Peso. Sus series se cortan donde cambia.»
- Vacíos: «Sin registros en el período», «Sin registros», «Sin objetivo vigente», «Sin revisiones: se mira el período elegido», «Ninguno», «Ninguna», «Cada medida con tomas tiene un solo protocolo, método y unidad en el período.»
- Si la pregunta se abre para un área, se ven esa área y Antropometría (línea 33).

### B.7 Estados de la ficha

| Situación | Texto | Fuente |
|---|---|---|
| Cargando | «Cargando…» (en el acceso y en la vista) | `W/workspace.tsx:150`; `W/seguimiento/resumen.tsx:87` |
| No se pudo leer el acceso | «No pudimos cargar esta vista.» + «Reintentar» | `W/workspace.tsx:151` |
| No se pudo leer el resumen | «No pudimos leer el resumen por área. No es una ausencia de datos: reintentá.» | `W/seguimiento/resumen.tsx:88` |
| Ficha no disponible | «No encontramos un recurso disponible para esta acción.» + «Volver» | `W/workspace.tsx:164-170` |
| Acceso parcial | «Vista parcial según tu acceso actual.» | `W/workspace.tsx:161` |
| Dato que falta | «Sin datos registrados todavía.» | `D/copy-vinculo.ts:138` |
| Una lectura falló por exceso de consultas | «No pudimos cargar {qué}: hubo muchas consultas seguidas. Esperá un minuto y reintentá.» | `W/seguimiento/contexto.tsx:113-124` |
| … por falta de conexión | «No pudimos cargar {qué}: no hay conexión con BE. Revisá la conexión y reintentá.» | Ídem |
| … por caída del servicio | «No pudimos cargar {qué}: BE no está disponible en este momento. Reintentá en unos minutos.» | Ídem |
| … por otra causa | «No pudimos cargar {qué}. No es una ausencia de datos: reintentá.» | Ídem |

### B.8 Datos que llegan a la ficha

**Resumen por área** (`D/contratos-vinculo.ts:282-368`). Todo lo que puede faltar llega vacío, y el resumen entero de un área llega vacío cuando esa área no tiene ningún dato.

| Campo | Significado | Unidad | ¿Puede faltar? |
|---|---|---|---|
| `advisee.displayName` | Seudónimo del asesorado | — | No |
| `partialView` | Alguna área no se puede leer | Sí/No | No |
| `domains.{área}.available` | Si el área se puede leer | Sí/No | No |
| `activePlan.activatedAt` | Desde cuándo rige el plan | Instante | Sí |
| `activePlan.nextReviewAt` | Próxima revisión acordada | Fecha | Sí |
| `objective.estimatedEnergyRequirement` (Nutrición) | Requerimiento energético | kcal por día | Sí |
| `objective.statement` (Entrenamiento) | Enunciado del objetivo | Texto | Sí |
| `objective.effectiveFrom`, `objective.authoredBy` | Desde cuándo rige y quién lo escribió | Instante, nombre | Sí |
| `lastReview.recordedAt`, `.author`, `.application` | Última revisión, autor y si se aplicó | — | Sí |
| `draftPlan.recordedAt` | Borrador sin activar | Instante | Sí |
| `registeredIntakes`, `lastIntakeAt` (Nutrición) | Comidas registradas en el período y la última | Conteo, instante | Conteo no; instante sí |
| `registeredExecutions`, `lastExecutionAt` (Entrenamiento) | Sesiones registradas y la última | Ídem | Ídem |
| `lastEvaluation`, `registeredEvaluations` (Antropometría) | Última toma y cuántas en el período | — | La toma sí |

**Vínculo** (`D/contratos-vinculo.ts:109-123`): `scope.label` (nombre del área), `relationshipState` (activo, pausado, finalizado), `consentState` (pendiente, activo, revocado), `accessMode` (bloqueado o con acceso).

### B.9 Reglas visibles

- **Abrir la ficha no registra nada.** Lo dice la ayuda «Cómo se arma esta lista»: «Abrir la ficha no registra una revisión ni una nota.» (`W/seguimiento/resumen.tsx:468-477`).
- **Lo único que se guarda desde el Resumen son los indicadores elegidos** (hasta 4, por cuenta del profesional, valen para todos sus asesorados; `W/seguimiento/resumen.tsx:757`). No hay confirmaciones. En Analizar existen además las vistas guardadas (`W/seguimiento/vistas-guardadas.tsx`), que quedan fuera de este inventario.
- **Antropometría no tiene objetivo, plan ni revisiones** en BE (`W/seguimiento/resumen.tsx:223,242`).
- **Sin colores de juicio ni porcentajes:** los estados describen datos, no a la persona (`W/tarjetas-de-dominio.tsx:7-10`; `D/copy-vinculo.ts:5-10`).
- Período: de 1 a 366 días.

### B.10 Cuánto hay en pantalla

Conté los elementos interactivos de dos capturas reales de esta rama, a 1440 px, página completa.

**Asesorado con las tres áreas** (`resumen-1440-claro.png`): **44 controles.**

| Bloque | Controles |
|---|---|
| Encabezado del sitio | 7 |
| Migas | 1 |
| «Actualizar» | 1 |
| Pestañas de la ficha | 3 |
| Período | 5 |
| «Objetivo y planificación» | 7 |
| «Para tu próxima revisión» («Ver todas (9)», 4 enlaces, la ayuda plegada) | 6 |
| «Acciones» (4 botones, 3 preguntas, 1 enlace) | 8 |
| «Indicadores» («Elegir indicadores» y 4 «Analizar») | 5 |
| «Lo último que pasó» | 1 |

**Asesorado con una sola área** (`escenario-e-resumen-1440-azul-noche.png`): **31 controles.**

Bloques más densos:
- **La tabla «Objetivo y planificación».** Pocas filas, pero cada celda junta de dos a cuatro hechos con sus enlaces. La celda «Plan vigente hoy» de Entrenamiento en la captura lleva tres renglones y dos enlaces.
- **«Acciones».** Ocho salidas en una columna angosta, cada botón con una nota debajo.
- **El período.** Cinco botones siempre a la vista, más dos fechas y «Aplicar» con «Otro rango» abierto.

No conté Línea de tiempo ni Analizar: quedan fuera de este inventario salvo por sus salidas (B.3).

### B.11 Datos de ejemplo

De las capturas de `EVIDENCIA/DASHBOARD-COMPRENSION/despues/` y de los generadores en `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/`.

- **Encabezado, tres áreas:** «Asesorado · 84c841» · «Acceso actual  Antropometría, Entrenamiento y Nutrición: Activo · acceso contextual» · «Consultado a las 10:32:57 a. m.» · «Período: 12 jul 2026 al 9 oct 2026 · incluye hoy, que todavía está en curso».
- **Encabezado, un área:** «Asesorado · ed3a8b» · «Acceso actual  Nutrición: Activo · acceso contextual» · «Vista parcial según tu acceso actual.»
- **Tabla, Nutrición:** «1.950 kcal por día (requerimiento energético estimado)» / «Desde el 4 sept 2026 · Lic. Sofía Paz (sintética)» · «Versión 2, desde el 4 sept 2026» / «Antes, en el período: v1 (del 18 jul 2026 al 3 sept 2026)» · «Última: 19 sept 2026 · Lic. Sofía Paz (sintética) · aplicada» / «Próxima acordada: 12 oct 2026».
- **Tabla, Entrenamiento:** «Ganar fuerza en los básicos con técnica estable (objetivo sintético).» / «Desde el 17 jul 2026 · …» · «Versión 2, desde el 4 sept 2026» / «Borrador del 9 oct 2026: todavía no rige» · «Última: 30 sept 2026 · … · registrada, sin aplicar» / «Próxima acordada: sin fecha acordada».
- **Observaciones:** «La próxima revisión acordada es el 12 oct 2026 (en 3 días).»; «La revisión del 30 sept 2026 está registrada y su resultado todavía no se aplicó.»; «Hay una versión nueva del plan en borrador, creada el 9 oct 2026. No rige hasta que se active.»; «Una medida cambió de protocolo, método o unidad en el período (Peso): su serie se corta donde cambia.»
- **Indicadores:** «Energía 1.208 kcal»; «Registros 283 registros»; «Peso 79,8 kg»; «Series registradas · Peso muerto 36 series».
- **Lo último que pasó:** «9 oct 2026 · Entrenamiento · Sesión registrada · A · Tren inferior»; «8 oct 2026 · Nutrición · Comida diferente · Cena · carga tardía»; «8 oct 2026 · Nutrición · Comida registrada · Merienda (anulado) · carga tardía».
- **Casos para dibujar acceso parcial** (`EVIDENCIA/DASHBOARD-PROFESIONAL/DATOS-SINTETICOS.md`, §2): asesorado B, solo Nutrición y Antropometría; asesorado E, solo Nutrición, sin revisiones, plan activado hoy.

### B.12 Rarezas

1. **Un área recién autorizada y vacía no tiene puerta de entrada desde la tabla.** Para Nutrición o Entrenamiento sin ningún dato, la fila dice solo «Sin datos registrados todavía.» y «Acciones» no ofrece «Preparar la revisión …» (pide plan vigente). Quedan dos caminos (deducido): dentro de la ficha, la pregunta «¿Con qué información cuento para revisar el objetivo?» → «Preparar la revisión de …» → y ahí la pestaña «Resumen»; fuera de la ficha, `/pro` → «Pendientes» → fila «Sin plan activo» → «Abrir», que entra al Plan del área. Antropometría sí tiene siempre «Abrir Antropometría».
2. **No hay un enlace directo a Nutrición · Resumen**, que es donde se define el objetivo. Los enlaces de la tabla llevan a Plan y a Revisiones; solo el panel de un registro de tipo objetivo dice «Ver en Nutrición».
3. **«Vista parcial según tu acceso actual.» es el estado habitual** de cualquier profesional que no trabaje las tres áreas con la persona, no una señal de que se retiró algo.
4. **El encabezado puede quedarse sin la lista de acceso** (deducido): la ficha pide solo la primera página de vínculos del profesional (20) y filtra ahí a esta persona (`W/workspace.tsx:79,95`; `API/http/paginacion.ts:9`). Con más de 20 vínculos-área en total, los de una persona antigua pueden no venir.
5. **«Consentimiento revocado» sí dice una causa**, aunque los comentarios del código afirman que nunca se dice por qué se perdió el acceso (`D/copy-vinculo.ts:223` frente a `W/workspace.tsx:22-23`).
6. **Tres palabras para lo mismo:** «área» (ficha), «Alcance» (formularios y vínculos), «Dominio» (filtro de «Pendientes»; `D/cartera.ts:102`). Y la ficha se llama «workspace» en el nombre accesible del botón «Abrir» de `/pro` («Abrir el workspace de {nombre}», `apps/web/src/app/pro/espacio-profesional.tsx:110`).
7. **Dos selectores de período distintos:** el de la ficha (botones y hasta 366 días) y el de las áreas («Desde», «Hasta», «Ver período», hasta 92 días; `W/periodo.tsx:19-20`). El período de la ficha no viaja al área.
8. **«Preparar la revisión de …» aparece con dos criterios:** en «Acciones» exige plan vigente; en el bloque de Analizar, solo acceso.
9. **«Ver la toma» y «Abrir registro» no navegan:** abren un panel encima de la ficha. El enlace al área está al pie de ese panel.
10. **El archivo `tarjetas-de-dominio.tsx` está muerto** (B.6).

---

## C. Nutrición: Resumen, Revisiones y las piezas del Plan

Archivos: `W/nutrition/nutricion.tsx`, `resumen.tsx`, `revisiones.tsx`, `formularios.tsx`, `plantillas.tsx`, `habituales.tsx`, `importacion.tsx` (y, para ubicarlos, `plan.tsx` y `editor.tsx`); `W/evidencia-de-revision.tsx`, `W/evidencia.ts`; `D/copy-nutricion.ts`, `copy-plantillas.ts`, `copy-habituales.ts`, `copy-integraciones.ts`, `contratos-nutricion.ts`.

### C.1 Navegación

- **Ruta:** `/pro/advisees/nutrition?id={id}&vista={resumen|plan|registros|revisiones}`. Título del navegador: «Nutrición · BE» (`W/nutrition/page.tsx:7`).
- **Componente de entrada:** `PaginaDeNutricion` → `Nutricion` (`W/nutrition/page.tsx:13-24`; `W/nutrition/nutricion.tsx:75`).
- **Cabecera:** migas («Espacio profesional» › «Ficha del asesorado» › «Nutrición»), título «Nutrición», enlace «Volver a la ficha, donde estabas» (condicional), pestañas (`W/nutrition/nutricion.tsx:99-106`).
- **Pestañas, en orden** (`W/nutrition/nutricion.tsx:29-34`; grupo «Secciones de Nutrición»): «Resumen» (por defecto) · «Plan» · «Registros» · «Revisiones».
- **Parámetro extra:** `preparar=1` hace que Revisiones abra el formulario ya armado (`W/retorno-y-preparacion.tsx:44`).
- **Dónde vive cada archivo del encargo:**

| Archivo | Qué dibuja | En qué pestaña |
|---|---|---|
| `resumen.tsx` | Estado del seguimiento y Objetivo | Resumen |
| `formularios.tsx` | Formulario de evaluación y formulario de objetivo | Resumen (y el de objetivo, también dentro de una revisión) |
| `revisiones.tsx` | Período, formulario de revisión y lista de revisiones | Revisiones |
| `plantillas.tsx` | «Guardar como plantilla», «Empezar desde una plantilla», nota de origen | Plan |
| `habituales.tsx` | «Mis habituales», «Guardar como habitual», «Agregar una comida habitual» | Plan (editor del borrador) |
| `importacion.tsx` | «Importar desde Open Food Facts» | Plan (editor, dentro de «Agregar ítem») |

No existen pestañas de «Plantillas», «Habituales» ni «Importación»: son piezas incrustadas en el Plan.

### C.2 Pestaña «Resumen» (`W/nutrition/resumen.tsx`)

En orden:

#### 1. Sección «Estado del seguimiento» (líneas 116-169). Siempre.

| Fila | Valores posibles | Control |
|---|---|---|
| «Seguimiento nutricional» | «Abierto» · «Cerrado» · «Todavía no empezó: empieza al activar el primer plan.» | — |
| «Plan activo» | «Versión {n} · activada el {fecha con hora}» · «Todavía no hay un plan activo.» | «Ver plan» (va a la pestaña Plan) |
| «Borrador» (solo si hay uno) | «Hay un borrador en preparación. No es visible para el asesorado.» | «Abrir borrador» (va a Plan) |
| «Última evaluación» | {día} · «Sin evaluaciones registradas.» | — |
| «Revisión pendiente» | «Pendiente desde el {día}» · «No hay una revisión pendiente.» | «Ir a Revisiones» |

#### 2. Sección «Objetivo» (líneas 171-216). Siempre.

Con objetivo:
- Línea chica: «Objetivo declarado por el profesional»
- «Requerimiento energético»: «{n} kcal por día»
- «Proteínas · carbohidratos · grasas»: «{p} g · {c} g · {g} g por día»
- «Fundamento»: el texto que escribió el profesional
- «Vigente desde»: {día}
- Si hay más de una versión, un plegable «Historia del objetivo ({n} versiones)» con una línea por versión: «V{n} · vigente» o «V{n} · anterior», y «{kcal} kcal · {día} · {autor}».

Sin objetivo: «Todavía no hay un objetivo definido.»

#### 3. Botones (líneas 228-237). Se ocultan mientras hay un formulario abierto.

- «Nueva evaluación» (primario): abre el formulario de evaluación en la misma página.
- «Definir objetivo» si no hay objetivo, o «Nueva versión de objetivo» si ya hay (secundario): abre el formulario de objetivo.

#### El objetivo: qué guarda exactamente

**Respuesta corta: es un solo conjunto de números por día. No es por día tipo, no tiene rangos y no baja a nivel de comida.**

Lo que se guarda en cada versión (`D/contratos-nutricion.ts:91-130`):

| Dato | Unidad | Obligatorio | ¿Se pide en la web? | ¿Se vuelve a mostrar? |
|---|---|---|---|---|
| Requerimiento energético estimado | kcal por día (un número mayor que cero) | Sí | Sí | Sí |
| Proteínas | g por día (cero o más) | Sí | Sí | Sí |
| Carbohidratos | g por día | Sí | Sí | Sí |
| Grasas | g por día | Sí | Sí | Sí |
| Distribución por comidas | **Texto libre**, hasta 1.000 caracteres | No | Sí | **No** |
| Fundamento | Texto, hasta 4.000 | Sí | Sí | Sí |
| Método o referencia declarada | Texto, hasta 1.000 | No | Sí | **No** |
| Evaluación de referencia | Una evaluación ya registrada | Sí | Sí | **No** |
| Vigente desde | Fecha y hora | Sí | Sí (viene «ahora») | Sí, solo el día |
| Vigente hasta | Fecha y hora | No | **No** (se manda siempre vacío) | No |
| Autor, fecha de creación, versión anterior, si es la vigente | — | Los pone BE | — | En la historia |

Precisiones:
- **Un objetivo por pareja profesional-asesorado**, con versiones encadenadas. Nunca se edita: cada cambio es una versión nueva (`W/nutrition/formularios.tsx:7-8`).
- **El plan cita una versión del objetivo entera**; los días tipo solo tienen nombre y comidas, sin números propios (`D/contratos-nutricion.ts:164-169,214-215,235`).
- **Los macros se cargan en gramos.** El contrato admite también «proporción de la energía», pero la web no lo ofrece y siempre manda gramos (`D/contratos-nutricion.ts:92`; `W/nutrition/formularios.tsx:201`).
- **BE no calcula nada:** no hay botón de calcular ni validación que relacione las kcal con los macros (`W/nutrition/formularios.tsx:184-198`; `D/copy-nutricion.ts:53`).
- Lo que le llega a la APK del asesorado: kcal, macros, distribución por comidas y vigencia; el fundamento no viaja (`D/contratos-nutricion.ts:420-428`). No se revisó qué de eso dibuja la APK.

#### Formulario de objetivo, campo por campo (`W/nutrition/formularios.tsx:214-373`)

Título: «Nueva versión de objetivo» (también cuando es el primero). En orden:

| # | Campo | Tipo | Detalle |
|---|---|---|---|
| — | Nota | Texto | «BE no calcula requerimientos: el objetivo es una decisión profesional con su fundamento.» |
| 1 | «Evaluación de referencia» | Select | «Elegí una evaluación» y una opción por evaluación: «Evaluación del {día}». Viene elegida la más reciente |
| 2 | «Requerimiento energético estimado (kcal por día)» | Número | — |
| 3 | Grupo «Distribución de macronutrientes (g por día)» | Tres números en fila | «Proteínas (g)» · «Carbohidratos (g)» · «Grasas (g)» |
| 4 | «Distribución por comidas (opcional)» | Texto de 2 renglones | Hasta 1.000 |
| 5 | «Fundamento» | Texto de 3 renglones | Ayuda: «Por qué fijás este objetivo. Es obligatorio: queda con la versión.» Hasta 4.000 |
| 6 | «Método o referencia declarada (opcional)» | Texto | Hasta 1.000 |
| 7 | «Vigente desde» | Fecha y hora | Viene con el momento actual |

Botones: «Guardar nueva versión» (pasa a «Guardando…») y «Cancelar».

Errores (arriba, bajo el título «Revisá estos datos:», y repetidos junto al campo): «Elegí la evaluación de referencia.» · «Indicá el requerimiento energético (kcal por día).» · «Indicá las proteínas (g por día).» · «Indicá los carbohidratos (g por día).» · «Indicá las grasas (g por día).» · «El fundamento es obligatorio.» · y los dos avisos de número de 0.4.

Si no hay ninguna evaluación, en lugar del formulario: «Para definir un objetivo, primero registrá una evaluación: el objetivo se relaciona con ella.»

Éxito: aviso flotante «Nueva versión de objetivo guardada.» (`W/nutrition/resumen.tsx:225`).

#### Formulario de evaluación, campo por campo (`W/nutrition/formularios.tsx:42-156`)

Título: «Nueva evaluación».

| # | Campo | Tipo | Detalle |
|---|---|---|---|
| 1 | «Fecha y hora de la evaluación» | Fecha y hora | Viene «ahora» |
| 2 | «Contexto (opcional)» | Texto de 2 renglones | Hasta 1.000 |
| 3 | Grupo «Datos de la evaluación» | Lista de datos | Ayuda: «Cada dato indica de dónde sale. Un dato calculado declara el método: BE no calcula.» |
| 3a | «Concepto» | Texto | Hasta 120. Obligatorio |
| 3b | «Valor» | Texto | Hasta 500. Obligatorio |
| 3c | «Unidad (opcional)» | Texto | Hasta 30 |
| 3d | «Fuente» | Select | «Informado por el asesorado» (por defecto) · «Observado por el profesional» · «Calculado (con método declarado)» |
| 3e | «Método declarado» | Texto | Solo si la fuente es «Calculado». Obligatorio |
| 3f | «Quitar dato {n}» | Botón-enlace | Solo si hay más de un dato |
| 3g | «Agregar dato» | Botón | Suma otra fila 3a-3e |
| 4 | «Notas del profesional (opcional)» | Texto de 3 renglones | Hasta 4.000 |

Botones: «Registrar evaluación» («Registrando…») y «Cancelar».

Errores: «Dato {n}: falta el concepto.» · «Dato {n}: falta el valor.» · «Dato {n}: un dato calculado declara su método.»

Éxito: aviso flotante «Evaluación registrada».

### C.3 Pestaña «Revisiones» (`W/nutrition/revisiones.tsx`)

En orden (corroborado en la captura `revision-nutricion-1440-claro.png`):

1. **Filtro de período.** Siempre: «Desde», «Hasta», «Ver período». Sin elegir nada, la API usa los últimos 7 días con hoy; el máximo es 92 días (`API/nutricion/revisiones.service.ts:37-40`). Validaciones: ««Desde» no puede ser posterior a «Hasta».» y «El período puede abarcar hasta 92 días.» (`W/periodo.tsx:32-33`).
2. **Nota.** Siempre: «Abrir esta pantalla no cuenta como revisión: la revisión se registra con «Registrar revisión».»
3. **Aviso de revisión pendiente.** Condicional: «Revisión pendiente desde el {día}.»
4. **Formulario de revisión**, o su reemplazo:
   - Seguimiento abierto: botón «Nueva revisión» (primario), que despliega el formulario.
   - Seguimiento cerrado: «El seguimiento nutricional está cerrado. La historia se conserva.»
   - Seguimiento sin empezar: «El seguimiento empieza al activar el primer plan.»
5. **Sección «Revisiones registradas».** Siempre. Vacía: «Todavía no hay revisiones registradas.»

#### Cómo se registra una revisión, paso a paso

1. (Opcional) elegir el período.
2. «Nueva revisión».
3. Completar el formulario y «Registrar revisión». Aviso flotante: «Revisión registrada. Todavía no se aplicó: aplicala desde la lista.»
4. La revisión aparece en «Revisiones registradas» con el botón «Aplicar continuidad».
5. «Aplicar continuidad». **Registrar y aplicar son dos actos separados**, sin confirmación en ninguno de los dos.

#### Formulario «Nueva revisión», campo por campo (líneas 251-354)

| # | Bloque | Contenido |
|---|---|---|
| — | Aviso de preparación (solo si se llegó con «Preparar la revisión de Nutrición») | «**Preparado por BE para esta revisión:** el período va del {día} (la última revisión fue el {día}) a hoy. La evidencia, la interpretación y el resultado los elegís vos. Nada se registra hasta que elijas «Registrar revisión».» Sin revisiones previas, el medio dice: «todavía no hay revisiones registradas: el período es el que propone BE, y lo podés cambiar.» (`W/retorno-y-preparacion.tsx:60-72`) |
| — | Período | «Período: {día} a {día}» (no se edita acá: sale del filtro de arriba) |
| 1 | «Evidencia que examinaste» | Ver abajo. Obligatorio: al menos un elemento |
| 2 | «Interpretación» | Texto de 3 renglones, hasta 4.000. Ayuda: «La interpretación describe lo observado. No es un diagnóstico.» Obligatorio |
| 3 | «Resultado» | Seis opciones excluyentes, ninguna marcada. Obligatorio |
| 4 | «Fundamento» | Texto de 3 renglones, hasta 4.000. Obligatorio |
| 5 | «Próxima acción» (se llama «Cierre» si el resultado es Finalizar) | Texto de 2 renglones, hasta 2.000. Obligatorio |
| 6 | «Próxima revisión (opcional)» (se llama «Fecha de la próxima revisión» y es obligatoria con Reprogramar; desaparece con Finalizar) | Fecha |
| 7 | Grupo «Nuevo objetivo» (solo con Cambiar objetivo) | Los siete campos del formulario de objetivo de C.2 |

Botones: «Registrar revisión» («Registrando…») y «Cancelar».

**Las seis opciones de «Resultado»**, cada una con su explicación debajo (`D/copy-nutricion.ts:26-43`):

| Opción | Explicación que se lee | Qué hace al aplicar |
|---|---|---|
| «Mantener» | «El plan sigue igual. Se registra la próxima acción.» | Nada más |
| «Ajustar» | «Se prepara una nueva versión del plan en borrador. La versión activa no cambia hasta que actives la nueva.» | Crea un borrador del plan |
| «Sustituir» | «Se prepara una versión sucesora en borrador. La versión actual se conserva en el historial.» | Crea un borrador del plan |
| «Reprogramar revisión» | «Se fija una nueva fecha de revisión. El plan no cambia.» | Fija la fecha |
| «Cambiar objetivo» | «Se emite una nueva versión del objetivo. El plan se ajusta aparte, con un borrador nuevo.» | Crea la versión del objetivo |
| «Finalizar» | «Se cierra el seguimiento nutricional. La historia se conserva; no es «Eliminar plan».» | Cierra el seguimiento |

**El bloque «Evidencia que examinaste»** (`W/evidencia-de-revision.tsx`; `W/evidencia.ts`):
- Ayuda: «Marcá lo que examinaste: nada viene marcado. Marcar un día marca cada uno de sus registros; dejá marcados solo los que miraste.»
- Resumen en vivo: «Todavía no marcaste nada.» o «Marcaste 12 de 73: 10 comidas de 3 días, 1 versión del plan y el objetivo.»
- Subtítulo «Planificación y objetivo»: una casilla por versión del plan que rigió en el período («Plan activado el {fecha con hora}») y una para «Objetivo vigente».
- Subtítulo «Comidas del período, por día»:
  - Con más de un día: una casilla general, «Marcar las {n} comidas del período ({d} días)».
  - Una fila por día: casilla «**{día}** · marcar las {n} comidas» y a la derecha el enlace «Ver las {n}» (o «Ver la comida»), que despliega una casilla por comida: «{hora} · Comida del plan» o «{hora} · Comida fuera del plan», con « · «{descripción}»» si la tiene.
  - Cada casilla de grupo dice su estado: « · sin marcar», « · todas marcadas» o « · {m} de {n} marcadas».
  - Sin comidas: «No hay comidas registradas en el período.»
- Después de marcar algo, un plegable «Lo que marcaste ({n})» con cada elemento y «Quitar», y al final «Desmarcar todo».

**Errores del formulario** (arriba, bajo «Para registrar la revisión falta:», y junto a cada campo): «Elegí la evidencia que examinaste.» · «Falta la interpretación.» · «Elegí un resultado.» · «Falta el fundamento.» · «Falta la próxima acción.» (o «Describí el cierre.») · «Para reprogramar, indicá la fecha de la próxima revisión.» · y los del objetivo si corresponde.

#### Qué contiene una revisión guardada (`D/contratos-nutricion.ts:494-547`)

| Dato | ¿Se ve en la lista? |
|---|---|
| Resultado | Sí |
| Fecha y hora de registro | Sí |
| Interpretación | Sí |
| Fundamento | Sí |
| Próxima acción (o cierre) | Sí |
| Si se aplicó y cuándo | Sí |
| Período revisado | **No** |
| Evidencia marcada | **No** |
| Fecha de la próxima revisión | **No** |
| Objetivo nuevo (con Cambiar objetivo) | **No** |
| Autor | **No** |

#### Cada fila de «Revisiones registradas» (líneas 357-415)

- Título: «{Resultado} · {fecha con hora}». Ejemplo: «Mantener · 19 sept 2026, 11:00 a. m.»
- La interpretación.
- Línea chica: «Fundamento: {texto} · Próxima acción: {texto}» (o «Cierre: …»).
- Si se aplicó: insignia «Aplicada» y la fecha con hora.
- Si no se aplicó: la explicación del resultado y el botón «Aplicar continuidad» («Aplicando…»).

Lista completa, la más reciente primero. **El filtro de período no la afecta.**

**Avisos al aplicar:** «Continuidad aplicada» · «Continuidad aplicada: se preparó una nueva versión del plan en borrador. La versión activa no cambió.» (con el botón «Abrir el borrador en Plan») · «Continuidad aplicada: se emitió una nueva versión del objetivo.» · «Seguimiento cerrado. La historia se conserva.» · error: «No se puede aplicar ahora: revisá si ya hay un borrador del plan o si el seguimiento cambió.»

### C.4 Piezas del Plan que entran en este inventario

Todas viven en la pestaña «Plan». Las tres primeras, dentro del editor del borrador, al tocar «Agregar ítem» en una opción de una comida (`W/nutrition/editor.tsx:533-691`).

#### El panel «Agregar ítem», de arriba hacia abajo

Corroborado en la captura `EVIDENCIA/HABITUALES/nutricion-04-buscador-con-habituales.png`.

1. «Buscar en el catálogo BE» (texto) y «Buscar».
2. Línea chica: «Catálogo BE con valores sintéticos de demostración.»
3. Recuadro «Mis habituales».
4. Resultados de la búsqueda.
5. «Crear manualmente» (botón-enlace).
6. «Importar desde Open Food Facts» (botón-enlace).
7. «Cerrar búsqueda» (botón-enlace).

Cada resultado: «{nombre} · {n} kcal cada 100 g» (o «cada 100 ml»), más « · Importado de Open Food Facts · {día}» si vino de afuera; y dos botones-enlace: «Marcar como habitual» o «Quitar de habituales», y «Elegir {nombre}». Sin resultados: «No encontramos alimentos con ese nombre.»

#### «Crear manualmente»: qué pide (`W/nutrition/editor.tsx:552-585,642-667`)

Recuadro «Crear manualmente», cinco campos y un botón:

| Campo | Tipo | Regla |
|---|---|---|
| «Nombre» | Texto | Obligatorio: «Falta el nombre del alimento.» |
| «kcal cada 100 g» | Número | Obligatorio, cero o más |
| «Proteínas (g)» | Número | Ídem |
| «Carbohidratos (g)» | Número | Ídem |
| «Grasas (g)» | Número | Ídem |

- Errores de los cuatro números: «Falta el valor cada 100 g.» · «El valor no puede ser menor que cero.» · y los avisos de número de 0.4.
- Botón: «Crear y agregar». Crea el alimento y lo suma a la opción en un solo paso.
- **Siempre es cada 100 g:** no se puede crear a mano un alimento por 100 ml (línea 575).
- No pide fibra, marca, porción ni unidad casera.
- No tiene «Cancelar» propio: se sale con «Cerrar búsqueda».

#### «Importar desde Open Food Facts»: qué pide (`W/nutrition/importacion.tsx`)

**Paso 1, consultar.** Recuadro «Importar desde Open Food Facts»:
- «Código de barras del producto», con la ayuda «Los números que figuran debajo de las barras del envase: 8, 12, 13 o 14 dígitos.»
- Botón «Consultar» («Consultando…»).
- Error de formato: «Escribí solo los dígitos del código: 8, 12, 13 o 14.»

**Paso 2, revisar.** Bloque «Candidato para revisar»:
- Ayuda plegada «Qué es un candidato»: «Esto es lo que respondió el proveedor. Todavía no está en el catálogo BE: revisalo, corregí o completá lo que haga falta, y decidí si lo incorporás.»
- Línea de procedencia: «Fuente: Open Food Facts · código {código} · Recibido el {día} · Licencia: {licencia} ({atribución}) · Si no lo resolvés, vence el {día}». El candidato vence a los 7 días (`D/integraciones.ts:15`).
- Siete campos. Cada uno muestra debajo lo que trajo el proveedor («Dato del proveedor: {valor}» o «Dato del proveedor: no vino del proveedor») y, si el profesional lo cambió, su rótulo suma « · Corregido»:

| Campo | Tipo | Detalle |
|---|---|---|
| «Nombre» | Texto | Hasta 120 |
| «Base de la composición» | Select | «Cada 100 g» · «Cada 100 ml». Si el proveedor no la declara, primero «Elegí la base» y la ayuda dice «no la declara sin ambigüedad: elegila según la etiqueta del envase» |
| «Energía (kcal)» | Número | Lo que no vino queda vacío, nunca en cero |
| «Proteínas (g)» | Número | Ídem |
| «Carbohidratos (g)» | Número | Ídem |
| «Grasas (g)» | Número | Ídem |
| «Fundamento de la decisión (opcional)» | Texto | Hasta 500 |

- Botones: «Importar a BE» (primario) y «Rechazar» (secundario).
- Nota final: «Dato de un proveedor externo, revisado por un profesional: no es un dato verificado por BE.»

**Estados:**

| Situación | Texto |
|---|---|
| El proveedor no responde | «No pudimos consultar el proveedor. Podés seguir usando el catálogo BE o cargar un alimento manualmente.» y el botón «Cargar el alimento manualmente» |
| No existe el producto | «Open Food Facts no tiene un producto con ese código de barras.» |
| Faltan datos | «Faltan datos para incorporarlo. Completá los campos marcados o rechazalo.» y, por campo: «Falta el nombre.» · «El nombre puede tener hasta 120 caracteres: acortalo antes de incorporarlo.» · «Falta la base: elegí si la composición es cada 100 g o cada 100 ml.» · «Falta energía: completalo o rechazá el candidato.» (igual con proteínas, carbohidratos y grasas) · «El valor no puede ser menor que cero.» |
| No se sabe si se guardó | «No pudimos confirmar si se resolvió. No lo cambies ni lo vuelvas a consultar: reintentá la misma decisión, o buscalo en el catálogo BE antes de importarlo de nuevo.» y el botón «Reintentar la misma decisión». Los campos quedan bloqueados |
| El candidato ya se resolvió o venció | «Este candidato ya no se puede resolver: ya se resolvió o venció. Si lo incorporaste, buscalo en el catálogo BE; si no, consultá el proveedor de nuevo.» |
| Rechazado | Aviso flotante «Rechazado. No se agregó nada al catálogo BE.» |
| Importado | Sin mensaje: el panel se cierra y el alimento aparece como ítem de la opción |

#### «Mis habituales» en Nutrición (`W/nutrition/habituales.tsx`)

- **Alimentos habituales:** recuadro «Mis habituales» dentro del panel de búsqueda, con un botón-enlace por alimento (elegirlo lo agrega). Vacío: «Todavía no marcaste alimentos habituales. Se marcan desde el buscador, con «Marcar como habitual».» Se marcan y se quitan desde cada resultado, sin confirmación.
- **Comidas habituales, guardar:** en la fila de acciones de cada comida del editor, «Guardar como habitual» abre un diálogo con ese título:
  - «Nombre» (viene con el nombre de la comida; hasta 120).
  - Si ya existe una con ese nombre: «Ya tenés una comida habitual «{nombre}»: se reemplaza por esta.», y el botón pasa a decir «Reemplazar».
  - Casilla «Conservar las cantidades como referencia», apagada, con «Apagado, las cantidades no se copian: son de cada persona. Encendido, quedan en la comida habitual como referencia y las revisás al agregarla.»
  - «Notas que se van a copiar»: lista con «Vaciar» por nota, o «No tiene notas de texto libre.»
  - Ayuda plegada «Qué se copia y quién lo ve»: «La comida habitual copia las opciones y los alimentos, no a la persona: no lleva cantidades. Al agregarla a un borrador pasa a ser de ese plan.» y «Solo vos ves tus habituales. Lo que agregás a un borrador queda en ese plan y no cambia si después editás el habitual.»
  - Botones: «Cancelar» y «Guardar la comida habitual».
  - Éxito: «Comida habitual guardada. La encontrás en «Agregar una comida habitual» y en «Plantillas y habituales».»
- **Comidas habituales, usar:** al pie de cada día tipo, el select «Agregar una comida habitual» (opciones «{nombre} · {n} alimentos · Con cantidades de referencia» o «… · Sin cantidades») y el botón «Agregar esta comida habitual». Aviso: «Comida habitual agregada al borrador. Es de este plan: revisá las cantidades y las notas.» **Si el profesional no tiene ninguna comida habitual, este bloque no se dibuja.**

#### Plantillas en Nutrición (`W/nutrition/plantillas.tsx`; `W/nutrition/plan.tsx`)

- **«Guardar como plantilla»** (botón). Está en dos lugares: bajo el plan activo y en la fila final del editor. Abre un diálogo con ese título:
  - «Nombre» (hasta 120; obligatorio) y «Descripción» (hasta 1.000).
  - Casilla «Conservar las cantidades como referencia de la plantilla», apagada, con «Apagado, las cantidades no se copian: son de cada persona. Encendido, quedan en la plantilla como referencia y las revisás al aplicarla.»
  - «Notas que se van a copiar», o «Esta versión no tiene notas de texto libre.»
  - Ayuda plegada «Qué se copia y quién lo ve»: «La plantilla copia la estructura (días tipo, comidas, opciones y alimentos), no a la persona: no lleva objetivo, cantidades ni próxima revisión.» y «Solo vos ves y aplicás tus plantillas. Si dejás BE, quedan inactivas; los planes ya creados no dependen de ellas.»
  - Botones: «Cancelar» y «Guardar la plantilla».
  - Error: «Ya tenés una plantilla con ese nombre.» Éxito: «Plantilla guardada. La encontrás en «Mis plantillas».»
- **«Empezar desde una plantilla»** (`W/nutrition/plan.tsx:132-147`). Aparece cuando hay objetivo y no hay borrador, debajo de «Crear nuevo plan» o «Crear nueva versión a partir de esta». Es un select (opciones «{nombre} · {n} comidas · Con cantidades de referencia» o «… · Sin cantidades») y el botón «Crear el borrador desde esta plantilla». Sin plantillas: «No tenés plantillas activas para aplicar.» Éxito: «Borrador creado desde la plantilla. Adaptalo a la persona antes de activarlo: no es visible para el asesorado hasta que lo actives.»
- **Nota de origen** en el borrador: «Creada desde la plantilla «{nombre}», versión {n}. El plan es de esta persona: la plantilla no cambia si lo editás.» o «Creada desde una plantilla que ya no está disponible.»
- **Regla:** un plan o una comida con opciones que vienen de una receta no se puede guardar como plantilla ni como habitual. Aviso: «Las opciones que vienen de una receta no se guardan en plantillas ni en comidas habituales. Quitalas antes, o guardá la plantilla desde un plan sin recetas.» (`W/nutrition/editor.tsx:319,411`).

### C.5 Estados de Nutrición

Los de 0.3, más:

| Dónde | Situación | Texto |
|---|---|---|
| Toda la pestaña | Un guardado fue rechazado por falta de acceso | Se retira todo y queda «No encontramos un recurso disponible para esta acción.» + «Volver» (`W/nutrition/nutricion.tsx:86-91,104`) |
| Resumen | Sin plan / sin objetivo / sin evaluaciones / sin revisión pendiente | «Todavía no hay un plan activo.» · «Todavía no hay un objetivo definido.» · «Sin evaluaciones registradas.» · «No hay una revisión pendiente.» |
| Resumen | Objetivo sin evaluación previa | «Para definir un objetivo, primero registrá una evaluación: el objetivo se relaciona con ella.» |
| Plan | Sin objetivo | «Para planificar, primero definí el objetivo en Resumen: el plan se relaciona con el objetivo vigente.» (`W/nutrition/plan.tsx:112-116`) |
| Revisiones | Seguimiento sin empezar / cerrado | «El seguimiento empieza al activar el primer plan.» · «El seguimiento nutricional está cerrado. La historia se conserva.» |
| Revisiones | Sin revisiones / sin comidas | «Todavía no hay revisiones registradas.» · «No hay comidas registradas en el período.» |

Hay un orden forzado: **evaluación → objetivo → plan → activar → revisión.** Cada paso avisa que falta el anterior.

### C.6 Datos que llegan a Resumen y a Revisiones

Resumen hace cuatro lecturas (`W/nutrition/resumen.tsx:38-51`): evaluaciones, versiones del objetivo, versiones del plan y el contexto de revisión. Revisiones lee el contexto del período y las evaluaciones (`W/nutrition/revisiones.tsx:47-54`).

**Contexto de revisión** (`D/contratos-nutricion.ts:553-567`):

| Campo | Significado | Dónde se usa |
|---|---|---|
| `period` (inicio, fin, zona) | El período mirado | «Período: … a …» |
| `objective` | Objetivo vigente (puede faltar) | Candidato de evidencia «Objetivo vigente» |
| `activePlanVersions` | Versiones del plan que rigieron en el período | Candidatos «Plan activado el …» |
| `registeredIntakes` | Comidas registradas en el período, sin las anuladas | Candidatos por día |
| `previousReviews` | Todas las revisiones | Lista |
| `process` (abierto, cerrado o inexistente) | Estado del seguimiento | Habilita el formulario |
| `pendingReview` (pendiente, desde cuándo) | Revisión pendiente | Aviso y fila del Resumen |
| `descriptiveContrast`, `missingData` | Contraste por día y días sin registro | No se usan en estas dos pestañas (son de «Registros») |

**Evaluación** (`D/contratos-nutricion.ts:73-84`): fecha del hecho, contexto, lista de datos (concepto, valor, unidad, fuente, método), notas del profesional. En Nutrición solo se muestra su fecha.

### C.7 Reglas visibles

- **Todo lo hace el profesional.** El asesorado no ve estas pestañas. De acá le llegan a su APK el plan activado y el objetivo (sin el fundamento).
- **Nada se edita ni se borra:** el objetivo se versiona, la revisión registrada es definitiva, la evaluación no se corrige. No hay «Editar» ni «Eliminar» en ninguna de las dos pestañas.
- **Abrir Revisiones no es revisar** (lo dice la nota fija).
- **Nada viene marcado ni elegido:** ni la evidencia, ni el resultado. BE no sugiere un resultado (`W/nutrition/revisiones.tsx:6-7`).
- **Registrar una revisión exige** seguimiento abierto, al menos una evidencia, interpretación, resultado, fundamento y próxima acción.
- **«Ajustar» y «Sustituir» no se pueden aplicar si ya hay un borrador del plan.**
- **Sin confirmaciones en Resumen ni en Revisiones:** ni «Registrar revisión», ni «Aplicar continuidad», ni «Guardar nueva versión» preguntan antes. En el Plan, activar una versión sí pide confirmación (`W/nutrition/editor.tsx:442-458`). La pestaña Registros no se revisó.
- La fecha de una evaluación no puede ser futura (lo rechaza la API: `API/nutricion/evaluaciones.service.ts:58`); en pantalla ese rechazo se ve como «El servicio no está disponible en este momento. Probá de nuevo más tarde.» (0.3).

### C.8 Cuánto hay en pantalla

Mismo criterio de conteo. El marco suma 9 (7 del encabezado y 2 enlaces de las migas).

**Resumen** (estimado del código, sin captura):

| Estado | Controles de la vista | Con el marco |
|---|---|---|
| Con plan activo, borrador, objetivo con historia y revisión pendiente | 4 pestañas + «Ver plan» + «Abrir borrador» + «Ir a Revisiones» + la historia plegada + 2 botones = 10 | 19 |
| Con el formulario de objetivo abierto | 4 + 4 + 9 campos + 2 botones = 19 | 28 |
| Con el formulario de evaluación abierto y 3 datos cargados | 4 + 4 + 2 + 3 × 5 + «Agregar dato» + notas + 2 botones = 29 | 38 |

**Revisiones** (contado en la captura `revision-nutricion-1440-claro.png`: 21 días y 65 comidas en el período): **74 controles.**

| Bloque | Controles |
|---|---|
| Marco | 9 |
| Enlace de retorno | 1 |
| Pestañas | 4 |
| Filtro de período | 3 |
| Evidencia: 2 de planificación y objetivo, 1 general, 21 casillas de día, 21 «Ver las {n}» | 45 |
| Interpretación | 1 |
| Resultado | 6 |
| Fundamento, próxima acción, próxima revisión | 3 |
| Botones | 2 |

- **El bloque más denso de todo el inventario es la evidencia:** dos controles por día con registros, más tres fijos. Con «Preparar la revisión» el período puede llegar a 92 días: unos 187 controles antes de llegar a «Interpretación». Si se despliega un día, suma una casilla por comida.
- Con «Cambiar objetivo» se agregan 9 campos más dentro del mismo formulario.

**Panel «Agregar ítem» abierto del todo** (estimado: 5 habituales, 5 resultados, «Crear manualmente» abierto y un candidato de Open Food Facts en revisión): 2 + 5 + 10 + 6 + 12 + 1 = **36 controles dentro de una sola opción de una sola comida.**

### C.9 Datos de ejemplo

- **Objetivo** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/generar.mjs:222-231,301-317`): 2.100 kcal por día en la etapa 1 y 1.950 en la etapa 2; proteínas 130 g, carbohidratos 220 g, grasas 65 g; distribución por comidas «Cuatro comidas.»; fundamento «Fundamento profesional sintético: decisión del profesional, sin cálculo de BE.» y, en la etapa 2, «Ajuste sintético de la etapa 2: decisión del profesional.». Otros asesorados: 1.800 y 2.000 kcal.
- **Evaluación** (`generar.mjs:215-221`): contexto «Consulta inicial sintética.»; dato «Comidas por día» = 4 «comidas», fuente «Informado por el asesorado»; notas «Notas sintéticas del profesional.»
- **Revisión** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/comprension.mjs:130-143` y la captura): «Mantener · 19 sept 2026, 11:00 a. m.»; interpretación «Interpretación sintética: registra con regularidad. No es un diagnóstico.»; «Fundamento: Fundamento sintético del profesional. · Próxima acción: Seguir con el plan vigente y revisar en tres semanas.»; «Aplicada 19 sept 2026, 11:15 a. m.»; próxima revisión 12 oct 2026.
- **Evidencia** (captura): «Plan activado el 4 sept 2026, 9:30 a. m.»; «Objetivo vigente»; «Marcar las 65 comidas del período (21 días) · sin marcar»; «19 sept 2026 · marcar las 2 comidas · sin marcar»; «26 sept 2026 · marcar las 4 comidas»; «9 oct 2026 · marcar la comida». Aviso: «Preparado por BE para esta revisión: el período va del 19 sept 2026 (la última revisión fue el 19 sept 2026) a hoy.»
- **Plan** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/escenario.mjs:49-97`): día tipo «Día habitual»; comidas «Desayuno», «Almuerzo», «Merienda», «Cena»; opciones «Avena con leche», «Tostadas con queso», «Arroz con pollo y brócoli», «Lentejas con zanahoria», «Yogur con manzana», «Salmón con papa».
- **Alimentos del catálogo, kcal cada 100 g** (`escenario.mjs:29-44`): Avena arrollada 379 · Leche descremada 35 (cada 100 ml) · Arroz blanco de grano largo, cocido 130 · Pechuga de pollo sin piel, asada 165 · Brócoli hervido 35 · Lentejas hervidas 116 · Zanahoria hervida 35 · Aceite de oliva 884 · Yogur natural 61 · Manzana 52 · Salmón atlántico, cocido 206 · Papa hervida 87 · Pan integral 247 · Queso fresco 264.
- **Open Food Facts** (`test/integration/soporte-proveedores.ts:49-64`; `API/integraciones/open-food-facts.ts:13-18`): código 7790000000017, «Galletitas de prueba», 452 kcal, 8,5 g de proteínas, 66 g de carbohidratos, 17,25 g de grasas, cada 100 g. Líquido: código 7790000000062, «Bebida de prueba», 42 kcal, 0 g, 10,6 g, 0 g, cada 100 ml. Licencia «Open Database License (ODbL) 1.0», atribución «Colaboradores de Open Food Facts».
- **Habituales** (capturas `EVIDENCIA/HABITUALES/nutricion-04-…` y `nutricion-01-…`): búsqueda «arroz»; habitual «Arroz integral»; resultados «Arroz integral · 112 kcal cada 100 g» y «Arroz blanco · 130 kcal cada 100 g»; comida habitual «Almuerzo web 81890».

### C.10 Rarezas

1. **Se pide y no se vuelve a mostrar.** En Nutrición nunca reaparecen: del objetivo, «Distribución por comidas», «Método o referencia declarada» y la evaluación de referencia; de la evaluación, todo su contenido (contexto, datos y notas: solo se ve la fecha); de la revisión, el período, la evidencia marcada, la fecha de la próxima revisión, el objetivo nuevo y el autor.
2. **El primer objetivo se abre con «Definir objetivo» y el formulario se titula «Nueva versión de objetivo».**
3. **Tres nombres para el mismo número:** «Requerimiento energético» (Resumen de Nutrición), «Requerimiento energético estimado (kcal por día)» (formulario), «… kcal por día (requerimiento energético estimado)» (ficha).
4. **Cambiar el período descarta la revisión a medio escribir** (deducido): «Ver período» recarga la vista y el formulario se vuelve a montar vacío y cerrado (`W/nutrition/revisiones.tsx:47-58,70-72`; `W/nutrition/nutricion.tsx:68-73`). Y el filtro está justo arriba del formulario.
5. **Tras registrar una revisión preparada, el formulario reaparece abierto y vacío** (deducido): con `preparar=1` todavía en la URL, la recarga lo vuelve a abrir (`W/nutrition/revisiones.tsx:107,111-114,159`).
6. **«Aplicar continuidad» es un nombre único para seis efectos distintos**, incluido cerrar el seguimiento. No hay confirmación.
7. **Las notas de ítem no se pueden escribir en el editor de Nutrición** (los ítems se crean sin nota y no hay campo; `W/nutrition/editor.tsx:288`). Por eso «Notas que se van a copiar», en los dos diálogos, dice casi siempre que no hay notas.
8. **Los botones-enlace de los resultados se ven pegados** en la captura del 30/9 («…100 gQuitar de habitualesElegir Arroz integral», «Crear manualmenteImportar desde Open Food FactsCerrar búsqueda»). No se puede determinar si sigue así en esta rama.
9. **«Crear manualmente» solo admite cada 100 g**; la importación admite además cada 100 ml.
10. **La importación exitosa no avisa nada**; el rechazo sí.
11. **Rechazos de la API que se leen como caída del servicio** (0.3): por ejemplo, una evaluación con fecha futura.
12. **«Agregar una comida habitual» es invisible** hasta que el profesional guarda la primera: no hay nada que anuncie la función en el día tipo.
13. **Los macros se muestran siempre con «g»**, aunque el contrato admite otra unidad que la web no ofrece (`W/nutrition/resumen.tsx:184-185`).

---

## D. Lo que no se pudo determinar

1. **Cómo se ve hoy lo que no tiene captura de esta rama:** Nutrición · Resumen, los formularios de evaluación y de objetivo, el panel de importación y toda el área «Información» con el marco actual. Las capturas de Información son del 22/9, con otro encabezado.
2. **Si los botones-enlace pegados de la búsqueda de alimentos siguen así** (C.10, punto 8).
3. **El orden exacto de las áreas en «Acceso actual».** Depende del orden en que la API devuelve los vínculos (el más reciente primero). En la captura es «Antropometría, Entrenamiento y Nutrición».
4. **Qué muestra Entrenamiento al volver de un pedido de contexto.** Según el código, ninguna confirmación; no se verificó en pantalla.
5. **Los comportamientos marcados como «deducido»** (A.9: 2, 6, 8; B.12: 1, 4; C.10: 4, 5) salen de leer el código, sin ejecutarlo.
6. **Si el catálogo de formularios de la base desplegada coincide con las migraciones.** Las tablas solo admiten agregar y no hay otra migración que sume versiones, pero la base no se consultó.
7. **Qué versión de la APK tiene instalada cada asesorado.** Lo dicho sobre las unidades (A.9, punto 2) vale para la APK de este worktree.
8. **Las pestañas Plan y Registros de Nutrición, y las vistas Línea de tiempo y Analizar de la ficha,** no se inventariaron: solo se leyó de ellas lo necesario para ubicar las piezas pedidas y las salidas hacia las áreas.

---

## E. Diez hechos que conviene tener presentes al dibujar

1. El asesorado no tiene nombre: es «Asesorado · 84c841».
2. No hay barra de áreas. Se entra a cada una por enlaces sueltos y se vuelve por «Volver a la ficha, donde estabas».
3. Las «tarjetas de área» no existen en esta rama: hay una tabla.
4. «Vista parcial según tu acceso actual.» es lo normal para quien trabaja una sola área.
5. El objetivo nutricional es un solo juego de cuatro números por día. No hay rangos, ni días tipo, ni metas por comida.
6. Registrar una revisión y aplicarla son dos actos; lo que se aplica cambia según el resultado.
7. La evidencia de una revisión es el bloque más cargado: dos controles por día.
8. Mucho de lo que se carga no se vuelve a mostrar (evaluación entera, parte del objetivo, parte de la revisión).
9. «Información» es un área aparte, con dos pestañas, a la que solo se llega por «Solicitar contexto» o por «Pendientes».
10. «Plantillas», «Habituales» e «Importación» no son pestañas: son piezas dentro del Plan, y la más profunda (importar) queda cuatro niveles adentro: día tipo → comida → opción → «Agregar ítem».
