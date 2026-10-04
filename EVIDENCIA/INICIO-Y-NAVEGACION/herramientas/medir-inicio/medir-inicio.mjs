/**
 * Medición local de Inicio (cierre del 2026-10-04): solicitudes, bytes y tiempo hasta que cada tarjeta se puede usar.
 *
 * NO es una medición en el teléfono ni contra la API de test. Corre en esta computadora:
 * - un servidor HTTP local responde con datos SINTÉTICOS válidos contra los contratos (`datos.mjs`);
 * - el cliente es el real de @be/domain (`crearClienteBe`), que valida cada respuesta con su esquema;
 * - las tarjetas leen con las funciones reales de la APK (`lecturas-de-inicio.ts`, `lecturas-de-las-zonas.ts`), con el
 *   mismo orden y las mismas dependencias que en la pantalla: todas arrancan juntas al entrar, y el último registro de
 *   Nutrición espera a «Hoy»;
 * - la red se simula en el `fetch` del cliente: medio viaje de ida, el tiempo del servidor, medio viaje de vuelta y la
 *   transferencia por un enlace de ancho fijo, compartido entre las respuestas que bajan a la vez (HTTP/2 sobre una
 *   conexión). En una visita «en frío», todas las solicitudes esperan a que se abra la conexión (dos viajes: TCP y TLS 1.3).
 *
 * Además de lo que hace la APK, mide tres alternativas que NO están implementadas, para justificar o descartar cambios:
 * mirar hacia atrás en paralelo, un resumen agregado de la actividad (D-4) y respuestas comprimidas con gzip.
 *
 * Uso: node medir-inicio.mjs [carpeta de salida]   (Node 22; antes, construir @be/domain)
 */
import { writeFileSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import * as datos from './datos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { clasificarFalla, crearClienteBe } = require('../../../../packages/domain/dist/index.js');
const inicio = await import('../../../../apps/mobile/src/lecturas-de-inicio.ts');
const zonas = await import('../../../../apps/mobile/src/lecturas-de-las-zonas.ts');
const formato = await import('../../../../apps/mobile/src/formato.ts');

// ─── Escenarios y redes ─────────────────────────────────────────────────────────────────────────
const TOMAS_RECIENTES = ['2026-07-25', '2026-08-24', '2026-09-27'];
/** Sin mediciones en los últimos 90 días: la última toma es de hace casi un año, en la tercera ventana hacia atrás. */
const TOMAS_VIEJAS = ['2025-10-20', '2025-11-18'];
const ESCENARIOS = [
  { clave: 'tipico', nombre: 'Típico', detalle: 'Registros de comida hoy, tres tomas recientes y 12 sesiones en 30 días, 3 de ellas corregidas.', conRegistrosHoy: true, tomas: TOMAS_RECIENTES, sesiones: 12, corregidas: 3 },
  { clave: 'sin-registros', nombre: 'Sin registros de comida hoy', detalle: 'Como el típico, sin registros hoy: el último registro se pide aparte, después de «Hoy».', conRegistrosHoy: false, tomas: TOMAS_RECIENTES, sesiones: 12, corregidas: 3 },
  { clave: 'sin-mediciones', nombre: 'Sin mediciones recientes', detalle: 'La última toma es de hace casi un año: Mi evolución mira hacia atrás, de a 90 días, hasta encontrarla.', conRegistrosHoy: true, tomas: TOMAS_VIEJAS, sesiones: 12, corregidas: 3 },
  { clave: 'historial-pesado', nombre: 'Historial con muchas correcciones', detalle: '60 sesiones en 30 días, 20 de ellas corregidas, algunas dos veces.', conRegistrosHoy: true, tomas: TOMAS_RECIENTES, sesiones: 60, corregidas: 20 },
];
const REDES = [
  { clave: '4g', nombre: '4G lento', rtt: 150, kbps: 1600 },
  { clave: '3g', nombre: '3G lento', rtt: 400, kbps: 400 },
  { clave: 'wifi', nombre: 'Wi-Fi', rtt: 40, kbps: 20000 },
];
/** El tiempo que tarda la API en responder cada lectura: un supuesto fijo, igual para todas. */
const TIEMPO_DEL_SERVIDOR_MS = 60;
/** Lo que pesan los encabezados de una solicitud de la APK (token incluido) y de una respuesta de la API, en bytes. */
const ENCABEZADOS_DE_SOLICITUD = 420;
const ENCABEZADOS_DE_RESPUESTA = 380;

// ─── El servidor local ──────────────────────────────────────────────────────────────────────────
function crearServidor(escenario) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://local');
    const q = Object.fromEntries(url.searchParams);
    const ruta = url.pathname.replace(/^\/api\/v1/, '');
    let cuerpo;
    if (ruta === '/me/training/today') cuerpo = datos.hoyDeEntrenamiento();
    else if (ruta === '/me/nutrition/today') cuerpo = datos.hoyNutricional(escenario);
    else if (ruta === '/me/nutrition/executions') cuerpo = datos.ultimoRegistro();
    else if (ruta === '/me/training/executions') cuerpo = datos.historial(q, escenario);
    else if (ruta === '/me/form-requests') cuerpo = datos.pendientes();
    else if (ruta === '/me/health-data-consent-requirement') cuerpo = datos.requisitoA3();
    else if (ruta === '/me/anthropometry/progress') cuerpo = datos.evolucion(q.periodStart ? q : formato.ultimosDiasHasta(datos.HOY, 90), escenario.tomas);
    else if (ruta === '/simulado/resumen-de-actividad') {
      // Lo que devolvería un resumen agregado (D-4): las mismas cuentas que hace la tarjeta, sin las sesiones.
      const lista = datos.historial(q, escenario).data;
      cuerpo = { data: { period: lista.period, registered: lista.executions.length, completed: 0, completedWithDeviation: 0, notCompleted: 0, corrected: 0, notResolvable: 0 } };
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: ruta } }));
      return;
    }
    const json = JSON.stringify(cuerpo);
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(json);
    }, TIEMPO_DEL_SERVIDOR_MS);
  });
}

