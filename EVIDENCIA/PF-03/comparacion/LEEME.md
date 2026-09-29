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
| Identidad | Por `exerciseId` del catálogo, nunca por el nombre. Se distinguen dos cosas: la **sustitución de versión** que informa el contrato (`substituted`, se conserva y se muestra) y la **identidad** de lo registrado. La ejecución trae solo la versión registrada, y a qué ejercicio pertenece se sabe si esa versión aparece prescripta en alguna sesión registrada del período. Puede ser **el mismo ejercicio en otra versión**: se compara, con la misma diferencia en las dos vistas. Puede ser **otro ejercicio**: no se compara, y cada ejercicio conserva lo suyo. O puede **no saberse**: no se compara, y se dice que no se sabe, sin afirmar que es el mismo ni otro. Las dos vistas y los avisos usan la misma identidad, la de todo el período, aunque se filtre por versión del plan |
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
| Unitarias del dominio (`comparacion-de-entrenamiento.test.ts`, 34, con datos validados contra el esquema estricto) | Ver la lista siguiente | dominio **325/325** |
| Integración `comparacion-entrenamiento.int-spec.ts`, contra PostgreSQL y por los flujos reales | La lectura real de API-TRN-21 pasada por la misma lógica. Ver la lista siguiente | **12/12** |
| Regresión de integración: la nueva, entrenamiento, contexto de entrenamiento, PF-03, contrato y máquinas de WP-06 | | **170/170** (6 suites) |
| `npm test` (dominio, scripts de pantallas y contraste, API), typecheck, OpenAPI (sin cambios), legajo, `audit:prod` y build del website | | sin fallas |

**Unitarias del dominio (34):**
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
- por la revisión enfocada: la serie inexistente, la declaración que no cubre lo no planificado, el filtro por versión, otra versión del mismo ejercicio y la diferencia respecto de la carga sugerida;
- por el cierre (identidad): la contradicción reproducida, con las dos vistas; la identidad desconocida; otro ejercicio conocido; una propiedad que recorre todo el período y exige la misma diferencia en las dos vistas; y las series y variables que solo tiene el registro de otro ejercicio o de uno sin identificar.

**Integración (12):** el período sintético del encabezado de la prueba, en un solo día y por los flujos reales:
- la pirámide y el caso de aceptación; la serie salteada y la adicional; la corrección con su original;
- el ejercicio sin registro, la sesión no realizada y el resumen; rangos, %RM y unidades;
- cinco sesiones el mismo día, de dos versiones; la sustitución;
- **autorización y privacidad:**
  - el borrador abierto no aparece;
  - otro profesional de entrenamiento vinculado al mismo asesorado no ve estas ejecuciones;
  - otro alcance, un asesorado ajeno y el propio asesorado reciben el mismo 404;
  - el período de más de 92 días es PERIOD_TOO_LONG;
  - con el B2 revocado, 404;
- **identidad del ejercicio** (el cierre): una versión 2 del ejercicio, escrita como la dejaría un cambio de catálogo. Mientras ninguna sesión del período la prescribe, la identidad es desconocida en las dos vistas. Cuando se registra una sesión que la prescribe, las dos vistas dan −1. Además, un caso con otro ejercicio conocido.

### Recorrido web local (49/49 controles, repetido en el cierre)

- **Entorno:** la API compilada, PostgreSQL 16 embebido, `next dev` y Chrome sin interfaz, el 2026-09-29.
- **Cómo:** el profesional entra como una persona y elige el período en el formulario.
- **Controles:** 46 en escritorio y móvil, y 3 de carga y error con la API detenida a propósito. Se repitió completo con el código del cierre, y las capturas `01` a `13` son de esa repetición.
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
| Sustitución por una versión que el período no identifica: las dos puntas, sin afirmar identidad ni calcular diferencia | ✅ |
| Filtro de versión: un ejercicio que está en otra versión del período lo dice así, no «no aparece en el período» | ✅ |
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
| 7 | Baja | Un rango 8-8 no se veía en el gráfico | Alto mínimo visible (`minPointSize`). Comprobado en el navegador en el cierre |
| 8 | Baja | En móvil, con las flechas, el punto elegido podía quedar fuera de la vista | El marco se desplaza hasta el punto. Control del recorrido |
| 9 | Baja | Con la vista no resoluble, el aviso decía «no se grafica» y lo planificado sí se dibujaba | «Lo registrado no se grafica» |

