# WP-APP-VUELTA-DE-ROSCA — la APK de la persona, más simple: acciones claras primero

> **Estado:** DECLARADO el 2026-11-07, con las decisiones PV-1 a PV-12 ratificadas por Dirección ese mismo día
> (DEUDA_LEGAJO DL-166). El 2026-11-07 Dirección autorizó programar primero lo que es solo de app («Sí, primero lo que es
> solo app»): **las etapas 1 y 2 (AV-01 a AV-14, AV-17 y AV-18) están programadas** e integradas en `main` el 2026-11-07
> (#247, `64508a8`), y publicadas en la APK 0.23.0-candidata.1 el 2026-11-08, con su cierre (AV-16) en #249: las
> lecturas congeladas, los oráculos TEST-AVR-034 a 036 y la guía de la prueba en el teléfono. La .1 se cerraba al empezar
> un entrenamiento; con ese arreglo, solo de la app (#250), la 0.23.0-candidata.2 se publicó el 2026-11-11 y es la
> «latest» que ofrece el website: lee lo mismo que la .1, y la prueba en el teléfono se hace con ella. Van
> con sus oráculos (`WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`) y las decisiones técnicas AVT-01 a AVT-16 (§6.1), a ratificar.
> Faltan la etapa 3, con servidor (AV-15 y AV-19), y, del cierre (AV-16), la prueba en el teléfono y las capturas.
> **PV-13** (la sesión con letra grande) no la decidió Dirección: la eligió el continuador porque es reversible, y está **a ratificar**
> (§3.1). De las decisiones de la implementación (§6), Dirección ratificó el 2026-11-07 AVD-1 y AVD-3 (con la
> alternativa) y AVD-5 y AVD-8 (como se recomendaba). AVD-2, AVD-4, AVD-6 y AVD-7 siguen **a ratificar**, y también
> AVD-9, que es nueva y sale de AVD-1.
>
> **Encargo** (Dirección, 2026-11-07): «Las pantallas deben llevar a acciones claras, y recién en esas acciones el
> desarrollo o más texto (…) bien segmentado, con información clara, y si es necesario más información, un
> desplegable». Para el engranaje del descanso: «las configuraciones así tienen que ser contextuales».
>
> **Fuente:** la página de maquetas «App más simple», versión 3, del 2026-11-07, que no está en el repo. Tiene nueve
> maquetas en Claro y Azul noche, a 360 dp, con datos de la cohorte sintética: siete con letra ×1, una con letra ×1,3 y
> una con los estados vacíos de una cuenta nueva. Se nombran por su archivo (§1.1) y se describen con palabras, como en
> WP-TABLERO-ALTA-GAMA, para que este paquete sea autocontenido. Cuando Dirección valide una versión final, las imágenes
> pueden ir a `EVIDENCIA/APP-VUELTA-DE-ROSCA/diseno/maquetas/`, como las de WP-ESCRITORIO-AMABLE (AV-16).
>
> **Datos:** solo sintéticos, en local y en `test`. **Esta declaración:** rama `wp-app-vuelta-de-rosca`, desde `main`
> 6c3c8fc. Es solo documentación: no tiene código ni migraciones.

## 0. Legajo y decisiones que cita

- **El legajo:**
  - TEST-PRJ-009: no calificar;
  - RNF-ACC-001 y B10-10: accesibilidad; B10-10 §9: volver sin depender del sistema;
  - 08 §33: el ambiente, siempre a la vista; 08, minimización: la APK pide solo los permisos que usa;
  - REG-06-130 y 131: el registro y la condición de la sesión;
  - B10-06 §57: el temporizador no es requisito P0;
  - 10-B04: los textos de acceso y de consentimiento, que prohíben, entre otros, «puede ver todos tus datos».
- **Las DL:**
  - DL-117: la barra de cinco destinos y la cabecera única. Esta vuelta cambia el quinto destino y la cabecera;
  - DL-124: los tiempos como eventos (familia API-TIE), «nunca se cierra nada a la hora de reabrir»;
  - DL-122: las capacidades que declara el cliente (`X-BE-Capabilities`);
  - DL-152: lo que leen las APK instaladas no cambia de forma;
  - DL-137 D-7: lo nuevo va en operaciones nuevas;
  - DL-160: los cronómetros son una ayuda opcional, y «Ya la hice» vale también el mismo día;
  - DL-009 y DL-040: el nombre visible; DL-140: las notas entre profesionales;
  - DL-143: el aviso cuando un profesional todavía no puede ver los datos;
  - DL-165 D-2: las ayudas plegadas; DL-165 D-9 y D-17: los hábitos compartidos y el pedido de acceso;
  - DL-096: «Tu historial»; DL-049 y DL-077: BE no elige ni el día tipo ni la sesión.
- **Los paquetes:**
  - `WP-ENTRENAMIENTO-SERIES.md` §7.3 y §7.4: el descanso manual. Lo modifican PV-7, PV-8 y PV-12;
  - PA-01 y PA-02 (Dirección, 2026-11-02): la sesión guiada, la casilla de cada fila y la barra visible en la sesión;
  - `docs/ux/INICIO-Y-NAVEGACION.md`, la matriz de Inicio.
- **La guía:** `docs/ux/GUIA-UX-UI.md`, Parte III. Desde esta declaración suma III.7, la regla de los desplegables
  (PV-4).

## 1. Objetivo

Que cada pantalla de la APK lleve a una acción clara, y que el detalle esté en la acción o en un desplegable, sin
esconder lo que hace falta para decidir. Que lo de la persona esté en un solo lugar, Perfil, y que la sesión en curso
se maneje con el pulgar: el descanso arranca solo, la barra muestra cuánto falta para el recomendado y las acciones
quedan fijas abajo.

**Cómo se mide**, en el render y después en el teléfono, con la misma persona sintética y el mismo día:

| Vista | Hoy (contado sobre `main`) | Al cerrar el paquete |
|---|---|---|
| Inicio, al abrir (360 dp, letra ×1) | 185 palabras y 14 botones y enlaces en 7 tarjetas; arriba se ve solo la tarjeta de entrenamiento | Unas 77 palabras. Al abrir se ven la sesión, las comidas y el primer pedido para responder. No hay «Ir a…» repetidos |
| «Información» y Cuenta | Unas 160 palabras con 5 formularios; Vínculos aparece en 3 lugares | Perfil: un lugar para lo de la persona, y cada cosa en uno solo |
| Sesión en curso, en el descanso | «Iniciar descanso» a mano; para empezar la serie siguiente son dos toques («Finalizar descanso» y el reloj de la fila) | El descanso arranca al tildar la serie; «Empezar serie N» lo termina y arranca la serie en un toque |

### 1.1 Las maquetas, en palabras

- **`01-inicio.png` · Inicio.** La cabecera tiene la marca y Novedades. Debajo van tres bloques con un verbo cada uno:
  - la sesión de hoy, con «Empezar» y «Ya la hice» lado a lado, y en un desplegable el bloque, la semana y los ejercicios;
  - las comidas del día como fichas: la registrada con su marca y su hora, y la que sigue con borde y «Registrar»;
  - «Para responder», con la cuenta y una fila por pedido (formularios y pedidos de hábitos juntos).

  Al bajar está «Para mirar»: el último peso con su cambio y la actividad de 30 días. La flecha va en el color del
  texto, ni verde ni rojo.
- **`02-perfil.png` · Perfil, en lugar de «Información».** De arriba abajo:
  - quién sos: el nombre visible y el identificador BE, con «Compartir»;
  - cuatro baldosas: Mis datos, Mis hábitos, Quién ve qué y Notas entre tus profesionales;
  - tus profesionales con su área, y «Tengo un código» al pie;
  - «Formularios y pedidos», con «Para responder» y «Respondidos»;
  - los ajustes: Apariencia, que se cambia ahí mismo; Avisos; Privacidad y consentimientos; Sesión y este teléfono; y
    Cerrar mi cuenta, al final.
- **`03-registrar-comida.png` · Registrar el almuerzo.** La foto, el nombre y las cuatro cifras, y «Comí esta opción» de un
  toque. Ingredientes, preparación y «Comí otra cantidad» van plegados. «Lo vacío no se cuenta como cero» aparece recién
  adentro.
- **`04-responder-formulario.png` · Responder un formulario.** Una parte por pantalla (DL-165 D-1). «Para qué lo pide» va
  plegado, con el para qué, «Podés no responder» y «queda como declarado por vos». Cada pregunta va en su tarjeta, y
  Anterior y Siguiente quedan fijos sobre la barra.
- **`05-barra.png` · La barra y la cabecera.** Perfil es el quinto destino, con el ícono de persona. El avatar y el menú
  se van de la cabecera. Con letra ×1,3, la barra pasa a dos filas, como hoy. El punto de pendientes va en Perfil, y una
  tira muestra la barra sin nada pendiente, sin el punto, con lo que dice TalkBack en cada caso.
- **`06-quien-ve-que.png` · Quién ve qué.** Arriba, el tratamiento de tus datos de salud. Después, una tarjeta por
  profesional: lo que autorizaste y desde cuándo, y si ve tus hábitos. Dice «Lo ve» o «No lo ve», con su ícono y sin
  colores. «Qué incluye» va plegado. Para cambiar algo, lleva a la pantalla de siempre.
- **`07-sesion-en-curso.png` · Sesión en curso.** El orden es el ejercicio, su descanso y sus series. El bloque del
  descanso dice «Descanso · tras la serie 2» y «01:12 de 1:30 recomendado». Tiene una barra del 0 al recomendado y
  «Al terminar, seguís con la serie 3». Al lado del bloque está el engranaje: abre una hoja con «Cómo funciona el
  descanso» y tres ajustes, con los valores de fábrica y «También con el teléfono bloqueado». Abajo, una fila fija con
  Pausar, «Empezar serie 3» y Siguiente ejercicio, apoyada sobre la navegación, también fija, opaca y con el punto de
  Perfil. Muestra tres estados: el descanso corriendo, la hoja abierta y el permiso de avisos, que se pide en contexto
  al encender «Vibrar».
- **`08-letra-grande.png` · Con letra grande (×1,3).** Inicio y la sesión con la letra del sistema en ×1,3, con lo que
  se ve al abrir. Cambia la composición y no se achica la letra: «Empezar» y «Ya la hice» se apilan enteros, y la barra
  pasa a dos filas con el punto en su lugar. En la sesión, la fila de acciones sigue en una fila y la navegación va en
  dos filas debajo. Las dos barras ocupan cerca de un cuarto de la pantalla, y se siguen viendo el ejercicio y el
  descanso entero (PV-13).
- **`09-estados-vacios.png` · Una cuenta nueva.** Es una persona que recién aceptó a su nutricionista. En Inicio va
  primero el paso que falta para el acceso, con el texto de hoy y «Completar», y después una línea por cada área sin
  plan. «Para responder» no se dibuja y Perfil va sin punto. En Perfil dice «Agregá tu nombre» en el lugar del nombre, y
  cada baldosa dice su estado en palabras. Cada vacío es una línea con un texto que la app ya usa, y lo que no tiene
  nada no se dibuja.

## 2. Alcance y lo que queda fuera

**Entra:** la cabecera y la barra; Perfil, que reemplaza a «Información» y absorbe Cuenta y el menú; Inicio; «Quién ve
qué»; la regla de los desplegables en las pantallas que toca el paquete; las dos acciones abiertas de las maquetas 03 y
04; la sesión en curso (el descanso, el engranaje, la fila fija y «Empezar serie N»); los íconos nuevos; los estados
vacíos de una cuenta nueva (maqueta 09); y la letra grande en Inicio y en la sesión (maqueta 08).

**Queda fuera:**
- **iPhone.** Va después de esta vuelta, en su propio paquete. Nada de acá se prueba en iOS.
- **El rediseño de otras pestañas.** Nutrición, Entrenamiento (salvo la sesión en curso) y Evolución quedan como están.
  Solo reciben lo que se muda («Tu historial» y los registros nutricionales) y la regla de los desplegables donde el
  paquete las toque.
- **El website** (del profesional y de la persona), con dos excepciones. Por AV-15, si la web del profesional muestra
  los tiempos de una sesión, dice cuándo una serie arrancó sola. Por AV-19, sus solicitudes muestran «Eligió no
  responder».
- **Escrituras nuevas, salvo PV-8 y AVD-1** (AV-15 y AV-19). «Quién ve qué» solo lee, y para cambiar algo lleva a la
  pantalla de siempre.
- **Los ajustes del descanso en la cuenta.** Quedan en el teléfono (PV-10).
- **Lo que no cambia:** los textos legales y su versión; una parte por pantalla en los formularios; ninguna barra de
  completitud; «Nueva versión» y no «Editar»; ningún número califica.

## 3. Las decisiones de Dirección (ratificadas el 2026-11-07)

1. **PV-1 · Perfil reemplaza a «Información»** y absorbe Cuenta (hoy detrás del avatar) y el menú de la cabecera.
   - Vínculos pasa a Perfil, «Tu historial» a Entrenamiento y los registros nutricionales a Nutrición.
   - La cabecera queda con la marca y Novedades. La franja del ambiente de prueba sigue (08 §33).
2. **PV-2 · Las comidas del día van como fichas en Inicio.** «La que sigue» es la primera sin registrar en el orden del
   plan, nunca por la hora.
3. **PV-3 · «Quién ve qué» entra en esta vuelta.** Es solo de lectura, usa operaciones que ya existen y sus textos se
   revisan contra 10-B04.
4. **PV-4 · Una regla fija para los desplegables.** Se pliega lo que explica y nunca lo que hace falta para decidir:
   estado, fecha, quién y si se puede responder. Va a la GUIA-UX-UI, Parte III (III.7, desde esta declaración).
5. **PV-5 · «Tu actividad» en Inicio es un solo número**, las sesiones registradas en 30 días. El desglose va en «Tu
   historial».
6. **PV-6 · La pestaña Perfil lleva una marca de pendientes** (Dirección eligió distinto de la recomendación, que era
   sin marca). Es un punto sin número, mientras haya algo para responder, y desaparece cuando la persona responde o dice
   que no: negarse vale igual. TalkBack lo dice en palabras: «hay algo para responder».
7. **El ícono de «Mis hábitos»:** un reloj envuelto por una flecha circular, como lo dibuja la versión 3 de las
   maquetas, con las reglas de la familia (trazo de 1,75 y nada que califique).
8. **PV-7 · El descanso arranca solo al guardar la serie**, con una barra cuyo 100 % es el descanso recomendado por el
   entrenador. El bloque va debajo del ejercicio y arriba de las series.
9. **El engranaje es contextual** y va junto al bloque del descanso («las configuraciones así tienen que ser
   contextuales»). Tiene tres ajustes:
   - el descanso, automático o manual;
   - al 100 %, la serie siguiente: «La inicio yo», que viene de fábrica (**PV-8**), o «Arranca sola», que queda guardada
     como automática y pide un campo nuevo en los eventos de tiempo, en el servidor y en la base;
   - vibrar al 100 %, también con el teléfono bloqueado, con un aviso programado que pide su permiso (**PV-9**;
     Dirección eligió distinto de la recomendación, que era solo con la app abierta). Al encender «Vibrar» sin el
     permiso, BE explica para qué lo necesita y ofrece «Permitir avisos», y recién ahí aparece el diálogo de Android. Si
     la persona dice que no, vibra solo con la app abierta y se le avisa en una línea. El aviso con el teléfono bloqueado
     no nombra el ejercicio ni muestra datos.

   **Los valores de fábrica:** el descanso, automático; la serie siguiente, «La inicio yo»; vibrar, encendido y también
   con el teléfono bloqueado.
10. **PV-10 · Los ajustes del descanso se guardan en el teléfono**, como la apariencia.
11. **PV-11 · Durante la sesión, la fila fija de acciones va apilada sobre la navegación, también fija.** La fila tiene
    Pausar o Reanudar, la acción del momento y Siguiente ejercicio. Nada flota.
12. **PV-12 · «Empezar serie N», con un descanso corriendo, termina el descanso y arranca la serie en un toque.** Los dos
    tiempos se guardan en el mismo instante.

### 3.1 PV-13 · la sesión con letra grande (a ratificar)

No es una decisión de Dirección: salió de la pasada con letra grande de la versión 3 y la eligió el continuador, porque
se puede revertir sin tocar datos. Se le muestra a Dirección con la maqueta 08 antes de cerrar el paquete.
- **Elegida:** con letra ×1,3 o más, en la sesión, la navegación pasa a dos filas debajo de la fila de acciones. Las dos
  quedan fijas y no hay excepción a PV-11. Al abrir siguen a la vista el ejercicio y el descanso entero.
- **Alternativa:** con letra ×1,3 o más, esconder la navegación durante la sesión y salir con «Atrás». Gana unos 120 dp,
  pero es una excepción a PV-11.

**Qué cambia de lo vigente** (lo registra DL-166):
- `WP-ENTRENAMIENTO-SERIES.md` §7.3 y §7.4 decían que guardar una serie no inicia un descanso, que el aro no lo termina y
  que no hay cierre automático. Con PV-7, guardar la serie inicia el descanso, solo entre series del mismo ejercicio
  (AVD-3). Con PV-8, si la persona lo elige, el descanso se cierra solo al 100 % y arranca la serie siguiente. PV-12 no cambia una regla: la acción compuesta ya
  existía («Finalizar descanso e iniciar la serie N»), y lo que cambia es dónde está y cómo se llama.
- La barra visual del 100 % reemplaza al aro. Llegar al 100 % no termina nada si la persona eligió «La inicio yo».
- DL-117 y PA-02 cambian en el quinto destino («Información» pasa a ser Perfil), en la cabecera (sin menú ni avatar) y,
  durante la sesión, en la forma de la barra: fija y no flotante (PV-11). Las cinco raíces, su orden y las reglas de
  Atrás quedan como están.
- Una solicitud de formulario tenía dos estados, sin responder y respondida. Con AVD-1 suma un tercero, «Eligió no
  responder», que el profesional ve (AV-19). «No responder es una opción» deja de ser solo un texto: pasa a ser un acto
  de la persona, que queda registrado.

## 4. Las partes

Cada parte dice si toca el servidor. «No» quiere decir que usa solo operaciones y lecturas que ya existen, con el mismo
permiso que en su módulo. Si al programar una parte resulta que una lectura no trae lo que hace falta, la parte se
detiene y se declara: no se inventa el dato ni se abre una operación sin decisión.

### 4.0 Lo que dice TalkBack (criterio de las partes)

Es la tabla de la versión 3 de las maquetas. Cada parte que dibuja una de estas piezas se acepta cuando el lector dice
esto, en el árbol de accesibilidad y después en el teléfono. Cada ícono va con su texto, y el lector no recorre el dibujo.

| Pieza | Parte | Lo que dice |
|---|---|---|
| Ficha de comida | AV-06 | «Desayuno, registrado a las 8:40, botón» · «Almuerzo, registrar, botón» |
| Desplegable | AV-01 | «6 ejercicios, 18 series, contraído, botón»; al tocarlo, «expandido» |
| Punto de Perfil | AV-04 | «Perfil, pestaña, 5 de 5, hay algo para responder». Sin pendientes, no dice nada de más |
| Descanso | AV-10 | Al empezar: «Descanso iniciado, recomendado 1 minuto 30». Al 100 %: «Llegaste a 1 minuto 30». Nada en el medio. La barra dice «72 segundos de 90» solo si la persona la recorre |
| Engranaje | AV-11 | «Ajustes del descanso, botón». Cada ajuste se lee como grupo de opciones, con la elegida marcada |
| Quién ve qué | AV-05 | «Tus hábitos: no los ve». El ícono del ojo no se lee |
| Barra | AV-02 | «Perfil, pestaña, 5 de 5, seleccionada» |
| Cabecera | AV-02 | «Novedades, 2 sin leer, botón». La esfera es decorativa y «BE» se lee una vez |

### 4.1 Etapa 1 · solo app: navegación, Perfil, Inicio y lectura

| ID | Qué | Toca el servidor | Decisión | Se acepta cuando | Pruebas y oráculos |
|---|---|---|---|---|---|
| AV-01 | La regla de los desplegables, con una pieza común | No | PV-4 | Un solo componente de desplegable en la APK, con rol de botón y estado expandido o plegado para TalkBack. Abrirlo no escribe nada ni cambia la altura de lo de arriba. En cada pantalla del paquete, el estado, la fecha, quién y si se puede responder quedan fuera de todo desplegable. La lista de control de la guía (IV.1) lo pide | Prueba de la APK del componente (rol, estado y que no escribe). La tabla «qué se pliega» de cada pantalla, en la evidencia. TEST-AVR-001 |
| AV-02 | La barra y la cabecera | No | PV-1 | Perfil es el quinto destino, con el ícono de persona. La cabecera tiene la marca y Novedades, sin avatar ni menú, y conserva la franja del ambiente de prueba. Lo que se muda tiene un lugar: Vínculos en Perfil, «Tu historial» en Entrenamiento y los registros nutricionales en Nutrición. Ninguna entrada del menú ni de Cuenta queda sin lugar, y cada una está en uno solo. Atrás vuelve como hoy (B10-10 §9). Con letra ×1,3 la barra pasa a dos filas sin cortar texto. TalkBack dice «Perfil, pestaña, 5 de 5, seleccionada» | Pruebas de `navegacion.ts` y de la disposición de la barra, actualizadas. Una tabla «dónde quedó cada cosa» con cero pérdidas, en la evidencia. TEST-AVR-002 y 003 |
| AV-03 | Perfil | No | PV-1, PV-4 | Están quién sos (nombre visible, o «Agregá tu nombre», e identificador BE con «Compartir»); las cuatro baldosas; tus profesionales con su área y «Tengo un código»; «Formularios y pedidos», con «Para responder» (formularios y pedidos de hábitos) y «Respondidos»; y los ajustes, con Cerrar mi cuenta al final. «Podés no responder» se dice una vez, adentro. Todo lo que hoy está en «Información» y en Cuenta sigue alcanzable. La vuelta después de reautenticarse, que hoy va a Cuenta, va al ajuste que se estaba usando | Pruebas de la lógica de la pantalla (qué bloques aparecen y con qué cuenta). Que nada se perdió: la misma tabla de AV-02. TEST-AVR-004 |
| AV-04 | La marca de pendientes en Perfil | No (decir que no a un formulario llega con AV-19) | PV-6, AVD-1 | Es un punto sin número en Perfil, mientras haya algo en «Para responder». «Para responder» cuenta lo mismo en Inicio y en Perfil: los formularios y los pedidos de hábitos (en la versión 2 de las maquetas, Perfil no contaba el pedido de hábitos). El punto se va cuando la persona responde o dice que no, y no por abrir Perfil. Decir que no a un pedido de hábitos ya existe (el «No» de API-HBT). Decir que no a un formulario llega con AV-19 (AVD-1): hasta entonces, un formulario saca la marca solo al responderse, y la evidencia lo dice. El punto es el mismo en todas las pantallas, también en la sesión. TalkBack dice lo de §4.0, así que el punto no es la única señal | Prueba pura de la cuenta (responder, negarse y abrir sin responder). TEST-AVR-005 y 006 |
| AV-05 | «Quién ve qué» | No | PV-3, PV-4 | Es una vista nueva dentro de Perfil y solo lee lo que ya existe: vínculos, consentimientos y A3, y hábitos compartidos. Arriba va el tratamiento de los datos de salud, y sin él dice que ninguno ve nada. Hay una tarjeta por profesional: área, lo que autorizaste y desde cuándo, y si ve tus hábitos («Los ve», «Te pidió verlos · No los ve» o «No los ve»), con ícono y sin colores. Un vínculo en pausa o terminado dice que no ve, y por qué. «Qué incluye» va plegado y sale de cada Alcance, no de un texto escrito a mano. «Cambiar» lleva al vínculo, al consentimiento o a Mis hábitos. No suma ninguna escritura. Antes de mostrar, se verifica, como en toda zona (III.1). Los textos se revisan contra 10-B04 | Prueba pura del armado (con A3 y sin A3, en pausa, terminado, hábitos compartidos, retirados y pedidos). Revisión de los textos contra 10-B04, anotada en la evidencia. TEST-AVR-007 a 009 |
| AV-06 | Inicio | No | PV-2, PV-4, PV-5 | Tiene tres bloques de acción: la sesión, con «Empezar» y «Ya la hice» y su detalle plegado; las comidas como fichas; y «Para responder». Debajo va «Para mirar». «La que sigue» es la primera comida sin registrar en el orden del plan, nunca por la hora. Si el día tipo no está elegido, Inicio lo pide y BE no elige (DL-049). Con varias sesiones posibles, BE tampoco elige (DL-077). «Tu actividad» es un número: sesiones registradas, últimos 30 días, sin porcentaje ni calificación. El aviso de DL-143 va arriba de todo, como hoy. No hay «Ir a…» repetidos. Inicio no escribe nada. Con letra ×1,3 (maqueta 08), «Empezar» y «Ya la hice» se apilan enteros: cambia la composición y la letra no se achica | Pruebas puras de «la que sigue» (orden del plan, con registros fuera de orden y comidas fuera del plan) y de la cuenta de 30 días. El conteo de palabras y botones antes y después, en la evidencia. TEST-AVR-010 a 012 |
| AV-07 | El desglose de la actividad en «Tu historial» | No | PV-5 | «Tu historial», ya dentro de Entrenamiento, dice de los mismos 30 días cuántas sesiones fueron realizadas, con desvío y no realizadas, y su total coincide con el número de Inicio (AVD-2). La ausencia no es «no realizada» (DL-106) | Prueba de que el número de Inicio y el total del desglose salen de la misma función. TEST-AVR-013 |
| AV-08 | Las dos acciones abiertas: registrar una comida y responder un formulario | No | PV-4 | En el registro de una comida, «Comí esta opción» registra de un toque, como hoy. Ingredientes, preparación y «Comí otra cantidad» van plegados, y la aclaración del vacío aparece adentro. En un formulario, «Para qué lo pide» va plegado. «Queda como declarado por vos» se sigue diciendo una vez, al empezar (DL-165 D-2), y TalkBack lo lee todo. Anterior y Siguiente quedan fijos. No cambia ninguna regla del registro ni del formulario | Las pruebas de `opcion-de-comida` y de las partes del formulario siguen en verde sin cambiar lo que esperan. TEST-AVR-014 |
| AV-09 | Los íconos nuevos | No | Ícono de «Mis hábitos», engranaje | Hay tres: el de «Mis hábitos», un reloj envuelto por una flecha circular, que se usa en Inicio, en Perfil y en los estados vacíos; el engranaje de los ajustes del descanso; y la persona de Perfil, que pasa del avatar a la barra. **Antes de usarlos**, el de hábitos y el engranaje se revisan a 18, 20 y 24 px, en los dos temas, y la revisión queda en la evidencia. Son de la familia (GUIA I.8): misma grilla y trazo de 1,75, sin color propio, siempre con su palabra o su nombre, y TalkBack no recorre el dibujo | La prueba de los íconos de la familia. La lámina a 18, 20 y 24 px en los dos temas. TEST-AVR-015 |
| AV-17 | Los estados vacíos de una cuenta nueva | No | PV-4, maqueta 09 | Con una cuenta que recién aceptó a su primer profesional, Inicio pone primero el paso que falta para el acceso (DL-143), con el texto de hoy y «Completar». Después va una línea por cada área sin plan, con un texto que la app ya usa. «Para responder» no se dibuja y Perfil va sin punto. En Perfil, «Agregá tu nombre» va en el lugar del nombre, y cada baldosa dice su estado en palabras. Lo que no tiene nada no se dibuja: no hay tarjetas vacías ni ceros | Prueba pura de qué bloques aparecen sin plan, sin pedidos y sin nombre. La captura de la cuenta nueva sintética, en la evidencia. TEST-AVR-029 |

### 4.2 Etapa 2 · solo app: la sesión en curso

| ID | Qué | Toca el servidor | Decisión | Se acepta cuando | Pruebas y oráculos |
|---|---|---|---|---|---|
| AV-10 | El descanso arranca solo al tildar la serie, con su barra | No | PV-7, AVD-3 | Con el ajuste automático, tildar la serie la registra y manda `REST_STARTED`, ligado a esa serie, en la misma acción. Es un acto de la persona, así que no hace falta ningún dato nuevo. **Solo entre series del mismo ejercicio** (AVD-3): tras la última serie de un ejercicio, y tras la última de la sesión, no arranca. Destildar una serie con su descanso corriendo lo termina (`REST_FINISHED`). El bloque va debajo del ejercicio y arriba de las series. Dice «Descanso · tras la serie N», el conteo, «de M recomendado» y «Al terminar, seguís con…». La barra va de 0 al recomendado de esa serie, que es el que fija la prescripción por serie (DL-122). Pasado el 100 %, queda llena y el conteo sigue, sin cambiar de color y sin cortar nada. Sin descanso recomendado, hay conteo sin barra y no vibra. En pausa, tildar registra la serie y no arranca ningún descanso (nada se mide en pausa, DL-124). Con una serie cronometrada abierta, la cierra primero, en la misma acción. Con el ajuste manual, se ve «Iniciar descanso», como hoy. TalkBack anuncia solo el inicio y el 100 %, como en §4.0. Con movimiento reducido, la barra queda quieta y el número sigue | Pruebas puras de las acciones de la corrida (`corrida-de-entrenamiento.ts`): tildar con el ajuste automático y manual, en pausa, con una medición abierta, sin recomendado, la última serie de un ejercicio y de la sesión, y destildar con el descanso corriendo. `aplicarEventos` acepta cada secuencia. TEST-AVR-016 a 019 |
| AV-11 | El engranaje y sus ajustes, guardados en el teléfono | No | PV-10, el engranaje, los valores de fábrica | El engranaje va al lado del bloque del descanso y no en Perfil. TalkBack lo lee como en §4.0, y cada ajuste, como un grupo de opciones con la elegida marcada. La hoja explica cómo funciona en dos frases y trae los ajustes: «Empezar el descanso» (al guardar la serie, o «Lo inicio yo») y «Vibrar al llegar al 100 %», con «También con el teléfono bloqueado». El ajuste de la serie siguiente aparece recién con AV-15: hasta entonces no se ofrece una opción que todavía no funciona. De fábrica: descanso automático, vibrar encendido y también con el teléfono bloqueado; con AV-15, «La inicio yo». Los ajustes quedan en el teléfono, como la apariencia, y la hoja lo dice. Si el teléfono no deja leer o guardar, se usan los de fábrica y nada se rompe | Prueba del almacén de ajustes (de fábrica, cambio y falla de lectura). TEST-AVR-020 |
| AV-12 | Vibrar al 100 %, también con el teléfono bloqueado | No | PV-9, AVD-5, AVD-8 | Con la app abierta, vibra al llegar al recomendado. Con el teléfono bloqueado, vibra un aviso local común, programado para ese instante y sin la alarma exacta (AVD-5); su demora se mide en el teléfono de Dirección. El aviso no nombra el ejercicio ni muestra ningún dato. **El permiso se pide en contexto:** al encender «Vibrar» sin el permiso (o, como viene encendido de fábrica, al empezar el primer descanso: AVD-8), BE explica en una frase para qué lo necesita y ofrece «Permitir avisos», y recién entonces aparece el diálogo de Android. Nunca se pide al abrir la app. Si la persona dice que no, vibra solo con la app abierta y una línea en la hoja y en el bloque lo dice. El aviso programado se cancela cuando el descanso termina antes, al pausar, al destildar la serie, al finalizar y al cerrar la sesión. La lista de permisos que fija `scripts/avisos-del-telefono.test.mjs` cambia solo en lo que esto use, y el comentario «BE no programa avisos locales» de `app.config.ts` se corrige (AVD-5) | Prueba pura de cuándo se programa y cuándo se cancela, y de los tres casos del permiso (dado, sin pedir y negado). Prueba de que el texto del aviso no lleva el nombre del ejercicio. Prueba de la lista de permisos actualizada. En el teléfono: bloqueado, en reposo y con la app en segundo plano. TEST-AVR-021 y 022 |
| AV-13 | La fila fija de acciones, apilada sobre la navegación fija | No | PV-11 | Durante la sesión, la fila (Pausar o Reanudar, la acción del momento y Siguiente ejercicio) y la navegación van fijas y apiladas, sin la cápsula flotante. La navegación es opaca: nada se ve a través de ella, y lleva el punto de Perfil como en las demás pantallas. Nada tapa el contenido: el final de la pantalla deja el alto de las dos. «Finalizar entrenamiento» queda al final de la pantalla y en «Ver rutina», como hoy. La acción del medio cambia con el estado (AVD-4). Con el teclado abierto, las dos se ocultan, como la barra hoy. Con letra ×1,3 y ×2 no se corta ningún texto | Prueba pura de la acción del momento en cada estado. La medición del alto que queda para el contenido a 360 dp con letra ×1, ×1,3 y ×2, en la evidencia. TEST-AVR-023 |
| AV-14 | «Empezar serie N» termina el descanso y arranca la serie | No | PV-12 | Con un descanso corriendo, un toque manda `REST_FINISHED` y `SET_TIMING_STARTED` con el mismo instante y el mismo `compoundActionId`. Es la acción compuesta que ya existe, auditada (§7.4), en su lugar nuevo. Sin descanso, «Empezar serie N» arranca la medición de la serie. Un doble toque es una sola acción | Prueba pura: un toque da dos eventos con el mismo instante y la misma acción compuesta; el doble toque no duplica. `calcularTiempos` da descanso y serie medidos sin hueco. TEST-AVR-024 |
| AV-18 | La sesión con letra grande | No | PV-13 (a ratificar), maqueta 08 | Con letra ×1,3 o más, la fila de acciones sigue en una fila y la navegación pasa a dos filas debajo, las dos fijas: no hay excepción a PV-11. Ningún texto se corta ni se achica. Al abrir se ven el ejercicio y el bloque del descanso entero. Si Dirección elige la alternativa de PV-13, la navegación se esconde durante la sesión con letra ×1,3 o más, y se sale con «Atrás» | La medición de AV-13 con ×1,3 y ×2: el alto de las dos barras y si el ejercicio y el descanso entran al abrir. TEST-AVR-030 |

### 4.3 Etapa 3 · con servidor: la serie siguiente arranca sola y «Eligió no responder»

| ID | Qué | Toca el servidor | Decisión | Se acepta cuando | Pruebas y oráculos |
|---|---|---|---|---|---|
| AV-15 | «Arranca sola», guardada como automática | **Sí: dominio, API y base** | PV-8 | El tercer ajuste del engranaje: «La inicio yo» viene de fábrica y «Arranca sola» se elige. Con «Arranca sola», al 100 % se mandan el fin del descanso y el inicio de la serie siguiente, en el instante del recomendado y marcados como automáticos: el campo nuevo de AVD-6. La hoja dice en una línea que queda guardada como automática. La base suma el campo con una migración que solo agrega. La API lo acepta solo de un cliente que declara la capacidad nueva (DL-122) y lo devuelve solo a quien la declara. Las APK instaladas (0.20, 0.21 y 0.22) leen API-TIE-01 a 03 con esquemas estrictos, así que a ellas no les llega el campo (DL-152). `calcularTiempos` distingue un fin automático del de la persona, y el tiempo se informa sin juzgarlo. Si la app no está viva al 100 %, no se cierra nada a la hora de reabrir (DL-124): vale la pregunta de las mediciones abiertas (AVD-7). Si la web del profesional muestra los tiempos, dice «arrancó sola» | Dominio: el contrato con el campo y sin él, y `calcularTiempos` con un fin automático. Integración con PostgreSQL: el campo se guarda y se devuelve con la capacidad, y sin la capacidad se rechaza al escribir y no aparece al leer. `lecturas-de-las-apk.int-spec.ts`: las lecturas congeladas de 0.20, 0.21 y 0.22 siguen pasando. La migración, probada en una base local. TEST-AVR-025 a 028 |
| AV-19 | «Eligió no responder»: decir que no a un formulario | **Sí: dominio, API, base y website** | AVD-1, PV-6 | La persona puede decir que no a una solicitud de formulario pendiente, desde la solicitud, con una confirmación. Es una operación nueva (DL-137 D-7) y un estado nuevo de la solicitud, «Eligió no responder», que la base suma con una migración que solo agrega. En la APK, la solicitud sale de «Para responder» y de Inicio, pasa a su grupo en Perfil y saca la marca. El profesional la ve con ese texto, como un hecho y no como una falta: sin color de alerta y sin ninguna palabra que la califique. Si su lista de pendientes o la Línea de tiempo (DL-165 D-8) muestran las solicitudes, la tratan igual. **Las APK instaladas no ven el estado nuevo:** las 0.20, 0.21 y 0.22 leen el estado de una solicitud con un esquema estricto (`PENDING` o `RESPONDED`), así que el estado viaja solo para el cliente que declara la capacidad nueva (DL-122). Para los demás, la solicitud sigue como pendiente (DL-152). Qué pasa si la persona después quiere responder lo decide AVD-9 | Dominio: el estado y la transición, desde pendiente y desde ningún otro estado. Integración con PostgreSQL: solo la persona titular puede decir que no; el profesional lo ve con la capacidad y sin ella, y una APK sin la capacidad recibe la solicitud como pendiente. `lecturas-de-las-apk.int-spec.ts`: las lecturas congeladas de 0.20, 0.21 y 0.22 siguen pasando. Website: la solicitud con «Eligió no responder». `copy-pantallas.test.cjs`, sin palabras prohibidas. TEST-AVR-031 a 033 |

### 4.4 Cierre

| ID | Qué | Toca el servidor | Se acepta cuando |
|---|---|---|---|
| AV-16 | La candidata, sus lecturas congeladas, la evidencia y TalkBack | No | La construye y la publica Dirección. Se congelan las lecturas de la candidata nueva (DL-152). La evidencia en `EVIDENCIA/APP-VUELTA-DE-ROSCA/LEEME.md` tiene las capturas de cada pantalla en los dos temas, el antes y el después de §1, la tabla «dónde quedó cada cosa» y la medición de AV-13. Las maquetas validadas, si Dirección las da por finales, van en `diseno/maquetas/`. La prueba en el teléfono (con letra al máximo, TalkBack y la pantalla bloqueada durante un descanso) queda escrita como hecha o como pendiente, sin darla por aprobada |

## 5. El orden de las etapas

1. **Etapa 0 (esta declaración).** Están el paquete, DL-166, la regla III.7 de la guía y las notas en §7.4 y en DL-117.
2. **Etapa 1 · solo app (AV-01 a AV-09).** Primero AV-01, porque las demás pantallas usan su pieza. Después AV-09 (los
   íconos) y AV-02 y AV-03 juntos, porque la barra y Perfil se cambian a la vez: una barra con Perfil y sin Perfil no
   puede convivir. Después AV-04, AV-05, AV-06, AV-17, AV-07 y AV-08. Antes de AV-09 se revisan los dos íconos nuevos a
   18, 20 y 24 px. Esta etapa no cambia nada de lo que leen las APK instaladas.
3. **Etapa 2 · solo app, la sesión (AV-10 a AV-14 y AV-18).** Primero AV-13 (la fila fija) y AV-18 (la letra grande),
   que dan el lugar de «Empezar serie N» (AV-14). Después AV-10, AV-11 y AV-12. Puede ir en una candidata propia, si
   Dirección prefiere probar la sesión aparte.
4. **Etapa 3 · con servidor (AV-15 y AV-19), al final.** Cada parte va con su capacidad, su migración y la prueba de
   las lecturas congeladas. Pueden ir en una sola capacidad o en dos: se decide al programar, con la prueba de
   compatibilidad. Si la etapa 3 se demora, la APK de las etapas 1 y 2 sale igual: sin AV-15, la hoja tiene dos
   ajustes, y sin AV-19 un formulario saca la marca solo al responderse.
5. **Cierre (AV-16).**

## 6. Lo que se decide al programar

Son propuestas de quien programa. Dirección respondió el 2026-11-07: ratificó AVD-1, AVD-3, AVD-5 y AVD-8. AVD-2, AVD-4,
AVD-6 y AVD-7 quedan con la recomendación, **a ratificar**. AVD-9 es nueva, sale de AVD-1 y también está **a
ratificar**. Ninguna se programa sin el sí de Dirección a su parte.

- **AVD-1 · Decir que no a un formulario** (PV-6) · **RATIFICADA por Dirección el 2026-11-07, con la alternativa.** Un
  pedido de hábitos ya tiene su «No», pero una solicitud de formulario solo puede estar sin responder o respondida.
  - *Decidido:* un estado nuevo de la solicitud, «Eligió no responder», que el profesional ve. Son una operación y un
    estado nuevos, con servidor y base. Van en la etapa del servidor, junto a AV-15, como AV-19. Respetan las lecturas
    congeladas y la capacidad de cliente. Para el profesional se dice sin juicio: es un hecho, no una falta.
  - *Descartado:* guardar «No voy a responder» solo en el teléfono, sin que el profesional lo sepa.
- **AVD-2 · Los 30 días en «Tu historial»** (PV-5) · **a ratificar.** «Tu historial» muestra 90 días (DL-096).
  - *Recomiendo:* una línea arriba con el desglose de los últimos 30 días, para que el número de Inicio se encuentre
    igual.
  - *Alternativa:* el desglose de los 90 días, aunque no coincida con el número de Inicio.
- **AVD-3 · El descanso tras la última serie** · **RATIFICADA por Dirección el 2026-11-07, con la alternativa.**
  - *Decidido:* el descanso automático arranca solo entre series del mismo ejercicio. Tras la última serie de un
    ejercicio, no arranca, y tampoco tras la última de la sesión. Destildar una serie con su descanso corriendo termina
    ese descanso (`REST_FINISHED`), como se recomendaba: un evento no se borra.
  - *Descartado:* que arranque también tras la última serie de cada ejercicio, con «Al terminar, seguís con <siguiente
    ejercicio>».
- **AVD-4 · La acción del medio de la fila fija** · **a ratificar.** Según el estado:
  - con un descanso corriendo: «Empezar serie N»;
  - con una serie cronometrada abierta: «Terminar serie N»;
  - sin nada abierto: «Empezar serie N», que mide la serie;
  - en pausa: Reanudar va a la izquierda y la del medio queda deshabilitada, con su motivo.
- **AVD-5 · La vibración con el teléfono bloqueado** · **RATIFICADA por Dirección el 2026-11-07, como se recomendaba.**
  - *Decidido:* un aviso local común, programado con `expo-notifications` (ya está en la APK), sin la alarma exacta.
    Android puede demorarlo en reposo profundo: se mide en el teléfono de Dirección y, si pasa, la hoja lo dice.
  - *Descartado:* pedir la alarma exacta, que es un permiso más y que Google Play limita a las apps de alarma y
    calendario.
  - Reiniciar el teléfono durante un descanso pierde la vibración: BE sigue sin `RECEIVE_BOOT_COMPLETED`.
- **AVD-6 · El campo nuevo** (PV-8) · **a ratificar.**
  - *Recomiendo:* un campo opcional, por ejemplo `trigger: 'AUTOMATIC'`, en `REST_FINISHED` y `SET_TIMING_STARTED`.
    Su ausencia quiere decir «lo marcó la persona».
  - *Alternativa:* un tipo de evento nuevo. Se descarta porque una APK instalada no podría leer la sesión entera (la
    unión de tipos es estricta).
- **AVD-7 · «Arranca sola» con la app cerrada** · **a ratificar.**
  - *Recomiendo:* solo arranca si la app está viva al 100 %, adelante o en segundo plano. Si Android la cerró, al
    volver no se cierra nada a la hora de reabrir: vale la pregunta de las mediciones abiertas (§7.5 de
    WP-ENTRENAMIENTO-SERIES).
- **AVD-8 · Cuándo se pide el permiso, si «Vibrar» viene encendido de fábrica** · **RATIFICADA por Dirección el
  2026-11-07, como se recomendaba.**
  - *Decidido:* se pide al empezar el primer descanso, en el bloque del descanso, con la frase de para qué y «Permitir
    avisos». Si la persona lo cierra sin elegir, no se vuelve a preguntar en esa sesión.
  - *Descartado:* no pedirlo hasta que la persona abra el engranaje.
- **AVD-9 · Responder después de haber dicho que no** (AV-19) · **a ratificar.** Sale de AVD-1.
  - *Recomiendo:* la persona puede cambiar de idea mientras la solicitud siga abierta. Desde «Eligió no responder» se
    puede responder, y la respuesta deja la solicitud respondida. Decir que no queda como hecho en la historia de la
    solicitud y no se borra.
  - *Alternativa:* decir que no es definitivo, y para responder hace falta que el profesional pida de nuevo.

### 6.1 Las decisiones técnicas de la implementación (AVT, a ratificar)

Las tomó quien programó las etapas 1 y 2 el 2026-11-07. Ninguna cambia una decisión de Dirección: completan lo que el
paquete no fijaba. Todas están **a ratificar**.

- **AVT-01 · En una fila, la barra no achica la letra.** La tolerancia de una fila pasó de 0,9 a 1
  (`disposicion-de-la-barra.ts`). Con «Perfil», más corta que «Información», las cinco etiquetas entraban con letra ×1,3
  en 360 dp achicándose al 97 %. La maqueta 08 pide dos filas («cambia la composición, no se achica la letra»), y así
  queda. Con ×1 sigue en una fila.
- **AVT-02 · Sin porcentajes en pantalla.** La guardia de textos de Entrenamiento (T13) toma cualquier «%» que no sea
  «% RM» como cumplimiento. Por eso dice «Vibrar al llegar al recomendado» y «llegar al recomendado no corta nada», en
  lugar del «100 %» de las maquetas. La barra sigue llegando al recomendado.
- **AVT-03 · Perfil muestra el ícono de persona, no las iniciales.** La maqueta 02 dibuja «DS»; se mantiene D-2 de
  DL-117: no se deriva una imagen del nombre. El nombre visible va al lado.
- **AVT-04 · Cuenta, por partes, con una sola ruta.** `cuenta` suma `seccion` (Mis datos, Avisos, Sesión y este
  teléfono, Cerrar mi cuenta). Mis datos reúne el estado de la cuenta, el nombre y el identificador. Cada parte es su
  pantalla y vuelve a Perfil.
- **AVT-05 · «Para responder» y «Respondidos» abren la misma bandeja,** «Formularios y pedidos» (la de «Información»),
  que ya agrupa por lo que falta hacer. La bandeja ya no repite la tarjeta de «Mis hábitos»: está en Perfil.
- **AVT-06 · La pregunta por un profesional nuevo cuenta en «Para responder»,** solo si no hay pedidos de hábitos, como
  la tarjeta de Inicio de DL-165 D-17. Es algo para responder, y responderla (sí o no) saca la marca.
- **AVT-07 · Una acción de tiempo nueva, `descanso-al-tildar`.** Cierra lo que se estuviera midiendo (la serie
  cronometrada que se tilda, o el descanso de la serie anterior) y empieza el descanso, en el mismo instante y con una
  acción compuesta. «Iniciar descanso», a mano, sigue como era (con algo abierto, se rechaza): lo nuevo va en una
  operación nueva (DL-137 D-7) y la prueba vieja de la corrida no cambia.
- **AVT-08 · El aviso del descanso no se cancela al salir de la pantalla de la sesión.** Se cancela cuando el descanso
  deja de correr (terminó antes, se pausó, se destildó, se finalizó) y al cerrar la sesión de la app. Así vibra aunque la
  persona esté mirando otra pantalla.
- **AVT-09 · Vínculos queda al pie de «Tus profesionales»,** como «Vínculos y solicitudes», junto a «Tengo un código».
  Perfil lista los vínculos sin terminar; las solicitudes, los pausados y los terminados siguen en Vínculos.
- **AVT-10 · «Qué incluye» sale del Alcance:** la finalidad (`ETIQUETA_DE_FINALIDAD`), el área y una aclaración
  («Solo lo de esa área, mientras el vínculo esté vigente y tu autorización siga activa»). Las categorías pertinentes no
  vienen en la lista de vínculos, y pedirlas para cada vínculo sumaría una lectura por profesional.
- **AVT-11 · La marca de Perfil se recalcula** al entrar, al volver del segundo plano y al salir de una solicitud o de
  «Mis hábitos», con tres lecturas livianas (la bandeja pendiente con `limit` 1, los hábitos y los pedidos). Inicio y
  Perfil también la fijan con sus lecturas. Una falla no la cambia.
- **AVT-12 · Inicio conserva «Ver el plan» y «Ver tu historial».** No son «Ir a…»: llevan a una vista dentro del
  módulo. Se fueron «Ir a Entrenamiento», «Ir a Nutrición» e «Ir a Información». Sin registros hoy, el último registro
  queda como un enlace tenue debajo de las fichas.
- **AVT-13 · La fila fija la dibuja App.tsx,** fuera del contenido que se desplaza; la sesión publica sus textos y sus
  acciones (`fila-fija.tsx`). Se ve solo con la corrida en vivo; otro día, sin cronómetros, «Siguiente ejercicio» queda
  en la pantalla. Un doble toque en la acción del medio es uno solo (700 ms), además de la regla de la corrida.
- **AVT-14 · Los íconos de la fila:** «espera» para Pausar y «actualizar» para Reanudar. La familia no tiene uno de
  pausa, y AV-09 no lo suma.
- **AVT-15 · El ancho de «Perfil» en la barra es estimado** (2,62 em, redondeado hacia arriba). Se mide en el render con
  la candidata, como se midieron las otras etiquetas.
- **AVT-16 · Tildar una serie cronometrada con un dato inválido.** Para guardar lo medido en la fila, el reloj se para
  antes de validar lo escrito; con el descanso automático, la misma acción ya empezó el descanso. Si lo escrito no es
  válido, la serie no se registra y el descanso queda empezado; al tildarla bien, `descanso-al-tildar` lo cierra y
  empieza el nuevo. Es un caso raro y no pierde datos.

## 7. Riesgos

- **TalkBack, sin probar.** Las maquetas dicen qué anuncia cada pieza, pero una maqueta no lo aprueba. Hace falta un
  teléfono y una persona. Hasta entonces, la evidencia lo escribe como pendiente (AV-16).
- **Las lecturas congeladas de las APK (DL-152).** Las etapas 1 y 2 no cambian ninguna respuesta. AV-15 sí suma un campo
  a los eventos que devuelven API-TIE-01 a 03, que las APK 0.20, 0.21 y 0.22 validan con esquemas estrictos. Si el campo
  les llegara, dejarían de abrir sus tiempos. AV-19 suma un valor al estado de una solicitud, que esas mismas APK leen
  como `PENDING` o `RESPONDED`, sin otro valor posible. Por eso los dos viajan solo con la capacidad, y la prueba de las
  lecturas congeladas es condición de cada parte.
- **La capacidad de cliente, si hay campo o estado nuevo (DL-122).** Una capacidad nueva es un compromiso que dura: la
  API tiene que seguir sirviendo a quien no la declara, y la APK nueva la declara solo cuando sabe mostrar y escribir lo
  nuevo. Cada capacidad suma un caso a las pruebas de compatibilidad.
- **Lo que ve el profesional con AV-19.** «Eligió no responder» es un hecho, no una falta. El riesgo está en cómo se
  dibuja más que en el texto: sin color de alerta y sin contarlo como algo pendiente. Se revisa en la evidencia con
  `copy-pantallas.test.cjs` y a ojo.
- **Una persona con una APK vieja y otra nueva.** Si dice que no desde la APK nueva, la vieja le sigue mostrando la
  solicitud como pendiente. Es el costo de no romper la lectura congelada, y se dice en la evidencia.
- **El espacio de la sesión (PV-11 y PV-13).** Con letra ×1,3, la fila de acciones y la navegación en dos filas ocupan
  cerca de un cuarto de la pantalla, y con ×2 ocupan más. Se mide en AV-13 y AV-18 antes de darlo por bueno. PV-13 está a
  ratificar: si Dirección elige la alternativa, se esconde la navegación, y esa es una excepción a PV-11 que decide
  ella.
- **Los permisos (PV-9).** El aviso programado cambia una garantía escrita: «BE no programa avisos locales». La lista de
  permisos se cambia a conciencia y con su prueba, y Android puede demorar el aviso en reposo (AVD-5). Que vibre a
  tiempo con la pantalla apagada solo se sabe en un teléfono real con Android 13 o posterior.
- **Los íconos nuevos.** El de «Mis hábitos» y el engranaje están dibujados en maqueta, y nadie los miró todavía a 18,
  20 y 24 px. Un ícono que se empasta a 18 px no entra a la familia (AV-09).
- **La mudanza de Cuenta a Perfil.** Es la parte más fácil de hacer mal: se puede perder una entrada o dejarla en dos
  lugares. La tabla «dónde quedó cada cosa» y su prueba (AV-02, AV-03) son la red.
- **El tenue de Azul noche.** Las maquetas usan el tenue nuevo (#A3B1C2), aprobado el 2026-10-15 para la próxima versión
  de la APK. Si la APK todavía no lo tiene cuando se programe esta vuelta, va con ella.

## 8. Oráculos a escribir

Al programar, en `WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`, con el formato de los de WP-FORMULARIOS-RONDA-2:

| Oráculo | Qué fija |
|---|---|
| TEST-AVR-001 | Lo que hace falta para decidir (estado, fecha, quién y si se puede responder) nunca está plegado |
| TEST-AVR-002, 003 | La barra con Perfil; ninguna entrada de Cuenta ni del menú se pierde ni queda en dos lugares |
| TEST-AVR-004 | Perfil muestra lo de la persona y los ajustes, con Cerrar mi cuenta al final |
| TEST-AVR-005, 006 | La marca de Perfil: aparece con algo para responder, se va al responder o al negarse, y no por abrir |
| TEST-AVR-007 a 009 | «Quién ve qué» lee lo que existe, no escribe y no dice nada que prohíba 10-B04; pausa, terminado y sin A3 |
| TEST-AVR-010 a 012 | «La que sigue» por el orden del plan; BE no elige el día tipo ni la sesión; los 30 días como un número |
| TEST-AVR-013 | El número de Inicio y el total del desglose de «Tu historial» coinciden |
| TEST-AVR-014 | Registrar una comida y responder un formulario no cambian de regla al plegarse |
| TEST-AVR-015 | Los íconos nuevos son de la familia y tienen nombre |
| TEST-AVR-016 a 019 | El descanso al tildar: automático, manual, en pausa, con una medición abierta y sin recomendado |
| TEST-AVR-020 | Los ajustes del descanso, en el teléfono, con los de fábrica si falla la lectura |
| TEST-AVR-021, 022 | La vibración: cuándo se programa y cuándo se cancela; la lista de permisos |
| TEST-AVR-023 | La acción del momento en cada estado de la sesión |
| TEST-AVR-024 | «Empezar serie N»: dos eventos, el mismo instante y una sola acción compuesta |
| TEST-AVR-025 a 028 | «Arranca sola»: el campo con y sin la capacidad, `calcularTiempos`, las lecturas congeladas y la app cerrada |
| TEST-AVR-029 | Una cuenta nueva: sin bloques vacíos, el paso que falta primero y Perfil sin punto |
| TEST-AVR-030 | La sesión con letra grande: las dos barras fijas, nada cortado, y el ejercicio y el descanso a la vista |
| TEST-AVR-031 a 033 | «Eligió no responder»: la transición, quién puede, lo que ve el profesional y la APK sin la capacidad |
