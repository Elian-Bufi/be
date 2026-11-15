# WP-GRAFICOS — la historia de la persona en el tiempo, a mano mientras se planifica

> **Estado:** DECLARADO el 2026-11-14. Los gráficos GR-01 a GR-25 y los cruces SP-01 a SP-08 son la propuesta de
> gráficos, que Dirección aprobó ese día; GR-26 («Armá tu gráfico») y GR-27 (los enfoques) son las dos ideas que sumó
> en el mismo mensaje. Las decisiones GR-D0 a GR-D10 (§6.1) quedaron tomadas por la delegación vigente de Dirección,
> según la recomendación de la propuesta. Las del continuador en el diseño técnico (GR-T01 a GR-T19, §6.2) están **a
> ratificar**: mientras no haya respuesta, rigen. La fase 1 se programa en `wp-graficos-fase-1`; la fase 2, adelantada,
> en cinco ramas desde el 2026-11-14 (§11). DL-174.
>
> **Encargo** (Dirección, 2026-11-14, con sus palabras):
> - «Aprobadas las 25 sugerencias de gráficos y podríamos agregar también la opción de que puedan ver uno arriba del
>   otro, superpuestos en el mismo gráfico si comparten la x o alineados uno arriba del otro para que los entrenadores
>   vean los gráficos que necesiten además de los sugeridos…» (GR-26);
> - «…podrían tener también su stand de gráficos favoritos para elegir ver en ese plan o persona hasta que lo vayan
>   cambiando, no sé, pensaba que capaz si se estaban enfocando en fuerza o algo en específico ya sabían qué trackear
>   principalmente» (GR-27);
> - «Ya veo lo de los gráficos… ya tienes que ponerte a trabajar en eso»: la fase 2 se adelanta (§3);
> - la delegación vigente: «a menos que sea una decisión crítica con criterio haz lo que me recomiendes».
>
> **Fuente:**
> - la propuesta de gráficos, publicada en <https://claude.ai/artifact/79KSspo5cFQyBLVAivqHFL>: la visión y sus doce
>   principios, diecisiete referentes (§12), los 25 gráficos, los ocho cruces, la planificación, catorce reglas de
>   honestidad (§5), cinco fases, diez riesgos y las decisiones GR-D. No está en el repo: este paquete la cuenta en
>   palabras, para ser autocontenido;
> - el diseño técnico de la fase 2, de «Armá tu gráfico» y de los enfoques, hecho sobre `main` `1089fc24` sin cambiar
>   nada (§4.2 a §4.6, §7 y §11 lo resumen);
> - el código de `main` `7cb79d3a`, releído para los módulos que nombra este paquete.
>
> **Antecedentes, no son partes:** «Analizar» con hasta tres métricas y las vistas guardadas (DL-126 y DL-128), la
> fuerza estimada en «Analizar» y en el cuadro del ejercicio (DL-171, ED-74 y ED-75), «Comparar dos etapas» (C-12), la
> línea de tiempo (API-DSH-04) y la evolución de las últimas tomas (TB-50). Este paquete se apoya en ellos y no los
> rehace.
>
> **Datos:** solo sintéticos, en local y en `test`. **Esta declaración:** rama `docs-wp-graficos`, desde `main`
> `7cb79d3a`. Es solo documentación: no tiene código ni migraciones.

## 0. Legajo y decisiones que cita

- **El legajo:**
  - TEST-PRJ-009: no calificar. Ningún texto nuevo usa las palabras que prohíbe, ni en negación;
  - RNF-ACC-001 y B10-10: WCAG 2.2 AA (4,5:1 para el texto; 3:1 para las marcas y los bordes que comunican). Cada
    gráfico tiene su tabla o su texto equivalente, y se maneja con teclado;
  - 09 v0.11 §18-§23 y B10-09 §15-§28: API-PRJ-01 y «Analizar»;
  - RF-025: la historia de la persona empieza en el inicio del acompañamiento;
  - REG-06-105: cada registro se lee contra la versión del plan que regía ese día;
  - REG-06-162: los grupos de comparabilidad (protocolo, método y unidad); REG-06-165 y 166 y B10-07: en Antropometría,
    nada se imputa ni se suaviza, y se dibujan solo puntos;
  - B10-08 §21 y §22: la proyección de las series cerca del fallo frente al total y el umbral del profesional (GR-08);
    §23: la progresión de carga, repeticiones y RIR en paneles chicos (CAND-10-PRJ-07, GR-03);
  - INV-06-153: Entrenamiento captura y no calcula la carga acumulada ni las marcas (GR-09 espera su DL, GR-D2);
    INV-06-192: una marca personal es la observada con un criterio explícito, y una estimación no se presenta como marca
    medida;
  - M-11 (06): las proyecciones longitudinales. La de las series cerca del fallo frente al total sigue sin
    especificación (responde `SPECIFICATION_PENDING`): GR-08 solo entra como desafío, con su DL.
- **Las DL:**
  - DL-126: el diccionario de métricas de «Analizar»; dos métricas se superponen solo si comparten familia y unidad.
    GR-26 lo amplía (GR-T04);
  - DL-128: las vistas guardadas (API-VAN), el precedente de los enfoques;
  - DL-137 D-7: **lo nuevo va en operaciones nuevas**;
  - DL-152: lo que lee cada APK, congelado por versión. Nada de este paquete cambia esas lecturas;
  - DL-153: COMPLETE no quiere decir que el día esté completo;
  - DL-158: lo indicado de Nutrición por día, en el mismo gráfico que lo registrado;
  - DL-161: la carga rápida (procedencia PLAN), que no es dato de la persona;
  - DL-163: la matriz de lo que viaja entre profesionales (D-13, §3.1 de WP-TABLERO-ALTA-GAMA), la capa Trabajo y las
    series por zona (D-14, D-15 y D-20), el esfuerzo de la sesión y el peso en casa (D-16) y los rangos de Nutrición
    (D-17);
  - DL-165 D-9: los hábitos que declara la persona, versionados (API-HBT-05);
  - DL-167: los editores del profesional (la estación, el cuadro del ejercicio y el buscador);
  - DL-169 (UF-11): un profesional opera un área solo verificado, habilitado y con su segundo factor (`puedeOperarArea`);
  - DL-171: el 1RM estimado (Epley v1), solo para el profesional (ED-70 y ED-72 a ED-76; RM-16 y RM-22; DJ-2 y DJ-14);
  - DL-173 (WP-PULIDO-GRANDES): PG-11 («La vez pasada» en la APK) es la misma pieza que GR-01; PG-18 usa las marcas de
    este paquete; las notas de PG-15 y PG-16 entran en la cinta del tiempo (GR-23); PG-14 da el campo de fecha del
    website del profesional (`CampoDeFecha`).
- **Otras decisiones de Dirección:** 2026-11-13, la visión longitudinal: BE es para el seguimiento en el tiempo y los
  patrones entre áreas, con gráficos mientras se planifica y superposiciones que no afirman causas.

## 1. Objetivo

Que el profesional vea la historia de la persona **donde decide** (al elegir un ejercicio, al escribir una carga, al
tocar un macro del objetivo) y que esa historia se lea entera: las tres áreas sobre un solo eje del tiempo, con las
versiones del plan de fondo, lo indicado separado de lo registrado y los huecos como huecos.

Cada serie, cada comida y cada toma es un punto en la historia de una persona, y el valor aparece cuando esos puntos se
leen juntos a lo largo de meses. Con pocas semanas, BE lo dice y no dibuja lo que todavía no existe; con meses, aparecen
las etapas comparables y los cruces con datos suficientes de cada lado. La personalización no sale de un algoritmo
opaco ni de promedios de otras personas: cada persona se compara solo con su propia historia. Y todo pasa por el permiso
de la persona: un cruce existe completo solo para el profesional que lleva las dos áreas con planes propios (el
**caso 1**, porque cada lectura del profesional ya está acotada a sus planes y sus tomas:
`apps/api/src/analisis/fuentes.ts`); entre profesionales distintos viaja solo lo que deja la matriz de DL-163 D-13 (el
**caso 2**, en la fase 3).

**Cómo se mide**, al cerrar la fase 2:

| Qué | Hoy (`main` `7cb79d3a`) | Al cerrar la fase 2 |
|---|---|---|
| La historia del ejercicio al planificar | La tarjeta de fuerza, solo en los seis ejercicios de la lista de la v1 (ED-75) | «La vez pasada» (fase 1) y el historial en paneles alineados en el cuadro de cualquier ejercicio (GR-02, GR-03, GR-05 y GR-06) |
| Los gráficos de una persona, juntos | «Analizar» con hasta tres métricas y los minigráficos del Resumen, cada uno con su eje | «Patrones»: la cinta del tiempo arriba y un cursor para toda la columna, sobre el mismo eje de fechas |
| Un gráfico arriba del otro, o superpuestos | «Separadas»; «Juntas» solo con la misma familia y unidad | «Alineadas» (por defecto) y «Superpuestas» si comparten la x, con hasta dos unidades (GR-26) |
| Los gráficos que cada profesional mira primero | Las vistas guardadas de «Analizar» (API-VAN), de a una | Enfoques de hasta seis gráficos, elegidos para una persona o un plan hasta que se cambien (GR-27) |
| Los cruces entre áreas | Ninguno preparado | SP-01 y SP-02 en el caso 1, con su ventana, lo que también cambió y la frase |
| Las temporadas del plan | Bandas en «Analizar» | Las de su área detrás de cada gráfico, con la etiqueta de la versión (GR-11); las de otra área, a pedido |
| Las pruebas | — | Un oráculo por parte, cada uno con su mutación (§9) |

### 1.1 Lo que pidió Dirección, y cómo se lee

| Lo que dijo | Cómo queda | ID |
|---|---|---|
| «ver uno arriba del otro … alineados uno arriba del otro» | **«Alineadas»:** paneles apilados con un solo eje de fechas y un cursor común. Es el modo por defecto | GR-26 |
| «superpuestos en el mismo gráfico si comparten la x» | **«Superpuestas»:** en el mismo gráfico, solo si las series comparten el eje X (GR-T03), hasta tres series y dos unidades, una a cada lado (GR-T02) | GR-26 |
| «los gráficos que necesiten además de los sugeridos» | **«Armá tu gráfico»:** el catálogo de series de las áreas permitidas, con los sugeridos primero | GR-26 |
| «su stand de gráficos favoritos para elegir ver en ese plan o persona hasta que lo vayan cambiando» | **Los enfoques:** conjuntos de hasta seis gráficos, propios del profesional, que se eligen para una persona o para uno de sus planes y quedan hasta que se cambien | GR-27 |
| «si se estaban enfocando en fuerza o algo en específico ya sabían qué trackear» | El nombre: «Enfoque: Foco en fuerza», «Mis enfoques» (GR-T01) | GR-27 |
| «los entrenadores» | Vale para los tres tipos de profesional, cada uno con las áreas que lleva | GR-26 y GR-27 |

### 1.2 Los doce principios de la propuesta

1. **Un solo eje del tiempo.** Fechas reales y la misma ventana. De fondo, las bandas de las versiones de su área; las de
   otra área, solo a pedido («Mostrar las temporadas de Nutrición») y en el caso 1.
2. **El contexto va donde está la decisión.** Tres escalas: una marca en el buscador, el historial en el cuadro del
   ejercicio y «Patrones» en la planificación. Nada obliga a salir del editor ni escribe en el plan.
3. **Ubicar, nunca calificar.** Sin verde ni rojo para lo indicado frente a lo registrado y sin comparar con otras
   personas. Las diferencias, en las unidades de cada cosa (kg, g/día, mm).
4. **Paneles alineados.** Dos magnitudes distintas van apiladas, con el mismo eje de fechas y una regla vertical común.
   El doble eje existe solo en «Superpuestas», a pedido del profesional (GR-26 y §5).
5. **Lo indicado y lo registrado, separados.** Lo indicado, en marcas huecas o rayadas; lo registrado, llenas. Lo
   precargado del plan («carga rápida») nunca se dibuja como dato de la persona.
6. **Un hueco es un hueco.** Un día sin registro no es cero, un RIR sin escribir no es 0 y un sitio sin medir no es cero.
   Las líneas se cortan y cada promedio dice con cuántos datos se hizo.
7. **Cada cálculo, con método y versión.** «1RM estimado (Epley v1)», con «Cómo se calculó» a un clic. Sin método
   aprobado, no se muestra.
8. **Coincidir no es causar.** Cada cruce tiene una sola ventana de lectura, fijada antes de mirar los datos; la lista de
   lo que también cambió; y la frase fija. La explicación fisiológica va en «Cómo leerlo», con su fuente. BE responde a
   la pregunta del profesional: no sale a buscar correlaciones.
9. **Más uso, mejor lectura, dicho en voz alta.** Lo que necesita historia declara su mínimo y cuánto falta («se arma
   con 8 semanas de datos; hay 2»). La personalización se ve crecer; no se promete.
10. **El permiso de la persona manda.** Caso 1 y caso 2. Un área sin acceso no aparece, ni en gris ni con candado, y cada
    cruce tiene su prueba del caso negado.
11. **El ruido, dicho antes que el cambio.** Con Epley v1, cada unidad de RIR mueve la estimación en carga/30 (con 80 kg,
    unos 2,7 kg). Al lado del 1RM estimado van la mediana del RIR y el rango de repeticiones de cada tramo, y el ruido
    propio de la persona en texto, sin «±» (RM-22). Nunca «primero → último» ni una flecha.
12. **Cada dato con su calidad y su momento.** COMPLETE quiere decir «con cantidades en todos sus registros y sin
    comidas del plan sin registro» (DL-153), y sin plan vigente no se sabe si faltan comidas. Lo cargado tarde es un
    recuerdo y se marca (`late`, API-DSH-04).

## 2. Alcance y lo que queda fuera

**Entra:** los 25 gráficos de la propuesta (GR-01 a GR-25), sus ocho cruces (SP-01 a SP-08), «Armá tu gráfico»
(GR-26), los enfoques (GR-27) y la sección «Patrones», cada uno con su fase (§3), sus pruebas y sus oráculos.

**Se programa ahora:** la fase 1 y la fase 2. **Queda declarado, sin programar:** las fases 3 a 5, con lo que espera
cada una (§4.8).

**La persona.** Este paquete es del website del profesional. Del lado de la persona, la APK no tiene hoy ningún gráfico
de Nutrición ni de Entrenamiento y la persona no ve el 1RM estimado (DL-171). Lo que ve sale del mismo diseño, con lo
que ella puede ver:
- «La vez pasada» es una sola pieza para las dos superficies: GR-01 en el editor y PG-11 en la sesión en curso;
- «Tu ejercicio en el tiempo» (PG-18 de WP-PULIDO-GRANDES) usa las marcas y la función de comparabilidad de este paquete;
- la exportación de su propia historia (registros, tomas y versiones de sus planes) es un derecho propio y pide su DL
  (GR-D6).

**Queda fuera:**
- el caso 2 de los cruces (profesionales distintos, por API-RES, después de TB-29 y de la revisión legal): fase 3;
- sueño, ciclo menstrual y otras áreas de salud: cada una con su DL, su revisión legal, su revisión de evidencia y su
  habilitación explícita (fase 5, después del piloto);
- buscar correlaciones por su cuenta, un coeficiente de correlación como titular, cualquier comparación con otras
  personas y los rangos poblacionales;
- la línea del peso que filtra el ruido (GR-D5) y la historia de un profesional anterior (GR-D6);
- un enlace nuevo en la navegación del espacio profesional: «Patrones» vive en la ficha y en la estación.

## 3. El calendario: las fases

Hoy es el sábado 14/11 y la entrega es el miércoles 25/11. **La regla de Dirección del 2026-11-14:** «Todo se integra lo antes posible una vez que esté aprobado, no retrasamos las cosas por la planificación, si adelantamos la producción se adelanta todo».
«Aprobado» quiere decir: la revisión adversaria sin hallazgos altos ni medios pendientes y la CI en verde. No hay
congelamiento ni ventanas: cada rama entra apenas queda aprobada, y la APK sale apenas `main` tiene algo que la
justifique (la 0.28 salió el mismo 14/11, no el 19/11). Las fases ordenan el trabajo; no lo hacen esperar.

| Fase | Cuándo | IDs | Rama | Qué lleva |
|---|---|---|---|---|
| **1** | Programada el 14/11; entra apenas queda aprobada | GR-01 (reducida), GR-04 (solo la marca) y GR-16 | `wp-graficos-fase-1` | Tres piezas de solo lectura, con datos que ya existen y sin tocar el lienzo de «Analizar» |
| **2 · adelantada** | Programada desde el 14/11; cada rama entra apenas queda aprobada | GR-02, GR-03, GR-05, GR-06, GR-11 a GR-14, GR-18, GR-20, GR-23, GR-24, GR-26, GR-27, SP-01 y SP-02 (caso 1) y «Patrones» | Las cinco de §11 | El historial en el cuadro del ejercicio, Nutrición y Antropometría en el tiempo, los cruces del caso 1, «Armá tu gráfico», los enfoques y «Patrones» |
| **3** | A continuación de la fase 2 (su diseño se hace desde el 14/11) | GR-07, GR-09, GR-10, GR-15, GR-22, SP-03, SP-05, SP-07 y el caso 2 de SP-01 y SP-02 | — | Lo ratificado que espera programación (D-14, D-15, D-16 y D-20; TB-31, TB-34, TB-35 y TB-38) y los cruces entre profesionales distintos, por API-RES, después de TB-29 y de la revisión legal |
| **4** | A continuación de la fase 3; cada una abre su DL al programarse | GR-08, GR-17, GR-19, GR-25 y SP-04 | — | Lo que pide una DL o un desafío del legajo |
| **5** | Después del piloto, área por área: es una condición de producto ratificada, no de calendario, y Dirección puede adelantarla | GR-21, SP-06 y SP-08 | — | El peso en casa (D-16, TB-37, API-PCA), los hábitos versionados (DL-165 D-9) y otras áreas |

