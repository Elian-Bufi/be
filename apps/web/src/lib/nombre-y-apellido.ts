/**
 * El nombre y apellido (WP-USO-FINAL UF-01; DL-169: «poner el nombre de la persona no puede ser una opción»). Lógica
 * pura, sin React, que comparten las pantallas que lo piden:
 * - **El campo** (UF-D5: uno solo, «Nombre y apellido»): en el alta con correo, en el alta con Google, en «Antes de
 *   seguir» y en Cuenta. Se valida antes de enviar con la regla de la API (`problemaDelNombre`), y un 422 del nombre
 *   vuelve al campo con el mismo mensaje.
 * - **«Antes de seguir»** (UF-D4): con una sesión, `/account` y `/pro` preguntan primero lo que falta (API-ACC-07). Con
 *   un paso pendiente, en lugar de la página se muestra el paso, que no se puede saltear; sin respuesta, no se deja pasar.
 *   `pasoQueSigue` decide qué se muestra y `alGuardarElNombre`, qué hacer con lo que respondió API-ACC-06.
 */
import {
  clasificarFalla,
  conocePasos,
  COPY,
  ISSUE_DEL_NOMBRE,
  MENSAJE_DE_CAMPO,
  normalizarNombreVisible,
  problemaDelNombre,
  textoDelPaso,
  versionPublicada,
  type LoQueFaltaParaSeguirResponse,
  type TextoAAceptar,
  type VersionDeTexto,
  type PerfilPropio,
  type PerfilPropioResponse,
  type Resultado,
  type ValidationIssue,
} from '@be/domain';

/** El mensaje del campo para lo escrito, o `null` si se puede guardar: vacío (o solo espacios), largo o con invisibles. */
export function errorDelNombre(nombre: string): string | null {
  const problema = problemaDelNombre(nombre);
  if (problema === 'FALTA') return MENSAJE_DE_CAMPO[ISSUE_DEL_NOMBRE.REQUERIDO] ?? COPY.noDisponible;
  if (problema === 'INVALIDO') return MENSAJE_DE_CAMPO[ISSUE_DEL_NOMBRE.INVALIDO] ?? COPY.noDisponible;
  return null;
}

/** El mensaje del campo si un 422 rechazó el nombre (`DISPLAY_NAME_REQUIRED` o `INVALID_DISPLAY_NAME`); si no, `null`. */
export function mensajeDelNombreEn(issues: readonly ValidationIssue[]): string | null {
  const delNombre = issues.find((i) => i.code === ISSUE_DEL_NOMBRE.REQUERIDO || i.code === ISSUE_DEL_NOMBRE.INVALIDO);
  return delNombre ? (MENSAJE_DE_CAMPO[delNombre.code] ?? null) : null;
}

/**
 * Lo que muestra «Antes de seguir» con la respuesta de API-ACC-07:
 * - `seguir`: no falta nada, va la página;
 * - `nombre`: el paso del nombre, con lo que propone la API (el nombre profesional) o `null`;
 * - `textos` (UF-05): la versión vigente de los términos y de la privacidad, cada una con el texto que este website tiene
 *   para esa versión. Van después del nombre;
 * - `desconocido`: la API pide un paso que este website no sabe resolver, o una versión de un texto que no tiene: hay que
 *   recargar (`pasoDesconocidoWeb`);
 * - `sin-respuesta`: sin conexión, la API no pudo responder o respondió algo que no se reconoce. No se deja pasar: se
 *   reintenta;
 * - `sesion`: la sesión ya no sirve; se vuelve a Iniciar sesión.
 */
export type PasoQueSigue =
  | { readonly tipo: 'seguir' }
  | { readonly tipo: 'nombre'; readonly sugerencia: string | null }
  | { readonly tipo: 'textos'; readonly pendientes: readonly { readonly texto: TextoAAceptar; readonly version: VersionDeTexto }[] }
  | { readonly tipo: 'desconocido' }
  | { readonly tipo: 'sin-respuesta' }
  | { readonly tipo: 'sesion' };

export function pasoQueSigue(r: Resultado<LoQueFaltaParaSeguirResponse>): PasoQueSigue {
  if (!r.ok) return clasificarFalla(r) === 'sesion' ? { tipo: 'sesion' } : { tipo: 'sin-respuesta' };
  const pasos = r.datos.data.steps;
  if (pasos.length === 0) return { tipo: 'seguir' };
  // Un paso que no se conoce no se saltea, aunque venga con otros que sí: se resuelven todos o ninguno.
  if (!conocePasos(pasos)) return { tipo: 'desconocido' };
  const primero = pasos[0];
  if (primero?.step === 'DISPLAY_NAME') return { tipo: 'nombre', sugerencia: primero.suggestion?.trim() ? primero.suggestion : null };
  // UF-05: los textos, con la versión que pide la API; si este website no la tiene, recargar trae la nueva.
  const pendientes = pasos.map((p) => ({ texto: textoDelPaso(p.step), version: versionPublicada(p.suggestion) }));
  if (pendientes.every((p): p is { texto: TextoAAceptar; version: VersionDeTexto } => p.texto !== null && p.version !== null)) return { tipo: 'textos', pendientes };
  return { tipo: 'desconocido' };
}

/**
 * Qué hacer con la respuesta de API-ACC-06 al guardar el nombre en «Antes de seguir»:
 * - `guardado`: se vuelve a pedir API-ACC-07 y, si no falta nada, sigue la página;
 * - `releer`: 409 VERSION_CONFLICT, el nombre cambió en otro lugar: se vuelve a leer y se dice (`cambioEnOtroLugar`);
 * - `campo`: 422, el nombre vuelve a su campo con el mensaje;
 * - `sesion`: la sesión ya no sirve;
 * - `aviso`: sin respuesta (no se sabe si se guardó: se reintenta) o el servicio no pudo.
 */
export type AlGuardarElNombre =
  | { readonly tipo: 'guardado' }
  | { readonly tipo: 'releer' }
  | { readonly tipo: 'campo'; readonly mensaje: string }
  | { readonly tipo: 'sesion' }
  | { readonly tipo: 'aviso'; readonly mensaje: string };

export function alGuardarElNombre(r: Resultado<PerfilPropioResponse>): AlGuardarElNombre {
  if (r.ok) return { tipo: 'guardado' };
  if (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return { tipo: 'aviso', mensaje: COPY.resultadoIncierto };
  if (clasificarFalla(r) === 'sesion') return { tipo: 'sesion' };
  if (r.codigo === 'VERSION_CONFLICT') return { tipo: 'releer' };
  if (r.codigo === 'INVALID_PROFILE_DATA') return { tipo: 'campo', mensaje: mensajeDelNombreEn(r.issues) ?? MENSAJE_DE_CAMPO[ISSUE_DEL_NOMBRE.INVALIDO] ?? COPY.noDisponible };
  if (r.codigo === 'RATE_LIMITED') return { tipo: 'aviso', mensaje: COPY.demasiadosIntentos };
  return { tipo: 'aviso', mensaje: COPY.noDisponible };
}

/**
 * Después de un 409, si el nombre que se volvió a leer es justo el que se quería guardar: el intento anterior, que quedó
 * sin respuesta, sí se guardó. Entonces no hay nada que revisar y se sigue.
 */
export const yaSeGuardo = (perfil: PerfilPropio, escrito: string): boolean => perfil.displayName !== null && perfil.displayName === normalizarNombreVisible(escrito);
