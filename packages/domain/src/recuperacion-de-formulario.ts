/**
 * Estado de la pantalla «Información que me pidieron» de la APK (API-FRM-05 a FRM-08): el borrador de la persona, qué
 * se puede hacer ahora (responder, corregir o nada) y cómo se recupera después de un envío que no se registró.
 *
 * Es lógica pura. La pantalla (`apps/mobile/src/pantallas/formularios.tsx`) la usa tal cual con `useReducer`, y las
 * pruebas (`recuperacion-de-formulario.test.ts`) ejercitan esta misma lógica. Reglas:
 * - **El borrador** (lo escrito y el motivo) solo se limpia cuando un envío se registra. Ni un rechazo, ni cargar lo
 *   guardado, ni un error de carga lo tocan, y cargar nunca reenvía nada.
 * - **Qué se puede hacer sale del contrato, no de adivinar.** `response: null` no quiere decir «bloqueada»: una
 *   solicitud pendiente válida también lo tiene. Responder exige `status: PENDING` **y** `respondable` de FRM-06, que
 *   es la proyección del PDP. Corregir exige una respuesta con historia resoluble.
 * - **Un rechazo conocido suspende el envío** hasta volver a leer: ya no admite respuesta o corrección, la versión es
 *   vieja, o el envío anterior se guardó. Leer de nuevo **reevalúa** con el contrato y levanta la suspensión si
 *   corresponde (por ejemplo, si se reanudó el vínculo).
 * - **La carga y su reintento son una sola operación con su intención** («abrir» o «recuperar»): si falla la carga de
 *   una recuperación, el reintento sigue siendo una recuperación y termina con el mismo aviso.
 * La clave de idempotencia no vive acá: la maneja `useClaveDeIntento`, y leer no la toca.
 */
import type { Resultado } from './cliente-http';
import type { ListaDeSolicitudesPropiasResponse, RespuestaDeFormulario, SolicitudDeFormulario } from './contratos-formularios';
import { COPY_FORMULARIOS } from './copy-formularios';
import type { DesenlaceDeEnvio } from './errores-de-formulario';

/** Lo leído de la solicitud: FRM-05 (solicitud y respuesta) más `respondable` de FRM-06. */
export interface VistaDeSolicitud {
  readonly status: SolicitudDeFormulario['status'];
  readonly response: Pick<RespuestaDeFormulario, 'effectiveView'> | null;
  readonly respondable: boolean;
}

export type Habilitacion =
  | { readonly modo: 'responder' }
  | { readonly modo: 'corregir' }
  | { readonly modo: 'sin-accion'; readonly motivo: 'no-admite-respuesta' | 'no-admite-correccion' };

/** Qué admite la solicitud según lo leído, con el contrato vigente. */
export function habilitacion(v: VistaDeSolicitud): Habilitacion {
  if (v.response) return v.response.effectiveView.kind === 'NOT_RESOLVABLE' ? { modo: 'sin-accion', motivo: 'no-admite-correccion' } : { modo: 'corregir' };
  return v.status === 'PENDING' && v.respondable ? { modo: 'responder' } : { modo: 'sin-accion', motivo: 'no-admite-respuesta' };
}

export type Intencion = 'abrir' | 'recuperar';
export type Accion = 'recuperar' | 'volver';
export type Suspension = 'no-admite-respuesta' | 'no-admite-correccion' | 'version-desactualizada' | 'envio-anterior-guardado';

export interface EstadoDeFormulario {
  readonly carga: { readonly tipo: 'cargando'; readonly intencion: Intencion } | { readonly tipo: 'error'; readonly intencion: Intencion; readonly sinConexion: boolean } | { readonly tipo: 'lista'; readonly vista: VistaDeSolicitud };
  readonly borrador: { readonly valores: Readonly<Record<string, string>>; readonly motivo: string };
  /** Por qué no se pudo enviar o por qué ahora no se puede: se muestra junto al botón, con sus acciones. */
  readonly problema: { readonly titulo: string; readonly lineas: readonly string[]; readonly incierto: boolean; readonly acciones: readonly Accion[] } | null;
  readonly aviso: { readonly tipo: 'exito' | 'info'; readonly texto: string } | null;
  /** Un rechazo conocido suspende el envío hasta volver a leer. */
  readonly suspension: Suspension | null;
  /** El borrador no se envió: se dice junto a los campos. */
  readonly borradorSinEnviar: boolean;
}

export const estadoInicialDeFormulario: EstadoDeFormulario = {
  carga: { tipo: 'cargando', intencion: 'abrir' },
  borrador: { valores: {}, motivo: '' },
  problema: null,
  aviso: null,
  suspension: null,
  borradorSinEnviar: false,
};

export type EventoDeFormulario =
  | { readonly tipo: 'cargar'; readonly intencion: Intencion }
  | { readonly tipo: 'carga-fallida'; readonly sinConexion: boolean }
  | { readonly tipo: 'carga-lista'; readonly vista: VistaDeSolicitud }
  | { readonly tipo: 'editar-valor'; readonly fieldCode: string; readonly valor: string }
  | { readonly tipo: 'editar-motivo'; readonly motivo: string }
  | { readonly tipo: 'enviando' }
  | { readonly tipo: 'problema-local'; readonly titulo: string }
  | { readonly tipo: 'rechazado'; readonly desenlace: DesenlaceDeEnvio }
  | { readonly tipo: 'fallo'; readonly titulo: string; readonly incierto: boolean }
  | { readonly tipo: 'enviado'; readonly texto: string };