De la fase 2 de la propuesta quedan sin rama en este reparto GR-01 completa y la vista previa de GR-04: las dos piden
una lectura nueva (§4.7).

**Las reglas del calendario:**
- **«Aprobado»:** la revisión adversaria sin altas ni medias pendientes y la CI en verde. Con eso, la rama se integra en
  el momento, sin esperar una fecha. La prueba en el website de `test` se hace después de integrar, y lo que aparezca
  se arregla en una rama nueva.
- **GR-D1 rige para la fase 1, y los pedidos del 14/11 adelantan todo lo demás:** se programa ya y se integra apenas
  queda aprobado.
- **La rama base (A) entra primero.** B, C, D y E salen de su primer commit y entran después de ella.
- **«Analizar» lo toca una sola rama (D).**
- **La API de los enfoques (rama E)** entra después de la base y de la rama D, con su migración que solo agrega. Si la
  tanda B de WP-PULIDO-GRANDES (PG-15 y PG-16) ya entró, trae `main` antes, y la carpeta de su migración lleva una
  fecha posterior a todas (GR-T18).
- **SP-01 en la defensa:** con la cuenta de Dirección, que lleva las dos áreas (caso 1). En vivo si la rama D ya entró;
  si no, como maqueta y visión (GR-D1).
- **La APK:** del lado de la persona, la misma pieza de GR-01 es PG-11, que sale según el calendario de
  WP-PULIDO-GRANDES y lee lo que la APK ya leía (API-TRN-19-LISTA). Este paquete no suma lecturas a la APK.

**El orden dentro de la fase 2** (§11.3): el sábado 14, la rama A publica su primer commit y la E empieza la API; del
domingo 15 al martes 17 programan B, C, D y E, y A suma la cinta y el ruido; el miércoles 18, cada rama con su PR, la
CI en verde y su evidencia; del jueves 19 al domingo 22, la revisión y la integración de lo sólido.

## 4. Las partes

Cada parte dice qué ve el profesional, dónde va, de qué datos sale, si necesita la API y lo que no hace. «API: no»
quiere decir que usa solo lecturas que ya existen, con el mismo permiso que en su módulo. Si al programar una lectura no
trae lo que hace falta, la parte se detiene y se declara: no se inventa el dato ni se abre una operación sin decisión.

**Las operaciones nuevas van como operaciones nuevas** (DL-137 D-7): la única familia nueva es GRF (§7), para GR-27.
Nada de este paquete cambia una respuesta que leen las APK instaladas (DL-152).

**Las pruebas nuevas** van en los archivos que la rama A deja listados en `npm test` (§11.1), sin tocar el
`package.json` de la raíz. Cada prueba se verifica con una mutación: se rompe la regla a propósito, la prueba se pone en
rojo y se vuelve atrás.

La prioridad es la de la propuesta: 1, lo que hace falta primero; 3, lo que puede esperar. Los cruces no tienen
prioridad propia: van por su fase.

| ID | Qué (en criollo) | Área | Dónde va | Prioridad | Fase · rama | API | Decisión | Prueba |
|---|---|---|---|---|---|---|---|---|
| GR-01 | «La vez pasada»: las últimas sesiones del ejercicio, serie por serie | Entrenamiento | El cuadro del ejercicio en el editor; en la APK, al lado de cada serie (PG-11) | 1 | 1 (reducida); completa, sin rama (§4.7) | Fase 1: no. Completa: una lectura nueva | — | TEST-GR-001 |
| GR-02 | 1RM estimado (Epley v1), sesión a sesión, con las versiones del plan de fondo | Entrenamiento | El cuadro del ejercicio y «Analizar» | 1 | 2 · B | No | GR-T15 y GR-T16 | TEST-GRF-020 a 039 |
| GR-03 | Carga, repeticiones y RIR de la misma serie, en tres paneles alineados | Entrenamiento | El cuadro del ejercicio y «Analizar» | 1 | 2 · B | No | GR-T14 | TEST-GRF-020 a 039 |
| GR-04 | «Con historial» en el buscador «Agregar ejercicio» | Entrenamiento | El buscador | 2 | 1 (la marca); la vista previa, sin rama (§4.7) | La marca: no. La vista previa: una lectura por lote | — | TEST-GR-004 |
| GR-05 | RIR indicado y RIR registrado a lo largo del bloque | Entrenamiento | El cuadro del ejercicio y «Patrones» | 2 | 2 · B | No | GR-T14 | TEST-GRF-020 a 039 |
| GR-06 | Perfil carga-repeticiones de la persona en el ejercicio | Entrenamiento | El cuadro del ejercicio (segundo paso) | 2 | 2 · B | No | — | TEST-GRF-020 a 039 |
| GR-07 | «Lo que trabaja la semana»: series por zona del borrador | Entrenamiento | La estación («Lo que trabaja la semana», hoy vacía) | 2 | 3 | Sí (TB-31 y TB-38) | GR-D0 | Al programar |
| GR-08 | Series según un umbral de RIR del profesional (desafío de M-11) | Entrenamiento | «Patrones» | 3 | 4 | Sí | — | Al programar |
| GR-09 | kg × repeticiones del ejercicio por semana | Entrenamiento | El cuadro del ejercicio y «Analizar» | 3 | 3 | Sí (TB-34) | GR-D2 | Al programar |
| GR-10 | La carga de la semana con el esfuerzo de la sesión | Entrenamiento | «Patrones» | 3 | 3 | Sí (TB-35, API-ESF) | GR-D0 | Al programar |
| GR-11 | Temporadas del objetivo y del plan | Nutrición | «Analizar», «Patrones» y la ficha; en otras áreas, a pedido | 1 | 2 · C | No | — | TEST-GRF-040 a 059 |
| GR-12 | Energía registrada por día, con lo que se sabe de cada día | Nutrición | «Analizar», la ficha y «Patrones» | 2 | 2 · C | No | — | TEST-GRF-040 a 059 |
| GR-13 | Proteína, carbohidratos, grasa y fibra, cada uno en su panel | Nutrición | «Analizar» y «Patrones» | 2 | 2 · C | No: los g/kg se derivan en el website | GR-T13 | TEST-GRF-040 a 059 |
| GR-14 | Lo indicado y lo registrado, día por día, en gramos | Nutrición | La ficha y «Patrones» | 2 | 2 · C | No | — | TEST-GRF-040 a 059 |
| GR-15 | El reparto de la proteína por comida | Nutrición | «Patrones» | 3 | 3 | No (TB-34) | — | Al programar |
| GR-16 | Desde el inicio y desde la anterior: la tabla de cada toma | Antropometría | La ficha y «Patrones» | 1 | 1 | No | GR-D4 | TEST-GR-016 |
| GR-17 | Suma de pliegues con la franja del error de medición | Antropometría | La ficha, «Analizar» y «Patrones» | 2 | 4 | Sí (el error técnico de quien mide) | GR-D4 | Al programar |
| GR-18 | Perfil por sitio entre dos tomas | Antropometría | La ficha y «Analizar» | 2 | 2 · C | No | — | TEST-GRF-040 a 059 |
| GR-19 | Perímetro bruto y perímetro corregido por pliegue | Antropometría | «Patrones» y «Analizar» | 3 | 4 | Sí | GR-D9 | Al programar |
| GR-20 | Masa grasa según cada método, en un eje común | Antropometría | «Analizar» y la ficha | 2 | 2 · C | No | — | TEST-GRF-040 a 059 |
| GR-21 | Masa corporal con las condiciones de la toma | Antropometría | La ficha y «Patrones» | 3 | 5 | Sí (las condiciones; el peso en casa, API-PCA) | GR-D5 | Al programar |
| GR-22 | Somatocarta con el recorrido de la persona | Antropometría | La ficha | 3 | 3 | No (TB-34) | — | Al programar |
| GR-23 | La cinta del tiempo de la persona | Cruce | Arriba de «Analizar», de «Patrones» y de la ficha | 1 | 2 · A | No | GR-D10 (el lugar de los hábitos) | TEST-GRF-001 a 019 |
| GR-24 | Dos etapas lado a lado, con todas las observaciones | Cruce | «Analizar» y «Patrones» | 1 | 2 · D | No | — | TEST-GRF-060 a 079 |
| GR-25 | Lo de sus semanas anteriores | Cruce | «Patrones» y «Analizar» | 3 | 4 | Sí (una DL con el método) | GR-D8 | Al programar |
| GR-26 | «Armá tu gráfico»: alineadas o superpuestas | Todas | «Analizar» y «Patrones» | Dirección | 2 · D | No | GR-T02 a GR-T06 | TEST-GRF-060 a 079 |
| GR-27 | Los enfoques: los gráficos favoritos para una persona o un plan | Todas | «Patrones» (la ficha y la estación) | Dirección | 2 · E | **Sí: API-GRF-01 a 07** | GR-T01, GR-T07 a GR-T11 y GR-T17 | TEST-GRF-080 a 099 |
| — | La sección «Patrones» | Todas | La ficha (vista) y la estación (pestaña) | — | 2 · E | No (lee lo de las otras partes) | GR-T12 | TEST-GRF-080 a 099 |
| SP-01 | Carbohidratos registrados × 1RM estimado (Epley v1) | Nutrición y Entrenamiento | «Ver la relación», en «Patrones» | — | 2 · D (caso 1); caso 2, fase 3 | No | — | TEST-GRF-060 a 079 |
| SP-02 | Energía registrada × peso de toma a toma | Nutrición y Antropometría | «Ver la relación», en «Patrones» | — | 2 · D (caso 1); caso 2, fase 3 | No | — | TEST-GRF-060 a 079 |
| SP-03 | Energía y peso × 1RM estimado, en una etapa de déficit | Las tres | «Ver la relación» | — | 3 | No en el caso 1; API-RES en el caso 2 | — | Al programar |
| SP-04 | Series por zona y por semana × perímetro de esa zona | Entrenamiento y Antropometría | «Ver la relación» | — | 4 | Sí (la capa Trabajo y el corregido) | GR-D9 | Al programar |
| SP-05 | Proteína (g/kg/día) × masa muscular de Lee con perímetros | Nutrición y Antropometría | «Ver la relación» | — | 3 | No en el caso 1; API-RES en el caso 2 | — | Al programar |
| SP-06 | Carbohidratos por día × pesajes en casa | Nutrición y Antropometría | «Ver la relación» | — | 5 | Sí (API-PCA) | GR-D0 | Al programar |
| SP-07 | Series por semana × RIR registrado a igual carga | Entrenamiento | «Ver la relación» | — | 3 | Sí (la capa Trabajo, para las zonas) | GR-D0 | Al programar |
| SP-08 | Hábitos declarados × carga y RIR registrados | Entrenamiento y hábitos | La cinta y «Ver la relación» | — | 5 | Sí (las versiones anteriores de API-HBT-05) | GR-D10 | Al programar |
| — | Ningún texto nuevo usa las palabras prohibidas; con Nutrición, sin el signo de porcentaje | Todas | — | — | Todas | — | — | La guardia unida (A) en las pruebas de cada rama |

### 4.1 Fase 1 · rama `wp-graficos-fase-1` (programada el 14/11)

**GR-01 · «La vez pasada»: las últimas sesiones del ejercicio, serie por serie**
- *Qué ve el profesional:* en el cuadro del ejercicio del editor, debajo de «Lo que indica el plan» y nunca mezclado con
  eso, lo que la persona registró las últimas tres veces que hizo el ejercicio, serie por serie: carga con su unidad ×
  repeticiones · RIR. Lo precargado del plan, hueco y en gris, con «carga rápida»; lo cargado otro día, marcado.
- *Dónde:* el editor de Entrenamiento. En los ejercicios de la lista de la v1 va dentro de «Detalle y fuerza estimada»
  (ED-75); en los demás, en el mismo cuadro lateral, sin la fuerza estimada. Del lado de la persona, la misma pieza es
  PG-11: una línea gris debajo del ejercicio, en la sesión en curso.
- *API:* no, en la fase 1. Las últimas tres dentro de los 92 días que lee API-TRN-21, armadas en el cliente, leídas al
  abrir el cuadro y sin caché. Completa (todos los ejercicios, más allá de 92 días, hasta cinco sesiones y la línea de
  12 semanas) pide una lectura nueva (§4.7).
- *Criterios de aceptación:*
  - solo lo registrado (el registro vigente de cada sesión): nunca un borrador ni lo planificado;
  - una serie tildada sin escribir no se ve como escrita (DL-161, ED-70);
  - una vez hecha con otro ejercicio lo dice («Se hizo con Press con mancuernas») y no cuenta como el mismo. La función
    que lo decide es la misma de PG-11 y de PG-18;
  - una serie que falta queda sin dato, nunca en cero; una sesión registrada resumida dice que no tiene series;
  - la tabla dice desde cuándo leyó.
- *Lo que NO hace:* no sugiere una carga (eso es ED-76, que confirma el profesional); no mezcla kg con lb ni barra con
  máquina; no dice «récord» ni «mejor marca»; no compara una vez con otra.
- *Evidencia:* HubFit (Exercise History V2) y TrueCoach; el pedido de 266 entrenadores en Trainerize; ED-70, ED-75,
  ED-76 y DL-161.

**GR-04 · «Con historial» en el buscador**
- *Qué ve el profesional:* en el buscador «Agregar ejercicio», en la fila del resultado: «Con historial · 9 sesiones ·
  la última el mar 3 nov».
- *Dónde:* el buscador del editor de Entrenamiento (DL-167), coordinado con su revisión visual.
- *API:* no. El índice de API-PRJ-01 `TRAINING_PROGRESSION_BY_EXERCISE` sin ejercicio, con `sessions` y `lastDate`, del
  último año (la API lo recorta al inicio del acompañamiento: RF-025).
- *Criterios de aceptación:*
  - sin el primer valor ni el último, sin flecha y sin color;
  - un ejercicio sin sesiones no lleva marca: ni «0», ni «sin historial»;
  - qué cuenta la marca se dice una vez, arriba de los resultados.
- *Lo que NO hace:* la vista previa con el último valor y el mínimo y el máximo del período («última: ≈ 96 kg · entre
  ≈ 92 y ≈ 99 kg en 9 sesiones · Epley v1») pide una lectura por lote y queda sin rama (§4.7).
- *Evidencia:* Tufte, «Sparkline theory and practice»; Shneiderman 1996 (vista general, filtro y detalle a pedido);
  BridgeAthletic.

**GR-16 · Desde el inicio y desde la anterior: la tabla de cada toma**
- *Qué ve el profesional:* al abrir una toma, una tabla compacta por medida: el valor, la diferencia con la primera toma,
  la diferencia con la anterior y los días entre fechas. Debajo, siempre: «BE no tiene cargado el error de medición de
  quien mide: no se puede decir si estos cambios lo superan».
- *Dónde:* la ficha (Antropometría, cada toma) y, en la fase 2, «Patrones».
- *API:* no. API-ANT-06, en tramos de hasta 92 días que cubren las fechas de las tomas, sin caché.
- *Criterios de aceptación:*
  - solo dentro del mismo grupo de comparabilidad (REG-06-162); una medida tomada antes de otra forma lo dice y no se
    compara;
  - la diferencia es una resta con su signo y su unidad («+1,5 kg», «−0,8 cm»);
  - la primera toma dice que todavía no hay con qué compararla;
  - sin una columna vacía del error mientras no haya dato, pero con la línea que dice que falta (GR-D4).
- *Lo que NO hace:* sin flechas verdes o rojas y sin palabras que califiquen el cambio; no interpola ni arrastra
  valores.
- *Evidencia:* el informe de BodySpec (la base y la anterior); Hind et al. 2018.

### 4.2 Fase 2 · la base · rama A, `wp-graficos-base`

**La base, sin cambio visible.** No tiene ID de la propuesta; la usan las otras cuatro ramas.
- **El catálogo de series** (`packages/domain/src/series-disponibles*.ts`): envuelve el diccionario de DL-126 sin
  cambiar su versión, con la suya (`BE-SERIES-2026-11-v1`). Cada serie dice su área, su unidad, su eje X (`FECHA`,
  `SESION` o `SEMANA`), de qué lectura sale, qué alcances necesita (caso 1), su método, su marca y su estado:
  `OFRECIDA`, `EN_PREPARACION` (la programa una rama de esta fase) o `PIDE_DL` (no se ofrece). Los IDs tienen la forma de
  `ReferenciaDeMetrica.metricId` (`area.nombre`): una serie nueva se guarda en una vista o en un enfoque sin cambiar
  ningún esquema. **Series nuevas:** el 1RM estimado (Epley v1), el RIR indicado y los g/kg de proteína, carbohidratos y
  grasa.
- **Los IDs de los gráficos sugeridos** (`graficos-sugeridos.ts`): opacos y estables, con la forma `area.nombre`
  (`entrenamiento.fuerza-estimada`, `nutricion.energia-por-dia`, `cruce.carbohidratos-y-fuerza`…). GR-04, GR-11 y
  GR-23 no se eligen sueltos: son la marca del buscador, la capa de temporadas y la cinta.
- **Las piezas comunes**, en SVG propio y sin la biblioteca de gráficos, en `apps/web/src/app/pro/advisees/graficos/`:
  el eje de fechas común (sobre `seguimiento/geometria.ts`), los carriles y los paneles alineados, el cursor compartido
  y el teclado, la lectura persistente de la fecha elegida (una región viva cortés), los estados vacíos, la tabla
  equivalente y las lecturas (en tramos de 92 días, sin pedir dos veces lo que está en vuelo y sin caché).
- **Las marcas por su sentido** (`marcas-de-los-graficos.ts`, que PG-18 reusa en la APK): lo registrado, lleno; lo
  indicado y un subtotal, hueco; la carga rápida, hueca y gris; la serie observada por el profesional, rombo; lo
  reportado, contorno cortado; lo calculado, punto adentro. Lo cargado tarde, con una muesca y su texto.
- **Los estados vacíos:** cargando (con alto fijo), sin datos («Sin sesiones registradas desde el inicio del
  acompañamiento»), falta historia («Se arma con 5 sesiones por lado; hay 3 y 7»), error (con «Reintentar», sin parecer
  un vacío) y sin acceso, que no dibuja nada: el gráfico no está.
