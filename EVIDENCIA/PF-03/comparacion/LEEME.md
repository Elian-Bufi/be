# Evidencia · Planificado y registrado: comparación visual en el website profesional

Orden de Dirección del 2026-09-29 (objetivo 2 de la tanda). Amplía «la comparación legible entre lo planificado y lo registrado» que decidió [DL-105](../../../docs/DEUDA_LEGAJO.md) (PF03-D-1, opción A).

- **Rama:** `feat/comparacion-planificado-registrado`, sobre `main` (`065689b`).
- **Estado:** para auditoría, **sin integrar, sin desplegar y sin APK**.
- **Dependencias:** ninguna con los otros PR abiertos (#110 a #114). No usa `seriesPendientes` del #110: compara por número de serie con su propia lógica.

## Qué puede hacer el profesional

En **Entrenamiento → Ejecuciones**:

1. **Ver la evolución de un ejercicio.**
   - Elige el período (hasta 92 días) y el ejercicio: un punto por cada sesión registrada en la que aparece.
   - Elige la **serie** (1, 2, 3…) y la **variable**: repeticiones, carga en kg, carga en lb o RIR.
   - Lo planificado y lo registrado son **dos capas** que se prenden y apagan por separado.
   - Tocando, haciendo clic o recorriendo con las flechas, ve los valores exactos de cada sesión, y desde ahí **abre esa ejecución**.
2. **Comparar una ejecución serie por serie.** Al abrirla, ve barras agrupadas por el **número real de cada serie**: lo planificado rayado al lado de lo registrado lleno, con la diferencia debajo («−1», «igual», «en rango»). Elige la serie y ve:
   - carga, repeticiones, RIR y esfuerzo percibido;
   - la nota de la serie y el criterio de la prescripción;
   - de dónde sale el dato: el registro original, o la corrección vigente con su autor, su fecha, su motivo y el valor original.
3. **Una tabla equivalente** debajo de cada gráfico, con los mismos valores y el motivo de cada dato que falta.

## Qué no cambia

- **Contrato, API, base, OpenAPI y APK: nada.** No se agrega ninguna lectura.
- **De dónde salen los datos:** el gráfico usa la misma lectura que ya usaba Ejecuciones, **API-TRN-21** (contexto de revisión, UC-P18). Tiene reglas propias del profesional:
  - la decide el PDP en cada lectura;
  - trae solo las ejecuciones registradas de los planes **de este profesional**;
  - lo ajeno, otro alcance o el B2 revocado dan el mismo 404 neutral;
  - el período tiene un tope de 92 días.
- **No se copian** las reglas del historial propio del asesorado (API-TRN-19-LISTA, DL-096).

## Cómo se lee

Toda la lógica está en el dominio (`packages/domain/src/comparacion-de-entrenamiento.ts`). El gráfico, la tabla y el panel de valores se dibujan con lo mismo, así no pueden decir cosas distintas.

| Tema | Regla |
|---|---|
| Unidad de observación de la evolución | **Una prescripción de una ejecución registrada** en la que aparece el ejercicio. Dos ejecuciones el mismo día son dos puntos («17/9 (1)» y «17/9 (2)»; «1 de 2 del día» en la tabla). El eje horizontal ordena las sesiones: no es proporcional al tiempo, y se dice |
| Series | Se compara la serie del **número elegido**. Nunca se promedian, suman ni se toma la máxima |
| Emparejamiento | Por **número real** (`setIndex`). Un número planificado sin registro queda **sin dato**. Uno registrado que la prescripción no tiene es **adicional**, sin prescripción inventada. No se renumera. En la evolución, una sesión que no tiene la serie elegida ni planificada ni registrada dice «La prescripción no tiene esta serie, y no se registró»: no es adicional ni «no realizada» |
| Prescripción histórica | Cada ejecución se compara con la **instantánea de la versión que rigió** (REG-06-105), no con la vigente. El 3 × 8 viejo no se compara con la pirámide nueva |
| Rangos | «6-8» se dibuja como franja y se compara como rango: «dentro del rango», «−1 del mínimo», «+2 del máximo». Nunca se convierte en 7 |
| Carga | La **carga sugerida** es de la prescripción y se marca «(sugerida)»: no es una obligación, y la diferencia se dice **respecto de la sugerida** («5 kg menos que la carga sugerida», «−5 kg sug.» en el eje). El **%RM no se convierte a kg**: no hay base registrada. **kg y lb son variables separadas**: una sesión en la otra unidad queda «otra unidad», sin convertir |
| RIR | El planificado es el objetivo de la prescripción (rige para todas sus series), y se dice |
| Correcciones | Rige el **registro vigente** (`registroVigente`). La serie cambiada se marca «Corregida» y el valor original queda a la vista. Una vista vigente no resoluble no se grafica, y se dice |
| Identidad | Por `exerciseId` del catálogo, nunca por el nombre: dos ejercicios con el mismo nombre se listan por separado. El realizado en una sustitución se identifica por su versión, con todo el período como referencia, aunque se filtre por versión del plan. Otra versión del mismo ejercicio no se toma como otro ejercicio. En la evolución del planificado se ve «se registró otro ejercicio». En la del realizado, «se planificó otro ejercicio». Nunca se calcula la diferencia entre ejercicios distintos |
| Líneas | Lo registrado se une solo entre sesiones seguidas **con valor**. Lo planificado se une solo entre ocurrencias de **la misma prescripción de la misma versión**: se corta cuando cambia la versión o la sesión. Un rango es franja, no línea |
| Datos que faltan | Ver la tabla siguiente |

**Datos que faltan** (lo que pidió Dirección, regla por regla):

| Caso | Cómo se muestra |
|---|---|
| Registro confirmado | Su valor. Si un campo no se registró: «Sin dato: carga no registrada», nunca 0 |
| «No realizada» | Solo si la sesión se registró como `NOT_COMPLETED`, que es la **única declaración de omisión que existe**, y solo para lo que estaba planificado |
| Sin registro | «Sin dato», con su motivo: la serie no está en el registro, el ejercicio no está, se registró un resumen, se registró otro ejercicio, o la vista vigente no se puede resolver. Nunca 0 |
| Borradores | No llegan: API-TRN-21 trae solo lo registrado (09v10:980). El recorrido lo comprueba con un borrador abierto |
| Serie adicional | «Adicional: sin prescripción para esta serie», distinta de una prescripción en cero, que el contrato no admite |
| Sesión futura | No aparece: solo hay puntos de sesiones registradas, y ninguna ausencia se cuenta como faltante |
| «Realizada» | No prueba cada serie: una serie planificada que falta en una sesión «realizada» es sin dato |
| Declarar una serie como no realizada | **No lo permite el contrato.** Se muestra como sin dato y la extensión queda registrada como **DL-106**, sin agregar un flujo de declaración |

No hay porcentajes de adherencia, puntajes ni rótulos de mejor o peor. La diferencia es un dato («−1»), no una calificación. La prueba T13 de copy (TEST-PRJ-009) cubre también la pantalla nueva y el copy del dominio.

## Tecnología: Recharts

- **Punto de partida:** no había una biblioteca de gráficos. La evolución de antropometría es una tabla a propósito.
- **Evaluación de Recharts 3.10.1:**
  - licencia MIT, declara compatibilidad con React 16.8 a 19;
  - última estable del 2026-07-25, con versiones de prueba en septiembre de 2026;
  - agrega 38 paquetes, todos MIT o ISC;
  - `npm audit --omit=dev` del website: **0 vulnerabilidades**.
- **Peso:**
  - Recharts se **carga cuando hace falta**: al elegir un ejercicio o al abrir una ejecución;
  - la página de Entrenamiento pesa 21 kB, con 293 kB de carga inicial;
  - cargado de entrada, pesaba 142 kB y 414 kB.
- **Ajustes para cumplir B10-10 §11:**
  - **Colores:** salen de los tokens, con tres nuevos (`--grafico-planificado`, `--grafico-registrado` y `--grafico-hueco`). La prueba de contraste suma cinco pares, todos de 3:1 o más.
  - **Teclado:** la capa de accesibilidad de Recharts está desactivada: da `role="application"` y sus flechas mueven un recuadro flotante sin elegir nada. El marco del gráfico es un grupo enfocable. Las flechas, Inicio y Fin eligen la serie o la sesión, y Enter abre la ejecución.
  - **Clic y toque:** cada barra, punto, franja y rótulo del eje elige lo suyo. El clic del gráfico entero leía el índice que había dejado el último movimiento del puntero, y un toque elegía otro punto. Después de un clic, el foco vuelve al marco, así las flechas siguen desde ahí.
  - **Foco:** Recharts deja sus capas con `tabindex="-1"`, y un toque dibujaba el contorno de foco del navegador. Se oculta, porque esas capas no se alcanzan con el teclado.
  - **Recuadro flotante:** aparece solo con un puntero que pasa por encima. En una pantalla táctil quedaba fijo sobre el gráfico, y el panel de valores ya dice lo mismo.

## Pruebas

| Prueba | Qué cubre | Resultado |
|---|---|---|
| Unitarias del dominio (`comparacion-de-entrenamiento.test.ts`, 28, con datos validados contra el esquema estricto) | Ver la lista siguiente | dominio **319/319** |
| Integración `comparacion-entrenamiento.int-spec.ts`, contra PostgreSQL y por los flujos reales | La lectura real de API-TRN-21 pasada por la misma lógica. Ver la lista siguiente | **11/11** |
| Regresión de integración: la nueva, entrenamiento, contexto de entrenamiento, PF-03, contrato y máquinas de WP-06 | | **170/170** (6 suites) |
| `npm test` (dominio, scripts de pantallas y contraste, API), typecheck, OpenAPI (sin cambios), legajo, `audit:prod` y build del website | | sin fallas |

**Unitarias del dominio (28):**
- el caso de aceptación (10/8/6 contra 10/8/5, la serie 3 da −1);
- números salteados y serie adicional;
- ausencia ≠ cero, en cada motivo;
- «no realizada» solo declarada;
- rangos, series sin fijar, carga sugerida, %RM y RIR;
- kg y lb;
- correcciones, incluida una que cambia la condición;
- vista no resoluble y sustitución;
- identidad y homónimos;
- varias sesiones el mismo día y prescripción histórica;
- líneas que no cruzan lo desconocido ni otra prescripción;
- serie ausente en una observación;
- rótulo del eje y copy sin términos prohibidos;
- por la revisión enfocada: la serie inexistente, la declaración que no cubre lo no planificado, el filtro por versión, otra versión del mismo ejercicio y la diferencia respecto de la carga sugerida.

**Integración (11):** el período sintético del encabezado de la prueba, en un solo día y por los flujos reales:
- la pirámide y el caso de aceptación; la serie salteada y la adicional; la corrección con su original;
- el ejercicio sin registro, la sesión no realizada y el resumen; rangos, %RM y unidades;
- cinco sesiones el mismo día, de dos versiones; la sustitución;
- **autorización y privacidad:**
  - el borrador abierto no aparece;
  - otro profesional de entrenamiento vinculado al mismo asesorado no ve estas ejecuciones;
  - otro alcance, un asesorado ajeno y el propio asesorado reciben el mismo 404;
  - el período de más de 92 días es PERIOD_TOO_LONG;
  - con el B2 revocado, 404.

### Recorrido web local (48/48 controles)

- **Entorno:** la API compilada, PostgreSQL 16 embebido, `next dev` y Chrome sin interfaz, el 2026-09-29.
- **Cómo:** el profesional entra como una persona y elige el período en el formulario.
- **Controles:** 45 en escritorio y móvil, y 3 de carga y error con la API detenida a propósito. Se repitió completo después de las correcciones de la revisión, y las capturas son de esa repetición.
- **No es el ambiente `test` desplegado.**

| Control | Resultado |
|---|---|
| Sin ejercicio elegido, la sección lo pide; el selector ofrece los ejercicios por identidad, incluido el realizado por sustitución | ✅ |
| Una fila por sesión registrada del período (12), y ninguna de hoy: el borrador abierto no aparece | ✅ |
| **Gráfico = tabla:** un círculo por cada valor registrado, un cuadrado por cada valor planificado, una franja por cada rango, una franja rayada por cada sesión sin valor, y la descripción accesible nombra los mismos valores | ✅ (5 controles) |
| Ausencia ≠ cero: «no realizada» solo en la sesión declarada; resumen y sustitución sin dato; ningún 0 | ✅ |
| Dos sesiones el mismo día: dos puntos, «(1)» y «(2)» en el eje y «1 de 2» y «2 de 2» en la tabla | ✅ |
| Cambio de versión marcado; cada sesión con su prescripción (8 en la v1, 10 en la v2) | ✅ |
| Variables separadas por unidad; la sesión en libras queda «otra unidad» en kg; la carga planificada dice «(sugerida)»; el eje dice su unidad | ✅ (4 controles) |
| **Serie 3: la pirámide 10/8/6 registrada 10/8/5 da −1**, en la tabla y en el eje; la serie salteada es «sin dato» | ✅ (3 controles) |
| Capas: con Registrado apagado no quedan puntos ni franjas de hueco, y la tabla sigue; con las dos apagadas, el gráfico lo dice | ✅ |
| Teclado: Inicio y flechas eligen la sesión y muestran sus valores exactos con la fuente; Enter abre la ejecución y el foco llega a su detalle | ✅ (3 controles) |
| Por serie: el eje dice «Serie 3 · −1»; elegir la serie 3 muestra carga, RIR y la diferencia en palabras; un clic sobre la tercera barra elige la serie 3 | ✅ (3 controles) |
| Números reales: «Serie 3 · sin dato» y «Serie 4 · adicional», sin renumerar ni inventar prescripción | ✅ |
| Corrección: rige 7, marcada «Corregida», con el original (8) a la vista | ✅ |
| Sustitución: las dos puntas, sin diferencia | ✅ |
| Puntero: el recuadro aparece al pasar; el clic elige esa sesión; después, la flecha sigue desde ahí | ✅ (3 controles) |
| Sentadilla en kg: «75 % RM (…)», sin convertir | ✅ |
| **axe-core** (WCAG 2.2 A y AA), con la evolución y una ejecución abiertas: cero violaciones críticas o serias | ✅ |
| Período con una sola sesión: dice que todavía no hay evolución y sugiere ampliar; período sin sesiones: estado vacío | ✅ |
| Abrir una ejecución y cambiar el período ida y vuelta no la vuelve a abrir sola; un ejercicio que no está en el período nuevo deja de filtrar («Todos» y la lista completa) | ✅ (2 controles) |
| Móvil (390 px): la página no se desplaza en horizontal (el gráfico sí, dentro de su marco); tocar un punto elige esa sesión; con las flechas, el punto elegido se trae a la vista; sin recuadro flotante | ✅ (4 controles) |
| Sin errores de consola ni de página, en escritorio y en móvil | ✅ |
| Carga y error: «Cargando…»; sin la API, «Reintentar» sin gráfico viejo; el formulario del período sigue a mano (B10-10:376) | ✅ (3 controles) |

**Capturas** (en esta carpeta):
- `01` a `04`: evolución (repeticiones, kg, serie 3 con el −1 y la capa Registrado apagada);
- `05`: valores elegidos con el teclado;
- `06` a `08`: ejecución por serie (pirámide, salteada y adicional, corregida);
- `09` a `11`: móvil;
- `12`: una sola sesión;
- `13`: error con «Reintentar».

### Revisión enfocada

Una revisión de solo lectura del código nuevo, con un revisor, sin auditoría masiva, encontró **nueve defectos**: cuatro de severidad media y cinco baja. **Todos quedaron corregidos**, en el commit que sigue al del desarrollo:

| # | Severidad | Defecto | Corrección y prueba |
|---|---|---|---|
| 1 | Media | En la evolución, una sesión sin la serie elegida (ni planificada ni registrada) decía «Adicional», y en una sesión «no realizada» decía «no realizada» de una serie que no existía | Estado propio «La prescripción no tiene esta serie, y no se registró»; la declaración cubre solo lo planificado. 2 unitarias |
| 2 | Media | Filtrar por versión del plan cambiaba a qué ejercicio se atribuía una sustitución | La identidad sale de todo el período. 1 unitaria |
| 3 | Media | Un ejercicio elegido que no estaba en el período nuevo seguía filtrando | Vuelve a «Todos». Control del recorrido |
| 5 | Media | La diferencia contra la carga sugerida se decía «que lo planificado», como una obligación | Se dice «respecto de la sugerida». 1 unitaria |
| 4 | Baja | El pedido de abrir una ejecución quedaba guardado y la volvía a abrir sola | Se atiende una vez y se descarta al cambiar período o filtros. Control del recorrido |
| 6 | Baja | Otra versión del mismo ejercicio contaba como otro ejercicio; «homónimos» afirmaba que eran distintos | Mismo ejercicio si la versión es del mismo; el aviso dice que no se pueden identificar como el mismo. 1 unitaria |
| 7 | Baja | Un rango 8-8 no se veía en el gráfico | Alto mínimo visible (`minPointSize`). Sin dato así en el recorrido |
| 8 | Baja | En móvil, con las flechas, el punto elegido podía quedar fuera de la vista | El marco se desplaza hasta el punto. Control del recorrido |
| 9 | Baja | Con la vista no resoluble, el aviso decía «no se grafica» y lo planificado sí se dibujaba | «Lo registrado no se grafica» |

**Datos del recorrido, sintéticos y locales.** La API registra solo el día de hoy (DL-077/078), y para ver varias semanas cada sesión se preparó así:
- se registró hoy por los flujos reales de la APK (borrador, guardar, confirmar);
- después se llevó a su fecha pasada **en la base local del recorrido**;
- para eso se deshabilitó un instante la guardia de solo agregar de esas tablas.

Es preparación de datos, no un flujo del producto, y no se usó en ningún ambiente compartido. Las pruebas de integración no lo necesitan: arman su caso en un solo día, con la regla de la activación de una sucesora.

## Límites y pendientes

- **DL-106 (abierta):** una serie que falta no se puede declarar como no realizada. Se muestra sin dato. La decisión queda para Dirección.
- **Eje horizontal ordinal:** ordena las sesiones pero no es proporcional al tiempo, y se dice en la pantalla. Así dos sesiones del mismo día no se superponen.
- **Móvil:** la evolución larga se desplaza en horizontal dentro de su marco, y el eje vertical se desplaza con ella. La tabla y el panel de valores siguen completos.
- **RIR planificado y carga sugerida:** son de la prescripción, no de cada serie, y la pantalla lo dice.
- **Vista vigente no resoluble:** no se puede producir por la API. Se prueba solo en las unitarias.
- **Rango de mínimo igual al máximo (8-8):** se dibuja con un alto mínimo. No hubo un dato así en el recorrido, así que no se comprobó en el navegador.
- **Filtro «Ejercicio» de Ejecuciones** (hallazgo fuera de la orden, severidad baja, corregido porque la evolución depende de él): antes filtraba por nombre y mezclaba dos ejercicios distintos con el mismo nombre. Ahora filtra por identidad.
- **No validado por Dirección, no desplegado.** TalkBack y la APK no se tocan.

**Próximos pasos posibles, como propuesta:**
- decidir DL-106;
- un eje proporcional al tiempo como opción;
- llevar la comparación al historial del asesorado en la APK, fuera de esta orden;
- exportar la tabla.
