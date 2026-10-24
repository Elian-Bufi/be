# Guía de UX y UI de BE

**Estado:** vigente desde el 2026-10-01 (DL-113), ampliada el 2026-10-03 con la candidata 0.13.2 y reorganizada el
2026-10-09 con WP-DASHBOARD-COMPRENSION (en borrador, en la rama de ese paquete). Desde el 2026-10-10 la amplía
WP-ESCRITORIO-AMABLE, también en borrador (V.3). El 2026-10-18 la cambia DL-145 (el espacio profesional sin vueltas: II.11).
A ratificar por Dirección.
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
  quedó cada sección de la versión anterior. En V.3, lo que cambia con WP-ESCRITORIO-AMABLE.
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
  - lo que cambia por dato, en su fila, su celda o su línea de origen.
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
  - siempre con su unidad. En una lista de valores que comparten la unidad, se dice una vez, en el título de la
    columna o del grupo («Pliegues cutáneos · mm»): no se omite, se dice una vez. El nombre accesible de cada valor la
    lleva igual (II.9);
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
abrió. Pasó con «Registrar evaluación» (hoy, «Registrar toma») en la prueba del 2026-10-01.

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
  - website: «Azul noche», que es el predeterminado, y «Claro». Se eligen en el menú de la cuenta, en la esquina del
    encabezado (II.3). La preferencia vive en el navegador (`localStorage`): no se guarda en la cuenta ni pasa a otros
    dispositivos, y el menú lo dice. Cambiar de apariencia no toca lo escrito en un formulario;
  - APK: «Azul noche» y «Claro», elegibles en Cuenta;
  - la lámina tiene sus tres temas propios, que no cambian la apariencia del website.
- **Una sola paleta por apariencia, la misma en el website y en la APK:** las medidas el 2026-09-30. «Claro» es fondo
  `#f2f6fc`, tarjetas blancas y azul `#1e6bf2`; «Azul noche», fondo `#011325`, tarjetas `#052238` y cian `#27d5f9`.
  En Claro, el website lleva cuatro colores de texto (secundario, enlace, error y éxito) un punto más oscuros que los
  medidos: los pone también sobre el velo azul de la cara pública, donde el valor medido no llegaba a 4,5:1.
- **El texto secundario de Azul noche es gris azulado** (`#a3b1c2`), desde el 2026-10-15: el celeste de la paleta
  medida (`#8dcae5`) se confundía con los enlaces y el tema quedaba de un solo color. El cian queda para enlaces, acentos
  y datos. Lo pidió la crítica de diseño y lo aprobó Dirección. La APK conserva el celeste hasta su próxima versión.
- **Un solo botón secundario** en el website: fondo de tarjeta, borde de 1 px gris medio y texto en peso 600. Uno lleno
  por vista; uno apagado, gris neutro. Las píldoras de estado y las etiquetas, livianas: no tienen que parecer botones.
- **El cian no es color de texto sobre fondo claro.** Marca el encabezado y lo elegido sobre azul profundo; un texto
  de acento usa el color de los enlaces, que sí está medido.
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
- **Todas las marcas de un gráfico son puntos.** La métrica se reconoce por su color **y por su nombre:** en el
  encabezado de su gráfico o, cuando varias comparten uno, al final de su línea. La forma del punto dice el estado del
  dato (lleno, hueco, de contorno cortado, con un punto adentro), no la métrica.
- **Lo planificado y lo registrado van en el mismo gráfico cuando están en la misma unidad.** Lo registrado, con línea
  continua y puntos; lo planificado, con línea discontinua del mismo color, sin puntos. Sin porcentajes, sin un área
  entre las dos y sin una diferencia calculada. Lo que el gráfico dibuja está también en la lectura, en la tabla y en
  el resumen en texto.
- **Un día sin registros lleva un gris leve** en un gráfico diario, y la línea se corta ahí. No es un cero. El día en
  curso no se sombrea. Si varias métricas comparten el gráfico, se sombrean los días sin registros en todas. La
  muestra del gris acompaña a la cuenta («4 sin registros») solo donde el gráfico sombrea.
- **No se inventan puntos:** no se interpola, imputa ni arrastra; un hueco se dibuja como hueco; una línea no une tramos
  no comparables (cambio de protocolo, método o unidad).
- **Lo planificado no es lo registrado.** Lo previsto de un plan nunca se muestra como consumido o hecho, y una
  cantidad sin confirmar sigue sin confirmar.

### I.8 Íconos

Desde WP-ESCRITORIO-AMABLE hay una sola familia: 105 dibujos de un solo trazo, datos del dominio
(`packages/domain/src/iconos.ts`). El website los dibuja con `Icono` (`apps/web/src/components/icono.tsx`); la APK
todavía usa los suyos. Qué simboliza cada uno y dónde va está en
`EVIDENCIA/ESCRITORIO-AMABLE/diseno/iconos/CATALOGO.md`.

- **Un ícono acompaña a una palabra; no la reemplaza.** Con su texto al lado es decorativo y el lector de pantalla no
  lo recorre. Si va solo (un botón que es solo el ícono), lleva un nombre que dice lo que hace, no lo que se ve:
  «Quitar Pollo», no «cruz».
- **No tiene color propio.** Toma el del texto que acompaña, y es el mismo dibujo en Claro y en Azul noche. Ningún
  ícono dice un estado por su color.
- **Un dibujo quiere decir una sola cosa.** La manzana es Nutrición y los cubiertos son una comida; la gota queda
  reservada para el agua. Antes de usar uno para algo nuevo se mira el catálogo.
- **Ninguno califica:** no hay estrellas, medallas, pulgares, caritas ni rachas (lo cuida `iconos.test.ts`), y una
  tilde no va al lado de un dato, porque se leería como «cumplió».
- **Tamaños:** 24 px en un título de área, 20 en filas y botones, 18 en pestañas y enlaces, 15 dentro de una
  etiqueta. El objetivo táctil lo da el control, no el dibujo.
- **Se elige mirándolo en su lugar:** dentro del control donde va a vivir, a su tamaño real y en los dos temas. Suelto
  y grande, casi cualquier dibujo parece correcto.

---

## Parte II · Website profesional

El espacio del profesional (`/pro`): la cartera, las plantillas y recetas, y la **ficha del asesorado** con sus tres
vistas (Resumen, Línea de tiempo y Analizar) y sus pestañas de área (Nutrición, Entrenamiento, Antropometría e
Información).

### II.1 Escritorio primero

- Se diseña para **1440, 1280 y 1024 px** de ancho. A 768 y 390 px no es el objetivo, pero no se rompe: todo se apila,
  la página no se desplaza de costado y solo las tablas se desplazan dentro de su caja.
- **Lo principal de cada vista empieza en la primera pantalla a 1280 × 800:** en el Resumen, las tarjetas por área, con
  su objetivo y su plan; en Analizar, las preguntas o la pregunta en curso; en la línea de tiempo, las vistas con nombre
  y los primeros días; en el Espacio profesional, los pendientes y el directorio. A 1440 × 900, el Resumen muestra las
  tres tarjetas enteras y el valor de cada indicador (II.3); la línea de tiempo, seis días enteros con todos sus hechos;
  y el Espacio profesional, sus dos tarjetas enteras con siete pendientes (II.6). Si no entra, cambia la composición,
  no la letra (I.5). La regla de los 390 px de ancho vale para el website del asesorado (II.10). La pestaña Antropometría
  la dejó con la parte 9 de WP-ESCRITORIO-AREAS: la carga de una toma, con la figura y sus campos, es de escritorio, y en
  un teléfono pasa a una lista (II.9).
- **Zonas con sentido, no columnas porque sí.** En Analizar, una barra arriba (la pregunta, las métricas y los modos)
  y, debajo, los gráficos y la lectura lado a lado desde 1024 px; en el Resumen, una tarjeta por área, lado a lado, y
  debajo los indicadores. La grilla ubica; el orden del documento y del teclado es el que se ve (WCAG 1.3.2 y 2.4.3).
- **A la vista, lo que se usa siempre; a un clic, lo que se usa a veces.** Una vista no muestra todas sus opciones
  abiertas: las de uso ocasional van en un panel que se despliega («Más acciones») o en un pie de enlaces que abre una
  cosa a la vez. Nada se quita: se decide dónde queda.
- **Sin doble desplazamiento.** Un panel no tiene su propio desplazamiento dentro de la página: el panel de lectura
  acompaña a los gráficos sin barra propia. **Una excepción, escrita:** el detalle de un hecho de la línea de tiempo.
  Se abre al costado y acompaña mientras la lista se desplaza; si es más alto que la ventana (la planificación entera de
  una versión, una toma con todas sus mediciones), se desplaza adentro. Sin eso, al tocar un hecho de abajo el detalle
  quedaba fuera de la vista. Es lo que ya hacía el panel que se abría encima.

### II.2 Superficies mates

- Las superficies de trabajo son **mates**: color plano de superficie (`.seccion`, `--superficie`), un borde fino
  (`--borde`) y, en Claro, una sombra mínima (`--sombra-suave`; en Azul noche, ninguna). Dentro de una sección, un
  bloque es un separador (`.subseccion`) o una superficie suave (`.panel`, `--fondo-suave`), nunca otra tarjeta con
  sombra.
- No hay vidrio, brillo, degradé ni transparencia en las superficies de trabajo. El degradé es de la cara pública
  (`.cara-publica`) y de la barra de marca. El vidrio es de la APK (III.3).
- La jerarquía la dan el tamaño, el peso y el espacio, no el color de fondo.

### II.3 Navegación transversal

- **La barra de marca** (`encabezado.tsx`) ocupa **un renglón** (65 px a 1440, 1280, 1024 y 768): la marca, los lugares
  de trabajo y, en la esquina, el menú de la cuenta. En una tablet de pie (641 a 1023 px) el botón de la cuenta va sin
  su palabra y, si los lugares no entran, se desplazan de costado dentro de su línea. La navegación nunca se parte en
  dos. La barra no lleva avisos fijos: el de ambiente de prueba salió por decisión de Dirección del 2026-10-10 y se
  dice donde alguien puede cargar datos por primera vez (II.10).
- **El menú de la cuenta** (`menu-de-cuenta.tsx`) es **el lugar de las opciones de la persona.** Un solo botón, con el
  lugar del retrato, abre «Datos de la cuenta», la apariencia y «Cerrar sesión». Sin sesión, el botón dice
  «Apariencia» y abre solo eso. Una opción nueva de configuración entra ahí: no se le suma otro control a la barra.
  «Cuenta» no es un lugar de trabajo: por eso no está en la navegación del profesional.
- **Un panel que se despliega** (el período, el menú de la cuenta) se abre con su botón, que dice si está abierto
  (`aria-expanded`). Lo cierran Escape, que devuelve el foco al botón; tocar fuera; y salir de él con el teclado: el
  foco no puede quedar detrás de un panel (WCAG 2.2, 2.4.11).
- **El marco de la ficha** (`workspace.tsx`; WP-ESCRITORIO-AMABLE): una franja de lado a lado, pegada a la barra de
  marca, con lo que no cambia al pasar de una vista a otra. Tiene tres renglones fijos, sin depender del largo del
  nombre: (1) el nombre visible como título, «Pedir información» y, a la derecha, «Actualizar» con la hora de la
  consulta; (2) el **acceso actual por área**, dicho una vez si todas las áreas están en el mismo estado, y el aviso
  de vista parcial, cuando falta un área del profesional; (3) las tres vistas y, a la derecha, el período. La ficha no lleva
  miga: la barra de marca ya vuelve al Espacio profesional.
- **Cada vista tiene su ayuda corta; la Guía, la entera** (DL-146, 2026-10-19, sobre DL-145). «Cómo se lee esta vista»
  va en el marco, siempre en el mismo lugar (C-04), y su diálogo trae solo lo que no se deduce mirando: los renglones
  `esencial` de su `AyudaDeVista` (qué quiere decir una marca, «registrar no es aplicar», «sin dato no es cero»). Abajo,
  «Todo el detalle, en la Guía» lleva a su sección de `/pro/guia`, donde la misma ayuda se lee entera, con los detalles
  plegados (`SoloEnLaGuia`). Un renglón nuevo es esencial solo si sin él se lee mal la pantalla. Lo que depende de los
  datos que se miran («Cómo se calcula», la cobertura, el límite de una pregunta) sigue en su lugar.
- **Las pistas** (`components/pista.tsx`; los textos, en `COPY_PISTAS`): una frase al pasar el mouse por una acción o un
  título, o al llegarle con el teclado. Van donde una acción tiene efectos («Nueva versión del plan», «Registrar») o un
  término no es del oficio (el estado del acceso), no en cada etiqueta. Nunca llevan algo imprescindible para decidir
  (I.2). Cumplen WCAG 2.2 1.4.13: se puede pasar el mouse por encima, Escape las cierra, y se quedan mientras el mouse o
  el foco sigan ahí. No se usa el atributo `title` del navegador.
- **El período es un solo control.** A la vista dice qué período es, cuántos días tiene y si incluye hoy. Al abrirlo
  están los atajos (7, 30 y 90 días, y un año) y el rango propio, con dos campos de fecha. Elegir cierra el control;
  Escape también, y devuelve el foco al botón.
- **El primer pantallazo responde** con quién se trabaja, qué se busca, qué cambió y qué requiere la revisión: a
  1440 × 900 se ven sin desplazarse las tarjetas de las tres áreas (el objetivo y el plan, lo pendiente, lo nuevo
  desde su revisión y la acción) y el valor de cada indicador.
- **Tres vistas en pestañas** (Resumen, Línea de tiempo, Analizar), cada una con su ícono, que comparten el período, y
  **pestañas de área** para trabajar sobre el registro completo.
- **El marco de una pestaña de área** (`marco-del-area.tsx`; WP-ESCRITORIO-AREAS) es el de la ficha llevado a
  Nutrición, Entrenamiento, Antropometría e Información: las mismas partes, a la misma altura (140 px; 104 desde
  1.400 px, donde el acceso sube al primer renglón), para que pasar de la ficha a un área no mueva nada de lugar.
  (1) El camino de vuelta, el área como título, la persona (su nombre visible o su referencia, DL-040) y, a la
  derecha, «Actualizar» con la hora de la consulta; (2) el **acceso actual de esa área** (en
  Información, el de las tres); (3) las secciones, cada una con su ícono, y la ayuda de la vista cuando la tenga. No
  lleva miga.
  - **El camino de vuelta está siempre:** «Volver a la ficha, donde estabas» si se llegó desde la ficha; «Volver a la
    ficha» si no; «Volver a Entrenamiento» si se llegó desde ahí.
  - **«Actualizar» vuelve a leer todo lo que la sección muestra.** Si hay algo escrito sin guardar, antes pregunta y
    dice qué se pierde: quien lo tiene se lo avisa al marco con `useCambiosSinGuardar`. Un formulario nuevo dentro de
    un área tiene que avisarlo.
  - **El acceso no dice «Activo» sobre algo que ya no se puede leer:** si una lectura o una escritura responde «no
    disponible», el marco vuelve a preguntar el acceso, como la ficha. Una falla no es una revocación. Nunca se dice
    quién retiró el acceso ni por qué.
  - **Una sección que todavía no se recompuso conserva su ancho** (72 rem), alineada con el marco; una recompuesta usa
    todo el ancho.
  - **Lo que una sección elige vive en la dirección:** el período, la vista y lo que está abierto. Como «Actualizar»
    vuelve a montar la sección, lo que quede en su memoria se pierde: una sección recompuesta lo lleva a la dirección
    (`ir`, del contexto del área), y «Actualizar» y volver atrás lo conservan. Al cambiar de sección no se lleva.
  - **Cada sección lleva su ayuda corta** en el marco, y su pista en la pestaña (DL-146): la entera está en la Guía.
- **La dirección dice dónde se está:** se navega con el router (`ir`, `irA`), no cambiando un estado escondido. La URL
  guarda la vista, el período, los filtros, las métricas, la pregunta y la fecha elegida, **solo como identificadores,
  enumerados y fechas**. El texto que escribe la persona (una búsqueda) y los borradores no van en la URL. Atrás vuelve
  al estado anterior.
- **Ir y volver con todo:** de la ficha a una pestaña de área se pasa `volver` con la configuración de la ficha. La
  pestaña la valida con los mismos lectores de la ficha (`retornoALaFicha`: nunca sale de `/pro/advisees` del mismo
  asesorado), la conserva al cambiar de sección y ofrece «Volver a la ficha, donde estabas» en su marco, delante del
  título.
