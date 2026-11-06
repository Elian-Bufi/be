/**
 * Medición de la cartera del profesional (API-CAR-01) con concurrencia, historia y el desglose del tiempo. Encargo
 * nocturno del 2026-10-28, §13 (trabajo adicional A). La medición anterior (cartera.rendimiento.ts, corrida 40641148313)
 * queda como referencia: esta no la reemplaza ni toca sus resultados. Ver EVIDENCIA/RENDIMIENTO-CARTERA/LEEME.md.
 *
 * Qué mide, sobre el mismo código de producto (sin cambios):
 * - Carteras de 50, 100 y 200 personas con el perfil de la medición anterior, y una de 200 con historia en las tres áreas.
 * - Lecturas concurrentes de 1, 3 y 5 carteras independientes: un profesional distinto por cliente, cada uno en bucle
 *   cerrado (pide la siguiente apenas recibe la anterior, sin pausa). Es una prueba de esfuerzo, no un patrón de uso.
 * - La apertura completa: la primera página y las siguientes con el cursor, como lee la lista el website.
 * - Calentamiento separado en cada lote, 50 observaciones por escenario, repeticiones independientes de los escenarios
 *   clave y cada muestra guardada.
 * - Por pedido: la latencia del cliente; del servidor, el bloque de decisiones del PDP y la transacción de lectura
 *   (soporte-medicion.ts); las filas de `decision_de_acceso` con su request_id; en los lotes secuenciales, las sentencias
 *   de la base de ese pedido (pg_stat_statements). Por lote: transacciones, WAL, checkpoints, autovacuum, uso del hilo de
 *   Node, CPU del proceso, de PostgreSQL y de la máquina, pausas del recolector y, en concurrencia, la actividad de la base
 *   cada 250 ms.
 *
 * Solo corre con `BE_MEDIR_CONCURRENCIA=1`, contra un PostgreSQL local con `pg_stat_statements` precargado
 * (`TEST_DATABASE_URL`; el flujo de la rama descartable lo levanta). `BE_CONCURRENCIA_PERFIL=humo` corre todo en
 * miniatura para probar el arnés. Un resultado de acá describe la máquina donde corrió: no dice nada de Render.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { cpus, freemem, loadavg, release, totalmem } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { appDePrueba } from '../integration/soporte-api';
import { prepararProfesional, type Parte } from '../integration/soporte-vinculo';
import {
  cerrarAgente,
  cpuDelHost,
  deltaDeContadores,
  deltaDeCpuDelHost,
  deltaDeSentencias,
  esperar,
  gcDentro,
  Instrumentacion,
  Monitor,
  Muestreador,
  ObservadorDeGc,
  pedirCartera,
  resumirServidor,
  ticksDePostgres,
  type Contadores,
  type DeltaDeSentencia,
  type EventoDeGc,
  type FilaDeSentencia,
  type RespuestaDeCartera,
  type ServidorEnLaMuestra,
} from './soporte-medicion';
import { DIAS_DE_COMIDAS_POR_VERSION, hoyCivil, inventario, poblarBase, poblarHistoria, SEMANAS_DE_ENTRENAMIENTO, totalesDeLaBase } from './soporte-poblacion';

const ACTIVA = process.env.BE_MEDIR_CONCURRENCIA === '1';
const PERFIL = process.env.BE_CONCURRENCIA_PERFIL === 'humo' ? 'humo' : 'completo';
const SALIDA = process.env.BE_CONCURRENCIA_SALIDA ?? join(__dirname, '..', '..', 'EVIDENCIA', 'RENDIMIENTO-CARTERA', 'resultados', `concurrencia-local-${PERFIL}`);
const APP_DE_LA_API = 'be-api';
const APP_DEL_ARNES = 'be-arnes';

/** Los parámetros de cada perfil. El completo es el que se informa; el de humo solo prueba que el arnés corre entero. */
const P =
  PERFIL === 'humo'
    ? { base: [5, 10], grande: 10, historia: 8, concurrentes: 5, observaciones: 3, calentamiento: 1, aperturas: 2, asentamientoMs: 1_500, pausaMs: 20, actividadMs: 250, timeoutMs: 120_000 }
    : { base: [50, 100], grande: 200, historia: 200, concurrentes: 5, observaciones: 50, calentamiento: 3, aperturas: 15, asentamientoMs: 11_500, pausaMs: 100, actividadMs: 250, timeoutMs: 180_000 };
const LIMITE = 50;

type Perfil = 'base' | 'historia';
interface Cartera {
  readonly etiqueta: string;
  readonly perfil: Perfil;
  readonly personas: number;
  readonly pro: Parte;
}