// ─── La red simulada ────────────────────────────────────────────────────────────────────────────
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Un enlace de bajada de ancho fijo, repartido en partes iguales entre las transferencias activas. */
function crearEnlace(kbps) {
  const bytesPorMs = (kbps * 1000) / 8 / 1000;
  const activas = new Set();
  let reloj = null;
  let ultimo = 0;
  const paso = () => {
    const ahora = performance.now();
    let disponible = (ahora - ultimo) * bytesPorMs;
    ultimo = ahora;
    // Reparto en partes iguales; lo que no usa una que termina pasa a las demás.
    while (disponible > 1e-6 && activas.size > 0) {
      const parte = disponible / activas.size;
      disponible = 0;
      for (const t of [...activas]) {
        const usado = Math.min(parte, t.restantes);
        t.restantes -= usado;
        disponible += parte - usado;
        if (t.restantes <= 1e-6) {
          activas.delete(t);
          t.listo();
        }
      }
    }
    if (activas.size === 0) {
      clearInterval(reloj);
      reloj = null;
    }
  };
  return {
    transferir(bytes) {
      return new Promise((listo) => {
        activas.add({ restantes: bytes, listo });
        if (!reloj) {
          ultimo = performance.now();
          reloj = setInterval(paso, 2);
        }
      });
    },
  };
}

function fetchConRed(red, { enFrio, gzip }, anotar) {
  const enlace = crearEnlace(red.kbps);
  // Con HTTP/2 hay una sola conexión: en frío, todas las solicitudes esperan a que se abra.
  const conexion = enFrio ? dormir(2 * red.rtt) : Promise.resolve();
  return async (entrada, init) => {
    const url = String(entrada);
    const t0 = performance.now();
    await conexion;
    await dormir(red.rtt / 2);
    // El fetch de Node no tiene caché ni cookies: se quitan esas opciones del navegador.
    const { cache: _cache, credentials: _credenciales, ...resto } = init ?? {};
    const respuesta = await fetch(url, resto);
    const cuerpo = Buffer.from(await respuesta.arrayBuffer());
    const comprimido = gzipSync(cuerpo).length;
    await dormir(red.rtt / 2);
    await enlace.transferir((gzip ? comprimido : cuerpo.length) + ENCABEZADOS_DE_RESPUESTA);
    anotar({ ruta: new URL(url).pathname.replace(/^\/api\/v1/, '') + new URL(url).search, bytes: cuerpo.length, gzip: comprimido, inicio: t0, fin: performance.now() });
    return new Response(cuerpo, { status: respuesta.status, headers: respuesta.headers });
  };
}