**Datos del recorrido, sintéticos y locales.** La API registra solo el día de hoy (DL-077/078), y para ver varias semanas cada sesión se preparó así:
- se registró hoy por los flujos reales de la APK (borrador, guardar, confirmar);
- después se llevó a su fecha pasada **en la base local del recorrido**;
- para eso se deshabilitó un instante la guardia de solo agregar de esas tablas.

Es preparación de datos, no un flujo del producto, y no se usó en ningún ambiente compartido. Las pruebas de integración no lo necesitan: arman su caso en un solo día, con la regla de la activación de una sucesora.

## Cierre de la tanda (segunda revisión de Dirección, 2026-09-29)

### 1 · Identidad del ejercicio, la misma en las dos vistas

**Reproducción sobre `f1d4003`.** Se prescribe la versión 1 de press de banca (8) y se registra la versión 2 del mismo ejercicio (7), y otra prescripción del período dice que la versión 2 es de press de banca. Resultado con el dominio de `f1d4003`:
- **evolución:** `planificado-y-registrado`, diferencia −1;
- **por serie:** `sustituido: true` y **ninguna diferencia**, con el aviso «Se registró otro ejercicio…»;
- es decir, **contradicción**.

Con la corrección, las dos vistas dan −1 y el aviso dice «las dos versiones son del mismo ejercicio del catálogo».

**Corrección** (`comparacion-de-entrenamiento.ts`, `comparacion.tsx` y `ejecuciones.tsx`):
- `sustituido` sigue siendo lo que informa el contrato;
- `identidad` es lo que se sabe, y sale de la identidad de las versiones de **todo el período** (`identidadDeVersiones`);
- la usan la evolución, la vista por serie (también cuando se abre desde la evolución), los avisos, los rótulos del eje, el panel de valores («Ejercicio registrado: …, otra versión del mismo ejercicio», «otro ejercicio» o «no se puede saber si es el mismo ejercicio») y las opciones del selector;
- la diferencia se calcula solo si se sabe que es el mismo ejercicio;
- sin identidad resuelta, se dice que no se sabe.

**Revisión adversarial** (13 agentes: tres lectores independientes, por consistencia, incertidumbre y contrato con pruebas, y un escéptico por hallazgo). Reportaron 10 hallazgos; **2 sobrevivieron a la refutación**, y quedaron corregidos:
- **media:** en la evolución, una serie que solo tiene el registro de otro ejercicio (o de uno sin identificar) se rotulaba «Adicional» de este ejercicio, y esas series y variables entraban en los selectores. Ahora cada observación aporta solo el lado que es del ejercicio;
- **baja:** con el filtro de versión, la evolución decía «no aparece en el período» de un ejercicio que está en otra versión. Ahora lo dice así.

Otros dos ajustes: el rótulo del eje por serie dice «otro ejercicio» o «sin identificar», como la evolución; y el panel de valores muestra la versión registrada.

**Pruebas:** 6 unitarias nuevas (dominio 325/325) y 1 de integración nueva (12/12). Lo visible, en el recorrido de densidad e identidad: los dos avisos **abiertos desde la evolución** (capturas `cierre/10` y `cierre/11`).

### 2 · Legibilidad del gráfico por serie con cantidades grandes

**Caso:**
- 20 series planificadas, el máximo del contrato para una prescripción, con exactas y rangos;
- series adicionales hasta la 50, el máximo de una ejecución, con numeración salteada: 47 series en total (7 y 13 planificadas sin registro; 25, 33 y 41 inexistentes);
- cargas que dan los rótulos más largos contra la sugerida («−12,5 kg sug.»);
- el rango 8-8.

Todo por los flujos reales, en una base local nueva.

**Antes de la corrección** (el código de `f1d4003` con la identidad del cierre): el riesgo **se confirmó**.
- En escritorio y en móvil se superponían números de serie, estados y valores (captura `cierre/01` y `cierre/02`).
- En móvil, la serie elegida con el teclado podía quedar fuera de la vista.

**Corrección:**
- cada grupo del eje tiene un ancho mínimo según sus rótulos y valores;
- si no entra, el gráfico se desplaza **dentro de su marco**, nunca la página, y una nota dice que hay más series a los costados y que la tabla tiene todas;
- el elegido con el teclado se trae a la vista;
- un estado largo se parte en dos líneas («−12,5 kg» y «sug.»), sin achicar la letra;
- lo mismo en la evolución.

