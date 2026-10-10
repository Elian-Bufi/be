# WP-ESCRITORIO-AMABLE · qué se comprobó en cada parte

> Definición: `docs/paquetes/WP-ESCRITORIO-AMABLE.md`. Referencia de diseño: `diseno/`. Este documento dice qué se
> comprobó, cómo y qué falta. Los estados van separados: **implementado**, **verificado automáticamente**, **observado
> en una captura real**, **solo en maqueta** y **pendiente de prueba manual**.

## Parte 0 · La base visual (2026-10-10)

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Las dos paletas medidas en los colores del website (C-11) | `node --test scripts/contraste.test.cjs`, **sin modificar la prueba**: mide los mismos pares que antes, en los dos temas, más el velo de la cara pública | 12 de 12 | Verificado automáticamente |
| Ningún color fuera de los tokens (íconos incluidos) | La misma prueba recorre todos los `.css`, `.ts` y `.tsx` del website | Pasa | Verificado automáticamente |
| La familia de íconos como datos del dominio (C-23, C-29, C-32, C-44, C-45) | `packages/domain/src/iconos.test.ts`: nombres únicos, formas dentro del lienzo, lo único lleno son puntos, ninguno califica | 4 de 4 | Verificado automáticamente |
| Toda la batería que corre la CI | `npm test` en la raíz | Dominio 594 de 594; scripts 301 de 301; API 80 de 80 | Verificado automáticamente |
| El website compila con el componente `Icono` | Typecheck y compilación estática (`entorno.sh compilar-web`) | 23 rutas generadas, sin errores | Verificado automáticamente |
| Ninguna página se rompió ni cambió de alto | `herramientas/paginas.mjs`: las 28 páginas, en Claro y en Azul noche, a 1440 × 900, antes y después | Las 28 con el mismo alto que antes; ningún error de página | Observado en una captura real |
| El ícono se ve en el website real, en los dos temas (C-47: decorativo junto a su palabra) | El sol y la luna junto a «Apariencia», en el encabezado de todas las páginas | Se ve en las 56 capturas | Observado en una captura real |
| La portada: lema legible y los íconos de la familia (E-08) | Captura de la portada en Claro, antes y después | El lema pasó de 1,4:1 a 5,3:1 sobre el fondo | Observado en una captura real; el par nuevo lo mide la prueba de contraste (enlace sobre fondo y sobre el velo) |

**Capturas de esta parte** (`parte-0/`): la portada, el Resumen de la ficha y la toma en preparación de Antropometría,
antes y después, en los dos temas. `alturas-antes.json` y `alturas-despues.json` tienen el alto de las 28 páginas.

**Lo que esta parte no comprueba:**

- Los recorridos con navegador (`recorrido.mjs`, `recorrido-comprension.mjs`) no se corrieron: la Parte 0 no cambia
  textos ni estructura de la ficha. Se corren desde la Parte 1, con su base propia.
- Axe no se corrió en esta parte: el contraste lo mide la prueba de tokens, y no se agregó ningún control.
- Lector de pantalla con una persona: pendiente, como en los paquetes anteriores.
- Los anchos de 1280, 1024, 768 y 390 px: las capturas de esta parte son a 1440. Los colores no dependen del ancho.

## Parte 1 · El marco de la ficha (2026-10-10)

Sobre una base propia (`be_test_escritorio`, generada el 2026-10-10 con `datos/regenerar-comprension.sh`) y la
compilación estática de este commit. Las bases de #153 y #154 no se tocaron.