- **Las pestañas de cada sección van en una línea** (`Pestanas`). Si no entran, se desplazan de costado, con una sombra
  que avisa que hay más, y la elegida queda a la vista.

### II.4 Contexto suficiente para decidir

Es el principio I.1.6 en el espacio profesional. En la ficha:
- **Cada hecho del Resumen** está en la tarjeta de su área, bajo su alcance («Desde la revisión del 20 sept» o «En el
  período seleccionado»; lo pendiente es de hoy), y el renglón entero abre lo que lo profundiza. El área y el alcance
  van también escritos en cada renglón, para el lector de pantalla. De dónde sale un hecho es cómo se arma, no un dato
  que cambie de un renglón a otro: se dice una vez por regla, en la Guía del espacio profesional. La hora de los datos es
  una sola, la del marco, y «Actualizar» vuelve a leer todo lo que la vista muestra.
- **La cobertura que hace falta para leer un número va junto al número:** cada indicador dice la suya, a la vista. La
  cobertura del área es un hecho más de su tarjeta, el de menor prioridad: queda plegada cuando el área tiene una
  revisión, con un título que dice el alcance y cuántos hechos guarda. Sin revisión, está a la vista.
- **Cada valor** dice su cobertura en las unidades de su métrica, con un denominador que no esconde nada
  (`partesDeLaCobertura`, la misma en la tabla de etapas, «Comparar dos períodos» y los indicadores):
  - en nutrición, en días del rango, cada uno en una sola categoría: «14 días: 8 con valor · 5 sin registros · 1 con
    registros sin cantidades», cuántos de los días con valor son subtotales («de ellos, 2 son subtotales (falta algún
    dato)») y hoy, en curso, aparte («fuera de la media», o lo registrado hasta ahora si es un total). Un día sin
    registros nunca sale del denominador ni se cuenta como cero: «2 de 2 días con valor» en un rango de 14 era un
    defecto;
  - en nutrición, además, **las comidas del plan** (DL-153), que son otra dimensión que los días: «3 comidas del plan
    sin registro» y «2 días sin saber qué comidas indicaba el plan». Salen del mismo contraste que la pestaña Registros.
    Una comida del plan sin ningún registro hace del día un subtotal y la lectura del día dice cuál («Sin registro:
    Cena»). Si el plan no deja saberlo (sin plan vigente, o varios días tipo sin un registro del plan que diga cuál), se
    dice «sin determinar»: no se inventan comidas esperadas. Hoy no cuenta: todavía se puede registrar. **En nutrición,
    «completo» nunca se dice «sin faltantes»:** lo registrado no es todo lo que se comió. Se dice «cada comida del plan
    registrada, con cantidades» o «registros con cantidades, sin saber qué comidas indicaba el plan»
    (`calidadEnPalabras`, del dominio, la misma en la tabla, la lectura, el origen del dato y la exportación);
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
- **Del Resumen al análisis:** cada hecho (su renglón entero) y cada indicador (su nombre) abren la vista que los
  explica: la línea de tiempo ya filtrada a lo nuevo desde la revisión, con un aviso que lo dice y se quita, o Analizar
  con la pregunta o la métrica. Un renglón con flecha abre algo; uno sin flecha, no.
- **Del análisis al origen:** un punto de un gráfico abre «De dónde sale este dato» en el lugar de la lectura, al
  costado de los gráficos (`OrigenDelDato`); una entrada de la línea de tiempo, su detalle al costado de la lista; una
  etapa, su planificación, en un panel (`PanelDeRegistro`). Siempre en solo lectura y con su propia lectura del PDP. Al
  cerrarlo, la vista sigue como estaba y el foco vuelve a lo que lo abrió. En una ventana de menos de 1200 px de ancho,
  los tres se abren encima, en el panel.
- **Del origen a la acción:** las acciones están al pie de la tarjeta de cada área («Preparar la revisión», «Preparar
  una toma»), en el marco («Solicitar contexto») y en la pregunta de información. Llevan a la pestaña del área con
  `volver`.
- **Ver no es revisar.** Abrir o salir de una pantalla nunca crea una revisión ni una nota. «Preparar la revisión»
  abre la revisión nueva con el período desde la última revisión, y la frase junto al período dice de dónde salió
  («Preparado por BE: desde tu última revisión, del 27 sept, hasta hoy.»; si el profesional elige otro, «Lo elegiste
  vos»). La evidencia, la interpretación y el resultado los elige el profesional, y la barra de abajo lo dice todo el
  tiempo: «Todavía no se registró nada. Registrar deja asentada la revisión; no cambia el plan.» Registrar, aplicar y
  activar son actos distintos y nunca se juntan.
- **La evidencia de una revisión** (`SeleccionDeEvidencia`) se marca agrupada: la planificación y el objetivo en una
  fila, y los registros en una grilla de días, con una casilla explícita por día y otra por el período («Marcar las 44
  comidas»). En Nutrición la grilla tiene todos los días del período: los que no tienen registros se ven, sin casilla.
  Nada viene marcado; el resumen dice lo marcado («Marcaste 12 de 73: 10 comidas de 3 días…»), «Ver» abre el día a todo
  el ancho para cambiar sus registros uno por uno y «Ver lo que marcaste» los lista con «Quitar». Al cambiar el
  período se quita solo lo que quedó afuera, y se dice. Marcar no es haber examinado: la casilla es la declaración del profesional,
  el texto le pide dejar marcado solo lo que miró y ningún rótulo dice «examinado». Viajan las referencias individuales
  de siempre.
- **Después de una acción:** el aviso de éxito ofrece volver a la ficha, y la ficha vuelve a leer lo afectado. Una
  escritura usa su clave de intento (idempotencia) y su versión esperada (conflicto).

### II.6 Patrones del entorno de seguimiento

- **Resumen** (`resumen.tsx`, `resumen-area.tsx`, `resumen-indicadores.tsx`): se organiza **por área**, no por tipo de
  información. Una tarjeta por área disponible, en el orden de BE, y en cada una, de arriba abajo:
  1. con qué se trabaja: el objetivo (en Nutrición, con la tira de calorías y macros, `TiraDelObjetivo`) y el plan
     vigente con lo que rigió antes en el período; en Antropometría, las tomas;
  2. lo pendiente, con su ícono y en negrita (una revisión sin aplicar, la próxima revisión acordada a una semana o
     menos, un borrador sin activar);
  3. la línea del corte («Desde la revisión del 20 sept · aplicada» y, a la derecha, la próxima acordada si no es un
     pendiente) y lo nuevo desde entonces, cada cuenta en su renglón con la cifra adelante. Son las observaciones de
     `sintesisDelResumen` (reglas fijas, sin IA, sin calificar), con sus mismas palabras (`partesDeObservacion`);
  4. la acción del área. **Un solo botón lleno en todo el Resumen:** el del área con la próxima revisión acordada más
     cercana. La fecha la fijó el profesional: BE no decide qué es urgente.
  Debajo, los **indicadores** (hasta cuatro, por cuenta): el nombre, que abre Analizar; el valor con su regla (media de
  los días con valor, mediana de las sesiones, última toma); el minigráfico; y la cobertura. Las **preguntas** van
  donde no les quitan lugar a los indicadores: al final con tres áreas, en la columna libre con dos y, con una sola,
  debajo de los indicadores, al costado de la tarjeta. «Lo último que pasó» es la pestaña «Línea de tiempo».
- **El minigráfico** (`minigrafico.tsx`, con la geometría en `geometria.ts`) dibuja lo mismo que el gráfico de Analizar,
  en chico: un punto por día, sesión o toma con valor; la línea solo dentro de un tramo comparable; huecos, los
  subtotales y el día en curso; gris, los días sin registros; y una línea punteada donde empieza a regir el primer plan
  del período. No se quita ningún punto por falta de lugar: se achica la marca. No recibe el foco ni tiene nada para
  tocar: es una imagen con su descripción. Es un dibujo propio: lo que se carga con la ficha no trae la biblioteca de
  gráficos.
- **La primera pantalla se mide, no se supone,** y se mide con datos recién generados. A 1440 × 900 entran las tres
  tarjetas y el nombre y el valor de cada indicador; en 1920 × 950, también los minigráficos, justos. Se promete lo que
  tiene margen: el alto de una tarjeta depende de cuántos hechos tenga el área. Lo que no entra se decide a propósito
  (las preguntas quedan debajo) y se anota con su medida.
- **La entrada de Analizar: «¿Qué querés mirar?»** (`preguntas.tsx`, `entrada.tsx`). Sin pregunta ni métricas, los dos
  caminos están a la vista, cada uno en su tarjeta: a la izquierda, las preguntas (una fila por pregunta, con su
  ícono; las demás en «Más preguntas») y, debajo, las vistas guardadas para retomar (una etiqueta por vista); a la
  derecha, las métricas para comparar sin pregunta, con casillas por área. Se ofrece lo que hay en el período. Marcar
  no arma nada: «Ver los gráficos» escribe las métricas en la URL. Con tres marcadas, las demás quedan apagadas y el
  pie dice por qué y qué se va a ver, con el ejercicio, la serie y la unidad. Quitar la última métrica de una
  comparación libre vuelve a la entrada.
- **Preguntas antes que configuración** (`preguntas.tsx`): lo que falta elegir en una pregunta se pide. El ejercicio,
  la medida y la versión nunca se eligen por la persona; la serie, la unidad y las dos últimas etapas se sugieren a la
  vista y se confirman con «Ver la respuesta». Lo que venía elegido y no aplica a este asesorado se dice. La pregunta resuelta es el título de la vista, con sus
  datos al lado («Cambiar los datos») y su límite de interpretación al pie de los gráficos. «Cambiar la pregunta»
  vuelve al comienzo de Analizar. Sin pregunta, el título es «Comparación libre». En la pregunta del ejercicio, sus
  datos no van al lado del título: el ejercicio, la serie y la unidad se eligen en el lugar, donde estarían las
  etiquetas de las métricas (`ParametrosDelEjercicio`). Al cambiar de ejercicio, la serie y la unidad siguen si el otro
  las tiene registradas; si no, se piden. Un dato sin otra opción va escrito, sin control.
- **Números de versión:** la versión de un plan que ve la persona es su orden de activación (1, 2, 3…), el mismo en la
  ficha, las etapas, la línea de tiempo y la pestaña Plan. El `version` de un recurso es su token de concurrencia: no se
  muestra. Un borrador no tiene número hasta activarse («una versión nueva en borrador»).
- **Analizar** (`analizar.tsx`, `lienzo.tsx`; recompuesto en WP-ESCRITORIO-AMABLE): hasta tres métricas.
  - **La barra,** en tres renglones cortos: la pregunta, que es el título de la vista, con «Cambiar la pregunta» y «Más
    acciones»; las métricas elegidas, que son también la leyenda (la muestra de su color, el nombre y quitar), con
    «Agregar una métrica» al final; y los modos, en controles segmentados: «Ver como» (Separadas, Juntas o Cambio
    relativo) y «Agrupar por» (Registro, Día o Semana). El motivo de un modo apagado se dice al costado. En «Cambio
    relativo», la referencia va en un renglón debajo, con «Cambiar la referencia».
  - **Los gráficos,** en una tarjeta: en «Separadas», uno por métrica, con las fechas una sola vez debajo del último.
    El encabezado de cada uno dice el nombre, qué es cada punto y su unidad, la muestra de lo planificado y cuántos
    días, sesiones o tomas tienen valor. Las etapas del plan van como bandas, con su nombre arriba del dibujo si entra
    en el ancho de la banda (si no, corto: «v2»; una etapa que no llega a verse no lleva nombre).
  - **La lectura,** en otra tarjeta, al costado: el valor grande y, debajo, cómo leerlo (la calidad, cuántos registros
    lo sostienen, lo planificado, la clase del dato y «Ver origen»). No depende del puntero.
  - **A un clic:** «Más acciones» (vistas guardadas, descarga, capas, intervalo con fechas, comparar dos períodos) y el
    pie de los gráficos (tabla de datos, resumen en texto, hitos de planificación, etapas y «Cómo se calcula»), que abre
    una cosa a la vez debajo de ellos. Los hitos de planificación (activaciones, objetivos y revisiones; las tomas no,
    porque en un gráfico ya son puntos) se dibujan mientras su lista está abierta. Lo desplegado es del análisis que se
    mira: se cierra al volver al comienzo de Analizar, no al cambiar una métrica o el período.
  - El punto elegido conserva su clase a la vista (el aro de selección rodea la marca sin taparla, y se ve entero
    también en el borde del gráfico); la leyenda dice solo los estados que están dibujados.
  - **El estado de una métrica va en el lugar de su gráfico:** cargando, sin acceso, sin especificación, una falla (con
    su motivo y «Reintentar») o sin nada en las fechas a la vista («no es un cero»). Lleva el nombre y el color de la
    métrica, y se reconoce por su ícono y su título, no por un color. Sin ningún gráfico todavía, la lectura dice para
    qué sirve.
  - **Un control aparece solo si hay algo para elegir, donde las métricas están fijas.** Con la pregunta del ejercicio
    no hay «Ver como», «Agrupar por» ni etiquetas de métricas: sus tres métricas tienen unidades distintas y se leen por
    sesión. El título de cada gráfico y la lectura dicen solo la métrica, y la lectura dice la sesión una vez. Donde las
    métricas se pueden cambiar, un modo que no corre queda a la vista, apagado y con su motivo.
  - **El origen de un dato** (`origen-del-dato.tsx`) ocupa el lugar de la lectura, y los gráficos siguen a la vista: la
    métrica y la fecha, el valor con su clase, qué es ese número (la frase del dominio) y sus fuentes. Las comidas de un
    día se listan en el orden en que ocurrieron, cada una con lo que aporta a esa métrica; cada fila abre su registro,
    sin pedirlo de nuevo. El total es el valor del punto. Con más de ocho fuentes (una semana) se elige cuál abrir.
    «Volver a la lectura» y Escape lo cierran.
- **Analizar según la pregunta:** con la pregunta de etapas, la respuesta entra en una pantalla: las dos tarjetas, la
  tabla A/B y un gráfico chico por métrica, cada cosa en su tarjeta (una tarjeta no va adentro de otra). Los gráficos
  grandes —con las métricas para cambiar, los modos, la lectura y su pie— quedan a un clic («Abrir estos gráficos en
  grande») y van en el lugar de los chicos; arrancan abiertos si el enlace trae otra agrupación, otro modo o una fecha
  elegida. La comparación a mano de dos períodos es una opción secundaria, plegada debajo de la respuesta («Comparar
  otros dos períodos, con fechas elegidas a mano», abierta si ya hay una en la URL). «Más acciones» se abre debajo de su
  botón. Resultados, cobertura y límites de interpretación quedan a la vista, cada límite una vez: el de la pregunta y
  «Coincidencia temporal: no indica causa» van juntos, al pie de los gráficos, chicos o grandes (o bajo el título, si
  la respuesta no tiene gráficos). La letra no se achica.
- **Etapas** (`etapas.tsx`, `etapas-en-pantalla.ts`): dos tarjetas (A y B), cada una con su letra, su versión (un
  selector, si el área tiene otra etapa para elegir: A es siempre la más antigua), desde cuándo, cómo terminó («la
  reemplazó la versión 2»), cuánto duró, su cobertura y «Ver la planificación». **La cobertura se dice una vez por
  etapa** (II.4): la que comparten más métricas, nombrando cuáles si no son todas; una métrica con otra cobertura la
  dice en su celda. La tabla tiene una fila por métrica, con el criterio debajo del nombre, el valor de cada etapa y la
  diferencia, o el motivo cuando no se resta. Fuera de la pregunta de etapas, «Comparar etapas», en el pie de los gráficos, abre la lista
  de etapas de las bandas: desde ahí se ve la planificación de cada una o se la compara con la anterior.
- **Contraste con lo indicado** (`contraste.tsx`): por serie en entrenamiento, con la prescripción de la versión que
  ejecutó cada sesión; en nutrición, una fila por comida con la opción, **el modo de registro** (confirmó las porciones
  del plan, informó las cantidades a mano, sin confirmar o una comida diferente), **lo que se comprobó frente a lo
  indicado** («Igual a lo indicado», «Distinta de lo indicado en 1 de 4 ingredientes», «No se puede comprobar: sin
  confirmar») y la versión del plan, con el contraste ingrediente por ingrediente al costado (`contrasteDeLaComida`).
  El modo no es una diferencia: unas cantidades informadas a mano pueden coincidir con la opción. Los filtros lo
  respetan: «Distintas de lo indicado» deja solo la diferencia comprobada (`QUANTITIES_DIFFER_FROM_PLAN`), y «Con
  cantidades informadas a mano» dice que pueden coincidir o no. Sin porcentaje global.
