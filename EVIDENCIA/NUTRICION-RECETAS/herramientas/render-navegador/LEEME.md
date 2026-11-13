# Maquetas congeladas

Estas maquetas reproducen la APK como era en el paquete de esta evidencia: el contenido llega hasta abajo, con un
relleno, y la barra lleva `VeloDeLaBarra`. Sirven para volver a dibujar las capturas de ese paquete tal como se tomaron.

Desde la vuelta 2 (PR #255), la APK ya no es así. `VeloDeLaBarra` no existe más: el área que se desplaza termina arriba
de la barra y el contenido se apaga en `FundidoSobreLaBarra`. Las dos cosas las decide `lugarDelContenido`
(`apps/mobile/src/disposicion-de-la-barra.ts`), en un solo lugar, `App.tsx`.

**No reusarlas para capturar la barra nueva:** fallan al compilar o muestran el modelo anterior. Para una captura nueva,
copiar de `App.tsx` cómo se arma el área que se desplaza.
