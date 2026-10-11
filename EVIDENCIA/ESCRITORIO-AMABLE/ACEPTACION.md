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

## Parte 3 · Resumen: una tarjeta por área (2026-10-10)

El Resumen estaba ordenado por tipo de información: una tabla con el objetivo y el plan de las tres áreas, una lista con
los hechos de las tres mezclados, las acciones aparte, los indicadores y, al final, lo registrado en el período y los
últimos hechos. Para saber cómo estaba Nutrición había que mirar tres bloques. Ahora está ordenado **por área**: una
tarjeta por área con lo suyo junto (con qué se trabaja, lo pendiente, lo nuevo desde su última revisión y la acción) y,
debajo, los indicadores, cada uno con su gráfico chico y su cobertura. No se quitó ninguna función. Sobre la base propia
(`be_test_escritorio`, regenerada antes de la pasada) y la compilación estática del commit de código (e9844c7).

**Medido en la página real,** con el asesorado A y 90 días:

| Ventana | Antes | Ahora |
|---|---|---|
| 1440 px de ancho, alto de la página | 2.130 px (2,4 pantallas) | 1.213 px (1,3 pantallas) |
| 1440 × 900, sin desplazarse | La tabla, dos de los nueve hechos y dos botones de «Acciones»; los indicadores empezaban cerca de los 1.250 px | Las tres tarjetas enteras (terminan en 744) y el nombre y el valor de los cuatro indicadores (857). La regla de cada indicador termina en 879; los minigráficos, en 945; la cobertura, en 1.045; las preguntas, en 1.111 |
| 1920 × 950 (la pantalla de Dirección, estimada: 1080 menos la barra del navegador) | — | Las tarjetas (744), los valores (857), las reglas (879) y los minigráficos, justos (945). La cobertura de cada indicador termina en 1.045: pide desplazarse |
| 1280 × 900 | — | Las tarjetas (813). Los valores de los indicadores quedan en 947: piden desplazarse |
| 1366 × 768 | — | Las tarjetas terminan en 813: no entran enteras |

Con dos áreas (el asesorado B), la página pasó de 1.709 a 1.010 px; con una sola (el escenario E), de 1.598 a
900: entra entera.

