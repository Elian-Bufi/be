# WP-APP-VUELTA-2 — la APK con profundidad: vidrio en toda la app, primero en Inicio

> **Estado:** etapa A programada en #255 (en borrador, sin integrar; DL-170). El 2026-11-11 Dirección aprobó la etapa A
> (AV2-01 a AV2-18), AV2-D1 (el paso 1), AV2-D2 y AV2-D11; para D3, D4, D5, D7 y D8 rigen las recomendaciones (§6). La
> etapa B espera el visto bueno a la muestra (AV2-18). AV2-T1 a T13, T14 a T16 de la programación y T17 en adelante de la revisión (§10.4), a ratificar. Los
> oráculos están en `WP-APP-VUELTA-2-ORACULOS.md`; lo programado y lo que cambió al programar, en §10.
>
> **Encargo** (Dirección, 2026-11-11): pasó una referencia del tema de vidrio («glassy») para la apariencia de la app,
> porque «actualmente lo siento todo muy plano». Ese mismo día decidió: **«Sí, Inicio + glassy en toda la app»**.
> - Sale en la misma APK que el nombre obligatorio (WP-USO-FINAL, UF-01), antes de congelar la app el 25/11.
> - Antes de extenderlo a toda la app, Dirección ve una pantalla real, el Inicio, en su teléfono.
> - El vidrio del website va dentro del rediseño de los editores (WP-EDITORES-PROFESIONAL), no acá.
>
> **Fuente:**
> - la maqueta oficial: dos imágenes, Azul noche y Claro, que generó ChatGPT con un prompt de Claude y que Dirección
>   aprobó. No están en el repo: se describen en palabras (§1.1), como en WP-APP-VUELTA-DE-ROSCA, para que este paquete
>   sea autocontenido;
> - la crítica de Claude a las capturas de la 0.23 del 2026-11-09: seis errores de lógica de Inicio y observaciones de
>   prioridad media. Se verificaron en el código (§1.3 y §1.4), y la verificación encontró dos defectos nuevos;
> - el código de `main` `f4ef3c4`, leído con git y grep, sin builds. El contraste se midió con la fórmula de
>   `scripts/contraste.test.cjs` en un script aparte (§5.2).
>
> **Datos:** solo sintéticos, en local y en `test`. **Esta declaración:** rama `wp-app-vuelta-2`, desde `main`
> `f4ef3c4`. Es solo documentación: no tiene código ni migraciones.

## 0. Legajo y decisiones que cita

- **El legajo:**
  - TEST-PRJ-009: no calificar. Nunca «cumplimiento», «adherencia» ni «racha»;
  - RNF-ACC-001 y B10-10: la accesibilidad, con WCAG 2.2 AA (4,5:1 para el texto; 3:1 para los bordes de los controles
    y los gráficos que comunican);
  - 08 §33: en `test`, el ambiente siempre a la vista;
  - REG-06-158: un valor no se redondea en silencio.
- **Las DL:**
  - DL-166: la vuelta de rosca. Esta vuelta revisa PV-2 («la que sigue», nunca por la hora), PV-5 (la actividad, un
    solo número) y AVD-2, solo con AV2-D1 y AV2-D2. Conserva PV-11: la fila y la barra de la sesión, fijas y opacas;
  - DL-169: el nombre obligatorio (UF-01, en la misma APK) y el aviso de prueba según el ambiente (UF-08). Con UF-00,
    las APK anteriores quedan en suspenso;
  - DL-167: el rediseño de los editores del website, donde va el vidrio del website;
  - DL-117: la barra de cinco destinos y la cabecera única;
  - DL-152: lo que leen las APK, congelado por versión (con la enmienda de UF-00, solo la última);
  - DL-122: las capacidades que declara el cliente; DL-137 D-7: lo nuevo va en operaciones nuevas;
  - DL-049 y DL-077: BE no elige ni el día tipo ni la sesión;
  - DL-106: la ausencia no es «no realizada»;
  - DL-111: la lámina de la toma, con su paleta propia;
  - DL-143: el aviso del paso que falta para el acceso.
