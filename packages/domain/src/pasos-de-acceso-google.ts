/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): qué hace la pantalla con cada respuesta de la familia GOO. Una sola regla para
 * el website y la APK (09v7 T21), en los tres momentos: entrar (API-GOO-01), vincular con la contraseña (API-GOO-02) y
 * crear la cuenta (API-GOO-03).
 * - **La sesión** se guarda exactamente como la de API-ACC-02, y la pantalla sigue igual que después del login.
 * - **GOOGLE_LINK_REQUIRED y GOOGLE_ACCOUNT_NOT_FOUND** llevan a su paso, con el correo de la cuenta de Google que trajo
 *   la API (nunca se vincula ni se crea sola: UC-E05 E02).
 * - **Lo que se corrige en el mismo paso** (la contraseña al vincular, la casilla de mayoría de edad al crear) vuelve como
 *   error de ese campo.
 * - **Lo demás es un aviso.** `reiniciar` dice si lo que dio Google ya no sirve (no se pudo verificar, otra cuenta, Google
 *   no disponible): la pantalla vuelve al correo y la contraseña, que siguen siempre a mano (UC-E05 E01), y para seguir con
 *   Google hay que volver a elegir la cuenta. Sin `reiniciar`, la persona puede reintentar en el mismo paso.
 * Los textos son los del copy compartido: ninguna pantalla muestra un código técnico.
 */
import type { Resultado } from './cliente-http';
import type { IniciarSesionResponse } from './contratos';
import { COPY, MENSAJE_DE_CAMPO } from './copy';
import { COPY_ACCESO_GOOGLE } from './copy-acceso-google';
import { ISSUE_DE_MAYORIA_DE_EDAD } from './mayoria-de-edad';
import { Superficie } from './procedencia';

/** Las tres operaciones de la familia GOO, vistas desde la pantalla. */
export type OperacionDeGoogle = 'ENTRAR' | 'VINCULAR' | 'CREAR';

export type PasoDeAccesoConGoogle =
  /** La sesión de BE, como la de API-ACC-02. `fechaDelServidor`: la cabecera `Date`, para la APK (en la web no llega). */
  | { readonly tipo: 'SESION'; readonly sesion: IniciarSesionResponse; readonly fechaDelServidor: string | null }
  /** Hay una cuenta BE con contraseña y ese correo: confirmar la contraseña para vincular (API-GOO-02). */
  | { readonly tipo: 'VINCULAR'; readonly correo: string }
  /** Ninguna cuenta BE tiene esa cuenta de Google ni ese correo: el alta con sus tres casillas (API-GOO-03). */
  | { readonly tipo: 'CREAR'; readonly correo: string }
  /** Se corrige en el mismo paso. */
  | { readonly tipo: 'CAMPO'; readonly campo: 'contrasena' | 'mayoriaDeEdad'; readonly mensaje: string }
  | { readonly tipo: 'AVISO'; readonly mensaje: string; readonly reiniciar: boolean };

const aviso = (mensaje: string, reiniciar: boolean): PasoDeAccesoConGoogle => ({ tipo: 'AVISO', mensaje, reiniciar });

/** Los textos cambiaron mientras la persona completaba el paso: el website se recarga; la APK, se actualiza. */
const versionDesactualizada = (superficie: Superficie): string => (superficie === Superficie.APK ? COPY.versionDesactualizadaApk : COPY.versionDesactualizada);

export function pasoDeAccesoConGoogle(operacion: OperacionDeGoogle, resultado: Resultado<IniciarSesionResponse>, superficie: Superficie): PasoDeAccesoConGoogle {
  if (resultado.ok) return { tipo: 'SESION', sesion: resultado.datos, fechaDelServidor: resultado.fechaDelServidor ?? null };
  // Sin respuesta no se sabe si ocurrió. Reintentar es seguro: entrar no cambia nada, el alta con Google es idempotente
  // por la cuenta de Google y repetir la vinculación no duplica nada (DL-138, D-6 y D-8).
  if (resultado.tipo === 'RED') return aviso(COPY.resultadoIncierto, false);
  switch (resultado.codigo) {
    case 'GOOGLE_LINK_REQUIRED':
      return resultado.correoDeGoogle ? { tipo: 'VINCULAR', correo: resultado.correoDeGoogle } : aviso(COPY_ACCESO_GOOGLE.noDisponible, true);
    case 'GOOGLE_ACCOUNT_NOT_FOUND':
      return resultado.correoDeGoogle ? { tipo: 'CREAR', correo: resultado.correoDeGoogle } : aviso(COPY_ACCESO_GOOGLE.noDisponible, true);
    case 'GOOGLE_TOKEN_INVALID':
      // UC-E05 E03. También cuando lo que dio Google venció (dura una hora) mientras la persona estaba en un paso.
      return aviso(COPY_ACCESO_GOOGLE.tokenInvalido, true);
    case 'GOOGLE_EMAIL_NOT_VERIFIED':
      return aviso(COPY_ACCESO_GOOGLE.correoNoVerificado, true);
    case 'GOOGLE_ACCOUNT_ALREADY_LINKED':
      return aviso(COPY_ACCESO_GOOGLE.yaVinculada, true);
    case 'DEPENDENCY_UNAVAILABLE':
      // UC-E05 E01: Google sin configurar en la API o sin responder. El correo y la contraseña siguen.
      return aviso(COPY_ACCESO_GOOGLE.noDisponible, true);
    case 'INVALID_CREDENTIALS':
      // Al vincular es el mismo 401 neutral del login (D-6): la persona vuelve a escribir la contraseña. Al entrar o al
      // crear, es una cuenta que no puede abrir sesión (suspendida o cerrada), y el paso no tiene arreglo.
      return operacion === 'VINCULAR' ? { tipo: 'CAMPO', campo: 'contrasena', mensaje: COPY_ACCESO_GOOGLE.accesoFallido } : aviso(COPY_ACCESO_GOOGLE.accesoFallido, true);
    case 'INVALID_REQUEST':
      // La pantalla no manda una contraseña vacía; si igual pasa, se corrige ahí. Otra cosa es un ID token con otra forma.
      if (operacion === 'VINCULAR' && resultado.issues.some((i) => i.path === 'credential')) return { tipo: 'CAMPO', campo: 'contrasena', mensaje: COPY_ACCESO_GOOGLE.contrasenaRequerida };
      return aviso(COPY_ACCESO_GOOGLE.tokenInvalido, true);
    case 'VALIDATION_FAILED':
      if (resultado.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.REQUERIDA)) {
        return { tipo: 'CAMPO', campo: 'mayoriaDeEdad', mensaje: MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA ?? COPY.noDisponible };
      }
      if (resultado.issues.some((i) => i.code === ISSUE_DE_MAYORIA_DE_EDAD.VERSION_NO_VIGENTE)) return aviso(versionDesactualizada(superficie), false);
      return aviso(COPY.noDisponible, false);
    case 'TERMS_VERSION_NOT_ACCEPTABLE':
    case 'PRIVACY_VERSION_NOT_ACCEPTABLE':
      return aviso(versionDesactualizada(superficie), false);
    case 'REGISTRATION_NOT_AVAILABLE':
      return aviso(COPY.registroNoDisponible, true);
    case 'RATE_LIMITED':
      return aviso(COPY.demasiadosIntentos, false);
    default:
      return aviso(COPY.noDisponible, false);
  }
}
