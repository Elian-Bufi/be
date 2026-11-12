/**
 * El nombre obligatorio en la APK (WP-USO-FINAL, UF-01; DEUDA_LEGAJO DL-169, decidida por Dirección el 2026-11-11: «poner
 * el nombre de la persona no puede ser una opción»), como lógica pura, sin React ni teléfono:
 * - **El campo «Nombre y apellido»** (UF-D5), al crear la cuenta con correo o con Google, en «Antes de seguir» y al
 *   cambiarlo en Mis datos: qué dice antes de enviar y con el 422 de la API. La regla es la del dominio
 *   (`problemaDelNombre`), la misma de la API y del website, y los mensajes son los de `MENSAJE_DE_CAMPO`.
 * - **La compuerta «Antes de seguir»** (UF-D4, TEST-UF-005): con cada sesión, la raíz (App.tsx) pregunta qué falta
 *   (API-ACC-07) antes de mostrar nada de la cuenta. Acá está qué muestra con cada respuesta, según cuándo preguntó, y qué
 *   pasa al guardar el nombre.
 *
 * **Sin conexión** (decisión de implementación, para que Dirección la conozca): si la app no puede saber qué falta (sin
 * red, sin respuesta dentro del tope, el servicio no disponible), deja seguir y vuelve a preguntar al volver al primer
 * plano y al cambiar de pantalla; la primera respuesta de la API decide. La app trabaja sin conexión con lo que guarda en
 * el teléfono (el entrenamiento en curso, los formularios), y trabarla sin red castigaría a todas las cuentas por una que
 * es rara: una anterior a DL-169 que nunca completó su nombre. Lo que la API sí dice no se saltea: un paso pendiente se
 * pide, y uno que esta versión no conoce pide actualizar la app.
 */
import {
  CODIGOS_DE_SESION_NO_VALIDA,
  COPY,
  COPY_DEL_NOMBRE,
  COPY_TEXTOS_VIGENTES,
  ISSUE_DEL_NOMBRE,
  MENSAJE_DE_CAMPO,
  conocePasos,
  nombreVisibleValido,
  normalizarNombreVisible,
  problemaDelNombre,
  textoDelPaso,
  versionDeLaApi,
  versionPublicada,
  type ClienteBe,
  type LoQueFaltaParaSeguirResponse,
  type PasoParaSeguir,
  type Resultado,
  type TextoAAceptar,
  type ValidationIssue,
  type VersionDeTexto,
} from '@be/domain';

// ─── El campo «Nombre y apellido» ────────────────────────────────────────────────────────────────

/** El nombre listo para enviar, ya normalizado (sin espacios de más), o lo que dice su campo. */
export type NombreRevisado = { readonly ok: true; readonly nombre: string } | { readonly ok: false; readonly mensaje: string };

const mensajeDelIssue = (codigo: string): string => MENSAJE_DE_CAMPO[codigo] ?? COPY.noDisponible;

/** Antes de enviar: vacío (o solo espacios), «Escribí tu nombre y apellido.»; largo o con invisibles, el de inválido. */
export function revisarElNombre(texto: string): NombreRevisado {
  const nombre = nombreVisibleValido(texto);
  if (nombre !== null) return { ok: true, nombre };
  return { ok: false, mensaje: mensajeDelIssue(problemaDelNombre(texto) === 'FALTA' ? ISSUE_DEL_NOMBRE.REQUERIDO : ISSUE_DEL_NOMBRE.INVALIDO) };
}

/**
 * El mensaje del campo para un rechazo de la API (422) por el nombre: el alta (VALIDATION_FAILED) o el cambio
 * (INVALID_PROFILE_DATA), con el issue DISPLAY_NAME_REQUIRED o INVALID_DISPLAY_NAME. `null` si el rechazo es por otra cosa.
 */
export function mensajeDelNombreEnLaRespuesta(issues: readonly ValidationIssue[]): string | null {
  const delNombre = issues.find((i) => i.code === ISSUE_DEL_NOMBRE.REQUERIDO || i.code === ISSUE_DEL_NOMBRE.INVALIDO);
  return delNombre ? mensajeDelIssue(delNombre.code) : null;
}

// ─── La compuerta «Antes de seguir» (API-ACC-07) ─────────────────────────────────────────────────

/** Lo que muestra la raíz con una sesión, según lo que falta para seguir. */
/**
 * Un texto que «Antes de seguir» pide aceptar: la versión que pide la API y, si esta APK la trae en su catálogo, su texto.
 * Sin él (una versión publicada después de construir la APK), la pantalla lo lee de API-ACC-09 (UF-T57).
 */
export interface TextoPendiente {
  readonly texto: TextoAAceptar;
  readonly versionId: string;
  readonly version: VersionDeTexto | null;
}