El «antes» se capturó el mismo día, con el marco de la parte 1, sobre los datos que había dejado una pasada anterior de
los recorridos (con una revisión de Entrenamiento registrada ese día). La imagen `parte-3/resumen-antes-y-ahora.png`
compara las dos versiones **con esos mismos datos:** 2.130 y 1.185 px. Las medidas de la tabla y las demás capturas son
sobre datos recién generados, donde la tarjeta de Entrenamiento tiene un renglón más (1.213 px).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Una tarjeta por área, en el orden de BE, cada una con su título, «Abrir …» con retorno, su contexto y su acción; después, los indicadores y las preguntas; nada de la tabla, la lista ni «Acciones» de antes (E-49) | `recorrido.mjs funcional` (solas: `recorrido.mjs resumen`), E-49 | Pasa | Verificado automáticamente |
| A 1440 × 900 entran, sin desplazarse, las tres tarjetas con su acción y el nombre y el valor de los cuatro indicadores (E-55) | E-55, midiendo la página con los datos recién generados; con su prueba de la prueba (un contexto alto saca los indicadores de la primera pantalla y la medición lo detecta) | Pasa: tarjetas hasta 744 px, valores hasta 857 | Verificado automáticamente |
| La tira del objetivo dice las calorías del resumen de la ficha y los tres macros del objetivo efectivo, en el orden de la APK (E-59) | E-59, contra API-DSH-03 y API-NUT-06, a mano | Pasa: Calorías 1.950 kcal · Carbohidratos 220 g · Grasas 65 g · Proteínas 130 g | Verificado automáticamente |
| Si la lectura de los macros falla, quedan las calorías, se dice que no se pudieron cargar (no que falten) y «Reintentar» los trae (E-59) | E-59, con un 503 simulado en el navegador | Pasa | Verificado automáticamente |
| Cada hecho es un renglón que dice su área y su alcance (también para el lector de pantalla) y abre su evidencia; la última toma no se repite como hecho (E-51, E-52) | E-51 | Pasa: 8 hechos en las tres tarjetas | Verificado automáticamente |
| Lo pendiente va primero en su tarjeta y se reconoce por su ícono y su peso, no por un color (E-51) | E-51, midiendo la posición, el ícono y el peso de la letra | Pasa: tres pendientes, con ícono y peso 650; las cuentas, sin ícono y con peso 400 | Verificado automáticamente |
| Cada área dice su propio corte: la fecha de su última revisión y si ya se aplicó; Antropometría, que no tiene revisiones, mira el período (E-51) | E-51, contra el resumen de la ficha | Pasa: «Desde la revisión del 20 sept · aplicada» y «Desde la revisión del 1 oct» | Verificado automáticamente |
| La próxima revisión acordada está en su tarjeta una sola vez: como pendiente si falta una semana o menos; si no, junto al corte (E-56) | E-56, contra el resumen de la ficha | Pasa: Nutrición, pendiente («el 13 oct (en 3 días)»); Entrenamiento, «Próxima: sin fecha acordada» | Verificado automáticamente |
| La cobertura del período queda plegada en la tarjeta de un área con revisión; abierta, dice los días y los registros de la API, los anulados, los rectificados y las comidas diferentes, y que en Entrenamiento no hay «sesiones esperadas» (E-51) | E-51, contra la proyección de registros y los conteos de la línea de tiempo | Pasa: «80 de 90 días con algún registro · 283 registros: 276 con cantidades y 7 sin cantidades · 4 comidas diferentes… · 2 anulados… · 3 rectificados…» | Verificado automáticamente |
| «Cargado otro día» va al pie, con el número de la API y un enlace a esos hechos (E-51) | E-51 | Pasa: 31 hechos | Verificado automáticamente |
| Un solo botón lleno: el del área con la próxima revisión acordada más cercana; los demás, con contorno; cada uno lleva a su formulario con retorno (E-56) | E-56, contra las fechas del resumen de la ficha | Pasa: lleno, el de Nutrición (13 oct) | Verificado automáticamente |
| Las cuatro preguntas principales, con las palabras del dominio; cada una arma Analizar desde cero (E-60) | E-60 | Pasa | Verificado automáticamente |
| Los indicadores por defecto y su valor, calculado a mano desde la API con la regla de cada uno (E-53) | E-53: la media de los días con valor, la mediana de las sesiones y la última toma, sin usar el dominio | Pasa: 1.211 kcal por día · 83,9 g por día · 83,8 kg · 79,8 kg | Verificado automáticamente |
| Cada indicador dice su cobertura con las palabras del dominio; la carga, su última sesión; el peso, la clase de su última toma (E-53) | E-53 | Pasa: «90 días: 79 con valor · de ellos, 7 son subtotales (falta algún dato) · 10 sin registros · hoy, en curso: fuera de la media» | Verificado automáticamente |
| El nombre de cada indicador abre su gráfico en Analizar, con su métrica (E-64) | E-64 | Pasa | Verificado automáticamente |
| Cada minigráfico dibuja lo mismo que su serie de la API: los puntos, los huecos, los tramos y el gris de los días sin registros, con dos marcas que encierran los valores (E-54) | E-54, contando en el dibujo y en la respuesta de la API | Pasa: en calorías, 80 puntos, 8 huecos, 2 tramos y 2 zonas grises; marcas «2.000» y «0» | Verificado automáticamente |
| El inicio del primer plan del período se marca y se dice solo cuando empezó adentro (E-54) | E-54, contra las vigencias de la API | Pasa: «El plan rige desde el 19 jul» en los tres que se registran contra un plan; no en el peso | Verificado automáticamente |
| El minigráfico es un dibujo propio, sin foco, con su descripción; el Resumen no dibuja nada de la biblioteca (E-54) | E-54 | Pasa: 4 propios, 0 de la biblioteca | Verificado automáticamente |
| La ficha se abre y muestra el Resumen sin haber cargado la biblioteca de gráficos (E-54) | E-54: los guiones que pidió la página, contra los archivos de la compilación que contienen la biblioteca; con su prueba de la prueba (al abrir Analizar, la misma medición la detecta) | Pasa: 29 guiones, ninguno con la biblioteca | Verificado automáticamente |
| «Actualizar» vuelve a leer todo lo que el Resumen muestra (E-58) | E-58: las lecturas que salen después del clic, contra la lista de lo que la vista muestra | Pasa: 14 lecturas | Verificado automáticamente |
| La ayuda del Resumen se abre por el principio, con el foco en el título; axe no encuentra faltas con ella abierta; Escape la cierra (E-62) | E-62 | Pasa: 13 renglones, 13 muestras | Verificado automáticamente |
| «De dónde sale» cada hecho está en la ayuda, una vez por regla, y ningún renglón lo repite (E-62) | E-62 | Pasa: las 7 reglas en pantalla tienen su fuente | Verificado automáticamente |
| A 1440 y 1280, tres áreas y cuatro indicadores por fila; a 1024, dos áreas y la tercera debajo; a 768 y 390, sin desborde (E-63) | E-63, midiendo la posición de cada caja | Pasa | Verificado automáticamente |
| Con dos áreas, las preguntas van en la columna libre y no se ofrece la del ejercicio; con una, los indicadores y las preguntas van al costado de la tarjeta (E-60, E-63) | E-63, con el asesorado B y con el escenario E | Pasa | Verificado automáticamente |
| Sin faltas de accesibilidad, con la cobertura abierta, en los dos temas | axe (WCAG 2.2 A y AA) | Pasa | Verificado automáticamente |
| Las partes de un hecho dicen las mismas palabras que su frase (E-50) | `packages/domain`: la prueba nueva recorre seis variantes de datos y comprueba que cada parte está en la frase y que no sobra nada | 595 de 595 (594 + 1) | Verificado automáticamente |
| La geometría del minigráfico (E-54) | `scripts/geometria-del-minigrafico.test.mjs`, en la batería | 6 de 6 | Verificado automáticamente |
| La ficha sigue funcionando | Los siete recorridos, sobre la compilación del commit de código | `recorrido.mjs`: capturas 60 de 60, funcional 154 de 154 (las 122 de antes y 32 nuevas), descartable 17 de 17. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80 (las 79 de antes y una nueva), funcional 76 de 76, revocación 6 de 6. Segunda pasada del 2026-10-10, de 22:34 a 22:58, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). La primera, de 22:06 a 22:31, no pasó entera: ver abajo | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código (e9844c7) | En verde (corrida 38103643766): el legajo, la batería completa, la integración y la imagen de la API | Verificado automáticamente |
| Contraste: ningún par ni mínimo cambió | `node --test scripts/contraste.test.cjs` | 12 de 12 | Verificado automáticamente |
| El Resumen a 1920, 1440, 1280, 1024 y 768 px y en los dos temas; con dos áreas y con una; la cobertura abierta; la ayuda; el editor de indicadores; una falla en su tarjeta y los macros sin cargar | `ver.mjs` | 18 imágenes en `parte-3/`: 15 capturas, la primera pantalla a 1440 × 900 y a 1920 × 950, y antes y ahora | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| E-49 a E-64, con la de accesibilidad (PRO-22) y la de errores (PRO-25) del Resumen: 32 nuevas (29 comprobaciones y 3 mediciones), en `recorrido.mjs funcional`; solas, con `recorrido.mjs resumen` | — | El Resumen por área, con lo esperado calculado a mano desde la API | Las decisiones de esta parte |
| PRO-02, los cuatro indicadores | kcal, registros, kg con «Última toma» y series | kcal por día, g por día, kg con «Mediana de las sesiones» y kg con «Última toma», cada uno con su regla y su cobertura | Que los indicadores digan unidad, regla, fecha y cobertura. Cambiaron los de por defecto (E-53) |
| PRO-11 y PRO-15 | Leían el primer y el tercer indicador | Leen el primero (calorías) y el cuarto (peso) | Que la media no cuente el día en curso, y que el peso compare solo dentro de su tramo |
| PRO-12, la cobertura por área | Leía la sección «Qué se registró en el período» («80 días de 90…») | Abre la cobertura plegada de la tarjeta de Nutrición y lee la frase del dominio («80 de 90 días…»); «sin porcentajes» se mira sobre todo el Resumen | Que la cobertura diga su denominador y que el Resumen no dé porcentajes |
| PRO-02, «Lo último que pasó» | Contaba seis hechos en el Resumen | Cuenta al menos seis hechos en la pestaña «Línea de tiempo», a un clic | Que los últimos hechos del período estén a mano |
| PRO-21, al cambiar de asesorado con una respuesta lenta | Negaba los ejercicios del anterior en los indicadores | Lo mismo, y además: B tiene indicadores y tarjetas propios, y no tiene tarjeta de Entrenamiento | Que nada del asesorado anterior aparezca en el nuevo. La negativa ahora va con sus positivas |
| PRO-21, sin red | Negaba «No hay datos de ninguna área», un texto de Analizar | Niega los «sin datos» del Resumen y pide que las tarjetas digan qué parte no se pudo completar | Que una falla no se presente como ausencia de datos ni como un cero |
| E-47, dónde aparece la ayuda | «En el Resumen todavía no está» | «En la Línea de tiempo, que todavía no tiene la suya, no está» | Que el botón aparezca solo donde hay ayuda |
| `mirar`, `resumen-todas` | Tocaba «Ver todas» | Abre lo plegado de cada tarjeta; si no hay nada que abrir, falla | La síntesis entera: sin desborde, sin faltas de axe, sin doble desplazamiento |
| CP-27, la revisión de Nutrición (una nueva) | Si no encontraba el enlace «Preparar la revisión de Nutrición», la pantalla salía de la lista y sus seis comprobaciones dejaban de correr sin fallar | Que el enlace esté se comprueba | Que la pantalla de la revisión se capture siempre |
| CP-01, el orden del Resumen | Los títulos «Objetivo y planificación» y «Para tu próxima revisión», en ese orden, y ningún gráfico | La persona; por área, el objetivo y los hechos, antes que los indicadores; las tarjetas no dibujan nada, no hay ningún gráfico de la biblioteca, y los minigráficos están solo en los indicadores | Que lo pendiente se lea sin tener que explorar un gráfico |
| CP-01, el primer hecho sin desplazarse (tres comprobaciones) | La primera observación de la lista | El primer hecho de la primera tarjeta | Lo mismo |
| GUIA-II.1, a 1280 × 800 | La primera fila de la tabla | El contexto de la primera tarjeta | Que el objetivo y el plan empiecen en la primera pantalla |
| CP-02, cada hecho con su contexto | Área y alcance, el hecho, «Sale de…» y una acción en cada observación | Área y alcance, el hecho y el enlace en cada renglón; la fuente de cada regla, en la ayuda | Que cada hecho se pueda rastrear y profundizar |
| CP-02, la síntesis entera | «Ver todas (N)» coincidía con las observaciones mostradas | Lo que había a la vista más lo que anuncia cada plegado son todos los hechos | Que se diga cuántos hay y se muestren todos |
| CP-03, un corte por área | El alcance de cada observación, con la fecha con año | El alcance de cada hecho y la línea del corte de cada tarjeta, con la fecha como la escribe el Resumen (E-57) | Que cada área tenga su propio corte |
| R1, abrir lo nuevo en la línea de tiempo | El enlace «(Nutrición)» de la observación | El renglón de lo nuevo de la tarjeta de Nutrición | Que el hecho abra la línea de tiempo filtrada |
| CP-04 y CP-08, el escenario de una sola área | La tabla decía «Sin revisiones registradas» y no tenía filas de otras áreas | La línea del alcance dice «En el período seleccionado · sin revisiones registradas», la cobertura está a la vista y no hay tarjetas, hechos ni conteos de otras áreas | Que sin revisión se diga el alcance, y que un área sin acceso no aporte nada |
| CP-06, una parte que falla | El aviso antes de la lista | El aviso en la tarjeta de cada área con revisión, antes que sus hechos y con «Reintentar»; la de Antropometría, completa | Que una falla se diga primero y no se convierta en «no hay novedades» |
| CP-28, el teclado | Llegar a una observación, una pregunta o una acción | Llegar a un hecho, a la acción de un área y a una pregunta, las tres | Que todo se alcance con Tab, con el foco visible |
| CP-28, los encabezados | «Para tu próxima revisión» | Las tres áreas, «Indicadores» y «Empezar por una pregunta» | Que el lector de pantalla encuentre la estructura |
| CP-19, R3 y `mirar`: los clics en «Preparar la revisión…» | El botón de «Acciones» | El botón al pie de la tarjeta del área | Lo que sigue a ese clic en cada recorrido |
| CP-20, la ficha después de registrar una revisión | La celda de la tabla: «Última: … · registrada, sin aplicar» | El corte de la tarjeta de Entrenamiento con la fecha de hoy y el pendiente «La revisión del … está registrada y su resultado todavía no se aplicó.» | Que la ficha diga la revisión nueva sin recargar |
| CP-23, después de revocar Antropometría | Negaba «Abrir Antropometría» y «Ver la toma» | Lo mismo, más «Preparar una toma» y las tomas del período; no hay tarjeta de Antropometría, y la de Nutrición está | Que el área revocada no aporte valores ni acciones |