type Modo = 'secuencial' | 'apertura' | 'concurrente';
interface Lote {
  readonly id: string;
  readonly descripcion: string;
  readonly modo: Modo;
  readonly carteras: readonly Cartera[];
  readonly instrumentada: boolean;
  readonly repeticion: number;
}

interface Muestra {
  readonly lote: string;
  readonly escenario: string;
  readonly repeticion: number;
  readonly calentamiento: boolean;
  readonly cartera: string;
  readonly perfil: Perfil;
  readonly personas: number;
  readonly indice: number;
  readonly apertura: number | null;
  readonly pagina: number | null;
  readonly inicioMs: number;
  readonly finMs: number;
  readonly latenciaMs: number;
  readonly status: number;
  readonly error: string | null;
  readonly requestId: string | null;
  readonly items: number | null;
  readonly hasMore: boolean | null;
  readonly bytes: number;
  readonly servidor: ServidorEnLaMuestra | null;
  readonly gcMs: number;
  readonly sentencias: DeltaDeSentencia[] | null;
}

let app: INestApplication;
let prisma: PrismaClient;
let pgMonitor: PrismaClient;
let monitor: Monitor;
let puerto = 0;
let baseMedida = '';
const instrumentacion = new Instrumentacion();
const gc = new ObservadorDeGc();
let contador = 0;
const etiqueta = (): string => `cc-${++contador}-${randomUUID().slice(0, 4)}`;
const r2 = (n: number): number => Math.round(n * 100) / 100;
const suma = (carril: readonly { readonly personas: number }[]): number => carril.reduce((a, c) => a + c.personas, 0);

function conParametro(url: string, clave: string, valor: string): string {
  const u = new URL(url);
  u.searchParams.set(clave, valor);
  return u.toString();
}

function conBase(url: string, base: string): string {
  const u = new URL(url);
  u.pathname = `/${base}`;
  return u.toString();
}

function anexar(archivo: string, filas: readonly unknown[]): void {
  if (filas.length === 0) return;
  appendFileSync(join(SALIDA, archivo), `${filas.map((f) => JSON.stringify(f)).join('\n')}\n`);
}

function escribir(archivo: string, contenido: unknown): void {
  writeFileSync(join(SALIDA, archivo), `${JSON.stringify(contenido, null, 2)}\n`);
}

const mensaje = (e: unknown): string => (e instanceof Error ? e.message.split('\n')[0] ?? '' : String(e)).slice(0, 400);

// ─── Instantáneas de un lote ─────────────────────────────────────────────────────────────────

/** Contadores de PostgreSQL. Se toman después de un asentamiento (ver correrLote). */
interface Instantanea {
  readonly t: number;
  readonly base: Contadores | null;
  readonly wal: Contadores | null;
  readonly escritor: Contadores | null;
  readonly sentencias: Map<string, FilaDeSentencia> | null;
  readonly errores: string[];
}

/** La máquina, justo al empezar y al terminar los pedidos del lote (sin los asentamientos). */
interface Maquina {
  readonly host: number[] | null;
  readonly postgres: { readonly ticks: number; readonly procesos: number } | null;
  readonly elu: ReturnType<typeof performance.eventLoopUtilization>;
  readonly cpu: NodeJS.CpuUsage;
}

const maquina = (): Maquina => ({ host: cpuDelHost(), postgres: ticksDePostgres(), elu: performance.eventLoopUtilization(), cpu: process.cpuUsage() });
const avisar = (texto: string): void => {
  process.stdout.write(`[cartera-concurrencia] ${texto}\n`);
};

async function intentar<T>(errores: string[], que: string, leer: () => Promise<T>): Promise<T | null> {
  try {
    return await leer();
  } catch (e) {
    errores.push(`${que}: ${mensaje(e)}`);
    return null;
  }
}

async function instantanea(conSentencias: boolean): Promise<Instantanea> {
  const errores: string[] = [];
  const base = await intentar(errores, 'pg_stat_database', () => monitor.baseDeDatos());
  const wal = await intentar(errores, 'pg_stat_wal', () => monitor.wal());
  const escritor = await intentar(errores, 'pg_stat_bgwriter', () => monitor.escritor());
  const sentencias = conSentencias ? await intentar(errores, 'pg_stat_statements', () => monitor.sentencias()) : null;
  return { t: performance.now(), base, wal, escritor, sentencias, errores };
}

