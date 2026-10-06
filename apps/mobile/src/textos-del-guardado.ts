/**
 * Lo que dice la sesión enfocada sobre dónde está guardado lo registrado (precierre del 2026-10-06, §1). Es un módulo
 * puro para que las pruebas comprueben el texto de cada estado, no solo el estado.
 *
 * Nunca «guardada en el teléfono» antes de que la escritura que la incluye termine bien, ni «enviado» sin que el servicio
 * lo tenga. Cuando falla el guardado en el teléfono o no se pudo leer lo guardado, se dice qué se pierde si se cierra la
 * app, y se ofrece reintentar.
 */
import type { EstadoDelGuardado, EstadoDeSincronizacion } from './almacen-de-entrenamiento';
import type { FilaDeLaTabla, ProteccionDeSerie } from './series-de-la-sesion';

export const TEXTOS_DEL_GUARDADO = {
  fila: {
    'en-el-telefono': 'Guardada en el teléfono',
    guardando: 'Guardando en el teléfono…',
    'solo-en-la-app': 'Solo en la app: todavía no está guardada en el teléfono',
  } satisfies Readonly<Record<ProteccionDeSerie, string>>,
  guardadaEnBe: 'Guardada',
  enConflicto: 'En conflicto',
  pendienteEnElTelefono: 'Guardado en el teléfono; falta enviarlo.',
  pendienteGuardando: 'Guardando en el teléfono…',
  enviadoAlServicio: 'Enviado: está guardado en BE.',
  noSePudoEnviar: 'No se pudo enviar.',
  quedaEnElTelefono: 'Queda guardado en el teléfono.',
  falloAlGuardarTitulo: 'No pudimos guardar en el teléfono',
  falloAlGuardar: 'Lo que registraste sigue en la app, pero todavía no está protegido: si la cerrás, se pierde.',
  loEnviadoEstaEnBe: 'Lo que ya se envió está guardado en BE.',
  reintentarGuardar: 'Reintentar guardar',
  sinLeerTitulo: 'No pudimos leer lo que había guardado en este teléfono',
  sinLeer: 'No lo borramos ni lo pisamos. Lo que registres ahora queda solo en la app hasta que podamos leerlo: si la cerrás, se pierde.',
  reintentarLeer: 'Reintentar',
} as const;

/** El texto del estado de una fila de la tabla: una pendiente de enviar dice dónde está. */
export function textoDeEstadoDeFila(f: Pick<FilaDeLaTabla, 'estado' | 'proteccion'>): string | null {
  switch (f.estado) {
    case 'guardada':
      return TEXTOS_DEL_GUARDADO.guardadaEnBe;
    case 'pendiente-de-enviar':
      return TEXTOS_DEL_GUARDADO.fila[f.proteccion ?? 'guardando'];
    case 'en-conflicto':
      return TEXTOS_DEL_GUARDADO.enConflicto;
    case 'sin-registrar':
      return null;
  }
}

/** El aviso del guardado en el teléfono, si hay algo que avisar: no se pudo leer, o falló una escritura. */
export function avisoDelGuardado(guardado: EstadoDelGuardado, envio: EstadoDeSincronizacion): { readonly titulo: string; readonly textos: readonly string[]; readonly boton: string; readonly accion: 'leer' | 'guardar' } | null {
  const t = TEXTOS_DEL_GUARDADO;
  if (guardado === 'sin-leer') return { titulo: t.sinLeerTitulo, textos: [t.sinLeer], boton: t.reintentarLeer, accion: 'leer' };
  if (guardado === 'fallo-al-guardar') return { titulo: t.falloAlGuardarTitulo, textos: envio === 'sincronizado' ? [t.falloAlGuardar, t.loEnviadoEstaEnBe] : [t.falloAlGuardar], boton: t.reintentarGuardar, accion: 'guardar' };
  return null;
}

/** La línea del envío cuando no hay error ni conflicto: enviado, o pendiente con lo que es cierto del teléfono. */
export function lineaDelEnvio(envio: EstadoDeSincronizacion, guardado: EstadoDelGuardado): string | null {
  if (envio === 'sincronizado') return TEXTOS_DEL_GUARDADO.enviadoAlServicio;
  if (envio === 'pendiente' || envio === 'enviando') return guardado === 'en-el-telefono' ? TEXTOS_DEL_GUARDADO.pendienteEnElTelefono : TEXTOS_DEL_GUARDADO.pendienteGuardando;
  return null;
}