**Medido en las capturas, a 1440 × 900:** el marco mide 143 px (también a 1280 y a 1024) y la primera tarjeta del
Resumen empieza a los 224 px; antes empezaba a los 305 (`parte-1/resumen-1440-claro-antes-y-ahora.png`).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| A cinco anchos (1440, 1280, 1024, 768 y 390) y en los dos temas: sin desborde de costado, con las tres vistas y el período | `recorrido.mjs capturas` | 60 de 60 | Verificado automáticamente |
| 20 pantallas de la ficha y sus pestañas: sin desborde, sin violaciones de axe, sin doble desplazamiento y sin errores | `recorrido-comprension.mjs mirar` | 20 de 20 | Verificado automáticamente |
| La ficha sigue funcionando: vistas, filtros, análisis, respuesta tardía, teclado, vista parcial, un tercero sin acceso | `recorrido.mjs funcional` | 70 de 70 | Verificado automáticamente |
| Primera pantalla, continuidad, evidencia de la revisión, etapas y accesibilidad | `recorrido-comprension.mjs capturas` y `funcional` | 79 de 79 y 75 de 75 | Verificado automáticamente |
| Al retirar un acceso, el marco deja de decir «Activo» para esa área sin recargar; las otras siguen | `recorrido-comprension.mjs revocacion` | 6 de 6 | Verificado automáticamente |
| Clases del dato y corte al revocar, con cuentas descartables | `recorrido.mjs descartable` | 17 de 17 (las 15 de antes y 2 nuevas) | Verificado automáticamente |
| Toda la batería de la CI | `npm run typecheck` y `npm test` | Dominio 594 de 594; scripts 301 de 301; API 80 de 80 | Verificado automáticamente |
| El período abierto: cuatro atajos y dos campos de fecha; Escape lo cierra y devuelve el foco al botón | `ficha.mjs` y la comprobación PRO-23 | Se ve en `parte-1/periodo-abierto-1440-*.png` | Observado en una captura real |
| Las tres vistas con el marco, a los cinco anchos | `ficha.mjs` | 20 capturas en `parte-1/` | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| PRO-23, 30 veces (`recorrido.mjs capturas`) | Contaba cinco botones de período a la vista | Abre el control y comprueba que hay un botón, cuatro atajos y dos campos de fecha, que el panel entra en la ventana y que Escape lo cierra | Que a cada ancho y en cada tema estén las vistas y el período, sin desborde |
| PRO-21 (`recorrido.mjs funcional`) | Clic en «7 días» y enseguida en «90 días» | Lo mismo, abriendo el control antes de cada clic | Que una respuesta lenta no pise a la que se eligió después |
| R3 (`recorrido-comprension.mjs funcional`) | «Solicitar contexto» en las acciones del Resumen | «Solicitar contexto» en el marco | Que el pedido de contexto tenga retorno a la ficha y que salir sin enviar no escriba nada |
| PRO-08 y PRO-10, píxeles de cada métrica | Al menos 100 píxeles del color de la métrica | 100, o 30 por marca en una serie de pocos puntos | Que cada gráfico esté dibujado de verdad con el color de su métrica, y no solo su título |
| PRO-10, dos nuevas | — | Con las series ocultas, la medición da 0 y 9 píxeles: no da por dibujado ningún gráfico | Que la medición anterior siga distinguiendo un gráfico dibujado de uno vacío (E-16) |

Ninguna comprobación negativa («la pantalla no dice…») cambió en esta parte.

**Lo que esta parte no comprueba:**

- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores.
- El uso real: falta que Dirección recorra la ficha. Una captura no muestra si algo cuesta encontrarlo.
- La ayuda única de cada vista (C-04): entra con cada vista, en las partes 2 a 4.
- El contenido de las tres vistas no cambió todavía: sigue siendo el de #154, con el marco nuevo arriba.

## Parte 1 bis · La barra de marca y las tarjetas de preguntas (2026-10-10)

Tres pedidos de Dirección al ver la Parte 1: la apariencia sumaba un renglón a la barra en una pantalla casi cuadrada;
una de las cuatro tarjetas de «Empezar por una pregunta» era más baja que las otras; y sacar de la barra el aviso
«Ambiente de prueba · solo datos sintéticos». Sobre la misma base propia (`be_test_escritorio`, regenerada antes de la
pasada) y la compilación estática de este commit.