- **Línea de tiempo** (`linea-de-tiempo.tsx`; las reglas, en `dia-de-la-linea.ts` del dominio): **el día es la
  unidad.** Los hechos, los filtros de la URL y la búsqueda en el cuerpo son los de siempre; cambia cómo se leen juntos.
  - **Arriba, un renglón para elegir qué ver:** las vistas con nombre («Todo», «Hitos», «Lo nuevo desde la revisión»,
    «Distinto de lo indicado» y «Sin confirmar»), cada una con la cantidad de hechos del período que trae; el buscador;
    y «Más filtros», con la combinación libre (área, tipo de hecho, ejercicio, estado, calidad del dato y lo cargado
    otro día). Una vista con nombre es una combinación de esos filtros: elegirla reemplaza lo elegido, y la elegida va
    llena, como el segmento elegido de Analizar. Los filtros activos se listan solo si lo elegido no es una vista.
  - **Cada hecho es un renglón que se abre entero.** En el día van primero los hitos, con una barra a la izquierda;
    después las sesiones; y al final las comidas, que con dos o más van en un renglón («Comidas · 4 registradas») que
    dice cuántas tienen cada rasgo y se abre en el lugar, del desayuno a la cena. Agrupar no esconde.
  - **Un rasgo es una etiqueta con ícono y palabra,** nunca un color: sin confirmar, distinta de lo indicado, comida
    diferente, con cambios, no realizada, resumida, anulado, rectificado, corregido y cargado otro día. El modo de
    registro de siempre (porciones del plan, cantidades informadas) va como texto al final del renglón.
  - **Un día sin novedades** (solo sus comidas, sin ningún rasgo) va liso; la tarjeta queda para los días con una
    sesión, un hito o un rasgo. Entre dos días de la lista, los días sin ningún hecho se dicen con sus fechas y la
    muestra gris de los gráficos: un hueco no es un cero. Solo al mirar «Todo».
  - **Con un filtro que recorta dentro del día** (una calidad, un estado, la búsqueda, lo nuevo desde una revisión),
    cada hecho va en su renglón: un grupo no puede decir una cantidad que no es la del día. Con un texto buscado, el
    renglón dice dónde coincide si no está a la vista.
  - **El detalle** se abre al costado desde 1200 px de ancho, sin tapar la lista; más angosto, encima. Dice lo que el
    renglón ya no repite: cuándo ocurrió, cuándo se cargó y quién, qué le pasó después, sus relaciones, sus datos y el
    registro completo, con el camino a su pestaña. El foco va a su título; «Cerrar» y Escape lo devuelven.
  - **Días enteros:** la API entrega de a 50 hechos, y el último día leído espera a «Ver días anteriores».
  - **«Hito»** es todo lo que no se registra todos los días, con las tomas. Analizar dibuja los hitos de planificación
    (los mismos, sin las tomas). Los dos conjuntos salen del dominio.
- **Vistas guardadas** (`vistas-guardadas.tsx`): guardan la configuración y la pregunta, nunca datos. Si llevan
  selecciones de un asesorado, lo avisan al guardar y las piden de nuevo en otro. En un análisis están en «Más
  acciones», que se abre solo cuando se acaba de retomar una, para que su aviso se vea. Se retoman también desde el
  comienzo de Analizar, debajo de las preguntas, sin el formulario de guardar (no hay nada que guardar todavía).
- **Espacio profesional** (`pro/espacio-profesional.tsx`; las vistas de «Pendientes», en `cartera.ts` del dominio):
  **primero lo que hay que hacer y, al lado, a quién abrir.** Dos tarjetas; el formulario para pedir un vínculo y la
  lista de solicitudes enviadas se abren cuando hacen falta.
  - **El encabezado** dice el título, «Hoy» (la fecha con que la API clasificó las revisiones, con su día de la semana
    y su año) y «Solicitar vínculo».
  - **«Pendientes»** tiene vistas con nombre, como la línea de tiempo: «Todo», «Revisiones», «Planes», «Formularios» y
    «Tomas», cada una con la cantidad que trae. La cartera se lee entera al entrar y se cuenta en el navegador:
    elegir una vista no le pide nada a la API. Una vista en cero se muestra con su cero. «Más filtros» guarda la
    combinación libre: un área, un tipo exacto y el período.
  - **Cada pendiente es una fila:** la persona, el área, lo pendiente con la frase de BE y, debajo, el último registro
    como dato; «Abrir» lleva a la vista que lo resuelve. El orden es el de la urgencia, que fija la API: ningún color
    por tipo, ningún «urgente», y el último registro nunca ordena ni resalta.
  - **El período acota solo el último registro,** y lo dice. Sin período se mira toda la historia: sin ningún registro,
    «Sin registros todavía»; con período, «Sin registros en el período».
  - **El aviso de vista parcial** va debajo de las vistas: dice cómo leer sus cantidades. Al pie, la hora de la
    consulta y «Actualizar», que vuelve a leer las tres listas de la página.
  - **«Tus asesorados» es un directorio:** una persona por renglón, con su referencia y sus áreas en el orden de BE. Un
    área sin acceso lleva el candado y las palabras de BE para ese estado, no un «no disponible» para todo. Tocar a la
    persona abre el detalle de cada vínculo (finalidad, estado y desde cuándo); «Abrir» lleva a su ficha. Se busca por
    la referencia, mientras se escribe.
  - **Un diálogo con un formulario** (pedir un vínculo): el foco entra por el primer campo; Escape cierra, salvo
    mientras se envía; al enviarse se cierra y la página dice qué pasó. Un aviso que queda adentro de un diálogo
    cerrado no lo lee nadie.
  - **`/pro` no lleva parámetros:** la vista elegida, los filtros y la búsqueda son de la visita.
- **Los registros de un área, por día** (`nutrition/registros.tsx`; las reglas, en `registros-de-nutricion.ts` del
  dominio; WP-ESCRITORIO-AREAS): es la línea de tiempo llevada al registro completo de un área. **El día es la unidad**
  y, adentro, **cada comida del plan es una fila.**
  - **El día en un renglón:** «3 de 4 comidas registradas · 1 sin registro». Cuenta las comidas del plan con una opción
    registrada. Un día sin ningún registro dice «Sin registro», nunca «0 de 4»; el de hoy dice «hoy, día en curso».
    Arrancan abiertos los que tienen una comida diferente o algo distinto de lo indicado; los demás se abren a pedido.
    Plegar no esconde: el renglón dice lo que el día tiene.
  - **La fila:** la comida, lo registrado, cómo se informaron las cantidades y la diferencia observada, con las
    palabras del dominio. Los nombres de las columnas van una vez, arriba; para el lector de pantalla, cada dato lleva
    su rótulo. La fila entera abre el registro; una fila sin registro no es un botón.
  - **Una resta que da cero no es una diferencia:** no se muestra ni abre el día. Con las porciones del plan
    confirmadas no se dice «igual»: BE no comparó nada.
  - **Las vistas con nombre cuentan comidas, no registros.** Cada fila está en un solo estado (registrada, con una
    comida diferente, sin registro), y los tres suman «Todas las comidas». Una vista que depende de una lectura que
    falló no lleva número: un cero sería decir que no hay ninguna.
  - **Dos lecturas, y una puede fallar.** Si falla la que dice la opción y el modo de cada registro, los días y sus
    comidas se ven igual, y un bloque dice qué falta y por qué, con «Reintentar».
  - **El registro, al costado** desde 1200 px; más angosto, encima. El foco va a su título, y Escape o «Cerrar» lo
    devuelven a la fila. Lo que se le agrega a un registro (la estimación del profesional sobre una comida diferente)
    se hace desde ahí, no en una lista aparte.
  - **Un período largo se muestra de a catorce días;** «Ver días anteriores» no le pide nada a la API. El período de
    entrada (siete días) se muestra entero.
- **Los registros de Entrenamiento, por sesión** (`training/ejecuciones.tsx`; las reglas, en
  `registros-de-entrenamiento.ts` del dominio): el mismo patrón, con **la sesión como unidad.** No todos los días hay
  una sesión, y el plan no fija qué días se entrena.
  - **Una fila por sesión, de la más nueva a la más vieja:** el día, la sesión con su condición, cuántas series se
    registraron («7 de 10 registradas») y cómo quedaron frente a lo indicado («3 series sin registrar · 1 serie con
    diferencias», «Dentro de lo indicado»). Una sesión registrada como no realizada, o resumida, no se cuenta serie por
    serie: dice por qué no tiene series, nunca «0 de 12».
  - **El detalle es una tabla con cada serie una sola vez:** lo indicado, lo registrado y cómo quedó, agrupadas por
    ejercicio. La serie con una diferencia va en negrita y, además, su texto dice cuál es: la negrita sola no alcanza.
  - **Qué es una diferencia:** las repeticiones o el RIR por encima o por debajo de lo indicado. **La carga se dice
    aparte, en un renglón propio y sin negrita, y no cuenta:** la sugerida es un complemento, no una obligación. Un dato
    que no se registró tampoco es una diferencia: se dice («RIR: sin dato»).
  - **Dos cosas distintas, con dos nombres:** «Con diferencias» sale de comparar las series; «Con desvío o no
    realizada» es lo que la persona declaró al registrar. No se usa «Distinto de lo indicado», que en la línea de tiempo
    de la ficha ya nombra otra cosa.
  - **Con una sesión abierta, la lista y el detalle se reparten la ventana por mitades:** la tabla necesita más ancho
    que el detalle de una comida. A 1280 px las dos mitades quedan angostas: en la tabla, lo que no entra en un renglón
    baja de a una parte entera («77,5 kg · 6 rep. ·» y, abajo, «RIR 1»); en la fila, el número no se separa de lo que
    cuenta ni el separador queda al principio de un renglón; y la marca de la condición parte su texto adentro de su
    columna, sin pisar la de al lado.
  - **Lo que antes estaba todo abierto queda a un clic,** en el lugar: los descansos y la duración de cada serie, la
    sesión en el plan de ese día, el gráfico por serie y el registro original con sus correcciones. No se ofrece abrir
    lo que no hay (una sesión sin tiempos marcados lo dice en su renglón).
  - **Lo indicado es otra lectura, y puede fallar:** las sesiones se ven igual, cada una dice «No se pudo leer lo
    indicado» y la vista que depende de eso queda sin número.
  - **Un período largo se muestra de a quince sesiones.** La evolución de un ejercicio no se repite acá: está en
    Analizar, y hay un enlace que lleva.

### II.7 Estados del website profesional

Además de los de I.4:
- **Acceso actual:** si una lectura dice que un área ya no está disponible y el encabezado la mostraba activa, la ficha
  vuelve a preguntar el acceso sin vaciar la pantalla, el encabezado deja de decir «Activo» y las lecturas se repiten
  con el acceso nuevo. Una falla de red no es una revocación. Al volver a la pestaña del navegador después de un rato,
  el acceso se vuelve a preguntar (un evento, no un sondeo).
- **Lecturas de a pocas:** como mucho cuatro a la vez en la ficha (`limitarLectura`).
- **Una parte que falta va primero:** en la tarjeta de su área, «No pudimos completar esta parte» va antes que sus
  hechos, con «Reintentar». Debajo de ellos, la tarjeta parecía completa al leerla de arriba abajo.
- **Un solo «Reintentar» trae todo lo que falló** por la misma lectura (las series y lo que hay en el período).
- **Sin datos no es una falla, y una falla no es sin datos.** Una métrica que se leyó bien y no tiene nada en el
  período (una medida sin tomas, un ejercicio sin sesiones) dice «Sin tomas en estas fechas… No es un cero», sin
  «Reintentar». Una lectura que no llegó dice «No pudimos completar esta parte», con su motivo y «Reintentar».
- **El acercamiento de un gráfico se suelta** al cambiar las métricas, el período o la pregunta: no está en la URL y no
  debe sobrevivir a otro análisis. Agrupar no lo suelta.
- **Una vista que no se pudo leer** lo dice con el bloque de estado: el ícono del motivo, qué pasó («No pudimos cargar
  la línea de tiempo»), por qué y «Reintentar». Vale para la línea de tiempo, para el resumen por área y para una
  pregunta de Analizar que no se puede armar sin él. La vista parcial se avisa una sola vez, en el marco.
- **Actualizar** vuelve a leer todo lo que la vista muestra (en la línea de tiempo, desde la primera tanda) y dice la
  hora de la consulta.
- **En el Espacio profesional, cada lista falla por separado.** Si no llegan los pendientes, el bloque de estado lo
  dice con su motivo, las vistas quedan sin número y «hoy» no se dice; el directorio sigue. Una vista sin filas dice
  «Ningún pendiente coincide con lo elegido» y cuántos hay en total: «Nada pendiente con lo que BE puede saber…»
  queda para la cartera vacía.
- **Una cantidad se dice sobre una lista leída entera.** Si quedaron páginas sin leer, es «al menos» («200+»); si la
  lectura falló, no hay número.

### II.8 Componentes y patrones del website