- **Los paquetes y la guía:**
  - `WP-ENTRENAMIENTO-SERIES.md` §7.7 y la excepción 13 de
    `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/REFERENCIAS_VISUALES.md`: la superficie mate, sin
    brillos internos que puedan quedar recortados. Esta vuelta reemplaza la superficie mate y conserva la intención
    (§3.2);
  - `docs/ux/GUIA-UX-UI.md`: I.6 (color y temas), I.8 (íconos), II.2 (el website es mate), III.3 (superficies de la
    APK) y III.4 (el encuadre de la figura, del 2026-10-04);
  - `docs/ux/INICIO-Y-NAVEGACION.md`: la barra, «vidrio ahumado sin desenfoque», y la cabecera;
  - `WP-ESCRITORIO-AREAS.md` F-143: el tenue gris azulado de Azul noche (#A3B1C2), aprobado por Dirección el
    2026-10-15. «La APK conserva el celeste hasta su próxima versión»: es esta;
  - `docs/direccion/LAMINA-DEL-COMPOSITOR.md` §3.9: el vidrio del compositor, precedente aprobado del borde de luz.
- **Otras decisiones de Dirección:**
  - 2026-11-08: se puede celebrar lo que la persona hace, sin rachas que castiguen. Lo no hecho queda neutro, nunca
    rojo. No estaba escrito en el repo: lo registra DL-170;
  - 2026-11-11: las APK viejas no importan (solo las tienen su teléfono y dos o tres familiares), y la descarga del
    website sirve siempre la última (DL-169, UF-00).

## 1. Objetivo

Que la APK deje de sentirse plana sin perder lo que la sostiene. La profundidad sale de un fondo con luz, de tarjetas de
vidrio en dos niveles con un borde de luz, de un botón principal que se nota y de una barra más fina. El contraste se
mide en el peor punto, el rendimiento se mide en el teléfono y nada califica. Y que Inicio diga lo correcto: los seis
errores de la crítica de la 0.23 y los dos defectos nuevos se corrigen, cada uno con su prueba.

**Cómo se mide**, en el teléfono de Dirección, con la misma persona sintética y el mismo día:

| Qué | Hoy (`main` `f4ef3c4`, la 0.23) | Al cerrar el paquete |
|---|---|---|
| Profundidad | Fondo liso. Tarjetas opacas y mates; en Android, la única sombra es `elevation`. Botón principal casi blanco. Barra ahumada al 94 % | Fondo con degradé y dos destellos. Tarjetas de vidrio en dos niveles, con borde y línea de luz y sombra. Botón principal con degradé y resplandor. Barra de vidrio al 88 % |
| Contraste (WCAG 2.2 AA) | La prueba mide el texto sobre la superficie opaca y la barra sobre cualquier color | Texto a 4,5:1 y bordes de control a 3:1 en el peor punto (el degradé con los dos destellos encima, el vidrio sobre cada punto y el nivel 2), en los dos temas (§5.2) |
| Rendimiento | Sin medición de cuadros | Percentil 90 de 16,7 ms o menos a 60 Hz, y no más de 2 puntos de cuadros lentos que la 0.23, en Inicio, Nutrición Hoy, Entrenamiento y Tu historial (§5.3) |
| Inicio | «Hola» y la fecha aparte; íconos en círculos; «3 sesiones registradas»; «la que sigue» sin mirar lo hecho hoy; la comida diferente, perdida | Como la maqueta (§1.1), con los datos de la persona: la fecha como título, la tira de la semana, la sesión en curso sola, las comidas en 2 × 2, y Peso y Actividad lado a lado |
| Errores de lógica | Los seis de la crítica, confirmados en el código (§1.3) | Cada uno, corregido con su prueba y su mutación (§4) |

### 1.1 La maqueta oficial, en palabras

**Azul noche.**
- **El fondo** es un azul muy oscuro, con degradé y destellos de luz cian difusos.
- **Arriba** va solo el logo redondo de BE con su brillo, sin el texto «BE», a la izquierda. A la derecha, una campana
  con un punto cian, sin número.
- **El título** es la fecha: «Lunes 9 de noviembre».
- **La tira de la semana** va en una tarjeta de vidrio: L M M J V S D, con sus números.
  - Los días con sesión registrada (el lunes, una «M» y el viernes) llevan un círculo verde con una tilde blanca.
  - Los demás muestran el número neutro, y el día de hoy, un aro.
  - Debajo, con el ícono del calendario: «3 sesiones esta semana».
- **La tarjeta «Entrenamiento»** (con el ícono de la pesa) lleva:
  - una etiqueta gris, «En curso», con un reloj;
  - «Piernas A» y «2 ejercicios · 7 series · vas por la serie 3»;
  - un botón ancho, cian y con brillo: «Continuar»;
  - el enlace «Ver las 4 sesiones ›».
- **La tarjeta «Comidas»** (con el ícono de la manzana) tiene cuatro fichas en una grilla de 2 × 2, cada una con su
  ícono: «Desayuno · Sin registrar», neutra; «Almuerzo · ✓ 13:10»; «Merienda · Registrar», destacada con un borde cian
  y un +; y «Cena · 3 opciones». Debajo va el enlace «Ver el plan ›».
- **Dos tarjetas chicas,** lado a lado: «Peso · 80,9 kg · Sin cambio desde el 2 sept» y «Actividad · 2 · realizadas ·
  1 no realizada · 30 días».
- **La barra inferior** es flotante, de vidrio y fina: Inicio (elegido, en cian), Nutrición, Entrenamiento, Evolución y
  Perfil, con un punto cian.
- **Las tarjetas** son semitransparentes, con un borde fino de luz y las esquinas redondeadas.

**Claro.** El mismo contenido. El fondo es un gris azulado muy claro, y las tarjetas, blancas y translúcidas, con
sombras suaves. «Continuar» es azul con degradé; «Merienda» lleva un fondo celeste claro y un borde azul; las tildes son
verdes.

### 1.2 Cómo se lee la maqueta

**Se toma tal cual:** el lenguaje visual (el fondo con luz, el vidrio, el borde de luz, el botón con brillo y la barra
fina) y la composición de Inicio, de arriba abajo.

**Lo que la maqueta tiene mal, y la pantalla real no repite.** Conviene avisarle a Dirección antes de la muestra que
estos números se van a ver distintos:
- es lunes 9 y la tira marca con tilde días que todavía no llegaron;
- dice «3 sesiones esta semana» y, en 30 días, «2 realizadas · 1 no realizada». En la app, las dos cuentas salen de la
  misma lectura y no pueden contradecirse;
- la tilde blanca sobre el verde de Azul noche (#6EE7B7) da 1,52:1, y un gráfico que comunica necesita 3:1 (WCAG
  1.4.11). En Azul noche la tilde va oscura, en `botonTexto` (12,29:1). En Claro, la blanca pasa (5,07:1) y se queda.

**Lo que se precisa al pasarla a la app:**
- «vas por la serie 3» no dice si es la tercera del ejercicio o de las siete. Va con el ejercicio: «Sentadilla goblet ·
  serie 3». Si la sesión corre en otro teléfono, esa línea no va;
- «Peso» es la medida destacada de la última toma. Si la toma no trae peso, el título es la medida que trae;
- «3 sesiones esta semana» dice «realizadas», la misma palabra que Actividad (AV2-D2). Sin ninguna, la línea no se
  dibuja;
- el ícono de cada ficha dice su estado (sin registrar, registrada, registrar u opciones), no la comida: los nombres de
  las comidas los escribe el profesional, y BE no adivina un ícono por un nombre (AV2-T10);
- «Ver el plan ›» y «Ver las 4 sesiones ›» llevan el chevron y no el subrayado;
- las fichas y las tarjetas chicas van lado a lado con letra ×1; con ×1,3, en una columna;
- el «gris azulado» del fondo de Claro sale de la sombra de las tarjetas y no de oscurecer el fondo: un fondo más oscuro
  que #F0F4FB deja el tenue, el acento, el éxito y el error por debajo de 4,5:1 (§5.2).

**Lo que la maqueta no muestra y sigue estando, en vidrio:**
- el aviso del paso que falta para el acceso (DL-143), arriba de todo;
- «Para responder», cuando hay algo;
- un área sin plan; el día tipo sin elegir, que Inicio pide sin elegir por la persona (DL-049); y varias sesiones sin
  agenda, entre las que BE tampoco elige (DL-077);
- un día sin sesión, y la sesión de otro día que quedó abierta, con «Dejar incompleta»;
- lo que se ve mientras carga: sin tildes ni ceros;
- en `test`, la línea del ambiente de prueba (08 §33), hasta que UF-08 la resuelva por ambiente;
- la letra ×1,3, TalkBack y el tema Claro, con todo lo anterior.

### 1.3 Los seis errores de la crítica, y dos defectos nuevos

Verificados en `main` `f4ef3c4`. El código de la APK de `main` es el de la 0.23.0-candidata.2: lo que se vio en las
capturas está en `main`.

| # | Lo que se vio | La causa en el código | Parte |
|---|---|---|---|
| 1 | Con una sesión en curso, las otras ofrecen «Empezar» e «Iniciar entrenamiento» | Inicio dibuja cada sesión de hoy con su botón: solo la que está en curso dice «Continuar», y las demás siguen con «Empezar» y «Ya la hice» (`inicio-entrenamiento.tsx:152-170`). Entrenamiento hace lo mismo con «Iniciar entrenamiento» y «Hacerla hoy» (`entrenamiento.tsx:833-887`). El freno es reactivo: recién al tocar, `abrir()` consulta API-TIE-04 (`entrenamiento.tsx:716-727`). La API solo rechaza una segunda corrida (`tiempos.service.ts:245-247`). Además, «En curso» sale de cualquier borrador (`DRAFT_IN_PROGRESS`), no de la corrida abierta | AV2-09 |
| 2 | A las 18:27, con el almuerzo registrado, «la que sigue» es el Desayuno | Es la regla vigente: «la primera sin registrar en el orden del plan, nunca por la hora» (PV-2; `inicio-de-hoy.ts:44-57`), que TEST-AVR-010 congela. El plan no tiene una hora por comida (`contratos-nutricion.ts:193-200`). Nutrición usa la misma regla para la comida que abre (`comidas-de-hoy.ts:29-31`) | AV2-10 y AV2-27, con AV2-D1 |
| 3 | En Evolución, la figura se corta: el hombro derecho queda fuera de la tarjeta | Es a propósito desde el pulido del 2026-10-04: la imagen mide 1,44 veces la lámina, y a la derecha del eje se ve solo un 13 % (`composicion-de-la-figura.ts:66-73` y `:251-257`). La prueba exige que la figura pase el borde (`scripts/composicion-de-la-figura.test.mjs:151-156`) | AV2-19, con AV2-D6 |
| 4 | El (?) de «Cómo se lee» queda desalineado del texto, en Inicio y en Evolución | `tituloDeAyuda` lleva `flex: 1` dentro de una vista en columna que ya lo tiene (`ui.tsx:751`). Con las erratas de Yoga de React Native 0.86, el texto se estira al alto de la fila (48 dp) y queda pegado arriba, mientras el ícono va centrado. La variante «sección» no tiene ese `flex` y se ve bien | AV2-11 |
| 5 | Tu historial dice «0 con desvío» | `desglose30Dias` arma siempre las tres partes, también las que valen cero (`textos-del-descanso.ts:12-13`) | AV2-12 |
| 6 | Inicio dice «3 sesiones registradas» y Tu historial, «2 realizadas y 1 no realizada» | Inicio cuenta todas las ejecuciones de 30 días, también las «No realizada» (`lecturas-de-inicio.ts:137-143`), como pide PV-5. Los totales coinciden por construcción, pero «registrada» se lee como «hecha» | AV2-12, con AV2-D2 |
| Nuevo, severidad alta | La «comida diferente» registrada en el almuerzo: Inicio la deja sin registrar y la cuenta «fuera del plan», mientras Nutrición la muestra registrada | Inicio lee API-NUT-14 (`inicio-nutricion.tsx:29-30`), que toma `mealId` de `comidaId` (`lectura-nutricion.ts:228`). La comida diferente se guarda como `FUERA_DE_PRESCRIPCION`, con la comida en `comidaDeContextoId` (`registro-de-comidas.service.ts:293-300`), y Inicio solo cuenta los `PRESCRIBED` con `mealId` (`inicio-de-hoy.ts:46`). Nutrición (API-ING-01) sí la ve como ocupando la comida (`registro-de-comidas.service.ts:120`). Además, las dos pantallas usan claves distintas, y al volver de Nutrición Inicio puede mostrar lo viejo. Confirmado en el código, sin probar en el teléfono | AV2-13 |
| Nuevo | Tocar «Merienda · Registrar» puede abrir el Desayuno | La ruta `{ nombre: 'hoy', accion: 'registrar' }` no lleva la comida (`navegacion.ts:35`; `inicio-nutricion.tsx:102`), y Nutrición abre en la que se eligió antes o en la primera sin registro | AV2-14 |

### 1.4 Las observaciones de prioridad media

| Observación | Lo que hay en el código | Parte |
|---|---|---|
| Cabecera alta, con «BE» en texto y el aviso de prueba | El isotipo y «BE» al centro con un brillo, la campana con su número, la línea «Ambiente de prueba · solo datos sintéticos» y una línea abajo (`cabecera.tsx:63-134`) | AV2-05 (el aviso, UF-08) |
| Un título grande que no dice nada | «Hola», y la fecha aparte (`inicio.tsx:44-48`) | AV2-07 |
| El cian en todo | La etiqueta de estado es un aro de 2 dp en `tenue`, que en la APK es celeste (#8DCAE5), y parece un botón (`ui.tsx:636-644` y `:744-747`). Los íconos decorativos van en `acento` (`ui.tsx:62`, `:505`, `:526`, `:619`, `:633`). El ícono de cada tarjeta de Inicio mide 24 dp, en un círculo de 36 (`tarjeta-de-inicio.tsx:30-33`) | AV2-01, AV2-04 y AV2-07 |
| Enlaces subrayados y con flecha: doble señal | Todo enlace va subrayado (`ui.tsx:673`), y varios suman la flecha («Ver tu historial», «Ver el plan») | AV2-04 |
| Cuatro formatos de fecha y la hora con «p. m.» | `fecha` y `hora` usan `timeStyle: 'short'` sin `hourCycle` (`formato.ts:2-13`); conviven `fechaLarga`, `dateStyle: medium`, `fechaCorta` y las frases de la agenda | AV2-15 |
| La campana con «47» | El número de novedades sin leer, hasta «99+» (`cabecera.tsx:73-79`) | AV2-05, con AV2-D7 |
| Íconos decorativos grandes | El de cada tarjeta de Inicio (`tarjeta-de-inicio.tsx:30-33`, `:113`) | AV2-07 |
| Decimales distintos: «39 cm» y «58,8 cm» | `cantidad` sin máximo no completa ceros, para no redondear en silencio (`packages/domain/src/formato-numeros.ts:24-37`) | AV2-25, con AV2-D9 |
| Nutrición: el hueco de la foto, la tarjeta vecina asomando y tres formas de navegar | El marco de 16:10 aunque no haya imagen (`nutricion-hoy.tsx:525-544`); 24 dp de la siguiente a la vista (`carrusel-de-opciones.ts:16-17`); deslizar, flechas y puntitos (`nutricion-hoy.tsx:567-617`); «Estimación del plan» en cian sin ser tocable (`:751`) | AV2-21, con AV2-D10 |
| Evolución: los selectores separados y la jerga | «Perímetros \| Pliegues» arriba y «Hombre \| Mujer» abajo, sin rótulo visible (`figura-de-la-toma.tsx:178-191`, `:235-248`); «T1» y «T2» (`resumen-de-la-toma.ts:99`); «16 medidas · 6 resultados de fórmulas» y «Ver su evolución» (`inicio-mediciones.tsx:45-63`) | AV2-07 y AV2-20 |
| «Día habitual» bajo Comidas | Es el nombre que el editor del website pone por defecto (`apps/web/src/app/pro/advisees/nutrition/plan.tsx:143`), y Inicio lo muestra siempre (`inicio-nutricion.tsx:37-40`) | AV2-07 |
| Tu historial: el período no se dice y cada sesión pesa | El resumen cuenta 30 días y la lista pide 90 sin decirlo; cada sesión es una tarjeta con hasta tres píldoras con borde y un botón (`historial.tsx:62-63`, `:101`, `:126-158`) | AV2-22 |

## 2. Alcance y lo que queda fuera

**Entra:**
- la receta de vidrio en tokens, en los dos temas, con su prueba de contraste, y su aplicación desde unos pocos
  archivos: el fondo, las piezas base, la cabecera y la barra;
- Inicio según la maqueta, con los seis errores y los dos defectos nuevos;
- con el visto bueno de Dirección a la muestra, el resto de la APK: las superficies propias de cada pantalla, la sesión
  enfocada, Nutrición Hoy, Evolución y Tu historial, con las observaciones de prioridad media;
- las fechas y las horas, y las medidas con un decimal;
- la medición de contraste y de rendimiento, y la guía al día.

**Queda fuera:**
- **El aviso de prueba.** Lo resuelve UF-08 de WP-USO-FINAL, por ambiente. Hasta entonces, en `test` sigue a la vista
  (08 §33), como una línea fina debajo de la cabecera.
- **El vidrio del website.** Va en WP-EDITORES-PROFESIONAL. Hasta entonces, el website sigue mate (GUIA II.2).
- **iPhone.**
- **La lámina de la toma** (DL-111). Conserva su paleta opaca y su dibujo, y a lo sumo lleva un marco de vidrio. Ningún
  punto anatómico se mueve: la figura entera se escala con su capa de puntos (AV2-19).
- **El movimiento.** Nada pulsa ni se anima: los destellos y el resplandor son quietos.
- **Librerías nuevas para la muestra.** El desenfoque entra solo con AV2-D3.
- **Reglas y escrituras.** No cambia ninguna regla del registro, del plan ni de lo que la persona puede hacer, y no hay
  escrituras nuevas. La muestra no toca la API. Las dos piezas con API son opcionales y van con su decisión: la hora
  habitual (AV2-27) y, solo si la medición lo pide, una lectura liviana para la tira (AV2-08).

## 3. Lo decidido por Dirección

1. **«Sí, Inicio + glassy en toda la app»** (2026-11-11), con la maqueta oficial (§1.1) como referencia aprobada y su
   lectura (§1.2).
2. **Sale en la misma APK que UF-01**, antes del congelamiento del 25/11.
3. **Primero, una pantalla real en su teléfono:** el Inicio. Recién con su visto bueno se extiende a toda la app.
4. **El vidrio del website va en WP-EDITORES-PROFESIONAL.**
5. **Se puede celebrar lo que la persona hace** (2026-11-08), sin rachas que castiguen. Lo no hecho queda neutro, nunca
   rojo. En la maqueta, eso es la tilde verde en el día con sesión y en la comida registrada.
6. **Las APK anteriores no importan** (2026-11-11). Lo nuevo no tiene que cuidar lo que leían las versiones anteriores
   (DL-169, UF-00), aunque sí la ventana entre un despliegue de la API y la actualización de la app (AV2-27).

### 3.1 La receta de vidrio, en tokens

Todos los colores viven en `apps/mobile/src/tema.ts`, en `AZUL_NOCHE` y `CLARO`. La prueba lee los opacos como
`#rrggbb` y los translúcidos como `#rrggbbaa`, y exige las mismas claves en cada grupo y en los dos temas. Por eso, un
token translúcido en un tema y opaco en el otro se escribe con alfa en los dos (`#rrggbbFF`). El token es el color; la
geometría de cada sombra, `{x, y, desenfoque, extensión}` en dp, vive en `vidrio.tsx`.

| Token | Azul noche | Claro | Para qué | Hoy |
|---|---|---|---|---|
| `fondoArriba` (nuevo) | #04223D | #F7F9FD | El color de arriba del degradé del fondo | — |
| `fondo` | #011325, al 55 % del alto | #F2F6FC, al medio | El medio del degradé, y el fondo liso con alto contraste | Igual |
| `fondoAbajo` (nuevo) | #000D1A | #F0F4FB | El color de abajo. El velo de la barra sale de acá | — |
| `destello` (nuevo) | #27D5F91F: cian al 12 %, arriba | #FFFFFF99: aclara | El destello de arriba | — |
| `destelloAzul` (nuevo) | #1D98DE24: azul al 14 %, a media altura, del otro lado | #F0FAFFCC: aclara | El segundo destello | — |
| `vidrio` (nuevo) | #072B449E | #FFFFFFC7 | La tarjeta de nivel 1 | — |
| `vidrioInterior` (nuevo) | #FFFFFF0F | #FFFFFFFF (opaco) | El nivel 2, sin sombra | — |
| `vidrioFilo` | #96C8EB3B (el del compositor) | #FFFFFFE6 | El borde de luz, de 1 dp | #FFFFFF1C · #0A1F4414 |
| `vidrioLuz` (nuevo) | #FFFFFF33 | #FFFFFF00 | La línea de luz bajo el borde de arriba: sombra interior {0, 1, 0} | — |
| `vidrioBrillo` | #FFFFFF0D, que se apaga al 45 % del alto | #FFFFFF00 | El brillo de arriba, solo en Azul noche | #FFFFFF10 · #FFFFFF00 (no se dibuja) |
| `sombraVidrio` (nuevo) | #00000059 {0, 8, 24, −4} | #14326421 {0, 8, 24} | La sombra del nivel 1 | `elevation` 3 |
| `botonFondo` | #27D5F9 | #1E6BF2 | El botón principal, arriba | #E8F5FE · igual |
| `botonFondoFin` (nuevo) | #16B4E8 | #1453C9 | El botón principal, abajo | — |
| `resplandorPrimario` (nuevo) | #27D5F94D {0, 6, 18} | #1E6BF240 {0, 6, 18} | El brillo del botón principal habilitado | — |
| `tenue` | #A3B1C2 | #5B6B82 | El texto secundario | #8DCAE5 · #62728A |
| `barraTexto` | #A3B1C2 | #4A5A70 | Las etiquetas de la barra | #8DCAE5 · igual |
| `barraVidrio` | #0A2B47E0 (88 %) | #FFFFFFE0 (88 %) | La cápsula de la barra | #0A2B47F0 · #FFFFFFF2 |
| `bordeControl` | #6497BD | #7B8EA8 | El borde de los campos y las casillas | #4F7FA3 · igual |
| `etiquetaFondo` (nuevo) | #FFFFFF14 | #0A1F440F | La etiqueta de estado neutra, con el texto en `tenue` | — |
| `destacadaFondo` (nuevo) | #27D5F914 | #EEF5FFFF (opaco) | El tinte de «la que sigue», con el borde en `acento` | — |
| `superficie` | #052238 | #FFFFFF | Sigue opaca: es el vidrio ya resuelto sobre el fondo liso | Igual |

- **Los radios:** tarjeta 20, ficha y botón 14, cápsula 999 (AV2-T11).
- **El degradé del brillo** termina en el mismo color con alfa 00, nunca en `transparent`, que en Android tiñe de gris.
- **`laminaBrillo` se retira** con su medición: no se dibuja desde el 2026-10-06. `vidrioBrillo` pasa a medirse en su uso
  nuevo. `sombra` queda para la lámina y para lo que todavía no migró.

### 3.2 Cómo se aplica: desde un solo lugar

- **`vidrio.tsx` es la receta** (AV2-02). `superficieDeVidrio(COLOR, nivel)` devuelve el fondo, el borde, el radio y la
  sombra de una superficie:
  - **nivel 1**, una tarjeta o una sección suelta: `vidrio`, el borde de luz, radio 20, `sombraVidrio` por fuera y
    `vidrioLuz` por dentro; en Azul noche, además, el brillo de arriba;
  - **nivel 2**, lo que va adentro de un nivel 1 (una tarjeta dentro de una sección, las fichas, los Segmentos, el aviso
    informativo, la etiqueta de estado y el botón secundario): `vidrioInterior`, radio 14 y sin sombra.

  Un contexto, `NivelDeVidrio`, resuelve el anidado. Seccion, TarjetaDeInicio y una Tarjeta suelta son nivel 1 y lo
  proveen, y lo que va adentro baja solo a nivel 2: vidrio dentro de vidrio, con dos sombras, se ensucia.
- **Ninguna vista hija** (AV2-T3). El borde de luz es el borde de 1 dp que ya existe, con otro color. La línea de luz y la
  sombra son `boxShadow`. El brillo es `experimental_backgroundImage` de la propia vista, que React Native 0.86 dibuja en
  esa vista y recorta a su radio. Es la intención de la excepción 13: no hay nada adentro que pueda quedar recortado,
  como la placa del brillo de antes (`WP-ENTRENAMIENTO-SERIES.md` §7.7).
- **La sombra es `boxShadow`, sin `elevation`** (AV2-T4). Con un fondo translúcido, Android dibuja la sombra de
  `elevation` debajo de toda la vista, y se ve a través del vidrio como una mancha. `boxShadow` recorta el interior. La
  sombra exterior pide Android 9, y la interior, Android 10: antes no se dibujan y nada se rompe. `sombraDeVidrio` se
  queda para la lámina de la figura (`figura-de-la-toma.tsx:335-351`).
- **`superficie` sigue opaca** (AV2-T2). En Azul noche, `vidrio` sobre el fondo liso da exactamente #052238, que es
  `superficie`; en Claro da #FCFDFE, contra #FFFFFF. Los diálogos, la fila fija de la sesión, los campos y lo que todavía
  no migró siguen opacos y no desentonan.
- **El fondo de la app** (AV2-03) es una vista propia, `FondoDeLaApp`: el degradé lineal y los dos destellos radiales,
  dibujados con `experimental_backgroundImage` desde los tokens, sin mapa de bits (AV2-T1).
- **Lo que sigue opaco por decisión:** la fila fija y la barra durante la sesión (PV-11: «nada se ve a través»), y los
  diálogos sobre su velo. Llevan el borde y la línea de luz y la sombra nueva, con radio 20; el botón del medio de la
  fila, además, el resplandor.
- **Con el «Texto de alto contraste» de Android** (`AccessibilityInfo.isHighTextContrastEnabled()` y su evento, en un
  `useAltoContraste` junto a `useMovimientoReducido`), `superficieDeVidrio` devuelve la superficie opaca y el fondo de la
  app queda liso.
- **Sin librerías nuevas** (AV2-T9). `boxShadow` y `experimental_backgroundImage` vienen con React Native 0.86.3 y quedan
  encapsulados en `vidrio.tsx`: si React Native renombra la propiedad, se toca un archivo. **Plan B**, si el degradé no se
  dibuja en el teléfono: `expo-linear-gradient` (~57.0.2, del SDK 57) para el fondo y el botón principal; sin destellos,
  el fondo queda con el degradé lineal solo. No entran Skia ni reanimated, que suman peso nativo y memoria sin
  necesidad. `expo-glass-effect` es el vidrio de iOS 26 y no sirve en Android.
- **El relleno de la tarjeta se exporta** desde `vidrio.tsx`, y las cuentas de anchos lo usan
  (`inicio-nutricion.tsx:66-69`, `entrenamiento.tsx:1757`, `composicion-de-la-figura.ts:94-99`,
  `disposicion-de-la-toma.ts:139`, `comidas-de-hoy.ts:37`). La receta no cambia rellenos ni el borde de 1 dp; si un
  relleno cambia, su constante cambia en el mismo commit.

### 3.3 Qué cambia en toda la app desde la muestra, y qué se prende solo en Inicio

- **En toda la app, desde la muestra:**
  - los colores de los tokens: el tenue, el botón principal, el borde de los campos y la barra;
  - el fondo con luz, la cabecera y la barra;
  - las correcciones de las piezas base que no son vidrio: el enlace con flecha sin subrayado, la etiqueta de estado
    neutra, los íconos decorativos en `tenue`, «Cómo se lee» alineado, los textos sin ceros, y las fechas y las horas.
- **Solo en Inicio, hasta el visto bueno de Dirección:** el vidrio (las superficies translúcidas en dos niveles, con su
  borde y su línea de luz, su brillo y su sombra) y el degradé con resplandor del botón principal. Lo gobierna un
  interruptor del contexto, `activo`, que App.tsx prende solo en la ruta `inicio`. Con el visto bueno, se prende en toda
  la app con una línea (AV2-26).
- **Las demás pantallas no desentonan:** con el interruptor apagado, una tarjeta es la superficie opaca de hoy, que es el
  vidrio ya resuelto sobre el fondo liso. Solo se distingue cuando pasa por encima de un destello.

### 3.4 Lo que dice TalkBack

Cada parte que dibuja una de estas piezas se acepta cuando el lector dice esto, en el árbol de accesibilidad y después
en el teléfono. Cada ícono va con su texto, y el lector no recorre el dibujo.

| Pieza | Parte | Lo que dice |
|---|---|---|
| Logo | AV2-05 | «BE», una vez. El brillo no se lee |
| Campana | AV2-05 | «Novedades, 47 sin leer, botón». El punto no se lee aparte |
| Título | AV2-07 | «Lunes 9 de noviembre», como encabezado |
| Tira de la semana | AV2-08 | Una sola etiqueta: «Esta semana: lunes y miércoles con sesión realizada. Hoy, lunes 9» |
| Etiqueta de estado | AV2-07, AV2-09 | «Estado: en curso». El reloj no se lee |
| Ficha de comida | AV2-07, AV2-10 | «Almuerzo, registrado a las 13:10, botón» · «Merienda, registrar, botón» · «Desayuno, sin registrar, botón» · «Cena, 3 opciones, botón» |
| Peso | AV2-07 | «Peso, 80,9 kilos, sin cambio desde el 2 de septiembre. Ver la evolución del peso, botón» |
| Actividad | AV2-07, AV2-12 | «Actividad de los últimos 30 días: 2 realizadas y 1 no realizada» |
| Fondo, destellos y brillos | AV2-03 | Nada: no se recorren |
| Barra | AV2-06 | Como hoy: «Inicio, pestaña, 1 de 5, seleccionada»; en Perfil, «hay algo para responder» |

## 4. Las partes

Cada parte dice si toca la API. «No» quiere decir que usa solo operaciones y lecturas que ya existen, con el mismo
permiso que en su módulo. Si al programar una parte resulta que una lectura no trae lo que hace falta, la parte se
detiene y se declara: no se inventa el dato ni se abre una operación sin decisión.

**Las pruebas nuevas** van en `apps/mobile/src/*.test.ts` (el jest de la APK) o en los archivos que ya están en
`npm test` (`scripts/contraste.test.cjs`, `scripts/vuelta-de-rosca.test.mjs`, `scripts/composicion-de-la-figura.test.mjs`,
`scripts/registro-de-comidas.test.mjs` y `scripts/copy-pantallas.test.cjs`). Así no se toca el `package.json` de la raíz,
que está en el `buildFilter` de la API y del website (`render.yaml`) y los redespliega (AV2-T12). Cada prueba se
verifica con una mutación: se rompe la regla a propósito, la prueba se pone en rojo y se vuelve atrás.

| ID | Qué | Etapa | Toca la API | Decisión | Oráculos |
|---|---|---|---|---|---|
| AV2-01 | Los tokens de la receta y su prueba de contraste | A | No | §3.1 | TEST-AV2-001 |
| AV2-02 | La receta en un solo lugar: niveles, interruptor y alto contraste | A | No | AV2-T2 a T4 | TEST-AV2-002 y 003 |
| AV2-03 | El fondo de la app | A | No | AV2-T1 | TEST-AV2-004 |
| AV2-04 | Las piezas base y el cian solo para lo que se toca | A | No | — | TEST-AV2-005 |
| AV2-05 | La cabecera | A | No | AV2-D7 y D8 | TEST-AV2-006 |
| AV2-06 | La barra | A | No | — | TEST-AV2-007 |
| AV2-07 | Inicio según la maqueta | A | No | — | TEST-AV2-008 |
| AV2-08 | La tira de la semana | A | No (una lectura liviana, solo si la medición la pide y con su decisión) | AV2-D5 | TEST-AV2-009 |
| AV2-09 | Error 1: con una sesión en curso, ninguna otra ofrece empezar | A | No | AV2-D4 | TEST-AV2-010 |
| AV2-10 | Error 2: «la que sigue», anclada en lo registrado hoy | A | No | AV2-D1 | TEST-AV2-011 |
| AV2-11 | Error 4: «Cómo se lee», alineado | A | No | — | TEST-AV2-012 |
| AV2-12 | Errores 5 y 6: la actividad, contada de una sola manera y sin ceros | A | No | AV2-D2 | TEST-AV2-013 |
| AV2-13 | Las comidas de Inicio leen lo mismo que Nutrición | A | No | — | TEST-AV2-014 |
| AV2-14 | Tocar una comida abre esa comida | A | No | — | TEST-AV2-015 |
| AV2-15 | Fechas y horas: tres formas y 24 h | A | No | — | TEST-AV2-016 |
| AV2-16 | El rendimiento, antes y después | A | No | — | La medición (§5.3) |
| AV2-17 | La guía y los documentos, al día con el código | A | No | — | — |
| AV2-18 | La muestra en el teléfono de Dirección | A | No | AV2-D11 | La evidencia |
| AV2-19 | Error 3: la figura entera en Evolución | B | No | AV2-D6 | TEST-AV2-017 |
| AV2-20 | Evolución: los controles juntos y sin jerga | B | No | — | TEST-AV2-018 |
| AV2-21 | Nutrición Hoy: la opción compacta y una sola navegación | B | No | AV2-D10 | TEST-AV2-019 |
| AV2-22 | Tu historial: el período a la vista y una fila por sesión | B | No | — | TEST-AV2-020 |
| AV2-23 | La sesión enfocada, con vidrio, y lo opaco, opaco | B | No | — | TEST-AV2-021 |
| AV2-24 | Las superficies propias que quedan, y las pantallas que heredan | B | No | — | TEST-AV2-022 |
| AV2-25 | Las medidas con un decimal | B | No | AV2-D9 | TEST-AV2-023 |
| AV2-26 | El vidrio, prendido en toda la app | B | No | AV2-D12 | TEST-AV2-002 |
| AV2-27 | «La que sigue», con la hora habitual | B, opcional | **Sí: dominio y API** | AV2-D1 | TEST-AV2-024 |
| AV2-28 | El desenfoque en la barra | B, opcional | No (un módulo nativo nuevo) | AV2-D3 | TEST-AV2-025 |
| AV2-29 | La candidata con UF-01, la evidencia y TalkBack | Cierre | No | — | Todos |

### 4.1 Etapa A · la muestra: Inicio y lo que lo sostiene (solo de la APK)

**AV2-01 · Los tokens de la receta y su prueba de contraste**
- *Qué cambia:*
  - los tokens de §3.1, en los dos temas y con las mismas claves. Los opacos nuevos (`fondoArriba`, `fondoAbajo` y
    `botonFondoFin`) van como `#rrggbb`; los translúcidos, como `#rrggbbaa`;
  - el tenue de Azul noche pasa al del website (F-143), y el de Claro, a #5B6B82;
  - `laminaBrillo` se retira con su medición;
  - el encabezado de `tema.ts` dice por qué `superficie` sigue opaca y por qué los destellos tienen ese tope.
- *Archivos:* `apps/mobile/src/tema.ts`; `scripts/contraste.test.cjs`.
- *API:* no.
- *Dado* los dos temas, *cuando* corre la prueba de contraste, *entonces* pasan, en el peor punto:
  - el texto, el tenue, el acento, el éxito y el error, directo sobre el fondo: en sus tres puntos, con cada destello
    solo y con los dos juntos;
  - los mismos, sobre el vidrio encima de cada uno de esos puntos y sobre el nivel 2;
  - `botonTexto` sobre los dos extremos del botón principal;
  - `bordeControl` sobre el vidrio y el nivel 2, a 3:1;
  - la tilde del día sobre `exito`, y el círculo y el aro de hoy contra la tarjeta, a 3:1;
  - el tenue sobre la etiqueta de estado y sobre «la que sigue», y el acento sobre «la que sigue»;
  - las etiquetas de la barra sobre su vidrio, con cualquier color del tema detrás.
- *Dado* un color escrito fuera de `tema.ts`, *entonces* la prueba falla, como hoy.
- *Pruebas:* `scripts/contraste.test.cjs`. Mutación: los destellos de Azul noche al 14 % y al 18 % → el tenue sobre el
  fondo baja a 4,16:1 y el error a 4,47:1, y la prueba falla. TEST-AV2-001.

**AV2-02 · La receta en un solo lugar: niveles, interruptor y alto contraste**
- *Qué cambia:*
  - `vidrio.tsx` exporta `superficieDeVidrio(COLOR, nivel)`, el contexto `NivelDeVidrio` y el relleno de la tarjeta, como
    dice §3.2;
  - el contexto lleva también `activo`, el interruptor de §3.3;
  - `useAltoContraste` va junto a `useMovimientoReducido`;
  - el encabezado de `vidrio.tsx` cambia: la superficie mate deja de ser la regla, y se conserva la intención de la
    excepción 13.
- *Archivos:* `apps/mobile/src/vidrio.tsx`; nuevo, `apps/mobile/src/alto-contraste.ts`; `apps/mobile/App.tsx` (el
  proveedor y el interruptor).
- *API:* no.
- *Dado* una sección, *cuando* adentro va una tarjeta, *entonces* la sección es nivel 1, con sombra, y la tarjeta es
  nivel 2, sin sombra.
- *Dado* el interruptor apagado o el «Texto de alto contraste» de Android encendido, *cuando* se pide una superficie,
  *entonces* se devuelve la superficie opaca de hoy.
- *Dado* el vidrio prendido, *entonces* la superficie no agrega ninguna vista hija y lo translúcido no usa `elevation`.
- *Pruebas:* prueba pura de `superficieDeVidrio`, por nivel, por tema, con el alto contraste y con el interruptor; prueba
  de estructura de que el vidrio no agrega vistas ni usa `elevation`. Mutaciones: devolver sombra en el nivel 2; usar
  `elevation` en el nivel 1. TEST-AV2-002 y 003.

**AV2-03 · El fondo de la app**
- *Qué cambia:*
  - `FondoDeLaApp` es el primer hijo de la raíz de App.tsx: absoluto, fuera del desplazamiento (no se vuelve a dibujar
    al desplazar), sin toques (`pointerEvents="none"`) y oculto al lector, como hoy el velo de la barra;
  - dibuja el degradé lineal y los dos destellos radiales con `experimental_backgroundImage`, desde los tokens;
  - las medidas salen de `useWindowDimensions`, nunca en porcentajes, para que no salte al abrir el teclado;
  - la raíz deja de pintar el fondo liso, salvo con alto contraste;
  - el velo de la barra pasa de `fondo` a `fondoAbajo`: si no, abajo queda una franja.
- *Archivos:* `apps/mobile/App.tsx`; nuevo, `apps/mobile/src/fondo-de-la-app.tsx`; `apps/mobile/src/barra-de-zonas.tsx`
  (el velo).
- *API:* no.
- *Dado* cualquier pantalla, *cuando* la persona desplaza el contenido, *entonces* el fondo y sus destellos quedan quietos
  y el contenido pasa por encima.
- *Dado* el teclado abierto, *entonces* el fondo no cambia de tamaño ni salta.
- *Dado* el alto contraste, *entonces* el fondo es `fondo`, liso.
- *Dado* TalkBack, *entonces* el fondo no se recorre.
- *Pruebas:* estructura (el fondo va fuera del desplazamiento, oculto al lector y sin toques) y prueba pura de la receta
  del degradé desde los tokens. TEST-AV2-004.

**AV2-04 · Las piezas base y el cian solo para lo que se toca**
- *Qué cambia en `ui.tsx`:*
  - **Seccion y Tarjeta:** vidrio por nivel, desde `superficieDeVidrio`;
  - **el botón principal:** el degradé de `botonFondo` a `botonFondoFin` con `experimental_backgroundImage`, el
    resplandor solo si está habilitado y sin pulso, y radio 14. El borde de 2 dp queda transparente, para que no cambie
    el alto;
  - **el botón secundario:** nivel 2;
  - **el enlace:** sin subrayado cuando lleva flecha; el chevron «›» (`derecha`, de 18 dp) va pegado al texto. El
    subrayado queda para un enlace dentro de un párrafo;
  - **la etiqueta de estado (Insignia):** rellena con `etiquetaFondo`, sin borde, con el texto en `tenue` y un ícono de
    15 dp. Lo hecho («Realizada», «Registrada») lleva la tilde en `exito`;
  - **Segmentos:** el contenedor, nivel 2; la opción elegida, en `botonFondo`;
  - **Desplegable:** los íconos en `tenue` y el separador con el borde de luz;
  - **Aviso informativo:** nivel 2;
  - **los íconos decorativos** de Parrafo, Seccion, Desplegable y Aviso, en `tenue`;
  - **el esqueleto de carga** (`estados.tsx`): nivel 1.
- *No cambian:* Campo (solo `bordeControl`), Casilla, Pestanas, Cifra, Dato, Titulo y Rotulo.
- *Archivos:* `apps/mobile/src/ui.tsx`; `apps/mobile/src/estados.tsx`.
- *API:* no.
- *Dado* un botón principal deshabilitado, *entonces* no tiene resplandor.
- *Dado* un enlace con flecha, *entonces* no está subrayado y TalkBack lo lee como enlace.
- *Dado* una etiqueta de estado, *entonces* no tiene borde ni se parece a un botón.
- *Pruebas:* prueba de estructura de las tres reglas. Mutación: el resplandor también en un botón deshabilitado.
  TEST-AV2-005.

**AV2-05 · La cabecera**
- *Qué cambia:*
  - transparente sobre el fondo y sin la línea de abajo; una fila de 48 dp;
  - en las cinco raíces, el logo a la izquierda, con su brillo y sin el texto «BE». El logo pasa a ser accesible, con el
    nombre «BE»;
  - en un detalle, «Volver» a la izquierda (AV2-D8);
  - la campana, a la derecha, con un punto cian de 8 dp y sin número (AV2-D7). El número sigue en su nombre para TalkBack;
  - en `test`, la línea del ambiente sigue, fina y en `tenue`, debajo de la fila, hasta que UF-08 la resuelva.
- *Archivos:* `apps/mobile/src/cabecera.tsx`.
- *API:* no.
- *Dado* 47 novedades sin leer, *cuando* se dibuja la cabecera, *entonces* se ve un punto sin número y TalkBack dice
  «Novedades, 47 sin leer, botón».
- *Dado* ninguna sin leer, *entonces* no hay punto.
- *Dado* `test`, *entonces* la línea del ambiente sigue a la vista.
- *Pruebas:* prueba de estructura (el logo con nombre, el punto sin número, el número en el nombre accesible y la línea
  del ambiente). TEST-AV2-006.

**AV2-06 · La barra**
- *Qué cambia:*
  - la receta: el borde y la línea de luz, y `boxShadow` en lugar de `elevation` 8;
  - `barraVidrio` al 88 %;
  - un destino de 52 dp, que sigue por encima de los 48 del objetivo táctil;
  - lo demás no cambia: el orden, las etiquetas, el punto de Perfil y el brillo del elegido;
  - durante la sesión, sigue fija y opaca (PV-11).
- *Archivos:* `apps/mobile/src/barra-de-zonas.tsx`; `apps/mobile/src/disposicion-de-la-barra.ts`;
  `scripts/barra-de-zonas.test.mjs`.
- *API:* no.
- *Dado* letra ×1,3 a 360 dp, *cuando* se dibuja la barra, *entonces* pasa a dos filas sin cortar ni achicar ninguna
  etiqueta, como hoy.
- *Dado* la sesión en curso, *entonces* la barra es opaca y nada se ve a través.
- *Pruebas:* `scripts/barra-de-zonas.test.mjs`, con el destino de 52 dp. Mutación: la barra translúcida durante la sesión.
  TEST-AV2-007.

**AV2-07 · Inicio según la maqueta**
- *Qué cambia:*
  - **el título** es la fecha, «Lunes 9 de noviembre», sin «Hola» y sin coma;
  - **las tarjetas** usan las piezas base: `TarjetaDeInicio` deja su hoja propia y su ícono pasa a 20 dp, en `tenue`, en
    línea con el título y sin círculo;
  - **Entrenamiento,** con una sesión en curso, como dice AV2-09. Con varias sesiones posibles, sin agenda y ninguna en
    curso, sigue dejando elegir (DL-077);
  - **Comidas:** la grilla de 2 × 2 con «la que sigue» (AV2-10), leída de API-ING-01 (AV2-13). Cada ficha se toca y
    abre su comida (AV2-14). El nombre del día del plan va bajo «Comidas» solo si el plan tiene más de un tipo de día;
  - **Peso y Actividad,** dos tarjetas chicas lado a lado, que reemplazan a Mediciones y a «Tu actividad»:
    - Peso es la medida destacada de la última toma. Se toca entera y abre la evolución de esa medida. Con diferencia
      cero dice «Sin cambio desde el 2 sept»; si no, por ejemplo, «+0,4 kg desde el 2 sept», sin color ni flecha
      que juzgue. Se van «16 medidas · 6 resultados de fórmulas» y el «Ver su evolución» que no decía de qué;
    - Actividad, con el texto de AV2-12;
  - **lo condicional** de §1.2 sigue, en vidrio: el aviso del acceso arriba de todo, «Para responder», un área sin plan y
    el día tipo sin elegir;
  - **con letra ×1,3,** la grilla y las tarjetas chicas pasan a una columna;
  - **el rótulo «Para mirar»** se va: la maqueta no lo tiene, y las dos tarjetas chicas se leen solas.
- *Archivos:* `apps/mobile/src/pantallas/inicio.tsx`, `tarjeta-de-inicio.tsx`, `inicio-entrenamiento.tsx`,
  `inicio-nutricion.tsx` e `inicio-mediciones.tsx`; `apps/mobile/src/textos-de-la-vuelta.ts`.
- *API:* no.
- *Dado* una persona con planes de Entrenamiento y de Nutrición, *cuando* abre Inicio a 360 dp con letra ×1,
  *entonces* ve, de arriba abajo, la fecha, la tira, Entrenamiento, Comidas y, lado a lado, Peso y Actividad.
- *Dado* letra ×1,3, *entonces* las fichas y las tarjetas chicas van en una columna, y no se achica ni se corta ningún
  texto.
- *Dado* un plan con un solo tipo de día, *entonces* bajo «Comidas» no dice «Día habitual».
- *Dado* cualquier estado de Inicio, *entonces* Inicio no escribe nada.
- *Pruebas:* prueba pura de qué bloques aparecen y cuáles no, de la composición con ×1 y ×1,3 y del nombre del día;
  `scripts/copy-pantallas.test.cjs` sin palabras prohibidas. Mutación: mostrar el nombre del día con un solo tipo.
  TEST-AV2-008.

**AV2-08 · La tira de la semana**
- *Qué cambia:*
  - una pieza nueva arriba de Entrenamiento: la semana de lunes a domingo (AV2-D5), según el día de la API
    (`useDiaDeLaApi`);
  - `leerActividadDeEntrenamiento` suma un detalle por día, de la misma lectura (API-TRN-19-LISTA, 30 días, que siempre
    contienen la semana): las realizadas y las no realizadas, con la condición vigente después de las correcciones;
  - hoy se toma también de API-TRN-14 (una ejecución registrada), por si la lectura de 30 días quedó un día atrás;
  - debajo, con el ícono del calendario, «N sesiones realizadas esta semana».
- *Archivos:* `apps/mobile/src/lecturas-de-inicio.ts`; nuevo, `apps/mobile/src/pantallas/tira-de-la-semana.tsx`;
  `apps/mobile/src/pantallas/inicio.tsx`.
- *API:* no. Esta lectura sube a lo alto de la pantalla, y la API arma cada ejecución de a una. Si en `test` tarda, se
  mide, y una lectura liviana de sesiones por día se declara con su decisión: no entra sin el sí.
- *Dado* una semana con una sesión realizada el lunes y una «No realizada» el martes, *cuando* se arma la tira,
  *entonces* el lunes lleva el círculo `exito` con la tilde en `botonTexto`, y el martes muestra el número neutro, como
  los días sin sesión y los que todavía no llegaron. Nunca rojo ni cruz.
- *Dado* hoy, *entonces* lleva un aro.
- *Dado* que todavía carga, *entonces* la tira va sin tildes y sin «0». Sin ninguna realizada, la línea de abajo no se
  dibuja.
- *Dado* cualquier semana, *entonces* no hay cuenta de días seguidos ni nada que pase a la semana siguiente.
- *Pruebas:* prueba pura del armado (realizada, con desvío, no realizada, corregida, días por venir y cambio de semana)
  y de la etiqueta para TalkBack de §3.4. Mutación: la tilde en un día con solo una «No realizada». TEST-AV2-009.

**AV2-09 · Error 1: con una sesión en curso, ninguna otra ofrece empezar**
- *Qué cambia:*
  - una función pura en `sesion-en-curso.ts`, por ejemplo `sePuedeIniciar(ocurrencia, enCurso)`, que da verdadero solo
    si no hay ninguna en curso o si es esa misma;
  - la sesión en curso la da API-TIE-04, o la corrida abierta del teléfono si la API no responde;
  - **Inicio** muestra solo la sesión en curso:
    - el nombre;
    - «En curso» o «En pausa», según el `state` de API-TIE-04, como etiqueta neutra con el reloj;
    - «2 ejercicios · 7 series» y, si la corrida es de este teléfono, el ejercicio y la serie («Sentadilla goblet ·
      serie 3»);
    - «Continuar», ancho, y «Ver las N sesiones ›», con N de API-TRN-14;
    - si la sesión es de otro día, también «Dejar incompleta»;
  - **Entrenamiento** lista las otras sesiones sin «Iniciar entrenamiento» ni «Hacerla hoy», con una línea neutra: «Hay
    un entrenamiento en curso: Piernas A. Para iniciar otra, primero continualo o dejalo incompleto». «Ya la hice», según
    AV2-D4;
  - la etiqueta «En curso» sale de la corrida abierta, no de cualquier borrador;
  - el freno de `useAbrirOcurrencia` se queda como red de seguridad, por si la lectura está vieja.
- *Archivos:* `apps/mobile/src/sesion-en-curso.ts`; `apps/mobile/src/pantallas/inicio-entrenamiento.tsx` y
  `entrenamiento.tsx`.
- *API:* no.
- *Dado* «Piernas A» en curso y «Torso B» planificada hoy, *cuando* la persona abre Inicio o Entrenamiento, *entonces*
  «Torso B» no ofrece empezar, y «Piernas A» ofrece «Continuar».
- *Dado* un borrador de «Ya la hice» a medias y ninguna corrida abierta, *entonces* no dice «En curso».
- *Pruebas:* prueba pura de `sePuedeIniciar` y de la etiqueta. Mutación: `sePuedeIniciar` siempre verdadero.
  TEST-AV2-010.

**AV2-10 · Error 2: «la que sigue», anclada en lo registrado hoy (el paso 1 de AV2-D1)**
- *Qué cambia:*
  - una función pura, compartida por Inicio y por la comida que abre Nutrición (`comidaQueSeMuestra`): «la que sigue» es
    la primera sin registrar que viene, en el orden del plan, después de la comida registrada hoy que va más adelante en
    el plan. Cuenta el orden del plan y no la hora de los registros;
  - las anteriores sin registrar quedan neutras, «Sin registrar», sin color ni ícono de alerta, y se pueden tocar y
    registrar igual;
  - si después de la última registrada no queda ninguna, no se destaca ninguna;
  - sin nada registrado hoy, «la que sigue» es la primera del plan, como hoy, hasta AV2-27.
- *Archivos:* `apps/mobile/src/inicio-de-hoy.ts`; `apps/mobile/src/comidas-de-hoy.ts`;
  `apps/mobile/src/pantallas/inicio-nutricion.tsx`; `scripts/vuelta-de-rosca.test.mjs` (TEST-AVR-010, con AV2-D1).
- *API:* no.
- *Dado* Desayuno, Almuerzo, Merienda y Cena, y el Almuerzo registrado a las 13:10, *cuando* se arman las fichas,
  *entonces* la Merienda es «la que sigue» (borde `acento`, `destacadaFondo`, «Registrar» y +), el Desayuno dice «Sin
  registrar» y la Cena, «3 opciones».
- *Dado* la Cena registrada, *entonces* no se destaca ninguna.
- *Dado* cualquier caso, *entonces* ningún texto dice «te salteaste» ni «pendiente», y nada va en rojo.
- *Pruebas:* prueba pura con registros fuera de orden y con una comida diferente. TEST-AVR-010 cambia solo con AV2-D1
  ratificada. Mutación: anclar en la primera registrada y no en la última. TEST-AV2-011.

**AV2-11 · Error 4: «Cómo se lee», alineado**
- *Qué cambia:* sale el `flex: 1` de `tituloDeAyuda` (`ui.tsx:751`): el ancho ya lo toma `textoDeDesplegable`. Con ese
  cambio se arreglan todas las ayudas (Inicio, Mapa, Progreso, Indicadores, registro rápido, sesión y tiempos) y las
  filas de enlace («Para qué lo pide»).
- *Archivos:* `apps/mobile/src/ui.tsx`.
- *API:* no.
- *Dado* la variante «ayuda» del desplegable con letra ×1 y ×1,3, *cuando* se dibuja, *entonces* el título y el (?)
  quedan centrados en la misma línea.
- *Pruebas:* prueba de estructura que falla si `tituloDeAyuda` vuelve a llevar `flex`, como la que ya existe para
  `figura-de-la-toma.tsx`. Se confirma en el teléfono: el render del navegador no usa Yoga. TEST-AV2-012.

**AV2-12 · Errores 5 y 6: la actividad, contada de una sola manera y sin ceros**
- *Qué cambia* (con AV2-D2 ratificada):
  - Inicio, en la tarjeta chica: «2 realizadas · 1 no realizada · 30 días». Las realizadas son Realizada y Realizada
    con desvío, con la condición vigente; la no realizada va en neutro y solo si hay;
  - Tu historial: «Últimos 30 días: 2 realizadas (1 con desvío) y 1 no realizada.», con las partes que valen cero
    afuera, unidas con `enumerar` (`textos-por-toma.ts:8-11`);
  - la tira: «N sesiones realizadas esta semana»;
  - las tres salen de la misma lectura y la misma clave.

  Sin AV2-D2, se arregla solo el error 5: el desglose sin ceros.
- *Archivos:* `apps/mobile/src/textos-del-descanso.ts`; `apps/mobile/src/inicio-de-hoy.ts`;
  `apps/mobile/src/textos-de-la-vuelta.ts`; `apps/mobile/src/pantallas/historial.tsx`;
  `scripts/vuelta-de-rosca.test.mjs` (TEST-AVR-012 y 013, con AV2-D2); la lista T13 de `scripts/copy-pantallas.test.cjs`.
- *API:* no.
- *Dado* 2 realizadas (1 con desvío) y 1 no realizada en 30 días, *cuando* se arman los textos, *entonces* Inicio dice
  «2 realizadas · 1 no realizada · 30 días» y Tu historial, «Últimos 30 días: 2 realizadas (1 con desvío) y 1 no
  realizada.».
- *Dado* ninguna con desvío, *entonces* Tu historial dice «Últimos 30 días: 2 realizadas y 1 no realizada.».
- *Dado* cualquier cuenta, *entonces* ninguna frase muestra un cero y ninguna suma lo hecho con lo no hecho.
- *Pruebas:* prueba pura, con la invariante nueva: las realizadas de Inicio son las realizadas más las con desvío del
  historial, y las no realizadas son las mismas, de la misma lectura. Mutación: volver a imprimir «0 con desvío».
  TEST-AV2-013.

**AV2-13 · Las comidas de Inicio leen lo mismo que Nutrición** (defecto nuevo, severidad alta)
- *Qué cambia:*
  - Inicio lee API-ING-01 con `useHoyConOpciones`, la misma lectura y la misma clave que Nutrición;
  - una comida está registrada según `registroDeLaComida` y `comidaRegistrada` (`comidas-de-hoy.ts`), y la hora sale
    de `records[].occurredAt`;
  - «fuera del plan» cuenta solo los registros que no ocupan una comida;
  - API-NUT-14 no cambia: la leen otras vistas, y proyectar ahí la comida de contexto cambiaría el significado de la
    forma v1.
- *Archivos:* `apps/mobile/src/pantallas/inicio-nutricion.tsx`; `apps/mobile/src/inicio-de-hoy.ts`.
- *API:* no.
- *Dado* una «comida diferente» registrada en el Almuerzo, *cuando* la persona abre Inicio, *entonces* el Almuerzo
  figura registrado con su hora, como en Nutrición, y no se cuenta «fuera del plan».
- *Dado* un registro nuevo en Nutrición, *cuando* la persona vuelve a Inicio, *entonces* lo ve sin recargar.
- *Pruebas:* prueba pura del armado de las fichas con una comida diferente, con un registro fuera del plan y con una
  comida anulada. Mutación: volver a contar solo los `PRESCRIBED`. TEST-AV2-014.

**AV2-14 · Tocar una comida abre esa comida** (defecto nuevo)
- *Qué cambia:* la ruta lleva la comida (`{ nombre: 'hoy', accion: 'registrar', comida: mealId }`), y Nutrición la
  toma como la elegida. Una ficha registrada abre su registro, como hoy.
- *Archivos:* `apps/mobile/src/navegacion.ts`; `apps/mobile/src/pantallas/inicio-nutricion.tsx` y `nutricion-hoy.tsx`.
- *API:* no.
- *Dado* «Merienda · Registrar», *cuando* la persona la toca, *entonces* Nutrición abre en la Merienda.
- *Pruebas:* prueba pura de la ruta y de la elección en Nutrición. Mutación: perder la comida al navegar. TEST-AV2-015.

**AV2-15 · Fechas y horas: tres formas y 24 h**
- *Qué cambia,* todo en `formato.ts`:
  - el título del día: «Lunes 9 de noviembre», sin coma;
  - la fecha dentro de un texto: «9 nov», con el año solo si no es el del día de la API («2 sept 2025»);
  - la hora: «13:10», con `hourCycle: 'h23'`. Un instante se escribe «9 nov · 13:10»;
  - la agenda conserva sus frases relativas («el lunes», «mañana»).
- *Archivos:* `apps/mobile/src/formato.ts` y sus usos en Inicio, Tu historial, Evolución y Nutrición.
- *API:* no.
- *Dado* un registro a las 13:10, *entonces* se lee «13:10», nunca «1:10 p. m.».
- *Pruebas:* prueba pura de los formateadores, con la zona fija. La hora se confirma en el teléfono: el `Intl` de Hermes
  no es el del navegador. TEST-AV2-016.

**AV2-16 · El rendimiento, antes y después**
- *Qué cambia:* nada en la APK. Se mide con el procedimiento de §5.3: «antes» con la 0.23 que Dirección ya tiene
  instalada, y «después» con la candidata de la muestra.
- *API:* no.
- *Dado* las dos mediciones, *entonces* el percentil 90 queda en 16,7 ms o menos a 60 Hz, y los cuadros lentos no suben
  más de 2 puntos. Si no se cumple, primero se baja el costo (sin el brillo, un solo destello) y después se apaga el
  interruptor en la pantalla que no pasa.
- *Evidencia:* `EVIDENCIA/APP-VUELTA-2/rendimiento/`, con los números de las tres corridas.

**AV2-17 · La guía y los documentos, al día con el código**
- *Qué cambia,* en el mismo PR que el código que describen:
  - GUIA-UX-UI III.3 (las superficies: la receta), I.6 (el tenue de la APK, y los destellos del fondo como la única luz
    que no marca algo que se toca) e I.8 (la tilde de lo que la persona hizo va en `exito`);
  - `docs/ux/INICIO-Y-NAVEGACION.md`: la barra al 88 % y la cabecera;
  - `WP-ENTRENAMIENTO-SERIES.md` §7.7: una nota que apunta a DL-170, sin borrar lo que dice;
  - los encabezados de `vidrio.tsx` y `tema.ts`.
- *API:* no.
- *Dado* la etapa A integrada, *entonces* ningún documento describe una superficie mate que la APK ya no tiene, ni un
  vidrio que todavía no tiene.

**AV2-18 · La muestra en el teléfono de Dirección**
- *Qué cambia:* la candidata de la muestra, 0.24.0-candidata.1, por el circuito de siempre (§5.4), con la distribución
  que elija AV2-D11.
- *API:* no.
- *Dado* la candidata instalada, *cuando* Dirección abre Inicio con sus datos o con una cuenta sintética, en los dos
  temas, con letra ×1,3 y con TalkBack, *entonces* su respuesta (el visto bueno o las correcciones) queda escrita en
  `EVIDENCIA/APP-VUELTA-2/muestra/LEEME.md`. Recién con el visto bueno empieza la etapa B.

### 4.2 Etapa B · toda la app, con el visto bueno de Dirección a la muestra

**AV2-19 · Error 3: la figura entera en Evolución** (con AV2-D6 ratificada)
- *Qué cambia:*
  - `ENCUADRE.anchoDeLaImagen` pasa de 1,44 a 1,0;
  - el 0,13 fijo de `aLaDerechaDelEje` pasa a ser el borde real de la caja del cuerpo de cada figura más un margen:
    (cuerpo.centroX − 50) / 100 + cuerpo.ancho / 200 + 0,015, que da ≈ 0,233 en el hombre y ≈ 0,214 en la mujer;
  - el mismo borde, en `componerLaFiguraDeZona` (`composicion-de-la-figura.ts:471` y `:479`);
  - la lámina conserva su paleta y su dibujo; a lo sumo lleva un marco de vidrio.
- *Archivos:* `apps/mobile/src/composicion-de-la-figura.ts`; `scripts/composicion-de-la-figura.test.mjs`;
  `docs/ux/GUIA-UX-UI.md` III.4 (`:1199-1203`); la herramienta de la maqueta, que cambia esas dos constantes con una
  expresión regular (`EVIDENCIA/INICIO-Y-NAVEGACION/herramientas/render-navegador/construir.mjs:42-49`).
- *API:* no.
- *Dado* el mapa corporal a 360 dp, *cuando* se compone la figura, *entonces* la caja del cuerpo termina 2 dp o más
  antes del borde (el contorno se corre 1,25 dp), el cuerpo mide unos 430 a 440 dp de alto, y cada guía sigue apuntando
  a su sitio.
- *Dado* cualquier figura, *entonces* ningún punto de `FIGURAS_DE_LA_LAMINA` cambia: la figura, el contorno, los
  anillos, los puntos, las guías y las zonas de toque salen del mismo rectángulo.
- *Pruebas:* la prueba de `:151-156`, que exigía el recorte, pasa a exigir el cuerpo entero; las de los sitios fijos se
  conservan. Mutación: volver a 1,44. TEST-AV2-017.

**AV2-20 · Evolución: los controles juntos y sin jerga**
- *Qué cambia:*
  - una sola fila de controles arriba de la figura, en el mapa y en Progreso: «Perímetros | Pliegues» y, al lado,
    «Figura: Hombre | Mujer», con el rótulo visible. `ElegirLaFigura` sale del pie;
  - las fichas de las tomas muestran la fecha («2 sept», «9 nov»), y el encabezado, «Última toma · 9 nov». Los textos
    dicen «la toma del 2 sept» en lugar de «la T1». T{n} puede seguir como clave interna, pero no se muestra; el cambio
    va en la APK y no en el dominio, para no redesplegar (AV2-T13);
  - se van «16 medidas · 6 resultados de fórmulas» y su variante de «La figura, en lista». La explicación de por qué se
    destaca una medida pasa al «Cómo se lee» de Evolución.
- *Archivos:* `apps/mobile/src/pantallas/figura-de-la-toma.tsx`, `progreso.tsx` y `antropometria.tsx`;
  `apps/mobile/src/ui.tsx`.
- *API:* no.
- *Dado* el mapa corporal, *entonces* el selector de la figura está arriba, con «Figura» a la vista, y ninguna toma se
  nombra «T1».
- *Pruebas:* prueba pura de los nombres de las tomas y de estructura de la fila de controles. TEST-AV2-018.

**AV2-21 · Nutrición Hoy: la opción compacta y una sola navegación** (con AV2-D10)
- *Qué cambia:*
  - una tarjeta compacta. Sin imagen, no se dibuja el marco. Con imagen, una miniatura de 72 dp al lado del nombre
    (`ImagenDeMedio` con `tamano={72}` y sin el rótulo visible); TalkBack sigue diciendo «Imagen de referencia»;
  - una sola navegación: arriba, «Opción 1 | Opción 2 | Opción 3» con Segmentos compactos, y debajo una sola tarjeta a
    todo el ancho. Se van el desplazamiento con imán, el asomo, las flechas y los puntitos;
  - se conservan, de `carrusel-de-opciones.ts`: la opción recordada por `optionId`, el anuncio «Opción n de m» para
    TalkBack y la carga de la imagen solo para la opción a la vista (cada acceso queda registrado en la API);
  - «Estimación del plan» pasa a `tenue`.
- *Archivos:* `apps/mobile/src/pantallas/nutricion-hoy.tsx`; `apps/mobile/src/carrusel-de-opciones.ts`;
  `apps/mobile/src/imagen-de-medio.tsx`; `scripts/registro-de-comidas.test.mjs`.
- *API:* no.
- *Dado* tres opciones sin imagen, *entonces* no hay ningún marco vacío y se elige con un solo control.
- *Dado* la opción 2 elegida, *cuando* la persona vuelve, *entonces* sigue en la opción 2.
- *Pruebas:* `scripts/registro-de-comidas.test.mjs`, ajustada a una sola navegación, sin cambiar lo que se protege (la
  opción recordada y la imagen que se carga). TEST-AV2-019.

**AV2-22 · Tu historial: el período a la vista y una fila por sesión**
- *Qué cambia:*
  - la lista dice su período: el rótulo «Últimos 90 días»;
  - cada sesión es una fila de vidrio que se toca entera: el nombre, la fecha («9 nov») y el estado como etiqueta
    neutra, con la tilde en `exito` si fue realizada (también con desvío, que se dice en palabras). «Cargada como el
    plan» y «Corregida» van en `tenue`, en una línea. Sin botón propio;
  - los planes, con el mismo trato.
- *Archivos:* `apps/mobile/src/pantallas/historial.tsx`.
- *API:* no.
- *Dado* una sesión realizada el 9/11, *entonces* TalkBack dice «Piernas A, 9 de noviembre, realizada. Ver la sesión».
- *Pruebas:* prueba de estructura (el rótulo del período, una sola acción por fila). TEST-AV2-020.

**AV2-23 · La sesión enfocada, con vidrio, y lo opaco, opaco**
- *Qué cambia:*
  - sus diez superficies propias pasan a `superficieDeVidrio`, cada una con una línea;
  - las celdas son pozos dentro de una tarjeta y quedan con `fondo`, que se lee como un hueco;
  - los bordes cian de estado pasan a la regla del cian: el cian, solo en lo que se toca;
  - la fila fija y la barra siguen opacas (PV-11), con el borde y la línea de luz, la sombra y radio 20; el botón del
    medio, con el resplandor. La hoja inferior y los dos diálogos, opacos.
- *Archivos:* `apps/mobile/src/pantallas/sesion-enfocada.tsx` y `correccion-de-entrenamiento.tsx`;
  `apps/mobile/src/fila-fija.tsx`.
- *API:* no.
- *Dado* la sesión en curso, *entonces* nada se ve a través de la fila ni de la barra, y ningún borde cian marca algo
  que no se toca.
- *Pruebas:* `scripts/sesion-enfocada.test.mjs` y prueba de estructura de lo opaco. TEST-AV2-021.

**AV2-24 · Las superficies propias que quedan, y las pantallas que heredan**
- *Qué cambia:*
  - las superficies escritas a mano pasan a `superficieDeVidrio`, una línea cada una, sin tocar los rellenos: Perfil
    (5, con su `overflow: hidden`), las piezas de Nutrición (4), la comida diferente (3), Cuenta y «Pendientes» (2 cada
    una), la imagen de una opción y el progreso de una medida (2 cada una), y una en Novedades, Notas de coordinación,
    Revisiones, Quién ve qué, Mis hábitos, el texto versionado, la recuperación, Antropometría, Entrenamiento, la
    evidencia visual, Indicadores y Progreso;
  - los campos de formulario son controles: solo los alcanza `bordeControl`. Los diálogos, opacos;
  - las pantallas que usan solo piezas base heredan sin tocarlas y se verifican en los dos temas y con letra ×1,3:
    Bienvenida (el isotipo grande y el lema sobre el degradé), Crear cuenta, Iniciar sesión, la invitación, el
    consentimiento, Vínculos y Vínculo, Privacidad, el plan actual, los registros, la opción de comida, «Ya la hice», el
    plan de entrenamiento y Mis solicitudes.
- *Archivos:* unos 20 archivos de `apps/mobile/src` y `apps/mobile/src/pantallas`.
- *API:* no.
- *Dado* la APK entera, *entonces* ningún estilo de tarjeta escribe `COLOR.superficie` a mano, salvo lo opaco por
  decisión.
- *Pruebas:* una prueba de estructura que recorre `apps/mobile/src` y falla con una tarjeta escrita a mano fuera de la
  lista de lo opaco. TEST-AV2-022.

**AV2-25 · Las medidas con un decimal** (con AV2-D9)
- *Qué cambia:* un formateador en la APK, por ejemplo `medidaConUnDecimal`, para las medidas medidas (cm, mm, kg):
  completa con cero hasta un decimal y nunca redondea. «39» se escribe «39,0»; «58,8» y «58,75» quedan igual. Los
  resultados de fórmulas siguen con su precisión (`numeroConPrecision`). Va en la APK y no en el dominio (AV2-T13).
- *Archivos:* `apps/mobile/src/formato.ts`; `composicion-de-la-figura.ts`; `pantallas/antropometria.tsx`,
  `figura-de-la-toma.tsx` e `inicio-mediciones.tsx`.
- *API:* no.
- *Dado* «39» y «58,8» en la misma lista, *entonces* se leen «39,0 cm» y «58,8 cm».
- *Pruebas:* prueba pura (completa sin redondear). Mutación: redondear a un decimal. TEST-AV2-023.

**AV2-26 · El vidrio, prendido en toda la app**
- *Qué cambia:* App.tsx prende el interruptor en todas las rutas, con una línea, cuando las pantallas de AV2-19 a AV2-24
  están migradas. Si la etapa B no llega entera, vale AV2-D12.
- *API:* no.
- *Dado* cualquier pantalla, *entonces* sus superficies son de vidrio, en los dos temas, y con el alto contraste vuelven
  a ser opacas.
- *Pruebas:* TEST-AV2-002, con el interruptor prendido; el contraste no cambia, porque ya se mide en el peor punto. La
  medición de rendimiento, otra vez.

**AV2-27 · «La que sigue», con la hora habitual** (opcional; el paso 2 de AV2-D1)
- *Qué cambia:*
  - API-ING-01 suma, por comida, `usualTime`: la mediana de la hora de los registros de esa comida de la persona en las
    últimas 4 semanas, en la zona de la API, o `null` sin historia suficiente;
  - viaja solo al cliente que declara la capacidad nueva (DL-122): la 0.23 instalada valida API-ING-01 con un esquema
    estricto, y un campo de más le rompería Nutrición en la ventana entre el despliegue y la actualización;
  - en la app, sin nada registrado hoy, «la que sigue» es la primera comida del plan cuya hora habitual, más un margen
    (un parámetro, por ejemplo 90 minutos), todavía no pasó, según la hora del servidor (`relojDelServidor`). Sin
    historia, la primera del plan;
  - la hora habitual nunca se muestra como meta.
- *Archivos:* `packages/domain/src/contratos-registro-de-comidas.ts`;
  `apps/api/src/nutricion/registro-de-comidas.service.ts`; `apps/mobile/src/comidas-de-hoy.ts` e `inicio-de-hoy.ts`.
- *API:* **sí**, con el dominio. Redespliega la API y el website (`packages/domain/**` está en los dos `buildFilter`):
  va en la ventana de redespliegue de la API, junto con la de WP-EDITORES-PROFESIONAL.
- *Dado* las 18:27, nada registrado hoy y una merienda habitual a las 17:45, *entonces* «la que sigue» es la Merienda.
- *Dado* un cliente sin la capacidad, *entonces* la respuesta no trae `usualTime`.
- *Pruebas:* el contrato con el campo y sin él; integración con PostgreSQL (la mediana, sin historia y la capacidad); la
  prueba pura de la app. TEST-AV2-024.

**AV2-28 · El desenfoque en la barra** (opcional; solo si AV2-D3 dice que sí)
- *Qué cambia:*
  - `expo-blur` ~57.0.3, con `blurMethod: 'dimezisBlurViewSdk31Plus'`, que desenfoca desde Android 12; antes, no hace
    nada;
  - un `BlurTargetView` en App.tsx envuelve `FondoDeLaApp` y el desplazamiento, y el `BlurView` de la barra se dibuja
    después del contenido, con `overflow: hidden` para el radio;
  - `barraVidrio` en 0,82 o más, con el velo. Con `barraTexto` en #A3B1C2, la barra de Azul noche no puede bajar de
    0,872 sin que las etiquetas pasen por debajo de 4,5:1, y el desenfoque casi no se vería. Por eso, con el desenfoque,
    las etiquetas de Azul noche van en un gris más claro, por ejemplo #C9D6E2, que deja bajar hasta 0,806. En Claro, el
    #4A5A70 de hoy ya deja bajar hasta 0,806;
  - nunca en la barra fija de la sesión (PV-11).
- *Archivos:* `apps/mobile/package.json`; `package-lock.json`; `apps/mobile/App.tsx`; `barra-de-zonas.tsx`.
- *API:* no, pero es un módulo nativo nuevo, y el `package-lock.json` de la raíz redespliega la API y el website.
- *Dado* Android 12 o más, *entonces* lo que pasa detrás de la barra se ve desenfocado, y las etiquetas siguen pasando
  la prueba de contraste.
- *Pruebas:* la prueba de la barra; la medición de rendimiento con el desenfoque. TEST-AV2-025.

### 4.3 Cierre

**AV2-29 · La candidata con UF-01, la evidencia y TalkBack**
- *Qué cambia:* la candidata final sale con UF-01 y con lo integrado de este paquete, antes del congelamiento del 25/11.
  Se congelan sus lecturas (DL-152, con UF-00).
- *API:* no.
- *Dado* la candidata publicada, *entonces* `EVIDENCIA/APP-VUELTA-2/LEEME.md` tiene:
  - las capturas de cada pantalla en los dos temas y con letra ×1,3, antes y después;
  - la tabla de contraste y la medición de rendimiento;
  - el visto bueno de Dirección a la muestra;
  - TalkBack, escrito como hecho o como pendiente, sin darlo por aprobado.

## 5. El plan y las mediciones

### 5.1 El orden

Es un plan y no una promesa. Lo que sí está fijo es el congelamiento del 25/11.

| Etapa | Fechas | Partes | Se integra | Se mide |
|---|---|---|---|---|
| 0 · Aprobación | mié 11 y jue 12 | Esta declaración; AV2-D1 a AV2-D12 | La declaración, si Dirección la aprueba | El rendimiento de la 0.23 en su teléfono (AV2-16, «antes») |
| A · La muestra | jue 12 a sáb 14 | AV2-01 a AV2-17 | Sola: es solo de la APK y no redespliega la API ni el website | El contraste, con la prueba |
| A · En su teléfono | dom 15 | AV2-18 | La 0.24.0-candidata.1, según AV2-D11 | El rendimiento «después», los dos temas, la letra ×1,3 y TalkBack |
| B · Toda la app | lun 16 a sáb 21 | AV2-19 a AV2-26; AV2-27 y AV2-28, solo con su decisión | Por partes, cada una con su CI. AV2-27, en la ventana de la API (sáb 21 o dom 22, la de WP-EDITORES-PROFESIONAL) | El contraste y el rendimiento, otra vez |
| Cierre | dom 22 a mar 24 | AV2-29, con UF-01 | La candidata con UF-01 | Todo |
| Congelamiento | mié 25 | — | Nada más | — |

- **Primero la base:** AV2-01, AV2-02 y AV2-03 van juntas, porque todo lo demás las usa. Después AV2-04, AV2-05 y
  AV2-06. Después Inicio: AV2-07, AV2-08 y las partes de los errores.
- **Las decisiones que la muestra necesita:** las que no cambian una decisión ratificada (AV2-D4, D5, D7 y D8) van con la
  recomendación si Dirección no responde antes de programar, y se cambian si corrige al ver la muestra. Las que sí la
  cambian (AV2-D1, D2 y D6) esperan su ratificación; mientras tanto rige lo vigente, y la muestra lo dice.
- **El corte:** si el degradé nativo no se dibuja en el teléfono, se pasa al plan B (§3.2) antes de seguir. Las hojas
  salen sin frenar a las demás: AV2-20, AV2-22, AV2-25, AV2-27 y AV2-28. Si la etapa B no llega, vale AV2-D12.
- **La PC tiene poca memoria:** los procesos pesados van de a uno, y el AAB se construye en GitHub Actions.

### 5.2 El contraste, medido

Con la fórmula de `scripts/contraste.test.cjs` (WCAG 2.2) y la receta de §3.1. El «peor punto» es el mínimo sobre los
tres puntos del degradé, con cada destello solo y con los dos juntos; el vidrio y el nivel 2 se miden encima de cada uno.

| Par | Azul noche | Claro |
|---|---|---|
| Directo sobre el fondo: texto · tenue · acento · éxito · error | 9,92 · 4,55 · 5,66 · 6,51 · 4,88 | 14,73 · 4,92 · 4,57 · 4,59 · 4,54 |
| Sobre el vidrio (nivel 1) | 12,64 · 5,79 · 7,21 · 8,29 · 6,22 | 15,96 · 5,33 · 4,96 · 4,98 · 4,92 |
| Sobre el nivel 2 | 10,66 · 4,89 · 6,08 · 6,99 · 5,25 | 16,25 · 5,43 · 5,05 · 5,07 · 5,01 |
| `botonTexto` sobre el botón principal, arriba y abajo | 10,68 · 7,78 | 4,73 · 6,75 |
| `bordeControl` sobre el vidrio y el nivel 2 (mínimo 3) | 3,40 (hoy, 2,49) | 3,29 |
| La tilde del día sobre `exito` · el círculo · el aro de hoy, contra la tarjeta (mínimo 3) | 12,29 · 8,29 · 7,21 | 5,07 · 4,98 · 4,96 |
| `tenue` sobre la etiqueta de estado | 4,60 | 4,75 |
| «La que sigue»: acento · tenue · texto | 6,11 · 4,91 · 10,72 | 4,60 · 4,95 · 14,81 |
| La barra al 88 %: `barraTexto` · `barraElegido`, con cualquier color del tema detrás | 4,58 · 5,70 | 5,51 · 5,29 |

- **Los márgenes son finos** en el peor punto: el tenue de Azul noche sobre el fondo (4,55), la barra (4,58) y la
  etiqueta (4,60); en Claro, el error, el acento y el éxito sobre el fondo (4,54 a 4,59). La prueba los protege: si los
  destellos se refuerzan, el tenue cae primero (4,16 con 14 % y 18 %).
- **Por qué cambian el tenue y `bordeControl`:** el tenue de Claro de hoy (#62728A) baja a 4,43:1 sobre el degradé, y
  el `bordeControl` de Azul noche de hoy (#4F7FA3), a 2,49:1 sobre el vidrio.
- **Por qué «la que sigue» lleva un 8 % en Azul noche:** con el tenue nuevo, el tinte al 12 % lo deja en 4,45:1. En
  Claro, el celeste #E8F1FF deja el acento en 4,44:1, y el #EEF5FF, en 4,60.
- Los scripts de la medición (la fórmula y la receta) se pasan a la prueba en AV2-01. Hasta entonces, son de la sesión y
  no del repo.

### 5.3 El rendimiento, medido en el teléfono

Antes (la 0.23) y después (la candidata), en el teléfono de Dirección y, si hay, en uno con Android 11 o menos:
1. `adb shell dumpsys gfxinfo com.elianbufi.be reset`.
2. Diez deslizamientos iguales con `adb shell input swipe`, con las mismas coordenadas, en Inicio, Nutrición Hoy,
   Entrenamiento y Tu historial. Tres corridas.
3. `adb shell dumpsys gfxinfo com.elianbufi.be`: los cuadros lentos (%) y los percentiles 50, 90 y 95.
4. En las opciones de desarrollador, «Depurar superposición de GPU»: nada en rojo debajo del texto.
5. `adb shell dumpsys meminfo com.elianbufi.be` (la línea Graphics), antes y después.

**El criterio:** el percentil 90 en 16,7 ms o menos a 60 Hz (11,1 ms a 90 Hz y 8,3 ms a 120 Hz), y no más de 2 puntos
de cuadros lentos que la 0.23 en las mismas condiciones. Todo el contenido vive en un solo desplazamiento, sin listas
virtualizadas: los costos nuevos son la mezcla de cada tarjeta translúcida con el fondo y el desenfoque de cada sombra,
que en un rectángulo redondeado es barato. Las capturas del render del navegador no sirven para esto: no usa Yoga y no
dibuja como Android estas propiedades.

### 5.4 Qué hace falta para la muestra en el teléfono de Dirección

1. **El sí de Dirección a los IDs de la etapa A** (AV2-01 a AV2-18) y su respuesta a AV2-D1, D2 y D11. Las demás de la
   muestra van con la recomendación (§5.1).
2. **La etapa A programada,** con la CI verde, e integrada en `main` con su autorización.
3. **La candidata de la muestra,** 0.24.0-candidata.1, por el circuito de siempre (`docs/DESPLIEGUE.md`, Google Play):
   - la rama `aab/candidata-0.24.0-1`: `main` más un commit con la versión y el `versionCode` 38 (la 0.23.0-candidata.2
     lleva el 37);
   - GitHub Actions arma el AAB sin firma, en unos 10 minutos;
   - en la PC de Dirección: bajarlo, comparar la huella, firmarlo y verificarlo (`firmar-aab.mjs` y `verificar-aab.mjs`,
     unos 5 minutos, con sus contraseñas por el entorno), y armar la APK con `apk-desde-aab.mjs`, con más de 1,2 GB
     libres;
   - la release en GitHub, según AV2-D11.
4. **Instalarla encima de la 0.23:** el mismo certificado y un `versionCode` mayor.
5. **Para medir el rendimiento:** la depuración USB activada y el cable. La medición «antes» se puede hacer ya, con la
   0.23 que tiene instalada (`adb` está en la PC).
6. **Mirarla** con sus datos o con una cuenta sintética de la cohorte, en los dos temas, con letra ×1,3 y con TalkBack.

La muestra no toca la API. Si la API empezara a exigir el nombre (UF-01) antes de que salga la APK que lo pide, la
candidata de la muestra no podría crear cuentas: para mirar Inicio no hace falta.

## 6. Lo que decide Dirección (AV2-D)

Son propuestas del continuador, cada una con su recomendación y su alternativa. Las que revisan una decisión ya
ratificada lo dicen. Ninguna se programa sin el sí de Dirección a su parte.

- **AV2-D1 · «La que sigue» y la hora** · **a ratificar; revisa PV-2 de DL-166 y TEST-AVR-010.**
  - *Recomiendo* dos pasos, en una función pura que compartan Inicio y Nutrición:
    - paso 1, en la muestra y sin datos nuevos (AV2-10): la que sigue es la primera sin registrar después de la última
      comida registrada hoy, en el orden del plan, y las anteriores sin registrar quedan neutras;
    - paso 2, después de la muestra y con la API (AV2-27): sin nada registrado hoy, manda la hora habitual de la
      persona. La hora habitual nunca se muestra como meta.
  - *Alternativas:*
    - solo el paso 1, que ya corrige el caso de la captura;
    - una hora por comida que ponga el profesional: es lo más fiel al legajo, pero pide el editor y va con
      WP-EDITORES-PROFESIONAL;
    - franjas fijas por el nombre de la comida. Se descarta: BE inventaría un horario, y los nombres son libres.
  - Sin la ratificación, Inicio sigue con PV-2.
- **AV2-D2 · «Actividad» con desglose, como en la imagen** · **a ratificar; revisa PV-5 de DL-166, AVD-2 y TEST-AVR-012
  y 013.**
  - *Recomiendo:* nunca un total que mezcle lo hecho con lo que no se hizo. Inicio dice «2 realizadas · 1 no realizada ·
    30 días»; Tu historial, «Últimos 30 días: 2 realizadas (1 con desvío) y 1 no realizada.»; la tira, «N sesiones
    realizadas esta semana». Las tres salen de la misma lectura, y la prueba fija la relación (AV2-12).
  - *Alternativa:* conservar PV-5 («3 sesiones registradas») y explicar la relación en Tu historial: «3 sesiones
    registradas (2 realizadas y 1 no realizada)». Se descarta, porque «registrada» se lee como «hecha».
  - Sin la ratificación, se arregla solo el error 5.
- **AV2-D3 · El desenfoque real, solo en la barra** · **a ratificar.**
  - *Recomiendo:* la muestra va sin desenfoque: la barra al 88 %, con el borde y la línea de luz y la sombra. Al
    desplazar, el contenido pasa sobre los destellos quietos, y el vidrio ya se nota. El desenfoque entra solo si
    Dirección lo pide al verla (AV2-28), y nunca en la barra fija de la sesión. Para que se vea, la barra tiene que bajar
    a un 82 %, y las etiquetas de Azul noche, pasar a un gris más claro (AV2-28). Es un módulo nativo nuevo: va en la APK
    de UF-01 o en la siguiente, y redespliega la API y el website por el `package-lock.json`.
  - *Alternativa:* el desenfoque en todas las tarjetas. Se descarta: vuelve a dibujar el contenido en cada cuadro, pesa
    en un teléfono de gama baja y no se ve antes de Android 12.
- **AV2-D4 · «Ya la hice» en las otras sesiones, con una en curso** · **a ratificar.**
  - *Recomiendo:* en Inicio, no: se ve solo la sesión en curso. En Entrenamiento, sí: sirve para registrar una sesión que
    ya se hizo, y la API lo acepta.
  - *Alternativa:* ocultarlo también en Entrenamiento hasta que la sesión en curso termine o quede incompleta.
- **AV2-D5 · La semana de la tira** · **a ratificar.**
  - *Recomiendo:* la semana calendario, de lunes a domingo, como la maqueta. El lunes arranca vacía y no arrastra nada.
  - *Alternativa:* los últimos 7 días: nunca empieza vacía, pero las letras se corren cada día.
- **AV2-D6 · La figura entera en Evolución** · **a ratificar; revisa el encuadre del pulido del 2026-10-04 (GUIA III.4) y
  su prueba.**
  - *Recomiendo:* el cuerpo entero, escalado con su capa de puntos (AV2-19). En 360 dp mide unos 430 a 440 dp de alto,
    el alto que ya reserva el esqueleto de carga, y las tarjetas pasan de 132 dp a unos 143 (hombre) y 160 (mujer).
    Ningún punto se mueve.
  - *Alternativa:* conservar el recorte, con un margen que deje entero el hombro. El recorte se había elegido porque ISAK
    mide del lado derecho de la persona, y del lado recortado no hay sitios.
- **AV2-D7 · La campana** · **a ratificar.**
  - *Recomiendo:* un punto cian de 8 dp, sin número y sin animación, como la maqueta. El número sigue en el nombre para
    TalkBack.
  - *Alternativa:* el número, con tope en «9+».
- **AV2-D8 · La cabecera de un detalle** · **a ratificar.**
  - *Recomiendo:* en las cinco raíces, el logo a la izquierda. En un detalle, «Volver» a la izquierda y nada al centro.
    La campana, siempre a la derecha.
  - *Alternativa:* en los detalles, el logo al centro.
- **AV2-D9 · Las medidas con un decimal** · **a ratificar.**
  - *Recomiendo:* en la APK, las medidas medidas con un decimal, completando con cero y sin redondear (AV2-25), como pide
    REG-06-158 y como mide ISAK (0,1). El website se suma con WP-EDITORES-PROFESIONAL.
  - *Alternativa:* dejar los decimales como se cargaron y alinear la columna por la coma.
- **AV2-D10 · Una sola navegación entre las opciones de una comida** · **a ratificar.**
  - *Recomiendo:* Segmentos compactos arriba y una sola tarjeta (AV2-21). Ya es un grupo accesible para TalkBack, y con
    letra grande se parte en renglones.
  - *Alternativa:* las opciones en una lista vertical compacta, sin navegación.
- **AV2-D11 · Cómo llega la muestra a su teléfono** · **a ratificar.**
  - *Recomiendo:* integrar la etapa A en `main` y publicar la 0.24.0-candidata.1 como **prerelease y no «latest»**.
    Así la descarga del website sigue ofreciendo la 0.23 a la familia hasta la APK con UF-01 y el vidrio entero. Es una
    excepción a la regla del 11/11 («cada versión nueva, como latest»), solo para la muestra.
  - *Alternativas:* publicarla como «latest», como toda versión desde el 11/11, y la familia la recibe; o instalarla
    por cable con `adb`, sin publicarla.
- **AV2-D12 · Si la etapa B no llega al 25/11** · **a ratificar.**
  - *Recomiendo:* la candidata sale con la etapa A y lo que de la B esté integrado, y el vidrio se prende solo en las
    pantallas cuyas superficies ya migraron. Nada se rompe: sin migrar, una tarjeta se ve como hoy.
  - *Alternativa:* prenderlo en toda la app igual. Lo que no migró se distingue solo cuando pasa sobre un destello.

### 6.1 Las decisiones técnicas de esta declaración (AV2-T, a ratificar)

Las tomó el continuador al declarar. Ninguna cambia una decisión de Dirección: completan lo que la maqueta no fija.

- **AV2-T1 · El fondo, sin SVG.** En Android, `react-native-svg` dibuja en un mapa de bits del tamaño de la vista: a
  pantalla completa, unos 10 MB (1080 × 2400 × 4). `experimental_backgroundImage` lo dibuja nativo y sin mapa de bits.
  Un relevamiento de Inicio había propuesto el SVG; se descarta por la memoria.
- **AV2-T2 · `superficie` sigue opaca** (§3.2).
- **AV2-T3 · El vidrio no agrega vistas hijas** (§3.2).
- **AV2-T4 · La sombra es `boxShadow`, sin `elevation`, en lo translúcido.** `sombraDeVidrio` queda para la lámina.
- **AV2-T5 · El tenue:** Azul noche #A3B1C2, el del website (F-143), que la APK esperaba desde el 2026-10-15; Claro
  #5B6B82, porque el de hoy baja a 4,43:1 sobre el degradé.
- **AV2-T6 · `bordeControl` de Azul noche, #6497BD:** el de hoy da 2,49:1 sobre el vidrio con destellos.
- **AV2-T7 · «La que sigue», con un tinte del 8 % en Azul noche y #EEF5FF en Claro** (§5.2).
- **AV2-T8 · La tilde del día, en `botonTexto` sobre `exito`:** la blanca de la maqueta no llega a 3:1 en Azul noche.
- **AV2-T9 · Sin librerías nuevas para la muestra** (§3.2).
- **AV2-T10 · Los íconos de las fichas dicen el estado, no la comida.** Son de la familia (GUIA I.8): no hace falta
  ningún dibujo nuevo.
- **AV2-T11 · Los radios:** tarjeta 20, ficha y botón 14, cápsula 999.
- **AV2-T12 · Las pruebas nuevas, sin tocar el `package.json` de la raíz** (§4).
- **AV2-T13 · Lo nuevo de formato va en la APK y no en el dominio:** `packages/domain/**` también está en el
  `buildFilter` de la API y del website, y tocarlo los redespliega. Pasa al dominio cuando el website lo use.

## 7. Riesgos

- **Los márgenes de contraste son finos** en el peor punto (§5.2). La prueba los cuida; un destello más fuerte la pone en
  rojo antes de llegar al teléfono.
- **`experimental_backgroundImage` es experimental.** El nombre puede cambiar con React Native; queda encerrado en
  `vidrio.tsx` y `fondo-de-la-app.tsx`. Que el degradé radial y el brillo recortado al radio se dibujen bien en Android
  está **a verificar en el teléfono**, a 360 dp y con letra ×1,3, antes de extenderlo. El plan B está en §3.2.
- **Las versiones de Android.** La sombra exterior pide Android 9, y la línea de luz, Android 10. Antes no se dibujan:
  la tarjeta se ve plana, pero se lee igual.
- **El rendimiento en un teléfono de gama baja.** El vidrio suma una capa de mezcla por tarjeta. Se mide antes y después
  (§5.3), y el interruptor deja volver atrás pantalla por pantalla.
- **El render del navegador no lo muestra.** No usa Yoga y no dibuja como Android estas propiedades: ni las capturas ni
  las maquetas aprueban el vidrio. La verificación es en el teléfono.
- **Cambiar decisiones ratificadas.** PV-2, PV-5 y el encuadre del 2026-10-04 cambian solo con AV2-D1, D2 y D6. Cada
  prueba que los congela (TEST-AVR-010, 012 y 013, y la de la composición) cambia para pedir la regla nueva, con su
  mutación: nunca para que pase.
- **La tilde verde junto a una hora** puede leerse como «cumplió» (GUIA I.8). Se limita a actos de la persona (la sesión
  de un día, la comida registrada), nunca a un número ni a una medida del cuerpo, y lo no hecho queda neutro.
- **Los datos de la maqueta** no son los de la pantalla real (§1.2). Si no se avisa, la muestra puede parecer
  equivocada.
- **El plazo.** Esta vuelta, UF-01 y WP-EDITORES-PROFESIONAL van en paralelo hasta el 25/11, con una PC de poca memoria.
  La etapa A es chica y sola; la B se corta por hojas (§5.1), y AV2-D12 dice qué sale si no llega.
- **`superficie` translúcida, por coherencia.** Alguien podría querer volverla translúcida más adelante: rompería los
  diálogos, la fila fija y la prueba. El encabezado de `tema.ts` dice por qué no.
- **TalkBack, sin probar.** La tabla de §3.4 dice qué anuncia cada pieza, pero solo un teléfono y una persona lo
  aprueban. Hasta entonces, la evidencia lo escribe como pendiente.
- **Los choques al integrar.** #251 (DL-167) y #253 (DL-169) suman su fila en el índice de DEUDA_LEGAJO y su sección al
  final, como esta. Se resuelve conservando las tres, en orden.

## 8. Oráculos a escribir

Al programar, en `WP-APP-VUELTA-2-ORACULOS.md`, con los trece campos del 11A, como los de WP-APP-VUELTA-DE-ROSCA. Cada
uno, con su mutación.

| Oráculo | Qué fija | Parte |
|---|---|---|
| TEST-AV2-001 | La receta pasa AA en el peor punto, en los dos temas | AV2-01 |
| TEST-AV2-002 | La superficie por nivel; con alto contraste o con el interruptor apagado, la opaca de hoy | AV2-02, AV2-26 |
| TEST-AV2-003 | El vidrio no agrega vistas hijas, y lo translúcido no usa `elevation` | AV2-02 |
| TEST-AV2-004 | El fondo, fuera del desplazamiento, oculto al lector y sin toques; liso con alto contraste | AV2-03 |
| TEST-AV2-005 | El resplandor solo en el principal habilitado; el enlace con flecha sin subrayado; la etiqueta de estado sin borde | AV2-04 |
| TEST-AV2-006 | El logo con el nombre «BE»; el punto sin número y el número en el nombre accesible; el ambiente en `test` | AV2-05 |
| TEST-AV2-007 | La barra: un destino de 52 dp; dos filas con ×1,3 sin cortar; opaca en la sesión | AV2-06 |
| TEST-AV2-008 | Inicio: la fecha como título; qué bloques aparecen; una columna con ×1,3; el nombre del día solo con más de uno | AV2-07 |
| TEST-AV2-009 | La tira: la tilde solo con una realizada; lo demás, neutro; hoy con aro; sin días seguidos ni ceros | AV2-08 |
| TEST-AV2-010 | Con una sesión en curso, ninguna otra ofrece empezar; «En curso» es la corrida abierta | AV2-09 |
| TEST-AV2-011 | «La que sigue», anclada en la última registrada hoy; las anteriores, neutras | AV2-10 |
| TEST-AV2-012 | El título de la ayuda, sin `flex` | AV2-11 |
| TEST-AV2-013 | La actividad: sin ceros, sin sumar lo hecho con lo no hecho, y la misma cuenta en las tres vistas | AV2-12 |
| TEST-AV2-014 | La comida diferente cuenta como registrada en Inicio, como en Nutrición | AV2-13 |
| TEST-AV2-015 | Tocar una ficha abre esa comida | AV2-14 |
| TEST-AV2-016 | Las fechas en tres formas y la hora en 24 h | AV2-15 |
| TEST-AV2-017 | La figura entera, con los sitios en su lugar | AV2-19 |
| TEST-AV2-018 | Evolución: «Figura» a la vista y las tomas por su fecha | AV2-20 |
| TEST-AV2-019 | Nutrición Hoy: una sola navegación, sin marco vacío, con la opción recordada | AV2-21 |
| TEST-AV2-020 | Tu historial: el período a la vista y una acción por fila | AV2-22 |
| TEST-AV2-021 | La sesión: lo opaco sigue opaco y no hay cian de estado | AV2-23 |
| TEST-AV2-022 | Ninguna tarjeta escrita a mano fuera de la receta, salvo lo opaco por decisión | AV2-24 |
| TEST-AV2-023 | Las medidas con un decimal, sin redondear | AV2-25 |
| TEST-AV2-024 | La hora habitual, con la capacidad y sin ella, nunca como meta | AV2-27 |
| TEST-AV2-025 | El desenfoque, solo en la barra y nunca en la sesión | AV2-28 |
| TEST-AV2-026 | Ningún texto nuevo dice «cumplimiento», «adherencia» ni «racha» (`copy-pantallas.test.cjs`) | Todas |

**Los oráculos vigentes que cambian**, solo con su decisión ratificada: TEST-AVR-010 (AV2-D1), TEST-AVR-012 y 013
(AV2-D2), la prueba del recorte de la figura (AV2-D6), la lista T13 de textos (AV2-D2) y la prueba del carrusel
(AV2-D10).

## 9. Dependencias y coordinación

- **WP-USO-FINAL (#253, DL-169):**
  - UF-01 va en la misma APK: la candidata final sale con las dos;
  - UF-08 resuelve el aviso de prueba por ambiente. Esta vuelta no lo saca: solo lo hace entrar en la cabecera fina;
  - con UF-00, `VIGENTES` guarda solo la última versión: la candidata de la muestra y la final se congelan al
    publicarse.
- **WP-EDITORES-PROFESIONAL (#251, DL-167):**
  - el vidrio del website va ahí, pero hoy #251 no lo trae: tiene que sumarlo como parte propia. La receta de §3.1 y sus
    mediciones le sirven de base, con los tokens del website;
  - si AV2-27 entra, va en la misma ventana de redespliegue de la API que ED-13 y API-PLN-01 a 03.
- **DL-166 (#247, #249 y #250):** esta vuelta cambia PV-2 y PV-5 solo con AV2-D1 y AV2-D2. La etapa 3 de la vuelta de
  rosca (AV-15 y AV-19, con servidor) no se toca.
- **El tenue de la APK** (F-143): esta es la «próxima versión» que esperaba. Con ella, el website y la APK usan el mismo
  tenue en Azul noche.

## 10. Lo programado en la etapa A (2026-11-11)

En la rama `wp-app-vuelta-2` (#255, en borrador), con un commit por parte, los oráculos antes del código y cada prueba
verificada con su mutación (`EVIDENCIA/APP-VUELTA-2/LEEME.md`). Solo la APK: no toca la API, el dominio ni el
`package.json` de la raíz, y no redespliega nada.

### 10.1 Lo que cambió al programar (AV2-T14 a AV2-T16, a ratificar)

- **AV2-T14 · El brillo de arriba se apaga dentro del relleno (12 dp), no al 45 % del alto.** §5.2 se midió sin el
  brillo. Con el brillo al 5 % debajo, en Azul noche la etiqueta de estado bajaba a 4,00:1, el tenue sobre el nivel 2 a
  4,24:1 y el borde de un campo a 2,95:1. A 12 dp, el relleno más chico de un nivel 1, el brillo no queda debajo de
  ningún contenido; el texto de nivel 1 se mide igual con el brillo (5,02:1 o más). Lo fija TEST-AV2-002.
- **AV2-T15 · La receta pura vive en `receta-de-vidrio.ts`,** y `vidrio.tsx` la aplica (el contexto, los ganchos y la
  sombra de la lámina): las pruebas de Node no cargan `.tsx`. Es el mismo «un solo lugar» de §3.2, en dos archivos.
- **AV2-T16 · La etiqueta de estado, neutra en toda la app:**
  - `positiva` deja de pintar en verde; la tilde en `exito` va con `hecha`, solo con lo que la persona hizo (la sesión
    realizada, la comida registrada y el formulario respondido). «Vigente», «Otorgado», «Del plan» y «Ejercicio activo»
    quedan neutros;
  - el relleno va solo sobre una tarjeta de nivel 1 (de vidrio o `superficie`): directo sobre el fondo con los destellos,
    el tenue sobre ella bajaba a 3,69:1, y dentro de un nivel 2 también quedaba por debajo. (Revisado por AV2-T20, §10.4.)

### 10.2 Detalles de la programación

- **Un control suelto sobre el fondo** (un botón secundario o unos Segmentos fuera de toda tarjeta) conserva su
  superficie opaca: no se vuelve una tarjeta con sombra (`nivelDelControl`).
- **La tira de la semana no pide nada nuevo:** Inicio lee una vez la sesión de hoy (API-TRN-14) y la actividad de 30 días
  (API-TRN-19-LISTA) y las comparte con la tira; la lectura de 30 días suma un detalle por día, en cuentas. Una visita a
  Inicio hace las mismas solicitudes que antes. Sin plan de entrenamiento y sin nada hecho en la semana, la tira no se
  dibuja.
- **Inicio ya no lleva «Ver tu historial»:** la tarjeta «Actividad» no se toca, como dice §3.4 («Actividad de los últimos
  30 días: …», sin «botón»). Tu historial sigue en Entrenamiento.
- **La medida destacada** dice para el lector «… Ver la evolución» (no «Ver la evolución del peso»): el nombre de la
  medida ya va al principio de la etiqueta y no hace falta adivinar su género. El «Cómo se lee» que explicaba por qué se
  destaca esa medida no entra en la tarjeta chica: pasa al de Evolución con AV2-20 (etapa B), y hasta entonces no se ve.
- **«Dejarlo incompleto»** es el texto de siempre del dominio (la sesión de otro día, en Inicio), y no «Dejar
  incompleta».
- **Nutrición, sin «la que sigue»,** abre en la primera comida del plan, como antes.
- **Las fechas y las horas** se escriben sin el `Intl` de Hermes para los nombres y la hora (`formato.ts`): «sept», no
  «sep», y nunca «p. m.». El día de un instante es el del teléfono de la persona.

### 10.3 Lo que queda

- AV2-16, la medición en el teléfono (`EVIDENCIA/APP-VUELTA-2/rendimiento/`), y AV2-18, la muestra
  (`EVIDENCIA/APP-VUELTA-2/muestra/`): la candidata 0.24.0-candidata.1 se arma después de integrar la etapa A, como
  prerelease (AV2-D11).
- TalkBack, la letra ×1,3, el alto contraste y el dibujo de Android, en el teléfono: ninguna prueba los da por
  aprobados.
- La etapa B, con el visto bueno de Dirección a la muestra.

### 10.4 Lo que cambió con la revisión de la etapa A (2026-11-12; AV2-T17 en adelante, a ratificar)

Una revisión adversarial de la etapa A, antes de la muestra, encontró defectos que las pruebas no veían. Cada arreglo va
con su prueba y su mutación (`EVIDENCIA/APP-VUELTA-2/LEEME.md`).

- **AV2-T17 · La escala de letra se compara como la manda Android, en un solo lugar** (`escala-de-letra.ts`). Android
  guarda la escala como `float`, y React Native 0.86.3 la pasa a JS con `fontScale.toDouble()` (`DeviceInfoModule.kt`):
  «×1,3» llega como 1,2999999523…, y `escala >= 1.3` daba falso. Con la letra ×1,3 de los ajustes, Inicio seguía en dos
  columnas: fichas de 139 dp, donde «Desayuno» pide unos 147, y el nombre se partía. TEST-AV2-008 pasaba porque usaba el
  1,3 exacto; ahora usa `Math.fround(1.3)`. La escala se compara en centésimos (`alcanzaLaEscala`).
- **AV2-T18 · Las columnas de Inicio, según lo que entra.** Aun con la escala corregida, dos columnas no alcanzaban para
  una palabra larga a 360 dp:
  - las fichas de las comidas pasan a una columna si la palabra más larga de algún nombre no entra en media tarjeta
    (los nombres los escribe el profesional: «Preentrenamiento»). La cuenta es la de Nutrición (`fichasPorFila`, con las
    medidas de la ficha de Inicio), y una sola comida va a todo el ancho;
  - en las tarjetas chicas, el ícono va arriba del título si al lado no entra, y pasan a una columna si tampoco entra
    arriba. El par lo decide junto, con «Mediciones» (lo que se ve cada vez que Inicio carga) y «Actividad», para que las
    dos queden parejas. A 360 dp con letra ×1 el ícono va arriba: al lado del ícono quedan 94 dp, y «Mediciones» en 19
    sp y negrita pide unos 98 con las métricas de Roboto (106 con la estimación holgada del repo, 0,56 em por carácter,
    que es la que se usa). A 412 dp va al lado, como la maqueta; a 360 dp con ×1,15, una columna;
  - como red, los nombres y los títulos se parten por sílabas y con guion (`android_hyphenationFrequency="normal"`) si
    igual no entraran, y no en cualquier letra;
  - la tira de la semana tomaba su séptimo de media tarjeta, el ancho de una ficha: a 360 dp, el círculo del día medía
    17 dp y el número no entraba. Ahora sale de la tarjeta entera (34 dp).
- **AV2-T19 · El botón principal con vidrio, sin borde.** Conservaba el borde de 2 dp sin color (AV2-04) y pintaba el
  degradé con `experimental_backgroundImage`. React Native 0.86.3 ubica esa imagen en la caja de relleno, la pinta en la
  del borde y la repite (`BackgroundImageDrawable.updatePath`): arriba se veía el final del degradé y abajo el principio,
  una franja invertida de 2 dp (1,37:1 en Azul noche y 1,43:1 en Claro contra el degradé vecino). Ahora el borde es 0 y
  sus 2 dp pasan a relleno: el alto y el lugar del texto no cambian. Lo fija TEST-AV2-005.
- **AV2-T20 · La etiqueta de estado, rellena donde se lee** (revisa AV2-T16). AV2-T16 sacaba el relleno en todo lugar que
  no fuera un nivel 1, sin mirar si el vidrio estaba prendido, y la pieza cambia en toda la app: en Tu historial
  (Seccion › Tarjeta), Novedades, los formularios, los vínculos y el plan histórico, la etiqueta perdía el fondo pero
  conservaba la sangría de 12 dp, y quedaba como un texto gris corrido. Ahora va rellena donde el contraste medido pasa:
  sobre lo opaco (con el vidrio apagado o con alto contraste, cualquier tarjeta es `superficie`: 5,98:1 en Azul noche y
  4,84:1 en Claro; con el vidrio, el nivel 2 de Claro, que es blanco opaco) y sobre el vidrio de nivel 1. Sin relleno y
  sin sangría, alineada con el texto de al lado, donde no pasa: directo sobre el fondo con los destellos (3,69:1 y
  4,37:1) y dentro del nivel 2 translúcido de Azul noche (3,89:1). Lo fijan TEST-AV2-005 y la medición de TEST-AV2-001.

### 10.5 Hallazgos fuera del paquete

- **Severidad media · otros umbrales de la escala de letra, con el mismo defecto que AV2-T17** (en `main` desde antes de
  esta vuelta). Con la letra ×1,3 de los ajustes de Android (1,2999999523…), estas comparaciones con el literal dan lo
  pensado para la letra de siempre:
  - `pantallas/nutricion-hoy.tsx:688` (`fontScale >= 1.3`): la imagen del registro no baja debajo del texto, salvo en un
    teléfono de menos de 380 dp;
  - `franja-de-macros.ts:49` y `:68` (`ESCALA_PARA_DOS_POR_DOS`): la franja de los macros puede ir de a cuatro columnas
    en vez de dos por dos, si la cuenta de anchos dice que entran;
  - `composicion-de-la-figura.ts:103` y `:239`, y `pantallas/progreso-de-una-medida.tsx:94`
    (`ESCALA_DESDE_LA_QUE_VAN_NUMEROS`): la figura prueba primero las tarjetas laterales en vez de pasar a números, y el
    valor de una medida no se apila.

  El arreglo es el mismo: comparar con `alcanzaLaEscala` (`escala-de-letra.ts`) y probar con `Math.fround(1.3)`. No entra
  acá porque cambia Nutrición y Evolución, fuera de la etapa A; va en la etapa B (AV2-21 y AV2-19 tocan esos archivos) o
  en un arreglo aparte, con el sí de Dirección.