**Medido en la página real:** la barra de marca mide 65 px a 1440, 65 a 1280, 65 a 1024 y 65 en la tablet de
pie (768): un solo renglón. Con la Parte 1 medía 103 px a 768, en dos renglones. En el teléfono (390 px) pasó de 121
a 102 px, de tres renglones a dos. El marco de la ficha no cambió (143 px en escritorio).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| La navegación del profesional con sus cuatro lugares y «Cuenta» en el botón de la esquina (E-17) | `recorrido.mjs funcional`, comprobaciones E-17 | Pasa | Verificado automáticamente |
| La barra en un solo renglón a 1440, 1280, 1024 y 768 px, con la navegación sin partir, el botón en la esquina, sin desborde y sin el aviso (E-17, E-19) | Lo mismo, midiendo la página a cada ancho | Pasa: 1440 → 65 px; 1280 → 65 px; 1024 → 65 px; 768 → 65 px | Verificado automáticamente |
| El aviso de ambiente de prueba no está en la barra y sigue en el pie de la cara pública (E-19) | Lo mismo, en «Iniciar sesión», al final del recorrido | Pasa | Verificado automáticamente |
| El menú se abre con el teclado; ofrece los datos de la cuenta, la apariencia (dos opciones, la elegida es la que se ve) y cerrar sesión; entra en la ventana | Lo mismo | Pasa | Verificado automáticamente |
| Elegir un tema lo aplica en el momento y lo guarda en el navegador, sin pedir nada a la API, sin salir de la ficha y sin cerrar el menú | Lo mismo: cuenta los pedidos a la API y compara la dirección | 0 pedidos | Verificado automáticamente |
| Escape cierra el menú y devuelve el foco a su botón; salir con Tab también lo cierra (E-21) | Lo mismo: cuatro Tab recorren el enlace, las opciones y el botón, y salen | Pasa | Verificado automáticamente |
| «Datos de la cuenta» abre la cuenta sin cerrar la sesión; ahí el menú ya no ofrece ese enlace | Lo mismo | Pasa | Verificado automáticamente |
| «Cerrar sesión» cierra la sesión en la API y lleva a «Iniciar sesión» con su aviso; la apariencia sigue después de la recarga (E-20) | Lo mismo: un solo `DELETE /auth/sessions/current` y, después, el token viejo recibe 401 | Pasa | Verificado automáticamente |
| Sin sesión, el botón dice «Apariencia» y abre solo las dos opciones | Lo mismo | Pasa | Verificado automáticamente |
| Accesibilidad con el menú abierto, en los dos temas | axe (WCAG 2.2 A y AA) dentro del mismo recorrido | Sin violaciones | Verificado automáticamente |
| Las cuatro tarjetas de «Empezar por una pregunta» miden lo mismo, en dos columnas, a 1440, 1280 y 1024 px (E-18) | `recorrido.mjs funcional`, comprobación E-18 | Pasa | Verificado automáticamente |
| Las dos mediciones nuevas detectan su defecto (E-22) | Con una hoja de estilos que deshace el arreglo, dentro del mismo recorrido | La navegación partida da 2 líneas y 101 px; las tarjetas sueltas dan dos altos (101 y 78 px) | Verificado automáticamente |
| La ficha sigue funcionando con la barra nueva (el tema se cambia ahora por el menú en todos los recorridos) | Los siete recorridos, sobre la compilación de 60155ce. Los cuatro de `recorrido-comprension.mjs` son de la pasada completa de las 15:46; los tres de `recorrido.mjs` se repitieron a las 16:11, con datos generados de nuevo, después de corregir la medición de píxeles (ver abajo) | `recorrido.mjs`: capturas 60 de 60, funcional 84 de 84 (las 70 de antes y 14 nuevas), descartable 17 de 17. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 79 de 79, funcional 75 de 75, revocación 6 de 6 | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código (60155ce, corrida 38077480368). En esta parte `npm test` no se corrió en la máquina: la CI lo corre sobre el commit exacto | En verde: legajo, verificar (typecheck y la batería completa), integración e imagen de la API | Verificado automáticamente |
| Contraste: ningún par ni mínimo cambió | `node --test scripts/contraste.test.cjs`. Los dos pares del color tenue del encabezado dicen ahora que miden el borde del botón de la cuenta (el aviso ya no existe); se siguen midiendo a 4,5:1 | 12 de 12 | Verificado automáticamente |
| El menú abierto en Claro y en Azul noche, en la tablet de pie y sin sesión | `ficha.mjs` | `parte-1b/menu-de-cuenta-*.png` y `sin-sesion-menu-*.png` | Observado en una captura real |
| La barra a los cinco anchos y las tarjetas iguales | `ficha.mjs` | 15 capturas de las tres vistas en `parte-1b/`; `barra-768-antes-y-ahora.png` y `tarjetas-antes-y-ahora.png` | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| El cambio de tema, en los cuatro guiones (`recorrido.mjs`, `recorrido-comprension.mjs`, `ficha.mjs`, `paginas.mjs`) | Elegía una opción de la lista desplegable de la barra | Abre el menú de la cuenta, marca la opción y lo cierra con el mismo botón, sin teclado y sin mover el foco | Que cada pantalla se compruebe y se capture en los dos temas |
| E-17, E-18 y E-19, 14 nuevas (`recorrido.mjs funcional`; solas, con `recorrido.mjs menu`) | — | La barra, el menú, el cierre de sesión, las tarjetas y el aviso en el pie, con dos pruebas de la prueba | Los tres pedidos de esta parte |
| PRO-08 y PRO-10, píxeles de cada métrica (`pintura`, en `recorrido.mjs`) | Contaba los píxeles del color de la métrica en todo el gráfico, textos incluidos | Los cuenta sin los textos del gráfico y sin la línea de lo planificado (E-23) | Que cada gráfico esté dibujado de verdad con el color de su métrica |

La única comprobación negativa de esta parte es nueva: «la barra no dice "Ambiente de prueba"» (E-19). Ninguna de las
anteriores cambió.

**Una falla en la primera pasada, y qué era.** En la pasada completa de las 15:46 pasaron seis recorridos y falló una
comprobación del séptimo (`recorrido.mjs descartable`, 16 de 17): la «prueba de la prueba» de los píxeles, en Azul
noche. Con las series ocultas, la medición contaba 126 píxeles «del color de la métrica» en el gráfico del peso (el
mínimo era 90): daba por dibujado un gráfico sin serie. No era un defecto de la pantalla sino del instrumento: contaba
los bordes suavizados de las letras de los ejes, cuyo color en Azul noche queda a un paso del de la primera métrica. Se
corrigió qué se mide (sin textos), no el mínimo ni la tolerancia, y se repitieron las tres pasadas que miden píxeles.
La pasada que falló no se guardó como evidencia de aprobación: queda contada acá.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección abra el menú y cambie de tema en su pantalla.
- La APK: no se tocó. Conserva su franja «Ambiente de prueba · solo datos sintéticos», y su prueba la exige.
- El teléfono (390 px): se miró en una captura, sin comprobaciones propias. El profesional trabaja en escritorio.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron el nombre y el
  estado del botón, el grupo «Apariencia» y axe.
