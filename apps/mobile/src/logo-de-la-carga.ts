/**
 * PG-02 de WP-PULIDO-GRANDES (DL-173): en la pantalla de carga, el logo redondo de BE llena el aro, sin el texto «BE»
 * adentro. Es lógica pura, para que la prueba (`carga.test.ts`, TEST-PG-002) fije la cuenta sin teléfono.
 *
 * El isotipo (`assets/isotipo.png`, 512 × 512) es una esfera con un brillo alrededor: la esfera opaca ocupa 455 de los
 * 512 px (medido en el archivo, del píxel 25 al 480 en el centro, con opacidad mayor a 250). Para que llene el aro sin
 * dejar un borde vacío, el lado de la imagen es el diámetro del aro dividido por esa proporción, redondeado hacia arriba:
 * el brillo de la imagen queda por fuera del aro, sobre el brillo del emblema, y el aro de 2 dp tapa el canto.
 */

/** El lado del emblema, con su brillo circular. */
export const LADO_DEL_EMBLEMA = 168;
/** El radio del aro que rodea al logo. */
export const RADIO_DEL_ARO = 66;
/** La parte del isotipo que ocupa la esfera opaca: 455 de 512 px. */
export const PROPORCION_DE_LA_ESFERA = 455 / 512;

/** El lado de la imagen para que la esfera llene un aro de `radio`: nunca más chica que el aro. */
export const ladoParaLlenarElAro = (radio: number, proporcion: number = PROPORCION_DE_LA_ESFERA): number => Math.ceil((2 * radio) / proporcion);

/** El lado del logo en la carga: 149 dp, para el aro de 132 dp. */
export const LADO_DEL_LOGO_DE_LA_CARGA = ladoParaLlenarElAro(RADIO_DEL_ARO);