Las comprobaciones negativas que cambiaron de texto o de selector (PRO-21 ×2, CP-08, CP-06, CP-23, CP-02) cambiaron en el
mismo commit que la pantalla, y cada una va con una positiva que usa el mismo selector: si el selector no encontrara
nada, la positiva fallaría.

**Lo que se encontró al implementar, y qué se hizo.**

- **«Actualizar» no volvía a leer todo** (E-58). Se vio leyendo el código, antes de sacar del Resumen la segunda hora
  («datos consultados a las…»), que lo disimulaba. Se corrigió en el marco, para las tres vistas, y tiene su
  comprobación.
- **La ayuda se abría por el final** (E-62). Se vio en la primera captura de la ayuda del Resumen, que es más alta que
  la ventana: mostraba el último renglón. El foco iba al botón «Cerrar». Se corrigió para toda ayuda de vista.
- **Una falla real, dicha en su lugar.** En una captura tomada apenas levantada la API después de compilar, la tarjeta
  de Entrenamiento decía «No pudimos completar esta parte (la cobertura del período)», con «Reintentar». El registro
  de la API mostró un 503 de la lectura de la línea de tiempo (`P2028`, el intermitente conocido de `EVIDENCIA/P2028`).
  No es de esta parte, y la pantalla hizo lo que tenía que hacer. No se repitió en las pasadas.
- **Un defecto del instrumento.** Una comprobación nueva falló la primera vez porque leía el texto de un renglón que
  está adentro de un plegable cerrado, y ahí el navegador devuelve vacío. La pantalla estaba bien: se corrigió la
  lectura de la comprobación.
- **Un error de tipos en la prueba nueva del dominio,** que la compilación marcó antes de correrla (usaba una función
  auxiliar de otra prueba con otra firma).
- **La primera pasada completa no pasó entera:** `recorrido.mjs funcional` dio 152 de 153 y
  `recorrido-comprension.mjs funcional`, 75 de 76 (de 22:06 a 22:31; los otros cinco, sin fallas). Las dos fallas eran
  de comprobaciones de esta parte, y las dos enseñaron algo:
  - **E-55, la primera pantalla, por 7 px.** La comprobación exigía que entrara también la regla de cada indicador, y
    la había medido sobre datos que el otro recorrido ya había modificado: al final de su pasada registra una revisión
    de Entrenamiento, y con una revisión de hoy esa tarjeta dice «No hay registros nuevos» en dos renglones. Con los
    datos recién generados, la última revisión de Entrenamiento es del 1 de octubre, la tarjeta cuenta lo nuevo en
    un renglón más, y la regla quedaba en 907 px. Se hicieron dos cosas. Una, en la pantalla: las tarjetas se
    apretaron unos 26 px sacando aire entre sus bloques (ni la letra ni el alto de lo que se toca cambiaron). Otra,
    en la comprobación: exige las tarjetas enteras y el nombre y el valor de cada indicador, y **informa** dónde
    terminan la regla, el minigráfico y la cobertura. El alto de una tarjeta depende de cuántos hechos tenga el área:
    prometer un renglón más con unos pocos píxeles de margen era prometer algo que los datos podían desmentir.
  - **CP-28, el teclado.** La comprobación decía partir del encabezado, pero `page.focus('h1')` nunca enfocó nada (un
    título no recibe el foco) y seguía desde donde había quedado el paso anterior. Con el Resumen de antes llegaba a
    las preguntas dando la vuelta a la página, y pasaba. Con la exigencia nueva (llegar a un hecho, a una acción y a
    una pregunta) quedó a la vista. Ahora parte de un clic en el título. El orden que resulta es el del documento:
    el marco, cada tarjeta de arriba abajo, los indicadores y las preguntas, con el foco visible en cada paso.
  La pasada de la tabla es la segunda, completa, sobre datos generados de nuevo. El resumen de la primera queda en
  `parte-3/resumen-de-la-primera-pasada.txt`.
- **Las primeras capturas de evidencia no servían, y se repitieron.** Se habían tomado después de la pasada completa,
  con dos problemas. Los datos ya no eran los recién generados. Y `ver.mjs`, que a diferencia de los recorridos no
  cuenta sus lecturas, pasó las 120 por minuto: tres capturas mostraban el límite de consultas en lugar de lo que
  tenían que mostrar (una, la ficha entera con «No pudimos leer el resumen por área»). Se regeneraron los datos y se
  capturó en cuatro tandas, cada una con la API recién levantada; mientras se capturaba, la API no respondió ningún
  error. De paso quedó a la vista algo que no es de esta parte: cuando la lectura que falla es la del resumen por
  área, la ficha no dice el motivo (por ejemplo, que hay que esperar un minuto). Está anotado en la definición (§6),
  para el comienzo de la parte 4.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección abra una ficha y diga si encuentra lo que busca.
- Un área disponible y todavía sin datos («Sin datos registrados todavía.»): el texto es el de antes; sin comprobación
  ni captura propias, porque los datos de prueba no tienen ese caso.
- Un enunciado largo del objetivo de Entrenamiento (E-61): el de los datos de prueba ocupa dos renglones.
- Un macro declarado como proporción de las calorías: ninguna pantalla lo escribe hoy; la tira lo contempla sin dato
  para probarlo.
- Guardar una elección de indicadores que incluya la carga de un ejercicio: el editor la ofrece y el recorrido prueba
  el conflicto al guardar (R6), no ese guardado.
- El Resumen a 390 px: se comprueba que no desborda; no tiene una composición propia.
- La prueba de palabras prohibidas extendida a la ficha (E-05): sigue pendiente.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, el árbol de
  accesibilidad, el teclado, el nombre de cada renglón-enlace y la descripción de cada minigráfico.

## Parte 4 · Línea de tiempo: el día como unidad (2026-10-11)

La línea de tiempo mostraba una tarjeta de cinco renglones por hecho: una comida ocupaba lo mismo que un plan activado, y
para ver una semana había que desplazarse varias pantallas. Ahora **el día es la unidad**: cada hecho es un renglón que
se abre entero; los hitos van primero y pesan más; las comidas de un día van en un renglón que dice cuántas son y lo que
tienen de distinto, y se abre en el lugar; un día sin novedades va liso. Arriba, las vistas con nombre dicen cuántos
hechos traen. El detalle se abre al costado, sin tapar la lista. No se quitó ninguna función ni cambió ningún parámetro
de la URL. Sobre la base propia (`be_test_escritorio`, regenerada antes de la pasada) y la compilación estática del
commit de código (837d0e1).

**Medido en la página real,** con el asesorado A y 90 días (330 hechos):

