/**
 * El segundo factor del profesional en `/pro` (WP-USO-FINAL UF-11; DL-169; UF-D12; TEST-UF-014). Lógica pura, sin React:
 * - **La compuerta** (`pasoDelSegundoFactor`): con una sesión, `/pro` pregunta el estado del segundo factor (API-MFA-01)
 *   antes de montar la página. Solo VERIFIED y NOT_REQUIRED dejan pasar; lo demás muestra su paso, que no se saltea. Sin
 *   respuesta, o con una respuesta que no se reconoce, no se deja pasar: se reintenta.
 * - **Un código** (`alEnviarUnCodigo`): qué hacer con lo que respondió API-MFA-02, 03 o 05.
 * La garantía está en el servidor: sin el segundo factor, la API no responde nada de lo profesional (08 §27.2: ocultar un
 * botón no es control de acceso). Esto solo dice qué falta.
 */
import { clasificarFalla, COPY, COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL, type Resultado, type SegundoFactorDeLaSesionResponse } from '@be/domain';

const C = COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL;

/**
 * - `seguir`: verificado, o sin perfil profesional: va la página;
 * - `codigo`: tiene autenticador y falta el código en esta sesión;
 * - `configurar`: sin autenticador, hasta `plazo` (10 minutos después de entrar);
 * - `volver-a-entrar`: sin autenticador y el plazo pasó;
 * - `sin-respuesta`: sin conexión, la API no pudo o respondió algo que no se reconoce. No se deja pasar;
 * - `sesion`: la sesión ya no sirve; se vuelve a Iniciar sesión.
 */
export type PasoDelSegundoFactor =
  | { readonly tipo: 'seguir' }
  | { readonly tipo: 'codigo' }
  | { readonly tipo: 'configurar'; readonly plazo: string }
  | { readonly tipo: 'volver-a-entrar' }
  | { readonly tipo: 'sin-respuesta' }
  | { readonly tipo: 'sesion' };

export function pasoDelSegundoFactor(r: Resultado<SegundoFactorDeLaSesionResponse>): PasoDelSegundoFactor {
  if (!r.ok) return clasificarFalla(r) === 'sesion' ? { tipo: 'sesion' } : { tipo: 'sin-respuesta' };
  const estado = r.datos.data.secondFactor;
  switch (estado.state) {
    case 'NOT_REQUIRED':
    case 'VERIFIED':
      return { tipo: 'seguir' };
    case 'REQUIRED':
      return { tipo: 'codigo' };
    case 'ENROLLMENT_REQUIRED':
      return { tipo: 'configurar', plazo: estado.deadline };
    case 'RECENT_SIGN_IN_REQUIRED':
      return { tipo: 'volver-a-entrar' };
    default:
      return { tipo: 'sin-respuesta' };
  }
}

/**
 * Qué hacer con la respuesta de un código:
 * - `listo`: aceptado;
 * - `campo`: el código no vale; el mensaje va al campo, con los intentos que quedan;
 * - `bloqueado`: el autenticador quedó bloqueado; lo que queda es un código de recuperación;
 * - `releer`: el paso ya no corresponde, o no hubo respuesta (el código pudo haberse aceptado): se vuelve a preguntar el
 *   estado antes de pedir otro, con el aviso si lo hay;
 * - `sesion`: la sesión ya no sirve (cinco códigos que no valen la revocan);
 * - `aviso`: demasiados intentos, o el servicio no pudo.
 */
export type AlEnviarUnCodigo =
  | { readonly tipo: 'listo' }
  | { readonly tipo: 'campo'; readonly mensaje: string }
  | { readonly tipo: 'bloqueado' }
  | { readonly tipo: 'releer'; readonly aviso: string | null }
  | { readonly tipo: 'sesion' }
  | { readonly tipo: 'aviso'; readonly mensaje: string };

export function alEnviarUnCodigo(r: Resultado<unknown>): AlEnviarUnCodigo {
  if (r.ok) return { tipo: 'listo' };
  if (r.tipo === 'RED') return { tipo: 'releer', aviso: COPY.resultadoIncierto };
  if (r.codigo === 'SECOND_FACTOR_INVALID') return { tipo: 'campo', mensaje: C.codigo.invalido(r.intentosRestantes ?? 0) };
  if (r.codigo === 'SECOND_FACTOR_LOCKED') return { tipo: 'bloqueado' };
  if (clasificarFalla(r) === 'sesion') return { tipo: 'sesion' };
  if (r.codigo === 'INVALID_STATE_TRANSITION') return { tipo: 'releer', aviso: null };
  if (r.codigo === 'RATE_LIMITED') return { tipo: 'aviso', mensaje: C.codigo.demasiadosIntentos };
  return { tipo: 'aviso', mensaje: COPY.noDisponible };
}

/** La clave para cargar a mano, en grupos de cuatro (sin el relleno de base32). */
export function claveEnGrupos(secreto: string): string {
  return secreto.replace(/=+$/, '').match(/.{1,4}/g)?.join(' ') ?? secreto;
}
