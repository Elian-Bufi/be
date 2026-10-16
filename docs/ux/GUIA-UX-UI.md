# Guía de UX y UI de BE

**Estado:** vigente desde el 2026-10-01 (DL-113), ampliada el 2026-10-03 con la candidata 0.13.2 y reorganizada el
2026-10-09 con WP-DASHBOARD-COMPRENSION (en borrador, en la rama de ese paquete). A ratificar por Dirección.
**Alcance:** el website del profesional y del asesorado (`apps/web`) y la APK del asesorado (`apps/mobile`).
**Cuándo se usa:** en cada pantalla nueva y en cada cambio de una pantalla existente. Antes de abrir el PR se recorre la
[lista de control](#parte-iv--verificación-y-lista-de-control).

**Cómo está organizada.** Cada regla vale para la superficie donde está escrita y no se extiende a otra:
- [Parte I · Principios generales](#parte-i--principios-generales): valen para el website y la APK.
- [Parte II · Website profesional](#parte-ii--website-profesional): el espacio del profesional, con la ficha del asesorado
  y sus pestañas. Las reglas de la pestaña Antropometría están en su propio apartado y no se aplican al resto.
- [Parte III · APK del asesorado](#parte-iii--apk-del-asesorado): navegación, letra, figuras y láminas del teléfono. No
  se aplican al website profesional.
- [Parte IV · Verificación y lista de control](#parte-iv--verificación-y-lista-de-control).
- [Parte V · Qué cambió el 2026-10-09](#parte-v--qué-cambió-el-2026-10-09): lo que se amplió, lo que se sustituyó y dónde
  quedó cada sección de la versión anterior.
- [Lo que se sabe que falta](#lo-que-se-sabe-que-falta).

Las reglas del legajo están por encima de esta guía. Las más citadas son:
- TEST-PRJ-009: no calificar;
- RNF-ACC-001 y B10-10: accesibilidad;
- REG-06-156/158: un cálculo reproducible.

Cuando una regla de acá choca con el legajo, gana el legajo y se anota en `docs/DEUDA_LEGAJO.md`.

---

## Parte I · Principios generales

### I.1 Principios

1. **Lo que la persona viene a hacer, primero.** Arriba van el dato principal y la acción. El porqué y el «cómo se
   lee» quedan a un toque. Si una función queda debajo de tres párrafos, para la persona no existe.
2. **Plegar no es borrar.** Ningún texto que el legajo exige decir se elimina para simplificar: se pliega. Hay una
   excepción. Lo que la persona tiene que leer **antes** de un acto queda a la vista, por ejemplo consentir, revocar,
   cerrar la cuenta, anular o registrar algo que no se deshace.
3. **Ubicar, nunca calificar** (TEST-PRJ-009, RF-048). Calificar es decir si un valor está bien o mal, si mejoró o
   empeoró, o si la persona cumplió. BE no lo hace:
   - ni verde para «mejoró» ni rojo para «empeoró», ni semáforos, ni porcentajes de cumplimiento o adherencia;
   - **ni rangos normativos:** bandas de «normal», «saludable» o «ideal» que clasifican el valor de la persona (por
     ejemplo, las categorías del IMC). Esos términos los prohíbe el dominio, con prueba
     (`TERMINOS_PROHIBIDOS_DE_ANTROPOMETRIA`, `TERMINOS_PROHIBIDOS_DE_ENTRENAMIENTO`, `PALABRAS_QUE_CALIFICAN`);
   - una diferencia es una resta con signo, y solo entre valores comparables (mismo protocolo, método y unidad);
   - un hueco es «Sin dato» y un resultado que falta es «Sin calcular»; nunca cero, y nunca «—» sin explicación.

   **No es calificar, y se muestra como dato** (aclaración del 2026-10-09):
   - **un rango prescrito**, el que el profesional fijó en el plan, con su versión: «Plan: 10 a 12 repeticiones»,
     «RIR 1 a 2». Lo registrado va al lado, y su posición se dice como un hecho con signo: «dentro del rango», «−1 del
     mínimo», «+2 del máximo» (`textoDeDiferencia`), sin color de acierto o error y sin «cumplió»;
   - **un intervalo descriptivo** de lo observado o de lo leído: las fechas de un período o una etapa, la primera y la
     última observación, la banda de vigencia de un plan, el intervalo visible de un gráfico, el rango de la referencia
     del cambio relativo. Va con su n y su cobertura, y no se interpreta.
   Lo que separa las dos cosas es de dónde sale el rango: si lo fijó el profesional o lo describe el dato, se muestra;
   si clasifica a la persona contra una norma, no.
4. **Un solo lugar para cada texto.** El copy vive en el dominio (`packages/domain/src/copy-*.ts` y los módulos que
   arman texto, como `sintesis-del-resumen.ts`) y lo comparten website y APK. Se escribe en español rioplatense, con
   voseo y sin anglicismos innecesarios. Los textos que una sola pantalla usa pueden quedar en ella.
5. **Accesible por defecto.** Teclado, lector de pantalla, letra grande y contraste no son un repaso final: son parte
   de la pantalla desde el primer commit.
6. **Contexto suficiente para decidir.** Todo dato que se usa para decidir dice de dónde sale y sobre qué alcance:
   su período o su corte, su fuente, su cobertura (cuántos de cuántos), su clase (medido, reportado o calculado, con
   el método) y por qué no se compara cuando no se compara. Ese contexto es parte del dato y no se pliega (ver I.2).

### I.2 Texto

- **Una línea de explicación por bloque, como máximo, a la vista.** Lo demás va plegado:
  - en el website, `Ayuda` (`apps/web/src/components/ayuda.tsx`), un `<details>` nativo;
  - en la APK, `Ayuda` o `Desplegable` (`apps/mobile/src/ui.tsx`).
- **La línea es para la explicación, no para el contexto del dato.** Explicación es «cómo se lee», el porqué de un
  bloque o la teoría de un cálculo. El contexto que hace falta para decidir no es explicación y nunca se pliega: el
  alcance y el período, el corte («desde la revisión del 20 sept»), la fuente, la cobertura («8 de 14 días con
  cantidades»), la clase y el método, el estado (vigente, sin aplicar, borrador) y el motivo por el que algo no se
  compara. Va junto al dato, en la forma más corta que lo diga entero:
  - lo que vale para todo un bloque, una vez debajo del título (`.metadatos` en el website);
  - lo que cambia por dato, en su fila, su celda o su línea de origen («Sale de…»).
  Si ese contexto ocupa más que una línea, se acorta la redacción o se parte en una lista corta: no se esconde.
- **El título de lo plegado dice de qué trata**, por ejemplo «Qué pasa al revocar», «Cómo se arma esta lista» o
  «Con qué se calculó». No sirve «Más información». Por defecto es «Cómo se lee».
- **Varias notas seguidas van en una sola Ayuda**, no en tres. Un mismo aviso no se repite en cada bloque: se dice una
  vez donde corresponde (por ejemplo, la vista parcial va en el encabezado de la ficha).
- **Siempre a la vista:**
  - el texto de consentimiento o de efectos antes del botón que actúa;
  - las advertencias de honestidad junto a un número, por ejemplo «no es una valoración de progreso»;
  - la ayuda de un campo que hace falta para llenarlo bien, atada con `aria-describedby`;
  - los estados vacíos, con qué hacer;
  - los errores, con qué corregir (DL-104);
  - el contexto para decidir del punto anterior.
- **Palabras prohibidas.** Cada dominio tiene su lista (`terminosProhibidos…` en el dominio). La prueba
  `scripts/copy-pantallas.test.cjs` recorre el texto de las pantallas y falla si aparece alguna. La síntesis del
  Resumen tiene su propia lista (`PALABRAS_QUE_CALIFICAN`), con su prueba.
- **Números:**
  - siempre con su unidad;
  - con la precisión que declara el método, sin redondeo silencioso (REG-06-158);
  - con el separador decimal y de miles del español (`numero`, `cantidad`).

### I.3 Avisos y diálogos

| Qué pasó | Cómo se muestra | Pieza |
|---|---|---|
| Una acción salió bien | Fijo abajo, donde la persona está mirando. No mueve la página ni roba el foco. Se anuncia (`role=status`) y se puede cerrar. Se va solo cuando alcanzó a leerse: 6 s como mínimo, más según el largo. Mientras se lo mira o tiene el foco, no se va. Si trae un enlace o un botón (por ejemplo «Volver a la ficha, donde estabas»), se queda hasta que se cierra (`seQueda`, WCAG 2.2.1). | Website: `AvisoFlotante` · APK: `Aviso tipo="exito"` en su sección |
| Algo salió mal | Junto al formulario, con el foco, diciendo qué corregir y en qué campo. | `Aviso tipo="error" enfocar` (website) · `Aviso` y error por campo (APK) |
| Hay que confirmar | Diálogo **modal** centrado, con el foco adentro. Escape vuelve. La acción con efecto nunca es la opción por defecto. | Website: `DialogoDeConfirmacion` · APK: `dialogo.tsx` |
| Información de contexto | Junto a lo que explica, plegada si es larga. | `Aviso tipo="info"` / `Ayuda` |

No se usa `<dialog open>` en el flujo de la página: en el teléfono aparece arriba de todo, lejos del botón que lo
abrió. Pasó con «Registrar evaluación» en la prueba del 2026-10-01.

### I.4 Estados

Toda vista que lee datos contempla estos estados, con las piezas de `estados.tsx` (website y APK):
- **cargando:** `Cargando`. En el website es una región de estado (`role="status"`), con una marca que se detiene con
  «reducir movimiento»;
- **error con reintento:** `ErrorConReintento`, sin perder lo que la persona escribió. Dice el motivo (sin conexión,
  muchas consultas seguidas, BE no disponible) y nunca se presenta como ausencia de datos;
- **error parcial:** si falla una parte, las demás siguen, y la que falta dice «No pudimos completar esta parte» con
  su reintento;
- **vacío:** `EstadoVacio` en el website. Lleva un título que dice qué falta, una línea con qué significa y, si existe,
  la acción real que corresponde, nunca un dato inventado. Ejemplo: sin tomas, «Preparar una toma»;
- **sin acceso / acceso retirado** (B10-06): se retira entero lo del alcance afectado, no a medias. Lo de otros
  alcances sigue, con el aviso único de vista parcial. Un 404 y un «no disponible» dicen lo mismo para lo revocado y lo
  inexistente, sin decir quién retiró el acceso ni por qué;
- **conflicto:** un `VERSION_CONFLICT` dice que lo guardado cambió en otro lugar, vuelve a leer y no pisa nada; lo que
  la persona escribió o eligió se conserva, y guardarlo de nuevo es una decisión explícita;
- **respuesta tardía:** una respuesta pedida para otra persona, otro período u otro filtro se descarta;
- **sesión vencida:** vuelve a «Iniciar sesión» y lo dice, con su propio aviso. Los detalles de la APK están en III.6.

### I.5 Accesibilidad, tamaño y letra

- Teclado en todo, con el foco visible; nombres accesibles con rol y estado (expandido, seleccionada, deshabilitado,
  presionado); nada depende de pasar el puntero; el movimiento se detiene con «reducir movimiento».
- Objetivos táctiles de al menos 44 px en el website (`2.75rem`) y 48 dp en la APK, con separación entre ellos. Una
  acción de fila conserva el alto (`.boton--compacto`). Un enlace dentro de un texto o de una celda («Ver la
  planificación», «Ver la toma») sigue la línea de su texto: es la excepción «en línea» de WCAG 2.5.8 y no se agranda;
  una lista de enlaces sueltos, en cambio, sí lleva el alto (`.preguntas-del-resumen`).
- El website soporta el zoom al 200 % sin cortar texto ni desplazar la página de costado; la APK, la letra del sistema
  al máximo (III.2).
- **No se achica la letra para que entre una composición.** Si no entra, cambia la composición. Que no se corte no
  alcanza: un texto achicado al 60 % no se corta y se lee mal.

### I.6 Color y temas

- **Solo tokens:**
  - website: variables de `tokens.css` y `globals.css`;
  - APK: `tema.ts`;
  - lámina: `COLORES_DE_LA_LAMINA`.
  La prueba `scripts/contraste.test.cjs` falla con un color literal en una pantalla y mide los pares declarados.
- **El acento orienta, no decora.** Marca lo que se elige o se toca: enlaces, lo elegido, las casillas, los títulos de
  las ayudas, los puntos de un gráfico. No va en superficies, títulos ni bordes de tarjetas.
- **Contraste AA:**
  - 4,5:1 para el texto;
  - 3:1 para los bordes de los controles y los íconos que comunican.
- **Temas:**
  - website: «Azul noche», que es el predeterminado, y «Claro». Se eligen en el encabezado. La preferencia vive en el
    navegador (`localStorage`): no se guarda en la cuenta ni pasa a otros dispositivos. Cambiar de apariencia no toca lo
    escrito en un formulario;
  - APK: «Azul noche» y «Claro», elegibles en Cuenta;
  - la lámina tiene sus tres temas propios, que no cambian la apariencia del website.
- **El significado no va solo en el color.** Se dice también con forma, trazo, texto o estado accesible.

### I.7 Datos, cálculos y gráficos

- **Tabla equivalente.** Todo gráfico o figura tiene una tabla o lista equivalente, que es el camino del teclado y del
  lector de pantalla (B10-10 §11). El gráfico y la tabla salen de las mismas filas.
- **Los resultados calculados siempre llevan su método, y su naturaleza.** Calculado no es siempre estimado: un índice
  (el IMC) o una suma de pliegues medidos no son estimaciones; una ecuación de grasa corporal o de masas sí lo es, y un
  componente del somatotipo es una calificación (`claseEnPalabras`, desde la categoría de la ficha del método, DL-111).
  Sin método identificado se dice «calculado por un método», sin afirmar que estima. Dos métodos no se comparan entre
  sí, y ninguno se marca como «el bueno» (REG-06-205).
- **Medido, reportado por la persona o calculado** se distinguen en el dato, en el gráfico (por forma, no solo por
  color), en la lectura, en la tabla y en la exportación.
- **No se inventan puntos:** no se interpola, imputa ni arrastra; un hueco se dibuja como hueco; una línea no une tramos
  no comparables (cambio de protocolo, método o unidad).
- **Lo planificado no es lo registrado.** Lo previsto de un plan nunca se muestra como consumido o hecho, y una
  cantidad sin confirmar sigue sin confirmar.

---

## Parte II · Website profesional

El espacio del profesional (`/pro`): la cartera, las plantillas y recetas, y la **ficha del asesorado** con sus tres
vistas (Resumen, Línea de tiempo y Analizar) y sus pestañas de área (Nutrición, Entrenamiento, Antropometría e
Información).

### II.1 Escritorio primero

- Se diseña para **1440, 1280 y 1024 px** de ancho. A 768 y 390 px no es el objetivo, pero no se rompe: todo se apila,
  la página no se desplaza de costado y solo las tablas se desplazan dentro de su caja.
- **Lo principal de cada vista empieza en la primera pantalla a 1280 × 800:** en el Resumen, el objetivo y la
  planificación por área; en Analizar, las preguntas o la pregunta en curso; en la línea de tiempo, los filtros y los
  primeros hechos. A 1440 × 900, el Resumen muestra además la primera observación de «Para tu próxima revisión» (II.3).
  Si no entra, cambia la composición, no la letra (I.5). La regla de los 390 px de ancho vale para el website del
  asesorado y para la pestaña Antropometría (II.9 y II.10).
- **Zonas con sentido, no columnas porque sí.** En Analizar, tres zonas desde 1280 px (lo que se elige, los gráficos y
  la lectura) y dos desde 1024 px; en el Resumen, «Para tu próxima revisión» y las acciones lado a lado. La grilla
  ubica; el orden del documento y del teclado no cambia (WCAG 1.3.2 y 2.4.3).
- **Sin doble desplazamiento.** Un panel no tiene su propio desplazamiento dentro de la página: el panel de lectura
  acompaña a los gráficos sin barra propia.

### II.2 Superficies mates

- Las superficies de trabajo son **mates**: color plano de superficie (`.seccion`, `--superficie`), un borde fino
  (`--borde`) y, en Claro, una sombra mínima (`--sombra-suave`; en Azul noche, ninguna). Dentro de una sección, un
  bloque es un separador (`.subseccion`) o una superficie suave (`.panel`, `--fondo-suave`), nunca otra tarjeta con
  sombra.
- No hay vidrio, brillo, degradé ni transparencia en las superficies de trabajo. El degradé es de la cara pública
  (`.cara-publica`) y de la barra de marca. El vidrio es de la APK (III.3).
- La jerarquía la dan el tamaño, el peso y el espacio, no el color de fondo.

### II.3 Navegación transversal

- **La ficha del asesorado** (`workspace.tsx`): el nombre visible es el título (la miga ya dice «Ficha del asesorado»)
  y la identidad técnica ocupa una sola línea: el **acceso actual por área**, dicho una vez si todas las áreas están
  en el mismo estado, con «Actualizar» y la hora de la consulta.
- **El primer pantallazo responde** con quién se trabaja, qué se busca, qué cambió y qué requiere la revisión: a
  1440 × 900, el objetivo y la planificación por área (una fila por área) y la primera observación de «Para tu próxima
  revisión» se ven sin desplazarse.
- **Tres vistas en pestañas** (Resumen, Línea de tiempo, Analizar) que comparten el período, y **pestañas de área**
  para trabajar sobre el registro completo. Las migas dicen «Ficha del asesorado».
- **La dirección dice dónde se está:** se navega con el router (`ir`, `irA`), no cambiando un estado escondido. La URL
  guarda la vista, el período, los filtros, las métricas, la pregunta y la fecha elegida, **solo como identificadores,
  enumerados y fechas**. El texto que escribe la persona (una búsqueda) y los borradores no van en la URL. Atrás vuelve
  al estado anterior.
- **Ir y volver con todo:** de la ficha a una pestaña de área se pasa `volver` con la configuración de la ficha. La
  pestaña la valida con los mismos lectores de la ficha (`retornoALaFicha`: nunca sale de `/pro/advisees` del mismo
  asesorado), la conserva al cambiar de sección y ofrece «Volver a la ficha, donde estabas» (`EnlaceDeRetorno`) y la
  miga «Ficha del asesorado» con ese destino.
- **Las pestañas de cada sección van en una línea** (`Pestanas`). Si no entran, se desplazan de costado, con una sombra
  que avisa que hay más, y la elegida queda a la vista.

### II.4 Contexto suficiente para decidir

Es el principio I.1.6 en el espacio profesional. En la ficha:
- **Cada observación del Resumen** dice su área, su alcance («Desde la revisión del 20 sept» o «En el período
  seleccionado»), el hecho, de dónde sale («Sale de…») y la acción que lo profundiza. La hora de los datos se dice una
  vez para todo el bloque.
- **Cada valor** dice su cobertura en las unidades de su métrica, con un denominador que no esconde nada
  (`partesDeLaCobertura`, la misma en la tabla de etapas, «Comparar dos períodos» y los indicadores):
  - en nutrición, en días del rango, cada uno en una sola categoría: «14 días: 8 con valor · 5 sin registros · 1 con
    registros sin cantidades», cuántos de los días con valor son subtotales («de ellos, 2 son subtotales (falta algún
    dato)») y hoy, en curso, aparte («fuera de la media», o lo registrado hasta ahora si es un total). Un día sin
    registros nunca sale del denominador ni se cuenta como cero: «2 de 2 días con valor» en un rango de 14 era un
    defecto;
  - en entrenamiento y antropometría, en sesiones o tomas («6 sesiones: 5 con valor»; «3 tomas: 2 del último tramo
    comparable»), nunca en días.
  Una cobertura no es una adherencia y no lleva porcentaje. Si el plan empezó a regir dentro del período, se dice desde
  cuándo («El plan rige desde el 9 oct…»): sin eso, «1 de 90 días» se lee como 89 días sin registrar.
- **Lo vigente hoy y lo que rigió** se distinguen: «Objetivo vigente hoy · rige desde…» no es «Plan que rigió en el
  período».
- **Lo que no se compara dice por qué**, en palabras: otra unidad, otro método o protocolo, totales de duraciones
  distintas, un período sin completar.
- **El día en curso** se dice («día en curso: el valor todavía puede cambiar») y no se une a la línea del gráfico: un
  subtotal de la mañana no se lee como una caída.

### II.5 Continuidad entre resumen, análisis, origen y acción

El recorrido es: **resumen o pregunta → análisis → origen → acción → resultado → retorno**, sin perder la configuración.
- **Del Resumen al análisis:** cada observación y cada indicador abren la vista que los explica (la línea de tiempo ya
  filtrada a lo nuevo desde la revisión, con un aviso que lo dice y se quita; Analizar con la pregunta o la métrica).
- **Del análisis al origen:** un punto, una entrada o una etapa abren su registro de origen al costado
  (`PanelDeRegistro`): la comida, la sesión, la toma o la planificación de una etapa, en solo lectura y con su propia
  lectura del PDP. Al cerrarlo, la vista sigue como estaba.
- **Del origen a la acción:** las acciones están en el Resumen y en la pregunta de información («Preparar la revisión»,
  «Solicitar contexto», «Ir a la planificación»). Llevan a la pestaña del área con `volver`.
- **Ver no es revisar.** Abrir o salir de una pantalla nunca crea una revisión ni una nota. «Preparar la revisión»
  abre el formulario con el período desde la última revisión, marcado «Preparado por BE» (`AvisoDePreparacion`); la
  evidencia, la interpretación y el resultado los elige el profesional, y nada se registra hasta «Registrar revisión».
  Registrar, aplicar y activar son actos distintos y nunca se juntan.
- **La evidencia de una revisión** (`SeleccionDeEvidencia`) se marca agrupada: la planificación y el objetivo aparte, y
  los registros por día, con una casilla explícita por día y otra por el período. Nada viene marcado; el resumen dice
  lo marcado («Marcaste 12 de 73: 10 comidas de 3 días…»), cada día se abre para cambiar sus registros uno por uno y
  «Lo que marcaste» los lista con «Quitar». Marcar no es haber examinado: la casilla es la declaración del profesional,
  el texto le pide dejar marcado solo lo que miró y ningún rótulo dice «examinado». Viajan las referencias individuales
  de siempre.
- **Después de una acción:** el aviso de éxito ofrece volver a la ficha, y la ficha vuelve a leer lo afectado. Una
  escritura usa su clave de intento (idempotencia) y su versión esperada (conflicto).

### II.6 Patrones del entorno de seguimiento

- **Resumen** (`resumen.tsx`), en este orden: objetivo y planificación por área; «Para tu próxima revisión» (la síntesis
  del dominio, `sintesisDelResumen`: reglas fijas, sin IA, sin calificar, cuatro a la vista y «Ver todas» con el total
  autorizado) con las acciones al lado (preparar la revisión de cada área, analizar un cambio, solicitar contexto y
  «Empezar por una pregunta»); indicadores (hasta cuatro, por cuenta); cobertura del período y últimos hechos.
- **Preguntas antes que configuración** (`preguntas.tsx`): sin pregunta ni métricas, Analizar ofrece las preguntas
  principales y «Más preguntas». Lo que falta elegir se pide: el ejercicio, la medida y la versión nunca se eligen por
  la persona; la serie, la unidad y las dos últimas etapas se sugieren a la vista y se confirman con «Ver la respuesta».
  Lo que venía elegido y no aplica a este asesorado se dice. La pregunta resuelta tiene su encabezado con sus datos y su
  límite de interpretación. «Análisis personalizado» sigue disponible.
- **Números de versión:** la versión de un plan que ve la persona es su orden de activación (1, 2, 3…), el mismo en la
  ficha, las etapas, la línea de tiempo y la pestaña Plan. El `version` de un recurso es su token de concurrencia: no se
  muestra. Un borrador no tiene número hasta activarse («una versión nueva en borrador»).
- **Analizar** (`analizar.tsx`, `lienzo.tsx`): hasta tres métricas; paneles sincronizados por defecto; «Agrupar por»
  (cada registro, día o semana) dice qué admite cada métrica y por qué; la referencia del cambio relativo se muestra solo
  en ese modo; el título de cada panel dice la métrica completa y qué es cada punto; la lectura no depende del puntero;
  el punto elegido conserva su clase a la vista (el aro de selección rodea la marca sin taparla); el resumen en texto
  describe el intervalo visible en una lista corta.
- **Analizar según la pregunta:** con la pregunta de etapas, lo principal es la tabla A/B. La comparación a mano de dos
  períodos es una opción secundaria, plegada debajo de esa tabla («Comparar otros dos períodos, con fechas elegidas a
  mano», abierta si ya hay una en la URL); el resumen en texto se pliega como la tabla de datos, y las acciones de las
  tarjetas no se repiten debajo del gráfico. Resultados, cobertura y límites de interpretación quedan a la vista, cada
  límite una vez: el de la pregunta en su encabezado y «Coincidencia temporal: no indica causa» en el de Analizar. La
  letra no se achica.
- **Etapas** (`etapas.tsx`): dos tarjetas (A y B) con versión, fechas, duración y cómo terminaron, «Etapa anterior» y
  «Ver la planificación de esta etapa»; una tabla por métrica con el mismo criterio de resumen, su cobertura (II.4) y el
  motivo cuando no se resta. Fuera de la pregunta de etapas, las bandas del gráfico tienen su lista de etapas, que abre
  la planificación o compara con la anterior.
- **Contraste con lo indicado** (`contraste.tsx`): por serie en entrenamiento, con la prescripción de la versión que
  ejecutó cada sesión; en nutrición, una fila por comida con la opción, **el modo de registro** (confirmó las porciones
  del plan, informó las cantidades a mano, sin confirmar o una comida diferente), **lo que se comprobó frente a lo
  indicado** («Igual a lo indicado», «Distinta de lo indicado en 1 de 4 ingredientes», «No se puede comprobar: sin
  confirmar») y la versión del plan, con el contraste ingrediente por ingrediente al costado (`contrasteDeLaComida`).
  El modo no es una diferencia: unas cantidades informadas a mano pueden coincidir con la opción. Los filtros lo
  respetan: «Distintas de lo indicado» deja solo la diferencia comprobada (`QUANTITIES_DIFFER_FROM_PLAN`), y «Con
  cantidades informadas a mano» dice que pueden coincidir o no. Sin porcentaje global.
- **Línea de tiempo** (`linea-de-tiempo.tsx`): una entrada por hecho, filtros en la URL, búsqueda en el cuerpo, y desde
  la síntesis, «lo nuevo desde la revisión» con su aviso.
- **Vistas guardadas** (`vistas-guardadas.tsx`): guardan la configuración y la pregunta, nunca datos. Si llevan
  selecciones de un asesorado, lo avisan al guardar y las piden de nuevo en otro. Se retoman también desde el comienzo
  de Analizar, debajo de las preguntas, sin el formulario de guardar (no hay nada que guardar todavía).

### II.7 Estados del website profesional

Además de los de I.4:
- **Acceso actual:** si una lectura dice que un área ya no está disponible y el encabezado la mostraba activa, la ficha
  vuelve a preguntar el acceso sin vaciar la pantalla, el encabezado deja de decir «Activo» y las lecturas se repiten
  con el acceso nuevo. Una falla de red no es una revocación. Al volver a la pestaña del navegador después de un rato,
  el acceso se vuelve a preguntar (un evento, no un sondeo).
- **Lecturas de a pocas:** como mucho cuatro a la vez en la ficha (`limitarLectura`).
- **Una parte que falta va primero:** en «Para tu próxima revisión», «No pudimos completar esta parte» tiene la prioridad
  más alta; escondida detrás de «Ver todas», la síntesis parecía completa.
- **Un solo «Reintentar» trae todo lo que falló** por la misma lectura (las series y lo que hay en el período).
- **El acercamiento de un gráfico se suelta** al cambiar las métricas, el período o la pregunta: no está en la URL y no
  debe sobrevivir a otro análisis. Agrupar no lo suelta.
- **Actualizar** vuelve a leer y dice la hora de la consulta.

### II.8 Componentes y patrones del website

Viven en `apps/web/src/components/`, en `apps/web/src/app/pro/advisees/` y en `globals.css`. Antes de crear otro, se
usa uno de estos.

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `Pestanas` | Las secciones de un asesorado, en una línea. La elegida, a la vista | `<Pestanas etiqueta="Secciones de Nutrición" vistas={VISTAS} actual={vista} href={(c) => …} />` |
| `Ayuda` | Una explicación larga, plegada. Es un enlace con su marca ▸, no una caja | «Cómo se arma esta lista», «Con qué se calculó» |
| `AvisoFlotante` | El éxito de una acción, abajo. Con `seQueda` si trae una acción | «Revisión registrada» + «Volver a la ficha, donde estabas» |
| `EstadoVacio` | Lo que todavía no hay, con su paso siguiente | «Todavía no hay evaluaciones registradas» → «Preparar una toma» |
| `.metadatos` | Lo que vale para todo un bloque, dicho una vez debajo del título | «Del 12 jul al 9 oct 2026. Datos consultados a las 01:28.» |
| `.subseccion` | Un bloque dentro de una sección: un separador, no otra tarjeta | Cada área en «Objetivo y planificación» |
| `.encabezado-de-bloque` | El título de un bloque con su acción principal al lado | «Para tu próxima revisión» + «Ver todas (8)» |
| `.panel` | Un formulario que se abre en el lugar: una sola superficie | Lo que falta elegir de una pregunta |
| `.acciones--fijas` | Las acciones de un formulario largo, fijas al pie, con el estado de lo guardado | La preparación de una toma: «Todavía no se guardó.» + «Guardar» |
| `.boton--compacto` | Una acción de fila: el mismo alto táctil (44 px), menos relleno | «Actualizar» en el encabezado de la ficha |
| `.desplazable-x` | Una tabla ancha que se desplaza de costado dentro de su caja, nunca la página. Las sombras de los bordes aparecen solo si hay más, con el color de la superficie de abajo (`.seccion`, `.panel`) | La tabla de etapas; las comidas del contraste |
| `MigasDelAsesorado` + `EnlaceDeRetorno` | Volver a la ficha con su configuración | «Ficha del asesorado» y «Volver a la ficha, donde estabas» |
| `PanelDeRegistro` | El origen de un dato al costado, con su propia lectura | La comida de un punto; la planificación de una etapa |
| `ListaDePreguntas` · `ElegirParametros` · `PreguntaActiva` | Entrar por preguntas, pedir lo que falta y decir la pregunta en curso | «¿Cómo viene progresando este ejercicio?» |
| `ComparacionDeEtapas` · `EtapasDelPeriodo` | Comparar dos etapas del plan y ofrecerlas desde el gráfico | «v2 y v3» con su tabla |
| `partesDeLaCobertura` (dominio) | La cobertura de un valor resumido, la misma en todas las tablas: días por categoría en nutrición; sesiones o tomas en lo demás | «48 días: 44 con valor · de ellos, 7 son subtotales (falta algún dato) · 4 sin registros» |
| `SeleccionDeEvidencia` | La evidencia de una revisión: por día y por tipo, con casillas de grupo, lo marcado a la vista y nada marcado al abrir | «Registrar revisión» de Nutrición y de Entrenamiento |
| `.capas--en-columna` | Opciones con una explicación cada una, una por renglón | «Qué comidas ver» en el contraste de Nutrición |
| `.observacion` | Un hecho de la síntesis: área y alcance, el hecho, de dónde sale y su acción | «Nutrición · Desde la revisión del 20 sept» |
| `.tarjeta-de-pregunta` | Una pregunta como botón entero, con lo que muestra | Las preguntas principales de Analizar |
| `.aviso-de-filtro` | Un filtro que viene de otra vista, explicado y con su salida | «Lo nuevo desde la revisión…» + «Ver todo el período elegido» |

**Reglas que salieron de este trabajo:**
- **La fecha que importa nombra al registro.** La fecha de ocurrencia es lo principal. La de registro es un metadato:
  con ella sola, tres tomas registradas el mismo día se veían iguales.
- **El resultado va antes que el detalle.**
- **Una sola vez.** Lo que vale para todo un bloque se dice una vez. En una fila, solo si difiere.
- **Nombres completos a la vista.** Si un desplegable corta un nombre, el nombre elegido se repite completo.
- **Las acciones se jerarquizan por el estado real.** Una acción excepcional no va entre las principales.
- **No se pliega lo que hace falta para decidir** (I.2): requisitos de un cálculo, población en que se validó,
  advertencias, alcance, corte, cobertura y motivos. Se pliega la explicación larga.
- **La barra fija de guardado no tapa un error.** El campo enfocado y su mensaje quedan por encima de la barra.

### II.9 Pestaña Antropometría (no se extiende al resto del website)

Estas reglas son de la pestaña Antropometría del profesional y de su lámina. No valen para el dashboard ni para las
otras pestañas.
- **Lo principal, primero.** En la lámina, el orden es: qué se muestra (la toma y la hoja); enseguida, la imagen con
  «Descargar imagen»; después, los ajustes de cómo se ve; al final, la explicación. En el teléfono, la imagen entra en la
  primera pantalla; el orden del documento es el del teléfono, y el foco lo sigue.
- **Desde 1100 px (`69rem`), columnas con sentido:** las tomas, la lista a la izquierda (fija) y la abierta a la
  derecha; la lámina, lo que se elige a la izquierda y la imagen a la derecha, fija mientras se ajusta.
- **Piezas propias:** `.tomas` (elegir entre registros por su fecha de ocurrencia; el elegido, marcado por forma) y
  `.mediciones` / `.medicion__fila` (filas compactas por familia, con el valor alineado y las acciones en la fila).
- **En la toma, los cálculos van antes que las mediciones.**
- **El documento descargable y su vista previa son cosas distintas.** La imagen que se descarga (2160 × 3840) lleva
  todos los datos con sus unidades. En el teléfono, «Ver en tamaño real» la muestra a 1080 px dentro de un visor que se
  recorre con el dedo, y «Ver entera» la devuelve. El botón dice su estado (`aria-pressed`).
- **La imagen exportada se equilibra.** En Medición con el cuerpo entero, la figura arranca en 290 y mide 1390.

### II.10 Website del asesorado y cara pública

- **En el teléfono, el encabezado tiene tres renglones, no cinco:** la marca y la apariencia (la etiqueta «Apariencia»
  queda oculta a la vista, pero sigue siendo el nombre accesible); la navegación, en una sola línea; y el aviso de
  ambiente, que el 08 §33 exige siempre a la vista.
- **La acción principal de cada vista va arriba, visible sin desplazarse en 390 px de ancho.**
- **Con el teclado del teléfono abierto:** la ventana se achica (`interactive-widget=resizes-content`, en `layout.tsx`),
  una barra fija queda arriba del teclado, no detrás, y el campo enfocado se lleva por encima de la barra
  (`scroll-padding-bottom`).
- **«Mis recetas»** (website del profesional, DL-119): el cálculo se ve mientras se edita (lo hace la API) y nombra lo
  que falta; la imagen se elige, se ve antes de cargarla, se le declara la procedencia y se carga; guardar una receta
  existente crea otra versión, y los planes ya activados conservan la suya.
- **Las imágenes privadas en el website:** la CSP admite imágenes `self` y `data:`; la imagen se descarga con su acceso
  y se muestra como data URL.

---

## Parte III · APK del asesorado

### III.1 Navegación

Desde DL-117 (Dirección, 2026-10-04). El diseño completo, con la matriz de Inicio y las reglas de Atrás, está en
[INICIO-Y-NAVEGACION.md](INICIO-Y-NAVEGACION.md).
- **Barra inferior:** una cápsula flotante con cinco destinos, Inicio, Nutrición, Entrenamiento, Evolución e Información
  (`barra-de-zonas.tsx`).
  - Cada destino lleva texto **e** ícono, mide 56 dp de alto y al menos 48 de ancho, y tiene rol de pestaña con su estado
    «seleccionada».
  - El destino elegido se marca con negrita y un brillo suave detrás del ícono, no solo con color.
  - Las cinco etiquetas se ven siempre.
  - La barra se oculta mientras el teclado está abierto.
- **Cabecera única:**
  - a la izquierda, «Volver» en un detalle, o el menú auxiliar en una raíz;
  - al centro, la marca;
  - a la derecha, el avatar, que abre Cuenta.
  Volver está en la cabecera, no como enlace dentro del contenido.
- **Origen:** cada detalle vuelve a la pantalla desde la que se abrió. Desde una raíz, atrás vuelve a Inicio; desde Inicio,
  sale de la app.
- **Sin pérdidas silenciosas:** con algo escrito sin guardar, salir por la barra, la cabecera, el avatar, el menú o atrás
  pregunta antes.
- **Dónde va una función nueva:**
  - en el destino que le corresponde por dominio;
  - si no tiene lugar en la barra, en el menú auxiliar;
  - en Cuenta, solo lo que es de la cuenta.
- **Al entrar a una zona, primero se verifica y después se muestra** (candidata 0.13.2, `src/ciclo-de-lectura.ts`).
  - Ningún valor protegido aparece antes de que la API confirme el acceso en esa entrada. Mientras tanto, la pantalla
    conserva su estructura: el título y bloques del alto de lo que viene (`Cargando forma="lista"` o
    `forma="figura"`), sin valores.
  - No se muestra lo leído en una visita anterior para ahorrar la espera. Lo recordado en la sesión sirve para no
    redibujar y para conservar la selección. **No prueba que el permiso siga vigente**: un tiempo de vida en memoria no
    reemplaza la autorización.
  - Con la pantalla abierta, lo confirmado queda a la vista mientras se reconfirma: al volver del segundo plano y
    después de una escritura de la misma pantalla. Corre una línea fina sobre el borde del encabezado.
  - Un 403 o un 404 retira lo que se mostraba. Sin red, con 429 o con 5xx, lo confirmado queda con «No pudimos
    actualizar»; si no había nada confirmado, «Reintentar».
  - Una respuesta pedida antes de una escritura, de un cierre de sesión o de un cambio de cuenta no se guarda ni se
    muestra. Nada pasa de una sesión a otra.
  - Cada zona vuelve a la altura en que se la dejó cuando llega su contenido, aunque la API tarde. Si la persona mueve
    la pantalla mientras tanto, manda ella. Pasados 10 s ya no se salta (`src/altura-de-las-zonas.ts`). Tocar la zona
    en la que se está lleva al principio.
  - Una revocación hecha en otro dispositivo se conoce en el próximo contacto con la API: al entrar a una zona, al
    volver del segundo plano o al escribir.
- **Las vistas de una zona van en pestañas** (`Pestanas`, APK) cuando la zona tiene tareas distintas sobre los mismos
  datos. En «Mi evolución» son tres: Mapa corporal, Progreso e Indicadores (DL-118). Una vista sin datos no aparece y,
  si queda una sola, no hay pestañas. La pestaña elegida se recuerda en la sesión, igual que la toma elegida en el
  selector T1, T2, T3 y la medida elegida, que es la misma en el mapa, en Progreso y en los indicadores (DL-117).
  - Las pestañas son texto con una raya debajo de la elegida, de borde a borde: se distinguen de las píldoras, que eligen
    dentro de una vista. Antes, vistas y familia eran dos filas de píldoras iguales (pulido del 2026-10-04).
  - En una fila mientras entran. Si no, bajan enteras a dos filas, sin partir palabras ni achicar la letra.
- **Lo que se elige dentro de una vista va debajo de lo que la nombra.** En «Mi evolución» van la fecha de la toma y
  cuál es («Última toma» o «Toma T2»), y las tomas en chips que se desplazan de costado (la elegida queda a la vista).
  En el mapa, la familia va en píldoras compactas dentro de la lámina. En Progreso, la familia y la zona van en
  píldoras compactas sobre la lámina, y la parte del torso, dentro. Las explicaciones largas van en «Cómo se lee».
  - La cabecera no dice con qué fecha se compara: cada medida puede tener otra anterior comparable, y la fecha va en su
    tarjeta (ajuste de Dirección del 2026-10-05).

### III.2 Toque, tamaño y letra

- Objetivos de 48 dp, con separación entre ellos.
- **La pantalla soporta la letra del sistema al máximo:** sin cortar texto, sin desplazamiento horizontal, y
  `adjustsFontSizeToFit` solo en la barra inferior.
- **El contenido crece sin tope.** Solo el encabezado crece hasta 1,15: la marca no informa nada. No se desactiva
  el escalado ni se achica el texto para que entre.
- **La barra inferior crece con la letra, sin tope** (cierre del 2026-10-04). Para que entren las cinco etiquetas, el
  orden es: reparto del ancho, espacio útil (márgenes de 12, 8 o 6 dp) y alto. Si en una fila no entran con al menos el
  90 % de su tamaño, la cápsula pasa a **dos filas** (Inicio, Nutrición y Entrenamiento arriba; Evolución e Información
  abajo): es una adaptación excepcional y una decisión visual explícita. La letra baja solo como último recurso, para no
  cortar (`disposicion-de-la-barra.ts`; el tamaño efectivo, medido, en `EVIDENCIA/INICIO-Y-NAVEGACION`).
- **Cuando un componente achica texto**, se documenta su tamaño efectivo en los casos angostos y con letra grande.
- **Las opciones excluyentes van en píldoras** (`Segmentos`). Si no entran, bajan enteras a la línea siguiente:
  nunca se parte una palabra. Lo usan las preferencias visuales (la figura y los colores) y los períodos de un gráfico.
  Dentro de la lámina van compactas (`compactos`): la familia y Hombre o Mujer, con 40 dp de alto y el área de toque
  ampliada a 48.
- **Escala de letra** (`ui.tsx`). Una pantalla no inventa tamaños:
  - 26, el título de la pantalla;
  - 19, el título de una sección;
  - 17, el subtítulo;
  - 16, el texto, los campos y los botones;
  - 14, el texto secundario;
  - 12, el rótulo (`Rotulo`, en mayúsculas espaciadas).
- **Las cifras van con `Cifra`:** dígitos de ancho fijo (`tabular-nums`) y la unidad al lado, más chica y tenue. La
  unidad nunca se omite ni baja sola de línea.
- **Una fila compacta de lectura no es un objetivo táctil compacto.** Una lista puede apretar el aire entre datos, pero
  lo que se toca mide 48 dp.
  - En la figura, las filas de las tarjetas miden al menos 48 dp (`ALTO_MINIMO_DE_FILA`): crece el aire, no la letra.
  - Un área invisible puede ser más grande que su marcador, pero nunca se superpone con la de otro: si dos objetivos
    quedan casi juntos, el toque no adivina (ver la selección coordinada, III.4).
- **Si una composición no entra, cambia:** las tarjetas pasan a números; las píldoras bajan de línea; el gráfico saltea
  rótulos del eje.
- **Una figura con texto adentro se adapta a la letra** (`composicion-de-la-figura.ts`). Con la letra de la persona,
  cada fila mide lo que necesita. Si las tarjetas no entran, la figura pasa a números, que bajan en orden, y debajo va
  una lista que crece sin tope.
- Anchos de referencia: 360 dp, y 286–300 dp para los equipos chicos.

### III.3 Superficies

- **Superficies en escalones** (`tema.ts`):
  - `fondo` para la pantalla;
  - `superficie` para las tarjetas y las secciones;
  - `superficieElevada` para lo que se destaca sobre ellas: el botón secundario y las fichas de fecha. La cápsula de la
    barra tiene sus propios tokens: `barraVidrio`, `barraBorde`, `barraTexto` y `barraElegido`.
  El `borde` decorativo es un azul apagado: separa sin competir. Era un azul brillante que competía con el cian.
- **Las tarjetas sobre la figura y los indicadores son de vidrio** (`vidrio.tsx`; pulido del 2026-10-04).
  - Las separan un borde fino y translúcido (`laminaFilo`, `vidrioFilo`), un brillo arriba que se apaga a la mitad
    (`laminaBrillo`, `vidrioBrillo`) y una sombra suave. No llevan bordes fuertes.
  - En Claro no hay brillo, que sobre blanco no se vería: separan la sombra y el filo.
  - El brillo no baja el contraste del texto: la prueba de contraste lo mide sobre la mezcla.
  El vidrio es de la APK: el website profesional es mate (II.2).
- **El botón principal** es claro sobre oscuro (`botonFondo`), y el secundario es tonal, no un contorno cian.
- **Una silueta clara sobre un fondo claro lleva contorno**, con su contraste medido. En Claro, el cuerpo blanco daba de
  1,01:1 a 1,19:1 contra la lámina; el contorno (`laminaContorno`) da 4,0:1, y la prueba de contraste lo verifica.
- **El significado no va solo en el color:** un pliegue de la cara posterior se marca con el aro punteado y la palabra
  «posterior»; el destino elegido de la barra, con negrita y su estado para el lector de pantalla.

### III.4 Figuras, láminas y gráficos de Antropometría (APK)

- **La figura ubica:**
  - cada medida con valor tiene su punto (pliegue) o su anillo (perímetro) y una guía a su fila;
  - lo que no tiene valor no se dibuja.
- **Guías limpias:**
  - las filas de una tarjeta siguen la altura de sus sitios;
  - las guías no se cruzan y no pasan a menos de 14 px de otro punto;
  - en Serie, si hace falta, entran al sitio de costado.
  Lo prueba `packages/domain/src/lamina.test.ts`.
- **Un sitio nuevo en la figura:**
  - se ubica sobre la imagen con una vista de control: los seis recortes con los sitios marcados;
  - se prueba que cae sobre el cuerpo y que no pisa a otro;
  - se declara a validar por Dirección.
- **Los puntos anatómicos no se mueven para resolver cruces de guías.**
  - Un cruce se resuelve con las guías, las tarjetas, el reparto o la escala. Por ejemplo, la guía puede entrar al sitio
    de costado.
  - Que no haya cruces no prueba que el sitio esté bien ubicado: la ubicación la valida Dirección.
  - Dos sitios de caras distintas a la misma altura quedan, de frente, casi en el mismo lugar: el bíceps y el tríceps, la
    cresta ilíaca y el supraespinal. Sus guías llegan juntas, la tarjeta dice cuál es cuál y el posterior lleva su marca.
  - En el teléfono, las tarjetas se apilan por la altura media de sus sitios y los puntos se dibujan encima de las guías:
    si una guía pasa junto a otro punto, pasa por detrás.
- **En el teléfono, la figura es liviana.** Halos y aros chicos, guías finas, y una calle entre las tarjetas y el cuerpo
  para que las guías doblen afuera.
- **El encuadre de la figura en el teléfono** (`ENCUADRE`, pulido del 2026-10-04).
  - El cuerpo es grande, empieza arriba, va a la derecha y lo recorta el borde derecho, donde no hay sitios: ISAK mide
    del lado derecho de la persona, que de frente queda a la izquierda.
  - Su tamaño sale del ancho de la lámina y de los sitios posibles de la familia, no de cuántas medidas hay. Sumar
    medidas alarga la lista hacia abajo: no achica el cuerpo ni deja un hueco encima.
  - Figura, marcadores, anillos, guías y zonas de toque usan la misma transformación. Ningún centro de sitio queda fuera
    de la vista ni debajo de una tarjeta.
- **Las filas de una tarjeta tienen todas la misma forma.**
  - El nombre va a la izquierda y el valor a la derecha, en la misma línea si entran o, si el nombre es largo, en la de
    abajo. Desde DL-118, en el mapa no llevan diferencia ni gráfico chico: el cambio aparece al tocar el sitio.
  - Los valores forman una columna. Mezclar el valor al lado y debajo del nombre lo hacía saltar de un lado al otro.
- **La figura de una zona** (Progreso, `componerLaFiguraDeZona`).
  - Es la imagen del tren del compositor, con la misma transformación que la lámina: no se genera otro cuerpo ni se
    mueve ningún punto.
  - Cada sitio lleva un número, de arriba hacia abajo, y su tarjeta lleva el mismo.
  - Es una franja: la parte del tren donde están los sitios de la zona, de hasta un 30 % del alto de la pantalla
    (entre 200 y 280 dp). Donde corta el cuerpo, se desvanece en el fondo de la lámina. Los números no se achican: si no
    entran, la figura crece lo que necesitan (ajuste de Dirección del 2026-10-05).
  - Las tarjetas la siguen sin un título en el medio: se ven la figura y las primeras tarjetas juntas.
  - Los dos paneles del torso dibujan el mismo cuerpo en el mismo lugar, con el alto del panel con más números:
    cambian los sitios, no la figura.
- **Selección coordinada en la figura** (`figura-de-la-toma.tsx`).
  - Tocar una fila, o el sitio en la figura, lo elige. La fila lleva borde, el sitio lleva un aro propio, su guía se
    resalta y las demás se atenúan. Debajo va el detalle. Tocar de nuevo lo suelta.
  - En la figura, cada sitio responde hasta 24 dp de su dibujo, un objetivo de 48 dp, sin agrandar el marcador
    (`sitioTocado`). Un pliegue se mide al punto, y un perímetro, al eje de su anillo.
  - Si otro sitio queda a menos de 8 dp de diferencia, el toque no elige: la pantalla dice cuáles quedan juntos y la
    fila elige sin ambigüedad. Pasa con los que coinciden de frente: brazo relajado y contraído, tríceps y bíceps,
    cresta ilíaca y supraespinal.
  - La fila dice al lector de pantalla que es un botón y si está seleccionada.
  - La selección no mueve ningún punto: solo cambia cómo se dibujan.
- **En la APK, las tablas equivalentes** son «La figura, en lista» y «La evolución, en lista».
- **Un gráfico chico dice cómo se lee su eje.** Tiene la forma del ejemplo de Dirección del 2026-10-05:
  - los puntos van sobre fechas reales, y debajo de cada uno, su toma (T1, T2…), la del selector;
  - una línea une solo tomas seguidas del mismo grupo, y una toma sin la medida la corta;
  - tres líneas de referencia rotuladas: los extremos de la escala y el medio, redondeado;
  - los puntos son huecos, y el de la toma elegida, lleno y más grande;
  - debajo del gráfico, los valores en fila, en el orden de los puntos, con el de la toma elegida resaltado.
  No rellena huecos ni dibuja áreas, muestra un solo grupo comparable, y su ancho es el del lugar: no desborda. Si dos
  rótulos de toma no entran, se escriben el de la elegida, el último y el primero. Con una sola observación no se
  dibuja.
- **El gráfico de evolución de la APK es de puntos** (`grafico-de-evolucion.ts` y `progreso-de-una-medida.tsx`). Desde
  DL-118 va en el detalle de cada tarjeta de Progreso y de Indicadores, con el grupo comparable de la toma elegida.
  - Cada punto es una medición, sobre una escala de tiempo con las fechas civiles de la zona de la API.
  - **La línea** (Dirección, 2026-10-05) une dos puntos solo si son de tomas seguidas del período y del mismo grupo
    comparable. Usa la regla de la lámina del website (`tramosDeLaSerie`, INV-06-176/177). Una toma sin la medida, o
    con la medida en otro grupo, la corta: la visualización conserva el hueco (B10-07). No inventa puntos entre
    sesiones (ADV-10-PRJ-05) ni une tramos no comparables (ADV-10-PRJ-08).
  - Los días sin medición entre dos tomas no cortan la línea: la API los marca como huecos día por día.
  - No hay áreas ni tendencias (REG-06-166). Un día sin medición no es cero: no se dibuja, y la lista lo dice como
    «Sin dato».
  - Hasta el 2026-10-05, la guía decía que los puntos no se unían. Era una regla más estricta que el legajo.
  - Se ve una medida y un grupo comparable por vez, con el mismo protocolo, método y unidad. Si la medida tiene más de un
    grupo, se elige el grupo: nunca se mezclan en un eje.
  - El eje vertical usa la misma regla que el website (`dominioDelEjeVertical`). No fuerza el cero y tiene un margen
    de al menos una unidad del eje y del 5 %. La unidad es 1 para las medidas de 10 o más, y la décima o la centésima
    para los índices: un índice cintura/cadera de 0,84 a 0,86 va de 0,79 a 0,91, no de −1 a 2.
  - Las marcas del eje son redondas, y los rótulos del tiempo se saltean si no entran con la letra de la persona.
  - El período es el que sirve la API: los últimos 90 días o, si no tienen mediciones, el anterior con mediciones. El
    recorte a 30 o 60 días se retiró con DL-118. No hay «6 meses» ni «1 año» sin un contrato que los sostenga.
  - La última medición se distingue por forma, con un punto más grande, no por color.
  - Tocar cerca de un punto elige el más cercano. Se ven una guía vertical punteada, su valor y su detalle debajo.
    «Anterior» y «Siguiente» recorren las mediciones sin necesidad de precisión con el dedo.
  - El lector de pantalla oye un resumen (cuántas mediciones hay, entre qué fechas y cuál es la última) y recorre la
    lista equivalente. El gráfico y la lista salen de las mismas filas (`filasDelPeriodo`).
  - Estados: sin mediciones de la medida, un aviso; una sola medición, el punto, centrado en el eje vertical; muchas,
    los puntos sobre la escala; puntos cercanos, gana el más cercano y la lista los separa.
  - No hay anillo de composición corporal: mezclaría métodos (REG-06-205).
- **El cambio respecto de la anterior** (tarjetas de Progreso e Indicadores). Desde DL-118, Comparar no es un apartado.
  - Cada tarjeta compara el valor de la toma elegida con la anterior comparable, el mismo par que calcula el dominio, y
    dice su fecha («respecto del 25 jul»).
  - Con la forma del ejemplo de Dirección del 2026-10-05: el valor grande con la unidad chica y, a su derecha, el
    cambio con su flecha (↑ o ↓) y su fecha debajo. En una tarjeta angosta o con letra ×1,3 o más, el cambio va debajo
    del valor.
  - La flecha dice para dónde, no si es bueno o malo: va del mismo color hacia arriba y hacia abajo.
  - Cuando una medida no tiene con qué compararse, se dice por qué: no hay una toma anterior comparable en el período,
    o la anterior se tomó con otro protocolo, método o unidad.

### III.5 Opciones de comida, recetas e imágenes (APK)

Vale desde WP-NUTRICION-RECETAS (encargo de Dirección del 2026-10-05; DL-119 a DL-121).
- **Carrusel manual de opciones:**
  - una tarjeta por opción, con 24 dp de la siguiente a la vista; cada gesto se detiene en una tarjeta;
  - el contador «Opción n de m» y las flechas son accesibles, y las flechas se deshabilitan en los extremos;
  - no avanza solo, y con una sola opción no hay ni contador ni flechas;
  - **deslizar no registra:** registrar es un botón, «Comí esta opción»;
  - el lector de pantalla recorre solo la tarjeta a la vista.
- **La franja de macros:**
  - Calorías, Carbohidratos, Grasas y Proteínas, con las etiquetas completas;
  - en el teléfono va en dos por dos con letra ×1 y ×1,3, y en una columna con ×2 (`franja-de-macros.ts`, con los
    anchos medidos);
  - debajo dice «Estimación para las porciones del plan».
- **Un valor desconocido dice «Sin dato»**, nunca 0. Se redondea solo al mostrar, con `nutrienteParaMostrar` del dominio,
  igual en el website y en la APK.
- **Lo previsto y lo consumido no se mezclan:**
  - «Porciones del plan» se muestra en lectura y no parece un campo completado;
  - «¿Cuánto comiste?» va aparte, con «Comí las porciones del plan» desmarcada;
  - hay un campo por ingrediente: vacío no es cero, y el cero se dice con «No lo comí».
- **Las imágenes privadas:**
  - se piden con su acceso firmado, que vence en 15 minutos como máximo, y no se guardan en disco;
  - si la descarga falla, queda el ícono de respaldo, el resto sigue a la vista y se puede registrar igual;
  - el rótulo «Imagen de referencia» va con la foto de una receta, porque no mide la porción ni demuestra lo que se
    comió.

### III.6 Estados de la APK

Además de los de I.4:
- **verificando:** al entrar a una zona, `Cargando` con la forma de lo que viene (`forma="lista"` o `"figura"`): la
  estructura queda quieta y no aparece ningún valor hasta que la API confirma;
- **actualizando:** con datos confirmados a la vista, no se vuelve a «Cargando…». Corre la línea del encabezado, que
  queda quieta con «reducir movimiento». Si el pedido falla de forma pasajera, `SinActualizar` dice «No pudimos
  actualizar», muestra lo confirmado y deja reintentar;
- **sesión vencida:** solo un código de sesión cierra la sesión: un 403, un 429, un 5xx o la falta de red, nunca.
  - El aviso de vencimiento se muestra solo con un vencimiento comprobado: la API dijo `SESSION_EXPIRED`, o pasó la
    vigencia que la API informó al iniciar sesión, medida desde la hora del servidor.
  - La duración que dice el aviso sale de esa vigencia, no de una constante copiada.
  - **La sesión guardada** (DL-012, decidida el 2026-10-03). Si Android cerró el proceso, al abrir se lee la credencial
    del almacenamiento seguro y se verifica con la API antes de mostrar nada. Mientras tanto, «Verificando tu sesión
    guardada…», sin datos de ninguna cuenta. Si la API la acepta, la app sigue; si dice que venció o que no sirve, se
    borra y se va a «Iniciar sesión» con su aviso; sin red, con 429 o con 5xx, «No pudimos verificar tu sesión», con
    «Reintentar» e «Iniciar sesión de nuevo»; sin credencial guardada, la bienvenida, sin hablar de vencimiento.
  - Un token guardado no es una sesión autorizada, y no se promete recordar una sesión que no se pudo guardar: Cuenta
    dice si quedó guardada.

---

## Parte IV · Verificación y lista de control

### IV.1 Lista de control por pantalla

Se copia en la descripción del PR y se marca. Se marcan los puntos generales y los de la superficie de la pantalla.

**Contenido (todas)**
- [ ] Lo primero que se ve es el dato principal o la acción.
- [ ] A la vista hay como máximo una línea de explicación por bloque; lo demás está en una Ayuda con título.
- [ ] El contexto para decidir está a la vista junto al dato: alcance o corte, fuente, cobertura, clase y método,
  estado y motivo de lo que no se compara.
- [ ] Ningún texto exigido por el legajo se borró; lo que se lee antes de actuar está a la vista.
- [ ] Ningún número está calificado: ni semáforos, ni cumplimiento, ni rangos normativos. Un rango prescrito o un
  intervalo descriptivo se muestra como dato (I.1.3). Los huecos dicen «Sin dato» y los cálculos que faltan, «Sin
  calcular».
- [ ] Toda cobertura cuenta en las unidades de la métrica: en nutrición, los días del rango, sin sacar del denominador
  los días sin registros; en sesiones y tomas, nunca días (II.4).
- [ ] Pasa `node --test scripts/copy-pantallas.test.cjs`: ninguna palabra prohibida.
- [ ] Español rioplatense, con voseo.

**Interacción (todas)**
- [ ] Los éxitos son flotantes; los errores, junto al campo y con el foco.
- [ ] Las confirmaciones son modales y la acción con efecto no es la opción por defecto.
- [ ] Los objetivos táctiles miden al menos 44 px o 48 dp.
- [ ] Abrir o salir de una pantalla no crea nada (revisiones, notas, borradores).

**Accesibilidad y visual (todas)**
- [ ] Con teclado se alcanza todo y el foco se ve.
- [ ] El lector de pantalla anuncia nombre, rol y estado: expandido, seleccionada, deshabilitado.
- [ ] Usa solo tokens: pasa `node --test scripts/contraste.test.cjs`.
- [ ] Los dos temas se ven bien.

**Website profesional**
- [ ] Se ve bien a 1440, 1280 y 1024 px; a 768 y 390 no se rompe ni desplaza la página de costado.
- [ ] Superficies mates: sin vidrio, brillo ni degradé en el área de trabajo.
- [ ] La URL guarda el estado solo con identificadores; atrás y «Volver a la ficha» recuperan la configuración.
- [ ] Del resumen se llega al análisis, al origen y a la acción, y de vuelta, sin perder lo elegido.
- [ ] Sin doble desplazamiento.

**APK**
- [ ] Funciona en 360 dp sin desplazamiento horizontal, y con la letra al máximo.
- [ ] No agrega accesos fuera de la barra, el menú auxiliar y Cuenta.

**Verificación**
- [ ] Se miró la pantalla de verdad: captura del website con datos sintéticos, o maqueta y después teléfono, para la APK.
- [ ] El informe separa lo verificado por automatización de lo que falta probar con personas (teléfono, lector de
  pantalla).

### IV.2 Cómo se verifica

| Qué | Cómo | Quién |
|---|---|---|
| Tipos, copy y contraste | `npx tsc --noEmit` (website y APK) y `node --test scripts/*.test.cjs` | CI y ejecutor |
| Reglas del dominio (síntesis, etapas, preguntas, clases) | pruebas del dominio (`comprension-del-dashboard.test.ts` y las de cada módulo) | CI y ejecutor |
| Geometría de la figura y la lámina | pruebas del dominio (`lamina.test.ts`) y recortes de control | ejecutor |
| Recorrido del website profesional | puppeteer con datos sintéticos, en un entorno aislado; capturas a 1440, 1280 y 1024 px en los dos temas (y 768 y 390 para ver que no se rompe) | ejecutor |
| Accesibilidad del website | axe, teclado y el árbol de accesibilidad del navegador; el lector de pantalla, con una persona (NVDA o Narrador) | ejecutor y **Dirección** |
| Pantallas de la APK | maquetas HTML con la misma composición que la APK (`composicion-de-la-figura.ts`), con la escala de letra simulada y en los dos temas. Se rotulan «MAQUETA · NO ES LA APK» | ejecutor |
| Uso real | la APK publicada, en el teléfono, con la letra al máximo (obligatoria) y en los dos temas. TalkBack: no realizado, por decisión de Dirección | **Dirección** |

La automatización no reemplaza la prueba de una persona. Un informe nunca dice «todo validado» si esa prueba no se
hizo.
- Ninguna maqueta demuestra el comportamiento de la APK.
- Una CI verde no es una aprobación visual ni una prueba en Android.
- Axe y el teclado no reemplazan a un lector de pantalla.

---

## Parte V · Qué cambió el 2026-10-09

La guía se reorganizó en tres partes con WP-DASHBOARD-COMPRENSION. Ninguna garantía de accesibilidad, permisos,
integridad de datos o manejo de errores se quitó: las reglas de la APK y de Antropometría se movieron a su parte sin
cambios, y las del website profesional se ampliaron.

### V.1 Pautas ampliadas, aclaradas o sustituidas

| Pauta | Antes | Ahora | Tipo |
|---|---|---|---|
| Una línea de contexto | «Una línea de contexto por bloque, como máximo, a la vista. Lo demás va plegado.» Chocaba con «No se pliega lo que hace falta para decidir» (§10). | Una línea de **explicación** por bloque. El contexto para decidir (alcance, corte, fuente, cobertura, clase y método, estado, motivo de lo que no se compara) no es explicación y nunca se pliega; va junto al dato, corto y entero (I.2). | Aclarada |
| Contexto suficiente para decidir | Implícito en §10. | Principio general (I.1.6) y patrón del profesional (II.4). | Ampliada |
| La acción principal a la vista | «Visible sin desplazarse en 390 px de ancho», para todo el website. | En el profesional, lo principal de cada vista empieza en la primera pantalla a 1280 × 800, y a 1440 × 900 el Resumen muestra además la primera observación de la síntesis (II.1, II.3); la regla de los 390 px queda para el website del asesorado y la pestaña Antropometría (II.9, II.10). | Sustituida en el profesional |
| Anchos de referencia | Website: 390 y 1280 px. | Profesional: 1440, 1280 y 1024 px; 768 y 390 no se rompen (II.1). APK: 360 dp (III.2). | Sustituida en el profesional |
| Superficies | Escalones y vidrio, escritos para la APK, sin regla para el website. | Website profesional: mates (II.2). El vidrio queda en la APK (III.3). | Ampliada |
| Navegación del website | Una pestaña por dominio y el router. | Navegación transversal: ficha, tres vistas, pestañas de área con retorno validado y migas «Ficha del asesorado» (II.3). | Ampliada |
| Continuidad | No había. | Resumen o pregunta → análisis → origen → acción → retorno, sin crear nada al abrir (II.5). | Nueva |
| Estados | Cargando, error, vacío, acceso retirado, sesión. | + error parcial, conflicto, respuesta tardía (I.4); acceso actual y lecturas de a pocas en el profesional (II.7). El acceso retirado se aclara: se retira entero lo del alcance afectado. | Ampliada |
| Resultados calculados | Llevan su método. | Llevan su método y su naturaleza: calculado no es siempre estimado (I.7). | Ampliada |
| Preguntas de análisis | Presets que tomaban el primer ejercicio del período. | Preguntas profesionales con parámetros elegidos de forma explícita (II.6). Los presets se retiraron. | Sustituida |
| Reglas de Antropometría y del teléfono | Mezcladas en §4, §5, §7 y §10. | En su parte: II.9 (pestaña Antropometría) y III (APK). No se extienden al dashboard. | Reorganizada |
| Objetivos táctiles de 44 px | Website, para todo objetivo. | Se conservan en el profesional aunque sea de escritorio; una acción de fila usa `.boton--compacto`, que conserva el alto. Un enlace dentro de un texto o de una celda sigue la excepción «en línea» de WCAG 2.5.8 (ya era así en las pantallas; la regla no lo decía) (I.5). | Aclarada |
| Números de versión | No había regla: la ficha numeraba con el token de concurrencia y la pestaña Plan, por orden de activación. | El número para la persona es el orden de activación, el mismo en todas las pantallas; un borrador no tiene número (II.6). | Nueva |
| No achicar la letra | En §5, con ejemplos de la APK (tarjetas, píldoras, figura). | La misma regla en I.5, con un caso del website: para que la síntesis entre en la primera pantalla cambió la composición de la tabla de objetivo y planificación, no la letra. | Sin cambio de fondo |

**Pasada de corrección y usabilidad del 2026-10-09 (pedido de Dirección sobre el PR #154):**

| Pauta | Antes | Ahora | Tipo |
|---|---|---|---|
| Ubicar, nunca calificar | «Ni semáforos, ni rangos»: se podía leer como que no se muestra ningún rango, aunque el dominio ya decía «dentro del rango» o «−1 del mínimo» frente a lo prescrito. | Prohibido: semáforos, cumplimiento y rangos normativos que clasifican a la persona («normal», «ideal»). Se muestran como dato: el rango prescrito por el profesional, con la posición de lo registrado dicha con signo, y los intervalos descriptivos de lo observado o leído (I.1.3). Las garantías del dominio no cambian. | Aclarada |
| Cobertura de un valor | «n = 8 de 14 días con valor»; en nutrición, el denominador de la tabla de etapas y de «Comparar dos períodos» eran los días con registros. | Los días del rango, cada uno en una categoría (con valor, sin registros, con registros sin cantidades, hoy en curso) y los subtotales entre los días con valor; en sesiones y tomas, nunca días (II.4). | Corregida |
| Evidencia de una revisión | Una casilla por registro (70 en un período de nutrición). | Por día y por tipo, con casillas de grupo, lo marcado a la vista, nada marcado al abrir; marcar no es haber examinado (II.5). | Nueva |
| Contraste de Nutrición | Un filtro «que no registraron las porciones del plan» que mezclaba el modo con una diferencia. | El modo de registro y la diferencia comprobada, en columnas y filtros separados (II.6). | Aclarada |
| Analizar con la pregunta de etapas | La comparación a mano, el resumen en texto y la lista de etapas, todo abierto debajo de los gráficos; tres veces el mismo límite. | La tabla A/B primero; la comparación a mano, plegada debajo de ella; el resumen en texto plegado; cada límite, una vez (II.6). | Ampliada |

### V.2 Dónde quedó cada sección de la versión anterior

Para las citas a esta guía por número de sección en otros documentos:

| Antes | Ahora |
|---|---|
| §1 Principios | I.1 (con el principio 6 nuevo) |
| §2 Texto | I.2 |
| §3 Avisos y diálogos | I.3 |
| §4 Navegación · APK | III.1 |
| §4 Navegación · Website | II.3 (profesional), II.9 (lámina de Antropometría) y II.10 (teléfono) |
| §5 Toque, tamaño y letra | I.5 (general), III.2 (APK) y II.10 (teclado del teléfono en el website) |
| §6 Color y temas | I.6 (general), III.3 (escalones, vidrio y silueta de la APK) |
| §7 Figuras, láminas y gráficos | III.4 (APK y Antropometría) e I.7 (tabla equivalente y método, generales) |
| §7 bis Opciones de comida, recetas e imágenes | III.5 (APK) y II.10 («Mis recetas» e imágenes en el website) |
| §8 Estados | I.4 (general), II.7 (profesional) y III.6 (APK) |
| §9 Lista de control por pantalla | IV.1 |
| §10 Componentes y patrones del website | II.8 (y II.9 para `.tomas` y `.mediciones`) |
| §11 Cómo se verifica | IV.2 |
| §12 Lo que se sabe que falta | Lo que se sabe que falta |

---

## Lo que se sabe que falta

Son las mejoras de UX detectadas que todavía no entraron. Cada una entra en un tramo cuando Dirección la prioriza.
- **El lector de pantalla en el website profesional** no se probó con una persona: en el equipo de trabajo no hay NVDA ni
  JAWS, y Narrador no se puede manejar ni escuchar de forma automática. Se verificaron el árbol de accesibilidad del
  navegador, axe y el teclado (ver la evidencia de WP-DASHBOARD-COMPRENSION); el guion para la prueba con Narrador o
  NVDA está en su guía de demostración.
- **La figura del teléfono, en el tronco.** Los halos se achicaron en la candidata 0.13.2, y con la letra grande la
  figura pasa a números. Falta mirarlo en el teléfono. Con números y letra ×2, algunas guías de pliegues todavía se
  cruzan, porque los sitios no se mueven.
- **Letra al máximo en un Android físico** (RNF-ACC-001): obligatoria en la próxima prueba del teléfono. **TalkBack:**
  no realizado, por decisión de Dirección.
- **En la figura, los sitios que coinciden de frente no se eligen tocando el dibujo**: brazo relajado y contraído,
  tríceps y bíceps, cresta ilíaca y supraespinal. Se eligen desde su fila. Las filas de 48 dp sumaron dos cruces de
  guías con la letra normal: de 8 a 10 en los ocho casos medidos (`EVIDENCIA/PULIDO-0.13.2/apk-maquetas`).
- **Recargar el website cierra la sesión** (DL-012): la sesión vive en memoria.
- **La sesión guardada de la APK no se probó en un Android** (DL-012). Las pruebas automáticas usan un almacén falso:
  que el valor cifrado sobreviva al cierre del proceso se comprueba en el teléfono con la APK 0.13.2.
- **El texto de la imagen exportada se ve chico en un teléfono.** El lienzo es de 1080 px; equilibrarlo no lo agranda.
  Para inspeccionarla, la vista previa tiene «Ver en tamaño real». Agrandar la letra del documento exige recomponer las
  tarjetas.
- **Con la letra grande, la imagen de la lámina no entra en la primera pantalla del teléfono**: empieza a 974 px en 360
  y en 390 px de ancho. Con la letra normal sí entra (605 y 578 px).
- **Búsqueda por texto** en los catálogos externos (DL-098).
- **La barra inferior de la APK en un teléfono chico.** En el render del navegador, a 320 dp: una fila con la letra de
  siempre, a 11,5 sp (un 4 % menos); dos filas desde ×1,15, enteras hasta ×1,8; con ×2, la fila de arriba queda a 21,8 sp
  en vez de 24 (`EVIDENCIA/INICIO-Y-NAVEGACION`). Falta mirarlo en un teléfono chico, y con la letra del fabricante (por
  ejemplo, la de Samsung), que puede ser más ancha que Roboto.
- **Los filtros de «Pendientes» en el teléfono** ocupan una pantalla antes del primer pendiente.
- **Un 503 intermitente de la API** (`P2028`: la transacción no pudo empezar a tiempo) con lecturas concurrentes y poca
  memoria. La pantalla lo muestra con su reintento. Es de la API, no de la interfaz. La mejora medida y el límite que
  queda están en `EVIDENCIA/P2028`; la ficha profesional lee de a cuatro (II.7).
- **Las demás pantallas del website.** Siguen esta guía desde DL-113. Las que se toquen después se revisan con la lista
  de control.
