// Lo que comparten varias recetas del recetario del 2026-11-26: las masas caseras (las mismas de la ampliación del
// 2026-10-28: harina, aceite, agua y sal) y sus pasos.

/** La masa casera de tarta (una tartera de 26 cm, solo abajo). */
export const masaDeTarta = () => [['harina', 200], ['girasol', 45], ['agua', 100], ['sal', 3]];
export const PASOS_DE_LA_MASA_DE_TARTA = [
  'Masa: mezclar la harina con la sal, sumar el aceite y el agua y unir sin amasar de más. Tapar y dejar descansar 15 minutos.',
  'Estirar la masa con palo de amasar y forrar una tartera de 26 cm (con papel manteca si se pega). Pinchar el fondo con un tenedor.',
];

/** La masa casera de empanadas para horno (12 tapas de 13 cm, de unos 42 g). */
export const masaDeEmpanadas = () => [['harina', 300], ['girasol', 45], ['agua', 150], ['sal', 4]];
export const PASO_DE_LA_MASA_DE_EMPANADAS =
  'Masa: mezclar la harina con la sal, sumar el aceite y el agua tibia de a poco y amasar 5 minutos, hasta que quede lisa. Tapar y dejar descansar 30 minutos.';
export const PASO_DE_ARMAR_EMPANADAS =
  'Estirar la masa fina y cortar 12 discos de unos 13 cm. Poner en cada uno una cucharada colmada de relleno frío, cerrar con repulgue (o apretando el borde con un tenedor) y acomodar en una placa con papel manteca.';
export const PASO_DE_PINTAR_Y_HORNEAR =
  'Batir el huevo para pintar y pintar las empanadas. Hornear a 220 °C unos 15 a 18 minutos, hasta que estén doradas. Servir 3 por porción. Con sartén: freírlas en aceite caliente 2 minutos por lado y escurrirlas.';