| Ventana | Antes | Ahora |
|---|---|---|
| 1440 px de ancho, alto de la página con la primera tanda de 50 hechos | 10.728 px (casi doce pantallas), medidos el 2026-10-10 antes del marco nuevo, que es 81 px más bajo | 1.398 px (1,6 pantallas), con once días enteros |
| 1440 × 900, sin desplazarse | El buscador, los filtros y los dos primeros hechos | Seis días enteros, con todos sus hechos (el séptimo termina en 972 px) |
| 1920 × 950 (la pantalla de Dirección, estimada) | — | Seis días enteros |
| 1280 × 900 | — | Cinco días enteros (el buscador y «Más filtros» bajan a un segundo renglón) |

Un día liso ocupa 53 px; uno con una sesión y sus comidas, 98; uno con una toma, una sesión y sus comidas, 143. La
semana más reciente del asesorado A es de las cargadas (tomas en tres de sus últimos seis días): una semana con dos o
tres sesiones y sin tomas entra entera en 900 px. La imagen `parte-4/linea-antes-y-ahora.png` compara las dos versiones
a 1440 px: la de antes es la captura de la pasada final de la parte 3 (recortada a 2.400 px, donde entran dos días), y
la de ahora, la primera tanda entera.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Cada día se arma con lo que entrega la API: los hitos primero, las comidas en un renglón que dice cuántas son y cuántas tienen cada rasgo, y la tarjeta solo si hay una sesión, un hito o un rasgo (E-65, E-66) | `recorrido.mjs funcional` (solas: `recorrido.mjs linea`), E-65: lo esperado de cada día, calculado a mano desde todas las tandas de la API, contra cada día en pantalla | Pasa: once días a la vista, ocho con tarjeta y tres lisos | Verificado automáticamente |
| Se muestran días enteros: el día que la tanda cortó espera a «Ver días anteriores», y el pie dice cuántos hechos se ven y hasta qué día (E-71) | E-71, contra la primera tanda de la API; con su prueba de la prueba (con el día cortado en la lista, la comparación lo detecta) | Pasa: «Se ven 49 de 330 hechos, hasta el 1 oct.» | Verificado automáticamente |
| A 1440 × 900 entran, sin desplazarse, al menos cinco días enteros (E-72) | E-72, midiendo la página con los datos recién generados; con su prueba de la prueba (con renglones de 215 px, como las tarjetas de antes, la misma medición da un día) | Pasa: seis días | Verificado automáticamente |
| Un grupo abierto muestra todas las comidas del día, de la más temprana a la más tardía, cada una con sus rasgos (E-66) | E-66, contra la API, por identificador | Pasa | Verificado automáticamente |
| Las comidas de ayer: un renglón que anuncia una anulada y una rectificada; cerrado no muestra ninguna y abierto, las cuatro (E-66, PRO-16) | E-66 y PRO-16, en `recorrido.mjs funcional` | Pasa | Verificado automáticamente |
| El detalle dice lo que el renglón ya no repite: cuándo ocurrió y cuándo se cargó (los instantes de la API, con quién), sus relaciones, todos los datos de la entrada a un clic y el camino a su pestaña (E-70) | E-70, contra la entrada de la API | Pasa | Verificado automáticamente |
| A 1440 el detalle se abre al costado, sin diálogo, con el renglón marcado y el foco en el detalle; Escape lo cierra y vuelve a la misma posición (E-70, PRO-05) | E-70 y PRO-05, en `recorrido.mjs funcional` | Pasa | Verificado automáticamente |
| Escape desde la lista cierra el detalle y deja el foco; «Cerrar» lo devuelve al renglón; con el grupo cerrado, al renglón del grupo (E-70) | E-70 | Pasa | Verificado automáticamente |
| A 1024 px el detalle se abre encima, en un panel que retiene el foco; axe sin faltas (E-70) | E-70 | Pasa | Verificado automáticamente |
| Al tocar otro hecho mientras el primero carga, el detalle queda con el segundo (E-73) | E-73, demorando tres segundos la lectura del primero en el navegador | Pasa | Verificado automáticamente |
| Las vistas con nombre, en su orden, cada una con la cantidad de la API; «Lo nuevo desde la revisión», sin número (E-67) | E-67, contra los conteos del período de la API | Pasa: Todo 330 · Hitos 19 · Distinto de lo indicado 4 · Sin confirmar 3 | Verificado automáticamente |
| Cada vista trae lo que anuncia: la cantidad del botón, la de la cabecera y la de la API con ese filtro son la misma; la URL lleva solo ese filtro; cada renglón es de la vista (E-67) | E-67, una por vista, con una lectura de la API por cada una | Pasa: 19, 4 y 3 | Verificado automáticamente |
| Con una vista que recorta dentro del día, cada hecho va en su renglón: sin grupos ni días sin hechos (E-68) | E-68 | Pasa | Verificado automáticamente |
| «Lo nuevo desde la revisión» ofrece cada área con la fecha de su revisión; elegida una, la URL es la que escribe el Resumen, la cantidad es la de la API y las demás vistas siguen diciendo las cantidades del período (E-69) | E-69, contra el resumen de la ficha y la API con ese corte | Pasa: 70 hechos nuevos en Nutrición | Verificado automáticamente |
| Un plan activado se abre con su número de versión (E-74) | E-74 | Pasa: «Versión 2 · activada el…» | Verificado automáticamente |
| Al buscar una palabra que está en un dato que el renglón no muestra, el renglón dice dónde coincide; si ya lo dice, no agrega nada (E-75) | E-75, con el motivo de una sesión y con «cena» | Pasa: «Coincide en: Motivo: Viaje laboral» | Verificado automáticamente |
| «Actualizar» con dos tandas leídas vuelve a leer desde la primera, sin repetir ni perder hechos (E-76) | E-76, contra los identificadores de la API | Pasa: 98 hechos con dos tandas, 49 después | Verificado automáticamente |
| Entre dos días de la lista, los días sin ningún hecho se dicen con sus fechas; con un filtro, ninguno (E-77) | E-77, contra las fechas de la API, en un período alrededor del hueco | Pasa: «12 ago: sin hechos registrados» | Verificado automáticamente |
| La ayuda de la vista se abre por el principio, explica cada parte con su muestra y, a un clic, qué trae cada vista; axe sin faltas (E-78) | E-78 | Pasa: 12 renglones, 12 muestras, 5 vistas | Verificado automáticamente |
| Con el teclado se llega, en orden, a las vistas, el buscador, la lupa, «Más filtros» y los renglones; cada uno mide 44 px y muestra el foco; Enter abre y cierra un grupo | PRO-22 | Pasa | Verificado automáticamente |
| Sin faltas de accesibilidad con un grupo y el detalle abiertos, en los dos temas | axe (WCAG 2.2 A y AA) | Pasa | Verificado automáticamente |
| La vista entera, con un grupo y el detalle abiertos, no tiene porcentajes ni palabras que califiquen (E-65) | E-65 | Pasa | Verificado automáticamente |
| Sin desborde de costado a 1440, 1280 y 1024 px | PRO-23 | Pasa | Verificado automáticamente |
| En Analizar, los hitos que se dibujan son los de planificación, y son los de la API sin las tomas (E-79) | E-31 y E-25, en `recorrido.mjs funcional` | Pasa: 11 de planificación; las 8 tomas no se listan | Verificado automáticamente |
| Las reglas del día, de los rasgos y de las vistas (E-65 a E-68, E-71, E-77, E-79) | `packages/domain`: 12 pruebas nuevas (`dia-de-la-linea.test.ts`); una comprueba que la cantidad que anuncia cada vista es la de los hechos que cumplen sus filtros | 607 de 607 (las 595 de antes y 12 nuevas) | Verificado automáticamente |
| Cómo se escribe un hecho en un renglón, con los títulos y rótulos reales de la API (E-65, E-74, E-75, E-82) | `scripts/hecho-en-un-renglon.test.mjs`, en la batería | 11 de 11 | Verificado automáticamente |
| Las pruebas nuevas detectan lo que protegen | `mutaciones-unitarias.mjs`: 14 reglas rotas de a una (7 del dominio y 7 del renglón); y `recorrido.mjs linea` sobre una compilación rota a propósito en ocho puntos | 14 de 14 detectadas; sobre la compilación rota, `linea` falló en las 11 comprobaciones que protegen esos puntos (E-65, E-67, E-68, E-69, E-70, E-71, E-73, E-74, E-75, E-76 y E-77) y pasó las otras 15. Después se reforzó una, que decía mirar el número del botón de cada vista y miraba el esperado | Verificado automáticamente |
| La ficha sigue funcionando | Los siete recorridos, sobre la compilación del commit de código | `recorrido.mjs`: capturas 60 de 60, funcional 182 de 182 (las 154 de antes y 28 nuevas), descartable 17 de 17. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 76 de 76, revocación 6 de 6. Una sola pasada, el 2026-10-11 de 00:35 a 01:02, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10), sin fallas | Verificado automáticamente |
| El arreglo del renglón de las vistas, hecho después de esa pasada (d56d485) | Los tres recorridos que miran ese renglón, sobre la compilación del arreglo y los datos del día: `recorrido.mjs linea` y `capturas`, y `recorrido-comprension.mjs mirar` | 26 de 26, 60 de 60 y 20 de 20. Los otros cuatro recorridos no se repitieron sobre esta compilación: la pasada completa se vuelve a hacer al cerrar la parte 5 | Verificado automáticamente, en lo que cambió |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código (837d0e1) | En verde (corrida 38108865346): el legajo, la batería completa, la integración y la imagen de la API. La batería, corrida también en esta máquina antes del commit: dominio 607, guiones 318 y API 81 | Verificado automáticamente |
| La línea a 1440, 1280 y 1024 px y en los dos temas; un grupo abierto; el detalle de una comida, de una sesión, de una toma y de un plan; «Hitos», «Sin confirmar» y «Lo nuevo»; «Más filtros»; una búsqueda; los días sin hechos; la ayuda | `ver.mjs` | 28 imágenes en `parte-4/`: 25 capturas, la primera pantalla a 1440 × 900 y a 1920 × 950, y antes y ahora. Son de la compilación del commit de código, salvo «Lo nuevo» de Nutrición, que es de la del arreglo | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| E-65 a E-78, con las de teclado y accesibilidad (PRO-22), desborde (PRO-23) y errores (PRO-25) de la línea: 26 nuevas, en `recorrido.mjs funcional`; solas, con `recorrido.mjs linea` | — | La línea de tiempo por día, con lo esperado calculado a mano desde la API | Las decisiones de esta parte |
| PRO-02, los últimos hechos | Contaba seis `.entrada` (habría contado también las ocultas) | Lo que la lista anuncia sin abrir nada (renglones sueltos y la cantidad de cada grupo) es al menos seis, y es lo mismo que tiene adentro | Que los últimos hechos del período estén a mano |
| PRO-01, PRO-04, PRO-21: la cuenta de la cabecera | «(\d+) hechos coinciden» | «N hechos en el período» sin filtros y «N hechos coinciden» con ellos, con punto de miles | El total, lo filtrado y que una respuesta lenta no pise a otra |
| PRO-17, el nombre del día | El título del día, largo | El título dice el día entero para el lector de pantalla y, a la vista, corto («10 oct», «sábado») | Que el día se nombre en castellano |
| PRO-03, la toma cargada otro día | «Carga tardía» | «Cargado otro día», en el renglón de la toma | Que el hecho quede en el día en que ocurrió |
| PRO-16, lo rectificado y lo anulado | Las tarjetas del día de ayer | Abre el grupo de comidas de ayer y lee sus renglones; antes, que el grupo cerrado lo anuncie | Que una rectificación no sea otra entrada y una anulación no borre |
| PRO-04, los filtros combinados | Los chips de área y el tipo, a la vista | Abre «Más filtros» y usa los mismos controles | Que los filtros queden en la URL y reduzcan el conjunto |
| PRO-04, «Ver más» | «Ver más» hasta el final: tantos identificadores como la cuenta; las áreas, por un texto de cada tarjeta | «Ver días anteriores» hasta el final: tantos identificadores como la cuenta (las comidas de un grupo cerrado están en el documento), todos de Nutrición por su atributo, y lo que anuncian los renglones suma lo mismo | Que la paginación complete sin repetir ni perder. La parte de las áreas ya no puede pasar sin mirar nada |
| PRO-05, abrir un registro | El último «Abrir registro»; un diálogo | El último renglón a la vista; el detalle al costado, con «Ocurrió» y «Se cargó» | Que se abra el registro de esa entrada y se vuelva a la misma posición |
| PRO-04, la búsqueda | El botón «Buscar» | La lupa, que se llama «Buscar» | Que el texto buscado no viaje en ninguna URL |
| E-47, dónde aparece la ayuda | «En la Línea de tiempo, que todavía no tiene la suya, no está» | Está en las tres vistas, y el marco mide lo mismo | Que el marco no crezca |
| E-25 y E-31, los hitos de Analizar | «Hitos (N)» | «Hitos de planificación (N)», y N es el de la API sin las tomas | Que las líneas dibujadas sean las de la lista |
| La captura del registro en el teléfono | «Abrir registro» | El primer renglón; ahí sigue siendo un panel | La captura |
| PRO-20, después de revocar Antropometría (descartable) | Negaba «Toma» y «kg» en las entradas | Lo mismo, y antes de revocar comprueba que la línea traía tomas, con el mismo selector | Que el área revocada no aporte nada. La negativa ahora va con su positiva |
| GUIA-II.1, a 1280 × 800 | La primera `.entrada` del documento | El primer día, con una posición real (una comida de un grupo cerrado mediría 0 y pasaría sola) | Que la línea empiece en la primera pantalla |
| R1, lo nuevo en la línea de tiempo | La cuenta sin punto de miles; las áreas, por un texto de cada tarjeta | La cuenta con punto de miles; el área de cada renglón por su atributo, con al menos uno; y «Lo nuevo desde la revisión» elegido, con su área | Que el hecho del Resumen abra la línea filtrada |