- El retrato: el botón tiene el lugar, pero BE todavía no tiene imagen de perfil ni muestra el nombre de la cuenta en
  el menú (la sesión del website guarda solo el token).

## Parte 2, primer tramo · Analizar: el lenguaje del gráfico y la composición (2026-10-10)

Analizar se recompuso sin quitar ninguna función y sin cambiar ningún parámetro de la URL: una barra corta (la pregunta,
las métricas y los modos), los gráficos y la lectura; lo que se usa de vez en cuando, a un clic. Los gráficos dicen más
con menos: todas las marcas son puntos, el objetivo de calorías se dibuja junto a lo registrado y los días sin registros
se ven. Sobre la base propia (`be_test_escritorio`, regenerada antes de la pasada) y la compilación estática del
commit de código (780ca8d). Quedan para el tramo siguiente la entrada «¿Qué querés mirar?», los estados por gráfico, el origen en el lugar
de la lectura, la composición propia de las etapas y del ejercicio, y «Cómo se lee esta vista».

**Medido en la página real, a 1440 × 900 y con tres métricas (calorías, proteínas y peso, 90 días):** la vista pasó de
2.368 a 1.093 px de alto (`parte-2/analizar-antes-y-ahora.png`), y las fechas del tercer gráfico terminan a los
887 px: los tres entran en la primera pantalla. A 1280 × 900 terminan a los 900 px y a 1024 × 900, a
los 957 (la barra ocupa un renglón más): se informa, no se exige. En una ventana de 1366 × 768 terminan a los
887 px, 119 por debajo del borde: ahí el tercer gráfico no entra entero. La comparación de etapas, con la tabla de
datos que había quedado abierta de otro análisis, medía 5.733 px; mide 1.961.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| La barra, los gráficos y la lectura en ese orden, la lectura al costado y los tres gráficos con sus fechas en la primera pantalla (E-24) | `recorrido.mjs funcional`, comprobaciones E-24, midiendo la página; con su prueba de la prueba (una barra alta saca los gráficos de la pantalla y la medición lo dice) | Pasa | Verificado automáticamente |
| «Más acciones» cerrado al entrar; abierto, con las vistas guardadas, la descarga, las dos capas, el intervalo y la comparación; el botón dice su estado (E-25) | Lo mismo, E-25 | Pasa | Verificado automáticamente |
| El pie de los gráficos abre una cosa a la vez: abrir el resumen cierra la tabla (E-25) | Lo mismo | Pasa | Verificado automáticamente |
| Lo desplegado sigue al cambiar las métricas y se cierra al pasar por la entrada (E-38) | Lo mismo, E-38 | Pasa | Verificado automáticamente |
| Todas las marcas son puntos, cada gráfico con el color de su métrica (E-26) | Lo mismo, E-26: las formas que hay adentro de cada marca y de cada muestra | Pasa | Verificado automáticamente |
| En «Juntas», el nombre de cada métrica al final de su línea (E-26) | `recorrido.mjs funcional`, PRO-08 | Pasa | Verificado automáticamente |
| El objetivo de calorías, dibujado: un tramo discontinuo por cada escalón que devuelve la API; ninguno en proteínas (E-27) | E-27, contra `prescribed.energyRequirement` de la API, a mano | Pasa: dos tramos, 2.100 kcal desde el 18 jul 2026 y 1.950 desde el 5 sept 2026 | Verificado automáticamente |
| El objetivo en la lectura, en cada fila de la tabla y en el resumen en texto, con los valores de la API; sin diferencia ni porcentaje (E-27) | E-27, tres comprobaciones | Pasa: 80 filas de la tabla, ninguna distinta de lo esperado | Verificado automáticamente |
| Los días sin registros, en gris: las zonas que declara la API, sin el día en curso; el mismo sombreado con dos métricas de Nutrición en «Juntas»; por semana y en el peso, ninguno (E-28) | E-28, contra `recorded.gaps` de la API, a mano | Pasa: dos zonas, 10 días (del 13 al 18 jul y del 9 al 12 ago) | Verificado automáticamente |
| Las etapas en cada gráfico, con el rótulo arriba y una vez por área; sin rótulo para una etapa que no se ve (E-29) | E-29, dos comprobaciones, contra `planVersions` de la API | Pasa | Verificado automáticamente |
| Los cambios de protocolo del peso: numerados con su leyenda si hay varios, con el motivo escrito si hay uno (E-30) | E-30, dos comprobaciones, contra los tramos de la API | Pasa: el 31 ago y el 21 sept 2026 | Verificado automáticamente |
| Las líneas de los hitos, solo con su lista abierta (E-31) | E-31 | Pasa: 0 líneas con la lista cerrada, 11 por gráfico con la lista abierta | Verificado automáticamente |
| El encabezado de cada gráfico y las fechas una sola vez (E-32) | E-32 | Pasa | Verificado automáticamente |
| Los nombres de los modos y las mismas letras en la URL (E-33) | E-33 | Pasa | Verificado automáticamente |
| «Calorías» y no «Energía» en Analizar; un solo orden de las métricas de Nutrición (E-34) | E-34; en el dominio, `analisis-longitudinal.test.ts`; en la API, `analisis.int-spec.ts` (la etiqueta del registro en la línea de tiempo, ahora con comprobación positiva) | Pasa | Verificado automáticamente |
| La lectura de un día completo: su fecha, el valor de la API en grande, «Ver origen» con el nombre de la métrica (E-35) | E-35 | Pasa | Verificado automáticamente |
| La leyenda, solo con lo dibujado: en una semana completa no hay leyenda (E-36) | E-36 | Pasa | Verificado automáticamente |
| El aro de la fecha elegida se ve entero con 90 días a la vista (E-39) | E-39, con su prueba de la prueba (un aro recortado se detecta) | Pasa | Verificado automáticamente |
| Accesibilidad con «Más acciones» y la tabla abiertos, en los dos temas | axe (WCAG 2.2 A y AA), dentro del mismo recorrido | Sin violaciones | Verificado automáticamente |
| La ficha sigue funcionando con Analizar recompuesto | Los siete recorridos, sobre la compilación de este commit | `recorrido.mjs`: capturas 60 de 60, funcional 112 de 112 (las 84 de antes y 28 nuevas), descartable 17 de 17. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 79 de 79, funcional 76 de 76 (las 75 de antes y la prueba de la prueba de CP-12), revocación 6 de 6. Pasada del 2026-10-10, de 18:15 a 18:41 (`parte-2/resumen-de-la-pasada-final.txt`; empezó antes del commit, por eso su primer renglón dice c94a76c más 21 cambios sin confirmar: son los de 780ca8d) | Verificado automáticamente |
| Toda la batería de la CI | `npm test` en la raíz y, después, la CI de GitHub sobre el commit | La CI de GitHub sobre el commit de código (780ca8d, corrida 38087004854): en verde el legajo, la batería completa (typecheck, dominio, scripts y API), la integración y la imagen de la API, después de repetir un trabajo (ver abajo). En la máquina: los scripts, 301 de 301; la API, 81 de 81 con el arreglo | Verificado automáticamente |
| Contraste: ningún par ni mínimo cambió | `node --test scripts/contraste.test.cjs` | 12 de 12 | Verificado automáticamente |
| Analizar a los cinco anchos, en los dos temas; «Juntas» y «Cambio relativo»; «Más acciones» y la tabla abiertos; la pregunta del plan, la comparación de etapas y la entrada | `ficha.mjs` y `ver.mjs` | 21 capturas en `parte-2/` | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| E-24 a E-36, E-38 y E-39, 28 nuevas (`recorrido.mjs funcional`; solas, con `recorrido.mjs analizar`) | — | La composición y el lenguaje del gráfico, con lo esperado calculado a mano desde la API, y tres pruebas de la prueba | Las decisiones de este tramo |
| PRO-08, los modos (`recorrido.mjs funcional`) | Leía el texto del motivo adentro de cada opción («unidades distintas») | Lee que la opción está apagada, que referencia su aviso, y el motivo en el aviso del costado («"Juntas" pide métricas con la misma unidad») | Que un modo que no se puede usar esté apagado y diga por qué |
| PRO-07 y PRO-08, los títulos | «Energía registrada · por día (kcal)» | «Calorías registradas por día · kcal»; en «Juntas», «Proteínas y carbohidratos registrados por día · g» y el nombre al final de cada línea | Que cada gráfico diga qué métrica es, qué es cada punto y en qué unidad |
| PRO-10, PRO-19 y PRO-20; CP-11, CP-17, CP-23 y CP-26: las vistas guardadas, la descarga y el intervalo con fechas | Buscaban cada cosa a la vista | Abren antes «Más acciones» (`abrirMasAcciones`) | Lo mismo que antes: guardar y retomar una vista, descargar con el acceso actual, acercar con fechas |
| PRO-10 y CP-13: la tabla de datos | Abrían un plegable | La abren desde el pie de los gráficos (`abrirDelPie`) | Que la tabla diga lo mismo que el gráfico |
| PRO-05, PRO-10, PRO-20 y PRO-26; CP-21 y CP-23: el origen | Botón «Ver el origen de este dato» | Botón «Ver origen», con el nombre de la métrica para el lector de pantalla | Que cada valor lleve a su registro original |
| D-31 (`recorrido-comprension.mjs`), con la pregunta de etapas | El resumen en texto, plegado, y la lista de etapas, ausentes del cuerpo | El resumen en texto es un enlace del pie, sin abrir; la lista de etapas no se ofrece ahí | Que la tabla A/B sea lo principal y nada se repita |
| CP-12, el punto elegido | El aro, dibujado debajo de la marca, adentro de su grupo | El aro rodea la marca desde su propia capa: mismo centro, radio mayor, sin relleno; con su prueba de la prueba | Que elegir un punto no tape la forma que dice la clase del dato |

