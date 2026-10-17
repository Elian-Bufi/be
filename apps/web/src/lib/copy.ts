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
const RUTAS_DE_RETORNO: ReadonlySet<string> = new Set(['/account', '/account/relationships', '/account/privacy', '/account/news', '/pro', '/pro/templates', '/pro/recipes', '/pro/exercises', '/pro/news']);
/** Rutas que llevan un identificador opaco en el query (el export estático no admite segmentos dinámicos, DL-041). */
const RUTAS_CON_ID: ReadonlySet<string> = new Set([
  '/account/relationships/detail',
  '/account/relationships/consent',
  '/pro/advisees',
  '/pro/advisees/nutrition',
  '/pro/advisees/anthropometry',
  '/pro/advisees/training',
  '/pro/advisees/forms',
  '/pro/recipes',
]);
/** El nombre del parámetro con el identificador, si no es `id`: «Mis recetas» abre una receta con `?receta=` (DL-119). */
const PARAMETRO_DEL_ID: Readonly<Record<string, string>> = { '/pro/recipes': 'receta' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retorno seguro después del login (10-B01:1146-1189): solo rutas propias conocidas, y como único parámetro el
 * identificador de la ruta (`id`, o `receta` en «Mis recetas») con forma de UUID. Cualquier otra cosa (otro origen,
 * otro parámetro, `//`) vuelve a Cuenta.
 */
export function destinoSeguro(valor: string | null): string {
  if (!valor) return '/account';
  if (RUTAS_DE_RETORNO.has(valor)) return valor;
  const corte = valor.indexOf('?');
  if (corte < 0) return '/account';
  const ruta = valor.slice(0, corte);
  const parametro = PARAMETRO_DEL_ID[ruta] ?? 'id';
  const [nombre, id, ...resto] = valor.slice(corte + 1).split(/[=&]/);
  return RUTAS_CON_ID.has(ruta) && nombre === parametro && resto.length === 0 && id && UUID.test(id) ? `${ruta}?${parametro}=${id}` : '/account';
}

/**
 * El inicio de quien tiene sesión (DL-025; pedido de Dirección del 2026-10-17): el profesional entra a su espacio, y el
 * resto, a Cuenta. Es adonde lleva el login sin un retorno pedido, y adonde lleva la portada con la sesión abierta.
 * La capacidad la informa la API (ACC-05) y solo elige la página: no autoriza nada, porque `/pro` vuelve a preguntar.
 * Sin la respuesta de la API (`null`), Cuenta.
 */
export function inicioPropio(capacidades: readonly string[] | null): '/pro' | '/account' {
  return capacidades?.includes('PROFESSIONAL_WORKSPACE') ? '/pro' : '/account';
}