Las comprobaciones negativas que cambiaron (PRO-20, y la parte de las áreas de PRO-04 y de R1, que eran un «todas son de
Nutrición» sobre un texto que ya no está en cada renglón) cambiaron en el mismo commit que la pantalla, y cada una va
con una positiva que usa el mismo selector.

**Lo que se encontró al implementar, y qué se hizo.**

- **Un relevamiento en paralelo, y lo que encontró.** Mientras se escribía la pantalla, un agente relevó el código, la
  API, la maqueta y los recorridos (`relevamientos/linea-de-tiempo-plan-de-implementacion.md`). Encontró cosas que la
  implementación no había visto, y se corrigieron antes de la pasada:
  - **Dos defectos de antes,** que seguían: desde la línea de tiempo, la planificación de un plan activado decía
    «Versión 0» (E-74), y «Actualizar» le pegaba a la lectura nueva las tandas de la anterior (E-76).
  - **«Hitos» nombraba dos conjuntos** en la misma ficha: 19 en la línea de tiempo (con las tomas) y 11 en Analizar
    (E-79).
  - **Datos de la entrada que ya no se veían en ningún lado** («Frente a lo indicado», «Rigió hasta», las cuentas de una
    toma), y una búsqueda que podía traer renglones sin decir por qué (E-70, E-75).
  - **Tres textos y un ícono:** «7 series» por «7 series con datos», «Sesión Sesión…» si el nombre ya empezaba así, y
    los cubiertos donde el catálogo pone el desvío (E-82).
  - **Una herramienta que medía mal:** `tiempos.mjs` medía la búsqueda con el texto en la URL, que la API rechaza con un
    400 desde que la búsqueda va en el cuerpo. Se corrigió.
- **El motivo de una falla del resumen por área** (el pendiente de la parte 3) y, al seguirlo, otro: con esa lectura
  fallada, una pregunta de Analizar quedaba en «Cargando…» para siempre. Las dos dicen ahora qué pasó, por qué y
  «Reintentar» (E-81).
