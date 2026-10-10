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

## Partes 2 a 5

Pendientes.