Viven en `apps/web/src/components/`, en `apps/web/src/lib/`, en `apps/web/src/app/pro/` y en `globals.css`. Antes de
crear otro, se usa uno de estos.

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `Pestanas` | Las secciones de un asesorado, en una línea. La elegida, a la vista | `<Pestanas etiqueta="Secciones de Nutrición" vistas={VISTAS} actual={vista} href={(c) => …} />` |
| `Ayuda` | Una explicación larga, plegada. Es un enlace con su marca ▸, no una caja | «Cómo se arma esta lista», «Con qué se calculó» |
| `AvisoFlotante` | El éxito de una acción, abajo. Con `seQueda` si trae una acción | «Revisión registrada» + «Volver a la ficha, donde estabas» |
| `EstadoVacio` | Lo que todavía no hay, con su paso siguiente | «Todavía no hay tomas registradas» → «Preparar una toma» |
| `.metadatos` | Lo que vale para todo un bloque, dicho una vez junto al título | «Del 13 jul al 10 oct · describen lo registrado, sin calificar» |
| `.subseccion` | Un bloque dentro de una sección: un separador, no otra tarjeta | Cada área en la pregunta de información |
| `.encabezado-de-bloque` | El título de un bloque con su acción principal al lado | «Indicadores» + «Elegir indicadores» |
| `.panel` | Un formulario que se abre en el lugar: una sola superficie | Lo que falta elegir de una pregunta |
| `.acciones--fijas` | Las acciones de un formulario largo, fijas al pie, con el estado de lo guardado | La preparación de una toma: «Todavía no se guardó.» + «Guardar» |
| `.boton--compacto` | Una acción de fila: el mismo alto táctil (44 px), menos relleno | «Actualizar» en el encabezado de la ficha |
| `.desplazable-x` | Una tabla ancha que se desplaza de costado dentro de su caja, nunca la página. Las sombras de los bordes aparecen solo si hay más, y las tapas que las esconden llevan el color de la superficie donde está (`.seccion`, `.panel`, el detalle al costado, un diálogo): con otro color queda una franja a cada lado | La tabla de etapas; las comidas del contraste; las series de una sesión |
| `MarcoDelArea` | El marco de una pestaña de área: el camino de vuelta, de quién es, el acceso actual, «Actualizar» con la hora, las secciones con su ícono y la ayuda | «← Volver a la ficha, donde estabas · Nutrición · Asesorado · 5db647» |
| `useCambiosSinGuardar` | Avisarle al marco que hay algo escrito sin guardar, con su nombre: «Actualizar» pregunta antes de perderlo | «el plan en preparación», «la revisión» |
| `EstadoDeLecturaDelArea` · `NoDisponibleEnElArea` | El resultado de leer una sección: cargando, el «no disponible» neutral o la falla con su motivo y «Reintentar» | «No pudimos cargar esta vista · Hubo muchas consultas seguidas…» |
| `AccesoPorArea` (`acceso-por-area.tsx`) | El acceso actual por área, igual en la ficha y en el marco de un área | «Nutrición: Activo · acceso contextual» |
| `PanelDeRegistro` | Un registro encima de la vista, en un panel que retiene el foco, con su propia lectura | La planificación de una etapa; el origen de un dato o el detalle de un hecho, en una ventana angosta |
| `Panel` (`components/panel.tsx`) | Lo mismo, para cualquier contenido: el diálogo, su título y «Cerrar». `PanelDeRegistro` lo usa | El registro de una comida de Nutrición · Registros o una solicitud de Información, en una ventana angosta; una medición o un resultado de Antropometría · Tomas, en cualquier ancho |
| `ControlDePeriodo` (`advisees/control-de-periodo.tsx`) | El período en un solo control. Recibe el período, los atajos y el tope: no lee ni escribe la dirección por su cuenta | La ficha (hasta 366 días) y Nutrición · Registros (hasta 92) |
| `AyudaDeVista` · `RenglonDeAyuda` (`components/ayuda-de-vista.tsx`) | «Cómo se lee esta vista»: el botón y su diálogo, con una muestra y una explicación por renglón | La de la ficha; la de Nutrición · Registros, en el marco del área |
| `.dia-de-registros` · `.comida-del-dia` | El día de un área en un renglón que se abre, y cada comida del plan en una fila con sus columnas | «11 oct · domingo · 2 de 4 comidas registradas · 1 comida diferente» |
| `componerLosRegistros` · `resumenDeUnDia` · `contarLasVistas` (dominio) | Los días, las filas, las cantidades de las vistas y el renglón del día de Nutrición · Registros, desde sus dos lecturas | «Sin registro»; «3 de 4 comidas registradas» |
| `opcionDeUnaComida` · `modoDeUnaComida` · `frenteALoIndicadoDeUnaComida` (dominio) | Lo que la línea de tiempo dice de una comida. Una sola regla para la ficha y para Registros | «Tostadas con queso» · «Porciones del plan» · «Sin diferencia: son las porciones del plan» |
| `periodo-de-un-area.ts` (`periodoPedidoEnUnArea`, `periodoALaVista`, `cambiosDePeriodo`) | El período de los registros de un área, en la dirección: los atajos que la lectura admite (7, 30 y 90 días) y el tope de 92 | Registros de Nutrición y de Entrenamiento |
| `.sesion-registrada` · `.tabla-de-series` | Una sesión en una fila que se abre entera, y la tabla de sus series, agrupadas por ejercicio | «12 oct · A · Tren inferior · 7 de 10 registradas» |
| `.parte-de-dato` (`EnPartes`, en `components/en-partes.tsx`) | Un dato hecho de partes cortas separadas por « · », en una tabla o en una lista angosta: si no entra en un renglón, baja una parte entera, con el separador al final del renglón de arriba | «77,5 kg · 6 rep. ·» y, abajo, «RIR 1»: nunca «RIR» arriba y «1» abajo. «30 mediciones · 1 corregida ·» y, abajo, «1 anulada» |
| `FraseEnPartes` (en `components/en-partes.tsx`) | Lo mismo para frases largas, en una fila: el texto corre como cualquier otro, pero no se parte entre el número y lo que cuenta, ni antes del separador (espacios que no se parten) | «3 series sin registrar ·» y, abajo, «1 serie con diferencias»: nunca «… · 1» arriba y «serie» abajo |
| `conNumerosPegados` (en `components/en-partes.tsx`) | Lo mismo para un nombre o un renglón que trae un número adentro y no arma BE (el nombre de un método del catálogo): el número no se separa de su palabra, ni el separador baja solo | «Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri»: nunca «7» arriba y «pliegues» abajo |
| `componerLasSesiones` · `relacionDeUnaSerie` · `contarLasVistasDeSesiones` (dominio) | Las filas de Entrenamiento · Registros, cómo quedó cada serie frente a lo indicado y las cantidades de las vistas | «Dentro de lo indicado» · «RIR: por debajo» · «Carga: por encima de la sugerida» |
| `.tomas-del-area` · `.toma-de-la-lista` · `.medicion-de-la-toma` | Antropometría · Tomas: la lista en tramos de protocolo, y una medición en una fila que se abre entera, con su nombre corto, lo que se sale de lo común y el valor que rige (II.9) | «Cintura · Corregida · 84» debajo de «Perímetros · cm» |
| `.medicion-abierta` · `.historia-de-medicion` · `.cambios-de-resultados` | El contenido del panel de una medición o de un resultado: el valor grande con sus marcas, la historia de lo más nuevo a lo más viejo y lo que cambió, con el valor de ahora y el de antes | «Índice cintura/cadera 0,81 · antes 0,46» |
| `Marca` (`anthropometry/marca.tsx`) | La clase de un dato o su excepción, con su ícono y su palabra: el ícono solo no alcanza | «Medido», «Corregida», «Anulada» |
| `tramosDeProtocolo` · `medicionesPorFamilia` · `historiaDeLaMedicion` · `loQueCambio` (dominio) | Las reglas de Antropometría · Tomas: los tramos de la lista, las filas con el valor que rige, la historia por la cadena de correcciones y lo que cambió en los resultados | «30 mediciones · 1 corregida · 1 anulada» |
| `OrigenDelDato` | De dónde sale un punto de Analizar, en el lugar de la lectura: el valor, qué es y sus fuentes, con lo que aporta cada comida | «795 kcal»: Almuerzo, 311 kcal; Cena, 484 kcal |
| `useDetalleAlCostado` (`al-costado.ts`) | Si la ventana tiene lugar para un detalle al costado (desde 1200 px) | La línea de tiempo y Analizar; los Registros de Nutrición y de Entrenamiento; las Solicitudes de Información |
| `ParametrosDelEjercicio` | Los datos de una pregunta, para elegirlos en el lugar; uno sin otra opción va escrito | «Ejercicio: Peso muerto · Serie: 1 · Unidad: kg» |
| `ListaDePreguntas` · `ElegirParametros` · `PreguntaActiva` | Entrar por preguntas, pedir lo que falta y decir la pregunta en curso | «¿Cómo viene progresando este ejercicio?» |
| `ComparacionDeEtapas` · `EtapasDelPeriodo` | Comparar dos etapas del plan y ofrecerlas desde el gráfico | «v2 y v3» con su tabla |
| `partesDeLaCobertura` (dominio) | La cobertura de un valor resumido, la misma en todas las tablas: días por categoría en nutrición; sesiones o tomas en lo demás | «48 días: 44 con valor · de ellos, 7 son subtotales (falta algún dato) · 4 sin registros» |
| `SeleccionDeEvidencia` | La evidencia de una revisión: la planificación y el objetivo en una fila, los días en una grilla con casillas de grupo, lo marcado al pie y nada marcado al abrir | El paso 1 de una revisión nueva, en Nutrición y en Entrenamiento |
| `useContextoDeLaRevision` · `CabeceraDeLaRevision` · `PasoDeLaRevision` · `ResultadoDeLaRevision` · `BarraDeLaRevision` (`revision-en-preparacion.tsx`) | Una revisión nueva: el contexto del período de la dirección (sin desmontar el formulario al cambiarlo), la cabecera con el período y de dónde salió, los pasos numerados, el resultado con el efecto del elegido y la barra pegada abajo con lo que pasa al registrar | «Nueva revisión de Nutrición · En preparación · sin registrar» |
| `AyudaDeRevisiones` | «Cómo se leen las Revisiones», una para las dos áreas: cambian los registros y las frases de cada una | El botón «Cómo se lee esta vista» de Revisiones |
| `.capas--en-columna` | Opciones con una explicación cada una, una por renglón | «Qué comidas ver» en el contraste de Nutrición |
| `.observacion` | Un hecho de la síntesis, en la tarjeta de su área: un renglón entero que abre su evidencia; si es una cuenta, con la cifra adelante | «67 comidas registradas» |
| `.area` | La tarjeta de un área del Resumen: contexto, pendientes, lo nuevo desde su revisión y la acción | «Nutrición» |
| `TiraDelObjetivo` | Las calorías y los macros del objetivo del día, en el orden de la APK, cada uno con su ícono y su palabra | «Calorías 1.950 kcal · Carbohidratos 220 g · Grasas 65 g · Proteínas 130 g» |
| `Minigrafico` | El gráfico chico de la ficha: los mismos puntos y cortes que Analizar, sin interacción y sin la biblioteca de gráficos; con las etapas como bandas, las fechas al pie y lo planificado, si se le pasan | El de un indicador del Resumen; los tres de la comparación de etapas |
| `BloqueDeEstado` | Un estado dicho en el lugar de lo que falta: ícono, qué pasó, por qué y qué se puede hacer | «No pudimos completar esta parte» + «Reintentar» |
| `.tarjeta-de-pregunta` | Una pregunta como botón entero, con lo que muestra | Las preguntas principales de Analizar |
| `.aviso-de-filtro` | Un filtro que viene de otra vista, explicado y con su salida | «Lo nuevo desde la revisión…» + «Ver todo el período elegido» |
| `BotonDeVista` · `.vista-de-la-linea` | Una vista con nombre: un filtro con el nombre de lo que se busca y la cantidad que trae. La elegida va llena. La usan la línea de tiempo, «Pendientes», los Registros de Nutrición y de Entrenamiento y las Solicitudes de Información | «Hitos 19», «Revisiones 3», «Sin responder 1» |
| `.entrada` | Un hecho en un renglón que se abre entero: ícono o hora, nombre, lo que lo distingue, sus rasgos y la flecha | «Almuerzo · Arroz con pollo y brócoli · Rectificado» |
| `.grupo-de-hechos` | Lo de todos los días, junto en un renglón que dice cuánto hay y lo que tiene de distinto; se abre en el lugar | «Comidas · 4 registradas · 1 anulada» |
| `.detalle-del-hecho` | El detalle de lo elegido, al costado de su lista, sin taparla; acompaña el desplazamiento | El de un hecho de la línea de tiempo |
| `renglonDelHecho` (website) · `rasgosDeUnHecho` (dominio) | Cómo se escribe un hecho en un renglón, y qué rasgos lleva. Sale de la entrada de la API; no calcula ni completa | «Sesión A · Tren inferior · 7 series con datos» |
| `.tarjeta-del-espacio` | Una tarjeta del Espacio profesional: el ícono, el título y lo que lo acompaña, en un renglón | «Pendientes», «Tus asesorados» |
| `.persona` | Una persona del directorio: su nombre (o su referencia) y sus áreas abren el detalle de sus vínculos; al lado, «Abrir», un enlace | «Martina Gómez a9be23 · Nutrición · Entrenamiento · Antropometría» |
| `todasLasPaginas` (dominio) · `useListaCompleta` | Una lista leída entera, para contarla o buscar en ella: dice si quedó incompleta y, si falló, por qué | Los pendientes de la cartera; los vínculos de la ficha |
| `motivoDeFalla` · `razonDeFalla` · `ICONO_DE_FALLA` (`lib/fallas.ts`) | Por qué falló una lectura, con sus palabras y su ícono, en todo el website profesional | «Hubo muchas consultas seguidas. Esperá un minuto y reintentá.» |
| `.dialogo--formulario` | Un formulario corto en un diálogo: el foco en el primer campo, «Volver» y la acción | «Solicitar vínculo» |
| `Cajon` (`components/cajon.tsx`) | Un formulario más largo, que se abre al costado, sobre la vista, que sigue a la vista por detrás. La cabecera (de quién es, el título y «Cerrar») y el pie quedan fijos; el cuerpo se desplaza adentro. Lo que hay que saber antes de un acto que no se deshace va en el pie, junto al botón. El foco va al título, o adonde pida quien lo abre (`focoInicial`): un buscador se abre para escribir. No se cierra durante un envío. 800 px; hasta 64 rem de ventana, todo el ancho. Dibuja su contenido solo mientras está abierto: lo que tiene que sobrevivir al cierre vive en quien lo abre | «Pedir información», sobre «Solicitudes»; «Agregar ítem», sobre el editor del plan de comidas |
| `MenuDeAcciones` (`components/menu-de-acciones.tsx`) | Lo que se hace de vez en cuando sobre algo (cambiar un nombre, quitar, guardar como plantilla), detrás de un botón que dice de qué son las acciones. Es un botón con un panel de botones, como el menú de la cuenta: Escape lo cierra y devuelve el foco; tocar fuera o salir de él con el teclado, también. Una acción que ahora no se puede usar no desaparece: va apagada y dice por qué, en su renglón. Con texto y una flecha, despliega los caminos de una acción | «Más», en una comida: «Cambiar el nombre · Guardar como habitual · Quitar comida»; «Agregar opción ▾» |
| `ComidaDelEditor` · `CampoDeNombre` (`nutrition/comida-del-editor.tsx`) | Una comida de la versión en preparación del plan de comidas. Plegada, un renglón con su nombre, cuántas opciones tiene y lo que adentro pide atención. Abierta, sus opciones en pestañas —la elegida muestra su nombre entero; las demás lo cortan— y los ítems de la opción elegida en una tabla, con cada campo diciendo de qué alimento es; una opción de receta se lee y no se edita. El nombre se cambia a pedido (`components/campo-de-nombre.tsx`, el mismo campo en los dos editores): aparece en el lugar, con el foco y el texto seleccionado, y Enter o salir lo cierra; con Enter, el foco va a lo que muestra ese nombre. Lo que no tiene nombre lo muestra siempre | «Almuerzo · 3 opciones · se elige una · ⚠ 1 cantidad que no se entiende» |
| `.items-del-editor` | La tabla de ítems de una opción, para editar: el alimento ocupa lo que sobra y sus tres datos van en columnas del mismo ancho en toda opción (al cambiar de pestaña, los campos no se mueven). El motivo de una cantidad que no se entiende se lee de corrido, por debajo de los otros campos. En una ventana angosta (hasta 56 rem), cada ítem es su nombre y, debajo, sus tres campos en fila, cada uno con su rótulo | «Arroz blanco · 150 · g · Cocido · ✕» |
| `loQueNoDejaGuardar` · `comidaPlegadaDelEditor` · `lugarDelProblema` · `ubicacionDelProblema` · `posicionPedida` · `comidasAbiertasEnElEditor` · `loQueEntraAlActivar` (dominio, `editor-del-plan-de-nutricion.ts`) | Las reglas del editor del plan de comidas: qué no deja guardar (un nombre que falta, una cantidad que no es un número), con la ruta a su lugar; qué dice una comida plegada; dónde está un problema de «Validar» y cómo se dice con los nombres del plan; el día tipo y las comidas abiertas que pide la dirección, por posición; y qué entra y qué queda al activar | «Día de descanso → Colación → falta al menos una opción»; «2 días tipo y 7 comidas» |
| `.boton[aria-disabled='true']` | Un botón que ahora no se puede usar pero conserva el foco: se ve apagado y no responde. Para el que se apaga solo después de usarlo, o mientras se guarda: con `disabled` perdería el foco, y quien usa el teclado quedaría fuera de lugar | «Guardar cambios», sin nada que guardar |
| `EjercicioDelEditor` · `CeldaDeObjetivo` (`training/ejercicio-del-editor.tsx`) | Un ejercicio de la versión en preparación del plan de entrenamiento. Plegado, un renglón con lo que piden sus series —lo escrito y todavía sin guardar, resuelto como lo resolverá la API— y lo que adentro pide atención. Abierto, la tabla de sus series y «Lo general del ejercicio» al costado (debajo, en dos columnas, cuando los ejercicios tienen menos de unos 1.200 px). Cada objetivo de una serie es una celda con sus tres estados: vacía, toma el de lo general, que se lee en gris; con un valor, el propio; «Sin objetivo», elegido con la flecha de la celda, en el color del texto. El botón de la celda ofrece solo lo que cambia algo. El descanso se lee «02:30» y se escribe así o en segundos | «Press de banca · 4 × 6–8 rep. · 62,5 kg · RIR 2 · descanso 02:30» |
| `.series-del-editor` | La tabla de series, para editar: las columnas tienen ancho fijo, para que al agregar una serie los campos no se muevan; la nota ocupa lo que sobra; cada encabezado dice lo que hace falta para llenar su columna. Angosta (hasta 46 rem de ejercicios), cada serie es un bloque con sus campos rotulados | «Repeticiones · 8 u 8-12», «Descanso · 02:30» |
| `TextoAPedido` (`components/texto-a-pedido.tsx`) | Un texto opcional que se lee en su lugar y se cambia a pedido (el propósito de un bloque, las indicaciones de una sesión): con texto, se lee con «Cambiar» al lado; sin texto, ofrece agregarlo. «Cambiar» abre el campo en el lugar, con el foco; cerrado con el teclado, el foco vuelve a «Cambiar» | «Propósito Más carga, menos repeticiones · Cambiar» |
| `AgregarEjercicio` (`training/agregar-ejercicio.tsx`) | El buscador de ejercicios, en un cajón, con las reglas de `AgregarItem`: dice adónde se agrega; los habituales, como fichas; los resultados, en una tabla con la chinche de «habitual»; elegir no lo cierra y lo anuncia; «Crear manualmente» e «Importar desde wger», adentro, con «Volver a la búsqueda» | «Bloque del recorrido · Sesión A» |
| `loQueNoDejaGuardarElEntrenamiento` · `ejercicioPlegadoDelEditor` · `celdaDeObjetivoDelEditor` · `leerDescanso` · `lugarDelProblemaDeEntrenamiento` · `loQueSeMiraEnElEditor` (dominio, `editor-del-plan-de-entrenamiento.ts`) | Las reglas del editor del plan de entrenamiento: qué no deja guardar (un nombre que falta, el objetivo de intensidad que falta, un dato mal escrito, un parámetro sin completar), con la ruta a su lugar; qué dice un ejercicio plegado; qué muestra y qué escribe la celda de un objetivo; cómo se lee un descanso escrito; dónde está un problema; y qué se mira según la dirección | — |
| `AgregarItem` (`nutrition/agregar-item.tsx`) | El buscador del catálogo para sumarle un ítem a una opción del plan de comidas, en un cajón: dice de qué comida y de qué opción es; busca al enviar; los alimentos habituales, arriba, como fichas; los resultados, en una tabla con calorías, carbohidratos, grasas y proteínas; elegir no lo cierra y lo anuncia; «Crear manualmente» e «Importar» se abren adentro, con «Volver a la búsqueda» | «Agregado: Arroz integral (van 2). Podés sumar otro o cerrar.» |
| `.paso-del-pedido` · `.formularios-del-pedido` · `.preguntas-del-pedido` | Los pasos de un pedido, a la vista a la vez: una opción por formulario (su descripción, solo en el elegido); una fila por pregunta, con la casilla que la pide, con qué se responde y si es requerida; y el para qué, con el área | «2 Qué preguntas · 6 de 6 elegidas.» |
| `.campo-fijo` | Un valor que la pantalla fija y no deja cambiar: se lee como un campo, con su candado y su motivo | «Área: Entrenamiento» + «Este formulario es solo de Entrenamiento.» |
| `.casilla-de-celda` | Una casilla sola en su celda: lo que se toca mide 44 px aunque la casilla sea chica | «Requerida», en la tabla de preguntas |
| `.lista-de-solicitudes` · `.solicitud-abierta` · `.lo-declarado` | Información · Solicitudes: la lista, y lo que la persona declaró por pregunta pedida, con la respuesta que rige, «Corregida» y lo que había antes | «Dolor o lesiones actuales — Molestia en el hombro derecho… · Corregida · Antes: sin responder.» |
| `loDeclarado` · `contarLasVistasDeSolicitudes` · `valorDeclarado` · `respondeCon` (dominio) | Las reglas de Información · Solicitudes: la respuesta que rige por la relación que da la API, «antes», la historia de las versiones, las cantidades de las vistas, y el valor con su unidad | «7,5 h»; «Respondió 1 de las 2 preguntas.» |
| `usePersonaDelArea` · `useAvisarSinAcceso` (`marco-del-area.tsx`) | De quién es el área, para decirlo donde el marco queda tapado; y avisarle al marco que una escritura respondió «no disponible» sin retirar la sección | El cajón del pedido |
| `dejarAvisoPara` · `tomarAvisoPara` (`lib/aviso-al-llegar.ts`) | Un aviso para la página a la que se va: lo deja quien navega y lo toma, una vez, la página de destino. Vive en memoria, no en la dirección | «Solicitud enviada.», al volver a Entrenamiento |
| `SelectorDeDiaTipo` · `ComidasDelPlan` (`nutrition/estructura-del-plan.tsx`) | El plan de comidas, en solo lectura: el día tipo que se mira (un control; con uno solo, su nombre) y sus comidas plegadas, cada una en un renglón con su cantidad de opciones y sus nombres; abierta, sus opciones lado a lado, todas a la vista. Va en Nutrición · Plan y en el detalle de una etapa de la ficha: se acomoda al ancho de su caja, no al de la ventana | «Almuerzo · 3 opciones · se elige una · Arroz con pollo y brócoli · Guiso de lentejas · Salmón con papa» |
| `.segmentos--que-bajan` | Un control segmentado cuyos nombres escribe la persona: baja de renglón antes que salirse o recortarse | Los días tipo de un plan (hasta siete) |
| `SelectorDeVersion` · `HistorialDelPlan` (`advisees/versiones-del-plan.tsx`; `.historial-del-plan`) | Lo que los dos planes, el de Nutrición y el de Entrenamiento, comparten sobre sus versiones. El selector, cuando hay una en preparación y una activa: «En preparación», sin número, y «N · activa». El historial: las versiones activadas, de la más nueva a la más vieja, con su número, su día y su hora, y cuál rige; al pie, la huella de la instantánea que se lee. Al costado; con la ventana angosta, debajo. Las palabras, en `COPY_DE_VERSIONES` (dominio) | «Versión 2 · activada el 7 sept, 09:30 · vigente»; «Versión 1 · activada el 21 jul, 09:00 · anterior, conservada» |
| `DialogoEmpezarDesdePlantilla` (`advisees/empezar-desde-plantilla.tsx`) | Elegir una plantilla propia para empezar una versión, en un diálogo: lee las plantillas al abrirse, dice una lectura que falla con su motivo (nunca «no tenés»), no trae ninguna elegida y dice adentro una falla al crear. Cada área le dice cómo se leen sus plantillas | «Plan base · 7 comidas · Sin cantidades» |
| `numerosDeVersionDePlan` · `historialDeVersiones` · `elegidoPorOrden` · `abiertosPorOrden` · `pedidoDeAbiertos` (dominio, `versiones-de-plan.ts`) | Lo que los dos planes resuelven igual: el número de una versión por su orden de activación, con todas las versiones; la vigente según la API; lo elegido y lo abierto que pide la dirección, por su número de orden; y lo que se escribe en ella (nada, si es lo que se ve sin pedir) | «2 · activa»; `ejercicios=1.3`; `comidas=ninguna` |
| `diaTipoElegido` · `comidasAbiertas` · `pedidoDeComidas` · `opcionesEnPalabras` · `indicadoDelItem` (dominio, `plan-de-nutricion.ts`) | Las reglas de Nutrición · Plan: el día tipo y las comidas abiertas que pide la dirección, cuántas opciones tiene una comida y lo indicado de un ítem | «3 opciones · se elige una»; «sin cantidad indicada» |
| `SelectorDeNivel` · `EjerciciosDeLaSesion` (`training/estructura-del-plan.tsx`) | El plan de entrenamiento, en solo lectura. `SelectorDeNivel`: lo que se mira en un nivel (el bloque, el microciclo o la sesión): con una sola cosa, su nombre; hasta cuatro, botones; con cinco o más, una lista que dice cuál se mira y cuántas hay. `EjerciciosDeLaSesion`: los ejercicios plegados, cada uno en un renglón con lo que piden sus series; abierto, «Lo que recibe tu asesorado», serie por serie, y «Lo general del ejercicio» al lado. Va en Entrenamiento · Plan y en el detalle de una etapa de la ficha: no pide el contexto de la pestaña, y el acceso a la imagen se lo da quien la usa | «Remo con barra · 4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00»; «Sesión · 4 de 6» |
| `.series-del-plan` | La tabla de objetivos por serie de un ejercicio del plan: una fila por serie; la columna del RIR y la de la nota, solo si hacen falta; «Sin objetivo», en gris, donde la serie no tiene uno. Apilada, en una pantalla angosta, cada dato lleva su rótulo | «3 · 62,5 kg · 6–8 rep. · RIR 1 · 02:30» |
| `loQueSeMiraDelPlan` · `renglonDelEjercicio` · `encabezadoDelEjercicio` · `seriesDelEjercicio` · `loGeneralDelEjercicio` (dominio, `lectura-del-plan-de-entrenamiento.ts`) | Las reglas de Entrenamiento · Plan: el bloque, el microciclo y la sesión que pide la dirección; el renglón de un ejercicio plegado (entero, si todas las series piden lo mismo; si no, qué cambia «por serie»); su cabecera; la tabla de series con lo que resolvió la API; y lo general | «4 series · 6–8 rep. · carga, RIR y descanso por serie» |

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
- **Un botón de enviar no espera apagado sin decir por qué.** Lo que falta se dice al tocarlo, cada cosa en su lugar, y
  el foco va a lo primero que falta. Apagado queda solo mientras algo se está leyendo o enviando.