/** Tablas que crecen en cada lectura o en las que corre el autovacuum (desde la base medida, fuera de las ventanas). */
async function tablas(): Promise<Record<string, Contadores> | { error: string }> {
  try {
    const filas = await prisma.$queryRawUnsafe<{ tabla: string; ins: number; vivas: number; muertas: number; vacuum: number; autovacuum: number; analyze: number; autoanalyze: number; bytes: number }[]>(
      `SELECT relname AS tabla, n_tup_ins::float8 AS ins, n_live_tup::float8 AS vivas, n_dead_tup::float8 AS muertas,
              vacuum_count::float8 AS vacuum, autovacuum_count::float8 AS autovacuum, analyze_count::float8 AS analyze,
              autoanalyze_count::float8 AS autoanalyze, pg_total_relation_size(relid)::float8 AS bytes
         FROM pg_stat_user_tables
        WHERE relname IN ('decision_de_acceso', 'evento_de_dominio', 'ingesta_nutricional', 'alcance_de_vinculo', 'sesion', 'registro_de_idempotencia')`,
    );
    return Object.fromEntries(filas.map((f) => [f.tabla, { ins: f.ins, vivas: f.vivas, muertas: f.muertas, vacuum: f.vacuum, autovacuum: f.autovacuum, analyze: f.analyze, autoanalyze: f.autoanalyze, bytes: f.bytes }]));
  } catch (e) {
    return { error: mensaje(e) };
  }
}

// ─── Los pedidos ─────────────────────────────────────────────────────────────────────────────

interface Cruda {
  readonly cartera: Cartera;
  readonly indice: number;
  readonly apertura: number | null;
  readonly pagina: number | null;
  readonly calentamiento: boolean;
  readonly r: RespuestaDeCartera;
  readonly sentencias: DeltaDeSentencia[] | null;
}

