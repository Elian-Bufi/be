/**
 * Los avisos push en este teléfono (WP-NOVEDADES-Y-AVISOS, DL-133; RF-062, UC-E08). Lógica sin React ni Expo: el
 * permiso, el token y el almacenamiento llegan de afuera (src/avisos-del-telefono.ts), así se prueba con Node.
 * - **Se activan a pedido.** Nada se pide al abrir la app: el permiso de Android 13 se pide recién al tocar «Activar
 *   avisos» en Cuenta, y si la persona lo niega, se dice cómo darlo después.
 * - **El teléfono es de una cuenta por vez.** El identificador del teléfono lo genera la app una vez y no identifica al
 *   aparato fuera de BE. Si otra cuenta lo registra, la API da de baja la anterior.
 * - **Se recuerda por cuenta.** Activados para esta cuenta en este teléfono, al volver a entrar se renueva el token
 *   (puede cambiar), y al cerrar la sesión se retiran: otra persona que use el teléfono no recibe los de esta cuenta.
 * - **Sin Firebase no hay token** (la APK se construyó sin `google-services.json`): se dice que los avisos no están
 *   disponibles en esta versión, y el centro de novedades sigue funcionando (UC-E08 E02).
 */
import type { Resultado } from '@be/domain';

export type Permiso = 'concedido' | 'denegado' | 'sin-preguntar';

/** El canal del sistema: el permiso y el token de Expo. */
export interface CanalDelTelefono {
  permiso(): Promise<Permiso>;
  pedirPermiso(): Promise<Permiso>;
  /** El token de Expo de este teléfono. Falla si la app no tiene Firebase configurado o no hay red. */
  token(): Promise<string>;
}