// ─── Alternativas que no están en la APK, para comparar ─────────────────────────────────────────
/** Mira hacia atrás en paralelo: si los últimos 90 días no tienen nada, pide las tres ventanas anteriores juntas. */
async function leerMiEvolucionEnParalelo(api, token) {
  const r = await api.miEvolucionAntropometrica(token);
  if (!r.ok || r.datos.data.metrics.some((m) => m.series.length > 0)) return r;
  const ventanas = [];
  let desde = r.datos.data.period.start;
  for (let i = 0; i < 3; i++) {
    const p = zonas.periodoAnterior(desde);
    ventanas.push(p);
    desde = p.periodStart;
  }
  const anteriores = await Promise.all(ventanas.map((p) => api.miEvolucionAntropometrica(token, p)));
  const falla = anteriores.find((x) => !x.ok && clasificarFalla(x) !== 'otra');
  if (falla) return falla;
  return anteriores.find((x) => x.ok && x.datos.data.metrics.some((m) => m.series.length > 0)) ?? r;
}

/**
 * Guiada por la sesión: en una visita posterior se sabe en qué ventana estaba la última toma, y se piden juntas esa y
 * las más nuevas. Mismas solicitudes que la búsqueda secuencial, en un solo viaje.
 */
async function leerMiEvolucionGuiada(api, token, ventanaConocida = 3) {
  const ventanas = [undefined];
  let desde = formato.ultimosDiasHasta(datos.HOY, 90).periodStart;
  for (let i = 0; i < ventanaConocida; i++) {
    const p = zonas.periodoAnterior(desde);
    ventanas.push(p);
    desde = p.periodStart;
  }
  const todas = await Promise.all(ventanas.map((p) => api.miEvolucionAntropometrica(token, p)));
  return todas.find((x) => x.ok && x.datos.data.metrics.some((m) => m.series.length > 0)) ?? todas[0];
}

// ─── Una visita a Inicio ────────────────────────────────────────────────────────────────────────
/** Cada tarjeta lee como en la pantalla, o con la alternativa pedida. Anota cuándo se puede usar cada una. */
async function visita(api, fetchSimulado, registro, alternativa) {
  const t0 = performance.now();
  const marcar = (tarjeta) => registro.tarjetas.push({ tarjeta, ms: performance.now() - t0 });
  const periodo = formato.ultimosDiasHasta(datos.HOY, inicio.DIAS_DE_ACTIVIDAD);
  const actividad =
    alternativa.actividad === 'agregado'
      ? fetchSimulado(`${api.__base}/simulado/resumen-de-actividad?periodStart=${periodo.periodStart}&periodEnd=${periodo.periodEnd}`, { method: 'GET' }).then((r) => r.json())
      : inicio.leerActividadDeEntrenamiento(api, 't', periodo);
  const mediciones = alternativa.lookback === 'paralelo' ? leerMiEvolucionEnParalelo(api, 't') : alternativa.lookback === 'guiado' ? leerMiEvolucionGuiada(api, 't') : zonas.leerMiEvolucion(api, 't');
  await Promise.all([
    api.hoyDeEntrenamiento('t').then(() => marcar('Entrenamiento de hoy')),
    api.hoyNutricional('t', undefined).then(async (r) => {
      marcar('Nutrición de hoy');
      if (r.ok && inicio.pideElUltimoRegistro(r.datos.data)) {
        await inicio.leerUltimoRegistro(api, 't');
        marcar('Nutrición · renglón del último registro');
      }
    }),
    inicio.leerPendientes(api, 't').then(() => marcar('Para responder')),
    actividad.then(() => marcar('Tu actividad')),
    mediciones.then(() => marcar('Mediciones')),
  ]);
  registro.total = performance.now() - t0;
}

/** A qué tarjeta pertenece cada operación, para sumar bytes y solicitudes por tarjeta. */
const TARJETA_DE_LA_RUTA = [
  ['/me/training/today', 'Entrenamiento de hoy'],
  ['/me/nutrition/today', 'Nutrición de hoy'],
  ['/me/nutrition/executions', 'Nutrición · renglón del último registro'],
  ['/me/form-requests', 'Para responder'],
  ['/me/health-data-consent-requirement', 'Para responder'],
  ['/me/training/executions', 'Tu actividad'],
  ['/simulado/resumen-de-actividad', 'Tu actividad'],
  ['/me/anthropometry/progress', 'Mediciones'],
];
const tarjetaDe = (ruta) => TARJETA_DE_LA_RUTA.find(([prefijo]) => ruta.startsWith(prefijo))?.[1] ?? '?';