- **La guardia de vocabulario** (`vocabulario-de-los-graficos.ts`): la **unión** de las listas de términos de las áreas
  del gráfico, cada una con su regla, más lo que no va en ningún lado. Con Nutrición, el signo de porcentaje no va en
  ningún texto del gráfico, aunque también esté Antropometría. Y la frase fija: «Coinciden en el tiempo; esto no prueba
  que una cosa cause la otra.».
- **El ruido de la estimación** (`lectura-de-la-estimacion.ts`): por versión, la mediana del RIR, el rango de
  repeticiones y la mayor diferencia entre estimaciones seguidas del núcleo (GR-T16), y el cambio de lo indicado entre
  versiones («el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no»).

**GR-23 · La cinta del tiempo de la persona**
- *Qué ve el profesional:* una banda fina fija arriba de los gráficos, sobre el mismo eje de fechas: las versiones de los
  planes como barras; las tomas, las sustituciones, las revisiones y las notas de coordinación como íconos con forma y
  texto. Los hitos que caen juntos se agrupan («3 hitos»). Elegir un tramo en la cinta lo elige en todos los carriles.
  Debajo de cada carril, la franja de cobertura, con lo cargado tarde («3 de 21 días cargados después»).
- *Dónde:* arriba de «Analizar», de «Patrones» y de los gráficos de la ficha.
- *API:* no. API-DSH-04 (los hitos, con `recordedLate`) y las vigencias de los planes de las áreas permitidas.
- *Criterios de aceptación:*
  - un evento de un área sin acceso no llega (la API ya lo filtra) ni se dibuja como «algo pasó»;
  - una descarga no se infiere: sin dato, no se dibuja;
  - sin flechas causales por cercanía;
  - las notas de la persona al finalizar (PG-15) y las notas propias del profesional (PG-16, solo para su autor) entran
    como dos fuentes más cuando se integre la tanda B;
  - los hábitos que declara la persona (SP-08) tienen su lugar reservado y no se dibujan hasta su DL (GR-D10).
- *Lo que NO hace:* no interpreta lo que pasó ni une un evento con un cambio de otro gráfico.
- *Evidencia:* LifeLines (Plaisant y Shneiderman, 1996) y Epic Timeline; Bell et al. 2023 (la descarga).

### 4.3 Fase 2 · Entrenamiento · rama B, `wp-graficos-entrenamiento`

El cuadro del ejercicio de la estación suma dos pasos: **«Historial»** (GR-02 si el ejercicio es de la lista de la v1,
GR-03 y GR-05 alineados, con la cinta debajo) y **«Perfil»** (GR-06). Arriba, el período: 12 semanas, 6 meses o desde
que la acompañás, y «Abrir en Analizar» con el ejercicio y el período ya elegidos. Un ejercicio sin historial dice «Sin
sesiones registradas desde el inicio del acompañamiento». **El cuadro se abre para todos los ejercicios; la tarjeta de
fuerza (ED-75) sigue solo en la lista de la v1 (RM-16).** El cambio de alcance se declara en DL-174.

**GR-02 · 1RM estimado (Epley v1), sesión a sesión, con las versiones del plan de fondo**
- *Qué ve el profesional:* el 1RM estimado de cada sesión como un punto sobre fechas reales: lleno hasta 10
  repeticiones equivalentes, hueco de 10 a 12, rombo para la serie que observó el profesional; las versiones del plan,
  como bandas. Debajo de cada banda, la mediana del RIR registrado y el rango de repeticiones de la serie usada. Si el
  RIR indicado o el rango cambiaron entre versiones, la primera línea lo dice («el RIR indicado pasó de 2 a 1: la
  estimación cambia aunque la fuerza no»). Con cuatro sesiones o más de una misma versión: «entre sesiones de la misma
  versión aparecen diferencias de hasta X kg».
- *Dónde:* el paso «Historial» del cuadro del ejercicio y «Analizar» (la pieza de ED-74, en
  `fuerza/fuerza-en-analizar.tsx`).
- *API:* no. API-PRJ-01 `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE` y API-FZA-01 a 03, con `notIncluded` y sus motivos y
  las versiones del plan. Solo los ejercicios de la lista de la v1, con RIR de 0 a 2 y procedencia PERSON.
- *Criterios de aceptación:*
  - el rótulo es siempre «1RM estimado (Epley v1)»; nunca una diferencia en porcentaje, un «±» ni un intervalo (RM-22,
    DL-171), y nunca «primero → último» ni una flecha;
  - el eje tiene un rango mínimo de 10 kg (22 lb), y los valores extremos van escritos (GR-T15);
  - cada punto va a la versión que regía ese día (GR-T16): la mediana del RIR y el rango de repeticiones salen de los
    puntos de esa versión;
  - el ruido propio se dice desde cuatro sesiones de la misma versión; con menos, dice que todavía no alcanza;
  - una serie de carga rápida (procedencia PLAN) nunca entra en la estimación (DJ-2);
  - la línea no une puntos a través de un hueco; kg y lb nunca van juntas;
  - la tabla equivalente, con «Cómo se calculó».
- *Lo que NO hace:* no marca récords; no sugiere una carga (eso es ED-76); no da la diferencia entre dos puntos sueltos.
- *Evidencia:* Grgic et al. 2020 (la confiabilidad del 1RM medido); LeSuer et al. 1997 (el sesgo de las ecuaciones por
  rango de repeticiones); Helms et al. 2016 y Zourdos et al. 2016 (la escala RIR); `estimacion-de-fuerza.ts`.

**GR-03 · Carga, repeticiones y RIR de la misma serie, en tres paneles alineados**
- *Qué ve el profesional:* tres paneles chicos apilados con el mismo eje de fechas: la carga (con su unidad), las
  repeticiones y el RIR de la misma serie entre sesiones, con una regla vertical común. El RIR indicado de cada sesión,
  como marca hueca.
- *Dónde:* el paso «Historial» del cuadro del ejercicio (todos los ejercicios) y «Analizar».
- *API:* no. LOAD, REPETITIONS y RIR de la progresión por serie (API-PRJ-01 `TRAINING_PROGRESSION_BY_EXERCISE`); el RIR
  indicado, del comparador «Planificado y registrado» (API-TRN-21 y API-SER-01, en tramos de 92 días: GR-T14).
- *Criterios de aceptación:*
  - sin doble eje: un panel por magnitud;
  - el eje del RIR va de 0 al máximo registrado, con 5 como mínimo, y los valores altos van escritos (el contrato admite
    de 0 a 20, con decimales);
  - una serie sin RIR escrito no es RIR 0: no se dibuja y la tabla dice «sin dato»; el RIR que vino del plan no es de
    la persona (hueco y gris, «carga rápida»);
  - la serie del mismo número entre sesiones, sin promediar;
  - la tabla equivalente, a un clic.
- *Lo que NO hace:* no une puntos a través de huecos; no resume el ejercicio en una cifra.
- *Evidencia:* Few 2008 (contra el doble eje); Gleicher et al. 2011 (la yuxtaposición); B10-08 §23.

**GR-05 · RIR indicado y RIR registrado a lo largo del bloque**
- *Qué ve el profesional:* en un mismo panel (la misma unidad), el RIR indicado de cada versión como escalón discontinuo
  y el registrado como puntos. Un filtro «a igual carga» deja solo las series con la misma carga y unidad, y un texto lo
  describe: «la misma carga, con menos RIR registrado».
- *Dónde:* el paso «Historial» del cuadro del ejercicio y «Patrones».
- *API:* no. La lógica del comparador «Planificado y registrado» (`training/comparacion.tsx`), sin una lectura nueva
  (GR-T14).
- *Criterios de aceptación:*
  - un RIR indicado como rango («RIR 1 a 2») se dibuja como segmento hueco;
  - «a igual carga» filtra por la carga y la unidad exactas;
  - lo que se ve se describe; no se resume en una cifra ni se nombra con las palabras prohibidas.
- *Lo que NO hace:* no mide cuánto se hizo de lo indicado; no ajusta el plan solo. La gente con poca experiencia estima
  peor el RIR, y «Cómo leerlo» lo dice.
- *Evidencia:* Zourdos et al. 2016 y Helms et al. 2016; Juggernaut y RP, que usan esta señal para ajustar solos.

**GR-06 · Perfil carga-repeticiones de la persona en el ejercicio**
- *Qué ve el profesional:* una dispersión: en X, las repeticiones equivalentes (repeticiones + RIR); en Y, la carga. Las
  últimas 4 semanas, con otra forma y otro color que las anteriores. Opcionales, las curvas de igual 1RM estimado
  (Epley v1), rotuladas «de la fórmula».
- *Dónde:* el paso «Perfil» del cuadro del ejercicio. Sirve para decidir el rango de repeticiones.
- *API:* no. Se deriva en el cliente de lo que ya devuelve la progresión por serie.
- *Criterios de aceptación:* solo series escritas por la persona con RIR de 0 a 2; un ejercicio y una unidad por
  gráfico; las curvas son de la fórmula, no de la persona.