Las comprobaciones negativas que cambiaron con su texto: «Analizar no dice "Energía"» (E-34, nueva) y, en la prueba de
integración de la API (`analisis.int-spec.ts`, que corre en la CI), «un registro sin cantidades no lleva la etiqueta
"Calorías registradas"»: antes negaba «Energía registrada», y ahora afirma además que un registro con cantidades sí la
lleva, con su valor en kcal (si no, la ausencia pasaría también por un nombre mal escrito). Las demás no cambiaron.

**Lo que encontraron las comprobaciones nuevas, y qué se hizo.** La primera vez que corrieron (25 de 27) fallaron
dos. Una encontró un defecto de la pantalla: agrupando por semana, el encabezado mostraba la muestra gris de «sin
registros» aunque el gráfico semanal no sombrea nada; se corrigió la pantalla (la muestra acompaña a la cuenta solo
donde hay sombreado), no la comprobación. La otra era un defecto del instrumento: contaba las fechas del eje adentro
del grupo del eje, y la biblioteca de gráficos las escribe en una capa aparte; se corrigió qué se mide, y de paso la
medición de la primera pantalla, que por lo mismo daba 873 px en lugar de 887. En una pasada suelta de
`recorrido-comprension.mjs funcional`, antes de la pasada final, el recorrido 4 se detuvo (74 de 75): dos pasos que
retoman una vista guardada buscaban el plegable a la vista y ahora está en «Más acciones»; se actualizaron esos dos
pasos (E-06). La pasada final, completa y con datos generados de nuevo, es la de la tabla.