export type Compuerta =
  /** Preguntando a la API: todavía no se muestra nada de la cuenta. */
  | { readonly tipo: 'preguntando' }
  /** No falta nada: la app. */
  | { readonly tipo: 'abierta' }
  /** No se pudo saber (sin red, sin respuesta dentro del tope, el servicio no disponible): la app, y se vuelve a preguntar. */
  | { readonly tipo: 'sin-saber' }
  /** Falta el nombre: «Antes de seguir», con el nombre que propone la API (el del perfil profesional) o vacío. */
  | { readonly tipo: 'nombre'; readonly propuesta: string | null }
  /** UF-05: la versión vigente de los términos y de la privacidad, cada una con el texto que esta APK tiene. */
  | { readonly tipo: 'textos'; readonly pendientes: readonly TextoPendiente[] }
  /** Un paso que esta versión no sabe resolver, o una respuesta que no reconoce: hay que actualizar la app. */
  | { readonly tipo: 'actualizar' };

/** Una sesión que la API ya no acepta: la raíz la cierra con su aviso, como cualquier pantalla (`useSesionPerdida`). */
export type SesionPerdida = { readonly tipo: 'sesion-perdida'; readonly motivo: 'sesion-vencida' | 'sesion-no-valida' };

/**
 * Cuándo pregunta la raíz: al empezar la sesión (`al-entrar`), otra vez porque no se supo (`de-nuevo`, con la app en uso) o
 * después de guardar el nombre en «Antes de seguir» (`despues-de-guardar`).
 */
export type MomentoDeLaPregunta = 'al-entrar' | 'de-nuevo' | 'despues-de-guardar';

/**
 * Cuánto espera la raíz la respuesta de API-ACC-07 antes de mostrar la cuenta. Pasado el tope, el pedido se corta y vale
 * como uno sin red: la app deja seguir y vuelve a preguntar. La pregunta llega justo después de iniciar sesión o de
 * verificar la sesión guardada, con la API despierta: diez segundos alcanzan de sobra para una lectura.
 */
export const TOPE_DE_LO_QUE_FALTA_MS = 10_000;

/** Los pasos que «Antes de seguir» sabe pedir en esta versión: el nombre y, desde UF-05, los textos. UF-13 sumará el suyo. */
const PASOS_QUE_PIDE_LA_APK: readonly PasoParaSeguir[] = ['DISPLAY_NAME', 'ACCEPT_TERMS', 'ACKNOWLEDGE_PRIVACY'];

/** Si la app se muestra: no falta nada, o no se pudo saber. */
export const dejaSeguir = (c: Compuerta): boolean => c.tipo === 'abierta' || c.tipo === 'sin-saber';

/** Si la raíz vuelve a preguntar al volver al primer plano y al cambiar de pantalla: solo mientras no se sepa. */
export const vuelveAPreguntar = (c: Compuerta): boolean => c.tipo === 'sin-saber';

const sesionPerdida = (codigo: string): SesionPerdida => ({ tipo: 'sesion-perdida', motivo: codigo === 'SESSION_EXPIRED' ? 'sesion-vencida' : 'sesion-no-valida' });

/** La propuesta de la API como se guardaría (sin espacios de más); `null` si no hay. Si no sirve, lo dice el campo al guardar. */
function propuestaDelNombre(sugerencia: string | null): string | null {
  const propuesta = sugerencia === null ? '' : normalizarNombreVisible(sugerencia);
  return propuesta === '' ? null : propuesta;
}

/**
 * Lo que muestra la raíz con la respuesta de API-ACC-07, o `null` si no cambia nada.
 * - **Sin pasos,** la app. **Con el nombre pendiente,** «Antes de seguir», con la propuesta de la API. **Con los textos**
 *   (UF-05), la versión que pide la API, si esta APK la tiene; si no, actualizar.
 * - **Un paso que esta versión no conoce** (`conocePasos`) o que no sabe pedir, o una respuesta que no reconoce: actualizar
 *   la app. No se saltea.
 * - **La sesión que la API ya no acepta** se cierra.
 * - **Sin saber** (sin red, el tope cumplido, un 5xx, un 429 o cualquier otra falla): al entrar, la app, que vuelve a
 *   preguntar; al volver a preguntar, nada cambia; después de guardar el nombre, la app, porque el nombre ya quedó.
 */
