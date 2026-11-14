# WP-PULIDO-GRANDES — pulir BE como las grandes: Inicio, la sesión, el website y la privacidad a la vista

> **Estado:** DECLARADO el 2026-11-13, sin programar. Las partes PG-01 a PG-19 y el calendario (§3) son el pedido de
> Dirección. Las decisiones PG-D1 a PG-D15 (§5) están **a ratificar**: mientras no haya respuesta, rige la
> recomendación de cada una, salvo en las que lo dicen (PG-D10 y PG-D11 esperan el sí antes de programar su
> parte; PG-D1 la decidió Dirección el 2026-11-13). DL-173.
>
> **Encargo** (Dirección, 2026-11-13):
> - de la página «Pulido como las grandes», Dirección eligió quince ideas y pidió: «Armá el paquete con sus IDs y decime
>   cuándo sale cada cosa»;
> - ese mismo día, al probar la 0.27, dejó cuatro ideas de Inicio y dijo «queda para la próxima», junto con más pulidos.
>
> **Fuente:**
> - el catálogo de la página «Pulido como las grandes», con lo que hoy hace BE verificado en `origin/main` `e2cb9471`
>   con git grep, sin cambiar nada. No está en el repo: cada parte lo cuenta en palabras, para que este paquete sea
>   autocontenido;
> - las cuatro ideas de Dirección sobre Inicio, la carga y la cabecera (§1.1), con la propuesta del continuador;
> - el código de `main` `e4f8b9b4`, releído para las operaciones y los módulos que nombra este paquete.
>
> **Antecedente, no es parte:** «Sacar la palabra prohibida de la portada, y una prueba que la cuide», la primera idea
> del catálogo, ya está hecha en otra rama (#266, sin integrar al declarar este paquete). Este paquete la da por hecha.
>
> **Datos:** solo sintéticos, en local y en `test`. **Esta declaración:** rama `docs-wp-pulido-grandes`, desde `main`
> `e4f8b9b4`. Es solo documentación: no tiene código ni migraciones.

## 0. Legajo y decisiones que cita

- **El legajo:**
  - TEST-PRJ-009: no calificar. Ningún texto nuevo usa las palabras que prohíbe, ni en negación;
  - RNF-ACC-001 y B10-10: WCAG 2.2 AA (4,5:1 para el texto; 3:1 para los bordes y los gráficos que comunican);
  - B10-06 (Entrenamiento): «feedback háptico opcional» (PG-08);
  - B10-01 §36: la APK no promete funcionar sin conexión, pero una acción sensible no se muestra como hecha si el
    servidor no la confirmó, y la persona ve «enviando», «confirmado» o «no confirmado, reintentar» (PG-09 y PG-19);
  - 02 §14 y 07: fuera del MVP, el «modo offline integral». PG-19 no lo es: guarda en espera lo que se anota, nada más;
  - REG-06-131: el motivo de la condición de la sesión (PG-15 no lo toca);
  - 08 §33: en `test`, el ambiente siempre a la vista.
- **Las DL:**
  - DL-049 y DL-077: BE no elige el día tipo ni la sesión. PG-01 lo revisa solo con PG-D1;
  - DL-096: «Tu historial», 90 días sin selector (PG-11 y PG-18 leen de ahí);
  - DL-117 y DL-166: la cabecera única y Perfil (PG-04 y PG-08);
  - DL-136: la invitación con enlace, QR y código (PG-06 y PG-07 reusan el QR);
  - DL-137 D-7: **lo nuevo va en operaciones nuevas**, para no cambiar lo que leen las APK instaladas;
  - DL-140: la nota de coordinación entre profesionales. PG-16 es otra cosa: la nota propia, que no se manda a nadie;
  - DL-152: lo que lee cada APK, congelado por versión. Toda lectura nueva de la APK se congela con su candidata;
  - DL-167: los editores del profesional, integrados (#259). PG-10, PG-14 y PG-16 se apoyan en ellos;
  - DL-169 (UF-00): la descarga del website sirve siempre la última APK;
  - DL-170: Inicio con vidrio, «la que sigue» (AV2-D1), con una sesión en curso solo esa (AV2-D4), y la barra.
- **Otras decisiones de Dirección:** 2026-11-08, se puede reconocer lo que la persona hace, sin castigar lo que no hizo;
  lo no hecho queda neutro (registrada en DL-170).

## 1. Objetivo

Que BE se sienta como las apps líderes en los roces de todos los días (la pantalla que se apaga en el descanso, la
descarga que pasa por una página en inglés, las fechas al revés, los avisos repetidos) y que muestre lo que ninguna de
ellas muestra: quién miró lo que la persona compartió, lo que se puede comparar y lo que no, y lo que todavía no llegó al
servidor. Todo ubica y nada califica.

**Cómo se mide**, al cerrar cada tanda:

| Qué | Hoy (`main` `e4f8b9b4`, la 0.27) | Al cerrar |
|---|---|---|
| Inicio con varias sesiones sin días | Una lista que empuja las comidas hacia abajo | Una tarjeta con la sesión que sigue en el plan y «Otra sesión» (PG-01, con PG-D1) |
| La pantalla en el descanso | Se apaga y hay que desbloquear para tildar | Encendida mientras corre la sesión, y se puede desactivar (PG-05) |
| La descarga de la APK | Una página de GitHub en inglés | Un QR al archivo, con la versión, el tamaño y tres pasos (PG-06) |
| Una dirección que no existe | «404 · This page could not be found» | La voz de BE y una salida (PG-07) |
| Las fechas del website | Campos nativos que se leen «11/27/2026» con el navegador en inglés | «vie 27 nov», con la semana desde el lunes (PG-14) |
| Lo que la persona compartió | Los permisos, sin las lecturas | Quién lo miró y cuándo (PG-12) |
| Las pruebas | — | Un oráculo por parte (§7), cada uno con su mutación |

### 1.1 Las cuatro ideas de Inicio, de Dirección (2026-11-13)

Dirección probó la 0.27 y confirmó que lo de esa versión anda (el círculo de la tira y «Empezar» que se desvanece bajo
la barra). Después dejó cuatro ideas:

1. **Inicio con varias sesiones y sin días.** La lista es larga y empuja las comidas. Dirección pensó en un desplegable.
   El continuador propone, como Hevy y Fitbod, una sola tarjeta con la sesión que sigue en el orden del plan y un botón
   «Otra sesión» (PG-01 y PG-D1).
2. **La pantalla de carga:** el logo llena el círculo, sin el «BE» de adentro (PG-02).
3. **El texto de la carga:** «BE está preparando tu espacio»; abajo sigue «Comprobando tu sesión» (PG-03).
4. **El título de cada pantalla, en la cabecera,** entre el logo y la campana. El continuador propone el título grande de
   iOS y Material 3, que se achica al desplazar, sin la animación de escritura letra por letra (PG-04 y PG-D2).

## 2. Alcance y lo que queda fuera

**Entra:** las 19 partes de §4, con sus pruebas, sus oráculos y la evidencia de cada tanda.

**Queda fuera**, del mismo catálogo, porque Dirección no las eligió en esta vuelta: «Si algo se rompe, BE no se cierra y
te deja avisar», «TalkBack y letra al máximo, probados de verdad», «Tu plan también en la compu», «Ctrl+K», «No pedir la
contraseña todos los días», «Los recordatorios, a la hora que te sirve», «"Lo comí otra vez" en la comida diferente»,
«Modo cocina» y «Comparar dos tomas que elijas». Siguen en el catálogo para otra vuelta. El continuador recomienda
volver a mirar la primera antes del 25/11 (§8).

**Tampoco entra:** el paquete de gráficos que se está investigando. PG-18 se diseña junto con él.

## 3. El calendario

Hoy es el viernes 13/11. La entrega es el miércoles 25/11.

| Tanda | Sale | Partes | Qué lleva |
|---|---|---|---|
| **A** | **APK 0.28 · objetivo martes 17/11** | PG-01 a PG-10 y PG-14 | Las de esfuerzo chico y sin operaciones nuevas: Inicio, la carga, la cabecera, la pantalla encendida, el QR, la página no encontrada, la háptica, tirar para actualizar, los avisos repetidos y las fechas |
| **B** | **APK 0.29 · objetivo viernes 20/11** | PG-11, PG-12, PG-13, PG-15, PG-16 y PG-17 | Las medianas: «La vez pasada», quién miró, la primera vez, la nota para tu profe, las notas del profesional y el plan en PDF |
| **Después del 25/11** | Sin fecha | PG-18 y PG-19 | «Tu ejercicio en el tiempo», con el paquete de gráficos, y «Lo que anotás sin señal», que es grande |

**Las reglas del calendario:**
- **Congelamiento:** desde el lunes 23/11, solo arreglos. Nada nuevo entra a `main` después de esa fecha hasta la
  entrega.
- **Si una parte de la B no está estable el viernes 20/11, pasa a después del 25/11.** «Estable» quiere decir: sus
  criterios de aceptación cumplidos, su oráculo en verde con su mutación, la CI en verde y probada en el teléfono o en el
  website de `test`.
- **El website no espera a la APK.** PG-06, PG-07, PG-10 y PG-14 salen al integrarse en `main` (`test` sirve `main`).
  Si PG-14 no llega al martes 17/11, puede seguir hasta el viernes 20/11 sin demorar la 0.28.
- **La 0.28 sale cuando Dirección termine de probar la 0.27,** para que instale una sola vez.
- **Una sola ventana de redespliegue de la API para la tanda B** (PG-15 y PG-16), con sus migraciones que solo agregan.
- **Los módulos nativos nuevos** (PG-08: `expo-haptics`) cambian el `package-lock.json`, que está en el `buildFilter`
  de la API y del website (`render.yaml`): redespliegan los dos. Van juntos, en un solo cambio, en la tanda A.

**El orden dentro de cada tanda:**
- **A:** primero lo de la APK que toca toda la app (PG-04 y PG-02/03), después Inicio (PG-01), después la sesión (PG-05,
  PG-08) y tirar para actualizar (PG-09). En paralelo, el website (PG-06, PG-07, PG-10 y PG-14). El martes 17/11, la
  candidata 0.28 con su evidencia.
- **B:** primero la API de PG-15 y PG-16 (una sola ventana), después la APK (PG-11, PG-12, PG-13 y PG-15) y el website
  (PG-15, PG-16 y PG-17). El viernes 20/11, la candidata 0.29 con lo que esté estable.

## 4. Las partes

Cada parte dice qué ve la persona (o el profesional), en qué superficie, si necesita la API y lo que no hace. «API: no»
quiere decir que usa solo operaciones y lecturas que ya existen, con el mismo permiso que en su módulo. Si al programar
una lectura no trae lo que hace falta, la parte se detiene y se declara: no se inventa el dato ni se abre una operación
sin decisión.

**Las operaciones nuevas van como operaciones nuevas** (DL-137 D-7): ninguna parte agrega campos obligatorios a una
operación que ya leen las APK instaladas, ni cambia su respuesta. Cada lectura nueva de la APK se congela con su
candidata (DL-152).

**Las pruebas nuevas** van en `apps/mobile/src/*.test.ts` (el jest de la APK), en las del website o en los archivos que
ya están en `npm test`, sin tocar el `package.json` de la raíz. Cada prueba se verifica con una mutación: se rompe la
regla a propósito, la prueba se pone en rojo y se vuelve atrás.

| ID | Qué (en criollo) | Superficie | API | Tanda | Decisión | Oráculo |
|---|---|---|---|---|---|---|
| PG-01 | Inicio: la sesión que sigue y «Otra sesión» | APK | No | A | PG-D1 | TEST-PG-001 |
| PG-02 | La carga: el logo llena el círculo | APK | No | A | — | TEST-PG-002 |
| PG-03 | La carga: «BE está preparando tu espacio» | APK | No | A | — | TEST-PG-002 |
| PG-04 | El título de cada pantalla, en la cabecera | APK | No | A | PG-D2 | TEST-PG-003 |
| PG-05 | La pantalla no se apaga mientras entrenás | APK | No | A | PG-D3 | TEST-PG-004 |
| PG-06 | Bajar la app con un QR, sin pasar por GitHub | Website | No | A | PG-D5 | TEST-PG-005 |
| PG-07 | La página «no encontrada», con la voz de BE | Website | No | A | — | TEST-PG-006 |
| PG-08 | Háptica con criterio: confirma, no premia | APK | No (un módulo nativo nuevo) | A | PG-D4 | TEST-PG-007 |
| PG-09 | Tirar hacia abajo para actualizar, con la hora de lo que ves | APK | No | A | PG-D15 | TEST-PG-008 |
| PG-10 | Los avisos repetidos, en un solo renglón | Website (profesional) | No | A | — | TEST-PG-009 |
| PG-11 | «La vez pasada» al lado de cada serie | APK | No | B | PG-D6 | TEST-PG-010 |
| PG-12 | Quién miró lo que compartiste | APK | No | B | PG-D7 | TEST-PG-011 |
| PG-13 | La primera vez: BE se presenta y promete | APK | No | B | PG-D8 | TEST-PG-012 |
| PG-14 | Las fechas, como se leen acá | Website (profesional) | No | A | PG-D9 | TEST-PG-013 |
| PG-15 | Una nota para tu profe al finalizar | APK, website y API | **Sí: API-TRN-25 y API-TRN-25-LISTA** | B | PG-D10 | TEST-PG-014 |
| PG-16 | Las notas propias del profesional sobre la persona | Website (profesional) y API | **Sí: API-NPP-01 a 03** | B | PG-D11 | TEST-PG-015 |
| PG-17 | El plan en papel o en PDF, para la consulta | Website (profesional); APK (el enlace) | No | B | PG-D12 | TEST-PG-016 |
| PG-18 | Tu ejercicio en el tiempo | APK | No (dentro de 90 días) | Después del 25/11 | PG-D13 | TEST-PG-017 |
| PG-19 | Lo que anotás sin señal, queda | APK | No | Después del 25/11 | PG-D14 | TEST-PG-018 |
| — | Ningún texto nuevo usa las palabras prohibidas | Todas | — | Todas | — | TEST-PG-019 |

### 4.1 Tanda A · APK 0.28 y el website (objetivo: martes 17/11)

**PG-01 · Inicio: la sesión que sigue y «Otra sesión»**
- *Qué ve la persona:* con un plan de varias sesiones sin días, Inicio muestra una sola tarjeta de Entrenamiento: «Sigue
  en tu plan: Piernas A», con «Empezar» y «Ya la hice». Debajo, «Otra sesión ›» abre una hoja desde abajo con todas las
  sesiones del plan y su estado de esta semana («Realizada el martes», «Sin registrar»). Las comidas suben y se ven sin
  desplazar en un teléfono de 360 dp.
- *Superficie:* APK (Inicio).
- *API:* no. Lee lo mismo que hoy (el plan efectivo y lo registrado).
- *Criterios de aceptación:*
  - *Dado* un plan sin días con N ≥ 2 sesiones, *cuando* abre Inicio, *entonces* hay exactamente una tarjeta de sesión
    y un «Otra sesión»;
  - *dado* que la última sesión registrada fue la k del orden del plan, *entonces* la tarjeta muestra la k+1 (y después
    de la última, la primera); sin ninguna registrada, la primera;
  - *dado* una sesión en curso, *entonces* se ve solo esa, como hoy (AV2-D4);
  - *dado* un plan con días (DL-137), *entonces* manda el día, como hoy: esta parte no cambia ese caso;
  - la hoja lista las N sesiones, en el orden del plan, con el mismo peso visual: ninguna destacada;
  - «Sigue en tu plan» dice de dónde sale el orden: el que armó el profesional;
  - con letra ×1,3, la tarjeta no corta texto; TalkBack lee «Sigue en tu plan, Piernas A» y «Otra sesión, abre la lista
    de N sesiones».
- *Lo que NO hace:* no elige por la hora, por el día de la semana ni por lo que «convendría»; no oculta sesiones; no
  cambia el plan; no marca nada como atrasado.

**PG-02 · La carga: el logo llena el círculo**
- *Qué ve la persona:* al abrir la app, el logo redondo de BE ocupa todo el círculo, sin el texto «BE» adentro.
- *Superficie:* APK (la pantalla de carga de la app; la de Android que se dibuja antes, si usa la misma imagen).
- *API:* no.
- *Criterios de aceptación:*
  - el logo cubre el círculo sin borde vacío visible, en Azul noche y en Claro, a 360 y a 412 dp;
  - no hay texto «BE» dentro del círculo; el nombre accesible sigue siendo «BE»;
  - con «reducir movimiento», sin animación.
- *Lo que NO hace:* no cambia el logo de la cabecera ni el ícono de la app; no alarga la carga.

**PG-03 · La carga: «BE está preparando tu espacio»**
- *Qué ve la persona:* debajo del logo, «BE está preparando tu espacio», y abajo, más chico, «Comprobando tu sesión».
- *Superficie:* APK.
- *API:* no.
- *Criterios de aceptación:*
  - los dos textos, en ese orden, con el contraste AA en los dos temas;
  - TalkBack lee los dos una sola vez (una región viva, no dos);
  - el texto sale de un solo lugar (los textos de la APK) y la prueba de textos lo cubre.
- *Lo que NO hace:* no agrega una barra de progreso ni un porcentaje inventado.

**PG-04 · El título de cada pantalla, en la cabecera**
- *Qué ve la persona:* arriba de cada pantalla, el título grande («Nutrición», «Tu historial»). Al desplazar, se achica
  y se acomoda en el centro de la cabecera, entre el logo y la campana, con un fundido.
- *Superficie:* APK (la cabecera única de DL-117, en todas las zonas).
- *API:* no.
- *Criterios de aceptación:*
  - en reposo, un solo título grande; al desplazar más que su alto, el título de la cabecera aparece y el grande se va;
    nunca se ven los dos a la vez a más del 50 %;
  - con «reducir movimiento», el cambio es instantáneo, sin fundido;
  - con letra ×1,3, el título de la cabecera se corta con «…» y nunca empuja el logo ni la campana; TalkBack lee el
    título una sola vez, como encabezado;
  - Inicio conserva la fecha como título (DL-170);
  - el percentil 90 de los cuadros al desplazar no empeora más de 2 puntos frente a la 0.27 (la medición de AV2-16).
- *Lo que NO hace:* no escribe el título letra por letra; no agrega botones a la cabecera; no cambia la barra de abajo.

**PG-05 · La pantalla no se apaga mientras entrenás**
- *Qué ve la persona:* con el teléfono apoyado en el banco, la pantalla queda prendida mientras corre la sesión, con el
  descanso a la vista. En los ajustes del descanso, una casilla: «Mantener la pantalla encendida durante la sesión».
- *Superficie:* APK (la sesión en curso).
- *API:* no. Usa `expo-keep-awake`, que ya viene con Expo (no es un módulo nuevo).
- *Criterios de aceptación:*
  - encendida desde «Iniciar entrenamiento» hasta pausar, finalizar, salir de la sesión o mandar la app a segundo plano;
    al volver a la sesión en curso, se prende otra vez;
  - con la casilla apagada, nunca se pide; la casilla se recuerda en el teléfono;
  - una prueba fija que cada salida de la sesión libera la pantalla (mutación: sacar la liberación al pausar);
  - TalkBack lee la casilla con su estado.
- *Lo que NO hace:* no sube el brillo; no la deja prendida fuera de la sesión; no la prende en Nutrición (el modo cocina
  quedó fuera).

**PG-06 · Bajar la app con un QR, sin pasar por GitHub**
- *Qué ve la persona:* en la portada, desde la compu, un QR con «Escaneá para bajar BE». Lo apunta con el teléfono y la
  APK baja directo. Al lado: la versión, el tamaño y tres pasos con dibujos para permitir la instalación (Samsung,
  Motorola y Xiaomi). Desde el teléfono, en lugar del QR, un botón «Bajar BE».
- *Superficie:* website (portada pública, «La app para Android»).
- *API:* no. La versión y el tamaño salen de la última publicación (PG-D5).
- *Criterios de aceptación:*
  - el QR y el botón llevan al archivo `.apk` de la última publicación (DL-169, UF-00), no a una página;
  - sin poder leer la versión, el QR y el botón siguen andando y la línea de la versión no se dibuja (nunca una versión
    vieja escrita a mano);
  - el QR reusa `components/codigo-qr.tsx`, se lee a 30 cm en una pantalla de 1366 × 768 y tiene un texto alternativo
    con el enlace;
  - los tres pasos están en castellano, con la marca elegible y su dibujo;
  - con el ancho de un teléfono, no hay QR y no hay desplazamiento horizontal.
- *Lo que NO hace:* no publica en Google Play; no cambia cómo se construye ni cómo se firma la APK; no pide datos.

**PG-07 · La página «no encontrada», con la voz de BE**
- *Qué ve la persona:* «Esta página no existe. Si venías de una invitación, pedile a tu profesional un enlace nuevo»,
  con «Ir al inicio» y «Entrar».
- *Superficie:* website (cualquier dirección que no existe).
- *API:* no.
- *Criterios de aceptación:*
  - existe `app/not-found.tsx`; el export estático produce la página 404 y `test` la sirve con código 404 (se mide con
    una dirección inventada);
  - no aparece ningún texto en inglés de Next;
  - en Azul noche y en Claro, con el contraste AA, a 360 px y a 1440 px;
  - una prueba del website fija el texto y los dos enlaces.
- *Lo que NO hace:* no busca la invitación ni adivina el código; no redirige sola; no registra la dirección pedida.

**PG-08 · Háptica con criterio: confirma, no premia**
- *Qué ve (y siente) la persona:* al tildar una serie o registrar una comida, un golpecito corto que dice «quedó». Al
  deshacer, uno distinto, y un error da un doble toque suave. Nunca una vibración de festejo. Se apaga en Perfil.
- *Superficie:* APK (la sesión en curso, Nutrición Hoy, deshacer y los errores de los formularios).
- *API:* no. Suma `expo-haptics`, un módulo nativo nuevo (va en la 0.28 y redespliega la API y el website por el
  `package-lock.json`, §3).
- *Criterios de aceptación:*
  - tres toques, definidos en un solo lugar: confirmar, deshacer y error; ningún otro uso en la app (una prueba de
    estructura lo fija; mutación: un toque suelto en otra pantalla);
  - suena solo cuando el servidor confirmó o cuando la serie quedó guardada en el teléfono, nunca al tocar el botón;
  - con el interruptor de Perfil apagado, ninguno (PG-D4);
  - la vibración del final del descanso sigue como hoy.
- *Lo que NO hace:* no vibra al cerrar una semana, al llegar a un número ni en ningún logro; no reemplaza el texto que
  confirma.

**PG-09 · Tirar hacia abajo para actualizar, con la hora de lo que ves**
- *Qué ve la persona:* tira la pantalla hacia abajo y se vuelve a leer. Debajo del título, un texto chiquito: «Al día,
  10:42». Sin señal: «Ves lo de las 9:15».
- *Superficie:* APK (Inicio, Nutrición Hoy, Entrenamiento Hoy y Novedades).
- *API:* no. Vuelve a pedir las mismas lecturas de `src/lecturas.ts`.
- *Criterios de aceptación:*
  - el gesto existe en las cuatro pantallas, con el color del tema;
  - la hora es la de la última lectura **confirmada** por el servidor, en 24 h; si la lectura falla, la hora no avanza y
    el texto pasa a «Ves lo de las HH:MM» (B10-01 §36);
  - una prueba pura fija los dos textos y que una lectura fallida no mueve la hora (mutación: avanzar la hora al pedir);
  - TalkBack anuncia «Actualizado, 10:42» al terminar.
- *Lo que NO hace:* no actualiza solo cada X minutos; no muestra cuántos datos cambiaron; no esconde un error detrás de
  la hora.

**PG-10 · Los avisos repetidos, en un solo renglón**
- *Qué ve el profesional:* en «Antes de activar» y «Queda sin completar» del editor del plan, en vez de cuatro renglones
  «Serie 1… Serie 2… sin repeticiones fijadas», uno solo: «B · Torso → Ejercicio 3: series 1 a 4 sin repeticiones», con
  «Completar las cuatro», que abre un campo y fija las repeticiones de todas a la vez. En Analizar · Fuerza, el mismo
  motivo en fechas seguidas va en una fila.
- *Superficie:* website del profesional (los editores de DL-167 y Analizar · Fuerza).
- *API:* no. «Completar las cuatro» guarda el borrador con la operación de siempre.
- *Criterios de aceptación:*
  - avisos con el mismo motivo y el mismo ejercicio se agrupan en uno, con el rango («series 1 a 4» o «series 1, 3 y
    4»); el grupo se puede abrir y ver cada uno;
  - «Completar» escribe solo las series del grupo y solo las vacías; deshacer vuelve atrás las N juntas;
  - una prueba pura fija la agrupación (mutación: agrupar por motivo sin el ejercicio);
  - el aviso no pierde el enlace a la serie («Ir a corregir») dentro del grupo abierto.
- *Lo que NO hace:* no completa nada solo; no oculta un aviso distinto; no cambia qué impide activar.

**PG-14 · Las fechas, como se leen acá**
- *Qué ve el profesional:* al elegir una fecha, «vie 27 nov», y un calendario que arranca el lunes, siempre en
  castellano, aunque el navegador esté en inglés.
- *Superficie:* website del profesional (unos quince campos: «¿Cuándo la revisás?», los períodos de Analizar, la agenda
  del plan, la serie observada).
- *API:* no. El valor que se manda sigue siendo la fecha civil `AAAA-MM-DD` de hoy.
- *Criterios de aceptación:*
  - un componente propio reemplaza todos los campos de fecha nativos del website del profesional; una prueba de
    estructura falla si queda un `type="date"` (mutación: volver a ponerlo en uno);
  - se lee en palabras («vie 27 nov»; con otro año, «vie 27 nov 2027»), la semana arranca el lunes y los nombres son
    los de acá, con el navegador en inglés;
  - se maneja entero con teclado (flechas, Inicio, Fin, Re Pág, Av Pág, Enter y Escape) y el lector de pantalla lee la
    fecha completa («viernes 27 de noviembre de 2026»);
  - los mínimos y máximos de hoy se respetan (no deja elegir una revisión en el pasado donde hoy no se puede);
  - el valor enviado es el mismo que antes, byte a byte (las pruebas del website que ya mandan fechas siguen verdes).
- *Lo que NO hace:* no entiende frases como «en 2 semanas» ni marca las revisiones de ese día (PG-D9: queda para otra
  vuelta); no cambia las fechas de la APK.

### 4.2 Tanda B · APK 0.29 y el website (objetivo: viernes 20/11)

**PG-11 · «La vez pasada» al lado de cada serie**
- *Qué ve la persona:* debajo del nombre del ejercicio, en la sesión en curso, una línea gris: «La vez pasada, jueves 6:
  20 kg × 8, 20 kg × 8, 22 kg × 6». Si la toca, esos números pasan a la fila que está por hacer. Sin flechas ni colores.
- *Superficie:* APK (la tabla de series de la sesión en curso).
- *API:* no. Lee «Tu historial» (API-TRN-19-LISTA, 90 días con las series), que la APK ya lee.
- *Criterios de aceptación:*
  - «la vez pasada» es la última ejecución registrada de ese mismo ejercicio en los 90 días (PG-D6), con su fecha;
  - si aquella vez se hizo con una sustitución o con otro ejercicio del plan, lo dice («la hiciste con mancuernas») y
    tocarla no copia nada;
  - si no hay ninguna, la línea no se dibuja (ni «0», ni «sin datos»);
  - tocar copia solo en los campos vacíos de la fila que sigue; nunca pisa lo escrito; deshacer vuelve atrás;
  - la línea es tenue, con el contraste AA, sin color de estado ni flecha; TalkBack la lee entera;
  - la función que decide si dos ejecuciones son comparables es pura y la reusa PG-18 (mutación: comparar una
    sustitución como si fuera el mismo ejercicio).
- *Lo que NO hace:* no sugiere subir el peso; no compara con récords; no dice «mejor» ni «peor».

**PG-12 · Quién miró lo que compartiste**
- *Qué ve la persona:* en Perfil → «Quién ve qué», en la tarjeta de cada profesional, una línea tranquila: «Lo miró
  Laura, de Nutrición, el martes 10 a las 18:20».
- *Superficie:* APK (Perfil).
- *API:* no. Usa API-RES-01, que ya devuelve las últimas 50 lecturas (profesional, área y hora). La APK empieza a
  leerla: se congela con la 0.29 (DL-152).
- *Criterios de aceptación:*
  - por profesional, la última lectura, con el área y la fecha y la hora en 24 h (PG-D7);
  - sin lecturas, «Todavía no lo miró», en el mismo tono;
  - sin contadores ni gráficos de cuántas veces;
  - la lectura falla sin romper la pantalla: los permisos se siguen viendo y la línea no se dibuja;
  - una prueba pura fija la línea desde la respuesta de API-RES-01 (mutación: tomar la primera lectura en vez de la
    última).
- *Lo que NO hace:* no avisa cada vez que alguien mira; no deja quitar el permiso desde esa línea (sigue en su lugar);
  no muestra lecturas de Administración.

**PG-13 · La primera vez: BE se presenta y promete**
- *Qué ve la persona:* después de «Antes de seguir», tres tarjetas cortas, sin cuestionario: «Acá nadie te califica»,
  «Vos decidís quién ve qué» y «Tu profesional arma el plan; mientras, podés anotar tus comidas». En la tercera se piden
  los avisos, diciendo cuáles van a llegar.
- *Superficie:* APK (la Bienvenida y lo que sigue).
- *API:* no. Lo visto se recuerda en el teléfono.
- *Criterios de aceptación:*
  - se ven una sola vez por teléfono y por cuenta; «Saltar» en todas;
  - el permiso de avisos se pide solo en la tercera, con «Ahora no»; con «Ahora no», no se vuelve a pedir hasta que la
    persona vaya a Cuenta (PG-D8);
  - la Bienvenida deja de decir «Plataforma integrada de inteligencia en salud»; la línea de la versión y el commit
    sigue, más chica;
  - se mueven con el dedo y con TalkBack («Tarjeta 1 de 3»); con «reducir movimiento», sin animación;
  - una prueba fija que no se muestran dos veces (mutación: no guardar lo visto).
- *Lo que NO hace:* no pide metas, peso ni datos de salud; no reemplaza el consentimiento ni «Antes de seguir».

**PG-15 · Una nota para tu profe al finalizar**
- *Qué ve la persona:* al finalizar la sesión, un renglón opcional: «¿Algo para contarle a tu profe?», con frases a un
  toque («Algo me molestó», «Cambié de máquina», «Tuve poco tiempo») o texto libre corto.
- *Qué ve el profesional:* la nota junto a esa sesión, en la ficha de Entrenamiento, como contexto.
- *Superficie:* APK (el cierre de la sesión), website del profesional y API.
- *API:* **sí, dos operaciones nuevas** (PG-D10):
  - **API-TRN-25**: la persona agrega una nota a una ejecución suya ya confirmada. Con `Idempotency-Key`, solo agrega,
    hasta 280 caracteres, sin datos de otras personas. Una migración que solo agrega la tabla;
  - **API-TRN-25-LISTA**: el profesional de Entrenamiento lee las notas de las ejecuciones que ya puede ver, con el
    mismo permiso que API-TRN-19.
  - API-TRN-18 (confirmar) **no cambia**: la nota viaja aparte, después de confirmar. Las APK instaladas siguen andando.
- *Criterios de aceptación:*
  - nunca obligatoria: finalizar sin nota es igual que hoy; la nota se manda después de que la ejecución quedó
    confirmada, y si falla, la sesión sigue registrada y la nota dice «No se mandó · Reintentar»;
  - con «Realizada», la nota va igual (no depende de la condición ni del motivo de REG-06-131);
  - el profesional la ve en la sesión, sin color de alarma ni contador; otro profesional que no ve esa sesión no la ve
    (prueba de permiso: 404, igual que una ejecución ajena);
  - la nota no se edita: una nueva queda debajo, con su hora;
  - pruebas: de la API (permiso, idempotencia, el largo y que solo agrega, con la mutación de dejar leer a otra área) y
    de la APK (la nota no bloquea el cierre).
- *Lo que NO hace:* no es un chat; el profesional no responde desde ahí; no dispara avisos; BE no interpreta lo que dice
  la nota.

**PG-16 · Las notas propias del profesional sobre la persona**
- *Qué ve el profesional:* en la ficha (Resumen), un bloc «Tus notas»: «le molesta la rodilla izquierda en la sentadilla
  profunda», con su fecha. Si la ata a un ejercicio o a una comida, al armar el plan la nota aparece al lado de ese
  ejercicio o de esa comida.
- *Superficie:* website del profesional (la ficha y los editores de DL-167) y API.
- *API:* **sí, tres operaciones nuevas** de una familia propia de BE, **NPP** (notas propias del profesional), que se
  declara en la guardia de trazabilidad con esta DL (PG-D11):
  - **API-NPP-01**: agregar una nota sobre una persona vinculada, opcionalmente atada a un ejercicio o a una comida del
    plan. Con `Idempotency-Key`; hasta 1000 caracteres; solo agrega;
  - **API-NPP-02**: listar las notas propias sobre esa persona;
  - **API-NPP-03**: archivar una nota (queda en la historia, no se borra).
  - Una migración que solo agrega la tabla y su historia.
- *Criterios de aceptación:*
  - solo el autor lee y archiva sus notas; otro profesional, aunque sea del mismo equipo o área, no (404, como una
    persona inexistente; mutación: dejar leer a otro profesional del área);
  - sin vínculo vigente, no se agrega ni se lee (las de antes quedan guardadas, como el resto de los datos);
  - la nota atada aparece al lado de su ejercicio o comida en el editor; si el ejercicio ya no está en el plan, queda en
    el bloc, con «del ejercicio X, que ya no está»;
  - entra en lo que la persona puede pedir de sus datos (la exportación), según PG-D11;
  - respeta «Ocultar nombres» en la ficha.
- *Lo que NO hace:* no se manda a nadie (para eso está la nota de coordinación, DL-140); la persona no la ve en la app;
  BE no la resume ni la analiza.

**PG-17 · El plan en papel o en PDF, para la consulta**
- *Qué ve el profesional:* en el plan de Nutrición y en el de Entrenamiento, «Imprimir o guardar en PDF». Arma una hoja
  prolija: el profesional, la persona, la versión del plan, desde cuándo vale, la próxima revisión, las comidas con sus
  opciones y cantidades (o las sesiones con sus series) y un QR que abre ese plan en la app.
- *Superficie:* website del profesional (la ficha); la APK, para que el QR abra el plan (PG-D12).
- *API:* no. Imprime lo que la pantalla ya leyó; «Guardar en PDF» es el del navegador.
- *Criterios de aceptación:*
  - la hoja tiene su propia hoja de estilos de impresión: sin barras, sin botones, en blanco y negro legible, A4 y
    carta, sin cortar una comida o una sesión entre dos páginas;
  - dice la versión y «vale desde» con la fecha en palabras (las de PG-14);
  - el QR no lleva datos de la persona: una dirección del website sin identificadores, que la 0.29 abre en el plan de
    quien tiene la sesión iniciada; sin la app, el website ofrece bajarla (PG-06);
  - con «Ocultar nombres» prendido, avisa antes de imprimir;
  - una prueba fija que la hoja no imprime la navegación (mutación: sacar la regla de impresión).
- *Lo que NO hace:* no genera un archivo en el servidor; no manda el plan por correo ni por WhatsApp; no imprime la
  evolución ni las medidas.

### 4.3 Después del 25/11

**PG-18 · Tu ejercicio en el tiempo**
- *Qué ve la persona:* en «Tu historial», toca «Sentadilla» y ve sus sesiones como puntos sobre fechas reales, con la
  carga y las repeticiones de cada serie. La línea se corta donde cambió el plan o la hizo con otro ejercicio. Debajo, la
  misma lista en texto.
- *Superficie:* APK.
- *API:* no, dentro de los 90 días que ya lee «Tu historial». Si el paquete de gráficos pide más, se declara ahí
  (PG-D13).
- *Criterios de aceptación:*
  - los cortes salen de la misma función de comparabilidad que PG-11;
  - la lista en texto dice lo mismo que el gráfico y TalkBack la lee;
  - los colores y las marcas, del paquete de gráficos, con 3:1 contra el fondo.
- *Lo que NO hace:* no marca récords; no estima la repetición máxima para la persona (DL-171 es solo del profesional);
  no une con una línea lo que no es comparable.
- *Depende de:* PG-11 y el paquete de gráficos.

**PG-19 · Lo que anotás sin señal, queda**
- *Qué ve la persona:* sin señal, registra la comida igual y queda la marca «Guardado en el teléfono · se manda cuando
  vuelva la señal». Cuando vuelve, cambia sola a «Guardado», sin duplicar nada.
- *Superficie:* APK (Nutrición: registrar una opción, completar cantidades y la comida diferente).
- *API:* no. Usa las claves de idempotencia y el almacén cifrado que ya existen, como las series pendientes de
  Entrenamiento.
- *Criterios de aceptación:*
  - lo pendiente nunca se muestra como «Guardado» (B10-01 §36);
  - un registro reintentado con la misma clave no se duplica (prueba con la API real: dos envíos, un registro);
  - si el servidor lo rechaza al volver, la marca pasa a «No se pudo guardar», con el motivo y «Reintentar» o
    «Descartar»;
  - la foto de la comida diferente queda en espera con el registro, o el registro se manda sin la foto con su aviso
    (PG-D14).
- *Lo que NO hace:* no es el «modo offline integral» que el MVP deja fuera: no lee el plan sin señal más allá de lo que
  ya quedó en pantalla, ni guarda en espera otras áreas.
- *Depende de:* PG-09 (la hora de lo confirmado y sus textos).

## 5. Lo que decide Dirección (PG-D)

Son propuestas del continuador, cada una con su recomendación y su alternativa, **a ratificar**. Mientras no haya
respuesta, rige la recomendación, salvo en PG-D1, PG-D10 y PG-D11, que esperan el sí antes de programar su parte
(PG-D1 la decidió Dirección el 2026-11-13; PG-D10 y PG-D11, el 2026-11-14).

- **PG-D1 · Inicio con varias sesiones** · **decidida por Dirección el 2026-11-13: la que sigue y «Otra sesión»; revisa DL-077 para Inicio.**
  - *Recomiendo:* la tarjeta con la que sigue en el orden del plan, después de la última registrada, y «Otra sesión»
    con todas, como Hevy y Fitbod. El orden lo puso el profesional al armar el plan: BE no elige, sigue ese orden y lo
    dice («Sigue en tu plan»).
  - *Alternativa:* el desplegable que pensó Dirección: «Tus N sesiones ›», plegado, sin ninguna destacada. Respeta
    DL-077 al pie de la letra, pero la persona tiene que abrirlo siempre para empezar.
- **PG-D2 · El título en la cabecera** · **a ratificar.**
  - *Recomiendo:* el título grande que se achica al desplazar (iOS y Material 3), con fundido y sin escritura letra por
    letra.
  - *Alternativa:* el título fijo en la cabecera, siempre chico. Es más simple y libera alto, pero las pantallas pierden
    un título que se lea de lejos.
- **PG-D3 · La pantalla encendida** · **a ratificar.**
  - *Recomiendo:* prendida por defecto durante la sesión, con la casilla para apagarla. Es lo que hacen Strong y Hevy, y
    queda dicho a la vista.
  - *Alternativa:* apagada por defecto, que se prenda desde la casilla. Gasta menos batería, pero el roce sigue para
    quien no la descubre.
- **PG-D4 · La háptica** · **a ratificar.**
  - *Recomiendo:* prendida por defecto, con un interruptor propio en Perfil; «reducir movimiento» no la apaga, porque es
    otro sentido.
  - *Alternativa:* que «reducir movimiento» también la apague, o apagada por defecto.
- **PG-D5 · De dónde salen el archivo, la versión y el tamaño del QR** · **a ratificar.**
  - *Recomiendo:* cada publicación suma una copia con un nombre fijo (`be.apk`) para que el enlace
    `releases/latest/download/be.apk` sirva siempre la última; la versión y el tamaño se leen en el navegador de la API
    pública de GitHub de la última publicación, y si no responde, no se dibujan.
  - *Alternativa:* escribir la versión al construir el website. Es más simple, pero queda vieja cada vez que sale una
    APK sin redesplegar el website.
- **PG-D6 · Qué es «la vez pasada»** · **a ratificar.**
  - *Recomiendo:* la última ejecución de ese mismo ejercicio, en cualquier sesión, dentro de los 90 días. Tocar copia
    solo la fila que sigue.
  - *Alternativa:* solo la misma sesión del plan (más estrecho, y con un plan nuevo se queda sin datos), o copiar todas
    las filas de una vez.
- **PG-D7 · Cuánto se muestra de quién miró** · **a ratificar.**
  - *Recomiendo:* la última lectura por profesional, en una línea.
  - *Alternativa:* «Ver todas» con las 50 que devuelve API-RES-01, en una hoja aparte. Más completo, y más cerca de
    contar.
- **PG-D8 · Los avisos en la primera vez** · **a ratificar.**
  - *Recomiendo:* pedirlos en la tercera tarjeta, diciendo cuáles llegan, y no volver a pedirlos si dice «Ahora no».
  - *Alternativa:* no pedirlos en la presentación y pedirlos solo en contexto (el primer descanso o la primera comida),
    como hoy.
- **PG-D9 · Hasta dónde llega el selector de fechas** · **a ratificar.**
  - *Recomiendo:* en la 0.28 (el website), la fecha en palabras, la semana desde el lunes y el teclado. Las frases
    («en 2 semanas») y las revisiones marcadas, en otra vuelta.
  - *Alternativa:* todo junto, como en el catálogo. Corre el riesgo de no llegar al 17/11, y el congelamiento del 23/11
    deja poco margen.
- **PG-D10 · Dónde viaja la nota para tu profe** · **aprobada por Dirección el 2026-11-14 («Tienes mi sí para las notas»): las dos operaciones nuevas, aparte de confirmar.** Lo programado está en §11.
  - *Recomiendo:* las dos operaciones nuevas de PG-15 (API-TRN-25 y su lista), aparte de confirmar la sesión. Las APK
    instaladas no cambian, y si la nota falla, la sesión ya quedó registrada.
  - *Alternativa:* un campo opcional en API-TRN-18. Es una operación menos, pero cambia lo que manda la APK al confirmar
    y va contra DL-137 D-7.
- **PG-D11 · Quién ve las notas propias del profesional** · **aprobada por Dirección el 2026-11-14 («Tienes mi sí para las notas»): solo su autor, y entran en la exportación de la persona.** Lo programado está en §11.
  - *Recomiendo:* solo su autor. La persona no las ve en la app, pero entran en lo que puede pedir de sus datos: son
    datos sobre ella (derecho de acceso).
  - *Alternativa:* que la persona las vea siempre, en «Quién ve qué». Es más transparente, pero el profesional deja de
    escribir lo que necesita recordar.
- **PG-D12 · El QR de la hoja impresa** · **a ratificar.**
  - *Recomiendo:* una dirección del website sin datos de la persona (`/plan`), que la 0.29 suma a los enlaces que abre
    la app (hoy abre solo `/invitacion`).
  - *Alternativa:* la hoja sin QR en esta vuelta. Ahorra el cambio de la APK, y el papel no avisa cuando quedó viejo.
- **PG-D13 · El período de «Tu ejercicio en el tiempo»** · **a ratificar con el paquete de gráficos.**
  - *Recomiendo:* empezar con los 90 días de «Tu historial», sin operación nueva.
  - *Alternativa:* una lectura nueva por ejercicio y por período, para ver más de 90 días.
- **PG-D14 · La foto, sin señal** · **a ratificar.**
  - *Recomiendo:* la foto queda en espera junto con su registro, en el almacén del teléfono, y se borra al confirmarse.
  - *Alternativa:* el registro se manda sin la foto, con el aviso «La foto no se guardó: sacala de nuevo cuando tengas
    señal». Es más liviano, y pierde la foto.
- **PG-D15 · Cuándo se ve la hora de lo que ves** · **a ratificar.**
  - *Recomiendo:* siempre, chiquita, debajo del título.
  - *Alternativa:* solo al tirar y cuando falla. Hay menos texto, pero la persona no sabe de cuándo es lo que ve hasta
    que tira.

## 6. Riesgos

- **El calendario es corto:** la A tiene dos días hábiles y la B, tres. Por eso la regla de §3: lo que no esté estable el
  20/11 pasa a después del 25/11, y desde el 23/11 solo arreglos.
- **PG-04 toca la cabecera de toda la app:** si la medición de cuadros empeora, el título queda fijo (la alternativa de
  PG-D2) y la parte cierra igual.
- **PG-14 toca unos quince campos:** el valor enviado tiene que ser idéntico; las pruebas del website que ya mandan
  fechas son la red.
- **PG-08 es un módulo nativo:** redespliega la API y el website. Se suma una sola vez, en la A.
- **PG-15 y PG-16 tocan la API:** una sola ventana de redespliegue y migraciones que solo agregan. Si una no llega, la
  otra sale igual.
- **PG-10, PG-14 y PG-16 tocan los editores recién rediseñados (DL-167):** se programan sobre `main`, no sobre una rama
  vieja.

## 7. Oráculos a escribir

Al programar, en `WP-PULIDO-GRANDES-ORACULOS.md`, con los trece campos del 11A. Cada uno, con su mutación.

| Oráculo | Qué fija | Parte |
|---|---|---|
| TEST-PG-001 | Una sola tarjeta con la sesión que sigue; la hoja con todas, sin destacar; con una en curso, solo esa; con días, el día | PG-01 |
| TEST-PG-002 | La carga: el logo sin texto adentro y los dos textos en una sola región viva | PG-02, PG-03 |
| TEST-PG-003 | El título grande y el de la cabecera nunca a la vez; sin fundido con «reducir movimiento» | PG-04 |
| TEST-PG-004 | La pantalla encendida solo con la sesión corriendo, y liberada en cada salida | PG-05 |
| TEST-PG-005 | El QR y el botón, al archivo de la última; sin versión, sin la línea | PG-06 |
| TEST-PG-006 | La página no encontrada, en castellano y con sus dos salidas | PG-07 |
| TEST-PG-007 | Tres toques en un solo lugar; solo después de confirmar; apagados con el interruptor | PG-08 |
| TEST-PG-008 | La hora es la de lo confirmado; una lectura fallida no la mueve | PG-09 |
| TEST-PG-009 | Los avisos iguales del mismo ejercicio, en un grupo; «Completar» solo escribe los vacíos | PG-10 |
| TEST-PG-010 | «La vez pasada»: la última comparable, con su fecha; una sustitución no se copia | PG-11 |
| TEST-PG-011 | Quién miró: la última lectura por profesional, sin contar | PG-12 |
| TEST-PG-012 | La presentación, una sola vez, y el permiso pedido una sola vez | PG-13 |
| TEST-PG-013 | Ningún campo de fecha nativo en el website del profesional; el valor enviado, igual | PG-14 |
| TEST-PG-014 | La nota: solo agrega, con su permiso, y nunca bloquea el cierre | PG-15 |
| TEST-PG-015 | Las notas propias: solo el autor las lee; archivar no borra | PG-16 |
| TEST-PG-016 | La hoja impresa sin navegación y con el QR sin datos de la persona | PG-17 |
| TEST-PG-017 | El ejercicio en el tiempo: los cortes de la misma función que PG-11 | PG-18 |
| TEST-PG-018 | Lo pendiente nunca dice «Guardado»; un reintento no duplica | PG-19 |
| TEST-PG-019 | Ningún texto nuevo usa las palabras que prohíbe TEST-PRJ-009 (`copy-pantallas.test.cjs` y la prueba de la portada de #266) | Todas |

## 8. Dependencias y coordinación

- **Entre las partes:**
  - PG-18 depende de PG-11 (la función de comparabilidad) y del paquete de gráficos;
  - PG-19 se apoya en PG-09 (la hora de lo confirmado y sus textos);
  - PG-17 usa PG-06 (sin la app, el website ofrece bajarla) y las fechas en palabras de PG-14;
  - PG-02 y PG-03 son la misma pantalla y salen juntas; PG-13 sigue a esa carga en la primera apertura;
  - PG-05 y PG-08 son de la misma pantalla (la sesión en curso) y se prueban juntas en el teléfono.
- **Con otros paquetes:**
  - WP-APP-VUELTA-2 (DL-170): PG-01 respeta AV2-D4 (con una sesión en curso, solo esa) y el caso con días; PG-04
    conserva la fecha como título de Inicio;
  - WP-EDITORES-PROFESIONAL (DL-167): PG-10, PG-14 y PG-16 van sobre los editores integrados;
  - la portada sin la palabra prohibida (#266): PG-06 cambia la misma sección de la portada. Se programa después
    de que #266 se integre, para no pisarse;
  - el paquete de gráficos (en investigación): PG-18.
- **Lo que el continuador recomienda mirar antes del 25/11, fuera de este paquete:** «Si algo se rompe, BE no se cierra
  y te deja avisar». Es el seguro de la entrega: hoy un error de dibujo cierra la app. Queda a decisión de Dirección.

## 9. Lo programado: tanda A en la APK (rama `wp-pulido-a-app`, 2026-11-13)

> **Estado:** programado en una rama desde `main` `6b3f1afe`, con el PR en borrador y sin integrar. Cubre PG-01 a PG-05,
> PG-08 y PG-09 (la APK). PG-06, PG-07, PG-10 y PG-14 (el website) van en otra rama.

| Parte | Qué quedó | Dónde | Prueba (oráculo) |
|---|---|---|---|
| PG-01 | Una sola tarjeta con la que sigue en el orden del plan («Sigue en tu plan»), con «Empezar» y «Ya la hice», y «Otra sesión» con una hoja desde abajo: todas, en el orden del plan, con el mismo peso y su estado de la semana. Con una en curso, solo esa; con días, el día | `la-que-sigue.ts`, `pantallas/inicio-entrenamiento.tsx` | `la-que-sigue.test.ts` (TEST-PG-001) |
| PG-02 y PG-03 | El logo llena el aro, sin «BE» adentro; «BE está preparando tu espacio» y «Comprobando tu sesión» en una sola región viva | `logo-de-la-carga.ts`, `pantallas/recuperacion.tsx` | `logo-de-la-carga.test.ts` (TEST-PG-002) |
| PG-04 | El título grande sube a la cabecera al desplazar, con un solo valor de fundido (v y 1 − v); sin fundido con «reducir movimiento» | `titulo-de-la-cabecera.ts`, `titulo-en-la-cabecera.tsx`, `ui.tsx`, `cabecera.tsx`, `App.tsx` | `titulo-de-la-cabecera.test.ts` (TEST-PG-003) |
| PG-05 | La pantalla encendida con la sesión corriendo; liberada al pausar, finalizar, salir o con la app atrás; la casilla en los ajustes del descanso | `pantalla-encendida.ts`, `pantalla-encendida-en-la-sesion.ts`, `preferencias-del-telefono.ts` | `pantalla-encendida.test.ts` (TEST-PG-004) |
| PG-08 | Tres toques en un solo lugar (`haptica.ts`), después de confirmar; «Vibrar al confirmar» en Perfil | `toques.ts`, `haptica.ts`, `registro-de-comidas.tsx`, `pantallas/entrenamiento.tsx`, `pantallas/perfil.tsx` | `toques.test.ts` (TEST-PG-007) |
| PG-09 | Tirar para actualizar en Inicio, Nutrición, Entrenamiento y Novedades, con «Al día, 10:42» o «Ves lo de las 9:15» debajo del título | `hora-de-lo-que-ves.ts`, `hora-en-pantalla.tsx`, `lecturas.ts`, `App.tsx` | `hora-de-lo-que-ves.test.ts` (TEST-PG-008) |

Cada prueba se verificó con su mutación (la regla rota a propósito pone la prueba en rojo). Los módulos nativos van en un
solo cambio del `package-lock.json`: `expo-haptics` 57.0.3 (nuevo) y `expo-keep-awake` 57.0.2 (ya venía con Expo; ahora
se declara), los dos de la línea 57 del SDK.

### 9.1 Decisiones del continuador al programar (a ratificar)

- **PG-T1 · Qué corre el orden de «la que sigue».** *Elegí:* solo una sesión realizada (también con desvío), con la
  condición vigente después de las correcciones; una registrada sin realizar no lo corre, porque la persona no la hizo.
  *Alternativa:* cualquier sesión registrada.
- **PG-T2 · De dónde sale lo registrado.** *Elegí:* la misma lectura de 30 días que Inicio ya hacía para la tira y la
  actividad (una sola, con la misma clave), ubicando cada sesión por su identificador en el plan. Si la última realizada
  es de hace más de 30 días, arranca por la primera; si no se pudo leer, dice «La primera de tu plan» y no «Sigue».
  *Alternativa:* una lectura nueva más larga.
- **PG-T3 · Elegir otra en la hoja.** *Elegí:* la pone en la tarjeta por hoy, mientras dure la sesión de la app (en
  memoria), con «Volver a la que sigue». La hoja conserva la frase de siempre: «Tu plan tiene varias sesiones. Elegí la
  que hiciste o vas a hacer.». *Alternativa:* que tocar una sesión de la hoja la abra directo.
- **PG-T4 · La carga.** *Elegí:* sale «Un momento, por favor.»; «Está tardando» y «No pudimos comprobar tu sesión»
  siguen como estaban. La pantalla que Android dibuja antes no se tocó: `app.config.ts` no declara una propia.
- **PG-T5 · Qué título sube.** *Elegí:* el primer título de la pantalla con texto simple; sube al pasar su borde de
  abajo (el relleno de 20 dp, su lugar y su alto), y el chico deja 112 dp a cada lado con «Volver» y 60 con el logo.
- **PG-T6 · Dónde se guardan la casilla y el interruptor.** *Elegí:* en el teléfono, aparte de los ajustes del descanso
  (`be:preferencias-del-telefono`), para no cambiar lo que esos guardan.
- **PG-T7 · Qué toque hace el teléfono.** *Elegí:* en Android, la háptica del sistema (confirmar, «toggle off» y
  rechazar), que no pide el permiso de vibrar, y si el teléfono es viejo y no la tiene, una de siempre; en iOS, un
  impacto leve, la selección y el aviso doble. También suena el error al tildar una serie con un dato que falta.
  Completar cantidades no suena todavía.
- **PG-T8 · El gesto en las pestañas.** *Elegí:* en Nutrición y en Entrenamiento, el gesto va en toda la pantalla (Hoy,
  Plan y lo demás), porque son una sola pantalla con pestañas; la hora es la más vieja de lo que se ve.
- **PG-T9 · El interruptor de la háptica.** *Elegí:* una fila con interruptor en Perfil → Ajustes, debajo de la
  apariencia; la lista de ajustes de Perfil no cambia.

### 9.2 Lo que falta para cerrar la tanda A en la APK

- Probarlo en el teléfono: la letra ×1,3 en Inicio y en la cabecera, TalkBack en las seis partes, la pantalla encendida
  con el teléfono apoyado, la háptica en un Android 10 y en uno nuevo, y el gesto de tirar en las cuatro pantallas.
- La medición de cuadros de PG-04 (percentil 90 frente a la 0.27, como en AV2-16): sin teléfono no se puede medir. Si
  empeora más de 2 puntos, el título queda fijo (la alternativa de PG-D2).
- `WP-PULIDO-GRANDES-ORACULOS.md` con los trece campos: en modo liviano, los oráculos quedaron en las pruebas, con su
  mutación; la ficha se escribe al cerrar la tanda.

## 10. Lo programado · tanda A · website (rama `wp-pulido-a-web`, #268, en borrador)

> Programado el 2026-11-13 sobre `main` `6b3f1afe`, con #266 ya integrado. Sin integrar: lo revisa Dirección. Las
> decisiones nuevas (PG-T30 a PG-T39) están **a ratificar**; mientras tanto, rige lo programado.

| Parte | Commit | Qué quedó | Oráculo |
|---|---|---|---|
| PG-06 | `642b19f0` | `components/descarga-de-la-app.tsx` y `lib/descarga-de-la-app.ts`: el QR (con `CodigoQr`) y el botón al archivo `releases/latest/download/be.apk`; la línea de la versión y el tamaño solo si la lectura pública de la última publicación responde con la copia `be.apk`; los tres pasos por marca, con dibujo | TEST-PG-005 |
| PG-07 | `1cc5f5a0` | `app/not-found.tsx` y `lib/no-encontrada.ts`: el texto, «Ir al inicio» y «Entrar»; sin redirigir, sin buscar y sin indexar | TEST-PG-006 |
| PG-14 | `481497db` | `components/campo-de-fecha.tsx` y `lib/fecha-en-palabras.ts`: los catorce campos de fecha del profesional, con sus mismos límites | TEST-PG-013 |
| PG-10 | `68f3bfbd` | `avisos-agrupados.ts` y `renglon-de-aviso.tsx`: el cuadro «Antes de activar», el panel y el asistente agrupan lo sin completar; «Completar» y su «Deshacer»; en Fuerza, la tabla y «Lo que no entra» juntan las sesiones seguidas con el mismo motivo | TEST-PG-009 |

**Oráculos** (en `apps/web/test/pulido-grandes.test.mjs`, que corre con `npm run test -w @be/web`). Cada mutación se probó
cambiando el código y corriendo la prueba; todas la ponen en rojo:

| Oráculo | Mutación | Resultado |
|---|---|---|
| TEST-PG-005 | La versión se toma de cualquier `.apk` de la publicación, no de la copia `be.apk` | rojo |
| TEST-PG-009 | Agrupar por motivo sin el ejercicio | rojo |
| TEST-PG-009 | «Completar» escribe también las series que ya tenían repeticiones | rojo |
| TEST-PG-009 | El rango nunca dice «a» («series 1, 2, 3 y 4») | rojo |
| TEST-PG-013 | La semana arranca el domingo | rojo |
| TEST-PG-013 | El teclado sale de los mínimos y máximos | rojo |
| TEST-PG-013 | Volver a poner un `type="date"` en un campo | rojo |

TEST-PG-006 es de estructura (el texto, los dos enlaces, nada que redirija): no tiene lógica que mutar. Dos pruebas del
editor (TB-48 y TEST-EDP-026) cambian solo la forma del cálculo que leen: ahora pasa por `enGrupos`.

**Decisiones nuevas, a ratificar:**
- **PG-T30 · La marca de los pasos:** arranca en Samsung, la más común acá, y se cambia con un toque. *Alternativa:* adivinarla por el navegador (poco confiable).
- **PG-T31 · La línea de la versión:** «Versión 0.28.0 · 85 MB», con la etiqueta tal cual (si la última es candidata, lo dice) y el tamaño en megabytes de mil, como lo dice Android al bajar.
- **PG-T32 · En la compu, también el archivo:** debajo del QR, un enlace chico «O bajá el archivo en esta compu». El botón grande es solo para el ancho de un teléfono, y en `test` conserva el aviso de prueba de UF-08.
- **PG-T33 · Lo que impide activar no se agrupa:** cada cosa sigue con su «Ir a corregir» y el principal cuenta lo mismo. Se agrupa lo sin completar. *Alternativa:* agrupar también lo que impide, contando el grupo como una cosa.
- **PG-T34 · «Completar»:** solo para las series sin repeticiones; acepta un número o un rango («8-12», el menor primero); escribe solo las vacías y se deshace con el «Deshacer» del editor. No aparece para otros motivos.
- **PG-T35 · Cómo se dice el rango:** tres o más series seguidas van con «a» («series 1 a 4»); dos seguidas se nombran («series 1 y 2»).
- **PG-T36 · «Seguidas» en Fuerza:** sesiones vecinas en la tabla, no días de calendario; una estimación entre medio corta el grupo. Se lee «del mar 1 dic al vie 4 dic, 3 sesiones».
- **PG-T37 · El campo de fecha:** un botón con la fecha en palabras y un calendario debajo, no un texto para escribir; «Hoy» cuando entra en los límites y «Quitar la fecha» donde el nativo dejaba vaciar (los períodos y la comparación a mano). Los meses cortos son los del resto del website («sept»).
- **PG-T38 · «¿Cuándo la revisás?» sin mínimo:** el campo nativo no lo tenía y se conserva así. *Pregunta a Dirección:* ¿el mínimo tendría que ser mañana?
- **PG-T39 · La página no encontrada:** sin la campana de novedades (quien llega no siempre tiene sesión) y fuera de los buscadores.
- **PG-T40 · Los campos de fecha Y HORA, todavía nativos (revisión de la tanda A):** son cinco: la fecha y hora de la evaluación (Nutrición y Entrenamiento), «Vigente desde» de los objetivos (Nutrición y Entrenamiento) y la toma de antropometría. Quedan como están hasta que `CampoDeFecha` tenga la hora en 24 h (después del 25/11). TEST-PG-013 los lista uno por uno, así que uno nuevo pone la prueba en rojo. La alternativa era la variante con hora ya, pero no entraba antes del 23/11 con su revisión.
- **PG-T41 · «Completar» no se ofrece dentro del cuadro «Antes de activar» (revisión de la tanda A):** su «Deshacer» vive en el aviso flotante, que con el cuadro modal abierto queda inerte y el lector no lo alcanza. En el cuadro, cada aviso conserva su «Ir»; «Completar» sigue en el panel y en el asistente. Las filas usan el texto del renglón como clave, para que lo abierto no pase a la fila siguiente. La alternativa era el «Deshacer» dentro del cuadro, con `role=status`.

**Lo que quedó de la revisión de la tanda A para el 18/11** (cuando vuelvan las revisiones adversarias): un recorrido en el navegador que elija una fecha con el teclado y compruebe el valor AAAA-MM-DD, que Escape cierre el calendario sin cerrar el cuadro y que `/no-existe` responda 404; el foco después de «Completar» en el panel; y las seis observaciones de severidad baja.

**Lo que falta antes de integrar, fuera de esta rama:**
1. ~~**La copia `be.apk` (PG-D5)**~~: hecho el 2026-11-13, con el sí de Dirección. La 0.27 tiene la copia (mismo SHA-256) y el paso quedó en `docs/DESPLIEGUE.md`.
2. **La política de contenido de `render.yaml`:** sumar `https://api.github.com` a `connect-src`. Sin eso, la línea de la versión no se dibuja en `test`; el QR y el botón andan igual.
3. **El código 404 en `test`** se mide después de integrar, con una dirección inventada.
4. **La mirada en pantalla** (Azul noche y Claro, 360 y 1440 px, el QR a 30 cm en 1366 × 768, el lector de pantalla en el calendario): queda para la evidencia de la tanda, con el website de `test`.
5. `/invitacion` sigue ofreciendo la página de publicaciones si no hay app: lo cambia PG-17 (tanda B).

## 11. Lo programado · tanda B · las notas (rama `wp-pulido-b-notas`)

> Programado el 2026-11-14 sobre `main` `1089fc24`, con PG-D10 y PG-D11 aprobadas por Dirección ese mismo día («Tienes mi
> sí para las notas»). PR #271, sin integrar. Cubre PG-15 y PG-16 en la API, el website y la APK, con una sola migración
> que solo agrega: es la ventana de redespliegue de la API de la tanda B (§3). Las decisiones nuevas (PG-T60 a PG-T73)
> están **a ratificar**; mientras tanto, rige lo programado.

| Parte | Qué quedó | Dónde | Oráculo |
|---|---|---|---|
| PG-15 · API | **API-TRN-25** `POST /training/executions/{executionId}/notes`: la persona agrega una nota a una sesión suya ya registrada, hasta 280 caracteres, con Idempotency-Key, solo agrega (hasta 20 por sesión). **API-TRN-25-LISTA** `GET /advisees/{adviseeId}/training/execution-notes`: el profesional de Entrenamiento lee las de las sesiones de sus planes, por período (hasta 92 días). **API-TRN-25-PROPIA** `GET /me/training/executions/{executionId}/notes`: la persona lee las suyas. API-TRN-18 no cambia | `entrenamiento/notas-de-la-sesion.service.ts` y `.controller.ts` | TEST-PG-014 |
| PG-15 · website | En Registros de Entrenamiento, la fila dice «Con nota» (un rótulo, sin color de alarma ni contador) y el detalle de la sesión muestra «Lo que contó la persona al terminar», con su hora. Se lee aparte, con el mismo período: si falla, las sesiones se ven igual | `training/ejecuciones.tsx` | TEST-PG-014 |
| PG-15 · APK | «¿Algo para contarle a tu profe?» en la pantalla de la sesión ya registrada (la que abre «Finalizar», con «Sesión registrada» arriba, y la de cada sesión de «Tu historial»): tres frases a un toque y un campo corto. Se manda aparte, con su clave; «Le contaste a tu profe» solo con la respuesta; si falla, «No se mandó» con «Reintentar» y la sesión sigue registrada. Finalizar no cambia | `nota-para-tu-profe.ts`, `pantallas/nota-para-tu-profe.tsx`, `pantallas/entrenamiento.tsx` | TEST-PG-014 |
| PG-16 · API | Familia propia **NPP**: **API-NPP-01** `POST /advisees/{adviseeId}/professional-notes` (hasta 1000 caracteres, sin ancla o atada a un ejercicio del catálogo o a una comida por su nombre), **API-NPP-02** `GET` de la misma ruta (las propias, activas y archivadas, hasta 200) y **API-NPP-03** `POST /professional-notes/{noteId}/archive`. Solo el autor, mientras acompaña a la persona en algún área; el ancla pide su área. Cada ancla dice si hoy está en el plan (`inPlan`) | `notas-propias/` (servicio, controlador, ejecutor y módulo); `entrenamiento/catalogo.service.ts` (`ejercicioCitable`) | TEST-PG-015 |
| PG-16 · website | «Tus notas» en el Resumen de la ficha, después de las notas del equipo, en las tres disposiciones: qué son, escribir, la lista con su fecha y su ancla («Del ejercicio X, que ya no está en el plan»), «Archivar» y «Archivadas (n)» plegado. En los dos editores (DL-167), una sola lectura por editor: las notas al lado de cada ejercicio y cada comida, con el candado de «solo vos», y «Anotar sobre este ejercicio» o «… esta comida» en su menú, con el cuadro enfocado | `seguimiento/tus-notas.tsx`, `notas-propias.tsx`, `training/ejercicio-del-editor.tsx`, `nutrition/comida-del-editor.tsx`, los dos `plan.tsx` | TEST-PG-015 |
| La base | Una migración que solo agrega un tipo y tres tablas (`nota_de_ejecucion`, `nota_propia` y `archivo_de_nota_propia`), de solo agregar (trigger), con sus guardias: la nota de una sesión es de la persona que la registró; el ancla es coherente con su tipo; una nota propia la archiva su autor, una sola vez | `prisma/migrations/20261114120000_notas_de_la_sesion_y_propias` | TEST-PG-014 y 015 |
| La exportación | Suma `notasPropiasDeSusProfesionales` (siempre, con el autor, el ancla y si se archivó; PG-D11) y `entrenamiento.notasParaSuProfesional` | `derechos/exportacion.ts` | TEST-PG-015 |
| El contrato | Las seis operaciones en `openapi.ts`, el OpenAPI al día y el cliente compartido. La guardia de trazabilidad declara la familia NPP con DL-173, y API-TRN-25 como un ID nuevo de la familia TRN del 09 (que llega a API-TRN-24), con sus sufijos LISTA y PROPIA | `packages/domain`, `scripts/trazabilidad-de-operaciones.test.cjs` | TEST-CT |

**Oráculos.** TEST-PG-014 y TEST-PG-015 viven en cuatro lugares: la parte pura en `packages/domain/src/notas-propias.test.ts`;
la de la APK en `apps/mobile/src/nota-para-tu-profe.test.ts`; la del website en `apps/web/test/pulido-grandes.test.mjs`; y la
de la API, contra PostgreSQL, en `test/integration/notas-pulido-grandes.int-spec.ts` (permiso, idempotencia, el largo, que
solo agrega, el autor, archivar, sin vínculo, el ancla y la exportación). TEST-PG-019 suma los archivos nuevos a
`scripts/copy-pantallas.test.cjs`, con todas las listas.

| Oráculo | Mutación | Resultado |
|---|---|---|
| TEST-PG-014 (dominio) | Las notas de una sesión, de la más nueva a la más vieja | rojo |
| TEST-PG-014 (APK) | Mandar la nota dentro de `finalizar()` | rojo |
| TEST-PG-014 (APK) | Dar por enviada una nota sin respuesta del servidor | rojo |
| TEST-PG-014 (APK) | Tratar el 404 (sin acceso) como reintentable | rojo |
| TEST-PG-014 (APK) | Las frases en el orden en que se tocaron | rojo |
| TEST-PG-015 (dominio) | Comparar las comidas sin sacar las tildes | rojo |
| TEST-PG-015 (dominio) | Una archivada al lado de su ejercicio | rojo |
| TEST-PG-015 (dominio) | «Sobre…» cuando el ejercicio ya no está en el plan | rojo |
| TEST-PG-015 (website) | Sacar «Tus notas» de una disposición del Resumen | rojo |
| TEST-PG-015 (website) | Leer las notas en cada ejercicio | rojo |

Las mutaciones de la API (dejar leer las notas de las sesiones a otra área, filtrar las notas propias por la persona y no
por el autor, dejar que el profesional del plan escriba por la persona, borrar al archivar) quedaron **descritas en la
prueba y sin correr**: piden la base de la CI. Las de la APK se corrieron sobre el módulo transpilado, con las mismas
comprobaciones de su prueba.

**Decisiones del continuador, a ratificar:**
- **PG-T60 · Quién escribe la nota para el profe y con qué permiso:** solo la persona de la sesión, con el permiso con
  que corrige su registro (el PDP del par con su profesional). El profesional del plan la lee y no escribe por ella (el
  mismo 404 que lo ajeno). *Alternativa:* solo con el A3 de la persona; quedaría guardada aunque el profesional ya no la
  pueda leer.
- **PG-T61 · Hasta 20 notas por sesión** (después, 422 VALIDATION_FAILED con NOTE_LIMIT_REACHED), contadas con la
  ejecución tomada. *Alternativa:* sin tope.
- **PG-T62 · Las frases a un toque se suman al texto**, en el orden de la lista y cada una con su punto; la API guarda
  solo el texto. *Alternativa:* guardarlas aparte, como datos; se podrían contar, y eso es calificar.
- **PG-T63 · Dónde se escribe en la APK:** en la pantalla de la sesión ya registrada, a la que lleva «Finalizar», y no en
  el cuadro de «Finalizar». Así la nota nunca está en el camino de confirmar, y sirve también desde «Tu historial».
  *Alternativa:* el renglón en el cuadro de «Finalizar», mandado después de confirmar.
- **PG-T64 · API-TRN-25-PROPIA:** la persona ve lo que le mandó a su profe, con su A3, como «Tu historial». No estaba en
  §4.2. *Alternativa:* sin lectura; lo enviado se vería solo mientras la pantalla está abierta.
- **PG-T65 · API-TRN-25-LISTA por período**, el mismo de Registros (hasta 92 días): una lectura para todas las sesiones
  a la vista. *Alternativa:* una lectura por sesión, al abrir su detalle.
- **PG-T66 · Lo que ve el profesional:** «Con nota» en la fila y el texto con su hora en el detalle de la sesión; sin
  aviso, sin novedad y sin contador.
- **PG-T67 · El ancla de una nota propia:** un ejercicio del catálogo (no su versión), que aparece en cualquier sesión y
  versión del plan; una comida por su nombre, sin tildes ni mayúsculas, que aparece en cada día tipo con ese nombre.
  *Alternativa:* el identificador de la comida en una versión; se pierde en otro día tipo y al copiar.
- **PG-T68 · «Que ya no está»:** se mira contra la última versión del plan del autor con esa persona en esa área (la que
  prepara o, si no hay, la vigente). Sin plan de esa área, no se dice.
- **PG-T69 · API-NPP-02 trae hasta 200 notas**, archivadas incluidas, sin páginas (`page.hasMore` dice si quedaron más).
  *Alternativa:* paginar.
- **PG-T70 · Archivar dos veces responde lo mismo**, sin error; en esta vuelta no hay «desarchivar».
- **PG-T71 · El permiso de una nota sin ancla:** alguna área con la persona (la primera que el PDP permite: Entrenamiento,
  Nutrición, Antropometría), decidida y registrada para que el reintento vuelva a decidir; con ancla, la del ancla.
- **PG-T72 · La exportación:** `notasPropiasDeSusProfesionales` va siempre (son datos sobre la persona, PG-D11) y
  `entrenamiento.notasParaSuProfesional`, con Entrenamiento.
- **PG-T73 · «Ocultar nombres»:** el texto de las notas propias se oculta hasta «Mostrar en esta pantalla»: la pantalla
  se está mostrando a otros. Las notas de la persona en Registros se ven como el resto del detalle (como el motivo que
  escribe la persona). *Alternativa:* mostrarlas igual, como las notas de coordinación.

**Lo que falta para cerrar la parte de las notas:**
1. Probarlo en el teléfono: la nota al terminar una sesión, con TalkBack (las frases dicen si están elegidas) y la letra
   ×1,3; sin señal, «No se mandó» y «Reintentar».
2. La mirada en pantalla del website (Azul noche y Claro, 360 y 1440 px): el bloc, las notas al lado, el cuadro y «Con
   nota» en Registros, con el lector de pantalla.
3. Correr las mutaciones de la API con la base de la CI.
4. `WP-PULIDO-GRANDES-ORACULOS.md` con los trece campos: en modo liviano, como la tanda A, los oráculos quedaron en las
   pruebas, con su mutación.
5. Congelar lo que la APK empieza a leer y a escribir (API-TRN-25 y API-TRN-25-PROPIA) con la candidata que la lleve
   (DL-152): lo hace quien la publica. Si esta rama entra antes de cortar la 0.28, la 0.28 ya trae la nota; si no, va en
   la 0.29, como dice §3.
6. La ventana de redespliegue de la API: la migración solo agrega, y la API nueva sale con ella, en un solo cambio.
