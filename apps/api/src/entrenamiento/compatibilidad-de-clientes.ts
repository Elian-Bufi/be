import { CAPACIDAD_NOTACION_DEL_ESFUERZO } from '@be/domain';
import type { ContextoDeSolicitud } from '../http/contexto';

/**
 * Lo que declara el cliente (`X-BE-Capabilities`, en `ContextoDeSolicitud.capacidades`) y para qué lo usa Entrenamiento
 * (`compatibilidad-de-clientes.ts` del dominio).
 *
 * DL-196 (punto 5; Dirección, 19/11 y 23/11): no hay compatibilidad con APK viejas, todos usan la última. Salió todo lo
 * que trababa o retenía por la versión de la app: activar (API-TRN-12) ya no responde 409 CLIENT_CAPABILITY_REQUIRED por
 * los objetivos por serie ni por el calentamiento, y «Hoy» (API-TRN-14), el período (API-TRN-14-PERIODO), la agenda
 * (API-AGE-01), el detalle (API-TRN-09), abrir el borrador (API-TRN-15) y la sesión para registrar (API-SER-02) entregan
 * el plan a cualquier pedido. La API ya no registra las capacidades declaradas: la tabla `capacidad_de_cliente_declarada`
 * queda en desuso (no se borra; su historia se conserva).
 *
 * Lo que queda es moldear la forma, nunca retener: a quien no declara una capacidad no le salen los campos que su esquema
 * estricto rechazaría. `setKind` (training-set-kinds-1) y los bloques de la sesión (training-session-groups-1) se moldean
 * en el borde, con sus interceptores; la notación del esfuerzo, acá.
 */

/**
 * DL-192 (RPE-D08): si el pedido viene de un cliente que pregunta y muestra el esfuerzo en la notación del plan. Sin la
 * cabecera, no: al titular no le sale `effortNotation`, y su app sigue preguntando el RIR, que se guarda igual.
 */
export const muestraLaNotacionDelEsfuerzo = (ctx: ContextoDeSolicitud): boolean => ctx.capacidades.has(CAPACIDAD_NOTACION_DEL_ESFUERZO);