**La CI del commit de código (780ca8d).** El primer intento falló en una prueba unitaria de la API que no es de este
paquete (`rutas-firmadas.spec.ts`, las rutas firmadas de las fotos de comida). No era un cambio de este tramo: esa
prueba fallaba sola una de cada 16 veces. Altera el último carácter de una firma y espera que deje de valer, pero el
último carácter lleva bits de relleno, y cuando la firma terminaba en «A» el texto alterado decodificaba a los mismos
bytes y la API lo aceptaba. Se repitió el trabajo que había fallado y la corrida quedó en verde (38087004854). El
arreglo va en un commit aparte (9569086): la API acepta la firma solo escrita como la emitió, con una prueba que lo comprueba
siempre (antes del arreglo falla; después, 81 de 81). No se cambió la prueba que fallaba.

**Lo que este tramo no comprueba:**

- El uso real: falta que Dirección recorra Analizar. Una captura no muestra si algo cuesta encontrarlo.
- Pantallas bajas: en una ventana de 768 px de alto (una portátil de 1366 × 768) entran dos gráficos y parte del
  tercero. La barra de marca, el marco de la ficha y la barra de Analizar suman 390 px antes del primer gráfico. La
  primera pantalla se exige a 1440 × 900; la pantalla de Dirección es de 1920 × 1080 (`analizar-metricas-1920-entera-claro.png`).
- La exportación (CSV) no lleva el objetivo de calorías: su formato es del dominio y tiene sus pruebas. Anotado en E-27.
- El objetivo de los macronutrientes y el plan de entrenamiento como número: no llegan en la lectura de series (§6).
- La pestaña Nutrición y «Mis recetas» todavía dicen «Energía» (segundo paquete).
- El teléfono (390 px) y la tablet de pie (768): se miraron en capturas; las comprobaciones nuevas son a 1440 px.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, los nombres
  de los controles nuevos (`aria-expanded`, `aria-controls`, el grupo de cada segmentado) y la descripción del gráfico.

## Parte 2, segundo tramo · Analizar: la entrada, el estado de cada métrica y la ayuda de la vista (2026-10-10)

Tres cosas que el primer tramo había dejado como estaban. La entrada de Analizar muestra ahora los dos caminos a la
vez: una pregunta, o las métricas que se elijan. Lo que una métrica no puede mostrar todavía (está cargando, falló, no
hay acceso o no hay nada en esas fechas) se dice en el lugar de su gráfico. Y la vista tiene una sola ayuda, «Cómo se
lee esta vista», en el marco de la ficha. Sobre la base propia (`be_test_escritorio`, regenerada antes de la pasada) y
la compilación estática del commit de código (af7f984).