- **Cerrar un formulario abierto encima no descarta lo escrito.** Queda como estaba mientras dure la visita; lo que lo
  descartaría («Actualizar») pregunta antes.
- **Lo que una acción deja dicho, lo dice la página donde la persona queda.** Si al enviar se vuelve a otra página, el
  aviso viaja con ella: un aviso de la página que se abandona no lo lee nadie.
- **Plegar no esconde.** Un renglón plegado dice cuánto tiene adentro y, si entra, cómo se llama cada cosa: el conjunto se
  lee sin abrir nada.
- **Lo que se elige entre varias se muestra con el mismo peso.** Las opciones de una comida van todas a la vista: una
  opción detrás de un enlace es una opción de segunda.
- **Un selector que cambia de vista no desmonta un formulario con cambios.** Lo deja montado y fuera de la vista: al
  volver, lo escrito sigue ahí.
- **Un nombre que escribe la persona puede ser largo, y pueden ser varios.** Un control armado con nombres propios baja
  de renglón; no los recorta.
- **Un resumen no elige un caso.** Si las partes dicen lo mismo, se dice una vez; si difieren, se nombra qué cambia
  («carga y RIR por serie»). Nunca la primera, ni un rango que nadie indicó.
- **Dos pantallas hermanas dicen lo mismo con las mismas palabras.** Los dos planes comparten el renglón de la versión,
  el selector, el historial y sus textos: la pieza y la regla viven en un solo lugar.
- **Una pieza que se comparte no pide el contexto de una pestaña.** Lo que necesita se lo da quien la usa. Fuera de su
  pestaña ese contexto no existe, y pedirlo tira la página entera.
- **Cuando lo que se elige puede ser mucho, los botones tienen un tope.** En el plan de entrenamiento, hasta cuatro
  bloques, microciclos o sesiones van como botones; con cinco o más, una lista que dice cuál se mira y cuántas hay. Los
  días tipo de un plan de comidas son siete como mucho: van siempre como botones, que bajan de renglón.
- **Una tabla que se apila conserva el rótulo de cada dato,** salvo el que ya dice qué es («6 rep.», «RIR 1»).
- **Lo que se suma de a varios no cierra su panel con cada uno.** Lo anuncia en el mismo panel —la vista quedó detrás
  del velo— y deja seguir; se cierra cuando la persona lo decide.
- **Un buscador que se abre recibe el foco.** Y cada vez que se abre, empieza vacío.
- **No encontrar no es fallar.** Una búsqueda sin resultados lo dice y ofrece otro camino; una que falló dice su motivo y
  se reintenta. Vale también para una lista propia que no se pudo leer: no es «todavía no tenés ninguno».
- **Plegar tampoco esconde lo que falta.** Un renglón plegado dice lo que adentro pide atención —un nombre que falta, una
  cantidad que no se entiende, un problema de la validación—, con un ícono y con texto, no con un color.
- **Lo que no deja guardar se lista con su lugar, y cada renglón lleva hasta ahí.** Cuando la pantalla muestra una parte
  por vez, «corregí los campos marcados» no alcanza: hay que decir dónde, elegirlo, abrirlo y dejar el foco en el campo.
  Vale igual para los problemas que devuelve una validación.
- **Para leer, lado a lado; para escribir, de a una.** Las opciones de una comida van todas a la vista en el plan activo,
  donde se comparan, y en pestañas en el editor, donde se escribe. En los dos casos pesan lo mismo.
- **Lo que casi nunca se toca no ocupa un campo.** Un nombre se cambia a pedido; lo que se usa de vez en cuando va en un
  menú que dice qué tiene adentro. Lo que se acaba de agregar nace con su nombre abierto, y lo que no tiene nombre lo
  muestra siempre.
- **Apagado no es deshabilitado.** Un botón que se apaga solo después de usarlo conserva el foco (`aria-disabled`).
  «Guardar cambios» está apagado cuando no hay nada que guardar, y el estado del guardado, al lado, dice por qué.
- **Un acto que necesita otro antes, lo hace.** «Activar plan» guarda si hace falta y recién entonces pregunta; si no
  puede guardar, lo dice y no sigue. No se apaga esperando que la persona adivine el orden.
- **Un dato que es de un acto se pide en ese acto.** La próxima revisión, en el diálogo de activar; si el acto no se
  hace, el dato vuelve a como estaba.
- **En una pantalla que se edita, lo que se mira va en la dirección por su posición.** Lo que se acaba de agregar
  todavía no tiene identificador ni número de orden.
- **Un dato mal escrito no viaja.** Lo que no se entiende no se manda como «nada»: en un campo que acepta «nada», eso
  quiere decir otra cosa (sin descanso, sin objetivo). Se marca en su lugar, se dice en el renglón plegado y no deja
  guardar hasta corregirlo.
- **Lo que se ve al editar es lo que recibe la persona.** En la tabla de series, el gris es lo que la serie toma de lo
  general: con eso, una vista previa aparte sobra.
- **Al cerrar un campo con el teclado, el foco va a lo que lo muestra.** Un nombre confirmado con Enter deja el foco en
  el control que ahora dice ese nombre, o en el botón que lo abrió: nunca al principio de la página.
- **Un acto que se registra se prepara en su propia pantalla,** dentro de la misma sección y con su dirección. La lista
  queda como estaba; al registrar o al cancelar se vuelve a ella.
- **Lo que BE propone se dice como propuesto, y solo mientras lo sea.** «Preparado por BE» va junto al período que BE
  preparó; si la persona elige otro, deja de decirse.
- **Cambiar el alcance no borra lo escrito.** Con otro período, el texto y lo elegido siguen; de lo marcado se quita
  solo lo que quedó afuera, y se dice cuánto. Mientras se lee el período nuevo, registrar queda apagado, con su motivo:
  lo que se ve todavía es del anterior.
- **Lo que no tiene dato se ve, sin control.** Un día sin registros está en la grilla, apagado y sin casilla: no hay
  nada que marcar, y no es un cero.
- **El nombre de un control empieza por lo que se ve** (WCAG 2.5.3): «11 sept 3 comidas, sin marcar», no «marcar las 3
  comidas». El verbo va donde se lee («Marcar las 44 comidas»).
- **Un control de período que tiene campos va fuera del formulario que lo usa:** Enter en una fecha no tiene que enviar
  otra cosa.

### II.9 Pestaña Antropometría (no se extiende al resto del website)

Estas reglas son de la pestaña Antropometría del profesional y de su lámina. No valen para el dashboard ni para las
otras pestañas. La pestaña tiene tres secciones: Tomas, Evolución y Lámina.

**Tomas** (`anthropometry/evaluaciones.tsx`, `medicion.tsx` y `calculos.tsx`; las reglas, en
`tomas-de-antropometria.ts` del dominio; WP-ESCRITORIO-AREAS, parte 3):
- **La lista, al costado, en tramos seguidos del mismo protocolo.** Cada toma se nombra por cuándo se tomó (la fecha de
  ocurrencia, con su hora) y dice sus cuentas: mediciones, corregidas y anuladas. No se reordena para agrupar: una toma
  con otro protocolo en el medio parte el tramo, y así se ve cuándo cambió. La elegida va marcada por forma (un borde),
  no solo por color, y vive en la dirección. La lista se lee una vez por visita: cambiar de toma no le pide nada a la
  API.
- **Lo que vale para toda la toma se dice una vez, arriba:** cuándo se tomó, la clase del dato si todas las mediciones
  la comparten, y en un renglón el protocolo, las cuentas, cuándo se registró y quién.
- **En la toma, los cálculos van antes que las mediciones.** Los resultados vigentes, por categoría del catálogo y, en
  cada una, por método: cada uno con el nombre de su método y los decimales que el método declara. Los que quedaron sin
  efecto, a pedido. El orden es el neutral del dominio, el mismo de la lámina: nunca por «mejor».
- **Las mediciones, por familia, y en cada fila solo lo que se sale de lo común:** el nombre corto («Cintura», debajo
  de «Perímetros»), el valor que rige y, si corresponde, «Corregida», «Anulada» o «Sin valor vigente». **La unidad se
  dice una vez, en el título de la familia, si todas sus mediciones la comparten,** como en el encabezado de una
  columna (I.2); si no, en cada fila. El lector de pantalla oye siempre el nombre completo y el valor con su unidad:
  con los nombres cortos hay dos «Antebrazo» y dos «Pantorrilla».