- *Lo que NO hace:* no dice «récord»; no estima otra cosa que Epley v1.
- *Evidencia:* Strong (la mejor carga por número de repeticiones); la revisión de ecuaciones de 1RM
  (<https://arxiv.org/pdf/2603.17495>); LeSuer et al. 1997.

### 4.4 Fase 2 · Nutrición y Antropometría · rama C, `wp-graficos-nutricion-y-cuerpo`

**GR-11 · Temporadas del objetivo y del plan**
- *Qué ve el profesional:* detrás de los gráficos de Nutrición, bandas tenues con una etiqueta corta («Objetivo v3 ·
  desde el 2/9») y una línea fina en cada cambio. El objetivo de kcal/día y de macros en g/día, como escalón. Es lo que
  permite decir «subió los carbohidratos durante una temporada».
- *Dónde:* todo gráfico de Nutrición, en «Analizar», «Patrones» y la ficha. Detrás de otra área, solo a pedido
  («Mostrar las temporadas de Nutrición») y en el caso 1.
- *API:* no. Las versiones del objetivo y del plan (API-NUT-08 y 09; `objectiveSteps` y `planVersions` de API-PRJ-01).
- *Criterios de aceptación:*
  - un objetivo guardado como proporción de las calorías se escribe como proporción y no se dibuja ni se convierte a
    gramos: convertirlo pediría factores por macro que BE no tiene como método aprobado;
  - sin color de «bueno» o «malo» por temporada;
  - cada registro se lee contra la versión que regía ese día (REG-06-105);
  - sin el signo de porcentaje.
- *Lo que NO hace:* no va por defecto detrás de la fuerza: las temporadas de Nutrición detrás de otra área invitan a
  leer causa.
- *Evidencia:* MacroFactor (el historial de objetivos); REG-06-105.

**GR-12 · Energía registrada por día, con lo que se sabe de cada día**
- *Qué ve el profesional:* la energía registrada de cada día como un punto: lleno si el día tiene cantidades en todos
  sus registros y ninguna comida del plan sin registro (COMPLETE); hueco si es un subtotal («falta: …»); nada si no hay
  registro. Sin plan vigente o sin día tipo, la marca dice «no se puede saber si faltan comidas». Lo cargado tarde, con
  otra marca. El objetivo, en escalón. La media semanal dice con qué días se hizo, cuántos quedaron afuera y por qué
  («con 5 de 7 días; 1 sin registro y 1 con cantidades faltantes»), y se corta si no alcanza.
- *Dónde:* «Analizar», la ficha y «Patrones».
- *API:* no. API-PRJ-01 `NUTRITION_PRESCRIBED_VS_RECORDED` (`SUM_SOURCE_PER_100G_V1`), con la calidad del punto y
  `coverage.planMeals`; lo cargado tarde, de API-DSH-04 (`late`).
- *Criterios de aceptación:*
  - «registrado», nunca «consumido»: el subregistro es sistemático;
  - nunca la palabra «completo» para un día: un día con solo el desayuno, bien cargado, es COMPLETE;
  - un día vacío no es cero; sin rojo ni verde;
  - la media dice cuántos días quedaron afuera: promediar solo los COMPLETE es un sesgo de selección.
- *Lo que NO hace:* no le pide a la persona que estime lo que no registró.
- *Evidencia:* Hill y Davies 2001 (el subregistro); DL-153 y `contratos-analisis.ts` (`CalidadDePunto`).

**GR-13 · Proteína, carbohidratos, grasa y fibra, cada uno en su panel**
- *Qué ve el profesional:* cuatro paneles apilados con el mismo eje de fechas y la franja del objetivo de cada versión,
  en g/día. Con Antropometría propia, también en g/kg, con la fecha de la toma usada («peso del 3/11»).
- *Dónde:* «Analizar» y «Patrones».
- *API:* no. Los g/día, de API-PRJ-01. Los g/kg se derivan en el website: los gramos del día divididos por el peso medido
  de la última toma propia en ese día o antes; sin toma anterior, sin valor (GR-T13).
- *Criterios de aceptación:*
  - nunca barras apiladas de macros, que invitan a leer proporciones;
  - la fibra desconocida no es cero;
  - los g/kg solo con los alcances de Nutrición y de Antropometría y con tomas propias; cada punto dice la fecha del
    peso; sin cambio relativo; sin el signo de porcentaje.
- *Lo que NO hace:* no usa un peso posterior para un día pasado (API-PLN-03 usa el último peso al guardar el plan; esta
  serie, no); no fija rangos de la literatura (los elige el profesional, TB-39).
- *Evidencia:* Jäger et al. 2017 (ISSN, la proteína en g/kg); Morton et al. 2018.

**GR-14 · Lo indicado y lo registrado, día por día, en gramos**
- *Qué ve el profesional:* por día y por macro, una mancuerna: hueco lo indicado y lleno lo registrado, unidos por una
  línea, con la diferencia escrita («+18 g de carbohidratos»). Debajo, una tira por comida con «sin registro» y «comida
  diferente».
- *Dónde:* la ficha (Nutrición, «Día por día») y «Patrones».
- *API:* no. `construirContraste` y lo indicado por día cuando el plan no deja elegir (DL-158); la tira por comida, de
  API-NUT-17 en tramos de 92 días.
- *Criterios de aceptación:*
  - sin rojo, sin el signo de porcentaje y sin las palabras que califican lo registrado frente a lo indicado;
  - una comida diferente sin cantidades es «sin dato», no 0 g;
  - si el plan deja elegir, no hay indicado por día y no se inventa.
- *Lo que NO hace:* no avisa que la persona «comió de más».
- *Evidencia:* Nutrium, como contraejemplo; REG-06-125 y DL-158.

**GR-18 · Perfil por sitio entre dos tomas**
- *Qué ve el profesional:* una fila por sitio, en orden anatómico, con los valores de dos tomas unidos por un segmento:
  la diferencia entre dos tomas, no una interpolación en el tiempo.
- *Dónde:* la ficha (Antropometría, vista «Por sitio») y «Analizar».
- *API:* no. Los pliegues y los perímetros de cada toma (API-PRJ-01 `ANTHROPOMETRY_LONGITUDINAL`).
- *Criterios de aceptación:* solo dentro del mismo grupo de comparabilidad; un sitio que no se midió es un hueco; la
  línea del error de medición (GR-D4).
- *Lo que NO hace:* no atribuye el cambio de un sitio al ejercicio de esa zona: no hay reducción localizada.
- *Evidencia:* BodySpec (por región); Vispute et al. 2011.

**GR-20 · Masa grasa según cada método, en un eje común**
- *Qué ve el profesional:* un panel por tipo de masa, con un eje común en kg: la masa grasa según Durnin-Womersley y
  según Faulkner, cada una con su forma y su versión; la masa libre de grasa, en otro panel con su propio eje común. La
  masa muscular de Lee, aparte, porque estima otra cosa.
- *Dónde:* «Analizar» y la ficha (Antropometría, vista «Por método»).
- *API:* no. `be/masa-grasa-durnin-womersley-*@1`, `be/masa-grasa-faulkner@1` y sus pares de masa libre de grasa, con
  su grupo de comparabilidad. Jackson-Pollock 7 da solo el porcentaje de grasa y no tiene masa en el catálogo.
- *Criterios de aceptación:*
  - el eje es común: uno propio por panel agrandaría cualquier diferencia chica;
  - dice que los dos métodos se mueven juntos por construcción (salen de los mismos pliegues de la misma toma): no es
    una confirmación;
  - cada número con su método, nunca «tu grasa»; la diferencia entre métodos no es un cambio.
- *Evidencia:* Ackland et al. 2012; Hind et al. 2018 (los protocolos no son intercambiables).

### 4.5 Fase 2 · los cruces y «Analizar» · rama D, `wp-graficos-cruces-y-analizar`

**GR-24 · Dos etapas lado a lado, con todas las observaciones**
- *Qué ve el profesional:* los puntos de cada etapa (todas las observaciones, no solo el promedio), lado a lado, con la
  cantidad escrita («7 sesiones / 9 sesiones»), la mediana como marca y la lista de lo que también cambió entre una
  etapa y otra. Con el 1RM estimado, debajo de cada etapa, la mediana del RIR y el rango de repeticiones, y en la primera
  línea, si cambió lo indicado.
- *Dónde:* «Analizar» (sobre «Comparar dos etapas», C-12) y «Patrones».
- *API:* no. Las versiones congeladas del plan como límites exactos (`compararEtapas`).
- *Criterios de aceptación:*
  - con menos de 5 datos de un lado no se dibuja, y se dice cuánto falta;
  - sin ordenar las etapas por mejor o peor;
  - sin restas con el signo de porcentaje en Nutrición.
- *Lo que NO hace:* no es un experimento: el aprendizaje técnico, otro cambio del plan o el peso pueden explicar la
  diferencia, y «Cómo leerlo» lo dice.
- *Evidencia:* Bearable y WHOOP (los mínimos por lado); Kravitz y Duan 2014 (la guía N-de-1 de la AHRQ).

**SP-01 · Carbohidratos registrados × 1RM estimado (Epley v1)**
- *La pregunta:* en la temporada en que subieron los carbohidratos, ¿también se movió el 1RM estimado? Es el ejemplo de
  Dirección.
- *Qué ve el profesional:* dos paneles alineados por fecha: los carbohidratos registrados por día, con lo que se sabe de
  cada día, y el 1RM estimado de un ejercicio de la lista de la v1 por sesión, con el núcleo y la orientativa, y la
  mediana del RIR y el rango de repeticiones de cada etapa. La energía registrada va al lado. Arriba, la cinta; las dos
  etapas, marcadas por las versiones del objetivo. Con un cambio de objetivo de por medio, «Dos etapas» (GR-24) con la
  mediana de carbohidratos y los puntos del 1RM estimado de cada etapa, y la energía de cada una.
- *La ventana de lectura,* fijada antes de mirar los datos: etapas de al menos 3 semanas, separadas por un cambio de
  versión del objetivo; una sola ventana, sin mirar además el efecto del día anterior. En estudios de grupos, los
  carbohidratos solos casi no cambian la fuerza cuando la energía alcanza (Henselmans 2022): va en «Cómo leerlo».
- *Lo que también cambió:* la energía total; el RIR registrado y el rango de repeticiones; un cambio del RIR indicado o
  del rango entre versiones; la fase del plan; una descarga; el peso; el aprendizaje técnico; los días sin cantidades o
  con comidas del plan sin registro; el sueño, que no se registra.
- *Cómo se dice* (ejemplo, con datos sintéticos): «Etapa B (objetivo v3, desde el 2/9, 35 días): mediana de
  carbohidratos registrados de 310 g/día, con los 24 días que tienen cantidades en todos sus registros y ninguna comida
  del plan sin registro (11 quedaron afuera: 7 sin registro y 4 con algún dato faltante). En sentadilla, el 1RM
  estimado (Epley v1) estuvo entre ≈ 98 y ≈ 102 kg en 7 sesiones, con RIR registrado de mediana 1 y series de 5 a 6
  repeticiones; en la etapa A, entre ≈ 92 y ≈ 96 kg en 6 sesiones, con RIR de mediana 2 y series de 5 a 6. Con la
  versión 4 del plan de entrenamiento, el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no. Entre
  sesiones de la misma versión aparecen diferencias de hasta 3 kg. En el mismo tramo también subió la energía
  registrada. Coinciden en el tiempo; esto no prueba que una cosa cause la otra.»
- *El acceso:* caso 1 (el mismo profesional, con Nutrición y Entrenamiento y planes propios en las dos): completo. Caso 2,
  en la fase 3: para la nutricionista, con la carga de la primera serie de hasta tres ejercicios principales, porque el
  1RM estimado no viaja (matriz §3.1); para el entrenador, no existe (no recibe números de Nutrición).
- *La prueba del caso negado:* un entrenador con el alcance de Entrenamiento y sin plan propio de Nutrición pide el
  cruce: no se ofrece, no aparece en gris y no se pide la lectura de comidas.
- *Dónde:* «Ver la relación», en «Patrones». En la defensa, con la cuenta de Dirección (§3).

**SP-02 · Energía registrada × peso de toma a toma**
- *La pregunta:* el objetivo energético de esta temporada, ¿se ve reflejado en el peso, de una toma a la siguiente?
- *Qué ve el profesional:* paneles apilados: la energía por día con su media semanal (que dice con qué días se hizo) y el
  objetivo en escalón; abajo, el peso de cada toma como punto, sin unir, con los días entre tomas escritos. Sin mínimo y
  máximo semanal mientras no exista el peso en casa.
- *La ventana de lectura:* de una toma a la siguiente, con al menos 14 días entre tomas. En estudios de grupos, el peso
  del día varía por agua, glucógeno y sodio, y el equilibrio nuevo tarda mucho más (Hall 2011).
- *Lo que también cambió:* el subregistro y los días sin cantidades o con comidas del plan sin registro; el agua y el
  glucógeno al cambiar los carbohidratos; el ciclo menstrual; la actividad fuera del gimnasio; la hora y las condiciones
  de cada toma; el error de medición de quien mide.
- *Cómo se dice* (ejemplo, con datos sintéticos): «Desde el objetivo v4 (2/10) hasta la toma del 28/10 (26 días), la
  mediana de energía registrada fue de 2.150 kcal/día, con los 19 días que tienen cantidades en todos sus registros y
  ninguna comida del plan sin registro (7 quedaron afuera: 4 sin registro y 3 con algún dato faltante). El peso pasó de
  81,2 kg en la toma del 30/9 a 80,1 kg en la del 28/10, 28 días después. BE no tiene cargado el error de medición de
  quien mide ni las condiciones de cada toma: no se puede decir si 1,1 kg lo supera. Coinciden en el tiempo; esto no
  prueba que una cosa cause la otra, y lo registrado puede no ser todo lo comido.»
- *El acceso:* caso 1 (el mismo profesional, con Nutrición y Antropometría y planes o tomas propios): existe. Caso 2, en
  la fase 3: para la nutricionista, con el peso que deja la matriz §3.1. Para quien lleva solo Antropometría o solo
  Entrenamiento, no existe.
- *La prueba del caso negado:* un profesional de Antropometría sin Nutrición pide el cruce: no se ofrece y no se lee
  ningún registro de comida.
- *Dónde:* «Ver la relación», en «Patrones».

**GR-26 · «Armá tu gráfico»: alineadas o superpuestas**
- *Lo que pidió Dirección:* «…ver uno arriba del otro, superpuestos en el mismo gráfico si comparten la x o alineados
  uno arriba del otro para que los entrenadores vean los gráficos que necesiten además de los sugeridos».
- *Qué ve el profesional:* en «Analizar», el selector ofrece el catálogo de series agrupado por área, con los sugeridos
  primero; las series nuevas (el 1RM estimado, el RIR indicado y los g/kg) aparecen cuando están ofrecidas, y las de un
  área sin acceso no aparecen. Los modos se llaman **«Alineadas»** (una arriba de la otra, el modo por defecto) y
  **«Superpuestas»** (en el mismo gráfico) (GR-T05). «Cambio relativo» queda como está y no se amplía a las series
  nuevas. En «Patrones», «Agregar un gráfico › Armá tu gráfico» abre el compositor: hasta tres series, el ejercicio, la
  serie y la unidad cuando hacen falta, el modo, una vista previa y «Agregar al enfoque».
- *Las reglas de «Superpuestas»:*
  - solo con el mismo eje X: las series de día, de sesión o de toma entre sí; las semanales, solo con otras semanales
    (GR-T03);
  - hasta tres series y dos unidades, con un eje a cada lado. Dos series con la misma familia y unidad comparten eje
    (DL-126). Con tres unidades, el modo se deshabilita y dice por qué: «Superpuestas admite dos unidades. Con kg, g/día
    y RIR, miralas alineadas» (GR-T02);
  - cada eje, rotulado con el nombre corto, la unidad y el glifo de sus series; el nombre de cada serie también va al
    final de su línea; el color nunca es lo único;
  - la escala de cada serie es la de «Alineadas»: no se elige a mano ni se estira para que las líneas se crucen; el
    dibujo no sombrea entre líneas ni marca cruces;
  - la frase «Coinciden en el tiempo; esto no prueba que una cosa cause la otra.» va debajo cuando hay dos áreas o dos
    ejes, en cualquier modo (GR-T06), y reemplaza «coincidencia temporal; no indica causa» de «Analizar». «Cómo leerlo»
    explica que con dos escalas un cruce de líneas no quiere decir nada;
  - Antropometría sigue en puntos sueltos, también superpuesta;
  - la tabla equivalente tiene una columna por serie, con su unidad.
- *API:* no. En la URL y en las vistas guardadas (API-VAN) los modos siguen siendo `PANELS` y `OVERLAY`: una vista
  guardada con `OVERLAY` era de una sola unidad y se ve igual.
- *En el código:* `composicionPermitida` y `fraseDeLaCoincidencia` (rama A) reemplazan a `superposicionPermitida` en
  «Analizar», que queda exportada y sin cambios; `seguimiento/lienzo.tsx` suma dos ejes Y (`yAxisId`), y cada línea,
  punto de referencia y área de referencia, con el suyo; el compositor y la versión superpuesta en SVG propio para
  «Patrones» van en `graficos/arma-tu-grafico/`.
- *Lo que NO hace:* no superpone series con distinto eje X; no ofrece una serie de un área sin acceso ni una que pide DL;
  no calcula una correlación.
- *Evidencia:* Few 2008 («Dual-Scaled Axes in Graphs: Are They Ever the Best Solution?»); Datawrapper, sobre los
  gráficos de dos ejes; los usuarios de Cronometer, que encuentran confusos sus gráficos de eje izquierdo y derecho.

### 4.6 Fase 2 · «Patrones» y los enfoques · rama E, `wp-graficos-patrones-y-enfoques`

**La sección «Patrones»**
- *Qué ve el profesional,* de arriba abajo:
  1. la cinta del tiempo (GR-23), fija arriba al desplazar;
  2. «En el tiempo»: los gráficos del enfoque que van sobre fechas, cada uno en su tarjeta a todo el ancho, con el mismo
     eje y un solo cursor para toda la columna. Cada tarjeta: la pregunta corta como título, el método, la cobertura,
     «Ver la tabla», «Abrir en Analizar» (con el ejercicio, la serie y el período ya elegidos) y, al editar el enfoque,
     «Subir», «Bajar» y «Quitar»;
  3. «Comparaciones»: lo que no va sobre el tiempo (GR-06, GR-18 y GR-24), con su propio eje;
  4. «Ver la relación»: los cruces preparados que existen en el caso del profesional (SP-01 y SP-02 en el caso 1), cada
     uno con su ventana, lo que también cambió y la frase. Si no lleva las dos áreas con planes propios, la sección no
     está;
  5. «Agregar un gráfico»: los sugeridos que faltan y «Armá tu gráfico» (GR-26);
  6. lo que falta: «Se arma con 5 sesiones por lado; hay 3» o «La historia empieza el día que empezaste a
     acompañarla».
- *Dónde:*
  - en la ficha, como una vista más (`vista=patrones`), **entre «Resumen» y «Línea de tiempo»** (GR-T12), con el período
    de la ficha (acortado al inicio del acompañamiento: TB-16) y su pista: «Los gráficos de esta persona en el mismo
    tiempo, con lo que pasó en cada momento»;
  - en el panel de la estación de los dos editores, como una pestaña más (la cuarta en Entrenamiento, la tercera en
    Nutrición), en densidad compacta, con su período (12 semanas, 6 meses o desde que la acompañás) y, de fondo, las
    versiones del plan que se edita. Se pliega con el panel, que en 1280 ya va plegado. Nada de ahí escribe en el plan.
- *Sin enfoque elegido, los sugeridos para tus áreas,* como los indicadores del Resumen (TB-25), hasta seis y sin
  repetir: con Entrenamiento, GR-02 con el ejercicio más registrado de la lista de la v1 (si hay uno), y GR-03 y GR-05
  con el más registrado; con Nutrición, GR-12 y GR-13; con Antropometría, GR-16 o, si no entró, GR-20. El cruce que
  corresponde va en «Ver la relación», no entre los seis.
- *API:* no: lee lo de las otras partes.
- *Criterios de aceptación:*
  - «Patrones» no lee ni muestra un área sin acceso;
  - unas veinte lecturas por período, de a cuatro (`limitarLectura`) y sin pedir dos veces lo que está en vuelo, lejos
    del límite de 120 por minuto; la estación lee menos;
  - se mide en las tres resoluciones de escritorio (1440, 1280 y 1024) antes de integrar: plegada en 1280, no tapa la
    planilla;
  - con teclado: las tarjetas y el cursor común, y cada gráfico con su tabla.

**GR-27 · Los enfoques: los gráficos favoritos para una persona o un plan**
- *Lo que pidió Dirección:* «podrían tener también su stand de gráficos favoritos para elegir ver en ese plan o persona
  hasta que lo vayan cambiando, no sé, pensaba que capaz si se estaban enfocando en fuerza o algo en específico ya
  sabían qué trackear principalmente».
- *Qué ve el profesional:* arriba de «Patrones», «Enfoque: Foco en fuerza ▾», con sus enfoques, «Sugeridos para tus
  áreas», «Guardar lo que ves como enfoque…», «Editar este enfoque» y «Mis enfoques…». Elegir uno lo guarda para la
  persona en el momento, con «Deshacer». En la pestaña de la estación: «Enfoque de este plan» (o el de la persona, si el
  plan no tiene uno), con «Para este plan» y «Para la persona». «Mis enfoques» es un cajón con la lista, renombrar,
  duplicar y borrar, y «Elegido en 4 lugares». Cambiar uno elegido en otros lugares avisa: «Lo usan 4 personas: el
  cambio se ve en todas. ¿Guardar como uno nuevo?».
- *Qué es un enfoque:*
  - un conjunto de hasta seis gráficos con nombre (GR-T07), **propio del profesional y reutilizable**. Cada gráfico es
    un sugerido (con su ejercicio o su medida) o uno armado con «Armá tu gráfico» (hasta tres series y su modo);
  - el ejercicio puede ser uno fijo del catálogo o «el más registrado» del período, 1.º a 3.º (GR-T08), para que sirva
    con cualquier persona; lo que no aplica con una persona no se dibuja;
  - **guarda referencias, nunca datos:** abrirlo vuelve a pedir todo a la API, que decide con el PDP en ese momento. Un
    enfoque no concede nada.
- *Dónde rige* (GR-T09): el de un plan, en la estación de ese plan; el de la persona, en el resto; sin ninguno, los
  sugeridos para tus áreas. **Queda hasta que se cambie.**
- *API:* **sí: la familia GRF (API-GRF-01 a 07, §7),** dos tablas y una migración que solo agrega.
- *Criterios de aceptación:*
  - un enfoque o una elección ajenos responden el mismo 404 que uno inexistente;
  - sin un vínculo vigente en algún alcance, API-GRF-05 a 07 responden 404; las elecciones de antes quedan guardadas y
    no se leen;
  - un plan ajeno o de un área sin alcance: 404;
  - el contenido es un esquema estricto, sin un campo donde poner un valor, una nota clínica ni el nombre de la
    persona. El nombre del enfoque y el título de un gráfico propio llevan la pista «No pongas datos de salud: el
    enfoque se usa con varias personas»;
  - los topes: seis gráficos por enfoque y 50 enfoques por profesional;
  - crear, borrar y quitar con `Idempotency-Key`; cambiar, con la versión esperada; dos pestañas que eligen a la vez no
    dejan dos elecciones: la segunda recibe 409;
  - borrar un enfoque quita sus elecciones, después de avisar en cuántos lugares estaba elegido (GR-T10);
  - la auditoría, en la misma transacción.
- *Lo que NO hace:* no entra en la exportación de la persona: es configuración del profesional, como las vistas de
  DL-128 (GR-T11). La APK no lo lee: no se congela nada. No suma un enlace a la navegación del espacio profesional.
- *Antecedentes:* el anclaje de minigráficos de la propuesta («la elección queda guardada para esa persona») y las
  vistas guardadas de «Analizar» (API-VAN, DL-128).

### 4.7 Lo que queda de la fase 2 sin rama en este reparto

La propuesta pone estas piezas en su fase 2, pero ninguna de las cinco ramas las toma. Las que piden una lectura nueva
se declaran con su ID y su DL al programarse; no se abre una operación sin decisión.
- **GR-01 completa:** todos los ejercicios, más allá de 92 días, hasta cinco sesiones y la línea de 12 semanas (el 1RM
  estimado en la lista de la v1 y la carga de la serie 1 en el resto). Pide una lectura de «las últimas N sesiones de un
  ejercicio»: hoy API-TRN-21 llega a 92 días y API-PRJ-01 da una métrica y un número de serie por pedido.
- **La vista previa de GR-04:** la cantidad de sesiones, el último valor y el mínimo y el máximo del período, sin
  flecha, al enfocar o al pasar el mouse. Pide una lectura por lote.
- **El contexto al elegir un ejercicio, fuera del historial:** el perímetro de la zona principal del ejercicio, si el
  mismo profesional lleva Antropometría con tomas propias, con el aviso de que no hay reducción localizada.
- **El contexto del editor de Nutrición:** al tocar un macro del objetivo en «Rangos y totales» (sus últimas 12
  semanas, las versiones anteriores en escalón y la mediana de cada temporada), en el paso 2 del asistente (la energía
  de las últimas 4 semanas y las tomas del mismo tramo) y al elegir una opción o una receta (cuántas veces la registró
  la persona). En la fase 2, el editor de Nutrición recibe «Patrones» como pestaña de su estación.

### 4.8 Fases 3 a 5: declaradas, sin programar

Cada una espera lo que dice; mientras tanto, el catálogo la deja en `EN_PREPARACION` o `PIDE_DL` y «Armá tu gráfico» no
la ofrece.

**Fase 3 · enero y febrero de 2027: lo ratificado que espera programación, y el caso 2**
- **GR-07 · «Lo que trabaja la semana»:** con el borrador, cuántas series por semana nombra cada zona, como principal y
  como secundaria, contadas con la regla de D-15 (una serie por zona, por rol y sin ponderar), en el cuerpo y en una
  tabla, recalculadas al editar. Sin rango, sin mínimos ni un ideal y nunca al lado de lo registrado (D-20); lo
  registrado por zona va aparte, como la capa Trabajo (D-14). Espera TB-31 y TB-38. El rótulo: «Series por zona y por
  semana».
- **GR-09 · kg × repeticiones del ejercicio por semana:** barras semanales por ejercicio, sin sumar ejercicios
  distintos, con la cobertura de la semana. Espera TB-34 y su término (GR-D2). Las series largas lo inflan y no equivale
  a estímulo.
- **GR-10 · La carga de la semana con el esfuerzo de la sesión:** barras semanales en unidades arbitrarias (esfuerzo ×
  minutos) con la media de las 4 semanas previas, sin cociente. Espera D-16 y TB-35 (API-ESF), con la duración medida.
  Sin «riesgo» ni «fatiga»; una semana con sesiones sin esfuerzo es un subtotal y lo dice.
- **GR-15 · El reparto de la proteína por comida:** una grilla día × comida con una sola tinta y gris para lo que no
  tiene dato. Espera TB-34. Un umbral por comida no es una meta de BE; «sin registro» no es «no comió».
- **GR-22 · Somatocarta con el recorrido de la persona:** el triángulo con los puntos numerados por fecha y, debajo, los
  tres componentes en el tiempo. Espera TB-34 y D-3, D-4, D-10 y D-11 de las medidas en la APK. Sin etiquetas
  categóricas ni puntos de deportistas de referencia.
- **SP-03 · Energía y peso × 1RM estimado, en una etapa de déficit:** mientras baja el peso, ¿se sostiene el 1RM
  estimado? Tres paneles alineados, etapas de al menos 4 semanas comparadas por semanas y entre tomas, sin un cociente
  fuerza/peso como cifra resumen. Caso 1, con las tres áreas; caso 2, para la nutricionista, con la carga de la primera
  serie; para el entrenador, no existe.
- **SP-05 · Proteína (g/kg/día) × masa muscular de Lee con perímetros:** la mediana de g/kg/día de cada intervalo entre
  tomas junto a la diferencia de la medida, con al menos 6 semanas entre tomas, nunca semana a semana. Solo la masa
  muscular de Lee con perímetros o los perímetros corregidos (las que arrastran el peso confunden un kilo perdido con
  músculo perdido).
- **SP-07 · Series por semana × RIR registrado a igual carga:** después de semanas con más series o de una descarga
  declarada, ¿la misma carga se registra con otro RIR? Dentro de Entrenamiento; no viaja a otras áreas (la matriz no
  comparte el RIR).
- **El caso 2 de SP-01 y SP-02,** por API-RES, después de TB-29 y de la revisión legal.

**Fase 4 · desde marzo de 2027: lo que pide una DL o un desafío del legajo**
- **GR-08 · Series según un umbral de RIR del profesional:** barras semanales segmentadas (RIR hasta el umbral, mayor,
  sin RIR escrito y carga rápida, los dos últimos siempre a la vista). Es un desafío de M-11, con su fundamento
  (Robinson 2024) y su DL; mientras tanto, GR-03 y GR-05 muestran el RIR sin fijar un umbral.
- **GR-17 · Suma de pliegues con la franja del error de medición:** la franja del cambio mínimo detectable (≈ 2,77 × el
  error técnico) alrededor de la toma de referencia, con el error relativo de la suma (Woolford y Gore). Espera GR-D4.
- **GR-19 · Perímetro bruto y perímetro corregido por pliegue:** dos paneles alineados; el corregido es el paso de Lee
  v1 con perímetros, con su misma versión (GR-D9). No viaja al entrenador.
- **GR-25 · Lo de sus semanas anteriores:** una banda gris del mínimo al máximo de las 8 semanas anteriores con datos,
  con el texto en sus unidades, sin una frase automática de «se salió» y sin la palabra «rango». Espera GR-D8.
- **SP-04 · Series por zona y por semana × perímetro de esa zona:** necesita la capa Trabajo y el perímetro corregido;
  nunca al lado de lo que indicaba el plan (D-20).

**Fase 5 · después del piloto: el peso en casa, los hábitos y otras áreas**
- **GR-21 · Masa corporal con las condiciones de la toma:** las tomas en condiciones distintas, como rombo con el motivo;
  con el peso en casa, el mínimo y el máximo de cada semana como segmento, en su propia serie y sin línea suavizada
  (GR-D5). Espera las condiciones de la toma y el peso en casa (D-16, TB-37, API-PCA).
- **SP-06 · Carbohidratos por día × pesajes en casa:** los 7 días siguientes a un cambio de objetivo, con los pesajes en
  su propia serie, nunca unidos a las tomas. Espera el peso en casa.
- **SP-08 · Hábitos declarados × carga y RIR registrados:** los hábitos como escalón de contexto en la cinta, con
  «Declarado por la persona», y, con datos suficientes, antes y después de la nueva versión (mínimo 5 y 5). Espera
  GR-D10. Una pregunta por sesión sería un dato de salud nuevo, con su DL y su revisión legal.

## 5. Las reglas de honestidad

Valen para todas las partes, en todas las fases. Cada una tiene su por qué.

1. **Coincidir no es causar.** Cada cruce lleva la frase fija, una sola ventana de lectura fijada antes de mirar y la
   lista de lo que también cambió en esa ventana; la explicación fisiológica va en «Cómo leerlo», con su fuente. *Por
   qué:* dos series que suben con el tiempo se correlacionan aunque no tengan relación (Yule 1926; Granger y Newbold
   1974), y la evidencia sobre carbohidratos y fuerza es débil (Henselmans 2022).
2. **Sin coeficiente de correlación como titular y sin buscar correlaciones solo.** *Por qué:* con muchos pares aparecen
   coincidencias casuales. Si alguna vez se muestra un r, va en un detalle técnico, con la cantidad de semanas.
3. **Paneles alineados con el mismo eje de fechas.** *Por qué:* con dos escalas, el doble eje deja dibujar cualquier
   cruce y cualquier pendiente relativa (Few 2008; Datawrapper). **Enmienda por el pedido de Dirección:** el doble eje
   existe solo en «Superpuestas», que elige el profesional, con la escala de «Alineadas», sin sombrear entre líneas, con
   dos unidades como máximo, la frase y «Cómo leerlo» (GR-26). Los sugeridos y los cruces preparados siguen en paneles
   alineados.
4. **Un hueco es un hueco:** líneas cortadas, promedios con su cantidad y ningún cero inventado. *Por qué:* REG-06-165
   y 166 prohíben imputar o suavizar, y un día sin registro dibujado como cero hace creer que la persona no comió o no
   entrenó.
5. **Lo registrado por la persona, separado de lo precargado del plan.** *Por qué:* con la carga rápida (DL-161), una
   serie puede tener los números del plan sin que la persona los escriba; solo la procedencia PERSON entra en las
   estimaciones (DJ-2).
6. **Cada cálculo con su método, su versión y su rango de validez a la vista.** *Por qué:* un número sin método es un
   número que el profesional no puede firmar. El 1RM estimado se degrada por encima de 10 a 12 repeticiones y con un RIR
   alto.
7. **En Antropometría, el cambio se lee contra el error de medición;** sin el error cargado, cada texto lo dice: «BE no
   tiene cargado el error de medición de quien mide: no se puede decir si 0,8 cm lo supera». *Por qué:* un cambio de
   3 mm puede estar dentro del error de quien mide; planificar sobre ruido es peor que no tener el gráfico (Hind 2018).
8. **Los mínimos de datos, declarados:** con menos de 5 sesiones por lado o menos de 4 semanas de historia no se dibuja
   un patrón. *Por qué:* un gráfico con dos puntos parece estable o parece un salto; decir cuánto falta es la forma
   honesta de «cuanto más se usa, mejor».
9. **Solo la propia historia de la persona como referencia.** *Por qué:* ubicar, nunca calificar, y nada de comparar con
   otras personas: sin percentiles de población, rangos poblacionales ni promedios de usuarios.
10. **Un cruce existe completo solo en el caso 1;** entre profesionales distintos, solo lo que deja la matriz §3.1, por
    API-RES y después de TB-29 y de la revisión legal. Cada cruce tiene su prueba del caso negado. *Por qué:* los datos
    de salud son sensibles y cada lectura del profesional ya está acotada a sus planes; un área sin acceso no aparece ni
    como hueco ni con candado, para no delatar que hay datos.
11. **Las palabras:** «1RM estimado (Epley v1)», «series por zona y por semana», «registrado» y no «consumido»; con
    Nutrición, sin el signo de porcentaje. *Por qué:* las listas de términos de cada área existen porque esas palabras
    afirman más de lo que BE sabe; un gráfico de dos áreas respeta la unión de las listas.
12. **El ruido antes que el cambio:** con el 1RM estimado, la mediana del RIR y el rango de repeticiones de cada tramo,
    el cambio de lo indicado en la primera línea y el ruido propio de la persona en texto, sin «±»; nunca «primero →
    último» ni una flecha. *Por qué:* cada unidad de RIR mueve la estimación en carga/30, y el RIR autoinformado se
    yerra en cerca de una repetición: una brecha de 4 kg puede ser solo RIR.
13. **Un día de comida se describe con lo que BE sabe:** «con cantidades en todos sus registros y sin comidas del plan
    sin registro», nunca «día completo»; cada media dice con qué días se hizo, cuántos quedaron afuera y por qué. *Por
    qué:* COMPLETE no dice que el día esté completo (DL-153), y promediar solo los días cuidados es un sesgo de
    selección.
14. **Lo cargado tarde se marca** en cada punto y en la franja de cobertura. *Por qué:* un registro cargado días después
    es un recuerdo; para leer patrones en el tiempo esa diferencia importa, y BE ya guarda los dos relojes
    (`occurredAt` y `recordedAt`).

## 6. Las decisiones

### 6.1 GR-D0 a GR-D10 · tomadas por la delegación de Dirección, según la recomendación

Dirección delegó: «a menos que sea una decisión crítica con criterio haz lo que me recomiendes». Ninguna de estas es
crítica en ese sentido (ninguna cambia una garantía del legajo ni abre datos de salud a otro profesional), así que rige
la recomendación de la propuesta. Las que piden su propia DL la abren al programarse, en su fase.

- **GR-D1 · La fase 1 de solo lectura** · **rige la recomendación; el 2026-11-14 se adelantó la fase 2 y se levantó el congelamiento.**
  - *La pregunta:* ¿se declara el paquete con estos IDs y entra antes del 23/11 una fase 1 de solo lectura: la marca
    «con historial» (GR-04), la tabla desde el inicio y desde la anterior (GR-16) y «La vez pasada» reducida (GR-01)?
  - *Rige:* sí, y SP-01 en la defensa con la cuenta de Dirección, que lleva las dos áreas. El pedido del 14/11 («ya
    tienes que ponerte a trabajar en eso») adelanta la fase 2, y la regla del mismo día («Todo se integra lo antes posible una vez que esté aprobado, no retrasamos las cosas por la planificación, si adelantamos la producción se adelanta todo») levanta el
    congelamiento: cada rama entra apenas queda aprobada (§3).
  - *Alternativa descartada:* no programar nada nuevo antes del 25/11 y presentar la propuesta como visión.
  - *En el código:* ninguna rama de la fase 2 toca GR-01, GR-04 ni GR-16; SP-01 se muestra en vivo solo si la rama D
    ya entró.
- **GR-D2 · El término de TB-34** · **rige la recomendación.**
  - *La pregunta:* ¿qué término de pantalla reemplaza a la palabra prohibida para TB-34 (DL-163 D-15), y con qué
    convención para la mancuerna única, lo unilateral y el peso corporal?
  - *Rige:* «kg × repeticiones por semana (método v1)», por ejercicio y sin sumar ejercicios distintos, en una DL nueva
    que también saque la contradicción con INV-06-153.
  - *Alternativa descartada:* «Carga movida por semana», más amable y menos explícito sobre cómo se calcula.
  - *En el código:* GR-09 es de la fase 3 y abre esa DL. Hasta entonces la palabra sigue prohibida, el catálogo deja la
    serie en `PIDE_DL` y la entrada vieja del diccionario sigue sin ofrecerse.
- **GR-D3 · retirada.** Estaba en la primera versión de la propuesta: la cuenta por zona ya la fijó D-15 (TB-31). Queda
  en GR-D0.
- **GR-D4 · El error técnico de medición** · **rige la recomendación.**
  - *La pregunta:* ¿BE carga el error técnico de medición del profesional antropometrista (GR-17)?
  - *Rige:* sí: el profesional lo declara una vez por sitio (o el de su nivel ISAK) y queda con cada toma; más adelante,
    las réplicas por sitio, para calcularlo con sus propios datos.
  - *Alternativa descartada:* un error fijo de protocolo para todos, rotulado «de referencia ISAK», menos fiel a cada
    evaluador.
  - *En el código:* es de la fase 4, con su DL. Mientras tanto, GR-16, GR-18 y GR-20 llevan la línea «BE no tiene
    cargado el error de medición de quien mide: no se puede decir si estos cambios lo superan», sin franja y sin una
    columna vacía.
- **GR-D5 · La línea del peso que filtra el ruido** · **rige la recomendación.**
  - *La pregunta:* ¿se permite una línea del peso que filtre el ruido del día (como MacroFactor), hoy prohibida como
    «tendencia automática»?
  - *Rige:* todavía no: las tomas como puntos, sin línea. Se reconsidera cuando exista el peso en casa (D-16, TB-37),
    con un método declarado y versionado.
  - *Alternativa descartada:* aprobar ya una media semanal declarada («media de la semana, método v1») sobre los
    pesajes.
  - *En el código:* Antropometría tiene `unirPuntos: false` en el catálogo; ningún modo une tomas ni suaviza, y una
    prueba lo fija.
- **GR-D6 · La historia del profesional anterior** · **rige la recomendación.**
  - *La pregunta:* desafío de RF-025 y DJ-14 (el profesional nuevo no ve la historia del anterior): ¿se abre, con el
    permiso explícito de la persona, lo que ella registró antes del acompañamiento?
  - *Rige:* no por ahora. DJ-14 se mantiene, el límite se dice en pantalla y la persona tiene la exportación de su
    propia historia como derecho propio. El desafío, con su fundamento y su revisión legal, después del piloto; si se
    aprueba, con una marca propia («Antes de tu acompañamiento»), nunca con `partialView`, que en BE quiere decir «hay
    datos de esta área que no ves».
  - *Alternativa descartada:* abrirlo ya con el permiso de la persona, sin las notas del otro profesional, con la
    revisión legal antes del piloto.
  - *En el código:* los gráficos arrancan en el inicio del vínculo (TB-16) y lo dicen; no hay lectura nueva.
- **GR-D7 · retirada.** Era el esfuerzo de la sesión: ya lo fijó D-16 (TB-35). Queda en GR-D0.
- **GR-D8 · Lo de sus semanas anteriores** · **rige la recomendación.**
  - *La pregunta:* ¿se aprueba «lo de sus semanas anteriores» (GR-25) como método de BE?
  - *Rige:* sí, con una DL: del mínimo al máximo de las 8 semanas anteriores con datos (del percentil 10 al 90 solo con
    12 semanas o más), la misma ventana en Entrenamiento y en Nutrición, sin una frase automática de «se salió», sin la
    palabra «rango» y sin usarlo en Antropometría.
  - *Alternativa descartada:* no dibujar bandas y dejar solo «Dos etapas» como comparación con la propia historia.
  - *En el código:* GR-25 es de la fase 4; la fase 2 no lo dibuja.
- **GR-D9 · El perímetro corregido por pliegue** · **rige la recomendación.**
  - *La pregunta:* ¿se expone el perímetro corregido (el paso intermedio de Lee v1 con perímetros) como métrica propia,
    con la misma versión (GR-19)?
  - *Rige:* sí, en Antropometría y para quien lleva el área: la cuenta ya está aprobada dentro de Lee v1, así que no es
    un método nuevo. No viaja al entrenador, porque revela el pliegue.
  - *Alternativa descartada:* dejarlo adentro de Lee y mostrar solo el perímetro bruto y el pliegue al lado.
  - *En el código:* GR-19 es de la fase 4; el catálogo lo deja en `PIDE_DL`.
- **GR-D10 · Las versiones anteriores de los hábitos** · **rige la recomendación.**
  - *La pregunta:* ¿el profesional que recibe los hábitos de la persona (API-HBT-05) puede leer sus versiones
    anteriores, para ponerlas como contexto en la cinta del tiempo (SP-08)?
  - *Rige:* sí, después del piloto y con una DL: es el primer paso de la ampliación a otras áreas, con un dato que ya
    existe, versionado y de solo agregar, con su autorización aparte.
  - *Alternativa descartada:* una pregunta por sesión («¿cómo dormiste?»): más fina, pero es un dato de salud nuevo, con
    su DL y su revisión legal.
  - *En el código:* la cinta deja su lugar reservado y no lee la historia de API-HBT-05.
- **GR-D0 · Lo ya decidido** · **no se vuelve a preguntar.**
  - *Qué es:* el conteo por zona, por rol y sin ponderar (D-15, TB-31); «Lo que trabaja la semana», sin rango y nunca al
    lado de lo registrado (D-20, TB-38); el esfuerzo de la sesión (D-16, TB-35); el profesional nuevo no ve la historia
    del anterior (DJ-14); el peso en casa, después del piloto (D-16, TB-37).
  - *Rige:* programarlos en las fases 3 y 5 tal como están ratificados.
  - *Alternativa:* ninguna; cambiar cualquiera de ellos sería un desafío explícito, con su fundamento.
  - *En el código:* el catálogo los deja en `EN_PREPARACION` o `PIDE_DL` y «Armá tu gráfico» no los ofrece.

### 6.2 GR-T01 a GR-T19 · del continuador en el diseño técnico (a ratificar)

Mientras no haya respuesta, rigen. Cada una con su alternativa, cuando la hay.

- **GR-T01 · El nombre de GR-27:** «Enfoques» («Enfoque: Foco en fuerza», «Mis enfoques»), con la palabra de Dirección
  («si se estaban enfocando en fuerza»). Se descarta «de cabecera», porque en BE la cabecera ya es la barra de arriba
  (DL-117, PG-04). En el código, nombres neutros (`ConjuntoDeGraficos`): si cambia el nombre, cambia un texto.
  *Alternativa:* «Conjuntos de gráficos».
- **GR-T02 · «Superpuestas» admite hasta tres series y dos unidades,** con un eje a cada lado. Con tres unidades, el modo
  se deshabilita y dice por qué. *Alternativa descartada:* un eje por serie (tres ejes), que hace ilegible el gráfico.
- **GR-T03 · «Comparten la x» quiere decir:** las series de día, de sesión o de toma entre sí; las semanales, solo con
  semanales.
- **GR-T04 · La regla de DL-126 se amplía, no se cambia:** con la misma familia y unidad, un eje, como hoy; con unidades
  distintas, dos ejes. La enmienda va en DL-174, por el pedido de Dirección del 14/11. Las vistas guardadas con
  `OVERLAY` siguen iguales.
- **GR-T05 · Los modos de «Analizar» pasan a llamarse «Alineadas» (por defecto) y «Superpuestas»,** con las palabras de
  Dirección; en la URL y en API-VAN siguen `PANELS` y `OVERLAY`. *Alternativa:* dejar «Separadas» y «Juntas».
- **GR-T06 · La frase** «Coinciden en el tiempo; esto no prueba que una cosa cause la otra.» va siempre que hay dos
  áreas o dos ejes, en cualquier modo, y reemplaza «coincidencia temporal; no indica causa».
- **GR-T07 · Los topes:** un enfoque tiene como máximo seis gráficos (el tope que la propuesta pone al panel); un
  profesional, como máximo 50 enfoques, como en API-VAN.
- **GR-T08 · El ejercicio de un gráfico guardado** puede ser fijo (del catálogo) o «el más registrado» del período (1.º a
  3.º), para que el enfoque sirva con cualquier persona.
- **GR-T09 · Dónde rige la elección:** la de un plan, en la estación de ese plan; la de la persona, en el resto; sin
  ninguna, los sugeridos para tus áreas (como los indicadores del Resumen, TB-25).
- **GR-T10 · Borrar un enfoque quita sus elecciones,** después de avisar en cuántos lugares estaba elegido. Cambiar un
  enfoque que usan otras personas pregunta si se guarda como uno nuevo.
- **GR-T11 · Las elecciones de enfoque no entran en la exportación de la persona:** son configuración del profesional,
  como las vistas de DL-128. *Alternativa:* exportarlas, como las notas propias de PG-D11.
- **GR-T12 · «Patrones» es la segunda vista de la ficha,** entre «Resumen» y «Línea de tiempo», y una pestaña del panel
  de la estación en los dos editores. *Alternativa:* ponerla al final, sin mover las pestañas de hoy.
- **GR-T13 · Los g/kg registrados (GR-13) se derivan en el website,** sin API nueva en el caso 1: los gramos del día
  divididos por el peso de la última toma propia en ese día o antes. Sin toma anterior, no hay valor, y cada punto dice
  la fecha del peso. Se aparta de API-PLN-03 (el último peso al guardar) porque una serie del pasado no puede usar un
  peso posterior.
- **GR-T14 · El RIR indicado (GR-03 y GR-05) sale del comparador** (API-TRN-21 y API-SER-01), en tramos de 92 días y sin
  una lectura nueva. *Alternativa:* extender API-PRJ-01 con lo indicado por punto, como DL-158 hizo en Nutrición.
- **GR-T15 · El rango mínimo del eje del 1RM estimado es 10 kg (22 lb),** para que el ruido de un RIR no parezca un
  salto.
- **GR-T16 · El ruido propio se dice desde cuatro sesiones de la misma versión:** la mayor diferencia entre
  estimaciones seguidas del núcleo, en texto, sin «±» ni porcentaje. Cada punto se asigna a la versión que regía ese
  día, porque el punto de fuerza no trae su versión.
- **GR-T17 · La API valida los IDs de gráficos y de series de un enfoque con una expresión,** no con una lista cerrada
  (`^(entrenamiento|nutricion|antropometria|cruce)\.[a-z0-9-]+$` para los gráficos): un gráfico nuevo no obliga a
  redesplegarla, y el website ignora un ID que no conoce.
- **GR-T18 · El calendario de la fase 2** (actualizada el 2026-11-14 por dos pedidos de Dirección): se programa desde
  el 14/11 y cada rama se integra apenas queda aprobada (la revisión adversaria sin altas ni medias pendientes y la CI en
  verde), empezando por la base; la API de los enfoques, después de la base y de la rama D. No hay congelamiento:
  «Todo se integra lo antes posible una vez que esté aprobado, no retrasamos las cosas por la planificación, si adelantamos la producción se adelanta todo». *Antes:* el diseño integraba toda la fase 2 desde el 26/11, y la primera declaración, solo lo sólido antes
  del 23/11.
- **GR-T19 · Los rangos por rama, para no pisarse:** TEST-GRF-001 a 019 (A), 020 a 039 (B), 040 a 059 (C), 060 a 079
  (D) y 080 a 099 (E); las decisiones al programar, en bloques de diez (§6.3); una hoja de estilos por rama, importada
  una sola vez en `app/layout.tsx`, sin tocar `globals.css`.

### 6.3 Las decisiones al programar

Cada rama numera las suyas en su rango, las escribe en su apartado de §13 y en su PR, **a ratificar**: la fase 1,
GR-T70 a 79; A, GR-T20 a 29; B, GR-T30 a 39; C, GR-T40 a 49; D, GR-T50 a 59; E, GR-T60 a 69. Una decisión de producto
que el paquete no resuelve se toma por el lado más conservador y se anota así.

## 7. Las operaciones nuevas: la familia GRF (GR-27)

Una familia propia de BE, **GRF** (gráficos), que la guardia de trazabilidad declara con DL-174 al programarse. Solo
para el website del profesional: la APK no la lee.

| ID | Método y ruta | Para qué | Respuestas |
|---|---|---|---|
| API-GRF-01 | `GET /me/chart-sets` | Tus enfoques, cada uno con en cuántos lugares está elegido | 200; 403 si no es un profesional habilitado |
| API-GRF-02 | `POST /me/chart-sets` | Crear un enfoque: nombre (de 1 a 80) y de 1 a 6 gráficos, solo referencias | 201; exige `Idempotency-Key`; 422 con el contenido inválido, y `TOO_MANY_SETS` desde el número 51 |
| API-GRF-03 | `PUT /me/chart-sets/{setId}` | Cambiar el nombre o los gráficos de un enfoque propio | 200; con `expectedVersion` (409 `VERSION_CONFLICT`); uno ajeno o inexistente, el mismo 404 |
| API-GRF-04 | `DELETE /me/chart-sets/{setId}` | Borrar un enfoque propio; sus elecciones se quitan con él y esas personas vuelven a los sugeridos | 204, también al reintentar; exige `Idempotency-Key` |
| API-GRF-05 | `GET /advisees/{adviseeId}/chart-set-choices` | Qué enfoque elegiste para la persona y para cada uno de sus planes | 200; lectura protegida (429 `RATE_LIMITED`); sin un alcance permitido hoy, 404 como una persona inexistente |
| API-GRF-06 | `PUT /advisees/{adviseeId}/chart-set-choices` | Elegir o cambiar el enfoque de la persona (`PERSON`) o de un plan propio (`TRAINING_PLAN` o `NUTRITION_PLAN`, con el alcance de esa área) | 201 al crear (`expectedVersion: null`), 200 al cambiar; 409 si otra pestaña eligió antes; la persona, el plan o el enfoque ajenos o inexistentes, 404 |
| API-GRF-07 | `DELETE /advisees/{adviseeId}/chart-set-choices/{choiceId}` | Volver a los sugeridos para tus áreas | 204; exige `Idempotency-Key` |

**Los contratos** (`packages/domain/src/contratos-enfoques.ts`), estrictos: un enfoque tiene `setId`, `name`, `content`
(`schemaVersion: 1` y de 1 a 6 `charts`), `choices`, `version` y los dos momentos. Cada gráfico es `SUGGESTED` (el ID de
un sugerido, con su ejercicio, `FIXED` o `MOST_RECORDED` del 1.º al 3.º, o su medida de Antropometría) o `CUSTOM` (un
título de hasta 60, de 1 a 3 referencias de métricas y el modo `PANELS` u `OVERLAY`). Una elección tiene `choiceId`,
`scope` (`PERSON`, `TRAINING_PLAN` o `NUTRITION_PLAN`), `planId`, el enfoque y su versión. `TOO_MANY_SETS` es un código
nuevo de `CodigoDeError`, que solo agrega (API-VAN responde su tope con `VALIDATION_FAILED` y no cambia).

**Los permisos:**
- **solo el dueño:** un profesional verificado y habilitado en algún alcance, con su segundo factor (`puedeOperarArea`,
  UF-11 de DL-169), como API-VAN. Un enfoque o una elección ajenos responden el mismo 404 que uno inexistente;
- **con la persona, el PDP de hoy:** API-GRF-05 a 07 deciden dentro de su transacción con
  `decidirAlgunAlcanceEnTransaccion` (como API-HBT-05 y API-RES). Sin un vínculo aceptado y vigente en algún alcance,
  404;
- **el plan, propio y de un área permitida:** un plan de Entrenamiento exige el alcance de Entrenamiento con la persona;
  uno de Nutrición, el de Nutrición; y el plan tiene que ser de este profesional y de esta persona. Si no, 404;
- **la auditoría,** en la misma transacción, con un ejecutor propio (`EjecutorDeGraficos`, como `EjecutorDeVistas`).

**Las tablas y la migración, que solo agrega** (`prisma/migrations/<fecha al integrar>_enfoques_de_graficos/`, generada
con `prisma migrate diff` y completada a mano, como la de DL-128):
- `conjunto_de_graficos`: el profesional, el nombre, el contenido (JSON), la versión, la procedencia y los dos momentos;
- `eleccion_de_conjunto_de_graficos`: el profesional, la persona (con el nombre de columna del resto del esquema), el
  ámbito (un enumerado nuevo: persona, plan de Entrenamiento o plan nutricional), el plan que corresponde, el enfoque
  (con borrado en cascada desde el enfoque), la versión, la procedencia y los dos momentos;
- `CHECK` del nombre (de 1 a 80, sin espacios en los bordes), de la versión (1 o más), de que el contenido sea un objeto
  y del ámbito (con la persona, los dos planes en `NULL`; con un plan, solo su columna);
- índices únicos parciales: uno por profesional y persona para la persona, uno por profesional y plan de
  Entrenamiento y uno por profesional y plan nutricional. El tope de 50 enfoques va en el servicio, como en API-VAN;
- no toca datos ni columnas existentes. La fecha del nombre se fija al integrar, después de las migraciones de la tanda
  B.

**Lo que hay que tocar para declararlas** (rama E): siete entradas en `packages/domain/src/openapi.ts`, con `fuente:
'pedido de Dirección del 2026-11-14 · ID propio de BE (familia GRF) · DEUDA_LEGAJO DL-174'`; API-GRF-05 en
`LECTURAS_PROTEGIDAS`; siete métodos en `cliente-http.ts` (`listarEnfoques`, `crearEnfoque`, `reemplazarEnfoque`,
`borrarEnfoque`, `leerEleccionesDeEnfoque`, `elegirEnfoque` y `quitarEleccionDeEnfoque`); `GRF: 'DL-174'` en
`FAMILIAS_DE_BE` de `scripts/trazabilidad-de-operaciones.test.cjs`; y `docs/api/openapi.json`, regenerado con
`npm run openapi`.

**Lecturas nuevas sin ID todavía** (§4.7): la de «las últimas N sesiones de un ejercicio» (GR-01 completa) y la de la
vista previa por lote (GR-04). Se declaran con su ID y su DL al programarse.

## 8. Riesgos

- **Que un cruce se lea como causa** («subió los carbohidratos y por eso subió la fuerza») y el profesional decida con
  eso. *Cómo se cuida:* la frase fija, una sola ventana fijada antes de mirar, lo que también cambió a la vista, la
  energía siempre al lado de los carbohidratos y «Dos etapas» con todas las observaciones en lugar de una regresión.
- **Que «Superpuestas», con dos escalas, se lea como causa o como cruce** (Few 2008), justo lo que la propuesta evitaba.
  *Cómo se cuida:* «Alineadas» por defecto, la escala de «Alineadas», sin sombrear entre líneas, dos unidades como
  máximo, la frase, «Cómo leerlo» y la tabla a un clic.
- **Que lo precargado del plan se dibuje como hecho por la persona.** *Cómo se cuida:* la procedencia en cada punto, la
  marca que sale del dominio (hueca y gris) y una prueba que falla si una serie de carga rápida se dibuja llena o si una
  serie PLAN entra en una estimación.
- **Que se cuele una palabra prohibida en un gráfico de dos áreas, o el signo de porcentaje con Nutrición.** *Cómo se
  cuida:* la guardia unida corre sobre todos los textos de cada rama, también los de «Cómo leerlo».
- **Que un cruce o una serie delate un área sin acceso.** *Cómo se cuida:* cada lectura pasa por el PDP y por el filtro
  de planes propios; `seriesOfrecidas` no ofrece lo que no corresponde; el estado sin acceso no dibuja nada; cada cruce
  tiene su prueba del caso negado (no se pide la lectura del área que falta).
- **Que «Patrones» sature la estación en 1280 y tape la planilla.** *Cómo se cuida:* plegada por defecto en 1280, hasta
  seis gráficos, un solo período y la medición en 1440, 1280 y 1024 antes de integrar.
- **Que el profesional nuevo vea los gráficos vacíos,** contra «cuanto más se usa, mejor». *Cómo se cuida:* el límite
  dicho en pantalla («La historia empieza el día que empezaste a acompañarla») y la exportación propia de la persona
  (GR-D6).
- **Que la velocidad meta algo que no está aprobado o que pide una DL.** *Cómo se cuida:* nada entra sin la revisión
  adversaria y la CI en verde (§3); lo que pide una DL la abre antes de programarse, y lo que no llegue a la defensa se
  dice como próximo paso en la guía de la demo, no a medio hacer.
- **Que las lecturas acotadas** (92 días en API-ANT-06, API-NUT-17 y API-TRN-21; 366 en API-PRJ-01) **hagan lentos los
  paneles largos o pasen el límite de 120 por minuto.** *Cómo se cuida:* tramos de 92 días dichos en pantalla, de a
  cuatro y sin pedir dos veces lo que está en vuelo, 12 semanas por defecto en la estación y grano semanal para más de
  un año; nunca caché de datos de salud en el navegador.
- **Que el ruido de la estimación se lea como un cambio de fuerza.** *Cómo se cuida:* la mediana del RIR y el rango de
  repeticiones de cada tramo, el cambio de lo indicado en la primera línea, el ruido propio en texto y nunca «primero →
  último» ni una flecha.
- **Que «rango» se confunda con los rangos de macros del profesional (TB-39)** y se lea como «se pasó de lo indicado».
  *Cómo se cuida:* lo de la persona se llama «lo de sus semanas anteriores»; «rango» queda para lo que fija el
  profesional.
- **Que las ramas se pisen.** *Cómo se cuida:* archivos propios, hojas de estilo propias, los registros vacíos que crea
  A, los archivos de prueba ya listados y los rangos de IDs por rama (§11). La rama A es un cuello de botella: publica
  primero los tipos y los registros vacíos, y deja la cinta y el ruido para un segundo commit.
- **Que el cuadro del ejercicio lo toquen la fase 1 (GR-01) y la rama B a la vez.** *Cómo se cuida:* B espera la
  integración de GR-01 y engancha sus pasos con una línea; el cambio de alcance de ED-75 se declara (DL-174).
- **Que los editores y la API los toquen la tanda B de WP-PULIDO-GRANDES (PG-15 y PG-16) y la rama E.** *Cómo se cuida:*
  E se integra después de la tanda B, con dos cambios chicos en los editores; la fecha de su migración se fija al
  integrar.
- **Que «Analizar» (1822 y 633 líneas, con pruebas de pantalla) se rompa con el segundo eje.** *Cómo se cuida:* solo D lo
  toca; cada línea, punto y área de referencia, atado a su eje; las tres capas de Nutrición y las vistas guardadas de
  antes se prueban sin cambios.
- **Que los g/kg y el RIR indicado, derivados en el cliente, cambien de regla sin aviso.** *Cómo se cuida:* la regla del
  peso (la última toma en ese día o antes) se declara con su versión, para que el profesional pueda firmarla, y una
  prueba fija que no se usa una toma posterior.

## 9. Oráculos a escribir

Al programar, en `WP-GRAFICOS-ORACULOS.md`, con los trece campos del 11A. Cada uno, con su mutación: se rompe la regla a
propósito, la prueba se pone en rojo y se vuelve atrás. En modo liviano, los oráculos quedan en las pruebas y la ficha
se escribe al cerrar cada rama.

| Oráculo | Qué fija | Mutación que lo pone en rojo | Parte |
|---|---|---|---|
| TEST-GR-001 | «La vez pasada»: solo lo registrado; lo precargado, distinto de lo escrito; lo cargado otro día, marcado; una vez hecha con otro ejercicio no cuenta como el mismo; una serie que falta, sin dato | Tomar una sustitución como el mismo ejercicio | GR-01 (y PG-11, con TEST-PG-010) |
| TEST-GR-004 | La marca «con historial», con las sesiones y la última fecha; sin sesiones, sin marca; sin primero ni último | Mostrar «0 sesiones» | GR-04 |
| TEST-GR-016 | La tabla, solo dentro del mismo grupo de comparabilidad, con la resta con su signo y la línea del error de medición | Comparar dos grupos distintos | GR-16 |
| TEST-GRF-001 a 019 | Cada serie del catálogo con su área, su eje X, una fuente que existe en `openapi.ts`, sus alcances y su método si es derivada; `seriesOfrecidas` no ofrece nada de un área sin acceso y los g/kg solo con las dos áreas; `composicionPermitida` con tres unidades, con semana y sesión y con cuatro series; la frase con dos áreas o dos ejes; la guardia unida; las marcas de lo indicado, la carga rápida y la observada; la línea cortada en un hueco y entre tramos; la tabla dice lo mismo que el dibujo; los tramos de 92 días sin días perdidos; la cinta sin eventos de un área denegada; el ruido con menos de cuatro sesiones es nulo | Una serie de Nutrición sin el alcance de Nutrición; los g/kg con una sola área; dejar tres unidades; sacar la frase; aplicar solo la lista de la primera área; la carga rápida llena; unir a través de un hueco; perder los subtotales en la tabla; tramos de 93 días; dejar los eventos denegados; el ruido con dos sesiones | La base y GR-23 (A) |
| TEST-GRF-020 a 039 | La mediana del RIR y el rango de repeticiones por versión; el cambio de lo indicado en la primera línea; ningún «primero → último», «±» ni porcentaje; el eje del 1RM con 10 kg como mínimo; el eje del RIR de 0 al máximo, con 5 como mínimo; un RIR sin escribir no es 0; «a igual carga» filtra la misma carga y unidad; el perfil solo con lo escrito por la persona y RIR de 0 a 2, con las curvas rotuladas «de la fórmula»; la tarjeta de fuerza sigue solo en la v1 | Asignar un punto a la versión de hoy y no a la de su día; dibujar un RIR vacío como 0; filtrar «a igual carga» sin la unidad; una serie PLAN en el perfil | GR-02, GR-03, GR-05 y GR-06 (B) |
| TEST-GRF-040 a 059 | Una proporción no se dibuja ni se convierte; COMPLETE llena, subtotal hueca, sin registro nada; «no se puede saber si faltan comidas» sin plan; la media semanal dice sus días; nunca «completo» para un día; los g/kg con el peso de la toma anterior y sin valor sin toma; la diferencia en gramos con su signo; sin indicado cuando el plan deja elegir; los pares por sitio solo dentro del mismo grupo; el eje común de las masas | Convertir la proporción a gramos; usar la última toma del período para un día anterior; un día sin registro como cero; un eje propio por método | GR-11 a GR-14, GR-18 y GR-20 (C) |
| TEST-GRF-060 a 079 | Dos etapas no se dibujan con menos de 5 por lado; SP-01 y SP-02 no se ofrecen sin las dos áreas con planes propios y no piden la lectura del área que falta (el caso negado); la energía va al lado de los carbohidratos; dos ejes rotulados con su unidad; tres unidades deshabilitan «Superpuestas» con su motivo; series con distinto eje X no se superponen; una vista guardada con `OVERLAY` de antes se ve igual | Ofrecer SP-01 con una sola área; pedir la lectura de comidas igual; dejar superponer semana con sesión; dibujar con 4 de un lado | GR-24, SP-01, SP-02 y GR-26 (D) |
| TEST-GRF-080 a 099 | Un enfoque ajeno responde el mismo 404 que uno inexistente; sin vínculo vigente, API-GRF-05 a 07 responden 404; el esquema rechaza un campo que no sea una referencia; los topes de 50 y 6; la idempotencia de crear, borrar y quitar; la versión esperada al cambiar; borrar un enfoque quita sus elecciones; un plan ajeno o de un área no permitida responde 404; la elección del plan gana a la de la persona; «Patrones» no lee ni muestra un área sin acceso | Dejar leer al otro profesional; aceptar un valor dentro del contenido; pedir la lectura de un área sin acceso igual | GR-27 y «Patrones» (E) |
| TEST-PRJ-009 y las listas de cada área | Ningún texto nuevo usa las palabras que prohíben; con Nutrición, sin el signo de porcentaje | Un texto de «Cómo leerlo» con una palabra prohibida | Todas |

## 10. Dependencias y coordinación

- **Entre las partes:**
  - todo depende de la rama A: el catálogo, las piezas comunes, la guardia, las marcas y los registros vacíos;
  - GR-02, GR-24 y SP-01 comparten el ruido de la estimación (A); GR-03 y GR-05, el RIR indicado del comparador (A deja
    el adaptador; B lo ofrece);
  - «Patrones» y los enfoques (E) muestran lo que registran B, C y D a medida que se integran, y usan el compositor de
    «Armá tu gráfico» (D);
  - la rama B engancha sus pasos en el cuadro del ejercicio después de que se integre GR-01 (fase 1); la rama C, las
    vistas «Por sitio» y «Por método» después de mirar GR-16.
- **Con otros paquetes:**
  - **WP-PULIDO-GRANDES (DL-173):** PG-11 y GR-01 son la misma pieza («La vez pasada»), con la misma función de
    comparabilidad (TEST-PG-010 y TEST-GR-001); PG-18 usa las marcas de este paquete; las notas de PG-15 y PG-16 entran
    en la cinta (GR-23), y esas dos partes tocan la API y los editores antes que la rama E; cualquier fecha que se elija
    en un gráfico del website del profesional usa `CampoDeFecha` (PG-14: TEST-PG-013 rechaza un campo de fecha nativo);
  - **WP-EDITORES-PROFESIONAL (DL-167 y DL-171):** el cuadro del ejercicio (ED-75), el buscador, con su revisión visual
    pendiente, y la estación con sus pestañas;
  - **WP-TABLERO-ALTA-GAMA (DL-163):** la matriz §3.1 (el caso 2), TB-16 (el período desde el vínculo), TB-25 (los
    indicadores por área), TB-29 (las otras áreas en la ficha), TB-50 (la evolución de las tomas) y lo que esperan las
    fases 3 a 5 (TB-31, TB-34, TB-35, TB-37, TB-38 y TB-39);
  - **WP-DASHBOARD-PROFESIONAL (DL-126 y DL-128):** «Analizar» y las vistas guardadas, que GR-26 amplía sin cambiar lo
    guardado;
  - **las APK instaladas (DL-152):** no leen nada de este paquete.

## 11. El reparto de la fase 2

### 11.1 Las reglas para no pisarse

- **La rama A sale primero** y publica en el día su primer commit: el catálogo, los tipos, las piezas mínimas, los
  registros vacíos de cada rama, las hojas de estilo y los archivos de prueba. B, C, D y E salen de ese commit. Lo que A
  sume después (la cinta y el ruido de la estimación) llega a las otras integrando la rama A, sin reescribir nada
  publicado.
- **Archivos propios:** cada rama crea los suyos dentro de `apps/web/src/app/pro/advisees/graficos/<su carpeta>/` y edita
  solo los archivos existentes que le tocan en §11.2. Si necesita otro, lo dice en su PR antes de tocarlo.
- **Estilos:** cada rama escribe solo en su hoja de `graficos/estilos/`, importada una sola vez en `app/layout.tsx`.
  Nadie toca `globals.css`.
- **Pruebas:** los cinco archivos `apps/web/test/graficos-*.test.mjs` ya están en la lista de `npm test` (los pone A).
  Cada rama escribe en el suyo, con su rango de IDs (GR-T19).
- **Con la fase 1 y con la tanda B de WP-PULIDO-GRANDES:** antes de tocar un archivo existente, se mira si lo tocan
  (`git diff --stat origin/main...origin/<rama>`). Si lo tocan, se espera su integración o la parte va en un archivo
  nuevo con una sola línea de enganche.

### 11.2 Las cinco ramas

| Rama | IDs | Qué | Archivos existentes que toca | Depende de | API |
|---|---|---|---|---|---|
| **A** · `wp-graficos-base` | GR-23 y la base (§4.2) | El catálogo de series, los IDs de los sugeridos, las piezas comunes en SVG, las marcas, la guardia de vocabulario, el ruido de la estimación, las lecturas, los adaptadores y la cinta del tiempo. Sin cambio visible | `packages/domain/src/index.ts`, `seguimiento/series.ts` (saca `leerDisponibles`), `app/layout.tsx` (las cinco hojas), `app/tokens.css` (`--grafico-indicado`, `--grafico-carga-rapida` y `--grafico-cursor`, en los dos temas y con 3:1) y `apps/web/package.json` (los cinco archivos de prueba) | Nada | No |
| **B** · `wp-graficos-entrenamiento` | GR-02, GR-03, GR-05 y GR-06 | El historial en el cuadro del ejercicio («Historial» y «Perfil»), el período, «Abrir en Analizar» y GR-02 en «Analizar» con el ruido | `fuerza/detalle-del-ejercicio.tsx` (después de GR-01), `fuerza/fuerza-en-analizar.tsx`, `fuerza/fuerza.ts`, `training/ejercicio-del-editor.tsx` (el cuadro para todos) y `series-disponibles-entrenamiento.ts` | A; la fase 1 (el cuadro del ejercicio) | No |
| **C** · `wp-graficos-nutricion-y-cuerpo` | GR-11, GR-12, GR-13, GR-14, GR-18 y GR-20 | Las temporadas, la energía por día, los macros en paneles y en g/kg, lo indicado y lo registrado por día, el perfil por sitio y la masa grasa por método | `nutrition/registros.tsx` («Día por día»), `anthropometry/evolucion.tsx` («Por sitio» y «Por método») y `series-disponibles-nutricion.ts` y `-antropometria.ts` | A; la fase 1 (para no pisar GR-16) | No |
| **D** · `wp-graficos-cruces-y-analizar` | GR-24, SP-01, SP-02 y GR-26 | Dos etapas, los dos cruces del caso 1 con su caso negado, «Alineadas» y «Superpuestas» en «Analizar» y el compositor de «Armá tu gráfico». Es la única rama que toca «Analizar» | `seguimiento/analizar.tsx`, `lienzo.tsx`, `selector.tsx`, `series.ts` (el despacho, sobre lo que dejó A) y `etapas.tsx` | A | No |
| **E** · `wp-graficos-patrones-y-enfoques` | GR-27 y «Patrones» | La API de los enfoques (§7), la vista «Patrones» de la ficha, la pestaña de la estación y los sugeridos para tus áreas. Es la única rama con API | `prisma/schema.prisma`, `apps/api/src/app.module.ts`, `packages/domain/src/index.ts`, `openapi.ts`, `cliente-http.ts`, `copy-pistas.ts`, `scripts/trazabilidad-de-operaciones.test.cjs`, `workspace.tsx`, `seguimiento/estado.ts`, `seguimiento/como-se-lee.tsx`, `training/editor.tsx` y `nutrition/editor.tsx` (la pestaña, después de la tanda B) | A y D; la tanda B integrada; B y C solo para mostrar lo suyo | **Sí** |

Las rutas de `fuerza/`, `training/`, `nutrition/`, `anthropometry/` y `seguimiento/` son de
`apps/web/src/app/pro/advisees/`.

### 11.3 El orden de integración

- **Sábado 14/11:** A publica su primer commit; B, C, D y E salen de él, y E empieza por la API.
- **Cada rama, apenas queda aprobada** (la revisión adversaria sin altas ni medias pendientes y la CI en verde), se
  integra: A primero; B, C y D después de A, en el orden en que queden aprobadas; E después de A y de D, porque guarda en
  los enfoques los gráficos armados con «Armá tu gráfico».
- **Las fases 3 y 4** se programan a continuación, con el diseño que se hace en paralelo desde el 14/11.

## 12. Los referentes

De la propuesta: lo que hace cada producto, lo que BE toma y cómo va más allá.

| Referente | Lo que BE toma | Cómo va más allá | Fuente |
|---|---|---|---|
| HubFit (Exercise History V2) | El historial del ejercicio dentro del armador de rutinas, con el enlace de cada punto a su sesión | Paneles alineados en lugar de métricas mezcladas; el método del 1RM declarado; lo indicado separado de lo registrado; el cruce con Nutrición y Antropometría | <https://hubfit.com/changelog/exercise-history-v2> |
| BridgeAthletic | Que el historial se abra desde el ejercicio, sin salir del editor | No compara personas: el historial es de una sola persona, con su RIR y su procedencia | <https://intercom.help/bridgeathletic/en/articles/6598240-how-to-view-athlete-history-while-building-a-program> |
| Trainerize | La prueba de que es una carencia conocida: 266 entrenadores pidieron ver el historial al armar el programa | En BE, el historial está en el editor desde la primera serie registrada | <https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/49673516-being-able-to-view-the-history-of-an-exercise-for> |
| TrueCoach y Everfit | «La vez pasada» al lado del ejercicio, y los comentarios de la persona junto a los números | Lo precargado siempre se distingue de lo escrito (ED-70), y la carga calculada la confirma el profesional (ED-76) | <https://help.truecoach.co/en/articles/2403762-client-exercise-history> · <https://blog.everfit.io/everfit-may-2026-new-features> |
| Hevy y Hevy Coach | El selector de rango y las series por zona y por semana como unidad de trabajo | Nunca mezcla medido y estimado, declara la fórmula y su rango válido y no compara con nadie | <https://www.hevyapp.com/features/exercise-performance/> |
| Strong | La relación entre carga y repeticiones como perfil, y el límite de repeticiones de la estimación | Todas las series con su RIR, no solo las mejores; núcleo y orientativa separados; sin la palabra récord | <https://help.strongapp.io/article/237-about-exercise-detail> |
| RP Hypertrophy y Juggernaut AI | Las señales que usan (RIR a igual carga, series por zona y por semana), a la vista del profesional | BE no ajusta a escondidas: muestra la información con su método y decide el profesional; no fija rangos por zona (D-14, D-15 y D-20) | <https://rpstrength.com/training-volume-landmarks-muscle-growth/> |
| TrainingPeaks | Lo planificado y lo registrado del mismo ejercicio en la misma pantalla, mientras se planifica | Sin colorear desvíos ni resumir en un porcentaje de lo hecho; marcas huecas y llenas; sin cocientes agudo:crónico (Impellizzeri 2020) | <https://www.trainingpeaks.com/blog/the-top-7-dashboard-charts-for-coaches/> |
| Fitbod | Nada: es el contraejemplo (la recuperación de cada músculo de 0 a 100 y la fuerza comparada con el usuario promedio, sin fórmulas publicadas) | Sin cifras opacas, sin mapas del cuerpo que se leen como estado y sin comparar con la población | <https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery> |
| MacroFactor | El objetivo dibujado en el tiempo con sus cambios, la neutralidad sin rojo y el dato crudo separado de su lectura | No pide estimar lo no registrado (un hueco es un hueco) y cruza comida y entrenamiento en un mismo eje, con la ventana y lo que también cambió | <https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/> |
| Cronometer Pro | El gráfico exportable y que cada promedio diga con qué días se hizo | Las palabras de lo que BE sabe en vez de «días completos», y paneles alineados en lugar de su doble eje, que sus usuarios encuentran confuso | <https://forums.cronometer.com/discussion/2171/chart-comparison-overlays> |
| Nutrium y Practice Better | De Practice Better, el hueco visible por defecto; de Nutrium, el detalle por comida de qué se cambió | La diferencia en gramos, sin verde, sin porcentaje y sin avisos de «comió de más» | <https://help.practicebetter.io/hc/en-us/articles/360048122572-Analyzing-Journal-Entries> |
| InBody, BodySpec e ISCD (Hind et al. 2018) | La base y la anterior, la historia corta y la larga, y que cada cambio vaya con el umbral que lo vuelve creíble | El error de medición del propio profesional, sin rangos poblacionales ni cifras resumen | <https://eprints.leedsbeckett.ac.uk/id/eprint/4641/1/InterpretationofDualEnergyAM_HIND.pdf> |
| Oura, Garmin y Apple Salud | Lo de sus semanas anteriores como banda de fondo, y lo reciente frente a la historia larga de la misma persona | Sin etiquetas de estado, sin flechas y sin «se salió», en las unidades de cada cosa y diciendo cuánta historia falta | <https://support.apple.com/en-lamr/guide/iphone/iph4c34a8a95/16.0/ios> |
| Bearable, Exist y WHOOP | Dos etapas con un mínimo de datos explícito por lado | Las etapas salen de las versiones congeladas del plan, con una ventana fijada antes y lo que también cambió, sin estrellas ni categorías | <https://bearable.app/support/howto/the-factor-effect-report/> |
| LifeLines (Plaisant y Shneiderman) y Epic Timeline | La cinta de eventos fija arriba de todos los gráficos, donde cada marca abre su origen | Los eventos de BE ya están versionados y fechados, y respetan el permiso del área que los originó | <https://www.cs.umd.edu/~ben/papers/Plaisant1996LifeLines.pdf> |
| Stripe ContextView, Notion y Linear Peek | El contexto al costado, sin sacar al usuario de lo que hace | Se abre con teclado, mouse y tacto, y respeta el ancho de 1280 (plegado por defecto) | <https://linear.app/docs/peek> |

## 13. Lo programado

Un apartado por rama. Cada rama escribe solo en el suyo, como §9 y §10 de WP-PULIDO-GRANDES: el estado (desde qué
`main`, el PR y si está integrado), una tabla con cada parte, lo que quedó, dónde y su oráculo; las mutaciones probadas;
sus decisiones a ratificar (§6.3); y lo que falta para cerrar.

### 13.1 Fase 1 · `wp-graficos-fase-1`

> Programada el 2026-11-14 desde `main` `1089fc24`, con `main` integrado hasta #275; PR #273, revisado con ojo adversario
> el mismo día. Sin integrar al escribir esto. Sin operaciones nuevas en la API, sin migraciones y sin dependencias
> nuevas; la APK no suma lecturas (lee «Tu historial», que ya está en lo que lee la 0.28).

| Parte | Lo que quedó | Dónde | Oráculo |
|---|---|---|---|
| GR-04 | «Con historial · 9 sesiones · la última el mar 3 nov» en cada resultado de «Agregar ejercicio» que la persona ya tiene en sus sesiones registradas, del índice de API-PRJ-01 del último año, leído al abrir el cajón. Arriba de los resultados, una vez, qué cuenta: también las sesiones registradas como no realizadas o hechas con otro ejercicio (GR-T73). Si la lectura falla, se dice y se reintenta. Sin flecha, sin color, sin primero y último | `training/agregar-ejercicio.tsx`, `packages/domain/src/historial-del-buscador.ts` | TEST-GR-004 |
| GR-01 (website) | «La vez pasada»: las últimas tres veces del ejercicio, serie por serie (carga × repeticiones · RIR; sin carga ni repeticiones, el tiempo), debajo de «Lo que indica el plan» y nunca mezclada. Lo escrito, en marca llena; la carga rápida, hueca y en gris, con su texto; «con la carga del plan» si solo una parte vino del plan; lo cargado otro día y lo corregido, con su etiqueta; una vez hecha con otro ejercicio lo dice y no es comparable. Lee API-TRN-21 de los últimos 91 días y dice desde cuándo | `training/la-vez-pasada.tsx`, `fuerza/detalle-del-ejercicio.tsx`, `training/ejercicio-del-editor.tsx`, `packages/domain/src/la-vez-pasada.ts` | TEST-GR-001 |
| GR-01 · PG-11 (APK, solo lectura) | Debajo del ejercicio, en la sesión en curso, una línea tenue: «La vez pasada, mar 10 nov: 22 kg × 8 · RIR 2, 20 kg × 10 · RIR 2 (como el plan)», la última vez del mismo ejercicio en los 90 días hasta la fecha de la sesión (PG-D6), con la misma función del dominio. TalkBack la lee con la fecha entera | `apps/mobile/src/la-vez-pasada-en-la-sesion.ts`, `pantallas/entrenamiento.tsx`, `pantallas/sesion-enfocada.tsx` | TEST-PG-010 |
| GR-16 | Al final de cada toma abierta de «Tomas», «Desde el inicio y desde la anterior»: cada medida con su valor, la resta con su signo contra la primera toma y contra la anterior del mismo protocolo, método y unidad, y los días de calendario. Los resultados calculados, aparte y con su método. Si hay más de una toma el mismo día, lo dice (GR-T79). Debajo, siempre, la línea del error de medición | `anthropometry/desde-el-inicio.tsx`, `anthropometry/evaluaciones.tsx`, `packages/domain/src/desde-el-inicio.ts` | TEST-GR-016 |

**Las pruebas:** `la-vez-pasada.test.ts`, `historial-del-buscador.test.ts` y `desde-el-inicio.test.ts` (el dominio),
`la-vez-pasada-en-la-sesion.test.ts` (la APK) y `apps/web/test/graficos-fase-1.test.mjs` (dónde va cada pieza en el
website). **Las mutaciones** están escritas en el encabezado de cada archivo y se revisaron leyendo el código, sin
correrlas (la PC no tiene memoria para las pruebas; la CI es el juez de que pasan). En la revisión, dos no ponían nada en
rojo y se arreglaron: «no saltear las no realizadas» (ahora la prueba usa una no realizada que trae el ejercicio
resumido) y «contar dos veces un punto repetido entre tramos» (no cambia ningún valor de la tabla: se reemplazó por
«comparar con una toma posterior a esta»).

**Decisiones del continuador al programar, a ratificar (§6.3):**
- **GR-T70 · El cuadro del ejercicio para todos (ED-75, ampliado por DL-174):** los ejercicios de la lista de la v1 (RM-16)
  ven «La vez pasada» dentro de «Detalle y fuerza estimada»; los demás, en un cuadro lateral propio («La vez pasada», en
  el ejercicio y en «Más») con «Lo que indica el plan» arriba y sin la fuerza estimada, que sigue solo en la v1.
  *Alternativa:* un solo cuadro con la tarjeta de fuerza escondida fuera de la v1, que espera a la rama B.
- **GR-T71 · La ventana del editor:** API-TRN-21 de los últimos 91 días (la API acepta 92 y su hoy puede ir un día
  adelante del navegador). Como API-TRN-21 trae solo las sesiones de los planes de quien mira, la tabla dice «en tus
  planes, … desde el …», y sin historial, «Sin sesiones registradas con este ejercicio en tus planes desde el …», no
  «desde el inicio del acompañamiento». *Alternativa:* la lectura nueva de GR-01 completa (§4.7).
- **GR-T72 · Lo que indicaba el plan en cada sesión pasada no se muestra:** arriba va lo indicado hoy; el comparador
  «Planificado y registrado» sigue en «Sesiones registradas». *Alternativa:* una fila por sesión con lo que indicaba, que
  pide leer los objetivos por serie de cada versión (API-SER-01).
- **GR-T73 · Qué cuenta la marca del buscador:** las sesiones registradas de los planes de quien mira en las que aparece
  el ejercicio, en el último año, que es lo que da el índice de API-PRJ-01: también las registradas como no realizadas,
  las que no lo incluyeron y las hechas con otro ejercicio en su lugar. El índice no las separa, así que la línea de
  arriba de los resultados lo dice entero, para que «la última el 3 nov» no se lea como «lo hizo el 3 nov».
  *Alternativa:* contar solo las hechas con el mismo ejercicio, que pide la lectura por lote de §4.7.
- **GR-T74 · Dónde va GR-16 y cuánto lee:** al final de cada toma abierta en «Tomas»; «Patrones» es de la fase 2. Se leen
  como mucho 8 tramos de 92 días (dos años de tomas seguidas); si hay más, «Desde el inicio» dice desde cuándo leyó. La
  primera toma no lee nada y dice que todavía no hay con qué compararla.
- **GR-T75 · La APK sin «cargada otro día»** (la persona sabe cuándo la cargó) **y sin la línea si sustituyó el ejercicio
  en esta sesión** (sería de otro ejercicio). Si la lectura falla o no hay red, la línea no se dibuja y la sesión sigue
  igual.
- **GR-T76 · El RIR en la línea de la APK** («20 kg × 8 · RIR 2»), con el formato de GR-01, aunque el ejemplo de PG-11 no
  lo traía. *Alternativa:* sin RIR, más corta.
- **GR-T77 · La línea de la APK va debajo del ejercicio,** como describe PG-11, y no como una columna más de la tabla de
  series: con Serie, carga, Rep., RIR, Tiempo y la casilla, no entra en 360 dp.
- **GR-T78 · Las fechas en pocas palabras,** como el campo de fecha del website (PG-14): «mar 3 nov», con el año si no es
  el de hoy, y «hoy»; el lector oye «martes 3 de noviembre».
- **GR-T79 · Dos tomas el mismo día en GR-16 se dicen, no se corrigen:** API-ANT-06 trae un punto por día y por medida
  (el de su checkpoint), así que de dos tomas del mismo día la tabla puede no ver las dos: puede faltar una medida de la
  toma abierta, o la anterior puede no ser la última de ese día. La sección nombra esos días. *Alternativa:* leer con
  `ANTHROPOMETRY_LONGITUDINAL` de API-PRJ-01, que trae todas las tomas (hasta tres medidas por pedido), en la fase 2.

**Lo que falta para cerrar:**
1. **PG-11, el resto (tanda B de WP-PULIDO-GRANDES):** tocar la línea para copiar los números en los campos vacíos de la
   fila que sigue, con «Deshacer». `comparable` y `esDelMismoEjercicio` ya dicen qué se puede copiar.
2. **GR-01 completa y la vista previa de GR-04:** las lecturas nuevas de §4.7, declaradas ante Dirección.
3. **GR-16 en «Patrones»** (fase 2) y la columna del error de medición cuando exista (GR-17, GR-D4).
4. **La evidencia en pantalla:** Azul noche y Claro; 1440, 1280 y 1024; el lector de pantalla en las tablas; en el
   teléfono, la línea con la letra ×1,3 y TalkBack.
5. **Correr las mutaciones** de cada prueba (descritas en cada archivo).

### 13.2 Rama A · `wp-graficos-base`

> **Estado:** programada el 2026-11-14 en `wp-graficos-base` (#276), desde `main` `7cb79d3a`, con `main` `33320669`
> traído. Sin integrar. Sin API y sin cambio visible: las piezas las montan las ramas B a E. El primer commit
> (`257912a6`) fijó el contrato del que salieron las otras ramas; los siguientes solo agregan. Las decisiones GR-T20 a
> GR-T29 están **a ratificar**; mientras tanto, rigen.

| Parte | Qué quedó | Dónde | Oráculo |
|---|---|---|---|
| El catálogo de series | Envuelve el diccionario de DL-126 sin cambiarlo (`BE-SERIES-2026-11-v1`): cada serie con su eje X, su fuente, sus alcances, su método, su marca y su estado. Se ofrecen las del diccionario y el 1RM estimado (Epley v1); el RIR indicado y los g/kg quedan EN_PREPARACION; el descanso, las calorías previstas, el perímetro corregido y la entrada de carga × repeticiones, PIDE_DL. `composicionPermitida` y `fraseDeLaCoincidencia` para «Armá tu gráfico» | `packages/domain/src/series-disponibles*.ts` | TEST-GRF-001, 002, 003 y 009 |
| Los IDs de los sugeridos | Los 14 IDs estables, validados con una expresión (GR-T17) | `graficos-sugeridos.ts` | TEST-GRF-007 |
| La guardia unida y la frase | La unión de las listas de las áreas del gráfico, cada una con su regla, más lo que no va en ningún lado; «Coinciden en el tiempo; esto no prueba que una cosa cause la otra.» | `vocabulario-de-los-graficos.ts` | TEST-GRF-004, 005 y 018 |
| Las marcas por su sentido | Lleno lo registrado; hueco lo indicado y el subtotal; hueco y gris la carga rápida; rombo lo observado; contorno cortado lo reportado; punto adentro lo calculado | `marcas-de-los-graficos.ts`, `graficos/marcas.tsx` | TEST-GRF-006 |
| El ruido de la estimación | Por versión: sesiones, mediana del RIR, rango de repeticiones y la mayor diferencia entre estimaciones seguidas del núcleo desde cuatro sesiones; el cambio de lo indicado en palabras | `lectura-de-la-estimacion.ts` | TEST-GRF-008 |
| El eje de fechas y los paneles alineados | Un solo eje, las marcas sin pisarse, los carriles con su escala, las bandas de las versiones con su etiqueta, la tira de cobertura (el estado del día por la altura, con una muesca en lo cargado después), la cuenta de lo que no entra en la escala y la cinta como carril | `eje-de-fechas.ts`, `carriles.ts`, `paneles-alineados.tsx`, `medidas-del-grafico.ts` | TEST-GRF-010 y 011 |
| El cursor, la lectura y la tabla | El cursor compartido con teclado (flechas, Inicio, Fin, Mayúscula y Escape), la lectura viva y la tabla con los tramos sin registros en texto | `cursor-de-fechas.tsx`, `lectura-en-la-fecha.tsx`, `tabla-equivalente*.ts(x)` | TEST-GRF-012, 014 y 015 |
| Los estados | Cargando con alto fijo, sin datos, falta historia, falla con «Reintentar» y sin acceso, que no dibuja nada | `estado-del-grafico.tsx` | TEST-GRF-015 |
| Las lecturas | Todo a la API, sin caché de datos de salud: en tramos de 92 días, compartidas solo mientras están en vuelo, de a cuatro. Lo indicado del entrenamiento: API-TRN-21 en tramos y API-SER-01 por versión, con el comparador del dominio (GR-T14 y GR-T27) | `lecturas.ts`, `adaptadores.ts` | TEST-GRF-011, 013 y 015 |
| **GR-23** · la cinta del tiempo | Las versiones como barras, las tomas, las revisiones, las sesiones con cambios, las sustituciones y las notas de coordinación como íconos, una fila por área; lo que cae junto, agrupado; elegir una barra o un grupo elige su tramo en todos los gráficos; la lista en palabras, la leyenda y la lectura viva. `CintaDelTiempoLeida` lee API-DSH-04 | `cinta-del-tiempo.ts`, `cinta-del-tiempo-en-pantalla.tsx`, `dibujo-de-la-cinta.tsx` | TEST-GRF-019 |
| Los registros, las hojas y los tokens | Un registro por rama, una hoja por rama importada una vez y `--grafico-indicado`, `--grafico-carga-rapida` y `--grafico-cursor` con 3:1 en los dos temas | `registro-de-graficos.ts`, `registros.ts`, `estilos/`, `tokens.css` | TEST-GRF-016 y 017 |

**Los oráculos y sus mutaciones** (en `packages/domain/src/series-disponibles.test.ts` y
`apps/web/test/graficos-base.test.mjs`). Cada prueba fija exactamente la propiedad que su mutación rompe; en esta máquina
no se corre nada pesado, así que ponerlas en rojo una por una queda para la revisión:

| Oráculo | Mutación que lo pone en rojo |
|---|---|
| TEST-GRF-001 | Una serie de Nutrición sin el alcance NUTRICION |
| TEST-GRF-002 | Ofrecer los g/kg con una sola área o sin lo propio en las dos (ahora con la función real y un catálogo de prueba) |
| TEST-GRF-003 | Dejar tres unidades en «Superpuestas» |
| TEST-GRF-004 | Sacar la frase con dos áreas o con dos ejes |
| TEST-GRF-005 | Aplicar solo la lista de la primera área |
| TEST-GRF-006 | La carga rápida, llena |
| TEST-GRF-008 | Decir el ruido con dos sesiones |
| TEST-GRF-011 | Unir a través de un hueco; unir lo indicado de dos versiones |
| TEST-GRF-012 | Perder los subtotales en la tabla |
| TEST-GRF-013 | Tramos de 93 días; leer API-TRN-21 sin tramos |
| TEST-GRF-019 | Dejar los eventos de un área denegada; dibujar un hábito o lo anulado |

#### Decisiones del continuador al programar (a ratificar)

- **GR-T20 · El tipo de la fuente se llama `FuenteDeLaSerieDisponible`:** `FuenteDeLaSerie` ya lo exporta la estimación
  de fuerza con otro sentido. Por lo mismo, la constructora de Antropometría es `serieDisponibleAntropometrica`.
- **GR-T21 · Una serie de dos áreas (los g/kg) se ofrece solo con los dos alcances y con planes o tomas propios en las
  dos** (caso 1). Una de un área pide solo su alcance.
- **GR-T22 · `FALTA_HISTORIA` lleva `hay` como lista** (un número por lado, o uno solo), para decir «hay 3 y 7».
- **GR-T23 · Un archivo puro y su pantalla no comparten nombre** (`tabla-equivalente.ts` y
  `tabla-equivalente-en-pantalla.tsx`; `cinta-del-tiempo.ts` y `cinta-del-tiempo-en-pantalla.tsx`): con `.ts` y `.tsx`
  del mismo nombre, TypeScript y el empaquetador resuelven archivos distintos.
- **GR-T24 · `leerDisponibles` devuelve lo leído y las áreas que respondieron «sin acceso»,** o `null` si la sesión se
  perdió; `leerEnTramos` devuelve también la primera falla.
- **GR-T25 · El 1RM estimado tiene su propia familia** (`estimacion-de-fuerza`): nunca comparte un eje con la carga
  registrada.
- **GR-T26 · La guardia prohíbe en todo gráfico, también en negación,** los términos de B05 y TEST-PRJ-009.
- **GR-T27 · Lo indicado del entrenamiento sale del comparador del dominio** (`observacionesDelEjercicio` y `evolucion`)
  con los objetivos por serie de API-SER-01. Si una versión no se puede leer, es una falla con «Reintentar» y no se cae
  a lo de la prescripción, que puede no ser el de esa serie (DL-122). Un rango es un segmento hueco sin valor del medio;
  un % RM y otra unidad no se dibujan, y la línea de lo indicado se corta al cambiar de versión o de prescripción.
  *Alternativa:* dibujar lo de la prescripción con una nota cuando falta una versión.
- **GR-T28 · Qué entra en la cinta:** las versiones (de las vigencias, no de las activaciones, para no repetirlas), las
  tomas, las revisiones, las notas de coordinación, las sesiones registradas con cambios y las sustituciones de otro
  ejercicio. Las notas de coordinación no se filtran por área: no son datos de un área sino una comunicación dirigida a
  quien la lee, y la API decide quién la ve (DL-140). Las sustituciones salen del registro de cada sesión (API-TRN-21)
  cuando quien usa la cinta ya leyó esas sesiones: API-DSH-04 no las marca y la cinta no suma lecturas por ellas.
  Quedan fuera los objetivos, los seguimientos abiertos o cerrados, los formularios y lo anulado. *Alternativa:* sumar
  los objetivos como hitos de la cinta.
- **GR-T29 · Cómo se ve la cinta:** una fila por área, con su ícono, y una para las notas; la barra de una versión va
  del día que empezó a regir al anterior al corte; lo que cae a menos de 18 px se agrupa en un círculo con la cantidad
  («2 hitos», o «3 hechos» si hay una sesión o una sustitución); se leen hasta cuatro páginas de 50 por pedido y, si
  hay más, la cinta dice que faltan los más antiguos. *Alternativa:* una sola fila con todos los hechos.

#### Lo que falta para cerrar

- La revisión adversaria, con cada mutación en rojo.
- Las capturas y la evidencia: la rama no cambia nada visible. Van con la primera rama que monte las piezas.
- `WP-GRAFICOS-ORACULOS.md` con los trece campos: en modo liviano, los oráculos quedaron en las pruebas.
- **Para B:** el adaptador de lo indicado ya está (`puntosDeLoIndicado`, `serieDeLoIndicado` y
  `leerSerieDelCatalogo` para `entrenamiento.rir-indicado`); B lo ofrece al usarlo, cambiando su estado a OFRECIDA.
- **Para C:** los g/kg (fuente DERIVADA) siguen respondiendo «sin especificación» en `leerSerieDelCatalogo` hasta que C
  programe la regla y su lectura; si la engancha ahí, lo dice en su PR antes de tocar `lecturas.ts`.
- **Para D y E:** `CintaDelTiempoLeida` va arriba de «Analizar» (D) y fija arriba de «Patrones» (E), con los alcances y
  las vigencias de `leerDisponibles`; en el cuadro del ejercicio (B), con `exerciseKey` y las sesiones ya leídas, que
  suman las sustituciones. Las notas de la tanda B (PG-15 y PG-16) entran por `otras` cuando se integre.
- **Hallazgo fuera del paquete (severidad baja), para D:** tres textos de límites del diccionario de DL-126 que muestra
  «Analizar» tienen un término prohibido en negación (`nutricion.registros`, `entrenamiento.carga` y
  `entrenamiento.series-registradas`); la guardia unida no los admite. Se ajustan al pasar «Analizar» al catálogo.

### 13.3 Rama B · `wp-graficos-entrenamiento`

> Sin programar al declarar este paquete.

### 13.4 Rama C · `wp-graficos-nutricion-y-cuerpo`

> Sin programar al declarar este paquete.

### 13.5 Rama D · `wp-graficos-cruces-y-analizar`

> Sin programar al declarar este paquete.

### 13.6 Rama E · `wp-graficos-patrones-y-enfoques`

> Sin programar al declarar este paquete.
