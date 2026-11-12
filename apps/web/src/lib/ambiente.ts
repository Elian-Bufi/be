/**
 * WP-USO-FINAL UF-08 (DL-169): si el website muestra los avisos de prueba. Lo decide la regla del dominio
 * (`muestraLosAvisosDePrueba`, la misma de la APK) con dos valores del build, que `next.config.mjs` pasa a `env`:
 * - `BE_AMBIENTE`: el ambiente. Sin definir, `development` con `next dev` y `test` en cualquier otro build (Render no la
 *   define hoy, y `test` es el único ambiente que existe).
 * - `BE_AVISOS_DE_PRUEBA`: el interruptor. «no» los apaga fuera de producción, para mostrar BE como la app final.
 *
 * En producción no aparecen nunca. Los textos viven solo en `AVISOS_DE_PRUEBA` del dominio, y cada pantalla que los usa
 * pasa por esta constante (TEST-UF-012).
 */
import { muestraLosAvisosDePrueba } from '@be/domain';

export const AVISOS_DE_PRUEBA_VISIBLES = muestraLosAvisosDePrueba(process.env.BE_AMBIENTE, process.env.BE_AVISOS_DE_PRUEBA);
