/**
 * Avisos de llegada y retorno seguro: propios de la navegación del website. El copy compartido vive en @be/domain.
 */
export { COPY } from '@be/domain';

/** Avisos que la pantalla de login o de inicio puede mostrar al llegar (solo claves conocidas: nada del query se refleja). */
export const AVISOS = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': 'La sesión ya no es válida. Iniciá sesión para continuar.',
  reautenticar: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
  'cierre-registrado': 'Solicitud de cierre registrada.',
} as const;

export type ClaveDeAviso = keyof typeof AVISOS;

export function avisoDe(valor: string | null): string | null {
  return valor && Object.hasOwn(AVISOS, valor) ? AVISOS[valor as ClaveDeAviso] : null;
}

/** Rutas propias a las que se puede volver después del login. */
const RUTAS_DE_RETORNO: ReadonlySet<string> = new Set(['/account', '/account/relationships', '/account/privacy', '/pro']);
/** Rutas que llevan un identificador opaco en el query (el export estático no admite segmentos dinámicos, DL-041). */
const RUTAS_CON_ID: ReadonlySet<string> = new Set(['/account/relationships/detail', '/account/relationships/consent', '/pro/advisees', '/pro/advisees/nutrition', '/pro/advisees/anthropometry']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retorno seguro después del login (10-B01:1146-1189): solo rutas propias conocidas, y como único parámetro un `id`
 * con forma de UUID. Cualquier otra cosa (otro origen, otro parámetro, `//`) vuelve a Cuenta.
 */
export function destinoSeguro(valor: string | null): string {
  if (!valor) return '/account';
  if (RUTAS_DE_RETORNO.has(valor)) return valor;
  const corte = valor.indexOf('?');
  if (corte < 0) return '/account';
  const ruta = valor.slice(0, corte);
  const id = valor.slice(corte + 1).match(/^id=([^&]*)$/)?.[1];
  return RUTAS_CON_ID.has(ruta) && id && UUID.test(id) ? `${ruta}?id=${id}` : '/account';
}