Además, dos defectos de maquetación encontrados al medir:
- la figura del gráfico tenía el margen por defecto del navegador (40 px por lado);
- la columna de la lista de ejecuciones crecía con el contenido.

**Después: 55/55 controles**, en escritorio de 1280 px y en móvil de 390 px:
- una marca por serie real;
- sin superposición entre números, entre estados, entre valores, ni de valores con el eje;
- letra de 11 px o más, sin desplazamiento de la página;
- con 47 series, la nota; con 2, ni desplazamiento ni nota;
- Fin e Inicio con el teclado, a la vista; un toque o un clic sobre la barra 23 elige esa serie;
- la tabla con las 47;
- el **rango 8-8** visible por serie y en la evolución, con «en rango» y «−1 mín.» y la tabla con «8-8»;
- y los avisos de identidad.

Capturas: `cierre/03` a `cierre/09`.

### 3 · Integración combinada de las seis ramas

**La ejecución local anterior** de la suite completa sobre las seis ramas juntas quedó sin resultados: se interrumpió por falta de memoria. **No se cuenta como aprobada ni como falla**, y no se relanzó en las mismas condiciones.

**Esta vez se usó la CI existente**, con las mismas exigencias:
- la combinación de los commits finales se armó con `git merge-tree`, sin tocar `main`;
- se subió a una rama temporal `wp-tmp-combinada-tanda-2026-09-29`: el disparador `push` de `wp-*` corre los mismos cuatro trabajos que un PR;
- después se borró la rama. Sin PR, sin integrar y sin desplegar: Render despliega solo `main`.

| Qué | Commit |
|---|---|
| Base | `main` `065689b` |
| #115 comparación visual | `b3d4135` |
| #110 series pendientes | `f103e82` |
| #111 plantilla y alcance | `1311aef` |
| #112 concurrencia de citas | `3acb6b1` |
| #113 recuperación de formularios | `92f93bc` |
| #114 propuesta REV-A | `8ce2c63` |
| **Combinación** (seis merges, sin conflictos) | `0851a6a` |

**Resultado** (CI run 36599081528, 2026-09-29): **4/4 trabajos en verde**.
- verificar: typecheck, dominio **347/347**, scripts **31/31**, API **47/47**, build y audit;
- integración con PostgreSQL 16: **32/32 suites, 522/522 pruebas**;
- imagen de la API: migraciones y readiness;
- legajo.

Este registro se agregó en un commit posterior de solo evidencia. La combinación verificó el código de `b3d4135`.

## Límites y pendientes

- **DL-106 (abierta):** una serie que falta no se puede declarar como no realizada. Se muestra sin dato. La decisión queda para Dirección.
- **Eje horizontal ordinal:** ordena las sesiones pero no es proporcional al tiempo, y se dice en la pantalla. Así dos sesiones del mismo día no se superponen.
- **Gráficos anchos:** con muchas series o sesiones, el gráfico se desplaza dentro de su marco y el eje vertical se desplaza con él; una nota lo dice. La tabla y el panel de valores siguen completos.
- **Identidad de lo registrado:** la ejecución trae solo la versión registrada. Si esa versión no aparece prescripta en ninguna sesión del período, no se sabe a qué ejercicio pertenece, y la pantalla lo dice. Pasa con sustituciones comunes, por ejemplo press con mancuernas en lugar de press de banca. Resolverlo del todo necesitaría que la API informara el ejercicio de la versión registrada. Es un cambio de contrato, fuera de esta orden: queda como propuesta, sin decisión.
- **RIR planificado y carga sugerida:** son de la prescripción, no de cada serie, y la pantalla lo dice.
- **Vista vigente no resoluble:** no se puede producir por la API. Se prueba solo en las unitarias.
- **Filtro «Ejercicio» de Ejecuciones** (hallazgo fuera de la orden, severidad baja, corregido porque la evolución depende de él): antes filtraba por nombre y mezclaba dos ejercicios distintos con el mismo nombre. Ahora filtra por identidad.
- **No validado por Dirección, no desplegado.** TalkBack y la APK no se tocan.

**Próximos pasos posibles, como propuesta:**
- decidir DL-106;
- un eje proporcional al tiempo como opción;
- llevar la comparación al historial del asesorado en la APK, fuera de esta orden;
- exportar la tabla;
- que la API informe el ejercicio de la versión registrada, para resolver la identidad de toda sustitución.