**Medido en la página real, a 1440 × 900:** en la entrada, «Ver los gráficos» termina a los 860 px: los dos
caminos y el botón entran en la primera pantalla. El marco de la ficha sigue midiendo 143 px a 1440, 1280 y 1024 px con
el botón de la ayuda adentro (a 1024, con su ícono solo: 44 px de ancho).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| La entrada se llama «¿Qué querés mirar?» y tiene los dos caminos a la vista: las cuatro preguntas (y «Más preguntas») con las vistas guardadas debajo, y al costado las métricas, sin ningún gráfico todavía (E-41) | `recorrido.mjs funcional`, comprobaciones E-41 | Pasa | Verificado automáticamente |
| Las métricas se ofrecen por área con lo que la API dice que hay: las seis de Nutrición en su orden, las cuatro de Entrenamiento con el ejercicio más registrado a la vista, y las cuatro medidas con más tomas (E-41, E-43) | Lo mismo, contra la lista de ejercicios y de medidas de la API, a mano | Pasa: 7 ejercicios (el más registrado, Peso muerto, con 14 sesiones) y 11 medidas corporales | Verificado automáticamente |
| Con tres marcadas, las demás casillas se apagan y el pie dice cuáles son y por qué; al sacar una se vuelven a poder marcar; una de Entrenamiento se nombra con su ejercicio, su serie y su unidad (E-42, E-43) | Lo mismo, E-42 | Pasa: «Elegiste 3 de 3: Proteínas; Calorías; Carga · Peso muerto · serie 1 (kg). Para sumar otra, sacá una.» | Verificado automáticamente |
| «Ver los gráficos» arma la comparación libre en el orden en que se marcaron, y recién ahí escribe las métricas en la URL (E-41) | Lo mismo | Pasa | Verificado automáticamente |
| Quitar la última métrica de una comparación libre vuelve a la entrada, con nada marcado (E-41) | Lo mismo | Pasa | Verificado automáticamente |
| Una vista guardada se retoma desde la entrada, en una sesión nueva, y abre «Más acciones» con su aviso (E-44) | `recorrido.mjs funcional`, PRO-19 | Pasa | Verificado automáticamente |
| Al asesorado con vista parcial, la entrada le ofrece solo las áreas permitidas | `recorrido.mjs funcional`, PRO-20 | Pasa | Verificado automáticamente |
| Las cuatro filas de preguntas miden lo mismo a 1440, 1280 y 1024 px (E-18) | `recorrido.mjs funcional`, E-18, con su prueba de la prueba a 1024 px | Pasa | Verificado automáticamente |
| Si falla una de tres métricas, su bloque queda entre los dos gráficos, con su nombre, «No pudimos completar esta parte», el motivo y «Reintentar», que trae el gráfico que faltaba (E-45) | E-45, con un 503 simulado en el navegador para una sola serie | Pasa | Verificado automáticamente |
| Mientras una métrica tarda, las otras dos ya están dibujadas y la que falta dice «Cargando…» en su lugar (E-45) | E-45, demorando 3,5 s una sola respuesta | Pasa | Verificado automáticamente |
| En fechas sin registros ni tomas, cada métrica dice «no es un cero» en su lugar, sin gráfico vacío, sin «Reintentar» y sin presentarlo como una falla; la lectura dice para qué sirve (E-46) | E-46, en un rango anterior al primer registro y a la primera toma que devuelve la API | Pasa | Verificado automáticamente |
| La API, para una medida sin tomas en el período, responde `NO_DATA` sin serie, y la respuesta cumple el contrato (E-46) | `test/integration/analisis.int-spec.ts`, en la CI: antes del arreglo, el `parse` del contrato fallaba | En verde (corrida 38091948121): el legajo, la batería completa, la integración y la imagen de la API | Verificado automáticamente |
| «Cómo se lee esta vista» está en el marco de Analizar sin hacerlo crecer; en el Resumen todavía no está (E-47) | E-47, midiendo el marco a los tres anchos | Pasa: 143 px en los tres | Verificado automáticamente |
| La ayuda se abre como un diálogo con su título, toma el foco, explica cada marca con su muestra, y Escape la cierra y devuelve el foco al botón; axe no encuentra faltas con ella abierta (E-47) | E-47 | Pasa: 11 renglones, 10 muestras | Verificado automáticamente |
| La ficha sigue funcionando | Los siete recorridos, sobre la compilación del commit de código | `recorrido.mjs`: capturas 60 de 60, funcional 122 de 122 (las 112 del primer tramo y 10 nuevas), descartable 17 de 17. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 79 de 79, funcional 76 de 76 (en la repetición: ver abajo), revocación 6 de 6. Pasada del 2026-10-10, de 19:52 a 20:19, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10) | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código (af7f984) | En verde (corrida 38091948121): el legajo, la batería completa, la integración y la imagen de la API | Verificado automáticamente |
| Contraste: ningún par ni mínimo cambió | `node --test scripts/contraste.test.cjs` | 12 de 12 | Verificado automáticamente |
| La entrada a 1440, 1024 y 768 px y en los dos temas; con tres métricas marcadas; la ayuda abierta; una falla, y fechas sin nada, en el lugar de sus gráficos | `ver.mjs` (que ahora puede simular una falla y tocar una casilla) | 11 capturas en `parte-2b/` | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| E-41, E-42 y E-45 a E-47, 10 nuevas (`recorrido.mjs funcional`; solas, con `recorrido.mjs analizar`) | — | La entrada, los estados en su lugar y la ayuda, con lo esperado calculado a mano desde la API y con una falla y una demora simuladas | Las decisiones de este tramo |
| PRO-20, las áreas del asesorado con vista parcial | Abría «Análisis personalizado» y leía el desplegable de áreas | Lee los títulos de los grupos de métricas de la entrada | Que no se ofrezca un área que el profesional no puede ver |
| PRO-19, retomar una vista en una sesión nueva | Abría el plegable de vistas guardadas de la entrada | Toca la etiqueta de la vista en «Retomar una vista guardada» | Que una vista guardada se pueda retomar sin armar antes un análisis, y vuelva a pedir los datos |
| E-18, las preguntas del mismo tamaño | Cuatro tarjetas iguales, en dos columnas | Cuatro filas iguales, una debajo de otra; la prueba de la prueba se hace a 1024 px, donde las bajadas ocupan distinta cantidad de renglones | El pedido de Dirección del 10/10: que ninguna quede más baja que las otras |
| R6 (`recorrido-comprension.mjs`), el «Reintentar» de una serie que falló | Lo buscaba adentro del renglón de error | Lo busca en el bloque de estado de esa métrica | Que reintentar una serie traiga también lo demás que falló |