- **La fila entera abre la medición, en un panel** que retiene el foco: el valor que rige, su historia de lo más nuevo
  a lo más viejo (el original se conserva), lo que cambió en los resultados y, al pie, corregir y anular. No hay
  acciones en la fila. Lo que se acaba de hacer se dice adentro del panel, que sigue abierto: un aviso de la página
  quedaría detrás.
- **Anular no se presenta como borrar:** lo que hay que saber —que no borra nada y que no se reactiva— va arriba del
  botón, que no es rojo ni el principal. Una medición anulada conserva su valor a la vista y no ofrece ninguna acción.
- **«Lo que cambió con la corrección» sale de una relación entre cálculos,** no de una coincidencia de fechas: el
  resultado vigente que reemplaza a otro, con el valor de ahora y el de antes. Al anular, los resultados que usaban la
  medición quedan sin efecto y sin reemplazo: se nombran con el valor que tenían, y no se pone un cero. Lo que no se
  puede atribuir no se atribuye, y se dice.
- **Un resultado y «Calcular con un método» se abren en el mismo panel.** Una falla al leer los cálculos se dice en su
  bloque, con «Reintentar»: la toma y sus mediciones siguen a la vista, y no es «todavía no hay cálculos».
- **La carga de una toma no es una sección:** se abre desde «Tomas» («Preparar una toma» o, si ya hay una empezada,
  «Seguir con la toma en preparación»), con «Tomas» marcada y un enlace para volver. Al registrar se vuelve a «Tomas»
  con esa toma abierta, y el aviso se dice ahí.
- **Una toma de pocas mediciones (hasta seis) no reserva el lugar de las familias que no tiene:** van una al lado de la
  otra. Con más, cada familia tiene su lugar fijo —lo corto, los pliegues y los perímetros—, que es como se lee un
  perfil completo.
- **Ningún renglón separa un número de la palabra que cuenta** («1» arriba y «anulada» abajo; «7» y «pliegues»), ni
  deja el separador al principio: las cuentas de la lista bajan de a una entera, y los nombres de los métodos y el
  renglón de la toma llevan espacios que no se parten (II.8).
- **Anchos:** por encima de 1200 px (`75rem`), la lista a la izquierda y la toma a la derecha; hasta 1360 px (`85rem`)
  lo corto (masa y estatura, diámetros) pasa arriba y pliegues y perímetros se reparten el ancho; hasta 1200 px la
  lista pasa arriba, como un selector con las mismas tomas y sus cuentas: se muestra uno u otro, nunca los dos. Las
  filas miden 44 px (I.5): una toma de treinta mediciones no entra en una pantalla.
- **Piezas propias:** `.tomas-del-area` (la lista y la toma abierta), `.tramo-de-tomas` y `.toma-de-la-lista`;
  `.medicion-de-la-toma` y `.resultado-de-la-toma` (una fila que abre su detalle); `.medicion-abierta` (el contenido
  del panel, de una medición o de un resultado), `.historia-de-medicion` y `.cambios-de-resultados`; y `Marca` (la
  clase de un dato o su excepción, con su ícono).

**La carga de una toma** (`anthropometry/preparacion.tsx`, `figura-de-la-carga.tsx` y `composicion-de-la-carga.ts`;
WP-ESCRITORIO-AREAS, parte 9; maqueta 23):
- **Cada campo, unido a su sitio de la figura.** La figura es la de Dirección, la misma de la Lámina y del teléfono, y
  los sitios son los del dominio: no se mueven para acomodar el dibujo ni para separar dos que de frente casi coinciden
  (DL-113). A cada lado, tarjetas con los campos, apiladas a la altura de sus sitios; de cada campo sale una guía hasta
  el borde de su sitio, y ninguna cruza a otra (una prueba lo fija, en las dos figuras y en las dos familias).
- **Una familia por vez (perímetros o pliegues) y una figura por vez (hombre o mujer),** las dos en la dirección.
  Ninguna es un dato: la figura arranca en hombre, como la Lámina. Cada familia dice cuántas de sus mediciones tienen
  dato, y lo escrito en la otra no se pierde.
- **Con dato o sin dato, por la forma; un solo color.** El anillo de un perímetro con dato tiene la mitad de adelante
  llena; sin dato, va entero y punteado. El punto de un pliegue con dato es un aro lleno con su centro; sin dato, un aro
  punteado y vacío. **Lo de la cara de atrás** (tricipital y subescapular) va en gris, con la guía punteada y la palabra
  «posterior» en el campo: la figura está de frente.
- **Pliegues:** los once sitios quedan del lado derecho de la persona. A la derecha de la figura van solo los dos que
  están junto a la línea media; los demás, a la izquierda.
- **Los campos son el camino del teclado y del lector de pantalla:** el dibujo va oculto para el lector, y tocar un
  sitio lleva a su campo. El foco sigue el orden del protocolo, por tarjetas. El nombre que se ve es el corto
  («Tricipital»); el que se oye, el completo («Pliegue tricipital, posterior»).
- **Lo que el protocolo declara sin sitio en la figura va a la derecha, en «Fuera de la figura»:** por familia, con la
  unidad si todas la comparten y su cuenta. Debajo, «Agregar otra medición», para lo que el protocolo no declara.
- **Arriba, el estado del guardado y un solo botón lleno,** a la vista al desplazarse: «Guardar» si hay algo sin
  guardar; si no, «Registrar toma». **«Cambios sin guardar» compara lo escrito con lo guardado,** y lo guardado dice la
  hora que da la API.
- **Un valor que no se puede leer:** el aviso lista el campo y lleva hasta él, aunque esté en la otra familia; el campo
  queda marcado, con el motivo debajo. Lo mismo con una fecha de toma futura, que se dice antes de escribir nada. **Un
  rechazo de la API que se puede explicar dice su motivo** (una medición anulada, un método al que le falta un dato):
  nunca «El servicio no está disponible», que hace pensar que BE está caído.
- **Colores:** tokens propios (`--escena`, `--figura-sitio`, `--figura-posterior`, `--figura-guia`), medidos a 3:1
  contra el maniquí y contra la escena en los dos temas (I.6). La escena es plana.
- **Anchos:** a 1440, la escena de 880 px y los datos de la toma en 448; a 1280, los datos se angostan para que la
  escena no baje de 832; a 1024, la escena ocupa el ancho y los datos van debajo. **Con menos de 832 px de escena, los
  campos van en lista, por tarjeta, sin la figura.**
- **Piezas propias:** `.carga-de-la-toma` (la cabecera y el cuerpo), `.taller-de-la-carga`, `.escena-de-la-carga`,
  `.tarjeta-de-la-carga`, `.medicion-de-la-carga` (`CampoDeMedicion`, la fila de un campo, también en «Fuera de la
  figura»), `.sitio-de-la-carga`, `.guia-de-la-carga` y `.leyenda-de-la-carga`; y `componerLaCarga`, la composición,
  sin interfaz.

**Evolución y Lámina** tienen su «Cómo se lee esta vista» en el marco, como Tomas y la carga (pasada de estética del
2026-10-15). Evolución usa el ancho de las otras secciones; la Lámina conserva el suyo (la imagen tiene su proporción).

**Lámina:**
- **Lo principal, primero.** El orden es: qué se muestra (la toma y la hoja); enseguida, la imagen con «Descargar
  imagen»; después, los ajustes de cómo se ve; al final, la explicación. En el teléfono, la imagen entra en la primera
  pantalla; el orden del documento es el del teléfono, y el foco lo sigue.
- **Desde 1100 px (`69rem`), dos columnas:** lo que se elige a la izquierda y la imagen a la derecha, fija mientras se
  ajusta.
- **El documento descargable y su vista previa son cosas distintas.** La imagen que se descarga (2160 × 3840) lleva
  todos los datos con sus unidades. En el teléfono, «Ver en tamaño real» la muestra a 1080 px dentro de un visor que se
  recorre con el dedo, y «Ver entera» la devuelve. El botón dice su estado (`aria-pressed`).
- **La imagen exportada se equilibra.** En Medición con el cuerpo entero, la figura arranca en 290 y mide 1390.

### II.10 Website del asesorado y cara pública

- **En el teléfono, el encabezado tiene dos renglones, no cinco:** la marca con el menú de la cuenta, y la navegación
  en una sola línea, que se desplaza de costado si no entra.
- **El aviso de ambiente de prueba** («usá solo datos sintéticos; no ingreses datos reales de personas») va en el pie
  de la cara pública y en el formulario de registro: donde alguien puede cargar datos por primera vez. Ya no va en la
  barra de cada pantalla (decisión de Dirección del 2026-10-10). El 08 §33 fija que en `test` solo hay datos
  sintéticos; no pide mostrarlo en todas las pantallas. La APK conserva su franja.
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

### II.11 Sin vueltas (DL-145, 2026-10-18)

Lo que salió del análisis de los flujos del profesional (`docs/ux/ANALISIS-ESPACIO-PROFESIONAL-2026-10-18.md`):
- **Un estado vacío lleva a la tarea.** No alcanza con decir qué falta: el vacío tiene el botón que lo resuelve, o lleva
  a donde se resuelve. El Plan sin plan muestra «Empezar el plan», con sus tres pasos en orden (evaluación, objetivo y
  plan) en la misma pantalla.
- **Un requisito se guía, no se esconde.** Si una acción necesita otra antes, la pantalla las muestra en orden, con la
  que toca abierta. Un botón apagado con una línea gris no es una guía.
- **El botón dice qué hace.** Una fila que dice qué está pendiente lleva el verbo que lo resuelve («Empezar el plan»,
  «Revisar»), no un «Abrir» igual para todas.
- **Una pantalla del profesional no se explica en su cuerpo.** Si necesita explicación, primero se cambia la pantalla.
  Lo que no se deduce mirando va en su ayuda corta, en el marco, y en las pistas; lo demás, y lo que el legajo exige
  poder leer, en la Guía (DL-146). Siguen a la vista el consentimiento y los efectos antes de actuar, y el contexto del
  dato (I.2).
- **Lo que no aplica no se muestra.** Una ficha sin nada registrado no muestra indicadores ni preguntas sobre un plan
  que no existe; una tarjeta vacía sin acción (las notas del equipo sin notas) no aparece.
- **Lo mismo se llama igual.** «Pedir información» (no «Solicitar contexto»), «Área» (no «Alcance») en lo que ve el
  profesional.

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
- [ ] Los íconos son de la familia (`Icono`): van con su palabra o tienen nombre, no llevan color propio y ninguno
  califica (I.8).

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

### V.3 Lo que cambia con WP-ESCRITORIO-AMABLE (desde el 2026-10-10)

Se anota parte por parte, a medida que cambia la pantalla (`docs/paquetes/WP-ESCRITORIO-AMABLE.md`, §7). Ninguna
garantía de accesibilidad, permisos, integridad de datos o manejo de errores se quita.

