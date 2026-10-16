/**
 * `todasLasPaginas` (cliente-http.ts): leer una lista entera siguiendo su cursor, para una pantalla que la cuenta o
 * busca en ella (WP-ESCRITORIO-AMABLE, parte 5: los pendientes de la cartera). Una cantidad dicha sobre una lista a
 * medias sería un número que no es.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todasLasPaginas, type Resultado } from './cliente-http';

interface Pagina {
  readonly data: readonly number[];
  readonly page: { readonly limit: number; readonly nextCursor: string | null; readonly hasMore: boolean };
  readonly primeraDe: number;
}
type Falla = Extract<Resultado<Pagina>, { readonly ok: false }>;
const VENCIDO: Falla = { ok: false, tipo: 'API', status: 400, codigo: 'INVALID_CURSOR', issues: [] };

/** Una lista de `total` elementos, que anota cada pedido y sirve de a lo que se le pide. */
function lista(total: number, { fallarEn = null, vencerEn = null }: { fallarEn?: { pedido: number; falla: Falla } | null; vencerEn?: number | null } = {}) {
  const pedidos: { cursor: string | null; limit: string }[] = [];
  const pedir = async (filtro: { cursor?: string; limit: string }): Promise<Resultado<Pagina>> => {
    pedidos.push({ cursor: filtro.cursor ?? null, limit: filtro.limit });
    if (fallarEn && pedidos.length === fallarEn.pedido) return fallarEn.falla;
    if (vencerEn !== null && pedidos.length === vencerEn) return VENCIDO;
    const desde = filtro.cursor ? Number(filtro.cursor) : 0;
    const hasta = Math.min(total, desde + Number(filtro.limit));
    const hayMas = hasta < total;
    return { ok: true, datos: { data: Array.from({ length: hasta - desde }, (_, i) => desde + i), page: { limit: Number(filtro.limit), nextCursor: hayMas ? String(hasta) : null, hasMore: hayMas }, primeraDe: desde } };
  };
  return { pedir, pedidos };
}
const hasta = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

test('una lista que entra en una página se lee con un solo pedido, de a 50, y queda completa', async () => {
  const { pedir, pedidos } = lista(3);
  const r = await todasLasPaginas(pedir);
  assert.ok(r.ok);
  assert.deepEqual(r.datos.data, [0, 1, 2]);
  assert.equal(r.datos.completa, true);
  assert.deepEqual(pedidos, [{ cursor: null, limit: '50' }]);
  assert.equal(r.datos.primera.primeraDe, 0, 'la primera página queda a mano, con lo que la respuesta dice además de la lista');
});

test('una lista de varias páginas se lee siguiendo el cursor, sin repetir ni perder, en su orden', async () => {
  const { pedir, pedidos } = lista(120);
  const r = await todasLasPaginas(pedir);
  assert.ok(r.ok);
  assert.deepEqual(r.datos.data, hasta(120));
  assert.equal(r.datos.completa, true);
  assert.deepEqual(
    pedidos.map((p) => p.cursor),
    [null, '50', '100'],
  );
  assert.equal(r.datos.primera.primeraDe, 0, 'la «primera» es la primera, no la última leída');
});

test('con más páginas que el tope, la lista queda marcada como incompleta: sus cantidades son «al menos»', async () => {
  const { pedir, pedidos } = lista(500);
  const r = await todasLasPaginas(pedir, { maximoDePaginas: 4 });
  assert.ok(r.ok);
  assert.equal(r.datos.data.length, 200);
  assert.equal(r.datos.completa, false);
  assert.equal(pedidos.length, 4);
  // Justo en el tope, sin nada más por leer, está completa.
  const justa = await todasLasPaginas(lista(200).pedir, { maximoDePaginas: 4 });
  assert.ok(justa.ok);
  assert.deepEqual([justa.datos.data.length, justa.datos.completa], [200, true]);
  // El tamaño de la página es el que se pide.
  const deADiez = lista(25);
  const d = await todasLasPaginas(deADiez.pedir, { limite: 10 });
  assert.ok(d.ok);
  assert.deepEqual(d.datos.data, hasta(25));
  assert.deepEqual(deADiez.pedidos, [
    { cursor: null, limit: '10' },
    { cursor: '10', limit: '10' },
    { cursor: '20', limit: '10' },
  ]);
});

test('si el cursor vence a mitad de camino, se empieza de nuevo una vez y no queda nada repetido', async () => {
  const { pedir, pedidos } = lista(120, { vencerEn: 2 });
  const r = await todasLasPaginas(pedir);
  assert.ok(r.ok);
  assert.deepEqual(r.datos.data, hasta(120), 'lo leído antes del cursor vencido no se suma dos veces');
  assert.deepEqual(
    pedidos.map((p) => p.cursor),
    [null, '50', null, '50', '100'],
  );
});

test('un cursor que vence dos veces es una falla: no se reintenta sin fin', async () => {
  let pedidos = 0;
  const pedir = async (filtro: { cursor?: string; limit: string }): Promise<Resultado<Pagina>> => {
    pedidos += 1;
    // Un tope propio de la prueba: si la lectura reintentara sin fin, la prueba tiene que fallar, no quedarse colgada.
    if (pedidos > 40) return { ok: false, tipo: 'RED' };
    if (filtro.cursor) return VENCIDO;
    return { ok: true, datos: { data: [1], page: { limit: 1, nextCursor: 'x', hasMore: true }, primeraDe: 0 } };
  };
  const r = await todasLasPaginas(pedir);
  assert.deepEqual(r, VENCIDO);
  assert.equal(pedidos, 4, 'la primera vez y una sola vuelta a empezar: dos pedidos cada una');
});

test('una falla corta la lectura y es el resultado: con una parte de la lista no se dice ningún número', async () => {
  const limite: Falla = { ok: false, tipo: 'API', status: 429, codigo: 'RATE_LIMITED', issues: [] };
  assert.deepEqual(await todasLasPaginas(lista(120, { fallarEn: { pedido: 1, falla: limite } }).pedir), limite);
  const enLaSegunda = lista(120, { fallarEn: { pedido: 2, falla: { ok: false, tipo: 'RED' } } });
  assert.deepEqual(await todasLasPaginas(enLaSegunda.pedir), { ok: false, tipo: 'RED' });
  assert.equal(enLaSegunda.pedidos.length, 2, 'después de la falla no se pide nada más');
  // Un cursor vencido en la primera página (sin cursor) no es «la lista cambió»: es una falla como cualquiera.
  const raro = lista(10, { vencerEn: 1 });
  assert.deepEqual(await todasLasPaginas(raro.pedir), VENCIDO);
  assert.equal(raro.pedidos.length, 1);
});
