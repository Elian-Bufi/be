// La reconexión con la API dormida, con demoras reales (precierre del 2026-10-06, §5). No es la APK nativa ni un
// simulador de tiempo: es el módulo REAL de la APK (`apps/mobile/src/sesion-persistente.ts`), compilado para Node, con la
// misma composición que App.tsx (el vigía de los 5 s y `recuperarSesion`, con el cliente compartido y su señal), contra
// la API local real a través de un proxy que demora o falla `/me` como lo haría una API de prueba que despierta.
// - 30 s de demora: a los 5 s, «está tardando»; a los 30 s, la sesión se recupera con un solo pedido.
// - Dos 503 y después la respuesta: se reintenta solo, con las esperas de la APK, sin pedidos superpuestos.
// - 80 s de demora: a los 75 s se corta ese pedido (tiempo agotado), sin lanzar otro; la credencial no se borra.
// - Sin conexión: falla enseguida, con su causa, distinta del tiempo agotado.
// En ninguno se inicia sesión: la recuperación usa la credencial guardada (el límite de intentos de login no cambia).
// Uso: BE_ARNES=<copia del arnés con node_modules> node reconexion-real.mjs   (lee estado.json; escribe reconexion-real.json)
import { ARNES, REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createServer, request } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requerirDelArnes = createRequire(`${ARNES}/package.json`);
const { buildSync } = requerirDelArnes('esbuild');
const d = createRequire(import.meta.url)(`${REPO}/packages/domain/dist/index.js`);
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const CRED = 'clave-sintetica-de-prueba-01';
const API = 'http://localhost:3001';
const PUERTO = 3011;
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 240)}` : ''}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// El módulo de la APK, tal cual, compilado para Node; `@be/domain` es el dominio compilado del repo.
const salida = fileURLToPath(enTrabajo('sesion-persistente.cjs'));
buildSync({
  entryPoints: [`${REPO}/apps/mobile/src/sesion-persistente.ts`],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: salida,
  alias: { '@be/domain': `${REPO}/packages/domain/dist/index.js` },
  logLevel: 'silent',
});
const sp = createRequire(import.meta.url)(salida);

// El proxy: reenvía todo a la API y aplica el escenario a `/api/v1/me`. Cuenta pedidos, superposición e inicios de sesión.
let escenario = { demoraMs: 0, fallas503: 0 };
let enCurso = 0;
let maximoEnCurso = 0;
let pedidosDeMe = [];
let iniciosDeSesion = 0;
let cortadosPorElCliente = 0;
const proxy = createServer((req, res) => {
  const t0 = Date.now();
  const esMe = req.url?.startsWith('/api/v1/me') && !req.url.startsWith('/api/v1/me/');
  if (req.url?.startsWith('/api/v1/auth/sessions')) iniciosDeSesion++;
  if (!esMe) return reenviar(req, res);
  enCurso++;
  maximoEnCurso = Math.max(maximoEnCurso, enCurso);
  pedidosDeMe.push(t0);
  let cerrado = false;
  const terminar = () => {
    if (!cerrado) {
      cerrado = true;
      enCurso--;
    }
  };
  res.on('finish', terminar);
  res.on('close', () => {
    if (!res.writableEnded) cortadosPorElCliente++;
    terminar();
  });
  if (escenario.fallas503 > 0) {
    escenario.fallas503--;
    res.writeHead(503, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: { code: 'DB_UNAVAILABLE', message: 'El servicio no está disponible. Probá de nuevo más tarde.' } }));
  }
  const espera = setTimeout(() => reenviar(req, res), escenario.demoraMs);
  res.on('close', () => clearTimeout(espera));
});
function reenviar(req, res) {
  const r = request({ hostname: 'localhost', port: 3001, path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost:3001' } }, (rr) => {
    res.writeHead(rr.statusCode ?? 502, rr.headers);
    rr.pipe(res);
  });
  r.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
  req.pipe(r);
}
await new Promise((r) => proxy.listen(PUERTO, r));

// La credencial guardada: el token del asesorado, como lo guarda la APK. Se reusa la sesión de la corrida si sigue viva.
const SESIONES = enTrabajo('.sesiones.json');
const sesiones = fs.existsSync(SESIONES) ? JSON.parse(fs.readFileSync(SESIONES, 'utf8')) : {};
let guardada = sesiones[estado.aseCorreo];
if (!guardada || Date.parse(guardada.expira) - Date.now() < 30 * 60 * 1000) {
  const r = await d.crearClienteBe({ baseUrl: `${API}/api/v1`, superficie: 'APK' }).iniciarSesion(estado.aseCorreo, CRED);
  if (!r.ok) throw new Error('sesión del asesorado');
  guardada = { token: r.datos.data.session.accessToken, expira: r.datos.data.session.expiresAt };
  sesiones[estado.aseCorreo] = guardada;
  fs.writeFileSync(SESIONES, JSON.stringify(sesiones));
}
const credencial = { token: guardada.token, identidadId: estado.aseId, expiresAt: guardada.expira, vigenciaMs: 12 * 60 * 60 * 1000 };
const temporizador = { esperar: (ms, alCumplirse) => { const t = setTimeout(alCumplirse, ms); return () => clearTimeout(t); } };

/** Una recuperación como la de App.tsx, con la base dada: las fases con su momento y el resultado. */
async function recuperar(base) {
  let borrada = false;
  const guarda = { leer: async () => ({ tipo: 'credencial', credencial }), borrar: async () => { borrada = true; } };
  const cliente = (senal) => d.crearClienteBe({ baseUrl: `${base}/api/v1`, superficie: 'APK', capacidades: [d.CAPACIDAD_OBJETIVOS_POR_SERIE], fetch: (e, i) => fetch(e, { ...i, signal: senal }) });
  const t0 = performance.now();
  const fases = [{ fase: 'comprobando', ms: 0 }];
  const vigia = sp.crearVigiaDeDemora(temporizador, () => fases.push({ fase: 'tardando', ms: Math.round(performance.now() - t0) }));
  vigia.reiniciar();
  const resultado = await sp.recuperarSesion({
    guarda,
    verificar: (token, senal) => cliente(senal).consultarCuenta(token),
    credencial,
    ahora: () => ({ monotono: performance.now(), reloj: Date.now() }),
    sigueVigente: () => true,
  });
  vigia.parar();
  const fin = Math.round(performance.now() - t0);
  fases.push({ fase: resultado?.tipo === 'sin-verificar' ? `sin-verificar · ${resultado.causa}` : resultado?.tipo ?? 'nada', ms: fin });
  return { resultado, fases, fin, borrada };
}
const reiniciarCuentas = (e) => {
  escenario = { ...e };
  enCurso = 0;
  maximoEnCurso = 0;
  pedidosDeMe = [];
  cortadosPorElCliente = 0;
};
const proxyUrl = `http://localhost:${PUERTO}`;
const resultado = {};
try {
  control('la espera máxima de la APK es de 75 s y el aviso aparece a los 5 s', sp.ESPERA_MAXIMA_DE_VERIFICACION_MS === 75_000 && sp.UMBRAL_DE_DEMORA_MS === 5_000, `${sp.ESPERA_MAXIMA_DE_VERIFICACION_MS} y ${sp.UMBRAL_DE_DEMORA_MS}`);

  // ─── 1. 30 s de demora ──────────────────────────────────────────────────────────────────────
  reiniciarCuentas({ demoraMs: 30_000, fallas503: 0 });
  const a = await recuperar(proxyUrl);
  const tardandoA = a.fases.find((f) => f.fase === 'tardando');
  control('30 s de demora: a los 5 s la pantalla pasa a «está tardando» (sigue el mismo pedido)', tardandoA && Math.abs(tardandoA.ms - 5000) <= 300, JSON.stringify(a.fases));
  control('30 s de demora: la sesión se recupera cerca de los 30 s', a.resultado?.tipo === 'recuperada' && a.fin >= 29_500 && a.fin <= 32_000, `${a.resultado?.tipo} a los ${a.fin} ms`);
  control('30 s de demora: un solo pedido a /me, nunca dos a la vez', pedidosDeMe.length === 1 && maximoEnCurso === 1, `${pedidosDeMe.length} pedidos, ${maximoEnCurso} a la vez`);
  resultado.demora30 = { fases: a.fases, pedidos: pedidosDeMe.length, superpuestos: maximoEnCurso };

  // ─── 2. Dos 503 y después la respuesta ────────────────────────────────────────────────────────
  reiniciarCuentas({ demoraMs: 0, fallas503: 2 });
  const b = await recuperar(proxyUrl);
  const separaciones = pedidosDeMe.slice(1).map((t, i) => t - pedidosDeMe[i]);
  control('dos 503: se reintenta solo y se recupera', b.resultado?.tipo === 'recuperada', `${b.resultado?.tipo} a los ${b.fin} ms`);
  control('dos 503: tres pedidos, de a uno, con las esperas de la APK (2 s y 4 s)', pedidosDeMe.length === 3 && maximoEnCurso === 1 && Math.abs(separaciones[0] - 2000) <= 400 && Math.abs(separaciones[1] - 4000) <= 400, `separaciones ${JSON.stringify(separaciones)} ms`);
  resultado.dosFallas = { fases: b.fases, separaciones };

  // ─── 3. 80 s de demora: tiempo agotado a los 75 s ──────────────────────────────────────────────
  reiniciarCuentas({ demoraMs: 80_000, fallas503: 0 });
  const c = await recuperar(proxyUrl);
  await pausa(3000);
  control('80 s de demora: a los 75 s, «tiempo agotado»', c.resultado?.tipo === 'sin-verificar' && c.resultado.causa === 'tiempo-agotado' && c.fin >= 74_500 && c.fin <= 76_500, `${c.resultado?.tipo} ${c.resultado?.causa ?? ''} a los ${c.fin} ms`);
  control('80 s de demora: ese pedido se corta y no se lanza otro (tampoco después)', pedidosDeMe.length === 1 && cortadosPorElCliente === 1 && maximoEnCurso === 1, `${pedidosDeMe.length} pedidos, ${cortadosPorElCliente} cortado por el cliente`);
  control('80 s de demora: la credencial guardada no se borra', !c.borrada);
  resultado.tiempoAgotado = { fases: c.fases, pedidos: pedidosDeMe.length, cortados: cortadosPorElCliente };

  // ─── 4. Sin conexión ────────────────────────────────────────────────────────────────────────
  reiniciarCuentas({ demoraMs: 0, fallas503: 0 });
  const sinRed = await recuperar('http://127.0.0.1:9');
  control('sin conexión: falla enseguida, con su causa, distinta del tiempo agotado', sinRed.resultado?.tipo === 'sin-verificar' && sinRed.resultado.causa === 'sin-conexion' && sinRed.fin < 5_000, `${sinRed.resultado?.causa} a los ${sinRed.fin} ms`);
  control('sin conexión: la credencial guardada no se borra', !sinRed.borrada);
  resultado.sinConexion = { fases: sinRed.fases };

  control('en ninguno se inició sesión: el límite de intentos de login no interviene', iniciosDeSesion === 0, `${iniciosDeSesion} inicios`);
} catch (e) {
  control('la prueba de reconexión terminó sin errores', false, e.stack ?? String(e));
} finally {
  proxy.close();
  fs.writeFileSync(enTrabajo('reconexion-real.json'), JSON.stringify({ ...resultado, controles }, null, 2));
  const fallas = controles.filter((x) => !x.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}