async function medir(escenario, red, enFrio, alternativa = {}) {
  const servidor = crearServidor(escenario);
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}/api/v1`;
  const pedidos = [];
  const registro = { tarjetas: [], total: 0 };
  const fetchSimulado = fetchConRed(red, { enFrio, gzip: alternativa.gzip === true }, (p) => pedidos.push(p));
  const api = Object.assign(crearClienteBe({ baseUrl: base, superficie: 'APK', fetch: fetchSimulado }), { __base: base });
  await visita(api, fetchSimulado, registro, alternativa);
  await new Promise((r) => servidor.close(r));
  return { pedidos, registro };
}

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const REPETICIONES = 3;

async function resumir(escenario, red, enFrio, alternativa) {
  const corridas = [];
  for (let i = 0; i < REPETICIONES; i++) corridas.push(await medir(escenario, red, enFrio, alternativa));
  const base = corridas[0];
  const tarjetas = [...new Set(base.registro.tarjetas.map((t) => t.tarjeta))].map((tarjeta) => {
    const propios = base.pedidos.filter((p) => tarjetaDe(p.ruta) === tarjeta);
    return {
      tarjeta,
      ms: Math.round(mediana(corridas.map((c) => c.registro.tarjetas.find((t) => t.tarjeta === tarjeta).ms))),
      solicitudes: propios.length,
      bytes: propios.reduce((s, p) => s + p.bytes, 0),
      gzip: propios.reduce((s, p) => s + p.gzip, 0),
    };
  });
  process.stdout.write('.');
  return {
    escenario: escenario.clave,
    red: red.clave,
    enFrio,
    alternativa,
    totalMs: Math.round(mediana(corridas.map((c) => c.registro.total))),
    solicitudes: base.pedidos.length,
    bytes: base.pedidos.reduce((s, p) => s + p.bytes, 0),
    gzip: base.pedidos.reduce((s, p) => s + p.gzip, 0),
    bytesDeSubida: base.pedidos.length * ENCABEZADOS_DE_SOLICITUD,
    tarjetas,
    rutas: base.pedidos.map((p) => p.ruta),
  };
}

// Lo que hace la APK: cada escenario, cada red, en frío y con la conexión abierta.
const resultados = [];
for (const escenario of ESCENARIOS) for (const red of REDES) for (const enFrio of [true, false]) resultados.push(await resumir(escenario, red, enFrio, {}));

// Las alternativas, en frío, en las dos redes lentas.
const porClave = Object.fromEntries(ESCENARIOS.map((e) => [e.clave, e]));
const ALTERNATIVAS = [
  { nombre: 'Mirar hacia atrás en paralelo (las tres ventanas anteriores juntas)', escenario: 'sin-mediciones', tarjeta: 'Mediciones', alternativa: { lookback: 'paralelo' } },
  { nombre: 'Mirar hacia atrás guiado por la sesión (visita posterior: las ventanas conocidas juntas)', escenario: 'sin-mediciones', tarjeta: 'Mediciones', alternativa: { lookback: 'guiado' } },
  { nombre: 'Resumen agregado de la actividad (D-4), típico', escenario: 'tipico', tarjeta: 'Tu actividad', alternativa: { actividad: 'agregado' } },
  { nombre: 'Resumen agregado de la actividad (D-4), historial pesado', escenario: 'historial-pesado', tarjeta: 'Tu actividad', alternativa: { actividad: 'agregado' } },
  { nombre: 'Respuestas comprimidas con gzip, típico', escenario: 'tipico', tarjeta: null, alternativa: { gzip: true } },
  { nombre: 'Respuestas comprimidas con gzip, historial pesado', escenario: 'historial-pesado', tarjeta: null, alternativa: { gzip: true } },
];
const comparaciones = [];
for (const a of ALTERNATIVAS) {
  for (const red of REDES.filter((r) => r.clave !== 'wifi')) {
    const actual = resultados.find((x) => x.escenario === a.escenario && x.red === red.clave && x.enFrio);
    const otra = await resumir(porClave[a.escenario], red, true, a.alternativa);
    const de = (r) => (a.tarjeta ? r.tarjetas.find((t) => t.tarjeta === a.tarjeta) : { ms: r.totalMs, solicitudes: r.solicitudes, bytes: r.bytes });
    comparaciones.push({ nombre: a.nombre, red: red.nombre, que: a.tarjeta ?? 'Toda la visita', actual: de(actual), alternativa: de(otra), transferido: a.alternativa.gzip ? otra.gzip : null });
  }
}
process.stdout.write('\n');

// ─── El informe ─────────────────────────────────────────────────────────────────────────────────
const kb = (b) => `${(b / 1024).toFixed(1).replace('.', ',')} KB`;
const seg = (ms) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
const lineas = [];
lineas.push('# Medición local de Inicio', '');
lineas.push(`Generado por \`medir-inicio.mjs\` el ${new Date().toISOString().slice(0, 10)}. **Datos sintéticos, servidor local y red simulada: no es una medición en el teléfono ni contra la API de test.**`, '');
lineas.push(`- El cliente real de @be/domain y las lecturas reales de la APK. Tiempo del servidor por lectura: ${TIEMPO_DEL_SERVIDOR_MS} ms (supuesto). Encabezados: ${ENCABEZADOS_DE_SOLICITUD} B de subida y ${ENCABEZADOS_DE_RESPUESTA} B de bajada por solicitud (supuesto).`);
lineas.push('- Redes: ' + REDES.map((r) => `${r.nombre} (ida y vuelta ${r.rtt} ms, ${String(r.kbps / 1000).replace('.', ',')} Mb/s de bajada)`).join('; ') + '.');
lineas.push('- «En frío»: todas las solicitudes esperan a que se abra la conexión (dos viajes). «Con la conexión abierta»: volver a Inicio.');
lineas.push('- «Utilizable»: llegó y se validó la respuesta que la tarjeta necesita para mostrar sus datos. Cada tiempo es la mediana de tres corridas.');
lineas.push('- Bytes: el JSON tal como sale de la API, que hoy no comprime; entre paréntesis, cuánto pesaría con gzip.', '');
for (const escenario of ESCENARIOS) {
  lineas.push(`## ${escenario.nombre}`, '', escenario.detalle, '');
  const base = resultados.find((r) => r.escenario === escenario.clave && r.red === '4g' && r.enFrio);
  lineas.push('| Tarjeta | Solicitudes | Bytes | ' + REDES.map((r) => `${r.nombre}, en frío`).join(' | ') + ' | 4G lento, con la conexión abierta |');
  lineas.push('|---|---|---|' + REDES.map(() => '---').join('|') + '|---|');
  const fila = (red, enFrio) => resultados.find((x) => x.escenario === escenario.clave && x.red === red && x.enFrio === enFrio);
  for (const t of base.tarjetas) {
    const tiempos = REDES.map((r) => seg(fila(r.clave, true).tarjetas.find((y) => y.tarjeta === t.tarjeta).ms));
    lineas.push(`| ${t.tarjeta} | ${t.solicitudes} | ${kb(t.bytes)} (${kb(t.gzip)}) | ${tiempos.join(' | ')} | ${seg(fila('4g', false).tarjetas.find((y) => y.tarjeta === t.tarjeta).ms)} |`);
  }
  lineas.push(`| **Toda la visita** | **${base.solicitudes}** | **${kb(base.bytes)}** (${kb(base.gzip)}) | ${REDES.map((r) => `**${seg(fila(r.clave, true).totalMs)}**`).join(' | ')} | **${seg(fila('4g', false).totalMs)}** |`, '');
}
lineas.push('## Alternativas medidas, no implementadas', '', 'En frío. Cada fila compara lo que hace hoy la APK con la alternativa, en la tarjeta afectada o en toda la visita.', '');
lineas.push('| Alternativa | Red | Qué | Hoy | Con la alternativa |');
lineas.push('|---|---|---|---|---|');
for (const c of comparaciones) {
  const hoy = `${seg(c.actual.ms)} · ${c.actual.solicitudes} sol. · ${kb(c.actual.bytes)}`;
  const otra = `${seg(c.alternativa.ms)} · ${c.alternativa.solicitudes} sol. · ${c.transferido ? `${kb(c.transferido)} transferidos` : kb(c.alternativa.bytes)}`;
  lineas.push(`| ${c.nombre} | ${c.red} | ${c.que} | ${hoy} | ${otra} |`);
}
lineas.push('');
const salida = process.argv[2] ?? AQUI;
writeFileSync(join(salida, 'resultados.md'), lineas.join('\n'));
writeFileSync(join(salida, 'resultados.json'), JSON.stringify({ tiempoDelServidorMs: TIEMPO_DEL_SERVIDOR_MS, redes: REDES, escenarios: ESCENARIOS, resultados, comparaciones }, null, 2));
console.log(lineas.join('\n'));
