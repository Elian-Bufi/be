/**
 * Avisos de llegada y retorno seguro: propios de la navegación del website. El copy compartido vive en @be/domain.
 */
export { COPY } from '@be/domain';

/** Avisos que la pantalla de login o de inicio puede mostrar al llegar (solo claves conocidas: nada del query se refleja). */
export const AVISOS = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': 'La sesión ya no es válida. Iniciá sesión para continuar.',
  // DL-147: la sesión dura 12 h desde que se inició; al volver a entrar, se vuelve al mismo lugar.
  'sesion-vencida': 'Tu sesión venció. Volvé a entrar para seguir donde estabas.',
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
 * DL-147: las vistas a las que se puede volver en cada ruta después de entrar de nuevo. Un pedido de información a medio
 * armar (`vista=pedir`) no se retoma, como antes: lo escrito no se guardó.
 */
const VISTAS_DEL_RETORNO: Readonly<Record<string, ReadonlySet<string>>> = {
  '/pro/advisees': new Set(['resumen', 'linea', 'analizar']),
  '/pro/advisees/nutrition': new Set(['resumen', 'plan', 'registros', 'revisiones']),
  '/pro/advisees/training': new Set(['resumen', 'plan', 'ejecuciones', 'revisiones']),
  '/pro/advisees/anthropometry': new Set(['evaluaciones', 'evolucion', 'lamina']),
  '/pro/advisees/forms': new Set(['solicitudes']),
};
const DIAS_DE_UN_ATAJO: ReadonlySet<string> = new Set(['7', '30', '90', '365']);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Retorno seguro después del login (10-B01:1146-1189): solo rutas propias conocidas, con el identificador de la ruta
 * (`id`, o `receta` en «Mis recetas») con forma de UUID. Desde DL-147 también vuelve a la misma vista y al mismo
 * período (`vista` de las de esa ruta; `p`, un atajo de días; o `desde` y `hasta`, dos fechas). Cualquier otra cosa
 * (otro origen, otro parámetro, un valor con otra forma, `//`) vuelve a Cuenta. Lo que se escribe en un buscador o en
 * una nota nunca viaja en la dirección: no hay nada de eso que conservar.
 */
export function destinoSeguro(valor: string | null): string {
  if (!valor) return '/account';
  if (RUTAS_DE_RETORNO.has(valor)) return valor;
  const corte = valor.indexOf('?');
  if (corte < 0) return '/account';
  const ruta = valor.slice(0, corte);
  if (!RUTAS_CON_ID.has(ruta)) return '/account';
  const parametro = PARAMETRO_DEL_ID[ruta] ?? 'id';
  const pares = valor.slice(corte + 1).split('&').map((p) => p.split('='));
  if (pares.some((p) => p.length !== 2) || new Set(pares.map(([n]) => n)).size !== pares.length) return '/account';
  const de = new Map(pares.map(([n, v]) => [n, v] as const));
  const id = de.get(parametro);
  if (!id || !UUID.test(id)) return '/account';
  const vista = de.get('vista');
  const p = de.get('p');
  const desde = de.get('desde');
  const hasta = de.get('hasta');
  const conocidos = new Set([parametro, 'vista', 'p', 'desde', 'hasta']);
  if ([...de.keys()].some((n) => !conocidos.has(n))) return '/account';
  if (vista !== undefined && !VISTAS_DEL_RETORNO[ruta]?.has(vista)) return '/account';
  if (p !== undefined && !DIAS_DE_UN_ATAJO.has(p)) return '/account';
  if ((desde === undefined) !== (hasta === undefined) || (desde !== undefined && (!FECHA.test(desde) || !FECHA.test(hasta ?? '') || p !== undefined))) return '/account';
  return [`${ruta}?${parametro}=${id}`, vista ? `vista=${vista}` : null, p ? `p=${p}` : null, desde ? `desde=${desde}&hasta=${hasta}` : null].filter(Boolean).join('&');
}

/**
 * DL-147: el retorno de la página que se está mirando cuando hay que volver a entrar: su ruta y, de su dirección, solo el
 * identificador, la vista y el período, validados por `destinoSeguro`. Si así no da un destino propio, el que pidió la
 * página. Los parámetros que no se conservan (un filtro, una métrica) se pierden: volver es a la misma vista, no al mismo
 * estado de cada control.
 */
export function retornoDeLaPagina(ruta: string, busqueda: string, pedido: string): string {
  const limpia = ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta;
  const p = new URLSearchParams(busqueda);
  const partes = ['id', 'receta', 'vista', 'p', 'desde', 'hasta'].filter((n) => p.has(n)).map((n) => `${n}=${p.get(n)}`);
  const seguro = destinoSeguro(partes.length > 0 ? `${limpia}?${partes.join('&')}` : limpia);
  return seguro !== '/account' || limpia === '/account' ? seguro : pedido;
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