| Pauta | Antes | Ahora | Tipo | Parte |
|---|---|---|---|---|
| Paletas | El website tenía sus propios valores para «Claro» y «Azul noche», distintos de los de la APK. | Las paletas medidas el 2026-09-30, las mismas de la APK; cuatro colores de texto de Claro, un punto más oscuros por el velo de la cara pública (I.6). | Sustituida | 0 |
| Texto en cian | El lema de la portada y los íconos de sus tarjetas iban en cian también en Claro: 1,4:1 sobre el fondo. | El cian no es color de texto sobre fondo claro; el acento de texto es el color de los enlaces (I.6). | Corregida | 0 |
| Íconos | El website casi no tenía: tres dibujos propios en la portada y signos de texto. | Una familia de 105, con reglas de uso (I.8). La portada usa los de la familia. | Nueva | 0 |
| El marco de la ficha | Una miga, el título, una línea de acceso con «Actualizar», y debajo las pestañas con cinco botones de período. La primera tarjeta empezaba a los 305 px (1440 × 900). | Una franja de tres renglones fijos, sin miga; la primera tarjeta empieza a los 224 px (II.3). | Sustituida | 1 |
| El período | Cinco botones siempre a la vista (cuatro atajos y «Otro rango»). | Un solo control que dice el período y, abierto, ofrece los atajos y el rango propio (II.3). | Sustituida | 1 |
| «Solicitar contexto» | Una de las acciones del Resumen. | En el marco, a la vista en las tres vistas. | Ampliada | 1 |
| Las horas | En 12 horas, con «a. m.» y «p. m.». | En 24 horas («18:10»), en todo el website (`lib/formato.ts`). | Sustituida | 1 |
| La apariencia | Una lista desplegable suelta en la barra de marca. En una tablet de pie bajaba a un segundo renglón junto con el aviso de ambiente (103 px). | Dentro del menú de la cuenta (I.6, II.3). La barra ocupa un renglón (65 px), también en la tablet de pie. | Sustituida | 1 bis |
| «Cuenta» | El quinto enlace de la navegación del profesional. | El botón de la esquina: abre los datos de la cuenta, la apariencia y «Cerrar sesión» (II.3). | Sustituida | 1 bis |
| Paneles que se despliegan | Escape y tocar fuera cerraban el control de período. | Además, salir del panel con el teclado lo cierra; vale para el período y para el menú de la cuenta (II.3). | Ampliada | 1 bis |
| Tarjetas de «Empezar por una pregunta» | Cada una tenía el alto de su texto: la de descripción más corta quedaba más baja que su vecina. | Las cuatro miden lo mismo. | Corregida | 1 bis |
| Analizar | Tres zonas: la configuración abierta a la izquierda, los gráficos y la lectura; debajo, todo desplegado. Con tres métricas, 2.368 px de alto a 1440 px de ancho. | Una barra, los gráficos y la lectura; lo ocasional, en «Más acciones» y en el pie de los gráficos. 1.093 px, y los tres gráficos entran en una ventana de 900 px (II.1, II.6). | Sustituida | 2 |
| El gráfico: la métrica | Color, forma (círculo, cuadrado o triángulo) y trazo por métrica. | Todas las marcas son puntos; la métrica se reconoce por su color y por su nombre (I.7). | Sustituida | 2 |
| El gráfico: lo planificado | En Analizar, el objetivo estaba solo en texto. | El objetivo de calorías, como línea discontinua del mismo color; también en la lectura, la tabla y el resumen en texto (I.7). | Ampliada | 2 |
| El gráfico: días sin registros | Un corte en la línea. | El corte y, además, un gris leve de fondo (I.7). | Ampliada | 2 |
| Los modos | «Paneles sincronizados», «Superpuestas en valores reales» y «Cambio relativo»; «Cada registro». | «Separadas», «Juntas» y «Cambio relativo»; «Registro». Los valores de la URL no cambian. | Sustituida | 2 |
| «Energía» | El nombre de la métrica y de la etiqueta de un registro en la línea de tiempo. | «Calorías». El objetivo sigue siendo el «requerimiento energético estimado». | Sustituida | 2 |
| Los hitos en el gráfico | Líneas punteadas siempre dibujadas, con su lista plegada aparte. | Se dibujan mientras su lista está abierta. | Aclarada | 2 |
| El aro de la fecha elegida | Iba con los puntos de la línea: con 90 días a la vista, el de la última fecha salía cortado contra el borde del gráfico. | Va en una capa propia, alrededor de la marca, y se ve entero (II.6). | Corregida | 2 |
| Lo desplegado en Analizar | Cada cosa era un plegable suelto, que quedaba como se lo dejara. | Lo que abren «Más acciones» y el pie de los gráficos es del análisis que se mira: se cierra al volver al comienzo de Analizar (II.6). | Nueva | 2 |
| Tarjetas | La comparación de etapas dejaba los gráficos y la lectura adentro de la tarjeta de la vista. | Una tarjeta no va adentro de otra: la respuesta es una, y los gráficos y la lectura, las suyas (II.6). | Corregida | 2 |
| La entrada de Analizar | Las preguntas en una grilla de tarjetas; elegir métricas a mano estaba detrás del enlace «Análisis personalizado», que abría un análisis vacío con desplegables. | «¿Qué querés mirar?»: las preguntas en filas, las vistas guardadas para retomar y las métricas con casillas, todo a la vista (II.6). | Sustituida | 2 |
| El estado de una métrica | Un renglón suelto arriba de los gráficos («Cargando…», «No pudimos cargar…»). | Un bloque en el lugar de su gráfico, con ícono, título, motivo y acción (II.6). | Sustituida | 2 |
| Sin datos en el período | Una medida sin tomas (o un ejercicio sin sesiones) en el período decía «No pudimos cargar… No es una ausencia de datos: reintentá». | «Sin tomas en estas fechas… No es un cero», sin «Reintentar»; también en los indicadores del Resumen y en la tabla de etapas (II.7). | Corregida | 2 |
| La ayuda de una vista | Notas y plegables repartidos por la pantalla. | «Cómo se lee esta vista», una por vista, en el marco de la ficha (II.3). Hoy la tiene Analizar. | Nueva | 2 |
| Aviso de ambiente de prueba | «Ambiente de prueba · solo datos sintéticos», fijo en la barra de todas las pantallas del website; la guía decía que el 08 §33 lo «exige» siempre a la vista. | Sale de la barra (decisión de Dirección del 2026-10-10). Queda en el pie de la cara pública y en el registro (II.10). El 08 §33 fija la política de datos por ambiente; no pide mostrarlo en cada pantalla. La APK no cambia. | Sustituida | 1 bis |
| El Resumen | Por tipo de información: la tabla «Objetivo y planificación», la lista «Para tu próxima revisión», «Acciones», los indicadores, «Qué se registró en el período» y «Lo último que pasó». Con el marco nuevo, 2.130 px de alto a 1440 px de ancho. | Por área: una tarjeta por área con su contexto, sus pendientes, lo nuevo desde su revisión y su acción; debajo, los indicadores y las preguntas (II.6). 1.213 px; a 1440 × 900 entran las tres tarjetas y el valor de cada indicador. | Sustituida | 3 |
| «Sale de…» en cada hecho | Cada observación de la síntesis decía de dónde salía. | Se dice una vez por regla, en «Cómo se lee esta vista»; el renglón dice el hecho y abre su evidencia (II.4). | Sustituida | 3 |
| El texto de un hecho | Una frase del dominio por observación, con sus cuentas separadas por comas. | La misma frase, con las mismas palabras, en renglones: cada cuenta con su cifra adelante (`partesDeObservacion`). | Aclarada | 3 |
| La cobertura del área | En «Qué se registró en el período», al final del Resumen. | En cada indicador, la que hace falta para leer su número; la del área, plegada en su tarjeta cuando tiene revisión (II.4). | Sustituida | 3 |
| El objetivo de Nutrición en el Resumen | Solo las calorías, en una celda de la tabla. | La tira del objetivo: calorías y macros, en el orden de la APK (II.6). | Ampliada | 3 |
| Los indicadores | El nombre, un número y un renglón de texto; por defecto, energía, registros, peso y series registradas. | El valor con su regla, un minigráfico y la cobertura; por defecto, calorías, proteínas, la carga de una serie y el peso (II.6). | Ampliada | 3 |
| El botón de la acción principal | En el Resumen, todos con contorno. | Uno solo va lleno: el del área con la próxima revisión acordada más cercana (II.6). | Nueva | 3 |
| Las fechas en el Resumen | Siempre con el año. | Sin el año si es del año en curso; el período, con su año, está en el marco. | Aclarada | 3 |
| «Actualizar» | Volvía a leer el acceso y el resumen por área; la cobertura del período y lo disponible quedaban con los datos de antes, debajo de una hora nueva. | Vuelve a leer todo lo que la vista muestra (II.4). | Corregida | 3 |
| La ayuda de una vista, al abrirse | El foco iba a «Cerrar», al final: una ayuda más alta que la ventana se abría mostrando su último renglón. | Se abre por el principio: el foco va al título. El Resumen tiene la suya. | Corregida | 3 |
| La línea de tiempo | Una tarjeta de cinco renglones por hecho. Los primeros 50 hechos ocupaban 10.728 px a 1440 px de ancho: casi doce pantallas. | Por día: cada hecho, un renglón; las comidas de un día, en uno que se abre. La misma tanda mide 1.398 px, y a 1440 × 900 entran seis días enteros (II.6). | Sustituida | 4 |
| Los filtros de la línea de tiempo | Área, tipo y búsqueda a la vista; estado, calidad, carga tardía y ejercicio en un plegable. | Vistas con nombre y cantidad, el buscador y «Más filtros», con la combinación libre entera (II.6). La URL no cambió. | Sustituida | 4 |
| «Abrir registro» | Un enlace en cada tarjeta, que abría un panel encima de la vista. | El renglón entero abre el detalle, al costado desde 1200 px (II.6). | Sustituida | 4 |
| Lo que decía cada tarjeta de un hecho | Todos sus datos, «Registrado el…», quién lo cargó y sus relaciones, siempre a la vista. | En el renglón, lo que lo nombra y sus rasgos; lo demás, en el detalle. Con un texto buscado, el renglón dice dónde coincide. | Sustituida | 4 |
| «Carga tardía» | La etiqueta de un hecho cargado otro día. | «Cargado otro día», como en el Resumen. El filtro conserva «(carga tardía)», que es el término del legajo. | Sustituida | 4 |
| Los días sin hechos | No se decían: en la lista faltaba el día. | Entre dos días de la lista, con sus fechas y la muestra gris de los gráficos, al mirar «Todo» (II.6). | Nueva | 4 |
| «Hitos» | La misma palabra nombraba dos conjuntos: en la línea de tiempo, con las tomas; en Analizar, sin ellas. | Una definición, en el dominio, y dos alcances con nombre: «hitos» en la línea de tiempo e «hitos de planificación» en Analizar (II.6). | Aclarada | 4 |
| Sin doble desplazamiento | Sin excepciones escritas (el panel que se abría encima ya se desplazaba adentro). | Una excepción escrita: el detalle de un hecho, al costado (II.1). | Aclarada | 4 |
| Una vista que no se pudo leer | Un renglón de aviso. Si fallaba el resumen por área, no decía el motivo, y una pregunta de Analizar quedaba en «Cargando…». | El bloque de estado, con su motivo y «Reintentar», en las tres vistas (II.7). | Corregida | 4 |
| «Actualizar» en la línea de tiempo | Volvía a leer la primera tanda y le pegaba las siguientes de la lectura anterior. | Vuelve a leer desde la primera tanda (II.7). | Corregida | 4 |
| El registro de un plan activado | Desde la línea de tiempo, su planificación decía «Versión 0». | Dice su número de versión. | Corregida | 4 |
| La ayuda de una vista | La tenían el Resumen y Analizar. | Las tres vistas de la ficha tienen la suya. | Ampliada | 4 |
| El Espacio profesional | Cuatro tarjetas abiertas: pendientes, asesorados, solicitudes y el formulario. 2.697 px a 1440 px de ancho: tres pantallas. | Dos tarjetas (los pendientes y el directorio) y dos diálogos. Entra en la primera pantalla, también con siete pendientes (II.6). | Sustituida | 5 |
| Los filtros de «Pendientes» | «Dominio» y «Tipo de pendiente», a la vista; cada cambio era una lectura. | Vistas con nombre y cantidad; el área y el tipo exacto, en «Más filtros». Elegir no le pide nada a la API (II.6). | Sustituida | 5 |
| «Sin registros en el período» | Se decía también sin un período elegido. | Sin período, «Sin registros todavía»; el período dice qué acota (II.6). | Corregida | 5 |
| El último registro de un pendiente | Una columna, con el día y la hora. | Debajo de lo pendiente, con el día. | Sustituida | 5 |
| «Tus asesorados» | Una tarjeta por persona, con un renglón por vínculo; las áreas, en el orden de la lista. | Un directorio: una persona por renglón, con sus áreas en el orden de BE y el detalle de cada vínculo a un clic; con buscador (II.6). | Sustituida | 5 |
| Una falla en el Espacio profesional | «No pudimos cargar esta vista», sin motivo. | El bloque de estado, con su motivo, en cada lista (II.7). | Corregida | 5 |
| Una vista o un filtro sin filas | «Nada pendiente con lo que BE puede saber…», como si la cartera estuviera vacía. | «Ningún pendiente coincide con lo elegido», con el total y «Ver todo» (II.7). | Corregida | 5 |
| «Solicitar vínculo» y «Solicitudes enviadas» | Dos tarjetas, siempre abiertas. | A un clic, cada una en su diálogo (II.6). | Sustituida | 5 |
| «Dominio» | El nombre del filtro y de la columna de «Pendientes». | «Área», como en el resto del website profesional. | Sustituida | 5 |
| Una cantidad sobre una lista paginada | «Pendientes: 20+». | La lista se lee entera; si no, la cantidad dice «al menos» (II.7). | Nueva | 5 |
| La cobertura en «comparar etapas» | En cada celda de la tabla, repetida por métrica. | Una vez por etapa, en su tarjeta; en la celda, solo si es otra (II.6). | Sustituida | 2 |
| Los gráficos de «comparar etapas» | Los tres grandes, con su barra y su lectura, debajo de la tabla. | Tres chicos, con las etapas marcadas; los grandes, a un clic, en su lugar (II.6). | Sustituida | 2 |
| Elegir otra etapa | «Etapa anterior», o el formulario de «Cambiar los datos». | Un selector en cada tarjeta, si hay otra para elegir. | Sustituida | 2 |
| Los datos de la pregunta del ejercicio | Una frase al lado del título y un formulario para cambiarlos. | En el lugar: el ejercicio, la serie y la unidad (II.6). | Sustituida | 2 |
| Los modos sin nada para elegir | Siempre a la vista, apagados. | No aparecen donde las métricas están fijas (la pregunta del ejercicio); en lo demás siguen, con su motivo (II.6). | Aclarada | 2 |
| El origen de un dato | Un panel encima de los gráficos; «Registro 1», «Registro 2». | En el lugar de la lectura; las comidas del día, cada una con lo que aporta (II.5, II.6). | Sustituida | 2 |
| El encabezado de una pestaña de área | Una miga, el título y las secciones; el enlace de vuelta, solo si se había llegado desde la ficha. | El marco del área: el de la ficha, con el camino de vuelta siempre, de quién es, el acceso actual y «Actualizar» (II.3). | Sustituida | Áreas, 0 |
| «Evaluaciones» y «Ejecuciones» | Los nombres de dos secciones. | «Tomas» y «Registros»; las direcciones no cambian. | Sustituida | Áreas, 0 |
| La falla de la lectura de una sección de área | «No pudimos cargar esta vista. Reintentar». | El bloque de estado, con el motivo y «Reintentar» (II.3). | Sustituida | Áreas, 0 |
| Nutrición · Registros | Una tabla por día, todas a la vista; el registro, desplegado debajo de su fila; «Desde», «Hasta» y «Ver período». 3.985 px a 1440 px de ancho. | El día como unidad, vistas con nombre y cantidad, el registro al costado y el período en un control. 1.073 px (II.6). | Sustituida | Áreas, 1 |
| Una comida registrada sin diferencias | Una raya. | «Sin diferencia: son las porciones del plan»; con cantidades informadas, lo que comprobó BE (II.6). | Sustituida | Áreas, 1 |
| La comida diferente y la estimación del profesional | En su comida y, otra vez, en una lista «Fuera del plan» al pie del día, donde se agregaba la estimación. | Una sola vez, en su comida; la estimación, desde el detalle del registro (II.6). | Sustituida | Áreas, 1 |
| Lo que una sección de área elige (el período, la vista, lo abierto) | En la memoria de la sección: «Actualizar» lo perdía. | En la dirección, en cada sección que se recompone (II.3). | Corregida | Áreas, 1 |
| «Cómo se lee» en una sección de área | Plegado dentro de la sección. | En el marco del área, como en la ficha (II.3). | Sustituida | Áreas, 1 |
| Entrenamiento · Registros | Una tarjeta por sesión, de la más vieja a la más nueva; «Ver detalle» desplegaba debajo una tabla de seis columnas, un gráfico, lo planificado y el registro original. Con una sesión abierta, 3.996 px a 1440 px de ancho. | Una fila por sesión, de la más nueva a la más vieja; vistas con nombre y cantidad; y el detalle al costado, una tabla con cada serie una sola vez. Con una sesión abierta y 90 días, 1.612 px (II.6). | Sustituida | Áreas, 2 |
| Qué cuenta como una diferencia en una serie | Se listaban las tres relaciones (repeticiones, RIR y carga), sin decir cuántas series quedaban fuera. | Las repeticiones y el RIR; la carga se dice aparte y no cuenta (II.6). | Nueva | Áreas, 2 |
| La evolución de un ejercicio | En la ficha (Analizar) y, otra vez, en Entrenamiento · Registros, con filtros propios. | En Analizar; desde Registros, un enlace (II.6). | Sustituida | Áreas, 2 |
| Una versión del plan que no se puede leer, en Registros | Se descartaba en silencio: la tabla comparaba con lo general de la prescripción. | Las sesiones lo dicen, hay un bloque con «Reintentar» y «Con diferencias» queda sin número (II.6). | Corregida | Áreas, 2 |
| La tabla de adentro de un detalle, en un área | Una franja a cada lado de la tabla (oscura en Azul noche): las tapas de lo que se desplaza tomaban el color del fondo de la página. | Llevan el color del detalle o del diálogo donde está la tabla, en Nutrición y en Entrenamiento (II.8). | Corregida | Áreas, 2 |
| Un dato que no entra en un renglón, en una tabla o en una fila angosta | Se partía en cualquier lado: «RIR» arriba y su número abajo; «… · 1» arriba y «serie con diferencias» abajo. | En la tabla baja una parte entera; en la fila, el número no se separa de lo que cuenta. El separador queda al final del renglón de arriba (II.8). | Corregida | Áreas, 2 |
| Antropometría · Tomas | Cuatro secciones. De la toma abierta, cada medición con «Medido · Vigente» y dos botones («Corregir» y «Anular»); cada clic en otra toma volvía a leer la lista, el detalle, los métodos y los cálculos. | Tres secciones. La lista, en tramos del mismo protocolo; lo que vale para toda la toma, una vez; cada medición, una fila que abre su panel, con la historia y los dos actos. Cambiar de toma no vuelve a leer nada (II.9). | Sustituida | Áreas, 3 |
| «En preparación» | Una sección de Antropometría. | La carga se abre desde «Tomas», que dice si ya hay una toma empezada; al registrar se vuelve a «Tomas» con esa toma abierta (II.9). | Sustituida | Áreas, 3 |
| La unidad de un valor | En cada valor, siempre. | En una lista de valores que la comparten, una vez, en el título del grupo; el nombre accesible de cada valor la lleva igual (I.2). | Aclarada | Áreas, 3 |
| Los resultados calculados de una toma | Una lista con todas las corridas, vigentes y sin efecto, en el orden de la API, cada una con sus desplegables. | Los vigentes, por categoría y por método; los que quedaron sin efecto, a pedido; el detalle de cada uno, en el panel (II.9). | Sustituida | Áreas, 3 |
| Qué pasa con los resultados al corregir o anular una medición | No se decía. | El panel de la medición lo dice, por la relación entre cálculos: el valor de ahora y el de antes; al anular, los que quedaron sin efecto, sin un cero en su lugar (II.9). | Nueva | Áreas, 3 |
| «Evaluación», en Antropometría | El nombre de una toma en la carga, en los avisos, en la evolución y en el pendiente del Espacio profesional. | «Toma», en todos; las direcciones no cambian. | Sustituida | Áreas, 3 |
| El aviso «Toma registrada» | Se decía en la carga, que se desmontaba al volver: podía no verse. | Se dice en «Tomas», adonde se vuelve (II.9). | Corregida | Áreas, 3 |
| Información · Solicitudes | Dos secciones. Cada solicitud, un renglón con «Ver detalle»; el detalle, debajo, con cada versión de la respuesta entera y «Declarado por la persona» en cada dato. | Una sección. La lista, con tres vistas con nombre y cantidad; el detalle al costado, con lo que declaró por pregunta pedida y la respuesta que rige; cada versión, en la historia, a un clic (II.8). | Sustituida | Áreas, 4 |
| Una pregunta pedida que la persona no respondió | No aparecía: había que notar que faltaba. | Una fila que dice «Sin responder». | Corregida | Áreas, 4 |
| «Pedir información» | Otra página, con su pestaña. Ninguna pregunta marcada; el botón, apagado hasta escribir el propósito. | Un cajón sobre «Solicitudes», con los tres pasos a la vista y lo que hay que saber antes de enviar junto al botón. Las preguntas vienen todas marcadas (DL-131); lo que falta se dice en su lugar; cerrar no descarta lo armado (II.8). | Sustituida | Áreas, 4 |
| El área de un pedido de información | «Entrenamiento», elegida de entrada para todo formulario. | Fija, con su candado, si el formulario es de un área sola; si no, hay que elegirla. | Corregida | Áreas, 4 |
| «Plantilla», «campo» y «Alcance», en lo que lee el profesional en Información | En los títulos, las notas y los rechazos. | «Formulario», «pregunta» y «área». | Sustituida | Áreas, 4 |
| El éxito de un pedido hecho desde Entrenamiento | No se veía: se guardaba en la página que se abandonaba. | Lo dice Entrenamiento, al llegar (II.8). | Corregida | Áreas, 4 |
| Nutrición · Plan | La versión en preparación, el plan activo y el historial, uno debajo del otro; todos los días tipo y todas las comidas, abiertos. | Un selector de versión (la que está en preparación, sin número, y la activa); el plan activo de a un día tipo, con las comidas plegadas, las opciones lado a lado, el objetivo del día de esa versión a la vista y el historial al costado (II.8). | Sustituida | Áreas, 5 |
| La planificación de una etapa, en la ficha | Todos los días tipo y todas las comidas, abiertos, en la columna del detalle. | La misma pieza que en Nutrición · Plan, en su columna: un día tipo, las comidas plegadas y las opciones una debajo de la otra. | Sustituida | Áreas, 5 |
| «Empezar desde una plantilla» | Un desplegable siempre a la vista, que se leía al entrar; si esa lectura fallaba, decía «No tenés plantillas activas». | Un botón que abre un diálogo: lee al abrirse, dice la falla con su motivo y no trae nada elegido (II.8). | Corregida | Áreas, 5 |
| La nota de un ítem del plan | El website no la mostraba. | Se lee debajo del ítem, como la lee el asesorado en la APK. | Corregida | Áreas, 5 |
| El número de una versión del plan de comidas | Lo calculaba la pantalla, con la primera página de la lista de versiones. | Lo calcula el dominio, con todas las versiones. La regla no cambia: es el orden de activación. | Corregida | Áreas, 5 |
| El control segmentado | Recortaba el nombre que no entraba. | Cuando los nombres los escribe la persona, baja de renglón (`.segmentos--que-bajan`, II.8). | Ampliada | Áreas, 5 |
| Entrenamiento · Plan | La versión en preparación (el editor entero), el plan activo y el historial, uno debajo del otro; todos los bloques, las sesiones y los ejercicios, abiertos. | Un selector de versión; el plan activo de a una sesión —se eligen el bloque, el microciclo y la sesión—, con los ejercicios plegados, la tabla de objetivos por serie con lo general al lado, y el historial al costado (II.8). | Sustituida | Áreas, 6 |
| La planificación de una etapa de entrenamiento, en la ficha | Abrirla rompía la ficha entera: la pieza pedía el contexto de la pestaña Entrenamiento. | La misma pieza que en Entrenamiento · Plan, en su columna; el acceso a la imagen de un ejercicio se lo da la ficha (II.8). | Corregida | Áreas, 6 |
| La nota de una serie del plan | El website no la mostraba. | Se lee en la fila de su serie, como la lee el asesorado en la APK. | Corregida | Áreas, 6 |
| « · de la prescripción», en el plan activo | Acompañaba cada valor que la serie tomaba de lo general. | La tabla dice lo que recibe el asesorado, sin decir de dónde viene cada valor: eso queda para el editor. | Sustituida | Áreas, 6 |
| Las palabras de las versiones, en el plan de entrenamiento | Las insignias «Activo» y «Anterior», en una sección aparte. | Las mismas que en Nutrición, en el historial común: «vigente» y «anterior, conservada» (II.8). | Sustituida | Áreas, 6 |
| «Empezar desde una plantilla», en Entrenamiento | Un desplegable siempre a la vista, que se leía al entrar; si esa lectura fallaba, decía «No tenés plantillas activas». | El diálogo común (II.8): lee al abrirse, dice la falla con su motivo y, de cada plantilla, cuántas sesiones tiene y si lleva cargas. | Corregida | Áreas, 6 |
| El número de una versión del plan de entrenamiento | Lo calculaba la pantalla, con la primera página de la lista de versiones. | Lo calcula el dominio, con todas las versiones: es la misma regla que en Nutrición. | Corregida | Áreas, 6 |
| Cuántos botones para elegir, en el plan de entrenamiento | Sin regla. | Hasta cuatro bloques, microciclos o sesiones, botones; con cinco o más, una lista que dice cuál se mira y cuántas hay. Los días tipo de Nutrición, que son siete como mucho, siguen como botones (II.8). | Nueva | Áreas, 6 |
| «Agregar ítem», en el plan de comidas | Un recuadro que se abría dentro de la opción, con el buscador, los habituales como enlaces y cada resultado en un renglón con sus calorías; se cerraba al elegir. | Un cajón al costado, uno solo para todo el borrador: los habituales como fichas, los resultados en una tabla con calorías y macros, y elegir no lo cierra (II.8). | Sustituida | Áreas, 7 |
| Una búsqueda del catálogo que falla | «No encontramos alimentos con ese nombre.», lo mismo que una búsqueda sin resultados. | Dice la falla con su motivo y «Reintentar». | Corregida | Áreas, 7 |
| Los alimentos habituales que no se pueden leer | «Todavía no marcaste alimentos habituales.» | Dice que no se pudieron leer, con su motivo y «Reintentar». | Corregida | Áreas, 7 |
| El foco al abrir un cajón | Siempre en el título. | En el título, o adonde pida quien lo abre: en «Agregar ítem», en el campo de búsqueda (II.8). | Ampliada | Áreas, 7 |
| La versión en preparación del plan de comidas | Una jerarquía de cajas, una adentro de la otra, con todo abierto y las acciones al final: 9.045 px con dos días tipo. | Un día tipo por vez, con las comidas plegadas; abierta, sus opciones en pestañas y los ítems en una tabla; las acciones, arriba: 950 px (II.8). | Sustituida | Áreas, 7 |
| Los nombres, en el editor del plan de comidas | Un campo siempre abierto por día tipo, por comida y por opción. | A pedido: «Cambiar el nombre» abre el campo en el lugar, con el foco. | Sustituida | Áreas, 7 |
| Las acciones de vez en cuando, en el editor | Todos los botones a la vista a la vez. | En un menú por cosa (`MenuDeAcciones`); la que no se puede usar va apagada y dice por qué. | Sustituida | Áreas, 7 |
| «Activar plan» | Apagado mientras hubiera cambios sin guardar; la próxima revisión, un campo al pie del editor. | Guarda antes si hace falta y recién entonces pregunta; el diálogo dice qué entra y qué queda, y ahí se fija la próxima revisión. | Sustituida | Áreas, 7 |
| El foco inicial de un diálogo de confirmación con un campo adentro | En el campo, que es el primer control. | En «Volver», si quien lo abre lo pide (`focoEnVolver`): la acción con efecto nunca es la opción por defecto (I.3). | Ampliada | Áreas, 7 |
| Los problemas de «Validar plan» | Una lista de texto. | Cada uno es un botón que lleva a su lugar: elige el día tipo, abre la comida y la opción, y deja el foco ahí. | Ampliada | Áreas, 7 |
| Un nombre vacío o una cantidad que no se entiende, al guardar el plan de comidas | «Corregí los campos marcados»; el nombre vacío volvía de la API como «Plan → revisá este elemento». | Se listan con su lugar, y la comida lo dice en su renglón, también plegada (II.8). | Corregida | Áreas, 7 |
| Los botones de la cabecera del editor, al guardar | Se deshabilitaban: el foco se perdía. | Se apagan conservando el foco (`aria-disabled`). | Corregida | Áreas, 7 |
| «Agregar receta como opción» | La lista de recetas se abría debajo de la comida. | En el cajón, como los alimentos. | Sustituida | Áreas, 7 |
| La versión en preparación del plan de entrenamiento | Una jerarquía de cajas, con todo abierto: 28.413 px con dos bloques. | Una sesión por vez, con los ejercicios plegados; abierto, la tabla de series con lo general al costado; las acciones, arriba: menos de 1.000 px (II.8). | Sustituida | Áreas, 8 |
| Los objetivos de una serie, en el editor | Cinco campos por serie, tres con su casilla «Sin objetivo en esta serie», y una tabla aparte, «Así lo ve tu asesorado». | Una celda por objetivo, con sus tres estados: en gris lo que toma de lo general, el propio, o «Sin objetivo» elegido con la flecha de la celda (II.8). | Sustituida | Áreas, 8 |
| El descanso, en el editor | En segundos («150»). | Se lee «02:30» y se escribe así o en segundos. | Ampliada | Áreas, 8 |
| Un descanso o un RIR por serie mal escritos | Se guardaban como «sin objetivo», en silencio. | No dejan guardar: se marcan, se dicen en el renglón del ejercicio y se listan con su lugar. | Corregida | Áreas, 8 |
| El buscador de ejercicios | Un recuadro dentro de la sesión, que empujaba lo demás. | Un cajón al costado, como «Agregar ítem» (II.8). | Sustituida | Áreas, 8 |
| El foco al confirmar un nombre con Enter, en los dos editores | Volvía al principio de la página. | Va a lo que muestra ese nombre. | Corregida | Áreas, 8 |
| «Validar plan», en Entrenamiento | «Validar revisa la forma…», una nota fija al pie. | Junto al resultado, también cuando no hay problemas. | Sustituida | Áreas, 8 |
| La pestaña Revisiones | El formulario se abría en el lugar, arriba de la lista: con «Preparar la revisión», 3.856 px antes de la lista. | La lista, con «Nueva revisión»; la revisión nueva es otra pantalla de la sección (`preparar=1`), en tres pasos y dos columnas, con la barra de «Registrar revisión» pegada abajo: 1.175 px. | Sustituida | Áreas, 10 |
| El período de una revisión | «Desde», «Hasta» y «Ver período» arriba de todo, en la memoria de la sección; un aviso de tres oraciones decía que lo había preparado BE. | El control de la ficha, en la cabecera, con una frase que dice de dónde salió; en la dirección. Cambiarlo no borra lo escrito: quita solo lo marcado que quedó afuera, y lo dice. | Sustituida | Áreas, 10 |
| Los días de la evidencia | Una fila por día con registros: «11 sept · marcar las 3 comidas · sin marcar» y «Ver las 3». | Una grilla; en Nutrición, con los días sin registros a la vista y sin casilla. El nombre de cada casilla empieza por lo que se ve. | Ampliada | Áreas, 10 |
| Los efectos de los resultados | Los seis a la vista, cada uno debajo de su resultado. | El del elegido, en un recuadro; los seis, a un clic, en «Qué hace cada resultado». | Sustituida | Áreas, 10 |
| Los errores de la revisión de Entrenamiento | Solo en el resumen. | En el resumen y en cada campo, como en Nutrición. | Corregida | Áreas, 10 |
| La carga de una toma | Una lista de 30 campos por familia, con una silueta dibujada para BE al costado (de frente y de espalda) y la barra de guardar al pie: 3.034 px a 1440 con el perfil completo. | La figura de Dirección con cada campo unido a su sitio, de a una familia; arriba, el estado del guardado y un solo botón lleno; a la derecha, los datos de la toma y lo que no tiene sitio en la figura: 1.287 px (II.9). | Sustituida | Áreas, 9 |
| «Cambios sin guardar», en la carga de una toma | Bastaba con tocar un campo, aunque se volviera a lo mismo. | Compara lo escrito con lo guardado (II.9). | Corregida | Áreas, 9 |
| Las etiquetas de estado («Borrador», «En preparación · sin registrar», «Solo lectura») | Una píldora en unas pantallas y una etiqueta en otras. | Una etiqueta, como en las maquetas; la píldora queda para el acceso del marco y los estados de una lista. | Aclarada | Áreas, pasada de estética |
| «Cómo se lee esta vista», en Evolución y Lámina | Plegado dentro de la sección. | En el marco, como en las demás secciones (II.9). | Sustituida | Áreas, pasada de estética |
| El botón secundario | Dos: el «secundario», con borde azul de 2 px, y el «quieto», con borde oscuro de 2 px, sin una regla entre ellos. | Uno solo, con borde de 1 px gris medio y texto en peso 600 (I.6). | Sustituida | Áreas, crítica de diseño |
| El texto secundario en Azul noche | Celeste (`#8dcae5`), casi el color de los enlaces. | Gris azulado (`#a3b1c2`) (I.6). | Sustituida | Áreas, crítica de diseño |
| Las listas desplegables y los desplegables | Con la flecha y el triángulo del navegador. | Con la flecha de BE; los desplegables, con 44 px. | Sustituida | Áreas, crítica de diseño |
| El alto del marco de la ficha y de las áreas | 143 px. | 140 px, con renglones de píxeles enteros: con la píldora del acceso más liviana, un alto fraccionario se redondeaba distinto según desde dónde se lo midiera. | Sustituida | Áreas, crítica de diseño |
| Antropometría · Evolución | Dos fechas vacías, puntos naranjas, un eje irregular y un párrafo técnico a la vista. | El control de período de las otras secciones, el azul de los datos, un eje parejo y el párrafo solo para el lector (II.9). | Sustituida | Áreas, crítica de diseño |
| La regla de los 390 px, en Antropometría | La pestaña tenía que poder usarse a 390 px de ancho. | Es de escritorio: con menos de 832 px de escena, los campos de la carga van en lista, sin la figura (II.1, II.9). | Sustituida | Áreas, 9 |
| El alto del marco a 1.440 px y más | 140 px: el acceso, en su propio renglón. | 104 px: desde 1.400 px el acceso va en el primer renglón, entre quién es y «Actualizar», sin acortar «Activo · acceso contextual» (F-148). Por debajo, 140. | Sustituida | Áreas, refinamiento |
| Resumen · lo pendiente y los cambios | Oraciones en negrita de dos líneas («La revisión del 6 oct está registrada y su resultado todavía no se aplicó.»). | Un renglón, como la maqueta 01 («Revisión del 6 oct registrada, sin aplicar»); el detalle, en «Cómo se lee esta vista» (F-151). | Sustituida | Áreas, refinamiento |
| Resumen · el pie de un indicador | Cuatro líneas: la cobertura entera, con sus aclaraciones. | Dos o tres: con qué se calcula y lo que cambia cómo se lee (`coberturaBreve`); la cobertura entera, en Analizar (F-151). | Sustituida | Áreas, refinamiento |
| Línea de tiempo · los días | Con tarjeta los días con algo para mirar; lisos y con la fecha en peso normal, los otros. | Todos en su tarjeta, con la fecha en un peso: llena o sin fondo (F-149). La marca del hito, de todo el alto. | Sustituida | Áreas, refinamiento |
| Plan activo · las plantillas | Dos botones al lado de la acción principal; la huella de la instantánea a la vista. | Un menú «Plantillas»; la huella, plegada en «Constancia técnica» (F-150). | Sustituida | Áreas, refinamiento |
| «Abrir» en «Tus asesorados» | Un botón con borde. | Un enlace con su flecha, como en «Pendientes» (F-152). | Sustituida | Áreas, refinamiento |
| Plantillas, Mis recetas y Mis ejercicios | Centradas (76 rem) y con un título más grande. | Al ancho del Espacio y con su título; las plantillas, en dos columnas desde 1.280 px (F-153). | Sustituida | Áreas, refinamiento |
| Información sin solicitudes | Una caja con una frase y el botón arriba. | El ícono, la frase y «Pedir información» adentro (F-154). | Sustituida | Áreas, refinamiento |
| El espacio entre tarjetas y secciones | De 10 a 26 px, según la pantalla. | 24 px entre tarjetas y 32 entre secciones (F-155); la carga de una toma conserva 16 px entre la figura y los datos, que a 1280 necesitan su ancho. | Sustituida | Áreas, refinamiento |
| Los cuadros de texto | Con la marca para agrandarlos. | Crecen con lo escrito, sin la marca, donde el navegador sabe hacerlo (F-156). | Sustituida | Áreas, refinamiento |
| La persona, para el profesional | «Asesorado · c36743», una referencia derivada del identificador (DL-040, provisorio). | Su nombre visible mientras el vínculo esté vigente, con la referencia chica al lado en la ficha; si no, la referencia (F-157; DL-009 y DL-040). | Sustituida | Áreas, refinamiento |

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
- **Un 503 intermitente de la API** (`P2028`: la transacción no pudo empezar a tiempo) con lecturas concurrentes y poca
  memoria. La pantalla lo muestra con su reintento. Es de la API, no de la interfaz. La mejora medida y el límite que
  queda están en `EVIDENCIA/P2028`; la ficha profesional lee de a cuatro (II.7).
- **Las demás pantallas del website.** Siguen esta guía desde DL-113. Las que se toquen después se revisan con la lista
  de control.
