# Los íconos nuevos de la APK, revisados a 18, 20 y 24 dp (AV-09)

**Qué se revisó.** Los dos íconos que suma WP-APP-VUELTA-DE-ROSCA (DL-166) a la familia de BE
(`packages/domain/src/iconos.ts`): `habitos`, un reloj envuelto por una flecha circular, y `engranaje`, el de los ajustes
del descanso. El de Perfil es `persona`, que ya era de la familia y pasa del avatar a la barra.

**Cómo.** `lamina.mjs` dibuja los dos con el dominio compilado, a 18, 20, 24 y 48 dp, en Claro y en Azul noche, en el
color del texto y en el del acento, junto a cuatro vecinos de la familia (`reloj`, `descanso`, `persona`, `novedades`).
Las capturas se sacaron con Chrome sin ventana el 2026-11-07:

- `lamina-1x.png`: un píxel por dp, el caso más exigente;
- `lamina-2x625.png`: 2,625 píxeles por dp, como un teléfono de unos 420 ppp.

**Lo que se ve.**

- `habitos` se lee a 18 dp en los dos temas: la flecha y las agujas no se empastan, y se distingue de `reloj` por la
  punta de la flecha.
- `engranaje` a 18 dp, con un píxel por dp, queda denso pero se reconocen los ocho dientes y el eje. A 2,625× se ve
  limpio. Va a 20 dp junto al bloque del descanso, dentro de un botón de 48 dp.
- Los dos tienen el trazo de 1,75 de la familia, sin color propio, y nada lleno. `iconos.test.ts` (dominio) cuida esas
  reglas.

**Lo que falta.** Verlos en el teléfono de Dirección, con la candidata (AV-16).