type DesenlaceRecuperable = Extract<DesenlaceDeEnvio, { tipo: 'ya-no-se-puede' | 'version-vieja' | 'envio-anterior-guardado' }>;

function suspensionDe(d: DesenlaceRecuperable): Suspension {
  if (d.tipo === 'ya-no-se-puede') return d.sobre === 'respuesta' ? 'no-admite-respuesta' : 'no-admite-correccion';
  return d.tipo === 'version-vieja' ? 'version-desactualizada' : 'envio-anterior-guardado';
}

const accionesDe = (d: DesenlaceRecuperable): readonly Accion[] => d.acciones.map((a) => (a === 'cargar' ? 'recuperar' : a));

export function reducirFormulario(e: EstadoDeFormulario, ev: EventoDeFormulario): EstadoDeFormulario {
  switch (ev.tipo) {
    case 'cargar':
      // Recuperar limpia el problema: el resultado de la lectura va a decir qué pasa ahora. El borrador queda.
      return { ...e, carga: { tipo: 'cargando', intencion: ev.intencion }, problema: ev.intencion === 'recuperar' ? null : e.problema, aviso: ev.intencion === 'recuperar' ? null : e.aviso };
    case 'carga-fallida':
      // La intención se conserva: el reintento es la misma operación.
      return { ...e, carga: { tipo: 'error', intencion: e.carga.tipo === 'lista' ? 'abrir' : e.carga.intencion, sinConexion: ev.sinConexion } };
    case 'carga-lista': {
      const intencion = e.carga.tipo === 'lista' ? 'abrir' : e.carga.intencion;
      const h = habilitacion(ev.vista);
      const base: EstadoDeFormulario = { ...e, carga: { tipo: 'lista', vista: ev.vista }, suspension: null };
      if (intencion !== 'recuperar') return h.modo === 'sin-accion' ? { ...base, suspension: h.motivo } : base;
      // Recuperación: el aviso sale de lo leído, reevaluado con el contrato.
      if (h.modo === 'sin-accion') {
        const titulo = h.motivo === 'no-admite-respuesta' ? COPY_FORMULARIOS.sinRespuestaGuardada : COPY_FORMULARIOS.noSePuedeCorregirYa;
        return { ...base, suspension: h.motivo, borradorSinEnviar: true, problema: { titulo, lineas: [], incierto: false, acciones: ['recuperar', 'volver'] } };
      }
      const texto = h.modo === 'corregir' ? COPY_FORMULARIOS.loGuardadoEstaArriba : COPY_FORMULARIOS.sePuedeResponderDeNuevo;
      return { ...base, borradorSinEnviar: true, problema: null, aviso: { tipo: 'info', texto } };
    }
    case 'editar-valor':
      return { ...e, borrador: { ...e.borrador, valores: { ...e.borrador.valores, [ev.fieldCode]: ev.valor } } };
    case 'editar-motivo':
      return { ...e, borrador: { ...e.borrador, motivo: ev.motivo } };
    case 'enviando':
      return { ...e, problema: null, aviso: null };
    case 'problema-local':
      return { ...e, problema: { titulo: ev.titulo, lineas: [], incierto: false, acciones: [] } };
    case 'rechazado': {
      const d = ev.desenlace;
      if (d.tipo === 'por-campo') return { ...e, problema: { titulo: d.resumen, lineas: d.lineas, incierto: false, acciones: [] } };
      if (d.tipo === 'dato-no-aceptado') return { ...e, problema: { titulo: d.mensaje, lineas: [], incierto: false, acciones: [] } };
      return { ...e, suspension: suspensionDe(d), borradorSinEnviar: true, problema: { titulo: d.mensaje, lineas: [], incierto: false, acciones: accionesDe(d) } };
    }
    case 'fallo':
      return { ...e, problema: { titulo: ev.titulo, lineas: [], incierto: ev.incierto, acciones: [] } };
    case 'enviado':
      return { ...e, borrador: { valores: {}, motivo: '' }, problema: null, suspension: null, borradorSinEnviar: false, aviso: { tipo: 'exito', texto: ev.texto } };
  }
}

/** Se puede enviar: la solicitud lo admite según lo leído y ningún rechazo conocido lo suspendió. */
export function sePuedeEnviar(e: EstadoDeFormulario): boolean {
  return e.carga.tipo === 'lista' && habilitacion(e.carga.vista).modo !== 'sin-accion' && e.suspension === null;
}

/**
 * `respondable` de una solicitud propia, leído de FRM-06 (la proyección del PDP). Recorre las pendientes página por
 * página hasta encontrarla; si no está entre las pendientes, no se puede responder. `null` si la lectura falló.
 */
export async function respondibleDe(
  formRequestId: string,
  listar: (cursor: string | undefined) => Promise<Resultado<ListaDeSolicitudesPropiasResponse>>,
): Promise<Resultado<boolean>> {
  let cursor: string | undefined;
  for (;;) {
    const r = await listar(cursor);
    if (!r.ok) return r;
    const fila = r.datos.data.find((s) => s.formRequestId === formRequestId);
    if (fila) return { ok: true, datos: fila.respondable };
    if (!r.datos.page.hasMore || !r.datos.page.nextCursor) return { ok: true, datos: false };
    cursor = r.datos.page.nextCursor;
  }
}
