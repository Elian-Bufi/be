# WP-TABLERO-ALTA-GAMA — el tablero del profesional, de alta gama

> **Estado:** ALCANCE RATIFICADO por Dirección el 2026-11-05 (por pregunta); etapa A en programación. Las decisiones
> DL-163 D-1 a D-21 están ratificadas, y el alcance son las partes TB-00 a TB-49: TB-49, la tarjeta «Lo que contó al
> empezar», se sumó con el sí. La etapa A se programa en la rama `wp-tablero-etapa-a`, que sale de `main` b91dc3f con
> esta declaración. El 2026-11-07, al ver la galería de capturas, Dirección sumó a la etapa A **TB-50** (la evolución de
> las últimas tomas en el Resumen) y **TB-51** (la barra de la composición en kilos con el porcentaje al lado), que
> modifica D-11 (§3.3), y pidió no integrar la etapa A hasta sumarlas. El mismo día amplió D-13: el plan del otro
> profesional, completo y de solo lectura, comentarios entre profesionales y un panel «Otras áreas» al planificar y al
> revisar (§3.4, TB-52 a TB-56). Ese mismo día respondió las decisiones: la tabla del plan completo es «todos con
> todos, con permiso» (TA-87) y el profesional puede pedir ver el plan del otro (TA-95, TB-56).
>
> **Encargo** (Dirección, del 2026-11-03 al 2026-11-05):
> - «En la página inicial del profesional en el inicio donde hace el resumen todavía lo veo muy soso»; «los puntos de
>   los gráficos los veo muy burdos»; «pequeñas barras de avance, o círculos porcentuales»; «poner fotos de perfil»; «un
>   flujo de pequeñas decisiones guiadas», como el de Entrenamiento.
> - Dirección autorizó desafiar el legajo y las decisiones anteriores si el fundamento es bueno.
> - El 2026-11-05: «yo como nutricionista me interesa saber qué información tiene en entrenamiento o en antropometría y
>   cómo fueron sus gráficos y evolución»; «algo alto visual en el dashboard»; «lo de las 5 semanas es una manera de
>   trabajar propia, no en general ni para todos los profesionales»; «dime si necesitamos algunos datos más que
>   requieren los mejores profesionales»; y que planificar sea «fácil e intuitivo».
> - Al cierre del 2026-11-05, ante «¿declaro el paquete?»: «Sí, declaralo».
> - El 2026-11-05, ante el alcance: «Ratifico, arrancá la etapa A ya», con la tarjeta «Lo que contó al empezar» en la
>   etapa A (TB-49).
> - El 2026-11-07, sobre la galería de capturas: «ahora es aceptable»; y sumó la evolución antropométrica y la barra en
>   kilos con el porcentaje en el Resumen (§3.3), sin integrar hasta tenerlas.
> - El 2026-11-07, sobre «Ver otras áreas»: «el nutricionista debería poder ver el resumen y hasta la planificación, y
>   poder dejarle comentarios al otro profesional»; y eligió, por pregunta, «Sí, plan completo de solo lectura» (§3.4).
>
> **Fuente:** la propuesta de Dirección «Tablero de alta gama» (27 secciones y 16 maquetas), que no está en el repo.
> Este paquete es autocontenido: lo que hace falta de ella está acá, y las maquetas, descritas con palabras (§1.1).
>
> **Decisiones:** DEUDA_LEGAJO DL-163, de D-1 a D-21. Las de la implementación se numeran desde TA-01 (§3). **Datos:**
> solo sintéticos (la cohorte de `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/`), en una base local
> propia.
>
> **Esta declaración:** rama `wp-tablero-alta-gama-declaracion`, desde `main` bdbf490 (#239, en borrador). Solo
> documentación: ningún código ni migración.

## 0. Legajo y decisiones que cita

- **04:** RF-052 (la cartera operativa), RF-053 (el dashboard interdisciplinario), RF-054 (la línea temporal), RF-055
  (las revisiones pendientes), RF-056 (registrar la revisión y la próxima acción), RF-034 (analizar la evidencia para
  una revisión) y RF-017 (el perfil propio, con el nombre visible). Para planificar, RF-030 y RF-039 a RF-041. Para
  compartir entre áreas, RNF-SEC-006 (la segregación por dominio, «salvo autorización explícita») y RNF-PRI-002 (la
  revocación efectiva).
- **05:** UC-P23 (consultar la cartera y las revisiones pendientes) y UC-P24 (el dashboard y la línea temporal), con
  UC-I02 (la autorización de cada dato); UC-P13 y UC-P18 (revisar y decidir la continuidad), con UC-I05 y UC-I06
  (registrar la revisión y aplicar su próxima acción); UC-P10, UC-P11, UC-P15 y UC-P16 (diseñar, validar y activar los
  planes), con UC-I04 (la instantánea); UC-P17 (registrar la sesión en la APK); UC-P20 (la evolución antropométrica);
  UC-P25 (el perfil propio).
- **06:** REG-06-123 (el objetivo nutricional, una decisión versionada del profesional) e INV-06-133 (BE no calcula el
  requerimiento); REG-06-126 (el microciclo, opcional), REG-06-127 (el propósito, texto libre) e INV-06-143 (la
  periodización es del profesional); REG-06-130 (la sustitución es un hecho de lo realizado); REG-06-139 (las zonas de
  cada ejercicio, con su rol); REG-06-145 (la próxima revisión, explícita); REG-06-162 a 164 (la comparabilidad de las
  tomas) y REG-06-166 (sin interpolar ni completar huecos); REG-06-178, REG-06-179 y REG-06-183 (el volumen por
  ejercicio y por zona, y la distribución del trabajo por zona, cada uno con su especificación); §14.8 (no existe un
  estado general de salud).
- **08:** §11 (cada profesional ve la porción de sus Alcances) y §11-bis (la pertinencia: §11-bis.2, §11-bis.3, la
  matriz de §11-bis.4-bis y el caso de la información ausente de §11-bis.7); C-11 y C-12 (la compartición excepcional,
  «con diseño propio», y la aceptación nueva ante una ampliación); §14.1 (pausar o terminar el vínculo corta); §19.7 (la
  persona ve quién accedió); §21 (las fotografías); §27.3 (sin caché de autorización); §29 (la auditoría); §33 y §42
  (los ambientes y el gate de datos reales); §52 (VJR-1, VJR-4 y VJR-5, y la validación disciplinar VD-1).
- **09:** API-DSH-01 y API-DSH-02, definidas en el 09 (v0.11 §13 y §14) y sin implementar; API-DSH-03 y API-DSH-04;
  API-PRJ-01 (las claves que hoy responden «especificación pendiente»); API-REL-02 y API-REL-05; API-ACC-06; API-TRN-24
  y API-NUT-20 (aplicar la próxima acción); API-ANT-06; API-PRO-01 (definida y sin implementar). Para planificar, el 09
  v0.9 y v0.10 (los contratos de los planes). De BE: API-CAR-01 (no cambia), la familia INV, API-NOV-01 y API-EJE-05.
- **10:** B10-08 y B10-09 (CAND-10-DSH-02, ADV-10-DSH-02, ADV-10-DSH-03, ADV-10-PRJ-01, DEC-10-UX-01, DEC-10-UX-02,
  CAND-10-PRJ-04, CAND-10-PRJ-09, §5, §9, §10, §21, §25 y §39); B10-10 (§4, §7 y §11 a §13); B10-05 (§28 y §59); B10-06
  (H10-TRN-04); B10-07 (§7, §49 y §51); 10-B02 §7.3.
- **11A:** TEST-PRJ-009 sigue verde. Los oráculos nuevos son TEST-TAG-001 a 033 (§6).
- **DL:** DL-163; DL-152 (lo que leen las APK instaladas no cambia); DL-137 D-7 (lo nuevo va en operaciones nuevas);
  DL-116 (la guardia de trazabilidad); DL-107 (Pendientes); DL-040 (el nombre visible); DL-009 y DL-117 D-2 (el perfil y
  la foto); DL-138 D-3 (sin la foto de Google); DL-158 y DL-153 (lo indicado en el plan y las comidas del plan); DL-111
  (decisión 11); DL-108 y DL-109 (plantillas y habituales); DL-049 (el día tipo en «Hoy»); DL-081 y DL-162 (las zonas y
  su curaduría); DL-122 (las capacidades del cliente); DL-135 D-8 (la TVCC-30, sin HTTP); DL-140 (la nota de
  coordinación); DL-165 (la sección común de hábitos y los formularios en la Línea de tiempo).
- **La guía:** `docs/ux/GUIA-UX-UI.md`, partes I (`:40-44`, `:152-153`), I.7 (`:438-441`), II.4 y V. Cambia con D-1 a
  D-5 (TB-17).

## 1. Objetivo y demostrables

Que el profesional vea su trabajo de un vistazo, lo resuelva de a una y planifique con lo que BE ya sabe calcular, con
BE dibujando su tiempo y ubicando la evidencia de la persona, sin calificar a nadie. La frase para el tribunal: «BE
dibuja el tiempo del profesional y ubica la evidencia de la persona: nada se llena con lo que la persona hace».

Los demostrables se miden con datos recién generados (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/paginas.mjs`):

| Vista | Hoy | Al cerrar el paquete |
|---|---|---|
| Espacio profesional, a 1440 × 900 y a 1920 × 950 | Dos listas de texto. Con pocos pendientes queda vacío un tercio de la pantalla | En la primera pantalla entran el encabezado, las cifras, «Tu semana» y las primeras dos o tres personas de la cola; a 1920 × 950, además, «Esperan respuesta». No hay lecturas nuevas, salvo el saludo y las invitaciones |
| Resumen, a 1440 × 900 y a 1920 × 950 | Tarjetas de texto y minigráficos chicos | En la primera pantalla entran las tarjetas con su ciclo y el valor de cada indicador, sin ningún gráfico pesado nuevo. A 1920 × 950 se mide si entran también los minigráficos; si no, se baja el tope de la tarjeta |
| Resolver tres pendientes | En cada uno: ir, resolver, recargar y volver a filtrar | «Empezar por el primero», tres cuadros y el retorno sin volver a filtrar. Se mide con la tarea «resolvé los pendientes de hoy» |
| Los cuatro gráficos | Tres lenguajes visuales y marcas fijas | Una sola gramática: lleno y hueco se distinguen a densidad 1, y lo elegido tiene una sola forma. En el minigráfico, la línea con la tira que lleva el estado de cada día |
| Lo de otra área | Cada profesional ve solo sus áreas; la nota de coordinación es el único puente | Si la persona lo comparte, la franja «Otras áreas · compartido por la persona», de solo lectura, con lo que fija la matriz (con datos sintéticos) |
| El cuerpo en la ficha | Las zonas, solo en un ejercicio o en una sesión, sin contar | El mapa corporal, de frente y de espalda, con una capa por vez (Medidas, Trabajo y Molestias declaradas) y su tabla |
| La composición corporal | En «Analizar», eligiendo las métricas a mano | Una pieza en kg, con el peso partido solo cuando el método lo parte y un método por gráfico |
| Un programa | No existen: cada profesional fija sus revisiones | «Semana N de M · hito» junto al nombre, para quien eligió un programa; los hitos, en «Tu semana» |
| Un mes de entrenamiento | Una versión nueva por cada semana distinta, o microciclos armados a mano que la app muestra todos juntos | Una sola versión con sus semanas, armadas con «Copiar la semana» y «Ajustar la semana»; la app muestra la semana que toca |
| Un plan de Nutrición con opciones | El profesional no ve cuánto aporta cada opción ni puede decir cuánto debería aportar el día | Cada opción con su estimación, ubicada frente al rango que escribió el profesional |

### 1.1 Las maquetas de la propuesta, en palabras

Son dieciséis, cada una en Claro y en Azul noche, con la cohorte sintética de test. Las ve Dirección en la propuesta;
acá se describe qué muestra cada una.

1. **Espacio profesional, a 1440:** «Buen día, Sofía»; una franja con tres cifras que filtran («Te toca a vos», «Esperan
   respuesta» y «Personas»); «Tu semana», de hoy a siete días, con las vencidas aparte; y la mesa: «Te toca a vos» por
   persona, «Esperan respuesta» y «Tus asesorados».
2. **Espacio profesional, a 1920 × 950** (el área útil de un monitor de 1920 × 1080): entran además «Esperan respuesta»
   y el comienzo de «Tus asesorados».
3. **Ficha · Resumen, a 1440:** Diego Sosa visto por Sofía Paz, con sus dos áreas y «Empezar por una pregunta»; el tramo
   del ciclo, «Desde tu revisión» en cifras y, en Antropometría, de qué está hecho el peso; abajo, los indicadores de
   sus áreas. A 90 días, la línea es la media de cada semana.
4. **Ficha · Resumen, a 1920 × 950:** la pieza propia de cada tarjeta se pliega y el lienzo se achica, para que entren
   los cuatro minigráficos con su tira.
5. **Composición corporal en kg:** Diego en un año, con el peso partido en masa libre de grasa y masa grasa con un solo
   método; «Cuánto cambió cada parte», con la misma vara; la tarjeta del Resumen a tamaño real; y qué pasa si cambia el
   método.
6. **Otras áreas:** Diego visto por Sofía: sus dos tarjetas y, debajo, la franja «Otras áreas · compartido por la
   persona», con el resumen de Entrenamiento que lleva Martín Acosta, de solo lectura (el plan sin ejercicios, las
   sesiones por semana y la carga de tres ejercicios); lo mismo en «Analizar», con las mismas fechas, y en la Línea de
   tiempo, sin contenido.
7. **El mapa corporal:** Diego visto por Martín Acosta: su Entrenamiento, la Antropometría que le compartió Diego (sin
   pliegues) y el cuerpo de frente y de espalda con la capa Trabajo (las series del período como zona principal, en un
   solo tono; la secundaria, rayada), la columna de composición y la tabla; abajo, las capas Medidas y Molestias
   declaradas.
8. **Los programas:** Sofía arma «Primer mes» en «Plantillas y habituales → Programas»: cinco semanas y sus hitos, cada
   uno con el acto que lo deja «Listo»; abajo, Lucas Fernández (cuenta de demostración) en la «Semana 2 de 5 · Primer
   control», el hito en «Tu semana» y el cuadro «¿Con qué programa empezás?», sin nada elegido.
9. **«Quién ve qué» en la app:** la app de Diego en tres teléfonos: lo que ve cada profesional, en una sola pantalla; el
   acto de compartir un resumen, con lo que se ve y lo que no, y «Ahora no» con el mismo peso; y quién lo miró y cuándo.
10. **El plan de Nutrición con rangos:** Diego visto por Sofía, en una versión en preparación: el rango del día de
    entrenamiento, en g y en g por kg con el peso de la última toma; los días a los que aplica, según la agenda que
    compartió Diego; el reparto del día, con cada opción ubicada frente al rango de su comida; y, en el almuerzo
    abierto, la estimación de la opción y «Usar lo que cubren como rango». Abajo, lo que ve Diego en la app.
11. **El plan de Entrenamiento por semanas:** Diego visto por Martín Acosta: un bloque de cuatro semanas que empieza con
    la agenda; Piernas A semana por semana, con lo que cambia al lado («+2,5», «igual», «−1»); «Copiar la semana» y
    «Ajustar la semana»; y lo que trabaja la semana 2 por zona, contado del plan.
12. **«Empezar el plan» en un solo cuadro:** Lucas Fernández con Sofía, en la semana 1 de «Primer mes»: desde dónde (una
    plantilla, la versión anterior o desde cero), qué se copia y qué no, y qué queda, con el hito del programa.
13. **El plan activo junto a lo registrado:** en Nutrición, los días de entrenamiento y cada comida de Diego, ubicados
    frente a los rangos que escribió Sofía, sin cuentas ni colores; en Entrenamiento, la Sentadilla con lo indicado de
    cada semana en escalones, la primera serie registrada y el esfuerzo de la sesión que contó Diego.
14. **De a una · el primer pendiente:** «Pendiente 1 de 3», la pregunta, el tramo vencido, lo que pasó desde la revisión
    en cifras y las tres salidas («Preparar la revisión», «Abrir la ficha» y «Saltear por ahora»). Nada clínico viene
    elegido.
15. **La gramática de gráficos:** el antes y el después a tamaño real, las marcas según el lugar de cada día, las
    líneas, la tira, el reloj y las barras, y lo que no se hace.
16. **El rostro:** el monograma en tinta neutra, sus tamaños, sus estados y dónde aparece. La foto, en la etapa B.

Faltan, antes de programar las partes que las usan: «¿Cuándo la revisás?» dentro de la revisión, el cierre de la cola,
los vacíos con una cuenta recién creada y dos pantallas del piloto (un profesional con Entrenamiento y Antropometría, y
el control semanal en «Esperan respuesta»).

## 2. Lo que no cambia

- **Las funciones, los permisos y qué ve cada quien,** salvo lo que la persona decida compartir (D-13).
- **Ningún contrato que lee una APK instalada suma un campo ni un valor** (DL-152): lo nuevo va en operaciones nuevas
  (§4). API-CAR-01 sigue con sus siete tipos. Lo que leen las APK instaladas está congelado por versión en
  `packages/domain/fixtures/lecturas-de-la-apk/`, y ninguna lee API-CAR-01, API-DSH-04 ni API-PRJ-01.
- **Las dos lecturas que solo hace el website se extienden como ya se hizo en DL-153, DL-158 y DL-165 D-13:** API-PRJ-01
  (las claves que el 09 declara y hoy responden «especificación pendiente», y los rangos junto a lo indicado del plan) y
  API-DSH-04 (los hitos de otras áreas, sin contenido). Cada extensión se declara como decisión de implementación (TA-)
  antes del código, con su prueba en `contrato.int-spec.ts`.
- **Las reglas de BE:** ubicar, nunca calificar; un hueco es un hueco, nunca un cero; cada dato dice de dónde sale; ver
  no es revisar (ADV-10-DSH-03); registrar, aplicar y activar son tres actos.
- **Los textos que son garantías del dominio:** la síntesis, la cobertura, los efectos de cada resultado, «Desde la
  revisión» y los rótulos de la condición de una sesión («Realizada», «Realizada con desvío», «No realizada»). Se parten
  en cifra y texto, pero no se reescriben.
- **La accesibilidad ya lograda** y las pruebas que la sostienen: T13 (`scripts/copy-pantallas.test.cjs`), el contraste
  (`scripts/contraste.test.cjs`), la prueba de términos de la cartera y la de lo que leen las APK.
- **El legajo:** no se edita. Lo que choca queda en DL-163.

## 3. Partes

Cada parte deja la rama en un estado que sirve aunque el plazo corte lo que sigue. Las decisiones de la implementación
se numeran desde TA-01, como E-01 en WP-ESCRITORIO-AMABLE: cada una dice qué se eligió y qué otra opción había, y las
que cambian la forma de un contrato se ratifican antes de integrar.

| ID | Parte | Etapa | Decisión | Toca la API | Se acepta cuando |
|---|---|---|---|---|---|
| TB-00 | Declaración y línea de base | A | — | No | Este paquete y DL-163 están en el repo con sus IDs, y Dirección dio el sí al alcance (ACTA-DIR-034). La rama `wp-tablero-alta-gama` sale de `main` del día en que se arranca, y su hash queda acá. Hay capturas de esa base del Espacio, el Resumen, Analizar, Entrenamiento y Antropometría, en Claro y Azul noche, a 1440 y a 1920 |
| TB-01 | La letra | A | D-3 | No | Inter variable y Poppins 600 se autoalojan con `next/font/local`, con su licencia, cifras tabulares y un respaldo ajustado. `package-lock` no cambia y alcanza con `font-src 'self'`. A 1280 × 800 y a 1440 × 900, la primera pantalla muestra lo mismo que la línea de base |
| TB-02 | La gramática de marcas | A | D-3 | No | Una sola función de radio, según el lugar disponible y el estado, en `geometria.ts`, que usan los cuatro gráficos. Lleno y hueco se distinguen a densidad 1. Lo elegido y el foco tienen una sola forma cada uno, el rombo es proporcional y el piso de la letra rige en todos. Las pruebas de geometría y de contraste pasan |
| TB-03 | Líneas, grilla y fondos | A | D-3 | No | Los trazos de la escala nueva y la grilla solo horizontal, en los cuatro gráficos. La vigencia va en `--banda`, con 1,3:1 como mínimo y la vertical rotulada como la que la lleva, sin columnas de todo el alto. Entrenamiento pasa al lenguaje de Analizar, y `--grafico-planificado` y `--grafico-registrado` salen de los gráficos |
| TB-04 | El minigráfico | A | D-3 y D-5 | No | Más alto, con el eje que sale de los días completos y del objetivo, la muesca con su cuenta para lo que queda fuera de escala, el objetivo y la versión rotulados, la tira alineada con el estado de cada día y una sola línea de cuentas. Con poco lugar por día, la línea se corta en los días sin registros y en los huecos, y llevan marca solo el último, el elegido y los aislados; con más lugar, todos los puntos. A 90 días, la línea es la media de cada semana de BE, con su denominador, y los días van como puntos claros. La descripción accesible no cambia. Se mide a 1920 × 950 |
| TB-05 | El rostro y «Ocultar nombres» | A | D-2 | No | `inicialesDe`, con sus casos, y `Retrato`, de un solo tono neutro, donde ya se ve el nombre («Te toca a vos», «Tu semana», «Esperan respuesta» si hay nombre, «Tus asesorados», el cajón, el marco de la ficha, las notas, las novedades y el menú de la cuenta) y en ninguno de los lugares prohibidos (las solicitudes y las invitaciones a quien no tiene un vínculo vigente, la vista previa de una invitación, los avisos y, para las personas, Administración). `contraste.test.cjs` mide las iniciales contra `--ahora` (ΔE de 20 o más). «Ocultar nombres» rige en todas las rutas /pro/** (el Espacio, el cajón y la ficha: el marco, las notas, las novedades y «Siguiente pendiente») y en el título de la pestaña, y se recuerda en el navegador. La prueba recorre el Espacio, el Resumen y el cajón, y falla si aparece un nombre o una inicial |
| TB-06 | El encabezado y las cifras de /pro | A | D-3 | No | El saludo usa la primera palabra del nombre propio que no sea un título, o va a secas. «Te toca a vos» y sus desgloses filtran con `aria-pressed`; «Esperan respuesta» y «Personas» son enlaces dentro de la página, sin `aria-pressed`. Las tres muestran su desglose y dicen «al menos» si faltan páginas. Hay un solo botón lleno, y solo se suman dos lecturas: el saludo y las invitaciones |
| TB-07 | «Tu semana» | A | D-3 | No | Las revisiones de hoy a siete días, con las vencidas aparte, en «Vencidas», en fichas con rostro, nombre y área: hasta tres por día, y después «y N más». No hay tomas, horas ni «hecho». El vacío está diseñado, hay «Ver como lista» y el teclado recorre las columnas. Con el cajón apagado, cada ficha lleva a su destino con el retorno |
| TB-08 | «Tus asesorados» con rostro y antigüedad | A | D-2 | No | Monograma, nombre, referencia, áreas y «con vos desde», con los estados del vínculo en palabras. La fila entera es el destino, en orden alfabético y sin datos de seguimiento |
| TB-09 | La acción del momento encadenada | A | — | No | Sigue el orden aplicar → revisión acordada → borrador → empezar, con una prueba por eslabón, incluido el caso de Federico Álvarez (una revisión registrada y sin aplicar, que hoy ofrece «Preparar la revisión»). «Preparar la revisión» abre la revisión ya preparada |
| TB-10 | Las tarjetas de área del Resumen | A | D-1 y D-11 | No | El tramo del ciclo, con la ventana de cada tarjeta, y `avanceDelReloj` con su prueba de propiedad: con las mismas fechas, la barra es la misma, registre lo que registre la persona. «Desde tu revisión» en tres cifras; la pieza propia de cada área (la barra partida de Nutrición, de una sola fuente y una sola ventana; las sesiones por ejercicio, con los rótulos del dominio; en Antropometría, la barra de la composición de la última toma, con la línea de las tomas como respaldo cuando no hay método); y «Empezar el plan» en miniatura en un área sin plan. A 1440 × 900 entran las tarjetas y el valor de cada indicador, y a 1920 × 950 se mide si entran los minigráficos |
| TB-11 | Pendientes por persona, en dos carriles | A | D-4 | No | Se agrupa por `identityId`. Las pruebas: las personas se ordenan por su pendiente más urgente según `compararPendientes`, los renglones de cada persona siguen `compararPendientes` y la vista «Por pendiente» conserva exactamente el orden de DL-107. «Esperan respuesta» va aparte, con el selector «Por persona / Por pendiente». La prueba de términos de la cartera corre sobre los textos nuevos |
| TB-12 | El cajón «De a una» | A | D-4 | No | La pregunta sale de lo que se lee al abrir: dos lecturas, solo del cuadro actual. El cajón sigue el orden de la vista elegida. Saltear no escribe, y el retorno guarda identificadores, sin nombres. J, K, S y Escape funcionan solo con el foco adentro, y Enter nunca escribe. El cierre es un comprobante, sin cuentas, festejos ni tachados. El cajón queda detrás de una constante hasta que su recaptura esté verde; apagado, cada ficha y cada verbo llevan a su destino exacto con el retorno, «Empezar por el primero» no se muestra y el botón lleno vuelve a ser «Invitar a una persona» |
| TB-13 | Las pruebas de la divergencia y del seguimiento finalizado | A, en la rama de la API | D-4 y D-6 | Sí | Una revisión aplicada como «Mantener» sin fecha nueva no sigue como vencida, y un seguimiento finalizado no vuelve como «Sin plan activo». Si alguna falla, la cartera pasa a usar la definición de pendiente del dominio de revisión, sin cambiar la forma de API-CAR-01 |
| TB-14 | Los dos estados nuevos, en la cola de revisiones | A, en la rama de la API | D-6 | Sí | API-DSH-02, de solo lectura, trae `NEXT_ACTION_PENDING`, primero, y `ACTIVE_PLAN_WITHOUT_REVIEW`, último, con los textos permitidos de B10-08. API-CAR-01 no cambia. Si la API todavía no la tiene, el website muestra la mesa sin esas filas, y las APK instaladas quedan intactas |
| TB-15 | Aplicar desde el cajón y «¿Cuándo la revisás?» | A | D-6 | No | Aplicar reusa la operación de Revisiones (API-TRN-24 y API-NUT-20), con su idempotencia y sus conflictos, y escribe el resultado, el fundamento y el efecto antes del botón. «¿Cuándo la revisás?» aparece en el paso 3 de la revisión («Lo que decidís») y al activar, sin nada elegido, y dice la fecha que resulta; después de aplicar no se pregunta. «Sin fecha por ahora» dice su efecto, y no aparece con «Reprogramar revisión», donde la fecha es obligatoria (REG-06-145) |
| TB-16 | El período de la persona nueva | A | D-7 | No; si hace falta recortar en la API, pasa a la etapa B | Se verifica qué devuelve la API antes del vínculo. El período del Resumen arranca en el vínculo más antiguo de las áreas que ve el profesional, si tiene menos de 90 días, y lo dice; en cada tarjeta y en su tira, lo anterior al vínculo de esa área no se dibuja. Con uno a tres días con valor no hay línea ni media. La ficha de la cohorte no cambia |
| TB-17 | La guía, el criterio y la pauta | A | D-1 a D-5 | No | Se actualizan la guía (I, I.7, II.4, la parte V y la pauta nueva «Decisiones guiadas»), el criterio de auditoría de las maquetas (fuera del repo) y DEUDA_LEGAJO. De paso se corrigen cuatro desalineaciones: DL-161 figura «sin integrar», el criterio dice validación «Pendiente», la guía cuenta 105 íconos (son 115) y falta una nota en DEUDA_LEGAJO que confronte los minigráficos de E-53 y E-54, que leen API-PRJ-01, con DEC-10-UX-01 |
| TB-18 | El panorama de la cartera | B | D-8 | Sí | API-DSH-01, por conjuntos, con una sola pasada del PDP, tope de 200 y los pendientes adentro, que decide la nueva evidencia con `conteosDesde`. «Nueva evidencia disponible» aparece solo en un área con una revisión vencida, próxima o sin aplicar, nunca como columna de toda la cartera. Sin valores de salud ni orden por actividad. Medida en Render con 200 personas, no es más lenta que hoy. Requiere integrada la lectura de la cartera por conjuntos (#222) |
| TB-19 | El programa del piloto, liviano · **reemplazada por TB-33** | — | La D-9 original, reemplazada | — | Reemplazada el 2026-11-05 por TB-33 (la D-9 nueva): no hay una constante de cinco semanas para todos. El ID queda para que no se reuse |
| TB-20 | La candidata de la APK con «Hola, Diego» y las iniciales | B | D-2 | No | Lee `/me/profile`, que ya existe (API-ACC-06-PROPIA), con lo que lee congelado (DL-152) y sin dependencias nativas nuevas. Está probada en el teléfono |
| TB-21 | La prueba con profesionales | B | — | No | T1, T5 y «resolvé los pendientes de hoy», con el tiempo, los errores y las vueltas a /pro de antes y de después, y tres preguntas de comprensión sin guiar: «¿esta barra dice algo de la persona?», «¿qué quiere decir este punto hueco?» y «¿qué quiere decir una zona clara?» |
| TB-22 | El anillo del reparto declarado (opcional) | B | D-10 | No | Aparece solo con la proporción declarada, y una prueba confirma que con gramos no se dibuja. Va sin «%», con tabla equivalente y nunca junto a lo registrado. Se hace si Dirección lo quiere |
| TB-23 | La foto del profesional | B, después de TB-20 | D-2 | Sí | Entra al inventario del 08 como dato profesional (C3), con su texto, su plazo, su exportación y su supresión, y su DL. La API guarda solo una miniatura cuadrada, recortada sin terceros (API-RET). Se ve en el menú del website y, con una candidata de la APK, en Vínculos y en «Para responder». La foto de Google sigue excluida (DL-138 D-3) |
| TB-24 | Composición corporal | A | D-11 | No | La pieza en la pestaña Antropometría, la pregunta «¿De qué está hecho el cambio de peso?» en «Analizar» y la barra de la última toma en la tarjeta. Lee API-ANT-06, sin tocar la API. Una prueba confirma que nunca parte una columna con métodos distintos ni con un método que no suma el peso; dos colores nuevos con su par en `contraste.test.cjs`. A la cohorte se le aplican las masas de Durnin y Womersley (un cambio de datos sintéticos, no de código) |
| TB-25 | Indicadores por área | A | D-12 | No | Los cuatro indicadores por defecto salen de las áreas del profesional: con Nutrición, calorías, proteínas, masa grasa (o peso) y registros; con Nutrición y Antropometría, la suma de 6 pliegues en lugar de los registros; con Entrenamiento, la carga de la serie principal, las series por semana, el RIR y la masa libre de grasa (o el peso), si la ve; con Antropometría, masa grasa (o peso), la suma de 6 pliegues, la cintura y el perímetro de brazo flexionado. Lo guardado por la cuenta manda. Sin API |
| TB-26 | La matriz de lo que se comparte entre áreas | A, en rama | D-13 | Sí | Una tabla de configuración área de origen × área de quien recibe × categoría → permitido y detalle, versionada y auditada, de Dirección por acta; sin fila, es no. Las pruebas: los casos permitidos y negados de la matriz (§3.1), su inversión y que una ampliación no se ve hasta que la persona acepta de nuevo (A-5 del 08) |
| TB-27 | El acto de compartir un resumen y sus operaciones | A, en la rama de la API | D-13 | Sí | API-RES-01 a 05: la persona comparte, cambia con quién y retira, con la versión del texto, `Idempotency-Key`, auditoría y evento; el profesional lee los resúmenes y sus series solo con el vínculo vigente y lo que dice la matriz, y sin nada compartido recibe la lista vacía. Cada lectura queda en la auditoría que ve la persona; pausar o terminar el vínculo lo corta. Con personas reales, después de lo legal y del gate del 08 §42 (§9). Las APK instaladas no cambian lo que leen |
| TB-28 | «Quién ve qué» en la APK | B, en una candidata | D-13 | No | Una pantalla desde Cuenta, Vínculos y Privacidad, con una tarjeta por profesional: sus áreas, las fotos de las comidas, los hábitos y los resúmenes compartidos, con «Compartir», «Dejar de compartir» y los accesos. «Ahora no» tan visible como compartir, y nada elegido. Probada en el teléfono, con TalkBack |
| TB-29 | Las otras áreas en la ficha | A, en rama | D-13 | Sí, los hitos en API-DSH-04 | La franja «Otras áreas · compartido por la persona», con tarjetas rotuladas (el área, quién la lleva, «Solo lectura» y la fecha); las métricas compartidas en «Analizar», cada una en su gráfico y con su autor; y los hitos de otras áreas en la Línea de tiempo, sin contenido, que API-DSH-04 suma como sumó los formularios (DL-165 D-13). Sin nada compartido no hay tarjeta, candado ni aviso, y ningún botón escribe en el área del otro |
| TB-30 | El mapa corporal y la capa Medidas | A | D-14 | No | La pieza del Resumen con el cuerpo de frente y de espalda (el set de capas de Dirección), las pestañas por capa, la columna de composición (TB-24) y la tabla. Medidas: los perímetros y los pliegues de la última toma con el cambio desde la comparable anterior, con signo y sin color. Una prueba confirma que ningún sitio cambia de color por su valor |
| TB-31 | La capa Trabajo y las series por zona | A, con una parte en la rama de la API | D-14 y D-15 | Sí | La especificación escrita de `TRAINING_VOLUME_BY_MUSCLE_ZONE` y `TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE` (una serie por cada zona de su ejercicio, en su versión, por rol y sin ponderar) y su resultado en API-PRJ-01, que solo lee el website; las zonas de los ejercicios del catálogo, curadas por BE (DL-162). En el mapa, un tono en cuatro tramos para la principal, rayado para la solo secundaria y sin relleno para el cero, con su leyenda y su tabla; en «Analizar», barras agrupadas por zona |
| TB-32 | La capa Molestias declaradas | A | D-14 | No | Lo respondido en «Antes de entrenar» (`trn_zonas` y cuándo molesta), con su fecha y «Declarado por la persona», en marcas neutras sobre la región. Una prueba confirma que no aparece ni se nombra para quien no lleva Entrenamiento ni en un resumen compartido. Sin rojo, sin escala y sin «lesión» |
| TB-33 | Los programas de cada profesional | A, con una parte en la rama de la API | D-9 nueva | Sí | «Plantillas y habituales → Programas» (API-PRG): nombre, semanas e hitos, cada uno con el acto que lo cierra, por versiones. Al empezar con una persona se elige uno o ninguno, sin nada elegido. «Semana N de M · hito» junto al nombre, los hitos en «Tu semana» y en «¿Cuándo la revisás?». Una prueba de propiedad: ningún registro de la persona cambia una semana ni un hito. Reemplaza a TB-19. Lista antes de la S1 del piloto, o el piloto va sin la semana a la vista |
| TB-34 | Los datos derivados en «Analizar» | A, con una parte en la rama de la API | D-15 | Sí | El volumen de carga por ejercicio y por semana (la especificación de `TRAINING_VOLUME_BY_EXERCISE`), la pregunta «¿Cómo se reparten las proteínas en el día?» y la somatocarta en Antropometría, cada uno con su especificación escrita, su tabla y lo que deja afuera |
| TB-35 | El esfuerzo de la sesión | B, en una candidata de la APK | D-16 | Sí | Una pregunta opcional al terminar la sesión, de 0 a 10 con palabras, en una operación nueva (API-ESF); la carga interna (esfuerzo × minutos), solo con la duración medida. Sin derivados de riesgo ni de fatiga. Las APK instaladas no cambian lo que leen |
| TB-36 | El control semanal en el tablero | B, para el piloto | D-16 | No | La plantilla la hace otro paquete del plan de datos reales (WP-CONTENIDO-DEL-PILOTO), con las preguntas revisadas por el abogado y la validación disciplinar (LC-41 y VD-1). Acá: su envío en «Esperan respuesta», como hito del programa si el profesional lo puso, y cada respuesta en su fila, sin puntaje sumado |
| TB-37 | El peso en casa | B, después del piloto | D-16 | Sí | «Me pesé» en la APK, cuando el profesional lo habilita para esa persona (API-PCA): una medición reportada, en su propia serie y nunca unida a las tomas; su línea en el inventario del 08 y el texto A2, antes de datos reales |
| TB-38 | Lo que el profesional no ve al planificar | A, con una parte en la rama de la API | D-20 | Sí | En el editor y en el plan activo de Nutrición, la estimación de cada opción para las porciones del plan, la misma cuenta que ve la app, en una lectura nueva del profesional (API-PLN-01): lo que lee la app no cambia (DL-152). Sin total, dice qué falta. En Entrenamiento, «Lo que trabaja la semana»: las series planificadas por zona, contadas del plan con la regla de D-15, en el editor y en el plan activo, sin mínimos ni un ideal y nunca al lado de lo registrado |
| TB-39 | Los rangos de Nutrición | A, con una parte en la rama de la API | D-17 | Sí | Por día tipo y por comida, cada macro y las calorías con mínimo y máximo, todos opcionales, en g o en g por kg; en g por kg, los gramos con el peso de la última toma y su fecha. Van en la versión y en su instantánea, por operaciones nuevas (API-PLN-02 y 03). La opción, ubicada frente al rango, sin color; «Usar lo que cubren como rango», solo al tocarlo; «Objetivo del día» pasa a «Objetivo general». Las pruebas: T13 sobre los textos nuevos, ninguna marca cambia de color por caer afuera y las opciones nunca se suman como un total del día |
| TB-40 | Los rangos al leer lo registrado | A, con una parte en la rama de la API | D-17 | Sí | «Junto a lo registrado» en la pestaña Plan de Nutrición: cada día de un día tipo frente a su rango y cada comida frente al suyo, un punto por día, sin cuentas de días «dentro», sin color y sin unir los días. En «Analizar», la capa «indicado en el plan» de DL-158 suma la franja del día tipo y la de la comida (en API-PRJ-01, §2), y «Calorías previstas del día» se ofrece como rango |
| TB-41 | Los días de cada día tipo | A, con una parte en la rama de la API | D-18 | Sí | Cada día tipo dice a qué días de la semana aplica (API-PLN-04 y 05). Con la agenda compartida (D-13) o con las dos áreas, BE propone los días con sesión y el profesional confirma, con su procedencia. Analizar sabe el día tipo de cada fecha. Una prueba: un mismo día de la semana no queda en dos días tipo |
| TB-42 | El día tipo de hoy en la app | B, en una candidata de la APK | D-18 | Sí | «Hoy · Día de entrenamiento», con el selector para elegir otro y sin elegir en silencio (B10-05 §28), en una operación nueva para la persona (API-PLN-06): las APK instaladas no cambian lo que leen. Probada en el teléfono, con TalkBack |
| TB-43 | Las semanas del bloque | A, con una parte en la rama de la API | D-19 | Sí | Cada semana es un microciclo, en orden, desde el «Empieza el» de la agenda (API-PLE-01 a 03). La grilla semana por semana; «Copiar la semana», que duplica un microciclo con todo lo suyo; «Ajustar la semana», que suma a las cargas, las repeticiones o el RIR y escribe valores; el nombre y el propósito de cada semana, libres; y lo que cambia al lado («+2,5», «igual», «−1»). La agenda dice qué día va cada sesión de la semana y vale para todas. Una prueba de propiedad: la semana sale del calendario, y ningún registro de la persona la mueve. Sin semanas, el plan de hoy |
| TB-44 | La semana que toca en la app | B, en una candidata de la APK | D-19 | Sí | «Semana 2 de 4 · Carga» en Hoy y en el Plan, con las sesiones de esa semana (API-PLE-04). Activar un plan con semanas pide una app que las entienda, como hoy los objetivos por serie (`CLIENT_CAPABILITY_REQUIRED`). Al terminar la última semana, sigue esa hasta una versión nueva. Probada en el teléfono, con TalkBack |
| TB-45 | Lo registrado junto al plan, en Entrenamiento | A | D-19 y D-16 | No | En la pestaña Plan, «Junto a lo registrado»: lo indicado de cada semana en escalones, la primera serie registrada en puntos, la tabla serie por serie y el esfuerzo de la sesión que contó la persona (TB-35). Lo indicado no cambia por lo registrado |
| TB-46 | «Empezar el plan» en un solo cuadro | A | D-9 nueva | No | El mismo cuadro en las dos áreas, sin nada elegido: desde una plantilla, con lo que trae a la vista antes de elegirla; desde la versión anterior; o desde cero. Qué se copia y qué no, antes de crear. El programa y el hito que cierra el plan al activarse. En Entrenamiento, la agenda. Si falta la evaluación o el objetivo, empieza por ahí; si ya hay un borrador, ofrece seguirlo o descartarlo (TB-47). Reusa las operaciones de hoy |
| TB-47 | Descartar un borrador | A, en la rama de la API | D-21 | Sí | Una operación nueva por área (API-PLN-07 y API-PLE-05): descarta un borrador que nunca se activó, con `Idempotency-Key`, auditoría, evento y confirmación en pantalla. Libera «Empezar desde una plantilla» y la aplicación de una revisión. Una prueba: una versión activada no se descarta nunca |
| TB-48 | Lo que se arregla en los editores | A | — | No | La nota del ítem en el editor de Nutrición; duplicar un día tipo, una comida, una opción, una sesión y un ejercicio; reordenar; quitar una serie del medio; los topes, avisados antes de guardar; el microciclo ofrecido también con sesiones sueltas; «Validar plan» pasa a «Revisar el plan» y lista también lo incompleto, sin bloquear; «Guardar como plantilla» con su texto; el cuadro sin plantillas deja de prometer que se escriben en «Plantillas y habituales»; la receta como opción, con buscador; y las zonas de un ejercicio propio, desde «Mis ejercicios» |
| TB-49 | La tarjeta «Lo que contó al empezar» | A | DL-165 D-8 | No | El Resumen de la ficha muestra las respuestas vigentes de los formularios de inicio que ese profesional pidió, en palabras, con su fecha y su procedencia: «Declarado por la persona», o cargado por el profesional y confirmado por ella. Abre la solicitud. Es de solo lectura, sin contar ni calificar, y lee lo que ya existe |
| TB-50 | La evolución de las últimas tomas en el Resumen | A | Pedido de Dirección del 2026-11-07 (§3.3) | No | En la tarjeta de Antropometría del Resumen, una pieza con las últimas tres o cuatro tomas con medidas, en pares que se leen juntos: cintura y pliegue abdominal; suma de 6 pliegues y peso; brazo flexionado y pliegue tricipital. Una columna por toma, con su fecha; una fila por medida, con su línea, el valor escrito sobre cada punto y la diferencia con su signo y su unidad, con la gramática de TB-02 y TB-03. Kilos con kilos: cada medida en su unidad, nunca dos unidades en un eje, y la misma vara en las filas de una misma unidad. Lo no comparable y lo no medido, dicho con palabras. Sin colores que juzguen y sin lecturas nuevas. Las pruebas de geometría y TEST-TAG-036, con sus mutaciones verificadas; las capturas, con `capturas-del-tablero.yml` |
| TB-51 | La barra en kilos con el porcentaje al lado | A | D-11, modificada por Dirección el 2026-11-07 | No | La barra de la última toma, en la tarjeta y en la pestaña, en kg y con el % al lado de cada parte; el 100 % es el peso de esa toma. Si el método calcula el músculo (De Rose y Guimarães, o Lee), la barra es grasa, músculo y resto, y el texto dice qué es el resto; si no, grasa y libre de grasa. Sin colores de bueno o malo. Un token nuevo, `--composicion-resto`, con sus pares en `contraste.test.cjs`. TEST-TAG-017 suma los casos, con sus mutaciones; T13 admite ese «%» en un solo lugar |
| TB-52 | El plan del otro profesional, completo y de solo lectura | A, en la rama de la API (#243) y en el website | D-13, ampliada por Dirección el 2026-11-07 (§3.4) | Sí | Con la autorización de la persona en el nivel «resumen y plan» para ese profesional y esa área, y con la fila de la matriz (§3.1), API-RES-06 devuelve la instantánea de la versión activada vigente del área (UC-I04), con su objetivo vigente, su autor, desde cuándo rige, la próxima revisión acordada (solo la fecha) y lo avanzado en cifras que la matriz admite. Nunca un borrador, una versión anterior, una revisión, una nota interna ni una evaluación. En la ficha, «Ver el plan completo» abre una vista de solo lectura, con «Solo lectura · lo comparte la persona» y el autor. Quien lleva el área ve con quién se comparte y en qué nivel (API-RES-07). Sin autorización, el 404 de lo inexistente. Las lecturas quedan en la auditoría que ve la persona. TEST-TAG-037 |
| TB-53 | Comentar con las notas de coordinación | A, en la rama de la API (#243) y en el website | D-13, ampliada; DL-140 (CRD-D5, ampliada) | Sí, una regla | Desde el plan compartido y desde el panel, «Dejar una nota a …» abre el redactor de siempre (API-CRD-01) con quien lleva el área como destinatario y la finalidad sin elegir. La nota puede citar la versión del plan compartido que el autor ve por API-RES-06 en ese momento: es el tipo de referencia que ya existe (`TRAINING_PLAN_VERSION` o `NUTRITION_PLAN_VERSION`), con la misma forma, así que lo que leen las APK no cambia (DL-152). La nota no da escritura ni cambia el plan, la lee la persona (CRD-D2) y el redactor lo dice. Sin hilos en esta parte. TEST-TAG-038 |
| TB-54 | El panel «Otras áreas» al planificar y al revisar | A, en el website | D-13, ampliada | No | En los editores de Nutrición y de Entrenamiento y en el paso 1 de la revisión, un panel plegado «Otras áreas · lo comparte la persona», por área compartida: quién la lleva, el objetivo, el plan vigente en una línea, lo avanzado, «Ver el plan completo» (si el nivel lo permite), las últimas notas del equipo y «Dejar una nota a …». Se lee al abrirlo: abrir el editor o la revisión no suma peticiones (TEST-TAG-032). Sin nada compartido no hay panel, candado ni aviso (§11-bis.7). Nada escribe, salvo la nota. TEST-TAG-039 |
| TB-56 | Pedir ver el plan del otro | A, en la rama de la API (#243) y en el website; en la APK, B | D-13, ampliada; TA-95, decidida por Dirección el 2026-11-07; el mecanismo de DL-165 D-17 | Sí | Desde el panel «Otras áreas», «Pedir ver su plan» (API-RES-08): a la persona le llega una novedad «Importante» que dice quién pide, desde qué área y para qué, y que es su decisión. La persona responde «Sí, que lo vea» o «No, por ahora» (API-RES-09 y API-RES-10) y puede cambiarlo siempre. Uno por vez y, sin respuesta o con «No, por ahora», se puede volver a pedir a los 7 días, como los hábitos. Compartir desde «Quién ve qué» acepta el pedido que esperaba. El pedido no concede nada. TEST-TAG-040 |
| TB-55 | El permiso de la persona, por área y por nivel | A, en la rama de la API (#243); en la APK, B | D-13, ampliada; 08 C-12 | Sí | API-RES-02 suma el nivel («resumen» o «resumen y plan») por profesional y por área, cada uno con su versión del texto; pasar de «resumen» a «resumen y plan» pide aceptar de nuevo, y bajar o retirar corta en el momento. «Quién ve qué» (TB-28) muestra el nivel, con «Ahora no» tan visible como compartir y nada elegido. Los textos, marcados como propuesta pendiente de validación jurídica. Con personas reales, después de la revisión legal (§9). Las APK instaladas no cambian lo que leen |

### 3.1 La matriz por pertinencia (D-13)

Qué entra en el resumen que la persona le comparte a un profesional de otra área. Es asimétrica a propósito: la
nutricionista es un perfil sanitario y puede recibir más de Entrenamiento; el entrenador no recibe números de Nutrición
(08 §11-bis.2). Con dos áreas, quien recibe ve la unión de las dos columnas, jamás más. Sin fila, es no.

| Del área… | Lo que se comparte | Lo recibe Nutrición | Lo recibe Entrenamiento | Lo recibe Antropometría |
|---|---|---|---|---|
| Entrenamiento | Los días por semana del plan y el tipo de entrenamiento («Fuerza · torso y piernas») | Sí | — | Sí |
| Entrenamiento | Las sesiones registradas por semana | Sí | — | Sí |
| Entrenamiento | La evolución de los ejercicios principales: la carga de la primera serie, sesión a sesión (hasta tres, los que elige su profesional) | Sí | — | No |
| Entrenamiento | El trabajo por zona (la capa Trabajo del mapa) | Sí | — | Sí |
| Entrenamiento | Las molestias de «Antes de entrenar» y lo de salud del formulario | No: no es pertinente; ante la duda, no | — | No |
| Antropometría | El peso y la composición en kg, con su método | Sí | Sí | — |
| Antropometría | La suma de 6 pliegues y cada pliegue | Sí | No | — |
| Antropometría | Los perímetros | Sí | Brazo y muslo | — |
| Nutrición | El objetivo, lo registrado por día o por semana y las comidas | — | No | No |
| Nutrición | Los hitos: plan vigente desde, la última revisión y la próxima | — | Sí, sin números | Sí, sin números |
| Entrenamiento | **El plan completo, de solo lectura** (D-13, ampliada el 2026-11-07; TB-52): la versión activada vigente, el objetivo y lo avanzado | Sí, con el nivel «resumen y plan» | — | Sí, con el nivel «resumen y plan» |
| Nutrición | **El plan completo, de solo lectura** (D-13, ampliada; TB-52) | — | Sí, con el nivel «resumen y plan» | Sí, con el nivel «resumen y plan» |

Un caso queda en no hasta que lo valide lo legal: el tipo de objetivo nutricional, sin números, para el entrenador.
Nunca viajan los borradores, las notas internas ni las versiones anteriores. El plan completo viaja «todos con todos,
con permiso» (Dirección, 2026-11-07, TA-87): cada área ve el plan de las otras dos, siempre con el nivel «resumen y plan»
que la persona elige para ese profesional. La revisión legal es una condición antes de datos reales, no antes de
programar. Ni el
resumen ni el plan tienen un botón que escriba, salvo «Dejar una nota», ni entran como evidencia de una revisión propia.

### 3.2 Lo que otro paquete mandó acá y no tiene parte todavía

WP-FORMULARIOS-RONDA-2 (DL-165 D-8) dejó para este paquete «la tarjeta de las respuestas en el Resumen («Lo que contó al
empezar»)». La propuesta no le daba una parte. Con el sí al alcance, Dirección la sumó a la etapa A como TB-49.

### 3.3 Lo que sumó Dirección el 2026-11-07

Al ver la galería de capturas de la etapa A, Dirección dijo que «ahora es aceptable» y pidió no integrarla hasta sumar
esto, con sus palabras: «Agregaría la evolución o la imagen de la evolución de la antropometría dentro del resumen del
usuario. Podría ser una combinación de tomas importantes, y hasta se podría sumar una evolución de pliegues y
circunferencias. Por ejemplo, que se vea al mismo tiempo tomas de cintura y pliegue abdominal, y así en 3 o 4 tomas,
para rápidamente interpretar cómo avanza el resultado físico. Y serviría también la barra de porcentaje de peso,
separado en grasa, músculo y el resto. A eso me refiero con que hagamos buenos gráficos que resuman la información.»

- **TB-50, la evolución de las últimas tomas.** Va en la tarjeta de Antropometría del Resumen, de la misma lectura.
- **TB-51, la barra.** Dirección eligió, por pregunta, «Kilos con el % al lado»: la barra va en kg, partida en grasa,
  músculo y resto, con el porcentaje escrito junto a cada parte. «Músculo» va solo cuando el método lo calcula; si no,
  «libre de grasa». Sin colores de bueno o malo. Modifica D-11 («sin «%» en el Resumen»): DL-163 lo dice como «D-11,
  modificada por Dirección el 2026-11-07 (kilos con el % al lado)». De los dos métodos que nombró Dirección, De Rose y
  Guimarães (con Faulkner y Würch) salió del catálogo para cálculos nuevos con DL-112 (2026-10-01): la barra lo lee en
  las tomas que ya lo tienen, y para una toma nueva el músculo sale de Lee con perímetros (TA-79).
- **Lo que no hace falta:** el «Lic.» no es obligatorio; alcanza con el nombre. Verificado: el website no antepone un
  título fijo en ningún lado (el saludo y las iniciales ya los saltean, TB-05 y TB-06), y no se agrega. Los nombres de la
  cohorte que lo traen son datos y quedan como están.

Las decisiones de la implementación son TA-73 a TA-84 (§10.1), a ratificar.

### 3.4 D-13, ampliada por Dirección el 2026-11-07: el plan del otro y los comentarios

Con sus palabras: «el nutricionista debería poder ver el resumen y hasta la planificación, y poder dejarle comentarios
al otro profesional». Eligió, por pregunta, «Sí, plan completo de solo lectura». D-13 había descartado «compartir el
plan completo»; ahora entra, siempre con el permiso de la persona.

- **TB-52 · El plan del otro, completo y de solo lectura,** con el objetivo y lo avanzado.
- **TB-53 · Los comentarios son notas de coordinación** (DL-140), que ya existen: tienen autor, destinatarios
  guardados, lo citado, solo se agregan, llegan como novedad sin el texto (`COORDINATION_NOTE_RECEIVED`) y la persona
  las lee. No hay un chat nuevo: UC-E07 dice que «no existe chat general».
- **TB-54 · El panel «Otras áreas»,** a la vista al planificar y al revisar.
- **TB-55 · El permiso de la persona, por área y por nivel,** con su texto y la revisión legal antes de datos reales.

**Lo que se diseñó contra el código:**
- **La autorización:** la lectura no depende del Alcance del profesional en el área de origen. Va como los hábitos que
  la persona comparte (DL-165 D-9, API-HBT-05): `PdpService.decidirAlgunAlcanceEnTransaccion` decide los tres alcances
  del par en la transacción de la lectura, con el vínculo vigente (ni en pausa ni terminado), el B2, las cuentas y el A3,
  sin caché (08 §27.3). Además pide la autorización vigente de la persona que nombra a ese profesional, esa área y el
  nivel, y la fila de la matriz. Sin cualquiera de las tres, el mismo 404 que lo inexistente.
- **Los comentarios:** API-CRD-01 no cambia de forma. Lo único que cambia es una regla de CRD-D5 («lo citado, solo del
  área de origen del autor y suyo»): también se puede citar la versión del plan que el autor ve por API-RES-06 al
  escribir. El tipo de referencia ya existe, así que la nota que lee la APK (API-CRD-01-PROPIA, «Notas entre tus
  profesionales») tiene la misma forma. La novedad y el destinatario son los de siempre.
- **Las lecturas congeladas (DL-152):** las operaciones nuevas son de la familia RES y solo las llama el website, o una
  candidata de la APK (TB-28 y TB-55). TEST-TAG-030 sigue verde y suma un caso: una nota que cita el plan de otra área,
  leída con API-CRD-01-PROPIA, tiene la forma de siempre.
- **La API va en la rama del #243,** que todavía no se toca. Nada de esto está programado.

Las decisiones son TA-85 a TA-95 (§10.1), a ratificar.

**Lo que respondió Dirección el 2026-11-07:**
- **TA-87: «todos con todos, con permiso».** La tabla del plan completo es simétrica: cada área puede ver el plan de las
  otras dos, siempre con el permiso de la persona, por profesional y por nivel. La revisión legal (§9) es una condición
  antes de datos reales, no antes de programar: en `test` hay solo datos sintéticos. Las dos preguntas legales siguen.
- **TA-95: sí, como en los hábitos.** El profesional puede pedir ver el plan del otro (TB-56): una novedad «Importante»
  con quién y para qué; la persona elige sí o no, y puede cambiarlo siempre. Reusa el pedido de los hábitos (DL-165 D-17),
  con su reenvío a los 7 días.
- **TA-79: ratificada** (la barra con los dos métodos escritos).
- Las demás (TA-73 a TA-78, TA-80 a TA-86 y TA-88 a TA-94) quedan con la recomendación, a ratificar.
- Pidió programar TB-52 a TB-56: la API en la rama del #243 y el website en esta.

## 4. Las operaciones nuevas

Lo nuevo va en operaciones nuevas (DL-137 D-7), y nada de lo que leen las APK instaladas cambia de forma (DL-152).

- **Dos son del 09 y nunca se implementaron:** API-DSH-01 y API-DSH-02, con el método y la ruta que les da el 09 (v0.11
  §13 y §14). La guardia de trazabilidad (DL-116, `scripts/trazabilidad-de-operaciones.test.cjs`) los compara.
- **Las demás van en siete familias propias de BE:** PRG, RES, PLN, PLE, ESF, PCA y RET. Se revisaron contra las
  familias del 09 (ACC, ANT, CAL, CON, CRD, DSH, EXP, FRM, MTH, NUT, PRJ, PRO, REL, RGT y TRN, más INT), contra
  `FAMILIAS_DE_BE` de la guardia (TPL, TPN, HAB, HAN, CAR, REC, MED, ING, SER, EJE, TIE, EVI, VAN, NOV, INV, AGE, GOO,
  ADM, ZON, FRI y HBT) y contra las ramas sin integrar: ninguna choca. HAB es «Mis habituales» y HBT, los hábitos.
- **Cada familia se suma a `FAMILIAS_DE_BE`, con DL-163, en el PR de su primera operación.** Las rutas son la propuesta:
  si una cambia al programar, cambia acá en el mismo PR, antes del código.
- **Las reglas de siempre:** las escrituras llevan `Idempotency-Key`, auditoría, decisión del PDP y evento; las que
  tocan un borrador piden la versión esperada y responden el conflicto de versión de hoy. Lo ajeno responde el mismo 404
  que lo inexistente. Cada lectura pasa por el PDP, sin caché de autorización (08 §27.3).

### 4.1 Del 09: el panorama y la cola de revisiones

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-DSH-01 | `GET /me/caseload` | El profesional | El panorama de su cartera (D-8): todas sus personas, también las que están al día; por persona y área, el plan vigente, la última revisión y la próxima acordada a cualquier distancia, con los pendientes de API-CAR-01 adentro. Recortada: sin la disponibilidad de datos de cada área, y nada se ordena, filtra ni marca por actividad. «Nueva evidencia disponible», solo junto a una revisión vencida, próxima o sin aplicar | TB-18 |
| API-DSH-02 | `GET /me/review-queue` | El profesional | La cola de revisiones (D-6), con la definición de pendiente del dominio de revisión: «Próxima acción pendiente» (`NEXT_ACTION_PENDING`), primera, y «Sin revisión acordada» (`ACTIVE_PLAN_WITHOUT_REVIEW`), última. Abrirla no resuelve nada | TB-14 |

### 4.2 PRG · los programas de cada profesional (la D-9 nueva)

Solo para el profesional; la APK no las lee hasta una candidata. Un hito queda «Listo» solo con el acto que dice el
programa: la evaluación registrada, la toma registrada, el plan activado, la revisión aplicada o «Lo marco yo». Nunca
con lo que registra la persona.

| ID | Método y ruta | Qué hace | Parte |
|---|---|---|---|
| API-PRG-01 | `GET /programs` | Lista los programas propios, con la versión vigente de cada uno | TB-33 |
| API-PRG-02 | `POST /programs` | Crea un programa: nombre, semanas y, por semana, su nombre y sus hitos (el área y el acto que lo cierra) | TB-33 |
| API-PRG-03 | `POST /programs/{programId}/versions` | Una versión nueva: quien ya empezó sigue con la suya | TB-33 |
| API-PRG-04 | `POST /advisees/{adviseeId}/program-runs` | Empieza un recorrido con una persona: la versión del programa y el inicio | TB-33 y TB-46 |
| API-PRG-05 | `GET /advisees/{adviseeId}/program-runs` | El recorrido de esa persona: la semana, cada hito con su fecha prevista y el acto que lo cerró, por referencia (el marco de la ficha y «¿Cuándo la revisás?») | TB-33 |
| API-PRG-06 | `GET /me/program-milestones` | Los hitos de sus personas en un rango de fechas, para «Tu semana» | TB-33 |
| API-PRG-07 | `POST /program-runs/{runId}/milestones/{milestoneId}/completion` | «Lo marco yo»: un acto del profesional, con su fecha, para lo que BE no registra (una devolución, por ejemplo) | TB-33 |
| API-PRG-08 | `POST /program-runs/{runId}/end` | Termina o interrumpe el recorrido. Al terminar, la persona sigue con su próxima revisión y no vuelve a la cola como «Sin plan activo» | TB-33 |

### 4.3 RES · los resúmenes que comparte la persona (D-13)

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-RES-01 | `GET /me/summary-sharing` | La persona | Lo que comparte, con quién, desde cuándo y los accesos | TB-27 y TB-28 |
| API-RES-02 | `PUT /me/summary-sharing` | La persona | Compartir un área con un profesional, con la versión del texto que acepta. Desde TB-55, con el nivel: `SUMMARY` o `SUMMARY_AND_PLAN`; subir de nivel pide aceptar de nuevo | TB-27, TB-28 y TB-55 |
| API-RES-03 | `POST /me/summary-sharing/withdrawal` | La persona | Dejar de compartir, uno o todos a la vez | TB-27 y TB-28 |
| API-RES-04 | `GET /advisees/{adviseeId}/shared-summaries` | El profesional | Los resúmenes que la persona le comparte, armados con la matriz vigente. Sin nada compartido, la lista vacía, que no revela nada | TB-27 y TB-29 |
| API-RES-05 | `GET /advisees/{adviseeId}/shared-summaries/{area}/series` | El profesional | Las series de un resumen para «Analizar», en las fechas que se piden | TB-29 |
| API-RES-06 | `GET /advisees/{adviseeId}/shared-summaries/{area}/plan` | El profesional | El plan vigente del área compartida, con el nivel «resumen y plan»: la instantánea de la versión activada (la forma de la lectura del plan de esa área), el objetivo vigente, el autor, desde cuándo rige, la fecha de la próxima revisión y lo avanzado que admite la matriz. Sin plan vigente, `{ data: null }` | TB-52 y TB-54 |
| API-RES-07 | `GET /advisees/{adviseeId}/shared-summaries/outgoing` | Quien lleva el área | Con quién se comparte lo de su área con esa persona, en qué nivel y desde cuándo. Sin nada, la lista vacía | TB-52 |
| API-RES-08 | `POST /advisees/{adviseeId}/shared-summaries/access-requests` | El profesional | Pedir ver el plan de un área que no lleva, desde su área, con `Idempotency-Key`. Uno por vez; otro, a los 7 días del último sin respuesta o con «No, por ahora» | TB-56 |
| API-RES-09 | `GET /me/summary-sharing/access-requests` | La persona | Los pedidos que esperan su respuesta, con quién pide, desde qué área y qué área | TB-56 |
| API-RES-10 | `POST /me/summary-sharing/access-requests/{accessRequestId}/answer` | La persona | «Sí, que lo vea» (comparte el área en el nivel «resumen y plan», con el texto que acepta) o «No, por ahora» | TB-56 |

El profesional no lo pide desde el escritorio: el 08 no admite autorizaciones que un profesional pida y obtenga dentro
del producto (§11-bis.2). Las lecturas piden el vínculo vigente (ni en pausa ni terminado) y quedan en la auditoría que
la persona ve. Quien lleva el área ve con quién se comparte un resumen de su área y desde cuándo.

### 4.4 PLN · planificar Nutrición (D-17, D-18, D-20 y D-21)

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-PLN-01 | `GET /nutrition/plans/{planId}/option-estimates` | El profesional del plan | La estimación de cada opción para las porciones del plan, la misma cuenta que ve la app, con lo que falta; sin total del día | TB-38 |
| API-PLN-02 | `GET /nutrition/plans/{planId}/ranges` | El profesional del plan | Los rangos por día tipo y por comida, en g o en g por kg, con los gramos y la toma de la que salen | TB-39 y TB-40 |
| API-PLN-03 | `PUT /nutrition/plans/{planId}/ranges` | El profesional del plan | Escribe los rangos de un borrador. Ninguno es obligatorio | TB-39 |
| API-PLN-04 | `GET /nutrition/plans/{planId}/day-type-weekdays` | El profesional del plan | A qué días de la semana aplica cada día tipo, con su procedencia | TB-41 |
| API-PLN-05 | `PUT /nutrition/plans/{planId}/day-type-weekdays` | El profesional del plan | Los escribe en un borrador: un día de la semana, en un solo día tipo | TB-41 |
| API-PLN-06 | `GET /me/nutrition/today/day-type` | La persona | El día tipo de hoy según los días marcados, para que la app lo proponga con el selector; sin días marcados, no propone nada | TB-42 |
| API-PLN-07 | `POST /nutrition/plans/{planId}/discard` | El profesional del plan | Descarta un borrador que nunca se activó | TB-47 |

Los rangos y los días entran en la instantánea al activar, con la activación de hoy (API-NUT-12), que no cambia de
forma. La propuesta de los días con sesión sale de la agenda de Entrenamiento que ya lee quien lleva las dos áreas, o
del resumen compartido (API-RES-04).

### 4.5 PLE · planificar Entrenamiento (D-19 y D-21)

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-PLE-01 | `GET /training/plans/{planId}/weeks` | El profesional del plan | El orden de las semanas del bloque (cada microciclo en su semana, desde el «Empieza el» de la agenda), con su nombre, su propósito y qué día va cada sesión de la semana | TB-43 |
| API-PLE-02 | `PUT /training/plans/{planId}/weeks` | El profesional del plan | Escribe ese orden y la agenda por sesión de la semana en un borrador | TB-43 |
| API-PLE-03 | `POST /training/plans/{planId}/week-copies` | El profesional del plan | «Copiar la semana»: duplica un microciclo del borrador con sus sesiones, sus ejercicios y sus series | TB-43 |
| API-PLE-04 | `GET /me/training/week` | La persona | La semana que toca («Semana 2 de 4 · Carga») y sus sesiones, solo para una app que declara la capacidad nueva en `X-BE-Capabilities`, como `training-set-targets-1` (DL-122) | TB-44 |
| API-PLE-05 | `POST /training/plans/{planId}/discard` | El profesional del plan | Descarta un borrador que nunca se activó | TB-47 |

«Ajustar la semana» no es una operación: escribe valores en el borrador con la edición de hoy, que el profesional ve y
cambia antes de guardar; no queda una regla guardada. Activar un plan con semanas (API-TRN-12) responde el 409
`CLIENT_CAPABILITY_REQUIRED` que ya existe si la persona no tiene una app que las entienda. «Lo que trabaja la semana»
(TB-38) se cuenta en el dominio con el plan y las zonas que ya se leen (API-EJE-05, por lote); si al programar hace
falta una lectura, va en esta familia, como TA-.

### 4.6 ESF · el esfuerzo de la sesión (D-16)

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-ESF-01 | `PUT /training/executions/{executionId}/session-effort` | La persona | Registra o cambia el esfuerzo de una sesión propia confirmada, de 0 a 10 con palabras. Es opcional; cada cambio es una fila nueva | TB-35 |
| API-ESF-02 | `GET /advisees/{adviseeId}/training/session-efforts` | El profesional de Entrenamiento | El esfuerzo de cada sesión del período y la carga interna (esfuerzo × minutos), solo cuando la duración se midió | TB-35 y TB-45 |

### 4.7 PCA · el peso en casa (D-16, después del piloto)

Se confirman al abrir la parte, con su línea en el inventario del 08 (§9).

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-PCA-01 | `PUT /advisees/{adviseeId}/home-weight-setting` | El profesional | Habilita o deshabilita «Me pesé» para esa persona | TB-37 |
| API-PCA-02 | `POST /me/home-weights` | La persona | Registra un peso, como medición reportada | TB-37 |
| API-PCA-03 | `GET /me/home-weights` | La persona | Los pesos que registró | TB-37 |
| API-PCA-04 | `GET /advisees/{adviseeId}/home-weights` | El profesional | La serie reportada, aparte de las tomas y nunca unida a ellas | TB-37 |

### 4.8 RET · la foto del profesional (D-2, etapa B)

| ID | Método y ruta | Quién | Qué hace | Parte |
|---|---|---|---|---|
| API-RET-01 | `PUT /me/portrait` | El profesional | Pone o reemplaza su foto, subida con API-MED-01 y la finalidad nueva RETRATO: se guarda solo una miniatura cuadrada, y los bytes de la anterior se borran en la misma transacción | TB-23 |
| API-RET-02 | `DELETE /me/portrait` | El profesional | La quita: vuelven las iniciales | TB-23 |
| API-RET-03 | `POST /portraits/lookup` | Quien ya ve el nombre | Las fotos de una lista de identidades, con la regla del nombre visible (DL-040) y un solo consumo del cupo. Nunca un campo nuevo en lo que ya leen las APK | TB-23 |

## 5. Los datos

Todas las migraciones solo agregan: las tablas de historia, con los triggers `be_solo_agregar`, y cada enum nuevo en su
migración propia. Nada se crea antes del sí al alcance.

- **Sin datos nuevos:** TB-01 a TB-12, TB-15, TB-16, TB-24, TB-25, TB-30, TB-32, TB-38, TB-45, TB-46, TB-49, TB-50 y
  TB-51 leen lo que ya existe. «Ocultar nombres» y la elección de la vista se recuerdan en el navegador, sin datos de personas. TB-14, TB-18
  y las claves de API-PRJ-01 (TB-31 y TB-34) calculan sobre lo que hay.
- **La matriz de lo que se comparte (TB-26):** una tabla de configuración (área de origen, área de quien recibe,
  categoría, permitido y detalle), versionada y auditada, que carga Dirección por acta.
- **Los resúmenes compartidos (TB-27):** una tabla de solo agregar, como la de los hábitos (DL-165): la persona, el
  profesional que lo recibe, el área compartida, el estado (activa o retirada), la versión del texto que aceptó, cuándo
  lo dio y cuándo lo retiró. Cada cambio es una fila nueva. El texto del acto, una versión propia del catálogo de
  textos, marcada como propuesta pendiente de validación jurídica (como DL-125 y DL-165 D-19).
- **Los programas y los recorridos (TB-33):** el programa es del profesional (nombre, versiones, semanas e hitos:
  semana, nombre, área y el acto que lo cierra), sin nada de la persona. El recorrido es el programa aplicado a una
  persona: la persona, el profesional, la versión, el inicio, el estado (en curso, terminado o interrumpido) y cada hito
  con su fecha prevista y el acto que lo cerró, por referencia.
- **Los rangos de Nutrición (TB-39):** por versión del plan, día tipo y, si se quiere, comida: cada macro y las
  calorías, con mínimo y máximo, en g o en g por kg. Entran en la instantánea al activar; lo de una versión activada no
  se cambia.
- **Los días de cada día tipo (TB-41):** por versión y día tipo, los días de la semana y su procedencia (los marcó el
  profesional o confirmó la propuesta de la agenda).
- **Las semanas del bloque (TB-43):** por versión, el orden de cada microciclo en el tiempo (la semana 1 es la del
  «Empieza el» de la agenda) y la agenda por sesión de la semana, que vale para todas.
- **Descartar un borrador (TB-47):** un estado terminal de la versión, «descartada», solo para una que nunca se activó,
  con quién y cuándo. Lo descartado no se muestra; si se guarda o se borra lo decide TA- al programar, con la auditoría
  como piso.
- **El esfuerzo de la sesión (TB-35):** por ejecución confirmada, de 0 a 10, con quién y cuándo.
- **El peso en casa (TB-37):** una medición de clase «reportado», en su propia serie (la clase y el origen ya existen en
  `contratos-antropometria.ts`), y la habilitación por persona.
- **La foto del profesional (TB-23):** una finalidad de medio nueva, RETRATO, y una asociación de solo agregar. Se
  guarda solo la miniatura.
- **La cohorte (TB-24):** a las tomas de Diego, Camila y Héctor se les aplican las masas de Durnin y Womersley. Es un
  cambio de datos sintéticos en la herramienta de la cohorte, no una migración.
- **La cohorte (TB-51):** a las tomas de Federico se les aplican las masas de Durnin y Womersley y la masa muscular
  esquelética de Lee con perímetros, con el perímetro del brazo relajado sacado del flexionado de cada toma, sin azar
  (TA-84). También es un cambio de datos sintéticos.
- **Lo que se decide al programar:** si las plantillas (DL-108) guardan los rangos y las semanas, sin cambiar las
  operaciones de plantillas (TB-46, como TA-).

## 6. Oráculos a escribir

Se escriben con sus trece campos, como los de `WP-FORMULARIOS-DE-INICIO-ORACULOS.md`, en
`WP-TABLERO-ALTA-GAMA-ORACULOS.md`, antes del código de cada parte. Cada comprobación negativa («la pantalla no dice X»)
tiene su mutación, como E-06 y E-16 de WP-ESCRITORIO-AMABLE.

- **TEST-TAG-001 · La barra del reloj no se mueve con lo que registra la persona** (D-1; TB-10 y TB-33).
  `avanceDelReloj`, prueba de propiedad: con las mismas fechas que acordó el profesional y registros distintos, la barra
  es la misma. Sin fecha acordada no hay barra; al vencer, sigue en discontinua neutra y lo dice.
- **TEST-TAG-002 · Las barras se dicen en palabras** (D-1). Toda barra con `role="progressbar"` lleva `aria-valuetext`
  en palabras, sin «%» ni «por ciento».
- **TEST-TAG-003 · Las iniciales salen del nombre visible y nunca se inventan** (D-2; TB-05). `inicialesDe`: títulos,
  partículas, tildes, una sola palabra, emojis y la referencia neutral, que lleva el ícono «persona».
- **TEST-TAG-004 · «Ocultar nombres» no deja pasar un nombre** (TB-05). El recorrido por el Espacio, el Resumen y el
  cajón falla si aparece un nombre o una inicial, también en el título de la pestaña; el cierre de la cola, con
  referencias.
- **TEST-TAG-005 · Cada token nuevo, con su par** (D-2, D-3 y D-11). En `contraste.test.cjs`: `--ahora`, `--pista`,
  `--banda`, `--retrato-fondo`, `--retrato-tinta`, `--composicion-libre` y `--composicion-grasa`; las métricas y las
  iniciales contra `--ahora`, con ΔE de 20 o más; las métricas sobre `--banda`, 3:1; `--banda` y `--pista`, 1,3:1 como
  mínimo.
- **TEST-TAG-006 · La gramática de las marcas** (D-3; TB-02 y TB-03). En `geometria-del-minigrafico.test.mjs`: cada
  marca con estado tiene su mínimo, el lleno se distingue del hueco y ningún punto queda fuera del lienzo.
- **TEST-TAG-007 · El minigráfico no esconde días** (D-5; TB-04). Con poco lugar por día, cada día tiene su celda en la
  tira con su estado; el último, el elegido y los aislados tienen marca; la línea se corta en los días sin registros y
  en los huecos; con más lugar, todo día tiene marca. La muesca de fuera de escala no ubica valores.
- **TEST-TAG-008 · El orden de «Te toca a vos» sale de DL-107** (D-4; TB-11). Las personas, por su pendiente más urgente
  según `compararPendientes`; los renglones de cada una, en ese orden; «Por pendiente», exactamente el orden de DL-107;
  el cajón sigue la vista elegida. Se agrupa por `identityId`, nunca por nombre.
- **TEST-TAG-009 · El cajón lee y no escribe** (D-4; TB-12). Saltear no escribe; Enter nunca dispara una escritura; el
  foco va al título de la pregunta y vuelve adonde estaba; el retorno guarda identificadores, sin nombres; la pregunta
  sale de lo que se lee al abrir, una por cada fila de la cartera; el cierre no tiene cuentas, festejos ni tachados.
- **TEST-TAG-010 · La acción del momento sigue la cadena** (TB-09). Un caso por eslabón: aplicar, la revisión acordada,
  el borrador y empezar, incluida una revisión registrada sin aplicar.
- **TEST-TAG-011 · La divergencia y el seguimiento finalizado** (D-6; TB-13; integración). Una revisión aplicada como
  «Mantener» sin fecha nueva no sigue como vencida, y un seguimiento finalizado no vuelve como «Sin plan activo».
- **TEST-TAG-012 · La cola de revisiones, con sus dos estados** (D-6; TB-14; integración). API-DSH-02 trae
  `NEXT_ACTION_PENDING` primero y `ACTIVE_PLAN_WITHOUT_REVIEW` último, con la definición de pendiente del dominio de
  revisión; abrirla no resuelve nada; API-CAR-01 no cambia; sin la operación desplegada, el website muestra la mesa sin
  esas filas.
- **TEST-TAG-013 · Aplicar desde el cajón es aplicar** (D-6; TB-15; integración). Con la operación de Revisiones: el
  mismo `Idempotency-Key` no aplica dos veces y una versión vieja da el conflicto de siempre.
- **TEST-TAG-014 · El período de la persona nueva** (D-7; TB-16). Con un vínculo de menos de 90 días, el período arranca
  en el más antiguo y lo dice; lo anterior al vínculo de cada área no se dibuja; con uno a tres días con valor no hay
  línea ni media; la ficha de la cohorte no cambia.
- **TEST-TAG-015 · El panorama no dice nada de quien no tiene una revisión pendiente** (D-8; TB-18; integración). En
  API-DSH-01, un área sin revisión vencida, próxima o sin aplicar no lleva ninguna marca de registros; los conteos son
  los de la ficha (`conteosDesde`); con 200 personas, medido en Render, no es más lento que hoy.
- **TEST-TAG-016 · El anillo, solo con la proporción declarada** (D-10; TB-22). Con los macros en gramos no se dibuja;
  va sin «%» y nunca junto a lo registrado.
- **TEST-TAG-017 · La composición no mezcla métodos** (D-11; TB-24 y TB-51). Nunca se parte una columna con métodos
  distintos ni con un método que no suma el peso; un cambio de método corta las diferencias; una toma con solo peso va en
  contorno. Desde TB-51, la barra de la última toma: sus partes suman el peso, el porcentaje es de ese peso, «Músculo»
  sale solo de un método que lo calcula y dos tomas se comparan solo si se reparten igual.
- **TEST-TAG-018 · Los indicadores salen de las áreas del profesional** (D-12; TB-25). Sin nada guardado, los cuatro de
  sus áreas; con algo guardado por la cuenta, lo guardado.
- **TEST-TAG-019 · La semana del programa sale de las fechas** (D-9 nueva; TB-33). Prueba de propiedad: ningún registro
  de la persona cambia una semana ni un hito; un hito queda «Listo» solo con el acto que dice el programa; sin programa
  no hay barra; T13 y la prueba de términos corren sobre los nombres que escribe el profesional.
- **TEST-TAG-020 · La matriz manda, y sin fila es no** (D-13; TB-26). Los casos permitidos y negados de §3.1; con dos
  áreas, la unión, jamás más; una ampliación no se ve hasta que la persona acepta de nuevo (A-5 del 08).
- **TEST-TAG-021 · Compartir un resumen lo decide la persona** (D-13; TB-27 y TB-29; integración). Sin nada compartido,
  API-RES-04 da la lista vacía; con el vínculo en pausa o terminado, se corta, como cualquier lectura del PDP; cada
  lectura queda en la auditoría que ve la persona; quien se vincula después no lo recibe solo; retirar corta en el
  momento.
- **TEST-TAG-022 · El mapa ubica, y las molestias no viajan** (D-14; TB-30 a TB-32). Ningún sitio cambia de color por su
  valor; las molestias no aparecen ni se nombran para quien no lleva Entrenamiento ni en un resumen compartido.
- **TEST-TAG-023 · Las series por zona y el volumen, con su especificación** (D-15; TB-31 y TB-34). Una serie por cada
  zona de su ejercicio, por rol y sin ponderar, con la secundaria aparte; el volumen, por ejercicio y por semana, nunca
  sumando ejercicios; las series sin carga o sin repeticiones quedan afuera y se cuentan; no se convierte kg en lb.
- **TEST-TAG-024 · El esfuerzo de la sesión es opcional** (D-16; TB-35). Sin respuesta no hay valor; la carga interna
  aparece solo con la duración medida; no hay derivados de riesgo ni de fatiga.
- **TEST-TAG-025 · Los rangos ubican y no se suman** (D-17; TB-39 y TB-40). Ninguna marca cambia de color por caer
  afuera; las opciones nunca se suman como un total del día; «Usar lo que cubren como rango» escribe solo al tocarlo; en
  g por kg, el peso es el de la última toma y se dice su fecha; la persona no ve los rangos.
- **TEST-TAG-026 · Un día de la semana, un solo día tipo** (D-18; TB-41 y TB-42). Un mismo día de la semana no queda en
  dos días tipo; sin días marcados, la app sigue como hoy y nunca elige en silencio.
- **TEST-TAG-027 · Las semanas salen del calendario** (D-19; TB-43 y TB-44). Prueba de propiedad: con las mismas fechas,
  la semana es la misma, registre lo que registre la persona; «Ajustar la semana» escribe solo lo pedido y solo en la
  semana elegida; activar un plan con semanas pide una app que las entienda.
- **TEST-TAG-028 · Lo planificado se dice como planificado** (D-20; TB-38). La estimación de cada opción es la misma
  cuenta que ve la app y dice qué falta; las series planificadas por zona no tienen mínimos ni un ideal, y nunca van al
  lado de lo registrado.
- **TEST-TAG-029 · Una versión activada no se descarta nunca** (D-21; TB-47; integración). Descartar un borrador nunca
  activado deja auditoría y evento, y libera «Empezar desde una plantilla» y la aplicación de una revisión; con una
  versión activada, el rechazo.
- **TEST-TAG-030 · Lo que leen las APK instaladas no cambia** (DL-152). En cada parte que toca la API,
  `lecturas-de-las-apk.int-spec.ts` sigue verde, y la guardia de trazabilidad pasa con las familias nuevas.
- **TEST-TAG-031 · Los textos nuevos pasan las listas de términos.** T13 y la prueba de términos de la cartera
  (`cartera.ts`) corren sobre todo texto nuevo, también los que viven en `apps/web` hasta TB-20. En Antropometría se
  dice «toma», y no aparecen diagnóstico (salvo «no es un diagnóstico», que pide RF-048), peso ideal, sobrepeso, normal,
  puntaje, mejor ni peor. El «%», solo donde lo admite T13: el cambio relativo de Analizar y, desde TB-51, el de cada
  parte de la barra de la composición.
- **TEST-TAG-032 · Los guardianes.** Las herramientas de captura cuentan las peticiones a la API al abrir /pro, el
  Resumen y el cajón, y fallan si suben sin aviso; la primera pantalla se mide a 1280 × 800, a 1440 × 900 y a 1920 × 950
  (el área útil de un monitor de 1920 × 1080).
- **TEST-TAG-033 · «Lo que contó al empezar» ubica lo declarado y no lo califica** (DL-165 D-8; TB-49). Solo las
  respuestas vigentes de las solicitudes que pidió ese profesional, cada una con su fecha y su procedencia; abre la
  solicitud; sin cuentas, sin puntajes y sin ningún botón que escriba; sin solicitudes respondidas no hay tarjeta.
- **TEST-TAG-034 · «¿Cuándo la revisás?» no viene elegida y dice lo que deja** (D-6; TB-15). Se suma con TB-15: la
  pregunta no tenía oráculo propio. Sin nada elegido no hay fecha y falta elegir, también «Sin fecha por ahora»; cada
  opción dice la fecha que resulta, contada desde hoy, y su efecto en el acto que la fija; con «Reprogramar revisión» no
  hay «Sin fecha por ahora», y con «Finalizar» no se pregunta; sale solo de fechas del profesional.
- **TEST-TAG-035 · Volver al Espacio, donde estabas** (D-4; TB-07 y TB-12). Se suma con lo que le faltaba a TB-07. El
  lugar guarda identificadores, nunca nombres, y solo un lugar reciente se retoma; al volver, el foco va a lo que se
  abrió o, si ya no está, a lo que seguía; cada ficha, cada verbo y cada salida del cajón llevan el retorno; el lugar se
  lee antes que la cartera.
- **TEST-TAG-037 · El plan del otro, solo con el permiso de la persona** (D-13, ampliada; TB-52 y TB-55; integración).
  Sin autorización, con el nivel «resumen» o sin fila en la matriz, API-RES-06 da el 404 de lo inexistente. Con «resumen
  y plan», la instantánea de la versión activada, nunca un borrador, una versión anterior, una revisión ni una nota.
  Retirar o bajar de nivel corta en el momento; subir pide aceptar de nuevo; con el vínculo del que lee en pausa o
  terminado, corta. Cada lectura queda en la auditoría que ve la persona, y quien lleva el área ve con quién se comparte.
- **TEST-TAG-038 · Comentar no da escritura** (D-13, ampliada; DL-140; TB-53; integración). Una nota puede citar el plan
  compartido solo si el autor lo ve por API-RES-06 al escribirla; la cita no se lo abre a nadie más (UC-E07); la nota no
  cambia el plan; la persona la lee, y API-CRD-01-PROPIA responde la forma de siempre (DL-152).
- **TEST-TAG-039 · El panel «Otras áreas» aparece solo con algo compartido** (D-13, ampliada; TB-54). Sin nada
  compartido, no hay panel, candado ni aviso; abrir el editor o la revisión no suma peticiones (se lee al abrir el panel);
  nada del panel escribe salvo «Dejar una nota»; lo avanzado va en cifras, sin «%» ni juicios (T13).
- **TEST-TAG-040 · Pedir no concede nada** (TA-95; TB-56; integración). Un pedido no abre el plan hasta que la persona
  dice que sí; uno por vez y otro recién a los 7 días; «No, por ahora» no comparte; compartir desde «Quién ve qué» acepta
  el pedido que esperaba; con el vínculo en pausa o terminado, no se pide ni se muestra; la novedad no lleva nada del plan.
- **TEST-TAG-036 · La evolución de las últimas tomas ubica en pares y no mezcla lo que no se compara** (pedido de
  Dirección del 2026-11-07; TB-50). Se suma con TB-50. Las columnas son las últimas tomas con medidas, alineadas en todas
  las filas; kilos con kilos (la misma vara por unidad, nunca menos que su mínimo); la línea no cruza un cambio de
  protocolo ni un hueco, y la diferencia no lo cruza; lo no medido y lo no comparable se dicen; sin «%» ni juicios.

**La evidencia,** en `EVIDENCIA/TABLERO-ALTA-GAMA/`:
- las capturas de antes y de después, en Claro y Azul noche, a 1440 y a 1920; a 1280 y a 1024 se revisa la composición,
  y a 768 y a 390, que no haya desplazamiento lateral;
- a densidad 1: a 1920 × 1080 al 100 %, y una pasada en un proyector o en un monitor de densidad simple, donde se
  comprueba que `--banda` y `--pista` se siguen viendo;
- con la cohorte, regenerada antes de capturar (`node cargar.mjs local resumen`, con las cuentas de cada pieza que
  cierran entre sí), y con una cuenta recién creada para los vacíos;
- las mediciones de la primera pantalla y de las lecturas, los recorridos y la prueba con profesionales (TB-21).

**La accesibilidad:** J, K, S y Escape, solo con el foco adentro del cajón; Enter nunca dispara nada que escriba; el
monograma es decorativo; las barras llevan su frase; cada gráfico tiene su tabla equivalente; la descripción del
minigráfico no cambia; `prefers-reduced-motion`; WCAG 1.4.13 en las etiquetas flotantes y el contraste de cada par.

## 7. Fuera de alcance

- **La foto de las personas,** hasta su alta en el inventario del 08 y después del piloto. La del profesional va en
  TB-23.
- **Un programa de BE para todos:** cada profesional declara los suyos (TB-33).
- **Los resúmenes compartidos con personas reales,** hasta lo legal y el gate del 08 §42 (§9).
- **Las fotos de progreso y la bioimpedancia** (D-16), hasta su DL.
- **Los intercambios de Nutrición** (la modalidad B del 06, REG-06-120), hasta su propia DL.
- **Un esfuerzo previsto en el plan:** el legajo admite el esfuerzo percibido solo como dato de lo realizado.
- **Las alternativas previstas de un ejercicio:** la sustitución sigue siendo un hecho de lo realizado (REG-06-130).
- **Una operación aparte para fijar la próxima revisión:** la fecha se elige dentro de la revisión o al activar.
- **Una regla de progresión guardada,** que BE aplique sola, y cambiar una carga por lo que registró la persona: lo
  activado no se mueve.
- **Que BE escriba el rango, la carga o la plantilla:** las ayudas copian o ajustan solo cuando el profesional las toca
  (INV-06-133).
- **Mostrarle a la persona los rangos,** o si su comida «entró».
- **La TVCC-30 en una pantalla,** o cualquier tasa de ciclos «a tiempo» (DL-135 D-8), y las cuentas de lo que hizo el
  profesional.
- **La actividad agregada de la cartera:** ni gráficos por día, ni personas «con» o «sin» registros, ni orden por
  actividad.
- **Ningún anillo sobre datos de la persona,** tampoco el del porcentaje de grasa, y ningún aro alrededor de la cara.
- **Color por tipo de pendiente, por área o por persona,** y valores de salud en la cartera.
- **Puntajes que sumen escalas,** la relación aguda:crónica o un «riesgo de lesión», el ritmo de cambio del peso y el
  volumen sumado de ejercicios distintos.
- **Los retratos generados por IA,** la foto de Google y los servicios externos de avatares.
- **Las sesiones previstas contra las registradas,** que esperan su lectura nueva (DL-137).
- **Integrar relojes, pasos o el sueño del teléfono:** son terceros, con su propio análisis legal (VJR-2 y 08 §34).
- **La APK,** salvo las candidatas de TB-20, TB-23, TB-28, TB-35, TB-37, TB-42 y TB-44.

## 8. Etapas y orden

**Antes de programar:** el sí de Dirección al alcance, con las partes de §3 (ACTA-DIR-034). Lo dio el 2026-11-05, por
pregunta: «Ratifico, arrancá la etapa A ya», con TB-49.

### 8.1 Etapa A · en ramas, con datos sintéticos

Desde el sí al alcance hasta que la escuela cierre su evaluación sobre `test`.

**Las reglas:**
- nada se integra a `main` ni se despliega en `test`;
- una rama de integración, `wp-tablero-alta-gama`, con PR apilados en borrador en el orden de abajo, que se actualiza
  contra `main` una vez por semana;
- la API se toca solo en su rama, con su CI y sin integrar;
- los datos son sintéticos, en una base local propia;
- las capturas y las compilaciones se hacen de a una;
- cada parte se recaptura en Claro y Azul noche, a 1440 y a 1920, y una vez más a 1920 al 100 %.

**El orden:**
1. **TB-00:** la línea de base, con capturas de `main` antes de tocar nada.
2. **TB-01:** la letra. Va primero porque cambia todas las medidas y todas las capturas.
3. **TB-02 y TB-03:** la gramática de marcas, líneas, grilla y fondos.
4. **TB-04:** el minigráfico.
5. **TB-05:** el rostro y «Ocultar nombres».
6. **TB-09:** la acción del momento encadenada. Arregla un defecto que hoy está en `main`.
7. **TB-06, TB-07 y TB-08:** el encabezado y las cifras, «Tu semana» y el directorio.
8. **TB-10, TB-16, TB-24, TB-25 y TB-49:** las tarjetas del Resumen, la persona nueva, la composición, los indicadores
   por área y «Lo que contó al empezar».
9. **TB-11 y TB-12:** Pendientes por persona y el cajón «De a una», detrás de su interruptor.
10. **En la rama de la API, TB-13 y TB-14:** las dos pruebas y su arreglo, y la cola de revisiones. **En el website,
    TB-15:** aplicar desde el cajón y «¿Cuándo la revisás?».
11. **TB-17:** la guía, el criterio y la pauta «Decisiones guiadas».
12. **Después de TB-10, porque se apoyan en las tarjetas:** TB-30 a TB-34 (el mapa y sus capas, los programas y los
    derivados) y TB-26, TB-27 y TB-29 (las otras áreas, en rama y sin integrar hasta lo legal). Si el piloto va como las
    5 semanas de Elián, TB-33 va primero.
13. **En paralelo, porque son otras pantallas (los editores y la pestaña Plan):** TB-38 a TB-41, TB-43 y TB-45 a TB-48.
    Las partes que tocan la API, en su rama.
14. **Lo que sumó Dirección el 2026-11-07 (§3.3), antes de integrar:** TB-51 (la barra en kilos con el porcentaje) y
    TB-50 (la evolución de las últimas tomas), en la tarjeta de Antropometría, que ya está.
15. **D-13, ampliada el 2026-11-07 (§3.4):** TB-55, TB-52, TB-56 y la regla de TB-53 en la rama de la API del #243;
    después, TB-52 a TB-54 y TB-56 en el website. Con personas reales, después de la revisión legal.

**El criterio de corte:** una parte hoja (TB-07, TB-08, TB-12, TB-16, TB-22 y TB-49, y cualquier otra en la que no se apoye
ninguna) sale de la pila sin frenar a las demás si su recaptura muestra una regresión. Si falla una base (TB-01, TB-02 o
TB-05), se arregla antes de seguir, porque TB-04 y TB-06 a TB-12 se apoyan en ellas.

### 8.2 Etapa B · cuando la escuela cierre su evaluación sobre `test`

- **Se integra por partes,** empezando por lo que es solo del website. Hasta TB-20, los helpers y los textos de las
  partes del website viven en `apps/web` (por ejemplo, `retrato.ts` y `reloj.ts`), con sus pruebas ahí, que usan las
  listas de términos del dominio. Pasan a `packages/domain` con la candidata de la APK. Así cada parte del website se
  integra sin redesplegar la API, y lo del dominio y la API se junta en una sola ventana de redespliegue planificada.
- **Primero se integra la lectura de la cartera por conjuntos** (#222, en borrador), y recién después se construye el
  panorama (TB-18).
- **Las candidatas de la APK:** TB-20 («Hola, Diego» y las iniciales), TB-28 («Quién ve qué»), TB-35 (el esfuerzo de la
  sesión), TB-42 (el día tipo de hoy) y TB-44 (la semana que toca), cada una con lo que lee congelado (DL-152) y probada
  en el teléfono.
- **TB-21,** la prueba con profesionales, y la medición de /pro y del Resumen en Render con 200 personas.
- **TB-22,** el anillo del reparto, si Dirección lo quiere.
- **TB-23,** la foto del profesional, después de TB-20.
- **TB-36,** el control semanal, para el piloto; **TB-37,** el peso en casa, después del piloto.
- **Si la escuela no cerró su evaluación el viernes 2026-12-04,** Dirección decide si se integran antes en `test` solo
  las partes del piloto: las del website (TB-05, TB-08, TB-10 y TB-16), TB-13 de la API, con sus pruebas y, si fallan,
  su arreglo, en una ventana de redespliegue planificada, y TB-33 si el piloto va como las 5 semanas. Si no, el piloto
  va sin ellas.

### 8.3 Con el piloto

El piloto lo autoriza Dirección por separado, con el plan de datos reales (fuera del repo). Si se hace, va con Elián
como único profesional, en Entrenamiento y Antropometría, y sin fotos de las personas. Antes de la primera persona real,
el tablero necesita integrados:
- el monograma, «Ocultar nombres» y los estados del vínculo en palabras (TB-05 y TB-08);
- la persona recién llegada sin vacíos ni falsos «sin registros» (TB-10 y TB-16);
- las dos pruebas de la cola (TB-13), para que nadie quede para siempre como «Sin plan activo»;
- para planificar Entrenamiento, las semanas del bloque (TB-43 y TB-44), lo registrado junto al plan (TB-45) y TB-46 a
  TB-48; y el programa de Elián (TB-33), si el piloto va como sus 5 semanas;
- el control semanal en «Esperan respuesta» (TB-36) y, si llega con la candidata, el esfuerzo de la sesión (TB-35);
- una recaptura de los vacíos con una cuenta recién creada y la medición de /pro en producción con la cartera real.

Lo de Nutrición (TB-39 a TB-42 y la estimación de TB-38) sirve para el servicio que sigue al piloto, y las otras áreas
(TB-26 a TB-29), cuando una persona tenga más de un profesional.

## 9. Lo legal

- **D-13 cambia quién ve qué.** Es la capacidad nueva de compartición explícita que el 08 deja «para diseñar y aprobar
  por separado» (§11-bis.3 y C-11). Antes de personas reales espera la revisión legal (08 §11-bis; VJR-1 y VJR-4, qué
  puede recibir un perfil no sanitario y con qué detalle; VJR-5, cómo circula la información entre los profesionales de
  una persona) y el gate del 08 §42. Si hace falta la conformidad de quien lleva el área, es parte de VJR-5.
- **D-13, ampliada (TB-52 a TB-55), muestra el plan completo de otra área.** Además de lo de arriba, dos preguntas para
  la revisión legal: si quien lleva el área tiene que dar su conformidad para que su plan se vea (VJR-5), y si el plan de
  Nutrición puede llegar al entrenador, un perfil no sanitario (VJR-1 y VJR-4). Dirección eligió «todos con todos, con
  permiso» (TA-87): la revisión es condición antes de datos reales, no antes de programar. El texto de cada nivel y el del
  pedido van al legajo legal, como los de los hábitos.
- **El control semanal de D-16 es salud.** Sus preguntas, mínimas y sin puntaje, las revisan el abogado y la validación
  disciplinar (VD-1 del 08), en LC-41 del plan de datos reales. Espera esa revisión antes de personas reales.
- **El texto de cada acto** (compartir un resumen; la foto), su base, la revocación y lo que se informa van al legajo
  legal, fuera del repo público, como el de los hábitos (DL-165 D-19). En el catálogo de textos quedan marcados como
  propuesta pendiente de validación jurídica.
- **Lo que pide su alta en el inventario del 08 antes de datos reales:** la foto del profesional (dato profesional C3,
  TB-23); la de las personas, después del piloto, con su categoría, el texto A2, el plazo, la exportación y la
  supresión; y el peso en casa, que cambia quién carga la medición (su línea y el texto A2, TB-37). Los programas son un
  dato operativo del vínculo, sin categoría sensible nueva, y el esfuerzo de la sesión es un dato de ejecución, como el
  de cada serie.
- **La persona nueva (D-7):** si la API devolviera al profesional historia anterior al consentimiento, es una pregunta
  del 08, no de diseño. TB-16 lo verifica antes de dibujar.
- **En `test` y en local se trabaja con datos sintéticos** (08 §33): la cohorte y las cuentas de demostración. Ni fotos
  reales ni datos de personas reales.

## 10. La etapa A, parte por parte

La rama de la etapa A es `wp-tablero-etapa-a`, desde `main` b91dc3f con esta declaración. Cada parte va en su commit,
con sus pruebas, en el orden de §8.1. Las capturas las hace la CI, en el trabajo `capturas-del-tablero`
(`EVIDENCIA/TABLERO-ALTA-GAMA/LEEME.md`): esta PC no levanta la API, el website y PostgreSQL juntos.

| Parte | Estado | Dónde |
|---|---|---|
| TB-00 | Hecha. La línea de base es la corrida 42154091600 de `capturas-del-tablero`, sobre dbf19eb, con el website igual al de `main` b91dc3f: ocho páginas en Claro y Azul noche, a 1280 × 800, 1440 × 900 y 1920 × 950, con sus peticiones al abrir y sin errores de la página | `EVIDENCIA/TABLERO-ALTA-GAMA/linea-de-base/` |
| TB-01 | Hecha. Inter variable y Poppins 600 autoalojadas con `next/font/local`, con su licencia y su respaldo ajustado; Poppins, en el título del Espacio y en el nombre de la persona en el marco de la ficha (la pregunta del cajón llega con TB-12). Se compara con la línea de base en la corrida de su commit | `apps/web/src/letra/`, `scripts/letra-autoalojada.test.cjs` |
| TB-02 | Hecha. `medidaDeMarca`, `medidaDelRombo`, `medidaDelAro` y `rayaDeCorregido` en `geometria.ts`, con la regla del anexo A7, en el minigráfico, «Analizar», la evolución de Antropometría y los dos gráficos de Entrenamiento. Lo elegido es una guía fina y continua, la fecha en una píldora invertida y un aro del color de la métrica; el foco del teclado lo pasa al color del foco. El piso de la letra, 12,5, rige en los cuatro. TEST-TAG-006 | `seguimiento/geometria.ts`, `seguimiento/marca.tsx`, `scripts/geometria-del-minigrafico.test.mjs` |
| TB-03 | Hecha. Los trazos del anexo A8: la línea registrada de 1,5 en «Analizar» y el minigráfico (1,25 en alta densidad) y de 1,75 en Entrenamiento; el objetivo y el plan, discontinuos de 1,25; el cambio de versión o de método, una vertical de 1 punteada en `--borde-control`. La grilla, solo horizontal y sin líneas de eje (las barras conservan su base). La vigencia, una franja de `--banda` (token nuevo, 1,3:1) arriba del dibujo con la vertical que la lleva, en lugar de las columnas de todo el alto. Entrenamiento, en el color de la métrica: lo planificado en contorno discontinuo, línea discontinua y rombo hueco; el rango, en `--banda`. `--grafico-planificado` y `--grafico-registrado` salen de los tokens. TEST-TAG-005 | `tokens.css`, `scripts/contraste.test.cjs` |
| TB-04 | Hecha. Medida en la corrida de TB-10 (42172365143): a 1920 × 950 entran los minigráficos del Resumen, que terminan en 915, con la pieza propia de las tarjetas plegada. El indicador del Resumen tiene su minigráfico propio (`MinigraficoDelIndicador`): 72 de lienzo, sin canal de eje (el tope y la base de la grilla, rotulados adentro), la tira de cobertura con el estado de cada día y la raya de hoy en `--ahora` (token nuevo), y el inicio y el fin abajo. Con poco lugar por día, a más de ocho semanas, la línea es la media de cada semana de BE con su denominador y los días van como puntos claros; con menos semanas o en sesiones y tomas, la línea cortada con la última y las aisladas. Lo de fuera de la escala, una muesca y su cuenta, y la escala nunca es más angosta que 2 kg, 2 cm o 4 mm. Lo que se cuenta (series, repeticiones, RIR, registros y sesiones) va en enteros y, con todos los valores iguales, se abre uno de cada lado (TA-72, por la galería de capturas del PR). La descripción accesible no cambia. La comparación de etapas sigue con su minigráfico. TEST-TAG-007 | `seguimiento/geometria.ts` (`geometriaDelIndicador`, `escalaDeLaUnidad`), `seguimiento/minigrafico.tsx` |
| TB-05 | Hecha. `inicialesDe` y `Retrato`, de un solo tono neutro (`--retrato-fondo` y `--retrato-tinta`, tokens nuevos), en «Pendientes» (después, «Te toca a vos»), «Tus asesorados», el marco de la ficha y el de cada área, las notas del equipo, las novedades del profesional y el menú de la cuenta (TA-10); en ningún lugar prohibido. «Ocultar nombres», en el menú de la cuenta (TA-09): rige en /pro/**, también en lo que se exporta, en las novedades y en los textos que arma la API con un nombre adentro (TA-11); se recuerda en el navegador y cambia en el momento. Ningún título de pestaña lleva un nombre. «Tu semana» y el cajón lo suman cuando existan. TEST-TAG-003 y TEST-TAG-004; el recorrido del navegador, en las capturas | `lib/retrato.ts`, `lib/nombres-ocultos.ts`, `components/retrato.tsx`, `apps/web/test/retrato.test.mjs` |
| TB-09 | Hecha. La acción del marco de la ficha sigue la cadena aplicar → revisión acordada → borrador → empezar. Con una revisión registrada sin aplicar ofrece «Aplicar la revisión de Nutrición», que abre la lista de Revisiones con el foco en esa revisión y su «Aplicar» a la vista (`revision=…`); llegar no aplica nada. «Preparar la revisión» sigue abriendo la revisión nueva ya preparada (`preparar=1`). Una revisión registrada desde siete días antes de la fecha acordada es la de esa fecha (TA-13): ya aplicada, lo que sigue es su borrador o nada. Federico Álvarez, que ofrecía «Preparar la revisión», ahora ofrece «Aplicar»; las capturas suman su Resumen y anotan la acción del marco. TEST-TAG-010 | `advisees/accion-de-la-ficha.ts`, `retorno-y-preparacion.tsx` (`useLaRevisionPedida`), `scripts/espacio-profesional.test.mjs` |
| TB-08 | Hecha. Cada renglón de «Tus asesorados» lleva el monograma, el nombre, la referencia, las áreas con acceso, las sin acceso con los estados en palabras y «Con vos desde el …» (el vínculo vigente más antiguo). El renglón entero abre la ficha y las personas van en orden alfabético, como en español, sin datos de seguimiento (TA-14) | `pro/directorio.ts` (`conVosDesde`, `enOrdenAlfabetico`), `pro/asesorados.tsx` |
| TB-07 | Hecha; el retorno a /pro con el lugar guardado llegó en el sexto tramo (TA-46): cada ficha de «Tu semana» y cada verbo de «Te toca a vos» (y cada salida del cajón) guardan el filtro, el modo, el período y lo que se abrió, solo con identificadores; el destino ofrece «Volver al Espacio profesional, donde estabas» y, al volver, el foco va a lo que se abrió o a lo que seguía. TEST-TAG-035 (`pro/lugar-del-espacio.ts`). «Tu semana», entre el encabezado y la mesa: las revisiones acordadas de hoy a hoy + 7, una columna por día (TA-15), y las vencidas aparte, en «Vencidas»; fichas con monograma, nombre y área, hasta tres por día y «y N más». Sin tomas, horas ni «hecho»; hoy lleva la raya de `--ahora`; el vacío lo dice con de dónde salen las fechas; «Ver como lista»; cada columna es una lista con su día como título. Sale de la cartera ya leída: ninguna lectura nueva (en la corrida de TB-09, el Espacio sigue con 5 peticiones al abrir). Ninguna ficha se pasa de su columna: el nombre en hasta dos renglones, el área debajo y, en una columna angosta, el monograma arriba (TA-71, por la galería de capturas del PR); las capturas lo miden y fallan si algo se pasa | `pro/tu-semana.ts`, `pro/tu-semana-en-pantalla.tsx`, `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/tu-semana.mjs` |
| TB-10 | Hecha; la pieza de Antropometría llegó con TB-24 (TA-20). Medida en la corrida 42172365143 (6d26041): a 1440 × 900, la tarjeta más alta mide 466 y los valores de los indicadores terminan en 808, dentro de la primera pantalla; a 1920 × 950 entran también los minigráficos (915). A 1280 × 800, los valores quedan en 845: esa medida no es parte del criterio. En cada área con plan, **el tramo del ciclo**: una pista fina de la última revisión (o de la activación del plan vigente, TA-17) a la fecha acordada, con lo transcurrido en neutro, hoy en `--ahora` y la fecha marcada; vencida, sigue en discontinua y lo dice («Acordada para el lun 2 nov · vencida hace 4 días»); sin fecha, «Sin revisión acordada». Es una barra de progreso con su frase (`aria-valuetext`). `avanceDelReloj` y `tramoDelCiclo` leen solo fechas del profesional (TEST-TAG-001, una prueba de propiedad). **Lo nuevo desde la revisión, en cifras en fila** (TA-19). **La pieza propia:** en Nutrición, la barra partida de los registros del período (con cantidades, sin cantidades y anulados, y los rectificados aparte) y las comidas del plan con registro; en Entrenamiento, las sesiones por ejercicio, hasta cinco y «y N más» (TA-18). Con dos o más tarjetas en fila, la pieza va plegada, con la barra (o cuántos ejercicios) en el renglón que la abre y la cobertura del período adentro, para que la tarjeta no pase su tope (A13); con una sola área, abierta. En la primera corrida, abierta, la tarjeta de Nutrición medía 604 a 1440 × 900 y los valores de los indicadores terminaban en 946: no entraban. Un área sin nada registrado muestra **«Empezar el plan» en miniatura**, con una lectura de sus evaluaciones (TA-21). `--pista`, token nuevo, con sus pares. Las capturas anotan dónde terminan las tarjetas y los valores de los indicadores (`primeraPantalla`). TEST-TAG-001, TEST-TAG-002 y TEST-TAG-005 | `lib/reloj.ts`, `seguimiento/tramo-del-ciclo.tsx`, `seguimiento/piezas-del-area.ts`, `seguimiento/pieza-del-area.tsx`, `apps/web/test/tarjetas-del-resumen.test.mjs` |
| TB-16 | Hecha. **Lo que devuelve la API antes del vínculo:** toda lectura de la ficha está acotada a lo que hizo este profesional (planes, objetivos, revisiones y tomas con su `profesionalId`, y los registros de comida y las sesiones contra sus planes), que no existe antes de su primer vínculo: no hay historia previa al consentimiento que recortar, y no es una pregunta del 08. Lo único con fecha anterior es lo de un vínculo anterior con el mismo profesional, o un registro que la persona cargó después con una fecha pasada, contra un plan de este profesional: es de este acompañamiento, y se ve eligiendo otro período (TA-22). **El período:** sin uno elegido en la URL y con un acompañamiento de menos de 90 días (el vínculo aceptado más antiguo de las áreas que ve), el período por omisión del Resumen y de «Analizar» arranca ahí y lo dice («Desde el 3 nov, inicio del acompañamiento · 4 días · incluye hoy»); no se escribe en la URL, y elegir otro lo reemplaza (TA-22). **Lo anterior al vínculo de cada área** no se dibuja en el minigráfico, ni en el lienzo ni en la tira; la escala de fechas sigue siendo la del período. Con uno a tres días con valor, puntos sueltos, sin línea ni media (la regla ya estaba en TB-04). La cohorte no cambia: sus vínculos tienen de 6 meses a 3 años. TEST-TAG-014 | `seguimiento/estado.ts` (`inicioDelAcompanamiento`, `periodoDesdeElVinculo`), `workspace.tsx`, `seguimiento/contexto.tsx`, `seguimiento/geometria.ts` (`recortadaAlVinculo`), `control-de-periodo.tsx`, `apps/web/test/persona-nueva.test.mjs` |
| TB-49 | Hecha. La tarjeta «Lo que contó al empezar», después de las notas del equipo: las solicitudes respondidas de este profesional, las dos más nuevas con sus primeras cuatro respuestas que rigen (pregunta y respuesta en palabras, con las etiquetas del formulario), «Declarado por la persona» con la fecha en que respondió (y la de su corrección), o «Cargado por … · confirmado por la persona el …»; cada una abre su solicitud en la pestaña Información, con el retorno, y las demás se nombran con un enlace. Sin solicitudes respondidas no hay tarjeta. **Los hábitos:** API-FRM-04 lista solo las solicitudes de quien consulta, así que «Tus hábitos» entra solo si este profesional la pidió; lo que la persona le compartió sin pedirlo (HBT-05) sigue en su tarjeta de la pestaña Información (TA-23). Sin operaciones nuevas: lee lo que ya lee esa pestaña (TA-23). TEST-TAG-033 | `seguimiento/lo-que-conto.ts`, `seguimiento/lo-que-conto-en-pantalla.tsx`, `apps/web/test/lo-que-conto.test.mjs` |
| TB-24 | Hecha. **La pieza «Composición corporal»**, en la pestaña Antropometría, como sección propia al lado de «Evolución» (`vista=composicion`, con su ayuda y sus atajos de 90 días y un año; abre con un año): «De qué está hecho el peso», una columna por toma, en su fecha y desde cero, con la masa libre de grasa abajo y la masa grasa arriba, separadas por un corte que deja ver la tarjeta; «Cuánto cambió cada parte», el peso, la masa grasa y la masa libre de grasa en filas con las mismas fechas y la misma vara, con la primera y la última cifra y la diferencia; y la tabla de cada toma. **Las reglas:** la columna se parte solo con las dos masas de un método de dos compartimentos (Durnin y Womersley con Siri, o Faulkner) que suman el peso de la toma; Lee y la masa de cuatro componentes van en su fila, «no suma con las otras»; un cambio de método o de protocolo es una vertical rotulada («Cambia el método · 9 jun») y ninguna diferencia la cruza; una toma con solo peso es una columna en contorno y no corta la fila del peso; un método por gráfico, con la elección si hay dos (TA-27); sin «%». **La pregunta «¿De qué está hecho el cambio de peso?»**, entre las principales de «Analizar» si el profesional ve Antropometría, responde con la misma pieza en el período de la ficha y ofrece «Ver peso y masas «Juntas»» (TA-25). **La tarjeta de Antropometría del Resumen** (TA-20): «Composición de la última toma», con la barra («80,8 kg = 66,6 libre de grasa + 14,2 grasa»), el método y «Desde la toma del …: peso −0,4 kg · grasa −0,5 kg · libre de grasa +0,1 kg»; plegada, la barra en el renglón; sin ninguna toma partida, «Peso en las tomas», la línea de los pesos (R-6). Lee API-ANT-06 sin tocar la API, en tramos de 92 días y solo con el peso y las masas (TA-24 y TA-26). `--composicion-libre` y `--composicion-grasa`, tokens nuevos, con sus pares. **La cohorte:** Diego y Camila tienen las masas de Durnin y Womersley en cada toma; Héctor también las pide, pero sus tomas no tienen pliegues (`sinPliegues`) y el método no tiene con qué calcular: es el caso sin método, con la línea de los pesos. **No está cargado en la base de `test`:** pide la IP del operador y lo decide Dirección. TEST-TAG-017 y TEST-TAG-005 | `seguimiento/composicion.ts`, `seguimiento/composicion-en-pantalla.tsx`, `seguimiento/composicion-en-analizar.tsx`, `anthropometry/composicion.tsx`, `seguimiento/pieza-del-area.tsx`, `apps/web/test/composicion.test.mjs`, `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/personas.mjs` |
| TB-25 | Hecha. Los indicadores del Resumen por defecto salen de las áreas que el profesional ve en esta ficha, con la tabla de la propuesta (§18.4): con Nutrición, calorías, proteínas, masa grasa (o peso) y registros; con Nutrición y Antropometría, la suma de 6 pliegues en lugar de los registros; con Entrenamiento, la carga de la serie principal, las series registradas, el RIR y la masa libre de grasa (o el peso), si ve Antropometría; con Antropometría, masa grasa (o peso), la suma de 6 pliegues, la cintura y el perímetro del brazo flexionado. Con Nutrición y Entrenamiento, que la tabla no dice, calorías, proteínas, la carga y la masa grasa, o los registros (TA-28). La masa grasa es la de Durnin y Womersley o, si no, la de Faulkner; sin masas en el período, el peso. Un indicador cuyo dato no está en el período no se pone, y nunca hay dos iguales. «Series por semana» son las series registradas del ejercicio principal, sesión a sesión (TA-29). Lo guardado por la cuenta manda, como antes. Sin API y sin lecturas nuevas: el Resumen pide una serie por indicador, así que con más indicadores sube la cuenta de peticiones al abrir. TEST-TAG-018 | `seguimiento/indicadores-por-area.ts`, `seguimiento/resumen-indicadores.tsx`, `apps/web/test/indicadores-por-area.test.mjs` |
| TEST-TAG-032 (arreglo de base) | Hecho (TA-30). El guardián de las peticiones al abrir no era estable porque la ficha a veces se leía dos veces: la cobertura del Resumen y de «Analizar» pregunta por las tres áreas, y si la respuesta «no disponible» del área que el profesional no ve llegaba antes que el marco, el marco descartaba su primera lectura y repetía todas las de la ficha (seis peticiones más). Ahora el aviso espera la lectura del marco. Las capturas cuentan hasta que la API queda quieta y comparan con una tabla exacta: en las corridas de cfc8855 y de 1e6cfb5 las páginas que no cambiaron dieron las mismas cuentas (Diego, Federico y Héctor, 18 cada uno; antes 18, 24 y 24 o 18). La lista de nombres de TEST-TAG-004 salía vacía y ahora busca los nombres de la cohorte: no apareció ninguno con «Ocultar nombres» | `advisees/workspace.tsx`, `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/peticiones.mjs`, `capturas.mjs`, `scripts/guardian-de-peticiones.test.mjs` |
| TB-06 | Hecha, con TB-11 (TA-16). Debajo del título, el saludo («Buen día, Sofía», o a secas con «Ocultar nombres», TA-31) y tres cifras: «Te toca a vos» con Revisiones, Planes y Tomas, que filtran con `aria-pressed` (TA-32); «Esperan respuesta» con Formularios, Solicitudes e Invitaciones, y «Personas» con sus áreas, que llevan a su sección. Dicen «al menos» si faltan páginas. La única lectura nueva es la de las invitaciones sin usar: el Espacio pasa de 5 a 6 peticiones al abrir | `pro/cifras-del-espacio.tsx`, `pro/mesa.ts` (`saludo`, `primerNombre`, `personasPorArea`) |
| TB-11 | Hecha. «Te toca a vos» (antes «Pendientes»): revisiones, planes y tomas, por persona por omisión (las personas por su pendiente más urgente según `compararPendientes`, agrupadas por `identityId`, con «un pendiente» o «N pendientes» al lado del nombre) o «Por pendiente», la tabla de DL-107 tal cual; la elección se recuerda en el navegador (TA-34). «Más filtros» queda en la tarjeta. «Esperan respuesta», al costado y encima de «Tus asesorados» (TA-35): los formularios sin responder, las solicitudes de vínculo sin responder y las invitaciones sin usar, lo más antiguo primero (TA-33). Medido en la corrida de 1e6cfb5: a 1440 × 900 y a 1920 × 950 entran el saludo, las cifras, «Tu semana», «Esperan respuesta» y las dos primeras personas de la cola. TEST-TAG-008 | `pro/te-toca-a-vos.tsx`, `pro/esperan-respuesta.tsx`, `pro/mesa.ts`, `apps/web/test/mesa.test.mjs` |
| TB-12 | Hecha, detrás de su interruptor (TA-39): «Empezar por el primero» abre el cajón «De a una» con la vista elegida, en su orden. Cada cuadro: «Pendiente 1 de 3», la pregunta, quién y el área, el pendiente, el tramo del ciclo y lo nuevo desde la revisión, con dos lecturas como mucho (TA-36); las salidas «Preparar la revisión» (o el verbo de la fila), «Abrir la ficha» y «Saltear por ahora»; J, K y S con el foco adentro, y Escape (TA-37). El cierre es un comprobante. Al salir por una salida, el lugar se guarda con identificadores y, al volver a /pro, el cajón sigue con el siguiente (TA-38). No incluye aplicar: eso es TB-15, que reusa API-TRN-24 y API-NUT-20 sin tocar la API. TEST-TAG-009 | `pro/cajon.ts`, `pro/cajon-de-a-una.tsx`, `apps/web/test/cajon.test.mjs` |
| TB-15 | Hecha, sin tocar la API. **«¿Cuándo la revisás?»**, en el paso 3 de la revisión de Nutrición y de Entrenamiento («Lo que decidís») y en el cuadro de activar de los dos editores, en lugar del campo «Próxima revisión (opcional)»: «En 1 semana · miércoles 11 nov», «En 2 semanas», «En 4 semanas», «Elegir una fecha» y «Sin fecha por ahora», sin nada elegido (TA-40); al elegir, el efecto («Al aplicar esta revisión, la próxima queda para el …», «Al activar, la próxima revisión queda para el …»); «Sin fecha por ahora» dice lo que hace BE hoy (TA-41) y no aparece con «Reprogramar revisión»; con «Finalizar» no se pregunta, y después de aplicar tampoco. Al activar, la fecha que ya tenía la versión viene elegida y se dice (TA-44); en la revisión, lo acordado la última vez va como dato («La última vez acordaste revisar a las 4 semanas.», TA-45). **Aplicar desde el cajón:** si lo leído al abrir el cuadro trae una revisión registrada y sin aplicar, la pregunta es «La revisión del 16 oct está registrada y sin aplicar. ¿La aplicás?», y antes del botón van el resultado, el fundamento, la próxima acción y lo que pasa al aplicar, con la fecha que deja; el botón es el de cada área («Aplicar continuidad» o «Aplicar próxima acción»), con la misma operación, la clave del intento, los conflictos y los textos de la lista de Revisiones (TA-42). La segunda lectura del cuadro es la revisión (API-NUT-19 o API-TRN-23, que el cliente suma), no lo nuevo desde ella: siguen siendo dos. Lo aplicado se dice en su cuadro, con «Seguir el borrador» si se preparó uno, y en el cierre («Lo que aplicaste:»), y al cerrar el cajón /pro vuelve a leer la cartera (TA-43). TEST-TAG-013 (con la integración de las dos áreas) y TEST-TAG-034 | `lib/cuando-la-revisas.ts`, `advisees/cuando-la-revisas.tsx`, `advisees/aplicar-la-revision.ts`, `pro/aplicar-en-el-cajon.tsx`, `pro/cajon-de-a-una.tsx`, `apps/web/test/aplicar-y-cuando.test.mjs`, `test/integration/aplicar-desde-el-cajon.int-spec.ts` |
| TB-17 | Hecha. **La guía** (`docs/ux/GUIA-UX-UI.md`): I.1.3 suma las barras de la lista cerrada de D-1; I.5, la letra (D-3); I.6, el acento como una sola luz y los tokens de la etapa A (D-3); I.7, la gramática de las marcas (D-3); II.4, que el tramo del ciclo no es una cobertura; II.6, el minigráfico (D-5, que reemplaza a «No se quita ningún punto por falta de lugar: se achica la marca»), las tarjetas del Resumen y el Espacio (D-2 y D-4); la pauta nueva **II.12 «Decisiones guiadas»**; y **V.4**, lo que cambia con la etapa A. **El criterio de auditoría de las maquetas** (`BE-maquetas/CRITERIO-Y-AUDITORIA.md`, fuera del repo): la vara de la §6 con el monograma (D-2) y las barras de la lista cerrada (D-1), y la validación del 2026-10-10 asentada. **DEUDA_LEGAJO:** el estado de DL-163 al día y la nota que confronta los minigráficos de E-53 y E-54, que leen API-PRJ-01, con DEC-10-UX-01. **Las cuatro desalineaciones,** corregidas: DL-161 figuraba «sin integrar» (se integró el 2026-11-02, #229 y #224); el criterio decía validación «Pendiente»; la guía contaba 105 íconos (son 115); y faltaba la nota de DEC-10-UX-01. **Lo que la guía deja dicho que falta:** los enlaces de texto en tinta con un subrayado fino (D-3), que tocan todas las pantallas, y el cajón con un lector de pantalla y en un proyector | `docs/ux/GUIA-UX-UI.md`, `docs/DEUDA_LEGAJO.md` |
| TB-48 | Hecha (TA-47 a TA-55), sin tocar la API. **La primera parte** (sexto tramo): la nota de cada ítem en el editor de Nutrición, en un renglón debajo del ítem, a pedido («Agregar una nota sobre …»), hasta 300 caracteres: el campo ya estaba en el contrato y la persona ya la lee en la app; **los topes** del contrato, avisados antes de guardar en los dos editores (7 días tipo, 12 comidas, 12 opciones y 40 ítems; 12 bloques, 26 microciclos, 30 sesiones por bloque y 14 por microciclo, 40 ejercicios, 20 series y 12 parámetros), cada uno como un problema más de lo que no deja guardar, con su lugar, y el autoguardado espera; y el cuadro sin plantillas, que prometía que «se escriben en «Plantillas y habituales»» y ahora dice «Se guardan desde una versión de plan, con «Guardar como plantilla». En «Plantillas y habituales» se ven y se cambian.». **La segunda parte** (séptimo tramo): **duplicar** un día tipo («Duplicar este día tipo», en su menú), una comida («Duplicar comida», en «Más»), una opción («Duplicar opción 2», junto a cambiar su nombre), una sesión («Duplicar esta sesión») y un ejercicio («Duplicar ejercicio», en «Más»): la copia va justo después, sin identificadores de nodo, con todo lo escrito y «… (copia)» en el nombre, que nace a la vista (TA-48); **reordenar**: «Bajar» junto a «Subir» en cada comida, «Subir» y «Bajar» en cada ejercicio, y «Mover antes» y «Mover después» en el menú del día tipo y en el de la sesión, con lo abierto siguiendo a su elemento; las opciones no se reordenan (TA-49); **quitar cualquier serie**, en su fila, en lugar de «Quitar la última serie» (TA-50); **el microciclo con sesiones sueltas**: «Organizar por microciclos» se ofrece siempre y las sesiones pasan a la «Semana 1» con sus identificadores («Las 3 sesiones del bloque pasan a «Semana 1».», TA-51); **«Revisar el plan»**, antes «Validar plan», que lista también lo que queda sin completar —cada ítem sin cantidad («… → sin cantidad: en la app dice «Sin dato»»), cada ejercicio sin series y cada serie sin repeticiones fijadas—, con su lugar y sin bloquear («Queda sin completar. No impide activar: si es a propósito, podés activarlo así.»); sin nada, «No hay nada que impida activar.» (TA-52); **«Guardar como plantilla»**, con su texto y a la vista, en lugar de un menú «⋯» sin texto, apagado con su motivo cuando no se puede (TA-53); **la receta como opción, con buscador**: «Buscar en tus recetas», por su nombre y sin tildes, sobre todas las propias, leídas al abrir el cajón (TA-54); y **las zonas de un ejercicio propio**, desde «Mis ejercicios» («Cargar las zonas» o «Cambiar las zonas»): las 17 del catálogo con «No la nombra», «Principal» o «Secundaria», y la figura de siempre al lado, con API-EJE-04, que ya existía (TA-55). Ningún oráculo TEST-TAG la pide; las pruebas, con sus mutaciones, en `editores.test.mjs` | `advisees/topes-del-plan.ts`, `advisees/editar-la-estructura.ts`, `advisees/revisar-el-plan.ts`, `nutrition/recetas-para-elegir.ts`, `exercises/zonas-propias.ts`, `exercises/zonas-del-ejercicio.tsx`, `apps/web/test/editores.test.mjs` |
| TB-51 | Hecha (TA-79 a TA-84), sin tocar la API. **La barra de la última toma, en kilos con el porcentaje al lado** (D-11, modificada por Dirección el 2026-11-07), en la tarjeta de Antropometría del Resumen y arriba de las columnas de la pestaña Composición corporal («La última toma repartida, el …»), con el mismo componente (`BarraDelReparto`). Cada parte en su renglón, con su muestra, su nombre, sus kilos y su porcentaje («Grasa 13,5 kg 13,7 %»), y debajo «Los porcentajes son del peso de esa toma: 98,6 kg.». **El reparto** (`repartoDe`): con el músculo de Lee, grasa, músculo y resto, «El resto es lo que no es grasa ni músculo esquelético (hueso, órganos, piel y líquidos), por diferencia.», y el método en palabras («La grasa, Durnin y Womersley, con Siri; el músculo, Lee, con perímetros»); con los cuatro componentes de De Rose y Guimarães (en las tomas que ya los tienen, DL-112), grasa de Faulkner, músculo y resto («El resto es la masa ósea (12,9 kg) y la residual (23,8 kg: órganos, vísceras y líquidos).»); sin músculo, grasa y libre de grasa, con «El método no calcula el músculo: la libre de grasa es el músculo, el hueso, los órganos y los líquidos, juntos.». «Desde la toma del …» compara solo dos tomas repartidas igual («peso −0,1 kg · grasa +0,3 kg · músculo −0,7 kg · resto +0,3 kg»). La grasa va primero; el músculo, en el azul de la libre de grasa; el resto, en `--composicion-resto` (token nuevo, con sus pares). Las columnas de la pestaña no cambian. T13 admite el «%» solo en `porcentajeEnPalabras`. **La cohorte:** Federico Álvarez con las masas de Durnin y Womersley y el músculo de Lee (TA-84); no está cargado en `test`. TEST-TAG-017 (seis casos nuevos, cinco mutaciones verificadas) y TEST-TAG-005 | `seguimiento/composicion.ts` (`repartoDe`, `laUltimaToma`, `porcentajeEnPalabras`), `seguimiento/composicion-en-pantalla.tsx` (`BarraDelReparto`), `seguimiento/pieza-del-area.tsx`, `tokens.css`, `scripts/contraste.test.cjs`, `scripts/copy-pantallas.test.cjs`, `apps/web/test/composicion.test.mjs`, `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/` |
| TB-50 | Hecha (TA-73 a TA-78), sin tocar la API. **«Evolución en las últimas tomas»**, en la tarjeta de Antropometría del Resumen, debajo de la composición: hasta cuatro tomas (tres si no entran sin pisarse), una columna por toma con su fecha arriba, y tres pares: «Cintura y pliegue abdominal», «Suma de 6 pliegues y peso» y «Brazo flexionado y pliegue tricipital». Cada medida, en su fila: el nombre y la unidad, la línea con la marca del dato (TB-02; la suma de 6, calculada), el valor escrito sobre cada punto (el de la última toma en la tinta del texto) y la diferencia al costado («−0,4 cm», «+0,2 mm», «sin cambio»). Kilos con kilos: una vara por unidad en toda la pieza, nunca más angosta que 2 kg, 2 cm o 4 mm. Lo que no se compara se dice: «sin medir» y «Pliegue abdominal: no se midió en estas tomas.»; con un cambio de protocolo, la línea se corta y «Cintura: cambia el protocolo, el método o la unidad el …; la diferencia va desde ahí.»; un hueco no se une. Plegada con dos o más tarjetas en fila, con el primer par en el renglón («Cintura −0,3 cm · pliegue abdominal −1,2 mm»); abierta con una sola. Abajo, «Una columna por toma, con su fecha. Cada medida va en su unidad: los centímetros con los centímetros y los milímetros con los milímetros, a la misma escala.» y «Ver la evolución de todas las medidas». La tabla equivalente, para el lector de pantalla. Sale de la misma lectura de la tarjeta: ninguna petición nueva. TEST-TAG-036 (siete casos, cuatro mutaciones verificadas) | `seguimiento/evolucion-de-las-tomas.ts`, `seguimiento/evolucion-de-las-tomas-en-pantalla.tsx`, `seguimiento/resumen-area.tsx`, `apps/web/test/evolucion-de-las-tomas.test.mjs`, `EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs` |

**Para seguir.** De TB-00 a TB-12, TB-15, TB-16, TB-17, TB-24, TB-25, TB-48 y TB-49 están hechas, con el arreglo de base
de TEST-TAG-032, y también TB-50 y TB-51, lo que sumó Dirección el 2026-11-07 (§3.3). Lo próximo:
- **TB-52 a TB-55 (D-13, ampliada; §3.4) están declaradas, sin programar,** con TA-85 a TA-95 a ratificar y TEST-TAG-037 a
  039 en §6. La API va en la rama del #243, que todavía no se toca; sus oráculos se escriben con sus trece campos
  antes del código de cada parte.
- **TB-50 y TB-51, en `test`:** como TB-24, la cohorte de `test` no tiene las masas de Durnin y Womersley ni el músculo de
  Lee de Federico (pide la IP del operador y lo decide Dirección). Hasta entonces, en `test` la barra de Diego y de
  Federico es la línea de los pesos; la evolución de las últimas tomas sí se ve, porque lee medidas que ya están.
- **Un paso pendiente de TB-24, que decide Dirección:** cargar en la base de `test` las masas de Durnin y Womersley de la
  cohorte: los cálculos de los dos métodos nuevos sobre las tomas de Diego y Camila que ya están (la fase `calculos` de
  `cargar.mjs`, que hoy no se repite porque su estado la da por hecha). Pide la IP del operador. Hasta entonces, en `test`
  la composición de Diego y Camila se ve como el caso sin método (la línea de los pesos), y solo la CI la muestra partida.
- **El cajón queda apagado** hasta que Dirección vea su recaptura (las capturas lo prenden con `BE_CAJON_DE_A_UNA=si`).
  Prenderlo es una variable de la compilación del website en Render, sin código. Con TB-15 aplica, y las capturas ya
  muestran su cuadro de aplicar: la cohorte registra la revisión de Entrenamiento de Federico Álvarez el día anterior a
  cada corrida y no la aplica (`pendienteTrn`, con su fecha relativa a hoy), así que el cajón de Martín Acosta abre en
  «Pendiente 1 de 3» con «La revisión del 5 nov está registrada y sin aplicar. ¿La aplicás?», el resultado, el
  fundamento, la próxima acción, lo que pasa al aplicar y «Aplicar próxima acción» (la corrida del 2026-11-06). La que
  está aplicada es la de Nutrición de Federico, la del 16 oct: en Nutrición la cohorte no tiene ninguna sin aplicar, y
  el cuadro con «Aplicar continuidad» no se ve en pantalla (lo cubre TEST-TAG-013).
- **TB-30 y TB-32 piden antes los lugares del cuerpo (no se programaron).** El mapa corporal usa el set de capas de
  Dirección (`public/zonas/`: el cuerpo de frente y de espalda y una máscara por zona muscular). La capa Medidas necesita
  dónde va cada sitio de perímetro y de pliegue sobre ese cuerpo, y la de Molestias declaradas, dónde va cada región de
  «Antes de entrenar» (cuello, hombros, codos, muñecas o manos, espalda alta, zona lumbar, cadera, rodillas y tobillos o
  pies), que no son zonas musculares. El repo no tiene esos lugares: la maqueta midió solo cuatro sobre las máscaras
  (brazo flexionado, muslo y los dos hombros). Son puntos anatómicos nuevos, y no se inventan: hace falta medirlos sobre
  las máscaras, verlos en pantalla en los dos temas y que Dirección los dé por buenos, como la figura de la toma (DL-073).
  Con eso, la pieza (las pestañas por capa, la columna de composición de TB-24 y la tabla) se arma sin la API: Medidas
  lee las tomas como la Serie de la lámina (`componerSerie`), y Molestias, las respuestas de «Antes de entrenar» como
  «Lo que contó al empezar». *Otra opción, si Dirección prefiere no esperar:* la capa Medidas por zona (el perímetro del
  brazo en el bíceps, el del muslo en el cuádriceps) y solo con la tabla para lo que no tiene zona.
- **TB-45 pide la API en lo principal (no se programó).** «Lo indicado de cada semana en escalones» necesita las semanas
  del bloque (TB-43, API-PLE) y «el esfuerzo de la sesión que contó la persona», TB-35 (API-ESF, etapa B). Sin ellas
  quedaría la primera serie registrada frente a lo indicado de cada versión, que la pestaña Entrenamiento ya muestra en
  la evolución de cada serie. Va después de TB-43, en su rama.
- **TB-46, en parte (no se programó en este tramo).** El cuadro con las tres salidas (una plantilla, con lo que trae a la
  vista; la versión anterior; desde cero), qué se copia y qué no, y la agenda en Entrenamiento se arman con las
  operaciones de hoy. «El programa y el hito que cierra el plan» piden TB-33 (API-PRG) y «seguirlo o descartarlo»,
  TB-47 (API-PLN-07 y API-PLE-05): hasta entonces, el cuadro ofrece seguir el borrador, sin descartar.
- **En la rama de la API, aparte:** TB-13 y TB-14 (las dos pruebas de la cola y API-DSH-02); con TB-13, los textos de
  «Sin fecha por ahora» (TA-41) cambian con la cola. Y TB-26, TB-27, TB-29, TB-31, TB-33, TB-34, TB-38 a TB-41, TB-43 y
  TB-47.
- **Los enlaces de texto en tinta, con un subrayado fino** (D-3): la guía lo deja dicho como pendiente; tocan todas las
  pantallas y sus capturas, así que van en su propia parte.
- **Los recorridos locales, que no corren en la CI,** se actualizan cuando se usen: el del Espacio
  (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/recorrido.mjs espacio`) busca las vistas dentro de «Pendientes» (con
  TB-11 pasaron a las cifras, y desde TB-07 los destinos llevan `origen=espacio`); los de los editores (el mismo
  `recorrido.mjs` y `EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/recorrido/recorrido-web.mjs`) tocan «Validar plan»,
  cuentan el menú «⋯» de la versión y «Quitar la última serie», que con TB-48 pasaron a «Revisar el plan», a «Guardar
  como plantilla» a la vista y a quitar cada serie en su fila.

**Lo medido con las correcciones de la galería de capturas** (TA-71 y TA-72; la corrida 42234954294 de
`capturas-del-tablero`, sobre 1a0e462, con `main` mergeado):
- **«Tu semana» (TA-71):** en los tres tamaños, en los dos temas y con los nombres ocultos, ninguna parte de una ficha
  se pasa de su columna: dos fichas medidas por profesional en cada caso, y `tuSemanaQueSePasa` vacío. A 1280, con el
  monograma arriba, «Norma Castro» y «Diego Sosa» van en un renglón y «Federico Álvarez» en dos; la referencia, en
  «Asesorado · / 729369». A 1440, «Norma Castro» y «Federico Álvarez» van en dos renglones al costado del monograma y
  «Diego Sosa» en uno; con los nombres ocultos, «Asesorado / · 1d4ace». La tarjeta termina en 531 a 1440 (520 antes);
  a 1920, en 523 con Sofía Paz y en 531 con Martín Acosta; a 1280, en 546 y en 564.
- **La cola a 1440 × 900:** la segunda persona de «Te toca a vos» termina en 911, y en la corrida de la cabeza anterior
  (47d86de) terminaba en 916: entra una sola entera, antes y ahora. Lo medido en el quinto tramo (la segunda terminaba
  en 897, en la corrida de 1e6cfb5) ya no rige; lo que la bajó después no es de este cambio y queda para revisar contra
  §1, que pide dos o tres personas a 1440 × 900. A 1920 × 950 entran las dos (la segunda termina en 903).
- **La escala del Resumen de Diego visto por Martín Acosta (TA-72):** «Series registradas · Dominadas», con 4 en las
  10 sesiones, lleva la grilla en 3, 4 y 5, «5» arriba y los puntos sobre el 4; «RIR · Dominadas · serie 1», con RIR 1
  en todas, en 0, 1 y 2, con «2» arriba.
- **El cajón de Martín Acosta** abre en «Pendiente 1 de 3» con «La revisión del 5 nov está registrada y sin aplicar.
  ¿La aplicás?» y las salidas «Aplicar próxima acción», «Abrir la ficha» y «Saltear por ahora».
- **Lo demás no cambió:** las diecinueve páginas dieron las peticiones al abrir de la tabla de TA-30, sin errores de la
  página, y con «Ocultar nombres» no apareció ningún nombre ni inicial.

**Lo medido en el séptimo tramo** (TB-48, la segunda parte; la corrida 42207018963 de `capturas-del-tablero`, sobre
40882a4):
- **Las capturas suman tres páginas de Martín Acosta,** porque lo visible de TB-48 está en los editores y en «Mis
  ejercicios», que no se abrían: el editor de Entrenamiento con el borrador que deja la revisión de hoy de Camila Ortiz
  (`plan-camila`), «Mis ejercicios» y sus 17 zonas abiertas (`mis-ejercicios-zonas`). La tabla de TA-30 las suma con
  9, 4 y 4 peticiones al abrir: son páginas nuevas en las capturas, no lecturas nuevas, y abrir las zonas no lee nada.
  Las dieciocho páginas que ya estaban dieron las mismas cuentas, sin errores de la página.
- **El editor de Entrenamiento** (1440 × 900, en Claro): «Guardado», «Guardar como plantilla» con su ícono, «Revisar el
  plan», «Activar plan» y «Guardar cambios» entran en un renglón. Los ejercicios abren plegados, así que «Subir»,
  «Bajar» y la columna para quitar cada serie no se ven en la captura.
- **«Mis ejercicios»:** cada tarjeta de los seis ejercicios propios lleva «Cargar las zonas» (no tienen ninguna), en un
  tercer renglón de botones: la página pasa a medir 1566 a 1440. Con las zonas abiertas, en Azul noche: las 17 en cuatro
  columnas, el foco en «Trapecio» y, al lado, «Así se ve» con «Todavía no elegiste ninguna zona.».
- **Los recorridos de la CI** (`test/navegador`) abren el editor de Nutrición de un borrador, renombran comidas desde
  «Más» y capturan su encabezado, que ahora lleva «Guardar como plantilla» y «Bajar» al lado de «Subir».
- **No se vio en pantalla:** el editor de Nutrición con «Revisar el plan» y lo sin completar, el cajón de recetas con el
  buscador (la cohorte no tiene recetas propias), un ejercicio abierto con «Subir», «Bajar» y quitar una serie, ni el
  microciclo con sesiones sueltas. Los cubren sus pruebas.

**Lo medido en el sexto tramo** (las corridas de `capturas-del-tablero` sobre ae418e0 y cc98a08, y la de la CI del PR
sobre ae418e0):
- **Las peticiones al abrir no cambiaron:** las quince páginas dieron las mismas cuentas que la tabla de TA-30 (el
  Espacio, 6; el cajón, 8; los Resúmenes de Sofía Paz, 18; el de Martín Acosta, 14). Ni TB-15 ni el lugar del Espacio
  suman una lectura al abrir: el lugar se lee antes que la cartera.
- **«Ocultar nombres»:** ningún nombre ni inicial en el cajón, el Espacio ni el Resumen de los dos profesionales, y
  ningún error de la página.
- **La integración:** 994 pruebas, todas verdes, con las dos de TEST-TAG-013 (Nutrición y Entrenamiento).
- **La revisión nueva de Nutrición** se suma a las capturas, para ver «¿Cuándo la revisás?» en pantalla, sin nada
  elegido, en los dos temas y los tres tamaños: pide 6 peticiones al abrir (medidas en la corrida de 05f398b; la tabla de
  TA-30 la suma). La página entera mide 1425 a 1440 y a 1920, y 1730 a 1280.

**Lo medido en el quinto tramo** (las corridas de `capturas-del-tablero` sobre cfc8855, 1e6cfb5 y 3305525):
- **Las peticiones al abrir,** iguales en cada corrida para las páginas que no cambiaron: los Resúmenes de Diego, Federico
  y Héctor (Sofía Paz), 18 cada uno; el de Martín Acosta, 14; «Analizar», 11, y con Calorías elegida, 12. El Espacio,
  6 (las invitaciones, TB-06); con el primer cuadro del cajón abierto, 8. Ninguna diferencia con la tabla.
- **El Espacio:** a 1440 × 900 y a 1920 × 950 entran el saludo, las cifras (terminan en 304), «Tu semana» (520),
  «Esperan respuesta» (empieza en 568) y las dos primeras personas de «Te toca a vos» (la segunda termina en 897). Mide
  1410 de alto (1104 antes), por la fila de las cifras. Sofía Paz: «2 Te toca a vos», «0 Esperan respuesta», «5
  Personas»; Martín Acosta, 3, 0 y 5.
- **El cajón:** «Pendiente 1 de 2» con Sofía Paz («¿Preparás la revisión de Nutrición?», Norma Castro, con el tramo
  vencido y «107 comidas registradas» desde la revisión) y «Pendiente 1 de 3» con Martín Acosta; el foco en la pregunta,
  las tres salidas y ningún error de la página. Con «Ocultar nombres», ningún nombre ni inicial en el cajón, el Espacio
  ni el Resumen de los dos profesionales.

**Lo medido en el tramo de TB-50 y TB-51** (corrida 42388223346 de `capturas-del-tablero`, sobre 4f16451, el
2026-11-07, con `main` mergeado): las diecinueve páginas, con las peticiones de la tabla, sin errores de la página, sin
ningún nombre con «Ocultar nombres» y sin fichas de «Tu semana» que se pasen. Las capturas suman la tarjeta de
Antropometría de cada Resumen con sus piezas abiertas (`<página>-antropometria-<ancho>.png`).
- **Diego Sosa (Sofía Paz), dos compartimentos:** «Grasa 15,2 kg 18,8 %» y «Libre de grasa 65,8 kg 81,2 %», con «El
  método no calcula el músculo…». La evolución, con tres tomas (9 ago, 21 sept y 4 nov) y los tres pares; plegada,
  «Cintura −0,3 cm · pliegue abdominal −1,2 mm». **La primera pantalla no cambia:** a 1440 × 900 los valores de los
  indicadores terminan en 829 (lo mismo que en la corrida de TB-24) y a 1920 × 950 los minigráficos, en 915. Abierta, la
  tarjeta mide 965 a 1440.
- **Federico Álvarez (Sofía Paz), el músculo de Lee:** «Grasa 13,5 kg 13,7 %», «Músculo 46,6 kg 47,3 %» y «Resto
  38,5 kg 39,0 %», con el método de cada parte y «Desde la toma del 3 sept: peso −0,1 kg · grasa +0,3 kg · músculo
  −0,7 kg · resto +0,3 kg». La evolución, con tres tomas (29 jul, 3 sept y 7 oct). Abierta, la tarjeta mide 1007 a
  1440.
- **Héctor Funes (Sofía Paz), sin método:** «Peso en las tomas · 86,1 kg», como antes. La evolución, con cuatro tomas y
  dos pares: la cintura (−0,8 cm) y el peso (−0,5 kg), con «Pliegue abdominal: no se midió en estas tomas.» y «Suma de 6
  pliegues: no se midió en estas tomas.». Abierta, la tarjeta mide 759 a 1440.
- **Las peticiones al abrir:** los tres Resúmenes de Sofía Paz, 18, como antes (TA-73: la evolución no suma
  lecturas). El de Martín Acosta dio 15 con tres indicadores; el 2026-11-06 dio 14 con dos: la tabla lo cuenta ahora por
  indicador (TEST-TAG-032).
- **La primera corrida, sobre 4001d9a, falló al cargar la cohorte** («el catálogo no ofrece
  be/masa-grasa-faulkner@1»): De Rose y Guimarães, Faulkner y Würch salieron del catálogo para cálculos nuevos con
  DL-112. Federico pasó al músculo de Lee (TA-84). La segunda, sobre e33fe47, falló solo por el Resumen de Martín Acosta
  (14 → 15), que no tiene Antropometría: el ejercicio principal de Diego cambió con el día de la corrida.

**Lo medido en el tramo de TB-24 y TB-25** (corrida 42180079803 de `capturas-del-tablero`, sobre c14e1ed, con la cohorte
que ya tiene las masas):
- **La pestaña Composición corporal de Diego Sosa (Sofía Paz):** un año, nueve tomas, las nueve partidas con Durnin y
  Womersley y sin cambios de método: «La última toma partida, el 1 nov: 80,9 kg = 65,5 libre de grasa + 15,4 grasa» y,
  del 1 dic 2025 al 1 nov, peso −2,4 kg, grasa −1,6 kg y libre de grasa −0,8 kg. Siete peticiones al abrir: las cuatro
  lecturas de API-ANT-06 de un año y las del marco.
- **La pregunta de «Analizar»:** con los 90 días de la ficha, tres tomas, del 12 ago al 1 nov: peso −0,4 kg, grasa
  −0,5 kg y libre de grasa +0,1 kg.
- **El Resumen de Diego (Sofía Paz):** la tarjeta de Antropometría lleva «Composición de la última toma» plegada, con la
  barra en el renglón; los indicadores pasan a calorías, proteínas, masa grasa (Durnin y Womersley) y suma de 6 pliegues.
  A 1440 × 900, los valores de los indicadores terminan en 829 (808 antes); a 1920 × 950, los minigráficos, en 915:
  entran.
- **El Resumen de Héctor Funes (Sofía Paz):** «Peso en las tomas · 86,2 kg», sin barra; los indicadores caen al peso y a
  los registros. Su tarjeta más alta mide 502 y, a 1920 × 950, sus minigráficos terminan en 969: no entran en la primera
  pantalla. Es la primera vez que se mide su Resumen.
- **Las peticiones al abrir varían de una corrida a otra con la misma página:** el Resumen de Diego dio 18 (22 en la
  corrida de 731b9c3), el de Federico Álvarez 24 (16) y el de Martín Acosta 14 (13). Esta parte suma dos lecturas con
  Sofía Paz (la composición y el cuarto indicador) y dos con Martín Acosta (las series y el RIR), pero la cuenta no lo
  muestra. Una explicación posible, sin verificar: las capturas cuentan hasta 800 ms sin peticiones y, con las lecturas
  de a cuatro, una tanda lenta queda fuera de la cuenta. Hallazgo para TEST-TAG-032 (severidad media: el guardián no
  detecta una subida chica): contar hasta que no quede ninguna lectura en curso. Se arregló en el tramo siguiente (TA-30):
  la causa era una doble lectura de la ficha, no la cuenta.
- **Arreglado después de esa corrida:** el rótulo «100 kg» del eje quedaba cortado a la izquierda, y una masa redonda se
  escribía «17» en lugar de «17,0».

**Lo medido en el tramo de TB-10, TB-16 y TB-49.**
- **El Espacio:** en la corrida 42166891703 (b9d6996), a 1440 × 900, la primera pantalla muestra el encabezado, «Tu
  semana» y las dos primeras personas de la cola, con lugar para una tercera. El alto de 1104 lo pone «Tus asesorados»,
  debajo: no hace falta un arreglo.
- **El Resumen (TB-10):** en la corrida 42172365143, la tarjeta más alta de Diego Sosa (Sofía Paz) mide 466 a 1440 ×
  900 y los valores de los indicadores terminan en 808; a 1920 × 950, los minigráficos, en 915. Al abrir el Resumen, 22
  peticiones con Sofía Paz y 13 con Martín Acosta: una más que antes en cada uno, la lista de solicitudes respondidas de
  TB-49 (TA-23). La cohorte no tiene solicitudes de formularios, así que la tarjeta de TB-49 no aparece en las capturas.
- **Federico Álvarez, visto por Sofía Paz:** en las corridas del 2026-11-06 su revisión de Nutrición del 16 oct está
  aplicada y la próxima es el 16 nov: en Nutrición la cohorte ya no reproduce la revisión registrada sin aplicar, y
  `accionDelMarco` de su Resumen sale vacía. TEST-TAG-010 cubre el caso; para verlo en ese Resumen, la cohorte
  necesitaría una revisión de Nutrición sin aplicar con su fecha relativa a hoy. La de Entrenamiento sí está sin
  aplicar (la registra el día anterior a cada corrida) y se ve en el cajón de Martín Acosta, que ofrece aplicarla
  (TB-15; ver «Para seguir»).

Toda pantalla nueva de /pro que muestre a alguien lee su nombre con `useNombres` (la guardia de `retrato.test.mjs`
falla con un `.displayName` suelto) y, donde ya se ve el nombre, suma `Retrato`; el cajón (TB-12) se suma a
`CON_NOMBRES_OCULTOS` de las capturas, y su retorno es el que le falta a las fichas de «Tu semana». En el Resumen,
`primeraPantalla` anota dónde terminan las tarjetas, los valores de los indicadores y sus minigráficos. Cada corrida de `capturas-del-tablero` deja su
artefacto: se compara con `linea-de-base/mediciones.json` (los altos y las peticiones al abrir, que no tienen que
subir sin aviso). Con poca memoria, un typecheck angosto de los archivos tocados (un `tsconfig` que extiende el del
website e incluye solo esos archivos) detecta los errores de tipo antes de la CI.

### 10.1 Las decisiones de la implementación

Se numeran desde TA-01 (§3). Cada una dice qué se eligió y qué otra opción había. Esperan la ratificación de Dirección.

- **TA-01 · Las capturas, en la CI.** TB-00 pide capturas antes de tocar nada, y esta PC no tiene memoria para levantar
  la API, el website y PostgreSQL juntos. Un trabajo aparte de la CI (`capturas-del-tablero`) carga la cohorte en un
  PostgreSQL efímero y captura cada página. Corre en las ramas `wp-tablero-*`, no bloquea nada y deja las imágenes
  como artefacto, por 90 días; las primeras pantallas se copian a `EVIDENCIA/TABLERO-ALTA-GAMA/`. *Otra opción:* sumar
  las capturas a los recorridos de la CI, que tienen datos más pobres que la cohorte y bloquean la integración.
- **TA-02 · La letra, del paquete Fontsource 5.3.0 y solo con el subconjunto latino.** La propuesta pedía Inter con el
  latino y el latino extendido, `font-optical-sizing`, Poppins desde `BE-material-visual` y un respaldo sobre Segoe UI.
  `next/font/local` no admite un rango de caracteres por archivo ni otro respaldo que Arial, y el latino cubre el
  español: una letra que no está la dibuja el respaldo. Se usa el Inter de pesos (48 KB), sin el eje óptico, y Poppins
  600 del mismo origen (8 KB), las dos con la SIL OFL 1.1. *Otra opción:* `@font-face` escritos a mano, con los dos
  subconjuntos y `size-adjust` medido sobre Segoe UI, a cambio de perder la precarga y el respaldo que calcula Next.
- **TA-03 · El interletrado de Inter a 16 px (−0,011 em), en todo el texto.** Inter es más ancha que el respaldo de la
  línea de base: en la corrida de TB-01, «Analizar» a 1280 × 800 creció 104 px, porque una descripción de las preguntas
  pasó a tres renglones y la lista iguala el alto de todas. Se usa el interletrado que el diseño de Inter da para esa
  medida. No alcanzó: la descripción siguió en tres renglones, y el texto secundario de las preguntas de «Analizar»
  pasó a 13 / 18, el secundario de la escala de la propuesta (A3). *Otra opción:* bajar todo el texto secundario a
  13 / 18, que cambia todas las pantallas y no es de esta parte.
- **TA-04 · Lo no comparable de Antropometría sigue siendo un cuadrado girado lleno.** La propuesta dice que el rombo
  hueco es solo de lo indicado en el plan y no dice cómo va lo no comparable. Se conserva la forma de hoy, que la leyenda
  y la tabla ya explican, 2 px más grande que el punto lleno (a 7 px no se distinguían) y distinta del rombo hueco. *Otra opción:* la vertical
  rotulada del cambio de método (A8), que pide reordenar el gráfico de tomas y su leyenda.
- **TA-05 · Lo elegido en las barras de Entrenamiento, sin el borde del foco.** Donde no hay una marca que rodear (las
  barras por serie), lo elegido es la columna en el fondo suave con la guía fina; en la evolución de una serie, la guía
  y el aro sobre lo registrado. El foco del teclado queda en el marco del gráfico, como en los otros tres. Lo planificado
  de cada sesión pasa de cuadrado a rombo hueco, la forma de lo indicado en «Analizar». *Otra opción:* dejar el
  recuadro ámbar, que se confunde con el foco (A11).
- **TA-06 · La media semanal del minigráfico, desde más de ocho semanas.** D-5 pide, con poco lugar por día, la línea
  cortada y las marcas de la última y de las aisladas, y a 90 días la media de cada semana. Las dos reglas se cruzan: a
  90 días siempre falta lugar. La media semanal va en una serie diaria con menos de 4 px por día y más de 56 días; con
  menos semanas, la línea de los días, cortada. Las sesiones y las tomas no se promedian por semana. *Otra opción:* la
  media semanal con cualquier período corto que no entre, que dibuja tres o cuatro semanas como si fueran una tendencia.
- **TA-07 · El minigráfico del indicador es otro componente.** La comparación de dos etapas usa el minigráfico de
  siempre, con sus bandas y sus fechas; el del Resumen tiene la tira, la media semanal y la grilla adentro. Comparten
  la gramática de las marcas y de las líneas. *Otra opción:* un solo componente con todas las variantes, que mezcla dos
  lecturas distintas.
- **TA-08 · La cuenta de lo que cae fuera de la escala: «N datos sin completar debajo de la escala».** La propuesta
  dice «2 subtotales debajo de la escala», pero lo que queda afuera puede ser también el día en curso o una carga
  rápida (DL-161). Va debajo del minigráfico, solo cuando hay algo afuera. *Otra opción:* nombrar cada clase, que
  alarga el pie.
- **TA-09 · «Ocultar nombres» está en el menú de la cuenta y oculta a todos, también a la cuenta.** El menú es donde
  viven las preferencias y está en todas las páginas de /pro, que es donde rige. Con los nombres ocultos, cada persona
  se ve por su referencia neutral («Asesorado · a9be23», DL-040), cada profesional por «Profesional · 1a2b3c» y nadie
  lleva iniciales; el círculo del menú pasa al ícono «oculto», para que se sepa en cualquier página. Lo exportado
  (Analizar, la lámina) dice lo mismo que la pantalla. Ningún título de pestaña lleva un nombre, porque queda en el
  historial del navegador. *Otra opción:* un botón en el encabezado del Espacio, que no se ve desde la ficha, u ocultar
  solo a las personas, que deja los nombres de los colegas en las notas.
- **TA-10 · El monograma del menú sale de los vínculos ya leídos, sin una lectura nueva.** Es el nombre con que las
  personas ven al profesional (su perfil profesional, DL-040), que viene en los vínculos que leen el Espacio y la
  ficha; vive en la memoria de la pestaña, como la sesión. En una página que no los lee, recién abierta, el menú sigue
  con su dibujo. *Otra opción:* leer `/me/profile` en cada página de /pro, que suma una petición al abrir (TEST-TAG-032)
  y trae el nombre del perfil propio, que puede no ser el profesional. El saludo de TB-06 decide su fuente.
- **TA-11 · Los textos que arma la API con un nombre adentro se arreglan en el website.** El título y el texto de una
  novedad y «Corregida por …» en la Línea de tiempo cambian cada nombre conocido por su referencia
  (`textoSinNombres`); el «Para:» de una nota, que es una lista de nombres, no se muestra con los nombres ocultos. Lo
  que alguien escribió a mano (el texto de una nota) no se toca: no se puede saber qué es un nombre. *Otra opción:* que
  la API los arme sin nombres, que cambiaría API-NOV-01, que leen las APK instaladas (DL-152).
- **TA-12 · En las novedades del profesional, el monograma ocupa el lugar del ícono.** Una novedad con quien la
  originó lleva su monograma; las que emite BE (un recordatorio) siguen con su ícono. En la cuenta de la persona no
  cambia nada: el rostro de sus profesionales llega con TB-20 y TB-23. *Otra opción:* el monograma y el ícono juntos,
  que en un renglón de 1440 suman dos marcas antes del título.
- **TA-13 · Una revisión registrada desde siete días antes de la fecha acordada es la de esa fecha.** La acción del
  marco (TB-09) no vuelve a pedir «Preparar la revisión» por una fecha que ya se revisó: aplicada esa revisión, la
  fecha que queda en el plan vigente es de un ciclo cerrado, y lo que sigue es su borrador o, si no hay, nada (D-6:
  «no sigue como vencida»; la cola de TB-14 trae «Sin revisión acordada»). Una revisión anterior a esa ventana (la que
  reprogramó la fecha, por ejemplo) no cuenta. Es la misma ventana de siete días que ya decide si una revisión «es de
  la semana». *Otra opción:* el orden de la cadena tal cual, que después de aplicar un «Ajustar» ofrecía otra vez
  preparar la revisión en lugar de seguir su borrador: el mismo defecto que arregla TB-09, un eslabón más abajo.
- **TA-14 · En «Tus asesorados», el renglón entero abre la ficha, y el detalle de cada vínculo queda en la ficha.**
  Antes, el renglón desplegaba la finalidad, el estado y el inicio de cada vínculo, y «Abrir» iba aparte. TB-08 pide
  la fila entera como destino: el detalle está en «Acceso actual», en el marco de la ficha, y en el renglón quedan las
  áreas con acceso y las sin acceso con sus estados en palabras. «Con vos desde» es el vínculo vigente más antiguo,
  aceptado o en pausa: uno que terminó no cuenta. *Otra opción:* conservar el desplegable a la derecha del renglón, que
  deja dos blancos por persona y uno de ellos sin la ficha.
- **TA-15 · «Tu semana» tiene ocho días, de hoy a hoy + 7.** Es la ventana con que la API llama «próxima» a una
  revisión (`VENTANA_DE_REVISION_DIAS`, de 0 a 7 días): con siete columnas, las del octavo día no estarían en ningún
  lado de la franja. Las vencidas van aparte, en «Vencidas», con su borde discontinuo y sin color de alarma. «y N más»
  abre el resto de ese día en el lugar, y «Ver como lista» vale por la visita. Cada ficha lleva a lo que resuelve la
  revisión, como «Abrir» en «Pendientes»; volver a /pro con el lugar guardado llega con el cajón (TB-12). *Otra
  opción:* siete columnas, de hoy a hoy + 6, con las del día 7 solo en «Pendientes».
- **TA-16 · Propuesta: TB-06 se programa junto con TB-11.** Las cifras de TB-06 filtran «Te toca a vos» y llevan a
  «Esperan respuesta», que es uno de los dos carriles de TB-11: hechas antes, o filtran la lista de hoy con un estado
  que TB-11 vuelve a armar, o llevan a un carril que no existe. Juntas, el encabezado, las cifras y los carriles se
  prueban y se recapturan una sola vez. No cambia el alcance ni el orden de las demás partes: TB-10, TB-16, TB-24,
  TB-25 y TB-49 pueden ir antes. *Otra opción:* TB-06 sola, con «Esperan respuesta» llevando por ahora a «Pendientes»
  filtrado por formularios, y TB-11 rehaciendo ese destino.
- **TA-17 · El tramo empieza en la última revisión o, si el plan vigente se activó después, en su activación.** La
  propuesta dice «de la última revisión a la fecha acordada». Cuando una revisión se aplica con un plan nuevo, la fecha
  se acuerda al activarlo: desde la revisión, el tramo contaría como transcurridos los días en que ese plan todavía no
  regía. Sin ninguna revisión, el ciclo empieza con el plan. La frase de la barra dice cuál es («desde la revisión del
  16 oct» o «desde que rige el plan, el 17 oct»). *Otra opción:* siempre desde la última revisión, y sin revisión, sin
  barra.
- **TA-18 · Las sesiones por ejercicio van de más a menos sesiones, no en el orden del plan.** El orden del plan pide
  leer el plan (una lectura más) y, si en el período rigieron dos versiones, no hay un solo orden. Con las mismas
  sesiones, por nombre. *Otra opción:* leer el plan vigente y ordenar por él.
- **TA-19 · «Desde la revisión», con las palabras del dominio, y cada dato una sola vez en la tarjeta.** La propuesta
  llama a la pieza «Desde tu revisión»; la §2 conserva «Desde la revisión» como garantía del dominio, y las cifras se
  parten sin reescribirse. Con el tramo dibujado, el pendiente «Próxima revisión» no se repite debajo: el tramo lleva la
  misma fecha y la cuenta. Los anulados y los rectificados pasan de la cobertura plegada a la barra partida, a la vista.
  *Otra opción:* «Desde tu revisión», que reescribe un texto del dominio, y el pendiente repetido.
- **TA-20 · La pieza de Antropometría va con TB-24.** TB-10 pide en esa tarjeta «la barra de la composición de la última
  toma, con la línea de las tomas como respaldo cuando no hay método»: es la pieza de D-11. Hecha acá, la línea de las
  tomas se dibujaría sola y la próxima parte la cambiaría. *Otra opción:* la línea de las tomas (R-6) ahora, con su
  lectura, y la barra después.
- **TA-21 · «Empezar el plan» en miniatura, con el botón secundario.** Los tres pasos dicen cuál toca (la evaluación,
  el objetivo o el plan) con una lectura de las evaluaciones del área, una por área sin plan (A15). El botón deja de
  ser lleno: la acción del momento ya está en el marco (TB-09), y con dos áreas sin plan había dos botones llenos. Si
  la lectura falla, quedan las palabras de antes y el botón. *Otra opción:* el botón lleno, sin los pasos.
- **TA-22 · El período de la persona nueva se corrige al llegar los vínculos, sin demorar a nadie más.** El marco lee
  el resumen de la ficha (API-DSH-03) y los vínculos a la vez; el período depende de los vínculos. Si los vínculos lo
  acortan, ese primer resumen no se muestra y la ficha vuelve a leer con el período correcto: una persona de menos de 90
  días lee dos veces al abrir la ficha; las demás, como hoy, sin una lectura ni una espera de más. Cuenta solo un
  vínculo aceptado: en pausa, pendiente o terminado, esa área no se ve. Un registro cargado después con una fecha
  anterior al vínculo queda fuera del período por omisión y se ve eligiendo otro: el recorrido «completitud», que vincula
  a la persona hoy y siembra registros de los días anteriores, elige 30 días. *Otra opción:* leer primero los vínculos y
  después el resumen, que suma una espera a todas las fichas; o guardar el inicio en la URL, que lo vuelve un período
  elegido.
- **TA-23 · «Lo que contó al empezar» lee lo que ya lee la pestaña Información, y solo lo pedido.** La lista de
  solicitudes respondidas de este profesional (API-FRM-04, con `status=RESPONDED`) y, de las dos más nuevas, su detalle
  (API-FRI-03) y la versión de su formulario (API-FRI-01): hasta cinco lecturas más al abrir el Resumen, y una sola
  (la lista) si no hay ninguna respondida. Las demás se nombran con un enlace a la pestaña. Lo que la persona compartió
  de sus hábitos sin que el profesional lo pidiera (HBT-05) no entra: no es «lo que contó al empezar» a este
  profesional, y ya tiene su tarjeta en la pestaña. *Otra opción:* leer el detalle de todas las respondidas (una
  lectura por solicitud y por versión), o mostrar solo la lista, sin las respuestas, que no cumple TB-49.
- **TA-24 · La composición lee API-ANT-06 en tramos de 92 días, solo con el peso y las masas.** API-ANT-06 lee hasta 92
  días por pedido y acepta varias métricas en `metric=`. La pieza pide el peso, las dos masas de Durnin y Womersley y de
  Faulkner, las dos de Lee y la de cuatro componentes, y un período más largo se lee en tramos seguidos (un año son
  cuatro lecturas). Los grupos de comparabilidad se nombran por respuesta, así que se juntan por lo que son (protocolo,
  método y unidad). En la pestaña, la sección abre con un año, porque las tomas son cada cuatro a seis semanas; en
  «Analizar», usa el período de la ficha. *Otra opción:* la proyección `ANTHROPOMETRY_LONGITUDINAL` de API-PRJ-01, que
  lee 366 días pero una métrica por pedido (hasta ocho lecturas), o la pieza con 92 días como tope, que en la consulta
  muestra dos o tres tomas.
- **TA-25 · La pregunta de la composición vive en el website, responde con la pieza y no se guarda como vista.** Su
  identificador (`pregunta=composicion-del-peso`) no entra en `ID_DE_PREGUNTAS`, que API-VAN valida al guardar una vista:
  sumarlo cambiaría lo que acepta la API, y TB-24 no la toca. No tiene nada que elegir: el período es el de la ficha y el
  método se elige en la pieza. La propuesta decía que la pregunta arma el peso y las dos masas «Juntas»; con la pieza, la
  pregunta se responde partida por toma, y «Ver peso y masas «Juntas»» abre esa vista, con el resto de «Analizar». Va
  entre las principales solo si el profesional ve Antropometría. *Otra opción:* sumar el identificador al dominio, que
  pide redesplegar la API junto con el website, o las tres métricas «Juntas», que es lo que ya se podía armar a mano.
- **TA-26 · La tarjeta de Antropometría lee la ventana de 92 días que termina en la última toma.** Es una lectura más al
  abrir el Resumen, solo con Antropometría y alguna toma. La barra es la de la última toma partida, con su método y su
  fecha; las diferencias, desde la toma partida anterior del mismo método y protocolo (con otro, «no se comparan»); una
  toma posterior con solo peso se dice aparte. Sin ninguna toma partida, «Peso en las tomas», la línea de los pesos de la
  misma lectura (R-6). La barra no depende del período del Resumen: es la última toma, con su fecha. *Otra opción:* el
  detalle de la última evaluación, que no trae la anterior para las diferencias, o la proyección del período, que con 7 o
  30 días puede no tener ninguna toma.
- **TA-27 · Un método por gráfico, elegido en la pieza.** Abre con el método de la toma partida más reciente; las tomas
  partidas con otro van sin partir, con su método escrito en la tabla («Partida con Faulkner, en su propio gráfico»), y
  con dos métodos en el período se elige cuál se mira. La elección no se guarda. Una toma con los dos se parte con el que
  se mira. La columna se parte cuando las dos masas suman el peso con 0,15 kg de diferencia como máximo, porque cada masa
  viene redondeada a 0,1 kg (DL-112); si las diferencias de las partes no suman exacto la del peso, la pieza lo dice.
  *Otra opción:* dos gráficos, uno por método, que duplica el alto de la pieza para un caso raro.
- **TA-28 · Las áreas del profesional son las que ve en esta ficha.** Son las lecturas del período que respondieron
  (Nutrición, Entrenamiento y Antropometría), sin una lectura nueva: lo que mira con esta persona, no lo que declaró en
  su perfil. La tabla de la propuesta no dice qué va con Nutrición y Entrenamiento juntas: calorías, proteínas, la carga
  de la serie principal y la masa grasa (o el peso) si ve Antropometría; si no, los registros. Un lugar sin su dato toma
  su respaldo (la masa grasa, el peso; la suma de pliegues, los registros) o queda vacío: hay menos de cuatro, y el
  Resumen ofrece elegir. *Otra opción:* las áreas del perfil profesional, que piden una lectura más y no dicen qué ve con
  esta persona; o completar los cuatro con lo que haya, que pone un indicador que el profesional no eligió ni le toca.
- **TA-29 · «Series por semana» son las series registradas del ejercicio principal, sesión a sesión.** La referencia de
  un indicador (la que guarda API-VAN) no lleva grano, y el Resumen pide cada métrica en el grano de sus observaciones;
  las series de un ejercicio se cuentan por sesión, con el total del período como valor. La suma por semana está en
  «Analizar», agrupando por semana. El ejercicio principal es el de más sesiones en el período (el de la carga); el RIR es
  el de su primera serie. *Otra opción:* sumar el grano a la referencia, que cambia lo que guarda y acepta API-VAN, o
  agrupar por semana solo en el Resumen, que dibujaría distinto lo mismo que una vista guardada.
- **TA-30 · El guardián de las peticiones cuenta hasta que la API queda quieta, y la cuenta es exacta.** El hallazgo de
  TEST-TAG-032 (con el mismo código, el Resumen de Héctor contó 24 y después 18) no era de la medición sino de la
  ficha: la cobertura del Resumen (y de «Analizar») pregunta por las tres áreas, y el área que el profesional no ve
  responde «no disponible». Si esa respuesta llegaba antes que la del marco, el aviso se miraba contra el encabezado en
  «cargando», que da todas las áreas por activas: el marco volvía a preguntar el acceso, descartaba su primera lectura
  y, al comparar con «cargando», daba el acceso por cambiado y repetía todas las lecturas de la ficha (seis peticiones
  más, y el doble de espera). Ahora el aviso que llega mientras el marco lee espera su respuesta y se mira contra lo
  que trae; una revalidación programada no descarta una lectura en curso. Las capturas cuentan hasta que no queda
  ninguna petición en curso y pasa 1,5 s sin una nueva, y comparan con una tabla exacta (`peticiones.mjs`): una parte
  que suma o quita una lectura la declara ahí, en el mismo commit. De paso, la lista de nombres de TEST-TAG-004 salía
  vacía (el punto de «Lic.» iba sin escapar y quitaba toda palabra): ahora busca los nombres de verdad. *Otra opción:*
  dejar la ficha como estaba y medir con un margen de seis peticiones, que esconde justo una subida chica como las dos
  lecturas de TB-24 y TB-25.
- **TA-31 · El saludo va debajo del título, que sigue siendo «Espacio profesional».** «Buen día» de 5 a 12, «Buenas
  tardes» de 12 a 20 y «Buenas noches» el resto, con la hora del navegador, y la primera palabra del nombre con que la
  ven las personas (TA-10) que no sea un título («Lic.», «Dra», «Prof.»); sin nombre todavía, o con «Ocultar nombres»,
  a secas. El título de la página no cambia: el lector de pantalla y la pestaña siguen diciendo dónde se está. *Otra
  opción:* el saludo como título, que deja la página sin nombre propio.
- **TA-32 · Las vistas de «Pendientes» pasan a las cifras.** «Te toca a vos» y su desglose (Revisiones, Planes y Tomas)
  son botones con `aria-pressed` que filtran el carril; tocar el elegido vuelve a «Todo». La fila de vistas sale de la
  tarjeta, que conserva «Más filtros» (el área, un tipo exacto y el período del último registro) y suma «Por persona /
  Por pendiente». «Formularios» deja de ser una vista: los formularios van a «Esperan respuesta». *Otra opción:* dejar
  las vistas también en la tarjeta, dos controles del mismo estado en la misma pantalla.
- **TA-33 · «Esperan respuesta» va por antigüedad, sin selector.** Los formularios sin responder (de la cartera, con el
  monograma y «Ver la solicitud»), las solicitudes de vínculo sin responder (sin monograma, «Ver las solicitudes» abre
  la lista) y las invitaciones sin usar («Todavía sin persona», con el área y el vencimiento; «Ver las invitaciones»
  abre el cuadro de invitar, donde se anulan). Lo que espera hace más va primero. La lectura nueva es la de las
  invitaciones (`state=PENDING`), que se repite al cerrar el cuadro de invitar. «Personas» cuenta las de «Tus
  asesorados» y se desglosa por área con acceso. *Otra opción:* el selector «Por persona / Por pendiente» también acá,
  que no sirve para las invitaciones, que todavía no tienen persona.
- **TA-34 · Por persona es el modo por omisión, y la elección se recuerda en el navegador.** Es lo que pide D-4; «Por
  pendiente» es la tabla de DL-107 tal cual, a un clic. Se guarda solo el modo, sin datos de personas, y sin
  almacenamiento vale por la visita. *Otra opción:* que no se recuerde, y quien prefiere la tabla la elige en cada visita.
- **TA-35 · La mesa: «Te toca a vos» a la izquierda y, a la derecha, «Esperan respuesta» encima de «Tus asesorados».**
  Desde 75 rem, como el corte que ya tenía el Espacio; más angosto, uno debajo del otro. Las cifras de «Esperan
  respuesta» y «Personas» llevan a su sección, que toma el foco. *Otra opción:* tres columnas, que a 1440 deja «Te toca a
  vos» demasiado angosto para el renglón de cada pendiente.
- **TA-36 · El cajón lee dos cosas por cuadro, y solo del cuadro actual.** El resumen de la persona (API-DSH-03, con los
  90 días por omisión) y, si el área tiene una revisión registrada, lo nuevo desde ella (API-DSH-04 con `since` y una
  página, la misma lectura que la tarjeta del Resumen); en Antropometría, solo la primera. Con eso, el cuadro dice la
  pregunta, quién y el área, el pendiente con su último registro (de la cartera, sin leer), el tramo del ciclo (TB-10)
  y lo nuevo desde la revisión en cifras, con la misma síntesis del Resumen. *Otra opción:* el Resumen entero de la
  persona en cada cuadro, que son 18 lecturas.
- **TA-37 · Las salidas y el cierre.** En una revisión, «Preparar la revisión», que abre la revisión nueva ya preparada
  (TB-09); en lo demás, el verbo de la fila, a la misma pantalla; «Abrir la ficha» y «Saltear por ahora». «Anterior» y
  «Siguiente» recorren sin saltear. La pregunta de cada tipo es corta («¿Preparás la revisión de Nutrición?», «¿Seguís
  el borrador de Entrenamiento?», «¿Empezás el plan de Nutrición?», «¿Seguís la toma en preparación?»). El cierre dice
  «Llegaste al final de esta vista.», nombra los salteados con un enlace a cada uno y ofrece «Volver al primero»: sin
  cuentas, festejos ni tachados. *Otra opción:* un cierre con «Revisaste 3 de 5», que es una cuenta de lo hecho.
- **TA-38 · El lugar para volver vive en la pestaña, con identificadores, por dos horas.** Al salir por una salida se
  guardan la cola (tipo, área e `identityId` de cada pendiente), dónde se estaba y los salteados en `sessionStorage`; al
  volver a /pro con el cajón prendido, se abre en el siguiente que todavía esté en la cola (lo resuelto ya no está), y
  el lugar se usa una sola vez. /pro sigue sin parámetros. *Otra opción:* el lugar en la dirección de /pro, que el
  retorno del inicio de sesión no admite.
- **TA-39 · El interruptor es una variable de la compilación.** `BE_CAJON_DE_A_UNA=si`, inyectada por
  `next.config.mjs` como las demás (sin `NEXT_PUBLIC_`); solo la prende la compilación de `capturas-del-tablero`, y
  Render no la define. Apagado, «Empezar por el primero» no se muestra y el botón lleno es «Invitar a una persona»;
  prendido y con algo en la cola, el lleno es «Empezar por el primero» e «Invitar a una persona» pasa a secundario.
  *Otra opción:* una constante en el código, que pide un commit para recapturar y otro para apagarla.
- **TA-40 · «¿Cuándo la revisás?» pide elegir, también «Sin fecha por ahora».** D-6 la quiere «con nada elegido»: si no
  elegir valiera como «sin fecha», BE elegiría por el profesional el caso que más se escapa (un plan sin revisión
  acordada sale de la cola). En la revisión, registrar sin elegir dice «Elegí cuándo la revisás, o “Sin fecha por
  ahora”.» en el resumen de errores, como cualquier campo; en el cuadro de activar, el botón lleno espera a que se elija
  (como el motivo de DL-033) y debajo de las opciones se dice qué falta. Con «Finalizar» no se pregunta: no hay próxima.
  Las opciones son en 1, 2 o 4 semanas desde hoy, una fecha a elección o «Sin fecha por ahora», y cada una dice la
  fecha que resulta («En 1 semana · miércoles 11 nov», con el día como lo dice el tramo del ciclo). *Otra opción:* la
  pregunta opcional, que es el campo de antes con botones.
- **TA-41 · «Sin fecha por ahora» dice lo que BE hace hoy, no lo que hará la cola de TB-14.** La API no borra la
  revisión acordada cuando se aplica una revisión o se activa una versión sin fecha (`fijarProximaRevision` se llama solo
  con una fecha): la que estaba sigue, y en la cartera puede seguir vencida (es la divergencia que prueba TB-13, en la
  rama de la API). Por eso, en la revisión: «Al aplicar esta revisión no se acuerda una fecha nueva: la revisión que ya
  estaba acordada no cambia.»; al activar una versión sobre otra, lo mismo con «Al activar»; y solo al activar el primer
  plan, «Sin fecha acordada, esta área no aparece en las revisiones de «Te toca a vos».». Cuando TB-13 y TB-14 cambien
  la cola, estos textos cambian con ellas. *Otra opción:* el texto de la propuesta («esta área no aparece en las
  revisiones de Pendientes») en todos los casos, que hoy es falso en la revisión.
- **TA-42 · Aplicar desde el cajón: la segunda lectura del cuadro es la revisión, y escribe una pieza propia.** Con una
  revisión registrada y sin aplicar (`lastReview.application` en null en API-DSH-03, y el pendiente es una revisión), el
  cuadro lee esa revisión (API-NUT-19 o API-TRN-23) en lugar de lo nuevo desde ella: siguen siendo dos lecturas, y lo
  que va antes del botón (el resultado, el fundamento, la próxima acción y el efecto con su fecha) sale de ahí. API-TRN-23
  ya existía en la API sin un método en el cliente: `consultarRevisionDeEntrenamiento` lo suma, sin tocar la API ni lo
  que leen las APK. El botón es el de cada área («Aplicar continuidad», «Aplicar próxima acción»), y los textos y los
  conflictos salen de `advisees/aplicar-la-revision.ts`, que ahora usan también las dos listas de Revisiones. La
  escritura vive en `aplicar-en-el-cajon.tsx`, la única pieza del cajón que escribe: TEST-TAG-009 sigue mirando que el
  cajón no escriba. Sin la revisión leída no se ofrece aplicar. *Otra opción:* leer el contexto de la revisión
  (API-NUT-17 o API-TRN-21), que trae el período entero; o un verbo común para el cajón, distinto del de Revisiones.
- **TA-43 · Lo aplicado se dice en su cuadro y en el cierre, y la cartera se relee al cerrar el cajón.** En el cuadro:
  «Se aplicó la revisión de Nutrición.», lo que hizo (con las palabras de la lista de Revisiones), «Seguir el borrador»
  si se preparó uno, «Abrir la ficha» y «Siguiente». En el cierre, «Lo que aplicaste:» y un renglón por persona y área
  («… · se aplicó la revisión»), sin cuentas, como los salteados. La fila de «Te toca a vos» sigue hasta que /pro relee
  la cartera, al cerrar el cajón: releer con el cajón abierto movería la cola mientras se recorre. Lo aplicado se guarda
  por la clave del pendiente, sin nombres, y solo mientras el cajón está abierto. *Otra opción:* releer al aplicar, o
  sacar el cuadro de la cola, que cambia la posición («Pendiente 2 de 3») debajo del profesional.
- **TA-44 · Al activar, la fecha que ya tenía la versión viene elegida, y se dice.** Una versión que preparó una
  revisión con «Ajustar» o «Sustituir» trae la fecha que el profesional eligió en esa revisión (API-NUT-20 y API-TRN-24
  la copian al borrador). «Nada elegido» es la regla para lo que BE elegiría; esa fecha la eligió él: va en «Elegir una
  fecha», con «Es la fecha que ya tenía esta versión.», y se puede cambiar o pasar a «Sin fecha por ahora». Sin fecha,
  nada elegido. *Otra opción:* nada elegido siempre, que pide volver a elegir lo que se acordó en la revisión.
- **TA-45 · En la revisión, lo que se acordó la última vez va como dato.** «La última vez acordaste revisar a las 4
  semanas.»: de la última revisión registrada con una fecha a esa fecha, en semanas si son justas y si no en días. Es lo
  que el profesional acordó, no el tiempo que pasó, y no es una opción elegida. Al activar no se dice: no hay una
  revisión de la que salga. *Otra opción:* «El ciclo anterior fue de 4 semanas», contado hasta que se revisó, que mezcla
  lo acordado con cuándo se hizo.
- **TA-46 · Volver al Espacio: el lugar en la pestaña y `origen=espacio` en el destino.** Con el cajón apagado, cada
  ficha de «Tu semana» y cada verbo de «Te toca a vos» guardan, al abrirse, el filtro (los tipos y el área), el modo,
  el período del último registro y lo que se abrió, con hasta veinte de lo que seguía en la vista: solo identificadores,
  en `sessionStorage`, dos horas y una sola vez, como el lugar del cajón (TA-38). El destino lleva `origen=espacio`, y el
  marco del área ofrece «Volver al Espacio profesional, donde estabas», que va a /pro sin parámetros; cambiar de sección
  dentro del área pierde el parámetro y el marco vuelve a ofrecer la ficha, pero la barra de marca y el botón de volver
  del navegador llegan a /pro con el lugar igual. Al entrar, /pro lee el lugar antes que la cartera (el período va a la
  API: no hay una lectura de más), restituye el filtro, el modo y el período y, con la cartera leída, lleva el foco a lo
  que se abrió; si ya no está, a lo que seguía, y lo dice («Lo que abriste ya no está en la lista: quedaste en lo que
  seguía.»). Con el cajón prendido, salir por el cajón guarda también este lugar, para rearmar la cola con la misma
  vista, y al volver manda el cajón. *Otra opción:* el lugar en la dirección de /pro, que el retorno del inicio de sesión
  no admite (TA-38); o solo restituir el filtro, sin el foco, que deja al profesional buscando la fila.
- **TA-47 · Lo de los editores (TB-48) vive en el website, y los topes son lo que no deja guardar.** La nota de un ítem
  va en un renglón debajo del ítem, con el texto a pedido de Entrenamiento («Agregar una nota sobre Arroz», y con texto,
  «Nota para la persona» y «Cambiar»): no ensancha la tabla con una columna casi siempre vacía y se lee junto a su
  ingrediente, como en la app. Los topes salen del contrato (una prueba compara cada número con su esquema) y se
  cuentan con lo que no deja guardar, en `advisees/topes-del-plan.ts` y no en el dominio (§8.2): un tope pasado se lista
  con su lugar, lleva a él y frena el autoguardado, como un nombre vacío, y el aviso dice «Hay más elementos de los que
  admite un plan. Quitá los que sobran antes de guardar.». Agregar no se apaga al llegar al tope: el problema aparece
  al guardar, antes de pedirle nada a la API. *Otra opción:* apagar «Agregar» en el tope, que no explica por qué y no
  sirve para un borrador que ya los pasó (una plantilla vieja, por ejemplo).
- **TA-48 · Duplicar: la copia va justo después, es del mismo plan y copia todo lo escrito.** Sin identificadores de nodo
  (el servidor los asigna al guardar, como al insertar un habitual), con «… (copia)» en el nombre, dentro del largo del
  contrato, y con ese nombre a la vista para cambiarlo; la de un ejercicio no tiene nombre propio: nace abierta, y se
  dice dónde quedó («Se duplicó. La copia está justo después.»). Copia las cantidades, las cargas y las notas, porque
  son del mismo profesional para la misma persona; una plantilla no las copia porque sale del plan (DL-108 D-2). Una
  sesión copiada no entra en la agenda hasta tener días. Vive en `advisees/editar-la-estructura.ts` (§8.2). *Otra
  opción:* copiar sin cantidades ni cargas, como una plantilla, que obliga a volver a escribirlas; o la copia al final,
  lejos de lo que se copió.
- **TA-49 · Reordenar: «Subir» y «Bajar» donde la lista se pliega, «Mover antes» y «Mover después» donde se mira uno por
  vez.** Las comidas y los ejercicios, con dos botones en su renglón abierto (el nombre, para el lector de pantalla:
  «Bajar Almuerzo»); el día tipo y la sesión, en su menú, apagados con su motivo en las puntas («Ya está primero.»). Las
  opciones no se reordenan: son las alternativas de un carrusel y la persona elige una, y nadie lo pidió. Los
  identificadores viajan con su nodo: la agenda no pierde los días de una sesión movida. *Otra opción:* arrastrar y
  soltar, que pide un segundo mecanismo para el teclado y el lector; o reordenar también las opciones.
- **TA-50 · Cada serie se quita en su fila.** Un botón por serie, el mismo de un ítem de Nutrición («Quitar la serie 2 de
  Sentadilla», para el lector), en lugar de «Quitar la última serie». Las demás conservan lo suyo y se numeran de nuevo.
  *Otra opción:* dejar también «Quitar la última serie», que es una segunda forma de hacer lo mismo.
- **TA-51 · El microciclo se ofrece siempre, y las sesiones sueltas pasan a la «Semana 1».** Con sus identificadores y
  sus días, sin volver a escribir nada; el menú lo dice debajo de la acción. Si el bloque tiene más sesiones de las que
  admite un microciclo (14), la acción se apaga con su motivo: a diferencia de TA-47, crearía el exceso de una vez, sin
  que el profesional agregue nada. *Otra opción:* dejar que el tope aparezca al guardar, como en TA-47; o repartir las
  sesiones en varias semanas, que es decidir por el profesional cómo se organizan.
- **TA-52 · «Revisar el plan» lista lo que queda sin completar, y no bloquea.** Lo sin completar es lo que la persona ve
  sin el dato que el profesional suele escribir: un ítem sin cantidad (la app dice «Sin dato»), un ejercicio sin series
  y una serie sin repeticiones fijadas. La carga, el criterio de intensidad, el descanso y las notas son opcionales por
  diseño (DL-122): que falten no es incompleto. Cada cosa lleva a su lugar, como un problema, pero no cuenta en el
  renglón de su comida o de su ejercicio, no se pinta y ni guardar ni activar la leen. El nombre del botón cambia en el
  dominio (`validarPlan`, con «No hay nada que impida activar.» en lugar de «Plan válido» y la aclaración de
  Entrenamiento); los textos nuevos, en el website. *Otra opción:* decirlo también en el cuadro de activar, que suma un
  paso al acto; o contar la carga sin escribir, que empujaría a escribir una carga que el profesional decidió no fijar.
- **TA-53 · «Guardar como plantilla», un botón con su texto.** Al lado de «Revisar el plan». Cuando no se puede (una
  opción de receta en Nutrición; algo que no deja guardar en Entrenamiento), apagado con `aria-disabled`, con el
  motivo como su descripción y, al tocarlo, en un aviso. *Otra opción:* un menú «Más» con texto, que vuelve a esconder
  la única acción que tiene.
- **TA-54 · La receta, con un buscador sobre lo leído.** API-REC-02 no busca por texto: el cajón lee todas las propias
  de a 50 (su máximo), hasta 10 páginas, al abrirse, y filtra en el navegador por todas las palabras del nombre, sin
  tildes; con más, «Ver más», y avisa que la búsqueda mira las ya leídas. *Otra opción:* sumar un parámetro de texto a
  API-REC-02, que toca la API (en su rama) para una lista que cabe en una lectura.
- **TA-55 · Las zonas de un ejercicio propio, con un selector por zona y la figura de siempre como vista previa.** Las
  17 del catálogo (`ZONAS_MUSCULARES`), en su orden, con «No la nombra», «Principal» o «Secundaria» (los nombres de la
  figura), sin porcentajes; la figura no se toca. El botón aparece en la tarjeta solo con la ficha visual leída, que da
  la versión vigente y el número de la última asignación (`expectedZonesVersion`); un conflicto se dice. *Otra opción:*
  elegir tocando la figura, que pide ubicar cada clic sobre las máscaras (lugares nuevos, que no se inventan); o dos
  listas de casillas, «Principales» y «Secundarias», donde una zona podría quedar en las dos.
- **TA-71 · «Tu semana»: el nombre en hasta dos renglones, el área debajo y, en una columna angosta, el monograma
  arriba.** La galería de capturas del PR mostró, a 1280 y a 1440, nombres que pisaban la columna de al lado («Norma
  Castro» la raya de «Hoy»; a 1280, «Diego Sosa» la de «mar 10»), y con Martín Acosta también a 1920 («Federico
  Álvarez» y el área «Entrenamiento»). La causa: la lista de fichas de cada día es una grilla con una columna implícita
  que crecía hasta el nombre entero en un renglón, así que la elipsis que ya tenía el nombre nunca cortaba. Ahora esa
  columna no crece (`minmax(0, 1fr)`); el nombre, o la referencia con «Ocultar nombres», va en hasta dos renglones,
  partido entre palabras, y lo que sobra se corta con «…»; entero queda en el texto del enlace, que es lo que lee el
  lector de pantalla, y en el título. El área va debajo del monograma y del nombre, a todo el ancho de la columna, y si
  no entra se corta con «…». En una columna de 7,5 rem o menos (a 1280, con las vencidas, son nueve columnas de 107 de
  contenido) el monograma va arriba, el nombre y el área toman todo el ancho y el área va en palabras, sin su ícono:
  «Agustina», «Asesorado ·» o «Entrenamiento» no entran al costado de un monograma en esa columna, y la palabra entera
  dice más que el ícono con la palabra cortada. Lo decide el ancho de la columna (una consulta de contenedor), no el de
  la ventana. El nombre pasa a 0,94 rem, para que a 1440 «Asesorado» entre entero al costado del monograma (la
  referencia va en dos renglones: «Asesorado / · 1d4ace») y «Diego Sosa» siga en uno. Para no empujar la cola hacia
  abajo, «Tu semana» pierde el margen de abajo, que se sumaba al aire entre secciones y era el único doble del Espacio:
  en la corrida 42234954294, a 1440 × 900, la tarjeta termina en 531 (520 antes) y la segunda persona de «Te toca a
  vos», en 911 (916 antes). Las capturas miden en cada tamaño, en los dos temas y con los nombres ocultos que el
  monograma, el nombre y el área de cada ficha queden adentro de su columna (`tu-semana.mjs`), y la corrida falla si
  algo se pasa o si no midió ninguna ficha; con los nombres ocultos guardan «Tu semana» sola, para ver la referencia.
  *Otra opción:* un solo renglón con «…», que no cambia ningún alto pero deja la referencia en «Asesorado…», igual para
  todas las personas, y los apellidos cortados a 1280 y a 1440; o sacar las vencidas de la fila de los días, que cambia
  lo que decidió TA-15.
- **TA-72 · Lo que se cuenta va en enteros y, con todos los valores iguales, se abre uno de cada lado.** En la galería
  de capturas del PR, el Resumen de Diego visto por Martín Acosta tenía 4 series registradas de Dominadas en cada una de
  sus 10 sesiones y RIR 1 en todas: la escala decía «3,99» y «4,01», y «1,00». Con todos los valores iguales, el
  margen salía del 5 % del valor, y el paso de la grilla bajaba a centésimos. La escala la decide la unidad, en el mismo
  lugar que la escala mínima de TB-04 (2 kg, 2 cm o 4 mm): `escalaDeLaUnidad`, en `geometria.ts`, que usan los dos
  minigráficos. Las series registradas («series»), las repeticiones («rep»), el RIR, los registros de comida y las
  sesiones se cuentan enteros (las sesiones todavía no tienen una serie propia en un minigráfico: si la tienen, entran
  con su unidad). Su grilla va de a 1 como mínimo y, donde la de A14 pondría 2,5, de a 2; con todos los valores
  iguales, se abre uno de cada lado: 4 series, con la grilla en 3, 4 y 5 y los puntos sobre la del 4; RIR 1, en 0, 1 y
  2, porque lo que no baja de cero no muestra una marca negativa. Los rótulos siguen la regla de TB-04: el tope
  adentro y la base solo si entra debajo de su línea, así que con 4 series iguales se lee «5» arriba, como en los demás
  indicadores. La media semanal de los registros puede no ser entera: la línea va donde va y la grilla sigue en
  enteros. Las calorías se escriben sin decimales, pero son una medida y no una cuenta: su escala no cambia. La
  comparación de etapas, que con 4 series iguales decía «3,8» y «4,2», toma la misma regla (el paso de a 1 como
  mínimo). *Otra opción:* decidirlo por los decimales de la métrica (`decimales: 0`, como el eje de «Analizar»), que
  mete a las calorías y, con todos los valores iguales, les abriría 1 kcal de cada lado; o, con todos los valores
  iguales, dejar más aire arriba y abajo para que entren los dos rótulos, que es otra regla para un solo caso.
- **TA-73 · La evolución sale de la misma lectura de la tarjeta.** La tarjeta de Antropometría ya leía API-ANT-06 en la
  ventana de 92 días que termina en la última toma (TA-26), con el peso y las masas. Ahora la misma lectura pide además
  las seis medidas de los pares (`metric=`): ninguna petición nueva, y la tabla de TA-30 no cambia. Con tomas cada cuatro
  a seis semanas, esa ventana trae tres o cuatro, que es lo que pidió Dirección. Como la ventana termina en la última
  toma y no hoy, la pieza puede mostrar una toma anterior al período de la ficha: Federico dice «2 en el período» y la
  pieza tiene tres columnas, cada una con su fecha. *Otra opción:* una segunda lectura de
  184 días para tener siempre cuatro tomas con tomas cada seis semanas o más, que suma una petición al abrir el Resumen.
- **TA-74 · Una columna por toma, en orden y con su fecha, no en la escala del tiempo.** Las tomas se comparan una con
  otra, y el valor va escrito sobre cada punto: con la x en el tiempo, dos tomas a pocos días (una toma y la de ayer)
  pisarían sus cifras. Por eso cada columna dice su día arriba. *Otra opción:* la x en el tiempo, como «Analizar», con
  los valores solo en la tabla.
- **TA-75 · Qué tomas entran.** Las últimas con alguna medida de los pares, sin contar una toma con solo el peso (sería una
  columna de guiones); hasta cuatro, y tres si el dibujo no tiene lugar para cuatro valores sin pisarse (36 por
  columna). La letra no baja de su piso. *Otra opción:* siempre cuatro, con la letra más chica, que la regla de TB-02 no
  admite.
- **TA-76 · Kilos con kilos: una vara por unidad en toda la pieza.** Las filas de centímetros (la cintura y el brazo)
  comparten el largo de escala, y también las de milímetros (la suma de 6 pliegues, el abdominal y el tricipital); el
  peso va solo. Nunca más angosta que 2 kg, 2 cm o 4 mm (TB-04). La consecuencia, honesta: al lado de la suma de 6, un
  pliegue solo se ve más quieto, porque un milímetro mide lo mismo en las dos filas. *Otra opción:* cada fila con su
  propia vara, que muestra más movimiento pero dibuja igual un milímetro y diez.
- **TA-77 · Plegada como la composición.** Con dos o más tarjetas en fila, la pieza va plegada (A13), y el renglón que la
  abre dice el primer par con diferencias («Cintura −3,2 cm · pliegue abdominal −2,5 mm»), para que se lea sin abrir;
  con una sola área, abierta. Medido: plegadas las dos piezas, la primera pantalla del Resumen de Diego no cambia (a
  1440 × 900 los valores de los indicadores siguen terminando en 829; a 1920 × 950, los minigráficos en 915); abiertas,
  la tarjeta de Antropometría mide entre 759 (Héctor, dos pares) y 1007 (Federico) a 1440. *Otra opción:* abierta
  siempre, que con esos altos empuja los indicadores fuera de la primera pantalla.
- **TA-78 · Los colores y las cifras.** Las dos filas de cada par en `--metrica-1` y `--metrica-2`, con su nombre y su
  unidad al lado; la cifra de la última toma en la tinta del texto y las demás en la tenue; la marca, con el estado del
  dato (la suma de 6, calculada, con su punto adentro). Ningún color por el valor ni por el sentido del cambio. *Otra
  opción:* las dos filas del mismo color, que obliga a leer el nombre para saber cuál es cuál.
- **TA-79 · Cómo se reparte el peso, de lo que más dice a lo que menos.** **Ratificada por Dirección el 2026-11-07.** Los cuatro componentes de De Rose y Guimarães
  primero: la grasa de Faulkner (la que la ecuación resta), la masa muscular y el resto, que es la ósea de Rocha y la
  residual de Würch, con sus kilos si la toma los tiene. Después, el músculo de Lee: la grasa del método de dos
  compartimentos de la toma, la masa muscular esquelética de Lee (la de perímetros antes que la de peso y talla) y el
  resto por diferencia; son dos ecuaciones, y la barra nombra las dos («la grasa, Durnin y Womersley, con Siri; el
  músculo, Lee, con perímetros»). Si no, grasa y libre de grasa. Un músculo que no entra en la libre de grasa, o unos
  cuatro componentes sin la grasa de Faulkner, no parten la barra. **Un hallazgo:** De Rose y Guimarães, Faulkner, Würch
  y Lee con peso y talla salieron del catálogo para cálculos nuevos con DL-112 (2026-10-01). La barra los lee en las
  tomas que ya los tienen; para una toma nueva, el único método que calcula el músculo es Lee con perímetros, que pide
  el brazo relajado, el muslo y la pantorrilla con sus pliegues. *Otra opción:* el músculo solo con De Rose y
  Guimarães, y Lee en su fila como decía D-11; Dirección nombró a Lee, y sin Lee una toma nueva no tendría nunca músculo.
- **TA-80 · El porcentaje.** Con un decimal, como los kilos: los kilos de cada parte sobre el peso de esa toma. Puede
  diferir en una décima del % de grasa que calcula el método, porque sale de las masas redondeadas. Va en su propia
  columna, al lado de los kilos («Grasa 15,4 kg 19,0 %»), en la tinta tenue, y debajo: «Los porcentajes son del peso de
  esa toma: 80,9 kg.». *Otra opción:* el porcentaje entero, más corto, que esconde medio punto de cambio.
- **TA-81 · La misma barra en la tarjeta y en la pestaña.** En la pestaña, «La última toma repartida» va arriba de las
  columnas, con el reparto más rico de esa toma y su método; las columnas siguen con un método de dos compartimentos y
  sin «%», como manda TEST-TAG-017. Así, en la pestaña de Federico, la barra es grasa, músculo y resto, y las columnas,
  grasa y libre de grasa de Durnin y Womersley, con Lee en su fila. *Otra opción:* sumar «cuatro componentes» al selector de método de las columnas, que cambia TB-24 y su
  oráculo.
- **TA-82 · El orden y el color del resto.** La grasa primero, como lo dijo Dirección («grasa, músculo y el resto»), en
  la tarjeta y en la pestaña; antes iba primero la libre de grasa. El músculo va en el azul de la libre de grasa, de la
  que es parte, y el resto en un violeta grisáceo propio (`--composicion-resto`: `#6e5f8f` en Claro y `#b9a3dc` en Azul
  noche), a ΔE 20 o más de la grasa, del músculo, de «hoy» y del gris de los huecos, con 3:1 sobre la tarjeta y sobre el
  fondo suave. *Otra opción:* el resto en el gris de los huecos, que se leería como «sin dato».
- **TA-83 · El «%» en T13, contado.** La lista de porcentajes de la ficha (`copy-pantallas.test.cjs`) suma
  `composicion.ts · %`, con su motivo: el porcentaje de cada parte del peso, que dice de qué está hecho y no cuánto se
  cumplió. Se escribe en un solo lugar, `porcentajeEnPalabras`, y una prueba de `composicion.test.mjs` falla si aparece
  otro. *Otra opción:* escribir «por ciento», que la prueba también prohíbe y se lee peor.
- **TA-84 · La cohorte: Federico con Lee.** Para que las capturas muestren la barra de tres partes, el profesional de
  Antropometría de Federico Álvarez calcula en cada toma las masas de Durnin y Womersley y la masa muscular esquelética
  de Lee con perímetros. Lee pide el brazo relajado, que la cohorte no tenía: sale del flexionado de cada toma menos
  2,6 cm, sin azar, así que sus demás medidas no cambian. La primera corrida probó con De Rose y Guimarães y falló
  («el catálogo no ofrece be/masa-grasa-faulkner@1»): es lo que retiró DL-112. Diego sigue con dos compartimentos y
  Héctor sin método, así que las capturas muestran los tres casos. De paso, el indicador de masa grasa de Federico
  (TB-25) pasa del peso a la masa grasa de Durnin y Womersley. **No está cargado en la base de `test`:** pide la IP del
  operador y lo decide Dirección, como TB-24. *Otra opción:* Lee para Diego, que cambia la tarjeta de la cuenta del
  inversor.

*Las decisiones de la declaración de TB-52 a TB-55 (D-13, ampliada por Dirección el 2026-11-07). No están programadas.*
- **TA-85 · Un nivel más en lo que la persona comparte.** Por profesional y por área, «resumen» (lo de §3.1) o «resumen
  y plan». Cada nivel tiene su versión del texto. Subir de nivel pide aceptar de nuevo (08 C-12, la prueba A-5); bajar o
  retirar corta en el momento. *Otra opción:* un permiso aparte, solo para el plan, que suma una pantalla y un acto más
  en la app para algo que la persona piensa junto.
- **TA-86 · Qué es el plan completo.** La instantánea de la versión activada vigente (UC-I04), que no cambia, con el
  objetivo vigente, el autor, desde cuándo rige y la fecha de la próxima revisión. Lo avanzado: desde la activación, en
  Entrenamiento, las sesiones planificadas y las registradas por semana (y la semana del bloque, cuando exista TB-43) y
  la carga de la primera serie de los ejercicios principales, como ya admite §3.1. Todo en cifras, sin «%» ni
  «cumplimiento». No viajan los borradores, las versiones anteriores, el contenido de las revisiones, las notas internas
  ni las evaluaciones. *Otra opción:* sumar las versiones anteriores, que muestra cómo cambió el plan pero amplía lo que
  se comparte más allá de lo que Dirección pidió.
- **TA-87 · La matriz del plan completo.** **Decidida por Dirección el 2026-11-07: «todos con todos, con permiso»**; cada
  área ve el plan de las otras dos con el nivel «resumen y plan». Lo que sigue era la recomendación, asimétrica como la del
  resumen, y queda como registro. Entrenamiento para Nutrición: sí, con el
  nivel «resumen y plan». Entrenamiento para Antropometría: a decidir por Dirección (se recomienda no, por pertinencia).
  Nutrición para Entrenamiento: no, hasta la revisión legal; el entrenador es un perfil no sanitario (08 §11-bis.2).
  Nutrición para Antropometría: no. Sin fila, es no. *Otra opción:* simétrica, que Dirección puede elegir después de la
  revisión legal.
- **TA-88 · Dos lecturas nuevas de la familia RES.** API-RES-06 (el plan) y API-RES-07 (con quién se comparte lo de mi
  área). Deciden como API-HBT-05: \`decidirAlgunAlcanceEnTransaccion\` en la transacción de la lectura, más la
  autorización vigente de la persona y la fila de la matriz. Si falta cualquiera de las tres, responden el mismo 404 que
  lo inexistente. Cada lectura queda registrada y la persona la ve. La forma del plan es la de la lectura del plan de esa
  área, sin campos de la otra, así el website reusa lo que ya dibuja. *Otra opción:* abrir las lecturas del plan de hoy
  (\`/nutrition/plans/{id}\`, \`/training/plans/{id}/detail\`) a quien la persona autorizó, que mezcla dos autorizaciones
  en la misma operación.
- **TA-89 · Los comentarios son notas de coordinación, sin hilos.** API-CRD-01 no cambia de forma. CRD-D5 se amplía:
  la nota puede citar la versión del plan compartido que el autor ve por API-RES-06 al escribirla, con el tipo de
  referencia que ya existe. La APK lee las notas con la misma forma (DL-152). No hay respuestas encadenadas: responder
  es escribir otra nota. *Otra opción:* \`repliesToNoteId\` en API-CRD-01, que cambia el contrato del 09 y lo que lee la
  APK.
- **TA-90 · Sin finalidad nueva.** «Dejar una nota a …» abre el redactor de siempre con quien lleva el área elegido como
  destinatario («Uno») y la finalidad sin elegir. Alcanzan las tres de CRD-D4 («Contexto para tu área», «Cambio en mi
  área que conviene que sepas» y «Pedido de coordinación»). *Otra opción:* sumar «Comentario sobre tu plan», que cambia
  la lista cerrada que aprobó Dirección.
- **TA-91 · El panel, plegado y leído al abrirlo.** Va al costado del editor y en el paso 1 de la revisión («Lo que
  pasó»), con una tarjeta por área compartida. Se lee la primera vez que se abre: abrir el editor o la revisión no suma
  peticiones. Sin nada compartido no aparece. *Otra opción:* abierto y leído siempre, que suma lecturas a cada apertura
  del editor.
- **TA-92 · Sin plan vigente en el área de origen,** por un vínculo terminado o porque todavía no se activó ninguno, el
  panel dice «Esa área no tiene un plan vigente.» y no muestra versiones anteriores. *Otra opción:* la última versión,
  con su fecha de fin, que hace viajar un plan que ya no rige.
- **TA-93 · Cada uno sabe quién ve qué.** La persona, en «Quién ve qué», ve el nivel y quién lo miró y cuándo, como con
  los hábitos. Quien lleva el área ve, en su ficha, «Tu plan lo ve también: … (Nutrición), desde el …» (API-RES-07).
  *Otra opción:* que solo lo sepa la persona, lo que deja al autor del plan sin saber quién lo mira (VJR-5).
- **TA-94 · Dónde va cada cosa.** La API (RES-02 con el nivel, RES-06, RES-07 y la regla de CRD-D5), en la rama del
  #243, sin tocarla todavía. El website (la vista del plan, el panel y «Dejar una nota»), en la rama de la etapa A. La
  APK («Quién ve qué» con el nivel), en una candidata de la etapa B.
- **TA-95 · Pedir ver el plan.** **Decidida por Dirección el 2026-11-07: sí, como en los hábitos** (TB-56). Lo que sigue
  era la recomendación, que no se tomó, y queda como registro. Los hábitos ya tienen «Pedir acceso a sus hábitos» (DL-165
  D-17, API-HBT-06), un precedente que decidió Dirección. Para el plan se recomienda no sumarlo todavía (08 §11-bis.2):
  lo decide la persona desde su app. *Otra opción:* «Pedir ver su plan», con la misma mecánica que los hábitos, si
  Dirección lo quiere.