/** Un almacenamiento de texto del teléfono (AsyncStorage). */
export interface AlmacenDeAvisos {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

export interface ApiDeAvisos {
  registrar(token: string, deviceId: string, expoPushToken: string): Promise<Resultado<unknown>>;
  retirar(token: string, deviceId: string): Promise<Resultado<unknown>>;
}

export interface DependenciasDeAvisos {
  readonly canal: CanalDelTelefono;
  readonly almacen: AlmacenDeAvisos;
  readonly api: ApiDeAvisos;
  /** Un identificador nuevo para el teléfono (UUID v4). */
  readonly nuevoIdentificador: () => string;
}

/** Cómo están los avisos para esta cuenta en este teléfono. */
export type EstadoDeAvisos =
  | { readonly tipo: 'activos' }
  | { readonly tipo: 'apagados' }
  /** Android no dio el permiso: se da en los ajustes del teléfono. */
  | { readonly tipo: 'sin-permiso' }
  /** Esta versión de la app no puede recibir avisos (sin Firebase), o el sistema no dio un token. */
  | { readonly tipo: 'no-disponibles' }
  /** La API no respondió o rechazó el registro: no se sabe si quedaron activos. */
  | { readonly tipo: 'error'; readonly sinConexion: boolean; readonly resultado: Resultado<unknown> };

const CLAVE_DEL_TELEFONO = 'be.avisos.telefono';
const claveDeLaCuenta = (identidadId: string) => `be.avisos.cuenta.${identidadId.toLowerCase()}`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El identificador de este teléfono para BE: el guardado, o uno nuevo que queda guardado. */
export async function identificadorDelTelefono(d: Pick<DependenciasDeAvisos, 'almacen' | 'nuevoIdentificador'>): Promise<string> {
  const guardado = await d.almacen.leer(CLAVE_DEL_TELEFONO);
  if (guardado && UUID.test(guardado)) return guardado.toLowerCase();
  const nuevo = d.nuevoIdentificador().toLowerCase();
  await d.almacen.guardar(CLAVE_DEL_TELEFONO, nuevo);
  return nuevo;
}

/** Si esta cuenta activó los avisos en este teléfono. */
export async function activosParaLaCuenta(almacen: AlmacenDeAvisos, identidadId: string): Promise<boolean> {
  return (await almacen.leer(claveDeLaCuenta(identidadId))) === 'activos';
}

/** El estado que muestra Cuenta al abrir, sin pedir nada nuevo al sistema ni a la API. */
export async function estadoGuardado(d: Pick<DependenciasDeAvisos, 'almacen' | 'canal'>, identidadId: string): Promise<EstadoDeAvisos> {
  if (!(await activosParaLaCuenta(d.almacen, identidadId))) return { tipo: 'apagados' };
  // Activados, pero la persona sacó el permiso desde los ajustes: se dice, para que no espere avisos que no llegan.
  return (await d.canal.permiso()) === 'concedido' ? { tipo: 'activos' } : { tipo: 'sin-permiso' };
}

/** «Activar avisos»: el permiso (se pide si hace falta), el token y el registro en la API. */
export async function activar(d: DependenciasDeAvisos, sesion: { readonly token: string; readonly identidadId: string }): Promise<EstadoDeAvisos> {
  let permiso = await d.canal.permiso();
  if (permiso !== 'concedido') permiso = await d.canal.pedirPermiso();
  if (permiso !== 'concedido') return { tipo: 'sin-permiso' };
  let expoPushToken: string;
  try {
    expoPushToken = await d.canal.token();
  } catch {
    return { tipo: 'no-disponibles' };
  }
  const telefono = await identificadorDelTelefono(d);
  const r = await d.api.registrar(sesion.token, telefono, expoPushToken);
  if (!r.ok) return { tipo: 'error', sinConexion: r.tipo === 'RED', resultado: r };
  await d.almacen.guardar(claveDeLaCuenta(sesion.identidadId), 'activos');
  return { tipo: 'activos' };
}

/** «Desactivar avisos»: este teléfono deja de recibirlos. Se olvida aunque la API no responda: así no se renuevan. */
export async function desactivar(d: DependenciasDeAvisos, sesion: { readonly token: string; readonly identidadId: string }): Promise<EstadoDeAvisos> {
  const telefono = await identificadorDelTelefono(d);
  await d.almacen.borrar(claveDeLaCuenta(sesion.identidadId));
  const r = await d.api.retirar(sesion.token, telefono);
  return r.ok ? { tipo: 'apagados' } : { tipo: 'error', sinConexion: r.tipo === 'RED', resultado: r };
}

/**
 * Al entrar (o al recuperar la sesión guardada): si esta cuenta los tenía activos, se vuelve a registrar el token, que
 * puede haber cambiado. Sin permiso o sin token, no se hace nada: Cuenta lo dice al abrirla.
 */
export async function renovar(d: DependenciasDeAvisos, sesion: { readonly token: string; readonly identidadId: string }): Promise<void> {
  if (!(await activosParaLaCuenta(d.almacen, sesion.identidadId))) return;
  if ((await d.canal.permiso()) !== 'concedido') return;
  let expoPushToken: string;
  try {
    expoPushToken = await d.canal.token();
  } catch {
    return;
  }
  await d.api.registrar(sesion.token, await identificadorDelTelefono(d), expoPushToken);
}

/**
 * Al cerrar la sesión: si esta cuenta tenía los avisos activos en este teléfono, se retiran (lo mejor posible) y se
 * olvida que estaban activos. Con la sesión vencida la API ya no lo acepta; si después entra otra cuenta y activa los
 * suyos, la API da de baja la anterior.
 */
export async function retirarAlSalir(d: DependenciasDeAvisos, sesion: { readonly token: string; readonly identidadId: string }): Promise<void> {
  if (!(await activosParaLaCuenta(d.almacen, sesion.identidadId))) return;
  await d.almacen.borrar(claveDeLaCuenta(sesion.identidadId));
  await d.api.retirar(sesion.token, await identificadorDelTelefono(d)).catch(() => undefined);
}

/** Si los datos de un aviso son los de BE (09v12 §21): solo entonces tocarlo abre Novedades. */
export function esAvisoDeBe(datos: unknown): boolean {
  const d = datos as { type?: unknown; referenceId?: unknown } | null | undefined;
  return d?.type === 'NEW_INTERNAL_UPDATE' && typeof d.referenceId === 'string';
}