- **Una regla que no hacía nada.** La prueba de la prueba rompió catorce reglas de a una; una no se detectó porque la
  línea que se quitaba era redundante (el resultado era el mismo sin ella). Se sacó del código y se probó otra
  mutación, que sí cambia el resultado.
- **Lo que mostró la pantalla al mirarla,** y se ajustó: en Azul noche el color tenue es un celeste, y un registro
  anulado quedaba resaltado en vez de atenuado (ahora se atenúa por opacidad); el registro, dentro del detalle, era una
  caja con barra adentro de otra tarjeta (ahora va liso); con poco ancho, la flecha del grupo bajaba al segundo renglón;
  a 1280, «Más filtros» bajaba solo y ocupaba un renglón entero (ahora baja con el buscador).
- **Lo que mostraron las capturas de evidencia, después de la pasada.** A 1440, con «Lo nuevo desde la revisión»
  elegido, el botón decía también el área y el renglón ya no entraba: el buscador se achicaba hasta cortar su texto y
  «Más filtros» se partía en dos renglones. Se corrigió (d56d485): elegido, el botón dice «Lo nuevo · Nutrición» (el
  aviso de abajo dice la revisión entera, con su fecha, y el lector de pantalla sigue oyendo «desde la revisión»), el
  buscador no baja de su texto y «Más filtros» no se parte; si no entran, bajan los dos juntos.
- **Una herramienta que mostraba otra cosa.** `ver.mjs` capturaba una ruta sin salir de la pantalla anterior cuando
  las dos eran de la misma página: quedaba abierto lo de la captura anterior (un detalle, un menú, los filtros) y una
  falla simulada no llegaba a pedirse. Cinco de las 25 capturas no mostraban lo que decía su nombre (la del plan, la de
  «Lo nuevo» de Nutrición, la búsqueda, la ayuda y la de «no se pudo leer»). Ahora cada ruta se captura con la pantalla
  recién abierta, y esas cinco se repitieron. Se detectó mirando las imágenes una por una, no por una comprobación:
  dos archivos pesaban exactamente lo mismo.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección abra una ficha y recorra una semana.
- El peso y la clase de la toma en su renglón: no llegan en la entrada (definición, §6).
- Los días sin hechos de dos o más días seguidos en pantalla: el escenario de hoy tiene un hueco de un día. Las tres
  formas del texto están en la prueba de la función.
- Un día con más de 50 hechos (que no entra en una tanda): se muestra sin agrupar y lo dice; sin datos para probarlo en
  pantalla. La regla está en la prueba del dominio.
- Una sola área con revisión («Lo nuevo desde la revisión» sin desplegar) y ninguna (el botón no está): el escenario
  tiene las dos.
- Una toma con decenas de mediciones corregidas en el detalle: la regla que las junta está en la prueba de la función.
- La línea a 768 y 390 px: se comprueba que no desborda; no tiene una composición propia.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, el teclado, el
  nombre de cada renglón y de la lupa, y el título de cada día.
- La prueba de palabras prohibidas extendida a la ficha (E-05): sigue pendiente.

## Parte 5 · Espacio profesional: los pendientes y el directorio (2026-10-11)

El Espacio profesional mostraba cuatro tarjetas abiertas, una debajo de otra: los pendientes, los asesorados (un
renglón por vínculo), las solicitudes enviadas y, al costado, el formulario para pedir un vínculo. Ahora son **dos
tarjetas: primero lo que hay que hacer y, al lado, a quién abrir.** Los pendientes tienen vistas con nombre, que dicen
cuántos traen; «Tus asesorados» es un directorio con buscador; el formulario y la lista de solicitudes se abren cuando
hacen falta. No se quitó ninguna función ni cambió ningún parámetro: `/pro` sigue sin llevar ninguno. Sobre la base
propia (`be_test_escritorio`, regenerada antes de la pasada) y la compilación estática del commit de código
(4b84714).

**Medido en la página real,** a 1440 px de ancho:

| Qué | Antes | Ahora |
|---|---|---|
| Con los datos de prueba (dos pendientes, cuatro personas, nueve solicitudes) | 2.697 px de alto: tres pantallas (medido el 2026-10-11, antes de tocarla) | La última tarjeta termina en 606 px: entra en la primera pantalla |
| Con siete pendientes, uno de cada tipo (respuesta simulada) y las mismas cuatro personas | — | Los pendientes terminan en 854 px y el directorio en 606: las dos tarjetas enteras en 900 px |
| En otras ventanas, con esos siete pendientes | — | A 1920 × 950, lo mismo: 854 y 606 px. A 1280 × 900, los pendientes terminan en 980 px (las frases largas ocupan dos renglones) y el directorio, en 606: la última fila queda a medias |
| Lecturas protegidas (las que cuentan para el límite de 120 por minuto) | Una al entrar y una más por cada cambio de «Dominio», de «Tipo» o de período | Una al entrar; ninguna al elegir una vista, un área o un tipo; una al cambiar el período y una en «Actualizar» |

