# WP-TABLERO-ALTA-GAMA — el tablero del profesional, de alta gama

> **Estado:** DECLARADO, con las decisiones DL-163 D-1 a D-21 ratificadas el 2026-11-05. **El alcance (las partes)
> espera el sí de Dirección (ACTA-DIR-034): no se programa hasta entonces.** Va después de la prueba de la APK 0.21.
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
>
> **Fuente:** la propuesta de Dirección «Tablero de alta gama» (27 secciones y 16 maquetas), que no está en el repo.
> Este paquete es autocontenido: lo que hace falta de ella está acá, y las maquetas, descritas con palabras (§1.1).
>
> **Decisiones:** DEUDA_LEGAJO DL-163, de D-1 a D-21. Las de la implementación se numeran desde TA-01 (§3). **Datos:**
> solo sintéticos (la cohorte de `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/`), en una base local
> propia.
>
> **Esta declaración:** rama `wp-tablero-alta-gama-declaracion`, desde `main` bdbf490. Solo documentación: ningún código
> ni migración.

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
- **11A:** TEST-PRJ-009 sigue verde. Los oráculos nuevos son TEST-TAG-001 a 032 (§6).
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

Un caso queda en no hasta que lo valide lo legal: el tipo de objetivo nutricional, sin números, para el entrenador.
Nunca viajan los borradores, las notas internas ni el plan completo del otro, y el resumen no tiene ningún botón que
escriba ni entra como evidencia de una revisión propia.

### 3.2 Lo que otro paquete mandó acá y no tiene parte todavía

WP-FORMULARIOS-RONDA-2 (DL-165 D-8) dejó para este paquete «la tarjeta de las respuestas en el Resumen («Lo que contó al
empezar»)». La propuesta no le da una parte: se decide con el sí al alcance, como una parte nueva (TB-49) o para
después.

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
| API-RES-02 | `PUT /me/summary-sharing` | La persona | Compartir un área con un profesional, con la versión del texto que acepta | TB-27 y TB-28 |
| API-RES-03 | `POST /me/summary-sharing/withdrawal` | La persona | Dejar de compartir, uno o todos a la vez | TB-27 y TB-28 |
| API-RES-04 | `GET /advisees/{adviseeId}/shared-summaries` | El profesional | Los resúmenes que la persona le comparte, armados con la matriz vigente. Sin nada compartido, la lista vacía, que no revela nada | TB-27 y TB-29 |
| API-RES-05 | `GET /advisees/{adviseeId}/shared-summaries/{area}/series` | El profesional | Las series de un resumen para «Analizar», en las fechas que se piden | TB-29 |

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

- **Sin datos nuevos:** TB-01 a TB-12, TB-15, TB-16, TB-24, TB-25, TB-30, TB-32, TB-38, TB-45 y TB-46 leen lo que ya
  existe. «Ocultar nombres» y la elección de la vista se recuerdan en el navegador, sin datos de personas. TB-14, TB-18
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
- **TEST-TAG-017 · La composición no mezcla métodos** (D-11; TB-24). Nunca se parte una columna con métodos distintos ni
  con un método que no suma el peso; un cambio de método corta las diferencias; una toma con solo peso va en contorno.
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
  puntaje, mejor ni peor. El «%», solo donde lo admite T13.
- **TEST-TAG-032 · Los guardianes.** Las herramientas de captura cuentan las peticiones a la API al abrir /pro, el
  Resumen y el cajón, y fallan si suben sin aviso; la primera pantalla se mide a 1280 × 800, a 1440 × 900 y a 1920 × 950
  (el área útil de un monitor de 1920 × 1080).

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

**Antes de programar:** el sí de Dirección al alcance, con las partes de §3 (ACTA-DIR-034). Va después de que Dirección
pruebe la APK 0.21. Hasta entonces no se programa nada.

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
8. **TB-10, TB-16, TB-24 y TB-25:** las tarjetas del Resumen, la persona nueva, la composición y los indicadores por
   área.
9. **TB-11 y TB-12:** Pendientes por persona y el cajón «De a una», detrás de su interruptor.
10. **En la rama de la API, TB-13 y TB-14:** las dos pruebas y su arreglo, y la cola de revisiones. **En el website,
    TB-15:** aplicar desde el cajón y «¿Cuándo la revisás?».
11. **TB-17:** la guía, el criterio y la pauta «Decisiones guiadas».
12. **Después de TB-10, porque se apoyan en las tarjetas:** TB-30 a TB-34 (el mapa y sus capas, los programas y los
    derivados) y TB-26, TB-27 y TB-29 (las otras áreas, en rama y sin integrar hasta lo legal). Si el piloto va como las
    5 semanas de Elián, TB-33 va primero.
13. **En paralelo, porque son otras pantallas (los editores y la pestaña Plan):** TB-38 a TB-41, TB-43 y TB-45 a TB-48.
    Las partes que tocan la API, en su rama.

**El criterio de corte:** una parte hoja (TB-07, TB-08, TB-12, TB-16 y TB-22, y cualquier otra en la que no se apoye
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