const consulta = (cursor: string | null): string => `?limit=${LIMITE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;

/** Un pedido; en los lotes secuenciales con estadísticas, con las sentencias de ese pedido (antes y después, fuera del reloj). */
async function pedido(cartera: Cartera, cursor: string | null, conSentencias: boolean, errores: string[]): Promise<{ r: RespuestaDeCartera; sentencias: DeltaDeSentencia[] | null }> {
  const antes = conSentencias ? await intentar(errores, 'pg_stat_statements por pedido', () => monitor.sentencias()) : null;
  const r = await pedirCartera(puerto, cartera.pro.token, consulta(cursor), { timeoutMs: P.timeoutMs });
  const despues = antes ? await intentar(errores, 'pg_stat_statements por pedido', () => monitor.sentencias()) : null;
  return { r, sentencias: antes && despues ? deltaDeSentencias(antes, despues) : null };
}

async function calentar(lote: Lote, errores: string[]): Promise<Cruda[]> {
  const crudas: Cruda[] = [];
  for (const cartera of lote.carteras) {
    for (let k = 0; k < P.calentamiento; k++) {
      const { r } = await pedido(cartera, null, false, errores);
      crudas.push({ cartera, indice: k, apertura: null, pagina: null, calentamiento: true, r, sentencias: null });
    }
  }
  return crudas;
}

async function medirLote(lote: Lote, conSentencias: boolean, errores: string[], t0: number): Promise<{ crudas: Cruda[]; actividad: Muestreador | null }> {
  const crudas: Cruda[] = [];
  if (lote.modo === 'secuencial') {
    const cartera = lote.carteras[0]!;
    for (let k = 0; k < P.observaciones; k++) {
      const { r, sentencias } = await pedido(cartera, null, conSentencias, errores);
      crudas.push({ cartera, indice: k, apertura: null, pagina: null, calentamiento: false, r, sentencias });
      await esperar(P.pausaMs);
    }
    return { crudas, actividad: null };
  }
  if (lote.modo === 'apertura') {
    const cartera = lote.carteras[0]!;
    let k = 0;
    for (let a = 0; a < P.aperturas; a++) {
      let cursor: string | null = null;
      let pagina = 0;
      do {
        pagina++;
        const { r, sentencias } = await pedido(cartera, cursor, conSentencias, errores);
        crudas.push({ cartera, indice: k++, apertura: a, pagina, calentamiento: false, r, sentencias });
        cursor = r.status === 200 && r.hasMore ? r.nextCursor : null;
      } while (cursor && pagina < 40);
      await esperar(P.pausaMs);
    }
    return { crudas, actividad: null };
  }
  const actividad = new Muestreador(monitor, t0, P.actividadMs, APP_DE_LA_API);
  actividad.iniciar();
  await Promise.all(
    lote.carteras.map(async (cartera) => {
      for (let k = 0; k < P.observaciones; k++) {
        const r = await pedirCartera(puerto, cartera.pro.token, consulta(null), { timeoutMs: P.timeoutMs });
        crudas.push({ cartera, indice: k, apertura: null, pagina: null, calentamiento: false, r, sentencias: null });
      }
    }),
  );
  await actividad.detener();
  return { crudas, actividad };
}

function aMuestra(lote: Lote, nombre: string, c: Cruda, t0: number, eventosDeGc: readonly EventoDeGc[]): Muestra {
  const s = instrumentacion.tomar(c.r.requestId);
  return {
    lote: nombre,
    escenario: lote.id,
    repeticion: lote.repeticion,
    calentamiento: c.calentamiento,
    cartera: c.cartera.etiqueta,
    perfil: c.cartera.perfil,
    personas: c.cartera.personas,
    indice: c.indice,
    apertura: c.apertura,
    pagina: c.pagina,
    inicioMs: r2(c.r.inicio - t0),
    finMs: r2(c.r.fin - t0),
    latenciaMs: r2(c.r.fin - c.r.inicio),
    status: c.r.status,
    error: c.r.error,
    requestId: c.r.requestId,
    items: c.r.items,
    hasMore: c.r.hasMore,
    bytes: c.r.bytes,
    servidor: s ? resumirServidor(s) : null,
    gcMs: gcDentro(eventosDeGc, c.r.inicio, c.r.fin),
    sentencias: c.sentencias,
  };
}

function resumenDeGc(eventos: readonly EventoDeGc[]): Record<string, { cantidad: number; ms: number; maxMs: number }> {
  const r: Record<string, { cantidad: number; ms: number; maxMs: number }> = {};
  for (const e of eventos) {
    const clave = String(e.tipo);
    const x = (r[clave] ??= { cantidad: 0, ms: 0, maxMs: 0 });
    x.cantidad++;
    x.ms = r2(x.ms + e.ms);
    x.maxMs = r2(Math.max(x.maxMs, e.ms));
  }
  return r;
}

function resumenDeActividad(m: Muestreador | null): Record<string, unknown> | null {
  if (!m) return null;
  const esperas: Record<string, number> = {};
  let maxActivas = 0;
  let maxTotal = 0;
  let maxAutovacuum = 0;
  let sumaActivas = 0;
  for (const s of m.muestras) {
    maxActivas = Math.max(maxActivas, s.api.activas);
    maxTotal = Math.max(maxTotal, s.api.total);
    maxAutovacuum = Math.max(maxAutovacuum, s.autovacuum);
    sumaActivas += s.api.activas;
    for (const [k, v] of Object.entries(s.esperas)) esperas[k] = (esperas[k] ?? 0) + v;
  }
  return {
    muestras: m.muestras.length,
    erroresDeMuestreo: m.errores,
    conexionesDeLaApiMax: maxTotal,
    activasDeLaApiMax: maxActivas,
    activasDeLaApiPromedio: m.muestras.length ? r2(sumaActivas / m.muestras.length) : null,
    autovacuumMax: maxAutovacuum,
    /** Conexiones activas de la API vistas en cada estado de espera, sumadas sobre todas las muestras. */
    esperas,
  };
}

let numeroDeLote = 0;

async function correrLote(lote: Lote): Promise<void> {
  const nombre = `${String(++numeroDeLote).padStart(2, '0')}-${lote.id}-r${lote.repeticion}`;
  const errores: string[] = [];
  const inicio = new Date().toISOString();
  try {
    // 1. Instrumentación: la de la aplicación y las estadísticas que cuestan en el servidor, juntas.
    if (lote.instrumentada) instrumentacion.activar();
    else instrumentacion.desactivar();
    await intentar(errores, 'estadísticas del servidor', () => monitor.estadisticas(lote.instrumentada));
    const envolturas = lote.instrumentada ? instrumentacion.envolturasPuestas() : instrumentacion.envolturasQuitadas();
    // 2. Calentamiento separado (no entra en las estadísticas del lote).
    const t0Calentamiento = performance.now();
    gc.tomar();
    const calentamiento = await calentar(lote, errores);
    const gcCalentamiento = gc.tomar();
    // 3. Las tablas antes, y a esperar que cada conexión publique sus contadores (PostgreSQL los publica al quedar ociosa,
    //    a más tardar a los 10 s): así la ventana del lote no arrastra lo anterior.
    const tablasAntes = await tablas();
    const secuenciaAntes = await intentar(errores, 'secuencia', async () => (await prisma.$queryRawUnsafe<{ s: string }[]>('SELECT coalesce(max("secuencia"), 0)::text AS s FROM "decision_de_acceso"'))[0]?.s ?? '0');
    await esperar(P.asentamientoMs);
    // 4. El lote, entre dos instantáneas.
    const conSentencias = lote.instrumentada && lote.modo !== 'concurrente';
    const antes = await instantanea(lote.instrumentada);
    gc.tomar();
    const m0 = maquina();
    const t0 = performance.now();
    const { crudas, actividad } = await medirLote(lote, conSentencias, errores, t0);
    const t1 = performance.now();
    const m1 = maquina();
    // Las pausas del recolector llegan al observador un poco después: se juntan pasado un momento.
    await esperar(50);
    const eventosDeGc = gc.tomar();
    // 5. Esperar otra vez y cerrar la ventana.
    await esperar(P.asentamientoMs);
    const despues = await instantanea(lote.instrumentada);
    const tablasDespues = await tablas();
    errores.push(...antes.errores, ...despues.errores);

    const muestras = [...calentamiento.map((c) => aMuestra(lote, nombre, c, t0Calentamiento, gcCalentamiento)), ...crudas.map((c) => aMuestra(lote, nombre, c, t0, eventosDeGc))];
    anexar('muestras.jsonl', muestras);
    if (actividad) anexar('actividad.jsonl', actividad.muestras.map((m) => ({ lote: nombre, ...m })));

    const medidas = muestras.filter((m) => !m.calentamiento);
    const nucleos = cpus().length;
    const cpuProceso = { user: m1.cpu.user - m0.cpu.user, system: m1.cpu.system - m0.cpu.system };
    const elu = performance.eventLoopUtilization(m1.elu, m0.elu);
    const pgTicks = m0.postgres && m1.postgres ? m1.postgres.ticks - m0.postgres.ticks : null;
    const tick = Number(process.env.BE_CLK_TCK ?? 100) || 100;
    anexar('lotes.jsonl', [
      {
        lote: nombre,
        escenario: lote.id,
        descripcion: lote.descripcion,
        modo: lote.modo,
        repeticion: lote.repeticion,
        instrumentada: lote.instrumentada,
        envolturasComoSeEsperaba: envolturas,
        carteras: lote.carteras.map((c) => ({ etiqueta: c.etiqueta, perfil: c.perfil, personas: c.personas })),
        observacionesPorCliente: lote.modo === 'apertura' ? null : P.observaciones,
        aperturas: lote.modo === 'apertura' ? P.aperturas : null,
        calentamientoPorCartera: P.calentamiento,
        pausaEntrePedidosMs: lote.modo === 'concurrente' ? 0 : P.pausaMs,
        asentamientoMs: P.asentamientoMs,
        inicio,
        duracionMs: r2(t1 - t0),
        pedidos: medidas.length,
        conError: medidas.filter((m) => m.status !== 200 || m.error !== null).length,
        // El hilo de Node, la CPU del proceso (todos sus hilos, incluido el motor de Prisma), la de PostgreSQL y la de la
        // máquina: desde el primer pedido medido hasta el último, sin los asentamientos.
        hilo: { utilizacion: r2(elu.utilization), activoMs: r2(elu.active), ociosoMs: r2(elu.idle) },
        cpuDelProcesoMs: { usuario: r2(cpuProceso.user / 1000), sistema: r2(cpuProceso.system / 1000) },
        cpuDePostgresMs: pgTicks === null ? null : r2((pgTicks * 1000) / tick),
        procesosDePostgres: m1.postgres?.procesos ?? null,
        cpuDeLaMaquina: deltaDeCpuDelHost(m0.host, m1.host, nucleos),
        // Los contadores de PostgreSQL van de una instantánea a la otra: el lote y los dos asentamientos.
        ventanaDeContadoresMs: r2(despues.t - antes.t),
        memoriaDelProcesoMb: r2(process.memoryUsage().rss / 1024 ** 2),
        gc: resumenDeGc(eventosDeGc),
        base: deltaDeContadores(antes.base, despues.base),
        wal: deltaDeContadores(antes.wal, despues.wal),
        escritor: deltaDeContadores(antes.escritor, despues.escritor),
        sentencias: antes.sentencias && despues.sentencias ? deltaDeSentencias(antes.sentencias, despues.sentencias) : null,
        tablas: { antes: tablasAntes, despues: tablasDespues },
        secuenciaAntes,
        actividad: resumenDeActividad(actividad),
        errores,
      },
    ]);
    avisar(`${nombre}: ${medidas.length} pedidos, ${medidas.filter((m) => m.status !== 200).length} con error, ${r2((t1 - t0) / 1000)} s`);
  } catch (e) {
    errores.push(`el lote no terminó: ${mensaje(e)}`);
    anexar('lotes.jsonl', [{ lote: nombre, escenario: lote.id, repeticion: lote.repeticion, inicio, errores, incompleto: true }]);
    avisar(`${nombre}: NO TERMINÓ — ${mensaje(e)}`);
  } finally {
    instrumentacion.descartarTodo();
  }
}

// ─── Inventario de pendientes: una apertura completa por cartera ─────────────────────────────

async function pendientesDe(cartera: Cartera): Promise<Record<string, unknown>> {
  const porTipo: Record<string, number> = {};
  let paginas = 0;
  let items = 0;
  let cursor: string | null = null;
  let error: string | null = null;
  let partialView: boolean | null = null;
  do {
    const r = await pedirCartera(puerto, cartera.pro.token, consulta(cursor), { timeoutMs: P.timeoutMs, contarTipos: true });
    paginas++;
    if (r.status !== 200) {
      error = r.error ?? `HTTP_${r.status}`;
      break;
    }
    partialView = partialView === true ? true : r.partialView;
    items += r.items ?? 0;
    for (const [k, v] of Object.entries(r.porTipo ?? {})) porTipo[k] = (porTipo[k] ?? 0) + v;
    cursor = r.hasMore ? r.nextCursor : null;
  } while (cursor && paginas < 40);
  return { paginas, items, porTipo, partialView, error };
}

// ─── La prueba ───────────────────────────────────────────────────────────────────────────────

(ACTIVA ? describe : describe.skip)('Rendimiento · API-CAR-01 con concurrencia, historia y desglose', () => {
  beforeAll(async () => {
    mkdirSync(SALIDA, { recursive: true });
    const url = process.env.DATABASE_URL as string;
    baseMedida = new URL(url).pathname.replace(/^\//, '') || 'be_test';
    // La API y el arnés se distinguen por application_name en pg_stat_activity. Es solo un rótulo de la conexión.
    process.env.DATABASE_URL = conParametro(url, 'application_name', APP_DE_LA_API);
    prisma = new PrismaClient({ datasourceUrl: conParametro(url, 'application_name', APP_DEL_ARNES) });
    pgMonitor = new PrismaClient({ datasourceUrl: conParametro(conBase(url, 'postgres'), 'application_name', `${APP_DEL_ARNES}-monitor`) });
    monitor = new Monitor(pgMonitor, baseMedida);
    await monitor.preparar();
    app = await appDePrueba({}, (a) => a.use(instrumentacion.middleware));
    instrumentacion.conectar(app);
    puerto = (app.getHttpServer().address() as AddressInfo).port;
    gc.iniciar();
  }, 600_000);

  afterAll(async () => {
    gc.detener();
    cerrarAgente();
    await app?.close();
    await prisma?.$disconnect();
    await pgMonitor?.$disconnect();
  });

  it('mide la cartera con historia y concurrencia, y deja cada muestra', async () => {
    const comienzo = Date.now();
    const estado: Record<string, unknown> = { perfil: PERFIL, comienzo: new Date(comienzo).toISOString(), etapa: 'entorno' };
    const guardarEstado = (cambios: Record<string, unknown>): void => {
      Object.assign(estado, cambios);
      escribir('estado.json', estado);
    };
    guardarEstado({});

    // 1. El entorno.
    const entorno: Record<string, unknown> = {
      perfil: PERFIL,
      parametros: { ...P, limite: LIMITE, diasDeComidasPorVersion: DIAS_DE_COMIDAS_POR_VERSION, semanasDeEntrenamiento: SEMANAS_DE_ENTRENAMIENTO },
      node: process.version,
      v8: process.versions.v8,
      uvThreadpoolSize: process.env.UV_THREADPOOL_SIZE ?? '4 (por omisión)',
      so: release(),
      cpus: cpus().length,
      modeloDeCpu: cpus()[0]?.model ?? null,
      memoriaGb: r2(totalmem() / 1024 ** 3),
      memoriaLibreGbAlEmpezar: r2(freemem() / 1024 ** 3),
      cargaAlEmpezar: loadavg(),
      baseMedida,
      postgres: await intentar([], 'version', () => monitor.version()),
      parametrosDePostgres: await intentar([], 'pg_settings', () => monitor.parametros()),
      imagenDePostgres: process.env.BE_IMAGEN_PG ?? null,
      commit: process.env.GITHUB_SHA ?? null,
      rama: process.env.GITHUB_REF_NAME ?? null,
      corrida: process.env.GITHUB_RUN_ID ? { id: process.env.GITHUB_RUN_ID, intento: process.env.GITHUB_RUN_ATTEMPT ?? null, flujo: process.env.GITHUB_WORKFLOW ?? null } : null,
      runner: { nombre: process.env.RUNNER_NAME ?? null, imagen: process.env.ImageOS ?? null, version: process.env.ImageVersion ?? null },
      hoyEnBuenosAires: hoyCivil(),
      semilla: 'No hay generador aleatorio en la carga: la composición de cada población es determinista por índice; los identificadores son UUID aleatorios (randomUUID y gen_random_uuid).',
    };
    escribir('entorno.json', entorno);

    // 2. Las poblaciones: cuatro carriles en paralelo (dos para las carteras base y dos para la historia), menos que las
    //    conexiones que Prisma abre por omisión en un runner de 4 CPU, para no medir la siembra contra un pool agotado.
    guardarEstado({ etapa: 'poblacion' });
    const nuevo = async (nombre: string, perfil: Perfil, personas: number): Promise<Cartera> => ({
      etiqueta: nombre,
      perfil,
      personas,
      pro: await prepararProfesional(app, etiqueta(), perfil === 'historia' ? ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'] : ['NUTRICION', 'ENTRENAMIENTO']),
    });
    const grandes: Cartera[] = [];
    for (let k = 1; k <= P.concurrentes; k++) grandes.push(await nuevo(`B${P.grande}-${k}`, 'base', P.grande));
    const chicas: Cartera[] = [];
    for (const n of P.base) chicas.push(await nuevo(`B${n}`, 'base', n));
    const historia = await nuevo(`H${P.historia}`, 'historia', P.historia);
    avisar(`perfil ${PERFIL}: ${grandes.length + chicas.length + 1} profesionales; sembrando las carteras`);
    const t0Poblacion = Date.now();
    // Las carteras base, la más grande primero, al carril con menos personas. Cada cartera se siembra en secuencia dentro
    // de su carril: así ningún profesional base tiene dos escrituras a la vez.
    const carriles: Cartera[][] = [[], []];
    for (const c of [...grandes, ...chicas].sort((a, b) => b.personas - a.personas)) {
      const destino = carriles.reduce((menor, carril) => (suma(carril) < suma(menor) ? carril : menor));
      destino.push(c);
    }
    const conHistoria = poblarHistoria(app, prisma, historia.pro, historia.personas, etiqueta, 2);
    await Promise.all([
      conHistoria,
      ...carriles.map(async (carril) => {
        for (const c of carril) await poblarBase(app, c.pro, c.personas, etiqueta);
      }),
    ]);
    const siembraDeHistoria = await conHistoria;
    const segundosDePoblacion = Math.round((Date.now() - t0Poblacion) / 1000);
    const carteras = [...chicas, ...grandes, historia];
    const poblacion: Record<string, unknown> = { segundos: segundosDePoblacion, erroresDeLaHistoria: siembraDeHistoria.errores, carteras: {} as Record<string, unknown> };
    for (const c of carteras) {
      (poblacion.carteras as Record<string, unknown>)[c.etiqueta] = { perfil: c.perfil, personasPedidas: c.personas, filas: await inventario(prisma, c.pro.id) };
    }
    guardarEstado({ etapa: 'inventario', segundosDePoblacion });
    avisar(`carteras sembradas en ${segundosDePoblacion} s; errores de la historia: ${JSON.stringify(siembraDeHistoria.errores)}`);

    // 3. Inventario de pendientes (una apertura completa por cartera; también calienta).
    instrumentacion.desactivar();
    for (const c of carteras) {
      const entrada = (poblacion.carteras as Record<string, Record<string, unknown>>)[c.etiqueta]!;
      entrada.pendientes = await pendientesDe(c);
    }
    poblacion.totalesDeLaBaseAlEmpezarLaMedicion = await totalesDeLaBase(prisma);
    const [sec] = await prisma.$queryRawUnsafe<{ s: string }[]>('SELECT coalesce(max("secuencia"), 0)::text AS s FROM "decision_de_acceso"');
    const secuenciaAlEmpezar = sec?.s ?? '0';
    poblacion.secuenciaDeDecisionesAlEmpezarLaMedicion = secuenciaAlEmpezar;
    escribir('poblacion.json', poblacion);
    avisar(`inventario listo: ${carteras.map((c) => `${c.etiqueta} ${JSON.stringify(((poblacion.carteras as Record<string, Record<string, unknown>>)[c.etiqueta] ?? {}).pendientes ?? null)}`).join(' · ')}`);

    // 4. Los lotes. El orden alterna escenarios y repite los clave al final, para ver si la base que crece corre los números.
    guardarEstado({ etapa: 'lotes' });
    const b200 = grandes[0]!;
    const [b50, b100] = chicas;
    const secuencial = (id: string, descripcion: string, c: Cartera, instrumentada: boolean, repeticion: number): Lote => ({ id, descripcion, modo: 'secuencial', carteras: [c], instrumentada, repeticion });
    const concurrente = (n: number, repeticion: number): Lote => ({
      id: `C${n}`,
      descripcion: `${n} ${n === 1 ? 'profesional' : 'profesionales'} a la vez, cada uno con su cartera de ${P.grande} personas (perfil base), en bucle cerrado`,
      modo: 'concurrente',
      carteras: grandes.slice(0, n),
      instrumentada: true,
      repeticion,
    });
    const niveles = [1, 3, 5].filter((n) => n <= grandes.length);
    const lotes: Lote[] = [
      secuencial(`S-B${b50!.personas}`, `Secuencial, ${b50!.personas} personas, perfil base`, b50!, true, 1),
      secuencial(`S-B${b100!.personas}`, `Secuencial, ${b100!.personas} personas, perfil base`, b100!, true, 1),
      secuencial(`S-B${b200.personas}`, `Secuencial, ${b200.personas} personas, perfil base`, b200, true, 1),
      secuencial(`S-B${b200.personas}-sin`, `Secuencial, ${b200.personas} personas, perfil base, sin instrumentación (ni en la aplicación ni en el servidor)`, b200, false, 1),
      secuencial(`S-H${historia.personas}`, `Secuencial, ${historia.personas} personas, perfil con historia`, historia, true, 1),
      { id: `A-B${b200.personas}`, descripcion: `Apertura completa (todas las páginas con el cursor), ${b200.personas} personas, perfil base`, modo: 'apertura', carteras: [b200], instrumentada: true, repeticion: 1 },
      { id: `A-H${historia.personas}`, descripcion: `Apertura completa (todas las páginas con el cursor), ${historia.personas} personas, perfil con historia`, modo: 'apertura', carteras: [historia], instrumentada: true, repeticion: 1 },
      ...niveles.map((n) => concurrente(n, 1)),
      ...[...niveles].reverse().map((n) => concurrente(n, 2)),
      secuencial(`S-B${b200.personas}-sin`, `Secuencial, ${b200.personas} personas, perfil base, sin instrumentación (ni en la aplicación ni en el servidor)`, b200, false, 2),
      secuencial(`S-B${b200.personas}`, `Secuencial, ${b200.personas} personas, perfil base`, b200, true, 2),
      secuencial(`S-H${historia.personas}`, `Secuencial, ${historia.personas} personas, perfil con historia`, historia, true, 2),
      secuencial(`S-B${b100!.personas}`, `Secuencial, ${b100!.personas} personas, perfil base`, b100!, true, 2),
      secuencial(`S-B${b50!.personas}`, `Secuencial, ${b50!.personas} personas, perfil base`, b50!, true, 2),
    ];
    for (const [k, lote] of lotes.entries()) {
      guardarEstado({ etapa: 'lotes', lote: `${k + 1} de ${lotes.length}`, escenario: lote.id, repeticion: lote.repeticion });
      await correrLote(lote);
    }

    // 5. Las filas de decisión de cada pedido, por su request_id (después de medir: estas lecturas no entran en ningún lote).
    guardarEstado({ etapa: 'filas de decisión' });
    instrumentacion.desactivar();
    await intentar([], 'estadísticas encendidas al final', () => monitor.estadisticas(true));
    const filas = await prisma.$queryRawUnsafe<{ request_id: string | null; actor: string; filas: number; permitidas: number; sujetos: number; alcances: number }[]>(
      `SELECT "request_id", "actor_id"::text AS actor, count(*)::float8 AS filas, count(*) FILTER (WHERE "resultado" = 'PERMITIDA')::float8 AS permitidas,
              count(DISTINCT "sujeto_id")::float8 AS sujetos, count(DISTINCT "alcance")::float8 AS alcances
         FROM "decision_de_acceso" WHERE "secuencia" > $1::bigint GROUP BY "request_id", "actor_id"`,
      secuenciaAlEmpezar,
    );
    escribir('filas-de-decision.json', {
      secuenciaAlEmpezar,
      porPedido: Object.fromEntries(filas.filter((f) => f.request_id).map((f) => [f.request_id as string, { actor: f.actor, filas: f.filas, permitidas: f.permitidas, sujetos: f.sujetos, alcances: f.alcances }])),
      sinRequestId: filas.filter((f) => !f.request_id).map((f) => ({ actor: f.actor, filas: f.filas })),
    });
    escribir('consultas.json', await intentar([], 'textos', () => monitor.textos()));
    poblacion.totalesDeLaBaseAlTerminar = await totalesDeLaBase(prisma);
    escribir('poblacion.json', poblacion);
    const conexiones = await intentar([], 'conexiones', () => monitor.actividad());
    entorno.conexionesDeLaApiAlTerminar = conexiones ? conexiones.filter((f) => f.app === APP_DE_LA_API).length : null;
    entorno.conexionesDelArnesAlTerminar = conexiones ? conexiones.filter((f) => f.app.startsWith(APP_DEL_ARNES)).length : null;
    entorno.memoriaLibreGbAlTerminar = r2(freemem() / 1024 ** 3);
    entorno.minutos = Math.round((Date.now() - comienzo) / 60_000);
    escribir('entorno.json', entorno);
    guardarEstado({ etapa: 'terminado', minutos: entorno.minutos });

    // Lo único que se afirma es que la medición llegó al final; los números se leen, no se aprueban.
    expect(numeroDeLote).toBe(lotes.length);
  }, 4 * 3_600_000);
});