export function compuertaConLaRespuesta(momento: MomentoDeLaPregunta, r: Resultado<LoQueFaltaParaSeguirResponse>): Compuerta | SesionPerdida | null {
  if (r.ok) {
    const pasos = r.datos.data.steps;
    if (pasos.length === 0) return { tipo: 'abierta' };
    const sabePedirlos = conocePasos(pasos) && pasos.every((p) => (PASOS_QUE_PIDE_LA_APK as readonly string[]).includes(p.step));
    if (!sabePedirlos) return { tipo: 'actualizar' };
    const nombre = pasos.find((p) => p.step === 'DISPLAY_NAME');
    if (nombre) return { tipo: 'nombre', propuesta: propuestaDelNombre(nombre.suggestion) };
    // UF-05: los textos, con la versión que pide la API. Si esta APK no la trae (se publicó después), la pantalla la lee de
    // API-ACC-09 (UF-T57, revisión adversarial de la etapa 2): antes pedía actualizar, y la APK del 25/11 bloqueaba a todas
    // las cuentas el día de la publicación. Sin versión, no hay qué mostrar: actualizar.
    const pendientes = pasos.map((p) => ({ texto: textoDelPaso(p.step), versionId: p.suggestion, version: versionPublicada(p.suggestion) }));
    if (pendientes.every((p): p is TextoPendiente => p.texto !== null && p.versionId !== null)) return { tipo: 'textos', pendientes };
    return { tipo: 'actualizar' };
  }
  if (r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) return sesionPerdida(r.codigo);
  // La API contestó que sí, pero con algo que esta versión no sabe leer (un paso con otra forma): lo resuelve la nueva.
  if (r.tipo === 'API' && r.codigo === 'RESPUESTA_NO_RECONOCIDA' && r.status >= 200 && r.status < 300) return { tipo: 'actualizar' };
  return momento === 'de-nuevo' ? null : { tipo: 'sin-saber' };
}

/**
 * La compuerta abierta de la sesión en curso, en memoria y fuera del árbol de React, como la sesión
 * (`sesion-en-memoria.ts`): si Android recrea la pantalla (al cambiar el tamaño de letra), no se vuelve a preguntar. No se
 * guarda en el teléfono: la sesión recuperada al abrir la app vuelve a preguntar.
 */
let abiertaCon: string | null = null;

export const compuertaEnMemoria = {
  abrir(token: string): void {
    abiertaCon = token;
  },
  olvidar(): void {
    abiertaCon = null;
  },
  abierta(token: string): boolean {
    return abiertaCon === token;
  },
};

/** La compuerta de una sesión que empieza: abierta si ya se abrió con ese token en este proceso; si no, se pregunta. */
export const compuertaAlEmpezar = (token: string): Compuerta => (compuertaEnMemoria.abierta(token) ? { tipo: 'abierta' } : { tipo: 'preguntando' });

// ─── Guardar el nombre en «Antes de seguir» (API-ACC-06) ─────────────────────────────────────────

/** Lo que usa guardar el nombre: leer el perfil propio y cambiarlo. */
export type ApiDelNombre = Pick<ClienteBe, 'consultarPerfilPropio' | 'editarPerfilPropio'>;

export type AlGuardarElNombre =
  /** Quedó: la raíz vuelve a preguntar qué falta. */
  | { readonly tipo: 'guardado' }
  /** Lo dice el campo: vacío, largo o con caracteres invisibles (antes de enviar, o el 422 de la API). */
  | { readonly tipo: 'campo'; readonly mensaje: string }
  /** Cambió en otro lugar (409): se volvió a leer. `nombre` es el que quedó, o `null` si no tiene o no se pudo leer. */
  | { readonly tipo: 'cambio-en-otro-lugar'; readonly nombre: string | null; readonly mensaje: string }
  /** No se pudo: sin respuesta (no se sabe si quedó) u otra falla. Se puede volver a intentar. */
  | { readonly tipo: 'aviso'; readonly mensaje: string }
  | SesionPerdida;

function falla(r: Exclude<Resultado<unknown>, { readonly ok: true }>): AlGuardarElNombre {
  if (r.tipo === 'RED') return { tipo: 'aviso', mensaje: COPY.resultadoIncierto };
  if (CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) return sesionPerdida(r.codigo);
  return { tipo: 'aviso', mensaje: r.codigo === 'RATE_LIMITED' ? COPY.demasiadosIntentos : COPY.noDisponible };
}

/**
 * Guarda el nombre (UF-01, punto 4): lee el perfil propio para su versión y lo cambia con `expectedVersion` (API-ACC-06).
 * - Si el perfil ya tiene ese nombre (la respuesta de un intento anterior no llegó, o se completó en otro lugar), no lo
 *   vuelve a escribir: ya está guardado.
 * - Con 409 vuelve a leer, y la pantalla muestra lo que quedó con `cambioEnOtroLugar`.
 * - Un 422 por el nombre vuelve al campo.
 */