Ninguna comprobación negativa cambió de texto. Las nuevas («no hay ningún gráfico», «no dice "No pudimos"», «en el
Resumen no está el botón») miran con el mismo selector que una positiva de la misma función.

**Lo que encontraron las comprobaciones, y qué se hizo.**

- **Un defecto de la API, que ya estaba** (E-46). La comprobación de las fechas sin nada falló la primera vez: el
  peso seguía diciendo «No pudimos completar esta parte». La API respondía 200, pero con una serie sin unidad, que no
  cumple su contrato; el cliente rechazaba la respuesta entera y la pantalla la mostraba como una falla, con un
  «Reintentar» que nunca iba a servir. Se corrigió en la API (no arma una serie sin datos) y en el website (un estado
  propio para «respondió bien y no hay nada»). Los indicadores del Resumen y la tabla de etapas usan la misma lectura y
  reciben el mismo estado; ahí el error no se vio en pantalla (los indicadores por defecto se arman con lo que hay en
  el período), así que queda cubierto por el código, sin una comprobación propia.
- **Un píxel** (E-18). Con las preguntas en filas, la primera medía un píxel más que las otras tres: el separador era
  un borde, que le sacaba ese píxel al botón de las filas siguientes. Se corrigió la pantalla (el separador es una
  sombra, que no ocupa lugar), no la comprobación.
- **Un defecto del instrumento.** La comprobación final («ninguna respuesta con error») contaba el 503 que el propio
  recorrido había simulado. Ahora aparta las respuestas simuladas, y exige que sean las que simuló.
- **La primera pasada completa se detuvo antes de empezar,** en la regeneración de los datos. El verificador de los
  datos de prueba pedía tres medidas y leía sus series por posición; la tercera (el pliegue del bíceps, con su única
  medición anulada) antes llegaba como una serie vacía y, con el arreglo de la API, ya no llega. Se corrigió el
  verificador (busca cada serie por su medida y comprueba que la anulada no arme serie ni figure entre las medidas con
  observaciones: 26 de 26) y se dejó dicho en el comentario del contrato (8bfaf33). La pasada de la tabla es la segunda,
  completa.
- **En esa pasada completa, `recorrido-comprension.mjs funcional` dio 71 de 73,** con dos fallas en la evidencia de la
  revisión de Nutrición, una pantalla que este paquete no toca. Era una carrera del recorrido, que ya existía. Esa
  pantalla se arma en dos lecturas (primero las revisiones, después la evidencia del período desde la última) y,
  mientras tanto, muestra los últimos 7 días. Con la máquina cargada (en ese momento corría además un agente leyendo el
  repositorio), el recorrido la leyó a mitad de camino: encontró 7 días y 24 comidas en lugar de 21 días y 65, y la
  parte se cortó. Abierta a mano un minuto después, la pantalla decía lo correcto. Se corrigió la espera del recorrido
  (ahora espera a que la pantalla diga el período preparado y a que la evidencia sea la de ese período) y se repitió
  esa pasada, sobre los mismos datos: 76 de 76. La pasada que falló no se toma como aprobación: queda contada acá y en
  `parte-2b/resumen-de-la-pasada-final.txt`. Queda anotado para el paquete de las pestañas de área: quien abre
  «Preparar la revisión» ve por un instante el período por defecto antes del preparado.

**Lo que este tramo no comprueba:**

- El uso real: falta que Dirección entre a Analizar y elija qué mirar.
- El bloque de «sin acceso» se comprueba por su texto en otros recorridos (PRO-20 y CP-23), sin captura en este tramo.
  El de «sin especificación» no tiene comprobación ni captura: hoy ninguna métrica que se ofrece cae ahí.
- La ayuda de Resumen y de Línea de tiempo: entra con cada vista (partes 3 y 4).
- La composición propia de la comparación de etapas, del progreso de un ejercicio y del origen del dato: siguen como
  en el primer tramo.
- La entrada a 390 px: se ve una tarjeta debajo de la otra; sin comprobaciones propias.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, el nombre de
  cada grupo de casillas, el pie que anuncia lo elegido (`aria-live`) y el diálogo de la ayuda.

## Lo que falta de la parte 2, y las partes 3 a 5

Pendientes.
