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

## Partes 2 a 5

Pendientes.
