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

## Partes 1 a 5

Pendientes.