export async function guardarElNombre(api: ApiDelNombre, token: string, texto: string): Promise<AlGuardarElNombre> {
  const revisado = revisarElNombre(texto);
  if (!revisado.ok) return { tipo: 'campo', mensaje: revisado.mensaje };
  const leido = await api.consultarPerfilPropio(token);
  if (!leido.ok) return falla(leido);
  if (leido.datos.data.displayName === revisado.nombre) return { tipo: 'guardado' };
  const r = await api.editarPerfilPropio(token, { expectedVersion: leido.datos.data.version, changes: { displayName: revisado.nombre } });
  if (r.ok) return { tipo: 'guardado' };
  if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
    const otra = await api.consultarPerfilPropio(token);
    if (!otra.ok && otra.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(otra.codigo)) return sesionPerdida(otra.codigo);
    return { tipo: 'cambio-en-otro-lugar', nombre: otra.ok ? otra.datos.data.displayName : null, mensaje: COPY_DEL_NOMBRE.cambioEnOtroLugar };
  }
  const delCampo = r.tipo === 'API' ? mensajeDelNombreEnLaRespuesta(r.issues) : null;
  if (delCampo) return { tipo: 'campo', mensaje: delCampo };
  return falla(r);
}

// ─── UF-05 · aceptar la versión vigente de los textos ────────────────────────────────────────────

export type ApiDeLosTextos = Pick<ClienteBe, 'aceptarVersionVigente'>;

export type ApiDelTextoPublicado = Pick<ClienteBe, 'textoPublicado'>;

export type AlCompletarLosTextos =
  /** Cada pendiente con su texto: el de esta APK o el que dio API-ACC-09. */
  | { readonly tipo: 'listos'; readonly pendientes: readonly (TextoPendiente & { readonly version: VersionDeTexto })[] }
  /** La API no tiene esa versión publicada, o devolvió otra: lo resuelve una APK nueva. */
  | { readonly tipo: 'actualizar' }
  /** Sin red u otra falla: se puede volver a intentar. */
  | { readonly tipo: 'sin-respuesta' };

/**
 * UF-T57: completa los pendientes que esta APK no trae en su catálogo con el texto de API-ACC-09, que tiene que ser la
 * versión pedida y del tipo del paso (`versionDeLaApi`). Los que la APK trae no se piden.
 */
export async function completarLosTextos(api: ApiDelTextoPublicado, pendientes: readonly TextoPendiente[]): Promise<AlCompletarLosTextos> {
  const listos: (TextoPendiente & { readonly version: VersionDeTexto })[] = [];
  for (const p of pendientes) {
    if (p.version) {
      listos.push({ ...p, version: p.version });
      continue;
    }
    const r = await api.textoPublicado(p.versionId);
    if (!r.ok) return r.tipo === 'API' && r.status === 404 ? { tipo: 'actualizar' } : { tipo: 'sin-respuesta' };
    const version = versionDeLaApi(r.datos, p.versionId, p.texto);
    if (!version) return { tipo: 'actualizar' };
    listos.push({ ...p, version });
  }
  return { tipo: 'listos', pendientes: listos };
}

export type AlAceptarLosTextos =
  /** Quedaron aceptados: la raíz vuelve a preguntar qué falta. */
  | { readonly tipo: 'aceptados' }
  /** La API dice que la versión ya no es la vigente: se publicó otra después de construir esta APK. Hay que actualizarla. */
  | { readonly tipo: 'actualizar'; readonly mensaje: string }
  /** No se pudo: sin respuesta (no se sabe si quedó) u otra falla. Se puede volver a intentar: aceptar dos veces no duplica. */
  | { readonly tipo: 'aviso'; readonly mensaje: string }
  | SesionPerdida;

/**
 * Acepta, de a uno y en orden, los textos que mostró «Antes de seguir», cada uno con la versión que la pantalla mostró
 * (API-ACC-08; 08 §12.2). Si uno falla, para: los que ya quedaron no se piden de nuevo (API-ACC-07 ya no los lista), y
 * volver a aceptar uno que quedó responde 200 sin otro acto.
 */
export async function aceptarLosTextos(
  api: ApiDeLosTextos,
  token: string,
  pendientes: readonly { readonly texto: TextoAAceptar; readonly version: Pick<VersionDeTexto, 'id'> }[],
): Promise<AlAceptarLosTextos> {
  for (const p of pendientes) {
    const r = await api.aceptarVersionVigente(token, p.texto, p.version.id);
    if (r.ok) continue;
    if (r.tipo === 'RED') return { tipo: 'aviso', mensaje: COPY.resultadoIncierto };
    if (CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) return sesionPerdida(r.codigo);
    if (r.codigo === 'TERMS_VERSION_NOT_ACCEPTABLE' || r.codigo === 'PRIVACY_VERSION_NOT_ACCEPTABLE') return { tipo: 'actualizar', mensaje: COPY_TEXTOS_VIGENTES.cambioDeVersionApk };
    return { tipo: 'aviso', mensaje: r.codigo === 'RATE_LIMITED' ? COPY.demasiadosIntentos : COPY.noDisponible };
  }
  return { tipo: 'aceptados' };
}
