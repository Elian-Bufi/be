/**
 * UF-08 de WP-USO-FINAL (DL-169): si esta build muestra los avisos de prueba. Lo deciden el ambiente del build (`APP_ENV`,
 * del perfil de `eas.json`) y el interruptor `BE_AVISOS_DE_PRUEBA`, los dos en `app.config.ts`, con la regla del dominio
 * (`muestraLosAvisosDePrueba`): en producción nunca; en `test`, salvo con `BE_AVISOS_DE_PRUEBA=no`, para mostrar BE como
 * la app final (pedido de Dirección del 2026-11-11). Es de la build, no de la sesión: se lee una vez, al cargar la app.
 *
 * Los textos son los de `AVISOS_DE_PRUEBA`, del dominio, y cada pantalla que los usa pasa por esta constante: ninguna los
 * escribe por su cuenta (TEST-UF-012). La línea de identidad del build en la Bienvenida (07 §34) no es un aviso: sigue.
 */
import { muestraLosAvisosDePrueba } from '@be/domain';
import { extra } from './api';

export const AVISOS_DE_PRUEBA_VISIBLES = muestraLosAvisosDePrueba(extra.appEnv, extra.avisosDePrueba);