La imagen `parte-5/espacio-antes-y-ahora.png` compara las dos versiones a 1440 px, con el mismo escenario de datos (los
identificadores cambian en cada generación).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| El encabezado dice el título (el único de la página), «Hoy» con el día de la semana y el año de la fecha de la API, y «Solicitar vínculo» (E-93) | `recorrido.mjs funcional` (solas: `recorrido.mjs espacio`), E-93, contra `today` de la API | Pasa: «Hoy, domingo 11 oct 2026» | Verificado automáticamente |
| Al entrar, los pendientes se leen una sola vez y de a 50; las otras dos listas, una vez cada una (E-83) | E-83, mirando los pedidos que hace la página | Pasa | Verificado automáticamente |
| Las cinco vistas, en su orden, cada una con la cantidad que trae; las cuatro suman «Todo»; una vista en cero se muestra (E-84) | E-84, con las cantidades contadas a mano sobre la lista de la API | Pasa: Todo 2 · Revisiones 1 · Planes 1 · Formularios 0 · Evaluaciones 0 | Verificado automáticamente |
| Cada vista trae lo que anuncia, queda elegida ella sola y elegirla no le pide nada a la API; volver a tocarla deja «Todo» (E-84) | E-84, una por vista | Pasa: ningún pedido | Verificado automáticamente |
| Cada pendiente es una fila, en el orden de la API: la persona, el área, la frase de BE, el último registro (el día, en la zona de la respuesta) y «Abrir», con su destino y un nombre distinto en cada fila (E-87) | E-87, con la frase, el día y el destino escritos a mano por tipo | Pasa: «Revisión en 3 días · Último registro: 11 oct» y «Plan en borrador desde el 11 oct» | Verificado automáticamente |
| Los siete tipos de pendiente, con su frase, su ícono, su último registro («Sin registros todavía» donde no hay) y su destino (E-98) | E-98, con una respuesta simulada en el navegador (`cartera-simulada.mjs`); la pantalla la valida con el contrato, como a una real | Pasa: 7, 3, 2, 1 y 1 | Verificado automáticamente, **sobre una respuesta simulada** |
| «Más filtros»: con un área, las filas son las de esa área, ninguna vista queda elegida, lo puesto se lista con su salida y se dice cuántos coinciden; con un tipo exacto, acota más; las cantidades de las vistas no cambian; nada se le pide a la API (E-85) | E-85 | Pasa: «Un pendiente coincide, de 2.» | Verificado automáticamente |
| El período se le pide a la API y no cambia qué está pendiente: las mismas filas, con el último registro de ese período; al quitarlo, vuelve el de toda la historia (E-86) | E-86, contra la API con el mismo período (anterior a todo lo registrado) | Pasa: «Sin registros en el período» con período; «Último registro: 11 oct» sin él | Verificado automáticamente |
| «Actualizar» vuelve a leer las tres listas y dice la hora de la consulta (E-88) | E-88, mirando los pedidos | Pasa: una lectura de cada una | Verificado automáticamente |
| El aviso de vista parcial está debajo de las vistas y arriba de la tabla, con el texto de BE, solo cuando la API lo dice (E-88) | Con los datos principales no está (la API dice que no); con la respuesta simulada, está; y **con una respuesta real**, en `recorrido.mjs descartable`: después de que la persona revoca un área, la API lo dice y la pantalla lo avisa | Pasa en los tres | Verificado automáticamente |
| Una vista sin filas dice «Ningún pendiente coincide con lo elegido» y cuántos hay en total; no dice «Nada pendiente» (E-96) | E-96, con «Formularios» y «Evaluaciones», que en el escenario están en cero | Pasa | Verificado automáticamente |
| Si falla la lectura de los pendientes, el bloque dice qué pasó, por qué y «Reintentar»; las vistas quedan sin número, «hoy» no se dice y el directorio sigue (E-96) | E-96, simulando en el navegador un 429 y un corte de red | Pasa: «Hubo muchas consultas seguidas. Esperá un minuto y reintentá.»; «No hay conexión con BE…» | Verificado automáticamente |
| Si falla la lectura de los asesorados, el directorio lo dice con su motivo y los pendientes siguen (E-96) | E-96, simulando un 503 | Pasa | Verificado automáticamente |
| Una cuenta profesional sin asesorados: «Nada pendiente con lo que BE puede saber…», las cinco vistas en cero, «Todavía no tenés asesorados activos en este contexto» (E-96) | E-96, en la sesión del tercero de `recorrido.mjs funcional` | Pasa: las cinco vistas en cero y «Solicitudes enviadas (0)» | Verificado automáticamente |
| El directorio: una persona por renglón, en el orden de la API; el título cuenta personas; cada una, con su referencia y sus áreas en el orden de BE; «Abrir» lleva a su ficha (E-89) | E-89, contra los vínculos de la API | Pasa: 4 personas, «Nutrición · Entrenamiento · Antropometría» | Verificado automáticamente |
| Tocar a una persona abre el detalle de cada vínculo: el área con su finalidad, el estado con las palabras de BE y desde cuándo (E-89) | E-89 | Pasa | Verificado automáticamente |
| Un área sin acceso lleva el candado y las palabras de BE (E-89) | En `recorrido.mjs descartable`, después de revocar: «Antropometría: Consentimiento revocado · Acceso no disponible»; antes, estaba entre las áreas con acceso. Los seis estados, en la prueba de la función | Pasa | Verificado automáticamente |
| El buscador se llama «Buscar por referencia» y filtra mientras se escribe, sin pedirle nada a la API; sin coincidencias lo dice y ofrece quitar la búsqueda (E-90) | E-90 | Pasa: «1 de 4» | Verificado automáticamente |
| «Solicitudes enviadas (N)» cuenta las que envió el profesional y abre un diálogo que retiene el foco, se abre por su título y tiene una fila por solicitud; Escape lo cierra y devuelve el foco (E-92) | E-92, contra la API; con su prueba de la prueba (con un título que no puede recibir el foco, la medición lo dice) | Pasa: 9 filas | Verificado automáticamente |
| «Solicitar vínculo» abre el formulario de siempre en un diálogo, con el foco en el primer campo; enviado vacío marca los dos campos y no le pide nada a la API; Escape lo cierra y devuelve el foco (E-91) | E-91 | Pasa | Verificado automáticamente |
| Con un identificador que no es de nadie, dice lo mismo que por cualquier otro rechazo, sin revelar si la persona existe (E-91) | E-91 | Pasa: «No pudimos enviar la solicitud con esos datos. Revisá el identificador y el alcance.» | Verificado automáticamente |
| Enviar una solicitud la crea: el diálogo se cierra, la página lo dice y el pie cuenta una más; pedir de nuevo lo mismo no crea otra y abre la lista, que la muestra (E-91) | En `recorrido.mjs descartable`, con cuentas que se crean para esa corrida, contra la API | Pasa: «Solicitud enviada. El asesorado decide si la acepta.»; «Ya hay una solicitud pendiente igual. Te mostramos esa.» | Verificado automáticamente |
| La dirección sigue siendo `/pro`, sin parámetros (E-95) | E-95 | Pasa | Verificado automáticamente |
| A 1440 × 900, con siete pendientes, las dos tarjetas terminan dentro de la primera pantalla (E-94) | E-94, sobre la respuesta simulada; con su prueba de la prueba (con filas de 215 px, la misma medición da que no entran) | Pasa | Verificado automáticamente, **sobre una respuesta simulada** |
| A 1440 y a 1280 px el directorio va al lado; a 1024, debajo; sin desborde de costado a 1440, 1280, 1024, 768 ni 390 px (E-94) | E-94 | Pasa | Verificado automáticamente |
| Con el teclado se llega, en el orden en que se ven, a cada control; cada uno mide 44 px o más y muestra el foco | PRO-22 | Pasa | Verificado automáticamente |
| Sin faltas de accesibilidad con «Más filtros» y una persona abiertos, en los dos temas, y en los dos diálogos | axe (WCAG 2.2 A y AA) | Pasa | Verificado automáticamente |
| La página entera no tiene porcentajes ni palabras que califiquen a nadie (E-87) | E-87; y `scripts/copy-pantallas.test.cjs`, que ahora recorre los textos de las pantallas de `/pro` con la lista de la cartera | Pasa | Verificado automáticamente |
| Las vistas reparten los siete tipos, la cantidad que anuncia cada una es la de las filas que trae, filtrar no reordena (E-84, E-85) | `packages/domain`: 4 pruebas nuevas en `cartera.test.ts` | 617 de 617 (las 607 de antes, estas 4 y las 6 de la lectura de una lista) | Verificado automáticamente |
| Leer una lista entera: sin repetir ni perder, incompleta si pasa del tope, de nuevo una vez si el cursor vence, y una falla es el resultado (E-83, E-97) | `packages/domain`: 6 pruebas nuevas (`todas-las-paginas.test.ts`). La función ya existía, sin pruebas | 6 de 6 | Verificado automáticamente |
| El directorio (las áreas en el orden de BE, los seis estados con las palabras de BE, varios vínculos en un área, la búsqueda) y la fila de un pendiente (cada frase, el día en la zona de la respuesta, el destino) | `scripts/espacio-profesional.test.mjs`, en la batería | 11 de 11 | Verificado automáticamente |
| Las pruebas nuevas detectan lo que protegen | `mutaciones-unitarias.mjs`: 25 reglas rotas de a una (6 de las vistas, 7 de la lectura de una lista, 7 del directorio y 5 de la fila); y los dos recorridos sobre una compilación rota a propósito en 16 puntos | 25 de 25 detectadas, ninguna por una prueba colgada. Sobre la compilación rota, las 16 roturas se detectaron: `espacio` falló en 17 comprobaciones (las que protegen esos puntos y dos que comparan las mismas filas) y pasó las otras 13; `descartable` falló en las 2 que protegen el envío repetido y el aviso de vista parcial real, y pasó las otras 19 (`resultados/prueba-de-la-prueba-de-los-recorridos.txt`) | Verificado automáticamente |
| El resto de la ficha sigue funcionando | Los siete recorridos, sobre la compilación del commit de código | `recorrido.mjs`: capturas 60 de 60, funcional 213 de 213 (las 182 de antes y 31 nuevas), descartable 21 de 21 (las 17 de antes y 4 nuevas). `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 76 de 76, revocación 6 de 6. Una sola pasada, el 2026-10-11 de 02:56 a 03:25, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10), sin fallas. Los tres cambios sin commit que anota el resumen eran dos guías de demostración y la carpeta de imágenes: ningún código | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código (4b84714) | En verde (corrida 38116113620): el legajo, la batería completa, la integración y la imagen de la API. La batería, corrida también en esta máquina antes del commit: dominio 617, guiones 330 y API 81 | Verificado automáticamente |
| El Espacio profesional a 1440, 1280, 1024, 768 y 390 px y en los dos temas; los siete tipos; «Más filtros»; una vista en cero; una persona abierta; la búsqueda; los dos diálogos; las dos fallas; y después de una revocación | `ver.mjs` y `recorrido.mjs descartable` | 23 imágenes en `parte-5/`: 21 capturas de `ver.mjs`, la de después de una revocación (`recorrido.mjs descartable`, con datos reales) y antes y ahora. Se miraron una por una | Observado en una captura real (la de los siete tipos, sobre una respuesta simulada) |

**Comprobaciones que cambiaron, y lo que protegen (E-06):**

Ningún recorrido miraba `/pro`: no había comprobaciones que adaptar. Son todas nuevas.

| Comprobación | Dónde | Qué protege |
|---|---|---|
| E-83 a E-98, con las de teclado y accesibilidad (PRO-22) y errores (PRO-25): 30, en `recorrido.mjs funcional`; solas, con `recorrido.mjs espacio` | `espacioProfesional`, al final de la sesión de `fichaRecompuesta` (no suma un inicio de sesión) | Las decisiones de esta parte, con lo esperado calculado a mano desde la API |
| E-96, la cuenta sin asesorados | La sesión del tercero de `funcional` | Que una lista vacía se diga como tal, y no como una falla |
| E-91 (dos), E-88 y E-89, en `recorrido.mjs descartable` | Antes y después de la revocación | El envío real de una solicitud, y el aviso de vista parcial y el área sin acceso con respuestas reales |

Cada negativa va con una positiva que usa el mismo selector: «no hay aviso de vista parcial» (datos principales) y «hay»
(simulada y descartable); «no dice Nada pendiente» y «las filas están»; «no dice que no hay asesorados» y «las
personas están».

**Lo que se encontró al implementar, y qué se hizo.**

- **Un relevamiento en paralelo, otra vez.** Un agente leyó la pantalla, la API, la maqueta y los recorridos mientras
  se cerraba la parte 4 (`relevamientos/espacio-profesional-plan-de-implementacion.md`). De ahí salieron los defectos de
  antes que esta parte corrige:
  - **«Sin registros en el período» se decía sin que hubiera un período elegido** (E-86).
  - **Una falla no decía su motivo,** y una vista o un filtro sin filas decía «Nada pendiente…», como si la cartera
    estuviera vacía (E-96).
  - **Contar y agrupar sobre listas leídas de a 20:** una persona partida entre dos páginas mostraba parte de sus
    áreas, y «Todavía no tenés asesorados» podía aparecer con páginas sin leer (E-83).
  - **Las áreas de una persona salían en el orden de la lista,** no en el de BE (E-89).
  - **Ningún recorrido miraba esta página** (E-98).
- **Una pieza repetida, que se sacó.** La primera versión de esta parte traía su propia lectura de páginas en el
  website. El dominio ya tenía una (`todasLasPaginas`), sin pruebas: se usó esa, se le sumó lo que faltaba y se le
  escribieron sus pruebas (E-97).
- **Un defecto vecino, del mismo origen:** la ficha y la lámina de Antropometría leían solo los primeros 20 vínculos
  (de todos los estados y de los dos roles de la cuenta). Con más, un asesorado antiguo abría su ficha sin «Acceso
  actual». Ahora los leen todos. Con los datos de prueba (9 vínculos) no se veía ni se puede mostrar: lo cubre la
  prueba de la lectura.
- **Una prueba que se colgaba en vez de fallar.** La prueba de la prueba rompió la regla «un cursor vencido se
  reintenta una sola vez»: la prueba unitaria no falló, quedó dando vueltas. Una prueba que se cuelga no avisa: ahora
  tiene su propio tope y falla.
- **Una rotura que el recorrido no detectaba.** En una primera corrida sobre la compilación rota, quitar el pedido de
  foco del título de la lista de solicitudes no cambió nada: este navegador ya enfoca el primer elemento enfocable de
  un diálogo. No era la comprobación la que estaba floja: la rotura no rompía nada acá. La comprobación ahora trae su
  propia prueba (con un título que no puede recibir el foco, lo dice), en la corrida final la rotura fue esa y se
  detectó, y el pedido de foco se dejó: otros navegadores no hacen lo mismo.
- **El escenario descartable no podía pedir un vínculo:** su profesional estaba habilitado en dos áreas y tenía
  vínculo en las dos. Quedó habilitado en las tres, con vínculo en dos (E-98).
- **Lo que mostró la pantalla al mirarla,** y se ajustó: las áreas de una persona se partían en dos renglones (el
  directorio pasó de 27 a 28 rem y las áreas van un punto más chicas); la referencia y las áreas quedaban separadas
  cuando había una sola área (ahora son un solo bloque, que abre el detalle); el período de «Más filtros» dejaba su
  botón solo en un renglón (ahora ocupa el suyo, con las dos fechas y el botón juntos).

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección entre al Espacio profesional en su pantalla.
- Los tipos de pendiente que el escenario principal no tiene (revisión vencida y sin fecha, sin plan activo,
  formulario sin responder y evaluación en preparación) se vieron **con una respuesta simulada**: la pantalla es la
  real, los datos no salieron de la API. «Sin plan activo» y la vista parcial sí se ven con datos reales en el
  escenario descartable.
- Más de 200 pendientes («200+» y «Ver más») y más de 200 vínculos: sin datos para probarlo en pantalla. La lectura
  incompleta está en la prueba del dominio.
- Un cursor que vence mientras se lee (la lista cambió): en la prueba del dominio, no en pantalla.
- Una persona con un área pausada, finalizada o pendiente de autorización: en la prueba de la función (los seis
  estados); en pantalla se vio el de consentimiento revocado.
- El resultado incierto de un envío (sin respuesta de red) y el conflicto («Ya tenés un vínculo vigente…»): el
  código es el de antes, y no se ejercitó en esta parte.
- El Espacio profesional a 768 y 390 px: se comprueba que no desborda y se miró una captura; no tiene una composición
  propia.
- El lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, el teclado, el
  nombre de cada «Abrir» y el foco de los dos diálogos.
- `scripts/auditoria-accesibilidad.mjs` (fuera de la CI) sigue vieja: toca el primer «Abrir» de `/pro`, que desde que
  existen los pendientes no es el de una ficha (definición, §6).

## Parte 2 · Lo que quedaba: la prueba de palabras en la ficha (E-05) (2026-10-11)

La prueba que impide puntajes, porcentajes y palabras que califican recorría las pestañas de cada área y, desde la
parte 5, el Espacio profesional. La ficha (el marco, el Resumen, la Línea de tiempo y Analizar) no estaba.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Los textos de la ficha (30 archivos) no tienen puntajes, juicios ni huecos completados, con las listas de las tres áreas a la vez | `scripts/copy-pantallas.test.cjs`, en la batería | Pasa: 11 de 11 en ese archivo (las 9 de antes y 2 nuevas) | Verificado automáticamente |
| El único porcentaje de la ficha es el cambio relativo de Analizar, y está contado lugar por lugar | La misma prueba: tres lugares permitidos (la lectura «+3,2 % contra la referencia», la unidad de ese gráfico y el ancho de su caja). Un «%» en cualquier otro texto la hace fallar; un permiso que ya no se usa, también | Pasa | Verificado automáticamente |
| La prueba detecta lo que protege | Cuatro textos rotos de a uno: la ayuda vuelve a decir «adherencia»; una tarjeta del Resumen dice un porcentaje; el marco dice «cumplimiento»; un porcentaje permitido deja de existir | 4 de 4 detectados | Verificado automáticamente |

**Lo que encontró.** La ayuda del Resumen decía «La cobertura es del registro, no adherencia: qué hay y qué falta, sin
calificar». La palabra estaba para negarla, pero estaba en pantalla. Ahora dice «es del registro: qué hay y qué
falta, sin calificar».

**Lo que no se repitió.** La pasada de los siete recorridos es la de la parte 5 (sobre 4b84714). Después cambió esa
sola frase, dentro del diálogo de ayuda; los recorridos miran la estructura de la ayuda (su título, sus renglones y sus
muestras), no esa frase.

## Lo que falta de la parte 2

Pendiente: la composición propia de «comparar etapas» (C-12) y del ejercicio (C-21), y el origen de un dato en el
lugar de la lectura (C-13). Las tres cambian comprobaciones de riesgo alto de los recorridos (las de las etapas y las
del origen): conviene hacerlas después de que Dirección use Analizar como quedó.
